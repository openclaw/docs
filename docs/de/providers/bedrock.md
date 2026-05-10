---
read_when:
    - Sie möchten Amazon-Bedrock-Modelle mit OpenClaw verwenden
    - Sie müssen AWS-Anmeldedaten und eine Region für Modellaufrufe einrichten
summary: Amazon-Bedrock-Modelle (Converse API) mit OpenClaw verwenden
title: Amazon Bedrock
x-i18n:
    generated_at: "2026-05-10T19:49:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: fb5a131a11b98dca68746cd6dfef8f36f1fdcbfbb985730176b334083574dc89
    source_path: providers/bedrock.md
    workflow: 16
---

OpenClaw kann **Amazon Bedrock**-Modelle über den **Bedrock Converse**-
Streaming-Provider von pi-ai verwenden. Die Bedrock-Authentifizierung verwendet die **Standard-Anmeldeinformationskette des AWS SDK**,
keinen API-Schlüssel.

| Eigenschaft | Wert                                                        |
| ----------- | ----------------------------------------------------------- |
| Provider    | `amazon-bedrock`                                            |
| API         | `bedrock-converse-stream`                                   |
| Auth        | AWS-Anmeldeinformationen (Umgebungsvariablen, gemeinsame Konfiguration oder Instanzrolle) |
| Region      | `AWS_REGION` oder `AWS_DEFAULT_REGION` (Standard: `us-east-1`) |

## Erste Schritte

Wählen Sie Ihre bevorzugte Authentifizierungsmethode und folgen Sie den Einrichtungsschritten.

<Tabs>
  <Tab title="Zugriffsschlüssel / Umgebungsvariablen">
    **Am besten geeignet für:** Entwicklungsrechner, CI oder Hosts, auf denen Sie AWS-Anmeldeinformationen direkt verwalten.

    <Steps>
      <Step title="AWS-Anmeldeinformationen auf dem Gateway-Host festlegen">
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
        Es ist kein `apiKey` erforderlich. Konfigurieren Sie den Provider mit `auth: "aws-sdk"`:

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
    Mit Authentifizierung über Umgebungsmarker (`AWS_ACCESS_KEY_ID`, `AWS_PROFILE` oder `AWS_BEARER_TOKEN_BEDROCK`) aktiviert OpenClaw automatisch den impliziten Bedrock-Provider für die Modellerkennung ohne zusätzliche Konfiguration.
    </Tip>

  </Tab>

  <Tab title="EC2-Instanzrollen (IMDS)">
    **Am besten geeignet für:** EC2-Instanzen mit angehängter IAM-Rolle, die den Instanzmetadatendienst für die Authentifizierung verwenden.

    <Steps>
      <Step title="Erkennung explizit aktivieren">
        Bei Verwendung von IMDS kann OpenClaw AWS-Authentifizierung nicht allein anhand von Umgebungsmarkern erkennen, daher müssen Sie sich explizit dafür entscheiden:

        ```bash
        openclaw config set plugins.entries.amazon-bedrock.config.discovery.enabled true
        openclaw config set plugins.entries.amazon-bedrock.config.discovery.region us-east-1
        ```
      </Step>
      <Step title="Optional einen Umgebungsmarker für den Automatikmodus hinzufügen">
        Wenn Sie auch möchten, dass der Pfad zur automatischen Erkennung über Umgebungsmarker funktioniert (zum Beispiel für `openclaw status`-Oberflächen):

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
    Die an Ihre EC2-Instanz angehängte IAM-Rolle muss die folgenden Berechtigungen haben:

    - `bedrock:InvokeModel`
    - `bedrock:InvokeModelWithResponseStream`
    - `bedrock:ListFoundationModels` (für automatische Erkennung)
    - `bedrock:ListInferenceProfiles` (für Erkennung von Inferenzprofilen)

    Oder hängen Sie die verwaltete Richtlinie `AmazonBedrockFullAccess` an.
    </Warning>

    <Note>
    Sie benötigen `AWS_PROFILE=default` nur, wenn Sie ausdrücklich einen Umgebungsmarker für den Automatikmodus oder Statusoberflächen wünschen. Der tatsächliche Authentifizierungspfad der Bedrock-Laufzeit verwendet die Standardkette des AWS SDK, sodass Authentifizierung über IMDS-Instanzrollen auch ohne Umgebungsmarker funktioniert.
    </Note>

  </Tab>
