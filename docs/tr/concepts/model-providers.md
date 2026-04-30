---
read_when:
    - Sağlayıcı bazında bir model kurulumu referansına ihtiyacınız var
    - Model sağlayıcıları için örnek yapılandırmalar veya CLI ilk katılım komutları istiyorsunuz
sidebarTitle: Model providers
summary: Örnek yapılandırmalar + CLI akışlarıyla model sağlayıcısı genel bakışı
title: Model sağlayıcıları
x-i18n:
    generated_at: "2026-04-30T09:17:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3902194674d6d4e17a8477c28addb39b8e04c3b498eb6a0305e82c2f1b5d737e
    source_path: concepts/model-providers.md
    workflow: 16
---

**LLM/model sağlayıcıları** için başvuru (WhatsApp/Telegram gibi sohbet kanalları değil). Model seçimi kuralları için bkz. [Modeller](/tr/concepts/models).

## Hızlı kurallar

<AccordionGroup>
  <Accordion title="Model refs and CLI helpers">
    - Model başvuruları `provider/model` kullanır (örnek: `opencode/claude-opus-4-6`).
    - `agents.defaults.models` ayarlandığında izin listesi olarak davranır.
    - CLI yardımcıları: `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`.
    - `models.providers.*.contextWindow` / `contextTokens` / `maxTokens` sağlayıcı düzeyinde varsayılanları ayarlar; `models.providers.*.models[].contextWindow` / `contextTokens` / `maxTokens` bunları model başına geçersiz kılar.
    - Geri dönüş kuralları, soğuma probları ve oturum geçersiz kılma kalıcılığı: [Model yük devri](/tr/concepts/model-failover).

  </Accordion>
  <Accordion title="OpenAI provider/runtime split">
    OpenAI ailesi rotaları öneke özgüdür:

    - `openai/<model>` PI içinde doğrudan OpenAI API anahtarı sağlayıcısını kullanır.
    - `openai-codex/<model>` PI içinde Codex OAuth kullanır.
    - `openai/<model>` ve `agents.defaults.agentRuntime.id: "codex"` birlikte yerel Codex uygulama sunucusu koşumunu kullanır.

    Bkz. [OpenAI](/tr/providers/openai) ve [Codex koşumu](/tr/plugins/codex-harness). Sağlayıcı/çalışma zamanı ayrımı kafa karıştırıyorsa önce [Aracı çalışma zamanları](/tr/concepts/agent-runtimes) bölümünü okuyun.

    Plugin otomatik etkinleştirme aynı sınırı izler: `openai-codex/<model>` OpenAI Plugin kapsamındadır; Codex Plugin ise `agentRuntime.id: "codex"` veya eski `codex/<model>` başvurularıyla etkinleştirilir.

    GPT-5.5 doğrudan API anahtarı trafiği için `openai/gpt-5.5`, PI içinde Codex OAuth için `openai-codex/gpt-5.5` ve `agentRuntime.id: "codex"` ayarlandığında yerel Codex uygulama sunucusu koşumu üzerinden kullanılabilir.

  </Accordion>
  <Accordion title="CLI runtimes">
    CLI çalışma zamanları aynı ayrımı kullanır: `anthropic/claude-*`, `google/gemini-*` veya `openai/gpt-*` gibi kanonik model başvurularını seçin, ardından yerel bir CLI arka ucu istediğinizde `agents.defaults.agentRuntime.id` değerini `claude-cli`, `google-gemini-cli` veya `codex-cli` olarak ayarlayın.

    Eski `claude-cli/*`, `google-gemini-cli/*` ve `codex-cli/*` başvuruları, çalışma zamanı ayrı olarak kaydedilerek kanonik sağlayıcı başvurularına geri taşınır.

  </Accordion>
</AccordionGroup>

## Plugin sahipli sağlayıcı davranışı

