---
read_when:
    - Sie möchten Amazon Bedrock-Modelle mit OpenClaw verwenden
    - Sie benötigen die Einrichtung von AWS-Zugangsdaten/Region für Modellaufrufe
summary: Amazon Bedrock (Converse API)-Modelle mit OpenClaw verwenden
title: Amazon Bedrock
x-i18n:
    generated_at: "2026-04-06T03:11:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 70bb29fe9199084b1179ced60935b5908318f5b80ced490bf44a45e0467c4929
    source_path: providers/bedrock.md
    workflow: 15
---

# Amazon Bedrock

OpenClaw kann **Amazon Bedrock**-Modelle über den **Bedrock Converse**-Streaming-Provider von pi‑ai verwenden. Die Bedrock-Authentifizierung nutzt die **Standard-Zugangsdatenkette des AWS SDK**,
nicht einen API-Schlüssel.

## Was pi-ai unterstützt

- Provider: `amazon-bedrock`
- API: `bedrock-converse-stream`
- Auth: AWS-Zugangsdaten (Umgebungsvariablen, gemeinsame Konfiguration oder Instanzrolle)
- Region: `AWS_REGION` oder `AWS_DEFAULT_REGION` (Standard: `us-east-1`)

## Automatische Modellerkennung

OpenClaw kann Bedrock-Modelle, die **Streaming** und **Textausgabe**
unterstützen, automatisch erkennen. Die Erkennung verwendet `bedrock:ListFoundationModels` und
`bedrock:ListInferenceProfiles`, und die Ergebnisse werden zwischengespeichert (Standard: 1 Stunde).

So wird der implizite Provider aktiviert:

- Wenn `plugins.entries.amazon-bedrock.config.discovery.enabled` auf `true` steht,
  versucht OpenClaw die Erkennung auch dann, wenn kein AWS-Env-Marker vorhanden ist.
- Wenn `plugins.entries.amazon-bedrock.config.discovery.enabled` nicht gesetzt ist,
  fügt OpenClaw den
  impliziten Bedrock-Provider nur automatisch hinzu, wenn einer dieser AWS-Auth-Marker erkannt wird:
  `AWS_BEARER_TOKEN_BEDROCK`, `AWS_ACCESS_KEY_ID` +
  `AWS_SECRET_ACCESS_KEY` oder `AWS_PROFILE`.
- Der tatsächliche Bedrock-Runtime-Auth-Pfad verwendet weiterhin die Standardkette des AWS SDK, sodass
  gemeinsame Konfiguration, SSO und IMDS-Instanzrollen-Authentifizierung funktionieren können, auch wenn die Erkennung
  `enabled: true` zum Opt-in benötigt hat.

Konfigurationsoptionen befinden sich unter `plugins.entries.amazon-bedrock.config.discovery`:

```json5
{
  plugins: {
    entries: {
      "amazon-bedrock": {
        config: {
          discovery: {
            enabled: true,
            region: "us-east-1",
            providerFilter: ["anthropic", "amazon"],
            refreshInterval: 3600,
            defaultContextWindow: 32000,
            defaultMaxTokens: 4096,
          },
        },
      },
    },
  },
}
```

Hinweise:

- `enabled` verwendet standardmäßig den Automodus. Im Automodus aktiviert OpenClaw den
  impliziten Bedrock-Provider nur, wenn ein unterstützter AWS-Env-Marker erkannt wird.
- `region` verwendet standardmäßig `AWS_REGION` oder `AWS_DEFAULT_REGION`, dann `us-east-1`.
- `providerFilter` gleicht Bedrock-Providernamen ab (zum Beispiel `anthropic`).
- `refreshInterval` wird in Sekunden angegeben; setzen Sie `0`, um das Caching zu deaktivieren.
- `defaultContextWindow` (Standard: `32000`) und `defaultMaxTokens` (Standard: `4096`)
  werden für erkannte Modelle verwendet (überschreiben Sie diese Werte, wenn Sie Ihre Modellgrenzen kennen).
- Für explizite Einträge in `models.providers["amazon-bedrock"]` kann OpenClaw weiterhin
  Bedrock-Env-Marker-Authentifizierung früh aus AWS-Env-Markern wie
  `AWS_BEARER_TOKEN_BEDROCK` auflösen, ohne das vollständige Laden der Runtime-Authentifizierung zu erzwingen. Der
  tatsächliche Auth-Pfad für Modellaufrufe verwendet weiterhin die Standardkette des AWS SDK.

## Onboarding

1. Stellen Sie sicher, dass AWS-Zugangsdaten auf dem **Gateway-Host** verfügbar sind:

```bash
export AWS_ACCESS_KEY_ID="AKIA..."
export AWS_SECRET_ACCESS_KEY="..."
export AWS_REGION="us-east-1"
# Optional:
export AWS_SESSION_TOKEN="..."
export AWS_PROFILE="your-profile"
# Optional (Bedrock API key/bearer token):
export AWS_BEARER_TOKEN_BEDROCK="..."
```

