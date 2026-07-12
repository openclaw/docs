---
read_when:
    - U configureert de Plugin memory-lancedb
    - Je wilt door LanceDB ondersteund langetermijngeheugen met automatisch terughalen of automatisch vastleggen
    - Je gebruikt lokale OpenAI-compatibele embeddings, zoals Ollama
sidebarTitle: Memory LanceDB
summary: Configureer de officiële externe LanceDB-geheugenplugin, inclusief lokale Ollama-compatibele embeddings
title: Geheugen-LanceDB
x-i18n:
    generated_at: "2026-07-12T09:04:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cdcf5ef7b7fbb8bf6055363d86782cfa36df193fc724406dba06c1380fd9f434
    source_path: plugins/memory-lancedb.md
    workflow: 16
---

`memory-lancedb` is een officiële externe plugin die langetermijngeheugen opslaat in
LanceDB met vectorzoekopdrachten. De plugin kan vóór een modelbeurt automatisch
relevante herinneringen ophalen en na een antwoord automatisch belangrijke feiten vastleggen.

Gebruik de plugin voor een lokale vectordatabase, een OpenAI-compatibel embedding-eindpunt of
een geheugenopslag buiten de standaard ingebouwde geheugenbackend.

## Installatie

```bash
openclaw plugins install @openclaw/memory-lancedb
```

De plugin wordt gepubliceerd op npm en is niet opgenomen in de runtime-image
van OpenClaw. Bij installatie wordt de pluginvermelding toegevoegd, de plugin ingeschakeld en
`plugins.slots.memory` ingesteld op `memory-lancedb`. Als een andere plugin momenteel
het geheugenslot beheert, wordt die plugin met een waarschuwing uitgeschakeld.

<Note>
Aanvullende plugins zoals `memory-wiki` kunnen naast `memory-lancedb` worden uitgevoerd,
maar slechts één plugin beheert tegelijk het actieve geheugenslot.
</Note>

## Snel aan de slag

```json5
{
  plugins: {
    slots: {
      memory: "memory-lancedb",
    },
    entries: {
      "memory-lancedb": {
        enabled: true,
        config: {
          embedding: {
            provider: "openai",
            model: "text-embedding-3-small",
          },
          autoRecall: true,
          autoCapture: false,
        },
      },
    },
  },
}
```

Start de Gateway opnieuw nadat u de pluginconfiguratie hebt gewijzigd en controleer vervolgens of de plugin is geladen:

```bash
openclaw gateway restart
openclaw plugins list
```

## Embeddingconfiguratie

`embedding` is verplicht en moet ten minste één veld bevatten. `provider`
is standaard `openai`; `model` is standaard `text-embedding-3-small`.

| Veld                   | Type          | Opmerkingen                                                              |
| ---------------------- | ------------- | ------------------------------------------------------------------------ |
| `embedding.provider`   | tekenreeks    | Adapter-id, bijvoorbeeld `openai`, `github-copilot`, `ollama`. Standaard `openai`. |
| `embedding.model`      | tekenreeks    | Standaard `text-embedding-3-small`.                                      |
| `embedding.apiKey`     | tekenreeks    | Optioneel; ondersteunt uitbreiding van `${ENV_VAR}`.                     |
| `embedding.baseUrl`    | tekenreeks    | Optioneel; ondersteunt uitbreiding van `${ENV_VAR}`.                     |
| `embedding.dimensions` | geheel getal (>=1) | Vereist voor modellen die niet in de ingebouwde tabel staan (zie hieronder). |

Er bestaan twee aanvraagpaden:

- **Pad via provideradapter** (standaard): stel `embedding.provider` in en laat
  `embedding.apiKey`/`embedding.baseUrl` weg. De plugin zoekt het geconfigureerde
  authenticatieprofiel, de omgevingsvariabele of
  `models.providers.<provider>.apiKey` van de provider op via dezelfde
  embeddingadapters voor geheugen die `memory-core` gebruikt. Dit is het pad voor `github-copilot`, `ollama`
  en elke andere meegeleverde provider met ondersteuning voor embeddings.
- **Pad via directe OpenAI-compatibele client**: laat `embedding.provider` oningesteld
  (of stel het in op `"openai"`) en stel `embedding.apiKey` en `embedding.baseUrl` in. Gebruik dit
  voor een rechtstreeks OpenAI-compatibel embedding-eindpunt waarvoor geen meegeleverde
  provideradapter bestaat.

OpenAI Codex-/ChatGPT-OAuth is geen OpenAI Platform-referentie voor embeddings.
Gebruik voor OpenAI-embeddings een authenticatieprofiel met een OpenAI API-sleutel, `OPENAI_API_KEY` of
`models.providers.openai.apiKey`. Gebruikers die alleen OAuth gebruiken, moeten een andere
provider met ondersteuning voor embeddings kiezen, zoals `github-copilot` of `ollama`.

```json5
{
  plugins: {
    entries: {
      "memory-lancedb": {
        enabled: true,
        config: {
          embedding: {
            provider: "github-copilot",
            model: "text-embedding-3-small",
          },
        },
      },
    },
  },
}
```

