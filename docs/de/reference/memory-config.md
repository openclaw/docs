---
read_when:
    - Sie möchten Provider für die Speichersuche oder Embedding-Modelle konfigurieren
    - Sie möchten das QMD-Backend einrichten
    - Sie möchten die hybride Suche, MMR oder die zeitliche Abwertung feinabstimmen
    - Sie möchten die multimodale Speicherindexierung aktivieren
sidebarTitle: Memory config
summary: Alle Konfigurationsoptionen für Speichersuche, Embedding-Provider, QMD, hybride Suche und multimodale Indexierung
title: Referenz zur Speicherkonfiguration
x-i18n:
    generated_at: "2026-05-02T22:22:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 99624a13b4e700da47a523206569d84c6750266fbb648ec73c463be9c5c285d0
    source_path: reference/memory-config.md
    workflow: 16
---

Diese Seite listet jeden Konfigurationsparameter für die OpenClaw-Speichersuche auf. Konzeptuelle Übersichten finden Sie hier:

<CardGroup cols={2}>
  <Card title="Speicherübersicht" href="/de/concepts/memory">
    Funktionsweise des Speichers.
  </Card>
  <Card title="Integrierte Engine" href="/de/concepts/memory-builtin">
    Standardmäßiges SQLite-Backend.
  </Card>
  <Card title="QMD-Engine" href="/de/concepts/memory-qmd">
    Local-first-Sidecar.
  </Card>
  <Card title="Speichersuche" href="/de/concepts/memory-search">
    Such-Pipeline und Tuning.
  </Card>
  <Card title="Active Memory" href="/de/concepts/active-memory">
    Speicher-Sub-Agent für interaktive Sitzungen.
  </Card>
</CardGroup>

Alle Einstellungen der Speichersuche befinden sich unter `agents.defaults.memorySearch` in `openclaw.json`, sofern nicht anders angegeben.

<Note>
Wenn Sie nach dem Feature-Schalter für **Active Memory** und der Sub-Agent-Konfiguration suchen: Diese befindet sich unter `plugins.entries.active-memory` statt unter `memorySearch`.

Active Memory verwendet ein Zwei-Gate-Modell:

1. Das Plugin muss aktiviert sein und auf die aktuelle Agent-ID abzielen
2. Die Anfrage muss eine zulässige interaktive persistente Chat-Sitzung sein

Siehe [Active Memory](/de/concepts/active-memory) für das Aktivierungsmodell, die Plugin-eigene Konfiguration, Transcript-Persistenz und ein sicheres Rollout-Muster.
</Note>

---

## Provider-Auswahl

