---
read_when:
    - Je wilt geheugenzoekproviders of embeddingmodellen configureren
    - Je wilt de QMD-backend instellen
    - Je wilt hybride zoeken, MMR of temporeel verval afstemmen
    - Je wilt multimodale geheugenindexering inschakelen
sidebarTitle: Memory config
summary: Alle configuratieopties voor geheugenzoekopdrachten, embedding-providers, QMD, hybride zoekopdrachten en multimodale indexering
title: Referentie voor geheugenconfiguratie
x-i18n:
    generated_at: "2026-06-28T22:33:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: de7d1c23cd415293001ef59ae2572cd7bfe9a88c70c1e4cf138ee60664ff0ac2
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
    Lokale-first nevencomponent.
  </Card>
  <Card title="Geheugenzoekopdrachten" href="/nl/concepts/memory-search">
    Zoekpijplijn en afstemming.
  </Card>
  <Card title="Active Memory" href="/nl/concepts/active-memory">
    Geheugen-subagent voor interactieve sessies.
  </Card>
</CardGroup>

Alle instellingen voor geheugenzoekopdrachten staan onder `agents.defaults.memorySearch` in `openclaw.json`, tenzij anders vermeld.

<Note>
Als je zoekt naar de functieschakelaar voor **Active Memory** en de subagentconfiguratie, die staat onder `plugins.entries.active-memory` in plaats van `memorySearch`.

Active Memory gebruikt een model met twee poorten:

1. de Plugin moet zijn ingeschakeld en gericht zijn op de huidige agent-id
2. de aanvraag moet een geschikte interactieve persistente chatsessie zijn

Zie [Active Memory](/nl/concepts/active-memory) voor het activatiemodel, de Plugin-eigen configuratie, transcriptpersistentie en een veilig uitrolpatroon.
</Note>

---

## Providerselectie

| Sleutel    | Type      | Standaard        | Beschrijving                                                                                                                                                                                                                                                                               |
| ---------- | --------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `provider` | `string`  | `"openai"`       | Embeddingadapter-id zoals `bedrock`, `deepinfra`, `gemini`, `github-copilot`, `local`, `mistral`, `ollama`, `openai`, `openai-compatible` of `voyage`; kan ook een geconfigureerde `models.providers.<id>` zijn waarvan `api` naar een geheugen-embeddingadapter of OpenAI-compatibele model-API wijst |
| `model`    | `string`  | providerstandaard | Naam van het embeddingmodel                                                                                                                                                                                                                                                                |
| `fallback` | `string`  | `"none"`         | Fallbackadapter-id wanneer de primaire adapter faalt                                                                                                                                                                                                                                       |
| `enabled`  | `boolean` | `true`           | Schakel geheugenzoekopdrachten in of uit                                                                                                                                                                                                                                                   |

Wanneer `provider` niet is ingesteld, gebruikt OpenClaw OpenAI-embeddings. Stel `provider`
expliciet in om Gemini, Voyage, Mistral, DeepInfra, Bedrock, GitHub Copilot,
Ollama, een lokaal GGUF-model of een OpenAI-compatibel `/v1/embeddings`-eindpunt
te gebruiken. Verouderde configuraties die nog `provider: "auto"` zeggen, worden
opgelost naar `openai`.

<Warning>
Het wijzigen van de embeddingprovider, het model, providerinstellingen, bronnen, scope,
chunking of tokenizer kan de bestaande SQLite-vectorindex incompatibel maken.
OpenClaw pauzeert vectorzoekopdrachten en rapporteert een waarschuwing over indexidentiteit
in plaats van automatisch alles opnieuw te embedden. Bouw opnieuw wanneer je klaar bent met
`openclaw memory status --index --agent <id>` of
`openclaw memory index --force --agent <id>`.
</Warning>

Wanneer `provider` niet is ingesteld, de verouderde `provider: "auto"` aanwezig is, of
`provider: "none"` bewust de modus alleen met FTS selecteert, kan geheugenherinnering nog steeds
lexicale FTS-rangschikking gebruiken wanneer embeddings niet beschikbaar zijn.

