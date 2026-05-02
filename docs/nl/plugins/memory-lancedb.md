---
read_when:
    - Je configureert de meegeleverde memory-lancedb-Plugin
    - Je wilt door LanceDB ondersteund langetermijngeheugen met automatisch ophalen of automatisch vastleggen
    - Je gebruikt lokale OpenAI-compatibele embeddings zoals Ollama
sidebarTitle: Memory LanceDB
summary: Configureer de meegeleverde LanceDB-geheugen-Plugin, inclusief lokale Ollama-compatibele embeddings
title: Geheugen LanceDB
x-i18n:
    generated_at: "2026-05-02T11:23:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 671daa20e4f070f9beb0187ff76db9368297b3bc78873ebf3f09ac7ccffa00a2
    source_path: plugins/memory-lancedb.md
    workflow: 16
---

`memory-lancedb` is een meegeleverde memory-plugin die langetermijngeheugen opslaat in
LanceDB en embeddings gebruikt voor recall. De plugin kan automatisch relevante
memories ophalen vóór een modelbeurt en belangrijke feiten vastleggen na een antwoord.

Gebruik de plugin wanneer je een lokale vectordatabase voor memory wilt, een
OpenAI-compatibel embedding-eindpunt nodig hebt, of een memory-database buiten
de standaard ingebouwde memory-store wilt houden.

<Note>
`memory-lancedb` is een Active Memory-plugin. Schakel deze in door het memory-slot
te selecteren met `plugins.slots.memory = "memory-lancedb"`. Begeleidende plugins zoals
`memory-wiki` kunnen ernaast draaien, maar slechts één plugin is eigenaar van het actieve memory-slot.
</Note>

## Snelstart

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

Herstart de Gateway nadat je de plugin-configuratie hebt gewijzigd:

```bash
openclaw gateway restart
```

Controleer daarna of de plugin is geladen:

```bash
openclaw plugins list
```

## Provider-ondersteunde embeddings

`memory-lancedb` kan dezelfde memory-embedding-provideradapters gebruiken als
`memory-core`. Stel `embedding.provider` in en laat `embedding.apiKey` weg om het
geconfigureerde auth-profiel, de omgevingsvariabele of
`models.providers.<provider>.apiKey` van de provider te gebruiken.

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
        },
      },
    },
  },
}
```

Dit pad werkt met provider-auth-profielen die embedding-referenties beschikbaar maken.
GitHub Copilot kan bijvoorbeeld worden gebruikt wanneer het Copilot-profiel/-abonnement
embeddings ondersteunt:

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
            provider: "github-copilot",
            model: "text-embedding-3-small",
          },
        },
      },
    },
  },
}
```

OpenAI Codex / ChatGPT OAuth (`openai-codex`) is geen OpenAI Platform
embedding-referentie. Gebruik voor OpenAI-embeddings een OpenAI API key-auth-profiel,
`OPENAI_API_KEY`, of `models.providers.openai.apiKey`. Gebruikers met alleen OAuth kunnen
een andere provider gebruiken die embeddings ondersteunt, zoals GitHub Copilot of Ollama.

## Ollama-embeddings

Gebruik voor Ollama-embeddings bij voorkeur de meegeleverde Ollama-embeddingprovider. Deze gebruikt het
native Ollama `/api/embed`-eindpunt en volgt dezelfde auth-/basis-URL-regels als
de Ollama-provider die is gedocumenteerd in [Ollama](/nl/providers/ollama).

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

Stel `dimensions` in voor niet-standaard embeddingmodellen. OpenClaw kent de
dimensies voor `text-embedding-3-small` en `text-embedding-3-large`; aangepaste
modellen hebben de waarde in de configuratie nodig zodat LanceDB de vectorkolom kan maken.

Verlaag voor kleine lokale embeddingmodellen `recallMaxChars` als je contextlengtefouten
van de lokale server ziet.

## OpenAI-compatibele providers

Sommige OpenAI-compatibele embeddingproviders weigeren de parameter `encoding_format`,
terwijl andere deze negeren en altijd `number[]`-vectoren retourneren.
`memory-lancedb` laat daarom `encoding_format` weg bij embeddingverzoeken en
accepteert zowel float-array-antwoorden als base64-gecodeerde float32-antwoorden.

Als je een raw OpenAI-compatibel embeddings-eindpunt hebt waarvoor geen
meegeleverde provideradapter bestaat, laat `embedding.provider` dan weg (of laat deze op `openai` staan) en
stel `embedding.apiKey` plus `embedding.baseUrl` in. Dit behoudt het directe
OpenAI-compatibele clientpad.

Stel `embedding.dimensions` in voor providers waarvan de modeldimensies niet ingebouwd
zijn. ZhiPu `embedding-3` gebruikt bijvoorbeeld `2048` dimensies:

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

## Recall- en capture-limieten

`memory-lancedb` heeft twee afzonderlijke tekstlimieten:

| Instelling        | Standaard | Bereik    | Van toepassing op                            |
| ----------------- | --------- | --------- | -------------------------------------------- |
| `recallMaxChars`  | `1000`    | 100-10000 | tekst die voor recall naar de embedding-API wordt verzonden |
| `captureMaxChars` | `500`     | 100-10000 | lengte van assistentberichten die in aanmerking komen voor capture |

