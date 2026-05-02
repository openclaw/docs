---
read_when:
    - Anda ingin mengonfigurasi penyedia pencarian memori atau model penyematan
    - Anda ingin menyiapkan backend QMD
    - Anda ingin menyesuaikan pencarian hibrida, MMR, atau peluruhan temporal
    - Anda ingin mengaktifkan pengindeksan memori multimodal
sidebarTitle: Memory config
summary: Semua pengaturan konfigurasi untuk pencarian memori, penyedia embedding, QMD, pencarian hibrida, dan pengindeksan multimodal
title: Referensi konfigurasi memori
x-i18n:
    generated_at: "2026-05-02T22:23:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 99624a13b4e700da47a523206569d84c6750266fbb648ec73c463be9c5c285d0
    source_path: reference/memory-config.md
    workflow: 16
---

Halaman ini mencantumkan setiap pengaturan konfigurasi untuk pencarian memori OpenClaw. Untuk ikhtisar konseptual, lihat:

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
    Pipeline pencarian dan penyetelan.
  </Card>
  <Card title="Active Memory" href="/id/concepts/active-memory">
    Sub-agen memori untuk sesi interaktif.
  </Card>
</CardGroup>

Semua pengaturan pencarian memori berada di bawah `agents.defaults.memorySearch` dalam `openclaw.json` kecuali dinyatakan lain.

<Note>
Jika Anda mencari toggle fitur **Active Memory** dan konfigurasi sub-agen, itu berada di bawah `plugins.entries.active-memory`, bukan `memorySearch`.

Active Memory menggunakan model dua gerbang:

1. Plugin harus diaktifkan dan menargetkan id agen saat ini
2. Permintaan harus berupa sesi obrolan persisten interaktif yang memenuhi syarat

Lihat [Active Memory](/id/concepts/active-memory) untuk model aktivasi, konfigurasi milik Plugin, persistensi transkrip, dan pola rollout yang aman.
</Note>

---

## Pemilihan penyedia

| Kunci      | Tipe      | Default                 | Deskripsi                                                                                                                                                                                                                    |
| ---------- | --------- | ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider` | `string`  | terdeteksi otomatis     | ID adaptor embedding seperti `bedrock`, `deepinfra`, `gemini`, `github-copilot`, `local`, `mistral`, `ollama`, `openai`, atau `voyage`; juga dapat berupa `models.providers.<id>` yang dikonfigurasi dengan `api` mengarah ke salah satu adaptor tersebut |
| `model`    | `string`  | default penyedia        | Nama model embedding                                                                                                                                                                                                         |
| `fallback` | `string`  | `"none"`                | ID adaptor fallback saat yang utama gagal                                                                                                                                                                                    |
| `enabled`  | `boolean` | `true`                  | Aktifkan atau nonaktifkan pencarian memori                                                                                                                                                                                   |

### Urutan deteksi otomatis

Saat `provider` tidak ditetapkan, OpenClaw memilih yang pertama tersedia:

<Steps>
  <Step title="local">
    Dipilih jika `memorySearch.local.modelPath` dikonfigurasi dan file tersebut ada.
  </Step>
  <Step title="github-copilot">
    Dipilih jika token GitHub Copilot dapat diselesaikan (env var atau profil auth).
  </Step>
  <Step title="openai">
    Dipilih jika kunci OpenAI dapat diselesaikan.
  </Step>
  <Step title="gemini">
    Dipilih jika kunci Gemini dapat diselesaikan.
  </Step>
  <Step title="voyage">
    Dipilih jika kunci Voyage dapat diselesaikan.
  </Step>
  <Step title="mistral">
    Dipilih jika kunci Mistral dapat diselesaikan.
  </Step>
  <Step title="deepinfra">
    Dipilih jika kunci DeepInfra dapat diselesaikan.
  </Step>
  <Step title="bedrock">
    Dipilih jika rantai kredensial AWS SDK berhasil diselesaikan (peran instance, kunci akses, profil, SSO, identitas web, atau konfigurasi bersama).
  </Step>
</Steps>

`ollama` didukung tetapi tidak terdeteksi otomatis (tetapkan secara eksplisit).

### ID penyedia khusus

`memorySearch.provider` dapat mengarah ke entri khusus `models.providers.<id>`. OpenClaw menyelesaikan pemilik `api` penyedia tersebut untuk adaptor embedding sambil mempertahankan id penyedia khusus untuk endpoint, auth, dan penanganan prefiks model. Ini memungkinkan penyiapan multi-GPU atau multi-host mendedikasikan embedding memori ke endpoint lokal tertentu:

```json5
{
  models: {
    providers: {
      "ollama-5080": {
        api: "ollama",
        baseUrl: "http://gpu-box.local:11435",
        apiKey: "ollama-local",
        models: [{ id: "qwen3-embedding:0.6b" }],
      },
    },
  },
  agents: {
    defaults: {
      memorySearch: {
        provider: "ollama-5080",
        model: "qwen3-embedding:0.6b",
      },
    },
  },
}
```

### Resolusi kunci API

Embedding jarak jauh memerlukan kunci API. Bedrock menggunakan rantai kredensial default AWS SDK sebagai gantinya (peran instance, SSO, kunci akses).

| Penyedia       | Env var                                            | Kunci konfigurasi                  |
| -------------- | -------------------------------------------------- | ---------------------------------- |
| Bedrock        | Rantai kredensial AWS                              | Tidak perlu kunci API              |
| DeepInfra      | `DEEPINFRA_API_KEY`                                | `models.providers.deepinfra.apiKey` |
| Gemini         | `GEMINI_API_KEY`                                   | `models.providers.google.apiKey`   |
| GitHub Copilot | `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, `GITHUB_TOKEN` | Profil auth melalui login perangkat |
| Mistral        | `MISTRAL_API_KEY`                                  | `models.providers.mistral.apiKey`  |
| Ollama         | `OLLAMA_API_KEY` (placeholder)                     | --                                 |
| OpenAI         | `OPENAI_API_KEY`                                   | `models.providers.openai.apiKey`   |
| Voyage         | `VOYAGE_API_KEY`                                   | `models.providers.voyage.apiKey`   |

