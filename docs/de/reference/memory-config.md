---
read_when:
    - Sie möchten Provider für die Speichersuche oder Einbettungsmodelle konfigurieren
    - Sie möchten das QMD-Backend einrichten
    - Sie möchten die hybride Suche, MMR oder den zeitlichen Verfall feinabstimmen
    - Sie möchten die multimodale Speicherindizierung aktivieren
sidebarTitle: Memory config
summary: Alle Konfigurationsoptionen für Speichersuche, Embedding-Provider, QMD, hybride Suche und multimodale Indexierung
title: Referenz zur Speicherkonfiguration
x-i18n:
    generated_at: "2026-04-30T07:13:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: fbb21d407f7ec9ef76e68c268138892b12568137735b723579703e535d34b195
    source_path: reference/memory-config.md
    workflow: 16
---

Diese Seite listet jeden Konfigurationsschalter für die OpenClaw-Speichersuche auf. Konzeptuelle Übersichten finden Sie unter:

<CardGroup cols={2}>
  <Card title="Speicherüberblick" href="/de/concepts/memory">
    Wie Speicher funktioniert.
  </Card>
  <Card title="Integrierte Engine" href="/de/concepts/memory-builtin">
    Standardmäßiges SQLite-Backend.
  </Card>
  <Card title="QMD-Engine" href="/de/concepts/memory-qmd">
    Local-first-Sidecar.
  </Card>
  <Card title="Speichersuche" href="/de/concepts/memory-search">
    Suchpipeline und Feineinstellung.
  </Card>
  <Card title="Active Memory" href="/de/concepts/active-memory">
    Speicher-Sub-Agent für interaktive Sitzungen.
  </Card>
</CardGroup>

Alle Einstellungen für die Speichersuche befinden sich unter `agents.defaults.memorySearch` in `openclaw.json`, sofern nicht anders angegeben.

<Note>
Wenn Sie nach dem Feature-Schalter für **Active Memory** und der Sub-Agent-Konfiguration suchen: Diese befinden sich unter `plugins.entries.active-memory` statt unter `memorySearch`.

Active Memory verwendet ein Modell mit zwei Gates:

1. Das Plugin muss aktiviert sein und auf die aktuelle Agent-ID zielen.
2. Die Anfrage muss eine geeignete interaktive persistente Chat-Sitzung sein.

Siehe [Active Memory](/de/concepts/active-memory) für das Aktivierungsmodell, die Plugin-eigene Konfiguration, Transcript-Persistenz und ein sicheres Rollout-Muster.
</Note>

---

## Provider-Auswahl

