---
read_when:
    - U wilt providers voor geheugenzoekopdrachten of embeddingmodellen configureren
    - U wilt de QMD-backend instellen
    - Je wilt hybride zoekopdrachten, MMR of tijdsverval afstemmen
    - U wilt multimodale geheugenindexering inschakelen
sidebarTitle: Memory config
summary: Alle configuratieopties voor geheugenzoekopdrachten, embeddingproviders, QMD, hybride zoekopdrachten en multimodale indexering
title: Referentie voor geheugenconfiguratie
x-i18n:
    generated_at: "2026-07-12T09:21:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 558995797a5e217e57245e1d5ff90124fca67b6eb4767d97a3ea26a4ca013d06
    source_path: reference/memory-config.md
    workflow: 16
---

Deze pagina bevat alle configuratieopties voor geheugenzoekopdrachten van OpenClaw. Zie voor conceptuele overzichten:

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

Alle instellingen voor geheugenzoekopdrachten bevinden zich onder `agents.defaults.memorySearch` in `openclaw.json` (of in een overschrijving per agent via `agents.list[].memorySearch`), tenzij anders vermeld.

<Note>
Als u de functieschakelaar en subagentconfiguratie voor **Active Memory** zoekt, vindt u die onder `plugins.entries.active-memory` in plaats van onder `memorySearch`.

Active Memory gebruikt een model met twee voorwaarden:

1. de Plugin moet zijn ingeschakeld en gericht zijn op de huidige agent-ID
2. het verzoek moet een geschikte interactieve, persistente chatsessie zijn

Zie [Active Memory](/nl/concepts/active-memory) voor het activeringsmodel, de configuratie die eigendom is van de Plugin, transcriptpersistentie en een veilig uitrolpatroon.
</Note>

---

## Providerselectie

| Sleutel    | Type      | Standaardwaarde       | Beschrijving                                                                                                                                                                                                                                                                                 |
| ---------- | --------- | --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`  | `boolean` | `true`                | Geheugenzoekopdrachten in- of uitschakelen                                                                                                                                                                                                                                                   |
| `provider` | `string`  | `"openai"`            | ID van de embeddingadapter, zoals `bedrock`, `deepinfra`, `gemini`, `github-copilot`, `local`, `mistral`, `ollama`, `openai`, `openai-compatible` of `voyage`; kan ook een geconfigureerde `models.providers.<id>` zijn waarvan `api` naar een geheugenembeddingadapter of OpenAI-compatibele model-API verwijst |
| `model`    | `string`  | standaard van provider | Naam van het embeddingmodel                                                                                                                                                                                                                                                                  |
| `fallback` | `string`  | `"none"`              | ID van de terugvaladapter wanneer de primaire adapter mislukt                                                                                                                                                                                                                                |

Wanneer `provider` niet is ingesteld, gebruikt OpenClaw embeddings van OpenAI. Stel `provider`
expliciet in om Bedrock, DeepInfra, Gemini, GitHub Copilot, Mistral, Ollama,
Voyage, een lokaal GGUF-model of een OpenAI-compatibel `/v1/embeddings`-eindpunt te gebruiken.
Verouderde configuraties die nog `provider: "auto"` bevatten, worden omgezet naar `openai`.

<Warning>
Als u de embeddingprovider, het model, de providerinstellingen, bronnen, het bereik,
de segmentering of de tokenizer wijzigt, kan de bestaande SQLite-vectorindex incompatibel worden.
OpenClaw onderbreekt vectorzoekopdrachten en meldt een waarschuwing over de indexidentiteit in plaats van
alles automatisch opnieuw van embeddings te voorzien. Bouw de index opnieuw wanneer u daar klaar voor bent met
`openclaw memory status --index --agent <id>` of
`openclaw memory index --force --agent <id>`.
</Warning>

Wanneer `provider` niet is ingesteld, de verouderde instelling `provider: "auto"` aanwezig is, of
`provider: "none"` bewust alleen-FTS-modus selecteert, kan het ophalen van herinneringen nog steeds
lexicale FTS-rangschikking gebruiken wanneer embeddings niet beschikbaar zijn.

Expliciet ingestelde niet-lokale providers sluiten af bij fouten. Als u `memorySearch.provider` instelt op
een concrete provider met een externe backend, zoals Bedrock, DeepInfra, Gemini, GitHub
Copilot, LM Studio, Mistral, Ollama, OpenAI, Voyage of een OpenAI-compatibele
aangepaste provider, en die provider tijdens runtime niet beschikbaar is, retourneert `memory_search`
een resultaat dat aangeeft dat de service niet beschikbaar is, in plaats van stilzwijgend alleen-FTS-ophaling te gebruiken. Herstel de
provider-/authenticatieconfiguratie, schakel over naar een bereikbare provider of stel
`provider: "none"` in als u bewust alleen-FTS-ophaling wilt.

### Aangepaste provider-ID's

`memorySearch.provider` kan verwijzen naar een aangepaste vermelding `models.providers.<id>` voor geheugenspecifieke provideradapters zoals `ollama`, of voor OpenAI-compatibele model-API's zoals `openai-responses` / `openai-completions`. OpenClaw bepaalt de `api`-eigenaar van die provider voor de embeddingadapter, terwijl de aangepaste provider-ID behouden blijft voor de verwerking van eindpunten, authenticatie en modelvoorvoegsels. Hierdoor kunnen opstellingen met meerdere GPU's of hosts geheugenembeddings toewijzen aan een specifiek lokaal eindpunt:

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

Voor externe embeddings is een API-sleutel vereist. Bedrock gebruikt in plaats daarvan de standaardreferentieketen van de AWS SDK (instantie-rollen, SSO, toegangssleutels of een Bedrock-API-sleutel).

| Provider       | Omgevingsvariabele                                  | Configuratiesleutel                 |
| -------------- | --------------------------------------------------- | ----------------------------------- |
| Bedrock        | AWS-referentieketen of `AWS_BEARER_TOKEN_BEDROCK`   | Geen API-sleutel nodig              |
| DeepInfra      | `DEEPINFRA_API_KEY`                                 | `models.providers.deepinfra.apiKey` |
| Gemini         | `GEMINI_API_KEY`                                    | `models.providers.google.apiKey`    |
| GitHub Copilot | `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, `GITHUB_TOKEN`  | Authenticatieprofiel via apparaataanmelding |
| Mistral        | `MISTRAL_API_KEY`                                   | `models.providers.mistral.apiKey`   |
| Ollama         | `OLLAMA_API_KEY` (tijdelijke aanduiding)            | --                                  |
| OpenAI         | `OPENAI_API_KEY`                                    | `models.providers.openai.apiKey`    |
| Voyage         | `VOYAGE_API_KEY`                                    | `models.providers.voyage.apiKey`    |

