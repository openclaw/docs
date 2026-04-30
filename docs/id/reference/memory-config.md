---
read_when:
    - Anda ingin mengonfigurasi penyedia pencarian memori atau model embedding
    - Anda ingin menyiapkan backend QMD
    - Anda ingin menyetel pencarian hibrida, MMR, atau peluruhan temporal
    - Anda ingin mengaktifkan pengindeksan memori multimodal
sidebarTitle: Memory config
summary: Semua opsi konfigurasi untuk pencarian memori, penyedia penyematan, QMD, pencarian hibrida, dan pengindeksan multimodal
title: Referensi konfigurasi memori
x-i18n:
    generated_at: "2026-04-30T10:10:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: fbb21d407f7ec9ef76e68c268138892b12568137735b723579703e535d34b195
    source_path: reference/memory-config.md
    workflow: 16
---

Halaman ini mencantumkan setiap tombol konfigurasi untuk pencarian memori OpenClaw. Untuk ikhtisar konseptual, lihat:

<CardGroup cols={2}>
  <Card title="Ikhtisar memori" href="/id/concepts/memory">
    Cara kerja memori.
  </Card>
  <Card title="Mesin bawaan" href="/id/concepts/memory-builtin">
    Backend SQLite bawaan.
  </Card>
  <Card title="Mesin QMD" href="/id/concepts/memory-qmd">
    Sidecar yang mengutamakan lokal.
  </Card>
  <Card title="Pencarian memori" href="/id/concepts/memory-search">
    Pipeline pencarian dan penyetelan.
  </Card>
  <Card title="Active memory" href="/id/concepts/active-memory">
    Sub-agen memori untuk sesi interaktif.
  </Card>
</CardGroup>

Semua pengaturan pencarian memori berada di bawah `agents.defaults.memorySearch` dalam `openclaw.json` kecuali dinyatakan lain.

<Note>
Jika Anda mencari toggle fitur **active memory** dan konfigurasi sub-agennya, itu berada di bawah `plugins.entries.active-memory`, bukan `memorySearch`.

Active memory menggunakan model dua gerbang:

1. Plugin harus diaktifkan dan menargetkan id agen saat ini
2. Permintaan harus berupa sesi obrolan persisten interaktif yang memenuhi syarat

Lihat [Active Memory](/id/concepts/active-memory) untuk model aktivasi, konfigurasi milik Plugin, persistensi transkrip, dan pola peluncuran aman.
</Note>

---

## Pemilihan penyedia

