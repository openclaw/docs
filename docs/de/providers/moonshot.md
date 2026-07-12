---
read_when:
    - Sie möchten Moonshot K2 (Moonshot Open Platform) oder Kimi Coding einrichten
    - Sie müssen separate Endpunkte, Schlüssel und Modellreferenzen verstehen.
    - Sie möchten eine kopierfertige Konfiguration für einen der beiden Provider.
summary: Moonshot K2 im Vergleich zu Kimi Coding konfigurieren (separate Provider und Schlüssel)
title: Moonshot AI
x-i18n:
    generated_at: "2026-07-12T02:05:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c917a595337fc2138601245f4c7055815859dfa3b2ddf90a56c980a7a4e09744
    source_path: providers/moonshot.md
    workflow: 16
---

Moonshot stellt die Kimi-API mit OpenAI-kompatiblen Endpunkten bereit. Legen Sie
für die Moonshot Open Platform `moonshot/kimi-k2.6` oder für Kimi Coding
`kimi/kimi-for-coding` als Standardmodell fest.

<Warning>
Moonshot und Kimi Coding sind **separate Provider**, die jeweils als eigenes externes Plugin ausgeliefert werden. Die Schlüssel sind nicht untereinander austauschbar, die Endpunkte unterscheiden sich und die Modellreferenzen sind verschieden (`moonshot/...` gegenüber `kimi/...`).
</Warning>

## Integrierter Modellkatalog