Expliciete niet-lokale providers falen gesloten. Als je `memorySearch.provider` instelt op
een concrete extern ondersteunde provider zoals OpenAI, Gemini, Voyage, Mistral,
Bedrock, GitHub Copilot, DeepInfra, Ollama, LM Studio of een OpenAI-compatibele
aangepaste provider, en die provider is tijdens runtime niet beschikbaar, retourneert
`memory_search` een resultaat dat aangeeft dat dit niet beschikbaar is in plaats van stilzwijgend
alleen FTS-herinnering te gebruiken. Herstel de provider-/authconfiguratie, schakel over naar
een bereikbare provider, of stel `provider: "none"` in als je bewust alleen FTS-herinnering wilt.

### Aangepaste provider-id's

`memorySearch.provider` kan verwijzen naar een aangepaste `models.providers.<id>`-vermelding voor geheugenspecifieke provideradapters zoals `ollama`, of voor OpenAI-compatibele model-API's zoals `openai-responses` / `openai-completions`. OpenClaw bepaalt de `api`-eigenaar van die provider voor de embeddingadapter, terwijl de aangepaste provider-id behouden blijft voor eindpunt-, auth- en modelprefixafhandeling. Hierdoor kunnen multi-GPU- of multi-hostopstellingen geheugenembeddings toewijzen aan een specifiek lokaal eindpunt:

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

Externe embeddings vereisen een API-sleutel. Bedrock gebruikt in plaats daarvan de standaardreferentieketen van de AWS SDK (instancerollen, SSO, toegangssleutels).

