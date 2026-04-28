---
read_when:
    - Sie möchten OpenClaw mit Cloud- oder lokalen Modellen über Ollama ausführen
    - Sie benötigen Hinweise zur Einrichtung und Konfiguration von Ollama
    - Sie möchten Vision-Modelle von Ollama für Bildverständnis nutzen
summary: OpenClaw mit Ollama ausführen (Cloud- und lokale Modelle)
title: Ollama
x-i18n:
    generated_at: "2026-04-24T06:55:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9595459cc32ff81332b09a81388f84059f48e86039170078fd7f30ccd9b4e1f5
    source_path: providers/ollama.md
    workflow: 15
---

OpenClaw integriert sich mit der nativen API von Ollama (`/api/chat`) für gehostete Cloud-Modelle und lokale/selbstgehostete Ollama-Server. Sie können Ollama in drei Modi verwenden: `Cloud + Local` über einen erreichbaren Ollama-Host, `Cloud only` gegen `https://ollama.com` oder `Local only` gegen einen erreichbaren Ollama-Host.

<Warning>
**Benutzer von Remote-Ollama**: Verwenden Sie mit OpenClaw nicht die OpenAI-kompatible URL `/v1` (`http://host:11434/v1`). Dadurch bricht Tool-Calling, und Modelle können rohe Tool-JSON als Klartext ausgeben. Verwenden Sie stattdessen die native Ollama-API-URL: `baseUrl: "http://host:11434"` (ohne `/v1`).
</Warning>

## Erste Schritte

Wählen Sie Ihre bevorzugte Einrichtungsmethode und den Modus.

<Tabs>
  <Tab title="Onboarding (empfohlen)">
    **Am besten geeignet für:** der schnellste Weg zu einem funktionierenden Ollama-Cloud- oder lokalen Setup.

    <Steps>
      <Step title="Onboarding ausführen">
        ```bash
        openclaw onboard
        ```

        Wählen Sie **Ollama** aus der Anbieterliste.
      </Step>
      <Step title="Ihren Modus wählen">
        - **Cloud + Local** — lokaler Ollama-Host plus Cloud-Modelle, die über diesen Host geroutet werden
        - **Cloud only** — gehostete Ollama-Modelle über `https://ollama.com`
        - **Local only** — nur lokale Modelle

      </Step>
      <Step title="Ein Modell auswählen">
        `Cloud only` fordert `OLLAMA_API_KEY` an und schlägt gehostete Cloud-Standards vor. `Cloud + Local` und `Local only` fragen nach einer Ollama-Base-URL, erkennen verfügbare Modelle und ziehen das ausgewählte lokale Modell automatisch, falls es noch nicht verfügbar ist. `Cloud + Local` prüft außerdem, ob dieser Ollama-Host für den Cloud-Zugriff mit `ollama signin` angemeldet ist.
      </Step>
      <Step title="Überprüfen, ob das Modell verfügbar ist">
        ```bash
        openclaw models list --provider ollama
        ```
      </Step>
    </Steps>

    ### Nicht interaktiver Modus

    ```bash
    openclaw onboard --non-interactive \
      --auth-choice ollama \
      --accept-risk
    ```

    Optional können Sie eine benutzerdefinierte Base-URL oder ein Modell angeben:

    ```bash
    openclaw onboard --non-interactive \
      --auth-choice ollama \
      --custom-base-url "http://ollama-host:11434" \
      --custom-model-id "qwen3.5:27b" \
      --accept-risk
    ```

  </Tab>

  <Tab title="Manuelle Einrichtung">
    **Am besten geeignet für:** volle Kontrolle über Cloud- oder lokales Setup.

    <Steps>
      <Step title="Cloud oder lokal wählen">
        - **Cloud + Local**: Ollama installieren, mit `ollama signin` anmelden und Cloud-Anfragen über diesen Host routen
        - **Cloud only**: `https://ollama.com` mit einem `OLLAMA_API_KEY` verwenden
        - **Local only**: Ollama von [ollama.com/download](https://ollama.com/download) installieren

      </Step>
      <Step title="Ein lokales Modell ziehen (nur lokal)">
        ```bash
        ollama pull gemma4
        # oder
        ollama pull gpt-oss:20b
        # oder
        ollama pull llama3.3
        ```
      </Step>
      <Step title="Ollama für OpenClaw aktivieren">
        Für `Cloud only` verwenden Sie Ihren echten `OLLAMA_API_KEY`. Für hostgestützte Setups funktioniert jeder Platzhalterwert:

        ```bash
        # Cloud
        export OLLAMA_API_KEY="your-ollama-api-key"

        # Nur lokal
        export OLLAMA_API_KEY="ollama-local"

        # Oder in Ihrer Konfigurationsdatei konfigurieren
        openclaw config set models.providers.ollama.apiKey "OLLAMA_API_KEY"
        ```
      </Step>
      <Step title="Ihr Modell prüfen und setzen">
        ```bash
        openclaw models list
        openclaw models set ollama/gemma4
        ```

        Oder setzen Sie das Standardmodell in der Konfiguration:

        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "ollama/gemma4" },
            },
          },
        }
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## Cloud-Modelle

