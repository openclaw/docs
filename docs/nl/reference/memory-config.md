---
read_when:
    - Je wilt geheugenzoekproviders of embeddingmodellen configureren
    - Je wilt de QMD-backend instellen
    - Je wilt hybride zoeken, MMR of temporeel verval afstemmen
    - Je wilt multimodale geheugenindexering inschakelen
sidebarTitle: Memory config
summary: Alle configuratieknoppen voor geheugenzoekopdrachten, embeddingproviders, QMD, hybride zoeken en multimodale indexering
title: Geheugenconfiguratiereferentie
x-i18n:
    generated_at: "2026-06-27T18:18:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d8f5880fef3fbdf81e546b0309a0e53459bae47e16efd787f87e34050d8c7b1e
    source_path: reference/memory-config.md
    workflow: 16
---

Deze pagina vermeldt elke configuratieknop voor OpenClaw-geheugenzoekopdrachten. Zie voor conceptuele overzichten:

<CardGroup cols={2}>
  <Card title="Geheugenoverzicht" href="/nl/concepts/memory">
    Hoe geheugen werkt.
  </Card>
  <Card title="Ingebouwde engine" href="/nl/concepts/memory-builtin">
    Standaard SQLite-backend.
  </Card>
  <Card title="QMD-engine" href="/nl/concepts/memory-qmd">
    Lokaal-eerst sidecar.
  </Card>
  <Card title="Geheugenzoekopdracht" href="/nl/concepts/memory-search">
    Zoekpipeline en afstemming.
  </Card>
  <Card title="Active Memory" href="/nl/concepts/active-memory">
    Geheugen-subagent voor interactieve sessies.
  </Card>
</CardGroup>

Alle instellingen voor geheugenzoekopdrachten staan onder `agents.defaults.memorySearch` in `openclaw.json`, tenzij anders vermeld.

<Note>
Als je zoekt naar de functieschakelaar en subagentconfiguratie voor **Active Memory**, die staan onder `plugins.entries.active-memory` in plaats van onder `memorySearch`.

Active Memory gebruikt een model met twee poorten:

1. de Plugin moet ingeschakeld zijn en gericht zijn op de huidige agent-id
2. de aanvraag moet een geschikte interactieve persistente chatsessie zijn

Zie [Active Memory](/nl/concepts/active-memory) voor het activatiemodel, de Plugin-beheerde configuratie, transcriptpersistentie en het veilige uitrolpatroon.
</Note>

---

## Providerselectie

