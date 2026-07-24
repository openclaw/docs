---
read_when:
    - Sie möchten Provider für die Speichersuche oder Embedding-Modelle konfigurieren
    - Sie möchten das QMD-Backend einrichten
    - Sie möchten die Hybridsuche, MMR oder den zeitlichen Verfall aktivieren
    - Sie möchten die multimodale Speicherindizierung aktivieren
sidebarTitle: Memory config
summary: Provider für die Speichersuche, Abrufmodi, QMD und multimodale Indizierung
title: Referenz zur Speicherkonfiguration
x-i18n:
    generated_at: "2026-07-24T04:41:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 91f843b1516093c49e18b3d659ab24ea9cb7be32aaaac722205eca8bc3f2ca5b
    source_path: reference/memory-config.md
    workflow: 16
---

Diese Seite listet alle Konfigurationsoptionen für die Speichersuche von OpenClaw auf. Konzeptionelle Übersichten finden Sie unter:

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
    Such-Pipeline und Optimierung.
  </Card>
  <Card title="Active Memory" href="/de/concepts/active-memory">
    Speicher-Sub-Agent für interaktive Sitzungen.
  </Card>
</CardGroup>

Alle gemeinsamen Speichereinstellungen befinden sich unter dem übergeordneten `memory` in `openclaw.json`. Suchstandards verwenden `memory.search`; agentspezifische Suchüberschreibungen verwenden `agents.entries.*.memory.search`.

<Note>
Für den empfohlenen Workflow mit einem persönlichen Agent verwenden Sie
`memory.search.rememberAcrossConversations`. Erweiterte Steuerungen für Zielauswahl,
Modell, Prompt und Latenz von Active Memory befinden sich unter `plugins.entries.active-memory`.

Informationen zu beiden Aktivierungspfaden, zur Transkriptpersistenz und zur
sicheren Einführung finden Sie unter [Active Memory](/de/concepts/active-memory).
</Note>

---

## Gesprächsübergreifend erinnern

| Schlüssel                     | Typ       | Standard                                                   | Beschreibung                                                                                  |
| ----------------------------- | --------- | ---------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `rememberAcrossConversations` | `boolean` | Bei persönlichen Installationen aktiviert; bei konfigurierter DM-Isolierung deaktiviert | Relevanten Kontext aus anderen erkannten privaten Gesprächen dieses Agent verwenden. |

Konfigurieren Sie dies pro Agent, wenn nur ein vertrauenswürdiger persönlicher
Agent den gesprächsübergreifenden Abruf von Transkripten verwenden soll:

```json5
{
  agents: {
    entries: {
      personal: {
        memory: {
          search: {
            rememberAcrossConversations: true,
          },
        },
      },
    },
  },
}
```

Der Wert folgt der normalen Vererbung von `memory.search` mit einer
agentspezifischen Überschreibung. Wenn er nicht festgelegt ist, wird er nur
standardmäßig aktiviert, wenn global `session.dmScope` nicht festgelegt oder
`"main"` ist und keine Bindung eine `session.dmScope`-Überschreibung
enthält. Jede konfigurierte DM-Isolierung deaktiviert ihn standardmäßig. Ein
explizites `true` oder `false` hat immer Vorrang. Die
Aktivierung schließt die Indizierung von Sitzungstranskripten ein und fügt
`sessions` zu den aufgelösten Speicherquellen des Agent hinzu. Mit QMD
wird außerdem der Sitzungsexport dieses Agent aktiviert; für diesen Modus ist
keine separate Einstellung `memory.qmd.sessions.enabled` erforderlich.

Der integrierte Speicher-Provider von OpenClaw unterstützt diesen geschützten
Pfad sowohl mit dem integrierten als auch mit dem QMD-Backend. Alternative
Speicher-Provider können weiterhin ihre eigenen Abruf-Hooks und erweiterten
Active-Memory-Werkzeuge verwenden, diese Einstellung wird jedoch übersprungen,
wenn der aktuelle Provider den geschützten Abruf privater Transkripte nicht
unterstützt. `openclaw doctor` meldet einen nicht unterstützten Provider oder
eine explizite Active-Memory-Liste `toolsAllow`, in der
`memory_search` fehlt.

Die Abrufgrenze ist enger als bei der allgemeinen Sitzungssuche:

- nur erkannte private Gespräche desselben Agent kommen infrage
- das gerade beantwortete Gespräch ist ausgeschlossen
- Gruppen und Kanäle sind als Quellen und Ziele ausgeschlossen
- unbekannte Gesprächsarten werden standardmäßig abgelehnt
- der Abruf in einer Sandbox kann die spezielle gesprächsübergreifende Autorisierung nicht verwenden