| Provider       | Omgevingsvariabele                              | Configuratiesleutel                 |
| -------------- | ------------------------------------------------ | ----------------------------------- |
| Bedrock        | AWS-referentieketen                              | Geen API-sleutel nodig              |
| DeepInfra      | `DEEPINFRA_API_KEY`                              | `models.providers.deepinfra.apiKey` |
| Gemini         | `GEMINI_API_KEY`                                 | `models.providers.google.apiKey`    |
| GitHub Copilot | `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, `GITHUB_TOKEN` | Authprofiel via apparaatlogin       |
| Mistral        | `MISTRAL_API_KEY`                                | `models.providers.mistral.apiKey`   |
| Ollama         | `OLLAMA_API_KEY` (placeholder)                   | --                                  |
| OpenAI         | `OPENAI_API_KEY`                                 | `models.providers.openai.apiKey`    |
| Voyage         | `VOYAGE_API_KEY`                                 | `models.providers.voyage.apiKey`    |

<Note>
Codex OAuth dekt alleen chat/aanvullingen en voldoet niet voor embeddingaanvragen.
</Note>

---

## Configuratie van externe eindpunten

Gebruik `provider: "openai-compatible"` voor een generieke OpenAI-compatibele
`/v1/embeddings`-server die geen globale OpenAI-chatreferenties moet overnemen.

<ParamField path="remote.baseUrl" type="string">
  Aangepaste basis-URL voor de API.
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
    OpenAI-compatibele embeddingeindpunten kunnen providerspecifieke `input_type`-aanvraagvelden gebruiken. Dit is nuttig voor asymmetrische embeddingmodellen die verschillende labels vereisen voor query- en documentembeddings.

    | Sleutel             | Type     | Standaard | Beschrijving                                             |
    | ------------------- | -------- | --------- | -------------------------------------------------------- |
    | `inputType`         | `string` | niet ingesteld | Gedeelde `input_type` voor query- en documentembeddings  |
    | `queryInputType`    | `string` | niet ingesteld | `input_type` tijdens query's; overschrijft `inputType`   |
    | `documentInputType` | `string` | niet ingesteld | Index-/document-`input_type`; overschrijft `inputType`   |

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

    Het wijzigen van deze waarden beïnvloedt de identiteit van de embeddingcache voor providerbatchindexering en moet worden gevolgd door een herindexering van het geheugen wanneer het upstreammodel de labels verschillend behandelt.

  </Accordion>
  <Accordion title="Bedrock">
    ### Bedrock-embeddingconfiguratie

    Bedrock gebruikt de standaardreferentieketen van de AWS SDK — er zijn geen API-sleutels nodig. Als OpenClaw op EC2 draait met een Bedrock-ingeschakelde instancerol, stel je alleen de provider en het model in:

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

    | Sleutel                | Type     | Standaard                      | Beschrijving                          |
    | ---------------------- | -------- | ------------------------------ | ------------------------------------- |
    | `model`                | `string` | `amazon.titan-embed-text-v2:0` | Elk Bedrock-embeddingmodel-id         |
    | `outputDimensionality` | `number` | modelstandaard                 | Voor Titan V2: 256, 512 of 1024       |

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

    Varianten met throughput-achtervoegsel (bijv. `amazon.titan-embed-text-v1:2:8k`) erven de configuratie van het basismodel.

    **Authenticatie:** Bedrock-authenticatie gebruikt de standaardvolgorde voor credential-resolutie van de AWS SDK:

    1. Omgevingsvariabelen (`AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`)
    2. SSO-tokencache
    3. Credentials voor webidentiteitstokens
    4. Gedeelde credentials- en configuratiebestanden
    5. ECS- of EC2-metadatacredentials

    De regio wordt bepaald op basis van `AWS_REGION`, `AWS_DEFAULT_REGION`, de `amazon-bedrock`-provider `baseUrl`, of valt terug op `us-east-1`.

    **IAM-machtigingen:** de IAM-rol of -gebruiker heeft nodig:

    ```json
    {
      "Effect": "Allow",
      "Action": "bedrock:InvokeModel",
      "Resource": "*"
    }
    ```

    Beperk voor minimale rechten `InvokeModel` tot het specifieke model:

    ```
    arn:aws:bedrock:*::foundation-model/amazon.titan-embed-text-v2:0
    ```

  </Accordion>
  <Accordion title="Local (GGUF + llama.cpp)">
    | Sleutel               | Type               | Standaard              | Beschrijving                                                                                                                                                                                                                                                                                                                                    |
    | --------------------- | ------------------ | ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
    | `local.modelPath`     | `string`           | automatisch gedownload | Pad naar GGUF-modelbestand                                                                                                                                                                                                                                                                                                                       |
    | `local.modelCacheDir` | `string`           | node-llama-cpp-standaard | Cachemap voor gedownloade modellen                                                                                                                                                                                                                                                                                                             |
    | `local.contextSize`   | `number \| "auto"` | `4096`                 | Grootte van het contextvenster voor de embeddingcontext. 4096 dekt typische chunks (128-512 tokens) terwijl niet-gewicht-VRAM begrensd blijft. Verlaag naar 1024-2048 op beperkte hosts. `"auto"` gebruikt het getrainde maximum van het model — niet aanbevolen voor 8B+-modellen (Qwen3-Embedding-8B: 40 960 tokens → ~32 GB VRAM versus ~8.8 GB bij 4096). |

    Installeer eerst de officiële llama.cpp-provider: `openclaw plugins install @openclaw/llama-cpp-provider`.
    Standaardmodel: `embeddinggemma-300m-qat-Q8_0.gguf` (~0.6 GB, automatisch gedownload). Source-checkouts vereisen nog steeds goedkeuring voor native builds: `pnpm approve-builds` en daarna `pnpm rebuild node-llama-cpp`.

    Gebruik de zelfstandige CLI om hetzelfde providerpad te verifiëren dat de Gateway gebruikt:

    ```bash
    openclaw memory status --deep --agent main
    openclaw memory index --force --agent main
    ```

    Stel `provider: "local"` expliciet in voor lokale GGUF-embeddings. `hf:`- en HTTP(S)-modelverwijzingen worden ondersteund voor expliciete lokale configuraties, maar ze wijzigen de standaardprovider niet.

  </Accordion>
</AccordionGroup>

### Timeout voor inline embedding

<ParamField path="sync.embeddingBatchTimeoutSeconds" type="number">
  Overschrijf de timeout voor inline embeddingbatches tijdens geheugenindexering.

Niet ingesteld gebruikt de providerstandaard: 600 seconden voor lokale/zelfgehoste providers zoals `local`, `ollama` en `lmstudio`, en 120 seconden voor gehoste providers. Verhoog dit wanneer lokale CPU-gebonden embeddingbatches gezond maar traag zijn.
</ParamField>

---

## Configuratie voor hybride zoeken

Alles onder `memorySearch.query.hybrid`:

| Sleutel               | Type      | Standaard | Beschrijving                                |
| --------------------- | --------- | --------- | ------------------------------------------- |
| `enabled`             | `boolean` | `true`    | Schakel hybride BM25 + vectorzoeken in      |
| `vectorWeight`        | `number`  | `0.7`     | Gewicht voor vectorscores (0-1)             |
| `textWeight`          | `number`  | `0.3`     | Gewicht voor BM25-scores (0-1)              |
| `candidateMultiplier` | `number`  | `4`       | Vermenigvuldiger voor grootte van kandidaatpool |

<Tabs>
  <Tab title="MMR (diversity)">
    | Sleutel       | Type      | Standaard | Beschrijving                              |
    | ------------- | --------- | --------- | ----------------------------------------- |
    | `mmr.enabled` | `boolean` | `false`   | Schakel MMR-herordening in                |
    | `mmr.lambda`  | `number`  | `0.7`     | 0 = maximale diversiteit, 1 = maximale relevantie |
  </Tab>
  <Tab title="Temporal decay (recency)">
    | Sleutel                      | Type      | Standaard | Beschrijving                         |
    | ---------------------------- | --------- | --------- | ------------------------------------ |
    | `temporalDecay.enabled`      | `boolean` | `false`   | Schakel recentheidsboost in          |
    | `temporalDecay.halfLifeDays` | `number`  | `30`      | Score halveert elke N dagen          |

    Evergreen-bestanden (`MEMORY.md`, bestanden zonder datum in `memory/`) krijgen nooit decay.

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

| Sleutel      | Type       | Beschrijving                                      |
| ------------ | ---------- | ------------------------------------------------- |
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

Paden kunnen absoluut of relatief aan de werkruimte zijn. Mappen worden recursief gescand op `.md`-bestanden. De afhandeling van symlinks hangt af van de actieve backend: de ingebouwde engine negeert symlinks, terwijl QMD het gedrag van de onderliggende QMD-scanner volgt.

Gebruik voor agent-gebonden transcriptzoekopdrachten tussen agents `agents.list[].memorySearch.qmd.extraCollections` in plaats van `memory.qmd.paths`. Die extra verzamelingen volgen dezelfde `{ path, name, pattern? }`-vorm, maar worden per agent samengevoegd en kunnen expliciete gedeelde namen behouden wanneer het pad buiten de huidige werkruimte wijst. Als hetzelfde opgeloste pad zowel in `memory.qmd.paths` als in `memorySearch.qmd.extraCollections` voorkomt, behoudt QMD de eerste vermelding en slaat het de duplicaatvermelding over.

---

## Multimodaal geheugen (Gemini)

Indexeer afbeeldingen en audio naast Markdown met Gemini Embedding 2:

| Sleutel                   | Type       | Standaard  | Beschrijving                           |
| ------------------------- | ---------- | ---------- | -------------------------------------- |
| `multimodal.enabled`      | `boolean`  | `false`    | Multimodale indexering inschakelen     |
| `multimodal.modalities`   | `string[]` | --         | `["image"]`, `["audio"]`, of `["all"]` |
| `multimodal.maxFileBytes` | `number`   | `10000000` | Maximale bestandsgrootte voor indexering |

<Note>
Alleen van toepassing op bestanden in `extraPaths`. Standaard geheugenroots blijven alleen Markdown. Vereist `gemini-embedding-2-preview`. `fallback` moet `"none"` zijn.
</Note>

Ondersteunde indelingen: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.heic`, `.heif` (afbeeldingen); `.mp3`, `.wav`, `.ogg`, `.opus`, `.m4a`, `.aac`, `.flac` (audio).

