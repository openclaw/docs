---
read_when:
    - Memindahkan kepemilikan host, alat, perintah, dokumentasi, atau protokol Canvas
    - Mengaudit apakah Canvas masih dimiliki oleh inti
    - Menyiapkan atau meninjau PR plugin Canvas eksperimental
summary: Daftar periksa perencanaan dan audit untuk memindahkan Canvas dari inti ke Plugin eksperimental bawaan.
title: Refaktor Plugin Canvas
x-i18n:
    generated_at: "2026-07-19T05:35:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ead3f865ea80acb1e47f45a5ab07acf19a6470035c00c81006b2b1230bedd71e
    source_path: refactor/canvas.md
    workflow: 16
---

# Refaktor plugin Canvas

Canvas jarang digunakan dan bersifat eksperimental. Perlakukan Canvas sebagai plugin bawaan, bukan fitur inti. Inti dapat mempertahankan infrastruktur generik untuk Gateway, Node, HTTP, autentikasi, konfigurasi, dan klien native, tetapi perilaku khusus Canvas harus berada di bawah `extensions/canvas`.

## Tujuan

Pindahkan kepemilikan Canvas ke `extensions/canvas` sambil mempertahankan perilaku Node berpasangan saat ini:

- alat `canvas` yang ditujukan untuk agen didaftarkan oleh plugin Canvas
- perintah Node Canvas hanya diizinkan ketika plugin Canvas mendaftarkannya
- file host/sumber A2UI berada di bawah plugin Canvas
- materialisasi dokumen Canvas berada di bawah plugin Canvas
- implementasi perintah CLI berada di bawah plugin Canvas, atau mendelegasikan melalui barrel runtime milik plugin
- dokumentasi dan inventaris plugin menjelaskan Canvas sebagai eksperimental dan didukung plugin

## Bukan tujuan

- Jangan mendesain ulang UI Canvas aplikasi native dalam refaktor ini.
- Jangan menghapus dukungan protokol/klien Canvas dari iOS, Android, atau macOS kecuali keputusan produk terpisah menetapkan bahwa Canvas harus dihapus.
- Jangan membangun kerangka kerja layanan plugin yang luas hanya untuk Canvas kecuali setidaknya satu plugin bawaan lain memerlukan seam yang sama.

## Status cabang saat ini

Selesai:

- Menambahkan paket plugin bawaan di `extensions/canvas`.
- Menambahkan `extensions/canvas/openclaw.plugin.json`.
- Memindahkan alat agen `canvas` dari `src/agents/tools/canvas-tool.ts` ke `extensions/canvas/src/tool.ts`.
- Menghapus pendaftaran inti untuk `createCanvasTool` dari `src/agents/openclaw-tools.ts`.
- Memindahkan implementasi host Canvas dari `src/canvas-host` ke `extensions/canvas/src/host`.
- Mempertahankan `extensions/canvas/runtime-api.ts` sebagai barrel kompatibilitas milik plugin untuk pengujian, pemaketan, dan helper publik eksternal Canvas.
- Memindahkan materialisasi dokumen Canvas dari `src/gateway/canvas-documents.ts` ke `extensions/canvas/src/documents.ts`.
- Memindahkan implementasi CLI Canvas dan helper JSONL A2UI ke `extensions/canvas/src/cli.ts`.
- Memindahkan URL host Canvas dan helper kapabilitas bercakupan ke `extensions/canvas/src`.
- Memindahkan nilai default perintah Node Canvas dari daftar inti yang di-hardcode ke `nodeInvokePolicies` milik plugin.
- Menambahkan konfigurasi host Canvas milik plugin di `plugins.entries.canvas.config.host`.
- Memindahkan penyajian HTTP Canvas dan A2UI ke balik pendaftaran rute HTTP plugin Canvas.
- Menambahkan dispatch peningkatan WebSocket plugin generik untuk rute HTTP milik plugin.
- Mengganti URL host Gateway khusus Canvas dan autentikasi kapabilitas Node dengan permukaan plugin yang di-host serta helper kapabilitas Node generik.
- Menambahkan resolver media yang di-host milik plugin agar URL dokumen Canvas diselesaikan melalui plugin Canvas alih-alih inti mengimpor internal dokumen Canvas.
- Menambahkan `api.registerNodeCliFeature(...)` agar Canvas dapat mendeklarasikan `openclaw nodes canvas` sebagai fitur Node milik plugin tanpa menuliskan jalur perintah induk secara manual.
- Menghapus impor produksi `src/**` atas `extensions/canvas/runtime-api.js`.
- Memindahkan sumber bundel A2UI dari `apps/shared/OpenClawKit/Tools/CanvasA2UI` ke `extensions/canvas/src/host/a2ui-app`.
- Memindahkan implementasi build/salin A2UI ke bawah `extensions/canvas/scripts` dan mengganti pengkabelan build root dengan hook aset plugin bawaan generik.
- Menghapus alias konfigurasi tingkat atas lama `canvasHost` dari runtime.
- Mempertahankan migrasi doctor Canvas agar `openclaw doctor --fix` menulis ulang konfigurasi `canvasHost` lama menjadi `plugins.entries.canvas.config.host`.
- Menghapus kompatibilitas protokol Canvas untuk agen lama di balik protokol Gateway v4. Klien native dan Gateway kini hanya menggunakan `pluginSurfaceUrls.canvas` serta `node.pluginSurface.refresh`; jalur `canvasHostUrl`, `canvasCapability`, dan `node.canvas.capability.refresh` yang tidak digunakan lagi sengaja tidak didukung dalam refaktor eksperimental ini.
- Memperbarui inventaris plugin yang dihasilkan agar mencakup Canvas.
- Menambahkan dokumentasi referensi plugin di `docs/plugins/reference/canvas.md`.

