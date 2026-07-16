---
read_when:
    - Sie möchten Z.AI-/GLM-Modelle in OpenClaw verwenden
    - Sie benötigen eine einfache Einrichtung von ZAI_API_KEY
summary: Z.AI (GLM-Modelle) mit OpenClaw verwenden
title: Z.AI
x-i18n:
    generated_at: "2026-07-16T13:31:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 7f7adf0e2f436f9081891013c0092ce4717bf302b2a4a2e997d9561d7d40211a
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
      <Step title="Prüfen, ob das Modell aufgeführt ist">
        ```bash
        openclaw models list --all --provider zai
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Expliziter regionaler Endpunkt">
    **Am besten geeignet für:** Benutzer, die eine bestimmte Coding-Plan- oder allgemeine API-Oberfläche erzwingen möchten.

    <Steps>
      <Step title="Die richtige Onboarding-Auswahl treffen">
        ```bash
        # Coding Plan Global (für Benutzer von Coding Plan empfohlen)
        openclaw onboard --auth-choice zai-coding-global

        # Coding Plan CN (Region China)
        openclaw onboard --auth-choice zai-coding-cn

        # Allgemeine API
        openclaw onboard --auth-choice zai-global

        # Allgemeine API CN (Region China)
        openclaw onboard --auth-choice zai-cn
        ```
      </Step>
      <Step title="Prüfen, ob das Modell aufgeführt ist">
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
| `zai-global`        | `https://api.z.ai/api/paas/v4`                | `glm-5.1`     |
| `zai-cn`            | `https://open.bigmodel.cn/api/paas/v4`        | `glm-5.1`     |
| `zai-coding-global` | `https://api.z.ai/api/coding/paas/v4`         | `glm-5.2`     |
| `zai-coding-cn`     | `https://open.bigmodel.cn/api/coding/paas/v4` | `glm-5.2`     |

`zai-api-key` erkennt automatisch einen dieser vier Endpunkte, indem Ihr Schlüssel mit der
Chat-Completions-API jedes Endpunkts geprüft wird. Dabei werden zuerst die allgemeinen Endpunkte
(`zai-global`, dann `zai-cn`) und anschließend die Coding-Plan-Endpunkte
(`zai-coding-global`, dann `zai-coding-cn`) geprüft. Die Prüfung endet beim ersten Endpunkt,
der eine Anfrage akzeptiert. Verwenden Sie eine explizite Auswahl `--auth-choice`, um einen
Coding-Plan-Endpunkt zu erzwingen, falls Ihr Schlüssel mit beiden funktioniert.

## Ratenbegrenzungen und Überlastungen

Z.AI beschreibt Coding Plan und die universellen Agent-Tools als Dienste mit
verwalteter Kapazität. Laut der Dokumentation von Z.AI:

- [Universelle Agent-Tools](https://docs.z.ai/devpack/tool/others),
  einschließlich OpenClaw, werden nach dem Best-Effort-Prinzip bereitgestellt. Bei hoher
  Inferenzlast, üblicherweise etwa zwischen 14 und 18 Uhr Singapur-Zeit, können einige
  Anfragen vorübergehend von Ratenbegrenzungen betroffen sein.
- [Raten- und Parallelitätsbegrenzungen von Coding Plan](https://docs.z.ai/devpack/usage-policy)
  sind an die Tarifstufe gebunden und können abhängig von der Ressourcenverfügbarkeit
  dynamisch angepasst werden. Außerhalb der Spitzenzeiten kann eine höhere Parallelität verfügbar sein.
- [API-Fehlercode `1302`](https://docs.z.ai/api-reference/api-code) bedeutet „Ratenbegrenzung
  für Anfragen erreicht“. API-Fehlercode `1305` bedeutet „Der Dienst ist möglicherweise
  vorübergehend überlastet. Versuchen Sie es später erneut“.

Wenn während einer Auslastungsphase vorübergehend eine Antwort vom Typ `429` oder
`1305` angezeigt wird, warten Sie und wiederholen Sie die Anfrage. Wenn Fehler
außerhalb der Spitzenzeiten reproduzierbar sind oder nur bei einem Endpunkt, Modell oder
Anfrageformat auftreten, prüfen Sie zuerst den konfigurierten Endpunkt und das Modell:

```bash
openclaw models list --all --provider zai
openclaw config get models.providers.zai.baseUrl
```

Coding-Plan-Schlüssel sollten einen Coding-Plan-Endpunkt wie
`https://api.z.ai/api/coding/paas/v4` verwenden; Schlüssel für die allgemeine API sollten einen
allgemeinen API-Endpunkt wie `https://api.z.ai/api/paas/v4` verwenden. Anhaltende Fehler
mit demselben Schlüssel und Endpunkt können auf eine Ablehnung durch den Provider oder
eine Tarifbeschränkung hindeuten und nicht auf eine gewöhnliche Drosselung aufgrund von Spitzenlast.

## Konfigurationsbeispiel

<Tip>
Mit `zai-api-key` kann OpenClaw anhand des Schlüssels den passenden Z.AI-Endpunkt
erkennen und automatisch die richtige Basis-URL anwenden. Verwenden Sie die expliziten
regionalen Optionen, wenn Sie eine bestimmte Coding-Plan- oder allgemeine API-Oberfläche erzwingen möchten.
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

Das Provider-Plugin `zai` liefert seinen Katalog im Plugin-Manifest aus, sodass
eine schreibgeschützte Auflistung bekannte GLM-Zeilen anzeigen kann, ohne die Provider-Laufzeit zu laden:

```bash
openclaw models list --all --provider zai
```

Der manifestbasierte Katalog enthält derzeit:

| Modellreferenz       | Hinweise                        |
| -------------------- | ------------------------------- |
| `zai/glm-5.2`        | Coding-Plan-Standard; 1M Kontext |
| `zai/glm-5.1`        | Standard der allgemeinen API    |
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

<Note>
Die Einrichtung von Coding Plan verwendet standardmäßig `zai/glm-5.2`; bei der
Einrichtung der allgemeinen API bleibt `zai/glm-5.1` erhalten. An den
Coding-Plan-Endpunkten greift die automatische Erkennung auf `glm-5.1` und
anschließend auf `glm-4.7` zurück, wenn GLM-5.2 für den Schlüssel oder Tarif
nicht verfügbar ist. GLM-Versionen und ihre Verfügbarkeit können sich ändern; führen Sie
`openclaw models list --all --provider zai` aus, um den Ihrer installierten Version bekannten Katalog anzuzeigen.
</Note>

## Denkstufen

<Tabs>
  <Tab title="GLM-5.2">
    Vollständiger Bereich: `off`, `low`, `high`, `max` (Standard: `off`). OpenClaw ordnet
    `low` und `high` dem Reasoning-Aufwand `high` von Z.AI und `max` dem
    Aufwand `max` von Z.AI zu, und zwar über `reasoning_effort` in der Anfragenutzlast.
  </Tab>
  <Tab title="Andere GLM-Modelle">
    Nur binäre Umschaltung: `off` und `low` (in Auswahlfeldern als `on` angezeigt), Standard:
    `off`. Wenn die Denkstufe auf `off` gesetzt wird, wird `thinking: { type: "disabled" }` gesendet;
    bei jeder anderen Stufe bleibt die Anfragenutzlast unverändert (es gilt das
    standardmäßige Reasoning-Verhalten von Z.AI).
  </Tab>
</Tabs>

Das Festlegen der Denkstufe auf `off` verhindert Antworten, die das Ausgabebudget
für `reasoning_content` verbrauchen, bevor sichtbarer Text ausgegeben wird.

## Erweiterte Konfiguration

<AccordionGroup>
  <Accordion title="Unbekannte GLM-5-Modelle vorwärts auflösen">
    Unbekannte IDs vom Typ `glm-5*` werden im Provider-Pfad weiterhin
    vorwärts aufgelöst, indem Provider-eigene Metadaten aus der Vorlage
    `glm-4.7` erzeugt werden, wenn die ID dem aktuellen Format der GLM-5-Familie entspricht.
  </Accordion>

  <Accordion title="Tool-Aufruf-Streaming">
    `tool_stream` ist standardmäßig für das Streaming von Z.AI-Tool-Aufrufen aktiviert. So deaktivieren Sie es:

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

  <Accordion title="Beibehaltenes Denken">
    Beibehaltenes Denken muss ausdrücklich aktiviert werden, da Z.AI die erneute
    Wiedergabe des vollständigen bisherigen `reasoning_content` verlangt, wodurch sich
    die Anzahl der Prompt-Tokens erhöht. Aktivieren Sie es pro Modell:

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

    Wenn diese Option aktiviert und das Denken eingeschaltet ist, sendet OpenClaw
    `thinking: { type: "enabled", clear_thinking: false }` und gibt vorherige
    `reasoning_content` für dasselbe OpenAI-kompatible Transkript erneut wieder. Der
    snake_case-Parameterschlüssel `preserve_thinking` funktioniert als Alias.

    Fortgeschrittene Benutzer können die genaue Provider-Nutzlast weiterhin mit
    `params.extra_body.thinking` überschreiben.

  </Accordion>

  <Accordion title="Bildverständnis">
    Das Z.AI-Plugin registriert Bildverständnis.

    | Eigenschaft | Wert        |
    | ----------- | ----------- |
    | Modell      | `glm-4.6v`  |

    Das Bildverständnis wird automatisch anhand der konfigurierten Z.AI-Authentifizierung
    aufgelöst – es ist keine zusätzliche Konfiguration erforderlich.

  </Accordion>

  <Accordion title="Authentifizierungsdetails">
    - Z.AI verwendet die Bearer-Authentifizierung mit Ihrem API-Schlüssel.
    - Die Onboarding-Auswahl `zai-api-key` erkennt den passenden Z.AI-Endpunkt automatisch, indem unterstützte Endpunkte mit Ihrem Schlüssel geprüft werden.
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
