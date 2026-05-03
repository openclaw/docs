---
read_when:
    - Sağlayıcı bazında model kurulumu referansına ihtiyacınız var
    - Model sağlayıcıları için örnek yapılandırmalar veya CLI ilk kurulum komutları istiyorsunuz
sidebarTitle: Model providers
summary: Örnek yapılandırmalar + CLI akışlarıyla model sağlayıcılarına genel bakış
title: Model sağlayıcıları
x-i18n:
    generated_at: "2026-05-03T08:55:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: bfb12090228ec89bc116558fe3e0bf9977c750550ef8efbf55b1af6c873c9825
    source_path: concepts/model-providers.md
    workflow: 16
---

LLM/model sağlayıcıları için referans (WhatsApp/Telegram gibi sohbet kanalları değil). Model seçim kuralları için bkz. [Modeller](/tr/concepts/models).

## Hızlı kurallar

<AccordionGroup>
  <Accordion title="Model referansları ve CLI yardımcıları">
    - Model referansları `provider/model` biçimini kullanır (örnek: `opencode/claude-opus-4-6`).
    - `agents.defaults.models` ayarlandığında izin listesi gibi davranır.
    - CLI yardımcıları: `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`.
    - `models.providers.*.contextWindow` / `contextTokens` / `maxTokens` sağlayıcı düzeyindeki varsayılanları ayarlar; `models.providers.*.models[].contextWindow` / `contextTokens` / `maxTokens` bunları model başına geçersiz kılar.
    - Geri dönüş kuralları, bekleme süresi yoklamaları ve oturum geçersiz kılma kalıcılığı: [Model failover](/tr/concepts/model-failover).

  </Accordion>
  <Accordion title="Sağlayıcı kimlik doğrulaması eklemek birincil modelinizi değiştirmez">
    `openclaw configure`, bir sağlayıcı eklediğinizde veya yeniden kimlik doğrulaması yaptığınızda mevcut `agents.defaults.model.primary` değerini korur. Sağlayıcı Plugin'leri kimlik doğrulama yapılandırma yamalarında yine önerilen bir varsayılan model döndürebilir, ancak configure bunu birincil model zaten varsa "geçerli birincil modeli değiştir" olarak değil, "bu modeli kullanılabilir yap" olarak ele alır.

    Varsayılan modeli bilinçli olarak değiştirmek için `openclaw models set <provider/model>` veya `openclaw models auth login --provider <id> --set-default` kullanın.

  </Accordion>
  <Accordion title="OpenAI sağlayıcı/runtime ayrımı">
    OpenAI ailesi rotaları öneke özeldir:

    - `openai/<model>` ve `agents.defaults.agentRuntime.id: "codex"` yerel Codex uygulama sunucusu çalıştırma düzeneğini kullanır. Bu, olağan ChatGPT/Codex abonelik kurulumudur.
    - `openai-codex/<model>` PI içinde Codex OAuth kullanır.
    - Codex runtime geçersiz kılması olmadan `openai/<model>`, PI içinde doğrudan OpenAI API anahtarı sağlayıcısını kullanır.

    Bkz. [OpenAI](/tr/providers/openai) ve [Codex harness](/tr/plugins/codex-harness). Sağlayıcı/runtime ayrımı kafa karıştırıcıysa önce [Agent runtimes](/tr/concepts/agent-runtimes) sayfasını okuyun.

    Plugin otomatik etkinleştirme aynı sınırı izler: `openai-codex/<model>` OpenAI Plugin'ine aittir, Codex Plugin'i ise `agentRuntime.id: "codex"` veya eski `codex/<model>` referanslarıyla etkinleştirilir.

    GPT-5.5, `agentRuntime.id: "codex"` ayarlandığında yerel Codex uygulama sunucusu çalıştırma düzeneği üzerinden, Codex OAuth için PI içinde `openai-codex/gpt-5.5` üzerinden ve hesabınız bunu sunduğunda doğrudan API anahtarı trafiği için PI içinde `openai/gpt-5.5` üzerinden kullanılabilir.

  </Accordion>
  <Accordion title="CLI runtime'ları">
    CLI runtime'ları aynı ayrımı kullanır: `anthropic/claude-*`, `google/gemini-*` veya `openai/gpt-*` gibi kurallı model referanslarını seçin, ardından yerel bir CLI arka ucu istediğinizde `agents.defaults.agentRuntime.id` değerini `claude-cli`, `google-gemini-cli` veya `codex-cli` olarak ayarlayın.

    Eski `claude-cli/*`, `google-gemini-cli/*` ve `codex-cli/*` referansları, runtime ayrı olarak kaydedilerek kurallı sağlayıcı referanslarına geri taşınır.

  </Accordion>
</AccordionGroup>

## Plugin'e ait sağlayıcı davranışı

Sağlayıcıya özgü mantığın çoğu sağlayıcı Plugin'lerinde (`registerProvider(...)`) bulunurken OpenClaw genel çıkarım döngüsünü tutar. Plugin'ler onboarding, model katalogları, kimlik doğrulama ortam değişkeni eşlemesi, taşıma/yapılandırma normalleştirmesi, araç şeması temizliği, failover sınıflandırması, OAuth yenileme, kullanım raporlaması, düşünme/akıl yürütme profilleri ve daha fazlasına sahiptir.

