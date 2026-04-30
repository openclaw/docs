---
read_when:
    - DeepSeek'i OpenClaw ile kullanmak istiyorsunuz
    - API anahtarı ortam değişkeni veya CLI kimlik doğrulama seçimi gerekir
summary: DeepSeek kurulumu (kimlik doğrulama + model seçimi)
title: DeepSeek
x-i18n:
    generated_at: "2026-04-30T09:40:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: e84d989a7cba8d259779ac02293718050ce51efe6ce2bdbfacb9e22bbfd294ef
    source_path: providers/deepseek.md
    workflow: 16
---

[DeepSeek](https://www.deepseek.com), OpenAI uyumlu bir API ile güçlü yapay zeka modelleri sağlar.

| Özellik | Değer                      |
| -------- | -------------------------- |
| Sağlayıcı | `deepseek`                 |
| Kimlik Doğrulama | `DEEPSEEK_API_KEY`         |
| API      | OpenAI uyumlu          |
| Temel URL | `https://api.deepseek.com` |

## Başlarken

<Steps>
  <Step title="Get your API key">
    [platform.deepseek.com](https://platform.deepseek.com/api_keys) adresinde bir API anahtarı oluşturun.
  </Step>
  <Step title="Run onboarding">
    ```bash
    openclaw onboard --auth-choice deepseek-api-key
    ```

    Bu, API anahtarınızı ister ve varsayılan model olarak `deepseek/deepseek-v4-flash` ayarlar.

  </Step>
  <Step title="Verify models are available">
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
  <Accordion title="Non-interactive setup">
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
Gateway bir daemon (launchd/systemd) olarak çalışıyorsa `DEEPSEEK_API_KEY`
değerinin o süreç için kullanılabilir olduğundan emin olun (örneğin,
`~/.openclaw/.env` içinde veya `env.shellEnv` aracılığıyla).
</Warning>

## Yerleşik katalog

| Model ref                    | Ad                | Girdi | Bağlam   | En yüksek çıktı | Notlar                                      |
| ---------------------------- | ----------------- | ----- | --------- | ---------- | ------------------------------------------ |
| `deepseek/deepseek-v4-flash` | DeepSeek V4 Flash | text  | 1,000,000 | 384,000    | Varsayılan model; V4 düşünme özellikli yüzey |
| `deepseek/deepseek-v4-pro`   | DeepSeek V4 Pro   | text  | 1,000,000 | 384,000    | V4 düşünme özellikli yüzey                |
| `deepseek/deepseek-chat`     | DeepSeek Chat     | text  | 131,072   | 8,192      | DeepSeek V3.2 düşünmesiz yüzey         |
| `deepseek/deepseek-reasoner` | DeepSeek Reasoner | text  | 131,072   | 65,536     | Akıl yürütme etkin V3.2 yüzeyi             |

<Tip>
V4 modelleri DeepSeek'in `thinking` denetimini destekler. OpenClaw ayrıca araç
çağrıları içeren düşünme oturumlarının devam edebilmesi için takip eden turlarda
DeepSeek `reasoning_content` içeriğini yeniden oynatır.
</Tip>

## Düşünme ve araçlar

DeepSeek V4 düşünme oturumları, çoğu OpenAI uyumlu sağlayıcıdan daha katı bir
yeniden oynatma sözleşmesine sahiptir: düşünme etkin bir tur araçları kullandıktan sonra DeepSeek,
takip eden isteklerde o turdan yeniden oynatılan assistant mesajlarının
`reasoning_content` içermesini bekler. OpenClaw bunu DeepSeek plugin içinde
ele alır, bu nedenle normal çok turlu araç kullanımı
`deepseek/deepseek-v4-flash` ve `deepseek/deepseek-v4-pro` ile çalışır.

Mevcut bir oturumu başka bir OpenAI uyumlu sağlayıcıdan bir DeepSeek V4 modeline
geçirirseniz, eski assistant araç çağrısı turlarında yerel
DeepSeek `reasoning_content` bulunmayabilir. OpenClaw, sağlayıcının geçmişi
`/new` gerektirmeden kabul edebilmesi için DeepSeek V4 düşünme isteklerinde
yeniden oynatılan assistant mesajlarındaki bu eksik alanı doldurur.

OpenClaw'da düşünme devre dışı bırakıldığında (UI **None** seçimi dahil),
OpenClaw DeepSeek'e `thinking: { type: "disabled" }` gönderir ve giden geçmişten
yeniden oynatılan `reasoning_content` içeriğini çıkarır. Bu, devre dışı bırakılmış düşünme
oturumlarını düşünmesiz DeepSeek yolunda tutar.

Varsayılan hızlı yol için `deepseek/deepseek-v4-flash` kullanın. Daha güçlü V4
modelini istediğinizde ve daha yüksek maliyeti veya gecikmeyi kabul edebildiğinizde
`deepseek/deepseek-v4-pro` kullanın.

## Canlı test

Doğrudan canlı model paketi, modern model kümesinde DeepSeek V4 içerir. Yalnızca
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
  <Card title="Model selection" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model ref değerlerini ve failover davranışını seçme.
  </Card>
  <Card title="Configuration reference" href="/tr/gateway/configuration-reference" icon="gear">
    Aracılar, modeller ve sağlayıcılar için tam yapılandırma referansı.
  </Card>
</CardGroup>
