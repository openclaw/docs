---
read_when:
    - Sağlayıcı bazında bir model kurulum başvurusuna ihtiyacınız var
    - Model sağlayıcıları için örnek config’ler veya CLI onboard komutları istiyorsunuz
sidebarTitle: Model providers
summary: Örnek config’ler ve CLI akışlarıyla model sağlayıcısına genel bakış
title: Model sağlayıcıları
x-i18n:
    generated_at: "2026-04-26T11:27:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 925641c70780a5bc87c4fc8236bad56ba9e157df26d8084143eba4bf54e63159
    source_path: concepts/model-providers.md
    workflow: 15
---

**LLM/model sağlayıcıları** için başvuru sayfası (WhatsApp/Telegram gibi sohbet kanalları değil). Model seçim kuralları için bkz. [Models](/tr/concepts/models).

## Hızlı kurallar

<AccordionGroup>
  <Accordion title="Model başvuruları ve CLI yardımcıları">
    - Model başvuruları `provider/model` biçimini kullanır (örnek: `opencode/claude-opus-4-6`).
    - `agents.defaults.models`, ayarlandığında allowlist olarak davranır.
    - CLI yardımcıları: `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`.
    - `models.providers.*.models[].contextWindow` yerel model meta verisidir; `contextTokens` etkin çalışma zamanı sınırıdır.
    - Geri dönüş kuralları, cooldown probları ve oturum geçersiz kılma kalıcılığı: [Model failover](/tr/concepts/model-failover).
  </Accordion>
  <Accordion title="OpenAI sağlayıcı/çalışma zamanı ayrımı">
    OpenAI ailesi rotaları önek bazında ayrılır:

    - `openai/<model>`, PI içindeki doğrudan OpenAI API anahtarı sağlayıcısını kullanır.
    - `openai-codex/<model>`, PI içinde Codex OAuth kullanır.
    - `openai/<model>` ile birlikte `agents.defaults.agentRuntime.id: "codex"`, yerel Codex app-server harness kullanır.

    Bkz. [OpenAI](/tr/providers/openai) ve [Codex harness](/tr/plugins/codex-harness). Sağlayıcı/çalışma zamanı ayrımı kafa karıştırıcıysa önce [Agent runtimes](/tr/concepts/agent-runtimes) sayfasını okuyun.

    Plugin otomatik etkinleştirme de aynı sınıra uyar: `openai-codex/<model>` OpenAI Plugin’ine aittir, Codex Plugin’i ise `agentRuntime.id: "codex"` veya eski `codex/<model>` başvurularıyla etkinleştirilir.

    GPT-5.5, doğrudan API anahtarı trafiği için `openai/gpt-5.5`, PI içinde Codex OAuth için `openai-codex/gpt-5.5` ve `agentRuntime.id: "codex"` ayarlandığında yerel Codex app-server harness üzerinden kullanılabilir.

  </Accordion>
  <Accordion title="CLI çalışma zamanları">
    CLI çalışma zamanları aynı ayrımı kullanır: `anthropic/claude-*`, `google/gemini-*` veya `openai/gpt-*` gibi kanonik model başvurularını seçin, ardından yerel bir CLI arka ucu istediğinizde `agents.defaults.agentRuntime.id` değerini `claude-cli`, `google-gemini-cli` veya `codex-cli` olarak ayarlayın.

    Eski `claude-cli/*`, `google-gemini-cli/*` ve `codex-cli/*` başvuruları tekrar kanonik sağlayıcı başvurularına taşınır; çalışma zamanı ayrıca kaydedilir.

  </Accordion>
</AccordionGroup>

## Plugin sahipliğindeki sağlayıcı davranışı

Sağlayıcıya özgü mantığın çoğu sağlayıcı Plugin’lerinde (`registerProvider(...)`) bulunurken, OpenClaw genel çıkarım döngüsünü korur. Plugin’ler onboarding, model katalogları, auth env-var eşlemesi, transport/config normalizasyonu, araç şeması temizliği, failover sınıflandırması, OAuth yenileme, kullanım raporlama, thinking/reasoning profilleri ve daha fazlasına sahiptir.

Sağlayıcı-SDK hook’larının tam listesi ve paketlenmiş Plugin örnekleri [Provider plugins](/tr/plugins/sdk-provider-plugins) içinde yer alır. Tamamen özel bir istek yürütücüsüne ihtiyaç duyan bir sağlayıcı, daha derin ve ayrı bir uzantı yüzeyidir.

