---
read_when:
    - Sie möchten Provider für die Speichersuche oder Embedding-Modelle konfigurieren
    - Sie möchten das QMD-Backend einrichten
    - Sie möchten die hybride Suche, MMR oder den zeitlichen Verfall optimieren
    - Sie möchten die multimodale Speicherindizierung aktivieren
sidebarTitle: Memory config
summary: Alle Konfigurationsoptionen für Speichersuche, Embedding-Provider, QMD, hybride Suche und multimodale Indizierung
title: Referenz zur Speicherkonfiguration
x-i18n:
    generated_at: "2026-07-16T13:33:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 1947d6d654de85059ef777a3a6387f6db5b76c8d688fbb539a063162d323c1f6
    source_path: reference/memory-config.md
    workflow: 16
---

Diese Seite führt alle Konfigurationsoptionen für die OpenClaw-Speichersuche auf. Konzeptionelle Übersichten finden Sie unter:

<CardGroup cols={2}>
  <Card title="Speicherübersicht" href="/de/concepts/memory">
    Funktionsweise des Speichers.
  </Card>
  <Card title="Integrierte Engine" href="/de/concepts/memory-builtin">
    Standardmäßiges SQLite-Backend.
  </Card>
  <Card title="QMD-Engine" href="/de/concepts/memory-qmd">
    Local-First-Sidecar.
  </Card>
  <Card title="Speichersuche" href="/de/concepts/memory-search">
    Suchpipeline und Optimierung.
  </Card>
  <Card title="Active Memory" href="/de/concepts/active-memory">
    Speicher-Sub-Agent für interaktive Sitzungen.
  </Card>
</CardGroup>

Alle Einstellungen für die Speichersuche befinden sich unter `agents.defaults.memorySearch` in `openclaw.json` (oder in einer agentenspezifischen Überschreibung von `agents.list[].memorySearch`), sofern nicht anders angegeben.

<Note>
Wenn Sie nach dem Funktionsschalter und der Sub-Agent-Konfiguration für **Active Memory** suchen: Diese befinden sich unter `plugins.entries.active-memory` statt unter `memorySearch`.

Active Memory verwendet ein Modell mit zwei Schranken:

1. Das Plugin muss aktiviert sein und auf die aktuelle Agenten-ID ausgerichtet sein
2. Die Anfrage muss aus einer geeigneten interaktiven, persistenten Chatsitzung stammen

Informationen zum Aktivierungsmodell, zur Plugin-eigenen Konfiguration, zur Transkriptpersistenz und zum sicheren Einführungsmuster finden Sie unter [Active Memory](/de/concepts/active-memory).
</Note>

---

## Provider-Auswahl

| Schlüssel  | Typ       | Standardwert     | Beschreibung                                                                                                                                                                                                                                                                               |
| ---------- | --------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `enabled`  | `boolean` | `true`           | Speichersuche aktivieren oder deaktivieren                                                                                                                                                                                                                                                 |
| `provider` | `string`  | `"openai"`       | ID des Embedding-Adapters, beispielsweise `bedrock`, `deepinfra`, `gemini`, `github-copilot`, `local`, `mistral`, `ollama`, `openai`, `openai-compatible` oder `voyage`; kann auch ein konfigurierter `models.providers.<id>` sein, dessen `api` auf einen Speicher-Embedding-Adapter oder eine OpenAI-kompatible Modell-API verweist |
| `model`    | `string`  | Provider-Standardwert | Name des Embedding-Modells                                                                                                                                                                                                                                                                 |
| `fallback` | `string`  | `"none"`         | ID des Fallback-Adapters, wenn der primäre Adapter ausfällt                                                                                                                                                                                                                                |

Wenn `provider` nicht festgelegt ist, verwendet OpenClaw OpenAI-Embeddings. Legen Sie `provider`
explizit fest, um Bedrock, DeepInfra, Gemini, GitHub Copilot, Mistral, Ollama,
Voyage, ein lokales GGUF-Modell oder einen OpenAI-kompatiblen `/v1/embeddings`-Endpunkt zu verwenden.
Alte Konfigurationen, die noch `provider: "auto"` angeben, werden als `openai` aufgelöst.

<Warning>
Eine Änderung des Embedding-Providers, des Modells, der Provider-Einstellungen, der Quellen, des Gültigkeitsbereichs,
der Segmentierung oder des Tokenizers kann dazu führen, dass der vorhandene SQLite-Vektorindex inkompatibel wird.
OpenClaw pausiert die Vektorsuche und meldet eine Warnung zur Indexidentität, statt
automatisch alles erneut einzubetten. Erstellen Sie den Index mit
`openclaw memory status --index --agent <id>` oder
`openclaw memory index --force --agent <id>` neu, sobald Sie bereit sind.
</Warning>

Wenn `provider` nicht festgelegt ist, die alte Einstellung `provider: "auto"` vorhanden ist oder
`provider: "none"` absichtlich den reinen FTS-Modus auswählt, kann der Speicherabruf weiterhin
die lexikalische FTS-Rangfolge verwenden, wenn Embeddings nicht verfügbar sind.

