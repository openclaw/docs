---
read_when:
    - Sie möchten Provider für die Memory-Suche oder Embedding-Modelle konfigurieren
    - Sie möchten das QMD-Backend einrichten
    - Sie möchten Hybrid-Suche, MMR oder zeitlichen Zerfall optimieren
    - Sie möchten multimodale Memory-Indizierung aktivieren
sidebarTitle: Memory config
summary: Alle Konfigurationsoptionen für Memory-Suche, Embedding-Provider, QMD, Hybrid-Suche und multimodale Indizierung
title: Konfigurationsreferenz für Memory
x-i18n:
    generated_at: "2026-04-26T11:38:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 15fd747abc6d0d43cfc869faa0b5e6c1618681ef3b02068207321d60d449a901
    source_path: reference/memory-config.md
    workflow: 15
---

Diese Seite listet alle Konfigurationsoptionen für die OpenClaw-Memory-Suche auf. Konzeptuelle Übersichten finden Sie hier:

<CardGroup cols={2}>
  <Card title="Memory-Übersicht" href="/de/concepts/memory">
    So funktioniert Memory.
  </Card>
  <Card title="Integrierte Engine" href="/de/concepts/memory-builtin">
    Standard-Backend mit SQLite.
  </Card>
  <Card title="QMD-Engine" href="/de/concepts/memory-qmd">
    Local-first-Sidecar.
  </Card>
  <Card title="Memory-Suche" href="/de/concepts/memory-search">
    Suchpipeline und Optimierung.
  </Card>
  <Card title="Active Memory" href="/de/concepts/active-memory">
    Memory-Sub-Agent für interaktive Sitzungen.
  </Card>
</CardGroup>

Alle Einstellungen für die Memory-Suche befinden sich unter `agents.defaults.memorySearch` in `openclaw.json`, sofern nicht anders angegeben.

<Note>
Wenn Sie nach dem Feature-Toggle für **Active Memory** und der Konfiguration des Sub-Agents suchen, befindet sich dies unter `plugins.entries.active-memory` statt unter `memorySearch`.

Active Memory verwendet ein Zwei-Gate-Modell:

1. Das Plugin muss aktiviert sein und auf die aktuelle Agent-ID zielen.
2. Die Anfrage muss eine berechtigte interaktive persistente Chat-Sitzung sein.

Unter [Active Memory](/de/concepts/active-memory) finden Sie das Aktivierungsmodell, plugin-eigene Konfiguration, Transkriptpersistenz und ein sicheres Rollout-Muster.
</Note>

---

## Provider-Auswahl

| Schlüssel | Typ       | Standard         | Beschreibung                                                                                                   |
| ---------- | --------- | ---------------- | -------------------------------------------------------------------------------------------------------------- |
| `provider` | `string`  | automatisch erkannt | ID des Embedding-Adapters: `bedrock`, `gemini`, `github-copilot`, `local`, `mistral`, `ollama`, `openai`, `voyage` |
| `model`    | `string`  | Provider-Standard | Name des Embedding-Modells                                                                                     |
| `fallback` | `string`  | `"none"`         | ID des Fallback-Adapters, wenn der primäre fehlschlägt                                                        |
| `enabled`  | `boolean` | `true`           | Aktiviert oder deaktiviert die Memory-Suche                                                                    |

### Reihenfolge der automatischen Erkennung

Wenn `provider` nicht gesetzt ist, wählt OpenClaw den ersten verfügbaren:

<Steps>
  <Step title="local">
    Wird ausgewählt, wenn `memorySearch.local.modelPath` konfiguriert ist und die Datei existiert.
  </Step>
  <Step title="github-copilot">
    Wird ausgewählt, wenn ein GitHub-Copilot-Token aufgelöst werden kann (Umgebungsvariable oder Authentifizierungsprofil).
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
  <Step title="bedrock">
    Wird ausgewählt, wenn die Credential-Chain des AWS SDK aufgelöst wird (Instance Role, Zugriffsschlüssel, Profil, SSO, Web-Identität oder gemeinsame Konfiguration).
  </Step>
</Steps>

`ollama` wird unterstützt, aber nicht automatisch erkannt (explizit setzen).

