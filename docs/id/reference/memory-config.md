---
read_when:
    - Anda ingin mengonfigurasi penyedia pencarian memori atau model embedding
    - Anda ingin menyiapkan backend QMD
    - Anda ingin menyetel pencarian hibrida, MMR, atau peluruhan temporal
    - Anda ingin mengaktifkan pengindeksan memori multimodal
sidebarTitle: Memory config
summary: Semua tombol konfigurasi untuk pencarian memori, penyedia embedding, QMD, pencarian hibrida, dan pengindeksan multimodal
title: Referensi konfigurasi memori
x-i18n:
    generated_at: "2026-06-27T18:10:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d8f5880fef3fbdf81e546b0309a0e53459bae47e16efd787f87e34050d8c7b1e
    source_path: reference/memory-config.md
    workflow: 16
---

Halaman ini mencantumkan setiap kontrol konfigurasi untuk pencarian memori OpenClaw. Untuk ringkasan konseptual, lihat:

<CardGroup cols={2}>
  <Card title="Ringkasan memori" href="/id/concepts/memory">
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

1. plugin harus diaktifkan dan menargetkan id agen saat ini
2. permintaan harus berupa sesi chat persisten interaktif yang memenuhi syarat

Lihat [Active Memory](/id/concepts/active-memory) untuk model aktivasi, konfigurasi milik plugin, persistensi transkrip, dan pola rollout yang aman.
</Note>

---

## Pemilihan penyedia

| Key        | Type      | Default          | Description                                                                                                                                                                                                                                                                                 |
| ---------- | --------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider` | `string`  | `"openai"`       | ID adapter embedding seperti `bedrock`, `deepinfra`, `gemini`, `github-copilot`, `local`, `mistral`, `ollama`, `openai`, `openai-compatible`, atau `voyage`; juga dapat berupa `models.providers.<id>` yang dikonfigurasi dengan `api` yang menunjuk ke adapter embedding memori atau API model yang kompatibel dengan OpenAI |
| `model`    | `string`  | default penyedia | Nama model embedding                                                                                                                                                                                                                                                                        |
| `fallback` | `string`  | `"none"`         | ID adapter fallback saat yang utama gagal                                                                                                                                                                                                                                                   |
| `enabled`  | `boolean` | `true`           | Mengaktifkan atau menonaktifkan pencarian memori                                                                                                                                                                                                                                            |

Saat `provider` tidak disetel, OpenClaw menggunakan embedding OpenAI. Setel `provider`
secara eksplisit untuk menggunakan Gemini, Voyage, Mistral, DeepInfra, Bedrock, GitHub Copilot,
Ollama, model GGUF lokal, atau endpoint `/v1/embeddings` yang kompatibel dengan OpenAI.
Konfigurasi legacy yang masih berisi `provider: "auto"` akan di-resolve ke `openai`.

<Warning>
Mengubah penyedia embedding, model, pengaturan penyedia, sumber, cakupan,
chunking, atau tokenizer dapat membuat indeks vektor SQLite yang ada tidak kompatibel.
OpenClaw menjeda pencarian vektor dan melaporkan peringatan identitas indeks alih-alih
secara otomatis membuat ulang embedding untuk semuanya. Bangun ulang saat Anda siap dengan
`openclaw memory status --index --agent <id>` atau
`openclaw memory index --force --agent <id>`.
</Warning>

Saat `provider` tidak disetel, legacy `provider: "auto"` ada, atau
`provider: "none"` sengaja memilih mode hanya FTS, recall memori masih dapat
menggunakan peringkat FTS leksikal saat embedding tidak tersedia.

Penyedia non-lokal eksplisit akan gagal tertutup. Jika Anda menyetel `memorySearch.provider` ke
penyedia konkret berbasis remote seperti OpenAI, Gemini, Voyage, Mistral,
Bedrock, GitHub Copilot, DeepInfra, Ollama, LM Studio, atau penyedia kustom
yang kompatibel dengan OpenAI, dan penyedia tersebut tidak tersedia saat runtime, `memory_search`
mengembalikan hasil tidak tersedia alih-alih diam-diam menggunakan recall hanya FTS. Perbaiki
konfigurasi penyedia/auth, beralih ke penyedia yang dapat dijangkau, atau setel
`provider: "none"` jika Anda menginginkan recall hanya FTS secara sengaja.

### Id penyedia kustom

`memorySearch.provider` dapat menunjuk ke entri kustom `models.providers.<id>` untuk adapter penyedia khusus memori seperti `ollama`, atau untuk API model yang kompatibel dengan OpenAI seperti `openai-responses` / `openai-completions`. OpenClaw me-resolve pemilik `api` penyedia tersebut untuk adapter embedding sambil mempertahankan id penyedia kustom untuk penanganan endpoint, auth, dan awalan model. Ini memungkinkan setup multi-GPU atau multi-host mendedikasikan embedding memori ke endpoint lokal tertentu:

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

Embedding remote memerlukan kunci API. Bedrock menggunakan rantai kredensial default AWS SDK sebagai gantinya (peran instans, SSO, kunci akses).

| Provider       | Env var                                            | Config key                          |
| -------------- | -------------------------------------------------- | ----------------------------------- |
| Bedrock        | Rantai kredensial AWS                              | Kunci API tidak diperlukan          |
| DeepInfra      | `DEEPINFRA_API_KEY`                                | `models.providers.deepinfra.apiKey` |
| Gemini         | `GEMINI_API_KEY`                                   | `models.providers.google.apiKey`    |
| GitHub Copilot | `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, `GITHUB_TOKEN` | Profil auth melalui login perangkat |
| Mistral        | `MISTRAL_API_KEY`                                  | `models.providers.mistral.apiKey`   |
| Ollama         | `OLLAMA_API_KEY` (placeholder)                     | --                                  |
| OpenAI         | `OPENAI_API_KEY`                                   | `models.providers.openai.apiKey`    |
| Voyage         | `VOYAGE_API_KEY`                                   | `models.providers.voyage.apiKey`    |

