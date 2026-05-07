---
read_when:
    - web_search öğesini etkinleştirmek veya yapılandırmak istiyorsunuz
    - x_search'i etkinleştirmek veya yapılandırmak istiyorsunuz
    - Bir arama sağlayıcısı seçmeniz gerekiyor
    - Otomatik algılamayı ve sağlayıcı geri dönüşünü anlamak istiyorsunuz
sidebarTitle: Web Search
summary: web_search, x_search ve web_fetch -- internette arama yapın, X gönderilerinde arama yapın veya sayfa içeriğini getirin
title: Web araması
x-i18n:
    generated_at: "2026-05-07T01:55:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 806b614fe3103439ea0a1acaaaa9f4071e22440cc2091ff814834e75b2079529
    source_path: tools/web.md
    workflow: 16
---

`web_search` aracı, yapılandırılmış sağlayıcınızı kullanarak web'de arama yapar ve
sonuçları döndürür. Sonuçlar sorguya göre 15 dakika önbelleğe alınır (yapılandırılabilir).

OpenClaw ayrıca X (eski adıyla Twitter) gönderileri için `x_search` ve
hafif URL getirme için `web_fetch` içerir. Bu aşamada, `web_fetch` yerel
kalırken `web_search` ve `x_search` arka planda xAI Responses kullanabilir.

<Info>
  `web_search`, tarayıcı otomasyonu değil, hafif bir HTTP aracıdır. JS ağırlıklı
  siteler veya oturum açmalar için [Web Tarayıcısı](/tr/tools/browser) kullanın.
  Belirli bir URL'yi getirmek için [Web Fetch](/tr/tools/web-fetch) kullanın.
</Info>

## Hızlı başlangıç

<Steps>
  <Step title="Bir sağlayıcı seçin">
    Bir sağlayıcı seçin ve gerekli kurulumu tamamlayın. Bazı sağlayıcılar
    anahtarsızdır, bazıları ise API anahtarları kullanır. Ayrıntılar için
    aşağıdaki sağlayıcı sayfalarına bakın.
  </Step>
  <Step title="Yapılandırın">
    ```bash
    openclaw configure --section web
    ```
    Bu, sağlayıcıyı ve gereken kimlik bilgisini kaydeder. Ayrıca bir env
    var (örneğin `BRAVE_API_KEY`) ayarlayabilir ve API destekli
    sağlayıcılar için bu adımı atlayabilirsiniz.
  </Step>
  <Step title="Kullanın">
    Agent artık `web_search` çağırabilir:

    ```javascript
    await web_search({ query: "OpenClaw plugin SDK" });
    ```

    X gönderileri için şunu kullanın:

    ```javascript
    await x_search({ query: "dinner recipes" });
    ```

  </Step>
</Steps>

## Sağlayıcı seçimi

<CardGroup cols={2}>
  <Card title="Brave Search" icon="shield" href="/tr/tools/brave-search">
    Parçacıklarla yapılandırılmış sonuçlar. `llm-context` modunu ve ülke/dil filtrelerini destekler. Ücretsiz katman kullanılabilir.
  </Card>
  <Card title="DuckDuckGo" icon="bird" href="/tr/tools/duckduckgo-search">
    Anahtarsız geri dönüş. API anahtarı gerekmez. Resmi olmayan HTML tabanlı entegrasyon.
  </Card>
  <Card title="Exa" icon="brain" href="/tr/tools/exa-search">
    İçerik çıkarma (vurgular, metin, özetler) ile nöral + anahtar kelime araması.
  </Card>
  <Card title="Firecrawl" icon="flame" href="/tr/tools/firecrawl">
    Yapılandırılmış sonuçlar. Derin çıkarma için en iyi `firecrawl_search` ve `firecrawl_scrape` ile birlikte kullanılır.
  </Card>
  <Card title="Gemini" icon="sparkles" href="/tr/tools/gemini-search">
    Google Search grounding aracılığıyla atıflı, AI tarafından sentezlenmiş yanıtlar.
  </Card>
  <Card title="Grok" icon="zap" href="/tr/tools/grok-search">
    xAI web grounding aracılığıyla atıflı, AI tarafından sentezlenmiş yanıtlar.
  </Card>
  <Card title="Kimi" icon="moon" href="/tr/tools/kimi-search">
    Moonshot web araması aracılığıyla atıflı, AI tarafından sentezlenmiş yanıtlar; temellendirilmemiş sohbet geri dönüşleri açıkça başarısız olur.
  </Card>
  <Card title="MiniMax Search" icon="globe" href="/tr/tools/minimax-search">
    MiniMax Token Plan arama API'si aracılığıyla yapılandırılmış sonuçlar.
  </Card>
  <Card title="Ollama Web Search" icon="globe" href="/tr/tools/ollama-search">
    Oturum açılmış yerel bir Ollama host'u veya barındırılan Ollama API üzerinden arama.
  </Card>
  <Card title="Perplexity" icon="search" href="/tr/tools/perplexity-search">
    İçerik çıkarma denetimleri ve etki alanı filtreleme ile yapılandırılmış sonuçlar.
  </Card>
  <Card title="SearXNG" icon="server" href="/tr/tools/searxng-search">
    Kendi kendine barındırılan meta arama. API anahtarı gerekmez. Google, Bing, DuckDuckGo ve daha fazlasını birleştirir.
  </Card>
  <Card title="Tavily" icon="globe" href="/tr/tools/tavily">
    Arama derinliği, konu filtreleme ve URL çıkarma için `tavily_extract` ile yapılandırılmış sonuçlar.
  </Card>
