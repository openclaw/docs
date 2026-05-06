---
read_when:
    - Sağlayıcı bazında bir model kurulum referansına ihtiyacınız var
    - Model sağlayıcıları için örnek yapılandırmalar veya CLI ilk kurulum komutları istiyorsunuz
sidebarTitle: Model providers
summary: Örnek yapılandırmalar + CLI akışlarıyla model sağlayıcısına genel bakış
title: Model sağlayıcıları
x-i18n:
    generated_at: "2026-05-06T09:08:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8375caf4bacbb360e57637801d06a9d7898b36d440b82885d993b8248cd4daff
    source_path: concepts/model-providers.md
    workflow: 16
---

LLM/model sağlayıcıları için başvuru (WhatsApp/Telegram gibi sohbet kanalları değil). Model seçimi kuralları için bkz. [Modeller](/tr/concepts/models).

## Hızlı kurallar

<AccordionGroup>
  <Accordion title="Model referansları ve CLI yardımcıları">
    - Model referansları `provider/model` biçimini kullanır (örnek: `opencode/claude-opus-4-6`).
    - `agents.defaults.models` ayarlandığında izin listesi gibi davranır.
    - CLI yardımcıları: `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`.
    - `models.providers.*.contextWindow` / `contextTokens` / `maxTokens` sağlayıcı düzeyindeki varsayılanları ayarlar; `models.providers.*.models[].contextWindow` / `contextTokens` / `maxTokens` bunları model bazında geçersiz kılar.
    - Geri dönüş kuralları, bekleme süresi yoklamaları ve oturum geçersiz kılma kalıcılığı: [Model yük devretme](/tr/concepts/model-failover).

  </Accordion>
  <Accordion title="Sağlayıcı kimlik doğrulaması eklemek birincil modelinizi değiştirmez">
    `openclaw configure`, bir sağlayıcı eklediğinizde veya yeniden kimlik doğrulaması yaptığınızda mevcut bir `agents.defaults.model.primary` değerini korur. Sağlayıcı Plugin’leri, kimlik doğrulama yapılandırma yamalarında yine de önerilen bir varsayılan model döndürebilir, ancak configure bunu birincil model zaten varsa "bu modeli kullanılabilir yap" olarak değerlendirir; "geçerli birincil modeli değiştir" olarak değil.

    Varsayılan modeli bilinçli olarak değiştirmek için `openclaw models set <provider/model>` veya `openclaw models auth login --provider <id> --set-default` kullanın.

  </Accordion>
  <Accordion title="OpenAI sağlayıcı/çalışma zamanı ayrımı">
    OpenAI ailesi rotaları öneke özeldir:

    - `openai/<model>` ve `agents.defaults.agentRuntime.id: "codex"` yerel Codex uygulama sunucusu donanımını kullanır. Bu, olağan ChatGPT/Codex abonelik kurulumudur.
    - `openai-codex/<model>` PI içinde Codex OAuth kullanır.
    - Codex çalışma zamanı geçersiz kılması olmadan `openai/<model>`, PI içindeki doğrudan OpenAI API anahtarı sağlayıcısını kullanır.

    Bkz. [OpenAI](/tr/providers/openai) ve [Codex donanımı](/tr/plugins/codex-harness). Sağlayıcı/çalışma zamanı ayrımı kafa karıştırıyorsa önce [Ajan çalışma zamanları](/tr/concepts/agent-runtimes) bölümünü okuyun.

    Plugin otomatik etkinleştirme aynı sınırı izler: `openai-codex/<model>` OpenAI Plugin’ine aittir; Codex Plugin’i ise `agentRuntime.id: "codex"` veya eski `codex/<model>` referanslarıyla etkinleştirilir.

    GPT-5.5, `agentRuntime.id: "codex"` ayarlandığında yerel Codex uygulama sunucusu donanımı üzerinden, Codex OAuth için PI içinde `openai-codex/gpt-5.5` üzerinden ve hesabınız bunu sunduğunda doğrudan API anahtarı trafiği için PI içinde `openai/gpt-5.5` üzerinden kullanılabilir.

  </Accordion>
  <Accordion title="CLI çalışma zamanları">
    CLI çalışma zamanları aynı ayrımı kullanır: `anthropic/claude-*`, `google/gemini-*` veya `openai/gpt-*` gibi kanonik model referanslarını seçin, ardından yerel bir CLI arka ucu istediğinizde `agents.defaults.agentRuntime.id` değerini `claude-cli`, `google-gemini-cli` veya `codex-cli` olarak ayarlayın.

    Eski `claude-cli/*`, `google-gemini-cli/*` ve `codex-cli/*` referansları, çalışma zamanı ayrı olarak kaydedilerek yeniden kanonik sağlayıcı referanslarına taşınır.

  </Accordion>
