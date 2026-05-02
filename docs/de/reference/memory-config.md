---
read_when:
    - Sie möchten Provider für die Speichersuche oder Einbettungsmodelle konfigurieren
    - Sie möchten das QMD-Backend einrichten
    - Sie möchten die hybride Suche, MMR oder zeitliche Abschwächung feinabstimmen
    - Sie möchten die multimodale Speicherindizierung aktivieren
sidebarTitle: Memory config
summary: Alle Konfigurationsoptionen für Speichersuche, Embedding-Provider, QMD, hybride Suche und multimodale Indizierung
title: Referenz zur Speicherkonfiguration
x-i18n:
    generated_at: "2026-05-02T06:45:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 11c4723b536338a777ec45673ca3c1a8c26834d6875dd4eb96617a570a55c5f5
    source_path: reference/memory-config.md
    workflow: 16
---

Diese Seite listet jeden Konfigurationsschalter für die OpenClaw-Memory-Suche auf. Konzeptionelle Übersichten finden Sie unter:

<CardGroup cols={2}>
  <Card title="Memory-Übersicht" href="/de/concepts/memory">
    Funktionsweise von Memory.
  </Card>
  <Card title="Eingebaute Engine" href="/de/concepts/memory-builtin">
    Standardmäßiges SQLite-Backend.
  </Card>
  <Card title="QMD-Engine" href="/de/concepts/memory-qmd">
    Lokales Sidecar mit Local-first-Ansatz.
  </Card>
  <Card title="Memory-Suche" href="/de/concepts/memory-search">
    Such-Pipeline und Tuning.
  </Card>
  <Card title="Active Memory" href="/de/concepts/active-memory">
    Memory-Sub-Agent für interaktive Sitzungen.
  </Card>
</CardGroup>

Alle Einstellungen für die Memory-Suche befinden sich unter `agents.defaults.memorySearch` in `openclaw.json`, sofern nicht anders angegeben.

<Note>
Wenn Sie den Feature-Schalter und die Sub-Agent-Konfiguration für **Active Memory** suchen, befindet sich diese Konfiguration unter `plugins.entries.active-memory` statt unter `memorySearch`.

Active Memory verwendet ein Modell mit zwei Gates:

1. Das Plugin muss aktiviert sein und auf die aktuelle Agent-ID abzielen.
2. Die Anfrage muss eine geeignete interaktive persistente Chat-Sitzung sein.

Siehe [Active Memory](/de/concepts/active-memory) für das Aktivierungsmodell, die Plugin-eigene Konfiguration, Transcript-Persistenz und das Muster für ein sicheres Rollout.
</Note>

---

## Provider-Auswahl

