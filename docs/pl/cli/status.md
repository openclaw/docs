---
read_when:
    - Chcesz szybkiej diagnozy kondycji kanału + ostatnich odbiorców sesji
    - Potrzebujesz możliwego do wklejenia statusu „all” do debugowania
summary: Dokumentacja CLI dla `openclaw status` (diagnostyka, sondy, migawki użycia)
title: Stan
x-i18n:
    generated_at: "2026-05-05T06:16:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5025ed99d351a43adc60b6896349366b225fd7ecb8ab422dba376f2d157f0033
    source_path: cli/status.md
    workflow: 16
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

- `--deep` uruchamia sondy na żywo (WhatsApp Web + Telegram + Discord + Slack + Signal).
- Zwykłe `openclaw status` pozostaje na szybkiej ścieżce tylko do odczytu i oznacza pamięć jako `not checked` zamiast niedostępnej, gdy pomija inspekcję pamięci. Ciężki audyt bezpieczeństwa, zgodność Plugin i sondy wektorów pamięci są pozostawione poleceniom `openclaw status --all`, `openclaw status --deep`, `openclaw security audit` i `openclaw memory status --deep`.
- `status --json --all` raportuje szczegóły pamięci z aktywnego środowiska uruchomieniowego Plugin pamięci wybranego przez `plugins.slots.memory`. Niestandardowe Pluginy pamięci mogą pozostawić wbudowane `agents.defaults.memorySearch.enabled` wyłączone i nadal raportować własny stan plików, fragmentów, wektorów oraz FTS.
- `--usage` wypisuje znormalizowane okna użycia dostawcy jako `X% left`.
- Dane wyjściowe statusu sesji rozdzielają `Execution:` od `Runtime:`. `Execution` to ścieżka piaskownicy (`direct`, `docker/*`), a `Runtime` informuje, czy sesja używa `OpenClaw Pi Default`, `OpenAI Codex`, zaplecza CLI lub zaplecza ACP, takiego jak `codex (acp/acpx)`. Zobacz [środowiska uruchomieniowe agentów](/pl/concepts/agent-runtimes), aby poznać rozróżnienie między dostawcą, modelem i środowiskiem uruchomieniowym.
- Surowe pola MiniMax `usage_percent` / `usagePercent` oznaczają pozostały limit, więc OpenClaw odwraca je przed wyświetleniem; pola oparte na licznikach mają pierwszeństwo, gdy są obecne. Odpowiedzi `model_remains` preferują wpis modelu czatu, w razie potrzeby wyprowadzają etykietę okna ze znaczników czasu i dołączają nazwę modelu do etykiety planu.
- Gdy bieżąca migawka sesji jest niepełna, `/status` może uzupełnić liczniki tokenów i pamięci podręcznej z najnowszego dziennika użycia transkrypcji. Istniejące niezerowe wartości na żywo nadal mają pierwszeństwo przed wartościami awaryjnymi z transkrypcji.
- `/status` obejmuje zwięzły czas działania procesu Gateway i czas działania systemu hosta.
- Awaryjne dane z transkrypcji mogą także odzyskać etykietę aktywnego modelu środowiska uruchomieniowego, gdy brakuje jej we wpisie sesji na żywo. Jeśli ten model z transkrypcji różni się od wybranego modelu, status rozwiązuje okno kontekstu względem odzyskanego modelu środowiska uruchomieniowego zamiast względem wybranego.
- W rozliczaniu rozmiaru promptu awaryjne dane z transkrypcji preferują większą łączną wartość zorientowaną na prompt, gdy brakuje metadanych sesji lub są one mniejsze, dzięki czemu sesje niestandardowych dostawców nie zwijają się do wyświetlania `0` tokenów.
- Dane wyjściowe obejmują magazyny sesji poszczególnych agentów, gdy skonfigurowano wielu agentów.
- Przegląd obejmuje stan instalacji i działania usługi hosta Gateway + node, gdy jest dostępny.
- Przegląd obejmuje kanał aktualizacji + SHA git (dla checkoutów źródłowych).
- Informacje o aktualizacji pojawiają się w przeglądzie; jeśli aktualizacja jest dostępna, status wypisuje wskazówkę, aby uruchomić `openclaw update` (zobacz [Aktualizowanie](/pl/install/updating)).
- Powierzchnie statusu tylko do odczytu (`status`, `status --json`, `status --all`) rozwiązują obsługiwane SecretRefs dla docelowych ścieżek konfiguracji, gdy to możliwe.
- Jeśli skonfigurowano obsługiwany SecretRef kanału, ale jest on niedostępny w bieżącej ścieżce polecenia, status pozostaje tylko do odczytu i raportuje zdegradowane dane wyjściowe zamiast ulec awarii. Dane wyjściowe dla człowieka pokazują ostrzeżenia takie jak „configured token unavailable in this command path”, a dane wyjściowe JSON zawierają `secretDiagnostics`.
- Gdy lokalne dla polecenia rozwiązanie SecretRef się powiedzie, status preferuje rozwiązaną migawkę i usuwa przejściowe znaczniki „secret unavailable” kanałów z końcowych danych wyjściowych.
- `status --all` obejmuje wiersz przeglądu sekretów i sekcję diagnozy, która podsumowuje diagnostykę sekretów (skróconą dla czytelności) bez zatrzymywania generowania raportu.

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Doctor](/pl/gateway/doctor)
