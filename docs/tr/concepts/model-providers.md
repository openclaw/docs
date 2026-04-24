---
read_when:
    - Sağlayıcı bazında model kurulum başvurusuna ihtiyacınız var
    - Model sağlayıcıları için örnek yapılandırmalar veya CLI ilk kurulum komutları istiyorsunuz
summary: Örnek yapılandırmalar + CLI akışları ile model sağlayıcısı genel bakışı
title: Model sağlayıcıları
x-i18n:
    generated_at: "2026-04-24T09:05:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: ac9bf48897446576d8bc339b340295691741a589863bb57b379c17a5519bffd7
    source_path: concepts/model-providers.md
    workflow: 15
---

Bu sayfa **LLM/model sağlayıcılarını** kapsar (WhatsApp/Telegram gibi sohbet kanalları değil).
Model seçim kuralları için bkz. [/concepts/models](/tr/concepts/models).

## Hızlı kurallar

- Model ref'leri `provider/model` kullanır (örnek: `opencode/claude-opus-4-6`).
- `agents.defaults.models`, ayarlandığında izin listesi görevi görür.
- CLI yardımcıları: `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`.
- `models.providers.*.models[].contextWindow` yerel model metadata'sıdır; `contextTokens` ise etkili çalışma zamanı sınırıdır.
- Geri dönüş kuralları, cooldown yoklamaları ve oturum geçersiz kılma kalıcılığı: [Model failover](/tr/concepts/model-failover).
- OpenAI ailesi rotaları öneke özgüdür: `openai/<model>` doğrudan
  API anahtarlı OpenAI sağlayıcısını PI içinde kullanır, `openai-codex/<model>` PI içinde Codex OAuth kullanır,
  ve `openai/<model>` artı `agents.defaults.embeddedHarness.runtime: "codex"`
  yerel Codex uygulama sunucusu koşumunu kullanır. Bkz. [OpenAI](/tr/providers/openai)
  ve [Codex harness](/tr/plugins/codex-harness).
- Plugin otomatik etkinleştirme de aynı sınırı izler: `openai-codex/<model>`
  OpenAI Plugin'ine aittir, Codex Plugin'i ise
  `embeddedHarness.runtime: "codex"` veya eski `codex/<model>` ref'leri ile etkinleştirilir.
- GPT-5.5 şu anda abonelik/OAuth rotaları üzerinden kullanılabilir:
  PI içinde `openai-codex/gpt-5.5` veya Codex uygulama sunucusu
  koşumuyla `openai/gpt-5.5`. `openai/gpt-5.5` için doğrudan API anahtarı rotası,
  OpenAI GPT-5.5'i genel API'de etkinleştirdiğinde desteklenir; o zamana kadar
  `OPENAI_API_KEY` kurulumları için `openai/gpt-5.4` gibi API etkin modeller kullanın.

## Plugin sahipli sağlayıcı davranışı

Sağlayıcıya özgü mantığın çoğu, OpenClaw genel çıkarım döngüsünü korurken sağlayıcı Plugin'lerinde (`registerProvider(...)`) yaşar. Plugin'ler; ilk kuruluma, model kataloglarına, auth env var eşlemesine, aktarım/yapılandırma normalizasyonuna, araç şeması temizliğine, failover sınıflandırmasına, OAuth yenilemeye, kullanım raporlamasına, düşünme/muhakeme profillerine ve daha fazlasına sahiptir.

Sağlayıcı SDK kancalarının tam listesi ve paketle gelen Plugin örnekleri [Provider plugins](/tr/plugins/sdk-provider-plugins) sayfasında yer alır. Tamamen özel bir istek yürütücüsüne ihtiyaç duyan bir sağlayıcı, ayrı ve daha derin bir genişletme yüzeyidir.