<Note>
OAuth Codex hanya mencakup chat/completions dan tidak memenuhi permintaan embedding.
</Note>

---

## Konfigurasi endpoint jarak jauh

Untuk endpoint khusus yang kompatibel dengan OpenAI atau menimpa default penyedia:

<ParamField path="remote.baseUrl" type="string">
  URL dasar API khusus.
</ParamField>
<ParamField path="remote.apiKey" type="string">
  Timpa kunci API.
</ParamField>
<ParamField path="remote.headers" type="object">
  Header HTTP tambahan (digabungkan dengan default penyedia).
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

## Konfigurasi khusus penyedia

<AccordionGroup>
  <Accordion title="Gemini">
    | Kunci                  | Tipe     | Default                | Deskripsi                                      |
    | ---------------------- | -------- | ---------------------- | ---------------------------------------------- |
    | `model`                | `string` | `gemini-embedding-001` | Juga mendukung `gemini-embedding-2-preview`    |
    | `outputDimensionality` | `number` | `3072`                 | Untuk Embedding 2: 768, 1536, atau 3072        |

    <Warning>
    Mengubah model atau `outputDimensionality` memicu reindeks penuh otomatis.
    </Warning>

  </Accordion>
  <Accordion title="Tipe input yang kompatibel dengan OpenAI">
    Endpoint embedding yang kompatibel dengan OpenAI dapat ikut menggunakan field permintaan `input_type` khusus penyedia. Ini berguna untuk model embedding asimetris yang memerlukan label berbeda untuk embedding kueri dan dokumen.

    | Kunci               | Tipe     | Default         | Deskripsi                                           |
    | ------------------- | -------- | --------------- | --------------------------------------------------- |
    | `inputType`         | `string` | tidak ditetapkan | `input_type` bersama untuk embedding kueri dan dokumen |
    | `queryInputType`    | `string` | tidak ditetapkan | `input_type` saat kueri; menimpa `inputType`        |
    | `documentInputType` | `string` | tidak ditetapkan | `input_type` indeks/dokumen; menimpa `inputType`    |

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            provider: "openai",
            remote: {
              baseUrl: "https://embeddings.example/v1",
              apiKey: "env:EMBEDDINGS_API_KEY",
            },
            model: "asymmetric-embedder",
            queryInputType: "query",
            documentInputType: "passage",
          },
        },
      },
    }
    ```

    Mengubah nilai-nilai ini memengaruhi identitas cache embedding untuk pengindeksan batch penyedia dan sebaiknya diikuti dengan reindeks memori saat model upstream memperlakukan label tersebut secara berbeda.

  </Accordion>
  <Accordion title="Bedrock">
    ### Konfigurasi embedding Bedrock

    Bedrock menggunakan rantai kredensial default AWS SDK — tidak perlu kunci API. Jika OpenClaw berjalan di EC2 dengan peran instance yang mengaktifkan Bedrock, cukup tetapkan penyedia dan model:

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

    | Kunci                  | Tipe     | Default                        | Deskripsi                     |
    | ---------------------- | -------- | ------------------------------ | ----------------------------- |
    | `model`                | `string` | `amazon.titan-embed-text-v2:0` | ID model embedding Bedrock apa pun |
    | `outputDimensionality` | `number` | default model                  | Untuk Titan V2: 256, 512, atau 1024 |

    **Model yang didukung** (dengan deteksi keluarga dan default dimensi):

    | ID Model                                   | Penyedia   | Dimensi Default | Dimensi yang Dapat Dikonfigurasi |
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

    Varian bersufiks throughput (misalnya, `amazon.titan-embed-text-v1:2:8k`) mewarisi konfigurasi model dasar.

    **Autentikasi:** auth Bedrock menggunakan urutan resolusi kredensial AWS SDK standar:

    1. Variabel lingkungan (`AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`)
    2. Cache token SSO
    3. Kredensial token identitas web
    4. Kredensial bersama dan file konfigurasi
    5. Kredensial metadata ECS atau EC2

    Region diselesaikan dari `AWS_REGION`, `AWS_DEFAULT_REGION`, `baseUrl` penyedia `amazon-bedrock`, atau default ke `us-east-1`.

    **Izin IAM:** peran atau pengguna IAM memerlukan:

    ```json
    {
      "Effect": "Allow",
      "Action": "bedrock:InvokeModel",
      "Resource": "*"
    }
    ```

    Untuk hak akses minimum, batasi cakupan `InvokeModel` ke model tertentu:

    ```
    arn:aws:bedrock:*::foundation-model/amazon.titan-embed-text-v2:0
    ```

  </Accordion>
  <Accordion title="Lokal (GGUF + node-llama-cpp)">
    | Kunci                 | Tipe               | Bawaan                 | Deskripsi                                                                                                                                                                                                                                                                                                          |
    | --------------------- | ------------------ | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
    | `local.modelPath`     | `string`           | diunduh otomatis       | Path ke file model GGUF                                                                                                                                                                                                                                                                                            |
    | `local.modelCacheDir` | `string`           | bawaan node-llama-cpp  | Direktori cache untuk model yang diunduh                                                                                                                                                                                                                                                                           |
    | `local.contextSize`   | `number \| "auto"` | `4096`                 | Ukuran jendela konteks untuk konteks embedding. 4096 mencakup chunk umum (128–512 token) sekaligus membatasi VRAM non-weight. Turunkan ke 1024–2048 pada host terbatas. `"auto"` memakai maksimum terlatih model — tidak direkomendasikan untuk model 8B+ (Qwen3-Embedding-8B: 40 960 token → ~32 GB VRAM vs ~8,8 GB pada 4096). |

    Model bawaan: `embeddinggemma-300m-qat-Q8_0.gguf` (~0,6 GB, diunduh otomatis). Checkout sumber tetap memerlukan persetujuan build native: `pnpm approve-builds` lalu `pnpm rebuild node-llama-cpp`.

    Gunakan CLI mandiri untuk memverifikasi path penyedia yang sama dengan yang digunakan Gateway:

    ```bash
    openclaw memory status --deep --agent main
    openclaw memory index --force --agent main
    ```

    Jika `provider` adalah `auto`, `local` dipilih hanya ketika `local.modelPath` mengarah ke file lokal yang sudah ada. Referensi model `hf:` dan HTTP(S) masih dapat digunakan secara eksplisit dengan `provider: "local"`, tetapi referensi tersebut tidak membuat `auto` memilih lokal sebelum model tersedia di disk.

  </Accordion>
</AccordionGroup>

### Timeout embedding inline

<ParamField path="sync.embeddingBatchTimeoutSeconds" type="number">
  Timpa timeout untuk batch embedding inline selama pengindeksan memori.

Jika tidak disetel, gunakan bawaan penyedia: 600 detik untuk penyedia lokal/self-hosted seperti `local`, `ollama`, dan `lmstudio`, serta 120 detik untuk penyedia hosted. Tingkatkan ini ketika batch embedding lokal yang terikat CPU berjalan sehat tetapi lambat.
</ParamField>

---

## Konfigurasi pencarian hibrida

Semuanya berada di bawah `memorySearch.query.hybrid`:

| Kunci                 | Tipe      | Bawaan | Deskripsi                                      |
| --------------------- | --------- | ------ | ---------------------------------------------- |
| `enabled`             | `boolean` | `true` | Aktifkan pencarian hibrida BM25 + vektor       |
| `vectorWeight`        | `number`  | `0.7`  | Bobot untuk skor vektor (0-1)                  |
| `textWeight`          | `number`  | `0.3`  | Bobot untuk skor BM25 (0-1)                    |
| `candidateMultiplier` | `number`  | `4`    | Pengali ukuran kumpulan kandidat               |

<Tabs>
  <Tab title="MMR (keragaman)">
    | Kunci         | Tipe      | Bawaan | Deskripsi                                      |
    | ------------- | --------- | ------ | ---------------------------------------------- |
    | `mmr.enabled` | `boolean` | `false` | Aktifkan pemeringkatan ulang MMR              |
    | `mmr.lambda`  | `number`  | `0.7`  | 0 = keragaman maks, 1 = relevansi maks         |
  </Tab>
  <Tab title="Peluruhan temporal (keterbaruan)">
    | Kunci                        | Tipe      | Bawaan | Deskripsi                            |
    | ---------------------------- | --------- | ------ | ------------------------------------ |
    | `temporalDecay.enabled`      | `boolean` | `false` | Aktifkan peningkatan keterbaruan    |
    | `temporalDecay.halfLifeDays` | `number`  | `30`   | Skor berkurang setengah setiap N hari |

    File evergreen (`MEMORY.md`, file tanpa tanggal di `memory/`) tidak pernah diluruhkan.

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

| Kunci        | Tipe       | Deskripsi                                      |
| ------------ | ---------- | ---------------------------------------------- |
| `extraPaths` | `string[]` | Direktori atau file tambahan untuk diindeks    |

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

Path dapat berupa absolut atau relatif terhadap workspace. Direktori dipindai secara rekursif untuk file `.md`. Penanganan symlink bergantung pada backend aktif: engine bawaan mengabaikan symlink, sedangkan QMD mengikuti perilaku pemindai QMD yang mendasarinya.

Untuk pencarian transkrip lintas agen yang tercakup per agen, gunakan `agents.list[].memorySearch.qmd.extraCollections` alih-alih `memory.qmd.paths`. Koleksi tambahan tersebut mengikuti bentuk `{ path, name, pattern? }` yang sama, tetapi digabungkan per agen dan dapat mempertahankan nama bersama eksplisit ketika path mengarah ke luar workspace saat ini. Jika path hasil resolusi yang sama muncul di `memory.qmd.paths` dan `memorySearch.qmd.extraCollections`, QMD mempertahankan entri pertama dan melewati duplikatnya.

---

## Memori multimodal (Gemini)

Indeks gambar dan audio bersama Markdown menggunakan Gemini Embedding 2:

| Kunci                     | Tipe       | Bawaan     | Deskripsi                              |
| ------------------------- | ---------- | ---------- | -------------------------------------- |
| `multimodal.enabled`      | `boolean`  | `false`    | Aktifkan pengindeksan multimodal       |
| `multimodal.modalities`   | `string[]` | --         | `["image"]`, `["audio"]`, atau `["all"]` |
| `multimodal.maxFileBytes` | `number`   | `10000000` | Ukuran file maks untuk pengindeksan    |

<Note>
Hanya berlaku untuk file di `extraPaths`. Root memori default tetap hanya Markdown. Memerlukan `gemini-embedding-2-preview`. `fallback` harus berupa `"none"`.
</Note>

Format yang didukung: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.heic`, `.heif` (gambar); `.mp3`, `.wav`, `.ogg`, `.opus`, `.m4a`, `.aac`, `.flac` (audio).

