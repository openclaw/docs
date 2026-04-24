---
read_when:
    - Anda ingin mengonfigurasi provider pencarian memori atau model embedding
    - Anda ingin menyiapkan backend QMD
    - Anda ingin menyesuaikan pencarian hibrida, MMR, atau peluruhan temporal
    - Anda ingin mengaktifkan pengindeksan memori multimodal
summary: Semua opsi konfigurasi untuk pencarian memori, provider embedding, QMD, pencarian hibrida, dan pengindeksan multimodal
title: Referensi konfigurasi memori
x-i18n:
    generated_at: "2026-04-24T09:26:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: b9152d6cdf3959319c2ba000fae06c72b27b9b8c90ee08ce57b80d1c0670f850
    source_path: reference/memory-config.md
    workflow: 15
---

Halaman ini mencantumkan setiap opsi konfigurasi untuk pencarian memori OpenClaw. Untuk
gambaran umum konseptual, lihat:

- [Gambaran Umum Memori](/id/concepts/memory) -- cara kerja memori
- [Engine Bawaan](/id/concepts/memory-builtin) -- backend SQLite default
- [Engine QMD](/id/concepts/memory-qmd) -- sidecar local-first
- [Pencarian Memori](/id/concepts/memory-search) -- pipeline pencarian dan penyesuaian
- [Active Memory](/id/concepts/active-memory) -- mengaktifkan sub-agen memori untuk sesi interaktif

Semua pengaturan pencarian memori berada di bawah `agents.defaults.memorySearch` dalam
`openclaw.json` kecuali jika dinyatakan lain.

Jika Anda mencari toggle fitur **Active Memory** dan konfigurasi sub-agen,
itu berada di bawah `plugins.entries.active-memory` alih-alih `memorySearch`.

Active Memory menggunakan model dua gerbang:

1. Plugin harus diaktifkan dan menargetkan id agen saat ini
2. Permintaan harus berupa sesi chat persisten interaktif yang memenuhi syarat

Lihat [Active Memory](/id/concepts/active-memory) untuk model aktivasi,
konfigurasi milik Plugin, persistensi transkrip, dan pola peluncuran yang aman.

---

## Pemilihan provider

| Kunci      | Tipe      | Default          | Deskripsi                                                                                                          |
| ---------- | --------- | ---------------- | ------------------------------------------------------------------------------------------------------------------ |
| `provider` | `string`  | terdeteksi otomatis | ID adaptor embedding: `bedrock`, `gemini`, `github-copilot`, `local`, `mistral`, `ollama`, `openai`, `voyage` |
| `model`    | `string`  | default provider | Nama model embedding                                                                                               |
| `fallback` | `string`  | `"none"`         | ID adaptor fallback saat provider utama gagal                                                                      |
| `enabled`  | `boolean` | `true`           | Mengaktifkan atau menonaktifkan pencarian memori                                                                   |

### Urutan deteksi otomatis

Saat `provider` tidak ditetapkan, OpenClaw memilih yang pertama tersedia:

1. `local` -- jika `memorySearch.local.modelPath` dikonfigurasi dan file ada.
2. `github-copilot` -- jika token GitHub Copilot dapat di-resolve (variabel env atau profil auth).
3. `openai` -- jika key OpenAI dapat di-resolve.
4. `gemini` -- jika key Gemini dapat di-resolve.
5. `voyage` -- jika key Voyage dapat di-resolve.
6. `mistral` -- jika key Mistral dapat di-resolve.
7. `bedrock` -- jika rantai kredensial default AWS SDK berhasil di-resolve (instance role, access key, profile, SSO, web identity, atau shared config).

`ollama` didukung tetapi tidak terdeteksi otomatis (tetapkan secara eksplisit).

### Resolusi API key

Embedding jarak jauh memerlukan API key. Bedrock menggunakan rantai kredensial
default AWS SDK sebagai gantinya (instance role, SSO, access key).

