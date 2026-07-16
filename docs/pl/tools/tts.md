---
read_when:
    - Włączanie zamiany tekstu na mowę w odpowiedziach
    - Konfigurowanie dostawcy TTS, łańcucha mechanizmów rezerwowych lub persony
    - Korzystanie z poleceń lub dyrektyw /tts
sidebarTitle: Text to speech (TTS)
summary: Zamiana tekstu na mowę w odpowiedziach wychodzących — dostawcy, persony, polecenia z ukośnikiem i dane wyjściowe dla poszczególnych kanałów
title: Synteza mowy
x-i18n:
    generated_at: "2026-07-16T19:14:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4ba17f56927507a73b5b116f5f13bb7b612b4ba7669f5ad240d5c96a6620c611
    source_path: tools/tts.md
    workflow: 16
---

OpenClaw przekształca odpowiedzi wychodzące w dźwięk za pomocą **14 dostawców syntezy mowy**:
natywnych wiadomości głosowych w Feishu, Matrix, Telegram i WhatsApp; załączników
audio we wszystkich pozostałych usługach; oraz strumieni PCM/Ulaw dla telefonii i Talk.

TTS stanowi część Talk odpowiedzialną za generowanie mowy w trybie `stt-tts` (`talk.speak` korzysta z tej
samej ścieżki syntezy). Sesje Talk `realtime` obsługiwane natywnie przez dostawcę syntetyzują
mowę wewnątrz dostawcy czasu rzeczywistego; sesje `transcription` nigdy nie
syntetyzują głosowej odpowiedzi asystenta.

## Szybki start

<Steps>
  <Step title="Wybierz dostawcę">
    OpenAI i ElevenLabs to najbardziej niezawodne opcje hostowane. Microsoft i
    lokalny CLI działają bez klucza API. Pełną listę zawiera [macierz dostawców](#supported-providers).
  </Step>
  <Step title="Ustaw klucz API">
    Wyeksportuj zmienną środowiskową swojego dostawcy (na przykład `OPENAI_API_KEY`,
    `ELEVENLABS_API_KEY`). Microsoft i lokalny CLI nie wymagają klucza.
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
Automatyczne TTS jest domyślnie **wyłączone**. Gdy `messages.tts.provider` nie jest ustawione,
OpenClaw wybiera pierwszego skonfigurowanego dostawcę zgodnie z kolejnością automatycznego wyboru w rejestrze.
Wbudowane narzędzie agenta `tts` działa wyłącznie na wyraźne żądanie: zwykły czat pozostaje
tekstowy, chyba że użytkownik poprosi o dźwięk, użyje `/tts` albo włączy automatyczne TTS lub
syntezę mowy za pomocą dyrektywy.
</Note>

## Obsługiwani dostawcy

| Dostawca          | Uwierzytelnianie                                                                                                 | Uwagi                                                                                       |
| ----------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| **Azure Speech**  | `AZURE_SPEECH_KEY` + `AZURE_SPEECH_REGION` (także `AZURE_SPEECH_API_KEY`, `SPEECH_KEY`, `SPEECH_REGION`)          | Natywne wyjście notatek głosowych Ogg/Opus i telefonia.                                     |
| **DeepInfra**     | `DEEPINFRA_API_KEY`                                                                                              | TTS zgodne z OpenAI. Domyślnie używa `hexgrad/Kokoro-82M`.                                    |
| **ElevenLabs**    | `ELEVENLABS_API_KEY` lub `XI_API_KEY`                                                                             | Klonowanie głosu, obsługa wielu języków, deterministyczność przez `seed`; strumieniowanie do odtwarzania głosu w Discord. |
| **Google Gemini** | `GEMINI_API_KEY` lub `GOOGLE_API_KEY`                                                                             | Wsadowe TTS interfejsu Gemini API; uwzględnia personę przez `promptTemplate: "audio-profile-v1"`.               |
| **Gradium**       | `GRADIUM_API_KEY`                                                                                                | Wyjście notatek głosowych i telefonii.                                                      |
| **Inworld**       | `INWORLD_API_KEY`                                                                                                | Strumieniowy interfejs TTS API. Natywne notatki głosowe Opus i telefonia PCM.                |
| **Lokalny CLI**   | brak                                                                                                             | Uruchamia skonfigurowane lokalne polecenie TTS.                                             |
| **Microsoft**     | brak                                                                                                             | Publiczne neuronowe TTS Edge przez `node-edge-tts`. Działanie bez gwarancji, bez SLA.     |
| **MiniMax**       | `MINIMAX_API_KEY` (lub Token Plan: `MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`)      | T2A v2 API. Domyślnie używa `speech-2.8-hd`.                                             |
| **OpenAI**        | `OPENAI_API_KEY`                                                                                                 | Używany także do automatycznych podsumowań; obsługuje personę `instructions`.            |
| **OpenRouter**    | `OPENROUTER_API_KEY` (może ponownie użyć `models.providers.openrouter.apiKey`)                                            | Domyślny model `hexgrad/kokoro-82m`.                                                          |
| **Volcengine**    | `VOLCENGINE_TTS_API_KEY` lub `BYTEPLUS_SEED_SPEECH_API_KEY` (starszy AppID/token: `VOLCENGINE_TTS_APPID`/`_TOKEN`) | Interfejs HTTP API BytePlus Seed Speech.                                                    |
| **Vydra**         | `VYDRA_API_KEY`                                                                                                  | Wspólny dostawca obrazów, wideo i mowy.                                                     |
| **xAI**           | `XAI_API_KEY`                                                                                                    | Wsadowe TTS xAI. Natywne notatki głosowe Opus **nie są** obsługiwane.                        |
| **Xiaomi MiMo**   | `XIAOMI_API_KEY`                                                                                                 | TTS MiMo przez uzupełnienia czatu Xiaomi.                                                   |

Jeśli skonfigurowano wielu dostawców, najpierw używany jest wybrany dostawca, a
pozostali służą jako opcje awaryjne. Automatyczne podsumowania używają `summaryModel` (lub
`agents.defaults.model.primary`), dlatego ten dostawca również musi być uwierzytelniony,
jeśli podsumowania pozostają włączone.

<Warning>
Dołączony dostawca **Microsoft** korzysta z internetowej usługi neuronowego TTS
Microsoft Edge przez `node-edge-tts`. Jest to publiczna usługa internetowa bez opublikowanego
SLA ani limitu — należy traktować ją jako działającą bez gwarancji. Starszy identyfikator dostawcy `edge` jest
normalizowany do `microsoft`, a `openclaw doctor --fix` przepisuje utrwaloną
konfigurację; nowe konfiguracje powinny zawsze używać `microsoft`.
</Warning>

## Konfiguracja

Konfiguracja TTS znajduje się w sekcji `messages.tts` w pliku `~/.openclaw/openclaw.json`. Wybierz
ustawienie wstępne i dostosuj blok dostawcy. Pokazane poniżej pola `speakerVoice`/`speakerVoiceId`
są kanoniczne; własne nazwy pól `voice`/`voiceId`/
`voiceName` każdego dostawcy nadal działają jako starsze aliasy.

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
          speakerVoice: "en-US-JennyNeural",
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
          speakerVoiceId: "EXAVITQu4vr4xnSDxMaL",
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
          speakerVoice: "Kore",
          // Opcjonalne monity stylu w języku naturalnym:
          // audioProfile: "Mów spokojnym tonem prowadzącego podcast.",
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
          speakerVoiceId: "YTpq7expH9539ERJ",
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
          speakerVoiceId: "Sarah",
          temperature: 0.7,
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="Lokalny CLI">
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
  <Tab title="Microsoft (bez klucza)">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "microsoft",
      providers: {
        microsoft: {
          enabled: true,
          speakerVoice: "en-US-MichelleNeural",
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
          speakerVoiceId: "English_expressive_narrator",
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
          speakerVoice: "alloy",
        },
        elevenlabs: {
          apiKey: "${ELEVENLABS_API_KEY}",
          model: "eleven_multilingual_v2",
          speakerVoiceId: "EXAVITQu4vr4xnSDxMaL",
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
          speakerVoice: "af_alloy",
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
          speakerVoice: "en_female_anna_mars_bigtts",
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
          speakerVoiceId: "eve",
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
          speakerVoice: "mimo_default",
          format: "mp3",
        },
      },
    },
  },
}
```
  </Tab>
</Tabs>

W przypadku Xiaomi `mimo-v2.5-tts-voicedesign` pomiń `speakerVoice` i ustaw `style` na
monit projektowania głosu. OpenClaw wysyła ten monit jako wiadomość TTS `user`
i nie wysyła `audio.voice` dla modelu voicedesign.

### Ustawienia głosu dla poszczególnych agentów

Użyj `agents.list[].tts`, gdy jeden agent ma korzystać z innego dostawcy,
głosu, modelu, persony lub trybu automatycznego TTS. Blok agenta jest głęboko scalany z
`messages.tts`, dzięki czemu dane uwierzytelniające dostawcy mogą pozostać w globalnej konfiguracji dostawcy:

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
            elevenlabs: { speakerVoiceId: "EXAVITQu4vr4xnSDxMaL" },
          },
        },
      },
    ],
  },
}
```