---

## Cache embedding

| Key                | Type      | Default | Description                      |
| ------------------ | --------- | ------- | -------------------------------- |
| `cache.enabled`    | `boolean` | `false` | Simpan embedding chunk di SQLite |
| `cache.maxEntries` | `number`  | `50000` | Maksimum embedding yang di-cache |

Mencegah embedding ulang teks yang tidak berubah selama pengindeksan ulang atau pembaruan transkrip.

---

## Pengindeksan batch

| Key                           | Type      | Default | Description                  |
| ----------------------------- | --------- | ------- | ---------------------------- |
| `remote.nonBatchConcurrency`  | `number`  | `4`     | Embedding inline paralel     |
| `remote.batch.enabled`        | `boolean` | `false` | Aktifkan API embedding batch |
| `remote.batch.concurrency`    | `number`  | `2`     | Job batch paralel            |
| `remote.batch.wait`           | `boolean` | `true`  | Tunggu penyelesaian batch    |
| `remote.batch.pollIntervalMs` | `number`  | --      | Interval polling             |
| `remote.batch.timeoutMinutes` | `number`  | --      | Timeout batch                |

Tersedia untuk `openai`, `gemini`, dan `voyage`. Batch OpenAI biasanya paling cepat dan paling murah untuk backfill besar.