| Provider       | Variabel env                                        | Kunci konfigurasi                 |
| -------------- | --------------------------------------------------- | --------------------------------- |
| Bedrock        | rantai kredensial AWS                               | Tidak perlu API key               |
| Gemini         | `GEMINI_API_KEY`                                    | `models.providers.google.apiKey`  |
| GitHub Copilot | `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, `GITHUB_TOKEN`  | Profil auth via device login      |
| Mistral        | `MISTRAL_API_KEY`                                   | `models.providers.mistral.apiKey` |
| Ollama         | `OLLAMA_API_KEY` (placeholder)                      | --                                |
| OpenAI         | `OPENAI_API_KEY`                                    | `models.providers.openai.apiKey`  |
| Voyage         | `VOYAGE_API_KEY`                                    | `models.providers.voyage.apiKey`  |

OAuth Codex hanya mencakup chat/completions dan tidak memenuhi permintaan
embedding.

---

## Konfigurasi endpoint jarak jauh

Untuk endpoint kustom yang kompatibel dengan OpenAI atau mengganti default provider:

| Kunci            | Tipe     | Deskripsi                                         |
| ---------------- | -------- | ------------------------------------------------- |
| `remote.baseUrl` | `string` | Base URL API kustom                               |
| `remote.apiKey`  | `string` | Mengganti API key                                 |
| `remote.headers` | `object` | Header HTTP tambahan (digabung dengan default provider) |

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

| Kunci                  | Tipe     | Default                | Deskripsi                                   |
| ---------------------- | -------- | ---------------------- | ------------------------------------------- |
| `model`                | `string` | `gemini-embedding-001` | Juga mendukung `gemini-embedding-2-preview` |
| `outputDimensionality` | `number` | `3072`                 | Untuk Embedding 2: 768, 1536, atau 3072     |

<Warning>
Mengubah model atau `outputDimensionality` memicu reindex penuh otomatis.
</Warning>

---

## Konfigurasi embedding Bedrock

Bedrock menggunakan rantai kredensial default AWS SDK -- tidak memerlukan API key.
Jika OpenClaw berjalan di EC2 dengan instance role yang mendukung Bedrock, cukup tetapkan
provider dan model:

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "bedrock",
        model: "amazon.titan-embed-text-v2:0",
      },
    },
  },
}
```

| Kunci                  | Tipe     | Default                        | Deskripsi                      |
| ---------------------- | -------- | ------------------------------ | ------------------------------ |
| `model`                | `string` | `amazon.titan-embed-text-v2:0` | ID model embedding Bedrock apa pun |
| `outputDimensionality` | `number` | default model                  | Untuk Titan V2: 256, 512, atau 1024 |

### Model yang didukung

Model berikut didukung (dengan deteksi keluarga dan default dimensi):

| ID Model                                   | Provider   | Dims Default | Dims yang Dapat Dikonfigurasi |
| ------------------------------------------ | ---------- | ------------ | ----------------------------- |
| `amazon.titan-embed-text-v2:0`             | Amazon     | 1024         | 256, 512, 1024                |
| `amazon.titan-embed-text-v1`               | Amazon     | 1536         | --                            |
| `amazon.titan-embed-g1-text-02`            | Amazon     | 1536         | --                            |
| `amazon.titan-embed-image-v1`              | Amazon     | 1024         | --                            |
| `amazon.nova-2-multimodal-embeddings-v1:0` | Amazon     | 1024         | 256, 384, 1024, 3072          |
| `cohere.embed-english-v3`                  | Cohere     | 1024         | --                            |
| `cohere.embed-multilingual-v3`             | Cohere     | 1024         | --                            |
| `cohere.embed-v4:0`                        | Cohere     | 1536         | 256-1536                      |
| `twelvelabs.marengo-embed-3-0-v1:0`        | TwelveLabs | 512          | --                            |
| `twelvelabs.marengo-embed-2-7-v1:0`        | TwelveLabs | 1024         | --                            |

Varian dengan sufiks throughput (misalnya, `amazon.titan-embed-text-v1:2:8k`) mewarisi
konfigurasi model dasarnya.

### Autentikasi

Auth Bedrock menggunakan urutan resolusi kredensial AWS SDK standar:

1. Variabel lingkungan (`AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`)
2. Cache token SSO
3. Kredensial token web identity
4. File shared credentials dan config
5. Kredensial metadata ECS atau EC2

Region di-resolve dari `AWS_REGION`, `AWS_DEFAULT_REGION`, `baseUrl` provider
`amazon-bedrock`, atau default ke `us-east-1`.

### Izin IAM

Role atau pengguna IAM memerlukan:

```json
{
  "Effect": "Allow",
  "Action": "bedrock:InvokeModel",
  "Resource": "*"
}
```

Untuk least-privilege, batasi `InvokeModel` ke model tertentu:

```
arn:aws:bedrock:*::foundation-model/amazon.titan-embed-text-v2:0
```

---

## Konfigurasi embedding lokal