| Schlüssel  | Typ       | Standard         | Beschreibung                                                                                                                                                                                                                         |
| ---------- | --------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider` | `string`  | automatisch erkannt | Embedding-Adapter-ID wie `bedrock`, `deepinfra`, `gemini`, `github-copilot`, `local`, `mistral`, `ollama`, `openai` oder `voyage`; kann auch ein konfigurierter `models.providers.<id>` sein, dessen `api` auf einen dieser Adapter verweist |
| `model`    | `string`  | Provider-Standard | Name des Embedding-Modells                                                                                                                                                                                                            |
| `fallback` | `string`  | `"none"`         | Fallback-Adapter-ID, wenn der primäre Adapter fehlschlägt                                                                                                                                                                             |
| `enabled`  | `boolean` | `true`           | Speichersuche aktivieren oder deaktivieren                                                                                                                                                                                           |

### Reihenfolge der automatischen Erkennung

Wenn `provider` nicht gesetzt ist, wählt OpenClaw den ersten verfügbaren aus:

<Steps>
  <Step title="local">
    Ausgewählt, wenn `memorySearch.local.modelPath` konfiguriert ist und die Datei existiert.
  </Step>
  <Step title="github-copilot">
    Ausgewählt, wenn ein GitHub Copilot-Token aufgelöst werden kann (Umgebungsvariable oder Auth-Profil).
  </Step>
  <Step title="openai">
    Ausgewählt, wenn ein OpenAI-Schlüssel aufgelöst werden kann.
  </Step>
  <Step title="gemini">
    Ausgewählt, wenn ein Gemini-Schlüssel aufgelöst werden kann.
  </Step>
  <Step title="voyage">
    Ausgewählt, wenn ein Voyage-Schlüssel aufgelöst werden kann.
  </Step>
  <Step title="mistral">
    Ausgewählt, wenn ein Mistral-Schlüssel aufgelöst werden kann.
  </Step>
  <Step title="deepinfra">
    Ausgewählt, wenn ein DeepInfra-Schlüssel aufgelöst werden kann.
  </Step>
  <Step title="bedrock">
    Ausgewählt, wenn die AWS SDK-Anmeldeinformationskette aufgelöst wird (Instanzrolle, Zugriffsschlüssel, Profil, SSO, Web-Identität oder gemeinsame Konfiguration).
  </Step>
</Steps>

`ollama` wird unterstützt, aber nicht automatisch erkannt (setzen Sie es explizit).

### Benutzerdefinierte Provider-IDs

`memorySearch.provider` kann auf einen benutzerdefinierten Eintrag `models.providers.<id>` verweisen. OpenClaw löst den `api`-Eigentümer dieses Providers für den Embedding-Adapter auf und behält gleichzeitig die benutzerdefinierte Provider-ID für Endpoint-, Auth- und Modellpräfix-Verarbeitung bei. Dadurch können Setups mit mehreren GPUs oder Hosts Speicher-Embeddings einem bestimmten lokalen Endpoint zuweisen:

```json5
{
  models: {
    providers: {
      "ollama-5080": {
        api: "ollama",
        baseUrl: "http://gpu-box.local:11435",
        apiKey: "ollama-local",
        models: [{ id: "qwen3-embedding:0.6b" }],
      },
    },
  },
  agents: {
    defaults: {
      memorySearch: {
        provider: "ollama-5080",
        model: "qwen3-embedding:0.6b",
      },
    },
  },
}
```

### API-Schlüsselauflösung

Remote-Embeddings erfordern einen API-Schlüssel. Bedrock verwendet stattdessen die standardmäßige AWS SDK-Anmeldeinformationskette (Instanzrollen, SSO, Zugriffsschlüssel).

| Provider       | Umgebungsvariable                                | Konfigurationsschlüssel              |
| -------------- | -------------------------------------------------- | ----------------------------------- |
| Bedrock        | AWS-Anmeldeinformationskette                       | Kein API-Schlüssel erforderlich     |
| DeepInfra      | `DEEPINFRA_API_KEY`                                | `models.providers.deepinfra.apiKey` |
| Gemini         | `GEMINI_API_KEY`                                   | `models.providers.google.apiKey`    |
| GitHub Copilot | `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, `GITHUB_TOKEN` | Auth-Profil über Geräteanmeldung    |
| Mistral        | `MISTRAL_API_KEY`                                  | `models.providers.mistral.apiKey`   |
| Ollama         | `OLLAMA_API_KEY` (Platzhalter)                     | --                                  |
| OpenAI         | `OPENAI_API_KEY`                                   | `models.providers.openai.apiKey`    |
| Voyage         | `VOYAGE_API_KEY`                                   | `models.providers.voyage.apiKey`    |

<Note>
Codex OAuth deckt nur Chat/Vervollständigungen ab und erfüllt keine Embedding-Anfragen.
</Note>

---

## Konfiguration für Remote-Endpoints

Für benutzerdefinierte OpenAI-kompatible Endpoints oder zum Überschreiben von Provider-Standards:

<ParamField path="remote.baseUrl" type="string">
  Benutzerdefinierte API-Basis-URL.
</ParamField>
<ParamField path="remote.apiKey" type="string">
  API-Schlüssel überschreiben.
</ParamField>
<ParamField path="remote.headers" type="object">
  Zusätzliche HTTP-Header (mit Provider-Standards zusammengeführt).
</ParamField>

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

## Provider-spezifische Konfiguration

