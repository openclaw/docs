---
read_when:
    - Je wilt aanbieders voor geheugenzoekopdrachten of embedding-modellen configureren
    - Je wilt de QMD-backend instellen
    - Je wilt hybride zoeken, MMR of tijdverval afstemmen
    - Je wilt multimodale geheugenindexering inschakelen
sidebarTitle: Memory config
summary: Alle configuratie-instellingen voor geheugenzoekopdrachten, embeddingproviders, QMD, hybride zoekopdrachten en multimodale indexering
title: Referentie voor geheugenconfiguratie
x-i18n:
    generated_at: "2026-05-02T22:22:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 99624a13b4e700da47a523206569d84c6750266fbb648ec73c463be9c5c285d0
    source_path: reference/memory-config.md
    workflow: 16
---

Deze pagina vermeldt elke configuratieknop voor geheugenzoekopdrachten in OpenClaw. Zie voor conceptuele overzichten:

<CardGroup cols={2}>
  <Card title="Memory overview" href="/nl/concepts/memory">
    Hoe geheugen werkt.
  </Card>
  <Card title="Builtin engine" href="/nl/concepts/memory-builtin">
    Standaard SQLite-backend.
  </Card>
  <Card title="QMD engine" href="/nl/concepts/memory-qmd">
    Local-first sidecar.
  </Card>
  <Card title="Memory search" href="/nl/concepts/memory-search">
    Zoekpijplijn en tuning.
  </Card>
  <Card title="Active memory" href="/nl/concepts/active-memory">
    Geheugen-subagent voor interactieve sessies.
  </Card>
</CardGroup>

Alle instellingen voor geheugenzoekopdrachten staan onder `agents.defaults.memorySearch` in `openclaw.json`, tenzij anders vermeld.

<Note>
Als je zoekt naar de functietoggle en subagentconfiguratie voor **Active Memory**, die staat onder `plugins.entries.active-memory` in plaats van `memorySearch`.

Active Memory gebruikt een model met twee poorten:

1. de Plugin moet zijn ingeschakeld en gericht zijn op de huidige agent-id
2. het verzoek moet een geschikte interactieve persistente chatsessie zijn

Zie [Active Memory](/nl/concepts/active-memory) voor het activatiemodel, Plugin-eigen configuratie, transcriptpersistentie en het veilige uitrolpatroon.
</Note>

---

## Providerselectie

| Sleutel    | Type      | Standaard         | Beschrijving                                                                                                                                                                                                                         |
| ---------- | --------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `provider` | `string`  | automatisch gedetecteerd | Embeddingadapter-ID zoals `bedrock`, `deepinfra`, `gemini`, `github-copilot`, `local`, `mistral`, `ollama`, `openai` of `voyage`; kan ook een geconfigureerde `models.providers.<id>` zijn waarvan `api` naar een van die adapters verwijst |
| `model`    | `string`  | providerstandaard | Naam van het embeddingmodel                                                                                                                                                                                                          |
| `fallback` | `string`  | `"none"`          | Fallback-adapter-ID wanneer de primaire adapter faalt                                                                                                                                                                                |
| `enabled`  | `boolean` | `true`            | Geheugenzoekopdrachten in- of uitschakelen                                                                                                                                                                                           |

### Volgorde van automatische detectie

Wanneer `provider` niet is ingesteld, selecteert OpenClaw de eerste beschikbare optie:

<Steps>
  <Step title="local">
    Geselecteerd als `memorySearch.local.modelPath` is geconfigureerd en het bestand bestaat.
  </Step>
  <Step title="github-copilot">
    Geselecteerd als een GitHub Copilot-token kan worden gevonden (env-var of auth-profiel).
  </Step>
  <Step title="openai">
    Geselecteerd als een OpenAI-sleutel kan worden gevonden.
  </Step>
  <Step title="gemini">
    Geselecteerd als een Gemini-sleutel kan worden gevonden.
  </Step>
  <Step title="voyage">
    Geselecteerd als een Voyage-sleutel kan worden gevonden.
  </Step>
  <Step title="mistral">
    Geselecteerd als een Mistral-sleutel kan worden gevonden.
  </Step>
  <Step title="deepinfra">
    Geselecteerd als een DeepInfra-sleutel kan worden gevonden.
  </Step>
  <Step title="bedrock">
    Geselecteerd als de credentialketen van de AWS SDK wordt gevonden (instancerol, toegangssleutels, profiel, SSO, webidentiteit of gedeelde configuratie).
  </Step>
</Steps>

`ollama` wordt ondersteund maar niet automatisch gedetecteerd (stel dit expliciet in).

### Aangepaste provider-id's

`memorySearch.provider` kan naar een aangepaste `models.providers.<id>`-vermelding verwijzen. OpenClaw lost de `api`-eigenaar van die provider op voor de embeddingadapter, terwijl de aangepaste provider-id behouden blijft voor endpoint-, auth- en modelprefixafhandeling. Hierdoor kunnen multi-GPU- of multi-host-setups geheugenembeddings toewijzen aan een specifiek lokaal endpoint:

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

Externe embeddings vereisen een API-sleutel. Bedrock gebruikt in plaats daarvan de standaardcredentialketen van de AWS SDK (instancerollen, SSO, toegangssleutels).