`recallMaxChars` bepaalt auto-recall, de tool `memory_recall`, het
querypad `memory_forget` en `openclaw ltm search`. Auto-recall geeft de voorkeur aan het
laatste gebruikersbericht uit de beurt en valt alleen terug op de volledige prompt wanneer er geen
gebruikersbericht beschikbaar is. Hierdoor blijven kanaalmetadata en grote promptblokken
buiten het embeddingverzoek.

`captureMaxChars` bepaalt of een antwoord kort genoeg is om in aanmerking te komen
voor automatische capture. Het beperkt recall-query-embeddings niet.

## Commando's

Wanneer `memory-lancedb` de actieve memory-plugin is, registreert deze de `ltm` CLI
namespace:

```bash
openclaw ltm list
openclaw ltm search "project preferences"
openclaw ltm stats
```

De plugin breidt ook `openclaw memory` uit met een niet-vector-`query`-subcommando
dat rechtstreeks tegen de LanceDB-tabel draait:

```bash
openclaw memory query --cols id,text,createdAt --limit 20
openclaw memory query --filter "category = 'preference'" --order-by createdAt:desc
```

- `--cols <columns>`: door komma's gescheiden allowlist met kolommen (standaard `id`, `text`, `importance`, `category`, `createdAt`).
- `--filter <condition>`: SQL-achtige WHERE-clausule; beperkt tot 200 tekens en tot alfanumerieke tekens, vergelijkingsoperators, aanhalingstekens, haakjes en een kleine set veilige leestekens.
- `--limit <n>`: positief geheel getal; standaard `10`.
- `--order-by <column>:<asc|desc>`: in-memory sortering toegepast na het filter; de sorteerkolom wordt automatisch opgenomen in de projectie.

Agents krijgen ook LanceDB-memorytools van de actieve memory-plugin:

- `memory_recall` voor door LanceDB ondersteunde recall
- `memory_store` voor het opslaan van belangrijke feiten, voorkeuren, beslissingen en entiteiten
- `memory_forget` voor het verwijderen van overeenkomende memories

## Opslag

Standaard staan LanceDB-gegevens onder `~/.openclaw/memory/lancedb`. Overschrijf het
pad met `dbPath`:

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

`storageOptions` accepteert string key/value-paren voor LanceDB-opslagbackends en
ondersteunt `${ENV_VAR}`-uitbreiding:

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

## Runtime-afhankelijkheden

`memory-lancedb` is afhankelijk van het native pakket `@lancedb/lancedb`. Verpakte
OpenClaw behandelt dat pakket als onderdeel van het pluginpakket. Het opstarten van de Gateway
herstelt plugin-afhankelijkheden niet; als de afhankelijkheid ontbreekt, installeer of
werk het pluginpakket opnieuw bij en herstart de Gateway.

Als een oudere installatie tijdens het laden van de plugin een ontbrekende `dist/package.json` of ontbrekende
`@lancedb/lancedb`-fout logt, upgrade dan OpenClaw en herstart de
Gateway.

Als de plugin logt dat LanceDB niet beschikbaar is op `darwin-x64`, gebruik dan de standaard
memory-backend op die machine, verplaats de Gateway naar een ondersteund platform, of
schakel `memory-lancedb` uit.

## Probleemoplossing

### Invoerlengte overschrijdt de contextlengte

Dit betekent meestal dat het embeddingmodel de recall-query heeft geweigerd:

```text
memory-lancedb: recall failed: Error: 400 the input length exceeds the context length
```

Stel een lagere `recallMaxChars` in en herstart daarna de Gateway:

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

Controleer voor Ollama ook of de embeddingserver bereikbaar is vanaf de Gateway-host:

```bash
curl http://127.0.0.1:11434/v1/embeddings \
  -H "Content-Type: application/json" \
  -d '{"model":"mxbai-embed-large","input":"hello"}'
```

### Niet-ondersteund embeddingmodel

Zonder `dimensions` zijn alleen de ingebouwde OpenAI-embeddingdimensies bekend.
Stel voor lokale of aangepaste embeddingmodellen `embedding.dimensions` in op de vectorgrootte
die door dat model wordt gerapporteerd.

### Plugin laadt, maar er verschijnen geen memories

Controleer of `plugins.slots.memory` naar `memory-lancedb` wijst en voer daarna uit:

```bash
openclaw ltm stats
openclaw ltm search "recent preference"
```

Als `autoCapture` is uitgeschakeld, zal de plugin bestaande memories ophalen maar
niet automatisch nieuwe opslaan. Gebruik de tool `memory_store` of schakel
`autoCapture` in als je automatische capture wilt.

## Gerelateerd

- [Memory-overzicht](/nl/concepts/memory)
- [Active Memory](/nl/concepts/active-memory)
- [Memory search](/nl/concepts/memory-search)
- [Memory Wiki](/nl/plugins/memory-wiki)
- [Ollama](/nl/providers/ollama)
