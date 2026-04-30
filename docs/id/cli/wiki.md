---
read_when:
    - Anda ingin menggunakan CLI memory-wiki
    - Anda sedang mendokumentasikan atau mengubah `openclaw wiki`
summary: Referensi CLI untuk `openclaw wiki` (status vault memory-wiki, search, compile, lint, apply, bridge, dan helper Obsidian)
title: Wiki
x-i18n:
    generated_at: "2026-04-30T09:42:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 67fe56c9bff7b24570f890733314857dd261fca8233051681a83c171656ff27d
    source_path: cli/wiki.md
    workflow: 16
---

# `openclaw wiki`

Periksa dan pelihara vault `memory-wiki`.

Disediakan oleh Plugin `memory-wiki` bawaan.

Terkait:

- [Plugin Memory Wiki](/id/plugins/memory-wiki)
- [Ikhtisar Memori](/id/concepts/memory)
- [CLI: memory](/id/cli/memory)

## Untuk apa ini digunakan

Gunakan `openclaw wiki` saat Anda menginginkan vault pengetahuan terkompilasi dengan:

- pencarian native wiki dan pembacaan halaman
- sintesis kaya provenance
- laporan kontradiksi dan kesegaran
- impor bridge dari Plugin active memory
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
openclaw wiki search "who should I ask about Teams?" --mode route-question
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
sehat, atau integrasi Obsidian tersedia.

Saat mode bridge aktif dan dikonfigurasi untuk membaca artefak memori, perintah ini
mengkueri Gateway yang sedang berjalan sehingga melihat konteks Plugin active memory yang sama dengan
memori agen/runtime.

### `wiki doctor`

Jalankan pemeriksaan kesehatan wiki dan tampilkan masalah konfigurasi atau vault.

Saat mode bridge aktif dan dikonfigurasi untuk membaca artefak memori, perintah ini
mengkueri Gateway yang sedang berjalan sebelum membuat laporan. Impor bridge yang dinonaktifkan
dan konfigurasi bridge yang tidak membaca artefak memori tetap lokal/offline.

Masalah umum meliputi:

- mode bridge diaktifkan tanpa artefak memori publik
- tata letak vault tidak valid atau hilang
- CLI Obsidian eksternal hilang saat mode Obsidian diharapkan

### `wiki init`

Buat tata letak vault wiki dan halaman awal.

Ini menginisialisasi struktur root, termasuk indeks tingkat atas dan direktori
cache.

### `wiki ingest <path-or-url>`

Impor konten ke lapisan sumber wiki.

Catatan:

- ingest URL dikendalikan oleh `ingest.allowUrlIngest`
- halaman sumber yang diimpor mempertahankan provenance di frontmatter
- kompilasi otomatis dapat berjalan setelah ingest saat diaktifkan

### `wiki compile`

Bangun ulang indeks, blok terkait, dashboard, dan digest terkompilasi.

Ini menulis artefak stabil yang menghadap mesin di bawah:

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

Jika `render.createDashboards` diaktifkan, compile juga menyegarkan halaman laporan.

### `wiki lint`

Lint vault dan laporkan:

- masalah struktural
- celah provenance
- kontradiksi
- pertanyaan terbuka
- halaman/claim berkeyakinan rendah
- halaman/claim usang

Jalankan ini setelah pembaruan wiki yang bermakna.

### `wiki search <query>`

Cari konten wiki.

Perilaku bergantung pada konfigurasi:

- `search.backend`: `shared` atau `local`
- `search.corpus`: `wiki`, `memory`, atau `all`
- `--mode`: `auto`, `find-person`, `route-question`, `source-evidence`, atau
  `raw-claim`

Gunakan `wiki search` saat Anda menginginkan peringkat khusus wiki atau detail provenance.
Untuk satu pass recall bersama yang luas, pilih `openclaw memory search` saat
Plugin active memory mengekspos pencarian bersama.

Mode pencarian membantu agen memilih permukaan yang tepat:

- `find-person`: alias, handle, sosial, ID kanonis, dan halaman orang
- `route-question`: petunjuk ask-for/best-used-for dan konteks hubungan
- `source-evidence`: halaman sumber dan bidang bukti terstruktur
- `raw-claim`: teks claim terstruktur dengan metadata claim/bukti

Contoh:

```bash
openclaw wiki search "bgroux" --mode find-person
openclaw wiki search "who knows Teams rollout?" --mode route-question
openclaw wiki search "maintainer-whois" --mode source-evidence
openclaw wiki search "strong route Teams" --mode raw-claim --json
```

Output teks menyertakan baris `Claim:` dan `Evidence:` saat hasil cocok dengan
claim terstruktur. Output JSON juga mengekspos `matchedClaimId`,
`matchedClaimStatus`, `matchedClaimConfidence`, `evidenceKinds`, dan
`evidenceSourceIds` untuk drilldown sisi agen.

### `wiki get <lookup>`

Baca halaman wiki berdasarkan id atau path relatif.

Contoh:

```bash
openclaw wiki get entity.alpha
openclaw wiki get syntheses/alpha-summary.md --from 1 --lines 80
```

### `wiki apply`

Terapkan mutasi sempit tanpa operasi halaman freeform.

Alur yang didukung meliputi:

- membuat/memperbarui halaman sintesis
- memperbarui metadata halaman
- melampirkan id sumber
- menambahkan pertanyaan
- menambahkan kontradiksi
- memperbarui keyakinan/status
- menulis claim terstruktur

Perintah ini ada agar wiki dapat berkembang dengan aman tanpa mengedit blok
terkelola secara manual.

### `wiki bridge import`

Impor artefak memori publik dari Plugin active memory ke halaman sumber yang didukung bridge.

Gunakan ini dalam mode `bridge` saat Anda menginginkan artefak memori ekspor terbaru
ditarik ke dalam vault wiki.

Untuk pembacaan artefak bridge aktif, CLI merutekan impor melalui Gateway RPC
sehingga impor menggunakan konteks Plugin memori runtime. Jika impor bridge
dinonaktifkan atau pembacaan artefak dimatikan, perintah mempertahankan perilaku
zero-import lokal/offline.

### `wiki unsafe-local import`

Impor dari path lokal yang dikonfigurasi secara eksplisit dalam mode `unsafe-local`.

Ini sengaja eksperimental dan hanya untuk mesin yang sama.

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
- Gunakan `wiki apply` alih-alih mengedit bagian terkelola yang dihasilkan secara manual.
- Gunakan `wiki lint` sebelum mempercayai konten kontradiktif atau berkeyakinan rendah.
- Gunakan `wiki compile` setelah impor massal atau perubahan sumber saat Anda menginginkan
  dashboard dan digest terkompilasi yang segar segera.
- Gunakan `wiki bridge import` saat mode bridge bergantung pada artefak memori
  yang baru diekspor.

## Kaitan konfigurasi

Perilaku `openclaw wiki` dibentuk oleh:

- `plugins.entries.memory-wiki.config.vaultMode`
- `plugins.entries.memory-wiki.config.search.backend`
- `plugins.entries.memory-wiki.config.search.corpus`
- `plugins.entries.memory-wiki.config.bridge.*`
- `plugins.entries.memory-wiki.config.obsidian.*`
- `plugins.entries.memory-wiki.config.render.*`
- `plugins.entries.memory-wiki.config.context.includeCompiledDigestPrompt`

Lihat [Plugin Memory Wiki](/id/plugins/memory-wiki) untuk model konfigurasi lengkap.

## Terkait

- [Referensi CLI](/id/cli)
- [Wiki memori](/id/plugins/memory-wiki)
