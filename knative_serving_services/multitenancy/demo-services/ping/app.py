import os
import time
import requests
import logging
import http.server
import socketserver


target = os.getenv("TARGET")
if not target:
    raise ValueError("missing environment variable TARGET")
print(f"target: {target}")

class Handler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/healtz':
            self.send_response(200)
            self.end_headers()
            return
        # else:
        #     logging.info("ping")
        #     self.send_response(200)
        #     self.end_headers()

if __name__ == "__main__":
    while True:
        try:
            resp = requests.get(target, timeout=2)
            if resp.status_code == 200:
                print("ping succeeded")
            else:
                payload = resp.content
                print(f"ping failed: {payload.decode()} (code: {resp.status_code})")
        except requests.exceptions.RequestException as e:
            print(f"ping failed: {e}")
        time.sleep(2)