### Auflösung von API-Schlüsseln

Remote-Embeddings erfordern einen API-Schlüssel. Bedrock verwendet stattdessen die Standard-Credential-Chain des AWS SDK (Instance Roles, SSO, Zugriffsschlüssel).

| Provider         | Umgebungsvariable                                 | Konfigurationsschlüssel              |
| ---------------- | ------------------------------------------------- | ------------------------------------ |
| Bedrock          | AWS Credential Chain                              | Kein API-Schlüssel erforderlich      |
| Gemini           | `GEMINI_API_KEY`                                  | `models.providers.google.apiKey`     |
| GitHub Copilot   | `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, `GITHUB_TOKEN` | Authentifizierungsprofil per Geräte-Login |
| Mistral          | `MISTRAL_API_KEY`                                 | `models.providers.mistral.apiKey`    |
| Ollama           | `OLLAMA_API_KEY` (Platzhalter)                    | --                                   |
| OpenAI           | `OPENAI_API_KEY`                                  | `models.providers.openai.apiKey`     |
| Voyage           | `VOYAGE_API_KEY`                                  | `models.providers.voyage.apiKey`     |

<Note>
Codex OAuth deckt nur Chat/Completions ab und erfüllt keine Embedding-Anfragen.
</Note>

---

## Remote-Endpunktkonfiguration

Für benutzerdefinierte OpenAI-kompatible Endpunkte oder zum Überschreiben von Provider-Standards:

<ParamField path="remote.baseUrl" type="string">
  Benutzerdefinierte API-`baseUrl`.
</ParamField>
<ParamField path="remote.apiKey" type="string">
  API-Schlüssel überschreiben.
</ParamField>
<ParamField path="remote.headers" type="object">
  Zusätzliche HTTP-Header (werden mit den Provider-Standards zusammengeführt).
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

## Providerspezifische Konfiguration

<AccordionGroup>
  <Accordion title="Gemini">
    | Schlüssel              | Typ      | Standard               | Beschreibung                               |
    | ---------------------- | -------- | ---------------------- | ------------------------------------------ |
    | `model`                | `string` | `gemini-embedding-001` | Unterstützt auch `gemini-embedding-2-preview` |
    | `outputDimensionality` | `number` | `3072`                 | Für Embedding 2: 768, 1536 oder 3072       |

    <Warning>
    Das Ändern von Modell oder `outputDimensionality` löst automatisch eine vollständige Neuindizierung aus.
    </Warning>

  </Accordion>
  <Accordion title="Bedrock">
    Bedrock verwendet die Standard-Credential-Chain des AWS SDK — es werden keine API-Schlüssel benötigt. Wenn OpenClaw auf EC2 mit einer für Bedrock aktivierten Instance Role läuft, setzen Sie einfach Provider und Modell:

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
    | ---------------------- | -------- | ------------------------------ | -------------------------------- |
    | `model`                | `string` | `amazon.titan-embed-text-v2:0` | Beliebige Bedrock-Embedding-Modell-ID |
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

    Varianten mit Durchsatzsuffix (z. B. `amazon.titan-embed-text-v1:2:8k`) übernehmen die Konfiguration des Basismodells.

    **Authentifizierung:** Die Bedrock-Authentifizierung verwendet die Standard-Reihenfolge zur Credential-Auflösung des AWS SDK:

    1. Umgebungsvariablen (`AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`)
    2. SSO-Token-Cache
    3. Web-Identity-Token-Anmeldedaten
    4. Gemeinsame Dateien für Anmeldedaten und Konfiguration
    5. ECS- oder EC2-Metadaten-Anmeldedaten

    Die Region wird aus `AWS_REGION`, `AWS_DEFAULT_REGION`, der `baseUrl` des Providers `amazon-bedrock` aufgelöst oder standardmäßig auf `us-east-1` gesetzt.

    **IAM-Berechtigungen:** Die IAM-Rolle oder der IAM-Benutzer benötigt:

    ```json
    {
      "Effect": "Allow",
      "Action": "bedrock:InvokeModel",
      "Resource": "*"
    }
    ```

    Nach dem Least-Privilege-Prinzip beschränken Sie `InvokeModel` auf das konkrete Modell:

    ```
    arn:aws:bedrock:*::foundation-model/amazon.titan-embed-text-v2:0
    ```

  </Accordion>
  <Accordion title="Local (GGUF + node-llama-cpp)">
    | Schlüssel            | Typ                  | Standard               | Beschreibung                                                                                                                                                                                                                                                                                                       |
    | --------------------- | -------------------- | ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
    | `local.modelPath`     | `string`             | automatisch heruntergeladen | Pfad zur GGUF-Modelldatei                                                                                                                                                                                                                                                                                      |
    | `local.modelCacheDir` | `string`             | node-llama-cpp-Standard | Cache-Verzeichnis für heruntergeladene Modelle                                                                                                                                                                                                                                                                  |
    | `local.contextSize`   | `number \| "auto"`   | `4096`                 | Größe des Kontextfensters für den Embedding-Kontext. 4096 deckt typische Chunks (128–512 Token) ab und begrenzt gleichzeitig den nicht durch Gewichte belegten VRAM. Senken Sie den Wert auf 1024–2048 bei eingeschränkten Hosts. `"auto"` verwendet das trainierte Maximum des Modells — für 8B+-Modelle nicht empfohlen (Qwen3-Embedding-8B: 40 960 Token → ~32 GB VRAM gegenüber ~8,8 GB bei 4096). |

    Standardmodell: `embeddinggemma-300m-qat-Q8_0.gguf` (~0,6 GB, wird automatisch heruntergeladen). Erfordert nativen Build: `pnpm approve-builds` und dann `pnpm rebuild node-llama-cpp`.

    Verwenden Sie die eigenständige CLI, um denselben Provider-Pfad zu prüfen, den das Gateway verwendet:

    ```bash
    openclaw memory status --deep --agent main
    openclaw memory index --force --agent main
    ```

    Wenn `provider` auf `auto` gesetzt ist, wird `local` nur ausgewählt, wenn `local.modelPath` auf eine vorhandene lokale Datei zeigt. `hf:`- und HTTP(S)-Modellreferenzen können weiterhin explizit mit `provider: "local"` verwendet werden, veranlassen `auto` aber nicht dazu, `local` auszuwählen, bevor das Modell auf der Festplatte verfügbar ist.

  </Accordion>
</AccordionGroup>

### Timeout für Inline-Embeddings

<ParamField path="sync.embeddingBatchTimeoutSeconds" type="number">
  Überschreibt das Timeout für Inline-Embedding-Batches während der Memory-Indizierung.

Wenn kein Wert gesetzt ist, wird der Provider-Standard verwendet: 600 Sekunden für lokale/self-hosted Provider wie `local`, `ollama` und `lmstudio` und 120 Sekunden für gehostete Provider. Erhöhen Sie diesen Wert, wenn lokale CPU-gebundene Embedding-Batches fehlerfrei, aber langsam sind.
</ParamField>

---

## Konfiguration der Hybrid-Suche

Alles unter `memorySearch.query.hybrid`:

| Schlüssel            | Typ       | Standard | Beschreibung                         |
| -------------------- | --------- | -------- | ------------------------------------ |
| `enabled`            | `boolean` | `true`   | Aktiviert die Hybrid-Suche aus BM25 + Vektor |
| `vectorWeight`       | `number`  | `0.7`    | Gewichtung für Vektor-Scores (0-1)   |
| `textWeight`         | `number`  | `0.3`    | Gewichtung für BM25-Scores (0-1)     |
| `candidateMultiplier`| `number`  | `4`      | Multiplikator für die Größe des Kandidatenpools |

<Tabs>
  <Tab title="MMR (Diversität)">
    | Schlüssel      | Typ       | Standard | Beschreibung                            |
    | -------------- | --------- | -------- | --------------------------------------- |
    | `mmr.enabled`  | `boolean` | `false`  | Aktiviert MMR-Re-Ranking                |
    | `mmr.lambda`   | `number`  | `0.7`    | 0 = maximale Diversität, 1 = maximale Relevanz |
  </Tab>
  <Tab title="Zeitlicher Zerfall (Aktualität)">
    | Schlüssel                    | Typ       | Standard | Beschreibung                    |
    | ---------------------------- | --------- | -------- | ------------------------------- |
    | `temporalDecay.enabled`      | `boolean` | `false`  | Aktiviert den Aktualitäts-Boost |
    | `temporalDecay.halfLifeDays` | `number`  | `30`     | Score halbiert sich alle N Tage |

    Evergreen-Dateien (`MEMORY.md`, nicht datierte Dateien in `memory/`) unterliegen nie einem Zerfall.

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

## Zusätzliche Memory-Pfade

| Schlüssel    | Typ        | Beschreibung                                 |
| ------------ | ---------- | -------------------------------------------- |
| `extraPaths` | `string[]` | Zusätzliche Verzeichnisse oder Dateien zur Indizierung |

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

Pfade können absolut oder relativ zum Workspace sein. Verzeichnisse werden rekursiv nach `.md`-Dateien durchsucht. Die Behandlung von Symlinks hängt vom aktiven Backend ab: Die integrierte Engine ignoriert Symlinks, während QMD dem zugrunde liegenden Scanner-Verhalten von QMD folgt.

Für agentenspezifische agentenübergreifende Transkript-Suche verwenden Sie `agents.list[].memorySearch.qmd.extraCollections` statt `memory.qmd.paths`. Diese zusätzlichen Collections verwenden dieselbe Form `{ path, name, pattern? }`, werden jedoch pro Agent zusammengeführt und können explizite gemeinsame Namen beibehalten, wenn der Pfad außerhalb des aktuellen Workspaces liegt. Wenn derselbe aufgelöste Pfad sowohl in `memory.qmd.paths` als auch in `memorySearch.qmd.extraCollections` erscheint, behält QMD den ersten Eintrag bei und überspringt das Duplikat.

---

## Multimodale Memory (Gemini)

Indizieren Sie Bilder und Audio zusammen mit Markdown mithilfe von Gemini Embedding 2:

| Schlüssel                 | Typ        | Standard   | Beschreibung                           |
| ------------------------- | ---------- | ---------- | -------------------------------------- |
| `multimodal.enabled`      | `boolean`  | `false`    | Aktiviert multimodale Indizierung      |
| `multimodal.modalities`   | `string[]` | --         | `["image"]`, `["audio"]` oder `["all"]` |
| `multimodal.maxFileBytes` | `number`   | `10000000` | Maximale Dateigröße für die Indizierung |

<Note>
Gilt nur für Dateien in `extraPaths`. Standard-Memory-Roots bleiben auf Markdown beschränkt. Erfordert `gemini-embedding-2-preview`. `fallback` muss `"none"` sein.
</Note>

Unterstützte Formate: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.heic`, `.heif` (Bilder); `.mp3`, `.wav`, `.ogg`, `.opus`, `.m4a`, `.aac`, `.flac` (Audio).

