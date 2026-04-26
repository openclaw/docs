---
read_when:
    - Anda menginginkan sintesis ucapan Inworld untuk balasan outbound
    - Anda memerlukan output catatan suara PCM telephony atau OGG_OPUS dari Inworld
summary: Text-to-speech streaming Inworld untuk balasan OpenClaw
title: Inworld
x-i18n:
    generated_at: "2026-04-26T11:37:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4c3908b6ab11fd7bd2e18e5c56d1fdc1ac2e52448538d31cc6c83c2c97917641
    source_path: providers/inworld.md
    workflow: 15
---

Inworld adalah provider text-to-speech (TTS) streaming. Di OpenClaw, Inworld
mensintesis audio balasan outbound (MP3 secara default, OGG_OPUS untuk catatan suara)
dan audio PCM untuk channel teleponi seperti Voice Call.

OpenClaw melakukan POST ke endpoint TTS streaming Inworld, menggabungkan
chunk audio base64 yang dikembalikan menjadi satu buffer, lalu menyerahkan hasilnya
ke pipeline audio balasan standar.

| Detail        | Nilai                                                       |
| ------------- | ----------------------------------------------------------- |
| Situs web     | [inworld.ai](https://inworld.ai)                            |
| Dokumen       | [docs.inworld.ai/tts/tts](https://docs.inworld.ai/tts/tts)  |
| Auth          | `INWORLD_API_KEY` (HTTP Basic, kredensial dashboard Base64) |
| Voice default | `Sarah`                                                     |
| Model default | `inworld-tts-1.5-max`                                       |

## Memulai

<Steps>
  <Step title="Setel API key Anda">
    Salin kredensial dari dashboard Inworld Anda (Workspace > API Keys)
    dan setel sebagai env var. Nilai tersebut dikirim apa adanya sebagai kredensial
    HTTP Basic, jadi jangan encode lagi ke Base64 atau ubah menjadi bearer
    token.

    ```
    INWORLD_API_KEY=<base64-credential-from-dashboard>
    ```

  </Step>
  <Step title="Pilih Inworld di messages.tts">
    ```json5
    {
      messages: {
        tts: {
          auto: "always",
          provider: "inworld",
          providers: {
            inworld: {
              voiceId: "Sarah",
              modelId: "inworld-tts-1.5-max",
            },
          },
        },
      },
    }
    ```
  </Step>
  <Step title="Kirim pesan">
    Kirim balasan melalui channel yang terhubung. OpenClaw mensintesis
    audio dengan Inworld dan mengirimkannya sebagai MP3 (atau OGG_OPUS saat channel
    mengharapkan catatan suara).
  </Step>
</Steps>

## Opsi konfigurasi

| Opsi          | Path                                         | Deskripsi                                                         |
| ------------- | -------------------------------------------- | ----------------------------------------------------------------- |
| `apiKey`      | `messages.tts.providers.inworld.apiKey`      | Kredensial dashboard Base64. Fallback ke `INWORLD_API_KEY`.       |
| `baseUrl`     | `messages.tts.providers.inworld.baseUrl`     | Ganti URL dasar API Inworld (default `https://api.inworld.ai`).   |
| `voiceId`     | `messages.tts.providers.inworld.voiceId`     | Pengenal voice (default `Sarah`).                                 |
| `modelId`     | `messages.tts.providers.inworld.modelId`     | ID model TTS (default `inworld-tts-1.5-max`).                     |
| `temperature` | `messages.tts.providers.inworld.temperature` | Temperature sampling `0..2` (opsional).                           |

## Catatan

<AccordionGroup>
  <Accordion title="Autentikasi">
    Inworld menggunakan auth HTTP Basic dengan satu string kredensial
    yang di-encode Base64. Salin apa adanya dari dashboard Inworld. Provider mengirimkannya
    sebagai `Authorization: Basic <apiKey>` tanpa encoding tambahan,
    jadi jangan encode sendiri ke Base64 dan jangan gunakan token bergaya bearer.
    Lihat [catatan auth TTS](/id/tools/tts#inworld-primary) untuk catatan yang sama.
  </Accordion>
  <Accordion title="Model">
    ID model yang didukung: `inworld-tts-1.5-max` (default),
    `inworld-tts-1.5-mini`, `inworld-tts-1-max`, `inworld-tts-1`.
  </Accordion>
  <Accordion title="Output audio">
    Balasan menggunakan MP3 secara default. Saat target channel adalah `voice-note`
    OpenClaw meminta `OGG_OPUS` ke Inworld agar audio diputar sebagai
    bubble suara native. Sintesis teleponi menggunakan `PCM` mentah pada 22050 Hz untuk memberi makan
    bridge teleponi.
  </Accordion>
  <Accordion title="Endpoint kustom">
    Ganti host API dengan `messages.tts.providers.inworld.baseUrl`.
    Garis miring di akhir dihapus sebelum permintaan dikirim.
  </Accordion>
</AccordionGroup>

## Terkait

<CardGroup cols={2}>
  <Card title="Text-to-speech" href="/id/tools/tts" icon="waveform-lines">
    Ikhtisar TTS, provider, dan config `messages.tts`.
  </Card>
  <Card title="Konfigurasi" href="/id/gateway/configuration" icon="gear">
    Referensi config lengkap termasuk pengaturan `messages.tts`.
  </Card>
  <Card title="Provider" href="/id/providers" icon="grid">
    Semua provider OpenClaw yang terbundel.
  </Card>
  <Card title="Pemecahan masalah" href="/id/help/troubleshooting" icon="wrench">
    Masalah umum dan langkah debugging.
  </Card>
</CardGroup>
