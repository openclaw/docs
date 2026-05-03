---
read_when:
    - Sie möchten Arcee AI mit OpenClaw verwenden
    - Sie benötigen die Umgebungsvariable für den API-Schlüssel oder die CLI-Authentifizierungsoption
summary: Arcee AI-Einrichtung (Authentifizierung + Modellauswahl)
title: Arcee AI
x-i18n:
    generated_at: "2026-05-03T06:43:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 54989e1706901fedc8a0c816ca7ee7f877fa4b973697540dd90cb9182420043f
    source_path: providers/arcee.md
    workflow: 16
---

[Arcee AI](https://arcee.ai) bietet über eine OpenAI-kompatible API Zugriff auf die Trinity-Familie von Mixture-of-Experts-Modellen. Alle Trinity-Modelle sind unter Apache 2.0 lizenziert.

Auf Arcee-AI-Modelle kann direkt über die Arcee-Plattform oder über [OpenRouter](/de/providers/openrouter) zugegriffen werden.

| Eigenschaft | Wert                                                                                  |
| -------- | ------------------------------------------------------------------------------------- |
| Provider | `arcee`                                                                               |
| Authentifizierung | `ARCEEAI_API_KEY` (direkt) oder `OPENROUTER_API_KEY` (über OpenRouter)                |
| API      | OpenAI-kompatibel                                                                     |
| Basis-URL | `https://api.arcee.ai/api/v1` (direkt) oder `https://openrouter.ai/api/v1` (OpenRouter) |

## Erste Schritte

<Tabs>
  <Tab title="Direkt (Arcee-Plattform)">
    <Steps>
      <Step title="API-Schlüssel abrufen">
        Erstellen Sie einen API-Schlüssel bei [Arcee AI](https://chat.arcee.ai/).
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
        Erstellen Sie einen API-Schlüssel bei [OpenRouter](https://openrouter.ai/keys).
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

        Dieselben Modellreferenzen funktionieren sowohl für direkte Setups als auch für OpenRouter-Setups (zum Beispiel `arcee/trinity-large-thinking`).
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

OpenClaw liefert derzeit diesen gebündelten Arcee-Katalog mit:

| Modellreferenz                 | Name                   | Eingabe | Kontext | Kosten (Ein-/Ausgabe pro 1 Mio.) | Hinweise                                  |
| ------------------------------ | ---------------------- | ----- | ------- | -------------------- | ----------------------------------------- |
| `arcee/trinity-large-thinking` | Trinity Large Thinking | Text  | 256K    | $0.25 / $0.90        | Standardmodell; Reasoning aktiviert       |
| `arcee/trinity-large-preview`  | Trinity Large Preview  | Text  | 128K    | $0.25 / $1.00        | Allzweckmodell; 400B Parameter, 13B aktiv |
| `arcee/trinity-mini`           | Trinity Mini 26B       | Text  | 128K    | $0.045 / $0.15       | Schnell und kosteneffizient; Function Calling |

<Tip>
Die Onboarding-Voreinstellung legt `arcee/trinity-large-thinking` als Standardmodell fest.
</Tip>

## Unterstützte Funktionen

| Funktion                                      | Unterstützt                  |
| --------------------------------------------- | ---------------------------- |
| Streaming                                     | Ja                           |
| Tool-Nutzung / Function Calling              | Ja                           |
| Strukturierte Ausgabe (JSON-Modus und JSON-Schema) | Ja                          |
| Extended Thinking                            | Ja (Trinity Large Thinking)  |

<AccordionGroup>
  <Accordion title="Umgebungshinweis">
    Wenn der Gateway als Daemon (launchd/systemd) ausgeführt wird, stellen Sie sicher, dass `ARCEEAI_API_KEY`
    (oder `OPENROUTER_API_KEY`) für diesen Prozess verfügbar ist (zum Beispiel in
    `~/.openclaw/.env` oder über `env.shellEnv`).
  </Accordion>

  <Accordion title="OpenRouter-Routing">
    Wenn Sie Arcee-Modelle über OpenRouter verwenden, gelten dieselben `arcee/*`-Modellreferenzen.
    OpenClaw übernimmt das Routing transparent auf Basis Ihrer Authentifizierungsauswahl. Weitere
    OpenRouter-spezifische Konfigurationsdetails finden Sie in der
    [OpenRouter-Provider-Dokumentation](/de/providers/openrouter).
  </Accordion>
</AccordionGroup>

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="OpenRouter" href="/de/providers/openrouter" icon="shuffle">
    Greifen Sie mit einem einzigen API-Schlüssel auf Arcee-Modelle und viele andere zu.
  </Card>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Provider, Modellreferenzen und Failover-Verhalten auswählen.
  </Card>
</CardGroup>
