---
read_when:
    - Hangi özelliklerin ücretli API'leri çağırabileceğini anlamak istiyorsunuz
    - Anahtarları, maliyetleri ve kullanım görünürlüğünü denetlemeniz gerekir
    - /status veya /usage maliyet raporlamasını açıklıyorsunuz
summary: Nelerin para harcayabileceğini, hangi anahtarların kullanıldığını ve kullanımı nasıl görüntüleyeceğinizi denetleyin
title: API kullanımı ve maliyetleri
x-i18n:
    generated_at: "2026-05-06T09:29:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: c8e6f9f8248ddb4241d00191aa231f1d72a2128a7995b4ed0ec0e18a7ed6dd69
    source_path: reference/api-usage-costs.md
    workflow: 16
---

Bu belge, **API anahtarlarını çağırabilen özellikleri** ve bunların maliyetlerinin nerede göründüğünü listeler. Sağlayıcı kullanımı veya ücretli API çağrıları oluşturabilen OpenClaw özelliklerine odaklanır.

## Maliyetlerin göründüğü yerler (sohbet + CLI)

**Oturum başına maliyet anlık görüntüsü**

- `/status`, geçerli oturum modelini, bağlam kullanımını ve son yanıt token'larını gösterir.
- Model **API anahtarıyla kimlik doğrulama** kullanıyorsa, `/status` son yanıt için **tahmini maliyeti** de gösterir.
- Canlı oturum meta verileri seyrekse, `/status` en son transkript kullanım girdisinden token/önbellek
  sayaçlarını ve etkin çalışma zamanı model etiketini kurtarabilir.
  Mevcut sıfır olmayan canlı değerler yine önceliklidir ve saklanan toplamlar eksik veya daha küçük olduğunda prompt boyutundaki
  transkript toplamları öne geçebilir.

**İleti başına maliyet alt bilgisi**

- `/usage full`, **tahmini maliyet** dahil olmak üzere her yanıta bir kullanım alt bilgisi ekler (yalnızca API anahtarı).
- `/usage tokens` yalnızca token'ları gösterir; abonelik tarzı OAuth/token ve CLI akışları dolar maliyetini gizler.
- Gemini CLI notu: CLI JSON çıktısı döndürdüğünde, OpenClaw kullanımı
  `stats` üzerinden okur, `stats.cached` değerini `cacheRead` olarak normalleştirir ve gerektiğinde giriş token'larını
  `stats.input_tokens - stats.cached` üzerinden türetir.

Anthropic notu: Anthropic personeli, OpenClaw tarzı Claude CLI kullanımına
yeniden izin verildiğini bize bildirdi; bu nedenle OpenClaw, Anthropic yeni bir politika yayımlamadıkça bu entegrasyon için Claude CLI yeniden kullanımını ve `claude -p` kullanımını
onaylı kabul eder.
Anthropic hâlâ OpenClaw'ın `/usage full` içinde gösterebileceği ileti başına dolar tahminini sunmaz.

**CLI kullanım pencereleri (sağlayıcı kotaları)**

- `openclaw status --usage` ve `openclaw channels list`, sağlayıcı **kullanım pencerelerini**
  gösterir (kota anlık görüntüleri; ileti başına maliyetler değil).
- İnsan tarafından okunabilir çıktı, sağlayıcılar genelinde `X% left` biçimine normalleştirilir.
- Geçerli kullanım penceresi sağlayıcıları: Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi ve z.ai.
- MiniMax notu: ham `usage_percent` / `usagePercent` alanları kalan
  kotayı ifade eder, bu yüzden OpenClaw bunları görüntülemeden önce tersine çevirir. Sayı tabanlı alanlar mevcut olduğunda yine önceliklidir. Sağlayıcı `model_remains` döndürürse OpenClaw sohbet modeli girdisini tercih eder, gerektiğinde pencere etiketini zaman damgalarından türetir ve
  plan etiketine model adını ekler.
- Bu kota pencereleri için kullanım kimlik doğrulaması, varsa sağlayıcıya özgü hook'lardan
  gelir; aksi halde OpenClaw auth profillerinden, env'den veya yapılandırmadan eşleşen OAuth/API anahtarı
  kimlik bilgilerine geri döner.

Ayrıntılar ve örnekler için [Token kullanımı ve maliyetler](/tr/reference/token-use) bölümüne bakın.

## Anahtarlar nasıl keşfedilir

OpenClaw kimlik bilgilerini şuralardan alabilir:

- **Auth profilleri** (ajan başına, `auth-profiles.json` içinde saklanır).
- **Ortam değişkenleri** (ör. `OPENAI_API_KEY`, `BRAVE_API_KEY`, `FIRECRAWL_API_KEY`).
- **Yapılandırma** (`models.providers.*.apiKey`, `plugins.entries.*.config.webSearch.apiKey`,
  `plugins.entries.firecrawl.config.webFetch.apiKey`, `memorySearch.*`,
  `talk.providers.*.apiKey`).
- **Skills** (`skills.entries.<name>.apiKey`), anahtarları skill süreç ortamına aktarabilir.

## Anahtar harcayabilen özellikler

### 1) Çekirdek model yanıtları (sohbet + araçlar)

Her yanıt veya araç çağrısı **geçerli model sağlayıcısını** (OpenAI, Anthropic vb.) kullanır. Bu, kullanımın ve maliyetin
birincil kaynağıdır.

Bu ayrıca OpenClaw'ın yerel UI'si dışında faturalandırmaya devam eden abonelik tarzı barındırılan sağlayıcıları da kapsar; örneğin **OpenAI Codex**, **Alibaba Cloud Model Studio
Coding Plan**, **MiniMax Coding Plan**, **Z.AI / GLM Coding Plan** ve **Extra Usage** etkinleştirilmiş Anthropic'in OpenClaw Claude oturum açma yolu.

Fiyatlandırma yapılandırması için [Modeller](/tr/providers/models), görüntüleme için [Token kullanımı ve maliyetler](/tr/reference/token-use) bölümüne bakın.

### 2) Medya anlama (ses/görsel/video)

Gelen medya, yanıt çalışmadan önce özetlenebilir veya yazıya dökülebilir. Bu, model/sağlayıcı API'lerini kullanır.

- Ses: OpenAI / Groq / Deepgram / DeepInfra / Google / Mistral.
- Görsel: OpenAI / OpenRouter / Anthropic / DeepInfra / Google / MiniMax / Moonshot / Qwen / Z.AI.
- Video: Google / Qwen / Moonshot.

[Medya anlama](/tr/nodes/media-understanding) bölümüne bakın.

### 3) Görsel ve video üretimi

Paylaşılan üretim yetenekleri de sağlayıcı anahtarlarını harcayabilir:

- Görsel üretimi: OpenAI / Google / DeepInfra / fal / MiniMax
- Video üretimi: DeepInfra / Qwen

Görsel üretimi, `agents.defaults.imageGenerationModel` ayarlanmamışsa auth destekli sağlayıcı varsayılanını çıkarımlayabilir. Video üretimi şu anda
`qwen/wan2.6-t2v` gibi açık bir `agents.defaults.videoGenerationModel` gerektirir.

[Görsel üretimi](/tr/tools/image-generation), [Qwen Cloud](/tr/providers/qwen)
ve [Modeller](/tr/concepts/models) bölümlerine bakın.

### 4) Bellek embedding'leri + semantik arama

Semantik bellek araması, uzak sağlayıcılar için yapılandırıldığında **embedding API'lerini** kullanır:

- `memorySearch.provider = "openai"` → OpenAI embedding'leri
- `memorySearch.provider = "gemini"` → Gemini embedding'leri
- `memorySearch.provider = "voyage"` → Voyage embedding'leri
- `memorySearch.provider = "mistral"` → Mistral embedding'leri
- `memorySearch.provider = "deepinfra"` → DeepInfra embedding'leri
- `memorySearch.provider = "lmstudio"` → LM Studio embedding'leri (yerel/kendi barındırdığınız)
- `memorySearch.provider = "ollama"` → Ollama embedding'leri (yerel/kendi barındırdığınız; genellikle barındırılan API faturalandırması yoktur)
- Yerel embedding'ler başarısız olursa uzak bir sağlayıcıya isteğe bağlı geri dönüş

`memorySearch.provider = "local"` ile bunu yerel tutabilirsiniz (API kullanımı yok).

[Bellek](/tr/concepts/memory) bölümüne bakın.

### 5) Web arama aracı

`web_search`, sağlayıcınıza bağlı olarak kullanım ücretleri oluşturabilir:

- **Brave Search API**: `BRAVE_API_KEY` veya `plugins.entries.brave.config.webSearch.apiKey`
- **Exa**: `EXA_API_KEY` veya `plugins.entries.exa.config.webSearch.apiKey`
- **Firecrawl**: `FIRECRAWL_API_KEY` veya `plugins.entries.firecrawl.config.webSearch.apiKey`
- **Gemini (Google Search)**: `GEMINI_API_KEY` veya `plugins.entries.google.config.webSearch.apiKey`
- **Grok (xAI)**: `XAI_API_KEY` veya `plugins.entries.xai.config.webSearch.apiKey`
- **Kimi (Moonshot)**: `KIMI_API_KEY`, `MOONSHOT_API_KEY` veya `plugins.entries.moonshot.config.webSearch.apiKey`
- **MiniMax Search**: `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`, `MINIMAX_API_KEY` veya `plugins.entries.minimax.config.webSearch.apiKey`
- **Ollama Web Search**: erişilebilir, oturum açılmış yerel bir Ollama ana makinesi için anahtarsızdır; doğrudan `https://ollama.com` araması `OLLAMA_API_KEY` kullanır ve auth korumalı ana makineler normal Ollama sağlayıcı bearer auth'ını yeniden kullanabilir
- **Perplexity Search API**: `PERPLEXITY_API_KEY`, `OPENROUTER_API_KEY` veya `plugins.entries.perplexity.config.webSearch.apiKey`
- **Tavily**: `TAVILY_API_KEY` veya `plugins.entries.tavily.config.webSearch.apiKey`
- **DuckDuckGo**: anahtarsız geri dönüş (API faturalandırması yoktur, ancak resmi değildir ve HTML tabanlıdır)
- **SearXNG**: `SEARXNG_BASE_URL` veya `plugins.entries.searxng.config.webSearch.baseUrl` (anahtarsız/kendi barındırdığınız; barındırılan API faturalandırması yoktur)

Eski `tools.web.search.*` sağlayıcı yolları geçici uyumluluk shim'i üzerinden hâlâ yüklenir, ancak artık önerilen yapılandırma yüzeyi değildir.

**Brave Search ücretsiz kredisi:** Her Brave planı, yenilenen aylık \$5
ücretsiz kredi içerir. Search planı 1.000 istek başına \$5 tutar, bu nedenle kredi ücretsiz olarak
ayda 1.000 isteği kapsar. Beklenmeyen ücretlerden kaçınmak için Brave panosunda kullanım sınırınızı ayarlayın.

[Web araçları](/tr/tools/web) bölümüne bakın.

### 5) Web getirme aracı (Firecrawl)

`web_fetch`, API anahtarı mevcut olduğunda **Firecrawl** çağırabilir:

- `FIRECRAWL_API_KEY` veya `plugins.entries.firecrawl.config.webFetch.apiKey`

Firecrawl yapılandırılmamışsa araç, doğrudan getirme ve paketle gelen `web-readability` Plugin'ine geri döner (ücretli API yoktur). Yerel Readability çıkarımını atlamak için `plugins.entries.web-readability.enabled` değerini devre dışı bırakın.

[Web araçları](/tr/tools/web) bölümüne bakın.

### 6) Sağlayıcı kullanım anlık görüntüleri (durum/sağlık)

Bazı durum komutları, kota pencerelerini veya auth sağlığını görüntülemek için **sağlayıcı kullanım uç noktalarını** çağırır.
Bunlar genellikle düşük hacimli çağrılardır, ancak yine de sağlayıcı API'lerine gider:

- `openclaw status --usage`
- `openclaw models status --json`

[Modeller CLI](/tr/cli/models) bölümüne bakın.

### 7) Compaction güvenlik özeti

Compaction güvenlik mekanizması, **geçerli modeli** kullanarak oturum geçmişini özetleyebilir; bu da
çalıştığında sağlayıcı API'lerini çağırır.

[Oturum yönetimi + Compaction](/tr/reference/session-management-compaction) bölümüne bakın.

### 8) Model tarama / yoklama

`openclaw models scan`, OpenRouter modellerini yoklayabilir ve yoklama etkinleştirildiğinde `OPENROUTER_API_KEY` kullanır.

[Modeller CLI](/tr/cli/models) bölümüne bakın.

### 9) Konuşma (ses)

Konuşma modu, yapılandırıldığında **ElevenLabs** çağırabilir:

- `ELEVENLABS_API_KEY` veya `talk.providers.elevenlabs.apiKey`

[Konuşma modu](/tr/nodes/talk) bölümüne bakın.

### 10) Skills (üçüncü taraf API'ler)

Skills, `apiKey` değerini `skills.entries.<name>.apiKey` içinde saklayabilir. Bir skill bu anahtarı harici
API'ler için kullanırsa, skill'in sağlayıcısına göre maliyet oluşturabilir.

[Skills](/tr/tools/skills) bölümüne bakın.

## İlgili

- [Token kullanımı ve maliyetler](/tr/reference/token-use)
- [Prompt önbelleğe alma](/tr/reference/prompt-caching)
- [Kullanım izleme](/tr/concepts/usage-tracking)
