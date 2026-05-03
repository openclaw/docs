---
read_when:
    - Audiotranscriptie of mediaverwerking wijzigen
summary: Hoe inkomende audio-/spraakberichten worden gedownload, getranscribeerd en in antwoorden worden ingevoegd
title: Audio en spraaknotities
x-i18n:
    generated_at: "2026-05-03T11:11:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 35074d79104f767ee252064462202a8ec21ac26f6db25c39e67f31f6b40edeb7
    source_path: nodes/audio.md
    workflow: 16
---

# Audio / Spraaknotities (2026-01-17)

## Wat werkt

- **Mediabegrip (audio)**: Als audiobegrip is ingeschakeld (of automatisch gedetecteerd), doet OpenClaw het volgende:
  1. Vindt de eerste audiobijlage (lokaal pad of URL) en downloadt die indien nodig.
  2. Dwingt `maxBytes` af voordat naar elke modelvermelding wordt verzonden.
  3. Voert de eerste geschikte modelvermelding in volgorde uit (provider of CLI).
  4. Als dit mislukt of wordt overgeslagen (grootte/time-out), probeert het de volgende vermelding.
  5. Bij succes vervangt het `Body` door een `[Audio]`-blok en stelt het `{{Transcript}}` in.
- **Commandoparsing**: Wanneer transcriptie slaagt, worden `CommandBody`/`RawBody` ingesteld op het transcript, zodat slash-commando's blijven werken.
- **Uitgebreide logging**: In `--verbose` loggen we wanneer transcriptie wordt uitgevoerd en wanneer die de body vervangt.

## Automatische detectie (standaard)

Als je **geen modellen configureert** en `tools.media.audio.enabled` **niet** is ingesteld op `false`,
detecteert OpenClaw automatisch in deze volgorde en stopt het bij de eerste werkende optie:

1. **Actief antwoordmodel** wanneer de provider audiobegrip ondersteunt.
2. **Lokale CLI's** (indien geinstalleerd)
   - `sherpa-onnx-offline` (vereist `SHERPA_ONNX_MODEL_DIR` met encoder/decoder/joiner/tokens)
   - `whisper-cli` (van `whisper-cpp`; gebruikt `WHISPER_CPP_MODEL` of het meegeleverde tiny-model)
   - `whisper` (Python-CLI; downloadt modellen automatisch)
3. **Gemini CLI** (`gemini`) met `read_many_files`
4. **Provider-authenticatie**
   - Geconfigureerde `models.providers.*`-vermeldingen die audio ondersteunen, worden eerst geprobeerd
   - Meegeleverde fallbackvolgorde: OpenAI → Groq → xAI → Deepgram → Google → SenseAudio → ElevenLabs → Mistral

Stel `tools.media.audio.enabled: false` in om automatische detectie uit te schakelen.
Stel `tools.media.audio.models` in om dit aan te passen.
Opmerking: binaire detectie is best-effort op macOS/Linux/Windows; zorg dat de CLI op `PATH` staat (we breiden `~` uit), of stel een expliciet CLI-model in met een volledig commandopad.

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

### Alleen provider met scope-gating

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

### Transcript naar chat echoen (opt-in)

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

## Opmerkingen en limieten

- Provider-authenticatie volgt de standaardvolgorde voor modelauthenticatie (auth-profielen, env vars, `models.providers.*.apiKey`).
- Installatiedetails voor Groq: [Groq](/nl/providers/groq).
- Deepgram pikt `DEEPGRAM_API_KEY` op wanneer `provider: "deepgram"` wordt gebruikt.
- Installatiedetails voor Deepgram: [Deepgram (audiotranscriptie)](/nl/providers/deepgram).
- Installatiedetails voor Mistral: [Mistral](/nl/providers/mistral).
- SenseAudio pikt `SENSEAUDIO_API_KEY` op wanneer `provider: "senseaudio"` wordt gebruikt.
- Installatiedetails voor SenseAudio: [SenseAudio](/nl/providers/senseaudio).
- Audioproviders kunnen `baseUrl`, `headers` en `providerOptions` overschrijven via `tools.media.audio`.
- De standaardgroottelimiet is 20MB (`tools.media.audio.maxBytes`). Te grote audio wordt voor dat model overgeslagen en de volgende vermelding wordt geprobeerd.
- Zeer kleine/lege audiobestanden onder 1024 bytes worden overgeslagen voordat provider-/CLI-transcriptie wordt uitgevoerd.
- Standaard is `maxChars` voor audio **niet ingesteld** (volledig transcript). Stel `tools.media.audio.maxChars` of `maxChars` per vermelding in om de uitvoer in te korten.
- De automatische standaard voor OpenAI is `gpt-4o-mini-transcribe`; stel `model: "gpt-4o-transcribe"` in voor hogere nauwkeurigheid.
- Gebruik `tools.media.audio.attachments` om meerdere spraaknotities te verwerken (`mode: "all"` + `maxAttachments`).
- Transcript is beschikbaar voor sjablonen als `{{Transcript}}`.
- `tools.media.audio.echoTranscript` staat standaard uit; schakel dit in om een transcriptbevestiging terug te sturen naar de oorspronkelijke chat voordat agentverwerking begint.
- `tools.media.audio.echoFormat` past de echo-tekst aan (placeholder: `{transcript}`).
- CLI-stdout is begrensd (5MB); houd CLI-uitvoer beknopt.
- CLI-`args` moeten `{{MediaPath}}` gebruiken voor het lokale audiobestandspad. Voer `openclaw doctor --fix` uit om verouderde `{input}`-placeholders uit oudere `audio.transcription.command`-configuraties te migreren.