Aby przypisać personę do konkretnego agenta, ustaw `agents.list[].tts.persona` obok konfiguracji
dostawcy — zastępuje ona globalne `messages.tts.persona` tylko dla tego agenta.

Kolejność pierwszeństwa dla automatycznych odpowiedzi, `/tts audio`, `/tts status` oraz
narzędzia agenta `tts`:

1. `messages.tts`
2. aktywne `agents.list[].tts`
3. ustawienie kanału, gdy kanał obsługuje `channels.<channel>.tts`
4. ustawienie konta, gdy kanał przekazuje `channels.<channel>.accounts.<id>.tts`
5. lokalne preferencje `/tts` dla tego hosta
6. dyrektywy śródwierszowe `[[tts:...]]`, gdy włączone są [dyrektywy sterowane przez model](#model-driven-directives)

Ustawienia kanału i konta mają ten sam kształt co `messages.tts` i są
głęboko scalane z wcześniejszymi warstwami, dzięki czemu współdzielone dane uwierzytelniające dostawcy mogą pozostać w
`messages.tts`, podczas gdy kanał lub konto bota zmienia tylko głos mówcy, model, personę
lub tryb automatyczny:

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
              openai: { speakerVoice: "shimmer" },
            },
          },
        },
      },
    },
  },
}
```

## Persony

**Persona** to stabilna tożsamość głosowa, którą można deterministycznie stosować
u różnych dostawców. Może preferować jednego dostawcę, definiować niezależną od dostawcy
intencję promptu oraz zawierać powiązania specyficzne dla dostawcy dotyczące głosów, modeli, szablonów
promptów, ziaren i ustawień głosu.

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
            elevenlabs: {
              speakerVoiceId: "EXAVITQu4vr4xnSDxMaL",
              modelId: "eleven_multilingual_v2",
            },
          },
        },
      },
    },
  },
}
```

### Pełna persona (prompt niezależny od dostawcy)

