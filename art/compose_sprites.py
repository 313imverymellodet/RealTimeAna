"""Packs the frames from build_sprites.py into the sprite sheets the app loads.

    python3 art/compose_sprites.py /tmp/frames

reader-<channel>.webp  8 frames across; rows: up, right, down, left
usher.webp             8 frames across; rows: idle, wave
"""

import os
import sys

from PIL import Image

FRAMES = 8
SIZE = 96
CHANNELS = ["search", "social", "newsletter", "paid", "referral", "direct"]
OUT = os.path.join(os.path.dirname(__file__), "..", "public", "sprites")


def sheet(frames_dir, rows):
    image = Image.new("RGBA", (FRAMES * SIZE, len(rows) * SIZE), (0, 0, 0, 0))
    for row, names in enumerate(rows):
        for column, name in enumerate(names):
            frame = Image.open(os.path.join(frames_dir, name)).convert("RGBA")
            image.alpha_composite(frame, (column * SIZE, row * SIZE))
    return image


def save(image, name):
    path = os.path.join(OUT, name)
    image.save(path, "WEBP", quality=88, method=6, alpha_quality=95)
    print(f"{name}: {image.width}x{image.height}, {os.path.getsize(path) // 1024} KB")


def main():
    frames_dir = sys.argv[1]
    os.makedirs(OUT, exist_ok=True)
    for channel in CHANNELS:
        rows = [[f"reader-{channel}-{d}-{i}.png" for i in range(FRAMES)] for d in ("up", "right", "down", "left")]
        save(sheet(frames_dir, rows), f"reader-{channel}.webp")
    rows = [[f"usher-{clip}-{i}.png" for i in range(FRAMES)] for clip in ("idle", "wave")]
    save(sheet(frames_dir, rows), "usher.webp")


main()