<Note>
Sağlayıcı çalışma zamanı `capabilities`, paylaşılan çalıştırıcı metadata'sıdır (sağlayıcı ailesi, transcript/araçlama tuhaflıkları, taşıma/önbellek ipuçları). Bu, bir Plugin'in neyi kaydettiğini açıklayan [public capability model](/tr/plugins/architecture#public-capability-model) ile aynı değildir (metin çıkarımı, konuşma vb.).
</Note>

## API anahtarı döndürme

- Seçili sağlayıcılar için genel sağlayıcı döndürmeyi destekler.
- Birden çok anahtarı şu yollarla yapılandırın:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (tek canlı geçersiz kılma, en yüksek öncelik)
  - `<PROVIDER>_API_KEYS` (virgül veya noktalı virgülle ayrılmış liste)
  - `<PROVIDER>_API_KEY` (birincil anahtar)
  - `<PROVIDER>_API_KEY_*` (numaralı liste, ör. `<PROVIDER>_API_KEY_1`)
- Google sağlayıcıları için `GOOGLE_API_KEY` de geri dönüş olarak dahildir.
- Anahtar seçim sırası önceliği korur ve değerlerin tekrarını kaldırır.
- İstekler yalnızca hız sınırı yanıtlarında sonraki anahtarla yeniden denenir (
  örneğin `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many
concurrent requests`, `ThrottlingException`, `concurrency limit reached`,
  `workers_ai ... quota limit exceeded` veya periyodik kullanım sınırı mesajları).
- Hız sınırı dışındaki hatalar hemen başarısız olur; anahtar döndürme denenmez.
- Tüm aday anahtarlar başarısız olduğunda, son hata son denemeden döndürülür.

## Yerleşik sağlayıcılar (pi-ai kataloğu)

OpenClaw, pi‑ai kataloğuyla birlikte gelir. Bu sağlayıcılar için
`models.providers` yapılandırması gerekmez; yalnızca auth ayarlayın ve bir model seçin.

### OpenAI

- Sağlayıcı: `openai`
- Auth: `OPENAI_API_KEY`
- İsteğe bağlı döndürme: `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2`, artı `OPENCLAW_LIVE_OPENAI_KEY` (tek geçersiz kılma)
- Örnek modeller: `openai/gpt-5.4`, `openai/gpt-5.4-mini`
- OpenAI GPT-5.5'i API'de sunduğunda doğrudan GPT-5.5 API desteği burada geleceğe hazırdır
- CLI: `openclaw onboard --auth-choice openai-api-key`
- Varsayılan taşıma `auto`'dur (önce WebSocket, geri dönüş SSE)
- Model başına `agents.defaults.models["openai/<model>"].params.transport` ile geçersiz kılın (`"sse"`, `"websocket"` veya `"auto"`)
- OpenAI Responses WebSocket ısınması varsayılan olarak `params.openaiWsWarmup` üzerinden etkindir (`true`/`false`)
- OpenAI priority processing, `agents.defaults.models["openai/<model>"].params.serviceTier` üzerinden etkinleştirilebilir
- `/fast` ve `params.fastMode`, doğrudan `openai/*` Responses isteklerini `api.openai.com` üzerinde `service_tier=priority` olarak eşler
- Paylaşılan `/fast` geçişi yerine açık bir katman istediğinizde `params.serviceTier` kullanın
- Gizli OpenClaw ilişkilendirme üst bilgileri (`originator`, `version`,
  `User-Agent`) yalnızca `api.openai.com` üzerindeki yerel OpenAI trafiğine uygulanır,
  genel OpenAI uyumlu proxy'lere uygulanmaz
- Yerel OpenAI rotaları ayrıca Responses `store`, istem önbelleği ipuçları ve
  OpenAI muhakeme uyumlu yük şekillendirmesini korur; proxy rotaları korumaz
- `openai/gpt-5.3-codex-spark`, canlı OpenAI API istekleri bunu reddettiği ve mevcut Codex kataloğu bunu sunmadığı için OpenClaw içinde bilerek bastırılır

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
}
```

### Anthropic

- Sağlayıcı: `anthropic`
- Auth: `ANTHROPIC_API_KEY`
- İsteğe bağlı döndürme: `ANTHROPIC_API_KEYS`, `ANTHROPIC_API_KEY_1`, `ANTHROPIC_API_KEY_2`, artı `OPENCLAW_LIVE_ANTHROPIC_KEY` (tek geçersiz kılma)
- Örnek model: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice apiKey`
- Doğrudan genel Anthropic istekleri, `api.anthropic.com`'a gönderilen API anahtarlı ve OAuth kimlik doğrulamalı trafik dahil, paylaşılan `/fast` geçişini ve `params.fastMode`'u destekler; OpenClaw bunu Anthropic `service_tier`'a eşler (`auto` ve `standard_only`)
- Anthropic notu: Anthropic çalışanları bize OpenClaw tarzı Claude CLI kullanımına yeniden izin verildiğini söyledi; bu yüzden Anthropic yeni bir ilke yayımlamadığı sürece OpenClaw, Claude CLI yeniden kullanımını ve `claude -p` kullanımını bu entegrasyon için onaylı kabul eder.
- Anthropic setup-token, desteklenen bir OpenClaw token yolu olarak kullanılabilir olmaya devam eder, ancak OpenClaw artık mümkün olduğunda Claude CLI yeniden kullanımını ve `claude -p`'yi tercih eder.

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OpenAI Codex OAuth