```json5
{
  messages: {
    tts: {
      auto: "always",
      persona: "alfred",
      personas: {
        alfred: {
          label: "Alfred",
          description: "Powściągliwy, serdeczny brytyjski kamerdyner-narrator.",
          provider: "google",
          fallbackPolicy: "preserve-persona",
          prompt: {
            profile: "Błyskotliwy brytyjski kamerdyner. Powściągliwy, dowcipny, serdeczny, czarujący, emocjonalnie ekspresyjny, nigdy bezbarwny.",
            scene: "Cichy gabinet późną nocą. Narracja z bliska dla zaufanego operatora.",
            sampleContext: "Mówca odpowiada na prywatną prośbę techniczną ze zwięzłą pewnością siebie i subtelnym ciepłem.",
            style: "Wyrafinowany, dyskretny, lekko rozbawiony.",
            accent: "Brytyjski angielski.",
            pacing: "Miarkowane tempo z krótkimi dramatycznymi pauzami.",
            constraints: ["Nie odczytuj na głos wartości konfiguracyjnych.", "Nie wyjaśniaj persony."],
          },
          providers: {
            google: {
              model: "gemini-3.1-flash-tts-preview",
              speakerVoice: "Algieba",
              promptTemplate: "audio-profile-v1",
            },
            openai: { model: "gpt-4o-mini-tts", speakerVoice: "cedar" },
            elevenlabs: {
              speakerVoiceId: "voice_id",
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

### Rozpoznawanie persony

Aktywna persona jest wybierana deterministycznie:

1. lokalna preferencja `/tts persona <id>`, jeśli jest ustawiona.
2. `messages.tts.persona`, jeśli jest ustawiona.
3. Brak persony.

Wybór dostawcy rozpoczyna się od ustawień jawnych:

1. Bezpośrednie ustawienia (CLI, Gateway, Talk, dozwolone dyrektywy TTS).
2. Lokalna preferencja `/tts provider <id>`.
3. `provider` aktywnej persony.
4. `messages.tts.provider`.
5. Automatyczny wybór z rejestru.

Przy każdej próbie użycia dostawcy OpenClaw scala konfiguracje w następującej kolejności:

1. `messages.tts.providers.<id>`
2. `messages.tts.personas.<persona>.providers.<id>`
3. Zaufane ustawienia żądania
4. Dozwolone ustawienia z dyrektywy TTS wyemitowanej przez model

### Jak dostawcy używają promptów persony

Pola promptu persony (`profile`, `scene`, `sampleContext`, `style`, `accent`,
`pacing`, `constraints`) są **niezależne od dostawcy**. Każdy dostawca decyduje,
jak ich używać:

<AccordionGroup>
  <Accordion title="Google Gemini">
    Umieszcza pola promptu persony w strukturze promptu TTS Gemini **tylko wtedy**,
    gdy efektywna konfiguracja dostawcy Google ustawia `promptTemplate: "audio-profile-v1"`
    lub `personaPrompt`. Starsze pola `audioProfile` i `speakerName` są
    nadal dodawane na początku jako tekst promptu specyficzny dla Google. Śródwierszowe znaczniki audio, takie jak
    `[whispers]` lub `[laughs]`, wewnątrz bloku `[[tts:text]]` są zachowywane
    w transkrypcji Gemini; OpenClaw nie generuje tych znaczników.
  </Accordion>
  <Accordion title="OpenAI">
    Mapuje pola promptu persony na pole żądania `instructions` **tylko wtedy**,
    gdy nie skonfigurowano jawnego `instructions` OpenAI. Jawne `instructions`
    ma zawsze pierwszeństwo.
  </Accordion>
  <Accordion title="Inni dostawcy">
    Używają wyłącznie powiązań persony specyficznych dla dostawcy w
    `personas.<id>.providers.<provider>`. Pola promptu persony są ignorowane,
    chyba że dostawca implementuje własne mapowanie promptu persony.
  </Accordion>
</AccordionGroup>

### Zasady mechanizmu rezerwowego

`fallbackPolicy` steruje zachowaniem, gdy persona **nie ma powiązania** z
wypróbowywanym dostawcą:

| Zasada              | Zachowanie                                                                                                                                         |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `preserve-persona`  | **Domyślnie.** Pola promptu niezależne od dostawcy pozostają dostępne; dostawca może ich użyć lub je zignorować.                                            |
| `provider-defaults` | Persona jest pomijana podczas przygotowywania promptu dla tej próby; dostawca używa swoich neutralnych ustawień domyślnych, a przełączanie na innych dostawców jest kontynuowane. |
| `fail`              | Pomija próbę użycia tego dostawcy z `reasonCode: "not_configured"` i `personaBinding: "missing"`. Dostawcy rezerwowi są nadal wypróbowywani.              |

Całe żądanie TTS kończy się niepowodzeniem tylko wtedy, gdy **każdy** wypróbowywany dostawca został pominięty
lub zawiódł.

Wybór dostawcy sesji Talk ma zakres sesji. Klient Talk powinien wybierać
identyfikatory dostawców, modeli, głosów i ustawienia regionalne z `talk.catalog` oraz przekazywać
je za pośrednictwem żądania sesji Talk lub przekazania. Otwarcie sesji głosowej nie powinno
modyfikować `messages.tts` ani globalnych domyślnych ustawień dostawcy Talk.

## Dyrektywy sterowane przez model

Domyślnie asystent **może** emitować dyrektywy `[[tts:...]]`, aby zastąpić
głos, model lub szybkość dla pojedynczej odpowiedzi, wraz z opcjonalnym
blokiem `[[tts:text]]...[[/tts:text]]` na ekspresyjne wskazówki, które powinny występować
wyłącznie w dźwięku:

```text
Proszę.

