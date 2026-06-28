---
read_when:
    - Hangi özelliklerin ücretli API'leri çağırabileceğini anlamak istiyorsunuz
    - Anahtarları, maliyetleri ve kullanım görünürlüğünü denetlemeniz gerekir
    - /status veya /usage maliyet raporlamasını açıklıyorsunuz
summary: Hangi şeylerin para harcayabileceğini, hangi anahtarların kullanıldığını ve kullanımın nasıl görüntüleneceğini denetleyin
title: API kullanımı ve maliyetleri
x-i18n:
    generated_at: "2026-06-28T01:15:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 473028747c3e8eab60667106d22616aa185f867d01238b856f4235faad957a9e
    source_path: reference/api-usage-costs.md
    workflow: 16
---

Bu belge, **API anahtarlarını çağırabilen özellikleri** ve maliyetlerinin nerede göründüğünü listeler. Sağlayıcı kullanımı veya ücretli API çağrıları oluşturabilen OpenClaw özelliklerine odaklanır.

## Maliyetlerin göründüğü yerler (sohbet + CLI)

**Oturum başına maliyet anlık görüntüsü**

- `/status`, geçerli oturum modelini, bağlam kullanımını ve son yanıt tokenlarını gösterir.
- OpenClaw etkin model için kullanım metadatasına ve yerel fiyatlandırmaya sahipse,
  `/status` son yanıt için **tahmini maliyeti** de gösterir. Bu, Bedrock `aws-sdk` modelleri gibi açıkça fiyatlandırılmış API anahtarı gerektirmeyen sağlayıcıları içerebilir.
- Canlı oturum metadatası seyrekse, `/status` token/cache sayaçlarını ve etkin runtime model etiketini en son transkript kullanım girdisinden kurtarabilir. Mevcut sıfır olmayan canlı değerler yine önceliklidir ve saklanan toplamlar eksik ya da daha küçük olduğunda prompt boyutlu transkript toplamları geçerli olabilir.

**İleti başına maliyet alt bilgisi**

- `/usage full`, yerel fiyatlandırma etkin model için yapılandırıldığında ve kullanım metadatası mevcut olduğunda, **tahmini maliyet** dahil olmak üzere her yanıta bir kullanım alt bilgisi ekler.
- `/usage tokens` yalnızca tokenları gösterir; abonelik tarzı OAuth/token ve CLI akışları, ilgili runtime uyumlu kullanım metadatası sağlamadıkça ve açık bir yerel fiyat yapılandırılmadıkça yine yalnızca tokenları gösterir.
- Gemini CLI notu: varsayılan `stream-json` çıktısı ve eski JSON geçersiz kılmaları, kullanımı `stats` içinden okur, `stats.cached` değerini `cacheRead` olarak normalleştirir ve gerektiğinde giriş tokenlarını `stats.input_tokens - stats.cached` üzerinden türetir.

Anthropic notu: Anthropic çalışanları bize OpenClaw tarzı Claude CLI kullanımına yeniden izin verildiğini söyledi; bu nedenle OpenClaw, Anthropic yeni bir politika yayımlamadıkça Claude CLI yeniden kullanımını ve `claude -p` kullanımını bu entegrasyon için onaylı kabul eder. Anthropic hâlâ OpenClaw’ın `/usage full` içinde gösterebileceği ileti başına dolar tahmini sunmaz.

**CLI kullanım pencereleri (sağlayıcı kotaları)**

- `openclaw status --usage` ve `openclaw channels list`, sağlayıcı **kullanım pencerelerini** gösterir (ileti başına maliyet değil, kota anlık görüntüleri).
- İnsan tarafından okunabilir çıktı, sağlayıcılar genelinde `X% left` biçiminde normalleştirilir.
- Geçerli kullanım penceresi sağlayıcıları: Anthropic, GitHub Copilot, Gemini CLI, OpenAI Codex, MiniMax, Xiaomi ve z.ai.
- MiniMax notu: ham `usage_percent` / `usagePercent` alanları kalan kotayı ifade eder; bu nedenle OpenClaw bunları göstermeden önce tersine çevirir. Sayı tabanlı alanlar mevcut olduğunda yine önceliklidir. Sağlayıcı `model_remains` döndürürse, OpenClaw sohbet modeli girdisini tercih eder, gerektiğinde pencere etiketini zaman damgalarından türetir ve plan etiketine model adını dahil eder.
- Bu kota pencereleri için kullanım kimlik doğrulaması, mevcut olduğunda sağlayıcıya özgü hook’lardan gelir; aksi halde OpenClaw auth profillerinden, env’den veya config’ten eşleşen OAuth/API anahtarı kimlik bilgilerine geri döner.

Ayrıntılar ve örnekler için [Token kullanımı ve maliyetler](/tr/reference/token-use) sayfasına bakın.

