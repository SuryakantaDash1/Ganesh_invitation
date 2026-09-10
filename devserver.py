#!/usr/bin/env python3
"""Static dev server that never lets the browser cache a response.

`python3 -m http.server` sends Last-Modified and no Cache-Control, so browsers
serve edited CSS/JS from cache until a hard reload - and worse, a file restored
with an older mtime (an `mv` that preserves timestamps) loses the revalidation
race and the stale copy sticks. Serving no-store sidesteps both.
"""
import sys
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer


class NoCacheHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, must-revalidate')
        self.send_header('Expires', '0')
        super().end_headers()

    def send_header(self, keyword, value):
        if keyword == 'Last-Modified':      # nothing to revalidate against
            return
        super().send_header(keyword, value)


if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8765
    handler = partial(NoCacheHandler, directory='.')
    print(f'serving . on http://localhost:{port} (no-store)', flush=True)
    ThreadingHTTPServer(('', port), handler).serve_forever()
