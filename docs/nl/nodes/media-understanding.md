---
read_when:
    - Media-inzicht ontwerpen of herstructureren
    - Afstemming van de voorverwerking van inkomende audio, video en afbeeldingen
sidebarTitle: Media understanding
summary: Inkomend beeld-/audio-/videobegrip (optioneel) met provider- en CLI-fallbacks
title: Mediabegrip
x-i18n:
    generated_at: "2026-07-12T09:02:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4ea61063948ed7d058c3f11f53f7afd443bbb970b0c0cb050f35cfba210ea81b
    source_path: nodes/media-understanding.md
    workflow: 16
---

OpenClaw kan binnenkomende media (afbeelding/audio/video) samenvatten voordat de antwoordpijplijn wordt uitgevoerd, zodat opdrachtinterpretatie en routering met korte tekst werken in plaats van met onbewerkte bytes. Media-interpretatie detecteert automatisch lokale hulpprogramma's of providersleutels, maar u kunt ook expliciete modellen configureren. De oorspronkelijke media worden zoals gebruikelijk altijd aan het model geleverd; wanneer de interpretatie mislukt of is uitgeschakeld, gaat de antwoordstroom ongewijzigd verder.

Leveranciersplugins registreren metagegevens over mogelijkheden (welke provider welk mediatype ondersteunt, standaardmodel, prioriteit). De kern van OpenClaw beheert de gedeelde configuratie `tools.media`, de terugvalvolgorde en de integratie met de antwoordpijplijn.

## Werking

<Steps>
  <Step title="Bijlagen verzamelen">
    Verzamel binnenkomende bijlagen (`MediaPaths`, `MediaUrls`, `MediaTypes`).
  </Step>
  <Step title="Per mogelijkheid selecteren">
    Selecteer voor elke ingeschakelde mogelijkheid (afbeelding/audio/video) bijlagen volgens het beleid `attachments` (standaard: alleen de eerste bijlage).
  </Step>
  <Step title="Een model kiezen">
    Kies de eerste geschikte modelvermelding (grootte + mogelijkheid + authenticatie beschikbaar).
  </Step>
  <Step title="Terugvallen bij fouten">
    Als een model een fout retourneert, een time-out bereikt of de media `maxBytes` overschrijden, probeert u de volgende vermelding.
  </Step>
  <Step title="Toepassen bij succes">
    `Body` wordt een blok `[Image]`, `[Audio]` of `[Video]`. Audio stelt ook `{{Transcript}}` in; voor opdrachtinterpretatie wordt bij aanwezigheid de bijschrifttekst gebruikt, anders het transcript. Bijschriften blijven in het blok behouden als `User text:`.
  </Step>
</Steps>

## Configuratie

`tools.media` bevat een gedeelde modellenlijst en overschrijvingen per mogelijkheid:

```json5
{
  tools: {
    media: {
      concurrency: 2, // max concurrent capability runs (default)
      models: [/* shared list, gate with capabilities */],
      image: {/* optional overrides */},
      audio: {
        /* optional overrides */
        echoTranscript: true,
        echoFormat: '📝 "{transcript}"',
      },
      video: {/* optional overrides */},
    },
  },
}
```

Sleutels per mogelijkheid (`image`/`audio`/`video`):

