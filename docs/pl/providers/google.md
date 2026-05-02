---
read_when:
    - Chcesz korzystać z modeli Google Gemini w OpenClaw
    - Potrzebujesz klucza API lub przepływu uwierzytelniania OAuth
summary: Konfiguracja Google Gemini (klucz API + OAuth, generowanie obrazów, rozumienie multimediów, TTS, wyszukiwanie w internecie)
title: Google (Gemini)
x-i18n:
    generated_at: "2026-05-02T10:00:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 14605b88f0d1d7e01796d429113a73b2b52a48fde6443565dcb3db47653be5e7
    source_path: providers/google.md
    workflow: 16
---

Plugin Google zapewnia dostęp do modeli Gemini przez Google AI Studio, a także
generowanie obrazów, rozumienie multimediów (obraz/audio/wideo), zamianę tekstu na mowę oraz wyszukiwanie w sieci przez
Gemini Grounding.

- Dostawca: `google`
- Uwierzytelnianie: `GEMINI_API_KEY` lub `GOOGLE_API_KEY`
- API: Google Gemini API
- Opcja środowiska uruchomieniowego: `agents.defaults.agentRuntime.id: "google-gemini-cli"`
  ponownie używa OAuth Gemini CLI, zachowując kanoniczne odwołania do modeli jako `google/*`.

## Pierwsze kroki

Wybierz preferowaną metodę uwierzytelniania i wykonaj kroki konfiguracji.

