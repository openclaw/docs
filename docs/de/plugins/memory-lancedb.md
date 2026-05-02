---
read_when:
    - Sie konfigurieren das mitgelieferte memory-lancedb-Plugin
    - Sie möchten LanceDB-gestütztes Langzeitgedächtnis mit automatischem Abruf oder automatischer Erfassung
    - Sie verwenden lokale OpenAI-kompatible Embeddings wie Ollama
sidebarTitle: Memory LanceDB
summary: Konfigurieren Sie das mitgelieferte LanceDB-Speicher-Plugin, einschließlich lokaler Ollama-kompatibler Einbettungen
title: Speicher LanceDB
x-i18n:
    generated_at: "2026-05-02T06:41:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 671daa20e4f070f9beb0187ff76db9368297b3bc78873ebf3f09ac7ccffa00a2
    source_path: plugins/memory-lancedb.md
    workflow: 16
---

`memory-lancedb` ist ein gebündeltes Memory-Plugin, das langfristige Memory in
LanceDB speichert und Embeddings für den Abruf verwendet. Es kann relevante
Memories vor einer Modellrunde automatisch abrufen und wichtige Fakten nach einer Antwort erfassen.

Verwenden Sie es, wenn Sie eine lokale Vektordatenbank für Memory wünschen, einen
OpenAI-kompatiblen Embedding-Endpunkt benötigen oder eine Memory-Datenbank außerhalb
des standardmäßigen integrierten Memory-Speichers behalten möchten.

<Note>
`memory-lancedb` ist ein Active Memory-Plugin. Aktivieren Sie es, indem Sie den Memory-
Slot mit `plugins.slots.memory = "memory-lancedb"` auswählen. Begleitende Plugins wie
`memory-wiki` können daneben laufen, aber nur ein Plugin besitzt den Active Memory-Slot.
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

Starten Sie den Gateway neu, nachdem Sie die Plugin-Konfiguration geändert haben:

```bash
openclaw gateway restart
```

Prüfen Sie anschließend, ob das Plugin geladen ist:

```bash
openclaw plugins list
```

## Provider-gestützte Embeddings

`memory-lancedb` kann dieselben Adapter für Memory-Embedding-Provider verwenden wie
`memory-core`. Setzen Sie `embedding.provider` und lassen Sie `embedding.apiKey` weg, um das
konfigurierte Authentifizierungsprofil des Providers, die Umgebungsvariable oder
`models.providers.<provider>.apiKey` zu verwenden.

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

Dieser Pfad funktioniert mit Provider-Authentifizierungsprofilen, die Embedding-Anmeldedaten bereitstellen.
Beispielsweise kann GitHub Copilot verwendet werden, wenn das Copilot-Profil bzw. der Plan
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

OpenAI Codex / ChatGPT OAuth (`openai-codex`) ist keine Embedding-Anmeldedatenquelle für die OpenAI Platform.
Verwenden Sie für OpenAI-Embeddings ein Authentifizierungsprofil mit OpenAI API-Schlüssel,
`OPENAI_API_KEY` oder `models.providers.openai.apiKey`. Benutzer mit reinem OAuth können
einen anderen Embedding-fähigen Provider wie GitHub Copilot oder Ollama verwenden.

## Ollama-Embeddings

Für Ollama-Embeddings sollten Sie den gebündelten Ollama-Embedding-Provider bevorzugen. Er verwendet den
nativen Ollama-Endpunkt `/api/embed` und folgt denselben Regeln für Authentifizierung und Basis-URL wie
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

Verringern Sie bei kleinen lokalen Embedding-Modellen `recallMaxChars`, wenn Sie vom lokalen Server
Fehler zur Kontextlänge erhalten.

## OpenAI-kompatible Provider

Einige OpenAI-kompatible Embedding-Provider lehnen den Parameter `encoding_format`
ab, während andere ihn ignorieren und immer `number[]`-Vektoren zurückgeben.
`memory-lancedb` lässt `encoding_format` daher bei Embedding-Anfragen weg und
akzeptiert entweder Float-Array-Antworten oder base64-codierte float32-Antworten.

Wenn Sie einen einfachen OpenAI-kompatiblen Embeddings-Endpunkt haben, für den es keinen
gebündelten Provider-Adapter gibt, lassen Sie `embedding.provider` weg (oder belassen Sie es bei `openai`) und
setzen Sie `embedding.apiKey` zusammen mit `embedding.baseUrl`. Dadurch bleibt der direkte
OpenAI-kompatible Client-Pfad erhalten.

Setzen Sie `embedding.dimensions` für Provider, deren Modelldimensionen nicht integriert
sind. Beispielsweise verwendet ZhiPu `embedding-3` `2048` Dimensionen:

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

| Einstellung       | Standard | Bereich   | Gilt für                                      |
| ----------------- | -------- | --------- | --------------------------------------------- |
| `recallMaxChars`  | `1000`   | 100-10000 | Text, der für den Abruf an die Embedding-API gesendet wird |
| `captureMaxChars` | `500`    | 100-10000 | Länge von Assistant-Nachrichten, die für die Erfassung infrage kommt |