| Sleutel    | Type      | Standaard        | Beschrijving                                                                                                                                                                                                                                                                                 |
| ---------- | --------- | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider` | `string`  | `"openai"`       | Embeddingadapter-ID zoals `bedrock`, `deepinfra`, `gemini`, `github-copilot`, `local`, `mistral`, `ollama`, `openai`, `openai-compatible` of `voyage`; kan ook een geconfigureerde `models.providers.<id>` zijn waarvan `api` naar een geheugen-embeddingadapter of OpenAI-compatibele model-API wijst |
| `model`    | `string`  | providerstandaard | Naam van embeddingmodel                                                                                                                                                                                                                                                                      |
| `fallback` | `string`  | `"none"`         | Fallbackadapter-ID wanneer de primaire adapter faalt                                                                                                                                                                                                                                        |
| `enabled`  | `boolean` | `true`           | Geheugenzoekopdrachten in- of uitschakelen                                                                                                                                                                                                                                                   |

Wanneer `provider` niet is ingesteld, gebruikt OpenClaw OpenAI-embeddings. Stel `provider`
expliciet in om Gemini, Voyage, Mistral, DeepInfra, Bedrock, GitHub Copilot,
Ollama, een lokaal GGUF-model of een OpenAI-compatibel `/v1/embeddings`-endpoint
te gebruiken. Legacy-configuraties waarin nog `provider: "auto"` staat, worden
opgelost naar `openai`.

<Warning>
Het wijzigen van de embeddingprovider, het model, providerinstellingen, bronnen, scope,
chunking of tokenizer kan de bestaande SQLite-vectorindex incompatibel maken.
OpenClaw pauzeert vectorzoekopdrachten en meldt een waarschuwing over de indexidentiteit in plaats van
alles automatisch opnieuw te embedden. Bouw opnieuw wanneer je klaar bent met
`openclaw memory status --index --agent <id>` of
`openclaw memory index --force --agent <id>`.
</Warning>

Wanneer `provider` niet is ingesteld, legacy `provider: "auto"` aanwezig is, of
`provider: "none"` bewust de modus met alleen FTS selecteert, kan geheugenherinnering nog steeds
lexicale FTS-rangschikking gebruiken wanneer embeddings niet beschikbaar zijn.

Expliciete niet-lokale providers falen gesloten. Als je `memorySearch.provider` instelt op
een concrete remote-backed provider zoals OpenAI, Gemini, Voyage, Mistral,
Bedrock, GitHub Copilot, DeepInfra, Ollama, LM Studio of een OpenAI-compatibele
aangepaste provider, en die provider tijdens runtime niet beschikbaar is, retourneert `memory_search`
een niet-beschikbaar resultaat in plaats van stilzwijgend alleen-FTS-herinnering te gebruiken. Herstel de
provider-/authconfiguratie, schakel over naar een bereikbare provider, of stel
`provider: "none"` in als je bewust alleen-FTS-herinnering wilt.

### Aangepaste provider-id's

`memorySearch.provider` kan verwijzen naar een aangepaste `models.providers.<id>`-vermelding voor geheugenspecifieke provideradapters zoals `ollama`, of voor OpenAI-compatibele model-API's zoals `openai-responses` / `openai-completions`. OpenClaw lost de `api`-eigenaar van die provider op voor de embeddingadapter, terwijl de aangepaste provider-id behouden blijft voor endpoint-, auth- en modelprefixafhandeling. Hierdoor kunnen multi-GPU- of multi-hostopstellingen geheugenembeddings toewijzen aan een specifiek lokaal endpoint:

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

### API-sleutelresolutie

Remote embeddings vereisen een API-sleutel. Bedrock gebruikt in plaats daarvan de standaardreferentieketen van de AWS SDK (instancerollen, SSO, toegangssleutels).

| Provider       | Omgevingsvariabele                              | Configuratiesleutel                |
| -------------- | ------------------------------------------------ | ----------------------------------- |
| Bedrock        | AWS-referentieketen                              | Geen API-sleutel nodig              |
| DeepInfra      | `DEEPINFRA_API_KEY`                              | `models.providers.deepinfra.apiKey` |
| Gemini         | `GEMINI_API_KEY`                                 | `models.providers.google.apiKey`    |
| GitHub Copilot | `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, `GITHUB_TOKEN` | Authprofiel via apparaataanmelding  |
| Mistral        | `MISTRAL_API_KEY`                                | `models.providers.mistral.apiKey`   |
| Ollama         | `OLLAMA_API_KEY` (placeholder)                   | --                                  |
| OpenAI         | `OPENAI_API_KEY`                                 | `models.providers.openai.apiKey`    |
| Voyage         | `VOYAGE_API_KEY`                                 | `models.providers.voyage.apiKey`    |

<Note>
Codex OAuth dekt alleen chat/completions en voldoet niet aan embeddingaanvragen.
</Note>

---

## Remote endpoint-configuratie

Gebruik `provider: "openai-compatible"` voor een generieke OpenAI-compatibele
`/v1/embeddings`-server die geen globale OpenAI-chatreferenties moet overnemen.

<ParamField path="remote.baseUrl" type="string">
  Aangepaste API-basis-URL.
</ParamField>
<ParamField path="remote.apiKey" type="string">
  API-sleutel overschrijven.
</ParamField>
<ParamField path="remote.headers" type="object">
  Extra HTTP-headers (samengevoegd met providerstandaarden).
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

## Providerspecifieke configuratie

