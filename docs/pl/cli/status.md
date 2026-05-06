---
read_when:
    - Chcesz szybkiej diagnozy kondycji kanału + odbiorców ostatnich sesji
    - Chcesz wkleić status „all” do debugowania
summary: Dokumentacja referencyjna CLI dla `openclaw status` (diagnostyka, sondy, migawki użycia)
title: openclaw status
x-i18n:
    generated_at: "2026-05-06T09:06:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1929db64f09e9494736f09d0d9c1ae1fb72d7308a7124e616e8247ff32aa3185
    source_path: cli/status.md
    workflow: 16
---

Diagnostyka kanałów i sesji.

```bash
openclaw status
openclaw status --all
openclaw status --deep
openclaw status --usage
```

Uwagi:

- `--deep` uruchamia sondy na żywo (WhatsApp Web + Telegram + Discord + Slack + Signal).
- Zwykłe `openclaw status` pozostaje na szybkiej ścieżce tylko do odczytu i oznacza pamięć jako `not checked` zamiast niedostępnej, gdy pomija inspekcję pamięci. Ciężki audyt bezpieczeństwa, zgodność pluginów i sondy wektorów pamięci pozostają dla `openclaw status --all`, `openclaw status --deep`, `openclaw security audit` oraz `openclaw memory status --deep`.
- `status --json --all` raportuje szczegóły pamięci z aktywnego środowiska uruchomieniowego pluginu pamięci wybranego przez `plugins.slots.memory`. Niestandardowe pluginy pamięci mogą pozostawić wyłączone wbudowane `agents.defaults.memorySearch.enabled`, a mimo to raportować własne pliki, fragmenty, wektor i stan FTS.
- `--usage` wypisuje znormalizowane okna użycia dostawcy jako `X% left`.
- Dane wyjściowe statusu sesji rozdzielają `Execution:` od `Runtime:`. `Execution` to ścieżka piaskownicy (`direct`, `docker/*`), a `Runtime` informuje, czy sesja używa `OpenClaw Pi Default`, `OpenAI Codex`, backendu CLI, czy backendu ACP, takiego jak `codex (acp/acpx)`. Zobacz [Środowiska uruchomieniowe agentów](/pl/concepts/agent-runtimes), aby poznać rozróżnienie między dostawcą, modelem i środowiskiem uruchomieniowym.
- Surowe pola `usage_percent` / `usagePercent` MiniMax oznaczają pozostały limit, więc OpenClaw odwraca je przed wyświetleniem; pola oparte na licznikach mają pierwszeństwo, gdy są obecne. Odpowiedzi `model_remains` preferują wpis modelu czatu, w razie potrzeby wyprowadzają etykietę okna ze znaczników czasu i uwzględniają nazwę modelu w etykiecie planu.
- Gdy bieżąca migawka sesji jest skąpa, `/status` może uzupełnić liczniki tokenów i pamięci podręcznej z najnowszego dziennika użycia transkrypcji. Istniejące niezerowe wartości na żywo nadal mają pierwszeństwo przed wartościami zastępczymi z transkrypcji.
- `/status` uwzględnia zwięzły czas działania procesu Gateway oraz czas działania systemu hosta.
- Mechanizm zastępczy z transkrypcji może także odzyskać etykietę aktywnego modelu środowiska uruchomieniowego, gdy brakuje jej we wpisie sesji na żywo. Jeśli ten model z transkrypcji różni się od wybranego modelu, status rozwiązuje okno kontekstu względem odzyskanego modelu środowiska uruchomieniowego zamiast względem wybranego.
- Na potrzeby rozliczania rozmiaru promptu mechanizm zastępczy z transkrypcji preferuje większą sumę ukierunkowaną na prompt, gdy brakuje metadanych sesji lub są one mniejsze, dzięki czemu sesje niestandardowych dostawców nie zapadają się do wyświetlania `0` tokenów.
- Dane wyjściowe obejmują magazyny sesji dla poszczególnych agentów, gdy skonfigurowano wielu agentów.
- Przegląd obejmuje status instalacji i działania usługi hosta Gateway + node, gdy jest dostępny.
- Przegląd obejmuje kanał aktualizacji + SHA git (dla checkoutów źródłowych).
- Informacje o aktualizacji są widoczne w Przeglądzie; jeśli aktualizacja jest dostępna, status wypisuje wskazówkę, aby uruchomić `openclaw update` (zobacz [Aktualizowanie](/pl/install/updating)).
- Powierzchnie statusu tylko do odczytu (`status`, `status --json`, `status --all`) w miarę możliwości rozwiązują obsługiwane SecretRefs dla docelowych ścieżek konfiguracji.
- Jeśli obsługiwany SecretRef kanału jest skonfigurowany, ale niedostępny w bieżącej ścieżce polecenia, status pozostaje tylko do odczytu i raportuje zdegradowane dane wyjściowe zamiast ulegać awarii. Dane wyjściowe dla człowieka pokazują ostrzeżenia, takie jak "configured token unavailable in this command path", a dane wyjściowe JSON zawierają `secretDiagnostics`.
- Gdy rozwiązanie SecretRef lokalnie dla polecenia się powiedzie, status preferuje rozwiązaną migawkę i czyści przejściowe znaczniki kanału "secret unavailable" z końcowych danych wyjściowych.
- `status --all` zawiera wiersz przeglądu sekretów oraz sekcję diagnozy, która podsumowuje diagnostykę sekretów (skróconą dla czytelności) bez zatrzymywania generowania raportu.

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Doctor](/pl/gateway/doctor)
