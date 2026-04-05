---
read_when:
    - Mengimplementasikan panel Canvas macOS
    - Menambahkan kontrol agen untuk workspace visual
    - Men-debug pemuatan canvas WKWebView
summary: Panel Canvas yang dikendalikan agen dan disematkan melalui WKWebView + skema URL kustom
title: Canvas
x-i18n:
    generated_at: "2026-04-05T14:00:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: b6c71763d693264d943e570a852208cce69fc469976b2a1cdd9e39e2550534c1
    source_path: platforms/mac/canvas.md
    workflow: 15
---

# Canvas (aplikasi macOS)

Aplikasi macOS menyematkan **panel Canvas** yang dikendalikan agen menggunakan `WKWebView`. Ini
adalah workspace visual ringan untuk HTML/CSS/JS, A2UI, dan permukaan UI
interaktif kecil.

## Lokasi Canvas

State Canvas disimpan di bawah Application Support:

- `~/Library/Application Support/OpenClaw/canvas/<session>/...`

Panel Canvas menyajikan file tersebut melalui **skema URL kustom**:

- `openclaw-canvas://<session>/<path>`

Contoh:

- `openclaw-canvas://main/` → `<canvasRoot>/main/index.html`
- `openclaw-canvas://main/assets/app.css` → `<canvasRoot>/main/assets/app.css`
- `openclaw-canvas://main/widgets/todo/` → `<canvasRoot>/main/widgets/todo/index.html`

Jika tidak ada `index.html` di root, aplikasi menampilkan **halaman scaffold bawaan**.

## Perilaku panel

- Panel tanpa batas, dapat diubah ukurannya, ditambatkan di dekat bilah menu (atau kursor mouse).
- Mengingat ukuran/posisi per sesi.
- Memuat ulang secara otomatis saat file canvas lokal berubah.
- Hanya satu panel Canvas yang terlihat pada satu waktu (sesi diganti sesuai kebutuhan).

Canvas dapat dinonaktifkan dari Settings → **Allow Canvas**. Saat dinonaktifkan, perintah
node canvas mengembalikan `CANVAS_DISABLED`.

## Surface API agen

Canvas diekspos melalui **Gateway WebSocket**, sehingga agen dapat:

- menampilkan/menyembunyikan panel
- menavigasi ke path atau URL
- mengevaluasi JavaScript
- mengambil gambar snapshot

Contoh CLI:

```bash
openclaw nodes canvas present --node <id>
openclaw nodes canvas navigate --node <id> --url "/"
openclaw nodes canvas eval --node <id> --js "document.title"
openclaw nodes canvas snapshot --node <id>
```

Catatan:

- `canvas.navigate` menerima **path canvas lokal**, URL `http(s)`, dan URL `file://`.
- Jika Anda memberikan `"/"`, Canvas menampilkan scaffold lokal atau `index.html`.

## A2UI di Canvas

A2UI di-host oleh host canvas Gateway dan dirender di dalam panel Canvas.
Saat Gateway mengiklankan host Canvas, aplikasi macOS otomatis menavigasi ke
halaman host A2UI saat pertama kali dibuka.

URL host A2UI default:

```
http://<gateway-host>:18789/__openclaw__/a2ui/
```

### Perintah A2UI (v0.8)

Canvas saat ini menerima pesan server→client **A2UI v0.8**:

- `beginRendering`
- `surfaceUpdate`
- `dataModelUpdate`
- `deleteSurface`

`createSurface` (v0.9) tidak didukung.

Contoh CLI:

```bash
cat > /tmp/a2ui-v0.8.jsonl <<'EOFA2'
{"surfaceUpdate":{"surfaceId":"main","components":[{"id":"root","component":{"Column":{"children":{"explicitList":["title","content"]}}}},{"id":"title","component":{"Text":{"text":{"literalString":"Canvas (A2UI v0.8)"},"usageHint":"h1"}}},{"id":"content","component":{"Text":{"text":{"literalString":"If you can read this, A2UI push works."},"usageHint":"body"}}}]}}
{"beginRendering":{"surfaceId":"main","root":"root"}}
EOFA2

openclaw nodes canvas a2ui push --jsonl /tmp/a2ui-v0.8.jsonl --node <id>
```

Smoke test cepat:

```bash
openclaw nodes canvas a2ui push --node <id> --text "Hello from A2UI"
```

## Memicu eksekusi agen dari Canvas

Canvas dapat memicu eksekusi agen baru melalui deep link:

- `openclaw://agent?...`

Contoh (dalam JS):

```js
window.location.href = "openclaw://agent?message=Review%20this%20design";
```

Aplikasi akan meminta konfirmasi kecuali kunci yang valid diberikan.

## Catatan keamanan

- Skema Canvas memblokir directory traversal; file harus berada di bawah root sesi.
- Konten Canvas lokal menggunakan skema kustom (tidak memerlukan server loopback lokal).
- URL `http(s)` eksternal hanya diizinkan saat dinavigasikan secara eksplisit.
