---
read_when:
    - Chcesz używać modeli Google Gemini z OpenClaw
    - Potrzebujesz klucza API albo przepływu uwierzytelniania OAuth
summary: Konfiguracja Google Gemini (klucz API + OAuth, generowanie obrazów, rozumienie multimediów, TTS, wyszukiwanie w sieci)
title: Google (Gemini)
x-i18n:
    generated_at: "2026-05-10T19:51:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: dd61383edad3192577d37c9a706470828d59edd5a187ef4f3c30985afaf46167
    source_path: providers/google.md
    workflow: 16
---

Plugin Google zapewnia dostęp do modeli Gemini przez Google AI Studio, a także
generowanie obrazów, rozumienie multimediów (obraz/audio/wideo), zamianę tekstu na mowę oraz wyszukiwanie w sieci przez
Gemini Grounding.

- Dostawca: `google`
- Uwierzytelnianie: `GEMINI_API_KEY` lub `GOOGLE_API_KEY`
- API: Google Gemini API
- Opcja środowiska uruchomieniowego: provider/model `agentRuntime.id: "google-gemini-cli"`
  ponownie używa Gemini CLI OAuth, zachowując kanoniczne odwołania do modeli jako `google/*`.

## Pierwsze kroki

Wybierz preferowaną metodę uwierzytelniania i wykonaj kroki konfiguracji.

<Tabs>
  <Tab title="Klucz API">
    **Najlepsze do:** standardowego dostępu do Gemini API przez Google AI Studio.

    <Steps>
      <Step title="Uruchom wdrażanie">
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

    (Lub warianty `GEMINI_CLI_*`.)

    <Note>
    Jeśli żądania Gemini CLI OAuth kończą się niepowodzeniem po zalogowaniu, ustaw `GOOGLE_CLOUD_PROJECT` lub
    `GOOGLE_CLOUD_PROJECT_ID` na hoście gatewaya i spróbuj ponownie.
    </Note>

    <Note>
    Jeśli logowanie kończy się niepowodzeniem przed uruchomieniem przepływu w przeglądarce, upewnij się, że lokalne polecenie `gemini`
    jest zainstalowane i dostępne w `PATH`.
    </Note>

    Odwołania do modeli `google-gemini-cli/*` są starszymi aliasami zgodności. Nowe
    konfiguracje powinny używać odwołań do modeli `google/*` oraz środowiska uruchomieniowego `google-gemini-cli`,
    gdy wymagają lokalnego wykonywania Gemini CLI.

  </Tab>
</Tabs>

## Możliwości

| Możliwość             | Obsługiwane                     |
| ---------------------- | ----------------------------- |
| Uzupełnianie czatu       | Tak                           |
| Generowanie obrazów       | Tak                           |
| Generowanie muzyki       | Tak                           |
| Zamiana tekstu na mowę         | Tak                           |
| Głos w czasie rzeczywistym         | Tak (Google Live API)         |
| Rozumienie obrazów    | Tak                           |
| Transkrypcja audio    | Tak                           |
| Rozumienie wideo    | Tak                           |
| Wyszukiwanie w sieci (Grounding) | Tak                           |
| Myślenie/rozumowanie     | Tak (Gemini 2.5+ / Gemini 3+) |
| Modele Gemma 4         | Tak                           |

## Wyszukiwanie w sieci

Dołączony dostawca wyszukiwania w sieci `gemini` używa Gemini Google Search grounding.
Skonfiguruj dedykowany klucz wyszukiwania w `plugins.entries.google.config.webSearch`,
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

Kolejność pierwszeństwa poświadczeń to dedykowany `webSearch.apiKey`, następnie `GEMINI_API_KEY`,
a potem `models.providers.google.apiKey`. `webSearch.baseUrl` jest opcjonalny i
istnieje dla proxy operatorów lub zgodnych punktów końcowych Gemini API; jeśli zostanie pominięty,
wyszukiwanie w sieci Gemini ponownie używa `models.providers.google.baseUrl`. Zobacz
[Wyszukiwanie Gemini](/pl/tools/gemini-search), aby poznać zachowanie narzędzia specyficzne dla dostawcy.

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
Ustawienie myślenia na `off` zachowuje wyłączone myślenie zamiast mapować je na
`MINIMAL`.
</Tip>

## Generowanie obrazów

Dołączony dostawca generowania obrazów `google` domyślnie używa
`google/gemini-3.1-flash-image-preview`.

- Obsługuje też `google/gemini-3-pro-image-preview`
- Generowanie: do 4 obrazów na żądanie
- Tryb edycji: włączony, do 5 obrazów wejściowych
- Kontrolki geometrii: `size`, `aspectRatio` i `resolution`

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
Zobacz [Generowanie obrazów](/pl/tools/image-generation), aby poznać wspólne parametry narzędzia, wybór dostawcy i zachowanie przełączania awaryjnego.
</Note>