Explizit angegebene nicht lokale Provider verhalten sich nach dem Fail-Closed-Prinzip. Wenn Sie `memorySearch.provider` auf
einen konkreten, remote gestützten Provider wie Bedrock, DeepInfra, Gemini, GitHub
Copilot, LM Studio, Mistral, Ollama, OpenAI, Voyage oder einen OpenAI-kompatiblen
benutzerdefinierten Provider festlegen und dieser Provider zur Laufzeit nicht verfügbar ist, gibt `memory_search`
ein Nichtverfügbarkeitsergebnis zurück, statt stillschweigend ausschließlich den FTS-Abruf zu verwenden. Korrigieren Sie die
Provider-/Authentifizierungskonfiguration, wechseln Sie zu einem erreichbaren Provider oder legen Sie
`provider: "none"` fest, wenn Sie bewusst ausschließlich den FTS-Abruf verwenden möchten.

### Benutzerdefinierte Provider-IDs

`memorySearch.provider` kann für speicherspezifische Provider-Adapter wie `ollama` oder für OpenAI-kompatible Modell-APIs wie `openai-responses` / `openai-completions` auf einen benutzerdefinierten `models.providers.<id>`-Eintrag verweisen. OpenClaw löst den `api`-Eigentümer dieses Providers für den Embedding-Adapter auf und behält dabei die benutzerdefinierte Provider-ID für die Verarbeitung von Endpunkt, Authentifizierung und Modellpräfix bei. Dadurch können Setups mit mehreren GPUs oder Hosts Speicher-Embeddings einem bestimmten lokalen Endpunkt zuweisen:

```json5
{
  models: {
    providers: {
      "ollama-5080": {
        api: "ollama",
        baseUrl: "http://gpu-box.local:11435",
        apiKey: "ollama-local",
        models: [{ id: "qwen3-embedding:0.6b", name: "Qwen3 Embedding 0.6B" }],
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

### Auflösung des API-Schlüssels

Remote-Embeddings erfordern einen API-Schlüssel. Bedrock verwendet stattdessen die standardmäßige Anmeldedatenkette des AWS SDK (Instanzrollen, SSO, Zugriffsschlüssel oder einen Bedrock-API-Schlüssel).

| Provider       | Umgebungsvariable                                   | Konfigurationsschlüssel             |
| -------------- | --------------------------------------------------- | ----------------------------------- |
| Bedrock        | AWS-Anmeldedatenkette oder `AWS_BEARER_TOKEN_BEDROCK` | Kein API-Schlüssel erforderlich     |
| DeepInfra      | `DEEPINFRA_API_KEY`                                 | `models.providers.deepinfra.apiKey` |
| Gemini         | `GEMINI_API_KEY`                                    | `models.providers.google.apiKey`    |
| GitHub Copilot | `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, `GITHUB_TOKEN`  | Authentifizierungsprofil über Geräteanmeldung |
| Mistral        | `MISTRAL_API_KEY`                                   | `models.providers.mistral.apiKey`   |
| Ollama         | `OLLAMA_API_KEY` (Platzhalter)                     | --                                  |
| OpenAI         | `OPENAI_API_KEY`                                    | `models.providers.openai.apiKey`    |
| Voyage         | `VOYAGE_API_KEY`                                    | `models.providers.voyage.apiKey`    |

<Note>
Codex OAuth deckt nur Chat-/Completion-Anfragen ab und genügt nicht für Embedding-Anfragen.
</Note>

---

## Konfiguration des Remote-Endpunkts

Verwenden Sie `provider: "openai-compatible"` für einen generischen OpenAI-kompatiblen
`/v1/embeddings`-Server, der nicht die globalen OpenAI-Chat-Anmeldedaten übernehmen soll.

<ParamField path="remote.baseUrl" type="string">
  Benutzerdefinierte API-Basis-URL.
</ParamField>
<ParamField path="remote.apiKey" type="string">
  API-Schlüssel überschreiben.
</ParamField>
<ParamField path="remote.headers" type="object">
  Zusätzliche HTTP-Header (mit den Provider-Standardwerten zusammengeführt).
</ParamField>

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "openai-compatible",
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

## Providerspezifische Konfiguration

