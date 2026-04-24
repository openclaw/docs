---
read_when:
    - Włączanie text-to-speech dla odpowiedzi】【”】【analysis to=final code  omitted
    - Konfigurowanie providerów TTS lub limitów
    - Używanie poleceń /tts
summary: Text-to-speech (TTS) dla odpowiedzi wychodzących
title: Text-to-speech (TTS)
x-i18n:
    generated_at: "2026-04-24T09:38:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 935fec2325a08da6f4ecd8ba5a9b889cd265025c5c7ee43bc4e0da36c1003d8f
    source_path: tools/tts.md
    workflow: 15
---

OpenClaw może konwertować odpowiedzi wychodzące na audio przy użyciu ElevenLabs, Google Gemini, Microsoft, MiniMax, OpenAI lub xAI.
Działa wszędzie tam, gdzie OpenClaw może wysyłać audio.

## Obsługiwane usługi

- **ElevenLabs** (provider główny lub fallback)
- **Google Gemini** (provider główny lub fallback; używa Gemini API TTS)
- **Microsoft** (provider główny lub fallback; obecna dołączona implementacja używa `node-edge-tts`)
- **MiniMax** (provider główny lub fallback; używa API T2A v2)
- **OpenAI** (provider główny lub fallback; używany także do podsumowań)
- **xAI** (provider główny lub fallback; używa xAI TTS API)

### Uwagi dotyczące Microsoft speech

Dołączony provider Microsoft speech obecnie używa internetowej usługi
neural TTS Microsoft Edge przez bibliotekę `node-edge-tts`. Jest to usługa hostowana (nie
lokalna), używa endpointów Microsoft i nie wymaga klucza API.
`node-edge-tts` udostępnia opcje konfiguracji mowy i formaty wyjściowe, ale
nie wszystkie opcje są obsługiwane przez usługę. Starsza konfiguracja i dane wejściowe dyrektyw
używające `edge` nadal działają i są normalizowane do `microsoft`.

Ponieważ ta ścieżka to publiczna usługa internetowa bez opublikowanego SLA ani limitów,
traktuj ją jako best-effort. Jeśli potrzebujesz gwarantowanych limitów i wsparcia, użyj OpenAI
lub ElevenLabs.

## Opcjonalne klucze

Jeśli chcesz używać OpenAI, ElevenLabs, Google Gemini, MiniMax lub xAI:

- `ELEVENLABS_API_KEY` (lub `XI_API_KEY`)
- `GEMINI_API_KEY` (lub `GOOGLE_API_KEY`)
- `MINIMAX_API_KEY`
- `OPENAI_API_KEY`
- `XAI_API_KEY`

Microsoft speech **nie** wymaga klucza API.

Jeśli skonfigurowano wielu providerów, najpierw używany jest wybrany provider, a pozostali są opcjami fallback.
Auto-summary używa skonfigurowanego `summaryModel` (lub `agents.defaults.model.primary`),
więc ten provider również musi być uwierzytelniony, jeśli włączysz podsumowania.

## Linki do usług

