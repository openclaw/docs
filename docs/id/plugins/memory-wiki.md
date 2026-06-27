---
read_when:
    - Anda menginginkan pengetahuan persisten melampaui catatan MEMORY.md biasa
    - Anda sedang mengonfigurasi plugin memory-wiki bawaan
    - Anda ingin memahami wiki_search, wiki_get, atau mode bridge
summary: 'memory-wiki: brankas pengetahuan terkompilasi dengan asal-usul, klaim, dasbor, dan mode jembatan'
title: Wiki memori
x-i18n:
    generated_at: "2026-06-27T17:49:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 91512fbab8bfa87d3be29a75c217f99dbae11d9d7065fcc5ae9aa2c51847ec42
    source_path: plugins/memory-wiki.md
    workflow: 16
---

`memory-wiki` adalah plugin bawaan yang mengubah memori tahan lama menjadi
khazanah pengetahuan terkompilasi.

Ini **tidak** menggantikan plugin memori aktif. Plugin memori aktif tetap
memiliki recall, promotion, indexing, dan dreaming. `memory-wiki` berada di sampingnya
dan mengompilasi pengetahuan tahan lama menjadi wiki yang dapat dinavigasi dengan halaman deterministik,
klaim terstruktur, asal-usul, dasbor, dan digest yang dapat dibaca mesin.

Gunakan ini saat Anda ingin memori berperilaku lebih seperti lapisan pengetahuan yang terpelihara dan
bukan seperti tumpukan berkas Markdown.

## Yang ditambahkan

- Vault wiki khusus dengan tata letak halaman deterministik
- Metadata klaim dan bukti terstruktur, bukan sekadar prosa
- Asal-usul, keyakinan, kontradiksi, dan pertanyaan terbuka tingkat halaman
- Digest terkompilasi untuk konsumen agen/runtime
- Alat pencarian/pengambilan/penerapan/lint asli wiki
- Impor Open Knowledge Format ke dalam konsep wiki terkompilasi
- Mode bridge opsional yang mengimpor artefak publik dari plugin memori aktif
- Mode render ramah Obsidian dan integrasi CLI opsional

## Kesesuaiannya dengan memori

Pikirkan pemisahannya seperti ini:

| Lapisan                                                 | Memiliki                                                                                   |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Plugin memori aktif (`memory-core`, QMD, Honcho, dll.) | Recall, pencarian semantik, promotion, dreaming, runtime memori                             |
| `memory-wiki`                                           | Halaman wiki terkompilasi, sintesis kaya asal-usul, dasbor, pencarian/pengambilan/penerapan khusus wiki |

Jika plugin memori aktif mengekspos artefak recall bersama, OpenClaw dapat mencari
kedua lapisan dalam satu lintasan dengan `memory_search corpus=all`.

Saat Anda membutuhkan pemeringkatan khusus wiki, asal-usul, atau akses halaman langsung, gunakan
alat asli wiki sebagai gantinya.

## Pola hibrida yang direkomendasikan

Default yang kuat untuk setup local-first adalah:

- QMD sebagai backend memori aktif untuk recall dan pencarian semantik luas
- `memory-wiki` dalam mode `bridge` untuk halaman pengetahuan tersintesis yang tahan lama

Pemisahan itu bekerja dengan baik karena setiap lapisan tetap fokus:

- QMD menjaga catatan mentah, ekspor sesi, dan koleksi tambahan tetap dapat dicari
- `memory-wiki` mengompilasi entitas stabil, klaim, dasbor, dan halaman sumber

Aturan praktis:

- gunakan `memory_search` saat Anda menginginkan satu lintasan recall luas di seluruh memori
- gunakan `wiki_search` dan `wiki_get` saat Anda menginginkan hasil wiki yang sadar asal-usul
- gunakan `memory_search corpus=all` saat Anda ingin pencarian bersama mencakup kedua lapisan

Jika mode bridge melaporkan nol artefak yang diekspor, plugin memori aktif saat ini
belum mengekspos input bridge publik. Jalankan `openclaw wiki doctor` terlebih dahulu,
lalu pastikan plugin memori aktif mendukung artefak publik.

Saat mode bridge aktif dan `bridge.readMemoryArtifacts` diaktifkan,
`openclaw wiki status`, `openclaw wiki doctor`, dan `openclaw wiki bridge
import` membaca melalui Gateway yang sedang berjalan. Ini menjaga pemeriksaan bridge CLI tetap selaras
dengan konteks plugin memori runtime. Jika bridge dinonaktifkan atau pembacaan artefak
dimatikan, perintah tersebut mempertahankan perilaku lokal/offline-nya.

## Mode vault

`memory-wiki` mendukung tiga mode vault:

### `isolated`

Vault sendiri, sumber sendiri, tanpa dependensi pada `memory-core`.

Gunakan ini saat Anda ingin wiki menjadi penyimpanan pengetahuan terkurasi tersendiri.