| Provider       | Env-var                                            | Configuratiesleutel                 |
| -------------- | -------------------------------------------------- | ----------------------------------- |
| Bedrock        | AWS-credentialketen                                | Geen API-sleutel nodig              |
| DeepInfra      | `DEEPINFRA_API_KEY`                                | `models.providers.deepinfra.apiKey` |
| Gemini         | `GEMINI_API_KEY`                                   | `models.providers.google.apiKey`    |
| GitHub Copilot | `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, `GITHUB_TOKEN` | Auth-profiel via device-login       |
| Mistral        | `MISTRAL_API_KEY`                                  | `models.providers.mistral.apiKey`   |
| Ollama         | `OLLAMA_API_KEY` (placeholder)                     | --                                  |
| OpenAI         | `OPENAI_API_KEY`                                   | `models.providers.openai.apiKey`    |
| Voyage         | `VOYAGE_API_KEY`                                   | `models.providers.voyage.apiKey`    |

<Note>
Codex OAuth dekt alleen chat/completions en voldoet niet voor embeddingverzoeken.
</Note>

---

## Configuratie van extern endpoint

Voor aangepaste OpenAI-compatibele endpoints of het overschrijven van providerstandaarden:

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

## Providerspecifieke configuratie

<AccordionGroup>
  <Accordion title="Gemini">
    | Sleutel                | Type     | Standaard              | Beschrijving                               |
    | ---------------------- | -------- | ---------------------- | ------------------------------------------ |
    | `model`                | `string` | `gemini-embedding-001` | Ondersteunt ook `gemini-embedding-2-preview` |
    | `outputDimensionality` | `number` | `3072`                 | Voor Embedding 2: 768, 1536 of 3072        |

    <Warning>
    Het wijzigen van het model of `outputDimensionality` activeert automatisch een volledige herindexering.
    </Warning>

  </Accordion>
  <Accordion title="OpenAI-compatible input types">
    OpenAI-compatibele embeddingendpoints kunnen kiezen voor providerspecifieke `input_type`-verzoekvelden. Dit is handig voor asymmetrische embeddingmodellen die verschillende labels vereisen voor query- en documentembeddings.

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

    Het wijzigen van deze waarden beïnvloedt de identiteit van de embeddingcache voor provider-batchindexering en moet worden gevolgd door een geheugenherindexering wanneer het upstreammodel de labels verschillend behandelt.

  </Accordion>
  <Accordion title="Bedrock">
    ### Bedrock-embeddingconfiguratie

    Bedrock gebruikt de standaardcredentialketen van de AWS SDK; er zijn geen API-sleutels nodig. Als OpenClaw op EC2 draait met een Bedrock-geactiveerde instancerol, stel dan alleen de provider en het model in:

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

    | Sleutel                | Type     | Standaard                     | Beschrijving                    |
    | ---------------------- | -------- | ----------------------------- | ------------------------------- |
    | `model`                | `string` | `amazon.titan-embed-text-v2:0` | Elke Bedrock-embeddingmodel-ID  |
    | `outputDimensionality` | `number` | modelstandaard                | Voor Titan V2: 256, 512 of 1024 |

    **Ondersteunde modellen** (met familiedetectie en standaarddimensies):

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

    Varianten met throughput-suffix (bijv. `amazon.titan-embed-text-v1:2:8k`) erven de configuratie van het basismodel.

    **Authenticatie:** Bedrock-auth gebruikt de standaardresolutievolgorde voor credentials van de AWS SDK:

    1. Omgevingsvariabelen (`AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`)
    2. SSO-tokencache
    3. Webidentiteitstokencredentials
    4. Gedeelde credentials- en configuratiebestanden
    5. ECS- of EC2-metadatacredentials

    Regio wordt opgelost vanuit `AWS_REGION`, `AWS_DEFAULT_REGION`, de `baseUrl` van de `amazon-bedrock`-provider, of valt terug op `us-east-1`.

    **IAM-machtigingen:** de IAM-rol of -gebruiker heeft nodig:

    ```json
    {
      "Effect": "Allow",
      "Action": "bedrock:InvokeModel",
      "Resource": "*"
    }
    ```

    Voor least privilege beperk je `InvokeModel` tot het specifieke model:

    ```
    arn:aws:bedrock:*::foundation-model/amazon.titan-embed-text-v2:0
    ```

  </Accordion>
  <Accordion title="Lokaal (GGUF + node-llama-cpp)">
    | Sleutel               | Type               | Standaardwaarde        | Beschrijving                                                                                                                                                                                                                                                                                                          |
    | --------------------- | ------------------ | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
    | `local.modelPath`     | `string`           | automatisch gedownload | Pad naar GGUF-modelbestand                                                                                                                                                                                                                                                                                            |
    | `local.modelCacheDir` | `string`           | standaard van node-llama-cpp | Cachemap voor gedownloade modellen                                                                                                                                                                                                                                                                                    |
    | `local.contextSize`   | `number \| "auto"` | `4096`                 | Grootte van het contextvenster voor de embeddingcontext. 4096 dekt typische chunks (128-512 tokens) en begrenst tegelijk niet-gewicht-VRAM. Verlaag naar 1024-2048 op beperkte hosts. `"auto"` gebruikt het getrainde maximum van het model - niet aanbevolen voor 8B+-modellen (Qwen3-Embedding-8B: 40 960 tokens -> ~32 GB VRAM versus ~8,8 GB bij 4096). |

    Standaardmodel: `embeddinggemma-300m-qat-Q8_0.gguf` (~0,6 GB, automatisch gedownload). Bron-checkouts vereisen nog steeds goedkeuring voor native builds: `pnpm approve-builds` en daarna `pnpm rebuild node-llama-cpp`.

    Gebruik de zelfstandige CLI om hetzelfde providerpad te verifiëren dat de Gateway gebruikt:

    ```bash
    openclaw memory status --deep --agent main
    openclaw memory index --force --agent main
    ```

    Als `provider` `auto` is, wordt `local` alleen geselecteerd wanneer `local.modelPath` naar een bestaand lokaal bestand wijst. `hf:`- en HTTP(S)-modelverwijzingen kunnen nog steeds expliciet worden gebruikt met `provider: "local"`, maar ze zorgen er niet voor dat `auto` lokaal selecteert voordat het model op schijf beschikbaar is.

  </Accordion>
</AccordionGroup>

### Time-out voor inline embeddings

<ParamField path="sync.embeddingBatchTimeoutSeconds" type="number">
  Overschrijf de time-out voor inline embeddingbatches tijdens geheugenindexering.

Indien niet ingesteld, wordt de standaardwaarde van de provider gebruikt: 600 seconden voor lokale/zelfgehoste providers zoals `local`, `ollama` en `lmstudio`, en 120 seconden voor gehoste providers. Verhoog dit wanneer lokale CPU-gebonden embeddingbatches gezond maar traag zijn.
</ParamField>

---

## Configuratie voor hybride zoekopdrachten

Alles onder `memorySearch.query.hybrid`:

| Sleutel               | Type      | Standaardwaarde | Beschrijving                         |
| --------------------- | --------- | --------------- | ------------------------------------ |
| `enabled`             | `boolean` | `true`          | Hybride BM25 + vectorzoeken inschakelen |
| `vectorWeight`        | `number`  | `0.7`           | Gewicht voor vectorscores (0-1)      |
| `textWeight`          | `number`  | `0.3`           | Gewicht voor BM25-scores (0-1)       |
| `candidateMultiplier` | `number`  | `4`             | Vermenigvuldiger voor kandidaatpoolgrootte |

<Tabs>
  <Tab title="MMR (diversiteit)">
    | Sleutel       | Type      | Standaardwaarde | Beschrijving                            |
    | ------------- | --------- | --------------- | --------------------------------------- |
    | `mmr.enabled` | `boolean` | `false`         | MMR-herrangschikking inschakelen        |
    | `mmr.lambda`  | `number`  | `0.7`           | 0 = maximale diversiteit, 1 = maximale relevantie |
  </Tab>
  <Tab title="Tijdverval (recentheid)">
    | Sleutel                      | Type      | Standaardwaarde | Beschrijving                      |
    | ---------------------------- | --------- | --------------- | --------------------------------- |
    | `temporalDecay.enabled`      | `boolean` | `false`         | Recentheidsboost inschakelen      |
    | `temporalDecay.halfLifeDays` | `number`  | `30`            | Score halveert elke N dagen       |

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

| Sleutel      | Type       | Beschrijving                                |
| ------------ | ---------- | ------------------------------------------- |
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

Paden kunnen absoluut of werkruimte-relatief zijn. Mappen worden recursief gescand op `.md`-bestanden. Symlinkafhandeling hangt af van de actieve backend: de ingebouwde engine negeert symlinks, terwijl QMD het gedrag van de onderliggende QMD-scanner volgt.

Gebruik voor agent-scoped cross-agent transcript search `agents.list[].memorySearch.qmd.extraCollections` in plaats van `memory.qmd.paths`. Die extra verzamelingen volgen dezelfde vorm `{ path, name, pattern? }`, maar ze worden per agent samengevoegd en kunnen expliciete gedeelde namen behouden wanneer het pad buiten de huidige werkruimte wijst. Als hetzelfde opgeloste pad voorkomt in zowel `memory.qmd.paths` als `memorySearch.qmd.extraCollections`, behoudt QMD de eerste vermelding en slaat het duplicaat over.

---

## Multimodaal geheugen (Gemini)

Indexeer afbeeldingen en audio naast Markdown met Gemini Embedding 2:

| Sleutel                   | Type       | Standaardwaarde | Beschrijving                          |
| ------------------------- | ---------- | --------------- | ------------------------------------- |
| `multimodal.enabled`      | `boolean`  | `false`         | Multimodale indexering inschakelen    |
| `multimodal.modalities`   | `string[]` | --              | `["image"]`, `["audio"]`, of `["all"]` |
| `multimodal.maxFileBytes` | `number`   | `10000000`      | Maximale bestandsgrootte voor indexering |

<Note>
Geldt alleen voor bestanden in `extraPaths`. Standaardgeheugenroots blijven uitsluitend Markdown. Vereist `gemini-embedding-2-preview`. `fallback` moet `"none"` zijn.
</Note>

Ondersteunde formaten: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.heic`, `.heif` (afbeeldingen); `.mp3`, `.wav`, `.ogg`, `.opus`, `.m4a`, `.aac`, `.flac` (audio).

