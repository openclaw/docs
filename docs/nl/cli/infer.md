---
read_when:
    - Toevoegen of wijzigen van `openclaw infer`-commando's
    - Stabiele automatisering van functies zonder gebruikersinterface ontwerpen
summary: CLI met inferentie als uitgangspunt voor door providers ondersteunde workflows voor modellen, afbeeldingen, audio, TTS, video, web en embeddings
title: Inferentie-CLI
x-i18n:
    generated_at: "2026-05-02T11:12:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 04f8b4aeb70e960835612eedcc0a22202957803ca4e5eeb3f1e107e8c736e458
    source_path: cli/infer.md
    workflow: 16
---

`openclaw infer` is het canonieke headless oppervlak voor door providers ondersteunde inferentieworkflows.

Het toont bewust capability-families, geen ruwe Gateway RPC-namen en geen ruwe agenttool-id's.

## Zet infer om in een skill

Kopieer en plak dit naar een agent:

```text
Read https://docs.openclaw.ai/cli/infer, then create a skill that routes my common workflows to `openclaw infer`.
Focus on model runs, image generation, video generation, audio transcription, TTS, web search, and embeddings.
```

Een goede op infer gebaseerde skill moet:

- veelvoorkomende gebruikersintenties aan de juiste infer-subcommand koppelen
- een paar canonieke infer-voorbeelden bevatten voor de workflows die de skill dekt
- `openclaw infer ...` in voorbeelden en suggesties verkiezen
- vermijden om het volledige infer-oppervlak opnieuw te documenteren in de skill-body

Typische dekking voor op infer gerichte Skills:

- `openclaw infer model run`
- `openclaw infer image generate`
- `openclaw infer audio transcribe`
- `openclaw infer tts convert`
- `openclaw infer web search`
- `openclaw infer embedding create`

## Waarom infer gebruiken

`openclaw infer` biedt één consistente CLI voor door providers ondersteunde inferentietaken binnen OpenClaw.

Voordelen:

- Gebruik de providers en modellen die al in OpenClaw zijn geconfigureerd, in plaats van eenmalige wrappers voor elke backend te bedraden.
- Houd workflows voor modellen, afbeeldingen, audiotranscriptie, TTS, video, web en embeddings onder één commandoboom.
- Gebruik een stabiele `--json`-uitvoervorm voor scripts, automatisering en agentgestuurde workflows.
- Verkies een first-party OpenClaw-oppervlak wanneer de taak fundamenteel "inferentie uitvoeren" is.
- Gebruik het normale lokale pad zonder de Gateway te vereisen voor de meeste infer-commando's.

Voor end-to-end providercontroles heeft `openclaw infer ...` de voorkeur zodra lagere provider-tests groen zijn. Het oefent de geleverde CLI, config laden, default-agent-resolutie, activering van gebundelde plugins en de gedeelde capability-runtime uit voordat het providerverzoek wordt gedaan.

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

Deze tabel koppelt veelvoorkomende inferentietaken aan het bijbehorende infer-commando.

| Taak                         | Commando                                                                                      | Opmerkingen                                           |
| ---------------------------- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| Een tekst-/modelprompt uitvoeren | `openclaw infer model run --prompt "..." --json`                                              | Gebruikt standaard het normale lokale pad             |
| Een modelprompt op afbeeldingen uitvoeren | `openclaw infer model run --prompt "Describe this" --file ./image.png --model provider/model` | Herhaal `--file` voor meerdere afbeeldingsinputs      |
| Een afbeelding genereren     | `openclaw infer image generate --prompt "..." --json`                                         | Gebruik `image edit` wanneer je vanuit een bestaand bestand start |
| Een afbeeldingsbestand beschrijven | `openclaw infer image describe --file ./image.png --prompt "..." --json`                      | `--model` moet een afbeelding-capabel `<provider/model>` zijn |
| Audio transcriberen          | `openclaw infer audio transcribe --file ./memo.m4a --json`                                    | `--model` moet `<provider/model>` zijn                |
| Spraak synthetiseren         | `openclaw infer tts convert --text "..." --output ./speech.mp3 --json`                        | `tts status` is Gateway-georiënteerd                  |
| Een video genereren          | `openclaw infer video generate --prompt "..." --json`                                         | Ondersteunt providerhints zoals `--resolution`        |
| Een videobestand beschrijven | `openclaw infer video describe --file ./clip.mp4 --json`                                      | `--model` moet `<provider/model>` zijn                |
| Op het web zoeken            | `openclaw infer web search --query "..." --json`                                              |                                                       |
| Een webpagina ophalen        | `openclaw infer web fetch --url https://example.com --json`                                   |                                                       |
| Embeddings maken             | `openclaw infer embedding create --text "..." --json`                                         |                                                       |

## Gedrag

