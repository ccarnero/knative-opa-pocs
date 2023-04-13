import os
import time
import requests

target = os.getenv("TARGET")
if not target:
    raise ValueError("missing environment variable TARGET")
print(f"target: {target}")

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
