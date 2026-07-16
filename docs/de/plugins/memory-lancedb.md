---
read_when:
    - Sie konfigurieren das Plugin memory-lancedb
    - Sie möchten einen LanceDB-gestützten Langzeitspeicher mit automatischem Abruf oder automatischer Erfassung.
    - Sie verwenden lokale OpenAI-kompatible Embeddings wie Ollama
sidebarTitle: Memory LanceDB
summary: Konfigurieren Sie das offizielle externe LanceDB-Speicher-Plugin, einschließlich lokaler Ollama-kompatibler Embeddings
title: Memory LanceDB
x-i18n:
    generated_at: "2026-07-16T13:02:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 786b511da4fbfd90f4c3e5be5a1aeddf5daa59036247552bd671f4bab89319f6
    source_path: plugins/memory-lancedb.md
    workflow: 16
---

`memory-lancedb` ist ein offizielles externes Plugin, das Langzeitspeicher mit
Vektorsuche in LanceDB speichert. Es kann vor einem Modell-Turn relevante Erinnerungen
automatisch abrufen und nach einer Antwort wichtige Fakten automatisch erfassen.

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
Begleit-Plugins wie `memory-wiki` können parallel zu `memory-lancedb` ausgeführt werden,
aber jeweils nur ein Plugin belegt den aktiven Speicher-Slot.
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

Starten Sie den Gateway nach Änderungen an der Plugin-Konfiguration neu und prüfen Sie anschließend, ob das Plugin geladen wurde:

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

- **Provider-Adapterpfad** (Standard): Legen Sie `embedding.provider` fest und lassen Sie
  `embedding.apiKey`/`embedding.baseUrl` weg. Das Plugin ermittelt das konfigurierte
  Authentifizierungsprofil, die Umgebungsvariable oder
  `models.providers.<provider>.apiKey` des Providers über dieselben Speicher-Embedding-
  Adapter, die `memory-core` verwendet. Dies ist der Pfad für `github-copilot`, `ollama`
  und alle anderen gebündelten Provider mit Embedding-Unterstützung.
- **Direkter OpenAI-kompatibler Clientpfad**: Lassen Sie `embedding.provider` nicht festgelegt
  (oder `"openai"`) und legen Sie `embedding.apiKey` sowie `embedding.baseUrl` fest. Verwenden Sie diesen Pfad
  für einen nativen OpenAI-kompatiblen Embedding-Endpunkt ohne gebündelten Provider-
  Adapter.

OpenAI Codex-/ChatGPT-OAuth ist kein OpenAI-Platform-Zugangsnachweis für Embeddings.
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
Base64-codierte Float32-Antworten, sodass beide Antwortformate ohne Konfiguration funktionieren.

### Dimensionen

OpenClaw verfügt nur für `text-embedding-3-small` (1536) und
`text-embedding-3-large` (3072) über eine integrierte Dimension. Für jedes andere Modell ist
`embedding.dimensions` explizit erforderlich, damit LanceDB die Vektorspalte erstellen kann, beispielsweise
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
Er ruft den nativen `/api/embed`-Endpunkt von Ollama auf und folgt denselben Regeln für Authentifizierung und Basis-
URL wie der [Ollama](/de/providers/ollama)-Provider.

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
lokale Server Fehler wegen der Kontextlänge zurückgibt.

## Grenzwerte für Abruf und Erfassung

| Einstellung         | Standardwert | Bereich                      | Gilt für                                                   |
| ------------------- | ------------ | ---------------------------- | ---------------------------------------------------------- |
| `recallMaxChars`  | `1000`  | 100-10000                    | Text, der für den Abruf an die Embedding-API gesendet wird. |
| `captureMaxChars` | `500`   | 100-10000                    | Nachrichtenlänge, die für die automatische Erfassung infrage kommt. |
| `customTriggers`  | `[]`    | 0-50 Elemente mit jeweils <=100 Zeichen | Literale Formulierungen, durch die eine Nachricht für die automatische Erfassung berücksichtigt wird. |