Sağlayıcıya özgü mantığın çoğu sağlayıcı plugin’lerinde (`registerProvider(...)`) bulunur; OpenClaw ise genel çıkarım döngüsünü tutar. Plugin’ler ilk kurulumu, model kataloglarını, kimlik doğrulama ortam değişkeni eşlemesini, aktarım/yapılandırma normalleştirmesini, araç şeması temizliğini, yük devri sınıflandırmasını, OAuth yenilemeyi, kullanım raporlamasını, düşünme/akıl yürütme profillerini ve daha fazlasını sahiplenir.

Sağlayıcı SDK hook’larının ve paketli Plugin örneklerinin tam listesi [Sağlayıcı plugin’leri](/tr/plugins/sdk-provider-plugins) bölümündedir. Tamamen özel bir istek yürütücüsüne ihtiyaç duyan bir sağlayıcı ayrı ve daha derin bir eklenti yüzeyidir.

<Note>
Sağlayıcı sahipli çalıştırıcı davranışı; yeniden oynatma ilkesi, araç şeması normalleştirmesi, akış sarmalama ve aktarım/istek yardımcıları gibi açık sağlayıcı hook’larında bulunur. Eski `ProviderPlugin.capabilities` statik paketi yalnızca uyumluluk içindir ve artık paylaşılan çalıştırıcı mantığı tarafından okunmaz.
</Note>

## API anahtarı rotasyonu

<AccordionGroup>
  <Accordion title="Key sources and priority">
    Birden çok anahtarı şunlarla yapılandırın:

    - `OPENCLAW_LIVE_<PROVIDER>_KEY` (tek canlı geçersiz kılma, en yüksek öncelik)
    - `<PROVIDER>_API_KEYS` (virgül veya noktalı virgülle ayrılmış liste)
    - `<PROVIDER>_API_KEY` (birincil anahtar)
    - `<PROVIDER>_API_KEY_*` (numaralandırılmış liste, ör. `<PROVIDER>_API_KEY_1`)

    Google sağlayıcıları için `GOOGLE_API_KEY` de geri dönüş olarak dahil edilir. Anahtar seçimi sırası önceliği korur ve değerleri tekilleştirir.

  </Accordion>
  <Accordion title="When rotation kicks in">
    - İstekler yalnızca hız sınırı yanıtlarında sonraki anahtarla yeniden denenir (örneğin `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` veya periyodik kullanım sınırı iletileri).
    - Hız sınırı dışındaki hatalar hemen başarısız olur; anahtar rotasyonu denenmez.
    - Tüm aday anahtarlar başarısız olduğunda son hata, son denemeden döndürülür.

  </Accordion>
</AccordionGroup>

## Yerleşik sağlayıcılar (pi-ai kataloğu)

OpenClaw, pi‑ai kataloğuyla birlikte gelir. Bu sağlayıcılar **hiçbir** `models.providers` yapılandırması gerektirmez; yalnızca kimlik doğrulamayı ayarlayın ve bir model seçin.

### OpenAI

