---
read_when:
    - Tavily destekli web araması istiyorsunuz
    - Bir Tavily API anahtarına ihtiyacınız var
    - Tavily'yi bir web_search sağlayıcısı olarak kullanmak istiyorsunuz
    - URL'lerden içerik çıkarmak istiyorsunuz
summary: Tavily arama ve ayıklama araçları
title: Tavily
x-i18n:
    generated_at: "2026-07-12T12:19:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9a61351872eb8aecb0b3ada9b573ee8d3db1dcec3d7bd74074446fbe9dc1f274
    source_path: tools/tavily.md
    workflow: 16
---

[Tavily](https://tavily.com), yapay zekâ uygulamaları için tasarlanmış bir arama API'sidir. OpenClaw bunu iki şekilde sunar:

- genel arama aracı için `web_search` sağlayıcısı olarak
- doğrudan Plugin araçları olarak: `tavily_search` ve `tavily_extract`

Tavily; yapılandırılabilir arama derinliği, konu filtreleme, alan adı filtreleri, yapay zekâ tarafından oluşturulan yanıt özetleri ve URL'lerden içerik çıkarma (JavaScript ile oluşturulan sayfalar dâhil) özellikleriyle, LLM'lerin kullanımı için optimize edilmiş yapılandırılmış sonuçlar döndürür.

| Özellik   | Değer                                                                                                  |
| --------- | ------------------------------------------------------------------------------------------------------ |
| Plugin kimliği | `tavily`                                                                                         |
| Paket     | `@openclaw/tavily-plugin`                                                                              |
| Kimlik doğrulama | `TAVILY_API_KEY` ortam değişkeni veya `apiKey` yapılandırması                                    |
| Temel URL | `https://api.tavily.com` (varsayılan); geçersiz kılmak için `TAVILY_BASE_URL` ortam değişkeni veya `baseUrl` yapılandırması |
| Zaman aşımları | arama için 30 sn., çıkarma için 60 sn. (varsayılan)                                             |
| Araçlar   | `tavily_search`, `tavily_extract`                                                                      |

## Başlarken

<Steps>
  <Step title="Plugin'i yükleyin">
    ```bash
    openclaw plugins install @openclaw/tavily-plugin
    ```
  </Step>
  <Step title="Bir API anahtarı edinin">
    [tavily.com](https://tavily.com) adresinde bir Tavily hesabı oluşturun, ardından kontrol panelinde bir API anahtarı oluşturun.
  </Step>
  <Step title="Plugin'i ve sağlayıcıyı yapılandırın">
    ```json5
    {
      plugins: {
        entries: {
          tavily: {
            enabled: true,
            config: {
              webSearch: {
                apiKey: "tvly-...", // optional if TAVILY_API_KEY is set
                baseUrl: "https://api.tavily.com",
              },
            },
          },
        },
      },
      tools: {
        web: {
          search: {
            provider: "tavily",
          },
        },
      },
    }
    ```
  </Step>
  <Step title="Aramanın çalıştığını doğrulayın">
    Herhangi bir agent üzerinden bir `web_search` tetikleyin veya doğrudan `tavily_search` çağrısı yapın.
  </Step>
</Steps>

<Tip>
İlk kurulumda veya `openclaw configure --section web` komutunda Tavily'yi seçmek, gerektiğinde resmî Tavily Plugin'ini yükler ve etkinleştirir.
</Tip>

## Araç başvurusu

### `tavily_search`

Genel `web_search` yerine Tavily'ye özgü arama denetimlerini kullanmak istediğinizde bunu kullanın.

| Parametre         | Tür          | Kısıtlamalar / varsayılan              | Açıklama                                              |
| ----------------- | ------------ | -------------------------------------- | ----------------------------------------------------- |
| `query`           | dize         | zorunlu                                | Arama sorgusu dizesi.                                 |
| `search_depth`    | enum         | `basic` (varsayılan), `advanced`       | `advanced` daha yavaştır ancak daha yüksek alaka sağlar. |
| `topic`           | enum         | `general` (varsayılan), `news`, `finance` | Konu ailesine göre filtreler.                      |
| `max_results`     | tam sayı     | 1-20, varsayılan `5`                   | Sonuç sayısı.                                         |
| `include_answer`  | mantıksal    | varsayılan `false`                     | Tavily'nin yapay zekâ tarafından oluşturulan yanıt özetini dâhil eder. |
| `time_range`      | enum         | `day`, `week`, `month`, `year`         | Sonuçları güncelliğe göre filtreler.                   |
| `include_domains` | dize dizisi  | (yok)                                  | Yalnızca bu alan adlarından gelen sonuçları dâhil eder. |
| `exclude_domains` | dize dizisi  | (yok)                                  | Bu alan adlarından gelen sonuçları hariç tutar.        |

Arama derinliği karşılaştırması:

| Derinlik   | Hız        | Alaka      | En uygun kullanım                              |
| ---------- | ---------- | ---------- | ---------------------------------------------- |
| `basic`    | Daha hızlı | Yüksek     | Genel amaçlı sorgular (varsayılan).            |
| `advanced` | Daha yavaş | En yüksek  | Hassas araştırma ve bilgi doğrulama.            |

### `tavily_extract`

Bir veya daha fazla URL'den temiz içerik çıkarmak için bunu kullanın. JavaScript ile oluşturulan sayfaları işler ve hedefli çıkarma için sorgu odaklı parçalara ayırmayı destekler.

| Parametre           | Tür          | Kısıtlamalar / varsayılan       | Açıklama                                                        |
| ------------------- | ------------ | ------------------------------- | --------------------------------------------------------------- |
| `urls`              | dize dizisi  | zorunlu, 1-20                   | İçeriğin çıkarılacağı URL'ler.                                  |
| `query`             | dize         | (isteğe bağlı)                  | Çıkarılan parçaları bu sorguyla alakalarına göre yeniden sıralar. |
| `extract_depth`     | enum         | `basic` (varsayılan), `advanced` | Yoğun JS kullanan sayfalar, SPA'lar veya dinamik tablolar için `advanced` kullanın. |
| `chunks_per_source` | tam sayı     | 1-5; **`query` gerektirir**     | URL başına döndürülen parça sayısı. `query` olmadan ayarlanırsa hata verir. |
| `include_images`    | mantıksal    | varsayılan `false`              | Sonuçlara görsel URL'lerini dâhil eder.                          |

Çıkarma derinliği karşılaştırması:

| Derinlik   | Kullanım zamanı                                   |
| ---------- | ------------------------------------------------- |
| `basic`    | Basit sayfalar. Önce bunu deneyin.                |
| `advanced` | JS ile oluşturulan SPA'lar, dinamik içerik ve tablolar. |

<Tip>
Daha büyük URL listelerini birden fazla `tavily_extract` çağrısına bölün (istek başına en fazla 20). Tam sayfalar yerine yalnızca ilgili içeriği almak için `query` ile birlikte `chunks_per_source` kullanın.
</Tip>

## Doğru aracı seçme

| İhtiyaç                                     | Araç               |
| ------------------------------------------- | ------------------ |
| Özel seçenekler olmadan hızlı web araması   | `web_search`       |
| Derinlik, konu ve yapay zekâ yanıtlarıyla arama | `tavily_search` |
| Belirli URL'lerden içerik çıkarma            | `tavily_extract`   |

<Note>
Sağlayıcı olarak Tavily kullanılan genel `web_search` aracı, `query` ve `count` parametrelerini destekler (en fazla 20 sonuç). Tavily'ye özgü denetimler (`search_depth`, `topic`, `include_answer`, alan adı filtreleri, zaman aralığı) için bunun yerine `tavily_search` kullanın.
</Note>

## Gelişmiş yapılandırma

<AccordionGroup>
  <Accordion title="API anahtarı çözümleme sırası">
    Tavily istemcisi API anahtarını şu sırayla arar:

    1. `plugins.entries.tavily.config.webSearch.apiKey` (SecretRefs aracılığıyla çözümlenir).
    2. Gateway ortamındaki `TAVILY_API_KEY`.

    Hiçbiri mevcut değilse hem `tavily_search` hem de `tavily_extract` bir kurulum hatası oluşturur.

  </Accordion>

  <Accordion title="Özel temel URL">
    Tavily'yi bir proxy üzerinden kullanıyorsanız `plugins.entries.tavily.config.webSearch.baseUrl` değerini geçersiz kılın veya `TAVILY_BASE_URL` ayarlayın. Yapılandırma, ortam değişkenine göre önceliklidir. Varsayılan değer `https://api.tavily.com` şeklindedir.
  </Accordion>

  <Accordion title="`chunks_per_source`, `query` gerektirir">
    `tavily_extract`, `query` olmadan `chunks_per_source` iletilen çağrıları reddeder. Tavily parçaları sorguyla alakalarına göre sıraladığından, bu parametre sorgu olmadan anlamsızdır.
  </Accordion>
</AccordionGroup>

## İlgili içerikler

<CardGroup cols={2}>
  <Card title="Web Aramasına genel bakış" href="/tr/tools/web" icon="magnifying-glass">
    Tüm sağlayıcılar ve otomatik algılama kuralları.
  </Card>
  <Card title="Firecrawl" href="/tr/tools/firecrawl" icon="fire">
    İçerik çıkarmayla birlikte arama ve veri kazıma.
  </Card>
  <Card title="Exa Araması" href="/tr/tools/exa-search" icon="binoculars">
    İçerik çıkarmayla birlikte sinirsel arama.
  </Card>
  <Card title="Yapılandırma" href="/tr/gateway/configuration" icon="gear">
    Plugin girdileri ve araç yönlendirmesi için tam yapılandırma şeması.
  </Card>
</CardGroup>
