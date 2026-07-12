---
read_when:
    - Je wilt de standaardbackend voor het geheugen begrijpen
    - Je wilt embeddingproviders of hybride zoekopdrachten configureren
summary: De standaard op SQLite gebaseerde geheugenbackend met zoeken op trefwoorden, vectoren en een hybride zoekfunctie
title: Ingebouwde geheugenengine
x-i18n:
    generated_at: "2026-07-12T08:46:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e8cbe2bae73b1d393ac158edb67fc442e76d1e5ff93e5201dbb7e7216801aa85
    source_path: concepts/memory-builtin.md
    workflow: 16
---

De ingebouwde engine is de standaardbackend voor geheugen. Deze slaat je geheugenindex op
in een SQLite-database per agent en vereist geen extra afhankelijkheden om
aan de slag te gaan.

## Wat deze biedt

- **Zoeken op trefwoorden** via FTS5-indexering van volledige tekst (BM25-score).
- **Vectorzoekopdrachten** via embeddings van elke ondersteunde provider.
- **Hybride zoekopdrachten** die beide combineren voor de beste resultaten.
- **Ondersteuning voor CJK** via trigramtokenisatie voor Chinees, Japans en Koreaans.
- **sqlite-vec-versnelling** voor vectorquery's in de database (optioneel).

## Aan de slag

Standaard gebruikt de ingebouwde engine OpenAI-embeddings. Als `OPENAI_API_KEY` of
`models.providers.openai.apiKey` al is geconfigureerd, werken vectorzoekopdrachten
zonder extra geheugenconfiguratie.

Een provider expliciet instellen:

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "openai",
      },
    },
  },
}
```

Zonder een embeddingprovider zijn alleen zoekopdrachten op trefwoorden beschikbaar.

Om lokale GGUF-embeddings af te dwingen, installeer je de officiële
llama.cpp-providerplugin en laat je `local.modelPath` verwijzen naar een GGUF-bestand:

```bash
openclaw plugins install @openclaw/llama-cpp-provider
```

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "local",
        fallback: "none",
        local: {
          modelPath: "~/.node-llama-cpp/models/embeddinggemma-300m-qat-Q8_0.gguf",
        },
      },
    },
  },
}
```

## Ondersteunde embeddingproviders

| Provider          | ID                  | Opmerkingen                                  |
| ----------------- | ------------------- | -------------------------------------------- |
| Bedrock           | `bedrock`           | Gebruikt de AWS-referentieketen              |
| DeepInfra         | `deepinfra`         | Standaard: `BAAI/bge-m3`                     |
| Gemini            | `gemini`            | Ondersteunt multimodale invoer (beeld + audio) |
| GitHub Copilot    | `github-copilot`    | Gebruikt je Copilot-abonnement               |
| LM Studio         | `lmstudio`          | Lokaal/zelf gehost                           |
| Lokaal            | `local`             | `@openclaw/llama-cpp-provider`               |
| Mistral           | `mistral`           |                                              |
| Ollama            | `ollama`            | Lokaal/zelf gehost                           |
| OpenAI            | `openai`            | Standaard: `text-embedding-3-small`          |
| OpenAI-compatibel | `openai-compatible` | Algemeen `/v1/embeddings`-eindpunt           |
| Voyage            | `voyage`            |                                              |

Stel `memorySearch.provider` in om van OpenAI over te schakelen.

## Hoe indexering werkt

OpenClaw indexeert `MEMORY.md` en `memory/*.md` in segmenten (standaard 400 tokens met
een overlap van 80 tokens) en slaat deze op in een SQLite-database per agent.

- **Indexlocatie:** de database van de beherende agent op
  `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`
- **Opslagonderhoud:** de WAL-nevenbestanden van SQLite worden begrensd met periodieke
  controlepunten en controlepunten bij het afsluiten.
- **Bestandsbewaking:** wijzigingen in geheugenbestanden activeren met vertraging een
  herindexering (standaard 1,5 s).
- **Automatische herindexering:** de index wordt automatisch opnieuw opgebouwd wanneer de
  embeddingprovider, het model, de segmentatieconfiguratie, de geconfigureerde bronnen of het bereik veranderen.
- **Herindexering op aanvraag:** `openclaw memory index --force`

<Info>
Je kunt met `memorySearch.extraPaths` ook Markdown-bestanden buiten de werkruimte
indexeren. Zie de
[configuratiereferentie](/nl/reference/memory-config#additional-memory-paths).
</Info>

## Wanneer te gebruiken

De ingebouwde engine is voor de meeste gebruikers de juiste keuze:

- Werkt direct zonder extra afhankelijkheden.
- Verwerkt zoekopdrachten op trefwoorden en vectorzoekopdrachten goed.
- Ondersteunt alle embeddingproviders.
- Hybride zoekopdrachten combineren het beste van beide opvraagmethoden.

Overweeg over te schakelen naar [QMD](/nl/concepts/memory-qmd) als je herrangschikking,
query-uitbreiding of indexering van mappen buiten de werkruimte nodig hebt.

Overweeg [Honcho](/nl/concepts/memory-honcho) als je geheugen over meerdere sessies heen
met automatische gebruikersmodellering wilt.

## Problemen oplossen

**Geheugenzoekfunctie uitgeschakeld?** Controleer `openclaw memory status`. Als er geen provider
wordt gedetecteerd, stel er dan expliciet een in of voeg een API-sleutel toe.

**Lokale provider niet gedetecteerd?** Controleer of het lokale pad bestaat en voer het volgende uit:

```bash
openclaw memory status --deep --agent main
openclaw memory index --force --agent main
```

Zowel zelfstandige CLI-opdrachten als de Gateway gebruiken dezelfde `local`-provider-ID.
Stel `memorySearch.provider: "local"` in wanneer je lokale embeddings wilt gebruiken.

**Verouderde resultaten?** Voer `openclaw memory index --force` uit om de index opnieuw op te bouwen. De bewaker
kan in zeldzame randgevallen wijzigingen missen.

**Wordt sqlite-vec niet geladen?** OpenClaw valt automatisch terug op cosinusgelijkenis
binnen het proces. `openclaw memory status --deep` rapporteert de lokale
vectoropslag afzonderlijk van de embeddingprovider, dus `Vector store:
unavailable` wijst op het laden van sqlite-vec, terwijl `Embeddings: unavailable`
wijst op de gereedheid van de provider/authenticatie of het model. Controleer de logboeken op de specifieke
laadfout.

## Configuratie

Zie voor het instellen van embeddingproviders, het afstemmen van hybride zoekopdrachten
(gewichten, MMR, tijdsverval), batchindexering, multimodaal geheugen, sqlite-vec,
extra paden en alle overige configuratieopties de
[referentie voor geheugenconfiguratie](/nl/reference/memory-config).

## Gerelateerd

- [Overzicht van geheugen](/nl/concepts/memory)
- [Geheugen doorzoeken](/nl/concepts/memory-search)
- [Active Memory](/nl/concepts/active-memory)
