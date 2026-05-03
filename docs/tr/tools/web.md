---
read_when:
    - web_search ayarını etkinleştirmek veya yapılandırmak istiyorsunuz
    - x_search'i etkinleştirmek veya yapılandırmak istiyorsunuz
    - Bir arama sağlayıcısı seçmeniz gerekiyor
    - Otomatik algılamayı ve sağlayıcı geri dönüşünü anlamak istiyorsunuz
sidebarTitle: Web Search
summary: web_search, x_search ve web_fetch -- web'de arama yapın, X gönderilerinde arama yapın veya sayfa içeriğini getirin
title: Web araması
x-i18n:
    generated_at: "2026-05-03T21:40:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 84de67b51f02e3b901bfa55017ae8e88de49295dfe6ed1103a45f034e073c087
    source_path: tools/web.md
    workflow: 16
---

`web_search` aracı, yapılandırdığınız sağlayıcıyı kullanarak web'de arama yapar ve
sonuçları döndürür. Sonuçlar sorguya göre 15 dakika boyunca önbelleğe alınır (yapılandırılabilir).

OpenClaw ayrıca X (eski adıyla Twitter) gönderileri için `x_search` ve
hafif URL getirme için `web_fetch` içerir. Bu aşamada, `web_fetch` yerel kalırken
`web_search` ve `x_search` arka planda xAI Responses kullanabilir.

<Info>
  `web_search`, tarayıcı otomasyonu değil, hafif bir HTTP aracıdır. JS ağırlıklı
  siteler veya oturum açma işlemleri için [Web Tarayıcısı](/tr/tools/browser) kullanın. Belirli
  bir URL'yi getirmek için [Web Fetch](/tr/tools/web-fetch) kullanın.
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
    Bu, sağlayıcıyı ve gereken kimlik bilgisini depolar. Ayrıca bir env
    var ayarlayabilir (örneğin `BRAVE_API_KEY`) ve API destekli sağlayıcılar için
    bu adımı atlayabilirsiniz.
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

## Sağlayıcı seçme

<CardGroup cols={2}>
  <Card title="Brave Search" icon="shield" href="/tr/tools/brave-search">
    Snippet'lar içeren yapılandırılmış sonuçlar. `llm-context` modunu, ülke/dil filtrelerini destekler. Ücretsiz katman mevcuttur.
  </Card>
  <Card title="DuckDuckGo" icon="bird" href="/tr/tools/duckduckgo-search">
    Anahtarsız yedek. API anahtarı gerekmez. Resmi olmayan HTML tabanlı entegrasyon.
  </Card>
  <Card title="Exa" icon="brain" href="/tr/tools/exa-search">
    İçerik çıkarımıyla nöral + anahtar sözcük araması (vurgular, metin, özetler).
  </Card>
  <Card title="Firecrawl" icon="flame" href="/tr/tools/firecrawl">
    Yapılandırılmış sonuçlar. Derin çıkarım için en iyi `firecrawl_search` ve `firecrawl_scrape` ile birlikte kullanılır.
  </Card>
  <Card title="Gemini" icon="sparkles" href="/tr/tools/gemini-search">
    Google Search grounding üzerinden alıntılarla yapay zeka tarafından sentezlenmiş yanıtlar.
  </Card>
  <Card title="Grok" icon="zap" href="/tr/tools/grok-search">
    xAI web grounding üzerinden alıntılarla yapay zeka tarafından sentezlenmiş yanıtlar.
  </Card>
  <Card title="Kimi" icon="moon" href="/tr/tools/kimi-search">
    Moonshot web araması üzerinden alıntılarla yapay zeka tarafından sentezlenmiş yanıtlar; grounding yapılmamış sohbet yedekleri açıkça başarısız olur.
  </Card>
  <Card title="MiniMax Search" icon="globe" href="/tr/tools/minimax-search">
    MiniMax Token Plan arama API'si üzerinden yapılandırılmış sonuçlar.
  </Card>
  <Card title="Ollama Web Search" icon="globe" href="/tr/tools/ollama-search">
    Oturum açılmış yerel bir Ollama ana makinesi veya barındırılan Ollama API'si üzerinden arama.
  </Card>
  <Card title="Perplexity" icon="search" href="/tr/tools/perplexity-search">
    İçerik çıkarma kontrolleri ve alan adı filtrelemesiyle yapılandırılmış sonuçlar.
  </Card>
  <Card title="SearXNG" icon="server" href="/tr/tools/searxng-search">
    Kendinden barındırılan meta arama. API anahtarı gerekmez. Google, Bing, DuckDuckGo ve daha fazlasını birleştirir.
  </Card>
  <Card title="Tavily" icon="globe" href="/tr/tools/tavily">
    Arama derinliği, konu filtrelemesi ve URL çıkarımı için `tavily_extract` ile yapılandırılmış sonuçlar.
  </Card>
