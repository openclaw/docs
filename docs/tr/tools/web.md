---
read_when:
    - web_search'i etkinleştirmek veya yapılandırmak istiyorsunuz
    - x_search özelliğini etkinleştirmek veya yapılandırmak istiyorsunuz
    - Bir arama sağlayıcısı seçmeniz gerekiyor
    - Otomatik algılamayı ve sağlayıcı seçimini anlamak istiyorsunuz
sidebarTitle: Web Search
summary: web_search, x_search ve web_fetch -- web’de arama yapın, X gönderilerinde arama yapın veya sayfa içeriğini getirin
title: Web araması
x-i18n:
    generated_at: "2026-06-28T01:27:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a448de6760546863b840118ab04fec8ef4b3213c124a7f229ffe67536327f9a4
    source_path: tools/web.md
    workflow: 16
---

`web_search` aracı, yapılandırdığınız sağlayıcıyı kullanarak web'de arama yapar ve
sonuçları döndürür. Sonuçlar sorguya göre 15 dakika boyunca önbelleğe alınır (yapılandırılabilir).

OpenClaw ayrıca X (eski adıyla Twitter) gönderileri için `x_search` ve
hafif URL getirme için `web_fetch` içerir. Bu aşamada `web_fetch` yerel kalırken
`web_search` ve `x_search` perde arkasında xAI Responses kullanabilir.

<Info>
  `web_search`, tarayıcı otomasyonu değil, hafif bir HTTP aracıdır. JS ağırlıklı
  siteler veya oturum açma işlemleri için [Web Tarayıcısı](/tr/tools/browser) kullanın.
  Belirli bir URL'yi getirmek için [Web Fetch](/tr/tools/web-fetch) kullanın.
</Info>

## Hızlı başlangıç

<Steps>
  <Step title="Bir sağlayıcı seçin">
    Bir sağlayıcı seçin ve gereken kurulumları tamamlayın. Bazı sağlayıcılar
    anahtarsızdır, bazıları ise API anahtarları kullanır. Ayrıntılar için
    aşağıdaki sağlayıcı sayfalarına bakın.
  </Step>
  <Step title="Yapılandırın">
    ```bash
    openclaw configure --section web
    ```
    Bu, sağlayıcıyı ve gerekli kimlik bilgisini kaydeder. Ayrıca bir ortam
    değişkeni (örneğin `BRAVE_API_KEY`) ayarlayabilir ve API destekli
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

## Sağlayıcı seçme

