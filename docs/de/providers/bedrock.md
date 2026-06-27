---
read_when:
    - Sie möchten Amazon-Bedrock-Modelle mit OpenClaw verwenden
    - Sie benötigen AWS-Zugangsdaten und eine Regionseinrichtung für Modellaufrufe.
summary: Amazon-Bedrock-Modelle (Converse API) mit OpenClaw verwenden
title: Amazon Bedrock
x-i18n:
    generated_at: "2026-06-27T18:02:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3947ad565f3a0adcd62d4ce47c6ed760f73c77ba3f4bd43b0754a412511063f2
    source_path: providers/bedrock.md
    workflow: 16
---

OpenClaw kann **Amazon Bedrock**-Modelle über seinen **Bedrock Converse**-
Streaming-Provider verwenden. Die Bedrock-Authentifizierung nutzt die **Standard-Anmeldeinformationskette des AWS SDK**,
nicht einen API-Schlüssel.

| Eigenschaft | Wert                                                       |
| -------- | ----------------------------------------------------------- |
| Provider | `amazon-bedrock`                                            |
| API      | `bedrock-converse-stream`                                   |
| Authentifizierung     | AWS-Anmeldeinformationen (Env Vars, gemeinsame Konfiguration oder Instanzrolle) |
| Region   | `AWS_REGION` oder `AWS_DEFAULT_REGION` (Standard: `us-east-1`) |

## Erste Schritte

Wählen Sie Ihre bevorzugte Authentifizierungsmethode und folgen Sie den Einrichtungsschritten.

