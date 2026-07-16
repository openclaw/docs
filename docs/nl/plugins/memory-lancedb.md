---
read_when:
    - Je configureert de Plugin memory-lancedb
    - Je wilt langetermijngeheugen op basis van LanceDB met automatisch terughalen of automatisch vastleggen
    - Je gebruikt lokale OpenAI-compatibele embeddings, zoals Ollama
sidebarTitle: Memory LanceDB
summary: Configureer de officiële externe LanceDB-geheugenplugin, inclusief lokale Ollama-compatibele embeddings
title: Geheugen-LanceDB
x-i18n:
    generated_at: "2026-07-16T16:14:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 786b511da4fbfd90f4c3e5be5a1aeddf5daa59036247552bd671f4bab89319f6
    source_path: plugins/memory-lancedb.md
    workflow: 16
---

`memory-lancedb` is een officiële externe plugin die langetermijngeheugen opslaat in
LanceDB met vectorzoekopdrachten. De plugin kan relevante herinneringen automatisch ophalen vóór een modelbeurt
en belangrijke feiten automatisch vastleggen na een antwoord.

Gebruik de plugin voor een lokale vectordatabase, een OpenAI-compatibel embedding-eindpunt of
een geheugenopslag buiten de standaard ingebouwde geheugenbackend.

## Installatie

```bash
openclaw plugins install @openclaw/memory-lancedb
```

De plugin wordt gepubliceerd op npm; deze is niet opgenomen in de OpenClaw-runtime-
image. Bij installatie wordt de pluginvermelding geschreven, wordt de plugin ingeschakeld en wordt
`plugins.slots.memory` gewijzigd in `memory-lancedb`. Als een andere plugin momenteel eigenaar is van
het geheugenslot, wordt die plugin uitgeschakeld met een waarschuwing.

<Note>
Aanvullende plugins zoals `memory-wiki` kunnen naast `memory-lancedb` worden uitgevoerd,
maar slechts één plugin tegelijk is eigenaar van het actieve geheugenslot.
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

Herstart de Gateway nadat je de pluginconfiguratie hebt gewijzigd en controleer vervolgens of de plugin is geladen:

```bash
openclaw gateway restart
openclaw plugins list
```

## Embeddingconfiguratie

`embedding` is vereist en moet ten minste één veld bevatten. `provider`
is standaard `openai`; `model` is standaard `text-embedding-3-small`.

| Veld                   | Type          | Opmerkingen                                                               |
| ---------------------- | ------------- | ------------------------------------------------------------------------- |
| `embedding.provider`   | tekenreeks    | Adapter-id, bijvoorbeeld `openai`, `github-copilot`, `ollama`. Standaard `openai`. |
| `embedding.model`      | tekenreeks    | Standaard `text-embedding-3-small`.                                       |
| `embedding.apiKey`     | tekenreeks    | Optioneel; ondersteunt uitbreiding van `${ENV_VAR}`.                      |
| `embedding.baseUrl`    | tekenreeks    | Optioneel; ondersteunt uitbreiding van `${ENV_VAR}`.                      |
| `embedding.dimensions` | geheel getal (>=1) | Vereist voor modellen die niet in de ingebouwde tabel staan (zie hieronder). |

Er bestaan twee aanvraagpaden:

- **Pad via provideradapter** (standaard): stel `embedding.provider` in en laat
  `embedding.apiKey`/`embedding.baseUrl` weg. De plugin lost het geconfigureerde
  authenticatieprofiel, de omgevingsvariabele of
  `models.providers.<provider>.apiKey` van de provider op via dezelfde geheugenembedding-
  adapters die `memory-core` gebruikt. Dit is het pad voor `github-copilot`, `ollama`
  en elke andere gebundelde provider met ondersteuning voor embeddings.
- **Pad via directe OpenAI-compatibele client**: laat `embedding.provider` oningesteld
  (of `"openai"`) en stel `embedding.apiKey` plus `embedding.baseUrl` in. Gebruik dit
  voor een rechtstreeks OpenAI-compatibel embedding-eindpunt waarvoor geen gebundelde provider-
  adapter bestaat.

OpenAI Codex-/ChatGPT-OAuth is geen OpenAI Platform-referentie voor embeddings.
Gebruik voor OpenAI-embeddings een authenticatieprofiel met een OpenAI-API-sleutel, `OPENAI_API_KEY` of
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
laat `encoding_format` weg uit aanvragen en accepteert zowel antwoorden met float-arrays als
base64-gecodeerde float32-antwoorden, zodat beide antwoordstructuren zonder configuratie werken.

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

