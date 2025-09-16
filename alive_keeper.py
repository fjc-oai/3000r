import os
import sys
import urllib.request

URL = os.environ.get("KEEPALIVE_URL", "https://three000r-web.onrender.com/api/healthz")
try:
    with urllib.request.urlopen(URL, timeout=10) as r:
        # Exit nonzero if not 200 so the job shows as failed in logs
        sys.exit(0 if r.status == 200 else 1)
except Exception as e:
    print(f"Ping failed: {e}", file=sys.stderr)
    sys.exit(1)