---
read_when:
    - '`web_search` özelliğini etkinleştirmek veya yapılandırmak istiyorsunuz'
    - '`x_search` özelliğini etkinleştirmek veya yapılandırmak istiyorsunuz'
    - Bir arama sağlayıcısı seçmeniz gerekiyor
    - Otomatik algılama ve sağlayıcı geri dönüşünü anlamak istiyorsunuz
sidebarTitle: Web Search
summary: '`web_search`, `x_search` ve `web_fetch` -- web''de arama yapın, X gönderilerinde arama yapın veya sayfa içeriğini getirin'
title: Web Arama
x-i18n:
    generated_at: "2026-04-22T04:28:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: ec2517d660465f850b1cfdd255fbf512dc5c828b1ef22e3b24cec6aab097ebd5
    source_path: tools/web.md
    workflow: 15
---

# Web Arama

`web_search` aracı, yapılandırılmış sağlayıcınızı kullanarak web'de arama yapar
ve sonuçları döndürür. Sonuçlar sorguya göre 15 dakika boyunca önbelleğe alınır (yapılandırılabilir).

OpenClaw ayrıca X (eski adıyla Twitter) gönderileri için `x_search` ve
hafif URL getirme için `web_fetch` içerir. Bu aşamada `web_fetch` yerel kalırken
`web_search` ve `x_search` perde arkasında xAI Responses kullanabilir.

<Info>
  `web_search`, tarayıcı otomasyonu değil, hafif bir HTTP aracıdır. JS ağırlıklı
  siteler veya oturum açma işlemleri için [Web Browser](/tr/tools/browser) kullanın. Belirli bir URL'yi
  getirmek için [Web Fetch](/tr/tools/web-fetch) kullanın.
</Info>

## Hızlı başlangıç

<Steps>
  <Step title="Bir sağlayıcı seçin">
    Bir sağlayıcı seçin ve gerekli kurulumları tamamlayın. Bazı sağlayıcılar
    anahtarsızdır, bazıları ise API anahtarları kullanır. Ayrıntılar için
    aşağıdaki sağlayıcı sayfalarına bakın.
  </Step>
  <Step title="Yapılandırın">
    ```bash
    openclaw configure --section web
    ```
    Bu, sağlayıcıyı ve gereken kimlik bilgisini saklar. API destekli
    sağlayıcılar için bir ortam değişkeni de ayarlayabilir (örneğin `BRAVE_API_KEY`) ve bu adımı atlayabilirsiniz.
  </Step>
  <Step title="Kullanın">
    Artık aracı `web_search` çağırabilir:

    ```javascript
    await web_search({ query: "OpenClaw plugin SDK" });
    ```

    X gönderileri için şunu kullanın:

    ```javascript
    await x_search({ query: "dinner recipes" });
    ```

  </Step>
</Steps>

## Bir sağlayıcı seçme

