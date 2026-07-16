---
read_when:
    - Je wilt aanbieders voor geheugenzoekopdrachten of embeddingmodellen configureren
    - Je wilt de QMD-backend instellen
    - Je wilt hybride zoeken, MMR of tijdsverval afstemmen
    - Je wilt multimodale geheugenindexering inschakelen
sidebarTitle: Memory config
summary: Alle configuratieopties voor geheugenzoekopdrachten, embeddingproviders, QMD, hybride zoekopdrachten en multimodale indexering
title: Referentie voor geheugenconfiguratie
x-i18n:
    generated_at: "2026-07-16T16:31:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 1947d6d654de85059ef777a3a6387f6db5b76c8d688fbb539a063162d323c1f6
    source_path: reference/memory-config.md
    workflow: 16
---

Deze pagina vermeldt elke configuratieoptie voor het doorzoeken van het OpenClaw-geheugen. Zie voor conceptuele overzichten:

<CardGroup cols={2}>
  <Card title="Geheugenoverzicht" href="/nl/concepts/memory">
    Hoe het geheugen werkt.
  </Card>
  <Card title="Ingebouwde engine" href="/nl/concepts/memory-builtin">
    Standaard SQLite-backend.
  </Card>
  <Card title="QMD-engine" href="/nl/concepts/memory-qmd">
    Local-first-sidecar.
  </Card>
  <Card title="Geheugen doorzoeken" href="/nl/concepts/memory-search">
    Zoekpijplijn en afstemming.
  </Card>
  <Card title="Active Memory" href="/nl/concepts/active-memory">
    Geheugensubagent voor interactieve sessies.
  </Card>
</CardGroup>

Alle instellingen voor het doorzoeken van het geheugen bevinden zich onder `agents.defaults.memorySearch` in `openclaw.json` (of een overschrijving per agent via `agents.list[].memorySearch`), tenzij anders vermeld.

<Note>
Als je de functieschakelaar en subagentconfiguratie voor **Active Memory** zoekt, vind je die onder `plugins.entries.active-memory` in plaats van `memorySearch`.

Active Memory gebruikt een model met twee voorwaarden:

1. de Plugin moet zijn ingeschakeld en op de huidige agent-id zijn gericht
2. de aanvraag moet een geschikte interactieve, persistente chatsessie zijn

Zie [Active Memory](/nl/concepts/active-memory) voor het activeringsmodel, de configuratie die eigendom is van de Plugin, transcriptpersistentie en een veilig uitrolpatroon.
</Note>

---

## Providerselectie