[//]: # "moonshot-kimi-k2-ids:start"

| Modellreferenz                    | Name                   | Schlussfolgern | Eingabe     | Kontext | Max. Ausgabe |
| --------------------------------- | ---------------------- | -------------- | ----------- | ------- | ------------ |
| `moonshot/kimi-k2.6`              | Kimi K2.6              | Nein           | Text, Bild  | 262,144 | 262,144      |
| `moonshot/kimi-k2.7-code`         | Kimi K2.7 Code         | Immer aktiv    | Text, Bild  | 262,144 | 262,144      |
| `moonshot/kimi-k2.5`              | Kimi K2.5              | Nein           | Text, Bild  | 262,144 | 262,144      |
| `moonshot/kimi-k2-thinking`       | Kimi K2 Thinking       | Ja             | Text        | 262,144 | 262,144      |
| `moonshot/kimi-k2-thinking-turbo` | Kimi K2 Thinking Turbo | Ja             | Text        | 262,144 | 262,144      |
| `moonshot/kimi-k2-turbo`          | Kimi K2 Turbo          | Nein           | Text        | 256,000 | 16,384       |

[//]: # "moonshot-kimi-k2-ids:end"

Die Kostenschätzungen im Katalog basieren auf den von Moonshot veröffentlichten verbrauchsabhängigen Tarifen: Kimi
K2.7 Code kostet bei einem Cache-Treffer 0,19 US-Dollar/MTok, für die Eingabe 0,95 US-Dollar/MTok und für die Ausgabe 4,00 US-Dollar/MTok; Kimi
K2.6 kostet bei einem Cache-Treffer 0,16 US-Dollar/MTok, für die Eingabe 0,95 US-Dollar/MTok und für die Ausgabe 4,00 US-Dollar/MTok; Kimi K2.5
kostet bei einem Cache-Treffer 0,10 US-Dollar/MTok, für die Eingabe 0,60 US-Dollar/MTok und für die Ausgabe 3,00 US-Dollar/MTok. Andere Katalogeinträge
behalten Platzhalter ohne Kosten bei, sofern Sie diese nicht in der Konfiguration überschreiben.

Kimi K2.7 Code verwendet immer natives Denken. OpenClaw stellt für dieses Modell nur den Denkstatus `on`
bereit und lässt ausgehende Felder `thinking` und
`reasoning_effort` entsprechend den Anforderungen von Moonshot weg. Außerdem werden Sampling-
Überschreibungen (`temperature`, `top_p`, `n`, `presence_penalty`,
`frequency_penalty`) weggelassen, da K2.7 diese auf die Standardwerte des Providers festlegt. Kimi K2.6 bleibt
das Standardmodell für das Onboarding.

## Erste Schritte

Sowohl Moonshot als auch Kimi Coding sind externe Plugins – installieren Sie eines davon, bevor Sie
das Onboarding ausführen.

<Tabs>
  <Tab title="Moonshot API">
    **Am besten geeignet für:** Kimi-K2-Modelle über die Moonshot Open Platform.

    <Steps>
      <Step title="Install the plugin">
        ```bash
        openclaw plugins install @openclaw/moonshot-provider
        openclaw gateway restart
        ```
      </Step>
      <Step title="Choose your endpoint region">
        | Authentifizierungsoption | Endpunkt                       | Region        |
        | ------------------------ | ------------------------------ | ------------- |
        | `moonshot-api-key`       | `https://api.moonshot.ai/v1`   | International |
        | `moonshot-api-key-cn`    | `https://api.moonshot.cn/v1`   | China         |
      </Step>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice moonshot-api-key
        ```

        Oder für den Endpunkt in China:

        ```bash
        openclaw onboard --auth-choice moonshot-api-key-cn
        ```
      </Step>
      <Step title="Set a default model">
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
      <Step title="Verify models are available">
        ```bash
        openclaw models list --provider moonshot
        ```
      </Step>
      <Step title="Run a live smoke test">
        Verwenden Sie ein isoliertes Zustandsverzeichnis, wenn Sie den Modellzugriff und die
        Kostenerfassung überprüfen möchten, ohne Ihre regulären Sitzungen zu verändern:

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
        `model: "kimi-k2.6"` melden. Der Transkripteintrag des Assistenten speichert die normalisierte
        Token-Nutzung sowie die geschätzten Kosten unter `usage.cost`, wenn Moonshot
        Nutzungsmetadaten zurückgibt.
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
    **Am besten geeignet für:** auf Code ausgerichtete Aufgaben über den Kimi-Coding-Endpunkt.

    <Note>
    Kimi Coding verwendet einen anderen API-Schlüssel und ein anderes Provider-Präfix (`kimi/...`) als Moonshot (`moonshot/...`). Die stabile Modellreferenz lautet `kimi/kimi-for-coding`; die veralteten Referenzen `kimi/kimi-code` und `kimi/k2p5` werden weiterhin akzeptiert und auf diese Modell-ID normalisiert.
    </Note>

    <Steps>
      <Step title="Install the plugin">
        ```bash
        openclaw plugins install @openclaw/kimi-provider
        openclaw gateway restart
        ```
      </Step>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice kimi-code-api-key
        ```
      </Step>
      <Step title="Set a default model">
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
      <Step title="Verify the model is available">
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

Das Moonshot-Plugin registriert außerdem **Kimi** als `web_search`-Provider, der auf der Websuche von Moonshot basiert.

<Steps>
  <Step title="Run interactive web search setup">
    ```bash
    openclaw configure --section web
    ```

    Wählen Sie im Abschnitt für die Websuche **Kimi**, um
    `plugins.entries.moonshot.config.webSearch.*` zu speichern.

  </Step>
  <Step title="Configure the web search region and model">
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
            apiKey: "sk-...", // or use KIMI_API_KEY / MOONSHOT_API_KEY
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
  <Accordion title="Native thinking mode">
    Kimi K2.7 Code verwendet immer natives Denken. Moonshot verlangt, dass Clients
    das Feld `thinking` für dieses Modell weglassen. Daher stellt OpenClaw nur `on`
    bereit und ignoriert veraltete Einstellungen mit `off`. K2.7 legt außerdem `temperature`, `top_p`, `n`,
    `presence_penalty` und `frequency_penalty` fest; OpenClaw lässt konfigurierte
    Überschreibungen für diese Felder weg.

    Andere Kimi-Modelle von Moonshot unterstützen binäres natives Denken:

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

    | `/think`-Stufe           | Verhalten von Moonshot     |
    | ------------------------ | -------------------------- |
    | `/think off`             | `thinking.type=disabled`   |
    | Jede andere Stufe        | `thinking.type=enabled`    |

    <Warning>
    Wenn das Denken bei Moonshot aktiviert ist, muss `tool_choice` den Wert `auto` oder `none` haben. Eine festgelegte Werkzeugauswahl (`type: "tool"` oder `type: "function"`) setzt das Denken stattdessen wieder auf `disabled`, damit das angeforderte Werkzeug weiterhin ausgeführt wird; `tool_choice: "required"` wird stattdessen auf `auto` normalisiert. Dies gilt für jedes Moonshot-Modell außer Kimi K2.7 Code, dessen Denkmodus nicht deaktiviert werden kann – sein `tool_choice` wird bei Inkompatibilität auf `auto` normalisiert.
    </Warning>

    Kimi K2.6 akzeptiert außerdem ein optionales Feld `thinking.keep`, das die
    Aufbewahrung von `reasoning_content` über mehrere Interaktionen hinweg steuert. Setzen Sie es auf `"all"`, um die vollständigen
    Überlegungen über Interaktionen hinweg beizubehalten; lassen Sie es weg (oder belassen Sie es auf `null`), um die standardmäßige
    Serverstrategie zu verwenden. OpenClaw leitet `thinking.keep` nur für
    `moonshot/kimi-k2.6` weiter und entfernt es bei anderen Modellen. Kimi K2.7 Code
    behält standardmäßig den vollständigen Überlegungsverlauf bei, während OpenClaw das gesamte Feld
    `thinking` weglässt.

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

  <Accordion title="Bereinigung von Tool-Aufruf-IDs">
    Moonshot Kimi liefert native `tool_call`-IDs im Format `functions.<name>:<index>`. OpenClaw behält das erste Auftreten jeder nativen Kimi-ID bei und schreibt spätere Duplikate in deterministische OpenAI-artige `call_*`-IDs um. Zugehörige Tool-Ergebnisse werden derselben ID zugeordnet, sodass die Wiedergabe eindeutig bleibt, ohne die erste native Kimi-ID zu entfernen. Dieses Verhalten ist in den mitgelieferten Moonshot-Provider integriert und kann nicht von Benutzern konfiguriert werden.
  </Accordion>

  <Accordion title="Kompatibilität der Streaming-Nutzungsdaten">
    Native Moonshot-Endpunkte (`https://api.moonshot.ai/v1` und
    `https://api.moonshot.cn/v1`) weisen Kompatibilität mit Streaming-Nutzungsdaten aus.
    OpenClaw bestimmt dies anhand des Endpunkt-Hosts und nicht anhand der Provider-ID, sodass eine benutzerdefinierte
    Provider-ID, die auf denselben nativen Moonshot-Host verweist, dasselbe
    Verhalten für Streaming-Nutzungsdaten übernimmt.

    Bei Verwendung der K2.6-Preise aus dem Katalog werden gestreamte Nutzungsdaten, die Eingabe-, Ausgabe-
    und Cache-Lese-Token enthalten, außerdem in lokal geschätzte Kosten in USD für
    `/status`, `/usage full`, `/usage cost` und die transkriptbasierte
    Sitzungsabrechnung umgerechnet.

  </Accordion>

  <Accordion title="Referenz für Endpunkte und Modellreferenzen">
    | Provider   | Präfix der Modellreferenz | Endpunkt                      | Umgebungsvariable für Authentifizierung |
    | ---------- | ------------------------- | ----------------------------- | ---------------------------------------- |
    | Moonshot   | `moonshot/`               | `https://api.moonshot.ai/v1` | `MOONSHOT_API_KEY`                       |
    | Moonshot CN| `moonshot/`               | `https://api.moonshot.cn/v1` | `MOONSHOT_API_KEY`                       |
    | Kimi Coding| `kimi/`                   | Kimi-Coding-Endpunkt          | `KIMI_API_KEY`                           |
    | Websuche   | Nicht zutreffend           | Entspricht der Moonshot-API-Region | `KIMI_API_KEY` oder `MOONSHOT_API_KEY` |

    - Die Kimi-Websuche verwendet `KIMI_API_KEY` oder `MOONSHOT_API_KEY` und standardmäßig `https://api.moonshot.ai/v1` mit dem Modell `kimi-k2.6`.
    - Überschreiben Sie bei Bedarf Preise und Kontextmetadaten in `models.providers`.
    - Falls Moonshot für ein Modell andere Kontextgrenzen veröffentlicht, passen Sie `contextWindow` entsprechend an.

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
    Verwaltung und Dokumentation von Moonshot-API-Schlüsseln.
  </Card>
</CardGroup>
