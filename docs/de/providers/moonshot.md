---
read_when:
    - Sie möchten die Einrichtung von Moonshot K2 (Moonshot Open Platform) im Vergleich zu Kimi Coding
    - Sie müssen getrennte Endpunkte, Schlüssel und Modellreferenzen verstehen
    - Sie möchten eine Konfiguration zum Kopieren und Einfügen für einen der beiden Provider
summary: Moonshot K2 im Vergleich zu Kimi Coding konfigurieren (separate Provider + Schlüssel)
title: Moonshot AI
x-i18n:
    generated_at: "2026-05-10T19:50:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0f6396d91ac8c1f698531ce067f79d4a4de7a5c7a166099c0fe4b7e5b78fde9e
    source_path: providers/moonshot.md
    workflow: 16
---

Moonshot stellt die Kimi API mit OpenAI-kompatiblen Endpunkten bereit. Konfigurieren Sie den
Provider und setzen Sie das Standardmodell auf `moonshot/kimi-k2.6`, oder verwenden Sie
Kimi Coding mit `kimi/kimi-for-coding`.

<Warning>
Moonshot und Kimi Coding sind **separate Provider**. Schlüssel sind nicht austauschbar, Endpunkte unterscheiden sich, und Modellreferenzen unterscheiden sich (`moonshot/...` gegenüber `kimi/...`).
</Warning>

## Integrierter Modellkatalog

