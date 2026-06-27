---
read_when:
    - Sie möchten Z.AI-/GLM-Modelle in OpenClaw
    - Sie benötigen eine einfache Einrichtung von ZAI_API_KEY
summary: Z.AI (GLM-Modelle) mit OpenClaw verwenden
title: Z.AI
x-i18n:
    generated_at: "2026-06-27T18:08:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a40675d3db518c090828bcc46c3bca348d1bed1027ba6b80228aa27773efd10f
    source_path: providers/zai.md
    workflow: 16
---

Z.AI ist die API-Plattform für **GLM**-Modelle. Sie stellt REST-APIs für GLM bereit und
verwendet API-Schlüssel zur Authentifizierung. Erstellen Sie Ihren API-Schlüssel in der Z.AI-Konsole.
OpenClaw verwendet den Provider `zai` mit einem Z.AI-API-Schlüssel.

| Eigenschaft | Wert                                         |
| -------- | -------------------------------------------- |
| Provider | `zai`                                        |
| Paket    | `@openclaw/zai-provider`                     |
| Auth     | `ZAI_API_KEY` (Legacy-Alias: `Z_AI_API_KEY`) |
| API      | Z.AI Chat Completions (Bearer-Auth)          |

## GLM-Modelle

GLM ist eine Modellfamilie, kein separater Provider. In OpenClaw verwenden GLM-Modelle
Refs wie `zai/glm-5.2`: Provider `zai`, Modell-ID `glm-5.2`.

## Erste Schritte

Installieren Sie zuerst das Provider-Plugin:

```bash
openclaw plugins install @openclaw/zai-provider
```

