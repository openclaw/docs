---
read_when:
    - Memindahkan kepemilikan host, alat, perintah, dokumentasi, atau protokol Canvas
    - Mengaudit apakah Canvas masih dimiliki oleh inti
    - Menyiapkan atau meninjau PR Plugin Canvas eksperimental
summary: Rencana dan daftar periksa audit untuk memindahkan Canvas keluar dari inti dan masuk ke Plugin eksperimental yang dibundel.
title: Refaktor Plugin Canvas
x-i18n:
    generated_at: "2026-05-07T13:25:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1470edb74d5f8fe96224d38821ba0b3b13f8ce756124125af64fc3e49df0fcb8
    source_path: refactor/canvas.md
    workflow: 16
---

# Refaktor Plugin Canvas

Canvas jarang digunakan dan bersifat eksperimental. Perlakukan ini sebagai Plugin bawaan, bukan fitur inti. Inti boleh tetap menyimpan plumbing Gateway, Node, HTTP, auth, konfigurasi, dan klien native yang generik, tetapi perilaku khusus Canvas harus berada di bawah `extensions/canvas`.

## Tujuan

Memindahkan kepemilikan Canvas ke `extensions/canvas` sambil mempertahankan perilaku node berpasangan saat ini:

- tool `canvas` yang menghadap agen didaftarkan oleh Plugin Canvas
- perintah node Canvas hanya diizinkan ketika Plugin Canvas mendaftarkannya
- file host/sumber A2UI berada di bawah Plugin Canvas
- materialisasi dokumen Canvas berada di bawah Plugin Canvas
- implementasi perintah CLI berada di bawah Plugin Canvas, atau mendelegasikan melalui barrel runtime milik Plugin
- dokumentasi dan inventaris Plugin mendeskripsikan Canvas sebagai eksperimental dan didukung Plugin

## Bukan tujuan

- Jangan mendesain ulang UI Canvas aplikasi native dalam refaktor ini.
- Jangan menghapus dukungan protokol/klien Canvas dari iOS, Android, atau macOS kecuali keputusan produk terpisah mengatakan Canvas harus dihapus.
- Jangan membangun kerangka kerja layanan Plugin yang luas hanya untuk Canvas kecuali setidaknya satu Plugin bawaan lain membutuhkan seam yang sama.

## Status branch saat ini

Selesai:

- Menambahkan paket Plugin bawaan di `extensions/canvas`.
- Menambahkan `extensions/canvas/openclaw.plugin.json`.
- Memindahkan tool agen `canvas` dari `src/agents/tools/canvas-tool.ts` ke `extensions/canvas/src/tool.ts`.
- Menghapus pendaftaran inti `createCanvasTool` dari `src/agents/openclaw-tools.ts`.
- Memindahkan implementasi host Canvas dari `src/canvas-host` ke `extensions/canvas/src/host`.
- Mempertahankan `extensions/canvas/runtime-api.ts` sebagai barrel kompatibilitas milik Plugin untuk pengujian, pemaketan, dan helper Canvas publik eksternal.
- Memindahkan materialisasi dokumen Canvas dari `src/gateway/canvas-documents.ts` ke `extensions/canvas/src/documents.ts`.
- Memindahkan implementasi CLI Canvas dan helper JSONL A2UI ke `extensions/canvas/src/cli.ts`.
- Memindahkan URL host Canvas dan helper kapabilitas bercakupan ke `extensions/canvas/src`.
- Memindahkan default perintah node Canvas keluar dari daftar inti yang di-hardcode dan masuk ke `nodeInvokePolicies` Plugin.
- Menambahkan konfigurasi host Canvas milik Plugin di `plugins.entries.canvas.config.host`.
- Memindahkan penyajian HTTP Canvas dan A2UI ke balik pendaftaran rute HTTP Plugin Canvas.
- Menambahkan dispatch upgrade WebSocket Plugin generik untuk rute HTTP milik Plugin.
- Mengganti URL host Gateway dan auth kapabilitas node khusus Canvas dengan permukaan Plugin ter-host generik dan helper kapabilitas node.
- Menambahkan resolver media ter-host milik Plugin sehingga URL dokumen Canvas diselesaikan melalui Plugin Canvas, bukan inti yang mengimpor internal dokumen Canvas.
- Menambahkan `api.registerNodeCliFeature(...)` sehingga Canvas dapat mendeklarasikan `openclaw nodes canvas` sebagai fitur node milik Plugin tanpa mengeja jalur perintah induk secara manual.
- Menghapus impor produksi `src/**` dari `extensions/canvas/runtime-api.js`.
- Memindahkan sumber bundel A2UI dari `apps/shared/OpenClawKit/Tools/CanvasA2UI` ke `extensions/canvas/src/host/a2ui-app`.
- Memindahkan implementasi build/salin A2UI ke bawah `extensions/canvas/scripts` dan mengganti wiring build root dengan hook aset Plugin bawaan generik.
- Menghapus alias konfigurasi runtime top-level lama `canvasHost`.
- Mempertahankan migrasi doctor Canvas sehingga `openclaw doctor --fix` menulis ulang konfigurasi lama `canvasHost` menjadi `plugins.entries.canvas.config.host`.
- Menghapus kompatibilitas protokol Canvas agen lama di balik protokol Gateway v4. Klien native dan Gateway sekarang hanya menggunakan `pluginSurfaceUrls.canvas` plus `node.pluginSurface.refresh`; jalur usang `canvasHostUrl`, `canvasCapability`, dan `node.canvas.capability.refresh` sengaja tidak didukung dalam refaktor eksperimental ini.
- Memperbarui inventaris Plugin yang dihasilkan agar menyertakan Canvas.
- Menambahkan dokumentasi referensi Plugin di `docs/plugins/reference/canvas.md`.

