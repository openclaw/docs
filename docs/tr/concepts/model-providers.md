---
read_when:
    - Sağlayıcı bazında model kurulum başvurusuna ihtiyacınız var
    - Model sağlayıcıları için örnek yapılandırmalar veya CLI ilk katılım komutları istiyorsunuz
sidebarTitle: Model providers
summary: Model sağlayıcı genel bakışı, örnek yapılandırmalar ve CLI akışlarıyla birlikte
title: Model sağlayıcıları
x-i18n:
    generated_at: "2026-07-04T04:03:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 410c92229de01cbb2be185e6cd1e2a07e554c7c5aacb356f4a9ffd1bce268de2
    source_path: concepts/model-providers.md
    workflow: 16
---

**LLM/model sağlayıcıları** için başvuru (WhatsApp/Telegram gibi sohbet kanalları değil). Model seçimi kuralları için bkz. [Modeller](/tr/concepts/models).

## Hızlı kurallar

<AccordionGroup>
  <Accordion title="Model başvuruları ve CLI yardımcıları">
    - Model başvuruları `provider/model` biçimini kullanır (örnek: `opencode/claude-opus-4-6`).
    - `agents.defaults.models` ayarlandığında izin listesi olarak davranır.
    - CLI yardımcıları: `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`.
    - `models.providers.*.contextWindow` / `contextTokens` / `maxTokens` sağlayıcı düzeyindeki varsayılanları ayarlar; `models.providers.*.models[].contextWindow` / `contextTokens` / `maxTokens` bunları model bazında geçersiz kılar.
    - Yedekleme kuralları, bekleme süresi yoklamaları ve oturum geçersiz kılma kalıcılığı: [Model yük devri](/tr/concepts/model-failover).

  </Accordion>
  <Accordion title="Sağlayıcı kimlik doğrulaması eklemek birincil modelinizi değiştirmez">
    `openclaw configure`, bir sağlayıcı eklediğinizde veya yeniden kimlik doğruladığınızda mevcut `agents.defaults.model.primary` değerini korur. `openclaw models auth login`, `--set-default` geçmediğiniz sürece aynısını yapar. Sağlayıcı Plugin’leri kimlik doğrulama yapılandırma yamalarında yine de önerilen bir varsayılan model döndürebilir, ancak bir birincil model zaten varsa OpenClaw bunu "geçerli birincil modeli değiştir" olarak değil, "bu modeli kullanılabilir yap" olarak ele alır.

    Varsayılan modeli bilinçli olarak değiştirmek için `openclaw models set <provider/model>` veya `openclaw models auth login --provider <id> --set-default` kullanın.

  </Accordion>
  <Accordion title="OpenAI sağlayıcı/runtime ayrımı">
    OpenAI ailesi rotalar öneke özeldir:

    - `openai/<model>`, varsayılan olarak ajan dönüşleri için yerel Codex uygulama sunucusu koşumunu kullanır. Bu, olağan ChatGPT/Codex abonelik kurulumudur.
    - eski Codex model başvuruları, doctor’ın `openai/<model>` olarak yeniden yazdığı eski yapılandırmadır.
    - `openai/<model>` ile sağlayıcı/model `agentRuntime.id: "openclaw"` birlikte, açık API anahtarı veya uyumluluk rotaları için OpenClaw’ın yerleşik runtime’ını kullanır.

    Bkz. [OpenAI](/tr/providers/openai) ve [Codex koşumu](/tr/plugins/codex-harness). Sağlayıcı/runtime ayrımı kafa karıştırıcıysa önce [Ajan runtime’ları](/tr/concepts/agent-runtimes) bölümünü okuyun.

    Plugin otomatik etkinleştirme aynı sınırı izler: `openai/*` ajan başvuruları varsayılan rota için Codex Plugin’ini etkinleştirir ve açık sağlayıcı/model `agentRuntime.id: "codex"` veya eski `codex/<model>` başvuruları da bunu gerektirir.

    GPT-5.5, `openai/gpt-5.5` üzerinde varsayılan olarak yerel Codex uygulama sunucusu koşumu üzerinden ve sağlayıcı/model runtime ilkesi açıkça `openclaw` seçtiğinde OpenClaw runtime’ı üzerinden kullanılabilir.

  </Accordion>
  <Accordion title="CLI runtime’ları">
    CLI runtime’ları aynı ayrımı kullanır: `anthropic/claude-*` veya `google/gemini-*` gibi kanonik model başvurularını seçin, ardından yerel CLI arka ucu istediğinizde sağlayıcı/model runtime ilkesini `claude-cli` veya `google-gemini-cli` olarak ayarlayın.

    Eski `claude-cli/*` ve `google-gemini-cli/*` başvuruları, runtime ayrı kaydedilmiş olarak kanonik sağlayıcı başvurularına geri taşınır. Eski `codex-cli/*` başvuruları `openai/*` biçimine taşınır ve Codex uygulama sunucusu rotasını kullanır; OpenClaw artık paketlenmiş bir Codex CLI arka ucu tutmaz.

  </Accordion>
