---
read_when:
    - OpenClaw ile DeepSeek kullanmak istiyorsunuz
    - API anahtarı ortam değişkenine veya CLI kimlik doğrulama seçeneğine ihtiyacınız var
summary: DeepSeek kurulumu (kimlik doğrulama + model seçimi)
title: DeepSeek
x-i18n:
    generated_at: "2026-04-30T16:29:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6fbc7bd4de14000eaa5c42b17eb8c9312321ed02ac1667e60774ead3f1749eb4
    source_path: providers/deepseek.md
    workflow: 16
---

[DeepSeek](https://www.deepseek.com), OpenAI uyumlu bir API ile güçlü AI modelleri sağlar.

| Özellik | Değer                      |
| -------- | -------------------------- |
| Sağlayıcı | `deepseek`                 |
| Kimlik doğrulama     | `DEEPSEEK_API_KEY`         |
| API      | OpenAI uyumlu          |
| Temel URL | `https://api.deepseek.com` |

## Başlarken

<Steps>
  <Step title="API anahtarınızı alın">
    [platform.deepseek.com](https://platform.deepseek.com/api_keys) adresinde bir API anahtarı oluşturun.
  </Step>
  <Step title="İlk kurulumu çalıştırın">
    ```bash
    openclaw onboard --auth-choice deepseek-api-key
    ```

    Bu, API anahtarınızı ister ve `deepseek/deepseek-v4-flash` modelini varsayılan model olarak ayarlar.

  </Step>
  <Step title="Modellerin kullanılabilir olduğunu doğrulayın">
    ```bash
    openclaw models list --provider deepseek
    ```

    Çalışan bir Gateway gerektirmeden paketlenmiş statik kataloğu incelemek için
    şunu kullanın:

    ```bash
    openclaw models list --all --provider deepseek
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Etkileşimsiz kurulum">
    Betikli veya başsız kurulumlar için tüm bayrakları doğrudan geçirin:

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
Gateway bir daemon (launchd/systemd) olarak çalışıyorsa, `DEEPSEEK_API_KEY`
değerinin bu işlem tarafından erişilebilir olduğundan emin olun (örneğin,
`~/.openclaw/.env` içinde veya `env.shellEnv` aracılığıyla).
</Warning>

## Yerleşik katalog

| Model referansı                    | Ad              | Girdi | Bağlam   | Maksimum çıktı | Notlar                                      |
| ---------------------------- | ----------------- | ----- | --------- | ---------- | ------------------------------------------ |
| `deepseek/deepseek-v4-flash` | DeepSeek V4 Flash | metin  | 1,000,000 | 384,000    | Varsayılan model; V4 düşünme yetenekli yüzey |
| `deepseek/deepseek-v4-pro`   | DeepSeek V4 Pro   | metin  | 1,000,000 | 384,000    | V4 düşünme yetenekli yüzey                |
| `deepseek/deepseek-chat`     | DeepSeek Chat     | metin  | 131,072   | 8,192      | DeepSeek V3.2 düşünmesiz yüzey         |
| `deepseek/deepseek-reasoner` | DeepSeek Reasoner | metin  | 131,072   | 65,536     | Akıl yürütme etkin V3.2 yüzey             |

<Tip>
V4 modelleri DeepSeek'in `thinking` denetimini destekler. OpenClaw ayrıca
takip eden turlarda DeepSeek `reasoning_content` içeriğini yeniden oynatır; böylece araç
çağrıları içeren düşünme oturumları devam edebilir.
DeepSeek V4 modelleriyle DeepSeek'in maksimum `reasoning_effort` değerini istemek için
`/think xhigh` veya `/think max` kullanın.
</Tip>

## Düşünme ve araçlar

DeepSeek V4 düşünme oturumları, çoğu OpenAI uyumlu sağlayıcıdan daha sıkı bir
yeniden oynatma sözleşmesine sahiptir: düşünme etkin bir tur araçları kullandıktan sonra DeepSeek,
takip eden isteklerde o turdan yeniden oynatılan assistant mesajlarının
`reasoning_content` içermesini bekler. OpenClaw bunu DeepSeek Plugin içinde işler;
bu nedenle normal çok turlu araç kullanımı `deepseek/deepseek-v4-flash` ve
`deepseek/deepseek-v4-pro` ile çalışır.

Mevcut bir oturumu başka bir OpenAI uyumlu sağlayıcıdan bir DeepSeek V4
modeline geçirirseniz, eski assistant araç çağrısı turlarında yerel DeepSeek
`reasoning_content` bulunmayabilir. OpenClaw, DeepSeek V4 düşünme isteklerinde
yeniden oynatılan assistant mesajlarında bu eksik alanı doldurur; böylece sağlayıcı,
`/new` gerektirmeden geçmişi kabul edebilir.

OpenClaw içinde düşünme devre dışı bırakıldığında (UI **None** seçimi dahil),
OpenClaw DeepSeek'e `thinking: { type: "disabled" }` gönderir ve giden geçmişten
yeniden oynatılan `reasoning_content` içeriğini çıkarır. Bu, düşünmesi devre dışı
oturumları düşünmesiz DeepSeek yolunda tutar.

Varsayılan hızlı yol için `deepseek/deepseek-v4-flash` kullanın. Daha güçlü V4
modelini istediğinizde ve daha yüksek maliyeti ya da gecikmeyi kabul edebildiğinizde
`deepseek/deepseek-v4-pro` kullanın.

## Canlı test

Doğrudan canlı model paketi, modern model kümesinde DeepSeek V4'ü içerir.
Yalnızca DeepSeek V4 doğrudan model kontrollerini çalıştırmak için:

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
    Sağlayıcıları, model referanslarını ve yük devretme davranışını seçme.
  </Card>
  <Card title="Yapılandırma referansı" href="/tr/gateway/configuration-reference" icon="gear">
    Aracılar, modeller ve sağlayıcılar için eksiksiz yapılandırma referansı.
  </Card>
</CardGroup>