<AccordionGroup>
  <Accordion title="Gemini">
    | Schlüssel              | Typ      | Standardwert           | Beschreibung                                |
    | ---------------------- | -------- | ---------------------- | ------------------------------------------- |
    | `model`                | `string` | `gemini-embedding-001` | Unterstützt auch `gemini-embedding-2-preview` |
    | `outputDimensionality` | `number` | `3072`                 | Für Embedding 2: 768, 1536 oder 3072        |

    <Warning>
    Eine Änderung des Modells oder von `outputDimensionality` ändert die Indexidentität. OpenClaw
    pausiert die Vektorsuche, bis Sie den Speicherindex explizit neu erstellen.
    </Warning>

  </Accordion>
  <Accordion title="OpenAI-kompatible Eingabetypen">
    OpenAI-kompatible Embedding-Endpunkte können providerspezifische `input_type`-Anfragefelder aktivieren. Dies ist für asymmetrische Embedding-Modelle nützlich, die unterschiedliche Bezeichnungen für Abfrage- und Dokument-Embeddings erfordern.

    | Schlüssel           | Typ      | Standardwert | Beschreibung                                                   |
    | ------------------- | -------- | ------------ | -------------------------------------------------------------- |
    | `inputType`         | `string` | nicht festgelegt | Gemeinsamer `input_type` für Abfrage- und Dokument-Embeddings |
    | `queryInputType`    | `string` | nicht festgelegt | `input_type` zur Abfragezeit; überschreibt `inputType` |
    | `documentInputType` | `string` | nicht festgelegt | Index-/Dokument-`input_type`; überschreibt `inputType` |

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            provider: "openai-compatible",
            remote: {
              baseUrl: "https://embeddings.example/v1",
              apiKey: "${EMBEDDINGS_API_KEY}",
            },
            model: "asymmetric-embedder",
            queryInputType: "query",
            documentInputType: "passage",
          },
        },
      },
    }
    ```

    Änderungen an diesen Werten wirken sich bei der Batch-Indexierung durch den Provider auf die Identität des Embedding-Caches aus. Wenn das Upstream-Modell die Bezeichnungen unterschiedlich behandelt, sollte anschließend eine Neuindexierung des Speichers durchgeführt werden.

  </Accordion>
  <Accordion title="Bedrock">
    ### Bedrock-Embedding-Konfiguration

    Bedrock verwendet die standardmäßige Anmeldedatenkette des AWS SDK sowie ein von OpenClaw geprüftes Bearer-Token, sodass keine API-Schlüssel in der Konfiguration gespeichert werden. Wenn OpenClaw auf EC2 mit einer für Bedrock aktivierten Instanzrolle ausgeführt wird, legen Sie lediglich Provider und Modell fest:

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

    | Schlüssel              | Typ      | Standardwert                   | Beschreibung                    |
    | ---------------------- | -------- | ------------------------------ | ------------------------------- |
    | `model`                | `string` | `amazon.titan-embed-text-v2:0` | Beliebige Bedrock-Embedding-Modell-ID |
    | `outputDimensionality` | `number` | Modellstandardwert             | Für Titan V2: 256, 512 oder 1024 |

    **Unterstützte Modelle** (mit Erkennung der Modellfamilie und Dimensionsstandardwerten):

    | Modell-ID                                   | Provider   | Standarddimensionen | Konfigurierbare Dimensionen          |
    | ------------------------------------------- | ---------- | ------------- | -------------------------- |
    | `amazon.titan-embed-text-v2:0`             | Amazon     | 1024         | 256, 512, 1024             |
    | `amazon.titan-embed-text-v1`               | Amazon     | 1536         | --                          |
    | `amazon.titan-embed-g1-text-02`            | Amazon     | 1536         | --                          |
    | `amazon.titan-embed-image-v1`              | Amazon     | 1024         | --                          |
    | `amazon.nova-2-multimodal-embeddings-v1:0` | Amazon     | 1024         | 256, 384, 1024, 3072       |
    | `cohere.embed-english-v3`                  | Cohere     | 1024         | --                          |
    | `cohere.embed-multilingual-v3`             | Cohere     | 1024         | --                          |
    | `cohere.embed-v4:0`                        | Cohere     | 1536         | 256, 384, 512, 768, 1024, 1536 |
    | `twelvelabs.marengo-embed-3-0-v1:0`        | TwelveLabs | 512          | --                          |
    | `twelvelabs.marengo-embed-2-7-v1:0`        | TwelveLabs | 1024         | --                          |

    Varianten mit Durchsatzsuffix (z. B. `amazon.titan-embed-text-v1:2:8k`) und Inferenzprofil-IDs mit Regionspräfix (z. B. `us.amazon.titan-embed-text-v2:0`) übernehmen die Konfiguration des Basismodells.

    **Region:** wird in dieser Reihenfolge aufgelöst: die Überschreibung `memorySearch.remote.baseUrl`, die Konfiguration `models.providers.amazon-bedrock.baseUrl`, `AWS_REGION`, `AWS_DEFAULT_REGION` und anschließend der Standardwert `us-east-1`.

    **Authentifizierung:** OpenClaw prüft zuerst auf `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY` oder `AWS_BEARER_TOKEN_BEDROCK` und greift anschließend auf die standardmäßige Credential-Provider-Kette des AWS SDK zurück:

    1. Umgebungsvariablen (`AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`), sofern nicht zusätzlich `AWS_PROFILE` festgelegt ist
    2. SSO (nur wenn SSO-Felder konfiguriert sind)
    3. Gemeinsam genutzte Anmeldedaten- und Konfigurationsdateien (`fromIni`, einschließlich `AWS_PROFILE`)
    4. Anmeldedatenprozess (`credential_process` in der AWS-Konfigurationsdatei)
    5. Anmeldedaten für Webidentitätstoken
    6. Anmeldedaten aus ECS- oder EC2-Instanzmetadaten

    **IAM-Berechtigungen:** Die IAM-Rolle oder der IAM-Benutzer benötigt:

    ```json
    {
      "Effect": "Allow",
      "Action": "bedrock:InvokeModel",
      "Resource": "*"
    }
    ```

    Beschränken Sie für das Prinzip der geringsten Rechte `InvokeModel` auf das jeweilige Modell:

    ```text
    arn:aws:bedrock:*::foundation-model/amazon.titan-embed-text-v2:0
    ```

  </Accordion>
  <Accordion title="Lokal (GGUF + llama.cpp)">
    | Schlüssel                   | Typ               | Standard                | Beschreibung                                                                                                                                                                                                                                                                                                          |
    | --------------------- | ------------------ | ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
    | `local.modelPath`     | `string`           | automatisch heruntergeladen        | Pfad zur GGUF-Modelldatei                                                                                                                                                                                                                                                                                              |
    | `local.modelCacheDir` | `string`           | node-llama-cpp-Standard | Cache-Verzeichnis für heruntergeladene Modelle                                                                                                                                                                                                                                                                                      |
    | `local.contextSize`   | `number \| "auto"` | `4096`                 | Größe des Kontextfensters für den Embedding-Kontext. 4096 deckt typische Chunks (128-512 Token) ab und begrenzt zugleich den VRAM außerhalb der Modellgewichte. Reduzieren Sie den Wert auf eingeschränkten Hosts auf 1024-2048. `"auto"` verwendet das trainierte Maximum des Modells -- für Modelle ab 8B nicht empfohlen (Qwen3-Embedding-8B: Bis zu 40 960 Token können den VRAM auf ~32 GB erhöhen). |

    Installieren Sie zuerst den offiziellen llama.cpp-Provider: `openclaw plugins install @openclaw/llama-cpp-provider`.
    Standardmodell: `embeddinggemma-300m-qat-Q8_0.gguf` (~0.6 GB, wird automatisch heruntergeladen). Quellcode-Checkouts erfordern weiterhin die Genehmigung des nativen Builds: `pnpm approve-builds` und anschließend `pnpm rebuild node-llama-cpp`.

    Verwenden Sie die eigenständige CLI, um denselben Provider-Pfad zu überprüfen, den der Gateway verwendet:

    ```bash
    openclaw memory status --deep --agent main
    openclaw memory index --force --agent main
    ```

    Numerische Werte für `local.contextSize` beeinflussen außerdem die automatische Platzierung von GPU-Layern durch node-llama-cpp, damit die Modellgewichte und der angeforderte Embedding-Kontext gemeinsam Platz finden. `openclaw memory status --deep` meldet nach dem Laden der Runtime zuletzt bekannte Angaben zu llama.cpp-Backend, Gerät, Offload, angefordertem Kontext und mit Zeitstempeln versehenen Speicherdaten; eine passive Statusabfrage lädt kein Modell.

    Legen Sie `provider: "local"` für lokale GGUF-Embeddings explizit fest. `hf:` und HTTP(S)-Modellreferenzen werden für explizite lokale Konfigurationen unterstützt (über die Modellauflösung von node-llama-cpp), ändern jedoch nicht den Standard-Provider.

  </Accordion>
</AccordionGroup>

### Zeitüberschreitung für Inline-Embeddings

<ParamField path="sync.embeddingBatchTimeoutSeconds" type="number">
  Überschreibt die Zeitüberschreitung für Inline-Embedding-Batches während der Speicherindizierung.

Ist kein Wert festgelegt, wird der Standardwert des Providers verwendet: 600 Sekunden für lokale bzw. selbst gehostete Provider wie `local`, `ollama` und `lmstudio` sowie 120 Sekunden für gehostete Provider. Erhöhen Sie diesen Wert, wenn lokale CPU-gebundene Embedding-Batches fehlerfrei, aber langsam ausgeführt werden.
</ParamField>

---

## Indizierungsverhalten

Sofern nicht anders angegeben, befinden sich alle Optionen unter `memorySearch.sync`:

| Schlüssel                            | Typ      | Standard | Beschreibung                                                           |
| ------------------------------ | --------- | ------- | --------------------------------------------------------------------- |
| `onSessionStart`               | `boolean` | `true`  | Synchronisiert den Speicherindex beim Start einer Sitzung                           |
| `onSearch`                     | `boolean` | `true`  | Synchronisiert nach erkannten Inhaltsänderungen verzögert bei der Suche                 |
| `watch`                        | `boolean` | `true`  | Überwacht Speicherdateien (chokidar) und plant bei Änderungen eine erneute Indizierung         |
| `watchDebounceMs`              | `number`  | `1500`  | Entprellungsfenster zum Zusammenfassen rasch aufeinanderfolgender Dateiüberwachungsereignisse                |
| `intervalMinutes`              | `number`  | `0`     | Intervall für die regelmäßige Neuindizierung in Minuten (`0` deaktiviert sie)                   |
| `sessions.postCompactionForce` | `boolean` | `true`  | Erzwingt nach durch Compaction ausgelösten Transkriptaktualisierungen eine erneute Sitzungsindizierung |

<ParamField path="chunking.tokens" type="number">
  Chunk-Größe in Token, die beim Aufteilen von Speicherquellen vor dem Embedding verwendet wird (Standard: 400).
</ParamField>
<ParamField path="chunking.overlap" type="number">
  Token-Überlappung zwischen benachbarten Chunks, um den Kontext in der Nähe von Teilungsgrenzen zu bewahren (Standard: 80).
</ParamField>

<Note>
Eine Änderung von `chunking.tokens` oder `chunking.overlap` verändert die Chunk-Grenzen und macht die vorhandene Indexidentität ungültig (siehe die Warnung unter „Provider-Auswahl“).
</Note>

---

## Konfiguration der Hybridsuche

Alle Optionen befinden sich unter `memorySearch.query`:

| Schlüssel          | Typ     | Standard | Beschreibung                               |
| ------------ | -------- | ------- | ----------------------------------------- |
| `maxResults` | `number` | `6`     | Maximale Anzahl zurückgegebener Speicher-Treffer vor der Einfügung |
| `minScore`   | `number` | `0.35`  | Mindest-Relevanzwert für die Aufnahme eines Treffers  |

Und unter `memorySearch.query.hybrid`:

| Schlüssel                   | Typ      | Standard | Beschreibung                        |
| --------------------- | --------- | ------- | ---------------------------------- |
| `enabled`             | `boolean` | `true`  | Aktiviert die hybride BM25- und Vektorsuche |
| `vectorWeight`        | `number`  | `0.7`   | Gewichtung für Vektorwerte (0-1)     |
| `textWeight`          | `number`  | `0.3`   | Gewichtung für BM25-Werte (0-1)       |
| `candidateMultiplier` | `number`  | `4`     | Multiplikator für die Größe des Kandidatenpools     |

<Tabs>
  <Tab title="MMR (Diversität)">
    | Schlüssel           | Typ      | Standard | Beschreibung                          |
    | ------------- | --------- | ------- | ------------------------------------- |
    | `mmr.enabled` | `boolean` | `false` | Aktiviert die erneute Rangordnung mit MMR                |
    | `mmr.lambda`  | `number`  | `0.7`   | 0 = maximale Diversität, 1 = maximale Relevanz |
  </Tab>
  <Tab title="Zeitlicher Abfall (Aktualität)">
    | Schlüssel                          | Typ      | Standard | Beschreibung               |
    | ---------------------------- | --------- | ------- | -------------------------- |
    | `temporalDecay.enabled`      | `boolean` | `false` | Aktiviert die Verstärkung aktueller Ergebnisse      |
    | `temporalDecay.halfLifeDays` | `number`  | `30`    | Der Wert halbiert sich alle N Tage |

    Dauerhaft relevante Dateien (`MEMORY.md`, undatierte Dateien in `memory/`) unterliegen keinem zeitlichen Abfall.

  </Tab>
</Tabs>

### Vollständiges Beispiel

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        query: {
          maxResults: 6,
          minScore: 0.35,
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

| Schlüssel          | Typ       | Beschreibung                              |
| ------------ | ---------- | ---------------------------------------- |
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

Pfade können absolut oder relativ zum Arbeitsbereich angegeben werden. Verzeichnisse werden rekursiv nach `.md`-Dateien durchsucht. Die Behandlung symbolischer Links hängt vom aktiven Backend ab: Die integrierte Engine überspringt symbolische Links, während QMD dem Verhalten des zugrunde liegenden QMD-Scanners folgt.

Verwenden Sie für eine agentenspezifische, agentenübergreifende Transkriptsuche `agents.list[].memorySearch.qmd.extraCollections` anstelle von `memory.qmd.paths`. Diese zusätzlichen Sammlungen folgen derselben `{ path, name, pattern? }`-Struktur, werden jedoch pro Agent zusammengeführt und können explizite gemeinsame Namen beibehalten, wenn der Pfad außerhalb des aktuellen Arbeitsbereichs liegt. Wenn derselbe aufgelöste Pfad sowohl in `memory.qmd.paths` als auch in `memorySearch.qmd.extraCollections` vorkommt, behält QMD den ersten Eintrag bei und überspringt das Duplikat.

---

## Multimodaler Speicher (Gemini)

Indizieren Sie mit Gemini Embedding 2 Bilder und Audio zusammen mit Markdown:

| Schlüssel                   | Typ        | Standardwert | Beschreibung                            |
| --------------------------- | ---------- | ------------ | --------------------------------------- |
| `multimodal.enabled`          | `boolean` | `false` | Multimodale Indizierung aktivieren      |
| `multimodal.modalities`          | `string[]` | --           | `["image"]`, `["audio"]` oder `["all"]` |
| `multimodal.maxFileBytes`          | `number` | `10485760` | Maximale Dateigröße für die Indizierung (10 MiB) |

<Note>
Gilt nur für Dateien in `extraPaths`. Die standardmäßigen Speicherstammverzeichnisse unterstützen weiterhin nur Markdown. Erfordert `gemini-embedding-2-preview`. `fallback` muss `"none"` sein.
</Note>

Unterstützte Formate: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.heic`, `.heif` (Bilder); `.mp3`, `.wav`, `.ogg`, `.opus`, `.m4a`, `.aac`, `.flac` (Audio).

