---
read_when:
    - Anda ingin menggunakan model Mistral di OpenClaw
    - Anda menginginkan transkripsi waktu nyata Voxtral untuk Panggilan Suara
    - Anda memerlukan onboarding kunci API Mistral dan referensi model
summary: Gunakan model Mistral dan transkripsi Voxtral dengan OpenClaw
title: Mistral
x-i18n:
    generated_at: "2026-05-10T19:50:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 94c4caa86d4a3eb873d8b6a1cc639edbad3dd7478f401e2ca53f704de095f829
    source_path: providers/mistral.md
    workflow: 16
    postprocess_version: locale-links-v1
---

OpenClaw menyertakan Plugin Mistral bawaan yang mendaftarkan empat kontrak: penyelesaian chat, pemahaman media (transkripsi batch Voxtral), STT realtime untuk Voice Call (Voxtral Realtime), dan embedding memori (`mistral-embed`).

| Properti         | Nilai                                       |
| ---------------- | ------------------------------------------- |
| ID penyedia      | `mistral`                                   |
| Plugin           | bawaan, `enabledByDefault: true`            |
| Variabel env autentikasi | `MISTRAL_API_KEY`                    |
| Flag penyiapan awal | `--auth-choice mistral-api-key`          |
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
  <Step title="Jalankan penyiapan awal">
    ```bash
    openclaw onboard --auth-choice mistral-api-key
    ```

    Atau teruskan kuncinya secara langsung:

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

