---
read_when:
    - Anda ingin mengonfigurasi provider pencarian memori atau model embedding
    - Anda ingin menyiapkan backend QMD
    - Anda ingin menyesuaikan pencarian hibrida, MMR, atau temporal decay
    - Anda ingin mengaktifkan pengindeksan memori multimodal
sidebarTitle: Memory config
summary: Semua knob konfigurasi untuk pencarian memori, provider embedding, QMD, pencarian hibrida, dan pengindeksan multimodal
title: Referensi konfigurasi memori
x-i18n:
    generated_at: "2026-04-26T11:38:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 15fd747abc6d0d43cfc869faa0b5e6c1618681ef3b02068207321d60d449a901
    source_path: reference/memory-config.md
    workflow: 15
---

Halaman ini mencantumkan setiap knob konfigurasi untuk pencarian memori OpenClaw. Untuk ikhtisar konseptual, lihat:

<CardGroup cols={2}>
  <Card title="Ikhtisar memori" href="/id/concepts/memory">
    Cara kerja memori.
  </Card>
  <Card title="Mesin bawaan" href="/id/concepts/memory-builtin">
    Backend SQLite default.
  </Card>
  <Card title="Mesin QMD" href="/id/concepts/memory-qmd">
    Sidecar yang mengutamakan lokal.
  </Card>
  <Card title="Pencarian memori" href="/id/concepts/memory-search">
    Pipeline pencarian dan penyesuaian.
  </Card>
  <Card title="Active Memory" href="/id/concepts/active-memory">
    Sub-agen memori untuk sesi interaktif.
  </Card>
</CardGroup>

Semua pengaturan pencarian memori berada di bawah `agents.defaults.memorySearch` dalam `openclaw.json` kecuali jika dinyatakan lain.

<Note>
Jika Anda mencari toggle fitur **Active Memory** dan konfigurasi sub-agennya, itu berada di bawah `plugins.entries.active-memory`, bukan `memorySearch`.

Active Memory menggunakan model dua gerbang:

1. plugin harus diaktifkan dan menargetkan ID agen saat ini
2. permintaan harus berupa sesi chat persisten interaktif yang memenuhi syarat

Lihat [Active Memory](/id/concepts/active-memory) untuk model aktivasi, konfigurasi milik plugin, persistensi transkrip, dan pola rollout yang aman.
</Note>

---

## Pemilihan provider

| Key        | Type      | Default          | Deskripsi                                                                                                         |
| ---------- | --------- | ---------------- | ----------------------------------------------------------------------------------------------------------------- |
| `provider` | `string`  | terdeteksi otomatis | ID adaptor embedding: `bedrock`, `gemini`, `github-copilot`, `local`, `mistral`, `ollama`, `openai`, `voyage` |
| `model`    | `string`  | default provider | Nama model embedding                                                                                              |
| `fallback` | `string`  | `"none"`         | ID adaptor fallback saat yang utama gagal                                                                         |
| `enabled`  | `boolean` | `true`           | Aktifkan atau nonaktifkan pencarian memori                                                                        |

### Urutan deteksi otomatis

Saat `provider` tidak disetel, OpenClaw memilih yang pertama tersedia:

<Steps>
  <Step title="local">
    Dipilih jika `memorySearch.local.modelPath` dikonfigurasi dan file ada.
  </Step>
  <Step title="github-copilot">
    Dipilih jika token GitHub Copilot dapat diresolusikan (variabel lingkungan atau profil autentikasi).
  </Step>
  <Step title="openai">
    Dipilih jika kunci OpenAI dapat diresolusikan.
  </Step>
  <Step title="gemini">
    Dipilih jika kunci Gemini dapat diresolusikan.
  </Step>
  <Step title="voyage">
    Dipilih jika kunci Voyage dapat diresolusikan.
  </Step>
  <Step title="mistral">
    Dipilih jika kunci Mistral dapat diresolusikan.
  </Step>
  <Step title="bedrock">
    Dipilih jika rantai kredensial AWS SDK dapat diresolusikan (instance role, access key, profil, SSO, web identity, atau konfigurasi bersama).
  </Step>
