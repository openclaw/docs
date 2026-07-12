---
read_when:
    - Sie möchten Provider für die Speichersuche oder Einbettungsmodelle konfigurieren
    - Sie möchten das QMD-Backend einrichten
    - Sie möchten die Hybridsuche, MMR oder den zeitlichen Verfall optimieren
    - Sie möchten die multimodale Speicherindizierung aktivieren
sidebarTitle: Memory config
summary: Alle Konfigurationsoptionen für die Speichersuche, Embedding-Provider, QMD, hybride Suche und multimodale Indizierung
title: Referenz zur Speicherkonfiguration
x-i18n:
    generated_at: "2026-07-12T02:08:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 558995797a5e217e57245e1d5ff90124fca67b6eb4767d97a3ea26a4ca013d06
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

Sofern nicht anders angegeben, befinden sich alle Einstellungen für die Speichersuche unter `agents.defaults.memorySearch` in `openclaw.json` (oder in einer agentenspezifischen Überschreibung unter `agents.list[].memorySearch`).

<Note>
Wenn Sie den Funktionsschalter für **Active Memory** und die Sub-Agent-Konfiguration suchen: Diese befinden sich unter `plugins.entries.active-memory` statt unter `memorySearch`.

Active Memory verwendet ein Modell mit zwei Voraussetzungen:

1. Das Plugin muss aktiviert sein und auf die aktuelle Agenten-ID abzielen.
2. Die Anfrage muss aus einer geeigneten interaktiven, persistenten Chatsitzung stammen.

Unter [Active Memory](/de/concepts/active-memory) finden Sie Informationen zum Aktivierungsmodell, zur Plugin-eigenen Konfiguration, zur Transkriptpersistenz und zu einem sicheren Einführungsmuster.
</Note>

---

## Provider-Auswahl

| Schlüssel  | Typ       | Standard             | Beschreibung                                                                                                                                                                                                                                                                             |
| ---------- | --------- | -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`  | `boolean` | `true`               | Aktiviert oder deaktiviert die Speichersuche                                                                                                                                                                                                                                             |
| `provider` | `string`  | `"openai"`           | ID des Embedding-Adapters, etwa `bedrock`, `deepinfra`, `gemini`, `github-copilot`, `local`, `mistral`, `ollama`, `openai`, `openai-compatible` oder `voyage`; kann auch ein konfigurierter `models.providers.<id>` sein, dessen `api` auf einen Speicher-Embedding-Adapter oder eine OpenAI-kompatible Modell-API verweist |
| `model`    | `string`  | Provider-Standard    | Name des Embedding-Modells                                                                                                                                                                                                                                                               |
| `fallback` | `string`  | `"none"`             | ID des Ausweichadapters, wenn der primäre Adapter fehlschlägt                                                                                                                                                                                                                            |

Wenn `provider` nicht festgelegt ist, verwendet OpenClaw OpenAI-Embeddings. Legen Sie `provider`
explizit fest, um Bedrock, DeepInfra, Gemini, GitHub Copilot, Mistral, Ollama,
Voyage, ein lokales GGUF-Modell oder einen OpenAI-kompatiblen `/v1/embeddings`-Endpunkt zu verwenden.
Ältere Konfigurationen, die noch `provider: "auto"` enthalten, werden als `openai` aufgelöst.

<Warning>
Wenn Sie den Embedding-Provider, das Modell, die Provider-Einstellungen, Quellen, den Geltungsbereich,
die Segmentierung oder den Tokenizer ändern, kann der vorhandene SQLite-Vektorindex inkompatibel werden.
OpenClaw pausiert die Vektorsuche und meldet eine Warnung zur Indexidentität, statt
automatisch alle Inhalte erneut einzubetten. Erstellen Sie den Index neu, sobald Sie bereit sind, mit
`openclaw memory status --index --agent <id>` oder
`openclaw memory index --force --agent <id>`.
</Warning>

Wenn `provider` nicht festgelegt ist, das ältere `provider: "auto"` vorhanden ist oder
`provider: "none"` absichtlich den reinen FTS-Modus auswählt, kann der Speicherabruf
weiterhin die lexikalische FTS-Rangfolge verwenden, wenn Embeddings nicht verfügbar sind.

Explizit konfigurierte nicht lokale Provider schlagen ohne Ausweichverhalten fehl. Wenn Sie `memorySearch.provider`
auf einen konkreten, remote gestützten Provider wie Bedrock, DeepInfra, Gemini, GitHub
Copilot, LM Studio, Mistral, Ollama, OpenAI, Voyage oder einen OpenAI-kompatiblen
benutzerdefinierten Provider festlegen und dieser Provider zur Laufzeit nicht verfügbar ist, gibt `memory_search`
ein Ergebnis mit dem Status „nicht verfügbar“ zurück, statt stillschweigend einen reinen FTS-Abruf zu verwenden. Korrigieren Sie die
Provider-/Authentifizierungskonfiguration, wechseln Sie zu einem erreichbaren Provider oder legen Sie
`provider: "none"` fest, wenn Sie bewusst einen reinen FTS-Abruf wünschen.

### Benutzerdefinierte Provider-IDs

`memorySearch.provider` kann auf einen benutzerdefinierten `models.providers.<id>`-Eintrag für speicherspezifische Provider-Adapter wie `ollama` oder für OpenAI-kompatible Modell-APIs wie `openai-responses` / `openai-completions` verweisen. OpenClaw ermittelt den zugehörigen `api`-Besitzer für den Embedding-Adapter und behält zugleich die benutzerdefinierte Provider-ID für die Verarbeitung von Endpunkt, Authentifizierung und Modellpräfix bei. Dadurch können Konfigurationen mit mehreren GPUs oder Hosts Speicher-Embeddings einem bestimmten lokalen Endpunkt zuweisen:

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

Remote-Embeddings erfordern einen API-Schlüssel. Bedrock verwendet stattdessen die standardmäßige AWS-SDK-Anmeldedatenkette (Instanzrollen, SSO, Zugriffsschlüssel oder einen Bedrock-API-Schlüssel).

| Provider       | Umgebungsvariable                                   | Konfigurationsschlüssel              |
| -------------- | --------------------------------------------------- | ------------------------------------ |
| Bedrock        | AWS-Anmeldedatenkette oder `AWS_BEARER_TOKEN_BEDROCK` | Kein API-Schlüssel erforderlich    |
| DeepInfra      | `DEEPINFRA_API_KEY`                                 | `models.providers.deepinfra.apiKey`  |
| Gemini         | `GEMINI_API_KEY`                                    | `models.providers.google.apiKey`     |
| GitHub Copilot | `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, `GITHUB_TOKEN`  | Authentifizierungsprofil über Geräteanmeldung |
| Mistral        | `MISTRAL_API_KEY`                                   | `models.providers.mistral.apiKey`    |
| Ollama         | `OLLAMA_API_KEY` (Platzhalter)                      | --                                   |
| OpenAI         | `OPENAI_API_KEY`                                    | `models.providers.openai.apiKey`     |
| Voyage         | `VOYAGE_API_KEY`                                    | `models.providers.voyage.apiKey`     |

