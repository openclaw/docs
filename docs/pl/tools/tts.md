---
read_when:
    - Włączanie text-to-speech dla odpowiedzi
    - Konfigurowanie dostawców TTS lub limitów
    - Używanie poleceń /tts
summary: Text-to-speech (TTS) dla odpowiedzi wychodzących
title: Text-to-Speech
x-i18n:
    generated_at: "2026-04-08T06:02:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6e0fbcaf61282733c134f682e05a71f94d2169c03a85131ce9ad233c71a1e533
    source_path: tools/tts.md
    workflow: 15
---

# Text-to-speech (TTS)

OpenClaw może konwertować odpowiedzi wychodzące na dźwięk przy użyciu ElevenLabs, Microsoft, MiniMax lub OpenAI.
Działa wszędzie tam, gdzie OpenClaw może wysyłać audio.

## Obsługiwane usługi

- **ElevenLabs** (główny lub zapasowy dostawca)
- **Microsoft** (główny lub zapasowy dostawca; obecna dołączona implementacja używa `node-edge-tts`)
- **MiniMax** (główny lub zapasowy dostawca; używa API T2A v2)
- **OpenAI** (główny lub zapasowy dostawca; używany także do podsumowań)

### Uwagi dotyczące mowy Microsoft

Dołączony dostawca mowy Microsoft obecnie używa usługi neural TTS online Microsoft Edge
przez bibliotekę `node-edge-tts`. Jest to usługa hostowana (nie
lokalna), korzysta z endpointów Microsoft i nie wymaga klucza API.
`node-edge-tts` udostępnia opcje konfiguracji mowy i formaty wyjściowe, ale
nie wszystkie opcje są obsługiwane przez usługę. Starsza konfiguracja i dane wejściowe dyrektyw
używające `edge` nadal działają i są normalizowane do `microsoft`.

Ponieważ ta ścieżka korzysta z publicznej usługi webowej bez opublikowanego SLA ani limitów,
należy traktować ją jako best-effort. Jeśli potrzebujesz gwarantowanych limitów i wsparcia, użyj OpenAI
lub ElevenLabs.

## Opcjonalne klucze

Jeśli chcesz używać OpenAI, ElevenLabs lub MiniMax:

- `ELEVENLABS_API_KEY` (lub `XI_API_KEY`)
- `MINIMAX_API_KEY`
- `OPENAI_API_KEY`

Mowa Microsoft **nie** wymaga klucza API.

Jeśli skonfigurowano wielu dostawców, najpierw używany jest wybrany dostawca, a pozostali pełnią rolę opcji zapasowych.
Automatyczne podsumowanie używa skonfigurowanego `summaryModel` (lub `agents.defaults.model.primary`),
więc ten dostawca również musi być uwierzytelniony, jeśli włączysz podsumowania.

## Linki do usług

