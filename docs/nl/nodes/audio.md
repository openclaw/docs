---
read_when:
    - Audiotranscriptie of mediaverwerking wijzigen
summary: Hoe binnenkomende audio-/spraakberichten worden gedownload, getranscribeerd en in antwoorden worden ingevoegd
title: Audio- en spraaknotities
x-i18n:
    generated_at: "2026-07-12T09:01:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cb382f4219620d906bfa76ebddc690b174a3b24f80f815be92e915b363d17792
    source_path: nodes/audio.md
    workflow: 16
---

## Wat het doet

Wanneer audiobegrip is ingeschakeld (of automatisch wordt gedetecteerd), doet OpenClaw het volgende:

1. Zoekt de eerste audiobijlage (lokaal pad of URL) en downloadt deze indien nodig.
2. Past `maxBytes` toe voordat de bijlage naar elke modelvermelding wordt verzonden.
3. Voert de eerste geschikte modelvermelding op volgorde uit (provider of CLI); als een vermelding mislukt of wordt overgeslagen (grootte/time-out), wordt de volgende geprobeerd.
4. Vervangt bij succes `Body` door een `[Audio]`-blok en stelt `{{Transcript}}` in.

Wanneer de transcriptie slaagt, worden `CommandBody`/`RawBody` eveneens ingesteld op het transcript, zodat slash-opdrachten blijven werken. Met `--verbose` tonen de logboeken wanneer de transcriptie wordt uitgevoerd en wanneer deze de berichttekst vervangt.

## Automatische detectie (standaard)

Als u geen modellen hebt geconfigureerd en `tools.media.audio.enabled` niet `false` is, detecteert OpenClaw de volgende opties in deze volgorde en stopt het bij de eerste werkende optie:

1. **Actief antwoordmodel**, wanneer de provider daarvan audiobegrip ondersteunt.
2. **Geconfigureerde providerauthenticatie** — elke `models.providers.*`-vermelding waarvoor authenticatie beschikbaar is voor een provider die audiotranscriptie ondersteunt. Dit wordt vóór lokale CLI's gecontroleerd, zodat een geconfigureerde API-sleutel altijd voorrang krijgt op een lokaal binair bestand in `PATH`.
   Providervolgorde wanneer er meerdere zijn geconfigureerd: Groq, OpenAI, xAI, Deepgram, Google, SenseAudio, ElevenLabs, Mistral.
3. **Lokale CLI's** (alleen als geen providerauthenticatie is gevonden). OpenClaw stelt een geordende lijst met terugvalopties samen:
   - `whisper-cli`, vóór CPU-standaardopties, uitsluitend wanneer bij een eerdere modelaanroep in het huidige proces Metal of CUDA is waargenomen
   - `sherpa-onnx-offline` met de standaard-CPU-provider (vereist `SHERPA_ONNX_MODEL_DIR` met `tokens.txt`, `encoder.onnx`, `decoder.onnx` en `joiner.onnx`)
   - `whisper-cli` wanneer Metal/CUDA alleen tijdens het bouwen kan worden ondersteund of de geselecteerde backend anderszins niet is waargenomen
   - `parakeet-mlx` op Apple Silicon (geschikt voor MLX; apparaatgebruik blijft niet waargenomen)
   - `whisper` (Python-CLI; downloadt modellen automatisch)

De herkomst van installatie/koppeling is bewijs van functionaliteit, niet van uitvoering. Hierdoor komt een kandidaat op zichzelf nooit vóór CPU-sherpa te staan. OpenClaw laadt tijdens de installatie of statuscontroles geen model alleen om een backend te testen.
Automatisch gedetecteerde whisper.cpp behoudt de normale logboeken van modeluitvoeringen, zodat OpenClaw de upstreamregel `using … backend` kan vastleggen. Expliciete CLI-vermeldingen behouden hun geconfigureerde uitvoervlaggen.

Automatische detectie van de Gemini CLI voor mediabegrip is vervangen door een terugvaloptie met de gesandboxte Antigravity CLI (`agy`) voor afbeeldingen/video; voor audio wordt buiten de bovenstaande lokale binaire bestanden geen CLI-terugvaloptie gebruikt.

Stel `tools.media.audio.enabled: false` in om automatische detectie uit te schakelen. Stel `tools.media.audio.models` in om deze aan te passen.

<Note>
Detectie van binaire bestanden werkt op basis van beste inspanning op macOS/Linux/Windows. Zorg ervoor dat de CLI in `PATH` staat (`~` wordt uitgevouwen), of stel een expliciet CLI-model in met een volledig opdrachtpad.
</Note>

Inspecteer de lokale selectie zonder audio te transcriberen:

```bash
openclaw capability audio providers
openclaw doctor --lint --only core/doctor/local-audio-acceleration --severity-min info
```