Permukaan Canvas yang diketahui masih dimiliki inti:

- Handler Canvas aplikasi native di bawah `apps/` masih secara sengaja menggunakan permukaan plugin Canvas
- handler protokol/klien Canvas aplikasi native di bawah `apps/`
- output artefak yang dipublikasikan masih menggunakan `dist/canvas-host/a2ui` untuk pencarian runtime yang kompatibel dengan versi sebelumnya, tetapi langkah penyalinan kini dimiliki plugin

## Bentuk target

`extensions/canvas` harus memiliki:

- manifes plugin dan metadata paket
- pendaftaran alat agen
- kebijakan perintah pemanggilan Node
- host Canvas dan runtime A2UI
- sumber bundel A2UI Canvas serta skrip build/salin aset
- pembuatan dokumen Canvas dan resolusi aset
- implementasi CLI Canvas
- halaman dokumentasi Canvas dan entri inventaris plugin

Inti seharusnya hanya memiliki seam generik:

- penemuan dan pendaftaran plugin
- registri alat agen generik
- registri kebijakan pemanggilan Node generik
- HTTP/autentikasi Gateway generik dan dispatch peningkatan WebSocket
- resolusi URL permukaan plugin yang di-host secara generik
- pendaftaran resolver media yang di-host secara generik
- transport kapabilitas Node generik
- infrastruktur konfigurasi generik
- penemuan hook aset plugin bawaan generik

Aplikasi native dapat mempertahankan handler perintah Canvas sebagai klien protokol. Aplikasi tersebut bukan pemilik runtime plugin.

## Langkah migrasi

1. Perlakukan `plugins.entries.canvas.config.host` sebagai permukaan konfigurasi milik plugin.
2. Perbarui dokumentasi agar Canvas dijelaskan sebagai plugin bawaan eksperimental.
3. Jalankan pengujian Canvas terfokus, pemeriksaan inventaris plugin, pemeriksaan API SDK plugin, serta gate build/tipe yang terpengaruh oleh batas runtime.

## Daftar periksa audit

Sebelum menyatakan refaktor selesai:

- `rg "src/canvas-host|../canvas-host"` tidak menghasilkan impor sumber aktif.
- `rg "canvas-tool|createCanvasTool" src` tidak menemukan implementasi alat Canvas milik inti.
- `rg "canvas.present|canvas.snapshot|canvas.a2ui" src/gateway` tidak menemukan nilai default daftar izin yang di-hardcode di luar pengujian kebijakan plugin generik.
- `rg "extensions/canvas/runtime-api" src --glob '!**/*.test.ts'` kosong.
- `rg "canvas-documents" src` kosong.
- `rg "registerNodesCanvasCommands|nodes-canvas" src` kosong; plugin Canvas mendaftarkan `openclaw nodes canvas` melalui metadata CLI plugin bertingkat.
- `rg "createCanvasHostHandler|handleA2uiHttpRequest" src/gateway` tidak menghasilkan kepemilikan runtime Gateway.
- `rg "apps/shared/OpenClawKit/Tools/CanvasA2UI|canvas-a2ui-copy|extensions/canvas/src/host/a2ui" scripts .github package.json` hanya menemukan wrapper kompatibilitas atau jalur milik plugin.
- `pnpm plugins:inventory:check` berhasil.
- `pnpm plugin-sdk:api:check` berhasil, atau catatan kontrak API yang dihasilkan diperbarui dan direview secara sengaja.
- Pengujian Canvas yang ditargetkan berhasil.
- Pengujian changed-lanes berhasil untuk jalur host Canvas/A2UI.
- Isi PR secara eksplisit menyatakan bahwa Canvas bersifat eksperimental dan didukung plugin.

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

Jalankan `pnpm build` sebelum push jika barrel runtime, impor malas, pemaketan, atau permukaan plugin yang dipublikasikan berubah.
