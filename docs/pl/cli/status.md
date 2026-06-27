---
read_when:
    - Potrzebujesz szybkiej diagnozy kondycji kanału + ostatnich odbiorców sesji
    - Chcesz wklejalny status „all” do debugowania
summary: Dokumentacja referencyjna CLI dla `openclaw status` (diagnostyka, sondy, migawki użycia)
title: openclaw status
x-i18n:
    generated_at: "2026-06-27T17:23:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: aeb9e99b2aa9eb12fe97c8ee018ac6a5227cad990d151c3579d16009c5b9258a
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

- `--deep` uruchamia sondy live (WhatsApp Web + Telegram + Discord + Slack + Signal).
- Zwykłe `openclaw status` pozostaje na szybkiej ścieżce tylko do odczytu i oznacza pamięć jako `not checked` zamiast niedostępnej, gdy pomija inspekcję pamięci. Ciężki audyt bezpieczeństwa, zgodność Plugin i sondy wektorów pamięci są pozostawione poleceniom `openclaw status --all`, `openclaw status --deep`, `openclaw security audit` i `openclaw memory status --deep`.
- `status --json --all` raportuje szczegóły pamięci z aktywnego runtime Plugin pamięci wybranego przez `plugins.slots.memory`. Niestandardowe Plugin pamięci mogą pozostawić wbudowane `agents.defaults.memorySearch.enabled` wyłączone i nadal raportować własny stan plików, fragmentów, wektorów oraz FTS.
- `--usage` wypisuje znormalizowane okna użycia dostawcy jako `X% left`.
- Dane wyjściowe statusu sesji oddzielają `Execution:` od `Runtime:`. `Execution` to ścieżka sandboxa (`direct`, `docker/*`), natomiast `Runtime` informuje, czy sesja używa `OpenClaw Default`, `OpenAI Codex`, backendu CLI, czy backendu ACP, takiego jak `codex (acp/acpx)`. Zobacz [Runtime agentów](/pl/concepts/agent-runtimes), aby poznać rozróżnienie między dostawcą, modelem i runtime.
- Surowe pola MiniMax `usage_percent` / `usagePercent` oznaczają pozostały limit, więc OpenClaw odwraca je przed wyświetleniem; pola oparte na liczbie mają pierwszeństwo, gdy są obecne. Odpowiedzi `model_remains` preferują wpis modelu czatu, wyprowadzają etykietę okna ze znaczników czasu, gdy jest to potrzebne, i uwzględniają nazwę modelu w etykiecie planu.
- Gdy bieżąca migawka sesji jest niepełna, `/status` może uzupełnić liczniki tokenów i cache z najnowszego dziennika użycia transkrypcji. Istniejące niezerowe wartości live nadal mają pierwszeństwo przed wartościami awaryjnymi z transkrypcji.
- `/status` zawiera zwięzły czas działania procesu Gateway oraz czas działania systemu hosta.
- Awaryjne dane z transkrypcji mogą także odzyskać etykietę modelu aktywnego runtime, gdy brakuje jej we wpisie sesji live. Jeśli ten model z transkrypcji różni się od wybranego modelu, status ustala okno kontekstu względem odzyskanego modelu runtime zamiast wybranego.
- Gdy sesja jest przypięta do modelu innego niż skonfigurowany model główny, status wypisuje obie wartości, powód (`session override`) oraz jasną wskazówkę (`/model default`). Skonfigurowany model główny ma zastosowanie do nowych lub nieprzypiętych sesji; istniejące przypięte sesje zachowują swój wybór sesji do czasu wyczyszczenia.
- Przy rozliczaniu rozmiaru promptu awaryjne dane z transkrypcji preferują większą sumę zorientowaną na prompt, gdy metadanych sesji brakuje lub są mniejsze, dzięki czemu sesje niestandardowych dostawców nie sprowadzają wyświetlania tokenów do `0`.
- Dane wyjściowe zawierają magazyny sesji dla poszczególnych agentów, gdy skonfigurowano wielu agentów.
- Przegląd zawiera status instalacji i działania usługi hosta Gateway + node, gdy jest dostępny.
- Przegląd zawiera kanał aktualizacji + SHA git (dla checkoutów źródłowych).
- Informacje o aktualizacji pojawiają się w Przeglądzie; jeśli aktualizacja jest dostępna, status wypisuje wskazówkę, aby uruchomić `openclaw update` (zobacz [Aktualizowanie](/pl/install/updating)).
- Niepowodzenia odświeżania cennika modeli są pokazywane jako opcjonalne ostrzeżenia dotyczące cennika. Nie oznaczają one, że Gateway lub kanały są niesprawne.
- Powierzchnie statusu tylko do odczytu (`status`, `status --json`, `status --all`) rozwiązują obsługiwane SecretRefs dla docelowych ścieżek konfiguracji, gdy jest to możliwe.
- Jeśli obsługiwany SecretRef kanału jest skonfigurowany, ale niedostępny w bieżącej ścieżce polecenia, status pozostaje tylko do odczytu i raportuje obniżoną jakość danych wyjściowych zamiast ulegać awarii. Dane wyjściowe dla człowieka pokazują ostrzeżenia takie jak „configured token unavailable in this command path”, a dane wyjściowe JSON zawierają `secretDiagnostics`.
- Gdy lokalne dla polecenia rozwiązanie SecretRef powiedzie się, status preferuje rozwiązaną migawkę i usuwa przejściowe znaczniki kanałów „secret unavailable” z końcowych danych wyjściowych.
- `status --all` zawiera wiersz przeglądu Secrets oraz sekcję diagnozy, która podsumowuje diagnostykę sekretów (skróconą dla czytelności) bez zatrzymywania generowania raportu.

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Doctor](/pl/gateway/doctor)