Die Einstellung ändert weder `tools.sessions.visibility` noch Sitzungsschlüssel,
Transkriptspeicherung, Zustellungsrouting oder die Berechtigungen von
`sessions_list`, `sessions_history` und `sessions_send`. Active Memory
führt einen begrenzten, schreibgeschützten Abrufdurchlauf aus; ein nicht
verfügbarer oder zeitüberschrittener Abruf blockiert die Antwort nicht.

---

## Provider-Auswahl

| Schlüssel  | Typ       | Standard         | Beschreibung                                                                                                                                                                                                                                                                               |
| ---------- | --------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `enabled`  | `boolean` | `true`           | Speichersuche aktivieren oder deaktivieren                                                                                                                                                                                                                                                  |
| `provider` | `string`  | `"openai"`       | ID eines Embedding-Adapters wie `bedrock`, `deepinfra`, `gemini`, `github-copilot`, `local`, `mistral`, `ollama`, `openai`, `openai-compatible` oder `voyage`; kann auch ein konfigurierter `models.providers.<id>` sein, dessen `api` auf einen Speicher-Embedding-Adapter oder eine OpenAI-kompatible Modell-API verweist |
| `model`    | `string`  | Provider-Standard | Name des Embedding-Modells                                                                                                                                                                                                                                                                 |
| `fallback` | `string`  | `"none"`         | ID des Fallback-Adapters bei Ausfall des primären Adapters                                                                                                                                                                                                                                  |

Wenn `provider` nicht festgelegt ist, verwendet OpenClaw OpenAI-Embeddings.
Legen Sie `provider` explizit fest, um Bedrock, DeepInfra, Gemini,
GitHub Copilot, Mistral, Ollama, Voyage, ein lokales GGUF-Modell oder einen
OpenAI-kompatiblen `/v1/embeddings`-Endpunkt zu verwenden. Veraltete
Konfigurationen, die weiterhin `provider: "auto"` angeben, werden als
`openai` aufgelöst.

<Warning>
Eine Änderung des Embedding-Providers, Modells, der Provider-Einstellungen,
Quellen, des Geltungsbereichs, der Segmentierung oder des Tokenizers kann den
vorhandenen SQLite-Vektorindex inkompatibel machen. OpenClaw pausiert die
Vektorsuche und meldet eine Warnung zur Indexidentität, anstatt automatisch
alles neu einzubetten. Erstellen Sie den Index zum gewünschten Zeitpunkt mit
`openclaw memory status --index --agent <id>` oder
`openclaw memory index --force --agent <id>` neu.
</Warning>

Wenn `provider` nicht festgelegt ist, das veraltete
`provider: "auto"` vorhanden ist oder `provider: "none"` absichtlich den
reinen FTS-Modus auswählt, kann der Speicherabruf weiterhin die lexikalische
FTS-Rangfolge verwenden, wenn Embeddings nicht verfügbar sind.

Explizit angegebene nicht lokale Provider werden standardmäßig abgelehnt. Wenn
Sie `memory.search.provider` auf einen konkreten, remote gestützten Provider wie
Bedrock, DeepInfra, Gemini, GitHub Copilot, LM Studio, Mistral, Ollama, OpenAI,
Voyage oder einen OpenAI-kompatiblen benutzerdefinierten Provider setzen und
dieser Provider zur Laufzeit nicht verfügbar ist, gibt `memory_search` ein
Nichtverfügbarkeitsergebnis zurück, anstatt stillschweigend ausschließlich den
FTS-Abruf zu verwenden. Korrigieren Sie die Provider-/Authentifizierungskonfiguration,
wechseln Sie zu einem erreichbaren Provider oder legen Sie `provider: "none"`
fest, wenn Sie bewusst ausschließlich den FTS-Abruf verwenden möchten.

### Benutzerdefinierte Provider-IDs

