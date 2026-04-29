---
read_when:
    - Je wilt aanbieders voor geheugenzoekopdrachten of inbeddingsmodellen configureren
    - Je wilt de QMD-backend instellen
    - Je wilt hybride zoeken, MMR of temporeel verval afstemmen
    - Je wilt multimodale geheugenindexering inschakelen
sidebarTitle: Memory config
summary: Alle configuratieopties voor geheugenzoekopdrachten, embeddingproviders, QMD, hybride zoekopdrachten en multimodale indexering
title: Referentie voor geheugenconfiguratie
x-i18n:
    generated_at: "2026-04-29T23:15:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: fbb21d407f7ec9ef76e68c268138892b12568137735b723579703e535d34b195
    source_path: reference/memory-config.md
    workflow: 16
---

Deze pagina vermeldt elke configuratieknop voor OpenClaw-geheugenzoekopdrachten. Zie voor conceptuele overzichten:

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
    Zoekpijplijn en afstemming.
  </Card>
  <Card title="Active memory" href="/nl/concepts/active-memory">
    Geheugen-subagent voor interactieve sessies.
  </Card>
</CardGroup>

Alle instellingen voor geheugenzoekopdrachten staan onder `agents.defaults.memorySearch` in `openclaw.json`, tenzij anders vermeld.

<Note>
Als je zoekt naar de functieschakelaar en subagentconfiguratie voor **actief geheugen**, die staat onder `plugins.entries.active-memory` in plaats van `memorySearch`.

Actief geheugen gebruikt een model met twee poorten:

1. de Plugin moet ingeschakeld zijn en gericht zijn op de huidige agent-id
2. het verzoek moet een geschikte interactieve permanente chatsessie zijn

Zie [Active Memory](/nl/concepts/active-memory) voor het activeringsmodel, de Plugin-eigen configuratie, transcriptpersistentie en het veilige uitrolpatroon.
</Note>

---

## Providerselectie

| Sleutel    | Type      | Standaard        | Beschrijving                                                                                                                                                                                                                      |
| ---------- | --------- | ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider` | `string`  | automatisch gedetecteerd | Embeddingadapter-id zoals `bedrock`, `deepinfra`, `gemini`, `github-copilot`, `local`, `mistral`, `ollama`, `openai` of `voyage`; kan ook een geconfigureerde `models.providers.<id>` zijn waarvan `api` naar een van die adapters wijst |
| `model`    | `string`  | providerstandaard | Naam van het embeddingmodel                                                                                                                                                                                                       |
| `fallback` | `string`  | `"none"`         | Fallbackadapter-id wanneer de primaire adapter faalt                                                                                                                                                                              |
| `enabled`  | `boolean` | `true`           | Geheugenzoekopdrachten in- of uitschakelen                                                                                                                                                                                        |

### Volgorde voor automatische detectie

Wanneer `provider` niet is ingesteld, selecteert OpenClaw de eerste beschikbare optie:

<Steps>
  <Step title="local">
    Geselecteerd als `memorySearch.local.modelPath` is geconfigureerd en het bestand bestaat.
  </Step>
  <Step title="github-copilot">
    Geselecteerd als een GitHub Copilot-token kan worden opgelost (env-var of authprofiel).
  </Step>
  <Step title="openai">
    Geselecteerd als een OpenAI-sleutel kan worden opgelost.
  </Step>
  <Step title="gemini">
    Geselecteerd als een Gemini-sleutel kan worden opgelost.
  </Step>
  <Step title="voyage">
    Geselecteerd als een Voyage-sleutel kan worden opgelost.
  </Step>
  <Step title="mistral">
    Geselecteerd als een Mistral-sleutel kan worden opgelost.
  </Step>
  <Step title="deepinfra">
    Geselecteerd als een DeepInfra-sleutel kan worden opgelost.
  </Step>
  <Step title="bedrock">
    Geselecteerd als de AWS SDK-referentieketen wordt opgelost (instantierol, toegangssleutels, profiel, SSO, webidentiteit of gedeelde configuratie).
  </Step>
</Steps>

`ollama` wordt ondersteund, maar niet automatisch gedetecteerd (stel het expliciet in).

### Aangepaste provider-id's

`memorySearch.provider` kan verwijzen naar een aangepaste `models.providers.<id>`-vermelding. OpenClaw lost de `api`-eigenaar van die provider op voor de embeddingadapter, terwijl de aangepaste provider-id behouden blijft voor endpoint-, auth- en modelprefixafhandeling. Zo kunnen multi-GPU- of multi-host-setups geheugenembeddings toewijzen aan een specifiek lokaal endpoint:

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

Remote embeddings vereisen een API-sleutel. Bedrock gebruikt in plaats daarvan de standaard AWS SDK-referentieketen (instantierollen, SSO, toegangssleutels).

| Provider       | Env-var                                            | Configuratiesleutel                 |
| -------------- | -------------------------------------------------- | ----------------------------------- |
| Bedrock        | AWS-referentieketen                                | Geen API-sleutel nodig              |
| DeepInfra      | `DEEPINFRA_API_KEY`                                | `models.providers.deepinfra.apiKey` |
| Gemini         | `GEMINI_API_KEY`                                   | `models.providers.google.apiKey`    |
| GitHub Copilot | `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, `GITHUB_TOKEN` | Authprofiel via apparaatlogin       |
| Mistral        | `MISTRAL_API_KEY`                                  | `models.providers.mistral.apiKey`   |
| Ollama         | `OLLAMA_API_KEY` (placeholder)                     | --                                  |
| OpenAI         | `OPENAI_API_KEY`                                   | `models.providers.openai.apiKey`    |
| Voyage         | `VOYAGE_API_KEY`                                   | `models.providers.voyage.apiKey`    |

