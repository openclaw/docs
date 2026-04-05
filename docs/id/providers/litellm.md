---
read_when:
    - Anda ingin merutekan OpenClaw melalui proxy LiteLLM
    - Anda memerlukan pelacakan biaya, logging, atau perutean model melalui LiteLLM
summary: Jalankan OpenClaw melalui LiteLLM Proxy untuk akses model terpadu dan pelacakan biaya
title: LiteLLM
x-i18n:
    generated_at: "2026-04-05T14:03:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4e8ca73458186285bc06967b397b8a008791dc58eea1159d6c358e1a794982d1
    source_path: providers/litellm.md
    workflow: 15
---

# LiteLLM

[LiteLLM](https://litellm.ai) adalah gateway LLM open-source yang menyediakan API terpadu untuk 100+ model provider. Rutekan OpenClaw melalui LiteLLM untuk mendapatkan pelacakan biaya terpusat, logging, dan fleksibilitas untuk mengganti backend tanpa mengubah konfigurasi OpenClaw Anda.

## Mengapa menggunakan LiteLLM dengan OpenClaw?

- **Pelacakan biaya** — Lihat dengan tepat berapa pengeluaran OpenClaw di semua model
- **Perutean model** — Beralih antara Claude, GPT-4, Gemini, Bedrock tanpa perubahan konfigurasi
- **Kunci virtual** — Buat kunci dengan batas pengeluaran untuk OpenClaw
- **Logging** — Log permintaan/respons lengkap untuk debugging
- **Fallback** — Failover otomatis jika provider utama Anda sedang tidak tersedia

## Mulai cepat

### Melalui onboarding

```bash
openclaw onboard --auth-choice litellm-api-key
```

### Setup manual

1. Jalankan LiteLLM Proxy:

```bash
pip install 'litellm[proxy]'
litellm --model claude-opus-4-6
```

2. Arahkan OpenClaw ke LiteLLM:

```bash
export LITELLM_API_KEY="your-litellm-key"

openclaw
```

Selesai. OpenClaw sekarang dirutekan melalui LiteLLM.

## Konfigurasi

### Variabel environment

```bash
export LITELLM_API_KEY="sk-litellm-key"
```

### File konfigurasi

```json5
{
  models: {
    providers: {
      litellm: {
        baseUrl: "http://localhost:4000",
        apiKey: "${LITELLM_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "claude-opus-4-6",
            name: "Claude Opus 4.6",
            reasoning: true,
            input: ["text", "image"],
            contextWindow: 200000,
            maxTokens: 64000,
          },
          {
            id: "gpt-4o",
            name: "GPT-4o",
            reasoning: false,
            input: ["text", "image"],
            contextWindow: 128000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
  agents: {
    defaults: {
      model: { primary: "litellm/claude-opus-4-6" },
    },
  },
}
```

## Kunci virtual

Buat kunci khusus untuk OpenClaw dengan batas pengeluaran:

```bash
curl -X POST "http://localhost:4000/key/generate" \
  -H "Authorization: Bearer $LITELLM_MASTER_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "key_alias": "openclaw",
    "max_budget": 50.00,
    "budget_duration": "monthly"
  }'
```

Gunakan kunci yang dihasilkan sebagai `LITELLM_API_KEY`.

## Perutean model

LiteLLM dapat merutekan permintaan model ke backend yang berbeda. Konfigurasikan di `config.yaml` LiteLLM Anda:

```yaml
model_list:
  - model_name: claude-opus-4-6
    litellm_params:
      model: claude-opus-4-6
      api_key: os.environ/ANTHROPIC_API_KEY

  - model_name: gpt-4o
    litellm_params:
      model: gpt-4o
      api_key: os.environ/OPENAI_API_KEY
```

OpenClaw tetap meminta `claude-opus-4-6` — LiteLLM yang menangani peruteannya.

## Melihat penggunaan

Periksa dashboard atau API LiteLLM:

```bash
# Info kunci
curl "http://localhost:4000/key/info" \
  -H "Authorization: Bearer sk-litellm-key"

# Log pengeluaran
curl "http://localhost:4000/spend/logs" \
  -H "Authorization: Bearer $LITELLM_MASTER_KEY"
```

## Catatan

- LiteLLM berjalan di `http://localhost:4000` secara default
- OpenClaw terhubung melalui endpoint `/v1` bergaya proxy LiteLLM yang kompatibel dengan OpenAI
- Pembentukan permintaan native yang hanya khusus OpenAI tidak berlaku melalui LiteLLM:
  tidak ada `service_tier`, tidak ada `store` Responses, tidak ada hint prompt-cache, dan tidak ada pembentukan payload kompatibilitas reasoning OpenAI
- Header atribusi OpenClaw tersembunyi (`originator`, `version`, `User-Agent`)
  tidak disisipkan pada base URL LiteLLM kustom

## Lihat juga

- [LiteLLM Docs](https://docs.litellm.ai)
- [Model Providers](/id/concepts/model-providers)