- `openclaw infer ...` is het primaire CLI-oppervlak voor deze workflows.
- Gebruik `--json` wanneer de uitvoer door een ander commando of script wordt gebruikt.
- Gebruik `--provider` of `--model provider/model` wanneer een specifieke backend vereist is.
- Voor `image describe`, `audio transcribe` en `video describe` moet `--model` de vorm `<provider/model>` gebruiken.
- Voor `image describe` voert een expliciete `--model` die provider/dat model rechtstreeks uit. Het model moet afbeelding-capabel zijn in de modelcatalogus of providerconfig. `codex/<model>` voert een begrensde Codex app-server beurt voor afbeeldingsbegrip uit; `openai-codex/<model>` gebruikt het OpenAI Codex OAuth-providerpad.
- Stateless uitvoeringscommando's gebruiken standaard lokaal.
- Gateway-beheerde statuscommando's gebruiken standaard de Gateway.
- Het normale lokale pad vereist niet dat de Gateway actief is.
- Lokale `model run` is een slanke eenmalige providercompletion. Het lost het geconfigureerde agentmodel en de auth op, maar start geen chat-agentbeurt, laadt geen tools en opent geen gebundelde MCP-servers.
- `model run --file` accepteert afbeeldingsbestanden, detecteert hun MIME-type en stuurt ze met de opgegeven prompt naar het geselecteerde model. Herhaal `--file` voor meerdere afbeeldingen.
- `model run --file` weigert niet-afbeeldingsinputs. Gebruik `infer audio transcribe` voor audiobestanden en `infer video describe` voor videobestanden.
- `model run --gateway` oefent Gateway-routering, opgeslagen auth, providerselectie en de ingebedde runtime uit, maar draait nog steeds als een ruwe modelprobe: het stuurt de opgegeven prompt en eventuele afbeeldingsbijlagen zonder eerdere sessietranscriptie, bootstrap-/AGENTS-context, context-engine-assemblage, tools of gebundelde MCP-servers.
- `model run --gateway --model <provider/model>` vereist een vertrouwde operator-Gateway-referentie omdat het verzoek de Gateway vraagt om een eenmalige provider-/modeloverride uit te voeren.

## Model

Gebruik `model` voor door providers ondersteunde tekstinferentie en model-/providerinspectie.

```bash
openclaw infer model run --prompt "Reply with exactly: smoke-ok" --json
openclaw infer model run --prompt "Summarize this changelog entry" --model openai/gpt-5.4 --json
openclaw infer model run --prompt "Describe this image in one sentence" --file ./photo.jpg --model google/gemini-2.5-flash --json
openclaw infer model providers --json
openclaw infer model inspect --name gpt-5.5 --json
```

Gebruik volledige `<provider/model>`-verwijzingen om een specifieke provider te smoke-testen zonder de Gateway te starten of het volledige agenttool-oppervlak te laden:

```bash
openclaw infer model run --local --model anthropic/claude-sonnet-4-6 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model cerebras/zai-glm-4.7 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model google/gemini-2.5-flash --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model groq/llama-3.1-8b-instant --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model mistral/mistral-small-latest --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model openai/gpt-4.1 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model ollama/qwen2.5vl:7b --prompt "Describe this image." --file ./photo.jpg --json
```

Opmerkingen:

- Lokale `model run` is de smalste CLI-smoke voor provider-/model-/auth-gezondheid, omdat deze alleen de opgegeven prompt naar het geselecteerde model stuurt.
- Lokale `model run --file` behoudt dat slanke pad en voegt afbeeldingsinhoud rechtstreeks toe aan het enkele gebruikersbericht. Veelvoorkomende afbeeldingsbestanden zoals PNG, JPEG en WebP werken wanneer hun MIME-type als `image/*` wordt gedetecteerd; niet-ondersteunde of niet-herkende bestanden falen voordat de provider wordt aangeroepen.
- `model run --file` is het beste wanneer je het geselecteerde multimodale tekstmodel rechtstreeks wilt testen. Gebruik `infer image describe` wanneer je OpenClaw's providerselectie voor afbeeldingsbegrip en standaardrouting voor afbeeldingsmodellen wilt.
- Het geselecteerde model moet afbeeldingsinput ondersteunen; tekst-only modellen kunnen het verzoek op de providerlaag weigeren.
- `model run --prompt` moet tekst bevatten die niet alleen uit witruimte bestaat; lege prompts worden geweigerd voordat lokale providers of de Gateway worden aangeroepen.
- Lokale `model run` sluit af met een niet-nulcode wanneer de provider geen tekstuitvoer retourneert, zodat onbereikbare lokale providers en lege completions niet op succesvolle probes lijken.
- Gebruik `model run --gateway` wanneer je Gateway-routering, agent-runtime-instelling of Gateway-beheerde providerstatus moet testen terwijl je de modelinput ruw houdt. Gebruik `openclaw agent` of chatoppervlakken wanneer je de volledige agentcontext, tools, geheugen en sessietranscriptie wilt.
- `model auth login`, `model auth logout` en `model auth status` beheren opgeslagen provider-auth-status.

## Afbeelding

Gebruik `image` voor generatie, bewerking en beschrijving.

