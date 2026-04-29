---
read_when:
    - Ontwerpen of refactoren van mediabegrip
    - Voorverwerking van inkomende audio/video/afbeeldingen afstemmen
sidebarTitle: Media understanding
summary: Inkomend begrip van afbeeldingen/audio/video (optioneel) met provider- en CLI-fallbacks
title: Mediabegrip
x-i18n:
    generated_at: "2026-04-29T22:57:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 907cb0c84f7f0ab916ec07f65dcdffcf4f3c280a5c84ae1bc6fdf758d57545dd
    source_path: nodes/media-understanding.md
    workflow: 16
---

OpenClaw kan **inkomende media samenvatten** (afbeelding/audio/video) voordat de antwoordpipeline wordt uitgevoerd. Het detecteert automatisch wanneer lokale tools of providersleutels beschikbaar zijn, en kan worden uitgeschakeld of aangepast. Als begrip is uitgeschakeld, ontvangen modellen nog steeds de oorspronkelijke bestanden/URL's zoals gebruikelijk.

Leveranciersspecifiek mediagedrag wordt geregistreerd door vendor plugins, terwijl OpenClaw core de gedeelde `tools.media`-configuratie, fallbackvolgorde en integratie met de antwoordpipeline beheert.

## Doelen

- Optioneel: inkomende media vooraf verwerken tot korte tekst voor snellere routering en betere opdrachtparsing.
- Oorspronkelijke medialevering aan het model behouden (altijd).
- **Provider-API's** en **CLI-fallbacks** ondersteunen.
- Meerdere modellen met geordende fallback toestaan (fout/grootte/time-out).

## Gedrag op hoog niveau

<Steps>
  <Step title="Collect attachments">
    Verzamel inkomende bijlagen (`MediaPaths`, `MediaUrls`, `MediaTypes`).
  </Step>
  <Step title="Select per-capability">
    Selecteer voor elke ingeschakelde mogelijkheid (afbeelding/audio/video) bijlagen volgens beleid (standaard: **eerste**).
  </Step>
  <Step title="Choose model">
    Kies de eerste geschikte modelvermelding (grootte + mogelijkheid + authenticatie).
  </Step>
  <Step title="Fallback on failure">
    Als een model faalt of de media te groot is, **val dan terug op de volgende vermelding**.
  </Step>
  <Step title="Apply success block">
    Bij succes:

    - `Body` wordt een `[Image]`-, `[Audio]`- of `[Video]`-blok.
    - Audio stelt `{{Transcript}}` in; opdrachtparsing gebruikt bijschrifttekst wanneer aanwezig, anders het transcript.
    - Bijschriften worden behouden als `User text:` in het blok.

  </Step>
</Steps>

Als begrip faalt of is uitgeschakeld, **gaat de antwoordstroom door** met de oorspronkelijke body + bijlagen.

## Configuratieoverzicht

`tools.media` ondersteunt **gedeelde modellen** plus overrides per mogelijkheid:

<AccordionGroup>
  <Accordion title="Top-level keys">
    - `tools.media.models`: gedeelde modellenlijst (gebruik `capabilities` om te beperken).
    - `tools.media.image` / `tools.media.audio` / `tools.media.video`:
      - standaardwaarden (`prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`)
      - provideroverrides (`baseUrl`, `headers`, `providerOptions`)
      - Deepgram-audio-opties via `tools.media.audio.providerOptions.deepgram`
      - audiotranscript-echo-instellingen (`echoTranscript`, standaard `false`; `echoFormat`)
      - optionele **`models`-lijst per mogelijkheid** (krijgt voorrang boven gedeelde modellen)
      - `attachments`-beleid (`mode`, `maxAttachments`, `prefer`)
      - `scope` (optionele beperking op kanaal/chatType/sessiesleutel)
    - `tools.media.concurrency`: maximaal aantal gelijktijdige mogelijkhedenruns (standaard **2**).

  </Accordion>
</AccordionGroup>

```json5
{
  tools: {
    media: {
      models: [
        /* shared list */
      ],
      image: {
        /* optional overrides */
      },
      audio: {
        /* optional overrides */
        echoTranscript: true,
        echoFormat: '📝 "{transcript}"',
      },
      video: {
        /* optional overrides */
      },
    },
  },
}
```

### Modelvermeldingen

Elke `models[]`-vermelding kan **provider** of **CLI** zijn:

<Tabs>
  <Tab title="Provider entry">
    ```json5
    {
      type: "provider", // default if omitted
      provider: "openai",
      model: "gpt-5.5",
      prompt: "Describe the image in <= 500 chars.",
      maxChars: 500,
      maxBytes: 10485760,
      timeoutSeconds: 60,
      capabilities: ["image"], // optional, used for multi-modal entries
      profile: "vision-profile",
      preferredProfile: "vision-fallback",
    }
    ```
  </Tab>
  <Tab title="CLI entry">
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

    CLI-sjablonen kunnen ook gebruiken:

    - `{{MediaDir}}` (map met het mediabestand)
    - `{{OutputDir}}` (scratchmap die voor deze run wordt gemaakt)
    - `{{OutputBase}}` (basispad van scratchbestand, zonder extensie)

  </Tab>
</Tabs>

## Standaardwaarden en limieten

Aanbevolen standaardwaarden:

- `maxChars`: **500** voor afbeelding/video (kort, opdrachtvriendelijk)
- `maxChars`: **niet ingesteld** voor audio (volledig transcript tenzij je een limiet instelt)
- `maxBytes`:
  - afbeelding: **10MB**
  - audio: **20MB**
  - video: **50MB**

<AccordionGroup>
  <Accordion title="Rules">
    - Als media groter is dan `maxBytes`, wordt dat model overgeslagen en wordt het **volgende model geprobeerd**.
    - Audiobestanden kleiner dan **1024 bytes** worden als leeg/beschadigd behandeld en overgeslagen vóór provider-/CLI-transcriptie; inkomende antwoordcontext ontvangt een deterministisch placeholdertranscript zodat de agent weet dat de notitie te klein was.
    - Als het model meer dan `maxChars` retourneert, wordt de uitvoer ingekort.
    - `prompt` heeft als standaard een eenvoudige "Describe the {media}." plus de `maxChars`-richtlijn (alleen afbeelding/video).
    - Als het actieve primaire afbeeldingsmodel al native vision ondersteunt, slaat OpenClaw het `[Image]`-samenvattingsblok over en geeft het in plaats daarvan de oorspronkelijke afbeelding door aan het model.
    - Als een primair Gateway/WebChat-model alleen tekst ondersteunt, worden afbeeldingsbijlagen behouden als offloaded `media://inbound/*`-refs, zodat de afbeelding-/PDF-tools of het geconfigureerde afbeeldingsmodel ze nog steeds kunnen inspecteren in plaats van de bijlage te verliezen.
    - Expliciete `openclaw infer image describe --model <provider/model>`-verzoeken zijn anders: ze voeren dat afbeeldingsgeschikte provider/model rechtstreeks uit, inclusief Ollama-refs zoals `ollama/qwen2.5vl:7b`.
    - Als `<capability>.enabled: true` is maar er geen modellen zijn geconfigureerd, probeert OpenClaw het **actieve antwoordmodel** wanneer de provider de mogelijkheid ondersteunt.

  </Accordion>
</AccordionGroup>

### Mediabegrip automatisch detecteren (standaard)

Als `tools.media.<capability>.enabled` **niet** op `false` is gezet en je geen modellen hebt geconfigureerd, detecteert OpenClaw automatisch in deze volgorde en **stopt bij de eerste werkende optie**:

<Steps>
  <Step title="Active reply model">
    Actief antwoordmodel wanneer de provider de mogelijkheid ondersteunt.
  </Step>
  <Step title="agents.defaults.imageModel">
    Primaire/fallback-refs van `agents.defaults.imageModel` (alleen afbeelding).
    Geef de voorkeur aan `provider/model`-refs. Kale refs worden alleen gekwalificeerd vanuit geconfigureerde afbeeldingsgeschikte provider-modelvermeldingen wanneer de match uniek is.
  </Step>
  <Step title="Local CLIs (audio only)">
    Lokale CLI's (indien geïnstalleerd):

    - `sherpa-onnx-offline` (vereist `SHERPA_ONNX_MODEL_DIR` met encoder/decoder/joiner/tokens)
    - `whisper-cli` (`whisper-cpp`; gebruikt `WHISPER_CPP_MODEL` of het meegeleverde tiny model)
    - `whisper` (Python CLI; downloadt modellen automatisch)

  </Step>
  <Step title="Gemini CLI">
    `gemini` met `read_many_files`.
  </Step>
  <Step title="Provider auth">
    - Geconfigureerde `models.providers.*`-vermeldingen die de mogelijkheid ondersteunen, worden geprobeerd vóór de meegeleverde fallbackvolgorde.
    - Configuratieproviders voor alleen afbeeldingen met een afbeeldingsgeschikt model registreren zich automatisch voor mediabegrip, zelfs wanneer ze geen meegeleverde vendor plugin zijn.
    - Ollama-afbeeldingsbegrip is beschikbaar wanneer expliciet geselecteerd, bijvoorbeeld via `agents.defaults.imageModel` of `openclaw infer image describe --model ollama/<vision-model>`.

    Meegeleverde fallbackvolgorde:

    - Audio: OpenAI → Groq → xAI → Deepgram → Google → SenseAudio → ElevenLabs → Mistral
    - Afbeelding: OpenAI → Anthropic → Google → MiniMax → MiniMax Portal → Z.AI
    - Video: Google → Qwen → Moonshot

  </Step>