| Kunci                 | Tipe               | Default                | Deskripsi                                                                                                                                                                                                                                                                                                             |
| --------------------- | ------------------ | ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `local.modelPath`     | `string`           | diunduh otomatis       | Path ke file model GGUF                                                                                                                                                                                                                                                                                               |
| `local.modelCacheDir` | `string`           | default node-llama-cpp | Direktori cache untuk model yang diunduh                                                                                                                                                                                                                                                                              |
| `local.contextSize`   | `number \| "auto"` | `4096`                 | Ukuran jendela konteks untuk konteks embedding. 4096 mencakup chunk umum (128–512 token) sambil membatasi VRAM non-bobot. Turunkan ke 1024–2048 pada host terbatas. `"auto"` menggunakan maksimum terlatih model — tidak disarankan untuk model 8B+ (Qwen3-Embedding-8B: 40 960 token → ~32 GB VRAM vs ~8.8 GB pada 4096). |

Model default: `embeddinggemma-300m-qat-Q8_0.gguf` (~0.6 GB, diunduh otomatis).
Memerlukan build native: `pnpm approve-builds` lalu `pnpm rebuild node-llama-cpp`.

Gunakan CLI mandiri untuk memverifikasi jalur provider yang sama dengan yang digunakan Gateway:

```bash
openclaw memory status --deep --agent main
openclaw memory index --force --agent main
```

Jika `provider` adalah `auto`, `local` dipilih hanya saat `local.modelPath` menunjuk
ke file lokal yang ada. Referensi model `hf:` dan HTTP(S) tetap dapat digunakan
secara eksplisit dengan `provider: "local"`, tetapi referensi tersebut tidak membuat `auto` memilih local
sebelum model tersedia di disk.

---

## Konfigurasi pencarian hibrida

Semua berada di bawah `memorySearch.query.hybrid`:

| Kunci                 | Tipe      | Default | Deskripsi                         |
| --------------------- | --------- | ------- | --------------------------------- |
| `enabled`             | `boolean` | `true`  | Mengaktifkan pencarian hibrida BM25 + vektor |
| `vectorWeight`        | `number`  | `0.7`   | Bobot untuk skor vektor (0-1)     |
| `textWeight`          | `number`  | `0.3`   | Bobot untuk skor BM25 (0-1)       |
| `candidateMultiplier` | `number`  | `4`     | Pengali ukuran kumpulan kandidat  |

### MMR (keberagaman)

| Kunci         | Tipe      | Default | Deskripsi                               |
| ------------- | --------- | ------- | --------------------------------------- |
| `mmr.enabled` | `boolean` | `false` | Mengaktifkan peringkat ulang MMR        |
| `mmr.lambda`  | `number`  | `0.7`   | 0 = keberagaman maksimum, 1 = relevansi maksimum |

### Peluruhan temporal (kekinian)

| Kunci                        | Tipe      | Default | Deskripsi                  |
| ---------------------------- | --------- | ------- | -------------------------- |
| `temporalDecay.enabled`      | `boolean` | `false` | Mengaktifkan boost kekinian |
| `temporalDecay.halfLifeDays` | `number`  | `30`    | Skor berkurang setengah setiap N hari |

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

## Path memori tambahan

| Kunci       | Tipe       | Deskripsi                                 |
| ----------- | ---------- | ----------------------------------------- |
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

Path dapat berupa absolut atau relatif terhadap workspace. Direktori dipindai
secara rekursif untuk file `.md`. Penanganan symlink bergantung pada backend aktif:
engine bawaan mengabaikan symlink, sedangkan QMD mengikuti perilaku scanner QMD
yang mendasarinya.

Untuk pencarian transkrip lintas agen yang dibatasi per agen, gunakan
`agents.list[].memorySearch.qmd.extraCollections` alih-alih `memory.qmd.paths`.
Extra collection tersebut mengikuti bentuk `{ path, name, pattern? }` yang sama, tetapi
digabungkan per agen dan dapat mempertahankan nama bersama eksplisit saat path
mengarah ke luar workspace saat ini.
Jika path hasil resolve yang sama muncul di `memory.qmd.paths` dan
`memorySearch.qmd.extraCollections`, QMD mempertahankan entri pertama dan melewati
duplikatnya.

---

## Memori multimodal (Gemini)

Indeks gambar dan audio bersama Markdown menggunakan Gemini Embedding 2:

| Kunci                     | Tipe       | Default    | Deskripsi                             |
| ------------------------- | ---------- | ---------- | ------------------------------------- |
| `multimodal.enabled`      | `boolean`  | `false`    | Mengaktifkan pengindeksan multimodal  |
| `multimodal.modalities`   | `string[]` | --         | `["image"]`, `["audio"]`, atau `["all"]` |
| `multimodal.maxFileBytes` | `number`   | `10000000` | Ukuran file maksimum untuk pengindeksan |

