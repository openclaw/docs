---
read_when:
    - Chcesz używać modeli Google Gemini z OpenClaw
    - Potrzebny jest klucz API lub przepływ uwierzytelniania OAuth
summary: Konfiguracja Google Gemini (klucz API + OAuth, generowanie obrazów, rozumienie multimediów, TTS, wyszukiwanie w internecie)
title: Google (Gemini)
x-i18n:
    generated_at: "2026-07-16T19:04:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: fe8a58044bea7ce2598da94787334af2bb4a2ff58872c62115697fa0079daf0a
    source_path: providers/google.md
    workflow: 16
---

Plugin Google zapewnia dostęp do modeli Gemini przez Google AI Studio, a także generowanie obrazów, rozumienie multimediów (obrazów/dźwięku/wideo), zamianę tekstu na mowę i wyszukiwanie w internecie za pośrednictwem Gemini Grounding.

- Dostawca: `google`
- Uwierzytelnianie: `GEMINI_API_KEY` lub `GOOGLE_API_KEY`
- API: Google Gemini API
- Opcja środowiska uruchomieniowego: `agentRuntime.id: "google-gemini-cli"` ponownie wykorzystuje OAuth Gemini CLI, zachowując kanoniczne odwołania do modeli w postaci `google/*`.

## Pierwsze kroki

Należy wybrać preferowaną metodę uwierzytelniania i wykonać odpowiednie czynności konfiguracyjne.