<Tabs>
  <Tab title="Klucz API">
    **Najlepsze do:** standardowego dostępu do Gemini API przez Google AI Studio.

    <Steps>
      <Step title="Uruchom onboarding">
        ```bash
        openclaw onboard --auth-choice gemini-api-key
        ```

        Lub przekaż klucz bezpośrednio:

        ```bash
        openclaw onboard --non-interactive \
          --mode local \
          --auth-choice gemini-api-key \
          --gemini-api-key "$GEMINI_API_KEY"
        ```
      </Step>
      <Step title="Ustaw model domyślny">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "google/gemini-3.1-pro-preview" },
            },
          },
        }
        ```
      </Step>
      <Step title="Sprawdź, czy model jest dostępny">
        ```bash
        openclaw models list --provider google
        ```
      </Step>
    </Steps>

    <Tip>
    Zmienne środowiskowe `GEMINI_API_KEY` i `GOOGLE_API_KEY` są obsługiwane. Użyj tej, którą masz już skonfigurowaną.
    </Tip>

  </Tab>

  <Tab title="Gemini CLI (OAuth)">
    **Najlepsze do:** ponownego użycia istniejącego logowania Gemini CLI przez PKCE OAuth zamiast osobnego klucza API.

    <Warning>
    Dostawca `google-gemini-cli` jest nieoficjalną integracją. Niektórzy użytkownicy
    zgłaszają ograniczenia konta podczas używania OAuth w ten sposób. Używasz na własne ryzyko.
    </Warning>

    <Steps>
      <Step title="Zainstaluj Gemini CLI">
        Lokalne polecenie `gemini` musi być dostępne w `PATH`.

        ```bash
        # Homebrew
        brew install gemini-cli

        # or npm
        npm install -g @google/gemini-cli
        ```

        OpenClaw obsługuje zarówno instalacje Homebrew, jak i globalne instalacje npm, w tym
        typowe układy Windows/npm.
      </Step>
      <Step title="Zaloguj się przez OAuth">
        ```bash
        openclaw models auth login --provider google-gemini-cli --set-default
        ```
      </Step>
      <Step title="Sprawdź, czy model jest dostępny">
        ```bash
        openclaw models list --provider google
        ```
      </Step>
    </Steps>

    - Model domyślny: `google/gemini-3.1-pro-preview`
    - Środowisko uruchomieniowe: `google-gemini-cli`
    - Alias: `gemini-cli`

    Identyfikator modelu Gemini API dla Gemini 3.1 Pro to `gemini-3.1-pro-preview`. OpenClaw akceptuje krótszy `google/gemini-3.1-pro` jako wygodny alias i normalizuje go przed wywołaniami dostawcy.

    **Zmienne środowiskowe:**

    - `OPENCLAW_GEMINI_OAUTH_CLIENT_ID`
    - `OPENCLAW_GEMINI_OAUTH_CLIENT_SECRET`

    (Lub warianty `GEMINI_CLI_*`).

    <Note>
    Jeśli żądania OAuth Gemini CLI nie powiodą się po zalogowaniu, ustaw `GOOGLE_CLOUD_PROJECT` lub
    `GOOGLE_CLOUD_PROJECT_ID` na hoście Gateway i spróbuj ponownie.
    </Note>

    <Note>
    Jeśli logowanie nie powiedzie się przed rozpoczęciem przepływu w przeglądarce, upewnij się, że lokalne polecenie `gemini`
    jest zainstalowane i dostępne w `PATH`.
    </Note>

    Odwołania do modeli `google-gemini-cli/*` są aliasami zgodności wstecznej. Nowe
    konfiguracje powinny używać odwołań do modeli `google/*` oraz środowiska uruchomieniowego `google-gemini-cli`,
    gdy chcą lokalnego wykonywania Gemini CLI.

  </Tab>
</Tabs>

## Możliwości

| Możliwość              | Obsługiwane                   |
| ---------------------- | ----------------------------- |
| Uzupełnienia czatu     | Tak                           |
| Generowanie obrazów    | Tak                           |
| Generowanie muzyki     | Tak                           |
| Zamiana tekstu na mowę | Tak                           |
| Głos w czasie rzeczywistym | Tak (Google Live API)     |
| Rozumienie obrazów     | Tak                           |
| Transkrypcja audio     | Tak                           |
| Rozumienie wideo       | Tak                           |
| Wyszukiwanie w sieci (Grounding) | Tak                 |
| Myślenie/rozumowanie   | Tak (Gemini 2.5+ / Gemini 3+) |
| Modele Gemma 4         | Tak                           |

## Wyszukiwanie w sieci

Dołączony dostawca wyszukiwania w sieci `gemini` używa grounding Google Search w Gemini.
Skonfiguruj dedykowany klucz wyszukiwania pod `plugins.entries.google.config.webSearch`
albo pozwól mu ponownie użyć `models.providers.google.apiKey` po `GEMINI_API_KEY`:

```json5
{
  plugins: {
    entries: {
      google: {
        config: {
          webSearch: {
            apiKey: "AIza...", // optional if GEMINI_API_KEY or models.providers.google.apiKey is set
            baseUrl: "https://generativelanguage.googleapis.com/v1beta", // falls back to models.providers.google.baseUrl
            model: "gemini-2.5-flash",
          },
        },
      },
    },
  },
}
```

Priorytet poświadczeń to dedykowany `webSearch.apiKey`, następnie `GEMINI_API_KEY`,
a potem `models.providers.google.apiKey`. `webSearch.baseUrl` jest opcjonalny i
istnieje dla proxy operatorów lub zgodnych punktów końcowych Gemini API; gdy zostanie pominięty,
wyszukiwanie w sieci Gemini ponownie używa `models.providers.google.baseUrl`. Zobacz
[Wyszukiwanie Gemini](/pl/tools/gemini-search), aby poznać zachowanie narzędzia właściwe dla dostawcy.

<Tip>
Modele Gemini 3 używają `thinkingLevel` zamiast `thinkingBudget`. OpenClaw mapuje
kontrolki rozumowania aliasów Gemini 3, Gemini 3.1 i `gemini-*-latest` na
`thinkingLevel`, aby uruchomienia domyślne/o niskim opóźnieniu nie wysyłały wyłączonych
wartości `thinkingBudget`.

`/think adaptive` zachowuje dynamiczną semantykę myślenia Google zamiast wybierać
stały poziom OpenClaw. Gemini 3 i Gemini 3.1 pomijają stały `thinkingLevel`, aby
Google mogło wybrać poziom; Gemini 2.5 wysyła dynamiczny sentinel Google
`thinkingBudget: -1`.

Modele Gemma 4 (na przykład `gemma-4-26b-a4b-it`) obsługują tryb myślenia. OpenClaw
przepisuje `thinkingBudget` na obsługiwany przez Google `thinkingLevel` dla Gemma 4.
Ustawienie myślenia na `off` zachowuje wyłączone myślenie zamiast mapowania na
`MINIMAL`.
</Tip>

## Generowanie obrazów

Dołączony dostawca generowania obrazów `google` domyślnie używa
`google/gemini-3.1-flash-image-preview`.

- Obsługuje także `google/gemini-3-pro-image-preview`
- Generowanie: do 4 obrazów na żądanie
- Tryb edycji: włączony, do 5 obrazów wejściowych
- Kontrolki geometrii: `size`, `aspectRatio` i `resolution`

Aby użyć Google jako domyślnego dostawcy obrazów:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "google/gemini-3.1-flash-image-preview",
      },
    },
  },
}
```

<Note>
Zobacz [Generowanie obrazów](/pl/tools/image-generation), aby poznać wspólne parametry narzędzia, wybór dostawcy i zachowanie failover.
</Note>

## Generowanie wideo

Dołączony Plugin `google` rejestruje także generowanie wideo przez współdzielone
narzędzie `video_generate`.

- Domyślny model wideo: `google/veo-3.1-fast-generate-preview`
- Tryby: przepływy tekst-na-wideo, obraz-na-wideo i pojedynczego odniesienia wideo
- Obsługuje `aspectRatio`, `resolution` i `audio`
- Obecne ograniczenie czasu trwania: **od 4 do 8 sekund**

Aby użyć Google jako domyślnego dostawcy wideo:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "google/veo-3.1-fast-generate-preview",
      },
    },
  },
}
```

<Note>
Zobacz [Generowanie wideo](/pl/tools/video-generation), aby poznać wspólne parametry narzędzia, wybór dostawcy i zachowanie failover.
</Note>

## Generowanie muzyki

Dołączony Plugin `google` rejestruje także generowanie muzyki przez współdzielone
narzędzie `music_generate`.

- Domyślny model muzyki: `google/lyria-3-clip-preview`
- Obsługuje także `google/lyria-3-pro-preview`
- Kontrolki promptu: `lyrics` i `instrumental`
- Format wyjściowy: domyślnie `mp3`, a także `wav` w `google/lyria-3-pro-preview`
- Wejścia referencyjne: do 10 obrazów
- Uruchomienia oparte na sesji odłączają się przez współdzielony przepływ zadania/statusu, w tym `action: "status"`

Aby użyć Google jako domyślnego dostawcy muzyki:

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "google/lyria-3-clip-preview",
      },
    },
  },
}
```

<Note>
Zobacz [Generowanie muzyki](/pl/tools/music-generation), aby poznać wspólne parametry narzędzia, wybór dostawcy i zachowanie failover.
</Note>

## Zamiana tekstu na mowę

Dołączony dostawca mowy `google` używa ścieżki TTS Gemini API z
`gemini-3.1-flash-tts-preview`.

- Głos domyślny: `Kore`
- Uwierzytelnianie: `messages.tts.providers.google.apiKey`, `models.providers.google.apiKey`, `GEMINI_API_KEY` lub `GOOGLE_API_KEY`
- Wyjście: WAV dla zwykłych załączników TTS, Opus dla celów notatek głosowych, PCM dla Talk/telefonii
- Wyjście notatki głosowej: Google PCM jest opakowywane jako WAV i transkodowane do Opus 48 kHz przy użyciu `ffmpeg`

Aby użyć Google jako domyślnego dostawcy TTS:

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "google",
      providers: {
        google: {
          model: "gemini-3.1-flash-tts-preview",
          voiceName: "Kore",
          audioProfile: "Speak professionally with a calm tone.",
        },
      },
    },
  },
}
```

TTS Gemini API używa promptów w języku naturalnym do kontroli stylu. Ustaw
`audioProfile`, aby dodać przed wypowiadanym tekstem prompt stylu wielokrotnego użytku. Ustaw
`speakerName`, gdy tekst promptu odnosi się do nazwanego mówcy.

TTS Gemini API akceptuje także ekspresyjne tagi audio w nawiasach kwadratowych w tekście,
takie jak `[whispers]` lub `[laughs]`. Aby tagi nie pojawiały się w widocznej odpowiedzi czatu,
ale były wysyłane do TTS, umieść je w bloku `[[tts:text]]...[[/tts:text]]`:

```text
Here is the clean reply text.

[[tts:text]][whispers] Here is the spoken version.[[/tts:text]]
```

<Note>
Klucz API Google Cloud Console ograniczony do Gemini API jest prawidłowy dla tego
dostawcy. To nie jest osobna ścieżka Cloud Text-to-Speech API.
</Note>

## Głos w czasie rzeczywistym

Dołączony Plugin `google` rejestruje dostawcę głosu w czasie rzeczywistym opartego na
Gemini Live API dla mostów audio backendu, takich jak Voice Call i Google Meet.

| Ustawienie                    | Ścieżka konfiguracji                                                | Domyślne                                                                             |
| ----------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Model                         | `plugins.entries.voice-call.config.realtime.providers.google.model` | `gemini-2.5-flash-native-audio-preview-12-2025`                                      |
| Głos                          | `...google.voice`                                                   | `Kore`                                                                               |
| Temperatura                   | `...google.temperature`                                             | (nieustawione)                                                                       |
| Czułość rozpoczęcia VAD       | `...google.startSensitivity`                                        | (nieustawione)                                                                       |
| Czułość zakończenia VAD       | `...google.endSensitivity`                                          | (nieustawione)                                                                       |
| Czas trwania ciszy            | `...google.silenceDurationMs`                                       | (nieustawione)                                                                       |
| Obsługa aktywności            | `...google.activityHandling`                                        | domyślne Google, `start-of-activity-interrupts`                                      |
| Pokrycie tury                 | `...google.turnCoverage`                                            | domyślne Google, `only-activity`                                                     |
| Wyłącz automatyczne VAD       | `...google.automaticActivityDetectionDisabled`                      | `false`                                                                              |
| Klucz API                     | `...google.apiKey`                                                  | Używa awaryjnie `models.providers.google.apiKey`, `GEMINI_API_KEY` lub `GOOGLE_API_KEY` |

Przykładowa konfiguracja połączeń głosowych w czasie rzeczywistym:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        enabled: true,
        config: {
          realtime: {
            enabled: true,
            provider: "google",
            providers: {
              google: {
                model: "gemini-2.5-flash-native-audio-preview-12-2025",
                voice: "Kore",
                activityHandling: "start-of-activity-interrupts",
                turnCoverage: "only-activity",
              },
            },
          },
        },
      },
    },
  },
}
```

<Note>
Google Live API używa dwukierunkowego audio i wywoływania funkcji przez WebSocket.
OpenClaw adaptuje audio z mostka telefonii/Meet do strumienia PCM Live API Gemini i
utrzymuje wywołania narzędzi we wspólnym kontrakcie głosu w czasie rzeczywistym. Pozostaw `temperature`
nieustawione, chyba że potrzebujesz zmian próbkowania; OpenClaw pomija wartości niedodatnie,
ponieważ Google Live może zwracać transkrypcje bez audio dla `temperature: 0`.
Transkrypcja Gemini API jest włączona bez `languageCodes`; obecny Google
SDK odrzuca podpowiedzi kodów języka w tej ścieżce API.
</Note>

<Note>
Control UI Talk obsługuje sesje Google Live w przeglądarce z ograniczonymi tokenami
jednorazowego użytku. Backendowe dostawcy głosu w czasie rzeczywistym mogą także działać przez ogólny
transport przekaźnikowy Gateway, który przechowuje dane uwierzytelniające dostawcy w Gateway.
</Note>

Do weryfikacji live przez maintainerów uruchom
`OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`.
Część Google wystawia ten sam ograniczony kształt tokenu Live API, którego używa Control
UI Talk, otwiera endpoint WebSocket przeglądarki, wysyła początkowy payload konfiguracji
i czeka na `setupComplete`.

## Zaawansowana konfiguracja

<AccordionGroup>
  <Accordion title="Bezpośrednie ponowne użycie cache Gemini">
    Dla bezpośrednich uruchomień Gemini API (`api: "google-generative-ai"`) OpenClaw
    przekazuje skonfigurowany uchwyt `cachedContent` do żądań Gemini.

    - Skonfiguruj parametry dla modelu lub globalne za pomocą
      `cachedContent` albo starszego `cached_content`
    - Jeśli obecne są oba, wygrywa `cachedContent`
    - Przykładowa wartość: `cachedContents/prebuilt-context`
    - Użycie trafień cache Gemini jest normalizowane do OpenClaw `cacheRead` z
      nadrzędnego `cachedContentTokenCount`

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "google/gemini-2.5-pro": {
              params: {
                cachedContent: "cachedContents/prebuilt-context",
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Uwagi dotyczące użycia JSON Gemini CLI">
    Podczas używania dostawcy OAuth `google-gemini-cli` OpenClaw normalizuje
    wyjście JSON CLI w następujący sposób:

    - Tekst odpowiedzi pochodzi z pola `response` w JSON CLI.
    - Użycie korzysta awaryjnie ze `stats`, gdy CLI pozostawia `usage` puste.
    - `stats.cached` jest normalizowane do OpenClaw `cacheRead`.
    - Jeśli brakuje `stats.input`, OpenClaw wyprowadza tokeny wejściowe z
      `stats.input_tokens - stats.cached`.

  </Accordion>

  <Accordion title="Konfiguracja środowiska i demona">
    Jeśli Gateway działa jako demon (launchd/systemd), upewnij się, że `GEMINI_API_KEY`
    jest dostępny dla tego procesu (na przykład w `~/.openclaw/.env` lub przez
    `env.shellEnv`).
  </Accordion>
</AccordionGroup>

## Powiązane

<CardGroup cols={2}>
  <Card title="Wybór modelu" href="/pl/concepts/model-providers" icon="layers">
    Wybór dostawców, odwołań do modeli i zachowania przełączania awaryjnego.
  </Card>
  <Card title="Generowanie obrazów" href="/pl/tools/image-generation" icon="image">
    Wspólne parametry narzędzia obrazów i wybór dostawcy.
  </Card>
  <Card title="Generowanie wideo" href="/pl/tools/video-generation" icon="video">
    Wspólne parametry narzędzia wideo i wybór dostawcy.
  </Card>
  <Card title="Generowanie muzyki" href="/pl/tools/music-generation" icon="music">
    Wspólne parametry narzędzia muzyki i wybór dostawcy.
  </Card>
</CardGroup>
