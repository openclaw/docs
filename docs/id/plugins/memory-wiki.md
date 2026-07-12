---
read_when:
    - Anda menginginkan pengetahuan persisten yang melampaui catatan biasa di MEMORY.md
    - Anda sedang mengonfigurasi plugin memory-wiki bawaan
    - Anda memerlukan vault wiki terpisah untuk agen dalam satu Gateway
    - Anda ingin memahami wiki_search, wiki_get, atau mode bridge
summary: 'memory-wiki: brankas pengetahuan terkompilasi dengan asal-usul, klaim, dasbor, dan mode jembatan'
title: Wiki memori
x-i18n:
    generated_at: "2026-07-12T14:25:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cf6c046bfa062b9df6deaa0753d992f9dbc45e2506d6ed4fb1a2836141a901c7
    source_path: plugins/memory-wiki.md
    workflow: 16
---

`memory-wiki` adalah plugin bawaan yang mengompilasi pengetahuan persisten menjadi
wiki yang dapat dinavigasi: halaman deterministik, klaim terstruktur dengan bukti,
asal-usul, dasbor, dan ringkasan yang dapat dibaca mesin.

Plugin ini tidak menggantikan plugin memori aktif. Pengingatan kembali, promosi, pengindeksan, dan
Dreaming tetap dimiliki oleh backend memori apa pun yang dikonfigurasi
(`memory-core`, QMD, Honcho, dan sebagainya). `memory-wiki` berada di sampingnya dan mengompilasi
pengetahuan menjadi lapisan wiki yang terpelihara.

| Lapisan             | Tanggung jawab                                                                    |
| ------------------- | --------------------------------------------------------------------------------- |
| Plugin memori aktif | Pengingatan kembali, pencarian semantik, promosi, Dreaming, runtime memori        |
| `memory-wiki`       | Halaman wiki terkompilasi, sintesis kaya asal-usul, dasbor, pencarian/ambil/terapkan wiki |

Aturan praktis:

- `memory_search` untuk satu kali pengingatan kembali secara luas di seluruh korpus yang dikonfigurasi
- `wiki_search` / `wiki_get` ketika Anda menginginkan pemeringkatan khusus wiki, asal-usul, atau struktur keyakinan tingkat halaman
- `memory_search corpus=all` untuk mencakup kedua lapisan dalam satu panggilan, jika plugin memori aktif mendukung pemilihan korpus

