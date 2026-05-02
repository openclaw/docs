---
read_when:
    - Audio-transcriptie of mediaverwerking wijzigen
summary: Hoe inkomende audio-/spraakberichten worden gedownload, getranscribeerd en in antwoorden worden ingevoegd
title: Audio en spraaknotities
x-i18n:
    generated_at: "2026-05-02T23:38:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 91cd6951f80c6137061a7d4e82415b0872bc92c6d6ad136273a2e9ad7ec00ac1
    source_path: nodes/audio.md
    workflow: 16
---

# Audio / spraakberichten (2026-01-17)

## Wat werkt

- **Mediabegrip (audio)**: Als audiobegrip is ingeschakeld (of automatisch is gedetecteerd), doet OpenClaw het volgende:
  1. Het zoekt de eerste audiobijlage (lokaal pad of URL) en downloadt die indien nodig.
  2. Het handhaaft `maxBytes` voordat er naar elke modelvermelding wordt verzonden.
  3. Het voert de eerste geschikte modelvermelding in volgorde uit (provider of CLI).
  4. Als die faalt of wordt overgeslagen (grootte/time-out), probeert het de volgende vermelding.
  5. Bij succes vervangt het `Body` door een `[Audio]`-blok en stelt het `{{Transcript}}` in.
- **Commandoparsing**: Wanneer transcriptie slaagt, worden `CommandBody`/`RawBody` ingesteld op het transcript, zodat slash-commando's blijven werken.
- **Uitgebreide logging**: In `--verbose` loggen we wanneer transcriptie wordt uitgevoerd en wanneer die de body vervangt.
- **Dictatie in de bedienings-UI**: De chatcomposer kan een met de browser opgenomen microfoonclip naar `chat.transcribeAudio` sturen. Die Gateway-RPC schrijft de clip naar een tijdelijk lokaal bestand, voert dezelfde audiotranscriptiepijplijn uit, retourneert concepttekst naar de browser en verwijdert het tijdelijke bestand. Dit maakt zelf geen agent-run aan.

## Automatische detectie (standaard)

Als je **geen modellen configureert** en `tools.media.audio.enabled` **niet** is ingesteld op `false`,
detecteert OpenClaw automatisch in deze volgorde en stopt het bij de eerste werkende optie:

1. **Actief antwoordmodel** wanneer de provider audiobegrip ondersteunt.
2. **Lokale CLI's** (indien geïnstalleerd)
   - `sherpa-onnx-offline` (vereist `SHERPA_ONNX_MODEL_DIR` met encoder/decoder/joiner/tokens)
   - `whisper-cli` (van `whisper-cpp`; gebruikt `WHISPER_CPP_MODEL` of het meegeleverde tiny-model)
   - `whisper` (Python-CLI; downloadt modellen automatisch)
3. **Gemini CLI** (`gemini`) met `read_many_files`
4. **Providerauthenticatie**
   - Geconfigureerde `models.providers.*`-vermeldingen die audio ondersteunen, worden eerst geprobeerd
   - Meegeleverde fallbackvolgorde: OpenAI → Groq → xAI → Deepgram → Google → SenseAudio → ElevenLabs → Mistral

Stel `tools.media.audio.enabled: false` in om automatische detectie uit te schakelen.
Stel `tools.media.audio.models` in om dit aan te passen.
Opmerking: detectie van binaries is best-effort op macOS/Linux/Windows; zorg dat de CLI op `PATH` staat (we breiden `~` uit), of stel een expliciet CLI-model in met een volledig commandopad.

## Configuratievoorbeelden

