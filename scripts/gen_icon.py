"""Generate the full Somus app-icon set from the brand mark:
Fraunces serif 's' in amber #FFCD5B on near-black #0a0a0c (variant A).

Outputs:
  play-store/icon-512.png            store listing icon (opaque, no alpha)
  res/mipmap-*/ic_launcher.png       legacy launcher (opaque square)
  res/mipmap-*/ic_launcher_round.png legacy round launcher (circle-masked)
  res/mipmap-*/ic_launcher_foreground.png  adaptive foreground (transparent)
  (adaptive XML + background color are written by the caller / committed separately)
"""
from PIL import Image, ImageDraw, ImageFont
import os

FONT = "android/app/src/main/assets/fonts/Fraunces-Regular.ttf"
RES = "android/app/src/main/res"
BG = (10, 10, 12, 255)      # #0a0a0c
AMBER = (255, 205, 91, 255)  # #FFCD5B

# density -> legacy launcher px (mdpi=48 baseline)
LEGACY = {"mdpi": 48, "hdpi": 72, "xhdpi": 96, "xxhdpi": 144, "xxxhdpi": 192}
# adaptive foreground is 108dp; per-density px
ADAPT = {"mdpi": 108, "hdpi": 162, "xhdpi": 216, "xxhdpi": 324, "xxxhdpi": 432}


def fit_font(size_px, target_frac):
    """Pick a Fraunces size so glyph 's' height ~= target_frac * canvas."""
    target = size_px * target_frac
    fs = int(target * 1.4)
    while fs > 8:
        f = ImageFont.truetype(FONT, fs)
        l, t, r, b = f.getbbox("s")
        if (b - t) <= target:
            return f, (l, t, r, b)
        fs -= 2
    f = ImageFont.truetype(FONT, 8)
    return f, f.getbbox("s")


def draw_s(img, glyph_frac, dy_frac=0.0):
    S = img.size[0]
    d = ImageDraw.Draw(img)
    f, (l, t, r, b) = fit_font(S, glyph_frac)
    w, h = r - l, b - t
    x = (S - w) / 2 - l
    y = (S - h) / 2 - t + dy_frac * S
    d.text((x, y), "s", font=f, fill=AMBER)
    return d


def square(size, glyph_frac=0.45):
    img = Image.new("RGBA", (size, size), BG)
    draw_s(img, glyph_frac)
    return img


def rounded(size, glyph_frac=0.45, radius_frac=0.22):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([0, 0, size - 1, size - 1], radius=int(size * radius_frac), fill=BG)
    draw_s(img, glyph_frac)
    return img


def circle(size, glyph_frac=0.45):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.ellipse([0, 0, size - 1, size - 1], fill=BG)
    draw_s(img, glyph_frac)
    return img


def foreground(size):
    # Transparent bg; 's' scaled into the adaptive safe zone (~52% so it
    # survives circle/squircle masking). Slightly smaller than legacy.
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw_s(img, glyph_frac=0.38)
    return img


def main():
    # 512 store icon: OPAQUE, no alpha (Play requirement) -> flatten to RGB
    store = square(512, glyph_frac=0.45).convert("RGB")
    os.makedirs("play-store", exist_ok=True)
    store.save("play-store/icon-512.png")
    print("wrote play-store/icon-512.png")

    for dens, px in LEGACY.items():
        d = os.path.join(RES, f"mipmap-{dens}")
        os.makedirs(d, exist_ok=True)
        rounded(px).save(os.path.join(d, "ic_launcher.png"))
        circle(px).save(os.path.join(d, "ic_launcher_round.png"))
        foreground(ADAPT[dens]).save(os.path.join(d, "ic_launcher_foreground.png"))
        print("wrote", d, f"({px}px legacy, {ADAPT[dens]}px fg)")


if __name__ == "__main__":
    main()
