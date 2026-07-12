---
read_when:
    - Hangi özelliklerin ücretli API'leri çağırabileceğini anlamak istiyorsunuz
    - Anahtarları, maliyetleri ve kullanım görünürlüğünü denetlemeniz gerekir
    - /status veya /usage maliyet raporlamasını açıklıyorsunuz
summary: Nelerin harcama yapabileceğini, hangi anahtarların kullanıldığını ve kullanımın nasıl görüntüleneceğini denetleyin
title: API kullanımı ve maliyetleri
x-i18n:
    generated_at: "2026-07-12T12:42:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b35ad64f83572eb8c01b59ee57368fd7ba20cb83ccac835281859796f782c1dd
    source_path: reference/api-usage-costs.md
    workflow: 16
---

Ücretli sağlayıcı API'lerini çağırabilen OpenClaw özelliklerinin, her birinin kimlik bilgilerini nereden okuduğunun ve ortaya çıkan maliyetin nerede gösterildiğinin haritası.

## Maliyetlerin gösterildiği yerler

**`/status`** (oturum başına anlık görüntü)

- Geçerli oturum modelini, bağlam kullanımını ve son yanıtın token sayılarını gösterir.
- OpenClaw, etkin model için kullanım meta verilerine ve yerel fiyatlandırmaya sahip olduğunda son yanıt için **tahmini maliyet** ekler; buna Bedrock `aws-sdk` modelleri gibi açıkça fiyatlandırılmış, API anahtarı kullanmayan sağlayıcılar da dahildir.
- Canlı oturum anlık görüntüsü seyrekse `/status`, en son transkript kullanım girdisinden token/önbellek sayaçlarını ve etkin model etiketini geri yükler. Sıfırdan büyük mevcut canlı değerler transkript verilerine göre önceliklidir; saklanan toplam eksik veya daha küçükse istem boyutundaki transkript toplamı yine de öncelikli olabilir.

**`/usage`** (ileti başına alt bilgi)

- `/usage full`, yerel fiyatlandırma yapılandırılmış ve kullanım meta verileri mevcut olduğunda **tahmini maliyet** de dahil olmak üzere her yanıta kullanım alt bilgisi ekler.
- `/usage tokens` yalnızca token sayılarını gösterir. Abonelik tarzı OAuth/token ve CLI çalışma zamanları, uyumlu kullanım meta verilerinin yanı sıra açık bir yerel fiyat sağlamadıkları sürece yalnızca token sayılarını gösterir.
- `/usage cost` yerel maliyet özetini yazdırır; `/usage off` alt bilgiyi devre dışı bırakır.
- Gemini CLI notu: Hem `stream-json` hem de eski `json` çıktısı kullanım verilerini `stats` altında taşır. OpenClaw, `stats.cached` değerini `cacheRead` olarak normalleştirir ve gerektiğinde girdi token sayılarını `stats.input_tokens - stats.cached` işleminden türetir.

**Control UI → Kullanım** (oturumlar arası analiz)

- Seçilen tarih aralığı için transkriptlerden türetilen token ve tahmini maliyet toplamlarını; sağlayıcı, model, ajan, kanal ve token türüne göre dökümlerle gösterir.
- Seçilen aralığın bitiş tarihinde sona eren daha kısa takvim aralıklarını karşılaştırır. Eksik tarihler sıfır kullanımlı takvim günleri olarak sayılır; daha yoğun bir aralık oluşturmak için atlanmaz.
- Günlük grafik ölçeğini doğrudan etiketler. `√` rozeti, karekök sıkıştırmasının düşük kullanımlı günleri görünür tuttuğu anlamına gelir.
- Bu toplamlar, sağlayıcı faturasını veya ömür boyu faturalandırma kaydını değil, mevcut yerel oturum geçmişini açıklar. Bazı girdilerin fiyatlandırması eksik olduğunda kullanıcı arayüzü uyarı verir.

**CLI kullanım aralıkları** (ileti başına maliyet değil, sağlayıcı kotaları)

- `openclaw status --usage` ve `openclaw channels list`, sağlayıcı **kullanım aralıklarını** `X% kaldı` biçiminde gösterir.
- Geçerli kullanım aralığı sağlayıcıları: Anthropic, ClawRouter, DeepSeek, GitHub Copilot, Gemini CLI, MiniMax, OpenAI (ChatGPT/Codex OAuth/token kimlik doğrulamasını kapsar), Xiaomi ve z.ai. Sağlayıcıların ve bayrakların tam listesi için [Modeller CLI'si](/tr/cli/models) ve [Kanallar CLI'si](/tr/cli/channels) bölümlerine bakın.
- MiniMax'ın ham `usage_percent` / `usagePercent` alanları kalan kotayı bildirir; bu nedenle OpenClaw bunları tersine çevirir. Mevcut olduğunda sayı tabanlı alanlar önceliklidir. Yanıt bir `model_remains` dizisi içeriyorsa OpenClaw sohbet modeli girdisini seçer, gerektiğinde zaman damgalarından aralık etiketini türetir ve plan etiketine model adını ekler.
- Kullanım kimlik doğrulaması, mevcut olduğunda sağlayıcıya özgü kancalardan alınır; aksi takdirde OpenClaw, kimlik doğrulama profillerindeki, ortam değişkenlerindeki veya yapılandırmadaki eşleşen OAuth/API anahtarı kimlik bilgilerine geri döner.