<AccordionGroup>
  <Accordion title="Gemini">
    | Sleutel                | Type     | Standaard              | Beschrijving                                      |
    | ---------------------- | -------- | ---------------------- | ------------------------------------------------- |
    | `model`                | `string` | `gemini-embedding-001` | Ondersteunt ook `gemini-embedding-2-preview`      |
    | `outputDimensionality` | `number` | `3072`                 | Voor Embedding 2: 768, 1536 of 3072               |

    <Warning>
    Het wijzigen van het model of `outputDimensionality` wijzigt de indexidentiteit. OpenClaw
    pauzeert vectorzoekopdrachten totdat je de geheugenindex expliciet opnieuw opbouwt.
    </Warning>

  </Accordion>
  <Accordion title="OpenAI-compatibele invoertypen">
    OpenAI-compatibele embeddingendpoints kunnen kiezen voor providerspecifieke `input_type`-aanvraagvelden. Dit is nuttig voor asymmetrische embeddingmodellen die verschillende labels vereisen voor query- en documentembeddings.

    | Sleutel             | Type     | Standaard | Beschrijving                                             |
    | ------------------- | -------- | --------- | -------------------------------------------------------- |
    | `inputType`         | `string` | niet ingesteld | Gedeelde `input_type` voor query- en documentembeddings |
    | `queryInputType`    | `string` | niet ingesteld | `input_type` tijdens query's; overschrijft `inputType` |
    | `documentInputType` | `string` | niet ingesteld | `input_type` voor index/document; overschrijft `inputType` |

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

    Het wijzigen van deze waarden beïnvloedt de embeddingcache-identiteit voor provider-batchindexering en moet worden gevolgd door een herindexering van het geheugen wanneer het upstreammodel de labels verschillend behandelt.

  </Accordion>
  <Accordion title="Bedrock">
    ### Bedrock-embeddingconfiguratie

    Bedrock gebruikt de standaardreferentieketen van de AWS SDK — er zijn geen API-sleutels nodig. Als OpenClaw op EC2 draait met een Bedrock-ingeschakelde instancerol, stel dan alleen de provider en het model in:

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

    | Sleutel                | Type     | Standaard                      | Beschrijving                    |
    | ---------------------- | -------- | ------------------------------ | ------------------------------- |
    | `model`                | `string` | `amazon.titan-embed-text-v2:0` | Elke Bedrock-embeddingmodel-ID  |
    | `outputDimensionality` | `number` | modelstandaard                 | Voor Titan V2: 256, 512 of 1024 |

    **Ondersteunde modellen** (met familiedetectie en dimensiestandaarden):

    | Model-ID                                   | Provider   | Standaarddimensies | Configureerbare dimensies |
    | ------------------------------------------ | ---------- | ------------------ | ------------------------- |
    | `amazon.titan-embed-text-v2:0`             | Amazon     | 1024               | 256, 512, 1024            |
    | `amazon.titan-embed-text-v1`               | Amazon     | 1536               | --                        |
    | `amazon.titan-embed-g1-text-02`            | Amazon     | 1536               | --                        |
    | `amazon.titan-embed-image-v1`              | Amazon     | 1024               | --                        |
    | `amazon.nova-2-multimodal-embeddings-v1:0` | Amazon     | 1024               | 256, 384, 1024, 3072      |
    | `cohere.embed-english-v3`                  | Cohere     | 1024               | --                        |
    | `cohere.embed-multilingual-v3`             | Cohere     | 1024               | --                        |
    | `cohere.embed-v4:0`                        | Cohere     | 1536               | 256-1536                  |
    | `twelvelabs.marengo-embed-3-0-v1:0`        | TwelveLabs | 512                | --                        |
    | `twelvelabs.marengo-embed-2-7-v1:0`        | TwelveLabs | 1024               | --                        |

    Varianten met een throughput-achtervoegsel (bijv. `amazon.titan-embed-text-v1:2:8k`) erven de configuratie van het basismodel.

    **Authenticatie:** Bedrock-authenticatie gebruikt de standaardvolgorde voor credential-resolutie van de AWS SDK:

    1. Omgevingsvariabelen (`AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`)
    2. SSO-tokencache
    3. Credentials voor webidentiteitstokens
    4. Gedeelde credentials- en configuratiebestanden
    5. ECS- of EC2-metadata-credentials

    De regio wordt bepaald vanuit `AWS_REGION`, `AWS_DEFAULT_REGION`, de `amazon-bedrock`-provider `baseUrl`, of valt standaard terug op `us-east-1`.

    **IAM-machtigingen:** de IAM-rol of -gebruiker heeft nodig:

    ```json
    {
      "Effect": "Allow",
      "Action": "bedrock:InvokeModel",
      "Resource": "*"
    }
    ```

    Voor minimale rechten beperk je `InvokeModel` tot het specifieke model:

    ```
    arn:aws:bedrock:*::foundation-model/amazon.titan-embed-text-v2:0
    ```

  </Accordion>
  <Accordion title="Lokaal (GGUF + llama.cpp)">
    | Sleutel               | Type               | Standaard              | Beschrijving                                                                                                                                                                                                                                                                                                                                                 |
    | --------------------- | ------------------ | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
    | `local.modelPath`     | `string`           | automatisch gedownload | Pad naar GGUF-modelbestand                                                                                                                                                                                                                                                                                                                                    |
    | `local.modelCacheDir` | `string`           | node-llama-cpp-standaard | Cachemap voor gedownloade modellen                                                                                                                                                                                                                                                                                                                           |
    | `local.contextSize`   | `number \| "auto"` | `4096`                 | Grootte van het contextvenster voor de embeddingcontext. 4096 dekt typische chunks (128-512 tokens) terwijl niet-gewicht-VRAM wordt begrensd. Verlaag naar 1024-2048 op beperkte hosts. `"auto"` gebruikt het getrainde maximum van het model — niet aanbevolen voor 8B+-modellen (Qwen3-Embedding-8B: 40 960 tokens -> ~32 GB VRAM versus ~8,8 GB bij 4096). |

    Installeer eerst de officiële llama.cpp-provider: `openclaw plugins install @openclaw/llama-cpp-provider`.
    Standaardmodel: `embeddinggemma-300m-qat-Q8_0.gguf` (~0,6 GB, automatisch gedownload). Source-checkouts vereisen nog steeds goedkeuring voor native builds: `pnpm approve-builds` en daarna `pnpm rebuild node-llama-cpp`.

    Gebruik de zelfstandige CLI om hetzelfde providerpad te verifiëren dat de Gateway gebruikt:

    ```bash
    openclaw memory status --deep --agent main
    openclaw memory index --force --agent main
    ```

    Stel `provider: "local"` expliciet in voor lokale GGUF-embeddings. `hf:`- en HTTP(S)-modelreferenties worden ondersteund voor expliciete lokale configuraties, maar ze wijzigen de standaardprovider niet.

  </Accordion>
