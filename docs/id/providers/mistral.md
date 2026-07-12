---
read_when:
    - Anda ingin menggunakan model Mistral di OpenClaw
    - Anda menginginkan transkripsi waktu nyata Voxtral untuk Panggilan Suara
    - Anda memerlukan proses onboarding kunci API Mistral dan referensi model
summary: Gunakan model Mistral dan transkripsi Voxtral dengan OpenClaw
title: Mistral
x-i18n:
    generated_at: "2026-07-12T14:36:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 58f27b9917d2e7144a64cad559de4fe26a5a1101703bbe21c04252717df801cd
    source_path: providers/mistral.md
    workflow: 16
---

Plugin `mistral` bawaan mendaftarkan empat kontrak: penyelesaian obrolan, pemahaman media (transkripsi batch Voxtral), STT waktu nyata untuk Panggilan Suara (Voxtral Realtime), dan embedding memori (`mistral-embed`).

| Properti         | Nilai                                       |
| ---------------- | ------------------------------------------- |
| ID penyedia      | `mistral`                                   |
| Plugin           | bawaan, diaktifkan secara default           |
| Variabel env autentikasi | `MISTRAL_API_KEY`                    |
| Flag orientasi awal | `--auth-choice mistral-api-key`          |
| Flag CLI langsung | `--mistral-api-key <key>`                  |
| API              | kompatibel dengan OpenAI (`openai-completions`) |
| URL dasar        | `https://api.mistral.ai/v1`                 |
| Model default    | `mistral/mistral-large-latest`              |
| Model embedding  | `mistral-embed`                             |
| Batch Voxtral    | `voxtral-mini-latest` (transkripsi audio)   |
| Voxtral waktu nyata | `voxtral-mini-transcribe-realtime-2602`  |

## Memulai