De providerinventaris rapporteert de winnaar van de lokale terugvalopties afzonderlijk van de algemene providerselectie, evenals de velden voor geschikte, aangevraagde en waargenomen backends. Nadat de transcriptie is uitgevoerd, rapporteert `/status` de aangevraagde of waargenomen backend in de mediaregel. Expliciete CLI-vermeldingen in `tools.media.audio.models` omzeilen nog steeds de automatische selectie; gebruik hun backendspecifieke vlaggen, zoals `--provider=cuda` voor sherpa of `--no-gpu`/`--device` voor whisper.cpp.

## Configuratievoorbeelden

### Provider met CLI-terugvaloptie (OpenAI + Whisper CLI)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        maxBytes: 20971520,
        models: [
          { provider: "openai", model: "gpt-4o-transcribe" },
          {
            type: "cli",
            command: "whisper",
            args: ["--model", "base", "{{MediaPath}}"],
            timeoutSeconds: 45,
          },
        ],
      },
    },
  },
}
```

### Alleen provider met bereikbeperking

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        scope: {
          default: "allow",
          rules: [{ action: "deny", match: { chatType: "group" } }],
        },
        models: [{ provider: "openai", model: "gpt-4o-transcribe" }],
      },
    },
  },
}
```

### Alleen provider (Deepgram)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "deepgram", model: "nova-3" }],
      },
    },
  },
}
```

### Alleen provider (Mistral Voxtral)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "mistral", model: "voxtral-mini-latest" }],
      },
    },
  },
}
```

### Alleen provider (SenseAudio)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "senseaudio", model: "senseaudio-asr-pro-1.5-260319" }],
      },
    },
  },
}
```

### Transcript naar de chat terugsturen (optioneel)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        echoTranscript: true, // standaard is false
        echoFormat: '📝 "{transcript}"', // optioneel, ondersteunt {transcript}
        models: [{ provider: "openai", model: "gpt-4o-transcribe" }],
      },
    },
  },
}
```

## Opmerkingen en beperkingen

- Providerauthenticatie volgt de standaardvolgorde voor modelauthenticatie (authenticatieprofielen, omgevingsvariabelen, `models.providers.*.apiKey`).
- Installatiedetails voor Groq: [Groq](/nl/providers/groq).
- Deepgram gebruikt `DEEPGRAM_API_KEY` wanneer `provider: "deepgram"` wordt gebruikt. Installatiedetails: [Deepgram](/nl/providers/deepgram).
- Installatiedetails voor Mistral: [Mistral](/nl/providers/mistral).
- SenseAudio gebruikt `SENSEAUDIO_API_KEY` wanneer `provider: "senseaudio"` wordt gebruikt. Installatiedetails: [SenseAudio](/nl/providers/senseaudio).
- Audioproviders kunnen `baseUrl`, `headers` en `providerOptions` via `tools.media.audio` overschrijven.
- De standaardlimiet voor de grootte is 20 MB (`tools.media.audio.maxBytes`). Te grote audio wordt voor dat model overgeslagen en de volgende vermelding wordt geprobeerd.
- Audiobestanden kleiner dan 1024 bytes worden vóór transcriptie door de provider/CLI overgeslagen.
- De standaardwaarde van `maxChars` voor audio is **niet ingesteld** (volledig transcript). Stel `tools.media.audio.maxChars` of een `maxChars` per vermelding in om de uitvoer in te korten.
- De standaardwaarde voor automatische detectie van OpenAI is `gpt-4o-transcribe`; stel `model: "gpt-4o-mini-transcribe"` in voor een goedkopere/snellere optie.
- Gebruik `tools.media.audio.attachments` om meerdere spraaknotities te verwerken (`mode: "all"` plus `maxAttachments`, standaard 1).
- Het transcript is voor sjablonen beschikbaar als `{{Transcript}}`.
- `tools.media.audio.echoTranscript` is standaard uitgeschakeld; schakel dit in om vóór verwerking door de agent een transcriptbevestiging terug te sturen naar de oorspronkelijke chat.
- `tools.media.audio.echoFormat` past de teruggestuurde tekst aan (tijdelijke aanduiding: `{transcript}`; standaard `📝 "{transcript}"`).
- De standaarduitvoer van de CLI is beperkt tot 5 MB; houd de CLI-uitvoer beknopt.
- CLI-`args` moeten `{{MediaPath}}` gebruiken voor het lokale pad naar het audiobestand. Voer `openclaw doctor --fix` uit om verouderde tijdelijke aanduidingen `{input}` uit oudere configuraties van `audio.transcription.command` te migreren (ingetrokken sleutel: `audio.transcription`, vervangen door `tools.media.audio.models`).
- `tools.media.concurrency` begrenst mediataken; het is geen GPU-planner.

### Permanente lokale spraak-naar-tekst

Automatisch gedetecteerde lokale spraak-naar-tekst blijft voor elke aanvraag een afzonderlijk proces gebruiken. OpenClaw beheert momenteel geen permanente whisper.cpp-server, omdat het standaardpakket `whisper-cpp` van Homebrew die server uitschakelt, terwijl het upstreamvoorbeeld geen geconfigureerde begrensde toelatingswachtrij heeft. Een door een Plugin beheerde permanente levenscyclus vereist een onderhouden, verpakte worker met gezondheids- en opstartcontroles, modelresidentie, begrensde wachtrijen, annulering/time-out, werking zonder authenticatie die uitsluitend via local loopback bereikbaar is, en geen terugval naar de cloud voordat deze veilig kan worden ingeschakeld.