<Note>
Codex OAuth gilt nur für Chats/Vervollständigungen und erfüllt keine Embedding-Anfragen.
</Note>

---

## Konfiguration des Remote-Endpunkts

Verwenden Sie `provider: "openai-compatible"` für einen generischen OpenAI-kompatiblen
`/v1/embeddings`-Server, der die globalen OpenAI-Chat-Anmeldedaten nicht übernehmen soll.

<ParamField path="remote.baseUrl" type="string">
  Benutzerdefinierte API-Basis-URL.
</ParamField>
<ParamField path="remote.apiKey" type="string">
  Überschreibt den API-Schlüssel.
</ParamField>
<ParamField path="remote.headers" type="object">
  Zusätzliche HTTP-Header (werden mit den Provider-Standardeinstellungen zusammengeführt).
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
    | Schlüssel              | Typ      | Standard               | Beschreibung                                      |
    | ---------------------- | -------- | ---------------------- | ------------------------------------------------- |
    | `model`                | `string` | `gemini-embedding-001` | Unterstützt auch `gemini-embedding-2-preview`     |
    | `outputDimensionality` | `number` | `3072`                 | Für Embedding 2: 768, 1536 oder 3072              |

    <Warning>
    Eine Änderung des Modells oder von `outputDimensionality` verändert die Indexidentität. OpenClaw
    pausiert die Vektorsuche, bis Sie den Speicherindex ausdrücklich neu erstellen.
    </Warning>

  </Accordion>
  <Accordion title="Eingabetypen für OpenAI-kompatible Endpunkte">
    OpenAI-kompatible Embedding-Endpunkte können providerspezifische `input_type`-Anfragefelder aktivieren. Dies ist für asymmetrische Embedding-Modelle nützlich, die unterschiedliche Kennzeichnungen für Abfrage- und Dokument-Embeddings erfordern.

    | Schlüssel           | Typ      | Standard         | Beschreibung                                                     |
    | ------------------- | -------- | ---------------- | ---------------------------------------------------------------- |
    | `inputType`         | `string` | nicht festgelegt | Gemeinsamer `input_type` für Abfrage- und Dokument-Embeddings    |
    | `queryInputType`    | `string` | nicht festgelegt | `input_type` zur Abfragezeit; überschreibt `inputType`           |
    | `documentInputType` | `string` | nicht festgelegt | `input_type` für Index/Dokument; überschreibt `inputType`        |

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

    Änderungen dieser Werte beeinflussen die Identität des Embedding-Caches für die Batch-Indexierung des Providers. Wenn das vorgelagerte Modell die Kennzeichnungen unterschiedlich behandelt, sollten Sie anschließend den Speicher neu indizieren.

  </Accordion>
  <Accordion title="Bedrock">
    ### Bedrock-Embedding-Konfiguration

    Bedrock verwendet die standardmäßige AWS-SDK-Anmeldedatenkette sowie ein von OpenClaw geprüftes Bearer-Token, sodass keine API-Schlüssel in der Konfiguration gespeichert werden. Wenn OpenClaw auf EC2 mit einer für Bedrock aktivierten Instanzrolle ausgeführt wird, legen Sie lediglich Provider und Modell fest:

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

    | Schlüssel              | Typ      | Standard                       | Beschreibung                            |
    | ---------------------- | -------- | ------------------------------ | --------------------------------------- |
    | `model`                | `string` | `amazon.titan-embed-text-v2:0` | Beliebige Bedrock-Embedding-Modell-ID   |
    | `outputDimensionality` | `number` | Modellstandard                 | Für Titan V2: 256, 512 oder 1024        |

    **Unterstützte Modelle** (mit Erkennung der Modellfamilie und Dimensionsstandards):

    | Modell-ID                                   | Provider   | Standarddimensionen | Konfigurierbare Dimensionen |
    | ------------------------------------------- | ---------- | ------------------- | --------------------------- |
    | `amazon.titan-embed-text-v2:0`             | Amazon     | 1024                | 256, 512, 1024              |
    | `amazon.titan-embed-text-v1`               | Amazon     | 1536                | --                           |
    | `amazon.titan-embed-g1-text-02`            | Amazon     | 1536                | --                           |
    | `amazon.titan-embed-image-v1`              | Amazon     | 1024                | --                           |
    | `amazon.nova-2-multimodal-embeddings-v1:0` | Amazon     | 1024                | 256, 384, 1024, 3072        |
    | `cohere.embed-english-v3`                  | Cohere     | 1024                | --                           |
    | `cohere.embed-multilingual-v3`             | Cohere     | 1024                | --                           |
    | `cohere.embed-v4:0`                        | Cohere     | 1536                | 256, 384, 512, 768, 1024, 1536 |
    | `twelvelabs.marengo-embed-3-0-v1:0`        | TwelveLabs | 512                 | --                           |
    | `twelvelabs.marengo-embed-2-7-v1:0`        | TwelveLabs | 1024                | --                           |

    Varianten mit Durchsatzsuffix (z. B. `amazon.titan-embed-text-v1:2:8k`) und Inferenzprofil-IDs mit Regionspräfix (z. B. `us.amazon.titan-embed-text-v2:0`) übernehmen die Konfiguration des Basismodells.

    **Region:** wird in dieser Reihenfolge aufgelöst: die Überschreibung `memorySearch.remote.baseUrl`, die Konfiguration `models.providers.amazon-bedrock.baseUrl`, `AWS_REGION`, `AWS_DEFAULT_REGION` und anschließend der Standardwert `us-east-1`.

    **Authentifizierung:** OpenClaw prüft zuerst auf `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY` oder `AWS_BEARER_TOKEN_BEDROCK` und greift anschließend auf die standardmäßige Anmeldedaten-Provider-Kette des AWS SDK zurück:

    1. Umgebungsvariablen (`AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`), sofern nicht zusätzlich `AWS_PROFILE` festgelegt ist
    2. SSO (nur wenn SSO-Felder konfiguriert sind)
    3. Gemeinsame Anmeldedaten- und Konfigurationsdateien (`fromIni`, einschließlich `AWS_PROFILE`)
    4. Anmeldedatenprozess (`credential_process` in der AWS-Konfigurationsdatei)
    5. Webidentitätstoken-Anmeldedaten
    6. Anmeldedaten aus ECS- oder EC2-Instanzmetadaten

    **IAM-Berechtigungen:** Die IAM-Rolle oder der IAM-Benutzer benötigt:

    ```json
    {
      "Effect": "Allow",
      "Action": "bedrock:InvokeModel",
      "Resource": "*"
    }
    ```

    Beschränken Sie für minimale Berechtigungen `InvokeModel` auf das jeweilige Modell:

    ```text
    arn:aws:bedrock:*::foundation-model/amazon.titan-embed-text-v2:0
    ```

  </Accordion>
  <Accordion title="Lokal (GGUF + llama.cpp)">
    | Schlüssel             | Typ                | Standard                  | Beschreibung                                                                                                                                                                                                                                                                                                                                         |
    | --------------------- | ------------------ | ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
    | `local.modelPath`     | `string`           | automatisch heruntergeladen | Pfad zur GGUF-Modelldatei                                                                                                                                                                                                                                                                                                                            |
    | `local.modelCacheDir` | `string`           | node-llama-cpp-Standard   | Cache-Verzeichnis für heruntergeladene Modelle                                                                                                                                                                                                                                                                                                       |
    | `local.contextSize`   | `number \| "auto"` | `4096`                    | Größe des Kontextfensters für den Einbettungskontext. 4096 deckt typische Abschnitte (128–512 Token) ab und begrenzt zugleich den VRAM außerhalb der Modellgewichte. Reduzieren Sie den Wert auf eingeschränkten Hosts auf 1024–2048. `"auto"` verwendet das beim Training festgelegte Maximum des Modells – für Modelle ab 8B nicht empfohlen (Qwen3-Embedding-8B: Bis zu 40 960 Token können den VRAM-Bedarf auf ca. 32 GB erhöhen). |

    Installieren Sie zuerst den offiziellen llama.cpp-Provider: `openclaw plugins install @openclaw/llama-cpp-provider`.
    Standardmodell: `embeddinggemma-300m-qat-Q8_0.gguf` (ca. 0,6 GB, wird automatisch heruntergeladen). Quellcode-Checkouts erfordern weiterhin die Genehmigung des nativen Builds: `pnpm approve-builds` und anschließend `pnpm rebuild node-llama-cpp`.

    Verwenden Sie die eigenständige CLI, um denselben Provider-Pfad zu überprüfen, den der Gateway verwendet:

    ```bash
    openclaw memory status --deep --agent main
    openclaw memory index --force --agent main
    ```

    Numerische Werte für `local.contextSize` fließen außerdem in die automatische Platzierung der GPU-Schichten durch node-llama-cpp ein, sodass die Modellgewichte und der angeforderte Einbettungskontext gemeinsam in den Speicher passen. Nachdem die Laufzeit das Modell geladen hat, meldet `openclaw memory status --deep` die zuletzt bekannten Angaben zu llama.cpp-Backend, Gerät, Auslagerung, angefordertem Kontext und Speicher mit Zeitstempel; eine passive Statusabfrage lädt kein Modell.

    Legen Sie für lokale GGUF-Einbettungen ausdrücklich `provider: "local"` fest. `hf:`- und HTTP(S)-Modellreferenzen werden für explizite lokale Konfigurationen unterstützt (über die Modellauflösung von node-llama-cpp), ändern jedoch nicht den Standard-Provider.

  </Accordion>