Konfigurasi lokal sebagai prioritas yang umum: QMD sebagai backend memori aktif untuk pengingatan kembali, dan
`memory-wiki` dalam mode `bridge` untuk halaman sintesis persisten. Lihat
contoh mode QMD + bridge di bagian [Konfigurasi](#configuration).

Jika mode bridge melaporkan nol artefak yang diekspor, plugin memori aktif
saat ini tidak mengekspos masukan bridge publik. Jalankan `openclaw wiki doctor` terlebih dahulu,
lalu pastikan plugin memori aktif mendukung artefak publik.

## Mode vault

- `isolated` (bawaan): vault sendiri, sumber sendiri, tanpa dependensi pada plugin memori aktif. Gunakan ini untuk penyimpanan pengetahuan terkurasi yang mandiri.
- `bridge`: membaca artefak memori publik dan log peristiwa dari plugin memori aktif melalui jalur SDK plugin publik. Gunakan ini untuk mengompilasi artefak yang diekspor plugin memori tanpa mengakses bagian internal privat plugin.
- `unsafe-local`: jalan keluar eksplisit untuk mesin yang sama bagi jalur privat lokal. Sengaja bersifat eksperimental dan tidak portabel; gunakan hanya jika Anda memahami batas kepercayaan dan secara khusus memerlukan akses sistem berkas lokal yang tidak dapat disediakan oleh mode bridge.

Mode vault dan cakupan vault adalah pilihan terpisah:

- `vaultMode` memilih asal masukan wiki.
- `vault.scope` memilih apakah semua agen menggunakan satu vault atau setiap agen mendapatkan vault turunan.

`vault.scope: "global"` adalah bawaan dan mempertahankan perilaku satu vault yang
sudah ada. Gunakan `vault.scope: "agent"` dengan mode `isolated` atau `bridge` ketika
agen tidak boleh berbagi halaman wiki, ringkasan terkompilasi, hasil pencarian, atau penulisan.
Cakupan agen tidak dapat digabungkan dengan mode `unsafe-local` karena jalur
privat yang dikonfigurasi tersebut bukan masukan milik agen. Validasi konfigurasi menolak
kombinasi ini.

Mode bridge dapat mengindeks, sesuai pengalih konfigurasi `bridge.*`:

- artefak memori yang diekspor (`indexMemoryRoot`)
- catatan harian (`indexDailyNotes`)
- laporan Dreaming (`indexDreamReports`)
- log peristiwa memori (`followMemoryEvents`)

Ketika mode bridge aktif dan `bridge.readMemoryArtifacts` diaktifkan,
`openclaw wiki status`, `openclaw wiki doctor`, dan `openclaw wiki bridge
import` dirutekan melalui Gateway yang sedang berjalan agar melihat konteks plugin
memori aktif yang sama dengan memori agen/runtime. Jika bridge dinonaktifkan atau pembacaan
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
dipertahankan saat pembuatan ulang.

- `sources/`: materi mentah yang diimpor serta halaman yang didukung bridge/unsafe-local
- `entities/`: hal, orang, sistem, proyek, dan objek yang persisten
- `concepts/`: gagasan, abstraksi, pola, kebijakan (juga menjadi lokasi tujuan impor OKF)
- `syntheses/`: ringkasan terkompilasi dan rekapitulasi yang dipelihara
- `reports/`: dasbor yang dihasilkan

## Impor Open Knowledge Format

```bash
openclaw wiki okf import ./bundles/ga4
```

Impor bundel Open Knowledge Format yang telah diekstrak ke halaman konsep wiki. Sangat
sesuai ketika katalog data, perayap dokumentasi, atau agen pengayaan sudah
menghasilkan OKF: pertahankan OKF sebagai artefak pertukaran portabel, lalu biarkan `memory-wiki`
mengubahnya menjadi halaman konsep asli OpenClaw dan ringkasan terkompilasi.

- berkas `.md` yang tidak dicadangkan merupakan dokumen konsep
- setiap konsep yang diimpor memerlukan bidang frontmatter `type` yang tidak kosong; `type` yang tidak ada menghasilkan peringatan `missing-type` dan berkas tersebut dilewati
- nilai `type` yang tidak dikenal diterima sebagai konsep generik
- `index.md` dan `log.md` dicadangkan dan tidak pernah diimpor sebagai konsep
- tautan markdown yang rusak atau eksternal dibiarkan tidak berubah

Halaman yang diimpor diratakan di bawah `concepts/` agar alur kompilasi, pencarian, pengambilan, dan
dasbor yang sudah ada dapat melihatnya tanpa pohon wiki kedua. Setiap halaman mempertahankan
ID konsep OKF asli, jalur sumber, `type`, `resource`, `tags`, stempel waktu,
dan seluruh frontmatter produsen. Tautan internal OKF ditulis ulang ke halaman
konsep wiki yang dihasilkan dan juga menghasilkan entri `relationships` terstruktur dengan
`kind: okf-link`.

## Klaim dan bukti terstruktur

Halaman memuat frontmatter `claims` terstruktur, bukan sekadar teks bebas. Setiap
klaim dapat mencakup `id`, `text`, `status`, `confidence`, `evidence[]`, dan
`updatedAt`. Setiap entri bukti dapat mencakup `kind`, `sourceId`, `path`,
`lines`, `weight`, `confidence`, `privacyTier`, `note`, dan `updatedAt`.

Hal ini membuat wiki berperilaku seperti lapisan keyakinan, bukan tempat pembuangan catatan pasif.
Klaim dapat dilacak, diberi skor, disanggah, dan ditelusuri kembali hingga sumbernya.

## Metadata entitas untuk agen

Halaman entitas memuat metadata perutean generik yang dapat digunakan untuk orang, tim,
sistem, proyek, atau jenis entitas lainnya:

- `entityType`: misalnya `person`, `team`, `system`, `project`
- `canonicalId`: kunci identitas stabil di seluruh alias dan impor
- `aliases`: nama, nama pengguna, atau label yang mengarah ke halaman yang sama
- `privacyTier`: string bentuk bebas; `public` diperlakukan sebagai tidak memerlukan peninjauan, nilai lainnya (misalnya `local-private`, `sensitive`, `confirm-before-use`) ditandai di `reports/privacy-review.md`
- `bestUsedFor` / `notEnoughFor`: petunjuk perutean ringkas
- `lastRefreshedAt`: stempel waktu penyegaran sumber, terpisah dari waktu penyuntingan halaman
- `personCard`: kartu perutean khusus orang opsional (nama pengguna, media sosial, email, zona waktu, jalur, hal yang dapat ditanyakan, hal yang sebaiknya tidak ditanyakan, tingkat keyakinan, tingkat privasi)
- `relationships`: sisi bertipe menuju halaman terkait (target, jenis, bobot, tingkat keyakinan, jenis bukti, tingkat privasi, catatan)

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

## Alur kompilasi

Kompilasi membaca halaman wiki, menormalisasi ringkasan, dan menghasilkan artefak
stabil untuk mesin di bawah:

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

Agen dan kode runtime membaca ringkasan ini alih-alih mengurai Markdown.
Keluaran terkompilasi juga mendukung pengindeksan wiki tahap awal untuk pencarian/pengambilan, pencarian
ID klaim kembali ke halaman pemiliknya, pelengkap prompt ringkas, dan pembuatan
laporan.

## Dasbor dan laporan kesehatan

Ketika `render.createDashboards` diaktifkan, kompilasi memelihara dasbor di bawah
`reports/`:

| Laporan                             | Melacak                                                     |
| ----------------------------------- | ----------------------------------------------------------- |
| `reports/open-questions.md`         | halaman dengan pertanyaan yang belum terselesaikan          |
| `reports/contradictions.md`         | klaster catatan kontradiksi                                 |
| `reports/low-confidence.md`         | halaman dan klaim dengan tingkat keyakinan rendah           |
| `reports/claim-health.md`           | klaim yang tidak memiliki bukti terstruktur                 |
| `reports/stale-pages.md`            | kesegaran yang kedaluwarsa atau tidak diketahui             |
| `reports/person-agent-directory.md` | kartu perutean orang/entitas                                 |
| `reports/relationship-graph.md`     | sisi hubungan terstruktur                                   |
| `reports/provenance-coverage.md`    | cakupan kelas bukti                                         |
| `reports/privacy-review.md`         | tingkat privasi nonpublik yang memerlukan peninjauan sebelum digunakan |

## Pencarian dan pengambilan

Dua backend pencarian:

- `shared`: gunakan alur pencarian memori bersama jika tersedia
- `local`: cari wiki secara lokal

Tiga korpus: `wiki`, `memory`, `all`.

- `wiki_search` / `wiki_get` menggunakan ringkasan terkompilasi sebagai tahap awal jika memungkinkan
- ID klaim mengarah kembali ke halaman pemiliknya
- klaim yang disengketakan/kedaluwarsa/terkini memengaruhi pemeringkatan
- label asal-usul tetap disertakan dalam hasil

Mode pencarian (parameter `--mode` / `mode` alat):

| Mode              | Meningkatkan prioritas                                          |
| ----------------- | -------------------------------------------------------------- |
| `auto`            | bawaan yang seimbang                                           |
| `find-person`     | entitas mirip orang, alias, nama pengguna, media sosial, ID kanonis |
| `route-question`  | kartu agen, petunjuk hal yang dapat ditanyakan/kegunaan terbaik, konteks hubungan |
| `source-evidence` | halaman sumber dan metadata bukti terstruktur                  |
| `raw-claim`       | klaim terstruktur yang cocok; mengembalikan metadata klaim/bukti |

Ketika suatu hasil cocok dengan klaim terstruktur, `wiki_search` mengembalikan
`matchedClaimId`, `matchedClaimStatus`, `matchedClaimConfidence`,
`evidenceKinds`, dan `evidenceSourceIds` dalam payload detailnya. Keluaran teks
menyertakan baris ringkas `Claim:` dan `Evidence:` jika tersedia.

## Alat agen

| Alat          | Tujuan                                                                                                                                                                  |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `wiki_status` | mode dan cakupan vault saat ini, agen yang ditetapkan, kondisi, ketersediaan CLI Obsidian                                                                                |
| `wiki_search` | mencari halaman wiki dan, jika dikonfigurasi, korpus memori bersama; menerima `mode` untuk pencarian orang, perutean pertanyaan, bukti sumber, atau penelusuran klaim mentah |
| `wiki_get`    | membaca halaman wiki berdasarkan id/jalur, dengan beralih ke korpus memori bersama ketika pencarian bersama diaktifkan dan pencarian tidak menemukan hasil                 |
| `wiki_apply`  | mutasi sintesis/metadata terbatas tanpa penyuntingan bebas pada halaman                                                                                                  |
| `wiki_lint`   | pemeriksaan struktural, kesenjangan asal-usul, kontradiksi, pertanyaan terbuka                                                                                           |

Plugin ini juga mendaftarkan pelengkap korpus memori non-eksklusif, sehingga
`memory_search` dan `memory_get` bersama dapat menjangkau wiki ketika Plugin
memori aktif mendukung pemilihan korpus.

## Perilaku perintah dan konteks

Ketika `context.includeCompiledDigestPrompt` diaktifkan, bagian perintah memori
menambahkan cuplikan terkompilasi ringkas dari `agent-digest.json`: hanya
halaman teratas, hanya klaim teratas, jumlah kontradiksi, jumlah pertanyaan,
serta penjelas tingkat keyakinan/kebaruan. Fitur ini bersifat opsional karena
mengubah bentuk perintah; fitur ini terutama penting bagi mesin konteks atau
perakitan perintah yang secara eksplisit menggunakan pelengkap memori.

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

Pengalih utama:

| Kunci                                      | Nilai / bawaan                                  | Catatan                                                                                 |
| ------------------------------------------ | ----------------------------------------------- | --------------------------------------------------------------------------------------- |
| `vaultMode`                                | `isolated` (bawaan), `bridge`, `unsafe-local`   | memilih perilaku masukan dan integrasi                                                   |
| `vault.scope`                              | `global` (bawaan), `agent`                      | satu vault bersama atau satu vault turunan per agen                                      |
| `vault.path`                               | bawaan global `~/.openclaw/wiki/main`           | vault global yang tepat; induk cakupan agen secara bawaan adalah `~/.openclaw/wiki`      |
| `vault.renderMode`                         | `native` (bawaan), `obsidian`                   |                                                                                         |
| `bridge.readMemoryArtifacts`               | bawaan `true`                                   | mengimpor artefak publik Plugin memori aktif                                             |
| `bridge.followMemoryEvents`                | bawaan `true`                                   | menyertakan log peristiwa dalam mode jembatan                                            |
| `unsafeLocal.allowPrivateMemoryCoreAccess` | bawaan `false`                                  | diperlukan untuk menjalankan impor `unsafe-local`                                        |
| `unsafeLocal.paths`                        | bawaan `[]`                                     | jalur lokal eksplisit untuk diimpor dalam mode `unsafe-local`                            |
| `search.backend`                           | `shared` (bawaan), `local`                      |                                                                                         |
| `search.corpus`                            | `wiki` (bawaan), `memory`, `all`                |                                                                                         |
| `context.includeCompiledDigestPrompt`      | bawaan `false`                                  | menambahkan cuplikan ringkas agen terpilih ke bagian perintah memori                     |
| `render.createBacklinks`                   | bawaan `true`                                   | menghasilkan blok terkait secara deterministik                                          |
| `render.createDashboards`                  | bawaan `true`                                   | menghasilkan halaman dasbor                                                             |

### Vault per agen

Atur `vault.scope` ke `agent` untuk memberikan wiki terpisah kepada setiap agen
yang dikonfigurasi. Dalam cakupan ini, `vault.path` adalah direktori induk dan
OpenClaw menambahkan id agen yang dinormalisasi:

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

Konfigurasi ini ditetapkan menjadi `~/.openclaw/wiki/support` dan
`~/.openclaw/wiki/marketing`. Jika `vault.path` dihilangkan dalam cakupan agen,
induk secara bawaan adalah `~/.openclaw/wiki`. Karena itu, agen `main` bawaan
tetap menggunakan jalur `~/.openclaw/wiki/main` yang sudah ada.

Alat agen, ringkasan perintah terkompilasi, dan pelengkap wiki yang diekspos
melalui `memory_search` / `memory_get` menetapkan vault dari konteks agen aktif.
Untuk panggilan CLI dan Gateway dalam penyiapan dengan beberapa agen yang
dikonfigurasi, berikan agen secara eksplisit dengan
`openclaw wiki --agent <agentId> ...` atau `agentId` pada permintaan Gateway.
Satu agen yang dikonfigurasi tetap menjadi bawaan jika tidak ada id yang
diberikan.

Dalam mode jembatan, impor bercakupan agen menerima artefak memori publik hanya
ketika `agentIds`-nya menyertakan agen yang dipilih. Artefak milik agen lain,
tanpa metadata kepemilikan, atau dengan pemilik yang tidak diketahui akan
dilewati. Cakupan global mempertahankan perilaku artefak bersama yang sudah ada.

<Warning>
Mengubah `vault.scope` tidak menyalin atau membagi vault yang sudah ada. Dalam
cakupan agen, `vault.path` yang dikonfigurasi secara eksplisit menjadi direktori
induk, jadi pindahkan atau impor halaman yang sudah ada secara sengaja sebelum
mengalihkan agen produksi. Cadangkan vault terlebih dahulu.

Vault per agen adalah batas pengetahuan dalam proses yang sama, bukan batas
keamanan sistem operasi. Plugin dan alat tanpa sandbox yang memiliki akses ke
sistem berkas hos masih dapat membaca direktori agen lain. Gunakan
[sandbox](/id/gateway/sandboxing) atau [profil Gateway
terpisah](/id/gateway/multiple-gateways) ketika agen tidak saling memercayai.
</Warning>

### Contoh: QMD + mode jembatan

Gunakan ini ketika Anda menginginkan QMD untuk pemanggilan kembali dan
`memory-wiki` untuk lapisan pengetahuan yang terpelihara. Setiap lapisan tetap
fokus: QMD menjaga catatan mentah, ekspor sesi, dan koleksi tambahan agar dapat
dicari, sedangkan `memory-wiki` mengompilasi entitas stabil, klaim, dasbor, dan
halaman sumber.

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

Konfigurasi ini mempertahankan QMD sebagai pengelola pemanggilan kembali memori
aktif, menjaga `memory-wiki` tetap berfokus pada halaman terkompilasi dan
dasbor, serta mempertahankan bentuk perintah hingga Anda sengaja mengaktifkan
perintah ringkasan terkompilasi.

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
`wiki chatgpt import` / `wiki chatgpt rollback`, dan rangkaian subperintah
`wiki obsidian` lengkap.

## Dukungan Obsidian

Ketika `vault.renderMode` adalah `obsidian`, Plugin menulis Markdown yang ramah
Obsidian dan secara opsional dapat menggunakan CLI `obsidian` resmi untuk
memeriksa status, mencari vault, membuka halaman, menjalankan perintah, dan
berpindah ke catatan harian. Fitur ini opsional; wiki tetap berfungsi dalam mode
asli tanpa Obsidian.

Vault bercakupan agen tetap dapat menggunakan Markdown yang ramah Obsidian,
tetapi validasi konfigurasi menolak `obsidian.useOfficialCli: true` dengan
`vault.scope: "agent"`. Pengaturan `obsidian.vaultName` saat ini bersifat global
dan tidak dapat memilih vault Obsidian yang berbeda untuk setiap agen. Gunakan
alat wiki dan operasi CLI sebagai gantinya, atau pertahankan wiki yang
dioperasikan Obsidian dalam cakupan global.

## Alur kerja yang disarankan

<Steps>
<Step title="Pertahankan Plugin memori aktif untuk pemanggilan kembali">
Pemanggilan kembali, promosi, dan dreaming tetap dikelola oleh backend memori
yang dikonfigurasi.
</Step>
<Step title="Aktifkan memory-wiki">
Mulai dengan mode `isolated` kecuali Anda secara eksplisit menginginkan mode
jembatan.
</Step>
<Step title="Gunakan wiki_search / wiki_get ketika asal-usul penting">
Utamakan ini daripada `memory_search` ketika Anda menginginkan pemeringkatan
khusus wiki atau struktur keyakinan tingkat halaman.
</Step>
<Step title="Gunakan wiki_apply untuk sintesis terbatas atau pembaruan metadata">
Hindari menyunting blok terkelola yang dihasilkan secara manual.
</Step>
<Step title="Jalankan wiki_lint setelah perubahan penting">
Mendeteksi kontradiksi, pertanyaan terbuka, dan kesenjangan asal-usul.
</Step>
<Step title="Aktifkan dasbor untuk visibilitas konten kedaluwarsa/kontradiksi">
Atur `render.createDashboards: true` (bawaan).
</Step>
</Steps>

## Dokumentasi terkait

- [Ikhtisar Memori](/id/concepts/memory)
- [CLI: memori](/id/cli/memory)
- [CLI: wiki](/id/cli/wiki)
- [Ikhtisar SDK Plugin](/id/plugins/sdk-overview)
