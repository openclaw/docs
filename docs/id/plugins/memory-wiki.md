---
read_when:
    - Anda menginginkan pengetahuan persisten di luar catatan MEMORY.md biasa
    - Anda sedang mengonfigurasi Plugin memory-wiki bawaan
    - Anda ingin memahami wiki_search, wiki_get, atau mode bridge
summary: 'memory-wiki: vault pengetahuan terkompilasi dengan provenance, klaim, dashboard, dan mode bridge'
title: Wiki memory
x-i18n:
    generated_at: "2026-04-24T09:19:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: d9b2637514878a87f57f1f7d19128f0a4f622852c1a25d632410cb679f081b8e
    source_path: plugins/memory-wiki.md
    workflow: 15
---

`memory-wiki` adalah Plugin bawaan yang mengubah memori tahan lama menjadi vault
pengetahuan terkompilasi.

Plugin ini **tidak** menggantikan Plugin memori aktif. Plugin memori aktif tetap
memiliki recall, promotion, indexing, dan Dreaming. `memory-wiki` berada di
sampingnya dan mengompilasi pengetahuan tahan lama menjadi wiki yang dapat
dinavigasi dengan halaman deterministik, klaim terstruktur, provenance, dashboard,
dan digest yang dapat dibaca mesin.

Gunakan Plugin ini ketika Anda ingin memori berperilaku lebih seperti lapisan
pengetahuan yang terpelihara dan kurang seperti tumpukan file Markdown.

## Yang ditambahkan

- Vault wiki khusus dengan tata letak halaman deterministik
- Metadata klaim dan bukti terstruktur, bukan hanya prosa
- Provenance, confidence, contradiction, dan open question tingkat halaman
- Digest terkompilasi untuk konsumen agen/runtime
- Tool wiki-native search/get/apply/lint
- Mode bridge opsional yang mengimpor artefak publik dari Plugin memori aktif
- Mode render yang ramah Obsidian dan integrasi CLI opsional

## Bagaimana posisinya dengan memori

Anggap pemisahannya seperti ini:

| Lapisan                                                | Memiliki                                                                                   |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| Plugin memori aktif (`memory-core`, QMD, Honcho, dll.) | Recall, semantic search, promotion, Dreaming, runtime memori                              |
| `memory-wiki`                                          | Halaman wiki terkompilasi, sintesis kaya provenance, dashboard, wiki-specific search/get/apply |

Jika Plugin memori aktif menampilkan artefak recall bersama, OpenClaw dapat menelusuri
kedua lapisan dalam satu lintasan dengan `memory_search corpus=all`.

Ketika Anda membutuhkan ranking, provenance, atau akses halaman langsung yang spesifik wiki,
gunakan tool wiki-native sebagai gantinya.

## Pola hibrida yang direkomendasikan

Default yang kuat untuk penyiapan local-first adalah:

- QMD sebagai backend memori aktif untuk recall dan semantic search yang luas
- `memory-wiki` dalam mode `bridge` untuk halaman pengetahuan sintetis yang tahan lama

Pemisahan itu bekerja dengan baik karena setiap lapisan tetap fokus:

- QMD menjaga agar catatan mentah, ekspor sesi, dan koleksi tambahan tetap dapat ditelusuri
- `memory-wiki` mengompilasi entity, claims, dashboards, dan source pages yang stabil

Aturan praktis:

- gunakan `memory_search` ketika Anda menginginkan satu lintasan recall luas di seluruh memori
- gunakan `wiki_search` dan `wiki_get` ketika Anda menginginkan hasil wiki yang sadar provenance
- gunakan `memory_search corpus=all` ketika Anda ingin pencarian bersama mencakup kedua lapisan

Jika mode bridge melaporkan nol artefak yang diekspor, Plugin memori aktif saat ini
belum menampilkan input bridge publik. Jalankan `openclaw wiki doctor` terlebih dahulu,
lalu pastikan Plugin memori aktif mendukung artefak publik.

## Mode vault

