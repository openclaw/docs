---
read_when:
    - Anda ingin menjalankan OpenClaw dengan server SGLang lokal
    - Anda ingin endpoint /v1 yang kompatibel dengan OpenAI dengan model Anda sendiri
summary: Jalankan OpenClaw dengan SGLang (server yang dihosting sendiri dan kompatibel dengan OpenAI)
title: SGLang
x-i18n:
    generated_at: "2026-05-06T09:26:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3e65e38868e061e03d15348725971880ca503dc61a7425c1fbdc718fd684728f
    source_path: providers/sglang.md
    workflow: 16
---

SGLang menyajikan model berbobot terbuka melalui API HTTP yang kompatibel dengan OpenAI. OpenClaw terhubung ke SGLang menggunakan keluarga penyedia `openai-completions` dengan penemuan otomatis model yang tersedia.

| Properti                  | Nilai                                                        |
| ------------------------- | ------------------------------------------------------------ |
| ID penyedia               | `sglang`                                                     |
| Plugin                    | dibundel, `enabledByDefault: true`                           |
| Variabel env autentikasi  | `SGLANG_API_KEY` (nilai tidak kosong apa pun jika server tidak memiliki autentikasi) |
| Flag onboarding           | `--auth-choice sglang`                                       |
| API                       | kompatibel dengan OpenAI (`openai-completions`)              |
| URL dasar bawaan          | `http://127.0.0.1:30000/v1`                                  |
| Placeholder model bawaan  | `sglang/Qwen/Qwen3-8B`                                       |
| Penggunaan streaming      | Ya (`supportsStreamingUsage: true`)                          |
| Harga                     | Ditandai tanpa biaya eksternal (`modelPricing.external: false`) |

OpenClaw juga **menemukan secara otomatis** model yang tersedia dari SGLang saat Anda ikut serta dengan `SGLANG_API_KEY` dan Anda tidak mendefinisikan entri `models.providers.sglang` secara eksplisit — lihat [Penemuan model (penyedia implisit)](#model-discovery-implicit-provider) di bawah.

## Memulai

<Steps>
  <Step title="Mulai SGLang">
    Jalankan SGLang dengan server yang kompatibel dengan OpenAI. URL dasar Anda harus mengekspos
    endpoint `/v1` (misalnya `/v1/models`, `/v1/chat/completions`). SGLang
    umumnya berjalan di:

    - `http://127.0.0.1:30000/v1`

  </Step>
  <Step title="Tetapkan kunci API">
    Nilai apa pun berfungsi jika tidak ada autentikasi yang dikonfigurasi di server Anda:

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

## Penemuan model (penyedia implisit)

Saat `SGLANG_API_KEY` ditetapkan (atau profil autentikasi ada) dan Anda **tidak**
mendefinisikan `models.providers.sglang`, OpenClaw akan mengueri:

- `GET http://127.0.0.1:30000/v1/models`

dan mengonversi ID yang dikembalikan menjadi entri model.

<Note>
Jika Anda menetapkan `models.providers.sglang` secara eksplisit, penemuan otomatis dilewati dan
Anda harus mendefinisikan model secara manual.
</Note>

## Konfigurasi eksplisit (model manual)

Gunakan konfigurasi eksplisit saat:

- SGLang berjalan pada host/port yang berbeda.
- Anda ingin menyematkan nilai `contextWindow`/`maxTokens`.
- Server Anda memerlukan kunci API sungguhan (atau Anda ingin mengontrol header).

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
  <Accordion title="Perilaku bergaya proxy">
    SGLang diperlakukan sebagai backend `/v1` kompatibel OpenAI bergaya proxy, bukan
    endpoint OpenAI native.

    | Perilaku | SGLang |
    |----------|--------|
    | Pembentukan permintaan khusus OpenAI | Tidak diterapkan |
    | `service_tier`, Responses `store`, petunjuk cache prompt | Tidak dikirim |
    | Pembentukan payload kompatibilitas reasoning | Tidak diterapkan |
    | Header atribusi tersembunyi (`originator`, `version`, `User-Agent`) | Tidak disuntikkan pada URL dasar SGLang khusus |

  </Accordion>

  <Accordion title="Pemecahan masalah">
    **Server tidak dapat dijangkau**

    Verifikasi bahwa server sedang berjalan dan merespons:

    ```bash
    curl http://127.0.0.1:30000/v1/models
    ```

    **Kesalahan autentikasi**

    Jika permintaan gagal dengan kesalahan autentikasi, tetapkan `SGLANG_API_KEY` sungguhan yang cocok
    dengan konfigurasi server Anda, atau konfigurasikan penyedia secara eksplisit di bawah
    `models.providers.sglang`.

    <Tip>
    Jika Anda menjalankan SGLang tanpa autentikasi, nilai tidak kosong apa pun untuk
    `SGLANG_API_KEY` sudah cukup untuk ikut serta dalam penemuan model.
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