<Note>
Sağlayıcı çalışma zamanı `capabilities`, paylaşılan runner meta verisidir (sağlayıcı ailesi, transcript/tooling tuhaflıkları, transport/cache ipuçları). Bu, bir Plugin’in ne kaydettiğini açıklayan [public capability model](/tr/plugins/architecture#public-capability-model) ile aynı şey değildir (metin çıkarımı, konuşma vb.).
</Note>

## API anahtarı döndürme

<AccordionGroup>
  <Accordion title="Anahtar kaynakları ve öncelik">
    Birden çok anahtarı şu yollarla yapılandırın:

    - `OPENCLAW_LIVE_<PROVIDER>_KEY` (tek canlı geçersiz kılma, en yüksek öncelik)
    - `<PROVIDER>_API_KEYS` (virgül veya noktalı virgülle ayrılmış liste)
    - `<PROVIDER>_API_KEY` (birincil anahtar)
    - `<PROVIDER>_API_KEY_*` (numaralandırılmış liste, ör. `<PROVIDER>_API_KEY_1`)

    Google sağlayıcıları için `GOOGLE_API_KEY` de geri dönüş olarak dahil edilir. Anahtar seçim sırası önceliği korur ve değerlerin tekrarını kaldırır.

  </Accordion>
  <Accordion title="Döndürme ne zaman devreye girer">
    - İstekler yalnızca hız sınırı yanıtlarında sonraki anahtarla yeniden denenir (örneğin `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` veya periyodik kullanım sınırı mesajları).
    - Hız sınırı dışındaki hatalar hemen başarısız olur; anahtar döndürme denenmez.
    - Tüm aday anahtarlar başarısız olduğunda, son hata son denemeden döndürülür.
  </Accordion>
</AccordionGroup>

## Yerleşik sağlayıcılar (pi-ai kataloğu)

OpenClaw, pi‑ai kataloğuyla birlikte gelir. Bu sağlayıcılar için `models.providers` config’i gerekmez; yalnızca auth ayarlayın ve bir model seçin.

### OpenAI

- Sağlayıcı: `openai`
- Auth: `OPENAI_API_KEY`
- İsteğe bağlı döndürme: `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2`, ayrıca `OPENCLAW_LIVE_OPENAI_KEY` (tek geçersiz kılma)
- Örnek modeller: `openai/gpt-5.5`, `openai/gpt-5.4-mini`
- Belirli bir kurulum veya API anahtarı farklı davranıyorsa hesap/model kullanılabilirliğini `openclaw models list --provider openai` ile doğrulayın.
- CLI: `openclaw onboard --auth-choice openai-api-key`
- Varsayılan transport `auto`’dur (önce WebSocket, geri dönüş olarak SSE)
- Model başına geçersiz kılma için `agents.defaults.models["openai/<model>"].params.transport` kullanın (`"sse"`, `"websocket"` veya `"auto"`)
- OpenAI Responses WebSocket warm-up, varsayılan olarak `params.openaiWsWarmup` ile etkindir (`true`/`false`)
- OpenAI öncelikli işleme, `agents.defaults.models["openai/<model>"].params.serviceTier` ile etkinleştirilebilir
- `/fast` ve `params.fastMode`, doğrudan `openai/*` Responses isteklerini `api.openai.com` üzerinde `service_tier=priority` olarak eşler
- Paylaşılan `/fast` geçişi yerine açık bir katman istediğinizde `params.serviceTier` kullanın
- Gizli OpenClaw ilişkilendirme başlıkları (`originator`, `version`, `User-Agent`) yalnızca `api.openai.com` üzerindeki yerel OpenAI trafiğinde uygulanır; genel OpenAI uyumlu proxy’lerde uygulanmaz
- Yerel OpenAI rotaları ayrıca Responses `store`, prompt-cache ipuçları ve OpenAI reasoning uyumlu yük biçimlendirmesini korur; proxy rotaları korumaz
- `openai/gpt-5.3-codex-spark`, canlı OpenAI API istekleri onu reddettiği ve mevcut Codex kataloğu onu sunmadığı için OpenClaw’da bilinçli olarak gizlenir

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
}
```

### Anthropic

- Sağlayıcı: `anthropic`
- Auth: `ANTHROPIC_API_KEY`
- İsteğe bağlı döndürme: `ANTHROPIC_API_KEYS`, `ANTHROPIC_API_KEY_1`, `ANTHROPIC_API_KEY_2`, ayrıca `OPENCLAW_LIVE_ANTHROPIC_KEY` (tek geçersiz kılma)
- Örnek model: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice apiKey`
- Doğrudan herkese açık Anthropic istekleri, `api.anthropic.com` adresine gönderilen API anahtarlı ve OAuth doğrulamalı trafik dahil olmak üzere, paylaşılan `/fast` geçişini ve `params.fastMode` değerini destekler; OpenClaw bunu Anthropic `service_tier` (`auto` ve `standard_only`) olarak eşler
- Tercih edilen Claude CLI config’i model başvurusunu kanonik tutar ve CLI arka
  ucunu ayrı seçer: `anthropic/claude-opus-4-7` ile
  `agents.defaults.agentRuntime.id: "claude-cli"`. Eski
  `claude-cli/claude-opus-4-7` başvuruları uyumluluk için hâlâ çalışır.

