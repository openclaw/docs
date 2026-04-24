---
read_when:
    - Anda ingin menggunakan Synthetic sebagai provider model
    - Anda memerlukan penyiapan API key atau base URL Synthetic
summary: Gunakan API Synthetic yang kompatibel dengan Anthropic di OpenClaw
title: Synthetic
x-i18n:
    generated_at: "2026-04-24T09:24:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 81a48573782d46f0b018d19ab607729b236c241e57535e4af52eb8c142fee59b
    source_path: providers/synthetic.md
    workflow: 15
---

[Synthetic](https://synthetic.new) mengekspos endpoint yang kompatibel dengan Anthropic.
OpenClaw mendaftarkannya sebagai provider `synthetic` dan menggunakan API
Anthropic Messages.

| Properti | Nilai                                  |
| -------- | -------------------------------------- |
| Provider | `synthetic`                            |
| Auth     | `SYNTHETIC_API_KEY`                    |
| API      | Anthropic Messages                     |
| Base URL | `https://api.synthetic.new/anthropic`  |

## Memulai

<Steps>
  <Step title="Dapatkan API key">
    Dapatkan `SYNTHETIC_API_KEY` dari akun Synthetic Anda, atau biarkan wizard
    onboarding memintanya dari Anda.
  </Step>
  <Step title="Jalankan onboarding">
    ```bash
    openclaw onboard --auth-choice synthetic-api-key
    ```
  </Step>
  <Step title="Verifikasi model default">
    Setelah onboarding, model default diatur ke:
    ```
    synthetic/hf:MiniMaxAI/MiniMax-M2.5
    ```
  </Step>
</Steps>

<Warning>
Klien Anthropic OpenClaw otomatis menambahkan `/v1` ke base URL, jadi gunakan
`https://api.synthetic.new/anthropic` (bukan `/anthropic/v1`). Jika Synthetic
mengubah base URL-nya, override `models.providers.synthetic.baseUrl`.
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

Semua model Synthetic menggunakan biaya `0` (input/output/cache).

| ID Model                                               | Jendela konteks | Token maks | Reasoning | Input        |
| ------------------------------------------------------ | --------------- | ---------- | --------- | ------------ |
| `hf:MiniMaxAI/MiniMax-M2.5`                            | 192,000         | 65,536     | tidak     | text         |
| `hf:moonshotai/Kimi-K2-Thinking`                       | 256,000         | 8,192      | ya        | text         |
| `hf:zai-org/GLM-4.7`                                   | 198,000         | 128,000    | tidak     | text         |
| `hf:deepseek-ai/DeepSeek-R1-0528`                      | 128,000         | 8,192      | tidak     | text         |
| `hf:deepseek-ai/DeepSeek-V3-0324`                      | 128,000         | 8,192      | tidak     | text         |
| `hf:deepseek-ai/DeepSeek-V3.1`                         | 128,000         | 8,192      | tidak     | text         |
| `hf:deepseek-ai/DeepSeek-V3.1-Terminus`                | 128,000         | 8,192      | tidak     | text         |
| `hf:deepseek-ai/DeepSeek-V3.2`                         | 159,000         | 8,192      | tidak     | text         |
| `hf:meta-llama/Llama-3.3-70B-Instruct`                 | 128,000         | 8,192      | tidak     | text         |
| `hf:meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8` | 524,000         | 8,192      | tidak     | text         |
| `hf:moonshotai/Kimi-K2-Instruct-0905`                  | 256,000         | 8,192      | tidak     | text         |
| `hf:moonshotai/Kimi-K2.5`                              | 256,000         | 8,192      | ya        | text + image |
| `hf:openai/gpt-oss-120b`                               | 128,000         | 8,192      | tidak     | text         |
| `hf:Qwen/Qwen3-235B-A22B-Instruct-2507`                | 256,000         | 8,192      | tidak     | text         |
| `hf:Qwen/Qwen3-Coder-480B-A35B-Instruct`               | 256,000         | 8,192      | tidak     | text         |
| `hf:Qwen/Qwen3-VL-235B-A22B-Instruct`                  | 250,000         | 8,192      | tidak     | text + image |
| `hf:zai-org/GLM-4.5`                                   | 128,000         | 128,000    | tidak     | text         |
| `hf:zai-org/GLM-4.6`                                   | 198,000         | 128,000    | tidak     | text         |
| `hf:zai-org/GLM-5`                                     | 256,000         | 128,000    | ya        | text + image |
| `hf:deepseek-ai/DeepSeek-V3`                           | 128,000         | 8,192      | tidak     | text         |
| `hf:Qwen/Qwen3-235B-A22B-Thinking-2507`                | 256,000         | 8,192      | ya        | text         |

<Tip>
Referensi model menggunakan bentuk `synthetic/<modelId>`. Gunakan
`openclaw models list --provider synthetic` untuk melihat semua model yang tersedia di
akun Anda.
</Tip>

<AccordionGroup>
  <Accordion title="Allowlist model">
    Jika Anda mengaktifkan allowlist model (`agents.defaults.models`), tambahkan setiap
    model Synthetic yang ingin Anda gunakan. Model yang tidak ada di allowlist akan disembunyikan
    dari agen.
  </Accordion>

  <Accordion title="Override base URL">
    Jika Synthetic mengubah endpoint API-nya, override base URL di konfigurasi Anda:

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

    Ingat bahwa OpenClaw otomatis menambahkan `/v1`.

  </Accordion>
</AccordionGroup>

## Terkait

<CardGroup cols={2}>
  <Card title="Model selection" href="/id/concepts/model-providers" icon="layers">
    Aturan provider, referensi model, dan perilaku failover.
  </Card>
  <Card title="Configuration reference" href="/id/gateway/configuration-reference" icon="gear">
    Skema konfigurasi lengkap termasuk pengaturan provider.
  </Card>
  <Card title="Synthetic" href="https://synthetic.new" icon="arrow-up-right-from-square">
    Dashboard Synthetic dan dokumentasi API.
  </Card>
</CardGroup>
