# Device heartbeat (Raspberry Pi / player app)

Devices report their status by POSTing a heartbeat to the admin app. The endpoint is **unauthenticated** (no device key). Keep the payload small.

## Endpoint

- **URL:** `POST https://your-app.vercel.app/api/device/heartbeat` (or your deployed base URL)
- **Content-Type:** `application/json`
- **Body (max 2KB):**
  ```json
  {
    "device_id": "<uuid-from-dashboard>",
    "player_version": "1.0.0",
    "last_error": ""
  }
  ```
  - `device_id` (required): UUID of the device (from dashboard when you created the device).
  - `player_version` (optional): Your player app version.
  - `last_error` (optional): Last error message to show in dashboard (e.g. playback failure).

**Response:** `200` with `{ "ok": true }` on success. `404` if device not found or inactive. `400` for invalid payload.

## Recommended device-side behavior

- **Interval:** Send a heartbeat every **10 minutes** plus a **random jitter of 0–120 seconds** to avoid thundering herd with large fleets (e.g. 20,000 devices).
- **On boot:** Wait a **random 0–60 seconds** before sending the first heartbeat.
- **On failure:** Retry with **exponential backoff** (e.g. 1 min, 2 min, 4 min, then cap at 10 min) until success.

### Example (pseudo-code for Raspberry Pi / Node or Python)

```javascript
// Node.js example (conceptual)
const DEVICE_ID = process.env.DEVICE_ID; // UUID from dashboard
const HEARTBEAT_URL = process.env.HEARTBEAT_URL || 'https://your-app.vercel.app/api/device/heartbeat';
const BASE_INTERVAL_MS = 10 * 60 * 1000;   // 10 minutes
const JITTER_MS = 120 * 1000;               // 0–120 seconds
const BOOT_DELAY_MS = 60 * 1000;            // 0–60 seconds

function jitter(maxMs) {
  return Math.floor(Math.random() * (maxMs + 1));
}

async function sendHeartbeat(playerVersion = '1.0.0', lastError = '') {
  const res = await fetch(HEARTBEAT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      device_id: DEVICE_ID,
      player_version: playerVersion,
      ...(lastError && { last_error: lastError }),
    }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function runWithBackoff(fn, maxRetries = 5) {
  let delay = 60 * 1000; // 1 min
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (e) {
      if (i === maxRetries - 1) throw e;
      await new Promise(r => setTimeout(r, delay));
      delay = Math.min(delay * 2, 10 * 60 * 1000); // cap 10 min
    }
  }
}

async function startHeartbeat() {
  // On boot: wait random 0–60s before first heartbeat
  await new Promise(r => setTimeout(r, jitter(BOOT_DELAY_MS)));

  const scheduleNext = () => {
    const interval = BASE_INTERVAL_MS + jitter(JITTER_MS);
    setTimeout(async () => {
      await runWithBackoff(() => sendHeartbeat());
      scheduleNext();
    }, interval);
  };

  await runWithBackoff(() => sendHeartbeat());
  scheduleNext();
}

startHeartbeat();
```

### Python (conceptual)

```python
import os, time, random, json, urllib.request

DEVICE_ID = os.environ["DEVICE_ID"]
HEARTBEAT_URL = os.environ.get("HEARTBEAT_URL", "https://your-app.vercel.app/api/device/heartbeat")
BASE_INTERVAL = 10 * 60  # 10 minutes
JITTER = 120             # 0-120 seconds
BOOT_DELAY = 60          # 0-60 seconds

def send_heartbeat(player_version="1.0.0", last_error=""):
    body = json.dumps({"device_id": DEVICE_ID, "player_version": player_version, **({"last_error": last_error} if last_error else {})}).encode()
    req = urllib.request.Request(HEARTBEAT_URL, data=body, method="POST", headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read())

def run_with_backoff(fn, max_retries=5):
    delay = 60
    for i in range(max_retries):
        try:
            return fn()
        except Exception:
            if i == max_retries - 1: raise
            time.sleep(delay)
            delay = min(delay * 2, 10 * 60)

def start_heartbeat():
    time.sleep(random.randint(0, BOOT_DELAY))
    while True:
        run_with_backoff(lambda: send_heartbeat())
        time.sleep(BASE_INTERVAL + random.randint(0, JITTER))
```

## Dashboard behavior

- **Online:** device is **active** and `last_seen_at` is within the last **12 minutes**.
- **Offline:** device is active but last heartbeat was more than 12 minutes ago (or never).
- **Inactive:** device has been deactivated in the dashboard (no heartbeats accepted).

The dashboard shows offline devices first in the list and supports filters: All / Online / Offline / Inactive.