---

## Embedding-cache

| Sleutel            | Type      | Standaard | Beschrijving                        |
| ------------------ | --------- | --------- | ----------------------------------- |
| `cache.enabled`    | `boolean` | `true`    | Chunk-embeddings cachen in SQLite   |
| `cache.maxEntries` | `number`  | `50000`   | Maximaal aantal gecachte embeddings |

Voorkomt dat ongewijzigde tekst opnieuw wordt ge-embed tijdens herindexering of transcriptupdates.

---

## Batchindexering

| Sleutel                       | Type      | Standaard | Beschrijving                    |
| ----------------------------- | --------- | --------- | ------------------------------- |
| `remote.nonBatchConcurrency`  | `number`  | `4`       | Parallelle inline embeddings    |
| `remote.batch.enabled`        | `boolean` | `false`   | Batch-embedding-API inschakelen |
| `remote.batch.concurrency`    | `number`  | `2`       | Parallelle batchtaken           |
| `remote.batch.wait`           | `boolean` | `true`    | Wachten op batchvoltooiing      |
| `remote.batch.pollIntervalMs` | `number`  | --        | Pollinterval                    |
| `remote.batch.timeoutMinutes` | `number`  | --        | Batch-time-out                  |

Beschikbaar voor `openai`, `gemini` en `voyage`. OpenAI-batches zijn doorgaans het snelst en goedkoopst voor grote backfills.

