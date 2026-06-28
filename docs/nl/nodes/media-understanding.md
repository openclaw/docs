---
read_when:
    - Media-inzicht ontwerpen of refactoren
    - Voorbewerking van inkomende audio/video/afbeeldingen afstemmen
sidebarTitle: Media understanding
summary: Inkomend begrip van afbeeldingen/audio/video (optioneel) met provider- en CLI-fallbacks
title: Media-inzicht
x-i18n:
    generated_at: "2026-06-28T05:08:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 40ce9b5c65857702015172cbba76ea4396267894888487b40c11b5997a992362
    source_path: nodes/media-understanding.md
    workflow: 16
---

OpenClaw kan **inkomende media samenvatten** (afbeelding/audio/video) voordat de antwoordpipeline wordt uitgevoerd. Het detecteert automatisch wanneer lokale tools of providersleutels beschikbaar zijn, en kan worden uitgeschakeld of aangepast. Als begrip is uitgeschakeld, ontvangen modellen nog steeds zoals gebruikelijk de oorspronkelijke bestanden/URL's.

Leveranciersspecifiek mediagedrag wordt geregistreerd door leveranciersplugins, terwijl de OpenClaw-kern eigenaar is van de gedeelde `tools.media`-configuratie, fallbackvolgorde en integratie met de antwoordpipeline.

## Doelen

- Optioneel: inkomende media vooraf verwerken tot korte tekst voor snellere routering + betere opdrachtparsing.
- Oorspronkelijke medialevering aan het model behouden (altijd).
- **Provider-API's** en **CLI-fallbacks** ondersteunen.
- Meerdere modellen met geordende fallback toestaan (fout/grootte/time-out).

## Gedrag op hoog niveau

<Steps>
  <Step title="Bijlagen verzamelen">
    Verzamel inkomende bijlagen (`MediaPaths`, `MediaUrls`, `MediaTypes`).
  </Step>
  <Step title="Per mogelijkheid selecteren">
    Selecteer voor elke ingeschakelde mogelijkheid (afbeelding/audio/video) bijlagen per beleid (standaard: **eerste**).
  </Step>
  <Step title="Model kiezen">
    Kies de eerste geschikte modelvermelding (grootte + mogelijkheid + auth).
  </Step>
  <Step title="Fallback bij mislukking">
    Als een model mislukt of de media te groot is, **val terug op de volgende vermelding**.
  </Step>
  <Step title="Succesblok toepassen">
    Bij succes:

    - `Body` wordt een blok `[Image]`, `[Audio]` of `[Video]`.
    - Audio stelt `{{Transcript}}` in; opdrachtparsing gebruikt bij aanwezige bijschrifttekst die tekst, anders het transcript.
    - Bijschriften blijven behouden als `User text:` binnen het blok.

  </Step>
</Steps>

Als begrip mislukt of is uitgeschakeld, **gaat de antwoordstroom door** met de oorspronkelijke body + bijlagen.

## Configuratieoverzicht

`tools.media` ondersteunt **gedeelde modellen** plus overrides per mogelijkheid:

<AccordionGroup>
  <Accordion title="Toplevel-sleutels">
    - `tools.media.models`: gedeelde modellenlijst (gebruik `capabilities` om te begrenzen).
    - `tools.media.image` / `tools.media.audio` / `tools.media.video`:
      - standaardwaarden (`prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`)
      - provider-overrides (`baseUrl`, `headers`, `providerOptions`)
      - Deepgram-audio-opties via `tools.media.audio.providerOptions.deepgram`
      - echo-instellingen voor audiotranscript (`echoTranscript`, standaard `false`; `echoFormat`)
      - optionele **`models`-lijst per mogelijkheid** (voorkeur boven gedeelde modellen)
      - `attachments`-beleid (`mode`, `maxAttachments`, `prefer`)
      - `scope` (optionele begrenzing op channel/chatType/sessiesleutel)
    - `tools.media.concurrency`: maximaal aantal gelijktijdige mogelijkheidruns (standaard **2**).

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
  <Tab title="Provider-vermelding">
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

    CLI-templates kunnen ook gebruiken:

    - `{{MediaDir}}` (directory die het mediabestand bevat)
    - `{{OutputDir}}` (scratchdirectory die voor deze run is aangemaakt)
    - `{{OutputBase}}` (basispad van scratchbestand, zonder extensie)

  </Tab>