</CardGroup>

### Sağlayıcı karşılaştırması

| Sağlayıcı                                  | Sonuç stili                                                   | Filtreler                                          | API anahtarı                                                                                 |
| ----------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------- |
| [Brave](/tr/tools/brave-search)              | Yapılandırılmış snippet'lar                                            | Ülke, dil, zaman, `llm-context` modu      | `BRAVE_API_KEY`                                                                         |
| [DuckDuckGo](/tr/tools/duckduckgo-search)    | Yapılandırılmış snippet'lar                                            | --                                               | Yok (anahtarsız)                                                                         |
| [Exa](/tr/tools/exa-search)                  | Yapılandırılmış + çıkarılmış                                         | Nöral/anahtar sözcük modu, tarih, içerik çıkarımı    | `EXA_API_KEY`                                                                           |
| [Firecrawl](/tr/tools/firecrawl)             | Yapılandırılmış snippet'lar                                            | `firecrawl_search` aracı üzerinden                      | `FIRECRAWL_API_KEY`                                                                     |
| [Gemini](/tr/tools/gemini-search)            | Yapay zeka tarafından sentezlenmiş + alıntılar                                     | --                                               | `GEMINI_API_KEY`                                                                        |
| [Grok](/tr/tools/grok-search)                | Yapay zeka tarafından sentezlenmiş + alıntılar                                     | --                                               | `XAI_API_KEY`                                                                           |
| [Kimi](/tr/tools/kimi-search)                | Yapay zeka tarafından sentezlenmiş + alıntılar; grounding yapılmamış sohbet yedeklerinde başarısız olur | --                                               | `KIMI_API_KEY` / `MOONSHOT_API_KEY`                                                     |
| [MiniMax Search](/tr/tools/minimax-search)   | Yapılandırılmış snippet'lar                                            | Bölge (`global` / `cn`)                         | `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` / `MINIMAX_OAUTH_TOKEN`              |
| [Ollama Web Search](/tr/tools/ollama-search) | Yapılandırılmış snippet'lar                                            | --                                               | Oturum açılmış yerel ana makineler için yok; doğrudan `https://ollama.com` araması için `OLLAMA_API_KEY` |
| [Perplexity](/tr/tools/perplexity-search)    | Yapılandırılmış snippet'lar                                            | Ülke, dil, zaman, alan adları, içerik sınırları | `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY`                                             |
| [SearXNG](/tr/tools/searxng-search)          | Yapılandırılmış snippet'lar                                            | Kategoriler, dil                             | Yok (kendinden barındırılan)                                                                      |
| [Tavily](/tr/tools/tavily)                   | Yapılandırılmış snippet'lar                                            | `tavily_search` aracı üzerinden                         | `TAVILY_API_KEY`                                                                        |

## Otomatik algılama

## Yerel OpenAI web araması

Doğrudan OpenAI Responses modelleri, OpenClaw web araması etkinleştirildiğinde ve yönetilen bir sağlayıcı sabitlenmediğinde OpenAI'nin barındırılan `web_search` aracını otomatik olarak kullanır. Bu, paketlenen OpenAI plugin'inde sağlayıcıya ait bir davranıştır ve yalnızca yerel OpenAI API trafiği için geçerlidir; OpenAI uyumlu proxy temel URL'leri veya Azure rotaları için geçerli değildir. OpenAI modelleri için yönetilen `web_search` aracını korumak üzere `tools.web.search.provider` değerini `brave` gibi başka bir sağlayıcıya ayarlayın veya hem yönetilen aramayı hem de yerel OpenAI aramasını devre dışı bırakmak için `tools.web.search.enabled: false` ayarlayın.

## Yerel Codex web araması

Codex özellikli modeller, isteğe bağlı olarak OpenClaw'ın yönetilen `web_search` işlevi yerine sağlayıcıya yerel Responses `web_search` aracını kullanabilir.

- `tools.web.search.openaiCodex` altında yapılandırın
- Yalnızca Codex özellikli modeller için etkinleşir (`openai-codex/*` veya `api: "openai-codex-responses"` kullanan sağlayıcılar)
- Yönetilen `web_search`, Codex olmayan modellere uygulanmaya devam eder
- `mode: "cached"` varsayılan ve önerilen ayardır
- `tools.web.search.enabled: false`, hem yönetilen hem de yerel aramayı devre dışı bırakır

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