| Kunci      | Tipe      | Bawaan             | Deskripsi                                                                                                                                                                                                                              |
| ---------- | --------- | ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider` | `string`  | terdeteksi otomatis | ID adaptor embedding seperti `bedrock`, `deepinfra`, `gemini`, `github-copilot`, `local`, `mistral`, `ollama`, `openai`, atau `voyage`; juga dapat berupa `models.providers.<id>` yang dikonfigurasi dengan `api` yang mengarah ke salah satu adaptor tersebut |
| `model`    | `string`  | bawaan penyedia    | Nama model embedding                                                                                                                                                                                                                   |
| `fallback` | `string`  | `"none"`           | ID adaptor fallback saat yang utama gagal                                                                                                                                                                                              |
| `enabled`  | `boolean` | `true`             | Aktifkan atau nonaktifkan pencarian memori                                                                                                                                                                                            |

### Urutan deteksi otomatis

Saat `provider` tidak disetel, OpenClaw memilih yang pertama tersedia:

<Steps>
  <Step title="local">
    Dipilih jika `memorySearch.local.modelPath` dikonfigurasi dan file tersebut ada.
  </Step>
  <Step title="github-copilot">
    Dipilih jika token GitHub Copilot dapat di-resolve (variabel env atau profil auth).
  </Step>
  <Step title="openai">
    Dipilih jika kunci OpenAI dapat di-resolve.
  </Step>
  <Step title="gemini">
    Dipilih jika kunci Gemini dapat di-resolve.
  </Step>
  <Step title="voyage">
    Dipilih jika kunci Voyage dapat di-resolve.
  </Step>
  <Step title="mistral">
    Dipilih jika kunci Mistral dapat di-resolve.
  </Step>
  <Step title="deepinfra">
    Dipilih jika kunci DeepInfra dapat di-resolve.
  </Step>
  <Step title="bedrock">
    Dipilih jika rantai kredensial AWS SDK berhasil di-resolve (peran instance, kunci akses, profil, SSO, identitas web, atau konfigurasi bersama).
  </Step>
</Steps>

`ollama` didukung tetapi tidak terdeteksi otomatis (setel secara eksplisit).

### ID penyedia kustom

`memorySearch.provider` dapat mengarah ke entri `models.providers.<id>` kustom. OpenClaw me-resolve pemilik `api` penyedia tersebut untuk adaptor embedding sambil mempertahankan id penyedia kustom untuk penanganan endpoint, auth, dan prefiks model. Ini memungkinkan setup multi-GPU atau multi-host mendedikasikan embedding memori ke endpoint lokal tertentu:

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

Embedding jarak jauh memerlukan kunci API. Bedrock menggunakan rantai kredensial bawaan AWS SDK sebagai gantinya (peran instance, SSO, kunci akses).

| Penyedia       | Variabel env                                      | Kunci konfigurasi                  |
| -------------- | -------------------------------------------------- | ----------------------------------- |
| Bedrock        | Rantai kredensial AWS                              | Tidak perlu kunci API               |
| DeepInfra      | `DEEPINFRA_API_KEY`                                | `models.providers.deepinfra.apiKey` |
| Gemini         | `GEMINI_API_KEY`                                   | `models.providers.google.apiKey`    |
| GitHub Copilot | `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, `GITHUB_TOKEN` | Profil auth melalui login perangkat |
| Mistral        | `MISTRAL_API_KEY`                                  | `models.providers.mistral.apiKey`   |
| Ollama         | `OLLAMA_API_KEY` (placeholder)                     | --                                  |
| OpenAI         | `OPENAI_API_KEY`                                   | `models.providers.openai.apiKey`    |
| Voyage         | `VOYAGE_API_KEY`                                   | `models.providers.voyage.apiKey`    |

<Note>
Codex OAuth hanya mencakup chat/completions dan tidak memenuhi permintaan embedding.
</Note>

---

## Konfigurasi endpoint jarak jauh

Untuk endpoint kustom yang kompatibel dengan OpenAI atau mengganti bawaan penyedia:

<ParamField path="remote.baseUrl" type="string">
  URL basis API kustom.
</ParamField>
<ParamField path="remote.apiKey" type="string">
  Ganti kunci API.
