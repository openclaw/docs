---
read_when:
    - Audio-transcriptie of mediaverwerking wijzigen
summary: Hoe inkomende audio-/spraakberichten worden gedownload, getranscribeerd en in antwoorden worden ingevoegd
title: Audio en spraaknotities
x-i18n:
    generated_at: "2026-05-06T09:21:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 520620da5a643bb8e17318d7304ae4be3bd2586b0866614ad741685de5b8ef05
    source_path: nodes/audio.md
    workflow: 16
---

# Audio / spraaknotities (2026-01-17)

## Wat werkt

- **Media-inzicht (audio)**: Als audio-inzicht is ingeschakeld (of automatisch wordt gedetecteerd), doet OpenClaw het volgende:
  1. Vindt de eerste audiobijlage (lokaal pad of URL) en downloadt die indien nodig.
  2. Dwingt `maxBytes` af voordat er naar elk modelitem wordt verzonden.
  3. Voert het eerste geschikte modelitem op volgorde uit (provider of CLI).
  4. Als dit mislukt of wordt overgeslagen (grootte/time-out), probeert het het volgende item.
  5. Bij succes vervangt het `Body` door een `[Audio]`-blok en stelt het `{{Transcript}}` in.
- **Commandoparsing**: Wanneer transcriptie slaagt, worden `CommandBody`/`RawBody` ingesteld op het transcript, zodat slashcommando's blijven werken.
- **Uitgebreide logging**: In `--verbose` loggen we wanneer transcriptie wordt uitgevoerd en wanneer die de body vervangt.

## Automatische detectie (standaard)

Als je **geen modellen configureert** en `tools.media.audio.enabled` **niet** is ingesteld op `false`,
detecteert OpenClaw automatisch in deze volgorde en stopt het bij de eerste werkende optie:

1. **Actief antwoordmodel** wanneer de provider audio-inzicht ondersteunt.
2. **Lokale CLI's** (als ze zijn geïnstalleerd)
   - `sherpa-onnx-offline` (vereist `SHERPA_ONNX_MODEL_DIR` met encoder/decoder/joiner/tokens)
   - `whisper-cli` (van `whisper-cpp`; gebruikt `WHISPER_CPP_MODEL` of het meegeleverde tiny-model)
   - `whisper` (Python-CLI; downloadt modellen automatisch)
3. **Gemini-CLI** (`gemini`) met `read_many_files`
4. **Providerauthenticatie**
   - Geconfigureerde `models.providers.*`-items die audio ondersteunen worden eerst geprobeerd
   - Meegeleverde fallbackvolgorde: OpenAI → Groq → xAI → Deepgram → Google → SenseAudio → ElevenLabs → Mistral

Stel `tools.media.audio.enabled: false` in om automatische detectie uit te schakelen.
Stel `tools.media.audio.models` in om aan te passen.
Opmerking: Binaire detectie is best-effort op macOS/Linux/Windows; zorg dat de CLI op `PATH` staat (we breiden `~` uit), of stel een expliciet CLI-model in met een volledig commandopad.

## Configuratievoorbeelden

### Provider + CLI-fallback (OpenAI + Whisper-CLI)

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

### Transcript naar chat echoën (opt-in)

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

- Providerauthenticatie volgt de standaardvolgorde voor modelauthenticatie (auth-profielen, env-vars, `models.providers.*.apiKey`).
- Groq-installatiedetails: [Groq](/nl/providers/groq).
- Deepgram pikt `DEEPGRAM_API_KEY` op wanneer `provider: "deepgram"` wordt gebruikt.
- Deepgram-installatiedetails: [Deepgram (audiotranscriptie)](/nl/providers/deepgram).
- Mistral-installatiedetails: [Mistral](/nl/providers/mistral).
- SenseAudio pikt `SENSEAUDIO_API_KEY` op wanneer `provider: "senseaudio"` wordt gebruikt.
- SenseAudio-installatiedetails: [SenseAudio](/nl/providers/senseaudio).
- Audioproviders kunnen `baseUrl`, `headers` en `providerOptions` overschrijven via `tools.media.audio`.
- De standaardgroottelimiet is 20MB (`tools.media.audio.maxBytes`). Te grote audio wordt voor dat model overgeslagen en het volgende item wordt geprobeerd.
- Tiny/lege audiobestanden kleiner dan 1024 bytes worden overgeslagen vóór provider-/CLI-transcriptie.
- De standaardwaarde voor `maxChars` voor audio is **niet ingesteld** (volledig transcript). Stel `tools.media.audio.maxChars` of `maxChars` per item in om uitvoer in te korten.
- De automatische standaard voor OpenAI is `gpt-4o-mini-transcribe`; stel `model: "gpt-4o-transcribe"` in voor hogere nauwkeurigheid.
- Gebruik `tools.media.audio.attachments` om meerdere spraaknotities te verwerken (`mode: "all"` + `maxAttachments`).
- Transcript is beschikbaar voor templates als `{{Transcript}}`.
- `tools.media.audio.echoTranscript` staat standaard uit; schakel dit in om transcriptbevestiging terug te sturen naar de oorspronkelijke chat voordat de agent wordt verwerkt.
- `tools.media.audio.echoFormat` past de echotekst aan (placeholder: `{transcript}`).
- CLI-stdout is begrensd (5MB); houd CLI-uitvoer beknopt.
- CLI-`args` moeten `{{MediaPath}}` gebruiken voor het lokale audiobestandspad. Voer `openclaw doctor --fix` uit om verouderde `{input}`-placeholders uit oudere `audio.transcription.command`-configuraties te migreren.