## Anahtarlar nasıl keşfedilir?

OpenClaw kimlik bilgilerini şuralardan alabilir:

- **Auth profilleri** (ajan başına, `auth-profiles.json` içinde saklanır).
- **Ortam değişkenleri** (örn. `OPENAI_API_KEY`, `BRAVE_API_KEY`, `FIRECRAWL_API_KEY`).
- **Config** (`models.providers.*.apiKey`, `plugins.entries.*.config.webSearch.apiKey`,
  `plugins.entries.firecrawl.config.webFetch.apiKey`, `memorySearch.*`,
  `talk.providers.*.apiKey`).
- Skill işlem env’sine anahtar aktarabilen **Skills** (`skills.entries.<name>.apiKey`).

## Anahtar harcayabilen özellikler

### 1) Çekirdek model yanıtları (sohbet + araçlar)

Her yanıt veya araç çağrısı **geçerli model sağlayıcısını** kullanır (OpenAI, Anthropic vb). Bu, kullanım ve maliyetin birincil kaynağıdır.

Bu ayrıca OpenClaw’ın yerel arayüzü dışında faturalandırmaya devam eden abonelik tarzı barındırılan sağlayıcıları da içerir; örneğin **OpenAI Codex**, **Alibaba Cloud Model Studio Coding Plan**, **MiniMax Coding Plan**, **Z.AI / GLM Coding Plan** ve **Extra Usage** etkinleştirilmiş Anthropic’in OpenClaw Claude oturum açma yolu.

Fiyatlandırma yapılandırması için [Modeller](/tr/providers/models), görüntüleme için [Token kullanımı ve maliyetler](/tr/reference/token-use) sayfasına bakın.

### 2) Medya anlama (ses/görüntü/video)

Gelen medya, yanıt çalışmadan önce özetlenebilir veya yazıya dökülebilir. Bu, model/sağlayıcı API’lerini kullanır.

- Ses: OpenAI / Groq / Deepgram / DeepInfra / Google / Mistral.
- Görüntü: OpenAI / OpenRouter / Anthropic / DeepInfra / Google / MiniMax / Moonshot / Qwen / Z.AI.
- Video: Google / Qwen / Moonshot.

[Medya anlama](/tr/nodes/media-understanding) sayfasına bakın.

### 3) Görüntü ve video oluşturma

Paylaşılan oluşturma yetenekleri de sağlayıcı anahtarlarını harcayabilir:

- Görüntü oluşturma: OpenAI / Google / DeepInfra / fal / MiniMax
- Video oluşturma: DeepInfra / Qwen

Görüntü oluşturma, `agents.defaults.imageGenerationModel` ayarlanmamışsa auth destekli bir varsayılan sağlayıcı çıkarımı yapabilir. Video oluşturma şu anda `qwen/wan2.6-t2v` gibi açık bir `agents.defaults.videoGenerationModel` gerektirir.

[Görüntü oluşturma](/tr/tools/image-generation), [Qwen Cloud](/tr/providers/qwen) ve [Modeller](/tr/concepts/models) sayfalarına bakın.

### 4) Bellek embedding’leri + semantik arama

Semantik bellek araması, uzak sağlayıcılar için yapılandırıldığında **embedding API’lerini** kullanır:

- `memorySearch.provider = "openai"` → OpenAI embedding’leri
- `memorySearch.provider = "gemini"` → Gemini embedding’leri
- `memorySearch.provider = "voyage"` → Voyage embedding’leri
- `memorySearch.provider = "mistral"` → Mistral embedding’leri
- `memorySearch.provider = "deepinfra"` → DeepInfra embedding’leri
- `memorySearch.provider = "lmstudio"` → LM Studio embedding’leri (yerel/kendi barındırdığınız)
- `memorySearch.provider = "ollama"` → Ollama embedding’leri (yerel/kendi barındırdığınız; genellikle barındırılan API faturalandırması yoktur)
- Yerel embedding’ler başarısız olursa isteğe bağlı olarak uzak bir sağlayıcıya geri dönüş

`memorySearch.provider = "local"` ile yerel tutabilirsiniz (API kullanımı yok).

[Bellek](/tr/concepts/memory) sayfasına bakın.

### 5) Web arama aracı

`web_search`, sağlayıcınıza bağlı olarak kullanım ücretlerine yol açabilir:

- **Brave Search API**: `BRAVE_API_KEY` veya `plugins.entries.brave.config.webSearch.apiKey`
- **Exa**: `EXA_API_KEY` veya `plugins.entries.exa.config.webSearch.apiKey`
- **Firecrawl**: `FIRECRAWL_API_KEY` veya `plugins.entries.firecrawl.config.webSearch.apiKey`
- **Gemini (Google Search)**: `GEMINI_API_KEY` veya `plugins.entries.google.config.webSearch.apiKey`
- **Grok (xAI)**: xAI OAuth profili, `XAI_API_KEY` veya `plugins.entries.xai.config.webSearch.apiKey`
- **Kimi (Moonshot)**: `KIMI_API_KEY`, `MOONSHOT_API_KEY` veya `plugins.entries.moonshot.config.webSearch.apiKey`
- **MiniMax Search**: `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`, `MINIMAX_API_KEY` veya `plugins.entries.minimax.config.webSearch.apiKey`
- **Ollama Web Search**: erişilebilir ve oturum açılmış yerel bir Ollama ana makinesi için anahtarsızdır; doğrudan `https://ollama.com` araması `OLLAMA_API_KEY` kullanır ve auth korumalı ana makineler normal Ollama sağlayıcı bearer auth bilgisini yeniden kullanabilir
- **Perplexity Search API**: `PERPLEXITY_API_KEY`, `OPENROUTER_API_KEY` veya `plugins.entries.perplexity.config.webSearch.apiKey`
- **Tavily**: `TAVILY_API_KEY` veya `plugins.entries.tavily.config.webSearch.apiKey`
- **DuckDuckGo**: açıkça seçildiğinde anahtarsız sağlayıcıdır (API faturalandırması yoktur, ancak resmi değildir ve HTML tabanlıdır)
- **SearXNG**: `SEARXNG_BASE_URL` veya `plugins.entries.searxng.config.webSearch.baseUrl` (anahtarsız/kendi barındırdığınız; barındırılan API faturalandırması yoktur)

Eski `tools.web.search.*` sağlayıcı yolları geçici uyumluluk shim’i üzerinden yüklenmeye devam eder, ancak artık önerilen config yüzeyi değildir.

**Brave Search ücretsiz kredisi:** Her Brave planı, yenilenen aylık \$5 ücretsiz kredi içerir. Search planı 1.000 istek başına \$5 tutarındadır; bu nedenle kredi, ayda 1.000 isteği ücretsiz karşılar. Beklenmeyen ücretlerden kaçınmak için Brave panosunda kullanım limitinizi ayarlayın.

[Web araçları](/tr/tools/web) sayfasına bakın.

### 5) Web getirme aracı (Firecrawl)

`web_fetch`, anahtarsız başlangıç erişimiyle **Firecrawl** çağırabilir. Daha yüksek limitler için API anahtarı ekleyin:

- `FIRECRAWL_API_KEY` veya `plugins.entries.firecrawl.config.webFetch.apiKey`

Firecrawl yapılandırılmamışsa, araç doğrudan getirme ve paketli `web-readability` Plugin’ine geri döner (ücretli API yoktur). Yerel Readability çıkarımını atlamak için `plugins.entries.web-readability.enabled` değerini devre dışı bırakın.

[Web araçları](/tr/tools/web) sayfasına bakın.

### 6) Sağlayıcı kullanım anlık görüntüleri (durum/sağlık)

Bazı durum komutları, kota pencerelerini veya auth sağlığını göstermek için **sağlayıcı kullanım uç noktalarını** çağırır. Bunlar genellikle düşük hacimli çağrılardır, ancak yine de sağlayıcı API’lerine erişir:

- `openclaw status --usage`
- `openclaw models status --json`

[Modeller CLI](/tr/cli/models) sayfasına bakın.

### 7) Compaction koruma özetlemesi

Compaction koruması, oturum geçmişini **geçerli modeli** kullanarak özetleyebilir; çalıştığında sağlayıcı API’lerini çağırır.

[Oturum yönetimi + Compaction](/tr/reference/session-management-compaction) sayfasına bakın.

### 8) Model tarama / yoklama

`openclaw models scan`, OpenRouter modellerini yoklayabilir ve yoklama etkinleştirildiğinde `OPENROUTER_API_KEY` kullanır.

[Modeller CLI](/tr/cli/models) sayfasına bakın.

### 9) Talk (konuşma)

Talk modu yapılandırıldığında **ElevenLabs** çağırabilir:

- `ELEVENLABS_API_KEY` veya `talk.providers.elevenlabs.apiKey`

[Talk modu](/tr/nodes/talk) sayfasına bakın.

### 10) Skills (üçüncü taraf API’leri)

Skills, `skills.entries.<name>.apiKey` içinde `apiKey` saklayabilir. Bir skill bu anahtarı harici API’ler için kullanırsa, skill’in sağlayıcısına göre maliyet doğurabilir.

[Skills](/tr/tools/skills) sayfasına bakın.

## İlgili

- [Token kullanımı ve maliyetler](/tr/reference/token-use)
- [Prompt caching](/tr/reference/prompt-caching)
- [Kullanım takibi](/tr/concepts/usage-tracking)