### `bridge`

Membaca artefak memori publik dan peristiwa memori dari plugin memori aktif
melalui batas plugin SDK publik.

Gunakan ini saat Anda ingin wiki mengompilasi dan mengatur artefak yang diekspor
plugin memori tanpa masuk ke internal plugin privat.

Mode bridge dapat mengindeks:

- artefak memori yang diekspor
- laporan dream
- catatan harian
- berkas root memori
- log peristiwa memori

### `unsafe-local`

Escape hatch same-machine eksplisit untuk path privat lokal.

Mode ini sengaja eksperimental dan tidak portabel. Gunakan hanya saat Anda
memahami batas kepercayaan dan secara khusus membutuhkan akses sistem berkas lokal yang
tidak dapat disediakan mode bridge.

## Tata letak vault

Plugin menginisialisasi vault seperti ini:

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
- `entities/` untuk hal tahan lama, orang, sistem, proyek, dan objek
- `concepts/` untuk gagasan, abstraksi, pola, dan kebijakan
- `syntheses/` untuk ringkasan terkompilasi dan rollup terpelihara
- `reports/` untuk dasbor yang dihasilkan

## Impor Open Knowledge Format

`memory-wiki` dapat mengimpor bundel Open Knowledge Format yang sudah diekstrak dengan:

```bash
openclaw wiki okf import ./bundles/ga4
```

Ini paling cocok ketika katalog data, crawler dokumentasi, atau
agen enrichment sudah menghasilkan OKF: pertahankan OKF sebagai artefak pertukaran
portabel, lalu biarkan `memory-wiki` mengubahnya menjadi halaman konsep native OpenClaw dan
digest terkompilasi.

Importer mengikuti bentuk OKF v0.1:

- berkas `.md` non-reserved adalah dokumen konsep
- setiap konsep yang diimpor membutuhkan kolom frontmatter `type` yang tidak kosong
- nilai `type` OKF yang tidak dikenal diterima
- berkas reserved `index.md` dan `log.md` tidak diimpor sebagai konsep
- tautan markdown yang rusak atau eksternal dipertahankan

Halaman konsep yang diimpor diratakan di bawah `concepts/` sehingga jalur compile,
search, get, dashboard, dan prompt-digest yang ada melihatnya tanpa menambahkan pohon
wiki kedua. Setiap halaman mempertahankan ID konsep OKF asli, path sumber, `type`,
`resource`, `tags`, timestamp, dan frontmatter producer lengkap. Tautan OKF internal
ditulis ulang ke halaman konsep wiki yang dihasilkan dan juga dipancarkan sebagai entri
`relationships` terstruktur dengan `kind: okf-link`.

## Klaim dan bukti terstruktur

Halaman dapat membawa frontmatter `claims` terstruktur, bukan sekadar teks bebas.

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
pasif. Klaim dapat dilacak, dinilai, dipertentangkan, dan diselesaikan kembali ke sumber.

## Metadata entitas untuk agen

Halaman entitas juga dapat membawa metadata routing untuk penggunaan agen. Ini adalah
frontmatter generik, sehingga bekerja untuk orang, tim, sistem, proyek, atau jenis
entitas lain apa pun.

Kolom umum mencakup:

- `entityType`: misalnya `person`, `team`, `system`, atau `project`
- `canonicalId`: kunci identitas stabil yang digunakan lintas alias dan impor
- `aliases`: nama, handle, atau label yang harus mengarah ke halaman yang sama
- `privacyTier`: `public`, `local-private`, `sensitive`, atau `confirm-before-use`
- `bestUsedFor` / `notEnoughFor`: petunjuk routing ringkas
- `lastRefreshedAt`: timestamp refresh sumber yang terpisah dari waktu edit halaman
- `personCard`: kartu routing khusus orang opsional dengan handle, sosial,
  email, zona waktu, lane, ask-for, avoid-asking-for, keyakinan, dan privasi
- `relationships`: edge bertipe ke halaman terkait dengan target, kind, weight,
  keyakinan, jenis bukti, tingkat privasi, dan catatan

Untuk wiki orang, agen biasanya harus memulai dari
`reports/person-agent-directory.md`, lalu membuka halaman orang dengan `wiki_get`
sebelum menggunakan detail kontak atau fakta tersimpul.

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

## Pipeline compile

Langkah compile membaca halaman wiki, menormalkan ringkasan, dan menghasilkan artefak
stabil yang ditujukan untuk mesin di bawah:

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

Digest ini ada agar agen dan kode runtime tidak perlu mengekstrak halaman
Markdown.

Output terkompilasi juga menggerakkan:

- pengindeksan wiki lintasan pertama untuk alur search/get
- lookup claim-id kembali ke halaman pemilik
- suplemen prompt ringkas
- pembuatan laporan/dasbor

## Dasbor dan laporan kesehatan

Saat `render.createDashboards` diaktifkan, compile memelihara dasbor di bawah
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