| Sleutel    | Type      | Standaard        | Beschrijving                                                                                                                                                                                                                                                                                 |
| ---------- | --------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`  | `boolean` | `true`           | Geheugenzoekfunctie in- of uitschakelen                                                                                                                                                                                                                                                     |
| `provider` | `string`  | `"openai"`       | ID van de embeddingadapter, zoals `bedrock`, `deepinfra`, `gemini`, `github-copilot`, `local`, `mistral`, `ollama`, `openai`, `openai-compatible` of `voyage`; kan ook een geconfigureerde `models.providers.<id>` zijn waarvan `api` naar een geheugenembeddingadapter of OpenAI-compatibele model-API verwijst |
| `model`    | `string`  | standaard van provider | Naam van het embeddingmodel                                                                                                                                                                                                                                                          |
| `fallback` | `string`  | `"none"`         | ID van de terugvaladapter wanneer de primaire adapter mislukt                                                                                                                                                                                                                                |

Wanneer `provider` niet is ingesteld, gebruikt OpenClaw OpenAI-embeddings. Stel `provider`
expliciet in om Bedrock, DeepInfra, Gemini, GitHub Copilot, Mistral, Ollama,
Voyage, een lokaal GGUF-model of een OpenAI-compatibel `/v1/embeddings`-eindpunt te gebruiken.
Verouderde configuraties die nog `provider: "auto"` vermelden, worden omgezet naar `openai`.

<Warning>
Als je de embeddingprovider, het model, de providerinstellingen, bronnen, het bereik,
de chunking of de tokenizer wijzigt, kan de bestaande SQLite-vectorindex incompatibel worden.
OpenClaw pauzeert het vectorzoeken en meldt een waarschuwing over de indexidentiteit in plaats van
alles automatisch opnieuw van embeddings te voorzien. Bouw de index opnieuw wanneer je er klaar voor bent met
`openclaw memory status --index --agent <id>` of
`openclaw memory index --force --agent <id>`.
</Warning>

Wanneer `provider` niet is ingesteld, de verouderde `provider: "auto"` aanwezig is, of
`provider: "none"` bewust alleen-FTS-modus selecteert, kan het ophalen uit het geheugen nog steeds
lexicale FTS-rangschikking gebruiken wanneer embeddings niet beschikbaar zijn.

Expliciete niet-lokale providers werken fail-closed. Als je `memorySearch.provider` instelt op
een concrete provider met externe backend, zoals Bedrock, DeepInfra, Gemini, GitHub
Copilot, LM Studio, Mistral, Ollama, OpenAI, Voyage of een OpenAI-compatibele
aangepaste provider, en die provider tijdens runtime niet beschikbaar is, retourneert `memory_search`
een resultaat dat aangeeft dat de provider niet beschikbaar is, in plaats van stilzwijgend alleen-FTS-ophalen te gebruiken. Herstel de
provider-/authenticatieconfiguratie, schakel over naar een bereikbare provider of stel
`provider: "none"` in als je bewust alleen-FTS-ophalen wilt gebruiken.

### Aangepaste provider-id's

`memorySearch.provider` kan verwijzen naar een aangepaste `models.providers.<id>`-vermelding voor geheugenspecifieke provideradapters zoals `ollama`, of voor OpenAI-compatibele model-API's zoals `openai-responses` / `openai-completions`. OpenClaw bepaalt de eigenaar van `api` van die provider voor de embeddingadapter, terwijl de aangepaste provider-id behouden blijft voor de verwerking van eindpunten, authenticatie en modelvoorvoegsels. Hierdoor kunnen opstellingen met meerdere GPU's of hosts geheugenembeddings aan een specifiek lokaal eindpunt toewijzen:

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

### API-sleutel bepalen

Externe embeddings vereisen een API-sleutel. Bedrock gebruikt in plaats daarvan de standaardreferentieketen van de AWS SDK (instantie-rollen, SSO, toegangssleutels of een Bedrock-API-sleutel).

| Provider       | Omgevingsvariabele                                 | Configuratiesleutel                |
| -------------- | --------------------------------------------------- | ----------------------------------- |
| Bedrock        | AWS-referentieketen of `AWS_BEARER_TOKEN_BEDROCK` | Geen API-sleutel nodig             |
| DeepInfra      | `DEEPINFRA_API_KEY`                                 | `models.providers.deepinfra.apiKey` |
| Gemini         | `GEMINI_API_KEY`                                    | `models.providers.google.apiKey`    |
| GitHub Copilot | `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, `GITHUB_TOKEN`  | Authenticatieprofiel via apparaataanmelding |
| Mistral        | `MISTRAL_API_KEY`                                   | `models.providers.mistral.apiKey`   |
| Ollama         | `OLLAMA_API_KEY` (tijdelijke aanduiding)            | --                                  |
| OpenAI         | `OPENAI_API_KEY`                                    | `models.providers.openai.apiKey`    |
| Voyage         | `VOYAGE_API_KEY`                                    | `models.providers.voyage.apiKey`    |

<Note>
Codex OAuth geldt alleen voor chat/aanvullingen en voldoet niet aan embeddingaanvragen.
</Note>

---

## Configuratie van extern eindpunt

Gebruik `provider: "openai-compatible"` voor een generieke OpenAI-compatibele
`/v1/embeddings`-server die geen globale OpenAI-chatreferenties mag overnemen.

<ParamField path="remote.baseUrl" type="string">
  Aangepaste basis-URL voor de API.
</ParamField>
<ParamField path="remote.apiKey" type="string">
  Overschrijvende API-sleutel.
