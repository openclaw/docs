---
read_when:
    - Anda ingin menjalankan OpenClaw dengan model cloud atau lokal melalui Ollama
    - Anda memerlukan panduan setup dan konfigurasi Ollama
summary: Jalankan OpenClaw dengan Ollama (model cloud dan lokal)
title: Ollama
x-i18n:
    generated_at: "2026-04-05T14:04:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 337b8ec3a7756e591e6d6f82e8ad13417f0f20c394ec540e8fc5756e0fc13c29
    source_path: providers/ollama.md
    workflow: 15
---

# Ollama

Ollama adalah runtime LLM lokal yang memudahkan Anda menjalankan model open-source di mesin Anda. OpenClaw terintegrasi dengan API native Ollama (`/api/chat`), mendukung streaming dan tool calling, serta dapat menemukan model Ollama lokal secara otomatis saat Anda mengaktifkannya dengan `OLLAMA_API_KEY` (atau auth profile) dan tidak mendefinisikan entri `models.providers.ollama` secara eksplisit.

<Warning>
**Pengguna Ollama jarak jauh**: Jangan gunakan URL yang kompatibel dengan OpenAI `/v1` (`http://host:11434/v1`) dengan OpenClaw. Ini merusak tool calling dan model dapat mengeluarkan JSON tool mentah sebagai teks biasa. Gunakan URL API Ollama native sebagai gantinya: `baseUrl: "http://host:11434"` (tanpa `/v1`).
</Warning>

## Mulai cepat

### Onboarding (direkomendasikan)

Cara tercepat untuk menyiapkan Ollama adalah melalui onboarding:

```bash
openclaw onboard
```

Pilih **Ollama** dari daftar provider. Onboarding akan:

1. Meminta base URL Ollama tempat instance Anda dapat dijangkau (default `http://127.0.0.1:11434`).
2. Memungkinkan Anda memilih **Cloud + Local** (model cloud dan model lokal) atau **Local** (hanya model lokal).
3. Membuka alur login browser jika Anda memilih **Cloud + Local** dan belum masuk ke ollama.com.
4. Menemukan model yang tersedia dan menyarankan default.
5. Secara otomatis melakukan pull pada model yang dipilih jika belum tersedia secara lokal.

Mode non-interaktif juga didukung:

```bash
openclaw onboard --non-interactive \
  --auth-choice ollama \
  --accept-risk
```

Secara opsional tentukan base URL atau model kustom:

```bash
openclaw onboard --non-interactive \
  --auth-choice ollama \
  --custom-base-url "http://ollama-host:11434" \
  --custom-model-id "qwen3.5:27b" \
  --accept-risk
```

### Setup manual