`remote.nonBatchConcurrency` mengontrol panggilan embedding inline yang digunakan oleh penyedia lokal/self-hosted dan penyedia hosted saat API batch penyedia tidak aktif. Ollama secara default menggunakan `1` untuk pengindeksan non-batch agar tidak membebani host lokal yang lebih kecil; tetapkan nilai lebih tinggi pada mesin yang lebih besar.

Ini terpisah dari `sync.embeddingBatchTimeoutSeconds`, yang mengontrol timeout untuk panggilan embedding inline.

---

## Pencarian memori sesi (eksperimental)

Indeks transkrip sesi dan tampilkan melalui `memory_search`:

| Key                           | Type       | Default      | Description                                  |
| ----------------------------- | ---------- | ------------ | -------------------------------------------- |
| `experimental.sessionMemory`  | `boolean`  | `false`      | Aktifkan pengindeksan sesi                   |
| `sources`                     | `string[]` | `["memory"]` | Tambahkan `"sessions"` untuk menyertakan transkrip |
| `sync.sessions.deltaBytes`    | `number`   | `100000`     | Ambang byte untuk pengindeksan ulang         |
| `sync.sessions.deltaMessages` | `number`   | `50`         | Ambang pesan untuk pengindeksan ulang        |

<Warning>
Pengindeksan sesi bersifat opt-in dan berjalan secara asinkron. Hasil dapat sedikit kedaluwarsa. Log sesi berada di disk, jadi perlakukan akses sistem file sebagai batas kepercayaan.
</Warning>