</AccordionGroup>

### Zeitüberschreitung für Inline-Einbettungen

<ParamField path="sync.embeddingBatchTimeoutSeconds" type="number">
  Überschreibt die Zeitüberschreitung für Inline-Einbettungsbatches während der Speicherindizierung.

Wenn kein Wert festgelegt ist, gilt der Standardwert des Providers: 600 Sekunden für lokale bzw. selbst gehostete Provider wie `local`, `ollama` und `lmstudio` sowie 120 Sekunden für gehostete Provider. Erhöhen Sie diesen Wert, wenn lokale CPU-gebundene Einbettungsbatches fehlerfrei funktionieren, aber langsam sind.
</ParamField>

---

## Indizierungsverhalten

Alle Optionen befinden sich unter `memorySearch.sync`, sofern nicht anders angegeben:

| Schlüssel                      | Typ       | Standard | Beschreibung                                                                                 |
| ------------------------------ | --------- | -------- | -------------------------------------------------------------------------------------------- |
| `onSessionStart`               | `boolean` | `true`   | Synchronisiert den Speicherindex beim Start einer Sitzung                                    |
| `onSearch`                     | `boolean` | `true`   | Synchronisiert bei einer Suche verzögert, nachdem Inhaltsänderungen erkannt wurden           |
| `watch`                        | `boolean` | `true`   | Überwacht Speicherdateien (chokidar) und plant bei Änderungen eine Neuindizierung            |
| `watchDebounceMs`              | `number`  | `1500`   | Entprellzeitfenster zum Zusammenfassen schnell aufeinanderfolgender Dateiüberwachungsereignisse |
| `intervalMinutes`              | `number`  | `0`      | Intervall für die regelmäßige Neuindizierung in Minuten (`0` deaktiviert sie)                |
| `sessions.postCompactionForce` | `boolean` | `true`   | Erzwingt nach durch Compaction ausgelösten Transkriptaktualisierungen eine Neuindizierung der Sitzung |

