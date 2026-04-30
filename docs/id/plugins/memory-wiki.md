---
read_when:
    - Anda menginginkan pengetahuan persisten di luar catatan MEMORY.md biasa
    - Anda sedang mengonfigurasi plugin memory-wiki bawaan
    - Anda ingin memahami wiki_search, wiki_get, atau mode jembatan
summary: 'memory-wiki: brankas pengetahuan terkompilasi dengan provenansi, klaim, dasbor, dan mode jembatan'
title: Wiki memori
x-i18n:
    generated_at: "2026-04-30T10:02:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 744d569f8b0c9b668ea54dc057f808544359eaae87d5557de2e6acd1b31acd89
    source_path: plugins/memory-wiki.md
    workflow: 16
---

`memory-wiki` adalah Plugin bawaan yang mengubah memori tahan lama menjadi brankas pengetahuan yang dikompilasi.

Ini **tidak** menggantikan Plugin Active Memory. Plugin Active Memory tetap
memiliki tanggung jawab atas recall, promosi, pengindeksan, dan Dreaming. `memory-wiki` berada di sampingnya
dan mengompilasi pengetahuan tahan lama menjadi wiki yang dapat dinavigasi dengan halaman deterministik,
klaim terstruktur, provenance, dasbor, dan digest yang dapat dibaca mesin.

Gunakan saat Anda ingin memori berperilaku lebih seperti lapisan pengetahuan yang dipelihara dan
kurang seperti tumpukan berkas Markdown.

## Yang ditambahkan

- Brankas wiki khusus dengan tata letak halaman deterministik
- Metadata klaim dan bukti terstruktur, bukan hanya prosa
- Provenance, keyakinan, kontradiksi, dan pertanyaan terbuka pada tingkat halaman
- Digest terkompilasi untuk konsumen agen/runtime
- Alat search/get/apply/lint asli wiki
- Mode bridge opsional yang mengimpor artefak publik dari Plugin Active Memory
- Mode render ramah Obsidian dan integrasi CLI opsional

## Kesesuaiannya dengan memori

Pikirkan pembagiannya seperti ini:

| Lapisan                                                 | Memiliki                                                                                   |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Plugin Active Memory (`memory-core`, QMD, Honcho, dll.) | Recall, pencarian semantik, promosi, Dreaming, runtime memori                              |
| `memory-wiki`                                           | Halaman wiki terkompilasi, sintesis kaya provenance, dasbor, search/get/apply khusus wiki |

Jika Plugin Active Memory mengekspos artefak recall bersama, OpenClaw dapat mencari
kedua lapisan dalam satu lintasan dengan `memory_search corpus=all`.

Saat Anda memerlukan peringkat khusus wiki, provenance, atau akses halaman langsung, gunakan
alat asli wiki sebagai gantinya.

## Pola hybrid yang direkomendasikan

Default yang kuat untuk penyiapan local-first adalah:

- QMD sebagai backend Active Memory untuk recall dan pencarian semantik luas
- `memory-wiki` dalam mode `bridge` untuk halaman pengetahuan sintesis yang tahan lama

Pembagian itu bekerja baik karena setiap lapisan tetap fokus:

- QMD menjaga catatan mentah, ekspor sesi, dan koleksi tambahan tetap dapat dicari
- `memory-wiki` mengompilasi entitas, klaim, dasbor, dan halaman sumber yang stabil

Aturan praktis:

- gunakan `memory_search` saat Anda menginginkan satu lintasan recall luas di seluruh memori
- gunakan `wiki_search` dan `wiki_get` saat Anda menginginkan hasil wiki yang sadar provenance
- gunakan `memory_search corpus=all` saat Anda ingin pencarian bersama menjangkau kedua lapisan

Jika mode bridge melaporkan nol artefak yang diekspor, Plugin Active Memory belum
mengekspos input bridge publik saat ini. Jalankan `openclaw wiki doctor` terlebih dahulu,
lalu pastikan Plugin Active Memory mendukung artefak publik.

Saat mode bridge aktif dan `bridge.readMemoryArtifacts` diaktifkan,
`openclaw wiki status`, `openclaw wiki doctor`, dan `openclaw wiki bridge
import` membaca melalui Gateway yang sedang berjalan. Ini menjaga pemeriksaan bridge CLI tetap selaras
dengan konteks Plugin memori runtime. Jika bridge dinonaktifkan atau pembacaan artefak
dimatikan, perintah-perintah tersebut mempertahankan perilaku lokal/offline-nya.

## Mode brankas

`memory-wiki` mendukung tiga mode brankas:

### `isolated`

Brankas sendiri, sumber sendiri, tanpa dependensi pada `memory-core`.

Gunakan ini saat Anda ingin wiki menjadi penyimpanan pengetahuan terkurasi tersendiri.

### `bridge`