### Ondersteuning voor proxyomgevingen

Providergebaseerde audiotranscriptie respecteert standaardomgevingsvariabelen voor uitgaande proxy's, overeenkomstig de semantiek van `EnvHttpProxyAgent` van undici:

- `HTTPS_PROXY` / `https_proxy`
- `HTTP_PROXY` / `http_proxy`
- `ALL_PROXY` / `all_proxy`

Variabelen in kleine letters hebben voorrang op die in hoofdletters; vermeldingen in `NO_PROXY`/`no_proxy` (hostnamen, `*.suffix` of `host:port`) omzeilen de proxy. Als er geen proxyomgevingsvariabelen zijn ingesteld, wordt een directe uitgaande verbinding gebruikt. Als het instellen van de proxy mislukt (ongeldige URL), registreert OpenClaw een waarschuwing en valt het terug op rechtstreeks ophalen.

## Vermeldingsdetectie in groepen

Op kanalen die een audiovoorcontrole ondersteunen, transcribeert OpenClaw audio **voordat** het op vermeldingen controleert wanneer `requireMention: true` voor een groepschat is ingesteld. Hierdoor kan een spraaknotitie zonder bijschrift de vermeldingscontrole doorstaan wanneer het transcript een geconfigureerd vermeldingspatroon bevat. Kanaalspecifieke documentatie beschrijft transporten die in plaats daarvan een getypte vermelding vereisen.

**Zo werkt het:**

1. Als een spraakbericht geen tekst bevat en de groep vermeldingen vereist, voert OpenClaw een voorcontroletranscriptie uit op de eerste audiobijlage.
2. Het transcript wordt gecontroleerd op vermeldingspatronen (bijvoorbeeld `@BotName`, emoji-triggers).
3. Als een vermelding wordt gevonden, doorloopt het bericht de volledige antwoordpijplijn.

**Terugvalgedrag:** als de voorcontroletranscriptie mislukt (time-out, API-fout enzovoort), valt het bericht terug op vermeldingsdetectie op basis van alleen tekst, zodat gemengde berichten (tekst + audio) nooit verloren gaan.

**Uitschakelen per Telegram-groep/-onderwerp:**

- Stel `channels.telegram.groups.<chatId>.disableAudioPreflight: true` in om vermeldingscontroles via voorcontroletranscriptie voor die groep over te slaan.
- Stel `channels.telegram.groups.<chatId>.topics.<threadId>.disableAudioPreflight` in om dit per onderwerp te overschrijven (`true` om over te slaan, `false` om geforceerd in te schakelen).
- De standaardwaarde is `false` (voorcontrole ingeschakeld wanneer aan de voorwaarden voor verplichte vermeldingen wordt voldaan).

**Voorbeeld:** een gebruiker stuurt in een Telegram-groep met `requireMention: true` een spraaknotitie waarin diegene zegt: "Hé @Claude, wat voor weer is het?" De spraaknotitie wordt getranscribeerd, de vermelding wordt gedetecteerd en de agent antwoordt.

## Aandachtspunten

- Bereikregels gebruiken de eerste overeenkomst; `chatType` wordt genormaliseerd naar `direct`, `group` of `channel`.
- Zorg ervoor dat uw CLI afsluit met code 0 en platte tekst afdrukt; JSON-uitvoer moet worden bewerkt met `jq -r .text`.
- Bekende bestandsuitvoermodi zijn gezaghebbend: een leeg of ontbrekend afgeleid transcriptbestand levert geen transcript op in plaats van terug te vallen op voortgangsuitvoer van de CLI.
- Gebruik voor `parakeet-mlx` `--output-format txt` (of `all`) met `--output-dir` en de standaarduitvoersjabloon `{filename}`. De upstream-omgevingsvariabelen `PARAKEET_OUTPUT_FORMAT` en `PARAKEET_OUTPUT_TEMPLATE` worden eveneens gerespecteerd. OpenClaw leest `<output-dir>/<media-basename>.txt`; de standaardindeling `srt`, andere indelingen en aangepaste uitvoersjablonen blijven de standaarduitvoer gebruiken.
- Houd time-outs redelijk (`timeoutSeconds`, standaard 60 s) om blokkering van de antwoordwachtrij te voorkomen.
- Voorcontroletranscriptie verwerkt alleen de **eerste** audiobijlage voor vermeldingsdetectie. Aanvullende audiobijlagen worden tijdens de hoofdfase voor mediabegrip verwerkt.

## Gerelateerd

- [Mediabegrip](/nl/nodes/media-understanding)
- [Gespreksmodus](/nl/nodes/talk)
- [Spraakactivering](/nl/nodes/voicewake)