- Sağlayıcı: `openai-codex`
- Auth: OAuth (ChatGPT)
- PI model ref: `openai-codex/gpt-5.5`
- Yerel Codex uygulama sunucusu koşum ref'i: `agents.defaults.embeddedHarness.runtime: "codex"` ile `openai/gpt-5.5`
- Eski model ref'leri: `codex/gpt-*`
- Plugin sınırı: `openai-codex/*`, OpenAI Plugin'ini yükler; yerel Codex
  uygulama sunucusu Plugin'i yalnızca Codex koşumu çalışma zamanı veya eski
  `codex/*` ref'leri ile seçilir.
- CLI: `openclaw onboard --auth-choice openai-codex` veya `openclaw models auth login --provider openai-codex`
- Varsayılan taşıma `auto`'dur (önce WebSocket, geri dönüş SSE)
- PI model başına `agents.defaults.models["openai-codex/<model>"].params.transport` ile geçersiz kılın (`"sse"`, `"websocket"` veya `"auto"`)
- `params.serviceTier`, yerel Codex Responses isteklerinde de iletilir (`chatgpt.com/backend-api`)
- Gizli OpenClaw ilişkilendirme üst bilgileri (`originator`, `version`,
  `User-Agent`) yalnızca `chatgpt.com/backend-api`
  üzerindeki yerel Codex trafiğine eklenir, genel OpenAI uyumlu proxy'lere eklenmez
- Doğrudan `openai/*` ile aynı `/fast` geçişini ve `params.fastMode` yapılandırmasını paylaşır; OpenClaw bunu `service_tier=priority` olarak eşler
- `openai-codex/gpt-5.5`, yerel `contextWindow = 1000000` değerini ve varsayılan çalışma zamanı `contextTokens = 272000` değerini korur; çalışma zamanı sınırını `models.providers.openai-codex.models[].contextTokens` ile geçersiz kılın
- İlke notu: OpenAI Codex OAuth, OpenClaw gibi harici araçlar/iş akışları için açıkça desteklenir.
- Geçerli GPT-5.5 erişimi, OpenAI GPT-5.5'i genel API'de etkinleştirene kadar bu OAuth/abonelik rotasını kullanır.

```json5
{
  agents: { defaults: { model: { primary: "openai-codex/gpt-5.5" } } },
}
```

```json5
{
  models: {
    providers: {
      "openai-codex": {
        models: [{ id: "gpt-5.5", contextTokens: 160000 }],
      },
    },
  },
}
```

### Diğer abonelik tarzı barındırılan seçenekler

- [Qwen Cloud](/tr/providers/qwen): Qwen Cloud sağlayıcı yüzeyi artı Alibaba DashScope ve Coding Plan uç nokta eşlemesi
- [MiniMax](/tr/providers/minimax): MiniMax Coding Plan OAuth veya API anahtarı erişimi
- [GLM Models](/tr/providers/glm): Z.AI Coding Plan veya genel API uç noktaları

### OpenCode

- Auth: `OPENCODE_API_KEY` (veya `OPENCODE_ZEN_API_KEY`)
- Zen çalışma zamanı sağlayıcısı: `opencode`
- Go çalışma zamanı sağlayıcısı: `opencode-go`
- Örnek modeller: `opencode/claude-opus-4-6`, `opencode-go/kimi-k2.5`
- CLI: `openclaw onboard --auth-choice opencode-zen` veya `openclaw onboard --auth-choice opencode-go`

```json5
{
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

### Google Gemini (API anahtarı)

- Sağlayıcı: `google`
- Auth: `GEMINI_API_KEY`
- İsteğe bağlı döndürme: `GEMINI_API_KEYS`, `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, `GOOGLE_API_KEY` geri dönüşü ve `OPENCLAW_LIVE_GEMINI_KEY` (tek geçersiz kılma)
- Örnek modeller: `google/gemini-3.1-pro-preview`, `google/gemini-3-flash-preview`
- Uyumluluk: `google/gemini-3.1-flash-preview` kullanan eski OpenClaw yapılandırması `google/gemini-3-flash-preview` olarak normalize edilir
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- Doğrudan Gemini çalıştırmaları ayrıca `agents.defaults.models["google/<model>"].params.cachedContent`
  (veya eski `cached_content`) kabul eder; sağlayıcıya özgü
  `cachedContents/...` tanıtıcısını iletir; Gemini önbellek isabetleri OpenClaw `cacheRead` olarak görünür

### Google Vertex ve Gemini CLI

