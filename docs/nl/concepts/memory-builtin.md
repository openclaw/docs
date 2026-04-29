---
read_when:
    - Je wilt de standaardgeheugenbackend begrijpen
    - Je wilt embeddingproviders of hybride zoekfunctionaliteit configureren
summary: De standaard op SQLite gebaseerde geheugenbackend met zoekwoord-, vector- en hybride zoekfunctionaliteit
title: Ingebouwde geheugenengine
x-i18n:
    generated_at: "2026-04-29T22:38:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: aa1597a9a49a6f1124cedf49f6f5a4c336f76dd5998ced246affb9c2e8171f05
    source_path: concepts/memory-builtin.md
    workflow: 16
---

De ingebouwde engine is de standaardgeheugenbackend. Deze slaat je geheugenindex op in
een SQLite-database per agent en heeft geen extra afhankelijkheden nodig om te beginnen.

## Wat deze biedt

- **Trefwoordzoekopdrachten** via FTS5-fulltextindexering (BM25-score).
- **Vectorzoekopdrachten** via embeddings van elke ondersteunde provider.
- **Hybride zoekopdrachten** die beide combineren voor de beste resultaten.
- **CJK-ondersteuning** via trigram-tokenisatie voor Chinees, Japans en Koreaans.
- **sqlite-vec-versnelling** voor vectorkwery's in de database (optioneel).

## Aan de slag

Als je een API-sleutel hebt voor OpenAI, Gemini, Voyage, Mistral of DeepInfra, detecteert de ingebouwde
engine deze automatisch en schakelt vectorzoekopdrachten in. Geen configuratie nodig.

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

Zonder embeddingprovider is alleen trefwoordzoekopdracht beschikbaar.

Om de ingebouwde lokale embeddingprovider te forceren, installeer je het optionele
`node-llama-cpp`-runtimepakket naast OpenClaw en laat je `local.modelPath`
naar een GGUF-bestand verwijzen:

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
| Gemini    | `gemini`    | Ja                       | Ondersteunt multimodaal (beeld + audio) |
| Voyage    | `voyage`    | Ja                       |                                     |
| Mistral   | `mistral`   | Ja                       |                                     |
| DeepInfra | `deepinfra` | Ja                       | Standaard: `BAAI/bge-m3`            |
| Ollama    | `ollama`    | Nee                      | Lokaal, expliciet instellen         |
| Local     | `local`     | Ja (als eerste)          | Optionele `node-llama-cpp`-runtime  |

Automatische detectie kiest de eerste provider waarvan de API-sleutel kan worden gevonden, in de
weergegeven volgorde. Stel `memorySearch.provider` in om dit te overschrijven.

## Hoe indexering werkt

OpenClaw indexeert `MEMORY.md` en `memory/*.md` in chunks (~400 tokens met
80 tokens overlap) en slaat ze op in een SQLite-database per agent.

- **Indexlocatie:** `~/.openclaw/memory/<agentId>.sqlite`
- **Opslagonderhoud:** SQLite WAL-sidecars worden begrensd met periodieke en
  afsluitcheckpoints.
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

- Werkt direct zonder extra afhankelijkheden.
- Verwerkt trefwoord- en vectorzoekopdrachten goed.
- Ondersteunt alle embeddingproviders.
- Hybride zoekopdrachten combineren het beste van beide ophaalmethoden.

Overweeg over te stappen naar [QMD](/nl/concepts/memory-qmd) als je reranking, query-
uitbreiding nodig hebt, of mappen buiten de werkruimte wilt indexeren.

Overweeg [Honcho](/nl/concepts/memory-honcho) als je geheugen over sessies heen wilt met
automatische gebruikersmodellering.

## Problemen oplossen

**Geheugenzoekopdracht uitgeschakeld?** Controleer `openclaw memory status`. Als er geen provider wordt
gedetecteerd, stel er dan expliciet een in of voeg een API-sleutel toe.

**Lokale provider niet gedetecteerd?** Controleer of het lokale pad bestaat en voer uit:

```bash
openclaw memory status --deep --agent main
openclaw memory index --force --agent main
```

Zowel zelfstandige CLI-opdrachten als de Gateway gebruiken dezelfde `local`-provider-ID.
Als de provider is ingesteld op `auto`, worden lokale embeddings alleen als eerste overwogen
wanneer `memorySearch.local.modelPath` naar een bestaand lokaal bestand verwijst.

**Verouderde resultaten?** Voer `openclaw memory index --force` uit om opnieuw op te bouwen. De watcher
kan in zeldzame randgevallen wijzigingen missen.

**sqlite-vec laadt niet?** OpenClaw valt automatisch terug op in-process cosinusovereenkomst.
Controleer de logs voor de specifieke laadfout.

## Configuratie

Voor het instellen van embeddingproviders, het afstemmen van hybride zoekopdrachten (gewichten, MMR, temporeel
verval), batchindexering, multimodaal geheugen, sqlite-vec, extra paden en alle
andere configuratieknoppen, zie de
[Geheugenconfiguratiereferentie](/nl/reference/memory-config).

## Gerelateerd

- [Geheugenoverzicht](/nl/concepts/memory)
- [Geheugenzoekopdracht](/nl/concepts/memory-search)
- [Active Memory](/nl/concepts/active-memory)
