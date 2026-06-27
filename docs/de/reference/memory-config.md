---
read_when:
    - Sie möchten Memory-Suchprovider oder Embedding-Modelle konfigurieren
    - Sie möchten das QMD-Backend einrichten
    - Sie möchten die hybride Suche, MMR oder zeitliche Abschwächung optimieren
    - Sie möchten multimodale Speicherindizierung aktivieren
sidebarTitle: Memory config
summary: Alle Konfigurationsoptionen für Speichersuche, Embedding-Provider, QMD, hybride Suche und multimodale Indizierung
title: Referenz zur Speicherkonfiguration
x-i18n:
    generated_at: "2026-06-27T18:09:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d8f5880fef3fbdf81e546b0309a0e53459bae47e16efd787f87e34050d8c7b1e
    source_path: reference/memory-config.md
    workflow: 16
---

Diese Seite listet alle Konfigurationsoptionen für die OpenClaw-Speichersuche auf. Konzeptuelle Übersichten finden Sie unter:

<CardGroup cols={2}>
  <Card title="Speicherübersicht" href="/de/concepts/memory">
    So funktioniert Speicher.
  </Card>
  <Card title="Integrierte Engine" href="/de/concepts/memory-builtin">
    Standardmäßiges SQLite-Backend.
  </Card>
  <Card title="QMD-Engine" href="/de/concepts/memory-qmd">
    Local-first-Sidecar.
  </Card>
  <Card title="Speichersuche" href="/de/concepts/memory-search">
    Suchpipeline und Feinabstimmung.
  </Card>
  <Card title="Active Memory" href="/de/concepts/active-memory">
    Speicher-Sub-Agent für interaktive Sitzungen.
  </Card>
</CardGroup>

Alle Einstellungen für die Speichersuche befinden sich unter `agents.defaults.memorySearch` in `openclaw.json`, sofern nicht anders angegeben.

<Note>
Wenn Sie nach dem Feature-Schalter für **Active Memory** und der Sub-Agent-Konfiguration suchen, befindet sich diese stattdessen unter `plugins.entries.active-memory` und nicht unter `memorySearch`.

Active Memory verwendet ein Zwei-Gate-Modell:

1. das Plugin muss aktiviert sein und auf die aktuelle Agent-ID abzielen
2. die Anfrage muss eine zulässige interaktive persistente Chat-Sitzung sein

Siehe [Active Memory](/de/concepts/active-memory) für das Aktivierungsmodell, die Plugin-eigene Konfiguration, die Transkriptpersistenz und das sichere Rollout-Muster.
</Note>

---

## Provider-Auswahl

