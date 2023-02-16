import os
import requests
import json
from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route('/', methods=['GET'])
def hello_world():
    target = os.environ.get('TARGET', 'World')
    redirect_to = request.headers.get('redirect-to')
    if redirect_to:
        try:
            response = requests.get(redirect_to)
            if response.status_code == 200:
                return response.text
            else:
                error_response = {
                    "error": "Request to {} failed with status code {}".format(redirect_to, response.status_code),
                    "status_code": response.status_code
                }
                return jsonify(error_response), response.status_code
        except requests.exceptions.RequestException as e:
            error_response = {
                "error": str(e),
                "status_code": 500
            }
            return jsonify(error_response), 500
    else:
        return 'Hello {}!\n'.format(target)

@app.route('/healthz', methods=['GET'])
def healthz():
    return 'ok'

if __name__ == "__main__":
    app.run(debug=True,host='0.0.0.0',port=int(os.environ.get('PORT', 8080)))