<CardGroup cols={2}>
  <Card title="Brave Search" icon="shield" href="/tr/tools/brave-search">
    Parçacıklarla yapılandırılmış sonuçlar. `llm-context` modu, ülke/dil filtrelerini destekler. Ücretsiz katman mevcuttur.
  </Card>
  <Card title="DuckDuckGo" icon="bird" href="/tr/tools/duckduckgo-search">
    Anahtarsız geri dönüş. API anahtarı gerekmez. Resmi olmayan HTML tabanlı entegrasyon.
  </Card>
  <Card title="Exa" icon="brain" href="/tr/tools/exa-search">
    İçerik ayıklama ile nöral + anahtar sözcük araması (öne çıkanlar, metin, özetler).
  </Card>
  <Card title="Firecrawl" icon="flame" href="/tr/tools/firecrawl">
    Yapılandırılmış sonuçlar. Derin ayıklama için en iyi şekilde `firecrawl_search` ve `firecrawl_scrape` ile eşleşir.
  </Card>
  <Card title="Gemini" icon="sparkles" href="/tr/tools/gemini-search">
    Google Search grounding aracılığıyla alıntılar içeren AI sentezli yanıtlar.
  </Card>
  <Card title="Grok" icon="zap" href="/tr/tools/grok-search">
    xAI web grounding aracılığıyla alıntılar içeren AI sentezli yanıtlar.
  </Card>
  <Card title="Kimi" icon="moon" href="/tr/tools/kimi-search">
    Moonshot web araması aracılığıyla alıntılar içeren AI sentezli yanıtlar.
  </Card>
  <Card title="MiniMax Search" icon="globe" href="/tr/tools/minimax-search">
    MiniMax Coding Plan arama API'si aracılığıyla yapılandırılmış sonuçlar.
  </Card>
  <Card title="Ollama Web Search" icon="globe" href="/tr/tools/ollama-search">
    Yapılandırılmış Ollama ana makineniz aracılığıyla anahtarsız arama. `ollama signin` gerektirir.
  </Card>
  <Card title="Perplexity" icon="search" href="/tr/tools/perplexity-search">
    İçerik ayıklama denetimleri ve alan filtreleme ile yapılandırılmış sonuçlar.
  </Card>
  <Card title="SearXNG" icon="server" href="/tr/tools/searxng-search">
    Kendi kendine barındırılan meta arama. API anahtarı gerekmez. Google, Bing, DuckDuckGo ve daha fazlasını toplar.
  </Card>
  <Card title="Tavily" icon="globe" href="/tr/tools/tavily">
    Arama derinliği, konu filtreleme ve URL ayıklama için `tavily_extract` ile yapılandırılmış sonuçlar.
  </Card>
</CardGroup>

### Sağlayıcı karşılaştırması

| Sağlayıcı                                 | Sonuç tarzı                 | Filtreler                                         | API anahtarı                                                                     |
| ----------------------------------------- | --------------------------- | ------------------------------------------------- | -------------------------------------------------------------------------------- |
| [Brave](/tr/tools/brave-search)              | Yapılandırılmış parçacıklar | Ülke, dil, zaman, `llm-context` modu              | `BRAVE_API_KEY`                                                                  |
| [DuckDuckGo](/tr/tools/duckduckgo-search)    | Yapılandırılmış parçacıklar | --                                                | Yok (anahtarsız)                                                                 |
| [Exa](/tr/tools/exa-search)                  | Yapılandırılmış + ayıklanmış | Nöral/anahtar sözcük modu, tarih, içerik ayıklama | `EXA_API_KEY`                                                                    |
| [Firecrawl](/tr/tools/firecrawl)             | Yapılandırılmış parçacıklar | `firecrawl_search` aracı aracılığıyla             | `FIRECRAWL_API_KEY`                                                              |
| [Gemini](/tr/tools/gemini-search)            | AI sentezli + alıntılar     | --                                                | `GEMINI_API_KEY`                                                                 |
| [Grok](/tr/tools/grok-search)                | AI sentezli + alıntılar     | --                                                | `XAI_API_KEY`                                                                    |
| [Kimi](/tr/tools/kimi-search)                | AI sentezli + alıntılar     | --                                                | `KIMI_API_KEY` / `MOONSHOT_API_KEY`                                              |
| [MiniMax Search](/tr/tools/minimax-search)   | Yapılandırılmış parçacıklar | Bölge (`global` / `cn`)                           | `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY`                               |
| [Ollama Web Search](/tr/tools/ollama-search) | Yapılandırılmış parçacıklar | --                                                | Varsayılan olarak yok; `ollama signin` gerekir, gerekirse Ollama sağlayıcısı bearer kimlik doğrulamasını yeniden kullanabilir |
| [Perplexity](/tr/tools/perplexity-search)    | Yapılandırılmış parçacıklar | Ülke, dil, zaman, alanlar, içerik sınırları       | `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY`                                      |
| [SearXNG](/tr/tools/searxng-search)          | Yapılandırılmış parçacıklar | Kategoriler, dil                                  | Yok (kendi kendine barındırılır)                                                 |
| [Tavily](/tr/tools/tavily)                   | Yapılandırılmış parçacıklar | `tavily_search` aracı aracılığıyla                | `TAVILY_API_KEY`                                                                 |

## Otomatik algılama

## Yerel Codex web araması

Codex yetenekli modeller, OpenClaw'un yönetilen `web_search` işlevi yerine isteğe bağlı olarak sağlayıcının yerel Responses `web_search` aracını kullanabilir.

