---
read_when:
    - Anda ingin menjalankan OpenClaw dengan model cloud atau lokal melalui Ollama
    - Anda memerlukan panduan penyiapan dan konfigurasi Ollama
summary: Jalankan OpenClaw dengan Ollama (model cloud dan lokal)
title: Ollama
x-i18n:
    generated_at: "2026-04-08T02:17:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 222ec68f7d4bb29cc7796559ddef1d5059f5159e7a51e2baa3a271ddb3abb716
    source_path: providers/ollama.md
    workflow: 15
---

# Ollama

Ollama adalah runtime LLM lokal yang memudahkan menjalankan model open-source di mesin Anda. OpenClaw terintegrasi dengan API native Ollama (`/api/chat`), mendukung streaming dan pemanggilan tool, serta dapat menemukan model Ollama lokal secara otomatis saat Anda memilih ikut serta dengan `OLLAMA_API_KEY` (atau profil auth) dan tidak mendefinisikan entri `models.providers.ollama` secara eksplisit.

<Warning>
**Pengguna Ollama jarak jauh**: Jangan gunakan URL kompatibel OpenAI `/v1` (`http://host:11434/v1`) dengan OpenClaw. Ini merusak pemanggilan tool dan model dapat menghasilkan JSON tool mentah sebagai teks biasa. Gunakan URL API native Ollama sebagai gantinya: `baseUrl: "http://host:11434"` (tanpa `/v1`).
</Warning>

## Mulai cepat

### Onboarding (disarankan)

Cara tercepat untuk menyiapkan Ollama adalah melalui onboarding:

```bash
openclaw onboard
```

Pilih **Ollama** dari daftar provider. Onboarding akan:

1. Menanyakan base URL Ollama tempat instance Anda dapat diakses (default `http://127.0.0.1:11434`).
2. Memungkinkan Anda memilih **Cloud + Local** (model cloud dan model lokal) atau **Local** (hanya model lokal).
3. Membuka alur login di browser jika Anda memilih **Cloud + Local** dan belum masuk ke ollama.com.
4. Menemukan model yang tersedia dan menyarankan default.
5. Menarik model yang dipilih secara otomatis jika model tersebut belum tersedia secara lokal.

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

### Penyiapan manual

