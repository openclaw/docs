---
read_when:
    - Sie möchten Amazon-Bedrock-Modelle mit OpenClaw verwenden
    - Sie müssen AWS-Anmeldedaten und die Region für Modellaufrufe einrichten
summary: Amazon-Bedrock-Modelle (Converse API) mit OpenClaw verwenden
title: Amazon Bedrock
x-i18n:
    generated_at: "2026-07-24T04:02:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: adbc97fd903fe61119c19ce2f14b1744d5a0c849f89cbf45237fb37935e812cd
    source_path: providers/bedrock.md
    workflow: 16
---

OpenClaw kann **Amazon Bedrock**-Modelle über seinen Streaming-Provider **Bedrock Converse**
verwenden. Die Bedrock-Authentifizierung verwendet die **AWS SDK-Standard-Anmeldedatenkette**,
keinen API-Schlüssel.

| Eigenschaft | Wert                                                       |
| -------- | ----------------------------------------------------------- |
| Provider | `amazon-bedrock`                                            |
| API      | `bedrock-converse-stream`                                   |
| Authentifizierung     | AWS-Anmeldedaten (Umgebungsvariablen, gemeinsame Konfiguration oder Instanzrolle) |
| Region   | `AWS_REGION` oder `AWS_DEFAULT_REGION` (Standard: `us-east-1`) |

## Erste Schritte

Wählen Sie Ihre bevorzugte Authentifizierungsmethode und führen Sie die Einrichtungsschritte aus.

<Tabs>
  <Tab title="Zugriffsschlüssel/Umgebungsvariablen">
    **Am besten geeignet für:** Entwicklungsrechner, CI oder Hosts, auf denen Sie AWS-Anmeldedaten direkt verwalten.

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
      <Step title="Bedrock-Provider und -Modell zur Konfiguration hinzufügen">
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
                    id: "us.anthropic.claude-opus-4-6-v1",
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
              model: { primary: "amazon-bedrock/us.anthropic.claude-opus-4-6-v1" },
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
      <Step title="Erkennung explizit aktivieren">
        Bei Verwendung von IMDS kann OpenClaw die AWS-Authentifizierung nicht allein anhand von Umgebungsmarkern erkennen. Daher müssen Sie sie explizit aktivieren:

        ```bash
        openclaw config set plugins.entries.amazon-bedrock.config.discovery.enabled true
        openclaw config set plugins.entries.amazon-bedrock.config.discovery.region us-east-1
        ```
      </Step>
      <Step title="Optional einen Umgebungsmarker für den automatischen Modus hinzufügen">
        Wenn zusätzlich die automatische Erkennung über Umgebungsmarker funktionieren soll (beispielsweise für `openclaw status`-Oberflächen):

        ```bash
        export AWS_PROFILE=default
        export AWS_REGION=us-east-1
        ```

        Sie benötigen **keinen** vorgetäuschten API-Schlüssel.
      </Step>
      <Step title="Erkennung der Modelle überprüfen">
        ```bash
        openclaw models list
        ```
      </Step>
    </Steps>

    <Warning>
    Die Ihrer EC2-Instanz zugewiesene IAM-Rolle muss über die folgenden Berechtigungen verfügen:

    - `bedrock:InvokeModel`
    - `bedrock:InvokeModelWithResponseStream`
    - `bedrock:ListFoundationModels` (für die automatische Erkennung)
    - `bedrock:ListInferenceProfiles` (für die Erkennung von Inferenzprofilen)

    Alternativ können Sie die verwaltete Richtlinie `AmazonBedrockFullAccess` zuweisen.
    </Warning>

    <Note>
    Sie benötigen `AWS_PROFILE=default` nur, wenn Sie ausdrücklich einen Umgebungsmarker für den automatischen Modus oder Statusoberflächen verwenden möchten. Der eigentliche Bedrock-Laufzeitpfad für die Authentifizierung verwendet die AWS SDK-Standardkette. Daher funktioniert die Authentifizierung über eine IMDS-Instanzrolle auch ohne Umgebungsmarker.
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
  wenn einer der folgenden AWS-Authentifizierungsmarker erkannt wird:
  `AWS_BEARER_TOKEN_BEDROCK`, `AWS_ACCESS_KEY_ID` +
  `AWS_SECRET_ACCESS_KEY` oder `AWS_PROFILE`.
