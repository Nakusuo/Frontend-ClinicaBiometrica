import urllib.request
import os

files = [
    "tiny_face_detector_model-weights_manifest.json",
    "tiny_face_detector_model-shard1",
    "face_landmark_68_model-weights_manifest.json",
    "face_landmark_68_model-shard1",
    "face_recognition_model-weights_manifest.json",
    "face_recognition_model-shard1"
]

base_url = "https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/"
output_dir = "src/assets/models"

os.makedirs(output_dir, exist_ok=True)

print("Starting models download...")
for f in files:
    url = base_url + f
    dest = os.path.join(output_dir, f)
    print(f"Downloading {url} -> {dest} ...")
    try:
        urllib.request.urlretrieve(url, dest)
        print(f"  Successfully downloaded {f}")
    except Exception as e:
        print(f"  Error downloading {f}: {e}")

print("Download complete.")
