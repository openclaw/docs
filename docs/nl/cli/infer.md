---
read_when:
    - '`openclaw infer`-opdrachten toevoegen of wijzigen'
    - Stabiele headless capaciteitsautomatisering ontwerpen
summary: Infer-first CLI voor provider-ondersteunde workflows voor modellen, afbeeldingen, audio, TTS, video, web en embeddings
title: Inferentie-CLI
x-i18n:
    generated_at: "2026-06-27T17:19:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 93ebb2a830bfbe6aad58cfa7aa2252cf016a6c9cb99b7592406593627e41fdd1
    source_path: cli/infer.md
    workflow: 16
---

`openclaw infer` is het canonieke headless oppervlak voor door providers ondersteunde inference-workflows.

Het toont bewust capability families, geen ruwe Gateway RPC-namen en geen ruwe agent-tool-id's.

## Maak van infer een skill

Kopieer en plak dit naar een agent:

```text
Lees https://docs.openclaw.ai/cli/infer en maak vervolgens een skill die mijn veelgebruikte workflows naar `openclaw infer` routeert.
Richt je op modelruns, image generation, video generation, audiotranscriptie, TTS, webzoekopdrachten en embeddings.
```

Een goede op infer gebaseerde skill moet:

- veelvoorkomende gebruikersintenties aan de juiste infer-subcommand koppelen
- enkele canonieke infer-voorbeelden bevatten voor de workflows die hij behandelt
- in voorbeelden en suggesties de voorkeur geven aan `openclaw infer ...`
- vermijden om het volledige infer-oppervlak opnieuw te documenteren in de skill-body

Typische dekking voor een op infer gerichte skill:

- `openclaw infer model run`
- `openclaw infer image generate`
- `openclaw infer audio transcribe`
- `openclaw infer tts convert`
- `openclaw infer web search`
- `openclaw infer embedding create`

## Waarom infer gebruiken

`openclaw infer` biedt een consistente CLI voor door providers ondersteunde inference-taken binnen OpenClaw.

Voordelen:

- Gebruik de providers en modellen die al in OpenClaw zijn geconfigureerd in plaats van eenmalige wrappers voor elke backend te bouwen.
- Houd workflows voor modellen, afbeeldingen, audiotranscriptie, TTS, video, web en embeddings onder één commandoboom.
- Gebruik een stabiele `--json`-uitvoervorm voor scripts, automatisering en door agents aangestuurde workflows.
- Geef de voorkeur aan een first-party OpenClaw-oppervlak wanneer de taak fundamenteel "inference uitvoeren" is.
- Gebruik voor de meeste infer-commands het normale lokale pad zonder de Gateway te vereisen.

Voor end-to-end providercontroles geef je de voorkeur aan `openclaw infer ...` zodra lagere-niveau
providertests groen zijn. Het oefent de geleverde CLI, het laden van configuratie,
default-agent-resolutie, activatie van gebundelde Plugins en de gedeelde capability-
runtime voordat het providerverzoek wordt gedaan.

## Commandoboom

```text
 openclaw infer
  list
  inspect

  model
    run
    list
    inspect
    providers
    auth login
    auth logout
    auth status

  image
    generate
    edit
    describe
    describe-many
    providers

  audio
    transcribe
    providers

  tts
    convert
    voices
    providers
    status
    enable
    disable
    set-provider

  video
    generate
    describe
    providers

  web
    search
    fetch
    providers

  embedding
    create
    providers
```

## Veelvoorkomende taken

Deze tabel koppelt veelvoorkomende inferentietaken aan de bijbehorende infer-opdracht.