`remote.nonBatchConcurrency` beheert inline embedding-aanroepen die worden gebruikt door lokale/self-hosted providers en gehoste providers wanneer provider-batch-API's niet actief zijn. Ollama gebruikt standaard `1` voor niet-batchindexering om te voorkomen dat kleinere lokale hosts worden overbelast; stel een hogere waarde in op grotere machines.

Dit staat los van `sync.embeddingBatchTimeoutSeconds`, dat de time-out voor inline embedding-aanroepen beheert.

---

## Zoekopdrachten in sessiegeheugen (experimenteel)

Indexeer sessietranscripten en maak ze beschikbaar via `memory_search`:

| Sleutel                       | Type       | Standaard    | Beschrijving                                |
| ----------------------------- | ---------- | ------------ | ------------------------------------------- |
| `experimental.sessionMemory`  | `boolean`  | `false`      | Sessie-indexering inschakelen               |
| `sources`                     | `string[]` | `["memory"]` | Voeg `"sessions"` toe om transcripten op te nemen |
| `sync.sessions.deltaBytes`    | `number`   | `100000`     | Bytedrempel voor herindexering              |
| `sync.sessions.deltaMessages` | `number`   | `50`         | Berichtdrempel voor herindexering           |

<Warning>
Sessie-indexering is opt-in en draait asynchroon. Resultaten kunnen enigszins verouderd zijn. Sessielogs staan op schijf, dus behandel toegang tot het bestandssysteem als de vertrouwensgrens.
</Warning>