- Bunu `tools.web.search.openaiCodex` altında yapılandırın
- Yalnızca Codex yetenekli modeller için etkinleşir (`openai-codex/*` veya `api: "openai-codex-responses"` kullanan sağlayıcılar)
- Yönetilen `web_search`, Codex olmayan modeller için yine geçerlidir
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

Yerel Codex araması etkinse ancak geçerli model Codex yetenekli değilse OpenClaw normal yönetilen `web_search` davranışını korur.

## Web aramayı ayarlama

Belgelerdeki ve kurulum akışlarındaki sağlayıcı listeleri alfabetiktir. Otomatik algılama
ayrı bir öncelik sırası korur.

`provider` ayarlı değilse OpenClaw sağlayıcıları şu sırayla denetler ve hazır olan
ilkini kullanır:

Önce API destekli sağlayıcılar:

1. **Brave** -- `BRAVE_API_KEY` veya `plugins.entries.brave.config.webSearch.apiKey` (sıra 10)
2. **MiniMax Search** -- `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` veya `plugins.entries.minimax.config.webSearch.apiKey` (sıra 15)
3. **Gemini** -- `GEMINI_API_KEY` veya `plugins.entries.google.config.webSearch.apiKey` (sıra 20)
4. **Grok** -- `XAI_API_KEY` veya `plugins.entries.xai.config.webSearch.apiKey` (sıra 30)
5. **Kimi** -- `KIMI_API_KEY` / `MOONSHOT_API_KEY` veya `plugins.entries.moonshot.config.webSearch.apiKey` (sıra 40)
6. **Perplexity** -- `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY` veya `plugins.entries.perplexity.config.webSearch.apiKey` (sıra 50)
7. **Firecrawl** -- `FIRECRAWL_API_KEY` veya `plugins.entries.firecrawl.config.webSearch.apiKey` (sıra 60)
8. **Exa** -- `EXA_API_KEY` veya `plugins.entries.exa.config.webSearch.apiKey` (sıra 65)
9. **Tavily** -- `TAVILY_API_KEY` veya `plugins.entries.tavily.config.webSearch.apiKey` (sıra 70)

Ardından anahtarsız geri dönüşler:

10. **DuckDuckGo** -- hesap veya API anahtarı gerektirmeyen anahtarsız HTML geri dönüşü (sıra 100)
11. **Ollama Web Search** -- yapılandırılmış Ollama ana makineniz üzerinden anahtarsız geri dönüş; Ollama'nın erişilebilir olmasını ve `ollama signin` ile oturum açılmış olmasını gerektirir ve gerekirse Ollama sağlayıcısı bearer kimlik doğrulamasını yeniden kullanabilir (sıra 110)
12. **SearXNG** -- `SEARXNG_BASE_URL` veya `plugins.entries.searxng.config.webSearch.baseUrl` (sıra 200)

Hiçbir sağlayıcı algılanmazsa Brave'e geri döner (birini yapılandırmanızı isteyen
eksik anahtar hatası alırsınız).

<Note>
  Tüm sağlayıcı anahtar alanları SecretRef nesnelerini destekler. Paketlenmiş Exa, Firecrawl, Gemini, Grok, Kimi, Perplexity ve Tavily sağlayıcıları için
  `plugins.entries.<plugin>.config.webSearch.apiKey` altındaki plugin kapsamlı SecretRef'ler,
  sağlayıcı `tools.web.search.provider` aracılığıyla açıkça seçilsin
  veya otomatik algılama yoluyla seçilsin fark etmeksizin çözülür.
  Otomatik algılama modunda OpenClaw yalnızca seçilen sağlayıcı anahtarını çözer -- seçilmeyen SecretRef'ler etkin kalmaz; böylece
  kullanmadığınız sağlayıcılar için çözümleme maliyeti ödemeden birden çok sağlayıcıyı yapılandırılmış tutabilirsiniz.
</Note>

## Yapılandırma

```json5
{
  tools: {
    web: {
      search: {
        enabled: true, // varsayılan: true
        provider: "brave", // veya otomatik algılama için atlayın
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
    },
  },
}
```

