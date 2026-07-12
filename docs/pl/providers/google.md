---
read_when:
    - Chcesz używać modeli Google Gemini z OpenClaw
    - Potrzebujesz klucza API lub przepływu uwierzytelniania OAuth
summary: Konfiguracja Google Gemini (klucz API + OAuth, generowanie obrazów, rozumienie multimediów, TTS, wyszukiwanie w sieci)
title: Google (Gemini)
x-i18n:
    generated_at: "2026-07-12T15:34:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 423f9b048a705815e886690fa13f5b02f7e67707195b7b461f6b4765528a4756
    source_path: providers/google.md
    workflow: 16
---

Plugin Google zapewnia dostęp do modeli Gemini za pośrednictwem Google AI Studio, a także generowanie obrazów, analizę multimediów (obrazów/dźwięku/wideo), syntezę mowy oraz wyszukiwanie w internecie przy użyciu Gemini Grounding.

- Dostawca: `google`
- Uwierzytelnianie: `GEMINI_API_KEY` lub `GOOGLE_API_KEY`
- API: Google Gemini API
- Opcja środowiska uruchomieniowego: `agentRuntime.id: "google-gemini-cli"` ponownie wykorzystuje uwierzytelnianie OAuth Gemini CLI, zachowując kanoniczne odwołania do modeli w postaci `google/*`.

## Pierwsze kroki

Wybierz preferowaną metodę uwierzytelniania i wykonaj czynności konfiguracyjne.

<Tabs>
  <Tab title="Klucz API">
    **Najlepsze zastosowanie:** standardowy dostęp do Gemini API za pośrednictwem Google AI Studio.

    <Steps>
      <Step title="Uruchom wdrażanie">
        ```bash
        openclaw onboard --auth-choice gemini-api-key
        ```

        Możesz też przekazać klucz bezpośrednio:

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
      <Step title="Sprawdź dostępność modelu">
        ```bash
        openclaw models list --provider google
        ```
      </Step>
    </Steps>

    <Tip>
    Akceptowane są zarówno `GEMINI_API_KEY`, jak i `GOOGLE_API_KEY`. Użyj zmiennej, którą masz już skonfigurowaną.
    </Tip>

  </Tab>

  <Tab title="Gemini CLI (OAuth)">
    **Najlepsze zastosowanie:** ponowne wykorzystanie istniejącego logowania Gemini CLI za pośrednictwem OAuth z PKCE zamiast osobnego klucza API.

    <Warning>
    Dostawca `google-gemini-cli` jest nieoficjalną integracją. Niektórzy użytkownicy
    zgłaszają ograniczenia konta podczas korzystania z OAuth w ten sposób. Używasz go na własne ryzyko.
    </Warning>

    <Steps>
      <Step title="Zainstaluj Gemini CLI">
        Lokalne polecenie `gemini` musi być dostępne w `PATH`.

        ```bash
        # Homebrew
        brew install gemini-cli

        # lub npm
        npm install -g @google/gemini-cli
        ```

        OpenClaw obsługuje zarówno instalacje Homebrew, jak i globalne instalacje npm, w tym
        typowe układy katalogów Windows/npm.
      </Step>
      <Step title="Zaloguj się przez OAuth">
        ```bash
        openclaw models auth login --provider google-gemini-cli --set-default
        ```
      </Step>
      <Step title="Sprawdź dostępność modelu">
        ```bash
        openclaw models list --provider google
        ```
      </Step>
    </Steps>

    - Model domyślny: `google/gemini-3.1-pro-preview`
    - Środowisko uruchomieniowe: `google-gemini-cli`
    - Alias: `gemini-cli`

    Identyfikator modelu Gemini API dla Gemini 3.1 Pro to `gemini-3.1-pro-preview`. Dla wygody OpenClaw akceptuje krótszy alias `google/gemini-3.1-pro` i normalizuje go przed wywołaniami dostawcy.

    **Zmienne środowiskowe:**

    - `OPENCLAW_GEMINI_OAUTH_CLIENT_ID` / `GEMINI_CLI_OAUTH_CLIENT_ID`
    - `OPENCLAW_GEMINI_OAUTH_CLIENT_SECRET` / `GEMINI_CLI_OAUTH_CLIENT_SECRET`

    <Note>
    Jeśli po zalogowaniu żądania OAuth Gemini CLI kończą się niepowodzeniem, ustaw `GOOGLE_CLOUD_PROJECT` lub
    `GOOGLE_CLOUD_PROJECT_ID` na hoście Gateway i spróbuj ponownie.
    </Note>

    <Note>
    Jeśli logowanie kończy się niepowodzeniem przed rozpoczęciem procesu w przeglądarce, upewnij się, że lokalne polecenie `gemini`
    jest zainstalowane i dostępne w `PATH`.
    </Note>

    Odwołania do modeli `google-gemini-cli/*` są starszymi aliasami zgodności. Nowe
    konfiguracje powinny używać odwołań do modeli `google/*` wraz ze środowiskiem uruchomieniowym `google-gemini-cli`,
    jeśli wymagają lokalnego wykonywania przez Gemini CLI.

  </Tab>