</ParamField>
<ParamField path="remote.headers" type="object">
  Extra HTTP-headers (samengevoegd met de standaardwaarden van de provider).
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
    | Sleutel                | Type     | Standaard              | Beschrijving                               |
    | ---------------------- | -------- | ---------------------- | ------------------------------------------- |
    | `model`                | `string` | `gemini-embedding-001` | Ondersteunt ook `gemini-embedding-2-preview` |
    | `outputDimensionality` | `number` | `3072`                 | Voor Embedding 2: 768, 1536 of 3072        |

    <Warning>
    Als je het model of `outputDimensionality` wijzigt, verandert de indexidentiteit. OpenClaw
    pauzeert het vectorzoeken totdat je de geheugenindex expliciet opnieuw opbouwt.
    </Warning>

  </Accordion>
  <Accordion title="Invoertypen voor OpenAI-compatibele endpoints">
    OpenAI-compatibele embeddingeindpunten kunnen zich aanmelden voor providerspecifieke `input_type`-aanvraagvelden. Dit is nuttig voor asymmetrische embeddingmodellen die verschillende labels vereisen voor query- en documentembeddings.

    | Sleutel             | Type     | Standaard    | Beschrijving                                             |
    | ------------------- | -------- | ------------ | -------------------------------------------------------- |
    | `inputType`         | `string` | niet ingesteld | Gedeelde `input_type` voor query- en documentembeddings   |
    | `queryInputType`    | `string` | niet ingesteld | `input_type` tijdens query's; overschrijft `inputType`          |
    | `documentInputType` | `string` | niet ingesteld | `input_type` voor index/document; overschrijft `inputType`      |

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

    Het wijzigen van deze waarden beïnvloedt de identiteit van de embeddingcache voor batchindexering door de provider en moet worden gevolgd door het opnieuw indexeren van het geheugen wanneer het upstreammodel de labels verschillend behandelt.

  </Accordion>
  <Accordion title="Bedrock">
    ### Bedrock-embeddingconfiguratie

    Bedrock gebruikt de standaardreferentieketen van de AWS SDK plus een door OpenClaw gecontroleerd bearertoken, zodat er geen API-sleutels in de configuratie worden opgeslagen. Als OpenClaw op EC2 draait met een instantie-rol waarvoor Bedrock is ingeschakeld, hoef je alleen de provider en het model in te stellen:

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
    | ---------------------- | -------- | ------------------------------- | -------------------------------- |
    | `model`                | `string` | `amazon.titan-embed-text-v2:0` | Elke ID van een Bedrock-embeddingmodel |
    | `outputDimensionality` | `number` | standaard van het model         | Voor Titan V2: 256, 512 of 1024 |

    **Ondersteunde modellen** (met detectie van modelfamilies en standaarddimensies):

    | Model-ID                                    | Provider   | Standaarddimensies | Configureerbare dimensies   |
    | ------------------------------------------- | ---------- | ------------------ | --------------------------- |
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

    Varianten met een doorvoersnelheidsachtervoegsel (bijv. `amazon.titan-embed-text-v1:2:8k`) en inferentieprofiel-ID's met een regiovoorvoegsel (bijv. `us.amazon.titan-embed-text-v2:0`) nemen de configuratie van het basismodel over.

    **Regio:** wordt in deze volgorde bepaald: de overschrijving `memorySearch.remote.baseUrl`, de configuratie `models.providers.amazon-bedrock.baseUrl`, `AWS_REGION`, `AWS_DEFAULT_REGION`, en vervolgens standaard `us-east-1`.

    **Authenticatie:** OpenClaw controleert eerst op `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY` of `AWS_BEARER_TOKEN_BEDROCK` en valt daarna terug op de standaardketen van credentialproviders van de AWS SDK:

    1. Omgevingsvariabelen (`AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`), tenzij `AWS_PROFILE` ook is ingesteld
    2. SSO (alleen wanneer SSO-velden zijn geconfigureerd)
    3. Gedeelde credentials- en configuratiebestanden (`fromIni`, inclusief `AWS_PROFILE`)
    4. Credentialproces (`credential_process` in het AWS-configuratiebestand)
    5. Webidentiteitstokencredentials
    6. Credentials uit ECS- of EC2-instantiemetadata

    **IAM-machtigingen:** de IAM-rol of -gebruiker heeft het volgende nodig:

    ```json
    {
      "Effect": "Allow",
      "Action": "bedrock:InvokeModel",
      "Resource": "*"
    }
    ```

    Beperk voor minimale machtigingen `InvokeModel` tot het specifieke model:

    ```text
    arn:aws:bedrock:*::foundation-model/amazon.titan-embed-text-v2:0
    ```

  </Accordion>
  <Accordion title="Lokaal (GGUF + llama.cpp)">
    | Sleutel               | Type               | Standaard               | Beschrijving                                                                                                                                                                                                                                                                                                         |
    | --------------------- | ------------------ | ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
    | `local.modelPath`     | `string`           | automatisch gedownload | Pad naar het GGUF-modelbestand                                                                                                                                                                                                                                                                                       |
    | `local.modelCacheDir` | `string`           | standaard van node-llama-cpp | Cachemap voor gedownloade modellen                                                                                                                                                                                                                                                                               |
    | `local.contextSize`   | `number \| "auto"` | `4096`                 | Grootte van het contextvenster voor de embeddingcontext. 4096 dekt gangbare fragmenten (128-512 tokens) en begrenst tegelijk het VRAM dat niet voor gewichten wordt gebruikt. Verlaag dit op beperkte hosts naar 1024-2048. `"auto"` gebruikt het getrainde maximum van het model -- niet aanbevolen voor modellen van 8B+ (Qwen3-Embedding-8B: maximaal 40 960 tokens kan het VRAM-gebruik tot ~32 GB verhogen). |

    Installeer eerst de officiële llama.cpp-provider: `openclaw plugins install @openclaw/llama-cpp-provider`.
    Standaardmodel: `embeddinggemma-300m-qat-Q8_0.gguf` (~0.6 GB, automatisch gedownload). Voor broncodecheck-outs blijft goedkeuring van de native build vereist: `pnpm approve-builds` en vervolgens `pnpm rebuild node-llama-cpp`.

    Gebruik de zelfstandige CLI om hetzelfde providerpad te verifiëren dat de Gateway gebruikt:

    ```bash
    openclaw memory status --deep --agent main
    openclaw memory index --force --agent main
    ```

    Numerieke waarden voor `local.contextSize` worden ook gebruikt voor de automatische plaatsing van GPU-lagen door node-llama-cpp, zodat de modelgewichten en de aangevraagde embeddingcontext samen passend worden gemaakt. `openclaw memory status --deep` rapporteert de laatst bekende llama.cpp-backend, het apparaat, de offload, de aangevraagde context en geheugengegevens met tijdstempel nadat de runtime is geladen; passieve status laadt geen model.

    Stel `provider: "local"` expliciet in voor lokale GGUF-embeddings. `hf:` en HTTP(S)-modelverwijzingen worden ondersteund voor expliciete lokale configuraties (via de modelresolutie van node-llama-cpp), maar wijzigen de standaardprovider niet.

  </Accordion>
