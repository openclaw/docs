---
read_when:
    - Kendi barındırdığınız bir web arama sağlayıcısı istiyorsunuz
    - web_search için SearXNG kullanmak istiyorsunuz
    - Gizlilik odaklı veya ağ bağlantısı olmayan bir arama seçeneğine ihtiyacınız var
summary: SearXNG web araması -- kendi sunucunuzda barındırılan, anahtar gerektirmeyen meta arama sağlayıcısı
title: SearXNG araması
x-i18n:
    generated_at: "2026-07-12T12:54:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cae8de9f8e2c8dd9cec615adb48da5c1fd7654bffe96c7afc1acea3effbcf1fc
    source_path: tools/searxng-search.md
    workflow: 16
---

OpenClaw, **kendi barındırdığınız ve anahtar gerektirmeyen** bir `web_search` sağlayıcısı olarak [SearXNG](https://docs.searxng.org/) desteği sunar. SearXNG; Google, Bing, DuckDuckGo ve diğer kaynaklardan gelen sonuçları bir araya getiren açık kaynaklı bir meta arama motorudur.

Avantajlar:

- **Ücretsiz ve sınırsız** -- API anahtarı veya ticari abonelik gerekmez
- **Gizlilik / ağdan yalıtım** -- sorgular ağınızdan asla çıkmaz
- **Her yerde çalışır** -- ticari arama API'lerinin bölge kısıtlamaları yoktur

## Kurulum

<Steps>
  <Step title="Plugini yükleyin">
    ```bash
    openclaw plugins install @openclaw/searxng-plugin
    ```
  </Step>
  <Step title="Bir SearXNG örneği çalıştırın">
    ```bash
    docker run -d -p 8888:8080 searxng/searxng
    ```

    Alternatif olarak erişiminiz olan mevcut herhangi bir SearXNG dağıtımını kullanın. Üretim ortamı kurulumu için
    [SearXNG belgelerine](https://docs.searxng.org/) bakın.

  </Step>
  <Step title="Yapılandırın">
    ```bash
    openclaw configure --section web
    # Sağlayıcı olarak "searxng" seçin
    ```

    Alternatif olarak ortam değişkenini ayarlayın ve otomatik algılamanın bunu bulmasını sağlayın:

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

SearXNG örneğine ilişkin Plugin düzeyi ayarlar:

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

`baseUrl` ayrıca bir SecretRef nesnesini de kabul eder (örneğin `{ source: "env", id: "SEARXNG_BASE_URL" }`).

## Ortam değişkeni

Yapılandırmaya alternatif olarak `SEARXNG_BASE_URL` değerini ayarlayın:

```bash
export SEARXNG_BASE_URL="http://localhost:8888"
```

Çözümleme sırası: yapılandırılmış `baseUrl` dizesi, ardından `baseUrl` üzerindeki satır içi bir ortam SecretRef'i ve son olarak `SEARXNG_BASE_URL`. Yapılandırma yollarından hiçbiri ayarlanmamışsa, `SEARXNG_BASE_URL` mevcutsa ve açıkça bir sağlayıcı seçilmemişse otomatik algılama SearXNG'yi seçer.

## Plugin yapılandırma referansı

| Alan         | Açıklama                                                                |
| ------------ | ----------------------------------------------------------------------- |
| `baseUrl`    | SearXNG örneğinizin temel URL'si (zorunlu)                               |
| `categories` | `general`, `news` veya `science` gibi virgülle ayrılmış kategoriler     |
| `language`   | Sonuçlar için `en`, `de` veya `fr` gibi dil kodu                         |

`web_search` araç çağrısı ayrıca her çağrıya özel geçersiz kılmalar olarak `count` (1-10 sonuç), `categories` ve `language` değerlerini kabul eder.

## Notlar

- **JSON API** -- HTML kazıma yerine SearXNG'nin yerel `format=json` uç noktasını kullanır
- **Görsel sonucu URL'leri** -- SearXNG doğrudan görsel URL'si döndürdüğünde görsel kategorisi sonuçları `img_src` içerir
- **API anahtarı yok** -- herhangi bir SearXNG örneğiyle doğrudan çalışır
- **Temel URL doğrulaması** -- `baseUrl`, geçerli bir `http://` veya `https://` URL'si olmalıdır
- **Ağ koruması** -- `http://` temel URL'leri güvenilir bir özel veya local loopback ana bilgisayarını hedeflemelidir (herkese açık ana bilgisayarlar `https://` kullanmalıdır); özel/dahili bir adrese çözümlenen `https://` temel URL'leri aynı kendi kendine barındırma iznini alırken, herkese açık bir adrese çözümlenen `https://` temel URL'leri katı SSRF korumasını sürdürür
- **Otomatik algılama sırası** -- SearXNG yapılandırılmış bir `baseUrl` gerektirir (gerekli kimlik bilgilerine zaten sahip sağlayıcılar arasında sıra 200). DuckDuckGo veya Ollama Web Search gibi anahtar gerektirmeyen sağlayıcılar otomatik algılamada hiçbir zaman örtük olarak seçilmez; yalnızca açık bir `provider` seçimiyle etkinleşirler
- **Kendi kendine barındırma** -- örneği, sorguları ve yukarı akış arama motorlarını siz denetlersiniz
- **Kategoriler**, yapılandırılmadığında varsayılan olarak `general` değerini kullanır
- **Kategori geri dönüşü** -- `general` dışındaki bir kategori isteği başarılı olur ancak sıfır sonuç döndürürse OpenClaw, boş bir sonuç kümesi döndürmeden önce aynı sorguyu `general` ile bir kez daha dener
- **Sonuç önbelleğe alma** -- özdeş sorgular (aynı sorgu, sayı, kategoriler, dil ve temel URL) kısa bir TTL süresince işlem içinde önbelleğe alınır
- **Sürüm gereksinimi** -- Plugin, `minHostVersion: >=2026.6.9` bildiriminde bulunur

<Tip>
  SearXNG JSON API'nin çalışması için SearXNG örneğinizin `settings.yml` dosyasında `search.formats` altında `json` biçiminin etkinleştirildiğinden emin olun.
</Tip>

## İlgili

- [Web Araması genel bakışı](/tr/tools/web) -- tüm sağlayıcılar ve otomatik algılama
- [DuckDuckGo Araması](/tr/tools/duckduckgo-search) -- anahtar gerektirmeyen başka bir sağlayıcı
- [Brave Araması](/tr/tools/brave-search) -- ücretsiz katmanlı yapılandırılmış sonuçlar