[[tts:speakerVoiceId=pMsXgVXv3BLzUgSXRplE model=eleven_v3 speed=1.1]]
[[tts:text]](śmieje się) Przeczytaj piosenkę jeszcze raz.[[/tts:text]]
```

Gdy `messages.tts.auto` ma wartość `"tagged"`, **dyrektywy są wymagane** do uruchomienia
dźwięku. Strumieniowe dostarczanie bloków usuwa dyrektywy z widocznego tekstu, zanim
kanał je zobaczy, nawet gdy są podzielone między sąsiednie bloki.

`provider=...` jest ignorowane, chyba że `modelOverrides.allowProvider: true`. Gdy
odpowiedź deklaruje `provider=...`, pozostałe klucze w tej dyrektywie są analizowane
wyłącznie przez tego dostawcę; nieobsługiwane klucze są usuwane i zgłaszane jako
ostrzeżenia dyrektyw TTS.

**Dostępne klucze dyrektyw:**

- `provider` (zarejestrowany identyfikator dostawcy; wymaga `allowProvider: true`)
- `speakerVoice` / `speakerVoiceId` (starsze aliasy: `voice`, `voiceName`, `voice_name`, `google_voice`, `voiceId`)
- `model` / `google_model`
- `stability`, `similarityBoost`, `style`, `speed`, `useSpeakerBoost`
- `vol` / `volume` (głośność MiniMax, `(0, 10]`)
- `pitch` (całkowita wysokość dźwięku MiniMax, od −12 do 12; wartości ułamkowe są obcinane)
- `emotion` (znacznik emocji Volcengine)
- `applyTextNormalization` (`auto|on|off`)
- `languageCode` (ISO 639-1)
- `seed`

**Całkowite wyłączenie ustawień modelu:**

```json5
{ messages: { tts: { modelOverrides: { enabled: false } } } }
```

**Zezwolenie na przełączanie dostawców przy zachowaniu możliwości konfiguracji pozostałych parametrów:**

```json5
{ messages: { tts: { modelOverrides: { enabled: true, allowProvider: true, allowSeed: false } } } }
```

## Polecenia ukośnikowe

Pojedyncze polecenie `/tts`. W Discord OpenClaw rejestruje również `/voice`, ponieważ
`/tts` jest wbudowanym poleceniem Discord — tekstowe `/tts ...` nadal działa.

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
Polecenia wymagają autoryzowanego nadawcy (obowiązują reguły listy dozwolonych/ właściciela) oraz włączenia
`commands.text` lub natywnej rejestracji poleceń.
</Note>

Uwagi dotyczące zachowania:

- `/tts on` zapisuje lokalną preferencję TTS w `always`; `/tts off` zapisuje ją w `off`.
- `/tts chat on|off|default` zapisuje ustawienie automatycznego TTS o zakresie sesji dla bieżącego czatu.
- `/tts persona <id>` zapisuje lokalną preferencję persony; `/tts persona off` ją usuwa.
- `/tts latest` odczytuje najnowszą odpowiedź asystenta z transkrypcji bieżącej sesji i jednorazowo wysyła ją jako dźwięk. Wpis sesji przechowuje wyłącznie skrót tej odpowiedzi, aby zapobiec wysyłaniu zduplikowanych wiadomości głosowych.
- `/tts audio` generuje jednorazową odpowiedź dźwiękową (**nie** włącza TTS).
- `/tts limit <chars>` akceptuje wartości **100–4096** (4096 to maksymalna długość podpisu/wiadomości Telegram); wartości spoza tego zakresu są odrzucane.
- `limit` i `summary` są przechowywane w **lokalnych preferencjach**, a nie w głównej konfiguracji.
- `/tts status` zawiera diagnostykę mechanizmu rezerwowego dla ostatniej próby — `Fallback: <primary> -> <used>`, `Attempts: ...` oraz szczegóły poszczególnych prób (`provider:outcome(reasonCode) latency`).
- `/status` pokazuje aktywny tryb TTS oraz skonfigurowanego dostawcę, model, głos i oczyszczone metadane niestandardowego punktu końcowego, gdy TTS jest włączony.

## Preferencje poszczególnych użytkowników

Polecenia ukośnikowe zapisują lokalne ustawienia w `prefsPath`. Wartością domyślną jest
`~/.openclaw/settings/tts.json`; można ją zastąpić zmienną środowiskową `OPENCLAW_TTS_PREFS`
lub `messages.tts.prefsPath`.

| Przechowywane pole | Efekt                                                                           |
| ------------ | -------------------------------------------------------------------------------- |
| `auto`       | Lokalne nadpisanie automatycznego TTS (`always`, `off`, …)                                     |
| `provider`   | Lokalne nadpisanie głównego dostawcy                                                  |
| `persona`    | Lokalne nadpisanie persony                                                           |
| `maxLength`  | Próg podsumowania/obcięcia (domyślnie `1500` znaków, zakres `/tts limit` 100–4096) |
| `summarize`  | Przełącznik podsumowania (domyślnie `true`)                                                  |

Te ustawienia zastępują efektywną konfigurację z `messages.tts` oraz aktywnego
bloku `agents.list[].tts` dla tego hosta.

## Formaty wyjściowe

Dostarczanie głosu TTS zależy od możliwości kanału. Pluginy kanałów deklarują,
czy TTS w stylu wiadomości głosowej powinien zażądać od dostawców natywnego celu `voice-note`, czy
zachować standardową syntezę `audio-file`, a także czy kanał transkoduje
nienatywny format wyjściowy przed wysłaniem.

| Cel                                | Format                                                                                                                                |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Feishu / Matrix / Telegram / WhatsApp | Odpowiedzi w formie wiadomości głosowych preferują **Opus** (`opus_48000_64` z ElevenLabs, `opus` z OpenAI). 48 kHz / 64 kbps zapewnia równowagę między wyrazistością a rozmiarem. |
| Inne kanały                        | **MP3** (`mp3_44100_128` z ElevenLabs, `mp3` z OpenAI). 44,1 kHz / 128 kbps to domyślna równowaga dla mowy.                  |
| Talk / telefonia                      | Natywny dla dostawcy format **PCM** (Inworld 22050 Hz, Google 24 kHz) lub `ulaw_8000` z Gradium na potrzeby telefonii.                                 |

Uwagi dotyczące poszczególnych dostawców:

- **Transkodowanie w Feishu / WhatsApp:** gdy odpowiedź w formie wiadomości głosowej ma format MP3/WebM/WAV/M4A lub inny prawdopodobny format pliku audio, Plugin kanału przed wysłaniem natywnej wiadomości głosowej transkoduje ją do formatu Ogg/Opus 48 kHz za pomocą `ffmpeg` (`libopus`, 64 kbps). WhatsApp wysyła wynik poprzez ładunek Baileys `audio` z `ptt: true` i `audio/ogg; codecs=opus`. W przypadku niepowodzenia transkodowania: Feishu przechwytuje błąd i wysyła oryginalny plik jako zwykły załącznik; WhatsApp nie ma mechanizmu rezerwowego, więc samo wysyłanie kończy się niepowodzeniem zamiast opublikowania niezgodnego ładunku PTT.
- **MiniMax:** MP3 (model `speech-2.8-hd`, częstotliwość próbkowania 32 kHz) dla zwykłych załączników audio; transkodowany do Opus 48 kHz za pomocą `ffmpeg` dla celów wiadomości głosowych deklarowanych przez kanał.
- **Xiaomi MiMo:** domyślnie MP3 lub WAV, jeśli tak skonfigurowano; transkodowany do Opus 48 kHz za pomocą `ffmpeg` dla celów wiadomości głosowych deklarowanych przez kanał.
- **Lokalny CLI:** używa skonfigurowanego `outputFormat`. Cele wiadomości głosowych są konwertowane do Ogg/Opus, a format wyjściowy dla telefonii jest konwertowany do surowego, monofonicznego PCM 16 kHz za pomocą `ffmpeg`.
- **Google Gemini:** zwraca surowy PCM 24 kHz. OpenClaw opakowuje go jako WAV dla załączników audio, transkoduje do Opus 48 kHz dla celów wiadomości głosowych i zwraca PCM bezpośrednio dla Talk/telefonii.
- **Gradium:** WAV dla załączników audio, Opus dla celów wiadomości głosowych oraz `ulaw_8000` przy 8 kHz dla telefonii.
- **Inworld:** MP3 dla zwykłych załączników audio, natywny `OGG_OPUS` dla celów wiadomości głosowych oraz surowy `PCM` przy 22050 Hz dla Talk/telefonii.
- **xAI:** domyślnie MP3; synteza plików audio może używać `mp3`, `wav`, `pcm`, `mulaw` lub `alaw` zarówno dla buforowanego, jak i strumieniowego formatu wyjściowego. Cele wiadomości głosowych używają MP3 w trybie strumieniowym oraz jako buforowanego rozwiązania rezerwowego, ponieważ formaty wyjściowe xAI `pcm`, `mulaw` i `alaw` są surowymi danymi audio bez nagłówków. Synteza buforowana używa punktu końcowego wsadowego interfejsu REST xAI `/v1/tts`; `textToSpeechStream` używa natywnego `wss://api.x.ai/v1/tts`. Nie jest to kontrakt głosowy czasu rzeczywistego. Natywny format wiadomości głosowych Opus nie jest obsługiwany.
- **Microsoft:** używa `microsoft.outputFormat` (domyślnie `audio-24khz-48kbitrate-mono-mp3`).
  - Dołączony transport akceptuje `outputFormat`, ale nie wszystkie formaty są dostępne w usłudze.
  - Wartości formatu wyjściowego odpowiadają formatom wyjściowym Microsoft Speech (w tym Ogg/WebM Opus).
  - Telegram `sendVoice` akceptuje OGG/MP3/M4A; należy użyć OpenAI/ElevenLabs, jeśli wymagane są wiadomości głosowe w gwarantowanym formacie Opus.
  - Jeśli skonfigurowany format wyjściowy Microsoft zawiedzie, OpenClaw ponawia próbę z użyciem MP3.
  - Jeśli nie ustawiono jawnego nadpisania głosu i używany jest domyślny głos angielski, OpenClaw automatycznie przełącza się na chiński głos neuronowy (`zh-CN-XiaoxiaoNeural`, ustawienia regionalne `zh-CN`), gdy tekst odpowiedzi zawiera głównie znaki CJK.