<Note>
OAuth Codex hanya mencakup chat/completions dan tidak memenuhi permintaan embedding.
</Note>

---

## Konfigurasi endpoint remote

Gunakan `provider: "openai-compatible"` untuk server generik
`/v1/embeddings` yang kompatibel dengan OpenAI dan tidak boleh mewarisi kredensial chat OpenAI global.

<ParamField path="remote.baseUrl" type="string">
  URL basis API kustom.
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
        provider: "openai-compatible",
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
    | Key                    | Type     | Default                | Description                                      |
    | ---------------------- | -------- | ---------------------- | ------------------------------------------------ |
    | `model`                | `string` | `gemini-embedding-001` | Juga mendukung `gemini-embedding-2-preview`      |
    | `outputDimensionality` | `number` | `3072`                 | Untuk Embedding 2: 768, 1536, atau 3072          |

    <Warning>
    Mengubah model atau `outputDimensionality` mengubah identitas indeks. OpenClaw
    menjeda pencarian vektor sampai Anda secara eksplisit membangun ulang indeks memori.
    </Warning>

  </Accordion>
  <Accordion title="Jenis input yang kompatibel dengan OpenAI">
    Endpoint embedding yang kompatibel dengan OpenAI dapat memilih untuk menggunakan field permintaan `input_type` khusus penyedia. Ini berguna untuk model embedding asimetris yang memerlukan label berbeda untuk embedding kueri dan dokumen.

    | Key                 | Type     | Default       | Description                                                       |
    | ------------------- | -------- | ------------- | ----------------------------------------------------------------- |
    | `inputType`         | `string` | belum disetel | `input_type` bersama untuk embedding kueri dan dokumen            |
    | `queryInputType`    | `string` | belum disetel | `input_type` saat kueri; menimpa `inputType`                      |
    | `documentInputType` | `string` | belum disetel | `input_type` indeks/dokumen; menimpa `inputType`                  |

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            provider: "openai-compatible",
            remote: {
              baseUrl: "https://embeddings.example/v1",
              apiKey: "${EMBEDDINGS_API_KEY}",
            },
            model: "asymmetric-embedder",
            queryInputType: "query",
            documentInputType: "passage",
          },
        },
      },
    }
    ```

    Mengubah nilai-nilai ini memengaruhi identitas cache embedding untuk pengindeksan batch penyedia dan sebaiknya diikuti dengan pengindeksan ulang memori saat model upstream memperlakukan label secara berbeda.

  </Accordion>
  <Accordion title="Bedrock">
    ### Konfigurasi embedding Bedrock

    Bedrock menggunakan rantai kredensial default AWS SDK — tidak perlu kunci API. Jika OpenClaw berjalan di EC2 dengan peran instans yang mengaktifkan Bedrock, cukup setel penyedia dan model:

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

    | Key                    | Type     | Default                        | Description                         |
    | ---------------------- | -------- | ------------------------------ | ----------------------------------- |
    | `model`                | `string` | `amazon.titan-embed-text-v2:0` | ID model embedding Bedrock apa pun  |
    | `outputDimensionality` | `number` | default model                  | Untuk Titan V2: 256, 512, atau 1024 |

    **Model yang didukung** (dengan deteksi keluarga dan default dimensi):

    | ID Model                                   | Penyedia   | Dimensi Default | Dimensi yang Dapat Dikonfigurasi |
    | ------------------------------------------ | ---------- | ------------ | -------------------- |
    | `amazon.titan-embed-text-v2:0`             | Amazon     | 1024         | 256, 512, 1024       |
    | `amazon.titan-embed-text-v1`               | Amazon     | 1536         | --                   |
    | `amazon.titan-embed-g1-text-02`            | Amazon     | 1536         | --                   |
    | `amazon.titan-embed-image-v1`              | Amazon     | 1024         | --                   |
    | `amazon.nova-2-multimodal-embeddings-v1:0` | Amazon     | 1024         | 256, 384, 1024, 3072 |
    | `cohere.embed-english-v3`                  | Cohere     | 1024         | --                   |
    | `cohere.embed-multilingual-v3`             | Cohere     | 1024         | --                   |
    | `cohere.embed-v4:0`                        | Cohere     | 1536         | 256-1536             |
    | `twelvelabs.marengo-embed-3-0-v1:0`        | TwelveLabs | 512          | --                   |
    | `twelvelabs.marengo-embed-2-7-v1:0`        | TwelveLabs | 1024         | --                   |

    Varian dengan sufiks throughput (misalnya, `amazon.titan-embed-text-v1:2:8k`) mewarisi konfigurasi model dasar.

    **Autentikasi:** autentikasi Bedrock menggunakan urutan resolusi kredensial AWS SDK standar:

    1. Variabel lingkungan (`AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`)
    2. Cache token SSO
    3. Kredensial token identitas web
    4. Kredensial bersama dan file konfigurasi
    5. Kredensial metadata ECS atau EC2

    Wilayah diselesaikan dari `AWS_REGION`, `AWS_DEFAULT_REGION`, `baseUrl` penyedia `amazon-bedrock`, atau default ke `us-east-1`.

    **Izin IAM:** peran atau pengguna IAM memerlukan:

    ```json
    {
      "Effect": "Allow",
      "Action": "bedrock:InvokeModel",
      "Resource": "*"
    }
    ```

    Untuk hak akses paling minimal, batasi cakupan `InvokeModel` ke model tertentu:

    ```
    arn:aws:bedrock:*::foundation-model/amazon.titan-embed-text-v2:0
    ```

  </Accordion>
  <Accordion title="Lokal (GGUF + llama.cpp)">
    | Kunci                 | Tipe               | Default                | Deskripsi                                                                                                                                                                                                                                                                                                           |
    | --------------------- | ------------------ | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
    | `local.modelPath`     | `string`           | diunduh otomatis       | Jalur ke file model GGUF                                                                                                                                                                                                                                                                                            |
    | `local.modelCacheDir` | `string`           | default node-llama-cpp | Direktori cache untuk model yang diunduh                                                                                                                                                                                                                                                                            |
    | `local.contextSize`   | `number \| "auto"` | `4096`                 | Ukuran jendela konteks untuk konteks embedding. 4096 mencakup chunk umum (128–512 token) sekaligus membatasi VRAM non-weight. Turunkan ke 1024–2048 pada host dengan sumber daya terbatas. `"auto"` menggunakan maksimum terlatih model — tidak direkomendasikan untuk model 8B+ (Qwen3-Embedding-8B: 40 960 token → ~32 GB VRAM vs ~8,8 GB pada 4096). |

    Instal penyedia llama.cpp resmi terlebih dahulu: `openclaw plugins install @openclaw/llama-cpp-provider`.
    Model default: `embeddinggemma-300m-qat-Q8_0.gguf` (~0,6 GB, diunduh otomatis). Checkout sumber tetap memerlukan persetujuan build native: `pnpm approve-builds` lalu `pnpm rebuild node-llama-cpp`.

    Gunakan CLI mandiri untuk memverifikasi jalur penyedia yang sama dengan yang digunakan Gateway:

    ```bash
    openclaw memory status --deep --agent main
    openclaw memory index --force --agent main
    ```

    Tetapkan `provider: "local"` secara eksplisit untuk embedding GGUF lokal. Referensi model `hf:` dan HTTP(S) didukung untuk konfigurasi lokal eksplisit, tetapi tidak mengubah penyedia default.

  </Accordion>
</AccordionGroup>

### Timeout embedding inline

<ParamField path="sync.embeddingBatchTimeoutSeconds" type="number">
  Timpa timeout untuk batch embedding inline selama pengindeksan memori.

Jika tidak ditetapkan, default penyedia digunakan: 600 detik untuk penyedia lokal/self-hosted seperti `local`, `ollama`, dan `lmstudio`, serta 120 detik untuk penyedia hosted. Tingkatkan nilai ini ketika batch embedding lokal yang dibatasi CPU berjalan sehat tetapi lambat.
</ParamField>

---

## Konfigurasi pencarian hybrid

Semuanya berada di bawah `memorySearch.query.hybrid`:

| Kunci                 | Tipe      | Default | Deskripsi                              |
| --------------------- | --------- | ------- | -------------------------------------- |
| `enabled`             | `boolean` | `true`  | Aktifkan pencarian hybrid BM25 + vektor |
| `vectorWeight`        | `number`  | `0.7`   | Bobot untuk skor vektor (0-1)          |
| `textWeight`          | `number`  | `0.3`   | Bobot untuk skor BM25 (0-1)            |
| `candidateMultiplier` | `number`  | `4`     | Pengali ukuran kumpulan kandidat       |

<Tabs>
  <Tab title="MMR (keragaman)">
    | Kunci         | Tipe      | Default | Deskripsi                                  |
    | ------------- | --------- | ------- | ------------------------------------------ |
    | `mmr.enabled` | `boolean` | `false` | Aktifkan pemeringkatan ulang MMR           |
    | `mmr.lambda`  | `number`  | `0.7`   | 0 = keragaman maks, 1 = relevansi maks     |
  </Tab>
  <Tab title="Peluruhan temporal (keterbaruan)">
    | Kunci                        | Tipe      | Default | Deskripsi                      |
    | ---------------------------- | --------- | ------- | ------------------------------ |
    | `temporalDecay.enabled`      | `boolean` | `false` | Aktifkan peningkatan keterbaruan |
    | `temporalDecay.halfLifeDays` | `number`  | `30`    | Skor berkurang setengah setiap N hari |

    File evergreen (`MEMORY.md`, file tanpa tanggal di `memory/`) tidak pernah mengalami peluruhan.

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

## Jalur Memori Tambahan

| Kunci        | Tipe       | Deskripsi                                      |
| ------------ | ---------- | ---------------------------------------------- |
| `extraPaths` | `string[]` | Direktori atau berkas tambahan untuk diindeks  |

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

Jalur dapat berupa absolut atau relatif terhadap workspace. Direktori dipindai secara rekursif untuk berkas `.md`. Penanganan symlink bergantung pada backend aktif: mesin bawaan mengabaikan symlink, sementara QMD mengikuti perilaku pemindai QMD yang mendasarinya.

Untuk pencarian transkrip lintas agen yang tercakup pada agen, gunakan `agents.list[].memorySearch.qmd.extraCollections` alih-alih `memory.qmd.paths`. Koleksi tambahan tersebut mengikuti bentuk `{ path, name, pattern? }` yang sama, tetapi digabungkan per agen dan dapat mempertahankan nama bersama yang eksplisit ketika jalur menunjuk ke luar workspace saat ini. Jika jalur teresolusi yang sama muncul di `memory.qmd.paths` dan `memorySearch.qmd.extraCollections`, QMD mempertahankan entri pertama dan melewati duplikatnya.

---

## Memori Multimodal (Gemini)

Indeks gambar dan audio bersama Markdown menggunakan Gemini Embedding 2:

| Kunci                     | Tipe       | Default    | Deskripsi                           |
| ------------------------- | ---------- | ---------- | ----------------------------------- |
| `multimodal.enabled`      | `boolean`  | `false`    | Aktifkan pengindeksan multimodal    |
| `multimodal.modalities`   | `string[]` | --         | `["image"]`, `["audio"]`, atau `["all"]` |
| `multimodal.maxFileBytes` | `number`   | `10000000` | Ukuran berkas maksimum untuk pengindeksan |

<Note>
Hanya berlaku untuk berkas di `extraPaths`. Root memori default tetap hanya Markdown. Memerlukan `gemini-embedding-2-preview`. `fallback` harus berupa `"none"`.
</Note>

Format yang didukung: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.heic`, `.heif` (gambar); `.mp3`, `.wav`, `.ogg`, `.opus`, `.m4a`, `.aac`, `.flac` (audio).