Yerel Codex araması etkinse ancak geçerli model Codex özellikli değilse, OpenClaw normal yönetilen `web_search` davranışını korur.

## Ağ güvenliği

Yönetilen `web_search` sağlayıcı çağrıları OpenClaw'ın korumalı fetch yolunu kullanır. Güvenilen
sağlayıcı API ana makineleri için OpenClaw, Surge, Clash ve sing-box fake-IP
DNS yanıtlarına `198.18.0.0/15` ve `fc00::/7` içinde yalnızca o sağlayıcı ana makine adı için izin verir.
Diğer özel, loopback, link-local ve metadata hedefleri engelli kalır.

Bu otomatik izin, rastgele `web_fetch` URL'leri için geçerli değildir. `web_fetch` için
`tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` ve
`tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange` seçeneklerini yalnızca güvenilen
proxy'niz bu sentetik aralıklara sahipse açıkça etkinleştirin.

## Web aramasını ayarlama

Belgelerdeki ve kurulum akışlarındaki sağlayıcı listeleri alfabetiktir. Otomatik algılama
ayrı bir öncelik sırası tutar.

Hiçbir `provider` ayarlanmamışsa, OpenClaw sağlayıcıları bu sırayla denetler ve
hazır olan ilkini kullanır:

Önce API destekli sağlayıcılar:

1. **Brave** -- `BRAVE_API_KEY` veya `plugins.entries.brave.config.webSearch.apiKey` (sıra 10)
2. **MiniMax Search** -- `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` / `MINIMAX_OAUTH_TOKEN` / `MINIMAX_API_KEY` veya `plugins.entries.minimax.config.webSearch.apiKey` (sıra 15)
3. **Gemini** -- `plugins.entries.google.config.webSearch.apiKey`, `GEMINI_API_KEY` veya `models.providers.google.apiKey` (sıra 20)
4. **Grok** -- `XAI_API_KEY` veya `plugins.entries.xai.config.webSearch.apiKey` (sıra 30)
5. **Kimi** -- `KIMI_API_KEY` / `MOONSHOT_API_KEY` veya `plugins.entries.moonshot.config.webSearch.apiKey` (sıra 40)
6. **Perplexity** -- `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY` veya `plugins.entries.perplexity.config.webSearch.apiKey` (sıra 50)
7. **Firecrawl** -- `FIRECRAWL_API_KEY` veya `plugins.entries.firecrawl.config.webSearch.apiKey` (sıra 60)
8. **Exa** -- `EXA_API_KEY` veya `plugins.entries.exa.config.webSearch.apiKey`; isteğe bağlı `plugins.entries.exa.config.webSearch.baseUrl`, Exa uç noktasını geçersiz kılar (sıra 65)
9. **Tavily** -- `TAVILY_API_KEY` veya `plugins.entries.tavily.config.webSearch.apiKey` (sıra 70)

Bundan sonra anahtarsız yedekler:

10. **DuckDuckGo** -- hesap veya API anahtarı gerektirmeyen anahtarsız HTML yedeği (sıra 100)
11. **Ollama Web Search** -- erişilebilir olduğunda ve `ollama signin` ile oturum açıldığında yapılandırılmış yerel Ollama ana makineniz üzerinden anahtarsız yedek; ana makine gerektiriyorsa Ollama sağlayıcı bearer auth bilgisini yeniden kullanabilir ve `OLLAMA_API_KEY` ile yapılandırıldığında doğrudan `https://ollama.com` araması çağırabilir (sıra 110)
12. **SearXNG** -- `SEARXNG_BASE_URL` veya `plugins.entries.searxng.config.webSearch.baseUrl` (sıra 200)

Hiçbir sağlayıcı algılanmazsa Brave'e geri döner (birini yapılandırmanızı isteyen
eksik anahtar hatası alırsınız).

<Note>
  Tüm sağlayıcı anahtar alanları SecretRef nesnelerini destekler. Plugin kapsamlı SecretRef'ler
  `plugins.entries.<plugin>.config.webSearch.apiKey` altında, Brave, Exa, Firecrawl,
  Gemini, Grok, Kimi, MiniMax, Perplexity ve Tavily dahil olmak üzere paketlenen
  API destekli web arama sağlayıcıları için çözümlenir; sağlayıcı ister
  `tools.web.search.provider` üzerinden açıkça seçilmiş olsun ister otomatik algılama yoluyla
  seçilmiş olsun. Otomatik algılama modunda OpenClaw yalnızca
  seçilen sağlayıcı anahtarını çözümler; seçilmeyen SecretRef'ler pasif kalır, böylece
  kullanmadıklarınız için çözümleme maliyeti ödemeden birden fazla sağlayıcıyı
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
`plugins.entries.<plugin>.config.webSearch.*` altında bulunur. Gemini ayrıca
özel web arama yapılandırmasından ve `GEMINI_API_KEY` değerinden sonra daha düşük öncelikli
geri dönüşler olarak `models.providers.google.apiKey` ve `models.providers.google.baseUrl`
değerlerini yeniden kullanabilir. Örnekler için sağlayıcı sayfalarına bakın.