Hanya berlaku untuk file di `extraPaths`. Root memori default tetap hanya Markdown.
Memerlukan `gemini-embedding-2-preview`. `fallback` harus `"none"`.

Format yang didukung: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.heic`, `.heif`
(gambar); `.mp3`, `.wav`, `.ogg`, `.opus`, `.m4a`, `.aac`, `.flac` (audio).

---

## Cache embedding

| Kunci              | Tipe      | Default | Deskripsi                           |
| ------------------ | --------- | ------- | ----------------------------------- |
| `cache.enabled`    | `boolean` | `false` | Cache embedding chunk di SQLite     |
| `cache.maxEntries` | `number`  | `50000` | Jumlah maksimum embedding yang di-cache |

Mencegah embedding ulang untuk teks yang tidak berubah selama reindex atau pembaruan transkrip.

---

## Pengindeksan batch

| Kunci                         | Tipe      | Default | Deskripsi                    |
| ----------------------------- | --------- | ------- | ---------------------------- |
| `remote.batch.enabled`        | `boolean` | `false` | Mengaktifkan API embedding batch |
| `remote.batch.concurrency`    | `number`  | `2`     | Job batch paralel            |
| `remote.batch.wait`           | `boolean` | `true`  | Menunggu penyelesaian batch  |
| `remote.batch.pollIntervalMs` | `number`  | --      | Interval polling             |
| `remote.batch.timeoutMinutes` | `number`  | --      | Timeout batch                |

Tersedia untuk `openai`, `gemini`, dan `voyage`. Batch OpenAI biasanya
paling cepat dan paling murah untuk backfill besar.

---

## Pencarian memori sesi (eksperimental)

Indeks transkrip sesi dan tampilkan melalui `memory_search`:

| Kunci                       | Tipe       | Default      | Deskripsi                                |
| --------------------------- | ---------- | ------------ | ---------------------------------------- |
| `experimental.sessionMemory` | `boolean`  | `false`      | Mengaktifkan pengindeksan sesi           |
| `sources`                   | `string[]` | `["memory"]` | Tambahkan `"sessions"` untuk menyertakan transkrip |
| `sync.sessions.deltaBytes`  | `number`   | `100000`     | Ambang byte untuk reindex                |
| `sync.sessions.deltaMessages` | `number` | `50`         | Ambang pesan untuk reindex               |

Pengindeksan sesi bersifat opt-in dan berjalan secara asinkron. Hasilnya bisa sedikit
tidak mutakhir. Log sesi berada di disk, jadi perlakukan akses filesystem sebagai
batas kepercayaan.

---

## Akselerasi vektor SQLite (sqlite-vec)

| Kunci                        | Tipe      | Default  | Deskripsi                            |
| ---------------------------- | --------- | -------- | ------------------------------------ |
| `store.vector.enabled`       | `boolean` | `true`   | Menggunakan sqlite-vec untuk kueri vektor |
| `store.vector.extensionPath` | `string`  | bundled  | Mengganti path sqlite-vec            |

Saat sqlite-vec tidak tersedia, OpenClaw secara otomatis kembali ke cosine
similarity dalam proses.

---

## Penyimpanan indeks

| Kunci               | Tipe     | Default                               | Deskripsi                                  |
| ------------------- | -------- | ------------------------------------- | ------------------------------------------ |
| `store.path`        | `string` | `~/.openclaw/memory/{agentId}.sqlite` | Lokasi indeks (mendukung token `{agentId}`) |
| `store.fts.tokenizer` | `string` | `unicode61`                         | Tokenizer FTS5 (`unicode61` atau `trigram`) |

---

## Konfigurasi backend QMD

Tetapkan `memory.backend = "qmd"` untuk mengaktifkan. Semua pengaturan QMD berada di bawah
`memory.qmd`:

| Kunci                    | Tipe      | Default  | Deskripsi                                   |
| ------------------------ | --------- | -------- | ------------------------------------------- |
| `command`                | `string`  | `qmd`    | Path executable QMD                         |
| `searchMode`             | `string`  | `search` | Perintah pencarian: `search`, `vsearch`, `query` |
| `includeDefaultMemory`   | `boolean` | `true`   | Indeks otomatis `MEMORY.md` + `memory/**/*.md` |
| `paths[]`                | `array`   | --       | Path tambahan: `{ name, path, pattern? }`   |
| `sessions.enabled`       | `boolean` | `false`  | Mengindeks transkrip sesi                   |
| `sessions.retentionDays` | `number`  | --       | Retensi transkrip                           |
| `sessions.exportDir`     | `string`  | --       | Direktori ekspor                            |

OpenClaw lebih memilih bentuk kueri koleksi dan MCP QMD saat ini, tetapi tetap
menjaga rilis QMD lama agar tetap berfungsi dengan fallback ke flag koleksi legacy `--mask`
dan nama alat MCP lama saat diperlukan.

Penggantian model QMD tetap berada di sisi QMD, bukan di konfigurasi OpenClaw. Jika Anda perlu
mengganti model QMD secara global, tetapkan variabel lingkungan seperti
`QMD_EMBED_MODEL`, `QMD_RERANK_MODEL`, dan `QMD_GENERATE_MODEL` di lingkungan runtime Gateway.

### Jadwal pembaruan

| Kunci                     | Tipe      | Default | Deskripsi                            |
| ------------------------- | --------- | ------- | ------------------------------------ |
| `update.interval`         | `string`  | `5m`    | Interval refresh                     |
| `update.debounceMs`       | `number`  | `15000` | Debounce perubahan file              |
| `update.onBoot`           | `boolean` | `true`  | Refresh saat startup                 |
| `update.waitForBootSync`  | `boolean` | `false` | Blok startup sampai refresh selesai  |
| `update.embedInterval`    | `string`  | --      | Cadence embedding terpisah           |
| `update.commandTimeoutMs` | `number`  | --      | Timeout untuk perintah QMD           |
| `update.updateTimeoutMs`  | `number`  | --      | Timeout untuk operasi update QMD     |
| `update.embedTimeoutMs`   | `number`  | --      | Timeout untuk operasi embedding QMD  |

### Batas

| Kunci                     | Tipe     | Default | Deskripsi                      |
| ------------------------- | -------- | ------- | ------------------------------ |
| `limits.maxResults`       | `number` | `6`     | Hasil pencarian maksimum       |
| `limits.maxSnippetChars`  | `number` | --      | Batasi panjang snippet         |
| `limits.maxInjectedChars` | `number` | --      | Batasi total karakter yang disuntikkan |
| `limits.timeoutMs`        | `number` | `4000`  | Timeout pencarian              |

### Cakupan

Mengontrol sesi mana yang dapat menerima hasil pencarian QMD. Skemanya sama seperti
[`session.sendPolicy`](/id/gateway/config-agents#session):

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

Default bawaan mengizinkan sesi direct dan channel, sambil tetap menolak
grup.

Default adalah hanya DM. `match.keyPrefix` mencocokkan session key yang dinormalisasi;
`match.rawKeyPrefix` mencocokkan key mentah termasuk `agent:<id>:`.

### Sitasi

`memory.citations` berlaku untuk semua backend:

| Nilai            | Perilaku                                            |
| ---------------- | --------------------------------------------------- |
| `auto` (default) | Sertakan footer `Source: <path#line>` dalam snippet |
| `on`             | Selalu sertakan footer                              |
| `off`            | Hilangkan footer (path tetap diteruskan ke agen secara internal) |

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