---

## Cache Embedding

| Kunci              | Tipe      | Default | Deskripsi                          |
| ------------------ | --------- | ------- | ---------------------------------- |
| `cache.enabled`    | `boolean` | `true`  | Cache embedding chunk di SQLite    |
| `cache.maxEntries` | `number`  | `50000` | Embedding cache maksimum           |

Mencegah embedding ulang teks yang tidak berubah selama reindeks atau pembaruan transkrip.

---

## Pengindeksan Batch

| Kunci                         | Tipe      | Default | Deskripsi                   |
| ----------------------------- | --------- | ------- | --------------------------- |
| `remote.nonBatchConcurrency`  | `number`  | `4`     | Embedding inline paralel    |
| `remote.batch.enabled`        | `boolean` | `false` | Aktifkan API embedding batch |
| `remote.batch.concurrency`    | `number`  | `2`     | Job batch paralel           |
| `remote.batch.wait`           | `boolean` | `true`  | Tunggu penyelesaian batch   |
| `remote.batch.pollIntervalMs` | `number`  | --      | Interval polling            |
| `remote.batch.timeoutMinutes` | `number`  | --      | Timeout batch               |

Tersedia untuk `openai`, `gemini`, dan `voyage`. Batch OpenAI biasanya paling cepat dan paling murah untuk backfill besar.

