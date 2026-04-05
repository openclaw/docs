---
read_when:
    - Anda ingin mengonfigurasi penyedia pencarian memori atau model embedding
    - Anda ingin menyiapkan backend QMD
    - Anda ingin menyesuaikan pencarian hybrid, MMR, atau peluruhan temporal
    - Anda ingin mengaktifkan pengindeksan memori multimodal
summary: Semua opsi konfigurasi untuk pencarian memori, penyedia embedding, QMD, pencarian hybrid, dan pengindeksan multimodal
title: Referensi konfigurasi memori
x-i18n:
    generated_at: "2026-04-05T14:05:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 89e4c9740f71f5a47fc5e163742339362d6b95cb4757650c0c8a095cf3078caa
    source_path: reference/memory-config.md
    workflow: 15
---

# Referensi konfigurasi memori

Halaman ini mencantumkan setiap opsi konfigurasi untuk pencarian memori OpenClaw. Untuk
gambaran umum konseptual, lihat:

- [Gambaran Umum Memori](/id/concepts/memory) -- cara kerja memori
- [Mesin Bawaan](/id/concepts/memory-builtin) -- backend SQLite default
- [Mesin QMD](/id/concepts/memory-qmd) -- sidecar yang mengutamakan lokal
- [Pencarian Memori](/id/concepts/memory-search) -- pipeline pencarian dan penyesuaian

Semua pengaturan pencarian memori berada di bawah `agents.defaults.memorySearch` dalam
`openclaw.json` kecuali dinyatakan lain.

---

## Pemilihan penyedia

| Kunci      | Tipe      | Default          | Deskripsi                                                                       |
| ---------- | --------- | ---------------- | -------------------------------------------------------------------------------- |
| `provider` | `string`  | terdeteksi otomatis | ID adaptor embedding: `openai`, `gemini`, `voyage`, `mistral`, `ollama`, `local` |
| `model`    | `string`  | default penyedia | Nama model embedding                                                             |
| `fallback` | `string`  | `"none"`         | ID adaptor fallback saat yang utama gagal                                        |
| `enabled`  | `boolean` | `true`           | Mengaktifkan atau menonaktifkan pencarian memori                                 |

### Urutan deteksi otomatis

Saat `provider` tidak disetel, OpenClaw memilih yang pertama tersedia:

1. `local` -- jika `memorySearch.local.modelPath` dikonfigurasi dan file tersebut ada.
2. `openai` -- jika kunci OpenAI dapat diresolusikan.
3. `gemini` -- jika kunci Gemini dapat diresolusikan.
4. `voyage` -- jika kunci Voyage dapat diresolusikan.
5. `mistral` -- jika kunci Mistral dapat diresolusikan.

`ollama` didukung tetapi tidak terdeteksi otomatis (setel secara eksplisit).

### Resolusi API key

Embedding jarak jauh memerlukan API key. OpenClaw meresolusikannya dari:
profil auth, `models.providers.*.apiKey`, atau variabel lingkungan.

| Penyedia | Variabel lingkungan            | Kunci konfigurasi                 |
| -------- | ------------------------------ | --------------------------------- |
| OpenAI   | `OPENAI_API_KEY`               | `models.providers.openai.apiKey`  |
| Gemini   | `GEMINI_API_KEY`               | `models.providers.google.apiKey`  |
| Voyage   | `VOYAGE_API_KEY`               | `models.providers.voyage.apiKey`  |
| Mistral  | `MISTRAL_API_KEY`              | `models.providers.mistral.apiKey` |
| Ollama   | `OLLAMA_API_KEY` (placeholder) | --                                |

OAuth Codex hanya mencakup chat/completions dan tidak memenuhi permintaan
embedding.

---

## Konfigurasi endpoint jarak jauh

Untuk endpoint kompatibel OpenAI kustom atau mengganti default penyedia:

| Kunci            | Tipe     | Deskripsi                                        |
| ---------------- | -------- | ------------------------------------------------ |
| `remote.baseUrl` | `string` | URL dasar API kustom                             |
| `remote.apiKey`  | `string` | Menimpa API key                                  |
| `remote.headers` | `object` | Header HTTP tambahan (digabungkan dengan default penyedia) |

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "openai",
        model: "text-embedding-3-small",
        remote: {
          baseUrl: "https://api.example.com/v1/",
          apiKey: "YOUR_KEY",
        },
      },
    },
  },
}
```

---

## Konfigurasi khusus Gemini

| Kunci                  | Tipe     | Default                | Deskripsi                                 |
| ---------------------- | -------- | ---------------------- | ----------------------------------------- |
| `model`                | `string` | `gemini-embedding-001` | Juga mendukung `gemini-embedding-2-preview` |
| `outputDimensionality` | `number` | `3072`                 | Untuk Embedding 2: 768, 1536, atau 3072   |

<Warning>
Mengubah model atau `outputDimensionality` memicu pengindeksan ulang penuh otomatis.
</Warning>

---

## Konfigurasi embedding lokal

| Kunci                 | Tipe     | Default                | Deskripsi                      |
| --------------------- | -------- | ---------------------- | ------------------------------ |
| `local.modelPath`     | `string` | diunduh otomatis       | Jalur ke file model GGUF       |
| `local.modelCacheDir` | `string` | default node-llama-cpp | Direktori cache untuk model yang diunduh |

Model default: `embeddinggemma-300m-qat-Q8_0.gguf` (~0.6 GB, diunduh otomatis).
Memerlukan build native: `pnpm approve-builds` lalu `pnpm rebuild node-llama-cpp`.

---

## Konfigurasi pencarian hybrid

Semua di bawah `memorySearch.query.hybrid`:

| Kunci                 | Tipe      | Default | Deskripsi                         |
| --------------------- | --------- | ------- | --------------------------------- |
| `enabled`             | `boolean` | `true`  | Aktifkan pencarian hybrid BM25 + vektor |
| `vectorWeight`        | `number`  | `0.7`   | Bobot untuk skor vektor (0-1)     |
| `textWeight`          | `number`  | `0.3`   | Bobot untuk skor BM25 (0-1)       |
| `candidateMultiplier` | `number`  | `4`     | Pengali ukuran kumpulan kandidat  |

### MMR (keragaman)

| Kunci         | Tipe      | Default | Deskripsi                           |
| ------------- | --------- | ------- | ----------------------------------- |
| `mmr.enabled` | `boolean` | `false` | Aktifkan peringkat ulang MMR        |
| `mmr.lambda`  | `number`  | `0.7`   | 0 = keragaman maksimal, 1 = relevansi maksimal |

### Peluruhan temporal (kekinian)

| Kunci                        | Tipe      | Default | Deskripsi                  |
| ---------------------------- | --------- | ------- | -------------------------- |
| `temporalDecay.enabled`      | `boolean` | `false` | Aktifkan peningkatan kekinian |
| `temporalDecay.halfLifeDays` | `number`  | `30`    | Skor menjadi setengah setiap N hari |

File evergreen (`MEMORY.md`, file tanpa tanggal di `memory/`) tidak pernah mengalami peluruhan.

### Contoh lengkap

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        query: {
          hybrid: {
            vectorWeight: 0.7,
            textWeight: 0.3,
            mmr: { enabled: true, lambda: 0.7 },
            temporalDecay: { enabled: true, halfLifeDays: 30 },
          },
        },
      },
    },
  },
}
```

---

## Jalur memori tambahan

| Kunci        | Tipe       | Deskripsi                               |
| ------------ | ---------- | --------------------------------------- |
| `extraPaths` | `string[]` | Direktori atau file tambahan untuk diindeks |

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        extraPaths: ["../team-docs", "/srv/shared-notes"],
      },
    },
  },
}
```

Jalur dapat berupa absolut atau relatif terhadap workspace. Direktori dipindai
secara rekursif untuk file `.md`. Penanganan symlink bergantung pada backend aktif:
mesin bawaan mengabaikan symlink, sedangkan QMD mengikuti perilaku pemindai QMD
yang mendasarinya.

Untuk pencarian transkrip lintas agen yang dicakup agen, gunakan
`agents.list[].memorySearch.qmd.extraCollections` alih-alih `memory.qmd.paths`.
Koleksi tambahan tersebut mengikuti bentuk `{ path, name, pattern? }` yang sama, tetapi
digabungkan per agen dan dapat mempertahankan nama bersama yang eksplisit saat jalurnya
mengarah ke luar workspace saat ini.
Jika jalur yang sama setelah diresolusikan muncul di `memory.qmd.paths` dan
`memorySearch.qmd.extraCollections`, QMD mempertahankan entri pertama dan melewati
duplikatnya.

---

## Memori multimodal (Gemini)

Indeks gambar dan audio bersama Markdown menggunakan Gemini Embedding 2:

| Kunci                     | Tipe       | Default    | Deskripsi                             |
| ------------------------- | ---------- | ---------- | ------------------------------------- |
| `multimodal.enabled`      | `boolean`  | `false`    | Aktifkan pengindeksan multimodal      |
| `multimodal.modalities`   | `string[]` | --         | `["image"]`, `["audio"]`, atau `["all"]` |
| `multimodal.maxFileBytes` | `number`   | `10000000` | Ukuran file maksimum untuk pengindeksan |

Hanya berlaku untuk file di `extraPaths`. Root memori default tetap hanya Markdown.
Memerlukan `gemini-embedding-2-preview`. `fallback` harus `"none"`.

Format yang didukung: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.heic`, `.heif`
(gambar); `.mp3`, `.wav`, `.ogg`, `.opus`, `.m4a`, `.aac`, `.flac` (audio).

