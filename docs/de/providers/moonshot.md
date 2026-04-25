---
read_when:
    - Sie möchten Moonshot K2 (Moonshot Open Platform) im Vergleich zur Kimi-Coding-Einrichtung verwenden.
    - Sie müssen separate Endpunkte, Schlüssel und Modellreferenzen verstehen.
    - Sie möchten eine Konfiguration zum Kopieren und Einfügen für einen der beiden Anbieter.
summary: Moonshot K2 im Vergleich zu Kimi Coding konfigurieren (separate Anbieter + Schlüssel)
title: Moonshot AI
x-i18n:
    generated_at: "2026-04-25T13:55:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: fd6ababe59354a302975b68f4cdb12a623647f8e5cadfb8ae58a74bb2934ce65
    source_path: providers/moonshot.md
    workflow: 15
---

Moonshot stellt die Kimi-API mit OpenAI-kompatiblen Endpunkten bereit. Konfigurieren Sie den
Anbieter und setzen Sie das Standardmodell auf `moonshot/kimi-k2.6`, oder verwenden Sie
Kimi Coding mit `kimi/kimi-code`.

<Warning>
Moonshot und Kimi Coding sind **separate Anbieter**. Schlüssel sind nicht austauschbar, Endpunkte unterscheiden sich, und Modellreferenzen unterscheiden sich (`moonshot/...` vs. `kimi/...`).
</Warning>

## Integrierter Modellkatalog

[//]: # "moonshot-kimi-k2-ids:start"

| Model ref                         | Name                   | Reasoning | Input       | Kontext | Maximale Ausgabe |
| --------------------------------- | ---------------------- | --------- | ----------- | ------- | ---------------- |
| `moonshot/kimi-k2.6`              | Kimi K2.6              | Nein      | text, image | 262,144 | 262,144          |
| `moonshot/kimi-k2.5`              | Kimi K2.5              | Nein      | text, image | 262,144 | 262,144          |
| `moonshot/kimi-k2-thinking`       | Kimi K2 Thinking       | Ja        | text        | 262,144 | 262,144          |
| `moonshot/kimi-k2-thinking-turbo` | Kimi K2 Thinking Turbo | Ja        | text        | 262,144 | 262,144          |
| `moonshot/kimi-k2-turbo`          | Kimi K2 Turbo          | Nein      | text        | 256,000 | 16,384           |

[//]: # "moonshot-kimi-k2-ids:end"

Gebündelte Kostenschätzungen für aktuelle von Moonshot gehostete K2-Modelle verwenden die von Moonshot
veröffentlichten nutzungsbasierten Preise: Kimi K2.6 kostet 0,16 $/MTok Cache-Treffer,
0,95 $/MTok Eingabe und 4,00 $/MTok Ausgabe; Kimi K2.5 kostet 0,10 $/MTok Cache-Treffer,
0,60 $/MTok Eingabe und 3,00 $/MTok Ausgabe. Andere ältere Katalogeinträge behalten
Platzhalterkosten von null bei, sofern Sie sie nicht in der Konfiguration überschreiben.

## Erste Schritte

Wählen Sie Ihren Anbieter und folgen Sie den Einrichtungsschritten.

<Tabs>
  <Tab title="Moonshot API">
    **Am besten geeignet für:** Kimi-K2-Modelle über die Moonshot Open Platform.

    <Steps>
      <Step title="Ihre Endpunktregion auswählen">
        | Auth choice            | Endpunkt                      | Region        |
        | ---------------------- | ----------------------------- | ------------- |
        | `moonshot-api-key`     | `https://api.moonshot.ai/v1`  | International |
        | `moonshot-api-key-cn`  | `https://api.moonshot.cn/v1`  | China         |
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
      <Step title="Ein Standardmodell festlegen">
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
      <Step title="Prüfen, ob Modelle verfügbar sind">
        ```bash
        openclaw models list --provider moonshot
        ```
      </Step>
      <Step title="Einen Live-Smoke-Test ausführen">
        Verwenden Sie ein isoliertes Statusverzeichnis, wenn Sie den Modellzugriff und die Kostenverfolgung
        prüfen möchten, ohne Ihre normalen Sitzungen zu berühren:

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
        `model: "kimi-k2.6"` melden. Der Assistant-Transkripteintrag speichert normalisierte
        Token-Nutzung sowie geschätzte Kosten unter `usage.cost`, wenn Moonshot
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
    **Am besten geeignet für:** auf Code fokussierte Aufgaben über den Kimi-Coding-Endpunkt.

    <Note>
    Kimi Coding verwendet einen anderen API-Schlüssel und ein anderes Anbieterpräfix (`kimi/...`) als Moonshot (`moonshot/...`). Die ältere Modellreferenz `kimi/k2p5` wird weiterhin als Kompatibilitäts-ID akzeptiert.
    </Note>

    <Steps>
      <Step title="Onboarding ausführen">
        ```bash
        openclaw onboard --auth-choice kimi-code-api-key
        ```
      </Step>
      <Step title="Ein Standardmodell festlegen">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "kimi/kimi-code" },
            },
          },
        }
        ```
      </Step>
      <Step title="Prüfen, ob das Modell verfügbar ist">
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
          model: { primary: "kimi/kimi-code" },
          models: {
            "kimi/kimi-code": { alias: "Kimi" },
          },
        },
      },
    }
    ```

  </Tab>
</Tabs>

## Kimi-Websuche

OpenClaw liefert **Kimi** auch als `web_search`-Anbieter aus, unterstützt durch die Moonshot-Websuche.

