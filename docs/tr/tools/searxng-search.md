---
read_when:
    - Self-hosted bir web arama sağlayıcısı istiyorsunuz
    - web_search için SearXNG kullanmak istiyorsunuz
    - Gizlilik odaklı veya air-gapped bir arama seçeneğine ihtiyacınız var
summary: SearXNG web araması -- self-hosted, anahtarsız meta-arama sağlayıcısı
title: SearXNG araması
x-i18n:
    generated_at: "2026-04-24T09:36:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: a07198ef7a6f363b9e5e78e57e6e31f193f8f10882945208191c8baea5fe67d6
    source_path: tools/searxng-search.md
    workflow: 15
---

OpenClaw, [SearXNG](https://docs.searxng.org/)'yi **self-hosted,
anahtarsız** bir `web_search` sağlayıcısı olarak destekler. SearXNG, Google, Bing, DuckDuckGo ve diğer kaynaklardan sonuçları bir araya getiren
açık kaynaklı bir meta-arama motorudur.

Avantajlar:

- **Ücretsiz ve sınırsız** -- API anahtarı veya ticari abonelik gerekmez
- **Gizlilik / air-gap** -- sorgular ağınızın dışına çıkmaz
- **Her yerde çalışır** -- ticari arama API'lerindeki bölge kısıtlamaları yoktur

## Kurulum

<Steps>
  <Step title="Bir SearXNG örneği çalıştırın">
    ```bash
    docker run -d -p 8888:8080 searxng/searxng
    ```

    Veya erişiminiz olan mevcut herhangi bir SearXNG dağıtımını kullanın. Üretim kurulumu için
    [SearXNG belgelerine](https://docs.searxng.org/) bakın.

  </Step>
  <Step title="Yapılandırın">
    ```bash
    openclaw configure --section web
    # Sağlayıcı olarak "searxng" seçin
    ```

    Ya da env var ayarlayın ve otomatik algılamanın bunu bulmasına izin verin:

    ```bash
    export SEARXNG_BASE_URL="http://localhost:8888"
    ```

  </Step>
</Steps>

## Yapılandırma

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

SearXNG örneği için Plugin düzeyinde ayarlar:

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

Taşıma kuralları:

- `https://`, genel veya özel SearXNG host'ları için çalışır
- `http://`, yalnızca güvenilen özel ağ veya loopback host'ları için kabul edilir
- genel SearXNG host'ları `https://` kullanmalıdır

## Ortam değişkeni

Yapılandırmaya alternatif olarak `SEARXNG_BASE_URL` ayarlayın:

```bash
export SEARXNG_BASE_URL="http://localhost:8888"
```

`SEARXNG_BASE_URL` ayarlıysa ve açık bir sağlayıcı yapılandırılmamışsa, otomatik algılama
SearXNG'yi otomatik olarak seçer (en düşük öncelikte -- anahtara sahip herhangi bir API destekli sağlayıcı
önce kazanır).

## Plugin yapılandırma başvurusu

| Alan        | Açıklama                                                        |
| ----------- | --------------------------------------------------------------- |
| `baseUrl`   | SearXNG örneğinizin temel URL'si (gerekli)                      |
| `categories` | `general`, `news` veya `science` gibi virgülle ayrılmış kategoriler |
| `language`  | `en`, `de` veya `fr` gibi sonuçlar için dil kodu               |

## Notlar

- **JSON API** -- HTML scraping değil, SearXNG'nin yerel `format=json` uç noktasını kullanır
- **API anahtarı yok** -- herhangi bir SearXNG örneğiyle kutudan çıktığı gibi çalışır
- **Base URL doğrulaması** -- `baseUrl`, geçerli bir `http://` veya `https://`
  URL'si olmalıdır; genel host'lar `https://` kullanmalıdır
- **Otomatik algılama sırası** -- SearXNG, otomatik algılamada
  en son (sıra 200) kontrol edilir. Yapılandırılmış anahtarlara sahip API destekli sağlayıcılar önce çalışır,
  sonra DuckDuckGo (sıra 100), sonra Ollama Web Search (sıra 110)
- **Self-hosted** -- örneği, sorguları ve upstream arama motorlarını siz denetlersiniz
- **Categories**, yapılandırılmadığında varsayılan olarak `general` olur

<Tip>
  SearXNG JSON API'nin çalışması için, SearXNG örneğinizin `settings.yml` dosyasında `search.formats` altında `json`
  biçiminin etkin olduğundan emin olun.
</Tip>

## İlgili

- [Web Search genel bakışı](/tr/tools/web) -- tüm sağlayıcılar ve otomatik algılama
- [DuckDuckGo Search](/tr/tools/duckduckgo-search) -- anahtarsız başka bir fallback
- [Brave Search](/tr/tools/brave-search) -- ücretsiz katmanlı yapılandırılmış sonuçlar
