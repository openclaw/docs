---
read_when:
    - Perplexity'yi bir web arama sağlayıcısı olarak yapılandırmak istiyorsunuz
    - Perplexity API anahtarı veya OpenRouter proxy kurulumu gerekiyor
summary: Perplexity web arama sağlayıcısı kurulumu (API anahtarı, arama modları, filtreleme)
title: Perplexity
x-i18n:
    generated_at: "2026-04-24T09:27:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7b2d3d6912bc9952bbe89124dd8aea600c938c8ceff21df46508b6e44e0a1159
    source_path: providers/perplexity-provider.md
    workflow: 15
---

# Perplexity (Web arama sağlayıcısı)

Perplexity Plugin'i, Perplexity
Search API veya OpenRouter üzerinden Perplexity Sonar aracılığıyla web arama yetenekleri sağlar.

<Note>
Bu sayfa Perplexity **sağlayıcı** kurulumunu kapsar. Perplexity
**aracı** için (agent'ın onu nasıl kullandığı), bkz. [Perplexity aracı](/tr/tools/perplexity-search).
</Note>

| Özellik     | Değer                                                                 |
| ----------- | --------------------------------------------------------------------- |
| Tür         | Web arama sağlayıcısı (model sağlayıcısı değil)                       |
| Kimlik doğrulama | `PERPLEXITY_API_KEY` (doğrudan) veya `OPENROUTER_API_KEY` (OpenRouter üzerinden) |
| Yapılandırma yolu | `plugins.entries.perplexity.config.webSearch.apiKey`             |

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
    Anahtar yapılandırıldıktan sonra agent, web aramalarında Perplexity'yi otomatik olarak kullanır.
    Ek adım gerekmez.
  </Step>
</Steps>

## Arama modları

Plugin, API anahtarı önekine göre taşıma türünü otomatik seçer:

<Tabs>
  <Tab title="Yerel Perplexity API (pplx-)">
    Anahtarınız `pplx-` ile başlıyorsa OpenClaw yerel Perplexity Search
    API'yi kullanır. Bu taşıma türü yapılandırılmış sonuçlar döndürür ve etki alanı, dil
    ve tarih filtrelerini destekler (aşağıdaki filtreleme seçeneklerine bakın).
  </Tab>
  <Tab title="OpenRouter / Sonar (sk-or-)">
    Anahtarınız `sk-or-` ile başlıyorsa OpenClaw, OpenRouter üzerinden
    Perplexity Sonar modelini kullanarak yönlendirme yapar. Bu taşıma türü, alıntılar içeren yapay zekâ tarafından sentezlenmiş yanıtlar döndürür.
  </Tab>
</Tabs>

| Anahtar öneki | Taşıma türü                  | Özellikler                                      |
| ------------- | ---------------------------- | ------------------------------------------------ |
| `pplx-`       | Yerel Perplexity Search API  | Yapılandırılmış sonuçlar, etki alanı/dil/tarih filtreleri |
| `sk-or-`      | OpenRouter (Sonar)           | Alıntılar içeren yapay zekâ tarafından sentezlenmiş yanıtlar |

## Yerel API filtreleme

<Note>
Filtreleme seçenekleri yalnızca yerel Perplexity API kullanıldığında
(`pplx-` anahtarı) kullanılabilir. OpenRouter/Sonar aramaları bu parametreleri desteklemez.
</Note>

Yerel Perplexity API kullanılırken aramalar şu filtreleri destekler:

| Filtre         | Açıklama                                 | Örnek                               |
| -------------- | ---------------------------------------- | ----------------------------------- |
| Ülke           | 2 harfli ülke kodu                       | `us`, `de`, `jp`                    |
| Dil            | ISO 639-1 dil kodu                       | `en`, `fr`, `zh`                    |
| Tarih aralığı  | Güncellik aralığı                        | `day`, `week`, `month`, `year`      |
| Etki alanı filtreleri | İzin listesi veya engelleme listesi (en fazla 20 etki alanı) | `example.com`          |
| İçerik bütçesi | Yanıt başına / sayfa başına token sınırları | `max_tokens`, `max_tokens_per_page` |

## Gelişmiş yapılandırma

<AccordionGroup>
  <Accordion title="Daemon işlemleri için ortam değişkeni">
    OpenClaw Gateway bir daemon (launchd/systemd) olarak çalışıyorsa
    `PERPLEXITY_API_KEY` değerinin bu işlem için kullanılabilir olduğundan emin olun.

    <Warning>
    Yalnızca `~/.profile` içinde ayarlanan bir anahtar, bu ortam açıkça içe aktarılmadıkça bir launchd/systemd
    daemon'u tarafından görülemez. Anahtarı
    `~/.openclaw/.env` içine veya `env.shellEnv` üzerinden ayarlayın ki Gateway işlemi
    onu okuyabilsin.
    </Warning>

  </Accordion>

  <Accordion title="OpenRouter proxy kurulumu">
    Perplexity aramalarını OpenRouter üzerinden yönlendirmeyi tercih ediyorsanız,
    yerel bir Perplexity anahtarı yerine `OPENROUTER_API_KEY`
    (`sk-or-` öneki) ayarlayın.
    OpenClaw öneki algılar ve Sonar taşıma türüne otomatik geçer.

    <Tip>
    OpenRouter taşıma türü, zaten bir OpenRouter hesabınız varsa
    ve birden çok sağlayıcı için birleştirilmiş faturalandırma istiyorsanız kullanışlıdır.
    </Tip>

  </Accordion>
</AccordionGroup>

## İlgili

<CardGroup cols={2}>
  <Card title="Perplexity arama aracı" href="/tr/tools/perplexity-search" icon="magnifying-glass">
    Agent'ın Perplexity aramalarını nasıl çağırdığı ve sonuçları nasıl yorumladığı.
  </Card>
  <Card title="Yapılandırma başvurusu" href="/tr/gateway/configuration-reference" icon="gear">
    Plugin girdileri dâhil tam yapılandırma başvurusu.
  </Card>
</CardGroup>
