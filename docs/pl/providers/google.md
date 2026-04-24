---
read_when:
    - Chcesz używać modeli Google Gemini z OpenClaw
    - Potrzebujesz klucza API lub przepływu uwierzytelniania OAuth
summary: Konfiguracja Google Gemini (klucz API + OAuth, generowanie obrazów, rozumienie mediów, TTS, wyszukiwanie w sieci)
title: Google (Gemini)
x-i18n:
    generated_at: "2026-04-24T09:27:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7e66c9dd637e26976659d04b9b7e2452e6881945dab6011970f9e1c5e4a9a685
    source_path: providers/google.md
    workflow: 15
---

Plugin Google udostępnia dostęp do modeli Gemini przez Google AI Studio, a także
generowanie obrazów, rozumienie mediów (obraz/audio/wideo), zamianę tekstu na mowę oraz wyszukiwanie w sieci przez
Gemini Grounding.

- Dostawca: `google`
- Uwierzytelnianie: `GEMINI_API_KEY` lub `GOOGLE_API_KEY`
- API: Google Gemini API
- Alternatywny dostawca: `google-gemini-cli` (OAuth)

## Pierwsze kroki

Wybierz preferowaną metodę uwierzytelniania i wykonaj kroki konfiguracji.

<Tabs>
  <Tab title="Klucz API">
    **Najlepsze dla:** standardowego dostępu do Gemini API przez Google AI Studio.

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
    Zmienne środowiskowe `GEMINI_API_KEY` i `GOOGLE_API_KEY` są obie akceptowane. Użyj tej, którą masz już skonfigurowaną.
    </Tip>

  </Tab>

  <Tab title="Gemini CLI (OAuth)">
    **Najlepsze dla:** ponownego użycia istniejącego logowania Gemini CLI przez PKCE OAuth zamiast osobnego klucza API.

    <Warning>
    Dostawca `google-gemini-cli` jest nieoficjalną integracją. Niektórzy użytkownicy
    zgłaszają ograniczenia kont podczas używania OAuth w ten sposób. Korzystasz na własne ryzyko.
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
        typowe układy Windows/npm.
      </Step>
      <Step title="Zaloguj się przez OAuth">
        ```bash
        openclaw models auth login --provider google-gemini-cli --set-default
        ```
      </Step>
      <Step title="Sprawdź, czy model jest dostępny">
        ```bash
        openclaw models list --provider google-gemini-cli
        ```
      </Step>
    </Steps>

    - Model domyślny: `google-gemini-cli/gemini-3-flash-preview`
    - Alias: `gemini-cli`

    **Zmienne środowiskowe:**

    - `OPENCLAW_GEMINI_OAUTH_CLIENT_ID`
    - `OPENCLAW_GEMINI_OAUTH_CLIENT_SECRET`

    (Lub warianty `GEMINI_CLI_*`.)

    <Note>
    Jeśli żądania Gemini CLI OAuth kończą się niepowodzeniem po zalogowaniu, ustaw `GOOGLE_CLOUD_PROJECT` lub
    `GOOGLE_CLOUD_PROJECT_ID` na hoście Gateway i spróbuj ponownie.
    </Note>

    <Note>
    Jeśli logowanie kończy się niepowodzeniem przed uruchomieniem przepływu w przeglądarce, upewnij się, że lokalne polecenie `gemini`
    jest zainstalowane i dostępne w `PATH`.
    </Note>

    Dostawca `google-gemini-cli` tylko dla OAuth to osobna powierzchnia
    inferencji tekstowej. Generowanie obrazów, rozumienie mediów i Gemini Grounding pozostają przy
    identyfikatorze dostawcy `google`.

  </Tab>
</Tabs>

## Możliwości

| Możliwość             | Obsługiwane                   |
| --------------------- | ----------------------------- |
| Uzupełnienia czatu    | Tak                           |
| Generowanie obrazów   | Tak                           |
| Generowanie muzyki    | Tak                           |
| Zamiana tekstu na mowę | Tak                          |
| Głos w czasie rzeczywistym | Tak (Google Live API)    |
| Rozumienie obrazów    | Tak                           |
| Transkrypcja audio    | Tak                           |
| Rozumienie wideo      | Tak                           |
| Wyszukiwanie w sieci (Grounding) | Tak                |
| Myślenie/rozumowanie  | Tak (Gemini 2.5+ / Gemini 3+) |
| Modele Gemma 4        | Tak                           |

