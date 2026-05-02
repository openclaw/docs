---
read_when:
    - Konfigurujesz powierzchnie użycia/limitów dostawcy
    - Musisz wyjaśnić działanie śledzenia użycia lub wymagania dotyczące uwierzytelniania
summary: Obszary śledzenia użycia i wymagania dotyczące poświadczeń
title: Śledzenie użycia
x-i18n:
    generated_at: "2026-05-02T09:49:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4faa5daff55668a6be73981b730edece51939d99954e784907c99fb101fcaaa7
    source_path: concepts/usage-tracking.md
    workflow: 16
---

## Co to jest

- Pobiera użycie/limity dostawcy bezpośrednio z jego endpointów użycia.
- Bez szacowanych kosztów; tylko okna raportowane przez dostawcę.
- Czytelny dla człowieka wynik statusu jest normalizowany do `X% left`, nawet gdy
  upstream API raportuje wykorzystany limit, pozostały limit albo tylko surowe liczniki.
- `/status` na poziomie sesji i `session_status` mogą awaryjnie użyć najnowszego
  wpisu użycia z transkrypcji, gdy migawka sesji live jest uboga. Ten
  mechanizm awaryjny uzupełnia brakujące liczniki tokenów/pamięci podręcznej,
  może odzyskać etykietę aktywnego modelu runtime i preferuje większą sumę
  zorientowaną na prompt, gdy metadane sesji są brakujące albo mniejsze. Istniejące
  niezerowe wartości live nadal mają pierwszeństwo.

## Gdzie się pojawia

- `/status` w czatach: karta statusu bogata w emoji z tokenami sesji + szacowanym kosztem (tylko klucz API). Użycie dostawcy jest pokazywane dla **bieżącego dostawcy modelu**, gdy jest dostępne, jako znormalizowane okno `X% left`.
- `/usage off|tokens|full` w czatach: stopka użycia dla każdej odpowiedzi (OAuth pokazuje tylko tokeny).
- `/usage cost` w czatach: lokalne podsumowanie kosztów agregowane z logów sesji OpenClaw.
- CLI: `openclaw status --usage` wypisuje pełne zestawienie dla każdego dostawcy.
- CLI: `openclaw channels list` wypisuje tę samą migawkę użycia obok konfiguracji dostawcy (użyj `--no-usage`, aby pominąć).
- Pasek menu macOS: sekcja „Użycie” pod Context (tylko jeśli dostępna).

## Dostawcy + dane uwierzytelniające

- **Anthropic (Claude)**: tokeny OAuth w profilach uwierzytelniania.
- **GitHub Copilot**: tokeny OAuth w profilach uwierzytelniania.
- **Gemini CLI**: tokeny OAuth w profilach uwierzytelniania.
  - Użycie JSON awaryjnie korzysta z `stats`; `stats.cached` jest normalizowane do
    `cacheRead`.
- **OpenAI Codex**: tokeny OAuth w profilach uwierzytelniania (`accountId` używane, gdy jest obecne).
- **MiniMax**: klucz API albo profil uwierzytelniania MiniMax OAuth. OpenClaw traktuje
  `minimax`, `minimax-cn` i `minimax-portal` jako tę samą powierzchnię limitu MiniMax,
  preferuje zapisane MiniMax OAuth, gdy jest obecne, a w przeciwnym razie używa awaryjnie
  `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY` albo `MINIMAX_API_KEY`.
  Odpytywanie użycia wyprowadza host Coding Plan z `models.providers.minimax-portal.baseUrl`
  albo `models.providers.minimax.baseUrl`, gdy skonfigurowano, a w przeciwnym razie używa
  hosta MiniMax CN.
  Surowe pola MiniMax `usage_percent` / `usagePercent` oznaczają **pozostały**
  limit, więc OpenClaw odwraca je przed wyświetleniem; pola oparte na licznikach mają
  pierwszeństwo, gdy są obecne.
  - Etykiety okien planu kodowania pochodzą z pól godzin/minut dostawcy, gdy
    są obecne, a następnie awaryjnie z zakresu `start_time` / `end_time`.
  - Jeśli endpoint planu kodowania zwraca `model_remains`, OpenClaw preferuje
    wpis modelu czatu, wyprowadza etykietę okna ze znaczników czasu, gdy jawne
    pola `window_hours` / `window_minutes` są nieobecne, i dołącza nazwę modelu
    do etykiety planu.
- **Xiaomi MiMo**: klucz API przez env/config/auth store (`XIAOMI_API_KEY`).
- **z.ai**: klucz API przez env/config/auth store.

Użycie jest ukryte, gdy nie można rozwiązać użytecznego uwierzytelniania użycia dostawcy. Dostawcy
mogą dostarczać logikę uwierzytelniania użycia specyficzną dla Plugin; w przeciwnym razie OpenClaw używa awaryjnie
pasujących danych uwierzytelniających OAuth/klucza API z profili uwierzytelniania, zmiennych środowiskowych
albo konfiguracji.

## Powiązane

- [Użycie tokenów i koszty](/pl/reference/token-use)
- [Użycie API i koszty](/pl/reference/api-usage-costs)
- [Buforowanie promptów](/pl/reference/prompt-caching)
