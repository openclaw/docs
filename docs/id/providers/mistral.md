---
read_when:
    - Anda ingin menggunakan model Mistral di OpenClaw
    - Anda menginginkan transkripsi waktu nyata Voxtral untuk Panggilan Suara
    - Anda memerlukan penyiapan awal kunci API Mistral dan referensi model
summary: Gunakan model Mistral dan transkripsi Voxtral dengan OpenClaw
title: Mistral
x-i18n:
    generated_at: "2026-05-06T09:25:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: fb55915526e292210df61b646e1bbcdb2da86a0e46ea4bd5afd63d244f8da71a
    source_path: providers/mistral.md
    workflow: 16
---

OpenClaw menyertakan Plugin Mistral bawaan yang mendaftarkan empat kontrak: penyelesaian chat, pemahaman media (transkripsi batch Voxtral), STT realtime untuk Panggilan Suara (Voxtral Realtime), dan embedding memori (`mistral-embed`).

| Properti         | Nilai                                       |
| ---------------- | ------------------------------------------- |
| ID penyedia      | `mistral`                                   |
| Plugin           | bawaan, `enabledByDefault: true`            |
| Variabel env auth | `MISTRAL_API_KEY`                          |
| Flag onboarding  | `--auth-choice mistral-api-key`             |
| Flag CLI langsung | `--mistral-api-key <key>`                  |
| API              | kompatibel dengan OpenAI (`openai-completions`) |
| URL dasar        | `https://api.mistral.ai/v1`                 |
| Model default    | `mistral/mistral-large-latest`              |
| Model embedding  | `mistral-embed`                             |
| Batch Voxtral    | `voxtral-mini-latest` (transkripsi audio)   |
| Realtime Voxtral | `voxtral-mini-transcribe-realtime-2602`     |

## Memulai

<Steps>
  <Step title="Dapatkan kunci API Anda">
    Buat kunci API di [Mistral Console](https://console.mistral.ai/).
  </Step>
  <Step title="Jalankan onboarding">
    ```bash
    openclaw onboard --auth-choice mistral-api-key
    ```

    Atau berikan kunci secara langsung:

    ```bash
    openclaw onboard --mistral-api-key "$MISTRAL_API_KEY"
    ```

  </Step>
  <Step title="Atur model default">
    ```json5
    {
      env: { MISTRAL_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "mistral/mistral-large-latest" } } },
    }
    ```
  </Step>
  <Step title="Verifikasi model tersedia">
    ```bash
    openclaw models list --provider mistral
    ```
  </Step>
</Steps>

## Katalog LLM bawaan

OpenClaw saat ini mengirimkan katalog Mistral bawaan ini:

| Referensi model                  | Input       | Konteks | Output maks | Catatan                                                          |
| -------------------------------- | ----------- | ------- | ----------- | ---------------------------------------------------------------- |
| `mistral/mistral-large-latest`   | teks, gambar | 262,144 | 16,384      | Model default                                                    |
| `mistral/mistral-medium-2508`    | teks, gambar | 262,144 | 8,192       | Mistral Medium 3.1                                               |
| `mistral/mistral-small-latest`   | teks, gambar | 128,000 | 16,384      | Mistral Small 4; penalaran yang dapat disesuaikan melalui API `reasoning_effort` |
| `mistral/pixtral-large-latest`   | teks, gambar | 128,000 | 32,768      | Pixtral                                                          |
| `mistral/codestral-latest`       | teks        | 256,000 | 4,096       | Pengodean                                                        |
| `mistral/devstral-medium-latest` | teks        | 262,144 | 32,768      | Devstral 2                                                       |
| `mistral/magistral-small`        | teks        | 128,000 | 40,000      | Mendukung penalaran                                              |

## Transkripsi audio (Voxtral)

Gunakan Voxtral untuk transkripsi audio batch melalui pipeline pemahaman media.

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "mistral", model: "voxtral-mini-latest" }],
      },
    },
  },
}
```

<Tip>
Jalur transkripsi media menggunakan `/v1/audio/transcriptions`. Model audio default untuk Mistral adalah `voxtral-mini-latest`.
</Tip>

## STT streaming Panggilan Suara

Plugin `mistral` bawaan mendaftarkan Voxtral Realtime sebagai penyedia STT streaming Panggilan Suara.

| Pengaturan   | Jalur konfigurasi                                                    | Default                                 |
| ------------ | -------------------------------------------------------------------- | --------------------------------------- |
| Kunci API    | `plugins.entries.voice-call.config.streaming.providers.mistral.apiKey` | Beralih ke `MISTRAL_API_KEY` jika tidak ada |
| Model        | `...mistral.model`                                                   | `voxtral-mini-transcribe-realtime-2602` |
| Encoding     | `...mistral.encoding`                                                | `pcm_mulaw`                             |
| Laju sampel  | `...mistral.sampleRate`                                              | `8000`                                  |
| Delay target | `...mistral.targetStreamingDelayMs`                                  | `800`                                   |

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          streaming: {
            enabled: true,
            provider: "mistral",
            providers: {
              mistral: {
                apiKey: "${MISTRAL_API_KEY}",
                targetStreamingDelayMs: 800,
              },
            },
          },
        },
      },
    },
  },
}
```