| Schlüssel | Typ       | Standard              | Beschreibung                                                                                                                                                                                                                      |
| ---------- | --------- | --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider` | `string`  | automatisch erkannt   | Embedding-Adapter-ID wie `bedrock`, `deepinfra`, `gemini`, `github-copilot`, `local`, `mistral`, `ollama`, `openai` oder `voyage`; kann auch ein konfigurierter `models.providers.<id>` sein, dessen `api` auf einen dieser Adapter verweist |
| `model`    | `string`  | Provider-Standard     | Name des Embedding-Modells                                                                                                                                                                                                        |
| `fallback` | `string`  | `"none"`              | Fallback-Adapter-ID, wenn der primäre Adapter fehlschlägt                                                                                                                                                                         |
| `enabled`  | `boolean` | `true`                | Speichersuche aktivieren oder deaktivieren                                                                                                                                                                                        |

### Reihenfolge der automatischen Erkennung

Wenn `provider` nicht festgelegt ist, wählt OpenClaw den ersten verfügbaren aus:

<Steps>
  <Step title="local">
    Wird ausgewählt, wenn `memorySearch.local.modelPath` konfiguriert ist und die Datei existiert.
  </Step>
  <Step title="github-copilot">
    Wird ausgewählt, wenn ein GitHub Copilot-Token aufgelöst werden kann (Umgebungsvariable oder Auth-Profil).
  </Step>
  <Step title="openai">
    Wird ausgewählt, wenn ein OpenAI-Schlüssel aufgelöst werden kann.
  </Step>
  <Step title="gemini">
    Wird ausgewählt, wenn ein Gemini-Schlüssel aufgelöst werden kann.
  </Step>
  <Step title="voyage">
    Wird ausgewählt, wenn ein Voyage-Schlüssel aufgelöst werden kann.
  </Step>
  <Step title="mistral">
    Wird ausgewählt, wenn ein Mistral-Schlüssel aufgelöst werden kann.
  </Step>
  <Step title="deepinfra">
    Wird ausgewählt, wenn ein DeepInfra-Schlüssel aufgelöst werden kann.
  </Step>
  <Step title="bedrock">
    Wird ausgewählt, wenn die AWS-SDK-Credential-Chain aufgelöst wird (Instanzrolle, Zugriffsschlüssel, Profil, SSO, Webidentität oder gemeinsame Konfiguration).
  </Step>
</Steps>

`ollama` wird unterstützt, aber nicht automatisch erkannt (explizit festlegen).

### Benutzerdefinierte Provider-IDs

`memorySearch.provider` kann auf einen benutzerdefinierten `models.providers.<id>`-Eintrag verweisen. OpenClaw löst den `api`-Owner dieses Providers für den Embedding-Adapter auf, behält jedoch die benutzerdefinierte Provider-ID für Endpoint-, Auth- und Modellpräfix-Verarbeitung bei. Dadurch können Setups mit mehreren GPUs oder mehreren Hosts Speicher-Embeddings einem bestimmten lokalen Endpoint zuweisen:

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

### API-Schlüssel-Auflösung

Remote-Embeddings erfordern einen API-Schlüssel. Bedrock verwendet stattdessen die standardmäßige AWS-SDK-Credential-Chain (Instanzrollen, SSO, Zugriffsschlüssel).

| Provider       | Umgebungsvariable                                 | Konfigurationsschlüssel          |
| -------------- | -------------------------------------------------- | ----------------------------------- |
| Bedrock        | AWS-Credential-Chain                               | Kein API-Schlüssel erforderlich    |
| DeepInfra      | `DEEPINFRA_API_KEY`                                | `models.providers.deepinfra.apiKey` |
| Gemini         | `GEMINI_API_KEY`                                   | `models.providers.google.apiKey`    |
| GitHub Copilot | `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, `GITHUB_TOKEN` | Auth-Profil über Geräteanmeldung   |
| Mistral        | `MISTRAL_API_KEY`                                  | `models.providers.mistral.apiKey`   |
| Ollama         | `OLLAMA_API_KEY` (Platzhalter)                     | --                                  |
| OpenAI         | `OPENAI_API_KEY`                                   | `models.providers.openai.apiKey`    |
| Voyage         | `VOYAGE_API_KEY`                                   | `models.providers.voyage.apiKey`    |

<Note>
Codex OAuth deckt nur Chat/Completions ab und erfüllt keine Embedding-Anfragen.
</Note>

---

