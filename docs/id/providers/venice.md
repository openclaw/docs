---
read_when:
    - Anda menginginkan inferensi yang berfokus pada privasi di OpenClaw
    - Anda menginginkan panduan penyiapan Venice AI
summary: Gunakan model Venice AI yang berfokus pada privasi di OpenClaw
title: Venice AI
x-i18n:
    generated_at: "2026-04-05T14:05:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 53313e45e197880feb7e90764ee8fd6bb7f5fd4fe03af46b594201c77fbc8eab
    source_path: providers/venice.md
    workflow: 15
---

# Venice AI (sorotan Venice)

**Venice** adalah sorotan kami untuk penyiapan Venice bagi inferensi yang mengutamakan privasi dengan akses anonim opsional ke model proprietari.

Venice AI menyediakan inferensi AI yang berfokus pada privasi dengan dukungan untuk model tanpa sensor dan akses ke model proprietari utama melalui proksi anonim mereka. Semua inferensi bersifat privat secara default—tidak ada pelatihan pada data Anda, tidak ada pencatatan log.

## Mengapa Venice di OpenClaw

- **Inferensi privat** untuk model open-source (tanpa log).
- **Model tanpa sensor** saat Anda membutuhkannya.
- **Akses anonim** ke model proprietari (Opus/GPT/Gemini) saat kualitas menjadi prioritas.
- Endpoint `/v1` yang kompatibel dengan OpenAI.

## Mode Privasi

Venice menawarkan dua tingkat privasi — memahami hal ini penting untuk memilih model Anda:

| Mode           | Deskripsi                                                                                                                        | Model                                                         |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| **Privat**     | Sepenuhnya privat. Prompt/respons **tidak pernah disimpan atau dicatat**. Sementara.                                             | Llama, Qwen, DeepSeek, Kimi, MiniMax, Venice Uncensored, dll. |
| **Anonim**     | Diproksikan melalui Venice dengan metadata dihapus. Penyedia yang mendasarinya (OpenAI, Anthropic, Google, xAI) melihat permintaan yang dianonimkan. | Claude, GPT, Gemini, Grok                                     |

## Fitur

- **Berfokus pada privasi**: Pilih antara mode "private" (sepenuhnya privat) dan "anonymized" (diproksikan)
- **Model tanpa sensor**: Akses ke model tanpa pembatasan konten
- **Akses model utama**: Gunakan Claude, GPT, Gemini, dan Grok melalui proksi anonim Venice
- **API kompatibel dengan OpenAI**: Endpoint `/v1` standar untuk integrasi yang mudah
- **Streaming**: ✅ Didukung di semua model
- **Pemanggilan fungsi**: ✅ Didukung pada model tertentu (periksa kapabilitas model)
- **Vision**: ✅ Didukung pada model dengan kemampuan vision
- **Tanpa batas laju yang ketat**: Pembatasan fair-use dapat berlaku untuk penggunaan ekstrem

## Penyiapan

### 1. Dapatkan Kunci API