Sessietranscripttreffers volgen ook
[`tools.sessions.visibility`](/nl/gateway/config-tools#toolssessions). De standaardzichtbaarheid
`tree` toont alleen de huidige sessie en sessies die deze heeft gestart. Om
een niet-gerelateerde, door de Gateway gestarte sessie van dezelfde agent vanuit
een andere sessie op te halen, zoals een DM, verruim je de zichtbaarheid bewust
naar `agent` (of alleen naar `all` wanneer ophalen tussen agents ook vereist is
en het agent-naar-agentbeleid dit toestaat).

De onderstaande voorbeelden plaatsen deze instellingen onder `agents.defaults`. Je kunt ook
equivalente `memorySearch`-instellingen toepassen in een override per agent wanneer slechts één
agent sessietranscripten moet indexeren en doorzoeken.

Voor ophalen van Gateway naar DM binnen dezelfde agent:

<Tabs>
  <Tab title="Ingebouwde backend">
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
  <Tab title="QMD-backend">
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

Bij gebruik van QMD exporteren `agents.defaults.memorySearch.experimental.sessionMemory` en
`sources: ["sessions"]` op zichzelf geen transcripten naar QMD. Stel daarnaast ook
`memory.qmd.sessions.enabled: true` in.

---

## SQLite-vectorversnelling (sqlite-vec)

| Sleutel                      | Type      | Standaard | Beschrijving                           |
| ---------------------------- | --------- | --------- | -------------------------------------- |
| `store.vector.enabled`       | `boolean` | `true`    | Gebruik sqlite-vec voor vectorquery's  |
| `store.vector.extensionPath` | `string`  | gebundeld | Overschrijf het pad naar sqlite-vec    |

Wanneer sqlite-vec niet beschikbaar is, valt OpenClaw automatisch terug op in-process cosinusgelijkenis.

---

## Indexopslag

Ingebouwde geheugenindexen staan in de OpenClaw SQLite-database van elke agent op
`agents/<agentId>/agent/openclaw-agent.sqlite`.

| Sleutel               | Type     | Standaard   | Beschrijving                              |
| --------------------- | -------- | ----------- | ----------------------------------------- |
| `store.fts.tokenizer` | `string` | `unicode61` | FTS5-tokenizer (`unicode61` of `trigram`) |

---

## QMD-backendconfig

Stel `memory.backend = "qmd"` in om dit in te schakelen. Alle QMD-instellingen staan onder `memory.qmd`:

| Sleutel                  | Type      | Standaard | Beschrijving                                                                                     |
| ------------------------ | --------- | --------- | ------------------------------------------------------------------------------------------------ |
| `command`                | `string`  | `qmd`     | Pad naar het QMD-uitvoerbare bestand; stel een absoluut pad in wanneer service-`PATH` verschilt van je shell |
| `searchMode`             | `string`  | `search`  | Zoekcommando: `search`, `vsearch`, `query`                                                       |
| `rerank`                 | `boolean` | --        | Stel in op `false` met `searchMode: "query"` en QMD 2.1+ om QMD-herschikking over te slaan       |
| `includeDefaultMemory`   | `boolean` | `true`    | Indexeer `MEMORY.md` + `memory/**/*.md` automatisch                                              |
| `paths[]`                | `array`   | --        | Extra paden: `{ name, path, pattern? }`                                                          |
| `sessions.enabled`       | `boolean` | `false`   | Exporteer sessietranscripten naar QMD                                                            |
| `sessions.retentionDays` | `number`  | --        | Bewaartermijn voor transcripten                                                                  |
| `sessions.exportDir`     | `string`  | --        | Exportmap                                                                                        |

`searchMode: "search"` is alleen lexicaal/BM25. OpenClaw voert voor die modus geen gereedheidsprobes voor semantische vectoren of QMD-embeddingonderhoud uit, ook niet tijdens `memory status --deep`; `vsearch` en `query` blijven QMD-vectorgereedheid en embeddings vereisen.

`rerank: false` wijzigt alleen de QMD-`query`-modus en vereist QMD 2.1 of nieuwer. In directe CLI-modus geeft OpenClaw `--no-rerank` door; in door mcporter ondersteunde MCP-modus geeft het `rerank: false` door aan de uniforme querytool van QMD. Laat dit oningesteld om het standaardgedrag van QMD voor queryherschikking te gebruiken.

OpenClaw geeft de voorkeur aan actuele QMD-collectie- en MCP-queryvormen, maar houdt oudere QMD-releases werkend door waar nodig compatibele vlaggen voor collectiepatronen en oudere MCP-toolnamen te proberen. Wanneer QMD ondersteuning voor meerdere collectiefilters adverteert, worden collecties met dezelfde bron met één QMD-proces doorzocht; oudere QMD-builds behouden het compatibiliteitspad per collectie. Dezelfde bron betekent dat duurzame geheugencollecties samen worden gegroepeerd, terwijl sessietranscriptcollecties een aparte groep blijven zodat brondiversificatie nog steeds beide invoeren heeft.

<Note>
QMD-modeloverrides blijven aan de QMD-kant, niet in OpenClaw-configuratie. Als je de modellen van QMD globaal moet overschrijven, stel dan omgevingsvariabelen zoals `QMD_EMBED_MODEL`, `QMD_RERANK_MODEL` en `QMD_GENERATE_MODEL` in de Gateway-runtimeomgeving in.
</Note>

<AccordionGroup>
  <Accordion title="Updateschema">
    | Sleutel                   | Type      | Standaard | Beschrijving                           |
    | ------------------------- | --------- | --------- | -------------------------------------- |
    | `update.interval`         | `string`  | `5m`      | Vernieuwingsinterval                   |
    | `update.debounceMs`       | `number`  | `15000`   | Bestandswijzigingen debouncen          |
    | `update.onBoot`           | `boolean` | `true`    | Vernieuwen wanneer de langlevende QMD-manager wordt geopend; stel in op false om de directe opstartupdate over te slaan |
    | `update.startup`          | `string`  | `off`     | Optionele QMD-initialisatie bij Gateway-start: `off`, `idle` of `immediate` |
    | `update.startupDelayMs`   | `number`  | `120000`  | Vertraging voordat de vernieuwing voor `startup: "idle"` wordt uitgevoerd |
    | `update.waitForBootSync`  | `boolean` | `false`   | Blokkeer het openen van de manager totdat de eerste vernieuwing is voltooid |
    | `update.embedInterval`    | `string`  | --        | Afzonderlijk embedritme                |
    | `update.commandTimeoutMs` | `number`  | --        | Time-out voor QMD-opdrachten           |
    | `update.updateTimeoutMs`  | `number`  | --        | Time-out voor QMD-updatebewerkingen    |
    | `update.embedTimeoutMs`   | `number`  | --        | Time-out voor QMD-embedbewerkingen     |
  </Accordion>
  <Accordion title="Limieten">
    | Sleutel                   | Type     | Standaard | Beschrijving                    |
    | ------------------------- | -------- | --------- | ------------------------------- |
    | `limits.maxResults`       | `number` | `6`       | Maximaal aantal zoekresultaten  |
    | `limits.maxSnippetChars`  | `number` | --        | Fragmentlengte begrenzen        |
    | `limits.maxInjectedChars` | `number` | --        | Totaal aantal geïnjecteerde tekens begrenzen |
    | `limits.timeoutMs`        | `number` | `4000`    | Zoektime-out                    |
  </Accordion>
  <Accordion title="Bereik">
    Bepaalt welke sessies QMD-zoekresultaten kunnen ontvangen. Zelfde schema als [`session.sendPolicy`](/nl/gateway/config-agents#session):

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

    De meegeleverde standaardinstelling staat directe sessies en kanaalsessies toe, terwijl groepen nog steeds worden geweigerd.

    Standaard is alleen DM. `match.keyPrefix` komt overeen met de genormaliseerde sessiesleutel; `match.rawKeyPrefix` komt overeen met de ruwe sleutel inclusief `agent:<id>:`.

  </Accordion>
  <Accordion title="Citaties">
    `memory.citations` geldt voor alle backends:

    | Waarde           | Gedrag                                              |
    | ---------------- | --------------------------------------------------- |
    | `auto` (standaard) | Neem de footer `Source: <path#line>` op in fragmenten |
    | `on`             | Neem de footer altijd op                            |
    | `off`            | Laat de footer weg (pad wordt intern nog steeds aan de agent doorgegeven) |

  </Accordion>
</AccordionGroup>

Wanneer QMD-initialisatie bij Gateway-start is ingeschakeld, start OpenClaw QMD alleen voor in aanmerking komende agents. Als `update.onBoot` true is en er geen interval-/embedonderhoud is geconfigureerd, gebruikt opstarten een eenmalige manager voor de opstartvernieuwing en sluit die daarna. Als er een update- of embedinterval is geconfigureerd, opent opstarten de langlevende QMD-manager zodat die eigenaar kan zijn van de watcher en intervaltimers; `update.onBoot: false` slaat alleen de directe opstartvernieuwing over.

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

| Sleutel                                | Type      | Standaardmodel | Beschrijving                                                                                                                     |
| -------------------------------------- | --------- | -------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`                              | `boolean` | `false`        | Dreaming volledig in- of uitschakelen                                                                                            |
| `frequency`                            | `string`  | `0 3 * * *`    | Optioneel Cron-ritme voor de volledige Dreaming-sweep                                                                            |
| `model`                                | `string`  | standaardmodel | Optionele modeloverride voor de Dream Diary-subagent                                                                             |
| `phases.deep.maxPromotedSnippetTokens` | `number`  | `160`          | Maximum aantal geschatte tokens dat wordt bewaard uit elk kortetermijnherinneringsfragment dat naar `MEMORY.md` wordt gepromoveerd; herkomstmetadata blijft zichtbaar |

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
- Dreaming schrijft menselijk leesbare narratieve uitvoer naar `DREAMS.md` (of bestaande `dreams.md`).
- `dreaming.model` gebruikt de bestaande vertrouwenspoort voor Plugin-subagents; stel `plugins.entries.memory-core.subagent.allowModelOverride: true` in voordat u dit inschakelt.
- Dream Diary probeert het één keer opnieuw met het standaardsessiemodel wanneer het geconfigureerde model niet beschikbaar is. Vertrouwens- of allowlist-fouten worden gelogd en worden niet stilzwijgend opnieuw geprobeerd.
- Het beleid en de drempels voor de light/deep/REM-fasen zijn intern gedrag, geen gebruikersgerichte configuratie.

</Note>

## Gerelateerd

- [Configuratiereferentie](/nl/gateway/configuration-reference)
- [Overzicht van geheugen](/nl/concepts/memory)
- [Geheugen zoeken](/nl/concepts/memory-search)