`recallMaxChars` begrenzt die `before_prompt_build`-Anfrage für den automatischen Abruf, das
`memory_recall`-Tool, den `memory_forget`-Abfragepfad und `openclaw ltm
search`. Der automatische Abruf bettet die neueste Benutzernachricht des Turns ein und greift
nur dann auf den vollständigen Prompt zurück, wenn keine Benutzernachricht vorhanden ist. Dadurch bleiben Kanal-
Metadaten und große Prompt-Blöcke außerhalb der Embedding-Anfrage.

`captureMaxChars` steuert, ob eine Benutzernachricht aus dem `agent_end`-
Ereignis des Turns kurz genug ist, um für die automatische Erfassung berücksichtigt zu werden; Abrufabfragen
sind davon nicht betroffen.

`customTriggers` fügt literale Formulierungen für die automatische Erfassung ohne reguläre Ausdrücke hinzu. Integrierte
Auslöser decken gängige englische, tschechische, chinesische, japanische und koreanische Erinnerungs-
formulierungen ab (`remember`, `prefer`, `记住`, `覚えて`, `기억해` und ähnliche).

Die automatische Erfassung lehnt außerdem Text ab, der wie Umschlag-/Transportmetadaten,
Prompt-Injection-Nutzlasten oder bereits eingefügter `<relevant-memories>`-Kontext aussieht,
und ist auf 3 erfasste Erinnerungen pro Agent-Turn begrenzt.

Jede Erinnerung gehört genau einem Agent. Abruf, Duplikaterkennung, Erfassung,
Auflistung, Rohabfragen und Löschung erzwingen diese Eigentümerschaft, bevor Zeilen zurückgegeben oder
verändert werden. Ein Agent mit `memorySearch.enabled: false` (in `agents.list[]`
oder über `agents.defaults`) erhält außerdem keines der Tools `memory_recall`, `memory_store`
oder `memory_forget` und nimmt weder am automatischen Abruf noch an der automatischen
Erfassung teil, selbst wenn die Plugin-weiten Flags `autoRecall`/`autoCapture` aktiviert sind.

## Befehle

`memory-lancedb` registriert den CLI-Namespace `ltm`, sobald es installiert ist
(nicht nur, wenn es den aktiven Speicher-Slot belegt):

```bash
openclaw ltm list [--agent <id>] [--limit <n>] [--order-by-created-at]
openclaw ltm search <query> [--agent <id>] [--limit <n>]
openclaw ltm stats [--agent <id>]
```

`ltm query` führt eine Nicht-Vektor-Abfrage direkt gegen die LanceDB-Tabelle aus:

```bash
openclaw ltm query --agent research --cols id,text,createdAt --limit 20
openclaw ltm query --filter "category = 'preference'" --order-by createdAt:desc
```

| Flag                              | Standardwert                            | Hinweise                                                                                                                                  |
| --------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `--agent <id>`                    | konfigurierter Standard-Agent           | Wählt den privaten Agent-Namespace aus. Verfügbar für `list`, `search`, `query` und `stats`.                                             |
| `--cols <columns>`                | `id,text,importance,category,createdAt` | Durch Kommas getrennte Positivliste von Spalten.                                                                                          |
| `--filter <condition>`            | keine                                   | Ein Vergleich über eine Ausgabespalte, beispielsweise `category = 'preference'` oder `importance >= 0.8`. Zeichenfolgenwerte müssen in Anführungszeichen stehen. |
| `--limit <n>`                     | `10`                      | Positive Ganzzahl.                                                                                                                        |
| `--order-by <column>:<asc\|desc>` | keine                                   | Wird nach Ausführung des Filters im Arbeitsspeicher sortiert; die Sortierspalte wird automatisch zur Projektion hinzugefügt und aus der Ausgabe entfernt, wenn sie nicht angefordert wurde. |

Agents erhalten drei Tools vom aktiven Speicher-Plugin:

- `memory_recall`: Vektorsuche über gespeicherte Erinnerungen.
- `memory_store`: Speichert einen Fakt, eine Präferenz, eine Entscheidung oder eine Entität (lehnt Text ab,
  der wie eine Prompt-Injection-Nutzlast aussieht; überspringt nahezu identische Speicherungen).