</Steps>

`ollama` didukung tetapi tidak terdeteksi otomatis (setel secara eksplisit).

### Resolusi kunci API

Embedding jarak jauh memerlukan kunci API. Bedrock menggunakan rantai kredensial default AWS SDK sebagai gantinya (instance role, SSO, access key).

| Provider       | Variabel lingkungan                               | Key konfigurasi                   |
| -------------- | ------------------------------------------------- | --------------------------------- |
| Bedrock        | rantai kredensial AWS                             | Tidak memerlukan kunci API        |
| Gemini         | `GEMINI_API_KEY`                                  | `models.providers.google.apiKey`  |
| GitHub Copilot | `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, `GITHUB_TOKEN` | Profil autentikasi melalui login perangkat |
| Mistral        | `MISTRAL_API_KEY`                                 | `models.providers.mistral.apiKey` |
| Ollama         | `OLLAMA_API_KEY` (placeholder)                    | --                                |
| OpenAI         | `OPENAI_API_KEY`                                  | `models.providers.openai.apiKey`  |
| Voyage         | `VOYAGE_API_KEY`                                  | `models.providers.voyage.apiKey`  |

<Note>
OAuth Codex hanya mencakup chat/completions dan tidak memenuhi permintaan embedding.
</Note>

---

## Konfigurasi endpoint jarak jauh

Untuk endpoint kustom yang kompatibel dengan OpenAI atau mengoverride default provider:

<ParamField path="remote.baseUrl" type="string">
  URL dasar API kustom.
</ParamField>
<ParamField path="remote.apiKey" type="string">
  Override kunci API.
</ParamField>
<ParamField path="remote.headers" type="object">
  Header HTTP tambahan (digabungkan dengan default provider).
</ParamField>

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

## Konfigurasi khusus provider

<AccordionGroup>
  <Accordion title="Gemini">
    | Key                    | Type     | Default                | Deskripsi                                |
    | ---------------------- | -------- | ---------------------- | ---------------------------------------- |
    | `model`                | `string` | `gemini-embedding-001` | Juga mendukung `gemini-embedding-2-preview` |
    | `outputDimensionality` | `number` | `3072`                 | Untuk Embedding 2: 768, 1536, atau 3072  |

    <Warning>
    Mengubah model atau `outputDimensionality` memicu reindeks penuh otomatis.
    </Warning>

  </Accordion>
  <Accordion title="Bedrock">
    Bedrock menggunakan rantai kredensial default AWS SDK — tidak memerlukan kunci API. Jika OpenClaw berjalan di EC2 dengan instance role yang mendukung Bedrock, cukup setel provider dan model:

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

    | Key                    | Type     | Default                        | Deskripsi                     |
    | ---------------------- | -------- | ------------------------------ | ----------------------------- |
    | `model`                | `string` | `amazon.titan-embed-text-v2:0` | ID model embedding Bedrock apa pun |
    | `outputDimensionality` | `number` | default model                  | Untuk Titan V2: 256, 512, atau 1024 |

    **Model yang didukung** (dengan deteksi keluarga dan dimensi default):

    | Model ID                                   | Provider   | Dimensi default | Dimensi yang dapat dikonfigurasi |
    | ------------------------------------------ | ---------- | --------------- | -------------------------------- |
    | `amazon.titan-embed-text-v2:0`             | Amazon     | 1024            | 256, 512, 1024                   |
    | `amazon.titan-embed-text-v1`               | Amazon     | 1536            | --                               |
    | `amazon.titan-embed-g1-text-02`            | Amazon     | 1536            | --                               |
    | `amazon.titan-embed-image-v1`              | Amazon     | 1024            | --                               |
    | `amazon.nova-2-multimodal-embeddings-v1:0` | Amazon     | 1024            | 256, 384, 1024, 3072             |
    | `cohere.embed-english-v3`                  | Cohere     | 1024            | --                               |
    | `cohere.embed-multilingual-v3`             | Cohere     | 1024            | --                               |
    | `cohere.embed-v4:0`                        | Cohere     | 1536            | 256-1536                         |
    | `twelvelabs.marengo-embed-3-0-v1:0`        | TwelveLabs | 512             | --                               |
    | `twelvelabs.marengo-embed-2-7-v1:0`        | TwelveLabs | 1024            | --                               |

    Varian dengan sufiks throughput (misalnya, `amazon.titan-embed-text-v1:2:8k`) mewarisi konfigurasi model dasar.

    **Autentikasi:** autentikasi Bedrock menggunakan urutan resolusi kredensial AWS SDK standar:

    1. Variabel lingkungan (`AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`)
    2. Cache token SSO
    3. Kredensial token web identity
    4. File kredensial bersama dan file konfigurasi
    5. Kredensial metadata ECS atau EC2

    Region diresolusikan dari `AWS_REGION`, `AWS_DEFAULT_REGION`, `baseUrl` provider `amazon-bedrock`, atau default ke `us-east-1`.

    **Izin IAM:** role atau pengguna IAM memerlukan:

    ```json
    {
      "Effect": "Allow",
      "Action": "bedrock:InvokeModel",
      "Resource": "*"
    }
    ```

    Untuk hak akses minimal, batasi `InvokeModel` ke model tertentu:

    ```
    arn:aws:bedrock:*::foundation-model/amazon.titan-embed-text-v2:0
    ```

  </Accordion>
  <Accordion title="Local (GGUF + node-llama-cpp)">
    | Key                   | Type               | Default                | Deskripsi                                                                                                                                                                                                                                                                                                          |
    | --------------------- | ------------------ | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
    | `local.modelPath`     | `string`           | diunduh otomatis       | Path ke file model GGUF                                                                                                                                                                                                                                                                                            |
    | `local.modelCacheDir` | `string`           | default node-llama-cpp | Direktori cache untuk model yang diunduh                                                                                                                                                                                                                                                                           |
    | `local.contextSize`   | `number \| "auto"` | `4096`                 | Ukuran jendela konteks untuk konteks embedding. 4096 mencakup chunk tipikal (128–512 token) sambil membatasi VRAM non-bobot. Turunkan ke 1024–2048 pada host terbatas. `"auto"` menggunakan maksimum terlatih model — tidak direkomendasikan untuk model 8B+ (Qwen3-Embedding-8B: 40 960 token → ~32 GB VRAM vs ~8.8 GB pada 4096). |

    Model default: `embeddinggemma-300m-qat-Q8_0.gguf` (~0,6 GB, diunduh otomatis). Memerlukan build native: `pnpm approve-builds` lalu `pnpm rebuild node-llama-cpp`.

    Gunakan CLI mandiri untuk memverifikasi path provider yang sama dengan yang digunakan Gateway:

    ```bash
    openclaw memory status --deep --agent main
    openclaw memory index --force --agent main
    ```

    Jika `provider` adalah `auto`, `local` dipilih hanya saat `local.modelPath` menunjuk ke file lokal yang sudah ada. Referensi model `hf:` dan HTTP(S) masih dapat digunakan secara eksplisit dengan `provider: "local"`, tetapi itu tidak membuat `auto` memilih local sebelum model tersedia di disk.

  </Accordion>
</AccordionGroup>

### Batas waktu embedding inline

<ParamField path="sync.embeddingBatchTimeoutSeconds" type="number">
  Override batas waktu untuk batch embedding inline selama pengindeksan memori.

Jika tidak disetel, menggunakan default provider: 600 detik untuk provider lokal/self-hosted seperti `local`, `ollama`, dan `lmstudio`, dan 120 detik untuk provider hosted. Tingkatkan nilai ini saat batch embedding lokal yang terikat CPU sehat tetapi lambat.
</ParamField>

---

## Konfigurasi pencarian hibrida

Semua di bawah `memorySearch.query.hybrid`:

| Key                   | Type      | Default | Deskripsi                          |
| --------------------- | --------- | ------- | ---------------------------------- |
| `enabled`             | `boolean` | `true`  | Aktifkan pencarian hibrida BM25 + vektor |
| `vectorWeight`        | `number`  | `0.7`   | Bobot untuk skor vektor (0-1)      |
| `textWeight`          | `number`  | `0.3`   | Bobot untuk skor BM25 (0-1)        |
| `candidateMultiplier` | `number`  | `4`     | Pengali ukuran kumpulan kandidat   |

<Tabs>
  <Tab title="MMR (diversitas)">
    | Key           | Type      | Default | Deskripsi                            |
    | ------------- | --------- | ------- | ------------------------------------ |
    | `mmr.enabled` | `boolean` | `false` | Aktifkan pemeringkatan ulang MMR     |
    | `mmr.lambda`  | `number`  | `0.7`   | 0 = diversitas maksimum, 1 = relevansi maksimum |
  </Tab>
  <Tab title="Temporal decay (kemutakhiran)">
    | Key                          | Type      | Default | Deskripsi                     |
    | ---------------------------- | --------- | ------- | ----------------------------- |
    | `temporalDecay.enabled`      | `boolean` | `false` | Aktifkan peningkatan kemutakhiran |
    | `temporalDecay.halfLifeDays` | `number`  | `30`    | Skor menjadi setengah setiap N hari |

    File evergreen (`MEMORY.md`, file tanpa tanggal di `memory/`) tidak pernah mengalami decay.

  </Tab>
</Tabs>

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

| Key          | Type       | Deskripsi                               |
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

Path dapat berupa absolut atau relatif terhadap workspace. Direktori dipindai secara rekursif untuk file `.md`. Penanganan symlink bergantung pada backend yang aktif: mesin bawaan mengabaikan symlink, sedangkan QMD mengikuti perilaku pemindai QMD yang mendasarinya.

Untuk pencarian transkrip lintas agen yang dicakup agen, gunakan `agents.list[].memorySearch.qmd.extraCollections` alih-alih `memory.qmd.paths`. Koleksi tambahan tersebut mengikuti bentuk `{ path, name, pattern? }` yang sama, tetapi digabungkan per agen dan dapat mempertahankan nama bersama eksplisit saat path menunjuk ke luar workspace saat ini. Jika path teresolusi yang sama muncul di `memory.qmd.paths` dan `memorySearch.qmd.extraCollections`, QMD mempertahankan entri pertama dan melewati duplikatnya.

---

## Memori multimodal (Gemini)

Indeks gambar dan audio bersama Markdown menggunakan Gemini Embedding 2:

| Key                       | Type       | Default    | Deskripsi                            |
| ------------------------- | ---------- | ---------- | ------------------------------------ |
| `multimodal.enabled`      | `boolean`  | `false`    | Aktifkan pengindeksan multimodal     |
| `multimodal.modalities`   | `string[]` | --         | `["image"]`, `["audio"]`, atau `["all"]` |
| `multimodal.maxFileBytes` | `number`   | `10000000` | Ukuran file maksimum untuk pengindeksan |

<Note>
Hanya berlaku untuk file di `extraPaths`. Root memori default tetap hanya Markdown. Memerlukan `gemini-embedding-2-preview`. `fallback` harus `"none"`.
</Note>

Format yang didukung: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.heic`, `.heif` (gambar); `.mp3`, `.wav`, `.ogg`, `.opus`, `.m4a`, `.aac`, `.flac` (audio).