<ParamField path="chunking.tokens" type="number">
  Chunkgröße in Tokens, die beim Aufteilen von Speicherquellen vor dem Embedding verwendet wird (Standard: 400).
</ParamField>
<ParamField path="chunking.overlap" type="number">
  Token-Überlappung zwischen benachbarten Abschnitten, um den Kontext nahe den Aufteilungsgrenzen zu bewahren (Standard: 80).
</ParamField>

<Note>
Eine Änderung von `chunking.tokens` oder `chunking.overlap` verändert die Abschnittsgrenzen und macht die bestehende Indexidentität ungültig (siehe den Warnhinweis unter „Provider-Auswahl“).
</Note>

---

## Konfiguration der hybriden Suche

Alle unter `memorySearch.query`:

| Schlüssel    | Typ      | Standard | Beschreibung                                              |
| ------------ | -------- | -------- | --------------------------------------------------------- |
| `maxResults` | `number` | `6`      | Maximale Anzahl vor der Einfügung zurückgegebener Treffer |
| `minScore`   | `number` | `0.35`   | Mindestwert für die Relevanz, um einen Treffer aufzunehmen |

Und unter `memorySearch.query.hybrid`:

| Schlüssel             | Typ       | Standard | Beschreibung                                   |
| --------------------- | --------- | -------- | ---------------------------------------------- |
| `enabled`             | `boolean` | `true`   | Hybride BM25- und Vektorsuche aktivieren       |
| `vectorWeight`        | `number`  | `0.7`    | Gewichtung für Vektorbewertungen (0–1)         |
| `textWeight`          | `number`  | `0.3`    | Gewichtung für BM25-Bewertungen (0–1)          |
| `candidateMultiplier` | `number`  | `4`      | Multiplikator für die Größe des Kandidatenpools |

