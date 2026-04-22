---
read_when:
    - Du möchtest OpenClaw mit Cloud- oder lokalen Modellen über Ollama ausführen
    - Du benötigst eine Anleitung für Einrichtung und Konfiguration von Ollama
    - Du möchtest Ollama-Vision-Modelle für das Bildverständnis use
summary: OpenClaw mit Ollama ausführen (Cloud- und lokale Modelle)
title: Ollama
x-i18n:
    generated_at: "2026-04-22T04:27:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 32623b6523f22930a5987fb22d2074f1e9bb274cc01ae1ad1837825cc04ec179
    source_path: providers/ollama.md
    workflow: 15
---

# Ollama

OpenClaw integriert sich mit Ollamas nativer API (`/api/chat`) für gehostete Cloud-Modelle und lokale/self-hosted Ollama-Server. Du kannst Ollama in drei Modi verwenden: `Cloud + Local` über einen erreichbaren Ollama-Host, `Cloud only` gegen `https://ollama.com` oder `Local only` gegen einen erreichbaren Ollama-Host.

<Warning>
**Remote-Ollama-Benutzer**: Verwende nicht die OpenAI-kompatible URL `/v1` (`http://host:11434/v1`) mit OpenClaw. Das beeinträchtigt Tool-Calling und Modelle können rohes Tool-JSON als Klartext ausgeben. Verwende stattdessen die native Ollama-API-URL: `baseUrl: "http://host:11434"` (ohne `/v1`).
</Warning>

## Erste Schritte

Wähle deine bevorzugte Einrichtungsart und deinen Modus.

<Tabs>
  <Tab title="Onboarding (empfohlen)">
    **Am besten für:** den schnellsten Weg zu einem funktionierenden Ollama-Cloud- oder lokalen Setup.

    <Steps>
      <Step title="Onboarding ausführen">
        ```bash
        openclaw onboard
        ```

        Wähle **Ollama** aus der Provider-Liste.
      </Step>
      <Step title="Deinen Modus wählen">
        - **Cloud + Local** — lokaler Ollama-Host plus Cloud-Modelle, die über diesen Host geroutet werden
        - **Cloud only** — gehostete Ollama-Modelle über `https://ollama.com`
        - **Local only** — nur lokale Modelle
      </Step>
      <Step title="Ein Modell auswählen">
        `Cloud only` fragt nach `OLLAMA_API_KEY` und schlägt gehostete Cloud-Standards vor. `Cloud + Local` und `Local only` fragen nach einer Ollama-Base-URL, erkennen verfügbare Modelle und ziehen das ausgewählte lokale Modell automatisch, wenn es noch nicht verfügbar ist. `Cloud + Local` prüft außerdem, ob dieser Ollama-Host für den Cloud-Zugriff angemeldet ist.
      </Step>
      <Step title="Prüfen, ob das Modell verfügbar ist">
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

    Optional kannst du eine benutzerdefinierte Base-URL oder ein Modell angeben:

    ```bash
    openclaw onboard --non-interactive \
      --auth-choice ollama \
      --custom-base-url "http://ollama-host:11434" \
      --custom-model-id "qwen3.5:27b" \
      --accept-risk
    ```

  </Tab>

  <Tab title="Manuelle Einrichtung">
    **Am besten für:** vollständige Kontrolle über Cloud- oder lokales Setup.

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
        Für `Cloud only` verwende deinen echten `OLLAMA_API_KEY`. Für hostgestützte Setups funktioniert jeder Platzhalterwert:

        ```bash
        # Cloud
        export OLLAMA_API_KEY="your-ollama-api-key"

        # Nur lokal
        export OLLAMA_API_KEY="ollama-local"

        # Oder in deiner Konfigurationsdatei konfigurieren
        openclaw config set models.providers.ollama.apiKey "OLLAMA_API_KEY"
        ```
      </Step>
      <Step title="Dein Modell prüfen und setzen">
        ```bash
        openclaw models list
        openclaw models set ollama/gemma4
        ```

        Oder setze den Standard in der Konfiguration:

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
    `Cloud + Local` verwendet einen erreichbaren Ollama-Host als Steuerpunkt für lokale und Cloud-Modelle. Das ist Ollamas bevorzugter hybrider Ablauf.

    Verwende während der Einrichtung **Cloud + Local**. OpenClaw fragt nach der Ollama-Base-URL, erkennt lokale Modelle von diesem Host und prüft mit `ollama signin`, ob der Host für den Cloud-Zugriff angemeldet ist. Wenn der Host angemeldet ist, schlägt OpenClaw auch gehostete Cloud-Standards wie `kimi-k2.5:cloud`, `minimax-m2.7:cloud` und `glm-5.1:cloud` vor.

    Wenn der Host noch nicht angemeldet ist, belässt OpenClaw die Einrichtung bei nur lokal, bis du `ollama signin` ausführst.

  </Tab>

  <Tab title="Cloud only">
    `Cloud only` läuft gegen Ollamas gehostete API unter `https://ollama.com`.

    Verwende während der Einrichtung **Cloud only**. OpenClaw fragt nach `OLLAMA_API_KEY`, setzt `baseUrl: "https://ollama.com"` und initialisiert die gehostete Cloud-Modellliste. Dieser Pfad erfordert **keinen** lokalen Ollama-Server und kein `ollama signin`.

    Die Cloud-Modellliste, die während `openclaw onboard` angezeigt wird, wird live aus `https://ollama.com/api/tags` befüllt, begrenzt auf 500 Einträge, sodass der Picker den aktuellen gehosteten Katalog statt einer statischen Seed-Liste widerspiegelt. Wenn `ollama.com` nicht erreichbar ist oder zum Einrichtungszeitpunkt keine Modelle zurückgibt, fällt OpenClaw auf die bisherigen fest codierten Vorschläge zurück, damit das Onboarding dennoch abgeschlossen werden kann.

  </Tab>

  <Tab title="Local only">
    Im Nur-lokal-Modus erkennt OpenClaw Modelle von der konfigurierten Ollama-Instanz. Dieser Pfad ist für lokale oder self-hosted Ollama-Server gedacht.

    OpenClaw schlägt derzeit `gemma4` als lokalen Standard vor.

  </Tab>
