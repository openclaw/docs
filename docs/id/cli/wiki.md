---
read_when:
    - Anda ingin menggunakan CLI memory-wiki
    - Anda sedang mendokumentasikan atau mengubah `openclaw wiki`
summary: Referensi CLI untuk `openclaw wiki` (status vault memory-wiki, pencarian, kompilasi, lint, penerapan, bridge, impor ChatGPT, dan pembantu Obsidian)
title: Wiki
x-i18n:
    generated_at: "2026-07-12T14:07:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0e817fdd101c3fbe8c3c2aa51ab6a5e8e3bc35ce61376e746b7fceb0b87d0154
    source_path: cli/wiki.md
    workflow: 16
---

# `openclaw wiki`

Periksa dan kelola vault `memory-wiki`. Disediakan oleh plugin `memory-wiki` bawaan.

Terkait: [Plugin Memory Wiki](/id/plugins/memory-wiki), [Ikhtisar Memori](/id/concepts/memory), [CLI: memori](/id/cli/memory)

## Perintah umum

```bash
openclaw wiki status
openclaw wiki doctor
openclaw wiki init
openclaw wiki ingest ./notes/alpha.md
openclaw wiki okf import ./knowledge-catalog/okf/bundles/ga4
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
openclaw wiki chatgpt import --export ./chatgpt-export --dry-run
openclaw wiki chatgpt rollback <run-id>

openclaw wiki obsidian status
openclaw wiki obsidian search "alpha"
openclaw wiki obsidian open syntheses/alpha-summary.md
openclaw wiki obsidian command workspace:quick-switcher
openclaw wiki obsidian daily
```

## Pemilihan agen

Saat `plugins.entries.memory-wiki.config.vault.scope` bernilai `agent`, pilih
vault dengan opsi tingkat teratas `--agent <id>`:

```bash
openclaw wiki --agent support status
openclaw wiki --agent support search "refund policy"
openclaw wiki --agent marketing ingest ./campaign-notes.md
```

Dalam penyiapan dengan beberapa agen yang dikonfigurasi, `--agent` diwajibkan untuk operasi CLI agar perintah tidak dapat membaca atau menulis vault default secara sembarang. Jika hanya satu agen yang dikonfigurasi, agen tersebut tetap menjadi default. ID agen yang tidak dikenal menyebabkan kegagalan sebelum operasi vault dimulai. Opsi ini tidak mengubah jalur yang dipilih saat `vault.scope` bernilai `global`.

Klien Gateway mengikuti aturan yang sama: teruskan `agentId` pada permintaan `wiki.*` berbasis vault dalam penyiapan multiagen dengan cakupan agen. ID yang tidak ada atau tidak dikenal merupakan kesalahan. Giliran agen, alat wiki, pelengkap korpus memori, dan ringkasan prompt terkompilasi sudah membawa konteks agen runtime yang aktif.

## Perintah

### `wiki status`

Tampilkan mode dan cakupan vault, agen yang ditetapkan, kesehatan, serta ketersediaan CLI Obsidian. Gunakan ini terlebih dahulu untuk memeriksa apakah vault yang dimaksud telah diinisialisasi, mode jembatan dalam kondisi sehat, atau integrasi Obsidian tersedia.

Saat mode jembatan aktif dan dikonfigurasi untuk membaca artefak memori, perintah ini mengueri Gateway yang sedang berjalan sehingga melihat konteks plugin memori aktif yang sama dengan memori agen/runtime.

### `wiki doctor`

Jalankan pemeriksaan kesehatan wiki dan laporkan perbaikan yang dapat ditindaklanjuti. Keluar dengan kode bukan nol saat tidak sehat.

Saat mode jembatan aktif dan dikonfigurasi untuk membaca artefak memori, perintah ini mengueri Gateway yang sedang berjalan sebelum membuat laporan. Impor jembatan yang dinonaktifkan dan konfigurasi jembatan yang tidak membaca artefak memori tetap berjalan secara lokal/luring.

Masalah umum:

- mode jembatan diaktifkan tanpa artefak memori publik
- tata letak vault tidak valid atau tidak ada
- CLI Obsidian eksternal tidak ada saat mode Obsidian diharapkan

### `wiki init`

Buat tata letak vault wiki dan halaman awal, termasuk indeks tingkat teratas dan direktori cache.

### `wiki ingest <path>`

Impor berkas Markdown atau teks lokal ke folder `sources/` wiki sebagai halaman sumber. `<path>` harus berupa jalur berkas lokal; saat ini tidak ada penyerapan URL. Menolak berkas biner.

Halaman sumber yang diimpor membawa frontmatter asal-usul (`sourceType: local-file`, `sourcePath`, `ingestedAt`). Penyerapan selalu mengompilasi ulang vault setelahnya.

