---
read_when:
    - Anda menginginkan sintesis Azure Speech untuk balasan keluar
    - Anda memerlukan output voice note Ogg Opus native dari Azure Speech
summary: Text-to-speech Azure AI Speech untuk balasan OpenClaw
title: Azure Speech
x-i18n:
  refreshed_at: '2026-04-28T05:23:26Z'
  generated_at: "2026-04-26T11:37:15Z"
  model: gpt-5.4
  provider: openai
  source_hash: 59baf0865e0eba1076ae5c074b5978e1f5f104b3395c816c30c546da41a303b9
  source_path: providers/azure-speech.md
  workflow: 15
---

Azure Speech adalah provider text-to-speech Azure AI Speech. Di OpenClaw, provider ini
mensintesis audio balasan keluar sebagai MP3 secara default, Ogg/Opus native untuk voice
note, dan audio mulaw 8 kHz untuk saluran telepon seperti Voice Call.

OpenClaw menggunakan REST API Azure Speech secara langsung dengan SSML dan mengirim
format output milik provider melalui `X-Microsoft-OutputFormat`.

| Detail                  | Nilai                                                                                                          |
| ----------------------- | -------------------------------------------------------------------------------------------------------------- |
| Situs web               | [Azure AI Speech](https://azure.microsoft.com/products/ai-services/ai-speech)                                 |
| Dokumen                 | [Speech REST text-to-speech](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech) |
| Auth                    | `AZURE_SPEECH_KEY` plus `AZURE_SPEECH_REGION`                                                                  |
| Voice default           | `en-US-JennyNeural`                                                                                            |
| Output file default     | `audio-24khz-48kbitrate-mono-mp3`                                                                              |
| File voice-note default | `ogg-24khz-16bit-mono-opus`                                                                                    |

## Memulai

<Steps>
  <Step title="Buat resource Azure Speech">
    Di portal Azure, buat resource Speech. Salin **KEY 1** dari
    Resource Management > Keys and Endpoint, dan salin lokasi resource
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
              voice: "en-US-JennyNeural",
              lang: "en-US",
            },
          },
        },
      },
    }
    ```
  </Step>
  <Step title="Kirim pesan">
    Kirim balasan melalui saluran terhubung apa pun. OpenClaw mensintesis audio
    dengan Azure Speech dan mengirim MP3 untuk audio standar, atau Ogg/Opus ketika
    saluran mengharapkan voice note.
  </Step>
</Steps>

## Opsi konfigurasi

| Opsi                    | Path                                                        | Deskripsi                                                                                                 |
| ----------------------- | ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `apiKey`                | `messages.tts.providers.azure-speech.apiKey`                | Key resource Azure Speech. Fallback ke `AZURE_SPEECH_KEY`, `AZURE_SPEECH_API_KEY`, atau `SPEECH_KEY`.   |
| `region`                | `messages.tts.providers.azure-speech.region`                | Region resource Azure Speech. Fallback ke `AZURE_SPEECH_REGION` atau `SPEECH_REGION`.                    |
| `endpoint`              | `messages.tts.providers.azure-speech.endpoint`              | Override endpoint/base URL Azure Speech opsional.                                                         |
| `baseUrl`               | `messages.tts.providers.azure-speech.baseUrl`               | Override base URL Azure Speech opsional.                                                                  |
| `voice`                 | `messages.tts.providers.azure-speech.voice`                 | ShortName voice Azure (default `en-US-JennyNeural`).                                                      |
| `lang`                  | `messages.tts.providers.azure-speech.lang`                  | Kode bahasa SSML (default `en-US`).                                                                       |
| `outputFormat`          | `messages.tts.providers.azure-speech.outputFormat`          | Format output file audio (default `audio-24khz-48kbitrate-mono-mp3`).                                     |
| `voiceNoteOutputFormat` | `messages.tts.providers.azure-speech.voiceNoteOutputFormat` | Format output voice note (default `ogg-24khz-16bit-mono-opus`).                                           |

## Catatan

<AccordionGroup>
  <Accordion title="Autentikasi">
    Azure Speech menggunakan key resource Speech, bukan key Azure OpenAI. Key
    dikirim sebagai `Ocp-Apim-Subscription-Key`; OpenClaw menurunkan
    `https://<region>.tts.speech.microsoft.com` dari `region` kecuali Anda
    memberikan `endpoint` atau `baseUrl`.
  </Accordion>
  <Accordion title="Nama voice">
    Gunakan nilai `ShortName` voice Azure Speech, misalnya
    `en-US-JennyNeural`. Provider bawaan dapat mencantumkan voice melalui
    resource Speech yang sama dan memfilter voice yang ditandai deprecated atau retired.
  </Accordion>
  <Accordion title="Output audio">
    Azure menerima format output seperti `audio-24khz-48kbitrate-mono-mp3`,
    `ogg-24khz-16bit-mono-opus`, dan `riff-24khz-16bit-mono-pcm`. OpenClaw
    meminta Ogg/Opus untuk target `voice-note` agar saluran dapat mengirim
    gelembung suara native tanpa konversi MP3 tambahan.
  </Accordion>
  <Accordion title="Alias">
    `azure` diterima sebagai alias provider untuk PR yang sudah ada dan konfigurasi pengguna,
    tetapi konfigurasi baru sebaiknya menggunakan `azure-speech` agar tidak membingungkan dengan
    provider model Azure OpenAI.
  </Accordion>
</AccordionGroup>

## Terkait

<CardGroup cols={2}>
  <Card title="Text-to-speech" href="/id/tools/tts" icon="waveform-lines">
    Ringkasan TTS, provider, dan konfigurasi `messages.tts`.
  </Card>
  <Card title="Konfigurasi" href="/id/gateway/configuration" icon="gear">
    Referensi konfigurasi lengkap termasuk pengaturan `messages.tts`.
  </Card>
  <Card title="Provider" href="/id/providers" icon="grid">
    Semua provider OpenClaw bawaan.
  </Card>
  <Card title="Pemecahan masalah" href="/id/help/troubleshooting" icon="wrench">
    Masalah umum dan langkah debugging.
  </Card>
</CardGroup>