---

## Embedding-Cache

| Schlüssel             | Typ       | Standardwert | Beschreibung                                  |
| --------------------- | --------- | ------------ | --------------------------------------------- |
| `cache.enabled`    | `boolean` | `true` | Embeddings von Textabschnitten in SQLite zwischenspeichern |
| `cache.maxEntries`    | `number` | nicht gesetzt | Unverbindliche Obergrenze für zwischengespeicherte Embeddings |

Verhindert, dass unveränderter Text bei einer erneuten Indizierung oder bei Transkriptaktualisierungen erneut eingebettet wird. Lassen Sie `maxEntries` für einen unbegrenzten Cache nicht gesetzt; legen Sie einen Wert fest, wenn der Speicherplatzverbrauch wichtiger als die maximale Geschwindigkeit der erneuten Indizierung ist. Ist ein Wert festgelegt, werden die ältesten Einträge (nach dem Zeitpunkt der letzten Aktualisierung) zuerst entfernt, sobald der Cache den Grenzwert überschreitet.

---

## Batch-Indizierung

| Schlüssel                     | Typ       | Standardwert | Beschreibung                |
| ----------------------------- | --------- | ------------ | --------------------------- |
| `remote.nonBatchConcurrency`            | `number` | `4` | Parallele Inline-Embeddings |
| `remote.batch.enabled`            | `boolean` | `false` | Batch-Embedding-API aktivieren |
| `remote.batch.concurrency`            | `number` | `2` | Parallele Batch-Aufträge    |
| `remote.batch.wait`            | `boolean` | `true` | Auf Abschluss des Batches warten |
| `remote.batch.pollIntervalMs`            | `number` | `2000` | Abfrageintervall            |
| `remote.batch.timeoutMinutes`            | `number` | `60` | Batch-Zeitüberschreitung    |

