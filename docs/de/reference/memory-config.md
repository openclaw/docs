---
read_when:
    - Sie möchten Provider oder Embedding-Modelle für Memory Search konfigurieren
    - Sie möchten das QMD-Backend einrichten
    - Sie möchten Hybrid Search, MMR oder zeitlichen Zerfall abstimmen
    - Sie möchten multimodale Memory-Indexierung aktivieren
summary: Alle Konfigurationsoptionen für Memory Search, Embedding-Provider, QMD, Hybrid Search und multimodale Indexierung
title: Konfigurationsreferenz für Memory
x-i18n:
    generated_at: "2026-04-06T03:12:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0de0b85125443584f4e575cf673ca8d9bd12ecd849d73c537f4a17545afa93fd
    source_path: reference/memory-config.md
    workflow: 15
---

# Konfigurationsreferenz für Memory

Diese Seite listet jede Konfigurationsoption für OpenClaw Memory Search auf. Für
konzeptionelle Übersichten siehe:

- [Memory Overview](/de/concepts/memory) -- wie Memory funktioniert
- [Builtin Engine](/de/concepts/memory-builtin) -- Standard-Backend auf SQLite-Basis
- [QMD Engine](/de/concepts/memory-qmd) -- lokaler Sidecar mit Local-first-Ansatz
- [Memory Search](/de/concepts/memory-search) -- Suchpipeline und Abstimmung

Alle Einstellungen für Memory Search befinden sich unter `agents.defaults.memorySearch` in
`openclaw.json`, sofern nicht anders angegeben.

---

## Providerauswahl

| Key        | Typ       | Standard         | Beschreibung                                                                                |
| ---------- | --------- | ---------------- | ------------------------------------------------------------------------------------------- |
| `provider` | `string`  | automatisch erkannt | Embedding-Adapter-ID: `openai`, `gemini`, `voyage`, `mistral`, `bedrock`, `ollama`, `local` |
| `model`    | `string`  | Standard des Providers | Name des Embedding-Modells                                                             |
| `fallback` | `string`  | `"none"`         | Fallback-Adapter-ID, wenn der primäre Adapter fehlschlägt                                  |
| `enabled`  | `boolean` | `true`           | Memory Search aktivieren oder deaktivieren                                                  |

### Reihenfolge der automatischen Erkennung

Wenn `provider` nicht gesetzt ist, wählt OpenClaw den ersten verfügbaren:

1. `local` -- wenn `memorySearch.local.modelPath` konfiguriert ist und die Datei existiert.
2. `openai` -- wenn ein OpenAI-Schlüssel aufgelöst werden kann.
3. `gemini` -- wenn ein Gemini-Schlüssel aufgelöst werden kann.
4. `voyage` -- wenn ein Voyage-Schlüssel aufgelöst werden kann.
5. `mistral` -- wenn ein Mistral-Schlüssel aufgelöst werden kann.
6. `bedrock` -- wenn die Zugangsdatenkette des AWS SDK aufgelöst wird (Instanzrolle, Zugriffsschlüssel, Profil, SSO, Web Identity oder gemeinsame Konfiguration).

`ollama` wird unterstützt, aber nicht automatisch erkannt (setzen Sie es explizit).

### Auflösung von API-Schlüsseln

Entfernte Embeddings erfordern einen API-Schlüssel. Bedrock verwendet stattdessen die Standard-
Zugangsdatenkette des AWS SDK (Instanzrollen, SSO, Zugriffsschlüssel).

| Provider | Env var                        | Config-Key                        |
| -------- | ------------------------------ | --------------------------------- |
| OpenAI   | `OPENAI_API_KEY`               | `models.providers.openai.apiKey`  |
| Gemini   | `GEMINI_API_KEY`               | `models.providers.google.apiKey`  |
| Voyage   | `VOYAGE_API_KEY`               | `models.providers.voyage.apiKey`  |
| Mistral  | `MISTRAL_API_KEY`              | `models.providers.mistral.apiKey` |
| Bedrock  | AWS-Zugangsdatenkette          | Kein API-Schlüssel erforderlich   |
| Ollama   | `OLLAMA_API_KEY` (Platzhalter) | --                                |

