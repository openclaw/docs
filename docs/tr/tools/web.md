---
read_when:
    - web_search özelliğini etkinleştirmek veya yapılandırmak istiyorsunuz
    - x_search özelliğini etkinleştirmek veya yapılandırmak istiyorsunuz
    - Bir arama sağlayıcısı seçmeniz gerekiyor
    - Otomatik algılamayı ve sağlayıcı geri dönüşünü anlamak istiyorsunuz
sidebarTitle: Web Search
summary: web_search, x_search ve web_fetch -- web'de arama yapın, X gönderilerinde arama yapın veya sayfa içeriğini getirin
title: Web Search
x-i18n:
    generated_at: "2026-04-05T14:14:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: b8b9a5d641dcdcbe7c099c8862898f12646f43151b6c4152d69c26af9b17e0fa
    source_path: tools/web.md
    workflow: 15
---

# Web Search

`web_search` aracı, yapılandırılmış sağlayıcınızı kullanarak web'de arama yapar ve
sonuçları döndürür. Sonuçlar sorguya göre 15 dakika boyunca önbelleğe alınır (yapılandırılabilir).

OpenClaw ayrıca X (eski adıyla Twitter) gönderileri için `x_search` ve
hafif URL getirme için `web_fetch` içerir. Bu aşamada `web_fetch` yerel kalırken
`web_search` ve `x_search` arka planda xAI Responses kullanabilir.

<Info>
  `web_search`, tarayıcı otomasyonu değil, hafif bir HTTP aracıdır. JS ağırlıklı
  siteler veya giriş gerektiren durumlar için [Web Browser](/tools/browser) kullanın. Belirli
  bir URL'yi getirmek için [Web Fetch](/tools/web-fetch) kullanın.
</Info>

## Hızlı başlangıç

<Steps>
  <Step title="Bir sağlayıcı seçin">
    Bir sağlayıcı seçin ve gerekli kurulumları tamamlayın. Bazı sağlayıcılar
    anahtarsızdır, bazıları ise API anahtarları kullanır. Ayrıntılar için aşağıdaki
    sağlayıcı sayfalarına bakın.
  </Step>
  <Step title="Yapılandırın">
    ```bash
    openclaw configure --section web
    ```
    Bu, sağlayıcıyı ve gereken kimlik bilgisini saklar. Ayrıca bir env
    değişkeni de ayarlayabilirsiniz (örneğin `BRAVE_API_KEY`) ve API destekli
    sağlayıcılar için bu adımı atlayabilirsiniz.
  </Step>
  <Step title="Kullanın">
    Ajan artık `web_search` çağırabilir:

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
    Özet parçacıkları içeren yapılandırılmış sonuçlar. `llm-context` modu ile ülke/dil filtrelerini destekler. Ücretsiz katman mevcuttur.
  </Card>
  <Card title="DuckDuckGo" icon="bird" href="/tr/tools/duckduckgo-search">
    Anahtarsız geri dönüş. API anahtarı gerekmez. Resmi olmayan HTML tabanlı entegrasyon.
  </Card>
  <Card title="Exa" icon="brain" href="/tr/tools/exa-search">
    İçerik çıkarma (öne çıkanlar, metin, özetler) ile nöral + anahtar kelime araması.
  </Card>
  <Card title="Firecrawl" icon="flame" href="/tr/tools/firecrawl">
    Yapılandırılmış sonuçlar. Derin çıkarma için `firecrawl_search` ve `firecrawl_scrape` ile en iyi şekilde eşleşir.
  </Card>
  <Card title="Gemini" icon="sparkles" href="/tr/tools/gemini-search">
    Google Search grounding üzerinden alıntılarla birlikte AI sentezli yanıtlar.
  </Card>
  <Card title="Grok" icon="zap" href="/tr/tools/grok-search">
    xAI web grounding üzerinden alıntılarla birlikte AI sentezli yanıtlar.
  </Card>
  <Card title="Kimi" icon="moon" href="/tr/tools/kimi-search">
    Moonshot web search üzerinden alıntılarla birlikte AI sentezli yanıtlar.
  </Card>
  <Card title="MiniMax Search" icon="globe" href="/tr/tools/minimax-search">
    MiniMax Coding Plan arama API'si üzerinden yapılandırılmış sonuçlar.
  </Card>
  <Card title="Ollama Web Search" icon="globe" href="/tools/ollama-search">
    Yapılandırılmış Ollama ana makineniz üzerinden anahtarsız arama. `ollama signin` gerektirir.
  </Card>
  <Card title="Perplexity" icon="search" href="/tools/perplexity-search">
    İçerik çıkarma denetimleri ve alan adı filtreleme ile yapılandırılmış sonuçlar.
  </Card>
  <Card title="SearXNG" icon="server" href="/tools/searxng-search">
    Kendi kendine barındırılan meta arama. API anahtarı gerekmez. Google, Bing, DuckDuckGo ve daha fazlasını toplar.
  </Card>
  <Card title="Tavily" icon="globe" href="/tools/tavily">
    Arama derinliği, konu filtreleme ve URL çıkarma için `tavily_extract` ile yapılandırılmış sonuçlar.
  </Card>
