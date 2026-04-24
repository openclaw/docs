---
read_when:
    - Anda ingin menjalankan OpenClaw terhadap server SGLang lokal
    - Anda menginginkan endpoint `/v1` yang kompatibel dengan OpenAI dengan model Anda sendiri
summary: Jalankan OpenClaw dengan SGLang (server self-hosted yang kompatibel dengan OpenAI)
title: SGLang
x-i18n:
    generated_at: "2026-04-24T09:24:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8ed6767f85bcf099fb25dfe72a48b8a09e04ba13212125651616d2d93607beba
    source_path: providers/sglang.md
    workflow: 15
---

SGLang dapat menyajikan model open-source melalui API HTTP **yang kompatibel dengan OpenAI**.
OpenClaw dapat terhubung ke SGLang menggunakan API `openai-completions`.

OpenClaw juga dapat **menemukan otomatis** model yang tersedia dari SGLang saat Anda memilih
ikut serta dengan `SGLANG_API_KEY` (nilai apa pun berfungsi jika server Anda tidak memberlakukan autentikasi)
dan Anda tidak mendefinisikan entri `models.providers.sglang` secara eksplisit.

OpenClaw memperlakukan `sglang` sebagai provider lokal yang kompatibel dengan OpenAI dan mendukung
akuntansi penggunaan streaming, sehingga jumlah token status/konteks dapat diperbarui dari
respons `stream_options.include_usage`.

## Memulai

<Steps>
  <Step title="Mulai SGLang">
    Jalankan SGLang dengan server yang kompatibel dengan OpenAI. Base URL Anda harus mengekspos
    endpoint `/v1` (misalnya `/v1/models`, `/v1/chat/completions`). SGLang
    umumnya berjalan di:

    - `http://127.0.0.1:30000/v1`

  </Step>
  <Step title="Tetapkan API key">
    Nilai apa pun berfungsi jika tidak ada autentikasi yang dikonfigurasi pada server Anda:

    ```bash
    export SGLANG_API_KEY="sglang-local"
    ```

  </Step>
  <Step title="Jalankan onboarding atau tetapkan model secara langsung">
    ```bash
    openclaw onboard
    ```

    Atau konfigurasikan model secara manual:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "sglang/your-model-id" },
        },
      },
    }
    ```

  </Step>
</Steps>

## Penemuan model (provider implisit)

Saat `SGLANG_API_KEY` ditetapkan (atau profil autentikasi tersedia) dan Anda **tidak**
mendefinisikan `models.providers.sglang`, OpenClaw akan melakukan kueri ke:

- `GET http://127.0.0.1:30000/v1/models`

dan mengubah ID yang dikembalikan menjadi entri model.

<Note>
Jika Anda menetapkan `models.providers.sglang` secara eksplisit, penemuan otomatis akan dilewati dan
Anda harus mendefinisikan model secara manual.
</Note>

## Konfigurasi eksplisit (model manual)

Gunakan konfigurasi eksplisit saat:

- SGLang berjalan di host/port yang berbeda.
- Anda ingin menetapkan nilai `contextWindow`/`maxTokens`.
- Server Anda memerlukan API key yang sebenarnya (atau Anda ingin mengontrol header).

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
            name: "Model SGLang Lokal",
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

## Konfigurasi lanjutan

<AccordionGroup>
  <Accordion title="Perilaku bergaya proxy">
    SGLang diperlakukan sebagai backend `/v1` bergaya proxy yang kompatibel dengan OpenAI, bukan
    endpoint OpenAI native.

    | Perilaku | SGLang |
    |----------|--------|
    | Pembentukan permintaan khusus OpenAI | Tidak diterapkan |
    | `service_tier`, `store` pada Responses, petunjuk prompt-cache | Tidak dikirim |
    | Pembentukan payload kompatibilitas reasoning | Tidak diterapkan |
    | Header atribusi tersembunyi (`originator`, `version`, `User-Agent`) | Tidak disisipkan pada base URL SGLang kustom |

  </Accordion>

  <Accordion title="Pemecahan masalah">
    **Server tidak dapat dijangkau**

    Verifikasi bahwa server berjalan dan merespons:

    ```bash
    curl http://127.0.0.1:30000/v1/models
    ```

    **Kesalahan autentikasi**

    Jika permintaan gagal dengan kesalahan autentikasi, tetapkan `SGLANG_API_KEY` yang sesuai
    dengan konfigurasi server Anda, atau konfigurasikan provider secara eksplisit di bawah
    `models.providers.sglang`.

    <Tip>
    Jika Anda menjalankan SGLang tanpa autentikasi, nilai apa pun yang tidak kosong untuk
    `SGLANG_API_KEY` sudah cukup untuk ikut serta dalam penemuan model.
    </Tip>

  </Accordion>
</AccordionGroup>

## Terkait

<CardGroup cols={2}>
  <Card title="Pemilihan model" href="/id/concepts/model-providers" icon="layers">
    Memilih provider, referensi model, dan perilaku failover.
  </Card>
  <Card title="Referensi konfigurasi" href="/id/gateway/configuration-reference" icon="gear">
    Skema konfigurasi lengkap termasuk entri provider.
  </Card>
</CardGroup>