Ayrıntılı örnekler için [Token kullanımı ve maliyetler](/tr/reference/token-use) bölümüne bakın.

<Note>
Anthropic, yeni bir politika yayımlamadığı sürece Claude CLI'ın yeniden kullanılmasının (`claude -p` dahil) onaylanmış bir entegrasyon modeli olduğunu doğrulamıştır. Anthropic ileti başına dolar cinsinden tahmin sunmadığından `/usage full`, Claude CLI kullanımı için maliyeti gösteremez.
</Note>

## Anahtarlar nasıl keşfedilir?

- **Kimlik doğrulama profilleri**: Ajan başına tutulur ve `auth-profiles.json` içinde saklanır.
- **Ortam değişkenleri**: Örneğin `OPENAI_API_KEY`, `BRAVE_API_KEY`, `FIRECRAWL_API_KEY`.
- **Yapılandırma**: `models.providers.*.apiKey`, `plugins.entries.*.config.webSearch.apiKey`, `plugins.entries.firecrawl.config.webFetch.apiKey`, `agents.defaults.memorySearch.*`, `talk.providers.*.apiKey`.
- **Skills**: Anahtarı skill işleminin ortamına aktarabilen `skills.entries.<name>.apiKey`.

## Anahtarları kullanarak maliyet oluşturabilen özellikler

### Temel model yanıtları (sohbet + araçlar)

Her yanıt veya araç çağrısı, geçerli model sağlayıcısında çalışır. OpenClaw'ın yerel kullanıcı arayüzü dışında faturalandırılan abonelik tarzı barındırılan planlar da dahil olmak üzere kullanım ve maliyetin birincil kaynağı budur: OpenAI Codex, Alibaba Cloud Model Studio Coding Plan, MiniMax Coding Plan, Z.AI/GLM Coding Plan ve Extra Usage etkinleştirilmiş Anthropic Claude oturum açma yolu.

Fiyatlandırma yapılandırması için [Modeller](/tr/providers/models), görüntüleme için [Token kullanımı ve maliyetler](/tr/reference/token-use) bölümlerine bakın.

### Medya anlama (ses/görüntü/video)

Gelen medya, yanıt işlem hattı çalışmadan önce bir sağlayıcı API'si aracılığıyla özetlenebilir veya yazıya dökülebilir. Sağlayıcı desteği Plugin başına kaydedilir ve Plugin'ler eklendikçe değişir; güncel liste ve yapılandırma için [Medya anlama](/tr/nodes/media-understanding) bölümüne bakın.

### Görüntü ve video oluşturma

`image_generate` ve `video_generate`, yapılandırılmış mevcut sağlayıcılardan uygun olana yönlendirilir. `agents.defaults.imageGenerationModel` ayarlanmamışsa görüntü oluşturma, kimlik doğrulama destekli varsayılan bir sağlayıcı çıkarımı yapabilir; video oluşturma ise açık bir `agents.defaults.videoGenerationModel` gerektirir (örneğin `qwen/wan2.6-t2v`).

Güncel sağlayıcı listesi için [Görüntü oluşturma](/tr/tools/image-generation) ve [Video oluşturma](/tr/tools/video-generation) bölümlerine bakın.

### Bellek gömmeleri ve anlamsal arama

Anlamsal bellek araması, `agents.defaults.memorySearch.provider` uzak bir bağdaştırıcıyı adlandırdığında (örneğin `openai`, `gemini`, `voyage`, `mistral`, `deepinfra`, `github-copilot`, `amazon-bedrock`) gömme API'lerini kullanır. `memorySearch.provider = "lmstudio"` veya `"ollama"`, yerel/kendi barındırdığınız bir sunucuda çalışır ve genellikle barındırma faturası oluşturmaz. `memorySearch.provider = "local"`, API kullanmadan her şeyi cihaz üzerinde tutar. İsteğe bağlı bir `memorySearch.fallback` sağlayıcısı, yerel gömme hatalarını karşılayabilir.

[Bellek](/tr/concepts/memory) bölümüne bakın.

### Web arama aracı

`web_search`, seçilen sağlayıcıya bağlı olarak kullanım ücreti oluşturabilir. Her sağlayıcı anahtarını önce bir ortam değişkeninden, ardından `plugins.entries.<id>.config.webSearch.apiKey` üzerinden okur:

| Sağlayıcı              | Ortam değişkeni/değişkenleri                                                                                                                                                                     |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Brave Search           | `BRAVE_API_KEY`                                                                                                                                                                                 |
| DuckDuckGo             | anahtar gerektirmez; resmî değildir, HTML tabanlıdır, faturalandırma yoktur                                                                                                                      |
| Exa                    | `EXA_API_KEY`                                                                                                                                                                                   |
| Firecrawl              | `FIRECRAWL_API_KEY`                                                                                                                                                                             |
| Gemini (Google Search) | `GEMINI_API_KEY`                                                                                                                                                                                |
| Grok (xAI)             | xAI OAuth profili veya `XAI_API_KEY`                                                                                                                                                            |
| Kimi (Moonshot)        | `KIMI_API_KEY` veya `MOONSHOT_API_KEY`                                                                                                                                                          |
| MiniMax Search         | `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`, `MINIMAX_OAUTH_TOKEN` veya `MINIMAX_API_KEY`                                                                                                 |
| Ollama Web Search      | erişilebilen ve oturum açılmış yerel ana bilgisayar için anahtar gerektirmez; doğrudan `https://ollama.com` araması `OLLAMA_API_KEY` kullanır; kimlik doğrulama korumalı ana bilgisayarlar normal Ollama sağlayıcısının bearer kimlik doğrulamasını yeniden kullanır |
| Parallel               | `PARALLEL_API_KEY`                                                                                                                                                                              |
| Perplexity Search API  | `PERPLEXITY_API_KEY` veya `OPENROUTER_API_KEY`                                                                                                                                                  |
| SearXNG                | `SEARXNG_BASE_URL`; anahtar gerektirmez/kendi barındırdığınız hizmettir, barındırma faturası yoktur                                                                                              |
| Tavily                 | `TAVILY_API_KEY`                                                                                                                                                                                |

Eski `tools.web.search.*` yapılandırma yolları bir uyumluluk katmanı üzerinden yüklenmeye devam eder, ancak artık önerilen yüzey değildir.

**Brave Search ücretsiz kredisi**: Her plan, aylık yenilenen 5 ABD doları tutarında ücretsiz kredi içerir. Search planının maliyeti 1.000 istek başına 5 ABD dolarıdır; dolayısıyla kredi ayda 1.000 isteği ücretsiz karşılar. Beklenmeyen ücretleri önlemek için Brave panosunda bir kullanım sınırı belirleyin.

[Web araçları](/tr/tools/web) bölümüne bakın.

### Web getirme aracı (Firecrawl)

`web_fetch`, anahtarsız başlangıç erişimiyle Firecrawl'ı çağırabilir; daha yüksek sınırlar için `FIRECRAWL_API_KEY` (veya `plugins.entries.firecrawl.config.webFetch.apiKey`) ekleyin. Firecrawl yapılandırılmamışsa araç, doğrudan getirmeye ve paketle gelen `web-readability` Plugin'ine geri döner (ücretli API yoktur). Yerel Readability ayıklamasını atlamak için `plugins.entries.web-readability.enabled` seçeneğini devre dışı bırakın.

[Web araçları](/tr/tools/web) bölümüne bakın.

### Sağlayıcı kullanım anlık görüntüleri (durum/sağlık)

`openclaw status --usage` ve `openclaw models status --json`, kota aralıklarını veya kimlik doğrulama durumunu göstermek için sağlayıcı kullanım uç noktalarını çağırır. Çağrı hacmi düşüktür ancak yine de sağlayıcı API'lerine ulaşır.

[Modeller CLI'si](/tr/cli/models) bölümüne bakın.

### Compaction koruması özetleme

Compaction koruması, geçerli modeli kullanarak oturum geçmişini özetleyebilir ve çalıştığında sağlayıcı API'lerini çağırır.

[Oturum yönetimi ve Compaction](/tr/reference/session-management-compaction) bölümüne bakın.

### Model tarama / yoklama

`openclaw models scan`, OpenRouter modellerini yoklayabilir ve yoklama etkinleştirildiğinde `OPENROUTER_API_KEY` kullanır.

[Modeller CLI'si](/tr/cli/models) bölümüne bakın.

### Konuşma (ses)

Konuşma modu, yapılandırıldığında ElevenLabs'i çağırabilir: `ELEVENLABS_API_KEY` veya `talk.providers.elevenlabs.apiKey`.

[Konuşma modu](/tr/nodes/talk) bölümüne bakın.

### Skills (üçüncü taraf API'leri)

Skills, `apiKey` değerini `skills.entries.<name>.apiKey` içinde saklayabilir. Bir skill bu anahtarı harici bir API ile kullanırsa maliyet, skill'in sağlayıcısına göre belirlenir.

[Skills](/tr/tools/skills) bölümüne bakın.

## İlgili konular

- [Token kullanımı ve maliyetler](/tr/reference/token-use)
- [İstem önbelleğe alma](/tr/reference/prompt-caching)
- [Kullanım takibi](/tr/concepts/usage-tracking)
