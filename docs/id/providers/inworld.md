---
read_when:
    - Anda ingin sintesis suara Inworld untuk balasan keluar
    - Anda memerlukan keluaran telefoni PCM atau catatan suara OGG_OPUS dari Inworld
summary: Teks-ke-ucapan streaming Inworld untuk balasan OpenClaw
title: Inworld
x-i18n:
    generated_at: "2026-07-12T14:36:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 443797be3eec0f63c52a7b6b697abb85b15db9b878174f6f6b70ddec474e6326
    source_path: providers/inworld.md
    workflow: 16
---

Inworld adalah penyedia text-to-speech (TTS) streaming. Di OpenClaw, Inworld menyintesis audio balasan keluar (MP3 secara default, OGG_OPUS untuk pesan suara) dan audio PCM mentah untuk saluran telepon seperti Voice Call.

OpenClaw mengirimkan permintaan ke endpoint TTS streaming Inworld, menggabungkan potongan audio base64 yang dikembalikan menjadi satu buffer, lalu menyerahkan hasilnya ke pipeline audio balasan standar.

| Properti       | Nilai                                                           |
| -------------- | --------------------------------------------------------------- |
| ID penyedia    | `inworld`                                                       |
| Plugin         | paket eksternal resmi (`@openclaw/inworld-speech`)              |
| Kontrak        | `speechProviders` (hanya TTS)                                   |
| Variabel autentikasi | `INWORLD_API_KEY` (HTTP Basic, kredensial dasbor Base64)   |
| URL dasar      | `https://api.inworld.ai`                                        |
| Suara default  | `Sarah`                                                         |
| Model default  | `inworld-tts-1.5-max`                                           |
| Keluaran       | MP3 (default), OGG_OPUS (pesan suara), PCM 22050 Hz (telepon)   |
| Situs web      | [inworld.ai](https://inworld.ai)                                |
| Dokumentasi    | [docs.inworld.ai/tts/tts](https://docs.inworld.ai/tts/tts)      |

## Instal Plugin

```bash
openclaw plugins install @openclaw/inworld-speech
openclaw gateway restart
```

## Memulai

<Steps>
  <Step title="Tetapkan kunci API Anda">
    Salin kredensial dari dasbor Inworld Anda (Workspace > API Keys) dan tetapkan sebagai variabel lingkungan. Nilainya dikirim apa adanya sebagai kredensial HTTP Basic, jadi jangan mengodekannya lagi dengan Base64 atau mengubahnya menjadi token bearer.

    ```bash
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
    Kirim balasan melalui saluran apa pun yang terhubung. OpenClaw menyintesis audio dengan Inworld dan mengirimkannya sebagai MP3 (atau OGG_OPUS ketika saluran mengharapkan pesan suara).
  </Step>
</Steps>

## Opsi konfigurasi

| Opsi          | Jalur                                        | Deskripsi                                                           |
| ------------- | -------------------------------------------- | ------------------------------------------------------------------- |
| `apiKey`      | `messages.tts.providers.inworld.apiKey`      | Kredensial dasbor Base64. Menggunakan `INWORLD_API_KEY` sebagai cadangan. |
| `baseUrl`     | `messages.tts.providers.inworld.baseUrl`     | Ganti URL dasar API Inworld (default `https://api.inworld.ai`).     |
| `voiceId`     | `messages.tts.providers.inworld.voiceId`     | Pengidentifikasi suara (default `Sarah`). Alias lama: `speakerVoiceId`. |
| `modelId`     | `messages.tts.providers.inworld.modelId`     | ID model TTS (default `inworld-tts-1.5-max`).                       |
| `temperature` | `messages.tts.providers.inworld.temperature` | Suhu sampling, lebih dari `0` hingga `2` (opsional).                |

## Catatan

<AccordionGroup>
  <Accordion title="Autentikasi">
    Inworld menggunakan autentikasi HTTP Basic dengan satu string kredensial yang dikodekan dalam Base64. Salin apa adanya dari dasbor Inworld. Penyedia mengirimkannya sebagai `Authorization: Basic <apiKey>` tanpa pengodean lebih lanjut, jadi jangan mengodekannya sendiri dengan Base64 dan jangan memberikan token bergaya bearer. Lihat [catatan autentikasi TTS](/id/tools/tts#inworld-primary) untuk peringatan yang sama.
  </Accordion>
  <Accordion title="Model">
    ID model yang didukung: `inworld-tts-1.5-max` (default), `inworld-tts-1.5-mini`, `inworld-tts-1-max`, `inworld-tts-1`.
  </Accordion>
  <Accordion title="Keluaran audio">
    Balasan menggunakan MP3 secara default. Ketika target saluran adalah `voice-note`, OpenClaw meminta `OGG_OPUS` dari Inworld agar audio diputar sebagai gelembung pesan suara asli. Sintesis telepon menggunakan `PCM` mentah pada 22050 Hz untuk memasok audio ke penghubung telepon.
  </Accordion>
  <Accordion title="Endpoint khusus">
    Ganti host API dengan `messages.tts.providers.inworld.baseUrl`. Garis miring di akhir akan dihapus sebelum permintaan dikirim.
  </Accordion>
</AccordionGroup>

## Terkait

<CardGroup cols={2}>
  <Card title="Text-to-speech" href="/id/tools/tts" icon="waveform-lines">
    Ikhtisar TTS, penyedia, dan konfigurasi `messages.tts`.
  </Card>
  <Card title="Konfigurasi" href="/id/gateway/configuration" icon="gear">
    Referensi konfigurasi lengkap termasuk pengaturan `messages.tts`.
  </Card>
  <Card title="Penyedia" href="/id/providers" icon="grid">
    Semua penyedia OpenClaw yang didukung.
  </Card>
  <Card title="Pemecahan masalah" href="/id/help/troubleshooting" icon="wrench">
    Masalah umum dan langkah-langkah penelusuran kesalahan.
  </Card>
</CardGroup>