| Taak                          | Opdracht                                                                                      | Opmerkingen                                           |
| ----------------------------- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| Voer een tekst-/modelprompt uit | `openclaw infer model run --prompt "..." --json`                                            | Gebruikt standaard het normale lokale pad             |
| Voer een modelprompt uit op afbeeldingen | `openclaw infer model run --prompt "Describe this" --file ./image.png --model provider/model` | Herhaal `--file` voor meerdere afbeeldingsinvoeren    |
| Genereer een afbeelding       | `openclaw infer image generate --prompt "..." --json`                                         | Gebruik `image edit` wanneer je begint met een bestaand bestand |
| Beschrijf een afbeeldingsbestand of URL | `openclaw infer image describe --file ./image.png --prompt "..." --json`               | `--model` moet een afbeeldingsgeschikt `<provider/model>` zijn |
| Transcribeer audio            | `openclaw infer audio transcribe --file ./memo.m4a --json`                                    | `--model` moet `<provider/model>` zijn                |
| Synthetiseer spraak           | `openclaw infer tts convert --text "..." --output ./speech.mp3 --json`                        | `tts status` is Gateway-georiënteerd                  |
| Genereer een video            | `openclaw infer video generate --prompt "..." --json`                                         | Ondersteunt providerhints zoals `--resolution`        |
| Beschrijf een videobestand    | `openclaw infer video describe --file ./clip.mp4 --json`                                      | `--model` moet `<provider/model>` zijn                |
| Doorzoek het web              | `openclaw infer web search --query "..." --json`                                              |                                                       |
| Haal een webpagina op         | `openclaw infer web fetch --url https://example.com --json`                                   |                                                       |
| Maak embeddings               | `openclaw infer embedding create --text "..." --json`                                         |                                                       |

## Gedrag

- `openclaw infer ...` is het primaire CLI-oppervlak voor deze workflows.
- Gebruik `--json` wanneer de uitvoer door een andere opdracht of script wordt verwerkt.
- Gebruik `--provider` of `--model provider/model` wanneer een specifieke backend vereist is.
- Gebruik `model run --thinking <level>` om een eenmalig denk-/redeneerniveau (`off`, `minimal`, `low`, `medium`, `high`, `adaptive`, `xhigh` of `max`) door te geven terwijl de run onbewerkt blijft.
- Voor `image describe`, `audio transcribe` en `video describe` moet `--model` de vorm `<provider/model>` gebruiken.
- Voor `image describe` accepteert `--file` lokale paden en HTTP(S)-afbeeldings-URL's. Externe URL's gebruiken het normale SSRF-beleid voor het ophalen van media.
- Voor `image describe` voert een expliciete `--model` die provider/dat model direct uit. Het model moet afbeeldingsgeschikt zijn in de modelcatalogus of providerconfiguratie. `codex/<model>` voert een begrensde beurt voor beeldbegrip via de Codex-appserver uit; `openai/<model>` gebruikt het OpenAI-providerpad met API-sleutel- of ChatGPT/Codex-OAuth-authenticatie.
- Staatloze uitvoeringsopdrachten zijn standaard lokaal.
- Gateway-beheerde statusopdrachten zijn standaard Gateway.
- Het normale lokale pad vereist niet dat de Gateway actief is.
- Lokale `model run` is een slanke eenmalige providercompletion. Het lost het geconfigureerde agentmodel en de authenticatie op, maar start geen chat-agentbeurt, laadt geen tools en opent geen gebundelde MCP-servers.
- `model run --file` accepteert afbeeldingsbestanden, detecteert hun MIME-type en stuurt ze met de opgegeven prompt naar het geselecteerde model. Herhaal `--file` voor meerdere afbeeldingen.
- `model run --file` weigert niet-afbeeldingsinvoer. Gebruik `infer audio transcribe` voor audiobestanden en `infer video describe` voor videobestanden.
- `model run --gateway` oefent Gateway-routering, opgeslagen authenticatie, providerselectie en de ingebedde runtime, maar draait nog steeds als een onbewerkte modelprobe: het stuurt de opgegeven prompt en eventuele afbeeldingsbijlagen zonder eerdere sessietranscriptie, bootstrap-/AGENTS-context, context-engine-assemblage, tools of gebundelde MCP-servers.
- `model run --gateway --model <provider/model>` vereist een vertrouwde operator-Gateway-referentie omdat het verzoek de Gateway vraagt om een eenmalige provider-/modeloverride uit te voeren.
- Lokale `model run --thinking` gebruikt het slanke providercompletionpad; providerspecifieke niveaus zoals `adaptive` en `max` worden toegewezen aan het dichtstbijzijnde overdraagbare eenvoudige completionniveau.

