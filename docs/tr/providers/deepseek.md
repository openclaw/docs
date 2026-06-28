---
read_when:
    - OpenClaw ile DeepSeek kullanmak istiyorsunuz
    - API anahtarı ortam değişkeni veya CLI kimlik doğrulama seçimi gerekir
summary: DeepSeek kurulumu (kimlik doğrulama + model seçimi)
title: DeepSeek
x-i18n:
    generated_at: "2026-06-28T01:09:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0446f78e1cb6412034ca18b0db49f2f3a1958e91a013661b3056bf3687fc2d09
    source_path: providers/deepseek.md
    workflow: 16
---

[DeepSeek](https://www.deepseek.com), OpenAI uyumlu API ile güçlü AI modelleri sağlar.

| Özellik | Değer                      |
| -------- | -------------------------- |
| Sağlayıcı | `deepseek`                 |
| Kimlik Doğrulama | `DEEPSEEK_API_KEY`         |
| API      | OpenAI uyumlu          |
| Temel URL | `https://api.deepseek.com` |

## Plugin yükleme

Resmi Plugin'i yükleyin, ardından Gateway'i yeniden başlatın:

```bash
openclaw plugins install @openclaw/deepseek-provider
openclaw gateway restart
```

## Başlarken

<Steps>
  <Step title="API anahtarınızı alın">
    [platform.deepseek.com](https://platform.deepseek.com/api_keys) adresinde bir API anahtarı oluşturun.
  </Step>
  <Step title="Onboarding'i çalıştırın">
    ```bash
    openclaw onboard --auth-choice deepseek-api-key
    ```

    Bu, API anahtarınızı ister ve varsayılan model olarak `deepseek/deepseek-v4-flash` ayarlar.

  </Step>
  <Step title="Modellerin kullanılabilir olduğunu doğrulayın">
    ```bash
    openclaw models list --provider deepseek
    ```

    Çalışan bir Gateway gerektirmeden Plugin'in statik kataloğunu incelemek için
    şunu kullanın:

    ```bash
    openclaw models list --all --provider deepseek
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Etkileşimsiz kurulum">
    Betiklenmiş veya başsız kurulumlar için tüm bayrakları doğrudan geçirin:

    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice deepseek-api-key \
      --deepseek-api-key "$DEEPSEEK_API_KEY" \
      --skip-health \
      --accept-risk
    ```

  </Accordion>
</AccordionGroup>

<Warning>
Gateway bir daemon (launchd/systemd) olarak çalışıyorsa `DEEPSEEK_API_KEY`
değerinin bu süreç tarafından kullanılabildiğinden emin olun (örneğin, `~/.openclaw/.env` içinde veya
`env.shellEnv` aracılığıyla).
</Warning>

## Yerleşik katalog

| Model ref                    | Ad              | Giriş | Bağlam   | Maksimum çıktı | Notlar                                      |
| ---------------------------- | ----------------- | ----- | --------- | ---------- | ------------------------------------------ |
| `deepseek/deepseek-v4-flash` | DeepSeek V4 Flash | metin  | 1,000,000 | 384,000    | Varsayılan model; V4 düşünme yetenekli yüzey |
| `deepseek/deepseek-v4-pro`   | DeepSeek V4 Pro   | metin  | 1,000,000 | 384,000    | V4 düşünme yetenekli yüzey                |
| `deepseek/deepseek-chat`     | DeepSeek Chat     | metin  | 131,072   | 8,192      | DeepSeek V3.2 düşünmesiz yüzey         |
| `deepseek/deepseek-reasoner` | DeepSeek Reasoner | metin  | 131,072   | 65,536     | Akıl yürütme etkin V3.2 yüzeyi             |

<Tip>
V4 modelleri DeepSeek'in `thinking` denetimini destekler. OpenClaw ayrıca araç
çağrılarıyla düşünme oturumlarının devam edebilmesi için takip turlarında
DeepSeek `reasoning_content` değerini yeniden oynatır.
DeepSeek V4 modelleriyle DeepSeek'in maksimum `reasoning_effort` değerini istemek için
`/think xhigh` veya `/think max` kullanın.
</Tip>

## Düşünme ve araçlar

DeepSeek V4 düşünme oturumlarının yeniden oynatma sözleşmesi çoğu
OpenAI uyumlu sağlayıcıdan daha katıdır: Düşünme etkin bir tur araçları kullandıktan sonra DeepSeek,
takip isteklerinde o turdan yeniden oynatılan assistant mesajlarının
`reasoning_content` içermesini bekler. OpenClaw bunu DeepSeek Plugin'i içinde
ele alır, bu nedenle normal çok turlu araç kullanımı
`deepseek/deepseek-v4-flash` ve `deepseek/deepseek-v4-pro` ile çalışır.

Mevcut bir oturumu başka bir OpenAI uyumlu sağlayıcıdan bir
DeepSeek V4 modeline geçirirseniz eski assistant araç çağrısı turlarında yerel
DeepSeek `reasoning_content` bulunmayabilir. OpenClaw, DeepSeek V4 düşünme
istekleri için yeniden oynatılan assistant mesajlarında eksik olan bu alanı doldurur; böylece sağlayıcı
`/new` gerektirmeden geçmişi kabul edebilir.

OpenClaw'da düşünme devre dışı bırakıldığında (UI **Yok** seçimi dahil),
OpenClaw DeepSeek'e `thinking: { type: "disabled" }` gönderir ve giden geçmişten yeniden oynatılan
`reasoning_content` değerini çıkarır. Bu, düşünmesi devre dışı oturumları
düşünmesiz DeepSeek yolunda tutar.

Varsayılan hızlı yol için `deepseek/deepseek-v4-flash` kullanın. Daha güçlü V4 modelini istediğinizde ve
daha yüksek maliyet ya da gecikmeyi kabul edebildiğinizde
`deepseek/deepseek-v4-pro` kullanın.

## Canlı test

Doğrudan canlı model paketi, modern model kümesinde DeepSeek V4'ü içerir. Yalnızca
DeepSeek V4 doğrudan model kontrollerini çalıştırmak için:

```bash
OPENCLAW_LIVE_PROVIDERS=deepseek \
OPENCLAW_LIVE_MODELS="deepseek/deepseek-v4-flash,deepseek/deepseek-v4-pro" \
pnpm test:live src/agents/models.profiles.live.test.ts
```

Bu canlı kontrol, her iki V4 modelinin de tamamlayabildiğini ve düşünme/araç
takip turlarının DeepSeek'in gerektirdiği yeniden oynatma yükünü koruduğunu doğrular.

## Yapılandırma örneği

```json5
{
  env: { DEEPSEEK_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "deepseek/deepseek-v4-flash" },
    },
  },
}
```

## İlgili

<CardGroup cols={2}>
  <Card title="Model seçimi" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model ref değerlerini ve failover davranışını seçme.
  </Card>
  <Card title="Yapılandırma referansı" href="/tr/gateway/configuration-reference" icon="gear">
    Agent'lar, modeller ve sağlayıcılar için tam yapılandırma referansı.
  </Card>
</CardGroup>
