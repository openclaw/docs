---
read_when:
    - Hangi özelliklerin ücretli API'leri çağırabileceğini anlamak istiyorsunuz
    - Anahtarları, maliyetleri ve kullanım görünürlüğünü denetlemeniz gerekiyor
    - '`/status` veya `/usage cost` raporlamasını açıklıyorsunuz'
summary: Nelerin para harcayabileceğini, hangi anahtarların kullanıldığını ve kullanımın nasıl görüntüleneceğini denetleyin
title: API kullanımı ve maliyetler
x-i18n:
    generated_at: "2026-04-24T09:29:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: d44b34a782a4090a074c49b91df3fa9733f13f16b3d39258b6cf57cf24043f43
    source_path: reference/api-usage-costs.md
    workflow: 15
---

# API kullanımı ve maliyetler

Bu belge, **API anahtarlarını çağırabilen özellikleri** ve maliyetlerinin nerede göründüğünü listeler. OpenClaw özelliklerinden
sağlayıcı kullanımı veya ücretli API çağrıları üretebilenlere odaklanır.

## Maliyetler nerede görünür (sohbet + CLI)

**Oturum başına maliyet anlık görüntüsü**

- `/status`, geçerli oturum modelini, bağlam kullanımını ve son yanıt token'larını gösterir.
- Model **API anahtarı auth** kullanıyorsa, `/status` ayrıca son yanıt için **tahmini maliyeti** de gösterir.
- Canlı oturum meta verileri seyrekse, `/status` en son transcript kullanım
  girdisinden token/cache sayaçlarını ve etkin çalışma zamanı model etiketini
  geri getirebilir. Mevcut sıfır olmayan canlı değerler yine de öncelikli olur ve prompt boyutlu
  transcript toplamları, saklanan toplamlar eksikse veya daha küçükse kazanabilir.

**Mesaj başına maliyet dipnotu**

- `/usage full`, her yanıta **tahmini maliyet**i (yalnızca API anahtarı) de içeren bir kullanım dipnotu ekler.
- `/usage tokens` yalnızca token'ları gösterir; abonelik tarzı OAuth/token ve CLI akışları dolar maliyetini gizler.
- Gemini CLI notu: CLI JSON çıktısı döndürdüğünde OpenClaw kullanımı
  `stats` üzerinden okur, `stats.cached` değerini `cacheRead` olarak normalize eder ve gerektiğinde girdi token'larını
  `stats.input_tokens - stats.cached` üzerinden türetir.

Anthropic notu: Anthropic çalışanları bize OpenClaw tarzı Claude CLI kullanımının
yeniden izinli olduğunu söyledi, bu yüzden OpenClaw Claude CLI yeniden kullanımını ve `claude -p` kullanımını
Anthropic yeni bir ilke yayımlamadığı sürece bu entegrasyon için
izinli kabul eder.
Anthropic hâlâ OpenClaw'ın
`/usage full` içinde gösterebileceği mesaj başına dolar tahmini sunmaz.

**CLI kullanım pencereleri (sağlayıcı kotaları)**

- `openclaw status --usage` ve `openclaw channels list`, sağlayıcı **kullanım pencerelerini**
  gösterir (mesaj başına maliyet değil, kota anlık görüntüleri).
- İnsan tarafından okunabilir çıktı, sağlayıcılar arasında `X% left` biçimine normalize edilir.
- Geçerli kullanım penceresi sağlayıcıları: Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi ve z.ai.
- MiniMax notu: ham `usage_percent` / `usagePercent` alanları kalan
  kotayı ifade eder, bu yüzden OpenClaw bunları gösterim öncesi ters çevirir. Sayı tabanlı alanlar mevcutsa yine de önceliklidir.
  Sağlayıcı `model_remains` döndürürse, OpenClaw sohbet-model girdisini tercih eder, gerektiğinde pencere etiketini zaman damgalarından türetir ve model adını plan etiketine dahil eder.
- Bu kota pencereleri için kullanım auth'u, mevcut olduğunda sağlayıcıya özgü kancalardan gelir; aksi hâlde OpenClaw, auth profilleri, env veya config içindeki eşleşen OAuth/API anahtarı
  kimlik bilgilerine fallback yapar.

Ayrıntılar ve örnekler için bkz. [Token use & costs](/tr/reference/token-use).