[Mistral Medium 3.5](https://docs.mistral.ai/models/model-cards/mistral-medium-3-5-26-04)
adalah model Medium campuran saat ini dalam katalog bawaan: bobot padat 128B,
input teks dan gambar, konteks 256K, pemanggilan fungsi, keluaran terstruktur, pengodean,
dan penalaran yang dapat disesuaikan melalui API Chat Completions. Gunakan
`mistral/mistral-medium-3-5` saat Anda menginginkan model agentik/pengodean
terpadu Mistral yang lebih baru, bukan default `mistral/mistral-large-latest`.

OpenClaw saat ini mengirimkan katalog Mistral bawaan ini:

| Referensi model                  | Input       | Konteks | Keluaran maks | Catatan                                                            |
| -------------------------------- | ----------- | ------- | ------------- | ------------------------------------------------------------------ |
| `mistral/mistral-large-latest`   | teks, gambar | 262,144 | 16,384        | Model default                                                      |
| `mistral/mistral-medium-2508`    | teks, gambar | 262,144 | 8,192         | Mistral Medium 3.1                                                 |
| `mistral/mistral-medium-3-5`     | teks, gambar | 262,144 | 8,192         | Mistral Medium 3.5; penalaran yang dapat disesuaikan               |
| `mistral/mistral-small-latest`   | teks, gambar | 128,000 | 16,384        | Mistral Small 4; penalaran yang dapat disesuaikan melalui API `reasoning_effort` |
| `mistral/pixtral-large-latest`   | teks, gambar | 128,000 | 32,768        | Pixtral                                                            |
| `mistral/codestral-latest`       | teks        | 256,000 | 4,096         | Pengodean                                                          |
| `mistral/devstral-medium-latest` | teks        | 262,144 | 32,768        | Devstral 2                                                         |
| `mistral/magistral-small`        | teks        | 128,000 | 40,000        | Mendukung penalaran                                                |

Setelah penyiapan awal, uji cepat Medium 3.5 tanpa memulai Gateway:

```bash
openclaw infer model run --local \
  --model mistral/mistral-medium-3-5 \
  --prompt "Reply with exactly: mistral-ok" \
  --json
```

Untuk menelusuri baris katalog bawaan sebelum mengubah konfigurasi:

```bash
openclaw models list --all --provider mistral --plain
```

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

## STT streaming Voice Call

Plugin `mistral` bawaan mendaftarkan Voxtral Realtime sebagai penyedia STT streaming
Voice Call.

| Pengaturan       | Jalur konfigurasi                                                    | Default                                 |
| ---------------- | -------------------------------------------------------------------- | --------------------------------------- |
| Kunci API        | `plugins.entries.voice-call.config.streaming.providers.mistral.apiKey` | Kembali ke `MISTRAL_API_KEY`            |
| Model            | `...mistral.model`                                                   | `voxtral-mini-transcribe-realtime-2602` |
| Encoding         | `...mistral.encoding`                                                | `pcm_mulaw`                             |
| Laju sampel      | `...mistral.sampleRate`                                              | `8000`                                  |
| Penundaan target | `...mistral.targetStreamingDelayMs`                                  | `800`                                   |

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
OpenClaw menetapkan default STT realtime Mistral ke `pcm_mulaw` pada 8 kHz agar Voice Call
dapat meneruskan frame media Twilio secara langsung. Gunakan `encoding: "pcm_s16le"` dan
`sampleRate` yang cocok hanya jika stream upstream Anda sudah berupa PCM mentah.
</Note>

## Konfigurasi lanjutan

<AccordionGroup>
  <Accordion title="Penalaran yang dapat disesuaikan">
    `mistral/mistral-small-latest` (Mistral Small 4) dan `mistral/mistral-medium-3-5` mendukung [penalaran yang dapat disesuaikan](https://docs.mistral.ai/studio-api/conversations/reasoning/adjustable) pada API Chat Completions melalui `reasoning_effort` (`none` meminimalkan pemikiran tambahan dalam keluaran; `high` menampilkan jejak pemikiran penuh sebelum jawaban akhir). Mistral merekomendasikan `reasoning_effort="high"` untuk kasus penggunaan agentik dan kode Medium 3.5.

    OpenClaw memetakan level **thinking** sesi ke API Mistral:

    | Level thinking OpenClaw                         | `reasoning_effort` Mistral |
    | ------------------------------------------------ | -------------------------- |
    | **off** / **minimal**                            | `none`                     |
    | **low** / **medium** / **high** / **xhigh** / **adaptive** / **max** | `high`     |

    <Warning>
    Jangan gabungkan mode penalaran Medium 3.5 dengan `temperature: 0`. API HTTP Mistral
    menolak `reasoning_effort="high"` plus `temperature: 0` dengan respons 400.
    Biarkan temperature tidak disetel agar Mistral menggunakan defaultnya, atau ikuti
    [pengaturan yang direkomendasikan Medium 3.5](https://huggingface.co/mistralai/Mistral-Medium-3.5-128B)
    dan gunakan `temperature: 0.7` untuk penalaran tinggi. Untuk jawaban langsung
    deterministik, matikan/minimalkan thinking agar OpenClaw mengirim
    `reasoning_effort: "none"` sebelum Anda menurunkan temperature.
    </Warning>

    Contoh konfigurasi dalam cakupan model untuk penalaran Medium 3.5:

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
    Model katalog Mistral bawaan lainnya tidak menggunakan parameter ini. Tetap gunakan model `magistral-*` saat Anda menginginkan perilaku native Mistral yang mengutamakan penalaran.
    </Note>

  </Accordion>

  <Accordion title="Embedding memori">
    Mistral dapat menyajikan embedding memori melalui `/v1/embeddings` (model default: `mistral-embed`).

    ```json5
    {
      memorySearch: { provider: "mistral" },
    }
    ```

  </Accordion>

  <Accordion title="Autentikasi dan URL dasar">
    - Autentikasi Mistral menggunakan `MISTRAL_API_KEY` (header Bearer).
    - URL dasar penyedia ditetapkan default ke `https://api.mistral.ai/v1` dan menerima bentuk permintaan chat-completions standar yang kompatibel dengan OpenAI.
    - Model default penyiapan awal adalah `mistral/mistral-large-latest`.
    - Timpa URL dasar di bawah `models.providers.mistral.baseUrl` hanya ketika Mistral secara eksplisit menerbitkan endpoint regional yang Anda perlukan.

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