Membaca artefak memori publik dan peristiwa memori dari Plugin Active Memory
melalui seam SDK Plugin publik.

Gunakan ini saat Anda ingin wiki mengompilasi dan mengatur artefak yang diekspor
Plugin memori tanpa menjangkau internal Plugin privat.

Mode bridge dapat mengindeks:

- artefak memori yang diekspor
- laporan dream
- catatan harian
- berkas root memori
- log peristiwa memori

### `unsafe-local`

Escape hatch same-machine eksplisit untuk path privat lokal.

Mode ini sengaja bersifat eksperimental dan tidak portabel. Gunakan hanya saat Anda
memahami batas kepercayaan dan secara khusus membutuhkan akses sistem berkas lokal yang
tidak dapat disediakan mode bridge.

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

- `sources/` untuk materi mentah yang diimpor dan halaman berbasis bridge
- `entities/` untuk hal, orang, sistem, proyek, dan objek yang tahan lama
- `concepts/` untuk ide, abstraksi, pola, dan kebijakan
- `syntheses/` untuk ringkasan terkompilasi dan rollup yang dipelihara
- `reports/` untuk dasbor yang dihasilkan

## Klaim dan bukti terstruktur

Halaman dapat membawa frontmatter `claims` terstruktur, bukan hanya teks bentuk bebas.

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

Inilah yang membuat wiki bertindak lebih seperti lapisan keyakinan daripada dump catatan
pasif. Klaim dapat dilacak, diberi skor, diperdebatkan, dan ditelusuri kembali ke sumber.

## Metadata entitas untuk agen

Halaman entitas juga dapat membawa metadata routing untuk penggunaan agen. Ini adalah
frontmatter generik, sehingga berfungsi untuk orang, tim, sistem, proyek, atau jenis
entitas lainnya.

Bidang umum meliputi:

- `entityType`: misalnya `person`, `team`, `system`, atau `project`
- `canonicalId`: kunci identitas stabil yang digunakan di seluruh alias dan impor
- `aliases`: nama, handle, atau label yang harus mengarah ke halaman yang sama
- `privacyTier`: `public`, `local-private`, `sensitive`, atau `confirm-before-use`
- `bestUsedFor` / `notEnoughFor`: petunjuk routing ringkas
- `lastRefreshedAt`: timestamp penyegaran sumber yang terpisah dari waktu edit halaman
- `personCard`: kartu routing khusus orang opsional dengan handle, sosial,
  email, zona waktu, jalur, ask-for, avoid-asking-for, keyakinan, dan privasi
- `relationships`: edge bertipe ke halaman terkait dengan target, jenis, bobot,
  keyakinan, jenis bukti, tingkat privasi, dan catatan

Untuk wiki orang, agen biasanya harus memulai dengan
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

Langkah kompilasi membaca halaman wiki, menormalisasi ringkasan, dan memancarkan
artefak stabil yang menghadap mesin di bawah:

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

Digest ini ada agar agen dan kode runtime tidak perlu mengikis halaman Markdown.

Output terkompilasi juga mendukung:

- pengindeksan wiki lintasan pertama untuk alur search/get
- lookup claim-id kembali ke halaman pemilik
- suplemen prompt ringkas
- pembuatan laporan/dasbor

## Dasbor dan laporan kesehatan

Saat `render.createDashboards` diaktifkan, compile memelihara dasbor di bawah
`reports/`.

Laporan bawaan meliputi:

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

- klaster catatan kontradiksi
- klaster klaim yang bersaing
- klaim yang kehilangan bukti terstruktur
- halaman dan klaim berkeyakinan rendah
- kesegaran yang basi atau tidak diketahui
- halaman dengan pertanyaan yang belum terselesaikan
- kartu routing orang/entitas
- edge hubungan terstruktur
- cakupan kelas bukti
- tingkat privasi non-publik yang perlu ditinjau sebelum digunakan

## Pencarian dan pengambilan

`memory-wiki` mendukung dua backend pencarian:

- `shared`: gunakan alur pencarian memori bersama saat tersedia
- `local`: cari wiki secara lokal

Ini juga mendukung tiga korpus:

- `wiki`
- `memory`
- `all`

Perilaku penting:

- `wiki_search` dan `wiki_get` menggunakan digest terkompilasi sebagai lintasan pertama bila memungkinkan
- id klaim dapat ditelusuri kembali ke halaman pemilik
- klaim yang diperdebatkan/basi/segar memengaruhi peringkat
- label provenance dapat bertahan ke dalam hasil
- mode pencarian dapat mengarahkan peringkat untuk lookup orang, routing pertanyaan, bukti
  sumber, atau klaim mentah

Aturan praktis:

- gunakan `memory_search corpus=all` untuk satu lintasan recall luas
- gunakan `wiki_search` + `wiki_get` saat Anda peduli pada peringkat khusus wiki,
  provenance, atau struktur keyakinan tingkat halaman

