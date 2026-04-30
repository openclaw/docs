---
read_when:
    - Włączanie syntezy mowy dla odpowiedzi
    - Konfigurowanie dostawcy TTS, łańcucha awaryjnego lub persony
    - Używanie poleceń /tts lub dyrektyw
sidebarTitle: Text to speech (TTS)
summary: Zamiana tekstu na mowę dla odpowiedzi wychodzących — dostawcy, persony, polecenia ukośnikowe i dane wyjściowe dla poszczególnych kanałów
title: Zamiana tekstu na mowę
x-i18n:
    generated_at: "2026-04-30T10:24:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: ec58d19fbca0ff0cd9828f32c150123cad22f053a6b4281ed40ec3d1fa41d1b2
    source_path: tools/tts.md
    workflow: 16
---

OpenClaw może konwertować wychodzące odpowiedzi na dźwięk u **14 dostawców mowy**
i dostarczać natywne wiadomości głosowe w Feishu, Matrix, Telegram i WhatsApp,
załączniki audio wszędzie indziej oraz strumienie PCM/Ulaw dla telefonii i Talk.

## Szybki start

<Steps>
  <Step title="Wybierz dostawcę">
    OpenAI i ElevenLabs to najbardziej niezawodne opcje hostowane. Microsoft i
    Local CLI działają bez klucza API. Pełna lista znajduje się w [macierzy dostawców](#supported-providers).
  </Step>
  <Step title="Ustaw klucz API">
    Wyeksportuj zmienną środowiskową dla swojego dostawcy (na przykład `OPENAI_API_KEY`,
    `ELEVENLABS_API_KEY`). Microsoft i Local CLI nie wymagają klucza.
  </Step>
  <Step title="Włącz w konfiguracji">
    Ustaw `messages.tts.auto: "always"` i `messages.tts.provider`:

    ```json5
    {
      messages: {
        tts: {
          auto: "always",
          provider: "elevenlabs",
        },
      },
    }
    ```

  </Step>
  <Step title="Wypróbuj na czacie">
    `/tts status` pokazuje bieżący stan. `/tts audio Hello from OpenClaw`
    wysyła jednorazową odpowiedź audio.
  </Step>
</Steps>

<Note>
Auto-TTS jest domyślnie **wyłączone**. Gdy `messages.tts.provider` nie jest ustawione,
OpenClaw wybiera pierwszego skonfigurowanego dostawcę zgodnie z kolejnością automatycznego wyboru w rejestrze.
</Note>

## Obsługiwani dostawcy

| Dostawca          | Uwierzytelnianie                                                                                                 | Uwagi                                                                   |
| ----------------- | ---------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| **Azure Speech**  | `AZURE_SPEECH_KEY` + `AZURE_SPEECH_REGION` (także `AZURE_SPEECH_API_KEY`, `SPEECH_KEY`, `SPEECH_REGION`)          | Natywne wyjście notatek głosowych Ogg/Opus i telefonia.                 |
| **DeepInfra**     | `DEEPINFRA_API_KEY`                                                                                              | TTS zgodne z OpenAI. Domyślnie `hexgrad/Kokoro-82M`.                    |
| **ElevenLabs**    | `ELEVENLABS_API_KEY` lub `XI_API_KEY`                                                                            | Klonowanie głosu, wielojęzyczność, deterministyczność przez `seed`.     |
| **Google Gemini** | `GEMINI_API_KEY` lub `GOOGLE_API_KEY`                                                                            | TTS API Gemini; uwzględnia personę przez `promptTemplate: "audio-profile-v1"`. |
| **Gradium**       | `GRADIUM_API_KEY`                                                                                                | Wyjście notatek głosowych i telefonii.                                  |
| **Inworld**       | `INWORLD_API_KEY`                                                                                                | API TTS ze strumieniowaniem. Natywne notatki głosowe Opus i telefonia PCM. |
| **Local CLI**     | brak                                                                                                             | Uruchamia skonfigurowane lokalne polecenie TTS.                         |
| **Microsoft**     | brak                                                                                                             | Publiczny neuronowy TTS Edge przez `node-edge-tts`. Najlepsze starania, bez SLA. |
| **MiniMax**       | `MINIMAX_API_KEY` (lub Token Plan: `MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`)      | API T2A v2. Domyślnie `speech-2.8-hd`.                                  |
| **OpenAI**        | `OPENAI_API_KEY`                                                                                                 | Używane także do automatycznego podsumowania; obsługuje personę `instructions`. |
| **OpenRouter**    | `OPENROUTER_API_KEY` (może ponownie użyć `models.providers.openrouter.apiKey`)                                   | Model domyślny `hexgrad/kokoro-82m`.                                    |
| **Volcengine**    | `VOLCENGINE_TTS_API_KEY` lub `BYTEPLUS_SEED_SPEECH_API_KEY` (starsze AppID/token: `VOLCENGINE_TTS_APPID`/`_TOKEN`) | API HTTP BytePlus Seed Speech.                                          |
| **Vydra**         | `VYDRA_API_KEY`                                                                                                  | Wspólny dostawca obrazów, wideo i mowy.                                 |
| **xAI**           | `XAI_API_KEY`                                                                                                    | Wsadowy TTS xAI. Natywna notatka głosowa Opus **nie** jest obsługiwana. |
| **Xiaomi MiMo**   | `XIAOMI_API_KEY`                                                                                                 | TTS MiMo przez uzupełnienia czatu Xiaomi.                               |

Jeśli skonfigurowano wielu dostawców, wybrany dostawca jest używany jako pierwszy, a
pozostali służą jako opcje awaryjne. Automatyczne podsumowanie używa `summaryModel` (lub
`agents.defaults.model.primary`), więc ten dostawca również musi być uwierzytelniony,
jeśli podsumowania pozostają włączone.

<Warning>
Dołączony provider **Microsoft** korzysta z internetowej usługi neuronowego TTS Microsoft Edge
przez `node-edge-tts`. Jest to publiczna usługa webowa bez opublikowanego
SLA ani limitu — traktuj ją jako usługę typu best-effort. Starszy identyfikator providera `edge` jest
normalizowany do `microsoft`, a `openclaw doctor --fix` przepisuje utrwaloną
konfigurację; nowe konfiguracje powinny zawsze używać `microsoft`.
</Warning>

## Konfiguracja

Konfiguracja TTS znajduje się pod `messages.tts` w `~/.openclaw/openclaw.json`. Wybierz
preset i dostosuj blok providera:

<Tabs>
  <Tab title="Azure Speech">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "azure-speech",
      providers: {
        "azure-speech": {
          apiKey: "${AZURE_SPEECH_KEY}",
          region: "eastus",
          voice: "en-US-JennyNeural",
          lang: "en-US",
          outputFormat: "audio-24khz-48kbitrate-mono-mp3",
          voiceNoteOutputFormat: "ogg-24khz-16bit-mono-opus",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="ElevenLabs">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "elevenlabs",
      providers: {
        elevenlabs: {
          apiKey: "${ELEVENLABS_API_KEY}",
          model: "eleven_multilingual_v2",
          voiceId: "EXAVITQu4vr4xnSDxMaL",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="Google Gemini">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "google",
      providers: {
        google: {
          apiKey: "${GEMINI_API_KEY}",
          model: "gemini-3.1-flash-tts-preview",
          voiceName: "Kore",
          // Optional natural-language style prompts:
          // audioProfile: "Speak in a calm, podcast-host tone.",
          // speakerName: "Alex",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="Gradium">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "gradium",
      providers: {
        gradium: {
          apiKey: "${GRADIUM_API_KEY}",
          voiceId: "YTpq7expH9539ERJ",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="Inworld">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "inworld",
      providers: {
        inworld: {
          apiKey: "${INWORLD_API_KEY}",
          modelId: "inworld-tts-1.5-max",
          voiceId: "Sarah",
          temperature: 0.7,
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="Local CLI">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "tts-local-cli",
      providers: {
        "tts-local-cli": {
          command: "say",
          args: ["-o", "{{OutputPath}}", "{{Text}}"],
          outputFormat: "wav",
          timeoutMs: 120000,
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="Microsoft (no key)">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "microsoft",
      providers: {
        microsoft: {
          enabled: true,
          voice: "en-US-MichelleNeural",
          lang: "en-US",
          outputFormat: "audio-24khz-48kbitrate-mono-mp3",
          rate: "+0%",
          pitch: "+0%",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="MiniMax">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "minimax",
      providers: {
        minimax: {
          apiKey: "${MINIMAX_API_KEY}",
          model: "speech-2.8-hd",
          voiceId: "English_expressive_narrator",
          speed: 1.0,
          vol: 1.0,
          pitch: 0,
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="OpenAI + ElevenLabs">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "openai",
      summaryModel: "openai/gpt-4.1-mini",
      modelOverrides: { enabled: true },
      providers: {
        openai: {
          apiKey: "${OPENAI_API_KEY}",
          model: "gpt-4o-mini-tts",
          voice: "alloy",
        },
        elevenlabs: {
          apiKey: "${ELEVENLABS_API_KEY}",
          model: "eleven_multilingual_v2",
          voiceId: "EXAVITQu4vr4xnSDxMaL",
          voiceSettings: { stability: 0.5, similarityBoost: 0.75, style: 0.0, useSpeakerBoost: true, speed: 1.0 },
          applyTextNormalization: "auto",
          languageCode: "en",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="OpenRouter">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "openrouter",
      providers: {
        openrouter: {
          apiKey: "${OPENROUTER_API_KEY}",
          model: "hexgrad/kokoro-82m",
          voice: "af_alloy",
          responseFormat: "mp3",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="Volcengine">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "volcengine",
      providers: {
        volcengine: {
          apiKey: "${VOLCENGINE_TTS_API_KEY}",
          resourceId: "seed-tts-1.0",
          voice: "en_female_anna_mars_bigtts",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="xAI">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "xai",
      providers: {
        xai: {
          apiKey: "${XAI_API_KEY}",
          voiceId: "eve",
          language: "en",
          responseFormat: "mp3",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="Xiaomi MiMo">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "xiaomi",
      providers: {
        xiaomi: {
          apiKey: "${XIAOMI_API_KEY}",
          model: "mimo-v2.5-tts",
          voice: "mimo_default",
          format: "mp3",
        },
      },
    },
  },
}
```
  </Tab>
</Tabs>

### Nadpisania głosu dla poszczególnych agentów

Użyj `agents.list[].tts`, gdy jeden agent ma mówić z użyciem innego providera,
głosu, modelu, persony lub trybu automatycznego TTS. Blok agenta jest głęboko scalany z
`messages.tts`, więc dane uwierzytelniające providera mogą pozostać w globalnej konfiguracji providera:

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "elevenlabs",
      providers: {
        elevenlabs: { apiKey: "${ELEVENLABS_API_KEY}", model: "eleven_multilingual_v2" },
      },
    },
  },
  agents: {
    list: [
      {
        id: "reader",
        tts: {
          providers: {
            elevenlabs: { voiceId: "EXAVITQu4vr4xnSDxMaL" },
          },
        },
      },
    ],
  },
}
```

Aby przypiąć personę dla konkretnego agenta, ustaw `agents.list[].tts.persona` obok konfiguracji
providera — nadpisuje ona globalne `messages.tts.persona` tylko dla tego agenta.

Kolejność pierwszeństwa dla automatycznych odpowiedzi, `/tts audio`, `/tts status` oraz
narzędzia agenta `tts`:

1. `messages.tts`
2. aktywne `agents.list[].tts`
3. nadpisanie kanału, gdy kanał obsługuje `channels.<channel>.tts`
4. nadpisanie konta, gdy kanał przekazuje `channels.<channel>.accounts.<id>.tts`
5. lokalne preferencje `/tts` dla tego hosta
6. wbudowane dyrektywy `[[tts:...]]`, gdy włączone są [nadpisania sterowane przez model](#model-driven-directives)

Zastąpienia kanału i konta używają tego samego kształtu co `messages.tts` i
są głęboko scalane z wcześniejszymi warstwami, więc współdzielone dane
uwierzytelniające dostawcy mogą pozostać w `messages.tts`, podczas gdy kanał
lub konto bota zmienia tylko głos, model, personę albo tryb automatyczny:

```json5
{
  messages: {
    tts: {
      provider: "openai",
      providers: {
        openai: { apiKey: "${OPENAI_API_KEY}", model: "gpt-4o-mini-tts" },
      },
    },
  },
  channels: {
    feishu: {
      accounts: {
        english: {
          tts: {
            providers: {
              openai: { voice: "shimmer" },
            },
          },
        },
      },
    },
  },
}
```

## Persony

**Persona** to stabilna tożsamość mówiona, którą można deterministycznie
stosować u różnych dostawców. Może preferować jednego dostawcę, definiować
neutralną względem dostawcy intencję promptu oraz przenosić powiązania
specyficzne dla dostawcy dla głosów, modeli, szablonów promptów, seedów i
ustawień głosu.

### Minimalna persona

```json5
{
  messages: {
    tts: {
      auto: "always",
      persona: "narrator",
      personas: {
        narrator: {
          label: "Narrator",
          provider: "elevenlabs",
          providers: {
            elevenlabs: { voiceId: "EXAVITQu4vr4xnSDxMaL", modelId: "eleven_multilingual_v2" },
          },
        },
      },
    },
  },
}
```

### Pełna persona (prompt neutralny względem dostawcy)

```json5
{
  messages: {
    tts: {
      auto: "always",
      persona: "alfred",
      personas: {
        alfred: {
          label: "Alfred",
          description: "Dry, warm British butler narrator.",
          provider: "google",
          fallbackPolicy: "preserve-persona",
          prompt: {
            profile: "A brilliant British butler. Dry, witty, warm, charming, emotionally expressive, never generic.",
            scene: "A quiet late-night study. Close-mic narration for a trusted operator.",
            sampleContext: "The speaker is answering a private technical request with concise confidence and dry warmth.",
            style: "Refined, understated, lightly amused.",
            accent: "British English.",
            pacing: "Measured, with short dramatic pauses.",
            constraints: ["Do not read configuration values aloud.", "Do not explain the persona."],
          },
          providers: {
            google: {
              model: "gemini-3.1-flash-tts-preview",
              voiceName: "Algieba",
              promptTemplate: "audio-profile-v1",
            },
            openai: { model: "gpt-4o-mini-tts", voice: "cedar" },
            elevenlabs: {
              voiceId: "voice_id",
              modelId: "eleven_multilingual_v2",
              seed: 42,
              voiceSettings: {
                stability: 0.65,
                similarityBoost: 0.8,
                style: 0.25,
                useSpeakerBoost: true,
                speed: 0.95,
              },
            },
          },
        },
      },
    },
  },
}
```

### Rozwiązywanie persony

Aktywna persona jest wybierana deterministycznie:

1. Lokalna preferencja `/tts persona <id>`, jeśli jest ustawiona.
2. `messages.tts.persona`, jeśli jest ustawiona.
3. Brak persony.

Wybór dostawcy działa według zasady jawne-najpierw:

1. Bezpośrednie zastąpienia (CLI, Gateway, Talk, dozwolone dyrektywy TTS).
2. Lokalna preferencja `/tts provider <id>`.
3. `provider` aktywnej persony.
4. `messages.tts.provider`.
5. Automatyczny wybór z rejestru.

Przy każdej próbie dostawcy OpenClaw scala konfiguracje w tej kolejności:

1. `messages.tts.providers.<id>`
2. `messages.tts.personas.<persona>.providers.<id>`
3. Zaufane zastąpienia żądania
4. Dozwolone zastąpienia z dyrektyw TTS emitowanych przez model

### Jak dostawcy używają promptów persony

Pola promptu persony (`profile`, `scene`, `sampleContext`, `style`, `accent`,
`pacing`, `constraints`) są **neutralne względem dostawcy**. Każdy dostawca
decyduje, jak ich używać:

<AccordionGroup>
  <Accordion title="Google Gemini">
    Opakowuje pola promptu persony w strukturę promptu Gemini TTS **tylko wtedy**,
    gdy efektywna konfiguracja dostawcy Google ustawia `promptTemplate: "audio-profile-v1"`
    lub `personaPrompt`. Starsze pola `audioProfile` i `speakerName` nadal są
    dodawane na początku jako tekst promptu specyficzny dla Google. Wbudowane
    tagi audio, takie jak `[whispers]` lub `[laughs]`, wewnątrz bloku `[[tts:text]]`
    są zachowywane w transkrypcie Gemini; OpenClaw nie generuje tych tagów.
  </Accordion>
  <Accordion title="OpenAI">
    Mapuje pola promptu persony na pole żądania `instructions` **tylko wtedy**,
    gdy nie skonfigurowano jawnych `instructions` OpenAI. Jawne `instructions`
    zawsze ma pierwszeństwo.
  </Accordion>
  <Accordion title="Inni dostawcy">
    Używają tylko powiązań persony specyficznych dla dostawcy pod
    `personas.<id>.providers.<provider>`. Pola promptu persony są ignorowane,
    chyba że dostawca implementuje własne mapowanie promptu persony.
  </Accordion>
</AccordionGroup>

### Zasady awaryjnego przełączania

`fallbackPolicy` kontroluje zachowanie, gdy persona **nie ma powiązania** dla
próbowanego dostawcy:

| Zasada              | Zachowanie                                                                                                                                         |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `preserve-persona`  | **Domyślne.** Neutralne względem dostawcy pola promptu pozostają dostępne; dostawca może ich użyć albo je zignorować.                              |
| `provider-defaults` | Persona jest pomijana podczas przygotowania promptu dla tej próby; dostawca używa swoich neutralnych ustawień domyślnych, a przełączanie awaryjne do innych dostawców jest kontynuowane. |
| `fail`              | Pomija tę próbę dostawcy z `reasonCode: "not_configured"` i `personaBinding: "missing"`. Dostawcy awaryjni nadal są próbowani.                    |

Całe żądanie TTS kończy się niepowodzeniem tylko wtedy, gdy **każdy** próbowany
dostawca zostanie pominięty albo zawiedzie.

## Dyrektywy sterowane modelem

Domyślnie asystent **może** emitować dyrektywy `[[tts:...]]`, aby zastąpić
głos, model lub szybkość dla jednej odpowiedzi, a także opcjonalny blok
`[[tts:text]]...[[/tts:text]]` dla ekspresyjnych wskazówek, które powinny
pojawić się tylko w audio:

```text
Here you go.

[[tts:voiceId=pMsXgVXv3BLzUgSXRplE model=eleven_v3 speed=1.1]]
[[tts:text]](laughs) Read the song once more.[[/tts:text]]
```

Gdy `messages.tts.auto` ma wartość `"tagged"`, **dyrektywy są wymagane**, aby
uruchomić audio. Dostarczanie bloków strumieniowych usuwa dyrektywy z widocznego
tekstu, zanim kanał je zobaczy, nawet gdy są podzielone na sąsiadujące bloki.

`provider=...` jest ignorowane, chyba że `modelOverrides.allowProvider: true`.
Gdy odpowiedź deklaruje `provider=...`, pozostałe klucze w tej dyrektywie są
parsowane tylko przez tego dostawcę; nieobsługiwane klucze są usuwane i zgłaszane
jako ostrzeżenia dyrektyw TTS.

**Dostępne klucze dyrektyw:**

- `provider` (zarejestrowany identyfikator dostawcy; wymaga `allowProvider: true`)
- `voice` / `voiceName` / `voice_name` / `google_voice` / `voiceId`
- `model` / `google_model`
- `stability`, `similarityBoost`, `style`, `speed`, `useSpeakerBoost`
- `vol` / `volume` (głośność MiniMax, 0–10)
- `pitch` (całkowity ton MiniMax, od −12 do 12; wartości ułamkowe są obcinane)
- `emotion` (tag emocji Volcengine)
- `applyTextNormalization` (`auto|on|off`)
- `languageCode` (ISO 639-1)
- `seed`

**Całkowicie wyłącz zastąpienia modelu:**

```json5
{ messages: { tts: { modelOverrides: { enabled: false } } } }
```

**Zezwól na przełączanie dostawcy, zachowując konfigurowalność pozostałych ustawień:**

```json5
{ messages: { tts: { modelOverrides: { enabled: true, allowProvider: true, allowSeed: false } } } }
```

## Polecenia ukośnikowe

Pojedyncze polecenie `/tts`. W Discord OpenClaw rejestruje także `/voice`,
ponieważ `/tts` jest wbudowanym poleceniem Discord — tekstowe `/tts ...` nadal
działa.

```text
/tts off | on | status
/tts chat on | off | default
/tts latest
/tts provider <id>
/tts persona <id> | off
/tts limit <chars>
/tts summary off
/tts audio <text>
```

<Note>
Polecenia wymagają autoryzowanego nadawcy (obowiązują reguły listy dozwolonych
nadawców/właściciela) oraz włączenia `commands.text` albo natywnej rejestracji
poleceń.
</Note>

Uwagi dotyczące zachowania:

- `/tts on` zapisuje lokalną preferencję TTS jako `always`; `/tts off` zapisuje ją jako `off`.
- `/tts chat on|off|default` zapisuje zastąpienie auto-TTS ograniczone do sesji dla bieżącego czatu.
- `/tts persona <id>` zapisuje lokalną preferencję persony; `/tts persona off` ją czyści.
- `/tts latest` odczytuje najnowszą odpowiedź asystenta z transkryptu bieżącej sesji i wysyła ją jednorazowo jako audio. Przechowuje tylko hash tej odpowiedzi we wpisie sesji, aby blokować zduplikowane wysyłki głosowe.
- `/tts audio` generuje jednorazową odpowiedź audio (nie przełącza TTS na włączone).
- `limit` i `summary` są przechowywane w **lokalnych preferencjach**, nie w głównej konfiguracji.
- `/tts status` zawiera diagnostykę awaryjnego przełączania dla najnowszej próby — `Fallback: <primary> -> <used>`, `Attempts: ...` oraz szczegóły każdej próby (`provider:outcome(reasonCode) latency`).
- `/status` pokazuje aktywny tryb TTS oraz skonfigurowanego dostawcę, model, głos i oczyszczone metadane niestandardowego punktu końcowego, gdy TTS jest włączone.

## Preferencje użytkownika

Polecenia ukośnikowe zapisują lokalne zastąpienia do `prefsPath`. Domyślnie jest
to `~/.openclaw/settings/tts.json`; można je zastąpić zmienną środowiskową
`OPENCLAW_TTS_PREFS` albo `messages.tts.prefsPath`.

| Przechowywane pole | Efekt                                           |
| ------------------ | ----------------------------------------------- |
| `auto`             | Lokalne zastąpienie auto-TTS (`always`, `off`, …) |
| `provider`         | Lokalne zastąpienie głównego dostawcy           |
| `persona`          | Lokalne zastąpienie persony                     |
| `maxLength`        | Próg streszczenia (domyślnie `1500` znaków)     |
| `summarize`        | Przełącznik streszczenia (domyślnie `true`)     |

Zastępują one efektywną konfigurację z `messages.tts` oraz aktywny blok
`agents.list[].tts` dla tego hosta.

## Formaty wyjściowe (stałe)

Dostarczanie głosu TTS zależy od możliwości kanału. Pluginy kanałów deklarują,
czy TTS w stylu wiadomości głosowej ma żądać od dostawców natywnego celu
`voice-note`, czy zachować zwykłą syntezę `audio-file` i tylko oznaczać zgodne
wyjście do dostarczania głosowego.

- **Kanały obsługujące notatki głosowe**: odpowiedzi w formie notatki głosowej preferują Opus (`opus_48000_64` z ElevenLabs, `opus` z OpenAI).
  - 48 kHz / 64 kbps to dobry kompromis dla wiadomości głosowej.
- **Feishu / WhatsApp**: gdy odpowiedź w formie notatki głosowej jest tworzona jako MP3/WebM/WAV/M4A
  lub inny prawdopodobny plik audio, Plugin kanału transkoduje ją do 48 kHz
  Ogg/Opus za pomocą `ffmpeg` przed wysłaniem natywnej wiadomości głosowej. WhatsApp wysyła
  wynik przez ładunek Baileys `audio` z `ptt: true` oraz
  `audio/ogg; codecs=opus`. Jeśli konwersja się nie powiedzie, Feishu otrzymuje oryginalny
  plik jako załącznik; wysyłanie w WhatsApp kończy się niepowodzeniem zamiast opublikowania niezgodnego
  ładunku PTT.
- **BlueBubbles**: zachowuje syntezę dostawcy na zwykłej ścieżce pliku audio; dane wyjściowe MP3
  i CAF są oznaczane do dostarczenia jako notatka głosowa iMessage.
- **Inne kanały**: MP3 (`mp3_44100_128` z ElevenLabs, `mp3` z OpenAI).
  - 44,1 kHz / 128 kbps to domyślny balans zapewniający wyrazistość mowy.
- **MiniMax**: MP3 (model `speech-2.8-hd`, częstotliwość próbkowania 32 kHz) dla zwykłych załączników audio. Dla celów notatek głosowych deklarowanych przez kanał OpenClaw transkoduje MiniMax MP3 do 48 kHz Opus za pomocą `ffmpeg` przed dostarczeniem, gdy kanał deklaruje transkodowanie.
- **Xiaomi MiMo**: domyślnie MP3 albo WAV po skonfigurowaniu. Dla celów notatek głosowych deklarowanych przez kanał OpenClaw transkoduje dane wyjściowe Xiaomi do 48 kHz Opus za pomocą `ffmpeg` przed dostarczeniem, gdy kanał deklaruje transkodowanie.
- **Lokalny CLI**: używa skonfigurowanego `outputFormat`. Cele notatek głosowych są
  konwertowane do Ogg/Opus, a wyjście telefoniczne jest konwertowane do surowego 16 kHz mono PCM
  za pomocą `ffmpeg`.
- **Google Gemini**: Gemini API TTS zwraca surowy PCM 24 kHz. OpenClaw opakowuje go jako WAV dla załączników audio, transkoduje go do 48 kHz Opus dla celów notatek głosowych i zwraca PCM bezpośrednio dla Talk/telefonii.
- **Gradium**: WAV dla załączników audio, Opus dla celów notatek głosowych oraz `ulaw_8000` przy 8 kHz dla telefonii.
- **Inworld**: MP3 dla zwykłych załączników audio, natywne `OGG_OPUS` dla celów notatek głosowych oraz surowe `PCM` przy 22050 Hz dla Talk/telefonii.
- **xAI**: domyślnie MP3; `responseFormat` może mieć wartość `mp3`, `wav`, `pcm`, `mulaw` lub `alaw`. OpenClaw używa wsadowego punktu końcowego REST TTS xAI i zwraca kompletny załącznik audio; strumieniowy WebSocket TTS xAI nie jest używany przez tę ścieżkę dostawcy. Natywny format notatek głosowych Opus nie jest obsługiwany przez tę ścieżkę.
- **Microsoft**: używa `microsoft.outputFormat` (domyślnie `audio-24khz-48kbitrate-mono-mp3`).
  - Dołączony transport akceptuje `outputFormat`, ale nie wszystkie formaty są dostępne z usługi.
  - Wartości formatu wyjściowego są zgodne z formatami wyjściowymi Microsoft Speech (w tym Ogg/WebM Opus).
  - Telegram `sendVoice` akceptuje OGG/MP3/M4A; użyj OpenAI/ElevenLabs, jeśli potrzebujesz
    gwarantowanych wiadomości głosowych Opus.
  - Jeśli skonfigurowany format wyjściowy Microsoft zawiedzie, OpenClaw ponawia próbę z MP3.

Formaty wyjściowe OpenAI/ElevenLabs są stałe dla poszczególnych kanałów (zobacz wyżej).

## Zachowanie Auto-TTS

Gdy `messages.tts.auto` jest włączone, OpenClaw:

- Pomija TTS, jeśli odpowiedź zawiera już multimedia lub dyrektywę `MEDIA:`.
- Pomija bardzo krótkie odpowiedzi (poniżej 10 znaków).
- Streszcza długie odpowiedzi, gdy streszczenia są włączone, używając
  `summaryModel` (lub `agents.defaults.model.primary`).
- Dołącza wygenerowany dźwięk do odpowiedzi.
- W `mode: "final"` nadal wysyła TTS tylko audio dla strumieniowanych odpowiedzi końcowych
  po zakończeniu strumienia tekstu; wygenerowane multimedia przechodzą przez tę samą
  normalizację multimediów kanału co zwykłe załączniki odpowiedzi.

Jeśli odpowiedź przekracza `maxLength`, a streszczanie jest wyłączone (lub brak klucza API dla
modelu streszczania), dźwięk jest pomijany i wysyłana jest zwykła odpowiedź tekstowa.

```text
Reply -> TTS enabled?
  no  -> send text
  yes -> has media / MEDIA: / short?
          yes -> send text
          no  -> length > limit?
                   no  -> TTS -> attach audio
                   yes -> summary enabled?
                            no  -> send text
                            yes -> summarize -> TTS -> attach audio
```

## Formaty wyjściowe według kanału

  | Cel                                   | Format                                                                                                                                |
  | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
  | Feishu / Matrix / Telegram / WhatsApp | Odpowiedzi w formie notatek głosowych preferują **Opus** (`opus_48000_64` z ElevenLabs, `opus` z OpenAI). 48 kHz / 64 kbps równoważy czytelność i rozmiar. |
  | Inne kanały                           | **MP3** (`mp3_44100_128` z ElevenLabs, `mp3` z OpenAI). 44,1 kHz / 128 kbps to domyślne ustawienie dla mowy.                                 |
  | Rozmowa / telefonia                   | Natywny dla dostawcy **PCM** (Inworld 22050 Hz, Google 24 kHz) albo `ulaw_8000` z Gradium dla telefonii.                                 |

  Uwagi według dostawcy:

  - **Transkodowanie Feishu / WhatsApp:** Gdy odpowiedź w formie notatki głosowej trafia jako MP3/WebM/WAV/M4A, Plugin kanału transkoduje ją do 48 kHz Ogg/Opus za pomocą `ffmpeg`. WhatsApp wysyła przez Baileys z `ptt: true` i `audio/ogg; codecs=opus`. Jeśli konwersja się nie powiedzie: Feishu wraca do dołączenia oryginalnego pliku; wysyłka WhatsApp kończy się niepowodzeniem zamiast opublikowania niezgodnego ładunku PTT.
  - **MiniMax / Xiaomi MiMo:** Domyślnie MP3 (32 kHz dla MiniMax `speech-2.8-hd`); transkodowane do 48 kHz Opus dla celów notatek głosowych przez `ffmpeg`.
  - **Lokalne CLI:** Używa skonfigurowanego `outputFormat`. Cele notatek głosowych są konwertowane do Ogg/Opus, a wyjście telefoniczne do surowego 16 kHz mono PCM.
  - **Google Gemini:** Zwraca surowy 24 kHz PCM. OpenClaw opakowuje go jako WAV dla załączników, transkoduje do 48 kHz Opus dla celów notatek głosowych, zwraca PCM bezpośrednio dla rozmowy/telefonii.
  - **Inworld:** Załączniki MP3, natywne `OGG_OPUS` dla notatek głosowych, surowy `PCM` 22050 Hz dla rozmowy/telefonii.
  - **xAI:** Domyślnie MP3; `responseFormat` może być `mp3|wav|pcm|mulaw|alaw`. Używa wsadowego endpointu REST xAI — strumieniowe WebSocket TTS **nie** jest używane. Natywny format notatek głosowych Opus **nie** jest obsługiwany.
  - **Microsoft:** Używa `microsoft.outputFormat` (domyślnie `audio-24khz-48kbitrate-mono-mp3`). Telegram `sendVoice` akceptuje OGG/MP3/M4A; użyj OpenAI/ElevenLabs, jeśli potrzebujesz gwarantowanych wiadomości głosowych Opus. Jeśli skonfigurowany format Microsoft się nie powiedzie, OpenClaw ponawia próbę z MP3.

  Formaty wyjściowe OpenAI i ElevenLabs są ustalone dla kanału zgodnie z powyższą listą.

  ## Dokumentacja pól

  <AccordionGroup>
  <Accordion title="Top-level messages.tts.*">
    <ParamField path="auto" type='"off" | "always" | "inbound" | "tagged"'>
      Tryb automatycznego TTS. `inbound` wysyła audio tylko po przychodzącej wiadomości głosowej; `tagged` wysyła audio tylko wtedy, gdy odpowiedź zawiera dyrektywy `[[tts:...]]` albo blok `[[tts:text]]`.
    </ParamField>
    <ParamField path="enabled" type="boolean" deprecated>
      Starszy przełącznik. `openclaw doctor --fix` migruje go do `auto`.
    </ParamField>
    <ParamField path="mode" type='"final" | "all"' default="final">
      `"all"` obejmuje odpowiedzi narzędzi/bloków oprócz odpowiedzi końcowych.
    </ParamField>
    <ParamField path="provider" type="string">
      Identyfikator dostawcy mowy. Gdy nie jest ustawiony, OpenClaw używa pierwszego skonfigurowanego dostawcy w kolejności automatycznego wyboru rejestru. Starsze `provider: "edge"` jest przepisywane na `"microsoft"` przez `openclaw doctor --fix`.
    </ParamField>
    <ParamField path="persona" type="string">
      Aktywny identyfikator persony z `personas`. Normalizowany do małych liter.
    </ParamField>
    <ParamField path="personas.<id>" type="object">
      Stabilna tożsamość mówiona. Pola: `label`, `description`, `provider`, `fallbackPolicy`, `prompt`, `providers.<provider>`. Zobacz [Persony](#personas).
    </ParamField>
    <ParamField path="summaryModel" type="string">
      Tani model do automatycznego podsumowania; domyślnie `agents.defaults.model.primary`. Akceptuje `provider/model` albo skonfigurowany alias modelu.
    </ParamField>
    <ParamField path="modelOverrides" type="object">
      Zezwala modelowi na emitowanie dyrektyw TTS. `enabled` domyślnie ma wartość `true`; `allowProvider` domyślnie ma wartość `false`.
    </ParamField>
    <ParamField path="providers.<id>" type="object">
      Ustawienia należące do dostawcy, kluczowane identyfikatorem dostawcy mowy. Starsze bloki bezpośrednie (`messages.tts.openai`, `.elevenlabs`, `.microsoft`, `.edge`) są przepisywane przez `openclaw doctor --fix`; commituj tylko `messages.tts.providers.<id>`.
    </ParamField>
    <ParamField path="maxTextLength" type="number">
      Twardy limit znaków wejścia TTS. `/tts audio` kończy się niepowodzeniem, jeśli zostanie przekroczony.
    </ParamField>
    <ParamField path="timeoutMs" type="number">
      Limit czasu żądania w milisekundach.
    </ParamField>
    <ParamField path="prefsPath" type="string">
      Nadpisuje lokalną ścieżkę JSON preferencji (dostawca/limit/podsumowanie). Domyślnie `~/.openclaw/settings/tts.json`.
    </ParamField>
  </Accordion>

  <Accordion title="Azure Speech">
    <ParamField path="apiKey" type="string">Env: `AZURE_SPEECH_KEY`, `AZURE_SPEECH_API_KEY` albo `SPEECH_KEY`.</ParamField>
    <ParamField path="region" type="string">Region Azure Speech (np. `eastus`). Env: `AZURE_SPEECH_REGION` albo `SPEECH_REGION`.</ParamField>
    <ParamField path="endpoint" type="string">Opcjonalne nadpisanie endpointu Azure Speech (alias `baseUrl`).</ParamField>
    <ParamField path="voice" type="string">ShortName głosu Azure. Domyślnie `en-US-JennyNeural`.</ParamField>
    <ParamField path="lang" type="string">Kod języka SSML. Domyślnie `en-US`.</ParamField>
    <ParamField path="outputFormat" type="string">Azure `X-Microsoft-OutputFormat` dla standardowego audio. Domyślnie `audio-24khz-48kbitrate-mono-mp3`.</ParamField>
    <ParamField path="voiceNoteOutputFormat" type="string">Azure `X-Microsoft-OutputFormat` dla wyjścia notatki głosowej. Domyślnie `ogg-24khz-16bit-mono-opus`.</ParamField>
  </Accordion>

  <Accordion title="ElevenLabs">
    <ParamField path="apiKey" type="string">Wraca do `ELEVENLABS_API_KEY` albo `XI_API_KEY`.</ParamField>
    <ParamField path="model" type="string">Identyfikator modelu (np. `eleven_multilingual_v2`, `eleven_v3`).</ParamField>
    <ParamField path="voiceId" type="string">Identyfikator głosu ElevenLabs.</ParamField>
    <ParamField path="voiceSettings" type="object">
      `stability`, `similarityBoost`, `style` (każde `0..1`), `useSpeakerBoost` (`true|false`), `speed` (`0.5..2.0`, `1.0` = normalnie).
    </ParamField>
    <ParamField path="applyTextNormalization" type='"auto" | "on" | "off"'>Tryb normalizacji tekstu.</ParamField>
    <ParamField path="languageCode" type="string">2-literowy ISO 639-1 (np. `en`, `de`).</ParamField>
    <ParamField path="seed" type="number">Liczba całkowita `0..4294967295` dla determinizmu best-effort.</ParamField>
    <ParamField path="baseUrl" type="string">Nadpisuje bazowy URL API ElevenLabs.</ParamField>
  </Accordion>

  <Accordion title="Google Gemini">
    <ParamField path="apiKey" type="string">Wraca do `GEMINI_API_KEY` / `GOOGLE_API_KEY`. Jeśli pominięto, TTS może ponownie użyć `models.providers.google.apiKey` przed powrotem do env.</ParamField>
    <ParamField path="model" type="string">Model Gemini TTS. Domyślnie `gemini-3.1-flash-tts-preview`.</ParamField>
    <ParamField path="voiceName" type="string">Nazwa gotowego głosu Gemini. Domyślnie `Kore`. Alias: `voice`.</ParamField>
    <ParamField path="audioProfile" type="string">Prompt stylu w języku naturalnym poprzedzający tekst mówiony.</ParamField>
    <ParamField path="speakerName" type="string">Opcjonalna etykieta mówcy poprzedzająca tekst mówiony, gdy prompt używa nazwanego mówcy.</ParamField>
    <ParamField path="promptTemplate" type='"audio-profile-v1"'>Ustaw na `audio-profile-v1`, aby opakować aktywne pola promptu persony w deterministyczną strukturę promptu Gemini TTS.</ParamField>
    <ParamField path="personaPrompt" type="string">Dodatkowy tekst promptu persony specyficzny dla Google, dodawany do notatek reżysera szablonu.</ParamField>
    <ParamField path="baseUrl" type="string">Akceptowane jest tylko `https://generativelanguage.googleapis.com`.</ParamField>
  </Accordion>

  <Accordion title="Gradium">
    <ParamField path="apiKey" type="string">Env: `GRADIUM_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Domyślnie `https://api.gradium.ai`.</ParamField>
    <ParamField path="voiceId" type="string">Domyślnie Emma (`YTpq7expH9539ERJ`).</ParamField>
  </Accordion>

  <Accordion title="Inworld">
    <ParamField path="apiKey" type="string">Env: `INWORLD_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Domyślnie `https://api.inworld.ai`.</ParamField>
    <ParamField path="modelId" type="string">Domyślnie `inworld-tts-1.5-max`. Także: `inworld-tts-1.5-mini`, `inworld-tts-1-max`, `inworld-tts-1`.</ParamField>
    <ParamField path="voiceId" type="string">Domyślnie `Sarah`.</ParamField>
    <ParamField path="temperature" type="number">Temperatura próbkowania `0..2`.</ParamField>
  </Accordion>

  <Accordion title="Local CLI (tts-local-cli)">
    <ParamField path="command" type="string">Lokalny plik wykonywalny lub ciąg polecenia dla CLI TTS.</ParamField>
    <ParamField path="args" type="string[]">Argumenty polecenia. Obsługuje symbole zastępcze `{{Text}}`, `{{OutputPath}}`, `{{OutputDir}}`, `{{OutputBase}}`.</ParamField>
    <ParamField path="outputFormat" type='"mp3" | "opus" | "wav"'>Oczekiwany format wyjściowy CLI. Domyślnie `mp3` dla załączników audio.</ParamField>
    <ParamField path="timeoutMs" type="number">Limit czasu polecenia w milisekundach. Domyślnie `120000`.</ParamField>
    <ParamField path="cwd" type="string">Opcjonalny katalog roboczy polecenia.</ParamField>
    <ParamField path="env" type="Record<string, string>">Opcjonalne nadpisania środowiska dla polecenia.</ParamField>
  </Accordion>

  <Accordion title="Microsoft (no API key)">
    <ParamField path="enabled" type="boolean" default="true">Zezwalaj na użycie mowy Microsoft.</ParamField>
    <ParamField path="voice" type="string">Nazwa głosu neuronowego Microsoft (np. `en-US-MichelleNeural`).</ParamField>
    <ParamField path="lang" type="string">Kod języka (np. `en-US`).</ParamField>
    <ParamField path="outputFormat" type="string">Format wyjściowy Microsoft. Domyślnie `audio-24khz-48kbitrate-mono-mp3`. Nie wszystkie formaty są obsługiwane przez dołączony transport oparty na Edge.</ParamField>
    <ParamField path="rate / pitch / volume" type="string">Ciągi procentowe (np. `+10%`, `-5%`).</ParamField>
    <ParamField path="saveSubtitles" type="boolean">Zapisuj napisy JSON obok pliku audio.</ParamField>
    <ParamField path="proxy" type="string">Adres URL proxy dla żądań mowy Microsoft.</ParamField>
    <ParamField path="timeoutMs" type="number">Nadpisanie limitu czasu żądania (ms).</ParamField>
    <ParamField path="edge.*" type="object" deprecated>Starszy alias. Uruchom `openclaw doctor --fix`, aby przepisać utrwaloną konfigurację na `providers.microsoft`.</ParamField>
  </Accordion>

  <Accordion title="MiniMax">
    <ParamField path="apiKey" type="string">W razie braku używa `MINIMAX_API_KEY`. Uwierzytelnianie Token Plan przez `MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY` lub `MINIMAX_CODING_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Domyślnie `https://api.minimax.io`. Env: `MINIMAX_API_HOST`.</ParamField>
    <ParamField path="model" type="string">Domyślnie `speech-2.8-hd`. Env: `MINIMAX_TTS_MODEL`.</ParamField>
    <ParamField path="voiceId" type="string">Domyślnie `English_expressive_narrator`. Env: `MINIMAX_TTS_VOICE_ID`.</ParamField>
    <ParamField path="speed" type="number">`0.5..2.0`. Domyślnie `1.0`.</ParamField>
    <ParamField path="vol" type="number">`(0, 10]`. Domyślnie `1.0`.</ParamField>
    <ParamField path="pitch" type="number">Liczba całkowita `-12..12`. Domyślnie `0`. Wartości ułamkowe są obcinane przed żądaniem.</ParamField>
  </Accordion>

  <Accordion title="OpenAI">
    <ParamField path="apiKey" type="string">W razie braku używa `OPENAI_API_KEY`.</ParamField>
    <ParamField path="model" type="string">Identyfikator modelu TTS OpenAI (np. `gpt-4o-mini-tts`).</ParamField>
    <ParamField path="voice" type="string">Nazwa głosu (np. `alloy`, `cedar`).</ParamField>
    <ParamField path="instructions" type="string">Jawne pole OpenAI `instructions`. Gdy jest ustawione, pola promptu persony **nie** są automatycznie mapowane.</ParamField>
    <ParamField path="baseUrl" type="string">
      Nadpisz punkt końcowy TTS OpenAI. Kolejność rozstrzygania: konfiguracja → `OPENAI_TTS_BASE_URL` → `https://api.openai.com/v1`. Wartości inne niż domyślne są traktowane jako punkty końcowe TTS zgodne z OpenAI, więc akceptowane są niestandardowe nazwy modeli i głosów.
    </ParamField>
  </Accordion>

  <Accordion title="OpenRouter">
    <ParamField path="apiKey" type="string">Env: `OPENROUTER_API_KEY`. Może ponownie użyć `models.providers.openrouter.apiKey`.</ParamField>
    <ParamField path="baseUrl" type="string">Domyślnie `https://openrouter.ai/api/v1`. Starsze `https://openrouter.ai/v1` jest normalizowane.</ParamField>
    <ParamField path="model" type="string">Domyślnie `hexgrad/kokoro-82m`. Alias: `modelId`.</ParamField>
    <ParamField path="voice" type="string">Domyślnie `af_alloy`. Alias: `voiceId`.</ParamField>
    <ParamField path="responseFormat" type='"mp3" | "pcm"'>Domyślnie `mp3`.</ParamField>
    <ParamField path="speed" type="number">Nadpisanie szybkości natywne dla dostawcy.</ParamField>
  </Accordion>

  <Accordion title="Volcengine (BytePlus Seed Speech)">
    <ParamField path="apiKey" type="string">Env: `VOLCENGINE_TTS_API_KEY` lub `BYTEPLUS_SEED_SPEECH_API_KEY`.</ParamField>
    <ParamField path="resourceId" type="string">Domyślnie `seed-tts-1.0`. Env: `VOLCENGINE_TTS_RESOURCE_ID`. Użyj `seed-tts-2.0`, gdy projekt ma uprawnienie do TTS 2.0.</ParamField>
    <ParamField path="appKey" type="string">Nagłówek klucza aplikacji. Domyślnie `aGjiRDfUWi`. Env: `VOLCENGINE_TTS_APP_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Nadpisz punkt końcowy HTTP Seed Speech TTS. Env: `VOLCENGINE_TTS_BASE_URL`.</ParamField>
    <ParamField path="voice" type="string">Typ głosu. Domyślnie `en_female_anna_mars_bigtts`. Env: `VOLCENGINE_TTS_VOICE`.</ParamField>
    <ParamField path="speedRatio" type="number">Współczynnik szybkości natywny dla dostawcy.</ParamField>
    <ParamField path="emotion" type="string">Tag emocji natywny dla dostawcy.</ParamField>
    <ParamField path="appId / token / cluster" type="string" deprecated>Starsze pola konsoli Volcengine Speech. Env: `VOLCENGINE_TTS_APPID`, `VOLCENGINE_TTS_TOKEN`, `VOLCENGINE_TTS_CLUSTER` (domyślnie `volcano_tts`).</ParamField>
  </Accordion>

  <Accordion title="xAI">
    <ParamField path="apiKey" type="string">Env: `XAI_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Domyślnie `https://api.x.ai/v1`. Env: `XAI_BASE_URL`.</ParamField>
    <ParamField path="voiceId" type="string">Domyślnie `eve`. Dostępne głosy: `ara`, `eve`, `leo`, `rex`, `sal`, `una`.</ParamField>
    <ParamField path="language" type="string">Kod języka BCP-47 lub `auto`. Domyślnie `en`.</ParamField>
    <ParamField path="responseFormat" type='"mp3" | "wav" | "pcm" | "mulaw" | "alaw"'>Domyślnie `mp3`.</ParamField>
    <ParamField path="speed" type="number">Nadpisanie szybkości natywne dla dostawcy.</ParamField>
  </Accordion>

  <Accordion title="Xiaomi MiMo">
    <ParamField path="apiKey" type="string">Env: `XIAOMI_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Domyślnie `https://api.xiaomimimo.com/v1`. Env: `XIAOMI_BASE_URL`.</ParamField>
    <ParamField path="model" type="string">Domyślnie `mimo-v2.5-tts`. Env: `XIAOMI_TTS_MODEL`. Obsługuje także `mimo-v2-tts`.</ParamField>
    <ParamField path="voice" type="string">Domyślnie `mimo_default`. Env: `XIAOMI_TTS_VOICE`.</ParamField>
    <ParamField path="format" type='"mp3" | "wav"'>Domyślnie `mp3`. Env: `XIAOMI_TTS_FORMAT`.</ParamField>
    <ParamField path="style" type="string">Opcjonalna instrukcja stylu w języku naturalnym wysyłana jako wiadomość użytkownika; nie jest wypowiadana.</ParamField>
  </Accordion>
</AccordionGroup>

## Narzędzie agenta

Narzędzie `tts` konwertuje tekst na mowę i zwraca załącznik audio do
dostarczenia odpowiedzi. W Feishu, Matrix, Telegram i WhatsApp audio jest
dostarczane jako wiadomość głosowa, a nie jako załącznik pliku. Feishu i
WhatsApp mogą transkodować wyjście TTS inne niż Opus na tej ścieżce, gdy
`ffmpeg` jest dostępny.

WhatsApp wysyła audio przez Baileys jako notatkę głosową PTT (`audio` z
`ptt: true`) i wysyła widoczny tekst **oddzielnie** od audio PTT, ponieważ
klienci nie renderują konsekwentnie podpisów przy notatkach głosowych.

Narzędzie akceptuje opcjonalne pola `channel` i `timeoutMs`; `timeoutMs` to
limit czasu żądania dostawcy dla pojedynczego wywołania, w milisekundach.

## RPC Gateway

| Metoda            | Cel                                            |
| ----------------- | ---------------------------------------------- |
| `tts.status`      | Odczytaj bieżący stan TTS i ostatnią próbę.    |
| `tts.enable`      | Ustaw lokalną preferencję auto na `always`.    |
| `tts.disable`     | Ustaw lokalną preferencję auto na `off`.       |
| `tts.convert`     | Jednorazowy tekst → audio.                     |
| `tts.setProvider` | Ustaw lokalną preferencję dostawcy.            |
| `tts.setPersona`  | Ustaw lokalną preferencję persony.             |
| `tts.providers`   | Wyświetl listę skonfigurowanych dostawców i stan. |

## Linki usług

- [Przewodnik OpenAI po zamianie tekstu na mowę](https://platform.openai.com/docs/guides/text-to-speech)
- [Dokumentacja referencyjna OpenAI Audio API](https://platform.openai.com/docs/api-reference/audio)
- [Azure Speech REST zamiana tekstu na mowę](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech)
- [Dostawca Azure Speech](/pl/providers/azure-speech)
- [ElevenLabs Text to Speech](https://elevenlabs.io/docs/api-reference/text-to-speech)
- [Uwierzytelnianie ElevenLabs](https://elevenlabs.io/docs/api-reference/authentication)
- [Gradium](/pl/providers/gradium)
- [Inworld TTS API](https://docs.inworld.ai/tts/tts)
- [MiniMax T2A v2 API](https://platform.minimaxi.com/document/T2A%20V2)
- [Volcengine TTS HTTP API](/pl/providers/volcengine#text-to-speech)
- [Synteza mowy Xiaomi MiMo](/pl/providers/xiaomi#text-to-speech)
- [node-edge-tts](https://github.com/SchneeHertz/node-edge-tts)
- [Formaty wyjściowe Microsoft Speech](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech#audio-outputs)
- [xAI zamiana tekstu na mowę](https://docs.x.ai/developers/rest-api-reference/inference/voice#text-to-speech-rest)

## Powiązane

- [Przegląd mediów](/pl/tools/media-overview)
- [Generowanie muzyki](/pl/tools/music-generation)
- [Generowanie wideo](/pl/tools/video-generation)
- [Polecenia z ukośnikiem](/pl/tools/slash-commands)
- [Plugin połączeń głosowych](/pl/plugins/voice-call)