<Tabs>
  <Tab title="Zugriffsschlüssel / Env Vars">
    **Am besten geeignet für:** Entwicklerrechner, CI oder Hosts, auf denen Sie AWS-Anmeldeinformationen direkt verwalten.

    <Steps>
      <Step title="AWS-Anmeldeinformationen auf dem Gateway-Host setzen">
        ```bash
        export AWS_ACCESS_KEY_ID="EXAMPLE_AWS_ACCESS_KEY_ID"
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
    Mit Env-Marker-Authentifizierung (`AWS_ACCESS_KEY_ID`, `AWS_PROFILE` oder `AWS_BEARER_TOKEN_BEDROCK`) aktiviert OpenClaw automatisch den impliziten Bedrock-Provider für die Modellerkennung ohne zusätzliche Konfiguration.
    </Tip>

  </Tab>

  <Tab title="EC2-Instanzrollen (IMDS)">
    **Am besten geeignet für:** EC2-Instanzen mit angehängter IAM-Rolle, die den Instanzmetadatendienst zur Authentifizierung verwenden.

    <Steps>
      <Step title="Erkennung ausdrücklich aktivieren">
        Bei Verwendung von IMDS kann OpenClaw AWS-Authentifizierung nicht allein anhand von Env-Markern erkennen, daher müssen Sie dies aktivieren:

        ```bash
        openclaw config set plugins.entries.amazon-bedrock.config.discovery.enabled true
        openclaw config set plugins.entries.amazon-bedrock.config.discovery.region us-east-1
        ```
      </Step>
      <Step title="Optional einen Env-Marker für den Auto-Modus hinzufügen">
        Wenn Sie außerdem möchten, dass der Pfad zur automatischen Erkennung von Env-Markern funktioniert (zum Beispiel für `openclaw status`-Oberflächen):

        ```bash
        export AWS_PROFILE=default
        export AWS_REGION=us-east-1
        ```

        Sie benötigen **keinen** unechten API-Schlüssel.
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
    - `bedrock:ListInferenceProfiles` (für Erkennung von Inference-Profilen)

    Oder hängen Sie die verwaltete Richtlinie `AmazonBedrockFullAccess` an.
    </Warning>

    <Note>
    Sie benötigen `AWS_PROFILE=default` nur, wenn Sie ausdrücklich einen Env-Marker für den Auto-Modus oder Status-Oberflächen möchten. Der tatsächliche Authentifizierungspfad der Bedrock-Laufzeit verwendet die Standardkette des AWS SDK, daher funktioniert IMDS-Instanzrollen-Authentifizierung auch ohne Env-Marker.
    </Note>

  </Tab>
</Tabs>

## Automatische Modellerkennung

OpenClaw kann Bedrock-Modelle, die **Streaming**
und **Textausgabe** unterstützen, automatisch erkennen. Die Erkennung verwendet `bedrock:ListFoundationModels` und
`bedrock:ListInferenceProfiles`, und Ergebnisse werden zwischengespeichert (Standard: 1 Stunde).

So wird der implizite Provider aktiviert:

- Wenn `plugins.entries.amazon-bedrock.config.discovery.enabled` `true` ist,
  versucht OpenClaw die Erkennung auch dann, wenn kein AWS-Env-Marker vorhanden ist.
- Wenn `plugins.entries.amazon-bedrock.config.discovery.enabled` nicht gesetzt ist,
  fügt OpenClaw den
  impliziten Bedrock-Provider nur automatisch hinzu, wenn einer dieser AWS-Authentifizierungsmarker erkannt wird:
  `AWS_BEARER_TOKEN_BEDROCK`, `AWS_ACCESS_KEY_ID` +
  `AWS_SECRET_ACCESS_KEY` oder `AWS_PROFILE`.
- Der tatsächliche Authentifizierungspfad der Bedrock-Laufzeit verwendet weiterhin die Standardkette des AWS SDK, sodass
  gemeinsame Konfiguration, SSO und IMDS-Instanzrollen-Authentifizierung auch dann funktionieren können, wenn für die Erkennung
  `enabled: true` zur expliziten Aktivierung erforderlich war.

<Note>
Für explizite `models.providers["amazon-bedrock"]`-Einträge kann OpenClaw die Bedrock-Env-Marker-Authentifizierung weiterhin früh aus AWS-Env-Markern wie `AWS_BEARER_TOKEN_BEDROCK` auflösen, ohne das vollständige Laden der Laufzeit-Authentifizierung zu erzwingen. Der tatsächliche Authentifizierungspfad für Modellaufrufe verwendet weiterhin die Standardkette des AWS SDK.
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
    | ------ | ------- | ----------- |
    | `enabled` | auto | Im Auto-Modus aktiviert OpenClaw den impliziten Bedrock-Provider nur, wenn ein unterstützter AWS-Env-Marker erkannt wird. Setzen Sie `true`, um die Erkennung zu erzwingen. |
    | `region` | `AWS_REGION` / `AWS_DEFAULT_REGION` / `us-east-1` | AWS-Region, die für Erkennungs-API-Aufrufe verwendet wird. |
    | `providerFilter` | (alle) | Gleicht Bedrock-Provider-Namen ab (zum Beispiel `anthropic`, `amazon`). |
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
  <Accordion title="Inference-Profile">
    OpenClaw erkennt **regionale und globale Inference-Profile** zusammen mit
    Foundation Models. Wenn ein Profil einem bekannten Foundation Model zugeordnet ist, erbt das
    Profil die Fähigkeiten dieses Modells (Kontextfenster, maximale Tokens,
    Reasoning, Vision), und die richtige Bedrock-Anfrageregion wird
    automatisch eingefügt. Das bedeutet, dass regionsübergreifende Claude-Profile ohne manuelle
    Provider-Überschreibungen funktionieren.

    Inference-Profil-IDs sehen aus wie `us.anthropic.claude-opus-4-6-v1:0` (regional)
    oder `anthropic.claude-opus-4-6-v1:0` (global). Wenn das zugrunde liegende Modell bereits
    in den Erkennungsergebnissen enthalten ist, erbt das Profil seinen vollständigen Fähigkeitssatz;
    andernfalls gelten sichere Standardwerte.

    Es ist keine zusätzliche Konfiguration erforderlich. Solange die Erkennung aktiviert ist und der IAM-
    Principal `bedrock:ListInferenceProfiles` hat, erscheinen Profile neben
    Foundation Models in `openclaw models list`.

  </Accordion>

  <Accordion title="Service-Stufe">
    Einige Bedrock-Modelle unterstützen einen `service_tier`-Parameter zur Optimierung auf Kosten
    oder Latenz. Die folgenden Stufen sind verfügbar:

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
    Modelle unterstützen alle Stufen — wenn eine nicht unterstützte Stufe angefordert wird, gibt Bedrock
    einen Validierungsfehler zurück. Hinweis: Die Fehlermeldung ist etwas irreführend;
    sie kann "The provided model identifier is invalid" lauten, statt auf
    eine nicht unterstützte Service-Stufe hinzuweisen. Wenn Sie diesen Fehler sehen, prüfen Sie, ob das Modell
    die angeforderte Stufe unterstützt.

  </Accordion>

  <Accordion title="Claude Opus 4.7 temperature">
    Bedrock lehnt den Parameter `temperature` für Claude Opus 4.7 ab. OpenClaw
    lässt `temperature` automatisch für jede Opus 4.7-Bedrock-Referenz weg, einschließlich
    Foundation-Model-IDs, benannter Inference-Profile, Anwendungs-Inference-
    Profile, deren zugrunde liegendes Modell über
    `bedrock:GetInferenceProfile` zu Opus 4.7 aufgelöst wird, sowie gepunkteter `opus-4.7`-Varianten mit
    optionalen Regionspräfixen (`us.`, `eu.`, `ap.`, `apac.`, `au.`, `jp.`,
    `global.`). Es ist kein Konfigurationsschalter erforderlich, und die Auslassung gilt sowohl für
    das Objekt mit Anfrageoptionen als auch für das Payload-Feld `inferenceConfig`.
  </Accordion>

  <Accordion title="Claude Fable 5">
    Verwenden Sie `amazon-bedrock/anthropic.claude-fable-5` in `us-east-1` oder
    regionale Inferenz-IDs wie `us.anthropic.claude-fable-5`.
    OpenClaw wendet Fables Kontextfenster mit 1 Mio. Token, das Ausgabelimit von 128K,
    dauerhaft aktiviertes adaptives Denken und die unterstützte Aufwand-Zuordnung an. `/think off` und
    `/think minimal` werden `low` zugeordnet; nicht unterstützte Temperatur- und erzwungene Tool-Auswahlsteuerungen
    werden ausgelassen. Streaming-Ausgabe wird zurückgehalten, bis Bedrock
    einen terminalen Status zurückgibt, damit Verweigerungen mitten im Stream keinen Teiltext offenlegen.
    Fable unterstützt nur die Standard-Service-Stufe; OpenClaw ignoriert konfigurierte
    Stufen `flex`, `priority` und `reserved` für dieses Modell.

    AWS erfordert eine ausdrückliche `provider_data_share`-Einwilligung zur Datenaufbewahrung, bevor
    Fable verfügbar ist. Prompts und Vervollständigungen werden mit Anthropic geteilt und
    bis zu 30 Tage für Vertrauen und Sicherheit aufbewahrt. Prüfen und konfigurieren Sie
    [Bedrock-Datenaufbewahrung](https://docs.aws.amazon.com/bedrock/latest/userguide/data-retention.html),
    bevor Sie das Modell aktivieren.

  </Accordion>

  <Accordion title="Guardrails">
    Sie können [Amazon Bedrock Guardrails](https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails.html)
    auf alle Bedrock-Modellaufrufe anwenden, indem Sie der
    `amazon-bedrock`-Plugin-Konfiguration ein `guardrail`-Objekt hinzufügen. Mit Guardrails können Sie Inhaltsfilterung,
    Themenablehnung, Wortfilter, Filter für sensible Informationen und kontextbezogene
    Grounding-Prüfungen erzwingen.

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
    | `guardrailIdentifier` | Ja | Guardrail-ID (z. B. `abc123`) oder vollständiger ARN (z. B. `arn:aws:bedrock:us-east-1:123456789012:guardrail/abc123`). |
    | `guardrailVersion` | Ja | Veröffentlichte Versionsnummer oder `"DRAFT"` für den Arbeitsentwurf. |
    | `streamProcessingMode` | Nein | `"sync"` oder `"async"` für die Guardrail-Auswertung während des Streamings. Wenn ausgelassen, verwendet Bedrock seinen Standard. |
    | `trace` | Nein | `"enabled"` oder `"enabled_full"` zum Debuggen; für Produktion auslassen oder auf `"disabled"` setzen. |

    <Warning>
    Der vom Gateway verwendete IAM-Prinzipal muss zusätzlich zu den Standardaufrufberechtigungen über die Berechtigung `bedrock:ApplyGuardrail` verfügen.
    </Warning>

  </Accordion>

  <Accordion title="Embeddings für Speichersuche">
    Bedrock kann auch als Embedding-Provider für die
    [Speichersuche](/de/concepts/memory-search) dienen. Dies wird getrennt vom
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
    SSO, Zugriffsschlüssel, gemeinsame Konfiguration und Web-Identität). Es ist kein API-Schlüssel
    erforderlich. Setzen Sie `memorySearch.provider: "bedrock"` ausdrücklich, um Bedrock-
    Embeddings zu verwenden.

    Zu den unterstützten Embedding-Modellen gehören Amazon Titan Embed (v1, v2), Amazon Nova
    Embed, Cohere Embed (v3, v4) und TwelveLabs Marengo. Siehe
    [Referenz zur Speicherkonfiguration -- Bedrock](/de/reference/memory-config#bedrock-embedding-config)
    für die vollständige Modellliste und Dimensionsoptionen.

  </Accordion>

  <Accordion title="Hinweise und Einschränkungen">
    - Bedrock erfordert, dass **Modellzugriff** in Ihrem AWS-Konto/Ihrer AWS-Region aktiviert ist.
    - Automatische Erkennung benötigt die Berechtigungen `bedrock:ListFoundationModels` und
      `bedrock:ListInferenceProfiles`.
    - Wenn Sie den Automodus verwenden, setzen Sie eine der unterstützten AWS-Auth-Env-Markierungen auf dem
      Gateway-Host. Wenn Sie IMDS-/Shared-Config-Authentifizierung ohne Env-Markierungen bevorzugen, setzen Sie
      `plugins.entries.amazon-bedrock.config.discovery.enabled: true`.
    - OpenClaw zeigt die Anmeldeinformationsquelle in dieser Reihenfolge an: `AWS_BEARER_TOKEN_BEDROCK`,
      dann `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`, dann `AWS_PROFILE`, dann die
      Standard-AWS-SDK-Kette.
    - Reasoning-Unterstützung hängt vom Modell ab; prüfen Sie die Bedrock-Modellkarte auf
      aktuelle Fähigkeiten.
    - Wenn Sie einen verwalteten Schlüsselablauf bevorzugen, können Sie auch einen OpenAI-kompatiblen
      Proxy vor Bedrock platzieren und ihn stattdessen als OpenAI-Provider konfigurieren.
  </Accordion>
</AccordionGroup>

## Verwandt

<CardGroup cols={2}>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Provider, Modell-Refs und Failover-Verhalten auswählen.
  </Card>
  <Card title="Speichersuche" href="/de/concepts/memory-search" icon="magnifying-glass">
    Bedrock-Embeddings für die Konfiguration der Speichersuche.
  </Card>
  <Card title="Referenz zur Speicherkonfiguration" href="/de/reference/memory-config#bedrock-embedding-config" icon="database">
    Vollständige Bedrock-Embedding-Modellliste und Dimensionsoptionen.
  </Card>
  <Card title="Fehlerbehebung" href="/de/help/troubleshooting" icon="wrench">
    Allgemeine Fehlerbehebung und FAQ.
  </Card>
</CardGroup>