---

## Cache embedding

| Key                | Type      | Default | Deskripsi                        |
| ------------------ | --------- | ------- | -------------------------------- |
| `cache.enabled`    | `boolean` | `false` | Cache embedding chunk di SQLite  |
| `cache.maxEntries` | `number`  | `50000` | Embedding maksimum yang di-cache |

Mencegah embedding ulang pada teks yang tidak berubah selama reindeks atau pembaruan transkrip.

---

## Pengindeksan batch

| Key                           | Type      | Default | Deskripsi                  |
| ----------------------------- | --------- | ------- | -------------------------- |
| `remote.batch.enabled`        | `boolean` | `false` | Aktifkan API embedding batch |
| `remote.batch.concurrency`    | `number`  | `2`     | Job batch paralel          |
| `remote.batch.wait`           | `boolean` | `true`  | Tunggu penyelesaian batch  |
| `remote.batch.pollIntervalMs` | `number`  | --      | Interval polling           |
| `remote.batch.timeoutMinutes` | `number`  | --      | Batas waktu batch          |

Tersedia untuk `openai`, `gemini`, dan `voyage`. Batch OpenAI biasanya paling cepat dan paling murah untuk backfill besar.

Ini terpisah dari `sync.embeddingBatchTimeoutSeconds`, yang mengontrol panggilan embedding inline yang digunakan oleh provider lokal/self-hosted dan provider hosted saat API batch provider tidak aktif.