`tools.web.search.provider`, paketlenmiş ve yüklü Plugin manifestleri tarafından
bildirilen web arama sağlayıcı kimliklerine göre doğrulanır. `"brvae"` gibi bir yazım hatası,
sessizce otomatik algılamaya geri dönmek yerine yapılandırma doğrulamasının başarısız olmasına
neden olur. Yapılandırılmış bir sağlayıcıda yalnızca eski Plugin kanıtı varsa, örneğin
üçüncü taraf bir Plugin kaldırıldıktan sonra kalan bir `plugins.entries.<plugin>` bloğu gibi,
OpenClaw başlangıcı dayanıklı tutar ve Plugin'i yeniden yükleyebilmeniz veya eski yapılandırmayı
temizlemek için `openclaw doctor --fix` çalıştırabilmeniz için bir uyarı bildirir.

`web_fetch` geri dönüş sağlayıcısı seçimi ayrıdır:

- `tools.web.fetch.provider` ile seçin
- veya bu alanı atlayın ve OpenClaw'ın kullanılabilir kimlik bilgilerinden ilk hazır web getirme
  sağlayıcısını otomatik algılamasına izin verin
- sanal alanda olmayan `web_fetch`, `contracts.webFetchProviders` bildiren yüklü Plugin sağlayıcılarını
  kullanabilir; sanal alandaki getirmeler yalnızca paketlenmiş olanlarla sınırlı kalır
- bugün paketlenmiş web getirme sağlayıcısı Firecrawl'dır ve
  `plugins.entries.firecrawl.config.webFetch.*` altında yapılandırılır

`openclaw onboard` veya `openclaw configure --section web` sırasında **Kimi** seçtiğinizde,
OpenClaw ayrıca şunları da sorabilir:

- Moonshot API bölgesi (`https://api.moonshot.ai/v1` veya `https://api.moonshot.cn/v1`)
- varsayılan Kimi web arama modeli (varsayılan `kimi-k2.6`)

`x_search` için `plugins.entries.xai.config.xSearch.*` yapılandırın. Grok web aramasıyla
aynı `XAI_API_KEY` geri dönüşünü kullanır.
Eski `tools.web.x_search.*` yapılandırması `openclaw doctor --fix` tarafından otomatik olarak taşınır.
`openclaw onboard` veya `openclaw configure --section web` sırasında Grok seçtiğinizde,
OpenClaw aynı anahtarla isteğe bağlı `x_search` kurulumunu da sunabilir.
Bu, Grok yolu içinde ayrı bir takip adımıdır; ayrı bir üst düzey web arama sağlayıcısı seçimi değildir.
Başka bir sağlayıcı seçerseniz OpenClaw `x_search` istemini göstermez.

### API anahtarlarını saklama