---

## Embedding-Cache

| Schlüssel          | Typ       | Standard | Beschreibung                         |
| ------------------ | --------- | -------- | ------------------------------------ |
| `cache.enabled`    | `boolean` | `false`  | Cacht Chunk-Embeddings in SQLite     |
| `cache.maxEntries` | `number`  | `50000`  | Maximale Anzahl gecachter Embeddings |

Verhindert das erneute Erstellen von Embeddings für unveränderten Text bei Neuindizierung oder Transkriptaktualisierungen.

---

## Batch-Indizierung

| Schlüssel                    | Typ       | Standard | Beschreibung                    |
| ---------------------------- | --------- | -------- | ------------------------------- |
| `remote.batch.enabled`       | `boolean` | `false`  | Aktiviert die Batch-Embedding-API |
| `remote.batch.concurrency`   | `number`  | `2`      | Parallele Batch-Jobs            |
| `remote.batch.wait`          | `boolean` | `true`   | Wartet auf Batch-Abschluss      |
| `remote.batch.pollIntervalMs`| `number`  | --       | Polling-Intervall               |
| `remote.batch.timeoutMinutes`| `number`  | --       | Batch-Timeout                   |

Verfügbar für `openai`, `gemini` und `voyage`. OpenAI-Batch ist für große Backfills in der Regel am schnellsten und günstigsten.

