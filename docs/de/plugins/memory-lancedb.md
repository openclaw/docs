---
read_when:
    - Sie konfigurieren das Plugin memory-lancedb
    - Sie möchten einen LanceDB-basierten Langzeitspeicher mit automatischem Abruf oder automatischer Erfassung
    - Sie verwenden lokale OpenAI-kompatible Embeddings wie Ollama
sidebarTitle: Memory LanceDB
summary: Konfigurieren Sie das offizielle externe LanceDB-Memory-Plugin, einschließlich lokaler Ollama-kompatibler Embeddings
title: Memory LanceDB
x-i18n:
    generated_at: "2026-07-12T15:42:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: cdcf5ef7b7fbb8bf6055363d86782cfa36df193fc724406dba06c1380fd9f434
    source_path: plugins/memory-lancedb.md
    workflow: 16
---

`memory-lancedb` ist ein offizielles externes Plugin, das Langzeitgedächtnis mit
Vektorsuche in LanceDB speichert. Es kann relevante Erinnerungen vor einem
Modelldurchlauf automatisch abrufen und wichtige Fakten nach einer Antwort
automatisch erfassen.

Verwenden Sie es für eine lokale Vektordatenbank, einen OpenAI-kompatiblen
Embedding-Endpunkt oder einen Speicher außerhalb des standardmäßigen
integrierten Gedächtnis-Backends.

## Installation

```bash
openclaw plugins install @openclaw/memory-lancedb
```

Das Plugin wird auf npm veröffentlicht; es ist nicht im OpenClaw-Laufzeit-Image
enthalten. Bei der Installation wird der Plugin-Eintrag geschrieben, das Plugin
aktiviert und `plugins.slots.memory` auf `memory-lancedb` umgestellt. Wenn
derzeit ein anderes Plugin den Gedächtnis-Slot belegt, wird dieses Plugin mit
einer Warnung deaktiviert.

<Note>
Ergänzende Plugins wie `memory-wiki` können neben `memory-lancedb` ausgeführt
werden, aber jeweils nur ein Plugin belegt den aktiven Gedächtnis-Slot.
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

Starten Sie den Gateway nach einer Änderung der Plugin-Konfiguration neu und
überprüfen Sie anschließend, ob das Plugin geladen wurde:

```bash
openclaw gateway restart
openclaw plugins list
```

## Embedding-Konfiguration

`embedding` ist erforderlich und muss mindestens ein Feld enthalten.
`provider` ist standardmäßig `openai`; `model` ist standardmäßig
`text-embedding-3-small`.

| Feld                   | Typ                | Hinweise                                                                        |
| ---------------------- | ------------------ | ------------------------------------------------------------------------------- |
| `embedding.provider`   | Zeichenfolge       | Adapter-ID, z. B. `openai`, `github-copilot`, `ollama`. Standardwert `openai`. |
| `embedding.model`      | Zeichenfolge       | Standardwert `text-embedding-3-small`.                                          |
| `embedding.apiKey`     | Zeichenfolge       | Optional; unterstützt die Erweiterung von `${ENV_VAR}`.                         |
| `embedding.baseUrl`    | Zeichenfolge       | Optional; unterstützt die Erweiterung von `${ENV_VAR}`.                         |
| `embedding.dimensions` | Ganzzahl (>=1)      | Erforderlich für Modelle, die nicht in der integrierten Tabelle enthalten sind (siehe unten). |

Es gibt zwei Anfragepfade:

- **Pfad über den Provider-Adapter** (Standard): Legen Sie `embedding.provider` fest und lassen Sie
  `embedding.apiKey`/`embedding.baseUrl` weg. Das Plugin ermittelt das
  konfigurierte Authentifizierungsprofil, die Umgebungsvariable oder
  `models.providers.<provider>.apiKey` des Providers über dieselben Adapter für
  Speicher-Embeddings, die `memory-core` verwendet. Dies ist der Pfad für
  `github-copilot`, `ollama` und alle anderen gebündelten Provider mit
  Embedding-Unterstützung.
