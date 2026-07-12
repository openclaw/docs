---
read_when:
    - web_search özelliğini etkinleştirmek veya yapılandırmak istiyorsunuz
    - x_search'ü etkinleştirmek veya yapılandırmak istiyorsunuz
    - Bir arama sağlayıcısı seçmeniz gerekiyor
    - Otomatik algılamayı ve sağlayıcı seçimini anlamak istiyorsunuz
sidebarTitle: Web Search
summary: web_search, x_search ve web_fetch -- web'de arama yapın, X gönderilerinde arama yapın veya sayfa içeriğini alın
title: Web araması
x-i18n:
    generated_at: "2026-07-12T12:51:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 58db549f5133a98a2ee9514f570ba8bd99b793e912ed3e0da296f454c88692a7
    source_path: tools/web.md
    workflow: 16
---

`web_search`, yapılandırılmış sağlayıcınızla web'de arama yapar ve
sorguya göre 15 dakika boyunca önbelleğe alınan (yapılandırılabilir) normalleştirilmiş
sonuçlar döndürür. OpenClaw ayrıca X (eski adıyla Twitter) gönderileri için `x_search`
ve hafif URL getirme işlemleri için `web_fetch` araçlarını da içerir. `web_fetch` her
zaman yerel olarak çalışır; sağlayıcı Grok olduğunda `web_search`, xAI Responses
üzerinden yönlendirilir ve `x_search` her zaman xAI Responses kullanır.

<Info>
  `web_search`, tarayıcı otomasyonu değil, hafif bir HTTP aracıdır. Yoğun
  JavaScript kullanan siteler veya oturum açma işlemleri için [Web Tarayıcısı](/tr/tools/browser)
  aracını kullanın. Belirli bir URL'yi getirmek için [Web Getirme](/tr/tools/web-fetch)
  aracını kullanın.
</Info>

## Hızlı başlangıç

<Steps>
  <Step title="Bir sağlayıcı seçin">
    Bir sağlayıcı seçin ve gerekli tüm kurulumları tamamlayın. Bazı sağlayıcılar
    anahtarsızdır, diğerleri API anahtarı gerektirir. Ayrıntılar için aşağıdaki
    sağlayıcı sayfalarına bakın.
  </Step>
  <Step title="Yapılandırın">
    ```bash
    openclaw configure --section web
    ```
    Bu işlem sağlayıcıyı ve gereken kimlik bilgilerini kaydeder. API destekli
    sağlayıcılarda bunun yerine sağlayıcının ortam değişkenini (örneğin
    `BRAVE_API_KEY`) ayarlayabilir ve bu adımı atlayabilirsiniz.
  </Step>
  <Step title="Kullanın">
    ```javascript
    await web_search({ query: "OpenClaw plugin SDK" });
    ```

    X gönderileri için:

    ```javascript
    await x_search({ query: "dinner recipes" });
    ```

  </Step>
</Steps>

## Sağlayıcı seçimi