</Tabs>

## Automatische Modellerkennung

OpenClaw kann Bedrock-Modelle, die **Streaming**
und **Textausgabe** unterstützen, automatisch erkennen. Die Erkennung verwendet `bedrock:ListFoundationModels` und
`bedrock:ListInferenceProfiles`, und Ergebnisse werden zwischengespeichert (Standard: 1 Stunde).

So wird der implizite Provider aktiviert:

- Wenn `plugins.entries.amazon-bedrock.config.discovery.enabled` auf `true` gesetzt ist,
  versucht OpenClaw die Erkennung auch dann, wenn kein AWS-Umgebungsmarker vorhanden ist.
- Wenn `plugins.entries.amazon-bedrock.config.discovery.enabled` nicht gesetzt ist,
  fügt OpenClaw den
  impliziten Bedrock-Provider nur automatisch hinzu, wenn einer dieser AWS-Authentifizierungsmarker gefunden wird:
  `AWS_BEARER_TOKEN_BEDROCK`, `AWS_ACCESS_KEY_ID` +
  `AWS_SECRET_ACCESS_KEY` oder `AWS_PROFILE`.
- Der tatsächliche Authentifizierungspfad der Bedrock-Laufzeit verwendet weiterhin die Standardkette des AWS SDK, sodass
  gemeinsame Konfiguration, SSO und Authentifizierung über IMDS-Instanzrollen auch dann funktionieren können, wenn die Erkennung
  `enabled: true` zum Opt-in erforderte.

<Note>
Für explizite `models.providers["amazon-bedrock"]`-Einträge kann OpenClaw Bedrock-Authentifizierung über Umgebungsmarker weiterhin früh aus AWS-Umgebungsmarkern wie `AWS_BEARER_TOKEN_BEDROCK` auflösen, ohne das vollständige Laden der Laufzeitauthentifizierung zu erzwingen. Der tatsächliche Authentifizierungspfad für Modellaufrufe verwendet weiterhin die Standardkette des AWS SDK.
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
    | `enabled` | auto | Im Automatikmodus aktiviert OpenClaw den impliziten Bedrock-Provider nur, wenn ein unterstützter AWS-Umgebungsmarker gefunden wird. Setzen Sie `true`, um die Erkennung zu erzwingen. |
    | `region` | `AWS_REGION` / `AWS_DEFAULT_REGION` / `us-east-1` | AWS-Region, die für API-Aufrufe zur Erkennung verwendet wird. |
    | `providerFilter` | (alle) | Entspricht Bedrock-Provider-Namen (zum Beispiel `anthropic`, `amazon`). |
    | `refreshInterval` | `3600` | Cache-Dauer in Sekunden. Setzen Sie den Wert auf `0`, um Caching zu deaktivieren. |
    | `defaultContextWindow` | `32000` | Kontextfenster, das für erkannte Modelle verwendet wird (überschreiben Sie den Wert, wenn Sie die Grenzen Ihres Modells kennen). |
    | `defaultMaxTokens` | `4096` | Maximale Ausgabetokens, die für erkannte Modelle verwendet werden (überschreiben Sie den Wert, wenn Sie die Grenzen Ihres Modells kennen). |

  </Accordion>
</AccordionGroup>