<CardGroup cols={2}>
  <Card title="Brave Search" icon="shield" href="/tr/tools/brave-search">
    Parçacıklarla yapılandırılmış sonuçlar. `llm-context` modunu, ülke/dil filtrelerini destekler. Ücretsiz katman mevcuttur.
  </Card>
  <Card title="Codex Hosted Search" icon="search" href="/tr/plugins/codex-harness">
    Codex uygulama sunucusu hesabınız üzerinden kaynaklara dayalı, AI tarafından sentezlenmiş yanıtlar.
  </Card>
  <Card title="DuckDuckGo" icon="bird" href="/tr/tools/duckduckgo-search">
    Anahtarsız sağlayıcı. API anahtarı gerekmez. Resmi olmayan HTML tabanlı entegrasyon.
  </Card>
  <Card title="Exa" icon="brain" href="/tr/tools/exa-search">
    İçerik çıkarımıyla (vurgular, metin, özetler) sinirsel + anahtar kelime araması.
  </Card>
  <Card title="Firecrawl" icon="flame" href="/tr/tools/firecrawl">
    Yapılandırılmış sonuçlar. Derin çıkarım için en iyi `firecrawl_search` ve `firecrawl_scrape` ile birlikte kullanılır.
  </Card>
  <Card title="Gemini" icon="sparkles" href="/tr/tools/gemini-search">
    Google Search dayanaklandırması üzerinden atıflarla AI tarafından sentezlenmiş yanıtlar.
  </Card>
  <Card title="Grok" icon="zap" href="/tr/tools/grok-search">
    xAI web dayanaklandırması üzerinden atıflarla AI tarafından sentezlenmiş yanıtlar.
  </Card>
  <Card title="Kimi" icon="moon" href="/tr/tools/kimi-search">
    Moonshot web araması üzerinden atıflarla AI tarafından sentezlenmiş yanıtlar; dayanaklandırılmamış sohbet geri dönüşleri açıkça başarısız olur.
  </Card>
  <Card title="MiniMax Search" icon="globe" href="/tr/tools/minimax-search">
    MiniMax Token Plan arama API'si üzerinden yapılandırılmış sonuçlar.
  </Card>
  <Card title="Ollama Web Search" icon="globe" href="/tr/tools/ollama-search">
    Oturum açılmış yerel bir Ollama ana makinesi veya barındırılan Ollama API'si üzerinden arama.
  </Card>
  <Card title="Parallel" icon="layer-group" href="/tr/tools/parallel-search">
    Ücretli Parallel Search API (`PARALLEL_API_KEY`); daha yüksek hız sınırları ve hedef ayarlama.
  </Card>
  <Card title="Parallel Search (Free)" icon="layer-group" href="/tr/tools/parallel-search">
    Anahtarsız tercihli kullanım. LLM için optimize edilmiş yoğun alıntılar ve API anahtarı olmadan Parallel'in ücretsiz Search MCP'si.
  </Card>
  <Card title="Perplexity" icon="search" href="/tr/tools/perplexity-search">
    İçerik çıkarımı denetimleri ve alan adı filtreleme ile yapılandırılmış sonuçlar.
  </Card>
  <Card title="SearXNG" icon="server" href="/tr/tools/searxng-search">
    Kendi kendine barındırılan meta arama. API anahtarı gerekmez. Google, Bing, DuckDuckGo ve daha fazlasını bir araya getirir.
  </Card>
  <Card title="Tavily" icon="globe" href="/tr/tools/tavily">
    Arama derinliği, konu filtreleme ve URL çıkarımı için `tavily_extract` ile yapılandırılmış sonuçlar.
  </Card>
</CardGroup>

### Sağlayıcı karşılaştırması

| Sağlayıcı                                        | Sonuç stili                                                  | Filtreler                                        | API anahtarı                                                                            |
| ------------------------------------------------ | ------------------------------------------------------------ | ------------------------------------------------ | --------------------------------------------------------------------------------------- |
| [Brave](/tr/tools/brave-search)                     | Yapılandırılmış parçacıklar                                  | Ülke, dil, zaman, `llm-context` modu             | `BRAVE_API_KEY`                                                                         |
| [Codex Hosted Search](/tr/plugins/codex-harness)    | AI tarafından sentezlenmiş + kaynak URL'leri                 | Alan adları, bağlam boyutu, kullanıcı konumu     | Yok; Codex/OpenAI oturum açmasını kullanır                                              |
| [DuckDuckGo](/tr/tools/duckduckgo-search)           | Yapılandırılmış parçacıklar                                  | --                                               | Yok (anahtarsız)                                                                        |
| [Exa](/tr/tools/exa-search)                         | Yapılandırılmış + çıkarılmış                                 | Sinirsel/anahtar kelime modu, tarih, içerik çıkarımı | `EXA_API_KEY`                                                                        |
| [Firecrawl](/tr/tools/firecrawl)                    | Yapılandırılmış parçacıklar                                  | `firecrawl_search` aracı üzerinden              | `FIRECRAWL_API_KEY`                                                                     |
| [Gemini](/tr/tools/gemini-search)                   | AI tarafından sentezlenmiş + atıflar                         | --                                               | `GEMINI_API_KEY`                                                                        |
| [Grok](/tr/tools/grok-search)                       | AI tarafından sentezlenmiş + atıflar                         | --                                               | xAI OAuth, `XAI_API_KEY` veya `plugins.entries.xai.config.webSearch.apiKey`             |
| [Kimi](/tr/tools/kimi-search)                       | AI tarafından sentezlenmiş + atıflar; dayanaklandırılmamış sohbet geri dönüşlerinde başarısız olur | --                            | `KIMI_API_KEY` / `MOONSHOT_API_KEY`                                                     |
| [MiniMax Search](/tr/tools/minimax-search)          | Yapılandırılmış parçacıklar                                  | Bölge (`global` / `cn`)                          | `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` / `MINIMAX_OAUTH_TOKEN`              |
| [Ollama Web Search](/tr/tools/ollama-search)        | Yapılandırılmış parçacıklar                                  | --                                               | Oturum açılmış yerel ana makineler için yok; doğrudan `https://ollama.com` araması için `OLLAMA_API_KEY` |
| [Parallel](/tr/tools/parallel-search)               | LLM bağlamı için sıralanmış yoğun alıntılar                  | --                                               | `PARALLEL_API_KEY` (ücretli)                                                           |
| [Parallel Search (Free)](/tr/tools/parallel-search) | LLM bağlamı için sıralanmış yoğun alıntılar                  | --                                               | Yok (ücretsiz Search MCP)                                                              |
| [Perplexity](/tr/tools/perplexity-search)           | Yapılandırılmış parçacıklar                                  | Ülke, dil, zaman, alan adları, içerik sınırları  | `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY`                                             |
| [SearXNG](/tr/tools/searxng-search)                 | Yapılandırılmış parçacıklar                                  | Kategoriler, dil                                 | Yok (kendi kendine barındırılan)                                                       |
| [Tavily](/tr/tools/tavily)                          | Yapılandırılmış parçacıklar                                  | `tavily_search` aracı üzerinden                 | `TAVILY_API_KEY`                                                                        |