---

## Embedding-cache

| Sleutel            | Type      | Standaard | Beschrijving                    |
| ------------------ | --------- | --------- | -------------------------------- |
| `cache.enabled`    | `boolean` | `false`   | Cache chunk-embeddings in SQLite |
| `cache.maxEntries` | `number`  | `50000`   | Max. gecachte embeddings         |

Voorkomt dat ongewijzigde tekst opnieuw wordt ge-embed tijdens herindexering of transcriptupdates.

---

## Batchindexering

| Sleutel                       | Type      | Standaard | Beschrijving                  |
| ----------------------------- | --------- | --------- | ----------------------------- |
| `remote.nonBatchConcurrency`  | `number`  | `4`       | Parallelle inline embeddings  |
| `remote.batch.enabled`        | `boolean` | `false`   | Batch-embedding-API inschakelen |
| `remote.batch.concurrency`    | `number`  | `2`       | Parallelle batchtaken         |
| `remote.batch.wait`           | `boolean` | `true`    | Wachten op batchvoltooiing    |
| `remote.batch.pollIntervalMs` | `number`  | --        | Poll-interval                 |
| `remote.batch.timeoutMinutes` | `number`  | --        | Batch-time-out                |

Beschikbaar voor `openai`, `gemini` en `voyage`. OpenAI-batches zijn doorgaans het snelst en goedkoopst voor grote backfills.