<Note>
Codex OAuth dekt alleen chat/aanvullingen en voldoet niet aan embeddingverzoeken.
</Note>

---

## Configuratie van extern eindpunt

Gebruik `provider: "openai-compatible"` voor een algemene OpenAI-compatibele
`/v1/embeddings`-server die de algemene OpenAI-chatreferenties niet moet overnemen.

<ParamField path="remote.baseUrl" type="string">
  Aangepaste basis-URL voor de API.
</ParamField>
<ParamField path="remote.apiKey" type="string">
  API-sleutel overschrijven.
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
    | Sleutel                | Type     | Standaardwaarde        | Beschrijving                                      |
    | ---------------------- | -------- | ---------------------- | ------------------------------------------------- |
    | `model`                | `string` | `gemini-embedding-001` | Ondersteunt ook `gemini-embedding-2-preview`      |
    | `outputDimensionality` | `number` | `3072`                 | Voor Embedding 2: 768, 1536 of 3072               |

    <Warning>
    Als u het model of `outputDimensionality` wijzigt, verandert de indexidentiteit. OpenClaw
    onderbreekt vectorzoekopdrachten totdat u de geheugenindex expliciet opnieuw opbouwt.
    </Warning>

  </Accordion>
  <Accordion title="Invoertypen voor OpenAI-compatibele eindpunten">
    OpenAI-compatibele embeddingeindpunten kunnen providerspecifieke `input_type`-verzoekvelden inschakelen. Dit is nuttig voor asymmetrische embeddingmodellen die verschillende labels vereisen voor embeddings van zoekopdrachten en documenten.

    | Sleutel             | Type     | Standaardwaarde | Beschrijving                                                |
    | ------------------- | -------- | ---------------- | ----------------------------------------------------------- |
    | `inputType`         | `string` | niet ingesteld   | Gedeeld `input_type` voor embeddings van zoekopdrachten en documenten |
    | `queryInputType`    | `string` | niet ingesteld   | `input_type` tijdens zoekopdrachten; overschrijft `inputType` |
    | `documentInputType` | `string` | niet ingesteld   | `input_type` voor index/document; overschrijft `inputType`    |

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

    Het wijzigen van deze waarden beïnvloedt de identiteit van de embeddingcache voor batchindexering door de provider en moet worden gevolgd door een herindexering van het geheugen wanneer het bovenliggende model de labels verschillend behandelt.

  </Accordion>
  <Accordion title="Bedrock">
    ### Configuratie van Bedrock-embeddings

    Bedrock gebruikt de standaardreferentieketen van de AWS SDK plus een door OpenClaw gecontroleerd bearer-token, zodat er geen API-sleutels in de configuratie worden opgeslagen. Als OpenClaw op EC2 draait met een instantierol waarvoor Bedrock is ingeschakeld, hoeft u alleen de provider en het model in te stellen:

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

    | Sleutel                | Type     | Standaardwaarde                | Beschrijving                         |
    | ---------------------- | -------- | -------------------------------- | ------------------------------------ |
    | `model`                | `string` | `amazon.titan-embed-text-v2:0` | Elke ID van een Bedrock-embeddingmodel |
    | `outputDimensionality` | `number` | standaardwaarde van het model   | Voor Titan V2: 256, 512 of 1024      |

    **Ondersteunde modellen** (met familiedetectie en standaarddimensies):

    | Model-ID                                    | Provider   | Standaarddimensies | Configureerbare dimensies       |
    | ------------------------------------------- | ---------- | ------------------ | ------------------------------- |
    | `amazon.titan-embed-text-v2:0`             | Amazon     | 1024               | 256, 512, 1024                  |
    | `amazon.titan-embed-text-v1`               | Amazon     | 1536               | --                              |
    | `amazon.titan-embed-g1-text-02`            | Amazon     | 1536               | --                              |
    | `amazon.titan-embed-image-v1`              | Amazon     | 1024               | --                              |
    | `amazon.nova-2-multimodal-embeddings-v1:0` | Amazon     | 1024               | 256, 384, 1024, 3072            |
    | `cohere.embed-english-v3`                  | Cohere     | 1024               | --                              |
    | `cohere.embed-multilingual-v3`             | Cohere     | 1024               | --                              |
    | `cohere.embed-v4:0`                        | Cohere     | 1536               | 256, 384, 512, 768, 1024, 1536 |
    | `twelvelabs.marengo-embed-3-0-v1:0`        | TwelveLabs | 512                | --                              |
    | `twelvelabs.marengo-embed-2-7-v1:0`        | TwelveLabs | 1024               | --                              |

    Varianten met een doorvoersuffix (bijvoorbeeld `amazon.titan-embed-text-v1:2:8k`) en inferentieprofiel-ID's met een regiovoorvoegsel (bijvoorbeeld `us.amazon.titan-embed-text-v2:0`) nemen de configuratie van het basismodel over.

    **Regio:** wordt in deze volgorde bepaald: de overschrijving `memorySearch.remote.baseUrl`, de configuratie `models.providers.amazon-bedrock.baseUrl`, `AWS_REGION`, `AWS_DEFAULT_REGION` en vervolgens de standaardwaarde `us-east-1`.

    **Authenticatie:** OpenClaw controleert eerst op `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY` of `AWS_BEARER_TOKEN_BEDROCK` en valt daarna terug op de standaardketen van AWS SDK-providers voor referenties:

    1. Omgevingsvariabelen (`AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`), tenzij `AWS_PROFILE` ook is ingesteld
    2. SSO (alleen wanneer SSO-velden zijn geconfigureerd)
    3. Gedeelde bestanden met referenties en configuratie (`fromIni`, inclusief `AWS_PROFILE`)
    4. Referentieproces (`credential_process` in het AWS-configuratiebestand)
    5. Referenties voor webidentiteitstokens
    6. Referenties uit metagegevens van ECS- of EC2-instanties

    **IAM-machtigingen:** de IAM-rol of -gebruiker heeft het volgende nodig:

    ```json
    {
      "Effect": "Allow",
      "Action": "bedrock:InvokeModel",
      "Resource": "*"
    }
    ```

    Beperk voor minimale bevoegdheden `InvokeModel` tot het specifieke model:

    ```text
    arn:aws:bedrock:*::foundation-model/amazon.titan-embed-text-v2:0
    ```

  </Accordion>
  <Accordion title="Lokaal (GGUF + llama.cpp)">
    | Sleutel               | Type               | Standaardwaarde          | Beschrijving                                                                                                                                                                                                                                                                                                                                 |
    | --------------------- | ------------------ | ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
    | `local.modelPath`     | `string`           | automatisch gedownload   | Pad naar het GGUF-modelbestand                                                                                                                                                                                                                                                                                                                |
    | `local.modelCacheDir` | `string`           | standaard van node-llama-cpp | Cachemap voor gedownloade modellen                                                                                                                                                                                                                                                                                                        |
    | `local.contextSize`   | `number \| "auto"` | `4096`                   | Grootte van het contextvenster voor de embeddingcontext. 4096 dekt gebruikelijke fragmenten (128-512 tokens) en begrenst tegelijkertijd VRAM die niet voor gewichten wordt gebruikt. Verlaag dit op beperkte hosts naar 1024-2048. `"auto"` gebruikt het getrainde maximum van het model — niet aanbevolen voor modellen van 8B of groter (Qwen3-Embedding-8B: tot 40.960 tokens kan het VRAM-gebruik tot circa 32 GB verhogen). |

    Installeer eerst de officiële llama.cpp-provider: `openclaw plugins install @openclaw/llama-cpp-provider`.
    Standaardmodel: `embeddinggemma-300m-qat-Q8_0.gguf` (circa 0,6 GB, automatisch gedownload). Voor broncodecheck-outs is nog steeds goedkeuring voor de systeemeigen build vereist: `pnpm approve-builds` en daarna `pnpm rebuild node-llama-cpp`.

    Gebruik de zelfstandige CLI om hetzelfde providerpad te verifiëren dat de Gateway gebruikt:

    ```bash
    openclaw memory status --deep --agent main
    openclaw memory index --force --agent main
    ```

    Numerieke waarden voor `local.contextSize` worden ook gebruikt voor de automatische plaatsing van GPU-lagen door node-llama-cpp, zodat de modelgewichten en de aangevraagde embeddingcontext samen passen. Nadat de runtime is geladen, rapporteert `openclaw memory status --deep` de laatst bekende llama.cpp-backend, het apparaat, de offload, de aangevraagde context en geheugengegevens met tijdstempels; passieve status laadt geen model.

    Stel `provider: "local"` expliciet in voor lokale GGUF-embeddings. `hf:`- en HTTP(S)-modelverwijzingen worden ondersteund voor expliciete lokale configuraties (via de modelresolutie van node-llama-cpp), maar wijzigen de standaardprovider niet.

  </Accordion>