</ParamField>
<ParamField path="remote.headers" type="object">
  Header HTTP tambahan (digabung dengan bawaan penyedia).
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
    | Kunci                  | Tipe     | Bawaan                 | Deskripsi                                  |
    | ---------------------- | -------- | ---------------------- | ------------------------------------------ |
    | `model`                | `string` | `gemini-embedding-001` | Juga mendukung `gemini-embedding-2-preview` |
    | `outputDimensionality` | `number` | `3072`                 | Untuk Embedding 2: 768, 1536, atau 3072    |

    <Warning>
    Mengubah model atau `outputDimensionality` memicu reindeks penuh otomatis.
    </Warning>

  </Accordion>
  <Accordion title="Tipe input yang kompatibel dengan OpenAI">
    Endpoint embedding yang kompatibel dengan OpenAI dapat ikut menggunakan field permintaan `input_type` khusus penyedia. Ini berguna untuk model embedding asimetris yang memerlukan label berbeda untuk embedding kueri dan dokumen.

    | Kunci               | Tipe     | Bawaan        | Deskripsi                                                |
    | ------------------- | -------- | ------------- | -------------------------------------------------------- |
    | `inputType`         | `string` | belum disetel | `input_type` bersama untuk embedding kueri dan dokumen   |
    | `queryInputType`    | `string` | belum disetel | `input_type` saat kueri; mengganti `inputType`           |
    | `documentInputType` | `string` | belum disetel | `input_type` indeks/dokumen; mengganti `inputType`       |

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

    Mengubah nilai-nilai ini memengaruhi identitas cache embedding untuk pengindeksan batch penyedia dan sebaiknya diikuti dengan reindeks memori saat model upstream memperlakukan label-label tersebut secara berbeda.

  </Accordion>
  <Accordion title="Bedrock">
    Bedrock menggunakan rantai kredensial bawaan AWS SDK — tidak perlu kunci API. Jika OpenClaw berjalan di EC2 dengan peran instance yang mendukung Bedrock, cukup setel penyedia dan model:

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

    | Kunci                  | Tipe     | Bawaan                        | Deskripsi                    |
    | ---------------------- | -------- | ----------------------------- | ---------------------------- |
    | `model`                | `string` | `amazon.titan-embed-text-v2:0` | ID model embedding Bedrock apa pun |
    | `outputDimensionality` | `number` | bawaan model                  | Untuk Titan V2: 256, 512, atau 1024 |

    **Model yang didukung** (dengan deteksi family dan bawaan dimensi):

    | ID Model                                   | Penyedia   | Dim Bawaan | Dim yang Dapat Dikonfigurasi |
    | ------------------------------------------ | ---------- | ---------- | ---------------------------- |
    | `amazon.titan-embed-text-v2:0`             | Amazon     | 1024       | 256, 512, 1024               |
    | `amazon.titan-embed-text-v1`               | Amazon     | 1536       | --                           |
    | `amazon.titan-embed-g1-text-02`            | Amazon     | 1536       | --                           |
    | `amazon.titan-embed-image-v1`              | Amazon     | 1024       | --                           |
    | `amazon.nova-2-multimodal-embeddings-v1:0` | Amazon     | 1024       | 256, 384, 1024, 3072         |
    | `cohere.embed-english-v3`                  | Cohere     | 1024       | --                           |
    | `cohere.embed-multilingual-v3`             | Cohere     | 1024       | --                           |
    | `cohere.embed-v4:0`                        | Cohere     | 1536       | 256-1536                     |
    | `twelvelabs.marengo-embed-3-0-v1:0`        | TwelveLabs | 512        | --                           |
    | `twelvelabs.marengo-embed-2-7-v1:0`        | TwelveLabs | 1024       | --                           |

    Varian bersufiks throughput (misalnya, `amazon.titan-embed-text-v1:2:8k`) mewarisi konfigurasi model dasar.

    **Autentikasi:** Auth Bedrock menggunakan urutan resolusi kredensial AWS SDK standar:

    1. Variabel lingkungan (`AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`)
    2. Cache token SSO
    3. Kredensial token identitas web
    4. Kredensial bersama dan file konfigurasi
    5. Kredensial metadata ECS atau EC2

    Region di-resolve dari `AWS_REGION`, `AWS_DEFAULT_REGION`, `baseUrl` penyedia `amazon-bedrock`, atau default ke `us-east-1`.

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
  <Accordion title="Lokal (GGUF + node-llama-cpp)">
    | Kunci                 | Tipe               | Default                | Deskripsi                                                                                                                                                                                                                                                                                                             |
    | --------------------- | ------------------ | ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
    | `local.modelPath`     | `string`           | diunduh otomatis       | Path ke berkas model GGUF                                                                                                                                                                                                                                                                                             |
    | `local.modelCacheDir` | `string`           | default node-llama-cpp | Direktori cache untuk model yang diunduh                                                                                                                                                                                                                                                                              |
    | `local.contextSize`   | `number \| "auto"` | `4096`                 | Ukuran jendela konteks untuk konteks embedding. 4096 mencakup chunk umum (128–512 token) sambil membatasi VRAM non-bobot. Turunkan ke 1024–2048 pada host terbatas. `"auto"` menggunakan maksimum terlatih model — tidak disarankan untuk model 8B+ (Qwen3-Embedding-8B: 40 960 token → ~32 GB VRAM vs ~8,8 GB pada 4096). |

    Model default: `embeddinggemma-300m-qat-Q8_0.gguf` (~0,6 GB, diunduh otomatis). Memerlukan build native: `pnpm approve-builds` lalu `pnpm rebuild node-llama-cpp`.

    Gunakan CLI mandiri untuk memverifikasi path penyedia yang sama dengan yang digunakan Gateway:

    ```bash
    openclaw memory status --deep --agent main
    openclaw memory index --force --agent main
    ```

    Jika `provider` adalah `auto`, `local` dipilih hanya ketika `local.modelPath` menunjuk ke berkas lokal yang sudah ada. Referensi model `hf:` dan HTTP(S) masih dapat digunakan secara eksplisit dengan `provider: "local"`, tetapi referensi tersebut tidak membuat `auto` memilih lokal sebelum model tersedia di disk.

  </Accordion>