Formaty wyjściowe OpenAI i ElevenLabs są stałe dla każdego kanału, zgodnie z powyższą tabelą.

## Działanie automatycznego TTS

Gdy włączona jest opcja `messages.tts.auto`, OpenClaw:

- Pomija TTS, jeśli odpowiedź zawiera już ustrukturyzowane multimedia.
- Pomija bardzo krótkie odpowiedzi (poniżej 10 znaków).
- Podsumowuje długie odpowiedzi, gdy podsumowania są włączone, używając
  `summaryModel` (lub `agents.defaults.model.primary`).
- Dołącza wygenerowany dźwięk do odpowiedzi.
- W trybie `mode: "final"` nadal wysyła wyłącznie dźwięk TTS dla strumieniowanych odpowiedzi końcowych
  po zakończeniu strumienia tekstowego; wygenerowane multimedia przechodzą tę samą
  normalizację multimediów kanału co zwykłe załączniki odpowiedzi.

Jeśli odpowiedź przekracza `maxLength`, OpenClaw nigdy nie pomija całkowicie dźwięku:

- **Podsumowanie włączone** (domyślnie) i dostępny jest model podsumowujący: podsumowuje
  tekst do około `maxLength` znaków, a następnie syntetyzuje podsumowanie.
- **Podsumowanie wyłączone**, podsumowanie kończy się niepowodzeniem lub nie jest dostępny klucz API
  dla modelu podsumowującego: skraca tekst do `maxLength` znaków i syntetyzuje
  skrócony tekst.

```text
Odpowiedź -> TTS włączone?
  nie -> wyślij tekst
  tak -> zawiera multimedia / jest krótka?
          tak -> wyślij tekst
          nie -> długość > limit?
                   nie -> TTS -> dołącz dźwięk
                   tak -> podsumowanie włączone i dostępne?
                            nie -> skróć -> TTS -> dołącz dźwięk
                            tak -> podsumuj -> TTS -> dołącz dźwięk
```

## Dokumentacja pól

