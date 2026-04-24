---
read_when:
    - Konfigurujesz powierzchnie użycia/limitów dostawcy.
    - Musisz wyjaśnić zachowanie śledzenia użycia albo wymagania uwierzytelniania.
summary: Powierzchnie śledzenia użycia i wymagania dotyczące poświadczeń
title: Śledzenie użycia
x-i18n:
    generated_at: "2026-04-24T09:08:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 21c2ae0c32d9f28b301abed22d6edcb423d46831cb1d78f4c2908df0ecf82854
    source_path: concepts/usage-tracking.md
    workflow: 15
---

## Czym to jest

- Pobiera użycie/limity dostawcy bezpośrednio z ich endpointów usage.
- Bez szacowanych kosztów; tylko okna raportowane przez dostawcę.
- Czytelne dla człowieka dane wyjściowe statusu są normalizowane do `X% left`, nawet gdy
  nadrzędne API raportuje zużyty limit, pozostały limit albo tylko surowe liczniki.
- `/status` i `session_status` na poziomie sesji mogą używać fallbacku do
  najnowszego wpisu użycia z transkryptu, gdy aktywny snapshot sesji jest ubogi. Ten
  fallback uzupełnia brakujące liczniki tokenów/cache, może odzyskać etykietę
  aktywnego modelu runtime i preferuje większą sumę zorientowaną na prompt, gdy brakuje
  metadanych sesji albo gdy są mniejsze. Istniejące niezerowe wartości live nadal mają pierwszeństwo.

## Gdzie to się pojawia

- `/status` w czatach: bogata w emoji karta statusu z tokenami sesji + szacowanym kosztem (tylko klucz API). Użycie dostawcy jest pokazywane dla **bieżącego dostawcy modelu**, gdy jest dostępne, jako znormalizowane okno `X% left`.
- `/usage off|tokens|full` w czatach: stopka użycia per odpowiedź (OAuth pokazuje tylko tokeny).
- `/usage cost` w czatach: lokalne podsumowanie kosztów agregowane z logów sesji OpenClaw.
- CLI: `openclaw status --usage` wypisuje pełny podział per dostawca.
- CLI: `openclaw channels list` wypisuje ten sam snapshot użycia obok konfiguracji dostawcy (użyj `--no-usage`, aby pominąć).
- Pasek menu macOS: sekcja „Usage” pod Context (tylko jeśli dostępna).

## Dostawcy + poświadczenia

- **Anthropic (Claude)**: tokeny OAuth w profilach auth.
- **GitHub Copilot**: tokeny OAuth w profilach auth.
- **Gemini CLI**: tokeny OAuth w profilach auth.
  - JSON usage ma fallback do `stats`; `stats.cached` jest normalizowane do
    `cacheRead`.
- **OpenAI Codex**: tokeny OAuth w profilach auth (`accountId` jest używane, gdy występuje).
- **MiniMax**: klucz API albo profil auth MiniMax OAuth. OpenClaw traktuje
  `minimax`, `minimax-cn` i `minimax-portal` jako tę samą powierzchnię limitów
  MiniMax, preferuje zapisany MiniMax OAuth, gdy jest dostępny, a w przeciwnym razie używa fallbacku do
  `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY` albo `MINIMAX_API_KEY`.
  Surowe pola `usage_percent` / `usagePercent` MiniMax oznaczają **pozostały**
  limit, więc OpenClaw odwraca je przed wyświetleniem; pola oparte na licznikach mają pierwszeństwo, gdy są dostępne.
  - Etykiety okna coding-plan pochodzą z pól godzin/minut dostawcy, gdy są dostępne, a następnie używają fallbacku do zakresu `start_time` / `end_time`.
  - Jeśli endpoint coding-plan zwraca `model_remains`, OpenClaw preferuje wpis modelu czatu, wyprowadza etykietę okna ze znaczników czasu, gdy jawne pola `window_hours` / `window_minutes` są nieobecne, i uwzględnia nazwę modelu w etykiecie planu.
- **Xiaomi MiMo**: klucz API przez env/config/auth store (`XIAOMI_API_KEY`).
- **z.ai**: klucz API przez env/config/auth store.

Użycie jest ukrywane, gdy nie da się rozwiązać użytecznego uwierzytelniania usage dostawcy. Dostawcy
mogą dostarczać logikę uwierzytelniania usage specyficzną dla Pluginu; w przeciwnym razie OpenClaw używa fallbacku do
dopasowywania poświadczeń OAuth/klucza API z profili auth, zmiennych środowiskowych
albo konfiguracji.

## Powiązane

- [Użycie tokenów i koszty](/pl/reference/token-use)
- [Użycie API i koszty](/pl/reference/api-usage-costs)
- [Cache promptów](/pl/reference/prompt-caching)
