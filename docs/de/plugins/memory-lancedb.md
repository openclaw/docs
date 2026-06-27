---
read_when:
    - Sie konfigurieren das Plugin memory-lancedb
    - Sie möchten Langzeitgedächtnis auf Basis von LanceDB mit automatischem Abruf oder automatischer Erfassung
    - Sie verwenden lokale OpenAI-kompatible Embeddings wie Ollama
sidebarTitle: Memory LanceDB
summary: Konfigurieren Sie das offizielle externe LanceDB-Memory-Plugin, einschließlich lokaler Ollama-kompatibler Embeddings
title: Memory LanceDB
x-i18n:
    generated_at: "2026-06-27T17:49:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4142a755e788418a8b9c64a6ff3a8ce3c520bd6be09b685929478ae0754f7d39
    source_path: plugins/memory-lancedb.md
    workflow: 16
---

`memory-lancedb` ist ein offizielles externes Memory-Plugin, das Langzeitgedächtnis in
LanceDB speichert und Embeddings für den Abruf verwendet. Es kann relevante
Memories vor einem Model-Turn automatisch abrufen und wichtige Fakten nach einer Antwort erfassen.

Verwenden Sie es, wenn Sie eine lokale Vektordatenbank für Memory wünschen, einen
OpenAI-kompatiblen Embedding-Endpunkt benötigen oder eine Memory-Datenbank außerhalb
des standardmäßigen integrierten Memory-Speichers behalten möchten.

## Installation

Installieren Sie `memory-lancedb`, bevor Sie `plugins.slots.memory = "memory-lancedb"` setzen:

```bash
openclaw plugins install @openclaw/memory-lancedb
```

Das Plugin wird auf npm veröffentlicht und ist nicht im OpenClaw-Runtime-Image gebündelt.
Der Installer schreibt den Plugin-Eintrag und stellt den Memory-Slot um, wenn kein anderes
Plugin ihn besitzt.

<Note>
`memory-lancedb` ist ein Active-Memory-Plugin. Aktivieren Sie es, indem Sie den Memory-
Slot mit `plugins.slots.memory = "memory-lancedb"` auswählen. Begleit-Plugins wie
`memory-wiki` können daneben laufen, aber nur ein Plugin besitzt den aktiven Memory-Slot.
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

Starten Sie den Gateway nach dem Ändern der Plugin-Konfiguration neu:

```bash
openclaw gateway restart
```

Prüfen Sie anschließend, ob das Plugin geladen ist:

```bash
openclaw plugins list
```

## Provider-gestützte Embeddings

`memory-lancedb` kann dieselben Memory-Embedding-Provider-Adapter wie
`memory-core` verwenden. Setzen Sie `embedding.provider` und lassen Sie `embedding.apiKey` weg,
um das konfigurierte Auth-Profil, die Umgebungsvariable oder
`models.providers.<provider>.apiKey` des Providers zu verwenden.

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
        },
      },
    },
  },
}
```

Dieser Pfad funktioniert mit Provider-Auth-Profilen, die Embedding-Zugangsdaten bereitstellen.
Zum Beispiel kann GitHub Copilot verwendet werden, wenn das Copilot-Profil bzw. der Plan
Embeddings unterstützt:

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
            provider: "github-copilot",
            model: "text-embedding-3-small",
          },
        },
      },
    },
  },
}
```

OpenAI Codex / ChatGPT OAuth ist kein Embedding-Zugangsnachweis für die OpenAI Platform.
Für OpenAI-Embeddings verwenden Sie ein OpenAI-API-Key-Auth-Profil,
`OPENAI_API_KEY` oder `models.providers.openai.apiKey`. Benutzer mit ausschließlich OAuth können
einen anderen embedding-fähigen Provider wie GitHub Copilot oder Ollama verwenden.

## Ollama-Embeddings

Für Ollama-Embeddings sollten Sie bevorzugt den gebündelten Ollama-Embedding-Provider verwenden. Er nutzt den
nativen Ollama-Endpunkt `/api/embed` und folgt denselben Auth-/Basis-URL-Regeln wie
der in [Ollama](/de/providers/ollama) dokumentierte Ollama-Provider.

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

