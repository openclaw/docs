---
read_when:
    - Anda ingin menjalankan OpenClaw dengan server SGLang lokal
    - Anda menginginkan endpoint /v1 yang kompatibel dengan OpenAI untuk model Anda sendiri
summary: Jalankan OpenClaw dengan SGLang (server yang dihosting sendiri dan kompatibel dengan OpenAI)
title: SGLang
x-i18n:
    generated_at: "2026-07-12T14:37:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54a7805315a7d65fdd2c7c9b6836aa2faccc88db7802cce0ba8c2d4a1aac9d65
    source_path: providers/sglang.md
    workflow: 16
---

SGLang menyajikan model berbobot terbuka melalui API HTTP yang kompatibel dengan OpenAI. OpenClaw terhubung ke SGLang menggunakan keluarga penyedia `openai-completions` dengan penemuan otomatis model yang tersedia.

| Properti                      | Nilai                                                               |
| ----------------------------- | ------------------------------------------------------------------- |
| ID penyedia                   | `sglang`                                                            |
| Plugin                        | bawaan, `enabledByDefault: true`                                    |
| Variabel lingkungan autentikasi | `SGLANG_API_KEY` (nilai apa pun yang tidak kosong jika server tidak menggunakan autentikasi) |
| Flag orientasi awal           | `--auth-choice sglang`                                              |
| API                           | Kompatibel dengan OpenAI (`openai-completions`)                     |
| URL dasar default             | `http://127.0.0.1:30000/v1`                                        |
| Placeholder model default     | `sglang/Qwen/Qwen3-8B`                                              |
| Penggunaan streaming          | Ya (`supportsStreamingUsage: true`)                                 |
| Harga                         | Ditandai gratis eksternal (`modelPricing.external: false`)          |

OpenClaw juga **menemukan secara otomatis** model yang tersedia dari SGLang saat Anda mengaktifkannya dengan `SGLANG_API_KEY`. Gunakan `sglang/*` di `agents.defaults.models` agar penemuan tetap dinamis ketika Anda juga mengonfigurasi URL dasar SGLang khusus. Lihat [Penemuan model (penyedia implisit)](#model-discovery-implicit-provider) di bawah.

## Memulai

<Steps>
  <Step title="Mulai SGLang">
    Jalankan SGLang dengan server yang kompatibel dengan OpenAI. URL dasar Anda harus menyediakan
    endpoint `/v1` (misalnya `/v1/models`, `/v1/chat/completions`). SGLang
    biasanya berjalan di:

    - `http://127.0.0.1:30000/v1`

  </Step>
  <Step title="Tetapkan kunci API">
    Nilai apa pun dapat digunakan jika autentikasi tidak dikonfigurasi pada server Anda:

    ```bash
    export SGLANG_API_KEY="sglang-local"
    ```

  </Step>
  <Step title="Jalankan orientasi awal atau tetapkan model secara langsung">
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

## Penemuan model (penyedia implisit)

Ketika `SGLANG_API_KEY` ditetapkan (atau profil autentikasi tersedia) dan Anda **tidak**
mendefinisikan `models.providers.sglang`, OpenClaw mengirim kueri ke:

- `GET http://127.0.0.1:30000/v1/models`

dan mengonversi ID yang dikembalikan menjadi entri model.

<Note>
Jika Anda menetapkan `models.providers.sglang` secara eksplisit, secara default OpenClaw menggunakan
model yang Anda deklarasikan. Tambahkan `"sglang/*": {}` ke `agents.defaults.models` ketika Anda
ingin OpenClaw mengirim kueri ke endpoint `/models` milik penyedia yang dikonfigurasi tersebut dan menyertakan
semua model SGLang yang diumumkan.
</Note>

## Konfigurasi eksplisit (model manual)

Gunakan konfigurasi eksplisit ketika:

- SGLang berjalan pada host/port yang berbeda.
- Anda ingin menetapkan nilai `contextWindow`/`maxTokens`.
- Server Anda memerlukan kunci API yang sebenarnya (atau Anda ingin mengontrol header).

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

## Konfigurasi lanjutan

<AccordionGroup>
  <Accordion title="Perilaku bergaya proksi">
    SGLang diperlakukan sebagai backend `/v1` bergaya proksi yang kompatibel dengan OpenAI, bukan
    endpoint OpenAI native.

    | Perilaku | SGLang |
    |----------|--------|
    | Pembentukan permintaan khusus OpenAI | Tidak diterapkan |
    | `service_tier`, `store` Responses, petunjuk cache prompt | Tidak dikirim |
    | Pembentukan payload kompatibilitas penalaran | Tidak diterapkan |
    | Header atribusi tersembunyi (`originator`, `version`, `User-Agent`) | Tidak disisipkan pada URL dasar SGLang khusus |

  </Accordion>

  <Accordion title="Pemecahan masalah">
    **Server tidak dapat dijangkau**

    Pastikan server berjalan dan merespons:

    ```bash
    curl http://127.0.0.1:30000/v1/models
    ```

    **Kesalahan autentikasi**

    Jika permintaan gagal karena kesalahan autentikasi, tetapkan `SGLANG_API_KEY` sebenarnya yang sesuai
    dengan konfigurasi server Anda, atau konfigurasikan penyedia secara eksplisit di bawah
    `models.providers.sglang`.

    <Tip>
    Jika Anda menjalankan SGLang tanpa autentikasi, nilai apa pun yang tidak kosong untuk
    `SGLANG_API_KEY` sudah cukup untuk mengaktifkan penemuan model.
    </Tip>

  </Accordion>
</AccordionGroup>

## Terkait

<CardGroup cols={2}>
  <Card title="Pemilihan model" href="/id/concepts/model-providers" icon="layers">
    Memilih penyedia, referensi model, dan perilaku failover.
  </Card>
  <Card title="Referensi konfigurasi" href="/id/gateway/configuration-reference" icon="gear">
    Skema konfigurasi lengkap termasuk entri penyedia.
  </Card>
</CardGroup>