## Model

Gebruik `model` voor provider-ondersteunde tekstinferentie en model-/providerinspectie.

```bash
openclaw infer model run --prompt "Reply with exactly: smoke-ok" --json
openclaw infer model run --prompt "Summarize this changelog entry" --model openai/gpt-5.4 --json
openclaw infer model run --prompt "Describe this image in one sentence" --file ./photo.jpg --model google/gemini-2.5-flash --json
openclaw infer model run --prompt "Use more reasoning here" --thinking high --json
openclaw infer model providers --json
openclaw infer model inspect --name gpt-5.5 --json
```

Gebruik volledige `<provider/model>`-refs om een specifieke provider te smoke-testen zonder
de Gateway te starten of het volledige agenttool-oppervlak te laden:

```bash
openclaw infer model run --local --model anthropic/claude-sonnet-4-6 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model cerebras/zai-glm-4.7 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model google/gemini-2.5-flash --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model groq/llama-3.1-8b-instant --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model mistral/mistral-medium-3-5 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model mistral/mistral-small-latest --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model openai/gpt-5.5 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model ollama/qwen2.5vl:7b --prompt "Describe this image." --file ./photo.jpg --json
```

Opmerkingen:

- Lokale `model run` is de smalste CLI-smoke voor de gezondheid van provider/model/authenticatie omdat het, voor niet-Codex-providers, alleen de opgegeven prompt naar het geselecteerde model stuurt.
- Lokale `model run --model <provider/model>` kan exacte gebundelde statische catalogusrijen uit `models list --all` gebruiken voordat die provider naar configuratie wordt geschreven. Provider-authenticatie blijft vereist; ontbrekende referenties falen als authenticatiefouten, niet als `Unknown model`.
- Laat de temperatuur voor Mistral Medium 3.5-redeneerprobes oningesteld/standaard. Mistral weigert `reasoning_effort="high"` plus `temperature: 0`; gebruik `mistral/mistral-medium-3-5` met standaardtemperatuur of een niet-nul redeneermoduswaarde zoals `0.7`.
- Lokale Codex Responses-probes zijn de smalle uitzondering: OpenClaw voegt een minimale systeeminstructie toe zodat het transport het vereiste veld `instructions` kan vullen, zonder volledige agentcontext, tools, geheugen of sessietranscriptie toe te voegen.
- Lokale `model run --file` behoudt dat slanke pad en koppelt afbeeldingsinhoud direct aan het ene gebruikersbericht. Veelvoorkomende afbeeldingsbestanden zoals PNG, JPEG en WebP werken wanneer hun MIME-type als `image/*` wordt gedetecteerd; niet-ondersteunde of niet-herkende bestanden falen voordat de provider wordt aangeroepen.
- `model run --file` is het beste wanneer je het geselecteerde multimodale tekstmodel direct wilt testen. Gebruik `infer image describe` wanneer je OpenClaw's providerselectie voor beeldbegrip en standaardroutering voor afbeeldingsmodellen wilt.
- Het geselecteerde model moet afbeeldingsinvoer ondersteunen; modellen met alleen tekst kunnen het verzoek bij de providerlaag weigeren.
- `model run --prompt` moet niet-witruimtetekst bevatten; lege prompts worden geweigerd voordat lokale providers of de Gateway worden aangeroepen.
- Lokale `model run` sluit af met een niet-nulcode wanneer de provider geen tekstuitvoer retourneert, zodat onbereikbare lokale providers en lege completions niet op succesvolle probes lijken.
- Gebruik `model run --gateway` wanneer je Gateway-routering, agentruntime-instelling of Gateway-beheerde providerstatus moet testen terwijl de modelinvoer onbewerkt blijft. Gebruik `openclaw agent` of chatoppervlakken wanneer je de volledige agentcontext, tools, geheugen en sessietranscriptie wilt.
- `model auth login`, `model auth logout` en `model auth status` beheren opgeslagen provider-authenticatiestatus.