</Tabs>

## Modellerkennung (impliziter Provider)

Wenn du `OLLAMA_API_KEY` (oder ein Auth-Profil) setzt und **nicht** `models.providers.ollama` definierst, erkennt OpenClaw Modelle von der lokalen Ollama-Instanz unter `http://127.0.0.1:11434`.

| Verhalten            | Detail                                                                                                                                                              |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Katalogabfrage       | Fragt `/api/tags` ab                                                                                                                                                |
| Fähigkeitserkennung  | Verwendet Best-Effort-`/api/show`-Lookups, um `contextWindow` zu lesen und Fähigkeiten zu erkennen (einschließlich Vision)                                        |
| Vision-Modelle       | Modelle mit einer von `/api/show` gemeldeten `vision`-Fähigkeit werden als bildfähig markiert (`input: ["text", "image"]`), sodass OpenClaw Bilder automatisch in den Prompt injiziert |
| Reasoning-Erkennung  | Markiert `reasoning` mit einer Heuristik für Modellnamen (`r1`, `reasoning`, `think`)                                                                              |
| Token-Grenzen        | Setzt `maxTokens` auf die von OpenClaw verwendete Standardobergrenze für Ollama-Max-Token                                                                          |
| Kosten               | Setzt alle Kosten auf `0`                                                                                                                                           |

Dadurch entfallen manuelle Modelleinträge, während der Katalog an die lokale Ollama-Instanz angepasst bleibt.

```bash
# Prüfen, welche Modelle verfügbar sind
ollama list
openclaw models list
```

Um ein neues Modell hinzuzufügen, ziehe es einfach mit Ollama:

```bash
ollama pull mistral
```

Das neue Modell wird automatisch erkannt und ist zur Verwendung verfügbar.

<Note>
Wenn du `models.providers.ollama` explizit setzt, wird die automatische Erkennung übersprungen und du musst Modelle manuell definieren. Siehe den Abschnitt zur expliziten Konfiguration unten.
</Note>

## Vision und Bildbeschreibung

Das gebündelte Ollama-Plugin registriert Ollama als bildfähigen Provider für Medienverständnis. Dadurch kann OpenClaw explizite Anfragen zur Bildbeschreibung und konfigurierte Standards für Bildmodelle über lokale oder gehostete Ollama-Vision-Modelle routen.

Für lokale Vision ziehe ein Modell, das Bilder unterstützt:

```bash
ollama pull qwen2.5vl:7b
export OLLAMA_API_KEY="ollama-local"
```

Prüfe es dann mit der Infer-CLI:

```bash
openclaw infer image describe \
  --file ./photo.jpg \
  --model ollama/qwen2.5vl:7b \
  --json
```

`--model` muss eine vollständige Ref im Format `<provider/model>` sein. Wenn es gesetzt ist, führt `openclaw infer image describe` dieses Modell direkt aus, statt die Beschreibung zu überspringen, weil das Modell native Vision unterstützt.

Um Ollama zum Standardmodell für Bildverständnis bei eingehenden Medien zu machen, konfiguriere `agents.defaults.imageModel`:

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

Wenn du `models.providers.ollama.models` manuell definierst, markiere Vision-Modelle mit Unterstützung für Bildeingabe:

```json5
{
  id: "qwen2.5vl:7b",
  name: "qwen2.5vl:7b",
  input: ["text", "image"],
  contextWindow: 128000,
  maxTokens: 8192,
}
```

OpenClaw lehnt Anfragen zur Bildbeschreibung für Modelle ab, die nicht als bildfähig markiert sind. Bei impliziter Erkennung liest OpenClaw dies von Ollama, wenn `/api/show` eine Vision-Fähigkeit meldet.

## Konfiguration

<Tabs>
  <Tab title="Einfach (implizite Erkennung)">
    Der einfachste Aktivierungspfad für nur lokal erfolgt über eine Umgebungsvariable:

    ```bash
    export OLLAMA_API_KEY="ollama-local"
    ```

    <Tip>
    Wenn `OLLAMA_API_KEY` gesetzt ist, kannst du `apiKey` im Provider-Eintrag weglassen und OpenClaw füllt ihn für Verfügbarkeitsprüfungen aus.
    </Tip>

  </Tab>

  <Tab title="Explizit (manuelle Modelle)">
    Verwende explizite Konfiguration, wenn du gehostetes Cloud-Setup möchtest, Ollama auf einem anderen Host/Port läuft, du bestimmte Kontextfenster oder Modelllisten erzwingen willst oder vollständig manuelle Modelldefinitionen haben möchtest.

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
    Wenn Ollama auf einem anderen Host oder Port läuft (explizite Konfiguration deaktiviert die automatische Erkennung, also definiere Modelle manuell):

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
    Füge der URL kein `/v1` hinzu. Der Pfad `/v1` verwendet den OpenAI-kompatiblen Modus, in dem Tool-Calling nicht zuverlässig ist. Verwende die Basis-Ollama-URL ohne Pfadsuffix.
    </Warning>

  </Tab>
</Tabs>

### Modellauswahl

Sobald konfiguriert, sind alle deine Ollama-Modelle verfügbar:

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

OpenClaw unterstützt **Ollama Web Search** als gebündelten `web_search`-Provider.

| Eigenschaft | Detail                                                                                                             |
| ----------- | ------------------------------------------------------------------------------------------------------------------ |
| Host        | Verwendet deinen konfigurierten Ollama-Host (`models.providers.ollama.baseUrl`, wenn gesetzt, andernfalls `http://127.0.0.1:11434`) |
| Auth        | Kein Schlüssel erforderlich                                                                                        |
| Voraussetzung | Ollama muss laufen und mit `ollama signin` angemeldet sein                                                      |

Wähle **Ollama Web Search** während `openclaw onboard` oder `openclaw configure --section web`, oder setze:

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
Vollständige Einrichtungs- und Verhaltensdetails findest du unter [Ollama Web Search](/de/tools/ollama-search).
</Note>

## Erweiterte Konfiguration