`memory.search.provider` kann auf einen benutzerdefinierten `models.providers.<id>`-Eintrag
für speicherspezifische Provider-Adapter wie `ollama` oder für
OpenAI-kompatible Modell-APIs wie `openai-responses` / `openai-completions`
verweisen. OpenClaw löst den `api`-Eigentümer dieses Providers für
den Embedding-Adapter auf und behält gleichzeitig die benutzerdefinierte
Provider-ID für die Verarbeitung von Endpunkt, Authentifizierung und
Modellpräfix bei. Dadurch können Multi-GPU- oder Multi-Host-Konfigurationen
Speicher-Embeddings einem bestimmten lokalen Endpunkt zuweisen:

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
  memory: {
    search: {
      provider: "ollama-5080",
      model: "qwen3-embedding:0.6b",
    },
  },
}
```

### Auflösung des API-Schlüssels

Remote-Embeddings erfordern einen API-Schlüssel. Bedrock verwendet stattdessen
die standardmäßige AWS-SDK-Anmeldedatenkette (Instanzrollen, SSO,
Zugriffsschlüssel oder einen Bedrock-API-Schlüssel).

| Provider       | Umgebungsvariable                                  | Konfigurationsschlüssel              |
| -------------- | --------------------------------------------------- | ----------------------------------- |
| Bedrock        | AWS-Anmeldedatenkette oder `AWS_BEARER_TOKEN_BEDROCK` | Kein API-Schlüssel erforderlich     |
| DeepInfra      | `DEEPINFRA_API_KEY`                                 | `models.providers.deepinfra.apiKey` |
| Gemini         | `GEMINI_API_KEY`                                    | `models.providers.google.apiKey`    |
| GitHub Copilot | `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, `GITHUB_TOKEN`  | Authentifizierungsprofil über Geräteanmeldung |
| Mistral        | `MISTRAL_API_KEY`                                   | `models.providers.mistral.apiKey`   |
| Ollama         | `OLLAMA_API_KEY` (Platzhalter)                      | --                                  |
| OpenAI         | `OPENAI_API_KEY`                                    | `models.providers.openai.apiKey`    |
| Voyage         | `VOYAGE_API_KEY`                                    | `models.providers.voyage.apiKey`    |

<Note>
Codex OAuth deckt nur Chat/Vervollständigungen ab und erfüllt keine
Embedding-Anfragen.
</Note>

---

## Konfiguration des Remote-Endpunkts

Verwenden Sie `provider: "openai-compatible"` für einen generischen OpenAI-kompatiblen
`/v1/embeddings`-Server, der die globalen OpenAI-Chat-Anmeldedaten nicht
übernehmen soll.

<ParamField path="remote.baseUrl" type="string">
  Benutzerdefinierte API-Basis-URL.
</ParamField>
<ParamField path="remote.apiKey" type="string">
  API-Schlüssel überschreiben.
</ParamField>
<ParamField path="remote.headers" type="object">
  Zusätzliche HTTP-Header (mit den Provider-Standards zusammengeführt).
</ParamField>

```json5
{
  memory: {
    search: {
      provider: "openai-compatible",
      model: "text-embedding-3-small",
      remote: {
        baseUrl: "https://api.example.com/v1/",
        apiKey: "YOUR_KEY",
      },
    },
  },
}
```

---

## Providerspezifische Konfiguration