</AccordionGroup>

### Time-out voor inline embeddings

<ParamField path="sync.embeddingBatchTimeoutSeconds" type="number">
  Overschrijf de time-out voor inline embeddingbatches tijdens geheugenindexering.

Niet ingesteld gebruikt de standaardwaarde van de provider: 600 seconden voor lokale/zelf-gehoste providers zoals `local`, `ollama` en `lmstudio`, en 120 seconden voor gehoste providers. Verhoog dit wanneer lokale CPU-gebonden embeddingbatches gezond maar traag zijn.
</ParamField>

---

## Configuratie voor hybride zoekopdrachten

Alles onder `memorySearch.query.hybrid`:

| Sleutel               | Type      | Standaard | Beschrijving                          |
| --------------------- | --------- | --------- | ------------------------------------- |
| `enabled`             | `boolean` | `true`    | Hybride BM25 + vectorzoekopdracht inschakelen |
| `vectorWeight`        | `number`  | `0.7`     | Gewicht voor vectorscores (0-1)       |
| `textWeight`          | `number`  | `0.3`     | Gewicht voor BM25-scores (0-1)        |
| `candidateMultiplier` | `number`  | `4`       | Vermenigvuldiger voor kandidaatpoolgrootte |

<Tabs>
  <Tab title="MMR (diversiteit)">
    | Sleutel       | Type      | Standaard | Beschrijving                           |
    | ------------- | --------- | --------- | -------------------------------------- |
    | `mmr.enabled` | `boolean` | `false`   | MMR-herordening inschakelen            |
    | `mmr.lambda`  | `number`  | `0.7`     | 0 = maximale diversiteit, 1 = maximale relevantie |
  </Tab>
  <Tab title="Tijdelijk verval (recentheid)">
    | Sleutel                      | Type      | Standaard | Beschrijving                 |
    | ---------------------------- | --------- | --------- | ---------------------------- |
    | `temporalDecay.enabled`      | `boolean` | `false`   | Recentheidsboost inschakelen |
    | `temporalDecay.halfLifeDays` | `number`  | `30`      | Score halveert elke N dagen  |

    Evergreen-bestanden (`MEMORY.md`, niet-gedateerde bestanden in `memory/`) vervallen nooit.

  </Tab>
