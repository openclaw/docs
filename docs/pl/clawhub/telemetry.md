---
read_when:
    - Praca nad kontrolkami telemetrii / prywatności
    - Pytania dotyczące tego, jakie dane są zbierane
summary: Telemetria instalacji zbierana za pośrednictwem `clawhub sync` + możliwość rezygnacji.
x-i18n:
    generated_at: "2026-05-10T19:27:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1f492fa0176af1cb37fbf694f6c21ed63a769cf9eb8ee4b29f435d5ff0b0e683
    source_path: clawhub/telemetry.md
    workflow: 16
---

# Telemetria

ClawHub używa **minimalnej telemetrii** do obliczania **liczby instalacji** (tego, co jest faktycznie używane) oraz do lepszego sortowania i filtrowania.
Opiera się to na poleceniu CLI `clawhub sync`.

## Kiedy telemetria jest zbierana

Telemetria jest wysyłana tylko wtedy, gdy:

- Jesteś **zalogowany** w CLI (już wymagamy uwierzytelniania dla przepływów synchronizacji i publikowania).
- Uruchomisz `clawhub sync`.
- Telemetria **nie jest wyłączona** (zobacz „Jak wyłączyć” poniżej).

Jeśli nie jesteś zalogowany, nic nie jest raportowane.

## Co zbieramy

Przy każdym `clawhub sync` CLI raportuje **pełną migawkę** tego, co znalazło, pogrupowaną według korzenia skanowania („folder/korzeń”).

Dla każdego korzenia przechowujemy:

- `rootId`: **hash SHA-256** kanonicznej ścieżki korzenia (serwer nigdy nie widzi surowej ścieżki).
- `label`: czytelną dla człowieka etykietę pochodzącą z dwóch ostatnich segmentów ścieżki (ścieżki domowe są pokazywane z `~`).
- `firstSeenAt`, `lastSeenAt`, opcjonalnie `expiredAt`.

Dla każdego Skills znalezionego pod korzeniem przechowujemy:

- `skillId` (ustalane na podstawie sluga; śledzone są tylko Skills istniejące w rejestrze).
- `firstSeenAt`, `lastSeenAt`.
- `lastVersion` (najlepsza dostępna próba; obecnie wersja dopasowana w rejestrze, jeśli jest znana).
- opcjonalnie `removedAt`, gdy wcześniej zgłoszona instalacja znika z korzenia.

### Czego _nie_ zbieramy

- Żadnych surowych bezwzględnych ścieżek folderów (tylko zahashowany `rootId` + krótka etykieta wyświetlania).
- Żadnej zawartości plików.
- Żadnych logów z poszczególnych uruchomień, promptów ani innych danych wyjściowych CLI.
- Żadnego śledzenia Skills, które nie zostały przesłane do rejestru (nieznane slugi są ignorowane).

## Liczby instalacji

Utrzymujemy dwa liczniki dla każdego Skills:

- `installsCurrent`: unikalni użytkownicy, którzy obecnie mają dany Skills zainstalowany w co najmniej jednym aktywnym korzeniu.
- `installsAllTime`: unikalni użytkownicy, którzy kiedykolwiek zgłosili zainstalowany dany Skills.

### Wiele korzeni

Jeśli synchronizujesz z wielu folderów, traktujemy każdy korzeń skanowania niezależnie. Skills jest „obecnie zainstalowany”, jeśli istnieje w **dowolnym** aktywnym korzeniu.

### Wykrywanie odinstalowania

Ponieważ `sync` raportuje pełny zestaw dla każdego korzenia:

- Jeśli Skills znika z korzenia przy następnej synchronizacji, oznaczamy go jako usunięty dla tego korzenia.
- Jeśli Skills zostanie usunięty ze wszystkich Twoich korzeni, nie jest już wliczany do `installsCurrent`.
- `installsAllTime` nigdy się nie zmniejsza, chyba że usuniesz telemetrię (zobacz poniżej).

### Nieaktualność (120 dni)

Korzenie, które nie zgłaszają telemetrii przez **120 dni**, są oznaczane jako nieaktualne, a ich instalacje przestają być wliczane do `installsCurrent`.
Jest to oceniane leniwie (przy następnym raporcie telemetrii), aby uniknąć zadań w tle.

## Przejrzystość + kontrola użytkownika

ClawHub udostępnia prywatną kartę „Zainstalowane” w Twoim własnym profilu:

- Pokazuje dokładne korzenie + zainstalowane Skills, które przechowujemy.
- Zawiera widok **eksportu JSON**.
- Zawiera akcję **Usuń telemetrię**, która usuwa całą przechowywaną telemetrię dla Twojego konta.

Wszyscy inni widzą tylko **zagregowane liczniki instalacji**; nikt inny nie może zobaczyć Twoich korzeni/folderów.

Usunięcie konta usuwa także Twoje dane telemetryczne.

## Jak wyłączyć telemetrię

Ustaw zmienną środowiskową:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Po jej ustawieniu CLI nie będzie wysyłać telemetrii podczas `clawhub sync`.