## Generowanie wideo

Dołączony Plugin `google` rejestruje również generowanie wideo przez wspólne
narzędzie `video_generate`.

- Domyślny model wideo: `google/veo-3.1-fast-generate-preview`
- Tryby: text-to-video, image-to-video oraz przepływy z pojedynczym odniesieniem wideo
- Obsługuje `aspectRatio`, `resolution` i `audio`
- Bieżący limit czasu trwania: **od 4 do 8 sekund**

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
Zobacz [Generowanie wideo](/pl/tools/video-generation), aby poznać wspólne parametry narzędzia, wybór dostawcy i zachowanie przełączania awaryjnego.
</Note>

## Generowanie muzyki

Dołączony Plugin `google` rejestruje również generowanie muzyki przez wspólne
narzędzie `music_generate`.

- Domyślny model muzyki: `google/lyria-3-clip-preview`
- Obsługuje też `google/lyria-3-pro-preview`
- Kontrolki promptu: `lyrics` i `instrumental`
- Format wyjściowy: domyślnie `mp3`, plus `wav` w `google/lyria-3-pro-preview`
- Wejścia referencyjne: do 10 obrazów
- Uruchomienia oparte na sesji odłączają się przez wspólny przepływ zadania/statusu, w tym `action: "status"`

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
Zobacz [Generowanie muzyki](/pl/tools/music-generation), aby poznać wspólne parametry narzędzia, wybór dostawcy i zachowanie przełączania awaryjnego.
</Note>

## Zamiana tekstu na mowę

Dołączony dostawca mowy `google` używa ścieżki TTS Gemini API z
`gemini-3.1-flash-tts-preview`.

- Domyślny głos: `Kore`
- Uwierzytelnianie: `messages.tts.providers.google.apiKey`, `models.providers.google.apiKey`, `GEMINI_API_KEY` lub `GOOGLE_API_KEY`
- Wyjście: WAV dla zwykłych załączników TTS, Opus dla celów notatek głosowych, PCM dla Talk/telefonii
- Wyjście notatki głosowej: Google PCM jest opakowywane jako WAV i transkodowane do 48 kHz Opus przy użyciu `ffmpeg`

Ścieżka wsadowa Gemini TTS Google zwraca wygenerowane audio w ukończonej
odpowiedzi `generateContent`. Do rozmów głosowych z najniższym opóźnieniem użyj
dostawcy głosu w czasie rzeczywistym Google opartego na Gemini Live API zamiast wsadowego
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
          voiceName: "Kore",
          audioProfile: "Speak professionally with a calm tone.",
        },
      },
    },
  },
}
```

Gemini API TTS używa promptów w języku naturalnym do kontroli stylu. Ustaw
`audioProfile`, aby poprzedzić wypowiadany tekst wielokrotnego użytku promptem stylu. Ustaw
`speakerName`, gdy tekst promptu odnosi się do nazwanego mówcy.

Gemini API TTS akceptuje również ekspresyjne tagi audio w nawiasach kwadratowych w tekście,
takie jak `[whispers]` lub `[laughs]`. Aby nie pokazywać tagów w widocznej odpowiedzi czatu,
a jednocześnie wysłać je do TTS, umieść je wewnątrz bloku `[[tts:text]]...[[/tts:text]]`:

```text
Here is the clean reply text.