### Ondersteuning voor proxy-omgeving

Providergebaseerde audiotranscriptie respecteert standaard uitgaande proxy-env-vars:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `ALL_PROXY`
- `https_proxy`
- `http_proxy`
- `all_proxy`

Als er geen proxy-env-vars zijn ingesteld, wordt directe egress gebruikt. Als de proxyconfiguratie onjuist is gevormd, logt OpenClaw een waarschuwing en valt het terug op direct ophalen.

## Mention-detectie in groepen

Wanneer `requireMention: true` is ingesteld voor een groepschat, transcribeert OpenClaw audio nu **voordat** op mentions wordt gecontroleerd. Daardoor kunnen spraaknotities worden verwerkt, zelfs wanneer ze mentions bevatten.

**Hoe het werkt:**

1. Als een spraakbericht geen tekstbody heeft en de groep mentions vereist, voert OpenClaw een "preflight"-transcriptie uit.
2. Het transcript wordt gecontroleerd op mention-patronen (bijv. `@BotName`, emoji-triggers).
3. Als er een mention wordt gevonden, gaat het bericht door de volledige antwoordpipeline.
4. Het transcript wordt gebruikt voor mention-detectie, zodat spraaknotities door de mention-gate kunnen komen.

**Fallbackgedrag:**

- Als transcriptie tijdens preflight mislukt (time-out, API-fout, enz.), wordt het bericht verwerkt op basis van detectie van mentions in alleen tekst.
- Dit zorgt ervoor dat gemengde berichten (tekst + audio) nooit ten onrechte worden genegeerd.

**Opt-out per Telegram-groep/topic:**

- Stel `channels.telegram.groups.<chatId>.disableAudioPreflight: true` in om preflight-transcriptcontroles op mentions voor die groep over te slaan.
- Stel `channels.telegram.groups.<chatId>.topics.<threadId>.disableAudioPreflight` in om per topic te overschrijven (`true` om over te slaan, `false` om geforceerd in te schakelen).
- De standaardwaarde is `false` (preflight ingeschakeld wanneer aan mention-gated voorwaarden wordt voldaan).

**Voorbeeld:** Een gebruiker stuurt een spraaknotitie met "Hey @Claude, wat is het weer?" in een Telegram-groep met `requireMention: true`. De spraaknotitie wordt getranscribeerd, de mention wordt gedetecteerd en de agent antwoordt.

## Aandachtspunten

- Scoperegels gebruiken first-match wins. `chatType` wordt genormaliseerd naar `direct`, `group` of `room`.
- Zorg dat je CLI afsluit met 0 en platte tekst print; JSON moet worden aangepast via `jq -r .text`.
- Voor `parakeet-mlx` geldt: als je `--output-dir` doorgeeft, leest OpenClaw `<output-dir>/<media-basename>.txt` wanneer `--output-format` `txt` is (of is weggelaten); niet-`txt`-uitvoerformaten vallen terug op stdout-parsing.
- Houd time-outs redelijk (`timeoutSeconds`, standaard 60s) om te voorkomen dat de antwoordwachtrij wordt geblokkeerd.
- Preflight-transcriptie verwerkt alleen de **eerste** audiobijlage voor mention-detectie. Extra audio wordt verwerkt tijdens de hoofdmedia-inzichtfase.

## Gerelateerd

- [Media-inzicht](/nl/nodes/media-understanding)
- [Praatmodus](/nl/nodes/talk)
- [Voice wake](/nl/nodes/voicewake)
