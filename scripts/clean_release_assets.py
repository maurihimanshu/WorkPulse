import os
import sys
import json
import urllib.request
import urllib.error

def clean_release_assets(repo: str, tag: str):
    token = os.environ.get("GITHUB_TOKEN")
    if not token:
        print("[WARN] GITHUB_TOKEN not set, skipping remote asset cleanup.")
        return

    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "WorkPulse-Release-Cleaner"
    }

    url = f"https://api.github.com/repos/{repo}/releases/tags/{tag}"
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req) as resp:
            data = json.load(resp)
    except urllib.error.HTTPError as e:
        print(f"[INFO] Release tag {tag} does not exist yet ({e.code}). Skipping cleanup.")
        return
    except Exception as e:
        print(f"[WARN] Failed to fetch release {tag}: {e}")
        return

    assets = data.get("assets", [])
    for asset in assets:
        name = asset.get("name", "")
        asset_id = asset.get("id")
        # Remove loose .exe files that are not the Setup installer
        if name.endswith(".exe") and not name.endswith("-Setup.exe"):
            print(f"[INFO] Deleting obsolete asset: {name} (ID: {asset_id})...")
            del_url = f"https://api.github.com/repos/{repo}/releases/assets/{asset_id}"
            del_req = urllib.request.Request(del_url, headers=headers, method="DELETE")
            try:
                with urllib.request.urlopen(del_req) as del_resp:
                    print(f"[SUCCESS] Deleted obsolete asset {name} (status {del_resp.status}).")
            except Exception as e:
                print(f"[ERROR] Could not delete asset {name}: {e}")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python clean_release_assets.py <owner/repo> <tag>")
        sys.exit(0)
    clean_release_assets(sys.argv[1], sys.argv[2])