</Tabs>

<Note>
Model `google/gemini-3-pro-preview` wycofano 2026-03-09; zamiast niego używaj `google/gemini-3.1-pro-preview`. Ponowne uruchomienie konfiguracji klucza Gemini API (`openclaw onboard --auth-choice gemini-api-key` lub `openclaw models auth login --provider google`) zastępuje nieaktualny skonfigurowany model domyślny bieżącym modelem.
</Note>

## Możliwości

| Możliwość                   | Obsługa                         |
| --------------------------- | ------------------------------- |
| Uzupełnianie konwersacji    | Tak                             |
| Generowanie obrazów         | Tak                             |
| Generowanie muzyki          | Tak                             |
| Synteza mowy                | Tak                             |
| Głos w czasie rzeczywistym  | Tak (Google Live API)           |
| Analiza obrazów             | Tak                             |
| Transkrypcja dźwięku        | Tak                             |
| Analiza wideo               | Tak                             |
| Wyszukiwanie (Grounding)    | Tak                             |
| Myślenie/rozumowanie        | Tak (Gemini 2.5+ / Gemini 3+)   |
| Modele Gemma 4              | Tak                             |

## Wyszukiwanie w internecie

Dołączony dostawca wyszukiwania internetowego `gemini` korzysta z osadzania wyników Google Search w Gemini.
Skonfiguruj dedykowany klucz wyszukiwania w `plugins.entries.google.config.webSearch`
lub pozwól mu ponownie wykorzystać `models.providers.google.apiKey` po `GEMINI_API_KEY`:

```json5
{
  plugins: {
    entries: {
      google: {
        config: {
          webSearch: {
            apiKey: "AIza...", // opcjonalne, jeśli ustawiono GEMINI_API_KEY lub models.providers.google.apiKey
            baseUrl: "https://generativelanguage.googleapis.com/v1beta", // w razie braku używa models.providers.google.baseUrl
            model: "gemini-2.5-flash",
          },
        },
      },
    },
  },
}
```

Kolejność pierwszeństwa poświadczeń to dedykowane `webSearch.apiKey`, następnie `GEMINI_API_KEY`,
a potem `models.providers.google.apiKey`. Ustawienie `webSearch.baseUrl` jest opcjonalne i
służy do obsługi serwerów proxy operatora lub zgodnych punktów końcowych Gemini API; jeśli zostanie pominięte,
wyszukiwanie internetowe Gemini ponownie wykorzysta `models.providers.google.baseUrl`. Informacje o zachowaniu narzędzia właściwym dla tego dostawcy znajdziesz w sekcji
[Wyszukiwanie Gemini](/pl/tools/gemini-search).

<Tip>
Modele Gemini 3 używają `thinkingLevel` zamiast `thinkingBudget`. OpenClaw mapuje
ustawienia sterujące rozumowaniem dla Gemini 3, Gemini 3.1 oraz aliasów `gemini-*-latest` na
`thinkingLevel`, dzięki czemu przebiegi domyślne i o małych opóźnieniach nie wysyłają wyłączonych
wartości `thinkingBudget`.

`/think adaptive` zachowuje dynamiczną semantykę myślenia Google zamiast wybierać
stały poziom OpenClaw. Gemini 3 i Gemini 3.1 pomijają stały `thinkingLevel`, dzięki czemu
Google może wybrać poziom; Gemini 2.5 wysyła dynamiczną wartość specjalną Google
`thinkingBudget: -1`.

