---
read_when:
    - Podłączasz interfejsy użycia/limitów dostawcy
    - Musisz wyjaśnić zachowanie śledzenia użycia lub wymagania dotyczące uwierzytelniania
summary: Obszary śledzenia użycia oraz wymagania dotyczące poświadczeń
title: Śledzenie użycia
x-i18n:
    generated_at: "2026-05-06T09:11:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 14210813bf3c078a1323b1560a1a3da586f55880e05a9b310e1b6a2d5490f956
    source_path: concepts/usage-tracking.md
    workflow: 16
---

## Czym to jest

- Pobiera użycie/limity dostawców bezpośrednio z ich endpointów użycia.
- Bez szacowanych kosztów; tylko okna zgłaszane przez dostawcę.
- Czytelne dla człowieka dane stanu są normalizowane do `X% left`, nawet gdy
  upstreamowe API zgłasza wykorzystany limit, pozostały limit albo tylko surowe liczby.
- Poziom sesji `/status` i `session_status` mogą wrócić do najnowszego wpisu
  użycia z transkrypcji, gdy bieżąca migawka sesji jest niepełna. Ten fallback
  uzupełnia brakujące liczniki tokenów/cache, może odzyskać etykietę aktywnego
  modelu runtime i preferuje większą sumę zorientowaną na prompt, gdy metadane
  sesji są brakujące albo mniejsze. Istniejące niezerowe wartości bieżące nadal wygrywają.

## Gdzie się pojawia

- `/status` w czatach: karta stanu z emoji, tokenami sesji i szacowanym kosztem (tylko klucz API). Użycie dostawcy jest pokazywane dla **bieżącego dostawcy modelu**, gdy jest dostępne jako znormalizowane okno `X% left`.
- `/usage off|tokens|full` w czatach: stopka użycia dla każdej odpowiedzi (OAuth pokazuje tylko tokeny).
- `/usage cost` w czatach: lokalne podsumowanie kosztów zagregowane z logów sesji OpenClaw.
- CLI: `openclaw status --usage` wypisuje pełny podział według dostawców.
- CLI: `openclaw channels list` wypisuje tę samą migawkę użycia obok konfiguracji dostawcy (użyj `--no-usage`, aby pominąć).
- Pasek menu macOS: sekcja „Użycie” pod „Kontekst” (tylko jeśli jest dostępna).

## Dostawcy i dane uwierzytelniające

- **Anthropic (Claude)**: tokeny OAuth w profilach uwierzytelniania.
- **GitHub Copilot**: tokeny OAuth w profilach uwierzytelniania.
- **Gemini CLI**: tokeny OAuth w profilach uwierzytelniania.
  - Użycie JSON wraca do `stats`; `stats.cached` jest normalizowane do
    `cacheRead`.
- **OpenAI Codex**: tokeny OAuth w profilach uwierzytelniania (accountId używane, gdy jest obecne).
- **MiniMax**: klucz API albo profil uwierzytelniania OAuth MiniMax. OpenClaw traktuje
  `minimax`, `minimax-cn` i `minimax-portal` jako tę samą powierzchnię limitu MiniMax,
  preferuje zapisane OAuth MiniMax, gdy jest obecne, a w przeciwnym razie wraca
  do `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY` albo `MINIMAX_API_KEY`.
  Sondowanie użycia wyprowadza host Coding Plan z `models.providers.minimax-portal.baseUrl`
  albo `models.providers.minimax.baseUrl`, gdy jest skonfigurowany, a w przeciwnym razie używa
  hosta MiniMax CN.
  Surowe pola MiniMax `usage_percent` / `usagePercent` oznaczają **pozostały**
  limit, więc OpenClaw odwraca je przed wyświetleniem; pola oparte na liczbach wygrywają, gdy
  są obecne.
  - Etykiety okien coding-plan pochodzą z pól godzin/minut dostawcy, gdy
    są obecne, a następnie wracają do zakresu `start_time` / `end_time`.
  - Jeśli endpoint coding-plan zwraca `model_remains`, OpenClaw preferuje wpis
    modelu czatu, wyprowadza etykietę okna ze znaczników czasu, gdy jawne pola
    `window_hours` / `window_minutes` są nieobecne, i uwzględnia nazwę modelu
    w etykiecie planu.
- **Xiaomi MiMo**: klucz API przez env/config/magazyn uwierzytelniania (`XIAOMI_API_KEY`).
- **z.ai**: klucz API przez env/config/magazyn uwierzytelniania.

Użycie jest ukryte, gdy nie można ustalić żadnego używalnego uwierzytelniania użycia dostawcy. Dostawcy
mogą dostarczać specyficzną dla Plugin logikę uwierzytelniania użycia; w przeciwnym razie OpenClaw wraca do
pasujących danych uwierzytelniających OAuth/klucza API z profili uwierzytelniania, zmiennych środowiskowych
lub konfiguracji.

## Powiązane

- [Użycie tokenów i koszty](/pl/reference/token-use)
- [Użycie API i koszty](/pl/reference/api-usage-costs)
- [Buforowanie promptów](/pl/reference/prompt-caching)