1. Daftar di [venice.ai](https://venice.ai)
2. Buka **Settings → API Keys → Create new key**
3. Salin kunci API Anda (format: `vapi_xxxxxxxxxxxx`)

### 2. Konfigurasikan OpenClaw

**Opsi A: Variabel Lingkungan**

```bash
export VENICE_API_KEY="vapi_xxxxxxxxxxxx"
```

**Opsi B: Penyiapan Interaktif (Direkomendasikan)**

```bash
openclaw onboard --auth-choice venice-api-key
```

Ini akan:

1. Meminta kunci API Anda (atau menggunakan `VENICE_API_KEY` yang ada)
2. Menampilkan semua model Venice yang tersedia
3. Memungkinkan Anda memilih model default
4. Mengonfigurasi penyedia secara otomatis

**Opsi C: Non-interaktif**

```bash
openclaw onboard --non-interactive \
  --auth-choice venice-api-key \
  --venice-api-key "vapi_xxxxxxxxxxxx"
```

### 3. Verifikasi Penyiapan

```bash
openclaw agent --model venice/kimi-k2-5 --message "Hello, are you working?"
```

## Pemilihan Model

Setelah penyiapan, OpenClaw menampilkan semua model Venice yang tersedia. Pilih berdasarkan kebutuhan Anda:

- **Model default**: `venice/kimi-k2-5` untuk penalaran privat yang kuat plus vision.
- **Opsi berkapabilitas tinggi**: `venice/claude-opus-4-6` untuk jalur Venice anonim terkuat.
- **Privasi**: Pilih model "private" untuk inferensi yang sepenuhnya privat.
- **Kapabilitas**: Pilih model "anonymized" untuk mengakses Claude, GPT, Gemini melalui proksi Venice.

Ubah model default Anda kapan saja:

```bash
openclaw models set venice/kimi-k2-5
openclaw models set venice/claude-opus-4-6
```

Tampilkan semua model yang tersedia:

```bash
openclaw models list | grep venice
```

## Konfigurasikan melalui `openclaw configure`

1. Jalankan `openclaw configure`
2. Pilih **Model/auth**
3. Pilih **Venice AI**

## Model Mana yang Sebaiknya Saya Gunakan?

| Kasus Penggunaan           | Model yang Direkomendasikan      | Alasan                                      |
| -------------------------- | -------------------------------- | ------------------------------------------- |
| **Obrolan umum (default)** | `kimi-k2-5`                      | Penalaran privat yang kuat plus vision      |
| **Kualitas keseluruhan terbaik** | `claude-opus-4-6`          | Opsi Venice anonim terkuat                  |
| **Privasi + coding**       | `qwen3-coder-480b-a35b-instruct` | Model coding privat dengan konteks besar    |
| **Vision privat**          | `kimi-k2-5`                      | Dukungan vision tanpa keluar dari mode privat |
| **Cepat + murah**          | `qwen3-4b`                       | Model penalaran ringan                      |
| **Tugas privat kompleks**  | `deepseek-v3.2`                  | Penalaran kuat, tetapi tanpa dukungan tool Venice |
| **Tanpa sensor**           | `venice-uncensored`              | Tanpa pembatasan konten                     |

## Model yang Tersedia (Total 41)

### Model Privat (26) - Sepenuhnya Privat, Tanpa Log

| ID Model                               | Nama                                | Konteks | Fitur                      |
| -------------------------------------- | ----------------------------------- | ------- | -------------------------- |
| `kimi-k2-5`                            | Kimi K2.5                           | 256k    | Default, penalaran, vision |
| `kimi-k2-thinking`                     | Kimi K2 Thinking                    | 256k    | Penalaran                  |
| `llama-3.3-70b`                        | Llama 3.3 70B                       | 128k    | Umum                       |
| `llama-3.2-3b`                         | Llama 3.2 3B                        | 128k    | Umum                       |
| `hermes-3-llama-3.1-405b`              | Hermes 3 Llama 3.1 405B             | 128k    | Umum, tool dinonaktifkan   |
| `qwen3-235b-a22b-thinking-2507`        | Qwen3 235B Thinking                 | 128k    | Penalaran                  |
| `qwen3-235b-a22b-instruct-2507`        | Qwen3 235B Instruct                 | 128k    | Umum                       |
| `qwen3-coder-480b-a35b-instruct`       | Qwen3 Coder 480B                    | 256k    | Coding                     |
| `qwen3-coder-480b-a35b-instruct-turbo` | Qwen3 Coder 480B Turbo              | 256k    | Coding                     |
| `qwen3-5-35b-a3b`                      | Qwen3.5 35B A3B                     | 256k    | Penalaran, vision          |
| `qwen3-next-80b`                       | Qwen3 Next 80B                      | 256k    | Umum                       |
| `qwen3-vl-235b-a22b`                   | Qwen3 VL 235B (Vision)              | 256k    | Vision                     |
| `qwen3-4b`                             | Venice Small (Qwen3 4B)             | 32k     | Cepat, penalaran           |
| `deepseek-v3.2`                        | DeepSeek V3.2                       | 160k    | Penalaran, tool dinonaktifkan |
| `venice-uncensored`                    | Venice Uncensored (Dolphin-Mistral) | 32k     | Tanpa sensor, tool dinonaktifkan |
| `mistral-31-24b`                       | Venice Medium (Mistral)             | 128k    | Vision                     |
| `google-gemma-3-27b-it`                | Google Gemma 3 27B Instruct         | 198k    | Vision                     |
| `openai-gpt-oss-120b`                  | OpenAI GPT OSS 120B                 | 128k    | Umum                       |
| `nvidia-nemotron-3-nano-30b-a3b`       | NVIDIA Nemotron 3 Nano 30B          | 128k    | Umum                       |
| `olafangensan-glm-4.7-flash-heretic`   | GLM 4.7 Flash Heretic               | 128k    | Penalaran                  |
| `zai-org-glm-4.6`                      | GLM 4.6                             | 198k    | Umum                       |
| `zai-org-glm-4.7`                      | GLM 4.7                             | 198k    | Penalaran                  |
| `zai-org-glm-4.7-flash`                | GLM 4.7 Flash                       | 128k    | Penalaran                  |
| `zai-org-glm-5`                        | GLM 5                               | 198k    | Penalaran                  |
| `minimax-m21`                          | MiniMax M2.1                        | 198k    | Penalaran                  |
| `minimax-m25`                          | MiniMax M2.5                        | 198k    | Penalaran                  |

### Model Anonim (15) - Melalui Proksi Venice

| ID Model                        | Nama                           | Konteks | Fitur                     |
| ------------------------------- | ------------------------------ | ------- | ------------------------- |
| `claude-opus-4-6`               | Claude Opus 4.6 (via Venice)   | 1M      | Penalaran, vision         |
| `claude-opus-4-5`               | Claude Opus 4.5 (via Venice)   | 198k    | Penalaran, vision         |
| `claude-sonnet-4-6`             | Claude Sonnet 4.6 (via Venice) | 1M      | Penalaran, vision         |
| `claude-sonnet-4-5`             | Claude Sonnet 4.5 (via Venice) | 198k    | Penalaran, vision         |
| `openai-gpt-54`                 | GPT-5.4 (via Venice)           | 1M      | Penalaran, vision         |
| `openai-gpt-53-codex`           | GPT-5.3 Codex (via Venice)     | 400k    | Penalaran, vision, coding |
| `openai-gpt-52`                 | GPT-5.2 (via Venice)           | 256k    | Penalaran                 |
| `openai-gpt-52-codex`           | GPT-5.2 Codex (via Venice)     | 256k    | Penalaran, vision, coding |
| `openai-gpt-4o-2024-11-20`      | GPT-4o (via Venice)            | 128k    | Vision                    |
| `openai-gpt-4o-mini-2024-07-18` | GPT-4o Mini (via Venice)       | 128k    | Vision                    |
| `gemini-3-1-pro-preview`        | Gemini 3.1 Pro (via Venice)    | 1M      | Penalaran, vision         |
| `gemini-3-pro-preview`          | Gemini 3 Pro (via Venice)      | 198k    | Penalaran, vision         |
| `gemini-3-flash-preview`        | Gemini 3 Flash (via Venice)    | 256k    | Penalaran, vision         |
| `grok-41-fast`                  | Grok 4.1 Fast (via Venice)     | 1M      | Penalaran, vision         |
| `grok-code-fast-1`              | Grok Code Fast 1 (via Venice)  | 256k    | Penalaran, coding         |

## Penemuan Model

OpenClaw secara otomatis menemukan model dari API Venice saat `VENICE_API_KEY` ditetapkan. Jika API tidak dapat dijangkau, OpenClaw akan kembali ke katalog statis.

Endpoint `/models` bersifat publik (tidak perlu autentikasi untuk menampilkan daftar), tetapi inferensi memerlukan kunci API yang valid.

## Dukungan Streaming & Tool

| Fitur                | Dukungan                                                |
| -------------------- | ------------------------------------------------------- |
| **Streaming**        | ✅ Semua model                                          |
| **Function calling** | ✅ Sebagian besar model (periksa `supportsFunctionCalling` di API) |
| **Vision/Images**    | ✅ Model yang ditandai dengan fitur "Vision"            |
| **JSON mode**        | ✅ Didukung melalui `response_format`                   |

## Harga

Venice menggunakan sistem berbasis kredit. Periksa [venice.ai/pricing](https://venice.ai/pricing) untuk tarif terbaru:

- **Model privat**: Umumnya berbiaya lebih rendah
- **Model anonim**: Mirip dengan harga API langsung + biaya kecil Venice

## Perbandingan: Venice vs API Langsung

| Aspek        | Venice (Anonim)                | API Langsung         |
| ------------ | ------------------------------ | -------------------- |
| **Privasi**  | Metadata dihapus, anonim       | Akun Anda tertaut    |
| **Latensi**  | +10-50ms (proksi)              | Langsung             |
| **Fitur**    | Sebagian besar fitur didukung  | Fitur lengkap        |
| **Penagihan**| Kredit Venice                  | Penagihan penyedia   |

## Contoh Penggunaan

```bash
# Gunakan model privat default
openclaw agent --model venice/kimi-k2-5 --message "Quick health check"

# Gunakan Claude Opus melalui Venice (anonim)
openclaw agent --model venice/claude-opus-4-6 --message "Summarize this task"

# Gunakan model tanpa sensor
openclaw agent --model venice/venice-uncensored --message "Draft options"

# Gunakan model vision dengan gambar
openclaw agent --model venice/qwen3-vl-235b-a22b --message "Review attached image"

# Gunakan model coding
openclaw agent --model venice/qwen3-coder-480b-a35b-instruct --message "Refactor this function"
```

## Pemecahan Masalah

### Kunci API tidak dikenali

```bash
echo $VENICE_API_KEY
openclaw models list | grep venice
```

Pastikan kunci dimulai dengan `vapi_`.

### Model tidak tersedia

Katalog model Venice diperbarui secara dinamis. Jalankan `openclaw models list` untuk melihat model yang saat ini tersedia. Beberapa model mungkin sedang offline sementara.

### Masalah koneksi

API Venice berada di `https://api.venice.ai/api/v1`. Pastikan jaringan Anda mengizinkan koneksi HTTPS.

## Contoh file konfigurasi

```json5
{
  env: { VENICE_API_KEY: "vapi_..." },
  agents: { defaults: { model: { primary: "venice/kimi-k2-5" } } },
  models: {
    mode: "merge",
    providers: {
      venice: {
        baseUrl: "https://api.venice.ai/api/v1",
        apiKey: "${VENICE_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "kimi-k2-5",
            name: "Kimi K2.5",
            reasoning: true,
            input: ["text", "image"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 256000,
            maxTokens: 65536,
          },
        ],
      },
    },
  },
}
```

## Tautan

- [Venice AI](https://venice.ai)
- [Dokumentasi API](https://docs.venice.ai)
- [Harga](https://venice.ai/pricing)
- [Status](https://status.venice.ai)