1. Instal Ollama: [https://ollama.com/download](https://ollama.com/download)

2. Lakukan pull model lokal jika Anda ingin inferensi lokal:

```bash
ollama pull glm-4.7-flash
# atau
ollama pull gpt-oss:20b
# atau
ollama pull llama3.3
```

3. Jika Anda juga ingin model cloud, masuklah:

```bash
ollama signin
```

4. Jalankan onboarding dan pilih `Ollama`:

```bash
openclaw onboard
```

- `Local`: hanya model lokal
- `Cloud + Local`: model lokal plus model cloud
- Model cloud seperti `kimi-k2.5:cloud`, `minimax-m2.5:cloud`, dan `glm-5:cloud` **tidak** memerlukan `ollama pull` lokal

OpenClaw saat ini menyarankan:

- default lokal: `glm-4.7-flash`
- default cloud: `kimi-k2.5:cloud`, `minimax-m2.5:cloud`, `glm-5:cloud`

5. Jika Anda lebih suka setup manual, aktifkan Ollama untuk OpenClaw secara langsung (nilai apa pun akan berfungsi; Ollama tidak memerlukan key yang sebenarnya):

```bash
# Setel variabel environment
export OLLAMA_API_KEY="ollama-local"

# Atau konfigurasikan di file konfigurasi Anda
openclaw config set models.providers.ollama.apiKey "ollama-local"
```

6. Periksa atau ganti model:

```bash
openclaw models list
openclaw models set ollama/glm-4.7-flash
```

7. Atau setel default di konfigurasi:

```json5
{
  agents: {
    defaults: {
      model: { primary: "ollama/glm-4.7-flash" },
    },
  },
}
```

## Penemuan model (provider implisit)

Saat Anda menyetel `OLLAMA_API_KEY` (atau auth profile) dan **tidak** mendefinisikan `models.providers.ollama`, OpenClaw menemukan model dari instance Ollama lokal di `http://127.0.0.1:11434`:

- Melakukan query ke `/api/tags`
- Menggunakan lookup `/api/show` best-effort untuk membaca `contextWindow` saat tersedia
- Menandai `reasoning` dengan heuristik nama model (`r1`, `reasoning`, `think`)
- Menyetel `maxTokens` ke batas maksimum token default Ollama yang digunakan oleh OpenClaw
- Menyetel semua biaya ke `0`

Ini menghindari entri model manual sambil menjaga katalog tetap selaras dengan instance Ollama lokal.

Untuk melihat model apa saja yang tersedia:

```bash
ollama list
openclaw models list
```

Untuk menambahkan model baru, cukup lakukan pull dengan Ollama:

```bash
ollama pull mistral
```

Model baru akan otomatis ditemukan dan tersedia untuk digunakan.

Jika Anda menyetel `models.providers.ollama` secara eksplisit, penemuan otomatis dilewati dan Anda harus mendefinisikan model secara manual (lihat di bawah).

## Konfigurasi

### Setup dasar (penemuan implisit)

Cara paling sederhana untuk mengaktifkan Ollama adalah melalui variabel environment:

```bash
export OLLAMA_API_KEY="ollama-local"
```

### Setup eksplisit (model manual)

Gunakan konfigurasi eksplisit saat:

- Ollama berjalan pada host/port lain.
- Anda ingin memaksa daftar model atau context window tertentu.
- Anda ingin definisi model sepenuhnya manual.

```json5
{
  models: {
    providers: {
      ollama: {
        baseUrl: "http://ollama-host:11434",
        apiKey: "ollama-local",
        api: "ollama",
        models: [
          {
            id: "gpt-oss:20b",
            name: "GPT-OSS 20B",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 8192,
            maxTokens: 8192 * 10
          }
        ]
      }
    }
  }
}
```

Jika `OLLAMA_API_KEY` disetel, Anda dapat menghilangkan `apiKey` di entri provider dan OpenClaw akan mengisinya untuk pemeriksaan ketersediaan.

### Base URL kustom (konfigurasi eksplisit)

Jika Ollama berjalan pada host atau port yang berbeda (konfigurasi eksplisit menonaktifkan penemuan otomatis, jadi definisikan model secara manual):

```json5
{
  models: {
    providers: {
      ollama: {
        apiKey: "ollama-local",
        baseUrl: "http://ollama-host:11434", // Tanpa /v1 - gunakan URL API Ollama native
        api: "ollama", // Setel secara eksplisit untuk menjamin perilaku tool-calling native
      },
    },
  },
}
```

<Warning>
Jangan tambahkan `/v1` ke URL. Path `/v1` menggunakan mode yang kompatibel dengan OpenAI, di mana tool calling tidak andal. Gunakan base URL Ollama tanpa sufiks path.
</Warning>

### Pemilihan model

Setelah dikonfigurasi, semua model Ollama Anda tersedia:

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "ollama/gpt-oss:20b",
        fallbacks: ["ollama/llama3.3", "ollama/qwen2.5-coder:32b"],
      },
    },
  },
}
```

## Model cloud

Model cloud memungkinkan Anda menjalankan model yang dihosting di cloud (misalnya `kimi-k2.5:cloud`, `minimax-m2.5:cloud`, `glm-5:cloud`) bersama model lokal Anda.

Untuk menggunakan model cloud, pilih mode **Cloud + Local** selama setup. Wizard akan memeriksa apakah Anda sudah masuk dan membuka alur login browser saat diperlukan. Jika autentikasi tidak dapat diverifikasi, wizard akan fallback ke default model lokal.

Anda juga dapat masuk langsung di [ollama.com/signin](https://ollama.com/signin).

## Ollama Web Search

OpenClaw juga mendukung **Ollama Web Search** sebagai provider `web_search`
bawaan.

- Ini menggunakan host Ollama yang Anda konfigurasi (`models.providers.ollama.baseUrl` saat
  disetel, jika tidak `http://127.0.0.1:11434`).
