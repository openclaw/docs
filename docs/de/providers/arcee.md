---
read_when:
    - Sie möchten Arcee AI mit OpenClaw verwenden
    - Sie benötigen die Umgebungsvariable für den API-Schlüssel oder die CLI-Authentifizierungsoption
summary: Arcee-AI-Einrichtung (Authentifizierung + Modellauswahl)
title: Arcee AI
x-i18n:
    generated_at: "2026-07-24T04:51:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: a4c2fc7b8d86dd0d2a300dfc48951657cbcfcd9250016f52c1804777b2966e11
    source_path: providers/arcee.md
    workflow: 16
---

[Arcee AI](https://arcee.ai) stellt die Trinity-Familie von Mixture-of-Experts-Modellen über eine OpenAI-kompatible API bereit. Alle Trinity-Modelle sind unter Apache 2.0 lizenziert. Arcee ist ein offizielles OpenClaw-Plugin, das nicht im Kern enthalten ist. Daher muss es vor dem Onboarding installiert werden.

Greifen Sie direkt über die Arcee-Plattform oder über [OpenRouter](/de/providers/openrouter) auf Arcee-Modelle zu.

| Eigenschaft | Wert                                                                                  |
| -------- | ------------------------------------------------------------------------------------- |
| Provider | `arcee`                                                                               |
| Authentifizierung | `ARCEEAI_API_KEY` (direkt) oder `OPENROUTER_API_KEY` (über OpenRouter)                   |
| API      | OpenAI-kompatibel                                                                     |
| Basis-URL | `https://api.arcee.ai/api/v1` (direkt) oder `https://openrouter.ai/api/v1` (OpenRouter) |

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

        Für direkte und OpenRouter-Konfigurationen funktionieren dieselben Modellreferenzen.
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

## Direkter Arcee-Katalog

| Modellreferenz                | Name                   | Eingabe | Kontext | Maximale Ausgabe | Kosten (Ein-/Ausgabe pro 1 Mio.) | Tools | Hinweise                                  |
| ------------------------------ | ---------------------- | ----- | ------- | ---------- | -------------------- | ----- | ----------------------------------------- |
| `arcee/trinity-large-thinking` | Trinity Large Thinking | Text  | 256K    | 80K        | $0.25 / $0.90        | Nein  | Standardmodell; erweitertes Denken        |
| `arcee/trinity-large-preview`  | Trinity Large Preview  | Text  | 128K    | 16K        | $0.25 / $1.00        | Ja    | Universell einsetzbar; 400B Parameter, 13B aktiv |
| `arcee/trinity-mini`           | Trinity Mini 26B       | Text  | 128K    | 80K        | $0.045 / $0.15       | Ja    | Schnell und kosteneffizient; Funktionsaufrufe |

<Tip>
Die Onboarding-Voreinstellung legt `arcee/trinity-large-thinking` als Standardmodell fest.
</Tip>

## OpenRouter-Katalog

Das OpenRouter-Onboarding stellt `arcee/trinity-large-preview` und `arcee/trinity-large-thinking` bereit. OpenClaw behält diese mit dem Provider qualifizierten Modellreferenzen in der Konfiguration bei und sendet die kanonischen `arcee-ai/*`-Laufzeit-IDs von OpenRouter. Trinity Mini wird nicht mehr von OpenRouter bereitgestellt. Verwenden Sie für dieses Modell die direkte Arcee-API.

## Unterstützte Funktionen

| Funktion                                      | Unterstützt                                  |
| --------------------------------------------- | -------------------------------------------- |
| Streaming                                     | Ja                                           |
| Tool-Nutzung / Funktionsaufrufe               | Ja (Trinity Mini, Trinity Large Preview)     |
| Strukturierte Ausgabe (JSON-Modus und JSON-Schema) | Ja                                      |
| Erweitertes Denken                            | Ja (Trinity Large Thinking; Tools deaktiviert) |

<AccordionGroup>
  <Accordion title="Hinweis zur Umgebung">
    Wenn der Gateway als Daemon (launchd/systemd) ausgeführt wird, stellen Sie sicher, dass `ARCEEAI_API_KEY`
    (oder `OPENROUTER_API_KEY`) für diesen Prozess verfügbar ist, beispielsweise in
    `~/.openclaw/.env` oder über `env.shellEnv`.
  </Accordion>

  <Accordion title="OpenRouter-Routing">
    OpenRouter verwendet dieselbe OpenClaw-Modellreferenz `arcee/trinity-large-thinking`.
    OpenClaw leitet sie mit der kanonischen OpenRouter-Laufzeit-ID `arcee-ai/trinity-large-thinking`
    weiter. Weitere OpenRouter-spezifische Konfigurationsdetails finden Sie in der
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
