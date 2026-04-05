---
read_when:
    - OpenClaw'ı bir LiteLLM proxy üzerinden yönlendirmek istiyorsunuz
    - LiteLLM üzerinden maliyet takibi, günlükleme veya model yönlendirmesine ihtiyacınız var
summary: Birleşik model erişimi ve maliyet takibi için OpenClaw'ı LiteLLM Proxy üzerinden çalıştırın
title: LiteLLM
x-i18n:
    generated_at: "2026-04-05T14:04:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4e8ca73458186285bc06967b397b8a008791dc58eea1159d6c358e1a794982d1
    source_path: providers/litellm.md
    workflow: 15
---

# LiteLLM

[LiteLLM](https://litellm.ai), 100'den fazla model provider için birleşik bir API sağlayan açık kaynaklı bir LLM gateway'idir. Merkezi maliyet takibi, günlükleme ve OpenClaw yapılandırmanızı değiştirmeden backend'ler arasında geçiş yapabilme esnekliği elde etmek için OpenClaw'ı LiteLLM üzerinden yönlendirin.

## OpenClaw ile neden LiteLLM kullanılır?

- **Maliyet takibi** — OpenClaw'ın tüm modeller genelinde tam olarak ne kadar harcadığını görün
- **Model yönlendirme** — Yapılandırma değişikliği olmadan Claude, GPT-4, Gemini, Bedrock arasında geçiş yapın
- **Sanal anahtarlar** — OpenClaw için harcama sınırları olan anahtarlar oluşturun
- **Günlükleme** — Hata ayıklama için tam istek/yanıt günlükleri
- **Geri dönüşler** — Birincil provider kullanılamadığında otomatik failover

## Hızlı başlangıç

### Onboarding ile

```bash
openclaw onboard --auth-choice litellm-api-key
```

### Elle kurulum

1. LiteLLM Proxy'yi başlatın:

```bash
pip install 'litellm[proxy]'
litellm --model claude-opus-4-6
```

2. OpenClaw'ı LiteLLM'e yönlendirin:

```bash
export LITELLM_API_KEY="your-litellm-key"

openclaw
```

Bu kadar. OpenClaw artık LiteLLM üzerinden yönlendirilir.

## Yapılandırma

### Ortam değişkenleri

```bash
export LITELLM_API_KEY="sk-litellm-key"
```

### Yapılandırma dosyası

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

## Sanal anahtarlar

OpenClaw için harcama sınırları olan özel bir anahtar oluşturun:

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

Oluşturulan anahtarı `LITELLM_API_KEY` olarak kullanın.

## Model yönlendirme

LiteLLM, model isteklerini farklı backend'lere yönlendirebilir. Bunu LiteLLM `config.yaml` dosyanızda yapılandırın:

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

OpenClaw `claude-opus-4-6` istemeye devam eder — yönlendirmeyi LiteLLM yönetir.

## Kullanımı görüntüleme

LiteLLM'in panosunu veya API'sini kontrol edin:

```bash
# Anahtar bilgisi
curl "http://localhost:4000/key/info" \
  -H "Authorization: Bearer sk-litellm-key"

# Harcama günlükleri
curl "http://localhost:4000/spend/logs" \
  -H "Authorization: Bearer $LITELLM_MASTER_KEY"
```

## Notlar

- LiteLLM varsayılan olarak `http://localhost:4000` üzerinde çalışır
- OpenClaw, LiteLLM'in proxy tarzı OpenAI uyumlu `/v1`
  endpoint'i üzerinden bağlanır
- Yerel OpenAI'ye özgü istek şekillendirme LiteLLM üzerinden uygulanmaz:
  `service_tier` yoktur, Responses `store` yoktur, prompt-cache ipuçları yoktur ve
  OpenAI reasoning-compat payload şekillendirmesi yoktur
- Gizli OpenClaw ilişkilendirme başlıkları (`originator`, `version`, `User-Agent`)
  özel LiteLLM temel URL'lerine eklenmez

## Ayrıca bkz.

- [LiteLLM Docs](https://docs.litellm.ai)
- [Model Providers](/tr/concepts/model-providers)