<Note>
Anthropic çalışanları bize OpenClaw tarzı Claude CLI kullanımına tekrar izin verildiğini söyledi; bu nedenle Anthropic yeni bir ilke yayımlamadıkça OpenClaw, Claude CLI yeniden kullanımını ve `claude -p` kullanımını bu entegrasyon için onaylı kabul eder. Anthropic setup-token, desteklenen bir OpenClaw token yolu olarak hâlâ mevcuttur, ancak OpenClaw artık mümkün olduğunda Claude CLI yeniden kullanımını ve `claude -p` kullanımını tercih eder.
</Note>

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OpenAI Codex OAuth

- Sağlayıcı: `openai-codex`
- Auth: OAuth (ChatGPT)
- PI model başvurusu: `openai-codex/gpt-5.5`
- Yerel Codex app-server harness başvurusu: `openai/gpt-5.5` ile `agents.defaults.agentRuntime.id: "codex"`
- Yerel Codex app-server harness belgeleri: [Codex harness](/tr/plugins/codex-harness)
- Eski model başvuruları: `codex/gpt-*`
- Plugin sınırı: `openai-codex/*` OpenAI Plugin’ini yükler; yerel Codex app-server Plugin’i yalnızca Codex harness çalışma zamanı veya eski `codex/*` başvurularıyla seçilir.
- CLI: `openclaw onboard --auth-choice openai-codex` veya `openclaw models auth login --provider openai-codex`
- Varsayılan transport `auto`’dur (önce WebSocket, geri dönüş olarak SSE)
- PI model başına geçersiz kılma için `agents.defaults.models["openai-codex/<model>"].params.transport` kullanın (`"sse"`, `"websocket"` veya `"auto"`)
- `params.serviceTier`, yerel Codex Responses isteklerinde de iletilir (`chatgpt.com/backend-api`)
- Gizli OpenClaw ilişkilendirme başlıkları (`originator`, `version`, `User-Agent`) yalnızca `chatgpt.com/backend-api` üzerindeki yerel Codex trafiğine eklenir; genel OpenAI uyumlu proxy’lere eklenmez
- Doğrudan `openai/*` ile aynı `/fast` geçişini ve `params.fastMode` config’ini paylaşır; OpenClaw bunu `service_tier=priority` olarak eşler
- `openai-codex/gpt-5.5`, Codex kataloğunun yerel `contextWindow = 400000` ve varsayılan çalışma zamanı `contextTokens = 272000` değerlerini kullanır; çalışma zamanı sınırını `models.providers.openai-codex.models[].contextTokens` ile geçersiz kılın
- İlke notu: OpenAI Codex OAuth, OpenClaw gibi harici araçlar/iş akışları için açıkça desteklenir.
- Codex OAuth/abonelik yolunu istediğinizde `openai-codex/gpt-5.5`, API anahtarı kurulumunuz ve yerel kataloğunuz herkese açık API yolunu sunduğunda `openai/gpt-5.5` kullanın.

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

<CardGroup cols={3}>
  <Card title="GLM modelleri" href="/tr/providers/glm">
    Z.AI Coding Plan veya genel API uç noktaları.
  </Card>
  <Card title="MiniMax" href="/tr/providers/minimax">
    MiniMax Coding Plan OAuth veya API anahtarı erişimi.
  </Card>
  <Card title="Qwen Cloud" href="/tr/providers/qwen">
    Qwen Cloud sağlayıcı yüzeyi ile Alibaba DashScope ve Coding Plan uç nokta eşlemesi.
  </Card>
