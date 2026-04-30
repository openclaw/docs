---
read_when:
    - Sie konfigurieren das mitgelieferte memory-lancedb-Plugin
    - Sie möchten einen LanceDB-gestützten Langzeitspeicher mit automatischem Wiederabruf oder automatischer Erfassung
    - Sie verwenden lokale OpenAI-kompatible Embeddings wie Ollama
sidebarTitle: Memory LanceDB
summary: Konfigurieren Sie das mitgelieferte LanceDB-Speicher-Plugin, einschließlich lokaler Ollama-kompatibler Embeddings
title: LanceDB-Speicher
x-i18n:
    generated_at: "2026-04-30T07:05:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: bda53528857a492f1627f655e49be6775e0114115781371ff67debb155b7e731
    source_path: plugins/memory-lancedb.md
    workflow: 16
---

`memory-lancedb` ist ein gebündeltes Memory-Plugin, das Langzeitspeicher in
LanceDB speichert und Embeddings für den Abruf verwendet. Es kann relevante
Erinnerungen vor einem Modell-Turn automatisch abrufen und wichtige Fakten nach
einer Antwort erfassen.

Verwenden Sie es, wenn Sie eine lokale Vektordatenbank für Memory benötigen,
einen OpenAI-kompatiblen Embedding-Endpunkt brauchen oder eine Memory-Datenbank
außerhalb des standardmäßigen integrierten Memory-Speichers verwalten möchten.

<Note>
`memory-lancedb` ist ein Active Memory-Plugin. Aktivieren Sie es, indem Sie den Memory-Slot
mit `plugins.slots.memory = "memory-lancedb"` auswählen. Begleit-Plugins wie
`memory-wiki` können daneben ausgeführt werden, aber nur ein Plugin besitzt den Active Memory-Slot.
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

Starten Sie den Gateway nach Änderungen an der Plugin-Konfiguration neu:

```bash
openclaw gateway restart
```

Prüfen Sie anschließend, ob das Plugin geladen ist:

```bash
openclaw plugins list
```

## Provider-gestützte Embeddings

`memory-lancedb` kann dieselben Memory-Embedding-Provider-Adapter wie
`memory-core` verwenden. Setzen Sie `embedding.provider` und lassen Sie `embedding.apiKey` weg, um das
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

Dieser Pfad funktioniert mit Provider-Authentifizierungsprofilen, die Embedding-Zugangsdaten bereitstellen.
GitHub Copilot kann beispielsweise verwendet werden, wenn das Copilot-Profil bzw. der Copilot-Plan
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

OpenAI Codex / ChatGPT OAuth (`openai-codex`) ist kein OpenAI Platform-Zugangsnachweis
für Embeddings. Verwenden Sie für OpenAI-Embeddings ein Authentifizierungsprofil mit OpenAI-API-Schlüssel,
`OPENAI_API_KEY` oder `models.providers.openai.apiKey`. Reine OAuth-Nutzer können
einen anderen Embedding-fähigen Provider wie GitHub Copilot oder Ollama verwenden.

## Ollama-Embeddings

Für Ollama-Embeddings sollten Sie den gebündelten Ollama-Embedding-Provider bevorzugen. Er verwendet den
nativen Ollama-Endpunkt `/api/embed` und folgt denselben Authentifizierungs- und Basis-URL-Regeln wie
der Ollama-Provider, der in [Ollama](/de/providers/ollama) dokumentiert ist.

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

Legen Sie `dimensions` für nicht standardmäßige Embedding-Modelle fest. OpenClaw kennt die
Dimensionen für `text-embedding-3-small` und `text-embedding-3-large`; benutzerdefinierte
Modelle benötigen den Wert in der Konfiguration, damit LanceDB die Vektorspalte erstellen kann.

Reduzieren Sie bei kleinen lokalen Embedding-Modellen `recallMaxChars`, wenn Sie Kontextlängenfehler
vom lokalen Server sehen.

## OpenAI-kompatible Provider

Einige OpenAI-kompatible Embedding-Provider lehnen den Parameter `encoding_format`
ab, während andere ihn ignorieren und immer `number[]`-Vektoren zurückgeben.
`memory-lancedb` lässt `encoding_format` bei Embedding-Anfragen daher weg und
akzeptiert entweder Float-Array-Antworten oder base64-codierte float32-Antworten.

Wenn Sie einen rohen OpenAI-kompatiblen Embeddings-Endpunkt haben, für den es keinen
gebündelten Provider-Adapter gibt, lassen Sie `embedding.provider` weg (oder belassen Sie ihn bei `openai`) und
setzen Sie `embedding.apiKey` sowie `embedding.baseUrl`. Dadurch bleibt der direkte
OpenAI-kompatible Client-Pfad erhalten.

Setzen Sie `embedding.dimensions` für Provider, deren Modelldimensionen nicht integriert
sind. ZhiPu `embedding-3` verwendet beispielsweise `2048` Dimensionen:

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

`memory-lancedb` hat zwei separate Textlimits:

| Einstellung       | Standard | Bereich   | Gilt für                                      |
| ----------------- | -------- | --------- | --------------------------------------------- |
| `recallMaxChars`  | `1000`   | 100-10000 | Text, der für den Abruf an die Embedding-API gesendet wird |
| `captureMaxChars` | `500`    | 100-10000 | Länge von Assistentennachrichten, die für die Erfassung infrage kommen |