## Otomatik algılama

## Yerel OpenAI web araması

Doğrudan OpenAI Responses modelleri, OpenClaw web araması etkinleştirildiğinde ve yönetilen bir sağlayıcı sabitlenmediğinde OpenAI'in barındırılan `web_search` aracını otomatik olarak kullanır. Bu, paketlenmiş OpenAI Plugin içindeki sağlayıcıya ait davranıştır ve yalnızca yerel OpenAI API trafiği için geçerlidir; OpenAI uyumlu proxy temel URL'leri veya Azure rotaları için geçerli değildir. OpenAI modelleri için yönetilen `web_search` aracını korumak üzere `tools.web.search.provider` değerini `brave` gibi başka bir sağlayıcıya ayarlayın veya hem yönetilen aramayı hem de yerel OpenAI aramasını devre dışı bırakmak için `tools.web.search.enabled: false` ayarlayın.

## Yerel Codex web araması

Codex uygulama sunucusu çalışma zamanı, web araması etkin olduğunda ve yönetilen
bir sağlayıcı seçilmediğinde Codex'in barındırılan `web_search` aracını otomatik
olarak kullanır. Yerel barındırılan arama ile OpenClaw'ın yönetilen `web_search`
dinamik aracı birbirini dışlar, bu nedenle yönetilen arama yerel alan adı
kısıtlamalarını atlayamaz. OpenClaw, barındırılan arama kullanılamadığında,
açıkça devre dışı bırakıldığında veya seçili bir yönetilen sağlayıcıyla
değiştirildiğinde yönetilen aracı kullanır. OpenClaw, üretim uygulama sunucusu
trafiği kullanıcı tanımlı `web` ad alanını reddettiği için Codex'in bağımsız
`web.run` uzantısını devre dışı tutar.

- Yerel aramayı `tools.web.search.openaiCodex` altında yapılandırın
- Herhangi bir üst model için yönetilen `web_search` sağlayıcısı olarak Codex Hosted Search sağlamak üzere `tools.web.search.provider: "codex"` ayarlayın. Her çağrı, sınırlandırılmış geçici bir Codex uygulama sunucusu turu çalıştırır ve Codex barındırılan bir `webSearch` öğesi yaymazsa başarısız olur.
- `mode: "cached"` varsayılan tercihtir, ancak Codex bunu kısıtlanmamış uygulama sunucusu turları için canlı dış erişime çözer; canlı erişimi açıkça istemek için `"live"` ayarlayın
- Bunun yerine OpenClaw'ın yönetilen `web_search` aracını kullanmak için `tools.web.search.provider` değerini `brave` gibi yönetilen bir sağlayıcıya ayarlayın
- Codex tarafından barındırılan aramadan çıkmak için `tools.web.search.openaiCodex.enabled: false` ayarlayın; diğer yönetilen sağlayıcılar kullanılabilir kalır
- Codex yerel araç yüzeyini kısıtlamak, yönetilen `web_search` aracını da kullanılabilir tutar
- `allowedDomains` ayarlandığında, barındırılan arama kullanılamazsa otomatik yönetilen geri dönüş kapalı başarısız olur; böylece yerel izin verilenler listesi atlanamaz
- Araçları devre dışı bırakılmış yalnızca LLM çalıştırmaları hem yerel hem de yönetilen aramayı devre dışı bırakır
- `tools.web.search.enabled: false` hem yönetilen hem de yerel aramayı devre dışı bırakır