| Schlüssel  | Typ       | Standard         | Beschreibung                                                                                                                                                                                                                                                                                 |
| ---------- | --------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider` | `string`  | `"openai"`       | Einbettungsadapter-ID wie `bedrock`, `deepinfra`, `gemini`, `github-copilot`, `local`, `mistral`, `ollama`, `openai`, `openai-compatible` oder `voyage`; kann auch ein konfigurierter `models.providers.<id>` sein, dessen `api` auf einen Speicher-Einbettungsadapter oder eine OpenAI-kompatible Modell-API verweist |
| `model`    | `string`  | Provider-Standard | Name des Einbettungsmodells                                                                                                                                                                                                                                                                        |
| `fallback` | `string`  | `"none"`         | Fallback-Adapter-ID, wenn der primäre Adapter fehlschlägt                                                                                                                                                                                                                                                  |
| `enabled`  | `boolean` | `true`           | Speichersuche aktivieren oder deaktivieren                                                                                                                                                                                                                                                             |

Wenn `provider` nicht gesetzt ist, verwendet OpenClaw OpenAI-Einbettungen. Setzen Sie `provider`
explizit, um Gemini, Voyage, Mistral, DeepInfra, Bedrock, GitHub Copilot,
Ollama, ein lokales GGUF-Modell oder einen OpenAI-kompatiblen `/v1/embeddings`-Endpunkt zu verwenden.
Legacy-Konfigurationen, die noch `provider: "auto"` enthalten, werden zu `openai` aufgelöst.

<Warning>
Das Ändern von Einbettungs-Provider, Modell, Provider-Einstellungen, Quellen, Scope,
Chunking oder Tokenizer kann den vorhandenen SQLite-Vektorindex inkompatibel machen.
OpenClaw pausiert die Vektorsuche und meldet eine Indexidentitätswarnung, anstatt
automatisch alles neu einzubetten. Erstellen Sie den Index neu, wenn Sie bereit sind, mit
`openclaw memory status --index --agent <id>` oder
`openclaw memory index --force --agent <id>`.
</Warning>

Wenn `provider` nicht gesetzt ist, das Legacy-`provider: "auto"` vorhanden ist oder
`provider: "none"` absichtlich den reinen FTS-Modus auswählt, kann der Speicherabruf weiterhin
lexikalisches FTS-Ranking verwenden, wenn Einbettungen nicht verfügbar sind.

Explizite nicht lokale Provider schlagen geschlossen fehl. Wenn Sie `memorySearch.provider` auf
einen konkreten remote-gestützten Provider wie OpenAI, Gemini, Voyage, Mistral,
Bedrock, GitHub Copilot, DeepInfra, Ollama, LM Studio oder einen OpenAI-kompatiblen
benutzerdefinierten Provider setzen und dieser Provider zur Laufzeit nicht verfügbar ist, gibt `memory_search`
ein Nicht-verfügbar-Ergebnis zurück, anstatt stillschweigend reinen FTS-Abruf zu verwenden. Korrigieren Sie die
Provider-/Authentifizierungskonfiguration, wechseln Sie zu einem erreichbaren Provider oder setzen Sie
`provider: "none"`, wenn Sie bewusst reinen FTS-Abruf wünschen.

### Benutzerdefinierte Provider-IDs

`memorySearch.provider` kann auf einen benutzerdefinierten `models.providers.<id>`-Eintrag für speicherspezifische Provider-Adapter wie `ollama` oder für OpenAI-kompatible Modell-APIs wie `openai-responses` / `openai-completions` verweisen. OpenClaw löst den `api`-Owner dieses Providers für den Einbettungsadapter auf, während die benutzerdefinierte Provider-ID für Endpunkt-, Authentifizierungs- und Modellpräfix-Behandlung beibehalten wird. So können Setups mit mehreren GPUs oder Hosts Speichereinbettungen einem bestimmten lokalen Endpunkt zuweisen:

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

Remote-Einbettungen erfordern einen API-Schlüssel. Bedrock verwendet stattdessen die Standard-Anmeldeinformationskette des AWS SDK (Instanzrollen, SSO, Zugriffsschlüssel).

| Provider       | Env-Var                                            | Konfigurationsschlüssel              |
| -------------- | -------------------------------------------------- | ----------------------------------- |
| Bedrock        | AWS-Anmeldeinformationskette                       | Kein API-Schlüssel erforderlich      |
| DeepInfra      | `DEEPINFRA_API_KEY`                                | `models.providers.deepinfra.apiKey` |
| Gemini         | `GEMINI_API_KEY`                                   | `models.providers.google.apiKey`    |
| GitHub Copilot | `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, `GITHUB_TOKEN` | Authentifizierungsprofil über Geräte-Login |
| Mistral        | `MISTRAL_API_KEY`                                  | `models.providers.mistral.apiKey`   |
| Ollama         | `OLLAMA_API_KEY` (Platzhalter)                     | --                                  |
| OpenAI         | `OPENAI_API_KEY`                                   | `models.providers.openai.apiKey`    |
| Voyage         | `VOYAGE_API_KEY`                                   | `models.providers.voyage.apiKey`    |

<Note>
Codex OAuth deckt nur Chat/Completions ab und erfüllt keine Einbettungsanfragen.
</Note>

---

## Remote-Endpunkt-Konfiguration

Verwenden Sie `provider: "openai-compatible"` für einen generischen OpenAI-kompatiblen
`/v1/embeddings`-Server, der keine globalen OpenAI-Chat-Anmeldeinformationen übernehmen soll.

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

## Provider-spezifische Konfiguration

