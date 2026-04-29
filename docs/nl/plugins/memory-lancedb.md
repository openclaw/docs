---
read_when:
    - Je configureert de meegeleverde memory-lancedb-Plugin
    - Je wilt door LanceDB ondersteund langetermijngeheugen met automatisch ophalen of automatisch vastleggen
    - Je gebruikt lokale OpenAI-compatibele embeddings zoals Ollama
sidebarTitle: Memory LanceDB
summary: Configureer de meegeleverde LanceDB-geheugenplugin, inclusief lokale Ollama-compatibele embeddings
title: Geheugen LanceDB
x-i18n:
    generated_at: "2026-04-29T23:03:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: bda53528857a492f1627f655e49be6775e0114115781371ff67debb155b7e731
    source_path: plugins/memory-lancedb.md
    workflow: 16
---

`memory-lancedb` is een meegeleverde geheugenplugin die langetermijngeheugen opslaat in
LanceDB en embeddings gebruikt voor terughalen. De plugin kan automatisch relevante
herinneringen terughalen vóór een modelbeurt en belangrijke feiten vastleggen na een antwoord.

Gebruik deze wanneer je een lokale vectordatabase voor geheugen wilt, een
OpenAI-compatibel embedding-eindpunt nodig hebt, of een geheugendatabase buiten
de standaard ingebouwde geheugenopslag wilt bewaren.

<Note>
`memory-lancedb` is een Active Memory-plugin. Schakel deze in door de geheugensleuf
te selecteren met `plugins.slots.memory = "memory-lancedb"`. Begeleidende plugins zoals
`memory-wiki` kunnen ernaast draaien, maar slechts één plugin is eigenaar van de actieve geheugensleuf.
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

Start de Gateway opnieuw nadat je de pluginconfiguratie hebt gewijzigd:

```bash
openclaw gateway restart
```

Controleer daarna of de plugin is geladen:

```bash
openclaw plugins list
```

## Door providers ondersteunde embeddings

`memory-lancedb` kan dezelfde provideradapters voor geheugenembeddings gebruiken als
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

Dit pad werkt met provider-auth-profielen die embedding-inloggegevens beschikbaar stellen.
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

OpenAI Codex / ChatGPT OAuth (`openai-codex`) is geen OpenAI Platform-
inloggegeven voor embeddings. Gebruik voor OpenAI-embeddings een OpenAI API-sleutel-auth-profiel,
`OPENAI_API_KEY` of `models.providers.openai.apiKey`. Gebruikers met alleen OAuth kunnen
een andere provider met embeddingondersteuning gebruiken, zoals GitHub Copilot of Ollama.

## Ollama-embeddings

Geef voor Ollama-embeddings de voorkeur aan de meegeleverde Ollama-embeddingprovider. Deze gebruikt het
native Ollama-`/api/embed`-eindpunt en volgt dezelfde regels voor auth/basis-URL als
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
accepteert zowel antwoorden met float-arrays als base64-gecodeerde float32-antwoorden.

Als je een onbewerkt OpenAI-compatibel embeddings-eindpunt hebt waarvoor geen
meegeleverde provideradapter bestaat, laat dan `embedding.provider` weg (of laat dit op `openai`) en
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

## Limieten voor terughalen en vastleggen

`memory-lancedb` heeft twee afzonderlijke tekstlimieten:

| Instelling        | Standaard | Bereik    | Van toepassing op                            |
| ----------------- | --------- | --------- | --------------------------------------------- |
| `recallMaxChars`  | `1000`    | 100-10000 | tekst die naar de embedding-API wordt gestuurd voor terughalen |
| `captureMaxChars` | `500`     | 100-10000 | lengte van assistant-bericht die in aanmerking komt voor vastleggen |

`recallMaxChars` beheert automatisch terughalen, de tool `memory_recall`, het
querypad `memory_forget` en `openclaw ltm search`. Automatisch terughalen geeft de voorkeur aan het
nieuwste gebruikersbericht uit de beurt en valt alleen terug op de volledige prompt wanneer er geen
gebruikersbericht beschikbaar is. Zo blijven kanaalmetadata en grote promptblokken
buiten het embeddingverzoek.