| Schlüssel  | Typ       | Standardwert    | Beschreibung                                                                                                                                                                                                                                    |
| ---------- | --------- | ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider` | `string`  | automatisch erkannt | Embedding-Adapter-ID wie `bedrock`, `deepinfra`, `gemini`, `github-copilot`, `local`, `mistral`, `ollama`, `openai` oder `voyage`; kann auch ein konfigurierter `models.providers.<id>` sein, dessen `api` auf einen dieser Adapter verweist |
| `model`    | `string`  | Provider-Standard | Name des Embedding-Modells                                                                                                                                                                                                                      |
| `fallback` | `string`  | `"none"`         | Fallback-Adapter-ID, wenn der primäre Adapter fehlschlägt                                                                                                                                                                                       |
| `enabled`  | `boolean` | `true`           | Memory-Suche aktivieren oder deaktivieren                                                                                                                                                                                                       |

### Reihenfolge der automatischen Erkennung

Wenn `provider` nicht gesetzt ist, wählt OpenClaw den ersten verfügbaren aus:

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
    Wird ausgewählt, wenn die AWS SDK-Credential-Chain aufgelöst wird (Instance-Rolle, Zugriffsschlüssel, Profil, SSO, Web Identity oder gemeinsame Konfiguration).
  </Step>
</Steps>

`ollama` wird unterstützt, aber nicht automatisch erkannt (setzen Sie es explizit).

### Benutzerdefinierte Provider-IDs

`memorySearch.provider` kann auf einen benutzerdefinierten `models.providers.<id>`-Eintrag verweisen. OpenClaw löst den `api`-Owner dieses Providers für den Embedding-Adapter auf und bewahrt dabei die benutzerdefinierte Provider-ID für Endpunkt-, Auth- und Modellpräfix-Behandlung. So können Multi-GPU- oder Multi-Host-Setups Memory-Embeddings einem bestimmten lokalen Endpunkt zuweisen:

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

Remote-Embeddings erfordern einen API-Schlüssel. Bedrock verwendet stattdessen die Standard-Credential-Chain des AWS SDK (Instance-Rollen, SSO, Zugriffsschlüssel).

| Provider       | Umgebungsvariable                                | Konfigurationsschlüssel             |
| -------------- | -------------------------------------------------- | ----------------------------------- |
| Bedrock        | AWS-Credential-Chain                               | Kein API-Schlüssel erforderlich     |
| DeepInfra      | `DEEPINFRA_API_KEY`                                | `models.providers.deepinfra.apiKey` |
| Gemini         | `GEMINI_API_KEY`                                   | `models.providers.google.apiKey`    |
| GitHub Copilot | `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, `GITHUB_TOKEN` | Auth-Profil per Geräteanmeldung     |
| Mistral        | `MISTRAL_API_KEY`                                  | `models.providers.mistral.apiKey`   |
| Ollama         | `OLLAMA_API_KEY` (Platzhalter)                     | --                                  |
| OpenAI         | `OPENAI_API_KEY`                                   | `models.providers.openai.apiKey`    |
| Voyage         | `VOYAGE_API_KEY`                                   | `models.providers.voyage.apiKey`    |

<Note>
Codex OAuth deckt nur Chat/Completions ab und erfüllt keine Embedding-Anfragen.
</Note>

---

## Konfiguration für Remote-Endpunkte