Dies ist getrennt von `sync.embeddingBatchTimeoutSeconds`, das Inline-Embedding-Aufrufe steuert, die von lokalen/self-hosted Providern und von gehosteten Providern verwendet werden, wenn Batch-APIs des Providers nicht aktiv sind.

---

## Session-Memory-Suche (experimentell)

Session-Transkripte indizieren und über `memory_search` bereitstellen:

| Schlüssel                    | Typ        | Standard     | Beschreibung                              |
| ---------------------------- | ---------- | ------------ | ----------------------------------------- |
| `experimental.sessionMemory` | `boolean`  | `false`      | Aktiviert Session-Indizierung             |
| `sources`                    | `string[]` | `["memory"]` | Fügen Sie `"sessions"` hinzu, um Transkripte einzuschließen |
| `sync.sessions.deltaBytes`   | `number`   | `100000`     | Byte-Schwellenwert für Neuindizierung     |
| `sync.sessions.deltaMessages`| `number`   | `50`         | Nachrichten-Schwellenwert für Neuindizierung |

<Warning>
Session-Indizierung ist Opt-in und läuft asynchron. Ergebnisse können leicht veraltet sein. Session-Logs liegen auf dem Datenträger, daher sollte der Dateisystemzugriff als Vertrauensgrenze behandelt werden.
</Warning>