</AccordionGroup>

### Time-out voor inline-embeddings

<ParamField path="sync.embeddingBatchTimeoutSeconds" type="number">
  Overschrijf de time-out voor inline embeddingbatches tijdens het indexeren van het geheugen.

Wanneer dit niet is ingesteld, wordt de standaardwaarde van de provider gebruikt: 600 seconden voor lokale/zelfgehoste providers zoals `local`, `ollama` en `lmstudio`, en 120 seconden voor gehoste providers. Verhoog dit wanneer lokale CPU-gebonden embeddingbatches correct werken maar traag zijn.
</ParamField>

---

## Indexeringsgedrag

Alles onder `memorySearch.sync`, tenzij anders vermeld:

| Sleutel                        | Type      | Standaard | Beschrijving                                                        |
| ------------------------------ | --------- | --------- | ------------------------------------------------------------------- |
| `onSessionStart`               | `boolean` | `true`  | Synchroniseer de geheugenindex wanneer een sessie start             |
| `onSearch`                     | `boolean` | `true`  | Synchroniseer uitgesteld bij zoeken nadat inhoudswijzigingen zijn gedetecteerd |
| `watch`                        | `boolean` | `true`  | Bewaak geheugenbestanden (chokidar) en plan herindexering bij wijzigingen |
| `watchDebounceMs`              | `number`  | `1500`  | Debouncevenster voor het samenvoegen van snel opeenvolgende bestandsbewakingsgebeurtenissen |
| `intervalMinutes`              | `number`  | `0`     | Periodiek herindexeringsinterval in minuten (`0` schakelt dit uit) |
| `sessions.postCompactionForce` | `boolean` | `true`  | Forceer een herindexering van de sessie na door Compaction geactiveerde transcriptupdates |

<ParamField path="chunking.tokens" type="number">
  Fragmentgrootte in tokens die wordt gebruikt bij het splitsen van geheugenbronnen vóór embedding (standaard: 400).
</ParamField>
<ParamField path="chunking.overlap" type="number">
  Tokenoverlap tussen aangrenzende fragmenten om context rond splitsingsgrenzen te behouden (standaard: 80).
</ParamField>

<Note>
Het wijzigen van `chunking.tokens` of `chunking.overlap` verandert de fragmentgrenzen en maakt de identiteit van de bestaande index ongeldig (zie de waarschuwing onder Providerselectie).
</Note>

---

## Configuratie voor hybride zoeken

Alles onder `memorySearch.query`:

| Sleutel      | Type     | Standaard | Beschrijving                                      |
| ------------ | -------- | --------- | ------------------------------------------------- |
| `maxResults` | `number` | `6`     | Maximumaantal geheugenresultaten dat vóór injectie wordt geretourneerd |
| `minScore`   | `number` | `0.35`  | Minimale relevantiescore om een resultaat op te nemen |

En onder `memorySearch.query.hybrid`:

| Sleutel               | Type      | Standaard | Beschrijving                         |
| --------------------- | --------- | --------- | ------------------------------------ |
| `enabled`             | `boolean` | `true`  | Schakel hybride BM25- en vectorzoekopdrachten in |
| `vectorWeight`        | `number`  | `0.7`   | Gewicht voor vectorscores (0-1)      |
| `textWeight`          | `number`  | `0.3`   | Gewicht voor BM25-scores (0-1)       |
| `candidateMultiplier` | `number`  | `4`     | Vermenigvuldigingsfactor voor de kandidatenpool |