---

## Cache embedding

| Kunci            | Tipe      | Default | Deskripsi                       |
| ---------------- | --------- | ------- | ------------------------------- |
| `cache.enabled`  | `boolean` | `false` | Cache embedding potongan di SQLite |
| `cache.maxEntries` | `number` | `50000` | Maksimum embedding dalam cache  |

Mencegah embedding ulang untuk teks yang tidak berubah selama pengindeksan ulang atau pembaruan transkrip.

---

## Pengindeksan batch

| Kunci                         | Tipe      | Default | Deskripsi                 |
| ----------------------------- | --------- | ------- | ------------------------- |
| `remote.batch.enabled`        | `boolean` | `false` | Aktifkan API embedding batch |
| `remote.batch.concurrency`    | `number`  | `2`     | Pekerjaan batch paralel   |
| `remote.batch.wait`           | `boolean` | `true`  | Tunggu penyelesaian batch |
| `remote.batch.pollIntervalMs` | `number`  | --      | Interval polling          |
| `remote.batch.timeoutMinutes` | `number`  | --      | Waktu habis batch         |

Tersedia untuk `openai`, `gemini`, dan `voyage`. Batch OpenAI biasanya
paling cepat dan paling murah untuk backfill besar.

---

## Pencarian memori sesi (eksperimental)

Indeks transkrip sesi dan tampilkan melalui `memory_search`:

| Kunci                         | Tipe       | Default      | Deskripsi                              |
| ----------------------------- | ---------- | ------------ | -------------------------------------- |
| `experimental.sessionMemory`  | `boolean`  | `false`      | Aktifkan pengindeksan sesi             |
| `sources`                     | `string[]` | `["memory"]` | Tambahkan `"sessions"` untuk menyertakan transkrip |
| `sync.sessions.deltaBytes`    | `number`   | `100000`     | Ambang byte untuk pengindeksan ulang   |
| `sync.sessions.deltaMessages` | `number`   | `50`         | Ambang pesan untuk pengindeksan ulang  |

Pengindeksan sesi bersifat opt-in dan berjalan secara asinkron. Hasil dapat sedikit
tidak mutakhir. Log sesi berada di disk, jadi perlakukan akses filesystem sebagai
batas kepercayaan.

---

## Akselerasi vektor SQLite (sqlite-vec)

| Kunci                        | Tipe      | Default | Deskripsi                        |
| ---------------------------- | --------- | ------- | -------------------------------- |
| `store.vector.enabled`       | `boolean` | `true`  | Gunakan sqlite-vec untuk kueri vektor |
| `store.vector.extensionPath` | `string`  | bundled | Timpa jalur sqlite-vec           |

Saat sqlite-vec tidak tersedia, OpenClaw otomatis beralih ke cosine
similarity dalam proses.

---

## Penyimpanan indeks

| Kunci               | Tipe     | Default                               | Deskripsi                                  |
| ------------------- | -------- | ------------------------------------- | ------------------------------------------ |
| `store.path`        | `string` | `~/.openclaw/memory/{agentId}.sqlite` | Lokasi indeks (mendukung token `{agentId}`) |
| `store.fts.tokenizer` | `string` | `unicode61`                         | Tokenizer FTS5 (`unicode61` atau `trigram`) |

---

## Konfigurasi backend QMD

Setel `memory.backend = "qmd"` untuk mengaktifkan. Semua pengaturan QMD berada di bawah
`memory.qmd`:

| Kunci                    | Tipe      | Default  | Deskripsi                                   |
| ------------------------ | --------- | -------- | ------------------------------------------- |
| `command`                | `string`  | `qmd`    | Jalur executable QMD                        |
| `searchMode`             | `string`  | `search` | Perintah pencarian: `search`, `vsearch`, `query` |
| `includeDefaultMemory`   | `boolean` | `true`   | Indeks otomatis `MEMORY.md` + `memory/**/*.md` |
| `paths[]`                | `array`   | --       | Jalur tambahan: `{ name, path, pattern? }`  |
| `sessions.enabled`       | `boolean` | `false`  | Indeks transkrip sesi                       |
| `sessions.retentionDays` | `number`  | --       | Retensi transkrip                           |
| `sessions.exportDir`     | `string`  | --       | Direktori ekspor                            |

### Jadwal pembaruan

