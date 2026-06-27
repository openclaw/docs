---
read_when:
    - Sie möchten von Bedrock Mantle gehostete OSS-Modelle mit OpenClaw verwenden
    - Sie benötigen den OpenAI-kompatiblen Mantle-Endpunkt für GPT-OSS, Qwen, Kimi oder GLM
summary: Amazon Bedrock Mantle-Modelle (OpenAI-kompatibel) mit OpenClaw verwenden
title: Amazon Bedrock Mantle
x-i18n:
    generated_at: "2026-06-27T18:02:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5e14026e4fb25b13994061f2aaa5294df44ce8fe1ba99e031b8c92a41a4a9b49
    source_path: providers/bedrock-mantle.md
    workflow: 16
---

OpenClaw enthält einen gebündelten **Amazon Bedrock Mantle**-Provider, der eine Verbindung zum OpenAI-kompatiblen Mantle-Endpunkt herstellt. Mantle hostet Open-Source- und Drittanbietermodelle (GPT-OSS, Qwen, Kimi, GLM und ähnliche) über eine standardmäßige `/v1/chat/completions`-Schnittstelle, die von Bedrock-Infrastruktur unterstützt wird.

| Eigenschaft    | Wert                                                                                        |
| -------------- | ------------------------------------------------------------------------------------------- |
| Provider-ID    | `amazon-bedrock-mantle`                                                                     |
| API            | `openai-completions` (OpenAI-kompatibel) oder `anthropic-messages` (Anthropic-Messages-Route) |
| Auth           | Explizites `AWS_BEARER_TOKEN_BEDROCK` oder IAM-Credential-Chain-Bearer-Token-Generierung    |
| Standardregion | `us-east-1` (mit `AWS_REGION` oder `AWS_DEFAULT_REGION` überschreiben)                      |

## Erste Schritte

Wählen Sie Ihre bevorzugte Auth-Methode und folgen Sie den Einrichtungsschritten.

<Tabs>
  <Tab title="Explizites Bearer-Token">
    **Am besten geeignet für:** Umgebungen, in denen Sie bereits ein Mantle-Bearer-Token haben.

    <Steps>
      <Step title="Bearer-Token auf dem Gateway-Host setzen">
        ```bash
        export AWS_BEARER_TOKEN_BEDROCK="..."
        ```

        Legen Sie optional eine Region fest (Standard ist `us-east-1`):

        ```bash
        export AWS_REGION="us-west-2"
        ```
      </Step>
      <Step title="Provider-Datenfreigabe für Claude Fable 5 aktivieren">
        Claude Fable 5 und Bedrock-Modelle der Claude-Mythos-Klasse erfordern vor dem Aufruf den Mantle-Data-Retention-API-Modus `provider_data_share`. Diese Aktivierung erlaubt Bedrock, Prompts und Completions mit Anthropic zu teilen und sie bis zu 30 Tage für Trust-and-Safety-Prüfungen aufzubewahren.

        ```bash
        AWS_REGION="${AWS_REGION:-us-east-1}"
        curl -X PUT "https://bedrock-mantle.${AWS_REGION}.api.aws/v1/data_retention" \
          -H "Authorization: Bearer $AWS_BEARER_TOKEN_BEDROCK" \
          -H "Content-Type: application/json" \
          -d '{ "mode": "provider_data_share" }'
        ```

        Verwenden Sie in der Konfiguration ein anderes Bedrock-Modell, wenn Sie diesen Aufbewahrungsmodus nicht akzeptieren können.
      </Step>
      <Step title="Überprüfen, ob Modelle erkannt werden">
        ```bash
        openclaw models list
        ```

        Erkannte Modelle erscheinen unter dem Provider `amazon-bedrock-mantle`. Es ist keine zusätzliche Konfiguration erforderlich, sofern Sie die Standards nicht überschreiben möchten.
      </Step>
    </Steps>

  </Tab>

  <Tab title="IAM-Anmeldedaten">
    **Am besten geeignet für:** die Verwendung AWS-SDK-kompatibler Anmeldedaten (gemeinsame Konfiguration, SSO, Webidentität, Instance- oder Task-Rollen).

    <Steps>
      <Step title="AWS-Anmeldedaten auf dem Gateway-Host konfigurieren">
        Jede AWS-SDK-kompatible Auth-Quelle funktioniert:

        ```bash
        export AWS_PROFILE="default"
        export AWS_REGION="us-west-2"
        ```
      </Step>
      <Step title="Überprüfen, ob Modelle erkannt werden">
        ```bash
        openclaw models list
        ```

        OpenClaw generiert automatisch ein Mantle-Bearer-Token aus der Credential Chain.
      </Step>
    </Steps>

    <Tip>
    Wenn `AWS_BEARER_TOKEN_BEDROCK` nicht gesetzt ist, stellt OpenClaw das Bearer-Token für Sie aus der Standard-Credential-Chain von AWS aus, einschließlich gemeinsamer Anmeldedaten-/Konfigurationsprofile, SSO, Webidentität sowie Instance- oder Task-Rollen.
    </Tip>

  </Tab>
