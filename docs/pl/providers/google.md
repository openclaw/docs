---
read_when:
    - Chcesz używać modeli Google Gemini z OpenClaw
    - Potrzebujesz klucza API lub przepływu uwierzytelniania OAuth
summary: Konfiguracja Google Gemini (klucz API + OAuth, generowanie obrazów, rozumienie multimediów, wyszukiwanie w sieci)
title: Google (Gemini)
x-i18n:
    generated_at: "2026-04-08T09:44:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: fad2ff68987301bd86145fa6e10de8c7b38d5bd5dbcd13db9c883f7f5b9a4e01
    source_path: providers/google.md
    workflow: 15
---

# Google (Gemini)

Plugin Google zapewnia dostęp do modeli Gemini przez Google AI Studio, a także
generowanie obrazów, rozumienie multimediów (obraz/audio/wideo) oraz wyszukiwanie w sieci przez
Gemini Grounding.

- Dostawca: `google`
- Uwierzytelnianie: `GEMINI_API_KEY` lub `GOOGLE_API_KEY`
- API: Google Gemini API
- Alternatywny dostawca: `google-gemini-cli` (OAuth)

## Szybki start

1. Ustaw klucz API:

```bash
openclaw onboard --auth-choice gemini-api-key
```

2. Ustaw model domyślny:

```json5
{
  agents: {
    defaults: {
      model: { primary: "google/gemini-3.1-pro-preview" },
    },
  },
}
```

## Przykład nieinteraktywny

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice gemini-api-key \
  --gemini-api-key "$GEMINI_API_KEY"
```

## OAuth (Gemini CLI)

Alternatywny dostawca `google-gemini-cli` używa PKCE OAuth zamiast klucza API.
Jest to nieoficjalna integracja; niektórzy użytkownicy zgłaszają
ograniczenia konta. Używasz na własne ryzyko.

- Model domyślny: `google-gemini-cli/gemini-3-flash-preview`
- Alias: `gemini-cli`
- Wymaganie instalacyjne: lokalne Gemini CLI dostępne jako `gemini`
  - Homebrew: `brew install gemini-cli`
  - npm: `npm install -g @google/gemini-cli`
- Logowanie:

```bash
openclaw models auth login --provider google-gemini-cli --set-default
```

Zmienne środowiskowe:

- `OPENCLAW_GEMINI_OAUTH_CLIENT_ID`
- `OPENCLAW_GEMINI_OAUTH_CLIENT_SECRET`

(Lub warianty `GEMINI_CLI_*`.)

Jeśli żądania OAuth Gemini CLI nie działają po zalogowaniu, ustaw
`GOOGLE_CLOUD_PROJECT` lub `GOOGLE_CLOUD_PROJECT_ID` na hoście gatewaya i
spróbuj ponownie.

Jeśli logowanie nie powiedzie się przed rozpoczęciem przepływu w przeglądarce, upewnij się, że lokalne polecenie `gemini`
jest zainstalowane i dostępne w `PATH`. OpenClaw obsługuje zarówno instalacje Homebrew,
jak i globalne instalacje npm, w tym typowe układy Windows/npm.

Uwagi dotyczące użycia JSON w Gemini CLI:

- Tekst odpowiedzi pochodzi z pola JSON `response` CLI.
- Użycie przełącza się awaryjnie na `stats`, gdy CLI pozostawia `usage` puste.
- `stats.cached` jest normalizowane do OpenClaw `cacheRead`.
- Jeśli brakuje `stats.input`, OpenClaw wylicza tokeny wejściowe z
  `stats.input_tokens - stats.cached`.

## Możliwości

| Możliwość             | Obsługiwane       |
| --------------------- | ----------------- |
| Uzupełnianie czatu    | Tak               |
| Generowanie obrazów   | Tak               |
| Generowanie muzyki    | Tak               |
| Rozumienie obrazów    | Tak               |
| Transkrypcja audio    | Tak               |
| Rozumienie wideo      | Tak               |
| Wyszukiwanie w sieci (Grounding) | Tak     |
| Thinking/reasoning    | Tak (Gemini 3.1+) |
| Modele Gemma 4        | Tak               |

Modele Gemma 4 (na przykład `gemma-4-26b-a4b-it`) obsługują tryb thinking. OpenClaw przepisuje `thinkingBudget` na obsługiwane przez Google `thinkingLevel` dla Gemma 4. Ustawienie thinking na `off` zachowuje wyłączony thinking zamiast mapowania na `MINIMAL`.

## Bezpośrednie ponowne użycie pamięci podręcznej Gemini

Dla bezpośrednich uruchomień Gemini API (`api: "google-generative-ai"`), OpenClaw teraz
przekazuje skonfigurowany uchwyt `cachedContent` do żądań Gemini.

- Skonfiguruj parametry dla modelu lub globalne za pomocą
  `cachedContent` albo starszego `cached_content`
- Jeśli obecne są oba, `cachedContent` ma pierwszeństwo
- Przykładowa wartość: `cachedContents/prebuilt-context`
- Użycie trafienia pamięci podręcznej Gemini jest normalizowane do OpenClaw `cacheRead` z
  nadrzędnego `cachedContentTokenCount`

Przykład:

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

## Generowanie obrazów

Dołączony dostawca generowania obrazów `google` domyślnie używa
`google/gemini-3.1-flash-image-preview`.

- Obsługuje także `google/gemini-3-pro-image-preview`
- Generowanie: do 4 obrazów na żądanie
- Tryb edycji: włączony, do 5 obrazów wejściowych
- Kontrola geometrii: `size`, `aspectRatio` i `resolution`

Dostawca `google-gemini-cli`, dostępny tylko przez OAuth, jest osobną powierzchnią
inferencji tekstowej. Generowanie obrazów, rozumienie multimediów i Gemini Grounding pozostają na
identyfikatorze dostawcy `google`.

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

Zobacz [Generowanie obrazów](/pl/tools/image-generation), aby poznać wspólne
parametry narzędzia, wybór dostawcy i zachowanie awaryjne.

## Generowanie wideo

Dołączony plugin `google` rejestruje także generowanie wideo przez współdzielone
narzędzie `video_generate`.

- Domyślny model wideo: `google/veo-3.1-fast-generate-preview`
- Tryby: tekst-na-wideo, obraz-na-wideo oraz przepływy z odniesieniem do pojedynczego wideo
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

Zobacz [Generowanie wideo](/pl/tools/video-generation), aby poznać wspólne
parametry narzędzia, wybór dostawcy i zachowanie awaryjne.

## Generowanie muzyki

Dołączony plugin `google` rejestruje także generowanie muzyki przez współdzielone
narzędzie `music_generate`.

- Domyślny model muzyki: `google/lyria-3-clip-preview`
- Obsługuje także `google/lyria-3-pro-preview`
- Kontrolki promptu: `lyrics` i `instrumental`
- Format wyjściowy: domyślnie `mp3`, a także `wav` w `google/lyria-3-pro-preview`
- Wejścia referencyjne: do 10 obrazów
- Uruchomienia oparte na sesji są odłączane przez współdzielony przepływ zadań/statusu, w tym `action: "status"`

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

Zobacz [Generowanie muzyki](/pl/tools/music-generation), aby poznać wspólne
parametry narzędzia, wybór dostawcy i zachowanie awaryjne.

## Uwaga dotycząca środowiska

Jeśli Gateway działa jako demon (launchd/systemd), upewnij się, że `GEMINI_API_KEY`
jest dostępny dla tego procesu (na przykład w `~/.openclaw/.env` lub przez
`env.shellEnv`).
