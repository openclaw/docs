---
read_when:
    - Sie möchten Moonshot K2 (Moonshot Open Platform) oder Kimi Coding einrichten
    - Sie müssen separate Endpunkte, Schlüssel und Modellreferenzen verstehen.
    - Sie möchten eine Konfiguration zum Kopieren und Einfügen für einen der beiden Provider.
summary: Moonshot K2 im Vergleich zu Kimi Coding konfigurieren (separate Provider und Schlüssel)
title: Moonshot AI
x-i18n:
    generated_at: "2026-07-12T15:48:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: c917a595337fc2138601245f4c7055815859dfa3b2ddf90a56c980a7a4e09744
    source_path: providers/moonshot.md
    workflow: 16
---

Moonshot stellt die Kimi API über OpenAI-kompatible Endpunkte bereit. Legen Sie
für die Moonshot Open Platform `moonshot/kimi-k2.6` oder für Kimi Coding
`kimi/kimi-for-coding` als Standardmodell fest.

<Warning>
Moonshot und Kimi Coding sind **separate Provider**, die jeweils als eigenes externes Plugin ausgeliefert werden. Die Schlüssel sind nicht austauschbar, die Endpunkte unterscheiden sich und die Modellreferenzen sind verschieden (`moonshot/...` gegenüber `kimi/...`).
</Warning>

## Integrierter Modellkatalog

