---
read_when:
    - Sie konfigurieren das Plugin memory-lancedb
    - Sie möchten ein LanceDB-gestütztes Langzeitgedächtnis mit automatischem Abruf oder automatischer Erfassung.
    - Sie verwenden lokale OpenAI-kompatible Embeddings wie Ollama
sidebarTitle: Memory LanceDB
summary: Konfigurieren Sie das offizielle externe LanceDB-Speicher-Plugin, einschließlich lokaler Ollama-kompatibler Embeddings
title: Memory LanceDB
x-i18n:
    generated_at: "2026-07-24T04:02:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: bdb7208925ac6c76430ee36dfcd9733041530e0f2ee175950b3cdb8010d67b24
    source_path: plugins/memory-lancedb.md
    workflow: 16
---

`memory-lancedb` ist ein offizielles externes Plugin, das Langzeitspeicher mit
Vektorsuche in LanceDB speichert. Es kann relevante Erinnerungen vor einem
Modelldurchlauf automatisch abrufen und wichtige Fakten nach einer Antwort automatisch erfassen.

Verwenden Sie es für eine lokale Vektordatenbank, einen OpenAI-kompatiblen Embedding-Endpunkt oder
einen Erinnerungsspeicher außerhalb des standardmäßigen integrierten Speicher-Backends.

## Installation

```bash
openclaw plugins install @openclaw/memory-lancedb
```

Das Plugin wird auf npm veröffentlicht; es ist nicht im OpenClaw-Runtime-
Image enthalten. Bei der Installation wird der Plugin-Eintrag geschrieben, das Plugin aktiviert und
`plugins.slots.memory` auf `memory-lancedb` umgestellt. Wenn derzeit ein anderes Plugin
den Speicher-Slot belegt, wird dieses Plugin mit einer Warnung deaktiviert.

<Note>
Begleitende Plugins wie `memory-wiki` können parallel zu `memory-lancedb`
ausgeführt werden, aber jeweils nur ein Plugin belegt den aktiven Speicher-Slot.
</Note>

