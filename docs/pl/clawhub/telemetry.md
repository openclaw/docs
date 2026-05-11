---
read_when:
    - Praca nad mechanizmami kontroli telemetrii / prywatności
    - Pytania dotyczące tego, jakie dane są zbierane
summary: Telemetria instalacji zbierana za pośrednictwem `clawhub sync` + możliwość rezygnacji.
x-i18n:
    generated_at: "2026-05-11T22:20:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1f492fa0176af1cb37fbf694f6c21ed63a769cf9eb8ee4b29f435d5ff0b0e683
    source_path: clawhub/telemetry.md
    workflow: 16
---

# Telemetria

ClawHub używa **minimalnej telemetrii** do obliczania **liczby instalacji** (tego, co faktycznie jest używane) oraz do obsługi lepszego sortowania/filtrowania.
Opiera się to na poleceniu CLI `clawhub sync`.

## Kiedy telemetria jest zbierana

Telemetria jest wysyłana tylko wtedy, gdy:

- Masz **aktywną sesję logowania** w CLI (już wymagamy uwierzytelnienia dla przepływów sync/publish).
- Uruchamiasz `clawhub sync`.
- Telemetria **nie jest wyłączona** (zobacz „Jak wyłączyć” poniżej).

Jeśli nie masz aktywnej sesji logowania, nic nie jest raportowane.

## Co zbieramy

Przy każdym `clawhub sync` CLI raportuje **pełną migawkę** tego, co znalazło, pogrupowaną według katalogu głównego skanowania („folder/root”).

Dla każdego katalogu głównego przechowujemy:

- `rootId`: **hash SHA-256** kanonicznej ścieżki katalogu głównego (serwer nigdy nie widzi surowej ścieżki).
- `label`: czytelną dla człowieka etykietę pochodzącą z ostatnich dwóch segmentów ścieżki (ścieżki domowe są pokazywane z `~`).
- `firstSeenAt`, `lastSeenAt`, opcjonalnie `expiredAt`.

Dla każdej umiejętności znalezionej pod katalogiem głównym przechowujemy:

- `skillId` (rozpoznawany według sluga; śledzone są tylko umiejętności istniejące w rejestrze).
- `firstSeenAt`, `lastSeenAt`.
- `lastVersion` (najlepsza możliwa informacja; obecnie wersja dopasowana w rejestrze, jeśli jest znana).
- opcjonalnie `removedAt`, gdy wcześniej zgłoszona instalacja zniknie z katalogu głównego.

### Czego _nie_ zbieramy

- Żadnych surowych bezwzględnych ścieżek folderów (tylko zahashowany `rootId` + krótka etykieta wyświetlana).
- Żadnej zawartości plików.
- Żadnych logów z poszczególnych uruchomień, promptów ani innych wyników CLI.
- Żadnego śledzenia umiejętności, które nie zostały przesłane do rejestru (nieznane slugi są ignorowane).

## Liczba instalacji

Utrzymujemy dwa liczniki dla każdej umiejętności:

- `installsCurrent`: unikalni użytkownicy, którzy obecnie mają zainstalowaną umiejętność w co najmniej jednym aktywnym katalogu głównym.
- `installsAllTime`: unikalni użytkownicy, którzy kiedykolwiek zgłosili zainstalowaną umiejętność.

### Wiele katalogów głównych

Jeśli synchronizujesz z wielu folderów, traktujemy każdy katalog główny skanowania niezależnie. Umiejętność jest „obecnie zainstalowana”, jeśli istnieje w **dowolnym** aktywnym katalogu głównym.

### Wykrywanie odinstalowania

Ponieważ `sync` raportuje pełny zestaw dla katalogu głównego:

- Jeśli umiejętność zniknie z katalogu głównego przy następnej synchronizacji, oznaczamy ją jako usuniętą dla tego katalogu głównego.
- Jeśli umiejętność zostanie usunięta ze wszystkich Twoich katalogów głównych, przestaje być liczona w `installsCurrent`.
- `installsAllTime` nigdy się nie zmniejsza, chyba że usuniesz telemetrię (zobacz poniżej).

### Przeterminowanie (120 dni)

Katalogi główne, które nie raportują telemetrii przez **120 dni**, są oznaczane jako przestarzałe, a ich instalacje przestają być liczone w `installsCurrent`.
Jest to oceniane leniwie (przy następnym raporcie telemetrii), aby uniknąć zadań w tle.

## Przejrzystość + kontrola użytkownika

ClawHub udostępnia prywatną kartę „Zainstalowane” na Twoim profilu:

- Pokazuje dokładne katalogi główne + zainstalowane umiejętności, które przechowujemy.
- Zawiera widok **eksportu JSON**.
- Zawiera akcję **Usuń telemetrię**, która usuwa całą przechowywaną telemetrię z Twojego konta.

Wszyscy inni widzą tylko **zagregowane liczniki instalacji**; nikt inny nie może zobaczyć Twoich katalogów głównych/folderów.

Usunięcie konta usuwa również Twoje dane telemetryczne.

## Jak wyłączyć telemetrię

Ustaw zmienną środowiskową:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Po jej ustawieniu CLI nie będzie wysyłać telemetrii podczas `clawhub sync`.