</Tabs>

### Volledig voorbeeld

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

## Aanvullende geheugenpaden

| Sleutel      | Type       | Beschrijving                                        |
| ------------ | ---------- | --------------------------------------------------- |
| `extraPaths` | `string[]` | Aanvullende mappen of bestanden om te indexeren |

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

Paden kunnen absoluut of werkruimte-relatief zijn. Mappen worden recursief gescand op `.md`-bestanden. De afhandeling van symlinks hangt af van de actieve backend: de ingebouwde engine negeert symlinks, terwijl QMD het gedrag van de onderliggende QMD-scanner volgt.

Gebruik voor agent-gebonden transcriptzoekopdrachten tussen agents `agents.list[].memorySearch.qmd.extraCollections` in plaats van `memory.qmd.paths`. Die extra verzamelingen volgen dezelfde `{ path, name, pattern? }`-vorm, maar ze worden per agent samengevoegd en kunnen expliciete gedeelde namen behouden wanneer het pad buiten de huidige werkruimte wijst. Als hetzelfde opgeloste pad zowel in `memory.qmd.paths` als in `memorySearch.qmd.extraCollections` voorkomt, behoudt QMD de eerste vermelding en slaat het duplicaat over.

---

## Multimodaal geheugen (Gemini)

Indexeer afbeeldingen en audio naast Markdown met Gemini Embedding 2:

| Sleutel                   | Type       | Standaard  | Beschrijving                          |
| ------------------------- | ---------- | ---------- | ------------------------------------- |
| `multimodal.enabled`      | `boolean`  | `false`    | Multimodale indexering inschakelen    |
| `multimodal.modalities`   | `string[]` | --         | `["image"]`, `["audio"]` of `["all"]` |
| `multimodal.maxFileBytes` | `number`   | `10000000` | Maximale bestandsgrootte voor indexering |

<Note>
Alleen van toepassing op bestanden in `extraPaths`. Standaard geheugenroots blijven uitsluitend Markdown. Vereist `gemini-embedding-2-preview`. `fallback` moet `"none"` zijn.
</Note>

