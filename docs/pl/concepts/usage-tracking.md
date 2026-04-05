---
read_when:
    - Konfigurujesz powierzchnie użycia/limitów quota providerów
    - Musisz wyjaśnić działanie śledzenia użycia lub wymagania dotyczące uwierzytelniania
summary: Powierzchnie śledzenia użycia i wymagania dotyczące danych uwierzytelniających
title: Śledzenie użycia
x-i18n:
    generated_at: "2026-04-05T13:51:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 62164492c61a8d602e3b73879c13ce3e14ce35964b7f2ffd389a4e6a7ec7e9c0
    source_path: concepts/usage-tracking.md
    workflow: 15
---

# Śledzenie użycia

## Co to jest

- Pobiera użycie/limity quota providerów bezpośrednio z ich endpointów użycia.
- Brak szacowanych kosztów; tylko okna raportowane przez providera.
- Czytelne dla człowieka dane wyjściowe stanu są normalizowane do `X% left`, nawet gdy
  nadrzędne API raportuje zużyty limit quota, pozostały limit quota lub tylko surowe liczniki.
- `/status` i `session_status` na poziomie sesji mogą wracać do najnowszego
  wpisu użycia w transkrypcji, gdy bieżący snapshot sesji jest ubogi. Taki
  fallback uzupełnia brakujące liczniki tokenów/cache, może odzyskać etykietę
  aktywnego modelu runtime i preferuje większą łączną wartość zorientowaną na prompt, gdy metadane sesji
  są nieobecne lub mniejsze. Istniejące niezerowe wartości live nadal mają pierwszeństwo.

## Gdzie to się pojawia

- `/status` na czatach: bogata w emoji karta stanu z tokenami sesji + szacowanym kosztem (tylko klucz API). Użycie providera jest pokazywane dla **aktualnego providera modelu**, gdy jest dostępne, jako znormalizowane okno `X% left`.
- `/usage off|tokens|full` na czatach: stopka użycia dla każdej odpowiedzi (OAuth pokazuje tylko tokeny).
- `/usage cost` na czatach: lokalne podsumowanie kosztów agregowane z logów sesji OpenClaw.
- CLI: `openclaw status --usage` wypisuje pełne zestawienie dla każdego providera.
- CLI: `openclaw channels list` wypisuje ten sam snapshot użycia obok konfiguracji providera (użyj `--no-usage`, aby pominąć).
- pasek menu macOS: sekcja „Usage” w obszarze Context (tylko jeśli dostępna).

## Providery + dane uwierzytelniające

- **Anthropic (Claude)**: tokeny OAuth w profilach uwierzytelniania.
- **GitHub Copilot**: tokeny OAuth w profilach uwierzytelniania.
- **Gemini CLI**: tokeny OAuth w profilach uwierzytelniania.
  - JSON użycia wraca do `stats`; `stats.cached` jest normalizowane do
    `cacheRead`.
- **OpenAI Codex**: tokeny OAuth w profilach uwierzytelniania (używane jest `accountId`, gdy jest obecne).
- **MiniMax**: klucz API lub profil uwierzytelniania MiniMax OAuth. OpenClaw traktuje
  `minimax`, `minimax-cn` i `minimax-portal` jako tę samą powierzchnię limitu quota MiniMax,
  preferuje zapisany MiniMax OAuth, gdy jest dostępny, a w przeciwnym razie wraca
  do `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY` lub `MINIMAX_API_KEY`.
  Surowe pola MiniMax `usage_percent` / `usagePercent` oznaczają **pozostały**
  limit quota, więc OpenClaw odwraca je przed wyświetleniem; pola oparte na licznikach mają pierwszeństwo,
  gdy są obecne.
  - Etykiety okien planu coding pochodzą z pól godzin/minut providera, gdy są obecne, a następnie wracają do zakresu `start_time` / `end_time`.
  - Jeśli endpoint planu coding zwraca `model_remains`, OpenClaw preferuje wpis modelu czatu, wyprowadza etykietę okna ze znaczników czasu, gdy jawne pola `window_hours` / `window_minutes` są nieobecne, i uwzględnia nazwę modelu w etykiecie planu.
- **Xiaomi MiMo**: klucz API przez env/config/magazyn uwierzytelniania (`XIAOMI_API_KEY`).
- **z.ai**: klucz API przez env/config/magazyn uwierzytelniania.

Użycie jest ukrywane, gdy nie można rozwiązać żadnego użytecznego uwierzytelniania użycia providera. Providery
mogą dostarczać logikę uwierzytelniania użycia specyficzną dla wtyczki; w przeciwnym razie OpenClaw wraca do
dopasowywania danych uwierzytelniających OAuth/klucza API z profili uwierzytelniania, zmiennych środowiskowych
lub konfiguracji.