<Steps>
  <Step title="Interaktive Einrichtung der Websuche ausführen">
    ```bash
    openclaw configure --section web
    ```

    Wählen Sie im Abschnitt zur Websuche **Kimi**, um
    `plugins.entries.moonshot.config.webSearch.*` zu speichern.

  </Step>
  <Step title="Region und Modell für die Websuche konfigurieren">
    Die interaktive Einrichtung fragt nach:

    | Einstellung         | Optionen                                                             |
    | ------------------- | -------------------------------------------------------------------- |
    | API-Region          | `https://api.moonshot.ai/v1` (international) oder `https://api.moonshot.cn/v1` (China) |
    | Websuchmodell       | Standardmäßig `kimi-k2.6`                                            |

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
    Moonshot Kimi unterstützt binäres natives Thinking:

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

    OpenClaw ordnet auch Laufzeitstufen von `/think` für Moonshot zu:

    | `/think`-Stufe      | Moonshot-Verhalten         |
    | ------------------- | -------------------------- |
    | `/think off`        | `thinking.type=disabled`   |
    | Jede andere Stufe   | `thinking.type=enabled`    |

    <Warning>
    Wenn Moonshot-Thinking aktiviert ist, muss `tool_choice` auf `auto` oder `none` gesetzt sein. OpenClaw normalisiert inkompatible `tool_choice`-Werte aus Kompatibilitätsgründen zu `auto`.
    </Warning>

    Kimi K2.6 akzeptiert außerdem ein optionales Feld `thinking.keep`, das die
    Multi-Turn-Aufbewahrung von `reasoning_content` steuert. Setzen Sie es auf `"all"`, um das vollständige
    Reasoning über mehrere Runden hinweg beizubehalten; lassen Sie es weg (oder auf `null`), um die
    Standardstrategie des Servers zu verwenden. OpenClaw leitet `thinking.keep` nur für
    `moonshot/kimi-k2.6` weiter und entfernt es bei anderen Modellen.

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

  <Accordion title="Bereinigung von Tool-Call-IDs">
    Moonshot Kimi liefert `tool_call`-IDs in der Form `functions.<name>:<index>`. OpenClaw lässt sie unverändert, damit Tool-Aufrufe über mehrere Runden hinweg weiter funktionieren.

    Um strikte Bereinigung bei einem benutzerdefinierten OpenAI-kompatiblen Anbieter zu erzwingen, setzen Sie `sanitizeToolCallIds: true`:

    ```json5
    {
      models: {
        providers: {
          "my-kimi-proxy": {
            api: "openai-completions",
            sanitizeToolCallIds: true,
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Kompatibilität mit Streaming-Nutzung">
    Native Moonshot-Endpunkte (`https://api.moonshot.ai/v1` und
    `https://api.moonshot.cn/v1`) signalisieren Kompatibilität mit Streaming-Nutzung auf dem
    gemeinsamen Transport `openai-completions`. OpenClaw richtet sich dabei nach den Endpunktfähigkeiten,
    sodass kompatible benutzerdefinierte Anbieter-IDs, die auf dieselben nativen
    Moonshot-Hosts zielen, dasselbe Streaming-Nutzungsverhalten übernehmen.

    Mit den gebündelten K2.6-Preisen wird gestreamte Nutzung, die Eingabe-, Ausgabe-
    und Cache-Read-Token enthält, außerdem in lokal geschätzte USD-Kosten umgerechnet für
    `/status`, `/usage full`, `/usage cost` und transkriptgestützte Sitzungs-
    abrechnung.

  </Accordion>

  <Accordion title="Referenz für Endpunkt und Modellreferenz">
    | Provider    | Modellreferenz-Präfix | Endpunkt                      | Auth-Umgebungsvariable |
    | ----------- | --------------------- | ----------------------------- | ---------------------- |
    | Moonshot    | `moonshot/`           | `https://api.moonshot.ai/v1`  | `MOONSHOT_API_KEY`     |
    | Moonshot CN | `moonshot/`           | `https://api.moonshot.cn/v1`  | `MOONSHOT_API_KEY`     |
    | Kimi Coding | `kimi/`               | Kimi-Coding-Endpunkt          | `KIMI_API_KEY`         |
    | Web search  | N/A                   | Gleich wie die Moonshot-API-Region | `KIMI_API_KEY` oder `MOONSHOT_API_KEY` |

    - Die Kimi-Websuche verwendet `KIMI_API_KEY` oder `MOONSHOT_API_KEY` und nutzt standardmäßig `https://api.moonshot.ai/v1` mit dem Modell `kimi-k2.6`.
    - Überschreiben Sie Preis- und Kontextmetadaten bei Bedarf in `models.providers`.
    - Wenn Moonshot für ein Modell andere Kontextgrenzen veröffentlicht, passen Sie `contextWindow` entsprechend an.

  </Accordion>
</AccordionGroup>

## Verwandt

<CardGroup cols={2}>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Anbieter, Modellreferenzen und Failover-Verhalten auswählen.
  </Card>
  <Card title="Web search" href="/de/tools/web" icon="magnifying-glass">
    Websuchanbieter einschließlich Kimi konfigurieren.
  </Card>
  <Card title="Konfigurationsreferenz" href="/de/gateway/configuration-reference" icon="gear">
    Vollständiges Konfigurationsschema für Anbieter, Modelle und Plugins.
  </Card>
  <Card title="Moonshot Open Platform" href="https://platform.moonshot.ai" icon="globe">
    Verwaltung von Moonshot-API-Schlüsseln und Dokumentation.
  </Card>
</CardGroup>