Verfügbar für `gemini`, `openai` und `voyage`. OpenAI Batch ist bei umfangreichen nachträglichen Indizierungen in der Regel am schnellsten und kostengünstigsten.

`remote.nonBatchConcurrency` steuert Inline-Embedding-Aufrufe, die von lokalen bzw. selbst gehosteten Providern sowie von gehosteten Providern verwendet werden, wenn die Batch-APIs des Providers nicht aktiv sind. Ollama verwendet für die Indizierung ohne Batch standardmäßig `1`, um kleinere lokale Hosts nicht zu überlasten; legen Sie auf leistungsfähigeren Rechnern einen höheren Wert fest.

Dies ist unabhängig von `sync.embeddingBatchTimeoutSeconds`, das die Zeitüberschreitung für Inline-Embedding-Aufrufe steuert.

---

## Sitzungsspeichersuche (experimentell)

Indiziert Sitzungstranskripte und stellt sie über `memory_search` bereit:

| Schlüssel                     | Typ        | Standardwert | Beschreibung                             |
| ----------------------------- | ---------- | ------------ | ---------------------------------------- |
| `experimental.sessionMemory`            | `boolean` | `false` | Sitzungsindizierung aktivieren           |
| `sources`            | `string[]` | `["memory"]` | `"sessions"` hinzufügen, um Transkripte einzubeziehen |
| `sync.sessions.deltaBytes`            | `number` | `100000` | Byte-Schwellenwert für die erneute Indizierung |
| `sync.sessions.deltaMessages`            | `number` | `50` | Nachrichtenschwellenwert für die erneute Indizierung |

