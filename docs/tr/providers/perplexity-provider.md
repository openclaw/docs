---
read_when:
    - Perplexity'yi bir web arama sağlayıcısı olarak yapılandırmak istiyorsunuz
    - Perplexity API anahtarına veya OpenRouter ara sunucu kurulumuna ihtiyacınız var
summary: Perplexity web arama sağlayıcısı kurulumu (API anahtarı, arama modları, filtreleme)
title: Perplexity
x-i18n:
    generated_at: "2026-04-30T09:41:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 36475ba0d6ab7d569f83b7f6fdc13c5dbe6b12ca5acab44e8d213da23d04a795
    source_path: providers/perplexity-provider.md
    workflow: 16
---

Perplexity Plugin'i, Perplexity Search API veya OpenRouter üzerinden Perplexity Sonar aracılığıyla web arama özellikleri sağlar.

<Note>
Bu sayfa Perplexity **sağlayıcı** kurulumudur. Perplexity **aracı** (ajanın bunu nasıl kullandığı) için bkz. [Perplexity aracı](/tr/tools/perplexity-search).
</Note>

| Özellik           | Değer                                                                  |
| ----------------- | ---------------------------------------------------------------------- |
| Tür               | Web arama sağlayıcısı (model sağlayıcısı değil)                        |
| Kimlik doğrulama  | `PERPLEXITY_API_KEY` (doğrudan) veya `OPENROUTER_API_KEY` (OpenRouter üzerinden) |
| Yapılandırma yolu | `plugins.entries.perplexity.config.webSearch.apiKey`                   |

## Başlarken

<Steps>
  <Step title="API anahtarını ayarlayın">
    Etkileşimli web arama yapılandırma akışını çalıştırın:

    ```bash
    openclaw configure --section web
    ```

    Veya anahtarı doğrudan ayarlayın:

    ```bash
    openclaw config set plugins.entries.perplexity.config.webSearch.apiKey "pplx-xxxxxxxxxxxx"
    ```

  </Step>
  <Step title="Aramaya başlayın">
    Anahtar yapılandırıldıktan sonra ajan, web aramaları için Perplexity'yi otomatik olarak kullanır. Ek adım gerekmez.
  </Step>
</Steps>

## Arama modları

Plugin, API anahtarı önekine göre aktarımı otomatik seçer:

<Tabs>
  <Tab title="Yerel Perplexity API (pplx-)">
    Anahtarınız `pplx-` ile başladığında OpenClaw, yerel Perplexity Search API'yi kullanır. Bu aktarım yapılandırılmış sonuçlar döndürür ve etki alanı, dil ve tarih filtrelerini destekler (aşağıdaki filtreleme seçeneklerine bakın).
  </Tab>
  <Tab title="OpenRouter / Sonar (sk-or-)">
    Anahtarınız `sk-or-` ile başladığında OpenClaw, Perplexity Sonar modelini kullanarak OpenRouter üzerinden yönlendirir. Bu aktarım, alıntılarla birlikte yapay zeka tarafından sentezlenmiş yanıtlar döndürür.
  </Tab>
</Tabs>

| Anahtar öneki | Aktarım                     | Özellikler                                      |
| ------------- | --------------------------- | ----------------------------------------------- |
| `pplx-`       | Yerel Perplexity Search API | Yapılandırılmış sonuçlar, etki alanı/dil/tarih filtreleri |
| `sk-or-`      | OpenRouter (Sonar)          | Alıntılarla birlikte yapay zeka tarafından sentezlenmiş yanıtlar |

## Yerel API filtreleme

<Note>
Filtreleme seçenekleri yalnızca yerel Perplexity API (`pplx-` anahtarı) kullanılırken kullanılabilir. OpenRouter/Sonar aramaları bu parametreleri desteklemez.
</Note>

Yerel Perplexity API kullanılırken aramalar aşağıdaki filtreleri destekler:

| Filtre             | Açıklama                              | Örnek                               |
| ------------------ | ------------------------------------- | ----------------------------------- |
| Ülke               | 2 harfli ülke kodu                    | `us`, `de`, `jp`                    |
| Dil                | ISO 639-1 dil kodu                    | `en`, `fr`, `zh`                    |
| Tarih aralığı      | Güncellik penceresi                   | `day`, `week`, `month`, `year`      |
| Etki alanı filtreleri | İzin listesi veya ret listesi (en fazla 20 etki alanı) | `example.com`                       |
| İçerik bütçesi     | Yanıt başına / sayfa başına token sınırları | `max_tokens`, `max_tokens_per_page` |

## Gelişmiş yapılandırma

<AccordionGroup>
  <Accordion title="Daemon süreçleri için ortam değişkeni">
    OpenClaw Gateway bir daemon (launchd/systemd) olarak çalışıyorsa, `PERPLEXITY_API_KEY` değerinin bu süreç tarafından kullanılabilir olduğundan emin olun.

    <Warning>
    Yalnızca `~/.profile` içinde ayarlanan bir anahtar, bu ortam açıkça içe aktarılmadıkça launchd/systemd daemon süreci tarafından görülemez. Gateway sürecinin anahtarı okuyabilmesi için anahtarı `~/.openclaw/.env` içinde veya `env.shellEnv` üzerinden ayarlayın.
    </Warning>

  </Accordion>

  <Accordion title="OpenRouter proxy kurulumu">
    Perplexity aramalarını OpenRouter üzerinden yönlendirmeyi tercih ediyorsanız, yerel bir Perplexity anahtarı yerine bir `OPENROUTER_API_KEY` (`sk-or-` öneki) ayarlayın. OpenClaw öneki algılar ve otomatik olarak Sonar aktarımına geçer.

    <Tip>
    OpenRouter aktarımı, zaten bir OpenRouter hesabınız varsa ve birden fazla sağlayıcıda faturalandırmayı birleştirmek istiyorsanız kullanışlıdır.
    </Tip>

  </Accordion>
</AccordionGroup>

## İlgili

<CardGroup cols={2}>
  <Card title="Perplexity arama aracı" href="/tr/tools/perplexity-search" icon="magnifying-glass">
    Ajanın Perplexity aramalarını nasıl çağırdığı ve sonuçları nasıl yorumladığı.
  </Card>
  <Card title="Yapılandırma referansı" href="/tr/gateway/configuration-reference" icon="gear">
    Plugin girdileri dahil tam yapılandırma referansı.
  </Card>
</CardGroup>
