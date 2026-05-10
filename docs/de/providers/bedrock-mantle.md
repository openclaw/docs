---
read_when:
    - Sie möchten von Bedrock Mantle gehostete OSS-Modelle mit OpenClaw verwenden
    - Sie benötigen den OpenAI-kompatiblen Mantle-Endpunkt für GPT-OSS, Qwen, Kimi oder GLM
summary: Amazon Bedrock Mantle-Modelle (OpenAI-kompatibel) mit OpenClaw verwenden
title: Amazon Bedrock-Mantel
x-i18n:
    generated_at: "2026-05-10T19:48:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 721eef5b7ff606b8c5e02234dae1b8d846b43ff9f3d7bf871f701bb3136fec0e
    source_path: providers/bedrock-mantle.md
    workflow: 16
---

OpenClaw enthält einen gebündelten **Amazon Bedrock Mantle**-Provider, der eine Verbindung zum OpenAI-kompatiblen Mantle-Endpunkt herstellt. Mantle hostet Open-Source- und Drittanbietermodelle (GPT-OSS, Qwen, Kimi, GLM und ähnliche) über eine standardmäßige `/v1/chat/completions`-Oberfläche, die von Bedrock-Infrastruktur unterstützt wird.

| Eigenschaft    | Wert                                                                                                   |
| -------------- | ------------------------------------------------------------------------------------------------------ |
| Provider-ID    | `amazon-bedrock-mantle`                                                                                |
| API            | `openai-completions` (OpenAI-kompatibel) oder `anthropic-messages` (Anthropic-Messages-Route)          |
| Auth           | Explizites `AWS_BEARER_TOKEN_BEDROCK` oder Bearer-Token-Generierung über die IAM-Anmeldedatenkette     |
| Standardregion | `us-east-1` (mit `AWS_REGION` oder `AWS_DEFAULT_REGION` überschreiben)                                 |

## Erste Schritte

Wählen Sie Ihre bevorzugte Authentifizierungsmethode und folgen Sie den Einrichtungsschritten.

<Tabs>
  <Tab title="Explizites Bearer-Token">
    **Am besten geeignet für:** Umgebungen, in denen Sie bereits ein Mantle-Bearer-Token haben.

    <Steps>
      <Step title="Bearer-Token auf dem Gateway-Host setzen">
        ```bash
        export AWS_BEARER_TOKEN_BEDROCK="..."
        ```

        Optional können Sie eine Region festlegen (Standard ist `us-east-1`):

        ```bash
        export AWS_REGION="us-west-2"
        ```
      </Step>
      <Step title="Überprüfen, ob Modelle erkannt werden">
        ```bash
        openclaw models list
        ```

        Erkannte Modelle erscheinen unter dem Provider `amazon-bedrock-mantle`. Es ist keine zusätzliche Konfiguration erforderlich, sofern Sie keine Standardwerte überschreiben möchten.
      </Step>
    </Steps>

  </Tab>

  <Tab title="IAM-Anmeldedaten">
    **Am besten geeignet für:** die Verwendung AWS-SDK-kompatibler Anmeldedaten (gemeinsame Konfiguration, SSO, Web Identity, Instanz- oder Task-Rollen).

    <Steps>
      <Step title="AWS-Anmeldedaten auf dem Gateway-Host konfigurieren">
        Jede AWS-SDK-kompatible Authentifizierungsquelle funktioniert:

        ```bash
        export AWS_PROFILE="default"
        export AWS_REGION="us-west-2"
        ```
      </Step>
      <Step title="Überprüfen, ob Modelle erkannt werden">
        ```bash
        openclaw models list
        ```

        OpenClaw generiert automatisch ein Mantle-Bearer-Token aus der Anmeldedatenkette.
      </Step>
    </Steps>

    <Tip>
    Wenn `AWS_BEARER_TOKEN_BEDROCK` nicht gesetzt ist, erstellt OpenClaw das Bearer-Token für Sie aus der AWS-Standardanmeldedatenkette, einschließlich gemeinsamer Anmeldedaten-/Konfigurationsprofile, SSO, Web Identity sowie Instanz- oder Task-Rollen.
    </Tip>

  </Tab>
</Tabs>

## Automatische Modellerkennung

Wenn `AWS_BEARER_TOKEN_BEDROCK` gesetzt ist, verwendet OpenClaw es direkt. Andernfalls versucht OpenClaw, ein Mantle-Bearer-Token aus der AWS-Standardanmeldedatenkette zu generieren. Anschließend werden verfügbare Mantle-Modelle durch Abfragen des `/v1/models`-Endpunkts der Region erkannt.

| Verhalten       | Detail                            |
| --------------- | --------------------------------- |
| Discovery-Cache | Ergebnisse werden 1 Stunde gecacht |
| IAM-Token-Aktualisierung | Stündlich                 |

