---
read_when:
    - Mengimplementasikan panel Canvas macOS
    - Menambahkan kontrol agen untuk ruang kerja visual
    - Men-debug pemuatan canvas WKWebView
summary: Panel Canvas yang dikendalikan agen, disematkan melalui WKWebView + skema URL khusus
title: Kanvas
x-i18n:
    generated_at: "2026-07-19T05:17:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 56532246bc06601aa753a59f85f33bfa8d6599deecade591a03972e8b9b16fc2
    source_path: platforms/mac/canvas.md
    workflow: 16
---

Aplikasi macOS menyematkan **panel Canvas** yang dikendalikan agen menggunakan `WKWebView`, sebuah
ruang kerja visual ringan untuk HTML/CSS/JS, A2UI, dan permukaan UI
interaktif kecil.

## Lokasi Canvas

Status Canvas disimpan di bawah Application Support:

- `~/Library/Application Support/OpenClaw/canvas/<session>/...`

Panel Canvas menyajikan file-file tersebut melalui skema URL khusus,
`openclaw-canvas://<session>/<path>`:

- `openclaw-canvas://main/` -> `<canvasRoot>/main/index.html`
- `openclaw-canvas://main/assets/app.css` -> `<canvasRoot>/main/assets/app.css`
- `openclaw-canvas://main/widgets/todo/` -> `<canvasRoot>/main/widgets/todo/index.html`

Jika tidak ada `index.html` di direktori akar, aplikasi menampilkan halaman kerangka bawaan.

## Perilaku panel

- Panel tanpa bingkai yang dapat diubah ukurannya dan ditambatkan di dekat bilah menu (atau kursor tetikus).
- Menampilkan Canvas tidak beralih aplikasi atau mengambil fokus papan ketik.
- Mengingat ukuran/posisi per sesi.
- Memuat ulang secara otomatis saat file Canvas lokal berubah.
- Hanya satu panel Canvas yang terlihat pada satu waktu (beralih sesi sesuai kebutuhan).

Canvas dapat dinonaktifkan dari Settings -> **Allow Canvas**. Saat dinonaktifkan,
perintah node Canvas mengembalikan `CANVAS_DISABLED`.

## Permukaan API agen

Canvas diekspos melalui WebSocket Gateway, sehingga agen dapat menampilkan/menyembunyikan
panel, menavigasi ke jalur atau URL, mengevaluasi JavaScript, dan mengambil
gambar cuplikan:

```bash
openclaw nodes canvas present --node <id>
openclaw nodes canvas navigate --node <id> "/"
openclaw nodes canvas eval --node <id> --js "document.title"
openclaw nodes canvas snapshot --node <id>
```

`eval` dan `a2ui.*` memperbarui konten tanpa membuka atau menampilkan panel. Hanya
`present`, `navigate`, atau tindakan pengguna yang menampilkannya; setelah disembunyikan, pembaruan konten
tetap diterapkan pada panel tersembunyi. `snapshot` memerlukan panel yang terlihat dan
akan mengembalikan `CANVAS_HIDDEN` jika tidak; jalankan `present` terlebih dahulu.

`canvas.navigate` menerima jalur Canvas lokal, URL `http(s)`, dan URL `file://`.
Meneruskan `"/"` akan menampilkan kerangka lokal atau `index.html`.

Target yang dihosting Gateway di bawah `/__openclaw__/canvas/` dan
`/__openclaw__/a2ui/` diuraikan melalui URL Canvas terbatas saat ini milik sesi
node. Aplikasi memperbarui kapabilitas berumur pendek tersebut sebelum navigasi;
Anda tidak perlu membuat atau menyalin sendiri URL kapabilitas.

## A2UI di Canvas

A2UI dihosting oleh host Canvas Gateway dan dirender di dalam panel
Canvas. Saat Gateway mengumumkan host Canvas, aplikasi macOS secara otomatis menavigasi
ke halaman host A2UI ketika pertama kali dibuka.

URL yang diumumkan dibatasi berdasarkan kapabilitas, misalnya
`http://<gateway-host>:18789/__openclaw__/cap/<token>/__openclaw__/a2ui/?platform=macos`.
Perlakukan URL tersebut sebagai kredensial sementara, bukan tautan stabil.

### Perintah A2UI (v0.8)

Canvas menerima pesan server-ke-klien A2UI v0.8: `beginRendering`,
`surfaceUpdate`, `dataModelUpdate`, `deleteSurface`. `createSurface` (v0.9)
belum didukung.

```bash
cat > /tmp/a2ui-v0.8.jsonl <<'EOFA2'
{"surfaceUpdate":{"surfaceId":"main","components":[{"id":"root","component":{"Column":{"children":{"explicitList":["title","content"]}}}},{"id":"title","component":{"Text":{"text":{"literalString":"Canvas (A2UI v0.8)"},"usageHint":"h1"}}},{"id":"content","component":{"Text":{"text":{"literalString":"Jika Anda dapat membaca ini, push A2UI berfungsi."},"usageHint":"body"}}}]}}
{"beginRendering":{"surfaceId":"main","root":"root"}}
EOFA2

openclaw nodes canvas a2ui push --jsonl /tmp/a2ui-v0.8.jsonl --node <id>
```

Uji cepat:

```bash
openclaw nodes canvas a2ui push --node <id> --text "Halo dari A2UI"
```

## Memicu eksekusi agen dari Canvas

Canvas dapat memicu eksekusi agen baru melalui tautan dalam `openclaw://agent?...`:

```js
window.location.href = "openclaw://agent?message=Review%20this%20design";
```

Parameter kueri yang didukung:

| Parameter                  | Arti                                                  |
| -------------------------- | ----------------------------------------------------- |
| `message`                  | Prompt agen yang telah diisi sebelumnya.              |
| `sessionKey`               | Pengidentifikasi sesi yang stabil.                    |
| `thinking`                 | Profil pemikiran opsional.                            |
| `deliver`, `to`, `channel` | Target pengiriman.                                    |
| `timeoutSeconds`           | Batas waktu eksekusi opsional.                        |
| `key`                      | Token keamanan yang dibuat aplikasi untuk pemanggil lokal tepercaya. |

Aplikasi meminta konfirmasi kecuali kunci yang valid diberikan. Tautan tanpa kunci
menampilkan pesan dan URL sebelum persetujuan, serta mengabaikan bidang perutean
pengiriman; tautan berkunci menggunakan jalur eksekusi Gateway normal.

## Catatan keamanan

- Skema Canvas memblokir penelusuran direktori; file harus berada di bawah direktori akar sesi.
- Konten Canvas lokal menggunakan skema khusus (tidak memerlukan server loopback).
- URL `http(s)` eksternal hanya diizinkan saat dinavigasi secara eksplisit.
- Halaman web biasa hanya dapat dirender. Tindakan agen hanya diterima dari
  skema Canvas milik aplikasi atau dokumen A2UI Gateway dengan cakupan kapabilitas persis
  yang dipilih oleh aplikasi; subframe, pengalihan, kapabilitas kedaluwarsa, dan kueri yang
  berubah tidak dapat mengirim tindakan.

## Terkait

- [Aplikasi macOS](/id/platforms/macos)
- [WebChat](/id/web/webchat)
