---
read_when:
    - Anda ingin mengonfigurasi penyedia pencarian memori atau model embedding
    - Anda ingin menyiapkan backend QMD
    - Anda ingin menyesuaikan pencarian hibrida, MMR, atau peluruhan temporal
    - Anda ingin mengaktifkan pengindeksan memori multimodal
sidebarTitle: Memory config
summary: Semua opsi konfigurasi untuk pencarian memori, penyedia embedding, QMD, pencarian hibrida, dan pengindeksan multimodal
title: Referensi konfigurasi memori
x-i18n:
    generated_at: "2026-07-12T14:39:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 558995797a5e217e57245e1d5ff90124fca67b6eb4767d97a3ea26a4ca013d06
    source_path: reference/memory-config.md
    workflow: 16
---

Halaman ini mencantumkan setiap opsi konfigurasi untuk pencarian memori OpenClaw. Untuk ikhtisar konseptual, lihat:

<CardGroup cols={2}>
  <Card title="Ikhtisar memori" href="/id/concepts/memory">
    Cara kerja memori.
  </Card>
  <Card title="Mesin bawaan" href="/id/concepts/memory-builtin">
    Backend SQLite default.
  </Card>
  <Card title="Mesin QMD" href="/id/concepts/memory-qmd">
    Sidecar yang mengutamakan penggunaan lokal.
  </Card>
  <Card title="Pencarian memori" href="/id/concepts/memory-search">
    Alur pencarian dan penyetelan.
  </Card>
  <Card title="Active Memory" href="/id/concepts/active-memory">
    Subagen memori untuk sesi interaktif.
  </Card>
</CardGroup>

Semua pengaturan pencarian memori berada di bawah `agents.defaults.memorySearch` dalam `openclaw.json` (atau penggantian per agen `agents.list[].memorySearch`), kecuali dinyatakan lain.

<Note>
Jika Anda mencari pengalih fitur **Active Memory** dan konfigurasi subagen, keduanya berada di bawah `plugins.entries.active-memory`, bukan `memorySearch`.

Active Memory menggunakan model dua gerbang:

1. Plugin harus diaktifkan dan menargetkan id agen saat ini
2. permintaan harus berupa sesi obrolan persisten interaktif yang memenuhi syarat

Lihat [Active Memory](/id/concepts/active-memory) untuk model aktivasi, konfigurasi milik Plugin, persistensi transkrip, dan pola peluncuran yang aman.
</Note>

---

## Pemilihan penyedia