- Ini tidak memerlukan key.
- Ini mengharuskan Ollama berjalan dan sudah masuk dengan `ollama signin`.

Pilih **Ollama Web Search** saat `openclaw onboard` atau
`openclaw configure --section web`, atau setel:

```json5
{
  tools: {
    web: {
      search: {
        provider: "ollama",
      },
    },
  },
}
```

Untuk detail setup dan perilaku lengkap, lihat [Ollama Web Search](/tools/ollama-search).

## Lanjutan

### Model reasoning

OpenClaw memperlakukan model dengan nama seperti `deepseek-r1`, `reasoning`, atau `think` sebagai model yang mendukung reasoning secara default:

```bash
ollama pull deepseek-r1:32b
```

### Biaya model

Ollama gratis dan berjalan secara lokal, sehingga semua biaya model disetel ke $0.

### Konfigurasi streaming

Integrasi Ollama di OpenClaw menggunakan **API Ollama native** (`/api/chat`) secara default, yang sepenuhnya mendukung streaming dan tool calling secara bersamaan. Tidak diperlukan konfigurasi khusus.

#### Mode kompatibel dengan OpenAI lama

<Warning>
**Tool calling tidak andal dalam mode kompatibel dengan OpenAI.** Gunakan mode ini hanya jika Anda memerlukan format OpenAI untuk proxy dan tidak bergantung pada perilaku tool calling native.
</Warning>

Jika Anda perlu menggunakan endpoint yang kompatibel dengan OpenAI sebagai gantinya (misalnya, di balik proxy yang hanya mendukung format OpenAI), setel `api: "openai-completions"` secara eksplisit:

```json5
{
  models: {
    providers: {
      ollama: {
        baseUrl: "http://ollama-host:11434/v1",
        api: "openai-completions",
        injectNumCtxForOpenAICompat: true, // default: true
        apiKey: "ollama-local",
        models: [...]
      }
    }
  }
}
```

Mode ini mungkin tidak mendukung streaming + tool calling secara bersamaan. Anda mungkin perlu menonaktifkan streaming dengan `params: { streaming: false }` di konfigurasi model.

Saat `api: "openai-completions"` digunakan dengan Ollama, OpenClaw secara default menyisipkan `options.num_ctx` agar Ollama tidak diam-diam fallback ke context window 4096. Jika proxy/upstream Anda menolak field `options` yang tidak dikenal, nonaktifkan perilaku ini:

```json5
{
  models: {
    providers: {
      ollama: {
        baseUrl: "http://ollama-host:11434/v1",
        api: "openai-completions",
        injectNumCtxForOpenAICompat: false,
        apiKey: "ollama-local",
        models: [...]
      }
    }
  }
}
```

### Context window

Untuk model yang ditemukan otomatis, OpenClaw menggunakan context window yang dilaporkan oleh Ollama saat tersedia, jika tidak maka akan fallback ke context window Ollama default yang digunakan oleh OpenClaw. Anda dapat menimpa `contextWindow` dan `maxTokens` dalam konfigurasi provider eksplisit.

## Pemecahan masalah

### Ollama tidak terdeteksi

Pastikan Ollama sedang berjalan dan Anda sudah menyetel `OLLAMA_API_KEY` (atau auth profile), serta Anda **tidak** mendefinisikan entri `models.providers.ollama` secara eksplisit:

```bash
ollama serve
```

Dan pastikan API dapat diakses:

```bash
curl http://localhost:11434/api/tags
```

### Tidak ada model yang tersedia

Jika model Anda tidak tercantum, lakukan salah satu dari berikut:

- Lakukan pull model secara lokal, atau
- Definisikan model secara eksplisit di `models.providers.ollama`.

Untuk menambahkan model:

```bash
ollama list  # Lihat apa yang terinstal
ollama pull glm-4.7-flash
ollama pull gpt-oss:20b
ollama pull llama3.3     # Atau model lain
```

### Koneksi ditolak

Periksa bahwa Ollama berjalan di port yang benar:

```bash
# Periksa apakah Ollama sedang berjalan
ps aux | grep ollama

# Atau mulai ulang Ollama
ollama serve
```

## Lihat juga

- [Model Providers](/id/concepts/model-providers) - Ikhtisar semua provider
- [Model Selection](/id/concepts/models) - Cara memilih model
- [Configuration](/id/gateway/configuration) - Referensi konfigurasi lengkap