1. Instal Ollama: [https://ollama.com/download](https://ollama.com/download)

2. Tarik model lokal jika Anda menginginkan inferensi lokal:

```bash
ollama pull gemma4
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
- Model cloud seperti `kimi-k2.5:cloud`, `minimax-m2.7:cloud`, dan `glm-5.1:cloud` **tidak** memerlukan `ollama pull` lokal

OpenClaw saat ini menyarankan:

- default lokal: `gemma4`
- default cloud: `kimi-k2.5:cloud`, `minimax-m2.7:cloud`, `glm-5.1:cloud`

5. Jika Anda lebih memilih penyiapan manual, aktifkan Ollama untuk OpenClaw secara langsung (nilai apa pun berfungsi; Ollama tidak memerlukan key nyata):

```bash
# Set environment variable
export OLLAMA_API_KEY="ollama-local"

# Atau konfigurasi di file config Anda
openclaw config set models.providers.ollama.apiKey "ollama-local"
```

6. Periksa atau ganti model:

```bash
openclaw models list
openclaw models set ollama/gemma4
```

7. Atau tetapkan default di config:

```json5
{
  agents: {
    defaults: {
      model: { primary: "ollama/gemma4" },
    },
  },
}
```

## Penemuan model (provider implisit)

Saat Anda menetapkan `OLLAMA_API_KEY` (atau profil auth) dan **tidak** mendefinisikan `models.providers.ollama`, OpenClaw menemukan model dari instance Ollama lokal di `http://127.0.0.1:11434`:

- Mengueri `/api/tags`
- Menggunakan lookup `/api/show` dengan upaya terbaik untuk membaca `contextWindow` bila tersedia
- Menandai `reasoning` dengan heuristik nama model (`r1`, `reasoning`, `think`)
- Menetapkan `maxTokens` ke batas maksimum token Ollama default yang digunakan oleh OpenClaw
- Menetapkan semua biaya ke `0`

Ini menghindari entri model manual sambil menjaga katalog tetap selaras dengan instance Ollama lokal.

Untuk melihat model apa saja yang tersedia:

```bash
ollama list
openclaw models list
```

Untuk menambahkan model baru, cukup tarik model dengan Ollama:

```bash
ollama pull mistral
```

Model baru akan ditemukan secara otomatis dan tersedia untuk digunakan.

Jika Anda menetapkan `models.providers.ollama` secara eksplisit, penemuan otomatis dilewati dan Anda harus mendefinisikan model secara manual (lihat di bawah).

## Konfigurasi

### Penyiapan dasar (penemuan implisit)

Cara paling sederhana untuk mengaktifkan Ollama adalah melalui environment variable:

```bash
export OLLAMA_API_KEY="ollama-local"
```

### Penyiapan eksplisit (model manual)

Gunakan config eksplisit saat:

- Ollama berjalan di host/port lain.
- Anda ingin memaksa context window atau daftar model tertentu.
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

Jika `OLLAMA_API_KEY` ditetapkan, Anda dapat menghilangkan `apiKey` dalam entri provider dan OpenClaw akan mengisinya untuk pemeriksaan ketersediaan.

### Base URL kustom (config eksplisit)

Jika Ollama berjalan di host atau port yang berbeda (config eksplisit menonaktifkan penemuan otomatis, jadi definisikan model secara manual):

```json5
{
  models: {
    providers: {
      ollama: {
        apiKey: "ollama-local",
        baseUrl: "http://ollama-host:11434", // No /v1 - use native Ollama API URL
        api: "ollama", // Set explicitly to guarantee native tool-calling behavior
      },
    },
  },
}
```

<Warning>
Jangan tambahkan `/v1` ke URL. Path `/v1` menggunakan mode kompatibel OpenAI, di mana pemanggilan tool tidak andal. Gunakan URL dasar Ollama tanpa sufiks path.
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

Model cloud memungkinkan Anda menjalankan model yang di-host di cloud (misalnya `kimi-k2.5:cloud`, `minimax-m2.7:cloud`, `glm-5.1:cloud`) berdampingan dengan model lokal Anda.

Untuk menggunakan model cloud, pilih mode **Cloud + Local** saat setup. Wizard memeriksa apakah Anda sudah masuk dan membuka alur login di browser bila diperlukan. Jika autentikasi tidak dapat diverifikasi, wizard fallback ke default model lokal.

Anda juga dapat langsung masuk di [ollama.com/signin](https://ollama.com/signin).

## Ollama Web Search

OpenClaw juga mendukung **Ollama Web Search** sebagai provider
`web_search` terbundel.

- Ini menggunakan host Ollama yang Anda konfigurasi (`models.providers.ollama.baseUrl` jika
  ditetapkan, jika tidak `http://127.0.0.1:11434`).
- Ini tidak memerlukan key.
- Ini memerlukan Ollama berjalan dan sudah masuk dengan `ollama signin`.

Pilih **Ollama Web Search** saat `openclaw onboard` atau
`openclaw configure --section web`, atau tetapkan:

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

Untuk detail penyiapan lengkap dan perilakunya, lihat [Ollama Web Search](/id/tools/ollama-search).

## Lanjutan

### Model reasoning

OpenClaw memperlakukan model dengan nama seperti `deepseek-r1`, `reasoning`, atau `think` sebagai mampu reasoning secara default:

```bash
ollama pull deepseek-r1:32b
```

### Biaya model

Ollama gratis dan berjalan secara lokal, jadi semua biaya model ditetapkan ke $0.

### Konfigurasi streaming

Integrasi Ollama OpenClaw menggunakan **API native Ollama** (`/api/chat`) secara default, yang sepenuhnya mendukung streaming dan pemanggilan tool secara bersamaan. Tidak diperlukan konfigurasi khusus.

#### Mode Lama Kompatibel OpenAI

<Warning>
**Pemanggilan tool tidak andal dalam mode kompatibel OpenAI.** Gunakan mode ini hanya jika Anda memerlukan format OpenAI untuk proxy dan tidak bergantung pada perilaku pemanggilan tool native.
</Warning>

Jika Anda perlu menggunakan endpoint kompatibel OpenAI sebagai gantinya (misalnya, di balik proxy yang hanya mendukung format OpenAI), tetapkan `api: "openai-completions"` secara eksplisit:

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

Mode ini mungkin tidak mendukung streaming + pemanggilan tool secara bersamaan. Anda mungkin perlu menonaktifkan streaming dengan `params: { streaming: false }` dalam config model.

Saat `api: "openai-completions"` digunakan dengan Ollama, OpenClaw secara default menyuntikkan `options.num_ctx` agar Ollama tidak diam-diam fallback ke context window 4096. Jika proxy/upstream Anda menolak field `options` yang tidak dikenal, nonaktifkan perilaku ini:

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

Untuk model yang ditemukan secara otomatis, OpenClaw menggunakan context window yang dilaporkan oleh Ollama bila tersedia, jika tidak maka fallback ke context window Ollama default yang digunakan oleh OpenClaw. Anda dapat mengganti `contextWindow` dan `maxTokens` dalam config provider eksplisit.

## Pemecahan masalah

### Ollama tidak terdeteksi

Pastikan Ollama berjalan dan Anda menetapkan `OLLAMA_API_KEY` (atau profil auth), dan Anda **tidak** mendefinisikan entri `models.providers.ollama` secara eksplisit:

```bash
ollama serve
```

Dan pastikan API dapat diakses:

```bash
curl http://localhost:11434/api/tags
```

### Tidak ada model yang tersedia

Jika model Anda tidak tercantum, lakukan salah satu dari berikut ini:

- Tarik model secara lokal, atau
- Definisikan model secara eksplisit di `models.providers.ollama`.

Untuk menambahkan model:

```bash
ollama list  # Lihat apa yang terinstal
ollama pull gemma4
ollama pull gpt-oss:20b
ollama pull llama3.3     # Atau model lain
```

### Koneksi ditolak

Periksa bahwa Ollama berjalan di port yang benar:

```bash
# Check if Ollama is running
ps aux | grep ollama

# Or restart Ollama
ollama serve
```

## Lihat juga

- [Model Providers](/id/concepts/model-providers) - Ikhtisar semua provider
- [Model Selection](/id/concepts/models) - Cara memilih model
- [Configuration](/id/gateway/configuration) - Referensi config lengkap
