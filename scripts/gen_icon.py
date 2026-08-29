"""Generate Somus Play Store and Android launcher icons from icon-master.png.

The master is the approved near-black/warm-charcoal square artwork with the
amber Somus mark. Google Play receives an opaque 512 px square. Android's
adaptive icon uses the extracted amber mark as foreground and a native
near-black gradient drawable as background.
"""

from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
MASTER = ROOT / "play-store" / "icon-master.png"
STORE = ROOT / "play-store" / "icon-512.png"
RES = ROOT / "android" / "app" / "src" / "main" / "res"

LEGACY = {"mdpi": 48, "hdpi": 72, "xhdpi": 96, "xxhdpi": 144, "xxxhdpi": 192}
ADAPTIVE = {"mdpi": 108, "hdpi": 162, "xhdpi": 216, "xxhdpi": 324, "xxxhdpi": 432}


def extract_foreground(master: Image.Image) -> Image.Image:
    """Extract the amber artwork and rebuild clean anti-aliased edges."""
    rgb = np.asarray(master.convert("RGB"), dtype=np.int16)
    chroma = rgb[:, :, 0] - rgb[:, :, 2]
    # Chroma separates amber from neutrals; green/red brightness gates prevent
    # the subtly warm charcoal background from leaking into the foreground.
    by_chroma = (chroma - 20) * 5
    by_green = (rgb[:, :, 1] - 72) * 4
    by_red = (rgb[:, :, 0] - 105) * 3
    alpha = np.clip(np.minimum.reduce((by_chroma, by_green, by_red)), 0, 255).astype(np.uint8)

    h, w = alpha.shape
    yy, xx = np.mgrid[0:h, 0:w]
    t = np.clip((xx + yy) / float(w + h), 0.0, 1.0)[..., None]
    start = np.array([255, 224, 122], dtype=np.float32)
    end = np.array([239, 179, 61], dtype=np.float32)
    amber = (start * (1.0 - t) + end * t).astype(np.uint8)
    rgba = np.dstack((amber, alpha))
    return Image.fromarray(rgba, "RGBA")


def adaptive_foreground(layer: Image.Image, size: int) -> Image.Image:
    """Fit the mark into Android's adaptive-icon safe zone."""
    bbox = layer.getchannel("A").getbbox()
    if bbox is None:
        raise RuntimeError("No amber foreground detected in icon master")
    mark = layer.crop(bbox)
    target = int(size * 0.62)
    scale = min(target / mark.width, target / mark.height)
    fitted = mark.resize(
        (max(1, round(mark.width * scale)), max(1, round(mark.height * scale))),
        Image.Resampling.LANCZOS,
    )
    out = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    out.alpha_composite(fitted, ((size - fitted.width) // 2, (size - fitted.height) // 2))
    return out


def round_legacy(icon: Image.Image) -> Image.Image:
    mask = Image.new("L", icon.size, 0)
    ImageDraw.Draw(mask).ellipse((0, 0, icon.width - 1, icon.height - 1), fill=255)
    out = icon.convert("RGBA")
    out.putalpha(mask)
    return out


def main() -> None:
    master = Image.open(MASTER).convert("RGB")
    if master.width != master.height:
        raise ValueError(f"Icon master must be square, got {master.size}")

    STORE.parent.mkdir(parents=True, exist_ok=True)
    master.resize((512, 512), Image.Resampling.LANCZOS).save(
        STORE, format="PNG", optimize=True
    )
    print(f"wrote {STORE.relative_to(ROOT)} (512x512 RGB)")

    foreground = extract_foreground(master)
    for density, legacy_px in LEGACY.items():
        directory = RES / f"mipmap-{density}"
        directory.mkdir(parents=True, exist_ok=True)

        legacy = master.resize((legacy_px, legacy_px), Image.Resampling.LANCZOS)
        legacy.save(directory / "ic_launcher.png", format="PNG", optimize=True)
        round_legacy(legacy).save(
            directory / "ic_launcher_round.png", format="PNG", optimize=True
        )
        adaptive_foreground(foreground, ADAPTIVE[density]).save(
            directory / "ic_launcher_foreground.png", format="PNG", optimize=True
        )
        print(
            f"wrote mipmap-{density}: {legacy_px}px legacy, "
            f"{ADAPTIVE[density]}px adaptive foreground"
        )


if __name__ == "__main__":
    main()