Codex OAuth deckt nur Chat/Completions ab und erfüllt keine Embedding-
Anfragen.

---

## Konfiguration entfernter Endpunkte

Für benutzerdefinierte OpenAI-kompatible Endpunkte oder zum Überschreiben der Provider-Standards:

| Key              | Typ      | Beschreibung                                           |
| ---------------- | -------- | ------------------------------------------------------ |
| `remote.baseUrl` | `string` | Benutzerdefinierte API-Basis-URL                       |
| `remote.apiKey`  | `string` | API-Schlüssel überschreiben                            |
| `remote.headers` | `object` | Zusätzliche HTTP-Header (mit den Provider-Standards zusammengeführt) |

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "openai",
        model: "text-embedding-3-small",
        remote: {
          baseUrl: "https://api.example.com/v1/",
          apiKey: "YOUR_KEY",
        },
      },
    },
  },
}
```

---

## Gemini-spezifische Konfiguration

| Key                    | Typ      | Standard               | Beschreibung                             |
| ---------------------- | -------- | ---------------------- | ---------------------------------------- |
| `model`                | `string` | `gemini-embedding-001` | Unterstützt auch `gemini-embedding-2-preview` |
| `outputDimensionality` | `number` | `3072`                 | Für Embedding 2: 768, 1536 oder 3072     |

<Warning>
Das Ändern von `model` oder `outputDimensionality` löst automatisch eine vollständige Neuindexierung aus.
</Warning>

---

## Bedrock-Embedding-Konfiguration

Bedrock verwendet die Standard-Zugangsdatenkette des AWS SDK -- keine API-Schlüssel erforderlich.
Wenn OpenClaw auf EC2 mit einer Bedrock-fähigen Instanzrolle läuft, setzen Sie einfach
Provider und Modell:

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "bedrock",
        model: "amazon.titan-embed-text-v2:0",
      },
    },
  },
}
```

| Key                    | Typ      | Standard                       | Beschreibung                     |
| ---------------------- | -------- | ------------------------------ | -------------------------------- |
| `model`                | `string` | `amazon.titan-embed-text-v2:0` | Beliebige Bedrock-Embedding-Modell-ID |
| `outputDimensionality` | `number` | Modellstandard                 | Für Titan V2: 256, 512 oder 1024 |

### Unterstützte Modelle

Die folgenden Modelle werden unterstützt (mit Familienerkennung und Standardwerten
für Dimensionen):

| Modell-ID                                  | Provider   | Standard-Dims | Konfigurierbare Dims |
| ------------------------------------------ | ---------- | ------------- | -------------------- |
| `amazon.titan-embed-text-v2:0`             | Amazon     | 1024          | 256, 512, 1024       |
| `amazon.titan-embed-text-v1`               | Amazon     | 1536          | --                   |
| `amazon.titan-embed-g1-text-02`            | Amazon     | 1536          | --                   |
| `amazon.titan-embed-image-v1`              | Amazon     | 1024          | --                   |
| `amazon.nova-2-multimodal-embeddings-v1:0` | Amazon     | 1024          | 256, 384, 1024, 3072 |
| `cohere.embed-english-v3`                  | Cohere     | 1024          | --                   |
| `cohere.embed-multilingual-v3`             | Cohere     | 1024          | --                   |
| `cohere.embed-v4:0`                        | Cohere     | 1536          | 256-1536             |
| `twelvelabs.marengo-embed-3-0-v1:0`        | TwelveLabs | 512           | --                   |
| `twelvelabs.marengo-embed-2-7-v1:0`        | TwelveLabs | 1024          | --                   |

Varianten mit Durchsatzsuffix (z. B. `amazon.titan-embed-text-v1:2:8k`) erben
die Konfiguration des Basismodells.

