---
read_when:
    - Sie möchten Z.AI-/GLM-Modelle in OpenClaw verwenden
    - Sie benötigen eine einfache Einrichtung für `ZAI_API_KEY`
summary: Z.AI (GLM-Modelle) mit OpenClaw verwenden
title: Z.AI
x-i18n:
    generated_at: "2026-07-12T15:56:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: ab29149da39cbf82fe041ea5932a860c461320e14bf26f83f69060d7ae0ae00a
    source_path: providers/zai.md
    workflow: 16
---

  Z.AI ist die API-Plattform für **GLM**-Modelle. Sie stellt REST-APIs für GLM bereit und
  verwendet API-Schlüssel zur Authentifizierung. Erstellen Sie Ihren API-Schlüssel in der Z.AI-Konsole.
  OpenClaw verwendet den Provider `zai` mit einem Z.AI-API-Schlüssel.

  | Eigenschaft | Wert                                         |
  | ----------- | -------------------------------------------- |
  | Provider    | `zai`                                        |
  | Paket       | `@openclaw/zai-provider`                     |
  | Authentifizierung | `ZAI_API_KEY` (veralteter Alias: `Z_AI_API_KEY`) |
  | API         | Z.AI Chat Completions (Bearer-Authentifizierung) |

  ## GLM-Modelle

  GLM ist eine Modellfamilie, kein separater Provider. In OpenClaw verwenden GLM-Modelle
  Referenzen wie `zai/glm-5.2`: Provider `zai`, Modell-ID `glm-5.2`.

  ## Erste Schritte

  Installieren Sie zuerst das Provider-Plugin:

  ```bash
  openclaw plugins install @openclaw/zai-provider
  ```

  <Tabs>
  <Tab title="Endpunkt automatisch erkennen">
    **Am besten geeignet für:** die meisten Benutzer. OpenClaw prüft unterstützte Z.AI-Endpunkte mit Ihrem API-Schlüssel und wendet automatisch die richtige Basis-URL an.

    <Steps>
      <Step title="Onboarding ausführen">
        ```bash
        openclaw onboard --auth-choice zai-api-key
        ```
      </Step>
      <Step title="Überprüfen, ob das Modell aufgeführt ist">
        ```bash
        openclaw models list --all --provider zai
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Expliziter regionaler Endpunkt">
    **Am besten geeignet für:** Benutzer, die einen bestimmten Coding Plan oder eine allgemeine API-Oberfläche erzwingen möchten.

    <Steps>
      <Step title="Wählen Sie die richtige Onboarding-Option">
        ```bash
        # Coding Plan Global (empfohlen für Coding-Plan-Benutzer)
        openclaw onboard --auth-choice zai-coding-global

        # Coding Plan CN (Region China)
        openclaw onboard --auth-choice zai-coding-cn

        # Allgemeine API
        openclaw onboard --auth-choice zai-global

        # Allgemeine API CN (Region China)
        openclaw onboard --auth-choice zai-cn
        ```
      </Step>
      <Step title="Überprüfen Sie, ob das Modell aufgeführt ist">
        ```bash
        openclaw models list --all --provider zai
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

### Endpunkte

| Onboarding-Auswahl  | Basis-URL                                     | Standardmodell |
| ------------------- | --------------------------------------------- | -------------- |
| `zai-global`        | `https://api.z.ai/api/paas/v4`                | `glm-5.1`      |
| `zai-cn`            | `https://open.bigmodel.cn/api/paas/v4`        | `glm-5.1`      |
| `zai-coding-global` | `https://api.z.ai/api/coding/paas/v4`         | `glm-5.2`      |
| `zai-coding-cn`     | `https://open.bigmodel.cn/api/coding/paas/v4` | `glm-5.2`      |

`zai-api-key` erkennt automatisch eine dieser vier Optionen, indem Ihr Schlüssel
an der Chat-Completions-API jedes Endpunkts geprüft wird. Dabei werden zuerst
die allgemeinen Endpunkte (`zai-global`, dann `zai-cn`) und anschließend die
Coding-Plan-Endpunkte (`zai-coding-global`, dann `zai-coding-cn`) geprüft. Die
Prüfung endet beim ersten Endpunkt, der eine Anfrage akzeptiert. Verwenden Sie
eine explizite Option `--auth-choice`, um einen Coding-Plan-Endpunkt zu erzwingen,
wenn Ihr Schlüssel mit beiden funktioniert.

## Konfigurationsbeispiel

<Tip>
Mit `zai-api-key` kann OpenClaw anhand des Schlüssels den passenden Z.AI-Endpunkt erkennen und
automatisch die richtige Basis-URL anwenden. Verwenden Sie die expliziten regionalen Optionen, wenn
Sie einen bestimmten Coding Plan oder eine bestimmte allgemeine API-Oberfläche erzwingen möchten.
</Tip>

```json5
{
  env: { ZAI_API_KEY: "sk-..." },
  models: {
    providers: {
      zai: {
        // GLM-5.2 verwendet den Coding-Plan-Endpunkt.
        baseUrl: "https://api.z.ai/api/coding/paas/v4",
      },
    },
  },
  agents: { defaults: { model: { primary: "zai/glm-5.2" } } },
}
```

## Integrierter Katalog

Das `zai`-Provider-Plugin liefert seinen Katalog im Plugin-Manifest mit, sodass bei einer schreibgeschützten
Auflistung bekannte GLM-Zeilen angezeigt werden können, ohne die Provider-Laufzeit zu laden:

```bash
openclaw models list --all --provider zai
```

Der durch das Manifest bereitgestellte Katalog umfasst derzeit:

| Modellreferenz       | Hinweise                                |
| -------------------- | --------------------------------------- |
| `zai/glm-5.2`        | Standard für Coding Plan; 1M Kontext    |
| `zai/glm-5.1`        | Standard für die allgemeine API         |
| `zai/glm-5`          |                                         |
| `zai/glm-5-turbo`    |                                         |
| `zai/glm-5v-turbo`   |                                         |
| `zai/glm-4.7`        |                                         |
| `zai/glm-4.7-flash`  |                                         |
| `zai/glm-4.7-flashx` |                                         |
| `zai/glm-4.6`        |                                         |
| `zai/glm-4.6v`       |                                         |
| `zai/glm-4.5`        |                                         |
| `zai/glm-4.5-air`    |                                         |
| `zai/glm-4.5-flash`  |                                         |
| `zai/glm-4.5v`       |                                         |

<Tip>
GLM-Modelle sind als `zai/<model>` verfügbar (Beispiel: `zai/glm-5`).
</Tip>

<Note>
Die Einrichtung des Coding Plan verwendet standardmäßig `zai/glm-5.2`; bei der Einrichtung der allgemeinen API bleibt
`zai/glm-5.1` erhalten. An den Coding-Plan-Endpunkten greift die automatische Erkennung auf
`glm-5.1` und anschließend auf `glm-4.7` zurück, wenn der Schlüssel bzw. Plan GLM-5.2 nicht bereitstellt. GLM-
Versionen und ihre Verfügbarkeit können sich ändern; führen Sie `openclaw models list --all --provider zai`
aus, um den Katalog anzuzeigen, der Ihrer installierten Version bekannt ist.
</Note>

## Thinking-Stufen

<Tabs>
  <Tab title="GLM-5.2">
    Vollständiger Bereich: `off`, `low`, `high`, `max` (Standard: `off`). OpenClaw ordnet
    `low` und `high` dem Reasoning-Aufwand `high` von Z.AI und `max` dem
    Aufwand `max` von Z.AI zu, und zwar über `reasoning_effort` in der Anfrage-Payload.
  </Tab>
  <Tab title="Andere GLM-Modelle">
    Nur binäre Umschaltung: `off` und `low` (in Auswahllisten als `on` angezeigt), Standard:
    `off`. Wenn Thinking auf `off` gesetzt wird, wird `thinking: { type: "disabled" }` gesendet;
    bei jeder anderen Stufe bleibt die Anfrage-Payload unverändert (das standardmäßige
    Reasoning-Verhalten von Z.AI gilt).
  </Tab>
</Tabs>

Wenn Thinking auf `off` gesetzt wird, werden Antworten vermieden, die das Ausgabebudget für
`reasoning_content` aufbrauchen, bevor sichtbarer Text erscheint.

## Erweiterte Konfiguration

<AccordionGroup>
  <Accordion title="Vorwärtsauflösung unbekannter GLM-5-Modelle">
    Unbekannte `glm-5*`-IDs werden im Provider-Pfad weiterhin vorwärtsaufgelöst, indem
    Provider-eigene Metadaten aus der Vorlage `glm-4.7` synthetisiert werden, wenn die ID
    der aktuellen Form der GLM-5-Familie entspricht.
  </Accordion>

  <Accordion title="Streaming von Tool-Aufrufen">
    `tool_stream` ist für das Streaming von Z.AI-Tool-Aufrufen standardmäßig aktiviert. So deaktivieren Sie es:

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

  <Accordion title="Beibehaltenes Thinking">
    Das Beibehalten von Thinking ist optional, da Z.AI die Wiedergabe des vollständigen historischen
    `reasoning_content` erfordert, wodurch sich die Anzahl der Prompt-Tokens erhöht. Aktivieren Sie es
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

    Wenn es aktiviert und Thinking eingeschaltet ist, sendet OpenClaw
    `thinking: { type: "enabled", clear_thinking: false }` und gibt vorheriges
    `reasoning_content` für dasselbe OpenAI-kompatible Transkript wieder. Der Parameter-Schlüssel in Snake Case
    `preserve_thinking` funktioniert als Alias.

    Fortgeschrittene Benutzer können die genaue Provider-Payload weiterhin mit
    `params.extra_body.thinking` überschreiben.

  </Accordion>

  <Accordion title="Bildverständnis">
    Das Z.AI-Plugin registriert Bildverständnis.

    | Eigenschaft   | Wert        |
    | ------------- | ----------- |
    | Modell        | `glm-4.6v`  |

    Das Bildverständnis wird automatisch anhand der konfigurierten Z.AI-Authentifizierung aufgelöst —
    es ist keine zusätzliche Konfiguration erforderlich.

  </Accordion>

  <Accordion title="Authentifizierungsdetails">
    - Z.AI verwendet Bearer-Authentifizierung mit Ihrem API-Schlüssel.
    - Die Onboarding-Auswahl `zai-api-key` erkennt automatisch den passenden Z.AI-Endpunkt, indem unterstützte Endpunkte mit Ihrem Schlüssel geprüft werden.
    - Verwenden Sie die expliziten regionalen Optionen (`zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn`), wenn Sie eine bestimmte API-Oberfläche erzwingen möchten.
    - Die veraltete Umgebungsvariable `Z_AI_API_KEY` wird weiterhin akzeptiert; OpenClaw kopiert sie beim Start nach `ZAI_API_KEY`, wenn `ZAI_API_KEY` nicht gesetzt ist.

  </Accordion>
</AccordionGroup>

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Auswahl von Providern, Modellreferenzen und Failover-Verhalten.
  </Card>
  <Card title="Konfigurationsreferenz" href="/de/gateway/configuration-reference" icon="gear">
    Vollständiges OpenClaw-Konfigurationsschema einschließlich Provider- und Modelleinstellungen.
  </Card>
</CardGroup>