| Kunci      | Jenis     | Default          | Deskripsi                                                                                                                                                                                                                                                                                    |
| ---------- | --------- | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`  | `boolean` | `true`           | Mengaktifkan atau menonaktifkan pencarian memori                                                                                                                                                                                                                                             |
| `provider` | `string`  | `"openai"`       | ID adaptor embedding seperti `bedrock`, `deepinfra`, `gemini`, `github-copilot`, `local`, `mistral`, `ollama`, `openai`, `openai-compatible`, atau `voyage`; juga dapat berupa `models.providers.<id>` terkonfigurasi yang `api`-nya mengarah ke adaptor embedding memori atau API model kompatibel OpenAI |
| `model`    | `string`  | default penyedia | Nama model embedding                                                                                                                                                                                                                                                                         |
| `fallback` | `string`  | `"none"`         | ID adaptor cadangan ketika adaptor utama gagal                                                                                                                                                                                                                                               |

Ketika `provider` tidak ditetapkan, OpenClaw menggunakan embedding OpenAI. Tetapkan `provider`
secara eksplisit untuk menggunakan Bedrock, DeepInfra, Gemini, GitHub Copilot, Mistral, Ollama,
Voyage, model GGUF lokal, atau endpoint `/v1/embeddings` yang kompatibel dengan OpenAI.
Konfigurasi lama yang masih menggunakan `provider: "auto"` akan diresolusikan menjadi `openai`.

<Warning>
Mengubah penyedia embedding, model, pengaturan penyedia, sumber, cakupan,
pemotongan bagian, atau tokenizer dapat membuat indeks vektor SQLite yang ada menjadi tidak kompatibel.
OpenClaw menjeda pencarian vektor dan melaporkan peringatan identitas indeks alih-alih
secara otomatis membuat ulang embedding untuk semuanya. Bangun ulang saat Anda siap dengan
`openclaw memory status --index --agent <id>` atau
`openclaw memory index --force --agent <id>`.
</Warning>

Ketika `provider` tidak ditetapkan, `provider: "auto"` lama digunakan, atau
`provider: "none"` sengaja memilih mode FTS saja, pemanggilan kembali memori masih dapat
menggunakan pemeringkatan FTS leksikal ketika embedding tidak tersedia.

Penyedia nonlokal yang ditetapkan secara eksplisit akan gagal secara tertutup. Jika Anda menetapkan `memorySearch.provider` ke
penyedia konkret yang didukung layanan jarak jauh seperti Bedrock, DeepInfra, Gemini, GitHub
Copilot, LM Studio, Mistral, Ollama, OpenAI, Voyage, atau penyedia khusus
yang kompatibel dengan OpenAI, dan penyedia tersebut tidak tersedia saat runtime, `memory_search`
mengembalikan hasil tidak tersedia alih-alih diam-diam menggunakan pemanggilan kembali FTS saja. Perbaiki
konfigurasi penyedia/autentikasi, beralihlah ke penyedia yang dapat dijangkau, atau tetapkan
`provider: "none"` jika Anda sengaja menginginkan pemanggilan kembali FTS saja.

### ID penyedia khusus

`memorySearch.provider` dapat mengarah ke entri khusus `models.providers.<id>` untuk adaptor penyedia khusus memori seperti `ollama`, atau untuk API model yang kompatibel dengan OpenAI seperti `openai-responses` / `openai-completions`. OpenClaw meresolusikan pemilik `api` penyedia tersebut untuk adaptor embedding sambil mempertahankan ID penyedia khusus untuk penanganan endpoint, autentikasi, dan prefiks model. Hal ini memungkinkan konfigurasi multi-GPU atau multi-host mendedikasikan embedding memori ke endpoint lokal tertentu:

```json5
{
  models: {
    providers: {
      "ollama-5080": {
        api: "ollama",
        baseUrl: "http://gpu-box.local:11435",
        apiKey: "ollama-local",
        models: [{ id: "qwen3-embedding:0.6b", name: "Qwen3 Embedding 0.6B" }],
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

Embedding jarak jauh memerlukan kunci API. Sebagai gantinya, Bedrock menggunakan rantai kredensial default AWS SDK (peran instans, SSO, kunci akses, atau kunci API Bedrock).

| Penyedia       | Variabel lingkungan                                  | Kunci konfigurasi                    |
| -------------- | ---------------------------------------------------- | ------------------------------------ |
| Bedrock        | Rantai kredensial AWS, atau `AWS_BEARER_TOKEN_BEDROCK` | Tidak memerlukan kunci API         |
| DeepInfra      | `DEEPINFRA_API_KEY`                                  | `models.providers.deepinfra.apiKey`  |
| Gemini         | `GEMINI_API_KEY`                                     | `models.providers.google.apiKey`     |
| GitHub Copilot | `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, `GITHUB_TOKEN`   | Profil autentikasi melalui login perangkat |
| Mistral        | `MISTRAL_API_KEY`                                    | `models.providers.mistral.apiKey`    |
| Ollama         | `OLLAMA_API_KEY` (placeholder)                       | --                                   |
| OpenAI         | `OPENAI_API_KEY`                                     | `models.providers.openai.apiKey`     |
| Voyage         | `VOYAGE_API_KEY`                                     | `models.providers.voyage.apiKey`     |

<Note>
OAuth Codex hanya mencakup obrolan/penyelesaian dan tidak memenuhi permintaan embedding.
</Note>

---

## Konfigurasi endpoint jarak jauh

Gunakan `provider: "openai-compatible"` untuk server generik
`/v1/embeddings` yang kompatibel dengan OpenAI dan tidak boleh mewarisi kredensial obrolan OpenAI global.

<ParamField path="remote.baseUrl" type="string">
  URL dasar API khusus.
</ParamField>
<ParamField path="remote.apiKey" type="string">
  Mengganti kunci API.
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
    | Kunci                  | Jenis    | Default                | Deskripsi                                      |
    | ---------------------- | -------- | ---------------------- | ---------------------------------------------- |
    | `model`                | `string` | `gemini-embedding-001` | Juga mendukung `gemini-embedding-2-preview`    |
    | `outputDimensionality` | `number` | `3072`                 | Untuk Embedding 2: 768, 1536, atau 3072        |

    <Warning>
    Mengubah model atau `outputDimensionality` akan mengubah identitas indeks. OpenClaw
    menjeda pencarian vektor hingga Anda secara eksplisit membangun ulang indeks memori.
    </Warning>

  </Accordion>
  <Accordion title="Jenis input kompatibel OpenAI">
    Endpoint embedding yang kompatibel dengan OpenAI dapat memilih untuk menggunakan bidang permintaan `input_type` khusus penyedia. Ini berguna untuk model embedding asimetris yang memerlukan label berbeda untuk embedding kueri dan dokumen.

    | Kunci               | Jenis    | Default              | Deskripsi                                                    |
    | ------------------- | -------- | -------------------- | ------------------------------------------------------------ |
    | `inputType`         | `string` | tidak ditetapkan     | `input_type` bersama untuk embedding kueri dan dokumen        |
    | `queryInputType`    | `string` | tidak ditetapkan     | `input_type` saat kueri; menggantikan `inputType`             |
    | `documentInputType` | `string` | tidak ditetapkan     | `input_type` indeks/dokumen; menggantikan `inputType`         |

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

    Mengubah nilai-nilai ini memengaruhi identitas cache embedding untuk pengindeksan batch penyedia dan harus diikuti dengan pengindeksan ulang memori ketika model hulu memperlakukan label tersebut secara berbeda.

  </Accordion>
  <Accordion title="Bedrock">
    ### Konfigurasi embedding Bedrock

    Bedrock menggunakan rantai kredensial default AWS SDK beserta token bearer yang diperiksa OpenClaw, sehingga tidak ada kunci API yang disimpan dalam konfigurasi. Jika OpenClaw berjalan di EC2 dengan peran instans yang mengaktifkan Bedrock, cukup tetapkan penyedia dan model:

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

    | Kunci                  | Jenis    | Default                        | Deskripsi                         |
    | ---------------------- | -------- | ------------------------------ | --------------------------------- |
    | `model`                | `string` | `amazon.titan-embed-text-v2:0` | ID model embedding Bedrock apa pun |
    | `outputDimensionality` | `number` | default model                  | Untuk Titan V2: 256, 512, atau 1024 |

    **Model yang didukung** (dengan deteksi keluarga dan default dimensi):

    | ID Model                                    | Penyedia   | Dimensi Bawaan | Dimensi yang Dapat Dikonfigurasi |
    | ------------------------------------------- | ---------- | --------------- | -------------------------------- |
    | `amazon.titan-embed-text-v2:0`             | Amazon     | 1024            | 256, 512, 1024                   |
    | `amazon.titan-embed-text-v1`               | Amazon     | 1536            | --                               |
    | `amazon.titan-embed-g1-text-02`            | Amazon     | 1536            | --                               |
    | `amazon.titan-embed-image-v1`              | Amazon     | 1024            | --                               |
    | `amazon.nova-2-multimodal-embeddings-v1:0` | Amazon     | 1024            | 256, 384, 1024, 3072             |
    | `cohere.embed-english-v3`                  | Cohere     | 1024            | --                               |
    | `cohere.embed-multilingual-v3`             | Cohere     | 1024            | --                               |
    | `cohere.embed-v4:0`                        | Cohere     | 1536            | 256, 384, 512, 768, 1024, 1536  |
    | `twelvelabs.marengo-embed-3-0-v1:0`        | TwelveLabs | 512             | --                               |
    | `twelvelabs.marengo-embed-2-7-v1:0`        | TwelveLabs | 1024            | --                               |

    Varian dengan sufiks throughput (misalnya, `amazon.titan-embed-text-v1:2:8k`) dan ID profil inferensi dengan prefiks wilayah (misalnya, `us.amazon.titan-embed-text-v2:0`) mewarisi konfigurasi model dasarnya.

    **Wilayah:** ditentukan dalam urutan berikut: penggantian `memorySearch.remote.baseUrl`, konfigurasi `models.providers.amazon-bedrock.baseUrl`, `AWS_REGION`, `AWS_DEFAULT_REGION`, lalu nilai bawaan `us-east-1`.

    **Autentikasi:** OpenClaw terlebih dahulu memeriksa `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY` atau `AWS_BEARER_TOKEN_BEDROCK`, lalu beralih ke rantai penyedia kredensial bawaan standar AWS SDK:

    1. Variabel lingkungan (`AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`), kecuali `AWS_PROFILE` juga ditetapkan
    2. SSO (hanya ketika kolom SSO dikonfigurasi)
    3. Berkas kredensial dan konfigurasi bersama (`fromIni`, termasuk `AWS_PROFILE`)
    4. Proses kredensial (`credential_process` dalam berkas konfigurasi AWS)
    5. Kredensial token identitas web
    6. Kredensial metadata instans ECS atau EC2

    **Izin IAM:** peran atau pengguna IAM memerlukan:

    ```json
    {
      "Effect": "Allow",
      "Action": "bedrock:InvokeModel",
      "Resource": "*"
    }
    ```

    Untuk hak akses minimum, batasi cakupan `InvokeModel` ke model tertentu:

    ```text
    arn:aws:bedrock:*::foundation-model/amazon.titan-embed-text-v2:0
    ```

  </Accordion>
  <Accordion title="Lokal (GGUF + llama.cpp)">
    | Kunci                 | Tipe               | Bawaan                 | Deskripsi                                                                                                                                                                                                                                                                                                                     |
    | --------------------- | ------------------ | ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
    | `local.modelPath`     | `string`           | diunduh otomatis       | Jalur ke berkas model GGUF                                                                                                                                                                                                                                                                                                    |
    | `local.modelCacheDir` | `string`           | bawaan node-llama-cpp  | Direktori tembolok untuk model yang diunduh                                                                                                                                                                                                                                                                                    |
    | `local.contextSize`   | `number \| "auto"` | `4096`                 | Ukuran jendela konteks untuk konteks embedding. 4096 mencakup potongan umum (128–512 token) sekaligus membatasi VRAM non-bobot. Turunkan menjadi 1024–2048 pada host dengan sumber daya terbatas. `"auto"` menggunakan batas maksimum pelatihan model—tidak disarankan untuk model 8B+ (Qwen3-Embedding-8B: hingga 40.960 token dapat meningkatkan penggunaan VRAM menjadi sekitar 32 GB). |

    Instal penyedia resmi llama.cpp terlebih dahulu: `openclaw plugins install @openclaw/llama-cpp-provider`.
    Model bawaan: `embeddinggemma-300m-qat-Q8_0.gguf` (sekitar 0,6 GB, diunduh otomatis). Checkout sumber tetap memerlukan persetujuan build native: `pnpm approve-builds`, lalu `pnpm rebuild node-llama-cpp`.

    Gunakan CLI mandiri untuk memverifikasi jalur penyedia yang sama dengan yang digunakan Gateway:

    ```bash
    openclaw memory status --deep --agent main
    openclaw memory index --force --agent main
    ```

    Nilai numerik `local.contextSize` juga digunakan untuk penempatan lapisan GPU otomatis oleh node-llama-cpp agar bobot model dan konteks embedding yang diminta dapat dimuat bersama. `openclaw memory status --deep` melaporkan backend llama.cpp terakhir yang diketahui, perangkat, offload, konteks yang diminta, dan fakta memori bertanda waktu setelah runtime dimuat; status pasif tidak memuat model.

    Tetapkan `provider: "local"` secara eksplisit untuk embedding GGUF lokal. Referensi model `hf:` dan HTTP(S) didukung untuk konfigurasi lokal eksplisit (melalui resolusi model node-llama-cpp), tetapi tidak mengubah penyedia bawaan.

  </Accordion>
</AccordionGroup>

### Batas waktu embedding sebaris

<ParamField path="sync.embeddingBatchTimeoutSeconds" type="number">
  Ganti batas waktu untuk batch embedding sebaris selama pengindeksan memori.

Jika tidak ditetapkan, nilai bawaan penyedia digunakan: 600 detik untuk penyedia lokal/yang dihosting sendiri seperti `local`, `ollama`, dan `lmstudio`, serta 120 detik untuk penyedia yang dihosting. Tingkatkan nilai ini ketika batch embedding lokal yang bergantung pada CPU berjalan normal tetapi lambat.
</ParamField>

---

## Perilaku pengindeksan

Semua berada di bawah `memorySearch.sync`, kecuali jika disebutkan lain:

| Kunci                          | Tipe      | Bawaan | Deskripsi                                                                    |
| ------------------------------ | --------- | ------ | ----------------------------------------------------------------------------- |
| `onSessionStart`               | `boolean` | `true` | Sinkronkan indeks memori saat sesi dimulai                                    |
| `onSearch`                     | `boolean` | `true` | Sinkronkan secara lambat saat pencarian setelah mendeteksi perubahan konten   |
| `watch`                        | `boolean` | `true` | Pantau berkas memori (chokidar) dan jadwalkan pengindeksan ulang saat berubah |
| `watchDebounceMs`              | `number`  | `1500` | Jendela debounce untuk menggabungkan peristiwa pemantauan berkas yang cepat   |
| `intervalMinutes`              | `number`  | `0`    | Interval pengindeksan ulang berkala dalam menit (`0` menonaktifkannya)        |
| `sessions.postCompactionForce` | `boolean` | `true` | Paksa pengindeksan ulang sesi setelah pembaruan transkrip yang dipicu Compaction |

<ParamField path="chunking.tokens" type="number">
  Ukuran potongan dalam token yang digunakan saat membagi sumber memori sebelum penyematan (bawaan: 400).
</ParamField>
<ParamField path="chunking.overlap" type="number">
  Tumpang tindih token antara potongan yang berdekatan untuk mempertahankan konteks di dekat batas pemisahan (bawaan: 80).
</ParamField>

<Note>
Mengubah `chunking.tokens` atau `chunking.overlap` akan mengubah batas potongan dan membatalkan identitas indeks yang ada (lihat Peringatan di bagian Pemilihan penyedia).
</Note>

---

## Konfigurasi pencarian hibrida

Semuanya berada di bawah `memorySearch.query`:

| Kunci        | Tipe     | Bawaan | Deskripsi                                               |
| ------------ | -------- | ------ | ------------------------------------------------------- |
| `maxResults` | `number` | `6`    | Jumlah maksimum hasil memori yang dikembalikan sebelum injeksi |
| `minScore`   | `number` | `0.35` | Skor relevansi minimum untuk menyertakan hasil          |

Dan di bawah `memorySearch.query.hybrid`:

| Kunci                 | Tipe      | Bawaan | Deskripsi                             |
| --------------------- | --------- | ------ | ------------------------------------- |
| `enabled`             | `boolean` | `true` | Aktifkan pencarian hibrida BM25 + vektor |
| `vectorWeight`        | `number`  | `0.7`  | Bobot untuk skor vektor (0-1)         |
| `textWeight`          | `number`  | `0.3`  | Bobot untuk skor BM25 (0-1)           |
| `candidateMultiplier` | `number`  | `4`    | Pengali ukuran kumpulan kandidat      |

<Tabs>
  <Tab title="MMR (keragaman)">
    | Kunci         | Tipe      | Bawaan | Deskripsi                                  |
    | ------------- | --------- | ------ | ------------------------------------------ |
    | `mmr.enabled` | `boolean` | `false` | Aktifkan pemeringkatan ulang MMR          |
    | `mmr.lambda`  | `number`  | `0.7`   | 0 = keragaman maksimum, 1 = relevansi maksimum |
  </Tab>
  <Tab title="Peluruhan temporal (keterkinian)">
    | Kunci                        | Tipe      | Bawaan | Deskripsi                         |
    | ---------------------------- | --------- | ------ | --------------------------------- |
    | `temporalDecay.enabled`      | `boolean` | `false` | Aktifkan peningkatan keterkinian |
    | `temporalDecay.halfLifeDays` | `number`  | `30`    | Skor berkurang setengah setiap N hari |

    Berkas yang selalu relevan (`MEMORY.md`, berkas tanpa tanggal di `memory/`) tidak pernah mengalami peluruhan.

  </Tab>
</Tabs>

### Contoh lengkap

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        query: {
          maxResults: 6,
          minScore: 0.35,
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

| Kunci        | Tipe       | Deskripsi                                |
| ------------ | ---------- | ---------------------------------------- |
| `extraPaths` | `string[]` | Direktori atau berkas tambahan untuk diindeks |

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

Jalur dapat berupa jalur absolut atau relatif terhadap ruang kerja. Direktori dipindai secara rekursif untuk mencari berkas `.md`. Penanganan symlink bergantung pada backend yang aktif: mesin bawaan melewati symlink, sedangkan QMD mengikuti perilaku pemindai QMD yang mendasarinya.

Untuk pencarian transkrip lintas agen dengan cakupan agen, gunakan `agents.list[].memorySearch.qmd.extraCollections` alih-alih `memory.qmd.paths`. Koleksi tambahan tersebut mengikuti bentuk `{ path, name, pattern? }` yang sama, tetapi digabungkan per agen dan dapat mempertahankan nama bersama yang ditetapkan secara eksplisit saat jalur mengarah ke luar ruang kerja saat ini. Jika jalur terselesaikan yang sama muncul di `memory.qmd.paths` dan `memorySearch.qmd.extraCollections`, QMD mempertahankan entri pertama dan melewati duplikatnya.

---

## Memori multimodal (Gemini)

Indeks gambar dan audio bersama Markdown menggunakan Gemini Embedding 2:

| Kunci                     | Tipe       | Bawaan    | Deskripsi                                  |
| ------------------------- | ---------- | ---------- | ------------------------------------------ |
| `multimodal.enabled`      | `boolean`  | `false`    | Aktifkan pengindeksan multimodal           |
| `multimodal.modalities`   | `string[]` | --         | `["image"]`, `["audio"]`, atau `["all"]`   |
| `multimodal.maxFileBytes` | `number`   | `10485760` | Ukuran berkas maksimum untuk pengindeksan (10 MiB) |

<Note>
Hanya berlaku untuk berkas di `extraPaths`. Root memori bawaan tetap hanya mendukung Markdown. Memerlukan `gemini-embedding-2-preview`. `fallback` harus berupa `"none"`.
</Note>

Format yang didukung: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.heic`, `.heif` (gambar); `.mp3`, `.wav`, `.ogg`, `.opus`, `.m4a`, `.aac`, `.flac` (audio).

---

## Cache embedding

| Kunci              | Jenis     | Bawaan       | Deskripsi                                        |
| ------------------ | --------- | ------------ | ------------------------------------------------ |
| `cache.enabled`    | `boolean` | `true`       | Cache embedding potongan di SQLite               |
| `cache.maxEntries` | `number`  | tidak diatur | Batas atas berbasis upaya terbaik untuk embedding yang di-cache |

Mencegah embedding ulang teks yang tidak berubah selama pengindeksan ulang atau pembaruan transkrip. Biarkan `maxEntries` tidak diatur untuk cache tanpa batas; atur nilainya ketika pertumbuhan penggunaan disk lebih penting daripada kecepatan puncak pengindeksan ulang. Jika diatur, entri terlama (berdasarkan waktu pembaruan terakhir) akan dipangkas terlebih dahulu setelah cache melampaui batas.

---

## Pengindeksan batch

| Kunci                         | Jenis     | Bawaan | Deskripsi                    |
| ----------------------------- | --------- | ------ | ---------------------------- |
| `remote.nonBatchConcurrency`  | `number`  | `4`    | Embedding inline paralel     |
| `remote.batch.enabled`        | `boolean` | `false` | Aktifkan API embedding batch |
| `remote.batch.concurrency`    | `number`  | `2`    | Tugas batch paralel          |
| `remote.batch.wait`           | `boolean` | `true` | Tunggu penyelesaian batch    |
| `remote.batch.pollIntervalMs` | `number`  | `2000` | Interval polling             |
| `remote.batch.timeoutMinutes` | `number`  | `60`   | Batas waktu batch            |

Tersedia untuk `gemini`, `openai`, dan `voyage`. Batch OpenAI biasanya paling cepat dan paling murah untuk pengisian kembali data dalam jumlah besar.

`remote.nonBatchConcurrency` mengontrol panggilan embedding inline yang digunakan oleh penyedia lokal/yang dihosting sendiri serta penyedia yang dihosting ketika API batch penyedia tidak aktif. Ollama menggunakan bawaan `1` untuk pengindeksan non-batch agar tidak membebani host lokal yang lebih kecil secara berlebihan; tetapkan nilai yang lebih tinggi pada mesin yang lebih besar.

Ini terpisah dari `sync.embeddingBatchTimeoutSeconds`, yang mengontrol batas waktu untuk panggilan embedding inline.

---

## Pencarian memori sesi (eksperimental)

Indeks transkrip sesi dan tampilkan melalui `memory_search`:

| Kunci                         | Jenis      | Bawaan      | Deskripsi                                      |
| ----------------------------- | ---------- | ------------ | ---------------------------------------------- |
| `experimental.sessionMemory`  | `boolean`  | `false`      | Aktifkan pengindeksan sesi                     |
| `sources`                     | `string[]` | `["memory"]` | Tambahkan `"sessions"` untuk menyertakan transkrip |
| `sync.sessions.deltaBytes`    | `number`   | `100000`     | Ambang byte untuk pengindeksan ulang           |
| `sync.sessions.deltaMessages` | `number`   | `50`         | Ambang pesan untuk pengindeksan ulang          |

<Warning>
Pengindeksan sesi bersifat opsional dan berjalan secara asinkron. Hasilnya mungkin sedikit kedaluwarsa. Log sesi berada di disk, jadi perlakukan akses sistem berkas sebagai batas kepercayaan.
</Warning>

Hasil transkrip sesi juga mematuhi
[`tools.sessions.visibility`](/id/gateway/config-tools#toolssessions). Visibilitas bawaan
`tree` hanya mengekspos sesi saat ini dan sesi yang dibuatnya. Untuk
mengingat sesi lain dari agen yang sama yang didistribusikan oleh Gateway dari
sesi berbeda, seperti DM, perluas visibilitas secara sengaja ke `agent` (atau `all` hanya
ketika pengingatan lintas agen juga diperlukan dan kebijakan antaragen mengizinkannya).

Contoh di bawah menempatkan pengaturan ini di bawah `agents.defaults`. Anda juga dapat
menerapkan pengaturan `memorySearch` yang setara dalam penggantian per agen ketika hanya satu
agen yang harus mengindeks dan mencari transkrip sesi.

Untuk pengingatan dari Gateway ke DM oleh agen yang sama:

<Tabs>
  <Tab title="Backend bawaan">
    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            experimental: { sessionMemory: true },
            sources: ["memory", "sessions"],
          },
        },
      },
      tools: {
        sessions: { visibility: "agent" },
      },
    }
    ```
  </Tab>
  <Tab title="Backend QMD">
    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            experimental: { sessionMemory: true },
            sources: ["memory", "sessions"],
          },
        },
      },
      memory: {
        backend: "qmd",
        qmd: {
          sessions: { enabled: true },
        },
      },
      tools: {
        sessions: { visibility: "agent" },
      },
    }
    ```
  </Tab>
</Tabs>

Saat menggunakan QMD, `agents.defaults.memorySearch.experimental.sessionMemory` dan
`sources: ["sessions"]` tidak mengekspor transkrip ke QMD dengan sendirinya. Atur juga
`memory.qmd.sessions.enabled: true`.

---

  ## Akselerasi vektor SQLite (sqlite-vec)

  | Kunci                        | Tipe      | Bawaan  | Deskripsi                                |
  | ---------------------------- | --------- | ------- | ---------------------------------------- |
  | `store.vector.enabled`       | `boolean` | `true`  | Gunakan sqlite-vec untuk kueri vektor    |
  | `store.vector.extensionPath` | `string`  | bawaan  | Timpa jalur sqlite-vec                    |

  Ketika sqlite-vec tidak tersedia, OpenClaw secara otomatis beralih ke kemiripan kosinus dalam proses.

  ---

  ## Penyimpanan indeks

  Indeks memori bawaan berada dalam basis data SQLite OpenClaw setiap agen di
  `agents/<agentId>/agent/openclaw-agent.sqlite`.

  | Kunci                 | Tipe     | Bawaan      | Deskripsi                                  |
  | --------------------- | -------- | ----------- | ------------------------------------------ |
  | `store.fts.tokenizer` | `string` | `unicode61` | Tokenizer FTS5 (`unicode61` atau `trigram`) |

  ---

  ## Konfigurasi backend QMD

  Atur `memory.backend = "qmd"` untuk mengaktifkannya. Semua pengaturan QMD berada di bawah `memory.qmd`:

  | Kunci                    | Tipe      | Bawaan   | Deskripsi                                                                                                  |
  | ------------------------ | --------- | -------- | ---------------------------------------------------------------------------------------------------------- |
  | `command`                | `string`  | `qmd`    | Jalur berkas yang dapat dieksekusi QMD; atur jalur absolut ketika `PATH` layanan berbeda dari shell Anda   |
  | `searchMode`             | `string`  | `search` | Perintah pencarian: `search`, `vsearch`, `query`                                                           |
  | `rerank`                 | `boolean` | --       | Atur ke `false` dengan `searchMode: "query"` dan QMD 2.1+ untuk melewati pemeringkatan ulang QMD           |
  | `includeDefaultMemory`   | `boolean` | `true`   | Indeks otomatis `MEMORY.md` + `memory/**/*.md`                                                             |
  | `paths[]`                | `array`   | --       | Jalur tambahan: `{ name, path, pattern? }`                                                                |
  | `sessions.enabled`       | `boolean` | `false`  | Ekspor transkrip sesi ke QMD                                                                              |
  | `sessions.retentionDays` | `number`  | --       | Masa penyimpanan transkrip                                                                                |
  | `sessions.exportDir`     | `string`  | --       | Direktori ekspor                                                                                          |

  `searchMode: "search"` hanya menggunakan leksikal/BM25. OpenClaw tidak menjalankan pemeriksaan kesiapan vektor semantik atau pemeliharaan penyematan QMD untuk mode tersebut, termasuk selama `memory status --deep`; `vsearch` dan `query` tetap memerlukan kesiapan vektor dan penyematan QMD.

  `rerank: false` hanya mengubah mode `query` QMD dan memerlukan QMD 2.1 atau yang lebih baru. Dalam mode CLI langsung, OpenClaw meneruskan `--no-rerank`; dalam mode MCP berbasis mcporter, OpenClaw meneruskan `rerank: false` ke alat kueri terpadu QMD. Biarkan tidak diatur untuk menggunakan perilaku pemeringkatan ulang kueri bawaan QMD.

  OpenClaw mengutamakan bentuk koleksi dan kueri MCP QMD terbaru, tetapi tetap mendukung rilis QMD lama dengan mencoba tanda pola koleksi yang kompatibel dan nama alat MCP lama bila diperlukan. Ketika QMD menyatakan dukungan untuk beberapa filter koleksi, koleksi dari sumber yang sama dicari dengan satu proses QMD; versi QMD lama tetap menggunakan jalur kompatibilitas per koleksi. Sumber yang sama berarti koleksi memori persisten (berkas memori bawaan beserta jalur khusus) dikelompokkan bersama, sedangkan koleksi transkrip sesi tetap menjadi kelompok terpisah agar diversifikasi sumber tetap memiliki kedua masukan.

  <Note>
  Penimpaan model QMD tetap berada di sisi QMD, bukan dalam konfigurasi OpenClaw. Jika Anda perlu menimpa model QMD secara global, atur variabel lingkungan seperti `QMD_EMBED_MODEL`, `QMD_RERANK_MODEL`, dan `QMD_GENERATE_MODEL` dalam lingkungan runtime Gateway.
  </Note>

  ### Integrasi mcporter

  Semuanya berada di bawah `memory.qmd.mcporter`. Mengarahkan pencarian QMD melalui daemon MCP `mcporter` berumur panjang alih-alih menjalankan `qmd` untuk setiap kueri, sehingga mengurangi beban awal dingin untuk model yang lebih besar.

  | Kunci         | Tipe      | Bawaan  | Deskripsi                                                                                  |
  | ------------- | --------- | ------- | ------------------------------------------------------------------------------------------ |
  | `enabled`     | `boolean` | `false` | Arahkan panggilan QMD melalui mcporter alih-alih menjalankan `qmd` untuk setiap permintaan |
  | `serverName`  | `string`  | `qmd`   | Nama server mcporter yang menjalankan `qmd mcp` dengan `lifecycle: keep-alive`             |
  | `startDaemon` | `boolean` | `true`  | Mulai daemon mcporter secara otomatis ketika `enabled` bernilai benar                      |

  Memerlukan `mcporter` yang terpasang dan tersedia di PATH, serta server mcporter terkonfigurasi yang menjalankan `qmd mcp`. Biarkan dinonaktifkan untuk penyiapan lokal yang lebih sederhana ketika biaya menjalankan proses per kueri masih dapat diterima.

  <AccordionGroup>
  <Accordion title="Jadwal pembaruan">
    | Kunci                     | Tipe      | Bawaan   | Deskripsi                                                                                                  |
    | ------------------------- | --------- | -------- | ---------------------------------------------------------------------------------------------------------- |
    | `update.interval`         | `string`  | `5m`     | Interval penyegaran                                                                                       |
    | `update.debounceMs`       | `number`  | `15000`  | Terapkan debounce pada perubahan berkas                                                                  |
    | `update.onBoot`           | `boolean` | `true`   | Segarkan ketika pengelola QMD berumur panjang dibuka; atur ke false untuk melewati pembaruan awal langsung |
    | `update.startup`          | `string`  | `off`    | Inisialisasi QMD opsional saat Gateway dimulai: `off`, `idle`, atau `immediate`                            |
    | `update.startupDelayMs`   | `number`  | `120000` | Penundaan sebelum penyegaran `startup: "idle"` berjalan                                                   |
    | `update.waitForBootSync`  | `boolean` | `false`  | Blokir pembukaan pengelola hingga penyegaran awal selesai                                                 |
    | `update.embedInterval`    | `string`  | `60m`    | Jadwal penyematan terpisah                                                                                |
    | `update.commandTimeoutMs` | `number`  | `30000`  | Batas waktu untuk perintah pemeliharaan QMD (daftar/tambah koleksi)                                       |
    | `update.updateTimeoutMs`  | `number`  | `120000` | Batas waktu untuk setiap siklus `qmd update`                                                              |
    | `update.embedTimeoutMs`   | `number`  | `120000` | Batas waktu untuk setiap siklus `qmd embed`                                                               |
  </Accordion>
  <Accordion title="Batas">
    | Kunci                     | Tipe     | Bawaan | Deskripsi                              |
    | ------------------------- | -------- | ------- | -------------------------------------- |
    | `limits.maxResults`       | `number` | `4`     | Hasil pencarian maksimum               |
    | `limits.maxSnippetChars`  | `number` | `450`   | Batasi panjang cuplikan                 |
    | `limits.maxInjectedChars` | `number` | `2200`  | Batasi jumlah karakter yang disisipkan |
    | `limits.timeoutMs`        | `number` | `4000`  | Batas waktu pencarian                  |
  </Accordion>
  <Accordion title="Cakupan">
    Mengontrol sesi yang dapat menerima hasil pencarian QMD. Skema yang sama dengan [`session.sendPolicy`](/id/gateway/config-agents#session):

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

    Bawaan yang didistribusikan hanya mengizinkan DM/langsung, serta menolak grup dan jenis saluran lainnya. `match.keyPrefix` mencocokkan kunci sesi yang telah dinormalisasi; `match.rawKeyPrefix` mencocokkan kunci mentah yang mencakup `agent:<id>:`.

  </Accordion>
  <Accordion title="Kutipan">
    `memory.citations` berlaku untuk semua backend:

    | Nilai            | Perilaku                                            |
    | ------------------ | ------------------------------------------------------ |
    | `auto` (bawaan) | Sertakan footer `Source: <path#line>` dalam cuplikan    |
    | `on`             | Selalu sertakan footer                               |
    | `off`            | Hilangkan footer (jalur tetap diteruskan ke agen secara internal) |

  </Accordion>
</AccordionGroup>

Saat inisialisasi QMD ketika Gateway dimulai diaktifkan, OpenClaw memulai QMD hanya untuk agen yang memenuhi syarat. Jika `update.onBoot` bernilai true dan tidak ada pemeliharaan interval/embed yang dikonfigurasi, proses awal menggunakan pengelola sekali jalan untuk penyegaran saat boot lalu menutupnya. Jika interval pembaruan atau embed dikonfigurasi, proses awal membuka pengelola QMD berumur panjang agar dapat mengelola pemantau dan pewaktu interval; `update.onBoot: false` hanya melewati penyegaran langsung saat boot.

### Contoh QMD lengkap

```json5
{
  memory: {
    backend: "qmd",
    citations: "auto",
    qmd: {
      includeDefaultMemory: true,
      update: { interval: "5m", debounceMs: 15000 },
      limits: { maxResults: 4, timeoutMs: 4000 },
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

Dreaming berjalan sebagai satu penyisiran terjadwal dan menggunakan fase internal ringan/dalam/REM sebagai detail implementasi.

Untuk perilaku konseptual dan perintah garis miring, lihat [Dreaming](/id/concepts/dreaming).

### Pengaturan pengguna

| Kunci                                  | Jenis     | Bawaan        | Deskripsi                                                                                                                              |
| -------------------------------------- | --------- | ------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`                              | `boolean` | `false`       | Aktifkan atau nonaktifkan Dreaming sepenuhnya                                                                                              |
| `frequency`                            | `string`  | `0 3 * * *`   | Irama Cron opsional untuk penyisiran Dreaming lengkap                                                                                |
| `model`                                | `string`  | model bawaan  | Penggantian model subagen Dream Diary opsional                                                                                     |
| `phases.deep.maxPromotedSnippetTokens` | `number`  | `160`         | Perkiraan token maksimum yang dipertahankan dari setiap cuplikan pengingatan jangka pendek yang dipromosikan ke `MEMORY.md`; metadata asal-usul tetap terlihat |

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
- Dreaming menulis keluaran naratif yang mudah dibaca manusia ke `DREAMS.md` (atau `dreams.md` yang sudah ada).
- `dreaming.model` menggunakan gerbang kepercayaan subagen Plugin yang ada; atur `plugins.entries.memory-core.subagent.allowModelOverride: true` sebelum mengaktifkannya.
- Dream Diary mencoba ulang sekali dengan model bawaan sesi saat model yang dikonfigurasi tidak tersedia. Kegagalan kepercayaan atau daftar izin dicatat dan tidak dicoba ulang secara diam-diam.
- Kebijakan dan ambang batas fase ringan/dalam/REM adalah perilaku internal, bukan konfigurasi yang ditujukan untuk pengguna.

</Note>

## Terkait

- [Referensi konfigurasi](/id/gateway/configuration-reference)
- [Ikhtisar memori](/id/concepts/memory)
- [Pencarian memori](/id/concepts/memory-search)
