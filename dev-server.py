#!/usr/bin/env python3
"""Serveur de dev local : sert les fichiers statiques du repo (comme
`python -m http.server`) et émule, sous /__dev_drive__/, le sous-ensemble de
l'API Google Drive v3 utilisé par js/drive.js — pour pouvoir tester le mode
« test local » (voir js/auth.js, isDevLocalMode) sans compte Google.

Les données sont stockées dans .devdrive/ (gitignoré, jamais poussé). Les ids
renvoyés sont des UUID stables, indépendants du chemin sur disque (comme les
vrais ids Drive), pour que les renommages/déplacements ne les invalident pas.
Usage : python dev-server.py [port]  (8080 par défaut)
"""
import http.server
import json
import os
import re
import shutil
import sys
import urllib.parse
import uuid

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(ROOT_DIR, '.devdrive')
INDEX_PATH = os.path.join(DATA_DIR, '.index.json')
API_PREFIX = '/__dev_drive__'
FOLDER_MIME_TYPE = 'application/vnd.google-apps.folder'


def load_index():
    if not os.path.exists(INDEX_PATH):
        return {}
    with open(INDEX_PATH, 'r', encoding='utf-8') as f:
        return json.load(f)


def save_index(index):
    os.makedirs(DATA_DIR, exist_ok=True)
    with open(INDEX_PATH, 'w', encoding='utf-8') as f:
        json.dump(index, f, ensure_ascii=False, indent=2)


def disk_path(entry):
    return os.path.join(DATA_DIR, entry['path'])


def safe_name(name):
    """Rejette un nom de fichier/dossier qui tenterait de sortir de DATA_DIR
    (ex. '../../etc/passwd') : les noms viennent de l'app mais peuvent être
    tapés librement par l'utilisateur (nom de dashboard, de partage...)."""
    if not name or '/' in name or '\\' in name or name in ('.', '..'):
        raise ApiError(400, 'Nom de fichier invalide : ' + repr(name))
    return name


def children_of(index, parent_id):
    return {fid: e for fid, e in index.items() if e.get('parentId') == parent_id}


def find_child_by_name(index, parent_id, name, mime_type=None):
    for fid, e in children_of(index, parent_id).items():
        if e['name'] != name:
            continue
        if mime_type == FOLDER_MIME_TYPE and e['type'] != 'folder':
            continue
        if mime_type and mime_type != FOLDER_MIME_TYPE and e['type'] == 'folder':
            continue
        return fid, e
    return None, None


def parse_query_clause(q):
    """Extrait name/mimeType/parent des quelques formes de `q` utilisées par drive.js."""
    name_match = re.search(r"name='((?:[^'\\]|\\.)*)'", q)
    mime_match = re.search(r"mimeType='([^']*)'", q)
    parent_match = re.search(r"'((?:[^'\\]|\\.)*)' in parents", q)
    name = name_match.group(1).replace("\\'", "'") if name_match else None
    parent_id = parent_match.group(1).replace("\\'", "'") if parent_match else None
    return name, mime_match.group(1) if mime_match else None, parent_id


class DevDriveHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT_DIR, **kwargs)

    def log_message(self, format, *args):
        if self.path.startswith(API_PREFIX):
            print(f'[dev-drive] {self.command} {self.path}')
        else:
            super().log_message(format, *args)

    # --- dispatch ---

    def do_GET(self):
        if self.path.startswith(API_PREFIX):
            return self.handle_api()
        return super().do_GET()

    def do_POST(self):
        if self.path.startswith(API_PREFIX):
            return self.handle_api()
        self.send_error(405)

    def do_PATCH(self):
        if self.path.startswith(API_PREFIX):
            return self.handle_api()
        self.send_error(405)

    def do_DELETE(self):
        if self.path.startswith(API_PREFIX):
            return self.handle_api()
        self.send_error(405)

    def handle_api(self):
        try:
            self._handle_api()
        except ApiError as e:
            self._send_json(e.status, {'error': {'message': str(e)}})
        except Exception as e:  # garde-fou : jamais de 500 muet pendant un test
            self._send_json(500, {'error': {'message': f'{type(e).__name__}: {e}'}})

    # --- helpers ---

    def _send_json(self, status, payload):
        body = json.dumps(payload).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _send_bytes(self, status, data, content_type='application/octet-stream'):
        self.send_response(status)
        self.send_header('Content-Type', content_type)
        self.send_header('Content-Length', str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def _read_body(self):
        length = int(self.headers.get('Content-Length', 0))
        return self.rfile.read(length) if length else b''

    def _handle_api(self):
        parsed = urllib.parse.urlparse(self.path)
        rest = parsed.path[len(API_PREFIX):]  # ex: /files, /files/<id>, /upload/files, /about
        params = urllib.parse.parse_qs(parsed.query)
        index = load_index()

        if rest == '/about':
            return self._send_json(200, {'user': {'displayName': 'Test local', 'emailAddress': 'test-local@localhost'}})

        if rest == '/files':
            if self.command == 'GET':
                return self._search(index, params)
            if self.command == 'POST':
                return self._create_metadata_item(index)
            raise ApiError(405, 'Méthode non supportée sur /files')

        if rest == '/upload/files':
            if self.command == 'POST':
                return self._upload_create(index, params)
            raise ApiError(405, 'Méthode non supportée sur /upload/files')

        if rest.startswith('/upload/files/'):
            file_id = urllib.parse.unquote(rest[len('/upload/files/'):])
            if self.command == 'PATCH':
                return self._upload_update(index, file_id)
            raise ApiError(405, 'Méthode non supportée sur /upload/files/<id>')

        if rest.startswith('/files/'):
            raw = rest[len('/files/'):]
            if '/permissions' in raw:
                file_id_enc, _, perm_part = raw.partition('/permissions')
                file_id = urllib.parse.unquote(file_id_enc)
                perm_id = urllib.parse.unquote(perm_part[1:]) if perm_part.startswith('/') else None
                return self._handle_permissions(file_id, perm_id)
            file_id = urllib.parse.unquote(raw)
            if self.command == 'GET':
                return self._get_file(index, file_id, params)
            if self.command == 'PATCH':
                return self._patch_file(index, file_id, params)
            if self.command == 'DELETE':
                return self._delete_file(index, file_id)
            raise ApiError(405, 'Méthode non supportée sur /files/<id>')

        raise ApiError(404, f'Route inconnue : {rest}')

    # --- search & metadata ---

    def _search(self, index, params):
        q = params.get('q', [''])[0]
        name, mime_type, parent_id = parse_query_clause(q)
        if parent_id == 'root':
            parent_id = ''
        results = []
        if parent_id is not None:
            for fid, e in children_of(index, parent_id).items():
                if name is not None and e['name'] != name:
                    continue
                if mime_type == FOLDER_MIME_TYPE and e['type'] != 'folder':
                    continue
                results.append({'id': fid, 'name': e['name']})
        elif name is not None:
            # Recherche sans parent (migration legacy) : balaie tout l'index.
            for fid, e in index.items():
                if e['name'] == name:
                    results.append({'id': fid, 'name': e['name']})
        return self._send_json(200, {'files': results})

    def _create_metadata_item(self, index):
        body = json.loads(self._read_body() or b'{}')
        name = safe_name(body['name'])
        mime_type = body.get('mimeType', 'application/octet-stream')
        parents = body.get('parents') or ['']
        parent_id = parents[0]
        is_folder = mime_type == FOLDER_MIME_TYPE
        file_id = uuid.uuid4().hex
        parent_path = index[parent_id]['path'] if parent_id else ''
        rel_path = os.path.join(parent_path, name) if parent_path else name
        index[file_id] = {'name': name, 'type': 'folder' if is_folder else 'file', 'path': rel_path, 'parentId': parent_id}
        if is_folder:
            os.makedirs(os.path.join(DATA_DIR, rel_path), exist_ok=True)
        else:
            # Raccourci (partage reçu) ou autre item metadata-only : stocké comme
            # petit fichier JSON, pas lu via alt=media dans les flux testés ici.
            full = os.path.join(DATA_DIR, rel_path)
            os.makedirs(os.path.dirname(full), exist_ok=True)
            with open(full, 'w', encoding='utf-8') as f:
                json.dump({'__metadata__': body}, f)
        save_index(index)
        return self._send_json(200, {'id': file_id})

    def _get_file(self, index, file_id, params):
        entry = index.get(file_id)
        if not entry:
            raise ApiError(404, 'Fichier introuvable : ' + file_id)
        if 'alt' in params and params['alt'][0] == 'media':
            full = disk_path(entry)
            if not os.path.exists(full):
                raise ApiError(404, 'Contenu introuvable : ' + file_id)
            with open(full, 'rb') as f:
                return self._send_bytes(200, f.read())
        return self._send_json(200, {'id': file_id, 'name': entry['name'], 'trashed': False})

    def _patch_file(self, index, file_id, params):
        entry = index.get(file_id)
        if not entry:
            raise ApiError(404, 'Fichier introuvable : ' + file_id)
        if 'addParents' in params:
            new_parent = params['addParents'][0]
            new_parent_path = index[new_parent]['path'] if new_parent else ''
            old_full = disk_path(entry)
            new_rel = os.path.join(new_parent_path, entry['name']) if new_parent_path else entry['name']
            new_full = os.path.join(DATA_DIR, new_rel)
            os.makedirs(os.path.dirname(new_full) or DATA_DIR, exist_ok=True)
            if os.path.exists(old_full):
                shutil.move(old_full, new_full)
            entry['path'] = new_rel
            entry['parentId'] = new_parent
            save_index(index)
            return self._send_json(200, {'id': file_id})
        body = json.loads(self._read_body() or b'{}')
        if 'name' in body:
            new_name = safe_name(body['name'])
            parent_path = index[entry['parentId']]['path'] if entry.get('parentId') else ''
            new_rel = os.path.join(parent_path, new_name) if parent_path else new_name
            old_full = disk_path(entry)
            new_full = os.path.join(DATA_DIR, new_rel)
            if os.path.exists(old_full):
                os.makedirs(os.path.dirname(new_full) or DATA_DIR, exist_ok=True)
                shutil.move(old_full, new_full)
            entry['name'] = new_name
            entry['path'] = new_rel
            # Les sous-chemins indexés (enfants d'un dossier renommé) doivent suivre.
            if entry['type'] == 'folder':
                old_prefix = entry['path']
            save_index(index)
            if entry['type'] == 'folder':
                self._reindex_children(index, file_id)
        return self._send_json(200, {'id': file_id})

    def _reindex_children(self, index, folder_id):
        folder_path = index[folder_id]['path']
        changed = False
        for fid, e in index.items():
            if e.get('parentId') == folder_id:
                e['path'] = os.path.join(folder_path, e['name'])
                changed = True
                if e['type'] == 'folder':
                    self._reindex_children(index, fid)
        if changed:
            save_index(index)

    def _delete_file(self, index, file_id):
        entry = index.pop(file_id, None)
        if entry:
            full = disk_path(entry)
            if entry['type'] == 'folder' and os.path.isdir(full):
                shutil.rmtree(full, ignore_errors=True)
            elif os.path.exists(full):
                os.remove(full)
            save_index(index)
        return self._send_json(200, {})

    def _handle_permissions(self, file_id, perm_id):
        # Partage réel non émulé (pas de 2e compte en local) : réponses factices
        # suffisantes pour que l'UI de partage ne plante pas pendant un test.
        if self.command == 'POST':
            return self._send_json(200, {'id': 'local-fake-permission'})
        if self.command == 'DELETE':
            return self._send_json(200, {})
        raise ApiError(405, 'Méthode non supportée sur /permissions')

    # --- upload (multipart / media) ---

    def _upload_create(self, index, params):
        content_type = self.headers.get('Content-Type', '')
        boundary_match = re.search(r'boundary=(.+)$', content_type)
        if not boundary_match:
            raise ApiError(400, 'Upload multipart attendu')
        boundary = boundary_match.group(1).strip('"').encode()
        body = self._read_body()
        parts = self._parse_multipart(body, boundary)
        metadata = json.loads(parts['metadata'])
        file_bytes = parts['file']
        name = safe_name(metadata['name'])
        parents = metadata.get('parents') or ['']
        parent_id = parents[0]
        file_id = uuid.uuid4().hex
        parent_path = index[parent_id]['path'] if parent_id else ''
        rel_path = os.path.join(parent_path, name) if parent_path else name
        full = os.path.join(DATA_DIR, rel_path)
        os.makedirs(os.path.dirname(full) or DATA_DIR, exist_ok=True)
        with open(full, 'wb') as f:
            f.write(file_bytes)
        index[file_id] = {'name': name, 'type': 'file', 'path': rel_path, 'parentId': parent_id}
        save_index(index)
        return self._send_json(200, {'id': file_id})

    def _upload_update(self, index, file_id):
        entry = index.get(file_id)
        if not entry:
            raise ApiError(404, 'Fichier introuvable : ' + file_id)
        body = self._read_body()
        full = disk_path(entry)
        os.makedirs(os.path.dirname(full) or DATA_DIR, exist_ok=True)
        with open(full, 'wb') as f:
            f.write(body)
        return self._send_json(200, {'id': file_id})

    @staticmethod
    def _parse_multipart(body, boundary):
        delimiter = b'--' + boundary
        parts = {}
        for chunk in body.split(delimiter):
            if chunk in (b'', b'--\r\n', b'--'):
                continue
            chunk = chunk.strip(b'\r\n')
            if not chunk:
                continue
            header_blob, _, content = chunk.partition(b'\r\n\r\n')
            name_match = re.search(rb'name="([^"]+)"', header_blob)
            if not name_match:
                continue
            field_name = name_match.group(1).decode()
            parts[field_name] = content
        return parts


class ApiError(Exception):
    def __init__(self, status, message):
        super().__init__(message)
        self.status = status


class ThreadingHTTPServer(http.server.ThreadingHTTPServer):
    daemon_threads = True
    allow_reuse_address = True


def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
    os.makedirs(DATA_DIR, exist_ok=True)
    # 127.0.0.1 plutôt que '' (toutes interfaces) : ce serveur n'a aucune auth et
    # écrit sur disque sur simple requête HTTP, il ne doit jamais être joignable
    # depuis le réseau local.
    server = ThreadingHTTPServer(('127.0.0.1', port), DevDriveHandler)
    print(f'Serveur dev sur http://localhost:{port}  (stockage local : {DATA_DIR})')
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == '__main__':
    main()