<AccordionGroup>
  <Accordion title="Gemini">
    | Schlüssel              | Typ      | Standard               | Beschreibung                                |
    | ---------------------- | -------- | ---------------------- | ------------------------------------------ |
    | `model`                | `string` | `gemini-embedding-001` | Unterstützt auch `gemini-embedding-2-preview` |
    | `outputDimensionality` | `number` | `3072`                 | Für Embedding 2: 768, 1536 oder 3072        |

    <Warning>
    Das Ändern des Modells oder von `outputDimensionality` ändert die Indexidentität. OpenClaw
    pausiert die Vektorsuche, bis Sie den Speicherindex explizit neu erstellen.
    </Warning>

  </Accordion>
  <Accordion title="OpenAI-kompatible Eingabetypen">
    OpenAI-kompatible Einbettungsendpunkte können Provider-spezifische `input_type`-Anfragefelder aktivieren. Dies ist nützlich für asymmetrische Einbettungsmodelle, die unterschiedliche Labels für Abfrage- und Dokumenteinbettungen erfordern.

    | Schlüssel           | Typ      | Standard       | Beschreibung                                             |
    | ------------------- | -------- | -------------- | ------------------------------------------------------- |
    | `inputType`         | `string` | nicht gesetzt  | Gemeinsamer `input_type` für Abfrage- und Dokumenteinbettungen   |
    | `queryInputType`    | `string` | nicht gesetzt  | `input_type` zur Abfragezeit; überschreibt `inputType`          |
    | `documentInputType` | `string` | nicht gesetzt  | Index-/Dokument-`input_type`; überschreibt `inputType`      |

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

    Das Ändern dieser Werte wirkt sich auf die Einbettungs-Cache-Identität für die Provider-Batch-Indexierung aus und sollte von einer Neuindizierung des Speichers begleitet werden, wenn das Upstream-Modell die Labels unterschiedlich behandelt.

  </Accordion>
  <Accordion title="Bedrock">
    ### Bedrock-Einbettungskonfiguration

    Bedrock verwendet die Standard-Anmeldeinformationskette des AWS SDK — keine API-Schlüssel erforderlich. Wenn OpenClaw auf EC2 mit einer Bedrock-fähigen Instanzrolle läuft, setzen Sie einfach Provider und Modell:

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

    | Schlüssel              | Typ      | Standard                       | Beschreibung                     |
    | ---------------------- | -------- | ------------------------------ | ------------------------------- |
    | `model`                | `string` | `amazon.titan-embed-text-v2:0` | Beliebige Bedrock-Einbettungsmodell-ID  |
    | `outputDimensionality` | `number` | Modellstandard                 | Für Titan V2: 256, 512 oder 1024 |

    **Unterstützte Modelle** (mit Familienerkennung und Dimensionsstandards):

    | Modell-ID                                  | Provider   | Standard-Dimensionen | Konfigurierbare Dimensionen |
    | ------------------------------------------ | ---------- | -------------------- | --------------------------- |
    | `amazon.titan-embed-text-v2:0`             | Amazon     | 1024                 | 256, 512, 1024              |
    | `amazon.titan-embed-text-v1`               | Amazon     | 1536                 | --                          |
    | `amazon.titan-embed-g1-text-02`            | Amazon     | 1536                 | --                          |
    | `amazon.titan-embed-image-v1`              | Amazon     | 1024                 | --                          |
    | `amazon.nova-2-multimodal-embeddings-v1:0` | Amazon     | 1024                 | 256, 384, 1024, 3072        |
    | `cohere.embed-english-v3`                  | Cohere     | 1024                 | --                          |
    | `cohere.embed-multilingual-v3`             | Cohere     | 1024                 | --                          |
    | `cohere.embed-v4:0`                        | Cohere     | 1536                 | 256-1536                    |
    | `twelvelabs.marengo-embed-3-0-v1:0`        | TwelveLabs | 512                  | --                          |
    | `twelvelabs.marengo-embed-2-7-v1:0`        | TwelveLabs | 1024                 | --                          |

    Varianten mit Durchsatz-Suffix (z. B. `amazon.titan-embed-text-v1:2:8k`) erben die Konfiguration des Basismodells.

    **Authentifizierung:** Die Bedrock-Authentifizierung verwendet die standardmäßige Reihenfolge zur Auflösung von Anmeldedaten im AWS SDK:

    1. Umgebungsvariablen (`AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`)
    2. SSO-Token-Cache
    3. Anmeldedaten für Web-Identity-Token
    4. Gemeinsame Anmeldedaten- und Konfigurationsdateien
    5. ECS- oder EC2-Metadaten-Anmeldedaten

    Die Region wird aus `AWS_REGION`, `AWS_DEFAULT_REGION`, der `baseUrl` des Providers `amazon-bedrock` aufgelöst oder fällt standardmäßig auf `us-east-1` zurück.

    **IAM-Berechtigungen:** Die IAM-Rolle oder der IAM-Benutzer benötigt:

    ```json
    {
      "Effect": "Allow",
      "Action": "bedrock:InvokeModel",
      "Resource": "*"
    }
    ```

    Für das Prinzip der geringsten Rechte beschränken Sie `InvokeModel` auf das konkrete Modell:

    ```
    arn:aws:bedrock:*::foundation-model/amazon.titan-embed-text-v2:0
    ```

  </Accordion>
  <Accordion title="Local (GGUF + llama.cpp)">
    | Schlüssel             | Typ                | Standard                         | Beschreibung                                                                                                                                                                                                                                                                                                                                       |
    | --------------------- | ------------------ | -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
    | `local.modelPath`     | `string`           | automatisch heruntergeladen      | Pfad zur GGUF-Modelldatei                                                                                                                                                                                                                                                                                                                          |
    | `local.modelCacheDir` | `string`           | node-llama-cpp-Standard          | Cache-Verzeichnis für heruntergeladene Modelle                                                                                                                                                                                                                                                                                                     |
    | `local.contextSize`   | `number \| "auto"` | `4096`                           | Größe des Kontextfensters für den Embedding-Kontext. 4096 deckt typische Chunks (128-512 Token) ab und begrenzt gleichzeitig Nicht-Gewichts-VRAM. Senken Sie den Wert auf eingeschränkten Hosts auf 1024-2048. `"auto"` verwendet das trainierte Maximum des Modells - nicht empfohlen für 8B+-Modelle (Qwen3-Embedding-8B: 40 960 Token -> ~32 GB VRAM gegenüber ~8,8 GB bei 4096). |

    Installieren Sie zuerst den offiziellen llama.cpp-Provider: `openclaw plugins install @openclaw/llama-cpp-provider`.
    Standardmodell: `embeddinggemma-300m-qat-Q8_0.gguf` (~0,6 GB, automatisch heruntergeladen). Source-Checkouts erfordern weiterhin die Genehmigung für native Builds: zuerst `pnpm approve-builds`, dann `pnpm rebuild node-llama-cpp`.

    Verwenden Sie die eigenständige CLI, um denselben Provider-Pfad zu prüfen, den der Gateway verwendet:

    ```bash
    openclaw memory status --deep --agent main
    openclaw memory index --force --agent main
    ```

    Setzen Sie `provider: "local"` explizit für lokale GGUF-Embeddings. `hf:`- und HTTP(S)-Modellreferenzen werden für explizite lokale Konfigurationen unterstützt, ändern aber nicht den Standard-Provider.

  </Accordion>