## Schnelle Einrichtung (AWS-Pfad)

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
    OpenClaw erkennt **regionale und globale Inferenzprofile** zusätzlich zu
    Foundation Models. Wenn ein Profil einem bekannten Foundation Model zugeordnet ist, übernimmt das
    Profil die Fähigkeiten dieses Modells (Kontextfenster, maximale Tokens,
    Reasoning, Vision), und die richtige Bedrock-Anfrageregion wird
    automatisch eingefügt. Dadurch funktionieren regionsübergreifende Claude-Profile ohne manuelle
    Provider-Overrides.

    IDs von Inferenzprofilen sehen aus wie `us.anthropic.claude-opus-4-6-v1:0` (regional)
    oder `anthropic.claude-opus-4-6-v1:0` (global). Wenn das zugrunde liegende Modell bereits
    in den Erkennungsergebnissen enthalten ist, übernimmt das Profil seinen vollständigen Fähigkeitssatz;
    andernfalls gelten sichere Standardwerte.

    Es ist keine zusätzliche Konfiguration erforderlich. Solange die Erkennung aktiviert ist und der IAM-
    Prinzipal `bedrock:ListInferenceProfiles` besitzt, erscheinen Profile neben
    Foundation Models in `openclaw models list`.

  </Accordion>

  <Accordion title="Dienststufe">
    Einige Bedrock-Modelle unterstützen einen `service_tier`-Parameter, um Kosten
    oder Latenz zu optimieren. Die folgenden Stufen sind verfügbar:

    | Stufe | Beschreibung |
    |------|-------------|
    | `default` | Standard-Bedrock-Stufe |
    | `flex` | Vergünstigte Verarbeitung für Workloads, die längere Latenz tolerieren können |
    | `priority` | Priorisierte Verarbeitung für latenzempfindliche Workloads |
    | `reserved` | Reservierte Kapazität für Workloads im Dauerbetrieb |

    Setzen Sie `serviceTier` (oder `service_tier`) über `agents.defaults.params` für
    Bedrock-Modellanfragen oder pro Modell in
    `agents.defaults.models["<model-key>"].params`:

    ```json5
    {
      agents: {
        defaults: {
          params: {
            serviceTier: "flex", // applies to all models
          },
          models: {
            "amazon-bedrock/mistral.mistral-large-3-675b-instruct": {
              params: {
                serviceTier: "priority", // per-model override
              },
            },
          },
        },
      },
    }
    ```

    Gültige Werte sind `default`, `flex`, `priority` und `reserved`. Nicht alle
    Modelle unterstützen alle Stufen. Wenn eine nicht unterstützte Stufe angefordert wird, gibt Bedrock
    einen Validierungsfehler zurück. Hinweis: Die Fehlermeldung ist etwas irreführend;
    sie kann „The provided model identifier is invalid“ sagen, statt auf
    eine nicht unterstützte Dienststufe hinzuweisen. Wenn Sie diesen Fehler sehen, prüfen Sie, ob das Modell
    die angeforderte Stufe unterstützt.

  </Accordion>

  <Accordion title="Claude Opus 4.7-Temperatur">
    Bedrock lehnt den `temperature`-Parameter für Claude Opus 4.7 ab. OpenClaw
    lässt `temperature` automatisch für jede Opus 4.7-Bedrock-Referenz weg, einschließlich
    Foundation-Model-IDs, benannter Inferenzprofile, Anwendungs-Inferenzprofile,
    deren zugrunde liegendes Modell über
    `bedrock:GetInferenceProfile` zu Opus 4.7 aufgelöst wird, sowie gepunkteter `opus-4.7`-Varianten mit
    optionalen Regionspräfixen (`us.`, `eu.`, `ap.`, `apac.`, `au.`, `jp.`,
    `global.`). Es ist kein Konfigurationsschalter erforderlich, und die Auslassung gilt sowohl für
    das Anfrageoptionsobjekt als auch für das `inferenceConfig`-Payload-Feld.
  </Accordion>

  <Accordion title="Guardrails">
    Sie können [Amazon Bedrock Guardrails](https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails.html)
    auf alle Bedrock-Modellaufrufe anwenden, indem Sie der Plugin-Konfiguration
    `amazon-bedrock` ein `guardrail`-Objekt hinzufügen. Mit Guardrails können Sie Inhaltsfilterung,
    Themenablehnung, Wortfilter, Filter für vertrauliche Informationen und Prüfungen
    der kontextuellen Fundierung erzwingen.

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
    | ------ | -------- | ----------- |
    | `guardrailIdentifier` | Ja | Guardrail-ID (z. B. `abc123`) oder vollständige ARN (z. B. `arn:aws:bedrock:us-east-1:123456789012:guardrail/abc123`). |
    | `guardrailVersion` | Ja | Veröffentlichte Versionsnummer oder `"DRAFT"` für den Arbeitsentwurf. |
    | `streamProcessingMode` | Nein | `"sync"` oder `"async"` für die Guardrail-Auswertung während des Streamings. Wenn ausgelassen, verwendet Bedrock seine Standardeinstellung. |
    | `trace` | Nein | `"enabled"` oder `"enabled_full"` zum Debugging; für Produktion auslassen oder auf `"disabled"` setzen. |

    <Warning>
    Der vom Gateway verwendete IAM-Principal muss zusätzlich zu den standardmäßigen Aufrufberechtigungen über die Berechtigung `bedrock:ApplyGuardrail` verfügen.
    </Warning>

  </Accordion>

  <Accordion title="Embeddings für Memory-Suche">
    Bedrock kann auch als Embedding-Provider für die
    [Memory-Suche](/de/concepts/memory-search) dienen. Dies wird getrennt vom
    Inferenz-Provider konfiguriert: Setzen Sie `agents.defaults.memorySearch.provider` auf `"bedrock"`:

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
    SSO, Zugriffsschlüssel, gemeinsame Konfiguration und Webidentität). Es wird kein API-Schlüssel
    benötigt. Wenn `provider` `"auto"` ist, wird Bedrock automatisch erkannt, wenn diese
    Anmeldeinformationskette erfolgreich aufgelöst wird.

    Unterstützte Embedding-Modelle umfassen Amazon Titan Embed (v1, v2), Amazon Nova
    Embed, Cohere Embed (v3, v4) und TwelveLabs Marengo. Siehe
    [Memory-Konfigurationsreferenz -- Bedrock](/de/reference/memory-config#bedrock-embedding-config)
    für die vollständige Modellliste und Dimensionsoptionen.

  </Accordion>

  <Accordion title="Hinweise und Einschränkungen">
    - Bedrock erfordert aktivierten **Modellzugriff** in Ihrem AWS-Konto/Ihrer AWS-Region.
    - Automatische Erkennung benötigt die Berechtigungen `bedrock:ListFoundationModels` und
      `bedrock:ListInferenceProfiles`.
    - Wenn Sie sich auf den Auto-Modus verlassen, setzen Sie einen der unterstützten AWS-Auth-Env-Marker auf dem
      Gateway-Host. Wenn Sie IMDS-/Shared-Config-Auth ohne Env-Marker bevorzugen, setzen Sie
      `plugins.entries.amazon-bedrock.config.discovery.enabled: true`.
    - OpenClaw zeigt die Anmeldeinformationsquelle in dieser Reihenfolge an: `AWS_BEARER_TOKEN_BEDROCK`,
      dann `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`, dann `AWS_PROFILE`, dann die
      standardmäßige AWS-SDK-Kette.
    - Reasoning-Unterstützung hängt vom Modell ab; prüfen Sie die Bedrock-Modellkarte auf
      aktuelle Fähigkeiten.
    - Wenn Sie einen verwalteten Schlüsselfluss bevorzugen, können Sie auch einen OpenAI-kompatiblen
      Proxy vor Bedrock platzieren und ihn stattdessen als OpenAI-Provider konfigurieren.
  </Accordion>
</AccordionGroup>

## Verwandt

<CardGroup cols={2}>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Provider, Modell-Refs und Failover-Verhalten auswählen.
  </Card>
  <Card title="Memory-Suche" href="/de/concepts/memory-search" icon="magnifying-glass">
    Bedrock-Embeddings für die Memory-Suchkonfiguration.
  </Card>
  <Card title="Memory-Konfigurationsreferenz" href="/de/reference/memory-config#bedrock-embedding-config" icon="database">
    Vollständige Liste der Bedrock-Embedding-Modelle und Dimensionsoptionen.
  </Card>
  <Card title="Fehlerbehebung" href="/de/help/troubleshooting" icon="wrench">
    Allgemeine Fehlerbehebung und FAQ.
  </Card>
</CardGroup>