</AccordionGroup>

## Plugin’e ait sağlayıcı davranışı

Sağlayıcıya özgü mantığın çoğu sağlayıcı Plugin’lerinde (`registerProvider(...)`) yaşarken OpenClaw genel çıkarım döngüsünü tutar. Plugin’ler katılımı, model kataloglarını, kimlik doğrulama ortam değişkeni eşlemesini, aktarım/yapılandırma normalleştirmesini, araç şeması temizliğini, yük devretme sınıflandırmasını, OAuth yenilemeyi, kullanım raporlamayı, düşünme/akıl yürütme profillerini ve daha fazlasını sahiplenir.

Sağlayıcı SDK hook’larının ve paketlenmiş Plugin örneklerinin tam listesi [Sağlayıcı Plugin’leri](/tr/plugins/sdk-provider-plugins) içinde yer alır. Tamamen özel bir istek yürütücüsüne ihtiyaç duyan bir sağlayıcı ayrı ve daha derin bir uzantı yüzeyidir.

<Note>
Sağlayıcıya ait çalıştırıcı davranışı yeniden oynatma ilkesi, araç şeması normalleştirme, akış sarmalama ve aktarım/istek yardımcıları gibi açık sağlayıcı hook’larında yaşar. Eski `ProviderPlugin.capabilities` statik torbası yalnızca uyumluluk içindir ve artık paylaşılan çalıştırıcı mantığı tarafından okunmaz.
</Note>

## API anahtarı rotasyonu

<AccordionGroup>
  <Accordion title="Anahtar kaynakları ve öncelik">
    Birden çok anahtarı şu yollarla yapılandırın:

    - `OPENCLAW_LIVE_<PROVIDER>_KEY` (tek canlı geçersiz kılma, en yüksek öncelik)
    - `<PROVIDER>_API_KEYS` (virgül veya noktalı virgül listesi)
    - `<PROVIDER>_API_KEY` (birincil anahtar)
    - `<PROVIDER>_API_KEY_*` (numaralı liste, ör. `<PROVIDER>_API_KEY_1`)

    Google sağlayıcıları için `GOOGLE_API_KEY` de geri dönüş olarak dahil edilir. Anahtar seçimi sırası önceliği korur ve değerlerin yinelenenlerini kaldırır.

  </Accordion>
  <Accordion title="Rotasyon ne zaman devreye girer">
    - İstekler yalnızca hız sınırı yanıtlarında sonraki anahtarla yeniden denenir (örneğin `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` veya dönemsel kullanım sınırı iletileri).
    - Hız sınırı dışındaki hatalar hemen başarısız olur; anahtar rotasyonu denenmez.
    - Tüm aday anahtarlar başarısız olduğunda, son hata son denemeden döndürülür.

  </Accordion>
</AccordionGroup>

## Yerleşik sağlayıcılar (pi-ai kataloğu)

OpenClaw pi-ai kataloğuyla birlikte gelir. Bu sağlayıcılar **hiçbir** `models.providers` yapılandırması gerektirmez; yalnızca kimlik doğrulamasını ayarlayın ve bir model seçin.

### OpenAI