- Der eigentliche Bedrock-Laufzeitpfad für die Authentifizierung verwendet weiterhin die AWS SDK-Standardkette. Daher können
  eine gemeinsame Konfiguration, SSO und die Authentifizierung über eine IMDS-Instanzrolle auch dann funktionieren, wenn für die Erkennung
  `enabled: true` zur expliziten Aktivierung erforderlich war.

<Note>
Bei expliziten `models.providers["amazon-bedrock"]`-Einträgen kann OpenClaw die Bedrock-Authentifizierung über Umgebungsmarker weiterhin frühzeitig anhand von AWS-Umgebungsmarkern wie `AWS_BEARER_TOKEN_BEDROCK` auflösen, ohne das vollständige Laden der Laufzeitauthentifizierung zu erzwingen. Der eigentliche Authentifizierungspfad für Modellaufrufe verwendet weiterhin die AWS SDK-Standardkette.
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
    | ------ | ------- | ----------- |
    | `enabled` | automatisch | Im automatischen Modus aktiviert OpenClaw den impliziten Bedrock-Provider nur, wenn ein unterstützter AWS-Umgebungsmarker erkannt wird. Setzen Sie `true`, um die Erkennung zu erzwingen. |
    | `region` | `AWS_REGION` / `AWS_DEFAULT_REGION` / `us-east-1` | Für API-Aufrufe zur Erkennung verwendete AWS-Region. |
    | `providerFilter` | (alle) | Gleicht Namen von Bedrock-Providern ab (beispielsweise `anthropic`, `amazon`). |
    | `refreshInterval` | `3600` | Cache-Dauer in Sekunden. Setzen Sie den Wert auf `0`, um die Zwischenspeicherung zu deaktivieren. |
    | `defaultContextWindow` | `32000` | Für erkannte Modelle ohne bekannte Token-Limits verwendetes Kontextfenster (überschreiben Sie den Wert, wenn Ihnen die Limits Ihres Modells bekannt sind). |
    | `defaultMaxTokens` | `4096` | Für erkannte Modelle ohne bekannte Token-Limits verwendete maximale Anzahl an Ausgabe-Token (überschreiben Sie den Wert, wenn Ihnen die Limits Ihres Modells bekannt sind). |

  </Accordion>

  <Accordion title="Kontextfenster und maximale Token-Limits">
    Die Bedrock-APIs `ListFoundationModels` und `GetFoundationModel` geben keine
    Metadaten zu Token-Limits zurück, sondern nur Modell-ID, Name, Modalitäten und
    Lebenszyklusstatus. OpenClaw enthält eine Nachschlagetabelle mit bekannten Kontextfenstern und
    Ausgabelimits für verbreitete Bedrock-Modelle (Claude, Nova, Llama, Mistral, DeepSeek
    und weitere), damit Sitzungsverwaltung, Compaction-Schwellenwerte und
    die Erkennung von Kontextüberläufen bei diesen Modellen korrekt funktionieren.

    Für erkannte Modelle, die nicht in der Tabelle enthalten sind, werden ersatzweise `defaultContextWindow`
    und `defaultMaxTokens` verwendet. Wenn für ein von Ihnen verwendetes Modell keine genauen Limits
    vorhanden sind, überschreiben Sie diese mit einem expliziten
    `models.providers["amazon-bedrock"].models`-Eintrag.

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

# 2. Der EC2-Instanz zuweisen
aws ec2 associate-iam-instance-profile \
  --instance-id i-xxxxx \
  --iam-instance-profile Name=EC2-Bedrock-Access

# 3. Auf der EC2-Instanz die Erkennung explizit aktivieren
openclaw config set plugins.entries.amazon-bedrock.config.discovery.enabled true
openclaw config set plugins.entries.amazon-bedrock.config.discovery.region us-east-1

# 4. Optional: Umgebungsmarker hinzufügen, wenn Sie den automatischen Modus ohne explizite Aktivierung verwenden möchten
echo 'export AWS_PROFILE=default' >> ~/.bashrc
echo 'export AWS_REGION=us-east-1' >> ~/.bashrc
source ~/.bashrc