</CardGroup>

### Sağlayıcı karşılaştırması

| Sağlayıcı                                 | Sonuç biçimi               | Filtreler                                        | API anahtarı                                                                     |
| ----------------------------------------- | -------------------------- | ------------------------------------------------ | -------------------------------------------------------------------------------- |
| [Brave](/tr/tools/brave-search)              | Yapılandırılmış özetler    | Ülke, dil, zaman, `llm-context` modu             | `BRAVE_API_KEY`                                                                  |
| [DuckDuckGo](/tr/tools/duckduckgo-search)    | Yapılandırılmış özetler    | --                                               | Yok (anahtarsız)                                                                 |
| [Exa](/tr/tools/exa-search)                  | Yapılandırılmış + çıkarılmış | Nöral/anahtar kelime modu, tarih, içerik çıkarma | `EXA_API_KEY`                                                                    |
| [Firecrawl](/tr/tools/firecrawl)             | Yapılandırılmış özetler    | `firecrawl_search` aracı üzerinden               | `FIRECRAWL_API_KEY`                                                              |
| [Gemini](/tr/tools/gemini-search)            | AI sentezli + alıntılar    | --                                               | `GEMINI_API_KEY`                                                                 |
| [Grok](/tr/tools/grok-search)                | AI sentezli + alıntılar    | --                                               | `XAI_API_KEY`                                                                    |
| [Kimi](/tr/tools/kimi-search)                | AI sentezli + alıntılar    | --                                               | `KIMI_API_KEY` / `MOONSHOT_API_KEY`                                              |
| [MiniMax Search](/tr/tools/minimax-search)   | Yapılandırılmış özetler    | Bölge (`global` / `cn`)                          | `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY`                               |
| [Ollama Web Search](/tools/ollama-search) | Yapılandırılmış özetler    | --                                               | Varsayılan olarak yok; `ollama signin` gerekir, Ollama sağlayıcı bearer auth yeniden kullanılabilir |
| [Perplexity](/tools/perplexity-search)    | Yapılandırılmış özetler    | Ülke, dil, zaman, alan adları, içerik sınırları  | `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY`                                      |
| [SearXNG](/tools/searxng-search)          | Yapılandırılmış özetler    | Kategoriler, dil                                 | Yok (kendi kendine barındırılan)                                                 |
| [Tavily](/tools/tavily)                   | Yapılandırılmış özetler    | `tavily_search` aracı üzerinden                  | `TAVILY_API_KEY`                                                                 |

## Otomatik algılama

## Yerel Codex web search

Codex özellikli modeller, OpenClaw'ın yönettiği `web_search` işlevi yerine isteğe bağlı olarak sağlayıcının yerel Responses `web_search` aracını kullanabilir.

- Bunu `tools.web.search.openaiCodex` altında yapılandırın
- Yalnızca Codex özellikli modellerde etkinleşir (`openai-codex/*` veya `api: "openai-codex-responses"` kullanan sağlayıcılar)
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

Yerel Codex araması etkinse ancak mevcut model Codex özellikli değilse, OpenClaw normal yönetilen `web_search` davranışını korur.

## Web search kurma

Belgelerdeki ve kurulum akışlarındaki sağlayıcı listeleri alfabetiktir. Otomatik algılama ise
ayrı bir öncelik sırası kullanır.

Hiçbir `provider` ayarlanmamışsa, OpenClaw sağlayıcıları bu sırayla denetler ve
hazır olan ilkini kullanır:

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

Bundan sonra anahtarsız geri dönüşler:

10. **DuckDuckGo** -- hesap veya API anahtarı gerektirmeyen anahtarsız HTML geri dönüşü (sıra 100)
11. **Ollama Web Search** -- yapılandırılmış Ollama ana makineniz üzerinden anahtarsız geri dönüş; Ollama'nın erişilebilir olmasını ve `ollama signin` ile oturum açılmış olmasını gerektirir, ayrıca ana makine ihtiyaç duyuyorsa Ollama sağlayıcı bearer auth'u yeniden kullanabilir (sıra 110)
12. **SearXNG** -- `SEARXNG_BASE_URL` veya `plugins.entries.searxng.config.webSearch.baseUrl` (sıra 200)

Hiçbir sağlayıcı algılanmazsa, Brave'e geri döner (size bir anahtar yapılandırmanızı
isteyen eksik anahtar hatası gösterilir).

<Note>
  Tüm sağlayıcı anahtar alanları SecretRef nesnelerini destekler. Otomatik algılama modunda,
  OpenClaw yalnızca seçilen sağlayıcı anahtarını çözümler -- seçilmeyen SecretRef'ler
  etkin kalmaz.
</Note>

## Yapılandırma

```json5
{
  tools: {
    web: {
      search: {
        enabled: true, // varsayılan: true
        provider: "brave", // veya otomatik algılama için belirtmeyin
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
    },
  },
}
```

