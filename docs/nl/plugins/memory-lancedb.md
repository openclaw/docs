---
read_when:
    - Je configureert de memory-lancedb-plugin
    - Je wilt door LanceDB ondersteund langetermijngeheugen met automatisch ophalen of automatisch vastleggen
    - Je gebruikt lokale OpenAI-compatibele embeddings zoals Ollama
sidebarTitle: Memory LanceDB
summary: Configureer de officiële externe LanceDB-geheugen-Plugin, inclusief lokale Ollama-compatibele embeddings
title: Geheugen LanceDB
x-i18n:
    generated_at: "2026-06-27T17:55:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4142a755e788418a8b9c64a6ff3a8ce3c520bd6be09b685929478ae0754f7d39
    source_path: plugins/memory-lancedb.md
    workflow: 16
---

`memory-lancedb` is een officiële externe geheugenplugin die langetermijngeheugen opslaat in
LanceDB en embeddings gebruikt voor terughalen. Het kan automatisch relevante
herinneringen terughalen vóór een modelbeurt en belangrijke feiten vastleggen na een antwoord.

Gebruik het wanneer je een lokale vectordatabase voor geheugen wilt, een
OpenAI-compatibel embedding-eindpunt nodig hebt, of een geheugendatabase buiten
de standaard ingebouwde geheugenopslag wilt bewaren.

## Installatie

Installeer `memory-lancedb` voordat je `plugins.slots.memory = "memory-lancedb"` instelt:

```bash
openclaw plugins install @openclaw/memory-lancedb
```

De plugin wordt gepubliceerd naar npm en is niet gebundeld in de OpenClaw-runtime-image.
Het installatieprogramma schrijft de pluginvermelding en schakelt het geheugenslot om wanneer geen andere
plugin eigenaar ervan is.

<Note>
`memory-lancedb` is een actieve geheugenplugin. Schakel deze in door het geheugenslot
te selecteren met `plugins.slots.memory = "memory-lancedb"`. Companion-plugins zoals
`memory-wiki` kunnen ernaast draaien, maar slechts één plugin is eigenaar van het actieve geheugenslot.
</Note>

## Snel starten

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

Start de Gateway opnieuw na het wijzigen van de pluginconfiguratie:

```bash
openclaw gateway restart
```

Controleer daarna of de plugin is geladen:

```bash
openclaw plugins list
```

## Provider-ondersteunde embeddings

`memory-lancedb` kan dezelfde adapterproviders voor geheugen-embeddings gebruiken als
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

OpenAI Codex / ChatGPT OAuth is geen OpenAI Platform-embeddingreferentie.
Gebruik voor OpenAI-embeddings een OpenAI API-sleutel-auth-profiel,
`OPENAI_API_KEY`, of `models.providers.openai.apiKey`. Gebruikers met alleen OAuth kunnen
een andere embedding-geschikte provider gebruiken, zoals GitHub Copilot of Ollama.

## Ollama-embeddings

Voor Ollama-embeddings heeft de gebundelde Ollama-embeddingprovider de voorkeur. Deze gebruikt het
native Ollama-eindpunt `/api/embed` en volgt dezelfde regels voor auth/basis-URL als
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

Voor kleine lokale embeddingmodellen verlaag je `recallMaxChars` als je contextlengtefouten
ziet van de lokale server.

## OpenAI-compatibele providers

Sommige OpenAI-compatibele embeddingproviders weigeren de parameter `encoding_format`,
terwijl andere deze negeren en altijd `number[]`-vectoren retourneren.
`memory-lancedb` laat daarom `encoding_format` weg bij embeddingverzoeken en
accepteert zowel float-array-antwoorden als base64-gecodeerde float32-antwoorden.

Als je een onbewerkt OpenAI-compatibel embeddingseindpunt hebt waarvoor geen
gebundelde provideradapter bestaat, laat dan `embedding.provider` weg (of laat deze op `openai`) en
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