## Anahtarlar nasıl keşfedilir

OpenClaw kimlik bilgilerini şuralardan alabilir:

- **Auth profilleri** (aracı başına, `auth-profiles.json` içinde saklanır).
- **Ortam değişkenleri** (ör. `OPENAI_API_KEY`, `BRAVE_API_KEY`, `FIRECRAWL_API_KEY`).
- **Config** (`models.providers.*.apiKey`, `plugins.entries.*.config.webSearch.apiKey`,
  `plugins.entries.firecrawl.config.webFetch.apiKey`, `memorySearch.*`,
  `talk.providers.*.apiKey`).
- **Skills** (`skills.entries.<name>.apiKey`) anahtarları Skill süreç env'ine aktarabilir.

## Anahtar harcayabilecek özellikler

### 1) Çekirdek model yanıtları (sohbet + araçlar)

Her yanıt veya araç çağrısı **geçerli model sağlayıcısını** kullanır (OpenAI, Anthropic vb.). Bu,
kullanım ve maliyetin birincil kaynağıdır.

Buna, OpenClaw'ın yerel UI'ı dışında yine de faturalandırılan
abonelik tarzı barındırılan sağlayıcılar da dahildir; örneğin **OpenAI Codex**, **Alibaba Cloud Model Studio
Coding Plan**, **MiniMax Coding Plan**, **Z.AI / GLM Coding Plan** ve
**Extra Usage** etkin Anthropic'in OpenClaw Claude-giriş yolu.

Fiyatlandırma config'i için bkz. [Models](/tr/providers/models), gösterim için [Token use & costs](/tr/reference/token-use).

### 2) Medya anlama (ses/görsel/video)

Gelen medya, yanıt çalıştırılmadan önce özetlenebilir/transkribe edilebilir. Bu, model/sağlayıcı API'lerini kullanır.

- Ses: OpenAI / Groq / Deepgram / Google / Mistral.
- Görsel: OpenAI / OpenRouter / Anthropic / Google / MiniMax / Moonshot / Qwen / Z.AI.
- Video: Google / Qwen / Moonshot.

Bkz. [Media understanding](/tr/nodes/media-understanding).

### 3) Görsel ve video üretimi

Paylaşılan üretim yetenekleri de sağlayıcı anahtarlarını harcayabilir:

- Görsel üretimi: OpenAI / Google / fal / MiniMax
- Video üretimi: Qwen

`agents.defaults.imageGenerationModel` ayarsızsa görsel üretimi auth destekli bir sağlayıcı varsayılanını çıkarabilir.
Video üretimi ise şu anda
`qwen/wan2.6-t2v` gibi açık bir `agents.defaults.videoGenerationModel` gerektirir.

Bkz. [Image generation](/tr/tools/image-generation), [Qwen Cloud](/tr/providers/qwen),
ve [Models](/tr/concepts/models).

### 4) Bellek gömmeleri + semantik arama

Semantik bellek araması, uzak sağlayıcılar için yapılandırıldığında **gömme API'lerini** kullanır:

- `memorySearch.provider = "openai"` → OpenAI gömmeleri
- `memorySearch.provider = "gemini"` → Gemini gömmeleri
- `memorySearch.provider = "voyage"` → Voyage gömmeleri
- `memorySearch.provider = "mistral"` → Mistral gömmeleri
- `memorySearch.provider = "lmstudio"` → LM Studio gömmeleri (yerel/self-hosted)
- `memorySearch.provider = "ollama"` → Ollama gömmeleri (yerel/self-hosted; genellikle barındırılan API faturalandırması yok)
- Yerel gömmeler başarısız olursa uzak sağlayıcıya isteğe bağlı fallback

`memorySearch.provider = "local"` ile bunu yerel tutabilirsiniz (API kullanımı yok).

Bkz. [Memory](/tr/concepts/memory).

### 5) Web arama aracı

`web_search`, sağlayıcınıza bağlı olarak kullanım ücretleri doğurabilir:

- **Brave Search API**: `BRAVE_API_KEY` veya `plugins.entries.brave.config.webSearch.apiKey`
- **Exa**: `EXA_API_KEY` veya `plugins.entries.exa.config.webSearch.apiKey`
- **Firecrawl**: `FIRECRAWL_API_KEY` veya `plugins.entries.firecrawl.config.webSearch.apiKey`
- **Gemini (Google Search)**: `GEMINI_API_KEY` veya `plugins.entries.google.config.webSearch.apiKey`
- **Grok (xAI)**: `XAI_API_KEY` veya `plugins.entries.xai.config.webSearch.apiKey`
- **Kimi (Moonshot)**: `KIMI_API_KEY`, `MOONSHOT_API_KEY` veya `plugins.entries.moonshot.config.webSearch.apiKey`
- **MiniMax Search**: `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`, `MINIMAX_API_KEY` veya `plugins.entries.minimax.config.webSearch.apiKey`
- **Ollama Web Search**: varsayılan olarak anahtarsızdır, ancak erişilebilir bir Ollama sunucusu artı `ollama signin` gerektirir; sunucu gerektiriyorsa normal Ollama sağlayıcı bearer auth'unu da yeniden kullanabilir
- **Perplexity Search API**: `PERPLEXITY_API_KEY`, `OPENROUTER_API_KEY` veya `plugins.entries.perplexity.config.webSearch.apiKey`
- **Tavily**: `TAVILY_API_KEY` veya `plugins.entries.tavily.config.webSearch.apiKey`
- **DuckDuckGo**: anahtarsız fallback (API faturalandırması yok, ancak resmi değil ve HTML tabanlı)
- **SearXNG**: `SEARXNG_BASE_URL` veya `plugins.entries.searxng.config.webSearch.baseUrl` (anahtarsız/self-hosted; barındırılan API faturalandırması yok)

Eski `tools.web.search.*` sağlayıcı yolları geçici uyumluluk shim'i üzerinden hâlâ yüklenir, ancak artık önerilen config yüzeyi değildir.

**Brave Search ücretsiz kredisi:** Her Brave planı aylık yenilenen
\$5 ücretsiz kredi içerir. Search planı 1.000 istek başına \$5 olduğundan kredi,
aylık 1.000 isteği ücretsiz karşılar. Beklenmeyen ücretlerden kaçınmak için kullanım sınırınızı Brave panosundan ayarlayın.

Bkz. [Web tools](/tr/tools/web).

### 5) Web getirme aracı (Firecrawl)

`web_fetch`, API anahtarı mevcut olduğunda **Firecrawl** çağırabilir:

- `FIRECRAWL_API_KEY` veya `plugins.entries.firecrawl.config.webFetch.apiKey`

Firecrawl yapılandırılmamışsa araç doğrudan fetch + readability'ye fallback yapar (ücretli API yok).

Bkz. [Web tools](/tr/tools/web).

### 6) Sağlayıcı kullanım anlık görüntüleri (durum/sağlık)

Bazı durum komutları, kota pencerelerini veya auth sağlığını göstermek için **sağlayıcı kullanım uç noktalarını** çağırır.
Bunlar genellikle düşük hacimli çağrılardır ancak yine de sağlayıcı API'lerine vurur:

- `openclaw status --usage`
- `openclaw models status --json`

Bkz. [Models CLI](/tr/cli/models).

### 7) Compaction güvenlik özeti

Compaction güvenlik önlemi, oturum geçmişini **geçerli model** kullanarak özetleyebilir; bu da çalıştığında sağlayıcı API'lerini çağırır.

Bkz. [Session management + compaction](/tr/reference/session-management-compaction).

### 8) Model tarama / probe

`openclaw models scan`, OpenRouter modellerini probe edebilir ve
probe etkinleştirildiğinde `OPENROUTER_API_KEY` kullanır.

Bkz. [Models CLI](/tr/cli/models).

### 9) Talk (konuşma)

Talk mode, yapılandırıldığında **ElevenLabs** çağırabilir:

- `ELEVENLABS_API_KEY` veya `talk.providers.elevenlabs.apiKey`

Bkz. [Talk mode](/tr/nodes/talk).

### 10) Skills (üçüncü taraf API'ler)

Skills, `skills.entries.<name>.apiKey` içinde `apiKey` saklayabilir. Bir Skill bu anahtarı harici
API'ler için kullanırsa, Skill sağlayıcısına göre maliyet oluşturabilir.

Bkz. [Skills](/tr/tools/skills).

## İlgili

- [Token use and costs](/tr/reference/token-use)
- [Prompt caching](/tr/reference/prompt-caching)
- [Usage tracking](/tr/concepts/usage-tracking)