<Note>
OpenClaw menetapkan default STT realtime Mistral ke `pcm_mulaw` pada 8 kHz sehingga Panggilan Suara dapat meneruskan frame media Twilio secara langsung. Gunakan `encoding: "pcm_s16le"` dan `sampleRate` yang cocok hanya jika stream upstream Anda sudah berupa PCM mentah.
</Note>

## Konfigurasi lanjutan

<AccordionGroup>
  <Accordion title="Penalaran yang dapat disesuaikan (mistral-small-latest)">
    `mistral/mistral-small-latest` dipetakan ke Mistral Small 4 dan mendukung [penalaran yang dapat disesuaikan](https://docs.mistral.ai/capabilities/reasoning/adjustable) pada API Chat Completions melalui `reasoning_effort` (`none` meminimalkan pemikiran tambahan dalam output; `high` menampilkan jejak pemikiran penuh sebelum jawaban akhir).

    OpenClaw memetakan level **thinking** sesi ke API Mistral:

    | Level thinking OpenClaw                         | `reasoning_effort` Mistral |
    | ------------------------------------------------ | -------------------------- |
    | **off** / **minimal**                            | `none`                     |
    | **low** / **medium** / **high** / **xhigh** / **adaptive** / **max** | `high`     |

    <Note>
    Model katalog Mistral bawaan lainnya tidak menggunakan parameter ini. Tetap gunakan model `magistral-*` saat Anda menginginkan perilaku native Mistral yang mengutamakan penalaran.
    </Note>

  </Accordion>

  <Accordion title="Embedding memori">
    Mistral dapat melayani embedding memori melalui `/v1/embeddings` (model default: `mistral-embed`).

    ```json5
    {
      memorySearch: { provider: "mistral" },
    }
    ```

  </Accordion>

  <Accordion title="Auth dan URL dasar">
    - Auth Mistral menggunakan `MISTRAL_API_KEY` (header Bearer).
    - URL dasar penyedia default ke `https://api.mistral.ai/v1` dan menerima bentuk permintaan chat-completions standar yang kompatibel dengan OpenAI.
    - Model default onboarding adalah `mistral/mistral-large-latest`.
    - Timpa URL dasar di bawah `models.providers.mistral.baseUrl` hanya saat Mistral secara eksplisit menerbitkan endpoint regional yang Anda perlukan.

  </Accordion>
</AccordionGroup>

## Terkait

<CardGroup cols={2}>
  <Card title="Pemilihan model" href="/id/concepts/model-providers" icon="layers">
    Memilih penyedia, referensi model, dan perilaku failover.
  </Card>
  <Card title="Pemahaman media" href="/id/nodes/media-understanding" icon="microphone">
    Penyiapan transkripsi audio dan pemilihan penyedia.
  </Card>
</CardGroup>