Sağlayıcı SDK kancalarının ve paketlenmiş Plugin örneklerinin tam listesi [Sağlayıcı Plugin'leri](/tr/plugins/sdk-provider-plugins) içinde yer alır. Tamamen özel bir istek yürütücüsüne ihtiyaç duyan bir sağlayıcı ayrı ve daha derin bir genişletme yüzeyidir.

<Note>
Sağlayıcıya ait runner davranışı; yeniden oynatma ilkesi, araç şeması normalleştirmesi, akış sarmalama ve taşıma/istek yardımcıları gibi açık sağlayıcı kancalarında bulunur. Eski `ProviderPlugin.capabilities` statik torbası yalnızca uyumluluk içindir ve artık paylaşılan runner mantığı tarafından okunmaz.
</Note>

## API anahtarı rotasyonu

<AccordionGroup>
  <Accordion title="Anahtar kaynakları ve öncelik">
    Birden çok anahtarı şu şekilde yapılandırın:

    - `OPENCLAW_LIVE_<PROVIDER>_KEY` (tek canlı geçersiz kılma, en yüksek öncelik)
    - `<PROVIDER>_API_KEYS` (virgül veya noktalı virgülle ayrılmış liste)
    - `<PROVIDER>_API_KEY` (birincil anahtar)
    - `<PROVIDER>_API_KEY_*` (numaralı liste, örn. `<PROVIDER>_API_KEY_1`)

    Google sağlayıcıları için `GOOGLE_API_KEY` de geri dönüş olarak dahil edilir. Anahtar seçim sırası önceliği korur ve yinelenen değerleri kaldırır.

  </Accordion>
  <Accordion title="Rotasyon ne zaman devreye girer">
    - İstekler yalnızca hız sınırı yanıtlarında sonraki anahtarla yeniden denenir (örneğin `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` veya düzenli kullanım sınırı iletileri).
    - Hız sınırı olmayan hatalar hemen başarısız olur; anahtar rotasyonu denenmez.
    - Tüm aday anahtarlar başarısız olduğunda son hatadan gelen nihai hata döndürülür.

  </Accordion>
</AccordionGroup>

## Yerleşik sağlayıcılar (pi-ai kataloğu)

OpenClaw, pi‑ai kataloğuyla gelir. Bu sağlayıcılar **hiçbir** `models.providers` yapılandırması gerektirmez; yalnızca kimlik doğrulamasını ayarlayın ve bir model seçin.

### OpenAI

- Sağlayıcı: `openai`
- Kimlik doğrulama: `OPENAI_API_KEY`
- İsteğe bağlı rotasyon: `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2`, ayrıca `OPENCLAW_LIVE_OPENAI_KEY` (tek geçersiz kılma)
- Örnek modeller: `openai/gpt-5.5`, `openai/gpt-5.4-mini`
- Belirli bir kurulum veya API anahtarı farklı davranıyorsa hesap/model kullanılabilirliğini `openclaw models list --provider openai` ile doğrulayın.
- CLI: `openclaw onboard --auth-choice openai-api-key`
- Varsayılan taşıma `auto` değeridir (önce WebSocket, SSE geri dönüşü)
- Model başına `agents.defaults.models["openai/<model>"].params.transport` ile geçersiz kılın (`"sse"`, `"websocket"` veya `"auto"`)
- OpenAI Responses WebSocket ısınması varsayılan olarak `params.openaiWsWarmup` (`true`/`false`) üzerinden etkindir
- OpenAI öncelikli işleme `agents.defaults.models["openai/<model>"].params.serviceTier` üzerinden etkinleştirilebilir
- `/fast` ve `params.fastMode`, doğrudan `openai/*` Responses isteklerini `api.openai.com` üzerinde `service_tier=priority` değerine eşler
- Paylaşılan `/fast` anahtarı yerine açık bir katman istediğinizde `params.serviceTier` kullanın
- Gizli OpenClaw atıf başlıkları (`originator`, `version`, `User-Agent`) yalnızca `api.openai.com` üzerindeki yerel OpenAI trafiğine uygulanır, genel OpenAI uyumlu proxy'lere uygulanmaz
- Yerel OpenAI rotaları ayrıca Responses `store`, prompt önbellek ipuçları ve OpenAI akıl yürütme uyumluluğu yük şekillendirmesini korur; proxy rotaları korumaz
- `openai/gpt-5.3-codex-spark`, canlı OpenAI API istekleri bunu reddettiği ve mevcut Codex kataloğu bunu sunmadığı için OpenClaw içinde bilinçli olarak bastırılmıştır

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
}
```

### Anthropic

- Sağlayıcı: `anthropic`
- Kimlik doğrulama: `ANTHROPIC_API_KEY`
- İsteğe bağlı rotasyon: `ANTHROPIC_API_KEYS`, `ANTHROPIC_API_KEY_1`, `ANTHROPIC_API_KEY_2`, ayrıca `OPENCLAW_LIVE_ANTHROPIC_KEY` (tek geçersiz kılma)
- Örnek model: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice apiKey`
- Doğrudan genel Anthropic istekleri, `api.anthropic.com` adresine gönderilen API anahtarı ve OAuth kimlik doğrulamalı trafik dahil olmak üzere paylaşılan `/fast` anahtarını ve `params.fastMode` değerini destekler; OpenClaw bunu Anthropic `service_tier` değerine eşler (`auto` ve `standard_only`)
- Tercih edilen Claude CLI yapılandırması model referansını kurallı tutar ve CLI
  arka ucunu ayrı seçer: `anthropic/claude-opus-4-7` ile
  `agents.defaults.agentRuntime.id: "claude-cli"`. Eski
  `claude-cli/claude-opus-4-7` referansları uyumluluk için çalışmaya devam eder.

