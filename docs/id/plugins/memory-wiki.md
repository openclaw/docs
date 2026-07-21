---
read_when:
    - Anda menginginkan pengetahuan persisten yang melampaui catatan MEMORY.md biasa
    - Anda sedang mengonfigurasi plugin memory-wiki bawaan
    - Anda memerlukan vault wiki terpisah untuk agen dalam satu Gateway
    - Anda ingin memahami wiki_search, wiki_get, atau mode bridge
summary: 'memory-wiki: brankas pengetahuan terkompilasi dengan asal-usul, klaim, dasbor, dan mode jembatan'
title: Wiki memori
x-i18n:
    generated_at: "2026-07-21T12:20:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: fda3c801ae39b529a3f1fcaf8791b6dcb1d8116ba2e73e99cca62dca6c64140a
    source_path: plugins/memory-wiki.md
    workflow: 16
---

`memory-wiki` adalah plugin bawaan yang mengompilasi pengetahuan tahan lama menjadi
wiki yang dapat dinavigasi: halaman deterministik, klaim terstruktur dengan bukti,
asal-usul, dasbor, dan ringkasan yang dapat dibaca mesin.

Plugin ini tidak menggantikan plugin Active Memory. Pemanggilan kembali, promosi, pengindeksan, dan
Dreaming tetap dikelola oleh backend memori mana pun yang dikonfigurasi
(`memory-core`, QMD, Honcho, dll.). `memory-wiki` berjalan berdampingan dengannya dan mengompilasi
pengetahuan menjadi lapisan wiki yang terpelihara.

Aktifkan plugin sebelum menggunakan CLI, alat, atau integrasi runtime-nya:

```bash
openclaw plugins enable memory-wiki
openclaw gateway restart
```

| Lapisan              | Mengelola                                                                          |
| -------------------- | --------------------------------------------------------------------------------- |
| Plugin Active Memory | Pemanggilan kembali, pencarian semantik, promosi, Dreaming, runtime memori        |
| `memory-wiki`        | Halaman wiki terkompilasi, sintesis kaya asal-usul, dasbor, pencarian/ambil/terapkan wiki |

Aturan praktis:

- `memory_search` untuk satu pemanggilan kembali luas di seluruh korpus yang dikonfigurasi
- `wiki_search` / `wiki_get` saat Anda menginginkan pemeringkatan khusus wiki, asal-usul, atau struktur keyakinan tingkat halaman
- `memory_search corpus=all` untuk mencakup kedua lapisan dalam satu panggilan, ketika plugin Active Memory mendukung pemilihan korpus