# 5. Erkennung der Modelle überprüfen
openclaw models list
```

## Erweiterte Konfiguration

<AccordionGroup>
  <Accordion title="Inferenzprofile">
    OpenClaw erkennt **regionale und globale Inferenzprofile** zusammen mit
    Basismodellen. Wenn ein Profil einem bekannten Basismodell zugeordnet ist,
    übernimmt es die Fähigkeiten dieses Modells (Kontextfenster, maximale Token-Anzahl,
    Schlussfolgern, Bildverarbeitung), und die korrekte Bedrock-Anfrageregion wird
    automatisch eingefügt. Dadurch funktionieren regionsübergreifende Claude-Profile ohne manuelle
    Provider-Überschreibungen. Globale regionsübergreifende Profile (`global.*`) werden
    in `openclaw models list` zuerst aufgeführt, da sie in der Regel eine höhere Kapazität
    und automatisches Failover bieten.

    Inferenzprofil-IDs sehen wie `us.anthropic.claude-opus-4-6-v1` (regional)
    oder `anthropic.claude-opus-4-6-v1` (global) aus. Wenn das zugrunde liegende Modell bereits
    in den Erkennungsergebnissen enthalten ist, übernimmt das Profil dessen vollständigen Funktionsumfang;
    andernfalls gelten sichere Standardwerte.

    Es ist keine zusätzliche Konfiguration erforderlich. Solange die Erkennung aktiviert ist und der IAM-
    Prinzipal über `bedrock:ListInferenceProfiles` verfügt, erscheinen Profile zusammen mit
    Basismodellen in `openclaw models list`.

  </Accordion>

  <Accordion title="Service-Tier">
    Einige Bedrock-Modelle unterstützen einen `service_tier`-Parameter zur Optimierung von Kosten
    oder Latenz. Die folgenden Tiers sind verfügbar:

    | Tier | Beschreibung |
    |------|-------------|
    | `default` | Standardmäßiger Bedrock-Tier |
    | `flex` | Vergünstigte Verarbeitung für Workloads, die eine längere Latenz tolerieren können |
    | `priority` | Priorisierte Verarbeitung für latenzempfindliche Workloads |
    | `reserved` | Reservierte Kapazität für Workloads im stabilen Betrieb |

    Legen Sie `serviceTier` (oder `service_tier`) über `agents.defaults.params` für
    Bedrock-Modellanfragen oder je Modell in
    `agents.defaults.models["<model-key>"].params` fest:

    ```json5
    {
      agents: {
        defaults: {
          params: {
            serviceTier: "flex", // gilt für alle Modelle
          },
          models: {
            "amazon-bedrock/mistral.mistral-large-3-675b-instruct": {
              params: {
                serviceTier: "priority", // Überschreibung je Modell
              },
            },
          },
        },
      },
    }
    ```

    Gültige Werte sind `default`, `flex`, `priority` und `reserved`. Claude
    Fable 5 und Sonnet 5 unterstützen nur die Stufe `default`; OpenClaw warnt und
    ignoriert für diese Modelle angeforderte Werte von `flex`, `priority` oder `reserved`. Bei
    anderen Modellen unterstützt nicht jedes Modell jede Stufe – eine nicht unterstützte Stufe
    führt zu einem Bedrock-Validierungsfehler, dessen Fehlermeldung
    irreführend sein kann (zum Beispiel „Die angegebene Modellkennung ist ungültig“,
    statt die Stufe als Ursache zu nennen). Wenn dieser Fehler auftritt, prüfen Sie,
    ob das Modell die angeforderte Stufe unterstützt.

  </Accordion>

  <Accordion title="Temperatur bei Claude Opus 4.7 und 4.8">
    Bedrock lehnt den Parameter `temperature` für Claude Opus 4.7 und Opus
    4.8 ab. OpenClaw lässt `temperature` automatisch bei jeder passenden Bedrock-
    Referenz weg, einschließlich Foundation-Modell-IDs, benannter Inferenzprofile und Anwendungs-
    Inferenzprofile, deren zugrunde liegendes Modell über
    `bedrock:GetInferenceProfile` zu Opus 4.7/4.8 aufgelöst wird, sowie gepunkteter Varianten von `opus-4.7`/`opus-4.8`
    mit optionalen Regionspräfixen (`us.`, `eu.`, `ap.`, `apac.`, `au.`, `jp.`,
    `global.`). Es ist keine Konfigurationsoption erforderlich, und das Weglassen gilt sowohl
    für das Objekt mit den Anfrageoptionen als auch für das Payload-Feld `inferenceConfig`.
  </Accordion>

  <Accordion title="Claude Fable 5">
    Verwenden Sie `amazon-bedrock/anthropic.claude-fable-5` in `us-east-1` oder
    regionale Inferenz-IDs wie `us.anthropic.claude-fable-5`.
    OpenClaw wendet das 1M-Kontextfenster, das Ausgabelimit von 128K, das stets aktive
    adaptive Denken und die unterstützte Zuordnung des Aufwands von Fable an. `/think off` und
    `/think minimal` werden `low` zugeordnet; Temperatur und Steuerelemente für die erzwungene Werkzeugauswahl
    werden weggelassen, entsprechend der Route von Opus 4.7/4.8. Die Streaming-Ausgabe wird zurückgehalten,
    bis Bedrock einen Endstatus zurückgibt, damit Ablehnungen während des Streams keinen
    Teiltext offenlegen.

    AWS erfordert eine ausdrückliche Zustimmung zur Datenspeicherung über `provider_data_share`,
    bevor Fable verfügbar ist. Prompts und Vervollständigungen werden mit Anthropic geteilt und
    zu Vertrauens- und Sicherheitszwecken bis zu 30 Tage gespeichert. Prüfen und konfigurieren Sie
    die [Bedrock-Datenspeicherung](https://docs.aws.amazon.com/bedrock/latest/userguide/data-retention.html),
    bevor Sie das Modell aktivieren.

  </Accordion>

  <Accordion title="Claude Mythos 5">
    Claude Mythos 5 ist über Bedrock nur für Konten mit der
    erforderlichen Genehmigung für eingeschränkten Zugriff verfügbar. OpenClaw erkennt das Foundation-Modell
    `anthropic.claude-mythos-5` sowie regionale oder globale Inferenzprofile wie
    `us.anthropic.claude-mythos-5`.

    OpenClaw wendet das Kontextfenster mit 1.000.000 Token, das Ausgabelimit
    von 128.000 Token, Bildeingaben, Prompt-Caching, ablehnungssicheres Streaming und native
    Aufwandsstufen an. Adaptives Denken ist immer aktiviert: `/think off` und
    `/think minimal` werden `low` zugeordnet, während `xhigh` und `max` verfügbar bleiben.
    Benutzerdefinierte Sampling-Werte und Werte für die erzwungene Werkzeugauswahl werden weggelassen.

  </Accordion>

  <Accordion title="Claude Sonnet 5">
    AWS dokumentiert Sonnet 5 sowohl für die
    Endpunkte [`bedrock-runtime` und `bedrock-mantle`](https://docs.aws.amazon.com/bedrock/latest/userguide/model-card-anthropic-claude-sonnet-5.html).
    OpenClaw erkennt das Bedrock-Foundation-Modell
    `anthropic.claude-sonnet-5` sowie regionale oder globale Inferenzprofile wie
    `us.anthropic.claude-sonnet-5`. Es wendet das Kontextfenster mit 1.000.000 Token,
    das Ausgabelimit von 128.000 Token, Bildeingaben, native Aufwandsstufen,
    Prompt-Caching und ablehnungssicheres Streaming an.

    Bedrock lässt adaptives Denken für Sonnet 5 aktiviert. OpenClaw verwendet standardmäßig
    `high`; `/think off` und `/think minimal` werden `low` zugeordnet, da diese Route
    das Denken nicht deaktivieren kann. Benutzerdefinierte Temperaturwerte und Werte für die erzwungene Werkzeugauswahl
    werden weggelassen, solange adaptives Denken aktiv ist.

  </Accordion>

  <Accordion title="Schutzmechanismen">
    Sie können [Amazon Bedrock Guardrails](https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails.html)
    auf alle Aufrufe von Bedrock-Modellen anwenden, indem Sie der Plugin-Konfiguration
    `amazon-bedrock` ein Objekt `guardrail` hinzufügen. Mit Schutzmechanismen können Sie Inhaltsfilterung,
    die Ablehnung von Themen, Wortfilter, Filter für vertrauliche Informationen und Prüfungen
    der kontextbezogenen Fundierung durchsetzen.

    ```json5
    {
      plugins: {
        entries: {
          "amazon-bedrock": {
            config: {
              guardrail: {
                guardrailIdentifier: "abc123", // Schutzmechanismus-ID oder vollständiger ARN
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

    `guardrailIdentifier` und `guardrailVersion` sind erforderlich.

    | Option | Beschreibung |
    | ------ | ------------ |
    | `guardrailIdentifier` | Schutzmechanismus-ID (z. B. `abc123`) oder vollständiger ARN (z. B. `arn:aws:bedrock:us-east-1:123456789012:guardrail/abc123`). |
    | `guardrailVersion` | Veröffentlichte Versionsnummer oder `"DRAFT"` für den Arbeitsentwurf. |
    | `streamProcessingMode` | `"sync"` oder `"async"` für die Auswertung des Schutzmechanismus während des Streamings. Wenn die Option weggelassen wird, verwendet Bedrock den Standardwert. |
    | `trace` | `"enabled"` oder `"enabled_full"` zum Debuggen; für die Produktion weglassen oder auf `"disabled"` setzen. |

    <Warning>
    Der vom Gateway verwendete IAM-Principal muss zusätzlich zu den standardmäßigen Aufrufberechtigungen über die Berechtigung `bedrock:ApplyGuardrail` verfügen.
    </Warning>

  </Accordion>

  <Accordion title="Einbettungen für die Speichersuche">
    Bedrock kann auch als Einbettungs-Provider für die
    [Speichersuche](/de/concepts/memory-search) dienen. Dies wird getrennt vom
    Inferenz-Provider konfiguriert – setzen Sie `memory.search.provider` auf `"bedrock"`:

    ```json5
    {
      memory: {
        search: {
          provider: "bedrock",
          model: "amazon.titan-embed-text-v2:0", // Standardwert
        },
      },
    }
    ```

    Bedrock-Einbettungen verwenden dieselbe AWS-SDK-Anmeldedatenkette wie die Inferenz (Instanz-
    rollen, SSO, Zugriffsschlüssel, gemeinsame Konfiguration und Webidentität). Es ist kein API-Schlüssel
    erforderlich.

    Zu den unterstützten Einbettungsmodellen gehören Amazon Titan Embed (v1, v2), Amazon Nova
    Embed, Cohere Embed (v3, v4) und TwelveLabs Marengo. Die vollständige Modellliste
    und die Dimensionsoptionen finden Sie in der
    [Referenz zur Speicherkonfiguration – Bedrock](/de/reference/memory-config#bedrock-embedding-config).

  </Accordion>

  <Accordion title="Hinweise und Einschränkungen">
    - Bedrock erfordert, dass der **Modellzugriff** in Ihrem AWS-Konto/Ihrer AWS-Region aktiviert ist.
    - Die automatische Erkennung benötigt die Berechtigungen `bedrock:ListFoundationModels` und
      `bedrock:ListInferenceProfiles`.
    - Wenn Sie den automatischen Modus verwenden, setzen Sie auf dem Gateway-Host eine der unterstützten
      AWS-Authentifizierungs-Umgebungsmarkierungen. Wenn Sie eine IMDS-/Shared-Config-Authentifizierung ohne Umgebungsmarkierungen bevorzugen, setzen Sie
      `plugins.entries.amazon-bedrock.config.discovery.enabled: true`.
    - OpenClaw zeigt die Anmeldedatenquelle in dieser Reihenfolge an: `AWS_BEARER_TOKEN_BEDROCK`,
      dann `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`, dann `AWS_PROFILE`, anschließend die
      standardmäßige AWS-SDK-Kette.
    - Die Unterstützung für logisches Denken hängt vom Modell ab; prüfen Sie die Bedrock-Modellkarte auf
      aktuelle Funktionen.
    - Wenn Sie einen verwalteten Schlüsselfluss bevorzugen, können Sie auch einen OpenAI-kompatiblen
      Proxy vor Bedrock platzieren und ihn stattdessen als OpenAI-Provider konfigurieren.
  </Accordion>
</AccordionGroup>

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Auswahl von Providern, Modellreferenzen und Failover-Verhalten.
  </Card>
  <Card title="Speichersuche" href="/de/concepts/memory-search" icon="magnifying-glass">
    Bedrock-Einbettungen für die Konfiguration der Speichersuche.
  </Card>
  <Card title="Referenz zur Speicherkonfiguration" href="/de/reference/memory-config#bedrock-embedding-config" icon="database">
    Vollständige Liste der Bedrock-Einbettungsmodelle und Dimensionsoptionen.
  </Card>
  <Card title="Fehlerbehebung" href="/de/help/troubleshooting" icon="wrench">
    Allgemeine Fehlerbehebung und häufig gestellte Fragen.
  </Card>
</CardGroup>
