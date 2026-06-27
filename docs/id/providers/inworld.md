---
read_when:
    - Anda menginginkan sintesis ucapan Inworld untuk balasan keluar
    - Anda memerlukan keluaran catatan suara PCM telephony atau OGG_OPUS dari Inworld
summary: Inworld streaming text-to-speech untuk balasan OpenClaw
title: Inworld
x-i18n:
    generated_at: "2026-06-27T18:05:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ea65903945586516b51b239f0671b9e59dac92f302442f3cb629f66b68338cfb
    source_path: providers/inworld.md
    workflow: 16
---

  Inworld adalah penyedia text-to-speech (TTS) streaming. Di OpenClaw, layanan ini
  mensintesis audio balasan keluar (MP3 secara default, OGG_OPUS untuk catatan suara)
  dan audio PCM untuk kanal telefoni seperti Voice Call.

  OpenClaw mengirim permintaan ke endpoint TTS streaming Inworld, menggabungkan
  potongan audio base64 yang dikembalikan menjadi satu buffer, lalu menyerahkan hasilnya ke
  pipeline audio balasan standar.

  | Properti      | Nilai                                                           |
  | ------------- | --------------------------------------------------------------- |
  | Provider id   | `inworld`                                                       |
  | Plugin        | paket eksternal resmi                                           |
  | Kontrak       | `speechProviders` (hanya TTS)                                   |
  | Auth env var  | `INWORLD_API_KEY` (HTTP Basic, kredensial dasbor Base64)        |
  | Base URL      | `https://api.inworld.ai`                                        |
  | Suara default | `Sarah`                                                         |
  | Model default | `inworld-tts-1.5-max`                                           |
  | Output        | MP3 (default), OGG_OPUS (catatan suara), PCM 22050 Hz (telefoni) |
  | Situs web     | [inworld.ai](https://inworld.ai)                                |
  | Docs          | [docs.inworld.ai/tts/tts](https://docs.inworld.ai/tts/tts)      |

  ## Instal Plugin

  Instal plugin resmi, lalu mulai ulang Gateway:

  ```bash
  openclaw plugins install @openclaw/inworld-speech
  openclaw gateway restart
  ```

  ## Memulai

  <Steps>
  <Step title="Atur kunci API Anda">
    Salin kredensial dari dasbor Inworld Anda (Workspace > API Keys)
    dan tetapkan sebagai env var. Nilainya dikirim apa adanya sebagai kredensial HTTP Basic,
    jadi jangan enkode Base64 lagi atau mengubahnya menjadi bearer
    token.

    ```
    INWORLD_API_KEY=<base64-credential-from-dashboard>
    ```

  </Step>
  <Step title="Select Inworld in messages.tts">
    ```json5
    {
      messages: {
        tts: {
          auto: "always",
          provider: "inworld",
          providers: {
            inworld: {
              speakerVoiceId: "Sarah",
              modelId: "inworld-tts-1.5-max",
            },
          },
        },
      },
    }
    ```
  </Step>
  <Step title="Send a message">
    Kirim balasan melalui channel terhubung mana pun. OpenClaw menyintesis
    audio dengan Inworld dan mengirimkannya sebagai MP3 (atau OGG_OPUS saat channel
    mengharapkan catatan suara).
  </Step>
</Steps>

## Opsi konfigurasi

| Opsi             | Jalur                                           | Deskripsi                                                         |
| ---------------- | ----------------------------------------------- | ----------------------------------------------------------------- |
| `apiKey`         | `messages.tts.providers.inworld.apiKey`         | Kredensial dasbor Base64. Menggunakan `INWORLD_API_KEY` sebagai cadangan. |
| `baseUrl`        | `messages.tts.providers.inworld.baseUrl`        | Ganti URL dasar API Inworld (default `https://api.inworld.ai`).   |
| `speakerVoiceId` | `messages.tts.providers.inworld.speakerVoiceId` | Pengidentifikasi suara (default `Sarah`).                         |
| `modelId`        | `messages.tts.providers.inworld.modelId`        | ID model TTS (default `inworld-tts-1.5-max`).                     |
| `temperature`    | `messages.tts.providers.inworld.temperature`    | Temperatur sampling `0..2` (opsional).                            |

## Catatan

<AccordionGroup>
  <Accordion title="Authentication">
    Inworld menggunakan autentikasi HTTP Basic dengan satu string kredensial
    yang dikodekan Base64. Salin persis dari dasbor Inworld. Penyedia mengirimkannya
    sebagai `Authorization: Basic <apiKey>` tanpa pengodean tambahan, jadi
    jangan mengodekannya sendiri dengan Base64 dan jangan berikan token bergaya bearer.
    Lihat [catatan autentikasi TTS](/id/tools/tts#inworld-primary) untuk penjelasan yang sama.
  </Accordion>
  <Accordion title="Models">
    ID model yang didukung: `inworld-tts-1.5-max` (default),
    `inworld-tts-1.5-mini`, `inworld-tts-1-max`, `inworld-tts-1`.
  </Accordion>
  <Accordion title="Audio outputs">
    Balasan menggunakan MP3 secara default. Saat target channel adalah `voice-note`,
    OpenClaw meminta `OGG_OPUS` dari Inworld agar audio diputar sebagai gelembung
    suara native. Sintesis telefoni menggunakan `PCM` mentah pada 22050 Hz untuk mengumpan
    bridge telefoni.
  </Accordion>
  <Accordion title="Custom endpoints">
    Ganti host API dengan `messages.tts.providers.inworld.baseUrl`.
    Garis miring di akhir dihapus sebelum permintaan dikirim.
  </Accordion>
</AccordionGroup>

## Terkait

<CardGroup cols={2}>
  <Card title="Text-to-speech" href="/id/tools/tts" icon="waveform-lines">
    Ikhtisar TTS, penyedia, dan konfigurasi `messages.tts`.
  </Card>
  <Card title="Configuration" href="/id/gateway/configuration" icon="gear">
    Referensi konfigurasi lengkap termasuk pengaturan `messages.tts`.
  </Card>
  <Card title="Providers" href="/id/providers" icon="grid">
    Semua penyedia OpenClaw yang didukung.
  </Card>
  <Card title="Troubleshooting" href="/id/help/troubleshooting" icon="wrench">
    Masalah umum dan langkah debugging.
  </Card>
</CardGroup>