Sommige OpenAI-compatibele embedding-eindpunten weigeren de parameter `encoding_format`;
andere negeren deze en retourneren altijd `number[]`. `memory-lancedb`
laat `encoding_format` weg uit aanvragen en accepteert zowel antwoorden met een reeks
zwevendekommagetallen als antwoorden met base64-gecodeerde float32-waarden, zodat beide antwoordvormen zonder configuratie werken.

### Dimensies

OpenClaw heeft alleen een ingebouwde dimensie voor `text-embedding-3-small` (1536) en
`text-embedding-3-large` (3072). Elk ander model vereist een expliciete
`embedding.dimensions`, zodat LanceDB de vectorkolom kan maken, bijvoorbeeld
ZhiPu `embedding-3` met 2048 dimensies:

```json5
{
  plugins: {
    entries: {
      "memory-lancedb": {
        enabled: true,
        config: {
          embedding: {
            apiKey: "${ZHIPU_API_KEY}",
            baseUrl: "https://open.bigmodel.cn/api/paas/v4",
            model: "embedding-3",
            dimensions: 2048,
          },
        },
      },
    },
  },
}
```

## Ollama-embeddings

Gebruik het pad via de meegeleverde Ollama-provideradapter (`embedding.provider: "ollama"`).
Dit pad roept het native eindpunt `/api/embed` van Ollama aan en volgt dezelfde regels voor authenticatie en
basis-URL als de provider [Ollama](/nl/providers/ollama).

```json5
{
  plugins: {
    slots: {
      memory: "memory-lancedb",
    },
    entries: {
      "memory-lancedb": {
        enabled: true,
        config: {
          embedding: {
            provider: "ollama",
            baseUrl: "http://127.0.0.1:11434",
            model: "mxbai-embed-large",
            dimensions: 1024,
          },
          recallMaxChars: 400,
          autoRecall: true,
          autoCapture: false,
        },
      },
    },
  },
}
```

`mxbai-embed-large` staat niet in de ingebouwde dimensietabel, dus `dimensions` is
verplicht. Verlaag voor kleine lokale embeddingmodellen `recallMaxChars` als de
lokale server fouten over de contextlengte retourneert.

## Limieten voor ophalen en vastleggen

| Instelling         | Standaard | Bereik                       | Van toepassing op                                           |
| ----------------- | --------- | ---------------------------- | ----------------------------------------------------------- |
| `recallMaxChars`  | `1000`    | 100-10000                    | Tekst die voor ophalen naar de embedding-API wordt verzonden. |
| `captureMaxChars` | `500`     | 100-10000                    | Berichtlengte die in aanmerking komt voor automatisch vastleggen. |
| `customTriggers`  | `[]`      | 0-50 items, elk <=100 tekens | Letterlijke woordgroepen waardoor automatisch vastleggen een bericht in overweging neemt. |

`recallMaxChars` begrenst de automatische ophaalquery van `before_prompt_build`, het
hulpmiddel `memory_recall`, het querypad van `memory_forget` en `openclaw ltm
search`. Automatisch ophalen embedt het nieuwste gebruikersbericht van de beurt en valt
alleen terug op de volledige prompt wanneer er geen gebruikersbericht aanwezig is, zodat kanaalmetadata
en grote promptblokken buiten de embeddingaanvraag blijven.

`captureMaxChars` bepaalt of een gebruikersbericht uit de gebeurtenis `agent_end`
van de beurt kort genoeg is om in aanmerking te komen voor automatisch vastleggen; dit heeft geen invloed op
ophaalquery's.

`customTriggers` voegt letterlijke woordgroepen voor automatisch vastleggen toe zonder reguliere expressies. Ingebouwde
triggers omvatten veelvoorkomende Engelse, Tsjechische, Chinese, Japanse en Koreaanse
geheugenwoordgroepen (`remember`, `prefer`, `记住`, `覚えて`, `기억해` en vergelijkbare).

Automatisch vastleggen weigert ook tekst die lijkt op envelop-/transportmetadata,
payloads voor promptinjectie of reeds geïnjecteerde `<relevant-memories>`-context,
en beperkt het aantal vastgelegde herinneringen tot 3 per agentbeurt.

## Opdrachten

`memory-lancedb` registreert de CLI-naamruimte `ltm` wanneer de plugin is geïnstalleerd
(niet alleen wanneer deze het actieve geheugenslot beheert):

```bash
openclaw ltm list [--limit <n>] [--order-by-created-at]
openclaw ltm search <query> [--limit <n>]
openclaw ltm stats
```

`ltm query` voert rechtstreeks een niet-vectoriële query uit op de LanceDB-tabel:

```bash
openclaw ltm query --cols id,text,createdAt --limit 20
openclaw ltm query --filter "category = 'preference'" --order-by createdAt:desc
```

