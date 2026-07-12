---
read_when:
    - OpenClaw'u GMI Cloud modelleriyle çalıştırmak istiyorsunuz
    - GMI sağlayıcı kimliği, anahtarı veya uç noktası gerekir
summary: GMI Cloud'un OpenAI uyumlu API'sini OpenClaw ile kullanın
title: GMI Cloud
x-i18n:
    generated_at: "2026-07-12T12:08:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a21fd2a997f44e1f78d97a0fba24ca2bbc00dd193323da712d650ed4ba105355
    source_path: providers/gmi.md
    workflow: 16
---

GMI Cloud, OpenAI uyumlu bir API arkasında öncü ve açık ağırlıklı modeller sunan barındırılan bir çıkarım platformudur. OpenClaw içinde resmi bir harici sağlayıcı Plugin'idir: bir kez kurun, kimlik bilgilerini normal model kimlik doğrulamasıyla saklayın ve `gmi/google/gemini-3.1-flash-lite` gibi model referanslarını kullanın.

Anthropic, DeepSeek, Google, Moonshot, OpenAI ve Z.AI dahil olmak üzere GMI kataloğunda sunulan birden fazla barındırılan model ailesi için tek bir API anahtarı kullanmak istediğinizde GMI'ı kullanın. Model yedeklemesi için ikincil sağlayıcı olarak, farklı satıcıların barındırılan rotalarını karşılaştırmak için veya GMI bir modeli birincil sağlayıcınızdan önce kullanıma sunduğunda kullanılabilir. Sağlayıcı kimliği, kimlik doğrulama profili, diğer adlar, model kataloğu başlangıç verileri ve temel URL OpenClaw tarafından yönetilir; güncel model kullanılabilirliği, faturalandırma, hız sınırları ve sağlayıcı tarafındaki tüm yönlendirme ilkeleri GMI tarafından yönetilir.

| Özellik                  | Değer                                    |
| ------------------------ | ---------------------------------------- |
| Sağlayıcı kimliği        | `gmi` (diğer adlar: `gmi-cloud`, `gmicloud`) |
| Paket                    | `@openclaw/gmi-provider`                 |
| Kimlik doğrulama ortam değişkeni | `GMI_API_KEY`                    |
| API                      | OpenAI uyumlu (`openai-completions`)     |
| Temel URL                | `https://api.gmi-serving.com/v1`         |
| Varsayılan model         | `gmi/google/gemini-3.1-flash-lite`       |

## Kurulum

Plugin'i kurun, Gateway'i yeniden başlatın ve ardından GMI Cloud'da (`https://www.gmicloud.ai/`) bir API anahtarı oluşturun:

```bash
openclaw plugins install @openclaw/gmi-provider
openclaw gateway restart
```

Ardından şunu çalıştırın:

```bash
openclaw onboard --auth-choice gmi-api-key
```

Etkileşimsiz kurulumlar `--gmi-api-key <key>` seçeneğini aktarabilir veya şunu ayarlayabilir:

```bash
export GMI_API_KEY="<your-gmi-api-key>" # pragma: allowlist secret
```

## GMI ne zaman tercih edilmeli?

- Yerel bir model sunucusu yerine barındırılan, OpenAI uyumlu bir uç nokta istiyorsanız.
- Tek bir sağlayıcı hesabı üzerinden birden fazla ticari ve açık ağırlıklı model ailesini denemek istiyorsanız.
- DeepInfra, OpenRouter, Together veya doğrudan satıcı API'lerinden farklı üst akış yönlendirmesine sahip bir yedek sağlayıcı istiyorsanız.
- GMI'a özgü model kimliklerine, fiyatlandırmaya veya hesap denetimlerine ihtiyacınız varsa.

GMI'ın OpenAI uyumlu rotası üzerinden sunmadığı satıcıya özgü özelliklere ihtiyacınız olduğunda bunun yerine doğrudan satıcı sağlayıcısını seçin. Veri yerelliği veya yerel GPU denetimi, barındırma kolaylığından daha önemli olduğunda LM Studio, Ollama, SGLang veya vLLM gibi yerel bir sağlayıcı seçin.

## Modeller

Plugin kataloğu, yaygın olarak kullanılabilen GMI Cloud rota kimliklerini başlangıç verisi olarak sağlar:

| Model referansı                     | Girdi        | Bağlam    | En fazla çıktı |
| ----------------------------------- | ------------ | --------- | -------------- |
| `gmi/anthropic/claude-sonnet-4.6`   | metin + görüntü | 200,000   | 64,000         |
| `gmi/deepseek-ai/DeepSeek-V3.2`     | metin        | 163,840   | 65,536         |
| `gmi/google/gemini-3.1-flash-lite`  | metin + görüntü | 1,048,576 | 65,536         |
| `gmi/moonshotai/Kimi-K2.5`          | metin + görüntü | 262,144   | 65,536         |
| `gmi/openai/gpt-5.4`                | metin + görüntü | 400,000   | 128,000        |
| `gmi/zai-org/GLM-5.1-FP8`           | metin        | 202,752   | 65,536         |

Katalog bir başlangıç verisidir; her hesabın her modeli her zaman çağırabileceğinin garantisi değildir. Yapılandırılmış sağlayıcının ortamınızda bildirdiği modelleri listeleyin:

```bash
openclaw models list --provider gmi
```

## Sorun giderme

- `401` veya `403`: OpenClaw'ı çalıştıran işlem için `GMI_API_KEY` değişkeninin ayarlandığını kontrol edin veya anahtarı sağlayıcı kimlik doğrulama profilinde saklamak için ilk katılım sürecini yeniden çalıştırın.
- Bilinmeyen model hataları: modelin GMI hesabınızda bulunduğunu doğrulayın ve `openclaw models list --provider gmi` tarafından gösterilen tam `gmi/<route-id>` referansını kullanın.
- Aralıklı sağlayıcı hataları: farklı bir GMI rotası deneyin veya GMI'ı tek birincil model sağlayıcısı yerine yedek olarak yapılandırın.

## İlgili

- [Model sağlayıcıları](/tr/concepts/model-providers)
- [Tüm sağlayıcılar](/tr/providers/index)
