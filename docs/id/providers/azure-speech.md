---
read_when:
    - Anda menginginkan sintesis Azure Speech untuk balasan keluar
    - Anda memerlukan keluaran catatan suara Ogg Opus native dari Azure Speech
summary: Text-to-speech Azure AI Speech untuk balasan OpenClaw
title: Azure Speech
x-i18n:
    generated_at: "2026-06-27T18:02:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c14b1f3c2fda9b2f820e537d7133b1dbf71573b7d735207c6a4ca19432a8d8c3
    source_path: providers/azure-speech.md
    workflow: 16
---

Azure Speech adalah penyedia teks-ke-ucapan Azure AI Speech. Di OpenClaw, penyedia ini
mensintesis audio balasan keluar sebagai MP3 secara default, Ogg/Opus native untuk
catatan suara, dan audio mulaw 8 kHz untuk kanal telepon seperti Panggilan Suara.

OpenClaw menggunakan Azure Speech REST API secara langsung dengan SSML dan mengirim
format keluaran milik penyedia melalui `X-Microsoft-OutputFormat`.

| Detail                  | Nilai                                                                                                          |
| ----------------------- | -------------------------------------------------------------------------------------------------------------- |
| Situs web               | [Azure AI Speech](https://azure.microsoft.com/products/ai-services/ai-speech)                                  |
| Dokumentasi             | [Speech REST text-to-speech](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech) |
| Autentikasi             | `AZURE_SPEECH_KEY` plus `AZURE_SPEECH_REGION`                                                                  |
| Suara default           | `en-US-JennyNeural`                                                                                            |
| Keluaran file default   | `audio-24khz-48kbitrate-mono-mp3`                                                                              |
| File catatan suara default | `ogg-24khz-16bit-mono-opus`                                                                                 |

## Memulai

<Steps>
  <Step title="Buat sumber daya Azure Speech">
    Di portal Azure, buat sumber daya Speech. Salin **KEY 1** dari
    Resource Management > Keys and Endpoint, dan salin lokasi sumber daya
    seperti `eastus`.

    ```
    AZURE_SPEECH_KEY=<speech-resource-key>
    AZURE_SPEECH_REGION=eastus
    ```

  </Step>
  <Step title="Pilih Azure Speech di messages.tts">
    ```json5
    {
      messages: {
        tts: {
          auto: "always",
          provider: "azure-speech",
          providers: {
            "azure-speech": {
              speakerVoice: "en-US-JennyNeural",
              lang: "en-US",
            },
          },
        },
      },
    }
    ```
  </Step>
  <Step title="Kirim pesan">
    Kirim balasan melalui kanal apa pun yang terhubung. OpenClaw mensintesis audio
    dengan Azure Speech dan mengirimkan MP3 untuk audio standar, atau Ogg/Opus saat
    kanal mengharapkan catatan suara.
  </Step>
</Steps>

## Opsi konfigurasi

| Opsi                    | Jalur                                                       | Deskripsi                                                                                             |
| ----------------------- | ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `apiKey`                | `messages.tts.providers.azure-speech.apiKey`                | Kunci sumber daya Azure Speech. Beralih ke `AZURE_SPEECH_KEY`, `AZURE_SPEECH_API_KEY`, atau `SPEECH_KEY`. |
| `region`                | `messages.tts.providers.azure-speech.region`                | Wilayah sumber daya Azure Speech. Beralih ke `AZURE_SPEECH_REGION` atau `SPEECH_REGION`.              |
| `endpoint`              | `messages.tts.providers.azure-speech.endpoint`              | Penggantian endpoint/URL dasar Azure Speech opsional.                                                 |
| `baseUrl`               | `messages.tts.providers.azure-speech.baseUrl`               | Penggantian URL dasar Azure Speech opsional.                                                          |
| `speakerVoice`          | `messages.tts.providers.azure-speech.speakerVoice`          | ShortName suara Azure (default `en-US-JennyNeural`). Alias lama: `voice`.                             |
| `lang`                  | `messages.tts.providers.azure-speech.lang`                  | Kode bahasa SSML (default `en-US`).                                                                  |
| `outputFormat`          | `messages.tts.providers.azure-speech.outputFormat`          | Format keluaran file audio (default `audio-24khz-48kbitrate-mono-mp3`).                               |
| `voiceNoteOutputFormat` | `messages.tts.providers.azure-speech.voiceNoteOutputFormat` | Format keluaran catatan suara (default `ogg-24khz-16bit-mono-opus`).                                  |

## Catatan

<AccordionGroup>
  <Accordion title="Autentikasi">
    Azure Speech menggunakan kunci sumber daya Speech, bukan kunci Azure OpenAI. Kunci
    dikirim sebagai `Ocp-Apim-Subscription-Key`; OpenClaw menurunkan
    `https://<region>.tts.speech.microsoft.com` dari `region` kecuali Anda
    menyediakan `endpoint` atau `baseUrl`.
  </Accordion>
  <Accordion title="Nama suara">
    Gunakan nilai `ShortName` suara Azure Speech, misalnya
    `en-US-JennyNeural`. Penyedia bawaan dapat mencantumkan suara melalui
    sumber daya Speech yang sama dan memfilter suara yang ditandai usang atau dihentikan.
  </Accordion>
  <Accordion title="Keluaran audio">
    Azure menerima format keluaran seperti `audio-24khz-48kbitrate-mono-mp3`,
    `ogg-24khz-16bit-mono-opus`, dan `riff-24khz-16bit-mono-pcm`. OpenClaw
    meminta Ogg/Opus untuk target `voice-note` agar kanal dapat mengirim balon
    suara native tanpa konversi MP3 tambahan.
  </Accordion>
  <Accordion title="Alias">
    `azure` diterima sebagai alias penyedia untuk PR dan konfigurasi pengguna yang ada,
    tetapi konfigurasi baru sebaiknya menggunakan `azure-speech` untuk menghindari kebingungan dengan penyedia model Azure
    OpenAI.
  </Accordion>
</AccordionGroup>

## Terkait

<CardGroup cols={2}>
  <Card title="Teks-ke-ucapan" href="/id/tools/tts" icon="waveform-lines">
    Ikhtisar TTS, penyedia, dan konfigurasi `messages.tts`.
  </Card>
  <Card title="Konfigurasi" href="/id/gateway/configuration" icon="gear">
    Referensi konfigurasi lengkap termasuk pengaturan `messages.tts`.
  </Card>
  <Card title="Penyedia" href="/id/providers" icon="grid">
    Semua penyedia bawaan OpenClaw.
  </Card>
  <Card title="Pemecahan masalah" href="/id/help/troubleshooting" icon="wrench">
    Masalah umum dan langkah-langkah debugging.
  </Card>
</CardGroup>