<AccordionGroup>
  <Accordion title="Gemini">
    | Schlüssel              | Typ      | Standard               | Beschreibung                               |
    | ---------------------- | -------- | ---------------------- | ------------------------------------------ |
    | `model`                | `string` | `gemini-embedding-001` | Unterstützt auch `gemini-embedding-2-preview` |
    | `outputDimensionality` | `number` | `3072`                 | Für Embedding 2: 768, 1536 oder 3072       |

    <Warning>
    Das Ändern des Modells oder von `outputDimensionality` löst eine automatische vollständige Neuindizierung aus.
    </Warning>

  </Accordion>
  <Accordion title="OpenAI-kompatible Eingabetypen">
    OpenAI-kompatible Embedding-Endpoints können Provider-spezifische `input_type`-Anfragefelder verwenden. Dies ist nützlich für asymmetrische Embedding-Modelle, die unterschiedliche Labels für Abfrage- und Dokument-Embeddings erfordern.

    | Schlüssel           | Typ      | Standard | Beschreibung                                                  |
    | ------------------- | -------- | ------- | ------------------------------------------------------------- |
    | `inputType`         | `string` | nicht gesetzt | Gemeinsamer `input_type` für Abfrage- und Dokument-Embeddings |
    | `queryInputType`    | `string` | nicht gesetzt | `input_type` zur Abfragezeit; überschreibt `inputType`        |
    | `documentInputType` | `string` | nicht gesetzt | Index-/Dokument-`input_type`; überschreibt `inputType`        |

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            provider: "openai",
            remote: {
              baseUrl: "https://embeddings.example/v1",
              apiKey: "env:EMBEDDINGS_API_KEY",
            },
            model: "asymmetric-embedder",
            queryInputType: "query",
            documentInputType: "passage",
          },
        },
      },
    }
    ```

    Das Ändern dieser Werte wirkt sich auf die Identität des Embedding-Caches für Provider-Batch-Indizierung aus und sollte von einer Speicher-Neuindizierung begleitet werden, wenn das Upstream-Modell die Labels unterschiedlich behandelt.

  </Accordion>
  <Accordion title="Bedrock">
    ### Bedrock-Embedding-Konfiguration

    Bedrock verwendet die standardmäßige AWS SDK-Anmeldeinformationskette — keine API-Schlüssel erforderlich. Wenn OpenClaw auf EC2 mit einer Bedrock-fähigen Instanzrolle läuft, setzen Sie einfach Provider und Modell:

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

    | Schlüssel              | Typ      | Standard                       | Beschreibung                    |
    | ---------------------- | -------- | ------------------------------ | ------------------------------- |
    | `model`                | `string` | `amazon.titan-embed-text-v2:0` | Beliebige Bedrock-Embedding-Modell-ID |
    | `outputDimensionality` | `number` | Modellstandard                 | Für Titan V2: 256, 512 oder 1024 |

    **Unterstützte Modelle** (mit Familienerkennung und Dimensionsstandards):

    | Modell-ID                                  | Provider   | Standarddimensionen | Konfigurierbare Dimensionen |
    | ------------------------------------------ | ---------- | ------------ | -------------------- |
    | `amazon.titan-embed-text-v2:0`             | Amazon     | 1024         | 256, 512, 1024       |
    | `amazon.titan-embed-text-v1`               | Amazon     | 1536         | --                   |
    | `amazon.titan-embed-g1-text-02`            | Amazon     | 1536         | --                   |
    | `amazon.titan-embed-image-v1`              | Amazon     | 1024         | --                   |
    | `amazon.nova-2-multimodal-embeddings-v1:0` | Amazon     | 1024         | 256, 384, 1024, 3072 |
    | `cohere.embed-english-v3`                  | Cohere     | 1024         | --                   |
    | `cohere.embed-multilingual-v3`             | Cohere     | 1024         | --                   |
    | `cohere.embed-v4:0`                        | Cohere     | 1536         | 256-1536             |
    | `twelvelabs.marengo-embed-3-0-v1:0`        | TwelveLabs | 512          | --                   |
    | `twelvelabs.marengo-embed-2-7-v1:0`        | TwelveLabs | 1024         | --                   |

    Varianten mit Durchsatzsuffix (z. B. `amazon.titan-embed-text-v1:2:8k`) erben die Konfiguration des Basismodells.

    **Authentifizierung:** Bedrock-Authentifizierung verwendet die standardmäßige AWS SDK-Reihenfolge zur Auflösung von Anmeldeinformationen:

    1. Umgebungsvariablen (`AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`)
    2. SSO-Token-Cache
    3. Web-Identity-Token-Anmeldeinformationen
    4. Gemeinsame Anmeldeinformationen und Konfigurationsdateien
    5. ECS- oder EC2-Metadaten-Anmeldeinformationen

    Die Region wird aus `AWS_REGION`, `AWS_DEFAULT_REGION`, der `baseUrl` des `amazon-bedrock`-Providers aufgelöst oder fällt auf `us-east-1` zurück.

    **IAM-Berechtigungen:** Die IAM-Rolle oder der IAM-Benutzer benötigt:

    ```json
    {
      "Effect": "Allow",
      "Action": "bedrock:InvokeModel",
      "Resource": "*"
    }
    ```

    Für minimale Berechtigungen beschränken Sie `InvokeModel` auf das jeweilige Modell:

    ```
    arn:aws:bedrock:*::foundation-model/amazon.titan-embed-text-v2:0
    ```

  </Accordion>
  <Accordion title="Lokal (GGUF + node-llama-cpp)">
    | Schlüssel             | Typ                | Standard               | Beschreibung                                                                                                                                                                                                                                                                                                             |
    | --------------------- | ------------------ | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
    | `local.modelPath`     | `string`           | automatisch heruntergeladen | Pfad zur GGUF-Modelldatei                                                                                                                                                                                                                                                                                                 |
    | `local.modelCacheDir` | `string`           | Standard von node-llama-cpp | Cache-Verzeichnis für heruntergeladene Modelle                                                                                                                                                                                                                                                                            |
    | `local.contextSize`   | `number \| "auto"` | `4096`                 | Größe des Kontextfensters für den Embedding-Kontext. 4096 deckt typische Chunks (128–512 Token) ab und begrenzt zugleich Nicht-Gewicht-VRAM. Auf eingeschränkten Hosts auf 1024–2048 senken. `"auto"` verwendet das trainierte Maximum des Modells — nicht empfohlen für 8B+-Modelle (Qwen3-Embedding-8B: 40 960 Token → ~32 GB VRAM gegenüber ~8,8 GB bei 4096). |

    Standardmodell: `embeddinggemma-300m-qat-Q8_0.gguf` (~0,6 GB, automatisch heruntergeladen). Source-Checkouts erfordern weiterhin die Genehmigung nativer Builds: `pnpm approve-builds` und danach `pnpm rebuild node-llama-cpp`.

    Verwenden Sie die eigenständige CLI, um denselben Provider-Pfad zu prüfen, den das Gateway verwendet:

    ```bash
    openclaw memory status --deep --agent main
    openclaw memory index --force --agent main
    ```

    Wenn `provider` `auto` ist, wird `local` nur ausgewählt, wenn `local.modelPath` auf eine vorhandene lokale Datei verweist. `hf:`- und HTTP(S)-Modellreferenzen können weiterhin explizit mit `provider: "local"` verwendet werden, sie bewirken jedoch nicht, dass `auto` lokal auswählt, bevor das Modell auf dem Datenträger verfügbar ist.

  </Accordion>
</AccordionGroup>

### Timeout für Inline-Embeddings

<ParamField path="sync.embeddingBatchTimeoutSeconds" type="number">
  Überschreibt den Timeout für Inline-Embedding-Batches während der Speicherindizierung.

Wenn nicht gesetzt, wird der Provider-Standard verwendet: 600 Sekunden für lokale/selbst gehostete Provider wie `local`, `ollama` und `lmstudio` sowie 120 Sekunden für gehostete Provider. Erhöhen Sie diesen Wert, wenn lokale CPU-gebundene Embedding-Batches korrekt funktionieren, aber langsam sind.
</ParamField>

---

## Konfiguration der Hybridsuche

Alles unter `memorySearch.query.hybrid`:

| Schlüssel             | Typ       | Standard | Beschreibung                                      |
| --------------------- | --------- | -------- | ------------------------------------------------- |
| `enabled`             | `boolean` | `true`   | Hybride BM25- + Vektorsuche aktivieren            |
| `vectorWeight`        | `number`  | `0.7`    | Gewichtung für Vektorscores (0-1)                 |
| `textWeight`          | `number`  | `0.3`    | Gewichtung für BM25-Scores (0-1)                  |
| `candidateMultiplier` | `number`  | `4`      | Multiplikator für die Größe des Kandidatenpools   |

<Tabs>
  <Tab title="MMR (Diversität)">
    | Schlüssel     | Typ       | Standard | Beschreibung                                |
    | ------------- | --------- | -------- | ------------------------------------------- |
    | `mmr.enabled` | `boolean` | `false`  | MMR-Neusortierung aktivieren                |
    | `mmr.lambda`  | `number`  | `0.7`    | 0 = maximale Diversität, 1 = maximale Relevanz |
  </Tab>
  <Tab title="Zeitlicher Verfall (Aktualität)">
    | Schlüssel                    | Typ       | Standard | Beschreibung                         |
    | ---------------------------- | --------- | -------- | ------------------------------------ |
    | `temporalDecay.enabled`      | `boolean` | `false`  | Aktualitäts-Boost aktivieren         |
    | `temporalDecay.halfLifeDays` | `number`  | `30`     | Score halbiert sich alle N Tage      |

    Evergreen-Dateien (`MEMORY.md`, nicht datierte Dateien in `memory/`) verfallen nie.

  </Tab>
</Tabs>

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

## Zusätzliche Speicherpfade

| Schlüssel    | Typ        | Beschreibung                                      |
| ------------ | ---------- | ------------------------------------------------- |
| `extraPaths` | `string[]` | Zusätzliche Verzeichnisse oder Dateien zum Indizieren |

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

Pfade können absolut oder relativ zum Workspace sein. Verzeichnisse werden rekursiv nach `.md`-Dateien durchsucht. Die Behandlung von Symlinks hängt vom aktiven Backend ab: Die integrierte Engine ignoriert Symlinks, während QMD dem Verhalten des zugrunde liegenden QMD-Scanners folgt.

Für agentenspezifische agentenübergreifende Transkriptsuche verwenden Sie `agents.list[].memorySearch.qmd.extraCollections` statt `memory.qmd.paths`. Diese zusätzlichen Collections folgen derselben Form `{ path, name, pattern? }`, werden jedoch pro Agent zusammengeführt und können explizite gemeinsame Namen beibehalten, wenn der Pfad außerhalb des aktuellen Workspace liegt. Wenn derselbe aufgelöste Pfad sowohl in `memory.qmd.paths` als auch in `memorySearch.qmd.extraCollections` erscheint, behält QMD den ersten Eintrag und überspringt das Duplikat.

---

## Multimodaler Speicher (Gemini)

Indizieren Sie Bilder und Audio zusammen mit Markdown mithilfe von Gemini Embedding 2:

| Schlüssel                | Typ        | Standard   | Beschreibung                          |
| ------------------------ | ---------- | ---------- | ------------------------------------- |
| `multimodal.enabled`     | `boolean`  | `false`    | Multimodale Indizierung aktivieren    |
| `multimodal.modalities`  | `string[]` | --         | `["image"]`, `["audio"]` oder `["all"]` |
| `multimodal.maxFileBytes` | `number`  | `10000000` | Maximale Dateigröße für die Indizierung |

<Note>
Gilt nur für Dateien in `extraPaths`. Die standardmäßigen Memory-Roots bleiben auf Markdown beschränkt. Erfordert `gemini-embedding-2-preview`. `fallback` muss `"none"` sein.
</Note>

Unterstützte Formate: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.heic`, `.heif` (Bilder); `.mp3`, `.wav`, `.ogg`, `.opus`, `.m4a`, `.aac`, `.flac` (Audio).

