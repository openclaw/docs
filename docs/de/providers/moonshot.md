---
read_when:
    - Sie möchten Moonshot K2 (Moonshot Open Platform) im Vergleich zur Einrichtung von Kimi Coding
    - Sie müssen separate Endpunkte, Schlüssel und Modellreferenzen verstehen
    - Sie möchten eine Konfiguration zum Kopieren und Einfügen für einen der beiden Provider
summary: Moonshot K2 vs. Kimi Coding konfigurieren (separate Provider + Schlüssel)
title: Moonshot AI
x-i18n:
    generated_at: "2026-06-27T18:05:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e7365d7e843275750824a937553dcf535245146fb49fe00c622bf14b71d2dd17
    source_path: providers/moonshot.md
    workflow: 16
---

Moonshot stellt die Kimi-API mit OpenAI-kompatiblen Endpunkten bereit. Konfigurieren Sie den
Provider und setzen Sie das Standardmodell auf `moonshot/kimi-k2.6`, oder verwenden Sie
Kimi Coding mit `kimi/kimi-for-coding`.

<Warning>
Moonshot und Kimi Coding sind **separate Provider**. Schlüssel sind nicht austauschbar, Endpunkte unterscheiden sich, und Modell-Refs unterscheiden sich (`moonshot/...` vs. `kimi/...`).
</Warning>

## Integrierter Modellkatalog