</AccordionGroup>

### Time-out voor inline-embeddings

<ParamField path="sync.embeddingBatchTimeoutSeconds" type="number">
  Overschrijf de time-out voor inline-embeddingbatches tijdens het indexeren van het geheugen.

Wanneer dit niet is ingesteld, wordt de standaardwaarde van de provider gebruikt: 600 seconden voor lokale/zelfgehoste providers zoals `local`, `ollama` en `lmstudio`, en 120 seconden voor gehoste providers. Verhoog dit wanneer lokale CPU-gebonden embeddingbatches correct werken maar traag zijn.
</ParamField>

---

## Indexeringsgedrag

Alles valt onder `memorySearch.sync`, tenzij anders vermeld:

| Sleutel                        | Type      | Standaardwaarde | Beschrijving                                                                    |
| ------------------------------ | --------- | --------------- | ------------------------------------------------------------------------------- |
| `onSessionStart`               | `boolean` | `true`          | Synchroniseer de geheugenindex wanneer een sessie start                         |
| `onSearch`                     | `boolean` | `true`          | Synchroniseer uitgesteld bij zoeken nadat inhoudswijzigingen zijn gedetecteerd  |
| `watch`                        | `boolean` | `true`          | Bewaak geheugenbestanden (chokidar) en plan herindexering bij wijzigingen       |
| `watchDebounceMs`              | `number`  | `1500`          | Debouncevenster voor het samenvoegen van snel opeenvolgende bestandsbewakingsgebeurtenissen |
| `intervalMinutes`              | `number`  | `0`             | Periodiek herindexeringsinterval in minuten (`0` schakelt dit uit)              |
| `sessions.postCompactionForce` | `boolean` | `true`          | Forceer herindexering van een sessie na transcriptupdates die door Compaction zijn geactiveerd |