Kalıcı etkili Codex arama ilkesi değişiklikleri, zaten yüklenmiş bir uygulama
sunucusu iş parçacığının bayat barındırılan arama erişimini koruyamaması için
yeni bir bağlı iş parçacığı başlatır. Geçici tur başına kısıtlamalar, geçici
kısıtlı bir iş parçacığı kullanır ve daha sonra sürdürmek için mevcut bağlamayı
korur.

Doğrudan OpenAI ChatGPT Responses trafiği de OpenAI'in barındırılan
`web_search` aracını kullanabilir. Bu ayrı yol, `tools.web.search.openaiCodex.enabled: true`
üzerinden tercihli kullanım olarak kalır ve yalnızca `api: "openai-chatgpt-responses"`
kullanan uygun `openai/*` modellerine uygulanır.

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        // Optional: use Codex Hosted Search from non-Codex parent models too.
        provider: "codex",
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

Yerel Codex aramasını desteklemeyen çalışma zamanları ve sağlayıcılar için Codex,
OpenClaw'ın dinamik araç ad alanı üzerinden yönetilen `web_search` geri dönüşünü
kullanabilir. Codex tarafından barındırılan arama yerine OpenClaw'ın sağlayıcıya
özel ağ denetimlerine ihtiyaç duyduğunuzda açık bir yönetilen sağlayıcı kullanın.

`provider: "codex"` seçildiğinde birlikte gelen `codex` Plugin'i etkinleştirilir ve yukarıda gösterilen
aynı `tools.web.search.openaiCodex` kısıtlamaları kullanılır. Önce Codex app-server kimliğini
`openclaw models auth login --provider openai` ile doğrulayın.
Üst agent herhangi bir modeli veya runtime'ı kullanabilir; yalnızca sınırlandırılmış arama worker'ı
Codex üzerinden çalışır.

## Ağ güvenliği

Yönetilen HTTP `web_search` sağlayıcı çağrıları OpenClaw'ın korumalı fetch yolunu kullanır. Güvenilir
sağlayıcı API host'ları için OpenClaw, Surge, Clash ve sing-box fake-IP
DNS yanıtlarına `198.18.0.0/15` ve `fc00::/7` aralıklarında yalnızca ilgili sağlayıcı hostname'i için izin verir.
Diğer özel, loopback, link-local ve metadata hedefleri engellenmiş kalır.
Codex Hosted Search istisnadır: sınırlandırılmış worker'ı ağ erişimini
Codex app-server'ın barındırılan `web_search` aracına devreder.

Bu otomatik izin, rastgele `web_fetch` URL'leri için geçerli değildir. `web_fetch` için,
yalnızca güvenilir proxy'niz bu sentetik aralıkların sahibiyse
`tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` ve
`tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange` ayarlarını açıkça etkinleştirin.

## Web aramasını ayarlama

Dokümanlardaki ve kurulum akışlarındaki sağlayıcı listeleri alfabetiktir. Otomatik algılama ayrı bir öncelik sırası kullanır.

Hiçbir `provider` ayarlanmamışsa OpenClaw sağlayıcıları şu sırayla kontrol eder ve
hazır olan ilkini kullanır:

Önce API destekli sağlayıcılar:

1. **Brave** -- `BRAVE_API_KEY` veya `plugins.entries.brave.config.webSearch.apiKey` (sıra 10)
2. **MiniMax Search** -- `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` / `MINIMAX_OAUTH_TOKEN` / `MINIMAX_API_KEY` veya `plugins.entries.minimax.config.webSearch.apiKey` (sıra 15)
3. **Gemini** -- `plugins.entries.google.config.webSearch.apiKey`, `GEMINI_API_KEY` veya `models.providers.google.apiKey` (sıra 20)
4. **Grok** -- xAI OAuth, `XAI_API_KEY` veya `plugins.entries.xai.config.webSearch.apiKey` (sıra 30)
5. **Kimi** -- `KIMI_API_KEY` / `MOONSHOT_API_KEY` veya `plugins.entries.moonshot.config.webSearch.apiKey` (sıra 40)
6. **Perplexity** -- `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY` veya `plugins.entries.perplexity.config.webSearch.apiKey` (sıra 50)
7. **Firecrawl** -- `FIRECRAWL_API_KEY` veya `plugins.entries.firecrawl.config.webSearch.apiKey` (sıra 60)
8. **Exa** -- `EXA_API_KEY` veya `plugins.entries.exa.config.webSearch.apiKey`; isteğe bağlı `plugins.entries.exa.config.webSearch.baseUrl`, Exa endpoint'ini geçersiz kılar (sıra 65)
9. **Tavily** -- `TAVILY_API_KEY` veya `plugins.entries.tavily.config.webSearch.apiKey` (sıra 70)
10. **Parallel** -- `PARALLEL_API_KEY` veya `plugins.entries.parallel.config.webSearch.apiKey` üzerinden ücretli Parallel Search API; isteğe bağlı `plugins.entries.parallel.config.webSearch.baseUrl` endpoint'i geçersiz kılar (sıra 75)

Ardından yapılandırılmış endpoint sağlayıcıları:

11. **SearXNG** -- `SEARXNG_BASE_URL` veya `plugins.entries.searxng.config.webSearch.baseUrl` (sıra 200)

**Parallel Search (Free)**, **DuckDuckGo**,
**Ollama Web Search** ve **Codex Hosted Search** gibi anahtarsız sağlayıcılar yalnızca
`tools.web.search.provider` ile veya `openclaw configure --section web` üzerinden
açıkça seçtiğinizde kullanılabilir. OpenClaw, API destekli hiçbir sağlayıcı
yapılandırılmadı diye yönetilen `web_search` sorgularını anahtarsız bir sağlayıcıya göndermez.

OpenAI Responses modelleri bir istisnadır: `tools.web.search.provider`
ayarlanmamışken yukarıdaki yönetilen sağlayıcılar yerine OpenAI'ın yerel web aramasını kullanırlar.
Bunları yönetilen yol üzerinden yönlendirmek için `tools.web.search.provider` değerini
`parallel-free` (veya başka bir sağlayıcı) olarak ayarlayın.

<Note>
  Tüm sağlayıcı anahtar alanları SecretRef nesnelerini destekler. `plugins.entries.<plugin>.config.webSearch.apiKey`
  altındaki Plugin kapsamlı SecretRef'ler, Brave, Exa, Firecrawl,
  Gemini, Grok, Kimi, MiniMax, Parallel, Perplexity ve Tavily dahil olmak üzere
  kurulu API destekli web araması sağlayıcıları için çözümlenir;
  sağlayıcının `tools.web.search.provider` üzerinden açıkça seçilmesi veya
  otomatik algılamayla seçilmesi fark etmez. Otomatik algılama modunda OpenClaw yalnızca
  seçilen sağlayıcı anahtarını çözümler; seçilmeyen SecretRef'ler etkin olmayan durumda kalır, böylece
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