`remote.nonBatchConcurrency` bepaalt inline embedding-aanroepen die worden gebruikt door lokale/zelfgehoste providers en gehoste providers wanneer provider-batch-API's niet actief zijn. Ollama gebruikt standaard `1` voor niet-batchindexering om kleinere lokale hosts niet te overbelasten; stel een hogere waarde in op grotere machines.

Dit staat los van `sync.embeddingBatchTimeoutSeconds`, dat de time-out voor inline embedding-aanroepen bepaalt.

---

## Zoeken in sessiegeheugen (experimenteel)

Indexeer sessietranscripten en maak ze beschikbaar via `memory_search`:

| Sleutel                       | Type       | Standaard    | Beschrijving                                  |
| ----------------------------- | ---------- | ------------ | --------------------------------------------- |
| `experimental.sessionMemory`  | `boolean`  | `false`      | Sessie-indexering inschakelen                 |
| `sources`                     | `string[]` | `["memory"]` | Voeg `"sessions"` toe om transcripten op te nemen |
| `sync.sessions.deltaBytes`    | `number`   | `100000`     | Bytedrempel voor herindexering                |
| `sync.sessions.deltaMessages` | `number`   | `50`         | Berichtdrempel voor herindexering             |

<Warning>
Sessie-indexering is opt-in en wordt asynchroon uitgevoerd. Resultaten kunnen licht verouderd zijn. Sessielogboeken staan op schijf, dus behandel toegang tot het bestandssysteem als de vertrouwensgrens.
</Warning>

---

## SQLite-vectorversnelling (sqlite-vec)

| Sleutel                      | Type      | Standaard | Beschrijving                          |
| ---------------------------- | --------- | --------- | ------------------------------------- |
| `store.vector.enabled`       | `boolean` | `true`    | Gebruik sqlite-vec voor vectorquery's |
| `store.vector.extensionPath` | `string`  | gebundeld | Overschrijf sqlite-vec-pad            |

Wanneer sqlite-vec niet beschikbaar is, valt OpenClaw automatisch terug op in-process cosinusgelijkenis.

---

## Indexopslag