</AccordionGroup>

## Plugin’e ait sağlayıcı davranışı

Sağlayıcıya özgü mantığın çoğu sağlayıcı Plugin’lerinde (`registerProvider(...)`) yaşarken OpenClaw genel çıkarım döngüsünü tutar. Plugin’ler başlangıç kurulumunu, model kataloglarını, kimlik doğrulama ortam değişkeni eşlemesini, taşıma/yapılandırma normalleştirmesini, araç şeması temizliğini, yük devri sınıflandırmasını, OAuth yenilemeyi, kullanım raporlamasını, düşünme/akıl yürütme profillerini ve daha fazlasını sahiplenir.

Sağlayıcı SDK kancalarının ve paketlenmiş Plugin örneklerinin tam listesi [Sağlayıcı Plugin’leri](/tr/plugins/sdk-provider-plugins) bölümündedir. Tamamen özel bir istek yürütücüsüne ihtiyaç duyan bir sağlayıcı ayrı ve daha derin bir genişletme yüzeyidir.

<Note>
Sağlayıcıya ait çalıştırıcı davranışı, yeniden oynatma ilkesi, araç şeması normalleştirmesi, akış sarmalama ve taşıma/istek yardımcıları gibi açık sağlayıcı kancalarında yaşar. Eski `ProviderPlugin.capabilities` statik torbası yalnızca uyumluluk içindir ve artık paylaşılan çalıştırıcı mantığı tarafından okunmaz.
</Note>

## API anahtarı döndürme

<AccordionGroup>
  <Accordion title="Anahtar kaynakları ve öncelik">
    Birden çok anahtarı şunlarla yapılandırın:

    - `OPENCLAW_LIVE_<PROVIDER>_KEY` (tek canlı geçersiz kılma, en yüksek öncelik)
    - `<PROVIDER>_API_KEYS` (virgül veya noktalı virgülle ayrılmış liste)
    - `<PROVIDER>_API_KEY` (birincil anahtar)
    - `<PROVIDER>_API_KEY_*` (numaralı liste, ör. `<PROVIDER>_API_KEY_1`)

    Google sağlayıcıları için `GOOGLE_API_KEY` de yedek olarak dahil edilir. Anahtar seçim sırası önceliği korur ve yinelenen değerleri kaldırır.

  </Accordion>
  <Accordion title="Döndürme ne zaman devreye girer">
    - İstekler yalnızca hız sınırı yanıtlarında sonraki anahtarla yeniden denenir (örneğin `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` veya dönemsel kullanım sınırı mesajları).
    - Hız sınırı olmayan hatalar hemen başarısız olur; anahtar döndürme denenmez.
    - Tüm aday anahtarlar başarısız olduğunda son hata, son denemeden döndürülür.

  </Accordion>
</AccordionGroup>

## Resmi sağlayıcı Plugin’leri

Resmi sağlayıcı Plugin’leri kendi model katalog satırlarını yayımlar. Bu sağlayıcılar **hiçbir** `models.providers` model girdisi gerektirmez; sağlayıcı Plugin’ini etkinleştirin, kimlik doğrulamayı ayarlayın ve bir model seçin. `models.providers` yalnızca açık özel sağlayıcılar veya zaman aşımı gibi dar istek ayarları için kullanın.

### OpenAI