### Authentifizierung

Die Bedrock-Authentifizierung verwendet die Standardreihenfolge der Zugangsdatenauflösung des AWS SDK:

1. Umgebungsvariablen (`AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`)
2. SSO-Token-Cache
3. Zugangsdaten über Web-Identity-Token
4. Gemeinsame Dateien für Zugangsdaten und Konfiguration
5. Zugangsdaten aus ECS- oder EC2-Metadaten

Die Region wird aus `AWS_REGION`, `AWS_DEFAULT_REGION`, der
`baseUrl` des `amazon-bedrock`-Providers aufgelöst oder verwendet standardmäßig `us-east-1`.

### IAM-Berechtigungen

Die IAM-Rolle oder der IAM-Benutzer benötigt:

```json
{
  "Effect": "Allow",
  "Action": "bedrock:InvokeModel",
  "Resource": "*"
}
```

Für minimale Rechte beschränken Sie `InvokeModel` auf das konkrete Modell:

```
arn:aws:bedrock:*::foundation-model/amazon.titan-embed-text-v2:0
```

---

## Lokale Embedding-Konfiguration

| Key                   | Typ      | Standard               | Beschreibung                    |
| --------------------- | -------- | ---------------------- | ------------------------------- |
| `local.modelPath`     | `string` | automatisch heruntergeladen | Pfad zur GGUF-Modelldatei   |
| `local.modelCacheDir` | `string` | node-llama-cpp-Standard | Cache-Verzeichnis für heruntergeladene Modelle |

Standardmodell: `embeddinggemma-300m-qat-Q8_0.gguf` (~0,6 GB, wird automatisch heruntergeladen).
Erfordert nativen Build: `pnpm approve-builds` und dann `pnpm rebuild node-llama-cpp`.

---

## Hybrid-Search-Konfiguration

Alles unter `memorySearch.query.hybrid`:

| Key                   | Typ       | Standard | Beschreibung                        |
| --------------------- | --------- | -------- | ----------------------------------- |
| `enabled`             | `boolean` | `true`   | Hybrid BM25 + Vector Search aktivieren |
| `vectorWeight`        | `number`  | `0.7`    | Gewichtung für Vektor-Scores (0-1)  |
| `textWeight`          | `number`  | `0.3`    | Gewichtung für BM25-Scores (0-1)    |
| `candidateMultiplier` | `number`  | `4`      | Multiplikator für Größe des Kandidatenpools |

### MMR (Diversität)

| Key           | Typ       | Standard | Beschreibung                            |
| ------------- | --------- | -------- | --------------------------------------- |
| `mmr.enabled` | `boolean` | `false`  | MMR-Re-Ranking aktivieren               |
| `mmr.lambda`  | `number`  | `0.7`    | 0 = maximale Diversität, 1 = maximale Relevanz |

### Zeitlicher Zerfall (Aktualität)

| Key                          | Typ       | Standard | Beschreibung                    |
| ---------------------------- | --------- | -------- | ------------------------------- |
| `temporalDecay.enabled`      | `boolean` | `false`  | Aktualitäts-Boost aktivieren    |
| `temporalDecay.halfLifeDays` | `number`  | `30`     | Score halbiert sich alle N Tage |

Evergreen-Dateien (`MEMORY.md`, nicht datierte Dateien in `memory/`) unterliegen nie zeitlichem Zerfall.

### Vollständiges Beispiel

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        query: {
          hybrid: {
            vectorWeight: 0.7,
            textWeight: 0.3,
            mmr: { enabled: true, lambda: 0.7 },
            temporalDecay: { enabled: true, halfLifeDays: 30 },
          },
        },
      },
    },
  },
}
```

---

## Zusätzliche Memory-Pfade

| Key          | Typ        | Beschreibung                                  |
| ------------ | ---------- | --------------------------------------------- |
| `extraPaths` | `string[]` | Zusätzliche Verzeichnisse oder Dateien zum Indexieren |

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        extraPaths: ["../team-docs", "/srv/shared-notes"],
      },
    },
  },
}
```