<Steps>
  <Step title="Dapatkan kunci API Anda">
    Buat kunci API di [Konsol Mistral](https://console.mistral.ai/).
  </Step>
  <Step title="Jalankan orientasi awal">
    ```bash
    openclaw onboard --auth-choice mistral-api-key
    ```

    Atau berikan kunci secara langsung:

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
  <Step title="Verifikasi bahwa model tersedia">
    ```bash
    openclaw models list --provider mistral
    ```
  </Step>
</Steps>

## Katalog LLM bawaan

| Referensi model                  | Masukan     | Konteks | Keluaran maks. | Catatan                                               |
| -------------------------------- | ----------- | ------- | -------------- | ----------------------------------------------------- |
| `mistral/mistral-large-latest`   | teks, gambar | 262,144 | 16,384        | Model default                                         |
| `mistral/mistral-medium-2508`    | teks, gambar | 262,144 | 8,192         | Mistral Medium 3.1                                    |
| `mistral/mistral-medium-3-5`     | teks, gambar | 262,144 | 8,192         | Mistral Medium 3.5; penalaran dapat disesuaikan       |
| `mistral/mistral-small-latest`   | teks, gambar | 262,144 | 16,384        | Mistral Small 4 terbaru; `reasoning_effort` dapat disesuaikan |
| `mistral/mistral-small-2603`     | teks, gambar | 262,144 | 16,384        | Mistral Small 4 dengan versi tetap; `reasoning_effort` dapat disesuaikan |
| `mistral/pixtral-large-latest`   | teks, gambar | 128,000 | 32,768        | Pixtral                                               |
| `mistral/codestral-latest`       | teks        | 256,000 | 4,096          | Pemrograman                                           |
| `mistral/devstral-medium-latest` | teks        | 262,144 | 32,768         | Devstral 2                                            |
| `mistral/magistral-small`        | teks        | 128,000 | 40,000         | Mendukung penalaran                                   |

Periksa baris katalog bawaan sebelum mengubah konfigurasi:

```bash
openclaw models list --all --provider mistral --plain
```

Uji cepat model tanpa memulai Gateway:

```bash
openclaw infer model run --local \
  --model mistral/mistral-medium-3-5 \
  --prompt "Reply with exactly: mistral-ok" \
  --json
```

## Transkripsi audio (Voxtral)

Gunakan Voxtral untuk transkripsi audio batch melalui alur pemahaman media:

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

| Pengaturan       | Jalur konfigurasi                                                       | Default                                 |
| ---------------- | ----------------------------------------------------------------------- | --------------------------------------- |
| Kunci API        | `plugins.entries.voice-call.config.streaming.providers.mistral.apiKey`  | Menggunakan `MISTRAL_API_KEY` sebagai cadangan |
| Model            | `...mistral.model`                                                      | `voxtral-mini-transcribe-realtime-2602` |
| Pengodean        | `...mistral.encoding`                                                   | `pcm_mulaw`                             |
| Laju sampel      | `...mistral.sampleRate`                                                 | `8000`                                  |
| Penundaan target | `...mistral.targetStreamingDelayMs`                                     | `800`                                   |

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
OpenClaw menetapkan default STT waktu nyata Mistral ke `pcm_mulaw` pada 8 kHz agar Panggilan Suara dapat meneruskan bingkai media Twilio secara langsung. Gunakan `encoding: "pcm_s16le"` dan `sampleRate` yang sesuai hanya jika stream hulu Anda sudah berupa PCM mentah.
</Note>

## Konfigurasi lanjutan

<AccordionGroup>
  <Accordion title="Penalaran yang dapat disesuaikan">
    `mistral/mistral-small-latest`, `mistral/mistral-small-2603`, dan `mistral/mistral-medium-3-5` mendukung [penalaran yang dapat disesuaikan](https://docs.mistral.ai/studio-api/conversations/reasoning/adjustable) pada API Penyelesaian Obrolan melalui `reasoning_effort` (`none` meminimalkan pemikiran tambahan dalam keluaran; `high` menampilkan jejak pemikiran lengkap sebelum jawaban akhir).

    OpenClaw memetakan tingkat **pemikiran** sesi ke API Mistral:

    | Tingkat pemikiran OpenClaw                                           | `reasoning_effort` Mistral |
    | -------------------------------------------------------------------- | -------------------------- |
    | **nonaktif** / **minimal**                                           | `none`                     |
    | **rendah** / **sedang** / **tinggi** / **sangat tinggi** / **adaptif** / **maksimal** | `high` |

    <Warning>
    Hindari menggabungkan mode penalaran Medium 3.5 dengan `temperature: 0`; API HTTP Mistral dilaporkan menolak `reasoning_effort="high"` bersama `temperature: 0` dengan respons 400. Biarkan suhu tidak ditetapkan, atau nonaktifkan/minimalkan pemikiran agar OpenClaw mengirim `reasoning_effort: "none"` sebelum Anda menetapkan suhu rendah.
    </Warning>

    Contoh konfigurasi yang dicakupkan ke model untuk penalaran Medium 3.5:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "mistral/mistral-medium-3-5" },
          models: {
            "mistral/mistral-medium-3-5": {
              params: { thinking: "high" },
            },
          },
        },
      },
    }
    ```

    <Note>
    Model katalog Mistral bawaan lainnya tidak menggunakan parameter ini. Tetap gunakan model `magistral-*` jika Anda menginginkan perilaku asli Mistral yang mengutamakan penalaran.
    </Note>

  </Accordion>

  <Accordion title="Embedding memori">
    Mistral dapat menyediakan embedding memori melalui `/v1/embeddings` (model default: `mistral-embed`):

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: { provider: "mistral" },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Autentikasi dan URL dasar">
    - Autentikasi Mistral menggunakan `MISTRAL_API_KEY` (header Bearer).
    - URL dasar penyedia ditetapkan secara default ke `https://api.mistral.ai/v1` dan menerima format permintaan penyelesaian obrolan standar yang kompatibel dengan OpenAI.
    - Model default orientasi awal adalah `mistral/mistral-large-latest`.
    - Timpa URL dasar di bawah `models.providers.mistral.baseUrl` hanya jika Mistral secara eksplisit menerbitkan endpoint regional yang Anda perlukan.

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