Permukaan Canvas milik inti yang diketahui masih tersisa:

- Handler Canvas aplikasi native di bawah `apps/` masih sengaja mengonsumsi permukaan Plugin Canvas
- handler protokol/klien Canvas aplikasi native di bawah `apps/`
- output artefak terpublikasi masih menggunakan `dist/canvas-host/a2ui` untuk lookup runtime yang kompatibel ke belakang, tetapi langkah penyalinan sekarang dimiliki Plugin

## Bentuk target

`extensions/canvas` harus memiliki:

- manifes Plugin dan metadata paket
- pendaftaran tool agen
- kebijakan perintah invoke node
- host Canvas dan runtime A2UI
- sumber bundel Canvas A2UI dan skrip build/salin aset
- pembuatan dokumen Canvas dan resolusi aset
- implementasi CLI Canvas
- halaman dokumentasi Canvas dan entri inventaris Plugin

Inti hanya boleh memiliki seam generik:

- penemuan dan pendaftaran Plugin
- registry tool agen generik
- registry kebijakan invoke node generik
- HTTP/auth Gateway generik dan dispatch upgrade WebSocket
- resolusi URL permukaan Plugin ter-host generik
- pendaftaran resolver media ter-host generik
- transport kapabilitas node generik
- plumbing konfigurasi generik
- penemuan hook aset Plugin bawaan generik

Aplikasi native boleh mempertahankan handler perintah Canvas sebagai klien protokol. Aplikasi tersebut bukan pemilik runtime Plugin.

## Langkah migrasi

1. Perlakukan `plugins.entries.canvas.config.host` sebagai permukaan konfigurasi milik Plugin.
2. Perbarui dokumentasi sehingga Canvas dideskripsikan sebagai Plugin bawaan eksperimental.
3. Jalankan pengujian Canvas terfokus, pemeriksaan inventaris Plugin, pemeriksaan API SDK Plugin, serta gate build/tipe yang terdampak oleh batas runtime.

## Checklist audit

Sebelum menyatakan refaktor selesai:

- `rg "src/canvas-host|../canvas-host"` tidak mengembalikan impor sumber live.
- `rg "canvas-tool|createCanvasTool" src` tidak menemukan implementasi tool Canvas milik inti.
- `rg "canvas.present|canvas.snapshot|canvas.a2ui" src/gateway` tidak menemukan default allowlist yang di-hardcode di luar pengujian kebijakan Plugin generik.
- `rg "extensions/canvas/runtime-api" src --glob '!**/*.test.ts'` kosong.
- `rg "canvas-documents" src` kosong.
- `rg "registerNodesCanvasCommands|nodes-canvas" src` kosong; Plugin Canvas mendaftarkan `openclaw nodes canvas` melalui metadata CLI Plugin bersarang.
- `rg "createCanvasHostHandler|handleA2uiHttpRequest" src/gateway` tidak mengembalikan kepemilikan runtime Gateway.
- `rg "apps/shared/OpenClawKit/Tools/CanvasA2UI|canvas-a2ui-copy|extensions/canvas/src/host/a2ui" scripts .github package.json` hanya menemukan wrapper kompatibilitas atau jalur milik Plugin.
- `pnpm plugins:inventory:check` berhasil.
- `pnpm plugin-sdk:api:check` berhasil, atau baseline API yang dihasilkan sengaja diperbarui dan ditinjau.
- Pengujian Canvas tertarget berhasil.
- Pengujian changed-lanes berhasil untuk jalur host/A2UI Canvas.
- Isi PR secara eksplisit mengatakan Canvas bersifat eksperimental dan didukung Plugin.

## Perintah verifikasi

Gunakan pemeriksaan lokal tertarget saat iterasi:

```sh
pnpm test extensions/canvas/src/host/server.test.ts extensions/canvas/src/host/server.state-dir.test.ts extensions/canvas/src/host/file-resolver.test.ts
pnpm test src/gateway/server.plugin-node-capability-auth.test.ts src/gateway/server-import-boundary.test.ts
pnpm test extensions/canvas/src/config-migration.test.ts src/commands/doctor-legacy-config.migrations.test.ts
pnpm test test/scripts/changed-lanes.test.ts test/scripts/build-all.test.ts extensions/canvas/scripts/bundle-a2ui.test.ts test/scripts/bundled-plugin-assets.test.ts extensions/canvas/scripts/copy-a2ui.test.ts src/infra/run-node.test.ts
pnpm tsgo:extensions
pnpm plugins:inventory:check
pnpm plugin-sdk:api:check
```

Jalankan `pnpm build` sebelum push jika barrel runtime, impor lazy, pemaketan, atau permukaan Plugin terpublikasi berubah.
