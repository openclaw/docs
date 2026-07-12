---
read_when:
    - OpenClaw'u NovitaAI modelleriyle çalıştırmak istiyorsunuz
    - Novita sağlayıcı kimliği, anahtarı veya uç noktası gereklidir
summary: OpenClaw ile NovitaAI'ın OpenAI uyumlu API'sini kullanın
title: NovitaAI
x-i18n:
    generated_at: "2026-07-12T12:40:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 83e0e43e68d85d73e790023858a49f971b683129dbbdf6092fbd8bba4d8da331
    source_path: providers/novita.md
    workflow: 16
---

NovitaAI, OpenAI uyumlu bir API sunan, barındırılan bir yapay zekâ altyapısı sağlayıcısıdır.
Paketlenmiş bir OpenClaw sağlayıcısı olarak sunulur (ayrı bir Plugin kurulumu gerekmez); bu nedenle
kimlik bilgileri normal model kimlik doğrulama akışından geçer ve model referansları
`novita/deepseek/deepseek-v3-0324` biçimindedir.

## Kurulum

[novita.ai/settings/key-management](https://novita.ai/settings/key-management) adresinde bir API anahtarı oluşturun, ardından şunu çalıştırın:

```bash
openclaw onboard --auth-choice novita-api-key
```

Alternatif olarak şunu ayarlayın:

```bash
export NOVITA_API_KEY="<your-novita-api-key>" # pragma: allowlist secret
```

## Varsayılanlar

| Ayar               | Değer                              |
| ------------------ | ---------------------------------- |
| Sağlayıcı kimliği  | `novita`                           |
| Takma adlar        | `novita-ai`, `novitaai`            |
| Temel URL          | `https://api.novita.ai/openai/v1`  |
| Ortam değişkeni    | `NOVITA_API_KEY`                   |
| Varsayılan model   | `novita/deepseek/deepseek-v3-0324` |

## Paketlenmiş model kataloğu

- `novita/moonshotai/kimi-k2.5`
- `novita/minimax/minimax-m2.7`
- `novita/zai-org/glm-5`
- `novita/deepseek/deepseek-v3-0324`
- `novita/deepseek/deepseek-r1-0528`
- `novita/qwen/qwen3-235b-a22b-fp8`

Bu, canlı bir katalog değil, bir başlangıç noktasıdır. Hesabınız, bölgeniz veya
Novita'nın güncel teklifleri rotalar ekleyebilir, kaldırabilir ya da kısıtlayabilir. Uzun süreli
bir varsayılan ayarlamadan önce kontrol edin:

```bash
openclaw models list --provider novita
```

## Novita ne zaman seçilmeli?

- OpenAI uyumlu bir API ile barındırılan açık ağırlıklı modellere erişim.
- Tek bir sağlayıcı hesabı üzerinden DeepSeek, Kimi, MiniMax, GLM veya Qwen ailesi
  rotaları.
- DeepInfra, GMI, OpenRouter veya doğrudan sağlayıcı API'lerinin yanında barındırılan
  başka bir geri dönüş yolu.
- LM Studio, Ollama, SGLang veya vLLM altyapısının bakımını yapmak yerine
  sağlayıcı tarafında model barındırma.

Sağlayıcıya özgü istek parametrelerine veya destek sözleşmelerine ihtiyaç duyduğunuzda
doğrudan ilgili sağlayıcıyı seçin. Modelin kendi donanımınızda veya ağ sınırlarınız içinde
çalışması gerektiğinde yerel bir sağlayıcı seçin.

## Sorun giderme

- `401`/`403`: Novita'nın anahtar yönetimi sayfasındaki anahtarı doğrulayın ve kayıtlı profil
  güncel değilse `openclaw onboard --auth-choice novita-api-key` komutunu yeniden
  çalıştırın.
- Bilinmeyen model hataları: `openclaw models list --provider novita` tarafından döndürülen
  tam `novita/<route-id>` değerini kullanın.
- Yavaş veya başarısız rotalar: başka bir Novita model rotası deneyin ya da sağlayıcıya özgü
  değişkenliği tolere edebilen iş yükleri için Novita'yı geri dönüş sağlayıcısı olarak
  ayarlayın.

## İlgili

- [Model sağlayıcıları](/tr/concepts/model-providers)
- [Sağlayıcı dizini](/tr/providers/index)
