---
read_when:
    - Praca nad mechanizmami kontroli telemetrii / prywatności
    - Pytania dotyczące tego, jakie dane są gromadzone
summary: Telemetria instalacji zbierana za pośrednictwem `clawhub sync` + możliwość rezygnacji.
x-i18n:
    generated_at: "2026-05-13T02:51:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1f492fa0176af1cb37fbf694f6c21ed63a769cf9eb8ee4b29f435d5ff0b0e683
    source_path: clawhub/telemetry.md
    workflow: 16
---

# Telemetria

ClawHub używa **minimalnej telemetrii** do obliczania **liczby instalacji** (tego, co faktycznie jest używane) oraz do lepszego sortowania/filtrowania.
Opiera się to na poleceniu CLI `clawhub sync`.

## Kiedy telemetria jest zbierana

Telemetria jest wysyłana tylko wtedy, gdy:

- Jesteś **zalogowany** w CLI (i tak wymagamy uwierzytelnienia dla przepływów synchronizacji/publikowania).
- Uruchamiasz `clawhub sync`.
- Telemetria **nie jest wyłączona** (zobacz „Jak wyłączyć” poniżej).

Jeśli nie jesteś zalogowany, nic nie jest raportowane.

## Co zbieramy

Przy każdym `clawhub sync` CLI raportuje **pełny zrzut** tego, co znalazł, pogrupowany według korzenia skanowania („folder/korzeń”).

Dla każdego korzenia przechowujemy:

- `rootId`: **hash SHA-256** kanonicznej ścieżki korzenia (serwer nigdy nie widzi surowej ścieżki).
- `label`: czytelna dla człowieka etykieta wyprowadzona z dwóch ostatnich segmentów ścieżki (ścieżki domowe są pokazywane z `~`).
- `firstSeenAt`, `lastSeenAt`, opcjonalnie `expiredAt`.

Dla każdej znalezionej umiejętności pod danym korzeniem przechowujemy:

- `skillId` (rozwiązane według sluga; śledzone są tylko umiejętności istniejące w rejestrze).
- `firstSeenAt`, `lastSeenAt`.
- `lastVersion` (najlepszym możliwym sposobem; obecnie wersja dopasowana do rejestru, jeśli jest znana).
- opcjonalne `removedAt`, gdy wcześniej zgłoszona instalacja znika z korzenia.

### Czego _nie_ zbieramy

- Brak surowych bezwzględnych ścieżek folderów (tylko zahashowane `rootId` + krótka etykieta wyświetlania).
- Brak zawartości plików.
- Brak logów poszczególnych uruchomień, promptów ani innych danych wyjściowych CLI.
- Brak śledzenia umiejętności, które nie zostały przesłane do rejestru (nieznane slugi są ignorowane).

## Liczby instalacji

Utrzymujemy dwa liczniki dla każdej umiejętności:

- `installsCurrent`: unikalni użytkownicy, którzy obecnie mają umiejętność zainstalowaną w co najmniej jednym aktywnym korzeniu.
- `installsAllTime`: unikalni użytkownicy, którzy kiedykolwiek zgłosili zainstalowanie umiejętności.

### Wiele korzeni

Jeśli synchronizujesz z wielu folderów, traktujemy każdy korzeń skanowania niezależnie. Umiejętność jest „obecnie zainstalowana”, jeśli istnieje w **dowolnym** aktywnym korzeniu.

### Wykrywanie odinstalowania

Ponieważ `sync` raportuje pełny zestaw dla każdego korzenia:

- Jeśli umiejętność znika z korzenia przy następnej synchronizacji, oznaczamy ją jako usuniętą dla tego korzenia.
- Jeśli umiejętność zostanie usunięta ze wszystkich Twoich korzeni, przestaje być wliczana do `installsCurrent`.
- `installsAllTime` nigdy się nie zmniejsza, chyba że usuniesz telemetrię (zobacz poniżej).

### Nieaktualność (120 dni)

Korzenie, które nie raportują telemetrii przez **120 dni**, są oznaczane jako nieaktualne, a ich instalacje przestają być wliczane do `installsCurrent`.
Jest to oceniane leniwie (przy następnym raporcie telemetrii), aby uniknąć zadań w tle.

## Przejrzystość + kontrola użytkownika

ClawHub udostępnia prywatną kartę „Zainstalowane” w Twoim własnym profilu:

- Pokazuje dokładne korzenie + zainstalowane umiejętności, które przechowujemy.
- Zawiera widok **eksportu JSON**.
- Zawiera akcję **Usuń telemetrię**, aby usunąć całą przechowywaną telemetrię dla Twojego konta.

Wszyscy inni widzą tylko **zagregowane liczniki instalacji**; nikt inny nie może zobaczyć Twoich korzeni/folderów.

Usunięcie konta usuwa również Twoje dane telemetryczne.

## Jak wyłączyć telemetrię

Ustaw zmienną środowiskową:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Po jej ustawieniu CLI nie będzie wysyłać telemetrii podczas `clawhub sync`.