Flag: `--title <title>` mengganti judul sumber (default: diturunkan dari nama berkas).

### `wiki okf import <path>`

Impor bundel Open Knowledge Format yang telah diekstrak ke halaman konsep wiki.

Pengimpor membaca setiap dokumen konsep `.md` yang tidak dicadangkan dalam struktur direktori OKF, mewajibkan kolom `type` yang tidak kosong, dan memperlakukan nilai `type` OKF yang tidak dikenal sebagai konsep generik. Berkas OKF `index.md` dan `log.md` yang dicadangkan tidak diimpor sebagai konsep.

Halaman yang diimpor diratakan di bawah `concepts/` sehingga alur kompilasi, pencarian, pengambilan, ringkasan, dan dasbor wiki yang sudah ada dapat langsung melihatnya. ID konsep OKF asli, `type`, `resource`, `tags`, stempel waktu, jalur sumber, dan frontmatter lengkap dipertahankan dalam frontmatter halaman. Tautan Markdown OKF internal ditulis ulang ke halaman wiki yang dihasilkan; tautan rusak atau eksternal dibiarkan tidak berubah. Impor selalu mengompilasi ulang vault setelahnya.

Contoh:

```bash
openclaw wiki okf import ./bundles/ga4
openclaw wiki okf import ./bundles/ga4 --json
openclaw wiki search "BigQuery Table" --mode source-evidence --json
openclaw wiki get <path-from-json-result>
```

### `wiki compile`

Bangun ulang indeks, blok terkait, dasbor, dan ringkasan terkompilasi. Menulis artefak stabil untuk mesin di:

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

Jika `render.createDashboards` diaktifkan, kompilasi juga menyegarkan halaman laporan.

### `wiki lint`

Periksa vault dan tulis laporan yang mencakup:

- masalah struktural (tautan rusak, ID tidak ada/duplikat, jenis atau judul halaman tidak ada, frontmatter tidak valid)
- kesenjangan asal-usul (ID sumber tidak ada, asal-usul impor tidak ada)
- kontradiksi (kontradiksi yang ditandai, klaim yang bertentangan)
- pertanyaan terbuka
- halaman dan klaim dengan tingkat keyakinan rendah
- halaman dan klaim usang

Jalankan ini setelah pembaruan wiki yang berarti.

### `wiki search <query>`

Cari konten wiki. Perilaku bergantung pada konfigurasi:

- `search.backend`: `shared` atau `local`
- `search.corpus`: `wiki`, `memory`, atau `all`
- `--mode`: `auto`, `find-person`, `route-question`, `source-evidence`, atau `raw-claim`

Gunakan `wiki search` untuk pemeringkatan dan asal-usul khusus wiki. Untuk satu kali pencarian ingatan bersama yang luas, pilih `openclaw memory search` saat plugin memori aktif menyediakan pencarian bersama.

Mode pencarian:

- `find-person`: alias, nama pengguna, akun sosial, ID kanonis, dan halaman orang
- `route-question`: petunjuk pihak yang harus ditanya/kegunaan terbaik dan konteks hubungan
- `source-evidence`: halaman sumber dan kolom bukti terstruktur
- `raw-claim`: teks klaim terstruktur dengan metadata klaim/bukti

Contoh:

```bash
openclaw wiki search "bgroux" --mode find-person
openclaw wiki search "who knows Teams rollout?" --mode route-question
openclaw wiki search "maintainer-whois" --mode source-evidence
openclaw wiki search "strong route Teams" --mode raw-claim --json
```

Keluaran teks menyertakan baris `Claim:` dan `Evidence:` saat hasil cocok dengan klaim terstruktur. Keluaran JSON juga mengekspos `matchedClaimId`, `matchedClaimStatus`, `matchedClaimConfidence`, `evidenceKinds`, dan `evidenceSourceIds` untuk penelusuran mendalam di sisi agen.

### `wiki get <lookup>`

Baca halaman wiki berdasarkan ID atau jalur relatif.

```bash
openclaw wiki get entity.alpha
openclaw wiki get syntheses/alpha-summary.md --from 1 --lines 80
```

### `wiki apply`

Terapkan perubahan terbatas tanpa pembedahan halaman bebas:

- `apply synthesis <title>`: buat atau segarkan halaman sintesis dengan isi ringkasan terkelola
- `apply metadata <lookup>`: perbarui metadata pada halaman yang sudah ada

Keduanya menerima `--source-id`, `--contradiction`, `--question` (masing-masing dapat diulang), `--confidence <n>` (0-1), dan `--status <status>`. `apply metadata` juga menerima `--clear-confidence` untuk menghapus nilai keyakinan yang tersimpan. Ini adalah cara yang didukung untuk mengembangkan halaman wiki agar blok terkelola yang dihasilkan tetap utuh.

