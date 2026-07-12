---
read_when:
    - Anda ingin menggunakan Groq dengan OpenClaw
    - Anda memerlukan variabel lingkungan kunci API atau pilihan autentikasi CLI
    - Anda sedang mengonfigurasi transkripsi audio Whisper di Groq
summary: Penyiapan Groq (autentikasi + pemilihan model + transkripsi Whisper)
title: Groq
x-i18n:
    generated_at: "2026-07-12T14:33:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f04f9365127c72aa2f976f453e5d11657b19d6b4a57de1179b88924744db1dc1
    source_path: providers/groq.md
    workflow: 16
---

[Groq](https://groq.com) menyediakan inferensi berkecepatan sangat tinggi pada model berbobot terbuka (Llama, Gemma, Kimi, Qwen, GPT OSS, dan lainnya) menggunakan perangkat keras LPU khusus. Plugin Groq mendaftarkan penyedia percakapan yang kompatibel dengan OpenAI sekaligus penyedia pemahaman media audio.

| Properti                  | Nilai                                    |
| ------------------------- | ---------------------------------------- |
| ID penyedia               | `groq`                                   |
| Plugin                    | paket eksternal resmi                    |
| Variabel lingkungan autentikasi | `GROQ_API_KEY`                    |
| API                       | Kompatibel dengan OpenAI (`openai-completions`) |
| URL dasar                 | `https://api.groq.com/openai/v1`         |
| Transkripsi audio         | `whisper-large-v3-turbo` (bawaan)        |
| Bawaan percakapan yang disarankan | `groq/llama-3.3-70b-versatile`   |

## Instal Plugin

Instal Plugin resmi, lalu mulai ulang Gateway:

```bash
openclaw plugins install @openclaw/groq-provider
openclaw gateway restart
```

## Memulai

<Steps>
  <Step title="Dapatkan kunci API">
    Buat kunci API di [console.groq.com/keys](https://console.groq.com/keys).
  </Step>
  <Step title="Tetapkan kunci API">
    ```bash
export GROQ_API_KEY=gsk_...
```
  </Step>
  <Step title="Tetapkan model bawaan">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "groq/llama-3.3-70b-versatile" },
        },
      },
    }
    ```
  </Step>
  <Step title="Verifikasi katalog dapat diakses">
    ```bash
    openclaw models list --provider groq
    ```
  </Step>
</Steps>

### Contoh berkas konfigurasi

```json5
{
  env: { GROQ_API_KEY: "gsk_..." },
  agents: {
    defaults: {
      model: { primary: "groq/llama-3.3-70b-versatile" },
    },
  },
}
```

## Katalog bawaan

OpenClaw menyertakan katalog Groq berbasis manifes dengan entri penalaran dan nonpenalaran. Jalankan `openclaw models list --provider groq` untuk melihat baris statis bagi versi yang Anda instal, atau periksa [console.groq.com/docs/models](https://console.groq.com/docs/models) untuk daftar resmi dari Groq.

| Referensi model                                  | Nama                    | Penalaran | Masukan      | Konteks |
| ------------------------------------------------ | ----------------------- | --------- | ------------ | ------- |
| `groq/llama-3.3-70b-versatile`                   | Llama 3.3 70B Versatile | tidak     | teks         | 131,072 |
| `groq/llama-3.1-8b-instant`                      | Llama 3.1 8B Instant    | tidak     | teks         | 131,072 |
| `groq/meta-llama/llama-4-scout-17b-16e-instruct` | Llama 4 Scout 17B       | tidak     | teks + gambar | 131,072 |
| `groq/openai/gpt-oss-120b`                       | GPT OSS 120B            | ya        | teks         | 131,072 |
| `groq/openai/gpt-oss-20b`                        | GPT OSS 20B             | ya        | teks         | 131,072 |
| `groq/openai/gpt-oss-safeguard-20b`              | GPT OSS Keamanan 20B    | ya        | teks         | 131,072 |
| `groq/qwen/qwen3-32b`                            | Qwen3 32B               | ya        | teks         | 131,072 |
| `groq/groq/compound`                             | Compound                | ya        | teks         | 131,072 |
| `groq/groq/compound-mini`                        | Compound Mini           | ya        | teks         | 131,072 |

<Tip>
  Katalog berkembang pada setiap rilis OpenClaw. `openclaw models list --provider groq` menampilkan baris yang dikenali oleh versi yang Anda instal; bandingkan dengan [console.groq.com/docs/models](https://console.groq.com/docs/models) untuk model yang baru ditambahkan atau tidak lagi direkomendasikan.
</Tip>

## Model penalaran

Model penalaran Groq (`reasoning: true` dalam tabel di atas) memetakan tingkat `/think` bersama milik OpenClaw ke nilai `reasoning_effort` berupa `low`, `medium`, atau `high`. `/think off` atau `/think none` menghilangkan `reasoning_effort` dari permintaan, alih-alih mengirimkan nilai yang dinonaktifkan.

Lihat [Mode berpikir](/id/tools/thinking) untuk tingkat `/think` bersama dan cara OpenClaw menerjemahkannya untuk setiap penyedia.

## Transkripsi audio

Plugin Groq juga mendaftarkan **penyedia pemahaman media audio** agar pesan suara dapat ditranskripsikan melalui antarmuka bersama `tools.media.audio`.

| Properti                | Nilai                                     |
| ----------------------- | ----------------------------------------- |
| Jalur konfigurasi bersama | `tools.media.audio`                     |
| URL dasar bawaan        | `https://api.groq.com/openai/v1`          |
| Model bawaan            | `whisper-large-v3-turbo`                  |
| Prioritas otomatis      | 20                                        |
| Titik akhir API         | `/audio/transcriptions` yang kompatibel dengan OpenAI |