</AccordionGroup>

### Timeout embedding inline

<ParamField path="sync.embeddingBatchTimeoutSeconds" type="number">
  Timpa timeout untuk batch embedding inline selama pengindeksan memori.

Jika tidak diatur, gunakan default penyedia: 600 detik untuk penyedia lokal/self-hosted seperti `local`, `ollama`, dan `lmstudio`, serta 120 detik untuk penyedia hosted. Tingkatkan ini ketika batch embedding lokal yang bergantung pada CPU sehat tetapi lambat.
</ParamField>

---

## Konfigurasi pencarian hybrid

Semua berada di bawah `memorySearch.query.hybrid`:

| Kunci                 | Tipe      | Default | Deskripsi                                    |
| --------------------- | --------- | ------- | -------------------------------------------- |
| `enabled`             | `boolean` | `true`  | Aktifkan pencarian hybrid BM25 + vektor      |
| `vectorWeight`        | `number`  | `0.7`   | Bobot untuk skor vektor (0-1)                |
| `textWeight`          | `number`  | `0.3`   | Bobot untuk skor BM25 (0-1)                  |
| `candidateMultiplier` | `number`  | `4`     | Pengali ukuran kumpulan kandidat             |

<Tabs>
  <Tab title="MMR (keragaman)">
    | Kunci         | Tipe      | Default | Deskripsi                               |
    | ------------- | --------- | ------- | --------------------------------------- |
    | `mmr.enabled` | `boolean` | `false` | Aktifkan pemeringkatan ulang MMR        |
    | `mmr.lambda`  | `number`  | `0.7`   | 0 = keragaman maksimum, 1 = relevansi maksimum |
  </Tab>
  <Tab title="Peluruhan temporal (keterbaruan)">
    | Kunci                        | Tipe      | Default | Deskripsi                      |
    | ---------------------------- | --------- | ------- | -------------------------------- |
    | `temporalDecay.enabled`      | `boolean` | `false` | Aktifkan peningkatan keterbaruan |
    | `temporalDecay.halfLifeDays` | `number`  | `30`    | Skor berkurang setengah setiap N hari |

    Berkas evergreen (`MEMORY.md`, berkas tanpa tanggal di `memory/`) tidak pernah diluruhkan.

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

| Kunci        | Tipe       | Deskripsi                                  |
| ------------ | ---------- | ------------------------------------------ |
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

Path dapat bersifat absolut atau relatif terhadap workspace. Direktori dipindai secara rekursif untuk berkas `.md`. Penanganan symlink bergantung pada backend aktif: mesin bawaan mengabaikan symlink, sedangkan QMD mengikuti perilaku pemindai QMD yang mendasarinya.

Untuk pencarian transkrip lintas agen dengan scope agen, gunakan `agents.list[].memorySearch.qmd.extraCollections` alih-alih `memory.qmd.paths`. Koleksi tambahan tersebut mengikuti bentuk `{ path, name, pattern? }` yang sama, tetapi digabungkan per agen dan dapat mempertahankan nama bersama eksplisit ketika path menunjuk ke luar workspace saat ini. Jika path terselesaikan yang sama muncul di `memory.qmd.paths` dan `memorySearch.qmd.extraCollections`, QMD mempertahankan entri pertama dan melewati duplikat.

---

## Memori multimodal (Gemini)