<Note>
Anthropic çalışanları bize OpenClaw tarzı Claude CLI kullanımına yeniden izin verildiğini söyledi; bu nedenle Anthropic yeni bir ilke yayımlamadığı sürece OpenClaw, Claude CLI yeniden kullanımını ve `claude -p` kullanımını bu entegrasyon için onaylanmış kabul eder. Anthropic kurulum belirteci desteklenen bir OpenClaw belirteç yolu olarak kullanılabilir olmaya devam eder, ancak OpenClaw artık mevcut olduğunda Claude CLI yeniden kullanımını ve `claude -p` kullanımını tercih eder.
</Note>

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OpenAI Codex OAuth

- Sağlayıcı: `openai-codex`
- Kimlik doğrulama: OAuth (ChatGPT)
- PI model referansı: `openai-codex/gpt-5.5`
- Yerel Codex uygulama sunucusu çalıştırma düzeneği referansı: `openai/gpt-5.5` ile `agents.defaults.agentRuntime.id: "codex"`
- Yerel Codex uygulama sunucusu çalıştırma düzeneği belgeleri: [Codex harness](/tr/plugins/codex-harness)
- Eski model referansları: `codex/gpt-*`
- Plugin sınırı: `openai-codex/*` OpenAI Plugin'ini yükler; yerel Codex uygulama sunucusu Plugin'i yalnızca Codex harness runtime'ı veya eski `codex/*` referansları tarafından seçilir.
- CLI: `openclaw onboard --auth-choice openai-codex` veya `openclaw models auth login --provider openai-codex`
- Varsayılan taşıma `auto` değeridir (önce WebSocket, SSE geri dönüşü)
- PI modeli başına `agents.defaults.models["openai-codex/<model>"].params.transport` ile geçersiz kılın (`"sse"`, `"websocket"` veya `"auto"`)
- `params.serviceTier` yerel Codex Responses isteklerinde de iletilir (`chatgpt.com/backend-api`)
- Gizli OpenClaw atıf başlıkları (`originator`, `version`, `User-Agent`) yalnızca `chatgpt.com/backend-api` üzerindeki yerel Codex trafiğine eklenir, genel OpenAI uyumlu proxy'lere eklenmez
- Doğrudan `openai/*` ile aynı `/fast` anahtarını ve `params.fastMode` yapılandırmasını paylaşır; OpenClaw bunu `service_tier=priority` değerine eşler
- `openai-codex/gpt-5.5`, Codex kataloğunun yerel `contextWindow = 400000` değerini ve varsayılan runtime `contextTokens = 272000` değerini kullanır; runtime sınırını `models.providers.openai-codex.models[].contextTokens` ile geçersiz kılın
- İlke notu: OpenAI Codex OAuth, OpenClaw gibi harici araçlar/iş akışları için açıkça desteklenir.
- Yaygın abonelik artı yerel Codex runtime rotası için `openai-codex` kimlik doğrulamasıyla oturum açın, ancak `openai/gpt-5.5` artı `agents.defaults.agentRuntime.id: "codex"` yapılandırın.
- `openai-codex/gpt-5.5` değerini yalnızca PI üzerinden Codex OAuth/abonelik rotasını istediğinizde kullanın; API anahtarı kurulumunuz ve yerel kataloğunuz genel API rotasını sunduğunda Codex runtime geçersiz kılması olmadan `openai/gpt-5.5` kullanın.