<Tabs>
  <Tab title="Klucz API">
    **Najlepsze zastosowanie:** standardowy dostęp do Gemini API przez Google AI Studio.

    <Steps>
      <Step title="Uzyskanie klucza API">
        Bezpłatny klucz można utworzyć w [Google AI Studio](https://aistudio.google.com/apikey).
      </Step>
      <Step title="Uruchomienie wdrażania">
        ```bash
        openclaw onboard --auth-choice gemini-api-key
        ```

        Klucz można też przekazać bezpośrednio:

        ```bash
        openclaw onboard --non-interactive \
          --mode local \
          --auth-choice gemini-api-key \
          --gemini-api-key "$GEMINI_API_KEY"
        ```
      </Step>
      <Step title="Ustawienie modelu domyślnego">
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
      <Step title="Sprawdzenie dostępności modelu">
        ```bash
        openclaw models list --provider google
        ```
      </Step>
    </Steps>

    <Tip>
    Akceptowane są zarówno `GEMINI_API_KEY`, jak i `GOOGLE_API_KEY`. Należy użyć tego, który jest już skonfigurowany.
    </Tip>

  </Tab>

  <Tab title="Gemini CLI (OAuth)">
    **Najlepsze zastosowanie:** logowanie przy użyciu konta Google przez OAuth Gemini CLI zamiast osobnego klucza API.

    <Warning>
    Dostawca `google-gemini-cli` jest nieoficjalną integracją. Niektórzy użytkownicy
    zgłaszają ograniczenia konta podczas używania OAuth w ten sposób. Korzystanie odbywa się na własne ryzyko.
    </Warning>

    <Steps>
      <Step title="Instalacja Gemini CLI">
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
      <Step title="Logowanie przez OAuth">
        ```bash
        openclaw models auth login --provider google-gemini-cli --set-default
        ```
      </Step>
      <Step title="Sprawdzenie dostępności modelu">
        ```bash
        openclaw models list --provider google
        ```
      </Step>
    </Steps>

    - Model domyślny: `google/gemini-3.1-pro-preview`
    - Środowisko uruchomieniowe: `google-gemini-cli`
    - Alias: `gemini-cli`

    Identyfikator modelu Gemini API dla Gemini 3.1 Pro to `gemini-3.1-pro-preview`. OpenClaw dla wygody akceptuje krótszy alias `google/gemini-3.1-pro` i normalizuje go przed wywołaniami dostawcy.

    **Zmienne środowiskowe:**

    - `OPENCLAW_GEMINI_OAUTH_CLIENT_ID` / `GEMINI_CLI_OAUTH_CLIENT_ID`
    - `OPENCLAW_GEMINI_OAUTH_CLIENT_SECRET` / `GEMINI_CLI_OAUTH_CLIENT_SECRET`

    <Note>
    Jeśli żądania OAuth Gemini CLI nie powiodą się po zalogowaniu, należy ustawić `GOOGLE_CLOUD_PROJECT` lub
    `GOOGLE_CLOUD_PROJECT_ID` na hoście Gateway i spróbować ponownie.
    </Note>

    <Note>
    Jeśli logowanie nie powiedzie się przed rozpoczęciem procesu w przeglądarce, należy upewnić się, że lokalne polecenie `gemini`
    jest zainstalowane i znajduje się w `PATH`.
    </Note>

    Automatyczne wykrywanie podczas wdrażania wyświetla istniejące logowanie Gemini CLI, ale nigdy
    nie testuje go automatycznie, ponieważ Gemini CLI nie udostępnia sondy niewymagającej narzędzi. Aby kontynuować, należy wybrać OAuth Gemini CLI
    lub klucz Gemini API.

    Odwołania do modeli `google-gemini-cli/*` są starszymi aliasami zgodności. Nowe
    konfiguracje powinny używać odwołań do modeli `google/*` oraz środowiska uruchomieniowego `google-gemini-cli`,
    jeśli wymagane jest lokalne wykonywanie Gemini CLI.

  </Tab>
</Tabs>

<Note>
`google/gemini-3-pro-preview` wycofano 2026-03-09; zamiast niego należy używać `google/gemini-3.1-pro-preview`. Ponowne uruchomienie konfiguracji klucza Gemini API (`openclaw onboard --auth-choice gemini-api-key` lub `openclaw models auth login --provider google`) zastępuje nieaktualny skonfigurowany model domyślny bieżącym modelem.
</Note>

## Możliwości

| Możliwość                         | Obsługa                       |
| --------------------------------- | ----------------------------- |
| Uzupełnianie czatu                | Tak                           |
| Generowanie obrazów               | Tak                           |
| Generowanie muzyki                | Tak                           |
| Zamiana tekstu na mowę            | Tak                           |
| Głos w czasie rzeczywistym        | Tak (Google Live API)         |
| Rozumienie obrazów                | Tak                           |
| Transkrypcja dźwięku              | Tak                           |
| Rozumienie wideo                  | Tak                           |
| Wyszukiwanie w internecie (Grounding) | Tak                       |
| Myślenie/rozumowanie              | Tak (Gemini 2.5+ / Gemini 3+) |
| Modele Gemma 4                    | Tak                           |

## Wyszukiwanie w internecie

Dołączony dostawca wyszukiwania w internecie `gemini` korzysta z ugruntowywania wyników Google Search przez Gemini.
Należy skonfigurować osobny klucz wyszukiwania w `plugins.entries.google.config.webSearch`
lub pozwolić mu ponownie wykorzystać `models.providers.google.apiKey` po `GEMINI_API_KEY`:

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

Kolejność pierwszeństwa poświadczeń to osobne `webSearch.apiKey`, następnie `GEMINI_API_KEY`,
a potem `models.providers.google.apiKey`. `webSearch.baseUrl` jest opcjonalne i
służy do obsługi serwerów proxy operatora lub zgodnych punktów końcowych Gemini API; jeśli je pominięto,
wyszukiwanie Gemini w internecie ponownie wykorzystuje `models.providers.google.baseUrl`. Zachowanie narzędzia właściwe dla tego dostawcy opisano w sekcji
[Wyszukiwanie Gemini](/pl/tools/gemini-search).

<Tip>
Modele Gemini 3 używają `thinkingLevel` zamiast `thinkingBudget`. OpenClaw mapuje
ustawienia sterujące rozumowaniem modeli Gemini 3, Gemini 3.1 i aliasu `gemini-*-latest` na
`thinkingLevel`, dzięki czemu uruchomienia domyślne lub o małych opóźnieniach nie wysyłają wyłączonych
wartości `thinkingBudget`.

`/think adaptive` zachowuje dynamiczną semantykę myślenia Google zamiast wybierania
stałego poziomu OpenClaw. Gemini 3 i Gemini 3.1 pomijają stałe `thinkingLevel`, dzięki czemu
Google może wybrać poziom; Gemini 2.5 wysyła dynamiczną wartość sygnalizacyjną Google
`thinkingBudget: -1`.

Modele Gemma 4 (na przykład `gemma-4-26b-a4b-it`) obsługują tryb myślenia. OpenClaw
przekształca `thinkingBudget` na obsługiwane przez Google `thinkingLevel` dla Gemma 4.
Ustawienie myślenia na `off` zachowuje wyłączone myślenie zamiast mapować je na
`MINIMAL`.

Gemini 2.5 Pro działa wyłącznie w trybie myślenia i odrzuca jawne
`thinkingBudget: 0`; OpenClaw usuwa tę wartość z żądań Gemini 2.5 Pro
zamiast ją wysyłać.
</Tip>

## Generowanie obrazów

Dołączony dostawca generowania obrazów `google` domyślnie używa
`google/gemini-3.1-flash-image-preview`.

- Obsługuje także `google/gemini-3-pro-image-preview`
- Generowanie: maksymalnie 4 obrazy na żądanie
- Tryb edycji: włączony, maksymalnie 5 obrazów wejściowych
- Sterowanie geometrią: `size`, `aspectRatio` i `resolution`

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
Wspólne parametry narzędzia, wybór dostawcy i zachowanie mechanizmu przełączania awaryjnego opisano w sekcji [Generowanie obrazów](/pl/tools/image-generation).
</Note>

## Generowanie wideo

Dołączony plugin `google` rejestruje również generowanie wideo za pośrednictwem współdzielonego
narzędzia `video_generate`.

- Domyślny model wideo: `google/veo-3.1-fast-generate-preview`
- Tryby: zamiana tekstu na wideo, obrazu na wideo oraz przepływy z pojedynczym wideo referencyjnym
- Obsługuje `aspectRatio` (`16:9`, `9:16`) i `resolution` (`720P`, `1080P`); Veo obecnie nie obsługuje wyjściowego dźwięku
- Obsługiwane czasy trwania: **4, 6 lub 8 sekund** (inne wartości są zaokrąglane do najbliższej dozwolonej wartości)

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
Wspólne parametry narzędzia, wybór dostawcy i zachowanie mechanizmu przełączania awaryjnego opisano w sekcji [Generowanie wideo](/pl/tools/video-generation).
</Note>

## Generowanie muzyki

Dołączony plugin `google` rejestruje również generowanie muzyki za pośrednictwem współdzielonego
narzędzia `music_generate`.

- Domyślny model muzyczny: `google/lyria-3-clip-preview`
- Obsługuje także `google/lyria-3-pro-preview`
- Sterowanie poleceniem: `lyrics` i `instrumental`
- Format wyjściowy: domyślnie `mp3`, a także `wav` w `google/lyria-3-pro-preview`
- Dane referencyjne: maksymalnie 10 obrazów
- Uruchomienia korzystające z sesji są odłączane za pośrednictwem współdzielonego przepływu zadań/stanu, w tym `action: "status"`

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
Wspólne parametry narzędzia, wybór dostawcy i zachowanie mechanizmu przełączania awaryjnego opisano w sekcji [Generowanie muzyki](/pl/tools/music-generation).
</Note>

## Zamiana tekstu na mowę

Dołączony dostawca mowy `google` korzysta ze ścieżki TTS Gemini API z
`gemini-3.1-flash-tts-preview`.

- Domyślny głos: `Kore`
- Uwierzytelnianie: `messages.tts.providers.google.apiKey`, `models.providers.google.apiKey`, `GEMINI_API_KEY` lub `GOOGLE_API_KEY`
- Dane wyjściowe: WAV dla zwykłych załączników TTS, Opus dla docelowych wiadomości głosowych, PCM dla Talk/telefonii
- Dane wyjściowe wiadomości głosowych: format PCM Google jest opakowywany jako WAV i transkodowany do Opus 48 kHz za pomocą `ffmpeg`

Wsadowa ścieżka Gemini TTS firmy Google zwraca wygenerowany dźwięk w ukończonej
odpowiedzi `generateContent`. W rozmowach głosowych wymagających najmniejszych opóźnień należy użyć
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
          audioProfile: "Mów profesjonalnie i spokojnym tonem.",
        },
      },
    },
  },
}
```

TTS Gemini API używa poleceń w języku naturalnym do sterowania stylem. Należy ustawić
`audioProfile`, aby dodać wielokrotnie używane polecenie stylu przed wypowiadanym tekstem. Należy ustawić
`speakerName`, jeśli tekst polecenia odwołuje się do nazwanego mówcy.

TTS Gemini API akceptuje również ekspresyjne znaczniki dźwiękowe w nawiasach kwadratowych,
takie jak `[whispers]` lub `[laughs]`. Aby znaczniki nie pojawiały się w widocznej odpowiedzi czatu,
ale były wysyłane do TTS, należy umieścić je w bloku `[[tts:text]]...[[/tts:text]]`:

```text
Oto czysty tekst odpowiedzi.