</CardGroup>

### Sağlayıcı karşılaştırması

| Sağlayıcı                                 | Sonuç stili                                                   | Filtreler                                        | API anahtarı                                                                            |
| ----------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------- |
| [Brave](/tr/tools/brave-search)              | Yapılandırılmış parçacıklar                                   | Ülke, dil, zaman, `llm-context` modu             | `BRAVE_API_KEY`                                                                         |
| [DuckDuckGo](/tr/tools/duckduckgo-search)    | Yapılandırılmış parçacıklar                                   | --                                               | Yok (anahtarsız)                                                                        |
| [Exa](/tr/tools/exa-search)                  | Yapılandırılmış + çıkarılmış                                  | Nöral/anahtar kelime modu, tarih, içerik çıkarma | `EXA_API_KEY`                                                                           |
| [Firecrawl](/tr/tools/firecrawl)             | Yapılandırılmış parçacıklar                                   | `firecrawl_search` aracı aracılığıyla            | `FIRECRAWL_API_KEY`                                                                     |
| [Gemini](/tr/tools/gemini-search)            | AI tarafından sentezlenmiş + atıflar                          | --                                               | `GEMINI_API_KEY`                                                                        |
| [Grok](/tr/tools/grok-search)                | AI tarafından sentezlenmiş + atıflar                          | --                                               | `XAI_API_KEY`                                                                           |
| [Kimi](/tr/tools/kimi-search)                | AI tarafından sentezlenmiş + atıflar; temellendirilmemiş sohbet geri dönüşlerinde başarısız olur | --                                               | `KIMI_API_KEY` / `MOONSHOT_API_KEY`                                                     |
| [MiniMax Search](/tr/tools/minimax-search)   | Yapılandırılmış parçacıklar                                   | Bölge (`global` / `cn`)                          | `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` / `MINIMAX_OAUTH_TOKEN`              |
| [Ollama Web Search](/tr/tools/ollama-search) | Yapılandırılmış parçacıklar                                   | --                                               | Oturum açılmış yerel host'lar için yok; doğrudan `https://ollama.com` araması için `OLLAMA_API_KEY` |
| [Perplexity](/tr/tools/perplexity-search)    | Yapılandırılmış parçacıklar                                   | Ülke, dil, zaman, etki alanları, içerik sınırları | `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY`                                             |
| [SearXNG](/tr/tools/searxng-search)          | Yapılandırılmış parçacıklar                                   | Kategoriler, dil                                 | Yok (kendi kendine barındırılır)                                                        |
| [Tavily](/tr/tools/tavily)                   | Yapılandırılmış parçacıklar                                   | `tavily_search` aracı aracılığıyla               | `TAVILY_API_KEY`                                                                        |

## Otomatik algılama

## Yerel OpenAI web araması

Doğrudan OpenAI Responses modelleri, OpenClaw web araması etkinleştirildiğinde ve yönetilen bir sağlayıcı sabitlenmediğinde OpenAI'nin barındırılan `web_search` aracını otomatik olarak kullanır. Bu, paketlenmiş OpenAI Plugin içinde sağlayıcıya ait bir davranıştır ve OpenAI uyumlu proxy temel URL'leri veya Azure rotaları için değil, yalnızca yerel OpenAI API trafiği için geçerlidir. OpenAI modelleri için yönetilen `web_search` aracını korumak üzere `tools.web.search.provider` değerini `brave` gibi başka bir sağlayıcıya ayarlayın veya hem yönetilen aramayı hem de yerel OpenAI aramasını devre dışı bırakmak için `tools.web.search.enabled: false` ayarlayın.