---

## Pencarian memori sesi (eksperimental)

Indeks transkrip sesi dan tampilkan melalui `memory_search`:

| Key                           | Type       | Default      | Deskripsi                              |
| ----------------------------- | ---------- | ------------ | -------------------------------------- |
| `experimental.sessionMemory`  | `boolean`  | `false`      | Aktifkan pengindeksan sesi             |
| `sources`                     | `string[]` | `["memory"]` | Tambahkan `"sessions"` untuk menyertakan transkrip |
| `sync.sessions.deltaBytes`    | `number`   | `100000`     | Ambang byte untuk reindeks             |
| `sync.sessions.deltaMessages` | `number`   | `50`         | Ambang pesan untuk reindeks            |

<Warning>
Pengindeksan sesi bersifat opt-in dan berjalan secara asinkron. Hasilnya dapat sedikit usang. Log sesi disimpan di disk, jadi perlakukan akses sistem file sebagai batas kepercayaan.
</Warning>

---

## Akselerasi vektor SQLite (sqlite-vec)

| Key                          | Type      | Default | Deskripsi                        |
| ---------------------------- | --------- | ------- | -------------------------------- |
| `store.vector.enabled`       | `boolean` | `true`  | Gunakan sqlite-vec untuk kueri vektor |
| `store.vector.extensionPath` | `string`  | bundled | Override path sqlite-vec         |