Setzen Sie `dimensions` für nicht standardmäßige Embedding-Modelle. OpenClaw kennt die
Dimensionen für `text-embedding-3-small` und `text-embedding-3-large`; benutzerdefinierte
Modelle benötigen den Wert in der Konfiguration, damit LanceDB die Vektorspalte erstellen kann.

Senken Sie bei kleinen lokalen Embedding-Modellen `recallMaxChars`, wenn Sie Kontextlängenfehler
vom lokalen Server sehen.

## OpenAI-kompatible Provider

Einige OpenAI-kompatible Embedding-Provider lehnen den Parameter `encoding_format`
ab, während andere ihn ignorieren und immer `number[]`-Vektoren zurückgeben.
`memory-lancedb` lässt `encoding_format` daher bei Embedding-Anfragen weg und
akzeptiert entweder Float-Array-Antworten oder base64-codierte float32-Antworten.

Wenn Sie einen rohen OpenAI-kompatiblen Embeddings-Endpunkt haben, für den es keinen
gebündelten Provider-Adapter gibt, lassen Sie `embedding.provider` weg (oder belassen Sie es bei `openai`) und
setzen Sie `embedding.apiKey` zusammen mit `embedding.baseUrl`. Dadurch bleibt der direkte
OpenAI-kompatible Client-Pfad erhalten.

Setzen Sie `embedding.dimensions` für Provider, deren Modelldimensionen nicht eingebaut
sind. Zum Beispiel verwendet ZhiPu `embedding-3` `2048` Dimensionen:

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

## Abruf- und Erfassungslimits

`memory-lancedb` hat zwei getrennte Textlimits:

| Einstellung       | Standard | Bereich   | Gilt für                                                  |
| ----------------- | -------- | --------- | --------------------------------------------------------- |
| `recallMaxChars`  | `1000`   | 100-10000 | Text, der für den Abruf an die Embedding-API gesendet wird |
| `captureMaxChars` | `500`    | 100-10000 | Nachrichtenlänge, die für automatische Erfassung infrage kommt |
| `customTriggers`  | `[]`     | 0-50      | wörtliche Phrasen, durch die Auto-Capture eine Nachricht berücksichtigt |

`recallMaxChars` steuert Auto-Recall, das Tool `memory_recall`, den
`memory_forget`-Abfragepfad und `openclaw ltm search`. Auto-Recall bevorzugt die
neueste Benutzernachricht aus dem Turn und fällt nur dann auf den vollständigen Prompt zurück,
wenn keine Benutzernachricht verfügbar ist. Dadurch bleiben Kanal-Metadaten und große Prompt-Blöcke
aus der Embedding-Anfrage heraus.

`captureMaxChars` steuert, ob eine Antwort kurz genug ist, um für die automatische
Erfassung berücksichtigt zu werden. Es begrenzt keine Recall-Abfrage-Embeddings.

Mit `customTriggers` können Sie wörtliche Auto-Capture-Phrasen hinzufügen, ohne
reguläre Ausdrücke zu schreiben. Die eingebauten Trigger enthalten gängige englische, tschechische,
chinesische, japanische und koreanische Memory-Phrasen.

## Befehle

Wenn `memory-lancedb` das aktive Memory-Plugin ist, registriert es den CLI-
Namespace `ltm`:

```bash
openclaw ltm list
openclaw ltm search "project preferences"
openclaw ltm stats
```

Der Unterbefehl `query` führt eine Nicht-Vektor-Abfrage direkt gegen die LanceDB-Tabelle
aus:

```bash
openclaw ltm query --cols id,text,createdAt --limit 20
openclaw ltm query --filter "category = 'preference'" --order-by createdAt:desc
```