2. Fügen Sie Ihrer Konfiguration einen Bedrock-Provider und ein Modell hinzu (kein `apiKey` erforderlich):

```json5
{
  models: {
    providers: {
      "amazon-bedrock": {
        baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com",
        api: "bedrock-converse-stream",
        auth: "aws-sdk",
        models: [
          {
            id: "us.anthropic.claude-opus-4-6-v1:0",
            name: "Claude Opus 4.6 (Bedrock)",
            reasoning: true,
            input: ["text", "image"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 200000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
  agents: {
    defaults: {
      model: { primary: "amazon-bedrock/us.anthropic.claude-opus-4-6-v1:0" },
    },
  },
}
```

## EC2-Instanzrollen

Wenn OpenClaw auf einer EC2-Instanz mit zugewiesener IAM-Rolle ausgeführt wird, kann das AWS SDK
den Instance Metadata Service (IMDS) zur Authentifizierung verwenden. Für die Erkennung von Bedrock-
Modellen aktiviert OpenClaw den impliziten Provider aus AWS-Env-Markern nur automatisch,
wenn Sie nicht explizit
`plugins.entries.amazon-bedrock.config.discovery.enabled: true` setzen.

Empfohlenes Setup für IMDS-gestützte Hosts:

- Setzen Sie `plugins.entries.amazon-bedrock.config.discovery.enabled` auf `true`.
- Setzen Sie `plugins.entries.amazon-bedrock.config.discovery.region` (oder exportieren Sie `AWS_REGION`).
- Sie benötigen **keinen** künstlichen API-Schlüssel.
- Sie benötigen `AWS_PROFILE=default` nur dann, wenn Sie ausdrücklich einen Env-Marker
  für den Automodus oder für Statusoberflächen möchten.

```bash
# Empfohlen: explizite Erkennungsaktivierung + Region
openclaw config set plugins.entries.amazon-bedrock.config.discovery.enabled true
openclaw config set plugins.entries.amazon-bedrock.config.discovery.region us-east-1

# Optional: fügen Sie einen Env-Marker hinzu, wenn Sie den Automodus ohne explizite Aktivierung möchten
export AWS_PROFILE=default
export AWS_REGION=us-east-1
```

**Erforderliche IAM-Berechtigungen** für die EC2-Instanzrolle:

- `bedrock:InvokeModel`
- `bedrock:InvokeModelWithResponseStream`
- `bedrock:ListFoundationModels` (für automatische Erkennung)
- `bedrock:ListInferenceProfiles` (für Erkennung von Inference Profiles)

Oder hängen Sie die verwaltete Richtlinie `AmazonBedrockFullAccess` an.

## Schnelleinrichtung (AWS-Pfad)

```bash
# 1. IAM-Rolle und Instanzprofil erstellen
aws iam create-role --role-name EC2-Bedrock-Access \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {"Service": "ec2.amazonaws.com"},
      "Action": "sts:AssumeRole"
    }]
  }'

aws iam attach-role-policy --role-name EC2-Bedrock-Access \
  --policy-arn arn:aws:iam::aws:policy/AmazonBedrockFullAccess

aws iam create-instance-profile --instance-profile-name EC2-Bedrock-Access
aws iam add-role-to-instance-profile \
  --instance-profile-name EC2-Bedrock-Access \
  --role-name EC2-Bedrock-Access

# 2. Ihrer EC2-Instanz zuweisen
aws ec2 associate-iam-instance-profile \
  --instance-id i-xxxxx \
  --iam-instance-profile Name=EC2-Bedrock-Access

# 3. Auf der EC2-Instanz die Erkennung explizit aktivieren
openclaw config set plugins.entries.amazon-bedrock.config.discovery.enabled true
openclaw config set plugins.entries.amazon-bedrock.config.discovery.region us-east-1

# 4. Optional: fügen Sie einen Env-Marker hinzu, wenn Sie den Automodus ohne explizite Aktivierung möchten
echo 'export AWS_PROFILE=default' >> ~/.bashrc
echo 'export AWS_REGION=us-east-1' >> ~/.bashrc
source ~/.bashrc

# 5. Prüfen, ob Modelle erkannt werden
openclaw models list
```

## Inference Profiles

OpenClaw erkennt **regionale und globale Inference Profiles** zusammen mit
Foundation-Modellen. Wenn ein Profil einem bekannten Foundation-Modell zugeordnet ist, erbt das
Profil die Fähigkeiten dieses Modells (Kontextfenster, maximale Tokens,
Reasoning, Vision), und die korrekte Bedrock-Request-Region wird
automatisch eingefügt. Das bedeutet, dass regionenübergreifende Claude-Profile ohne manuelle
Provider-Überschreibungen funktionieren.

IDs von Inference Profiles sehen aus wie `us.anthropic.claude-opus-4-6-v1:0` (regional)
oder `anthropic.claude-opus-4-6-v1:0` (global). Wenn das zugrunde liegende Modell bereits
in den Erkennungsergebnissen vorhanden ist, erbt das Profil seinen vollständigen Fähigkeitssatz;
andernfalls werden sichere Standardwerte verwendet.