| Sleutel                                          | Type      | Standaard                                            | Opmerkingen                                                                                 |
| ----------------------------------------------- | --------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `enabled`                                       | `boolean` | automatisch (`false` schakelt uit)                   | Stel in op `false` om automatische detectie voor deze mogelijkheid uit te schakelen         |
| `models`                                        | array     | geen                                                 | Krijgt voorrang op de gedeelde lijst `tools.media.models`                                   |
| `prompt`                                        | `string`  | `"Describe the {media}."` (+ aanwijzing voor maxChars) | Standaard alleen voor afbeeldingen/video                                                    |
| `maxChars`                                      | `number`  | `500` (afbeelding/video), niet ingesteld (audio)     | De uitvoer wordt ingekort als het model meer retourneert                                    |
| `maxBytes`                                      | `number`  | afbeelding `10485760`, audio `20971520`, video `52428800` | Bij te grote media wordt naar het volgende model gegaan                                 |
| `timeoutSeconds`                                | `number`  | `60` (afbeelding/audio), `120` (video)               |                                                                                             |
| `language`                                      | `string`  | niet ingesteld                                       | Taalhint voor audiotranscriptie                                                             |
| `baseUrl`/`headers`/`providerOptions`/`request` | -         | -                                                    | Overschrijvingen voor providerverzoeken; zie [Hulpprogramma's en aangepaste providers](/nl/gateway/config-tools) |
| `attachments`                                   | object    | `{ mode: "first", maxAttachments: 1 }`               | Zie [Bijlagenbeleid](#attachment-policy)                                                    |
| `scope`                                         | object    | niet ingesteld                                       | Beperken op channel/chatType/keyPrefix                                                      |
| `echoTranscript`                                | `boolean` | `false`                                              | Alleen audio: stuur het transcript vóór agentverwerking terug naar de chat                  |
| `echoFormat`                                    | `string`  | `'📝 "{transcript}"'`                                | Alleen audio: tijdelijke aanduiding `{transcript}`                                          |

Deepgram-specifieke opties staan onder `providerOptions.deepgram` (het veld `deepgram: { detectLanguage, punctuate, smartFormat }` op het hoogste niveau is verouderd, maar wordt nog steeds gelezen).

### Modelvermeldingen

Elke vermelding in `models[]` is een **providervermelding** (standaard) of een **CLI-vermelding**:

<Tabs>
  <Tab title="Providervermelding">
    ```json5
    {
      type: "provider", // default if omitted
      provider: "openai",
      model: "gpt-5.6-sol",
      prompt: "Describe the image in <= 500 chars.",
      maxChars: 500,
      maxBytes: 10485760,
      timeoutSeconds: 60,
      capabilities: ["image"], // optional, for multi-modal shared entries
      profile: "vision-profile",
      preferredProfile: "vision-fallback",
    }
    ```
  </Tab>
  <Tab title="CLI-vermelding">
    ```json5
    {
      type: "cli",
      command: "gemini",
      args: [
        "-m",
        "gemini-3-flash",
        "--allowed-tools",
        "read_file",
        "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
      ],
      maxChars: 500,
      maxBytes: 52428800,
      timeoutSeconds: 120,
      capabilities: ["video", "image"],
    }
    ```

    CLI-sjablonen kunnen ook `{{MediaDir}}` (map met het mediabestand), `{{OutputDir}}` (voor deze uitvoering aangemaakte tijdelijke map) en `{{OutputBase}}` (basispad van het tijdelijke bestand, zonder extensie) gebruiken.

  </Tab>
</Tabs>

### Providerreferenties

Media-interpretatie via providers gebruikt dezelfde authenticatieoplossing als normale modelaanroepen: authenticatieprofielen, omgevingsvariabelen en vervolgens `models.providers.<providerId>.apiKey`. Vermeldingen in `tools.media.*.models[]` accepteren geen inlineveld `apiKey`.

```json5
{
  models: {
    providers: {
      openai: { apiKey: "<OPENAI_API_KEY>" },
      moonshot: { apiKey: "<MOONSHOT_API_KEY>" },
    },
  },
}
```

Zie [Hulpprogramma's en aangepaste providers](/nl/gateway/config-tools) voor profielen, omgevingsvariabelen en aangepaste basis-URL's.

## Regels en gedrag

- Media die `maxBytes` overschrijden, slaan dat model over en proberen het volgende.
- Audiobestanden kleiner dan 1024 bytes worden als leeg/beschadigd beschouwd en vóór transcriptie overgeslagen; de agent ontvangt in plaats daarvan een deterministisch tijdelijk transcript.
- Als het actieve primaire afbeeldingsmodel al systeemeigen beeldherkenning ondersteunt, slaat OpenClaw het samenvattingsblok `[Image]` over en geeft het de oorspronkelijke afbeelding rechtstreeks aan het model door. MiniMax vormt een uitzondering: `minimax`, `minimax-cn`, `minimax-portal` en `minimax-portal-cn` routeren afbeeldingsinterpretatie altijd via de door de plugin beheerde mediaprovider `MiniMax-VL-01`, zelfs als verouderde chatmetagegevens van MiniMax M2.x aangeven dat afbeeldingsinvoer wordt ondersteund (alleen `MiniMax-M3` en latere versies worden beschouwd als modellen met systeemeigen beeldherkenning).
- Als een primair Gateway/WebChat-model alleen tekst ondersteunt, blijven afbeeldingsbijlagen behouden als uitbestede verwijzingen `media://inbound/*`, zodat afbeeldings-/PDF-hulpprogramma's of een geconfigureerd afbeeldingsmodel ze nog steeds kunnen inspecteren in plaats van de bijlage te verliezen.
- Een expliciete aanroep van `openclaw infer image describe --file <path> --model <provider/model>` (alias: `openclaw capability image describe`) voert die provider/dat model met afbeeldingsmogelijkheden rechtstreeks uit, inclusief Ollama-verwijzingen zoals `ollama/qwen2.5vl:7b` wanneer een overeenkomend model met afbeeldingsmogelijkheden is geconfigureerd onder `models.providers.ollama.models[]`.
- Als `<capability>.enabled` niet `false` is maar er geen modellen zijn geconfigureerd, probeert OpenClaw het actieve antwoordmodel wanneer de provider daarvan de mogelijkheid ondersteunt.

### Automatische detectie (standaard)

Wanneer `tools.media.<capability>.enabled` niet `false` is en er geen modellen zijn geconfigureerd, probeert OpenClaw de volgende opties in deze volgorde en stopt het bij de eerste werkende optie:

<Steps>
  <Step title="Geconfigureerd afbeeldingsmodel (alleen afbeeldingen)">
    Primaire/terugvalverwijzingen van `agents.defaults.imageModel`, tenzij het actieve antwoordmodel al systeemeigen beeldherkenning ondersteunt. Geef de voorkeur aan verwijzingen in de vorm `provider/model`; kale verwijzingen worden alleen gekwalificeerd aan de hand van geconfigureerde providermodelvermeldingen met afbeeldingsmogelijkheden wanneer de overeenkomst uniek is.
  </Step>
  <Step title="Actief antwoordmodel">
    Het actieve antwoordmodel, wanneer de provider daarvan de mogelijkheid ondersteunt.
  </Step>
  <Step title="Providerauthenticatie (alleen audio, vóór lokale CLI's)">
    Geconfigureerde vermeldingen in `models.providers.*` die audio ondersteunen, worden vóór lokale CLI's geprobeerd. Gebundelde prioriteitsvolgorde voor providers (bij gelijke prioriteit alfabetisch op provider-id): Groq/OpenAI &rarr; xAI &rarr; Deepgram &rarr; OpenRouter &rarr; Google/SenseAudio &rarr; Deepinfra/ElevenLabs &rarr; Mistral.
  </Step>
  <Step title="Lokale CLI's (alleen audio)">
    Beschikbare lokale binaire bestanden vormen een geordende terugvallijst:
    - `whisper-cli` alleen als eerste nadat bij een eerdere modelaanroep in het huidige proces Metal of CUDA is waargenomen
    - standaard-CPU `sherpa-onnx-offline` (vereist `SHERPA_ONNX_MODEL_DIR` met `tokens.txt`/`encoder.onnx`/`decoder.onnx`/`joiner.onnx`)
    - `whisper-cli` wanneer versnelling slechts tijdens de bouw mogelijk is of niet is waargenomen
    - `parakeet-mlx` op Apple Silicon (geschikt voor MLX, apparaatgebruik niet waargenomen)
    - `whisper` (Python-CLI; gebruikt standaard het model `turbo`, wordt automatisch gedownload)

    Inspectie van backendmogelijkheden wordt in de cache opgeslagen en laadt geen model. Bouwmogelijkheden, aangevraagde backendvlaggen en de backend die tijdens een echte aanroep is waargenomen, blijven gescheiden. Automatisch gedetecteerde whisper.cpp laat logboekregistratie van modeluitvoeringen ingeschakeld, zodat de regel van de bovenliggende implementatie met de geselecteerde backend kan worden vastgelegd. Expliciete CLI-vermeldingen behouden hun geconfigureerde volgorde, backendvlaggen en uitvoervlaggen.

  </Step>
  <Step title="Providerauthenticatie (afbeelding/video)">
    Geconfigureerde vermeldingen in `models.providers.*` die de mogelijkheid ondersteunen, worden vóór de gebundelde terugvalvolgorde geprobeerd. Alleen voor afbeeldingen geconfigureerde providers met een model met afbeeldingsmogelijkheden worden automatisch geregistreerd voor media-interpretatie, zelfs wanneer ze geen gebundelde leveranciersplugin zijn.

    Gebundelde prioriteitsvolgorde voor providers (bij gelijke prioriteit alfabetisch op provider-id):
    - Afbeelding: Anthropic/OpenAI &rarr; Google &rarr; MiniMax &rarr; Deepinfra &rarr; MiniMax Portal &rarr; Z.AI
    - Video: Google &rarr; Qwen &rarr; Moonshot

  </Step>
  <Step title="Antigravity-CLI (alleen afbeelding/video)">
    Het eerste geïnstalleerde binaire bestand `agy` of `antigravity` (overschrijven met `OPENCLAW_ANTIGRAVITY_CLI`), in een sandbox beperkt tot de map van de media.
  </Step>
</Steps>

Automatische detectie voor een mogelijkheid uitschakelen:

```json5
{
  tools: {
    media: {
      audio: {
        enabled: false,
      },
    },
  },
}
```

<Note>
Detectie van binaire bestanden wordt naar beste vermogen uitgevoerd op macOS/Linux/Windows; zorg dat de CLI in `PATH` staat (`~` wordt uitgevouwen), of stel een expliciete CLI-modelvermelding in met een volledig opdrachtpad.
</Note>

### Proxyondersteuning (provider-aanroepen voor audio/video)

Providergebaseerde interpretatie van **audio** en **video** respecteert standaardomgevingsvariabelen voor uitgaande proxy's, inclusief omzeilingsregels van `NO_PROXY`/`no_proxy`: `HTTPS_PROXY`, `HTTP_PROXY`, `ALL_PROXY`, `https_proxy`, `http_proxy`, `all_proxy`. Variabelen in kleine letters hebben voorrang op variabelen in hoofdletters. Als er geen zijn ingesteld, gebruikt media-interpretatie rechtstreeks uitgaand verkeer; als de proxywaarde ongeldig is, registreert OpenClaw een waarschuwing en valt het terug op rechtstreeks ophalen. Afbeeldingsinterpretatie maakt geen gebruik van dit proxypad.

## Mogelijkheden

Stel `capabilities` in bij een vermelding in `models[]` om deze te beperken tot specifieke mediatypen. Voor gedeelde lijsten leidt OpenClaw de standaardwaarden per gebundelde provider af:

| Provider                                                                 | Mogelijkheden          |
| ------------------------------------------------------------------------ | ---------------------- |
| `openai`, `anthropic`, `minimax`                                         | afbeelding             |
| `minimax-portal`                                                         | afbeelding             |
| `moonshot`                                                               | afbeelding + video     |
| `openrouter`                                                             | afbeelding + audio     |
| `google` (Gemini-API)                                                    | afbeelding + audio + video |
| `qwen`                                                                   | afbeelding + video     |
| `deepinfra`                                                              | afbeelding + audio     |
| `mistral`                                                                | audio                  |
| `zai`                                                                    | afbeelding             |
| `groq`, `xai`, `deepgram`, `senseaudio`                                  | audio                  |
| Elke `models.providers.<id>.models[]`-catalogus met een model dat afbeeldingen ondersteunt | afbeelding             |

Stel voor CLI-vermeldingen `capabilities` expliciet in om onverwachte overeenkomsten te voorkomen; als dit wordt weggelaten, komt de vermelding in aanmerking voor elke mogelijkhedenlijst waarin deze voorkomt.

## Ondersteuningsmatrix voor providers

| Mogelijkheid | Providers                                                                                                                                               | Opmerkingen                                                                                                                                                                                   |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Afbeelding   | Anthropic, Codex app-server, Deepinfra, Google, MiniMax, MiniMax Portal, Moonshot, OpenAI, OpenAI Codex OAuth, OpenRouter, Qwen, Z.AI, configuratieproviders | Plugins van leveranciers registreren ondersteuning voor afbeeldingen; `openai/*` kan routering via een API-sleutel of Codex OAuth gebruiken; `codex/*` gebruikt een begrensde beurt van de Codex app-server; configuratieproviders die afbeeldingen ondersteunen, worden automatisch geregistreerd. |
| Audio        | Deepgram, Deepinfra, ElevenLabs, Google, Groq, Mistral, OpenAI, OpenRouter, SenseAudio, xAI                                                             | Transcriptie door providers (Whisper/Groq/xAI/Deepgram/OpenRouter STT/Gemini/SenseAudio/Scribe/Voxtral).                                                                                     |
| Video        | Google, Moonshot, Qwen                                                                                                                                  | Videobegrip door providers via Plugins van leveranciers; Qwen-videobegrip gebruikt de standaard DashScope-eindpunten.                                                                        |

<Note>
**Opmerking over MiniMax**: afbeeldingsbegrip voor `minimax`, `minimax-cn`, `minimax-portal` en `minimax-portal-cn` is altijd afkomstig van de door de Plugin beheerde mediaprovider `MiniMax-VL-01`, zelfs als verouderde MiniMax M2.x-chatmetadata beweert dat afbeeldingsinvoer wordt ondersteund.
</Note>

## Richtlijnen voor modelselectie

- Geef voor elke mediamogelijkheid de voorkeur aan het krachtigste model van de huidige generatie wanneer kwaliteit en veiligheid belangrijk zijn.
- Vermijd oudere/zwakkere mediamodellen voor agents met hulpmiddelen die niet-vertrouwde invoer verwerken.
- Houd voor beschikbaarheid ten minste één terugvaloptie per mogelijkheid aan (kwaliteitsmodel + sneller/goedkoper model).
- CLI-terugvalopties (`whisper-cli`, `whisper`, `gemini`) helpen wanneer provider-API's niet beschikbaar zijn.
- Bekende bestandsuitvoermodi zijn leidend: een leeg of ontbrekend afgeleid transcriptiebestand levert geen transcriptie op, in plaats van terug te vallen op de voortgangsuitvoer van de CLI.
- `parakeet-mlx`: gebruik `--output-format txt` (of `all`) met `--output-dir` en de standaarduitvoersjabloon `{filename}`. De upstream-omgevingsvariabelen `PARAKEET_OUTPUT_FORMAT` en `PARAKEET_OUTPUT_TEMPLATE` worden ook gerespecteerd. OpenClaw leest `<output-dir>/<media-basename>.txt`; de standaardindeling `srt`, andere indelingen en aangepaste uitvoersjablonen blijven stdout gebruiken.

## Beleid voor bijlagen

`attachments` per mogelijkheid bepaalt welke bijlagen worden verwerkt:

<ParamField path="mode" type='"first" | "all"' default="first">
  Verwerk alleen de eerste geselecteerde bijlage, of alle bijlagen.
</ParamField>
<ParamField path="maxAttachments" type="number" default="1">
  Beperk het aantal dat wordt verwerkt.
</ParamField>
<ParamField path="prefer" type='"first" | "last" | "path" | "url"'>
  Selectievoorkeur voor kandidaatbijlagen.
</ParamField>

Wanneer `mode: "all"` is ingesteld, krijgen uitvoerresultaten labels zoals `[Afbeelding 1/2]`, `[Audio 2/2]`, enzovoort.

### Extractie van bestandsbijlagen

- Geëxtraheerde bestandstekst wordt verpakt als niet-vertrouwde externe inhoud voordat deze aan de mediaprompt wordt toegevoegd, met grensmarkeringen zoals `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` / `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` plus een metadataregel `Source: External`.
- Dit pad laat bewust de lange banner `SECURITY NOTICE:` weg om de mediaprompt kort te houden; de grensmarkeringen en metadata blijven van toepassing.
- Een bestand zonder extraheerbare tekst krijgt `[Geen extraheerbare tekst]`.
- Als een pdf terugvalt op gerenderde pagina-afbeeldingen, stuurt OpenClaw die afbeeldingen door naar antwoordmodellen met beeldondersteuning en blijft de tijdelijke aanduiding `[PDF-inhoud gerenderd als afbeeldingen]` in het bestandsblok staan.

## Configuratievoorbeelden

<Tabs>
  <Tab title="Gedeelde modellen + overschrijvingen">
    ```json5
    {
      tools: {
        media: {
          models: [
            { provider: "openai", model: "gpt-5.6-sol", capabilities: ["image"] },
            {
              provider: "google",
              model: "gemini-3-flash-preview",
              capabilities: ["image", "audio", "video"],
            },
            {
              type: "cli",
              command: "gemini",
              args: [
                "-m",
                "gemini-3-flash",
                "--allowed-tools",
                "read_file",
                "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
              ],
              capabilities: ["image", "video"],
            },
          ],
          audio: {
            attachments: { mode: "all", maxAttachments: 2 },
          },
          video: {
            maxChars: 500,
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="Alleen audio + video">
    ```json5
    {
      tools: {
        media: {
          audio: {
            enabled: true,
            models: [
              { provider: "openai", model: "gpt-4o-mini-transcribe" },
              {
                type: "cli",
                command: "whisper",
                args: ["--model", "base", "{{MediaPath}}"],
              },
            ],
          },
          video: {
            enabled: true,
            maxChars: 500,
            models: [
              { provider: "google", model: "gemini-3-flash-preview" },
              {
                type: "cli",
                command: "gemini",
                args: [
                  "-m",
                  "gemini-3-flash",
                  "--allowed-tools",
                  "read_file",
                  "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
                ],
              },
            ],
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="Alleen afbeelding">
    ```json5
    {
      tools: {
        media: {
          image: {
            enabled: true,
            maxBytes: 10485760,
            maxChars: 500,
            models: [
              { provider: "openai", model: "gpt-5.6-sol" },
              { provider: "anthropic", model: "claude-opus-4-8" },
              {
                type: "cli",
                command: "gemini",
                args: [
                  "-m",
                  "gemini-3-flash",
                  "--allowed-tools",
                  "read_file",
                  "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
                ],
              },
            ],
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="Eén multimodale vermelding">
    ```json5
    {
      tools: {
        media: {
          image: {
            models: [
              {
                provider: "google",
                model: "gemini-3.1-pro-preview",
                capabilities: ["image", "video", "audio"],
              },
            ],
          },
          audio: {
            models: [
              {
                provider: "google",
                model: "gemini-3.1-pro-preview",
                capabilities: ["image", "video", "audio"],
              },
            ],
          },
          video: {
            models: [
              {
                provider: "google",
                model: "gemini-3.1-pro-preview",
                capabilities: ["image", "video", "audio"],
              },
            ],
          },
        },
      },
    }
    ```
  </Tab>
</Tabs>

## Statusuitvoer

Wanneer mediabegrip wordt uitgevoerd, bevat `/status` een samenvattingsregel per mogelijkheid:

```
📎 Media: image ok (openai/gpt-5.6-sol) · audio ok (whisper-cli observed=metal)
```

Voer voor een inventarisatie vooraf `openclaw capability audio providers` uit. Lokale rijen tonen de winnaar van de lokale terugvalopties afzonderlijk van de algemene providerselectie, gereedheid en afzonderlijke velden voor geschikte/aangevraagde/waargenomen backends. Dezelfde lokale selectie is beschikbaar als informatieve doctor-bevinding:

```bash
openclaw doctor --lint --only core/doctor/local-audio-acceleration --severity-min info
```

## Opmerkingen

- Begrip werkt op basis van beste inspanning. Fouten blokkeren antwoorden niet.
- Bijlagen worden nog steeds aan modellen doorgegeven wanneer begrip is uitgeschakeld.
- Gebruik `scope` om te beperken waar begrip wordt uitgevoerd (bijvoorbeeld alleen in privéberichten).

## Gerelateerd

- [Configuratie](/nl/gateway/configuration)
- [Ondersteuning voor afbeeldingen en media](/nl/nodes/images)
