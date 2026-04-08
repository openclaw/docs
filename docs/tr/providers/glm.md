---
read_when:
    - OpenClaw içinde GLM modelleri istiyorsanız
    - Model adlandırma kuralına ve kuruluma ihtiyacınız varsa
summary: GLM model ailesine genel bakış + OpenClaw içinde nasıl kullanılacağı
title: GLM Modelleri
x-i18n:
    generated_at: "2026-04-08T06:00:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 79a55acfa139847b4b85dbc09f1068cbd2febb1e49f984a23ea9e3b43bc910eb
    source_path: providers/glm.md
    workflow: 15
---

# GLM modelleri

GLM, Z.AI platformu üzerinden sunulan bir **model ailesidir** (şirket değil). OpenClaw içinde GLM
modellerine `zai` sağlayıcısı ve `zai/glm-5` gibi model kimlikleri üzerinden erişilir.

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

## Mevcut paketlenmiş GLM modelleri

OpenClaw şu anda paketlenmiş `zai` sağlayıcısını şu GLM başvurularıyla tohumlar:

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

- GLM sürümleri ve kullanılabilirliği değişebilir; en güncel bilgiler için Z.AI belgelerine bakın.
- Varsayılan paketlenmiş model başvurusu `zai/glm-5.1` şeklindedir.
- Sağlayıcı ayrıntıları için bkz. [/providers/zai](/tr/providers/zai).