<ParamField path="chunking.tokens" type="number">
  Segmentgrootte in tokens die wordt gebruikt bij het opsplitsen van geheugenbronnen vóór het insluiten (standaard: 400).
</ParamField>
<ParamField path="chunking.overlap" type="number">
  Overlap in tokens tussen aangrenzende segmenten om context nabij splitsingsgrenzen te behouden (standaard: 80).
</ParamField>

<Note>
Als u `chunking.tokens` of `chunking.overlap` wijzigt, veranderen de segmentgrenzen en wordt de identiteit van de bestaande index ongeldig (zie de waarschuwing onder Providerselectie).
</Note>

---

## Configuratie voor hybride zoeken

Alles onder `memorySearch.query`:

| Sleutel      | Type     | Standaard | Beschrijving                                                    |
| ------------ | -------- | --------- | --------------------------------------------------------------- |
| `maxResults` | `number` | `6`       | Maximaal aantal geheugenresultaten dat vóór invoeging terugkomt |
| `minScore`   | `number` | `0.35`    | Minimale relevantiescore om een resultaat op te nemen            |

En onder `memorySearch.query.hybrid`:

| Sleutel               | Type      | Standaard | Beschrijving                                      |
| --------------------- | --------- | --------- | ------------------------------------------------- |
| `enabled`             | `boolean` | `true`    | Hybride BM25- en vectorzoekopdracht inschakelen   |
| `vectorWeight`        | `number`  | `0.7`     | Weging voor vectorscores (0-1)                    |
| `textWeight`          | `number`  | `0.3`     | Weging voor BM25-scores (0-1)                     |
| `candidateMultiplier` | `number`  | `4`       | Vermenigvuldigingsfactor voor de kandidatenpool   |