<Warning>
Die Sitzungsindizierung muss ausdrücklich aktiviert werden und läuft asynchron. Die Ergebnisse können geringfügig veraltet sein. Sitzungsprotokolle befinden sich auf dem Datenträger; betrachten Sie daher den Dateisystemzugriff als Vertrauensgrenze.
</Warning>

Treffer aus Sitzungstranskripten unterliegen ebenfalls
[`tools.sessions.visibility`](/de/gateway/config-tools#toolssessions). Die standardmäßige
Sichtbarkeit `tree` legt nur die aktuelle Sitzung und die von ihr gestarteten Sitzungen offen. Um
aus einer anderen Sitzung, beispielsweise einer Direktnachricht, eine unabhängige, vom Gateway gestartete Sitzung desselben Agenten
abzurufen, erweitern Sie die Sichtbarkeit gezielt auf `agent` (oder nur dann auf `all`,
wenn auch ein agentenübergreifender Abruf erforderlich ist und die Agent-zu-Agent-Richtlinie dies zulässt).

In den folgenden Beispielen werden diese Einstellungen unter `agents.defaults` platziert. Sie können auch
entsprechende `memorySearch`-Einstellungen in einer agentenspezifischen Überschreibung
anwenden, wenn nur ein Agent Sitzungstranskripte indizieren und durchsuchen soll.

Für den Abruf vom Gateway zur Direktnachricht durch denselben Agenten:

<Tabs>
  <Tab title="Integriertes Backend">
    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            experimental: { sessionMemory: true },
            sources: ["memory", "sessions"],
          },
        },
      },
      tools: {
        sessions: { visibility: "agent" },
      },
    }
    ```
  </Tab>
  <Tab title="QMD-Backend">
    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            experimental: { sessionMemory: true },
            sources: ["memory", "sessions"],
          },
        },
      },
      memory: {
        backend: "qmd",
        qmd: {
          sessions: { enabled: true },
        },
      },
      tools: {
        sessions: { visibility: "agent" },
      },
    }
    ```
  </Tab>
</Tabs>

Bei Verwendung von QMD exportieren `agents.defaults.memorySearch.experimental.sessionMemory` und
`sources: ["sessions"]` Transkripte nicht selbstständig nach QMD. Legen Sie zusätzlich
`memory.qmd.sessions.enabled: true` fest.

---

## SQLite-Vektorbeschleunigung (sqlite-vec)

| Schlüssel                     | Typ       | Standardwert | Beschreibung                       |
| ----------------------------- | --------- | ------------ | ---------------------------------- |
| `store.vector.enabled`            | `boolean` | `true` | sqlite-vec für Vektorabfragen verwenden |
| `store.vector.extensionPath`            | `string` | mitgeliefert | sqlite-vec-Pfad überschreiben      |

Wenn sqlite-vec nicht verfügbar ist, greift OpenClaw automatisch auf die prozessinterne Kosinus-Ähnlichkeit zurück.

---

## Indexspeicher

Integrierte Speicherindizes befinden sich in der OpenClaw-SQLite-Datenbank des jeweiligen Agenten unter
`agents/<agentId>/agent/openclaw-agent.sqlite`.

| Schlüssel              | Typ      | Standardwert | Beschreibung                               |
| ---------------------- | -------- | ------------ | ------------------------------------------ |
| `store.fts.tokenizer`     | `string` | `unicode61` | FTS5-Tokenizer (`unicode61` oder `trigram`) |

---

## QMD-Backend-Konfiguration

Legen Sie `memory.backend = "qmd"` fest, um es zu aktivieren. Alle QMD-Einstellungen befinden sich unter `memory.qmd`:

| Schlüssel                     | Typ       | Standardwert | Beschreibung                                                                           |
| ----------------------------- | --------- | ------------ | -------------------------------------------------------------------------------------- |
| `command`            | `string` | `qmd` | Pfad zur ausführbaren QMD-Datei; legen Sie einen absoluten Pfad fest, wenn der Dienst `PATH` von Ihrer Shell abweicht |
| `searchMode`            | `string` | `search` | Suchbefehl: `search`, `vsearch`, `query` |
| `rerank`            | `boolean` | --           | Mit `searchMode: "query"` und QMD 2.1+ auf `false` setzen, um das QMD-Reranking zu überspringen |
| `includeDefaultMemory`            | `boolean` | `true` | `MEMORY.md` + `memory/**/*.md` automatisch indizieren |
| `paths[]`            | `array` | --           | Zusätzliche Pfade: `{ name, path, pattern? }` |
| `sessions.enabled`            | `boolean` | `false` | Sitzungstranskripte nach QMD exportieren |
| `sessions.retentionDays`            | `number` | --           | Aufbewahrung von Transkripten |
| `sessions.exportDir`            | `string` | --           | Exportverzeichnis |

`searchMode: "search"` verwendet ausschließlich lexikalische Suche/BM25. OpenClaw führt für diesen Modus keine Bereitschaftsprüfungen für semantische Vektoren und keine Wartung von QMD-Embeddings durch, auch nicht während `memory status --deep`; `vsearch` und `query` erfordern weiterhin die QMD-Vektorbereitschaft und Embeddings.

`rerank: false` ändert nur den QMD-Modus `query` und erfordert QMD 2.1 oder neuer. Im direkten CLI-Modus übergibt OpenClaw `--no-rerank`; im MCP-Modus über mcporter übergibt es `rerank: false` an das einheitliche Abfragewerkzeug von QMD. Lassen Sie die Einstellung nicht gesetzt, um das standardmäßige Abfrage-Reranking von QMD zu verwenden.

OpenClaw bevorzugt die aktuellen QMD-Collection- und MCP-Abfragestrukturen, unterstützt jedoch weiterhin ältere QMD-Versionen, indem bei Bedarf kompatible Flags für Collection-Muster und ältere MCP-Werkzeugnamen ausprobiert werden. Wenn QMD die Unterstützung mehrerer Collection-Filter meldet, werden Collections derselben Quelle mit einem einzigen QMD-Prozess durchsucht; ältere QMD-Builds verwenden weiterhin den Kompatibilitätspfad pro Collection. „Dieselbe Quelle“ bedeutet, dass dauerhafte Speicher-Collections (standardmäßige Speicherdateien sowie benutzerdefinierte Pfade) zusammen gruppiert werden, während Collections mit Sitzungstranskripten eine separate Gruppe bilden, damit bei der Diversifizierung der Quellen weiterhin beide Eingaben berücksichtigt werden.

<Note>
QMD-Modellüberschreibungen verbleiben auf der QMD-Seite und nicht in der OpenClaw-Konfiguration. Wenn Sie die Modelle von QMD global überschreiben müssen, legen Sie Umgebungsvariablen wie `QMD_EMBED_MODEL`, `QMD_RERANK_MODEL` und `QMD_GENERATE_MODEL` in der Laufzeitumgebung des Gateways fest.
</Note>

### mcporter-Integration

Alle Einstellungen befinden sich unter `memory.qmd.mcporter`. Leitet QMD-Suchen über einen langlebigen `mcporter`-MCP-Daemon, anstatt für jede Abfrage `qmd` zu starten, und reduziert damit den Kaltstartaufwand für größere Modelle.

| Schlüssel             | Typ       | Standardwert | Beschreibung                                                            |
| --------------------- | --------- | ------------ | ----------------------------------------------------------------------- |
| `enabled`    | `boolean` | `false` | QMD-Aufrufe über mcporter leiten, anstatt `qmd` pro Anfrage zu starten |
| `serverName`    | `string` | `qmd` | Name des mcporter-Servers, der `qmd mcp` mit `lifecycle: keep-alive` ausführt |
| `startDaemon`    | `boolean` | `true` | Den mcporter-Daemon automatisch starten, wenn `enabled` wahr ist |

Erfordert, dass `mcporter` installiert und im PATH verfügbar ist sowie dass ein mcporter-Server konfiguriert ist, der `qmd mcp` ausführt. Lassen Sie diese Option für einfachere lokale Einrichtungen deaktiviert, bei denen die Kosten für das Starten eines Prozesses pro Abfrage akzeptabel sind.