## Remote-Endpoint-Konfiguration

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
    | Schlüssel              | Typ      | Standard               | Beschreibung                              |
    | ---------------------- | -------- | ---------------------- | ----------------------------------------- |
    | `model`                | `string` | `gemini-embedding-001` | Unterstützt auch `gemini-embedding-2-preview` |
    | `outputDimensionality` | `number` | `3072`                 | Für Embedding 2: 768, 1536 oder 3072      |

    <Warning>
    Das Ändern von Modell oder `outputDimensionality` löst eine automatische vollständige Neuindizierung aus.
    </Warning>

  </Accordion>
  <Accordion title="OpenAI-kompatible Eingabetypen">
    OpenAI-kompatible Embedding-Endpoints können Provider-spezifische `input_type`-Anfragefelder verwenden. Dies ist nützlich für asymmetrische Embedding-Modelle, die unterschiedliche Labels für Abfrage- und Dokument-Embeddings erfordern.

    | Schlüssel           | Typ      | Standard | Beschreibung                                             |
    | ------------------- | -------- | -------- | -------------------------------------------------------- |
    | `inputType`         | `string` | nicht gesetzt | Gemeinsames `input_type` für Abfrage- und Dokument-Embeddings |
    | `queryInputType`    | `string` | nicht gesetzt | `input_type` zur Abfragezeit; überschreibt `inputType`   |
    | `documentInputType` | `string` | nicht gesetzt | Index-/Dokument-`input_type`; überschreibt `inputType`   |

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

    Das Ändern dieser Werte wirkt sich auf die Embedding-Cache-Identität für Provider-Batch-Indizierung aus und sollte von einer Neuindizierung des Speichers begleitet werden, wenn das Upstream-Modell die Labels unterschiedlich behandelt.

  </Accordion>
  <Accordion title="Bedrock">
    Bedrock verwendet die standardmäßige AWS-SDK-Credential-Chain — es sind keine API-Schlüssel erforderlich. Wenn OpenClaw auf EC2 mit einer Bedrock-aktivierten Instanzrolle ausgeführt wird, legen Sie einfach Provider und Modell fest:

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

    | Schlüssel              | Typ      | Standard                       | Beschreibung                   |
    | ---------------------- | -------- | ------------------------------ | ------------------------------ |
    | `model`                | `string` | `amazon.titan-embed-text-v2:0` | Beliebige Bedrock-Embedding-Modell-ID |
    | `outputDimensionality` | `number` | Modellstandard                 | Für Titan V2: 256, 512 oder 1024 |

    **Unterstützte Modelle** (mit Familienerkennung und Dimensionsstandards):

    | Modell-ID                                  | Provider   | Standarddimensionen | Konfigurierbare Dimensionen |
    | ------------------------------------------ | ---------- | ------------------- | --------------------------- |
    | `amazon.titan-embed-text-v2:0`             | Amazon     | 1024                | 256, 512, 1024              |
    | `amazon.titan-embed-text-v1`               | Amazon     | 1536                | --                          |
    | `amazon.titan-embed-g1-text-02`            | Amazon     | 1536                | --                          |
    | `amazon.titan-embed-image-v1`              | Amazon     | 1024                | --                          |
    | `amazon.nova-2-multimodal-embeddings-v1:0` | Amazon     | 1024                | 256, 384, 1024, 3072        |
    | `cohere.embed-english-v3`                  | Cohere     | 1024                | --                          |
    | `cohere.embed-multilingual-v3`             | Cohere     | 1024                | --                          |
    | `cohere.embed-v4:0`                        | Cohere     | 1536                | 256-1536                    |
    | `twelvelabs.marengo-embed-3-0-v1:0`        | TwelveLabs | 512                 | --                          |
    | `twelvelabs.marengo-embed-2-7-v1:0`        | TwelveLabs | 1024                | --                          |

    Varianten mit Durchsatzsuffix (z. B. `amazon.titan-embed-text-v1:2:8k`) erben die Konfiguration des Basismodells.

    **Authentifizierung:** Bedrock-Authentifizierung verwendet die standardmäßige AWS-SDK-Reihenfolge zur Credential-Auflösung:

    1. Umgebungsvariablen (`AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`)
    2. SSO-Token-Cache
    3. Webidentitäts-Token-Credentials
    4. Gemeinsame Credentials- und Konfigurationsdateien
    5. ECS- oder EC2-Metadaten-Credentials

    Die Region wird aus `AWS_REGION`, `AWS_DEFAULT_REGION`, der `baseUrl` des `amazon-bedrock`-Providers aufgelöst oder fällt auf `us-east-1` zurück.

    **IAM-Berechtigungen:** Die IAM-Rolle oder der Benutzer benötigt:

    ```json
    {
      "Effect": "Allow",
      "Action": "bedrock:InvokeModel",
      "Resource": "*"
    }
    ```

    Für minimale Berechtigungen schränken Sie `InvokeModel` auf das konkrete Modell ein:

    ```
    arn:aws:bedrock:*::foundation-model/amazon.titan-embed-text-v2:0
    ```

  </Accordion>
  <Accordion title="Lokal (GGUF + node-llama-cpp)">
    | Schlüssel             | Typ                | Standard               | Beschreibung                                                                                                                                                                                                                                                                                                        |
    | --------------------- | ------------------ | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
    | `local.modelPath`     | `string`           | automatisch heruntergeladen | Pfad zur GGUF-Modelldatei                                                                                                                                                                                                                                                                                           |
    | `local.modelCacheDir` | `string`           | node-llama-cpp-Standard | Cache-Verzeichnis für heruntergeladene Modelle                                                                                                                                                                                                                                                                       |
    | `local.contextSize`   | `number \| "auto"` | `4096`                 | Größe des Kontextfensters für den Embedding-Kontext. 4096 deckt typische Chunks (128-512 Token) ab und begrenzt gleichzeitig VRAM außerhalb der Gewichte. Auf eingeschränkten Hosts auf 1024-2048 senken. `"auto"` verwendet das trainierte Maximum des Modells - nicht empfohlen für Modelle ab 8B (Qwen3-Embedding-8B: 40 960 Token -> ca. 32 GB VRAM gegenüber ca. 8,8 GB bei 4096). |

    Standardmodell: `embeddinggemma-300m-qat-Q8_0.gguf` (ca. 0,6 GB, automatisch heruntergeladen). Erfordert nativen Build: `pnpm approve-builds`, dann `pnpm rebuild node-llama-cpp`.

    Verwenden Sie die eigenständige CLI, um denselben Provider-Pfad zu prüfen, den das Gateway verwendet:

    ```bash
    openclaw memory status --deep --agent main
    openclaw memory index --force --agent main
    ```

    Wenn `provider` auf `auto` gesetzt ist, wird `local` nur ausgewählt, wenn `local.modelPath` auf eine vorhandene lokale Datei zeigt. `hf:`- und HTTP(S)-Modellreferenzen können weiterhin explizit mit `provider: "local"` verwendet werden, sie führen jedoch nicht dazu, dass `auto` lokal auswählt, bevor das Modell auf der Festplatte verfügbar ist.

  </Accordion>