</CardGroup>

### OpenCode

- Auth: `OPENCODE_API_KEY` (veya `OPENCODE_ZEN_API_KEY`)
- Zen çalışma zamanı sağlayıcısı: `opencode`
- Go çalışma zamanı sağlayıcısı: `opencode-go`
- Örnek modeller: `opencode/claude-opus-4-6`, `opencode-go/kimi-k2.6`
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
- Uyumluluk: `google/gemini-3.1-flash-preview` kullanan eski OpenClaw config’i `google/gemini-3-flash-preview` olarak normalleştirilir
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- Thinking: `/think adaptive`, Google dynamic thinking kullanır. Gemini 3/3.1 sabit bir `thinkingLevel` içermez; Gemini 2.5 `thinkingBudget: -1` gönderir.
- Doğrudan Gemini çalıştırmaları, sağlayıcıya özgü yerel `cachedContents/...` tanıtıcısını iletmek için `agents.defaults.models["google/<model>"].params.cachedContent` (veya eski `cached_content`) değerini de kabul eder; Gemini cache isabetleri OpenClaw `cacheRead` olarak görünür

### Google Vertex ve Gemini CLI

- Sağlayıcılar: `google-vertex`, `google-gemini-cli`
- Auth: Vertex, gcloud ADC kullanır; Gemini CLI kendi OAuth akışını kullanır

<Warning>
OpenClaw içindeki Gemini CLI OAuth resmî olmayan bir entegrasyondur. Bazı kullanıcılar üçüncü taraf istemciler kullandıktan sonra Google hesap kısıtlamaları bildirmiştir. Devam etmeyi seçerseniz Google şartlarını inceleyin ve kritik olmayan bir hesap kullanın.
</Warning>

Gemini CLI OAuth, paketlenmiş `google` Plugin’inin bir parçası olarak gelir.

<Steps>
  <Step title="Gemini CLI’yi yükleyin">
    <Tabs>
      <Tab title="brew">
        ```bash
        brew install gemini-cli
        ```
      </Tab>
      <Tab title="npm">
        ```bash
        npm install -g @google/gemini-cli
        ```
      </Tab>
    </Tabs>
  </Step>
  <Step title="Plugin’i etkinleştirin">
    ```bash
    openclaw plugins enable google
    ```
  </Step>
  <Step title="Giriş yapın">
    ```bash
    openclaw models auth login --provider google-gemini-cli --set-default
    ```

    Varsayılan model: `google-gemini-cli/gemini-3-flash-preview`. `openclaw.json` içine bir client id veya secret **yapıştırmazsınız**. CLI giriş akışı token’ları Gateway ana makinesindeki auth profillerinde saklar.

  </Step>
  <Step title="Projeyi ayarlayın (gerekiyorsa)">
    Girişten sonra istekler başarısız olursa, Gateway ana makinesinde `GOOGLE_CLOUD_PROJECT` veya `GOOGLE_CLOUD_PROJECT_ID` ayarlayın.
  </Step>
</Steps>

Gemini CLI JSON yanıtları `response` içinden ayrıştırılır; kullanım bilgisi `stats` içinden geri alınır ve `stats.cached`, OpenClaw `cacheRead` olarak normalleştirilir.

### Z.AI (GLM)

- Sağlayıcı: `zai`
- Auth: `ZAI_API_KEY`
- Örnek model: `zai/glm-5.1`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - Takma adlar: `z.ai/*` ve `z-ai/*`, `zai/*` olarak normalleştirilir
  - `zai-api-key`, eşleşen Z.AI uç noktasını otomatik algılar; `zai-coding-global`, `zai-coding-cn`, `zai-global` ve `zai-cn` belirli bir yüzeyi zorlar

### Vercel AI Gateway

- Sağlayıcı: `vercel-ai-gateway`
- Auth: `AI_GATEWAY_API_KEY`
- Örnek modeller: `vercel-ai-gateway/anthropic/claude-opus-4.6`, `vercel-ai-gateway/moonshotai/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice ai-gateway-api-key`

### Kilo Gateway

- Sağlayıcı: `kilocode`
- Auth: `KILOCODE_API_KEY`
- Örnek model: `kilocode/kilo/auto`
- CLI: `openclaw onboard --auth-choice kilocode-api-key`
- Temel URL: `https://api.kilo.ai/api/gateway/`
- Statik geri dönüş kataloğu `kilocode/kilo/auto` ile gelir; canlı `https://api.kilo.ai/api/gateway/models` keşfi çalışma zamanı kataloğunu daha da genişletebilir.
- `kilocode/kilo/auto` arkasındaki tam upstream yönlendirme OpenClaw içinde sabit kodlanmış değildir; Kilo Gateway buna sahiptir.