`memory-wiki` mendukung tiga mode vault:

### `isolated`

Vault sendiri, sumber sendiri, tanpa dependensi pada `memory-core`.

Gunakan ini ketika Anda ingin wiki menjadi penyimpanan pengetahuan terkurasi miliknya sendiri.

### `bridge`

Membaca artefak memori publik dan event memori dari Plugin memori aktif
melalui seam SDK Plugin publik.

Gunakan ini ketika Anda ingin wiki mengompilasi dan mengatur artefak yang diekspor
oleh Plugin memori tanpa menjangkau internal Plugin yang privat.

Mode bridge dapat mengindeks:

- artefak memori yang diekspor
- laporan mimpi
- catatan harian
- file root memori
- log event memori

### `unsafe-local`

Escape hatch eksplisit pada mesin yang sama untuk path privat lokal.

Mode ini sengaja eksperimental dan tidak portabel. Gunakan hanya ketika Anda
memahami batas kepercayaan dan secara khusus memerlukan akses filesystem lokal yang
tidak dapat disediakan oleh mode bridge.

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

Konten terkelola tetap berada di dalam blok yang dihasilkan. Blok catatan manusia tetap dipertahankan.

Grup halaman utamanya adalah:

- `sources/` untuk material mentah yang diimpor dan halaman yang didukung bridge
- `entities/` untuk hal, orang, sistem, proyek, dan objek yang tahan lama
- `concepts/` untuk ide, abstraksi, pola, dan kebijakan
- `syntheses/` untuk ringkasan terkompilasi dan rollup yang terpelihara
- `reports/` untuk dashboard yang dihasilkan

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

- `sourceId`
- `path`
- `lines`
- `weight`
- `note`
- `updatedAt`

Inilah yang membuat wiki bertindak lebih seperti lapisan keyakinan daripada sekadar
dump catatan pasif. Klaim dapat dilacak, diberi skor, diperdebatkan, dan diselesaikan kembali ke sumber.

## Pipeline kompilasi

Langkah kompilasi membaca halaman wiki, menormalkan ringkasan, dan mengeluarkan
artefak stabil yang menghadap mesin di bawah:

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

Digest ini ada agar agen dan kode runtime tidak perlu mengurai halaman Markdown.

Output terkompilasi juga mendukung:

- pengindeksan wiki lintasan pertama untuk alur search/get
- lookup id klaim kembali ke halaman pemilik
- pelengkap prompt yang ringkas
- pembuatan report/dashboard

## Dashboard dan laporan kesehatan

Ketika `render.createDashboards` diaktifkan, compile memelihara dashboard di bawah
`reports/`.

Laporan bawaan mencakup:

- `reports/open-questions.md`
- `reports/contradictions.md`
- `reports/low-confidence.md`
- `reports/claim-health.md`
- `reports/stale-pages.md`

Laporan ini melacak hal-hal seperti:

- cluster catatan contradiction
- cluster klaim yang saling bersaing
- klaim yang tidak memiliki bukti terstruktur
- halaman dan klaim dengan confidence rendah
- freshness yang usang atau tidak diketahui
- halaman dengan pertanyaan yang belum terselesaikan

## Search dan retrieval

`memory-wiki` mendukung dua backend pencarian:

- `shared`: gunakan alur memory search bersama ketika tersedia
- `local`: telusuri wiki secara lokal

Plugin ini juga mendukung tiga korpus:

- `wiki`
- `memory`
- `all`

Perilaku penting:

- `wiki_search` dan `wiki_get` menggunakan digest terkompilasi sebagai lintasan pertama bila memungkinkan
- id klaim dapat diselesaikan kembali ke halaman pemilik
- klaim contested/stale/fresh memengaruhi ranking
- label provenance dapat bertahan ke hasil

Aturan praktis:

- gunakan `memory_search corpus=all` untuk satu lintasan recall luas
- gunakan `wiki_search` + `wiki_get` ketika Anda peduli pada ranking spesifik wiki,
  provenance, atau struktur keyakinan tingkat halaman

