---
read_when:
    - Anda ingin menggunakan Groq dengan OpenClaw
    - Anda memerlukan variabel lingkungan untuk kunci API atau pilihan autentikasi CLI
    - Anda sedang mengonfigurasi transkripsi audio Whisper di Groq
summary: Penyiapan Groq (autentikasi + pemilihan model + transkripsi Whisper)
title: Groq
x-i18n:
    generated_at: "2026-05-06T09:25:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 53ce6d702eb1e0abba0cf1efd3e86c766444f5e7cbf26c312b94a74fa410b700
    source_path: providers/groq.md
    workflow: 16
---

[Groq](https://groq.com) menyediakan inferensi sangat cepat pada model berbobot terbuka (Llama, Gemma, Kimi, Qwen, GPT OSS, dan lainnya) menggunakan perangkat keras LPU khusus. OpenClaw menyertakan Plugin Groq bawaan yang mendaftarkan penyedia chat yang kompatibel dengan OpenAI dan penyedia pemahaman media audio.

| Properti               | Nilai                                    |
| ---------------------- | ---------------------------------------- |
| ID penyedia            | `groq`                                   |
| Plugin                 | bawaan, `enabledByDefault: true`         |
| Var env autentikasi    | `GROQ_API_KEY`                           |
| Flag onboarding        | `--auth-choice groq-api-key`             |
| API                    | kompatibel dengan OpenAI (`openai-completions`) |
| URL dasar              | `https://api.groq.com/openai/v1`         |
| Transkripsi audio      | `whisper-large-v3-turbo` (default)       |
| Default chat yang disarankan | `groq/llama-3.3-70b-versatile`     |

## Memulai

<Steps>
  <Step title="Dapatkan kunci API">
    Buat kunci API di [console.groq.com/keys](https://console.groq.com/keys).
  </Step>
  <Step title="Tetapkan kunci API">
    <CodeGroup>

```bash Onboarding
openclaw onboard --auth-choice groq-api-key
```

```bash Env only
export GROQ_API_KEY=gsk_...
```

    </CodeGroup>

  </Step>
  <Step title="Tetapkan model default">
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
  <Step title="Verifikasi katalog dapat dijangkau">
    ```bash
    openclaw models list --provider groq
    ```
  </Step>
</Steps>

### Contoh file konfigurasi

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

OpenClaw menyertakan katalog Groq berbasis manifes dengan entri reasoning dan non-reasoning. Jalankan `openclaw models list --provider groq` untuk melihat baris bawaan bagi versi yang terpasang, atau periksa [console.groq.com/docs/models](https://console.groq.com/docs/models) untuk daftar resmi Groq.

| Ref model                                            | Nama                          | Reasoning | Input        | Konteks |
| ---------------------------------------------------- | ----------------------------- | --------- | ------------ | ------- |
| `groq/llama-3.3-70b-versatile`                       | Llama 3.3 70B Versatile       | tidak     | teks         | 131,072 |
| `groq/llama-3.1-8b-instant`                          | Llama 3.1 8B Instant          | tidak     | teks         | 131,072 |
| `groq/meta-llama/llama-4-maverick-17b-128e-instruct` | Llama 4 Maverick 17B          | tidak     | teks + gambar | 131,072 |
| `groq/meta-llama/llama-4-scout-17b-16e-instruct`     | Llama 4 Scout 17B             | tidak     | teks + gambar | 131,072 |
| `groq/llama3-70b-8192`                               | Llama 3 70B                   | tidak     | teks         | 8,192   |
| `groq/llama3-8b-8192`                                | Llama 3 8B                    | tidak     | teks         | 8,192   |
| `groq/gemma2-9b-it`                                  | Gemma 2 9B                    | tidak     | teks         | 8,192   |
| `groq/mistral-saba-24b`                              | Mistral Saba 24B              | tidak     | teks         | 32,768  |
| `groq/moonshotai/kimi-k2-instruct`                   | Kimi K2 Instruct              | tidak     | teks         | 131,072 |
| `groq/moonshotai/kimi-k2-instruct-0905`              | Kimi K2 Instruct 0905         | tidak     | teks         | 262,144 |
| `groq/openai/gpt-oss-120b`                           | GPT OSS 120B                  | ya        | teks         | 131,072 |
| `groq/openai/gpt-oss-20b`                            | GPT OSS 20B                   | ya        | teks         | 131,072 |
| `groq/openai/gpt-oss-safeguard-20b`                  | Safety GPT OSS 20B            | ya        | teks         | 131,072 |
| `groq/qwen-qwq-32b`                                  | Qwen QwQ 32B                  | ya        | teks         | 131,072 |
| `groq/qwen/qwen3-32b`                                | Qwen3 32B                     | ya        | teks         | 131,072 |
| `groq/deepseek-r1-distill-llama-70b`                 | DeepSeek R1 Distill Llama 70B | ya        | teks         | 131,072 |
| `groq/groq/compound`                                 | Compound                      | ya        | teks         | 131,072 |
| `groq/groq/compound-mini`                            | Compound Mini                 | ya        | teks         | 131,072 |

<Tip>
  Katalog berkembang bersama setiap rilis OpenClaw. `openclaw models list --provider groq` menampilkan baris yang diketahui oleh versi yang terpasang; bandingkan dengan [console.groq.com/docs/models](https://console.groq.com/docs/models) untuk model yang baru ditambahkan atau tidak digunakan lagi.
</Tip>

## Model reasoning

OpenClaw memetakan level `/think` bersama ke nilai `reasoning_effort` khusus model milik Groq:

- Untuk `qwen/qwen3-32b`, thinking yang dinonaktifkan mengirim `none` dan thinking yang diaktifkan mengirim `default`.
- Untuk model reasoning Groq GPT OSS (`openai/gpt-oss-*`), OpenClaw mengirim `low`, `medium`, atau `high` berdasarkan level `/think`. Thinking yang dinonaktifkan menghilangkan `reasoning_effort` karena model tersebut tidak mendukung nilai nonaktif.
- DeepSeek R1 Distill, Qwen QwQ, dan Compound menggunakan surface reasoning native milik Groq; `/think` mengontrol visibilitas, tetapi model selalu melakukan reasoning.

Lihat [Mode thinking](/id/tools/thinking) untuk level `/think` bersama dan cara OpenClaw menerjemahkannya per penyedia.

## Transkripsi audio

Plugin bawaan Groq juga mendaftarkan **penyedia pemahaman media audio** agar pesan suara dapat ditranskripsi melalui surface bersama `tools.media.audio`.

| Properti           | Nilai                                     |
| ------------------ | ----------------------------------------- |
| Jalur konfigurasi bersama | `tools.media.audio`                |
| URL dasar default  | `https://api.groq.com/openai/v1`          |
| Model default      | `whisper-large-v3-turbo`                  |
| Prioritas otomatis | 20                                        |
| Endpoint API       | kompatibel dengan OpenAI `/audio/transcriptions` |

Untuk menjadikan Groq sebagai backend audio default:

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
      Kunci yang hanya berada di `~/.profile` tidak akan membantu daemon launchd atau systemd kecuali lingkungan tersebut juga diimpor ke sana. Tetapkan kunci di `~/.openclaw/.env` atau melalui `env.shellEnv` agar dapat dibaca dari proses Gateway.
    </Warning>

  </Accordion>

  <Accordion title="ID model Groq kustom">
    OpenClaw menerima ID model Groq apa pun saat runtime. Gunakan ID persis seperti yang ditampilkan Groq dan beri prefiks `groq/`. Katalog bawaan mencakup kasus umum; ID yang tidak ada di katalog akan diteruskan ke template default yang kompatibel dengan OpenAI.

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
    Memilih penyedia, ref model, dan perilaku failover.
  </Card>
  <Card title="Mode thinking" href="/id/tools/thinking" icon="brain">
    Level upaya reasoning dan interaksi kebijakan penyedia.
  </Card>
  <Card title="Referensi konfigurasi" href="/id/gateway/configuration-reference" icon="gear">
    Skema konfigurasi lengkap termasuk pengaturan penyedia dan audio.
  </Card>
  <Card title="Groq Console" href="https://console.groq.com" icon="arrow-up-right-from-square">
    Dasbor Groq, dokumentasi API, dan harga.
  </Card>
</CardGroup>