Penyiapan lokal-utama yang umum: QMD sebagai backend Active Memory untuk pemanggilan kembali, dan
`memory-wiki` dalam mode `bridge` untuk halaman sintesis yang tahan lama. Lihat
contoh mode QMD + bridge di bagian [Konfigurasi](#configuration).

Jika mode bridge melaporkan nol artefak yang diekspor, plugin Active Memory
saat ini tidak mengekspos input bridge publik. Jalankan `openclaw wiki doctor` terlebih dahulu,
lalu pastikan plugin Active Memory mendukung artefak publik.

## Mode vault

- `isolated` (default): vault sendiri, sumber sendiri, tanpa dependensi pada plugin Active Memory. Gunakan ini untuk penyimpanan pengetahuan terkurasi yang mandiri.
- `bridge`: membaca artefak memori publik dan log peristiwa dari plugin Active Memory melalui antarmuka SDK plugin publik. Gunakan ini untuk mengompilasi artefak yang diekspor oleh plugin memori tanpa mengakses internal plugin privat.
- `unsafe-local`: jalur keluar eksplisit pada mesin yang sama untuk jalur lokal privat. Sengaja bersifat eksperimental dan tidak portabel; gunakan hanya jika Anda memahami batas kepercayaan dan secara khusus memerlukan akses sistem berkas lokal yang tidak dapat disediakan oleh mode bridge.

Mode vault dan cakupan vault adalah pilihan yang terpisah:

- `vaultMode` memilih dari mana input wiki berasal.
- `vault.scope` memilih apakah semua agen menggunakan satu vault atau setiap agen mendapatkan vault turunan.

`vault.scope: "global"` adalah default dan mempertahankan perilaku satu vault
yang ada. Gunakan `vault.scope: "agent"` dengan mode `isolated` atau `bridge` ketika
agen tidak boleh berbagi halaman wiki, ringkasan terkompilasi, hasil pencarian, atau penulisan.
Cakupan agen tidak dapat digabungkan dengan mode `unsafe-local` karena jalur privat
yang dikonfigurasi tersebut bukan input milik agen. Validasi konfigurasi menolak
kombinasi ini.

Mode bridge dapat mengindeks, sesuai toggle konfigurasi `bridge.*`:

- artefak memori yang diekspor (`indexMemoryRoot`)
- catatan harian (`indexDailyNotes`)
- laporan Dreaming (`indexDreamReports`)
- log peristiwa memori (`followMemoryEvents`)

Saat mode bridge aktif dan `bridge.readMemoryArtifacts` diaktifkan,
`openclaw wiki status`, `openclaw wiki doctor`, dan `openclaw wiki bridge
import` dirutekan melalui Gateway yang berjalan agar melihat konteks plugin Active Memory
yang sama dengan memori agen/runtime. Jika bridge dinonaktifkan atau pembacaan
artefak dimatikan, perintah tersebut mempertahankan perilaku lokal/luring.

## Tata letak vault

```text
<vault>/
  AGENTS.md
  WIKI.md
  index.md
  inbox.md
  entities/
  concepts/
  syntheses/
  sources/
  reports/
  _attachments/
  _views/
  .openclaw-wiki/
```

Konten terkelola tetap berada di dalam blok yang dihasilkan; blok catatan manusia
dipertahankan selama regenerasi.

- `sources/`: materi mentah yang diimpor dan halaman yang didukung bridge/unsafe-local
- `entities/`: hal, orang, sistem, proyek, dan objek yang tahan lama
- `concepts/`: gagasan, abstraksi, pola, kebijakan (juga menjadi tujuan impor OKF)
- `syntheses/`: ringkasan terkompilasi dan rekapitulasi yang terpelihara
- `reports/`: dasbor yang dihasilkan

## Impor Open Knowledge Format

```bash
openclaw wiki okf import ./bundles/ga4
```

Impor bundel Open Knowledge Format yang telah diekstrak ke halaman konsep wiki. Sangat
cocok ketika katalog data, perayap dokumentasi, atau agen pengayaan telah
menghasilkan OKF: pertahankan OKF sebagai artefak pertukaran portabel, lalu biarkan `memory-wiki`
mengubahnya menjadi halaman konsep asli OpenClaw dan ringkasan terkompilasi.

- berkas `.md` yang tidak dicadangkan adalah dokumen konsep
- setiap konsep yang diimpor memerlukan bidang frontmatter `type` yang tidak kosong; `type` yang tidak ada menghasilkan peringatan `missing-type` dan berkas dilewati
- nilai `type` yang tidak dikenal diterima sebagai konsep generik
- `index.md` dan `log.md` dicadangkan dan tidak pernah diimpor sebagai konsep
- tautan markdown yang rusak atau eksternal dibiarkan tidak berubah

Halaman yang diimpor diratakan di bawah `concepts/` agar alur kompilasi, pencarian, pengambilan, dan
dasbor yang ada dapat melihatnya tanpa pohon wiki kedua. Setiap halaman mempertahankan
ID konsep OKF asli, jalur sumber, `type`, `resource`, `tags`, stempel waktu,
dan seluruh frontmatter produsen. Tautan OKF internal ditulis ulang ke halaman
konsep wiki yang dihasilkan dan juga menghasilkan entri `relationships` terstruktur dengan
`kind: okf-link`.

## Klaim dan bukti terstruktur

Halaman membawa frontmatter `claims` terstruktur, bukan hanya teks bebas. Setiap
klaim dapat mencakup `id`, `text`, `status`, `confidence`, `evidence[]`, dan
`updatedAt`. Setiap entri bukti dapat mencakup `kind`, `sourceId`, `path`,
`lines`, `weight`, `confidence`, `privacyTier`, `note`, dan `updatedAt`.

Hal ini membuat wiki berperilaku seperti lapisan keyakinan, bukan tempat pembuangan catatan pasif.
Klaim dapat dilacak, dinilai, disanggah, dan ditelusuri kembali ke sumbernya untuk diselesaikan.

## Metadata entitas untuk agen

Halaman entitas membawa metadata perutean generik yang dapat digunakan untuk orang, tim,
sistem, proyek, atau jenis entitas lainnya:

- `entityType`: misalnya `person`, `team`, `system`, `project`
- `canonicalId`: kunci identitas stabil di seluruh alias dan impor
- `aliases`: nama, handle, atau label yang mengarah ke halaman yang sama
- `privacyTier`: string bebas; `public` dianggap tidak memerlukan review, nilai lainnya (misalnya `local-private`, `sensitive`, `confirm-before-use`) ditandai dalam `reports/privacy-review.md`
- `bestUsedFor` / `notEnoughFor`: petunjuk perutean ringkas
- `lastRefreshedAt`: stempel waktu penyegaran sumber, terpisah dari waktu pengeditan halaman
- `personCard`: kartu perutean opsional khusus orang (handle, media sosial, email, zona waktu, jalur, hal yang dapat diminta, hal yang sebaiknya tidak diminta, tingkat keyakinan, tingkat privasi)
- `relationships`: edge bertipe ke halaman terkait (target, jenis, bobot, tingkat keyakinan, jenis bukti, tingkat privasi, catatan)

Untuk wiki orang, mulai dengan `reports/person-agent-directory.md`, lalu buka
halaman orang tersebut dengan `wiki_get` sebelum menggunakan detail kontak atau fakta
yang disimpulkan.

<Accordion title="Contoh halaman entitas">
```yaml
pageType: entity
entityType: person
id: entity.example-person
canonicalId: maintainer.example-person
aliases:
  - Alex
  - example-handle
privacyTier: local-private
bestUsedFor:
  - Perutean ekosistem contoh
notEnoughFor:
  - persetujuan hukum
lastRefreshedAt: "2026-04-29T00:00:00.000Z"
personCard:
  handles:
    - "@example-handle"
  socials:
    - "https://x.example/example-handle"
  emails:
    - alex@example.com
  timezone: America/Chicago
  lane: Ekosistem contoh
  askFor:
    - Pertanyaan peluncuran contoh
  avoidAskingFor:
    - keputusan penagihan yang tidak terkait
  confidence: 0.8
  privacyTier: confirm-before-use
relationships:
  - targetId: entity.other-person
    targetTitle: Orang Lain
    kind: collaborates-with
    confidence: 0.7
    evidenceKind: discrawl-stat
claims:
  - id: claim.example.routing
    text: Alex berguna untuk perutean ekosistem contoh.
    status: supported
    confidence: 0.9
    evidence:
      - kind: maintainer-whois
        sourceId: source.maintainers
        privacyTier: local-private
```
</Accordion>

## Pipeline kompilasi

Kompilasi membaca halaman wiki, menormalisasi ringkasan, dan menyimpan snapshot untuk mesin
dalam status plugin SQLite bersama milik OpenClaw. Kode runtime menggunakan
snapshot pemilik yang dikelola siklus hidup untuk memuat SQLite selama persiapan prompt asinkron;
perakitan prompt sinkron tidak pernah mengeruk Markdown atau membaca berkas cache.
Output terkompilasi juga mendukung pengindeksan wiki tahap pertama untuk pencarian/pengambilan, pencarian
ID klaim kembali ke halaman pemiliknya, pelengkap prompt ringkas, dan pembuatan
laporan.

Pengeditan sumber dan pemulihan vault baru tersedia untuk mesin setelah
kompilasi berikutnya. Memulai ulang atau menyegarkan siklus hidup plugin membandingkan publikasi
kompilasi vault yang dirantai secara kausal dengan SQLite dan menolak snapshot dari
status lebih baru yang telah di-roll back. Kompilator yang dimulai sebelum rollback tidak dapat
menerbitkan terhadap pendahulu yang dipulihkan. Persiapan prompt tidak melakukan polling terhadap
vault atau memasang pemantau berkas.
Setelah karantina rollback, kompilasi dalam proses yang sedang berjalan segera menghapus pemilik;
proses kompilator terpisah memerlukan penyegaran siklus hidup plugin agar
daemon dapat mengonfirmasi publikasi tahan lama yang baru.
Cache terkompilasi dapat dibangun ulang: baris cache dari sebelum epoch publikasi
dianggap sebagai cache miss dan diganti oleh kompilasi berikutnya; baris tersebut tidak dimigrasikan.

## Dasbor dan laporan kesehatan

Saat `render.createDashboards` diaktifkan, kompilasi memelihara dasbor di bawah
`reports/`:

| Laporan                             | Melacak                                            |
| ----------------------------------- | -------------------------------------------------- |
| `reports/open-questions.md`         | halaman dengan pertanyaan yang belum terselesaikan |
| `reports/contradictions.md`         | klaster catatan kontradiksi                        |
| `reports/low-confidence.md`         | halaman dan klaim dengan tingkat keyakinan rendah  |
| `reports/claim-health.md`           | klaim tanpa bukti terstruktur                      |
| `reports/stale-pages.md`            | kesegaran yang usang atau tidak diketahui          |
| `reports/person-agent-directory.md` | kartu perutean orang/entitas                       |
| `reports/relationship-graph.md`     | edge hubungan terstruktur                          |
| `reports/provenance-coverage.md`    | cakupan kelas bukti                                |
| `reports/privacy-review.md`         | tingkat privasi nonpublik yang perlu direview sebelum digunakan |

## Pencarian dan pengambilan

Dua backend pencarian:

- `shared`: gunakan alur pencarian memori bersama jika tersedia
- `local`: cari wiki secara lokal

Tiga korpus: `wiki`, `memory`, `all`.

- `wiki_search` / `wiki_get` menggunakan ringkasan terkompilasi sebagai tahap pertama jika memungkinkan
- ID klaim mengarah kembali ke halaman pemiliknya
- klaim yang disengketakan/usang/segar memengaruhi pemeringkatan
- label asal-usul tetap dipertahankan dalam hasil

Mode pencarian (parameter `--mode` / alat `mode`):

| Mode              | Peningkatan                                                    |
| ----------------- | -------------------------------------------------------------- |
| `auto`            | default seimbang                                               |
| `find-person`     | entitas mirip manusia, alias, nama pengguna, media sosial, ID kanonis |
| `route-question`  | kartu agen, petunjuk kapan perlu ditanyakan/paling cocok digunakan, konteks hubungan |
| `source-evidence` | halaman sumber dan metadata bukti terstruktur                  |
| `raw-claim`       | pencocokan klaim terstruktur; mengembalikan metadata klaim/bukti |

Saat hasil cocok dengan klaim terstruktur, `wiki_search` mengembalikan
`matchedClaimId`, `matchedClaimStatus`, `matchedClaimConfidence`,
`evidenceKinds`, dan `evidenceSourceIds` dalam payload detailnya. Output teks
menyertakan baris ringkas `Claim:` dan `Evidence:` jika tersedia.

## Alat agen

| Alat          | Tujuan                                                                                                                                                       |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `wiki_status` | mode dan cakupan vault saat ini, agen yang ditetapkan, kesehatan, ketersediaan CLI Obsidian                                                                    |
| `wiki_search` | mencari halaman wiki dan, jika dikonfigurasi, korpus memori bersama; menerima `mode` untuk pencarian orang, perutean pertanyaan, bukti sumber, atau penelusuran mendalam klaim mentah |
| `wiki_get`    | membaca halaman wiki berdasarkan id/jalur, beralih ke korpus memori bersama jika pencarian bersama diaktifkan dan pencarian tidak menemukan hasil             |
| `wiki_apply`  | mutasi sintesis/metadata terbatas tanpa operasi bebas pada halaman                                                                                            |
| `wiki_lint`   | pemeriksaan struktural, kesenjangan asal-usul, kontradiksi, pertanyaan terbuka                                                                                 |

Plugin juga mendaftarkan suplemen korpus memori non-eksklusif, sehingga
`memory_search` dan `memory_get` bersama dapat menjangkau wiki saat Plugin
memori aktif mendukung pemilihan korpus.

## Perilaku prompt dan konteks

Saat `context.includeCompiledDigestPrompt` diaktifkan, bagian prompt memori
menambahkan snapshot terkompilasi yang ringkas dari status Plugin: hanya halaman
teratas, hanya klaim teratas, jumlah kontradiksi, jumlah pertanyaan, serta
kualifikasi keyakinan/kebaruan. Fitur ini bersifat opt-in karena mengubah bentuk
prompt; terutama relevan untuk mesin konteks atau perakitan prompt yang secara
eksplisit menggunakan suplemen memori.

## Konfigurasi

Letakkan konfigurasi di bawah `plugins.entries.memory-wiki.config`:

```json5
{
  plugins: {
    entries: {
      "memory-wiki": {
        enabled: true,
        config: {
          vaultMode: "isolated",
          vault: {
            scope: "global",
            path: "~/.openclaw/wiki/main",
            renderMode: "obsidian",
          },
          obsidian: {
            enabled: true,
            useOfficialCli: true,
            vaultName: "OpenClaw Wiki",
            openAfterWrites: false,
          },
          bridge: {
            enabled: false,
            readMemoryArtifacts: true,
            indexDreamReports: true,
            indexDailyNotes: true,
            indexMemoryRoot: true,
            followMemoryEvents: true,
          },
          unsafeLocal: {
            allowPrivateMemoryCoreAccess: false,
            paths: [],
          },
          ingest: {
            autoCompile: true,
            maxConcurrentJobs: 1,
            allowUrlIngest: true,
          },
          search: {
            backend: "shared",
            corpus: "wiki",
          },
          context: {
            includeCompiledDigestPrompt: false,
          },
          render: {
            preserveHumanBlocks: true,
            createBacklinks: true,
            createDashboards: true,
          },
        },
      },
    },
  },
}
```

Pengaturan utama:

| Kunci                                      | Nilai / default                                | Catatan                                                                       |
| ------------------------------------------ | ---------------------------------------------- | ----------------------------------------------------------------------------- |
| `vaultMode`                                | `isolated` (default), `bridge`, `unsafe-local` | memilih perilaku input dan integrasi                                          |
| `vault.scope`                              | `global` (default), `agent`                    | satu vault bersama atau satu vault anak per agen                              |
| `vault.path`                               | default global `~/.openclaw/wiki/main`         | vault yang tepat secara global; induk cakupan agen secara default adalah `~/.openclaw/wiki` |
| `vault.renderMode`                         | `native` (default), `obsidian`                 |                                                                               |
| `bridge.readMemoryArtifacts`               | default `true`                                 | mengimpor artefak publik Plugin memori aktif                                  |
| `bridge.followMemoryEvents`                | default `true`                                 | menyertakan log peristiwa dalam mode bridge                                   |
| `unsafeLocal.allowPrivateMemoryCoreAccess` | default `false`                                | diperlukan untuk menjalankan impor `unsafe-local`                             |
| `unsafeLocal.paths`                        | default `[]`                                   | jalur lokal eksplisit untuk diimpor dalam mode `unsafe-local`                 |
| `search.backend`                           | `shared` (default), `local`                    |                                                                               |
| `search.corpus`                            | `wiki` (default), `memory`, `all`              |                                                                               |
| `context.includeCompiledDigestPrompt`      | default `false`                                | menambahkan snapshot ringkas agen yang dipilih ke bagian prompt memori        |
| `render.createBacklinks`                   | default `true`                                 | menghasilkan blok terkait yang deterministik                                 |
| `render.createDashboards`                  | default `true`                                 | menghasilkan halaman dasbor                                                   |

### Vault per agen

Atur `vault.scope` ke `agent` untuk memberikan wiki terpisah kepada setiap agen yang dikonfigurasi.
Dalam cakupan ini, `vault.path` adalah direktori induk dan OpenClaw menambahkan
id agen yang telah dinormalisasi:

```json5
{
  agents: {
    list: [{ id: "support" }, { id: "marketing" }],
  },
  plugins: {
    entries: {
      "memory-wiki": {
        enabled: true,
        config: {
          vaultMode: "bridge",
          vault: {
            scope: "agent",
            path: "~/.openclaw/wiki",
          },
          bridge: {
            enabled: true,
            readMemoryArtifacts: true,
          },
        },
      },
    },
  },
}
```

Ini ditetapkan menjadi `~/.openclaw/wiki/support` dan
`~/.openclaw/wiki/marketing`. Jika `vault.path` dihilangkan dalam cakupan agen,
induk secara default menjadi `~/.openclaw/wiki`. Oleh karena itu, agen `main` default tetap
menggunakan jalur `~/.openclaw/wiki/main` yang ada.

Alat agen, ringkasan prompt terkompilasi, dan suplemen wiki yang diekspos melalui
`memory_search` / `memory_get` menetapkan vault dari konteks agen aktif.
Untuk panggilan CLI dan Gateway dalam pengaturan dengan beberapa agen yang dikonfigurasi, berikan
agen secara eksplisit dengan `openclaw wiki --agent <agentId> ...` atau `agentId` milik permintaan
Gateway. Satu agen yang dikonfigurasi tetap menjadi default jika tidak ada id yang
diberikan.

Dalam mode bridge, impor dengan cakupan agen hanya menerima artefak memori publik jika
`agentIds`-nya menyertakan agen yang dipilih. Artefak yang dimiliki agen lain,
tanpa metadata kepemilikan, atau dengan pemilik yang tidak diketahui akan dilewati. Cakupan global
mempertahankan perilaku artefak bersama yang ada.

<Warning>
Mengubah `vault.scope` tidak menyalin atau memisahkan vault yang ada. Dalam cakupan agen,
`vault.path` yang dikonfigurasi secara eksplisit menjadi direktori induk, jadi pindahkan atau
impor halaman yang ada secara sengaja sebelum mengganti agen produksi. Cadangkan
vault terlebih dahulu.

Vault per agen adalah batas pengetahuan dalam proses yang sama, bukan batas keamanan
sistem operasi. Plugin dan alat tanpa sandbox yang memiliki akses ke sistem berkas host
masih dapat membaca direktori agen lain. Gunakan [sandboxing](/id/gateway/sandboxing) atau
[profil Gateway terpisah](/id/gateway/multiple-gateways) jika agen tidak saling
memercayai.
</Warning>

### Contoh: QMD + mode bridge

Gunakan ini saat Anda menginginkan QMD untuk pengingatan dan `memory-wiki` untuk lapisan
pengetahuan yang dipelihara. Setiap lapisan tetap terfokus: QMD menjaga agar catatan mentah, ekspor
sesi, dan koleksi tambahan dapat dicari, sedangkan `memory-wiki` mengompilasi
entitas stabil, klaim, dasbor, dan halaman sumber.

```json5
{
  memory: {
    backend: "qmd",
  },
  plugins: {
    entries: {
      "memory-wiki": {
        enabled: true,
        config: {
          vaultMode: "bridge",
          bridge: {
            enabled: true,
            readMemoryArtifacts: true,
            indexDreamReports: true,
            indexDailyNotes: true,
            indexMemoryRoot: true,
            followMemoryEvents: true,
          },
          search: {
            backend: "shared",
            corpus: "all",
          },
          context: {
            includeCompiledDigestPrompt: false,
          },
        },
      },
    },
  },
}
```

Ini membuat QMD tetap menangani pengingatan memori aktif, `memory-wiki` berfokus pada
halaman terkompilasi dan dasbor, serta mempertahankan bentuk prompt tanpa perubahan hingga Anda
secara sengaja mengaktifkan prompt ringkasan terkompilasi.

## CLI

```bash
openclaw wiki status
openclaw wiki doctor
openclaw wiki init
openclaw wiki ingest ./notes/alpha.md
openclaw wiki compile
openclaw wiki lint
openclaw wiki search "alpha"
openclaw wiki get entity.alpha
openclaw wiki apply synthesis "Alpha Summary" --body "..." --source-id source.alpha
openclaw wiki bridge import
openclaw wiki obsidian status
```

Lihat [CLI: wiki](/id/cli/wiki) untuk referensi perintah lengkap, termasuk
`wiki okf import`, `wiki apply metadata`, `wiki unsafe-local import`,
`wiki chatgpt import` / `wiki chatgpt rollback`, dan rangkaian lengkap subperintah
`wiki obsidian`.

## Dukungan Obsidian

Saat `vault.renderMode` bernilai `obsidian`, Plugin menulis Markdown yang ramah
Obsidian dan dapat secara opsional menggunakan CLI resmi `obsidian` untuk pemeriksaan
status, pencarian vault, membuka halaman, menjalankan perintah, dan beralih ke
catatan harian. Fitur ini opsional; wiki tetap berfungsi dalam mode asli tanpa
Obsidian.

Vault dengan cakupan agen tetap dapat menggunakan Markdown yang ramah Obsidian, tetapi validasi
konfigurasi menolak `obsidian.useOfficialCli: true` dengan `vault.scope: "agent"`.
Pengaturan `obsidian.vaultName` saat ini bersifat global dan tidak dapat memilih vault
Obsidian yang berbeda untuk setiap agen. Sebagai gantinya, gunakan alat wiki dan operasi CLI,
atau pertahankan wiki yang dioperasikan Obsidian dalam cakupan global.

## Alur kerja yang direkomendasikan

<Steps>
<Step title="Pertahankan plugin memori aktif untuk mengingat kembali">
Proses mengingat kembali, promosi, dan Dreaming tetap dikelola oleh backend memori yang dikonfigurasi.
</Step>
<Step title="Aktifkan memory-wiki">
Mulai dengan mode `isolated` kecuali jika Anda secara eksplisit menginginkan mode jembatan.
</Step>
<Step title="Gunakan wiki_search / wiki_get saat asal-usul informasi penting">
Utamakan alat ini daripada `memory_search` jika Anda menginginkan pemeringkatan khusus wiki atau struktur keyakinan tingkat halaman.
</Step>
<Step title="Gunakan wiki_apply untuk sintesis terbatas atau pembaruan metadata">
Hindari mengedit blok terkelola yang dihasilkan secara manual.
</Step>
<Step title="Jalankan wiki_lint setelah perubahan yang bermakna">
Mendeteksi kontradiksi, pertanyaan terbuka, dan kesenjangan asal-usul informasi.
</Step>
<Step title="Aktifkan dasbor untuk melihat informasi usang/kontradiksi">
Tetapkan `render.createDashboards: true` (default).
</Step>
</Steps>

## Dokumentasi terkait

- [Ikhtisar Memori](/id/concepts/memory)
- [CLI: memori](/id/cli/memory)
- [CLI: wiki](/id/cli/wiki)
- [Ikhtisar SDK Plugin](/id/plugins/sdk-overview)