`remote.nonBatchConcurrency` mengontrol panggilan embedding inline yang digunakan oleh penyedia lokal/self-hosted dan penyedia hosted ketika API batch penyedia tidak aktif. Ollama menggunakan default `1` untuk pengindeksan non-batch agar tidak membebani host lokal yang lebih kecil; tetapkan nilai lebih tinggi pada mesin yang lebih besar.

Ini terpisah dari `sync.embeddingBatchTimeoutSeconds`, yang mengontrol timeout untuk panggilan embedding inline.

---

## Pencarian Memori Sesi (eksperimental)

Indeks transkrip sesi dan tampilkan melalui `memory_search`:

| Kunci                         | Tipe       | Default      | Deskripsi                                      |
| ----------------------------- | ---------- | ------------ | ---------------------------------------------- |
| `experimental.sessionMemory`  | `boolean`  | `false`      | Aktifkan pengindeksan sesi                     |
| `sources`                     | `string[]` | `["memory"]` | Tambahkan `"sessions"` untuk menyertakan transkrip |
| `sync.sessions.deltaBytes`    | `number`   | `100000`     | Ambang byte untuk reindeks                     |
| `sync.sessions.deltaMessages` | `number`   | `50`         | Ambang pesan untuk reindeks                    |

<Warning>
Pengindeksan sesi bersifat opt-in dan berjalan secara asinkron. Hasil dapat sedikit kedaluwarsa. Log sesi berada di disk, jadi perlakukan akses filesystem sebagai batas kepercayaan.
</Warning>