- Sağlayıcı: `openai`
- Kimlik doğrulama: `OPENAI_API_KEY`
- İsteğe bağlı rotasyon: `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2`, ayrıca `OPENCLAW_LIVE_OPENAI_KEY` (tek geçersiz kılma)
- Örnek modeller: `openai/gpt-5.5`, `openai/gpt-5.4-mini`
- Belirli bir kurulum veya API anahtarı farklı davranıyorsa hesap/model kullanılabilirliğini `openclaw models list --provider openai` ile doğrulayın.
- CLI: `openclaw onboard --auth-choice openai-api-key`
- Varsayılan aktarım `auto` olur (önce WebSocket, SSE geri dönüşü)
- Model bazında `agents.defaults.models["openai/<model>"].params.transport` üzerinden geçersiz kılın (`"sse"`, `"websocket"` veya `"auto"`)
- OpenAI Responses WebSocket ısınması varsayılan olarak `params.openaiWsWarmup` (`true`/`false`) üzerinden etkinleştirilir
- OpenAI öncelikli işleme `agents.defaults.models["openai/<model>"].params.serviceTier` üzerinden etkinleştirilebilir
- `/fast` ve `params.fastMode`, doğrudan `openai/*` Responses isteklerini `api.openai.com` üzerinde `service_tier=priority` değerine eşler
- Paylaşılan `/fast` anahtarı yerine açık bir katman istediğinizde `params.serviceTier` kullanın
- Gizli OpenClaw atıf başlıkları (`originator`, `version`, `User-Agent`) genel OpenAI uyumlu proxy’lere değil, yalnızca `api.openai.com` üzerindeki yerel OpenAI trafiğine uygulanır
- Yerel OpenAI rotaları ayrıca Responses `store`, istem önbelleği ipuçları ve OpenAI akıl yürütme uyumluluğu yük şekillendirmesini korur; proxy rotaları korumaz
- `openai/gpt-5.3-codex-spark`, canlı OpenAI API istekleri bunu reddettiği ve mevcut Codex kataloğu bunu sunmadığı için OpenClaw içinde bilinçli olarak bastırılır

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
- Doğrudan herkese açık Anthropic istekleri, `api.anthropic.com` adresine gönderilen API anahtarı ve OAuth kimlik doğrulamalı trafik dahil olmak üzere paylaşılan `/fast` anahtarını ve `params.fastMode` değerini destekler; OpenClaw bunu Anthropic `service_tier` değerine eşler (`auto` ve `standard_only`)
- Tercih edilen Claude CLI yapılandırması model referansını kanonik tutar ve CLI
  arka ucunu ayrı seçer: `agents.defaults.agentRuntime.id: "claude-cli"` ile
  `anthropic/claude-opus-4-7`. Eski
  `claude-cli/claude-opus-4-7` referansları uyumluluk için çalışmaya devam eder.

<Note>
Anthropic personeli, OpenClaw tarzı Claude CLI kullanımına yeniden izin verildiğini bize bildirdi; bu nedenle OpenClaw, Anthropic yeni bir ilke yayımlamadığı sürece bu entegrasyon için Claude CLI yeniden kullanımını ve `claude -p` kullanımını onaylı kabul eder. Anthropic kurulum belirteci desteklenen bir OpenClaw belirteç yolu olarak kullanılabilir kalır, ancak OpenClaw artık mevcut olduğunda Claude CLI yeniden kullanımını ve `claude -p` kullanımını tercih eder.
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
- Yerel Codex uygulama sunucusu donanımı referansı: `agents.defaults.agentRuntime.id: "codex"` ile `openai/gpt-5.5`
- Yerel Codex uygulama sunucusu donanımı belgeleri: [Codex donanımı](/tr/plugins/codex-harness)
- Eski model referansları: `codex/gpt-*`
- Plugin sınırı: `openai-codex/*` OpenAI Plugin’ini yükler; yerel Codex uygulama sunucusu Plugin’i yalnızca Codex donanımı çalışma zamanı veya eski `codex/*` referanslarıyla seçilir.
- CLI: `openclaw onboard --auth-choice openai-codex` veya `openclaw models auth login --provider openai-codex`
- Varsayılan aktarım `auto` olur (önce WebSocket, SSE geri dönüşü)
- PI modeli bazında `agents.defaults.models["openai-codex/<model>"].params.transport` üzerinden geçersiz kılın (`"sse"`, `"websocket"` veya `"auto"`)
- `params.serviceTier`, yerel Codex Responses isteklerinde de iletilir (`chatgpt.com/backend-api`)
- Gizli OpenClaw atıf başlıkları (`originator`, `version`, `User-Agent`) genel OpenAI uyumlu proxy’lere değil, yalnızca `chatgpt.com/backend-api` üzerindeki yerel Codex trafiğine eklenir
- Doğrudan `openai/*` ile aynı `/fast` anahtarını ve `params.fastMode` yapılandırmasını paylaşır; OpenClaw bunu `service_tier=priority` değerine eşler
- `openai-codex/gpt-5.5`, Codex kataloğunun yerel `contextWindow = 400000` değerini ve varsayılan çalışma zamanı `contextTokens = 272000` değerini kullanır; çalışma zamanı sınırını `models.providers.openai-codex.models[].contextTokens` ile geçersiz kılın
- İlke notu: OpenAI Codex OAuth, OpenClaw gibi harici araçlar/iş akışları için açıkça desteklenir.
- Yaygın abonelik artı yerel Codex çalışma zamanı rotası için `openai-codex` kimlik doğrulamasıyla oturum açın, ancak `openai/gpt-5.5` ve `agents.defaults.agentRuntime.id: "codex"` yapılandırın.
- `openai-codex/gpt-5.5` değerini yalnızca PI üzerinden Codex OAuth/abonelik rotasını istediğinizde kullanın; API anahtarı kurulumunuz ve yerel kataloğunuz herkese açık API rotasını sunduğunda Codex çalışma zamanı geçersiz kılması olmadan `openai/gpt-5.5` kullanın.
- Daha eski `openai-codex/gpt-5.1*`, `openai-codex/gpt-5.2*` ve `openai-codex/gpt-5.3*` referansları ChatGPT/Codex OAuth hesapları bunları reddettiği için bastırılır; bunun yerine `openai-codex/gpt-5.5` veya yerel Codex çalışma zamanı rotasını kullanın.

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
    Qwen Cloud sağlayıcı yüzeyi ile Alibaba DashScope ve Coding Plan uç noktası eşlemesi.
  </Card>