[[tts:text]][whispers] Here is the spoken version.[[/tts:text]]
```

<Note>
Klucz API Google Cloud Console ograniczony do Gemini API jest prawidłowy dla tego
dostawcy. Nie jest to osobna ścieżka Cloud Text-to-Speech API.
</Note>

## Głos w czasie rzeczywistym

Dołączony Plugin `google` rejestruje dostawcę głosu w czasie rzeczywistym opartego na
Gemini Live API dla backendowych mostów audio, takich jak Voice Call i Google Meet.

| Ustawienie            | Ścieżka konfiguracji                                                | Domyślne                                                                              |
| --------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Model                 | `plugins.entries.voice-call.config.realtime.providers.google.model` | `gemini-2.5-flash-native-audio-preview-12-2025`                                       |
| Głos                  | `...google.voice`                                                   | `Kore`                                                                                |
| Temperatura           | `...google.temperature`                                             | (nieustawione)                                                                        |
| Czułość początku VAD  | `...google.startSensitivity`                                        | (nieustawione)                                                                        |
| Czułość końca VAD     | `...google.endSensitivity`                                          | (nieustawione)                                                                        |
| Czas trwania ciszy    | `...google.silenceDurationMs`                                       | (nieustawione)                                                                        |
| Obsługa aktywności    | `...google.activityHandling`                                        | Domyślne ustawienie Google, `start-of-activity-interrupts`                            |
| Zakres tury           | `...google.turnCoverage`                                            | Domyślne ustawienie Google, `only-activity`                                           |
| Wyłącz auto VAD       | `...google.automaticActivityDetectionDisabled`                      | `false`                                                                               |
| Wznawianie sesji      | `...google.sessionResumption`                                       | `true`                                                                                |
| Kompresja kontekstu   | `...google.contextWindowCompression`                                | `true`                                                                                |
| Klucz API             | `...google.apiKey`                                                  | Używa awaryjnie `models.providers.google.apiKey`, `GEMINI_API_KEY` lub `GOOGLE_API_KEY` |

Przykładowa konfiguracja Voice Call czasu rzeczywistego:

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
OpenClaw dostosowuje audio z mostka telefonii/Meet do strumienia PCM Live API Gemini i
utrzymuje wywołania narzędzi we współdzielonym kontrakcie głosowym czasu rzeczywistego. Pozostaw `temperature`
nieustawione, chyba że potrzebujesz zmian próbkowania; OpenClaw pomija wartości niedodatnie,
ponieważ Google Live może zwracać transkrypcje bez audio dla `temperature: 0`.
Transkrypcja Gemini API jest włączana bez `languageCodes`; bieżący Google
SDK odrzuca wskazówki kodów języka w tej ścieżce API.
</Note>

<Note>
Control UI Talk obsługuje sesje przeglądarkowe Google Live z ograniczonymi, jednorazowymi
tokenami. Dostawcy głosu czasu rzeczywistego działający wyłącznie po stronie backendu mogą też działać przez ogólny
transport przekaźnika Gateway, który utrzymuje poświadczenia dostawcy na Gateway.
</Note>

Na potrzeby weryfikacji live przez maintainerów uruchom
`OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`.
Smoke obejmuje też ścieżki backend/WebRTC OpenAI; etap Google tworzy ten sam
ograniczony kształt tokena Live API, którego używa Control UI Talk, otwiera przeglądarkowy
punkt końcowy WebSocket, wysyła początkowy ładunek konfiguracji i czeka na
`setupComplete`.

## Konfiguracja zaawansowana

<AccordionGroup>
  <Accordion title="Direct Gemini cache reuse">
    W przypadku bezpośrednich uruchomień Gemini API (`api: "google-generative-ai"`) OpenClaw
    przekazuje skonfigurowany uchwyt `cachedContent` do żądań Gemini.

    - Skonfiguruj parametry per model albo globalne za pomocą
      `cachedContent` lub starszego `cached_content`
    - Jeśli obecne są oba, wygrywa `cachedContent`
    - Przykładowa wartość: `cachedContents/prebuilt-context`
    - Użycie trafienia w cache Gemini jest normalizowane do OpenClaw `cacheRead` z
      upstreamowego `cachedContentTokenCount`

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

  <Accordion title="Gemini CLI JSON usage notes">
    Podczas używania dostawcy OAuth `google-gemini-cli` OpenClaw normalizuje
    wyjście JSON CLI w następujący sposób:

    - Tekst odpowiedzi pochodzi z pola `response` w JSON CLI.
    - Użycie używa awaryjnie `stats`, gdy CLI pozostawia `usage` puste.
    - `stats.cached` jest normalizowane do OpenClaw `cacheRead`.
    - Jeśli brakuje `stats.input`, OpenClaw wyprowadza tokeny wejściowe z
      `stats.input_tokens - stats.cached`.

  </Accordion>

  <Accordion title="Environment and daemon setup">
    Jeśli Gateway działa jako daemon (launchd/systemd), upewnij się, że `GEMINI_API_KEY`
    jest dostępny dla tego procesu (na przykład w `~/.openclaw/.env` albo przez
    `env.shellEnv`).
  </Accordion>
</AccordionGroup>

## Powiązane

<CardGroup cols={2}>
  <Card title="Model selection" href="/pl/concepts/model-providers" icon="layers">
    Wybieranie dostawców, referencji modeli i zachowania przełączania awaryjnego.
  </Card>
  <Card title="Image generation" href="/pl/tools/image-generation" icon="image">
    Współdzielone parametry narzędzia obrazów i wybór dostawcy.
  </Card>
  <Card title="Video generation" href="/pl/tools/video-generation" icon="video">
    Współdzielone parametry narzędzia wideo i wybór dostawcy.
  </Card>
  <Card title="Music generation" href="/pl/tools/music-generation" icon="music">
    Współdzielone parametry narzędzia muzyki i wybór dostawcy.
  </Card>
</CardGroup>
