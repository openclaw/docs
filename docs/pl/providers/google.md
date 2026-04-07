---
read_when:
    - Chcesz używać modeli Google Gemini z OpenClaw
    - Potrzebujesz przepływu uwierzytelniania za pomocą klucza API lub OAuth
summary: Konfiguracja Google Gemini (klucz API + OAuth, generowanie obrazów, rozumienie mediów, wyszukiwanie w sieci)
title: Google (Gemini)
x-i18n:
    generated_at: "2026-04-07T09:49:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: e9e558f5ce35c853e0240350be9a1890460c5f7f7fd30b05813a656497dee516
    source_path: providers/google.md
    workflow: 15
---

# Google (Gemini)

Wtyczka Google zapewnia dostęp do modeli Gemini przez Google AI Studio, a także
do generowania obrazów, rozumienia mediów (obraz/dźwięk/wideo) oraz wyszukiwania w sieci przez
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

Alternatywny dostawca `google-gemini-cli` używa OAuth PKCE zamiast klucza API.
To nieoficjalna integracja; niektórzy użytkownicy zgłaszają ograniczenia
konta. Używasz na własne ryzyko.

- Model domyślny: `google-gemini-cli/gemini-3-flash-preview`
- Alias: `gemini-cli`
- Wymaganie instalacyjne: lokalnie dostępny Gemini CLI jako `gemini`
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

Jeśli żądania OAuth Gemini CLI kończą się błędem po zalogowaniu, ustaw
`GOOGLE_CLOUD_PROJECT` lub `GOOGLE_CLOUD_PROJECT_ID` na hoście gateway i
spróbuj ponownie.

Jeśli logowanie kończy się błędem przed rozpoczęciem przepływu w przeglądarce, upewnij się, że lokalne polecenie `gemini`
jest zainstalowane i dostępne w `PATH`. OpenClaw obsługuje zarówno instalacje Homebrew,
jak i globalne instalacje npm, w tym typowe układy Windows/npm.

Uwagi dotyczące użycia JSON przez Gemini CLI:

- Tekst odpowiedzi pochodzi z pola `response` w JSON CLI.
- Użycie przełącza się awaryjnie na `stats`, gdy CLI pozostawia `usage` puste.
- `stats.cached` jest normalizowane do OpenClaw `cacheRead`.
- Jeśli `stats.input` nie istnieje, OpenClaw wyprowadza liczbę tokenów wejściowych z
  `stats.input_tokens - stats.cached`.

## Możliwości

| Możliwość             | Obsługiwane        |
| --------------------- | ------------------ |
| Uzupełnianie czatu    | Tak                |
| Generowanie obrazów   | Tak                |
| Generowanie muzyki    | Tak                |
| Rozumienie obrazów    | Tak                |
| Transkrypcja audio    | Tak                |
| Rozumienie wideo      | Tak                |
| Wyszukiwanie w sieci (Grounding) | Tak      |
| Thinking/reasoning    | Tak (Gemini 3.1+)  |

## Bezpośrednie ponowne użycie cache Gemini

Dla bezpośrednich uruchomień API Gemini (`api: "google-generative-ai"`), OpenClaw
przekazuje teraz skonfigurowany uchwyt `cachedContent` dalej do żądań Gemini.

- Skonfiguruj parametry per model lub globalnie za pomocą
  `cachedContent` albo starszego `cached_content`
- Jeśli obecne są oba, `cachedContent` ma pierwszeństwo
- Przykładowa wartość: `cachedContents/prebuilt-context`
- Użycie przy trafieniu do cache Gemini jest normalizowane do OpenClaw `cacheRead` z
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
- Sterowanie geometrią: `size`, `aspectRatio` i `resolution`

Dostawca `google-gemini-cli`, dostępny tylko przez OAuth, to oddzielna powierzchnia
wnioskowania tekstowego. Generowanie obrazów, rozumienie mediów i Gemini Grounding pozostają przy
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
parametry narzędzia, wybór dostawcy i zachowanie failover.

## Generowanie wideo

Dołączona wtyczka `google` rejestruje także generowanie wideo przez wspólne
narzędzie `video_generate`.

- Domyślny model wideo: `google/veo-3.1-fast-generate-preview`
- Tryby: text-to-video, image-to-video i przepływy z referencją pojedynczego wideo
- Obsługuje `aspectRatio`, `resolution` i `audio`
- Bieżące ograniczenie długości: **od 4 do 8 sekund**

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
parametry narzędzia, wybór dostawcy i zachowanie failover.

## Generowanie muzyki

Dołączona wtyczka `google` rejestruje także generowanie muzyki przez wspólne
narzędzie `music_generate`.

- Domyślny model muzyczny: `google/lyria-3-clip-preview`
- Obsługuje także `google/lyria-3-pro-preview`
- Sterowanie promptem: `lyrics` i `instrumental`
- Format wyjściowy: domyślnie `mp3`, a także `wav` dla `google/lyria-3-pro-preview`
- Wejścia referencyjne: do 10 obrazów
- Uruchomienia oparte na sesji są odłączane przez wspólny przepływ zadanie/status, w tym `action: "status"`

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
parametry narzędzia, wybór dostawcy i zachowanie failover.

## Uwaga dotycząca środowiska

Jeśli Gateway działa jako demon (launchd/systemd), upewnij się, że `GEMINI_API_KEY`
jest dostępne dla tego procesu (na przykład w `~/.openclaw/.env` lub przez
`env.shellEnv`).