Pfade können absolut oder relativ zum Workspace sein. Verzeichnisse werden
rekursiv nach `.md`-Dateien durchsucht. Die Behandlung von Symlinks hängt vom aktiven Backend ab:
Die Builtin Engine ignoriert Symlinks, während QMD dem zugrunde liegenden Verhalten
des QMD-Scanners folgt.

Für agentenspezifische, agentübergreifende Transkript-Suche verwenden Sie
`agents.list[].memorySearch.qmd.extraCollections` statt `memory.qmd.paths`.
Diese zusätzlichen Collections folgen derselben Struktur `{ path, name, pattern? }`, werden aber
pro Agent zusammengeführt und können explizite gemeinsame Namen beibehalten, wenn der Pfad
außerhalb des aktuellen Workspace liegt.
Wenn derselbe aufgelöste Pfad sowohl in `memory.qmd.paths` als auch in
`memorySearch.qmd.extraCollections` erscheint, behält QMD den ersten Eintrag und überspringt
das Duplikat.

---

## Multimodales Memory (Gemini)

Indexieren Sie Bilder und Audio zusammen mit Markdown über Gemini Embedding 2:

| Key                       | Typ        | Standard   | Beschreibung                              |
| ------------------------- | ---------- | ---------- | ----------------------------------------- |
| `multimodal.enabled`      | `boolean`  | `false`    | Multimodale Indexierung aktivieren        |
| `multimodal.modalities`   | `string[]` | --         | `["image"]`, `["audio"]` oder `["all"]`   |
| `multimodal.maxFileBytes` | `number`   | `10000000` | Maximale Dateigröße für die Indexierung   |

Gilt nur für Dateien in `extraPaths`. Standard-Memory-Wurzeln bleiben nur für Markdown.
Erfordert `gemini-embedding-2-preview`. `fallback` muss `"none"` sein.

