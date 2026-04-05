---
read_when:
    - OpenClaw içinde GLM modelleri istiyorsunuz
    - Model adlandırma kuralına ve kuruluma ihtiyacınız var
summary: GLM model ailesine genel bakış + OpenClaw içinde nasıl kullanılacağı
title: GLM Modelleri
x-i18n:
    generated_at: "2026-04-05T14:03:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 59622edab5094d991987f9788fbf08b33325e737e7ff88632b0c3ac89412d4c7
    source_path: providers/glm.md
    workflow: 15
---

# GLM modelleri

GLM, Z.AI platformu üzerinden sunulan bir **model ailesidir** (şirket değil). OpenClaw içinde GLM
modellerine `zai` sağlayıcısı ve `zai/glm-5` gibi model kimlikleri üzerinden erişilir.

## CLI kurulumu

```bash
# Endpoint otomatik algılamalı genel API anahtarı kurulumu
openclaw onboard --auth-choice zai-api-key

# Coding Plan Global, Coding Plan kullanıcıları için önerilir
openclaw onboard --auth-choice zai-coding-global

# Coding Plan CN (Çin bölgesi), Coding Plan kullanıcıları için önerilir
openclaw onboard --auth-choice zai-coding-cn

# Genel API
openclaw onboard --auth-choice zai-global

# Genel API CN (Çin bölgesi)
openclaw onboard --auth-choice zai-cn
```

## Config parçacığı

```json5
{
  env: { ZAI_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "zai/glm-5" } } },
}
```

`zai-api-key`, OpenClaw'ın anahtardan eşleşen Z.AI endpoint'ini algılamasına ve
doğru base URL'yi otomatik olarak uygulamasına izin verir. Belirli bir Coding Plan veya genel API yüzeyini zorlamak istediğinizde
açık bölgesel seçenekleri kullanın.

## Mevcut paketli GLM modelleri

OpenClaw şu anda paketli `zai` sağlayıcısını şu GLM referanslarıyla başlatır:

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

- GLM sürümleri ve kullanılabilirliği değişebilir; en güncel bilgiler için Z.AI belgelerini kontrol edin.
- Varsayılan paketli model ref'i `zai/glm-5` değeridir.
- Sağlayıcı ayrıntıları için bkz. [/providers/zai](/providers/zai).