<Note>
Codex OAuth dekt alleen chat/completions en voldoet niet voor embeddingverzoeken.
</Note>

---

## Configuratie van remote endpoints

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

## Provider-specifieke configuratie

<AccordionGroup>
  <Accordion title="Gemini">
    | Sleutel                | Type     | Standaard              | Beschrijving                              |
    | ---------------------- | -------- | ---------------------- | ----------------------------------------- |
    | `model`                | `string` | `gemini-embedding-001` | Ondersteunt ook `gemini-embedding-2-preview` |
    | `outputDimensionality` | `number` | `3072`                 | Voor Embedding 2: 768, 1536 of 3072       |

    <Warning>
    Het wijzigen van model of `outputDimensionality` activeert automatisch een volledige herindexering.
    </Warning>

  </Accordion>
  <Accordion title="OpenAI-compatible input types">
    OpenAI-compatibele embeddingendpoints kunnen provider-specifieke `input_type`-verzoekvelden gebruiken. Dit is nuttig voor asymmetrische embeddingmodellen die verschillende labels vereisen voor query- en documentembeddings.

    | Sleutel             | Type     | Standaard | Beschrijving                                             |
    | ------------------- | -------- | --------- | -------------------------------------------------------- |
    | `inputType`         | `string` | niet ingesteld | Gedeelde `input_type` voor query- en documentembeddings |
    | `queryInputType`    | `string` | niet ingesteld | `input_type` tijdens query's; overschrijft `inputType`  |
    | `documentInputType` | `string` | niet ingesteld | Index-/document-`input_type`; overschrijft `inputType`  |

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
    Bedrock gebruikt de standaard AWS SDK-referentieketen; er zijn geen API-sleutels nodig. Als OpenClaw op EC2 draait met een Bedrock-ingeschakelde instantierol, stel dan alleen de provider en het model in:

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
    | `model`                | `string` | `amazon.titan-embed-text-v2:0` | Elk Bedrock-embeddingmodel-id   |
    | `outputDimensionality` | `number` | modelstandaard                 | Voor Titan V2: 256, 512 of 1024 |

    **Ondersteunde modellen** (met familiedetectie en dimensiestandaarden):

    | Model-id                                   | Provider   | Standaarddimensies | Configureerbare dimensies |
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

    Varianten met throughput-suffixen (bijv. `amazon.titan-embed-text-v1:2:8k`) erven de configuratie van het basismodel.

    **Authenticatie:** Bedrock-auth gebruikt de standaardvolgorde voor AWS SDK-referentieresolutie:

    1. Omgevingsvariabelen (`AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`)
    2. SSO-tokencache
    3. Referenties voor webidentiteitstokens
    4. Gedeelde referentie- en configuratiebestanden
    5. ECS- of EC2-metadatareferenties

    Regio wordt opgelost via `AWS_REGION`, `AWS_DEFAULT_REGION`, de `baseUrl` van de `amazon-bedrock`-provider, of valt terug op `us-east-1`.

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
    | Sleutel               | Type               | Standaard              | Beschrijving                                                                                                                                                                                                                                                                                                           |
    | --------------------- | ------------------ | ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
    | `local.modelPath`     | `string`           | automatisch gedownload | Pad naar GGUF-modelbestand                                                                                                                                                                                                                                                                                             |
    | `local.modelCacheDir` | `string`           | node-llama-cpp-standaard | Cachemap voor gedownloade modellen                                                                                                                                                                                                                                                                                    |
    | `local.contextSize`   | `number \| "auto"` | `4096`                 | Grootte van het contextvenster voor de embedding-context. 4096 dekt typische chunks (128–512 tokens) terwijl niet-gewicht-VRAM wordt begrensd. Verlaag naar 1024–2048 op beperkte hosts. `"auto"` gebruikt het getrainde maximum van het model — niet aanbevolen voor 8B+-modellen (Qwen3-Embedding-8B: 40 960 tokens → ~32 GB VRAM tegenover ~8,8 GB bij 4096). |

    Standaardmodel: `embeddinggemma-300m-qat-Q8_0.gguf` (~0,6 GB, automatisch gedownload). Vereist native build: `pnpm approve-builds` en daarna `pnpm rebuild node-llama-cpp`.

    Gebruik de zelfstandige CLI om hetzelfde providerpad te verifiëren dat de Gateway gebruikt:

    ```bash
    openclaw memory status --deep --agent main
    openclaw memory index --force --agent main
    ```

    Als `provider` `auto` is, wordt `local` alleen geselecteerd wanneer `local.modelPath` naar een bestaand lokaal bestand verwijst. `hf:`- en HTTP(S)-modelverwijzingen kunnen nog steeds expliciet worden gebruikt met `provider: "local"`, maar ze zorgen er niet voor dat `auto` lokaal selecteert voordat het model op schijf beschikbaar is.

  </Accordion>