<Tabs>
  <Tab title="Cloud + Local">
    `Cloud + Local` verwendet einen erreichbaren Ollama-Host als Kontrollpunkt für lokale und Cloud-Modelle. Dies ist der bevorzugte Hybrid-Ablauf von Ollama.

    Verwenden Sie während des Setups **Cloud + Local**. OpenClaw fordert die Ollama-Base-URL an, erkennt lokale Modelle von diesem Host und prüft, ob der Host mit `ollama signin` für den Cloud-Zugriff angemeldet ist. Wenn der Host angemeldet ist, schlägt OpenClaw auch gehostete Cloud-Standards wie `kimi-k2.5:cloud`, `minimax-m2.7:cloud` und `glm-5.1:cloud` vor.

    Wenn der Host noch nicht angemeldet ist, bleibt das Setup in OpenClaw lokal, bis Sie `ollama signin` ausführen.

  </Tab>

  <Tab title="Cloud only">
    `Cloud only` wird gegen die gehostete API von Ollama unter `https://ollama.com` ausgeführt.

    Verwenden Sie während des Setups **Cloud only**. OpenClaw fordert `OLLAMA_API_KEY` an, setzt `baseUrl: "https://ollama.com"` und initialisiert die Liste gehosteter Cloud-Modelle. Dieser Pfad erfordert **keinen** lokalen Ollama-Server und kein `ollama signin`.

    Die Liste der Cloud-Modelle, die während `openclaw onboard` angezeigt wird, wird live aus `https://ollama.com/api/tags` befüllt und auf 500 Einträge begrenzt, sodass der Picker den aktuellen gehosteten Katalog widerspiegelt statt einer statischen Ausgangsmenge. Wenn `ollama.com` beim Setup nicht erreichbar ist oder keine Modelle zurückgibt, greift OpenClaw auf die bisherigen hartcodierten Vorschläge zurück, damit das Onboarding trotzdem abgeschlossen werden kann.

  </Tab>

  <Tab title="Local only">
    Im Nur-Lokal-Modus erkennt OpenClaw Modelle von der konfigurierten Ollama-Instanz. Dieser Pfad ist für lokale oder selbstgehostete Ollama-Server gedacht.

    OpenClaw schlägt derzeit `gemma4` als lokalen Standard vor.

  </Tab>
</Tabs>

## Modellerkennung (impliziter Anbieter)

Wenn Sie `OLLAMA_API_KEY` (oder ein Auth-Profil) setzen und **nicht** `models.providers.ollama` definieren, erkennt OpenClaw Modelle von der lokalen Ollama-Instanz unter `http://127.0.0.1:11434`.

| Verhalten            | Detail                                                                                                                                                               |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Katalogabfrage       | Fragt `/api/tags` ab                                                                                                                                                 |
| Capability-Erkennung | Verwendet Best-Effort-Lookups von `/api/show`, um `contextWindow` zu lesen und Capabilities (einschließlich Vision) zu erkennen                                     |
| Vision-Modelle       | Modelle mit einer von `/api/show` gemeldeten `vision`-Capability werden als bildfähig markiert (`input: ["text", "image"]`), sodass OpenClaw Bilder automatisch in den Prompt einfügt |
| Reasoning-Erkennung  | Markiert `reasoning` über eine Heuristik anhand des Modellnamens (`r1`, `reasoning`, `think`)                                                                       |
| Token-Grenzen        | Setzt `maxTokens` auf die Standard-Ollama-Grenze für maximale Tokens, die von OpenClaw verwendet wird                                                              |
| Kosten               | Setzt alle Kosten auf `0`                                                                                                                                             |

