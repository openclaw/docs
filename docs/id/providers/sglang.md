---
read_when:
    - Anda ingin menjalankan OpenClaw terhadap server SGLang lokal
    - Anda menginginkan endpoint `/v1` yang kompatibel dengan OpenAI dengan model milik Anda sendiri
summary: Jalankan OpenClaw dengan SGLang (server self-hosted yang kompatibel dengan OpenAI)
title: SGLang
x-i18n:
    generated_at: "2026-04-05T14:04:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9850277c6c5e318e60237688b4d8a5b1387d4e9586534ae2eb6ad953abba8948
    source_path: providers/sglang.md
    workflow: 15
---

# SGLang

SGLang dapat menyajikan model open-source melalui API HTTP **yang kompatibel dengan OpenAI**.
OpenClaw dapat terhubung ke SGLang menggunakan API `openai-completions`.

OpenClaw juga dapat **menemukan secara otomatis** model yang tersedia dari SGLang saat Anda memilih
ikut serta dengan `SGLANG_API_KEY` (nilai apa pun berfungsi jika server Anda tidak menegakkan auth)
dan Anda tidak mendefinisikan entri `models.providers.sglang` yang eksplisit.

## Mulai cepat

1. Mulai SGLang dengan server yang kompatibel dengan OpenAI.

Base URL Anda harus mengekspos endpoint `/v1` (misalnya `/v1/models`,
`/v1/chat/completions`). SGLang umumnya berjalan di:

- `http://127.0.0.1:30000/v1`

2. Ikut serta (nilai apa pun berfungsi jika tidak ada auth yang dikonfigurasi):

```bash
export SGLANG_API_KEY="sglang-local"
```

3. Jalankan onboarding dan pilih `SGLang`, atau set model secara langsung:

```bash
openclaw onboard
```

```json5
{
  agents: {
    defaults: {
      model: { primary: "sglang/your-model-id" },
    },
  },
}
```

## Penemuan model (provider implisit)

Saat `SGLANG_API_KEY` disetel (atau auth profile ada) dan Anda **tidak**
mendefinisikan `models.providers.sglang`, OpenClaw akan menanyakan:

- `GET http://127.0.0.1:30000/v1/models`

dan mengubah ID yang dikembalikan menjadi entri model.

Jika Anda menyetel `models.providers.sglang` secara eksplisit, penemuan otomatis dilewati dan
Anda harus mendefinisikan model secara manual.

## Konfigurasi eksplisit (model manual)

Gunakan config eksplisit saat:

- SGLang berjalan di host/port yang berbeda.
- Anda ingin mematok nilai `contextWindow`/`maxTokens`.
- Server Anda memerlukan API key sungguhan (atau Anda ingin mengontrol header).

```json5
{
  models: {
    providers: {
      sglang: {
        baseUrl: "http://127.0.0.1:30000/v1",
        apiKey: "${SGLANG_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "your-model-id",
            name: "Local SGLang Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

## Pemecahan masalah

- Periksa bahwa server dapat dijangkau:

```bash
curl http://127.0.0.1:30000/v1/models
```

- Jika permintaan gagal dengan error auth, set `SGLANG_API_KEY` sungguhan yang cocok
  dengan konfigurasi server Anda, atau konfigurasikan provider secara eksplisit di bawah
  `models.providers.sglang`.

## Perilaku bergaya proxy

SGLang diperlakukan sebagai backend `/v1` yang kompatibel dengan OpenAI bergaya proxy, bukan
endpoint OpenAI native.

- pembentukan permintaan khusus OpenAI native tidak berlaku di sini
- tidak ada `service_tier`, tidak ada `store` pada Responses, tidak ada prompt-cache hints, dan tidak ada pembentukan payload kompatibilitas reasoning OpenAI
- header atribusi OpenClaw tersembunyi (`originator`, `version`, `User-Agent`)
  tidak diinjeksi pada base URL SGLang kustom