</AccordionGroup>

### Timeout für Inline-Embedding

<ParamField path="sync.embeddingBatchTimeoutSeconds" type="number">
  Überschreiben Sie den Timeout für Inline-Embedding-Batches während der Memory-Indexierung.

Wenn nicht gesetzt, wird der Provider-Standard verwendet: 600 Sekunden für lokale/selbst gehostete Provider wie `local`, `ollama` und `lmstudio` sowie 120 Sekunden für gehostete Provider. Erhöhen Sie diesen Wert, wenn lokale CPU-gebundene Embedding-Batches fehlerfrei, aber langsam sind.
</ParamField>

---

## Hybrid-Suchkonfiguration

Alles unter `memorySearch.query.hybrid`:

| Schlüssel             | Typ       | Standard | Beschreibung                             |
| --------------------- | --------- | -------- | ---------------------------------------- |
| `enabled`             | `boolean` | `true`   | Hybride BM25- + Vektorsuche aktivieren   |
| `vectorWeight`        | `number`  | `0.7`    | Gewichtung für Vektor-Scores (0-1)       |
| `textWeight`          | `number`  | `0.3`    | Gewichtung für BM25-Scores (0-1)         |
| `candidateMultiplier` | `number`  | `4`      | Multiplikator für die Kandidatenpoolgröße |

