---
read_when:
    - Hangi özelliklerin ücretli API'leri çağırabileceğini anlamak istiyorsunuz
    - Anahtarları, maliyetleri ve kullanım görünürlüğünü denetlemeniz gerekir
    - /status veya /usage maliyet raporlamasını açıklıyorsunuz
summary: Nelerin para harcayabileceğini, hangi anahtarların kullanıldığını ve kullanımın nasıl görüntüleneceğini denetleyin
title: API kullanımı ve maliyetleri
x-i18n:
    generated_at: "2026-04-30T09:43:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5638007a77a93701ce4ed9139a6c4377c951e2d69941423c3e1b19b5bd52d5d5
    source_path: reference/api-usage-costs.md
    workflow: 16
---

# API kullanımı ve maliyetler

Bu belge, **API anahtarlarını çağırabilen özellikleri** ve maliyetlerinin nerede göründüğünü listeler. OpenClaw içinde sağlayıcı kullanımı veya ücretli API çağrıları oluşturabilen özelliklere odaklanır.

## Maliyetlerin göründüğü yerler (sohbet + CLI)

**Oturum başına maliyet anlık görüntüsü**

- `/status`, geçerli oturum modelini, bağlam kullanımını ve son yanıt tokenlarını gösterir.
- Model **API anahtarı kimlik doğrulaması** kullanıyorsa `/status`, son yanıt için **tahmini maliyeti** de gösterir.
- Canlı oturum meta verileri sınırlıysa `/status`, en son transkript kullanımı girdisinden token/cache sayaçlarını ve etkin çalışma zamanı model etiketini kurtarabilir. Mevcut sıfırdan büyük canlı değerler yine önceliklidir ve kayıtlı toplamlar eksik veya daha küçük olduğunda istem boyutundaki transkript toplamları öne geçebilir.

**İleti başına maliyet alt bilgisi**

- `/usage full`, her yanıta **tahmini maliyeti** de içeren bir kullanım alt bilgisi ekler (yalnızca API anahtarı).
- `/usage tokens` yalnızca tokenları gösterir; abonelik tarzı OAuth/token ve CLI akışları dolar maliyetini gizler.
- Gemini CLI notu: CLI JSON çıktısı döndürdüğünde OpenClaw kullanımı `stats` alanından okur, `stats.cached` değerini `cacheRead` olarak normalleştirir ve gerektiğinde giriş tokenlarını `stats.input_tokens - stats.cached` üzerinden türetir.

Anthropic notu: Anthropic çalışanları bize OpenClaw tarzı Claude CLI kullanımına yeniden izin verildiğini söyledi; bu nedenle OpenClaw, Anthropic yeni bir politika yayımlamadığı sürece bu entegrasyon için Claude CLI yeniden kullanımını ve `claude -p` kullanımını onaylanmış kabul eder. Anthropic hâlâ OpenClaw'un `/usage full` içinde gösterebileceği ileti başına dolar tahminini sağlamaz.

**CLI kullanım pencereleri (sağlayıcı kotaları)**

- `openclaw status --usage` ve `openclaw channels list`, sağlayıcı **kullanım pencerelerini** gösterir (kota anlık görüntüleri; ileti başına maliyetler değil).
- İnsan okunur çıktı, sağlayıcılar genelinde `X% left` biçimine normalleştirilir.
- Geçerli kullanım penceresi sağlayıcıları: Anthropic, GitHub Copilot, Gemini CLI, OpenAI Codex, MiniMax, Xiaomi ve z.ai.
- MiniMax notu: Ham `usage_percent` / `usagePercent` alanları kalan kotayı ifade eder; bu nedenle OpenClaw bunları gösterimden önce tersine çevirir. Sayı tabanlı alanlar mevcut olduğunda yine önceliklidir. Sağlayıcı `model_remains` döndürürse OpenClaw sohbet modeli girdisini tercih eder, gerektiğinde pencere etiketini zaman damgalarından türetir ve plan etiketine model adını ekler.
- Bu kota pencereleri için kullanım kimlik doğrulaması, mevcut olduğunda sağlayıcıya özgü hook'lardan gelir; aksi halde OpenClaw auth profillerinden, ortamdan veya yapılandırmadan eşleşen OAuth/API anahtarı kimlik bilgilerine geri döner.

Ayrıntılar ve örnekler için [Token kullanımı ve maliyetler](/tr/reference/token-use) bölümüne bakın.

## Anahtarlar nasıl keşfedilir

OpenClaw kimlik bilgilerini şuralardan alabilir:

- **Auth profilleri** (ajan başına, `auth-profiles.json` içinde saklanır).
- **Ortam değişkenleri** (örn. `OPENAI_API_KEY`, `BRAVE_API_KEY`, `FIRECRAWL_API_KEY`).
- **Yapılandırma** (`models.providers.*.apiKey`, `plugins.entries.*.config.webSearch.apiKey`, `plugins.entries.firecrawl.config.webFetch.apiKey`, `memorySearch.*`, `talk.providers.*.apiKey`).
- **Skills** (`skills.entries.<name>.apiKey`), anahtarları skill süreç ortamına dışa aktarabilir.

## Anahtar harcayabilen özellikler

### 1) Temel model yanıtları (sohbet + araçlar)

Her yanıt veya araç çağrısı **geçerli model sağlayıcısını** kullanır (OpenAI, Anthropic vb.). Bu, kullanım ve maliyetin birincil kaynağıdır.

Buna, maliyeti yine OpenClaw'un yerel kullanıcı arayüzü dışında faturalandırılan abonelik tarzı barındırılan sağlayıcılar da dahildir; örneğin **OpenAI Codex**, **Alibaba Cloud Model Studio Coding Plan**, **MiniMax Coding Plan**, **Z.AI / GLM Coding Plan** ve **Extra Usage** etkinleştirilmiş Anthropic'in OpenClaw Claude oturum açma yolu.

Fiyatlandırma yapılandırması için [Modeller](/tr/providers/models), görüntüleme için [Token kullanımı ve maliyetler](/tr/reference/token-use) bölümüne bakın.

### 2) Medya anlama (ses/görüntü/video)

Gelen medya, yanıt çalışmadan önce özetlenebilir veya yazıya dökülebilir. Bu, model/sağlayıcı API'lerini kullanır.

- Ses: OpenAI / Groq / Deepgram / DeepInfra / Google / Mistral.
- Görüntü: OpenAI / OpenRouter / Anthropic / DeepInfra / Google / MiniMax / Moonshot / Qwen / Z.AI.
- Video: Google / Qwen / Moonshot.

Bkz. [Medya anlama](/tr/nodes/media-understanding).

### 3) Görüntü ve video oluşturma

Paylaşılan oluşturma yetenekleri de sağlayıcı anahtarlarını harcayabilir:

- Görüntü oluşturma: OpenAI / Google / DeepInfra / fal / MiniMax
- Video oluşturma: DeepInfra / Qwen

Görüntü oluşturma, `agents.defaults.imageGenerationModel` ayarlanmamışsa auth destekli bir sağlayıcı varsayılanını çıkarımlayabilir. Video oluşturma şu anda `qwen/wan2.6-t2v` gibi açık bir `agents.defaults.videoGenerationModel` gerektirir.

Bkz. [Görüntü oluşturma](/tr/tools/image-generation), [Qwen Cloud](/tr/providers/qwen) ve [Modeller](/tr/concepts/models).

### 4) Bellek embedding'leri + semantik arama

Semantik bellek araması, uzak sağlayıcılar için yapılandırıldığında **embedding API'lerini** kullanır:

- `memorySearch.provider = "openai"` → OpenAI embedding'leri
- `memorySearch.provider = "gemini"` → Gemini embedding'leri
- `memorySearch.provider = "voyage"` → Voyage embedding'leri
- `memorySearch.provider = "mistral"` → Mistral embedding'leri
- `memorySearch.provider = "deepinfra"` → DeepInfra embedding'leri
- `memorySearch.provider = "lmstudio"` → LM Studio embedding'leri (yerel/kendi barındırmalı)
- `memorySearch.provider = "ollama"` → Ollama embedding'leri (yerel/kendi barındırmalı; genellikle barındırılan API faturalandırması yoktur)
- Yerel embedding'ler başarısız olursa isteğe bağlı olarak uzak bir sağlayıcıya geri dönme

`memorySearch.provider = "local"` ile yerel tutabilirsiniz (API kullanımı yok).

Bkz. [Bellek](/tr/concepts/memory).

### 5) Web arama aracı

`web_search`, sağlayıcınıza bağlı olarak kullanım ücreti doğurabilir:

- **Brave Search API**: `BRAVE_API_KEY` veya `plugins.entries.brave.config.webSearch.apiKey`
- **Exa**: `EXA_API_KEY` veya `plugins.entries.exa.config.webSearch.apiKey`
- **Firecrawl**: `FIRECRAWL_API_KEY` veya `plugins.entries.firecrawl.config.webSearch.apiKey`
- **Gemini (Google Search)**: `GEMINI_API_KEY` veya `plugins.entries.google.config.webSearch.apiKey`
- **Grok (xAI)**: `XAI_API_KEY` veya `plugins.entries.xai.config.webSearch.apiKey`
- **Kimi (Moonshot)**: `KIMI_API_KEY`, `MOONSHOT_API_KEY` veya `plugins.entries.moonshot.config.webSearch.apiKey`
- **MiniMax Search**: `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`, `MINIMAX_API_KEY` veya `plugins.entries.minimax.config.webSearch.apiKey`
- **Ollama Web Search**: Erişilebilir, oturum açılmış yerel bir Ollama ana makinesi için anahtarsızdır; doğrudan `https://ollama.com` araması `OLLAMA_API_KEY` kullanır ve kimlik doğrulamasıyla korunan ana makineler normal Ollama sağlayıcı bearer auth bilgisini yeniden kullanabilir
- **Perplexity Search API**: `PERPLEXITY_API_KEY`, `OPENROUTER_API_KEY` veya `plugins.entries.perplexity.config.webSearch.apiKey`
- **Tavily**: `TAVILY_API_KEY` veya `plugins.entries.tavily.config.webSearch.apiKey`
- **DuckDuckGo**: anahtarsız geri dönüş (API faturalandırması yoktur, ancak resmi değildir ve HTML tabanlıdır)
- **SearXNG**: `SEARXNG_BASE_URL` veya `plugins.entries.searxng.config.webSearch.baseUrl` (anahtarsız/kendi barındırmalı; barındırılan API faturalandırması yoktur)

Eski `tools.web.search.*` sağlayıcı yolları geçici uyumluluk shim'i üzerinden hâlâ yüklenir, ancak artık önerilen yapılandırma yüzeyi değildir.

**Brave Search ücretsiz kredisi:** Her Brave planı, yenilenen \$5/ay ücretsiz kredi içerir. Search planı 1.000 istek başına \$5 tutarındadır; bu nedenle kredi, ayda 1.000 isteği ücretsiz karşılar. Beklenmeyen ücretlerden kaçınmak için kullanım limitinizi Brave panosunda ayarlayın.

Bkz. [Web araçları](/tr/tools/web).

### 5) Web fetch aracı (Firecrawl)

`web_fetch`, bir API anahtarı mevcut olduğunda **Firecrawl** çağırabilir:

- `FIRECRAWL_API_KEY` veya `plugins.entries.firecrawl.config.webFetch.apiKey`

Firecrawl yapılandırılmamışsa araç, doğrudan fetch ve birlikte gelen `web-readability` Plugin'ine geri döner (ücretli API yok). Yerel Readability çıkarımını atlamak için `plugins.entries.web-readability.enabled` değerini devre dışı bırakın.

Bkz. [Web araçları](/tr/tools/web).

### 6) Sağlayıcı kullanım anlık görüntüleri (durum/sağlık)

Bazı durum komutları, kota pencerelerini veya auth sağlığını göstermek için **sağlayıcı kullanım uç noktalarını** çağırır. Bunlar genellikle düşük hacimli çağrılardır, ancak yine de sağlayıcı API'lerine gider:

- `openclaw status --usage`
- `openclaw models status --json`

Bkz. [Modeller CLI](/tr/cli/models).

### 7) Compaction koruma özeti

Compaction koruması, oturum geçmişini **geçerli modeli** kullanarak özetleyebilir; çalıştığında sağlayıcı API'lerini çağırır.

Bkz. [Oturum yönetimi + Compaction](/tr/reference/session-management-compaction).

### 8) Model taraması / yoklama

`openclaw models scan`, OpenRouter modellerini yoklayabilir ve yoklama etkinleştirildiğinde `OPENROUTER_API_KEY` kullanır.

Bkz. [Modeller CLI](/tr/cli/models).

### 9) Talk (konuşma)

Talk modu, yapılandırıldığında **ElevenLabs** çağırabilir:

- `ELEVENLABS_API_KEY` veya `talk.providers.elevenlabs.apiKey`

Bkz. [Talk modu](/tr/nodes/talk).

### 10) Skills (üçüncü taraf API'ler)

Skills, `apiKey` değerini `skills.entries.<name>.apiKey` içinde saklayabilir. Bir skill bu anahtarı harici API'ler için kullanırsa skill'in sağlayıcısına göre maliyet doğurabilir.

Bkz. [Skills](/tr/tools/skills).

## İlgili

- [Token kullanımı ve maliyetler](/tr/reference/token-use)
- [İstem önbelleğe alma](/tr/reference/prompt-caching)
- [Kullanım izleme](/tr/concepts/usage-tracking)