Ondersteunde indelingen: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.heic`, `.heif` (afbeeldingen); `.mp3`, `.wav`, `.ogg`, `.opus`, `.m4a`, `.aac`, `.flac` (audio).

---

## Embeddingcache

| Sleutel            | Type      | Standaard | Beschrijving                         |
| ------------------ | --------- | --------- | ------------------------------------ |
| `cache.enabled`    | `boolean` | `true`    | Chunk-embeddings cachen in SQLite    |
| `cache.maxEntries` | `number`  | `50000`   | Maximaal aantal gecachte embeddings  |

Voorkomt dat ongewijzigde tekst opnieuw wordt ingebed tijdens herindexering of transcriptupdates.

---

## Batchindexering

| Sleutel                       | Type      | Standaard | Beschrijving                    |
| ----------------------------- | --------- | --------- | ------------------------------- |
| `remote.nonBatchConcurrency`  | `number`  | `4`       | Parallelle inline-embeddings    |
| `remote.batch.enabled`        | `boolean` | `false`   | Batch-embedding-API inschakelen |
| `remote.batch.concurrency`    | `number`  | `2`       | Parallelle batchtaken           |
| `remote.batch.wait`           | `boolean` | `true`    | Wachten op voltooiing van batch |
| `remote.batch.pollIntervalMs` | `number`  | --        | Pollinterval                    |
| `remote.batch.timeoutMinutes` | `number`  | --        | Batch-time-out                  |

Beschikbaar voor `openai`, `gemini` en `voyage`. OpenAI-batches zijn doorgaans het snelst en goedkoopst voor grote backfills.

`remote.nonBatchConcurrency` regelt inline embedding-aanroepen die worden gebruikt door lokale/zelfgehoste providers en gehoste providers wanneer provider-batch-API's niet actief zijn. Ollama gebruikt standaard `1` voor niet-batchindexering om kleinere lokale hosts niet te overbelasten; stel een hogere waarde in op grotere machines.

Dit staat los van `sync.embeddingBatchTimeoutSeconds`, dat de time-out voor inline embedding-aanroepen regelt.

---

## Zoeken in sessiegeheugen (experimenteel)

Indexeer sessietranscripten en maak ze beschikbaar via `memory_search`:

| Sleutel                       | Type       | Standaard   | Beschrijving                                  |
| ----------------------------- | ---------- | ----------- | --------------------------------------------- |
| `experimental.sessionMemory`  | `boolean`  | `false`     | Sessie-indexering inschakelen                 |
| `sources`                     | `string[]` | `["memory"]` | Voeg `"sessions"` toe om transcripten op te nemen |
| `sync.sessions.deltaBytes`    | `number`   | `100000`    | Bytedrempel voor herindexering                |
| `sync.sessions.deltaMessages` | `number`   | `50`        | Berichtdrempel voor herindexering             |

<Warning>
Sessie-indexering is opt-in en wordt asynchroon uitgevoerd. Resultaten kunnen enigszins verouderd zijn. Sessielogs staan op schijf, dus behandel bestandssysteemtoegang als de vertrouwensgrens.
</Warning>

---

## SQLite-vectorversnelling (sqlite-vec)

| Sleutel                      | Type      | Standaard | Beschrijving                         |
| ---------------------------- | --------- | --------- | ------------------------------------ |
| `store.vector.enabled`       | `boolean` | `true`    | Gebruik sqlite-vec voor vectorquery's |
| `store.vector.extensionPath` | `string`  | bundled   | Overschrijf het sqlite-vec-pad       |

Wanneer sqlite-vec niet beschikbaar is, valt OpenClaw automatisch terug op in-process cosinusgelijkenis.

---

## Indexopslag

Ingebouwde geheugenindexen bevinden zich in de OpenClaw SQLite-database van elke agent op
`agents/<agentId>/agent/openclaw-agent.sqlite`.

| Sleutel               | Type     | Standaard  | Beschrijving                             |
| --------------------- | -------- | ---------- | ---------------------------------------- |
| `store.fts.tokenizer` | `string` | `unicode61` | FTS5-tokenizer (`unicode61` of `trigram`) |

---

## QMD-backendconfiguratie

Stel `memory.backend = "qmd"` in om dit in te schakelen. Alle QMD-instellingen staan onder `memory.qmd`:

| Sleutel                  | Type      | Standaard | Beschrijving                                                                                      |
| ------------------------ | --------- | --------- | ------------------------------------------------------------------------------------------------- |
| `command`                | `string`  | `qmd`     | Pad naar het QMD-uitvoerbare bestand; stel een absoluut pad in wanneer service-`PATH` afwijkt van je shell |
| `searchMode`             | `string`  | `search`  | Zoekopdracht: `search`, `vsearch`, `query`                                                        |
| `rerank`                 | `boolean` | --        | Stel in op `false` met `searchMode: "query"` en QMD 2.1+ om QMD-herordening over te slaan          |
| `includeDefaultMemory`   | `boolean` | `true`    | Indexeer automatisch `MEMORY.md` + `memory/**/*.md`                                               |
| `paths[]`                | `array`   | --        | Extra paden: `{ name, path, pattern? }`                                                           |
| `sessions.enabled`       | `boolean` | `false`   | Indexeer sessietranscripten                                                                       |
| `sessions.retentionDays` | `number`  | --        | Bewaartermijn voor transcripten                                                                   |
| `sessions.exportDir`     | `string`  | --        | Exportmap                                                                                         |

`searchMode: "search"` is alleen lexicaal/BM25. OpenClaw voert voor die modus geen gereedheidsprobes voor semantische vectoren of QMD-embeddingonderhoud uit, ook niet tijdens `memory status --deep`; `vsearch` en `query` blijven QMD-vectorgereedheid en embeddings vereisen.

`rerank: false` wijzigt alleen de QMD-`query`-modus en vereist QMD 2.1 of nieuwer. In directe CLI-modus geeft OpenClaw `--no-rerank` door; in door mcporter ondersteunde MCP-modus geeft het `rerank: false` door aan de uniforme querytool van QMD. Laat dit niet ingesteld om het standaardgedrag van QMD voor queryherordening te gebruiken.

OpenClaw geeft de voorkeur aan de huidige QMD-collectie- en MCP-queryvormen, maar houdt oudere QMD-releases werkend door waar nodig compatibele collectiepatroonvlaggen en oudere MCP-toolnamen te proberen. Wanneer QMD ondersteuning voor meerdere collectiefilters adverteert, worden collecties met dezelfde bron met één QMD-proces doorzocht; oudere QMD-builds behouden het compatibiliteitspad per collectie. Dezelfde bron betekent dat duurzame geheugencollecties samen worden gegroepeerd, terwijl sessietranscriptcollecties een aparte groep blijven zodat brondiversificatie nog steeds beide invoeren heeft.

<Note>
QMD-modeloverschrijvingen blijven aan de QMD-kant, niet in de OpenClaw-configuratie. Als je QMD-modellen globaal moet overschrijven, stel dan omgevingsvariabelen zoals `QMD_EMBED_MODEL`, `QMD_RERANK_MODEL` en `QMD_GENERATE_MODEL` in de runtimeomgeving van de gateway in.
</Note>

<AccordionGroup>
  <Accordion title="Updateschema">
    | Sleutel                   | Type      | Standaard | Beschrijving                           |
    | ------------------------- | --------- | --------- | -------------------------------------- |
    | `update.interval`         | `string`  | `5m`      | Vernieuwingsinterval                   |
    | `update.debounceMs`       | `number`  | `15000`   | Debounce bestandswijzigingen          |
    | `update.onBoot`           | `boolean` | `true`    | Vernieuw wanneer de langlevende QMD-manager opent; stel in op false om de directe opstartupdate over te slaan |
    | `update.startup`          | `string`  | `off`     | Optionele QMD-initialisatie bij gateway-start: `off`, `idle` of `immediate` |
    | `update.startupDelayMs`   | `number`  | `120000`  | Vertraging voordat vernieuwing met `startup: "idle"` wordt uitgevoerd |
    | `update.waitForBootSync`  | `boolean` | `false`   | Blokkeer het openen van de manager totdat de eerste vernieuwing is voltooid |
    | `update.embedInterval`    | `string`  | --        | Afzonderlijk embeddingritme           |
    | `update.commandTimeoutMs` | `number`  | --        | Time-out voor QMD-opdrachten          |
    | `update.updateTimeoutMs`  | `number`  | --        | Time-out voor QMD-updatebewerkingen   |
    | `update.embedTimeoutMs`   | `number`  | --        | Time-out voor QMD-embeddingbewerkingen |
  </Accordion>
  <Accordion title="Limieten">
    | Sleutel                   | Type     | Standaard | Beschrijving                         |
    | ------------------------- | -------- | --------- | ------------------------------------ |
    | `limits.maxResults`       | `number` | `6`       | Maximaal aantal zoekresultaten       |
    | `limits.maxSnippetChars`  | `number` | --        | Beperk de fragmentlengte             |
    | `limits.maxInjectedChars` | `number` | --        | Beperk het totale aantal geïnjecteerde tekens |
    | `limits.timeoutMs`        | `number` | `4000`    | Zoektime-out                         |
  </Accordion>
  <Accordion title="Bereik">
    Bepaalt welke sessies QMD-zoekresultaten kunnen ontvangen. Hetzelfde schema als [`session.sendPolicy`](/nl/gateway/config-agents#session):

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

    De meegeleverde standaard staat directe sessies en kanaalsessies toe, terwijl groepen nog steeds worden geweigerd.

    Standaard is alleen DM. `match.keyPrefix` matcht de genormaliseerde sessiesleutel; `match.rawKeyPrefix` matcht de ruwe sleutel inclusief `agent:<id>:`.

  </Accordion>
  <Accordion title="Citaten">
    `memory.citations` geldt voor alle backends:

    | Waarde           | Gedrag                                              |
    | ---------------- | --------------------------------------------------- |
    | `auto` (standaard) | Neem `Source: <path#line>`-voettekst op in fragmenten |
    | `on`             | Neem de voettekst altijd op                         |
    | `off`            | Laat de voettekst weg (pad wordt intern nog steeds aan agent doorgegeven) |

  </Accordion>
