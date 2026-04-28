---
read_when:
    - Sie möchten Z.AI-/GLM-Modelle in OpenClaw verwenden
    - Sie benötigen ein einfaches Setup mit `ZAI_API_KEY`
summary: Z.AI (GLM-Modelle) mit OpenClaw verwenden
title: Z.AI
x-i18n:
    generated_at: "2026-04-26T11:38:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5e2935aae04850539f46908fcbfc12111eac3ebbd963244e6347165afdd14bc5
    source_path: providers/zai.md
    workflow: 15
---

Z.AI ist die API-Plattform für **GLM**-Modelle. Sie stellt REST-APIs für GLM bereit und verwendet API-Schlüssel
für die Authentifizierung. Erstellen Sie Ihren API-Schlüssel in der Z.AI-Konsole. OpenClaw verwendet den Provider `zai`
mit einem Z.AI-API-Schlüssel.

- Provider: `zai`
- Auth: `ZAI_API_KEY`
- API: Z.AI Chat Completions (Bearer-Authentifizierung)

## Erste Schritte

<Tabs>
  <Tab title="Endpunkt automatisch erkennen">
    **Am besten für:** die meisten Benutzer. OpenClaw erkennt den passenden Z.AI-Endpunkt anhand des Schlüssels und setzt automatisch die korrekte `baseUrl`.

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
    **Am besten für:** Benutzer, die einen bestimmten Coding Plan oder eine bestimmte allgemeine API-Oberfläche erzwingen möchten.

    <Steps>
      <Step title="Die richtige Onboarding-Option auswählen">
        ```bash
        # Coding Plan Global (empfohlen für Benutzer von Coding Plan)
        openclaw onboard --auth-choice zai-coding-global

        # Coding Plan CN (Region China)
        openclaw onboard --auth-choice zai-coding-cn

        # Allgemeine API
        openclaw onboard --auth-choice zai-global

        # Allgemeine API CN (Region China)
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

OpenClaw initialisiert den gebündelten Provider `zai` derzeit mit:

| Modellreferenz       | Hinweise        |
| -------------------- | --------------- |
| `zai/glm-5.1`        | Standardmodell  |
| `zai/glm-5`          |                 |
| `zai/glm-5-turbo`    |                 |
| `zai/glm-5v-turbo`   |                 |
| `zai/glm-4.7`        |                 |
| `zai/glm-4.7-flash`  |                 |
| `zai/glm-4.7-flashx` |                 |
| `zai/glm-4.6`        |                 |
| `zai/glm-4.6v`       |                 |
| `zai/glm-4.5`        |                 |
| `zai/glm-4.5-air`    |                 |
| `zai/glm-4.5-flash`  |                 |
| `zai/glm-4.5v`       |                 |

<Tip>
GLM-Modelle sind als `zai/<model>` verfügbar (Beispiel: `zai/glm-5`). Die standardmäßige gebündelte Modellreferenz ist `zai/glm-5.1`.
</Tip>

## Erweiterte Konfiguration

<AccordionGroup>
  <Accordion title="Unbekannte GLM-5-Modelle vorwärts auflösen">
    Unbekannte `glm-5*`-IDs werden auf dem Pfad des gebündelten Providers weiterhin vorwärts aufgelöst,
    indem provider-eigene Metadaten aus der Vorlage `glm-4.7` synthetisiert werden, wenn die ID
    der aktuellen Form der GLM-5-Familie entspricht.
  </Accordion>

  <Accordion title="Tool-Call-Streaming">
    `tool_stream` ist standardmäßig für Z.AI-Tool-Call-Streaming aktiviert. Zum Deaktivieren:

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
    Z.AI-Thinking folgt den `/think`-Steuerelementen von OpenClaw. Wenn Thinking deaktiviert ist,
    sendet OpenClaw `thinking: { type: "disabled" }`, um Antworten zu vermeiden, die
    das Ausgabebudget für `reasoning_content` vor sichtbarem Text verbrauchen.

    Beibehaltenes Thinking ist Opt-in, da Z.AI verlangt, dass der vollständige historische
    `reasoning_content` erneut abgespielt wird, was die Prompt-Token erhöht. Aktivieren Sie es
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

    Wenn es aktiviert ist und Thinking eingeschaltet ist, sendet OpenClaw
    `thinking: { type: "enabled", clear_thinking: false }` und spielt früheren
    `reasoning_content` für dasselbe OpenAI-kompatible Transkript erneut ab.

    Fortgeschrittene Benutzer können die exakte Provider-Payload weiterhin mit
    `params.extra_body.thinking` überschreiben.

  </Accordion>

  <Accordion title="Bildverständnis">
    Das gebündelte Z.AI Plugin registriert Bildverständnis.

    | Eigenschaft   | Wert        |
    | ------------- | ----------- |
    | Modell        | `glm-4.6v`  |

    Bildverständnis wird automatisch aus der konfigurierten Z.AI-Authentifizierung aufgelöst — zusätzliche
    Konfiguration ist nicht erforderlich.

  </Accordion>

  <Accordion title="Authentifizierungsdetails">
    - Z.AI verwendet Bearer-Authentifizierung mit Ihrem API-Schlüssel.
    - Die Onboarding-Option `zai-api-key` erkennt den passenden Z.AI-Endpunkt automatisch anhand des Schlüsselpfixes.
    - Verwenden Sie die expliziten regionalen Optionen (`zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn`), wenn Sie eine bestimmte API-Oberfläche erzwingen möchten.

  </Accordion>
</AccordionGroup>

## Verwandt

<CardGroup cols={2}>
  <Card title="GLM-Modellfamilie" href="/de/providers/glm" icon="microchip">
    Überblick über die Modellfamilie für GLM.
  </Card>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Auswahl von Providern, Modellreferenzen und Failover-Verhalten.
  </Card>
</CardGroup>