Modele Gemma 4 (na przykład `gemma-4-26b-a4b-it`) obsługują tryb myślenia. OpenClaw
przekształca `thinkingBudget` na obsługiwany przez Google `thinkingLevel` dla Gemma 4.
Ustawienie myślenia na `off` pozostawia je wyłączone zamiast mapować je na
`MINIMAL`.

Gemini 2.5 Pro działa wyłącznie w trybie myślenia i odrzuca jawne
`thinkingBudget: 0`; OpenClaw usuwa tę wartość z żądań Gemini 2.5 Pro,
zamiast ją wysyłać.
</Tip>

## Generowanie obrazów

Dołączony dostawca generowania obrazów `google` domyślnie używa
`google/gemini-3.1-flash-image-preview`.

- Obsługuje również `google/gemini-3-pro-image-preview`
- Generowanie: do 4 obrazów na żądanie
- Tryb edycji: włączony, do 5 obrazów wejściowych
- Ustawienia geometrii: `size`, `aspectRatio` i `resolution`

Aby używać Google jako domyślnego dostawcy obrazów:

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
Informacje o wspólnych parametrach narzędzia, wyborze dostawcy i zachowaniu mechanizmu przełączania awaryjnego znajdziesz w sekcji [Generowanie obrazów](/pl/tools/image-generation).
</Note>

## Generowanie wideo

Dołączony plugin `google` rejestruje również generowanie wideo za pośrednictwem wspólnego
narzędzia `video_generate`.

- Domyślny model wideo: `google/veo-3.1-fast-generate-preview`
- Tryby: tekst na wideo, obraz na wideo oraz przepływy z pojedynczym wideo referencyjnym
- Obsługuje `aspectRatio` (`16:9`, `9:16`) i `resolution` (`720P`, `1080P`); obecnie Veo nie obsługuje wyjściowego dźwięku
- Obsługiwany czas trwania: **4, 6 lub 8 sekund** (inne wartości są zaokrąglane do najbliższej dozwolonej wartości)

Aby używać Google jako domyślnego dostawcy wideo:

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
Informacje o wspólnych parametrach narzędzia, wyborze dostawcy i zachowaniu mechanizmu przełączania awaryjnego znajdziesz w sekcji [Generowanie wideo](/pl/tools/video-generation).
</Note>

## Generowanie muzyki

Dołączony plugin `google` rejestruje również generowanie muzyki za pośrednictwem wspólnego
narzędzia `music_generate`.

- Domyślny model muzyczny: `google/lyria-3-clip-preview`
- Obsługuje również `google/lyria-3-pro-preview`
- Ustawienia promptu: `lyrics` i `instrumental`
- Format wyjściowy: domyślnie `mp3`, a ponadto `wav` w przypadku `google/lyria-3-pro-preview`
- Dane referencyjne: do 10 obrazów
- Przebiegi korzystające z sesji są odłączane za pośrednictwem wspólnego przepływu zadań i stanu, w tym `action: "status"`

Aby używać Google jako domyślnego dostawcy muzyki:

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
Informacje o wspólnych parametrach narzędzia, wyborze dostawcy i zachowaniu mechanizmu przełączania awaryjnego znajdziesz w sekcji [Generowanie muzyki](/pl/tools/music-generation).
</Note>

## Synteza mowy

Dołączony dostawca mowy `google` korzysta ze ścieżki TTS Gemini API z modelem
`gemini-3.1-flash-tts-preview`.

- Domyślny głos: `Kore`
- Uwierzytelnianie: `messages.tts.providers.google.apiKey`, `models.providers.google.apiKey`, `GEMINI_API_KEY` lub `GOOGLE_API_KEY`
- Dane wyjściowe: WAV dla zwykłych załączników TTS, Opus dla docelowych wiadomości głosowych, PCM dla funkcji Talk/telefonii
- Dane wyjściowe wiadomości głosowych: dane PCM Google są opakowywane w WAV i transkodowane do formatu Opus 48 kHz za pomocą `ffmpeg`

Wsadowa ścieżka Gemini TTS firmy Google zwraca wygenerowany dźwięk w ukończonej
odpowiedzi `generateContent`. Aby uzyskać najmniejsze opóźnienia w rozmowach głosowych, użyj
dostawcy głosu Google działającego w czasie rzeczywistym, opartego na Gemini Live API, zamiast wsadowego
TTS.