## Afbeelding

Gebruik `image` voor generatie, bewerking en beschrijving.

```bash
openclaw infer image generate --prompt "friendly lobster illustration" --json
openclaw infer image generate --prompt "cinematic product photo of headphones" --json
openclaw infer image generate --model openai/gpt-image-1.5 --output-format png --background transparent --prompt "simple red circle sticker on a transparent background" --json
openclaw infer image generate --model openai/gpt-image-2 --quality low --openai-moderation low --prompt "low-cost draft poster" --json
openclaw infer image generate --prompt "slow image backend" --timeout-ms 180000 --json
openclaw infer image edit --file ./logo.png --model openai/gpt-image-1.5 --output-format png --background transparent --prompt "keep the logo, remove the background" --json
openclaw infer image edit --file ./poster.png --prompt "make this a vertical story ad" --size 2160x3840 --aspect-ratio 9:16 --resolution 4K --json
openclaw infer image describe --file ./photo.jpg --json
openclaw infer image describe --file https://example.com/photo.png --json
openclaw infer image describe --file ./receipt.jpg --prompt "Extract the merchant, date, and total" --json
openclaw infer image describe-many --file ./before.png --file ./after.png --prompt "Compare the screenshots and list visible UI changes" --json
openclaw infer image describe --file ./ui-screenshot.png --model openai/gpt-5.4-mini --json
openclaw infer image describe --file ./photo.jpg --model ollama/qwen2.5vl:7b --prompt "Describe the image in one sentence" --timeout-ms 300000 --json
```

Opmerkingen:

- Gebruik `image edit` wanneer je begint met bestaande invoerbestanden.
- Gebruik `--size`, `--aspect-ratio` of `--resolution` met `image edit` voor
  providers/modellen die geometriehints bij bewerkingen met referentieafbeeldingen ondersteunen.
- Gebruik `--output-format png --background transparent` met
  `--model openai/gpt-image-1.5` voor OpenAI PNG-uitvoer met transparante achtergrond;
  `--openai-background` blijft beschikbaar als OpenAI-specifieke alias. Providers
  die geen achtergrondondersteuning declareren, rapporteren de hint als een genegeerde overschrijving.
- Gebruik `--quality low|medium|high|auto` voor providers die hints voor beeldkwaliteit
  ondersteunen, inclusief OpenAI. OpenAI accepteert ook `--openai-moderation low|auto` voor
  de providerspecifieke moderatiehint.
- Gebruik `image providers --json` om te controleren welke gebundelde afbeeldingsproviders
  vindbaar, geconfigureerd en geselecteerd zijn, en welke generatie-/bewerkingsmogelijkheden
  elke provider beschikbaar maakt.
- Gebruik `image generate --model <provider/model> --json` als de smalste live
  CLI-smoke voor wijzigingen in beeldgeneratie. Voorbeeld:

  ```bash
  openclaw infer image providers --json
  openclaw infer image generate \
    --model google/gemini-3.1-flash-image-preview \
    --prompt "Minimal flat test image: one blue square on a white background, no text." \
    --output ./openclaw-infer-image-smoke.png \
    --json
  ```

  De JSON-respons rapporteert `ok`, `provider`, `model`, `attempts` en geschreven
  uitvoerpaden. Wanneer `--output` is ingesteld, kan de uiteindelijke extensie het
  MIME-type volgen dat de provider teruggeeft.