Es ist keine zusätzliche Konfiguration erforderlich. Solange die Erkennung aktiviert ist und die IAM-
Principal `bedrock:ListInferenceProfiles` hat, erscheinen Profile zusammen mit
Foundation-Modellen in `openclaw models list`.

## Hinweise

- Bedrock erfordert, dass **Modellzugriff** in Ihrem AWS-Konto/Ihrer AWS-Region aktiviert ist.
- Die automatische Erkennung benötigt die Berechtigungen `bedrock:ListFoundationModels` und
  `bedrock:ListInferenceProfiles`.
- Wenn Sie auf den Automodus setzen, legen Sie einen der unterstützten AWS-Auth-Env-Marker auf dem
  Gateway-Host fest. Wenn Sie IMDS-/Shared-Config-Authentifizierung ohne Env-Marker bevorzugen, setzen Sie
  `plugins.entries.amazon-bedrock.config.discovery.enabled: true`.
- OpenClaw zeigt die Quelle der Zugangsdaten in dieser Reihenfolge an: `AWS_BEARER_TOKEN_BEDROCK`,
  dann `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`, dann `AWS_PROFILE`, dann die
  Standardkette des AWS SDK.
- Unterstützung für Reasoning hängt vom Modell ab; prüfen Sie die Bedrock-Model Card auf
  aktuelle Fähigkeiten.
- Wenn Sie einen verwalteten Schlüsselfluss bevorzugen, können Sie auch einen OpenAI‑kompatiblen
  Proxy vor Bedrock schalten und ihn stattdessen als OpenAI-Provider konfigurieren.

## Guardrails

Sie können [Amazon Bedrock Guardrails](https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails.html)
auf alle Bedrock-Modellaufrufe anwenden, indem Sie dem
Plugin-Konfigurationsabschnitt `amazon-bedrock` ein `guardrail`-Objekt hinzufügen. Guardrails ermöglichen es Ihnen, Inhaltsfilterung,
Themenablehnung, Wortfilter, Filter für sensible Informationen und Prüfungen auf
kontextuelle Erdung durchzusetzen.

```json5
{
  plugins: {
    entries: {
      "amazon-bedrock": {
        config: {
          guardrail: {
            guardrailIdentifier: "abc123", // Guardrail-ID oder vollständige ARN
            guardrailVersion: "1", // Versionsnummer oder "DRAFT"
            streamProcessingMode: "sync", // optional: "sync" oder "async"
            trace: "enabled", // optional: "enabled", "disabled" oder "enabled_full"
          },
        },
      },
    },
  },
}
```

- `guardrailIdentifier` (erforderlich) akzeptiert eine Guardrail-ID (z. B. `abc123`) oder eine
  vollständige ARN (z. B. `arn:aws:bedrock:us-east-1:123456789012:guardrail/abc123`).
- `guardrailVersion` (erforderlich) gibt an, welche veröffentlichte Version verwendet werden soll, oder
  `"DRAFT"` für den Arbeitsentwurf.
- `streamProcessingMode` (optional) steuert, ob die Guardrail-Auswertung
  synchron (`"sync"`) oder asynchron (`"async"`) während des Streamings ausgeführt wird. Wenn
  weggelassen, verwendet Bedrock sein Standardverhalten.
- `trace` (optional) aktiviert die Guardrail-Trace-Ausgabe in der API-Antwort. Setzen Sie dies
  für Debugging auf `"enabled"` oder `"enabled_full"`; lassen Sie es für die Produktion weg oder setzen Sie `"disabled"`.

Die IAM-Principal, die vom Gateway verwendet wird, muss zusätzlich zu den Standardberechtigungen für Aufrufe
über die Berechtigung `bedrock:ApplyGuardrail` verfügen.

## Embeddings für Memory Search

Bedrock kann auch als Embedding-Provider für
[Memory Search](/de/concepts/memory-search) dienen. Dies wird getrennt vom
Inference-Provider konfiguriert — setzen Sie `agents.defaults.memorySearch.provider` auf `"bedrock"`:

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "bedrock",
        model: "amazon.titan-embed-text-v2:0", // Standard
      },
    },
  },
}
```

Bedrock-Embeddings verwenden dieselbe AWS-SDK-Zugangsdatenkette wie die Inferenz (Instanzrollen,
SSO, Zugriffsschlüssel, gemeinsame Konfiguration und Web-Identity). Es wird kein API-Schlüssel
benötigt. Wenn `provider` auf `"auto"` steht, wird Bedrock automatisch erkannt, wenn diese
Zugangsdatenkette erfolgreich aufgelöst wird.

Unterstützte Embedding-Modelle umfassen Amazon Titan Embed (v1, v2), Amazon Nova
Embed, Cohere Embed (v3, v4) und TwelveLabs Marengo. Siehe
[Memory configuration reference — Bedrock](/de/reference/memory-config#bedrock-embedding-config)
für die vollständige Modellliste und Dimensionsoptionen.
