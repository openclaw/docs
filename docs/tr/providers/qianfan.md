---
read_when:
    - Birçok LLM için tek bir API anahtarı istediğinizde
    - Baidu Qianfan kurulum rehberine ihtiyaç duyduğunuzda
summary: OpenClaw içinde birçok modele erişmek için Qianfan'ın birleşik API'sini kullanın
title: Qianfan
x-i18n:
    generated_at: "2026-04-05T14:04:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 965d83dd968563447ce3571a73bd71c6876275caff8664311a852b2f9827e55b
    source_path: providers/qianfan.md
    workflow: 15
---

# Qianfan Sağlayıcı Rehberi

Qianfan, Baidu'nun MaaS platformudur ve istekleri tek bir
uç nokta ve API anahtarı arkasında birçok modele yönlendiren **birleşik bir API** sağlar. OpenAI uyumludur, bu nedenle çoğu OpenAI SDK'sı temel URL değiştirilerek çalışır.

## Ön koşullar

1. Qianfan API erişimine sahip bir Baidu Cloud hesabı
2. Qianfan konsolundan bir API anahtarı
3. Sisteminizde kurulu OpenClaw

## API Anahtarınızı Alma

1. [Qianfan Console](https://console.bce.baidu.com/qianfan/ais/console/apiKey) sayfasını ziyaret edin
2. Yeni bir uygulama oluşturun veya mevcut bir uygulamayı seçin
3. Bir API anahtarı oluşturun (biçim: `bce-v3/ALTAK-...`)
4. OpenClaw ile kullanmak için API anahtarını kopyalayın

## CLI kurulumu

```bash
openclaw onboard --auth-choice qianfan-api-key
```

## Yapılandırma parçacığı

```json5
{
  env: { QIANFAN_API_KEY: "bce-v3/ALTAK-..." },
  agents: {
    defaults: {
      model: { primary: "qianfan/deepseek-v3.2" },
      models: {
        "qianfan/deepseek-v3.2": { alias: "QIANFAN" },
      },
    },
  },
  models: {
    providers: {
      qianfan: {
        baseUrl: "https://qianfan.baidubce.com/v2",
        api: "openai-completions",
        models: [
          {
            id: "deepseek-v3.2",
            name: "DEEPSEEK V3.2",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 98304,
            maxTokens: 32768,
          },
          {
            id: "ernie-5.0-thinking-preview",
            name: "ERNIE-5.0-Thinking-Preview",
            reasoning: true,
            input: ["text", "image"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 119000,
            maxTokens: 64000,
          },
        ],
      },
    },
  },
}
```

## Notlar

- Varsayılan paketlenmiş model başvurusu: `qianfan/deepseek-v3.2`
- Varsayılan temel URL: `https://qianfan.baidubce.com/v2`
- Paketlenmiş katalog şu anda `deepseek-v3.2` ve `ernie-5.0-thinking-preview` içerir
- Özel bir temel URL veya model meta verisine ihtiyacınız olmadıkça yalnızca `models.providers.qianfan` ekleyin veya geçersiz kılın
- Qianfan, yerel OpenAI istek şekillendirmesi değil, OpenAI uyumlu taşıma yolu üzerinden çalışır

## İlgili Belgeler

- [OpenClaw Yapılandırması](/tr/gateway/configuration)
- [Model Sağlayıcıları](/tr/concepts/model-providers)
- [Aracı Kurulumu](/tr/concepts/agent)
- [Qianfan API Documentation](https://cloud.baidu.com/doc/qianfan-api/s/3m7of64lb)