Unterstützte Formate: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.heic`, `.heif`
(Bilder); `.mp3`, `.wav`, `.ogg`, `.opus`, `.m4a`, `.aac`, `.flac` (Audio).

---

## Embedding-Cache

| Key                | Typ       | Standard | Beschreibung                          |
| ------------------ | --------- | -------- | ------------------------------------- |
| `cache.enabled`    | `boolean` | `false`  | Chunk-Embeddings in SQLite cachen     |
| `cache.maxEntries` | `number`  | `50000`  | Maximale Anzahl zwischengespeicherter Embeddings |

Verhindert erneutes Embedding unveränderten Texts bei Neuindexierung oder Transkript-Updates.

---

## Batch-Indexierung

| Key                           | Typ       | Standard | Beschreibung                 |
| ----------------------------- | --------- | -------- | ---------------------------- |
| `remote.batch.enabled`        | `boolean` | `false`  | Batch-Embedding-API aktivieren |
| `remote.batch.concurrency`    | `number`  | `2`      | Parallele Batch-Jobs         |
| `remote.batch.wait`           | `boolean` | `true`   | Auf Abschluss des Batch warten |
| `remote.batch.pollIntervalMs` | `number`  | --       | Polling-Intervall            |
| `remote.batch.timeoutMinutes` | `number`  | --       | Batch-Timeout                |

Verfügbar für `openai`, `gemini` und `voyage`. OpenAI-Batches sind typischerweise
am schnellsten und günstigsten für große Backfills.

---

## Session Memory Search (experimentell)

Indexieren Sie Sitzungs-Transkripte und machen Sie sie über `memory_search` verfügbar:

| Key                           | Typ        | Standard     | Beschreibung                              |
| ----------------------------- | ---------- | ------------ | ----------------------------------------- |
| `experimental.sessionMemory`  | `boolean`  | `false`      | Sitzungsindexierung aktivieren            |
| `sources`                     | `string[]` | `["memory"]` | `"sessions"` hinzufügen, um Transkripte einzubeziehen |
| `sync.sessions.deltaBytes`    | `number`   | `100000`     | Byte-Schwellenwert für Neuindexierung     |
| `sync.sessions.deltaMessages` | `number`   | `50`         | Nachrichtenschwellenwert für Neuindexierung |

Die Sitzungsindexierung ist ein Opt-in und läuft asynchron. Ergebnisse können leicht
veraltet sein. Sitzungslogs liegen auf der Festplatte, behandeln Sie daher Dateisystemzugriff als Vertrauensgrenze.

---

## SQLite-Vektor-Beschleunigung (sqlite-vec)

| Key                          | Typ       | Standard | Beschreibung                        |
| ---------------------------- | --------- | -------- | ----------------------------------- |
| `store.vector.enabled`       | `boolean` | `true`   | sqlite-vec für Vektorabfragen verwenden |
| `store.vector.extensionPath` | `string`  | gebündelt | sqlite-vec-Pfad überschreiben      |

Wenn sqlite-vec nicht verfügbar ist, fällt OpenClaw automatisch auf
Cosine Similarity im Prozess zurück.

---

## Indexspeicherung

| Key                   | Typ      | Standard                              | Beschreibung                                 |
| --------------------- | -------- | ------------------------------------ | -------------------------------------------- |
| `store.path`          | `string` | `~/.openclaw/memory/{agentId}.sqlite` | Speicherort des Indexes (unterstützt Token `{agentId}`) |
| `store.fts.tokenizer` | `string` | `unicode61`                          | FTS5-Tokenizer (`unicode61` oder `trigram`)  |

---

## Konfiguration des QMD-Backends

Setzen Sie `memory.backend = "qmd"`, um es zu aktivieren. Alle QMD-Einstellungen befinden sich unter
`memory.qmd`:

| Key                      | Typ       | Standard | Beschreibung                                  |
| ------------------------ | --------- | -------- | --------------------------------------------- |
| `command`                | `string`  | `qmd`    | Pfad zur ausführbaren QMD-Datei               |
| `searchMode`             | `string`  | `search` | Suchbefehl: `search`, `vsearch`, `query`      |
| `includeDefaultMemory`   | `boolean` | `true`   | `MEMORY.md` + `memory/**/*.md` automatisch indexieren |
| `paths[]`                | `array`   | --       | Zusätzliche Pfade: `{ name, path, pattern? }` |
| `sessions.enabled`       | `boolean` | `false`  | Sitzungs-Transkripte indexieren               |
| `sessions.retentionDays` | `number`  | --       | Aufbewahrung von Transkripten                 |
| `sessions.exportDir`     | `string`  | --       | Exportverzeichnis                             |

OpenClaw bevorzugt die aktuellen QMD-Collection- und MCP-Abfrageformen, hält
aber ältere QMD-Releases funktionsfähig, indem bei Bedarf auf veraltete `--mask`-Collection-Flags
und ältere MCP-Tool-Namen zurückgefallen wird.

QMD-Modellüberschreibungen bleiben auf der QMD-Seite, nicht in der OpenClaw-Konfiguration. Wenn Sie
QMD-Modelle global überschreiben müssen, setzen Sie Umgebungsvariablen wie
`QMD_EMBED_MODEL`, `QMD_RERANK_MODEL` und `QMD_GENERATE_MODEL` in der Gateway-
Runtime-Umgebung.

### Aktualisierungszeitplan

| Key                       | Typ       | Standard | Beschreibung                              |
| ------------------------- | --------- | -------- | ----------------------------------------- |
| `update.interval`         | `string`  | `5m`     | Aktualisierungsintervall                  |
| `update.debounceMs`       | `number`  | `15000`  | Dateiänderungen entprellen                |
| `update.onBoot`           | `boolean` | `true`   | Beim Start aktualisieren                  |
| `update.waitForBootSync`  | `boolean` | `false`  | Start blockieren, bis Aktualisierung abgeschlossen ist |
| `update.embedInterval`    | `string`  | --       | Separate Embedding-Kadenz                 |
| `update.commandTimeoutMs` | `number`  | --       | Timeout für QMD-Befehle                   |
| `update.updateTimeoutMs`  | `number`  | --       | Timeout für QMD-Aktualisierungsvorgänge   |
| `update.embedTimeoutMs`   | `number`  | --       | Timeout für QMD-Embedding-Vorgänge        |

### Limits

| Key                       | Typ      | Standard | Beschreibung                     |
| ------------------------- | -------- | -------- | -------------------------------- |
| `limits.maxResults`       | `number` | `6`      | Maximale Suchergebnisse          |
| `limits.maxSnippetChars`  | `number` | --       | Snippet-Länge begrenzen          |
| `limits.maxInjectedChars` | `number` | --       | Gesamtzahl injizierter Zeichen begrenzen |
| `limits.timeoutMs`        | `number` | `4000`   | Such-Timeout                     |

### Geltungsbereich

Steuert, welche Sitzungen QMD-Suchergebnisse erhalten können. Dasselbe Schema wie
[`session.sendPolicy`](/de/gateway/configuration-reference#session):

```json5
{
  memory: {
    qmd: {
      scope: {
        default: "deny",
        rules: [{ action: "allow", match: { chatType: "direct" } }],
      },
    },
  },
}
```

Standard ist nur DM. `match.keyPrefix` gleicht den normalisierten Sitzungsschlüssel ab;
`match.rawKeyPrefix` gleicht den rohen Schlüssel einschließlich `agent:<id>:` ab.

### Quellenangaben

`memory.citations` gilt für alle Backends:

| Wert             | Verhalten                                           |
| ---------------- | --------------------------------------------------- |
| `auto` (Standard) | `Source: <path#line>`-Footer in Snippets einfügen  |
| `on`             | Footer immer einfügen                               |
| `off`            | Footer weglassen (Pfad wird intern weiterhin an den Agenten übergeben) |