</Tabs>

## Automatische Modellerkennung

Wenn `AWS_BEARER_TOKEN_BEDROCK` gesetzt ist, verwendet OpenClaw es direkt. Andernfalls versucht OpenClaw, ein Mantle-Bearer-Token aus der Standard-Credential-Chain von AWS zu generieren. Anschließend erkennt es verfügbare Mantle-Modelle, indem es den regionalen `/v1/models`-Endpunkt abfragt.

| Verhalten      | Detail                                |
| --------------- | ------------------------------------- |
| Discovery-Cache | Ergebnisse werden 1 Stunde gecacht    |
| IAM-Token-Aktualisierung | Stündlich                    |

Um das Mantle-Plugin aktiviert zu lassen, aber automatische Erkennung und IAM-Bearer-Token-Generierung zu unterdrücken, deaktivieren Sie den Plugin-eigenen Discovery-Schalter:

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
    Reasoning-Unterstützung wird aus Modell-IDs abgeleitet, die Muster wie `thinking`, `reasoner` oder `gpt-oss-120b` enthalten. OpenClaw setzt während der Erkennung automatisch `reasoning: true` für passende Modelle.
  </Accordion>

  <Accordion title="Endpunkt-Nichtverfügbarkeit">
    Wenn der Mantle-Endpunkt nicht verfügbar ist oder keine Modelle zurückgibt, wird der Provider stillschweigend übersprungen. OpenClaw gibt keinen Fehler aus; andere konfigurierte Provider funktionieren weiterhin normal.
  </Accordion>

  <Accordion title="Claude Opus 4.7 über die Anthropic-Messages-Route">
    Mantle stellt außerdem eine Anthropic-Messages-Route bereit, die Claude-Modelle über denselben Bearer-authentifizierten Streaming-Pfad führt. Claude Opus 4.7 (`amazon-bedrock-mantle/claude-opus-4.7`) kann über diese Route mit Provider-eigenem Streaming aufgerufen werden, sodass AWS-Bearer-Token nicht wie Anthropic-API-Schlüssel behandelt werden.

    Wenn Sie ein Anthropic-Messages-Modell auf dem Mantle-Provider festpinnen, verwendet OpenClaw für dieses Modell die API-Schnittstelle `anthropic-messages` statt `openai-completions`. Auth stammt weiterhin aus `AWS_BEARER_TOKEN_BEDROCK` (oder dem ausgestellten IAM-Bearer-Token).

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

  <Accordion title="Beziehung zum Amazon-Bedrock-Provider">
    Bedrock Mantle ist ein separater Provider gegenüber dem standardmäßigen [Amazon Bedrock](/de/providers/bedrock)-Provider. Mantle verwendet eine OpenAI-kompatible `/v1`-Schnittstelle, während der standardmäßige Bedrock-Provider die native Bedrock-API verwendet.

    Beide Provider teilen sich dieselben `AWS_BEARER_TOKEN_BEDROCK`-Anmeldedaten, wenn sie vorhanden sind.

  </Accordion>
</AccordionGroup>

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Amazon Bedrock" href="/de/providers/bedrock" icon="cloud">
    Nativer Bedrock-Provider für Anthropic Claude, Titan und andere Modelle.
  </Card>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Provider, Modellreferenzen und Failover-Verhalten auswählen.
  </Card>
  <Card title="OAuth und Auth" href="/de/gateway/authentication" icon="key">
    Auth-Details und Regeln zur Wiederverwendung von Anmeldedaten.
  </Card>
  <Card title="Fehlerbehebung" href="/de/help/troubleshooting" icon="wrench">
    Häufige Probleme und wie Sie sie beheben.
  </Card>
</CardGroup>