---

## SQLite-Vektorbeschleunigung (sqlite-vec)

| Schlüssel                   | Typ       | Standard | Beschreibung                        |
| --------------------------- | --------- | -------- | ----------------------------------- |
| `store.vector.enabled`      | `boolean` | `true`   | Verwendet sqlite-vec für Vektorabfragen |
| `store.vector.extensionPath`| `string`  | gebündelt | Überschreibt den sqlite-vec-Pfad    |

Wenn sqlite-vec nicht verfügbar ist, fällt OpenClaw automatisch auf Cosinus-Ähnlichkeit im Prozess zurück.

---

## Indexspeicherung

| Schlüssel            | Typ      | Standard                              | Beschreibung                                |
| -------------------- | -------- | ------------------------------------- | ------------------------------------------- |
| `store.path`         | `string` | `~/.openclaw/memory/{agentId}.sqlite` | Speicherort des Index (unterstützt Token `{agentId}`) |
| `store.fts.tokenizer`| `string` | `unicode61`                           | FTS5-Tokenizer (`unicode61` oder `trigram`) |

---

## Konfiguration des QMD-Backends

Setzen Sie `memory.backend = "qmd"`, um es zu aktivieren. Alle QMD-Einstellungen befinden sich unter `memory.qmd`:

| Schlüssel                | Typ       | Standard | Beschreibung                                 |
| ------------------------ | --------- | -------- | -------------------------------------------- |
| `command`                | `string`  | `qmd`    | Pfad zur QMD-Programmdatei                   |
| `searchMode`             | `string`  | `search` | Suchbefehl: `search`, `vsearch`, `query`     |
| `includeDefaultMemory`   | `boolean` | `true`   | Indiziert automatisch `MEMORY.md` + `memory/**/*.md` |
| `paths[]`                | `array`   | --       | Zusätzliche Pfade: `{ name, path, pattern? }` |
| `sessions.enabled`       | `boolean` | `false`  | Indiziert Session-Transkripte                |
| `sessions.retentionDays` | `number`  | --       | Aufbewahrung der Transkripte                 |
| `sessions.exportDir`     | `string`  | --       | Exportverzeichnis                            |

OpenClaw bevorzugt die aktuellen Formen von QMD-Collection- und MCP-Abfragen, hält aber ältere QMD-Releases funktionsfähig, indem es bei Bedarf auf ältere Collection-Flags mit `--mask` und ältere Namen von MCP-Tools zurückfällt.

<Note>
QMD-Modell-Overrides bleiben auf der QMD-Seite, nicht in der OpenClaw-Konfiguration. Wenn Sie QMD-Modelle global überschreiben müssen, setzen Sie Umgebungsvariablen wie `QMD_EMBED_MODEL`, `QMD_RERANK_MODEL` und `QMD_GENERATE_MODEL` in der Gateway-Laufzeitumgebung.
</Note>