</AccordionGroup>

### Time-out voor inline embedding

<ParamField path="sync.embeddingBatchTimeoutSeconds" type="number">
  Overschrijf de time-out voor inline embedding-batches tijdens geheugenindexering.

Niet ingesteld gebruikt de providerstandaard: 600 seconden voor lokale/zelfgehoste providers zoals `local`, `ollama` en `lmstudio`, en 120 seconden voor gehoste providers. Verhoog dit wanneer lokale CPU-gebonden embedding-batches gezond maar traag zijn.
</ParamField>

---

## Configuratie voor hybride zoeken

Alles onder `memorySearch.query.hybrid`:

| Sleutel               | Type      | Standaard | Beschrijving                                  |
| --------------------- | --------- | --------- | --------------------------------------------- |
| `enabled`             | `boolean` | `true`    | Hybride BM25 + vectorzoekopdracht inschakelen |
| `vectorWeight`        | `number`  | `0.7`     | Gewicht voor vectorscores (0-1)               |
| `textWeight`          | `number`  | `0.3`     | Gewicht voor BM25-scores (0-1)                |
| `candidateMultiplier` | `number`  | `4`       | Vermenigvuldiger voor grootte van kandidaatpool |

<Tabs>
  <Tab title="MMR (diversiteit)">
    | Sleutel       | Type      | Standaard | Beschrijving                              |
    | ------------- | --------- | --------- | ----------------------------------------- |
    | `mmr.enabled` | `boolean` | `false`   | MMR-herordening inschakelen               |
    | `mmr.lambda`  | `number`  | `0.7`     | 0 = maximale diversiteit, 1 = maximale relevantie |
  </Tab>
  <Tab title="Temporeel verval (recentheid)">
    | Sleutel                      | Type      | Standaard | Beschrijving                         |
    | ---------------------------- | --------- | --------- | ------------------------------------ |
    | `temporalDecay.enabled`      | `boolean` | `false`   | Recentheidsboost inschakelen         |
    | `temporalDecay.halfLifeDays` | `number`  | `30`      | Score halveert elke N dagen          |

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

| Sleutel      | Type       | Beschrijving                                      |
| ------------ | ---------- | ------------------------------------------------- |
| `extraPaths` | `string[]` | Aanvullende mappen of bestanden om te indexeren   |

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

Paden kunnen absoluut of relatief ten opzichte van de workspace zijn. Mappen worden recursief gescand op `.md`-bestanden. Afhandeling van symlinks hangt af van de actieve backend: de ingebouwde engine negeert symlinks, terwijl QMD het gedrag van de onderliggende QMD-scanner volgt.

