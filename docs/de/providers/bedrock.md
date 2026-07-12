---
read_when:
    - Sie möchten Amazon-Bedrock-Modelle mit OpenClaw verwenden
    - Für Modellaufrufe müssen AWS-Anmeldedaten und eine AWS-Region eingerichtet sein.
summary: Amazon-Bedrock-Modelle (Converse API) mit OpenClaw verwenden
title: Amazon Bedrock
x-i18n:
    generated_at: "2026-07-12T02:03:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fda4f5ab8ffcd68012cf78fbedb9fabec36d9742f16518ea4dd38418b2220b7b
    source_path: providers/bedrock.md
    workflow: 16
---

OpenClaw kann Modelle von **Amazon Bedrock** über seinen Streaming-Provider **Bedrock Converse**
verwenden. Die Bedrock-Authentifizierung verwendet die **Standard-Anmeldedatenkette des AWS SDK**,
keinen API-Schlüssel.

| Eigenschaft | Wert                                                               |
| ----------- | ------------------------------------------------------------------ |
| Provider    | `amazon-bedrock`                                                   |
| API         | `bedrock-converse-stream`                                          |
| Authentifizierung | AWS-Anmeldedaten (Umgebungsvariablen, gemeinsame Konfiguration oder Instanzrolle) |
| Region      | `AWS_REGION` oder `AWS_DEFAULT_REGION` (Standard: `us-east-1`)      |

## Erste Schritte

Wählen Sie Ihre bevorzugte Authentifizierungsmethode und führen Sie die Einrichtungsschritte aus.

<Tabs>
  <Tab title="Zugriffsschlüssel/Umgebungsvariablen">
    **Am besten geeignet für:** Entwicklerrechner, CI oder Hosts, auf denen Sie AWS-Anmeldedaten direkt verwalten.

    <Steps>
      <Step title="AWS-Anmeldedaten auf dem Gateway-Host festlegen">
        ```bash
        export AWS_ACCESS_KEY_ID="EXAMPLE_AWS_ACCESS_KEY_ID"
        export AWS_SECRET_ACCESS_KEY="..."
        export AWS_REGION="us-east-1"
        # Optional:
        export AWS_SESSION_TOKEN="..."
        export AWS_PROFILE="your-profile"
        # Optional (Bedrock-API-Schlüssel/Bearer-Token):
        export AWS_BEARER_TOKEN_BEDROCK="..."
        ```
      </Step>
      <Step title="Bedrock-Provider und Modell zur Konfiguration hinzufügen">
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
      <Step title="Verfügbarkeit der Modelle überprüfen">
        ```bash
        openclaw models list
        ```
      </Step>
    </Steps>

    <Tip>
    Bei der Authentifizierung über Umgebungsmarker (`AWS_ACCESS_KEY_ID`, `AWS_PROFILE` oder `AWS_BEARER_TOKEN_BEDROCK`) aktiviert OpenClaw den impliziten Bedrock-Provider für die Modellerkennung automatisch und ohne zusätzliche Konfiguration.
    </Tip>

  </Tab>

  <Tab title="EC2-Instanzrollen (IMDS)">
    **Am besten geeignet für:** EC2-Instanzen mit einer zugewiesenen IAM-Rolle, die den Instanzmetadatendienst zur Authentifizierung verwenden.

    <Steps>
      <Step title="Erkennung ausdrücklich aktivieren">
        Bei Verwendung von IMDS kann OpenClaw die AWS-Authentifizierung nicht allein anhand von Umgebungsmarkern erkennen. Daher müssen Sie sie ausdrücklich aktivieren:

        ```bash
        openclaw config set plugins.entries.amazon-bedrock.config.discovery.enabled true
        openclaw config set plugins.entries.amazon-bedrock.config.discovery.region us-east-1
        ```
      </Step>
      <Step title="Optional einen Umgebungsmarker für den automatischen Modus hinzufügen">
        Wenn auch die automatische Erkennung über Umgebungsmarker funktionieren soll, beispielsweise für Oberflächen von `openclaw status`:

        ```bash
        export AWS_PROFILE=default
        export AWS_REGION=us-east-1
        ```

        Sie benötigen **keinen** fingierten API-Schlüssel.
      </Step>
      <Step title="Erkennung der Modelle überprüfen">
        ```bash
        openclaw models list
        ```
      </Step>
    </Steps>

    <Warning>
    Die Ihrer EC2-Instanz zugewiesene IAM-Rolle muss über folgende Berechtigungen verfügen:

    - `bedrock:InvokeModel`
    - `bedrock:InvokeModelWithResponseStream`
    - `bedrock:ListFoundationModels` (für die automatische Erkennung)
    - `bedrock:ListInferenceProfiles` (für die Erkennung von Inferenzprofilen)

    Alternativ können Sie die verwaltete Richtlinie `AmazonBedrockFullAccess` zuweisen.
    </Warning>

    <Note>
    Sie benötigen `AWS_PROFILE=default` nur, wenn Sie ausdrücklich einen Umgebungsmarker für den automatischen Modus oder Statusoberflächen verwenden möchten. Der eigentliche Authentifizierungspfad der Bedrock-Laufzeit verwendet die Standardkette des AWS SDK. Daher funktioniert die Authentifizierung über IMDS-Instanzrollen auch ohne Umgebungsmarker.
    </Note>

  </Tab>
