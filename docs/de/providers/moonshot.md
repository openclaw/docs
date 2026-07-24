---
read_when:
    - Sie möchten Moonshot Kimi K3/K2 (Moonshot Open Platform) im Vergleich zur Kimi-Coding-Einrichtung verwenden
    - Sie müssen separate Endpunkte, Schlüssel und Modellreferenzen verstehen.
    - Sie möchten eine Konfiguration zum Kopieren und Einfügen für beide Provider.
summary: Moonshot-Kimi-Modelle im Vergleich zu Kimi Coding konfigurieren (separate Provider und Schlüssel)
title: Moonshot AI
x-i18n:
    generated_at: "2026-07-24T05:19:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 213379bf88fec26b052184a920e112f0887d6485601bfb47f590cf37ef983e58
    source_path: providers/moonshot.md
    workflow: 16
---

Moonshot stellt die Kimi API über OpenAI-kompatible Endpunkte bereit. Wählen Sie
`moonshot/kimi-k3` für Kimi K3, behalten Sie den Onboarding-Standard
`moonshot/kimi-k2.6` bei oder verwenden Sie `kimi/kimi-for-coding` für Kimi Coding.

<Warning>
Moonshot und Kimi Coding sind **separate Provider**, die jeweils als separates externes Plugin ausgeliefert werden. Schlüssel sind nicht austauschbar, die Endpunkte unterscheiden sich und die Modellreferenzen unterscheiden sich (`moonshot/...` gegenüber `kimi/...`).
</Warning>

## Integrierter Modellkatalog