[//]: # "moonshot-kimi-k2-ids:start"

| Modell-Ref                        | Name                   | Reasoning    | Eingabe     | Kontext | Max. Ausgabe |
| --------------------------------- | ---------------------- | ------------ | ----------- | ------- | ------------ |
| `moonshot/kimi-k2.6`              | Kimi K2.6              | Nein         | Text, Bild  | 262,144 | 262,144      |
| `moonshot/kimi-k2.7-code`         | Kimi K2.7 Code         | Immer aktiv  | Text, Bild  | 262,144 | 262,144      |
| `moonshot/kimi-k2.5`              | Kimi K2.5              | Nein         | Text, Bild  | 262,144 | 262,144      |
| `moonshot/kimi-k2-thinking`       | Kimi K2 Thinking       | Ja           | Text        | 262,144 | 262,144      |
| `moonshot/kimi-k2-thinking-turbo` | Kimi K2 Thinking Turbo | Ja           | Text        | 262,144 | 262,144      |
| `moonshot/kimi-k2-turbo`          | Kimi K2 Turbo          | Nein         | Text        | 256,000 | 16,384       |

[//]: # "moonshot-kimi-k2-ids:end"

Die Kostenschätzungen im Katalog für aktuelle von Moonshot gehostete K2-Modelle verwenden Moonshots
veröffentlichte Pay-as-you-go-Tarife: Kimi K2.7 Code kostet 0,19 $/MTok Cache-Hit,
0,95 $/MTok Eingabe und 4,00 $/MTok Ausgabe; Kimi K2.6 kostet 0,16 $/MTok Cache-Hit,
0,95 $/MTok Eingabe und 4,00 $/MTok Ausgabe; Kimi K2.5 kostet 0,10 $/MTok Cache-Hit,
0,60 $/MTok Eingabe und 3,00 $/MTok Ausgabe. Andere ältere Katalogeinträge behalten
Nullkosten-Platzhalter, sofern Sie sie nicht in der Konfiguration überschreiben.

Kimi K2.7 Code verwendet immer natives Denken. OpenClaw stellt für dieses Modell nur den
Denkzustand `on` bereit und lässt ausgehende Steuerelemente für `thinking` und
`reasoning_effort` weg, wie von Moonshot gefordert. OpenClaw lässt außerdem
Sampling-Overrides weg, die K2.7 auf Provider-Standardwerte festlegt. Kimi K2.6 bleibt der
Onboarding-Standard.

## Erste Schritte

Wählen Sie Ihren Provider und folgen Sie den Einrichtungsschritten.

<Tabs>
  <Tab title="Moonshot-API">
    **Am besten für:** Kimi-K2-Modelle über die Moonshot Open Platform.

    <Steps>
      <Step title="Endpunktregion wählen">
        | Auth-Auswahl          | Endpunkt                       | Region        |
        | --------------------- | ------------------------------ | ------------- |
        | `moonshot-api-key`    | `https://api.moonshot.ai/v1`   | International |
        | `moonshot-api-key-cn` | `https://api.moonshot.cn/v1`   | China         |
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
      <Step title="Prüfen, ob Modelle verfügbar sind">
        ```bash
        openclaw models list --provider moonshot
        ```
      </Step>
      <Step title="Live-Smoke-Test ausführen">
        Verwenden Sie ein isoliertes Zustandsverzeichnis, wenn Sie Modellzugriff und Kostenerfassung
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
        `model: "kimi-k2.6"` melden. Der Transkripteintrag des Assistenten speichert normalisierte
        Token-Nutzung plus geschätzte Kosten unter `usage.cost`, wenn Moonshot
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
    Installieren Sie das offizielle Plugin, und starten Sie dann Gateway neu:

    ```bash
    openclaw plugins install @openclaw/kimi-provider
    openclaw gateway restart
    ```
    **Am besten für:** codeorientierte Aufgaben über den Kimi-Coding-Endpunkt.

    <Note>
    Kimi Coding verwendet einen anderen API-Schlüssel und ein anderes Provider-Präfix (`kimi/...`) als Moonshot (`moonshot/...`). Die stabile API-Modell-Ref ist `kimi/kimi-for-coding`; ältere Refs `kimi/kimi-code` und `kimi/k2p5` bleiben akzeptiert und werden auf diese API-Modell-ID normalisiert.
    </Note>

    <Steps>
      <Step title="Plugin installieren">
        ```bash
        openclaw plugins install @openclaw/kimi-provider
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

Das Moonshot-Plugin registriert außerdem **Kimi** als `web_search`-Provider, gestützt durch Moonshot-Websuche.

<Steps>
  <Step title="Interaktive Websuche-Einrichtung ausführen">
    ```bash
    openclaw configure --section web
    ```

    Wählen Sie **Kimi** im Websuche-Abschnitt, um
    `plugins.entries.moonshot.config.webSearch.*` zu speichern.

  </Step>
  <Step title="Websuche-Region und Modell konfigurieren">
    Die interaktive Einrichtung fragt nach:

    | Einstellung        | Optionen                                                             |
    | ------------------ | -------------------------------------------------------------------- |
    | API-Region         | `https://api.moonshot.ai/v1` (international) oder `https://api.moonshot.cn/v1` (China) |
    | Websuche-Modell    | Standardmäßig `kimi-k2.6`                                            |

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
    Kimi K2.7 Code verwendet immer natives Denken. Moonshot verlangt, dass Clients
    das Feld `thinking` für dieses Modell weglassen; daher stellt OpenClaw nur `on` bereit und
    ignoriert veraltete `off`-Einstellungen. K2.7 legt außerdem `temperature`, `top_p`, `n`,
    `presence_penalty` und `frequency_penalty` fest; OpenClaw lässt konfigurierte
    Overrides für diese Felder weg.

    Andere Moonshot-Kimi-Modelle unterstützen binäres natives Denken:

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

    OpenClaw ordnet Laufzeit-`/think`-Stufen für diese Modelle zu:

    | `/think`-Stufe        | Moonshot-Verhalten        |
    | --------------------- | ------------------------- |
    | `/think off`          | `thinking.type=disabled`  |
    | Jede Nicht-off-Stufe  | `thinking.type=enabled`   |

    <Warning>
    Wenn Moonshot-Denken aktiviert ist, muss `tool_choice` `auto` oder `none` sein. OpenClaw normalisiert inkompatible Werte auf `auto`. Dies schließt Kimi K2.7 Code ein, dessen Denkmodus nicht deaktiviert werden kann, um eine festgelegte Tool-Auswahl beizubehalten.
    </Warning>

    Kimi K2.6 akzeptiert auch ein optionales Feld `thinking.keep`, das die
    Multi-Turn-Beibehaltung von `reasoning_content` steuert. Setzen Sie es auf `"all"`, um die vollständige
    Reasoning-Historie über Turns hinweg beizubehalten; lassen Sie es weg (oder lassen Sie es `null`), um die
    Standardstrategie des Servers zu verwenden. OpenClaw leitet `thinking.keep` nur für
    `moonshot/kimi-k2.6` weiter und entfernt es aus anderen Modellen. Kimi K2.7 Code
    bewahrt standardmäßig die vollständige Reasoning-Historie, während OpenClaw das gesamte
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

  <Accordion title="Bereinigung von Tool-Call-IDs">
    Moonshot Kimi liefert native tool_call-IDs im Format `functions.<name>:<index>`. Für den OpenAI-Completions-Transport bewahrt OpenClaw das erste Vorkommen jeder nativen Kimi-ID und schreibt spätere Duplikate in deterministische OpenAI-artige `call_*`-IDs um. Passende Tool-Ergebnisse werden mit derselben ID neu zugeordnet, sodass der Replay eindeutig bleibt, ohne Kimis erste native ID zu entfernen.

    Um für einen benutzerdefinierten OpenAI-kompatiblen Provider eine strikte Bereinigung zu erzwingen, setzen Sie `sanitizeToolCallIds: true`:

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

  <Accordion title="Kompatibilität der Streaming-Nutzung">
    Native Moonshot-Endpoints (`https://api.moonshot.ai/v1` und
    `https://api.moonshot.cn/v1`) weisen Streaming-Nutzungskompatibilität auf dem
    gemeinsamen `openai-completions`-Transport aus. OpenClaw richtet sich dabei nach
    Endpoint-Fähigkeiten, sodass kompatible benutzerdefinierte Provider-IDs, die auf dieselben nativen
    Moonshot-Hosts zielen, dasselbe Streaming-Usage-Verhalten übernehmen.

    Mit der K2.6-Preisgestaltung aus dem Katalog wird gestreamte Nutzung, die Input-,
    Output- und Cache-Read-Tokens enthält, außerdem in lokal geschätzte USD-Kosten für
    `/status`, `/usage full`, `/usage cost` und die transkriptgestützte Sitzungsabrechnung
    umgerechnet.

  </Accordion>

  <Accordion title="Referenz für Endpoint und Modellref">
    | Provider   | Modellref-Präfix | Endpoint                      | Auth-Umgebungsvariable |
    | ---------- | ---------------- | ----------------------------- | ------------------- |
    | Moonshot   | `moonshot/`      | `https://api.moonshot.ai/v1`  | `MOONSHOT_API_KEY`  |
    | Moonshot CN| `moonshot/`      | `https://api.moonshot.cn/v1`  | `MOONSHOT_API_KEY`  |
    | Kimi Coding| `kimi/`          | Kimi-Coding-Endpoint          | `KIMI_API_KEY`      |
    | Websuche | k. A.              | Wie die Moonshot-API-Region   | `KIMI_API_KEY` oder `MOONSHOT_API_KEY` |

    - Die Kimi-Websuche verwendet `KIMI_API_KEY` oder `MOONSHOT_API_KEY` und nutzt standardmäßig `https://api.moonshot.ai/v1` mit dem Modell `kimi-k2.6`.
    - Überschreiben Sie bei Bedarf Preis- und Kontextmetadaten in `models.providers`.
    - Wenn Moonshot andere Kontextlimits für ein Modell veröffentlicht, passen Sie `contextWindow` entsprechend an.

  </Accordion>
</AccordionGroup>

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Provider, Modellrefs und Failover-Verhalten auswählen.
  </Card>
  <Card title="Websuche" href="/de/tools/web" icon="magnifying-glass">
    Websuche-Provider einschließlich Kimi konfigurieren.
  </Card>
  <Card title="Konfigurationsreferenz" href="/de/gateway/configuration-reference" icon="gear">
    Vollständiges Konfigurationsschema für Provider, Modelle und Plugins.
  </Card>
  <Card title="Moonshot Open Platform" href="https://platform.moonshot.ai" icon="globe">
    Moonshot-API-Schlüsselverwaltung und Dokumentation.
  </Card>
</CardGroup>