- Voor `image describe` en `image describe-many` gebruik je `--prompt` om het vision-model een taakspecifieke instructie te geven, zoals OCR, vergelijking, UI-inspectie of beknopte bijschriften.
- Gebruik `--timeout-ms` met trage lokale vision-modellen of koude Ollama-starts.
- Voor `image describe` moet `--model` een afbeeldingsgeschikt `<provider/model>` zijn.
- Voor lokale Ollama vision-modellen haal je eerst het model op en stel je `OLLAMA_API_KEY` in op een willekeurige placeholderwaarde, bijvoorbeeld `ollama-local`. Zie [Ollama](/nl/providers/ollama#vision-and-image-description).

## Audio

Gebruik `audio` voor bestandstranscriptie.

```bash
openclaw infer audio transcribe --file ./memo.m4a --json
openclaw infer audio transcribe --file ./team-sync.m4a --language en --prompt "Focus on names and action items" --json
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

Opmerkingen:

- `audio transcribe` is bedoeld voor bestandstranscriptie, niet voor realtime sessiebeheer.
- `--model` moet `<provider/model>` zijn.

## TTS

Gebruik `tts` voor spraaksynthese en TTS-providerstatus.

```bash
openclaw infer tts convert --text "hello from openclaw" --output ./hello.mp3 --json
openclaw infer tts convert --text "Your build is complete" --output ./build-complete.mp3 --json
openclaw infer tts providers --json
openclaw infer tts status --json
```

Opmerkingen:

- `tts status` gebruikt standaard de Gateway omdat dit door de Gateway beheerde TTS-status weerspiegelt.
- Gebruik `tts providers`, `tts voices` en `tts set-provider` om TTS-gedrag te inspecteren en te configureren.

## Video

Gebruik `video` voor generatie en beschrijving.

```bash
openclaw infer video generate --prompt "cinematic sunset over the ocean" --json
openclaw infer video generate --prompt "slow drone shot over a forest lake" --resolution 768P --duration 6 --json
openclaw infer video describe --file ./clip.mp4 --json
openclaw infer video describe --file ./clip.mp4 --model openai/gpt-5.4-mini --json
```

Opmerkingen:

- `video generate` accepteert `--size`, `--aspect-ratio`, `--resolution`, `--duration`, `--audio`, `--watermark` en `--timeout-ms` en stuurt deze door naar de runtime voor videogeneratie.
- `--model` moet `<provider/model>` zijn voor `video describe`.

## Web

Gebruik `web` voor zoek- en ophaalworkflows.

```bash
openclaw infer web search --query "OpenClaw docs" --json
openclaw infer web search --query "OpenClaw infer web providers" --json
openclaw infer web fetch --url https://docs.openclaw.ai/cli/infer --json
openclaw infer web providers --json
```

Opmerkingen:

- Gebruik `web providers` om beschikbare, geconfigureerde en geselecteerde providers te inspecteren.

## Embedding

Gebruik `embedding` voor het maken van vectoren en het inspecteren van embeddingproviders.

```bash
openclaw infer embedding create --text "friendly lobster" --json
openclaw infer embedding create --text "customer support ticket: delayed shipment" --model openai/text-embedding-3-large --json
openclaw infer embedding providers --json
```

## JSON-uitvoer

Infer-opdrachten normaliseren JSON-uitvoer onder een gedeelde envelop:

```json
{
  "ok": true,
  "capability": "image.generate",
  "transport": "local",
  "provider": "openai",
  "model": "gpt-image-2",
  "attempts": [],
  "outputs": []
}
```

Velden op het hoogste niveau zijn stabiel:

- `ok`
- `capability`
- `transport`
- `provider`
- `model`
- `attempts`
- `outputs`
- `error`

Voor opdrachten die media genereren, bevat `outputs` bestanden die door OpenClaw zijn geschreven. Gebruik
de `path`, `mimeType`, `size` en eventuele mediaspecifieke afmetingen in die array
voor automatisering in plaats van menselijk leesbare stdout te parsen.

## Veelvoorkomende valkuilen

```bash
# Fout
openclaw infer media image generate --prompt "friendly lobster"

# Goed
openclaw infer image generate --prompt "friendly lobster"
```

```bash
# Fout
openclaw infer audio transcribe --file ./memo.m4a --model whisper-1 --json

# Goed
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

## Opmerkingen

- `openclaw capability ...` is een alias voor `openclaw infer ...`.

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Modellen](/nl/concepts/models)