[//]: # "moonshot-kimi-k2-ids:start"

| Modellreferenz                      | Name                     | Reasoning      | Eingabe     | Kontext   | Max. Ausgabe |
| ----------------------------------- | ------------------------ | -------------- | ----------- | --------- | ------------ |
| `moonshot/kimi-k2.6`                | Kimi K2.6                | Nein           | Text, Bild  | 262,144   | 262,144      |
| `moonshot/kimi-k3`                  | Kimi K3                  | Immer maximal | Text, Bild  | 1,048,576 | 1,048,576    |
| `moonshot/kimi-k2.7-code`           | Kimi K2.7 Code           | Immer aktiv   | Text, Bild  | 262,144   | 262,144      |
| `moonshot/kimi-k2.7-code-highspeed` | Kimi K2.7 Code HighSpeed | Immer aktiv   | Text, Bild  | 262,144   | 262,144      |
| `moonshot/kimi-k2.5`                | Kimi K2.5                | Nein           | Text, Bild  | 262,144   | 262,144      |

[//]: # "moonshot-kimi-k2-ids:end"

Die Kostenschätzungen im Katalog verwenden die von Moonshot veröffentlichten nutzungsabhängigen Tarife. Prüfen Sie vor
Kostenentscheidungen die aktuellen Anbieterseiten für [Kimi K3](https://platform.kimi.ai/docs/pricing/chat-k3),
[Kimi K2.7 Code](https://platform.kimi.ai/docs/pricing/chat-k27-code),
[Kimi K2.6](https://platform.kimi.ai/docs/pricing/chat-k26) und
[Kimi K2.5](https://platform.kimi.ai/docs/pricing/chat-k25).

Kimi K3 führt Reasoning immer mit `reasoning_effort: "max"` aus. OpenClaw stellt nur
`/think max` bereit, lässt das ausschließlich für K2 vorgesehene Feld `thinking` weg und entfernt Sampling-
Überschreibungen (`temperature`, `top_p`, `n`, `presence_penalty` und
`frequency_penalty`), die K3 auf die Provider-Standards festlegt. Kimi K2.7 Code
verwendet ebenfalls immer natives Denken, erfordert jedoch, dass sowohl `thinking` als auch
`reasoning_effort` weggelassen werden; die HighSpeed-Variante verwendet denselben Vertrag.
Kimi K2.6 bleibt der Onboarding-Standard.
Siehe Moonshots [Kimi-K3-Schnellstart](https://platform.kimi.ai/docs/guide/kimi-k3-quickstart).

## Erste Schritte

Sowohl Moonshot als auch Kimi Coding sind externe Plugins – installieren Sie vor dem
Onboarding eines davon.

<Tabs>
  <Tab title="Moonshot API">
    **Am besten geeignet für:** Kimi-K3- und K2-Modelle über die Moonshot Open Platform.

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
        | `moonshot-api-key`     | `https://api.moonshot.ai/v1`   | International |
        | `moonshot-api-key-cn`  | `https://api.moonshot.cn/v1`   | China         |
      </Step>
      <Step title="Onboarding ausführen">
        ```bash
        openclaw onboard --auth-choice moonshot-api-key
        ```

        Oder für den China-Endpunkt:

        ```bash
        openclaw onboard --auth-choice moonshot-api-key-cn
        ```
      </Step>
      <Step title="Kimi K3 als Standardmodell festlegen">
        Beim Onboarding bleibt Kimi K2.6 zunächst das Standardmodell. Wechseln Sie ausdrücklich,
        wenn Sie Kimi K3 verwenden möchten:

        ```bash
        openclaw models set moonshot/kimi-k3
        ```
      </Step>
      <Step title="Verfügbarkeit der Modelle überprüfen">
        ```bash
        openclaw models list --provider moonshot
        ```
      </Step>
      <Step title="Live-Smoke-Test ausführen">
        Verwenden Sie ein isoliertes Zustandsverzeichnis, wenn Sie den Modellzugriff und die Kostenerfassung
        überprüfen möchten, ohne Ihre normalen Sitzungen zu verändern:

        ```bash
        OPENCLAW_CONFIG_PATH=/tmp/openclaw-kimi/openclaw.json \
        OPENCLAW_STATE_DIR=/tmp/openclaw-kimi \
        openclaw agent --local \
          --session-id live-kimi-cost \
          --message 'Antworte exakt: KIMI_LIVE_OK' \
          --thinking max \
          --json
        ```

        Die JSON-Antwort sollte `provider: "moonshot"` und
        `model: "kimi-k3"` enthalten. Der Assistententranskripteintrag speichert die normalisierte
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
            "moonshot/kimi-k3": { alias: "Kimi K3" },
            "moonshot/kimi-k2.7-code": { alias: "Kimi K2.7 Code" },
            "moonshot/kimi-k2.7-code-highspeed": { alias: "Kimi K2.7 Code HighSpeed" },
            "moonshot/kimi-k2.5": { alias: "Kimi K2.5" },
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
                id: "kimi-k3",
                name: "Kimi K3",
                reasoning: true,
                thinkingLevelMap: {
                  off: null,
                  minimal: null,
                  low: null,
                  medium: null,
                  high: null,
                  xhigh: "max",
                  max: "max",
                },
                input: ["text", "image"],
                cost: { input: 3, output: 15, cacheRead: 0.3, cacheWrite: 0 },
                contextWindow: 1048576,
                maxTokens: 1048576,
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
                id: "kimi-k2.7-code-highspeed",
                name: "Kimi K2.7 Code HighSpeed",
                reasoning: true,
                input: ["text", "image"],
                cost: { input: 1.9, output: 8, cacheRead: 0.38, cacheWrite: 0 },
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
              // moonshot-kimi-k2-models:end
            ],
          },
        },
      },
    }
    ```

  </Tab>

  <Tab title="Kimi Coding">
    **Am besten geeignet für:** codeorientierte Aufgaben über den Kimi-Coding-Endpunkt.

    <Note>
    Kimi Coding verwendet einen anderen API-Schlüssel und ein anderes Provider-Präfix (`kimi/...`) als Moonshot (`moonshot/...`). Aktuelle Referenzen sind `kimi/k3` für einen Kontext von 256K, `kimi/k3[1m]` für die 1M-Stufe, `kimi/kimi-for-coding` und `kimi/kimi-for-coding-highspeed`. Veraltete Referenzen `kimi/kimi-code` und `kimi/k2p5` werden weiterhin akzeptiert und zu `kimi/kimi-for-coding` normalisiert.
    </Note>

    Der Coding-Dienst akzeptiert sowohl OpenAI-kompatible
    `https://api.kimi.com/coding/v1`- als auch Anthropic-kompatible
    `https://api.kimi.com/coding/`-Clients. Dieses Plugin verwendet Anthropic Messages.
    Erstellen Sie Mitgliedschaftsschlüssel in der
    [Kimi Code Console](https://www.kimi.com/code/console); die aktuellen Mitgliedschaftspreise
    finden Sie auf [Kimis Preisseite](https://www.kimi.com/membership/pricing).

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

    Kimi Code K3 verwendet standardmäßig tiefes Denken mit `max`. `/think off` sendet
    `thinking.type: "disabled"`; `/think max` sendet die Adaptive-Thinking-
    Anfrage von K3 mit maximalem Aufwand. Veraltete niedrigere Denkstufen werden in die
    unterstützte Stufe `max` aufgelöst. Das 1M-Modell erfordert eine Allegretto- oder höhere Kimi-
    Mitgliedschaft; verwenden Sie `kimi/k3` bei Moderato.

    Die aktuelle Verfügbarkeit nach Tarif finden Sie in der offiziellen [Kimi-Code-Modelltabelle](https://www.kimi.com/code/docs/en/kimi-code/models.html).

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

Das Moonshot-Plugin registriert außerdem **Kimi** als `web_search`-Provider, der auf der Moonshot-Websuche basiert.

<Steps>
  <Step title="Interaktive Einrichtung der Websuche ausführen">
    ```bash
    openclaw configure --section web
    ```

    Wählen Sie im Websuchabschnitt **Kimi**, um
    `plugins.entries.moonshot.config.webSearch.*` zu speichern.

  </Step>
  <Step title="Websuchregion und Modell konfigurieren">
    Die interaktive Einrichtung fragt Folgendes ab:

    | Einstellung         | Optionen                                                              |
    | ------------------- | -------------------------------------------------------------------- |
    | API-Region          | `https://api.moonshot.ai/v1` (international) oder `https://api.moonshot.cn/v1` (China) |
    | Websuchmodell       | Standardmäßig `kimi-k2.6`                                    |

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
  <Accordion title="Nativer Denkmodus">
    Moonshot API Kimi K3 führt Reasoning immer mit maximalem Aufwand aus. OpenClaw stellt nur
    `/think max` bereit, sendet `reasoning_effort: "max"` und ignoriert veraltete niedrigere oder
    `off`-Einstellungen.

    Kimi Code K3 stellt `/think off|max` bereit. Sein Anthropic-kompatibler Endpunkt
    empfängt `thinking.type: "disabled"` zum Deaktivieren oder adaptives Denken mit
    `output_config.effort: "max"` für das Maximum. Dies gilt sowohl für `kimi/k3` als auch für
    `kimi/k3[1m]`.
    Die Moonshot API K3 unterstützt `auto`, `none`, `required` und festgelegte Tool-Auswahlen,
    daher behält OpenClaw die angeforderte `tool_choice` bei. Bei mehrstufiger Tool-Nutzung
    behält OpenClaw die vom Replay-Vertrag von Moonshot
    benötigten Reasoning-Inhalte des Assistenten bei.

    Kimi K2.7 Code verwendet immer natives Denken. Moonshot verlangt von Clients,
    das Feld `thinking` für dieses Modell wegzulassen. Daher stellt OpenClaw nur `on` bereit und
    ignoriert veraltete `off`-Einstellungen. K2.7 legt außerdem `temperature`, `top_p`, `n`,
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

    OpenClaw ordnet die `/think`-Laufzeitstufen für diese Modelle zu:

    | `/think`-Stufe       | Moonshot-Verhalten          |
    | -------------------- | -------------------------- |
    | `/think off`         | `thinking.type=disabled`   |
    | Jede Stufe außer „Aus“    | `thinking.type=enabled`    |

    <Warning>
    Wenn das Denken von Moonshot K2 aktiviert ist, muss `tool_choice` entweder `auto` oder `none` sein. Eine festgelegte Tool-Auswahl (`type: "tool"` oder `type: "function"`) erzwingt stattdessen die Rücksetzung des Denkens auf `disabled`, damit das angeforderte Tool dennoch ausgeführt wird; `tool_choice: "required"` wird stattdessen zu `auto` normalisiert. Kimi K2.7 Code kann das Denken nicht deaktivieren, daher wird sein inkompatibles `tool_choice` zu `auto` normalisiert. Kimi K3 verwendet seinen separaten Reasoning-Effort-Vertrag und behält unterstützte Tool-Auswahlen bei.
    </Warning>

    Kimi K2.6 akzeptiert außerdem ein optionales Feld `thinking.keep`, das die
    mehrstufige Beibehaltung von `reasoning_content` steuert. Setzen Sie es auf `"all"`, um das vollständige
    Reasoning über mehrere Durchläufe hinweg beizubehalten; lassen Sie es weg (oder belassen Sie es bei `null`), um die
    Standardstrategie des Servers zu verwenden. OpenClaw leitet `thinking.keep` nur für
    `moonshot/kimi-k2.6` weiter und entfernt es bei anderen Modellen. Kimi K2.7 Code
    behält standardmäßig den vollständigen Reasoning-Verlauf bei, während OpenClaw das gesamte
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
    Moonshot Kimi stellt native tool_call-IDs im Format `functions.<name>:<index>` bereit. OpenClaw behält das erste Vorkommen jeder nativen Kimi-ID bei und schreibt spätere Duplikate in deterministische IDs im OpenAI-Stil `call_*` um. Zugehörige Tool-Ergebnisse werden mit derselben ID neu zugeordnet, damit das Replay eindeutig bleibt, ohne die erste native ID von Kimi zu entfernen. Dieses Verhalten ist in den mitgelieferten Moonshot-Provider integriert und kann nicht von Benutzern konfiguriert werden.
  </Accordion>

  <Accordion title="Kompatibilität der Streaming-Nutzung">
    Native Moonshot-Endpunkte (`https://api.moonshot.ai/v1` und
    `https://api.moonshot.cn/v1`) geben Kompatibilität mit der Streaming-Nutzung an.
    OpenClaw richtet sich dabei nach dem Host des Endpunkts, nicht nach der Provider-ID. Daher übernimmt eine benutzerdefinierte
    Provider-ID, die auf denselben nativen Moonshot-Host verweist, dasselbe
    Verhalten für die Streaming-Nutzung.

    Bei den K2.6-Katalogpreisen wird die gestreamte Nutzung, die Eingabe-, Ausgabe-
    und Cache-Lese-Token umfasst, außerdem in lokal geschätzte USD-Kosten für
    `/status`, `/usage full`, `/usage cost` und die transkriptgestützte Sitzungsabrechnung
    umgerechnet.

  </Accordion>

  <Accordion title="Referenz für Endpunkte und Modellreferenzen">
    | Provider   | Präfix der Modellreferenz | Endpunkt                      | Umgebungsvariable für die Authentifizierung        |
    | ---------- | ---------------- | ------------------------------ | ------------------- |
    | Moonshot   | `moonshot/`      | `https://api.moonshot.ai/v1`  | `MOONSHOT_API_KEY`  |
    | Moonshot CN| `moonshot/`      | `https://api.moonshot.cn/v1`  | `MOONSHOT_API_KEY`  |
    | Kimi Coding| `kimi/`          | Kimi-Coding-Endpunkt           | `KIMI_API_KEY`      |
    | Websuche | –              | Wie die Moonshot-API-Region    | `KIMI_API_KEY` oder `MOONSHOT_API_KEY` |

    - Die Kimi-Websuche verwendet `KIMI_API_KEY` oder `MOONSHOT_API_KEY` und standardmäßig `https://api.moonshot.ai/v1` mit dem Modell `kimi-k2.6`.
    - Überschreiben Sie bei Bedarf Preis- und Kontextmetadaten in `models.providers`.
    - Falls Moonshot andere Kontextgrenzen für ein Modell veröffentlicht, passen Sie `contextWindow` entsprechend an.

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