Indeks gambar dan audio bersama Markdown menggunakan Gemini Embedding 2:

| Kunci                     | Tipe       | Default    | Deskripsi                              |
| ------------------------- | ---------- | ---------- | -------------------------------------- |
| `multimodal.enabled`      | `boolean`  | `false`    | Aktifkan pengindeksan multimodal       |
| `multimodal.modalities`   | `string[]` | --         | `["image"]`, `["audio"]`, atau `["all"]` |
| `multimodal.maxFileBytes` | `number`   | `10000000` | Ukuran berkas maksimum untuk pengindeksan |

<Note>
Hanya berlaku untuk file di `extraPaths`. Root memori default tetap hanya Markdown. Memerlukan `gemini-embedding-2-preview`. `fallback` harus berupa `"none"`.
</Note>

Format yang didukung: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.heic`, `.heif` (gambar); `.mp3`, `.wav`, `.ogg`, `.opus`, `.m4a`, `.aac`, `.flac` (audio).

---

## Cache penyematan

| Kunci              | Tipe      | Default | Deskripsi                               |
| ------------------ | --------- | ------- | --------------------------------------- |
| `cache.enabled`    | `boolean` | `false` | Cache penyematan chunk di SQLite        |
| `cache.maxEntries` | `number`  | `50000` | Penyematan cache maksimum               |

Mencegah penyematan ulang teks yang tidak berubah selama pengindeksan ulang atau pembaruan transkrip.

---

## Pengindeksan batch

| Kunci                         | Tipe      | Default | Deskripsi                        |
| ----------------------------- | --------- | ------- | -------------------------------- |
| `remote.nonBatchConcurrency`  | `number`  | `4`     | Penyematan langsung paralel      |
| `remote.batch.enabled`        | `boolean` | `false` | Aktifkan API penyematan batch    |
| `remote.batch.concurrency`    | `number`  | `2`     | Pekerjaan batch paralel          |
| `remote.batch.wait`           | `boolean` | `true`  | Tunggu penyelesaian batch        |
| `remote.batch.pollIntervalMs` | `number`  | --      | Interval polling                 |
| `remote.batch.timeoutMinutes` | `number`  | --      | Batas waktu batch                |

Tersedia untuk `openai`, `gemini`, dan `voyage`. Batch OpenAI biasanya paling cepat dan paling murah untuk backfill besar.

`remote.nonBatchConcurrency` mengontrol panggilan penyematan langsung yang digunakan oleh penyedia lokal/di-host sendiri dan penyedia ter-host saat API batch penyedia tidak aktif. Ollama menggunakan default `1` untuk pengindeksan non-batch agar tidak membebani host lokal yang lebih kecil; tetapkan nilai yang lebih tinggi di mesin yang lebih besar.

Ini terpisah dari `sync.embeddingBatchTimeoutSeconds`, yang mengontrol batas waktu untuk panggilan penyematan langsung.

---

## Pencarian memori sesi (eksperimental)

Indeks transkrip sesi dan tampilkan melalui `memory_search`:

| Kunci                         | Tipe       | Default      | Deskripsi                                  |
| ----------------------------- | ---------- | ------------ | ------------------------------------------ |
| `experimental.sessionMemory`  | `boolean`  | `false`      | Aktifkan pengindeksan sesi                 |
| `sources`                     | `string[]` | `["memory"]` | Tambahkan `"sessions"` untuk menyertakan transkrip |
| `sync.sessions.deltaBytes`    | `number`   | `100000`     | Ambang byte untuk pengindeksan ulang       |
| `sync.sessions.deltaMessages` | `number`   | `50`         | Ambang pesan untuk pengindeksan ulang      |

<Warning>
Pengindeksan sesi bersifat opt-in dan berjalan secara asinkron. Hasil dapat sedikit usang. Log sesi berada di disk, jadi perlakukan akses sistem file sebagai batas kepercayaan.
</Warning>

---

## Akselerasi vektor SQLite (sqlite-vec)

| Kunci                        | Tipe      | Default | Deskripsi                                |
| ---------------------------- | --------- | ------- | ---------------------------------------- |
| `store.vector.enabled`       | `boolean` | `true`  | Gunakan sqlite-vec untuk kueri vektor    |
| `store.vector.extensionPath` | `string`  | bundled | Timpa jalur sqlite-vec                   |

Saat sqlite-vec tidak tersedia, OpenClaw otomatis beralih ke kemiripan kosinus dalam proses.

---

## Penyimpanan indeks

| Kunci                 | Tipe     | Default                               | Deskripsi                                      |
| --------------------- | -------- | ------------------------------------- | ---------------------------------------------- |
| `store.path`          | `string` | `~/.openclaw/memory/{agentId}.sqlite` | Lokasi indeks (mendukung token `{agentId}`)    |
| `store.fts.tokenizer` | `string` | `unicode61`                           | Tokenizer FTS5 (`unicode61` atau `trigram`)    |

---

## Konfigurasi backend QMD

Tetapkan `memory.backend = "qmd"` untuk mengaktifkan. Semua pengaturan QMD berada di bawah `memory.qmd`:

| Kunci                    | Tipe      | Default  | Deskripsi                                                                                 |
| ------------------------ | --------- | -------- | ----------------------------------------------------------------------------------------- |
| `command`                | `string`  | `qmd`    | Jalur executable QMD; tetapkan jalur absolut saat layanan `PATH` berbeda dari shell Anda  |
| `searchMode`             | `string`  | `search` | Perintah pencarian: `search`, `vsearch`, `query`                                          |
| `includeDefaultMemory`   | `boolean` | `true`   | Indeks otomatis `MEMORY.md` + `memory/**/*.md`                                            |
| `paths[]`                | `array`   | --       | Jalur tambahan: `{ name, path, pattern? }`                                                 |
| `sessions.enabled`       | `boolean` | `false`  | Indeks transkrip sesi                                                                      |
| `sessions.retentionDays` | `number`  | --       | Retensi transkrip                                                                          |
| `sessions.exportDir`     | `string`  | --       | Direktori ekspor                                                                           |

`searchMode: "search"` bersifat leksikal/BM25 saja. OpenClaw tidak menjalankan probe kesiapan vektor semantik atau pemeliharaan embedding QMD untuk mode tersebut, termasuk selama `memory status --deep`; `vsearch` dan `query` tetap memerlukan kesiapan vektor QMD dan embedding.

OpenClaw lebih memilih koleksi QMD dan bentuk kueri MCP saat ini, tetapi tetap menjaga rilis QMD lama tetap berfungsi dengan mencoba flag pola koleksi yang kompatibel dan nama alat MCP lama saat diperlukan. Saat QMD mengiklankan dukungan untuk beberapa filter koleksi, koleksi dari sumber yang sama dicari dengan satu proses QMD; build QMD lama tetap menggunakan jalur kompatibilitas per koleksi. Sumber yang sama berarti koleksi memori tahan lama dikelompokkan bersama, sementara koleksi transkrip sesi tetap menjadi grup terpisah sehingga diversifikasi sumber masih memiliki kedua input.

<Note>
Override model QMD tetap berada di sisi QMD, bukan konfigurasi OpenClaw. Jika Anda perlu mengesampingkan model QMD secara global, tetapkan variabel lingkungan seperti `QMD_EMBED_MODEL`, `QMD_RERANK_MODEL`, dan `QMD_GENERATE_MODEL` di lingkungan runtime gateway.
</Note>

<AccordionGroup>
  <Accordion title="Jadwal pembaruan">
    | Key                       | Type      | Default | Description                           |
    | ------------------------- | --------- | ------- | ------------------------------------- |
    | `update.interval`         | `string`  | `5m`    | Interval penyegaran                   |
    | `update.debounceMs`       | `number`  | `15000` | Debounce perubahan file               |
    | `update.onBoot`           | `boolean` | `true`  | Segarkan saat manajer QMD berumur panjang dibuka; juga mengatur penyegaran startup opt-in |
    | `update.startup`          | `string`  | `off`   | Penyegaran opsional saat gateway dimulai: `off`, `idle`, atau `immediate` |
    | `update.startupDelayMs`   | `number`  | `120000` | Penundaan sebelum penyegaran `startup: "idle"` berjalan |
    | `update.waitForBootSync`  | `boolean` | `false` | Blokir pembukaan manajer hingga penyegaran awalnya selesai |
    | `update.embedInterval`    | `string`  | --      | Irama embed terpisah                  |
    | `update.commandTimeoutMs` | `number`  | --      | Timeout untuk perintah QMD            |
    | `update.updateTimeoutMs`  | `number`  | --      | Timeout untuk operasi pembaruan QMD   |
    | `update.embedTimeoutMs`   | `number`  | --      | Timeout untuk operasi embed QMD       |
  </Accordion>
  <Accordion title="Batas">
    | Key                       | Type     | Default | Description                |
    | ------------------------- | -------- | ------- | -------------------------- |
    | `limits.maxResults`       | `number` | `6`     | Hasil pencarian maksimum   |
    | `limits.maxSnippetChars`  | `number` | --      | Batasi panjang cuplikan    |
    | `limits.maxInjectedChars` | `number` | --      | Batasi total karakter yang diinjeksi |
    | `limits.timeoutMs`        | `number` | `4000`  | Timeout pencarian          |
  </Accordion>
  <Accordion title="Cakupan">
    Mengontrol sesi mana yang dapat menerima hasil pencarian QMD. Skema yang sama seperti [`session.sendPolicy`](/id/gateway/config-agents#session):

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

    Default bawaan mengizinkan sesi langsung dan channel, sambil tetap menolak grup.

    Default hanya DM. `match.keyPrefix` mencocokkan kunci sesi yang dinormalisasi; `match.rawKeyPrefix` mencocokkan kunci mentah termasuk `agent:<id>:`.

  </Accordion>
  <Accordion title="Kutipan">
    `memory.citations` berlaku untuk semua backend:

    | Value            | Behavior                                            |
    | ---------------- | --------------------------------------------------- |
    | `auto` (default) | Sertakan footer `Source: <path#line>` dalam cuplikan |
    | `on`             | Selalu sertakan footer                              |
    | `off`            | Hilangkan footer (path masih diteruskan ke agent secara internal) |

  </Accordion>