<Tabs>
  <Tab title="MMR (diversiteit)">
    | Sleutel       | Type      | Standaard | Beschrijving                              |
    | ------------- | --------- | --------- | ----------------------------------------- |
    | `mmr.enabled` | `boolean` | `false` | Schakel MMR-herschikking in               |
    | `mmr.lambda`  | `number`  | `0.7`   | 0 = maximale diversiteit, 1 = maximale relevantie |
  </Tab>
  <Tab title="Temporeel verval (recentheid)">
    | Sleutel                      | Type      | Standaard | Beschrijving                        |
    | ---------------------------- | --------- | --------- | ----------------------------------- |
    | `temporalDecay.enabled`      | `boolean` | `false` | Schakel verhoging op basis van recentheid in |
    | `temporalDecay.halfLifeDays` | `number`  | `30`    | Score halveert elke N dagen         |

    Blijvend relevante bestanden (`MEMORY.md`, bestanden zonder datum in `memory/`) krijgen nooit verval toegepast.

  </Tab>
</Tabs>

### Volledig voorbeeld

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

## Aanvullende geheugenpaden

| Sleutel      | Type       | Beschrijving                                    |
| ------------ | ---------- | ----------------------------------------------- |
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

Paden kunnen absoluut of relatief ten opzichte van de werkruimte zijn. Mappen worden recursief gescand op `.md`-bestanden. De verwerking van symbolische koppelingen is afhankelijk van de actieve backend: de ingebouwde engine slaat symbolische koppelingen over, terwijl QMD het gedrag van de onderliggende QMD-scanner volgt.

Gebruik voor agentgebonden zoekopdrachten in transcripten van andere agents `agents.list[].memorySearch.qmd.extraCollections` in plaats van `memory.qmd.paths`. Die extra collecties volgen dezelfde `{ path, name, pattern? }`-structuur, maar worden per agent samengevoegd en kunnen expliciete gedeelde namen behouden wanneer het pad buiten de huidige werkruimte verwijst. Als hetzelfde herleide pad zowel in `memory.qmd.paths` als in `memorySearch.qmd.extraCollections` voorkomt, behoudt QMD de eerste vermelding en slaat het de dubbele vermelding over.

---

## Multimodaal geheugen (Gemini)

Indexeer afbeeldingen en audio naast Markdown met Gemini Embedding 2:

| Sleutel                   | Type       | Standaard  | Beschrijving                           |
| ------------------------- | ---------- | ---------- | -------------------------------------- |
| `multimodal.enabled`      | `boolean`  | `false`    | Multimodale indexering inschakelen     |
| `multimodal.modalities`   | `string[]` | --         | `["image"]`, `["audio"]` of `["all"]` |
| `multimodal.maxFileBytes` | `number`   | `10485760` | Maximale bestandsgrootte voor indexering (10 MiB) |

<Note>
Alleen van toepassing op bestanden in `extraPaths`. Standaardgeheugenhoofdmappen blijven uitsluitend Markdown ondersteunen. Vereist `gemini-embedding-2-preview`. `fallback` moet `"none"` zijn.
</Note>