<AccordionGroup>
  <Accordion title="Gemini">
    | Schlüssel              | Typ      | Standard               | Beschreibung                               |
    | ---------------------- | -------- | ---------------------- | ------------------------------------------ |
    | `model`                | `string` | `gemini-embedding-001` | Unterstützt außerdem `gemini-embedding-2-preview` |
    | `outputDimensionality` | `number` | `3072`                 | Für Embedding 2: 768, 1536 oder 3072       |

    <Warning>
    Eine Änderung des Modells oder von `outputDimensionality` ändert die
    Indexidentität. OpenClaw pausiert die Vektorsuche, bis Sie den
    Speicherindex explizit neu erstellen.
    </Warning>

  </Accordion>
  <Accordion title="OpenAI-kompatible Eingabetypen">
    OpenAI-kompatible Embedding-Endpunkte können providerspezifische
    `input_type`-Anfragefelder aktivieren. Dies ist für asymmetrische
    Embedding-Modelle nützlich, die unterschiedliche Bezeichnungen für
    Abfrage- und Dokument-Embeddings erfordern.

    | Schlüssel           | Typ      | Standard       | Beschreibung                                                        |
    | ------------------- | -------- | -------------- | ------------------------------------------------------------------- |
    | `inputType`         | `string` | nicht festgelegt | Gemeinsames `input_type` für Abfrage- und Dokument-Embeddings |
    | `queryInputType`    | `string` | nicht festgelegt | `input_type` zur Abfragezeit; überschreibt `inputType` |
    | `documentInputType` | `string` | nicht festgelegt | Index-/Dokument-`input_type`; überschreibt `inputType` |

    ```json5
    {
      memory: {
        search: {
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
    }
    ```

    Änderungen dieser Werte wirken sich auf die Identität des Embedding-Caches für die Batch-Indexierung des Providers aus. Wenn das Upstream-Modell die Bezeichnungen unterschiedlich behandelt, sollte anschließend der Speicher neu indexiert werden.

  </Accordion>
  <Accordion title="Bedrock">
    ### Bedrock-Embedding-Konfiguration

    Bedrock verwendet die Standard-Anmeldedatenkette des AWS SDK sowie ein von OpenClaw geprüftes Bearer-Token, sodass keine API-Schlüssel in der Konfiguration gespeichert werden. Wenn OpenClaw auf EC2 mit einer für Bedrock aktivierten Instanzrolle ausgeführt wird, legen Sie lediglich Provider und Modell fest:

    ```json5
    {
      memory: {
        search: {
          provider: "bedrock",
          model: "amazon.titan-embed-text-v2:0",
        },
      },
    }
    ```

    | Schlüssel              | Typ      | Standard                        | Beschreibung                        |
    | ---------------------- | -------- | ------------------------------- | ----------------------------------- |
    | `model`                | `string` | `amazon.titan-embed-text-v2:0` | Beliebige Bedrock-Embedding-Modell-ID |
    | `outputDimensionality` | `number` | Modellstandard                  | Für Titan V2: 256, 512 oder 1024    |

    **Unterstützte Modelle** (mit Familienerkennung und Standarddimensionen):

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

    **Region:** wird in dieser Reihenfolge aufgelöst: die Überschreibung `memory.search.remote.baseUrl`, die Konfiguration `models.providers.amazon-bedrock.baseUrl`, `AWS_REGION`, `AWS_DEFAULT_REGION` und anschließend der Standardwert `us-east-1`.

    **Authentifizierung:** OpenClaw prüft zuerst auf `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY` oder `AWS_BEARER_TOKEN_BEDROCK` und greift anschließend auf die standardmäßige Anmeldedaten-Provider-Kette des AWS SDK zurück:

    1. Umgebungsvariablen (`AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`), sofern nicht auch `AWS_PROFILE` festgelegt ist
    2. SSO (nur wenn SSO-Felder konfiguriert sind)
    3. Gemeinsame Anmeldedaten- und Konfigurationsdateien (`fromIni`, einschließlich `AWS_PROFILE`)
    4. Anmeldedatenprozess (`credential_process` in der AWS-Konfigurationsdatei)
    5. Anmeldedaten für Webidentitäts-Token
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
    | Schlüssel             | Typ                | Standard                | Beschreibung                                                                                                                                                                                                                                                                                                                   |
    | --------------------- | ------------------ | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
    | `local.modelPath`     | `string`           | automatisch heruntergeladen | Pfad zur GGUF-Modelldatei                                                                                                                                                                                                                                                                                                     |
    | `local.modelCacheDir` | `string`           | node-llama-cpp-Standard | Cache-Verzeichnis für heruntergeladene Modelle                                                                                                                                                                                                                                                                                |
    | `local.contextSize`   | `number \| "auto"` | `4096`                 | Kontextfenstergröße für den Embedding-Kontext. 4096 deckt typische Abschnitte (128–512 Token) ab und begrenzt zugleich den nicht durch Gewichte belegten VRAM. Reduzieren Sie den Wert auf eingeschränkten Hosts auf 1024–2048. `"auto"` verwendet das trainierte Maximum des Modells – für Modelle ab 8B nicht empfohlen (Qwen3-Embedding-8B: Bis zu 40 960 Token können den VRAM-Bedarf auf ~32 GB erhöhen). |

    Installieren Sie zuerst den offiziellen llama.cpp-Provider: `openclaw plugins install @openclaw/llama-cpp-provider`.
    Standardmodell: `embeddinggemma-300m-qat-Q8_0.gguf` (~0,6 GB, wird automatisch heruntergeladen). Source-Checkouts erfordern weiterhin die Genehmigung des nativen Builds: `pnpm approve-builds` und anschließend `pnpm rebuild node-llama-cpp`.

    Verwenden Sie die eigenständige CLI, um denselben Provider-Pfad zu prüfen, den das Gateway verwendet:

    ```bash
    openclaw memory status --deep --agent main
    openclaw memory index --force --agent main
    ```

    Numerische Werte für `local.contextSize` fließen außerdem in die automatische Platzierung der GPU-Layer durch node-llama-cpp ein, damit die Modellgewichte und der angeforderte Embedding-Kontext gemeinsam Platz finden. `openclaw memory status --deep` meldet das zuletzt bekannte llama.cpp-Backend, Gerät, Offloading, den angeforderten Kontext und mit Zeitstempeln versehene Speicherinformationen, nachdem die Laufzeit das Modell geladen hat; eine passive Statusabfrage lädt kein Modell.

    Legen Sie `provider: "local"` für lokale GGUF-Embeddings explizit fest. `hf:` und HTTP(S)-Modellreferenzen werden für explizite lokale Konfigurationen unterstützt (über die Modellauflösung von node-llama-cpp), ändern jedoch nicht den Standard-Provider.

  </Accordion>