---

## Embedding-Cache

| Schlüssel          | Typ       | Standard | Beschreibung                                   |
| ------------------ | --------- | -------- | ---------------------------------------------- |
| `cache.enabled`    | `boolean` | `false`  | Chunk-Embeddings in SQLite zwischenspeichern   |
| `cache.maxEntries` | `number`  | `50000`  | Max. zwischengespeicherte Embeddings           |

Verhindert, dass unveränderter Text bei Neuindizierung oder Transkript-Aktualisierungen erneut eingebettet wird.

---

## Batch-Indizierung

| Schlüssel                     | Typ       | Standard | Beschreibung                    |
| ----------------------------- | --------- | -------- | ------------------------------- |
| `remote.nonBatchConcurrency`  | `number`  | `4`      | Parallele Inline-Embeddings     |
| `remote.batch.enabled`        | `boolean` | `false`  | Batch-Embedding-API aktivieren  |
| `remote.batch.concurrency`    | `number`  | `2`      | Parallele Batch-Jobs            |
| `remote.batch.wait`           | `boolean` | `true`   | Auf Batch-Abschluss warten      |
| `remote.batch.pollIntervalMs` | `number`  | --       | Polling-Intervall               |
| `remote.batch.timeoutMinutes` | `number`  | --       | Batch-Timeout                   |