</Tabs>

### Providerreferenties (`apiKey`)

Mediabegrip via providers gebruikt dezelfde provider-auth-resolutie als normale
modelaanroepen: auth-profielen, omgevingsvariabelen, daarna
`models.providers.<providerId>.apiKey`.

`tools.media.*.models[]`-vermeldingen accepteren geen inline `apiKey`-veld. De
`provider`-waarde in een mediamodelvermelding, zoals `openai` of `moonshot`, moet
referenties beschikbaar hebben via een van de standaard provider-auth-bronnen.

Minimaal voorbeeld:

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

Zie [Tools en aangepaste providers](/nl/gateway/config-tools) voor de volledige provider-auth-referentie, inclusief profielen, omgevingsvariabelen en aangepaste basis-URL's.

## Standaardwaarden en limieten

Aanbevolen standaardwaarden:

- `maxChars`: **500** voor afbeelding/video (kort, opdrachtvriendelijk)
- `maxChars`: **niet ingesteld** voor audio (volledig transcript tenzij je een limiet instelt)
- `maxBytes`:
  - afbeelding: **10MB**
  - audio: **20MB**
  - video: **50MB**

<AccordionGroup>
  <Accordion title="Regels">
    - Als media `maxBytes` overschrijdt, wordt dat model overgeslagen en wordt het **volgende model geprobeerd**.
    - Audiobestanden kleiner dan **1024 bytes** worden als leeg/beschadigd behandeld en overgeslagen vóór provider/CLI-transcriptie; de inkomende antwoordcontext ontvangt een deterministisch placeholdertranscript zodat de agent weet dat de notitie te klein was.
    - Als het model meer dan `maxChars` retourneert, wordt de uitvoer ingekort.
    - `prompt` gebruikt standaard eenvoudig "Describe the {media}." plus de `maxChars`-richtlijn (alleen afbeelding/video).
    - Als het actieve primaire afbeeldingsmodel al native vision ondersteunt, slaat OpenClaw het samenvattingsblok `[Image]` over en geeft het in plaats daarvan de oorspronkelijke afbeelding door aan het model.
    - Als een primair Gateway/WebChat-model alleen tekst ondersteunt, blijven afbeeldingsbijlagen behouden als uitbestede `media://inbound/*`-refs, zodat de afbeelding/PDF-tools of het geconfigureerde afbeeldingsmodel ze nog steeds kunnen inspecteren in plaats van de bijlage te verliezen.
    - Expliciete `openclaw infer image describe --model <provider/model>`-verzoeken zijn anders: ze voeren dat afbeeldingsgeschikte provider/model direct uit, inclusief Ollama-refs zoals `ollama/qwen2.5vl:7b`.
    - Als `<capability>.enabled: true` maar er geen modellen zijn geconfigureerd, probeert OpenClaw het **actieve antwoordmodel** wanneer de provider daarvan de mogelijkheid ondersteunt.

  </Accordion>
</AccordionGroup>

### Mediabegrip automatisch detecteren (standaard)

Als `tools.media.<capability>.enabled` **niet** op `false` staat en je geen modellen hebt geconfigureerd, detecteert OpenClaw automatisch in deze volgorde en **stopt bij de eerste werkende optie**:

<Steps>
  <Step title="Actief antwoordmodel">
    Actief antwoordmodel wanneer de provider daarvan de mogelijkheid ondersteunt.
  </Step>
  <Step title="agents.defaults.imageModel">
    `agents.defaults.imageModel` primaire/fallback-refs (alleen afbeelding).
    Geef de voorkeur aan `provider/model`-refs. Kale refs worden alleen gekwalificeerd vanuit geconfigureerde afbeeldingsgeschikte provider-modelvermeldingen wanneer de match uniek is.
  </Step>
  <Step title="Lokale CLI's (alleen audio)">
    Lokale CLI's (indien geïnstalleerd):

    - `sherpa-onnx-offline` (vereist `SHERPA_ONNX_MODEL_DIR` met encoder/decoder/joiner/tokens)
    - `whisper-cli` (`whisper-cpp`; gebruikt `WHISPER_CPP_MODEL` of het meegeleverde tiny-model)
    - `whisper` (Python-CLI; downloadt modellen automatisch)

  </Step>
  <Step title="Gemini CLI">
    `gemini` met `read_many_files`.
  </Step>
  <Step title="Provider-auth">
    - Geconfigureerde `models.providers.*`-vermeldingen die de mogelijkheid ondersteunen, worden geprobeerd vóór de meegeleverde fallbackvolgorde.
    - Configuratieproviders alleen voor afbeeldingen met een afbeeldingsgeschikt model registreren zich automatisch voor mediabegrip, zelfs wanneer ze geen meegeleverde leveranciersplugin zijn.
    - Ollama-afbeeldingsbegrip is beschikbaar wanneer het expliciet wordt geselecteerd, bijvoorbeeld via `agents.defaults.imageModel` of `openclaw infer image describe --model ollama/<vision-model>`.

    Meegeleverde fallbackvolgorde:

    - Audio: OpenAI → Groq → xAI → Deepgram → OpenRouter → Google → SenseAudio → ElevenLabs → Mistral
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
Binaire detectie is best-effort op macOS/Linux/Windows; zorg dat de CLI op `PATH` staat (we breiden `~` uit), of stel een expliciet CLI-model in met een volledig opdrachtpad.
</Note>

### Ondersteuning voor proxy-omgeving (providermodellen)

Wanneer providergebaseerd **audio-** en **video**mediabegrip is ingeschakeld, respecteert OpenClaw standaard uitgaande proxy-omgevingsvariabelen voor HTTP-aanroepen naar providers:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `ALL_PROXY`
- `https_proxy`
- `http_proxy`
- `all_proxy`

Als er geen proxy-env-vars zijn ingesteld, gebruikt mediabegrip directe egress. Als de proxywaarde ongeldig is, logt OpenClaw een waarschuwing en valt terug op direct ophalen.

## Mogelijkheden (optioneel)

Als je `capabilities` instelt, wordt de vermelding alleen uitgevoerd voor die mediatypen. Voor gedeelde lijsten kan OpenClaw standaardwaarden afleiden:

- `openai`, `anthropic`, `minimax`: **afbeelding**
- `minimax-portal`: **afbeelding**
- `moonshot`: **afbeelding + video**
- `openrouter`: **afbeelding + audio**
- `google` (Gemini API): **afbeelding + audio + video**
- `qwen`: **afbeelding + video**
- `mistral`: **audio**
- `zai`: **afbeelding**
- `groq`: **audio**
- `xai`: **audio**
- `deepgram`: **audio**
- Elke `models.providers.<id>.models[]`-catalogus met een afbeeldingsgeschikt model: **afbeelding**

Stel voor CLI-vermeldingen **`capabilities` expliciet in** om verrassende matches te voorkomen. Als je `capabilities` weglaat, komt de vermelding in aanmerking voor de lijst waarin deze staat.

## Provider-ondersteuningsmatrix (OpenClaw-integraties)

| Mogelijkheid | Providerintegratie                                                                                                           | Notities                                                                                                                                                                                                                                    |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Afbeelding | OpenAI, OpenAI Codex OAuth, Codex app-server, OpenRouter, Anthropic, Google, MiniMax, Moonshot, Qwen, Z.AI, configuratieproviders | Leveranciersplugins registreren afbeeldingsondersteuning; `openai/*` kan API-key- of Codex OAuth-routering gebruiken; `codex/*` gebruikt een begrensde Codex app-server-turn; MiniMax en MiniMax OAuth gebruiken beide `MiniMax-VL-01`; afbeeldingsgeschikte configuratieproviders registreren automatisch. |
| Audio      | OpenAI, Groq, xAI, Deepgram, OpenRouter, Google, SenseAudio, ElevenLabs, Mistral                                             | Providertranscriptie (Whisper/Groq/xAI/Deepgram/OpenRouter STT/Gemini/SenseAudio/Scribe/Voxtral).                                                                                                                                          |
| Video      | Google, Qwen, Moonshot                                                                                                       | Provider-videobegrip via leveranciersplugins; Qwen-videobegrip gebruikt de Standard DashScope-eindpunten.                                                                                                                                  |