Gebruik het pad via de gebundelde Ollama-provideradapter (`embedding.provider: "ollama"`).
Dit roept het eigen `/api/embed`-eindpunt van Ollama aan en volgt dezelfde regels voor authenticatie en de basis-
URL als de [Ollama](/nl/providers/ollama)-provider.

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
vereist. Verlaag voor kleine lokale embeddingmodellen `recallMaxChars` als de
lokale server fouten over de contextlengte retourneert.

## Limieten voor ophalen en vastleggen

| Instelling         | Standaard | Bereik                       | Van toepassing op                                           |
| ------------------ | --------- | ---------------------------- | ----------------------------------------------------------- |
| `recallMaxChars`  | `1000`  | 100-10000                    | Tekst die voor ophalen naar de embedding-API wordt gestuurd. |
| `captureMaxChars` | `500`   | 100-10000                    | Berichtlengte die in aanmerking komt voor automatisch vastleggen. |
| `customTriggers`  | `[]`    | 0-50 items, elk <=100 tekens | Letterlijke woordgroepen waardoor automatisch vastleggen een bericht overweegt. |

`recallMaxChars` begrenst de automatische ophaalquery van `before_prompt_build`, het
hulpmiddel `memory_recall`, het querypad van `memory_forget` en `openclaw ltm
search`. Automatisch ophalen maakt een embedding van het nieuwste gebruikersbericht uit de beurt en valt
alleen terug op de volledige prompt wanneer er geen gebruikersbericht aanwezig is, zodat kanaal-
metadata en grote promptblokken buiten de embeddingaanvraag blijven.

`captureMaxChars` bepaalt of een gebruikersbericht uit de `agent_end`-
gebeurtenis van de beurt kort genoeg is om in aanmerking te komen voor automatisch vastleggen; dit heeft geen invloed op
ophaalquery's.

`customTriggers` voegt letterlijke woordgroepen voor automatisch vastleggen toe zonder regex. Ingebouwde
triggers omvatten gangbare Engelse, Tsjechische, Chinese, Japanse en Koreaanse geheugen-
woordgroepen (`remember`, `prefer`, `记住`, `覚えて`, `기억해` en vergelijkbare).

Automatisch vastleggen weigert ook tekst die lijkt op envelop-/transportmetadata,
promptinjectiepayloads of reeds geïnjecteerde `<relevant-memories>`-context,
en legt maximaal 3 herinneringen per agentbeurt vast.

Elke herinnering is eigendom van één agent. Ophalen, duplicaatdetectie, vastleggen,
weergeven, rechtstreekse query's en verwijderen handhaven allemaal die eigenaar voordat rijen worden geretourneerd of
gewijzigd. Een agent met `memorySearch.enabled: false` (in `agents.list[]`
of via `agents.defaults`) krijgt ook geen van de hulpmiddelen `memory_recall`, `memory_store`
of `memory_forget` en neemt niet deel aan automatisch ophalen of
vastleggen, zelfs wanneer de `autoRecall`-/`autoCapture`-vlaggen op pluginniveau zijn ingeschakeld.

## Opdrachten

`memory-lancedb` registreert de CLI-naamruimte `ltm` wanneer deze is geïnstalleerd
(niet alleen wanneer deze eigenaar is van het actieve geheugenslot):

```bash
openclaw ltm list [--agent <id>] [--limit <n>] [--order-by-created-at]
openclaw ltm search <query> [--agent <id>] [--limit <n>]
openclaw ltm stats [--agent <id>]
```

`ltm query` voert rechtstreeks een niet-vectorquery uit op de LanceDB-tabel:

```bash
openclaw ltm query --agent research --cols id,text,createdAt --limit 20
openclaw ltm query --filter "category = 'preference'" --order-by createdAt:desc
```

| Vlag                              | Standaard                               | Opmerkingen                                                                                                                                |
| --------------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `--agent <id>`                    | geconfigureerde standaardagent          | Selecteert de privénaamruimte van de agent. Beschikbaar voor `list`, `search`, `query` en `stats`.                                         |
| `--cols <columns>`                | `id,text,importance,category,createdAt` | Door komma's gescheiden toestemmingslijst met kolommen.                                                                                    |
| `--filter <condition>`            | geen                                    | Eén vergelijking op een uitvoerkolom, zoals `category = 'preference'` of `importance >= 0.8`. Tekenreekswaarden moeten tussen aanhalingstekens staan. |
| `--limit <n>`                     | `10`                                    | Positief geheel getal.                                                                                                                      |
| `--order-by <column>:<asc\|desc>` | geen                                    | Wordt in het geheugen gesorteerd nadat het filter is uitgevoerd; de sorteerkolom wordt automatisch aan de projectie toegevoegd en uit de uitvoer verwijderd als deze niet is aangevraagd. |

