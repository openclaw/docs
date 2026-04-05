---
read_when:
    - OpenClaw içinde Z.AI / GLM modellerini istiyorsunuz
    - Basit bir ZAI_API_KEY kurulumuna ihtiyacınız var
summary: OpenClaw ile Z.AI (GLM modelleri) kullanın
title: Z.AI
x-i18n:
    generated_at: "2026-04-05T14:05:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 48006cdd580484f0c62e2877b27a6a68d7bc44795b3e97a28213d95182d9acf9
    source_path: providers/zai.md
    workflow: 15
---

# Z.AI

Z.AI, **GLM** modelleri için API platformudur. GLM için REST API'leri sağlar ve kimlik doğrulama için API anahtarları kullanır. API anahtarınızı Z.AI konsolunda oluşturun. OpenClaw, bir Z.AI API anahtarıyla `zai` sağlayıcısını kullanır.

## CLI kurulumu

```bash
# Uç nokta otomatik algılamalı genel API anahtarı kurulumu
openclaw onboard --auth-choice zai-api-key

# Coding Plan Global, Coding Plan kullanıcıları için önerilir
openclaw onboard --auth-choice zai-coding-global

# Coding Plan CN (Çin bölgesi), Coding Plan kullanıcıları için önerilir
openclaw onboard --auth-choice zai-coding-cn

# Genel API
openclaw onboard --auth-choice zai-global

# General API CN (China region)
openclaw onboard --auth-choice zai-cn
```

## Yapılandırma kod parçacığı

```json5
{
  env: { ZAI_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "zai/glm-5" } } },
}
```

`zai-api-key`, OpenClaw'ın anahtardan eşleşen Z.AI uç noktasını algılamasına ve doğru temel URL'yi otomatik olarak uygulamasına olanak tanır. Belirli bir Coding Plan veya genel API yüzeyini zorlamak istediğinizde açık bölgesel seçenekleri kullanın.

## Birlikte gelen GLM kataloğu

OpenClaw şu anda birlikte gelen `zai` sağlayıcısını şunlarla başlatır:

- `glm-5.1`
- `glm-5`
- `glm-5-turbo`
- `glm-5v-turbo`
- `glm-4.7`
- `glm-4.7-flash`
- `glm-4.7-flashx`
- `glm-4.6`
- `glm-4.6v`
- `glm-4.5`
- `glm-4.5-air`
- `glm-4.5-flash`
- `glm-4.5v`

## Notlar

- GLM modelleri `zai/<model>` olarak kullanılabilir (örnek: `zai/glm-5`).
- Varsayılan birlikte gelen model ref'i: `zai/glm-5`
- Bilinmeyen `glm-5*` kimlikleri, kimlik mevcut GLM-5 ailesi biçimiyle eşleştiğinde `glm-4.7` şablonundan sağlayıcıya ait meta verileri sentezleyerek birlikte gelen sağlayıcı yolunda yine de ileri çözümlenir.
- Z.AI araç çağrısı akışı için `tool_stream` varsayılan olarak etkindir. Devre dışı bırakmak için `agents.defaults.models["zai/<model>"].params.tool_stream` değerini `false` olarak ayarlayın.
- Model ailesi genel görünümü için [/providers/glm](/tr/providers/glm) bölümüne bakın.
- Z.AI, API anahtarınızla birlikte Bearer kimlik doğrulaması kullanır.