Um das Mantle-Plugin aktiviert zu lassen, aber die automatische Erkennung und die IAM-Bearer-Token-Generierung zu unterdrücken, deaktivieren Sie den Plugin-eigenen Discovery-Schalter:

```bash
openclaw config set plugins.entries.amazon-bedrock-mantle.config.discovery.enabled false
```

<Note>
Das Bearer-Token ist dasselbe `AWS_BEARER_TOKEN_BEDROCK`, das vom standardmäßigen [Amazon Bedrock](/de/providers/bedrock)-Provider verwendet wird.
</Note>

### Unterstützte Regionen

`us-east-1`, `us-east-2`, `us-west-2`, `ap-northeast-1`,
`ap-south-1`, `ap-southeast-3`, `eu-central-1`, `eu-west-1`, `eu-west-2`,
`eu-south-1`, `eu-north-1`, `sa-east-1`.

## Manuelle Konfiguration

Wenn Sie eine explizite Konfiguration statt automatischer Erkennung bevorzugen:

```json5
{
  models: {
    providers: {
      "amazon-bedrock-mantle": {
        baseUrl: "https://bedrock-mantle.us-east-1.api.aws/v1",
        api: "openai-completions",
        auth: "api-key",
        apiKey: "env:AWS_BEARER_TOKEN_BEDROCK",
        models: [
          {
            id: "gpt-oss-120b",
            name: "GPT-OSS 120B",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 32000,
            maxTokens: 4096,
          },
        ],
      },
    },
  },
}
```

## Erweiterte Konfiguration

<AccordionGroup>
  <Accordion title="Reasoning-Unterstützung">
    Reasoning-Unterstützung wird aus Modell-IDs abgeleitet, die Muster wie `thinking`, `reasoner` oder `gpt-oss-120b` enthalten. OpenClaw setzt während der Erkennung für passende Modelle automatisch `reasoning: true`.
  </Accordion>

  <Accordion title="Nichtverfügbarkeit des Endpunkts">
    Wenn der Mantle-Endpunkt nicht verfügbar ist oder keine Modelle zurückgibt, wird der Provider stillschweigend übersprungen. OpenClaw gibt keinen Fehler aus; andere konfigurierte Provider funktionieren weiterhin normal.
  </Accordion>

  <Accordion title="Claude Opus 4.7 über die Anthropic-Messages-Route">
    Mantle stellt außerdem eine Anthropic-Messages-Route bereit, die Claude-Modelle über denselben Bearer-authentifizierten Streaming-Pfad führt. Claude Opus 4.7 (`amazon-bedrock-mantle/claude-opus-4.7`) kann über diese Route mit Provider-eigenem Streaming aufgerufen werden, sodass AWS-Bearer-Tokens nicht wie Anthropic-API-Schlüssel behandelt werden.

    Wenn Sie ein Anthropic-Messages-Modell beim Mantle-Provider festlegen, verwendet OpenClaw für dieses Modell die API-Oberfläche `anthropic-messages` statt `openai-completions`. Die Authentifizierung stammt weiterhin aus `AWS_BEARER_TOKEN_BEDROCK` (oder dem erstellten IAM-Bearer-Token).

    ```json5
    {
      models: {
        providers: {
          "amazon-bedrock-mantle": {
            models: [
              {
                id: "claude-opus-4.7",
                name: "Claude Opus 4.7",
                api: "anthropic-messages",
                reasoning: true,
                input: ["text", "image"],
                contextWindow: 1000000,
                maxTokens: 32000,
              },
            ],
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Beziehung zum Amazon Bedrock-Provider">
    Bedrock Mantle ist ein separater Provider neben dem standardmäßigen [Amazon Bedrock](/de/providers/bedrock)-Provider. Mantle verwendet eine OpenAI-kompatible `/v1`-Oberfläche, während der standardmäßige Bedrock-Provider die native Bedrock-API verwendet.

    Beide Provider verwenden dieselben `AWS_BEARER_TOKEN_BEDROCK`-Anmeldedaten, wenn sie vorhanden sind.

  </Accordion>
</AccordionGroup>

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Amazon Bedrock" href="/de/providers/bedrock" icon="cloud">
    Nativer Bedrock-Provider für Anthropic Claude, Titan und andere Modelle.
  </Card>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Auswahl von Providern, Modellrefs und Failover-Verhalten.
  </Card>
  <Card title="OAuth und Authentifizierung" href="/de/gateway/authentication" icon="key">
    Authentifizierungsdetails und Regeln zur Wiederverwendung von Anmeldedaten.
  </Card>
  <Card title="Fehlerbehebung" href="/de/help/troubleshooting" icon="wrench">
    Häufige Probleme und wie sie behoben werden können.
  </Card>
</CardGroup>
