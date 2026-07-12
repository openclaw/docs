---
read_when:
    - Chcesz szybko zdiagnozować stan kanałów i ostatnich odbiorców sesji
    - Potrzebujesz możliwego do wklejenia „pełnego” statusu do debugowania
summary: Dokumentacja CLI dla `openclaw status` (diagnostyka, sondy, migawki użycia)
title: openclaw status
x-i18n:
    generated_at: "2026-07-12T15:01:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 37b8a3297adbef855b468466ec1001d0721eef066899eb20d94c18933a8f257e
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

| Flaga                   | Opis                                                                                                                           |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `--all`                 | Pełna diagnostyka (tylko do odczytu, możliwa do wklejenia). Obejmuje audyt bezpieczeństwa, zgodność pluginów i testy wektorów pamięci. |
| `--deep`                | Uruchamia testy na żywo (WhatsApp Web + Telegram + Discord + Slack + Signal). Włącza również audyt bezpieczeństwa.              |
| `--usage`               | Wyświetla znormalizowane okna wykorzystania dostawcy w postaci `X% pozostało`.                                                  |
| `--json`                | Dane wyjściowe w formacie do odczytu maszynowego.                                                                               |
| `--verbose` / `--debug` | Wyświetla również przed raportem nieprzetworzone rozpoznanie docelowego Gateway.                                                |

Zwykłe polecenie `openclaw status` pozostaje na szybkiej ścieżce tylko do odczytu i oznacza pamięć jako
`nie sprawdzono`, zamiast jako niedostępną, gdy pomija jej kontrolę. Rozbudowany
audyt bezpieczeństwa, testy zgodności pluginów i wektorów pamięci są wykonywane przez
`openclaw status --all`, `openclaw status --deep`, `openclaw security audit`
oraz `openclaw memory status --deep`.

## Rozpoznawanie sesji i modelu

- Dane wyjściowe stanu sesji rozdzielają `Wykonanie:` od `Środowisko uruchomieniowe:`. `Wykonanie`
  określa ścieżkę piaskownicy (`direct`, `docker/*`), natomiast `Środowisko uruchomieniowe` informuje,
  czy sesja używa `OpenClaw Default`, `OpenAI Codex`, zaplecza CLI
  czy zaplecza ACP, takiego jak `codex (acp/acpx)`. Rozróżnienie między
  dostawcą, modelem i środowiskiem uruchomieniowym opisano w sekcji
  [Środowiska uruchomieniowe agenta](/pl/concepts/agent-runtimes).
- Gdy bieżąca migawka sesji zawiera niewiele danych, `/status` może uzupełnić liczniki tokenów
  i pamięci podręcznej na podstawie najnowszego dziennika użycia transkrypcji. Istniejące
  niezerowe wartości na żywo nadal mają pierwszeństwo przed wartościami zastępczymi z transkrypcji.
- Dane zastępcze z transkrypcji mogą również odtworzyć etykietę aktywnego modelu środowiska uruchomieniowego, gdy
  brakuje jej we wpisie sesji na żywo. Jeśli model z transkrypcji różni się
  od wybranego modelu, stan rozpoznaje okno kontekstu na podstawie
  odtworzonego modelu środowiska uruchomieniowego, a nie wybranego.
- Przy obliczaniu rozmiaru monitu dane zastępcze z transkrypcji preferują większą,
  ukierunkowaną na monit wartość całkowitą, gdy brakuje metadanych sesji lub są one mniejsze, dzięki czemu
  sesje niestandardowych dostawców nie są wyświetlane jako `0` tokenów.
- Gdy sesja jest przypięta do modelu innego niż skonfigurowany
  model główny, stan wyświetla obie wartości, przyczynę (`nadpisanie sesji`) oraz
  podpowiedź `/model default`. Skonfigurowany model główny dotyczy nowych lub
  nieprzypiętych sesji; istniejące przypięte sesje zachowują wybrany model,
  dopóki przypięcie nie zostanie usunięte.
- Dane wyjściowe obejmują magazyny sesji poszczególnych agentów, gdy skonfigurowano
  wielu agentów.

## Wykorzystanie i limit

- `--usage` wyświetla znormalizowane okna wykorzystania dostawcy w postaci `X% pozostało`.
- Nieprzetworzone pola MiniMax `usage_percent` / `usagePercent` oznaczają pozostały limit,
  dlatego OpenClaw odwraca je przed wyświetleniem; pola oparte na liczbie mają pierwszeństwo, gdy
  są dostępne. Odpowiedzi `model_remains` preferują wpis modelu czatu, w razie potrzeby wyznaczają
  etykietę okna na podstawie znaczników czasu i uwzględniają nazwę modelu
  w etykiecie planu.
- Niepowodzenia odświeżania cen modeli są wyświetlane jako opcjonalne ostrzeżenia dotyczące cen.
  Nie oznaczają one nieprawidłowego działania Gateway ani kanałów.

## Przegląd i stan aktualizacji

- Przegląd obejmuje stan instalacji i działania usługi hosta Gateway oraz Node, gdy
  jest dostępny, a także zwięzły czas działania procesu Gateway i czas działania systemu hosta.
- Przegląd obejmuje kanał aktualizacji i skrót SHA Git (w przypadku kopii roboczych kodu źródłowego).
- Informacje o aktualizacji są widoczne w Przeglądzie; jeśli aktualizacja jest dostępna, stan
  wyświetla podpowiedź, aby uruchomić `openclaw update` (zobacz [Aktualizowanie](/pl/install/updating)).

## Sekrety

- Powierzchnie stanu tylko do odczytu (`status`, `status --json`, `status --all`)
  w miarę możliwości rozpoznają obsługiwane SecretRef dla wskazanych ścieżek konfiguracji.
- Jeśli obsługiwany SecretRef kanału jest skonfigurowany, ale niedostępny w
  bieżącej ścieżce polecenia, stan pozostaje tylko do odczytu i zgłasza ograniczone dane wyjściowe,
  zamiast przerywać działanie. Dane wyjściowe dla użytkownika zawierają ostrzeżenia, takie jak „skonfigurowany token
  jest niedostępny w tej ścieżce polecenia”, a dane wyjściowe JSON zawierają
  `secretDiagnostics`.
- Gdy lokalne dla polecenia rozpoznanie SecretRef powiedzie się, stan preferuje
  rozpoznaną migawkę i usuwa przejściowe znaczniki kanału „sekret niedostępny”
  z końcowych danych wyjściowych.
- `status --all` zawiera wiersz przeglądu sekretów i sekcję diagnostyczną,
  która podsumowuje diagnostykę sekretów (skróconą dla czytelności) bez
  przerywania generowania raportu.

## Pamięć

`status --json --all` raportuje szczegóły pamięci z aktywnego środowiska uruchomieniowego pluginu pamięci
wybranego przez `plugins.slots.memory`. Niestandardowe pluginy pamięci mogą pozostawić
wbudowane ustawienie `agents.defaults.memorySearch.enabled` wyłączone i nadal raportować
własne pliki, fragmenty, wektory oraz stan FTS.

## Powiązane materiały

- [Dokumentacja CLI](/pl/cli)
- [Doctor](/pl/gateway/doctor)