</AccordionGroup>

## Indexierungsverhalten

Speicher-Engines verwalten Synchronisierung, Batch-Verarbeitung, Überwachung und
Indexierungsheuristiken nach der Compaction. OpenClaw hält diese Verhaltensweisen mit
gepflegten Standardwerten aktiviert, anstatt installationsspezifische Zeitsteuerungen bereitzustellen.

## Konfiguration der hybriden Suche

Alle unter `memory.search.query`:

| Schlüssel    | Typ      | Standard | Beschreibung                                             |
| ------------ | -------- | -------- | -------------------------------------------------------- |
| `maxResults` | `number` | `6`     | Maximale Anzahl vor der Einspeisung zurückgegebener Speichertreffer |
| `minScore`   | `number` | `0.35`  | Mindestrelevanzwert für die Aufnahme eines Treffers      |

Die hybride Abfrage bleibt aktiviert; MMR und zeitlicher Verfall bleiben gemäß
der integrierten Engine-Richtlinie deaktiviert.

### Vollständiges Beispiel

```json5
{
  memory: {
    search: {
      query: {
        maxResults: 6,
        minScore: 0.35,
      },
    },
  },
}
```

---

## Zusätzliche Speicherpfade

| Schlüssel    | Typ        | Beschreibung                                      |
| ------------ | ---------- | ------------------------------------------------- |
| `extraPaths` | `string[]` | Zusätzliche zu indexierende Verzeichnisse oder Dateien |

```json5
{
  memory: {
    search: {
      extraPaths: ["../team-docs", "/srv/shared-notes"],
    },
  },
}
```

Pfade können absolut oder relativ zum Workspace sein. Verzeichnisse werden rekursiv nach `.md`-Dateien durchsucht. Die Behandlung symbolischer Links hängt vom aktiven Backend ab: Die integrierte Engine überspringt symbolische Links, während QMD dem Verhalten des zugrunde liegenden QMD-Scanners folgt.

Verwenden Sie für eine agentenspezifische, agentenübergreifende Transkriptsuche `agents.entries.*.memory.search.qmd.extraCollections` anstelle von `memory.qmd.paths`. Diese zusätzlichen Sammlungen folgen derselben `{ path, name, pattern? }`-Struktur, werden jedoch pro Agent zusammengeführt und können explizite gemeinsame Namen beibehalten, wenn der Pfad außerhalb des aktuellen Workspace liegt. Wenn derselbe aufgelöste Pfad sowohl in `memory.qmd.paths` als auch in `memory.search.qmd.extraCollections` vorkommt, behält QMD den ersten Eintrag und überspringt das Duplikat.

---

## Multimodaler Speicher (Gemini)

Indexieren Sie Bilder und Audiodateien neben Markdown mit Gemini Embedding 2:

| Schlüssel                 | Typ        | Standard   | Beschreibung                                  |
| ------------------------- | ---------- | ---------- | --------------------------------------------- |
| `multimodal.enabled`      | `boolean`  | `false`    | Multimodale Indexierung aktivieren            |
| `multimodal.modalities`   | `string[]` | --         | `["image"]`, `["audio"]` oder `["all"]` |
| `multimodal.maxFileBytes` | `number`   | `10485760` | Maximale Dateigröße für die Indexierung (10 MiB) |

<Note>
Gilt nur für Dateien in `extraPaths`. Standardmäßige Speicherwurzeln bleiben auf Markdown beschränkt. Erfordert `gemini-embedding-2-preview`. `fallback` muss `"none"` sein.
</Note>