`recallMaxChars` steuert den automatischen Abruf, das Tool `memory_recall`, den
Abfragepfad `memory_forget` und `openclaw ltm search`. Der automatische Abruf bevorzugt die
neueste Benutzernachricht aus der Runde und fällt nur dann auf den vollständigen Prompt zurück, wenn keine
Benutzernachricht verfügbar ist. Dadurch bleiben Kanalmetadaten und große Prompt-Blöcke
aus der Embedding-Anfrage heraus.

`captureMaxChars` steuert, ob eine Antwort kurz genug ist, um für die
automatische Erfassung berücksichtigt zu werden. Es begrenzt keine Abrufabfrage-Embeddings.

## Befehle

Wenn `memory-lancedb` das aktive Memory-Plugin ist, registriert es den `ltm`-CLI-
Namensraum:

```bash
openclaw ltm list
openclaw ltm search "project preferences"
openclaw ltm stats
```

Das Plugin erweitert außerdem `openclaw memory` um den nicht vektorbasierten Unterbefehl `query`,
der direkt gegen die LanceDB-Tabelle ausgeführt wird:

```bash
openclaw memory query --cols id,text,createdAt --limit 20
openclaw memory query --filter "category = 'preference'" --order-by createdAt:desc
```

- `--cols <columns>`: Kommagetrennte Allowlist von Spalten (standardmäßig `id`, `text`, `importance`, `category`, `createdAt`).
- `--filter <condition>`: SQL-artige WHERE-Klausel; auf 200 Zeichen begrenzt und auf alphanumerische Zeichen, Vergleichsoperatoren, Anführungszeichen, Klammern und eine kleine Menge sicherer Interpunktion beschränkt.
- `--limit <n>`: Positive ganze Zahl; Standardwert `10`.
- `--order-by <column>:<asc|desc>`: Im Arbeitsspeicher angewendete Sortierung nach dem Filter; die Sortierspalte wird automatisch in die Projektion aufgenommen.

Agents erhalten außerdem LanceDB-Memory-Tools vom aktiven Memory-Plugin:

- `memory_recall` für LanceDB-gestützten Abruf
- `memory_store` zum Speichern wichtiger Fakten, Präferenzen, Entscheidungen und Entitäten
- `memory_forget` zum Entfernen passender Memories

## Speicherung

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

`storageOptions` akzeptiert Zeichenketten-Schlüssel/Wert-Paare für LanceDB-Speicher-Backends und
unterstützt die Erweiterung von `${ENV_VAR}`:

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

## Laufzeitabhängigkeiten

`memory-lancedb` hängt vom nativen Paket `@lancedb/lancedb` ab. Paketiertes
OpenClaw behandelt dieses Paket als Teil des Plugin-Pakets. Der Gateway-Start
repariert keine Plugin-Abhängigkeiten; wenn die Abhängigkeit fehlt, installieren oder
aktualisieren Sie das Plugin-Paket erneut und starten Sie den Gateway neu.

Wenn eine ältere Installation beim Laden des Plugins einen fehlenden `dist/package.json`- oder fehlenden
`@lancedb/lancedb`-Fehler protokolliert, aktualisieren Sie OpenClaw und starten Sie den
Gateway neu.

Wenn das Plugin protokolliert, dass LanceDB auf `darwin-x64` nicht verfügbar ist, verwenden Sie auf diesem Computer
das standardmäßige Memory-Backend, verschieben Sie den Gateway auf eine unterstützte Plattform oder
deaktivieren Sie `memory-lancedb`.

## Fehlerbehebung

### Eingabelänge überschreitet die Kontextlänge

Das bedeutet in der Regel, dass das Embedding-Modell die Abrufabfrage abgelehnt hat:

```text
memory-lancedb: recall failed: Error: 400 the input length exceeds the context length
```

Setzen Sie `recallMaxChars` niedriger und starten Sie dann den Gateway neu:

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

Prüfen Sie bei Ollama außerdem, ob der Embedding-Server vom Gateway-Host erreichbar ist:

```bash
curl http://127.0.0.1:11434/v1/embeddings \
  -H "Content-Type: application/json" \
  -d '{"model":"mxbai-embed-large","input":"hello"}'
```

### Nicht unterstütztes Embedding-Modell

Ohne `dimensions` sind nur die integrierten OpenAI-Embedding-Dimensionen bekannt.
Setzen Sie für lokale oder benutzerdefinierte Embedding-Modelle `embedding.dimensions` auf die von diesem Modell
gemeldete Vektorgröße.

### Plugin lädt, aber es erscheinen keine Memories

Prüfen Sie, ob `plugins.slots.memory` auf `memory-lancedb` zeigt, und führen Sie dann Folgendes aus:

```bash
openclaw ltm stats
openclaw ltm search "recent preference"
```

Wenn `autoCapture` deaktiviert ist, ruft das Plugin vorhandene Memories ab, speichert aber
nicht automatisch neue. Verwenden Sie das Tool `memory_store` oder aktivieren Sie
`autoCapture`, wenn Sie automatische Erfassung wünschen.

## Verwandt

- [Memory-Übersicht](/de/concepts/memory)
- [Active Memory](/de/concepts/active-memory)
- [Memory-Suche](/de/concepts/memory-search)
- [Memory Wiki](/de/plugins/memory-wiki)
- [Ollama](/de/providers/ollama)
