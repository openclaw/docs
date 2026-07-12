---
read_when:
    - Sie möchten Arcee AI mit OpenClaw verwenden
    - Sie benötigen die Umgebungsvariable für den API-Schlüssel oder die Authentifizierungsauswahl der CLI
summary: Arcee-AI-Einrichtung (Authentifizierung + Modellauswahl)
title: Arcee AI
x-i18n:
    generated_at: "2026-07-12T02:03:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fe519393db3cf39f1b14b8121603b6f667102ac8c122fb6560d9b73a6ee6b0a3
    source_path: providers/arcee.md
    workflow: 16
---

[Arcee AI](https://arcee.ai) stellt die Trinity-Familie von Mixture-of-Experts-Modellen über eine OpenAI-kompatible API bereit. Alle Trinity-Modelle sind unter Apache 2.0 lizenziert. Arcee ist ein offizielles OpenClaw-Plugin, das nicht im Kern enthalten ist. Daher muss es vor dem Onboarding installiert werden.

Greifen Sie direkt über die Arcee-Plattform oder über [OpenRouter](/de/providers/openrouter) auf Arcee-Modelle zu.

| Eigenschaft | Wert                                                                                  |
| ----------- | ------------------------------------------------------------------------------------- |
| Provider    | `arcee`                                                                               |
| Authentifizierung | `ARCEEAI_API_KEY` (direkt) oder `OPENROUTER_API_KEY` (über OpenRouter)          |
| API         | OpenAI-kompatibel                                                                     |
| Basis-URL   | `https://api.arcee.ai/api/v1` (direkt) oder `https://openrouter.ai/api/v1` (OpenRouter) |

## Plugin installieren

```bash
openclaw plugins install @openclaw/arcee-provider
openclaw gateway restart
```

## Erste Schritte

<Tabs>
  <Tab title="Direkt (Arcee-Plattform)">
    <Steps>
      <Step title="API-Schlüssel abrufen">
        Erstellen Sie unter [Arcee AI](https://chat.arcee.ai/) einen API-Schlüssel.
      </Step>
      <Step title="Onboarding ausführen">
        ```bash
        openclaw onboard --auth-choice arceeai-api-key
        ```
      </Step>
      <Step title="Standardmodell festlegen">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "arcee/trinity-large-thinking" },
            },
          },
        }
        ```
      </Step>
    </Steps>
  </Tab>

  <Tab title="Über OpenRouter">
    <Steps>
      <Step title="API-Schlüssel abrufen">
        Erstellen Sie unter [OpenRouter](https://openrouter.ai/keys) einen API-Schlüssel.
      </Step>
      <Step title="Onboarding ausführen">
        ```bash
        openclaw onboard --auth-choice arceeai-openrouter
        ```
      </Step>
      <Step title="Standardmodell festlegen">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "arcee/trinity-large-thinking" },
            },
          },
        }
        ```

        Dieselben Modellreferenzen funktionieren sowohl für direkte als auch für OpenRouter-Konfigurationen.
      </Step>
    </Steps>

  </Tab>
</Tabs>

## Nicht interaktive Einrichtung

<Tabs>
  <Tab title="Direkt (Arcee-Plattform)">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice arceeai-api-key \
      --arceeai-api-key "$ARCEEAI_API_KEY"
    ```
  </Tab>

  <Tab title="Über OpenRouter">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice arceeai-openrouter \
      --openrouter-api-key "$OPENROUTER_API_KEY"
    ```
  </Tab>
</Tabs>

## Integrierter Katalog

| Modellreferenz                 | Name                   | Eingabe | Kontext | Max. Ausgabe | Kosten (Ein-/Ausgabe pro 1 Mio.) | Tools | Hinweise                                  |
| ------------------------------ | ---------------------- | ------- | ------- | ------------ | -------------------------------- | ----- | ----------------------------------------- |
| `arcee/trinity-large-thinking` | Trinity Large Thinking | Text    | 256K    | 80K          | $0.25 / $0.90                    | Nein  | Standardmodell; erweitertes Denken        |
| `arcee/trinity-large-preview`  | Trinity Large Preview  | Text    | 128K    | 16K          | $0.25 / $1.00                    | Ja    | Universell einsetzbar; 400 Mrd. Parameter, 13 Mrd. aktiv |
| `arcee/trinity-mini`           | Trinity Mini 26B       | Text    | 128K    | 80K          | $0.045 / $0.15                   | Ja    | Schnell und kosteneffizient; Funktionsaufrufe |

<Tip>
Die Onboarding-Voreinstellung legt `arcee/trinity-large-thinking` als Standardmodell fest.
</Tip>

## Unterstützte Funktionen

| Funktion                                      | Unterstützt                                  |
| --------------------------------------------- | -------------------------------------------- |
| Streaming                                     | Ja                                           |
| Tool-Nutzung/Funktionsaufrufe                 | Ja (Trinity Mini, Trinity Large Preview)     |
| Strukturierte Ausgabe (JSON-Modus und JSON-Schema) | Ja                                      |
| Erweitertes Denken                            | Ja (Trinity Large Thinking; Tools deaktiviert) |

<AccordionGroup>
  <Accordion title="Hinweis zur Umgebung">
    Wenn der Gateway als Daemon (launchd/systemd) ausgeführt wird, stellen Sie sicher, dass `ARCEEAI_API_KEY`
    (oder `OPENROUTER_API_KEY`) für diesen Prozess verfügbar ist, beispielsweise in
    `~/.openclaw/.env` oder über `env.shellEnv`.
  </Accordion>

  <Accordion title="OpenRouter-Routing">
    Wenn Sie Arcee-Modelle über OpenRouter verwenden, gelten dieselben `arcee/*`-Modellreferenzen.
    OpenClaw führt das Routing transparent anhand Ihrer Authentifizierungsauswahl durch. Weitere
    OpenRouter-spezifische Konfigurationsdetails finden Sie in der
    [Dokumentation zum OpenRouter-Provider](/de/providers/openrouter).
  </Accordion>
</AccordionGroup>

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="OpenRouter" href="/de/providers/openrouter" icon="shuffle">
    Greifen Sie mit einem einzigen API-Schlüssel auf Arcee-Modelle und viele weitere Modelle zu.
  </Card>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Auswahl von Providern, Modellreferenzen und Failover-Verhalten.
  </Card>
</CardGroup>
