---
read_when:
    - qwen-oauth sağlayıcı kimliğini yapılandırmak istiyorsunuz
    - Daha önce Qwen Portal OAuth kimlik bilgilerini kullandınız
    - Qwen Portal uç noktasına veya geçiş rehberliğine ihtiyacınız var
summary: OpenClaw ile Qwen Portal sağlayıcı kimliğini kullanın
title: Qwen OAuth / Portalı
x-i18n:
    generated_at: "2026-07-12T12:44:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b78f6f23e62e38d11e6fe4e2bf515b13b414f276d08f672740ad94747a22c8fb
    source_path: providers/qwen-oauth.md
    workflow: 16
---

`qwen-oauth`, Qwen eklentisi (`@openclaw/qwen-provider`) tarafından kaydedilen Qwen Portal sağlayıcı kimliğidir. `https://portal.qwen.ai/v1` adresindeki Qwen Portal uç noktasını hedefler ve eski Qwen OAuth / portal kurulumlarının, standart `qwen` sağlayıcısından ayrı bir sağlayıcı kimliği üzerinden kullanılabilmesini sağlar.

Çalışan bir Qwen Portal belirteciniz zaten varsa, eski bir Qwen OAuth veya Qwen CLI iş akışını taşıyorsanız ya da özellikle Qwen Portal uç noktasını test etmeniz gerekiyorsa `qwen-oauth` seçeneğini tercih edin. Yeni kurulumlarda Standart ModelStudio uç noktasıyla [Qwen](/tr/providers/qwen) kullanmayı tercih edin: yeni API anahtarı kurulumlarını, daha geniş uç nokta seçeneklerini, kullandıkça ödemeli Standart planı, Coding Plan'i ve Qwen eklenti kataloğunun tamamını kapsar.

## Kurulum

Henüz yüklemediyseniz Qwen eklentisini yükleyin:

```bash
openclaw plugins install @openclaw/qwen-provider
openclaw gateway restart
```

Portal belirtecinizi ilk katılım süreciyle sağlayın:

```bash
openclaw onboard --auth-choice qwen-oauth
```

Etkileşimsiz çalıştırmalar belirteci `--qwen-oauth-token <token>` seçeneğinden okur; alternatif olarak şunu ayarlayın:

```bash
export QWEN_API_KEY="<your-qwen-portal-token>" # pragma: allowlist secret
```

İlk katılım süreci, belirteci bir `qwen-oauth` kimlik doğrulama profili altında saklar, portal model kataloğunu başlangıç verileriyle doldurur ve yapılandırılmış bir model yoksa `qwen-oauth/qwen3.5-plus` modelini varsayılan olarak ayarlar.

## Varsayılanlar

- Sağlayıcı: `qwen-oauth`
- Diğer adlar: `qwen-portal`, `qwen-cli`
- Temel URL: `https://portal.qwen.ai/v1`
- Ortam değişkeni: `QWEN_API_KEY`
- API biçimi: OpenAI uyumlu
- Varsayılan model: `qwen-oauth/qwen3.5-plus`

## Qwen'den farkı

OpenClaw'da Qwen'e yönelik iki sağlayıcı kimliği vardır:

| Sağlayıcı    | Uç nokta ailesi                                           | En uygun kullanım                                                                        |
| ------------ | --------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `qwen`       | Qwen Cloud / Alibaba DashScope ve Coding Plan uç noktaları | Yeni API anahtarı kurulumları, kullandıkça ödemeli Standart plan, Coding Plan, çok modlu DashScope özellikleri |
| `qwen-oauth` | `portal.qwen.ai/v1` adresindeki Qwen Portal uç noktası     | Mevcut Qwen Portal belirteçleri ve eski Qwen OAuth / CLI kurulumları                       |

Her iki sağlayıcı da OpenAI uyumlu istek biçimleri kullanır ancak kimlik doğrulama yüzeyleri ayrıdır. `qwen-oauth` için saklanan bir belirteç, DashScope veya ModelStudio anahtarı olarak değerlendirilmemelidir; yeni bir DashScope anahtarı ise standart `qwen` sağlayıcısını kullanmalıdır.

## Modeller

Qwen eklentisi, Qwen Portal uç noktası için bu statik kataloğu başlangıç verileriyle doldurur. Tüm girdiler en fazla 65.536 belirteçlik çıktı kullanır; kullanılabilirlik mevcut Qwen Portal hesabına ve belirtecine bağlıdır.

| Model başvurusu                    | Girdi        | Bağlam    | Notlar           |
| ---------------------------------- | ------------ | --------- | ---------------- |
| `qwen-oauth/qwen3.5-plus`          | metin, görsel | 1.000.000 | Varsayılan model |
| `qwen-oauth/qwen3.6-plus`          | metin, görsel | 1.000.000 |                  |
| `qwen-oauth/qwen3-max-2026-01-23`  | metin         | 262.144   |                  |
| `qwen-oauth/qwen3-coder-next`      | metin         | 262.144   |                  |
| `qwen-oauth/qwen3-coder-plus`      | metin         | 1.000.000 |                  |
| `qwen-oauth/MiniMax-M2.5`          | metin         | 1.000.000 | Akıl yürütme     |
| `qwen-oauth/glm-5`                 | metin         | 202.752   |                  |
| `qwen-oauth/glm-4.7`               | metin         | 202.752   |                  |
| `qwen-oauth/kimi-k2.5`             | metin, görsel | 262.144   |                  |

Hesabınız bunun yerine ModelStudio / DashScope API anahtarlarını kullanıyorsa standart `qwen` sağlayıcısını yapılandırın:

```bash
openclaw onboard --auth-choice qwen-standard-api-key
openclaw models set qwen/qwen3-coder-plus
```

## Geçiş

Eski Qwen Portal OAuth profilleri yenilenemez; `openclaw doctor` bunları işaretler. Bir portal profili çalışmayı durdurursa güncel bir belirteçle ilk katılım sürecini yeniden çalıştırın veya Standart Qwen sağlayıcısına geçin:

```bash
openclaw onboard --auth-choice qwen-standard-api-key
```

Standart küresel ModelStudio şu adresi kullanır:

```text
https://dashscope-intl.aliyuncs.com/compatible-mode/v1
```

## Sorun giderme

- Portal OAuth yenileme hataları: Eski Qwen Portal OAuth profilleri yenilenemez. Güncel bir belirteçle ilk katılım sürecini yeniden çalıştırın.
- Yanlış uç nokta hataları: Portal belirteci kullanırken model başvurusunun `qwen-oauth/` ile başladığını doğrulayın. `qwen/` başvurularını yalnızca standart Qwen sağlayıcısı için kullanın.
- `QWEN_API_KEY` karışıklığı: Her iki Qwen sayfasında da bu ortam değişkeninden bahsedilir ancak ilk katılım süreci kimlik bilgilerini seçilen sağlayıcı kimliği altında saklar. Aynı makinede hem `qwen` hem de `qwen-oauth` kullanılabilir durumda tutuluyorsa ilk katılım sürecini tercih edin.

## İlgili içerikler

- [Qwen](/tr/providers/qwen)
- [Alibaba Model Studio](/tr/providers/alibaba)
- [Model sağlayıcıları](/tr/concepts/model-providers)
- [Tüm sağlayıcılar](/tr/providers/index)