- Sağlayıcılar: `google-vertex`, `google-gemini-cli`
- Auth: Vertex, gcloud ADC kullanır; Gemini CLI kendi OAuth akışını kullanır
- Dikkat: OpenClaw içindeki Gemini CLI OAuth resmi olmayan bir entegrasyondur. Bazı kullanıcılar üçüncü taraf istemcileri kullandıktan sonra Google hesap kısıtlamaları bildirmiştir. Devam etmeyi seçerseniz Google şartlarını inceleyin ve kritik olmayan bir hesap kullanın.
- Gemini CLI OAuth, paketle gelen `google` Plugin'inin bir parçası olarak gelir.
  - Önce Gemini CLI kurun:
    - `brew install gemini-cli`
    - veya `npm install -g @google/gemini-cli`
  - Etkinleştirin: `openclaw plugins enable google`
  - Giriş yapın: `openclaw models auth login --provider google-gemini-cli --set-default`
  - Varsayılan model: `google-gemini-cli/gemini-3-flash-preview`
  - Not: istemci kimliği veya gizli anahtarı `openclaw.json` içine **yapıştırmazsınız**. CLI giriş akışı
    token'ları gateway host üzerindeki auth profile'larında saklar.
  - İstekler girişten sonra başarısız olursa gateway host üzerinde `GOOGLE_CLOUD_PROJECT` veya `GOOGLE_CLOUD_PROJECT_ID` ayarlayın.
  - Gemini CLI JSON yanıtları `response` içinden ayrıştırılır; kullanım, `stats` içinden geri döner ve
    `stats.cached`, OpenClaw `cacheRead` içine normalize edilir.

### Z.AI (GLM)

- Sağlayıcı: `zai`
- Auth: `ZAI_API_KEY`
- Örnek model: `zai/glm-5.1`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - Takma adlar: `z.ai/*` ve `z-ai/*`, `zai/*` olarak normalize edilir
  - `zai-api-key`, eşleşen Z.AI uç noktasını otomatik algılar; `zai-coding-global`, `zai-coding-cn`, `zai-global` ve `zai-cn` belirli bir yüzeyi zorlar

### Vercel AI Gateway

- Sağlayıcı: `vercel-ai-gateway`
- Auth: `AI_GATEWAY_API_KEY`
- Örnek modeller: `vercel-ai-gateway/anthropic/claude-opus-4.6`,
  `vercel-ai-gateway/moonshotai/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice ai-gateway-api-key`

### Kilo Gateway

- Sağlayıcı: `kilocode`
- Auth: `KILOCODE_API_KEY`
- Örnek model: `kilocode/kilo/auto`
- CLI: `openclaw onboard --auth-choice kilocode-api-key`
- Base URL: `https://api.kilo.ai/api/gateway/`
- Statik geri dönüş kataloğu `kilocode/kilo/auto` ile birlikte gelir; canlı
  `https://api.kilo.ai/api/gateway/models` keşfi çalışma zamanı
  kataloğunu daha da genişletebilir.
- `kilocode/kilo/auto` arkasındaki tam yukarı akış yönlendirmesi sabit kodlu olarak OpenClaw'da değil,
  Kilo Gateway'e aittir.

Kurulum ayrıntıları için bkz. [/providers/kilocode](/tr/providers/kilocode).

### Diğer paketle gelen sağlayıcı Plugin'leri