Verfügbar für `openai`, `gemini` und `voyage`. OpenAI-Batch ist für große Backfills in der Regel am schnellsten und günstigsten.

`remote.nonBatchConcurrency` steuert Inline-Embedding-Aufrufe, die von lokalen/self-hosted Providern und gehosteten Providern verwendet werden, wenn Provider-Batch-APIs nicht aktiv sind. Ollama verwendet für Non-Batch-Indizierung standardmäßig `1`, um kleinere lokale Hosts nicht zu überlasten; setzen Sie auf größeren Maschinen einen höheren Wert.

Dies ist getrennt von `sync.embeddingBatchTimeoutSeconds`, das den Timeout für Inline-Embedding-Aufrufe steuert.

---

## Session-Memory-Suche (experimentell)

Sitzungstranskripte indizieren und über `memory_search` bereitstellen:

| Schlüssel                     | Typ        | Standard     | Beschreibung                                      |
| ----------------------------- | ---------- | ------------ | ------------------------------------------------- |
| `experimental.sessionMemory`  | `boolean`  | `false`      | Sitzungsindizierung aktivieren                    |
| `sources`                     | `string[]` | `["memory"]` | `"sessions"` hinzufügen, um Transkripte einzubeziehen |
| `sync.sessions.deltaBytes`    | `number`   | `100000`     | Byte-Schwellenwert für Neuindizierung             |
| `sync.sessions.deltaMessages` | `number`   | `50`         | Nachrichten-Schwellenwert für Neuindizierung      |

