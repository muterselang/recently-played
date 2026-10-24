import { useEffect, useState } from "react";

const FALLBACK = {
  background: "#f4f4f1",
  foreground: "#171717",
};

export default function useDominantColor(imageUrl) {
  const [colors, setColors] = useState(FALLBACK);

  useEffect(() => {
    if (!imageUrl) {
      setColors(FALLBACK);
      return;
    }

    let cancelled = false;
    const image = new Image();

    // Meminta izin akses gambar lintas origin.
    // Kalau server menolak, kita tetap punya fallback.
    image.crossOrigin = "anonymous";

    image.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d", {
          willReadFrequently: true,
        });

        if (!context) throw new Error("Canvas unavailable");

        // Sampel kecil agar prosesnya ringan.
        canvas.width = 32;
        canvas.height = 32;

        context.drawImage(image, 0, 0, 32, 32);

        const pixels = context.getImageData(0, 0, 32, 32).data;

        const buckets = new Map();

        for (let i = 0; i < pixels.length; i += 4) {
          const r = pixels[i];
          const g = pixels[i + 1];
          const b = pixels[i + 2];
          const a = pixels[i + 3];

          if (a < 128) continue;

          // Mengelompokkan warna yang berdekatan.
          const key = [
            Math.floor(r / 8),
            Math.floor(g / 8),
            Math.floor(b / 8),
          ].join(",");

          const bucket = buckets.get(key) || {
            count: 0,
            r: 0,
            g: 0,
            b: 0,
          };

          bucket.count += 1;
          bucket.r += r;
          bucket.g += g;
          bucket.b += b;

          buckets.set(key, bucket);
        }

        let dominant = null;

        for (const bucket of buckets.values()) {
          if (!dominant || bucket.count > dominant.count) {
            dominant = bucket;
          }
        }

        if (!dominant) throw new Error("No color found");

        const r = Math.round(dominant.r / dominant.count);
        const g = Math.round(dominant.g / dominant.count);
        const b = Math.round(dominant.b / dominant.count);

        const background = `rgb(${r}, ${g}, ${b})`;

        // Menentukan warna teks berdasarkan kecerahan background.
        const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;

        const foreground = luminance > 0.58 ? "#171717" : "#ffffff";

        if (!cancelled) {
          setColors({ background, foreground });
        }
      } catch {
        if (!cancelled) setColors(FALLBACK);
      }
    };

    image.onerror = () => {
      if (!cancelled) setColors(FALLBACK);
    };

    const proxyUrl = new URL(
      "https://recently-played.iusefigtotype.workers.dev/image-color"
    );

    proxyUrl.searchParams.set("url", imageUrl);

    image.src = proxyUrl.toString();

    return () => {
      cancelled = true;
      image.onload = null;
      image.onerror = null;
    };
  }, [imageUrl]);

  return colors;
}