- [Przewodnik OpenAI Text-to-Speech](https://platform.openai.com/docs/guides/text-to-speech)
- [Dokumentacja referencyjna OpenAI Audio API](https://platform.openai.com/docs/api-reference/audio)
- [ElevenLabs Text to Speech](https://elevenlabs.io/docs/api-reference/text-to-speech)
- [Uwierzytelnianie ElevenLabs](https://elevenlabs.io/docs/api-reference/authentication)
- [MiniMax T2A v2 API](https://platform.minimaxi.com/document/T2A%20V2)
- [node-edge-tts](https://github.com/SchneeHertz/node-edge-tts)
- [Formaty wyjściowe Microsoft Speech](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech#audio-outputs)

## Czy jest włączone domyślnie?

Nie. Auto‑TTS jest domyślnie **wyłączone**. Włącz je w konfiguracji przez
`messages.tts.auto` lub lokalnie przez `/tts on`.

Gdy `messages.tts.provider` nie jest ustawione, OpenClaw wybiera pierwszego skonfigurowanego
dostawcę mowy według kolejności automatycznego wyboru w rejestrze.

## Konfiguracja

Konfiguracja TTS znajduje się pod `messages.tts` w `openclaw.json`.
Pełny schemat znajduje się w [Konfiguracja Gateway](/pl/gateway/configuration).

### Minimalna konfiguracja (włączenie + dostawca)

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

### OpenAI jako główny dostawca z ElevenLabs jako zapasowym

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

### Microsoft jako główny dostawca (bez klucza API)

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

### MiniMax jako główny dostawca

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

### Wyłączenie mowy Microsoft

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

### Wyłączenie automatycznego podsumowania dla długich odpowiedzi

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
  - `tagged` wysyła audio tylko wtedy, gdy odpowiedź zawiera tagi `[[tts]]`.
- `enabled`: starszy przełącznik (doctor migruje go do `auto`).
- `mode`: `"final"` (domyślnie) lub `"all"` (obejmuje odpowiedzi narzędzi/bloków).
- `provider`: id dostawcy mowy, takie jak `"elevenlabs"`, `"microsoft"`, `"minimax"` lub `"openai"` (fallback jest automatyczny).
- Jeśli `provider` **nie jest ustawione**, OpenClaw używa pierwszego skonfigurowanego dostawcy mowy według kolejności automatycznego wyboru w rejestrze.
- Starsze `provider: "edge"` nadal działa i jest normalizowane do `microsoft`.
- `summaryModel`: opcjonalny tani model do automatycznego podsumowania; domyślnie `agents.defaults.model.primary`.
  - Akceptuje `provider/model` lub alias skonfigurowanego modelu.
- `modelOverrides`: pozwala modelowi emitować dyrektywy TTS (domyślnie włączone).
  - `allowProvider` domyślnie ma wartość `false` (przełączanie dostawcy jest opcjonalne).
- `providers.<id>`: ustawienia należące do dostawcy, kluczowane przez id dostawcy mowy.
- Starsze bezpośrednie bloki dostawców (`messages.tts.openai`, `messages.tts.elevenlabs`, `messages.tts.microsoft`, `messages.tts.edge`) są automatycznie migrowane podczas ładowania do `messages.tts.providers.<id>`.
- `maxTextLength`: twardy limit danych wejściowych TTS (znaki). `/tts audio` kończy się błędem po jego przekroczeniu.
- `timeoutMs`: limit czasu żądania (ms).
- `prefsPath`: nadpisuje lokalną ścieżkę do JSON prefs (dostawca/limit/podsumowanie).
- Wartości `apiKey` korzystają awaryjnie ze zmiennych środowiskowych (`ELEVENLABS_API_KEY`/`XI_API_KEY`, `MINIMAX_API_KEY`, `OPENAI_API_KEY`).
- `providers.elevenlabs.baseUrl`: nadpisuje bazowy URL API ElevenLabs.
- `providers.openai.baseUrl`: nadpisuje endpoint OpenAI TTS.
  - Kolejność rozwiązywania: `messages.tts.providers.openai.baseUrl` -> `OPENAI_TTS_BASE_URL` -> `https://api.openai.com/v1`
  - Wartości inne niż domyślne są traktowane jako endpointy TTS zgodne z OpenAI, więc akceptowane są niestandardowe nazwy modeli i głosów.
- `providers.elevenlabs.voiceSettings`:
  - `stability`, `similarityBoost`, `style`: `0..1`
  - `useSpeakerBoost`: `true|false`
  - `speed`: `0.5..2.0` (1.0 = normalnie)
- `providers.elevenlabs.applyTextNormalization`: `auto|on|off`
- `providers.elevenlabs.languageCode`: 2-literowy kod ISO 639-1 (np. `en`, `de`)
- `providers.elevenlabs.seed`: liczba całkowita `0..4294967295` (best-effort determinism)
- `providers.minimax.baseUrl`: nadpisuje bazowy URL API MiniMax (domyślnie `https://api.minimax.io`, env: `MINIMAX_API_HOST`).
- `providers.minimax.model`: model TTS (domyślnie `speech-2.8-hd`, env: `MINIMAX_TTS_MODEL`).
- `providers.minimax.voiceId`: identyfikator głosu (domyślnie `English_expressive_narrator`, env: `MINIMAX_TTS_VOICE_ID`).
- `providers.minimax.speed`: szybkość odtwarzania `0.5..2.0` (domyślnie 1.0).
- `providers.minimax.vol`: głośność `(0, 10]` (domyślnie 1.0; musi być większa od 0).
- `providers.minimax.pitch`: przesunięcie wysokości tonu `-12..12` (domyślnie 0).
- `providers.microsoft.enabled`: pozwala na użycie mowy Microsoft (domyślnie `true`; bez klucza API).
- `providers.microsoft.voice`: nazwa neuralnego głosu Microsoft (np. `en-US-MichelleNeural`).
- `providers.microsoft.lang`: kod języka (np. `en-US`).
- `providers.microsoft.outputFormat`: format wyjściowy Microsoft (np. `audio-24khz-48kbitrate-mono-mp3`).
  - Prawidłowe wartości znajdziesz w Microsoft Speech output formats; nie wszystkie formaty są obsługiwane przez dołączony transport oparty na Edge.
- `providers.microsoft.rate` / `providers.microsoft.pitch` / `providers.microsoft.volume`: ciągi procentowe (np. `+10%`, `-5%`).
- `providers.microsoft.saveSubtitles`: zapisuje napisy JSON obok pliku audio.
- `providers.microsoft.proxy`: URL proxy dla żądań mowy Microsoft.
- `providers.microsoft.timeoutMs`: nadpisanie limitu czasu żądania (ms).
- `edge.*`: starszy alias dla tych samych ustawień Microsoft.

## Nadpisania sterowane przez model (domyślnie włączone)

Domyślnie model **może** emitować dyrektywy TTS dla pojedynczej odpowiedzi.
Gdy `messages.tts.auto` ma wartość `tagged`, te dyrektywy są wymagane do wywołania audio.

Gdy jest to włączone, model może emitować dyrektywy `[[tts:...]]`, aby nadpisać głos
dla pojedynczej odpowiedzi, oraz opcjonalny blok `[[tts:text]]...[[/tts:text]]`, aby
dostarczyć ekspresyjne tagi (śmiech, wskazówki do śpiewu itp.), które powinny pojawiać się tylko w
audio.

Dyrektywy `provider=...` są ignorowane, chyba że `modelOverrides.allowProvider: true`.

Przykładowy payload odpowiedzi:

```
Here you go.

[[tts:voiceId=pMsXgVXv3BLzUgSXRplE model=eleven_v3 speed=1.1]]
[[tts:text]](laughs) Read the song once more.[[/tts:text]]
```

Dostępne klucze dyrektyw (gdy włączone):

- `provider` (id zarejestrowanego dostawcy mowy, na przykład `openai`, `elevenlabs`, `minimax` lub `microsoft`; wymaga `allowProvider: true`)
- `voice` (głos OpenAI) lub `voiceId` (ElevenLabs / MiniMax)
- `model` (model OpenAI TTS, id modelu ElevenLabs lub model MiniMax)
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

Opcjonalna lista dozwolonych ustawień (włączenie przełączania dostawcy przy zachowaniu konfigurowalności innych parametrów):

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
`~/.openclaw/settings/tts.json`, nadpisywane przez `OPENCLAW_TTS_PREFS` lub
`messages.tts.prefsPath`).

Zapisywane pola:

- `enabled`
- `provider`
- `maxLength` (próg podsumowania; domyślnie 1500 znaków)
- `summarize` (domyślnie `true`)

Nadpisują one `messages.tts.*` dla tego hosta.

## Formaty wyjściowe (stałe)

- **Feishu / Matrix / Telegram / WhatsApp**: wiadomość głosowa Opus (`opus_48000_64` z ElevenLabs, `opus` z OpenAI).
  - 48kHz / 64kbps to dobry kompromis dla wiadomości głosowych.
- **Inne kanały**: MP3 (`mp3_44100_128` z ElevenLabs, `mp3` z OpenAI).
  - 44.1kHz / 128kbps to domyślny balans dla wyrazistości mowy.
- **MiniMax**: MP3 (`speech-2.8-hd`, częstotliwość próbkowania 32kHz). Format notatki głosowej nie jest obsługiwany natywnie; użyj OpenAI lub ElevenLabs, jeśli potrzebujesz gwarantowanych wiadomości głosowych Opus.
- **Microsoft**: używa `microsoft.outputFormat` (domyślnie `audio-24khz-48kbitrate-mono-mp3`).
  - Dołączony transport akceptuje `outputFormat`, ale nie wszystkie formaty są dostępne w usłudze.
  - Wartości formatu wyjściowego są zgodne z Microsoft Speech output formats (w tym Ogg/WebM Opus).
  - Telegram `sendVoice` akceptuje OGG/MP3/M4A; użyj OpenAI/ElevenLabs, jeśli potrzebujesz
    gwarantowanych wiadomości głosowych Opus.
  - Jeśli skonfigurowany format wyjściowy Microsoft zakończy się błędem, OpenClaw ponawia próbę z MP3.

Formaty wyjściowe OpenAI/ElevenLabs są stałe per kanał (zobacz wyżej).

## Zachowanie Auto-TTS

Po włączeniu OpenClaw:

- pomija TTS, jeśli odpowiedź zawiera już multimedia lub dyrektywę `MEDIA:`.
- pomija bardzo krótkie odpowiedzi (< 10 znaków).
- podsumowuje długie odpowiedzi, gdy jest to włączone, używając `agents.defaults.model.primary` (lub `summaryModel`).
- dołącza wygenerowane audio do odpowiedzi.

Jeśli odpowiedź przekracza `maxLength`, a podsumowanie jest wyłączone (lub brak klucza API dla
modelu podsumowania), audio
jest pomijane i wysyłana jest zwykła odpowiedź tekstowa.

## Diagram przepływu

```
Reply -> TTS enabled?
  no  -> send text
  yes -> has media / MEDIA: / short?
          yes -> send text
          no  -> length > limit?
                   no  -> TTS -> attach audio
                   yes -> summary enabled?
                            no  -> send text
                            yes -> summarize (summaryModel or agents.defaults.model.primary)
                                      -> TTS -> attach audio
```

## Użycie poleceń slash

Istnieje jedno polecenie: `/tts`.
Szczegóły włączania znajdziesz w [Polecenia slash](/pl/tools/slash-commands).

Uwaga dotycząca Discord: `/tts` to wbudowane polecenie Discorda, więc OpenClaw rejestruje tam
`/voice` jako natywne polecenie. Tekstowe `/tts ...` nadal działa.

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

- Polecenia wymagają autoryzowanego nadawcy (reguły allowlist/owner nadal obowiązują).
- `commands.text` lub rejestracja natywnego polecenia musi być włączona.
- Konfiguracja `messages.tts.auto` akceptuje `off|always|inbound|tagged`.
- `/tts on` zapisuje lokalną preferencję TTS jako `always`; `/tts off` zapisuje ją jako `off`.
- Użyj konfiguracji, jeśli chcesz mieć wartości domyślne `inbound` lub `tagged`.
- `limit` i `summary` są zapisywane w lokalnych prefs, a nie w głównej konfiguracji.
- `/tts audio` generuje jednorazową odpowiedź audio (nie włącza TTS).
- `/tts status` zawiera widoczność fallback dla ostatniej próby:
  - udany fallback: `Fallback: <primary> -> <used>` plus `Attempts: ...`
  - niepowodzenie: `Error: ...` plus `Attempts: ...`
  - szczegółowa diagnostyka: `Attempt details: provider:outcome(reasonCode) latency`
- Błędy API OpenAI i ElevenLabs zawierają teraz sparsowane szczegóły błędu dostawcy oraz id żądania (gdy zwraca je dostawca), które są ujawniane w błędach/logach TTS.

## Narzędzie agenta

Narzędzie `tts` konwertuje tekst na mowę i zwraca załącznik audio do
dostarczenia w odpowiedzi. Gdy kanałem jest Feishu, Matrix, Telegram lub WhatsApp,
audio jest dostarczane jako wiadomość głosowa, a nie jako załącznik plikowy.

## Gateway RPC

Metody Gateway:

- `tts.status`
- `tts.enable`
- `tts.disable`
- `tts.convert`
- `tts.setProvider`
- `tts.providers`
