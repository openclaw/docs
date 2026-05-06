---
read_when:
    - Anda menginginkan sintesis ucapan Inworld untuk balasan keluar
    - Anda memerlukan keluaran telefoni PCM atau catatan suara OGG_OPUS dari Inworld
summary: Streaming teks-ke-ucapan Inworld untuk balasan OpenClaw
title: Inworld
x-i18n:
    generated_at: "2026-05-06T09:25:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: caf291bab5da946262ecaf4263c188c168be08ddb43fda72f250b8f8db87b3ff
    source_path: providers/inworld.md
    workflow: 16
---

Inworld adalah penyedia text-to-speech (TTS) streaming. Di OpenClaw, penyedia ini
mensintesis audio balasan keluar (MP3 secara default, OGG_OPUS untuk catatan suara)
dan audio PCM untuk saluran telefoni seperti Voice Call.

OpenClaw mengirimkan permintaan ke endpoint TTS streaming Inworld, menggabungkan
potongan audio base64 yang dikembalikan menjadi satu buffer, lalu menyerahkan hasilnya ke
pipeline audio balasan standar.

| Properti      | Nilai                                                           |
| ------------- | --------------------------------------------------------------- |
| ID penyedia   | `inworld`                                                       |
| Plugin        | dibundel, `enabledByDefault: true`                              |
| Kontrak       | `speechProviders` (hanya TTS)                                   |
| Variabel env autentikasi | `INWORLD_API_KEY` (HTTP Basic, kredensial dashboard Base64) |
| URL dasar     | `https://api.inworld.ai`                                        |
| Suara default | `Sarah`                                                         |
| Model default | `inworld-tts-1.5-max`                                           |
| Output        | MP3 (default), OGG_OPUS (catatan suara), PCM 22050 Hz (telefoni) |
| Situs web     | [inworld.ai](https://inworld.ai)                                |
| Dokumentasi   | [docs.inworld.ai/tts/tts](https://docs.inworld.ai/tts/tts)      |

## Memulai

<Steps>
  <Step title="Tetapkan kunci API Anda">
    Salin kredensial dari dashboard Inworld Anda (Workspace > API Keys)
    dan tetapkan sebagai variabel env. Nilainya dikirim apa adanya sebagai kredensial
    HTTP Basic, jadi jangan enkode Base64 lagi atau mengubahnya menjadi token
    bearer.

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
    Kirim balasan melalui saluran mana pun yang terhubung. OpenClaw mensintesis
    audio dengan Inworld dan mengirimkannya sebagai MP3 (atau OGG_OPUS saat saluran
    mengharapkan catatan suara).
  </Step>
</Steps>

## Opsi konfigurasi

| Opsi          | Path                                         | Deskripsi                                                         |
| ------------- | -------------------------------------------- | ----------------------------------------------------------------- |
| `apiKey`      | `messages.tts.providers.inworld.apiKey`      | Kredensial dashboard Base64. Beralih ke `INWORLD_API_KEY` jika tidak tersedia. |
| `baseUrl`     | `messages.tts.providers.inworld.baseUrl`     | Timpa URL dasar API Inworld (default `https://api.inworld.ai`).   |
| `voiceId`     | `messages.tts.providers.inworld.voiceId`     | Pengidentifikasi suara (default `Sarah`).                         |
| `modelId`     | `messages.tts.providers.inworld.modelId`     | ID model TTS (default `inworld-tts-1.5-max`).                      |
| `temperature` | `messages.tts.providers.inworld.temperature` | Suhu sampling `0..2` (opsional).                                  |

## Catatan

<AccordionGroup>
  <Accordion title="Autentikasi">
    Inworld menggunakan autentikasi HTTP Basic dengan satu string kredensial yang
    dienkode Base64. Salin apa adanya dari dashboard Inworld. Penyedia mengirimkannya
    sebagai `Authorization: Basic <apiKey>` tanpa encoding tambahan apa pun, jadi
    jangan enkode Base64 sendiri dan jangan berikan token bergaya bearer.
    Lihat [catatan autentikasi TTS](/id/tools/tts#inworld-primary) untuk keterangan yang sama.
  </Accordion>
  <Accordion title="Model">
    ID model yang didukung: `inworld-tts-1.5-max` (default),
    `inworld-tts-1.5-mini`, `inworld-tts-1-max`, `inworld-tts-1`.
  </Accordion>
  <Accordion title="Output audio">
    Balasan menggunakan MP3 secara default. Saat target saluran adalah `voice-note`,
    OpenClaw meminta `OGG_OPUS` dari Inworld agar audio diputar sebagai gelembung
    suara native. Sintesis telefoni menggunakan `PCM` mentah pada 22050 Hz untuk
    memberi masukan ke bridge telefoni.
  </Accordion>
  <Accordion title="Endpoint kustom">
    Timpa host API dengan `messages.tts.providers.inworld.baseUrl`.
    Garis miring di akhir dihapus sebelum permintaan dikirim.
  </Accordion>
</AccordionGroup>

## Terkait

<CardGroup cols={2}>
  <Card title="Text-to-speech" href="/id/tools/tts" icon="waveform-lines">
    Ringkasan TTS, penyedia, dan konfigurasi `messages.tts`.
  </Card>
  <Card title="Konfigurasi" href="/id/gateway/configuration" icon="gear">
    Referensi konfigurasi lengkap termasuk pengaturan `messages.tts`.
  </Card>
  <Card title="Penyedia" href="/id/providers" icon="grid">
    Semua penyedia OpenClaw yang dibundel.
  </Card>
  <Card title="Pemecahan masalah" href="/id/help/troubleshooting" icon="wrench">
    Masalah umum dan langkah-langkah debugging.
  </Card>
</CardGroup>