<AccordionGroup>
  <Accordion title="Aktualisierungszeitplan">
    | Schlüssel                       | Typ      | Standardwert | Beschreibung                           |
    | --------------------------- | --------- | -------- | ---------------------------------------- |
    | `update.interval`         | `string`  | `5m`    | Aktualisierungsintervall                      |
    | `update.debounceMs`       | `number`  | `15000` | Dateiänderungen entprellen                 |
    | `update.onBoot`           | `boolean` | `true`  | Aktualisieren, wenn der langlebige QMD-Manager geöffnet wird; auf false setzen, um die sofortige Aktualisierung beim Start zu überspringen |
    | `update.startup`          | `string`  | `off`   | Optionale QMD-Initialisierung beim Gateway-Start: `off`, `idle` oder `immediate` |
    | `update.startupDelayMs`   | `number`  | `120000` | Verzögerung vor der Ausführung der `startup: "idle"`-Aktualisierung |
    | `update.waitForBootSync`  | `boolean` | `false` | Öffnen des Managers blockieren, bis seine anfängliche Aktualisierung abgeschlossen ist |
    | `update.embedInterval`    | `string`  | `60m`   | Separates Intervall für Einbettungen                |
    | `update.commandTimeoutMs` | `number`  | `30000` | Zeitüberschreitung für QMD-Wartungsbefehle (Sammlung auflisten/hinzufügen) |
    | `update.updateTimeoutMs`  | `number`  | `120000` | Zeitüberschreitung für jeden `qmd update`-Zyklus   |
    | `update.embedTimeoutMs`   | `number`  | `120000` | Zeitüberschreitung für jeden `qmd embed`-Zyklus    |
  </Accordion>
  <Accordion title="Grenzwerte">
    | Schlüssel                       | Typ     | Standardwert | Beschreibung                |
    | --------------------------- | -------- | ------- | ------------------------------ |
    | `limits.maxResults`       | `number` | `4`     | Maximale Anzahl von Suchergebnissen         |
    | `limits.maxSnippetChars`  | `number` | `450`   | Länge der Ausschnitte begrenzen       |
    | `limits.maxInjectedChars` | `number` | `2200`  | Gesamtzahl eingefügter Zeichen begrenzen |
    | `limits.timeoutMs`        | `number` | `4000`  | Zeitüberschreitung des QMD-Befehls während einer QMD-gestützten Suche, einschließlich `memory_search`; Einrichtung, Synchronisierung, integrierter Fallback und ergänzende Arbeiten behalten die standardmäßige Tool-Frist bei |
  </Accordion>
  <Accordion title="Geltungsbereich">
    Steuert, welche Sitzungen QMD-Suchergebnisse erhalten können. Dasselbe Schema wie [`session.sendPolicy`](/de/gateway/config-agents#session):

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

    Der ausgelieferte Standardwert erlaubt nur DMs/Direktnachrichten und lehnt Gruppen sowie andere Kanaltypen ab. `match.keyPrefix` gleicht den normalisierten Sitzungsschlüssel ab; `match.rawKeyPrefix` gleicht den Rohschlüssel einschließlich `agent:<id>:` ab.

  </Accordion>
  <Accordion title="Quellenangaben">
    `memory.citations` gilt für alle Backends:

    | Wert            | Verhalten                                            |
    | ------------------ | ------------------------------------------------------ |
    | `auto` (Standardwert) | `Source: <path#line>`-Fußzeile in Ausschnitte aufnehmen    |
    | `on`             | Fußzeile immer aufnehmen                               |
    | `off`            | Fußzeile weglassen (der Pfad wird intern weiterhin an den Agenten übergeben) |

  </Accordion>
</AccordionGroup>

Wenn die QMD-Initialisierung beim Gateway-Start aktiviert ist, startet OpenClaw QMD nur für berechtigte Agenten. Wenn `update.onBoot` true ist und keine Intervall-/Einbettungswartung konfiguriert ist, verwendet der Start einen einmalig ausgeführten Manager für die Startaktualisierung und schließt ihn anschließend. Wenn ein Aktualisierungs- oder Einbettungsintervall konfiguriert ist, öffnet der Start den langlebigen QMD-Manager, damit er den Watcher und die Intervall-Timer verwalten kann; `update.onBoot: false` überspringt nur die sofortige Startaktualisierung.

### Vollständiges QMD-Beispiel

```json5
{
  memory: {
    backend: "qmd",
    citations: "auto",
    qmd: {
      includeDefaultMemory: true,
      update: { interval: "5m", debounceMs: 15000 },
      limits: { maxResults: 4, timeoutMs: 4000 },
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

Dreaming wird als ein geplanter Durchlauf ausgeführt und verwendet intern leichte, tiefe und REM-Phasen als Implementierungsdetail.

Informationen zum konzeptionellen Verhalten und zu Slash-Befehlen finden Sie unter [Dreaming](/de/concepts/dreaming).

### Benutzereinstellungen

| Schlüssel                                    | Typ      | Standardwert       | Beschreibung                                                                                                                      |
| -------------------------------------- | --------- | ------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`                              | `boolean` | `false`       | Dreaming vollständig aktivieren oder deaktivieren                                                                                              |
| `frequency`                            | `string`  | `0 3 * * *`   | Optionaler Cron-Zeitplan für den vollständigen Dreaming-Durchlauf                                                                                |
| `model`                                | `string`  | Standardmodell | Optionale Modellüberschreibung für den Dream-Diary-Subagenten                                                                                     |
| `phases.deep.maxPromotedSnippetTokens` | `number`  | `160`         | Maximale geschätzte Anzahl von Tokens, die aus jedem in `MEMORY.md` übernommenen Kurzzeit-Erinnerungsausschnitt beibehalten werden; Metadaten zur Herkunft bleiben sichtbar |

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
- Dreaming schreibt den Maschinenzustand nach `memory/.dreams/`.
- Dreaming schreibt die menschenlesbare narrative Ausgabe nach `DREAMS.md` (oder in das vorhandene `dreams.md`).
- `dreaming.model` verwendet die bestehende Vertrauensprüfung für Plugin-Subagenten; setzen Sie `plugins.entries.memory-core.subagent.allowModelOverride: true`, bevor Sie es aktivieren.
- Dream Diary versucht es einmal erneut mit dem Standardmodell der Sitzung, wenn das konfigurierte Modell nicht verfügbar ist. Fehler bei der Vertrauensprüfung oder Zulassungsliste werden protokolliert und nicht unbemerkt erneut versucht.
- Die Richtlinie und Schwellenwerte für die leichten, tiefen und REM-Phasen sind internes Verhalten und keine benutzerseitige Konfiguration.

</Note>

## Verwandte Themen

- [Konfigurationsreferenz](/de/gateway/configuration-reference)
- [Übersicht über den Speicher](/de/concepts/memory)
- [Speichersuche](/de/concepts/memory-search)