Für benutzerdefinierte OpenAI-kompatible Endpunkte oder das Überschreiben von Provider-Standards:

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
    | Schlüssel              | Typ      | Standardwert           | Beschreibung                                      |
    | ---------------------- | -------- | ---------------------- | ------------------------------------------------- |
    | `model`                | `string` | `gemini-embedding-001` | Unterstützt auch `gemini-embedding-2-preview`     |
    | `outputDimensionality` | `number` | `3072`                 | Für Embedding 2: 768, 1536 oder 3072              |

    <Warning>
    Das Ändern von Modell oder `outputDimensionality` löst automatisch eine vollständige Neuindizierung aus.
    </Warning>

  </Accordion>
  <Accordion title="OpenAI-kompatible Eingabetypen">
    OpenAI-kompatible Embedding-Endpunkte können Provider-spezifische `input_type`-Anfragefelder nutzen. Dies ist nützlich für asymmetrische Embedding-Modelle, die unterschiedliche Labels für Abfrage- und Dokument-Embeddings erfordern.

    | Schlüssel           | Typ      | Standardwert | Beschreibung                                                |
    | ------------------- | -------- | ------------ | ----------------------------------------------------------- |
    | `inputType`         | `string` | nicht gesetzt | Gemeinsamer `input_type` für Abfrage- und Dokument-Embeddings |
    | `queryInputType`    | `string` | nicht gesetzt | `input_type` zur Abfragezeit; überschreibt `inputType`       |
    | `documentInputType` | `string` | nicht gesetzt | Index-/Dokument-`input_type`; überschreibt `inputType`       |

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

    Das Ändern dieser Werte wirkt sich auf die Identität des Embedding-Caches für die Provider-Batch-Indizierung aus und sollte von einer Memory-Neuindizierung begleitet werden, wenn das Upstream-Modell die Labels unterschiedlich behandelt.

  </Accordion>
  <Accordion title="Bedrock">
    Bedrock verwendet die Standard-Credential-Chain des AWS SDK; API-Schlüssel sind nicht erforderlich. Wenn OpenClaw auf EC2 mit einer Bedrock-aktivierten Instance-Rolle ausgeführt wird, setzen Sie einfach Provider und Modell:

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

    | Schlüssel              | Typ      | Standardwert                  | Beschreibung                         |
    | ---------------------- | -------- | ------------------------------ | ------------------------------------ |
    | `model`                | `string` | `amazon.titan-embed-text-v2:0` | Beliebige Bedrock-Embedding-Modell-ID |
    | `outputDimensionality` | `number` | Modellstandard                 | Für Titan V2: 256, 512 oder 1024     |

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

    Varianten mit Durchsatz-Suffix (z. B. `amazon.titan-embed-text-v1:2:8k`) erben die Konfiguration des Basismodells.

    **Authentifizierung:** Die Bedrock-Authentifizierung verwendet die Standardreihenfolge für die Credential-Auflösung des AWS SDK:

    1. Umgebungsvariablen (`AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`)
    2. SSO-Token-Cache
    3. Web-Identity-Token-Credentials
    4. Gemeinsame Credentials- und Konfigurationsdateien
    5. ECS- oder EC2-Metadaten-Credentials

    Region wird aus `AWS_REGION`, `AWS_DEFAULT_REGION`, der `baseUrl` des `amazon-bedrock`-Providers aufgelöst oder standardmäßig auf `us-east-1` gesetzt.

    **IAM-Berechtigungen:** Die IAM-Rolle oder der IAM-Benutzer benötigt:

    ```json
    {
      "Effect": "Allow",
      "Action": "bedrock:InvokeModel",
      "Resource": "*"
    }
    ```

    Für Least-Privilege beschränken Sie `InvokeModel` auf das spezifische Modell:

    ```
    arn:aws:bedrock:*::foundation-model/amazon.titan-embed-text-v2:0
    ```

  </Accordion>
  <Accordion title="Lokal (GGUF + node-llama-cpp)">
    | Schlüssel             | Typ                | Standard               | Beschreibung                                                                                                                                                                                                                                                                                                                |
    | --------------------- | ------------------ | ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
    | `local.modelPath`     | `string`           | automatisch heruntergeladen | Pfad zur GGUF-Modelldatei                                                                                                                                                                                                                                                                                                   |
    | `local.modelCacheDir` | `string`           | node-llama-cpp-Standard | Cache-Verzeichnis für heruntergeladene Modelle                                                                                                                                                                                                                                                                              |
    | `local.contextSize`   | `number \| "auto"` | `4096`                 | Größe des Kontextfensters für den Einbettungskontext. 4096 deckt typische Chunks (128–512 Token) ab und begrenzt zugleich den VRAM außerhalb der Gewichte. Senken Sie den Wert auf eingeschränkten Hosts auf 1024–2048. `"auto"` verwendet das trainierte Maximum des Modells — für Modelle ab 8B nicht empfohlen (Qwen3-Embedding-8B: 40 960 Token → ~32 GB VRAM gegenüber ~8,8 GB bei 4096). |

    Standardmodell: `embeddinggemma-300m-qat-Q8_0.gguf` (~0,6 GB, automatisch heruntergeladen). Source-Checkouts benötigen weiterhin die Genehmigung für native Builds: `pnpm approve-builds` und dann `pnpm rebuild node-llama-cpp`.

    Verwenden Sie die eigenständige CLI, um denselben Provider-Pfad zu prüfen, den der Gateway verwendet:

    ```bash
    openclaw memory status --deep --agent main
    openclaw memory index --force --agent main
    ```

    Wenn `provider` auf `auto` gesetzt ist, wird `local` nur ausgewählt, wenn `local.modelPath` auf eine vorhandene lokale Datei verweist. `hf:`- und HTTP(S)-Modellreferenzen können weiterhin explizit mit `provider: "local"` verwendet werden, führen aber nicht dazu, dass `auto` lokal auswählt, bevor das Modell auf dem Datenträger verfügbar ist.

  </Accordion>
</AccordionGroup>

### Timeout für Inline-Einbettungen