---

## Akselerasi vektor SQLite (sqlite-vec)

| Key                          | Type      | Default | Description                                |
| ---------------------------- | --------- | ------- | ------------------------------------------ |
| `store.vector.enabled`       | `boolean` | `true`  | Gunakan sqlite-vec untuk kueri vektor      |
| `store.vector.extensionPath` | `string`  | bundled | Timpa path sqlite-vec                      |

Saat sqlite-vec tidak tersedia, OpenClaw secara otomatis beralih ke kemiripan kosinus dalam proses.

---

## Penyimpanan indeks

| Key                   | Type     | Default                               | Description                                      |
| --------------------- | -------- | ------------------------------------- | ------------------------------------------------ |
| `store.path`          | `string` | `~/.openclaw/memory/{agentId}.sqlite` | Lokasi indeks (mendukung token `{agentId}`)      |
| `store.fts.tokenizer` | `string` | `unicode61`                           | Tokenizer FTS5 (`unicode61` atau `trigram`)      |

---

## Konfigurasi backend QMD

Tetapkan `memory.backend = "qmd"` untuk mengaktifkan. Semua pengaturan QMD berada di bawah `memory.qmd`:

| Key                      | Type      | Default  | Description                                                                                  |
| ------------------------ | --------- | -------- | -------------------------------------------------------------------------------------------- |
| `command`                | `string`  | `qmd`    | Path executable QMD; tetapkan path absolut saat `PATH` layanan berbeda dari shell Anda       |
| `searchMode`             | `string`  | `search` | Perintah pencarian: `search`, `vsearch`, `query`                                             |
| `includeDefaultMemory`   | `boolean` | `true`   | Indeks otomatis `MEMORY.md` + `memory/**/*.md`                                               |
| `paths[]`                | `array`   | --       | Path tambahan: `{ name, path, pattern? }`                                                    |
| `sessions.enabled`       | `boolean` | `false`  | Indeks transkrip sesi                                                                        |
| `sessions.retentionDays` | `number`  | --       | Retensi transkrip                                                                            |
| `sessions.exportDir`     | `string`  | --       | Direktori ekspor                                                                             |