Saat sqlite-vec tidak tersedia, OpenClaw secara otomatis kembali ke cosine similarity dalam proses.

---

## Penyimpanan indeks

| Key                   | Type     | Default                               | Deskripsi                                   |
| --------------------- | -------- | ------------------------------------- | ------------------------------------------- |
| `store.path`          | `string` | `~/.openclaw/memory/{agentId}.sqlite` | Lokasi indeks (mendukung token `{agentId}`) |
| `store.fts.tokenizer` | `string` | `unicode61`                           | Tokenizer FTS5 (`unicode61` atau `trigram`) |

---

## Konfigurasi backend QMD

Setel `memory.backend = "qmd"` untuk mengaktifkan. Semua pengaturan QMD berada di bawah `memory.qmd`:

| Key                      | Type      | Default  | Deskripsi                                    |
| ------------------------ | --------- | -------- | -------------------------------------------- |
| `command`                | `string`  | `qmd`    | Path executable QMD                          |
| `searchMode`             | `string`  | `search` | Perintah pencarian: `search`, `vsearch`, `query` |
| `includeDefaultMemory`   | `boolean` | `true`   | Indeks otomatis `MEMORY.md` + `memory/**/*.md` |
| `paths[]`                | `array`   | --       | Path tambahan: `{ name, path, pattern? }`    |
| `sessions.enabled`       | `boolean` | `false`  | Indeks transkrip sesi                        |
| `sessions.retentionDays` | `number`  | --       | Retensi transkrip                            |
| `sessions.exportDir`     | `string`  | --       | Direktori ekspor                             |

OpenClaw lebih memilih bentuk kueri koleksi dan MCP QMD saat ini, tetapi tetap menjaga rilis QMD lama tetap berfungsi dengan kembali ke flag koleksi `--mask` lawas dan nama tool MCP lama bila diperlukan.

<Note>
Override model QMD tetap berada di sisi QMD, bukan konfigurasi OpenClaw. Jika Anda perlu mengoverride model QMD secara global, setel variabel lingkungan seperti `QMD_EMBED_MODEL`, `QMD_RERANK_MODEL`, dan `QMD_GENERATE_MODEL` di lingkungan runtime Gateway.
</Note>

