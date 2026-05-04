---
read_when:
    - Anda menginginkan pengetahuan persisten di luar catatan MEMORY.md biasa
    - Anda sedang mengonfigurasi Plugin memory-wiki bawaan
    - Anda ingin memahami wiki_search, wiki_get, atau mode jembatan
summary: 'memory-wiki: brankas pengetahuan terkompilasi dengan asal-usul, klaim, dasbor, dan mode jembatan'
title: Wiki memori
x-i18n:
    generated_at: "2026-05-04T07:06:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: b070177b7c1217e9102bc57680b4009265e3584ede7ad6dc3ba7b6393260fefe
    source_path: plugins/memory-wiki.md
    workflow: 16
---

`memory-wiki` adalah Plugin bawaan yang mengubah memori persisten menjadi
brankas pengetahuan terkompilasi.

Ia **tidak** menggantikan Plugin Active Memory. Plugin Active Memory tetap
memiliki recall, promosi, pengindeksan, dan Dreaming. `memory-wiki` berada di
sampingnya dan mengompilasi pengetahuan persisten menjadi wiki yang dapat
dinavigasi dengan halaman deterministik, klaim terstruktur, asal-usul, dasbor,
dan digest yang dapat dibaca mesin.

Gunakan ini ketika Anda ingin memori berperilaku lebih seperti lapisan
pengetahuan yang terpelihara dan lebih sedikit seperti tumpukan berkas Markdown.

## Yang ditambahkan

- Brankas wiki khusus dengan tata letak halaman deterministik
- Metadata klaim dan bukti terstruktur, bukan hanya prosa
- Asal-usul, keyakinan, kontradiksi, dan pertanyaan terbuka tingkat halaman
- Digest terkompilasi untuk konsumen agen/runtime
- Alat pencarian/pengambilan/penerapan/lint khusus wiki
- Mode jembatan opsional yang mengimpor artefak publik dari Plugin Active Memory
- Mode render ramah Obsidian dan integrasi CLI opsional

## Bagaimana ini cocok dengan memori

Pikirkan pemisahannya seperti ini:

| Lapisan                                                 | Memiliki                                                                                   |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Plugin Active Memory (`memory-core`, QMD, Honcho, dll.) | Recall, pencarian semantik, promosi, Dreaming, runtime memori                              |
| `memory-wiki`                                           | Halaman wiki terkompilasi, sintesis kaya asal-usul, dasbor, pencarian/pengambilan/penerapan khusus wiki |

Jika Plugin Active Memory mengekspos artefak recall bersama, OpenClaw dapat
mencari kedua lapisan dalam satu lintasan dengan `memory_search corpus=all`.

Ketika Anda membutuhkan pemeringkatan khusus wiki, asal-usul, atau akses halaman
langsung, gunakan alat khusus wiki sebagai gantinya.

## Pola hibrida yang direkomendasikan

Default yang kuat untuk penyiapan local-first adalah:

- QMD sebagai backend Active Memory untuk recall dan pencarian semantik luas
- `memory-wiki` dalam mode `bridge` untuk halaman pengetahuan tersintesis yang persisten

Pemisahan itu bekerja dengan baik karena setiap lapisan tetap fokus:

- QMD menjaga catatan mentah, ekspor sesi, dan koleksi tambahan tetap dapat dicari
- `memory-wiki` mengompilasi entitas stabil, klaim, dasbor, dan halaman sumber

Aturan praktis:

- gunakan `memory_search` ketika Anda menginginkan satu lintasan recall luas di seluruh memori
- gunakan `wiki_search` dan `wiki_get` ketika Anda menginginkan hasil wiki yang sadar asal-usul
- gunakan `memory_search corpus=all` ketika Anda ingin pencarian bersama mencakup kedua lapisan

Jika mode jembatan melaporkan nol artefak yang diekspor, Plugin Active Memory
saat ini belum mengekspos masukan jembatan publik. Jalankan `openclaw wiki doctor`
terlebih dahulu, lalu pastikan Plugin Active Memory mendukung artefak publik.

Ketika mode jembatan aktif dan `bridge.readMemoryArtifacts` diaktifkan,
`openclaw wiki status`, `openclaw wiki doctor`, dan `openclaw wiki bridge
import` membaca melalui Gateway yang sedang berjalan. Ini menjaga pemeriksaan
jembatan CLI tetap selaras dengan konteks Plugin memori runtime. Jika jembatan
dinonaktifkan atau pembacaan artefak dimatikan, perintah tersebut tetap
mempertahankan perilaku lokal/offline.

