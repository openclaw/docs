---
read_when:
    - Anda ingin menggunakan model Mistral di OpenClaw
    - Anda menginginkan transkripsi realtime Voxtral untuk Voice Call
    - Anda memerlukan onboarding API key Mistral dan referensi model
summary: Gunakan model Mistral dan transkripsi Voxtral dengan OpenClaw
title: Mistral
x-i18n:
    generated_at: "2026-04-24T09:23:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 63e1eb462f836f5ddc1afd0d01954080eee461230924368d77e2e57fef12caf1
    source_path: providers/mistral.md
    workflow: 15
---

OpenClaw mendukung Mistral untuk perutean model teks/gambar (`mistral/...`) dan
transkripsi audio melalui Voxtral dalam pemahaman media.
Mistral juga dapat digunakan untuk embedding memori (`memorySearch.provider = "mistral"`).

- Provider: `mistral`
- Auth: `MISTRAL_API_KEY`
- API: Mistral Chat Completions (`https://api.mistral.ai/v1`)

## Memulai

<Steps>
  <Step title="Dapatkan API key Anda">
    Buat API key di [Mistral Console](https://console.mistral.ai/).
  </Step>
  <Step title="Jalankan onboarding">
    ```bash
    openclaw onboard --auth-choice mistral-api-key
    ```

    Atau berikan key secara langsung:

    ```bash
    openclaw onboard --mistral-api-key "$MISTRAL_API_KEY"
    ```

  </Step>
  <Step title="Tetapkan model default">
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

OpenClaw saat ini mengirim katalog Mistral bawaan berikut:

| Referensi model                    | Input       | Konteks | Output maks | Catatan                                                          |
| ---------------------------------- | ----------- | ------- | ----------- | ---------------------------------------------------------------- |
| `mistral/mistral-large-latest`     | text, image | 262,144 | 16,384      | Model default                                                    |
| `mistral/mistral-medium-2508`      | text, image | 262,144 | 8,192       | Mistral Medium 3.1                                               |
| `mistral/mistral-small-latest`     | text, image | 128,000 | 16,384      | Mistral Small 4; reasoning yang dapat disesuaikan melalui API `reasoning_effort` |
| `mistral/pixtral-large-latest`     | text, image | 128,000 | 32,768      | Pixtral                                                          |
| `mistral/codestral-latest`         | text        | 256,000 | 4,096       | Coding                                                           |
| `mistral/devstral-medium-latest`   | text        | 262,144 | 32,768      | Devstral 2                                                       |
| `mistral/magistral-small`          | text        | 128,000 | 40,000      | Reasoning-enabled                                                |

## Transkripsi audio (Voxtral)

Gunakan Voxtral untuk transkripsi audio batch melalui pipeline
pemahaman media.

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

## Streaming STT Voice Call

Plugin `mistral` bawaan mendaftarkan Voxtral Realtime sebagai provider
streaming STT untuk Voice Call.

| Pengaturan    | Path konfigurasi                                                         | Default                                 |
| ------------- | ------------------------------------------------------------------------ | --------------------------------------- |
| API key       | `plugins.entries.voice-call.config.streaming.providers.mistral.apiKey`   | Fallback ke `MISTRAL_API_KEY`           |
| Model         | `...mistral.model`                                                       | `voxtral-mini-transcribe-realtime-2602` |
| Encoding      | `...mistral.encoding`                                                    | `pcm_mulaw`                             |
| Sample rate   | `...mistral.sampleRate`                                                  | `8000`                                  |
| Target delay  | `...mistral.targetStreamingDelayMs`                                      | `800`                                   |

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
OpenClaw default ke realtime STT Mistral `pcm_mulaw` pada 8 kHz sehingga Voice Call
dapat meneruskan frame media Twilio secara langsung. Gunakan `encoding: "pcm_s16le"` dan `sampleRate`
yang cocok hanya jika stream upstream Anda sudah berupa PCM mentah.
</Note>

## Konfigurasi lanjutan

<AccordionGroup>
  <Accordion title="Reasoning yang dapat disesuaikan (mistral-small-latest)">
    `mistral/mistral-small-latest` dipetakan ke Mistral Small 4 dan mendukung [reasoning yang dapat disesuaikan](https://docs.mistral.ai/capabilities/reasoning/adjustable) pada API Chat Completions melalui `reasoning_effort` (`none` meminimalkan thinking tambahan pada output; `high` menampilkan jejak thinking penuh sebelum jawaban final).

    OpenClaw memetakan level **thinking** sesi ke API Mistral:

    | Level thinking OpenClaw                         | `reasoning_effort` Mistral |
    | ---------------------------------------------- | -------------------------- |
    | **off** / **minimal**                          | `none`                     |
    | **low** / **medium** / **high** / **xhigh** / **adaptive** / **max** | `high`     |

    <Note>
    Model lain dalam katalog Mistral bawaan tidak menggunakan parameter ini. Tetap gunakan model `magistral-*` ketika Anda menginginkan perilaku native Mistral yang mengutamakan reasoning.
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

  <Accordion title="Auth dan base URL">
    - Auth Mistral menggunakan `MISTRAL_API_KEY`.
    - Base URL provider default ke `https://api.mistral.ai/v1`.
    - Model default onboarding adalah `mistral/mistral-large-latest`.
    - Z.AI menggunakan auth Bearer dengan API key Anda.
  </Accordion>
</AccordionGroup>

## Terkait

<CardGroup cols={2}>
  <Card title="Model selection" href="/id/concepts/model-providers" icon="layers">
    Memilih provider, referensi model, dan perilaku failover.
  </Card>
  <Card title="Media understanding" href="/id/nodes/media-understanding" icon="microphone">
    Penyiapan transkripsi audio dan pemilihan provider.
  </Card>
</CardGroup>