<ParamField path="sync.embeddingBatchTimeoutSeconds" type="number">
  Überschreibt den Timeout für Inline-Einbettungs-Batches während der Speicherindizierung.

Wenn nicht gesetzt, wird der Provider-Standard verwendet: 600 Sekunden für lokale/selbst gehostete Provider wie `local`, `ollama` und `lmstudio` sowie 120 Sekunden für gehostete Provider. Erhöhen Sie diesen Wert, wenn lokale CPU-gebundene Einbettungs-Batches fehlerfrei, aber langsam sind.
</ParamField>

---

## Konfiguration für Hybridsuche

Alles unter `memorySearch.query.hybrid`:

| Schlüssel             | Typ       | Standard | Beschreibung                           |
| --------------------- | --------- | -------- | -------------------------------------- |
| `enabled`             | `boolean` | `true`   | Hybride BM25- + Vektorsuche aktivieren |
| `vectorWeight`        | `number`  | `0.7`    | Gewichtung für Vektorscores (0-1)      |
| `textWeight`          | `number`  | `0.3`    | Gewichtung für BM25-Scores (0-1)       |
| `candidateMultiplier` | `number`  | `4`      | Multiplikator für die Größe des Kandidatenpools |

<Tabs>
  <Tab title="MMR (Diversität)">
    | Schlüssel     | Typ       | Standard | Beschreibung                            |
    | ------------- | --------- | -------- | --------------------------------------- |
    | `mmr.enabled` | `boolean` | `false`  | MMR-Neusortierung aktivieren            |
    | `mmr.lambda`  | `number`  | `0.7`    | 0 = maximale Diversität, 1 = maximale Relevanz |
  </Tab>
  <Tab title="Zeitlicher Abfall (Aktualität)">
    | Schlüssel                    | Typ       | Standard | Beschreibung                            |
    | ---------------------------- | --------- | -------- | --------------------------------------- |
    | `temporalDecay.enabled`      | `boolean` | `false`  | Aktualitäts-Boost aktivieren            |
    | `temporalDecay.halfLifeDays` | `number`  | `30`     | Score halbiert sich alle N Tage         |

    Evergreen-Dateien (`MEMORY.md`, undatierte Dateien in `memory/`) werden nie abgeschwächt.

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

| Schlüssel    | Typ        | Beschreibung                                  |
| ------------ | ---------- | --------------------------------------------- |
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

Pfade können absolut oder relativ zum Workspace sein. Verzeichnisse werden rekursiv nach `.md`-Dateien durchsucht. Die Behandlung von Symlinks hängt vom aktiven Backend ab: Die integrierte Engine ignoriert Symlinks, während QMD dem Verhalten des zugrunde liegenden QMD-Scanners folgt.

Verwenden Sie für Agent-bezogene, agentenübergreifende Transkriptsuche `agents.list[].memorySearch.qmd.extraCollections` statt `memory.qmd.paths`. Diese zusätzlichen Collections folgen derselben Form `{ path, name, pattern? }`, werden jedoch pro Agent zusammengeführt und können explizite freigegebene Namen beibehalten, wenn der Pfad außerhalb des aktuellen Workspace liegt. Wenn derselbe aufgelöste Pfad sowohl in `memory.qmd.paths` als auch in `memorySearch.qmd.extraCollections` vorkommt, behält QMD den ersten Eintrag und überspringt das Duplikat.

---

## Multimodaler Speicher (Gemini)

Indizieren Sie Bilder und Audio zusammen mit Markdown mithilfe von Gemini Embedding 2:

| Schlüssel                 | Typ        | Standard   | Beschreibung                          |
| ------------------------- | ---------- | ---------- | ------------------------------------- |
| `multimodal.enabled`      | `boolean`  | `false`    | Multimodale Indizierung aktivieren    |
| `multimodal.modalities`   | `string[]` | --         | `["image"]`, `["audio"]` oder `["all"]` |
| `multimodal.maxFileBytes` | `number`   | `10000000` | Maximale Dateigröße für die Indizierung |