<Tabs>
  <Tab title="MMR (diversity)">
    | Schlüssel     | Typ       | Standard | Beschreibung                                  |
    | ------------- | --------- | -------- | --------------------------------------------- |
    | `mmr.enabled` | `boolean` | `false`  | MMR-Neusortierung aktivieren                  |
    | `mmr.lambda`  | `number`  | `0.7`    | 0 = maximale Diversität, 1 = maximale Relevanz |
  </Tab>
  <Tab title="Temporal decay (recency)">
    | Schlüssel                    | Typ       | Standard | Beschreibung                       |
    | ---------------------------- | --------- | -------- | ---------------------------------- |
    | `temporalDecay.enabled`      | `boolean` | `false`  | Aktualitäts-Boost aktivieren       |
    | `temporalDecay.halfLifeDays` | `number`  | `30`     | Score halbiert sich alle N Tage    |

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

| Schlüssel     | Typ        | Beschreibung                                           |
| ------------- | ---------- | ------------------------------------------------------ |
| `extraPaths`  | `string[]` | Zusätzliche Verzeichnisse oder Dateien zum Indexieren |

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

Für agentenbezogene, agentenübergreifende Transkriptsuche verwenden Sie `agents.list[].memorySearch.qmd.extraCollections` statt `memory.qmd.paths`. Diese zusätzlichen Sammlungen folgen derselben `{ path, name, pattern? }`-Form, werden aber pro Agent zusammengeführt und können explizite gemeinsam genutzte Namen beibehalten, wenn der Pfad außerhalb des aktuellen Arbeitsbereichs liegt. Wenn derselbe aufgelöste Pfad sowohl in `memory.qmd.paths` als auch in `memorySearch.qmd.extraCollections` erscheint, behält QMD den ersten Eintrag und überspringt das Duplikat.

---

## Multimodaler Speicher (Gemini)

Indexieren Sie Bilder und Audio neben Markdown mit Gemini Embedding 2:

| Schlüssel                 | Typ        | Standard   | Beschreibung                            |
| ------------------------- | ---------- | ---------- | --------------------------------------- |
| `multimodal.enabled`      | `boolean`  | `false`    | Multimodale Indexierung aktivieren      |
| `multimodal.modalities`   | `string[]` | --         | `["image"]`, `["audio"]` oder `["all"]` |
| `multimodal.maxFileBytes` | `number`   | `10000000` | Maximale Dateigröße für die Indexierung |

<Note>
Gilt nur für Dateien in `extraPaths`. Standardspeicherwurzeln bleiben auf Markdown beschränkt. Erfordert `gemini-embedding-2-preview`. `fallback` muss `"none"` sein.
</Note>

