---
read_when:
    - Sie möchten Z.AI-/GLM-Modelle in OpenClaw verwenden
    - Sie benötigen eine einfache Einrichtung von ZAI_API_KEY
summary: Z.AI (GLM-Modelle) mit OpenClaw verwenden
title: Z.AI
x-i18n:
    generated_at: "2026-05-02T06:44:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 423fc2bc27c62352d9d9acd13c70aa2bc3804112dab25aa46505e844cb166c93
    source_path: providers/zai.md
    workflow: 16
---

Z.AI ist die API-Plattform für **GLM**-Modelle. Sie stellt REST-APIs für GLM bereit und verwendet API-Schlüssel
für die Authentifizierung. Erstellen Sie Ihren API-Schlüssel in der Z.AI-Konsole. OpenClaw verwendet den `zai`-Provider
mit einem Z.AI-API-Schlüssel.

- Provider: `zai`
- Authentifizierung: `ZAI_API_KEY`
- API: Z.AI Chat Completions (Bearer-Authentifizierung)

## Erste Schritte

<Tabs>
  <Tab title="Endpoint automatisch erkennen">
    **Am besten für:** die meisten Nutzer. OpenClaw erkennt den passenden Z.AI-Endpoint aus dem Schlüssel und wendet automatisch die richtige Basis-URL an.

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
      <Step title="Prüfen, ob das Modell aufgelistet ist">
        ```bash
        openclaw models list --all --provider zai
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Expliziter regionaler Endpoint">
    **Am besten für:** Nutzer, die einen bestimmten Coding Plan oder eine allgemeine API-Oberfläche erzwingen möchten.

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
      <Step title="Prüfen, ob das Modell aufgelistet ist">
        ```bash
        openclaw models list --all --provider zai
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## Integrierter Katalog

OpenClaw liefert den gebündelten `zai`-Provider-Katalog im Plugin-Manifest aus, sodass schreibgeschützte
Auflistungen bekannte GLM-Zeilen anzeigen können, ohne die Provider-Laufzeit zu laden:

```bash
openclaw models list --all --provider zai
```

Der manifestgestützte Katalog enthält derzeit:

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
GLM-Modelle sind als `zai/<model>` verfügbar (Beispiel: `zai/glm-5`). Die standardmäßig gebündelte Modellreferenz ist `zai/glm-5.1`.
</Tip>

## Erweiterte Konfiguration

<AccordionGroup>
  <Accordion title="Unbekannte GLM-5-Modelle vorwärtsauflösen">
    Unbekannte `glm-5*`-IDs werden im gebündelten Provider-Pfad weiterhin vorwärtsaufgelöst, indem
    Provider-eigene Metadaten aus der `glm-4.7`-Vorlage synthetisiert werden, wenn die ID
    der aktuellen Form der GLM-5-Familie entspricht.
  </Accordion>

  <Accordion title="Tool-Call-Streaming">
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

  <Accordion title="Thinking und beibehaltenes Thinking">
    Z.AI-Thinking folgt den `/think`-Steuerungen von OpenClaw. Wenn Thinking ausgeschaltet ist,
    sendet OpenClaw `thinking: { type: "disabled" }`, um Antworten zu vermeiden, die
    das Ausgabebudget für `reasoning_content` vor sichtbarem Text verbrauchen.

    Beibehaltenes Thinking ist Opt-in, da Z.AI verlangt, dass der vollständige historische
    `reasoning_content` erneut abgespielt wird, was die Prompt-Tokens erhöht. Aktivieren Sie es
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
    `thinking: { type: "enabled", clear_thinking: false }` und spielt vorherigen
    `reasoning_content` für dasselbe OpenAI-kompatible Transkript erneut ab.

    Fortgeschrittene Nutzer können die exakte Provider-Payload weiterhin mit
    `params.extra_body.thinking` überschreiben.

  </Accordion>

  <Accordion title="Bildverständnis">
    Das gebündelte Z.AI-Plugin registriert Bildverständnis.

    | Eigenschaft   | Wert        |
    | ------------- | ----------- |
    | Modell        | `glm-4.6v`  |

    Bildverständnis wird automatisch aus der konfigurierten Z.AI-Authentifizierung aufgelöst;
    es ist keine zusätzliche Konfiguration erforderlich.

  </Accordion>

  <Accordion title="Authentifizierungsdetails">
    - Z.AI verwendet Bearer-Authentifizierung mit Ihrem API-Schlüssel.
    - Die Onboarding-Auswahl `zai-api-key` erkennt den passenden Z.AI-Endpoint automatisch aus dem Schlüsselpräfix.
    - Verwenden Sie die expliziten regionalen Auswahlen (`zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn`), wenn Sie eine bestimmte API-Oberfläche erzwingen möchten.

  </Accordion>
</AccordionGroup>

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="GLM-Modellfamilie" href="/de/providers/glm" icon="microchip">
    Überblick über die Modellfamilie für GLM.
  </Card>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Provider, Modellreferenzen und Failover-Verhalten auswählen.
  </Card>
</CardGroup>
