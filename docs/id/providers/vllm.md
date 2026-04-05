---
read_when:
    - Anda ingin menjalankan OpenClaw dengan server vLLM lokal
    - Anda ingin endpoint `/v1` yang kompatibel dengan OpenAI dengan model Anda sendiri
summary: Jalankan OpenClaw dengan vLLM (server lokal yang kompatibel dengan OpenAI)
title: vLLM
x-i18n:
    generated_at: "2026-04-05T14:04:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: ebde34d0453586d10340680b8d51465fdc98bd28e8a96acfaeb24606886b50f4
    source_path: providers/vllm.md
    workflow: 15
---

# vLLM

vLLM dapat menyajikan model open-source (dan beberapa model kustom) melalui API HTTP **yang kompatibel dengan OpenAI**. OpenClaw dapat terhubung ke vLLM menggunakan API `openai-completions`.

OpenClaw juga dapat **menemukan secara otomatis** model yang tersedia dari vLLM ketika Anda ikut serta dengan `VLLM_API_KEY` (nilai apa pun berfungsi jika server Anda tidak menerapkan autentikasi) dan Anda tidak menentukan entri `models.providers.vllm` secara eksplisit.

## Mulai cepat

1. Jalankan vLLM dengan server yang kompatibel dengan OpenAI.

URL dasar Anda harus mengekspos endpoint `/v1` (misalnya `/v1/models`, `/v1/chat/completions`). vLLM biasanya berjalan di:

- `http://127.0.0.1:8000/v1`

2. Ikut serta (nilai apa pun berfungsi jika tidak ada autentikasi yang dikonfigurasi):

```bash
export VLLM_API_KEY="vllm-local"
```

3. Pilih model (ganti dengan salah satu ID model vLLM Anda):

```json5
{
  agents: {
    defaults: {
      model: { primary: "vllm/your-model-id" },
    },
  },
}
```

## Penemuan model (penyedia implisit)

Saat `VLLM_API_KEY` ditetapkan (atau profil autentikasi tersedia) dan Anda **tidak** menentukan `models.providers.vllm`, OpenClaw akan memanggil:

- `GET http://127.0.0.1:8000/v1/models`

…dan mengonversi ID yang dikembalikan menjadi entri model.

Jika Anda menetapkan `models.providers.vllm` secara eksplisit, penemuan otomatis dilewati dan Anda harus menentukan model secara manual.

## Konfigurasi eksplisit (model manual)

Gunakan konfigurasi eksplisit ketika:

- vLLM berjalan pada host/port yang berbeda.
- Anda ingin menetapkan nilai `contextWindow`/`maxTokens`.
- Server Anda memerlukan API key yang nyata (atau Anda ingin mengontrol header).

```json5
{
  models: {
    providers: {
      vllm: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "${VLLM_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "your-model-id",
            name: "Local vLLM Model",
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

- Periksa apakah server dapat dijangkau:

```bash
curl http://127.0.0.1:8000/v1/models
```

- Jika permintaan gagal dengan kesalahan autentikasi, tetapkan `VLLM_API_KEY` yang nyata dan sesuai dengan konfigurasi server Anda, atau konfigurasikan penyedia secara eksplisit di bawah `models.providers.vllm`.

## Perilaku gaya proksi

vLLM diperlakukan sebagai backend `/v1` yang kompatibel dengan OpenAI bergaya proksi, bukan endpoint OpenAI native.

- pembentukan permintaan khusus OpenAI native tidak berlaku di sini
- tidak ada `service_tier`, tidak ada Responses `store`, tidak ada petunjuk prompt-cache, dan tidak ada pembentukan payload kompatibilitas reasoning OpenAI
- header atribusi OpenClaw tersembunyi (`originator`, `version`, `User-Agent`) tidak disisipkan pada URL dasar vLLM kustom
