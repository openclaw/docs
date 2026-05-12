---
read_when:
    - Mediabegrip ontwerpen of herstructureren
    - Afstemmen van voorverwerking van inkomende audio/video/afbeeldingen
sidebarTitle: Media understanding
summary: Begrip van inkomende afbeeldingen/audio/video (optioneel) met fallbackopties voor provider en CLI
title: Mediabegrip
x-i18n:
    generated_at: "2026-05-12T08:45:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8d58141ac1591890a4eb2c5cdcbc1bf19727fb0c3a1d4d0a912c6bb19d3f3592
    source_path: nodes/media-understanding.md
    workflow: 16
---

OpenClaw kan **binnenkomende media samenvatten** (afbeelding/audio/video) voordat de antwoordpipeline wordt uitgevoerd. Het detecteert automatisch wanneer lokale tools of providersleutels beschikbaar zijn, en kan worden uitgeschakeld of aangepast. Als begrip uitstaat, ontvangen modellen nog steeds zoals gebruikelijk de oorspronkelijke bestanden/URL’s.

Leveranciersspecifiek mediagedrag wordt geregistreerd door leverancierplugins, terwijl OpenClaw core eigenaar is van de gedeelde `tools.media`-configuratie, fallbackvolgorde en integratie met de antwoordpipeline.

## Doelen

- Optioneel: verwerk binnenkomende media vooraf tot korte tekst voor snellere routering + betere opdrachtanalyse.
- Behoud levering van oorspronkelijke media aan het model (altijd).
- Ondersteun **provider-API’s** en **CLI-fallbacks**.
- Sta meerdere modellen toe met geordende fallback (fout/grootte/time-out).

## Gedrag op hoofdlijnen

<Steps>
  <Step title="Bijlagen verzamelen">
    Verzamel binnenkomende bijlagen (`MediaPaths`, `MediaUrls`, `MediaTypes`).
  </Step>
  <Step title="Per capaciteit selecteren">
    Selecteer voor elke ingeschakelde capaciteit (afbeelding/audio/video) bijlagen volgens beleid (standaard: **eerste**).
  </Step>
  <Step title="Model kiezen">
    Kies de eerste geschikte modelvermelding (grootte + capaciteit + auth).
  </Step>
  <Step title="Fallback bij mislukking">
    Als een model mislukt of de media te groot zijn, **val terug op de volgende vermelding**.
  </Step>
  <Step title="Succesblok toepassen">
    Bij succes:

    - `Body` wordt een `[Image]`-, `[Audio]`- of `[Video]`-blok.
    - Audio stelt `{{Transcript}}` in; opdrachtanalyse gebruikt bijschrijfttekst wanneer aanwezig, anders het transcript.
    - Bijschriften blijven behouden als `User text:` in het blok.

  </Step>
</Steps>

Als begrip mislukt of is uitgeschakeld, **gaat de antwoordflow door** met de oorspronkelijke body + bijlagen.

## Configuratieoverzicht

`tools.media` ondersteunt **gedeelde modellen** plus overrides per capaciteit:

<AccordionGroup>
  <Accordion title="Sleutels op het hoogste niveau">
    - `tools.media.models`: gedeelde modellenlijst (gebruik `capabilities` om te beperken).
    - `tools.media.image` / `tools.media.audio` / `tools.media.video`:
      - standaardwaarden (`prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`)
      - provideroverrides (`baseUrl`, `headers`, `providerOptions`)
      - Deepgram-audio-opties via `tools.media.audio.providerOptions.deepgram`
      - echo-instellingen voor audiotranscript (`echoTranscript`, standaard `false`; `echoFormat`)
      - optionele **per-capaciteit `models`-lijst** (heeft voorkeur boven gedeelde modellen)
      - `attachments`-beleid (`mode`, `maxAttachments`, `prefer`)
      - `scope` (optionele gating op channel/chatType/sessiesleutel)
    - `tools.media.concurrency`: maximaal gelijktijdige capaciteitsruns (standaard **2**).

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
  <Tab title="Providervermelding">
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

    CLI-sjablonen kunnen ook gebruiken:

    - `{{MediaDir}}` (map die het mediabestand bevat)
    - `{{OutputDir}}` (scratchmap gemaakt voor deze run)
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
  <Accordion title="Regels">
    - Als media `maxBytes` overschrijden, wordt dat model overgeslagen en wordt het **volgende model geprobeerd**.
    - Audiobestanden kleiner dan **1024 bytes** worden behandeld als leeg/beschadigd en overgeslagen vóór provider-/CLI-transcriptie; de binnenkomende antwoordcontext ontvangt een deterministisch placeholdertranscript zodat de agent weet dat de notitie te klein was.
    - Als het model meer dan `maxChars` retourneert, wordt de uitvoer ingekort.
    - `prompt` gebruikt standaard eenvoudige "Describe the {media}." plus de `maxChars`-richtlijn (alleen afbeelding/video).
    - Als het actieve primaire afbeeldingsmodel al native vision ondersteunt, slaat OpenClaw het `[Image]`-samenvattingsblok over en geeft het de oorspronkelijke afbeelding in plaats daarvan door aan het model.
    - Als een Gateway-/WebChat-primair model alleen tekst ondersteunt, blijven afbeeldingsbijlagen behouden als offloaded `media://inbound/*`-refs zodat de afbeelding-/PDF-tools of het geconfigureerde afbeeldingsmodel ze nog steeds kunnen inspecteren in plaats van de bijlage kwijt te raken.
    - Expliciete `openclaw infer image describe --model <provider/model>`-verzoeken zijn anders: ze voeren dat afbeeldingscapabele provider/model direct uit, inclusief Ollama-refs zoals `ollama/qwen2.5vl:7b`.
    - Als `<capability>.enabled: true` maar er geen modellen zijn geconfigureerd, probeert OpenClaw het **actieve antwoordmodel** wanneer de provider de capaciteit ondersteunt.

  </Accordion>
