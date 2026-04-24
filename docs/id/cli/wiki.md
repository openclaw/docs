---
read_when:
    - Anda ingin menggunakan CLI memory-wiki
    - Anda sedang mendokumentasikan atau mengubah `openclaw wiki`
summary: Referensi CLI untuk `openclaw wiki` (status vault memory-wiki, pencarian, kompilasi, lint, apply, bridge, dan helper Obsidian)
title: Wiki
x-i18n:
    generated_at: "2026-04-24T09:03:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: c25f7046ef0c29ed74204a5349edc2aa20ce79a355f49211a0ba0df4a5e4db3a
    source_path: cli/wiki.md
    workflow: 15
---

# `openclaw wiki`

Periksa dan pelihara vault `memory-wiki`.

Disediakan oleh Plugin bawaan `memory-wiki`.

Terkait:

- [Plugin Memory Wiki](/id/plugins/memory-wiki)
- [Ikhtisar Memory](/id/concepts/memory)
- [CLI: memory](/id/cli/memory)

## Kegunaannya

Gunakan `openclaw wiki` saat Anda menginginkan vault pengetahuan terkompilasi dengan:

- pencarian native wiki dan pembacaan halaman
- sintesis kaya provenance
- laporan kontradiksi dan kesegaran
- impor bridge dari Plugin memory aktif
- helper CLI Obsidian opsional

## Perintah umum

```bash
openclaw wiki status
openclaw wiki doctor
openclaw wiki init
openclaw wiki ingest ./notes/alpha.md
openclaw wiki compile
openclaw wiki lint
openclaw wiki search "alpha"
openclaw wiki get entity.alpha --from 1 --lines 80

openclaw wiki apply synthesis "Alpha Summary" \
  --body "Short synthesis body" \
  --source-id source.alpha

openclaw wiki apply metadata entity.alpha \
  --source-id source.alpha \
  --status review \
  --question "Still active?"

openclaw wiki bridge import
openclaw wiki unsafe-local import

openclaw wiki obsidian status
openclaw wiki obsidian search "alpha"
openclaw wiki obsidian open syntheses/alpha-summary.md
openclaw wiki obsidian command workspace:quick-switcher
openclaw wiki obsidian daily
```

## Perintah

### `wiki status`

Periksa mode vault saat ini, kesehatan, dan ketersediaan CLI Obsidian.

Gunakan ini terlebih dahulu saat Anda tidak yakin apakah vault sudah diinisialisasi, mode bridge
berada dalam kondisi sehat, atau integrasi Obsidian tersedia.

### `wiki doctor`

Jalankan pemeriksaan kesehatan wiki dan tampilkan masalah konfigurasi atau vault.

Masalah umum meliputi:

- mode bridge diaktifkan tanpa artefak memory publik
- tata letak vault tidak valid atau hilang
- CLI Obsidian eksternal tidak ada saat mode Obsidian diharapkan

### `wiki init`

Buat tata letak vault wiki dan halaman awal.

Ini menginisialisasi struktur root, termasuk indeks level atas dan direktori
cache.

### `wiki ingest <path-or-url>`

Impor konten ke layer source wiki.

Catatan:

- ingest URL dikendalikan oleh `ingest.allowUrlIngest`
- halaman source yang diimpor menyimpan provenance di frontmatter
- kompilasi otomatis dapat berjalan setelah ingest jika diaktifkan

### `wiki compile`

Bangun ulang indeks, blok terkait, dashboard, dan digest terkompilasi.

Ini menulis artefak stabil yang berhadapan dengan mesin di bawah:

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

Jika `render.createDashboards` diaktifkan, compile juga menyegarkan halaman laporan.

### `wiki lint`

Lint vault dan laporkan:

- masalah struktural
- celah provenance
- kontradiksi
- pertanyaan terbuka
- halaman/klaim dengan kepercayaan rendah
- halaman/klaim yang stale

Jalankan ini setelah pembaruan wiki yang bermakna.

### `wiki search <query>`

Cari konten wiki.

Perilaku bergantung pada config:

- `search.backend`: `shared` atau `local`
- `search.corpus`: `wiki`, `memory`, atau `all`

Gunakan `wiki search` saat Anda menginginkan peringkat khusus wiki atau detail provenance.
Untuk satu kali recall bersama yang luas, gunakan `openclaw memory search` saat
Plugin memory aktif mengekspos pencarian bersama.

### `wiki get <lookup>`

Baca halaman wiki berdasarkan id atau path relatif.

Contoh:

```bash
openclaw wiki get entity.alpha
openclaw wiki get syntheses/alpha-summary.md --from 1 --lines 80
```

### `wiki apply`

Terapkan mutasi sempit tanpa pembedahan halaman bebas.

Alur yang didukung meliputi:

- membuat/memperbarui halaman sintesis
- memperbarui metadata halaman
- melampirkan id source
- menambahkan pertanyaan
- menambahkan kontradiksi
- memperbarui confidence/status
- menulis klaim terstruktur

Perintah ini ada agar wiki dapat berkembang dengan aman tanpa mengedit secara manual
blok yang dikelola.

### `wiki bridge import`

Impor artefak memory publik dari Plugin memory aktif ke halaman source
yang didukung bridge.

Gunakan ini dalam mode `bridge` saat Anda ingin artefak memory yang baru diekspor
ditarik ke vault wiki.

### `wiki unsafe-local import`

Impor dari path lokal yang dikonfigurasi secara eksplisit dalam mode `unsafe-local`.

Ini sengaja bersifat eksperimental dan hanya untuk mesin yang sama.

### `wiki obsidian ...`

Perintah helper Obsidian untuk vault yang berjalan dalam mode ramah Obsidian.

Subperintah:

- `status`
- `search`
- `open`
- `command`
- `daily`

Ini memerlukan CLI resmi `obsidian` pada `PATH` saat
`obsidian.useOfficialCli` diaktifkan.

## Panduan penggunaan praktis

- Gunakan `wiki search` + `wiki get` saat provenance dan identitas halaman penting.
- Gunakan `wiki apply` alih-alih mengedit tangan bagian terkelola yang dihasilkan.
- Gunakan `wiki lint` sebelum memercayai konten yang kontradiktif atau berkepercayaan rendah.
- Gunakan `wiki compile` setelah impor massal atau perubahan source saat Anda menginginkan
  dashboard dan digest terkompilasi yang segar segera.
- Gunakan `wiki bridge import` saat mode bridge bergantung pada artefak memory
  yang baru diekspor.

## Keterkaitan konfigurasi

Perilaku `openclaw wiki` dibentuk oleh:

- `plugins.entries.memory-wiki.config.vaultMode`
- `plugins.entries.memory-wiki.config.search.backend`
- `plugins.entries.memory-wiki.config.search.corpus`
- `plugins.entries.memory-wiki.config.bridge.*`
- `plugins.entries.memory-wiki.config.obsidian.*`
- `plugins.entries.memory-wiki.config.render.*`
- `plugins.entries.memory-wiki.config.context.includeCompiledDigestPrompt`

Lihat [Plugin Memory Wiki](/id/plugins/memory-wiki) untuk model config lengkap.

## Terkait

- [Referensi CLI](/id/cli)
- [Memory wiki](/id/plugins/memory-wiki)