## Yerel Codex web araması

Codex özellikli modeller, OpenClaw'ın yönetilen `web_search` işlevi yerine isteğe bağlı olarak sağlayıcıya özgü Responses `web_search` aracını kullanabilir.

- Bunu `tools.web.search.openaiCodex` altında yapılandırın
- Yalnızca Codex özellikli modeller için etkinleşir (`openai-codex/*` veya `api: "openai-codex-responses"` kullanan sağlayıcılar)
- Yönetilen `web_search`, Codex dışı modellere uygulanmaya devam eder
- `mode: "cached"` varsayılan ve önerilen ayardır
- `tools.web.search.enabled: false` hem yönetilen hem de yerel aramayı devre dışı bırakır

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        openaiCodex: {
          enabled: true,
          mode: "cached",
          allowedDomains: ["example.com"],
          contextSize: "high",
          userLocation: {
            country: "US",
            city: "New York",
            timezone: "America/New_York",
          },
        },
      },
    },
  },
}
```

Yerel Codex araması etkinleştirilmiş ancak mevcut model Codex özellikli değilse OpenClaw normal yönetilen `web_search` davranışını korur.

## Ağ güvenliği

Yönetilen `web_search` sağlayıcı çağrıları OpenClaw'ın korumalı fetch yolunu kullanır. Güvenilen sağlayıcı API host'ları için OpenClaw, `198.18.0.0/15` ve `fc00::/7` içindeki Surge, Clash ve sing-box fake-IP DNS yanıtlarına yalnızca ilgili sağlayıcı hostname'i için izin verir. Diğer özel, loopback, link-local ve metadata hedefleri engelli kalır.

Bu otomatik izin, rastgele `web_fetch` URL'leri için geçerli değildir. `web_fetch` için, `tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` ve `tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange` ayarlarını yalnızca güvenilen proxy'niz bu sentetik aralıklara sahipse açıkça etkinleştirin.

## Web aramasını ayarlama

Dokümanlardaki ve kurulum akışlarındaki sağlayıcı listeleri alfabetiktir. Otomatik algılama ayrı bir öncelik sırası tutar.

`provider` ayarlanmamışsa OpenClaw sağlayıcıları şu sırayla kontrol eder ve hazır olan ilkini kullanır:

Önce API destekli sağlayıcılar:

1. **Brave** -- `BRAVE_API_KEY` veya `plugins.entries.brave.config.webSearch.apiKey` (sıra 10)
2. **MiniMax Search** -- `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` / `MINIMAX_OAUTH_TOKEN` / `MINIMAX_API_KEY` veya `plugins.entries.minimax.config.webSearch.apiKey` (sıra 15)
3. **Gemini** -- `plugins.entries.google.config.webSearch.apiKey`, `GEMINI_API_KEY` veya `models.providers.google.apiKey` (sıra 20)
4. **Grok** -- `XAI_API_KEY` veya `plugins.entries.xai.config.webSearch.apiKey` (sıra 30)
5. **Kimi** -- `KIMI_API_KEY` / `MOONSHOT_API_KEY` veya `plugins.entries.moonshot.config.webSearch.apiKey` (sıra 40)
6. **Perplexity** -- `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY` veya `plugins.entries.perplexity.config.webSearch.apiKey` (sıra 50)
7. **Firecrawl** -- `FIRECRAWL_API_KEY` veya `plugins.entries.firecrawl.config.webSearch.apiKey` (sıra 60)
8. **Exa** -- `EXA_API_KEY` veya `plugins.entries.exa.config.webSearch.apiKey`; isteğe bağlı `plugins.entries.exa.config.webSearch.baseUrl` Exa endpoint'ini geçersiz kılar (sıra 65)
9. **Tavily** -- `TAVILY_API_KEY` veya `plugins.entries.tavily.config.webSearch.apiKey` (sıra 70)

Bundan sonra anahtarsız geri dönüşler:

10. **DuckDuckGo** -- hesap veya API anahtarı gerektirmeyen anahtarsız HTML geri dönüşü (sıra 100)
11. **Ollama Web Search** -- erişilebilir olduğunda ve `ollama signin` ile oturum açıldığında yapılandırılmış yerel Ollama host'unuz üzerinden anahtarsız geri dönüş; host gerektirdiğinde Ollama sağlayıcı bearer auth bilgisini yeniden kullanabilir ve `OLLAMA_API_KEY` ile yapılandırıldığında doğrudan `https://ollama.com` araması çağırabilir (sıra 110)
12. **SearXNG** -- `SEARXNG_BASE_URL` veya `plugins.entries.searxng.config.webSearch.baseUrl` (sıra 200)