| Sağlayıcı               | Kimlik                           | Auth env                                                     | Örnek model                                     |
| ----------------------- | -------------------------------- | ------------------------------------------------------------ | ----------------------------------------------- |
| BytePlus                | `byteplus` / `byteplus-plan`     | `BYTEPLUS_API_KEY`                                           | `byteplus-plan/ark-code-latest`                 |
| Cerebras                | `cerebras`                       | `CEREBRAS_API_KEY`                                           | `cerebras/zai-glm-4.7`                          |
| Cloudflare AI Gateway   | `cloudflare-ai-gateway`          | `CLOUDFLARE_AI_GATEWAY_API_KEY`                              | —                                               |
| GitHub Copilot          | `github-copilot`                 | `COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN`         | —                                               |
| Groq                    | `groq`                           | `GROQ_API_KEY`                                               | —                                               |
| Hugging Face Inference  | `huggingface`                    | `HUGGINGFACE_HUB_TOKEN` veya `HF_TOKEN`                      | `huggingface/deepseek-ai/DeepSeek-R1`           |
| Kilo Gateway            | `kilocode`                       | `KILOCODE_API_KEY`                                           | `kilocode/kilo/auto`                            |
| Kimi Coding             | `kimi`                           | `KIMI_API_KEY` veya `KIMICODE_API_KEY`                       | `kimi/kimi-code`                                |
| MiniMax                 | `minimax` / `minimax-portal`     | `MINIMAX_API_KEY` / `MINIMAX_OAUTH_TOKEN`                    | `minimax/MiniMax-M2.7`                          |
| Mistral                 | `mistral`                        | `MISTRAL_API_KEY`                                            | `mistral/mistral-large-latest`                  |
| Moonshot                | `moonshot`                       | `MOONSHOT_API_KEY`                                           | `moonshot/kimi-k2.6`                            |
| NVIDIA                  | `nvidia`                         | `NVIDIA_API_KEY`                                             | `nvidia/nvidia/llama-3.1-nemotron-70b-instruct` |
| OpenRouter              | `openrouter`                     | `OPENROUTER_API_KEY`                                         | `openrouter/auto`                               |
| Qianfan                 | `qianfan`                        | `QIANFAN_API_KEY`                                            | `qianfan/deepseek-v3.2`                         |
| Qwen Cloud              | `qwen`                           | `QWEN_API_KEY` / `MODELSTUDIO_API_KEY` / `DASHSCOPE_API_KEY` | `qwen/qwen3.5-plus`                             |
| StepFun                 | `stepfun` / `stepfun-plan`       | `STEPFUN_API_KEY`                                            | `stepfun/step-3.5-flash`                        |
| Together                | `together`                       | `TOGETHER_API_KEY`                                           | `together/moonshotai/Kimi-K2.5`                 |
| Venice                  | `venice`                         | `VENICE_API_KEY`                                             | —                                               |
| Vercel AI Gateway       | `vercel-ai-gateway`              | `AI_GATEWAY_API_KEY`                                         | `vercel-ai-gateway/anthropic/claude-opus-4.6`   |
| Volcano Engine (Doubao) | `volcengine` / `volcengine-plan` | `VOLCANO_ENGINE_API_KEY`                                     | `volcengine-plan/ark-code-latest`               |
| xAI                     | `xai`                            | `XAI_API_KEY`                                                | `xai/grok-4`                                    |
| Xiaomi                  | `xiaomi`                         | `XIAOMI_API_KEY`                                             | `xiaomi/mimo-v2-flash`                          |

Bilinmeye değer tuhaflıklar:

- **OpenRouter**, uygulama ilişkilendirme üst bilgilerini ve Anthropic `cache_control` işaretleyicilerini yalnızca doğrulanmış `openrouter.ai` rotalarında uygular. Proxy tarzı bir OpenAI uyumlu yol olduğundan, yerel-OpenAI'ye özgü şekillendirmeyi (`serviceTier`, Responses `store`, istem önbelleği ipuçları, OpenAI muhakeme uyumluluğu) atlar. Gemini destekli ref'ler yalnızca proxy-Gemini düşünce imzası temizliğini korur.
- **Kilo Gateway** Gemini destekli ref'ler aynı proxy-Gemini temizleme yolunu izler; `kilocode/kilo/auto` ve diğer proxy-muhakeme-desteksiz ref'ler proxy muhakeme enjeksiyonunu atlar.
- **MiniMax** API anahtarlı ilk kurulum, açık `input: ["text", "image"]` içeren M2.7 model tanımlarını yazar; paketle gelen katalog, bu yapılandırma gerçekleştirilene kadar sohbet ref'lerini yalnızca metin olarak tutar.
- **xAI**, xAI Responses yolunu kullanır. `/fast` veya `params.fastMode: true`, `grok-3`, `grok-3-mini`, `grok-4` ve `grok-4-0709` modellerini `*-fast` varyantlarına yeniden yazar. `tool_stream` varsayılan olarak açıktır; `agents.defaults.models["xai/<model>"].params.tool_stream=false` ile devre dışı bırakın.
- **Cerebras** GLM modelleri `zai-glm-4.7` / `zai-glm-4.6` kullanır; OpenAI uyumlu base URL `https://api.cerebras.ai/v1` değeridir.

## `models.providers` üzerinden sağlayıcılar (özel/base URL)

**Özel** sağlayıcılar veya
OpenAI/Anthropic uyumlu proxy'ler eklemek için `models.providers` (veya `models.json`) kullanın.

Aşağıdaki paketle gelen sağlayıcı Plugin'lerinin birçoğu zaten varsayılan bir katalog yayımlar.
Varsayılan base URL'yi, üst bilgileri veya model listesini
geçersiz kılmak istediğinizde yalnızca açık `models.providers.<id>` girdileri kullanın.

### Moonshot AI (Kimi)

