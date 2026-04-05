---
read_when:
    - Birçok LLM için tek bir API anahtarı istiyorsunuz
    - OpenClaw içinde modelleri Kilo Gateway üzerinden çalıştırmak istiyorsunuz
summary: OpenClaw içinde birçok modele erişmek için Kilo Gateway'in birleşik API'sini kullanın
title: Kilo Gateway
x-i18n:
    generated_at: "2026-04-05T14:04:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 857266967b4a7553d501990631df2bae0f849d061521dc9f34e29687ecb94884
    source_path: providers/kilocode.md
    workflow: 15
---

# Kilo Gateway

Kilo Gateway, istekleri tek bir
endpoint ve API anahtarı arkasında birçok modele yönlendiren **birleşik bir API** sağlar. OpenAI uyumludur, bu nedenle çoğu OpenAI SDK'sı base URL değiştirilerek çalışır.

## API anahtarı alma

1. [app.kilo.ai](https://app.kilo.ai) adresine gidin
2. Oturum açın veya bir hesap oluşturun
3. API Keys bölümüne gidin ve yeni bir anahtar oluşturun

## CLI kurulumu

```bash
openclaw onboard --auth-choice kilocode-api-key
```

Veya ortam değişkenini ayarlayın:

```bash
export KILOCODE_API_KEY="<your-kilocode-api-key>" # pragma: allowlist secret
```

## Config parçacığı

```json5
{
  env: { KILOCODE_API_KEY: "<your-kilocode-api-key>" }, // pragma: allowlist secret
  agents: {
    defaults: {
      model: { primary: "kilocode/kilo/auto" },
    },
  },
}
```

## Varsayılan model

Varsayılan model, Kilo Gateway tarafından yönetilen sağlayıcıya ait akıllı yönlendirme
modeli `kilocode/kilo/auto` değeridir.

OpenClaw, `kilocode/kilo/auto` değerini kararlı varsayılan ref olarak ele alır, ancak bu rota için kaynağa dayalı bir görevden üst akış modele eşleme
yayımlamaz.

## Kullanılabilir modeller

OpenClaw, başlangıçta Kilo Gateway'den kullanılabilir modelleri dinamik olarak keşfeder. Hesabınızla kullanılabilen modellerin tam listesini görmek için
`/models kilocode` kullanın.

Gateway üzerinde kullanılabilen herhangi bir model `kilocode/` önekiyle kullanılabilir:

```
kilocode/kilo/auto              (varsayılan - akıllı yönlendirme)
kilocode/anthropic/claude-sonnet-4
kilocode/openai/gpt-5.4
kilocode/google/gemini-3-pro-preview
...ve daha fazlası
```

## Notlar

- Model ref'leri `kilocode/<model-id>` biçimindedir (ör. `kilocode/anthropic/claude-sonnet-4`).
- Varsayılan model: `kilocode/kilo/auto`
- Base URL: `https://api.kilo.ai/api/gateway/`
- Paketli geri dönüş kataloğu her zaman
  `input: ["text", "image"]`, `reasoning: true`, `contextWindow: 1000000`
  ve `maxTokens: 128000` ile `kilocode/kilo/auto` (`Kilo Auto`) içerir
- Başlangıçta OpenClaw `GET https://api.kilo.ai/api/gateway/models` dener ve
  keşfedilen modelleri statik geri dönüş kataloğundan önce birleştirir
- `kilocode/kilo/auto` arkasındaki tam üst akış yönlendirmesi OpenClaw içinde sabit kodlanmış değildir,
  Kilo Gateway'e aittir
- Kilo Gateway kaynakta OpenRouter uyumlu olarak belgelendiği için,
  yerel OpenAI istek şekillendirmesi yerine proxy tarzı OpenAI uyumlu yolda kalır
- Gemini destekli Kilo ref'leri proxy-Gemini yolunda kalır; bu nedenle OpenClaw
  yerel Gemini replay doğrulamasını veya bootstrap yeniden yazımlarını etkinleştirmeden
  burada Gemini thought-signature temizliğini sürdürür.
- Kilo'nun paylaşılan akış sarmalayıcısı sağlayıcı uygulama üstbilgisini ekler ve
  desteklenen somut model ref'leri için proxy reasoning payload'larını normalleştirir. `kilocode/kilo/auto`
  ve proxy reasoning'i desteklemeyen diğer ipuçları bu reasoning eklemesini atlar.
- Daha fazla model/sağlayıcı seçeneği için bkz. [/concepts/model-providers](/tr/concepts/model-providers).
- Kilo Gateway arka planda API anahtarınızla birlikte bir Bearer token kullanır.