Kurulum ayrıntıları için bkz. [/providers/kilocode](/tr/providers/kilocode).

### Diğer paketlenmiş sağlayıcı Plugin’leri

| Sağlayıcı               | Kimlik                          | Auth env                                                     | Örnek model                                    |
| ----------------------- | ------------------------------- | ------------------------------------------------------------ | ---------------------------------------------- |
| BytePlus                | `byteplus` / `byteplus-plan`    | `BYTEPLUS_API_KEY`                                           | `byteplus-plan/ark-code-latest`                |
| Cerebras                | `cerebras`                      | `CEREBRAS_API_KEY`                                           | `cerebras/zai-glm-4.7`                         |
| Cloudflare AI Gateway   | `cloudflare-ai-gateway`         | `CLOUDFLARE_AI_GATEWAY_API_KEY`                              | —                                              |
| DeepSeek                | `deepseek`                      | `DEEPSEEK_API_KEY`                                           | `deepseek/deepseek-v4-flash`                   |
| GitHub Copilot          | `github-copilot`                | `COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN`         | —                                              |
| Groq                    | `groq`                          | `GROQ_API_KEY`                                               | —                                              |
| Hugging Face Inference  | `huggingface`                   | `HUGGINGFACE_HUB_TOKEN` veya `HF_TOKEN`                      | `huggingface/deepseek-ai/DeepSeek-R1`          |
| Kilo Gateway            | `kilocode`                      | `KILOCODE_API_KEY`                                           | `kilocode/kilo/auto`                           |
| Kimi Coding             | `kimi`                          | `KIMI_API_KEY` veya `KIMICODE_API_KEY`                       | `kimi/kimi-code`                               |
| MiniMax                 | `minimax` / `minimax-portal`    | `MINIMAX_API_KEY` / `MINIMAX_OAUTH_TOKEN`                    | `minimax/MiniMax-M2.7`                         |
| Mistral                 | `mistral`                       | `MISTRAL_API_KEY`                                            | `mistral/mistral-large-latest`                 |
| Moonshot                | `moonshot`                      | `MOONSHOT_API_KEY`                                           | `moonshot/kimi-k2.6`                           |
| NVIDIA                  | `nvidia`                        | `NVIDIA_API_KEY`                                             | `nvidia/nvidia/llama-3.1-nemotron-70b-instruct` |
| OpenRouter              | `openrouter`                    | `OPENROUTER_API_KEY`                                         | `openrouter/auto`                              |
| Qianfan                 | `qianfan`                       | `QIANFAN_API_KEY`                                            | `qianfan/deepseek-v3.2`                        |
| Qwen Cloud              | `qwen`                          | `QWEN_API_KEY` / `MODELSTUDIO_API_KEY` / `DASHSCOPE_API_KEY` | `qwen/qwen3.5-plus`                            |
| StepFun                 | `stepfun` / `stepfun-plan`      | `STEPFUN_API_KEY`                                            | `stepfun/step-3.5-flash`                       |
| Together                | `together`                      | `TOGETHER_API_KEY`                                           | `together/moonshotai/Kimi-K2.5`                |
| Venice                  | `venice`                        | `VENICE_API_KEY`                                             | —                                              |
| Vercel AI Gateway       | `vercel-ai-gateway`             | `AI_GATEWAY_API_KEY`                                         | `vercel-ai-gateway/anthropic/claude-opus-4.6`  |
| Volcano Engine (Doubao) | `volcengine` / `volcengine-plan`| `VOLCANO_ENGINE_API_KEY`                                     | `volcengine-plan/ark-code-latest`              |
| xAI                     | `xai`                           | `XAI_API_KEY`                                                | `xai/grok-4`                                   |
| Xiaomi                  | `xiaomi`                        | `XIAOMI_API_KEY`                                             | `xiaomi/mimo-v2-flash`                         |

#### Bilinmeye değer tuhaflıklar