`searchMode: "search"` hanya leksikal/BM25. OpenClaw tidak menjalankan probe kesiapan vektor semantik atau pemeliharaan embedding QMD untuk mode tersebut, termasuk selama `memory status --deep`; `vsearch` dan `query` tetap memerlukan kesiapan vektor dan embedding QMD.

OpenClaw memprioritaskan koleksi QMD dan bentuk kueri MCP saat ini, tetapi tetap menjaga rilis QMD yang lebih lama tetap berfungsi dengan mencoba flag pola koleksi yang kompatibel dan nama tool MCP lama saat diperlukan. Saat QMD mengiklankan dukungan untuk beberapa filter koleksi, koleksi dengan sumber yang sama dicari dengan satu proses QMD; build QMD yang lebih lama tetap menggunakan jalur kompatibilitas per koleksi. Sumber yang sama berarti koleksi memori tahan lama dikelompokkan bersama, sementara koleksi transkrip sesi tetap menjadi grup terpisah agar diversifikasi sumber tetap memiliki kedua input.

<Note>
Override model QMD tetap berada di sisi QMD, bukan konfigurasi OpenClaw. Jika Anda perlu mengoverride model QMD secara global, tetapkan variabel lingkungan seperti `QMD_EMBED_MODEL`, `QMD_RERANK_MODEL`, dan `QMD_GENERATE_MODEL` di lingkungan runtime gateway.
</Note>