Sağlayıcıya özgü yapılandırma (API anahtarları, base URL'ler, modlar)
`plugins.entries.<plugin>.config.webSearch.*` altında yer alır. Gemini ayrıca, özel web araması
yapılandırması ve `GEMINI_API_KEY` sonrasında daha düşük öncelikli fallback'ler olarak
`models.providers.google.apiKey` ve `models.providers.google.baseUrl` değerlerini yeniden kullanabilir. Örnekler için
sağlayıcı sayfalarına bakın.
Grok ayrıca `openclaw models auth login
--provider xai --method oauth` içinden bir xAI OAuth kimlik doğrulama profilini yeniden kullanabilir; API anahtarı yapılandırması fallback olarak kalır.

`tools.web.search.provider`, birlikte gelen ve kurulu Plugin manifest'leri tarafından bildirilen web araması sağlayıcı kimliklerine göre doğrulanır.
`"brvae"` gibi bir yazım hatası, sessizce otomatik algılamaya dönmek yerine
yapılandırma doğrulamasında başarısız olur. Yapılandırılmış bir sağlayıcının yalnızca eski Plugin kanıtı varsa,
örneğin üçüncü taraf bir Plugin kaldırıldıktan sonra geride kalan
`plugins.entries.<plugin>` bloğu gibi, OpenClaw başlangıcı dayanıklı tutar ve Plugin'i yeniden kurabilmeniz
veya eski yapılandırmayı temizlemek için `openclaw doctor --fix` çalıştırabilmeniz adına bir uyarı bildirir.

`web_fetch` fallback sağlayıcı seçimi ayrıdır:

- `tools.web.fetch.provider` ile seçin
- veya bu alanı atlayıp OpenClaw'ın yapılandırılmış kimlik bilgilerinden hazır olan ilk web-fetch
  sağlayıcısını otomatik algılamasına izin verin
- sandbox dışı `web_fetch`, `contracts.webFetchProviders` bildiren kurulu Plugin sağlayıcılarını kullanabilir;
  sandbox içi fetch'ler birlikte gelen sağlayıcılara ve doğrulanmış resmi Plugin kurulumlarına izin verir,
  ancak üçüncü taraf harici Plugin'leri hariç tutar
- resmi Firecrawl Plugin'i, `plugins.entries.firecrawl.config.webFetch.*` altında yapılandırılan
  web-fetch fallback'i sağlar

`openclaw onboard` veya `openclaw configure --section web` sırasında **Kimi** seçtiğinizde
OpenClaw ayrıca şunları sorabilir:

- Moonshot API bölgesi (`https://api.moonshot.ai/v1` veya `https://api.moonshot.cn/v1`)
- varsayılan Kimi web araması modeli (varsayılan `kimi-k2.6`)

`x_search` için `plugins.entries.xai.config.xSearch.*` yapılandırın. Sohbetle aynı
xAI kimlik doğrulama profilini veya Grok web araması tarafından kullanılan `XAI_API_KEY` / Plugin web araması
kimlik bilgisini kullanır.
Eski `tools.web.x_search.*` yapılandırması `openclaw doctor --fix` tarafından otomatik olarak geçirilir.
`openclaw onboard` veya `openclaw configure --section web` sırasında Grok seçtiğinizde,
OpenClaw aynı kimlik bilgisiyle isteğe bağlı `x_search` kurulumu da sunabilir.
Bu, Grok yolu içinde ayrı bir takip adımıdır; ayrı bir üst düzey
web araması sağlayıcı seçimi değildir. Başka bir sağlayıcı seçerseniz OpenClaw
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
    Sağlayıcı env var'ını Gateway süreç ortamında ayarlayın:

    ```bash
    export BRAVE_API_KEY="YOUR_KEY"
    ```

    Bir gateway kurulumu için bunu `~/.openclaw/.env` içine koyun.
    Bkz. [Env vars](/tr/help/faq#env-vars-and-env-loading).

  </Tab>
</Tabs>

## Araç parametreleri

| Parametre             | Açıklama                                             |
| --------------------- | ---------------------------------------------------- |
| `query`               | Arama sorgusu (gerekli)                              |
| `count`               | Döndürülecek sonuçlar (1-10, varsayılan: 5)          |
| `country`             | 2 harfli ISO ülke kodu (örn. "US", "DE")             |
| `language`            | ISO 639-1 dil kodu (örn. "en", "de")                 |
| `search_lang`         | Arama dili kodu (yalnızca Brave)                     |
| `freshness`           | Zaman filtresi: `day`, `week`, `month` veya `year`   |
| `date_after`          | Bu tarihten sonraki sonuçlar (YYYY-MM-DD)            |
| `date_before`         | Bu tarihten önceki sonuçlar (YYYY-MM-DD)             |
| `ui_lang`             | UI dil kodu (yalnızca Brave)                         |
| `domain_filter`       | Domain allowlist/denylist dizisi (yalnızca Perplexity) |
| `max_tokens`          | Toplam içerik bütçesi, varsayılan 25000 (yalnızca Perplexity) |
| `max_tokens_per_page` | Sayfa başına token sınırı, varsayılan 2048 (yalnızca Perplexity) |

<Warning>
  Tüm parametreler tüm sağlayıcılarla çalışmaz. Brave `llm-context` modu
  `ui_lang` değerini reddeder; Brave özel freshness aralıkları hem başlangıç hem de bitiş tarihleri gerektirdiğinden
  `date_before` için ayrıca `date_after` gerekir.
  Gemini, Grok ve Kimi alıntılarla birlikte tek bir sentezlenmiş yanıt döndürür. Paylaşılan araç uyumluluğu için
  `count` kabul ederler, ancak bu grounded yanıt biçimini değiştirmez.
  Gemini `day` freshness değerini bir güncellik ipucu olarak ele alır; daha geniş
  freshness değerleri ve açık tarihler Google Search grounding zaman aralıklarını ayarlar.
  Sonar/OpenRouter uyumluluk yolunu (`plugins.entries.perplexity.config.webSearch.baseUrl` /
  `model` veya `OPENROUTER_API_KEY`) kullandığınızda Perplexity de aynı şekilde davranır.
  SearXNG, `http://` adreslerini yalnızca güvenilir özel ağ veya loopback host'ları için kabul eder;
  genel SearXNG endpoint'leri `https://` kullanmalıdır.
  Firecrawl ve Tavily, `web_search` üzerinden yalnızca `query` ve `count` destekler;
  gelişmiş seçenekler için kendi özel araçlarını kullanın.
</Warning>

## x_search

`x_search`, xAI kullanarak X (eski adıyla Twitter) gönderilerini sorgular ve
alıntılarla birlikte AI tarafından sentezlenmiş yanıtlar döndürür. Doğal dil sorgularını ve
isteğe bağlı yapılandırılmış filtreleri kabul eder. OpenClaw, yerleşik xAI `x_search`
aracını yalnızca bu araç çağrısını sunan istekte etkinleştirir.

<Note>
  xAI, `x_search` aracını anahtar kelime araması, semantik arama, kullanıcı
  araması ve thread getirme desteğiyle belgelendirir. Yeniden gönderiler,
  yanıtlar, yer imleri veya görüntülemeler gibi gönderi başına etkileşim istatistikleri için tam gönderi URL'si
  veya durum kimliğiyle hedefli bir lookup tercih edin. Geniş anahtar kelime aramaları doğru gönderiyi bulabilir
  ancak gönderi başına metadata'yı daha az eksiksiz döndürebilir. İyi bir örüntü şudur:
  önce gönderiyi bulun, ardından tam o gönderiye odaklanan ikinci bir `x_search` sorgusu çalıştırın.
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
            apiKey: "xai-...", // optional if an xAI auth profile or XAI_API_KEY is set
            baseUrl: "https://api.x.ai/v1", // optional shared xAI Responses base URL
          },
        },
      },
    },
  },
}
```

`plugins.entries.xai.config.xSearch.baseUrl` ayarlandığında `x_search`,
`<baseUrl>/responses` adresine gönderi yapar. Bu alan atlanırsa önce
`plugins.entries.xai.config.webSearch.baseUrl`, ardından
eski `tools.web.search.grok.baseUrl` ve son olarak genel xAI endpoint'i fallback olarak kullanılır.

### x_search parametreleri

| Parametre                    | Açıklama                                                |
| ---------------------------- | ------------------------------------------------------- |
| `query`                      | Arama sorgusu (gerekli)                                 |
| `allowed_x_handles`          | Sonuçları belirli X kullanıcı adlarıyla sınırla         |
| `excluded_x_handles`         | Belirli X kullanıcı adlarını hariç tut                  |
| `from_date`                  | Yalnızca bu tarihte veya sonrasında paylaşılan gönderileri dahil et (YYYY-MM-DD) |
| `to_date`                    | Yalnızca bu tarihte veya öncesinde paylaşılan gönderileri dahil et (YYYY-MM-DD) |
| `enable_image_understanding` | xAI'nin eşleşen gönderilere ekli görselleri incelemesine izin ver |
| `enable_video_understanding` | xAI'nin eşleşen gönderilere ekli videoları incelemesine izin ver |

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

- [Web Getirme](/tr/tools/web-fetch) -- bir URL getirir ve okunabilir içeriği çıkarır
- [Web Tarayıcısı](/tr/tools/browser) -- JS ağırlıklı siteler için tam tarayıcı otomasyonu
- [Grok Araması](/tr/tools/grok-search) -- `web_search` sağlayıcısı olarak Grok
- [Ollama Web Araması](/tr/tools/ollama-search) -- Ollama ana makineniz üzerinden anahtarsız web araması