<Tabs>
  <Tab title="MMR (Diversität)">
    | Schlüssel     | Typ       | Standard | Beschreibung                                  |
    | ------------- | --------- | -------- | --------------------------------------------- |
    | `mmr.enabled` | `boolean` | `false`  | MMR-Neusortierung aktivieren                  |
    | `mmr.lambda`  | `number`  | `0.7`    | 0 = maximale Diversität, 1 = maximale Relevanz |
  </Tab>
  <Tab title="Zeitlicher Abfall (Aktualität)">
    | Schlüssel                     | Typ       | Standard | Beschreibung                            |
    | ----------------------------- | --------- | -------- | --------------------------------------- |
    | `temporalDecay.enabled`       | `boolean` | `false`  | Aktualitätsverstärkung aktivieren       |
    | `temporalDecay.halfLifeDays`  | `number`  | `30`     | Bewertung halbiert sich alle N Tage     |

    Dauerhaft relevante Dateien (`MEMORY.md`, nicht datierte Dateien in `memory/`) unterliegen keinem zeitlichen Abfall.

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

| Schlüssel    | Typ        | Beschreibung                                   |
| ------------ | ---------- | ---------------------------------------------- |
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

Pfade können absolut oder relativ zum Arbeitsbereich sein. Verzeichnisse werden rekursiv nach `.md`-Dateien durchsucht. Die Behandlung symbolischer Links hängt vom aktiven Backend ab: Die integrierte Engine überspringt symbolische Links, während QMD dem Verhalten des zugrunde liegenden QMD-Scanners folgt.

Verwenden Sie für die agentenspezifische, agentenübergreifende Transkriptsuche `agents.list[].memorySearch.qmd.extraCollections` anstelle von `memory.qmd.paths`. Diese zusätzlichen Sammlungen verwenden dieselbe Struktur `{ path, name, pattern? }`, werden jedoch pro Agent zusammengeführt und können explizite gemeinsame Namen beibehalten, wenn der Pfad außerhalb des aktuellen Arbeitsbereichs liegt. Wenn derselbe aufgelöste Pfad sowohl in `memory.qmd.paths` als auch in `memorySearch.qmd.extraCollections` vorkommt, behält QMD den ersten Eintrag bei und überspringt das Duplikat.

---

## Multimodaler Speicher (Gemini)

Indizieren Sie Bilder und Audiodateien zusammen mit Markdown mithilfe von Gemini Embedding 2:

| Schlüssel                  | Typ        | Standard   | Beschreibung                                      |
| -------------------------- | ---------- | ---------- | ------------------------------------------------- |
| `multimodal.enabled`       | `boolean`  | `false`    | Multimodale Indizierung aktivieren                |
| `multimodal.modalities`    | `string[]` | --         | `["image"]`, `["audio"]` oder `["all"]`           |
| `multimodal.maxFileBytes`  | `number`   | `10485760` | Maximale Dateigröße für die Indizierung (10 MiB)  |

<Note>
Gilt nur für Dateien in `extraPaths`. Die standardmäßigen Speicherstammverzeichnisse bleiben auf Markdown beschränkt. Erfordert `gemini-embedding-2-preview`. `fallback` muss `"none"` sein.
</Note>

