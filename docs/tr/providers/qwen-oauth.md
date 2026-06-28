---
read_when:
    - qwen-oauth sağlayıcı kimliğini yapılandırmak istiyorsunuz
    - Daha önce Qwen Portal OAuth kimlik bilgilerini kullandınız
    - Qwen Portal uç noktasına veya geçiş rehberliğine ihtiyacınız var
summary: OpenClaw ile Qwen Portal sağlayıcı kimliğini kullanın
title: Qwen OAuth / Portalı
x-i18n:
    generated_at: "2026-06-28T01:12:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 46f147e3730024bf63e99827f666e2be791318723eace98941ca067c440dddd0
    source_path: providers/qwen-oauth.md
    workflow: 16
---

`qwen-oauth`, Qwen Portal sağlayıcı kimliğidir. Qwen Portal uç noktasını hedefler
ve eski Qwen OAuth / portal kurulumlarının ayrı bir sağlayıcı kimliğiyle
adreslenebilir kalmasını sağlar.

Bu sağlayıcıyı özellikle `https://portal.qwen.ai/v1` için güncel bir Qwen Portal
token’ınız varsa veya eski bir Qwen Portal / Qwen CLI kurulumunu taşıyor ve bu
kimlik bilgilerini kanonik Qwen Cloud sağlayıcısından ayrı tutmak istiyorsanız
kullanın. Yeni Qwen kullanıcıları için önerilen ilk seçenek değildir.

Yeni Qwen Cloud kurulumları için, özellikle güncel bir Qwen Portal token’ınız
yoksa Standard ModelStudio uç noktasıyla [Qwen](/tr/providers/qwen) sağlayıcısını
tercih edin.

## Kurulum

Portal token’ınızı onboarding üzerinden sağlayın:

```bash
openclaw onboard --auth-choice qwen-oauth
```

Veya şunu ayarlayın:

```bash
export QWEN_API_KEY="<your-qwen-portal-token>" # pragma: allowlist secret
```

## Varsayılanlar

- Sağlayıcı: `qwen-oauth`
- Takma adlar: `qwen-portal`, `qwen-cli`
- Temel URL: `https://portal.qwen.ai/v1`
- Ortam değişkeni: `QWEN_API_KEY`
- API stili: OpenAI uyumlu
- Varsayılan model: `qwen-oauth/qwen3.5-plus`

## Bunun Qwen’den farkı

OpenClaw’da Qwen’e yönelik iki sağlayıcı kimliği vardır:

| Sağlayıcı    | Uç nokta ailesi                                        | En uygun kullanım                                                                      |
| ------------ | ------------------------------------------------------ | -------------------------------------------------------------------------------------- |
| `qwen`       | Qwen Cloud / Alibaba DashScope ve Coding Plan uç noktaları | Yeni API anahtarı kurulumları, Standard kullandıkça öde, Coding Plan, çok modlu DashScope özellikleri |
| `qwen-oauth` | `portal.qwen.ai/v1` adresindeki Qwen Portal uç noktası | Mevcut Qwen Portal token’ları ve eski Qwen OAuth / CLI kurulumları                     |

Her iki sağlayıcı da OpenAI uyumlu istek şekilleri kullanır, ancak ayrı kimlik
doğrulama yüzeyleridir. `qwen-oauth` için saklanan bir token DashScope veya
ModelStudio anahtarı olarak değerlendirilmemeli; yeni bir DashScope anahtarı
ise bunun yerine kanonik `qwen` sağlayıcısını kullanmalıdır.

## Qwen OAuth / Portal ne zaman seçilmeli

- Zaten çalışan bir Qwen Portal token’ınız var.
- OpenClaw’ın sağlayıcı modeline geçerken eski bir Qwen OAuth veya Qwen CLI iş
  akışını koruyorsunuz.
- Özellikle Qwen Portal uç noktasıyla uyumluluğu test etmeniz gerekiyor.

Yeni kurulum, daha geniş uç nokta seçenekleri, Standard ModelStudio, Coding Plan
ve tam Qwen Plugin kataloğu için [Qwen](/tr/providers/qwen) seçeneğini kullanın.

## Modeller

Qwen Plugin kataloğu, Qwen Portal varsayılanını başlatır:

- `qwen-oauth/qwen3.5-plus`

Kullanılabilirlik, güncel Qwen Portal hesabına ve token’a bağlıdır. Hesabınız
bunun yerine ModelStudio / DashScope API anahtarları kullanıyorsa kanonik
`qwen` sağlayıcısını yapılandırın:

```bash
openclaw onboard --auth-choice qwen-standard-api-key
openclaw models set qwen/qwen3-coder-plus
```

## Geçiş

Eski Qwen Portal OAuth profilleri yenilenebilir olmayabilir. Bir portal profili
çalışmayı durdurursa güncel bir token ile yeniden kimlik doğrulayın veya
Standard Qwen sağlayıcısına geçin:

```bash
openclaw onboard --auth-choice qwen-standard-api-key
```

Standard global ModelStudio şunu kullanır:

```text
https://dashscope-intl.aliyuncs.com/compatible-mode/v1
```

## Sorun giderme

- Portal OAuth yenileme hataları: eski Qwen Portal OAuth profilleri yenilenebilir
  olmayabilir. Güncel bir token ile onboarding’i yeniden çalıştırın.
- Yanlış uç nokta hataları: portal token’ı kullanırken model referansının
  `qwen-oauth/` ile başladığını doğrulayın. `qwen/` referanslarını yalnızca
  kanonik Qwen sağlayıcısı için kullanın.
- `QWEN_API_KEY` karışıklığı: Her iki Qwen sayfası da bu ortam değişkeninden
  bahseder, ancak onboarding kimlik bilgilerini seçilen sağlayıcı kimliği altında
  saklar. Aynı makinede hem `qwen` hem de `qwen-oauth` kullanılabilir durumdaysa
  onboarding’i tercih edin.

## İlgili

- [Qwen](/tr/providers/qwen)
- [Alibaba Model Studio](/tr/providers/alibaba)
- [Model sağlayıcıları](/tr/concepts/model-providers)
- [Tüm sağlayıcılar](/tr/providers/index)