---

## Akselerasi Vektor SQLite (sqlite-vec)

| Kunci                        | Jenis     | Bawaan  | Deskripsi                               |
| ---------------------------- | --------- | ------- | --------------------------------------- |
| `store.vector.enabled`       | `boolean` | `true`  | Gunakan sqlite-vec untuk kueri vektor   |
| `store.vector.extensionPath` | `string`  | dibundel | Timpa jalur sqlite-vec                  |

Saat sqlite-vec tidak tersedia, OpenClaw otomatis kembali menggunakan kemiripan kosinus dalam proses.

---

## Penyimpanan indeks

Indeks memori bawaan berada di database SQLite OpenClaw milik setiap agent di
`agents/<agentId>/agent/openclaw-agent.sqlite`.

| Kunci                 | Jenis    | Bawaan      | Deskripsi                                |
| --------------------- | -------- | ----------- | ---------------------------------------- |
| `store.fts.tokenizer` | `string` | `unicode61` | Tokenizer FTS5 (`unicode61` atau `trigram`) |

---

## Konfigurasi backend QMD

Atur `memory.backend = "qmd"` untuk mengaktifkan. Semua pengaturan QMD berada di bawah `memory.qmd`:

| Kunci                    | Jenis     | Bawaan  | Deskripsi                                                                                 |
| ------------------------ | --------- | -------- | ----------------------------------------------------------------------------------------- |
| `command`                | `string`  | `qmd`    | Jalur executable QMD; atur jalur absolut saat `PATH` service berbeda dari shell Anda      |
| `searchMode`             | `string`  | `search` | Perintah pencarian: `search`, `vsearch`, `query`                                          |
| `rerank`                 | `boolean` | --       | Atur ke `false` dengan `searchMode: "query"` dan QMD 2.1+ untuk melewati reranking QMD    |
| `includeDefaultMemory`   | `boolean` | `true`   | Indeks otomatis `MEMORY.md` + `memory/**/*.md`                                            |
| `paths[]`                | `array`   | --       | Jalur tambahan: `{ name, path, pattern? }`                                                |
| `sessions.enabled`       | `boolean` | `false`  | Indeks transkrip sesi                                                                     |
| `sessions.retentionDays` | `number`  | --       | Retensi transkrip                                                                         |
| `sessions.exportDir`     | `string`  | --       | Direktori ekspor                                                                          |