### Ondersteuning voor proxy-omgeving

Op providers gebaseerde audiotranscriptie respecteert standaard env vars voor uitgaande proxy's:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `ALL_PROXY`
- `https_proxy`
- `http_proxy`
- `all_proxy`

Als er geen proxy-env vars zijn ingesteld, wordt directe egress gebruikt. Als de proxyconfiguratie ongeldig is, logt OpenClaw een waarschuwing en valt het terug op direct ophalen.

## Vermeldingsdetectie in groepen

Wanneer `requireMention: true` is ingesteld voor een groepschat, transcribeert OpenClaw audio nu **voordat** er op vermeldingen wordt gecontroleerd. Hierdoor kunnen spraaknotities worden verwerkt, zelfs wanneer ze vermeldingen bevatten.

**Hoe het werkt:**

1. Als een spraakbericht geen tekstbody heeft en de groep vermeldingen vereist, voert OpenClaw een "preflight"-transcriptie uit.
2. Het transcript wordt gecontroleerd op vermeldingspatronen (bijv. `@BotName`, emoji-triggers).
3. Als een vermelding wordt gevonden, gaat het bericht door de volledige antwoordpipeline.
4. Het transcript wordt gebruikt voor vermeldingsdetectie, zodat spraaknotities door de vermeldingspoort kunnen komen.

**Fallbackgedrag:**

- Als transcriptie tijdens preflight mislukt (time-out, API-fout, enz.), wordt het bericht verwerkt op basis van alleen tekstgebaseerde vermeldingsdetectie.
- Dit zorgt ervoor dat gemengde berichten (tekst + audio) nooit onterecht worden weggegooid.

**Opt-out per Telegram-groep/onderwerp:**

- Stel `channels.telegram.groups.<chatId>.disableAudioPreflight: true` in om preflight-controles op transcriptvermeldingen voor die groep over te slaan.
- Stel `channels.telegram.groups.<chatId>.topics.<threadId>.disableAudioPreflight` in om dit per onderwerp te overschrijven (`true` om over te slaan, `false` om geforceerd in te schakelen).
- Standaard is `false` (preflight ingeschakeld wanneer aan de voorwaarden voor vermeldingsgating wordt voldaan).

**Voorbeeld:** Een gebruiker stuurt een spraaknotitie met "Hey @Claude, what's the weather?" in een Telegram-groep met `requireMention: true`. De spraaknotitie wordt getranscribeerd, de vermelding wordt gedetecteerd en de agent antwoordt.

## Aandachtspunten

- Scoperegels gebruiken first-match wins. `chatType` wordt genormaliseerd naar `direct`, `group` of `room`.
- Zorg dat je CLI afsluit met 0 en platte tekst print; JSON moet worden bewerkt via `jq -r .text`.
- Voor `parakeet-mlx`: als je `--output-dir` doorgeeft, leest OpenClaw `<output-dir>/<media-basename>.txt` wanneer `--output-format` `txt` is (of is weggelaten); niet-`txt`-uitvoerformaten vallen terug op stdout-parsing.
- Houd time-outs redelijk (`timeoutSeconds`, standaard 60s) om te voorkomen dat de antwoordwachtrij wordt geblokkeerd.
- Preflight-transcriptie verwerkt alleen de **eerste** audiobijlage voor vermeldingsdetectie. Aanvullende audio wordt verwerkt tijdens de hoofdmediabegripsfase.

## Gerelateerd

- [Mediabegrip](/nl/nodes/media-understanding)
- [Praatmodus](/nl/nodes/talk)
- [Spraakactivering](/nl/nodes/voicewake)