</Tabs>

## Automatische Modellerkennung

OpenClaw kann Bedrock-Modelle automatisch erkennen, die **Streaming**
und **Textausgabe** unterstützen. Die Erkennung verwendet `bedrock:ListFoundationModels` und
`bedrock:ListInferenceProfiles`; die Ergebnisse werden zwischengespeichert (Standard: 1 Stunde).

So wird der implizite Provider aktiviert:

- Wenn `plugins.entries.amazon-bedrock.config.discovery.enabled` auf `true` gesetzt ist,
  versucht OpenClaw die Erkennung auch dann, wenn kein AWS-Umgebungsmarker vorhanden ist.
- Wenn `plugins.entries.amazon-bedrock.config.discovery.enabled` nicht gesetzt ist,
  fügt OpenClaw den impliziten Bedrock-Provider nur dann automatisch hinzu,
  wenn einer dieser AWS-Authentifizierungsmarker vorhanden ist:
  `AWS_BEARER_TOKEN_BEDROCK`, `AWS_ACCESS_KEY_ID` +
  `AWS_SECRET_ACCESS_KEY` oder `AWS_PROFILE`.
- Der eigentliche Authentifizierungspfad der Bedrock-Laufzeit verwendet weiterhin die
  Standardkette des AWS SDK. Daher können gemeinsame Konfiguration, SSO und die
  Authentifizierung über IMDS-Instanzrollen auch dann funktionieren, wenn für die Erkennung
  eine ausdrückliche Aktivierung mit `enabled: true` erforderlich war.

<Note>
Bei ausdrücklichen Einträgen unter `models.providers["amazon-bedrock"]` kann OpenClaw die Authentifizierung über Bedrock-Umgebungsmarker wie `AWS_BEARER_TOKEN_BEDROCK` weiterhin frühzeitig anhand von AWS-Umgebungsmarkern auflösen, ohne das vollständige Laden der Laufzeitauthentifizierung zu erzwingen. Der eigentliche Authentifizierungspfad für Modellaufrufe verwendet weiterhin die Standardkette des AWS SDK.
</Note>