Agents krijgen drie hulpmiddelen van de actieve geheugenplugin:

- `memory_recall`: vectorzoekopdracht in opgeslagen herinneringen.
- `memory_store`: sla een feit, voorkeur, beslissing of entiteit op (weigert tekst
  die op een promptinjectiepayload lijkt; slaat bijna-duplicaten over).
- `memory_forget`: verwijder op `memoryId` of op `query` (verwijdert automatisch één
  overeenkomst met een score van meer dan 90%; anders worden kandidaat-id's weergegeven om de keuze te verduidelijken).

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

De plugin onderhoudt één LanceDB-tabel en slaat in elke
rij een genormaliseerde agenteigenaar op. Dit is een opslaggrens, geen filter na het zoeken: agenteigendom wordt
toegepast vóór de vectorrangschikking en wordt opgenomen in predicaten voor weergeven, query's, tellen en verwijderen.
`ltm query --filter` accepteert één gevalideerde vergelijking op de
openbare uitvoerkolommen. De opslag bouwt die vergelijking afzonderlijk van het
verplichte eigenaarspredicaat op, zodat een filter de query niet kan uitbreiden naar een andere
agent.

Databases die vóór de invoering van eigendom per agent zijn gemaakt, hebben geen betrouwbare herkomstgegevens per rij.
Bij een upgrade wijst `openclaw doctor --fix` deze verouderde rijen eenmalig toe aan de
geconfigureerde standaardagent. Runtimetoegang wordt standaard geweigerd totdat die migratie is
voltooid; andere agents nemen de oude gedeelde rijen nooit over.

`storageOptions` accepteert tekenreeksparen van sleutels en waarden voor LanceDB-opslagbackends
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

`memory-lancedb` is afhankelijk van het native pakket `@lancedb/lancedb`, dat
wordt beheerd door het pluginpakket (niet door de kerndistributie van OpenClaw).
Bij het opstarten herstelt de Gateway geen plugin-afhankelijkheden; als de native
afhankelijkheid ontbreekt of niet kan worden geladen, installeer of werk dan het
pluginpakket opnieuw bij en start de Gateway opnieuw.

`@lancedb/lancedb` publiceert geen native build voor `darwin-x64` (Intel
Mac). Op dat platform registreert de plugin tijdens het laden dat LanceDB niet
beschikbaar is; gebruik de standaardgeheugenbackend, voer de Gateway uit op een
ondersteund platform of ondersteunde architectuur, of schakel
`memory-lancedb` uit.

## Problemen oplossen

### Invoerlengte overschrijdt de contextlengte

Het embeddingmodel heeft de opvraagquery geweigerd:

```text
memory-lancedb: opvragen mislukt: Fout: 400 de invoerlengte overschrijdt de contextlengte
```

Verlaag `recallMaxChars` en start daarna de Gateway opnieuw:

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

Controleer voor Ollama ook of de embeddingserver bereikbaar is vanaf de
Gateway-host via het native embed-eindpunt:

```bash
curl http://127.0.0.1:11434/api/embed \
  -H "Content-Type: application/json" \
  -d '{"model":"mxbai-embed-large","input":"hello"}'
```

### Niet-ondersteund embeddingmodel

Zonder `embedding.dimensions` zijn alleen de ingebouwde embeddingdimensies van
OpenAI bekend (`text-embedding-3-small`, `text-embedding-3-large`). Stel voor elk ander
model `embedding.dimensions` in op de vectorgrootte die dat model rapporteert.

### Plugin wordt geladen, maar er verschijnen geen herinneringen

Controleer of `plugins.slots.memory` naar `memory-lancedb` verwijst en voer
vervolgens het volgende uit:

```bash
openclaw ltm stats
openclaw ltm search "recent preference"
```

Als `autoCapture` is uitgeschakeld, vraagt de plugin bestaande herinneringen
nog steeds op, maar slaat deze niet automatisch nieuwe op. Gebruik de tool
`memory_store` of schakel `autoCapture` in.

## Gerelateerd

- [Geheugenoverzicht](/nl/concepts/memory)
- [Active Memory](/nl/concepts/active-memory)
- [Zoeken in geheugen](/nl/concepts/memory-search)
- [Geheugenwiki](/nl/plugins/memory-wiki)
- [Ollama](/nl/providers/ollama)
