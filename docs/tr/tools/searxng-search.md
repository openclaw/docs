---
read_when:
    - Kendi barındırdığınız bir web arama sağlayıcısı istiyorsunuz
    - '`web_search` için SearXNG kullanmak istiyorsunuz'
    - Gizlilik odaklı veya air-gapped bir arama seçeneğine ihtiyacınız var
summary: SearXNG web search -- self-hosted, key-free meta-search provider
title: SearXNG Search
x-i18n:
    generated_at: "2026-04-05T14:13:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0a8fc7f890b7595d17c5ef8aede9b84bb2459f30a53d5d87c4e7423e1ac83ca5
    source_path: tools/searxng-search.md
    workflow: 15
---

# SearXNG Search

OpenClaw, **kendi barındırdığınız,
anahtar gerektirmeyen** bir `web_search` sağlayıcısı olarak [SearXNG](https://docs.searxng.org/)'yi destekler. SearXNG, sonuçları Google, Bing, DuckDuckGo ve diğer kaynaklardan toplayan açık kaynaklı bir meta arama motorudur.

Avantajlar:

- **Ücretsiz ve sınırsız** -- API anahtarı veya ticari abonelik gerekmez
- **Gizlilik / air-gap** -- sorgular ağınızın dışına çıkmaz
- **Her yerde çalışır** -- ticari arama API'lerinde bölge kısıtlamaları yoktur

## Kurulum

<Steps>
  <Step title="Bir SearXNG örneği çalıştırın">
    ```bash
    docker run -d -p 8888:8080 searxng/searxng
    ```

    Veya erişiminiz olan mevcut bir SearXNG dağıtımını kullanın. Üretim kurulumu için
    [SearXNG belgelerine](https://docs.searxng.org/) bakın.

  </Step>
  <Step title="Yapılandırın">
    ```bash
    openclaw configure --section web
    # Sağlayıcı olarak "searxng" seçin
    ```

    Veya env var ayarlayıp otomatik algılamanın bunu bulmasını sağlayın:

    ```bash
    export SEARXNG_BASE_URL="http://localhost:8888"
    ```

  </Step>
</Steps>

## Config

```json5
{
  tools: {
    web: {
      search: {
        provider: "searxng",
      },
    },
  },
}
```

SearXNG örneği için plugin düzeyindeki ayarlar:

```json5
{
  plugins: {
    entries: {
      searxng: {
        config: {
          webSearch: {
            baseUrl: "http://localhost:8888",
            categories: "general,news", // isteğe bağlı
            language: "en", // isteğe bağlı
          },
        },
      },
    },
  },
}
```

`baseUrl` alanı SecretRef nesnelerini de kabul eder.

Aktarım kuralları:

- `https://` genel veya özel SearXNG ana bilgisayarları için çalışır
- `http://` yalnızca güvenilen özel ağ veya loopback ana bilgisayarları için kabul edilir
- genel SearXNG ana bilgisayarları `https://` kullanmalıdır

## Ortam değişkeni

Config'e alternatif olarak `SEARXNG_BASE_URL` ayarlayın:

```bash
export SEARXNG_BASE_URL="http://localhost:8888"
```

`SEARXNG_BASE_URL` ayarlandığında ve açıkça bir sağlayıcı yapılandırılmadığında, otomatik algılama
SearXNG'yi otomatik olarak seçer (en düşük öncelikte -- anahtarı olan herhangi bir
API destekli sağlayıcı önce kazanır).

## Plugin config referansı

| Alan         | Açıklama                                                           |
| ------------ | ------------------------------------------------------------------ |
| `baseUrl`    | SearXNG örneğinizin temel URL'si (zorunlu)                         |
| `categories` | `general`, `news` veya `science` gibi virgülle ayrılmış kategoriler |
| `language`   | `en`, `de` veya `fr` gibi sonuçlar için dil kodu                   |

## Notlar

- **JSON API** -- HTML scraping değil, SearXNG'nin yerel `format=json` uç noktasını kullanır
- **API anahtarı yok** -- herhangi bir SearXNG örneğiyle kutudan çıktığı gibi çalışır
- **Temel URL doğrulaması** -- `baseUrl` geçerli bir `http://` veya `https://`
  URL'si olmalıdır; genel ana bilgisayarlar `https://` kullanmalıdır
- **Otomatik algılama sırası** -- SearXNG, otomatik algılamada en son (sıra 200)
  kontrol edilir. Yapılandırılmış anahtarlara sahip API destekli sağlayıcılar önce çalışır, ardından
  DuckDuckGo (sıra 100), ardından Ollama Web Search (sıra 110)
- **Kendi barındırdığınız** -- örneği, sorguları ve üst akış arama motorlarını siz kontrol edersiniz
- **Categories** yapılandırılmadığında varsayılan olarak `general` olur

<Tip>
  SearXNG JSON API'nin çalışması için SearXNG örneğinizde `json`
  biçiminin `settings.yml` içindeki `search.formats` altında etkin olduğundan emin olun.
</Tip>

## İlgili

- [Web Search genel bakış](/tools/web) -- tüm sağlayıcılar ve otomatik algılama
- [DuckDuckGo Search](/tr/tools/duckduckgo-search) -- anahtar gerektirmeyen başka bir yedek seçenek
- [Brave Search](/tr/tools/brave-search) -- ücretsiz katmanlı yapılandırılmış sonuçlar