### Provider + CLI-fallback (OpenAI + Whisper CLI)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        maxBytes: 20971520,
        models: [
          { provider: "openai", model: "gpt-4o-mini-transcribe" },
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

### Alleen provider met scope-afbakening

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
        models: [{ provider: "openai", model: "gpt-4o-mini-transcribe" }],
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

### Transcript terugsturen naar chat (opt-in)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        echoTranscript: true, // default is false
        echoFormat: '📝 "{transcript}"', // optional, supports {transcript}
        models: [{ provider: "openai", model: "gpt-4o-mini-transcribe" }],
      },
    },
  },
}
```

## Opmerkingen en beperkingen

- Providerauthenticatie volgt de standaardvolgorde voor modelauthenticatie (auth-profielen, env vars, `models.providers.*.apiKey`).
- Groq-installatiedetails: [Groq](/nl/providers/groq).
- Deepgram pikt `DEEPGRAM_API_KEY` op wanneer `provider: "deepgram"` wordt gebruikt.
- Deepgram-installatiedetails: [Deepgram (audiotranscriptie)](/nl/providers/deepgram).
- Mistral-installatiedetails: [Mistral](/nl/providers/mistral).
- SenseAudio pikt `SENSEAUDIO_API_KEY` op wanneer `provider: "senseaudio"` wordt gebruikt.
- SenseAudio-installatiedetails: [SenseAudio](/nl/providers/senseaudio).
- Audioproviders kunnen `baseUrl`, `headers` en `providerOptions` overschrijven via `tools.media.audio`.
- De standaardgroottelimiet is 20MB (`tools.media.audio.maxBytes`). Te grote audio wordt voor dat model overgeslagen en de volgende vermelding wordt geprobeerd.
- Zeer kleine/lege audiobestanden onder 1024 bytes worden overgeslagen vóór provider-/CLI-transcriptie.
- Standaard is `maxChars` voor audio **niet ingesteld** (volledig transcript). Stel `tools.media.audio.maxChars` of per vermelding `maxChars` in om uitvoer in te korten.
- OpenAI automatische standaard is `gpt-4o-mini-transcribe`; stel `model: "gpt-4o-transcribe"` in voor hogere nauwkeurigheid.
- Gebruik `tools.media.audio.attachments` om meerdere spraakberichten te verwerken (`mode: "all"` + `maxAttachments`).
- Het transcript is beschikbaar voor templates als `{{Transcript}}`.
- `tools.media.audio.echoTranscript` staat standaard uit; schakel dit in om vóór agentverwerking een transcriptbevestiging terug te sturen naar de oorspronkelijke chat.
- `tools.media.audio.echoFormat` past de echotekst aan (placeholder: `{transcript}`).
- CLI-stdout is afgekapt (5MB); houd CLI-uitvoer beknopt.
- CLI-`args` moeten `{{MediaPath}}` gebruiken voor het lokale audiobestandspad. Voer `openclaw doctor --fix` uit om verouderde `{input}`-placeholders uit oudere `audio.transcription.command`-configs te migreren.

### Ondersteuning voor proxy-omgeving

Op provider gebaseerde audiotranscriptie respecteert standaard env vars voor uitgaande proxy's:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `ALL_PROXY`
- `https_proxy`
- `http_proxy`
- `all_proxy`

Als er geen proxy-env vars zijn ingesteld, wordt directe egress gebruikt. Als de proxyconfiguratie ongeldig is, logt OpenClaw een waarschuwing en valt het terug op direct ophalen.

## Detectie van vermeldingen in groepen

Wanneer `requireMention: true` is ingesteld voor een groepschat, transcribeert OpenClaw audio nu **voordat** er op vermeldingen wordt gecontroleerd. Hierdoor kunnen spraakberichten worden verwerkt, zelfs wanneer ze vermeldingen bevatten.

**Zo werkt het:**

1. Als een spraakbericht geen tekstbody heeft en de groep vermeldingen vereist, voert OpenClaw een "preflight"-transcriptie uit.
2. Het transcript wordt gecontroleerd op vermeldingspatronen (bijv. `@BotName`, emoji-triggers).
3. Als een vermelding wordt gevonden, gaat het bericht door de volledige antwoordpijplijn.
4. Het transcript wordt gebruikt voor vermeldingsdetectie, zodat spraakberichten de vermeldingspoort kunnen passeren.

**Fallbackgedrag:**

- Als transcriptie tijdens preflight mislukt (time-out, API-fout, enz.), wordt het bericht verwerkt op basis van vermeldingsdetectie met alleen tekst.
- Dit zorgt ervoor dat gemengde berichten (tekst + audio) nooit onterecht worden genegeerd.

**Opt-out per Telegram-groep/-topic:**

- Stel `channels.telegram.groups.<chatId>.disableAudioPreflight: true` in om preflight-transcriptcontroles op vermeldingen voor die groep over te slaan.
- Stel `channels.telegram.groups.<chatId>.topics.<threadId>.disableAudioPreflight` in om dit per topic te overschrijven (`true` om over te slaan, `false` om geforceerd in te schakelen).
- Standaard is `false` (preflight ingeschakeld wanneer aan de voorwaarden voor vermeldingafbakening wordt voldaan).

**Voorbeeld:** Een gebruiker stuurt een spraakbericht met "Hey @Claude, what's the weather?" in een Telegram-groep met `requireMention: true`. Het spraakbericht wordt getranscribeerd, de vermelding wordt gedetecteerd en de agent antwoordt.

## Valkuilen

- Scoperegels gebruiken first-match wins. `chatType` wordt genormaliseerd naar `direct`, `group` of `room`.
- Zorg dat je CLI eindigt met 0 en platte tekst afdrukt; JSON moet worden aangepast via `jq -r .text`.
- Voor `parakeet-mlx`: als je `--output-dir` doorgeeft, leest OpenClaw `<output-dir>/<media-basename>.txt` wanneer `--output-format` `txt` is (of is weggelaten); niet-`txt`-uitvoerformaten vallen terug op stdout-parsing.
- Houd time-outs redelijk (`timeoutSeconds`, standaard 60s) om blokkering van de antwoordwachtrij te voorkomen.
- Preflight-transcriptie verwerkt alleen de **eerste** audiobijlage voor vermeldingsdetectie. Extra audio wordt verwerkt tijdens de hoofdfase voor mediabegrip.

## Gerelateerd

- [Mediabegrip](/nl/nodes/media-understanding)
- [Praatmodus](/nl/nodes/talk)
- [Spraakwake](/nl/nodes/voicewake)