Unterstützte Formate: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.heic`, `.heif` (Bilder); `.mp3`, `.wav`, `.ogg`, `.opus`, `.m4a`, `.aac`, `.flac` (Audio).

---

## Embedding-Cache

| Schlüssel          | Typ       | Standard | Beschreibung                           |
| ------------------ | --------- | -------- | -------------------------------------- |
| `cache.enabled`    | `boolean` | `true`   | Chunk-Embeddings in SQLite cachen      |
| `cache.maxEntries` | `number`  | `50000`  | Maximale Anzahl gecachter Embeddings   |

Verhindert das erneute Einbetten unveränderten Texts bei Neuindexierung oder Transkriptaktualisierungen.

---

## Batch-Indexierung

| Schlüssel                     | Typ       | Standard | Beschreibung                     |
| ----------------------------- | --------- | -------- | -------------------------------- |
| `remote.nonBatchConcurrency`  | `number`  | `4`      | Parallele Inline-Embeddings      |
| `remote.batch.enabled`        | `boolean` | `false`  | Batch-Embedding-API aktivieren   |
| `remote.batch.concurrency`    | `number`  | `2`      | Parallele Batch-Jobs             |
| `remote.batch.wait`           | `boolean` | `true`   | Auf Batch-Abschluss warten       |
| `remote.batch.pollIntervalMs` | `number`  | --       | Abfrageintervall                 |
| `remote.batch.timeoutMinutes` | `number`  | --       | Batch-Timeout                    |

Verfügbar für `openai`, `gemini` und `voyage`. OpenAI-Batch ist bei großen Rückfüllungen in der Regel am schnellsten und günstigsten.

`remote.nonBatchConcurrency` steuert Inline-Embedding-Aufrufe, die von lokalen/selbst gehosteten Providern und gehosteten Providern verwendet werden, wenn Provider-Batch-APIs nicht aktiv sind. Ollama verwendet für Nicht-Batch-Indexierung standardmäßig `1`, um kleinere lokale Hosts nicht zu überlasten; legen Sie auf größeren Maschinen einen höheren Wert fest.

Dies ist getrennt von `sync.embeddingBatchTimeoutSeconds`, das den Timeout für Inline-Embedding-Aufrufe steuert.

---

## Sitzungsspeichersuche (experimentell)

Indexieren Sie Sitzungstranskripte und stellen Sie sie über `memory_search` bereit:

| Schlüssel                     | Typ        | Standard     | Beschreibung                                     |
| ----------------------------- | ---------- | ------------ | ------------------------------------------------ |
| `experimental.sessionMemory`  | `boolean`  | `false`      | Sitzungsindexierung aktivieren                   |
| `sources`                     | `string[]` | `["memory"]` | `"sessions"` hinzufügen, um Transkripte einzubeziehen |
| `sync.sessions.deltaBytes`    | `number`   | `100000`     | Byte-Schwellenwert für Neuindexierung            |
| `sync.sessions.deltaMessages` | `number`   | `50`         | Nachrichtenschwellenwert für Neuindexierung      |

<Warning>
Sitzungsindexierung ist optional und läuft asynchron. Ergebnisse können leicht veraltet sein. Sitzungsprotokolle liegen auf der Festplatte; behandeln Sie Dateisystemzugriff daher als Vertrauensgrenze.
</Warning>

---

## SQLite-Vektorbeschleunigung (sqlite-vec)

| Schlüssel                    | Typ       | Standard  | Beschreibung                              |
| ---------------------------- | --------- | --------- | ----------------------------------------- |
| `store.vector.enabled`       | `boolean` | `true`    | sqlite-vec für Vektorabfragen verwenden   |
| `store.vector.extensionPath` | `string`  | gebündelt | sqlite-vec-Pfad überschreiben             |

Wenn sqlite-vec nicht verfügbar ist, fällt OpenClaw automatisch auf prozessinterne Kosinus-Ähnlichkeit zurück.

---

## Indexspeicher

Integrierte Speicherindizes liegen in der OpenClaw-SQLite-Datenbank jedes Agenten unter
`agents/<agentId>/agent/openclaw-agent.sqlite`.

| Schlüssel             | Typ      | Standard    | Beschreibung                              |
| --------------------- | -------- | ----------- | ----------------------------------------- |
| `store.fts.tokenizer` | `string` | `unicode61` | FTS5-Tokenizer (`unicode61` oder `trigram`) |

---

## QMD-Backend-Konfiguration

Setzen Sie `memory.backend = "qmd"`, um es zu aktivieren. Alle QMD-Einstellungen liegen unter `memory.qmd`:

| Schlüssel                | Typ       | Standard | Beschreibung                                                                                                  |
| ------------------------ | --------- | -------- | ------------------------------------------------------------------------------------------------------------- |
| `command`                | `string`  | `qmd`    | Pfad zur QMD-Ausführungsdatei; setzen Sie einen absoluten Pfad, wenn sich der Dienst-`PATH` von Ihrer Shell unterscheidet |
| `searchMode`             | `string`  | `search` | Suchbefehl: `search`, `vsearch`, `query`                                                                      |
| `rerank`                 | `boolean` | --       | Mit `searchMode: "query"` und QMD 2.1+ auf `false` setzen, um QMD-Reranking zu überspringen                   |
| `includeDefaultMemory`   | `boolean` | `true`   | `MEMORY.md` + `memory/**/*.md` automatisch indexieren                                                         |
| `paths[]`                | `array`   | --       | Zusätzliche Pfade: `{ name, path, pattern? }`                                                                 |
| `sessions.enabled`       | `boolean` | `false`  | Sitzungstranskripte indexieren                                                                                |
| `sessions.retentionDays` | `number`  | --       | Aufbewahrung von Transkripten                                                                                 |
| `sessions.exportDir`     | `string`  | --       | Exportverzeichnis                                                                                            |

`searchMode: "search"` ist rein lexikalisch/BM25. OpenClaw führt für diesen Modus keine semantischen Vector-Readiness-Prüfungen oder QMD-Embedding-Wartung aus, auch nicht während `memory status --deep`; `vsearch` und `query` erfordern weiterhin QMD-Vector-Readiness und Embeddings.

`rerank: false` ändert nur den QMD-Modus `query` und erfordert QMD 2.1 oder neuer. Im direkten CLI-Modus übergibt OpenClaw `--no-rerank`; im mcporter-gestützten MCP-Modus übergibt es `rerank: false` an das einheitliche Query-Tool von QMD. Lassen Sie es nicht gesetzt, um das standardmäßige Query-Reranking-Verhalten von QMD zu verwenden.

OpenClaw bevorzugt aktuelle QMD-Collection- und MCP-Query-Formate, hält ältere QMD-Versionen aber lauffähig, indem bei Bedarf kompatible Collection-Pattern-Flags und ältere MCP-Toolnamen versucht werden. Wenn QMD Unterstützung für mehrere Collection-Filter ausweist, werden Collections derselben Quelle mit einem QMD-Prozess durchsucht; ältere QMD-Builds behalten den Kompatibilitätspfad pro Collection. Dieselbe Quelle bedeutet, dass dauerhafte Memory-Collections zusammen gruppiert werden, während Sitzungstranskript-Collections eine separate Gruppe bleiben, damit die Quellendiversifizierung weiterhin beide Eingaben hat.

<Note>
QMD-Modellüberschreibungen bleiben auf der QMD-Seite, nicht in der OpenClaw-Konfiguration. Wenn Sie QMD-Modelle global überschreiben müssen, setzen Sie Umgebungsvariablen wie `QMD_EMBED_MODEL`, `QMD_RERANK_MODEL` und `QMD_GENERATE_MODEL` in der Gateway-Laufzeitumgebung.
</Note>

<AccordionGroup>
  <Accordion title="Aktualisierungszeitplan">
    | Schlüssel                 | Typ       | Standard | Beschreibung                           |
    | ------------------------- | --------- | -------- | -------------------------------------- |
    | `update.interval`         | `string`  | `5m`     | Aktualisierungsintervall               |
    | `update.debounceMs`       | `number`  | `15000`  | Dateiänderungen entprellen             |
    | `update.onBoot`           | `boolean` | `true`   | Aktualisieren, wenn der langlebige QMD-Manager geöffnet wird; auf false setzen, um die sofortige Boot-Aktualisierung zu überspringen |
    | `update.startup`          | `string`  | `off`    | Optionale QMD-Initialisierung beim Gateway-Start: `off`, `idle` oder `immediate` |
    | `update.startupDelayMs`   | `number`  | `120000` | Verzögerung, bevor die Aktualisierung mit `startup: "idle"` läuft |
    | `update.waitForBootSync`  | `boolean` | `false`  | Öffnen des Managers blockieren, bis seine anfängliche Aktualisierung abgeschlossen ist |
    | `update.embedInterval`    | `string`  | --       | Separate Embed-Kadenz                  |
    | `update.commandTimeoutMs` | `number`  | --       | Timeout für QMD-Befehle                |
    | `update.updateTimeoutMs`  | `number`  | --       | Timeout für QMD-Aktualisierungsvorgänge |
    | `update.embedTimeoutMs`   | `number`  | --       | Timeout für QMD-Embed-Vorgänge         |
  </Accordion>
  <Accordion title="Limits">
    | Schlüssel                 | Typ      | Standard | Beschreibung                         |
    | ------------------------- | -------- | -------- | ------------------------------------ |
    | `limits.maxResults`       | `number` | `6`      | Maximale Suchergebnisse              |
    | `limits.maxSnippetChars`  | `number` | --       | Snippet-Länge begrenzen              |
    | `limits.maxInjectedChars` | `number` | --       | Gesamte injizierte Zeichen begrenzen |
    | `limits.timeoutMs`        | `number` | `4000`   | Such-Timeout                         |
  </Accordion>
  <Accordion title="Geltungsbereich">
    Steuert, welche Sitzungen QMD-Suchergebnisse erhalten können. Gleiches Schema wie [`session.sendPolicy`](/de/gateway/config-agents#session):

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

    Der ausgelieferte Standard erlaubt direkte Sitzungen und Kanalsitzungen, verweigert aber weiterhin Gruppen.

    Standard ist nur DM. `match.keyPrefix` entspricht dem normalisierten Sitzungsschlüssel; `match.rawKeyPrefix` entspricht dem Rohschlüssel einschließlich `agent:<id>:`.

  </Accordion>
  <Accordion title="Zitationen">
    `memory.citations` gilt für alle Backends:

    | Wert             | Verhalten                                             |
    | ---------------- | ----------------------------------------------------- |
    | `auto` (Standard) | `Source: <path#line>`-Fußzeile in Snippets einschließen |
    | `on`             | Fußzeile immer einschließen                           |
    | `off`            | Fußzeile weglassen (Pfad wird intern weiterhin an den Agenten übergeben) |

  </Accordion>