<AccordionGroup>
  <Accordion title="OpenRouter">
    Uygulama ilişkilendirme başlıklarını ve Anthropic `cache_control` işaretçilerini yalnızca doğrulanmış `openrouter.ai` rotalarında uygular. DeepSeek, Moonshot ve ZAI başvuruları OpenRouter tarafından yönetilen prompt caching için cache-TTL uygunluğuna sahiptir, ancak Anthropic cache işaretçilerini almaz. Proxy tarzı OpenAI uyumlu bir yol olduğundan, yalnızca yerel OpenAI’ye özgü biçimlendirmeyi (`serviceTier`, Responses `store`, prompt-cache ipuçları, OpenAI reasoning uyumluluğu) atlar. Gemini tabanlı başvurular yalnızca proxy-Gemini thought-signature temizliğini korur.
  </Accordion>
  <Accordion title="Kilo Gateway">
    Gemini tabanlı başvurular aynı proxy-Gemini temizleme yolunu izler; `kilocode/kilo/auto` ve reasoning desteklemeyen diğer proxy başvuruları proxy reasoning eklemesini atlar.
  </Accordion>
  <Accordion title="MiniMax">
    API anahtarı onboarding, açık metin tabanlı M2.7 sohbet model tanımları yazar; görsel anlama ise Plugin sahipliğindeki `MiniMax-VL-01` medya sağlayıcısında kalır.
  </Accordion>
  <Accordion title="xAI">
    xAI Responses yolunu kullanır. `/fast` veya `params.fastMode: true`, `grok-3`, `grok-3-mini`, `grok-4` ve `grok-4-0709` modellerini `*-fast` varyantlarına yeniden yazar. `tool_stream` varsayılan olarak açıktır; `agents.defaults.models["xai/<model>"].params.tool_stream=false` ile devre dışı bırakın.
  </Accordion>
  <Accordion title="Cerebras">
    GLM modelleri `zai-glm-4.7` / `zai-glm-4.6` kullanır; OpenAI uyumlu temel URL `https://api.cerebras.ai/v1` değeridir.
  </Accordion>
</AccordionGroup>

## `models.providers` üzerinden sağlayıcılar (özel/temel URL)

**Özel** sağlayıcılar veya OpenAI/Anthropic uyumlu proxy’ler eklemek için `models.providers` (veya `models.json`) kullanın.

Aşağıdaki paketlenmiş sağlayıcı Plugin’lerinin çoğu zaten varsayılan bir katalog yayımlar. Varsayılan temel URL’yi, başlıkları veya model listesini geçersiz kılmak istediğinizde yalnızca açık `models.providers.<id>` girdilerini kullanın.

### Moonshot AI (Kimi)

Moonshot, paketlenmiş bir sağlayıcı Plugin’i olarak gelir. Varsayılan olarak yerleşik sağlayıcıyı kullanın ve yalnızca temel URL’yi veya model meta verisini geçersiz kılmanız gerektiğinde açık bir `models.providers.moonshot` girdisi ekleyin:

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

Kimi Coding, Moonshot AI’nin Anthropic uyumlu uç noktasını kullanır:

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

Eski `kimi/k2p5`, uyumluluk modeli kimliği olarak kabul edilmeye devam eder.

### Volcano Engine (Doubao)

Volcano Engine (火山引擎), Çin’de Doubao ve diğer modellere erişim sağlar.

- Sağlayıcı: `volcengine` (coding: `volcengine-plan`)
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

Onboarding varsayılan olarak coding yüzeyini kullanır, ancak genel `volcengine/*` kataloğu da aynı anda kaydedilir.

Onboarding/configure model seçicilerinde, Volcengine auth seçimi hem `volcengine/*` hem de `volcengine-plan/*` satırlarını tercih eder. Bu modeller henüz yüklenmemişse, OpenClaw boş bir sağlayıcı kapsamlı seçici göstermek yerine filtrelenmemiş kataloğa geri döner.

<Tabs>
  <Tab title="Standart modeller">
    - `volcengine/doubao-seed-1-8-251228` (Doubao Seed 1.8)
    - `volcengine/doubao-seed-code-preview-251028`
    - `volcengine/kimi-k2-5-260127` (Kimi K2.5)
    - `volcengine/glm-4-7-251222` (GLM 4.7)
    - `volcengine/deepseek-v3-2-251201` (DeepSeek V3.2 128K)
  </Tab>
  <Tab title="Coding modelleri (volcengine-plan)">
    - `volcengine-plan/ark-code-latest`
    - `volcengine-plan/doubao-seed-code`
    - `volcengine-plan/kimi-k2.5`
    - `volcengine-plan/kimi-k2-thinking`
    - `volcengine-plan/glm-4.7`
  </Tab>
