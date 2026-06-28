---
read_when:
    - OpenClaw’u NovitaAI modelleriyle çalıştırmak istiyorsunuz
    - Novita sağlayıcı kimliğine, anahtarına veya uç noktasına ihtiyacınız var
summary: NovitaAI'nin OpenAI uyumlu API'sini OpenClaw ile kullanın
title: NovitaAI
x-i18n:
    generated_at: "2026-06-28T01:11:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 602df700662dbf2176acabcad7d23950e8240158f58d115f8e56bf1fb9f43bcb
    source_path: providers/novita.md
    workflow: 16
---

NovitaAI, OpenAI uyumlu bir model API’sine sahip barındırılan bir yapay zeka altyapı sağlayıcısıdır. OpenClaw’da paketle birlikte gelen bir model sağlayıcısıdır; bu nedenle sağlayıcı kimliği
`novita` olur, kimlik bilgileri normal model kimlik doğrulama akışından geçer ve model başvuruları
`novita/deepseek/deepseek-v3-0324` gibi görünür.

Kendi çıkarım sunucunuzu çalıştırmadan açık ağırlıklı ve üçüncü taraf model
rotalarına barındırılan erişim istediğinizde Novita kullanın. Paketle birlikte gelen katalog,
Novita tarafından sunulan DeepSeek, Moonshot, MiniMax, GLM ve Qwen rotaları dahil olmak üzere
aracı turları için pratik olan sohbet modellerine odaklanır.

Bu sağlayıcı Novita’nın OpenAI uyumlu uç noktasını kullanır. OpenClaw
sağlayıcı kaydını, kimlik doğrulamayı, takma adları, model başvurusu normalleştirmeyi ve temel URL
seçimini yönetir; Novita ise canlı model kullanılabilirliğini, hesap izinlerini,
fiyatlandırmayı ve hız sınırlarını kontrol eder.

## Kurulum

[novita.ai/settings/key-management](https://novita.ai/settings/key-management) adresinde bir API anahtarı oluşturun, ardından şunu çalıştırın:

```bash
openclaw onboard --auth-choice novita-api-key
```

Veya şunu ayarlayın:

```bash
export NOVITA_API_KEY="<your-novita-api-key>" # pragma: allowlist secret
```

## Varsayılanlar

- Sağlayıcı: `novita`
- Takma adlar: `novita-ai`, `novitaai`
- Temel URL: `https://api.novita.ai/openai/v1`
- Ortam değişkeni: `NOVITA_API_KEY`
- Varsayılan model: `novita/deepseek/deepseek-v3-0324`

## Novita ne zaman seçilmeli

- OpenAI uyumlu bir API ile barındırılan açık ağırlıklı model erişimi istiyorsunuz.
- Tek bir sağlayıcı hesabı üzerinden DeepSeek, Kimi, MiniMax, GLM veya Qwen ailesi rotaları istiyorsunuz.
- OpenRouter, GMI, DeepInfra veya doğrudan satıcı API’lerinin yanında başka bir barındırılan yedek yol istiyorsunuz.
- vLLM, SGLang, LM Studio veya Ollama altyapısını sürdürmek yerine sağlayıcı tarafı model barındırmayı tercih ediyorsunuz.

Satıcıya özgü istek parametrelerine veya destek sözleşmelerine ihtiyacınız olduğunda doğrudan bir satıcı sağlayıcısı seçin. Modelin kendi donanımınızda veya kendi ağ sınırınızın arkasında çalışması gerektiğinde yerel bir sağlayıcı seçin.

## Modeller

Paketle birlikte gelen katalog, yaygın olarak kullanılabilen NovitaAI rota kimliklerini başlangıç olarak ekler; bunlar arasında şunlar bulunur:

- `novita/moonshotai/kimi-k2.5`
- `novita/minimax/minimax-m2.7`
- `novita/zai-org/glm-5`
- `novita/deepseek/deepseek-v3-0324`
- `novita/deepseek/deepseek-r1-0528`
- `novita/qwen/qwen3-235b-a22b-fp8`

Katalog, OpenClaw model seçimi için bir başlangıç noktasıdır. Hesabınız,
bölgeniz veya Novita’nın mevcut kataloğu rotalar ekleyebilir, kaldırabilir veya kısıtlayebilir. Uzun süreli bir varsayılan ayarlamadan önce
sağlayıcıyı CLI’dan kontrol edin:

```bash
openclaw models list --provider novita
```

## Sorun Giderme

- `401` veya `403`: Novita’nın anahtar yönetimi sayfasındaki anahtarı doğrulayın ve saklanan profil
  güncel değilse `openclaw onboard --auth-choice novita-api-key` komutunu yeniden çalıştırın.
- Bilinmeyen model hataları: `openclaw models list --provider novita` tarafından döndürülen tam
  `novita/<route-id>` değerini kullanın.
- Yavaş veya başarısız rotalar: başka bir Novita model rotasını deneyin veya sağlayıcıya özgü değişkenliği tolere edebilen iş yükleri için Novita’yı
  yedek sağlayıcı olarak ayarlayın.

## İlgili

- [Model sağlayıcıları](/tr/concepts/model-providers)
- [Tüm sağlayıcılar](/tr/providers/index)
