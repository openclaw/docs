---
read_when:
    - Anda menginginkan speech-to-text Deepgram untuk lampiran audio
    - Anda menginginkan transkripsi streaming Deepgram untuk Voice Call
    - Anda memerlukan contoh konfigurasi Deepgram yang cepat
summary: Transkripsi Deepgram untuk voice note masuk
title: Deepgram
x-i18n:
    generated_at: "2026-04-25T13:53:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9d591aa24a5477fd9fe69b7a0dc44b204d28ea0c2f89e6dfef66f9ceb76da34d
    source_path: providers/deepgram.md
    workflow: 15
    postprocess_version: locale-links-v1
---

Deepgram adalah API speech-to-text. Di OpenClaw, Deepgram digunakan untuk
transkripsi audio/voice note masuk melalui `tools.media.audio` dan untuk STT streaming Voice Call
melalui `plugins.entries.voice-call.config.streaming`.

Untuk transkripsi batch, OpenClaw mengunggah file audio lengkap ke Deepgram
dan menyisipkan transkrip ke pipeline balasan (`{{Transcript}}` +
blok `[Audio]`). Untuk Voice Call streaming, OpenClaw meneruskan frame G.711
u-law langsung melalui endpoint WebSocket `listen` milik Deepgram dan memancarkan transkrip parsial atau
final saat Deepgram mengembalikannya.

| Detail        | Nilai                                                     |
| ------------- | --------------------------------------------------------- |
| Website       | [deepgram.com](https://deepgram.com)                      |
| Docs          | [developers.deepgram.com](https://developers.deepgram.com) |
| Auth          | `DEEPGRAM_API_KEY`                                        |
| Model default | `nova-3`                                                  |

## Memulai

<Steps>
  <Step title="Set your API key">
    Tambahkan API key Deepgram Anda ke environment:

    ```
    DEEPGRAM_API_KEY=dg_...
    ```

  </Step>
  <Step title="Enable the audio provider">
    ```json5
    {
      tools: {
        media: {
          audio: {
            enabled: true,
            models: [{ provider: "deepgram", model: "nova-3" }],
          },
        },
      },
    }
    ```
  </Step>
  <Step title="Send a voice note">
    Kirim pesan audio melalui channel terhubung apa pun. OpenClaw mentranskripsikannya
    melalui Deepgram dan menyisipkan transkrip ke pipeline balasan.
  </Step>
</Steps>

## Opsi konfigurasi

| Option            | Path                                                         | Deskripsi                              |
| ----------------- | ------------------------------------------------------------ | -------------------------------------- |
| `model`           | `tools.media.audio.models[].model`                           | ID model Deepgram (default: `nova-3`)  |
| `language`        | `tools.media.audio.models[].language`                        | Petunjuk bahasa (opsional)             |
| `detect_language` | `tools.media.audio.providerOptions.deepgram.detect_language` | Aktifkan deteksi bahasa (opsional)     |
| `punctuate`       | `tools.media.audio.providerOptions.deepgram.punctuate`       | Aktifkan tanda baca (opsional)         |
| `smart_format`    | `tools.media.audio.providerOptions.deepgram.smart_format`    | Aktifkan pemformatan cerdas (opsional) |

<Tabs>
  <Tab title="With language hint">
    ```json5
    {
      tools: {
        media: {
          audio: {
            enabled: true,
            models: [{ provider: "deepgram", model: "nova-3", language: "en" }],
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="With Deepgram options">
    ```json5
    {
      tools: {
        media: {
          audio: {
            enabled: true,
            providerOptions: {
              deepgram: {
                detect_language: true,
                punctuate: true,
                smart_format: true,
              },
            },
            models: [{ provider: "deepgram", model: "nova-3" }],
          },
        },
      },
    }
    ```
  </Tab>
</Tabs>

## Voice Call streaming STT

Plugin `deepgram` bawaan juga mendaftarkan provider transkripsi realtime
untuk plugin Voice Call.

| Setting         | Path konfigurasi                                                        | Default                          |
| --------------- | ----------------------------------------------------------------------- | -------------------------------- |
| API key         | `plugins.entries.voice-call.config.streaming.providers.deepgram.apiKey` | Fallback ke `DEEPGRAM_API_KEY`   |
| Model           | `...deepgram.model`                                                     | `nova-3`                         |
| Language        | `...deepgram.language`                                                  | (tidak disetel)                  |
| Encoding        | `...deepgram.encoding`                                                  | `mulaw`                          |
| Sample rate     | `...deepgram.sampleRate`                                                | `8000`                           |
| Endpointing     | `...deepgram.endpointingMs`                                             | `800`                            |
| Interim results | `...deepgram.interimResults`                                            | `true`                           |

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          streaming: {
            enabled: true,
            provider: "deepgram",
            providers: {
              deepgram: {
                apiKey: "${DEEPGRAM_API_KEY}",
                model: "nova-3",
                endpointingMs: 800,
                language: "en-US",
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
Voice Call menerima audio telephony sebagai G.711 u-law 8 kHz. Provider
streaming Deepgram default ke `encoding: "mulaw"` dan `sampleRate: 8000`, sehingga
frame media Twilio dapat diteruskan secara langsung.
</Note>

## Catatan

<AccordionGroup>
  <Accordion title="Authentication">
    Auth mengikuti urutan auth provider standar. `DEEPGRAM_API_KEY` adalah
    jalur yang paling sederhana.
  </Accordion>
  <Accordion title="Proxy and custom endpoints">
    Timpa endpoint atau header dengan `tools.media.audio.baseUrl` dan
    `tools.media.audio.headers` saat menggunakan proxy.
  </Accordion>
  <Accordion title="Output behavior">
    Output mengikuti aturan audio yang sama seperti provider lain (batas ukuran, timeout,
    penyisipan transkrip).
  </Accordion>
</AccordionGroup>

## Terkait

<CardGroup cols={2}>
  <Card title="Media tools" href="/id/tools/media-overview" icon="photo-film">
    Ikhtisar pipeline pemrosesan audio, gambar, dan video.
  </Card>
  <Card title="Configuration" href="/id/gateway/configuration" icon="gear">
    Referensi konfigurasi lengkap termasuk pengaturan tool media.
  </Card>
  <Card title="Troubleshooting" href="/id/help/troubleshooting" icon="wrench">
    Masalah umum dan langkah debug.
  </Card>
  <Card title="FAQ" href="/id/help/faq" icon="circle-question">
    Pertanyaan umum tentang penyiapan OpenClaw.
  </Card>
</CardGroup>