- Sağlayıcı: `openai`
- Kimlik doğrulama: `OPENAI_API_KEY`
- İsteğe bağlı rotasyon: `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2`, ayrıca `OPENCLAW_LIVE_OPENAI_KEY` (tek geçersiz kılma)
- Örnek modeller: `openai/gpt-5.5`, `openai/gpt-5.4-mini`
- Belirli bir kurulum veya API anahtarı farklı davranıyorsa hesap/model kullanılabilirliğini `openclaw models list --provider openai` ile doğrulayın.
- CLI: `openclaw onboard --auth-choice openai-api-key`
- Varsayılan aktarım `auto`dur (önce WebSocket, SSE geri dönüşü)
- Model başına `agents.defaults.models["openai/<model>"].params.transport` üzerinden geçersiz kılın (`"sse"`, `"websocket"` veya `"auto"`)
- OpenAI Responses WebSocket ısınması, `params.openaiWsWarmup` (`true`/`false`) üzerinden varsayılan olarak etkin gelir
- OpenAI öncelikli işleme, `agents.defaults.models["openai/<model>"].params.serviceTier` üzerinden etkinleştirilebilir
- `/fast` ve `params.fastMode`, doğrudan `openai/*` Responses isteklerini `api.openai.com` üzerinde `service_tier=priority` ile eşler
- Paylaşılan `/fast` anahtarı yerine açık bir katman istediğinizde `params.serviceTier` kullanın
- Gizli OpenClaw atıf başlıkları (`originator`, `version`, `User-Agent`) genel OpenAI uyumlu proxy'lere değil, yalnızca `api.openai.com` üzerindeki yerel OpenAI trafiğine uygulanır
- Yerel OpenAI rotaları ayrıca Responses `store`, istem önbelleği ipuçları ve OpenAI akıl yürütme uyumluluğu yük şekillendirmesini korur; proxy rotaları korumaz
- `openai/gpt-5.3-codex-spark`, canlı OpenAI API istekleri bunu reddettiği ve mevcut Codex kataloğu bunu sunmadığı için OpenClaw'da bilinçli olarak bastırılır

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
- Doğrudan genel Anthropic istekleri, `api.anthropic.com` adresine gönderilen API anahtarı ve OAuth ile kimliği doğrulanmış trafik dahil olmak üzere paylaşılan `/fast` anahtarını ve `params.fastMode` özelliğini destekler; OpenClaw bunu Anthropic `service_tier` değerine (`auto` ve `standard_only`) eşler
- Tercih edilen Claude CLI yapılandırması, model başvurusunu kanonik tutar ve CLI
  arka ucunu ayrı olarak seçer: `agents.defaults.agentRuntime.id: "claude-cli"` ile
  `anthropic/claude-opus-4-7`. Eski
  `claude-cli/claude-opus-4-7` başvuruları uyumluluk için çalışmaya devam eder.

<Note>
Anthropic çalışanları bize OpenClaw tarzı Claude CLI kullanımına yeniden izin verildiğini söyledi; bu nedenle OpenClaw, Anthropic yeni bir politika yayımlamadığı sürece Claude CLI yeniden kullanımını ve `claude -p` kullanımını bu entegrasyon için onaylanmış kabul eder. Anthropic kurulum belirteci desteklenen bir OpenClaw belirteç yolu olarak kullanılabilir kalır, ancak OpenClaw artık mevcut olduğunda Claude CLI yeniden kullanımını ve `claude -p` tercih eder.
</Note>

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OpenAI Codex OAuth

