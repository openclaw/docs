---
read_when:
    - Memindahkan kepemilikan host, alat, perintah, dokumentasi, atau protokol Canvas
    - Mengaudit apakah Canvas masih dimiliki oleh inti
    - Menyiapkan atau meninjau PR Plugin Canvas eksperimental
summary: Rencana dan daftar periksa audit untuk memindahkan Canvas dari inti ke Plugin eksperimental bawaan.
title: Refaktor Plugin canvas
x-i18n:
    generated_at: "2026-07-12T14:39:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1470edb74d5f8fe96224d38821ba0b3b13f8ce756124125af64fc3e49df0fcb8
    source_path: refactor/canvas.md
    workflow: 16
---

# Refaktor Plugin Canvas

Canvas jarang digunakan dan bersifat eksperimental. Perlakukan Canvas sebagai Plugin bawaan, bukan fitur inti. Inti dapat mempertahankan infrastruktur generik untuk Gateway, Node, HTTP, autentikasi, konfigurasi, dan klien native, tetapi perilaku khusus Canvas harus berada di bawah `extensions/canvas`.

## Tujuan

Pindahkan kepemilikan Canvas ke `extensions/canvas` sembari mempertahankan perilaku Node berpasangan saat ini:

- alat `canvas` yang digunakan agen didaftarkan oleh Plugin Canvas
- perintah Node Canvas hanya diizinkan ketika Plugin Canvas mendaftarkannya
- berkas host/sumber A2UI berada di bawah Plugin Canvas
- materialisasi dokumen Canvas berada di bawah Plugin Canvas
- implementasi perintah CLI berada di bawah Plugin Canvas, atau mendelegasikan melalui barrel runtime milik Plugin
- dokumentasi dan inventaris Plugin menjelaskan Canvas sebagai fitur eksperimental yang didukung Plugin

## Bukan tujuan

- Jangan mendesain ulang UI Canvas aplikasi native dalam refaktor ini.
- Jangan menghapus dukungan protokol/klien Canvas dari iOS, Android, atau macOS kecuali keputusan produk terpisah menetapkan bahwa Canvas harus dihapus.
- Jangan membangun kerangka kerja layanan Plugin yang luas hanya untuk Canvas kecuali setidaknya satu Plugin bawaan lain memerlukan seam yang sama.

## Status cabang saat ini

Selesai:

- Menambahkan paket Plugin bawaan di `extensions/canvas`.
- Menambahkan `extensions/canvas/openclaw.plugin.json`.
- Memindahkan alat `canvas` agen dari `src/agents/tools/canvas-tool.ts` ke `extensions/canvas/src/tool.ts`.
- Menghapus pendaftaran inti `createCanvasTool` dari `src/agents/openclaw-tools.ts`.
- Memindahkan implementasi host Canvas dari `src/canvas-host` ke `extensions/canvas/src/host`.
- Mempertahankan `extensions/canvas/runtime-api.ts` sebagai barrel kompatibilitas milik Plugin untuk pengujian, pengemasan, dan pembantu publik eksternal Canvas.
- Memindahkan materialisasi dokumen Canvas dari `src/gateway/canvas-documents.ts` ke `extensions/canvas/src/documents.ts`.
- Memindahkan implementasi CLI Canvas dan pembantu JSONL A2UI ke `extensions/canvas/src/cli.ts`.
- Memindahkan URL host Canvas dan pembantu kapabilitas bercakupan ke `extensions/canvas/src`.
- Memindahkan nilai default perintah Node Canvas dari daftar inti yang di-hardcode ke `nodeInvokePolicies` Plugin.
- Menambahkan konfigurasi host Canvas milik Plugin di `plugins.entries.canvas.config.host`.
- Memindahkan penyajian HTTP Canvas dan A2UI ke balik pendaftaran rute HTTP Plugin Canvas.
- Menambahkan pengiriman peningkatan WebSocket Plugin generik untuk rute HTTP milik Plugin.
- Mengganti URL host Gateway dan autentikasi kapabilitas Node yang khusus Canvas dengan permukaan Plugin yang dihosting dan pembantu kapabilitas Node generik.
- Menambahkan resolver media yang dihosting milik Plugin agar URL dokumen Canvas diselesaikan melalui Plugin Canvas, alih-alih inti mengimpor internal dokumen Canvas.
- Menambahkan `api.registerNodeCliFeature(...)` agar Canvas dapat mendeklarasikan `openclaw nodes canvas` sebagai fitur Node milik Plugin tanpa menuliskan jalur perintah induk secara manual.
- Menghapus impor produksi `src/**` atas `extensions/canvas/runtime-api.js`.
- Memindahkan sumber bundel A2UI dari `apps/shared/OpenClawKit/Tools/CanvasA2UI` ke `extensions/canvas/src/host/a2ui-app`.
- Memindahkan implementasi pembuatan/penyalinan A2UI ke bawah `extensions/canvas/scripts` dan mengganti pengawatan build tingkat root dengan hook aset Plugin bawaan generik.
- Menghapus alias konfigurasi tingkat atas lama `canvasHost` dari runtime.
- Mempertahankan migrasi doctor Canvas agar `openclaw doctor --fix` menulis ulang konfigurasi `canvasHost` lama menjadi `plugins.entries.canvas.config.host`.
- Menghapus kompatibilitas protokol Canvas untuk agen lama di balik protokol Gateway v4. Klien native dan Gateway kini hanya menggunakan `pluginSurfaceUrls.canvas` beserta `node.pluginSurface.refresh`; jalur `canvasHostUrl`, `canvasCapability`, dan `node.canvas.capability.refresh` yang telah dihentikan sengaja tidak didukung dalam refaktor eksperimental ini.
- Memperbarui inventaris Plugin yang dihasilkan untuk menyertakan Canvas.
- Menambahkan dokumentasi referensi Plugin di `docs/plugins/reference/canvas.md`.

