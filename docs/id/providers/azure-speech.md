---
read_when:
    - Anda ingin sintesis suara Azure untuk balasan keluar
    - Anda memerlukan keluaran catatan suara Ogg Opus native dari Azure Speech
summary: Text-to-speech Azure AI Speech untuk balasan OpenClaw
title: Azure Speech
x-i18n:
    generated_at: "2026-07-12T14:34:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 61e700724dbb7cb8c217f91485cea0eec776698e439f6c6985dac58dc4cafc01
    source_path: providers/azure-speech.md
    workflow: 16
---

Azure Speech adalah penyedia text-to-speech Azure AI Speech bawaan. OpenClaw
memanggil REST API Azure Speech secara langsung dengan SSML, menyintesis MP3 untuk
balasan standar, Ogg/Opus native untuk catatan suara, dan mulaw 8 kHz untuk
saluran telefoni seperti Voice Call. Permintaan mengirimkan format keluaran milik
penyedia melalui header `X-Microsoft-OutputFormat`.

| Detail                    | Nilai                                                                                                          |
| ------------------------- | -------------------------------------------------------------------------------------------------------------- |
| ID penyedia               | `azure-speech` (alias: `azure`)                                                                                |
| Situs web                 | [Azure AI Speech](https://azure.microsoft.com/products/ai-services/ai-speech)                                  |
| Dokumentasi               | [Text-to-speech REST Speech](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech) |
| Autentikasi               | `AZURE_SPEECH_KEY` ditambah `AZURE_SPEECH_REGION`                                                              |
| Suara default             | `en-US-JennyNeural`                                                                                            |
| Keluaran berkas default   | `audio-24khz-48kbitrate-mono-mp3`                                                                              |
| Berkas catatan suara default | `ogg-24khz-16bit-mono-opus`                                                                                 |

## Memulai

<Steps>
  <Step title="Buat sumber daya Azure Speech">
    Di portal Azure, buat sumber daya Speech. Salin **KEY 1** dari
    Resource Management > Keys and Endpoint, lalu salin lokasi sumber daya
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
    Kirim balasan melalui saluran apa pun yang terhubung. OpenClaw menyintesis audio
    dengan Azure Speech dan mengirimkan MP3 untuk audio standar, atau Ogg/Opus saat
    saluran mengharapkan catatan suara.
  </Step>
</Steps>

## Opsi konfigurasi

Semua opsi berada di bawah `messages.tts.providers["azure-speech"]`.

| Opsi                    | Deskripsi                                                                                                          |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `apiKey`                | Kunci sumber daya Azure Speech. Menggunakan `AZURE_SPEECH_KEY`, `AZURE_SPEECH_API_KEY`, atau `SPEECH_KEY` sebagai cadangan. |
| `region`                | Wilayah sumber daya Azure Speech. Menggunakan `AZURE_SPEECH_REGION` atau `SPEECH_REGION` sebagai cadangan.          |
| `endpoint`              | Penggantian endpoint Azure Speech opsional. Menggunakan `AZURE_SPEECH_ENDPOINT` sebagai cadangan.                  |
| `baseUrl`               | Penggantian URL dasar Azure Speech opsional.                                                                       |
| `voice`                 | ShortName suara Azure (default `en-US-JennyNeural`). Alias lama: `voiceId`.                                        |
| `lang`                  | Kode bahasa SSML (default `en-US`).                                                                                |
| `outputFormat`          | Format keluaran berkas audio (default `audio-24khz-48kbitrate-mono-mp3`).                                          |
| `voiceNoteOutputFormat` | Format keluaran catatan suara (default `ogg-24khz-16bit-mono-opus`).                                               |
| `timeoutMs`             | Penggantian batas waktu permintaan dalam milidetik. Menggunakan `messages.tts.timeoutMs` global sebagai cadangan.   |

Penyedia dianggap telah dikonfigurasi setelah `apiKey` ditetapkan bersama salah satu dari
`region`, `endpoint`, atau `baseUrl`. Variabel lingkungan hanya diperiksa sebagai cadangan
untuk kunci konfigurasi yang belum ditetapkan.

## Catatan

<AccordionGroup>
  <Accordion title="Autentikasi">
    Azure Speech menggunakan kunci sumber daya Speech, bukan kunci Azure OpenAI. Kunci
    dikirim sebagai `Ocp-Apim-Subscription-Key`; OpenClaw memperoleh
    `https://<region>.tts.speech.microsoft.com` dari `region`, kecuali Anda
    menyediakan `endpoint` atau `baseUrl`.
  </Accordion>
  <Accordion title="Nama suara">
    Gunakan nilai `ShortName` suara Azure Speech, misalnya
    `en-US-JennyNeural`. Penyedia bawaan dapat mencantumkan suara melalui
    sumber daya Speech yang sama dan menyaring suara yang ditandai sebagai usang, dihentikan,
    atau dinonaktifkan.
  </Accordion>
  <Accordion title="Keluaran audio">
    Azure menerima format keluaran seperti `audio-24khz-48kbitrate-mono-mp3`,
    `ogg-24khz-16bit-mono-opus`, dan `riff-24khz-16bit-mono-pcm`. OpenClaw
    meminta Ogg/Opus untuk target `voice-note` agar saluran dapat mengirim gelembung
    suara native tanpa konversi MP3 tambahan, dan memaksakan
    `raw-8khz-8bit-mono-mulaw` untuk target telefoni.
  </Accordion>
  <Accordion title="Alias">
    `azure` diterima sebagai alias penyedia untuk konfigurasi yang sudah ada, tetapi konfigurasi
    baru sebaiknya menggunakan `azure-speech` untuk menghindari kebingungan dengan penyedia model
    Azure OpenAI.
  </Accordion>
</AccordionGroup>

## Terkait

<CardGroup cols={2}>
  <Card title="Text-to-speech" href="/id/tools/tts" icon="waveform-lines">
    Ikhtisar TTS, penyedia, dan konfigurasi `messages.tts`.
  </Card>
  <Card title="Konfigurasi" href="/id/gateway/configuration" icon="gear">
    Referensi konfigurasi lengkap, termasuk pengaturan `messages.tts`.
  </Card>
  <Card title="Penyedia" href="/id/providers" icon="grid">
    Semua penyedia OpenClaw bawaan.
  </Card>
  <Card title="Pemecahan masalah" href="/id/help/troubleshooting" icon="wrench">
    Masalah umum dan langkah-langkah penelusuran kesalahan.
  </Card>
</CardGroup>
