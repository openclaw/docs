---
read_when:
    - Anda menginginkan pengetahuan persisten yang melampaui catatan biasa di MEMORY.md
    - Anda sedang mengonfigurasi plugin memory-wiki bawaan
    - Anda memerlukan vault wiki terpisah untuk agen dalam satu Gateway
    - Anda ingin memahami wiki_search, wiki_get, atau mode bridge
summary: 'memory-wiki: brankas pengetahuan terkompilasi dengan asal-usul, klaim, dasbor, dan mode jembatan'
title: Wiki memori
x-i18n:
    generated_at: "2026-07-19T05:05:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: cba1a17dc6a6021df51ebc8028663034bb82909aafd9e8e5716fca3a8ea3d03a
    source_path: plugins/memory-wiki.md
    workflow: 16
---

`memory-wiki` adalah plugin terbundel yang mengompilasi pengetahuan persisten menjadi
wiki yang dapat dinavigasi: halaman deterministik, klaim terstruktur dengan bukti,
asal-usul, dasbor, dan ringkasan yang dapat dibaca mesin.

Plugin ini tidak menggantikan plugin Active Memory. Pengingatan, promosi, pengindeksan, dan
Dreaming tetap dikelola oleh backend memori mana pun yang dikonfigurasi
(`memory-core`, QMD, Honcho, dll.). `memory-wiki` berada di sampingnya dan mengompilasi
pengetahuan menjadi lapisan wiki yang dipelihara.

| Lapisan              | Mengelola                                                                          |
| -------------------- | --------------------------------------------------------------------------------- |
| Plugin Active Memory | Pengingatan, pencarian semantik, promosi, Dreaming, runtime memori                 |
| `memory-wiki`        | Halaman wiki terkompilasi, sintesis kaya asal-usul, dasbor, pencarian/pengambilan/penerapan wiki |

Aturan praktis:

- `memory_search` untuk satu kali pengingatan luas di seluruh korpus yang dikonfigurasi
- `wiki_search` / `wiki_get` saat Anda menginginkan pemeringkatan khusus wiki, asal-usul, atau struktur keyakinan tingkat halaman
- `memory_search corpus=all` untuk mencakup kedua lapisan dalam satu panggilan, saat plugin Active Memory mendukung pemilihan korpus