Mode pencarian:

- `auto`: default seimbang
- `find-person`: tingkatkan entitas mirip orang, alias, handle, sosial, dan
  ID kanonis
- `route-question`: tingkatkan kartu agen, petunjuk ask-for, petunjuk best-used-for, dan
  konteks hubungan
- `source-evidence`: tingkatkan halaman sumber dan metadata bukti terstruktur
- `raw-claim`: tingkatkan klaim terstruktur yang cocok dan kembalikan metadata klaim/bukti
  dalam hasil

Saat hasil cocok dengan klaim terstruktur, `wiki_search` dapat mengembalikan
`matchedClaimId`, `matchedClaimStatus`, `matchedClaimConfidence`,
`evidenceKinds`, dan `evidenceSourceIds` dalam payload detailnya. Output teks
juga menyertakan baris `Claim:` dan `Evidence:` ringkas saat tersedia.

## Alat agen

Plugin mendaftarkan alat ini:

- `wiki_status`
- `wiki_search`
- `wiki_get`
- `wiki_apply`
- `wiki_lint`

Yang dilakukan alat-alat tersebut:

- `wiki_status`: mode brankas saat ini, kesehatan, ketersediaan CLI Obsidian
- `wiki_search`: mencari halaman wiki dan, saat dikonfigurasi, korpus memori bersama;
  menerima `mode` untuk lookup orang, routing pertanyaan, bukti sumber, atau drilldown
  klaim mentah
- `wiki_get`: membaca halaman wiki berdasarkan id/path atau fallback ke korpus memori bersama
- `wiki_apply`: mutasi sintesis/metadata sempit tanpa operasi halaman bentuk bebas
- `wiki_lint`: pemeriksaan struktural, celah provenance, kontradiksi, pertanyaan terbuka

Plugin juga mendaftarkan suplemen korpus memori non-eksklusif, sehingga
`memory_search` dan `memory_get` bersama dapat menjangkau wiki saat Plugin Active Memory
mendukung pemilihan korpus.

## Perilaku prompt dan konteks

Saat `context.includeCompiledDigestPrompt` diaktifkan, bagian prompt memori
menambahkan snapshot terkompilasi ringkas dari `agent-digest.json`.

Snapshot itu sengaja kecil dan bernilai sinyal tinggi:

- hanya halaman teratas
- hanya klaim teratas
- jumlah kontradiksi
- jumlah pertanyaan
- kualifikasi keyakinan/kesegaran

Ini opt-in karena mengubah bentuk prompt dan terutama berguna untuk mesin konteks
atau perakitan prompt lama yang secara eksplisit mengonsumsi suplemen memori.

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
- `bridge.readMemoryArtifacts`: impor artefak publik Plugin Active Memory
- `bridge.followMemoryEvents`: sertakan log peristiwa dalam mode bridge
- `search.backend`: `shared` atau `local`
- `search.corpus`: `wiki`, `memory`, atau `all`
- `context.includeCompiledDigestPrompt`: tambahkan snapshot digest ringkas ke bagian prompt memori
- `render.createBacklinks`: hasilkan blok terkait yang deterministik
- `render.createDashboards`: hasilkan halaman dasbor

### Contoh: mode QMD + bridge

Gunakan ini saat Anda menginginkan QMD untuk recall dan `memory-wiki` untuk lapisan
pengetahuan yang terpelihara:

```json5
{
  memory: {
    backend: "qmd",
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

- QMD bertanggung jawab atas recall Active Memory
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
dan secara opsional dapat menggunakan CLI resmi `obsidian`.

Alur kerja yang didukung mencakup:

- probing status
- pencarian vault
- membuka halaman
- menjalankan perintah Obsidian
- melompat ke catatan harian

Ini bersifat opsional. Wiki tetap berfungsi dalam mode native tanpa Obsidian.

## Alur kerja yang disarankan

1. Pertahankan Plugin Active Memory Anda untuk recall/promosi/dreaming.
2. Aktifkan `memory-wiki`.
3. Mulai dengan mode `isolated` kecuali Anda secara eksplisit menginginkan mode bridge.
4. Gunakan `wiki_search` / `wiki_get` saat provenance penting.
5. Gunakan `wiki_apply` untuk sintesis sempit atau pembaruan metadata.
6. Jalankan `wiki_lint` setelah perubahan bermakna.
7. Aktifkan dasbor jika Anda menginginkan visibilitas kedaluwarsa/kontradiksi.

## Dokumen terkait

- [Ikhtisar Memori](/id/concepts/memory)
- [CLI: memory](/id/cli/memory)
- [CLI: wiki](/id/cli/wiki)
- [Ikhtisar SDK Plugin](/id/plugins/sdk-overview)