</AccordionGroup>

Penyegaran boot QMD menggunakan jalur subprocess sekali jalan selama startup gateway. Manajer QMD berumur panjang tetap memiliki file watcher reguler dan timer interval saat pencarian memori dibuka untuk penggunaan interaktif.

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

Dreaming berjalan sebagai satu sweep terjadwal dan menggunakan fase internal light/deep/REM sebagai detail implementasi.

Untuk perilaku konseptual dan perintah slash, lihat [Dreaming](/id/concepts/dreaming).

### Pengaturan pengguna

| Key         | Type      | Default       | Description                                       |
| ----------- | --------- | ------------- | ------------------------------------------------- |
| `enabled`   | `boolean` | `false`       | Aktifkan atau nonaktifkan dreaming sepenuhnya     |
| `frequency` | `string`  | `0 3 * * *`   | Irama cron opsional untuk sweep dreaming lengkap  |
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
- Dreaming menulis keluaran naratif yang dapat dibaca manusia ke `DREAMS.md` (atau `dreams.md` yang sudah ada).
- `dreaming.model` menggunakan gate kepercayaan subagent plugin yang sudah ada; tetapkan `plugins.entries.memory-core.subagent.allowModelOverride: true` sebelum mengaktifkannya.
- Dream Diary mencoba ulang satu kali dengan model default sesi saat model yang dikonfigurasi tidak tersedia. Kegagalan kepercayaan atau allowlist dicatat di log dan tidak dicoba ulang secara diam-diam.
- Kebijakan fase light/deep/REM dan ambang batas adalah perilaku internal, bukan konfigurasi yang terlihat oleh pengguna.

</Note>

## Terkait

- [Referensi konfigurasi](/id/gateway/configuration-reference)
- [Ikhtisar memori](/id/concepts/memory)
- [Pencarian memori](/id/concepts/memory-search)