<AccordionGroup>
  <Accordion title="Konfigurationsoptionen für die Erkennung">
    Die Konfigurationsoptionen befinden sich unter `plugins.entries.amazon-bedrock.config.discovery`:

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
    | `enabled` | automatisch | Im automatischen Modus aktiviert OpenClaw den impliziten Bedrock-Provider nur, wenn ein unterstützter AWS-Umgebungsmarker vorhanden ist. Setzen Sie den Wert auf `true`, um die Erkennung zu erzwingen. |
    | `region` | `AWS_REGION` / `AWS_DEFAULT_REGION` / `us-east-1` | AWS-Region für API-Aufrufe zur Erkennung. |
    | `providerFilter` | (alle) | Gleicht Namen von Bedrock-Providern ab, beispielsweise `anthropic` und `amazon`. |
    | `refreshInterval` | `3600` | Cache-Dauer in Sekunden. Setzen Sie den Wert auf `0`, um die Zwischenspeicherung zu deaktivieren. |
    | `defaultContextWindow` | `32000` | Kontextfenster für erkannte Modelle ohne bekannte Token-Grenzen. Überschreiben Sie den Wert, wenn Ihnen die Grenzen Ihres Modells bekannt sind. |
    | `defaultMaxTokens` | `4096` | Maximale Anzahl an Ausgabe-Token für erkannte Modelle ohne bekannte Token-Grenzen. Überschreiben Sie den Wert, wenn Ihnen die Grenzen Ihres Modells bekannt sind. |

  </Accordion>

  <Accordion title="Kontextfenster und Grenzen für die maximale Token-Anzahl">
    Die Bedrock-APIs `ListFoundationModels` und `GetFoundationModel` geben keine
    Metadaten zu Token-Grenzen zurück, sondern nur Modell-ID, Name, Modalitäten und
    Lebenszyklusstatus. OpenClaw enthält eine Nachschlagetabelle mit bekannten Kontextfenstern
    und Ausgabegrenzen für verbreitete Bedrock-Modelle (Claude, Nova, Llama, Mistral, DeepSeek
    und weitere), damit Sitzungsverwaltung, Compaction-Schwellenwerte und
    die Erkennung von Kontextüberläufen für diese Modelle korrekt funktionieren.

    Erkannte Modelle, die nicht in der Tabelle enthalten sind, verwenden ersatzweise
    `defaultContextWindow` und `defaultMaxTokens`. Wenn für ein von Ihnen verwendetes Modell
    keine genauen Grenzen vorhanden sind, überschreiben Sie diese mit einem ausdrücklichen
    Eintrag unter `models.providers["amazon-bedrock"].models`.

  </Accordion>
</AccordionGroup>

## Schnelleinrichtung (AWS-Pfad)

Diese Anleitung erstellt eine IAM-Rolle, weist Bedrock-Berechtigungen zu, verknüpft
das Instanzprofil und aktiviert die OpenClaw-Erkennung auf dem EC2-Host.

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

# 3. Auf der EC2-Instanz die Erkennung ausdrücklich aktivieren
openclaw config set plugins.entries.amazon-bedrock.config.discovery.enabled true
openclaw config set plugins.entries.amazon-bedrock.config.discovery.region us-east-1

# 4. Optional: Umgebungsmarker hinzufügen, wenn Sie den automatischen Modus ohne ausdrückliche Aktivierung verwenden möchten
echo 'export AWS_PROFILE=default' >> ~/.bashrc
echo 'export AWS_REGION=us-east-1' >> ~/.bashrc
source ~/.bashrc

