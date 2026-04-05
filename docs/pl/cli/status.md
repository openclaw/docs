---
read_when:
    - Chcesz szybko zdiagnozować kondycję kanałów i ostatnich odbiorców sesji
    - Chcesz uzyskać „pełny” status do wklejenia na potrzeby debugowania
summary: Dokumentacja CLI dla `openclaw status` (diagnostyka, testy, migawki użycia)
title: status
x-i18n:
    generated_at: "2026-04-05T13:49:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: fbe9d94fbe9938cd946ee6f293b5bd3b464b75e1ade2eacdd851788c3bffe94e
    source_path: cli/status.md
    workflow: 15
---

# `openclaw status`

Diagnostyka kanałów i sesji.

```bash
openclaw status
openclaw status --all
openclaw status --deep
openclaw status --usage
```

Uwagi:

- `--deep` uruchamia testy na żywo (WhatsApp Web + Telegram + Discord + Slack + Signal).
- `--usage` wypisuje znormalizowane okna użycia providera jako `X% left`.
- Surowe pola `usage_percent` / `usagePercent` MiniMax oznaczają pozostały limit, więc OpenClaw odwraca je przed wyświetleniem; pola oparte na liczbie mają pierwszeństwo, gdy są obecne. Odpowiedzi `model_remains` preferują wpis modelu czatu, w razie potrzeby wyprowadzają etykietę okna z sygnatur czasowych i uwzględniają nazwę modelu w etykiecie planu.
- Gdy bieżąca migawka sesji jest skąpa, `/status` może uzupełnić liczniki tokenów i pamięci podręcznej z najnowszego logu użycia transkryptu. Istniejące niezerowe wartości na żywo nadal mają pierwszeństwo nad fallbackiem z transkryptu.
- Fallback transkryptu może również odzyskać etykietę aktywnego modelu runtime, gdy brakuje jej w aktywnym wpisie sesji. Jeśli model z transkryptu różni się od wybranego modelu, status rozwiązuje okno kontekstu względem odzyskanego modelu runtime zamiast wybranego.
- Dla rozliczania rozmiaru promptu fallback transkryptu preferuje większą sumę zorientowaną na prompt, gdy metadane sesji są nieobecne lub mniejsze, dzięki czemu sesje niestandardowych providerów nie zapadają się do wyświetlania `0` tokenów.
- Wynik zawiera magazyny sesji per agent, gdy skonfigurowano wielu agentów.
- Przegląd obejmuje status instalacji/uruchomienia usługi hosta Gateway i węzła, gdy jest dostępny.
- Przegląd obejmuje kanał aktualizacji i git SHA (dla checkoutów ze źródeł).
- Informacje o aktualizacji są widoczne w przeglądzie; jeśli aktualizacja jest dostępna, status wypisuje wskazówkę, aby uruchomić `openclaw update` (zobacz [Aktualizowanie](/install/updating)).
- Powierzchnie statusu tylko do odczytu (`status`, `status --json`, `status --all`) rozwiązują obsługiwane SecretRefs dla docelowych ścieżek konfiguracji, gdy to możliwe.
- Jeśli obsługiwany kanałowy SecretRef jest skonfigurowany, ale niedostępny w bieżącej ścieżce polecenia, status pozostaje tylko do odczytu i raportuje pogorszony wynik zamiast kończyć się awarią. Wynik czytelny dla człowieka pokazuje ostrzeżenia, takie jak „configured token unavailable in this command path”, a wynik JSON zawiera `secretDiagnostics`.
- Gdy lokalne dla polecenia rozwiązywanie SecretRef się powiedzie, status preferuje rozwiązaną migawkę i usuwa przejściowe znaczniki kanału „secret unavailable” z końcowego wyniku.
- `status --all` zawiera wiersz przeglądu Secrets i sekcję diagnozy, która podsumowuje diagnostykę sekretów (obciętą dla czytelności), bez zatrzymywania generowania raportu.
