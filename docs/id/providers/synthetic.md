---
read_when:
    - Anda ingin menggunakan Synthetic sebagai penyedia model
    - Anda memerlukan kunci API Synthetic atau penyiapan URL dasar
summary: Gunakan API Synthetic yang kompatibel dengan Anthropic di OpenClaw
title: Synthetic
x-i18n:
    generated_at: "2026-07-19T05:08:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: c3f6cc89a7b837f57555d176ce78e62a39095d4ef0765c96b6b7b93ffebd7388
    source_path: providers/synthetic.md
    workflow: 16
---

[Synthetic](https://synthetic.new) menyediakan endpoint yang kompatibel dengan Anthropic.
OpenClaw menyertakannya sebagai penyedia `synthetic` dan menggunakan Anthropic
Messages API.

| Properti | Nilai                                 |
| -------- | ------------------------------------- |
| Penyedia | `synthetic`                    |
| Autentikasi | `SYNTHETIC_API_KEY`                |
| API      | Anthropic Messages                    |
| URL Dasar | `https://api.synthetic.new/anthropic`                   |

## Memulai

<Steps>
  <Step title="Dapatkan kunci API">
    Dapatkan `SYNTHETIC_API_KEY` dari akun Synthetic Anda, atau biarkan proses orientasi
    meminta Anda memasukkannya.
  </Step>
  <Step title="Jalankan orientasi">
    ```bash
    openclaw onboard --auth-choice synthetic-api-key
    ```
  </Step>
  <Step title="Verifikasi model default">
    Proses orientasi menetapkan model default ke:
    ```text
    synthetic/hf:MiniMaxAI/MiniMax-M3
    ```
  </Step>
</Steps>

<Warning>
Klien Anthropic OpenClaw menambahkan `/v1` ke URL dasar secara otomatis, jadi gunakan
`https://api.synthetic.new/anthropic` (bukan `/anthropic/v1`). Jika Synthetic
mengubah URL dasarnya, timpa `models.providers.synthetic.baseUrl`.
</Warning>

## Contoh konfigurasi

```json5
{
  env: { SYNTHETIC_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "synthetic/hf:MiniMaxAI/MiniMax-M3" },
      models: { "synthetic/hf:MiniMaxAI/MiniMax-M3": { alias: "MiniMax M3" } },
    },
  },
  models: {
    mode: "merge",
    providers: {
      synthetic: {
        baseUrl: "https://api.synthetic.new/anthropic",
        apiKey: "${SYNTHETIC_API_KEY}",
        api: "anthropic-messages",
        models: [
          {
            id: "hf:MiniMaxAI/MiniMax-M3",
            name: "MiniMax M3",
            reasoning: true,
            input: ["text", "image"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 262144,
            maxTokens: 65536,
          },
        ],
      },
    },
  },
}
```

## Katalog bawaan

Semua model Synthetic menggunakan biaya `0` (input/output/cache). Lihat
[daftar model saat ini](https://dev.synthetic.new/docs/api/models) dari Synthetic untuk mengetahui ketersediaan layanan.

| ID Model                                            | Jendela konteks | Token maksimum | Penalaran | Input        |
| --------------------------------------------------- | --------------- | -------------- | --------- | ------------ |
| `hf:MiniMaxAI/MiniMax-M3`                           | 262,144         | 65,536         | ya        | teks + gambar |
| `hf:moonshotai/Kimi-K2.7-Code`                      | 262,144         | 8,192          | ya        | teks + gambar |
| `hf:nvidia/NVIDIA-Nemotron-3-Super-120B-A12B-NVFP4` | 262,144         | 8,192          | ya        | teks         |
| `hf:openai/gpt-oss-120b`                            | 131,072         | 8,192          | ya        | teks         |
| `hf:Qwen/Qwen3.6-27B`                               | 262,144         | 81,920         | ya        | teks + gambar |
| `hf:zai-org/GLM-4.7-Flash`                          | 196,608         | 131,072        | ya        | teks         |
| `hf:zai-org/GLM-5.2`                                | 524,288         | 131,072        | ya        | teks         |

<Tip>
Referensi model menggunakan format `synthetic/<modelId>`. Gunakan
`openclaw models list --provider synthetic` untuk melihat semua model yang tersedia di
akun Anda.
</Tip>

<AccordionGroup>
  <Accordion title="Daftar model yang diizinkan">
    Jika Anda mengaktifkan daftar model yang diizinkan (`agents.defaults.modelPolicy.allow`), tambahkan setiap
    model Synthetic yang ingin Anda gunakan. Model yang tidak tercantum dalam daftar tersebut disembunyikan
    dari agen.
  </Accordion>

  <Accordion title="Penimpaan URL dasar">
    Jika Synthetic mengubah endpoint API-nya, timpa URL dasar:

    ```json5
    {
      models: {
        providers: {
          synthetic: {
            baseUrl: "https://new-api.synthetic.new/anthropic",
          },
        },
      },
    }
    ```

    OpenClaw tetap menambahkan `/v1` secara otomatis.

  </Accordion>
</AccordionGroup>

## Terkait

<CardGroup cols={2}>
  <Card title="Penyedia model" href="/id/concepts/model-providers" icon="layers">
    Aturan penyedia, referensi model, dan perilaku failover.
  </Card>
  <Card title="Referensi konfigurasi" href="/id/gateway/configuration-reference" icon="gear">
    Skema konfigurasi lengkap, termasuk pengaturan penyedia.
  </Card>
  <Card title="Synthetic" href="https://synthetic.new" icon="arrow-up-right-from-square">
    Dasbor Synthetic dan dokumentasi API.
  </Card>
</CardGroup>
