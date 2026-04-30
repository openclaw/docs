---
read_when:
    - Anda ingin menggunakan Cerebras dengan OpenClaw
    - Anda memerlukan variabel env kunci API Cerebras atau pilihan autentikasi CLI
summary: Penyiapan Cerebras (autentikasi + pemilihan model)
title: Cerebras
x-i18n:
    generated_at: "2026-04-30T10:06:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 96f94b23e55340414633ff48e352623907ee36dd2715e5ab053a93c86df1b49a
    source_path: providers/cerebras.md
    workflow: 16
---

[Cerebras](https://www.cerebras.ai) menyediakan inferensi berkecepatan tinggi yang kompatibel dengan OpenAI.

| Properti | Nilai                        |
| -------- | ---------------------------- |
| Penyedia | `cerebras`                   |
| Autentikasi | `CEREBRAS_API_KEY`        |
| API      | Kompatibel dengan OpenAI     |
| URL Dasar | `https://api.cerebras.ai/v1` |

## Memulai

<Steps>
  <Step title="Get an API key">
    Buat kunci API di [Cerebras Cloud Console](https://cloud.cerebras.ai).
  </Step>
  <Step title="Run onboarding">
    ```bash
    openclaw onboard --auth-choice cerebras-api-key
    ```
  </Step>
  <Step title="Verify models are available">
    ```bash
    openclaw models list --provider cerebras
    ```
  </Step>
</Steps>

### Penyiapan Non-Interaktif

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice cerebras-api-key \
  --cerebras-api-key "$CEREBRAS_API_KEY"
```

## Katalog Bawaan

OpenClaw menyertakan katalog Cerebras statis untuk endpoint publik yang kompatibel dengan OpenAI:

| Referensi model                           | Nama                 | Catatan                               |
| ----------------------------------------- | -------------------- | ------------------------------------- |
| `cerebras/zai-glm-4.7`                    | Z.ai GLM 4.7         | Model default; model penalaran pratinjau |
| `cerebras/gpt-oss-120b`                   | GPT OSS 120B         | Model penalaran produksi              |
| `cerebras/qwen-3-235b-a22b-instruct-2507` | Qwen 3 235B Instruct | Model non-penalaran pratinjau         |
| `cerebras/llama3.1-8b`                    | Llama 3.1 8B         | Model produksi yang berfokus pada kecepatan |

<Warning>
Cerebras menandai `zai-glm-4.7` dan `qwen-3-235b-a22b-instruct-2507` sebagai model pratinjau, dan `llama3.1-8b` / `qwen-3-235b-a22b-instruct-2507` didokumentasikan akan dihentikan pada 27 Mei 2026. Periksa halaman model yang didukung Cerebras sebelum mengandalkannya untuk produksi.
</Warning>

## Konfigurasi Manual

Plugin bawaan biasanya berarti Anda hanya memerlukan kunci API. Gunakan konfigurasi
`models.providers.cerebras` eksplisit saat Anda ingin menimpa metadata model:

```json5
{
  env: { CEREBRAS_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "cerebras/zai-glm-4.7" },
    },
  },
  models: {
    mode: "merge",
    providers: {
      cerebras: {
        baseUrl: "https://api.cerebras.ai/v1",
        apiKey: "${CEREBRAS_API_KEY}",
        api: "openai-completions",
        models: [
          { id: "zai-glm-4.7", name: "Z.ai GLM 4.7" },
          { id: "gpt-oss-120b", name: "GPT OSS 120B" },
        ],
      },
    },
  },
}
```

<Note>
Jika Gateway berjalan sebagai daemon (launchd/systemd), pastikan `CEREBRAS_API_KEY`
tersedia bagi proses tersebut, misalnya di `~/.openclaw/.env` atau melalui
`env.shellEnv`.
</Note>