</Tabs>

### BytePlus (Uluslararası)

BytePlus ARK, uluslararası kullanıcılar için Volcano Engine ile aynı modellere erişim sağlar.

- Sağlayıcı: `byteplus` (coding: `byteplus-plan`)
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

Onboarding varsayılan olarak coding yüzeyini kullanır, ancak genel `byteplus/*` kataloğu da aynı anda kaydedilir.

Onboarding/configure model seçicilerinde, BytePlus auth seçimi hem `byteplus/*` hem de `byteplus-plan/*` satırlarını tercih eder. Bu modeller henüz yüklenmemişse, OpenClaw boş bir sağlayıcı kapsamlı seçici göstermek yerine filtrelenmemiş kataloğa geri döner.

<Tabs>
  <Tab title="Standart modeller">
    - `byteplus/seed-1-8-251228` (Seed 1.8)
    - `byteplus/kimi-k2-5-260127` (Kimi K2.5)
    - `byteplus/glm-4-7-251222` (GLM 4.7)
  </Tab>
  <Tab title="Coding modelleri (byteplus-plan)">
    - `byteplus-plan/ark-code-latest`
    - `byteplus-plan/doubao-seed-code`
    - `byteplus-plan/kimi-k2.5`
    - `byteplus-plan/kimi-k2-thinking`
    - `byteplus-plan/glm-4.7`
  </Tab>
</Tabs>

### Synthetic

Synthetic, `synthetic` sağlayıcısının arkasında Anthropic uyumlu modeller sunar:

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
- Auth: `minimax` için `MINIMAX_API_KEY`; `minimax-portal` için `MINIMAX_OAUTH_TOKEN` veya `MINIMAX_API_KEY`

Kurulum ayrıntıları, model seçenekleri ve config parçacıkları için bkz. [/providers/minimax](/tr/providers/minimax).

<Note>
MiniMax’ın Anthropic uyumlu akış yolunda OpenClaw, siz açıkça ayarlamadıkça varsayılan olarak thinking’i devre dışı bırakır ve `/fast on`, `MiniMax-M2.7` modelini `MiniMax-M2.7-highspeed` olarak yeniden yazar.
</Note>

Plugin sahipliğindeki yetenek ayrımı:

- Metin/sohbet varsayılanları `minimax/MiniMax-M2.7` üzerinde kalır
- Görsel üretimi `minimax/image-01` veya `minimax-portal/image-01` olur
- Görsel anlama, her iki MiniMax auth yolunda da Plugin sahipliğindeki `MiniMax-VL-01` üzerindedir
- Web araması sağlayıcı kimliği `minimax` üzerinde kalır

### LM Studio

LM Studio, yerel API’yi kullanan paketlenmiş bir sağlayıcı Plugin’i olarak gelir:

- Sağlayıcı: `lmstudio`
- Auth: `LM_API_TOKEN`
- Varsayılan çıkarım temel URL’si: `http://localhost:1234/v1`

Ardından bir model ayarlayın (`http://localhost:1234/api/v1/models` tarafından döndürülen kimliklerden biriyle değiştirin):

```json5
{
  agents: {
    defaults: { model: { primary: "lmstudio/openai/gpt-oss-20b" } },
  },
}
```

OpenClaw, keşif + otomatik yükleme için LM Studio’nun yerel `/api/v1/models` ve `/api/v1/models/load` uç noktalarını, varsayılan olarak çıkarım için ise `/v1/chat/completions` uç noktasını kullanır. Kurulum ve sorun giderme için bkz. [/providers/lmstudio](/tr/providers/lmstudio).

### Ollama

Ollama, paketlenmiş bir sağlayıcı Plugin’i olarak gelir ve Ollama’nın yerel API’sini kullanır:

- Sağlayıcı: `ollama`
- Auth: Gerekmez (yerel sunucu)
- Örnek model: `ollama/llama3.3`
- Kurulum: [https://ollama.com/download](https://ollama.com/download)

```bash
# Önce Ollama'yı kurun, ardından bir model çekin:
ollama pull llama3.3
```

```json5
{
  agents: {
    defaults: { model: { primary: "ollama/llama3.3" } },
  },
}
```

`OLLAMA_API_KEY` ile katıldığınızda Ollama yerelde `http://127.0.0.1:11434` üzerinde algılanır ve paketlenmiş sağlayıcı Plugin’i Ollama’yı doğrudan `openclaw onboard` ve model seçicisine ekler. Onboarding, bulut/yerel mod ve özel yapılandırma için bkz. [/providers/ollama](/tr/providers/ollama).

### vLLM

vLLM, yerel/self-hosted OpenAI uyumlu sunucular için paketlenmiş bir sağlayıcı Plugin’i olarak gelir:

- Sağlayıcı: `vllm`
- Auth: İsteğe bağlıdır (sunucunuza bağlıdır)
- Varsayılan temel URL: `http://127.0.0.1:8000/v1`

Yerelde otomatik keşfe katılmak için (sunucunuz auth zorlamıyorsa herhangi bir değer çalışır):

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

SGLang, hızlı self-hosted OpenAI uyumlu sunucular için paketlenmiş bir sağlayıcı Plugin’i olarak gelir:

- Sağlayıcı: `sglang`
- Auth: İsteğe bağlıdır (sunucunuza bağlıdır)
- Varsayılan temel URL: `http://127.0.0.1:30000/v1`

Yerelde otomatik keşfe katılmak için (sunucunuz auth zorlamıyorsa herhangi bir değer çalışır):

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

### Yerel proxy’ler (LM Studio, vLLM, LiteLLM vb.)

Örnek (OpenAI uyumlu):

```json5
{
  agents: {
    defaults: {
      model: { primary: "lmstudio/my-local-model" },
      models: { "lmstudio/my-local-model": { alias: "Local" } },
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

<AccordionGroup>
  <Accordion title="Varsayılan isteğe bağlı alanlar">
    Özel sağlayıcılar için `reasoning`, `input`, `cost`, `contextWindow` ve `maxTokens` isteğe bağlıdır. Atlandığında OpenClaw şu varsayılanları kullanır:

    - `reasoning: false`
    - `input: ["text"]`
    - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
    - `contextWindow: 200000`
    - `maxTokens: 8192`

    Öneri: proxy/model sınırlarınızla eşleşen açık değerler ayarlayın.

  </Accordion>
  <Accordion title="Proxy rotası biçimlendirme kuralları">
    - Yerel olmayan uç noktalarda (ana bilgisayarı `api.openai.com` olmayan, boş olmayan herhangi bir `baseUrl`) `api: "openai-completions"` için OpenClaw, desteklenmeyen `developer` rolleri nedeniyle sağlayıcı 400 hatalarını önlemek amacıyla `compat.supportsDeveloperRole: false` değerini zorlar.
    - Proxy tarzı OpenAI uyumlu rotalar ayrıca yalnızca yerel OpenAI’ye özgü istek biçimlendirmesini atlar: `service_tier` yok, Responses `store` yok, Completions `store` yok, prompt-cache ipuçları yok, OpenAI reasoning uyumlu yük biçimlendirmesi yok ve gizli OpenClaw ilişkilendirme başlıkları yok.
    - Satıcıya özgü alanlara ihtiyaç duyan OpenAI uyumlu Completions proxy’leri için, giden istek gövdesine ek JSON birleştirmek üzere `agents.defaults.models["provider/model"].params.extra_body` (veya `extraBody`) ayarlayın.
    - vLLM chat-template denetimleri için `agents.defaults.models["provider/model"].params.chat_template_kwargs` ayarlayın. OpenClaw, oturum thinking seviyesi kapalı olduğunda `vllm/nemotron-3-*` için otomatik olarak `enable_thinking: false` ve `force_nonempty_content: true` gönderir.
    - `baseUrl` boşsa/atlanmışsa OpenClaw varsayılan OpenAI davranışını korur (bu da `api.openai.com` adresine çözülür).
    - Güvenlik için, açık bir `compat.supportsDeveloperRole: true` değeri bile yerel olmayan `openai-completions` uç noktalarında yine geçersiz kılınır.
  </Accordion>
</AccordionGroup>

## CLI örnekleri

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

Ayrıca bkz.: Tam yapılandırma örnekleri için [Configuration](/tr/gateway/configuration).

## İlgili

- [Configuration reference](/tr/gateway/config-agents#agent-defaults) — model config anahtarları
- [Model failover](/tr/concepts/model-failover) — geri dönüş zincirleri ve yeniden deneme davranışı
- [Models](/tr/concepts/models) — model yapılandırması ve takma adlar
- [Providers](/tr/providers) — sağlayıcı başına kurulum rehberleri