<Tip>
Modele Gemini 3 używają `thinkingLevel` zamiast `thinkingBudget`. OpenClaw mapuje
kontrolki rozumowania dla aliasów Gemini 3, Gemini 3.1 i `gemini-*-latest` na
`thinkingLevel`, aby domyślne przebiegi/przebiegi o niskim opóźnieniu nie wysyłały wyłączonych
wartości `thinkingBudget`.

Modele Gemma 4 (na przykład `gemma-4-26b-a4b-it`) obsługują tryb myślenia. OpenClaw
przepisuje `thinkingBudget` na obsługiwany przez Google `thinkingLevel` dla Gemma 4.
Ustawienie myślenia na `off` zachowuje wyłączenie myślenia zamiast mapowania na
`MINIMAL`.
</Tip>

## Generowanie obrazów

Dołączony do pakietu dostawca generowania obrazów `google` domyślnie używa
`google/gemini-3.1-flash-image-preview`.

- Obsługuje również `google/gemini-3-pro-image-preview`
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
Zobacz [Generowanie obrazów](/pl/tools/image-generation), aby poznać wspólne parametry narzędzia, wybór dostawcy i zachowanie failover.
</Note>

## Generowanie wideo

Dołączony do pakietu Plugin `google` rejestruje również generowanie wideo przez współdzielone
narzędzie `video_generate`.

- Domyślny model wideo: `google/veo-3.1-fast-generate-preview`
- Tryby: text-to-video, image-to-video i przepływy z pojedynczym wideo referencyjnym
- Obsługuje `aspectRatio`, `resolution` i `audio`
- Bieżące ograniczenie czasu trwania: **od 4 do 8 sekund**

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
Zobacz [Generowanie wideo](/pl/tools/video-generation), aby poznać wspólne parametry narzędzia, wybór dostawcy i zachowanie failover.
</Note>

## Generowanie muzyki

Dołączony do pakietu Plugin `google` rejestruje również generowanie muzyki przez współdzielone
narzędzie `music_generate`.

- Domyślny model muzyki: `google/lyria-3-clip-preview`
- Obsługuje także `google/lyria-3-pro-preview`
- Kontrolki promptów: `lyrics` i `instrumental`
- Format wyjściowy: domyślnie `mp3`, plus `wav` w `google/lyria-3-pro-preview`
- Wejścia referencyjne: do 10 obrazów
- Przebiegi oparte na sesji odłączają się przez współdzielony przepływ zadania/statusu, w tym `action: "status"`

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
Zobacz [Generowanie muzyki](/pl/tools/music-generation), aby poznać wspólne parametry narzędzia, wybór dostawcy i zachowanie failover.
</Note>

## Zamiana tekstu na mowę

Dołączony do pakietu dostawca mowy `google` używa ścieżki Gemini API TTS z
`gemini-3.1-flash-tts-preview`.

- Domyślny głos: `Kore`
- Uwierzytelnianie: `messages.tts.providers.google.apiKey`, `models.providers.google.apiKey`, `GEMINI_API_KEY` lub `GOOGLE_API_KEY`
- Wyjście: WAV dla zwykłych załączników TTS, PCM dla Talk/telefonii
- Natywne wyjście notatek głosowych: nieobsługiwane na tej ścieżce Gemini API, ponieważ API zwraca PCM zamiast Opus

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
        },
      },
    },
  },
}
```

Gemini API TTS akceptuje ekspresyjne kwadratowe tagi audio w tekście, takie jak
`[whispers]` lub `[laughs]`. Aby ukryć tagi przed widoczną odpowiedzią na czacie, a jednocześnie
wysłać je do TTS, umieść je wewnątrz bloku `[[tts:text]]...[[/tts:text]]`:

```text
Here is the clean reply text.

