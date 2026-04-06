---
read_when:
    - Sie möchten mit Bedrock Mantle gehostete OSS-Modelle in OpenClaw verwenden
    - Sie benötigen den OpenAI-kompatiblen Mantle-Endpunkt für GPT-OSS, Qwen, Kimi oder GLM
summary: Amazon Bedrock Mantle (OpenAI-kompatible) Modelle mit OpenClaw verwenden
title: Amazon Bedrock Mantle
x-i18n:
    generated_at: "2026-04-06T03:10:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4e5b33ede4067fb7de02a046f3e375cbd2af4bf68e7751c8dd687447f1a78c86
    source_path: providers/bedrock-mantle.md
    workflow: 15
---

# Amazon Bedrock Mantle

OpenClaw enthält einen gebündelten Provider für **Amazon Bedrock Mantle**, der eine Verbindung zum
OpenAI-kompatiblen Mantle-Endpunkt herstellt. Mantle hostet Open-Source- und
Drittanbieter-Modelle (GPT-OSS, Qwen, Kimi, GLM und ähnliche) über eine standardisierte
`/v1/chat/completions`-Oberfläche, die von der Bedrock-Infrastruktur unterstützt wird.

## Was OpenClaw unterstützt

- Provider: `amazon-bedrock-mantle`
- API: `openai-completions` (OpenAI-kompatibel)
- Auth: explizites `AWS_BEARER_TOKEN_BEDROCK` oder Bearer-Token-Generierung über die IAM-Credential-Chain
- Region: `AWS_REGION` oder `AWS_DEFAULT_REGION` (Standard: `us-east-1`)

## Automatische Modellerkennung

Wenn `AWS_BEARER_TOKEN_BEDROCK` gesetzt ist, verwendet OpenClaw es direkt. Andernfalls
versucht OpenClaw, ein Mantle-Bearer-Token aus der standardmäßigen AWS-
Credential-Chain zu generieren, einschließlich gemeinsamer Credentials-/Konfigurationsprofile, SSO, Web-
Identity sowie Instanz- oder Task-Rollen. Anschließend erkennt es verfügbare Mantle-
Modelle durch Abfrage des regionalen Endpunkts `/v1/models`. Erkennungsergebnisse werden
1 Stunde lang zwischengespeichert, und aus IAM abgeleitete Bearer-Tokens werden stündlich aktualisiert.

Unterstützte Regionen: `us-east-1`, `us-east-2`, `us-west-2`, `ap-northeast-1`,
`ap-south-1`, `ap-southeast-3`, `eu-central-1`, `eu-west-1`, `eu-west-2`,
`eu-south-1`, `eu-north-1`, `sa-east-1`.

## Onboarding

1. Wählen Sie einen Auth-Pfad auf dem **Gateway-Host**:

Explizites Bearer-Token:

```bash
export AWS_BEARER_TOKEN_BEDROCK="..."
# Optional (Standard ist us-east-1):
export AWS_REGION="us-west-2"
```

IAM-Anmeldedaten:

```bash
# Jede mit dem AWS SDK kompatible Auth-Quelle funktioniert hier, zum Beispiel:
export AWS_PROFILE="default"
export AWS_REGION="us-west-2"
```

2. Verifizieren Sie, dass Modelle erkannt werden:

```bash
openclaw models list
```

Erkannte Modelle erscheinen unter dem Provider `amazon-bedrock-mantle`. Es ist
keine zusätzliche Konfiguration erforderlich, es sei denn, Sie möchten Standardwerte überschreiben.

## Manuelle Konfiguration

Wenn Sie explizite Konfiguration anstelle automatischer Erkennung bevorzugen:

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

## Hinweise

- OpenClaw kann das Mantle-Bearer-Token für Sie aus IAM-Anmeldedaten erzeugen, die mit dem AWS SDK kompatibel sind,
  wenn `AWS_BEARER_TOKEN_BEDROCK` nicht gesetzt ist.
- Das Bearer-Token ist dasselbe `AWS_BEARER_TOKEN_BEDROCK`, das vom standardmäßigen
  Provider [Amazon Bedrock](/de/providers/bedrock) verwendet wird.
- Die Unterstützung für Reasoning wird aus Modell-IDs abgeleitet, die Muster wie
  `thinking`, `reasoner` oder `gpt-oss-120b` enthalten.
- Wenn der Mantle-Endpunkt nicht verfügbar ist oder keine Modelle zurückgibt, wird der Provider
  stillschweigend übersprungen.