## Mode brankas

`memory-wiki` mendukung tiga mode brankas:

### `isolated`

Brankas sendiri, sumber sendiri, tanpa dependensi pada `memory-core`.

Gunakan ini ketika Anda ingin wiki menjadi penyimpanan pengetahuan terkurasi miliknya sendiri.

### `bridge`

Membaca artefak memori publik dan peristiwa memori dari Plugin Active Memory
melalui seam SDK Plugin publik.

Gunakan ini ketika Anda ingin wiki mengompilasi dan mengatur artefak yang
diekspor Plugin memori tanpa masuk ke internal Plugin privat.

Mode jembatan dapat mengindeks:

- artefak memori yang diekspor
- laporan mimpi
- catatan harian
- berkas root memori
- log peristiwa memori

### `unsafe-local`

Jalur keluar eksplisit untuk path privat lokal pada mesin yang sama.

Mode ini sengaja eksperimental dan tidak portabel. Gunakan hanya ketika Anda
memahami batas kepercayaan dan secara khusus membutuhkan akses sistem berkas
lokal yang tidak dapat disediakan mode jembatan.

## Tata letak brankas

Plugin menginisialisasi brankas seperti ini:

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

Konten terkelola tetap berada di dalam blok yang dihasilkan. Blok catatan manusia dipertahankan.

Grup halaman utama adalah:

- `sources/` untuk materi mentah yang diimpor dan halaman berbasis jembatan
- `entities/` untuk hal, orang, sistem, proyek, dan objek yang persisten
- `concepts/` untuk gagasan, abstraksi, pola, dan kebijakan
- `syntheses/` untuk ringkasan terkompilasi dan rollup yang dipelihara
- `reports/` untuk dasbor yang dihasilkan

## Klaim dan bukti terstruktur

Halaman dapat membawa frontmatter `claims` terstruktur, bukan hanya teks bebas.

Setiap klaim dapat mencakup:

- `id`
- `text`
- `status`
- `confidence`
- `evidence[]`
- `updatedAt`

Entri bukti dapat mencakup:

- `kind`
- `sourceId`
- `path`
- `lines`
- `weight`
- `confidence`
- `privacyTier`
- `note`
- `updatedAt`

Inilah yang membuat wiki bertindak lebih seperti lapisan keyakinan daripada
sekadar tempat pembuangan catatan pasif. Klaim dapat dilacak, dinilai,
diperdebatkan, dan diselesaikan kembali ke sumber.

## Metadata entitas yang menghadap agen

Halaman entitas juga dapat membawa metadata perutean untuk penggunaan agen. Ini
adalah frontmatter generik, jadi berfungsi untuk orang, tim, sistem, proyek,
atau jenis entitas lainnya.

Bidang umum mencakup:

- `entityType`: misalnya `person`, `team`, `system`, atau `project`
- `canonicalId`: kunci identitas stabil yang digunakan lintas alias dan impor
- `aliases`: nama, handle, atau label yang harus diselesaikan ke halaman yang sama
- `privacyTier`: `public`, `local-private`, `sensitive`, atau `confirm-before-use`
- `bestUsedFor` / `notEnoughFor`: petunjuk perutean ringkas
- `lastRefreshedAt`: stempel waktu penyegaran sumber yang terpisah dari waktu edit halaman
- `personCard`: kartu perutean khusus orang opsional dengan handle, sosial,
  email, zona waktu, jalur, minta-untuk, hindari-meminta-untuk, keyakinan, dan privasi
- `relationships`: edge bertipe ke halaman terkait dengan target, jenis, bobot,
  keyakinan, jenis bukti, tingkat privasi, dan catatan

Untuk wiki orang, agen biasanya harus mulai dengan
`reports/person-agent-directory.md`, lalu membuka halaman orang dengan `wiki_get`
sebelum menggunakan detail kontak atau fakta yang disimpulkan.

Contoh:

```yaml
pageType: entity
entityType: person
id: entity.brad-groux
canonicalId: maintainer.brad-groux
aliases:
  - Brad
  - bgroux
privacyTier: local-private
bestUsedFor:
  - Microsoft Teams and Azure routing
notEnoughFor:
  - legal approval
lastRefreshedAt: "2026-04-29T00:00:00.000Z"
personCard:
  handles:
    - "@bgroux"
  socials:
    - "https://x.example/bgroux"
  emails:
    - brad@example.com
  timezone: America/Chicago
  lane: Microsoft ecosystem
  askFor:
    - Teams rollout questions
  avoidAskingFor:
    - unrelated billing decisions
  confidence: 0.8
  privacyTier: confirm-before-use
relationships:
  - targetId: entity.alice
    targetTitle: Alice
    kind: collaborates-with
    confidence: 0.7
    evidenceKind: discrawl-stat
claims:
  - id: claim.brad.teams
    text: Brad is useful for Microsoft Teams routing.
    status: supported
    confidence: 0.9
    evidence:
      - kind: maintainer-whois
        sourceId: source.maintainers
        privacyTier: local-private
```

## Pipeline kompilasi

Langkah kompilasi membaca halaman wiki, menormalkan ringkasan, dan menghasilkan
artefak stabil yang menghadap mesin di bawah:

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

Digest ini ada agar agen dan kode runtime tidak perlu mengikis halaman Markdown.

Keluaran terkompilasi juga mendukung:

- pengindeksan wiki lintasan pertama untuk alur pencarian/pengambilan
- pencarian ID klaim kembali ke halaman pemilik
- suplemen prompt ringkas
- pembuatan laporan/dasbor

## Dasbor dan laporan kesehatan

Ketika `render.createDashboards` diaktifkan, kompilasi memelihara dasbor di bawah
`reports/`.

Laporan bawaan mencakup:

- `reports/open-questions.md`
- `reports/contradictions.md`
- `reports/low-confidence.md`
- `reports/claim-health.md`
- `reports/stale-pages.md`
- `reports/person-agent-directory.md`
- `reports/relationship-graph.md`
- `reports/provenance-coverage.md`
- `reports/privacy-review.md`

Laporan ini melacak hal-hal seperti:

- kluster catatan kontradiksi
- kluster klaim yang bersaing
- klaim yang kehilangan bukti terstruktur
- halaman dan klaim dengan keyakinan rendah
- kesegaran usang atau tidak diketahui
- halaman dengan pertanyaan yang belum terselesaikan
- kartu perutean orang/entitas
- edge relasi terstruktur
- cakupan kelas bukti
- tingkat privasi nonpublik yang perlu ditinjau sebelum digunakan

## Pencarian dan pengambilan

`memory-wiki` mendukung dua backend pencarian:

- `shared`: gunakan alur pencarian memori bersama jika tersedia
- `local`: cari wiki secara lokal

Ini juga mendukung tiga korpus:

- `wiki`
- `memory`
- `all`

Perilaku penting:

- `wiki_search` dan `wiki_get` menggunakan digest terkompilasi sebagai lintasan pertama jika memungkinkan
- ID klaim dapat diselesaikan kembali ke halaman pemilik
- klaim yang diperdebatkan/usang/segar memengaruhi pemeringkatan
- label asal-usul dapat bertahan ke dalam hasil
- mode pencarian dapat membiaskan pemeringkatan untuk pencarian orang, perutean pertanyaan, bukti sumber, atau klaim mentah

Aturan praktis:

- gunakan `memory_search corpus=all` untuk satu lintasan recall luas
- gunakan `wiki_search` + `wiki_get` ketika Anda peduli pada pemeringkatan khusus wiki,
  asal-usul, atau struktur keyakinan tingkat halaman

Mode pencarian:

- `auto`: default seimbang
- `find-person`: dorong entitas mirip orang, alias, handle, sosial, dan ID kanonis
- `route-question`: dorong kartu agen, petunjuk minta-untuk, petunjuk paling-cocok-untuk, dan konteks relasi
- `source-evidence`: dorong halaman sumber dan metadata bukti terstruktur
- `raw-claim`: dorong klaim terstruktur yang cocok dan kembalikan metadata klaim/bukti dalam hasil

Ketika hasil cocok dengan klaim terstruktur, `wiki_search` dapat mengembalikan
`matchedClaimId`, `matchedClaimStatus`, `matchedClaimConfidence`,
`evidenceKinds`, dan `evidenceSourceIds` dalam payload detailnya. Keluaran teks
juga menyertakan baris `Claim:` dan `Evidence:` yang ringkas jika tersedia.

## Alat agen

Plugin mendaftarkan alat berikut:

- `wiki_status`
- `wiki_search`
- `wiki_get`
- `wiki_apply`
- `wiki_lint`

Yang dilakukan:

- `wiki_status`: mode brankas saat ini, kesehatan, ketersediaan CLI Obsidian
- `wiki_search`: mencari halaman wiki dan, ketika dikonfigurasi, korpus memori bersama;
  menerima `mode` untuk pencarian orang, perutean pertanyaan, bukti sumber, atau drilldown klaim mentah
- `wiki_get`: membaca halaman wiki berdasarkan ID/path atau mundur ke korpus memori bersama
- `wiki_apply`: mutasi sintesis/metadata sempit tanpa operasi bebas pada halaman
- `wiki_lint`: pemeriksaan struktural, celah asal-usul, kontradiksi, pertanyaan terbuka

Plugin juga mendaftarkan suplemen korpus memori non-eksklusif, sehingga
`memory_search` dan `memory_get` bersama dapat menjangkau wiki ketika Plugin
Active Memory mendukung pemilihan korpus.

## Perilaku prompt dan konteks

Ketika `context.includeCompiledDigestPrompt` diaktifkan, bagian prompt memori
menambahkan snapshot terkompilasi ringkas dari `agent-digest.json`.

Snapshot itu sengaja kecil dan bernilai sinyal tinggi:

- hanya halaman teratas
- hanya klaim teratas
- jumlah kontradiksi
- jumlah pertanyaan
- penanda keyakinan/kesegaran

Ini bersifat opt-in karena mengubah bentuk prompt dan terutama berguna untuk
mesin konteks atau perakitan prompt lama yang secara eksplisit mengonsumsi
suplemen memori.

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

Toggle utama:

- `vaultMode`: `isolated`, `bridge`, `unsafe-local`
- `vault.renderMode`: `native` atau `obsidian`
- `bridge.readMemoryArtifacts`: impor artefak publik Plugin memori aktif
- `bridge.followMemoryEvents`: sertakan log peristiwa dalam mode bridge
- `search.backend`: `shared` atau `local`
- `search.corpus`: `wiki`, `memory`, atau `all`
- `context.includeCompiledDigestPrompt`: tambahkan snapshot digest ringkas ke bagian prompt memori
- `render.createBacklinks`: buat blok terkait yang deterministik
- `render.createDashboards`: buat halaman dasbor

### Contoh: QMD + mode bridge

Gunakan ini saat Anda menginginkan QMD untuk pengingatan dan `memory-wiki` untuk lapisan
pengetahuan yang dikelola:

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

Ini mempertahankan:

- QMD tetap bertanggung jawab atas pengingatan memori aktif
- `memory-wiki` berfokus pada halaman terkompilasi dan dasbor
- bentuk prompt tidak berubah sampai Anda sengaja mengaktifkan prompt digest terkompilasi

## CLI

`memory-wiki` juga mengekspos permukaan CLI tingkat atas:

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

Lihat [CLI: wiki](/id/cli/wiki) untuk referensi perintah lengkap.

## Dukungan Obsidian

Saat `vault.renderMode` adalah `obsidian`, Plugin menulis Markdown yang ramah Obsidian
dan secara opsional dapat menggunakan CLI `obsidian` resmi.

Alur kerja yang didukung meliputi:

- pemeriksaan status
- pencarian vault
- membuka halaman
- menjalankan perintah Obsidian
- melompat ke catatan harian

Ini opsional. Wiki tetap berfungsi dalam mode native tanpa Obsidian.

## Alur kerja yang direkomendasikan

1. Pertahankan Plugin memori aktif Anda untuk pengingatan/promosi/dreaming.
2. Aktifkan `memory-wiki`.
3. Mulai dengan mode `isolated` kecuali Anda secara eksplisit menginginkan mode bridge.
4. Gunakan `wiki_search` / `wiki_get` saat asal-usul penting.
5. Gunakan `wiki_apply` untuk sintesis sempit atau pembaruan metadata.
6. Jalankan `wiki_lint` setelah perubahan bermakna.
7. Aktifkan dasbor jika Anda menginginkan visibilitas atas stale/kontradiksi.

## Dokumen terkait

- [Ikhtisar Memori](/id/concepts/memory)
- [CLI: memory](/id/cli/memory)
- [CLI: wiki](/id/cli/wiki)
- [Ikhtisar Plugin SDK](/id/plugins/sdk-overview)
