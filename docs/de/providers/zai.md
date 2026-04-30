---
read_when:
    - Sie möchten Z.AI-/GLM-Modelle in OpenClaw nutzen
    - Sie benötigen eine einfache ZAI_API_KEY-Einrichtung
summary: Z.AI (GLM-Modelle) mit OpenClaw verwenden
title: Z.AI
x-i18n:
    generated_at: "2026-04-30T07:12:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0192797b9e023065a384b0428830e73877a5088d2c40c2190d5322273294607d
    source_path: providers/zai.md
    workflow: 16
---

Z.AI ist die API-Plattform für **GLM**-Modelle. Sie stellt REST-APIs für GLM bereit und verwendet API-Schlüssel
zur Authentifizierung. Erstellen Sie Ihren API-Schlüssel in der Z.AI-Konsole. OpenClaw verwendet den `zai`-Provider
mit einem Z.AI-API-Schlüssel.

- Provider: `zai`
- Authentifizierung: `ZAI_API_KEY`
- API: Z.AI Chat Completions (Bearer-Authentifizierung)

## Erste Schritte

<Tabs>
  <Tab title="Endpunkt automatisch erkennen">
    **Am besten geeignet für:** die meisten Benutzer. OpenClaw erkennt den passenden Z.AI-Endpunkt anhand des Schlüssels und wendet automatisch die richtige Basis-URL an.

    <Steps>
      <Step title="Onboarding ausführen">
        ```bash
        openclaw onboard --auth-choice zai-api-key
        ```
      </Step>
      <Step title="Ein Standardmodell festlegen">
        ```json5
        {
          env: { ZAI_API_KEY: "sk-..." },
          agents: { defaults: { model: { primary: "zai/glm-5.1" } } },
        }
        ```
      </Step>
      <Step title="Prüfen, ob das Modell verfügbar ist">
        ```bash
        openclaw models list --provider zai
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Expliziter regionaler Endpunkt">
    **Am besten geeignet für:** Benutzer, die einen bestimmten Coding Plan oder eine allgemeine API-Oberfläche erzwingen möchten.

    <Steps>
      <Step title="Die richtige Onboarding-Auswahl wählen">
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
      <Step title="Ein Standardmodell festlegen">
        ```json5
        {
          env: { ZAI_API_KEY: "sk-..." },
          agents: { defaults: { model: { primary: "zai/glm-5.1" } } },
        }
        ```
      </Step>
      <Step title="Prüfen, ob das Modell verfügbar ist">
        ```bash
        openclaw models list --provider zai
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## Integrierter Katalog

OpenClaw initialisiert den gebündelten `zai`-Provider derzeit mit:

| Modell-Referenz      | Hinweise      |
| -------------------- | ------------- |
| `zai/glm-5.1`        | Standardmodell |
| `zai/glm-5`          |               |
| `zai/glm-5-turbo`    |               |
| `zai/glm-5v-turbo`   |               |
| `zai/glm-4.7`        |               |
| `zai/glm-4.7-flash`  |               |
| `zai/glm-4.7-flashx` |               |
| `zai/glm-4.6`        |               |
| `zai/glm-4.6v`       |               |
| `zai/glm-4.5`        |               |
| `zai/glm-4.5-air`    |               |
| `zai/glm-4.5-flash`  |               |
| `zai/glm-4.5v`       |               |

<Tip>
GLM-Modelle sind als `zai/<model>` verfügbar (Beispiel: `zai/glm-5`). Die gebündelte Standardmodell-Referenz ist `zai/glm-5.1`.
</Tip>

## Erweiterte Konfiguration

<AccordionGroup>
  <Accordion title="Vorwärtsauflösung unbekannter GLM-5-Modelle">
    Unbekannte `glm-5*`-IDs werden auf dem gebündelten Provider-Pfad weiterhin vorwärts aufgelöst, indem
    Provider-eigene Metadaten aus der Vorlage `glm-4.7` synthetisiert werden, wenn die ID
    der aktuellen Form der GLM-5-Familie entspricht.
  </Accordion>

  <Accordion title="Tool-Call-Streaming">
    `tool_stream` ist standardmäßig für Z.AI-Tool-Call-Streaming aktiviert. So deaktivieren Sie es:

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

  <Accordion title="Thinking und beibehaltenes Thinking">
    Z.AI-Thinking folgt den `/think`-Steuerungen von OpenClaw. Wenn Thinking deaktiviert ist,
    sendet OpenClaw `thinking: { type: "disabled" }`, um Antworten zu vermeiden, die
    das Ausgabebudget für `reasoning_content` vor sichtbarem Text verbrauchen.

    Beibehaltenes Thinking ist optional, da Z.AI verlangt, dass der vollständige historische
    `reasoning_content` erneut wiedergegeben wird, was die Prompt-Tokens erhöht. Aktivieren Sie es
    pro Modell:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "zai/glm-5.1": {
              params: { preserveThinking: true },
            },
          },
        },
      },
    }
    ```

    Wenn es aktiviert und Thinking eingeschaltet ist, sendet OpenClaw
    `thinking: { type: "enabled", clear_thinking: false }` und gibt vorherigen
    `reasoning_content` für dasselbe OpenAI-kompatible Transkript erneut wieder.

    Fortgeschrittene Benutzer können die exakte Provider-Payload weiterhin mit
    `params.extra_body.thinking` überschreiben.

  </Accordion>

  <Accordion title="Bildverständnis">
    Das gebündelte Z.AI-Plugin registriert Bildverständnis.

    | Eigenschaft   | Wert        |
    | ------------- | ----------- |
    | Modell        | `glm-4.6v`  |

    Bildverständnis wird automatisch aus der konfigurierten Z.AI-Authentifizierung aufgelöst;
    zusätzliche Konfiguration ist nicht erforderlich.

  </Accordion>

  <Accordion title="Authentifizierungsdetails">
    - Z.AI verwendet Bearer-Authentifizierung mit Ihrem API-Schlüssel.
    - Die Onboarding-Auswahl `zai-api-key` erkennt den passenden Z.AI-Endpunkt automatisch anhand des Schlüsselpräfixes.
    - Verwenden Sie die expliziten regionalen Auswahlmöglichkeiten (`zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn`), wenn Sie eine bestimmte API-Oberfläche erzwingen möchten.

  </Accordion>
</AccordionGroup>

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="GLM-Modellfamilie" href="/de/providers/glm" icon="microchip">
    Übersicht über die Modellfamilie für GLM.
  </Card>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Provider, Modell-Referenzen und Failover-Verhalten auswählen.
  </Card>
</CardGroup>