<AccordionGroup>
  <Accordion title="Aktualisierungszeitplan">
    | Schlüssel                | Typ       | Standard | Beschreibung                             |
    | ------------------------ | --------- | -------- | ---------------------------------------- |
    | `update.interval`        | `string`  | `5m`     | Aktualisierungsintervall                 |
    | `update.debounceMs`      | `number`  | `15000`  | Entprellt Dateiänderungen                |
    | `update.onBoot`          | `boolean` | `true`   | Aktualisiert beim Start                  |
    | `update.waitForBootSync` | `boolean` | `false`  | Blockiert den Start, bis die Aktualisierung abgeschlossen ist |
    | `update.embedInterval`   | `string`  | --       | Separater Embedding-Takt                 |
    | `update.commandTimeoutMs`| `number`  | --       | Timeout für QMD-Befehle                  |
    | `update.updateTimeoutMs` | `number`  | --       | Timeout für QMD-Aktualisierungsvorgänge  |
    | `update.embedTimeoutMs`  | `number`  | --       | Timeout für QMD-Embedding-Vorgänge       |
  </Accordion>
  <Accordion title="Grenzwerte">
    | Schlüssel                | Typ      | Standard | Beschreibung                  |
    | ------------------------ | -------- | -------- | ----------------------------- |
    | `limits.maxResults`      | `number` | `6`      | Maximale Suchergebnisse       |
    | `limits.maxSnippetChars` | `number` | --       | Begrenzt die Snippet-Länge    |
    | `limits.maxInjectedChars`| `number` | --       | Begrenzt insgesamt injizierte Zeichen |
    | `limits.timeoutMs`       | `number` | `4000`   | Such-Timeout                  |
  </Accordion>
  <Accordion title="Bereich">
    Steuert, welche Sessions QMD-Suchergebnisse erhalten können. Gleiches Schema wie [`session.sendPolicy`](/de/gateway/config-agents#session):

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

    Der ausgelieferte Standard erlaubt direkte Sessions und Kanalsitzungen, lehnt Gruppen jedoch weiterhin ab.

    Standard ist nur DM. `match.keyPrefix` gleicht den normalisierten Session-Schlüssel ab; `match.rawKeyPrefix` gleicht den Rohschlüssel einschließlich `agent:<id>:` ab.

  </Accordion>
  <Accordion title="Zitate">
    `memory.citations` gilt für alle Backends:

    | Wert             | Verhalten                                          |
    | ---------------- | -------------------------------------------------- |
    | `auto` (Standard)| Fügt in Snippets eine Fußzeile `Source: <path#line>` ein |
    | `on`             | Fügt die Fußzeile immer ein                        |
    | `off`            | Lässt die Fußzeile weg (Pfad wird intern weiterhin an den Agent übergeben) |

  </Accordion>
</AccordionGroup>

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

Dreaming läuft als ein geplanter Sweep und verwendet interne Phasen für Light/Deep/REM als Implementierungsdetail.

Zum konzeptionellen Verhalten und zu Slash-Befehlen siehe [Dreaming](/de/concepts/dreaming).

### Benutzereinstellungen

| Schlüssel   | Typ       | Standard    | Beschreibung                                      |
| ----------- | --------- | ----------- | ------------------------------------------------- |
| `enabled`   | `boolean` | `false`     | Aktiviert oder deaktiviert Dreaming vollständig   |
| `frequency` | `string`  | `0 3 * * *` | Optionaler Cron-Takt für den vollständigen Dreaming-Sweep |

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

<Note>
- Dreaming schreibt Maschinenzustand nach `memory/.dreams/`.
- Dreaming schreibt menschenlesbare narrative Ausgabe nach `DREAMS.md` (oder in eine vorhandene `dreams.md`).
- Die Richtlinie und Schwellenwerte für die Phasen Light/Deep/REM sind internes Verhalten und keine benutzerseitige Konfiguration.

</Note>

## Verwandt

- [Konfigurationsreferenz](/de/gateway/configuration-reference)
- [Memory-Übersicht](/de/concepts/memory)
- [Memory-Suche](/de/concepts/memory-search)
