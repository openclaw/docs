---
read_when:
    - Perplexity'yi bir web arama sağlayıcısı olarak yapılandırmak istiyorsunuz
    - Perplexity API anahtarına veya OpenRouter proxy kurulumuna ihtiyacınız var
summary: Perplexity web arama sağlayıcısı kurulumu (API anahtarı, arama modları, filtreleme)
title: Perplexity
x-i18n:
    generated_at: "2026-04-12T23:32:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 55c089e96601ebe05480d305364272c7f0ac721caa79746297c73002a9f20f55
    source_path: providers/perplexity-provider.md
    workflow: 15
---

# Perplexity (Web Arama Sağlayıcısı)

Perplexity Plugin'i, Perplexity Search API veya OpenRouter üzerinden Perplexity
Sonar ile web arama yetenekleri sağlar.

<Note>
Bu sayfa Perplexity **sağlayıcı** kurulumunu kapsar. Perplexity
**aracı** için (aracının bunu nasıl kullandığı) [Perplexity tool](/tr/tools/perplexity-search) sayfasına bakın.
</Note>

| Property    | Value                                                                  |
| ----------- | ---------------------------------------------------------------------- |
| Tür         | Web arama sağlayıcısı (model sağlayıcısı değil)                        |
| Kimlik doğrulama | `PERPLEXITY_API_KEY` (doğrudan) veya `OPENROUTER_API_KEY` (OpenRouter üzerinden) |
| Yapılandırma yolu | `plugins.entries.perplexity.config.webSearch.apiKey`            |

## Başlangıç

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
    Anahtar yapılandırıldıktan sonra aracı web aramaları için Perplexity'yi otomatik olarak kullanır.
    Ek adım gerekmez.
  </Step>
</Steps>

## Arama modları

Plugin, API anahtarı önekine göre taşımayı otomatik seçer:

<Tabs>
  <Tab title="Yerel Perplexity API (pplx-)">
    Anahtarınız `pplx-` ile başlıyorsa OpenClaw yerel Perplexity Search
    API'sini kullanır. Bu taşıma yapılandırılmış sonuçlar döndürür ve alan adı, dil
    ve tarih filtrelerini destekler (aşağıdaki filtreleme seçeneklerine bakın).
  </Tab>
  <Tab title="OpenRouter / Sonar (sk-or-)">
    Anahtarınız `sk-or-` ile başlıyorsa OpenClaw OpenRouter üzerinden
    Perplexity Sonar modelini kullanarak yönlendirme yapar. Bu taşıma, alıntılar içeren
    AI tarafından sentezlenmiş yanıtlar döndürür.
  </Tab>
</Tabs>

| Anahtar öneki | Taşıma                       | Özellikler                                      |
| ------------- | ---------------------------- | ----------------------------------------------- |
| `pplx-`       | Yerel Perplexity Search API  | Yapılandırılmış sonuçlar, alan adı/dil/tarih filtreleri |
| `sk-or-`      | OpenRouter (Sonar)           | Alıntılar içeren AI tarafından sentezlenmiş yanıtlar |

## Yerel API filtreleme

<Note>
Filtreleme seçenekleri yalnızca yerel Perplexity API kullanılırken
(`pplx-` anahtarı) kullanılabilir. OpenRouter/Sonar aramaları bu parametreleri desteklemez.
</Note>

Yerel Perplexity API kullanılırken aramalar şu filtreleri destekler:

| Filtre          | Açıklama                              | Örnek                              |
| --------------- | ------------------------------------- | ---------------------------------- |
| Ülke            | 2 harfli ülke kodu                    | `us`, `de`, `jp`                   |
| Dil             | ISO 639-1 dil kodu                    | `en`, `fr`, `zh`                   |
| Tarih aralığı   | Güncellik penceresi                   | `day`, `week`, `month`, `year`     |
| Alan adı filtreleri | İzin listesi veya engelleme listesi (en fazla 20 alan adı) | `example.com`        |
| İçerik bütçesi  | Yanıt başına / sayfa başına token sınırları | `max_tokens`, `max_tokens_per_page` |

## Gelişmiş notlar

<AccordionGroup>
  <Accordion title="Daemon süreçleri için ortam değişkeni">
    OpenClaw Gateway bir daemon (launchd/systemd) olarak çalışıyorsa
    `PERPLEXITY_API_KEY` değerinin o süreç için kullanılabilir olduğundan emin olun.

    <Warning>
    Yalnızca `~/.profile` içinde ayarlanmış bir anahtar, bu ortam açıkça içe aktarılmadıkça bir launchd/systemd
    daemon'una görünmez. Gateway sürecinin
    bunu okuyabilmesini sağlamak için anahtarı `~/.openclaw/.env` içinde veya `env.shellEnv` aracılığıyla ayarlayın.
    </Warning>

  </Accordion>

  <Accordion title="OpenRouter proxy kurulumu">
    Perplexity aramalarını OpenRouter üzerinden yönlendirmeyi tercih ediyorsanız,
    yerel bir Perplexity anahtarı yerine bir `OPENROUTER_API_KEY` (önek `sk-or-`) ayarlayın.
    OpenClaw öneki algılar ve Sonar taşımasına
    otomatik olarak geçer.

    <Tip>
    OpenRouter taşıması, zaten bir OpenRouter hesabınız varsa
    ve birden fazla sağlayıcı için birleşik faturalandırma istiyorsanız kullanışlıdır.
    </Tip>

  </Accordion>
</AccordionGroup>

## İlgili

<CardGroup cols={2}>
  <Card title="Perplexity arama aracı" href="/tr/tools/perplexity-search" icon="magnifying-glass">
    Aracının Perplexity aramalarını nasıl çağırdığı ve sonuçları nasıl yorumladığı.
  </Card>
  <Card title="Yapılandırma başvurusu" href="/tr/gateway/configuration-reference" icon="gear">
    Plugin girdileri dahil tam yapılandırma başvurusu.
  </Card>
</CardGroup>