| Instelling        | Standaard | Bereik    | Van toepassing op                                       |
| ----------------- | --------- | --------- | ------------------------------------------------------- |
| `recallMaxChars`  | `1000`    | 100-10000 | tekst die voor terughalen naar de embedding-API wordt verzonden |
| `captureMaxChars` | `500`     | 100-10000 | berichtlengte die in aanmerking komt voor automatische vastlegging |
| `customTriggers`  | `[]`      | 0-50      | letterlijke zinnen die automatische vastlegging een bericht laten overwegen |

`recallMaxChars` beheert automatisch terughalen, de tool `memory_recall`, het
querypad `memory_forget` en `openclaw ltm search`. Automatisch terughalen geeft de voorkeur aan het
laatste gebruikersbericht uit de beurt en valt alleen terug op de volledige prompt wanneer er geen
gebruikersbericht beschikbaar is. Dit houdt kanaalmetadata en grote promptblokken
buiten het embeddingverzoek.

`captureMaxChars` bepaalt of een antwoord kort genoeg is om voor automatische
vastlegging te worden overwogen. Het beperkt geen embeddings voor terughaalquery's.

Met `customTriggers` kun je letterlijke zinnen voor automatische vastlegging toevoegen zonder
reguliere expressies te schrijven. De ingebouwde triggers bevatten veelvoorkomende Engelse, Tsjechische,
Chinese, Japanse en Koreaanse geheugenzinnen.

## Opdrachten

Wanneer `memory-lancedb` de actieve geheugenplugin is, registreert deze de `ltm` CLI-
naamruimte:

```bash
openclaw ltm list
openclaw ltm search "project preferences"
openclaw ltm stats
```

De subopdracht `query` voert rechtstreeks een niet-vectorquery uit op de LanceDB-tabel:

```bash
openclaw ltm query --cols id,text,createdAt --limit 20
openclaw ltm query --filter "category = 'preference'" --order-by createdAt:desc
```

- `--cols <columns>`: kommagescheiden kolomtoelatingslijst (standaard `id`, `text`, `importance`, `category`, `createdAt`).
- `--filter <condition>`: SQL-stijl WHERE-clausule; afgetopt op 200 tekens en beperkt tot alfanumerieke tekens, vergelijkingsoperators, aanhalingstekens, haakjes en een kleine set veilige leestekens.
- `--limit <n>`: positief geheel getal; standaard `10`.
- `--order-by <column>:<asc|desc>`: sortering in het geheugen toegepast na het filter; de sorteerkolom wordt automatisch opgenomen in de projectie.

Agents krijgen ook LanceDB-geheugentools van de actieve geheugenplugin:

- `memory_recall` voor terughalen met LanceDB-ondersteuning
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

`storageOptions` accepteert string-sleutel/waardeparen voor LanceDB-opslagbackends en
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
werk het pluginpakket opnieuw bij en start de Gateway opnieuw.

Als een oudere installatie tijdens het laden van de plugin een fout over ontbrekende `dist/package.json` of ontbrekende
`@lancedb/lancedb` logt, upgrade OpenClaw en start de
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

### Plugin laadt, maar er verschijnen geen herinneringen

Controleer of `plugins.slots.memory` naar `memory-lancedb` wijst en voer daarna uit:

```bash
openclaw ltm stats
openclaw ltm search "recent preference"
```

Als `autoCapture` is uitgeschakeld, haalt de plugin bestaande herinneringen terug, maar zal deze
niet automatisch nieuwe opslaan. Gebruik de tool `memory_store` of schakel
`autoCapture` in als je automatische vastlegging wilt.

## Gerelateerd

- [Geheugenoverzicht](/nl/concepts/memory)
- [Active Memory](/nl/concepts/active-memory)
- [Geheugen zoeken](/nl/concepts/memory-search)
- [Memory Wiki](/nl/plugins/memory-wiki)
- [Ollama](/nl/providers/ollama)