```bash
openclaw infer image generate --prompt "friendly lobster illustration" --json
openclaw infer image generate --prompt "cinematic product photo of headphones" --json
openclaw infer image generate --model openai/gpt-image-1.5 --output-format png --background transparent --prompt "simple red circle sticker on a transparent background" --json
openclaw infer image generate --prompt "slow image backend" --timeout-ms 180000 --json
openclaw infer image edit --file ./logo.png --model openai/gpt-image-1.5 --output-format png --background transparent --prompt "keep the logo, remove the background" --json
openclaw infer image edit --file ./poster.png --prompt "make this a vertical story ad" --size 2160x3840 --aspect-ratio 9:16 --resolution 4K --json
openclaw infer image describe --file ./photo.jpg --json
openclaw infer image describe --file ./receipt.jpg --prompt "Extract the merchant, date, and total" --json
openclaw infer image describe-many --file ./before.png --file ./after.png --prompt "Compare the screenshots and list visible UI changes" --json
openclaw infer image describe --file ./ui-screenshot.png --model openai/gpt-4.1-mini --json
openclaw infer image describe --file ./photo.jpg --model ollama/qwen2.5vl:7b --prompt "Describe the image in one sentence" --timeout-ms 300000 --json
```

Opmerkingen:

- Gebruik `image edit` wanneer je begint vanuit bestaande inputbestanden.
- Gebruik `--size`, `--aspect-ratio` of `--resolution` met `image edit` voor providers/modellen die geometriehints ondersteunen bij bewerkingen met referentieafbeeldingen.
- Gebruik `--output-format png --background transparent` met `--model openai/gpt-image-1.5` voor OpenAI PNG-uitvoer met transparante achtergrond; `--openai-background` blijft beschikbaar als OpenAI-specifieke alias. Providers die geen ondersteuning voor achtergronden declareren, rapporteren de hint als een genegeerde override.
- Gebruik `image providers --json` om te verifiëren welke gebundelde afbeeldingsproviders vindbaar, geconfigureerd en geselecteerd zijn, en welke generatie-/bewerkingscapabilities elke provider blootstelt.
- Gebruik `image generate --model <provider/model> --json` als de smalste live CLI-smoke voor wijzigingen in afbeeldingsgeneratie. Voorbeeld:

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
  door de provider geretourneerde MIME-type volgen.

- Gebruik voor `image describe` en `image describe-many` `--prompt` om het vision-model een taakspecifieke instructie te geven, zoals OCR, vergelijking, UI-inspectie of beknopte bijschriften.
- Gebruik `--timeout-ms` met trage lokale vision-modellen of koude Ollama-starts.
- Voor `image describe` moet `--model` een image-capable `<provider/model>` zijn.
- Voor lokale Ollama-vision-modellen moet je eerst het model ophalen en `OLLAMA_API_KEY` instellen op een willekeurige placeholderwaarde, bijvoorbeeld `ollama-local`. Zie [Ollama](/nl/providers/ollama#vision-and-image-description).

## Audio

Gebruik `audio` voor bestandstranscriptie.

```bash
openclaw infer audio transcribe --file ./memo.m4a --json
openclaw infer audio transcribe --file ./team-sync.m4a --language en --prompt "Focus on names and action items" --json
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

Opmerkingen:

- `audio transcribe` is bedoeld voor bestandstranscriptie, niet voor beheer van realtime sessies.
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

- `tts status` gebruikt standaard gateway omdat dit de door de gateway beheerde TTS-status weerspiegelt.
- Gebruik `tts providers`, `tts voices` en `tts set-provider` om TTS-gedrag te inspecteren en te configureren.

## Video

Gebruik `video` voor generatie en beschrijving.

```bash
openclaw infer video generate --prompt "cinematic sunset over the ocean" --json
openclaw infer video generate --prompt "slow drone shot over a forest lake" --resolution 768P --duration 6 --json
openclaw infer video describe --file ./clip.mp4 --json
openclaw infer video describe --file ./clip.mp4 --model openai/gpt-4.1-mini --json
```

Opmerkingen:

- `video generate` accepteert `--size`, `--aspect-ratio`, `--resolution`, `--duration`, `--audio`, `--watermark` en `--timeout-ms`, en stuurt ze door naar de runtime voor videogeneratie.
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

Gebruik `embedding` voor het maken van vectoren en het inspecteren van embedding-providers.

```bash
openclaw infer embedding create --text "friendly lobster" --json
openclaw infer embedding create --text "customer support ticket: delayed shipment" --model openai/text-embedding-3-large --json
openclaw infer embedding providers --json
```

## JSON-uitvoer

Infer-commando's normaliseren JSON-uitvoer onder een gedeelde envelop:

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

Voor commando's die media genereren, bevat `outputs` bestanden die door OpenClaw zijn geschreven. Gebruik
de `path`, `mimeType`, `size` en eventuele mediaspecifieke dimensies in die array
voor automatisering in plaats van door mensen leesbare stdout te parsen.

## Veelvoorkomende valkuilen

```bash
# Bad
openclaw infer media image generate --prompt "friendly lobster"

# Good
openclaw infer image generate --prompt "friendly lobster"
```

```bash
# Bad
openclaw infer audio transcribe --file ./memo.m4a --model whisper-1 --json

# Good
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

## Opmerkingen

- `openclaw capability ...` is een alias voor `openclaw infer ...`.

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Modellen](/nl/concepts/models)
