---
read_when:
    - Je wilt de standaardgeheugenbackend begrijpen
    - Je wilt providers voor inbeddingen of hybride zoeken configureren
summary: De standaard op SQLite gebaseerde geheugenbackend met trefwoord-, vector- en hybride zoekfunctie
title: Ingebouwde geheugenengine
x-i18n:
    generated_at: "2026-05-03T21:30:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 72f5d1fee02bff0962bd012575b62846c1f11c030fd1174fdb2af1e81909f52a
    source_path: concepts/memory-builtin.md
    workflow: 16
---

De ingebouwde engine is de standaardgeheugenbackend. Deze slaat je geheugenindex op in
een SQLite-database per agent en heeft geen extra afhankelijkheden nodig om te starten.

## Wat deze biedt

- **Zoeken op trefwoorden** via FTS5-full-text-indexering (BM25-score).
- **Vectorzoeken** via embeddings van elke ondersteunde provider.
- **Hybride zoeken** dat beide combineert voor de beste resultaten.
- **CJK-ondersteuning** via trigramtokenisatie voor Chinees, Japans en Koreaans.
- **sqlite-vec-versnelling** voor vectorquery's binnen de database (optioneel).

## Aan de slag

Als je een API-sleutel hebt voor OpenAI, Gemini, Voyage, Mistral of DeepInfra, detecteert de ingebouwde
engine deze automatisch en schakelt vectorzoeken in. Geen configuratie nodig.

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

Installeer het optionele runtimepakket
`node-llama-cpp` naast OpenClaw om de ingebouwde lokale embeddingprovider te forceren en wijs vervolgens `local.modelPath`
naar een GGUF-bestand:

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

| Provider  | ID          | Automatisch gedetecteerd | Opmerkingen                         |
| --------- | ----------- | ------------------------ | ----------------------------------- |
| OpenAI    | `openai`    | Ja                       | Standaard: `text-embedding-3-small` |
| Gemini    | `gemini`    | Ja                       | Ondersteunt multimodaal (afbeelding + audio) |
| Voyage    | `voyage`    | Ja                       |                                     |
| Mistral   | `mistral`   | Ja                       |                                     |
| DeepInfra | `deepinfra` | Ja                       | Standaard: `BAAI/bge-m3`            |
| Ollama    | `ollama`    | Nee                      | Lokaal, expliciet instellen         |
| Lokaal    | `local`     | Ja (eerst)               | Optionele `node-llama-cpp`-runtime  |

Automatische detectie kiest de eerste provider waarvan de API-sleutel kan worden gevonden, in de
weergegeven volgorde. Stel `memorySearch.provider` in om dit te overschrijven.

## Hoe indexeren werkt

OpenClaw indexeert `MEMORY.md` en `memory/*.md` in chunks (~400 tokens met
80-token-overlap) en slaat ze op in een SQLite-database per agent.

- **Indexlocatie:** `~/.openclaw/memory/<agentId>.sqlite`
- **Opslagonderhoud:** SQLite WAL-sidecars worden begrensd met periodieke checkpoints en
  checkpoints bij afsluiten.
- **Bestanden bewaken:** wijzigingen in geheugenbestanden activeren een gedebouncete herindexering (1,5 s).
- **Automatisch herindexeren:** wanneer de embeddingprovider, het model of de chunkingconfiguratie
  wijzigt, wordt de volledige index automatisch opnieuw opgebouwd.
- **Op aanvraag herindexeren:** `openclaw memory index --force`

<Info>
Je kunt ook Markdown-bestanden buiten de werkruimte indexeren met
`memorySearch.extraPaths`. Zie de
[configuratiereferentie](/nl/reference/memory-config#additional-memory-paths).
</Info>

## Wanneer te gebruiken

De ingebouwde engine is voor de meeste gebruikers de juiste keuze:

- Werkt direct zonder extra afhankelijkheden.
- Verwerkt zoeken op trefwoorden en vectorzoeken goed.
- Ondersteunt alle embeddingproviders.
- Hybride zoeken combineert het beste van beide ophaalmethoden.

Overweeg over te stappen op [QMD](/nl/concepts/memory-qmd) als je reranking, query-uitbreiding
nodig hebt of mappen buiten de werkruimte wilt indexeren.

Overweeg [Honcho](/nl/concepts/memory-honcho) als je sessie-overstijgend geheugen met
automatische gebruikersmodellering wilt.

## Probleemoplossing

**Geheugenzoeken uitgeschakeld?** Controleer `openclaw memory status`. Als er geen provider wordt
gedetecteerd, stel er dan expliciet een in of voeg een API-sleutel toe.

**Lokale provider niet gedetecteerd?** Controleer of het lokale pad bestaat en voer uit:

```bash
openclaw memory status --deep --agent main
openclaw memory index --force --agent main
```

Zowel zelfstandige CLI-opdrachten als de Gateway gebruiken dezelfde provider-id `local`.
Als de provider is ingesteld op `auto`, worden lokale embeddings alleen als eerste overwogen
wanneer `memorySearch.local.modelPath` naar een bestaand lokaal bestand wijst.

**Verouderde resultaten?** Voer `openclaw memory index --force` uit om opnieuw op te bouwen. De watcher
kan in zeldzame randgevallen wijzigingen missen.

**sqlite-vec wordt niet geladen?** OpenClaw valt automatisch terug op in-process cosinusgelijkenis.
`openclaw memory status --deep` rapporteert de lokale vectoropslag
afzonderlijk van de embeddingprovider, dus `Vector store: unavailable` wijst
op het laden van sqlite-vec, terwijl `Embeddings: unavailable` wijst op provider/auth
of gereedheid van het model. Controleer logs op de specifieke laadfout.

## Configuratie

Voor het instellen van embeddingproviders, afstemming van hybride zoeken (gewichten, MMR, temporeel
verval), batchindexering, multimodaal geheugen, sqlite-vec, extra paden en alle
andere configuratieknoppen, zie de
[referentie voor geheugenconfiguratie](/nl/reference/memory-config).

## Gerelateerd

- [Geheugenoverzicht](/nl/concepts/memory)
- [Geheugenzoeken](/nl/concepts/memory-search)
- [Active Memory](/nl/concepts/active-memory)