<Note>
Gilt nur für Dateien in `extraPaths`. Standard-Speicherwurzeln bleiben nur Markdown. Erfordert `gemini-embedding-2-preview`. `fallback` muss `"none"` sein.
</Note>

Unterstützte Formate: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.heic`, `.heif` (Bilder); `.mp3`, `.wav`, `.ogg`, `.opus`, `.m4a`, `.aac`, `.flac` (Audio).

---

## Embedding-Cache

| Key                | Type      | Default | Description                         |
| ------------------ | --------- | ------- | ----------------------------------- |
| `cache.enabled`    | `boolean` | `false` | Chunk-Embeddings in SQLite cachen   |
| `cache.maxEntries` | `number`  | `50000` | Maximale gecachte Embeddings        |

Verhindert das erneute Einbetten unveränderter Texte bei Neuindexierung oder Transkriptaktualisierungen.

---

## Batch-Indexierung

| Key                           | Type      | Default | Description                  |
| ----------------------------- | --------- | ------- | ---------------------------- |
| `remote.nonBatchConcurrency`  | `number`  | `4`     | Parallele Inline-Embeddings  |
| `remote.batch.enabled`        | `boolean` | `false` | Batch-Embedding-API aktivieren |
| `remote.batch.concurrency`    | `number`  | `2`     | Parallele Batch-Jobs         |
| `remote.batch.wait`           | `boolean` | `true`  | Auf Batch-Abschluss warten   |
| `remote.batch.pollIntervalMs` | `number`  | --      | Polling-Intervall            |
| `remote.batch.timeoutMinutes` | `number`  | --      | Batch-Timeout                |

Verfügbar für `openai`, `gemini` und `voyage`. OpenAI-Batch ist für große Backfills typischerweise am schnellsten und günstigsten.

`remote.nonBatchConcurrency` steuert Inline-Embedding-Aufrufe, die von lokalen/selbst gehosteten Providern und gehosteten Providern verwendet werden, wenn Provider-Batch-APIs nicht aktiv sind. Ollama verwendet für Nicht-Batch-Indexierung standardmäßig `1`, um kleinere lokale Hosts nicht zu überlasten; setzen Sie auf größeren Maschinen einen höheren Wert.

Dies ist getrennt von `sync.embeddingBatchTimeoutSeconds`, das den Timeout für Inline-Embedding-Aufrufe steuert.

---

## Sitzungsspeicher-Suche (experimentell)

Sitzungstranskripte indexieren und über `memory_search` verfügbar machen:

| Key                           | Type       | Default      | Description                                      |
| ----------------------------- | ---------- | ------------ | ------------------------------------------------ |
| `experimental.sessionMemory`  | `boolean`  | `false`      | Sitzungsindexierung aktivieren                   |
| `sources`                     | `string[]` | `["memory"]` | `"sessions"` hinzufügen, um Transkripte einzuschließen |
| `sync.sessions.deltaBytes`    | `number`   | `100000`     | Byte-Schwellenwert für Neuindexierung            |
| `sync.sessions.deltaMessages` | `number`   | `50`         | Nachrichten-Schwellenwert für Neuindexierung     |

<Warning>
Sitzungsindexierung ist Opt-in und läuft asynchron. Ergebnisse können leicht veraltet sein. Sitzungsprotokolle liegen auf dem Datenträger, behandeln Sie Dateisystemzugriff daher als Vertrauensgrenze.
</Warning>

---

## SQLite-Vektorbeschleunigung (sqlite-vec)

| Key                          | Type      | Default | Description                             |
| ---------------------------- | --------- | ------- | --------------------------------------- |
| `store.vector.enabled`       | `boolean` | `true`  | sqlite-vec für Vektorabfragen verwenden |
| `store.vector.extensionPath` | `string`  | bundled | sqlite-vec-Pfad überschreiben           |

Wenn sqlite-vec nicht verfügbar ist, fällt OpenClaw automatisch auf prozessinterne Kosinus-Ähnlichkeit zurück.

---

## Indexspeicher

| Key                   | Type     | Default                               | Description                                      |
| --------------------- | -------- | ------------------------------------- | ------------------------------------------------ |
| `store.path`          | `string` | `~/.openclaw/memory/{agentId}.sqlite` | Indexspeicherort (unterstützt `{agentId}`-Token) |
| `store.fts.tokenizer` | `string` | `unicode61`                           | FTS5-Tokenizer (`unicode61` oder `trigram`)      |

---

## QMD-Backend-Konfiguration

Setzen Sie `memory.backend = "qmd"`, um es zu aktivieren. Alle QMD-Einstellungen befinden sich unter `memory.qmd`:

| Key                      | Type      | Default  | Description                                                                           |
| ------------------------ | --------- | -------- | ------------------------------------------------------------------------------------- |
| `command`                | `string`  | `qmd`    | QMD-Ausführungspfad; setzen Sie einen absoluten Pfad, wenn der Dienst-`PATH` von Ihrer Shell abweicht |
| `searchMode`             | `string`  | `search` | Suchbefehl: `search`, `vsearch`, `query`                                               |
| `includeDefaultMemory`   | `boolean` | `true`   | `MEMORY.md` + `memory/**/*.md` automatisch indexieren                                  |
| `paths[]`                | `array`   | --       | Zusätzliche Pfade: `{ name, path, pattern? }`                                          |
| `sessions.enabled`       | `boolean` | `false`  | Sitzungstranskripte indexieren                                                        |
| `sessions.retentionDays` | `number`  | --       | Transkriptaufbewahrung                                                                |
| `sessions.exportDir`     | `string`  | --       | Exportverzeichnis                                                                     |

`searchMode: "search"` ist rein lexikalisch/BM25-basiert. OpenClaw führt für diesen Modus keine semantischen Vektorbereitschaftsprüfungen oder QMD-Embedding-Wartung aus, auch nicht während `memory status --deep`; `vsearch` und `query` erfordern weiterhin QMD-Vektorbereitschaft und Embeddings.

OpenClaw bevorzugt die aktuellen QMD-Collection- und MCP-Abfrageformen, hält aber ältere QMD-Versionen lauffähig, indem es bei Bedarf kompatible Collection-Pattern-Flags und ältere MCP-Tool-Namen versucht. Wenn QMD Unterstützung für mehrere Collection-Filter meldet, werden Collections aus derselben Quelle mit einem QMD-Prozess durchsucht; ältere QMD-Builds behalten den Kompatibilitätspfad pro Collection bei. Dieselbe Quelle bedeutet, dass persistente Memory-Collections gemeinsam gruppiert werden, während Session-Transcript-Collections eine eigene Gruppe bleiben, damit die Quellendiversifizierung weiterhin beide Eingaben hat.

<Note>
QMD-Modellüberschreibungen bleiben auf der QMD-Seite, nicht in der OpenClaw-Konfiguration. Wenn Sie die Modelle von QMD global überschreiben müssen, setzen Sie Umgebungsvariablen wie `QMD_EMBED_MODEL`, `QMD_RERANK_MODEL` und `QMD_GENERATE_MODEL` in der Gateway-Laufzeitumgebung.
</Note>

<AccordionGroup>
  <Accordion title="Aktualisierungszeitplan">
    | Key                       | Type      | Default | Description                           |
    | ------------------------- | --------- | ------- | ------------------------------------- |
    | `update.interval`         | `string`  | `5m`    | Aktualisierungsintervall              |
    | `update.debounceMs`       | `number`  | `15000` | Dateiänderungen entprellen            |
    | `update.onBoot`           | `boolean` | `true`  | Beim Öffnen des langlebigen QMD-Managers aktualisieren; steuert außerdem die optionale Startaktualisierung |
    | `update.startup`          | `string`  | `off`   | Optionale Aktualisierung beim Gateway-Start: `off`, `idle` oder `immediate` |
    | `update.startupDelayMs`   | `number`  | `120000` | Verzögerung, bevor die Aktualisierung mit `startup: "idle"` läuft |
    | `update.waitForBootSync`  | `boolean` | `false` | Öffnen des Managers blockieren, bis seine anfängliche Aktualisierung abgeschlossen ist |
    | `update.embedInterval`    | `string`  | --      | Separater Embedding-Takt              |
    | `update.commandTimeoutMs` | `number`  | --      | Timeout für QMD-Befehle               |
    | `update.updateTimeoutMs`  | `number`  | --      | Timeout für QMD-Aktualisierungsvorgänge |
    | `update.embedTimeoutMs`   | `number`  | --      | Timeout für QMD-Embedding-Vorgänge    |
  </Accordion>
  <Accordion title="Limits">
    | Key                       | Type     | Default | Description                |
    | ------------------------- | -------- | ------- | -------------------------- |
    | `limits.maxResults`       | `number` | `6`     | Maximale Suchergebnisse    |
    | `limits.maxSnippetChars`  | `number` | --      | Snippet-Länge begrenzen    |
    | `limits.maxInjectedChars` | `number` | --      | Insgesamt injizierte Zeichen begrenzen |
    | `limits.timeoutMs`        | `number` | `4000`  | Such-Timeout               |
  </Accordion>
  <Accordion title="Scope">
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

    Die ausgelieferte Standardeinstellung erlaubt Direkt- und Channel-Sessions, während Gruppen weiterhin verweigert werden.

    Standardmäßig nur DM. `match.keyPrefix` gleicht den normalisierten Session-Schlüssel ab; `match.rawKeyPrefix` gleicht den Rohschlüssel einschließlich `agent:<id>:` ab.

  </Accordion>
  <Accordion title="Zitate">
    `memory.citations` gilt für alle Backends:

    | Value            | Behavior                                            |
    | ---------------- | --------------------------------------------------- |
    | `auto` (default) | `Source: <path#line>`-Footer in Snippets aufnehmen  |
    | `on`             | Footer immer aufnehmen                              |
    | `off`            | Footer weglassen (Pfad wird intern weiterhin an den Agenten übergeben) |

  </Accordion>