</AccordionGroup>

### Mediabegrip automatisch detecteren (standaard)

Als `tools.media.<capability>.enabled` **niet** is ingesteld op `false` en je geen modellen hebt geconfigureerd, detecteert OpenClaw automatisch in deze volgorde en **stopt bij de eerste werkende optie**:

<Steps>
  <Step title="Actief antwoordmodel">
    Actief antwoordmodel wanneer de provider de capaciteit ondersteunt.
  </Step>
  <Step title="agents.defaults.imageModel">
    `agents.defaults.imageModel` primaire/fallback-refs (alleen afbeelding).
    Geef de voorkeur aan `provider/model`-refs. Kale refs worden alleen gekwalificeerd vanuit geconfigureerde afbeeldingscapabele providermodelvermeldingen wanneer de match uniek is.
  </Step>
  <Step title="Lokale CLI’s (alleen audio)">
    Lokale CLI’s (indien geïnstalleerd):

    - `sherpa-onnx-offline` (vereist `SHERPA_ONNX_MODEL_DIR` met encoder/decoder/joiner/tokens)
    - `whisper-cli` (`whisper-cpp`; gebruikt `WHISPER_CPP_MODEL` of het gebundelde tiny-model)
    - `whisper` (Python-CLI; downloadt modellen automatisch)

  </Step>
  <Step title="Gemini CLI">
    `gemini` met `read_many_files`.
  </Step>
  <Step title="Providerauth">
    - Geconfigureerde `models.providers.*`-vermeldingen die de capaciteit ondersteunen, worden geprobeerd vóór de gebundelde fallbackvolgorde.
    - Providers met alleen afbeeldingsconfiguratie en een afbeeldingscapabel model registreren zich automatisch voor mediabegrip, zelfs wanneer ze geen gebundelde leverancierplugin zijn.
    - Ollama-afbeeldingsbegrip is beschikbaar wanneer expliciet geselecteerd, bijvoorbeeld via `agents.defaults.imageModel` of `openclaw infer image describe --model ollama/<vision-model>`.

    Gebundelde fallbackvolgorde:

    - Audio: OpenAI → Groq → xAI → Deepgram → OpenRouter → Google → SenseAudio → ElevenLabs → Mistral
    - Afbeelding: OpenAI → Anthropic → Google → MiniMax → MiniMax Portal → Z.AI
    - Video: Google → Qwen → Moonshot

  </Step>
</Steps>

Om automatische detectie uit te schakelen, stel in:

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
Binaire detectie is best-effort op macOS/Linux/Windows; zorg dat de CLI op `PATH` staat (we breiden `~` uit), of stel een expliciet CLI-model in met een volledig commandopad.
</Note>

### Ondersteuning voor proxyomgevingen (providermodellen)

Wanneer providergebaseerd **audio**- en **video**mediabegrip is ingeschakeld, respecteert OpenClaw standaard uitgaande proxyomgevingsvariabelen voor provider-HTTP-aanroepen:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `ALL_PROXY`
- `https_proxy`
- `http_proxy`
- `all_proxy`

Als er geen proxy-env-vars zijn ingesteld, gebruikt mediabegrip directe egress. Als de proxywaarde ongeldig is, logt OpenClaw een waarschuwing en valt het terug op direct ophalen.

## Capaciteiten (optioneel)

Als je `capabilities` instelt, draait de vermelding alleen voor die mediatypen. Voor gedeelde lijsten kan OpenClaw standaardwaarden afleiden:

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
- Elke `models.providers.<id>.models[]`-catalogus met een afbeeldingscapabel model: **afbeelding**

Voor CLI-vermeldingen: **stel `capabilities` expliciet in** om verrassende matches te voorkomen. Als je `capabilities` weglaat, komt de vermelding in aanmerking voor de lijst waarin deze staat.