</AccordionGroup>

### Timeout für Inline-Embeddings

<ParamField path="sync.embeddingBatchTimeoutSeconds" type="number">
  Überschreibt den Timeout für Inline-Embedding-Batches während der Speicherindizierung.

Wenn nicht gesetzt, wird der Provider-Standard verwendet: 600 Sekunden für lokale/selbst gehostete Provider wie `local`, `ollama` und `lmstudio` sowie 120 Sekunden für gehostete Provider. Erhöhen Sie diesen Wert, wenn lokale CPU-gebundene Embedding-Batches fehlerfrei, aber langsam sind.
</ParamField>

---

## Konfiguration der hybriden Suche

Alles unter `memorySearch.query.hybrid`:

| Schlüssel             | Typ       | Standard | Beschreibung                                  |
| --------------------- | --------- | -------- | --------------------------------------------- |
| `enabled`             | `boolean` | `true`   | Hybride BM25- + Vektorsuche aktivieren        |
| `vectorWeight`        | `number`  | `0.7`    | Gewichtung für Vektorscores (0-1)             |
| `textWeight`          | `number`  | `0.3`    | Gewichtung für BM25-Scores (0-1)              |
| `candidateMultiplier` | `number`  | `4`      | Multiplikator für die Größe des Kandidatenpools |

<Tabs>
  <Tab title="MMR (Diversität)">
    | Schlüssel     | Typ       | Standard | Beschreibung                            |
    | ------------- | --------- | -------- | --------------------------------------- |
    | `mmr.enabled` | `boolean` | `false`  | MMR-Neusortierung aktivieren            |
    | `mmr.lambda`  | `number`  | `0.7`    | 0 = maximale Diversität, 1 = maximale Relevanz |
  </Tab>
  <Tab title="Zeitlicher Verfall (Aktualität)">
    | Schlüssel                    | Typ       | Standard | Beschreibung                         |
    | ---------------------------- | --------- | -------- | ------------------------------------ |
    | `temporalDecay.enabled`      | `boolean` | `false`  | Aktualitäts-Boost aktivieren         |
    | `temporalDecay.halfLifeDays` | `number`  | `30`     | Score halbiert sich alle N Tage      |

    Evergreen-Dateien (`MEMORY.md`, nicht datierte Dateien in `memory/`) unterliegen nie dem Verfall.

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
| `extraPaths` | `string[]` | Zusätzliche zu indizierende Verzeichnisse oder Dateien |

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

Pfade können absolut oder arbeitsbereichsrelativ sein. Verzeichnisse werden rekursiv nach `.md`-Dateien durchsucht. Die Behandlung von Symlinks hängt vom aktiven Backend ab: Die integrierte Engine ignoriert Symlinks, während QMD dem Verhalten des zugrunde liegenden QMD-Scanners folgt.

Für Agent-bezogene agentenübergreifende Transkriptsuche verwenden Sie `agents.list[].memorySearch.qmd.extraCollections` statt `memory.qmd.paths`. Diese zusätzlichen Collections folgen derselben Struktur `{ path, name, pattern? }`, werden jedoch pro Agent zusammengeführt und können explizite gemeinsame Namen beibehalten, wenn der Pfad außerhalb des aktuellen Arbeitsbereichs liegt. Wenn derselbe aufgelöste Pfad sowohl in `memory.qmd.paths` als auch in `memorySearch.qmd.extraCollections` erscheint, behält QMD den ersten Eintrag und überspringt das Duplikat.

