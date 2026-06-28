---
read_when:
    - OpenClaw’ı antirez/ds4 üzerinde çalıştırmak istiyorsunuz
    - Araç çağrılarıyla yerel bir DeepSeek V4 Flash arka ucu istiyorsunuz
    - ds4-server için OpenClaw yapılandırmasına ihtiyacınız var
summary: OpenClaw'u yerel bir OpenAI uyumlu DeepSeek V4 Flash sunucusu olan ds4 üzerinden çalıştırın
title: ds4
x-i18n:
    generated_at: "2026-06-28T01:09:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a9922421d39f5d2d29dfa62de9fc3de7131dfa96445d0646cd02ad766a125544
    source_path: providers/ds4.md
    workflow: 16
---

[ds4](https://github.com/antirez/ds4), DeepSeek V4 Flash'i yerel bir
Metal arka ucundan OpenAI uyumlu bir `/v1` API ile sunar. OpenClaw, ds4'e
genel `openai-completions` sağlayıcı ailesi üzerinden bağlanır.

ds4, OpenClaw ile birlikte gelen bir sağlayıcı Plugin'i değildir. Bunu
`models.providers.ds4` altında yapılandırın, ardından `ds4/deepseek-v4-flash` seçin.

- Sağlayıcı kimliği: `ds4`
- Plugin: yok
- API: OpenAI uyumlu Chat Completions (`openai-completions`)
- Önerilen temel URL: `http://127.0.0.1:18000/v1`
- Model kimliği: `deepseek-v4-flash`
- Araç çağrıları: OpenAI tarzı `tools` ve `tool_calls` üzerinden desteklenir
- Akıl yürütme: DeepSeek tarzı `thinking` ve `reasoning_effort`

## Gereksinimler

- Metal desteği olan macOS.
- `ds4-server` ve DeepSeek V4 Flash GGUF dosyası içeren çalışan bir ds4 checkout'u.
- Seçtiğiniz bağlam için yeterli bellek. Daha büyük `--ctx` değerleri, sunucu
  başlatıldığında daha fazla KV belleği ayırır.

<Warning>
OpenClaw agent turları araç şemalarını ve çalışma alanı bağlamını içerir. `--ctx 4096`
gibi çok küçük bir bağlam doğrudan curl testlerini geçebilir, ancak tam agent
çalıştırmalarında `500 prompt exceeds context` ile başarısız olabilir. Agent ve araç
smoke testleri için en az `--ctx 32768` kullanın. `--ctx 393216` değerini yalnızca
yeterli belleğiniz varsa ve ds4 Think Max davranışını istiyorsanız kullanın.
</Warning>

## Hızlı başlangıç

<Steps>
  <Step title="ds4-server'ı başlat">
    `<DS4_DIR>` değerini ds4 checkout yolunuzla değiştirin.

    ```bash
    <DS4_DIR>/ds4-server \
      --model <DS4_DIR>/ds4flash.gguf \
      --host 127.0.0.1 \
      --port 18000 \
      --ctx 32768 \
      --tokens 128
    ```

  </Step>
  <Step title="OpenAI uyumlu endpoint'i doğrula">
    ```bash
    curl http://127.0.0.1:18000/v1/models
    ```

    Yanıt `deepseek-v4-flash` içermelidir.

  </Step>
  <Step title="OpenClaw sağlayıcı yapılandırmasını ekle">
    [Tam yapılandırma](#full-config) bölümündeki yapılandırmayı ekleyin, ardından
    tek seferlik bir model denetimi çalıştırın:

    ```bash
    openclaw infer model run \
      --local \
      --model ds4/deepseek-v4-flash \
      --thinking off \
      --prompt "Reply with exactly: openclaw-ds4-ok" \
      --json
    ```

  </Step>
</Steps>

## Tam yapılandırma

ds4 zaten `127.0.0.1:18000` üzerinde çalışıyorsa bu yapılandırmayı kullanın.

```json5
{
  agents: {
    defaults: {
      model: { primary: "ds4/deepseek-v4-flash" },
      models: {
        "ds4/deepseek-v4-flash": {
          alias: "DS4 local",
        },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      ds4: {
        baseUrl: "http://127.0.0.1:18000/v1",
        apiKey: "ds4-local",
        api: "openai-completions",
        timeoutSeconds: 300,
        models: [
          {
            id: "deepseek-v4-flash",
            name: "DeepSeek V4 Flash (ds4)",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 32768,
            maxTokens: 128,
            compat: {
              supportsUsageInStreaming: true,
              supportsReasoningEffort: true,
              maxTokensField: "max_tokens",
              supportsStrictMode: false,
              thinkingFormat: "deepseek",
              supportedReasoningEfforts: ["low", "medium", "high", "xhigh"],
            },
          },
        ],
      },
    },
  },
}
```

`contextWindow` değerini `ds4-server --ctx` değeriyle hizalı tutun. OpenClaw'ın
sunucu varsayılanından daha az çıktı istemesini özellikle istemiyorsanız `maxTokens`
değerini `--tokens` ile hizalı tutun.

## İstek üzerine başlatma

OpenClaw, ds4'ü yalnızca bir `ds4/...` modeli seçildiğinde başlatabilir. Aynı
sağlayıcı girdisine `localService` ekleyin:

```json5
{
  models: {
    providers: {
      ds4: {
        baseUrl: "http://127.0.0.1:18000/v1",
        apiKey: "ds4-local",
        api: "openai-completions",
        timeoutSeconds: 300,
        localService: {
          command: "<DS4_DIR>/ds4-server",
          args: [
            "--model",
            "<DS4_DIR>/ds4flash.gguf",
            "--host",
            "127.0.0.1",
            "--port",
            "18000",
            "--ctx",
            "32768",
            "--tokens",
            "128",
          ],
          cwd: "<DS4_DIR>",
          healthUrl: "http://127.0.0.1:18000/v1/models",
          readyTimeoutMs: 300000,
          idleStopMs: 0,
        },
        models: [
          {
            id: "deepseek-v4-flash",
            name: "DeepSeek V4 Flash (ds4)",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 32768,
            maxTokens: 128,
            compat: {
              supportsUsageInStreaming: true,
              supportsReasoningEffort: true,
              maxTokensField: "max_tokens",
              supportsStrictMode: false,
              thinkingFormat: "deepseek",
              supportedReasoningEfforts: ["low", "medium", "high", "xhigh"],
            },
          },
        ],
      },
    },
  },
}
```

`command` mutlak bir çalıştırılabilir dosya yolu olmalıdır. Kabuk araması ve `~`
genişletmesi kullanılmaz. Her `localService` alanı için [Yerel model hizmetleri](/tr/gateway/local-model-services)
bölümüne bakın.

## Think Max

ds4, Think Max'i yalnızca iki koşul da doğru olduğunda uygular:

- `ds4-server`, `--ctx 393216` veya daha yüksek bir değerle başlatılır.
- İstek `reasoning_effort: "max"` veya eşdeğer ds4 effort alanını kullanır.

Bu büyük bağlamı çalıştırırsanız hem sunucu bayraklarını hem de OpenClaw model
meta verilerini güncelleyin:

```json5
{
  contextWindow: 393216,
  maxTokens: 384000,
  compat: {
    supportsUsageInStreaming: true,
    supportsReasoningEffort: true,
    maxTokensField: "max_tokens",
    supportsStrictMode: false,
    thinkingFormat: "deepseek",
    supportedReasoningEfforts: ["low", "medium", "high", "xhigh", "max"],
  },
}
```

## Test

Doğrudan HTTP denetimiyle başlayın:

```bash
curl http://127.0.0.1:18000/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"deepseek-v4-flash","messages":[{"role":"user","content":"Reply with exactly: ds4-ok"}],"max_tokens":16,"stream":false,"thinking":{"type":"disabled"}}'
```

Ardından OpenClaw model yönlendirmesini test edin:

```bash
openclaw infer model run \
  --local \
  --model ds4/deepseek-v4-flash \
  --thinking off \
  --prompt "Reply with exactly: openclaw-ds4-ok" \
  --json
```

Tam bir agent ve araç çağrısı smoke testi için en az 32768 bağlam kullanın:

```bash
openclaw agent \
  --local \
  --session-id ds4-tool-smoke \
  --model ds4/deepseek-v4-flash \
  --thinking off \
  --message "Use the shell command pwd once, then reply exactly: tool-ok <output>" \
  --json \
  --timeout 240
```

Beklenen sonuç:

- `executionTrace.winnerProvider`, `ds4` olur
- `executionTrace.winnerModel`, `deepseek-v4-flash` olur
- `toolSummary.calls` en az `1` olur
- `finalAssistantVisibleText`, `tool-ok` ile başlar

## Sorun giderme

<AccordionGroup>
  <Accordion title="curl /v1/models bağlanamıyor">
    ds4 çalışmıyor veya `baseUrl` içindeki ana makineye ve porta bağlanmamış.
    `ds4-server` başlatın, ardından yeniden deneyin:

    ```bash
    curl http://127.0.0.1:18000/v1/models
    ```

  </Accordion>

  <Accordion title="500 prompt exceeds context">
    Yapılandırılmış `--ctx`, OpenClaw turu için çok küçük. `ds4-server --ctx`
    değerini artırın, ardından eşleşmesi için `models.providers.ds4.models[].contextWindow`
    değerini güncelleyin. Araç içeren tam agent turları, doğrudan tek mesajlık
    curl isteğinden önemli ölçüde daha fazla bağlam gerektirir.
  </Accordion>

  <Accordion title="Think Max etkinleşmiyor">
    ds4, Think Max'i yalnızca `--ctx` en az `393216` olduğunda ve istek
    `reasoning_effort: "max"` istediğinde kullanır. Daha küçük bağlamlar yüksek
    akıl yürütmeye geri döner.
  </Accordion>

  <Accordion title="İlk istek yavaş">
    ds4'te soğuk Metal yerleşimi ve model ısınma aşaması vardır. OpenClaw
    sunucuyu istek üzerine başlattığında `localService.readyTimeoutMs: 300000`
    kullanın.
  </Accordion>
</AccordionGroup>

## İlgili

<CardGroup cols={2}>
  <Card title="Yerel model hizmetleri" href="/tr/gateway/local-model-services" icon="play">
    Model isteklerinden önce yerel model sunucularını istek üzerine başlatın.
  </Card>
  <Card title="Yerel modeller" href="/tr/gateway/local-models" icon="server">
    Yerel model arka uçlarını seçin ve işletin.
  </Card>
  <Card title="Model sağlayıcıları" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcı ref'lerini, kimlik doğrulamayı ve failover'ı yapılandırın.
  </Card>
  <Card title="DeepSeek" href="/tr/providers/deepseek" icon="brain">
    Yerel DeepSeek sağlayıcı davranışı ve düşünme kontrolleri.
  </Card>
</CardGroup>