<Tabs>
  <Tab title="MMR (diversiteit)">
    | Sleutel       | Type      | Standaard | Beschrijving                                 |
    | ------------- | --------- | --------- | -------------------------------------------- |
    | `mmr.enabled` | `boolean` | `false`   | MMR-herschikking inschakelen                 |
    | `mmr.lambda`  | `number`  | `0.7`     | 0 = maximale diversiteit, 1 = maximale relevantie |
  </Tab>
  <Tab title="Tijdgebonden verval (recentheid)">
    | Sleutel                      | Type      | Standaard | Beschrijving                         |
    | ---------------------------- | --------- | --------- | ------------------------------------ |
    | `temporalDecay.enabled`      | `boolean` | `false`   | Versterking op basis van recentheid inschakelen |
    | `temporalDecay.halfLifeDays` | `number`  | `30`      | Score halveert elke N dagen          |

    Tijdloze bestanden (`MEMORY.md`, bestanden zonder datum in `memory/`) ondergaan nooit verval.

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

Paden kunnen absoluut of relatief ten opzichte van de werkruimte zijn. Mappen worden recursief gescand op `.md`-bestanden. De verwerking van symbolische koppelingen hangt af van de actieve backend: de ingebouwde engine slaat symbolische koppelingen over, terwijl QMD het gedrag van de onderliggende QMD-scanner volgt.

Gebruik voor agentgebonden zoekopdrachten in transcripten van andere agents `agents.list[].memorySearch.qmd.extraCollections` in plaats van `memory.qmd.paths`. Deze extra verzamelingen volgen dezelfde structuur `{ path, name, pattern? }`, maar worden per agent samengevoegd en kunnen expliciete gedeelde namen behouden wanneer het pad naar buiten de huidige werkruimte verwijst. Als hetzelfde herleide pad zowel in `memory.qmd.paths` als in `memorySearch.qmd.extraCollections` voorkomt, behoudt QMD de eerste vermelding en slaat het duplicaat over.

---

## Multimodaal geheugen (Gemini)

Indexeer afbeeldingen en audio naast Markdown met Gemini Embedding 2:

| Sleutel                   | Type       | Standaard  | Beschrijving                                    |
| ------------------------- | ---------- | ---------- | ----------------------------------------------- |
| `multimodal.enabled`      | `boolean`  | `false`    | Multimodale indexering inschakelen              |
| `multimodal.modalities`   | `string[]` | --         | `["image"]`, `["audio"]` of `["all"]`           |
| `multimodal.maxFileBytes` | `number`   | `10485760` | Maximale bestandsgrootte voor indexering (10 MiB) |

<Note>
Is alleen van toepassing op bestanden in `extraPaths`. Standaardgeheugenlocaties blijven beperkt tot Markdown. Vereist `gemini-embedding-2-preview`. `fallback` moet `"none"` zijn.
</Note>

