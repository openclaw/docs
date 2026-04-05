---
read_when:
    - Birçok LLM için tek bir API anahtarı istiyorsunuz
    - OpenClaw'da modelleri OpenRouter üzerinden çalıştırmak istiyorsunuz
summary: OpenClaw'da birçok modele erişmek için OpenRouter'ın birleşik API'sini kullanın
title: OpenRouter
x-i18n:
    generated_at: "2026-04-05T14:04:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8dd354ba060bcb47724c89ae17c8e2af8caecac4bd996fcddb584716c1840b87
    source_path: providers/openrouter.md
    workflow: 15
---

# OpenRouter

OpenRouter, istekleri tek bir
uç nokta ve API anahtarı arkasında birçok modele yönlendiren **birleşik bir API** sağlar. OpenAI uyumludur, bu nedenle çoğu OpenAI SDK'sı base URL değiştirilerek çalışır.

## CLI kurulumu

```bash
openclaw onboard --auth-choice openrouter-api-key
```

## Yapılandırma parçası

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      model: { primary: "openrouter/auto" },
    },
  },
}
```

## Notlar

- Model referansları `openrouter/<provider>/<model>` biçimindedir.
- Onboarding varsayılan olarak `openrouter/auto` kullanır. Daha sonra
  `openclaw models set openrouter/<provider>/<model>` ile somut bir modele geçin.
- Daha fazla model/sağlayıcı seçeneği için bkz. [/concepts/model-providers](/tr/concepts/model-providers).
- OpenRouter, arka planda API anahtarınızla birlikte bir Bearer token kullanır.
- Gerçek OpenRouter isteklerinde (`https://openrouter.ai/api/v1`), OpenClaw ayrıca
  OpenRouter'ın belgelenmiş uygulama ilişkilendirme üst bilgilerini de ekler:
  `HTTP-Referer: https://openclaw.ai`, `X-OpenRouter-Title: OpenClaw` ve
  `X-OpenRouter-Categories: cli-agent`.
- Doğrulanmış OpenRouter yollarında Anthropic model referansları da,
  sistem/geliştirici prompt bloklarında daha iyi prompt-cache yeniden kullanımı için OpenClaw'ın kullandığı
  OpenRouter'a özgü Anthropic `cache_control` işaretçilerini korur.
- OpenRouter sağlayıcısını başka bir proxy/base URL'ye yeniden yönlendirirseniz, OpenClaw
  bu OpenRouter'a özgü üst bilgileri veya Anthropic önbellek işaretçilerini eklemez.
- OpenRouter hâlâ proxy tarzı OpenAI uyumlu yol üzerinden çalışır, bu yüzden
  `serviceTier`, Responses `store`,
  OpenAI reasoning-compat yükleri ve prompt-cache ipuçları gibi yalnızca yerel OpenAI'ye özgü istek şekillendirmeleri iletilmez.
- Gemini tabanlı OpenRouter referansları proxy-Gemini yolunda kalır: OpenClaw
  orada Gemini thought-signature temizliğini korur, ancak yerel Gemini
  replay doğrulamasını veya bootstrap yeniden yazımlarını etkinleştirmez.
- Desteklenen `auto` olmayan yollarda OpenClaw, seçilen thinking düzeyini
  OpenRouter proxy reasoning yüklerine eşler. Desteklenmeyen model ipuçları ve
  `openrouter/auto`, bu reasoning eklemesini atlar.
- Model parametreleri altında OpenRouter sağlayıcı yönlendirmesi geçirirseniz, OpenClaw
  bunu paylaşılan akış sarmalayıcıları çalışmadan önce OpenRouter yönlendirme meta verisi olarak iletir.
