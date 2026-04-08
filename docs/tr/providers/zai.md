---
read_when:
    - OpenClaw içinde Z.AI / GLM modelleri istiyorsanız
    - Basit bir ZAI_API_KEY kurulumuna ihtiyacınız varsa
summary: OpenClaw ile Z.AI (GLM modelleri) kullanın
title: Z.AI
x-i18n:
    generated_at: "2026-04-08T06:01:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 66cbd9813ee28d202dcae34debab1b0cf9927793acb00743c1c62b48d9e381f9
    source_path: providers/zai.md
    workflow: 15
---

# Z.AI

Z.AI, **GLM** modelleri için API platformudur. GLM için REST API'leri sağlar ve
kimlik doğrulama için API anahtarları kullanır. API anahtarınızı Z.AI konsolunda oluşturun. OpenClaw, `zai` sağlayıcısını
bir Z.AI API anahtarıyla kullanır.

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

# General API CN (Çin bölgesi)
openclaw onboard --auth-choice zai-cn
```

## Yapılandırma parçacığı

```json5
{
  env: { ZAI_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "zai/glm-5.1" } } },
}
```

`zai-api-key`, OpenClaw'ın anahtardan eşleşen Z.AI uç noktasını algılamasına ve
doğru temel URL'yi otomatik olarak uygulamasına olanak tanır. Belirli bir Coding Plan veya genel API yüzeyini zorlamak istediğinizde
açık bölgesel seçenekleri kullanın.

## Paketlenmiş GLM kataloğu

OpenClaw şu anda paketlenmiş `zai` sağlayıcısını şunlarla tohumlar:

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

- GLM modelleri `zai/<model>` olarak kullanılabilir (`zai/glm-5` örneği).
- Varsayılan paketlenmiş model başvurusu: `zai/glm-5.1`
- Bilinmeyen `glm-5*` kimlikleri, kimlik
  geçerli GLM-5 ailesi şekliyle eşleştiğinde `glm-4.7` şablonundan sağlayıcıya ait meta veriler sentezlenerek paketlenmiş sağlayıcı yolunda yine de ileri çözülür.
- Z.AI araç çağrısı akışı için `tool_stream` varsayılan olarak etkindir. Devre dışı bırakmak için
  `agents.defaults.models["zai/<model>"].params.tool_stream` değerini `false` olarak ayarlayın.
- Model ailesi genel görünümü için bkz. [/providers/glm](/tr/providers/glm).
- Z.AI, API anahtarınızla Bearer kimlik doğrulaması kullanır.
