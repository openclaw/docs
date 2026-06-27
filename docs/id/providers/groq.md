---
read_when:
    - Anda ingin menggunakan Groq dengan OpenClaw
    - Anda memerlukan variabel lingkungan kunci API atau pilihan autentikasi CLI
    - Anda sedang mengonfigurasi transkripsi audio Whisper di Groq
summary: Penyiapan Groq (autentikasi + pemilihan model + transkripsi Whisper)
title: Groq
x-i18n:
    generated_at: "2026-06-27T18:04:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f1133f2b1fa09e2e854b5762e189233597e86e8ccb2df8d619e891b4dc9c8d82
    source_path: providers/groq.md
    workflow: 16
---

[Groq](https://groq.com) menyediakan inferensi sangat cepat pada model berbobot terbuka (Llama, Gemma, Kimi, Qwen, GPT OSS, dan lainnya) menggunakan perangkat keras LPU khusus. Plugin Groq mendaftarkan penyedia chat yang kompatibel dengan OpenAI dan penyedia pemahaman media audio.

| Properti              | Nilai                                    |
| --------------------- | ---------------------------------------- |
| Id penyedia           | `groq`                                   |
| Plugin                | paket eksternal resmi                    |
| Variabel env auth     | `GROQ_API_KEY`                           |
| API                   | Kompatibel OpenAI (`openai-completions`) |
| URL dasar             | `https://api.groq.com/openai/v1`         |
| Transkripsi audio     | `whisper-large-v3-turbo` (bawaan)        |
| Bawaan chat disarankan | `groq/llama-3.3-70b-versatile`          |

## Instal Plugin

Instal Plugin resmi, lalu mulai ulang Gateway:

```bash
openclaw plugins install @openclaw/groq-provider
openclaw gateway restart
```

## Memulai

<Steps>
  <Step title="Get an API key">
    Buat kunci API di [console.groq.com/keys](https://console.groq.com/keys).
  </Step>
  <Step title="Set the API key">
    ```bash
export GROQ_API_KEY=gsk_...
```
  </Step>
  <Step title="Set a default model">
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
  <Step title="Verify the catalog is reachable">
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

OpenClaw menyertakan katalog Groq berbasis manifes dengan entri penalaran dan non-penalaran. Jalankan `openclaw models list --provider groq` untuk melihat baris statis bagi versi terinstal Anda, atau periksa [console.groq.com/docs/models](https://console.groq.com/docs/models) untuk daftar resmi Groq.

| Ref model                                        | Nama                    | Penalaran | Masukan       | Konteks |
| ------------------------------------------------ | ----------------------- | --------- | ------------- | ------- |
| `groq/llama-3.3-70b-versatile`                   | Llama 3.3 70B Versatile | tidak     | teks          | 131,072 |
| `groq/llama-3.1-8b-instant`                      | Llama 3.1 8B Instant    | tidak     | teks          | 131,072 |
| `groq/meta-llama/llama-4-scout-17b-16e-instruct` | Llama 4 Scout 17B       | tidak     | teks + gambar | 131,072 |
| `groq/openai/gpt-oss-120b`                       | GPT OSS 120B            | ya        | teks          | 131,072 |
| `groq/openai/gpt-oss-20b`                        | GPT OSS 20B             | ya        | teks          | 131,072 |
| `groq/openai/gpt-oss-safeguard-20b`              | Safety GPT OSS 20B      | ya        | teks          | 131,072 |
| `groq/qwen/qwen3-32b`                            | Qwen3 32B               | ya        | teks          | 131,072 |
| `groq/groq/compound`                             | Compound                | ya        | teks          | 131,072 |
| `groq/groq/compound-mini`                        | Compound Mini           | ya        | teks          | 131,072 |

<Tip>
  Katalog berkembang di setiap rilis OpenClaw. `openclaw models list --provider groq` menampilkan baris yang diketahui versi terinstal Anda; cocokkan dengan [console.groq.com/docs/models](https://console.groq.com/docs/models) untuk model yang baru ditambahkan atau tidak digunakan lagi.
</Tip>

## Model penalaran

OpenClaw memetakan level `/think` bersama ke nilai `reasoning_effort` khusus model milik Groq:

- Untuk `qwen/qwen3-32b`, pemikiran yang dinonaktifkan mengirim `none` dan pemikiran yang diaktifkan mengirim `default`.
- Untuk model penalaran Groq GPT OSS (`openai/gpt-oss-*`), OpenClaw mengirim `low`, `medium`, atau `high` berdasarkan level `/think`. Pemikiran yang dinonaktifkan menghilangkan `reasoning_effort` karena model tersebut tidak mendukung nilai nonaktif.
- DeepSeek R1 Distill, Qwen QwQ, dan Compound menggunakan permukaan penalaran native Groq; `/think` mengontrol visibilitas tetapi model selalu bernalar.

Lihat [Mode berpikir](/id/tools/thinking) untuk level `/think` bersama dan cara OpenClaw menerjemahkannya per penyedia.

## Transkripsi audio

Plugin Groq juga mendaftarkan **penyedia pemahaman media audio** sehingga pesan suara dapat ditranskripsikan melalui permukaan bersama `tools.media.audio`.

| Properti                 | Nilai                                     |
| ------------------------ | ----------------------------------------- |
| Jalur konfigurasi bersama | `tools.media.audio`                       |
| URL dasar bawaan          | `https://api.groq.com/openai/v1`          |
| Model bawaan              | `whisper-large-v3-turbo`                  |
| Prioritas otomatis        | 20                                        |
| Endpoint API              | Kompatibel OpenAI `/audio/transcriptions` |

Untuk menjadikan Groq backend audio bawaan:

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
  <Accordion title="Environment availability for the daemon">
    Jika Gateway berjalan sebagai layanan terkelola (launchd, systemd, Docker), `GROQ_API_KEY` harus terlihat oleh proses tersebut, bukan hanya oleh shell interaktif Anda.

    <Warning>
      Kunci yang diekspor hanya di shell interaktif tidak akan membantu daemon launchd atau systemd kecuali lingkungan tersebut juga diimpor ke sana. Atur kunci di `~/.openclaw/.env` atau melalui `env.shellEnv` agar dapat dibaca dari proses gateway.
    </Warning>

  </Accordion>

  <Accordion title="Custom Groq model ids">
    OpenClaw menerima id model Groq apa pun saat runtime. Gunakan id persis yang ditampilkan oleh Groq dan beri prefiks `groq/`. Katalog statis mencakup kasus umum; id yang tidak ada di katalog akan diteruskan ke templat bawaan yang kompatibel dengan OpenAI.

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
  <Card title="Model providers" href="/id/concepts/model-providers" icon="layers">
    Memilih penyedia, ref model, dan perilaku failover.
  </Card>
  <Card title="Thinking modes" href="/id/tools/thinking" icon="brain">
    Level upaya penalaran dan interaksi kebijakan penyedia.
  </Card>
  <Card title="Configuration reference" href="/id/gateway/configuration-reference" icon="gear">
    Skema konfigurasi lengkap termasuk pengaturan penyedia dan audio.
  </Card>
  <Card title="Groq Console" href="https://console.groq.com" icon="arrow-up-right-from-square">
    Dasbor Groq, dokumentasi API, dan harga.
  </Card>
</CardGroup>