Laporan ini melacak hal seperti:

- cluster catatan kontradiksi
- cluster klaim yang bersaing
- klaim yang kehilangan bukti terstruktur
- halaman dan klaim berkeyakinan rendah
- freshness yang usang atau tidak diketahui
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

- `wiki_search` dan `wiki_get` menggunakan digest terkompilasi sebagai lintasan pertama saat memungkinkan
- ID klaim dapat diselesaikan kembali ke halaman pemilik
- klaim yang dipertentangkan/usang/segar memengaruhi pemeringkatan
- label asal-usul dapat bertahan ke dalam hasil
- mode pencarian dapat membiaskan pemeringkatan untuk pencarian orang, routing pertanyaan, sumber
  bukti, atau klaim mentah

Aturan praktis:

- gunakan `memory_search corpus=all` untuk satu lintasan recall luas
- gunakan `wiki_search` + `wiki_get` saat Anda peduli dengan pemeringkatan khusus wiki,
  asal-usul, atau struktur keyakinan tingkat halaman

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

Plugin mendaftarkan alat berikut:

- `wiki_status`
- `wiki_search`
- `wiki_get`
- `wiki_apply`
- `wiki_lint`

Yang dilakukan alat tersebut:

- `wiki_status`: mode vault saat ini, kesehatan, ketersediaan CLI Obsidian
- `wiki_search`: mencari halaman wiki dan, saat dikonfigurasi, korpora memori bersama;
  menerima `mode` untuk pencarian orang, routing pertanyaan, bukti sumber, atau drilldown
  klaim mentah
- `wiki_get`: membaca halaman wiki berdasarkan id/path atau fallback ke korpus memori bersama
- `wiki_apply`: mutasi sintesis/metadata sempit tanpa operasi halaman bebas
- `wiki_lint`: pemeriksaan struktural, celah asal-usul, kontradiksi, pertanyaan terbuka

Plugin ini juga mendaftarkan suplemen korpus memori non-eksklusif, sehingga
`memory_search` dan `memory_get` bersama dapat menjangkau wiki ketika plugin
memori aktif mendukung pemilihan korpus.

## Perilaku prompt dan konteks

Ketika `context.includeCompiledDigestPrompt` diaktifkan, bagian prompt memori
menambahkan snapshot terkompilasi yang ringkas dari `agent-digest.json`.

Snapshot tersebut sengaja dibuat kecil dan bernilai sinyal tinggi:

- hanya halaman teratas
- hanya klaim teratas
- jumlah kontradiksi
- jumlah pertanyaan
- penanda keyakinan/kebaruan

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
- `bridge.readMemoryArtifacts`: impor artefak publik plugin memori aktif
- `bridge.followMemoryEvents`: sertakan log peristiwa dalam mode bridge
- `search.backend`: `shared` atau `local`
- `search.corpus`: `wiki`, `memory`, atau `all`
- `context.includeCompiledDigestPrompt`: tambahkan snapshot digest ringkas ke bagian prompt memori
- `render.createBacklinks`: buat blok terkait yang deterministik
- `render.createDashboards`: buat halaman dasbor

### Contoh: mode QMD + bridge

Gunakan ini ketika Anda menginginkan QMD untuk recall dan `memory-wiki` untuk
lapisan pengetahuan yang dipelihara:

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

- QMD bertanggung jawab atas recall memori aktif
- `memory-wiki` berfokus pada halaman terkompilasi dan dasbor
- bentuk prompt tidak berubah hingga Anda sengaja mengaktifkan prompt digest terkompilasi

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

Ketika `vault.renderMode` adalah `obsidian`, plugin menulis Markdown yang ramah
Obsidian dan secara opsional dapat menggunakan CLI `obsidian` resmi.

Workflow yang didukung mencakup:

- pemeriksaan status
- pencarian vault
- membuka halaman
- menjalankan perintah Obsidian
- melompat ke catatan harian

Ini opsional. Wiki tetap berfungsi dalam mode native tanpa Obsidian.

## Workflow yang direkomendasikan

1. Pertahankan plugin memori aktif Anda untuk recall/promosi/Dreaming.
2. Aktifkan `memory-wiki`.
3. Mulai dengan mode `isolated` kecuali Anda secara eksplisit menginginkan mode bridge.
4. Gunakan `wiki_search` / `wiki_get` ketika provenance penting.
5. Gunakan `wiki_apply` untuk sintesis sempit atau pembaruan metadata.
6. Jalankan `wiki_lint` setelah perubahan yang bermakna.
7. Aktifkan dasbor jika Anda menginginkan visibilitas stale/kontradiksi.

## Dokumen terkait

- [Ikhtisar Memori](/id/concepts/memory)
- [CLI: memory](/id/cli/memory)
- [CLI: wiki](/id/cli/wiki)
- [Ikhtisar Plugin SDK](/id/plugins/sdk-overview)
