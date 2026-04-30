---
read_when:
    - Chcesz szybkiej diagnozy stanu kanału + ostatnich odbiorców sesji
    - Potrzebujesz statusu „all” do wklejenia podczas debugowania
summary: Dokumentacja referencyjna CLI dla `openclaw status` (diagnostyka, sondy, migawki użycia)
title: Status
x-i18n:
    generated_at: "2026-04-30T09:45:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: a85613e1830dc24253847e6517d3e155c175bb39ff6b01031ac5cb4291e276fa
    source_path: cli/status.md
    workflow: 16
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

- `--deep` uruchamia sondy na żywo (WhatsApp Web + Telegram + Discord + Slack + Signal).
- Zwykłe `openclaw status` pozostaje na szybkiej ścieżce tylko do odczytu i oznacza pamięć jako `not checked` zamiast niedostępnej, gdy pomija inspekcję pamięci. Ciężki audyt bezpieczeństwa, zgodność Pluginów i sondy wektorów pamięci są pozostawione dla `openclaw status --all`, `openclaw status --deep`, `openclaw security audit` i `openclaw memory status --deep`.
- `status --json --all` raportuje szczegóły pamięci z aktywnego środowiska wykonawczego Pluginu pamięci wybranego przez `plugins.slots.memory`. Niestandardowe Pluginy pamięci mogą pozostawić wbudowane `agents.defaults.memorySearch.enabled` wyłączone i nadal raportować własne pliki, fragmenty, wektor oraz stan FTS.
- `--usage` wypisuje znormalizowane okna użycia dostawcy jako `X% left`.
- Dane wyjściowe statusu sesji oddzielają `Execution:` od `Runtime:`. `Execution` to ścieżka piaskownicy (`direct`, `docker/*`), a `Runtime` informuje, czy sesja używa `OpenClaw Pi Default`, `OpenAI Codex`, backendu CLI, czy backendu ACP, takiego jak `codex (acp/acpx)`. Zobacz [Środowiska wykonawcze agentów](/pl/concepts/agent-runtimes), aby poznać rozróżnienie między dostawcą, modelem i środowiskiem wykonawczym.
- Surowe pola MiniMax `usage_percent` / `usagePercent` oznaczają pozostały limit, więc OpenClaw odwraca je przed wyświetleniem; pola oparte na liczbie mają pierwszeństwo, gdy są obecne. Odpowiedzi `model_remains` preferują wpis modelu czatu, w razie potrzeby wyprowadzają etykietę okna ze znaczników czasu i uwzględniają nazwę modelu w etykiecie planu.
- Gdy bieżąca migawka sesji jest niepełna, `/status` może uzupełnić liczniki tokenów i pamięci podręcznej z najnowszego dziennika użycia transkrypcji. Istniejące niezerowe wartości na żywo nadal mają pierwszeństwo przed wartościami zapasowymi z transkrypcji.
- Zapasowe dane z transkrypcji mogą także odzyskać etykietę aktywnego modelu środowiska wykonawczego, gdy brakuje jej we wpisie sesji na żywo. Jeśli ten model z transkrypcji różni się od wybranego modelu, status rozstrzyga okno kontekstu względem odzyskanego modelu środowiska wykonawczego zamiast wybranego.
- W rozliczaniu rozmiaru promptu zapasowe dane z transkrypcji preferują większą sumę zorientowaną na prompt, gdy metadane sesji są brakujące lub mniejsze, dzięki czemu sesje niestandardowych dostawców nie zapadają się do wyświetlania `0` tokenów.
- Dane wyjściowe obejmują magazyny sesji poszczególnych agentów, gdy skonfigurowano wielu agentów.
- Przegląd obejmuje status instalacji i środowiska wykonawczego Gateway oraz usługi hosta Node, gdy jest dostępny.
- Przegląd obejmuje kanał aktualizacji i SHA git (dla checkoutów źródłowych).
- Informacje o aktualizacji są widoczne w Przeglądzie; jeśli aktualizacja jest dostępna, status wypisuje podpowiedź, aby uruchomić `openclaw update` (zobacz [Aktualizacja](/pl/install/updating)).
- Powierzchnie statusu tylko do odczytu (`status`, `status --json`, `status --all`) rozstrzygają obsługiwane SecretRefs dla docelowych ścieżek konfiguracji, gdy to możliwe.
- Jeśli skonfigurowano obsługiwany SecretRef kanału, ale jest on niedostępny w bieżącej ścieżce polecenia, status pozostaje tylko do odczytu i raportuje zdegradowane dane wyjściowe zamiast awarii. Dane wyjściowe dla człowieka pokazują ostrzeżenia, takie jak „skonfigurowany token niedostępny w tej ścieżce polecenia”, a dane wyjściowe JSON obejmują `secretDiagnostics`.
- Gdy lokalne dla polecenia rozstrzyganie SecretRef powiedzie się, status preferuje rozstrzygniętą migawkę i usuwa przejściowe znaczniki kanałów „sekret niedostępny” z końcowych danych wyjściowych.
- `status --all` obejmuje wiersz przeglądu sekretów oraz sekcję diagnozy, która podsumowuje diagnostykę sekretów (skróconą dla czytelności) bez zatrzymywania generowania raportu.

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Doctor](/pl/gateway/doctor)