</AccordionGroup>

Wenn die QMD-Initialisierung beim Gateway-Start aktiviert ist, startet OpenClaw QMD nur für berechtigte Agenten. Wenn `update.onBoot` true ist und keine Intervall-/Embed-Wartung konfiguriert ist, verwendet der Start einen einmaligen Manager für die Boot-Aktualisierung und schließt ihn danach. Wenn ein Aktualisierungs- oder Embed-Intervall konfiguriert ist, öffnet der Start den langlebigen QMD-Manager, damit er den Watcher und die Intervall-Timer besitzen kann; `update.onBoot: false` überspringt nur die sofortige Boot-Aktualisierung.

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

Informationen zum konzeptionellen Verhalten und zu Slash-Befehlen finden Sie unter [Dreaming](/de/concepts/dreaming).

### Benutzereinstellungen

| Schlüssel                              | Typ       | Standard       | Beschreibung                                                                                                                      |
| -------------------------------------- | --------- | -------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`                              | `boolean` | `false`        | Dreaming vollständig aktivieren oder deaktivieren                                                                                 |
| `frequency`                            | `string`  | `0 3 * * *`    | Optionale Cron-Kadenz für den vollständigen Dreaming-Sweep                                                                        |
| `model`                                | `string`  | Standardmodell | Optionale Modellüberschreibung für den Dream-Diary-Subagent                                                                       |
| `phases.deep.maxPromotedSnippetTokens` | `number`  | `160`          | Maximale geschätzte Tokens, die aus jedem Kurzzeit-Recall-Snippet beibehalten werden, das in `MEMORY.md` befördert wird; Herkunftsmetadaten bleiben sichtbar |

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
- `dreaming.model` verwendet das bestehende Vertrauens-Gate für Plugin-Subagents; setzen Sie `plugins.entries.memory-core.subagent.allowModelOverride: true`, bevor Sie es aktivieren.
- Dream Diary versucht es einmal mit dem Standardmodell der Sitzung erneut, wenn das konfigurierte Modell nicht verfügbar ist. Vertrauens- oder Allowlist-Fehler werden protokolliert und nicht stillschweigend erneut versucht.
- Die Richtlinie und Schwellenwerte der Light-/Deep-/REM-Phasen sind internes Verhalten, keine benutzerseitige Konfiguration.

</Note>

## Verwandt

- [Konfigurationsreferenz](/de/gateway/configuration-reference)
- [Memory-Überblick](/de/concepts/memory)
- [Memory-Suche](/de/concepts/memory-search)
