---
read_when:
    - Kendi barındırdığınız bir web arama sağlayıcısı istiyorsunuz
    - Web_search için SearXNG kullanmak istiyorsunuz
    - Gizlilik odaklı veya hava boşluklu bir arama seçeneğine ihtiyacınız var
summary: SearXNG web araması -- kendi barındırılan, anahtarsız meta arama sağlayıcısı
title: SearXNG araması
x-i18n:
    generated_at: "2026-06-28T01:25:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4bd00a20e45f71b7bd855a6588d5c829a0202839fc93ddcec1e255b7858ff183
    source_path: tools/searxng-search.md
    workflow: 16
---

OpenClaw, **kendi barındırdığınız, anahtarsız** bir `web_search` sağlayıcısı olarak [SearXNG](https://docs.searxng.org/) desteği sunar. SearXNG, Google, Bing, DuckDuckGo ve diğer kaynaklardan sonuçları birleştiren açık kaynaklı bir meta arama motorudur.

Avantajlar:

- **Ücretsiz ve sınırsız** -- API anahtarı veya ticari abonelik gerekmez
- **Gizlilik / izole ağ** -- sorgular ağınızdan dışarı çıkmaz
- **Her yerde çalışır** -- ticari arama API'lerinde bölge kısıtlaması yoktur

## Kurulum

<Steps>
  <Step title="Plugin'i yükleyin">
    ```bash
    openclaw plugins install @openclaw/searxng-plugin
    ```
  </Step>
  <Step title="Bir SearXNG örneği çalıştırın">
    ```bash
    docker run -d -p 8888:8080 searxng/searxng
    ```

    Ya da erişiminiz olan mevcut bir SearXNG dağıtımını kullanın. Üretim kurulumu için
    [SearXNG belgelerine](https://docs.searxng.org/) bakın.

  </Step>
  <Step title="Yapılandırın">
    ```bash
    openclaw configure --section web
    # Select "searxng" as the provider
    ```

    Ya da ortam değişkenini ayarlayın ve otomatik algılamanın onu bulmasına izin verin:

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

- `https://`, herkese açık veya özel SearXNG ana makineleri için çalışır
- `http://` yalnızca güvenilir özel ağ veya loopback ana makineleri için kabul edilir
- herkese açık SearXNG ana makineleri `https://` kullanmalıdır
- özel/dahili ana makineler kendi barındırılan ağ korumasını kullanır; herkese açık `https://`
  ana makineler katı web araması korumasında kalır ve özel adreslere yönlendirme yapamaz

## Ortam değişkeni

Yapılandırmaya alternatif olarak `SEARXNG_BASE_URL` değerini ayarlayın:

```bash
export SEARXNG_BASE_URL="http://localhost:8888"
```

`SEARXNG_BASE_URL` ayarlandığında ve açık bir sağlayıcı yapılandırılmadığında, otomatik algılama
SearXNG'yi otomatik olarak seçer (en düşük öncelikte -- anahtarı olan API destekli herhangi bir
sağlayıcı önce kazanır).

## Plugin yapılandırma referansı

| Alan         | Açıklama                                                              |
| ------------ | --------------------------------------------------------------------- |
| `baseUrl`    | SearXNG örneğinizin temel URL'si (zorunlu)                            |
| `categories` | `general`, `news` veya `science` gibi virgülle ayrılmış kategoriler   |
| `language`   | Sonuçlar için `en`, `de` veya `fr` gibi dil kodu                      |

## Notlar

- **JSON API** -- HTML kazıma değil, SearXNG'nin yerel `format=json` uç noktasını kullanır
- **Görsel sonuç URL'leri** -- görsel kategorisi sonuçları, SearXNG doğrudan görsel URL'si
  döndürdüğünde `img_src` içerir
- **API anahtarı yok** -- kutudan çıktığı gibi herhangi bir SearXNG örneğiyle çalışır
- **Temel URL doğrulaması** -- `baseUrl` geçerli bir `http://` veya `https://`
  URL'si olmalıdır; herkese açık ana makineler `https://` kullanmalıdır
- **Ağ koruması** -- özel/dahili SearXNG uç noktaları özel ağ erişimine
  dahil olur; herkese açık `https://` SearXNG uç noktaları katı SSRF
  korumasını sürdürür
- **Otomatik algılama sırası** -- SearXNG, yapılandırılmış anahtarları olan API destekli sağlayıcılardan
  sonra denetlenir (sıra 200). DuckDuckGo veya Ollama Web Search gibi anahtarsız sağlayıcılar,
  açık bir sağlayıcı seçimi olmadan otomatik olarak seçilmez
- **Kendi barındırma** -- örneği, sorguları ve yukarı akış arama motorlarını siz kontrol edersiniz
- **Kategoriler**, yapılandırılmadığında varsayılan olarak `general` değerini alır
- **Kategori geri dönüşü** -- `general` dışı bir kategori isteği başarılı olur ancak
  sıfır sonuç döndürürse OpenClaw, boş sonuç kümesi döndürmeden önce aynı sorguyu bir kez `general`
  ile yeniden dener

<Tip>
  SearXNG JSON API'nin çalışması için SearXNG örneğinizde `settings.yml` içindeki
  `search.formats` altında `json` biçiminin etkin olduğundan emin olun.
</Tip>

## İlgili

- [Web Araması genel bakışı](/tr/tools/web) -- tüm sağlayıcılar ve otomatik algılama
- [DuckDuckGo Araması](/tr/tools/duckduckgo-search) -- başka bir anahtarsız sağlayıcı
- [Brave Araması](/tr/tools/brave-search) -- ücretsiz katmanla yapılandırılmış sonuçlar