- **Direkter Pfad über einen OpenAI-kompatiblen Client**: Lassen Sie
  `embedding.provider` ungesetzt (oder auf `"openai"`) und legen Sie
  `embedding.apiKey` sowie `embedding.baseUrl` fest. Verwenden Sie diesen Pfad
  für einen direkten OpenAI-kompatiblen Embeddings-Endpunkt ohne gebündelten
  Provider-Adapter.

OpenAI Codex-/ChatGPT-OAuth ist kein Zugangsnachweis für Embeddings der OpenAI Platform.
Verwenden Sie für OpenAI-Embeddings ein Authentifizierungsprofil mit OpenAI-API-Schlüssel,
`OPENAI_API_KEY` oder `models.providers.openai.apiKey`. Benutzer, die ausschließlich
OAuth verwenden, sollten einen anderen Embedding-fähigen Provider wie
`github-copilot` oder `ollama` auswählen.

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

Einige OpenAI-kompatible Embedding-Endpunkte lehnen den Parameter
`encoding_format` ab; andere ignorieren ihn und geben immer `number[]` zurück.
`memory-lancedb` lässt `encoding_format` bei Anfragen weg und akzeptiert sowohl
Float-Arrays als auch Base64-codierte Float32-Antworten. Daher funktionieren
beide Antwortformate ohne Konfiguration.

### Dimensionen

OpenClaw verfügt nur für `text-embedding-3-small` (1536) und
`text-embedding-3-large` (3072) über eine integrierte Dimensionsangabe. Für
jedes andere Modell ist eine explizite Angabe unter `embedding.dimensions`
erforderlich, damit LanceDB die Vektorspalte erstellen kann, beispielsweise
für ZhiPu `embedding-3` mit 2048 Dimensionen:

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

Verwenden Sie den gebündelten Ollama-Provider-Adapterpfad (`embedding.provider: "ollama"`).
Er ruft Ollamas nativen Endpunkt `/api/embed` auf und folgt denselben Regeln für Authentifizierung und Basis-URL
wie der [Ollama](/de/providers/ollama)-Provider.

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
erforderlich. Verringern Sie bei kleinen lokalen Embedding-Modellen `recallMaxChars`, wenn der
lokale Server Fehler wegen Überschreitung der Kontextlänge zurückgibt.

## Limits für Abruf und Erfassung

| Einstellung       | Standardwert | Bereich                      | Gilt für                                                          |
| ----------------- | ------------ | ---------------------------- | ----------------------------------------------------------------- |
| `recallMaxChars`  | `1000`       | 100-10000                    | Text, der zum Abruf an die Embedding-API gesendet wird.           |
| `captureMaxChars` | `500`        | 100-10000                    | Für die automatische Erfassung geeignete Nachrichtenlänge.        |
| `customTriggers`  | `[]`         | 0-50 Einträge mit je <=100 Zeichen | Wörtliche Ausdrücke, durch die eine Nachricht für die automatische Erfassung berücksichtigt wird. |

`recallMaxChars` begrenzt die automatische Abrufabfrage von `before_prompt_build`, das Tool `memory_recall`, den Abfragepfad `memory_forget` und `openclaw ltm
search`. Der automatische Abruf bettet die neueste Benutzernachricht des Durchlaufs ein und greift nur dann auf den vollständigen Prompt zurück, wenn keine Benutzernachricht vorhanden ist. Dadurch bleiben Kanalmetadaten und große Prompt-Blöcke von der Embedding-Anfrage ausgeschlossen.

`captureMaxChars` bestimmt, ob eine Benutzernachricht aus dem Ereignis `agent_end` des Durchlaufs kurz genug ist, um für die automatische Erfassung berücksichtigt zu werden; Abrufabfragen werden davon nicht beeinflusst.

`customTriggers` fügt wörtliche Formulierungen für die automatische Erfassung ohne reguläre Ausdrücke hinzu. Integrierte
Trigger decken gängige englische, tschechische, chinesische, japanische und koreanische
Formulierungen für Erinnerungen ab (`remember`, `prefer`, `记住`, `覚えて`, `기억해` und ähnliche).

