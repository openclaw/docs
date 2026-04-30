---
read_when:
    - Sie möchten Amazon-Bedrock-Modelle mit OpenClaw verwenden
    - Für Modellaufrufe müssen AWS-Anmeldeinformationen und eine Region eingerichtet sein
summary: Amazon-Bedrock-Modelle (Converse API) mit OpenClaw verwenden
title: Amazon Bedrock
x-i18n:
    generated_at: "2026-04-30T07:09:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: d6c08ab141423a70e5283ddaf72bf6396bcef411dfa36e1c4b5632377f8ea2d8
    source_path: providers/bedrock.md
    workflow: 16
---

OpenClaw kann **Amazon Bedrock**-Modelle über den **Bedrock Converse**-
Streaming-Provider von pi-ai verwenden. Die Bedrock-Authentifizierung verwendet die **Standard-Credential-Chain des AWS SDK**,
keinen API-Schlüssel.

| Eigenschaft | Wert                                                        |
| ----------- | ----------------------------------------------------------- |
| Provider    | `amazon-bedrock`                                            |
| API         | `bedrock-converse-stream`                                   |
| Auth        | AWS-Zugangsdaten (Env-Variablen, gemeinsame Konfiguration oder Instanzrolle) |
| Region      | `AWS_REGION` oder `AWS_DEFAULT_REGION` (Standard: `us-east-1`) |

## Erste Schritte

Wählen Sie Ihre bevorzugte Authentifizierungsmethode und folgen Sie den Einrichtungsschritten.

<Tabs>
  <Tab title="Zugriffsschlüssel / Env-Variablen">
    **Am besten geeignet für:** Entwicklungsrechner, CI oder Hosts, auf denen Sie AWS-Zugangsdaten direkt verwalten.

    <Steps>
      <Step title="AWS-Zugangsdaten auf dem Gateway-Host setzen">
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
      </Step>
      <Step title="Einen Bedrock-Provider und ein Modell zu Ihrer Konfiguration hinzufügen">
        Kein `apiKey` ist erforderlich. Konfigurieren Sie den Provider mit `auth: "aws-sdk"`:

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
      </Step>
      <Step title="Prüfen, ob Modelle verfügbar sind">
        ```bash
        openclaw models list
        ```
      </Step>
    </Steps>

    <Tip>
    Mit Env-Marker-Authentifizierung (`AWS_ACCESS_KEY_ID`, `AWS_PROFILE` oder `AWS_BEARER_TOKEN_BEDROCK`) aktiviert OpenClaw den impliziten Bedrock-Provider für die Modellerkennung automatisch, ohne zusätzliche Konfiguration.
    </Tip>

  </Tab>

  <Tab title="EC2-Instanzrollen (IMDS)">
    **Am besten geeignet für:** EC2-Instanzen mit angehängter IAM-Rolle, die den Instance Metadata Service zur Authentifizierung verwenden.

    <Steps>
      <Step title="Erkennung explizit aktivieren">
        Bei Verwendung von IMDS kann OpenClaw AWS-Authentifizierung nicht allein anhand von Env-Markern erkennen; daher müssen Sie sich dafür entscheiden:

        ```bash
        openclaw config set plugins.entries.amazon-bedrock.config.discovery.enabled true
        openclaw config set plugins.entries.amazon-bedrock.config.discovery.region us-east-1
        ```
      </Step>
      <Step title="Optional einen Env-Marker für den Automodus hinzufügen">
        Wenn außerdem der Env-Marker-Autoerkennungspfad funktionieren soll (zum Beispiel für `openclaw status`-Oberflächen):

        ```bash
        export AWS_PROFILE=default
        export AWS_REGION=us-east-1
        ```

        Sie benötigen **keinen** gefälschten API-Schlüssel.
      </Step>
      <Step title="Prüfen, ob Modelle erkannt werden">
        ```bash
        openclaw models list
        ```
      </Step>
    </Steps>

    <Warning>
    Die IAM-Rolle, die Ihrer EC2-Instanz angehängt ist, muss die folgenden Berechtigungen haben:

    - `bedrock:InvokeModel`
    - `bedrock:InvokeModelWithResponseStream`
    - `bedrock:ListFoundationModels` (für automatische Erkennung)
    - `bedrock:ListInferenceProfiles` (für Inferenzprofil-Erkennung)

    Oder hängen Sie die verwaltete Richtlinie `AmazonBedrockFullAccess` an.
    </Warning>

    <Note>
    Sie benötigen `AWS_PROFILE=default` nur, wenn Sie ausdrücklich einen Env-Marker für den Automodus oder Status-Oberflächen möchten. Der tatsächliche Bedrock-Runtime-Authentifizierungspfad verwendet die Standard-Chain des AWS SDK, sodass IMDS-Instanzrollen-Authentifizierung auch ohne Env-Marker funktioniert.
    </Note>

  </Tab>
