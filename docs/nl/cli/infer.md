---
read_when:
    - '`openclaw infer`-opdrachten toevoegen of wijzigen'
    - Stabiele headless automatisering van mogelijkheden ontwerpen
summary: CLI die eerst automatisch afleidt voor providerondersteunde workflows voor modellen, afbeeldingen, audio, TTS, video, web en embeddings
title: Inferentie-CLI
x-i18n:
    generated_at: "2026-07-12T08:42:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ec90377d3fb6049e63f5eb1dddfb085562982152b1b2ba7bd4e4d2535ab3c06f
    source_path: cli/infer.md
    workflow: 16
---

`openclaw infer` is de canonieke headless-interface voor door providers ondersteunde inferentie. Deze biedt capaciteitsfamilies (`model`, `image`, `audio`, `tts`, `video`, `web`, `embedding`), geen onbewerkte RPC-namen van de Gateway of id's van agenttools. `openclaw capability ...` is een alias voor dezelfde opdrachtstructuur.

Redenen om dit te verkiezen boven een eenmalige providerwrapper:

- Hergebruikt providers en modellen die al in OpenClaw zijn geconfigureerd.
- Stabiele `--json`-envelop voor scripts en door agents aangestuurde automatisering (zie [JSON-uitvoer](#json-output)).
- Voert voor de meeste subopdrachten het normale lokale pad uit zonder de Gateway.
- Voor end-to-end-providercontroles doorloopt dit de meegeleverde CLI, het laden van configuratie, de resolutie van de standaardagent, de activering van gebundelde plugins en de gedeelde capaciteitsruntime voordat het providerverzoek wordt verzonden.

## Maak van infer een skill

Kopieer en plak dit naar een agent:

```text
Lees https://docs.openclaw.ai/cli/infer en maak vervolgens een skill die mijn gebruikelijke werkstromen naar `openclaw infer` routeert.
Richt je op modeluitvoeringen, het genereren van afbeeldingen, het genereren van video's, audiotranscriptie, TTS, zoeken op het web en embeddings.
```

Een goede op infer gebaseerde skill koppelt veelvoorkomende gebruikersintenties aan de juiste subopdracht, bevat per werkstroom enkele canonieke voorbeelden, geeft de voorkeur aan `openclaw infer ...` boven alternatieven op lager niveau en documenteert niet de volledige infer-interface opnieuw in de hoofdtekst van de skill.

## Opdrachtstructuur

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
    personas
    status
    enable
    disable
    set-provider
    set-persona

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

`infer list` / `infer inspect --name <capability>` tonen deze structuur als gegevens (capaciteits-id, transporten, beschrijving).

## Veelvoorkomende taken

| Taak                          | Opdracht                                                                                      | Opmerkingen                                                   |
| ----------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| Een tekst-/modelprompt uitvoeren | `openclaw infer model run --prompt "..." --json`                                           | Standaard lokaal                                              |
| Een modelprompt op afbeeldingen uitvoeren | `openclaw infer model run --prompt "Describe this" --file ./image.png --model provider/model` | Herhaal `--file` voor meerdere afbeeldingen             |
| Een afbeelding genereren      | `openclaw infer image generate --prompt "..." --json`                                         | Gebruik `image edit` wanneer je met een bestaand bestand begint |
| Een afbeeldingsbestand of URL beschrijven | `openclaw infer image describe --file ./image.png --prompt "..." --json`             | `--model` moet een afbeeldingsgeschikt `<provider/model>` zijn |
| Audio transcriberen           | `openclaw infer audio transcribe --file ./memo.m4a --json`                                    | `--model` moet `<provider/model>` zijn                        |
| Spraak synthetiseren          | `openclaw infer tts convert --text "..." --output ./speech.mp3 --json`                        | `tts status` wordt alleen via de Gateway uitgevoerd           |
| Een video genereren           | `openclaw infer video generate --prompt "..." --json`                                         | Ondersteunt providerhints zoals `--resolution`                |
| Een videobestand beschrijven  | `openclaw infer video describe --file ./clip.mp4 --json`                                      | `--model` moet `<provider/model>` zijn                        |
| Op het web zoeken             | `openclaw infer web search --query "..." --json`                                              |                                                               |
| Een webpagina ophalen         | `openclaw infer web fetch --url https://example.com --json`                                   |                                                               |
| Embeddings maken              | `openclaw infer embedding create --text "..." --json`                                         |                                                               |

## Gedrag

- Gebruik `--json` wanneer de uitvoer als invoer voor een andere opdracht of een script dient; gebruik anders tekstuitvoer.
- Gebruik `--provider` of `--model provider/model` om een specifieke backend vast te zetten.
- Gebruik `model run --thinking <level>` om het denk-/redeneerniveau voor één uitvoering te overschrijven: `off`, `minimal`, `low`, `medium`, `high`, `adaptive`, `xhigh` of `max`.
- Voor `image describe`, `audio transcribe` en `video describe` moet `--model` de vorm `<provider/model>` hebben.
- Voor `image describe` accepteert `--file` lokale paden en HTTP(S)-URL's; externe URL's worden verwerkt volgens het normale SSRF-beleid voor het ophalen van media.
- Statusloze uitvoeringsopdrachten (`model run`, `image *`, `audio *`, `video *`, `web *`, `embedding *`) zijn standaard lokaal. Door de Gateway beheerde statusopdrachten (`tts status`) gebruiken standaard de Gateway.
- Voor het lokale pad hoeft de Gateway nooit actief te zijn.
- Lokale `model run` is een gestroomlijnde, eenmalige provider-voltooiing: deze resolveert het geconfigureerde agentmodel en de authenticatie, maar start geen chatagentbeurt, laadt geen tools en opent geen gebundelde MCP-servers.
- `model run --file` voegt afbeeldingsbestanden (met automatisch gedetecteerd MIME-type) aan de prompt toe; herhaal `--file` voor meerdere afbeeldingen. Niet-afbeeldingsbestanden worden geweigerd — gebruik in plaats daarvan `infer audio transcribe` of `infer video describe`.
- `model run --gateway` test de routering van de Gateway, opgeslagen authenticatie, providerselectie en de ingebedde runtime, maar blijft een onbewerkte modelprobe: geen eerder sessietranscript, bootstrap-/AGENTS-context, tools of gebundelde MCP-servers.
- `model run --gateway --model <provider/model>` vereist Gateway-referenties van een vertrouwde operator, omdat hiermee aan de Gateway wordt gevraagd een eenmalige provider-/modeloverschrijving uit te voeren.

## Model

Tekstinferentie en inspectie van modellen/providers.

```bash
openclaw infer model run --prompt "Reply with exactly: smoke-ok" --json
openclaw infer model run --prompt "Summarize this changelog entry" --model openai/gpt-5.4 --json
openclaw infer model run --prompt "Describe this image in one sentence" --file ./photo.jpg --model google/gemini-2.5-flash --json
openclaw infer model run --prompt "Use more reasoning here" --thinking high --json
openclaw infer model providers --json
openclaw infer model inspect --model gpt-5.6-sol --json
```

Gebruik volledige `<provider/model>`-verwijzingen met `--local` om één provider kort te testen zonder de Gateway te starten of de agenttool-interface te laden:

```bash
openclaw infer model run --local --model anthropic/claude-sonnet-4-6 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model cerebras/zai-glm-4.7 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model google/gemini-2.5-flash --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model groq/llama-3.1-8b-instant --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model mistral/mistral-medium-3-5 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model mistral/mistral-small-latest --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model openai/gpt-5.6-luna --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model ollama/qwen2.5vl:7b --prompt "Describe this image." --file ./photo.jpg --json
```

Opmerkingen:

- Lokale `model run` is de meest gerichte CLI-rooktest voor de werking van provider/model/authenticatie: voor providers anders dan ChatGPT-Codex wordt alleen de opgegeven prompt verzonden.
- Lokale `model run --model <provider/model>` kan exacte rijen uit de gebundelde statische catalogus resolven (dezelfde rijen die `openclaw models list --all` toont) voordat die provider naar de configuratie is geschreven. Providerauthenticatie blijft vereist; ontbrekende referenties leveren authenticatiefouten op, niet `Unknown model`.
- Laat voor redeneerprobes met Mistral Medium 3.5 de temperatuur oningesteld/op de standaardwaarde. Mistral weigert `reasoning_effort="high"` met `temperature: 0`; gebruik de standaardtemperatuur of een waarde die niet nul is, zoals `0.7`.
- Lokale probes met OpenAI ChatGPT/Codex OAuth (`openai-chatgpt-responses`-API) voegen een minimale systeeminstructie toe, zodat het transport het vereiste veld `instructions` kan invullen — zonder volledige agentcontext, tools, geheugen of sessietranscript.
- `model run --file` voegt afbeeldingsinhoud rechtstreeks toe aan het enige gebruikersbericht. Gangbare indelingen (PNG, JPEG, WebP) werken wanneer het MIME-type als `image/*` wordt gedetecteerd; niet-ondersteunde of niet-herkende bestanden mislukken voordat de provider wordt aangeroepen. Gebruik in plaats daarvan `infer image describe` wanneer je de routering en fallbacks van OpenClaw voor afbeeldingsmodellen wilt gebruiken in plaats van een directe multimodale modelprobe.
- Het geselecteerde model moet afbeeldingsinvoer ondersteunen; modellen die alleen tekst ondersteunen, kunnen het verzoek op providerniveau weigeren.
- `model run --prompt` moet tekst bevatten die niet uitsluitend uit witruimte bestaat; lege prompts worden geweigerd voordat een provider of de Gateway wordt aangeroepen.
- Lokale `model run` eindigt met een niet-nulcode wanneer de provider geen tekstuitvoer retourneert, zodat onbereikbare providers en lege voltooiingen niet als geslaagde probes worden weergegeven.
- Gebruik `model run --gateway` om de routering van de Gateway of de configuratie van de agentruntime te testen terwijl de modelinvoer onbewerkt blijft. Gebruik `openclaw agent` of een chatinterface voor volledige agentcontext, tools, geheugen en sessietranscript.
- `--thinking adaptive` wordt gekoppeld aan het voltooiingsruntimeniveau `medium`; `--thinking max` wordt gekoppeld aan `max` voor OpenAI-modellen die de eigen maximale inspanning ondersteunen, en anders aan `xhigh`.
- `model auth login`, `model auth logout` en `model auth status` beheren de opgeslagen providerauthenticatiestatus.

## Afbeelding

Genereren, bewerken en beschrijven.

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

- Gebruik `image edit` wanneer u begint met bestaande invoerbestanden; `--size`, `--aspect-ratio` en `--resolution` voegen geometrieaanwijzingen toe voor providers/modellen die deze ondersteunen.
- `--output-format png --background transparent` met `--model openai/gpt-image-1.5` levert OpenAI-PNG-uitvoer met een transparante achtergrond; `--openai-background` is een OpenAI-specifieke alias voor dezelfde aanwijzing. Providers die geen ondersteuning voor achtergronden declareren, melden deze als een genegeerde overschrijving (zie `ignoredOverrides` in de [JSON-envelop](#json-output)).
- `--quality low|medium|high|auto` werkt voor providers die aanwijzingen voor beeldkwaliteit ondersteunen, waaronder OpenAI. OpenAI accepteert ook `--openai-moderation low|auto`.
- `image providers --json` vermeldt welke gebundelde afbeeldingsproviders detecteerbaar, geconfigureerd en geselecteerd zijn, en welke generatie- en bewerkingsmogelijkheden elke provider biedt.
- `image generate --model <provider/model> --json` is de meest gerichte live-rooktest voor wijzigingen in afbeeldingsgeneratie:

  ```bash
  openclaw infer image providers --json
  openclaw infer image generate \
    --model google/gemini-3.1-flash-image-preview \
    --prompt "Minimal flat test image: one blue square on a white background, no text." \
    --output ./openclaw-infer-image-smoke.png \
    --json
  ```

  Het antwoord vermeldt `ok`, `provider`, `model`, `attempts` en de paden van de geschreven uitvoerbestanden. Wanneer `--output` is ingesteld, kan de uiteindelijke extensie het door de provider geretourneerde MIME-type volgen.

- Gebruik voor `image describe` en `image describe-many` de optie `--prompt` voor een taakspecifieke instructie (OCR, vergelijking, inspectie van de gebruikersinterface, beknopte bijschriften).
- Gebruik `--timeout-ms` voor trage lokale visiemodellen of een koude start van Ollama.
- Voor `image describe` wordt eerst een expliciet `--model` uitgevoerd (dit moet een afbeeldingsgeschikt `<provider/model>` zijn), waarna geconfigureerde `agents.defaults.imageModel.fallbacks` worden geprobeerd als die aanroep mislukt. Fouten bij het voorbereiden van invoer (ontbrekend bestand, niet-ondersteunde URL) veroorzaken een fout voordat een terugvalpoging wordt gedaan, en het model moet in de modelcatalogus of providerconfiguratie als afbeeldingsgeschikt zijn aangemerkt.
- Voor lokale Ollama-visiemodellen haalt u eerst het model op en stelt u `OLLAMA_API_KEY` in op een willekeurige tijdelijke waarde, bijvoorbeeld `ollama-local`. Zie [Ollama](/nl/providers/ollama#vision-and-image-description).

## Audio

Bestandstranscriptie (geen realtime sessiebeheer).

```bash
openclaw infer audio transcribe --file ./memo.m4a --json
openclaw infer audio transcribe --file ./team-sync.m4a --language en --prompt "Focus on names and action items" --json
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

`--model` moet `<provider/model>` zijn.

## TTS

Spraaksynthese en de status van TTS-providers/persona's.

```bash
openclaw infer tts convert --text "hello from openclaw" --output ./hello.mp3 --json
openclaw infer tts convert --text "Your build is complete" --output ./build-complete.mp3 --json
openclaw infer tts providers --json
openclaw infer tts personas --json
openclaw infer tts status --json
```

Opmerkingen:

- `tts status` ondersteunt alleen `--gateway` (dit weerspiegelt de door de Gateway beheerde TTS-status).
- Gebruik `tts providers`, `tts voices`, `tts personas`, `tts set-provider` en `tts set-persona` om het TTS-gedrag te inspecteren en configureren.

## Video

Generatie en beschrijving.

```bash
openclaw infer video generate --prompt "cinematic sunset over the ocean" --json
openclaw infer video generate --prompt "slow drone shot over a forest lake" --resolution 768P --duration 6 --json
openclaw infer video describe --file ./clip.mp4 --json
openclaw infer video describe --file ./clip.mp4 --model openai/gpt-5.4-mini --json
```

Opmerkingen:

- `video generate` accepteert `--size`, `--aspect-ratio`, `--resolution`, `--duration`, `--audio`, `--watermark` en `--timeout-ms`, die worden doorgegeven aan de runtime voor videogeneratie.
- Voor `video describe` moet `--model` de vorm `<provider/model>` hebben.

## Web

Zoeken en ophalen.

```bash
openclaw infer web search --query "OpenClaw docs" --json
openclaw infer web search --query "OpenClaw infer web providers" --json
openclaw infer web fetch --url https://docs.openclaw.ai/cli/infer --json
openclaw infer web providers --json
```

`web providers` vermeldt de beschikbare, geconfigureerde en geselecteerde providers voor zoeken en ophalen.

## Insluiting

Vectoren maken en insluitingsproviders inspecteren.

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

Stabiele velden op het hoogste niveau:

- `ok`
- `capability`
- `transport`
- `provider`
- `model`
- `attempts`
- `inputs` (afbeeldingsbijlagen die met de aanvraag zijn verzonden, indien van toepassing)
- `outputs`
- `ignoredOverrides` (aanwijzingssleutels die een provider niet ondersteunt, indien van toepassing)
- `error`

Voor opdrachten die media genereren, bevat `outputs` bestanden die door OpenClaw zijn geschreven. Gebruik voor automatisering het `path`, `mimeType`, `size` en eventuele mediaspecifieke afmetingen in die array, in plaats van voor mensen leesbare standaarduitvoer te ontleden.

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

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Modellen](/nl/concepts/models)