## Tool agen

Plugin mendaftarkan tool berikut:

- `wiki_status`
- `wiki_search`
- `wiki_get`
- `wiki_apply`
- `wiki_lint`

Fungsinya:

- `wiki_status`: mode vault saat ini, kesehatan, ketersediaan CLI Obsidian
- `wiki_search`: menelusuri halaman wiki dan, ketika dikonfigurasi, korpus memori bersama
- `wiki_get`: membaca halaman wiki berdasarkan id/path atau fallback ke korpus memori bersama
- `wiki_apply`: mutasi sintesis/metadata yang sempit tanpa pembedahan halaman bebas
- `wiki_lint`: pemeriksaan struktural, celah provenance, contradiction, open question

Plugin juga mendaftarkan pelengkap korpus memori non-eksklusif, sehingga
`memory_search` dan `memory_get` bersama dapat menjangkau wiki ketika Plugin memori aktif
mendukung pemilihan korpus.

## Perilaku prompt dan konteks

Ketika `context.includeCompiledDigestPrompt` diaktifkan, bagian prompt memori
menambahkan snapshot terkompilasi yang ringkas dari `agent-digest.json`.

Snapshot itu sengaja kecil dan memiliki sinyal tinggi:

- hanya halaman teratas
- hanya klaim teratas
- jumlah contradiction
- jumlah pertanyaan
- qualifier confidence/freshness

Ini bersifat opt-in karena mengubah bentuk prompt dan terutama berguna untuk context
engine atau perakitan prompt legacy yang secara eksplisit mengonsumsi pelengkap memori.

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
- `bridge.readMemoryArtifacts`: impor artefak publik dari Plugin memori aktif
- `bridge.followMemoryEvents`: sertakan log event dalam mode bridge
- `search.backend`: `shared` atau `local`
- `search.corpus`: `wiki`, `memory`, atau `all`
- `context.includeCompiledDigestPrompt`: tambahkan snapshot digest ringkas ke bagian prompt memori
- `render.createBacklinks`: hasilkan blok terkait yang deterministik
- `render.createDashboards`: hasilkan halaman dashboard

### Contoh: QMD + mode bridge

Gunakan ini ketika Anda menginginkan QMD untuk recall dan `memory-wiki` untuk lapisan
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

Ini menjaga:

- QMD tetap bertanggung jawab atas recall memori aktif
- `memory-wiki` tetap fokus pada halaman terkompilasi dan dashboard
- bentuk prompt tetap tidak berubah sampai Anda dengan sengaja mengaktifkan prompt digest terkompilasi

## CLI

`memory-wiki` juga menampilkan permukaan CLI tingkat atas:

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

Ketika `vault.renderMode` adalah `obsidian`, Plugin menulis Markdown yang ramah
Obsidian dan secara opsional dapat menggunakan CLI `obsidian` resmi.

Alur kerja yang didukung mencakup:

- probing status
- pencarian vault
- membuka halaman
- memanggil perintah Obsidian
- melompat ke catatan harian

Ini bersifat opsional. Wiki tetap berfungsi dalam mode native tanpa Obsidian.

## Alur kerja yang direkomendasikan

1. Pertahankan Plugin memori aktif Anda untuk recall/promotion/Dreaming.
2. Aktifkan `memory-wiki`.
3. Mulai dengan mode `isolated` kecuali Anda secara eksplisit menginginkan mode bridge.
4. Gunakan `wiki_search` / `wiki_get` ketika provenance penting.
5. Gunakan `wiki_apply` untuk sintesis sempit atau pembaruan metadata.
6. Jalankan `wiki_lint` setelah perubahan yang berarti.
7. Aktifkan dashboard jika Anda menginginkan visibilitas stale/contradiction.

## Dokumentasi terkait

- [Ikhtisar Memory](/id/concepts/memory)
- [CLI: memory](/id/cli/memory)
- [CLI: wiki](/id/cli/wiki)
- [Ikhtisar SDK Plugin](/id/plugins/sdk-overview)
