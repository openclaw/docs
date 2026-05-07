---
read_when:
    - Sie möchten Arcee AI mit OpenClaw verwenden
    - Sie benötigen die Umgebungsvariable für den API-Schlüssel oder eine CLI-Authentifizierungsoption
summary: Arcee AI-Einrichtung (Authentifizierung + Modellauswahl)
title: Arcee AI
x-i18n:
    generated_at: "2026-05-07T15:08:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8c3775ac2783da0833988c68621bd81c73a3b3e8240c26b4c1b590c1e9df2a8f
    source_path: providers/arcee.md
    workflow: 16
---

[Arcee AI](https://arcee.ai) bietet Zugriff auf die Trinity-Familie von Mixture-of-Experts-Modellen über eine OpenAI-kompatible API. Alle Trinity-Modelle sind unter Apache 2.0 lizenziert.

Auf Arcee AI-Modelle kann direkt über die Arcee-Plattform oder über [OpenRouter](/de/providers/openrouter) zugegriffen werden.

| Eigenschaft | Wert                                                                                  |
| ----------- | ------------------------------------------------------------------------------------- |
| Provider    | `arcee`                                                                               |
| Auth        | `ARCEEAI_API_KEY` (direkt) oder `OPENROUTER_API_KEY` (über OpenRouter)                |
| API         | OpenAI-kompatibel                                                                     |
| Basis-URL   | `https://api.arcee.ai/api/v1` (direkt) oder `https://openrouter.ai/api/v1` (OpenRouter) |

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

        Dieselben Modell-Refs funktionieren sowohl für direkte als auch für OpenRouter-Setups (zum Beispiel `arcee/trinity-large-thinking`).
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

OpenClaw liefert derzeit diesen gebündelten Arcee-Katalog aus:

| Modell-Ref                     | Name                   | Eingabe | Kontext | Kosten (Ein-/Ausgabe pro 1 Mio.) | Hinweise                                  |
| ------------------------------ | ---------------------- | ------- | ------- | --------------------------------- | ----------------------------------------- |
| `arcee/trinity-large-thinking` | Trinity Large Thinking | Text    | 256K    | $0.25 / $0.90                     | Standardmodell; Reasoning aktiviert       |
| `arcee/trinity-large-preview`  | Trinity Large Preview  | Text    | 128K    | $0.25 / $1.00                     | Allzweckmodell; 400B Parameter, 13B aktiv |
| `arcee/trinity-mini`           | Trinity Mini 26B       | Text    | 128K    | $0.045 / $0.15                    | Schnell und kosteneffizient; Function Calling |

<Tip>
Die Onboarding-Voreinstellung legt `arcee/trinity-large-thinking` als Standardmodell fest.
</Tip>

## Unterstützte Funktionen

| Funktion                                      | Unterstützt                                  |
| --------------------------------------------- | -------------------------------------------- |
| Streaming                                     | Ja                                           |
| Tool-Nutzung / Function Calling              | Ja (Trinity Mini, Trinity Large Preview)     |
| Strukturierte Ausgabe (JSON-Modus und JSON-Schema) | Ja                                      |
| Extended Thinking                            | Ja (Trinity Large Thinking; Tools deaktiviert) |

<AccordionGroup>
  <Accordion title="Hinweis zur Umgebung">
    Wenn der Gateway als Daemon ausgeführt wird (launchd/systemd), stellen Sie sicher, dass `ARCEEAI_API_KEY`
    (oder `OPENROUTER_API_KEY`) für diesen Prozess verfügbar ist (zum Beispiel in
    `~/.openclaw/.env` oder über `env.shellEnv`).
  </Accordion>

  <Accordion title="OpenRouter-Routing">
    Wenn Sie Arcee-Modelle über OpenRouter verwenden, gelten dieselben `arcee/*`-Modell-Refs.
    OpenClaw übernimmt das Routing transparent basierend auf Ihrer Auth-Auswahl. Details zur
    OpenRouter-spezifischen Konfiguration finden Sie in der
    [OpenRouter-Provider-Dokumentation](/de/providers/openrouter).
  </Accordion>
</AccordionGroup>

## Verwandt

<CardGroup cols={2}>
  <Card title="OpenRouter" href="/de/providers/openrouter" icon="shuffle">
    Zugriff auf Arcee-Modelle und viele weitere über einen einzigen API-Schlüssel.
  </Card>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Provider, Modell-Refs und Failover-Verhalten auswählen.
  </Card>
</CardGroup>