- `--cols <columns>`: kommaseparierte Spalten-Allowlist (standardmäßig `id`, `text`, `importance`, `category`, `createdAt`).
- `--filter <condition>`: SQL-artige WHERE-Klausel; auf 200 Zeichen begrenzt und auf alphanumerische Zeichen, Vergleichsoperatoren, Anführungszeichen, Klammern und eine kleine Menge sicherer Interpunktion beschränkt.
- `--limit <n>`: positive Ganzzahl; Standard `10`.
- `--order-by <column>:<asc|desc>`: In-Memory-Sortierung, die nach dem Filter angewendet wird; die Sortierspalte wird automatisch in die Projektion aufgenommen.

Agenten erhalten außerdem LanceDB-Memory-Tools vom aktiven Memory-Plugin:

- `memory_recall` für LanceDB-gestützten Abruf
- `memory_store` zum Speichern wichtiger Fakten, Präferenzen, Entscheidungen und Entitäten
- `memory_forget` zum Entfernen passender Memories

## Speicher

Standardmäßig liegen LanceDB-Daten unter `~/.openclaw/memory/lancedb`. Überschreiben Sie den
Pfad mit `dbPath`:

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

`storageOptions` akzeptiert String-Schlüssel/Wert-Paare für LanceDB-Speicher-Backends und
unterstützt `${ENV_VAR}`-Erweiterung:

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

## Runtime-Abhängigkeiten

`memory-lancedb` hängt vom nativen Paket `@lancedb/lancedb` ab. Paketiertes
OpenClaw behandelt dieses Paket als Teil des Plugin-Pakets. Der Gateway-Start
repariert keine Plugin-Abhängigkeiten; wenn die Abhängigkeit fehlt, installieren oder
aktualisieren Sie das Plugin-Paket erneut und starten Sie den Gateway neu.

Wenn eine ältere Installation beim Laden des Plugins einen Fehler zu fehlendem `dist/package.json` oder fehlendem
`@lancedb/lancedb` protokolliert, aktualisieren Sie OpenClaw und starten Sie den
Gateway neu.

Wenn das Plugin protokolliert, dass LanceDB auf `darwin-x64` nicht verfügbar ist, verwenden Sie auf dieser
Maschine das standardmäßige Memory-Backend, verschieben Sie den Gateway auf eine unterstützte Plattform oder
deaktivieren Sie `memory-lancedb`.

## Fehlerbehebung

### Eingabelänge überschreitet die Kontextlänge

Dies bedeutet normalerweise, dass das Embedding-Modell die Recall-Abfrage abgelehnt hat:

```text
memory-lancedb: recall failed: Error: 400 the input length exceeds the context length
```

Setzen Sie einen niedrigeren Wert für `recallMaxChars` und starten Sie dann den Gateway neu:

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

Prüfen Sie bei Ollama außerdem, ob der Embedding-Server vom Gateway-Host aus erreichbar ist:

```bash
curl http://127.0.0.1:11434/v1/embeddings \
  -H "Content-Type: application/json" \
  -d '{"model":"mxbai-embed-large","input":"hello"}'
```

### Nicht unterstütztes Embedding-Modell

Ohne `dimensions` sind nur die eingebauten OpenAI-Embedding-Dimensionen bekannt.
Setzen Sie für lokale oder benutzerdefinierte Embedding-Modelle `embedding.dimensions` auf die von diesem Modell
gemeldete Vektorgröße.

### Plugin wird geladen, aber keine Memories erscheinen

Prüfen Sie, ob `plugins.slots.memory` auf `memory-lancedb` zeigt, und führen Sie dann aus:

```bash
openclaw ltm stats
openclaw ltm search "recent preference"
```

Wenn `autoCapture` deaktiviert ist, ruft das Plugin vorhandene Memories ab, speichert jedoch
nicht automatisch neue. Verwenden Sie das Tool `memory_store` oder aktivieren Sie
`autoCapture`, wenn Sie automatische Erfassung wünschen.

## Verwandte Themen

- [Memory-Überblick](/de/concepts/memory)
- [Active Memory](/de/concepts/active-memory)
- [Memory-Suche](/de/concepts/memory-search)
- [Memory Wiki](/de/plugins/memory-wiki)
- [Ollama](/de/providers/ollama)