- `memory_forget`: Löscht anhand von `memoryId` oder `query` (löscht automatisch einen einzelnen
  Treffer mit einem Score über 90 %, andernfalls werden zur Unterscheidung Kandidaten-IDs aufgelistet).

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
Zeile einen normalisierten Agent-Eigentümer. Dies ist eine Speichergrenze und kein Filter nach der Suche: Die Agent-Eigentümerschaft wird
vor der Vektorrangfolge angewendet und ist in den Prädikaten zum Auflisten, Abfragen, Zählen und Löschen
enthalten. `ltm query --filter` akzeptiert einen validierten Vergleich über die
öffentlichen Ausgabespalten. Der Speicher erstellt diesen Vergleich getrennt vom
obligatorischen Eigentümerprädikat, sodass ein Filter die Abfrage nicht auf einen anderen
Agent ausweiten kann.

Datenbanken, die vor der Einführung der Agent-spezifischen Eigentümerschaft erstellt wurden, besitzen keine zuverlässige Zeilenherkunft.
Beim Upgrade weist `openclaw doctor --fix` diese Legacy-Zeilen einmalig dem
konfigurierten Standard-Agent zu. Der Runtime-Zugriff schlägt sicher fehl, bis diese Migration
abgeschlossen ist; andere Agents übernehmen die alten gemeinsam genutzten Zeilen niemals.

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
Plugin-Abhängigkeiten nicht repariert. Wenn die native Abhängigkeit fehlt oder nicht geladen werden kann,
installieren oder aktualisieren Sie das Plugin-Paket und starten Sie den Gateway neu.

`@lancedb/lancedb` veröffentlicht keinen nativen Build für `darwin-x64` (Intel
Mac). Auf dieser Plattform protokolliert das Plugin beim Laden, dass LanceDB nicht verfügbar ist.
Verwenden Sie das standardmäßige Speicher-Backend, führen Sie den Gateway auf einer unterstützten
Plattform/Architektur aus oder deaktivieren Sie `memory-lancedb`.

## Fehlerbehebung

### Eingabelänge überschreitet die Kontextlänge

Das Einbettungsmodell hat die Abrufabfrage abgelehnt:

```text
memory-lancedb: Abruf fehlgeschlagen: Fehler: 400 Die Eingabelänge überschreitet die Kontextlänge
```

Verringern Sie `recallMaxChars` und starten Sie anschließend den Gateway neu:

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

Überprüfen Sie für Ollama außerdem über dessen nativen Einbettungs-Endpunkt, ob der
Einbettungsserver vom Gateway-Host aus erreichbar ist:

```bash
curl http://127.0.0.1:11434/api/embed \
  -H "Content-Type: application/json" \
  -d '{"model":"mxbai-embed-large","input":"hello"}'
```

### Nicht unterstütztes Einbettungsmodell

Ohne `embedding.dimensions` sind nur die integrierten Dimensionen der OpenAI-Einbettungsmodelle
bekannt (`text-embedding-3-small`, `text-embedding-3-large`). Legen Sie für jedes andere
Modell `embedding.dimensions` auf die vom Modell gemeldete Vektorgröße fest.

### Plugin wird geladen, aber es werden keine Erinnerungen angezeigt

Vergewissern Sie sich, dass `plugins.slots.memory` auf `memory-lancedb` verweist, und führen Sie dann Folgendes aus:

```bash
openclaw ltm stats
openclaw ltm search "recent preference"
```

Wenn `autoCapture` deaktiviert ist, ruft das Plugin weiterhin vorhandene Erinnerungen ab,
speichert jedoch nicht automatisch neue. Verwenden Sie das Tool `memory_store` oder aktivieren Sie
`autoCapture`.

## Verwandte Themen

- [Speicherübersicht](/de/concepts/memory)
- [Active Memory](/de/concepts/active-memory)
- [Speichersuche](/de/concepts/memory-search)
- [Speicher-Wiki](/de/plugins/memory-wiki)
- [Ollama](/de/providers/ollama)