<Note>
`memory_recall` von LanceDB erhält nicht die geschützte Autorisierung für private Transkripte,
die von `memory.search.rememberAcrossConversations` verwendet wird. Verwenden Sie `autoRecall` von LanceDB
oder dessen Tool `memory_recall` über
[erweiterte Active Memory](/de/concepts/active-memory#lancedb-memory).
`openclaw doctor` meldet, wenn „Über Unterhaltungen hinweg merken“ beim
aktuellen Speicher-Provider nicht verfügbar ist.
</Note>

## Schnellstart

```json5
{
  plugins: {
    slots: {
      memory: "memory-lancedb",
    },
    entries: {
      "memory-lancedb": {
        enabled: true,
        config: {
          embedding: {
            provider: "openai",
            model: "text-embedding-3-small",
          },
          autoRecall: true,
          autoCapture: false,
        },
      },
    },
  },
}
```

Starten Sie den Gateway nach einer Änderung der Plugin-Konfiguration neu und überprüfen Sie anschließend, ob das Plugin geladen wurde:

```bash
openclaw gateway restart
openclaw plugins list
```

## Embedding-Konfiguration

`embedding` ist erforderlich und muss mindestens ein Feld enthalten. `provider`
verwendet standardmäßig `openai`; `model` verwendet standardmäßig `text-embedding-3-small`.

| Feld                   | Typ           | Hinweise                                                                 |
| ---------------------- | ------------- | ------------------------------------------------------------------------ |
| `embedding.provider`   | Zeichenfolge  | Adapter-ID, z. B. `openai`, `github-copilot`, `ollama`. Standardwert: `openai`. |
| `embedding.model`      | Zeichenfolge  | Standardwert: `text-embedding-3-small`.                                  |
| `embedding.apiKey`     | Zeichenfolge  | Optional; unterstützt die Erweiterung von `${ENV_VAR}`.                  |
| `embedding.baseUrl`    | Zeichenfolge  | Optional; unterstützt die Erweiterung von `${ENV_VAR}`.                  |
| `embedding.dimensions` | Ganzzahl (>=1) | Erforderlich für Modelle, die nicht in der integrierten Tabelle enthalten sind (siehe unten). |

Es gibt zwei Anfragepfade:

- **Provider-Adapter-Pfad** (Standard): Legen Sie `embedding.provider` fest und lassen Sie
  `embedding.apiKey`/`embedding.baseUrl` weg. Das Plugin löst das konfigurierte
  Authentifizierungsprofil, die Umgebungsvariable oder
  `models.providers.<provider>.apiKey` des Providers über dieselben Speicher-Embedding-
  Adapter auf, die `memory-core` verwendet. Dies ist der Pfad für `github-copilot`, `ollama`
  und jeden anderen gebündelten Provider mit Embedding-Unterstützung.
- **Direkter OpenAI-kompatibler Client-Pfad**: Lassen Sie `embedding.provider` nicht gesetzt
  (oder `"openai"`) und legen Sie `embedding.apiKey` sowie `embedding.baseUrl` fest. Verwenden Sie diesen Pfad
  für einen direkten OpenAI-kompatiblen Embedding-Endpunkt, für den kein gebündelter Provider-
  Adapter vorhanden ist.

OpenAI Codex-/ChatGPT-OAuth ist kein Embedding-Zugangsnachweis für die OpenAI Platform.
Verwenden Sie für OpenAI-Embeddings ein Authentifizierungsprofil mit OpenAI-API-Schlüssel, `OPENAI_API_KEY` oder
`models.providers.openai.apiKey`. Benutzer, die ausschließlich OAuth verwenden, sollten einen anderen
Embedding-fähigen Provider wie `github-copilot` oder `ollama` auswählen.

```json5
{
  plugins: {
    entries: {
      "memory-lancedb": {
        enabled: true,
        config: {
          embedding: {
            provider: "github-copilot",
            model: "text-embedding-3-small",
          },
        },
      },
    },
  },
}
```

Einige OpenAI-kompatible Embedding-Endpunkte lehnen den Parameter `encoding_format`
ab; andere ignorieren ihn und geben immer `number[]` zurück. `memory-lancedb`
lässt `encoding_format` bei Anfragen weg und akzeptiert sowohl Float-Arrays als auch
base64-codierte Float32-Antworten, sodass beide Antwortformate ohne Konfiguration funktionieren.

### Dimensionen

OpenClaw verfügt nur für `text-embedding-3-small` (1536) und
`text-embedding-3-large` (3072) über eine integrierte Dimension. Jedes andere Modell benötigt einen expliziten
Wert für `embedding.dimensions`, damit LanceDB die Vektorspalte erstellen kann, beispielsweise
ZhiPu `embedding-3` mit 2048 Dimensionen:

```json5
{
  plugins: {
    entries: {
      "memory-lancedb": {
        enabled: true,
        config: {
          embedding: {
            apiKey: "${ZHIPU_API_KEY}",
            baseUrl: "https://open.bigmodel.cn/api/paas/v4",
            model: "embedding-3",
            dimensions: 2048,
          },
        },
      },
    },
  },
}
```

## Ollama-Embeddings

Verwenden Sie den Pfad des gebündelten Ollama-Provider-Adapters (`embedding.provider: "ollama"`).
Er ruft den nativen Endpunkt `/api/embed` von Ollama auf und folgt denselben Regeln für Authentifizierung und Basis-
URL wie der Provider [Ollama](/de/providers/ollama).

```json5
{
  plugins: {
    slots: {
      memory: "memory-lancedb",
    },
    entries: {
      "memory-lancedb": {
        enabled: true,
        config: {
          embedding: {
            provider: "ollama",
            baseUrl: "http://127.0.0.1:11434",
            model: "mxbai-embed-large",
            dimensions: 1024,
          },
          recallMaxChars: 400,
          autoRecall: true,
          autoCapture: false,
        },
      },
    },
  },
}
```

`mxbai-embed-large` ist nicht in der integrierten Dimensionstabelle enthalten, daher ist `dimensions`
erforderlich. Senken Sie bei kleinen lokalen Embedding-Modellen `recallMaxChars`, wenn der
lokale Server Fehler bezüglich der Kontextlänge zurückgibt.

## Abruf- und Erfassungsgrenzen

| Einstellung         | Standardwert | Bereich                      | Gilt für                                                   |
| ------------------- | ------------ | ---------------------------- | ---------------------------------------------------------- |
| `recallMaxChars`  | `1000`  | 100-10000                    | Text, der zum Abruf an die Embedding-API gesendet wird.    |
| `captureMaxChars` | `500`   | 100-10000                    | Für die automatische Erfassung geeignete Nachrichtenlänge. |
| `customTriggers`  | `[]`    | 0-50 Elemente, jeweils <=100 Zeichen | Wörtliche Ausdrücke, durch die eine Nachricht für die automatische Erfassung berücksichtigt wird. |

`recallMaxChars` begrenzt die automatische Abrufanfrage von `before_prompt_build`, das
Tool `memory_recall`, den Anfragepfad `memory_forget` und `openclaw ltm
search`. Der automatische Abruf bettet die neueste Benutzernachricht des Durchlaufs ein und greift
nur dann auf den vollständigen Prompt zurück, wenn keine Benutzernachricht vorhanden ist. Dadurch bleiben Kanal-
Metadaten und große Prompt-Blöcke aus der Embedding-Anfrage heraus.

`captureMaxChars` steuert, ob eine Benutzernachricht aus dem Ereignis `agent_end`
des Durchlaufs kurz genug ist, um für die automatische Erfassung berücksichtigt zu werden; dies wirkt sich nicht auf
Abrufanfragen aus.

`customTriggers` fügt wörtliche Ausdrücke für die automatische Erfassung ohne reguläre Ausdrücke hinzu. Integrierte
Auslöser decken gängige englische, tschechische, chinesische, japanische und koreanische
Erinnerungsausdrücke ab (`remember`, `prefer`, `记住`, `覚えて`, `기억해` und ähnliche).

Die automatische Erfassung lehnt außerdem Text ab, der wie Envelope-/Transportmetadaten,
Prompt-Injection-Nutzlasten oder bereits eingefügter `<relevant-memories>`-Kontext aussieht,
und ist auf 3 erfasste Erinnerungen pro Agentendurchlauf begrenzt.

Jede Erinnerung gehört einem Agenten. Abruf, Duplikaterkennung, Erfassung,
Auflistung, direkte Abfragen und Löschung erzwingen diese Eigentümerschaft, bevor Zeilen zurückgegeben oder
geändert werden. Ein Agent mit `memory.search.enabled: false` in seinem `agents.entries.*`-
Eintrag oder ein Agent, der eine deaktivierte Suche auf oberster Ebene erbt, erhält außerdem keines der Tools `memory_recall`, `memory_store`
oder `memory_forget` und nimmt weder am automatischen Abruf noch an der
Erfassung teil, selbst wenn die Plugin-weiten Flags `autoRecall`/`autoCapture` aktiviert sind.

## Befehle

`memory-lancedb` registriert den CLI-Namensraum `ltm`, sobald es installiert ist
(nicht nur, wenn es den aktiven Speicher-Slot belegt):

```bash
openclaw ltm list [--agent <id>] [--limit <n>] [--order-by-created-at]
openclaw ltm search <query> [--agent <id>] [--limit <n>]
openclaw ltm stats [--agent <id>]
```

`ltm query` führt eine Nicht-Vektor-Abfrage direkt für die LanceDB-Tabelle aus:

```bash
openclaw ltm query --agent research --cols id,text,createdAt --limit 20
openclaw ltm query --filter "category = 'preference'" --order-by createdAt:desc
```

| Flag                              | Standardwert                            | Hinweise                                                                                                                                  |
| --------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `--agent <id>`                    | konfigurierter Standardagent            | Wählt den privaten Agenten-Namensraum aus. Verfügbar für `list`, `search`, `query` und `stats`.                                            |
| `--cols <columns>`                | `id,text,importance,category,createdAt` | Durch Kommas getrennte Zulassungsliste für Spalten.                                                                                       |
| `--filter <condition>`            | keiner                                  | Ein Vergleich für eine Ausgabespalte, beispielsweise `category = 'preference'` oder `importance >= 0.8`. Zeichenfolgenwerte müssen in Anführungszeichen stehen. |
| `--limit <n>`                     | `10`                                    | Positive Ganzzahl.                                                                                                                        |
| `--order-by <column>:<asc\|desc>` | keiner                                  | Wird nach Ausführung des Filters im Speicher sortiert; die Sortierspalte wird der Projektion automatisch hinzugefügt und aus der Ausgabe entfernt, wenn sie nicht angefordert wurde. |

Agenten erhalten drei Tools vom aktiven Speicher-Plugin:

- `memory_recall`: Vektorsuche in gespeicherten Erinnerungen.
- `memory_store`: speichert einen Fakt, eine Präferenz, eine Entscheidung oder eine Entität (lehnt Text ab,
  der wie eine Prompt-Injection-Nutzlast aussieht; überspringt nahezu identische Speicherungen).
- `memory_forget`: löscht anhand von `memoryId` oder `query` (löscht automatisch einen einzelnen
  Treffer mit einer Bewertung über 90 %, andernfalls werden zur Unterscheidung Kandidaten-IDs aufgelistet).

## Speicherung

LanceDB-Daten werden standardmäßig unter `~/.openclaw/memory/lancedb` gespeichert. Überschreiben Sie dies mit `dbPath`:

```json5
{
  plugins: {
    entries: {
      "memory-lancedb": {
        enabled: true,
        config: {
          dbPath: "~/.openclaw/memory/lancedb",
          embedding: {
            apiKey: "${OPENAI_API_KEY}",
            model: "text-embedding-3-small",
          },
        },
      },
    },
  },
}
```

Das Plugin verwaltet eine LanceDB-Tabelle und speichert in jeder
Zeile einen normalisierten Agenteneigentümer. Dies ist eine Speichergrenze und kein Filter nach der Suche: Die Agenteneigentümerschaft wird
vor der Vektorrangfolge angewendet und ist in den Prädikaten zum Auflisten, Abfragen, Zählen und Löschen
enthalten. `ltm query --filter` akzeptiert einen validierten Vergleich für die
öffentlichen Ausgabespalten. Der Speicher erstellt diesen Vergleich getrennt vom
obligatorischen Eigentümerprädikat, sodass ein Filter die Abfrage nicht auf einen anderen
Agenten ausweiten kann.

Datenbanken, die vor der Einführung der Agenteneigentümerschaft erstellt wurden, verfügen über keine zuverlässige Herkunftsinformation für ihre Zeilen.
Beim Upgrade weist `openclaw doctor --fix` diese Legacy-Zeilen einmalig dem
konfigurierten Standardagenten zu. Der Runtime-Zugriff schlägt sicher fehl, bis diese Migration
abgeschlossen ist; andere Agenten übernehmen niemals die alten gemeinsam genutzten Zeilen.

`storageOptions` akzeptiert Zeichenfolgen-Schlüssel/Wert-Paare für LanceDB-Speicher-Backends
(z. B. S3-kompatiblen Objektspeicher) und unterstützt die Erweiterung von `${ENV_VAR}`:

```json5
{
  plugins: {
    entries: {
      "memory-lancedb": {
        enabled: true,
        config: {
          dbPath: "s3://memory-bucket/openclaw",
          storageOptions: {
            access_key: "${AWS_ACCESS_KEY_ID}",
            secret_key: "${AWS_SECRET_ACCESS_KEY}",
            endpoint: "${AWS_ENDPOINT_URL}",
          },
          embedding: {
            apiKey: "${OPENAI_API_KEY}",
            model: "text-embedding-3-small",
          },
        },
      },
    },
  },
}
```

## Laufzeitabhängigkeiten und Plattformunterstützung

`memory-lancedb` hängt vom nativen Paket `@lancedb/lancedb` ab, das zum
Plugin-Paket gehört (nicht zur OpenClaw-Core-Distribution). Beim Start des Gateways werden
Plugin-Abhängigkeiten nicht repariert. Falls die native Abhängigkeit fehlt oder nicht geladen werden kann,
installieren oder aktualisieren Sie das Plugin-Paket und starten Sie das Gateway neu.

`@lancedb/lancedb` veröffentlicht keinen nativen Build für `darwin-x64` (Intel
Mac). Auf dieser Plattform protokolliert das Plugin beim Laden, dass LanceDB nicht verfügbar ist.
Verwenden Sie das standardmäßige Speicher-Backend, führen Sie das Gateway auf einer unterstützten
Plattform/Architektur aus oder deaktivieren Sie `memory-lancedb`.

## Fehlerbehebung

### Eingabelänge überschreitet die Kontextlänge

Das Embedding-Modell hat die Abrufabfrage abgelehnt:

```text
memory-lancedb: Abruf fehlgeschlagen: Fehler: 400 Die Eingabelänge überschreitet die Kontextlänge
```

Verringern Sie `recallMaxChars` und starten Sie anschließend das Gateway neu:

```json5
{
  plugins: {
    entries: {
      "memory-lancedb": {
        config: {
          recallMaxChars: 400,
        },
      },
    },
  },
}
```

Überprüfen Sie für Ollama außerdem, ob der Embedding-Server vom Gateway-Host
über seinen nativen Embed-Endpunkt erreichbar ist:

```bash
curl http://127.0.0.1:11434/api/embed \
  -H "Content-Type: application/json" \
  -d '{"model":"mxbai-embed-large","input":"hello"}'
```

### Nicht unterstütztes Embedding-Modell

Ohne `embedding.dimensions` sind nur die integrierten OpenAI-Embedding-Dimensionen
bekannt (`text-embedding-3-small`, `text-embedding-3-large`). Legen Sie für jedes andere
Modell `embedding.dimensions` auf die vom Modell gemeldete Vektorgröße fest.

### Plugin wird geladen, aber es werden keine Erinnerungen angezeigt

Vergewissern Sie sich, dass `plugins.slots.memory` auf `memory-lancedb` verweist, und führen Sie dann Folgendes aus:

```bash
openclaw ltm stats
openclaw ltm search "recent preference"
```

Wenn `autoCapture` deaktiviert ist, ruft das Plugin weiterhin vorhandene Erinnerungen ab,
speichert neue jedoch nicht automatisch. Verwenden Sie das Werkzeug `memory_store` oder aktivieren Sie
`autoCapture`.

## Verwandte Themen

- [Speicherübersicht](/de/concepts/memory)
- [Active Memory](/de/concepts/active-memory)
- [Speichersuche](/de/concepts/memory-search)
- [Speicher-Wiki](/de/plugins/memory-wiki)
- [Ollama](/de/providers/ollama)