<Tabs>
  <Tab title="Auto-detect endpoint">
    **Am besten geeignet für:** die meisten Benutzer. OpenClaw prüft unterstützte Z.AI-Endpunkte mit Ihrem API-Schlüssel und wendet automatisch die richtige Basis-URL an.

    <Steps>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice zai-api-key
        ```
      </Step>
      <Step title="Verify the model is listed">
        ```bash
        openclaw models list --all --provider zai
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Explicit regional endpoint">
    **Am besten geeignet für:** Benutzer, die einen bestimmten Coding Plan oder eine allgemeine API-Oberfläche erzwingen möchten.

    <Steps>
      <Step title="Pick the right onboarding choice">
        ```bash
        # Coding Plan Global (recommended for Coding Plan users)
        openclaw onboard --auth-choice zai-coding-global

        # Coding Plan CN (China region)
        openclaw onboard --auth-choice zai-coding-cn

        # General API
        openclaw onboard --auth-choice zai-global

        # General API CN (China region)
        openclaw onboard --auth-choice zai-cn
        ```
      </Step>
      <Step title="Verify the model is listed">
        ```bash
        openclaw models list --all --provider zai
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## Konfigurationsbeispiel

<Tip>
`zai-api-key` lässt OpenClaw den passenden Z.AI-Endpunkt anhand des Schlüssels erkennen und
automatisch die richtige Basis-URL anwenden. Verwenden Sie die expliziten regionalen Optionen, wenn
Sie einen bestimmten Coding Plan oder eine allgemeine API-Oberfläche erzwingen möchten.
</Tip>

```json5
{
  env: { ZAI_API_KEY: "sk-..." },
  models: {
    providers: {
      zai: {
        // GLM-5.2 uses the Coding Plan endpoint.
        baseUrl: "https://api.z.ai/api/coding/paas/v4",
      },
    },
  },
  agents: { defaults: { model: { primary: "zai/glm-5.2" } } },
}
```

## Integrierter Katalog

Das Provider-Plugin `zai` liefert seinen Katalog im Plugin-Manifest aus, sodass
schreibgeschützte Auflistungen bekannte GLM-Zeilen anzeigen können, ohne die Provider-Laufzeit zu laden:

```bash
openclaw models list --all --provider zai
```

Der manifestgestützte Katalog enthält derzeit:

| Modell-Ref           | Hinweise                        |
| -------------------- | ------------------------------- |
| `zai/glm-5.2`        | Standard für Coding Plan; 1M-Kontext |
| `zai/glm-5.1`        | Standard für allgemeine API     |
| `zai/glm-5`          |                                 |
| `zai/glm-5-turbo`    |                                 |
| `zai/glm-5v-turbo`   |                                 |
| `zai/glm-4.7`        |                                 |
| `zai/glm-4.7-flash`  |                                 |
| `zai/glm-4.7-flashx` |                                 |
| `zai/glm-4.6`        |                                 |
| `zai/glm-4.6v`       |                                 |
| `zai/glm-4.5`        |                                 |
| `zai/glm-4.5-air`    |                                 |
| `zai/glm-4.5-flash`  |                                 |
| `zai/glm-4.5v`       |                                 |

<Tip>
GLM-Modelle sind als `zai/<model>` verfügbar (Beispiel: `zai/glm-5`).
</Tip>

<Tip>
GLM-5.2 unterstützt die Denkstufen `off`, `low`, `high` und `max`. OpenClaw ordnet
`low` und `high` dem hohen Reasoning-Aufwand von Z.AI zu und `max` dem maximalen Aufwand.
</Tip>

<Note>
Die Einrichtung für Coding Plan verwendet standardmäßig `zai/glm-5.2`; die Einrichtung der allgemeinen API behält
`zai/glm-5.1` bei. Die automatische Endpunkterkennung fällt auf `glm-5.1` oder `glm-4.7`
zurück, wenn der ausgewählte Plan GLM-5.2 nicht bereitstellt. GLM-Versionen und Verfügbarkeit
können sich ändern; führen Sie `openclaw models list --all --provider zai` aus, um den Katalog
anzuzeigen, der Ihrer installierten Version bekannt ist.
</Note>

## Erweiterte Konfiguration

<AccordionGroup>
  <Accordion title="Forward-resolving unknown GLM-5 models">
    Unbekannte `glm-5*`-IDs werden im Provider-Pfad weiterhin vorwärts aufgelöst, indem
    Provider-eigene Metadaten aus der Vorlage `glm-4.7` synthetisiert werden, wenn die ID
    der aktuellen Form der GLM-5-Familie entspricht.
  </Accordion>

  <Accordion title="Tool-call streaming">
    `tool_stream` ist für Z.AI-Tool-Call-Streaming standardmäßig aktiviert. So deaktivieren Sie es:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "zai/<model>": {
              params: { tool_stream: false },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Thinking and preserved thinking">
    Das Denken von Z.AI folgt den `/think`-Steuerungen von OpenClaw. Wenn Denken deaktiviert ist,
    sendet OpenClaw `thinking: { type: "disabled" }`, um Antworten zu vermeiden, die
    das Ausgabebudget für `reasoning_content` vor sichtbarem Text verbrauchen.

    Beibehaltenes Denken ist Opt-in, weil Z.AI verlangt, dass der gesamte historische
    `reasoning_content` erneut abgespielt wird, was Prompt-Token erhöht. Aktivieren Sie es
    pro Modell:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "zai/glm-5.2": {
              params: { preserveThinking: true },
            },
          },
        },
      },
    }
    ```

    Wenn es aktiviert ist und Denken eingeschaltet ist, sendet OpenClaw
    `thinking: { type: "enabled", clear_thinking: false }` und spielt vorherigen
    `reasoning_content` für dasselbe OpenAI-kompatible Transkript erneut ab.

    Fortgeschrittene Benutzer können die exakte Provider-Nutzlast weiterhin mit
    `params.extra_body.thinking` überschreiben.

  </Accordion>

  <Accordion title="Image understanding">
    Das Z.AI-Plugin registriert Bildverständnis.

    | Eigenschaft   | Wert        |
    | ------------- | ----------- |
    | Modell        | `glm-4.6v`  |

    Bildverständnis wird automatisch aus der konfigurierten Z.AI-Authentifizierung aufgelöst; es ist
    keine zusätzliche Konfiguration erforderlich.

  </Accordion>

  <Accordion title="Auth details">
    - Z.AI verwendet Bearer-Auth mit Ihrem API-Schlüssel.
    - Die Onboarding-Option `zai-api-key` erkennt den passenden Z.AI-Endpunkt automatisch, indem unterstützte Endpunkte mit Ihrem Schlüssel geprüft werden.
    - Verwenden Sie die expliziten regionalen Optionen (`zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn`), wenn Sie eine bestimmte API-Oberfläche erzwingen möchten.
    - Die Legacy-Umgebungsvariable `Z_AI_API_KEY` wird weiterhin akzeptiert; OpenClaw kopiert sie beim Start nach `ZAI_API_KEY`, wenn `ZAI_API_KEY` nicht gesetzt ist.

  </Accordion>
</AccordionGroup>

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Model selection" href="/de/concepts/model-providers" icon="layers">
    Auswahl von Providern, Modell-Refs und Failover-Verhalten.
  </Card>
  <Card title="Configuration reference" href="/de/gateway/configuration-reference" icon="gear">
    Vollständiges OpenClaw-Konfigurationsschema, einschließlich Provider- und Modelleinstellungen.
  </Card>
</CardGroup>