Hiçbir sağlayıcı algılanmazsa Brave'e geri döner (birini yapılandırmanızı isteyen eksik anahtar hatası alırsınız).

<Note>
  Tüm sağlayıcı anahtar alanları SecretRef nesnelerini destekler. Plugin kapsamlı SecretRef'ler,
  `plugins.entries.<plugin>.config.webSearch.apiKey` altında, Brave, Exa, Firecrawl,
  Gemini, Grok, Kimi, MiniMax, Perplexity ve Tavily dahil olmak üzere paketlenmiş API destekli web araması sağlayıcıları için,
  sağlayıcı ister `tools.web.search.provider` aracılığıyla açıkça seçilsin ister
  otomatik algılama yoluyla seçilsin çözümlenir. Otomatik algılama modunda OpenClaw yalnızca
  seçilen sağlayıcı anahtarını çözümler -- seçilmeyen SecretRef'ler pasif kalır; böylece
  kullanmadığınız sağlayıcılar için çözümleme maliyeti ödemeden birden çok sağlayıcıyı
  yapılandırılmış tutabilirsiniz.
</Note>

## Yapılandırma

```json5
{
  tools: {
    web: {
      search: {
        enabled: true, // default: true
        provider: "brave", // or omit for auto-detection
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
    },
  },
}
```