</Tabs>

## Automatische Modellerkennung

OpenClaw kann Bedrock-Modelle automatisch erkennen, die **Streaming**
und **Textausgabe** unterstützen. Die Erkennung verwendet `bedrock:ListFoundationModels` und
`bedrock:ListInferenceProfiles`, und Ergebnisse werden zwischengespeichert (Standard: 1 Stunde).

So wird der implizite Provider aktiviert:

- Wenn `plugins.entries.amazon-bedrock.config.discovery.enabled` auf `true` gesetzt ist,
  versucht OpenClaw die Erkennung auch dann, wenn kein AWS-Env-Marker vorhanden ist.
- Wenn `plugins.entries.amazon-bedrock.config.discovery.enabled` nicht gesetzt ist,
  fügt OpenClaw den
  impliziten Bedrock-Provider nur automatisch hinzu, wenn einer dieser AWS-Auth-Marker erkannt wird:
  `AWS_BEARER_TOKEN_BEDROCK`, `AWS_ACCESS_KEY_ID` +
  `AWS_SECRET_ACCESS_KEY` oder `AWS_PROFILE`.
- Der tatsächliche Bedrock-Runtime-Authentifizierungspfad verwendet weiterhin die Standard-Chain des AWS SDK, sodass
  gemeinsame Konfiguration, SSO und IMDS-Instanzrollen-Authentifizierung auch dann funktionieren können, wenn für die Erkennung
  `enabled: true` erforderlich war, um sie zu aktivieren.

<Note>
Für explizite `models.providers["amazon-bedrock"]`-Einträge kann OpenClaw Bedrock-Env-Marker-Authentifizierung weiterhin früh aus AWS-Env-Markern wie `AWS_BEARER_TOKEN_BEDROCK` auflösen, ohne das vollständige Laden der Runtime-Authentifizierung zu erzwingen. Der tatsächliche Authentifizierungspfad für Modellaufrufe verwendet weiterhin die Standard-Chain des AWS SDK.
</Note>

<AccordionGroup>
  <Accordion title="Konfigurationsoptionen für die Erkennung">
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

    | Option | Standard | Beschreibung |
    | ------ | -------- | ------------ |
    | `enabled` | auto | Im Automodus aktiviert OpenClaw den impliziten Bedrock-Provider nur, wenn ein unterstützter AWS-Env-Marker erkannt wird. Setzen Sie `true`, um die Erkennung zu erzwingen. |
    | `region` | `AWS_REGION` / `AWS_DEFAULT_REGION` / `us-east-1` | AWS-Region, die für Discovery-API-Aufrufe verwendet wird. |
    | `providerFilter` | (alle) | Stimmt mit Bedrock-Provider-Namen überein (zum Beispiel `anthropic`, `amazon`). |
    | `refreshInterval` | `3600` | Cache-Dauer in Sekunden. Setzen Sie den Wert auf `0`, um Caching zu deaktivieren. |
    | `defaultContextWindow` | `32000` | Kontextfenster, das für erkannte Modelle verwendet wird (überschreiben, wenn Sie die Grenzen Ihres Modells kennen). |
    | `defaultMaxTokens` | `4096` | Maximale Ausgabetokens, die für erkannte Modelle verwendet werden (überschreiben, wenn Sie die Grenzen Ihres Modells kennen). |

  </Accordion>
</AccordionGroup>

## Schnelleinrichtung (AWS-Pfad)

Diese Anleitung erstellt eine IAM-Rolle, hängt Bedrock-Berechtigungen an, verknüpft
das Instanzprofil und aktiviert die OpenClaw-Erkennung auf dem EC2-Host.