Dadurch vermeiden Sie manuelle Modelleinträge und halten den Katalog gleichzeitig mit der lokalen Ollama-Instanz im Einklang.

```bash
# Anzeigen, welche Modelle verfügbar sind
ollama list
openclaw models list
```

Um ein neues Modell hinzuzufügen, ziehen Sie es einfach mit Ollama:

```bash
ollama pull mistral
```

Das neue Modell wird automatisch erkannt und steht zur Verwendung bereit.

<Note>
Wenn Sie `models.providers.ollama` explizit setzen, wird die automatische Erkennung übersprungen und Sie müssen Modelle manuell definieren. Siehe dazu den Abschnitt zur expliziten Konfiguration unten.
</Note>

## Vision und Bildbeschreibung

Das gebündelte Ollama-Plugin registriert Ollama als bildfähigen Anbieter für Medienverständnis. Damit kann OpenClaw explizite Anforderungen zur Bildbeschreibung und konfigurierte Standardwerte für Bildmodelle über lokale oder gehostete Ollama-Vision-Modelle routen.

Für lokale Vision ziehen Sie ein Modell, das Bilder unterstützt:

```bash
ollama pull qwen2.5vl:7b
export OLLAMA_API_KEY="ollama-local"
```

Überprüfen Sie es dann mit der infer-CLI:

```bash
openclaw infer image describe \
  --file ./photo.jpg \
  --model ollama/qwen2.5vl:7b \
  --json
```

`--model` muss eine vollständige Referenz im Format `<provider/model>` sein. Wenn sie gesetzt ist, führt `openclaw infer image describe` dieses Modell direkt aus, statt die Beschreibung zu überspringen, weil das Modell native Vision unterstützt.

Um Ollama zum Standardmodell für Bildverständnis bei eingehenden Medien zu machen, konfigurieren Sie `agents.defaults.imageModel`:

```json5
{
  agents: {
    defaults: {
      imageModel: {
        primary: "ollama/qwen2.5vl:7b",
      },
    },
  },
}
```

Wenn Sie `models.providers.ollama.models` manuell definieren, markieren Sie Vision-Modelle mit Unterstützung für Bildeingaben:

```json5
{
  id: "qwen2.5vl:7b",
  name: "qwen2.5vl:7b",
  input: ["text", "image"],
  contextWindow: 128000,
  maxTokens: 8192,
}
```

OpenClaw lehnt Anfragen zur Bildbeschreibung für Modelle ab, die nicht als bildfähig markiert sind. Bei impliziter Erkennung liest OpenClaw dies aus Ollama, wenn `/api/show` eine Vision-Capability meldet.

## Konfiguration

<Tabs>
  <Tab title="Einfach (implizite Erkennung)">
    Der einfachste Weg, nur lokal zu aktivieren, führt über eine Umgebungsvariable:

    ```bash
    export OLLAMA_API_KEY="ollama-local"
    ```

    <Tip>
    Wenn `OLLAMA_API_KEY` gesetzt ist, können Sie `apiKey` im Provider-Eintrag weglassen, und OpenClaw füllt ihn für Verfügbarkeitsprüfungen aus.
    </Tip>

  </Tab>

  <Tab title="Explizit (manuelle Modelle)">
    Verwenden Sie explizite Konfiguration, wenn Sie ein gehostetes Cloud-Setup möchten, Ollama auf einem anderen Host/Port läuft, Sie bestimmte Kontextfenster oder Modelllisten erzwingen möchten oder vollständig manuelle Modelldefinitionen wollen.

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "https://ollama.com",
            apiKey: "OLLAMA_API_KEY",
            api: "ollama",
            models: [
              {
                id: "kimi-k2.5:cloud",
                name: "kimi-k2.5:cloud",
                reasoning: false,
                input: ["text", "image"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 128000,
                maxTokens: 8192
              }
            ]
          }
        }
      }
    }
    ```

  </Tab>

  <Tab title="Benutzerdefinierte Base-URL">
    Wenn Ollama auf einem anderen Host oder Port läuft (explizite Konfiguration deaktiviert die automatische Erkennung, daher müssen Modelle manuell definiert werden):

    ```json5
    {
      models: {
        providers: {
          ollama: {
            apiKey: "ollama-local",
            baseUrl: "http://ollama-host:11434", // Kein /v1 - native Ollama-API-URL verwenden
            api: "ollama", // Explizit setzen, um natives Tool-Calling-Verhalten sicherzustellen
          },
        },
      },
    }
    ```

    <Warning>
    Fügen Sie der URL kein `/v1` hinzu. Der Pfad `/v1` verwendet den OpenAI-kompatiblen Modus, in dem Tool-Calling nicht zuverlässig ist. Verwenden Sie die Basis-URL von Ollama ohne Pfad-Suffix.
    </Warning>

  </Tab>
</Tabs>

### Modellauswahl

Sobald konfiguriert, stehen alle Ihre Ollama-Modelle zur Verfügung:

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "ollama/gpt-oss:20b",
        fallbacks: ["ollama/llama3.3", "ollama/qwen2.5-coder:32b"],
      },
    },
  },
}
```