Ondersteunde indelingen: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.heic`, `.heif` (afbeeldingen); `.mp3`, `.wav`, `.ogg`, `.opus`, `.m4a`, `.aac`, `.flac` (audio).

---

## Cache voor embeddings

| Sleutel            | Type      | Standaardwaarde | Beschrijving                                      |
| ------------------ | --------- | --------------- | ------------------------------------------------- |
| `cache.enabled`    | `boolean` | `true`          | Chunk-embeddings in SQLite cachen                  |
| `cache.maxEntries` | `number`  | niet ingesteld  | Indicatieve bovengrens voor gecachte embeddings   |

Voorkomt dat ongewijzigde tekst tijdens herindexering of transcriptupdates opnieuw wordt omgezet in embeddings. Laat `maxEntries` niet ingesteld voor een onbeperkte cache; stel deze waarde in wanneer schijfgroei belangrijker is dan de maximale herindexeringssnelheid. Als er een waarde is ingesteld, worden de oudste vermeldingen (op basis van het tijdstip van de laatste update) als eerste verwijderd zodra de cache de limiet overschrijdt.

---

## Batchindexering

| Sleutel                       | Type      | Standaardwaarde | Beschrijving                         |
| ----------------------------- | --------- | --------------- | ------------------------------------ |
| `remote.nonBatchConcurrency`  | `number`  | `4`             | Parallelle inline-embeddingaanroepen |
| `remote.batch.enabled`        | `boolean` | `false`         | Batch-embedding-API inschakelen      |
| `remote.batch.concurrency`    | `number`  | `2`             | Parallelle batchtaken                |
| `remote.batch.wait`           | `boolean` | `true`          | Wachten tot de batch is voltooid     |
| `remote.batch.pollIntervalMs` | `number`  | `2000`          | Pollinginterval                      |
| `remote.batch.timeoutMinutes` | `number`  | `60`            | Time-out voor batches                |

Beschikbaar voor `gemini`, `openai` en `voyage`. OpenAI-batchverwerking is doorgaans het snelst en voordeligst voor grote aanvullingen met historische gegevens.

`remote.nonBatchConcurrency` bepaalt het aantal gelijktijdige inline-embeddingaanroepen voor lokale/zelfgehoste providers en gehoste providers wanneer de batch-API's van de provider niet actief zijn. Ollama gebruikt standaard `1` voor indexering zonder batches om overbelasting van kleinere lokale hosts te voorkomen; stel op krachtigere machines een hogere waarde in.

Dit staat los van `sync.embeddingBatchTimeoutSeconds`, dat de time-out voor inline-embeddingaanroepen bepaalt.

---

## Zoeken in sessiegeheugen (experimenteel)

Indexeer sessietranscripten en maak ze beschikbaar via `memory_search`:

| Sleutel                       | Type       | Standaardwaarde | Beschrijving                                          |
| ----------------------------- | ---------- | --------------- | ----------------------------------------------------- |
| `experimental.sessionMemory`  | `boolean`  | `false`         | Sessie-indexering inschakelen                         |
| `sources`                     | `string[]` | `["memory"]`    | Voeg `"sessions"` toe om transcripten op te nemen     |
| `sync.sessions.deltaBytes`    | `number`   | `100000`        | Drempelwaarde in bytes voor herindexering             |
| `sync.sessions.deltaMessages` | `number`   | `50`            | Drempelwaarde in berichten voor herindexering         |

<Warning>
Sessie-indexering is opt-in en wordt asynchroon uitgevoerd. Resultaten kunnen enigszins verouderd zijn. Sessielogboeken worden op schijf opgeslagen; beschouw toegang tot het bestandssysteem daarom als de vertrouwensgrens.
</Warning>

Treffers uit sessietranscripten volgen ook
[`tools.sessions.visibility`](/nl/gateway/config-tools#toolssessions). De standaardzichtbaarheid
`tree` geeft alleen toegang tot de huidige sessie en de sessies die deze heeft gestart. Als u
vanuit een andere sessie, zoals een privébericht, een niet-gerelateerde, door dezelfde agent via de Gateway gestarte sessie
wilt ophalen, verruimt u de zichtbaarheid bewust naar `agent` (of alleen naar `all`
wanneer ophalen tussen agents ook vereist is en het beleid voor communicatie tussen agents dit toestaat).

In de onderstaande voorbeelden staan deze instellingen onder `agents.defaults`. U kunt ook
gelijkwaardige `memorySearch`-instellingen toepassen in een overschrijving per agent wanneer slechts één
agent sessietranscripten moet indexeren en doorzoeken.

Voor ophalen tussen de Gateway en privéberichten van dezelfde agent:

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
`sources: ["sessions"]` op zichzelf geen transcripten naar QMD. Stel daarnaast
`memory.qmd.sessions.enabled: true` in.

---

  ## SQLite-vectorversnelling (sqlite-vec)

  | Sleutel                      | Type      | Standaard | Beschrijving                              |
  | ---------------------------- | --------- | --------- | ----------------------------------------- |
  | `store.vector.enabled`       | `boolean` | `true`    | sqlite-vec gebruiken voor vectorquery's   |
  | `store.vector.extensionPath` | `string`  | gebundeld | Pad naar sqlite-vec overschrijven         |

  Wanneer sqlite-vec niet beschikbaar is, valt OpenClaw automatisch terug op cosinusgelijkenis binnen het proces.

  ---

  ## Indexopslag

  Ingebouwde geheugenindexen bevinden zich in de OpenClaw SQLite-database van elke agent op
  `agents/<agentId>/agent/openclaw-agent.sqlite`.

  | Sleutel               | Type     | Standaard   | Beschrijving                                  |
  | --------------------- | -------- | ----------- | --------------------------------------------- |
  | `store.fts.tokenizer` | `string` | `unicode61` | FTS5-tokenizer (`unicode61` of `trigram`)     |

  ---

  ## Configuratie van QMD-backend

  Stel `memory.backend = "qmd"` in om deze in te schakelen. Alle QMD-instellingen staan onder `memory.qmd`:

  | Sleutel                  | Type      | Standaard | Beschrijving                                                                                       |
  | ------------------------ | --------- | --------- | -------------------------------------------------------------------------------------------------- |
  | `command`                | `string`  | `qmd`     | Pad naar uitvoerbaar QMD-bestand; stel een absoluut pad in wanneer de service-`PATH` afwijkt van uw shell |
  | `searchMode`             | `string`  | `search`  | Zoekopdracht: `search`, `vsearch`, `query`                                                         |
  | `rerank`                 | `boolean` | --        | Stel bij `searchMode: "query"` en QMD 2.1+ in op `false` om QMD-herrangschikking over te slaan      |
  | `includeDefaultMemory`   | `boolean` | `true`    | `MEMORY.md` + `memory/**/*.md` automatisch indexeren                                              |
  | `paths[]`                | `array`   | --        | Aanvullende paden: `{ name, path, pattern? }`                                                      |
  | `sessions.enabled`       | `boolean` | `false`   | Sessietranscripten naar QMD exporteren                                                             |
  | `sessions.retentionDays` | `number`  | --        | Bewaartermijn voor transcripten                                                                    |
  | `sessions.exportDir`     | `string`  | --        | Exportmap                                                                                          |

  `searchMode: "search"` gebruikt uitsluitend lexicaal zoeken/BM25. OpenClaw voert voor deze modus geen controles op de gereedheid van semantische vectoren of onderhoud aan QMD-embeddings uit, ook niet tijdens `memory status --deep`; `vsearch` en `query` blijven vereisen dat QMD-vectoren en embeddings gereed zijn.

  `rerank: false` wijzigt alleen de QMD-modus `query` en vereist QMD 2.1 of nieuwer. In de directe CLI-modus geeft OpenClaw `--no-rerank` door; in de door mcporter ondersteunde MCP-modus geeft het `rerank: false` door aan het uniforme queryhulpmiddel van QMD. Laat deze optie oningesteld om het standaardgedrag van QMD voor het herrangschikken van queryresultaten te gebruiken.

  OpenClaw geeft de voorkeur aan de huidige vormen voor QMD-collecties en MCP-query's, maar houdt oudere QMD-versies werkend door zo nodig compatibele vlaggen voor collectiepatronen en oudere namen van MCP-hulpmiddelen te proberen. Wanneer QMD ondersteuning voor meerdere collectiefilters aangeeft, worden collecties met dezelfde bron met één QMD-proces doorzocht; oudere QMD-builds behouden het compatibiliteitspad per collectie. Dezelfde bron betekent dat duurzame geheugencollecties (standaardgeheugenbestanden plus aangepaste paden) samen worden gegroepeerd, terwijl collecties met sessietranscripten een afzonderlijke groep blijven, zodat brondiversificatie nog steeds beide invoerbronnen heeft.

  <Note>
  QMD-modeloverschrijvingen blijven aan de QMD-kant en niet in de OpenClaw-configuratie. Als u de modellen van QMD globaal wilt overschrijven, stelt u omgevingsvariabelen zoals `QMD_EMBED_MODEL`, `QMD_RERANK_MODEL` en `QMD_GENERATE_MODEL` in de runtimeomgeving van de Gateway in.
  </Note>

  ### mcporter-integratie

  Alles staat onder `memory.qmd.mcporter`. Leidt QMD-zoekopdrachten via een langlevende `mcporter` MCP-daemon in plaats van voor elke query `qmd` te starten, waardoor de overhead van een koude start voor grotere modellen afneemt.

  | Sleutel       | Type      | Standaard | Beschrijving                                                                  |
  | ------------- | --------- | --------- | ----------------------------------------------------------------------------- |
  | `enabled`     | `boolean` | `false`   | QMD-aanroepen via mcporter leiden in plaats van per aanvraag `qmd` te starten |
  | `serverName`  | `string`  | `qmd`     | Naam van de mcporter-server die `qmd mcp` uitvoert met `lifecycle: keep-alive` |
  | `startDaemon` | `boolean` | `true`    | De mcporter-daemon automatisch starten wanneer `enabled` `true` is            |

  Vereist dat `mcporter` is geïnstalleerd en beschikbaar is via PATH, plus een geconfigureerde mcporter-server die `qmd mcp` uitvoert. Houd dit uitgeschakeld voor eenvoudigere lokale configuraties waarbij de kosten van het starten van een proces per query aanvaardbaar zijn.

  <AccordionGroup>
  <Accordion title="Updateschema">
    | Sleutel                     | Type      | Standaard | Beschrijving                                                                                              |
    | --------------------------- | --------- | --------- | --------------------------------------------------------------------------------------------------------- |
    | `update.interval`           | `string`  | `5m`      | Vernieuwingsinterval                                                                                      |
    | `update.debounceMs`         | `number`  | `15000`   | Bestandswijzigingen ontdubbelen                                                                           |
    | `update.onBoot`             | `boolean` | `true`    | Vernieuwen wanneer de langlevende QMD-beheerder wordt geopend; stel in op `false` om de directe opstartupdate over te slaan |
    | `update.startup`            | `string`  | `off`     | Optionele QMD-initialisatie bij het starten van de Gateway: `off`, `idle` of `immediate`                   |
    | `update.startupDelayMs`     | `number`  | `120000`  | Vertraging voordat de vernieuwing met `startup: "idle"` wordt uitgevoerd                                  |
    | `update.waitForBootSync`    | `boolean` | `false`   | Openen van de beheerder blokkeren totdat de eerste vernieuwing is voltooid                                |
    | `update.embedInterval`      | `string`  | `60m`     | Afzonderlijk interval voor embeddings                                                                     |
    | `update.commandTimeoutMs`   | `number`  | `30000`   | Time-out voor QMD-onderhoudsopdrachten (collecties weergeven/toevoegen)                                    |
    | `update.updateTimeoutMs`    | `number`  | `120000`  | Time-out voor elke cyclus van `qmd update`                                                                |
    | `update.embedTimeoutMs`     | `number`  | `120000`  | Time-out voor elke cyclus van `qmd embed`                                                                 |
  </Accordion>
  <Accordion title="Limieten">
    | Sleutel                   | Type     | Standaard | Beschrijving                              |
    | ------------------------- | -------- | --------- | ----------------------------------------- |
    | `limits.maxResults`       | `number` | `4`       | Maximaal aantal zoekresultaten            |
    | `limits.maxSnippetChars`  | `number` | `450`     | Lengte van fragmenten begrenzen           |
    | `limits.maxInjectedChars` | `number` | `2200`    | Totaal aantal ingevoegde tekens begrenzen |
    | `limits.timeoutMs`        | `number` | `4000`    | Time-out voor zoeken                      |
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
  <Accordion title="Bronvermeldingen">
    `memory.citations` is van toepassing op alle backends:

    | Waarde             | Gedrag                                                        |
    | ------------------ | ------------------------------------------------------------- |
    | `auto` (standaard) | Neem de voettekst `Source: <path#line>` op in fragmenten      |
    | `on`               | Neem de voettekst altijd op                                   |
    | `off`              | Laat de voettekst weg (pad wordt intern nog aan agent doorgegeven) |

  </Accordion>