<Note>
**MiniMax-notitie**

- `minimax`, `minimax-cn`, `minimax-portal` en `minimax-portal-cn` beeldbegrip komt van de door de plugin beheerde `MiniMax-VL-01` mediaprovider.
- Automatische afbeeldingsroutering blijft `MiniMax-VL-01` gebruiken, zelfs als verouderde MiniMax M2.x-chatmetadata beweert afbeeldingsinvoer te ondersteunen.

</Note>

## Richtlijnen voor modelselectie

- Geef de voorkeur aan het sterkste model van de nieuwste generatie dat beschikbaar is voor elke mediamogelijkheid wanneer kwaliteit en veiligheid belangrijk zijn.
- Vermijd oudere/zwakkere mediamodellen voor agents met tools ingeschakeld die niet-vertrouwde invoer verwerken.
- Houd ten minste één fallback per mogelijkheid aan voor beschikbaarheid (kwaliteitsmodel + sneller/goedkoper model).
- CLI-fallbacks (`whisper-cli`, `whisper`, `gemini`) zijn nuttig wanneer provider-API's niet beschikbaar zijn.
- Opmerking over `parakeet-mlx`: met `--output-dir` leest OpenClaw `<output-dir>/<media-basename>.txt` wanneer de uitvoerindeling `txt` is (of niet is opgegeven); niet-`txt`-indelingen vallen terug op stdout.

## Bijlagebeleid

Per mogelijkheid bepaalt `attachments` welke bijlagen worden verwerkt:

<ParamField path="mode" type='"first" | "all"' default="first">
  Of de eerste geselecteerde bijlage of alle bijlagen moeten worden verwerkt.
</ParamField>
<ParamField path="maxAttachments" type="number" default="1">
  Beperk het aantal dat wordt verwerkt.
</ParamField>
<ParamField path="prefer" type='"first" | "last" | "path" | "url"'>
  Selectievoorkeur tussen kandidaatbijlagen.
</ParamField>

Wanneer `mode: "all"` is, worden uitvoeren gelabeld als `[Image 1/2]`, `[Audio 2/2]`, enzovoort.

<AccordionGroup>
  <Accordion title="File-attachment extraction behavior">
    - Geëxtraheerde bestandstekst wordt verpakt als **niet-vertrouwde externe inhoud** voordat deze aan de mediaprompt wordt toegevoegd.
    - Het geïnjecteerde blok gebruikt expliciete grensmarkeringen zoals `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` / `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` en bevat een metadataregel `Source: External`.
    - Dit pad voor bijlage-extractie laat bewust de lange banner `SECURITY NOTICE:` weg om te voorkomen dat de mediaprompt onnodig groot wordt; de grensmarkeringen en metadata blijven wel aanwezig.
    - Als een bestand geen extraheerbare tekst heeft, injecteert OpenClaw `[No extractable text]`.
    - Als een PDF in dit pad terugvalt op gerenderde pagina-afbeeldingen, stuurt OpenClaw die pagina-afbeeldingen door naar antwoordmodellen met vision-mogelijkheden en behoudt het de placeholder `[PDF content rendered to images]` in het bestandsblok.

  </Accordion>
</AccordionGroup>

## Configuratievoorbeelden

<Tabs>
  <Tab title="Shared models + overrides">
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
  <Tab title="Audio + video only">
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
  <Tab title="Image-only">
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
  <Tab title="Multi-modal single entry">
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

Dit toont de uitkomsten per mogelijkheid en, waar van toepassing, de gekozen provider/het gekozen model.

## Opmerkingen

- Begrip is **best-effort**. Fouten blokkeren antwoorden niet.
- Bijlagen worden nog steeds aan modellen doorgegeven, zelfs wanneer begrip is uitgeschakeld.
- Gebruik `scope` om te beperken waar begrip wordt uitgevoerd (bijvoorbeeld alleen DM's).

## Gerelateerd

- [Configuratie](/nl/gateway/configuration)
- [Ondersteuning voor afbeeldingen en media](/nl/nodes/images)