| Sleutel               | Type     | Standaard                             | Beschrijving                                  |
| --------------------- | -------- | ------------------------------------- | --------------------------------------------- |
| `store.path`          | `string` | `~/.openclaw/memory/{agentId}.sqlite` | Indexlocatie (ondersteunt `{agentId}`-token)  |
| `store.fts.tokenizer` | `string` | `unicode61`                           | FTS5-tokenizer (`unicode61` of `trigram`)     |

---

## QMD-backendconfiguratie

Stel `memory.backend = "qmd"` in om dit in te schakelen. Alle QMD-instellingen staan onder `memory.qmd`:

| Sleutel                  | Type      | Standaard | Beschrijving                                                                            |
| ------------------------ | --------- | --------- | ---------------------------------------------------------------------------------------- |
| `command`                | `string`  | `qmd`     | Pad naar QMD-uitvoerbaar bestand; stel een absoluut pad in wanneer service-`PATH` afwijkt van je shell |
| `searchMode`             | `string`  | `search`  | Zoekopdracht: `search`, `vsearch`, `query`                                               |
| `includeDefaultMemory`   | `boolean` | `true`    | `MEMORY.md` + `memory/**/*.md` automatisch indexeren                                     |
| `paths[]`                | `array`   | --        | Extra paden: `{ name, path, pattern? }`                                                  |
| `sessions.enabled`       | `boolean` | `false`   | Sessietranscripten indexeren                                                            |
| `sessions.retentionDays` | `number`  | --        | Transcriptbewaartermijn                                                                 |
| `sessions.exportDir`     | `string`  | --        | Exportmap                                                                               |

`searchMode: "search"` is alleen lexicaal/BM25. OpenClaw voert geen gereedheidsprobes voor semantische vectoren of QMD-embeddingonderhoud uit voor die modus, ook niet tijdens `memory status --deep`; `vsearch` en `query` blijven QMD-vectorgereedheid en embeddings vereisen.

OpenClaw geeft de voorkeur aan de huidige QMD-collectie- en MCP-queryvormen, maar houdt oudere QMD-releases werkend door waar nodig compatibele collectiepatroonflags en oudere MCP-toolnamen te proberen. Wanneer QMD ondersteuning voor meerdere collectiefilters adverteert, worden collecties met dezelfde bron met één QMD-proces doorzocht; oudere QMD-builds blijven het compatibiliteitspad per collectie gebruiken. Dezelfde bron betekent dat duurzame geheugencollecties samen worden gegroepeerd, terwijl sessietranscriptcollecties een aparte groep blijven, zodat brondiversificatie nog steeds beide invoeren heeft.

<Note>
QMD-modeloverrides blijven aan de QMD-kant, niet in de OpenClaw-configuratie. Als je QMD's modellen globaal moet overschrijven, stel dan omgevingsvariabelen zoals `QMD_EMBED_MODEL`, `QMD_RERANK_MODEL` en `QMD_GENERATE_MODEL` in de Gateway-runtimeomgeving in.
</Note>

