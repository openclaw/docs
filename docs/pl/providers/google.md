---
read_when:
    - Chcesz używać modeli Google Gemini z OpenClaw
    - Potrzebujesz przepływu uwierzytelniania kluczem API lub OAuth
summary: Konfiguracja Google Gemini (klucz API + OAuth, generowanie obrazów, rozumienie mediów, wyszukiwanie w sieci)
title: Google (Gemini)
x-i18n:
    generated_at: "2026-04-05T14:03:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: fa3c4326e83fad277ae4c2cb9501b6e89457afcfa7e3e1d57ae01c9c0c6846e2
    source_path: providers/google.md
    workflow: 15
---

# Google (Gemini)

Plugin Google zapewnia dostęp do modeli Gemini przez Google AI Studio, a także
generowanie obrazów, rozumienie mediów (obrazy/audio/wideo) oraz wyszukiwanie w sieci przez
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
To nieoficjalna integracja; niektórzy użytkownicy zgłaszają
ograniczenia kont. Używasz na własne ryzyko.

- Model domyślny: `google-gemini-cli/gemini-3.1-pro-preview`
- Alias: `gemini-cli`
- Wymaganie instalacyjne: lokalny Gemini CLI dostępny jako `gemini`
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
`GOOGLE_CLOUD_PROJECT` lub `GOOGLE_CLOUD_PROJECT_ID` na hoście Gateway i
spróbuj ponownie.

Jeśli logowanie kończy się niepowodzeniem przed uruchomieniem przepływu w przeglądarce, upewnij się,
że lokalne polecenie `gemini` jest zainstalowane i dostępne w `PATH`. OpenClaw obsługuje zarówno instalacje
Homebrew, jak i globalne instalacje npm, w tym typowe układy Windows/npm.

Uwagi dotyczące użycia JSON w Gemini CLI:

- Tekst odpowiedzi pochodzi z pola `response` w JSON CLI.
- Dane użycia wracają do `stats`, gdy CLI pozostawia `usage` puste.
- `stats.cached` jest normalizowane do OpenClaw `cacheRead`.
- Jeśli brakuje `stats.input`, OpenClaw wyprowadza tokeny wejściowe z
  `stats.input_tokens - stats.cached`.

## Możliwości

| Możliwość              | Obsługiwane       |
| ---------------------- | ----------------- |
| Uzupełnianie czatu     | Tak               |
| Generowanie obrazów    | Tak               |
| Rozumienie obrazów     | Tak               |
| Transkrypcja audio     | Tak               |
| Rozumienie wideo       | Tak               |
| Wyszukiwanie w sieci (Grounding) | Tak      |
| Thinking/reasoning     | Tak (Gemini 3.1+) |

## Bezpośrednie ponowne użycie pamięci podręcznej Gemini

Dla bezpośrednich uruchomień Gemini API (`api: "google-generative-ai"`), OpenClaw teraz
przekazuje skonfigurowany uchwyt `cachedContent` do żądań Gemini.

- Skonfiguruj parametry per model lub globalnie za pomocą
  `cachedContent` albo starszego `cached_content`
- Jeśli obecne są oba, `cachedContent` ma pierwszeństwo
- Przykładowa wartość: `cachedContents/prebuilt-context`
- Dane użycia trafień pamięci podręcznej Gemini są normalizowane do OpenClaw `cacheRead` z
  upstream `cachedContentTokenCount`

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

Dostawca `google-gemini-cli` tylko z OAuth to osobna powierzchnia
wnioskowania tekstowego. Generowanie obrazów, rozumienie mediów oraz Gemini Grounding pozostają przy
identyfikatorze dostawcy `google`.

## Uwaga dotycząca środowiska

Jeśli Gateway działa jako demon (launchd/systemd), upewnij się, że `GEMINI_API_KEY`
jest dostępny dla tego procesu (na przykład w `~/.openclaw/.env` lub przez
`env.shellEnv`).