[//]: # "moonshot-kimi-k2-ids:start"

| Modellreferenz                    | Name                   | Reasoning   | Eingabe     | Kontext | Max. Ausgabe |
| --------------------------------- | ---------------------- | ----------- | ----------- | ------- | ------------ |
| `moonshot/kimi-k2.6`              | Kimi K2.6              | Nein        | Text, Bild  | 262,144 | 262,144      |
| `moonshot/kimi-k2.7-code`         | Kimi K2.7 Code         | Immer aktiv | Text, Bild  | 262,144 | 262,144      |
| `moonshot/kimi-k2.5`              | Kimi K2.5              | Nein        | Text, Bild  | 262,144 | 262,144      |
| `moonshot/kimi-k2-thinking`       | Kimi K2 Thinking       | Ja          | Text        | 262,144 | 262,144      |
| `moonshot/kimi-k2-thinking-turbo` | Kimi K2 Thinking Turbo | Ja          | Text        | 262,144 | 262,144      |
| `moonshot/kimi-k2-turbo`          | Kimi K2 Turbo          | Nein        | Text        | 256,000 | 16,384       |

[//]: # "moonshot-kimi-k2-ids:end"

Die Kostenschätzungen im Katalog verwenden die von Moonshot veröffentlichten
Pay-as-you-go-Tarife: Kimi K2.7 Code kostet $0.19/MTok bei Cache-Treffern,
$0.95/MTok für die Eingabe und $4.00/MTok für die Ausgabe; Kimi K2.6 kostet
$0.16/MTok bei Cache-Treffern, $0.95/MTok für die Eingabe und $4.00/MTok für
die Ausgabe; Kimi K2.5 kostet $0.10/MTok bei Cache-Treffern, $0.60/MTok für
die Eingabe und $3.00/MTok für die Ausgabe. Andere Katalogeinträge behalten
Platzhalter für kostenfreie Nutzung bei, sofern Sie diese nicht in der
Konfiguration überschreiben.

Kimi K2.7 Code verwendet immer natives Thinking. OpenClaw stellt für dieses
Modell nur den Thinking-Status `on` bereit und lässt die ausgehenden Felder
`thinking` und `reasoning_effort` entsprechend den Anforderungen von Moonshot
weg. Außerdem werden Sampling-Überschreibungen (`temperature`, `top_p`, `n`,
`presence_penalty`, `frequency_penalty`) weggelassen, da K2.7 diese auf die
Standardeinstellungen des Providers festlegt. Kimi K2.6 bleibt das
Standardmodell für das Onboarding.

## Erste Schritte

Moonshot und Kimi Coding sind externe Plugins. Installieren Sie eines davon,
bevor Sie das Onboarding durchführen.

<Tabs>
  <Tab title="Moonshot API">
    **Am besten geeignet für:** Kimi-K2-Modelle über die Moonshot Open Platform.

    <Steps>
      <Step title="Plugin installieren">
        ```bash
        openclaw plugins install @openclaw/moonshot-provider
        openclaw gateway restart
        ```
      </Step>
      <Step title="Endpunktregion auswählen">
        | Authentifizierungsoption | Endpunkt                       | Region        |
        | ------------------------ | ------------------------------ | ------------- |
        | `moonshot-api-key`       | `https://api.moonshot.ai/v1`   | International |
        | `moonshot-api-key-cn`    | `https://api.moonshot.cn/v1`   | China         |
      </Step>
      <Step title="Onboarding ausführen">
        ```bash
        openclaw onboard --auth-choice moonshot-api-key
        ```

        Oder für den Endpunkt in China:

        ```bash
        openclaw onboard --auth-choice moonshot-api-key-cn
        ```
      </Step>
      <Step title="Standardmodell festlegen">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "moonshot/kimi-k2.6" },
            },
          },
        }
        ```
      </Step>
      <Step title="Verfügbarkeit der Modelle überprüfen">
        ```bash
        openclaw models list --provider moonshot
        ```
      </Step>
      <Step title="Live-Smoke-Test ausführen">
        Verwenden Sie ein isoliertes Zustandsverzeichnis, wenn Sie den
        Modellzugriff und die Kostenerfassung überprüfen möchten, ohne Ihre
        normalen Sitzungen zu verändern:

        ```bash
        OPENCLAW_CONFIG_PATH=/tmp/openclaw-kimi/openclaw.json \
        OPENCLAW_STATE_DIR=/tmp/openclaw-kimi \
        openclaw agent --local \
          --session-id live-kimi-cost \
          --message 'Reply exactly: KIMI_LIVE_OK' \
          --thinking off \
          --json
        ```

        Die JSON-Antwort sollte `provider: "moonshot"` und
        `model: "kimi-k2.6"` melden. Der Transkripteintrag des Assistenten
        speichert die normalisierte Token-Nutzung sowie die geschätzten Kosten
        unter `usage.cost`, wenn Moonshot Nutzungsmetadaten zurückgibt.
      </Step>
    </Steps>

    ### Konfigurationsbeispiel

    ```json5
    {
      env: { MOONSHOT_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "moonshot/kimi-k2.6" },
          models: {
            // moonshot-kimi-k2-aliases:start
            "moonshot/kimi-k2.6": { alias: "Kimi K2.6" },
            "moonshot/kimi-k2.7-code": { alias: "Kimi K2.7 Code" },
            "moonshot/kimi-k2.5": { alias: "Kimi K2.5" },
            "moonshot/kimi-k2-thinking": { alias: "Kimi K2 Thinking" },
            "moonshot/kimi-k2-thinking-turbo": { alias: "Kimi K2 Thinking Turbo" },
            "moonshot/kimi-k2-turbo": { alias: "Kimi K2 Turbo" },
            // moonshot-kimi-k2-aliases:end
          },
        },
      },
      models: {
        mode: "merge",
        providers: {
          moonshot: {
            baseUrl: "https://api.moonshot.ai/v1",
            apiKey: "${MOONSHOT_API_KEY}",
            api: "openai-completions",
            models: [
              // moonshot-kimi-k2-models:start
              {
                id: "kimi-k2.6",
                name: "Kimi K2.6",
                reasoning: false,
                input: ["text", "image"],
                cost: { input: 0.95, output: 4, cacheRead: 0.16, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
              {
                id: "kimi-k2.7-code",
                name: "Kimi K2.7 Code",
                reasoning: true,
                input: ["text", "image"],
                cost: { input: 0.95, output: 4, cacheRead: 0.19, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
              {
                id: "kimi-k2.5",
                name: "Kimi K2.5",
                reasoning: false,
                input: ["text", "image"],
                cost: { input: 0.6, output: 3, cacheRead: 0.1, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
              {
                id: "kimi-k2-thinking",
                name: "Kimi K2 Thinking",
                reasoning: true,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
              {
                id: "kimi-k2-thinking-turbo",
                name: "Kimi K2 Thinking Turbo",
                reasoning: true,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
              {
                id: "kimi-k2-turbo",
                name: "Kimi K2 Turbo",
                reasoning: false,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 256000,
                maxTokens: 16384,
              },
              // moonshot-kimi-k2-models:end
            ],
          },
        },
      },
    }
    ```

  </Tab>

  <Tab title="Kimi Coding">
    **Am besten geeignet für:** codeorientierte Aufgaben über den Endpunkt von Kimi Coding.

    <Note>
    Kimi Coding verwendet einen anderen API-Schlüssel und ein anderes Provider-Präfix (`kimi/...`) als Moonshot (`moonshot/...`). Die stabile Modellreferenz lautet `kimi/kimi-for-coding`; die älteren Referenzen `kimi/kimi-code` und `kimi/k2p5` werden weiterhin akzeptiert und auf diese Modell-ID normalisiert.
    </Note>

    <Steps>
      <Step title="Plugin installieren">
        ```bash
        openclaw plugins install @openclaw/kimi-provider
        openclaw gateway restart
        ```
      </Step>
      <Step title="Onboarding ausführen">
        ```bash
        openclaw onboard --auth-choice kimi-code-api-key
        ```
      </Step>
      <Step title="Standardmodell festlegen">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "kimi/kimi-for-coding" },
            },
          },
        }
        ```
      </Step>
      <Step title="Verfügbarkeit des Modells überprüfen">
        ```bash
        openclaw models list --provider kimi
        ```
      </Step>
    </Steps>

    ### Konfigurationsbeispiel

    ```json5
    {
      env: { KIMI_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "kimi/kimi-for-coding" },
          models: {
            "kimi/kimi-for-coding": { alias: "Kimi" },
          },
        },
      },
    }
    ```

  </Tab>
</Tabs>

## Kimi-Websuche

Das Moonshot-Plugin registriert außerdem **Kimi** als `web_search`-Provider,
der die Websuche von Moonshot verwendet.

<Steps>
  <Step title="Interaktive Einrichtung der Websuche ausführen">
    ```bash
    openclaw configure --section web
    ```

    Wählen Sie im Abschnitt für die Websuche **Kimi** aus, um
    `plugins.entries.moonshot.config.webSearch.*` zu speichern.

  </Step>
  <Step title="Region und Modell für die Websuche konfigurieren">
    Die interaktive Einrichtung fragt Folgendes ab:

    | Einstellung       | Optionen                                                              |
    | ----------------- | --------------------------------------------------------------------- |
    | API-Region        | `https://api.moonshot.ai/v1` (international) oder `https://api.moonshot.cn/v1` (China) |
    | Websuchmodell     | Standardmäßig `kimi-k2.6`                                             |

  </Step>
</Steps>

Die Konfiguration befindet sich unter `plugins.entries.moonshot.config.webSearch`:

```json5
{
  plugins: {
    entries: {
      moonshot: {
        config: {
          webSearch: {
            apiKey: "sk-...", // oder KIMI_API_KEY / MOONSHOT_API_KEY verwenden
            baseUrl: "https://api.moonshot.ai/v1",
            model: "kimi-k2.6",
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "kimi",
      },
    },
  },
}
```

## Erweiterte Konfiguration

<AccordionGroup>
  <Accordion title="Nativer Thinking-Modus">
    Kimi K2.7 Code verwendet immer natives Thinking. Moonshot verlangt, dass
    Clients das Feld `thinking` für dieses Modell weglassen. Daher stellt
    OpenClaw nur `on` bereit und ignoriert veraltete `off`-Einstellungen.
    K2.7 legt außerdem `temperature`, `top_p`, `n`, `presence_penalty` und
    `frequency_penalty` fest; OpenClaw lässt konfigurierte Überschreibungen
    für diese Felder weg.

    Andere Kimi-Modelle von Moonshot unterstützen binäres natives Thinking:

    - `thinking: { type: "enabled" }`
    - `thinking: { type: "disabled" }`

    Konfigurieren Sie es pro Modell über `agents.defaults.models.<provider/model>.params`:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "moonshot/kimi-k2.6": {
              params: {
                thinking: { type: "disabled" },
              },
            },
          },
        },
      },
    }
    ```

    OpenClaw ordnet die `/think`-Stufen zur Laufzeit für diese Modelle wie folgt zu:

    | `/think`-Stufe       | Verhalten von Moonshot     |
    | -------------------- | -------------------------- |
    | `/think off`         | `thinking.type=disabled`   |
    | Jede andere Stufe    | `thinking.type=enabled`    |

    <Warning>
    Wenn Thinking für Moonshot aktiviert ist, muss `tool_choice` den Wert `auto` oder `none` haben. Eine fest vorgegebene Werkzeugauswahl (`type: "tool"` oder `type: "function"`) setzt Thinking stattdessen wieder auf `disabled`, damit das angeforderte Werkzeug weiterhin ausgeführt wird; `tool_choice: "required"` wird stattdessen auf `auto` normalisiert. Dies gilt für jedes Moonshot-Modell außer Kimi K2.7 Code, dessen Thinking-Modus nicht deaktiviert werden kann. Bei Inkompatibilität wird dessen `tool_choice` auf `auto` normalisiert.
    </Warning>

    Kimi K2.6 akzeptiert außerdem ein optionales Feld `thinking.keep`, das die
    Aufbewahrung von `reasoning_content` über mehrere Durchläufe hinweg steuert. Setzen Sie es auf `"all"`, um die vollständige
    Begründung über mehrere Durchläufe hinweg beizubehalten; lassen Sie es weg (oder belassen Sie es bei `null`), um die
    Standardstrategie des Servers zu verwenden. OpenClaw leitet `thinking.keep` nur für
    `moonshot/kimi-k2.6` weiter und entfernt es bei anderen Modellen. Kimi K2.7 Code
    behält standardmäßig den vollständigen Begründungsverlauf bei, während OpenClaw das gesamte
    Feld `thinking` weglässt.

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "moonshot/kimi-k2.6": {
              params: {
                thinking: { type: "enabled", keep: "all" },
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Bereinigung der Tool-Aufruf-ID">
    Moonshot Kimi liefert native tool_call-IDs im Format `functions.<name>:<index>`. OpenClaw behält das erste Vorkommen jeder nativen Kimi-ID bei und schreibt spätere Duplikate in deterministische OpenAI-artige `call_*`-IDs um. Zugehörige Tool-Ergebnisse werden derselben ID neu zugeordnet, sodass die Wiedergabe eindeutig bleibt, ohne Kimis erste native ID zu entfernen. Dieses Verhalten ist in den mitgelieferten Moonshot-Provider integriert und keine vom Benutzer konfigurierbare Einstellung.
  </Accordion>

  <Accordion title="Kompatibilität der Streaming-Nutzungsdaten">
    Native Moonshot-Endpunkte (`https://api.moonshot.ai/v1` und
    `https://api.moonshot.cn/v1`) weisen Kompatibilität mit Streaming-Nutzungsdaten aus.
    OpenClaw richtet dies nach dem Endpunkt-Host und nicht nach der Provider-ID aus, sodass eine benutzerdefinierte
    Provider-ID, die auf denselben nativen Moonshot-Host verweist, dasselbe
    Verhalten für Streaming-Nutzungsdaten übernimmt.

    Mit den K2.6-Preisen aus dem Katalog werden gestreamte Nutzungsdaten, die Eingabe-, Ausgabe-
    und Cache-Lese-Token enthalten, außerdem in lokal geschätzte Kosten in USD für
    `/status`, `/usage full`, `/usage cost` und die transkriptgestützte
    Sitzungsabrechnung umgerechnet.

  </Accordion>

  <Accordion title="Referenz für Endpunkte und Modellreferenzen">
    | Provider   | Präfix der Modellreferenz | Endpunkt                       | Umgebungsvariable für Authentifizierung |
    | ---------- | -------------------------- | ------------------------------ | --------------------------------------- |
    | Moonshot   | `moonshot/`                | `https://api.moonshot.ai/v1`  | `MOONSHOT_API_KEY`                      |
    | Moonshot CN| `moonshot/`                | `https://api.moonshot.cn/v1`  | `MOONSHOT_API_KEY`                      |
    | Kimi Coding| `kimi/`                    | Kimi-Coding-Endpunkt           | `KIMI_API_KEY`                          |
    | Websuche   | N/A                        | Wie die Moonshot-API-Region    | `KIMI_API_KEY` oder `MOONSHOT_API_KEY`  |

    - Die Kimi-Websuche verwendet `KIMI_API_KEY` oder `MOONSHOT_API_KEY` und nutzt standardmäßig `https://api.moonshot.ai/v1` mit dem Modell `kimi-k2.6`.
    - Überschreiben Sie bei Bedarf Preis- und Kontextmetadaten in `models.providers`.
    - Wenn Moonshot für ein Modell andere Kontextgrenzen veröffentlicht, passen Sie `contextWindow` entsprechend an.

  </Accordion>
</AccordionGroup>

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Auswahl von Providern, Modellreferenzen und Failover-Verhalten.
  </Card>
  <Card title="Websuche" href="/de/tools/web" icon="magnifying-glass">
    Konfiguration von Websuch-Providern einschließlich Kimi.
  </Card>
  <Card title="Konfigurationsreferenz" href="/de/gateway/configuration-reference" icon="gear">
    Vollständiges Konfigurationsschema für Provider, Modelle und Plugins.
  </Card>
  <Card title="Moonshot Open Platform" href="https://platform.moonshot.ai" icon="globe">
    Verwaltung von Moonshot-API-Schlüsseln und Dokumentation.
  </Card>
</CardGroup>
