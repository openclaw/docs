---
read_when:
    - Hangi özelliklerin ücretli API'leri çağırabileceğini anlamak istiyorsunuz
    - Anahtarları, maliyetleri ve kullanım görünürlüğünü denetlemeniz gerekiyor
    - /status veya /usage maliyet raporlamasını açıklıyorsunuz
summary: Nelerin para harcayabileceğini, hangi anahtarların kullanıldığını ve kullanımın nasıl görüntüleneceğini denetleyin
title: API Kullanımı ve Maliyetler
x-i18n:
    generated_at: "2026-04-05T14:06:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 71789950fe54dcdcd3e34c8ad6e3143f749cdfff5bbc2f14be4b85aaa467b14c
    source_path: reference/api-usage-costs.md
    workflow: 15
---

# API kullanımı ve maliyetler

Bu belge, **API anahtarlarını çağırabilen özellikleri** ve bunların maliyetlerinin nerede göründüğünü listeler. Provider kullanımı veya ücretli API çağrıları oluşturabilen OpenClaw özelliklerine odaklanır.

## Maliyetlerin göründüğü yerler (sohbet + CLI)

**Oturum başına maliyet özeti**

- `/status`, mevcut oturum modelini, bağlam kullanımını ve son yanıtın token sayılarını gösterir.
- Model **API anahtarı kimlik doğrulaması** kullanıyorsa, `/status` son yanıt için **tahmini maliyeti** de gösterir.
- Canlı oturum meta verileri seyrekse, `/status` en son transkript kullanım girdisinden token/önbellek sayaçlarını ve etkin çalışma zamanı model etiketini geri alabilir. Mevcut sıfır olmayan canlı değerler yine önceliklidir ve depolanan toplamlar eksik veya daha küçükse istem boyutundaki transkript toplamları kazanabilir.

**Mesaj başına maliyet alt bilgisi**

- `/usage full`, her yanıta **tahmini maliyet** dahil bir kullanım alt bilgisi ekler (yalnızca API anahtarı).
- `/usage tokens` yalnızca token'ları gösterir; abonelik tarzı OAuth/token ve CLI akışları dolar maliyetini gizler.
- Gemini CLI notu: CLI JSON çıktısı döndürdüğünde, OpenClaw kullanımı `stats` alanından okur, `stats.cached` değerini `cacheRead` olarak normalize eder ve gerektiğinde giriş token'larını `stats.input_tokens - stats.cached` ile türetir.

Anthropic notu: Anthropic'in herkese açık Claude Code belgeleri hâlâ doğrudan Claude Code terminal kullanımını Claude plan limitlerine dahil eder. Ayrıca Anthropic, OpenClaw kullanıcılarına **4 Nisan 2026 saat 12:00 PT / 20:00 BST** itibarıyla **OpenClaw** Claude oturum açma yolunun üçüncü taraf harness kullanımı olarak sayıldığını ve abonelikten ayrı olarak faturalandırılan **Extra Usage** gerektirdiğini bildirdi. Anthropic, OpenClaw'ın `/usage full` içinde gösterebileceği mesaj başına dolar tahmini sunmaz.

**CLI kullanım pencereleri (provider kotaları)**

- `openclaw status --usage` ve `openclaw channels list`, provider **kullanım pencerelerini** gösterir (mesaj başına maliyet değil, kota özetleri).
- İnsan tarafından okunabilir çıktı, provider'lar arasında `X% kaldı` biçimine normalize edilir.
- Mevcut kullanım penceresi provider'ları: Anthropic, GitHub Copilot, Gemini CLI, OpenAI Codex, MiniMax, Xiaomi ve z.ai.
- MiniMax notu: ham `usage_percent` / `usagePercent` alanları kalan kotayı ifade eder, bu nedenle OpenClaw bunları görüntülemeden önce tersine çevirir. Sayı tabanlı alanlar varsa yine önceliklidir. Provider `model_remains` döndürürse, OpenClaw sohbet modeli girdisini tercih eder, gerektiğinde zaman damgalarından pencere etiketini türetir ve plan etiketine model adını dahil eder.
- Bu kota pencereleri için kullanım kimlik doğrulaması, mümkün olduğunda provider'a özgü hook'lardan gelir; aksi takdirde OpenClaw auth profillerinden, ortamdan veya config'den eşleşen OAuth/API anahtarı kimlik bilgilerine geri döner.