<CardGroup cols={2}>
  <Card title="Brave Search" icon="shield" href="/tr/tools/brave-search">
    Parçacıklar içeren yapılandırılmış sonuçlar. `llm-context` modunu ve ülke/dil filtrelerini destekler. Ücretsiz katman mevcuttur.
  </Card>
  <Card title="Codex Barındırılan Arama" icon="search" href="/tr/plugins/codex-harness">
    Codex uygulama sunucusu hesabınız üzerinden yapay zekâ tarafından sentezlenen, kaynaklara dayalı yanıtlar.
  </Card>
  <Card title="DuckDuckGo" icon="bird" href="/tr/tools/duckduckgo-search">
    Anahtarsız sağlayıcı. API anahtarı gerekmez. Resmî olmayan HTML tabanlı entegrasyon.
  </Card>
  <Card title="Exa" icon="brain" href="/tr/tools/exa-search">
    İçerik çıkarma (öne çıkanlar, metin, özetler) özellikli sinirsel + anahtar sözcük araması.
  </Card>
  <Card title="Firecrawl" icon="flame" href="/tr/tools/firecrawl">
    Yapılandırılmış sonuçlar. Derin içerik çıkarma için en iyi sonucu `firecrawl_search` ve `firecrawl_scrape` ile birlikte kullanıldığında verir.
  </Card>
  <Card title="Gemini" icon="sparkles" href="/tr/tools/gemini-search">
    Google Arama temellendirmesi aracılığıyla alıntılar içeren, yapay zekâ tarafından sentezlenmiş yanıtlar.
  </Card>
  <Card title="Grok" icon="zap" href="/tr/tools/grok-search">
    xAI web temellendirmesi aracılığıyla alıntılar içeren, yapay zekâ tarafından sentezlenmiş yanıtlar.
  </Card>
  <Card title="Kimi" icon="moon" href="/tr/tools/kimi-search">
    Moonshot web araması aracılığıyla alıntılar içeren, yapay zekâ tarafından sentezlenmiş yanıtlar; temellendirilmemiş sohbet geri dönüşleri açıkça başarısız olur.
  </Card>
  <Card title="MiniMax Arama" icon="globe" href="/tr/tools/minimax-search">
    MiniMax Token Plan arama API'si aracılığıyla yapılandırılmış sonuçlar.
  </Card>
  <Card title="Ollama Web Araması" icon="globe" href="/tr/tools/ollama-search">
    Oturum açılmış yerel bir Ollama ana makinesi veya barındırılan Ollama API'si aracılığıyla arama.
  </Card>
  <Card title="Parallel" icon="layer-group" href="/tr/tools/parallel-search">
    Ücretli Parallel Arama API'si (`PARALLEL_API_KEY`); daha yüksek hız sınırları ve hedefe yönelik ayarlama.
  </Card>
  <Card title="Parallel Arama (Ücretsiz)" icon="layer-group" href="/tr/tools/parallel-search">
    Anahtarsız, isteğe bağlı katılım. LLM için optimize edilmiş yoğun alıntılar sunan ve API anahtarı gerektirmeyen Parallel ücretsiz Arama MCP'si.
  </Card>
  <Card title="Perplexity" icon="search" href="/tr/tools/perplexity-search">
    İçerik çıkarma denetimleri ve alan adı filtrelemesi içeren yapılandırılmış sonuçlar.
  </Card>
  <Card title="SearXNG" icon="server" href="/tr/tools/searxng-search">
    Kendi sunucunuzda barındırılan meta arama. API anahtarı gerekmez. Google, Bing, DuckDuckGo ve diğerlerini bir araya getirir.
  </Card>
  <Card title="Tavily" icon="globe" href="/tr/tools/tavily">
    Arama derinliği, konu filtreleme ve URL çıkarma için `tavily_extract` özellikli yapılandırılmış sonuçlar.
  </Card>
</CardGroup>

### Sağlayıcı karşılaştırması