## Ollama Web Search

OpenClaw unterstützt **Ollama Web Search** als gebündelten Anbieter für `web_search`.

| Eigenschaft | Detail                                                                                                             |
| ----------- | ------------------------------------------------------------------------------------------------------------------ |
| Host        | Verwendet Ihren konfigurierten Ollama-Host (`models.providers.ollama.baseUrl`, wenn gesetzt, andernfalls `http://127.0.0.1:11434`) |
| Auth        | Kein Schlüssel erforderlich                                                                                        |
| Voraussetzung | Ollama muss laufen und mit `ollama signin` angemeldet sein                                                      |

Wählen Sie **Ollama Web Search** während `openclaw onboard` oder `openclaw configure --section web` oder setzen Sie:

```json5
{
  tools: {
    web: {
      search: {
        provider: "ollama",
      },
    },
  },
}
```

<Note>
Die vollständigen Details zu Einrichtung und Verhalten finden Sie unter [Ollama Web Search](/de/tools/ollama-search).
</Note>

## Erweiterte Konfiguration

<AccordionGroup>
  <Accordion title="Legacy-OpenAI-kompatibler Modus">
    <Warning>
    **Tool-Calling ist im OpenAI-kompatiblen Modus nicht zuverlässig.** Verwenden Sie diesen Modus nur, wenn Sie das OpenAI-Format für einen Proxy benötigen und nicht von nativem Tool-Calling-Verhalten abhängig sind.
    </Warning>

    Wenn Sie stattdessen den OpenAI-kompatiblen Endpunkt verwenden müssen (zum Beispiel hinter einem Proxy, der nur das OpenAI-Format unterstützt), setzen Sie `api: "openai-completions"` explizit:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://ollama-host:11434/v1",
            api: "openai-completions",
            injectNumCtxForOpenAICompat: true, // Standard: true
            apiKey: "ollama-local",
            models: [...]
          }
        }
      }
    }
    ```

    Dieser Modus unterstützt möglicherweise nicht gleichzeitig Streaming und Tool-Calling. Möglicherweise müssen Sie Streaming mit `params: { streaming: false }` in der Modellkonfiguration deaktivieren.

    Wenn `api: "openai-completions"` mit Ollama verwendet wird, injiziert OpenClaw standardmäßig `options.num_ctx`, damit Ollama nicht stillschweigend auf ein Kontextfenster von 4096 zurückfällt. Wenn Ihr Proxy/Upstream unbekannte Felder in `options` ablehnt, deaktivieren Sie dieses Verhalten:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://ollama-host:11434/v1",
            api: "openai-completions",
            injectNumCtxForOpenAICompat: false,
            apiKey: "ollama-local",
            models: [...]
          }
        }
      }
    }
    ```

  </Accordion>

  <Accordion title="Kontextfenster">
    Für automatisch erkannte Modelle verwendet OpenClaw das von Ollama gemeldete Kontextfenster, wenn verfügbar, andernfalls greift es auf das von OpenClaw verwendete Standard-Kontextfenster für Ollama zurück.

    Sie können `contextWindow` und `maxTokens` in der expliziten Anbieterkonfiguration überschreiben:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            models: [
              {
                id: "llama3.3",
                contextWindow: 131072,
                maxTokens: 65536,
              }
            ]
          }
        }
      }
    }
    ```

  </Accordion>

  <Accordion title="Reasoning-Modelle">
    OpenClaw behandelt Modelle mit Namen wie `deepseek-r1`, `reasoning` oder `think` standardmäßig als reasoning-fähig.

    ```bash
    ollama pull deepseek-r1:32b
    ```

    Es ist keine zusätzliche Konfiguration erforderlich -- OpenClaw markiert sie automatisch.

  </Accordion>

  <Accordion title="Modellkosten">
    Ollama ist kostenlos und läuft lokal, daher sind alle Modellkosten auf $0 gesetzt. Das gilt sowohl für automatisch erkannte als auch für manuell definierte Modelle.
  </Accordion>

  <Accordion title="Memory-Embeddings">
    Das gebündelte Ollama-Plugin registriert einen Anbieter für Memory-Embeddings für
    [Memory Search](/de/concepts/memory). Er verwendet die konfigurierte Ollama-Base-URL
    und den API-Schlüssel.

    | Eigenschaft     | Wert                |
    | --------------- | ------------------- |
    | Standardmodell  | `nomic-embed-text`  |
    | Auto-pull       | Ja — das Embedding-Modell wird automatisch gezogen, wenn es lokal nicht vorhanden ist |

    Um Ollama als Embedding-Anbieter für die Memory Search auszuwählen:

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: { provider: "ollama" },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Streaming-Konfiguration">
    Die Ollama-Integration von OpenClaw verwendet standardmäßig die **native Ollama-API** (`/api/chat`), die Streaming und Tool-Calling vollständig gleichzeitig unterstützt. Es ist keine besondere Konfiguration erforderlich.

    Für native `/api/chat`-Anfragen leitet OpenClaw außerdem die Thinking-Steuerung direkt an Ollama weiter: `/think off` und `openclaw agent --thinking off` senden auf oberster Ebene `think: false`, während Thinking-Stufen ungleich `off` `think: true` senden.

    <Tip>
    Wenn Sie den OpenAI-kompatiblen Endpunkt verwenden müssen, siehe oben den Abschnitt „Legacy-OpenAI-kompatibler Modus“. In diesem Modus funktionieren Streaming und Tool-Calling möglicherweise nicht gleichzeitig.
    </Tip>

  </Accordion>
</AccordionGroup>

## Fehlerbehebung

<AccordionGroup>
  <Accordion title="Ollama nicht erkannt">
    Stellen Sie sicher, dass Ollama läuft, dass Sie `OLLAMA_API_KEY` (oder ein Auth-Profil) gesetzt haben und dass Sie **keinen** expliziten Eintrag `models.providers.ollama` definiert haben:

    ```bash
    ollama serve
    ```

    Überprüfen Sie, ob die API erreichbar ist:

    ```bash
    curl http://localhost:11434/api/tags
    ```

  </Accordion>

  <Accordion title="Keine Modelle verfügbar">
    Wenn Ihr Modell nicht aufgelistet ist, ziehen Sie das Modell entweder lokal oder definieren Sie es explizit in `models.providers.ollama`.

    ```bash
    ollama list  # Anzeigen, was installiert ist
    ollama pull gemma4
    ollama pull gpt-oss:20b
    ollama pull llama3.3     # Oder ein anderes Modell
    ```

  </Accordion>

  <Accordion title="Verbindung abgelehnt">
    Prüfen Sie, ob Ollama auf dem richtigen Port läuft:

    ```bash
    # Prüfen, ob Ollama läuft
    ps aux | grep ollama

    # Oder Ollama neu starten
    ollama serve
    ```

  </Accordion>
</AccordionGroup>

<Note>
Weitere Hilfe: [Fehlerbehebung](/de/help/troubleshooting) und [FAQ](/de/help/faq).
</Note>

## Verwandt

<CardGroup cols={2}>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Überblick über alle Anbieter, Modellreferenzen und Failover-Verhalten.
  </Card>
  <Card title="Modellauswahl" href="/de/concepts/models" icon="brain">
    Wie Modelle ausgewählt und konfiguriert werden.
  </Card>
  <Card title="Ollama Web Search" href="/de/tools/ollama-search" icon="magnifying-glass">
    Vollständige Details zu Einrichtung und Verhalten für webbasierte Suche mit Ollama.
  </Card>
  <Card title="Konfiguration" href="/de/gateway/configuration" icon="gear">
    Vollständige Konfigurationsreferenz.
  </Card>
</CardGroup>