- Sağlayıcı: `openai-codex`
- Kimlik doğrulama: OAuth (ChatGPT)
- PI model başvurusu: `openai-codex/gpt-5.5`
- Yerel Codex uygulama sunucusu koşum başvurusu: `agents.defaults.agentRuntime.id: "codex"` ile `openai/gpt-5.5`
- Yerel Codex uygulama sunucusu koşum belgeleri: [Codex koşumu](/tr/plugins/codex-harness)
- Eski model başvuruları: `codex/gpt-*`
- Plugin sınırı: `openai-codex/*` OpenAI plugin'ini yükler; yerel Codex uygulama sunucusu plugin'i yalnızca Codex koşum runtime'ı veya eski `codex/*` başvuruları tarafından seçilir.
- CLI: `openclaw onboard --auth-choice openai-codex` veya `openclaw models auth login --provider openai-codex`
- Varsayılan aktarım `auto`dur (önce WebSocket, SSE geri dönüşü)
- PI modeli başına `agents.defaults.models["openai-codex/<model>"].params.transport` üzerinden geçersiz kılın (`"sse"`, `"websocket"` veya `"auto"`)
- `params.serviceTier`, yerel Codex Responses isteklerinde de iletilir (`chatgpt.com/backend-api`)
- Gizli OpenClaw atıf başlıkları (`originator`, `version`, `User-Agent`) genel OpenAI uyumlu proxy'lere değil, yalnızca `chatgpt.com/backend-api` üzerindeki yerel Codex trafiğine eklenir
- Doğrudan `openai/*` ile aynı `/fast` anahtarını ve `params.fastMode` yapılandırmasını paylaşır; OpenClaw bunu `service_tier=priority` ile eşler
- `openai-codex/gpt-5.5`, Codex kataloğunun yerel `contextWindow = 400000` değerini ve varsayılan runtime `contextTokens = 272000` değerini kullanır; runtime sınırını `models.providers.openai-codex.models[].contextTokens` ile geçersiz kılın
- Politika notu: OpenAI Codex OAuth, OpenClaw gibi harici araçlar/iş akışları için açıkça desteklenir.
- Codex OAuth/abonelik rotasını istediğinizde `openai-codex/gpt-5.5` kullanın; API anahtarı kurulumunuz ve yerel kataloğunuz genel API rotasını sunduğunda `openai/gpt-5.5` kullanın.

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
    Qwen Cloud sağlayıcı yüzeyi ile Alibaba DashScope ve Coding Plan uç noktası eşlemesi.
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
- İsteğe bağlı rotasyon: `GEMINI_API_KEYS`, `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, `GOOGLE_API_KEY` geri dönüşü ve `OPENCLAW_LIVE_GEMINI_KEY` (tek geçersiz kılma)
- Örnek modeller: `google/gemini-3.1-pro-preview`, `google/gemini-3-flash-preview`
- Uyumluluk: `google/gemini-3.1-flash-preview` kullanan eski OpenClaw yapılandırması `google/gemini-3-flash-preview` olarak normalleştirilir
- Takma ad: `google/gemini-3.1-pro` kabul edilir ve Google'ın canlı Gemini API kimliği olan `google/gemini-3.1-pro-preview` değerine normalleştirilir
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- Düşünme: `/think adaptive`, Google dinamik düşünmeyi kullanır. Gemini 3/3.1 sabit bir `thinkingLevel` çıkarır; Gemini 2.5 `thinkingBudget: -1` gönderir.
- Doğrudan Gemini çalıştırmaları, sağlayıcıya özgü bir `cachedContents/...` tanıtıcısını iletmek için `agents.defaults.models["google/<model>"].params.cachedContent` (veya eski `cached_content`) değerini de kabul eder; Gemini önbellek isabetleri OpenClaw `cacheRead` olarak görünür

### Google Vertex ve Gemini CLI

- Sağlayıcılar: `google-vertex`, `google-gemini-cli`
- Kimlik doğrulama: Vertex, gcloud ADC kullanır; Gemini CLI kendi OAuth akışını kullanır

<Warning>
OpenClaw içinde Gemini CLI OAuth resmi olmayan bir entegrasyondur. Bazı kullanıcılar üçüncü taraf istemcileri kullandıktan sonra Google hesabı kısıtlamaları bildirmiştir. Devam etmeyi seçerseniz Google şartlarını gözden geçirin ve kritik olmayan bir hesap kullanın.
</Warning>

Gemini CLI OAuth, paketlenmiş `google` plugin'inin bir parçası olarak gönderilir.

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
  <Step title="Oturum açın">
    ```bash
    openclaw models auth login --provider google-gemini-cli --set-default
    ```

    Varsayılan model: `google-gemini-cli/gemini-3-flash-preview`. `openclaw.json` içine bir istemci kimliği veya gizli anahtar yapıştırmazsınız. CLI oturum açma akışı belirteçleri Gateway ana makinesindeki kimlik doğrulama profillerinde saklar.

  </Step>
  <Step title="Set project (if needed)">
    Oturum açtıktan sonra istekler başarısız olursa Gateway ana makinesinde `GOOGLE_CLOUD_PROJECT` veya `GOOGLE_CLOUD_PROJECT_ID` ayarlayın.
  </Step>
</Steps>

Gemini CLI JSON yanıtları `response` içinden ayrıştırılır; kullanım `stats` değerine geri döner ve `stats.cached`, OpenClaw `cacheRead` olarak normalleştirilir.

### Z.AI (GLM)

- Sağlayıcı: `zai`
- Kimlik doğrulama: `ZAI_API_KEY`
- Örnek model: `zai/glm-5.1`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - Takma adlar: `z.ai/*` ve `z-ai/*`, `zai/*` biçimine normalleştirilir
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
- `kilocode/kilo/auto` arkasındaki tam üst akış yönlendirmesi Kilo Gateway tarafından yönetilir, OpenClaw içinde sabit kodlanmaz.

Kurulum ayrıntıları için [/providers/kilocode](/tr/providers/kilocode) bölümüne bakın.

### Diğer paketlenmiş sağlayıcı Plugin'leri

| Sağlayıcı               | Kimlik                          | Kimlik doğrulama env                                       | Örnek model                                   |
| ----------------------- | -------------------------------- | ------------------------------------------------------------ | --------------------------------------------- |
| BytePlus                | `byteplus` / `byteplus-plan`     | `BYTEPLUS_API_KEY`                                           | `byteplus-plan/ark-code-latest`               |
| Cerebras                | `cerebras`                       | `CEREBRAS_API_KEY`                                           | `cerebras/zai-glm-4.7`                        |
| Cloudflare AI Gateway   | `cloudflare-ai-gateway`          | `CLOUDFLARE_AI_GATEWAY_API_KEY`                              | —                                             |
| DeepInfra               | `deepinfra`                      | `DEEPINFRA_API_KEY`                                          | `deepinfra/deepseek-ai/DeepSeek-V3.2`         |
| DeepSeek                | `deepseek`                       | `DEEPSEEK_API_KEY`                                           | `deepseek/deepseek-v4-flash`                  |
| GitHub Copilot          | `github-copilot`                 | `COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN`         | —                                             |
| Groq                    | `groq`                           | `GROQ_API_KEY`                                               | —                                             |
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
| Venice                  | `venice`                         | `VENICE_API_KEY`                                             | —                                             |
| Vercel AI Gateway       | `vercel-ai-gateway`              | `AI_GATEWAY_API_KEY`                                         | `vercel-ai-gateway/anthropic/claude-opus-4.6` |
| Volcano Engine (Doubao) | `volcengine` / `volcengine-plan` | `VOLCANO_ENGINE_API_KEY`                                     | `volcengine-plan/ark-code-latest`             |
| xAI                     | `xai`                            | `XAI_API_KEY`                                                | `xai/grok-4`                                  |
| Xiaomi                  | `xiaomi`                         | `XIAOMI_API_KEY`                                             | `xiaomi/mimo-v2-flash`                        |

#### Bilinmeye değer özellikler

<AccordionGroup>
  <Accordion title="OpenRouter">
    Uygulama atıf başlıklarını ve Anthropic `cache_control` işaretleyicilerini yalnızca doğrulanmış `openrouter.ai` rotalarında uygular. DeepSeek, Moonshot ve ZAI referansları OpenRouter tarafından yönetilen istem önbelleğe alma için cache-TTL uygundur, ancak Anthropic önbellek işaretleyicileri almaz. Proxy tarzı OpenAI uyumlu bir yol olarak, yalnızca yerel OpenAI için olan biçimlendirmeyi (`serviceTier`, Responses `store`, istem önbelleği ipuçları, OpenAI reasoning uyumluluğu) atlar. Gemini destekli referanslar yalnızca proxy-Gemini düşünce imzası temizliğini korur.
  </Accordion>
  <Accordion title="Kilo Gateway">
    Gemini destekli referanslar aynı proxy-Gemini temizleme yolunu izler; `kilocode/kilo/auto` ve proxy reasoning desteklenmeyen diğer referanslar proxy reasoning eklemeyi atlar.
  </Accordion>
  <Accordion title="MiniMax">
    API anahtarıyla başlangıç yapılandırması açıkça yalnızca metin M2.7 sohbet modeli tanımları yazar; görüntü anlama, Plugin tarafından yönetilen `MiniMax-VL-01` medya sağlayıcısında kalır.
  </Accordion>
  <Accordion title="NVIDIA">
    Model kimlikleri `nvidia/<vendor>/<model>` ad alanını kullanır (örneğin `nvidia/moonshotai/kimi-k2.5` ile birlikte `nvidia/nvidia/nemotron-...`); seçiciler gerçek `<provider>/<model-id>` bileşimini korurken API'ye gönderilen kanonik anahtar tek önekli kalır.
  </Accordion>
  <Accordion title="xAI">
    xAI Responses yolunu kullanır. `/fast` veya `params.fastMode: true`, `grok-3`, `grok-3-mini`, `grok-4` ve `grok-4-0709` değerlerini `*-fast` varyantlarına yeniden yazar. `tool_stream` varsayılan olarak açıktır; `agents.defaults.models["xai/<model>"].params.tool_stream=false` ile devre dışı bırakın.
  </Accordion>
  <Accordion title="Cerebras">
    Paketlenmiş `cerebras` sağlayıcı Plugin'i olarak gelir. GLM `zai-glm-4.7` kullanır; OpenAI uyumlu temel URL `https://api.cerebras.ai/v1` şeklindedir.
  </Accordion>
</AccordionGroup>

## `models.providers` üzerinden sağlayıcılar (özel/temel URL)

**Özel** sağlayıcılar veya OpenAI/Anthropic uyumlu proxy'ler eklemek için `models.providers` (veya `models.json`) kullanın.

Aşağıdaki paketlenmiş sağlayıcı Plugin'lerinin çoğu zaten varsayılan bir katalog yayımlar. Açık `models.providers.<id>` girdilerini yalnızca varsayılan temel URL'yi, başlıkları veya model listesini geçersiz kılmak istediğinizde kullanın.

Gateway model yetenek denetimleri açık `models.providers.<id>.models[]` meta verilerini de okur. Özel veya proxy model görüntüleri kabul ediyorsa, WebChat ve düğüm kaynaklı ek yollarının görüntüleri yalnızca metin medya referansları yerine yerel model girdileri olarak geçirmesi için bu modelde `input: ["text", "image"]` ayarlayın.

### Moonshot AI (Kimi)

Moonshot paketlenmiş bir sağlayıcı Plugin'i olarak gelir. Varsayılan olarak yerleşik sağlayıcıyı kullanın ve yalnızca temel URL'yi veya model meta verilerini geçersiz kılmanız gerektiğinde açık bir `models.providers.moonshot` girdisi ekleyin:

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

Kimi Coding, Moonshot AI'ın Anthropic uyumlu uç noktasını kullanır:

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

İlk kurulum varsayılan olarak kodlama yüzeyini kullanır, ancak genel `volcengine/*` kataloğu aynı anda kaydedilir.

İlk kurulum/model yapılandırma seçicilerinde, Volcengine kimlik doğrulama seçimi hem `volcengine/*` hem de `volcengine-plan/*` satırlarını tercih eder. Bu modeller henüz yüklenmediyse OpenClaw, boş bir sağlayıcı kapsamlı seçici göstermek yerine filtrelenmemiş kataloğa geri döner.

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

İlk kurulum varsayılan olarak kodlama yüzeyini kullanır, ancak genel `byteplus/*` kataloğu aynı anda kaydedilir.

Başlangıç/konfigürasyon model seçicilerinde, BytePlus kimlik doğrulama seçimi hem `byteplus/*` hem de `byteplus-plan/*` satırlarını tercih eder. Bu modeller henüz yüklenmemişse OpenClaw, boş bir sağlayıcı kapsamlı seçici göstermek yerine filtresiz kataloğa geri döner.

<Tabs>
  <Tab title="Standard models">
    - `byteplus/seed-1-8-251228` (Seed 1.8)
    - `byteplus/kimi-k2-5-260127` (Kimi K2.5)
    - `byteplus/glm-4-7-251222` (GLM 4.7)

  </Tab>
  <Tab title="Coding models (byteplus-plan)">
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
- MiniMax OAuth (Çin): `--auth-choice minimax-cn-oauth`
- MiniMax API anahtarı (Küresel): `--auth-choice minimax-global-api`
- MiniMax API anahtarı (Çin): `--auth-choice minimax-cn-api`
- Kimlik doğrulama: `minimax` için `MINIMAX_API_KEY`; `minimax-portal` için `MINIMAX_OAUTH_TOKEN` veya `MINIMAX_API_KEY`

Kurulum ayrıntıları, model seçenekleri ve konfigürasyon parçaları için [/providers/minimax](/tr/providers/minimax) bölümüne bakın.

<Note>
MiniMax'in Anthropic uyumlu akış yolunda OpenClaw, açıkça ayarlamadığınız sürece thinking özelliğini varsayılan olarak devre dışı bırakır ve `/fast on`, `MiniMax-M2.7` değerini `MiniMax-M2.7-highspeed` olarak yeniden yazar.
</Note>

Plugin tarafından sahiplenilen yetenek ayrımı:

- Metin/sohbet varsayılanları `minimax/MiniMax-M2.7` üzerinde kalır
- Görüntü oluşturma `minimax/image-01` veya `minimax-portal/image-01` değeridir
- Görüntü anlama, her iki MiniMax kimlik doğrulama yolunda da Plugin sahipliğindeki `MiniMax-VL-01` değeridir
- Web araması sağlayıcı kimliği `minimax` üzerinde kalır

### LM Studio

LM Studio, yerel API'yi kullanan paketli bir sağlayıcı Plugin olarak gelir:

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

OpenClaw, keşif ve otomatik yükleme için LM Studio'nun yerel `/api/v1/models` ve `/api/v1/models/load` uç noktalarını, varsayılan olarak çıkarım için de `/v1/chat/completions` uç noktasını kullanır. Kurulum ve sorun giderme için [/providers/lmstudio](/tr/providers/lmstudio) bölümüne bakın.

### Ollama

Ollama, paketli bir sağlayıcı Plugin olarak gelir ve Ollama'nın yerel API'sini kullanır:

- Sağlayıcı: `ollama`
- Kimlik doğrulama: Gerekli değil (yerel sunucu)
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

Ollama, `OLLAMA_API_KEY` ile dahil olduğunuzda yerel olarak `http://127.0.0.1:11434` adresinde algılanır ve paketli sağlayıcı Plugin, Ollama'yı doğrudan `openclaw onboard` ve model seçiciye ekler. Başlangıç, bulut/yerel mod ve özel konfigürasyon için [/providers/ollama](/tr/providers/ollama) bölümüne bakın.

### vLLM

vLLM, yerel/kendi barındırdığınız OpenAI uyumlu sunucular için paketli bir sağlayıcı Plugin olarak gelir:

- Sağlayıcı: `vllm`
- Kimlik doğrulama: İsteğe bağlı (sunucunuza bağlıdır)
- Varsayılan temel URL: `http://127.0.0.1:8000/v1`

Yerel olarak otomatik keşfe dahil olmak için (sunucunuz kimlik doğrulamayı zorunlu kılmıyorsa herhangi bir değer çalışır):

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

SGLang, hızlı, kendi barındırdığınız OpenAI uyumlu sunucular için paketli bir sağlayıcı Plugin olarak gelir:

- Sağlayıcı: `sglang`
- Kimlik doğrulama: İsteğe bağlı (sunucunuza bağlıdır)
- Varsayılan temel URL: `http://127.0.0.1:30000/v1`

Yerel olarak otomatik keşfe dahil olmak için (sunucunuz kimlik doğrulamayı zorunlu kılmıyorsa herhangi bir değer çalışır):

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
  <Accordion title="Default optional fields">
    Özel sağlayıcılar için `reasoning`, `input`, `cost`, `contextWindow` ve `maxTokens` isteğe bağlıdır. Atlandıklarında OpenClaw varsayılan olarak şunları kullanır:

    - `reasoning: false`
    - `input: ["text"]`
    - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
    - `contextWindow: 200000`
    - `maxTokens: 8192`

    Öneri: proxy/model sınırlarınızla eşleşen açık değerler ayarlayın.

  </Accordion>
  <Accordion title="Proxy-route shaping rules">
    - Yerel olmayan uç noktalarda `api: "openai-completions"` için (`baseUrl` değeri boş olmayan ve ana makinesi `api.openai.com` olmayan herhangi bir uç nokta), OpenClaw desteklenmeyen `developer` rolleri için sağlayıcı 400 hatalarını önlemek üzere `compat.supportsDeveloperRole: false` değerini zorlar.
    - Proxy tarzı OpenAI uyumlu rotalar, yalnızca yerel OpenAI istek biçimlendirmesini de atlar: `service_tier` yok, Responses `store` yok, Completions `store` yok, istem önbelleği ipuçları yok, OpenAI reasoning uyumluluk yükü biçimlendirmesi yok ve gizli OpenClaw atıf başlıkları yok.
    - Tedarikçiye özgü alanlara ihtiyaç duyan OpenAI uyumlu Completions proxy'leri için, giden istek gövdesine ek JSON birleştirmek üzere `agents.defaults.models["provider/model"].params.extra_body` (veya `extraBody`) değerini ayarlayın.
    - vLLM sohbet şablonu kontrolleri için `agents.defaults.models["provider/model"].params.chat_template_kwargs` değerini ayarlayın. Paketli vLLM Plugin, oturum thinking seviyesi kapalıyken `vllm/nemotron-3-*` için otomatik olarak `enable_thinking: false` ve `force_nonempty_content: true` gönderir.
    - Yavaş yerel modeller veya uzak LAN/tailnet ana makineleri için `models.providers.<id>.timeoutSeconds` değerini ayarlayın. Bu, tüm ajan çalışma zamanı zaman aşımını artırmadan bağlantı, başlıklar, gövde akışı ve toplam korumalı fetch iptali dahil olmak üzere sağlayıcı model HTTP isteği işlemeyi uzatır.
    - `baseUrl` boşsa/atlanmışsa OpenClaw varsayılan OpenAI davranışını korur (bu da `api.openai.com` olarak çözülür).
    - Güvenlik için, açık bir `compat.supportsDeveloperRole: true` değeri yerel olmayan `openai-completions` uç noktalarında yine de geçersiz kılınır.
    - Doğrudan olmayan uç noktalarda `api: "anthropic-messages"` için (kanonik `anthropic` dışındaki herhangi bir sağlayıcı veya ana makinesi herkese açık bir `api.anthropic.com` uç noktası olmayan özel bir `models.providers.anthropic.baseUrl`), OpenClaw `claude-code-20250219`, `interleaved-thinking-2025-05-14` ve OAuth işaretleri gibi örtük Anthropic beta başlıklarını bastırır; böylece özel Anthropic uyumlu proxy'ler desteklenmeyen beta bayraklarını reddetmez. Proxy'niz belirli beta özelliklerine ihtiyaç duyuyorsa `models.providers.<id>.headers["anthropic-beta"]` değerini açıkça ayarlayın.

  </Accordion>
</AccordionGroup>

## CLI örnekleri

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

Tam konfigürasyon örnekleri için ayrıca bkz.: [Konfigürasyon](/tr/gateway/configuration).

## İlgili

- [Konfigürasyon referansı](/tr/gateway/config-agents#agent-defaults) — model konfigürasyon anahtarları
- [Model yük devri](/tr/concepts/model-failover) — geri dönüş zincirleri ve yeniden deneme davranışı
- [Modeller](/tr/concepts/models) — model konfigürasyonu ve takma adlar
- [Sağlayıcılar](/tr/providers) — sağlayıcı başına kurulum kılavuzları