Aby używać Google jako domyślnego dostawcy TTS:

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "google",
      providers: {
        google: {
          model: "gemini-3.1-flash-tts-preview",
          speakerVoice: "Kore",
          audioProfile: "Speak professionally with a calm tone.",
        },
      },
    },
  },
}
```

TTS Gemini API wykorzystuje prompty w języku naturalnym do sterowania stylem. Ustaw
`audioProfile`, aby poprzedzić wypowiadany tekst promptem stylu wielokrotnego użytku. Ustaw
`speakerName`, gdy tekst promptu odwołuje się do nazwanego mówcy.

TTS Gemini API akceptuje również ekspresyjne znaczniki dźwiękowe w nawiasach kwadratowych w tekście,
takie jak `[whispers]` lub `[laughs]`. Aby znaczniki nie pojawiały się w widocznej odpowiedzi na czacie,
ale były wysyłane do TTS, umieść je w bloku `[[tts:text]]...[[/tts:text]]`:

```text
Here is the clean reply text.

[[tts:text]][whispers] Here is the spoken version.[[/tts:text]]
```

<Note>
Klucz API Google Cloud Console ograniczony do Gemini API jest prawidłowy dla tego
dostawcy. Nie jest to osobna ścieżka Cloud Text-to-Speech API.
</Note>

## Głos w czasie rzeczywistym

Dołączony plugin `google` rejestruje dostawcę głosu działającego w czasie rzeczywistym, opartego na
Gemini Live API, przeznaczonego dla backendowych mostów audio, takich jak Voice Call i Google Meet.

| Ustawienie                     | Ścieżka konfiguracji                                                | Wartość domyślna                                                                      |
| ------------------------------ | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Model                          | `plugins.entries.voice-call.config.realtime.providers.google.model` | `gemini-3.1-flash-live-preview`                                                       |
| Głos                           | `...google.voice`                                                   | `Kore`                                                                                |
| Temperatura                    | `...google.temperature`                                             | (nie ustawiono)                                                                       |
| Czułość początku VAD           | `...google.startSensitivity`                                        | (nie ustawiono)                                                                       |
| Czułość końca VAD              | `...google.endSensitivity`                                          | (nie ustawiono)                                                                       |
| Czas trwania ciszy             | `...google.silenceDurationMs`                                       | (nie ustawiono)                                                                       |
| Obsługa aktywności             | `...google.activityHandling`                                        | Wartość domyślna Google, `start-of-activity-interrupts`                               |
| Zakres tury                    | `...google.turnCoverage`                                            | Wartość domyślna Google, `audio-activity-and-all-video`                               |
| Wyłączenie automatycznego VAD  | `...google.automaticActivityDetectionDisabled`                      | `false`                                                                               |
| Wznawianie sesji               | `...google.sessionResumption`                                       | `true`                                                                                |
| Kompresja kontekstu            | `...google.contextWindowCompression`                                | `true`                                                                                |
| Klucz API                      | `...google.apiKey`                                                  | W razie braku używa `models.providers.google.apiKey`, `GEMINI_API_KEY` lub `GOOGLE_API_KEY` |

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
                model: "gemini-3.1-flash-live-preview",
                speakerVoice: "Kore",
                activityHandling: "start-of-activity-interrupts",
                turnCoverage: "audio-activity-and-all-video",
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
Google Live API używa dwukierunkowego dźwięku i wywoływania funkcji przez WebSocket.
OpenClaw dostosowuje dźwięk z mostka telefonicznego/Meet do strumienia PCM Live API
Gemini i utrzymuje wywołania narzędzi we wspólnym kontrakcie głosowym czasu
rzeczywistego. Pozostaw `temperature` bez ustawienia, chyba że musisz zmienić
próbkowanie; OpenClaw pomija wartości niedodatnie, ponieważ Google Live może
zwracać transkrypcje bez dźwięku przy `temperature: 0`. Transkrypcja Gemini API
jest włączona bez `languageCodes`; obecny SDK Google odrzuca wskazówki dotyczące
kodu języka w tej ścieżce API.
</Note>

<Note>
Gemini 3.1 Live przyjmuje tekst konwersacyjny poprzez dane wejściowe czasu
rzeczywistego i używa sekwencyjnego wywoływania funkcji. OpenClaw pomija dla tego
modelu starsze pola `NON_BLOCKING`, planowania odpowiedzi funkcji i dialogu
afektywnego. Preferuj `thinkingLevel`; skonfigurowane dodatnie wartości
`thinkingBudget` są mapowane na najbliższy obsługiwany poziom, natomiast `-1`
pozostawia domyślne ustawienie Google. Zobacz
[porównanie możliwości Gemini Live](https://ai.google.dev/gemini-api/docs/live-api/capabilities).
</Note>

<Note>
Funkcja rozmowy w Control UI obsługuje sesje Google Live w przeglądarce z
ograniczonymi tokenami jednorazowego użytku. Dostawcy głosu czasu rzeczywistego
działający wyłącznie po stronie zaplecza mogą również korzystać z ogólnego
transportu przekazującego Gateway, który przechowuje dane uwierzytelniające
dostawcy w Gateway.
</Note>

Aby przeprowadzić weryfikację na żywo przez opiekuna, uruchom
`OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`.
Test dymny obejmuje również ścieżki zaplecza/WebRTC OpenAI; część Google generuje
token Live API o takim samym ograniczonym formacie jak używany przez funkcję
rozmowy w Control UI, otwiera punkt końcowy WebSocket w przeglądarce, wysyła
początkowy ładunek konfiguracji i oczekuje na `setupComplete`.

## Konfiguracja zaawansowana

<AccordionGroup>
  <Accordion title="Bezpośrednie ponowne użycie pamięci podręcznej Gemini">
    W przypadku bezpośrednich uruchomień Gemini API (`api: "google-generative-ai"`)
    OpenClaw przekazuje skonfigurowany uchwyt `cachedContent` do żądań Gemini.

    - Skonfiguruj parametry dla modelu lub parametry globalne za pomocą
      `cachedContent` albo starszego klucza `cached_content`.
    - Parametry z bardziej szczegółowego zakresu (poziom modelu zamiast poziomu
      globalnego) zawsze mają pierwszeństwo. W tym samym zakresie, jeśli ustawiono
      oba klucze, pierwszeństwo ma `cached_content`. Używaj tylko jednego klucza
      w każdym zakresie, aby uniknąć niespodzianek.
    - Przykładowa wartość: `cachedContents/prebuilt-context`
    - Wykorzystanie trafień pamięci podręcznej Gemini jest normalizowane do
      `cacheRead` OpenClaw na podstawie nadrzędnej wartości `cachedContentTokenCount`.

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

  <Accordion title="Uwagi dotyczące użycia Gemini CLI">
    Podczas korzystania z dostawcy OAuth `google-gemini-cli` OpenClaw domyślnie
    używa danych wyjściowych `stream-json` Gemini CLI i normalizuje użycie na
    podstawie końcowego ładunku `stats`. Starsze nadpisania
    `--output-format json` nadal korzystają z parsera JSON.

    - Strumieniowany tekst odpowiedzi pochodzi ze zdarzeń `message` asystenta.
    - W przypadku starszych danych wyjściowych JSON tekst odpowiedzi pochodzi
      z pola `response` w danych JSON CLI.
    - Jeśli CLI pozostawi `usage` puste, użycie jest pobierane z `stats`.
    - `stats.cached` jest normalizowane do `cacheRead` OpenClaw.
    - Jeśli brakuje `stats.input`, OpenClaw wyznacza liczbę tokenów wejściowych
      jako `stats.input_tokens - stats.cached`.

  </Accordion>

  <Accordion title="Konfiguracja środowiska i demona">
    Jeśli Gateway działa jako demon (launchd/systemd), upewnij się, że
    `GEMINI_API_KEY` jest dostępny dla tego procesu (na przykład w
    `~/.openclaw/.env` lub za pośrednictwem `env.shellEnv`).
  </Accordion>
</AccordionGroup>

## Powiązane materiały

<CardGroup cols={2}>
  <Card title="Wybór modelu" href="/pl/concepts/model-providers" icon="layers">
    Wybieranie dostawców, odwołań do modeli i sposobu przełączania awaryjnego.
  </Card>
  <Card title="Generowanie obrazów" href="/pl/tools/image-generation" icon="image">
    Wspólne parametry narzędzia do obrazów i wybór dostawcy.
  </Card>
  <Card title="Generowanie wideo" href="/pl/tools/video-generation" icon="video">
    Wspólne parametry narzędzia do wideo i wybór dostawcy.
  </Card>
  <Card title="Generowanie muzyki" href="/pl/tools/music-generation" icon="music">
    Wspólne parametry narzędzia do muzyki i wybór dostawcy.
  </Card>
</CardGroup>