<AccordionGroup>
  <Accordion title="Veralteter OpenAI-kompatibler Modus">
    <Warning>
    **Tool-Calling ist im OpenAI-kompatiblen Modus nicht zuverlässig.** Verwende diesen Modus nur, wenn du das OpenAI-Format für einen Proxy benötigst und nicht vom nativen Tool-Calling-Verhalten abhängst.
    </Warning>

    Wenn du stattdessen den OpenAI-kompatiblen Endpunkt verwenden musst (zum Beispiel hinter einem Proxy, der nur das OpenAI-Format unterstützt), setze `api: "openai-completions"` explizit:

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

    Dieser Modus unterstützt Streaming und Tool-Calling möglicherweise nicht gleichzeitig. Eventuell musst du Streaming mit `params: { streaming: false }` in der Modellkonfiguration deaktivieren.

    Wenn `api: "openai-completions"` mit Ollama verwendet wird, injiziert OpenClaw standardmäßig `options.num_ctx`, damit Ollama nicht stillschweigend auf ein Kontextfenster von 4096 zurückfällt. Wenn dein Proxy/Upstream unbekannte `options`-Felder ablehnt, deaktiviere dieses Verhalten:

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
    Bei automatisch erkannten Modellen verwendet OpenClaw das von Ollama gemeldete Kontextfenster, wenn verfügbar, andernfalls fällt es auf das von OpenClaw verwendete Standard-Kontextfenster für Ollama zurück.

    Du kannst `contextWindow` und `maxTokens` in der expliziten Provider-Konfiguration überschreiben:

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
    Das gebündelte Ollama-Plugin registriert einen Embedding-Provider für Memory Search für
    [Memory Search](/de/concepts/memory). Er verwendet die konfigurierte Ollama-Base-URL
    und den API-Key.

    | Eigenschaft   | Wert               |
    | ------------- | ------------------ |
    | Standardmodell | `nomic-embed-text` |
    | Auto-Pull     | Ja — das Embedding-Modell wird automatisch gezogen, wenn es lokal nicht vorhanden ist |

    Um Ollama als Embedding-Provider für Memory Search auszuwählen:

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
    OpenClaws Ollama-Integration verwendet standardmäßig die **native Ollama-API** (`/api/chat`), die Streaming und Tool-Calling gleichzeitig vollständig unterstützt. Es ist keine spezielle Konfiguration erforderlich.

    <Tip>
    Wenn du den OpenAI-kompatiblen Endpunkt verwenden musst, siehe den Abschnitt „Veralteter OpenAI-kompatibler Modus“ oben. Streaming und Tool-Calling funktionieren in diesem Modus möglicherweise nicht gleichzeitig.
    </Tip>

  </Accordion>
</AccordionGroup>

## Fehlerbehebung

<AccordionGroup>
  <Accordion title="Ollama wird nicht erkannt">
    Stelle sicher, dass Ollama läuft und dass du `OLLAMA_API_KEY` (oder ein Auth-Profil) gesetzt hast und dass du **keinen** expliziten Eintrag `models.providers.ollama` definiert hast:

    ```bash
    ollama serve
    ```

    Prüfe, ob die API erreichbar ist:

    ```bash
    curl http://localhost:11434/api/tags
    ```

  </Accordion>

  <Accordion title="Keine Modelle verfügbar">
    Wenn dein Modell nicht aufgeführt ist, ziehe das Modell entweder lokal oder definiere es explizit in `models.providers.ollama`.

    ```bash
    ollama list  # Prüfen, was installiert ist
    ollama pull gemma4
    ollama pull gpt-oss:20b
    ollama pull llama3.3     # Oder ein anderes Modell
    ```

  </Accordion>

  <Accordion title="Verbindung abgelehnt">
    Prüfe, ob Ollama auf dem richtigen Port läuft:

    ```bash
    # Prüfen, ob Ollama läuft
    ps aux | grep ollama

    # Oder Ollama neu starten
    ollama serve
    ```

  </Accordion>
</AccordionGroup>

<Note>
Mehr Hilfe: [Fehlerbehebung](/de/help/troubleshooting) und [FAQ](/de/help/faq).
</Note>

## Verwandt

<CardGroup cols={2}>
  <Card title="Modell-Provider" href="/de/concepts/model-providers" icon="layers">
    Überblick über alle Provider, Modell-Refs und das Failover-Verhalten.
  </Card>
  <Card title="Modellauswahl" href="/de/concepts/models" icon="brain">
    Wie du Modelle auswählst und konfigurierst.
  </Card>
  <Card title="Ollama Web Search" href="/de/tools/ollama-search" icon="magnifying-glass">
    Vollständige Einrichtungs- und Verhaltensdetails für Ollama-gestützte Websuche.
  </Card>
  <Card title="Konfiguration" href="/de/gateway/configuration" icon="gear">
    Vollständige Konfigurationsreferenz.
  </Card>
</CardGroup>