Sağlayıcıya özgü yapılandırma (API anahtarları, temel URL'ler, modlar)
`plugins.entries.<plugin>.config.webSearch.*` altında bulunur. Örnekler için
sağlayıcı sayfalarına bakın.

`web_fetch` geri dönüş sağlayıcısı seçimi ayrıdır:

- bunu `tools.web.fetch.provider` ile seçin
- veya bu alanı atlayın ve OpenClaw'un kullanılabilir kimlik bilgilerinden
  hazır ilk web-fetch sağlayıcısını otomatik algılamasına izin verin
- bugün paketlenmiş web-fetch sağlayıcısı, şu konumda yapılandırılan Firecrawl'dur:
  `plugins.entries.firecrawl.config.webFetch.*`

`openclaw onboard` veya
`openclaw configure --section web` sırasında **Kimi** seçtiğinizde OpenClaw ayrıca şunları da sorabilir:

- Moonshot API bölgesi (`https://api.moonshot.ai/v1` veya `https://api.moonshot.cn/v1`)
- varsayılan Kimi web arama modeli (`kimi-k2.6` varsayılanıdır)

`x_search` için `plugins.entries.xai.config.xSearch.*` yapılandırın. Bu,
Grok web aramasıyla aynı `XAI_API_KEY` geri dönüşünü kullanır.
Eski `tools.web.x_search.*` yapılandırması, `openclaw doctor --fix` tarafından otomatik olarak taşınır.
`openclaw onboard` veya `openclaw configure --section web` sırasında Grok seçtiğinizde,
OpenClaw aynı anahtarla isteğe bağlı `x_search` kurulumunu da sunabilir.
Bu, Grok yolunun içindeki ayrı bir takip adımıdır; ayrı bir üst düzey
web arama sağlayıcısı seçimi değildir. Başka bir sağlayıcı seçerseniz OpenClaw
`x_search` istemini göstermez.

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
    Sağlayıcı ortam değişkenini Gateway süreç ortamında ayarlayın:

    ```bash
    export BRAVE_API_KEY="YOUR_KEY"
    ```

    Bir gateway kurulumu için bunu `~/.openclaw/.env` içine koyun.
    Bkz. [Env vars](/tr/help/faq#env-vars-and-env-loading).

  </Tab>
</Tabs>

## Araç parametreleri

| Parametre             | Açıklama                                              |
| --------------------- | ----------------------------------------------------- |
| `query`               | Arama sorgusu (zorunlu)                               |
| `count`               | Döndürülecek sonuçlar (1-10, varsayılan: 5)           |
| `country`             | 2 harfli ISO ülke kodu (örn. `"US"`, `"DE"`)          |
| `language`            | ISO 639-1 dil kodu (örn. `"en"`, `"de"`)              |
| `search_lang`         | Arama dili kodu (yalnızca Brave)                      |
| `freshness`           | Zaman filtresi: `day`, `week`, `month` veya `year`    |
| `date_after`          | Bu tarihten sonraki sonuçlar (YYYY-MM-DD)             |
| `date_before`         | Bu tarihten önceki sonuçlar (YYYY-MM-DD)              |
| `ui_lang`             | Kullanıcı arayüzü dil kodu (yalnızca Brave)           |
| `domain_filter`       | Alan izin listesi/engelleme listesi dizisi (yalnızca Perplexity) |
| `max_tokens`          | Toplam içerik bütçesi, varsayılan 25000 (yalnızca Perplexity) |
| `max_tokens_per_page` | Sayfa başına belirteç sınırı, varsayılan 2048 (yalnızca Perplexity) |

<Warning>
  Tüm parametreler tüm sağlayıcılarda çalışmaz. Brave `llm-context` modu
  `ui_lang`, `freshness`, `date_after` ve `date_before` değerlerini reddeder.
  Gemini, Grok ve Kimi, alıntılarla birlikte tek bir sentezlenmiş yanıt döndürür. Bunlar,
  paylaşılan araç uyumluluğu için `count` kabul eder, ancak bu
  grounded yanıt biçimini değiştirmez.
  Perplexity, Sonar/OpenRouter
  uyumluluk yolunu kullandığınızda (`plugins.entries.perplexity.config.webSearch.baseUrl` /
  `model` veya `OPENROUTER_API_KEY`) aynı şekilde davranır.
  SearXNG, `http://` değerini yalnızca güvenilir özel ağ veya loopback ana makineleri için kabul eder;
  genel SearXNG uç noktaları `https://` kullanmalıdır.
  Firecrawl ve Tavily, `web_search` üzerinden yalnızca `query` ve `count` destekler
  -- gelişmiş seçenekler için bunların özel araçlarını kullanın.
</Warning>

## x_search

`x_search`, xAI kullanarak X (eski adıyla Twitter) gönderilerini sorgular ve
alıntılarla birlikte AI sentezli yanıtlar döndürür. Doğal dil sorgularını ve
isteğe bağlı yapılandırılmış filtreleri kabul eder. OpenClaw, yerleşik xAI `x_search`
aracını yalnızca bu araç çağrısını karşılayan istekte etkinleştirir.

<Note>
  xAI, `x_search` aracını anahtar sözcük araması, anlamsal arama, kullanıcı
  araması ve konu getirme destekliyor olarak belgelendirir. Yeniden paylaşım,
  yanıt, yer işareti veya görüntülenme gibi gönderi başına etkileşim istatistikleri için
  tam gönderi URL'si veya durum kimliği için hedefli bir aramayı tercih edin.
  Geniş anahtar sözcük aramaları doğru gönderiyi bulabilir ancak gönderi başına daha eksik
  meta veri döndürebilir. İyi bir örüntü şudur: önce gönderiyi bulun, sonra
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
            inlineCitations: false,
            maxTurns: 2,
            timeoutSeconds: 30,
            cacheTtlMinutes: 15,
          },
          webSearch: {
            apiKey: "xai-...", // XAI_API_KEY ayarlıysa isteğe bağlı
          },
        },
      },
    },
  },
}
```

### x_search parametreleri

| Parametre                   | Açıklama                                               |
| --------------------------- | ------------------------------------------------------ |
| `query`                     | Arama sorgusu (zorunlu)                                |
| `allowed_x_handles`         | Sonuçları belirli X handle'larıyla sınırla             |
| `excluded_x_handles`        | Belirli X handle'larını hariç tut                      |
| `from_date`                 | Yalnızca bu tarihte veya sonrasında olan gönderileri dahil et (YYYY-MM-DD) |
| `to_date`                   | Yalnızca bu tarihte veya öncesinde olan gönderileri dahil et (YYYY-MM-DD) |
| `enable_image_understanding` | xAI'nin eşleşen gönderilere eklenen görselleri incelemesine izin ver |
| `enable_video_understanding` | xAI'nin eşleşen gönderilere eklenen videoları incelemesine izin ver |

### x_search örneği

```javascript
await x_search({
  query: "dinner recipes",
  allowed_x_handles: ["nytfood"],
  from_date: "2026-03-01",
});
```

```javascript
// Gönderi başına istatistikler: mümkün olduğunda tam durum URL'sini veya durum kimliğini kullanın
await x_search({
  query: "https://x.com/huntharo/status/1905678901234567890",
});
```

## Örnekler

```javascript
// Temel arama
await web_search({ query: "OpenClaw plugin SDK" });

// Almanya'ya özgü arama
await web_search({ query: "TV online schauen", country: "DE", language: "de" });

// Son sonuçlar (geçen hafta)
await web_search({ query: "AI developments", freshness: "week" });

// Tarih aralığı
await web_search({
  query: "climate research",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});

// Alan filtreleme (yalnızca Perplexity)
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
    // veya: allow: ["group:web"]  (`web_search`, `x_search` ve `web_fetch` içerir)
  },
}
```

## İlgili

- [Web Fetch](/tr/tools/web-fetch) -- bir URL getir ve okunabilir içeriği ayıkla
- [Web Browser](/tr/tools/browser) -- JS ağırlıklı siteler için tam tarayıcı otomasyonu
- [Grok Search](/tr/tools/grok-search) -- `web_search` sağlayıcısı olarak Grok
- [Ollama Web Search](/tr/tools/ollama-search) -- Ollama ana makineniz üzerinden anahtarsız web araması
