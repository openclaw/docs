---
read_when:
    - Perplexity'yi web arama sağlayıcısı olarak yapılandırmak istiyorsunuz
    - Perplexity API anahtarına veya OpenRouter proxy kurulumuna ihtiyacınız var
summary: Perplexity web arama sağlayıcısı kurulumu (API anahtarı, arama modları, filtreleme)
title: Perplexity
x-i18n:
    generated_at: "2026-06-28T01:12:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3be6f5066ba180a63ea8b374f641613c815be0f84ee1d3577feea04e31ab4694
    source_path: providers/perplexity-provider.md
    workflow: 16
---

Perplexity Plugin, Perplexity Search API veya OpenRouter üzerinden Perplexity Sonar aracılığıyla web araması özellikleri sağlar.

<Note>
Bu sayfa Perplexity **sağlayıcı** kurulumudur. Perplexity **aracı** için (ajanın bunu nasıl kullandığı), bkz. [Perplexity aracı](/tr/tools/perplexity-search).
</Note>

| Özellik     | Değer                                                                  |
| ----------- | ---------------------------------------------------------------------- |
| Tür         | Web araması sağlayıcısı (model sağlayıcısı değil)                      |
| Kimlik doğrulama | `PERPLEXITY_API_KEY` (doğrudan) veya `OPENROUTER_API_KEY` (OpenRouter üzerinden) |
| Yapılandırma yolu | `plugins.entries.perplexity.config.webSearch.apiKey`                   |

## Plugin yükleme

Resmi Plugin'i yükleyin, ardından Gateway'i yeniden başlatın:

```bash
openclaw plugins install @openclaw/perplexity-plugin
openclaw gateway restart
```

## Başlarken

<Steps>
  <Step title="API anahtarını ayarlayın">
    Etkileşimli web araması yapılandırma akışını çalıştırın:

    ```bash
    openclaw configure --section web
    ```

    Veya anahtarı doğrudan ayarlayın:

    ```bash
    openclaw config set plugins.entries.perplexity.config.webSearch.apiKey "pplx-xxxxxxxxxxxx"
    ```

  </Step>
  <Step title="Aramaya başlayın">
    Anahtar yapılandırıldıktan sonra ajan, web aramaları için Perplexity'yi
    otomatik olarak kullanır. Ek adım gerekmez.
  </Step>
</Steps>

## Arama modları

Plugin, API anahtarı önekine göre taşıma katmanını otomatik seçer:

<Tabs>
  <Tab title="Yerel Perplexity API (pplx-)">
    Anahtarınız `pplx-` ile başladığında OpenClaw, yerel Perplexity Search
    API'yi kullanır. Bu taşıma katmanı yapılandırılmış sonuçlar döndürür ve etki alanı, dil
    ve tarih filtrelerini destekler (aşağıdaki filtreleme seçeneklerine bakın).
  </Tab>
  <Tab title="OpenRouter / Sonar (sk-or-)">
    Anahtarınız `sk-or-` ile başladığında OpenClaw, Perplexity Sonar modelini
    kullanarak OpenRouter üzerinden yönlendirir. Bu taşıma katmanı, alıntılarla
    yapay zeka tarafından sentezlenmiş yanıtlar döndürür.
  </Tab>
</Tabs>

| Anahtar öneki | Taşıma katmanı             | Özellikler                                      |
| ---------- | ---------------------------- | ------------------------------------------------ |
| `pplx-`    | Yerel Perplexity Search API | Yapılandırılmış sonuçlar, etki alanı/dil/tarih filtreleri |
| `sk-or-`   | OpenRouter (Sonar)           | Alıntılarla yapay zeka tarafından sentezlenmiş yanıtlar |

## Yerel API filtreleme

<Note>
Filtreleme seçenekleri yalnızca yerel Perplexity API kullanılırken
(`pplx-` anahtarı) kullanılabilir. OpenRouter/Sonar aramaları bu parametreleri desteklemez.
</Note>

Yerel Perplexity API kullanıldığında, aramalar aşağıdaki filtreleri destekler:

| Filtre         | Açıklama                            | Örnek                             |
| -------------- | -------------------------------------- | ----------------------------------- |
| Ülke           | 2 harfli ülke kodu                    | `us`, `de`, `jp`                    |
| Dil            | ISO 639-1 dil kodu                    | `en`, `fr`, `zh`                    |
| Tarih aralığı  | Güncellik penceresi                   | `day`, `week`, `month`, `year`      |
| Etki alanı filtreleri | İzin listesi veya engelleme listesi (en fazla 20 etki alanı) | `example.com`                       |
| İçerik bütçesi | Yanıt başına / sayfa başına token sınırları | `max_tokens`, `max_tokens_per_page` |

## Gelişmiş yapılandırma

<AccordionGroup>
  <Accordion title="Daemon süreçleri için ortam değişkeni">
    OpenClaw Gateway bir daemon (launchd/systemd) olarak çalışıyorsa,
    `PERPLEXITY_API_KEY` değerinin bu süreç için kullanılabilir olduğundan emin olun.

    <Warning>
    Yalnızca etkileşimli bir shell içinde dışa aktarılan bir anahtar, bu ortam
    açıkça içe aktarılmadığı sürece launchd/systemd daemon tarafından görülemez. Gateway
    sürecinin okuyabilmesini sağlamak için anahtarı `~/.openclaw/.env` içinde veya
    `env.shellEnv` aracılığıyla ayarlayın.
    </Warning>

  </Accordion>

  <Accordion title="OpenRouter proxy kurulumu">
    Perplexity aramalarını OpenRouter üzerinden yönlendirmeyi tercih ediyorsanız, yerel
    Perplexity anahtarı yerine bir `OPENROUTER_API_KEY` (`sk-or-` öneki) ayarlayın.
    OpenClaw öneki algılar ve otomatik olarak Sonar taşıma katmanına
    geçer.

    <Tip>
    Zaten bir OpenRouter hesabınız varsa ve birden fazla sağlayıcıda birleştirilmiş
    faturalandırma istiyorsanız OpenRouter taşıma katmanı kullanışlıdır.
    </Tip>

  </Accordion>
</AccordionGroup>

## İlgili

<CardGroup cols={2}>
  <Card title="Perplexity arama aracı" href="/tr/tools/perplexity-search" icon="magnifying-glass">
    Ajanın Perplexity aramalarını nasıl çağırdığı ve sonuçları nasıl yorumladığı.
  </Card>
  <Card title="Yapılandırma referansı" href="/tr/gateway/configuration-reference" icon="gear">
    Plugin girişleri dahil tam yapılandırma referansı.
  </Card>
</CardGroup>