<AccordionGroup>
  <Accordion title="Updateschema">
    | Sleutel                   | Type      | Standaard | Beschrijving                           |
    | ------------------------- | --------- | --------- | -------------------------------------- |
    | `update.interval`         | `string`  | `5m`      | Vernieuwingsinterval                   |
    | `update.debounceMs`       | `number`  | `15000`   | Bestandswijzigingen debouncen          |
    | `update.onBoot`           | `boolean` | `true`    | Vernieuwen wanneer de langlevende QMD-manager opent; bewaakt ook opt-in startvernieuwing |
    | `update.startup`          | `string`  | `off`     | Optionele vernieuwing bij Gateway-start: `off`, `idle` of `immediate` |
    | `update.startupDelayMs`   | `number`  | `120000`  | Vertraging voordat `startup: "idle"`-vernieuwing wordt uitgevoerd |
    | `update.waitForBootSync`  | `boolean` | `false`   | Manager openen blokkeren tot de eerste vernieuwing is voltooid |
    | `update.embedInterval`    | `string`  | --        | Afzonderlijk embeddingritme           |
    | `update.commandTimeoutMs` | `number`  | --        | Time-out voor QMD-commando's           |
    | `update.updateTimeoutMs`  | `number`  | --        | Time-out voor QMD-updatebewerkingen    |
    | `update.embedTimeoutMs`   | `number`  | --        | Time-out voor QMD-embeddingbewerkingen |
  </Accordion>
  <Accordion title="Limieten">
    | Sleutel                   | Type     | Standaard | Beschrijving                    |
    | ------------------------- | -------- | --------- | -------------------------------- |
    | `limits.maxResults`       | `number` | `6`       | Maximaal aantal zoekresultaten   |
    | `limits.maxSnippetChars`  | `number` | --        | Snippetlengte begrenzen          |
    | `limits.maxInjectedChars` | `number` | --        | Totaal aantal geïnjecteerde tekens begrenzen |
    | `limits.timeoutMs`        | `number` | `4000`    | Zoektime-out                     |
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

    De meegeleverde standaardinstelling staat directe sessies en kanaalsessies toe, terwijl groepen nog steeds worden geweigerd.

    Standaard is alleen DM. `match.keyPrefix` matcht de genormaliseerde sessiesleutel; `match.rawKeyPrefix` matcht de ruwe sleutel inclusief `agent:<id>:`.

  </Accordion>
  <Accordion title="Citaties">
    `memory.citations` geldt voor alle backends:

    | Waarde           | Gedrag                                             |
    | ---------------- | -------------------------------------------------- |
    | `auto` (standaard) | `Source: <path#line>`-footer opnemen in snippets |
    | `on`             | Footer altijd opnemen                             |
    | `off`            | Footer weglaten (pad wordt intern nog steeds aan agent doorgegeven) |

  </Accordion>
</AccordionGroup>

QMD-opstartvernieuwingen gebruiken een eenmalig subprocesspad tijdens het starten van de Gateway. De langlevende QMD-manager blijft eigenaar van de reguliere bestandswatcher en intervaltimers wanneer geheugenzoekopdracht wordt geopend voor interactief gebruik.

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

Dreaming draait als één geplande sweep en gebruikt interne light/deep/REM-fasen als implementatiedetail.

Zie [Dreaming](/nl/concepts/dreaming) voor conceptueel gedrag en slashcommando's.

### Gebruikersinstellingen

| Sleutel     | Type      | Standaardmodel | Beschrijving                                      |
| ----------- | --------- | -------------- | ------------------------------------------------- |
| `enabled`   | `boolean` | `false`        | Dreaming volledig in- of uitschakelen             |
| `frequency` | `string`  | `0 3 * * *`    | Optioneel cronritme voor de volledige Dreaming-sweep |
| `model`     | `string`  | standaardmodel | Optionele modeloverride voor de Dream Diary-subagent |

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
- Dreaming schrijft menselijk leesbare narratieve uitvoer naar `DREAMS.md` (of bestaand `dreams.md`).
- `dreaming.model` gebruikt de bestaande vertrouwenspoort voor Plugin-subagents; stel `plugins.entries.memory-core.subagent.allowModelOverride: true` in voordat je dit inschakelt.
- Dream Diary probeert het één keer opnieuw met het standaardmodel van de sessie wanneer het geconfigureerde model niet beschikbaar is. Vertrouwens- of allowlistfouten worden gelogd en worden niet stilzwijgend opnieuw geprobeerd.
- Het beleid en de drempels voor de light/deep/REM-fasen zijn intern gedrag, geen gebruikersgerichte configuratie.

</Note>

## Gerelateerd

- [Configuratiereferentie](/nl/gateway/configuration-reference)
- [Geheugenoverzicht](/nl/concepts/memory)
- [Geheugenzoekopdracht](/nl/concepts/memory-search)