Untuk menjadikan Groq sebagai backend audio bawaan:

```json5
{
  tools: {
    media: {
      audio: {
        models: [{ provider: "groq" }],
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Ketersediaan lingkungan untuk daemon">
    Jika Gateway berjalan sebagai layanan terkelola (launchd, systemd, Docker), `GROQ_API_KEY` harus terlihat oleh proses tersebut — bukan hanya oleh shell interaktif Anda.

    <Warning>
      Kunci yang hanya diekspor dalam shell interaktif tidak akan tersedia bagi daemon launchd atau systemd, kecuali lingkungan tersebut juga diimpor ke sana. Tetapkan kunci di `~/.openclaw/.env` atau melalui `env.shellEnv` agar dapat dibaca oleh proses Gateway.
    </Warning>

  </Accordion>

  <Accordion title="ID model Groq khusus">
    OpenClaw menerima ID model Groq apa pun saat runtime. Gunakan ID persis seperti yang ditampilkan oleh Groq dan tambahkan prefiks `groq/`. Katalog statis mencakup kasus umum; ID yang tidak tercantum dalam katalog akan menggunakan templat bawaan yang kompatibel dengan OpenAI.

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "groq/<your-model-id>" },
        },
      },
    }
    ```

  </Accordion>
</AccordionGroup>

## Terkait

<CardGroup cols={2}>
  <Card title="Penyedia model" href="/id/concepts/model-providers" icon="layers">
    Memilih penyedia, referensi model, dan perilaku pengalihan kegagalan.
  </Card>
  <Card title="Mode berpikir" href="/id/tools/thinking" icon="brain">
    Tingkat upaya penalaran dan interaksi kebijakan penyedia.
  </Card>
  <Card title="Referensi konfigurasi" href="/id/gateway/configuration-reference" icon="gear">
    Skema konfigurasi lengkap termasuk pengaturan penyedia dan audio.
  </Card>
  <Card title="Konsol Groq" href="https://console.groq.com" icon="arrow-up-right-from-square">
    Dasbor Groq, dokumentasi API, dan harga.
  </Card>
</CardGroup>