<Warning>
Sitzungsindizierung ist opt-in und läuft asynchron. Ergebnisse können leicht veraltet sein. Sitzungslogs liegen auf der Festplatte; behandeln Sie daher Dateisystemzugriff als Vertrauensgrenze.
</Warning>

---

## SQLite-Vektorbeschleunigung (sqlite-vec)

| Schlüssel                    | Typ       | Standard | Beschreibung                         |
| ---------------------------- | --------- | -------- | ------------------------------------ |
| `store.vector.enabled`       | `boolean` | `true`   | sqlite-vec für Vektorabfragen nutzen |
| `store.vector.extensionPath` | `string`  | bundled  | sqlite-vec-Pfad überschreiben        |

Wenn sqlite-vec nicht verfügbar ist, fällt OpenClaw automatisch auf prozessinterne Kosinusähnlichkeit zurück.

---

## Indexspeicher

| Schlüssel             | Typ      | Standard                              | Beschreibung                                      |
| --------------------- | -------- | ------------------------------------- | ------------------------------------------------- |
| `store.path`          | `string` | `~/.openclaw/memory/{agentId}.sqlite` | Indexspeicherort (unterstützt `{agentId}`-Token)  |
| `store.fts.tokenizer` | `string` | `unicode61`                           | FTS5-Tokenizer (`unicode61` oder `trigram`)       |

---

## QMD-Backend-Konfiguration

Setzen Sie `memory.backend = "qmd"`, um es zu aktivieren. Alle QMD-Einstellungen befinden sich unter `memory.qmd`:

| Schlüssel                | Typ       | Standard | Beschreibung                                                                                 |
| ------------------------ | --------- | -------- | -------------------------------------------------------------------------------------------- |
| `command`                | `string`  | `qmd`    | Pfad zur QMD-Ausführungsdatei; setzen Sie einen absoluten Pfad, wenn sich der Service-`PATH` von Ihrer Shell unterscheidet |
| `searchMode`             | `string`  | `search` | Suchbefehl: `search`, `vsearch`, `query`                                                     |
| `includeDefaultMemory`   | `boolean` | `true`   | `MEMORY.md` + `memory/**/*.md` automatisch indizieren                                        |
| `paths[]`                | `array`   | --       | Zusätzliche Pfade: `{ name, path, pattern? }`                                                |
| `sessions.enabled`       | `boolean` | `false`  | Sitzungstranskripte indizieren                                                              |
| `sessions.retentionDays` | `number`  | --       | Transkript-Aufbewahrung                                                                      |
| `sessions.exportDir`     | `string`  | --       | Exportverzeichnis                                                                            |

`searchMode: "search"` ist rein lexikalisch/BM25-basiert. OpenClaw führt für diesen Modus keine semantischen Vektorbereitschaftsprüfungen oder QMD-Embedding-Wartung aus, auch nicht während `memory status --deep`; `vsearch` und `query` erfordern weiterhin QMD-Vektorbereitschaft und Embeddings.

OpenClaw bevorzugt die aktuellen QMD-Collection- und MCP-Abfrageformen, hält ältere QMD-Versionen aber lauffähig, indem bei Bedarf kompatible Collection-Pattern-Flags und ältere MCP-Toolnamen ausprobiert werden. Wenn QMD Unterstützung für mehrere Collection-Filter angibt, werden Collections aus derselben Quelle mit einem QMD-Prozess durchsucht; ältere QMD-Builds behalten den Kompatibilitätspfad pro Collection bei. Dieselbe Quelle bedeutet, dass dauerhafte Memory-Collections zusammen gruppiert werden, während Session-Transcript-Collections eine separate Gruppe bleiben, sodass die Quellendiversifizierung weiterhin beide Eingaben hat.

<Note>
QMD-Modell-Overrides bleiben auf der QMD-Seite, nicht in der OpenClaw-Konfiguration. Wenn Sie die Modelle von QMD global überschreiben müssen, setzen Sie Umgebungsvariablen wie `QMD_EMBED_MODEL`, `QMD_RERANK_MODEL` und `QMD_GENERATE_MODEL` in der Gateway-Laufzeitumgebung.
</Note>

