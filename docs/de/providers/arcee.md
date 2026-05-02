---
read_when:
    - Sie möchten Arcee AI mit OpenClaw verwenden
    - Sie benötigen die Umgebungsvariable für den API-Schlüssel oder die CLI-Authentifizierungsoption
summary: Arcee AI-Einrichtung (Authentifizierung + Modellauswahl)
title: Arcee AI
x-i18n:
    generated_at: "2026-05-02T23:39:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 622ee5288aec3ae0b45d3f06ba65fd6f972e07d7a7596ae3905d6fbdac0bf737
    source_path: providers/arcee.md
    workflow: 16
---

[Arcee AI](https://arcee.ai) bietet über eine OpenAI-kompatible API Zugriff auf die Trinity-Familie von Mixture-of-Experts-Modellen. Alle Trinity-Modelle sind unter Apache 2.0 lizenziert.

Auf Arcee AI-Modelle kann direkt über die Arcee-Plattform oder über [OpenRouter](/de/providers/openrouter) zugegriffen werden.

| Eigenschaft | Wert                                                                                  |
| -------- | ------------------------------------------------------------------------------------- |
| Provider | `arcee`                                                                               |
| Auth     | `ARCEEAI_API_KEY` (direkt) oder `OPENROUTER_API_KEY` (über OpenRouter)                |
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

        Dieselben Modellreferenzen funktionieren sowohl für direkte als auch für OpenRouter-Setups (zum Beispiel `arcee/trinity-large-thinking`).
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

OpenClaw enthält derzeit diesen gebündelten Arcee-Katalog:

| Modellreferenz                | Name                   | Eingabe | Kontext | Kosten (Ein-/Ausgabe pro 1 Mio.) | Hinweise                                  |
| ------------------------------ | ---------------------- | ----- | ------- | -------------------- | ------------------------------------------ |
| `arcee/trinity-large-thinking` | Trinity Large Thinking | Text  | 256K    | $0.25 / $0.90        | Standardmodell; Reasoning aktiviert; keine Tools |
| `arcee/trinity-large-preview`  | Trinity Large Preview  | Text  | 128K    | $0.25 / $1.00        | Allzweckmodell; 400B Parameter, 13B aktiv  |
| `arcee/trinity-mini`           | Trinity Mini 26B       | Text  | 128K    | $0.045 / $0.15       | Schnell und kosteneffizient; Funktionsaufrufe |

<Tip>
Die Onboarding-Voreinstellung legt `arcee/trinity-large-thinking` als Standardmodell fest. Es ist ein reines Reasoning-/Textmodell und unterstützt weder Tool-Nutzung noch Funktionsaufrufe.
</Tip>

## Unterstützte Funktionen

| Funktion                                      | Unterstützt                                |
| --------------------------------------------- | ------------------------------------------- |
| Streaming                                     | Ja                                          |
| Tool-Nutzung / Funktionsaufrufe              | Modellabhängig; nicht Trinity Large Thinking |
| Strukturierte Ausgabe (JSON-Modus und JSON-Schema) | Ja                                  |
| Erweitertes Denken                           | Ja (Trinity Large Thinking)                 |

<AccordionGroup>
  <Accordion title="Hinweis zur Umgebung">
    Wenn der Gateway als Daemon ausgeführt wird (launchd/systemd), stellen Sie sicher, dass `ARCEEAI_API_KEY`
    (oder `OPENROUTER_API_KEY`) für diesen Prozess verfügbar ist (zum Beispiel in
    `~/.openclaw/.env` oder über `env.shellEnv`).
  </Accordion>

  <Accordion title="OpenRouter-Routing">
    Wenn Sie Arcee-Modelle über OpenRouter verwenden, gelten dieselben `arcee/*`-Modellreferenzen.
    OpenClaw verarbeitet das Routing transparent anhand Ihrer Auth-Auswahl. Weitere OpenRouter-spezifische
    Konfigurationsdetails finden Sie in der
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