<Tabs>
  <Tab title="Yapılandırma dosyası">
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
  <Tab title="Ortam değişkeni">
    Sağlayıcı ortam değişkenini Gateway işlem ortamında ayarlayın:

    ```bash
    export BRAVE_API_KEY="YOUR_KEY"
    ```

    Bir Gateway kurulumu için bunu `~/.openclaw/.env` dosyasına koyun.
    Bkz. [Ortam değişkenleri](/tr/help/faq#env-vars-and-env-loading).

  </Tab>
</Tabs>

## Araç parametreleri

| Parametre             | Açıklama                                                   |
| --------------------- | ---------------------------------------------------------- |
| `query`               | Arama sorgusu (gerekli)                                    |
| `count`               | Döndürülecek sonuçlar (1-10, varsayılan: 5)                |
| `country`             | 2 harfli ISO ülke kodu (örn. "US", "DE")                   |
| `language`            | ISO 639-1 dil kodu (örn. "en", "de")                       |
| `search_lang`         | Arama dili kodu (yalnızca Brave)                           |
| `freshness`           | Zaman filtresi: `day`, `week`, `month` veya `year`         |
| `date_after`          | Bu tarihten sonraki sonuçlar (YYYY-MM-DD)                  |
| `date_before`         | Bu tarihten önceki sonuçlar (YYYY-MM-DD)                   |
| `ui_lang`             | UI dil kodu (yalnızca Brave)                               |
| `domain_filter`       | Etki alanı izin listesi/engelleme listesi dizisi (yalnızca Perplexity) |
| `max_tokens`          | Toplam içerik bütçesi, varsayılan 25000 (yalnızca Perplexity) |
| `max_tokens_per_page` | Sayfa başına token sınırı, varsayılan 2048 (yalnızca Perplexity) |

<Warning>
  Tüm parametreler tüm sağlayıcılarla çalışmaz. Brave `llm-context` modu
  `ui_lang` değerini reddeder; `date_before` ayrıca `date_after` gerektirir çünkü Brave özel
  güncellik aralıkları hem başlangıç hem de bitiş tarihlerini gerektirir.
  Gemini, Grok ve Kimi alıntılarla birlikte tek bir sentezlenmiş yanıt döndürür. Paylaşılan araç
  uyumluluğu için `count` kabul ederler, ancak bu temellendirilmiş yanıt biçimini değiştirmez.
  Gemini, bunları Google Search temellendirme zaman aralıklarına dönüştürerek `freshness`,
  `date_after` ve `date_before` destekler.
  Perplexity, Sonar/OpenRouter uyumluluk yolunu kullandığınızda aynı şekilde davranır
  (`plugins.entries.perplexity.config.webSearch.baseUrl` /
  `model` veya `OPENROUTER_API_KEY`).
  SearXNG yalnızca güvenilir özel ağ veya loopback ana makineleri için `http://` kabul eder;
  herkese açık SearXNG uç noktaları `https://` kullanmalıdır.
  Firecrawl ve Tavily, `web_search` üzerinden yalnızca `query` ve `count` destekler
  -- gelişmiş seçenekler için kendi özel araçlarını kullanın.
</Warning>

## x_search

`x_search`, xAI kullanarak X (eski adıyla Twitter) gönderilerini sorgular ve
alıntılarla birlikte AI tarafından sentezlenmiş yanıtlar döndürür. Doğal dil sorgularını ve
isteğe bağlı yapılandırılmış filtreleri kabul eder. OpenClaw, yerleşik xAI `x_search`
aracını yalnızca bu araç çağrısına hizmet eden istekte etkinleştirir.

<Note>
  xAI, `x_search` aracının anahtar sözcük aramasını, anlamsal aramayı, kullanıcı
  aramasını ve ileti dizisi getirmeyi desteklediğini belgeler. Yeniden gönderiler,
  yanıtlar, yer işaretleri veya görüntülenmeler gibi gönderi başına etkileşim istatistikleri için
  tam gönderi URL'si veya durum kimliği için hedefli bir aramayı tercih edin.
  Geniş anahtar sözcük aramaları doğru gönderiyi bulabilir ancak gönderi başına daha az
  eksiksiz meta veri döndürebilir. İyi bir kalıp şudur: önce gönderiyi bulun, sonra
  tam o gönderiye odaklanan ikinci bir `x_search` sorgusu çalıştırın.
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
`<baseUrl>/responses` adresine gönderi yapar. Bu alan atlanırsa,
`plugins.entries.xai.config.webSearch.baseUrl` değerine, ardından eski
`tools.web.search.grok.baseUrl` değerine ve son olarak herkese açık xAI uç noktasına geri döner.

### x_search parametreleri

| Parametre                    | Açıklama                                                 |
| ---------------------------- | -------------------------------------------------------- |
| `query`                      | Arama sorgusu (gerekli)                                  |
| `allowed_x_handles`          | Sonuçları belirli X kullanıcı adlarıyla sınırlandır      |
| `excluded_x_handles`         | Belirli X kullanıcı adlarını hariç tut                   |
| `from_date`                  | Yalnızca bu tarihte veya sonrasında olan gönderileri dahil et (YYYY-MM-DD) |
| `to_date`                    | Yalnızca bu tarihte veya öncesinde olan gönderileri dahil et (YYYY-MM-DD) |
| `enable_image_understanding` | xAI'ın eşleşen gönderilere ekli görselleri incelemesine izin ver |
| `enable_video_understanding` | xAI'ın eşleşen gönderilere ekli videoları incelemesine izin ver |

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

Araç profilleri veya izin listeleri kullanıyorsanız `web_search`, `x_search` veya `group:web` ekleyin:

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
- [Ollama Web Search](/tr/tools/ollama-search) -- Ollama ana makineniz üzerinden anahtarsız web araması