---

## Multimodaler Speicher (Gemini)

Indizieren Sie Bilder und Audio zusammen mit Markdown mithilfe von Gemini Embedding 2:

| Schlüssel                 | Typ        | Standard   | Beschreibung                            |
| ------------------------- | ---------- | ---------- | --------------------------------------- |
| `multimodal.enabled`      | `boolean`  | `false`    | Multimodale Indizierung aktivieren      |
| `multimodal.modalities`   | `string[]` | --         | `["image"]`, `["audio"]` oder `["all"]` |
| `multimodal.maxFileBytes` | `number`   | `10000000` | Maximale Dateigröße für die Indizierung |

<Note>
Gilt nur für Dateien in `extraPaths`. Standard-Memory-Roots bleiben auf Markdown beschränkt. Erfordert `gemini-embedding-2-preview`. `fallback` muss `"none"` sein.
</Note>

Unterstützte Formate: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.heic`, `.heif` (Bilder); `.mp3`, `.wav`, `.ogg`, `.opus`, `.m4a`, `.aac`, `.flac` (Audio).

---

## Embedding-Cache

| Schlüssel          | Typ       | Standard | Beschreibung                            |
| ------------------ | --------- | -------- | --------------------------------------- |
| `cache.enabled`    | `boolean` | `false`  | Chunk-Embeddings in SQLite cachen       |
| `cache.maxEntries` | `number`  | `50000`  | Maximale Anzahl gecachter Embeddings    |

Verhindert das erneute Einbetten unveränderten Texts bei Reindexierung oder Transkriptaktualisierungen.

---

## Batch-Indexierung

| Schlüssel                     | Typ       | Standard | Beschreibung                  |
| ----------------------------- | --------- | -------- | ----------------------------- |
| `remote.nonBatchConcurrency`  | `number`  | `4`      | Parallele Inline-Embeddings   |
| `remote.batch.enabled`        | `boolean` | `false`  | Batch-Embedding-API aktivieren |
| `remote.batch.concurrency`    | `number`  | `2`      | Parallele Batch-Jobs          |
| `remote.batch.wait`           | `boolean` | `true`   | Auf Batch-Abschluss warten    |
| `remote.batch.pollIntervalMs` | `number`  | --       | Abfrageintervall              |
| `remote.batch.timeoutMinutes` | `number`  | --       | Batch-Timeout                 |

Verfügbar für `openai`, `gemini` und `voyage`. OpenAI-Batch ist für große Backfills in der Regel am schnellsten und günstigsten.

`remote.nonBatchConcurrency` steuert Inline-Embedding-Aufrufe, die von lokalen/selbst gehosteten Providern und gehosteten Providern verwendet werden, wenn Provider-Batch-APIs nicht aktiv sind. Ollama verwendet für Nicht-Batch-Indexierung standardmäßig `1`, um kleinere lokale Hosts nicht zu überlasten; legen Sie auf größeren Maschinen einen höheren Wert fest.

Dies ist getrennt von `sync.embeddingBatchTimeoutSeconds`, das den Timeout für Inline-Embedding-Aufrufe steuert.

---

## Sitzungsspeichersuche (experimentell)

Sitzungstranskripte indexieren und über `memory_search` bereitstellen:

| Schlüssel                     | Typ        | Standard     | Beschreibung                                  |
| ----------------------------- | ---------- | ------------ | --------------------------------------------- |
| `experimental.sessionMemory`  | `boolean`  | `false`      | Sitzungsindexierung aktivieren                |
| `sources`                     | `string[]` | `["memory"]` | `"sessions"` hinzufügen, um Transkripte einzubeziehen |
| `sync.sessions.deltaBytes`    | `number`   | `100000`     | Byte-Schwellenwert für Reindexierung          |
| `sync.sessions.deltaMessages` | `number`   | `50`         | Nachrichten-Schwellenwert für Reindexierung   |

<Warning>
Sitzungsindexierung ist Opt-in und läuft asynchron. Ergebnisse können leicht veraltet sein. Sitzungsprotokolle liegen auf dem Datenträger, behandeln Sie daher den Dateisystemzugriff als Vertrauensgrenze.
</Warning>

---

## SQLite-Vektorbeschleunigung (sqlite-vec)

| Schlüssel                    | Typ       | Standard  | Beschreibung                          |
| ---------------------------- | --------- | --------- | ------------------------------------- |
| `store.vector.enabled`       | `boolean` | `true`    | sqlite-vec für Vektorabfragen verwenden |
| `store.vector.extensionPath` | `string`  | gebündelt | sqlite-vec-Pfad überschreiben         |

Wenn sqlite-vec nicht verfügbar ist, fällt OpenClaw automatisch auf Kosinusähnlichkeit im Prozess zurück.

---

## Indexspeicher

| Schlüssel             | Typ      | Standard                              | Beschreibung                                  |
| --------------------- | -------- | ------------------------------------- | --------------------------------------------- |
| `store.path`          | `string` | `~/.openclaw/memory/{agentId}.sqlite` | Indexspeicherort (unterstützt `{agentId}`-Token) |
| `store.fts.tokenizer` | `string` | `unicode61`                           | FTS5-Tokenizer (`unicode61` oder `trigram`)   |

---

## QMD-Backend-Konfiguration

Legen Sie `memory.backend = "qmd"` fest, um es zu aktivieren. Alle QMD-Einstellungen befinden sich unter `memory.qmd`:

| Schlüssel                | Typ       | Standard | Beschreibung                                                                                         |
| ------------------------ | --------- | -------- | ---------------------------------------------------------------------------------------------------- |
| `command`                | `string`  | `qmd`    | Pfad zur QMD-Ausführungsdatei; legen Sie einen absoluten Pfad fest, wenn sich der Dienst-`PATH` von Ihrer Shell unterscheidet |
| `searchMode`             | `string`  | `search` | Suchbefehl: `search`, `vsearch`, `query`                                                             |
| `includeDefaultMemory`   | `boolean` | `true`   | `MEMORY.md` + `memory/**/*.md` automatisch indexieren                                                |
| `paths[]`                | `array`   | --       | Zusätzliche Pfade: `{ name, path, pattern? }`                                                        |
| `sessions.enabled`       | `boolean` | `false`  | Sitzungstranskripte indexieren                                                                       |
| `sessions.retentionDays` | `number`  | --       | Transkriptaufbewahrung                                                                               |
| `sessions.exportDir`     | `string`  | --       | Exportverzeichnis                                                                                    |

`searchMode: "search"` ist ausschließlich lexikalisch/BM25-basiert. OpenClaw führt für diesen Modus keine semantischen Vektor-Bereitschaftsprüfungen oder QMD-Embedding-Wartung aus, auch nicht während `memory status --deep`; `vsearch` und `query` erfordern weiterhin QMD-Vektorbereitschaft und Embeddings.

OpenClaw bevorzugt aktuelle QMD-Collection- und MCP-Abfrageformen, hält ältere QMD-Versionen aber funktionsfähig, indem bei Bedarf kompatible Collection-Pattern-Flags und ältere MCP-Toolnamen ausprobiert werden. Wenn QMD Unterstützung für mehrere Collection-Filter angibt, werden Collections aus derselben Quelle mit einem QMD-Prozess durchsucht; ältere QMD-Builds behalten den Kompatibilitätspfad pro Collection bei. Dieselbe Quelle bedeutet, dass dauerhafte Memory-Collections zusammen gruppiert werden, während Session-Transcript-Collections eine separate Gruppe bleiben, damit die Quellendiversifizierung weiterhin beide Eingaben hat.

<Note>
QMD-Modellüberschreibungen bleiben auf der QMD-Seite, nicht in der OpenClaw-Konfiguration. Wenn Sie die Modelle von QMD global überschreiben müssen, setzen Sie Umgebungsvariablen wie `QMD_EMBED_MODEL`, `QMD_RERANK_MODEL` und `QMD_GENERATE_MODEL` in der Gateway-Laufzeitumgebung.
</Note>

<AccordionGroup>
  <Accordion title="Aktualisierungszeitplan">
    | Schlüssel                 | Typ       | Standard | Beschreibung                         |
    | ------------------------- | --------- | -------- | ------------------------------------ |
    | `update.interval`         | `string`  | `5m`     | Aktualisierungsintervall             |
    | `update.debounceMs`       | `number`  | `15000`  | Dateiänderungen entprellen           |
    | `update.onBoot`           | `boolean` | `true`   | Aktualisieren, wenn der langlebige QMD-Manager geöffnet wird; steuert auch die optionale Startaktualisierung |
    | `update.startup`          | `string`  | `off`    | Optionale Aktualisierung beim Gateway-Start: `off`, `idle` oder `immediate` |
    | `update.startupDelayMs`   | `number`  | `120000` | Verzögerung, bevor die Aktualisierung mit `startup: "idle"` ausgeführt wird |
    | `update.waitForBootSync`  | `boolean` | `false`  | Öffnen des Managers blockieren, bis seine erste Aktualisierung abgeschlossen ist |
    | `update.embedInterval`    | `string`  | --       | Separate Embedding-Kadenz            |
    | `update.commandTimeoutMs` | `number`  | --       | Timeout für QMD-Befehle              |
    | `update.updateTimeoutMs`  | `number`  | --       | Timeout für QMD-Aktualisierungsvorgänge |
    | `update.embedTimeoutMs`   | `number`  | --       | Timeout für QMD-Embedding-Vorgänge   |
  </Accordion>
  <Accordion title="Limits">
    | Schlüssel                 | Typ      | Standard | Beschreibung                         |
    | ------------------------- | -------- | -------- | ------------------------------------ |
    | `limits.maxResults`       | `number` | `6`      | Maximale Suchergebnisse              |
    | `limits.maxSnippetChars`  | `number` | --       | Snippet-Länge begrenzen              |
    | `limits.maxInjectedChars` | `number` | --       | Gesamtzahl injizierter Zeichen begrenzen |
    | `limits.timeoutMs`        | `number` | `4000`   | Such-Timeout                         |
  </Accordion>
  <Accordion title="Geltungsbereich">
    Steuert, welche Sessions QMD-Suchergebnisse erhalten können. Dasselbe Schema wie [`session.sendPolicy`](/de/gateway/config-agents#session):

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

    Die ausgelieferte Standardeinstellung erlaubt Direkt- und Channel-Sessions, verweigert Gruppen aber weiterhin.

    Standard ist nur DM. `match.keyPrefix` entspricht dem normalisierten Session-Schlüssel; `match.rawKeyPrefix` entspricht dem Rohschlüssel einschließlich `agent:<id>:`.

  </Accordion>
  <Accordion title="Quellenangaben">
    `memory.citations` gilt für alle Backends:

    | Wert             | Verhalten                                          |
    | ---------------- | -------------------------------------------------- |
    | `auto` (Standard) | `Source: <path#line>`-Fußzeile in Snippets einschließen |
    | `on`             | Fußzeile immer einschließen                        |
    | `off`            | Fußzeile weglassen (Pfad wird intern weiterhin an den Agent übergeben) |

  </Accordion>