[[tts:text]][whispers] Oto wersja mówiona.[[/tts:text]]
```

<Note>
Klucz API z Google Cloud Console ograniczony do Gemini API jest prawidłowy dla tego
dostawcy. Nie jest to osobna ścieżka Cloud Text-to-Speech API.
</Note>

## Głos w czasie rzeczywistym

Dołączony plugin `google` rejestruje dostawcę głosu w czasie rzeczywistym opartego na
Gemini Live API dla mostów dźwiękowych zaplecza, takich jak Voice Call i Google Meet.

| Ustawienie                      | Ścieżka konfiguracji                                                 | Wartość domyślna                                                                       |
| ------------------------------- | -------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Model                           | `plugins.entries.voice-call.config.realtime.providers.google.model` | `gemini-3.1-flash-live-preview`                                                       |
| Głos                            | `...google.voice`                                                   | `Kore`                                                                                |
| Temperatura                     | `...google.temperature`                                             | (nie ustawiono)                                                                        |
| Czułość początku VAD            | `...google.startSensitivity`                                        | (nie ustawiono)                                                                        |
| Czułość końca VAD               | `...google.endSensitivity`                                          | (nie ustawiono)                                                                        |
| Czas trwania ciszy              | `...google.silenceDurationMs`                                       | (nie ustawiono)                                                                        |
| Obsługa aktywności              | `...google.activityHandling`                                        | Wartość domyślna Google, `start-of-activity-interrupts`                                |
| Zakres tury                     | `...google.turnCoverage`                                            | Wartość domyślna Google, `audio-activity-and-all-video`                                |
| Wyłączenie automatycznego VAD   | `...google.automaticActivityDetectionDisabled`                      | `false`                                                                               |
| Wznawianie sesji                | `...google.sessionResumption`                                       | `true`                                                                                |
| Kompresja kontekstu             | `...google.contextWindowCompression`                                | `true`                                                                                |
| Klucz API                       | `...google.apiKey`                                                  | W razie braku używa `models.providers.google.apiKey`, `GEMINI_API_KEY` lub `GOOGLE_API_KEY` |

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
Interfejs Google Live API używa dwukierunkowego dźwięku i wywoływania funkcji przez WebSocket.
OpenClaw dostosowuje dźwięk z mostka telefonicznego/Meet do strumienia PCM interfejsu Gemini Live API i
utrzymuje wywołania narzędzi we wspólnym kontrakcie głosowym czasu rzeczywistego. Należy pozostawić `temperature`
bez ustawienia, chyba że konieczna jest zmiana próbkowania; OpenClaw pomija wartości niedodatnie,
ponieważ Google Live może zwracać transkrypcje bez dźwięku dla `temperature: 0`.
Transkrypcja Gemini API jest włączona bez `languageCodes`; obecna wersja zestawu Google
SDK odrzuca wskazówki dotyczące kodu języka w tej ścieżce API.
</Note>

<Note>
Gemini 3.1 Live przyjmuje tekst konwersacyjny przez dane wejściowe czasu rzeczywistego i używa
sekwencyjnego wywoływania funkcji. OpenClaw pomija dla tego modelu starsze `NON_BLOCKING`,
planowanie odpowiedzi funkcji i pola dialogu afektywnego. Zalecane jest
`thinkingLevel`; skonfigurowane dodatnie wartości `thinkingBudget` są mapowane na
najbliższy obsługiwany poziom, natomiast `-1` pozostawia wartość domyślną Google. Zobacz
[porównanie możliwości Gemini Live](https://ai.google.dev/gemini-api/docs/live-api/capabilities).
</Note>

<Note>
Funkcja rozmowy w interfejsie Control UI obsługuje sesje Google Live w przeglądarce z ograniczonymi tokenami
jednorazowego użytku. Dostawcy głosu czasu rzeczywistego działający wyłącznie po stronie zaplecza mogą również korzystać z ogólnego
transportu przekaźnikowego Gateway, który przechowuje dane uwierzytelniające dostawcy w Gateway.
</Note>

W celu weryfikacji na żywo przez opiekuna należy uruchomić
`OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`.
Test dymny obejmuje również ścieżki zaplecza/WebRTC OpenAI; etap Google generuje token
Live API o takim samym ograniczonym formacie, jakiego używa funkcja rozmowy w interfejsie Control UI, otwiera punkt końcowy
WebSocket przeglądarki, wysyła początkowy ładunek konfiguracji i oczekuje na
`setupComplete`.

## Konfiguracja zaawansowana

<AccordionGroup>
  <Accordion title="Bezpośrednie ponowne użycie pamięci podręcznej Gemini">
    W przypadku bezpośrednich uruchomień Gemini API (`api: "google-generative-ai"`) OpenClaw
    przekazuje skonfigurowany uchwyt `cachedContent` do żądań Gemini.

    - Parametry dla modelu lub parametry globalne można skonfigurować za pomocą
      `cachedContent` albo starszego `cached_content`
    - Parametry z bardziej szczegółowego zakresu (poziom modelu zamiast globalnego) zawsze mają pierwszeństwo.
      Jeśli oba klucze są ustawione w tym samym zakresie, pierwszeństwo ma `cached_content`.
      Aby uniknąć niespodziewanego działania, należy używać tylko jednego klucza w każdym zakresie.
    - Przykładowa wartość: `cachedContents/prebuilt-context`
    - Użycie wynikające z trafienia w pamięci podręcznej Gemini jest normalizowane do OpenClaw `cacheRead` z
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

  <Accordion title="Uwagi dotyczące używania Gemini CLI">
    Podczas korzystania z dostawcy OAuth `google-gemini-cli` OpenClaw domyślnie używa danych wyjściowych
    Gemini CLI `stream-json` i normalizuje użycie na podstawie końcowego
    ładunku `stats`. Starsze nadpisania `--output-format json` nadal korzystają z
    parsera JSON.

    - Tekst odpowiedzi przesyłanej strumieniowo pochodzi ze zdarzeń asystenta `message`.
    - W przypadku starszych danych wyjściowych JSON tekst odpowiedzi pochodzi z pola `response` w danych JSON interfejsu CLI.
    - Jeśli interfejs CLI pozostawi `usage` puste, użycie wykorzystuje zastępczo `stats`.
    - `stats.cached` jest normalizowane do OpenClaw `cacheRead`.
    - Jeśli brakuje `stats.input`, OpenClaw wylicza tokeny wejściowe z
      `stats.input_tokens - stats.cached`.

  </Accordion>

  <Accordion title="Konfiguracja środowiska i demona">
    Jeśli Gateway działa jako demon (launchd/systemd), należy upewnić się, że `GEMINI_API_KEY`
    jest dostępne dla tego procesu (na przykład w `~/.openclaw/.env` lub za pośrednictwem
    `env.shellEnv`).
  </Accordion>
</AccordionGroup>

## Powiązane

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