Voor agent-gebonden transcriptzoekopdrachten tussen agents gebruikt u `agents.list[].memorySearch.qmd.extraCollections` in plaats van `memory.qmd.paths`. Die extra collecties volgen dezelfde `{ path, name, pattern? }`-vorm, maar ze worden per agent samengevoegd en kunnen expliciete gedeelde namen behouden wanneer het pad buiten de huidige workspace wijst. Als hetzelfde opgeloste pad in zowel `memory.qmd.paths` als `memorySearch.qmd.extraCollections` voorkomt, behoudt QMD de eerste vermelding en slaat het het duplicaat over.

---

## Multimodaal geheugen (Gemini)

Indexeer afbeeldingen en audio naast Markdown met Gemini Embedding 2:

| Sleutel                   | Type       | Standaard  | Beschrijving                          |
| ------------------------- | ---------- | ---------- | ------------------------------------- |
| `multimodal.enabled`      | `boolean`  | `false`    | Multimodale indexering inschakelen    |
| `multimodal.modalities`   | `string[]` | --         | `["image"]`, `["audio"]`, of `["all"]` |
| `multimodal.maxFileBytes` | `number`   | `10000000` | Maximale bestandsgrootte voor indexering |

<Note>
Geldt alleen voor bestanden in `extraPaths`. Standaardgeheugenroots blijven alleen Markdown. Vereist `gemini-embedding-2-preview`. `fallback` moet `"none"` zijn.
</Note>