</CardGroup>

### OpenCode

- Kimlik doğrulama: `OPENCODE_API_KEY` (veya `OPENCODE_ZEN_API_KEY`)
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
- Kimlik doğrulama: `GEMINI_API_KEY`
- İsteğe bağlı rotasyon: `GEMINI_API_KEYS`, `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, `GOOGLE_API_KEY` yedeği ve `OPENCLAW_LIVE_GEMINI_KEY` (tekil geçersiz kılma)
- Örnek modeller: `google/gemini-3.1-pro-preview`, `google/gemini-3-flash-preview`
- Uyumluluk: `google/gemini-3.1-flash-preview` kullanan eski OpenClaw yapılandırması `google/gemini-3-flash-preview` olarak normalleştirilir
- Takma ad: `google/gemini-3.1-pro` kabul edilir ve Google'ın canlı Gemini API kimliği olan `google/gemini-3.1-pro-preview` olarak normalleştirilir
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- Düşünme: `/think adaptive`, Google dinamik düşünmesini kullanır. Gemini 3/3.1 sabit bir `thinkingLevel` içermez; Gemini 2.5 `thinkingBudget: -1` gönderir.
- Doğrudan Gemini çalıştırmaları, sağlayıcıya özgü bir `cachedContents/...` tanıtıcısını iletmek için `agents.defaults.models["google/<model>"].params.cachedContent` (veya eski `cached_content`) değerini de kabul eder; Gemini önbellek isabetleri OpenClaw `cacheRead` olarak görünür

### Google Vertex ve Gemini CLI

- Sağlayıcılar: `google-vertex`, `google-gemini-cli`
- Kimlik doğrulama: Vertex gcloud ADC kullanır; Gemini CLI kendi OAuth akışını kullanır

<Warning>
OpenClaw içindeki Gemini CLI OAuth resmi olmayan bir entegrasyondur. Bazı kullanıcılar üçüncü taraf istemcileri kullandıktan sonra Google hesap kısıtlamaları bildirmiştir. Devam etmeyi seçerseniz Google şartlarını inceleyin ve kritik olmayan bir hesap kullanın.
</Warning>

Gemini CLI OAuth, paketlenen `google` Plugin kapsamında gönderilir.

<Steps>
  <Step title="Gemini CLI'yi yükle">
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
  <Step title="Plugin'i etkinleştir">
    ```bash
    openclaw plugins enable google
    ```
  </Step>
  <Step title="Oturum aç">
    ```bash
    openclaw models auth login --provider google-gemini-cli --set-default
    ```

    Varsayılan model: `google-gemini-cli/gemini-3-flash-preview`. `openclaw.json` içine bir istemci kimliği veya gizli anahtar yapıştırmazsınız. CLI oturum açma akışı, tokenları Gateway ana makinesindeki kimlik doğrulama profillerinde saklar.

  </Step>
  <Step title="Projeyi ayarla (gerekirse)">
    Oturum açtıktan sonra istekler başarısız olursa Gateway ana makinesinde `GOOGLE_CLOUD_PROJECT` veya `GOOGLE_CLOUD_PROJECT_ID` ayarlayın.
  </Step>
</Steps>

Gemini CLI JSON yanıtları `response` üzerinden ayrıştırılır; kullanım `stats` değerine geri döner ve `stats.cached`, OpenClaw `cacheRead` olarak normalleştirilir.

### Z.AI (GLM)

- Sağlayıcı: `zai`
- Kimlik doğrulama: `ZAI_API_KEY`
- Örnek model: `zai/glm-5.1`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - Takma adlar: `z.ai/*` ve `z-ai/*`, `zai/*` olarak normalleştirilir
  - `zai-api-key` eşleşen Z.AI uç noktasını otomatik algılar; `zai-coding-global`, `zai-coding-cn`, `zai-global` ve `zai-cn` belirli bir yüzeyi zorunlu kılar

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
- Statik yedek katalog `kilocode/kilo/auto` ile birlikte gönderilir; canlı `https://api.kilo.ai/api/gateway/models` keşfi çalışma zamanı kataloğunu daha da genişletebilir.
- `kilocode/kilo/auto` arkasındaki tam üst akış yönlendirmesi OpenClaw içinde sabit kodlanmamıştır; Kilo Gateway tarafından sahiplenilir.

Kurulum ayrıntıları için [/providers/kilocode](/tr/providers/kilocode) sayfasına bakın.

### Diğer paketlenmiş sağlayıcı Plugin'leri

| Sağlayıcı               | Kimlik                          | Kimlik doğrulama env                                      | Örnek model                                   |
| ----------------------- | -------------------------------- | ------------------------------------------------------------ | --------------------------------------------- |
| BytePlus                | `byteplus` / `byteplus-plan`     | `BYTEPLUS_API_KEY`                                           | `byteplus-plan/ark-code-latest`               |
| Cerebras                | `cerebras`                       | `CEREBRAS_API_KEY`                                           | `cerebras/zai-glm-4.7`                        |
| Cloudflare AI Gateway   | `cloudflare-ai-gateway`          | `CLOUDFLARE_AI_GATEWAY_API_KEY`                              | -                                             |
| DeepInfra               | `deepinfra`                      | `DEEPINFRA_API_KEY`                                          | `deepinfra/deepseek-ai/DeepSeek-V3.2`         |
| DeepSeek                | `deepseek`                       | `DEEPSEEK_API_KEY`                                           | `deepseek/deepseek-v4-flash`                  |
| GitHub Copilot          | `github-copilot`                 | `COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN`         | -                                             |
| Groq                    | `groq`                           | `GROQ_API_KEY`                                               | -                                             |
| Hugging Face Inference  | `huggingface`                    | `HUGGINGFACE_HUB_TOKEN` veya `HF_TOKEN`                      | `huggingface/deepseek-ai/DeepSeek-R1`         |
| Kilo Gateway            | `kilocode`                       | `KILOCODE_API_KEY`                                           | `kilocode/kilo/auto`                          |
| Kimi Coding             | `kimi`                           | `KIMI_API_KEY` veya `KIMICODE_API_KEY`                       | `kimi/kimi-code`                              |
| MiniMax                 | `minimax` / `minimax-portal`     | `MINIMAX_API_KEY` / `MINIMAX_OAUTH_TOKEN`                    | `minimax/MiniMax-M2.7`                        |
| Mistral                 | `mistral`                        | `MISTRAL_API_KEY`                                            | `mistral/mistral-large-latest`                |
| Moonshot                | `moonshot`                       | `MOONSHOT_API_KEY`                                           | `moonshot/kimi-k2.6`                          |
| NVIDIA                  | `nvidia`                         | `NVIDIA_API_KEY`                                             | `nvidia/nvidia/nemotron-3-super-120b-a12b`    |
| OpenRouter              | `openrouter`                     | `OPENROUTER_API_KEY`                                         | `openrouter/auto`                             |
| Qianfan                 | `qianfan`                        | `QIANFAN_API_KEY`                                            | `qianfan/deepseek-v3.2`                       |
| Qwen Cloud              | `qwen`                           | `QWEN_API_KEY` / `MODELSTUDIO_API_KEY` / `DASHSCOPE_API_KEY` | `qwen/qwen3.5-plus`                           |
| StepFun                 | `stepfun` / `stepfun-plan`       | `STEPFUN_API_KEY`                                            | `stepfun/step-3.5-flash`                      |
| Together                | `together`                       | `TOGETHER_API_KEY`                                           | `together/moonshotai/Kimi-K2.5`               |
| Venice                  | `venice`                         | `VENICE_API_KEY`                                             | -                                             |
| Vercel AI Gateway       | `vercel-ai-gateway`              | `AI_GATEWAY_API_KEY`                                         | `vercel-ai-gateway/anthropic/claude-opus-4.6` |
| Volcano Engine (Doubao) | `volcengine` / `volcengine-plan` | `VOLCANO_ENGINE_API_KEY`                                     | `volcengine-plan/ark-code-latest`             |
| xAI                     | `xai`                            | `XAI_API_KEY`                                                | `xai/grok-4.3`                                |
| Xiaomi                  | `xiaomi`                         | `XIAOMI_API_KEY`                                             | `xiaomi/mimo-v2-flash`                        |

#### Bilmeye değer tuhaflıklar

<AccordionGroup>
  <Accordion title="OpenRouter">
    Uygulama atıf başlıklarını ve Anthropic `cache_control` işaretleyicilerini yalnızca doğrulanmış `openrouter.ai` rotalarında uygular. DeepSeek, Moonshot ve ZAI referansları, OpenRouter tarafından yönetilen prompt önbelleklemesi için cache-TTL kullanımına uygundur ancak Anthropic önbellek işaretleyicileri almaz. Proxy tarzı OpenAI uyumlu bir yol olarak, yerel OpenAI’ye özgü biçimlendirmeyi (`serviceTier`, Responses `store`, prompt-cache ipuçları, OpenAI reasoning-compat) atlar. Gemini destekli referanslar yalnızca proxy-Gemini düşünce imzası temizliğini korur.
  </Accordion>
  <Accordion title="Kilo Gateway">
    Gemini destekli referanslar aynı proxy-Gemini temizleme yolunu izler; `kilocode/kilo/auto` ve proxy reasoning desteklemeyen diğer referanslar proxy reasoning enjeksiyonunu atlar.
  </Accordion>
  <Accordion title="MiniMax">
    API anahtarıyla onboarding, açıkça yalnızca metin M2.7 sohbet modeli tanımları yazar; görüntü anlama, Plugin’e ait `MiniMax-VL-01` medya sağlayıcısında kalır.
  </Accordion>
  <Accordion title="NVIDIA">
    Model kimlikleri bir `nvidia/<vendor>/<model>` ad alanı kullanır (örneğin `nvidia/moonshotai/kimi-k2.5` ile birlikte `nvidia/nvidia/nemotron-...`); seçiciler gerçek `<provider>/<model-id>` bileşimini korurken API’ye gönderilen kanonik anahtar tek önekli kalır.
  </Accordion>
  <Accordion title="xAI">
    xAI Responses yolunu kullanır. `grok-4.3`, paketle gelen varsayılan sohbet modelidir. `/fast` veya `params.fastMode: true`, `grok-3`, `grok-3-mini`, `grok-4` ve `grok-4-0709` değerlerini `*-fast` varyantlarına yeniden yazar. `tool_stream` varsayılan olarak açıktır; `agents.defaults.models["xai/<model>"].params.tool_stream=false` ile devre dışı bırakın.
  </Accordion>
  <Accordion title="Cerebras">
    Paketle gelen `cerebras` sağlayıcı Plugin’i olarak gönderilir. GLM, `zai-glm-4.7` kullanır; OpenAI uyumlu temel URL `https://api.cerebras.ai/v1` şeklindedir.
  </Accordion>
</AccordionGroup>

## `models.providers` üzerinden sağlayıcılar (özel/temel URL)

**Özel** sağlayıcılar veya OpenAI/Anthropic uyumlu proxy’ler eklemek için `models.providers` (veya `models.json`) kullanın.

Aşağıdaki paketle gelen sağlayıcı Plugin’lerinin birçoğu zaten varsayılan bir katalog yayımlar. Açık `models.providers.<id>` girdilerini yalnızca varsayılan temel URL’yi, başlıkları veya model listesini geçersiz kılmak istediğinizde kullanın.

Gateway model yetenek denetimleri, açık `models.providers.<id>.models[]` meta verilerini de okur. Özel veya proxy bir model görüntü kabul ediyorsa, WebChat ve node kaynaklı ek yollarının görüntüleri yalnızca metin medya referansları yerine yerel model girdileri olarak geçirmesi için o modelde `input: ["text", "image"]` ayarlayın.

### Moonshot AI (Kimi)

Moonshot, paketle gelen bir sağlayıcı Plugin’i olarak gönderilir. Varsayılan olarak yerleşik sağlayıcıyı kullanın ve açık bir `models.providers.moonshot` girdisini yalnızca temel URL’yi veya model meta verilerini geçersiz kılmanız gerektiğinde ekleyin:

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

Kimi Coding, Moonshot AI’ın Anthropic uyumlu uç noktasını kullanır:

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

İlk kurulum varsayılan olarak kodlama yüzeyini kullanır, ancak genel `volcengine/*` kataloğu da aynı anda kaydedilir.

İlk kurulum/yapılandırma model seçicilerinde, Volcengine kimlik doğrulama seçimi hem `volcengine/*` hem de `volcengine-plan/*` satırlarını tercih eder. Bu modeller henüz yüklenmemişse OpenClaw, boş bir sağlayıcı kapsamlı seçici göstermek yerine filtrelenmemiş kataloğa geri döner.

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

İlk kurulum varsayılan olarak kodlama yüzeyini kullanır, ancak genel `byteplus/*` kataloğu da aynı anda kaydedilir.

İlk kurulum/yapılandırma model seçicilerinde, BytePlus kimlik doğrulama seçimi hem `byteplus/*` hem de `byteplus-plan/*` satırlarını tercih eder. Bu modeller henüz yüklenmemişse OpenClaw, boş bir sağlayıcı kapsamlı seçici göstermek yerine filtrelenmemiş kataloğa geri döner.

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

Kurulum ayrıntıları, model seçenekleri ve yapılandırma parçaları için [/providers/minimax](/tr/providers/minimax) sayfasına bakın.

<Note>
MiniMax'in Anthropic uyumlu akış yolunda OpenClaw, açıkça ayarlamadığınız sürece düşünmeyi varsayılan olarak devre dışı bırakır ve `/fast on`, `MiniMax-M2.7` değerini `MiniMax-M2.7-highspeed` olarak yeniden yazar.
</Note>

Plugin'e ait yetenek ayrımı:

- Metin/sohbet varsayılanları `minimax/MiniMax-M2.7` üzerinde kalır
- Görüntü üretimi `minimax/image-01` veya `minimax-portal/image-01` olur
- Görüntü anlama, her iki MiniMax kimlik doğrulama yolunda da Plugin'e ait `MiniMax-VL-01` olur
- Web araması sağlayıcı kimliği `minimax` üzerinde kalır

### LM Studio

LM Studio, yerel API'yi kullanan paketle gelen bir sağlayıcı Plugin'i olarak gönderilir:

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

OpenClaw, keşif + otomatik yükleme için LM Studio'nun yerel `/api/v1/models` ve `/api/v1/models/load` uç noktalarını, çıkarım içinse varsayılan olarak `/v1/chat/completions` uç noktasını kullanır. LM Studio JIT yüklemesinin, TTL'nin ve otomatik çıkarma işleminin model yaşam döngüsünü yönetmesini istiyorsanız `models.providers.lmstudio.params.preload: false` ayarlayın. Kurulum ve sorun giderme için [/providers/lmstudio](/tr/providers/lmstudio) sayfasına bakın.

### Ollama

Ollama, paketle gelen bir sağlayıcı Plugin'i olarak gönderilir ve Ollama'nın yerel API'sini kullanır:

- Sağlayıcı: `ollama`
- Kimlik doğrulama: Gerekmez (yerel sunucu)
- Örnek model: `ollama/llama3.3`
- Kurulum: [https://ollama.com/download](https://ollama.com/download)

```bash
# Install Ollama, then pull a model:
ollama pull llama3.3
```

```json5
{
  agents: {
    defaults: { model: { primary: "ollama/llama3.3" } },
  },
}
```

Ollama, `OLLAMA_API_KEY` ile etkinleştirdiğinizde `http://127.0.0.1:11434` adresinde yerel olarak algılanır ve paketle gelen sağlayıcı Plugin'i Ollama'yı doğrudan `openclaw onboard` ve model seçiciye ekler. İlk kurulum, bulut/yerel mod ve özel yapılandırma için [/providers/ollama](/tr/providers/ollama) sayfasına bakın.

### vLLM

vLLM, yerel/kendi barındırılan OpenAI uyumlu sunucular için paketle gelen bir sağlayıcı Plugin'i olarak gönderilir:

- Sağlayıcı: `vllm`
- Kimlik doğrulama: İsteğe bağlı (sunucunuza bağlıdır)
- Varsayılan temel URL: `http://127.0.0.1:8000/v1`

Yerel olarak otomatik keşfi etkinleştirmek için (sunucunuz kimlik doğrulamayı zorunlu kılmıyorsa herhangi bir değer çalışır):

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

Ayrıntılar için [/providers/vllm](/tr/providers/vllm) sayfasına bakın.

### SGLang

SGLang, hızlı kendi barındırılan OpenAI uyumlu sunucular için paketle gelen bir sağlayıcı Plugin'i olarak gönderilir:

- Sağlayıcı: `sglang`
- Kimlik doğrulama: İsteğe bağlı (sunucunuza bağlıdır)
- Varsayılan temel URL: `http://127.0.0.1:30000/v1`

Yerel olarak otomatik keşfi etkinleştirmek için (sunucunuz kimlik doğrulamayı zorunlu kılmıyorsa herhangi bir değer çalışır):

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

Ayrıntılar için [/providers/sglang](/tr/providers/sglang) sayfasına bakın.

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

    Önerilen: proxy/model sınırlarınızla eşleşen açık değerler ayarlayın.

  </Accordion>
  <Accordion title="Proxy rota şekillendirme kuralları">
    - Yerel olmayan uç noktalarda `api: "openai-completions"` için (`baseUrl` boş değilse ve ana makinesi `api.openai.com` değilse), OpenClaw desteklenmeyen `developer` rolleri için sağlayıcı 400 hatalarını önlemek amacıyla `compat.supportsDeveloperRole: false` değerini zorunlu kılar.
    - Proxy tarzı OpenAI uyumlu rotalar ayrıca yalnızca yerel OpenAI'ye özgü istek şekillendirmeyi atlar: `service_tier` yok, Responses `store` yok, Completions `store` yok, istem önbelleği ipuçları yok, OpenAI düşünme uyumluluğu yük şekillendirmesi yok ve gizli OpenClaw atıf başlıkları yok.
    - Satıcıya özgü alanlara ihtiyaç duyan OpenAI uyumlu Completions proxy'leri için, giden istek gövdesine ek JSON birleştirmek üzere `agents.defaults.models["provider/model"].params.extra_body` (veya `extraBody`) ayarlayın.
    - vLLM sohbet şablonu denetimleri için `agents.defaults.models["provider/model"].params.chat_template_kwargs` ayarlayın. Paketle gelen vLLM Plugin'i, oturum düşünme düzeyi kapalıyken `vllm/nemotron-3-*` için otomatik olarak `enable_thinking: false` ve `force_nonempty_content: true` gönderir.
    - Yavaş yerel modeller veya uzak LAN/tailnet ana makineleri için `models.providers.<id>.timeoutSeconds` ayarlayın. Bu, tüm agent çalışma zamanı zaman aşımını artırmadan bağlantı, başlıklar, gövde akışı ve toplam korumalı getirme iptali dahil sağlayıcı model HTTP isteği işlemeyi uzatır.
    - Model sağlayıcı HTTP çağrıları, Surge, Clash ve sing-box sahte IP DNS yanıtlarına yalnızca yapılandırılmış sağlayıcı `baseUrl` ana makine adı için `198.18.0.0/15` ve `fc00::/7` içinde izin verir. Diğer özel, loopback, bağlantı yerel ve metadata hedefleri hâlâ açık bir `models.providers.<id>.request.allowPrivateNetwork: true` etkinleştirmesi gerektirir.
    - `baseUrl` boşsa/atlanmışsa OpenClaw varsayılan OpenAI davranışını korur (bu da `api.openai.com` olarak çözümlenir).
    - Güvenlik için, açık bir `compat.supportsDeveloperRole: true` yine de yerel olmayan `openai-completions` uç noktalarında geçersiz kılınır.
    - Yerel olmayan uç noktalarda `api: "anthropic-messages"` için (kanonik `anthropic` dışındaki herhangi bir sağlayıcı veya ana makinesi herkese açık bir `api.anthropic.com` uç noktası olmayan özel bir `models.providers.anthropic.baseUrl`), OpenClaw `claude-code-20250219`, `interleaved-thinking-2025-05-14` ve OAuth işaretleri gibi örtük Anthropic beta başlıklarını bastırır; böylece özel Anthropic uyumlu proxy'ler desteklenmeyen beta bayraklarını reddetmez. Proxy'nizin belirli beta özelliklerine ihtiyacı varsa `models.providers.<id>.headers["anthropic-beta"]` değerini açıkça ayarlayın.

  </Accordion>
</AccordionGroup>

## CLI örnekleri

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

Ayrıca bkz.: tam yapılandırma örnekleri için [Yapılandırma](/tr/gateway/configuration).

## İlgili

- [Yapılandırma referansı](/tr/gateway/config-agents#agent-defaults) - model yapılandırma anahtarları
- [Model failover](/tr/concepts/model-failover) - geri dönüş zincirleri ve yeniden deneme davranışı
- [Modeller](/tr/concepts/models) - model yapılandırması ve takma adlar
- [Sağlayıcılar](/tr/providers) - sağlayıcı bazında kurulum kılavuzları