# 5. Erkennung der Modelle überprüfen
openclaw models list
```

## Erweiterte Konfiguration

<AccordionGroup>
  <Accordion title="Inferenzprofile">
    OpenClaw erkennt neben Basismodellen auch **regionale und globale Inferenzprofile**.
    Wenn ein Profil einem bekannten Basismodell zugeordnet ist, übernimmt das Profil
    dessen Fähigkeiten (Kontextfenster, maximale Token-Anzahl, logisches Schlussfolgern,
    Bildverarbeitung), und die richtige Bedrock-Anfrageregion wird automatisch eingefügt.
    Dadurch funktionieren regionsübergreifende Claude-Profile ohne manuelle
    Provider-Überschreibungen. Globale regionsübergreifende Profile (`global.*`) werden
    in `openclaw models list` zuerst aufgeführt, da sie in der Regel mehr Kapazität und
    einen automatischen Failover bieten.

    IDs von Inferenzprofilen sehen beispielsweise wie `us.anthropic.claude-opus-4-6-v1:0`
    (regional) oder `anthropic.claude-opus-4-6-v1:0` (global) aus. Wenn das zugrunde liegende
    Modell bereits in den Erkennungsergebnissen enthalten ist, übernimmt das Profil dessen
    vollständigen Funktionsumfang. Andernfalls gelten sichere Standardwerte.

    Es ist keine zusätzliche Konfiguration erforderlich. Solange die Erkennung aktiviert ist
    und der IAM-Prinzipal über `bedrock:ListInferenceProfiles` verfügt, werden Profile neben
    Basismodellen in `openclaw models list` angezeigt.

  </Accordion>

  <Accordion title="Dienststufe">
    Einige Bedrock-Modelle unterstützen den Parameter `service_tier`, um Kosten
    oder Latenz zu optimieren. Folgende Stufen sind verfügbar:

    | Stufe | Beschreibung |
    |------|--------------|
    | `default` | Standardstufe von Bedrock |
    | `flex` | Vergünstigte Verarbeitung für Arbeitslasten, die eine höhere Latenz tolerieren können |
    | `priority` | Priorisierte Verarbeitung für latenzempfindliche Arbeitslasten |
    | `reserved` | Reservierte Kapazität für Arbeitslasten im Dauerbetrieb |

    Legen Sie `serviceTier` (oder `service_tier`) über `agents.defaults.params` für
    Anfragen an Bedrock-Modelle oder modellspezifisch unter
    `agents.defaults.models["<model-key>"].params` fest:

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

    Gültige Werte sind `default`, `flex`, `priority` und `reserved`. Claude
    Fable 5 und Sonnet 5 unterstützen nur die Stufe `default`; OpenClaw warnt
    und ignoriert für diese Modelle angeforderte Werte wie `flex`, `priority`
    oder `reserved`. Bei anderen Modellen unterstützt nicht jedes Modell jede
    Stufe. Eine nicht unterstützte Stufe führt zu einem Bedrock-Validierungsfehler,
    dessen Fehlermeldung irreführend sein kann (beispielsweise „Die angegebene
    Modellkennung ist ungültig“, anstatt die Stufe als Problem zu benennen).
    Wenn dieser Fehler auftritt, prüfen Sie, ob das Modell die angeforderte
    Stufe unterstützt.

  </Accordion>

  <Accordion title="Claude Opus 4.7 and 4.8 temperature">
    Bedrock lehnt den Parameter `temperature` für Claude Opus 4.7 und Opus
    4.8 ab. OpenClaw lässt `temperature` bei jeder passenden Bedrock-Referenz
    automatisch weg, einschließlich Foundation-Model-IDs, benannter
    Inferenzprofile, Anwendungsinferenzprofile, deren zugrunde liegendes Modell
    über `bedrock:GetInferenceProfile` zu Opus 4.7/4.8 aufgelöst wird, sowie
    punktierter Varianten von `opus-4.7`/`opus-4.8` mit optionalen
    Regionspräfixen (`us.`, `eu.`, `ap.`, `apac.`, `au.`, `jp.`, `global.`).
    Es ist keine Konfigurationsoption erforderlich, und das Weglassen gilt
    sowohl für das Objekt mit den Anfrageoptionen als auch für das
    Nutzlastfeld `inferenceConfig`.
  </Accordion>

  <Accordion title="Claude Fable 5">
    Verwenden Sie `amazon-bedrock/anthropic.claude-fable-5` in `us-east-1`
    oder regionale Inferenz-IDs wie `us.anthropic.claude-fable-5`.
    OpenClaw wendet das Kontextfenster von Fable mit 1 Million Token, das
    Ausgabelimit von 128.000 Token, stets aktives adaptives Denken und die
    unterstützte Zuordnung der Aufwandsstufen an. `/think off` und
    `/think minimal` werden `low` zugeordnet; Temperatur und Steuerelemente
    für die erzwungene Werkzeugauswahl werden entsprechend dem Pfad für
    Opus 4.7/4.8 weggelassen. Die Streaming-Ausgabe wird zurückgehalten, bis
    Bedrock einen Endstatus zurückgibt, damit Ablehnungen während des Streams
    keinen Teiltext offenlegen.

    AWS verlangt eine ausdrückliche Einwilligung zur Datenspeicherung über
    `provider_data_share`, bevor Fable verfügbar ist. Eingaben und
    Vervollständigungen werden mit Anthropic geteilt und für Vertrauens- und
    Sicherheitszwecke bis zu 30 Tage gespeichert. Prüfen und konfigurieren Sie
    die [Datenspeicherung von Bedrock](https://docs.aws.amazon.com/bedrock/latest/userguide/data-retention.html),
    bevor Sie das Modell aktivieren.

  </Accordion>

  <Accordion title="Claude Mythos 5">
    Claude Mythos 5 ist über Bedrock nur für Konten mit der erforderlichen
    Genehmigung für eingeschränkten Zugriff verfügbar. OpenClaw erkennt das
    Foundation Model `anthropic.claude-mythos-5` sowie regionale oder globale
    Inferenzprofile wie `us.anthropic.claude-mythos-5`.

    OpenClaw wendet das Kontextfenster mit 1.000.000 Token, das Ausgabelimit
    von 128.000 Token, Bildeingaben, Prompt-Caching, ablehnungssicheres
    Streaming und native Aufwandsstufen an. Adaptives Denken ist stets
    aktiviert: `/think off` und `/think minimal` werden `low` zugeordnet,
    während `xhigh` und `max` weiterhin verfügbar sind. Benutzerdefinierte
    Sampling-Werte und Werte für die erzwungene Werkzeugauswahl werden
    weggelassen.

  </Accordion>

  <Accordion title="Claude Sonnet 5">
    AWS dokumentiert Sonnet 5 sowohl für die Endpunkte
    [`bedrock-runtime` als auch `bedrock-mantle`](https://docs.aws.amazon.com/bedrock/latest/userguide/model-card-anthropic-claude-sonnet-5.html).
    OpenClaw erkennt das Bedrock Foundation Model
    `anthropic.claude-sonnet-5` sowie regionale oder globale Inferenzprofile
    wie `us.anthropic.claude-sonnet-5`. Es wendet das Kontextfenster mit
    1.000.000 Token, das Ausgabelimit von 128.000 Token, Bildeingaben, native
    Aufwandsstufen, Prompt-Caching und ablehnungssicheres Streaming an.

    Bedrock lässt adaptives Denken für Sonnet 5 aktiviert. OpenClaw verwendet
    standardmäßig `high`; `/think off` und `/think minimal` werden `low`
    zugeordnet, da dieser Pfad das Denken nicht deaktivieren kann.
    Benutzerdefinierte Temperaturwerte und Werte für die erzwungene
    Werkzeugauswahl werden weggelassen, solange adaptives Denken aktiv ist.

  </Accordion>

  <Accordion title="Guardrails">
    Sie können [Amazon Bedrock Guardrails](https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails.html)
    auf alle Bedrock-Modellaufrufe anwenden, indem Sie der Konfiguration des
    Plugins `amazon-bedrock` ein `guardrail`-Objekt hinzufügen. Mit Guardrails
    können Sie Inhaltsfilterung, Themenblockierung, Wortfilter, Filter für
    sensible Informationen und Prüfungen der kontextbezogenen Fundierung
    durchsetzen.

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

    `guardrailIdentifier` und `guardrailVersion` sind erforderlich.

    | Option | Beschreibung |
    | ------ | ------------ |
    | `guardrailIdentifier` | Guardrail-ID (z. B. `abc123`) oder vollständiger ARN (z. B. `arn:aws:bedrock:us-east-1:123456789012:guardrail/abc123`). |
    | `guardrailVersion` | Veröffentlichte Versionsnummer oder `"DRAFT"` für den Arbeitsentwurf. |
    | `streamProcessingMode` | `"sync"` oder `"async"` für die Guardrail-Auswertung während des Streamings. Wenn die Option weggelassen wird, verwendet Bedrock seinen Standardwert. |
    | `trace` | `"enabled"` oder `"enabled_full"` zur Fehlerdiagnose; für den Produktivbetrieb weglassen oder auf `"disabled"` setzen. |

    <Warning>
    Der vom Gateway verwendete IAM-Prinzipal muss zusätzlich zu den standardmäßigen Aufrufberechtigungen über die Berechtigung `bedrock:ApplyGuardrail` verfügen.
    </Warning>

  </Accordion>

  <Accordion title="Embeddings for memory search">
    Bedrock kann auch als Embedding-Provider für die
    [Speichersuche](/de/concepts/memory-search) dienen. Dies wird getrennt vom
    Inferenz-Provider konfiguriert: Setzen Sie `agents.defaults.memorySearch.provider`
    auf `"bedrock"`:

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

    Bedrock-Embeddings verwenden dieselbe AWS-SDK-Anmeldedatenkette wie die
    Inferenz (Instanzrollen, SSO, Zugriffsschlüssel, gemeinsame Konfiguration
    und Webidentität). Es ist kein API-Schlüssel erforderlich.

    Zu den unterstützten Embedding-Modellen gehören Amazon Titan Embed (v1,
    v2), Amazon Nova Embed, Cohere Embed (v3, v4) und TwelveLabs Marengo. Die
    vollständige Modellliste und die Dimensionsoptionen finden Sie in der
    [Referenz zur Speicherkonfiguration – Bedrock](/de/reference/memory-config#bedrock-embedding-config).

  </Accordion>

  <Accordion title="Notes and caveats">
    - Für Bedrock muss der **Modellzugriff** in Ihrem AWS-Konto und Ihrer
      AWS-Region aktiviert sein.
    - Die automatische Erkennung benötigt die Berechtigungen
      `bedrock:ListFoundationModels` und `bedrock:ListInferenceProfiles`.
    - Wenn Sie den automatischen Modus verwenden, setzen Sie auf dem
      Gateway-Host eine der unterstützten AWS-Umgebungsmarkierungen für die
      Authentifizierung. Wenn Sie die Authentifizierung über IMDS oder eine
      gemeinsame Konfiguration ohne Umgebungsmarkierungen bevorzugen, setzen
      Sie `plugins.entries.amazon-bedrock.config.discovery.enabled: true`.
    - OpenClaw zeigt die Quelle der Anmeldedaten in dieser Reihenfolge an:
      `AWS_BEARER_TOKEN_BEDROCK`, danach `AWS_ACCESS_KEY_ID` +
      `AWS_SECRET_ACCESS_KEY`, danach `AWS_PROFILE` und schließlich die
      standardmäßige AWS-SDK-Kette.
    - Die Unterstützung für Schlussfolgerungen hängt vom Modell ab; prüfen Sie
      die Bedrock-Modellkarte auf aktuelle Funktionen.
    - Wenn Sie einen verwalteten Schlüsselablauf bevorzugen, können Sie auch
      einen OpenAI-kompatiblen Proxy vor Bedrock schalten und ihn stattdessen
      als OpenAI-Provider konfigurieren.
  </Accordion>
</AccordionGroup>

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Model selection" href="/de/concepts/model-providers" icon="layers">
    Auswahl von Providern, Modellreferenzen und Failover-Verhalten.
  </Card>
  <Card title="Memory search" href="/de/concepts/memory-search" icon="magnifying-glass">
    Bedrock-Embeddings für die Konfiguration der Speichersuche.
  </Card>
  <Card title="Memory config reference" href="/de/reference/memory-config#bedrock-embedding-config" icon="database">
    Vollständige Liste der Bedrock-Embedding-Modelle und Dimensionsoptionen.
  </Card>
  <Card title="Troubleshooting" href="/de/help/troubleshooting" icon="wrench">
    Allgemeine Fehlerbehebung und häufig gestellte Fragen.
  </Card>
</CardGroup>