<AccordionGroup>
  <Accordion title="Aktualisierungszeitplan">
    | Schlüssel                 | Typ       | Standard | Beschreibung                          |
    | ------------------------- | --------- | -------- | ------------------------------------- |
    | `update.interval`         | `string`  | `5m`     | Aktualisierungsintervall              |
    | `update.debounceMs`       | `number`  | `15000`  | Dateiänderungen entprellen            |
    | `update.onBoot`           | `boolean` | `true`   | Beim Öffnen des langlebigen QMD-Managers aktualisieren; steuert auch die optionale Startaktualisierung |
    | `update.startup`          | `string`  | `off`    | Optionale Aktualisierung beim Gateway-Start: `off`, `idle` oder `immediate` |
    | `update.startupDelayMs`   | `number`  | `120000` | Verzögerung, bevor die Aktualisierung `startup: "idle"` ausgeführt wird |
    | `update.waitForBootSync`  | `boolean` | `false`  | Öffnen des Managers blockieren, bis die anfängliche Aktualisierung abgeschlossen ist |
    | `update.embedInterval`    | `string`  | --       | Separater Embedding-Takt              |
    | `update.commandTimeoutMs` | `number`  | --       | Timeout für QMD-Befehle               |
    | `update.updateTimeoutMs`  | `number`  | --       | Timeout für QMD-Aktualisierungsvorgänge |
    | `update.embedTimeoutMs`   | `number`  | --       | Timeout für QMD-Embedding-Vorgänge    |
  </Accordion>
  <Accordion title="Limits">
    | Schlüssel                 | Typ      | Standard | Beschreibung                          |
    | ------------------------- | -------- | -------- | ------------------------------------- |
    | `limits.maxResults`       | `number` | `6`      | Maximale Suchergebnisse               |
    | `limits.maxSnippetChars`  | `number` | --       | Snippet-Länge begrenzen               |
    | `limits.maxInjectedChars` | `number` | --       | Gesamte eingefügte Zeichen begrenzen  |
    | `limits.timeoutMs`        | `number` | `4000`   | Such-Timeout                          |
  </Accordion>
  <Accordion title="Geltungsbereich">
    Steuert, welche Sessions QMD-Suchergebnisse empfangen können. Dasselbe Schema wie [`session.sendPolicy`](/de/gateway/config-agents#session):

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

    Der ausgelieferte Standard erlaubt direkte Sessions und Channel-Sessions, verweigert Gruppen aber weiterhin.

    Standard ist nur DM. `match.keyPrefix` gleicht den normalisierten Session-Schlüssel ab; `match.rawKeyPrefix` gleicht den Rohschlüssel einschließlich `agent:<id>:` ab.

  </Accordion>
  <Accordion title="Quellenangaben">
    `memory.citations` gilt für alle Backends:

    | Wert             | Verhalten                                           |
    | ---------------- | --------------------------------------------------- |
    | `auto` (Standard) | Footer `Source: <path#line>` in Snippets einschließen |
    | `on`             | Footer immer einschließen                           |
    | `off`            | Footer weglassen (Pfad wird intern weiterhin an den Agenten übergeben) |

  </Accordion>
</AccordionGroup>

QMD-Boot-Aktualisierungen verwenden während des Gateway-Starts einen einmaligen Subprozesspfad. Der langlebige QMD-Manager besitzt weiterhin den regulären Datei-Watcher und die Intervall-Timer, wenn die Memory-Suche für die interaktive Nutzung geöffnet wird.

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

## Dreaming

Dreaming wird unter `plugins.entries.memory-core.config.dreaming` konfiguriert, nicht unter `agents.defaults.memorySearch`.

Dreaming läuft als ein geplanter Sweep und verwendet interne Light-/Deep-/REM-Phasen als Implementierungsdetail.

Konzeptuelles Verhalten und Slash-Befehle finden Sie unter [Dreaming](/de/concepts/dreaming).

### Benutzereinstellungen

| Schlüssel   | Typ       | Standard       | Beschreibung                                  |
| ----------- | --------- | -------------- | --------------------------------------------- |
| `enabled`   | `boolean` | `false`        | Dreaming vollständig aktivieren oder deaktivieren |
| `frequency` | `string`  | `0 3 * * *`    | Optionaler Cron-Takt für den vollständigen Dreaming-Sweep |
| `model`     | `string`  | Standardmodell | Optionaler Modell-Override für den Dream Diary-Subagenten |

### Beispiel

```json5
{
  plugins: {
    entries: {
      "memory-core": {
        subagent: {
          allowModelOverride: true,
          allowedModels: ["anthropic/claude-sonnet-4-6"],
        },
        config: {
          dreaming: {
            enabled: true,
            frequency: "0 3 * * *",
            model: "anthropic/claude-sonnet-4-6",
          },
        },
      },
    },
  },
}
```

<Note>
- Dreaming schreibt Maschinenzustand nach `memory/.dreams/`.
- Dreaming schreibt menschenlesbare narrative Ausgabe nach `DREAMS.md` (oder in die vorhandene Datei `dreams.md`).
- `dreaming.model` verwendet das vorhandene Vertrauens-Gate für Plugin-Subagenten; setzen Sie `plugins.entries.memory-core.subagent.allowModelOverride: true`, bevor Sie es aktivieren.
- Dream Diary versucht es einmal mit dem Session-Standardmodell erneut, wenn das konfigurierte Modell nicht verfügbar ist. Vertrauens- oder Allowlist-Fehler werden protokolliert und nicht stillschweigend erneut versucht.
- Die Richtlinie und Schwellenwerte der Light-/Deep-/REM-Phasen sind internes Verhalten, keine benutzerseitige Konfiguration.

</Note>

## Verwandte Themen

- [Konfigurationsreferenz](/de/gateway/configuration-reference)
- [Memory-Übersicht](/de/concepts/memory)
- [Memory-Suche](/de/concepts/memory-search)