```json5
{
  plugins: { entries: { codex: { enabled: true } } },
  agents: {
    defaults: {
      model: { primary: "openai/gpt-5.5" },
      agentRuntime: { id: "codex" },
    },
  },
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
    Qwen Cloud sağlayıcı yüzeyi artı Alibaba DashScope ve Coding Plan uç noktası eşlemesi.
  </Card>
</CardGroup>

### OpenCode

- Kimlik doğrulama: `OPENCODE_API_KEY` (veya `OPENCODE_ZEN_API_KEY`)
- Zen runtime sağlayıcısı: `opencode`
- Go runtime sağlayıcısı: `opencode-go`
- Örnek modeller: `opencode/claude-opus-4-6`, `opencode-go/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice opencode-zen` veya `openclaw onboard --auth-choice opencode-go`

```json5
{
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

### Google Gemini (API anahtarı)

- Sağlayıcı: `google`
- Kimlik doğrulama: `GEMINI_API_KEY`
- İsteğe bağlı rotasyon: `GEMINI_API_KEYS`, `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, `GOOGLE_API_KEY` yedeği ve `OPENCLAW_LIVE_GEMINI_KEY` (tek geçersiz kılma)
- Örnek modeller: `google/gemini-3.1-pro-preview`, `google/gemini-3-flash-preview`
- Uyumluluk: `google/gemini-3.1-flash-preview` kullanan eski OpenClaw yapılandırması `google/gemini-3-flash-preview` olarak normalleştirilir
- Takma ad: `google/gemini-3.1-pro` kabul edilir ve Google'ın canlı Gemini API kimliğine, `google/gemini-3.1-pro-preview` değerine normalleştirilir
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- Düşünme: `/think adaptive`, Google dinamik düşünmesini kullanır. Gemini 3/3.1 sabit bir `thinkingLevel` göndermez; Gemini 2.5 `thinkingBudget: -1` gönderir.
- Doğrudan Gemini çalıştırmaları, sağlayıcıya özgü bir `cachedContents/...` tanıtıcısını iletmek için `agents.defaults.models["google/<model>"].params.cachedContent` (veya eski `cached_content`) değerini de kabul eder; Gemini önbellek isabetleri OpenClaw `cacheRead` olarak görünür

### Google Vertex ve Gemini CLI

- Sağlayıcılar: `google-vertex`, `google-gemini-cli`
- Kimlik doğrulama: Vertex gcloud ADC kullanır; Gemini CLI kendi OAuth akışını kullanır

<Warning>
OpenClaw içindeki Gemini CLI OAuth resmi olmayan bir entegrasyondur. Bazı kullanıcılar, üçüncü taraf istemcileri kullandıktan sonra Google hesap kısıtlamaları bildirmiştir. Google şartlarını inceleyin ve devam etmeyi seçerseniz kritik olmayan bir hesap kullanın.
</Warning>

Gemini CLI OAuth, paketle gelen `google` Plugin'inin bir parçası olarak sunulur.

<Steps>
  <Step title="Gemini CLI'yi yükleyin">
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
  <Step title="Plugin'i etkinleştirin">
    ```bash
    openclaw plugins enable google
    ```
  </Step>
  <Step title="Giriş yapın">
    ```bash
    openclaw models auth login --provider google-gemini-cli --set-default
    ```

    Varsayılan model: `google-gemini-cli/gemini-3-flash-preview`. `openclaw.json` içine bir istemci kimliği veya gizli anahtar yapıştırmazsınız. CLI giriş akışı, token'ları gateway ana makinesindeki kimlik doğrulama profillerinde saklar.

  </Step>
  <Step title="Projeyi ayarlayın (gerekiyorsa)">
    Giriş yaptıktan sonra istekler başarısız olursa gateway ana makinesinde `GOOGLE_CLOUD_PROJECT` veya `GOOGLE_CLOUD_PROJECT_ID` ayarlayın.
  </Step>
</Steps>

Gemini CLI JSON yanıtları `response` içinden ayrıştırılır; kullanım `stats` değerine geri düşer ve `stats.cached` OpenClaw `cacheRead` olarak normalleştirilir.

### Z.AI (GLM)

- Sağlayıcı: `zai`
- Kimlik doğrulama: `ZAI_API_KEY`
- Örnek model: `zai/glm-5.1`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - Takma adlar: `z.ai/*` ve `z-ai/*`, `zai/*` olarak normalleştirilir
  - `zai-api-key` eşleşen Z.AI uç noktasını otomatik algılar; `zai-coding-global`, `zai-coding-cn`, `zai-global` ve `zai-cn` belirli bir yüzeyi zorlar

### Vercel AI Gateway

- Sağlayıcı: `vercel-ai-gateway`
- Kimlik doğrulama: `AI_GATEWAY_API_KEY`
- Örnek modeller: `vercel-ai-gateway/anthropic/claude-opus-4.6`, `vercel-ai-gateway/moonshotai/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice ai-gateway-api-key`

### Kilo Gateway

- Sağlayıcı: `kilocode`
- Kimlik doğrulama: `KILOCODE_API_KEY`
- Örnek model: `kilocode/kilo/auto`
- CLI: `openclaw onboard --auth-choice kilocode-api-key`
- Temel URL: `https://api.kilo.ai/api/gateway/`
- Statik yedek katalog `kilocode/kilo/auto` ile gelir; canlı `https://api.kilo.ai/api/gateway/models` keşfi çalışma zamanı kataloğunu daha da genişletebilir.
- `kilocode/kilo/auto` arkasındaki kesin upstream yönlendirme Kilo Gateway'e aittir, OpenClaw içinde sabit kodlanmamıştır.

Kurulum ayrıntıları için [/providers/kilocode](/tr/providers/kilocode) sayfasına bakın.

### Paketle gelen diğer sağlayıcı Plugin'leri

| Sağlayıcı               | Kimlik                           | Kimlik doğrulama env                                       | Örnek model                                   |
| ----------------------- | -------------------------------- | ---------------------------------------------------------- | --------------------------------------------- |
| BytePlus                | `byteplus` / `byteplus-plan`     | `BYTEPLUS_API_KEY`                                         | `byteplus-plan/ark-code-latest`               |
| Cerebras                | `cerebras`                       | `CEREBRAS_API_KEY`                                         | `cerebras/zai-glm-4.7`                        |
| Cloudflare AI Gateway   | `cloudflare-ai-gateway`          | `CLOUDFLARE_AI_GATEWAY_API_KEY`                            | —                                             |
| DeepInfra               | `deepinfra`                      | `DEEPINFRA_API_KEY`                                        | `deepinfra/deepseek-ai/DeepSeek-V3.2`         |
| DeepSeek                | `deepseek`                       | `DEEPSEEK_API_KEY`                                         | `deepseek/deepseek-v4-flash`                  |
| GitHub Copilot          | `github-copilot`                 | `COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN`       | —                                             |
| Groq                    | `groq`                           | `GROQ_API_KEY`                                             | —                                             |
| Hugging Face Inference  | `huggingface`                    | `HUGGINGFACE_HUB_TOKEN` veya `HF_TOKEN`                    | `huggingface/deepseek-ai/DeepSeek-R1`         |
| Kilo Gateway            | `kilocode`                       | `KILOCODE_API_KEY`                                         | `kilocode/kilo/auto`                          |
| Kimi Coding             | `kimi`                           | `KIMI_API_KEY` veya `KIMICODE_API_KEY`                     | `kimi/kimi-code`                              |
| MiniMax                 | `minimax` / `minimax-portal`     | `MINIMAX_API_KEY` / `MINIMAX_OAUTH_TOKEN`                  | `minimax/MiniMax-M2.7`                        |
| Mistral                 | `mistral`                        | `MISTRAL_API_KEY`                                          | `mistral/mistral-large-latest`                |
| Moonshot                | `moonshot`                       | `MOONSHOT_API_KEY`                                         | `moonshot/kimi-k2.6`                          |
| NVIDIA                  | `nvidia`                         | `NVIDIA_API_KEY`                                           | `nvidia/nvidia/nemotron-3-super-120b-a12b`    |
| OpenRouter              | `openrouter`                     | `OPENROUTER_API_KEY`                                       | `openrouter/auto`                             |
| Qianfan                 | `qianfan`                        | `QIANFAN_API_KEY`                                          | `qianfan/deepseek-v3.2`                       |
| Qwen Cloud              | `qwen`                           | `QWEN_API_KEY` / `MODELSTUDIO_API_KEY` / `DASHSCOPE_API_KEY` | `qwen/qwen3.5-plus`                         |
| StepFun                 | `stepfun` / `stepfun-plan`       | `STEPFUN_API_KEY`                                          | `stepfun/step-3.5-flash`                      |
| Together                | `together`                       | `TOGETHER_API_KEY`                                         | `together/moonshotai/Kimi-K2.5`               |
| Venice                  | `venice`                         | `VENICE_API_KEY`                                           | —                                             |
| Vercel AI Gateway       | `vercel-ai-gateway`              | `AI_GATEWAY_API_KEY`                                       | `vercel-ai-gateway/anthropic/claude-opus-4.6` |
| Volcano Engine (Doubao) | `volcengine` / `volcengine-plan` | `VOLCANO_ENGINE_API_KEY`                                   | `volcengine-plan/ark-code-latest`             |
| xAI                     | `xai`                            | `XAI_API_KEY`                                              | `xai/grok-4.3`                                |
| Xiaomi                  | `xiaomi`                         | `XIAOMI_API_KEY`                                           | `xiaomi/mimo-v2-flash`                        |

#### Bilinmeye değer ayrıntılar

<AccordionGroup>
  <Accordion title="OpenRouter">
    Uygulama atıf başlıklarını ve Anthropic `cache_control` işaretleyicilerini yalnızca doğrulanmış `openrouter.ai` rotalarında uygular. DeepSeek, Moonshot ve ZAI ref'leri OpenRouter tarafından yönetilen istem önbelleğe alma için cache-TTL uygundur, ancak Anthropic önbellek işaretleyicileri almaz. Proxy tarzı OpenAI uyumlu bir yol olarak, yalnızca yerel OpenAI'ye özgü biçimlendirmeyi (`serviceTier`, Responses `store`, istem önbelleği ipuçları, OpenAI reasoning uyumluluğu) atlar. Gemini destekli ref'ler yalnızca proxy-Gemini düşünce imzası temizliğini korur.
  </Accordion>
  <Accordion title="Kilo Gateway">
    Gemini destekli ref'ler aynı proxy-Gemini temizlik yolunu izler; `kilocode/kilo/auto` ve proxy reasoning desteği olmayan diğer ref'ler proxy reasoning eklemesini atlar.
  </Accordion>
  <Accordion title="MiniMax">
    API anahtarıyla ilk kurulum, açıkça yalnızca metin M2.7 sohbet modeli tanımları yazar; görüntü anlama, plugin sahibi `MiniMax-VL-01` medya sağlayıcısında kalır.
  </Accordion>
  <Accordion title="NVIDIA">
    Model kimlikleri `nvidia/<vendor>/<model>` ad alanını kullanır (örneğin `nvidia/moonshotai/kimi-k2.5` yanında `nvidia/nvidia/nemotron-...`); seçiciler gerçek `<provider>/<model-id>` bileşimini korurken API'ye gönderilen kanonik anahtar tek ön ekli kalır.
  </Accordion>
  <Accordion title="xAI">
    xAI Responses yolunu kullanır. `grok-4.3`, birlikte gelen varsayılan sohbet modelidir. `/fast` veya `params.fastMode: true`, `grok-3`, `grok-3-mini`, `grok-4` ve `grok-4-0709` değerlerini ilgili `*-fast` varyantlarına yeniden yazar. `tool_stream` varsayılan olarak açıktır; `agents.defaults.models["xai/<model>"].params.tool_stream=false` ile devre dışı bırakın.
  </Accordion>
  <Accordion title="Cerebras">
    Birlikte gelen `cerebras` sağlayıcı Plugin'i olarak gelir. GLM `zai-glm-4.7` kullanır; OpenAI uyumlu temel URL `https://api.cerebras.ai/v1` şeklindedir.
  </Accordion>
</AccordionGroup>

## `models.providers` üzerinden sağlayıcılar (özel/temel URL)

**Özel** sağlayıcılar veya OpenAI/Anthropic uyumlu proxy'ler eklemek için `models.providers` (veya `models.json`) kullanın.

Aşağıdaki birlikte gelen sağlayıcı Plugin'lerinin çoğu zaten varsayılan bir katalog yayımlar. Açık `models.providers.<id>` girdilerini yalnızca varsayılan temel URL'yi, başlıkları veya model listesini geçersiz kılmak istediğinizde kullanın.

Gateway model yetenek denetimleri ayrıca açık `models.providers.<id>.models[]` meta verilerini okur. Özel veya proxy bir model görüntü kabul ediyorsa WebChat ve düğüm kaynaklı ek yollarının görüntüleri yalnızca metin medya ref'leri yerine yerel model girdileri olarak geçirmesi için o modelde `input: ["text", "image"]` ayarlayın.

### Moonshot AI (Kimi)

Moonshot, birlikte gelen bir sağlayıcı Plugin'i olarak gelir. Varsayılan olarak yerleşik sağlayıcıyı kullanın ve yalnızca temel URL'yi veya model meta verilerini geçersiz kılmanız gerektiğinde açık bir `models.providers.moonshot` girdisi ekleyin:

- Sağlayıcı: `moonshot`
- Kimlik doğrulama: `MOONSHOT_API_KEY`
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

### Kimi kodlama

Kimi Coding, Moonshot AI'nin Anthropic uyumlu uç noktasını kullanır:

- Sağlayıcı: `kimi`
- Kimlik doğrulama: `KIMI_API_KEY`
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

Volcano Engine (火山引擎), Çin'de Doubao ve diğer modellere erişim sağlar.

- Sağlayıcı: `volcengine` (kodlama: `volcengine-plan`)
- Kimlik doğrulama: `VOLCANO_ENGINE_API_KEY`
- Örnek model: `volcengine-plan/ark-code-latest`
- CLI: `openclaw onboard --auth-choice volcengine-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "volcengine-plan/ark-code-latest" } },
  },
}
```

İlk katılım varsayılan olarak kodlama yüzeyini kullanır, ancak genel `volcengine/*` kataloğu aynı anda kaydedilir.

İlk katılım/yapılandırma model seçicilerinde, Volcengine kimlik doğrulama seçimi hem `volcengine/*` hem de `volcengine-plan/*` satırlarını tercih eder. Bu modeller henüz yüklenmediyse OpenClaw, boş bir sağlayıcı kapsamlı seçici göstermek yerine filtrelenmemiş kataloğa geri döner.

<Tabs>
  <Tab title="Standart modeller">
    - `volcengine/doubao-seed-1-8-251228` (Doubao Seed 1.8)
    - `volcengine/doubao-seed-code-preview-251028`
    - `volcengine/kimi-k2-5-260127` (Kimi K2.5)
    - `volcengine/glm-4-7-251222` (GLM 4.7)
    - `volcengine/deepseek-v3-2-251201` (DeepSeek V3.2 128K)

  </Tab>
  <Tab title="Kodlama modelleri (volcengine-plan)">
    - `volcengine-plan/ark-code-latest`
    - `volcengine-plan/doubao-seed-code`
    - `volcengine-plan/kimi-k2.5`
    - `volcengine-plan/kimi-k2-thinking`
    - `volcengine-plan/glm-4.7`

  </Tab>
</Tabs>

### BytePlus (Uluslararası)

BytePlus ARK, uluslararası kullanıcılar için Volcano Engine ile aynı modellere erişim sağlar.

- Sağlayıcı: `byteplus` (kodlama: `byteplus-plan`)
- Kimlik doğrulama: `BYTEPLUS_API_KEY`
- Örnek model: `byteplus-plan/ark-code-latest`
- CLI: `openclaw onboard --auth-choice byteplus-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "byteplus-plan/ark-code-latest" } },
  },
}
```

İlk katılım varsayılan olarak kodlama yüzeyini kullanır, ancak genel `byteplus/*` kataloğu aynı anda kaydedilir.

İlk katılım/yapılandırma model seçicilerinde, BytePlus kimlik doğrulama seçimi hem `byteplus/*` hem de `byteplus-plan/*` satırlarını tercih eder. Bu modeller henüz yüklenmediyse OpenClaw, boş bir sağlayıcı kapsamlı seçici göstermek yerine filtrelenmemiş kataloğa geri döner.

<Tabs>
  <Tab title="Standart modeller">
    - `byteplus/seed-1-8-251228` (Seed 1.8)
    - `byteplus/kimi-k2-5-260127` (Kimi K2.5)
    - `byteplus/glm-4-7-251222` (GLM 4.7)

  </Tab>
  <Tab title="Kodlama modelleri (byteplus-plan)">
    - `byteplus-plan/ark-code-latest`
    - `byteplus-plan/doubao-seed-code`
    - `byteplus-plan/kimi-k2.5`
    - `byteplus-plan/kimi-k2-thinking`
    - `byteplus-plan/glm-4.7`

  </Tab>
</Tabs>

### Synthetic

Synthetic, `synthetic` sağlayıcısının arkasında Anthropic uyumlu modeller sağlar:

- Sağlayıcı: `synthetic`
- Kimlik doğrulama: `SYNTHETIC_API_KEY`
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

- MiniMax OAuth (Küresel): `--auth-choice minimax-global-oauth`
- MiniMax OAuth (CN): `--auth-choice minimax-cn-oauth`
- MiniMax API anahtarı (Küresel): `--auth-choice minimax-global-api`
- MiniMax API anahtarı (CN): `--auth-choice minimax-cn-api`
- Kimlik doğrulama: `minimax` için `MINIMAX_API_KEY`; `minimax-portal` için `MINIMAX_OAUTH_TOKEN` veya `MINIMAX_API_KEY`

Kurulum ayrıntıları, model seçenekleri ve yapılandırma parçacıkları için [/providers/minimax](/tr/providers/minimax) bölümüne bakın.

<Note>
MiniMax'in Anthropic uyumlu akış yolunda, siz açıkça ayarlamadığınız sürece OpenClaw varsayılan olarak thinking'i devre dışı bırakır ve `/fast on`, `MiniMax-M2.7` değerini `MiniMax-M2.7-highspeed` olarak yeniden yazar.
</Note>

Plugin sahibi yetenek ayrımı:

- Metin/sohbet varsayılanları `minimax/MiniMax-M2.7` üzerinde kalır
- Görüntü üretimi `minimax/image-01` veya `minimax-portal/image-01` olur
- Görüntü anlama, her iki MiniMax kimlik doğrulama yolunda da Plugin sahibi `MiniMax-VL-01` olur
- Web araması sağlayıcı kimliği `minimax` üzerinde kalır

### LM Studio

LM Studio, yerel API'yi kullanan paketlenmiş bir sağlayıcı Plugin olarak gelir:

- Sağlayıcı: `lmstudio`
- Kimlik doğrulama: `LM_API_TOKEN`
- Varsayılan çıkarım temel URL'si: `http://localhost:1234/v1`

Ardından bir model ayarlayın (`http://localhost:1234/api/v1/models` tarafından döndürülen kimliklerden biriyle değiştirin):

```json5
{
  agents: {
    defaults: { model: { primary: "lmstudio/openai/gpt-oss-20b" } },
  },
}
```

OpenClaw, keşif ve otomatik yükleme için LM Studio'nun yerel `/api/v1/models` ve `/api/v1/models/load` uç noktalarını, varsayılan olarak çıkarım için de `/v1/chat/completions` uç noktasını kullanır. LM Studio JIT yükleme, TTL ve otomatik çıkarma işlemlerinin model yaşam döngüsüne sahip olmasını istiyorsanız `models.providers.lmstudio.params.preload: false` ayarlayın. Kurulum ve sorun giderme için [/providers/lmstudio](/tr/providers/lmstudio) bölümüne bakın.

### Ollama

Ollama, paketlenmiş bir sağlayıcı Plugin olarak gelir ve Ollama'nın yerel API'sini kullanır:

- Sağlayıcı: `ollama`
- Kimlik doğrulama: Gerekli değil (yerel sunucu)
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

Ollama, `OLLAMA_API_KEY` ile etkinleştirdiğinizde yerel olarak `http://127.0.0.1:11434` adresinde algılanır ve paketlenmiş sağlayıcı Plugin, Ollama'yı doğrudan `openclaw onboard` ve model seçiciye ekler. İlk katılım, bulut/yerel mod ve özel yapılandırma için [/providers/ollama](/tr/providers/ollama) bölümüne bakın.

### vLLM

vLLM, yerel/kendi barındırdığınız OpenAI uyumlu sunucular için paketlenmiş bir sağlayıcı Plugin olarak gelir:

- Sağlayıcı: `vllm`
- Kimlik doğrulama: İsteğe bağlı (sunucunuza bağlıdır)
- Varsayılan temel URL: `http://127.0.0.1:8000/v1`

Yerel otomatik keşfi etkinleştirmek için (sunucunuz kimlik doğrulamayı zorunlu kılmıyorsa herhangi bir değer çalışır):

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

Ayrıntılar için [/providers/vllm](/tr/providers/vllm) bölümüne bakın.

### SGLang

SGLang, hızlı ve kendi barındırdığınız OpenAI uyumlu sunucular için paketlenmiş bir sağlayıcı Plugin olarak gelir:

- Sağlayıcı: `sglang`
- Kimlik doğrulama: İsteğe bağlı (sunucunuza bağlıdır)
- Varsayılan temel URL: `http://127.0.0.1:30000/v1`

Yerel otomatik keşfi etkinleştirmek için (sunucunuz kimlik doğrulamayı zorunlu kılmıyorsa herhangi bir değer çalışır):

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

Ayrıntılar için [/providers/sglang](/tr/providers/sglang) bölümüne bakın.

### Yerel proxy'ler (LM Studio, vLLM, LiteLLM vb.)

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
        timeoutSeconds: 300,
        models: [
          {
            id: "my-local-model",
            name: "Local Model",
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
    Özel sağlayıcılar için `reasoning`, `input`, `cost`, `contextWindow` ve `maxTokens` isteğe bağlıdır. Atlandıklarında OpenClaw varsayılan olarak şunları kullanır:

    - `reasoning: false`
    - `input: ["text"]`
    - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
    - `contextWindow: 200000`
    - `maxTokens: 8192`

    Önerilir: proxy/model sınırlarınızla eşleşen açık değerler ayarlayın.

  </Accordion>
  <Accordion title="Proxy rota şekillendirme kuralları">
    - Yerel olmayan uç noktalarda `api: "openai-completions"` için (ana makinesi `api.openai.com` olmayan, boş olmayan herhangi bir `baseUrl`), OpenClaw desteklenmeyen `developer` rolleri için sağlayıcı 400 hatalarını önlemek üzere `compat.supportsDeveloperRole: false` değerini zorlar.
    - Proxy tarzı OpenAI uyumlu rotalar, yalnızca yerel OpenAI'ye özgü istek şekillendirmeyi de atlar: `service_tier` yok, Responses `store` yok, Completions `store` yok, istem önbelleği ipuçları yok, OpenAI reasoning uyumluluk yükü şekillendirmesi yok ve gizli OpenClaw atıf başlıkları yok.
    - Satıcıya özgü alanlara ihtiyaç duyan OpenAI uyumlu Completions proxy'leri için, giden istek gövdesine ek JSON birleştirmek üzere `agents.defaults.models["provider/model"].params.extra_body` (veya `extraBody`) ayarlayın.
    - vLLM sohbet şablonu denetimleri için `agents.defaults.models["provider/model"].params.chat_template_kwargs` ayarlayın. Paketlenmiş vLLM Plugin, oturum thinking düzeyi kapalı olduğunda `vllm/nemotron-3-*` için otomatik olarak `enable_thinking: false` ve `force_nonempty_content: true` gönderir.
    - Yavaş yerel modeller veya uzak LAN/tailnet ana makineleri için `models.providers.<id>.timeoutSeconds` ayarlayın. Bu, tüm ajan çalışma zamanı zaman aşımını artırmadan bağlanma, başlıklar, gövde akışı ve toplam korumalı fetch iptali dahil olmak üzere sağlayıcı model HTTP isteği işlemeyi uzatır.
    - `baseUrl` boşsa/atlanmışsa OpenClaw varsayılan OpenAI davranışını korur (bu davranış `api.openai.com` olarak çözümlenir).
    - Güvenlik için, açık bir `compat.supportsDeveloperRole: true` değeri yerel olmayan `openai-completions` uç noktalarında yine de geçersiz kılınır.
    - Yerel olmayan uç noktalarda `api: "anthropic-messages"` için (kanonik `anthropic` dışındaki herhangi bir sağlayıcı veya ana makinesi genel bir `api.anthropic.com` uç noktası olmayan özel bir `models.providers.anthropic.baseUrl`), OpenClaw `claude-code-20250219`, `interleaved-thinking-2025-05-14` ve OAuth işaretleri gibi örtük Anthropic beta başlıklarını bastırır; böylece özel Anthropic uyumlu proxy'ler desteklenmeyen beta bayraklarını reddetmez. Proxy'niz belirli beta özelliklerine ihtiyaç duyuyorsa `models.providers.<id>.headers["anthropic-beta"]` değerini açıkça ayarlayın.

  </Accordion>
</AccordionGroup>

## CLI örnekleri

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

Tam yapılandırma örnekleri için ayrıca bakın: [Yapılandırma](/tr/gateway/configuration).

## İlgili

- [Yapılandırma referansı](/tr/gateway/config-agents#agent-defaults) — model yapılandırma anahtarları
- [Model yük devri](/tr/concepts/model-failover) — yedek zincirler ve yeniden deneme davranışı
- [Modeller](/tr/concepts/models) — model yapılandırması ve takma adlar
- [Sağlayıcılar](/tr/providers) — sağlayıcı başına kurulum kılavuzları