`searchMode: "search"` hanya lexical/BM25. OpenClaw tidak menjalankan probe kesiapan vektor semantik atau pemeliharaan embedding QMD untuk mode tersebut, termasuk selama `memory status --deep`; `vsearch` dan `query` tetap memerlukan kesiapan vektor dan embedding QMD.

`rerank: false` hanya mengubah mode `query` QMD dan memerlukan QMD 2.1 atau yang lebih baru. Dalam mode CLI langsung, OpenClaw meneruskan `--no-rerank`; dalam mode MCP berbasis mcporter, OpenClaw meneruskan `rerank: false` ke unified query tool QMD. Biarkan tidak diatur untuk menggunakan perilaku reranking kueri bawaan QMD.

OpenClaw memprioritaskan bentuk koleksi dan kueri MCP QMD saat ini, tetapi tetap menjaga rilis QMD lama berfungsi dengan mencoba flag pola koleksi yang kompatibel dan nama tool MCP lama saat diperlukan. Saat QMD menyatakan dukungan untuk beberapa filter koleksi, koleksi dari sumber yang sama dicari dengan satu proses QMD; build QMD lama tetap menggunakan jalur kompatibilitas per koleksi. Sumber yang sama berarti koleksi memori tahan lama dikelompokkan bersama, sementara koleksi transkrip sesi tetap menjadi grup terpisah agar diversifikasi sumber tetap memiliki kedua input.

<Note>
Override model QMD tetap berada di sisi QMD, bukan konfigurasi OpenClaw. Jika Anda perlu menimpa model QMD secara global, atur variabel lingkungan seperti `QMD_EMBED_MODEL`, `QMD_RERANK_MODEL`, dan `QMD_GENERATE_MODEL` di lingkungan runtime Gateway.
</Note>