</AccordionGroup>

Wanneer QMD-initialisatie bij gateway-start is ingeschakeld, start OpenClaw QMD alleen voor in aanmerking komende agents. Als `update.onBoot` true is en er geen interval-/embeddingonderhoud is geconfigureerd, gebruikt het opstarten een eenmalige manager voor de opstartvernieuwing en sluit deze daarna. Als een update- of embeddinginterval is geconfigureerd, opent het opstarten de langlevende QMD-manager zodat die de watcher en intervaltimers kan beheren; `update.onBoot: false` slaat alleen de directe opstartvernieuwing over.

### Volledig QMD-voorbeeld

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

Dreaming wordt geconfigureerd onder `plugins.entries.memory-core.config.dreaming`, niet onder `agents.defaults.memorySearch`.

Dreaming wordt uitgevoerd als één geplande sweep en gebruikt interne light/deep/REM-fasen als implementatiedetail.

Zie [Dreaming](/nl/concepts/dreaming) voor conceptueel gedrag en slash-opdrachten.

### Gebruikersinstellingen

| Sleutel                                | Type      | Standaardmodel | Beschrijving                                                                                                                    |
| -------------------------------------- | --------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`                              | `boolean` | `false`        | Schakel dreaming volledig in of uit                                                                                             |
| `frequency`                            | `string`  | `0 3 * * *`    | Optioneel Cron-ritme voor de volledige dreaming-sweep                                                                           |
| `model`                                | `string`  | default model  | Optionele modeloverschrijving voor de Dream Diary-subagent                                                                      |
| `phases.deep.maxPromotedSnippetTokens` | `number`  | `160`          | Maximaal geschat aantal tokens dat wordt bewaard uit elk kortetermijnherinneringsfragment dat naar `MEMORY.md` wordt gepromoveerd; herkomstmetadata blijft zichtbaar |

### Voorbeeld

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
- Dreaming schrijft machinestatus naar `memory/.dreams/`.
- Dreaming schrijft voor mensen leesbare narratieve uitvoer naar `DREAMS.md` (of bestaande `dreams.md`).
- `dreaming.model` gebruikt de bestaande vertrouwenspoort voor plugin-subagents; stel `plugins.entries.memory-core.subagent.allowModelOverride: true` in voordat je dit inschakelt.
- Dream Diary probeert het één keer opnieuw met het standaardsessiemodel wanneer het geconfigureerde model niet beschikbaar is. Vertrouwens- of allowlist-fouten worden gelogd en worden niet stilzwijgend opnieuw geprobeerd.
- Het beleid en de drempels voor de light/deep/REM-fasen zijn intern gedrag, geen gebruikersgerichte configuratie.

</Note>

## Gerelateerd

- [Configuratiereferentie](/nl/gateway/configuration-reference)
- [Geheugenoverzicht](/nl/concepts/memory)
- [Geheugenzoekfunctie](/nl/concepts/memory-search)