Ondersteunde indelingen: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.heic`, `.heif` (afbeeldingen); `.mp3`, `.wav`, `.ogg`, `.opus`, `.m4a`, `.aac`, `.flac` (audio).

---

## Embeddingcache

| Sleutel            | Type      | Standaard | Beschrijving                         |
| ------------------ | --------- | --------- | ------------------------------------ |
| `cache.enabled`    | `boolean` | `false`   | Cache chunk-embeddings in SQLite     |
| `cache.maxEntries` | `number`  | `50000`   | Maximaal gecachete embeddings        |

Voorkomt het opnieuw embedden van ongewijzigde tekst tijdens herindexering of transcriptupdates.

---

## Batchindexering

| Sleutel                       | Type      | Standaard | Beschrijving                  |
| ----------------------------- | --------- | --------- | ----------------------------- |
| `remote.nonBatchConcurrency`  | `number`  | `4`       | Parallelle inline embeddings  |
| `remote.batch.enabled`        | `boolean` | `false`   | Batch-embedding-API inschakelen |
| `remote.batch.concurrency`    | `number`  | `2`       | Parallelle batchtaken         |
| `remote.batch.wait`           | `boolean` | `true`    | Wachten op voltooiing van batch |
| `remote.batch.pollIntervalMs` | `number`  | --        | Pollinterval                  |
| `remote.batch.timeoutMinutes` | `number`  | --        | Batch-time-out                |

Beschikbaar voor `openai`, `gemini` en `voyage`. OpenAI-batch is doorgaans het snelst en goedkoopst voor grote backfills.

`remote.nonBatchConcurrency` bepaalt inline embedding-aanroepen die worden gebruikt door lokale/zelfgehoste providers en gehoste providers wanneer batch-API's van providers niet actief zijn. Ollama gebruikt standaard `1` voor niet-batchindexering om kleinere lokale hosts niet te overbelasten; stel een hogere waarde in op grotere machines.

Dit staat los van `sync.embeddingBatchTimeoutSeconds`, dat de time-out voor inline embedding-aanroepen bepaalt.

---

## Sessiegeheugen zoeken (experimenteel)

Indexeer sessietranscripten en maak ze beschikbaar via `memory_search`:

| Sleutel                       | Type       | Standaard    | Beschrijving                                |
| ----------------------------- | ---------- | ------------ | ------------------------------------------ |
| `experimental.sessionMemory`  | `boolean`  | `false`      | Sessie-indexering inschakelen              |
| `sources`                     | `string[]` | `["memory"]` | Voeg `"sessions"` toe om transcripten op te nemen |
| `sync.sessions.deltaBytes`    | `number`   | `100000`     | Bytedrempel voor herindexering             |
| `sync.sessions.deltaMessages` | `number`   | `50`         | Berichtdrempel voor herindexering          |

<Warning>
Sessie-indexering is opt-in en wordt asynchroon uitgevoerd. Resultaten kunnen enigszins verouderd zijn. Sessielogs staan op schijf, dus behandel bestandssysteemtoegang als de vertrouwensgrens.
</Warning>

---

## SQLite-vectorversnelling (sqlite-vec)

| Sleutel                      | Type      | Standaard   | Beschrijving                             |
| ---------------------------- | --------- | ----------- | ---------------------------------------- |
| `store.vector.enabled`       | `boolean` | `true`      | Gebruik sqlite-vec voor vectorqueries    |
| `store.vector.extensionPath` | `string`  | meegeleverd | Overschrijf het sqlite-vec-pad           |

Wanneer sqlite-vec niet beschikbaar is, valt OpenClaw automatisch terug op in-process cosinusgelijkenis.

---

## Indexopslag

| Sleutel               | Type     | Standaard                             | Beschrijving                                      |
| --------------------- | -------- | ------------------------------------- | ------------------------------------------------- |
| `store.path`          | `string` | `~/.openclaw/memory/{agentId}.sqlite` | Indexlocatie (ondersteunt `{agentId}`-token)      |
| `store.fts.tokenizer` | `string` | `unicode61`                           | FTS5-tokenizer (`unicode61` of `trigram`)         |

---

## QMD-backendconfiguratie

Stel `memory.backend = "qmd"` in om dit in te schakelen. Alle QMD-instellingen staan onder `memory.qmd`:

| Sleutel                  | Type      | Standaard | Beschrijving                                                                                 |
| ------------------------ | --------- | --------- | -------------------------------------------------------------------------------------------- |
| `command`                | `string`  | `qmd`     | Pad naar QMD-uitvoerbaar bestand; stel een absoluut pad in wanneer de service-`PATH` verschilt van je shell |
| `searchMode`             | `string`  | `search`  | Zoekopdracht: `search`, `vsearch`, `query`                                                    |
| `includeDefaultMemory`   | `boolean` | `true`    | Indexeer automatisch `MEMORY.md` + `memory/**/*.md`                                           |
| `paths[]`                | `array`   | --        | Extra paden: `{ name, path, pattern? }`                                                       |
| `sessions.enabled`       | `boolean` | `false`   | Indexeer sessietranscripten                                                                   |
| `sessions.retentionDays` | `number`  | --        | Bewaartermijn van transcripten                                                                |
| `sessions.exportDir`     | `string`  | --        | Exportdirectory                                                                               |

`searchMode: "search"` is alleen lexicaal/BM25. OpenClaw voert voor die modus geen semantische gereedheidsprobes voor vectoren of QMD-embeddingonderhoud uit, ook niet tijdens `memory status --deep`; `vsearch` en `query` blijven QMD-vectorgereedheid en embeddings vereisen.

OpenClaw geeft de voorkeur aan huidige QMD-collecties en MCP-queryvormen, maar houdt oudere QMD-releases werkend door waar nodig compatibele vlaggen voor collectiepatronen en oudere MCP-toolnamen te proberen. Wanneer QMD ondersteuning voor meerdere collectiefilters meldt, worden collecties met dezelfde bron met één QMD-proces doorzocht; oudere QMD-builds blijven het compatibiliteitspad per collectie gebruiken. Dezelfde bron betekent dat duurzame geheugencollecties samen worden gegroepeerd, terwijl sessietranscriptcollecties een aparte groep blijven, zodat brondifferentiatie nog steeds beide invoeren heeft.

<Note>
QMD-modeloverschrijvingen blijven aan de QMD-kant, niet in de OpenClaw-configuratie. Als je de modellen van QMD globaal moet overschrijven, stel dan omgevingsvariabelen zoals `QMD_EMBED_MODEL`, `QMD_RERANK_MODEL` en `QMD_GENERATE_MODEL` in de runtime-omgeving van de Gateway in.
</Note>

<AccordionGroup>
  <Accordion title="Updateschema">
    | Sleutel                   | Type      | Standaard | Beschrijving                           |
    | ------------------------- | --------- | --------- | -------------------------------------- |
    | `update.interval`         | `string`  | `5m`      | Vernieuwingsinterval                   |
    | `update.debounceMs`       | `number`  | `15000`   | Bestandswijzigingen debouncen          |
    | `update.onBoot`           | `boolean` | `true`    | Vernieuwen wanneer de langlevende QMD-manager wordt geopend; stuurt ook de opt-in-opstartvernieuwing aan |
    | `update.startup`          | `string`  | `off`     | Optionele vernieuwing bij Gateway-start: `off`, `idle` of `immediate` |
    | `update.startupDelayMs`   | `number`  | `120000`  | Vertraging voordat de vernieuwing met `startup: "idle"` wordt uitgevoerd |
    | `update.waitForBootSync`  | `boolean` | `false`   | Het openen van de manager blokkeren totdat de initiële vernieuwing is voltooid |
    | `update.embedInterval`    | `string`  | --        | Afzonderlijk embedritme                |
    | `update.commandTimeoutMs` | `number`  | --        | Time-out voor QMD-commando's           |
    | `update.updateTimeoutMs`  | `number`  | --        | Time-out voor QMD-updatebewerkingen    |
    | `update.embedTimeoutMs`   | `number`  | --        | Time-out voor QMD-embedbewerkingen     |
  </Accordion>
  <Accordion title="Limieten">
    | Sleutel                   | Type     | Standaard | Beschrijving                         |
    | ------------------------- | -------- | --------- | ------------------------------------ |
    | `limits.maxResults`       | `number` | `6`       | Maximaal aantal zoekresultaten       |
    | `limits.maxSnippetChars`  | `number` | --        | Fragmentlengte begrenzen             |
    | `limits.maxInjectedChars` | `number` | --        | Totaal aantal geïnjecteerde tekens begrenzen |
    | `limits.timeoutMs`        | `number` | `4000`    | Zoektime-out                         |
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

    De meegeleverde standaard staat directe sessies en kanaalsessies toe, terwijl groepen nog steeds worden geweigerd.

    Standaard is alleen DM. `match.keyPrefix` komt overeen met de genormaliseerde sessiesleutel; `match.rawKeyPrefix` komt overeen met de ruwe sleutel inclusief `agent:<id>:`.

  </Accordion>
  <Accordion title="Citaties">
    `memory.citations` geldt voor alle backends:

    | Waarde           | Gedrag                                             |
    | ---------------- | -------------------------------------------------- |
    | `auto` (standaard) | `Source: <path#line>`-voettekst opnemen in fragmenten |
    | `on`             | Voettekst altijd opnemen                           |
    | `off`            | Voettekst weglaten (pad wordt intern nog steeds aan de agent doorgegeven) |

  </Accordion>