Unterstützte Formate: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.heic`, `.heif` (Bilder); `.mp3`, `.wav`, `.ogg`, `.opus`, `.m4a`, `.aac`, `.flac` (Audio).

---

## Embedding-Cache

| Schlüssel          | Typ       | Standardwert | Beschreibung                                |
| ------------------ | --------- | ------------ | ------------------------------------------- |
| `cache.enabled`    | `boolean` | `true`       | Chunk-Embeddings in SQLite zwischenspeichern |
| `cache.maxEntries` | `number`  | nicht gesetzt | Unverbindliche Obergrenze für zwischengespeicherte Embeddings |

Verhindert, dass unveränderter Text bei einer Neuindizierung oder bei Transkriptaktualisierungen erneut eingebettet wird. Lassen Sie `maxEntries` für einen unbegrenzten Cache nicht gesetzt; legen Sie einen Wert fest, wenn die Begrenzung des Speicherplatzwachstums wichtiger als die maximale Neuindizierungsgeschwindigkeit ist. Wenn ein Wert festgelegt ist, werden zuerst die ältesten Einträge (nach dem Zeitpunkt der letzten Aktualisierung) entfernt, sobald der Cache den Grenzwert überschreitet.

---

## Batch-Indizierung

| Schlüssel                     | Typ       | Standardwert | Beschreibung                    |
| ----------------------------- | --------- | ------------ | ------------------------------- |
| `remote.nonBatchConcurrency`  | `number`  | `4`          | Parallele Inline-Embeddings     |
| `remote.batch.enabled`        | `boolean` | `false`      | Batch-Embedding-API aktivieren  |
| `remote.batch.concurrency`    | `number`  | `2`          | Parallele Batch-Aufträge        |
| `remote.batch.wait`           | `boolean` | `true`       | Auf Batch-Abschluss warten      |
| `remote.batch.pollIntervalMs` | `number`  | `2000`       | Abfrageintervall                |
| `remote.batch.timeoutMinutes` | `number`  | `60`         | Batch-Zeitüberschreitung        |

Verfügbar für `gemini`, `openai` und `voyage`. OpenAI Batch ist bei umfangreichen nachträglichen Befüllungen üblicherweise am schnellsten und kostengünstigsten.

`remote.nonBatchConcurrency` steuert Inline-Embedding-Aufrufe, die von lokalen bzw. selbst gehosteten Providern und gehosteten Providern verwendet werden, wenn die Batch-APIs des Providers nicht aktiv sind. Ollama verwendet für die Indizierung ohne Batch standardmäßig `1`, um kleinere lokale Hosts nicht zu überlasten; legen Sie auf leistungsfähigeren Systemen einen höheren Wert fest.

Dies ist unabhängig von `sync.embeddingBatchTimeoutSeconds`, das die Zeitüberschreitung für Inline-Embedding-Aufrufe steuert.

---

## Sitzungsspeichersuche (experimentell)

Indizieren Sie Sitzungstranskripte und stellen Sie sie über `memory_search` bereit:

| Schlüssel                     | Typ        | Standardwert | Beschreibung                                      |
| ----------------------------- | ---------- | ------------ | ------------------------------------------------- |
| `experimental.sessionMemory`  | `boolean`  | `false`      | Sitzungsindizierung aktivieren                    |
| `sources`                     | `string[]` | `["memory"]` | `"sessions"` hinzufügen, um Transkripte einzubeziehen |
| `sync.sessions.deltaBytes`    | `number`   | `100000`     | Byte-Schwellenwert für die Neuindizierung         |
| `sync.sessions.deltaMessages` | `number`   | `50`         | Nachrichtenschwellenwert für die Neuindizierung   |

<Warning>
Die Sitzungsindizierung muss ausdrücklich aktiviert werden und wird asynchron ausgeführt. Ergebnisse können geringfügig veraltet sein. Sitzungsprotokolle befinden sich auf dem Datenträger; betrachten Sie daher den Dateisystemzugriff als Vertrauensgrenze.
</Warning>

Treffer aus Sitzungstranskripten unterliegen ebenfalls
[`tools.sessions.visibility`](/de/gateway/config-tools#toolssessions). Die standardmäßige
Sichtbarkeit `tree` stellt nur die aktuelle Sitzung und die von ihr gestarteten Sitzungen bereit. Um
aus einer anderen Sitzung, beispielsweise einer Direktnachricht, auf eine nicht zusammenhängende, demselben Agenten zugeordnete und vom Gateway gestartete Sitzung
zuzugreifen, erweitern Sie die Sichtbarkeit bewusst auf `agent` (oder nur dann auf `all`,
wenn auch ein agentenübergreifender Zugriff erforderlich ist und die Richtlinie für die Kommunikation zwischen Agenten dies zulässt).

In den folgenden Beispielen werden diese Einstellungen unter `agents.defaults` eingeordnet. Sie können
entsprechende `memorySearch`-Einstellungen auch in einer agentenspezifischen Überschreibung
anwenden, wenn nur ein Agent Sitzungstranskripte indizieren und durchsuchen soll.

Für den Abruf vom Gateway zu Direktnachrichten innerhalb desselben Agenten:

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
`sources: ["sessions"]` allein keine Transkripte nach QMD. Legen Sie zusätzlich
`memory.qmd.sessions.enabled: true` fest.

---

  ## SQLite-Vektorbeschleunigung (sqlite-vec)

  | Schlüssel                    | Typ       | Standardwert | Beschreibung                          |
  | ---------------------------- | --------- | ------------ | ------------------------------------- |
  | `store.vector.enabled`       | `boolean` | `true`       | sqlite-vec für Vektorabfragen verwenden |
  | `store.vector.extensionPath` | `string`  | gebündelt    | sqlite-vec-Pfad überschreiben         |

  Wenn sqlite-vec nicht verfügbar ist, greift OpenClaw automatisch auf die prozessinterne Kosinusähnlichkeit zurück.

  ---

  ## Indexspeicherung

  Integrierte Speicherindizes befinden sich in der OpenClaw-SQLite-Datenbank des jeweiligen Agenten unter
  `agents/<agentId>/agent/openclaw-agent.sqlite`.

  | Schlüssel             | Typ      | Standardwert | Beschreibung                                |
  | --------------------- | -------- | ------------ | ------------------------------------------- |
  | `store.fts.tokenizer` | `string` | `unicode61`  | FTS5-Tokenizer (`unicode61` oder `trigram`) |

  ---

  ## QMD-Backend-Konfiguration

  Legen Sie zum Aktivieren `memory.backend = "qmd"` fest. Alle QMD-Einstellungen befinden sich unter `memory.qmd`:

  | Schlüssel                | Typ       | Standardwert | Beschreibung                                                                                                     |
  | ------------------------ | --------- | ------------ | ---------------------------------------------------------------------------------------------------------------- |
  | `command`                | `string`  | `qmd`        | Pfad zur ausführbaren QMD-Datei; legen Sie einen absoluten Pfad fest, wenn sich der Dienst-`PATH` von Ihrer Shell unterscheidet |
  | `searchMode`             | `string`  | `search`     | Suchbefehl: `search`, `vsearch`, `query`                                                                         |
  | `rerank`                 | `boolean` | --           | Mit `searchMode: "query"` und QMD 2.1+ auf `false` setzen, um das QMD-Reranking zu überspringen                   |
  | `includeDefaultMemory`   | `boolean` | `true`       | `MEMORY.md` und `memory/**/*.md` automatisch indizieren                                                          |
  | `paths[]`                | `array`   | --           | Zusätzliche Pfade: `{ name, path, pattern? }`                                                                    |
  | `sessions.enabled`       | `boolean` | `false`      | Sitzungstranskripte nach QMD exportieren                                                                         |
  | `sessions.retentionDays` | `number`  | --           | Aufbewahrungsdauer für Transkripte                                                                                |
  | `sessions.exportDir`     | `string`  | --           | Exportverzeichnis                                                                                                 |

  `searchMode: "search"` verwendet ausschließlich lexikalische/BM25-Suche. OpenClaw führt für diesen Modus keine Prüfungen der semantischen Vektorbereitschaft und keine Pflege der QMD-Embeddings durch, auch nicht während `memory status --deep`; `vsearch` und `query` erfordern weiterhin die Vektorbereitschaft und Embeddings von QMD.

  `rerank: false` ändert nur den QMD-Modus `query` und erfordert QMD 2.1 oder neuer. Im direkten CLI-Modus übergibt OpenClaw `--no-rerank`; im MCP-Modus über mcporter übergibt es `rerank: false` an das vereinheitlichte Abfragewerkzeug von QMD. Lassen Sie die Einstellung unausgefüllt, um das standardmäßige Reranking-Verhalten für QMD-Abfragen zu verwenden.

  OpenClaw bevorzugt die aktuellen QMD-Formate für Sammlungen und MCP-Abfragen, unterstützt jedoch ältere QMD-Versionen weiterhin, indem bei Bedarf kompatible Flags für Sammlungsmuster und ältere MCP-Werkzeugnamen ausprobiert werden. Wenn QMD die Unterstützung mehrerer Sammlungsfilter meldet, werden Sammlungen derselben Quelle mit einem einzigen QMD-Prozess durchsucht; ältere QMD-Builds verwenden weiterhin den Kompatibilitätspfad pro Sammlung. „Dieselbe Quelle“ bedeutet, dass dauerhafte Speichersammlungen (Standardspeicherdateien sowie benutzerdefinierte Pfade) zusammen gruppiert werden, während Sammlungen von Sitzungstranskripten eine separate Gruppe bleiben, sodass die Quellendiversifizierung weiterhin beide Eingaben umfasst.

  <Note>
  QMD-Modellüberschreibungen werden auf der QMD-Seite vorgenommen, nicht in der OpenClaw-Konfiguration. Wenn Sie die Modelle von QMD global überschreiben müssen, legen Sie Umgebungsvariablen wie `QMD_EMBED_MODEL`, `QMD_RERANK_MODEL` und `QMD_GENERATE_MODEL` in der Gateway-Laufzeitumgebung fest.
  </Note>

  ### mcporter-Integration

  Alle Einstellungen befinden sich unter `memory.qmd.mcporter`. QMD-Suchen werden über einen langlebigen `mcporter`-MCP-Daemon geleitet, anstatt für jede Abfrage `qmd` zu starten. Dies reduziert den Kaltstartaufwand bei größeren Modellen.

  | Schlüssel     | Typ       | Standardwert | Beschreibung                                                                                      |
  | ------------- | --------- | ------------ | ------------------------------------------------------------------------------------------------- |
  | `enabled`     | `boolean` | `false`      | QMD-Aufrufe über mcporter leiten, anstatt für jede Anfrage `qmd` zu starten                       |
  | `serverName`  | `string`  | `qmd`        | Name des mcporter-Servers, der `qmd mcp` mit `lifecycle: keep-alive` ausführt                     |
  | `startDaemon` | `boolean` | `true`       | Den mcporter-Daemon automatisch starten, wenn `enabled` auf `true` gesetzt ist                    |

  Erfordert eine installierte und über PATH verfügbare Version von `mcporter` sowie einen konfigurierten mcporter-Server, der `qmd mcp` ausführt. Lassen Sie diese Option für einfachere lokale Einrichtungen deaktiviert, bei denen die Kosten für das Starten eines Prozesses pro Abfrage akzeptabel sind.

  <AccordionGroup>
  <Accordion title="Aktualisierungszeitplan">
    | Schlüssel                   | Typ       | Standardwert | Beschreibung                                                                                           |
    | --------------------------- | --------- | ------------ | ------------------------------------------------------------------------------------------------------ |
    | `update.interval`           | `string`  | `5m`         | Aktualisierungsintervall                                                                               |
    | `update.debounceMs`         | `number`  | `15000`      | Dateiänderungen entprellen                                                                             |
    | `update.onBoot`             | `boolean` | `true`       | Beim Öffnen des langlebigen QMD-Managers aktualisieren; auf `false` setzen, um die sofortige Startaktualisierung zu überspringen |
    | `update.startup`            | `string`  | `off`        | Optionale QMD-Initialisierung beim Gateway-Start: `off`, `idle` oder `immediate`                       |
    | `update.startupDelayMs`     | `number`  | `120000`     | Verzögerung vor der Aktualisierung mit `startup: "idle"`                                               |
    | `update.waitForBootSync`    | `boolean` | `false`      | Öffnen des Managers blockieren, bis seine erste Aktualisierung abgeschlossen ist                       |
    | `update.embedInterval`      | `string`  | `60m`        | Separates Intervall für Embeddings                                                                     |
    | `update.commandTimeoutMs`   | `number`  | `30000`      | Zeitüberschreitung für QMD-Wartungsbefehle (Sammlungen auflisten/hinzufügen)                           |
    | `update.updateTimeoutMs`    | `number`  | `120000`     | Zeitüberschreitung für jeden `qmd update`-Durchlauf                                                     |
    | `update.embedTimeoutMs`     | `number`  | `120000`     | Zeitüberschreitung für jeden `qmd embed`-Durchlauf                                                      |
  </Accordion>
  <Accordion title="Grenzwerte">
    | Schlüssel                   | Typ      | Standardwert | Beschreibung                              |
    | --------------------------- | -------- | ------------ | ----------------------------------------- |
    | `limits.maxResults`         | `number` | `4`          | Maximale Anzahl von Suchergebnissen       |
    | `limits.maxSnippetChars`    | `number` | `450`        | Länge des Textausschnitts begrenzen       |
    | `limits.maxInjectedChars`   | `number` | `2200`       | Gesamtzahl eingefügter Zeichen begrenzen  |
    | `limits.timeoutMs`          | `number` | `4000`       | Zeitüberschreitung der Suche              |
  </Accordion>
  <Accordion title="Geltungsbereich">
    Steuert, welche Sitzungen QMD-Suchergebnisse empfangen können. Verwendet dasselbe Schema wie [`session.sendPolicy`](/de/gateway/config-agents#session):

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

    Der mitgelieferte Standard erlaubt nur Direktnachrichten bzw. direkte Chats und verweigert Gruppen sowie andere Kanaltypen. `match.keyPrefix` gleicht den normalisierten Sitzungsschlüssel ab; `match.rawKeyPrefix` gleicht den Rohschlüssel einschließlich `agent:<id>:` ab.

  </Accordion>
  <Accordion title="Quellenangaben">
    `memory.citations` gilt für alle Backends:

    | Wert             | Verhalten                                                        |
    | ---------------- | ---------------------------------------------------------------- |
    | `auto` (Standard) | Fußzeile `Source: <path#line>` in Ausschnitte aufnehmen          |
    | `on`             | Fußzeile immer aufnehmen                                         |
    | `off`            | Fußzeile weglassen (Pfad wird intern weiterhin an den Agenten übergeben) |

  </Accordion>