</AccordionGroup>

Wanneer QMD-initialisatie bij het starten van de Gateway is ingeschakeld, start OpenClaw QMD alleen voor daarvoor in aanmerking komende agents. Als `update.onBoot` waar is en er geen interval- of embed-onderhoud is geconfigureerd, gebruikt het opstartproces een eenmalige manager voor de vernieuwing bij het opstarten en sluit deze vervolgens. Als een update- of embed-interval is geconfigureerd, opent het opstartproces de langlevende QMD-manager, zodat deze de watcher en intervaltimers kan beheren; `update.onBoot: false` slaat alleen de onmiddellijke vernieuwing bij het opstarten over.

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

Dreaming wordt als één geplande verwerkingsronde uitgevoerd en gebruikt interne lichte/diepe/REM-fasen als implementatiedetail.

Zie [Dreaming](/nl/concepts/dreaming) voor het conceptuele gedrag en de slash-opdrachten.

### Gebruikersinstellingen

| Sleutel                                | Type      | Standaardwaarde  | Beschrijving                                                                                                                          |
| -------------------------------------- | --------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`                              | `boolean` | `false`          | Schakel Dreaming volledig in of uit                                                                                                   |
| `frequency`                            | `string`  | `0 3 * * *`      | Optioneel Cron-schema voor de volledige Dreaming-verwerkingsronde                                                                     |
| `model`                                | `string`  | standaardmodel   | Optionele modeloverschrijving voor de Dream Diary-subagent                                                                            |
| `phases.deep.maxPromotedSnippetTokens` | `number`  | `160`            | Maximaal geschat aantal tokens dat wordt behouden uit elk kortetermijnherinneringsfragment dat naar `MEMORY.md` wordt gepromoveerd; herkomstmetagegevens blijven zichtbaar |

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
- Dreaming schrijft voor mensen leesbare verhalende uitvoer naar `DREAMS.md` (of het bestaande `dreams.md`).
- `dreaming.model` gebruikt de bestaande vertrouwenscontrole voor Plugin-subagents; stel `plugins.entries.memory-core.subagent.allowModelOverride: true` in voordat u dit inschakelt.
- Dream Diary probeert het eenmaal opnieuw met het standaardsessiemodel wanneer het geconfigureerde model niet beschikbaar is. Fouten in vertrouwen of de toelatingslijst worden gelogd en leiden niet stilzwijgend tot een nieuwe poging.
- Het beleid en de drempelwaarden voor de lichte/diepe/REM-fasen zijn intern gedrag, geen gebruikersconfiguratie.

</Note>

## Gerelateerd

- [Configuratiereferentie](/nl/gateway/configuration-reference)
- [Overzicht van geheugen](/nl/concepts/memory)
- [Zoeken in geheugen](/nl/concepts/memory-search)
