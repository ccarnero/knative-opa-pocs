import logging
import http.server
import socketserver

class Handler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/healtz':
            self.send_response(200)
            self.end_headers()
            return
        else:
            logging.info("pong")
            self.send_response(200)
            self.end_headers()

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    with socketserver.TCPServer(("", 8080), Handler) as httpd:
        logging.info("now listening on port 8080")
        httpd.serve_forever()