```bash
# 1. Create IAM role and instance profile
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

# 2. Attach to your EC2 instance
aws ec2 associate-iam-instance-profile \
  --instance-id i-xxxxx \
  --iam-instance-profile Name=EC2-Bedrock-Access

# 3. On the EC2 instance, enable discovery explicitly
openclaw config set plugins.entries.amazon-bedrock.config.discovery.enabled true
openclaw config set plugins.entries.amazon-bedrock.config.discovery.region us-east-1

# 4. Optional: add an env marker if you want auto mode without explicit enable
echo 'export AWS_PROFILE=default' >> ~/.bashrc
echo 'export AWS_REGION=us-east-1' >> ~/.bashrc
source ~/.bashrc

# 5. Verify models are discovered
openclaw models list
```

## Erweiterte Konfiguration

<AccordionGroup>
  <Accordion title="Inferenzprofile">
    OpenClaw erkennt **regionale und globale Inferenzprofile** zusammen mit
    Foundation Models. Wenn ein Profil einem bekannten Foundation Model zugeordnet ist, übernimmt das
    Profil die Fähigkeiten dieses Modells (Kontextfenster, maximale Tokens,
    Reasoning, Vision), und die korrekte Bedrock-Anfrageregion wird automatisch eingefügt. Das bedeutet, dass regionsübergreifende Claude-Profile ohne manuelle
    Provider-Überschreibungen funktionieren.

    Inferenzprofil-IDs sehen wie `us.anthropic.claude-opus-4-6-v1:0` (regional)
    oder `anthropic.claude-opus-4-6-v1:0` (global) aus. Wenn das zugrunde liegende Modell bereits
    in den Erkennungsergebnissen enthalten ist, übernimmt das Profil dessen vollständigen Fähigkeitssatz;
    andernfalls gelten sichere Standardwerte.

    Es ist keine zusätzliche Konfiguration erforderlich. Solange die Erkennung aktiviert ist und der IAM-
    Principal `bedrock:ListInferenceProfiles` hat, erscheinen Profile zusammen mit
    Foundation Models in `openclaw models list`.

  </Accordion>

  <Accordion title="Claude Opus 4.7-Temperatur">
    Bedrock lehnt den Parameter `temperature` für Claude Opus 4.7 ab. OpenClaw
    lässt `temperature` automatisch für jede Opus 4.7-Bedrock-Referenz weg, einschließlich
    Foundation-Model-IDs, benannter Inferenzprofile, Anwendungs-Inferenzprofile,
    deren zugrunde liegendes Modell über `bedrock:GetInferenceProfile` zu Opus 4.7 aufgelöst wird,
    sowie gepunkteter `opus-4.7`-Varianten mit
    optionalen Regionspräfixen (`us.`, `eu.`, `ap.`, `apac.`, `au.`, `jp.`,
    `global.`). Es ist kein Konfigurationsschalter erforderlich, und das Weglassen gilt sowohl für
    das Anfrageoptionsobjekt als auch für das `inferenceConfig`-Payload-Feld.
  </Accordion>

  <Accordion title="Guardrails">
    Sie können [Amazon Bedrock Guardrails](https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails.html)
    auf alle Bedrock-Modellaufrufe anwenden, indem Sie der
    `amazon-bedrock`-Plugin-Konfiguration ein `guardrail`-Objekt hinzufügen. Guardrails ermöglichen es Ihnen, Inhaltsfilterung,
    Themenablehnung, Wortfilter, Filter für sensible Informationen und kontextuelle
    Grounding-Prüfungen durchzusetzen.

    ```json5
    {
      plugins: {
        entries: {
          "amazon-bedrock": {
            config: {
              guardrail: {
                guardrailIdentifier: "abc123", // guardrail ID or full ARN
                guardrailVersion: "1", // version number or "DRAFT"
                streamProcessingMode: "sync", // optional: "sync" or "async"
                trace: "enabled", // optional: "enabled", "disabled", or "enabled_full"
              },
            },
          },
        },
      },
    }
    ```

    | Option | Erforderlich | Beschreibung |
    | ------ | ------------ | ------------ |
    | `guardrailIdentifier` | Ja | Guardrail-ID (z. B. `abc123`) oder vollständige ARN (z. B. `arn:aws:bedrock:us-east-1:123456789012:guardrail/abc123`). |
    | `guardrailVersion` | Ja | Veröffentlichte Versionsnummer oder `"DRAFT"` für den Arbeitsentwurf. |
    | `streamProcessingMode` | Nein | `"sync"` oder `"async"` für die Guardrail-Auswertung während des Streamings. Wenn weggelassen, verwendet Bedrock seinen Standardwert. |
    | `trace` | Nein | `"enabled"` oder `"enabled_full"` zum Debuggen; weglassen oder für die Produktion auf `"disabled"` setzen. |

    <Warning>
    Der vom Gateway verwendete IAM-Principal muss zusätzlich zu den Standard-Aufrufberechtigungen die Berechtigung `bedrock:ApplyGuardrail` haben.
    </Warning>

  </Accordion>

  <Accordion title="Embeddings für Speichersuche">
    Bedrock kann auch als Embedding-Provider für die
    [Speichersuche](/de/concepts/memory-search) dienen. Dies wird separat vom
    Inferenz-Provider konfiguriert -- setzen Sie `agents.defaults.memorySearch.provider` auf `"bedrock"`:

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            provider: "bedrock",
            model: "amazon.titan-embed-text-v2:0", // default
          },
        },
      },
    }
    ```

    Bedrock-Embeddings verwenden dieselbe AWS-SDK-Anmeldeinformationskette wie die Inferenz (Instanzrollen,
    SSO, Zugriffsschlüssel, gemeinsame Konfiguration und Web Identity). Es ist kein API-Schlüssel
    erforderlich. Wenn `provider` auf `"auto"` gesetzt ist, wird Bedrock automatisch erkannt, wenn diese
    Anmeldeinformationskette erfolgreich aufgelöst wird.

    Unterstützte Embedding-Modelle umfassen Amazon Titan Embed (v1, v2), Amazon Nova
    Embed, Cohere Embed (v3, v4) und TwelveLabs Marengo. Siehe
    [Referenz zur Speicherkonfiguration -- Bedrock](/de/reference/memory-config#bedrock-embedding-config)
    für die vollständige Modellliste und Dimensionsoptionen.

  </Accordion>

  <Accordion title="Hinweise und Einschränkungen">
    - Bedrock erfordert, dass **Modellzugriff** in Ihrem AWS-Konto/Ihrer AWS-Region aktiviert ist.
    - Die automatische Erkennung benötigt die Berechtigungen `bedrock:ListFoundationModels` und
      `bedrock:ListInferenceProfiles`.
    - Wenn Sie den Auto-Modus nutzen, setzen Sie einen der unterstützten AWS-Auth-Env-Marker auf dem
      Gateway-Host. Wenn Sie IMDS-/Shared-Config-Auth ohne Env-Marker bevorzugen, setzen Sie
      `plugins.entries.amazon-bedrock.config.discovery.enabled: true`.
    - OpenClaw zeigt die Quelle der Anmeldeinformationen in dieser Reihenfolge an: `AWS_BEARER_TOKEN_BEDROCK`,
      dann `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`, dann `AWS_PROFILE`, dann die
      standardmäßige AWS-SDK-Kette.
    - Reasoning-Unterstützung hängt vom Modell ab; prüfen Sie die Bedrock-Modellkarte auf
      aktuelle Fähigkeiten.
    - Wenn Sie einen verwalteten Schlüsselablauf bevorzugen, können Sie auch einen OpenAI-kompatiblen
      Proxy vor Bedrock platzieren und ihn stattdessen als OpenAI-Provider konfigurieren.
  </Accordion>
</AccordionGroup>

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Provider, Modellreferenzen und Failover-Verhalten auswählen.
  </Card>
  <Card title="Speichersuche" href="/de/concepts/memory-search" icon="magnifying-glass">
    Bedrock-Embeddings für die Konfiguration der Speichersuche.
  </Card>
  <Card title="Referenz zur Speicherkonfiguration" href="/de/reference/memory-config#bedrock-embedding-config" icon="database">
    Vollständige Bedrock-Embedding-Modellliste und Dimensionsoptionen.
  </Card>
  <Card title="Problembehandlung" href="/de/help/troubleshooting" icon="wrench">
    Allgemeine Problembehandlung und FAQ.
  </Card>
</CardGroup>