- Sağlayıcı: `openai`
- Kimlik doğrulama: `OPENAI_API_KEY`
- İsteğe bağlı döndürme: `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2`, ayrıca `OPENCLAW_LIVE_OPENAI_KEY` (tek geçersiz kılma)
- Örnek modeller: `openai/gpt-5.5`, `openai/gpt-5.4-mini`
- Belirli bir kurulum veya API anahtarı farklı davranıyorsa hesap/model kullanılabilirliğini `openclaw models list --provider openai` ile doğrulayın.
- CLI: `openclaw onboard --auth-choice openai-api-key`
- Varsayılan taşıma `auto` değeridir; OpenClaw taşıma seçimini paylaşılan model runtime’ına geçirir.
- Model bazında `agents.defaults.models["openai/<model>"].params.transport` ile geçersiz kılın (`"sse"`, `"websocket"` veya `"auto"`)
- OpenAI öncelikli işleme `agents.defaults.models["openai/<model>"].params.serviceTier` ile etkinleştirilebilir
- `/fast` ve `params.fastMode`, doğrudan `openai/*` Responses isteklerini `api.openai.com` üzerinde `service_tier=priority` değerine eşler
- Paylaşılan `/fast` anahtarı yerine açık bir katman istediğinizde `params.serviceTier` kullanın
- Gizli OpenClaw atıf başlıkları (`originator`, `version`, `User-Agent`) genel OpenAI uyumlu proxy’lere değil, yalnızca `api.openai.com` adresine giden yerel OpenAI trafiğine uygulanır
- Yerel OpenAI rotaları ayrıca Responses `store`, istem önbelleği ipuçları ve OpenAI akıl yürütme uyumluluğu yük biçimlendirmesini korur; proxy rotaları bunu yapmaz
- `openai/gpt-5.3-codex-spark`, oturum açmış hesabınız bunu sunduğunda ChatGPT/Codex OAuth abonelik kimlik doğrulaması üzerinden kullanılabilir; OpenClaw bu model için doğrudan OpenAI API anahtarı ve Azure API anahtarı rotalarını hâlâ bastırır çünkü bu taşımalar modeli reddeder

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
}
```

### Anthropic

- Sağlayıcı: `anthropic`
- Kimlik doğrulama: `ANTHROPIC_API_KEY`
- İsteğe bağlı döndürme: `ANTHROPIC_API_KEYS`, `ANTHROPIC_API_KEY_1`, `ANTHROPIC_API_KEY_2`, ayrıca `OPENCLAW_LIVE_ANTHROPIC_KEY` (tek geçersiz kılma)
- Örnek model: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice apiKey`
- Doğrudan genel Anthropic istekleri, `api.anthropic.com` adresine gönderilen API anahtarlı ve OAuth kimlik doğrulamalı trafik dahil olmak üzere paylaşılan `/fast` anahtarını ve `params.fastMode` değerini destekler; OpenClaw bunu Anthropic `service_tier` değerine (`auto` ve `standard_only`) eşler
- Tercih edilen Claude CLI yapılandırması model başvurusunu kanonik tutar ve CLI
  arka ucunu ayrıca seçer: model kapsamlı
  `agentRuntime.id: "claude-cli"` ile `anthropic/claude-opus-4-8`. Eski
  `claude-cli/claude-opus-4-7` başvuruları uyumluluk için hâlâ çalışır.

<Note>
Anthropic çalışanları OpenClaw tarzı Claude CLI kullanımına yeniden izin verildiğini söyledi, bu nedenle Anthropic yeni bir ilke yayımlamadığı sürece OpenClaw bu entegrasyon için Claude CLI yeniden kullanımını ve `claude -p` kullanımını onaylanmış kabul eder. Anthropic kurulum belirteci desteklenen bir OpenClaw belirteç yolu olarak kullanılabilir kalır, ancak OpenClaw artık kullanılabilir olduğunda Claude CLI yeniden kullanımını ve `claude -p` seçeneğini tercih eder.
</Note>

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OpenAI ChatGPT/Codex OAuth

- Sağlayıcı: `openai`
- Kimlik doğrulama: OAuth (ChatGPT)
- Eski OpenAI Codex model başvurusu: `openai/gpt-5.5`
- Yerel Codex uygulama sunucusu koşumu başvurusu: `openai/gpt-5.5`
- Yerel Codex uygulama sunucusu koşumu belgeleri: [Codex koşumu](/tr/plugins/codex-harness)
- Eski model başvuruları: `codex/gpt-*`
- Plugin sınırı: `openai/*`, OpenAI Plugin’ini yükler; yerel Codex uygulama sunucusu Plugin’i Codex koşumu runtime’ı tarafından seçilir.
- CLI: `openclaw onboard --auth-choice openai` veya `openclaw models auth login --provider openai`
- Varsayılan taşıma `auto` değeridir (önce WebSocket, SSE yedeği)
- OpenAI Codex modeli bazında `agents.defaults.models["openai/<model>"].params.transport` ile geçersiz kılın (`"sse"`, `"websocket"` veya `"auto"`)
- `params.serviceTier` ayrıca yerel Codex Responses isteklerinde (`chatgpt.com/backend-api`) iletilir
- Gizli OpenClaw atıf başlıkları (`originator`, `version`, `User-Agent`) genel OpenAI uyumlu proxy’lere değil, yalnızca `chatgpt.com/backend-api` adresine giden yerel Codex trafiğine eklenir
- Doğrudan `openai/*` ile aynı `/fast` anahtarını ve `params.fastMode` yapılandırmasını paylaşır; OpenClaw bunu `service_tier=priority` değerine eşler
- `openai/gpt-5.5`, Codex kataloğunun yerel `contextWindow = 400000` değerini ve varsayılan runtime `contextTokens = 272000` değerini kullanır; runtime sınırını `models.providers.openai.models[].contextTokens` ile geçersiz kılın
- İlke notu: OpenAI Codex OAuth, OpenClaw gibi harici araçlar/iş akışları için açıkça desteklenir.
- Yaygın abonelik ve yerel Codex runtime rotası için `openai` kimlik doğrulamasıyla oturum açın ve `openai/gpt-5.5` yapılandırın; OpenAI ajan dönüşleri varsayılan olarak Codex’i seçer.
- Yerleşik OpenClaw rotasını yalnızca istediğinizde sağlayıcı/model `agentRuntime.id: "openclaw"` kullanın; aksi halde `openai/gpt-5.5` değerini varsayılan Codex koşumunda tutun.
- Eski Codex GPT başvuruları canlı bir sağlayıcı rotası değil, eski durumdur. Yeni ajan yapılandırması için yerel Codex runtime’ında `openai/gpt-5.5` kullanın ve eski Codex model başvurularını kanonik `openai/*` başvurularına taşımak için `openclaw doctor --fix` çalıştırın.