### `wiki bridge import`

Impor artefak memori publik dari plugin memori aktif ke halaman sumber berbasis jembatan. Gunakan ini dalam mode `bridge` untuk mengambil artefak memori terbaru yang diekspor ke vault wiki.

Untuk pembacaan artefak jembatan aktif, CLI merutekan impor melalui RPC Gateway sehingga menggunakan konteks plugin memori runtime. Jika impor jembatan dinonaktifkan atau pembacaan artefak dimatikan, perintah mempertahankan perilaku nol impor lokal/luring. Penyegaran indeks setelah impor dikendalikan oleh `ingest.autoCompile`.

### `wiki unsafe-local import`

Impor dari jalur lokal yang dikonfigurasi secara eksplisit (`unsafeLocal.paths`) dalam mode `unsafe-local`. Sengaja bersifat eksperimental dan hanya untuk mesin yang sama. Penyegaran indeks setelah impor dikendalikan oleh `ingest.autoCompile`.

### `wiki chatgpt import`

Impor ekspor ChatGPT ke halaman sumber draf wiki.

```bash
openclaw wiki chatgpt import --export ./chatgpt-export
openclaw wiki chatgpt import --export ./conversations.json --dry-run
```

| Flag              | Default     | Deskripsi                                                            |
| ----------------- | ----------- | -------------------------------------------------------------------- |
| `--export <path>` | (diwajibkan) | Direktori ekspor ChatGPT atau jalur `conversations.json`.            |
| `--dry-run`       | `false`     | Pratinjau jumlah yang dibuat/diperbarui/dilewati tanpa menulis halaman. |

Impor non-uji coba yang mengubah halaman apa pun mencatat ID proses impor, yang dicetak dalam ringkasan dan diperlukan untuk pengembalian.

### `wiki chatgpt rollback <run-id>`

Kembalikan proses impor ChatGPT yang telah diterapkan sebelumnya, dengan menghapus halaman yang dibuatnya dan memulihkan halaman yang ditimpanya. Tidak melakukan apa pun (dan melaporkan `alreadyRolledBack`) jika proses tersebut sudah dikembalikan.

### `wiki obsidian ...`

Perintah pembantu Obsidian untuk vault yang berjalan dalam mode ramah Obsidian: `status`, `search`, `open`, `command`, `daily`. Perintah ini memerlukan CLI resmi `obsidian` pada `PATH` saat `obsidian.useOfficialCli` diaktifkan.

Validasi konfigurasi menolak `obsidian.useOfficialCli: true` saat
`vault.scope` bernilai `agent` karena `obsidian.vaultName` adalah satu pengaturan global,
bukan pemetaan per agen. Perenderan Markdown yang ramah Obsidian tetap
tersedia.

## Panduan penggunaan praktis

- Gunakan `wiki search` + `wiki get` saat asal-usul dan identitas halaman penting.
- Gunakan `wiki apply` alih-alih mengedit manual bagian terkelola yang dihasilkan.
- Gunakan `wiki lint` sebelum memercayai konten yang bertentangan atau memiliki tingkat keyakinan rendah.
- Gunakan `wiki compile` setelah impor massal atau perubahan sumber saat Anda segera menginginkan dasbor dan ringkasan terkompilasi yang mutakhir.
- Gunakan `wiki okf import` saat katalog data, ekspor dokumentasi, atau alur pengayaan agen sudah menghasilkan bundel Markdown OKF.
- Gunakan `wiki bridge import` saat mode jembatan bergantung pada artefak memori yang baru diekspor.

## Kaitan konfigurasi

Perilaku `openclaw wiki` dibentuk oleh:

- `plugins.entries.memory-wiki.config.vaultMode`
- `plugins.entries.memory-wiki.config.vault.scope`
- `plugins.entries.memory-wiki.config.vault.path`
- `plugins.entries.memory-wiki.config.search.backend`
- `plugins.entries.memory-wiki.config.search.corpus`
- `plugins.entries.memory-wiki.config.bridge.*`
- `plugins.entries.memory-wiki.config.obsidian.*`
- `plugins.entries.memory-wiki.config.ingest.autoCompile`
- `plugins.entries.memory-wiki.config.render.*`
- `plugins.entries.memory-wiki.config.context.includeCompiledDigestPrompt`

Lihat [Plugin Memory Wiki](/id/plugins/memory-wiki) untuk model konfigurasi lengkap.

## Terkait

- [Referensi CLI](/id/cli)
- [Wiki memori](/id/plugins/memory-wiki)