`captureMaxChars` bepaalt of een antwoord kort genoeg is om in aanmerking te komen
voor automatisch vastleggen. Het beperkt query-embeddings voor terughalen niet.

## Commando's

Wanneer `memory-lancedb` de actieve geheugenplugin is, registreert deze de `ltm` CLI-
naamruimte:

```bash
openclaw ltm list
openclaw ltm search "project preferences"
openclaw ltm stats
```

De plugin breidt ook `openclaw memory` uit met een niet-vector-subcommando `query`
dat rechtstreeks op de LanceDB-tabel draait:

```bash
openclaw memory query --cols id,text,createdAt --limit 20
openclaw memory query --filter "category = 'preference'" --order-by createdAt:desc
```

- `--cols <columns>`: door komma's gescheiden allowlist met kolommen (standaard `id`, `text`, `importance`, `category`, `createdAt`).
- `--filter <condition>`: SQL-achtige WHERE-clausule; begrensd op 200 tekens en beperkt tot alfanumerieke tekens, vergelijkingsoperatoren, aanhalingstekens, haakjes en een kleine set veilige interpunctie.
- `--limit <n>`: positief geheel getal; standaard `10`.
- `--order-by <column>:<asc|desc>`: sortering in het geheugen die na het filter wordt toegepast; de sorteerkolom wordt automatisch opgenomen in de projectie.

Agents krijgen ook LanceDB-geheugentools van de actieve geheugenplugin:

- `memory_recall` voor door LanceDB ondersteund terughalen
- `memory_store` voor het opslaan van belangrijke feiten, voorkeuren, beslissingen en entiteiten
- `memory_forget` voor het verwijderen van overeenkomende herinneringen

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

`storageOptions` accepteert tekenreeks-sleutel/waardeparen voor LanceDB-opslagbackends en
ondersteunt uitbreiding van `${ENV_VAR}`:

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

`memory-lancedb` is afhankelijk van het native pakket `@lancedb/lancedb`. Gepackagede
OpenClaw-installaties proberen eerst de meegeleverde runtime-afhankelijkheid en kunnen de
plugin-runtime-afhankelijkheid onder OpenClaw-status repareren wanneer de meegeleverde import niet
beschikbaar is.

Als een oudere installatie tijdens het laden van de plugin een fout over een ontbrekende `dist/package.json` of ontbrekende
`@lancedb/lancedb` logt, upgrade dan OpenClaw en start de
Gateway opnieuw.

Als de plugin logt dat LanceDB niet beschikbaar is op `darwin-x64`, gebruik dan de standaard
geheugenbackend op die machine, verplaats de Gateway naar een ondersteund platform, of
schakel `memory-lancedb` uit.

## Probleemoplossing

### Invoerlengte overschrijdt de contextlengte

Dit betekent meestal dat het embeddingmodel de terughaalquery heeft geweigerd:

```text
memory-lancedb: recall failed: Error: 400 the input length exceeds the context length
```

Stel een lagere `recallMaxChars` in en start daarna de Gateway opnieuw:

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

### Plugin laadt maar er verschijnen geen herinneringen

Controleer of `plugins.slots.memory` naar `memory-lancedb` verwijst en voer daarna uit:

```bash
openclaw ltm stats
openclaw ltm search "recent preference"
```

Als `autoCapture` is uitgeschakeld, haalt de plugin bestaande herinneringen terug, maar slaat deze
niet automatisch nieuwe op. Gebruik de tool `memory_store` of schakel
`autoCapture` in als je automatische vastlegging wilt.

## Gerelateerd

- [Geheugenoverzicht](/nl/concepts/memory)
- [Active Memory](/nl/concepts/active-memory)
- [Geheugen zoeken](/nl/concepts/memory-search)
- [Memory Wiki](/nl/plugins/memory-wiki)
- [Ollama](/nl/providers/ollama)