Sağlayıcıya özgü yapılandırma (API anahtarları, temel URL'ler, modlar)
`plugins.entries.<plugin>.config.webSearch.*` altında bulunur. Gemini ayrıca ayrılmış web arama yapılandırmasından ve `GEMINI_API_KEY` değerinden sonra daha düşük öncelikli yedekler olarak `models.providers.google.apiKey` ve `models.providers.google.baseUrl` değerlerini yeniden kullanabilir. Örnekler için sağlayıcı sayfalarına bakın.

`tools.web.search.provider`, paketlenmiş ve kurulu Plugin manifestleri tarafından bildirilen web arama sağlayıcı kimliklerine ve bilinen kurulabilir sağlayıcı Pluginlerine göre doğrulanır. `"brvae"` gibi bir yazım hatası, sessizce otomatik algılamaya geri dönmek yerine yapılandırma doğrulamasında başarısız olur. Yapılandırılan sağlayıcı biliniyorsa ancak sahibi olan Plugin kullanılamıyorsa, OpenClaw başlangıcı dayanıklı tutar ve Plugin’i kurmak veya etkinleştirmek için `openclaw doctor --fix` çalıştırabilmeniz adına bir uyarı bildirir. Aynı uyarı davranışı, üçüncü taraf bir Plugin kaldırıldıktan sonra geride kalan `plugins.entries.<plugin>` bloğu gibi eski Plugin kanıtları için de geçerlidir.

`web_fetch` yedek sağlayıcı seçimi ayrıdır:

- `tools.web.fetch.provider` ile seçin
- veya bu alanı atlayın ve OpenClaw’ın mevcut kimlik bilgilerinden hazır olan ilk web fetch sağlayıcısını otomatik algılamasına izin verin
- sanal alan dışında çalışan `web_fetch`, `contracts.webFetchProviders` bildiren kurulu Plugin sağlayıcılarını kullanabilir; sanal alanlı fetch işlemleri yalnızca paketlenmiş olanlarla sınırlı kalır
- bugün paketlenmiş web fetch sağlayıcısı Firecrawl’dır ve `plugins.entries.firecrawl.config.webFetch.*` altında yapılandırılır

`openclaw onboard` veya `openclaw configure --section web` sırasında **Kimi** seçtiğinizde, OpenClaw şunları da sorabilir:

- Moonshot API bölgesi (`https://api.moonshot.ai/v1` veya `https://api.moonshot.cn/v1`)
- varsayılan Kimi web arama modeli (varsayılan: `kimi-k2.6`)

`x_search` için `plugins.entries.xai.config.xSearch.*` yapılandırın. Grok web aramasıyla aynı `XAI_API_KEY` yedeğini kullanır.
Eski `tools.web.x_search.*` yapılandırması `openclaw doctor --fix` tarafından otomatik olarak taşınır.
`openclaw onboard` veya `openclaw configure --section web` sırasında Grok seçtiğinizde, OpenClaw aynı anahtarla isteğe bağlı `x_search` kurulumunu da sunabilir.
Bu, Grok yolu içinde ayrı bir takip adımıdır; ayrı bir üst düzey web arama sağlayıcısı seçimi değildir. Başka bir sağlayıcı seçerseniz OpenClaw `x_search` istemini göstermez.

### API anahtarlarını depolama

<Tabs>
  <Tab title="Config file">
    `openclaw configure --section web` çalıştırın veya anahtarı doğrudan ayarlayın:

    ```json5
    {
      plugins: {
        entries: {
          brave: {
            config: {
              webSearch: {
                apiKey: "YOUR_KEY", // pragma: allowlist secret
              },
            },
          },
        },
      },
    }
    ```

  </Tab>
  <Tab title="Environment variable">
    Sağlayıcı ortam değişkenini Gateway işlem ortamında ayarlayın:

    ```bash
    export BRAVE_API_KEY="YOUR_KEY"
    ```

    Bir gateway kurulumu için bunu `~/.openclaw/.env` içine koyun.
    [Ortam değişkenleri](/tr/help/faq#env-vars-and-env-loading) bölümüne bakın.

  </Tab>
</Tabs>

## Araç parametreleri

| Parametre             | Açıklama                                                |
| --------------------- | ------------------------------------------------------- |
| `query`               | Arama sorgusu (gerekli)                                 |
| `count`               | Döndürülecek sonuç sayısı (1-10, varsayılan: 5)         |
| `country`             | 2 harfli ISO ülke kodu (örn. "US", "DE")                |
| `language`            | ISO 639-1 dil kodu (örn. "en", "de")                    |
| `search_lang`         | Arama dili kodu (yalnızca Brave)                        |
| `freshness`           | Zaman filtresi: `day`, `week`, `month` veya `year`      |
| `date_after`          | Bu tarihten sonraki sonuçlar (YYYY-MM-DD)               |
| `date_before`         | Bu tarihten önceki sonuçlar (YYYY-MM-DD)                |
| `ui_lang`             | Kullanıcı arayüzü dil kodu (yalnızca Brave)             |
| `domain_filter`       | Alan adı izin/reddetme listesi dizisi (yalnızca Perplexity) |
| `max_tokens`          | Toplam içerik bütçesi, varsayılan 25000 (yalnızca Perplexity) |
| `max_tokens_per_page` | Sayfa başına token sınırı, varsayılan 2048 (yalnızca Perplexity) |

<Warning>
  Tüm parametreler tüm sağlayıcılarla çalışmaz. Brave `llm-context` modu
  `ui_lang` değerini reddeder; Brave özel güncellik aralıkları hem başlangıç hem de bitiş tarihi gerektirdiği için `date_before` ayrıca `date_after` gerektirir.
  Gemini, Grok ve Kimi, atıflarla birlikte sentezlenmiş tek bir yanıt döndürür. Paylaşılan araç uyumluluğu için `count` kabul ederler, ancak bu dayanaklı yanıt biçimini değiştirmez. Gemini, `freshness`, `date_after` ve `date_before` değerlerini Google Arama dayanaklı zaman aralıklarına dönüştürerek destekler.
  Perplexity, Sonar/OpenRouter uyumluluk yolunu (`plugins.entries.perplexity.config.webSearch.baseUrl` /
  `model` veya `OPENROUTER_API_KEY`) kullandığınızda aynı şekilde davranır.
  SearXNG, `http://` değerini yalnızca güvenilir özel ağ veya local loopback ana bilgisayarları için kabul eder;
  herkese açık SearXNG uç noktaları `https://` kullanmalıdır.
  Firecrawl ve Tavily, `web_search` üzerinden yalnızca `query` ve `count` destekler
  -- gelişmiş seçenekler için özel araçlarını kullanın.
</Warning>

## x_search

`x_search`, xAI kullanarak X (eski adıyla Twitter) gönderilerini sorgular ve
atıflarla birlikte yapay zeka tarafından sentezlenmiş yanıtlar döndürür. Doğal dil sorgularını ve isteğe bağlı yapılandırılmış filtreleri kabul eder. OpenClaw yerleşik xAI `x_search`
aracını yalnızca bu araç çağrısına hizmet eden istek üzerinde etkinleştirir.

<Note>
  xAI, `x_search` özelliğini anahtar kelime araması, semantik arama, kullanıcı
  araması ve gönderi dizisi getirme desteğiyle belgeler. Yeniden gönderiler,
  yanıtlar, yer imleri veya görüntülemeler gibi gönderi başına etkileşim istatistikleri için tam gönderi URL’si
  veya durum kimliğine yönelik hedefli bir aramayı tercih edin. Geniş anahtar kelime aramaları doğru gönderiyi bulabilir ancak gönderi başına daha az eksiksiz metadata döndürebilir. İyi bir desen şudur: önce gönderiyi bulun, ardından tam o gönderiye odaklanan ikinci bir `x_search` sorgusu çalıştırın.
</Note>

### x_search yapılandırması

```json5
{
  plugins: {
    entries: {
      xai: {
        config: {
          xSearch: {
            enabled: true,
            model: "grok-4-1-fast-non-reasoning",
            baseUrl: "https://api.x.ai/v1", // optional, overrides webSearch.baseUrl
            inlineCitations: false,
            maxTurns: 2,
            timeoutSeconds: 30,
            cacheTtlMinutes: 15,
          },
          webSearch: {
            apiKey: "xai-...", // optional if XAI_API_KEY is set
            baseUrl: "https://api.x.ai/v1", // optional shared xAI Responses base URL
          },
        },
      },
    },
  },
}
```

`plugins.entries.xai.config.xSearch.baseUrl` ayarlandığında `x_search`,
`<baseUrl>/responses` konumuna gönderi yapar. Bu alan atlanırsa,
`plugins.entries.xai.config.webSearch.baseUrl` değerine, ardından eski
`tools.web.search.grok.baseUrl` değerine ve son olarak herkese açık xAI uç noktasına geri döner.

### x_search parametreleri

| Parametre                    | Açıklama                                               |
| ---------------------------- | ------------------------------------------------------ |
| `query`                      | Arama sorgusu (gerekli)                                |
| `allowed_x_handles`          | Sonuçları belirli X kullanıcı adlarıyla sınırla        |
| `excluded_x_handles`         | Belirli X kullanıcı adlarını hariç tut                 |
| `from_date`                  | Yalnızca bu tarihte veya sonrasındaki gönderileri dahil et (YYYY-MM-DD) |
| `to_date`                    | Yalnızca bu tarihte veya öncesindeki gönderileri dahil et (YYYY-MM-DD) |
| `enable_image_understanding` | xAI’ın eşleşen gönderilere ekli görselleri incelemesine izin ver |
| `enable_video_understanding` | xAI’ın eşleşen gönderilere ekli videoları incelemesine izin ver |

### x_search örneği

```javascript
await x_search({
  query: "dinner recipes",
  allowed_x_handles: ["nytfood"],
  from_date: "2026-03-01",
});
```

```javascript
// Per-post stats: use the exact status URL or status ID when possible
await x_search({
  query: "https://x.com/huntharo/status/1905678901234567890",
});
```

## Örnekler

```javascript
// Basic search
await web_search({ query: "OpenClaw plugin SDK" });

// German-specific search
await web_search({ query: "TV online schauen", country: "DE", language: "de" });

// Recent results (past week)
await web_search({ query: "AI developments", freshness: "week" });

// Date range
await web_search({
  query: "climate research",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});

// Domain filtering (Perplexity only)
await web_search({
  query: "product reviews",
  domain_filter: ["-reddit.com", "-pinterest.com"],
});
```

## Araç profilleri

Araç profilleri veya izin listeleri kullanıyorsanız `web_search`, `x_search` ya da `group:web` ekleyin:

```json5
{
  tools: {
    allow: ["web_search", "x_search"],
    // or: allow: ["group:web"]  (includes web_search, x_search, and web_fetch)
  },
}
```

## İlgili

- [Web Fetch](/tr/tools/web-fetch) -- bir URL getirir ve okunabilir içeriği çıkarır
- [Web Browser](/tr/tools/browser) -- JS ağırlıklı siteler için tam tarayıcı otomasyonu
- [Grok Search](/tr/tools/grok-search) -- `web_search` sağlayıcısı olarak Grok
- [Ollama Web Search](/tr/tools/ollama-search) -- Ollama ana bilgisayarınız üzerinden anahtarsız web araması
