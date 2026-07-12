---
read_when:
    - Anda ingin menggunakan Synthetic sebagai penyedia model
    - Anda memerlukan kunci API Synthetic atau penyiapan URL dasar
summary: Gunakan API Synthetic yang kompatibel dengan Anthropic di OpenClaw
title: Sintetis
x-i18n:
    generated_at: "2026-07-12T14:38:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f1882a34aa1ca52403b92effdbf3b753fd911575af6d8b8aa5d692245b8e8f1b
    source_path: providers/synthetic.md
    workflow: 16
---

[Synthetic](https://synthetic.new) menyediakan endpoint yang kompatibel dengan Anthropic.
OpenClaw menyertakannya sebagai penyedia `synthetic` dan menggunakan Anthropic
Messages API.

| Properti  | Nilai                                 |
| --------- | ------------------------------------- |
| Penyedia  | `synthetic`                           |
| Autentikasi | `SYNTHETIC_API_KEY`                 |
| API       | Anthropic Messages                    |
| URL dasar | `https://api.synthetic.new/anthropic` |

## Memulai

<Steps>
  <Step title="Dapatkan kunci API">
    Dapatkan `SYNTHETIC_API_KEY` dari akun Synthetic Anda, atau biarkan proses orientasi
    meminta Anda memasukkannya.
  </Step>
  <Step title="Jalankan proses orientasi">
    ```bash
    openclaw onboard --auth-choice synthetic-api-key
    ```
  </Step>
  <Step title="Verifikasi model bawaan">
    Proses orientasi menetapkan model bawaan menjadi:
    ```text
    synthetic/hf:MiniMaxAI/MiniMax-M2.5
    ```
  </Step>
</Steps>

<Warning>
Klien Anthropic milik OpenClaw menambahkan `/v1` ke URL dasar secara otomatis, jadi gunakan
`https://api.synthetic.new/anthropic` (bukan `/anthropic/v1`). Jika Synthetic
mengubah URL dasarnya, timpa `models.providers.synthetic.baseUrl`.
</Warning>

## Contoh konfigurasi

```json5
{
  env: { SYNTHETIC_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "synthetic/hf:MiniMaxAI/MiniMax-M2.5" },
      models: { "synthetic/hf:MiniMaxAI/MiniMax-M2.5": { alias: "MiniMax M2.5" } },
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
            id: "hf:MiniMaxAI/MiniMax-M2.5",
            name: "MiniMax M2.5",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 192000,
            maxTokens: 65536,
          },
        ],
      },
    },
  },
}
```

## Katalog bawaan

Semua model Synthetic menggunakan biaya `0` (masukan/keluaran/cache).

| ID model                                               | Jendela konteks | Token maks. | Penalaran | Masukan       |
| ------------------------------------------------------ | --------------- | ----------- | --------- | ------------- |
| `hf:MiniMaxAI/MiniMax-M2.5`                            | 192,000         | 65,536      | tidak     | teks          |
| `hf:moonshotai/Kimi-K2-Thinking`                       | 256,000         | 8,192       | ya        | teks          |
| `hf:zai-org/GLM-4.7`                                   | 198,000         | 128,000     | tidak     | teks          |
| `hf:deepseek-ai/DeepSeek-R1-0528`                      | 128,000         | 8,192       | tidak     | teks          |
| `hf:deepseek-ai/DeepSeek-V3-0324`                      | 128,000         | 8,192       | tidak     | teks          |
| `hf:deepseek-ai/DeepSeek-V3.1`                         | 128,000         | 8,192       | tidak     | teks          |
| `hf:deepseek-ai/DeepSeek-V3.1-Terminus`                | 128,000         | 8,192       | tidak     | teks          |
| `hf:deepseek-ai/DeepSeek-V3.2`                         | 159,000         | 8,192       | tidak     | teks          |
| `hf:meta-llama/Llama-3.3-70B-Instruct`                 | 128,000         | 8,192       | tidak     | teks          |
| `hf:meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8` | 524,000         | 8,192       | tidak     | teks          |
| `hf:moonshotai/Kimi-K2-Instruct-0905`                  | 256,000         | 8,192       | tidak     | teks          |
| `hf:moonshotai/Kimi-K2.5`                              | 256,000         | 8,192       | ya        | teks + gambar |
| `hf:openai/gpt-oss-120b`                               | 128,000         | 8,192       | tidak     | teks          |
| `hf:Qwen/Qwen3-235B-A22B-Instruct-2507`                | 256,000         | 8,192       | tidak     | teks          |
| `hf:Qwen/Qwen3-Coder-480B-A35B-Instruct`               | 256,000         | 8,192       | tidak     | teks          |
| `hf:Qwen/Qwen3-VL-235B-A22B-Instruct`                  | 250,000         | 8,192       | tidak     | teks + gambar |
| `hf:zai-org/GLM-4.5`                                   | 128,000         | 128,000     | tidak     | teks          |
| `hf:zai-org/GLM-4.6`                                   | 198,000         | 128,000     | tidak     | teks          |
| `hf:zai-org/GLM-5`                                     | 256,000         | 128,000     | ya        | teks + gambar |
| `hf:deepseek-ai/DeepSeek-V3`                           | 128,000         | 8,192       | tidak     | teks          |
| `hf:Qwen/Qwen3-235B-A22B-Thinking-2507`                | 256,000         | 8,192       | ya        | teks          |

<Tip>
Referensi model menggunakan format `synthetic/<modelId>`. Gunakan
`openclaw models list --provider synthetic` untuk melihat semua model yang tersedia di
akun Anda.
</Tip>

<AccordionGroup>
  <Accordion title="Daftar model yang diizinkan">
    Jika Anda mengaktifkan daftar model yang diizinkan (`agents.defaults.models`), tambahkan setiap
    model Synthetic yang ingin Anda gunakan. Model yang tidak ada dalam daftar tersebut disembunyikan
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