</AccordionGroup>

QMD-bootvernieuwingen gebruiken tijdens het opstarten van de Gateway een eenmalig subprocespad. De langlevende QMD-manager blijft eigenaar van de reguliere bestandswatcher en intervaltimers wanneer geheugenzoekopdrachten worden geopend voor interactief gebruik.

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

Dreaming wordt uitgevoerd als één geplande sweep en gebruikt interne lichte/diepe/REM-fasen als implementatiedetail.

Zie [Dreaming](/nl/concepts/dreaming) voor conceptueel gedrag en slash-commando's.

### Gebruikersinstellingen

| Sleutel     | Type      | Standaardmodel | Beschrijving                                  |
| ----------- | --------- | -------------- | --------------------------------------------- |
| `enabled`   | `boolean` | `false`        | Dreaming volledig in- of uitschakelen          |
| `frequency` | `string`  | `0 3 * * *`    | Optioneel Cron-ritme voor de volledige Dreaming-sweep |
| `model`     | `string`  | standaardmodel | Optionele modeloverschrijving voor de Dream Diary-subagent |

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
- `dreaming.model` gebruikt de bestaande vertrouwenspoort voor Plugin-subagents; stel `plugins.entries.memory-core.subagent.allowModelOverride: true` in voordat je dit inschakelt.
- Dream Diary probeert het één keer opnieuw met het standaardmodel van de sessie wanneer het geconfigureerde model niet beschikbaar is. Vertrouwens- of allowlistfouten worden gelogd en worden niet stilzwijgend opnieuw geprobeerd.
- Het beleid en de drempels voor de lichte/diepe/REM-fase zijn intern gedrag, geen gebruikersgerichte configuratie.

</Note>

## Gerelateerd

- [Configuratiereferentie](/nl/gateway/configuration-reference)
- [Geheugenoverzicht](/nl/concepts/memory)
- [Geheugen zoeken](/nl/concepts/memory-search)