| Kunci                     | Tipe      | Default | Deskripsi                            |
| ------------------------- | --------- | ------- | ------------------------------------ |
| `update.interval`         | `string`  | `5m`    | Interval penyegaran                  |
| `update.debounceMs`       | `number`  | `15000` | Debounce perubahan file              |
| `update.onBoot`           | `boolean` | `true`  | Segarkan saat startup                |
| `update.waitForBootSync`  | `boolean` | `false` | Blokir startup sampai penyegaran selesai |
| `update.embedInterval`    | `string`  | --      | Cadence embedding terpisah           |
| `update.commandTimeoutMs` | `number`  | --      | Waktu habis untuk perintah QMD       |
| `update.updateTimeoutMs`  | `number`  | --      | Waktu habis untuk operasi pembaruan QMD |
| `update.embedTimeoutMs`   | `number`  | --      | Waktu habis untuk operasi embedding QMD |

### Batas

| Kunci                     | Tipe     | Default | Deskripsi                 |
| ------------------------- | -------- | ------- | ------------------------- |
| `limits.maxResults`       | `number` | `6`     | Maksimum hasil pencarian  |
| `limits.maxSnippetChars`  | `number` | --      | Batasi panjang cuplikan   |
| `limits.maxInjectedChars` | `number` | --      | Batasi total karakter yang disuntikkan |
| `limits.timeoutMs`        | `number` | `4000`  | Waktu habis pencarian     |

### Cakupan

Mengontrol sesi mana yang dapat menerima hasil pencarian QMD. Skemanya sama dengan
[`session.sendPolicy`](/id/gateway/configuration-reference#session):

```json5
{
  memory: {
    qmd: {
      scope: {
        default: "deny",
        rules: [{ action: "allow", match: { chatType: "direct" } }],
      },
    },
  },
}
```

Default-nya hanya DM. `match.keyPrefix` cocok dengan kunci sesi yang dinormalisasi;
`match.rawKeyPrefix` cocok dengan kunci mentah termasuk `agent:<id>:`.

### Sitasi

`memory.citations` berlaku untuk semua backend:

| Nilai            | Perilaku                                            |
| ---------------- | --------------------------------------------------- |
| `auto` (default) | Sertakan footer `Source: <path#line>` dalam cuplikan |
| `on`             | Selalu sertakan footer                              |
| `off`            | Hilangkan footer (jalur tetap diteruskan ke agen secara internal) |

### Contoh QMD lengkap

```json5
{
  memory: {
    backend: "qmd",
    citations: "auto",
    qmd: {
      includeDefaultMemory: true,
      update: { interval: "5m", debounceMs: 15000 },
      limits: { maxResults: 6, timeoutMs: 4000 },
      scope: {
        default: "deny",
        rules: [{ action: "allow", match: { chatType: "direct" } }],
      },
      paths: [{ name: "docs", path: "~/notes", pattern: "**/*.md" }],
    },
  },
}
```

---

## Dreaming (eksperimental)

Dreaming dikonfigurasi di bawah `plugins.entries.memory-core.config.dreaming`,
bukan di bawah `agents.defaults.memorySearch`. Untuk detail konseptual dan
perintah chat, lihat [Dreaming](/id/concepts/memory-dreaming).

| Kunci              | Tipe     | Default        | Deskripsi                                |
| ------------------ | -------- | -------------- | ---------------------------------------- |
| `mode`             | `string` | `"off"`        | Preset: `off`, `core`, `rem`, atau `deep` |
| `cron`             | `string` | default preset | Menimpa ekspresi cron untuk jadwal       |
| `timezone`         | `string` | zona waktu pengguna | Zona waktu untuk evaluasi jadwal     |
| `limit`            | `number` | default preset | Maksimum kandidat yang dipromosikan per siklus |
| `minScore`         | `number` | default preset | Skor berbobot minimum untuk promosi      |
| `minRecallCount`   | `number` | default preset | Ambang minimum jumlah recall             |
| `minUniqueQueries` | `number` | default preset | Ambang minimum jumlah kueri berbeda      |

### Default preset

| Mode   | Cadence        | minScore | minRecallCount | minUniqueQueries |
| ------ | -------------- | -------- | -------------- | ---------------- |
| `off`  | Dinonaktifkan  | --       | --             | --               |
| `core` | Setiap hari pukul 3 pagi | 0.75     | 3              | 2                |
| `rem`  | Setiap 6 jam   | 0.85     | 4              | 3                |
| `deep` | Setiap 12 jam  | 0.80     | 3              | 3                |

### Contoh

```json5
{
  plugins: {
    entries: {
      "memory-core": {
        config: {
          dreaming: {
            mode: "core",
            timezone: "America/New_York",
          },
        },
      },
    },
  },
}
```