</AccordionGroup>

Wenn die QMD-Initialisierung beim Gateway-Start aktiviert ist, startet OpenClaw QMD nur für geeignete Agenten. Wenn `update.onBoot` auf `true` gesetzt und keine intervallbasierte Aktualisierungs- oder Einbettungswartung konfiguriert ist, verwendet der Startvorgang einen einmaligen Manager für die Aktualisierung beim Start und schließt ihn anschließend. Wenn ein Aktualisierungs- oder Einbettungsintervall konfiguriert ist, öffnet der Startvorgang den langlebigen QMD-Manager, damit dieser den Watcher und die Intervall-Timer verwalten kann. `update.onBoot: false` überspringt nur die unmittelbare Aktualisierung beim Start.

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

Dreaming wird als ein geplanter Durchlauf ausgeführt und verwendet interne Light-/Deep-/REM-Phasen als Implementierungsdetail.

Informationen zum konzeptionellen Verhalten und zu Slash-Befehlen finden Sie unter [Dreaming](/de/concepts/dreaming).

### Benutzereinstellungen

| Schlüssel                              | Typ       | Standardwert   | Beschreibung                                                                                                                                    |
| -------------------------------------- | --------- | -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`                              | `boolean` | `false`        | Dreaming vollständig aktivieren oder deaktivieren                                                                                               |
| `frequency`                            | `string`  | `0 3 * * *`    | Optionaler Cron-Zeitplan für den vollständigen Dreaming-Durchlauf                                                                                |
| `model`                                | `string`  | Standardmodell | Optionale Modellüberschreibung für den Dream-Diary-Subagenten                                                                                    |
| `phases.deep.maxPromotedSnippetTokens` | `number`  | `160`          | Maximale geschätzte Anzahl an Tokens, die aus jedem in `MEMORY.md` übernommenen Kurzzeit-Erinnerungsausschnitt beibehalten wird; Metadaten zur Herkunft bleiben sichtbar |

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
- Dreaming schreibt die menschenlesbare narrative Ausgabe nach `DREAMS.md` (oder in eine vorhandene Datei `dreams.md`).
- `dreaming.model` verwendet die bestehende Vertrauensprüfung des Plugins für Subagenten; setzen Sie `plugins.entries.memory-core.subagent.allowModelOverride: true`, bevor Sie die Option aktivieren.
- Dream Diary versucht es einmal erneut mit dem Standardsitzungsmodell, wenn das konfigurierte Modell nicht verfügbar ist. Fehler bei der Vertrauensprüfung oder Zulassungsliste werden protokolliert und führen nicht zu einem stillen erneuten Versuch.
- Die Richtlinien und Schwellenwerte der Light-/Deep-/REM-Phasen sind internes Verhalten und keine benutzerseitige Konfiguration.

</Note>

## Verwandte Themen

- [Konfigurationsreferenz](/de/gateway/configuration-reference)
- [Speicherübersicht](/de/concepts/memory)
- [Speichersuche](/de/concepts/memory-search)