| Sağlayıcı                                        | Sonuç biçimi                                                   | Filtreler                                        | API anahtarı                                                                             |
| ------------------------------------------------ | -------------------------------------------------------------- | ------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| [Brave](/tr/tools/brave-search)                     | Yapılandırılmış parçacıklar                                    | Ülke, dil, zaman, `llm-context` modu              | `BRAVE_API_KEY`                                                                          |
| [Codex Barındırılan Arama](/tr/plugins/codex-harness) | Yapay zekâ sentezi + kaynak URL'leri                          | Alan adları, bağlam boyutu, kullanıcı konumu      | Yok; Codex/OpenAI oturum açma bilgilerini kullanır                                        |
| [DuckDuckGo](/tr/tools/duckduckgo-search)           | Yapılandırılmış parçacıklar                                    | --                                               | Yok (anahtarsız)                                                                         |
| [Exa](/tr/tools/exa-search)                         | Yapılandırılmış + çıkarılmış                                   | Sinirsel/anahtar sözcük modu, tarih, içerik çıkarma | `EXA_API_KEY`                                                                          |
| [Firecrawl](/tr/tools/firecrawl)                    | Yapılandırılmış parçacıklar                                    | `firecrawl_search` aracı aracılığıyla             | `FIRECRAWL_API_KEY`                                                                      |
| [Gemini](/tr/tools/gemini-search)                   | Yapay zekâ sentezi + alıntılar                                 | --                                               | `GEMINI_API_KEY`                                                                         |
| [Grok](/tr/tools/grok-search)                       | Yapay zekâ sentezi + alıntılar                                 | --                                               | xAI OAuth, `XAI_API_KEY` veya `plugins.entries.xai.config.webSearch.apiKey`               |
| [Kimi](/tr/tools/kimi-search)                       | Yapay zekâ sentezi + alıntılar; temellendirilmemiş sohbet geri dönüşlerinde başarısız olur | --                         | `KIMI_API_KEY` / `MOONSHOT_API_KEY`                                                       |
| [MiniMax Arama](/tr/tools/minimax-search)           | Yapılandırılmış parçacıklar                                    | Bölge (`global` / `cn`)                           | `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` / `MINIMAX_OAUTH_TOKEN`               |
| [Ollama Web Araması](/tr/tools/ollama-search)       | Yapılandırılmış parçacıklar                                    | --                                               | Oturum açılmış yerel ana makineler için yok; doğrudan `https://ollama.com` araması için `OLLAMA_API_KEY` |
| [Parallel](/tr/tools/parallel-search)               | LLM bağlamına göre sıralanmış yoğun alıntılar                  | --                                               | `PARALLEL_API_KEY` (ücretli)                                                             |
| [Parallel Arama (Ücretsiz)](/tr/tools/parallel-search) | LLM bağlamına göre sıralanmış yoğun alıntılar                | --                                               | Yok (ücretsiz Arama MCP'si)                                                              |
| [Perplexity](/tr/tools/perplexity-search)           | Yapılandırılmış parçacıklar                                    | Ülke, dil, zaman, alan adları, içerik sınırları   | `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY`                                              |
| [SearXNG](/tr/tools/searxng-search)                 | Yapılandırılmış parçacıklar                                    | Kategoriler, dil                                  | Yok (kendi sunucunuzda barındırılır)                                                     |
| [Tavily](/tr/tools/tavily)                          | Yapılandırılmış parçacıklar                                    | `tavily_search` aracı aracılığıyla                | `TAVILY_API_KEY`                                                                         |

## Otomatik algılama

Belgelerdeki ve kurulum akışlarındaki sağlayıcı listeleri alfabetik sıradadır.
Otomatik algılama ayrı, sabit bir öncelik sırası kullanır ve yalnızca
yapılandırılmış olduğunu tespit ettiği, kimlik bilgisi gerektiren
(`requiresCredential !== false`) bir sağlayıcıyı seçer. `provider`
ayarlanmamışsa OpenClaw, sağlayıcıları aşağıdaki sırayla denetler ve hazır
olan ilkini kullanır:

Önce API destekli sağlayıcılar:

1. **Brave** -- `BRAVE_API_KEY` veya `plugins.entries.brave.config.webSearch.apiKey` (sıra 10)
2. **MiniMax Arama** -- `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` / `MINIMAX_OAUTH_TOKEN` / `MINIMAX_API_KEY` veya `plugins.entries.minimax.config.webSearch.apiKey` (sıra 15)
3. **Gemini** -- `plugins.entries.google.config.webSearch.apiKey`, `GEMINI_API_KEY` veya `models.providers.google.apiKey` (sıra 20)
4. **Grok** -- xAI OAuth, `XAI_API_KEY` veya `plugins.entries.xai.config.webSearch.apiKey` (sıra 30)
5. **Kimi** -- `KIMI_API_KEY` / `MOONSHOT_API_KEY` veya `plugins.entries.moonshot.config.webSearch.apiKey` (sıra 40)
6. **Perplexity** -- `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY` veya `plugins.entries.perplexity.config.webSearch.apiKey` (sıra 50)
7. **Firecrawl** -- `FIRECRAWL_API_KEY` veya `plugins.entries.firecrawl.config.webSearch.apiKey` (sıra 60)
8. **Exa** -- `EXA_API_KEY` veya `plugins.entries.exa.config.webSearch.apiKey`; isteğe bağlı `plugins.entries.exa.config.webSearch.baseUrl`, Exa uç noktasını geçersiz kılar (sıra 65)
9. **Tavily** -- `TAVILY_API_KEY` veya `plugins.entries.tavily.config.webSearch.apiKey` (sıra 70)
10. **Parallel** -- `PARALLEL_API_KEY` veya `plugins.entries.parallel.config.webSearch.apiKey` aracılığıyla ücretli Parallel Arama API'si; isteğe bağlı `plugins.entries.parallel.config.webSearch.baseUrl`, uç noktayı geçersiz kılar (sıra 75)

Bunların ardından yapılandırılmış uç nokta sağlayıcıları:

11. **SearXNG** -- `SEARXNG_BASE_URL` veya `plugins.entries.searxng.config.webSearch.baseUrl` (sıra 200)

**Parallel Arama (Ücretsiz)**, **DuckDuckGo**, **Ollama Web Araması** ve
**Codex Barındırılan Arama** gibi anahtarsız sağlayıcılar, dâhilî bir sıra
değerine sahip olsalar bile otomatik algılamada hiçbir zaman seçilmez.
Bunlar yalnızca `tools.web.search.provider` ile veya
`openclaw configure --section web` üzerinden açıkça seçtiğinizde kullanılır.
OpenClaw, yalnızca API destekli bir sağlayıcı yapılandırılmadığı için yönetilen
`web_search` sorgularını anahtarsız bir sağlayıcıya göndermez.

OpenAI Responses modelleri bir istisnadır: `tools.web.search.provider`
ayarlanmamışken yukarıdaki yönetilen sağlayıcılar yerine OpenAI'ın yerel web
aramasını kullanırlar (aşağıya bakın). Bunları bunun yerine yönetilen yol
üzerinden yönlendirmek için `tools.web.search.provider` değerini
`parallel-free` (veya başka bir sağlayıcı) olarak ayarlayın.

<Note>
  Tüm sağlayıcı anahtar alanları SecretRef nesnelerini destekler.
  `plugins.entries.<plugin>.config.webSearch.apiKey` altındaki Plugin kapsamlı
  SecretRef'ler; sağlayıcı ister `tools.web.search.provider` aracılığıyla açıkça
  seçilsin ister otomatik algılama yoluyla belirlensin, Brave, Exa, Firecrawl,
  Gemini, Grok, Kimi, MiniMax, Parallel, Perplexity ve Tavily dâhil olmak üzere
  kurulu API destekli web arama sağlayıcıları için çözümlenir. Otomatik algılama
  modunda OpenClaw yalnızca seçilen sağlayıcının anahtarını çözümler; seçilmeyen
  SecretRef'ler etkinlik dışı kalır. Böylece kullanmadığınız sağlayıcılar için
  çözümleme maliyetine katlanmadan birden fazla sağlayıcıyı yapılandırılmış
  durumda tutabilirsiniz.
</Note>

## Yerel OpenAI web araması

Doğrudan OpenAI Responses modelleri (`api: "openai-responses"`, sağlayıcı `openai`,
temel URL yok veya resmi bir OpenAI API temel URL'si), OpenClaw web araması
etkinleştirildiğinde ve yönetilen bir sağlayıcı sabitlenmediğinde OpenAI'ın
barındırılan `web_search` aracını otomatik olarak kullanır. Bu, paketle gelen
OpenAI pluginindeki sağlayıcıya ait bir davranıştır ve OpenAI uyumlu proxy temel
URL'leri veya Azure rotaları için geçerli değildir. OpenAI modellerinde yönetilen
`web_search` aracını kullanmayı sürdürmek için `tools.web.search.provider`
değerini `brave` gibi başka bir sağlayıcıya ayarlayın veya hem yönetilen aramayı
hem de yerel OpenAI aramasını devre dışı bırakmak için
`tools.web.search.enabled: false` değerini ayarlayın.

## Yerel Codex web araması

Codex uygulama sunucusu çalışma zamanı, web araması etkinleştirildiğinde ve
yönetilen bir sağlayıcı seçilmediğinde Codex'in barındırılan `web_search` aracını
otomatik olarak kullanır. Yerel barındırılan arama ile OpenClaw'ın yönetilen
dinamik `web_search` aracı birbirini dışlar; dolayısıyla yönetilen arama, yerel
alan adı kısıtlamalarını aşamaz. Barındırılan arama kullanılamadığında, açıkça
devre dışı bırakıldığında veya seçilmiş bir yönetilen sağlayıcıyla
değiştirildiğinde OpenClaw yönetilen aracı kullanır. OpenClaw, üretim uygulama
sunucusu trafiği kullanıcı tanımlı `web` ad alanını reddettiği için Codex'in
bağımsız `web.run` uzantısını devre dışı tutar
(`features.standalone_web_search: false`).

- Yerel aramayı `tools.web.search.openaiCodex` altında yapılandırın
- Codex Hosted Search'ü herhangi bir üst model için yönetilen `web_search`
  sağlayıcısı olarak hazırlamak üzere `tools.web.search.provider: "codex"`
  değerini ayarlayın. Her çağrı, sınırlandırılmış geçici bir Codex uygulama
  sunucusu turu çalıştırır ve Codex barındırılan bir `webSearch` öğesi üretmezse
  başarısız olur.
- `mode: "cached"` varsayılan tercihtir ancak Codex, kısıtlanmamış uygulama
  sunucusu turlarında bunu canlı harici erişime çözümler; canlı erişimi açıkça
  istemek için `"live"` değerini ayarlayın
- Bunun yerine OpenClaw'ın yönetilen `web_search` aracını kullanmak için
  `tools.web.search.provider` değerini `brave` gibi yönetilen bir sağlayıcıya
  ayarlayın
- Codex tarafından barındırılan aramayı kullanmamak için
  `tools.web.search.openaiCodex.enabled: false` değerini ayarlayın; diğer
  yönetilen sağlayıcılar kullanılabilir durumda kalır
- Codex'in yerel araç yüzeyini kısıtlamak, yönetilen `web_search` aracını da
  kullanılabilir durumda tutar
- `allowedDomains` ayarlandığında, yerel izin listesinin aşılamaması için
  barındırılan arama kullanılamıyorsa otomatik yönetilen geri dönüş güvenli
  biçimde başarısız olur
- Araçların devre dışı bırakıldığı, yalnızca LLM kullanılan çalıştırmalar hem
  yerel hem de yönetilen aramayı devre dışı bırakır
- `tools.web.search.enabled: false` hem yönetilen hem de yerel aramayı devre dışı
  bırakır

Kalıcı ve etkin Codex arama politikası değişiklikleri, önceden yüklenmiş bir
uygulama sunucusu iş parçacığının eski barındırılan arama erişimini koruyamaması
için yeni bir bağlı iş parçacığı başlatır. Tur başına geçici kısıtlamalar, geçici
ve kısıtlı bir iş parçacığı kullanır ve daha sonra devam etmek üzere mevcut
bağlantıyı korur.

Doğrudan OpenAI ChatGPT Responses trafiği de OpenAI'ın barındırılan `web_search`
aracını kullanabilir. Bu ayrı yol, `tools.web.search.openaiCodex.enabled: true`
aracılığıyla isteğe bağlı kalır ve yalnızca
`api: "openai-chatgpt-responses"` kullanan uygun `openai/*` modelleri için
geçerlidir.

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        // İsteğe bağlı: Codex Hosted Search'ü Codex olmayan üst modellerden de kullanın.
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
özgü ağ denetimlerine ihtiyaç duyduğunuzda açıkça bir yönetilen sağlayıcı
kullanın.

`provider: "codex"` seçmek, paketle gelen `codex` pluginini etkinleştirir ve
yukarıda gösterilen aynı `tools.web.search.openaiCodex` kısıtlamalarını kullanır.
Önce `openclaw models auth login --provider openai` ile Codex uygulama sunucusunda
kimlik doğrulayın. Üst aracı herhangi bir modeli veya çalışma zamanını
kullanabilir; yalnızca sınırlandırılmış arama çalışanı Codex üzerinden çalışır.

## Ağ güvenliği

Yönetilen HTTP `web_search` sağlayıcı çağrıları, geçerli sağlayıcının kendi ana
makine adıyla sınırlandırılmış OpenClaw korumalı getirme yolunu kullanır.
OpenClaw yalnızca bu ana makine adı için `198.18.0.0/15` ve `fc00::/7`
aralıklarındaki Surge, Clash ve sing-box sahte IP DNS yanıtlarına izin verir.
Diğer özel, loopback, bağlantıya yerel ve meta veri hedefleri engellenmeye devam
eder. Codex Hosted Search istisnadır: sınırlandırılmış çalışanı ağ erişimini
Codex uygulama sunucusunun barındırılan `web_search` aracına devreder.

Bu otomatik izin, rastgele `web_fetch` URL'leri için geçerli değildir.
`web_fetch` için yalnızca güvenilir proxy'niz bu yapay aralıkların sahibiyse
`tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` ve
`tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange` ayarlarını açıkça
etkinleştirin.

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

Sağlayıcıya özgü yapılandırma (API anahtarları, temel URL'ler, modlar)
`plugins.entries.<plugin>.config.webSearch.*` altında bulunur. Gemini ayrıca
kendisine ayrılmış web araması yapılandırması ve `GEMINI_API_KEY` sonrasında
daha düşük öncelikli geri dönüşler olarak `models.providers.google.apiKey` ve
`models.providers.google.baseUrl` değerlerini yeniden kullanabilir. Örnekler
için sağlayıcı sayfalarına bakın.
Grok ayrıca `openclaw models auth login --provider xai --method oauth`
komutundan bir xAI OAuth kimlik doğrulama profilini yeniden kullanabilir; API
anahtarı yapılandırması geri dönüş seçeneği olarak kalır.

`tools.web.search.provider`, paketle gelen ve yüklü plugin bildirimlerinde
tanımlanan web araması sağlayıcı kimliklerine göre doğrulanır. `"brvae"` gibi bir
yazım hatası, sessizce otomatik algılamaya geri dönmek yerine yapılandırma
doğrulamasının başarısız olmasına neden olur. Yapılandırılmış bir sağlayıcının
yalnızca eski plugin kanıtları varsa (örneğin üçüncü taraf bir plugin
kaldırıldıktan sonra geride kalan bir `plugins.entries.<plugin>` bloğu),
OpenClaw başlangıcın dayanıklılığını korur ve plugini yeniden yükleyebilmeniz
veya eski yapılandırmayı temizlemek için `openclaw doctor --fix`
çalıştırabilmeniz amacıyla bir uyarı bildirir.

`web_fetch` geri dönüş sağlayıcısının seçimi ayrıdır:

- `tools.web.fetch.provider` ile seçin
- veya bu alanı belirtmeyin ve OpenClaw'ın yapılandırılmış kimlik bilgileri
  arasından hazır olan ilk web getirme sağlayıcısını otomatik olarak algılamasına
  izin verin
- korumalı alanda çalışmayan `web_fetch`, `contracts.webFetchProviders`
  tanımlayan yüklü plugin sağlayıcılarını kullanabilir; korumalı alandaki
  getirmeler paketle gelen sağlayıcılara ve doğrulanmış resmi plugin
  kurulumlarına izin verir ancak harici üçüncü taraf pluginlerini hariç tutar
- resmi Firecrawl plugini günümüzde paketle gelen tek `webFetchProviders`
  katkı sağlayıcısıdır ve `plugins.entries.firecrawl.config.webFetch.*` altında
  yapılandırılır

`openclaw onboard` veya `openclaw configure --section web` sırasında **Kimi**
seçtiğinizde OpenClaw ayrıca şunları sorabilir:

- Moonshot API bölgesi (`https://api.moonshot.ai/v1` veya `https://api.moonshot.cn/v1`)
- varsayılan Kimi web araması modeli (varsayılanı `kimi-k2.6`)

`x_search` için `plugins.entries.xai.config.xSearch.*` ayarını yapılandırın. Bu,
sohbetle aynı xAI kimlik doğrulama profilini veya Grok web aramasının kullandığı
`XAI_API_KEY` / plugin web araması kimlik bilgisini kullanır.
Eski `tools.web.x_search.*` yapılandırması, `openclaw doctor --fix` tarafından
otomatik olarak taşınır.
`openclaw onboard` veya `openclaw configure --section web` sırasında Grok'u
seçtiğinizde OpenClaw, Grok kurulumu tamamlandıktan hemen sonra aynı kimlik
bilgisiyle isteğe bağlı `x_search` kurulumunu da sunar. Bu, ayrı bir üst düzey
web araması sağlayıcısı seçimi değil, Grok yolu içindeki ayrı bir devam
adımıdır. Başka bir sağlayıcı seçerseniz OpenClaw `x_search` istemini göstermez.

### API anahtarlarını saklama

<Tabs>
  <Tab title="Yapılandırma dosyası">
    `openclaw configure --section web` komutunu çalıştırın veya anahtarı doğrudan ayarlayın:

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

| Parametre             | Açıklama                                                           |
| --------------------- | ------------------------------------------------------------------ |
| `query`               | Arama sorgusu (zorunlu)                                            |
| `count`               | Döndürülecek sonuç sayısı (1-10, varsayılan: 5)                    |
| `country`             | 2 harfli ISO ülke kodu (ör. "US", "DE")                            |
| `language`            | ISO 639-1 dil kodu (ör. "en", "de")                                |
| `search_lang`         | Arama dili kodu (yalnızca Brave)                                   |
| `freshness`           | Zaman filtresi: `day`, `week`, `month` veya `year`                 |
| `date_after`          | Bu tarihten sonraki sonuçlar (YYYY-MM-DD)                           |
| `date_before`         | Bu tarihten önceki sonuçlar (YYYY-MM-DD)                            |
| `ui_lang`             | Kullanıcı arayüzü dil kodu (yalnızca Brave)                         |
| `domain_filter`       | Alan adı izin listesi/engelleme listesi dizisi (yalnızca Perplexity) |
| `max_tokens`          | Toplam içerik token bütçesi, yalnızca yerel Perplexity Search API   |
| `max_tokens_per_page` | Sayfa başına ayıklama token sınırı, yalnızca yerel Perplexity Search API |

<Warning>
  Tüm parametreler tüm sağlayıcılarla çalışmaz. Brave `llm-context` modu
  `ui_lang` değerini reddeder; Brave'in özel güncellik aralıkları hem başlangıç
  hem de bitiş tarihlerini gerektirdiği için `date_before` ayrıca `date_after`
  gerektirir.
  Gemini, Grok ve Kimi, alıntılarla birlikte sentezlenmiş tek bir yanıt döndürür.
  Paylaşılan araç uyumluluğu için `count` değerini kabul ederler ancak bu değer
  dayanaklı yanıtın biçimini değiştirmez. Gemini, `day` güncellik değerini bir
  yakınlık ipucu olarak değerlendirir; daha geniş güncellik değerleri ve açık
  tarihler, Google Search dayanaklandırmasının zaman aralıklarını ayarlar.
  Sonar/OpenRouter uyumluluk yolunu
  (`plugins.entries.perplexity.config.webSearch.baseUrl` / `model` veya
  `OPENROUTER_API_KEY`) kullandığınızda Perplexity de aynı şekilde davranır; bu
  yol ayrıca `max_tokens` ve `max_tokens_per_page` desteğini kaldırır.
  SearXNG, `http://` kullanımını yalnızca güvenilir özel ağ veya loopback ana
  makineleri için kabul eder; genel SearXNG uç noktaları `https://`
  kullanmalıdır.
  Firecrawl ve Tavily, `web_search` üzerinden yalnızca `query` ve `count`
  değerlerini destekler; gelişmiş seçenekler için kendilerine ayrılmış araçları
  kullanın.
</Warning>

## x_search

`x_search`, xAI kullanarak X (eski adıyla Twitter) gönderilerini sorgular ve
alıntılarla birlikte yapay zekâ tarafından sentezlenmiş yanıtlar döndürür. Doğal
dil sorgularını ve isteğe bağlı yapılandırılmış filtreleri kabul eder. OpenClaw,
yerleşik xAI `x_search` aracını kalıcı olarak kayıtlı tutmak yerine her istek
için oluşturur; bu nedenle araç yalnızca gerçekten çağrıldığı turda etkindir.

<Warning>
  `x_search`, xAI sunucularında çalışır. xAI, her 1.000 araç çağrısı için 5 ABD
  doları ve ayrıca modelin giriş ve çıkış tokenları için ücret alır.
</Warning>

<Note>
  xAI, `x_search` aracının anahtar kelime aramasını, anlamsal aramayı, kullanıcı
  aramasını ve iş parçacığı getirmeyi desteklediğini belirtir. Yeniden
  paylaşımlar, yanıtlar, yer imleri veya görüntülemeler gibi gönderi başına
  etkileşim istatistikleri için tam gönderi URL'sine veya durum kimliğine yönelik
  hedefli bir aramayı tercih edin. Geniş anahtar kelime aramaları doğru
  gönderiyi bulabilir ancak gönderi başına daha az eksiksiz meta veri
  döndürebilir. İyi bir yöntem şudur: önce gönderiyi bulun, ardından tam olarak
  o gönderiye odaklanan ikinci bir `x_search` sorgusu çalıştırın.
</Note>

### x_search yapılandırması

`enabled` belirtilmediğinde `x_search`, yalnızca etkin modelin sağlayıcısı `xai` olduğunda ve xAI kimlik bilgileri çözümlenebildiğinde kullanıma sunulur. Sağlayıcısı bilinen ve xAI olmayan etkin bir model için sağlayıcılar arası kullanımı etkinleştirmek üzere `plugins.entries.xai.config.xSearch.enabled` değerini `true` olarak ayarlayın. Etkin model sağlayıcısı eksikse veya çözümlenemiyorsa araç gizli kalır. Aracı tüm sağlayıcılarda devre dışı bırakmak için `enabled` değerini `false` olarak ayarlayın. xAI kimlik bilgileri her zaman gereklidir.

```json5
{
  plugins: {
    entries: {
      xai: {
        config: {
          xSearch: {
            enabled: true, // required for a known non-xAI model provider
            model: "grok-4.3",
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

`plugins.entries.xai.config.xSearch.baseUrl` ayarlandığında `x_search`, `<baseUrl>/responses` adresine POST isteği gönderir. Bu alan belirtilmezse sırasıyla `plugins.entries.xai.config.webSearch.baseUrl`, eski `tools.web.search.grok.baseUrl` ve son olarak genel xAI uç noktası (`https://api.x.ai/v1`) kullanılır.

### x_search parametreleri

| Parametre                    | Açıklama                                                        |
| ---------------------------- | --------------------------------------------------------------- |
| `query`                      | Arama sorgusu (zorunlu)                                         |
| `allowed_x_handles`          | Sonuçları en fazla 20 X kullanıcı adıyla sınırlandırır           |
| `excluded_x_handles`         | En fazla 20 X kullanıcı adını hariç tutar                        |
| `from_date`                  | Yalnızca bu tarihte veya sonrasında yayımlanan gönderileri ekler (YYYY-MM-DD) |
| `to_date`                    | Yalnızca bu tarihte veya öncesinde yayımlanan gönderileri ekler (YYYY-MM-DD) |
| `enable_image_understanding` | xAI'ın eşleşen gönderilere ekli görselleri incelemesini sağlar   |
| `enable_video_understanding` | xAI'ın eşleşen gönderilere ekli videoları incelemesini sağlar    |

`allowed_x_handles` ve `excluded_x_handles` birlikte kullanılamaz.

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

- [Web Getirme](/tr/tools/web-fetch) -- bir URL'yi getirir ve okunabilir içeriği çıkarır
- [Web Tarayıcısı](/tr/tools/browser) -- JavaScript ağırlıklı siteler için tam tarayıcı otomasyonu
- [Grok Araması](/tr/tools/grok-search) -- `web_search` sağlayıcısı olarak Grok
- [Ollama Web Araması](/tr/tools/ollama-search) -- Ollama sunucunuz üzerinden anahtar gerektirmeyen web araması