```json5
{
  plugins: { entries: { codex: { enabled: true } } },
  agents: {
    defaults: {
      model: { primary: "openai/gpt-5.5" },
    },
  },
}
```

```json5
{
  models: {
    providers: {
      openai: {
        models: [{ id: "gpt-5.5", contextTokens: 160000 }],
      },
    },
  },
}
```

### Diğer abonelik tarzı barındırılan seçenekler

<CardGroup cols={3}>
  <Card title="Z.AI (GLM)" href="/tr/providers/zai">
    Z.AI Coding Plan veya genel API uç noktaları.
  </Card>
  <Card title="MiniMax" href="/tr/providers/minimax">
    MiniMax Coding Plan OAuth veya API anahtarı erişimi.
  </Card>
  <Card title="Qwen Cloud" href="/tr/providers/qwen">
    Qwen Cloud sağlayıcı yüzeyi, ayrıca Alibaba DashScope ve Coding Plan uç nokta eşlemesi.
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
- İsteğe bağlı döndürme: `GEMINI_API_KEYS`, `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, `GOOGLE_API_KEY` yedeği ve `OPENCLAW_LIVE_GEMINI_KEY` (tekil geçersiz kılma)
- Örnek modeller: `google/gemini-3.1-pro-preview`, `google/gemini-3-flash-preview`
- Uyumluluk: `google/gemini-3.1-flash-preview` kullanan eski OpenClaw yapılandırması `google/gemini-3-flash-preview` olarak normalleştirilir
- Takma ad: `google/gemini-3.1-pro` kabul edilir ve Google'ın canlı Gemini API kimliğine, `google/gemini-3.1-pro-preview` değerine normalleştirilir
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- Düşünme: `/think adaptive`, Google dinamik düşünmeyi kullanır. Gemini 3/3.1 sabit bir `thinkingLevel` atlar; Gemini 2.5 `thinkingBudget: -1` gönderir.
- Doğrudan Gemini çalıştırmaları, sağlayıcıya özgü bir `cachedContents/...` tutamacını iletmek için `agents.defaults.models["google/<model>"].params.cachedContent` (veya eski `cached_content`) değerini de kabul eder; Gemini önbellek isabetleri OpenClaw `cacheRead` olarak görünür

### Google Vertex ve Gemini CLI

- Sağlayıcılar: `google-vertex`, `google-gemini-cli`
- Kimlik doğrulama: Vertex, gcloud ADC kullanır; Gemini CLI kendi OAuth akışını kullanır

<Warning>
OpenClaw içindeki Gemini CLI OAuth, resmi olmayan bir entegrasyondur. Bazı kullanıcılar, üçüncü taraf istemcileri kullandıktan sonra Google hesabı kısıtlamaları bildirmiştir. Devam etmeyi seçerseniz Google şartlarını inceleyin ve kritik olmayan bir hesap kullanın.
</Warning>

Gemini CLI OAuth, paketle birlikte gelen `google` plugin parçası olarak sunulur.

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

    Varsayılan model: `google-gemini-cli/gemini-3-flash-preview`. `openclaw.json` içine bir istemci kimliği veya gizli anahtar **yapıştırmazsınız**. CLI oturum açma akışı, jetonları gateway ana makinesindeki kimlik doğrulama profillerinde saklar.

  </Step>
  <Step title="Projeyi ayarlayın (gerekiyorsa)">
    Oturum açtıktan sonra istekler başarısız olursa gateway ana makinesinde `GOOGLE_CLOUD_PROJECT` veya `GOOGLE_CLOUD_PROJECT_ID` ayarlayın.
  </Step>
</Steps>

Gemini CLI varsayılan olarak `stream-json` kullanır. OpenClaw, asistan akış
iletilerini okur ve `stats.cached` değerini `cacheRead` olarak normalleştirir; eski
`--output-format json` geçersiz kılmaları yanıt metnini yine `response` değerinden okur.

### Z.AI (GLM)

- Sağlayıcı: `zai`
- Kimlik doğrulama: `ZAI_API_KEY`
- Örnek model: `zai/glm-5.2`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - Model referansları kanonik `zai/*` sağlayıcı kimliğini kullanır.
  - `zai-api-key` eşleşen Z.AI uç noktasını otomatik algılar; `zai-coding-global`, `zai-coding-cn`, `zai-global` ve `zai-cn` belirli bir yüzeyi zorunlu kılar

### Vercel AI Gateway

- Sağlayıcı: `vercel-ai-gateway`
- Kimlik doğrulama: `AI_GATEWAY_API_KEY`
- Örnek modeller: `vercel-ai-gateway/anthropic/claude-opus-4.6`, `vercel-ai-gateway/moonshotai/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice ai-gateway-api-key`

### Diğer paketli sağlayıcı plugin'leri

| Sağlayıcı                               | Kimlik                           | Kimlik doğrulama env                                | Örnek model                                               |
| --------------------------------------- | -------------------------------- | --------------------------------------------------- | --------------------------------------------------------- |
| BytePlus                                | `byteplus` / `byteplus-plan`     | `BYTEPLUS_API_KEY`                                  | `byteplus-plan/ark-code-latest`                           |
| ClawRouter                              | `clawrouter`                     | `CLAWROUTER_API_KEY`                                | `clawrouter/anthropic/claude-sonnet-4-6`                  |
| Cohere                                  | `cohere`                         | `COHERE_API_KEY`                                    | `cohere/command-a-03-2025`                                |
| GitHub Copilot                          | `github-copilot`                 | `COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN` | -                                                         |
| Hugging Face Inference                  | `huggingface`                    | `HUGGINGFACE_HUB_TOKEN` veya `HF_TOKEN`             | `huggingface/deepseek-ai/DeepSeek-R1`                     |
| MiniMax                                 | `minimax` / `minimax-portal`     | `MINIMAX_API_KEY` / `MINIMAX_OAUTH_TOKEN`           | `minimax/MiniMax-M3`                                      |
| Mistral                                 | `mistral`                        | `MISTRAL_API_KEY`                                   | `mistral/mistral-large-latest`                            |
| Moonshot                                | `moonshot`                       | `MOONSHOT_API_KEY`                                  | `moonshot/kimi-k2.6`                                      |
| NVIDIA                                  | `nvidia`                         | `NVIDIA_API_KEY`                                    | `nvidia/nvidia/nemotron-3-ultra-550b-a55b`                |
| NovitaAI                                | `novita`                         | `NOVITA_API_KEY`                                    | `novita/deepseek/deepseek-v3-0324`                        |
| [Ollama Cloud](/tr/providers/ollama-cloud) | `ollama-cloud`                   | `OLLAMA_API_KEY`                                    | `ollama-cloud/kimi-k2.6`                                  |
| OpenRouter                              | `openrouter`                     | OpenRouter OAuth veya `OPENROUTER_API_KEY`          | `openrouter/auto`                                         |
| [Qwen OAuth](/tr/providers/qwen-oauth)     | `qwen-oauth`                     | `QWEN_API_KEY`                                      | `qwen-oauth/qwen3.5-plus`                                 |
| Together                                | `together`                       | `TOGETHER_API_KEY`                                  | `together/meta-llama/Llama-3.3-70B-Instruct-Turbo`        |
| Venice                                  | `venice`                         | `VENICE_API_KEY`                                    | -                                                         |
| Vercel AI Gateway                       | `vercel-ai-gateway`              | `AI_GATEWAY_API_KEY`                                | `vercel-ai-gateway/anthropic/claude-opus-4.6`             |
| Volcano Engine (Doubao)                 | `volcengine` / `volcengine-plan` | `VOLCANO_ENGINE_API_KEY`                            | `volcengine-plan/ark-code-latest`                         |
| xAI                                     | `xai`                            | SuperGrok/X Premium OAuth veya `XAI_API_KEY`        | `xai/grok-4.3`                                            |
| Xiaomi                                  | `xiaomi` / `xiaomi-token-plan`   | `XIAOMI_API_KEY` / `XIAOMI_TOKEN_PLAN_API_KEY`      | `xiaomi/mimo-v2-flash` / `xiaomi-token-plan/mimo-v2.5-pro` |

#### Bilinmeye değer tuhaflıklar

<AccordionGroup>
  <Accordion title="OpenRouter">
    Uygulama atıf başlıklarını ve Anthropic `cache_control` işaretleyicilerini yalnızca doğrulanmış `openrouter.ai` rotalarında uygular. DeepSeek, Moonshot ve ZAI referansları, OpenRouter tarafından yönetilen istem önbelleklemesi için cache-TTL açısından uygundur ancak Anthropic önbellek işaretleyicileri almaz. Proxy tarzı OpenAI uyumlu bir yol olarak yalnızca yerel OpenAI'ye özgü şekillendirmeyi (`serviceTier`, Responses `store`, istem önbelleği ipuçları, OpenAI akıl yürütme uyumluluğu) atlar. Gemini destekli referanslar yalnızca proxy-Gemini düşünce imzası temizlemesini korur.
  </Accordion>
  <Accordion title="Kilo Gateway">
    Gemini destekli referanslar aynı proxy-Gemini temizleme yolunu izler; `kilocode/kilo/auto` ve proxy akıl yürütmesi desteklenmeyen diğer referanslar proxy akıl yürütme enjeksiyonunu atlar.
  </Accordion>
  <Accordion title="MiniMax">
    API anahtarıyla başlangıç kurulumu açık M3 ve M2.7 sohbet modeli tanımları yazar; görüntü anlama, plugin'e ait `MiniMax-VL-01` medya sağlayıcısında kalır.
  </Accordion>
  <Accordion title="NVIDIA">
    Model kimlikleri bir `nvidia/<vendor>/<model>` ad alanı kullanır (örneğin `nvidia/moonshotai/kimi-k2.5` ile birlikte `nvidia/nvidia/nemotron-...`); seçiciler gerçek `<provider>/<model-id>` bileşimini korurken API'ye gönderilen kanonik anahtar tek önekli kalır.
  </Accordion>
  <Accordion title="xAI">
    xAI Responses yolunu kullanır. Önerilen yol SuperGrok/X Premium OAuth'tır; API anahtarları `XAI_API_KEY` veya plugin yapılandırması üzerinden çalışmaya devam eder ve Grok `web_search`, API anahtarı yedeğinden önce aynı kimlik doğrulama profilini yeniden kullanır. `grok-4.3` paketli varsayılan sohbet modelidir ve `grok-build-0.1` derleme/kodlama odaklı işler için seçilebilir. `/fast` veya `params.fastMode: true`, `grok-3`, `grok-3-mini`, `grok-4` ve `grok-4-0709` değerlerini `*-fast` varyantlarına yeniden yazar. `tool_stream` varsayılan olarak açıktır; `agents.defaults.models["xai/<model>"].params.tool_stream=false` ile devre dışı bırakın.
  </Accordion>
</AccordionGroup>

## `models.providers` üzerinden sağlayıcılar (özel/temel URL)

**Özel** sağlayıcılar veya OpenAI/Anthropic uyumlu proxy'ler eklemek için `models.providers` (veya `models.json`) kullanın.

Aşağıdaki paketle birlikte gelen sağlayıcı Plugin'lerin çoğu zaten varsayılan bir katalog yayımlar. Açık `models.providers.<id>` girdilerini yalnızca varsayılan temel URL'yi, üstbilgileri veya model listesini geçersiz kılmak istediğinizde kullanın.

Gateway model yetenek denetimleri açık `models.providers.<id>.models[]` meta verilerini de okur. Özel veya proxy bir model görüntüleri kabul ediyorsa, WebChat ve Node kaynaklı ek yollarının görüntüleri yalnızca metin medya referansları yerine yerel model girdileri olarak iletmesi için o modelde `input: ["text", "image"]` ayarlayın.

`agents.defaults.models["provider/model"]` yalnızca ajanlar için model görünürlüğünü, takma adları ve model başına meta verileri denetler. Tek başına yeni bir çalışma zamanı modelini kaydetmez. Özel sağlayıcı modelleri için, en azından eşleşen `id` ile birlikte `models.providers.<provider>.models[]` de ekleyin.

### Moonshot AI (Kimi)

Onboarding öncesinde `@openclaw/moonshot-provider` yükleyin. Açık bir `models.providers.moonshot` girdisini yalnızca temel URL'yi veya model meta verilerini geçersiz kılmanız gerektiğinde ekleyin:

- Sağlayıcı: `moonshot`
- Kimlik doğrulama: `MOONSHOT_API_KEY`
- Örnek model: `moonshot/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice moonshot-api-key` veya `openclaw onboard --auth-choice moonshot-api-key-cn`

Kimi K2 model kimlikleri:

[//]: # "moonshot-kimi-k2-model-refs:start"

- `moonshot/kimi-k2.6`
- `moonshot/kimi-k2.7-code`
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
- Örnek model: `kimi/kimi-for-coding`

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: { model: { primary: "kimi/kimi-for-coding" } },
  },
}
```

Eski `kimi/kimi-code` ve `kimi/k2p5`, uyumluluk model kimlikleri olarak kabul edilmeye devam eder ve Kimi'nin kararlı API model kimliğine normalleştirilir.

### Volcano Engine (Doubao)

Volcano Engine (火山引擎), Çin'deki Doubao ve diğer modellere erişim sağlar.

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

Onboarding varsayılan olarak kodlama yüzeyini kullanır, ancak genel `volcengine/*` kataloğu aynı anda kaydedilir.

Onboarding/configure model seçicilerinde, Volcengine kimlik doğrulama seçimi hem `volcengine/*` hem de `volcengine-plan/*` satırlarını tercih eder. Bu modeller henüz yüklenmediyse OpenClaw, boş bir sağlayıcı kapsamlı seçici göstermek yerine filtresiz kataloğa geri döner.

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

Onboarding varsayılan olarak kodlama yüzeyini kullanır, ancak genel `byteplus/*` kataloğu aynı anda kaydedilir.

Onboarding/configure model seçicilerinde, BytePlus kimlik doğrulama seçimi hem `byteplus/*` hem de `byteplus-plan/*` satırlarını tercih eder. Bu modeller henüz yüklenmediyse OpenClaw, boş bir sağlayıcı kapsamlı seçici göstermek yerine filtresiz kataloğa geri döner.

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

MiniMax özel endpoint’ler kullandığı için `models.providers` üzerinden yapılandırılır:

- MiniMax OAuth (Küresel): `--auth-choice minimax-global-oauth`
- MiniMax OAuth (CN): `--auth-choice minimax-cn-oauth`
- MiniMax API anahtarı (Küresel): `--auth-choice minimax-global-api`
- MiniMax API anahtarı (CN): `--auth-choice minimax-cn-api`
- Kimlik doğrulama: `minimax` için `MINIMAX_API_KEY`; `minimax-portal` için `MINIMAX_OAUTH_TOKEN` veya `MINIMAX_API_KEY`

Kurulum ayrıntıları, model seçenekleri ve yapılandırma parçacıkları için [/providers/minimax](/tr/providers/minimax) sayfasına bakın.

<Note>
MiniMax’in Anthropic uyumlu streaming yolunda, siz açıkça ayarlamadığınız sürece OpenClaw M2.x ailesi için thinking’i varsayılan olarak devre dışı bırakır; MiniMax-M3 (ve M3.x) varsayılan olarak sağlayıcının atlanmış/uyarlanabilir thinking yolunda kalır. `/fast on`, `MiniMax-M2.7` değerini `MiniMax-M2.7-highspeed` olarak yeniden yazar.
</Note>

Plugin sahipli yetenek ayrımı:

- Metin/sohbet varsayılanları `minimax/MiniMax-M3` üzerinde kalır
- Görsel oluşturma `minimax/image-01` veya `minimax-portal/image-01` değeridir
- Görsel anlama, her iki MiniMax kimlik doğrulama yolunda da Plugin sahipli `MiniMax-VL-01` değeridir
- Web araması sağlayıcı kimliği `minimax` üzerinde kalır

### LM Studio

LM Studio, yerel API’yi kullanan paketli bir sağlayıcı Plugin olarak gelir:

- Sağlayıcı: `lmstudio`
- Kimlik doğrulama: `LM_API_TOKEN`
- Varsayılan çıkarım temel URL’si: `http://localhost:1234/v1`

Ardından bir model ayarlayın (`http://localhost:1234/api/v1/models` tarafından döndürülen kimliklerden biriyle değiştirin):

```json5
{
  agents: {
    defaults: { model: { primary: "lmstudio/openai/gpt-oss-20b" } },
  },
}
```

OpenClaw, keşif + otomatik yükleme için LM Studio’nun yerel `/api/v1/models` ve `/api/v1/models/load` yollarını, varsayılan olarak çıkarım için `/v1/chat/completions` yolunu kullanır. LM Studio JIT yükleme, TTL ve otomatik çıkarma işlemlerinin model yaşam döngüsüne sahip olmasını istiyorsanız `models.providers.lmstudio.params.preload: false` ayarlayın. Kurulum ve sorun giderme için [/providers/lmstudio](/tr/providers/lmstudio) sayfasına bakın.

### Ollama

Ollama, paketli bir sağlayıcı Plugin olarak gelir ve Ollama’nın yerel API’sini kullanır:

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

`OLLAMA_API_KEY` ile katılmayı seçtiğinizde Ollama yerel olarak `http://127.0.0.1:11434` adresinde algılanır ve paketli sağlayıcı Plugin, Ollama’yı doğrudan `openclaw onboard` içine ve model seçiciye ekler. Onboarding, bulut/yerel mod ve özel yapılandırma için [/providers/ollama](/tr/providers/ollama) sayfasına bakın.

### vLLM

vLLM, yerel/kendi barındırdığınız OpenAI uyumlu sunucular için paketli bir sağlayıcı Plugin olarak gelir:

- Sağlayıcı: `vllm`
- Kimlik doğrulama: İsteğe bağlı (sunucunuza bağlıdır)
- Varsayılan temel URL: `http://127.0.0.1:8000/v1`

Yerel otomatik keşfe katılmak için (sunucunuz kimlik doğrulamayı zorunlu tutmuyorsa herhangi bir değer çalışır):

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

SGLang, hızlı ve kendi barındırdığınız OpenAI uyumlu sunucular için paketli bir sağlayıcı Plugin olarak gelir:

- Sağlayıcı: `sglang`
- Kimlik doğrulama: İsteğe bağlı (sunucunuza bağlıdır)
- Varsayılan temel URL: `http://127.0.0.1:30000/v1`

Yerel otomatik keşfe katılmak için (sunucunuz kimlik doğrulamayı zorunlu tutmuyorsa herhangi bir değer çalışır):

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
    Özel sağlayıcılar için `reasoning`, `input`, `cost`, `contextWindow` ve `maxTokens` isteğe bağlıdır. Atlandığında OpenClaw varsayılan olarak şunları kullanır:

    - `reasoning: false`
    - `input: ["text"]`
    - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
    - `contextWindow: 200000`
    - `maxTokens: 8192`

    Önerilen: proxy/model sınırlarınızla eşleşen açık değerler ayarlayın.

  </Accordion>
  <Accordion title="Proxy rota şekillendirme kuralları">
    - Yerel olmayan endpoint’lerde `api: "openai-completions"` için (`baseUrl` değeri boş olmayan ve host’u `api.openai.com` olmayan herhangi bir endpoint), OpenClaw desteklenmeyen `developer` rolleri için sağlayıcı 400 hatalarını önlemek amacıyla `compat.supportsDeveloperRole: false` değerini zorunlu kılar.
    - Proxy tarzı OpenAI uyumlu rotalar ayrıca yalnızca yerel OpenAI’ye özgü istek şekillendirmeyi atlar: `service_tier` yok, Responses `store` yok, Completions `store` yok, prompt-cache ipuçları yok, OpenAI reasoning uyumluluk payload şekillendirmesi yok ve gizli OpenClaw ilişkilendirme üstbilgileri yok.
    - Satıcıya özgü alanlara ihtiyaç duyan OpenAI uyumlu Completions proxy’leri için, giden istek gövdesine ek JSON birleştirmek üzere `agents.defaults.models["provider/model"].params.extra_body` (veya `extraBody`) ayarlayın.
    - vLLM sohbet şablonu denetimleri için `agents.defaults.models["provider/model"].params.chat_template_kwargs` ayarlayın. Paketli vLLM Plugin, oturum thinking düzeyi kapalıyken `vllm/nemotron-3-*` için otomatik olarak `enable_thinking: false` ve `force_nonempty_content: true` gönderir.
    - Yavaş yerel modeller veya uzak LAN/tailnet host’ları için `models.providers.<id>.timeoutSeconds` ayarlayın. Bu, tüm ajan çalışma zamanı zaman aşımını artırmadan bağlantı, üstbilgiler, gövde streaming’i ve toplam korumalı fetch iptali dahil sağlayıcı model HTTP isteği işlemeyi uzatır. `agents.defaults.timeoutSeconds` veya çalıştırmaya özgü bir zaman aşımı daha düşükse, bu tavanı da yükseltin; sağlayıcı zaman aşımları tüm çalıştırmayı uzatamaz.
    - Model sağlayıcı HTTP çağrıları, Surge, Clash ve sing-box fake-IP DNS yanıtlarına `198.18.0.0/15` ve `fc00::/7` içinde yalnızca yapılandırılmış sağlayıcı `baseUrl` host adı için izin verir. Özel/yerel sağlayıcı endpoint’leri ayrıca local loopback, LAN ve tailnet host’ları dahil olmak üzere korumalı model istekleri için tam olarak yapılandırılmış `scheme://host:port` origin değerine güvenir. Bu yeni bir yapılandırma seçeneği değildir; yapılandırdığınız `baseUrl`, istek ilkesini yalnızca o origin için genişletir. Fake-IP host adı izni ve tam-origin güveni bağımsız mekanizmalardır. Diğer özel, local loopback, link-local, metadata hedefleri ve farklı portlar yine açık bir `models.providers.<id>.request.allowPrivateNetwork: true` katılımı gerektirir. Tam-origin güveninden çıkmak için `models.providers.<id>.request.allowPrivateNetwork: false` ayarlayın.
    - `baseUrl` boşsa/atlanmışsa OpenClaw varsayılan OpenAI davranışını korur (bu davranış `api.openai.com` adresine çözümlenir).
    - Güvenlik için, açık bir `compat.supportsDeveloperRole: true` değeri yerel olmayan `openai-completions` endpoint’lerinde yine de geçersiz kılınır.
    - Doğrudan olmayan endpoint’lerde `api: "anthropic-messages"` için (kanonik `anthropic` dışındaki herhangi bir sağlayıcı veya host’u herkese açık bir `api.anthropic.com` endpoint’i olmayan özel bir `models.providers.anthropic.baseUrl`), OpenClaw `claude-code-20250219`, `interleaved-thinking-2025-05-14` ve OAuth işaretçileri gibi örtük Anthropic beta üstbilgilerini bastırır; böylece özel Anthropic uyumlu proxy’ler desteklenmeyen beta bayraklarını reddetmez. Proxy’nizin belirli beta özelliklerine ihtiyacı varsa `models.providers.<id>.headers["anthropic-beta"]` değerini açıkça ayarlayın.

  </Accordion>
</AccordionGroup>

## CLI örnekleri

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

Tam yapılandırma örnekleri için ayrıca bkz.: [Yapılandırma](/tr/gateway/configuration).

## İlgili

- [Yapılandırma başvurusu](/tr/gateway/config-agents#agent-defaults) - model yapılandırma anahtarları
- [Model failover](/tr/concepts/model-failover) - fallback zincirleri ve yeniden deneme davranışı
- [Modeller](/tr/concepts/models) - model yapılandırması ve takma adlar
- [Sağlayıcılar](/tr/providers) - sağlayıcı başına kurulum kılavuzları