Penyiapan umum yang mengutamakan penggunaan lokal: QMD sebagai backend Active Memory untuk pengingatan, dan
`memory-wiki` dalam mode `bridge` untuk halaman hasil sintesis yang persisten. Lihat
contoh QMD + mode jembatan di bagian [Konfigurasi](#configuration).

Jika mode jembatan melaporkan nol artefak yang diekspor, plugin Active Memory
saat ini tidak mengekspos masukan jembatan publik. Jalankan `openclaw wiki doctor` terlebih dahulu,
lalu pastikan plugin Active Memory mendukung artefak publik.

## Mode vault

- `isolated` (default): vault sendiri, sumber sendiri, tanpa dependensi pada plugin Active Memory. Gunakan ini untuk penyimpanan pengetahuan terkurasi yang mandiri.
- `bridge`: membaca artefak memori publik dan log peristiwa dari plugin Active Memory melalui sambungan SDK plugin publik. Gunakan ini untuk mengompilasi artefak yang diekspor plugin memori tanpa mengakses bagian internal privat plugin.
- `unsafe-local`: jalur keluar eksplisit pada mesin yang sama untuk path lokal privat. Sengaja bersifat eksperimental dan tidak portabel; gunakan hanya saat Anda memahami batas kepercayaan dan secara khusus memerlukan akses sistem berkas lokal yang tidak dapat disediakan mode jembatan.

Mode vault dan cakupan vault merupakan pilihan yang terpisah:

- `vaultMode` memilih dari mana masukan wiki berasal.
- `vault.scope` memilih apakah semua agen menggunakan satu vault atau setiap agen mendapatkan vault turunan.

`vault.scope: "global"` adalah default dan mempertahankan perilaku satu vault yang sudah ada.
Gunakan `vault.scope: "agent"` dengan mode `isolated` atau `bridge` saat
agen tidak boleh berbagi halaman wiki, ringkasan terkompilasi, hasil pencarian, atau penulisan.
Cakupan agen tidak dapat digabungkan dengan mode `unsafe-local` karena path privat
yang dikonfigurasi tersebut bukan masukan milik agen. Validasi konfigurasi menolak
kombinasi ini.

Mode jembatan dapat mengindeks, sesuai pengalih konfigurasi `bridge.*`:

- artefak memori yang diekspor (`indexMemoryRoot`)
- catatan harian (`indexDailyNotes`)
- laporan Dreaming (`indexDreamReports`)
- log peristiwa memori (`followMemoryEvents`)

Saat mode jembatan aktif dan `bridge.readMemoryArtifacts` diaktifkan,
`openclaw wiki status`, `openclaw wiki doctor`, dan `openclaw wiki bridge
import` dirutekan melalui Gateway yang sedang berjalan agar melihat konteks plugin Active Memory yang sama
seperti memori agen/runtime. Jika jembatan dinonaktifkan atau pembacaan artefak
dimatikan, perintah tersebut mempertahankan perilaku lokal/luring.

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

- `sources/`: materi mentah yang diimpor dan halaman yang didukung jembatan/lokal-tidak-aman
- `entities/`: hal, orang, sistem, proyek, dan objek yang persisten
- `concepts/`: gagasan, abstraksi, pola, kebijakan (juga menjadi lokasi tujuan impor OKF)
- `syntheses/`: ringkasan terkompilasi dan rangkuman yang dipelihara
- `reports/`: dasbor yang dihasilkan

## Impor Open Knowledge Format

```bash
openclaw wiki okf import ./bundles/ga4
```

Impor bundel Open Knowledge Format yang telah diekstrak ke halaman konsep wiki. Sangat
cocok saat katalog data, perayap dokumentasi, atau agen pengayaan sudah
menghasilkan OKF: pertahankan OKF sebagai artefak pertukaran portabel, lalu biarkan `memory-wiki`
mengubahnya menjadi halaman konsep asli OpenClaw dan ringkasan terkompilasi.

- berkas `.md` yang tidak dicadangkan merupakan dokumen konsep
- setiap konsep yang diimpor memerlukan kolom frontmatter `type` yang tidak kosong; `type` yang tidak ada menghasilkan peringatan `missing-type` dan berkas dilewati
- nilai `type` yang tidak dikenal diterima sebagai konsep generik
- `index.md` dan `log.md` dicadangkan dan tidak pernah diimpor sebagai konsep
- tautan markdown yang rusak atau eksternal dibiarkan tidak berubah

Halaman yang diimpor diratakan di bawah `concepts/` agar alur kompilasi, pencarian, pengambilan, dan
dasbor yang sudah ada dapat melihatnya tanpa pohon wiki kedua. Setiap halaman mempertahankan
ID konsep OKF asli, path sumber, `type`, `resource`, `tags`, stempel waktu,
dan seluruh frontmatter produsen. Tautan internal OKF ditulis ulang ke halaman
konsep wiki yang dihasilkan dan juga memancarkan entri `relationships` terstruktur dengan
`kind: okf-link`.

## Klaim dan bukti terstruktur

Halaman membawa frontmatter `claims` terstruktur, bukan hanya teks bebas. Setiap
klaim dapat menyertakan `id`, `text`, `status`, `confidence`, `evidence[]`, dan
`updatedAt`. Setiap entri bukti dapat menyertakan `kind`, `sourceId`, `path`,
`lines`, `weight`, `confidence`, `privacyTier`, `note`, dan `updatedAt`.

Hal ini membuat wiki berfungsi sebagai lapisan keyakinan, bukan sekadar tempat pembuangan catatan pasif.
Klaim dapat dilacak, dinilai, diperdebatkan, dan ditelusuri kembali ke sumbernya.

## Metadata entitas untuk agen

Halaman entitas membawa metadata perutean generik yang dapat digunakan untuk orang, tim,
sistem, proyek, atau jenis entitas lainnya:

- `entityType`: misalnya `person`, `team`, `system`, `project`
- `canonicalId`: kunci identitas stabil di seluruh alias dan impor
- `aliases`: nama, handle, atau label yang mengarah ke halaman yang sama
- `privacyTier`: string berformat bebas; `public` diperlakukan sebagai tidak perlu ditinjau, nilai lainnya (misalnya `local-private`, `sensitive`, `confirm-before-use`) ditandai dalam `reports/privacy-review.md`
- `bestUsedFor` / `notEnoughFor`: petunjuk perutean ringkas
- `lastRefreshedAt`: stempel waktu penyegaran sumber, terpisah dari waktu penyuntingan halaman
- `personCard`: kartu perutean khusus orang yang opsional (handle, media sosial, email, zona waktu, jalur, hal yang dapat ditanyakan, hal yang perlu dihindari untuk ditanyakan, keyakinan, tingkat privasi)
- `relationships`: sisi bertipe ke halaman terkait (target, jenis, bobot, keyakinan, jenis bukti, tingkat privasi, catatan)

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

Kompilasi membaca halaman wiki, menormalisasi ringkasan, dan mempertahankan snapshot untuk mesin
dalam status plugin SQLite bersama milik OpenClaw. Kode runtime menggunakan
snapshot pemilik yang dikelola siklus hidup untuk memuat SQLite selama penyiapan prompt asinkron;
perakitan prompt sinkron tidak pernah mengikis Markdown atau membaca berkas cache.
Keluaran terkompilasi juga mendukung pengindeksan wiki tahap pertama untuk pencarian/pengambilan, pencarian ID
klaim kembali ke halaman pemiliknya, pelengkap prompt ringkas, dan pembuatan
laporan.

Penyuntingan sumber dan pemulihan vault tersedia bagi mesin hanya setelah
kompilasi berikutnya. Memulai ulang atau menyegarkan siklus hidup plugin akan membandingkan publikasi
kompilasi vault yang dirantai secara kausal dengan SQLite dan menolak snapshot dari
status lebih baru yang telah di-rollback. Kompiler yang dimulai sebelum rollback tidak dapat
menerbitkan terhadap pendahulu yang dipulihkan. Penyiapan prompt tidak melakukan polling pada
vault atau memasang pemantau berkas.
Setelah karantina rollback, kompilasi dalam proses yang berjalan langsung menghapus pemilik;
proses kompiler terpisah memerlukan penyegaran siklus hidup plugin agar
daemon dapat mengonfirmasi publikasi persisten yang baru.
Cache terkompilasi dapat dibangun ulang: baris cache dari sebelum epoch publikasi
diperlakukan sebagai miss dan digantikan oleh kompilasi berikutnya; baris tersebut tidak dimigrasikan.

## Dasbor dan laporan kesehatan

Saat `render.createDashboards` diaktifkan, kompilasi memelihara dasbor di bawah
`reports/`:

| Laporan                             | Melacak                                            |
| ----------------------------------- | -------------------------------------------------- |
| `reports/open-questions.md`         | halaman dengan pertanyaan yang belum terselesaikan |
| `reports/contradictions.md`         | klaster catatan kontradiksi                        |
| `reports/low-confidence.md`         | halaman dan klaim berkeyakinan rendah              |
| `reports/claim-health.md`           | klaim tanpa bukti terstruktur                      |
| `reports/stale-pages.md`            | kesegaran yang kedaluwarsa atau tidak diketahui    |
| `reports/person-agent-directory.md` | kartu perutean orang/entitas                       |
| `reports/relationship-graph.md`     | sisi hubungan terstruktur                          |
| `reports/provenance-coverage.md`    | cakupan kelas bukti                                |
| `reports/privacy-review.md`         | tingkat privasi nonpublik yang perlu ditinjau sebelum digunakan |

## Pencarian dan pengambilan

Dua backend pencarian:

- `shared`: gunakan alur pencarian memori bersama jika tersedia
- `local`: cari wiki secara lokal

Tiga korpus: `wiki`, `memory`, `all`.

- `wiki_search` / `wiki_get` menggunakan ringkasan terkompilasi sebagai tahap pertama jika memungkinkan
- ID klaim mengarah kembali ke halaman pemiliknya
- klaim yang diperdebatkan/kedaluwarsa/segar memengaruhi pemeringkatan
- label asal-usul tetap dipertahankan dalam hasil

Mode pencarian (parameter `--mode` / alat `mode`):

| Mode              | Peningkatan                                                    |
| ----------------- | -------------------------------------------------------------- |
| `auto`            | default seimbang                                               |
| `find-person`     | entitas menyerupai orang, alias, handle, media sosial, ID kanonis |
| `route-question`  | kartu agen, petunjuk untuk ditanyakan/paling cocok digunakan untuk, konteks hubungan |
| `source-evidence` | halaman sumber dan metadata bukti terstruktur                  |
| `raw-claim`       | klaim terstruktur yang cocok; mengembalikan metadata klaim/bukti |

Ketika hasil cocok dengan klaim terstruktur, `wiki_search` mengembalikan
`matchedClaimId`, `matchedClaimStatus`, `matchedClaimConfidence`,
`evidenceKinds`, dan `evidenceSourceIds` dalam payload detailnya. Output teks
menyertakan baris ringkas `Claim:` dan `Evidence:` jika tersedia.

## Alat agen

| Alat          | Tujuan                                                                                                                                                       |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `wiki_status` | mode dan cakupan vault saat ini, agen yang telah diresolusi, kesehatan, ketersediaan CLI Obsidian                                                                               |
| `wiki_search` | mencari halaman wiki dan, jika dikonfigurasi, korpus memori bersama; menerima `mode` untuk pencarian orang, perutean pertanyaan, bukti sumber, atau penelusuran mendalam klaim mentah |
| `wiki_get`    | membaca halaman wiki berdasarkan id/path, dengan fallback ke korpus memori bersama ketika pencarian bersama diaktifkan dan pencarian tidak menemukan hasil                                     |
| `wiki_apply`  | mutasi sintesis/metadata terbatas tanpa pembedahan halaman bebas                                                                                             |
| `wiki_lint`   | pemeriksaan struktural, kesenjangan asal-usul, kontradiksi, pertanyaan terbuka                                                                                            |

Plugin ini juga mendaftarkan pelengkap korpus memori non-eksklusif, sehingga
`memory_search` dan `memory_get` bersama dapat menjangkau wiki ketika Plugin memori aktif
mendukung pemilihan korpus.

## Perilaku prompt dan konteks

Ketika `context.includeCompiledDigestPrompt` diaktifkan, bagian prompt memori
menambahkan cuplikan terkompilasi ringkas dari status Plugin: hanya halaman teratas,
hanya klaim teratas, jumlah kontradiksi, jumlah pertanyaan, serta penanda keyakinan/keterkinian.
Fitur ini bersifat opsional karena mengubah bentuk prompt; fitur ini terutama relevan
untuk mesin konteks atau penyusunan prompt yang secara eksplisit menggunakan
pelengkap memori.

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
| `vaultMode`                                | `isolated` (default), `bridge`, `unsafe-local` | memilih perilaku input dan integrasi                                           |
| `vault.scope`                              | `global` (default), `agent`                    | satu vault bersama atau satu vault turunan per agen                            |
| `vault.path`                               | default global `~/.openclaw/wiki/main`         | vault persis secara global; induk cakupan agen menggunakan default `~/.openclaw/wiki` |
| `vault.renderMode`                         | `native` (default), `obsidian`                 |                                                                               |
| `bridge.readMemoryArtifacts`               | default `true`                                 | mengimpor artefak publik Plugin memori aktif                                   |
| `bridge.followMemoryEvents`                | default `true`                                 | menyertakan log peristiwa dalam mode jembatan                                  |
| `unsafeLocal.allowPrivateMemoryCoreAccess` | default `false`                                | diperlukan untuk menjalankan impor `unsafe-local`                              |
| `unsafeLocal.paths`                        | default `[]`                                   | path lokal eksplisit untuk diimpor dalam mode `unsafe-local`                  |
| `search.backend`                           | `shared` (default), `local`                    |                                                                               |
| `search.corpus`                            | `wiki` (default), `memory`, `all`              |                                                                               |
| `context.includeCompiledDigestPrompt`      | default `false`                                | menambahkan cuplikan ringkasan ringkas agen yang dipilih ke bagian prompt memori |
| `render.createBacklinks`                   | default `true`                                 | menghasilkan blok terkait yang deterministik                                  |
| `render.createDashboards`                  | default `true`                                 | menghasilkan halaman dasbor                                                   |

### Vault per agen

Atur `vault.scope` ke `agent` untuk memberikan wiki terpisah kepada setiap agen yang dikonfigurasi.
Dalam cakupan ini, `vault.path` merupakan direktori induk dan OpenClaw menambahkan
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

Ini diresolusi menjadi `~/.openclaw/wiki/support` dan
`~/.openclaw/wiki/marketing`. Jika `vault.path` dihilangkan dalam cakupan agen,
induk menggunakan default `~/.openclaw/wiki`. Oleh karena itu, agen `main` default tetap
menggunakan path `~/.openclaw/wiki/main` yang sudah ada.

Alat agen, ringkasan prompt terkompilasi, dan pelengkap wiki yang diekspos melalui
`memory_search` / `memory_get` meresolusi vault dari konteks agen aktif.
Untuk panggilan CLI dan Gateway dalam penyiapan dengan beberapa agen yang dikonfigurasi, berikan
agen secara eksplisit dengan `openclaw wiki --agent <agentId> ...` atau
`agentId` milik permintaan Gateway. Satu agen yang dikonfigurasi tetap menjadi default ketika tidak ada id yang
diberikan.

Dalam mode jembatan, impor dengan cakupan agen menerima artefak memori publik hanya ketika
`agentIds`-nya menyertakan agen yang dipilih. Artefak milik agen lain,
tanpa metadata kepemilikan, atau dengan pemilik yang tidak diketahui akan dilewati. Cakupan global
mempertahankan perilaku artefak bersama yang sudah ada.

<Warning>
Mengubah `vault.scope` tidak menyalin atau membagi vault yang sudah ada. Dalam cakupan agen,
`vault.path` yang dikonfigurasi secara eksplisit menjadi direktori induk, jadi pindahkan atau
impor halaman yang sudah ada secara sengaja sebelum mengalihkan agen produksi. Cadangkan
vault terlebih dahulu.

Vault per agen merupakan batas pengetahuan dalam proses yang sama, bukan batas keamanan
sistem operasi. Plugin dan alat tanpa sandbox yang memiliki akses ke sistem berkas host
masih dapat membaca direktori agen lain. Gunakan [sandboxing](/id/gateway/sandboxing) atau
[profil Gateway terpisah](/id/gateway/multiple-gateways) ketika agen tidak saling
memercayai.
</Warning>

### Contoh: QMD + mode jembatan

Gunakan ini ketika Anda menginginkan QMD untuk pengingatan dan `memory-wiki` untuk lapisan
pengetahuan yang terpelihara. Setiap lapisan tetap berfokus: QMD menjaga catatan mentah, ekspor
sesi, dan koleksi tambahan tetap dapat dicari, sementara `memory-wiki` mengompilasi
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

Ini mempertahankan QMD sebagai pengelola pengingatan memori aktif, `memory-wiki` berfokus pada
halaman terkompilasi dan dasbor, serta bentuk prompt tetap tidak berubah hingga Anda
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
`wiki chatgpt import` / `wiki chatgpt rollback`, dan rangkaian subperintah `wiki obsidian`
secara lengkap.

## Dukungan Obsidian

Ketika `vault.renderMode` adalah `obsidian`, Plugin menulis Markdown yang ramah Obsidian
dan dapat secara opsional menggunakan CLI `obsidian` resmi untuk pemeriksaan
status, pencarian vault, membuka halaman, menjalankan perintah, dan berpindah ke
catatan harian. Ini bersifat opsional; wiki tetap berfungsi dalam mode native tanpa
Obsidian.

Vault dengan cakupan agen tetap dapat menggunakan Markdown yang ramah Obsidian, tetapi validasi
konfigurasi menolak `obsidian.useOfficialCli: true` bersama `vault.scope: "agent"`.
Pengaturan `obsidian.vaultName` saat ini bersifat global dan tidak dapat memilih vault
Obsidian yang berbeda untuk setiap agen. Gunakan alat wiki dan operasi CLI sebagai gantinya,
atau pertahankan wiki yang dioperasikan Obsidian dalam cakupan global.

## Alur kerja yang disarankan

<Steps>
<Step title="Pertahankan plugin memori aktif untuk pemanggilan kembali">
Pemanggilan kembali, promosi, dan dreaming tetap dikelola oleh backend memori yang dikonfigurasi.
</Step>
<Step title="Aktifkan memory-wiki">
Mulai dengan mode `isolated`, kecuali jika Anda secara eksplisit menginginkan mode jembatan.
</Step>
<Step title="Gunakan wiki_search / wiki_get ketika asal-usul informasi penting">
Utamakan ini daripada `memory_search` jika Anda menginginkan pemeringkatan khusus wiki atau struktur keyakinan tingkat halaman.
</Step>
<Step title="Gunakan wiki_apply untuk sintesis terbatas atau pembaruan metadata">
Hindari mengedit secara manual blok terkelola yang dihasilkan.
</Step>
<Step title="Jalankan wiki_lint setelah perubahan penting">
Mendeteksi kontradiksi, pertanyaan terbuka, dan kesenjangan asal-usul informasi.
</Step>
<Step title="Aktifkan dasbor untuk visibilitas informasi usang/kontradiksi">
Tetapkan `render.createDashboards: true` (default).
</Step>
</Steps>

## Dokumentasi terkait

- [Ikhtisar Memori](/id/concepts/memory)
- [CLI: memori](/id/cli/memory)
- [CLI: wiki](/id/cli/wiki)
- [Ikhtisar SDK Plugin](/id/plugins/sdk-overview)