| Vlag                              | Standaard                               | Opmerkingen                                                                                                                               |
| --------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `--cols <columns>`                | `id,text,importance,category,createdAt` | Door komma's gescheiden lijst met toegestane kolommen.                                                                                    |
| `--filter <condition>`            | geen                                    | SQL-achtige WHERE-clausule. Maximaal 200 tekens; alleen alfanumerieke tekens, `_-`, witruimte en `='"<>!.,()%*` zijn toegestaan.          |
| `--limit <n>`                     | `10`                                    | Positief geheel getal.                                                                                                                     |
| `--order-by <column>:<asc\|desc>` | geen                                    | Wordt in het geheugen gesorteerd nadat het filter is uitgevoerd; de sorteerkolom wordt automatisch aan de projectie toegevoegd en uit de uitvoer verwijderd als deze niet was aangevraagd. |

Agents krijgen drie hulpmiddelen van de actieve geheugenplugin:

- `memory_recall`: vectorzoekopdracht in opgeslagen herinneringen.
- `memory_store`: slaat een feit, voorkeur, beslissing of entiteit op (weigert tekst
  die op een payload voor promptinjectie lijkt; slaat vrijwel identieke opslagitems over).
- `memory_forget`: verwijdert op `memoryId` of op `query` (verwijdert automatisch één
  overeenkomst met een score boven 90%; anders worden kandidaat-id's weergegeven om onderscheid te maken).

## Opslag

LanceDB-gegevens worden standaard opgeslagen in `~/.openclaw/memory/lancedb`. Overschrijf dit met `dbPath`:

```json5
{
  plugins: {
    entries: {
      "memory-lancedb": {
        enabled: true,
        config: {
          dbPath: "~/.openclaw/memory/lancedb",
          embedding: {
            apiKey: "${OPENAI_API_KEY}",
            model: "text-embedding-3-small",
          },
        },
      },
    },
  },
}
```

`storageOptions` accepteert sleutel-/waardeparen van tekenreeksen voor LanceDB-opslagbackends
(bijvoorbeeld S3-compatibele objectopslag) en ondersteunt uitbreiding van `${ENV_VAR}`:

```json5
{
  plugins: {
    entries: {
      "memory-lancedb": {
        enabled: true,
        config: {
          dbPath: "s3://memory-bucket/openclaw",
          storageOptions: {
            access_key: "${AWS_ACCESS_KEY_ID}",
            secret_key: "${AWS_SECRET_ACCESS_KEY}",
            endpoint: "${AWS_ENDPOINT_URL}",
          },
          embedding: {
            apiKey: "${OPENAI_API_KEY}",
            model: "text-embedding-3-small",
          },
        },
      },
    },
  },
}
```

## Runtime-afhankelijkheden en platformondersteuning

`memory-lancedb` is afhankelijk van het native pakket `@lancedb/lancedb`, dat wordt beheerd door het
pluginpakket (niet door de kerndistributie van OpenClaw). Bij het starten herstelt de Gateway geen
plugin-afhankelijkheden; als de native afhankelijkheid ontbreekt of niet kan worden geladen,
installeer of werk dan het pluginpakket opnieuw bij en start de Gateway opnieuw.

`@lancedb/lancedb` publiceert geen native build voor `darwin-x64` (Intel
Mac). Op dat platform registreert de plugin tijdens het laden dat LanceDB niet beschikbaar is;
gebruik de standaard geheugenbackend, voer de Gateway uit op een ondersteund
platform/architectuur of schakel `memory-lancedb` uit.

## Problemen oplossen

### Invoerlengte overschrijdt de contextlengte

Het embeddingmodel heeft de ophaalquery geweigerd:

```text
memory-lancedb: recall failed: Error: 400 the input length exceeds the context length
```

Verlaag `recallMaxChars` en start vervolgens de Gateway opnieuw:

```json5
{
  plugins: {
    entries: {
      "memory-lancedb": {
        config: {
          recallMaxChars: 400,
        },
      },
    },
  },
}
```

Controleer voor Ollama ook of de embeddingserver bereikbaar is vanaf de Gateway-host
via het native embeddingeindpunt:

```bash
curl http://127.0.0.1:11434/api/embed \
  -H "Content-Type: application/json" \
  -d '{"model":"mxbai-embed-large","input":"hello"}'
```

### Niet-ondersteund embeddingmodel

Zonder `embedding.dimensions` zijn alleen de ingebouwde OpenAI-embeddingdimensies
bekend (`text-embedding-3-small`, `text-embedding-3-large`). Stel voor elk ander
model `embedding.dimensions` in op de vectorgrootte die het model rapporteert.

### Plugin wordt geladen, maar er verschijnen geen herinneringen

Controleer of `plugins.slots.memory` naar `memory-lancedb` verwijst en voer vervolgens het volgende uit:

```bash
openclaw ltm stats
openclaw ltm search "recent preference"
```

Als `autoCapture` is uitgeschakeld, haalt de plugin nog steeds bestaande herinneringen op, maar
slaat deze niet automatisch nieuwe op. Gebruik de tool `memory_store` of schakel
`autoCapture` in.

## Gerelateerd

- [Overzicht van geheugen](/nl/concepts/memory)
- [Active Memory](/nl/concepts/active-memory)
- [Zoeken in geheugen](/nl/concepts/memory-search)
- [Geheugenwiki](/nl/plugins/memory-wiki)
- [Ollama](/nl/providers/ollama)