<AccordionGroup>
  <Accordion title="Jadwal pembaruan">
    | Kunci                     | Jenis     | Default | Deskripsi                             |
    | ------------------------- | --------- | ------- | ------------------------------------- |
    | `update.interval`         | `string`  | `5m`    | Interval penyegaran                   |
    | `update.debounceMs`       | `number`  | `15000` | Debounce perubahan file               |
    | `update.onBoot`           | `boolean` | `true`  | Segarkan saat manajer QMD jangka panjang terbuka; juga membatasi penyegaran startup opt-in |
    | `update.startup`          | `string`  | `off`   | Penyegaran opsional saat gateway dimulai: `off`, `idle`, atau `immediate` |
    | `update.startupDelayMs`   | `number`  | `120000` | Penundaan sebelum penyegaran `startup: "idle"` berjalan |
    | `update.waitForBootSync`  | `boolean` | `false` | Blokir pembukaan manajer hingga penyegaran awalnya selesai |
    | `update.embedInterval`    | `string`  | --      | Irama embed terpisah                  |
    | `update.commandTimeoutMs` | `number`  | --      | Timeout untuk perintah QMD            |
    | `update.updateTimeoutMs`  | `number`  | --      | Timeout untuk operasi pembaruan QMD   |
    | `update.embedTimeoutMs`   | `number`  | --      | Timeout untuk operasi embed QMD       |
  </Accordion>
  <Accordion title="Batas">
    | Kunci                     | Jenis    | Default | Deskripsi                  |
    | ------------------------- | -------- | ------- | -------------------------- |
    | `limits.maxResults`       | `number` | `6`     | Hasil pencarian maksimum   |
    | `limits.maxSnippetChars`  | `number` | --      | Batasi panjang cuplikan    |
    | `limits.maxInjectedChars` | `number` | --      | Batasi total karakter yang diinjeksi |
    | `limits.timeoutMs`        | `number` | `4000`  | Timeout pencarian          |
  </Accordion>
  <Accordion title="Cakupan">
    Mengontrol sesi mana yang dapat menerima hasil pencarian QMD. Skema yang sama dengan [`session.sendPolicy`](/id/gateway/config-agents#session):

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

    Default yang dikirim mengizinkan sesi langsung dan saluran, sambil tetap menolak grup.

    Default hanya DM. `match.keyPrefix` mencocokkan kunci sesi yang dinormalisasi; `match.rawKeyPrefix` mencocokkan kunci mentah termasuk `agent:<id>:`.

  </Accordion>
  <Accordion title="Kutipan">
    `memory.citations` berlaku untuk semua backend:

    | Nilai            | Perilaku                                            |
    | ---------------- | --------------------------------------------------- |
    | `auto` (default) | Sertakan footer `Source: <path#line>` dalam cuplikan |
    | `on`             | Selalu sertakan footer                              |
    | `off`            | Hilangkan footer (path tetap diteruskan ke agent secara internal) |

  </Accordion>
</AccordionGroup>

Penyegaran boot QMD menggunakan jalur subproses sekali jalan selama startup gateway. Manajer QMD jangka panjang tetap memiliki file watcher reguler dan timer interval saat pencarian memori dibuka untuk penggunaan interaktif.

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

Dreaming berjalan sebagai satu sweep terjadwal dan menggunakan fase internal ringan/dalam/REM sebagai detail implementasi.

Untuk perilaku konseptual dan perintah slash, lihat [Dreaming](/id/concepts/dreaming).

### Pengaturan pengguna

| Kunci       | Jenis     | Default       | Deskripsi                                         |
| ----------- | --------- | ------------- | ------------------------------------------------- |
| `enabled`   | `boolean` | `false`       | Aktifkan atau nonaktifkan dreaming sepenuhnya     |
| `frequency` | `string`  | `0 3 * * *`   | Irama cron opsional untuk sweep dreaming penuh    |
| `model`     | `string`  | model default | Override model subagent Dream Diary opsional      |

### Contoh

```json5
{
  plugins: {
    entries: {
      "memory-core": {
        subagent: {
          allowModelOverride: true,
          allowedModels: ["anthropic/claude-sonnet-4-6"],
        },
        config: {
          dreaming: {
            enabled: true,
            frequency: "0 3 * * *",
            model: "anthropic/claude-sonnet-4-6",
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
- `dreaming.model` menggunakan gerbang kepercayaan subagent plugin yang sudah ada; tetapkan `plugins.entries.memory-core.subagent.allowModelOverride: true` sebelum mengaktifkannya.
- Dream Diary mencoba sekali lagi dengan model default sesi saat model yang dikonfigurasi tidak tersedia. Kegagalan kepercayaan atau allowlist dicatat di log dan tidak dicoba ulang secara diam-diam.
- Kebijakan dan ambang fase ringan/dalam/REM adalah perilaku internal, bukan konfigurasi yang ditujukan untuk pengguna.

</Note>

## Terkait

- [Referensi konfigurasi](/id/gateway/configuration-reference)
- [Ringkasan memori](/id/concepts/memory)
- [Pencarian memori](/id/concepts/memory-search)