## Dreaming

Dreaming dikonfigurasi di bawah `plugins.entries.memory-core.config.dreaming`,
bukan di bawah `agents.defaults.memorySearch`.

Dreaming berjalan sebagai satu sweep terjadwal dan menggunakan fase light/deep/REM internal sebagai
detail implementasi.

Untuk perilaku konseptual dan slash command, lihat [Dreaming](/id/concepts/dreaming).

### Pengaturan pengguna

| Kunci       | Tipe      | Default     | Deskripsi                                            |
| ----------- | --------- | ----------- | ---------------------------------------------------- |
| `enabled`   | `boolean` | `false`     | Mengaktifkan atau menonaktifkan Dreaming sepenuhnya  |
| `frequency` | `string`  | `0 3 * * *` | Cadence Cron opsional untuk sweep Dreaming penuh     |

### Contoh

```json5
{
  plugins: {
    entries: {
      "memory-core": {
        config: {
          dreaming: {
            enabled: true,
            frequency: "0 3 * * *",
          },
        },
      },
    },
  },
}
```

Catatan:

- Dreaming menulis status mesin ke `memory/.dreams/`.
- Dreaming menulis output naratif yang dapat dibaca manusia ke `DREAMS.md` (atau `dreams.md` yang sudah ada).
- Kebijakan dan ambang fase light/deep/REM adalah perilaku internal, bukan konfigurasi yang ditujukan untuk pengguna.

## Terkait

- [Gambaran umum memori](/id/concepts/memory)
- [Pencarian memori](/id/concepts/memory-search)
- [Referensi konfigurasi](/id/gateway/configuration-reference)
