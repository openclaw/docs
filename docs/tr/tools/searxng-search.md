---
read_when:
    - Kendi barındırdığınız bir web arama sağlayıcısı istiyorsunuz
    - web_search için SearXNG kullanmak istiyorsunuz
    - Gizlilik odaklı veya air-gapped bir arama seçeneğine ihtiyacınız var
summary: SearXNG web araması -- kendi barındırmalı, anahtarsız meta arama sağlayıcısı
title: SearXNG araması
x-i18n:
    generated_at: "2026-05-02T09:09:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: b9be62f7398379e1672ea7e934a571a529cac07dc5d880ac74e51f8445594034
    source_path: tools/searxng-search.md
    workflow: 16
---

OpenClaw, **kendi barındırdığınız,
anahtarsız** bir `web_search` sağlayıcısı olarak [SearXNG](https://docs.searxng.org/) desteği sunar. SearXNG; Google, Bing, DuckDuckGo ve diğer kaynaklardan sonuçları bir araya getiren açık kaynaklı bir meta arama motorudur.

Avantajlar:

- **Ücretsiz ve sınırsız** -- API anahtarı veya ticari abonelik gerekmez
- **Gizlilik / air-gap** -- sorgular ağınızdan asla ayrılmaz
- **Her yerde çalışır** -- ticari arama API'lerinde bölge kısıtlaması yoktur

## Kurulum

<Steps>
  <Step title="Bir SearXNG örneği çalıştırın">
    ```bash
    docker run -d -p 8888:8080 searxng/searxng
    ```

    Ya da erişiminiz olan mevcut herhangi bir SearXNG dağıtımını kullanın. Üretim kurulumu için
    [SearXNG belgelerine](https://docs.searxng.org/) bakın.

  </Step>
  <Step title="Yapılandırın">
    ```bash
    openclaw configure --section web
    # Select "searxng" as the provider
    ```

    Ya da env var değerini ayarlayın ve otomatik algılamanın bunu bulmasına izin verin:

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

SearXNG örneği için Plugin düzeyindeki ayarlar:

```json5
{
  plugins: {
    entries: {
      searxng: {
        config: {
          webSearch: {
            baseUrl: "http://localhost:8888",
            categories: "general,news", // optional
            language: "en", // optional
          },
        },
      },
    },
  },
}
```

`baseUrl` alanı SecretRef nesnelerini de kabul eder.

Aktarım kuralları:

- `https://` genel veya özel SearXNG ana makineleri için çalışır
- `http://` yalnızca güvenilir özel ağ veya loopback ana makineleri için kabul edilir
- genel SearXNG ana makineleri `https://` kullanmalıdır
- özel/dahili ana makineler kendi barındırılan ağ korumasını kullanır; genel `https://`
  ana makineleri katı web arama korumasında kalır ve özel
  adreslere yönlendirme yapamaz

## Ortam değişkeni

Yapılandırmaya alternatif olarak `SEARXNG_BASE_URL` değerini ayarlayın:

```bash
export SEARXNG_BASE_URL="http://localhost:8888"
```

`SEARXNG_BASE_URL` ayarlandığında ve açık bir sağlayıcı yapılandırılmadığında, otomatik algılama
SearXNG'yi otomatik olarak seçer (en düşük öncelikte -- anahtara sahip API destekli herhangi bir sağlayıcı önce kazanır).

## Plugin yapılandırma başvurusu

| Alan         | Açıklama                                                          |
| ------------ | ----------------------------------------------------------------- |
| `baseUrl`    | SearXNG örneğinizin temel URL'si (gerekli)                        |
| `categories` | `general`, `news` veya `science` gibi virgülle ayrılmış kategoriler |
| `language`   | Sonuçlar için `en`, `de` veya `fr` gibi dil kodu                  |

## Notlar

- **JSON API** -- HTML kazıma yerine SearXNG'nin yerel `format=json` uç noktasını kullanır
- **Görüntü sonucu URL'leri** -- görüntü kategorisi sonuçları, SearXNG
  doğrudan bir görüntü URL'si döndürdüğünde `img_src` içerir
- **API anahtarı yok** -- herhangi bir SearXNG örneğiyle kutudan çıktığı gibi çalışır
- **Temel URL doğrulaması** -- `baseUrl` geçerli bir `http://` veya `https://`
  URL'si olmalıdır; genel ana makineler `https://` kullanmalıdır
- **Ağ koruması** -- özel/dahili SearXNG uç noktaları
  özel ağ erişimine katılır; genel `https://` SearXNG uç noktaları katı SSRF
  korumasını sürdürür
- **Otomatik algılama sırası** -- SearXNG, otomatik algılamada en son
  denetlenir (sıra 200). Yapılandırılmış anahtarlara sahip API destekli sağlayıcılar önce çalışır, ardından
  DuckDuckGo (sıra 100), ardından Ollama Web Search (sıra 110) gelir
- **Kendi barındırılan** -- örneği, sorguları ve yukarı akış arama motorlarını siz denetlersiniz
- **Kategoriler** yapılandırılmadığında varsayılan olarak `general` olur
- **Kategori geri dönüşü** -- `general` olmayan bir kategori isteği başarılı olur ancak
  sıfır sonuç döndürürse OpenClaw, boş bir sonuç kümesi döndürmeden önce aynı sorguyu bir kez `general` ile yeniden dener

<Tip>
  SearXNG JSON API'nin çalışması için SearXNG örneğinizde `settings.yml` içindeki
  `search.formats` altında `json` biçiminin etkin olduğundan emin olun.
</Tip>

## İlgili

- [Web Search genel bakış](/tr/tools/web) -- tüm sağlayıcılar ve otomatik algılama
- [DuckDuckGo Search](/tr/tools/duckduckgo-search) -- başka bir anahtarsız geri dönüş
- [Brave Search](/tr/tools/brave-search) -- ücretsiz katmanla yapılandırılmış sonuçlar