Ondersteunde indelingen: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.heic`, `.heif` (afbeeldingen); `.mp3`, `.wav`, `.ogg`, `.opus`, `.m4a`, `.aac`, `.flac` (audio).

---

## Embeddingcache

| Sleutel            | Type      | Standaard | Beschrijving                                      |
| ------------------ | --------- | --------- | ------------------------------------------------- |
| `cache.enabled`    | `boolean` | `true`  | Embeddings van segmenten in SQLite cachen         |
| `cache.maxEntries` | `number`  | niet ingesteld | Bovenlimiet naar beste vermogen voor gecachte embeddings |

Voorkomt dat ongewijzigde tekst opnieuw wordt omgezet in embeddings tijdens herindexering of transcriptupdates. Laat `maxEntries` niet ingesteld voor een onbeperkte cache; stel deze in wanneer schijfgroei belangrijker is dan de maximale herindexeringssnelheid. Wanneer deze is ingesteld, worden de oudste vermeldingen (op basis van het tijdstip van de laatste update) als eerste verwijderd zodra de cache de limiet overschrijdt.

---

## Batchindexering

| Sleutel                       | Type      | Standaard | Beschrijving                    |
| ----------------------------- | --------- | --------- | ------------------------------- |
| `remote.nonBatchConcurrency`  | `number`  | `4`     | Parallelle inline-embeddings    |
| `remote.batch.enabled`        | `boolean` | `false` | Batch-embedding-API inschakelen |
| `remote.batch.concurrency`    | `number`  | `2`     | Parallelle batchtaken           |
| `remote.batch.wait`           | `boolean` | `true`  | Wachten op voltooiing van batch |
| `remote.batch.pollIntervalMs` | `number`  | `2000`  | Pollinterval                    |
| `remote.batch.timeoutMinutes` | `number`  | `60`    | Batchtime-out                   |

Beschikbaar voor `gemini`, `openai` en `voyage`. OpenAI-batches zijn doorgaans het snelst en goedkoopst voor grote aanvullingen met historische gegevens.

`remote.nonBatchConcurrency` bepaalt de inline-embeddingaanroepen die worden gebruikt door lokale/zelfgehoste providers en gehoste providers wanneer de batch-API's van de provider niet actief zijn. Ollama gebruikt standaard `1` voor indexering zonder batches om te voorkomen dat kleinere lokale hosts overbelast raken; stel op grotere machines een hogere waarde in.

Dit staat los van `sync.embeddingBatchTimeoutSeconds`, die de time-out voor inline-embeddingaanroepen bepaalt.

---

## Zoeken in sessiegeheugen (experimenteel)

Indexeer sessietranscripten en maak ze beschikbaar via `memory_search`:

| Sleutel                       | Type       | Standaard    | Beschrijving                                |
| ----------------------------- | ---------- | ------------ | ------------------------------------------- |
| `experimental.sessionMemory`  | `boolean`  | `false`      | Sessie-indexering inschakelen               |
| `sources`                     | `string[]` | `["memory"]` | Voeg `"sessions"` toe om transcripten op te nemen |
| `sync.sessions.deltaBytes`    | `number`   | `100000`     | Drempelwaarde in bytes voor herindexering   |
| `sync.sessions.deltaMessages` | `number`   | `50`         | Berichtdrempel voor herindexering           |

<Warning>
Sessie-indexering is opt-in en wordt asynchroon uitgevoerd. Resultaten kunnen enigszins verouderd zijn. Sessielogboeken staan op schijf, dus beschouw bestandssysteemtoegang als de vertrouwensgrens.
</Warning>

Treffers in sessietranscripten voldoen ook aan
[`tools.sessions.visibility`](/nl/gateway/config-tools#toolssessions). De standaardzichtbaarheid
`tree` maakt alleen de huidige sessie en de sessies die deze heeft gestart zichtbaar. Om
vanuit een andere sessie, zoals een privébericht, een niet-gerelateerde sessie van dezelfde agent te
herinneren die via de Gateway is gestart, verbreed je de zichtbaarheid doelbewust naar `agent` (of alleen naar `all`
wanneer herinnering tussen agents ook vereist is en het agent-naar-agentbeleid dit toestaat).

In de onderstaande voorbeelden staan deze instellingen onder `agents.defaults`. Je kunt ook
gelijkwaardige `memorySearch`-instellingen toepassen in een agentspecifieke overschrijving wanneer slechts één
agent sessietranscripten moet indexeren en doorzoeken.

Voor herinnering van Gateway naar privébericht binnen dezelfde agent:

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
`sources: ["sessions"]` op zichzelf geen transcripten naar QMD. Stel ook
`memory.qmd.sessions.enabled: true` in.

---

## SQLite-vectorversnelling (sqlite-vec)

| Sleutel                      | Type      | Standaard | Beschrijving                          |
| ---------------------------- | --------- | --------- | ------------------------------------- |
| `store.vector.enabled`       | `boolean` | `true`  | sqlite-vec gebruiken voor vectorquery's |
| `store.vector.extensionPath` | `string`  | gebundeld | Pad naar sqlite-vec overschrijven     |

Wanneer sqlite-vec niet beschikbaar is, valt OpenClaw automatisch terug op cosinusgelijkenis binnen het proces.

---

## Indexopslag

Ingebouwde geheugenindexen bevinden zich in de OpenClaw SQLite-database van elke agent op
`agents/<agentId>/agent/openclaw-agent.sqlite`.

| Sleutel               | Type     | Standaard   | Beschrijving                              |
| --------------------- | -------- | ----------- | ----------------------------------------- |
| `store.fts.tokenizer` | `string` | `unicode61` | FTS5-tokenizer (`unicode61` of `trigram`) |

---

## QMD-backendconfiguratie

Stel `memory.backend = "qmd"` in om deze in te schakelen. Alle QMD-instellingen staan onder `memory.qmd`:

| Sleutel                  | Type      | Standaard | Beschrijving                                                                                     |
| ------------------------ | --------- | --------- | ------------------------------------------------------------------------------------------------ |
| `command`                | `string`  | `qmd`    | Pad naar uitvoerbaar QMD-bestand; stel een absoluut pad in wanneer service-`PATH` verschilt van je shell |
| `searchMode`             | `string`  | `search` | Zoekopdracht: `search`, `vsearch`, `query`                                            |
| `rerank`                 | `boolean` | --        | Stel in op `false` met `searchMode: "query"` en QMD 2.1+ om QMD-herrangschikking over te slaan          |
| `includeDefaultMemory`   | `boolean` | `true`   | `MEMORY.md` + `memory/**/*.md` automatisch indexeren                                             |
| `paths[]`                | `array`   | --        | Extra paden: `{ name, path, pattern? }`                                                       |
| `sessions.enabled`       | `boolean` | `false`  | Sessietranscripten naar QMD exporteren                                                |
| `sessions.retentionDays` | `number`  | --        | Bewaartermijn voor transcripten                                                       |
| `sessions.exportDir`     | `string`  | --        | Exportmap                                                                             |

`searchMode: "search"` is uitsluitend lexicaal/BM25. OpenClaw voert voor die modus geen semantische vectorgereedheidscontroles of onderhoud van QMD-embeddings uit, ook niet tijdens `memory status --deep`; `vsearch` en `query` blijven QMD-vectorgereedheid en embeddings vereisen.

`rerank: false` wijzigt alleen de QMD-`query`-modus en vereist QMD 2.1 of nieuwer. In directe CLI-modus geeft OpenClaw `--no-rerank` door; in de door mcporter ondersteunde MCP-modus geeft het `rerank: false` door aan QMD's uniforme querytool. Laat deze niet ingesteld om het standaardgedrag van QMD voor het herrangschikken van query's te gebruiken.

OpenClaw geeft de voorkeur aan de huidige vormen voor QMD-collecties en MCP-query's, maar houdt oudere QMD-releases werkend door zo nodig compatibele patroonvlaggen voor collecties en oudere MCP-toolnamen te proberen. Wanneer QMD ondersteuning voor meerdere collectiefilters meldt, worden collecties uit dezelfde bron met één QMD-proces doorzocht; oudere QMD-builds behouden het compatibiliteitspad per collectie. Dezelfde bron betekent dat duurzame geheugencollecties (standaardgeheugenbestanden plus aangepaste paden) samen worden gegroepeerd, terwijl collecties met sessietranscripten een afzonderlijke groep blijven, zodat brondiversificatie nog steeds beide invoerbronnen bevat.

<Note>
Overschrijvingen van QMD-modellen blijven aan de QMD-kant en niet in de OpenClaw-configuratie. Als je de modellen van QMD globaal moet overschrijven, stel je omgevingsvariabelen zoals `QMD_EMBED_MODEL`, `QMD_RERANK_MODEL` en `QMD_GENERATE_MODEL` in de runtimeomgeving van de Gateway in.
</Note>

### mcporter-integratie

Alles onder `memory.qmd.mcporter`. Leidt QMD-zoekopdrachten via een lang actief `mcporter` MCP-proces in plaats van voor elke query `qmd` te starten, waardoor de overhead van een koude start voor grotere modellen afneemt.

| Sleutel       | Type      | Standaard | Beschrijving                                                               |
| ------------- | --------- | --------- | -------------------------------------------------------------------------- |
| `enabled`     | `boolean` | `false` | QMD-aanroepen via mcporter leiden in plaats van per verzoek `qmd` te starten |
| `serverName`  | `string`  | `qmd`   | Naam van de mcporter-server die `qmd mcp` uitvoert met `lifecycle: keep-alive` |
| `startDaemon` | `boolean` | `true`  | Het mcporter-proces automatisch starten wanneer `enabled` waar is          |

Vereist dat `mcporter` is geïnstalleerd en zich op PATH bevindt, plus een geconfigureerde mcporter-server die `qmd mcp` uitvoert. Houd dit uitgeschakeld voor eenvoudigere lokale configuraties waarbij de kosten van het starten van een proces per query acceptabel zijn.

<AccordionGroup>
  <Accordion title="Updateschema">
    | Sleutel                       | Type      | Standaard | Beschrijving                           |
    | --------------------------- | --------- | -------- | ---------------------------------------- |
    | `update.interval`         | `string`  | `5m`    | Vernieuwingsinterval                      |
    | `update.debounceMs`       | `number`  | `15000` | Bestandswijzigingen debouncen                 |
    | `update.onBoot`           | `boolean` | `true`  | Vernieuwen wanneer de langlevende QMD-manager wordt geopend; stel in op false om de onmiddellijke update bij het opstarten over te slaan |
    | `update.startup`          | `string`  | `off`   | Optionele QMD-initialisatie bij het starten van de Gateway: `off`, `idle` of `immediate` |
    | `update.startupDelayMs`   | `number`  | `120000` | Vertraging voordat de vernieuwing van `startup: "idle"` wordt uitgevoerd |
    | `update.waitForBootSync`  | `boolean` | `false` | Openen van de manager blokkeren totdat de eerste vernieuwing is voltooid |
    | `update.embedInterval`    | `string`  | `60m`   | Afzonderlijk interval voor embeddings                |
    | `update.commandTimeoutMs` | `number`  | `30000` | Time-out voor QMD-onderhoudsopdrachten (collectie weergeven/toevoegen) |
    | `update.updateTimeoutMs`  | `number`  | `120000` | Time-out voor elke `qmd update`-cyclus   |
    | `update.embedTimeoutMs`   | `number`  | `120000` | Time-out voor elke `qmd embed`-cyclus    |
  </Accordion>
  <Accordion title="Limieten">
    | Sleutel                       | Type     | Standaard | Beschrijving                |
    | --------------------------- | -------- | ------- | ------------------------------ |
    | `limits.maxResults`       | `number` | `4`     | Maximaal aantal zoekresultaten         |
    | `limits.maxSnippetChars`  | `number` | `450`   | Lengte van fragmenten begrenzen       |
    | `limits.maxInjectedChars` | `number` | `2200`  | Totaal aantal geïnjecteerde tekens begrenzen |
    | `limits.timeoutMs`        | `number` | `4000`  | Time-out voor QMD-opdrachten tijdens zoekopdrachten via QMD, inclusief `memory_search`; installatie, synchronisatie, ingebouwde fallback en aanvullend werk behouden de standaarddeadline van het hulpprogramma |
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

    De meegeleverde standaard staat alleen DM/direct toe en weigert groepen en andere kanaaltypen. `match.keyPrefix` komt overeen met de genormaliseerde sessiesleutel; `match.rawKeyPrefix` komt overeen met de onbewerkte sleutel, inclusief `agent:<id>:`.

  </Accordion>
  <Accordion title="Bronverwijzingen">
    `memory.citations` is van toepassing op alle backends:

    | Waarde            | Gedrag                                            |
    | ------------------ | ------------------------------------------------------ |
    | `auto` (standaard) | De voettekst `Source: <path#line>` opnemen in fragmenten    |
    | `on`             | De voettekst altijd opnemen                               |
    | `off`            | De voettekst weglaten (het pad wordt intern nog steeds aan de agent doorgegeven) |

  </Accordion>