Sağlayıcıya özel yapılandırma (API anahtarları, base URL'ler, modlar)
`plugins.entries.<plugin>.config.webSearch.*` altında bulunur. Örnekler için
sağlayıcı sayfalarına bakın.

`web_fetch` geri dönüş sağlayıcısı seçimi ayrıdır:

- bunu `tools.web.fetch.provider` ile seçin
- veya bu alanı atlayın ve OpenClaw'ın mevcut kimlik bilgilerinden ilk hazır web-fetch
  sağlayıcısını otomatik algılamasına izin verin
- bugün paketlenmiş web-fetch sağlayıcısı Firecrawl'dur ve
  `plugins.entries.firecrawl.config.webFetch.*` altında yapılandırılır

`openclaw onboard` veya
`openclaw configure --section web` sırasında **Kimi** seçtiğinizde, OpenClaw ayrıca şunları sorabilir:

- Moonshot API bölgesi (`https://api.moonshot.ai/v1` veya `https://api.moonshot.cn/v1`)
- varsayılan Kimi web-search modeli (varsayılan: `kimi-k2.5`)

`x_search` için `plugins.entries.xai.config.xSearch.*` yapılandırın. Grok web search ile
aynı `XAI_API_KEY` geri dönüşünü kullanır.
Eski `tools.web.x_search.*` yapılandırması `openclaw doctor --fix` tarafından otomatik olarak taşınır.
`openclaw onboard` veya `openclaw configure --section web` sırasında Grok seçtiğinizde,
OpenClaw ayrıca aynı anahtarla isteğe bağlı `x_search` kurulumu da sunabilir.
Bu, Grok yolunun içindeki ayrı bir takip adımıdır; ayrı bir üst düzey
web-search sağlayıcısı seçimi değildir. Başka bir sağlayıcı seçerseniz, OpenClaw
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
    Sağlayıcı env değişkenini Gateway süreç ortamında ayarlayın:

    ```bash
    export BRAVE_API_KEY="YOUR_KEY"
    ```

    Bir gateway kurulumu için bunu `~/.openclaw/.env` içine koyun.
    Bkz. [Env vars](/help/faq#env-vars-and-env-loading).

  </Tab>
</Tabs>

## Araç parametreleri

| Parametre            | Açıklama                                              |
| -------------------- | ----------------------------------------------------- |
| `query`              | Arama sorgusu (zorunlu)                               |
| `count`              | Döndürülecek sonuç sayısı (1-10, varsayılan: 5)       |
| `country`            | 2 harfli ISO ülke kodu (ör. `"US"`, `"DE"`)           |
| `language`           | ISO 639-1 dil kodu (ör. `"en"`, `"de"`)               |
| `search_lang`        | Arama dili kodu (yalnızca Brave)                      |
| `freshness`          | Zaman filtresi: `day`, `week`, `month` veya `year`    |
| `date_after`         | Bu tarihten sonraki sonuçlar (YYYY-MM-DD)             |
| `date_before`        | Bu tarihten önceki sonuçlar (YYYY-MM-DD)              |
| `ui_lang`            | UI dili kodu (yalnızca Brave)                         |
| `domain_filter`      | Alan adı allowlist/denylist dizisi (yalnızca Perplexity) |
| `max_tokens`         | Toplam içerik bütçesi, varsayılan 25000 (yalnızca Perplexity) |
| `max_tokens_per_page`| Sayfa başına token sınırı, varsayılan 2048 (yalnızca Perplexity) |

<Warning>
  Tüm parametreler tüm sağlayıcılarda çalışmaz. Brave `llm-context` modu
  `ui_lang`, `freshness`, `date_after` ve `date_before` parametrelerini reddeder.
  Gemini, Grok ve Kimi alıntılarla birlikte tek bir sentezlenmiş yanıt döndürür. Bunlar
  paylaşılan araç uyumluluğu için `count` kabul eder, ancak grounded yanıt
  biçimini değiştirmez.
  Sonar/OpenRouter
  uyumluluk yolunu (`plugins.entries.perplexity.config.webSearch.baseUrl` /
  `model` veya `OPENROUTER_API_KEY`) kullandığınızda Perplexity de aynı şekilde davranır.
  SearXNG yalnızca güvenilir özel ağ veya loopback ana makineleri için `http://` kabul eder;
  genel SearXNG uç noktaları `https://` kullanmalıdır.
  Firecrawl ve Tavily, `web_search` üzerinden yalnızca `query` ve `count` destekler
  -- gelişmiş seçenekler için kendi özel araçlarını kullanın.
</Warning>

## x_search

`x_search`, xAI kullanarak X (eski adıyla Twitter) gönderilerinde sorgulama yapar ve
alıntılarla birlikte AI sentezli yanıtlar döndürür. Doğal dil sorgularını ve
isteğe bağlı yapılandırılmış filtreleri kabul eder. OpenClaw, yalnızca bu araç çağrısına hizmet eden istekte
yerleşik xAI `x_search` aracını etkinleştirir.

<Note>
  xAI, `x_search` aracının anahtar kelime araması, anlamsal arama, kullanıcı
  araması ve ileti dizisi getirmeyi desteklediğini belgeliyor. Yeniden gönderiler,
  yanıtlar, yer işaretleri veya görüntülemeler gibi gönderi başına etkileşim istatistikleri için,
  tam gönderi URL'si veya durum kimliği için hedeflenmiş bir sorgu tercih edin. Geniş
  anahtar kelime aramaları doğru gönderiyi bulabilir, ancak gönderi başına daha az
  eksiksiz meta veri döndürebilir. İyi bir desen şudur: önce gönderiyi bulun, sonra
  tam olarak o gönderiye odaklanan ikinci bir `x_search` sorgusu çalıştırın.
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
            apiKey: "xai-...", // XAI_API_KEY ayarlanmışsa isteğe bağlı
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
| `allowed_x_handles`         | Sonuçları belirli X kullanıcı adlarıyla sınırlandır    |
| `excluded_x_handles`        | Belirli X kullanıcı adlarını hariç tut                 |
| `from_date`                 | Yalnızca bu tarihte veya sonrasında olan gönderileri dahil et (YYYY-MM-DD) |
| `to_date`                   | Yalnızca bu tarihte veya öncesinde olan gönderileri dahil et (YYYY-MM-DD) |
| `enable_image_understanding`| xAI'nin eşleşen gönderilere ekli görselleri incelemesine izin ver |
| `enable_video_understanding`| xAI'nin eşleşen gönderilere ekli videoları incelemesine izin ver |

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

// Almanya'ya özel arama
await web_search({ query: "TV online schauen", country: "DE", language: "de" });

// Son sonuçlar (geçen hafta)
await web_search({ query: "AI developments", freshness: "week" });

// Tarih aralığı
await web_search({
  query: "climate research",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});

// Alan adı filtreleme (yalnızca Perplexity)
await web_search({
  query: "product reviews",
  domain_filter: ["-reddit.com", "-pinterest.com"],
});
```

## Araç profilleri

Araç profilleri veya allowlist kullanıyorsanız, `web_search`, `x_search` veya `group:web` ekleyin:

```json5
{
  tools: {
    allow: ["web_search", "x_search"],
    // veya: allow: ["group:web"]  (web_search, x_search ve web_fetch içerir)
  },
}
```

## İlgili

- [Web Fetch](/tools/web-fetch) -- bir URL'yi getirin ve okunabilir içerik çıkarın
- [Web Browser](/tools/browser) -- JS ağırlıklı siteler için tam tarayıcı otomasyonu
- [Grok Search](/tr/tools/grok-search) -- `web_search` sağlayıcısı olarak Grok
- [Ollama Web Search](/tools/ollama-search) -- Ollama ana makineniz üzerinden anahtarsız web search