</AccordionGroup>

QMD-Boot-Aktualisierungen verwenden während des Gateway-Starts einen einmaligen Subprozesspfad. Der langlebige QMD-Manager besitzt weiterhin den regulären Datei-Watcher und die Intervalltimer, wenn die Memory-Suche für die interaktive Nutzung geöffnet wird.

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

Konzeptionelles Verhalten und Slash-Befehle finden Sie unter [Dreaming](/de/concepts/dreaming).

### Benutzereinstellungen

| Schlüssel   | Typ       | Standardmodell | Beschreibung                                      |
| ----------- | --------- | -------------- | ------------------------------------------------- |
| `enabled`   | `boolean` | `false`        | Dreaming vollständig aktivieren oder deaktivieren |
| `frequency` | `string`  | `0 3 * * *`    | Optionale Cron-Kadenz für den vollständigen Dreaming-Sweep |
| `model`     | `string`  | default model  | Optionale Modellüberschreibung für den Dream-Diary-Subagent |

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
- `dreaming.model` verwendet das bestehende Vertrauens-Gate des Plugin-Subagent; setzen Sie `plugins.entries.memory-core.subagent.allowModelOverride: true`, bevor Sie es aktivieren.
- Dream Diary versucht es einmal mit dem Session-Standardmodell erneut, wenn das konfigurierte Modell nicht verfügbar ist. Vertrauens- oder Allowlist-Fehler werden protokolliert und nicht stillschweigend erneut versucht.
- Die Richtlinie und Schwellenwerte für die Light-/Deep-/REM-Phasen sind internes Verhalten, keine benutzerseitige Konfiguration.

</Note>

## Verwandte Themen

- [Konfigurationsreferenz](/de/gateway/configuration-reference)
- [Memory-Überblick](/de/concepts/memory)
- [Memory-Suche](/de/concepts/memory-search)