Unterstützte Formate: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.heic`, `.heif` (Bilder); `.mp3`, `.wav`, `.ogg`, `.opus`, `.m4a`, `.aac`, `.flac` (Audio).

---

## Embedding-Cache

| Schlüssel       | Typ       | Standard | Beschreibung                          |
| --------------- | --------- | -------- | ------------------------------------- |
| `cache.enabled` | `boolean` | `true`  | Abschnitts-Embeddings in SQLite zwischenspeichern |

Verhindert bei einer Neuindexierung oder bei Transkriptaktualisierungen die erneute Einbettung unveränderten Textes.

---

## Batch-Indexierung

| Schlüssel                    | Typ       | Standard | Beschreibung                       |
| ---------------------------- | --------- | -------- | ---------------------------------- |
| `remote.nonBatchConcurrency` | `number`  | `4`     | Parallele Inline-Embeddings        |
| `remote.batch.enabled`       | `boolean` | `false` | Batch-Embedding-API aktivieren     |

Verfügbar für `gemini`, `openai` und `voyage`. OpenAI Batch ist bei großen Nachbefüllungen in der Regel am schnellsten und kostengünstigsten.

Nebenläufigkeit, Abfrageintervalle und Timeout-Verhalten werden vom Provider verwaltet.

---

## Sitzungsspeichersuche

Indexieren Sie Sitzungstranskripte und stellen Sie sie über `memory_search` bereit:

| Schlüssel                     | Typ        | Standard     | Beschreibung                                      |
| ----------------------------- | ---------- | ------------ | ------------------------------------------------- |
| `rememberAcrossConversations` | `boolean`  | `false`      | Privates sitzungsübergreifendes Erinnern zulassen |
| `sources`                     | `string[]` | `["memory"]` | `"sessions"` hinzufügen, um Transkripte einzubeziehen |

<Warning>
Die Sitzungsindizierung ist optional und wird asynchron ausgeführt. Ergebnisse können geringfügig veraltet sein. Sitzungsprotokolle befinden sich auf dem Datenträger; betrachten Sie daher den Dateisystemzugriff als Vertrauensgrenze.
</Warning>

Die gewöhnliche, vom Modell aufgerufene Suche in Sitzungstranskripten folgt
[`tools.sessions.visibility`](/de/gateway/config-tools#toolssessions). Die standardmäßige
Sichtbarkeit `tree` umfasst die aktuelle Sitzung, von ihr gestartete Sitzungen und
über die implizite Gruppenwahrnehmung beobachtete Gruppensitzungen desselben Agenten. Andere,
nicht zugehörige Sitzungen erfordern die Sichtbarkeit `agent` (oder `all` nur, wenn zusätzlich
agentenübergreifender Abruf erforderlich ist und die Agent-zu-Agent-Richtlinie dies zulässt).

`rememberAcrossConversations` erweitert diese Einstellung nicht. Es stellt eine
separate, ausschließlich zur Laufzeit geltende Autorisierung bereit, die während des begrenzten
Active-Memory-Durchlaufs auf private Transkripte desselben Agenten beschränkt ist.

Die folgenden Beispiele platzieren diese Einstellungen unter `memory.search` auf oberster Ebene. Sie können
entsprechende Einstellungen auch in einer agentenspezifischen Überschreibung `memory.search` anwenden, wenn nur ein
Agent Sitzungstranskripte indizieren und durchsuchen soll.

Für den Abruf desselben Agenten vom Gateway zu Direktnachrichten:

<Tabs>
  <Tab title="Integriertes Backend">
    ```json5
    {
      memory: {
        search: {
          experimental: { sessionMemory: true },
          sources: ["memory", "sessions"],
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
      memory: {
        backend: "qmd",
        search: {
          experimental: { sessionMemory: true },
          sources: ["memory", "sessions"],
        },
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

Bei Verwendung von QMD exportiert `sources: ["sessions"]` allein keine Transkripte nach QMD. Legen Sie
zusätzlich `memory.qmd.sessions.enabled: true` fest. Die übergeordnete Einstellung
`rememberAcrossConversations: true` bildet die Ausnahme: Sie impliziert den
erforderlichen QMD-Sitzungsexport für diesen Agenten. Implizite Exporte bleiben privat:
Sie verwenden immer den standardmäßigen internen Exportspeicherort (ein konfiguriertes
`sessions.exportDir` gilt nur für explizite Exporte), werden nur
beim sitzungsübergreifenden Abruf dieses Agenten durchsucht und können von gewöhnlichem `memory_get`
nicht gelesen werden. Explizites
`memory.qmd.sessions.enabled: true` behält sein bestehendes Verhalten bei und macht
exportierte Transkripte zu einem Bestandteil des gewöhnlichen Speicherkorpus.

---

## SQLite-Vektorbeschleunigung (sqlite-vec)

| Schlüssel                    | Typ       | Standardwert | Beschreibung                         |
| ---------------------------- | --------- | ------------ | ------------------------------------ |
| `store.vector.enabled`       | `boolean` | `true`  | sqlite-vec für Vektorabfragen verwenden |
| `store.vector.extensionPath` | `string`  | gebündelt | sqlite-vec-Pfad überschreiben        |

Wenn sqlite-vec nicht verfügbar ist, greift OpenClaw automatisch auf die prozessinterne Kosinusähnlichkeit zurück.

---

## Indexspeicherung

Integrierte Speicherindizes befinden sich in der OpenClaw-SQLite-Datenbank jedes Agenten unter
`agents/<agentId>/agent/openclaw-agent.sqlite`.

| Schlüssel             | Typ      | Standardwert | Beschreibung                                 |
| --------------------- | -------- | ------------ | -------------------------------------------- |
| `store.fts.tokenizer` | `string` | `unicode61` | FTS5-Tokenizer (`unicode61` oder `trigram`) |

---

## QMD-Backend-Konfiguration

Setzen Sie zum Aktivieren `memory.backend = "qmd"`. Alle QMD-Einstellungen befinden sich unter `memory.qmd`:

| Schlüssel                  | Typ       | Standardwert | Beschreibung                                                                         |
| -------------------------- | --------- | ------------ | ------------------------------------------------------------------------------------ |
| `command`                | `string`  | `qmd`    | Pfad zur ausführbaren QMD-Datei; legen Sie einen absoluten Pfad fest, wenn sich der Dienst-`PATH` von Ihrer Shell unterscheidet |
| `searchMode`             | `string`  | `search` | Suchbefehl: `search`, `vsearch`, `query`                                          |
| `rerank`                 | `boolean` | --       | Mit `searchMode: "query"` und QMD 2.1+ auf `false` setzen, um das QMD-Reranking zu überspringen          |
| `includeDefaultMemory`   | `boolean` | `true`   | `MEMORY.md` + `memory/**/*.md` automatisch indizieren                                             |
| `paths[]`                | `array`   | --       | Zusätzliche Pfade: `{ name, path, pattern? }`                                               |
| `sessions.enabled`       | `boolean` | `false`  | Sitzungstranskripte nach QMD exportieren                                                   |
| `sessions.retentionDays` | `number`  | --       | Aufbewahrung von Transkripten                                                                  |
| `sessions.exportDir`     | `string`  | --       | Exportverzeichnis                                                                      |

`searchMode: "search"` verwendet ausschließlich lexikalische/BM25-Suche. OpenClaw führt für diesen Modus keine Bereitschaftsprüfungen semantischer Vektoren und keine QMD-Embedding-Wartung aus, auch nicht während `memory status --deep`; `vsearch` und `query` erfordern weiterhin QMD-Vektorbereitschaft und Embeddings.

`rerank: false` ändert nur den QMD-Modus `query` und erfordert QMD 2.1 oder neuer. Im direkten CLI-Modus übergibt OpenClaw `--no-rerank`; im MCP-Modus über mcporter übergibt es `rerank: false` an das einheitliche Abfragewerkzeug von QMD. Lassen Sie die Einstellung unausgefüllt, um das standardmäßige QMD-Abfrage-Reranking zu verwenden.

OpenClaw bevorzugt die aktuellen QMD-Sammlungs- und MCP-Abfragestrukturen, unterstützt jedoch weiterhin ältere QMD-Versionen, indem es bei Bedarf kompatible Muster-Flags für Sammlungen und ältere MCP-Werkzeugnamen ausprobiert. Wenn QMD die Unterstützung mehrerer Sammlungsfilter angibt, werden Sammlungen derselben Quelle mit einem einzigen QMD-Prozess durchsucht; ältere QMD-Builds verwenden weiterhin den Kompatibilitätspfad pro Sammlung. Dieselbe Quelle bedeutet, dass dauerhafte Speichersammlungen (standardmäßige Speicherdateien plus benutzerdefinierte Pfade) zusammen gruppiert werden, während Sammlungen von Sitzungstranskripten eine separate Gruppe bleiben, damit die Quellendiversifizierung weiterhin beide Eingaben umfasst.

<Note>
QMD-Modellüberschreibungen verbleiben auf der QMD-Seite und nicht in der OpenClaw-Konfiguration. Wenn Sie die QMD-Modelle global überschreiben müssen, legen Sie Umgebungsvariablen wie `QMD_EMBED_MODEL`, `QMD_RERANK_MODEL` und `QMD_GENERATE_MODEL` in der Gateway-Laufzeitumgebung fest.
</Note>

<AccordionGroup>
  <Accordion title="Grenzwerte">
    | Schlüssel                   | Typ      | Standardwert | Beschreibung                |
    | --------------------------- | -------- | ------------ | --------------------------- |
    | `limits.maxResults`       | `number` | `4`     | Maximale Anzahl von Suchergebnissen |
    | `limits.maxSnippetChars`  | `number` | `450`   | Ausschnittlänge begrenzen       |
    | `limits.maxInjectedChars` | `number` | `2200`  | Gesamtzahl eingefügter Zeichen begrenzen |
    | `limits.timeoutMs`        | `number` | `4000`  | Zeitlimit des QMD-Befehls während der QMD-gestützten Suche, einschließlich `memory_search`; Einrichtung, Synchronisierung, integrierter Rückgriff und ergänzende Arbeiten behalten die standardmäßige Werkzeugfrist bei |
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

    Der ausgelieferte Standardwert erlaubt nur Direktnachrichten bzw. direkte Chats und verweigert Gruppen und andere Kanaltypen. `match.keyPrefix` entspricht dem normalisierten Sitzungsschlüssel; `match.rawKeyPrefix` entspricht dem Rohschlüssel einschließlich `agent:<id>:`.

  </Accordion>
  <Accordion title="Quellenangaben">
    `memory.citations` gilt für alle Backends:

    | Wert             | Verhalten                                            |
    | ---------------- | --------------------------------------------------- |
    | `auto` (Standardwert) | `Source: <path#line>`-Fußzeile in Ausschnitte aufnehmen |
    | `on`             | Fußzeile immer aufnehmen                               |
    | `off`            | Fußzeile weglassen (Pfad wird intern weiterhin an den Agenten übergeben) |

  </Accordion>
</AccordionGroup>

QMD wird bei der ersten Speichernutzung verzögert initialisiert; der Adapter verwaltet die Zeitpläne für Aktualisierungen und Embeddings.

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

Dreaming wird unter `plugins.entries.memory-core.config.dreaming` konfiguriert, nicht unter `memory.search`.

Dreaming wird als ein geplanter Durchlauf ausgeführt und verwendet interne Light-/Deep-/REM-Phasen als Implementierungsdetail.

Informationen zum konzeptionellen Verhalten und zu Slash-Befehlen finden Sie unter [Dreaming](/de/concepts/dreaming).

### Benutzereinstellungen

| Schlüssel                              | Typ       | Standardwert   | Beschreibung                                                                                                                      |
| -------------------------------------- | --------- | -------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`                              | `boolean` | `false`       | Dreaming vollständig aktivieren oder deaktivieren                                                                                              |
| `frequency`                            | `string`  | `0 3 * * *`   | Optionaler Cron-Zeitplan für den vollständigen Dreaming-Durchlauf                                                                                |
| `model`                                | `string`  | Standardmodell | Optionale Modellüberschreibung für den Dream-Diary-Unteragenten                                                                                     |
| `phases.deep.maxPromotedSnippetTokens` | `number`  | `160`         | Maximale geschätzte Anzahl von Tokens, die aus jedem in `MEMORY.md` übernommenen Kurzzeitabruf-Ausschnitt beibehalten wird; Herkunftsmetadaten bleiben sichtbar |

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
- Dreaming schreibt menschenlesbare narrative Ausgaben nach `DREAMS.md` (oder in das vorhandene `dreams.md`).
- `dreaming.model` verwendet die bestehende Vertrauensprüfung für Plugin-Unteragenten; legen Sie `plugins.entries.memory-core.subagent.allowModelOverride: true` fest, bevor Sie es aktivieren.
- Dream Diary versucht es einmal mit dem Standardsitzungsmodell erneut, wenn das konfigurierte Modell nicht verfügbar ist. Vertrauens- oder Positivlistenfehler werden protokolliert und führen nicht stillschweigend zu einem erneuten Versuch.
- Die Richtlinie und Schwellenwerte der Light-/Deep-/REM-Phasen sind internes Verhalten und keine benutzerseitige Konfiguration.

</Note>

## Verwandte Themen

- [Konfigurationsreferenz](/de/gateway/configuration-reference)
- [Speicherübersicht](/de/concepts/memory)
- [Speichersuche](/de/concepts/memory-search)