</Steps>

Stel het volgende in om automatische detectie uit te schakelen:

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
Binaire detectie is best-effort op macOS/Linux/Windows; zorg ervoor dat de CLI op `PATH` staat (we breiden `~` uit), of stel een expliciet CLI-model in met een volledig opdrachtpad.
</Note>

### Ondersteuning voor proxy-omgeving (providermodellen)

Wanneer providergebaseerd **audio**- en **video**-mediabegrip is ingeschakeld, respecteert OpenClaw standaard uitgaande proxy-omgevingsvariabelen voor provider-HTTP-aanroepen:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `ALL_PROXY`
- `https_proxy`
- `http_proxy`
- `all_proxy`

Als er geen proxy-env-vars zijn ingesteld, gebruikt mediabegrip directe egress. Als de proxywaarde ongeldig is gevormd, logt OpenClaw een waarschuwing en valt het terug op direct ophalen.

## Mogelijkheden (optioneel)

Als je `capabilities` instelt, draait de vermelding alleen voor die mediatypen. Voor gedeelde lijsten kan OpenClaw standaardwaarden afleiden:

- `openai`, `anthropic`, `minimax`: **afbeelding**
- `minimax-portal`: **afbeelding**
- `moonshot`: **afbeelding + video**
- `openrouter`: **afbeelding**
- `google` (Gemini API): **afbeelding + audio + video**
- `qwen`: **afbeelding + video**
- `mistral`: **audio**
- `zai`: **afbeelding**
- `groq`: **audio**
- `xai`: **audio**
- `deepgram`: **audio**
- Elke `models.providers.<id>.models[]`-catalogus met een afbeeldingsgeschikt model: **afbeelding**

Stel voor CLI-vermeldingen **`capabilities` expliciet in** om verrassende matches te voorkomen. Als je `capabilities` weglaat, is de vermelding geschikt voor de lijst waarin deze voorkomt.

## Matrix voor providerondersteuning (OpenClaw-integraties)

| Mogelijkheid | Providerintegratie                                                                                                           | Opmerkingen                                                                                                                                                                                                                              |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Afbeelding      | OpenAI, OpenAI Codex OAuth, Codex app-server, OpenRouter, Anthropic, Google, MiniMax, Moonshot, Qwen, Z.AI, configuratieproviders | Vendor plugins registreren afbeeldingsondersteuning; `openai-codex/*` gebruikt OAuth-providerleidingen; `codex/*` gebruikt een begrensde Codex app-server-turn; MiniMax en MiniMax OAuth gebruiken beide `MiniMax-VL-01`; afbeeldingsgeschikte configuratieproviders registreren zich automatisch. |
| Audio      | OpenAI, Groq, xAI, Deepgram, Google, SenseAudio, ElevenLabs, Mistral                                                         | Providertranscriptie (Whisper/Groq/xAI/Deepgram/Gemini/SenseAudio/Scribe/Voxtral).                                                                                                                                                    |
| Video      | Google, Qwen, Moonshot                                                                                                       | Providervideobegrip via vendor plugins; Qwen-videobegrip gebruikt de Standard DashScope-eindpunten.                                                                                                                        |

<Note>
**MiniMax-opmerking**

