---
read_when:
    - Anda ingin menggunakan ucapan-ke-teks Deepgram untuk lampiran audio
    - Anda menginginkan transkripsi streaming Deepgram untuk Panggilan Suara
    - Anda memerlukan contoh konfigurasi Deepgram singkat
summary: Transkripsi Deepgram untuk catatan suara masuk
title: Deepgram
x-i18n:
    generated_at: "2026-07-16T18:31:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 74652e089899423d117dae6267e7c9af09e52ec91ee15e3532fcb2d705f43099
    source_path: providers/deepgram.md
    workflow: 16
---

Deepgram adalah API ucapan-ke-teks. OpenClaw menggunakannya untuk transkripsi
audio/catatan suara masuk melalui `tools.media.audio` dan untuk STT streaming Panggilan Suara
melalui `plugins.entries.voice-call.config.streaming`.

Transkripsi batch mengunggah berkas audio lengkap ke Deepgram dan memasukkan
transkrip ke dalam alur pemrosesan balasan (blok `{{Transcript}}` + `[Audio]`).
Streaming Panggilan Suara meneruskan frame G.711 u-law langsung melalui endpoint
WebSocket `listen` Deepgram dan menghasilkan transkrip parsial/final saat
Deepgram mengembalikannya.

| Detail        | Nilai                                                      |
| ------------- | ---------------------------------------------------------- |
| Situs web     | [deepgram.com](https://deepgram.com)                       |
| Dokumentasi   | [developers.deepgram.com](https://developers.deepgram.com) |
| Autentikasi   | `DEEPGRAM_API_KEY`                                         |
| Model default | `nova-3`                                         |

## Memulai

<Steps>
  <Step title="Tetapkan kunci API Anda">
    ```bash
    DEEPGRAM_API_KEY=dg_...
    ```
  </Step>
  <Step title="Aktifkan penyedia audio">
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
  <Step title="Kirim catatan suara">
    Kirim pesan audio melalui saluran mana pun yang terhubung. OpenClaw
    mentranskripsikannya melalui Deepgram dan memasukkan transkrip ke dalam alur
    pemrosesan balasan.
  </Step>
</Steps>

## Opsi konfigurasi

| Opsi       | Jalur                                 | Deskripsi                                  |
| ---------- | ------------------------------------- | ------------------------------------------ |
| `model`    | `tools.media.audio.models[].model`    | ID model Deepgram (default: `nova-3`) |
| `language` | `tools.media.audio.models[].language` | Petunjuk bahasa (opsional)                  |

`providerOptions.deepgram` menggabungkan parameter kueri tambahan secara langsung ke
dalam permintaan `/listen` Deepgram, sehingga nama parameter apa pun
yang didukung Deepgram dapat digunakan (misalnya `detect_language`,
`punctuate`, `smart_format`):

<Tabs>
  <Tab title="Dengan petunjuk bahasa">
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
  <Tab title="Dengan opsi Deepgram">
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

## STT streaming Panggilan Suara

Plugin `deepgram` bawaan juga mendaftarkan penyedia transkripsi waktu nyata
untuk Plugin Panggilan Suara.

| Pengaturan      | Jalur konfigurasi                                                       | Default                                      |
| --------------- | ----------------------------------------------------------------------- | -------------------------------------------- |
| Kunci API       | `plugins.entries.voice-call.config.streaming.providers.deepgram.apiKey` | Menggunakan `DEEPGRAM_API_KEY` sebagai cadangan |
| URL dasar       | `...deepgram.baseUrl`                                                   | `DEEPGRAM_BASE_URL` atau API publik Deepgram |
| Model           | `...deepgram.model`                                                     | `nova-3`                           |
| Bahasa          | `...deepgram.language`                                                  | (tidak ditetapkan)                           |
| Pengodean       | `...deepgram.encoding`                                                  | `mulaw`                           |
| Laju sampel     | `...deepgram.sampleRate`                                                | `8000`                           |
| Penentuan akhir | `...deepgram.endpointingMs`                                             | `800`                           |
| Hasil sementara | `...deepgram.interimResults`                                            | `true`                           |

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

Untuk [endpoint khusus Deepgram](https://developers.deepgram.com/reference/custom-endpoints),
tetapkan `baseUrl` ke root endpoint, termasuk jalur dasar apa pun tetapi tanpa
`/listen`. Endpoint waktu nyata menerima `http://`,
`https://`, `ws://`, dan `wss://`. HTTP dipetakan
ke WS, HTTPS dipetakan ke WSS, dan skema WebSocket eksplisit tetap tidak berubah.
URL yang tidak valid dan skema lainnya akan gagal saat penyiapan sesi.

<Note>
Panggilan Suara menerima audio telefoni sebagai G.711 u-law 8 kHz. Penyedia
streaming Deepgram menggunakan `encoding: "mulaw"` dan `sampleRate: 8000`
secara default, sehingga frame media Twilio dapat diteruskan secara langsung.
</Note>

## Catatan

<AccordionGroup>
  <Accordion title="Autentikasi">
    Autentikasi mengikuti urutan autentikasi penyedia standar. `DEEPGRAM_API_KEY`
    adalah jalur paling sederhana.
  </Accordion>
  <Accordion title="Proksi dan endpoint khusus">
    Ganti endpoint atau header dengan `tools.media.audio.baseUrl` dan
    `tools.media.audio.headers` saat menggunakan proksi.
  </Accordion>
  <Accordion title="Perilaku keluaran">
    Keluaran mengikuti aturan audio yang sama seperti penyedia lain (batas ukuran,
    batas waktu, penyisipan transkrip).
  </Accordion>
</AccordionGroup>

## Terkait

<CardGroup cols={2}>
  <Card title="Alat media" href="/id/tools/media-overview" icon="photo-film">
    Ikhtisar alur pemrosesan audio, gambar, dan video.
  </Card>
  <Card title="Konfigurasi" href="/id/gateway/configuration" icon="gear">
    Referensi konfigurasi lengkap, termasuk pengaturan alat media.
  </Card>
  <Card title="Pemecahan masalah" href="/id/help/troubleshooting" icon="wrench">
    Masalah umum dan langkah-langkah debugging.
  </Card>
  <Card title="Pertanyaan umum" href="/id/help/faq" icon="circle-question">
    Pertanyaan yang sering diajukan tentang penyiapan OpenClaw.
  </Card>
</CardGroup>