Permukaan Canvas yang diketahui masih dimiliki inti:

- Penangan Canvas aplikasi native di bawah `apps/` masih secara sengaja menggunakan permukaan Plugin Canvas
- penangan protokol/klien Canvas aplikasi native di bawah `apps/`
- keluaran artefak yang dipublikasikan masih menggunakan `dist/canvas-host/a2ui` untuk pencarian runtime yang kompatibel dengan versi sebelumnya, tetapi langkah penyalinannya kini dimiliki Plugin

## Bentuk target

`extensions/canvas` harus memiliki:

- manifes Plugin dan metadata paket
- pendaftaran alat agen
- kebijakan perintah pemanggilan Node
- runtime host Canvas dan A2UI
- sumber bundel A2UI Canvas serta skrip pembuatan/penyalinan aset
- pembuatan dokumen Canvas dan resolusi aset
- implementasi CLI Canvas
- halaman dokumentasi Canvas dan entri inventaris Plugin

Inti hanya boleh memiliki seam generik:

- penemuan dan pendaftaran Plugin
- registri alat agen generik
- registri kebijakan pemanggilan Node generik
- pengiriman peningkatan HTTP/autentikasi Gateway dan WebSocket generik
- resolusi URL permukaan Plugin yang dihosting secara generik
- pendaftaran resolver media yang dihosting secara generik
- transportasi kapabilitas Node generik
- infrastruktur konfigurasi generik
- penemuan hook aset Plugin bawaan generik

Aplikasi native dapat mempertahankan penangan perintah Canvas sebagai klien protokol. Aplikasi tersebut bukan pemilik runtime Plugin.

## Langkah migrasi

1. Perlakukan `plugins.entries.canvas.config.host` sebagai permukaan konfigurasi milik Plugin.
2. Perbarui dokumentasi agar Canvas dijelaskan sebagai Plugin bawaan eksperimental.
3. Jalankan pengujian Canvas terfokus, pemeriksaan inventaris Plugin, pemeriksaan API SDK Plugin, serta gerbang build/tipe yang terdampak oleh batas runtime.

## Daftar periksa audit

Sebelum menyatakan refaktor selesai:

- `rg "src/canvas-host|../canvas-host"` tidak mengembalikan impor sumber aktif.
- `rg "canvas-tool|createCanvasTool" src` tidak menemukan implementasi alat Canvas milik inti.
- `rg "canvas.present|canvas.snapshot|canvas.a2ui" src/gateway` tidak menemukan nilai default daftar izin yang di-hardcode di luar pengujian kebijakan Plugin generik.
- `rg "extensions/canvas/runtime-api" src --glob '!**/*.test.ts'` tidak menghasilkan keluaran.
- `rg "canvas-documents" src` tidak menghasilkan keluaran.
- `rg "registerNodesCanvasCommands|nodes-canvas" src` tidak menghasilkan keluaran; Plugin Canvas mendaftarkan `openclaw nodes canvas` melalui metadata CLI Plugin bertingkat.
- `rg "createCanvasHostHandler|handleA2uiHttpRequest" src/gateway` tidak mengembalikan kepemilikan runtime Gateway.
- `rg "apps/shared/OpenClawKit/Tools/CanvasA2UI|canvas-a2ui-copy|extensions/canvas/src/host/a2ui" scripts .github package.json` hanya menemukan pembungkus kompatibilitas atau jalur milik Plugin.
- `pnpm plugins:inventory:check` berhasil.
- `pnpm plugin-sdk:api:check` berhasil, atau baseline API yang dihasilkan diperbarui dan ditinjau secara sengaja.
- Pengujian Canvas yang ditargetkan berhasil.
- Pengujian lajur yang berubah berhasil untuk jalur host Canvas/A2UI.
- Isi PR secara eksplisit menyatakan bahwa Canvas bersifat eksperimental dan didukung Plugin.

## Perintah verifikasi

Gunakan pemeriksaan lokal yang ditargetkan selama iterasi:

```sh
pnpm test extensions/canvas/src/host/server.test.ts extensions/canvas/src/host/server.state-dir.test.ts extensions/canvas/src/host/file-resolver.test.ts
pnpm test src/gateway/server.plugin-node-capability-auth.test.ts src/gateway/server-import-boundary.test.ts
pnpm test extensions/canvas/src/config-migration.test.ts src/commands/doctor-legacy-config.migrations.test.ts
pnpm test test/scripts/changed-lanes.test.ts test/scripts/build-all.test.ts extensions/canvas/scripts/bundle-a2ui.test.ts test/scripts/bundled-plugin-assets.test.ts extensions/canvas/scripts/copy-a2ui.test.ts src/infra/run-node.test.ts
pnpm tsgo:extensions
pnpm plugins:inventory:check
pnpm plugin-sdk:api:check
```

Jalankan `pnpm build` sebelum push jika barrel runtime, impor lazy, pengemasan, atau permukaan Plugin yang dipublikasikan berubah.