### Vollständiges QMD-Beispiel

```json5
{
  memory: {
    backend: "qmd",
    citations: "auto",
    qmd: {
      includeDefaultMemory: true,
      update: { interval: "5m", debounceMs: 15000 },
      limits: { maxResults: 6, timeoutMs: 4000 },
      scope: {
        default: "deny",
        rules: [{ action: "allow", match: { chatType: "direct" } }],
      },
      paths: [{ name: "docs", path: "~/notes", pattern: "**/*.md" }],
    },
  },
}
```

---

## Dreaming (experimentell)

Dreaming wird unter `plugins.entries.memory-core.config.dreaming` konfiguriert,
nicht unter `agents.defaults.memorySearch`.

Dreaming läuft als ein geplanter Durchlauf und verwendet interne Light-/Deep-/REM-Phasen als
Implementierungsdetail.

Für konzeptionelles Verhalten und Slash-Befehle siehe [Dreaming](/concepts/dreaming).

### Benutzereinstellungen

| Key         | Typ       | Standard    | Beschreibung                                  |
| ----------- | --------- | ----------- | --------------------------------------------- |
| `enabled`   | `boolean` | `false`     | Dreaming vollständig aktivieren oder deaktivieren |
| `frequency` | `string`  | `0 3 * * *` | Optionale Cron-Kadenz für den vollständigen Dreaming-Durchlauf |

### Beispiel

```json5
{
  plugins: {
    entries: {
      "memory-core": {
        config: {
          dreaming: {
            enabled: true,
            frequency: "0 3 * * *",
          },
        },
      },
    },
  },
}
```

Hinweise:

- Dreaming schreibt Maschinenzustand nach `memory/.dreams/`.
- Dreaming schreibt menschenlesbare narrative Ausgabe nach `DREAMS.md` (oder vorhandenes `dreams.md`).
- Die Richtlinie und Schwellenwerte für Light-/Deep-/REM-Phasen sind internes Verhalten, keine benutzerseitige Konfiguration.