Die automatische Erfassung lehnt außerdem Text ab, der wie Umschlag-/Transportmetadaten,
Prompt-Injection-Payloads oder bereits eingefügter `<relevant-memories>`-Kontext aussieht,
und begrenzt die Erfassung auf 3 Erinnerungen pro Agent-Durchlauf.

## Befehle

`memory-lancedb` registriert den CLI-Namensraum `ltm`, sobald es installiert ist
(nicht nur, wenn es den aktiven Speicherplatz belegt):

```bash
openclaw ltm list [--limit <n>] [--order-by-created-at]
openclaw ltm search <query> [--limit <n>]
openclaw ltm stats
```

`ltm query` führt eine Nicht-Vektor-Abfrage direkt für die LanceDB-Tabelle aus:

```bash
openclaw ltm query --cols id,text,createdAt --limit 20
openclaw ltm query --filter "category = 'preference'" --order-by createdAt:desc
```

| Flag                              | Standardwert                            | Hinweise                                                                                                                                                                                                     |
| --------------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `--cols <columns>`                | `id,text,importance,category,createdAt` | Kommagetrennte Positivliste von Spalten.                                                                                                                                                                      |
| `--filter <condition>`            | keiner                                  | WHERE-Klausel im SQL-Stil. Maximal 200 Zeichen; nur alphanumerische Zeichen, `_-`, Leerraum und `='"<>!.,()%*` sind zulässig.                                                                                  |
| `--limit <n>`                     | `10`                                    | Positive Ganzzahl.                                                                                                                                                                                            |
| `--order-by <column>:<asc\|desc>` | keiner                                  | Nach Ausführung des Filters im Arbeitsspeicher sortiert; die Sortierspalte wird automatisch zur Projektion hinzugefügt und aus der Ausgabe entfernt, wenn sie nicht angefordert wurde.                         |

Agents erhalten drei Werkzeuge vom aktiven Speicher-Plugin:

- `memory_recall`: Vektorsuche in gespeicherten Erinnerungen.
- `memory_store`: Speichert eine Tatsache, Präferenz, Entscheidung oder Entität (lehnt Text
  ab, der wie ein Prompt-Injection-Payload aussieht; überspringt nahezu identische Speicherungen).
- `memory_forget`: Löscht anhand von `memoryId` oder `query` (löscht automatisch einen einzelnen
  Treffer mit einer Bewertung über 90 %, andernfalls werden zur Klärung mögliche IDs aufgelistet).

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

`storageOptions` akzeptiert Schlüssel-Wert-Paare aus Zeichenfolgen für LanceDB-Speicher-Backends
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
Plugin-Abhängigkeiten nicht repariert. Wenn die native Abhängigkeit fehlt oder nicht geladen werden kann,
installieren oder aktualisieren Sie das Plugin-Paket erneut und starten Sie das Gateway neu.

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

Prüfen Sie für Ollama außerdem mithilfe seines nativen Embed-Endpunkts, ob der Embedding-Server
vom Gateway-Host aus erreichbar ist:

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

Bestätigen Sie, dass `plugins.slots.memory` auf `memory-lancedb` verweist, und führen Sie dann Folgendes aus:

```bash
openclaw ltm stats
openclaw ltm search "recent preference"
```

Wenn `autoCapture` deaktiviert ist, ruft das Plugin weiterhin vorhandene Erinnerungen ab, speichert jedoch
nicht automatisch neue. Verwenden Sie das Tool `memory_store` oder aktivieren Sie
`autoCapture`.

## Verwandte Themen

- [Übersicht über den Speicher](/de/concepts/memory)
- [Active Memory](/de/concepts/active-memory)
- [Speichersuche](/de/concepts/memory-search)
- [Speicher-Wiki](/de/plugins/memory-wiki)
- [Ollama](/de/providers/ollama)