`recallMaxChars` steuert den automatischen Abruf, das Tool `memory_recall`, den
Abfragepfad `memory_forget` und `openclaw ltm search`. Der automatische Abruf bevorzugt die
neueste Benutzernachricht aus dem Turn und greift nur dann auf den vollständigen Prompt zurück, wenn keine
Benutzernachricht verfügbar ist. Dadurch bleiben Kanalmetadaten und große Prompt-Blöcke
aus der Embedding-Anfrage heraus.

`captureMaxChars` steuert, ob eine Antwort kurz genug ist, um für die
automatische Erfassung berücksichtigt zu werden. Es begrenzt keine Embeddings für Abrufabfragen.

## Befehle

Wenn `memory-lancedb` das Active Memory-Plugin ist, registriert es den CLI-Namespace `ltm`:

```bash
openclaw ltm list
openclaw ltm search "project preferences"
openclaw ltm stats
```

Das Plugin erweitert außerdem `openclaw memory` um einen nicht vektorbasierten Unterbefehl `query`,
der direkt gegen die LanceDB-Tabelle ausgeführt wird:

```bash
openclaw memory query --cols id,text,createdAt --limit 20
openclaw memory query --filter "category = 'preference'" --order-by createdAt:desc
```

- `--cols <columns>`: kommagetrennte Spalten-Allowlist (standardmäßig `id`, `text`, `importance`, `category`, `createdAt`).
- `--filter <condition>`: SQL-ähnliche WHERE-Klausel; auf 200 Zeichen begrenzt und auf alphanumerische Zeichen, Vergleichsoperatoren, Anführungszeichen, Klammern und eine kleine Menge sicherer Satzzeichen beschränkt.
- `--limit <n>`: positive ganze Zahl; Standardwert `10`.
- `--order-by <column>:<asc|desc>`: In-Memory-Sortierung, die nach dem Filter angewendet wird; die Sortierspalte wird automatisch in die Projektion aufgenommen.

Agenten erhalten außerdem LanceDB-Memory-Tools vom Active Memory-Plugin:

- `memory_recall` für LanceDB-gestützten Abruf
- `memory_store` zum Speichern wichtiger Fakten, Präferenzen, Entscheidungen und Entitäten
- `memory_forget` zum Entfernen passender Erinnerungen

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

`storageOptions` akzeptiert Zeichenfolgen-Schlüssel/Wert-Paare für LanceDB-Speicher-Backends und
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

## Laufzeitabhängigkeiten

`memory-lancedb` hängt vom nativen Paket `@lancedb/lancedb` ab. Paketierte
OpenClaw-Installationen versuchen zuerst, die gebündelte Laufzeitabhängigkeit zu verwenden, und können die
Plugin-Laufzeitabhängigkeit unter dem OpenClaw-Status reparieren, wenn der gebündelte Import nicht
verfügbar ist.

Wenn eine ältere Installation während des Ladens des Plugins einen fehlenden `dist/package.json`- oder fehlenden
`@lancedb/lancedb`-Fehler protokolliert, aktualisieren Sie OpenClaw und starten Sie den
Gateway neu.

Wenn das Plugin protokolliert, dass LanceDB auf `darwin-x64` nicht verfügbar ist, verwenden Sie auf diesem Rechner das standardmäßige
Memory-Backend, verschieben Sie den Gateway auf eine unterstützte Plattform oder
deaktivieren Sie `memory-lancedb`.

## Fehlerbehebung

### Eingabelänge überschreitet die Kontextlänge

Dies bedeutet in der Regel, dass das Embedding-Modell die Abrufabfrage abgelehnt hat:

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

Prüfen Sie bei Ollama außerdem, ob der Embedding-Server vom Gateway-Host aus erreichbar ist:

```bash
curl http://127.0.0.1:11434/v1/embeddings \
  -H "Content-Type: application/json" \
  -d '{"model":"mxbai-embed-large","input":"hello"}'
```

### Nicht unterstütztes Embedding-Modell

Ohne `dimensions` sind nur die integrierten OpenAI-Embedding-Dimensionen bekannt.
Legen Sie für lokale oder benutzerdefinierte Embedding-Modelle `embedding.dimensions` auf die von diesem Modell gemeldete
Vektorgröße fest.

### Plugin wird geladen, aber es werden keine Erinnerungen angezeigt

Prüfen Sie, ob `plugins.slots.memory` auf `memory-lancedb` zeigt, und führen Sie dann Folgendes aus:

```bash
openclaw ltm stats
openclaw ltm search "recent preference"
```

Wenn `autoCapture` deaktiviert ist, ruft das Plugin vorhandene Erinnerungen ab, speichert aber
nicht automatisch neue. Verwenden Sie das Tool `memory_store` oder aktivieren Sie
`autoCapture`, wenn Sie automatische Erfassung wünschen.

## Verwandte Themen

- [Memory-Überblick](/de/concepts/memory)
- [Active Memory](/de/concepts/active-memory)
- [Memory-Suche](/de/concepts/memory-search)
- [Memory-Wiki](/de/plugins/memory-wiki)
- [Ollama](/de/providers/ollama)