<AccordionGroup>
  <Accordion title="Jadwal pembaruan">
    | Key                       | Type      | Default | Deskripsi                             |
    | ------------------------- | --------- | ------- | ------------------------------------- |
    | `update.interval`         | `string`  | `5m`    | Interval penyegaran                   |
    | `update.debounceMs`       | `number`  | `15000` | Debounce perubahan file               |
    | `update.onBoot`           | `boolean` | `true`  | Segarkan saat startup                 |
    | `update.waitForBootSync`  | `boolean` | `false` | Blokir startup sampai penyegaran selesai |
    | `update.embedInterval`    | `string`  | --      | Cadence embedding terpisah            |
    | `update.commandTimeoutMs` | `number`  | --      | Batas waktu untuk perintah QMD        |
    | `update.updateTimeoutMs`  | `number`  | --      | Batas waktu untuk operasi pembaruan QMD |
    | `update.embedTimeoutMs`   | `number`  | --      | Batas waktu untuk operasi embedding QMD |
  </Accordion>
  <Accordion title="Batas">
    | Key                       | Type     | Default | Deskripsi                  |
    | ------------------------- | -------- | ------- | -------------------------- |
    | `limits.maxResults`       | `number` | `6`     | Hasil pencarian maksimum   |
    | `limits.maxSnippetChars`  | `number` | --      | Batasi panjang snippet     |
    | `limits.maxInjectedChars` | `number` | --      | Batasi total karakter yang disuntikkan |
    | `limits.timeoutMs`        | `number` | `4000`  | Batas waktu pencarian      |
  </Accordion>
  <Accordion title="Cakupan">
    Mengontrol sesi mana yang dapat menerima hasil pencarian QMD. Skema sama seperti [`session.sendPolicy`](/id/gateway/config-agents#session):

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

    Default bawaan mengizinkan sesi direct dan channel, sambil tetap menolak grup.

    Default adalah hanya DM. `match.keyPrefix` mencocokkan kunci sesi yang dinormalisasi; `match.rawKeyPrefix` mencocokkan kunci mentah termasuk `agent:<id>:`.

  </Accordion>
  <Accordion title="Sitasi">
    `memory.citations` berlaku untuk semua backend:

    | Value            | Perilaku                                            |
    | ---------------- | --------------------------------------------------- |
    | `auto` (default) | Sertakan footer `Source: <path#line>` dalam snippet |
    | `on`             | Selalu sertakan footer                              |
    | `off`            | Hilangkan footer (path tetap diteruskan ke agen secara internal) |

  </Accordion>
</AccordionGroup>

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

Dreaming dikonfigurasi di bawah `plugins.entries.memory-core.config.dreaming`, bukan di bawah `agents.defaults.memorySearch`.

Dreaming berjalan sebagai satu sapuan terjadwal dan menggunakan fase light/deep/REM internal sebagai detail implementasi.

Untuk perilaku konseptual dan slash command, lihat [Dreaming](/id/concepts/dreaming).

### Pengaturan pengguna

| Key         | Type      | Default     | Deskripsi                                         |
| ----------- | --------- | ----------- | ------------------------------------------------- |
| `enabled`   | `boolean` | `false`     | Aktifkan atau nonaktifkan Dreaming sepenuhnya     |
| `frequency` | `string`  | `0 3 * * *` | Cadence Cron opsional untuk sapuan Dreaming penuh |

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

<Note>
- Dreaming menulis status mesin ke `memory/.dreams/`.
- Dreaming menulis output naratif yang dapat dibaca manusia ke `DREAMS.md` (atau `dreams.md` yang sudah ada).
- Kebijakan dan ambang fase light/deep/REM adalah perilaku internal, bukan konfigurasi yang menghadap pengguna.

</Note>

## Terkait

- [Referensi konfigurasi](/id/gateway/configuration-reference)
- [Ikhtisar memori](/id/concepts/memory)
- [Pencarian memori](/id/concepts/memory-search)
