---
read_when:
    - Sie möchten OpenClaw mit antirez/ds4 ausführen
    - Sie möchten ein lokales DeepSeek-V4-Flash-Backend mit Tool-Aufrufen
    - Sie benötigen die OpenClaw-Konfiguration für ds4-server
summary: Führen Sie OpenClaw über ds4 aus, einen lokalen, OpenAI-kompatiblen DeepSeek-V4-Flash-Server
title: ds4
x-i18n:
    generated_at: "2026-07-12T02:03:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: be449813295648694625ef8003b3f4b12903535b74816916ca5af0695174fbf4
    source_path: providers/ds4.md
    workflow: 16
---

[ds4](https://github.com/antirez/ds4) stellt DeepSeek V4 Flash über ein lokales
Metal-Backend mit einer OpenAI-kompatiblen `/v1`-API bereit. OpenClaw verbindet sich
über die generische Provider-Familie `openai-completions` mit ds4.

ds4 ist kein mitgeliefertes OpenClaw-Provider-Plugin. Konfigurieren Sie es unter
`models.providers.ds4` und wählen Sie anschließend `ds4/deepseek-v4-flash` aus.

| Eigenschaft | Wert                                                      |
| ----------- | --------------------------------------------------------- |
| Provider-ID | `ds4`                                                     |
| Plugin      | keines (nur Konfiguration)                                |
| API         | OpenAI-kompatible Chat Completions (`openai-completions`) |
| Basis-URL   | `http://127.0.0.1:18000/v1` (empfohlen)                   |
| Modell-ID   | `deepseek-v4-flash`                                       |
| Tool-Aufrufe | OpenAI-ähnliche `tools` / `tool_calls`                   |
| Reasoning   | DeepSeek-ähnliches `thinking` und `reasoning_effort`      |

## Voraussetzungen

- macOS mit Metal-Unterstützung.
- Ein funktionsfähiger ds4-Checkout mit `ds4-server` und der GGUF-Datei von DeepSeek V4 Flash.
- Ausreichend Arbeitsspeicher für den gewählten Kontext; größere `--ctx`-Werte weisen beim
  Serverstart mehr KV-Speicher zu.

<Warning>
OpenClaw-Agent-Durchläufe enthalten Tool-Schemas und Workspace-Kontext. Ein kleiner Kontext
wie `--ctx 4096` kann direkte curl-Tests bestehen, bei vollständigen Agent-Durchläufen jedoch mit
`500 prompt exceeds context` fehlschlagen. Verwenden Sie für Agent- und Tool-
Smoke-Tests mindestens `--ctx 32768`. Verwenden Sie `--ctx 393216` nur bei ausreichend
Arbeitsspeicher und um ds4 Think Max zu aktivieren.
</Warning>

## Schnellstart

<Steps>
  <Step title="Start ds4-server">
    Ersetzen Sie `<DS4_DIR>` durch den Pfad zu Ihrem ds4-Checkout.

    ```bash
    <DS4_DIR>/ds4-server \
      --model <DS4_DIR>/ds4flash.gguf \
      --host 127.0.0.1 \
      --port 18000 \
      --ctx 32768 \
      --tokens 128
    ```

  </Step>
  <Step title="Verify the OpenAI-compatible endpoint">
    ```bash
    curl http://127.0.0.1:18000/v1/models
    ```

    Die Antwort sollte `deepseek-v4-flash` enthalten.

  </Step>
  <Step title="Add the OpenClaw provider config">
    Fügen Sie die Konfiguration aus [Vollständige Konfiguration](#full-config) hinzu und führen Sie anschließend eine einmalige
    Modellprüfung aus:

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

## Vollständige Konfiguration

Verwenden Sie diese Konfiguration, wenn ds4 bereits unter `127.0.0.1:18000` ausgeführt wird.

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

Halten Sie `contextWindow` mit `ds4-server --ctx` synchron. Halten Sie `maxTokens` mit
`--tokens` synchron, sofern OpenClaw nicht absichtlich weniger Ausgabe
als den Serverstandard anfordern soll.

## Bedarfsgesteuerter Start

OpenClaw kann ds4 erst starten, wenn ein `ds4/...`-Modell ausgewählt wird. Fügen Sie
demselben Provider-Eintrag `localService` hinzu:

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

`command` muss ein absoluter Pfad zu einer ausführbaren Datei sein. Shell-Suche und `~`-Erweiterung
werden nicht verwendet. Unter [Lokale Modelldienste](/de/gateway/local-model-services) finden Sie
alle `localService`-Felder.

## Think Max

ds4 wendet Think Max nur an, wenn beide Bedingungen erfüllt sind:

- `ds4-server` wird mit `--ctx 393216` oder höher gestartet.
- Die Anfrage verwendet `reasoning_effort: "max"` (oder das entsprechende ds4-Aufwandsfeld).

Wenn Sie einen so großen Kontext verwenden, aktualisieren Sie sowohl die Server-Flags als auch die OpenClaw-Modellmetadaten:

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

Direkte HTTP-Prüfung unter Umgehung von OpenClaw:

```bash
curl http://127.0.0.1:18000/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"deepseek-v4-flash","messages":[{"role":"user","content":"Reply with exactly: ds4-ok"}],"max_tokens":16,"stream":false,"thinking":{"type":"disabled"}}'
```

OpenClaw-Modellrouting (wie bei der Schnellstartprüfung):

```bash
openclaw infer model run \
  --local \
  --model ds4/deepseek-v4-flash \
  --thinking off \
  --prompt "Reply with exactly: openclaw-ds4-ok" \
  --json
```

Vollständiger Smoke-Test für Agent- und Tool-Aufrufe mit einem Kontext von mindestens 32768:

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

Erwartetes Ergebnis:

- `executionTrace.winnerProvider` ist `ds4`
- `executionTrace.winnerModel` ist `deepseek-v4-flash`
- `toolSummary.calls` ist mindestens `1`
- `finalAssistantVisibleText` beginnt mit `tool-ok`

## Fehlerbehebung

<AccordionGroup>
  <Accordion title="curl /v1/models cannot connect">
    ds4 wird nicht ausgeführt oder ist nicht an den Host beziehungsweise Port in `baseUrl` gebunden. Starten Sie
    `ds4-server` und versuchen Sie es anschließend erneut:

    ```bash
    curl http://127.0.0.1:18000/v1/models
    ```

  </Accordion>

  <Accordion title="500 prompt exceeds context">
    Der konfigurierte `--ctx`-Wert ist für den OpenClaw-Durchlauf zu klein. Erhöhen Sie
    `ds4-server --ctx` und aktualisieren Sie anschließend `models.providers.ds4.models[].contextWindow`
    entsprechend. Vollständige Agent-Durchläufe mit Tools benötigen erheblich mehr Kontext als eine
    direkte curl-Anfrage mit einer einzelnen Nachricht.
  </Accordion>

  <Accordion title="Think Max does not activate">
    ds4 verwendet Think Max nur, wenn `--ctx` mindestens `393216` beträgt und die Anfrage
    `reasoning_effort: "max"` anfordert. Bei kleineren Kontexten wird auf hohes
    Reasoning zurückgegriffen.
  </Accordion>

  <Accordion title="The first request is slow">
    ds4 verfügt über eine kalte Metal-Residency- und Modellaufwärmphase. Legen Sie
    `localService.readyTimeoutMs: 300000` fest, wenn OpenClaw den Server bei Bedarf
    startet.
  </Accordion>
</AccordionGroup>

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Local model services" href="/de/gateway/local-model-services" icon="play">
    Starten Sie lokale Modellserver bei Bedarf vor Modellanfragen.
  </Card>
  <Card title="Local models" href="/de/gateway/local-models" icon="server">
    Wählen und betreiben Sie lokale Modell-Backends.
  </Card>
  <Card title="Model providers" href="/de/concepts/model-providers" icon="layers">
    Konfigurieren Sie Provider-Referenzen, Authentifizierung und Failover.
  </Card>
  <Card title="DeepSeek" href="/de/providers/deepseek" icon="brain">
    Natives Verhalten des DeepSeek-Providers und Steuerung des Denkprozesses.
  </Card>
</CardGroup>