</AccordionGroup>

Wanneer QMD-initialisatie bij het starten van de Gateway is ingeschakeld, start OpenClaw QMD alleen voor daarvoor in aanmerking komende agents. Als `update.onBoot` true is en er geen onderhoudsinterval voor updates of embeddings is geconfigureerd, gebruikt het opstartproces een eenmalige manager voor de opstartvernieuwing en sluit deze daarna. Als een update- of embeddinginterval is geconfigureerd, opent het opstartproces de langlevende QMD-manager zodat deze de watcher en intervaltimers kan beheren; `update.onBoot: false` slaat alleen de onmiddellijke opstartvernieuwing over.

### Volledig QMD-voorbeeld

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

Dreaming wordt geconfigureerd onder `plugins.entries.memory-core.config.dreaming`, niet onder `agents.defaults.memorySearch`.

Dreaming wordt als één geplande verwerking uitgevoerd en gebruikt interne lichte/diepe/REM-fasen als implementatiedetail.

Zie [Dreaming](/nl/concepts/dreaming) voor conceptueel gedrag en slash-opdrachten.

### Gebruikersinstellingen

| Sleutel                                    | Type      | Standaard       | Beschrijving                                                                                                                      |
| -------------------------------------- | --------- | ------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`                              | `boolean` | `false`       | Dreaming volledig in- of uitschakelen                                                                                              |
| `frequency`                            | `string`  | `0 3 * * *`   | Optioneel Cron-schema voor de volledige Dreaming-verwerking                                                                                |
| `model`                                | `string`  | standaardmodel | Optionele modeloverschrijving voor de Dream Diary-subagent                                                                                     |
| `phases.deep.maxPromotedSnippetTokens` | `number`  | `160`         | Maximaal geschat aantal tokens dat wordt behouden uit elk fragment van het kortetermijngeheugen dat naar `MEMORY.md` wordt gepromoveerd; herkomstmetadata blijven zichtbaar |

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
- Dreaming schrijft voor mensen leesbare verhalende uitvoer naar `DREAMS.md` (of de bestaande `dreams.md`).
- `dreaming.model` gebruikt de bestaande vertrouwenscontrole voor Plugin-subagents; stel `plugins.entries.memory-core.subagent.allowModelOverride: true` in voordat je dit inschakelt.
- Dream Diary probeert het één keer opnieuw met het standaardmodel van de sessie wanneer het geconfigureerde model niet beschikbaar is. Fouten bij vertrouwens- of toelatingslijstcontroles worden gelogd en leiden niet stilzwijgend tot een nieuwe poging.
- Het beleid en de drempelwaarden voor de lichte/diepe/REM-fasen zijn intern gedrag en geen gebruikersconfiguratie.

</Note>

## Gerelateerd

- [Configuratiereferentie](/nl/gateway/configuration-reference)
- [Geheugenoverzicht](/nl/concepts/memory)
- [Geheugen doorzoeken](/nl/concepts/memory-search)