- Afbeeldingsbegrip voor `minimax` en `minimax-portal` komt van de Plugin-eigen `MiniMax-VL-01`-mediaprovider.
- De meegeleverde MiniMax-tekstcatalogus start nog steeds als alleen-tekst; expliciete `models.providers.minimax`-vermeldingen materialiseren afbeeldingsgeschikte M2.7-chatrefs.

</Note>

## Richtlijnen voor modelselectie

- Geef de voorkeur aan het sterkste beschikbare model van de nieuwste generatie voor elke mediamogelijkheid wanneer kwaliteit en veiligheid belangrijk zijn.
- Vermijd oudere/zwakkere mediamodellen voor tool-enabled agents die niet-vertrouwde invoer verwerken.
- Houd ten minste één fallback per mogelijkheid aan voor beschikbaarheid (kwaliteitsmodel + sneller/goedkoper model).
- CLI-fallbacks (`whisper-cli`, `whisper`, `gemini`) zijn nuttig wanneer provider-API's niet beschikbaar zijn.
- `parakeet-mlx`-opmerking: met `--output-dir` leest OpenClaw `<output-dir>/<media-basename>.txt` wanneer het uitvoerformaat `txt` is (of niet is opgegeven); niet-`txt`-formaten vallen terug op stdout.

## Bijlagebeleid

`attachments` per mogelijkheid bepaalt welke bijlagen worden verwerkt:

<ParamField path="mode" type='"first" | "all"' default="first">
  Of de eerste geselecteerde bijlage of alle geselecteerde bijlagen moeten worden verwerkt.
</ParamField>
<ParamField path="maxAttachments" type="number" default="1">
  Beperk het aantal dat wordt verwerkt.
</ParamField>
<ParamField path="prefer" type='"first" | "last" | "path" | "url"'>
  Selectievoorkeur onder kandidaatbijlagen.
</ParamField>

Wanneer `mode: "all"` is, worden uitvoerresultaten gelabeld als `[Image 1/2]`, `[Audio 2/2]`, enzovoort.

<AccordionGroup>
  <Accordion title="Gedrag voor extractie van bestandsbijlagen">
    - Geëxtraheerde bestandstekst wordt verpakt als **niet-vertrouwde externe inhoud** voordat deze aan de mediaprompt wordt toegevoegd.
    - Het geïnjecteerde blok gebruikt expliciete grensmarkeringen zoals `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` / `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` en bevat een metadataregel `Source: External`.
    - Dit pad voor extractie van bijlagen laat bewust de lange banner `SECURITY NOTICE:` weg om te voorkomen dat de mediaprompt onnodig groot wordt; de grensmarkeringen en metadata blijven wel behouden.
    - Als een bestand geen extraheerbare tekst heeft, injecteert OpenClaw `[No extractable text]`.
    - Als een PDF in dit pad terugvalt op gerenderde pagina-afbeeldingen, behoudt de mediaprompt de placeholder `[PDF content rendered to images; images not forwarded to model]`, omdat deze stap voor extractie van bijlagen tekstblokken doorstuurt, niet de gerenderde PDF-afbeeldingen.

  </Accordion>
</AccordionGroup>

## Configuratievoorbeelden

<Tabs>
  <Tab title="Gedeelde modellen + overschrijvingen">
    ```json5
    {
      tools: {
        media: {
          models: [
            { provider: "openai", model: "gpt-5.5", capabilities: ["image"] },
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
  <Tab title="Alleen afbeeldingen">
    ```json5
    {
      tools: {
        media: {
          image: {
            enabled: true,
            maxBytes: 10485760,
            maxChars: 500,
            models: [
              { provider: "openai", model: "gpt-5.5" },
              { provider: "anthropic", model: "claude-opus-4-6" },
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

Wanneer mediabegrip wordt uitgevoerd, bevat `/status` een korte samenvattingsregel:

```
📎 Media: image ok (openai/gpt-5.4) · audio skipped (maxBytes)
```

Dit toont resultaten per mogelijkheid en, waar van toepassing, de gekozen provider/het gekozen model.

## Opmerkingen

- Begrip is **best-effort**. Fouten blokkeren antwoorden niet.
- Bijlagen worden nog steeds aan modellen doorgegeven, zelfs wanneer begrip is uitgeschakeld.
- Gebruik `scope` om te beperken waar begrip wordt uitgevoerd (bijvoorbeeld alleen DM's).

## Gerelateerd

- [Configuratie](/nl/gateway/configuration)
- [Ondersteuning voor afbeeldingen en media](/nl/nodes/images)
