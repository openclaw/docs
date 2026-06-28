---
read_when:
    - Tavily destekli web araması istiyorsunuz
    - Bir Tavily API anahtarına ihtiyacınız var
    - Tavily'yi bir web_search sağlayıcısı olarak istiyorsunuz
    - URL'lerden içerik çıkarımı istiyorsunuz
summary: Tavily arama ve çıkarma araçları
title: Tavily
x-i18n:
    generated_at: "2026-06-28T01:26:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 539e76120e858129dabfb85c1fe379837fc87be491d5a57803917bf6bb7018ae
    source_path: tools/tavily.md
    workflow: 16
---

[Tavily](https://tavily.com), AI uygulamaları için tasarlanmış bir arama API'sidir. OpenClaw bunu iki şekilde sunar:

- genel arama aracı için `web_search` sağlayıcısı olarak
- açık Plugin araçları olarak: `tavily_search` ve `tavily_extract`

Tavily, yapılandırılabilir arama derinliği, konu filtreleme, alan adı filtreleri, AI tarafından oluşturulan yanıt özetleri ve URL'lerden içerik çıkarma (JavaScript ile işlenen sayfalar dahil) ile LLM tüketimi için optimize edilmiş yapılandırılmış sonuçlar döndürür.

| Özellik  | Değer                               |
| --------- | ----------------------------------- |
| Plugin kimliği | `tavily`                            |
| Paket   | `@openclaw/tavily-plugin`           |
| Kimlik doğrulama      | `TAVILY_API_KEY` veya config `apiKey` |
| Temel URL  | `https://api.tavily.com` (varsayılan)  |
| Araçlar     | `tavily_search`, `tavily_extract`   |

## Başlarken

<Steps>
  <Step title="Plugin'i yükleyin">
    ```bash
    openclaw plugins install @openclaw/tavily-plugin
    ```
  </Step>
  <Step title="API anahtarı alın">
    [tavily.com](https://tavily.com) adresinde bir Tavily hesabı oluşturun, ardından panoda bir API anahtarı oluşturun.
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
    Herhangi bir agent'tan `web_search` tetikleyin veya doğrudan `tavily_search` çağırın.
  </Step>
</Steps>

<Tip>
Onboarding sırasında veya `openclaw configure --section web` ile Tavily seçmek, gerektiğinde resmi Tavily Plugin'ini yükler ve etkinleştirir.
</Tip>

## Araç başvurusu

### `tavily_search`

Genel `web_search` yerine Tavily'ye özgü arama kontrolleri istediğinizde bunu kullanın.

| Parametre         | Tür         | Kısıtlamalar / varsayılan                  | Açıklama                                     |
| ----------------- | ------------ | -------------------------------------- | ----------------------------------------------- |
| `query`           | string       | gerekli                               | Arama sorgusu dizesi. 400 karakterin altında tutun. |
| `search_depth`    | enum         | `basic` (varsayılan), `advanced`          | `advanced` daha yavaştır ancak daha yüksek alaka düzeyi sağlar.      |
| `topic`           | enum         | `general` (varsayılan), `news`, `finance` | Konu ailesine göre filtreleyin.                         |
| `max_results`     | integer      | 1-20                                   | Sonuç sayısı.                              |
| `include_answer`  | boolean      | varsayılan `false`                        | Tavily AI tarafından oluşturulan yanıt özetini ekleyin.   |
| `time_range`      | enum         | `day`, `week`, `month`, `year`         | Sonuçları güncelliğe göre filtreleyin.                      |
| `include_domains` | string array | (yok)                                 | Yalnızca bu alan adlarından gelen sonuçları dahil edin.        |
| `exclude_domains` | string array | (yok)                                 | Bu alan adlarından gelen sonuçları hariç tutun.             |

Arama derinliği karşılaştırması:

| Derinlik      | Hız  | Alaka düzeyi | En iyi kullanım                             |
| ---------- | ------ | --------- | ------------------------------------ |
| `basic`    | Daha hızlı | Yüksek      | Genel amaçlı sorgular (varsayılan).   |
| `advanced` | Daha yavaş | En yüksek   | Hassas araştırma ve bilgi doğrulama. |

### `tavily_extract`

Bunu bir veya daha fazla URL'den temiz içerik çıkarmak için kullanın. JavaScript ile işlenen sayfaları işler ve hedefli çıkarma için sorgu odaklı parçalara ayırmayı destekler.

| Parametre           | Tür         | Kısıtlamalar / varsayılan         | Açıklama                                                 |
| ------------------- | ------------ | ----------------------------- | ----------------------------------------------------------- |
| `urls`              | string array | gerekli, 1-20                | İçerik çıkarılacak URL'ler.                               |
| `query`             | string       | (isteğe bağlı)                    | Çıkarılan parçaları bu sorguyla alakalarına göre yeniden sıralayın.         |
| `extract_depth`     | enum         | `basic` (varsayılan), `advanced` | JS ağırlıklı sayfalar, SPA'lar veya dinamik tablolar için `advanced` kullanın. |
| `chunks_per_source` | integer      | 1-5; **`query` gerektirir**     | URL başına döndürülen parçalar. `query` olmadan ayarlanırsa hata verir.     |
| `include_images`    | boolean      | varsayılan `false`               | Sonuçlara görsel URL'lerini dahil edin.                              |

Çıkarma derinliği karşılaştırması:

| Derinlik      | Ne zaman kullanılmalı                                |
| ---------- | ------------------------------------------ |
| `basic`    | Basit sayfalar. Önce bunu deneyin.              |
| `advanced` | JS ile işlenen SPA'lar, dinamik içerik, tablolar. |

<Tip>
Daha büyük URL listelerini birden çok `tavily_extract` çağrısına bölün (istek başına en fazla 20). Tam sayfalar yerine yalnızca ilgili içeriği almak için `query` ile `chunks_per_source` kullanın.
</Tip>

## Doğru aracı seçme

| İhtiyaç                                 | Araç             |
| ------------------------------------ | ---------------- |
| Hızlı web araması, özel seçenek yok | `web_search`     |
| Derinlik, konu, AI yanıtlarıyla arama | `tavily_search`  |
| Belirli URL'lerden içerik çıkarma   | `tavily_extract` |

<Note>
Sağlayıcı olarak Tavily kullanılan genel `web_search` aracı `query` ve `count` destekler (en fazla 20 sonuç). Tavily'ye özgü kontroller (`search_depth`, `topic`, `include_answer`, alan adı filtreleri, zaman aralığı) için bunun yerine `tavily_search` kullanın.
</Note>

## Gelişmiş yapılandırma

<AccordionGroup>
  <Accordion title="API anahtarı çözümleme sırası">
    Tavily istemcisi API anahtarını şu sırayla arar:

    1. `plugins.entries.tavily.config.webSearch.apiKey` (SecretRefs üzerinden çözümlenir).
    2. Gateway ortamından `TAVILY_API_KEY`.

    Hiçbiri yoksa `tavily_extract` bir kurulum hatası oluşturur.

  </Accordion>

  <Accordion title="Özel temel URL">
    Tavily'yi bir proxy üzerinden sunuyorsanız `plugins.entries.tavily.config.webSearch.baseUrl` değerini geçersiz kılın. Varsayılan `https://api.tavily.com` değeridir.
  </Accordion>

  <Accordion title="`chunks_per_source`, `query` gerektirir">
    `tavily_extract`, `query` olmadan `chunks_per_source` ileten çağrıları reddeder. Tavily parçaları sorgu alakasına göre sıralar, bu nedenle parametre sorgu olmadan anlamsızdır.
  </Accordion>
</AccordionGroup>

## İlgili

<CardGroup cols={2}>
  <Card title="Web Search genel bakışı" href="/tr/tools/web" icon="magnifying-glass">
    Tüm sağlayıcılar ve otomatik algılama kuralları.
  </Card>
  <Card title="Firecrawl" href="/tr/tools/firecrawl" icon="fire">
    İçerik çıkarmalı arama ve scraping.
  </Card>
  <Card title="Exa Search" href="/tr/tools/exa-search" icon="binoculars">
    İçerik çıkarmalı sinirsel arama.
  </Card>
  <Card title="Yapılandırma" href="/tr/gateway/configuration" icon="gear">
    Plugin girdileri ve araç yönlendirme için tam config şeması.
  </Card>
</CardGroup>