Moonshot, paketle gelen bir sağlayıcı Plugin'i olarak gelir. Yerleşik sağlayıcıyı
varsayılan olarak kullanın ve yalnızca base URL veya model metadata'sını geçersiz kılmanız
gerektiğinde açık bir `models.providers.moonshot` girdisi ekleyin:

- Sağlayıcı: `moonshot`
- Auth: `MOONSHOT_API_KEY`
- Örnek model: `moonshot/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice moonshot-api-key` veya `openclaw onboard --auth-choice moonshot-api-key-cn`

Kimi K2 model kimlikleri:

[//]: # "moonshot-kimi-k2-model-refs:start"

- `moonshot/kimi-k2.6`
- `moonshot/kimi-k2.5`
- `moonshot/kimi-k2-thinking`
- `moonshot/kimi-k2-thinking-turbo`
- `moonshot/kimi-k2-turbo`

[//]: # "moonshot-kimi-k2-model-refs:end"

```json5
{
  agents: {
    defaults: { model: { primary: "moonshot/kimi-k2.6" } },
  },
  models: {
    mode: "merge",
    providers: {
      moonshot: {
        baseUrl: "https://api.moonshot.ai/v1",
        apiKey: "${MOONSHOT_API_KEY}",
        api: "openai-completions",
        models: [{ id: "kimi-k2.6", name: "Kimi K2.6" }],
      },
    },
  },
}
```

### Kimi Coding

Kimi Coding, Moonshot AI'nin Anthropic uyumlu uç noktasını kullanır:

- Sağlayıcı: `kimi`
- Auth: `KIMI_API_KEY`
- Örnek model: `kimi/kimi-code`

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: { model: { primary: "kimi/kimi-code" } },
  },
}
```

Eski `kimi/k2p5`, uyumluluk model kimliği olarak kabul edilmeye devam eder.

### Volcano Engine (Doubao)

Volcano Engine (火山引擎), Çin'deki Doubao ve diğer modellere erişim sağlar.

- Sağlayıcı: `volcengine` (kodlama: `volcengine-plan`)
- Auth: `VOLCANO_ENGINE_API_KEY`
- Örnek model: `volcengine-plan/ark-code-latest`
- CLI: `openclaw onboard --auth-choice volcengine-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "volcengine-plan/ark-code-latest" } },
  },
}
```

İlk kurulum varsayılan olarak kodlama yüzeyini kullanır, ancak genel `volcengine/*`
kataloğu da aynı anda kaydedilir.

İlk kurulum/yapılandırma model seçicilerinde Volcengine auth seçimi,
hem `volcengine/*` hem de `volcengine-plan/*` satırlarını tercih eder. Bu modeller henüz
yüklenmemişse OpenClaw, boş bir
sağlayıcı kapsamlı seçici göstermek yerine filtresiz kataloğa geri döner.

Kullanılabilir modeller:

- `volcengine/doubao-seed-1-8-251228` (Doubao Seed 1.8)
- `volcengine/doubao-seed-code-preview-251028`
- `volcengine/kimi-k2-5-260127` (Kimi K2.5)
- `volcengine/glm-4-7-251222` (GLM 4.7)
- `volcengine/deepseek-v3-2-251201` (DeepSeek V3.2 128K)

Kodlama modelleri (`volcengine-plan`):

- `volcengine-plan/ark-code-latest`
- `volcengine-plan/doubao-seed-code`
- `volcengine-plan/kimi-k2.5`
- `volcengine-plan/kimi-k2-thinking`
- `volcengine-plan/glm-4.7`

### BytePlus (Uluslararası)

BytePlus ARK, uluslararası kullanıcılar için Volcano Engine ile aynı modellere erişim sağlar.

- Sağlayıcı: `byteplus` (kodlama: `byteplus-plan`)
- Auth: `BYTEPLUS_API_KEY`
- Örnek model: `byteplus-plan/ark-code-latest`
- CLI: `openclaw onboard --auth-choice byteplus-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "byteplus-plan/ark-code-latest" } },
  },
}
```

İlk kurulum varsayılan olarak kodlama yüzeyini kullanır, ancak genel `byteplus/*`
kataloğu da aynı anda kaydedilir.

İlk kurulum/yapılandırma model seçicilerinde BytePlus auth seçimi,
hem `byteplus/*` hem de `byteplus-plan/*` satırlarını tercih eder. Bu modeller henüz
yüklenmemişse OpenClaw, boş bir
sağlayıcı kapsamlı seçici göstermek yerine filtresiz kataloğa geri döner.

Kullanılabilir modeller:

- `byteplus/seed-1-8-251228` (Seed 1.8)
- `byteplus/kimi-k2-5-260127` (Kimi K2.5)
- `byteplus/glm-4-7-251222` (GLM 4.7)

Kodlama modelleri (`byteplus-plan`):

- `byteplus-plan/ark-code-latest`
- `byteplus-plan/doubao-seed-code`
- `byteplus-plan/kimi-k2.5`
- `byteplus-plan/kimi-k2-thinking`
- `byteplus-plan/glm-4.7`

### Synthetic

Synthetic, `synthetic` sağlayıcısı arkasında Anthropic uyumlu modeller sunar:

- Sağlayıcı: `synthetic`
- Auth: `SYNTHETIC_API_KEY`
- Örnek model: `synthetic/hf:MiniMaxAI/MiniMax-M2.5`
- CLI: `openclaw onboard --auth-choice synthetic-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "synthetic/hf:MiniMaxAI/MiniMax-M2.5" } },
  },
  models: {
    mode: "merge",
    providers: {
      synthetic: {
        baseUrl: "https://api.synthetic.new/anthropic",
        apiKey: "${SYNTHETIC_API_KEY}",
        api: "anthropic-messages",
        models: [{ id: "hf:MiniMaxAI/MiniMax-M2.5", name: "MiniMax M2.5" }],
      },
    },
  },
}
```

### MiniMax

MiniMax, özel uç noktalar kullandığı için `models.providers` üzerinden yapılandırılır:

- MiniMax OAuth (Global): `--auth-choice minimax-global-oauth`
- MiniMax OAuth (CN): `--auth-choice minimax-cn-oauth`
- MiniMax API anahtarı (Global): `--auth-choice minimax-global-api`
- MiniMax API anahtarı (CN): `--auth-choice minimax-cn-api`
- Auth: `minimax` için `MINIMAX_API_KEY`; `minimax-portal` için `MINIMAX_OAUTH_TOKEN` veya
  `MINIMAX_API_KEY`

Kurulum ayrıntıları, model seçenekleri ve yapılandırma parçacıkları için bkz. [/providers/minimax](/tr/providers/minimax).

MiniMax'in Anthropic uyumlu akış yolunda OpenClaw, siz açıkça ayarlamadığınız sürece düşünmeyi
varsayılan olarak devre dışı bırakır ve `/fast on`,
`MiniMax-M2.7` modelini `MiniMax-M2.7-highspeed` olarak yeniden yazar.

Plugin sahipli yetenek ayrımı:

- Metin/sohbet varsayılanları `minimax/MiniMax-M2.7` üzerinde kalır
- Görsel oluşturma `minimax/image-01` veya `minimax-portal/image-01` kullanır
- Görsel anlama, her iki MiniMax auth yolunda da Plugin sahipli `MiniMax-VL-01` kullanır
- Web arama, sağlayıcı kimliği `minimax` üzerinde kalır

### LM Studio

LM Studio, yerel API'yi kullanan paketle gelen bir sağlayıcı Plugin'i olarak gelir:

- Sağlayıcı: `lmstudio`
- Auth: `LM_API_TOKEN`
- Varsayılan çıkarım base URL: `http://localhost:1234/v1`

Ardından bir model ayarlayın (`http://localhost:1234/api/v1/models` tarafından döndürülen kimliklerden biriyle değiştirin):

```json5
{
  agents: {
    defaults: { model: { primary: "lmstudio/openai/gpt-oss-20b" } },
  },
}
```

OpenClaw; keşif + otomatik yükleme için LM Studio'nun yerel `/api/v1/models` ve `/api/v1/models/load` uç noktalarını, varsayılan olarak çıkarım için ise `/v1/chat/completions` yolunu kullanır.
Kurulum ve sorun giderme için bkz. [/providers/lmstudio](/tr/providers/lmstudio).

### Ollama

Ollama, paketle gelen bir sağlayıcı Plugin'i olarak gelir ve Ollama'nın yerel API'sini kullanır:

- Sağlayıcı: `ollama`
- Auth: Gerekmez (yerel sunucu)
- Örnek model: `ollama/llama3.3`
- Kurulum: [https://ollama.com/download](https://ollama.com/download)

```bash
# Ollama'yı kurun, ardından bir model çekin:
ollama pull llama3.3
```

```json5
{
  agents: {
    defaults: { model: { primary: "ollama/llama3.3" } },
  },
}
```

Ollama, siz `OLLAMA_API_KEY` ile katılım gösterdiğinizde yerelde `http://127.0.0.1:11434` adresinde algılanır ve paketle gelen sağlayıcı Plugin'i Ollama'yı doğrudan
`openclaw onboard` içine ve model seçicisine ekler. İlk kurulum, bulut/yerel mod ve özel yapılandırma için bkz. [/providers/ollama](/tr/providers/ollama).

### vLLM

vLLM, yerel/kendi kendine barındırılan OpenAI uyumlu
sunucular için paketle gelen bir sağlayıcı Plugin'i olarak gelir:

- Sağlayıcı: `vllm`
- Auth: İsteğe bağlıdır (sunucunuza bağlıdır)
- Varsayılan base URL: `http://127.0.0.1:8000/v1`

Yerelde otomatik keşfe katılım göstermek için (sunucunuz auth zorlamıyorsa herhangi bir değer çalışır):

```bash
export VLLM_API_KEY="vllm-local"
```

Ardından bir model ayarlayın (`/v1/models` tarafından döndürülen kimliklerden biriyle değiştirin):

```json5
{
  agents: {
    defaults: { model: { primary: "vllm/your-model-id" } },
  },
}
```

Ayrıntılar için bkz. [/providers/vllm](/tr/providers/vllm).

### SGLang

SGLang, hızlı kendi kendine barındırılan
OpenAI uyumlu sunucular için paketle gelen bir sağlayıcı Plugin'i olarak gelir:

- Sağlayıcı: `sglang`
- Auth: İsteğe bağlıdır (sunucunuza bağlıdır)
- Varsayılan base URL: `http://127.0.0.1:30000/v1`

Yerelde otomatik keşfe katılım göstermek için (sunucunuz auth zorlamıyorsa herhangi bir değer çalışır):

```bash
export SGLANG_API_KEY="sglang-local"
```

Ardından bir model ayarlayın (`/v1/models` tarafından döndürülen kimliklerden biriyle değiştirin):

```json5
{
  agents: {
    defaults: { model: { primary: "sglang/your-model-id" } },
  },
}
```

Ayrıntılar için bkz. [/providers/sglang](/tr/providers/sglang).

### Yerel proxy'ler (LM Studio, vLLM, LiteLLM vb.)

Örnek (OpenAI uyumlu):

```json5
{
  agents: {
    defaults: {
      model: { primary: "lmstudio/my-local-model" },
      models: { "lmstudio/my-local-model": { alias: "Yerel" } },
    },
  },
  models: {
    providers: {
      lmstudio: {
        baseUrl: "http://localhost:1234/v1",
        apiKey: "${LM_API_TOKEN}",
        api: "openai-completions",
        models: [
          {
            id: "my-local-model",
            name: "Yerel Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 200000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

Notlar:

- Özel sağlayıcılar için `reasoning`, `input`, `cost`, `contextWindow` ve `maxTokens` isteğe bağlıdır.
  Atlandığında OpenClaw varsayılan olarak şunları kullanır:
  - `reasoning: false`
  - `input: ["text"]`
  - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
  - `contextWindow: 200000`
  - `maxTokens: 8192`
- Önerilen: proxy/model sınırlarınızla eşleşen açık değerler ayarlayın.
- Yerel olmayan uç noktalarda `api: "openai-completions"` için (`api.openai.com` olmayan boş olmayan herhangi bir `baseUrl` host'u), OpenClaw desteklenmeyen `developer` rolleri için sağlayıcı `400` hatalarını önlemek amacıyla `compat.supportsDeveloperRole: false` zorlar.
- Proxy tarzı OpenAI uyumlu rotalar ayrıca yerel OpenAI'ye özgü istek
  şekillendirmesini de atlar: `service_tier` yok, Responses `store` yok, istem önbelleği ipuçları yok,
  OpenAI muhakeme uyumlu yük şekillendirmesi yok ve gizli OpenClaw ilişkilendirme
  üst bilgileri yok.
- `baseUrl` boş/atlanmışsa OpenClaw varsayılan OpenAI davranışını korur (`api.openai.com` olarak çözülür).
- Güvenlik için, açık `compat.supportsDeveloperRole: true` değeri yerel olmayan `openai-completions` uç noktalarında yine de geçersiz kılınır.

## CLI örnekleri

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

Ayrıca bkz.: tam yapılandırma örnekleri için [/gateway/configuration](/tr/gateway/configuration).

## İlgili

- [Modeller](/tr/concepts/models) — model yapılandırması ve takma adlar
- [Model Failover](/tr/concepts/model-failover) — geri dönüş zincirleri ve yeniden deneme davranışı
- [Yapılandırma Başvurusu](/tr/gateway/config-agents#agent-defaults) — model yapılandırma anahtarları
- [Sağlayıcılar](/tr/providers) — sağlayıcı başına kurulum kılavuzları
