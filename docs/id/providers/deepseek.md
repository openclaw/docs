---
read_when:
    - Anda ingin menggunakan DeepSeek dengan OpenClaw
    - Anda memerlukan env var API key atau pilihan auth CLI
summary: Setup DeepSeek (auth + pemilihan model)
x-i18n:
    generated_at: "2026-04-05T14:03:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 35f339ca206399496ce094eb8350e0870029ce9605121bcf86c4e9b94f3366c6
    source_path: providers/deepseek.md
    workflow: 15
---

# DeepSeek

[DeepSeek](https://www.deepseek.com) menyediakan model AI yang kuat dengan API yang kompatibel dengan OpenAI.

- Provider: `deepseek`
- Auth: `DEEPSEEK_API_KEY`
- API: kompatibel dengan OpenAI
- Base URL: `https://api.deepseek.com`

## Mulai cepat

Setel API key (disarankan: simpan untuk Gateway):

```bash
openclaw onboard --auth-choice deepseek-api-key
```

Ini akan meminta API key Anda dan menetapkan `deepseek/deepseek-chat` sebagai model default.

## Contoh non-interaktif

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice deepseek-api-key \
  --deepseek-api-key "$DEEPSEEK_API_KEY" \
  --skip-health \
  --accept-risk
```

## Catatan environment

Jika Gateway berjalan sebagai daemon (launchd/systemd), pastikan `DEEPSEEK_API_KEY`
tersedia untuk proses tersebut (misalnya, di `~/.openclaw/.env` atau melalui
`env.shellEnv`).

## Katalog bawaan

| Model ref                    | Nama              | Input | Konteks | Output maks | Catatan                                           |
| ---------------------------- | ----------------- | ----- | ------- | ----------- | ------------------------------------------------- |
| `deepseek/deepseek-chat`     | DeepSeek Chat     | text  | 131,072 | 8,192       | Model default; permukaan non-thinking DeepSeek V3.2 |
| `deepseek/deepseek-reasoner` | DeepSeek Reasoner | text  | 131,072 | 65,536      | Permukaan V3.2 dengan reasoning aktif             |

Kedua model bawaan saat ini mengiklankan kompatibilitas penggunaan streaming dalam sumber.

Dapatkan API key Anda di [platform.deepseek.com](https://platform.deepseek.com/api_keys).