<AccordionGroup>
  <Accordion title="Update schedule">
    | Kunci                     | Jenis     | Bawaan  | Deskripsi                           |
    | ------------------------- | --------- | ------- | ----------------------------------- |
    | `update.interval`         | `string`  | `5m`    | Interval penyegaran                 |
    | `update.debounceMs`       | `number`  | `15000` | Debounce perubahan file             |
    | `update.onBoot`           | `boolean` | `true`  | Segarkan saat pengelola QMD jangka panjang dibuka; atur false untuk melewati pembaruan boot langsung |
    | `update.startup`          | `string`  | `off`   | Inisialisasi QMD opsional saat Gateway mulai: `off`, `idle`, atau `immediate` |
    | `update.startupDelayMs`   | `number`  | `120000` | Penundaan sebelum penyegaran `startup: "idle"` berjalan |
    | `update.waitForBootSync`  | `boolean` | `false` | Blokir pembukaan pengelola sampai penyegaran awalnya selesai |
    | `update.embedInterval`    | `string`  | --      | Irama embedding terpisah            |
    | `update.commandTimeoutMs` | `number`  | --      | Timeout untuk perintah QMD          |
    | `update.updateTimeoutMs`  | `number`  | --      | Timeout untuk operasi pembaruan QMD |
    | `update.embedTimeoutMs`   | `number`  | --      | Timeout untuk operasi embedding QMD |
  </Accordion>
  <Accordion title="Limits">
    | Kunci                     | Jenis    | Bawaan  | Deskripsi                         |
    | ------------------------- | -------- | ------- | --------------------------------- |
    | `limits.maxResults`       | `number` | `6`     | Hasil pencarian maksimum          |
    | `limits.maxSnippetChars`  | `number` | --      | Batasi panjang cuplikan           |
    | `limits.maxInjectedChars` | `number` | --      | Batasi total karakter yang disisipkan |
    | `limits.timeoutMs`        | `number` | `4000`  | Timeout pencarian                 |
  </Accordion>
  <Accordion title="Scope">
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

    Bawaan yang dikirimkan mengizinkan sesi langsung dan channel, sambil tetap menolak grup.

    Bawaan adalah hanya-DM. `match.keyPrefix` cocok dengan kunci sesi yang dinormalisasi; `match.rawKeyPrefix` cocok dengan kunci mentah termasuk `agent:<id>:`.

  </Accordion>
  <Accordion title="Citations">
    `memory.citations` berlaku untuk semua backend:

    | Nilai            | Perilaku                                            |
    | ---------------- | --------------------------------------------------- |
    | `auto` (bawaan)  | Sertakan footer `Source: <path#line>` dalam cuplikan |
    | `on`             | Selalu sertakan footer                              |
    | `off`            | Hilangkan footer (jalur tetap diteruskan ke agent secara internal) |

  </Accordion>
</AccordionGroup>

Saat inisialisasi QMD saat Gateway mulai diaktifkan, OpenClaw memulai QMD hanya untuk agent yang memenuhi syarat. Jika `update.onBoot` bernilai true dan tidak ada pemeliharaan interval/embedding yang dikonfigurasi, startup menggunakan pengelola sekali pakai untuk penyegaran boot lalu menutupnya. Jika interval pembaruan atau embedding dikonfigurasi, startup membuka pengelola QMD jangka panjang agar dapat memiliki watcher dan timer interval; `update.onBoot: false` hanya melewati penyegaran boot langsung.

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

Dreaming berjalan sebagai satu sweep terjadwal dan menggunakan fase light/deep/REM internal sebagai detail implementasi.

Untuk perilaku konseptual dan perintah slash, lihat [Dreaming](/id/concepts/dreaming).

### Pengaturan pengguna

| Kunci                                  | Jenis     | Bawaan        | Deskripsi                                                                                                                       |
| -------------------------------------- | --------- | ------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`                              | `boolean` | `false`       | Aktifkan atau nonaktifkan dreaming sepenuhnya                                                                                    |
| `frequency`                            | `string`  | `0 3 * * *`   | Irama cron opsional untuk sweep dreaming penuh                                                                                   |
| `model`                                | `string`  | model bawaan  | Override model subagent Dream Diary opsional                                                                                     |
| `phases.deep.maxPromotedSnippetTokens` | `number`  | `160`         | Token perkiraan maksimum yang dipertahankan dari setiap cuplikan recall jangka pendek yang dipromosikan ke `MEMORY.md`; metadata provenance tetap terlihat |

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
- Dreaming menulis state mesin ke `memory/.dreams/`.
- Dreaming menulis keluaran naratif yang dapat dibaca manusia ke `DREAMS.md` (atau `dreams.md` yang sudah ada).
- `dreaming.model` menggunakan gerbang kepercayaan subagent Plugin yang sudah ada; atur `plugins.entries.memory-core.subagent.allowModelOverride: true` sebelum mengaktifkannya.
- Dream Diary mencoba sekali lagi dengan model bawaan sesi saat model yang dikonfigurasi tidak tersedia. Kegagalan kepercayaan atau allowlist dicatat dan tidak dicoba ulang secara diam-diam.
- Kebijakan dan ambang fase light/deep/REM adalah perilaku internal, bukan konfigurasi yang menghadap pengguna.

</Note>

## Terkait

- [Referensi konfigurasi](/id/gateway/configuration-reference)
- [Ikhtisar memori](/id/concepts/memory)
- [Pencarian memori](/id/concepts/memory-search)