<AccordionGroup>
  <Accordion title="Najwyższy poziom messages.tts.*">
    <ParamField path="auto" type='"off" | "always" | "inbound" | "tagged"'>
      Tryb automatycznego TTS. `inbound` wysyła dźwięk tylko po przychodzącej wiadomości głosowej; `tagged` wysyła dźwięk tylko wtedy, gdy odpowiedź zawiera dyrektywy `[[tts:...]]` lub blok `[[tts:text]]`.
    </ParamField>
    <ParamField path="enabled" type="boolean" deprecated>
      Starszy przełącznik. `openclaw doctor --fix` migruje go do `auto`.
    </ParamField>
    <ParamField path="mode" type='"final" | "all"' default="final">
      `"all"` uwzględnia odpowiedzi narzędzi/bloków oprócz odpowiedzi końcowych.
    </ParamField>
    <ParamField path="provider" type="string">
      Identyfikator dostawcy syntezy mowy. Jeśli nie jest ustawiony, OpenClaw używa pierwszego skonfigurowanego dostawcy zgodnie z kolejnością automatycznego wyboru w rejestrze. Starsza wartość `provider: "edge"` jest przepisywana na `"microsoft"` przez `openclaw doctor --fix`.
    </ParamField>
    <ParamField path="persona" type="string">
      Identyfikator aktywnej persony z `personas`. Normalizowany do małych liter.
    </ParamField>
    <ParamField path="personas.<id>" type="object">
      Stała tożsamość głosowa. Pola: `label`, `description`, `provider`, `fallbackPolicy`, `prompt`, `providers.<provider>`. Zobacz [Persony](#personas).
    </ParamField>
    <ParamField path="summaryModel" type="string">
      Ekonomiczny model do automatycznego podsumowywania; domyślnie `agents.defaults.model.primary`. Akceptuje `provider/model` lub skonfigurowany alias modelu.
    </ParamField>
    <ParamField path="modelOverrides" type="object">
      Zezwala modelowi na generowanie dyrektyw TTS. `enabled` ma domyślnie wartość `true`; `allowProvider` ma domyślnie wartość `false`.
    </ParamField>
    <ParamField path="providers.<id>" type="object">
      Ustawienia należące do dostawcy, indeksowane według identyfikatora dostawcy syntezy mowy. Starsze bezpośrednie bloki (`messages.tts.openai`, `.elevenlabs`, `.microsoft`, `.edge`) są przepisywane przez `openclaw doctor --fix`; należy zatwierdzać tylko `messages.tts.providers.<id>`.
    </ParamField>
    <ParamField path="maxTextLength" type="number" default="4096">
      Bezwzględny limit liczby znaków wejściowych TTS. `/tts audio`, `tts.convert` i `tts.speak` kończą się niepowodzeniem po jego przekroczeniu.
    </ParamField>
    <ParamField path="timeoutMs" type="number" default="30000">
      Limit czasu żądania w milisekundach. Ustawiona wartość `timeoutMs` dla pojedynczego wywołania (narzędzie agenta, gateway) ma pierwszeństwo; w przeciwnym razie jawnie skonfigurowana wartość `messages.tts.timeoutMs` ma pierwszeństwo przed dowolną wartością domyślną dostawcy zdefiniowaną przez plugin.
    </ParamField>
    <ParamField path="prefsPath" type="string">
      Zastępuje lokalną ścieżkę do pliku JSON preferencji (dostawca/limit/podsumowanie). Domyślnie `~/.openclaw/settings/tts.json`.
    </ParamField>
  </Accordion>

  <Accordion title="Azure Speech">
    <ParamField path="apiKey" type="string">Zmienna środowiskowa: `AZURE_SPEECH_KEY`, `AZURE_SPEECH_API_KEY` lub `SPEECH_KEY`.</ParamField>
    <ParamField path="region" type="string">Region Azure Speech (np. `eastus`). Zmienna środowiskowa: `AZURE_SPEECH_REGION` lub `SPEECH_REGION`.</ParamField>
    <ParamField path="endpoint" type="string">Opcjonalne zastąpienie punktu końcowego Azure Speech (alias `baseUrl`).</ParamField>
    <ParamField path="speakerVoice" type="string">ShortName głosu Azure. Domyślnie `en-US-JennyNeural`. Starszy alias: `voice`.</ParamField>
    <ParamField path="lang" type="string">Kod języka SSML. Domyślnie `en-US`.</ParamField>
    <ParamField path="outputFormat" type="string">Wartość `X-Microsoft-OutputFormat` usługi Azure dla standardowego dźwięku. Domyślnie `audio-24khz-48kbitrate-mono-mp3`.</ParamField>
    <ParamField path="voiceNoteOutputFormat" type="string">Wartość `X-Microsoft-OutputFormat` usługi Azure dla wyjściowej notatki głosowej. Domyślnie `ogg-24khz-16bit-mono-opus`.</ParamField>
  </Accordion>

  <Accordion title="ElevenLabs">
    <ParamField path="apiKey" type="string">W razie braku używa `ELEVENLABS_API_KEY` lub `XI_API_KEY`.</ParamField>
    <ParamField path="model" type="string">Identyfikator modelu. Domyślnie `eleven_multilingual_v2`. Starsze identyfikatory `eleven_turbo_v2_5`/`eleven_turbo_v2` są normalizowane do odpowiadającego modelu `flash`.</ParamField>
    <ParamField path="speakerVoiceId" type="string">Identyfikator głosu ElevenLabs. Domyślnie `pMsXgVXv3BLzUgSXRplE`. Starszy alias: `voiceId`.</ParamField>
    <ParamField path="voiceSettings" type="object">
      `stability`, `similarityBoost`, `style` (każde `0..1`, wartości domyślne `0.5`/`0.75`/`0`), `useSpeakerBoost` (`true|false`, domyślnie `true`), `speed` (`0.5..2.0`, domyślnie `1.0`).
    </ParamField>
    <ParamField path="applyTextNormalization" type='"auto" | "on" | "off"'>Tryb normalizacji tekstu.</ParamField>
    <ParamField path="languageCode" type="string">Dwuliterowy kod ISO 639-1 (np. `en`, `de`).</ParamField>
    <ParamField path="seed" type="number">Liczba całkowita `0..4294967295` zapewniająca deterministyczność w miarę możliwości.</ParamField>
    <ParamField path="baseUrl" type="string">Zastępuje bazowy adres URL interfejsu API ElevenLabs.</ParamField>
  </Accordion>

  <Accordion title="Google Gemini">
    <ParamField path="apiKey" type="string">Wartość zastępcza to `GEMINI_API_KEY` / `GOOGLE_API_KEY`. W przypadku pominięcia TTS może ponownie użyć `models.providers.google.apiKey` przed zastosowaniem wartości zastępczej ze środowiska.</ParamField>
    <ParamField path="model" type="string">Model TTS Gemini. Domyślnie `gemini-3.1-flash-tts-preview`.</ParamField>
    <ParamField path="speakerVoice" type="string">Nazwa gotowego głosu Gemini. Domyślnie `Kore`. Starsze aliasy: `voiceName`, `voice`.</ParamField>
    <ParamField path="audioProfile" type="string">Opis stylu w języku naturalnym dodawany przed tekstem mówionym.</ParamField>
    <ParamField path="speakerName" type="string">Opcjonalna etykieta mówcy dodawana przed tekstem mówionym, gdy prompt używa nazwanego mówcy.</ParamField>
    <ParamField path="promptTemplate" type='"audio-profile-v1"'>Ustaw na `audio-profile-v1`, aby opakować aktywne pola promptu persony w deterministyczną strukturę promptu TTS Gemini.</ParamField>
    <ParamField path="personaPrompt" type="string">Dodatkowy tekst promptu persony specyficzny dla Google, dołączany do uwag reżyserskich szablonu.</ParamField>
    <ParamField path="baseUrl" type="string">Akceptowane jest tylko `https://generativelanguage.googleapis.com`.</ParamField>
  </Accordion>

  <Accordion title="Gradium">
    <ParamField path="apiKey" type="string">Środowisko: `GRADIUM_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Adres URL HTTPS API Gradium na `api.gradium.ai`. Domyślnie `https://api.gradium.ai`.</ParamField>
    <ParamField path="speakerVoiceId" type="string">Domyślnie Emma (`YTpq7expH9539ERJ`). Starszy alias: `voiceId`.</ParamField>
  </Accordion>

  <Accordion title="Inworld">
    ### Główny Inworld

    <ParamField path="apiKey" type="string">Środowisko: `INWORLD_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Domyślnie `https://api.inworld.ai`.</ParamField>
    <ParamField path="modelId" type="string">Domyślnie `inworld-tts-1.5-max`. Także: `inworld-tts-1.5-mini`, `inworld-tts-1-max`, `inworld-tts-1`.</ParamField>
    <ParamField path="speakerVoiceId" type="string">Domyślnie `Sarah`. Starszy alias: `voiceId`.</ParamField>
    <ParamField path="temperature" type="number">Temperatura próbkowania `0..2` (z wyłączeniem 0).</ParamField>

  </Accordion>

  <Accordion title="Lokalny CLI (tts-local-cli)">
    <ParamField path="command" type="string">Lokalny plik wykonywalny lub ciąg polecenia dla TTS w CLI.</ParamField>
    <ParamField path="args" type="string[]">Argumenty polecenia. Obsługuje symbole zastępcze `{{Text}}`, `{{OutputPath}}`, `{{OutputDir}}`, `{{OutputBase}}`.</ParamField>
    <ParamField path="outputFormat" type='"mp3" | "opus" | "wav"'>Oczekiwany format wyjściowy CLI. Domyślnie `mp3` dla załączników audio.</ParamField>
    <ParamField path="timeoutMs" type="number">Limit czasu polecenia w milisekundach. Domyślnie `120000`.</ParamField>
    <ParamField path="cwd" type="string">Opcjonalny katalog roboczy polecenia.</ParamField>
    <ParamField path="env" type="Record<string, string>">Opcjonalne nadpisania środowiska dla polecenia.</ParamField>

    Standardowe wyjście polecenia oraz wygenerowany lub przekonwertowany dźwięk są ograniczone do 50 MiB. Diagnostyczne standardowe wyjście błędów jest ograniczone do 1 MiB. OpenClaw kończy polecenie i zgłasza niepowodzenie syntezy po przekroczeniu któregokolwiek limitu.

  </Accordion>

  <Accordion title="Microsoft (bez klucza API)">
    <ParamField path="enabled" type="boolean" default="true">Zezwala na korzystanie z syntezy mowy Microsoft.</ParamField>
    <ParamField path="speakerVoice" type="string">Nazwa głosu neuronowego Microsoft (np. `en-US-MichelleNeural`). Starszy alias: `voice`. Jeśli używany jest domyślny głos angielski, a tekst odpowiedzi jest zdominowany przez znaki CJK, OpenClaw automatycznie przełącza się na `zh-CN-XiaoxiaoNeural`.</ParamField>
    <ParamField path="lang" type="string">Kod języka (np. `en-US`).</ParamField>
    <ParamField path="outputFormat" type="string">Format wyjściowy Microsoft. Domyślnie `audio-24khz-48kbitrate-mono-mp3`. Nie wszystkie formaty są obsługiwane przez dołączony transport oparty na Edge.</ParamField>
    <ParamField path="rate / pitch / volume" type="string">Ciągi procentowe (np. `+10%`, `-5%`).</ParamField>
    <ParamField path="saveSubtitles" type="boolean">Zapisuje napisy JSON obok pliku audio.</ParamField>
    <ParamField path="proxy" type="string">Adres URL serwera proxy dla żądań syntezy mowy Microsoft.</ParamField>
    <ParamField path="timeoutMs" type="number">Nadpisanie limitu czasu żądania (ms).</ParamField>
    <ParamField path="edge.*" type="object" deprecated>Starszy alias. Uruchom `openclaw doctor --fix`, aby przepisać utrwaloną konfigurację na `providers.microsoft`.</ParamField>
  </Accordion>

  <Accordion title="MiniMax">
    <ParamField path="apiKey" type="string">Wartość zastępcza to `MINIMAX_API_KEY`. Uwierzytelnianie Token Plan za pomocą `MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY` lub `MINIMAX_CODING_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Domyślnie `https://api.minimax.io`. Środowisko: `MINIMAX_API_HOST`.</ParamField>
    <ParamField path="model" type="string">Domyślnie `speech-2.8-hd`. Środowisko: `MINIMAX_TTS_MODEL`.</ParamField>
    <ParamField path="speakerVoiceId" type="string">Domyślnie `English_expressive_narrator`. Środowisko: `MINIMAX_TTS_VOICE_ID`. Starszy alias: `voiceId`.</ParamField>
    <ParamField path="speed" type="number">`0.5..2.0`. Domyślnie `1.0`.</ParamField>
    <ParamField path="vol" type="number">`(0, 10]`. Domyślnie `1.0`.</ParamField>
    <ParamField path="pitch" type="number">Liczba całkowita `-12..12`. Domyślnie `0`. Wartości ułamkowe są obcinane przed wysłaniem żądania.</ParamField>
  </Accordion>

  <Accordion title="OpenAI">
    <ParamField path="apiKey" type="string">Wartość zastępcza to `OPENAI_API_KEY`.</ParamField>
    <ParamField path="model" type="string">Identyfikator modelu TTS OpenAI. Domyślnie `gpt-4o-mini-tts`.</ParamField>
    <ParamField path="speakerVoice" type="string">Nazwa głosu (np. `alloy`, `cedar`). Domyślnie `coral`. Starszy alias: `voice`.</ParamField>
    <ParamField path="instructions" type="string">Jawne pole OpenAI `instructions`. Po jego ustawieniu pola promptu persony **nie** są mapowane automatycznie.</ParamField>
    <ParamField path="extraBody / extra_body" type="Record<string, unknown>">Dodatkowe pola JSON scalane z treściami żądań `/audio/speech` po wygenerowaniu pól TTS OpenAI. Należy ich używać w przypadku punktów końcowych zgodnych z OpenAI, takich jak Kokoro, które wymagają kluczy specyficznych dla dostawcy, np. `lang`; niebezpieczne klucze prototypu są ignorowane.</ParamField>
    <ParamField path="baseUrl" type="string">
      Nadpisuje punkt końcowy TTS OpenAI. Kolejność rozstrzygania: konfiguracja → `OPENAI_TTS_BASE_URL` → `https://api.openai.com/v1`. Wartości inne niż domyślne są traktowane jako punkty końcowe TTS zgodne z OpenAI, dlatego akceptowane są niestandardowe nazwy modeli i głosów, a `speed` traci kontrolę zakresu `0.25..4.0`.
    </ParamField>
  </Accordion>

  <Accordion title="OpenRouter">
    <ParamField path="apiKey" type="string">Środowisko: `OPENROUTER_API_KEY`. Może ponownie użyć `models.providers.openrouter.apiKey`.</ParamField>
    <ParamField path="baseUrl" type="string">Domyślnie `https://openrouter.ai/api/v1`. Starsze `https://openrouter.ai/v1` jest normalizowane.</ParamField>
    <ParamField path="model" type="string">Domyślnie `hexgrad/kokoro-82m`. Alias: `modelId`.</ParamField>
    <ParamField path="speakerVoice" type="string">Domyślnie `af_alloy`. Starsze aliasy: `voice`, `voiceId`.</ParamField>
    <ParamField path="responseFormat" type='"mp3" | "pcm"'>Domyślnie `mp3`.</ParamField>
    <ParamField path="speed" type="number">Natywne dla dostawcy nadpisanie szybkości.</ParamField>
  </Accordion>

  <Accordion title="Volcengine (BytePlus Seed Speech)">
    <ParamField path="apiKey" type="string">Środowisko: `VOLCENGINE_TTS_API_KEY` lub `BYTEPLUS_SEED_SPEECH_API_KEY`.</ParamField>
    <ParamField path="resourceId" type="string">Domyślnie `seed-tts-1.0`. Środowisko: `VOLCENGINE_TTS_RESOURCE_ID`. Użyj `seed-tts-2.0`, jeśli projekt ma uprawnienie do TTS 2.0.</ParamField>
    <ParamField path="appKey" type="string">Nagłówek klucza aplikacji. Domyślnie `aGjiRDfUWi`. Środowisko: `VOLCENGINE_TTS_APP_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Nadpisuje punkt końcowy HTTP TTS Seed Speech. Środowisko: `VOLCENGINE_TTS_BASE_URL`.</ParamField>
    <ParamField path="speakerVoice" type="string">Typ głosu. Domyślnie `en_female_anna_mars_bigtts`. Środowisko: `VOLCENGINE_TTS_VOICE`. Starszy alias: `voice`.</ParamField>
    <ParamField path="speedRatio" type="number">Natywny dla dostawcy współczynnik szybkości, `0.2..3`.</ParamField>
    <ParamField path="emotion" type="string">Natywna dla dostawcy etykieta emocji.</ParamField>
    <ParamField path="appId / token / cluster" type="string" deprecated">Starsze pola Volcengine Speech Console. Środowisko: `VOLCENGINE_TTS_APPID`, `VOLCENGINE_TTS_TOKEN`, `VOLCENGINE_TTS_CLUSTER` (domyślnie `volcano_tts`).</ParamField>
  </Accordion>

  <Accordion title="xAI">
    <ParamField path="apiKey" type="string">Środowisko: `XAI_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Domyślnie `https://api.x.ai/v1`. Środowisko: `XAI_BASE_URL`.</ParamField>
    <ParamField path="speakerVoiceId" type="string">Domyślnie `eve`. Przy uwierzytelnieniu `openclaw infer tts voices --provider xai` pobiera bieżący wbudowany katalog; bez uwierzytelnienia wyświetla zapasowe opcje offline: `ara`, `eve`, `leo`, `rex` i `sal`. Identyfikatory niestandardowych głosów konta są przekazywane dalej, nawet jeśli nie występują na wbudowanej liście. Starszy alias: `voiceId`.</ParamField>
    <ParamField path="language" type="string">Kod języka BCP-47 lub `auto`. Domyślnie `en`.</ParamField>
    <ParamField path="responseFormat" type='"mp3" | "wav" | "pcm" | "mulaw" | "alaw"'>Domyślnie `mp3`.</ParamField>
    <ParamField path="speed" type="number">Natywne dla dostawcy nadpisanie szybkości, `0.7..1.5`.</ParamField>
  </Accordion>

  <Accordion title="Xiaomi MiMo">
    <ParamField path="apiKey" type="string">Środowisko: `XIAOMI_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Domyślnie `https://api.xiaomimimo.com/v1`. Środowisko: `XIAOMI_BASE_URL`.</ParamField>
    <ParamField path="model" type="string">Domyślnie `mimo-v2.5-tts`. Środowisko: `XIAOMI_TTS_MODEL`. Obsługuje również `mimo-v2-tts` i `mimo-v2.5-tts-voicedesign`.</ParamField>
    <ParamField path="speakerVoice" type="string">Domyślnie `mimo_default` dla modeli z gotowymi głosami. Środowisko: `XIAOMI_TTS_VOICE`. Starszy alias: `voice`. Nie jest wysyłane dla `mimo-v2.5-tts-voicedesign`.</ParamField>
    <ParamField path="format" type='"mp3" | "wav"'>Domyślnie `mp3`. Środowisko: `XIAOMI_TTS_FORMAT`.</ParamField>
    <ParamField path="style" type="string">Opcjonalna instrukcja stylu w języku naturalnym, wysyłana jako wiadomość użytkownika, lecz niewypowiadana. Dla `mimo-v2.5-tts-voicedesign` jest to prompt projektowania głosu; OpenClaw podaje wartość domyślną w przypadku pominięcia.</ParamField>
  </Accordion>
</AccordionGroup>

## Narzędzie agenta

Narzędzie `tts` konwertuje tekst na mowę i zwraca załącznik audio do
dostarczenia odpowiedzi. W Feishu, Matrix, Telegram i WhatsApp dźwięk jest
dostarczany jako wiadomość głosowa zamiast załącznika plikowego. Feishu i
WhatsApp mogą transkodować na tej ścieżce dane wyjściowe TTS inne niż Opus, gdy
dostępne jest `ffmpeg`.

WhatsApp wysyła dźwięk przez Baileys jako notatkę głosową PTT (`audio` z
`ptt: true`) i wysyła widoczny tekst **oddzielnie** od dźwięku PTT, ponieważ
klienty nie zawsze wyświetlają podpisy notatek głosowych.

Narzędzie akceptuje opcjonalne pola `channel` i `timeoutMs`; `timeoutMs` to
limit czasu żądania dostawcy dla pojedynczego wywołania, podany w milisekundach. Wartości dla poszczególnych wywołań nadpisują
`messages.tts.timeoutMs`; skonfigurowane limity czasu TTS nadpisują każdą wartość domyślną
dostawcy określoną przez plugin.

## RPC Gateway

| Metoda            | Przeznaczenie                                      |
| ----------------- | -------------------------------------------------- |
| `tts.status`      | Odczytuje bieżący stan TTS i ostatnią próbę.       |
| `tts.enable`      | Ustawia lokalną preferencję automatyczną na `always`. |
| `tts.disable`     | Ustawia lokalną preferencję automatyczną na `off`. |
| `tts.convert`     | Jednorazowa konwersja tekstu → dźwięk.             |
| `tts.setProvider` | Ustawia lokalną preferencję dostawcy.              |
| `tts.personas`    | Wyświetla skonfigurowane persony i aktywną personę. |
| `tts.setPersona`  | Ustawia lokalną preferencję persony.               |
| `tts.providers`   | Wyświetla skonfigurowanych dostawców i ich stan.   |

## Łącza do usług

- [Przewodnik OpenAI dotyczący zamiany tekstu na mowę](https://platform.openai.com/docs/guides/text-to-speech)
- [Dokumentacja referencyjna OpenAI Audio API](https://platform.openai.com/docs/api-reference/audio)
- [Zamiana tekstu na mowę za pomocą interfejsu REST usługi Azure Speech](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech)
- [Dostawca Azure Speech](/pl/providers/azure-speech)
- [Zamiana tekstu na mowę w ElevenLabs](https://elevenlabs.io/docs/api-reference/text-to-speech)
- [Uwierzytelnianie w ElevenLabs](https://elevenlabs.io/docs/api-reference/authentication)
- [Gradium](/pl/providers/gradium)
- [Interfejs Inworld TTS API](https://docs.inworld.ai/tts/tts)
- [Interfejs MiniMax T2A v2 API](https://platform.minimaxi.com/document/T2A%20V2)
- [Interfejs HTTP API syntezy mowy Volcengine](/pl/providers/volcengine#text-to-speech)
- [Synteza mowy Xiaomi MiMo](/pl/providers/xiaomi#text-to-speech)
- [node-edge-tts](https://github.com/SchneeHertz/node-edge-tts)
- [Formaty wyjściowe mowy firmy Microsoft](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech#audio-outputs)
- [Zamiana tekstu na mowę w xAI](https://docs.x.ai/developers/rest-api-reference/inference/voice#text-to-speech-rest)

## Powiązane

- [Omówienie multimediów](/pl/tools/media-overview)
- [Generowanie muzyki](/pl/tools/music-generation)
- [Generowanie wideo](/pl/tools/video-generation)
- [Polecenia z ukośnikiem](/pl/tools/slash-commands)
- [Plugin połączeń głosowych](/pl/plugins/voice-call)