Ayrıntılar ve örnekler için [Token kullanımı ve maliyetler](/reference/token-use) bölümüne bakın.

## Anahtarlar nasıl keşfedilir

OpenClaw kimlik bilgilerini şuralardan alabilir:

- **Auth profilleri** (ajan başına, `auth-profiles.json` içinde depolanır).
- **Ortam değişkenleri** (ör. `OPENAI_API_KEY`, `BRAVE_API_KEY`, `FIRECRAWL_API_KEY`).
- **Config** (`models.providers.*.apiKey`, `plugins.entries.*.config.webSearch.apiKey`, `plugins.entries.firecrawl.config.webFetch.apiKey`, `memorySearch.*`, `talk.providers.*.apiKey`).
- **Skills** (`skills.entries.<name>.apiKey`), bunlar anahtarları skill işlem ortamı değişkenlerine aktarabilir.

## Anahtar harcayabilen özellikler

### 1) Çekirdek model yanıtları (sohbet + araçlar)

Her yanıt veya araç çağrısı **geçerli model provider'ını** (OpenAI, Anthropic vb.) kullanır. Bu, kullanım ve maliyetin birincil kaynağıdır.

Buna, OpenClaw'ın yerel kullanıcı arayüzü dışında yine de faturalandırılan abonelik tarzı barındırılan provider'lar da dahildir; örneğin **OpenAI Codex**, **Alibaba Cloud Model Studio Coding Plan**, **MiniMax Coding Plan**, **Z.AI / GLM Coding Plan** ve **Extra Usage** etkinleştirilmiş Anthropic OpenClaw Claude oturum açma yolu.

Fiyatlandırma config'i için [Models](/tr/providers/models), görüntüleme için [Token kullanımı ve maliyetler](/reference/token-use) bölümüne bakın.

### 2) Medya anlama (ses/görüntü/video)

Gelen medya, yanıt çalışmadan önce özetlenebilir veya yazıya dökülebilir. Bu, model/provider API'lerini kullanır.

- Ses: OpenAI / Groq / Deepgram / Google / Mistral.
- Görüntü: OpenAI / OpenRouter / Anthropic / Google / MiniMax / Moonshot / Qwen / Z.AI.
- Video: Google / Qwen / Moonshot.

Bkz. [Medya anlama](/tr/nodes/media-understanding).

### 3) Görüntü ve video üretimi

Paylaşılan üretim yetenekleri de provider anahtarlarını harcayabilir:

- Görüntü üretimi: OpenAI / Google / fal / MiniMax
- Video üretimi: Qwen

Görüntü üretimi, `agents.defaults.imageGenerationModel` ayarlanmamışsa kimlik doğrulama destekli varsayılan bir provider çıkarımı yapabilir. Video üretimi şu anda `qwen/wan2.6-t2v` gibi açık bir `agents.defaults.videoGenerationModel` gerektirir.

Bkz. [Image generation](/tools/image-generation), [Qwen Cloud](/tr/providers/qwen) ve [Models](/tr/concepts/models).

### 4) Bellek gömmeleri + anlamsal arama

Anlamsal bellek araması, uzak provider'lar için yapılandırıldığında **gömme API'lerini** kullanır:

- `memorySearch.provider = "openai"` → OpenAI embeddings
- `memorySearch.provider = "gemini"` → Gemini embeddings
- `memorySearch.provider = "voyage"` → Voyage embeddings
- `memorySearch.provider = "mistral"` → Mistral embeddings
- `memorySearch.provider = "ollama"` → Ollama embeddings (yerel/kendi barındırdığınız; genellikle barındırılan API faturası yoktur)
- Yerel gömmeler başarısız olursa uzak provider'a isteğe bağlı geri dönüş

`memorySearch.provider = "local"` ile bunu yerel tutabilirsiniz (API kullanımı yok).

Bkz. [Memory](/tr/concepts/memory).

### 5) Web arama aracı

`web_search`, provider'ınıza bağlı olarak kullanım ücretleri doğurabilir:

- **Brave Search API**: `BRAVE_API_KEY` veya `plugins.entries.brave.config.webSearch.apiKey`
- **Exa**: `EXA_API_KEY` veya `plugins.entries.exa.config.webSearch.apiKey`
- **Firecrawl**: `FIRECRAWL_API_KEY` veya `plugins.entries.firecrawl.config.webSearch.apiKey`
- **Gemini (Google Search)**: `GEMINI_API_KEY` veya `plugins.entries.google.config.webSearch.apiKey`
- **Grok (xAI)**: `XAI_API_KEY` veya `plugins.entries.xai.config.webSearch.apiKey`
- **Kimi (Moonshot)**: `KIMI_API_KEY`, `MOONSHOT_API_KEY` veya `plugins.entries.moonshot.config.webSearch.apiKey`
- **MiniMax Search**: `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`, `MINIMAX_API_KEY` veya `plugins.entries.minimax.config.webSearch.apiKey`
- **Ollama Web Search**: varsayılan olarak anahtar gerektirmez, ancak erişilebilir bir Ollama ana makinesi ve `ollama signin` gerektirir; ana makine gerektiriyorsa normal Ollama provider bearer kimlik doğrulamasını da yeniden kullanabilir
- **Perplexity Search API**: `PERPLEXITY_API_KEY`, `OPENROUTER_API_KEY` veya `plugins.entries.perplexity.config.webSearch.apiKey`
- **Tavily**: `TAVILY_API_KEY` veya `plugins.entries.tavily.config.webSearch.apiKey`
- **DuckDuckGo**: anahtarsız geri dönüş seçeneği (API faturası yok, ancak resmi değildir ve HTML tabanlıdır)
- **SearXNG**: `SEARXNG_BASE_URL` veya `plugins.entries.searxng.config.webSearch.baseUrl` (anahtarsız/kendi barındırdığınız; barındırılan API faturası yok)

Eski `tools.web.search.*` provider yolları geçici uyumluluk shim'i üzerinden hâlâ yüklenir, ancak artık önerilen config yüzeyi değildir.

**Brave Search ücretsiz kredi:** Her Brave planı, her ay yenilenen 5 ABD doları ücretsiz kredi içerir. Search planı 1.000 istek başına 5 ABD dolarına mal olur, bu nedenle kredi ek ücret olmadan ayda 1.000 isteği karşılar. Beklenmedik ücretlerden kaçınmak için kullanım sınırınızı Brave panosunda ayarlayın.

Bkz. [Web tools](/tools/web).

### 5) Web getirme aracı (Firecrawl)

`web_fetch`, bir API anahtarı mevcut olduğunda **Firecrawl** çağırabilir:

- `FIRECRAWL_API_KEY` veya `plugins.entries.firecrawl.config.webFetch.apiKey`

Firecrawl yapılandırılmamışsa, araç doğrudan fetch + readability'ye geri döner (ücretli API yok).

Bkz. [Web tools](/tools/web).

### 6) Provider kullanım anlık görüntüleri (durum/sağlık)

Bazı durum komutları, kota pencerelerini veya auth sağlığını göstermek için **provider kullanım uç noktalarını** çağırır. Bunlar genellikle düşük hacimli çağrılardır, ancak yine de provider API'lerine istek atarlar:

- `openclaw status --usage`
- `openclaw models status --json`

Bkz. [Models CLI](/cli/models).

### 7) Sıkıştırma koruması özetleme

Sıkıştırma koruması, oturum geçmişini **geçerli model** kullanarak özetleyebilir; bu çalıştığında provider API'lerini çağırır.

Bkz. [Oturum yönetimi + sıkıştırma](/reference/session-management-compaction).

### 8) Model tarama / yoklama

`openclaw models scan`, OpenRouter modellerini yoklayabilir ve yoklama etkinleştirildiğinde `OPENROUTER_API_KEY` kullanır.

Bkz. [Models CLI](/cli/models).

### 9) Talk (konuşma)

Talk modu, yapılandırıldığında **ElevenLabs** çağırabilir:

- `ELEVENLABS_API_KEY` veya `talk.providers.elevenlabs.apiKey`

Bkz. [Talk mode](/tr/nodes/talk).

### 10) Skills (üçüncü taraf API'ler)

Skills, `skills.entries.<name>.apiKey` içinde `apiKey` depolayabilir. Bir skill bu anahtarı harici API'ler için kullanıyorsa, o skill'in provider'ına göre maliyet oluşturabilir.

Bkz. [Skills](/tools/skills).