## Providerondersteuningsmatrix (OpenClaw-integraties)

| Capaciteit | Providerintegratie                                                                                                           | Notities                                                                                                                                                                                                                                |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Afbeelding | OpenAI, OpenAI Codex OAuth, Codex app-server, OpenRouter, Anthropic, Google, MiniMax, Moonshot, Qwen, Z.AI, config providers | Leverancierplugins registreren afbeeldingsondersteuning; `openai-codex/*` gebruikt OAuth-providerplumbing; `codex/*` gebruikt een begrensde Codex app-server-turn; MiniMax en MiniMax OAuth gebruiken allebei `MiniMax-VL-01`; afbeeldingscapabele config providers registreren zich automatisch. |
| Audio      | OpenAI, Groq, xAI, Deepgram, OpenRouter, Google, SenseAudio, ElevenLabs, Mistral                                             | Providertranscriptie (Whisper/Groq/xAI/Deepgram/OpenRouter STT/Gemini/SenseAudio/Scribe/Voxtral).                                                                                                                                      |
| Video      | Google, Qwen, Moonshot                                                                                                       | Providervideobegrip via leverancierplugins; Qwen-videobegrip gebruikt de Standard DashScope-endpoints.                                                                                                                                 |

<Note>
**MiniMax-notitie**

- `minimax`- en `minimax-portal`-afbeeldingsbegrip komt van de plugin-eigen `MiniMax-VL-01`-mediaprovider.
- De gebundelde MiniMax-tekstcatalogus begint nog steeds als alleen tekst; expliciete `models.providers.minimax`-vermeldingen materialiseren afbeeldingscapabele M2.7-chatrefs.

</Note>

## Richtlijnen voor modelselectie

- Geef de voorkeur aan het sterkste beschikbare nieuwste-generatiemodel voor elke mediacapaciteit wanneer kwaliteit en veiligheid belangrijk zijn.
- Vermijd oudere/zwakkere mediamodellen voor tool-enabled agents die onvertrouwde invoer verwerken.
- Houd ten minste één fallback per capaciteit voor beschikbaarheid (kwaliteitsmodel + sneller/goedkoper model).
- CLI-fallbacks (`whisper-cli`, `whisper`, `gemini`) zijn nuttig wanneer provider-API’s niet beschikbaar zijn.
- `parakeet-mlx`-notitie: met `--output-dir` leest OpenClaw `<output-dir>/<media-basename>.txt` wanneer de uitvoerindeling `txt` is (of niet is opgegeven); niet-`txt`-indelingen vallen terug op stdout.

## Bijlagebeleid

Per-capaciteit `attachments` bepaalt welke bijlagen worden verwerkt:

<ParamField path="mode" type='"first" | "all"' default="first">
  Of de eerste geselecteerde bijlage of alle geselecteerde bijlagen moeten worden verwerkt.
</ParamField>
<ParamField path="maxAttachments" type="number" default="1">
  Beperk het aantal dat wordt verwerkt.
</ParamField>
<ParamField path="prefer" type='"first" | "last" | "path" | "url"'>
  Selectievoorkeur tussen kandidaatbijlagen.
</ParamField>

Wanneer `mode: "all"` is, krijgen uitvoerresultaten labels zoals `[Image 1/2]`, `[Audio 2/2]`, enzovoort.

<AccordionGroup>
  <Accordion title="File-attachment extraction behavior">
    - Geëxtraheerde bestandstekst wordt verpakt als **niet-vertrouwde externe inhoud** voordat deze aan de mediaprompt wordt toegevoegd.
    - Het geïnjecteerde blok gebruikt expliciete grensmarkeringen zoals `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` / `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` en bevat een metadataregel `Source: External`.
    - Dit pad voor bijlage-extractie laat bewust de lange banner `SECURITY NOTICE:` weg om te voorkomen dat de mediaprompt opzwelt; de grensmarkeringen en metadata blijven wel behouden.
    - Als een bestand geen extraheerbare tekst heeft, injecteert OpenClaw `[No extractable text]`.
    - Als een PDF in dit pad terugvalt op gerenderde pagina-afbeeldingen, behoudt de mediaprompt de placeholder `[PDF content rendered to images; images not forwarded to model]`, omdat deze stap voor bijlage-extractie tekstblokken doorstuurt, niet de gerenderde PDF-afbeeldingen.

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

Dit toont resultaten per capability en, waar van toepassing, de gekozen provider/het gekozen model.

## Opmerkingen

- Begrip is **best-effort**. Fouten blokkeren antwoorden niet.
- Bijlagen worden nog steeds aan modellen doorgegeven, zelfs wanneer begrip is uitgeschakeld.
- Gebruik `scope` om te beperken waar begrip wordt uitgevoerd (bijvoorbeeld alleen DM's).

## Gerelateerd

- [Configuratie](/nl/gateway/configuration)
- [Afbeeldings- en mediaondersteuning](/nl/nodes/images)
