---
read_when:
    - U wilt de standaardgeheugenbackend begrijpen
    - Je wilt embeddingproviders of hybride zoekfunctie configureren
summary: De standaard op SQLite gebaseerde geheugenbackend met zoeken op trefwoord, vectorzoeken en hybride zoeken
title: Ingebouwde geheugenengine
x-i18n:
    generated_at: "2026-06-27T17:26:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a867bd295778f81109b258a63a35a1683d652d4564e44335053af4d86f90584e
    source_path: concepts/memory-builtin.md
    workflow: 16
---

De ingebouwde engine is de standaard geheugenbackend. Deze slaat je geheugenindex op in
een SQLite-database per agent en heeft geen extra afhankelijkheden nodig om te beginnen.

## Wat deze biedt

- **Zoeken op trefwoorden** via FTS5-full-textindexering (BM25-score).
- **Vectorzoekopdrachten** via embeddings van elke ondersteunde provider.
- **Hybride zoekopdrachten** die beide combineren voor de beste resultaten.
- **CJK-ondersteuning** via trigram-tokenisatie voor Chinees, Japans en Koreaans.
- **sqlite-vec-versnelling** voor vectorkueries binnen de database (optioneel).

## Aan de slag

Standaard gebruikt de ingebouwde engine OpenAI-embeddings. Als je
`OPENAI_API_KEY` of `models.providers.openai.apiKey` al hebt geconfigureerd, werkt
vectorzoekfunctionaliteit zonder extra geheugenconfiguratie.

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

Zonder embeddingprovider is alleen zoeken op trefwoorden beschikbaar.

Om lokale GGUF-embeddings af te dwingen, installeer je de officiële llama.cpp-provider-Plugin
en wijs je `local.modelPath` daarna naar een GGUF-bestand:

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

| Provider          | ID                  | Opmerkingen                         |
| ----------------- | ------------------- | ----------------------------------- |
| Bedrock           | `bedrock`           | Gebruikt de AWS-referentieketen     |
| DeepInfra         | `deepinfra`         | Standaard: `BAAI/bge-m3`            |
| Gemini            | `gemini`            | Ondersteunt multimodaal (afbeelding + audio) |
| GitHub Copilot    | `github-copilot`    | Gebruikt Copilot-abonnement         |
| Lokaal            | `local`             | `@openclaw/llama-cpp-provider`      |
| Mistral           | `mistral`           |                                     |
| Ollama            | `ollama`            | Lokaal/zelf gehost                  |
| OpenAI            | `openai`            | Standaard: `text-embedding-3-small` |
| OpenAI-compatibel | `openai-compatible` | Generiek `/v1/embeddings`-endpoint  |
| Voyage            | `voyage`            |                                     |

Stel `memorySearch.provider` in om van OpenAI over te schakelen.

## Hoe indexering werkt

OpenClaw indexeert `MEMORY.md` en `memory/*.md` in chunks (~400 tokens met
80 tokens overlap) en slaat ze op in een SQLite-database per agent.

- **Indexlocatie:** de database van de eigenaaragent op
  `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`
- **Opslagonderhoud:** SQLite WAL-sidecarbestanden worden begrensd met periodieke
  checkpoints en checkpoints bij afsluiten.
- **Bestandsbewaking:** wijzigingen in geheugenbestanden activeren een gedebouncete herindexering (1,5 s).
- **Automatisch herindexeren:** wanneer de embeddingprovider, het model of de chunkingconfiguratie
  verandert, wordt de volledige index automatisch opnieuw opgebouwd.
- **Herindexeren op aanvraag:** `openclaw memory index --force`

<Info>
Je kunt ook Markdown-bestanden buiten de werkruimte indexeren met
`memorySearch.extraPaths`. Zie de
[configuratiereferentie](/nl/reference/memory-config#additional-memory-paths).
</Info>

## Wanneer te gebruiken

De ingebouwde engine is de juiste keuze voor de meeste gebruikers:

- Werkt direct, zonder extra afhankelijkheden.
- Verwerkt zoeken op trefwoorden en vectorzoekopdrachten goed.
- Ondersteunt alle embeddingproviders.
- Hybride zoekopdrachten combineren het beste van beide retrieval-benaderingen.

Overweeg over te schakelen naar [QMD](/nl/concepts/memory-qmd) als je reranking, query-uitbreiding
nodig hebt of mappen buiten de werkruimte wilt indexeren.

Overweeg [Honcho](/nl/concepts/memory-honcho) als je sessie-overstijgend geheugen met
automatische gebruikersmodellering wilt.

## Probleemoplossing

**Geheugenzoekfunctie uitgeschakeld?** Controleer `openclaw memory status`. Als er geen provider wordt
gedetecteerd, stel er dan expliciet een in of voeg een API-sleutel toe.

**Lokale provider niet gedetecteerd?** Bevestig dat het lokale pad bestaat en voer uit:

```bash
openclaw memory status --deep --agent main
openclaw memory index --force --agent main
```

Zowel zelfstandige CLI-opdrachten als de Gateway gebruiken dezelfde `local`-provider-id.
Stel `memorySearch.provider: "local"` in wanneer je lokale embeddings wilt.

**Verouderde resultaten?** Voer `openclaw memory index --force` uit om opnieuw op te bouwen. De watcher
kan in zeldzame randgevallen wijzigingen missen.

**sqlite-vec wordt niet geladen?** OpenClaw valt automatisch terug op in-process cosinusovereenkomst.
`openclaw memory status --deep` rapporteert de lokale vectoropslag
apart van de embeddingprovider, dus `Vector store: unavailable` wijst
op het laden van sqlite-vec, terwijl `Embeddings: unavailable` wijst op provider/auth
of modelgereedheid. Controleer de logs voor de specifieke laadfout.

## Configuratie

Voor het instellen van embeddingproviders, het afstemmen van hybride zoekopdrachten (gewichten, MMR, temporeel
verval), batchindexering, multimodaal geheugen, sqlite-vec, extra paden en alle
andere configuratieknoppen, zie de
[referentie voor geheugenconfiguratie](/nl/reference/memory-config).

## Gerelateerd

- [Geheugenoverzicht](/nl/concepts/memory)
- [Geheugenzoekfunctie](/nl/concepts/memory-search)
- [Active Memory](/nl/concepts/active-memory)
