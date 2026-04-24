---
read_when:
    - Chcesz szybkiej diagnozy kondycji kanału + ostatnich odbiorców sesji
    - Chcesz dającego się wkleić statusu „all” do debugowania
summary: Dokumentacja referencyjna CLI dla `openclaw status` (diagnostyka, sondowania, migawki użycia)
title: Status
x-i18n:
    generated_at: "2026-04-24T09:04:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 369de48e283766ec23ef87f79df39893957101954c4a351e46ef24104d78ec1d
    source_path: cli/status.md
    workflow: 15
---

# `openclaw status`

Diagnostyka kanałów + sesji.

```bash
openclaw status
openclaw status --all
openclaw status --deep
openclaw status --usage
```

Uwagi:

- `--deep` uruchamia sondowania na żywo (WhatsApp Web + Telegram + Discord + Slack + Signal).
- `--usage` wypisuje znormalizowane okna użycia dostawców jako `X% left`.
- Dane wyjściowe stanu sesji rozdzielają teraz `Runtime:` od `Runner:`. `Runtime` to ścieżka wykonania i stan sandboxa (`direct`, `docker/*`), a `Runner` informuje, czy sesja używa osadzonego Pi, dostawcy opartego na CLI, czy backendu harness ACP, takiego jak `codex (acp/acpx)`.
- Surowe pola `usage_percent` / `usagePercent` MiniMax oznaczają pozostały limit, więc OpenClaw odwraca je przed wyświetleniem; pola oparte na liczbie mają pierwszeństwo, jeśli są obecne. Odpowiedzi `model_remains` preferują wpis modelu czatu, wyprowadzają etykietę okna z sygnatur czasowych, gdy to potrzebne, i zawierają nazwę modelu w etykiecie planu.
- Gdy bieżąca migawka sesji jest uboga, `/status` może uzupełnić liczniki tokenów i cache z najnowszego logu użycia transkryptu. Istniejące niezerowe wartości na żywo nadal mają pierwszeństwo nad wartościami z awaryjnego transkryptu.
- Awaryjny transkrypt może też odzyskać etykietę aktywnego modelu runtime, gdy brakuje jej w wpisie sesji na żywo. Jeśli ten model transkryptu różni się od modelu wybranego, status rozwiązuje okno kontekstu względem odzyskanego modelu runtime zamiast modelu wybranego.
- Dla rozliczania rozmiaru promptu awaryjny transkrypt preferuje większą sumę zorientowaną na prompt, gdy metadane sesji są nieobecne lub mniejsze, dzięki czemu sesje niestandardowych dostawców nie zapadają się do wyświetlania `0` tokenów.
- Dane wyjściowe zawierają magazyny sesji per agent, gdy skonfigurowano wielu agentów.
- Przegląd zawiera status instalacji/runtime usług hosta Gateway + Node, gdy są dostępne.
- Przegląd zawiera kanał aktualizacji + git SHA (dla checkoutów źródłowych).
- Informacje o aktualizacji są widoczne w Przeglądzie; jeśli aktualizacja jest dostępna, status wypisuje wskazówkę, aby uruchomić `openclaw update` (zobacz [Aktualizowanie](/pl/install/updating)).
- Powierzchnie statusu tylko do odczytu (`status`, `status --json`, `status --all`) rozwiązują obsługiwane SecretRef dla docelowych ścieżek konfiguracji, gdy to możliwe.
- Jeśli obsługiwany kanał SecretRef jest skonfigurowany, ale niedostępny w bieżącej ścieżce polecenia, status pozostaje tylko do odczytu i raportuje wyjście z obniżoną funkcjonalnością zamiast się wywracać. Dane wyjściowe dla człowieka pokazują ostrzeżenia, takie jak „configured token unavailable in this command path”, a dane wyjściowe JSON zawierają `secretDiagnostics`.
- Gdy rozwiązanie SecretRef lokalne dla polecenia się powiedzie, status preferuje rozwiązaną migawkę i usuwa przejściowe znaczniki kanału „secret unavailable” z końcowych danych wyjściowych.
- `status --all` zawiera wiersz przeglądu Secrets oraz sekcję diagnozy, która podsumowuje diagnostykę sekretów (obciętą dla czytelności) bez zatrzymywania generowania raportu.

## Powiązane

- [Dokumentacja referencyjna CLI](/pl/cli)
- [Doctor](/pl/gateway/doctor)
