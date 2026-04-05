---
read_when:
    - DeepSeek'i OpenClaw ile kullanmak istiyorsunuz
    - API anahtarı ortam değişkenine veya CLI auth seçeneğine ihtiyacınız var
summary: DeepSeek kurulumu (kimlik doğrulama + model seçimi)
x-i18n:
    generated_at: "2026-04-05T14:03:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 35f339ca206399496ce094eb8350e0870029ce9605121bcf86c4e9b94f3366c6
    source_path: providers/deepseek.md
    workflow: 15
---

# DeepSeek

[DeepSeek](https://www.deepseek.com), OpenAI uyumlu bir API ile güçlü AI modelleri sunar.

- Sağlayıcı: `deepseek`
- Kimlik doğrulama: `DEEPSEEK_API_KEY`
- API: OpenAI uyumlu
- Base URL: `https://api.deepseek.com`

## Hızlı başlangıç

API anahtarını ayarlayın (önerilir: Gateway için saklayın):

```bash
openclaw onboard --auth-choice deepseek-api-key
```

Bu, API anahtarınızı girmenizi ister ve `deepseek/deepseek-chat` modelini varsayılan model olarak ayarlar.

## Etkileşimsiz örnek

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice deepseek-api-key \
  --deepseek-api-key "$DEEPSEEK_API_KEY" \
  --skip-health \
  --accept-risk
```

## Ortam notu

Gateway bir daemon olarak çalışıyorsa (`launchd`/`systemd`), `DEEPSEEK_API_KEY`
değerinin bu süreç için kullanılabilir olduğundan emin olun (örneğin `~/.openclaw/.env` içinde veya
`env.shellEnv` aracılığıyla).

## Yerleşik katalog

| Model ref                    | Ad                | Girdi | Bağlam  | Maks. çıktı | Notlar                                             |
| ---------------------------- | ----------------- | ----- | ------- | ----------- | -------------------------------------------------- |
| `deepseek/deepseek-chat`     | DeepSeek Chat     | text  | 131,072 | 8,192       | Varsayılan model; DeepSeek V3.2 thinking olmayan yüzey |
| `deepseek/deepseek-reasoner` | DeepSeek Reasoner | text  | 131,072 | 65,536      | Reasoning etkin V3.2 yüzeyi                        |

Her iki paketli model de şu anda kaynakta akış kullanım uyumluluğu sunduğunu belirtir.

API anahtarınızı [platform.deepseek.com](https://platform.deepseek.com/api_keys) adresinden alın.
