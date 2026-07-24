---
read_when:
    - Sie möchten Z.AI-/GLM-Modelle in OpenClaw verwenden
    - Sie benötigen eine einfache Einrichtung von ZAI_API_KEY
summary: Z.AI (GLM-Modelle) mit OpenClaw verwenden
title: Z.AI
x-i18n:
    generated_at: "2026-07-24T05:14:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 0ca3e7ef743e908550f4d96ba6f78167e38cabd15b14044683b02493ebbf3025
    source_path: providers/zai.md
    workflow: 16
---

Z.AI ist die API-Plattform für **GLM**-Modelle. Sie stellt REST-APIs für GLM bereit und
verwendet API-Schlüssel zur Authentifizierung. Erstellen Sie Ihren API-Schlüssel in der Z.AI-Konsole.
OpenClaw verwendet den Provider `zai` mit einem Z.AI-API-Schlüssel.

| Eigenschaft | Wert                                        |
| -------- | -------------------------------------------- |
| Provider | `zai`                                        |
| Paket  | `@openclaw/zai-provider`                     |
| Authentifizierung     | `ZAI_API_KEY` (veralteter Alias: `Z_AI_API_KEY`) |
| API      | Z.AI Chat Completions (Bearer-Authentifizierung)          |

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
        # Coding Plan Global (für Coding-Plan-Benutzer empfohlen)
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

| Onboarding-Auswahl   | Basis-URL                                      | Standardmodell |
| ------------------- | --------------------------------------------- | ------------- |
| `zai-global`        | `https://api.z.ai/api/paas/v4`                | `glm-5.1`     |
| `zai-cn`            | `https://open.bigmodel.cn/api/paas/v4`        | `glm-5.1`     |
| `zai-coding-global` | `https://api.z.ai/api/coding/paas/v4`         | `glm-5.2`     |
| `zai-coding-cn`     | `https://open.bigmodel.cn/api/coding/paas/v4` | `glm-5.2`     |

Z.AI veröffentlicht außerdem die Anthropic-kompatible Coding-Plan-Basis-URL
`https://api.z.ai/api/anthropic`. Die Z.AI-Auswahlmöglichkeiten von OpenClaw verwenden die oben dokumentierten
OpenAI-Chat-Completions-Endpunkte; die Anthropic-URL ist für Clients vorgesehen, die
direkt über Anthropic Messages kommunizieren.

`zai-api-key` erkennt automatisch einen dieser vier Endpunkte, indem Ihr Schlüssel mit der jeweiligen
Chat-Completions-API des Endpunkts geprüft wird. Dabei werden zuerst die allgemeinen Endpunkte (`zai-global`,
dann `zai-cn`) und anschließend die Coding-Plan-Endpunkte (`zai-coding-global`, dann
`zai-coding-cn`) geprüft. Die Prüfung endet beim ersten Endpunkt, der eine Anfrage akzeptiert.
Verwenden Sie eine explizite Auswahl vom Typ `--auth-choice`, um einen Coding-Plan-Endpunkt zu erzwingen, wenn Ihr Schlüssel
für beide funktioniert.

## Ratenlimits und Überlastungen

Z.AI beschreibt den Coding Plan und die universellen Agent-Tools als Dienste mit
verwalteter Kapazität. Laut der Z.AI-Dokumentation:

- [Universelle Agent-Tools](https://docs.z.ai/devpack/tool/others),
  einschließlich OpenClaw, werden nach dem Best-Effort-Prinzip bereitgestellt. Bei hoher Inferenzlast,
  üblicherweise etwa zwischen 14 und 18 Uhr Singapur-Zeit, können einige Anfragen vorübergehend
  Ratenlimits unterliegen.
- [Raten- und Parallelitätslimits des Coding Plan](https://docs.z.ai/devpack/usage-policy)
  sind an die Tarifstufe gebunden und können abhängig von der Ressourcenverfügbarkeit
  dynamisch angepasst werden. Außerhalb der Spitzenzeiten kann eine höhere Parallelität verfügbar sein.
- [API-Fehlercode `1302`](https://docs.z.ai/api-reference/api-code) bedeutet „Ratenlimit
  für Anfragen erreicht“. API-Fehlercode `1305` bedeutet „Der Dienst ist möglicherweise
  vorübergehend überlastet. Versuchen Sie es später erneut“.

Wenn während einer stark ausgelasteten Phase vorübergehend eine Antwort vom Typ `429` oder `1305` angezeigt wird, warten Sie und
wiederholen Sie die Anfrage. Wenn Fehler außerhalb der Spitzenzeiten reproduzierbar sind oder nur
bei einem bestimmten Endpunkt, Modell oder Anfrageformat auftreten, prüfen Sie zuerst den konfigurierten Endpunkt
und das Modell:

```bash
openclaw models list --all --provider zai
openclaw config get models.providers.zai.baseUrl
```

Coding-Plan-Schlüssel sollten einen Coding-Plan-Endpunkt wie
`https://api.z.ai/api/coding/paas/v4` verwenden; allgemeine API-Schlüssel sollten einen allgemeinen API-Endpunkt
wie `https://api.z.ai/api/paas/v4` verwenden. Anhaltende Fehler mit demselben
Schlüssel und Endpunkt können auf eine Ablehnung durch den Provider oder eine Tarifbeschränkung hindeuten,
nicht auf die gewöhnliche Drosselung bei Spitzenlast.

## Konfigurationsbeispiel

<Tip>
Mit `zai-api-key` kann OpenClaw den zum Schlüssel passenden Z.AI-Endpunkt erkennen und
automatisch die richtige Basis-URL anwenden. Verwenden Sie die expliziten regionalen Auswahlmöglichkeiten, wenn
Sie eine bestimmte Coding-Plan- oder allgemeine API-Oberfläche erzwingen möchten.
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

Das Provider-Plugin `zai` liefert seinen Katalog im Plugin-Manifest aus, sodass die schreibgeschützte
Auflistung bekannte GLM-Zeilen anzeigen kann, ohne die Provider-Laufzeit zu laden:

```bash
openclaw models list --all --provider zai
```

Der manifestgestützte Katalog enthält derzeit:

| Modellreferenz            | Hinweise                           |
| -------------------- | ------------------------------- |
| `zai/glm-5.2`        | Coding-Plan-Standard; 1M Kontext |
| `zai/glm-5.1`        | Standard der allgemeinen API             |
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

Die Metadaten zu Token-Kosten im Katalog basieren auf den aktuellen
[nutzungsabhängigen Preisen](https://docs.z.ai/guides/overview/pricing) von Z.AI. Coding-Plan-
Abonnements verwenden ein Tarifkontingent anstelle einer Abrechnung pro Token; aktuelle Tarifpreise und deren Verfügbarkeit finden Sie auf der
[Abonnementseite](https://z.ai/subscribe).

<Tip>
GLM-Modelle sind als `zai/<model>` verfügbar (Beispiel: `zai/glm-5`).
</Tip>

<Note>
Die Coding-Plan-Einrichtung verwendet standardmäßig `zai/glm-5.2`; bei der Einrichtung der allgemeinen API bleibt
`zai/glm-5.1` erhalten. An den Coding-Plan-Endpunkten greift die automatische Erkennung auf
`glm-5.1` und anschließend `glm-4.7` zurück, wenn der Schlüssel oder Tarif GLM-5.2 nicht bereitstellt. GLM-
Versionen und Verfügbarkeit können sich ändern; führen Sie `openclaw models list --all --provider zai` aus,
um den Ihrer installierten Version bekannten Katalog anzuzeigen.
</Note>

## Thinking-Stufen

<Tabs>
  <Tab title="GLM-5.2">
    Vollständiger Bereich: `off`, `low`, `high`, `max` (Standard: `off`). OpenClaw ordnet
    `low` und `high` dem Reasoning-Aufwand `high` von Z.AI und `max` dem
    Aufwand `max` von Z.AI zu, und zwar über `reasoning_effort` in der Anfrage-Nutzlast.
  </Tab>
  <Tab title="Andere GLM-Modelle">
    Nur binäre Umschaltung: `off` und `low` (in Auswahlfeldern als `on` dargestellt), Standard:
    `off`. Wenn Thinking auf `off` gesetzt wird, wird `thinking: { type: "disabled" }` gesendet;
    bei jeder anderen Stufe bleibt die Anfrage-Nutzlast unverändert (das eigene standardmäßige
    Reasoning-Verhalten von Z.AI gilt).
  </Tab>
</Tabs>

Wenn Thinking auf `off` gesetzt wird, werden Antworten vermieden, die das Ausgabebudget für
`reasoning_content` aufbrauchen, bevor sichtbarer Text ausgegeben wird.

## Erweiterte Konfiguration

<AccordionGroup>
  <Accordion title="Unbekannte GLM-5-Modelle vorwärts auflösen">
    Unbekannte IDs vom Typ `glm-5*` werden im Provider-Pfad weiterhin vorwärts aufgelöst, indem
    vom Provider verwaltete Metadaten aus der Vorlage `glm-4.7` synthetisiert werden, wenn die ID
    dem aktuellen Format der GLM-5-Familie entspricht.
  </Accordion>

  <Accordion title="Tool-Aufruf-Streaming">
    `tool_stream` ist für das Tool-Aufruf-Streaming von Z.AI standardmäßig aktiviert. So deaktivieren Sie es:

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
    Das Beibehalten von Thinking muss explizit aktiviert werden, da Z.AI erfordert, dass der vollständige historische
    Wert `reasoning_content` erneut wiedergegeben wird, wodurch sich die Anzahl der Prompt-Token erhöht. Aktivieren Sie es
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

    Wenn die Funktion aktiviert und Thinking eingeschaltet ist, sendet OpenClaw
    `thinking: { type: "enabled", clear_thinking: false }` und gibt frühere
    `reasoning_content` für dasselbe OpenAI-kompatible Transkript erneut wieder. Der Parameter-
    schlüssel `preserve_thinking` in snake_case funktioniert als Alias.

    Fortgeschrittene Benutzer können die genaue Provider-Nutzlast weiterhin mit
    `params.extra_body.thinking` überschreiben.

  </Accordion>

  <Accordion title="Bildverständnis">
    Das Z.AI-Plugin registriert Bildverständnis.

    | Eigenschaft      | Wert       |
    | ------------- | ----------- |
    | Modell         | `glm-4.6v`  |

    Das Bildverständnis wird automatisch anhand der konfigurierten Z.AI-Authentifizierung aufgelöst – es ist keine
    zusätzliche Konfiguration erforderlich.

  </Accordion>

  <Accordion title="Authentifizierungsdetails">
    - Z.AI verwendet die Bearer-Authentifizierung mit Ihrem API-Schlüssel.
    - Die Onboarding-Auswahl `zai-api-key` erkennt automatisch den passenden Z.AI-Endpunkt, indem unterstützte Endpunkte mit Ihrem Schlüssel geprüft werden.
    - Verwenden Sie die expliziten regionalen Auswahlmöglichkeiten (`zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn`), wenn Sie eine bestimmte API-Oberfläche erzwingen möchten.
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
