---
read_when:
    - Je wilt OpenClaw uitvoeren met antirez/ds4
    - Je wilt een lokale DeepSeek V4 Flash-backend met toolaanroepen
    - Je hebt de OpenClaw-configuratie voor ds4-server nodig
summary: Voer OpenClaw uit via ds4, een lokale, met OpenAI compatibele DeepSeek V4 Flash-server
title: ds4
x-i18n:
    generated_at: "2026-07-12T09:19:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: be449813295648694625ef8003b3f4b12903535b74816916ca5af0695174fbf4
    source_path: providers/ds4.md
    workflow: 16
---

[ds4](https://github.com/antirez/ds4) biedt DeepSeek V4 Flash aan via een lokale
Metal-backend met een OpenAI-compatibele `/v1`-API. OpenClaw maakt verbinding met ds4
via de generieke providerfamilie `openai-completions`.

ds4 is geen gebundelde OpenClaw-providerplugin. Configureer deze onder
`models.providers.ds4` en selecteer vervolgens `ds4/deepseek-v4-flash`.

| Eigenschap    | Waarde                                                     |
| ------------- | ---------------------------------------------------------- |
| Provider-id   | `ds4`                                                      |
| Plugin        | geen (alleen configuratie)                                 |
| API           | OpenAI-compatibele Chat Completions (`openai-completions`) |
| Basis-URL     | `http://127.0.0.1:18000/v1` (aanbevolen)                   |
| Model-id      | `deepseek-v4-flash`                                        |
| Toolaanroepen | OpenAI-stijl `tools` / `tool_calls`                        |
| Redeneren     | DeepSeek-stijl `thinking` en `reasoning_effort`            |

## Vereisten

- macOS met Metal-ondersteuning.
- Een werkende ds4-check-out met `ds4-server` en het GGUF-bestand van DeepSeek V4 Flash.
- Voldoende geheugen voor de context die u kiest; grotere `--ctx`-waarden wijzen bij
  het opstarten van de server meer KV-geheugen toe.

<Warning>
OpenClaw-agentbeurten bevatten toolschema's en werkruimtecontext. Een kleine context
zoals `--ctx 4096` kan directe curl-tests doorstaan, maar volledige agentuitvoeringen
laten mislukken met `500 prompt exceeds context`. Gebruik voor rooktests van agents
en tools ten minste `--ctx 32768`. Gebruik `--ctx 393216` alleen als er voldoende
geheugen beschikbaar is en om ds4 Think Max in te schakelen.
</Warning>

## Snelstart

<Steps>
  <Step title="ds4-server starten">
    Vervang `<DS4_DIR>` door het pad naar uw ds4-check-out.

    ```bash
    <DS4_DIR>/ds4-server \
      --model <DS4_DIR>/ds4flash.gguf \
      --host 127.0.0.1 \
      --port 18000 \
      --ctx 32768 \
      --tokens 128
    ```

  </Step>
  <Step title="Het OpenAI-compatibele eindpunt verifiëren">
    ```bash
    curl http://127.0.0.1:18000/v1/models
    ```

    Het antwoord moet `deepseek-v4-flash` bevatten.

  </Step>
  <Step title="De OpenClaw-providerconfiguratie toevoegen">
    Voeg de configuratie uit [Volledige configuratie](#full-config) toe en voer vervolgens
    een eenmalige modelcontrole uit:

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

## Volledige configuratie

Gebruik deze configuratie wanneer ds4 al op `127.0.0.1:18000` draait.

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

Houd `contextWindow` in overeenstemming met `ds4-server --ctx`. Houd `maxTokens` in
overeenstemming met `--tokens`, tenzij u bewust wilt dat OpenClaw minder uitvoer
aanvraagt dan de standaardwaarde van de server.

## Op aanvraag starten

OpenClaw kan ds4 alleen starten wanneer een `ds4/...`-model is geselecteerd. Voeg
`localService` toe aan dezelfde providervermelding:

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

`command` moet een absoluut pad naar een uitvoerbaar bestand zijn. Shell-opzoeking en
uitbreiding van `~` worden niet gebruikt. Zie [Lokale modelservices](/nl/gateway/local-model-services)
voor elk `localService`-veld.

## Think Max

ds4 past Think Max alleen toe wanneer aan beide voorwaarden wordt voldaan:

- `ds4-server` start met `--ctx 393216` of hoger.
- Het verzoek gebruikt `reasoning_effort: "max"` (of het equivalente ds4-inspanningsveld).

Als u die grote context gebruikt, werkt u zowel de servervlaggen als de
OpenClaw-modelmetadata bij:

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

Directe HTTP-controle, waarbij OpenClaw wordt omzeild:

```bash
curl http://127.0.0.1:18000/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"deepseek-v4-flash","messages":[{"role":"user","content":"Reply with exactly: ds4-ok"}],"max_tokens":16,"stream":false,"thinking":{"type":"disabled"}}'
```

OpenClaw-modelroutering (hetzelfde als de controle in Snelstart):

```bash
openclaw infer model run \
  --local \
  --model ds4/deepseek-v4-flash \
  --thinking off \
  --prompt "Reply with exactly: openclaw-ds4-ok" \
  --json
```

Volledige rooktest voor agent- en toolaanroepen, met een context van ten minste 32768:

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

Verwacht resultaat:

- `executionTrace.winnerProvider` is `ds4`
- `executionTrace.winnerModel` is `deepseek-v4-flash`
- `toolSummary.calls` is ten minste `1`
- `finalAssistantVisibleText` begint met `tool-ok`

## Problemen oplossen

<AccordionGroup>
  <Accordion title="curl /v1/models kan geen verbinding maken">
    ds4 draait niet of is niet gebonden aan de host/poort in `baseUrl`. Start
    `ds4-server` en probeer het vervolgens opnieuw:

    ```bash
    curl http://127.0.0.1:18000/v1/models
    ```

  </Accordion>

  <Accordion title="500 prompt exceeds context">
    De geconfigureerde `--ctx` is te klein voor de OpenClaw-beurt. Verhoog
    `ds4-server --ctx` en werk vervolgens `models.providers.ds4.models[].contextWindow`
    bij zodat deze overeenkomt. Volledige agentbeurten met tools vereisen aanzienlijk
    meer context dan een direct curl-verzoek met één bericht.
  </Accordion>

  <Accordion title="Think Max wordt niet geactiveerd">
    ds4 gebruikt Think Max alleen wanneer `--ctx` ten minste `393216` is en het verzoek
    om `reasoning_effort: "max"` vraagt. Kleinere contexten vallen terug op een hoog
    redeneerniveau.
  </Accordion>

  <Accordion title="Het eerste verzoek is traag">
    ds4 heeft een koude Metal-residentie en een opwarmfase voor het model. Stel
    `localService.readyTimeoutMs: 300000` in wanneer OpenClaw de server op aanvraag
    start.
  </Accordion>
</AccordionGroup>

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Lokale modelservices" href="/nl/gateway/local-model-services" icon="play">
    Start lokale modelservers op aanvraag vóór modelverzoeken.
  </Card>
  <Card title="Lokale modellen" href="/nl/gateway/local-models" icon="server">
    Kies en beheer lokale modelbackends.
  </Card>
  <Card title="Modelproviders" href="/nl/concepts/model-providers" icon="layers">
    Configureer providerverwijzingen, authenticatie en failover.
  </Card>
  <Card title="DeepSeek" href="/nl/providers/deepseek" icon="brain">
    Systeemeigen DeepSeek-providergedrag en besturing voor denkprocessen.
  </Card>
</CardGroup>
