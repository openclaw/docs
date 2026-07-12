---
read_when:
    - Je wilt embeddings voor geheugenzoekopdrachten van een lokaal GGUF-model
    - U configureert memorySearch.provider = "local"
    - Je hebt de OpenClaw-plugin nodig die eigenaar is van de node-llama-cpp-runtime
sidebarTitle: llama.cpp Provider
summary: Installeer de officiële llama.cpp-provider voor lokale GGUF-geheugenembeddings
title: llama.cpp-provider
x-i18n:
    generated_at: "2026-07-12T09:09:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 369ec199e8493356912337b849a84f829672e8872d17083c9a597f4e5294ebd5
    source_path: plugins/llama-cpp.md
    workflow: 16
---

`llama-cpp` is de officiële externe providerplugin voor lokale GGUF-embeddings.
Deze registreert de embeddingprovider-id `local` en beheert de
`node-llama-cpp`-runtimeafhankelijkheid die wordt gebruikt door `memorySearch.provider: "local"`.

Installeer de plugin voordat u lokale geheugenembeddings gebruikt:

```bash
openclaw plugins install @openclaw/llama-cpp-provider
```

Het hoofd-npm-pakket `openclaw` bevat `node-llama-cpp` niet. Door de systeemeigen
afhankelijkheid in deze plugin te houden, wordt voorkomen dat normale npm-updates
van OpenClaw een handmatig geïnstalleerde runtime in de pakketmap van OpenClaw
verwijderen.

## Configuratie

Stel `memorySearch.provider` in op `local`:

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "local",
        local: {
          modelPath: "hf:ggml-org/embeddinggemma-300m-qat-q8_0-GGUF/embeddinggemma-300m-qat-Q8_0.gguf",
        },
      },
    },
  },
}
```

`local.modelPath` gebruikt standaard de hierboven weergegeven `hf:`-URI (`embeddinggemma-300m-qat-Q8_0.gguf`).
Verwijs naar een andere `hf:`-URI of een lokaal `.gguf`-bestand om een ander
model te gebruiken. `local.modelCacheDir` overschrijft de locatie waar gedownloade
modellen in de cache worden opgeslagen (standaard: `~/.node-llama-cpp/models`) en
`local.contextSize` accepteert een geheel getal of `"auto"`.

Wanneer `local.contextSize` numeriek is, geeft de provider die vereiste ook door
aan de automatische plaatsing van GPU-lagen van node-llama-cpp. Hierdoor kan
node-llama-cpp het model en de embeddingcontext samen inpassen, terwijl de
controles voor geheugenveiligheid behouden blijven. Met `"auto"` behoudt
node-llama-cpp de normale automatische plaatsing.

## Systeemeigen runtime

Gebruik Node 24 voor het soepelste systeemeigen installatieproces. Broncodecheck-outs
die pnpm gebruiken, moeten mogelijk de systeemeigen afhankelijkheid goedkeuren en
opnieuw bouwen:

```bash
pnpm approve-builds
pnpm rebuild node-llama-cpp
```

## Runtimediagnostiek

Voer `openclaw memory status --deep` uit nadat de provider is geladen om de
geselecteerde backend en build, apparaatnamen, naar de GPU overgehevelde lagen,
aangevraagde contextgrootte en de laatst waargenomen momentopname van VRAM of
uniform geheugen te bekijken. De VRAM-waarden bevatten een tijdstempel van de
waarneming, omdat passieve statusuitlezingen het model niet opnieuw laden en het
apparaat niet pollen.

Dezelfde laatst bekende gegevens kunnen in `openclaw doctor` verschijnen wanneer
de actieve Gateway de lokale provider al heeft gebruikt. Een normale status- of
doctor-opdracht laadt niet uitsluitend voor het verzamelen van diagnostische
gegevens een model.

## Probleemoplossing

Als `node-llama-cpp` ontbreekt of niet kan worden geladen, meldt OpenClaw de fout
met de volgende instructies:

1. Installeer de plugin: `openclaw plugins install @openclaw/llama-cpp-provider`.
2. Gebruik Node 24 voor systeemeigen installaties/updates.
3. Vanuit een pnpm-broncodecheck-out: `pnpm approve-builds` en vervolgens `pnpm rebuild node-llama-cpp`.

Voor lokale embeddings met minder installatiecomplexiteit en zonder de
systeemeigen buildstap stelt u `memorySearch.provider` in op een externe
embeddingprovider, zoals `lmstudio`, `ollama`, `openai` of `voyage`.