</AccordionGroup>

QMD-Boot-Aktualisierungen verwenden während des Gateway-Starts einen einmaligen Subprozesspfad. Der langlebige QMD-Manager besitzt weiterhin den regulären Datei-Watcher und die Intervall-Timer, wenn Memory Search für interaktive Nutzung geöffnet wird.

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

Dreaming läuft als ein geplanter Durchlauf und verwendet interne Light-/Deep-/REM-Phasen als Implementierungsdetail.

Informationen zum konzeptionellen Verhalten und zu Slash-Befehlen finden Sie unter [Dreaming](/de/concepts/dreaming).

### Benutzereinstellungen

| Key         | Type      | Default       | Description                                       |
| ----------- | --------- | ------------- | ------------------------------------------------- |
| `enabled`   | `boolean` | `false`       | Dreaming vollständig aktivieren oder deaktivieren |
| `frequency` | `string`  | `0 3 * * *`   | Optionale Cron-Taktung für den vollständigen Dreaming-Durchlauf |
| `model`     | `string`  | Standardmodell | Optionale Modellüberschreibung für den Dream-Diary-Subagenten |

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
- Dreaming schreibt menschenlesbare narrative Ausgabe nach `DREAMS.md` (oder in eine vorhandene `dreams.md`).
- `dreaming.model` verwendet das bestehende Trust-Gate für Plugin-Subagenten; setzen Sie `plugins.entries.memory-core.subagent.allowModelOverride: true`, bevor Sie es aktivieren.
- Dream Diary versucht es einmal mit dem Standardmodell der Session erneut, wenn das konfigurierte Modell nicht verfügbar ist. Trust- oder Allowlist-Fehler werden protokolliert und nicht stillschweigend erneut versucht.
- Die Richtlinie und Schwellenwerte für Light-/Deep-/REM-Phasen sind internes Verhalten, keine benutzerseitige Konfiguration.

</Note>

## Verwandte Themen

- [Konfigurationsreferenz](/de/gateway/configuration-reference)
- [Memory-Überblick](/de/concepts/memory)
- [Memory Search](/de/concepts/memory-search)