[//]: # "moonshot-kimi-k2-ids:start"

| Modellreferenz                   | Name                   | Schlussfolgern | Eingabe    | Kontext | Max. Ausgabe |
| -------------------------------- | ---------------------- | -------------- | ---------- | ------- | ------------ |
| `moonshot/kimi-k2.6`              | Kimi K2.6              | Nein           | Text, Bild | 262,144 | 262,144      |
| `moonshot/kimi-k2.5`              | Kimi K2.5              | Nein           | Text, Bild | 262,144 | 262,144      |
| `moonshot/kimi-k2-thinking`       | Kimi K2 Thinking       | Ja             | Text       | 262,144 | 262,144      |
| `moonshot/kimi-k2-thinking-turbo` | Kimi K2 Thinking Turbo | Ja             | Text       | 262,144 | 262,144      |
| `moonshot/kimi-k2-turbo`          | Kimi K2 Turbo          | Nein           | Text       | 256,000 | 16,384       |

[//]: # "moonshot-kimi-k2-ids:end"

Gebündelte Kostenschätzungen für aktuelle von Moonshot gehostete K2-Modelle verwenden die von Moonshot
veröffentlichten nutzungsbasierten Tarife: Kimi K2.6 kostet 0,16 USD/MTok bei Cache-Treffern,
0,95 USD/MTok Eingabe und 4,00 USD/MTok Ausgabe; Kimi K2.5 kostet 0,10 USD/MTok bei Cache-Treffern,
0,60 USD/MTok Eingabe und 3,00 USD/MTok Ausgabe. Andere ältere Katalogeinträge behalten
Nullkosten-Platzhalter, sofern Sie sie nicht in der Konfiguration überschreiben.

## Erste Schritte

Wählen Sie Ihren Provider und folgen Sie den Einrichtungsschritten.

<Tabs>
  <Tab title="Moonshot API">
    **Am besten geeignet für:** Kimi K2-Modelle über die Moonshot Open Platform.

    <Steps>
      <Step title="Endpunktregion auswählen">
        | Authentifizierungsauswahl | Endpunkt                       | Region        |
        | ------------------------- | ------------------------------ | ------------- |
        | `moonshot-api-key`         | `https://api.moonshot.ai/v1`   | International |
        | `moonshot-api-key-cn`      | `https://api.moonshot.cn/v1`   | China         |
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
      <Step title="Verifizieren, dass Modelle verfügbar sind">
        ```bash
        openclaw models list --provider moonshot
        ```
      </Step>
      <Step title="Live-Smoke-Test ausführen">
        Verwenden Sie ein isoliertes Zustandsverzeichnis, wenn Sie Modellzugriff und Kostenverfolgung
        verifizieren möchten, ohne Ihre normalen Sitzungen zu verändern:

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
    **Am besten geeignet für:** codefokussierte Aufgaben über den Kimi Coding-Endpunkt.

    <Note>
    Kimi Coding verwendet einen anderen API-Schlüssel und ein anderes Provider-Präfix (`kimi/...`) als Moonshot (`moonshot/...`). Die stabile API-Modellreferenz ist `kimi/kimi-for-coding`; ältere Referenzen `kimi/kimi-code` und `kimi/k2p5` werden weiterhin akzeptiert und auf diese API-Modell-ID normalisiert.
    </Note>

    <Steps>
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
      <Step title="Verifizieren, dass das Modell verfügbar ist">
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

OpenClaw liefert außerdem **Kimi** als `web_search`-Provider aus, gestützt durch Moonshot-Websuche.

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

    | Einstellung          | Optionen                                                             |
    | -------------------- | -------------------------------------------------------------------- |
    | API-Region           | `https://api.moonshot.ai/v1` (international) oder `https://api.moonshot.cn/v1` (China) |
    | Websuchmodell        | Standardmäßig `kimi-k2.6`                                            |

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

    OpenClaw ordnet außerdem Laufzeit-`/think`-Stufen für Moonshot zu:

    | `/think`-Stufe       | Moonshot-Verhalten        |
    | -------------------- | ------------------------- |
    | `/think off`         | `thinking.type=disabled`  |
    | Jede Stufe außer off | `thinking.type=enabled`   |

    <Warning>
    Wenn Moonshot-Thinking aktiviert ist, muss `tool_choice` `auto` oder `none` sein. OpenClaw normalisiert inkompatible `tool_choice`-Werte aus Kompatibilitätsgründen zu `auto`.
    </Warning>

    Kimi K2.6 akzeptiert außerdem ein optionales Feld `thinking.keep`, das die
    Mehrfachzug-Beibehaltung von `reasoning_content` steuert. Setzen Sie es auf `"all"`, um das vollständige
    Reasoning über Züge hinweg beizubehalten; lassen Sie es weg (oder belassen Sie es bei `null`), um die
    Standardstrategie des Servers zu verwenden. OpenClaw leitet `thinking.keep` nur für
    `moonshot/kimi-k2.6` weiter und entfernt es aus anderen Modellen.

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
    Moonshot Kimi stellt tool_call-IDs in der Form `functions.<name>:<index>` bereit. OpenClaw behält sie unverändert bei, damit Tool-Aufrufe über mehrere Züge hinweg weiterhin funktionieren.

    Um eine strikte Bereinigung für einen benutzerdefinierten OpenAI-kompatiblen Provider zu erzwingen, setzen Sie `sanitizeToolCallIds: true`:

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

  <Accordion title="Kompatibilität mit Streaming-Nutzungsdaten">
    Native Moonshot-Endpunkte (`https://api.moonshot.ai/v1` und
    `https://api.moonshot.cn/v1`) geben Streaming-Nutzungsdaten-Kompatibilität auf dem
    gemeinsamen `openai-completions`-Transport an. OpenClaw leitet dies aus den
    Endpunktfähigkeiten ab, sodass kompatible benutzerdefinierte Provider-IDs, die dieselben nativen
    Moonshot-Hosts ansprechen, dasselbe Streaming-Nutzungsdaten-Verhalten übernehmen.

    Mit der gebündelten K2.6-Preisgestaltung wird gestreamte Nutzung, die Eingabe-,
    Ausgabe- und Cache-Read-Token umfasst, außerdem in lokal geschätzte USD-Kosten für
    `/status`, `/usage full`, `/usage cost` und transcript-gestützte Sitzungsabrechnung
    umgerechnet.

  </Accordion>

  <Accordion title="Endpunkt- und Modellreferenz">
    | Provider   | Präfix der Modellreferenz | Endpunkt                      | Auth-Umgebungsvariable        |
    | ---------- | ---------------- | ----------------------------- | ------------------- |
    | Moonshot   | `moonshot/`      | `https://api.moonshot.ai/v1`  | `MOONSHOT_API_KEY`  |
    | Moonshot CN| `moonshot/`      | `https://api.moonshot.cn/v1`  | `MOONSHOT_API_KEY`  |
    | Kimi Coding| `kimi/`          | Kimi Coding-Endpunkt          | `KIMI_API_KEY`      |
    | Websuche | Nicht zutreffend              | Identisch mit der Moonshot-API-Region   | `KIMI_API_KEY` oder `MOONSHOT_API_KEY` |

    - Die Kimi-Websuche verwendet `KIMI_API_KEY` oder `MOONSHOT_API_KEY` und nutzt standardmäßig `https://api.moonshot.ai/v1` mit dem Modell `kimi-k2.6`.
    - Überschreiben Sie Preis- und Kontextmetadaten bei Bedarf in `models.providers`.
    - Wenn Moonshot für ein Modell andere Kontextlimits veröffentlicht, passen Sie `contextWindow` entsprechend an.

  </Accordion>
</AccordionGroup>

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Auswahl von Providern, Modellreferenzen und Failover-Verhalten.
  </Card>
  <Card title="Websuche" href="/de/tools/web" icon="magnifying-glass">
    Konfiguration von Websuche-Providern einschließlich Kimi.
  </Card>
  <Card title="Konfigurationsreferenz" href="/de/gateway/configuration-reference" icon="gear">
    Vollständiges Konfigurationsschema für Provider, Modelle und Plugins.
  </Card>
  <Card title="Moonshot Open Platform" href="https://platform.moonshot.ai" icon="globe">
    Moonshot-API-Schlüsselverwaltung und Dokumentation.
  </Card>
</CardGroup>