- [Przewodnik OpenAI Text-to-Speech](https://platform.openai.com/docs/guides/text-to-speech)
- [Dokumentacja referencyjna OpenAI Audio API](https://platform.openai.com/docs/api-reference/audio)
- [ElevenLabs Text to Speech](https://elevenlabs.io/docs/api-reference/text-to-speech)
- [Uwierzytelnianie ElevenLabs](https://elevenlabs.io/docs/api-reference/authentication)
- [MiniMax T2A v2 API](https://platform.minimaxi.com/document/T2A%20V2)
- [node-edge-tts](https://github.com/SchneeHertz/node-edge-tts)
- [Formaty wyjściowe Microsoft Speech](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech#audio-outputs)
- [xAI Text to Speech](https://docs.x.ai/developers/rest-api-reference/inference/voice#text-to-speech-rest)

## Czy jest włączone domyślnie?

Nie. Auto‑TTS jest domyślnie **wyłączone**. Włącz je w konfiguracji przez
`messages.tts.auto` lub lokalnie przez `/tts on`.

Gdy `messages.tts.provider` nie jest ustawione, OpenClaw wybiera pierwszego skonfigurowanego
providera mowy zgodnie z kolejnością automatycznego wyboru w rejestrze.

## Konfiguracja

Konfiguracja TTS znajduje się w `messages.tts` w `openclaw.json`.
Pełny schemat znajdziesz w [Konfiguracji gateway](/pl/gateway/configuration).

### Minimalna konfiguracja (włączenie + provider)

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

### OpenAI jako główny z fallbackiem ElevenLabs

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "openai",
      summaryModel: "openai/gpt-4.1-mini",
      modelOverrides: {
        enabled: true,
      },
      providers: {
        openai: {
          apiKey: "openai_api_key",
          baseUrl: "https://api.openai.com/v1",
          model: "gpt-4o-mini-tts",
          voice: "alloy",
        },
        elevenlabs: {
          apiKey: "elevenlabs_api_key",
          baseUrl: "https://api.elevenlabs.io",
          voiceId: "voice_id",
          modelId: "eleven_multilingual_v2",
          seed: 42,
          applyTextNormalization: "auto",
          languageCode: "en",
          voiceSettings: {
            stability: 0.5,
            similarityBoost: 0.75,
            style: 0.0,
            useSpeakerBoost: true,
            speed: 1.0,
          },
        },
      },
    },
  },
}
```

### Microsoft jako główny (bez klucza API)

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
          rate: "+10%",
          pitch: "-5%",
        },
      },
    },
  },
}
```

### MiniMax jako główny

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "minimax",
      providers: {
        minimax: {
          apiKey: "minimax_api_key",
          baseUrl: "https://api.minimax.io",
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

### Google Gemini jako główny

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "google",
      providers: {
        google: {
          apiKey: "gemini_api_key",
          model: "gemini-3.1-flash-tts-preview",
          voiceName: "Kore",
        },
      },
    },
  },
}
```

Google Gemini TTS używa ścieżki klucza API Gemini. Klucz API z Google Cloud Console
ograniczony do Gemini API jest tutaj prawidłowy i jest to ten sam typ klucza używany
przez dołączonego providera generowania obrazów Google. Kolejność rozwiązywania to
`messages.tts.providers.google.apiKey` -> `models.providers.google.apiKey` ->
`GEMINI_API_KEY` -> `GOOGLE_API_KEY`.

### xAI jako główny

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "xai",
      providers: {
        xai: {
          apiKey: "xai_api_key",
          voiceId: "eve",
          language: "en",
          responseFormat: "mp3",
          speed: 1.0,
        },
      },
    },
  },
}
```

xAI TTS używa tej samej ścieżki `XAI_API_KEY` co dołączony provider modelu Grok.
Kolejność rozwiązywania to `messages.tts.providers.xai.apiKey` -> `XAI_API_KEY`.
Obecnie dostępne głosy live to `ara`, `eve`, `leo`, `rex`, `sal` i `una`; `eve` jest
domyślne. `language` akceptuje tag BCP-47 albo `auto`.

### Wyłącz Microsoft speech

```json5
{
  messages: {
    tts: {
      providers: {
        microsoft: {
          enabled: false,
        },
      },
    },
  },
}
```

### Własne limity + ścieżka prefs

```json5
{
  messages: {
    tts: {
      auto: "always",
      maxTextLength: 4000,
      timeoutMs: 30000,
      prefsPath: "~/.openclaw/settings/tts.json",
    },
  },
}
```

### Odpowiadaj audio tylko po przychodzącej wiadomości głosowej

```json5
{
  messages: {
    tts: {
      auto: "inbound",
    },
  },
}
```

### Wyłącz auto-summary dla długich odpowiedzi

```json5
{
  messages: {
    tts: {
      auto: "always",
    },
  },
}
```

Następnie uruchom:

```
/tts summary off
```

### Uwagi dotyczące pól

- `auto`: tryb auto‑TTS (`off`, `always`, `inbound`, `tagged`).
  - `inbound` wysyła audio tylko po przychodzącej wiadomości głosowej.
  - `tagged` wysyła audio tylko wtedy, gdy odpowiedź zawiera dyrektywy `[[tts:key=value]]` albo blok `[[tts:text]]...[[/tts:text]]`.
- `enabled`: starszy przełącznik (doctor migruje go do `auto`).
- `mode`: `"final"` (domyślnie) lub `"all"` (obejmuje odpowiedzi narzędzi/bloków).
- `provider`: identyfikator providera mowy, taki jak `"elevenlabs"`, `"google"`, `"microsoft"`, `"minimax"` lub `"openai"` (fallback jest automatyczny).
- Jeśli `provider` **nie jest ustawiony**, OpenClaw używa pierwszego skonfigurowanego providera mowy zgodnie z kolejnością automatycznego wyboru w rejestrze.
- Starsze `provider: "edge"` nadal działa i jest normalizowane do `microsoft`.
- `summaryModel`: opcjonalny tani model dla auto-summary; domyślnie `agents.defaults.model.primary`.
  - Akceptuje `provider/model` albo skonfigurowany alias modelu.
- `modelOverrides`: pozwala modelowi emitować dyrektywy TTS (domyślnie włączone).
  - `allowProvider` domyślnie ma wartość `false` (przełączanie providerów jest opcjonalne).
- `providers.<id>`: ustawienia należące do providera, kluczowane identyfikatorem providera mowy.
- Starsze bezpośrednie bloki providerów (`messages.tts.openai`, `messages.tts.elevenlabs`, `messages.tts.microsoft`, `messages.tts.edge`) są automatycznie migrowane podczas ładowania do `messages.tts.providers.<id>`.
- `maxTextLength`: twardy limit wejścia TTS (znaki). `/tts audio` kończy się błędem, jeśli zostanie przekroczony.
- `timeoutMs`: limit czasu żądania (ms).
- `prefsPath`: nadpisuje lokalną ścieżkę JSON prefs (provider/limit/summary).
- Wartości `apiKey` wracają do zmiennych env (`ELEVENLABS_API_KEY`/`XI_API_KEY`, `GEMINI_API_KEY`/`GOOGLE_API_KEY`, `MINIMAX_API_KEY`, `OPENAI_API_KEY`).
- `providers.elevenlabs.baseUrl`: nadpisuje bazowy URL API ElevenLabs.
- `providers.openai.baseUrl`: nadpisuje endpoint OpenAI TTS.
  - Kolejność rozwiązywania: `messages.tts.providers.openai.baseUrl` -> `OPENAI_TTS_BASE_URL` -> `https://api.openai.com/v1`
  - Wartości inne niż domyślna są traktowane jako endpointy TTS zgodne z OpenAI, więc akceptowane są własne nazwy modeli i głosów.
- `providers.elevenlabs.voiceSettings`:
  - `stability`, `similarityBoost`, `style`: `0..1`
  - `useSpeakerBoost`: `true|false`
  - `speed`: `0.5..2.0` (1.0 = normalnie)
- `providers.elevenlabs.applyTextNormalization`: `auto|on|off`
- `providers.elevenlabs.languageCode`: 2-literowy kod ISO 639-1 (np. `en`, `de`)
- `providers.elevenlabs.seed`: liczba całkowita `0..4294967295` (najlepszy możliwy determinizm)
- `providers.minimax.baseUrl`: nadpisuje bazowy URL API MiniMax (domyślnie `https://api.minimax.io`, env: `MINIMAX_API_HOST`).
- `providers.minimax.model`: model TTS (domyślnie `speech-2.8-hd`, env: `MINIMAX_TTS_MODEL`).
- `providers.minimax.voiceId`: identyfikator głosu (domyślnie `English_expressive_narrator`, env: `MINIMAX_TTS_VOICE_ID`).
- `providers.minimax.speed`: szybkość odtwarzania `0.5..2.0` (domyślnie 1.0).
- `providers.minimax.vol`: głośność `(0, 10]` (domyślnie 1.0; musi być większa od 0).
- `providers.minimax.pitch`: przesunięcie wysokości tonu `-12..12` (domyślnie 0).
- `providers.google.model`: model Gemini TTS (domyślnie `gemini-3.1-flash-tts-preview`).
- `providers.google.voiceName`: nazwa wbudowanego głosu Gemini (domyślnie `Kore`; akceptowane jest też `voice`).
- `providers.google.baseUrl`: nadpisuje bazowy URL Gemini API. Akceptowane jest tylko `https://generativelanguage.googleapis.com`.
  - Jeśli `messages.tts.providers.google.apiKey` zostanie pominięte, TTS może użyć ponownie `models.providers.google.apiKey` przed fallbackiem do env.
- `providers.xai.apiKey`: klucz API xAI TTS (env: `XAI_API_KEY`).
- `providers.xai.baseUrl`: nadpisuje bazowy URL xAI TTS (domyślnie `https://api.x.ai/v1`, env: `XAI_BASE_URL`).
- `providers.xai.voiceId`: identyfikator głosu xAI (domyślnie `eve`; obecnie dostępne głosy live: `ara`, `eve`, `leo`, `rex`, `sal`, `una`).
- `providers.xai.language`: kod języka BCP-47 albo `auto` (domyślnie `en`).
- `providers.xai.responseFormat`: `mp3`, `wav`, `pcm`, `mulaw` lub `alaw` (domyślnie `mp3`).
- `providers.xai.speed`: natywne dla providera nadpisanie szybkości.
- `providers.microsoft.enabled`: zezwala na użycie Microsoft speech (domyślnie `true`; bez klucza API).
- `providers.microsoft.voice`: nazwa głosu Microsoft neural (np. `en-US-MichelleNeural`).
- `providers.microsoft.lang`: kod języka (np. `en-US`).
- `providers.microsoft.outputFormat`: format wyjściowy Microsoft (np. `audio-24khz-48kbitrate-mono-mp3`).
  - Poprawne wartości znajdziesz w formatach wyjściowych Microsoft Speech; nie wszystkie formaty są obsługiwane przez dołączony transport oparty na Edge.
- `providers.microsoft.rate` / `providers.microsoft.pitch` / `providers.microsoft.volume`: ciągi procentowe (np. `+10%`, `-5%`).
- `providers.microsoft.saveSubtitles`: zapisuje napisy JSON obok pliku audio.
- `providers.microsoft.proxy`: URL proxy dla żądań Microsoft speech.
- `providers.microsoft.timeoutMs`: nadpisanie limitu czasu żądania (ms).
- `edge.*`: starszy alias tych samych ustawień Microsoft.

## Nadpisania sterowane przez model (domyślnie włączone)

Domyślnie model **może** emitować dyrektywy TTS dla pojedynczej odpowiedzi.
Gdy `messages.tts.auto` ma wartość `tagged`, te dyrektywy są wymagane, aby uruchomić audio.

Gdy ta funkcja jest włączona, model może emitować dyrektywy `[[tts:...]]`, aby nadpisać głos
dla pojedynczej odpowiedzi, oraz opcjonalny blok `[[tts:text]]...[[/tts:text]]`,
aby dostarczyć ekspresyjne tagi (śmiech, wskazówki śpiewu itd.), które powinny pojawić się
tylko w audio.

Dyrektywy `provider=...` są ignorowane, chyba że `modelOverrides.allowProvider: true`.

Przykładowy ładunek odpowiedzi:

```
Here you go.

[[tts:voiceId=pMsXgVXv3BLzUgSXRplE model=eleven_v3 speed=1.1]]
[[tts:text]](laughs) Read the song once more.[[/tts:text]]
```

Dostępne klucze dyrektyw (gdy są włączone):

- `provider` (identyfikator zarejestrowanego providera mowy, na przykład `openai`, `elevenlabs`, `google`, `minimax` lub `microsoft`; wymaga `allowProvider: true`)
- `voice` (głos OpenAI), `voiceName` / `voice_name` / `google_voice` (głos Google) albo `voiceId` (ElevenLabs / MiniMax / xAI)
- `model` (model OpenAI TTS, identyfikator modelu ElevenLabs albo model MiniMax) albo `google_model` (model Google TTS)
- `stability`, `similarityBoost`, `style`, `speed`, `useSpeakerBoost`
- `vol` / `volume` (głośność MiniMax, 0-10)
- `pitch` (wysokość tonu MiniMax, od -12 do 12)
- `applyTextNormalization` (`auto|on|off`)
- `languageCode` (ISO 639-1)
- `seed`

Wyłącz wszystkie nadpisania modelu:

```json5
{
  messages: {
    tts: {
      modelOverrides: {
        enabled: false,
      },
    },
  },
}
```

Opcjonalna lista dozwolonych (włącza przełączanie providerów przy zachowaniu konfigurowalności innych ustawień):

```json5
{
  messages: {
    tts: {
      modelOverrides: {
        enabled: true,
        allowProvider: true,
        allowSeed: false,
      },
    },
  },
}
```

## Preferencje per użytkownik

Polecenia slash zapisują lokalne nadpisania do `prefsPath` (domyślnie:
`~/.openclaw/settings/tts.json`, można nadpisać przez `OPENCLAW_TTS_PREFS` albo
`messages.tts.prefsPath`).

Zapisywane pola:

- `enabled`
- `provider`
- `maxLength` (próg podsumowania; domyślnie 1500 znaków)
- `summarize` (domyślnie `true`)

Nadpisują one `messages.tts.*` dla tego hosta.

## Formaty wyjściowe (stałe)

- **Feishu / Matrix / Telegram / WhatsApp**: wiadomość głosowa Opus (`opus_48000_64` z ElevenLabs, `opus` z OpenAI).
  - 48 kHz / 64 kb/s to dobry kompromis dla wiadomości głosowych.
- **Inne kanały**: MP3 (`mp3_44100_128` z ElevenLabs, `mp3` z OpenAI).
  - 44,1 kHz / 128 kb/s to domyślna równowaga dla wyrazistości mowy.
- **MiniMax**: MP3 (model `speech-2.8-hd`, częstotliwość próbkowania 32 kHz). Format notatki głosowej nie jest obsługiwany natywnie; użyj OpenAI lub ElevenLabs, jeśli potrzebujesz gwarantowanych wiadomości głosowych Opus.
- **Google Gemini**: Gemini API TTS zwraca surowe PCM 24 kHz. OpenClaw opakowuje je jako WAV dla załączników audio i zwraca PCM bezpośrednio dla Talk/telefonii. Natywny format notatki głosowej Opus nie jest obsługiwany przez tę ścieżkę.
- **xAI**: domyślnie MP3; `responseFormat` może mieć wartość `mp3`, `wav`, `pcm`, `mulaw` albo `alaw`. OpenClaw używa wsadowego REST endpointu TTS xAI i zwraca kompletny załącznik audio; streamingowy WebSocket TTS xAI nie jest używany przez tę ścieżkę providera. Natywny format notatki głosowej Opus nie jest obsługiwany przez tę ścieżkę.
- **Microsoft**: używa `microsoft.outputFormat` (domyślnie `audio-24khz-48kbitrate-mono-mp3`).
  - Dołączony transport akceptuje `outputFormat`, ale nie wszystkie formaty są dostępne z poziomu usługi.
  - Wartości formatu wyjściowego są zgodne z formatami wyjściowymi Microsoft Speech (w tym Ogg/WebM Opus).
  - Telegram `sendVoice` akceptuje OGG/MP3/M4A; użyj OpenAI/ElevenLabs, jeśli potrzebujesz
    gwarantowanych wiadomości głosowych Opus.
  - Jeśli skonfigurowany format wyjściowy Microsoft zakończy się błędem, OpenClaw ponawia próbę z MP3.

Formaty wyjściowe OpenAI/ElevenLabs są stałe dla każdego kanału (patrz wyżej).

## Zachowanie auto-TTS

Gdy funkcja jest włączona, OpenClaw:

- pomija TTS, jeśli odpowiedź już zawiera media albo dyrektywę `MEDIA:`.
- pomija bardzo krótkie odpowiedzi (< 10 znaków).
- podsumowuje długie odpowiedzi, gdy funkcja jest włączona, używając `agents.defaults.model.primary` (albo `summaryModel`).
- dołącza wygenerowane audio do odpowiedzi.

Jeśli odpowiedź przekracza `maxLength`, a summary jest wyłączone (albo brak klucza API dla
modelu podsumowania), audio
jest pomijane i wysyłana jest zwykła odpowiedź tekstowa.

## Diagram przepływu

```
Reply -> TTS enabled?
  no  -> wyślij tekst
  yes -> ma media / MEDIA: / jest krótka?
          yes -> wyślij tekst
          no  -> długość > limit?
                   no  -> TTS -> dołącz audio
                   yes -> summary włączone?
                            no  -> wyślij tekst
                            yes -> podsumuj (summaryModel lub agents.defaults.model.primary)
                                      -> TTS -> dołącz audio
```

## Użycie polecenia slash

Istnieje jedno polecenie: `/tts`.
Szczegóły włączania znajdziesz w [Poleceniach slash](/pl/tools/slash-commands).

Uwaga dla Discord: `/tts` to wbudowane polecenie Discord, więc OpenClaw rejestruje
tam jako natywne polecenie `/voice`. Tekstowe `/tts ...` nadal działa.

```
/tts off
/tts on
/tts status
/tts provider openai
/tts limit 2000
/tts summary off
/tts audio Hello from OpenClaw
```

Uwagi:

- Polecenia wymagają autoryzowanego nadawcy (nadal obowiązują reguły allowlist/owner).
- Musi być włączone `commands.text` albo rejestracja natywnych poleceń.
- Konfiguracja `messages.tts.auto` akceptuje `off|always|inbound|tagged`.
- `/tts on` zapisuje lokalną preferencję TTS jako `always`; `/tts off` zapisuje ją jako `off`.
- Użyj konfiguracji, jeśli chcesz domyślnych wartości `inbound` albo `tagged`.
- `limit` i `summary` są zapisywane w lokalnych prefs, a nie w głównej konfiguracji.
- `/tts audio` generuje jednorazową odpowiedź audio (nie włącza TTS).
- `/tts status` zawiera widoczność fallbacku dla ostatniej próby:
  - fallback po sukcesie: `Fallback: <primary> -> <used>` plus `Attempts: ...`
  - błąd: `Error: ...` plus `Attempts: ...`
  - szczegółowa diagnostyka: `Attempt details: provider:outcome(reasonCode) latency`
- Błędy API OpenAI i ElevenLabs zawierają teraz sparsowane szczegóły błędu providera oraz request id (gdy provider je zwraca), co jest ujawniane w błędach/logach TTS.

## Narzędzie agenta

Narzędzie `tts` konwertuje tekst na mowę i zwraca załącznik audio do
dostarczenia w odpowiedzi. Gdy kanałem jest Feishu, Matrix, Telegram albo WhatsApp,
audio jest dostarczane jako wiadomość głosowa, a nie jako załącznik pliku.
Akceptuje opcjonalne pola `channel` i `timeoutMs`; `timeoutMs` to
limit czasu żądania do providera dla pojedynczego wywołania, w milisekundach.

## RPC gateway

Metody gateway:

- `tts.status`
- `tts.enable`
- `tts.disable`
- `tts.convert`
- `tts.setProvider`
- `tts.providers`

## Powiązane

- [Przegląd mediów](/pl/tools/media-overview)
- [Generowanie muzyki](/pl/tools/music-generation)
- [Generowanie wideo](/pl/tools/video-generation)
