"""Turn public-domain portrait photos into 96x120 pixel-art dialogue portraits.

Usage: python dev/pixelize.py   (reads assets/portraits/src/*.img, writes assets/portraits/<id>.png + dev/portraits-sheet.png)
Pipeline: face detect (OpenCV Haar) -> head-and-shoulders crop -> 96x120 -> contrast (CLAHE) ->
luminance mapped onto an era colour ramp with 4x4 Bayer dithering.
"""
import pathlib
import cv2
import numpy as np
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC, OUT = ROOT / 'assets/portraits/src', ROOT / 'assets/portraits'
W, H = 96, 120
BAYER = np.array([[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]]) / 16.0

# dark -> light colour ramps (era moods): warm sepia 1880s, rose dusk 1900-1920s, cold indigo 1930-40s
RAMPS = {
    'warm': ['#120b14', '#2a1a22', '#4a2c2c', '#74463a', '#9e6a4e', '#c49270', '#e2bc96', '#f6e2c4'],
    'rose': ['#100c1a', '#261a30', '#46304a', '#6e4a5c', '#986a6e', '#c09486', '#e0bea6', '#f8e6d2'],
    'cold': ['#0a0c16', '#161c2e', '#26304a', '#3e4a66', '#5e6a84', '#8892a6', '#b8bcc8', '#e8e6e2'],
}
ERA = {  # id -> ramp; manual crop override (x, y, w, h in source px) when face detection fails
    'allen': 'warm', 'underwood': 'warm', 'appenzeller': 'warm', 'min_yeongik': 'warm', 'gojong': 'warm', 'lillias': 'warm',
    'underwood_old': 'rose', 'avison': 'rose', 'severance': 'rose', 'park_seoyang': 'rose', 'kim_pilsun': 'rose',
    'choi': 'cold', 'jeong_inbo': 'cold', 'baek_nakjun': 'cold', 'baek_namun': 'cold', 'yun': 'cold',
}
CROP = {'baek_nakjun': (0, 10, 500, 625), 'allen': (20, 30, 320, 400)}  # manual fixes after eyeballing the sheet

# OpenCV can't open non-ASCII paths on Windows, so load the cascade from a temp copy
import shutil, tempfile
_tmp = pathlib.Path(tempfile.gettempdir()) / 'yonsei_haar_face.xml'
shutil.copy(ROOT / 'dev/haarcascade_frontalface_default.xml', _tmp)
cascade = cv2.CascadeClassifier(str(_tmp))


def hex2rgb(h):
    return [int(h[i:i + 2], 16) for i in (1, 3, 5)]


def crop_box(gray, pid):
    if pid in CROP:
        return CROP[pid]
    ih, iw = gray.shape
    faces = cascade.detectMultiScale(gray, 1.08, 5, minSize=(max(24, iw // 12),) * 2)
    if len(faces):
        x, y, w, h = max(faces, key=lambda f: f[2] * f[3])
        cw = w * 2.3
        ch = cw * H / W
        cx, cy = x + w / 2, y + h * 0.5 + ch * 0.08  # face sits in the upper-middle of the frame
        x0, y0 = cx - cw / 2, cy - ch * 0.42
    else:  # fallback: upper-centre of the photo
        cw = iw * 0.8
        ch = cw * H / W
        x0, y0 = (iw - cw) / 2, ih * 0.04
    return int(x0), int(y0), int(cw), int(ch)


def pixelize(pid):
    img = cv2.imdecode(np.fromfile(str(SRC / f'{pid}.img'), np.uint8), cv2.IMREAD_COLOR)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    x, y, w, h = crop_box(gray, pid)
    pad = max(w, h)
    big = cv2.copyMakeBorder(gray, pad, pad, pad, pad, cv2.BORDER_REPLICATE)
    face = big[y + pad:y + pad + h, x + pad:x + pad + w]
    small = cv2.resize(face, (W, H), interpolation=cv2.INTER_AREA)
    small = cv2.createCLAHE(clipLimit=2.2, tileGridSize=(3, 3)).apply(small)
    small = cv2.addWeighted(small, 1.5, cv2.GaussianBlur(small, (0, 0), 1.2), -0.5, 0)  # unsharp
    lum = small.astype(float) / 255.0
    ramp = np.array([hex2rgb(c) for c in RAMPS[ERA.get(pid, 'rose')]], float)
    n = len(ramp) - 1
    f = lum * n
    lo = np.clip(np.floor(f).astype(int), 0, n - 1)
    frac = f - lo
    thr = np.tile(BAYER, (H // 4 + 1, W // 4 + 1))[:H, :W]
    idx = np.where(frac > thr, lo + 1, lo)
    rgb = ramp[idx].astype(np.uint8)
    Image.fromarray(rgb).save(OUT / f'{pid}.png')
    return Image.fromarray(rgb), (x, y, w, h)


def main():
    ids = sorted(p.stem for p in SRC.glob('*.img'))
    tiles = []
    for pid in ids:
        im, box = pixelize(pid)
        print(pid, box)
        tiles.append(im.resize((W * 2, H * 2), Image.NEAREST))
    cols = 6
    sheet = Image.new('RGB', (cols * W * 2, ((len(tiles) + cols - 1) // cols) * H * 2), '#000')
    for i, t in enumerate(tiles):
        sheet.paste(t, ((i % cols) * W * 2, (i // cols) * H * 2))
    sheet.save(ROOT / 'dev/portraits-sheet.png')
    print('order:', ids)


if __name__ == '__main__':
    main()