[[tts:text]][whispers] Here is the spoken version.[[/tts:text]]
```

<Note>
Klucz API Google Cloud Console ograniczony do Gemini API jest prawidłowy dla tego
dostawcy. To nie jest osobna ścieżka Cloud Text-to-Speech API.
</Note>

## Głos w czasie rzeczywistym

Dołączony do pakietu Plugin `google` rejestruje dostawcę głosu w czasie rzeczywistym oparty na
Gemini Live API dla mostów audio zaplecza, takich jak Voice Call i Google Meet.

| Ustawienie            | Ścieżka konfiguracji                                                | Domyślnie                                                                           |
| --------------------- | ------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Model                 | `plugins.entries.voice-call.config.realtime.providers.google.model` | `gemini-2.5-flash-native-audio-preview-12-2025`                                     |
| Głos                  | `...google.voice`                                                   | `Kore`                                                                              |
| Temperatura           | `...google.temperature`                                             | (nieustawione)                                                                      |
| Czułość początku VAD  | `...google.startSensitivity`                                        | (nieustawione)                                                                      |
| Czułość końca VAD     | `...google.endSensitivity`                                          | (nieustawione)                                                                      |
| Czas ciszy            | `...google.silenceDurationMs`                                       | (nieustawione)                                                                      |
| Klucz API             | `...google.apiKey`                                                  | Wraca do `models.providers.google.apiKey`, `GEMINI_API_KEY` lub `GOOGLE_API_KEY`   |

Przykład konfiguracji Voice Call realtime:

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
OpenClaw dostosowuje audio mostu telefonicznego/Meet do strumienia PCM Live API Gemini i
utrzymuje wywołania narzędzi na współdzielonym kontrakcie głosu w czasie rzeczywistym. Pozostaw `temperature`
nieustawione, chyba że potrzebujesz zmian próbkowania; OpenClaw pomija wartości niedodatnie,
ponieważ Google Live może zwracać transkrypcje bez audio dla `temperature: 0`.
Transkrypcja Gemini API jest włączona bez `languageCodes`; obecny Google
SDK odrzuca wskazówki kodów języków na tej ścieżce API.
</Note>

<Note>
Sesje przeglądarkowe Talk w interfejsie sterowania nadal wymagają dostawcy
głosu w czasie rzeczywistym z implementacją sesji WebRTC w przeglądarce. Obecnie tą ścieżką jest OpenAI Realtime; dostawca
Google jest przeznaczony dla mostów realtime zaplecza.
</Note>

## Konfiguracja zaawansowana

<AccordionGroup>
  <Accordion title="Bezpośrednie ponowne użycie cache Gemini">
    Dla bezpośrednich przebiegów Gemini API (`api: "google-generative-ai"`), OpenClaw
    przekazuje skonfigurowany uchwyt `cachedContent` do żądań Gemini.

    - Skonfiguruj parametry dla modelu lub globalnie za pomocą
      `cachedContent` lub starszego `cached_content`
    - Jeśli obecne są oba, `cachedContent` ma pierwszeństwo
    - Przykładowa wartość: `cachedContents/prebuilt-context`
    - Użycie trafienia cache Gemini jest normalizowane w OpenClaw do `cacheRead` z
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

  <Accordion title="Uwagi dotyczące użycia JSON w Gemini CLI">
    Podczas używania dostawcy OAuth `google-gemini-cli` OpenClaw normalizuje
    wyjście JSON CLI w następujący sposób:

    - Tekst odpowiedzi pochodzi z pola `response` JSON CLI.
    - Użycie wraca do `stats`, gdy CLI pozostawia `usage` puste.
    - `stats.cached` jest normalizowane do `cacheRead` w OpenClaw.
    - Jeśli brakuje `stats.input`, OpenClaw wyprowadza tokeny wejściowe z
      `stats.input_tokens - stats.cached`.

  </Accordion>

  <Accordion title="Konfiguracja środowiska i demona">
    Jeśli Gateway działa jako demon (launchd/systemd), upewnij się, że `GEMINI_API_KEY`
    jest dostępne dla tego procesu (na przykład w `~/.openclaw/.env` lub przez
    `env.shellEnv`).
  </Accordion>
</AccordionGroup>

## Powiązane

<CardGroup cols={2}>
  <Card title="Wybór modelu" href="/pl/concepts/model-providers" icon="layers">
    Wybieranie dostawców, odwołań do modeli i zachowania failover.
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
