---
read_when:
    - Praca nad telemetrią / mechanizmami kontroli prywatności
    - Pytania dotyczące tego, jakie dane są zbierane
summary: Telemetria instalacji zbierana za pomocą `clawhub sync` + możliwość rezygnacji.
x-i18n:
    generated_at: "2026-05-12T23:30:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1f492fa0176af1cb37fbf694f6c21ed63a769cf9eb8ee4b29f435d5ff0b0e683
    source_path: clawhub/telemetry.md
    workflow: 16
---

# Telemetria

ClawHub używa **minimalnej telemetrii**, aby obliczać **liczby instalacji** (to, co faktycznie jest używane) oraz zapewniać lepsze sortowanie/filtrowanie.
Opiera się to na poleceniu CLI `clawhub sync`.

## Kiedy telemetria jest zbierana

Telemetria jest wysyłana tylko wtedy, gdy:

- Jesteś **zalogowany** w CLI (już wymagamy uwierzytelnienia dla przepływów synchronizacji/publikacji).
- Uruchamiasz `clawhub sync`.
- Telemetria **nie jest wyłączona** (zobacz „Jak wyłączyć” poniżej).

Jeśli nie jesteś zalogowany, nic nie jest zgłaszane.

## Co zbieramy

Przy każdym `clawhub sync` CLI zgłasza **pełną migawkę** tego, co znalazło, pogrupowaną według katalogu głównego skanowania („folder/root”).

Dla każdego katalogu głównego przechowujemy:

- `rootId`: **hash SHA-256** kanonicznej ścieżki katalogu głównego (serwer nigdy nie widzi surowej ścieżki).
- `label`: czytelną dla człowieka etykietę wyprowadzoną z dwóch ostatnich segmentów ścieżki (ścieżki domowe są wyświetlane z `~`).
- `firstSeenAt`, `lastSeenAt`, opcjonalnie `expiredAt`.

Dla każdego Skills znalezionego pod katalogiem głównym przechowujemy:

- `skillId` (rozwiązane według sluga; śledzone są tylko Skills istniejące w rejestrze).
- `firstSeenAt`, `lastSeenAt`.
- `lastVersion` (na zasadzie najlepszych starań; obecnie wersja dopasowana do rejestru, jeśli jest znana).
- opcjonalnie `removedAt`, gdy wcześniej zgłoszona instalacja znika z katalogu głównego.

### Czego _nie_ zbieramy

- Brak surowych bezwzględnych ścieżek folderów (tylko zahashowany `rootId` + krótka etykieta wyświetlana).
- Brak zawartości plików.
- Brak dzienników poszczególnych uruchomień, promptów ani innych danych wyjściowych CLI.
- Brak śledzenia Skills, które nie zostały przesłane do rejestru (nieznane slugi są ignorowane).

## Liczby instalacji

Utrzymujemy dwa liczniki dla każdego Skills:

- `installsCurrent`: unikalni użytkownicy, którzy obecnie mają Skills zainstalowany w co najmniej jednym aktywnym katalogu głównym.
- `installsAllTime`: unikalni użytkownicy, którzy kiedykolwiek zgłosili zainstalowanie Skills.

### Wiele katalogów głównych

Jeśli synchronizujesz z wielu folderów, traktujemy każdy katalog główny skanowania niezależnie. Skills jest „obecnie zainstalowany”, jeśli istnieje w **dowolnym** aktywnym katalogu głównym.

### Wykrywanie odinstalowania

Ponieważ `sync` zgłasza pełny zestaw dla każdego katalogu głównego:

- Jeśli Skills zniknie z katalogu głównego przy następnej synchronizacji, oznaczamy go jako usunięty dla tego katalogu głównego.
- Jeśli Skills zostanie usunięty ze wszystkich Twoich katalogów głównych, nie jest już wliczany do `installsCurrent`.
- `installsAllTime` nigdy się nie zmniejsza, chyba że usuniesz telemetrię (zobacz poniżej).

### Nieaktualność (120 dni)

Katalogi główne, które nie zgłaszają telemetrii przez **120 dni**, są oznaczane jako nieaktualne, a ich instalacje przestają być wliczane do `installsCurrent`.
Jest to oceniane leniwie (przy następnym zgłoszeniu telemetrii), aby uniknąć zadań w tle.

## Przejrzystość + kontrola użytkownika

ClawHub udostępnia prywatną kartę „Zainstalowane” w Twoim własnym profilu:

- Pokazuje dokładne katalogi główne + zainstalowane Skills, które przechowujemy.
- Zawiera widok **eksportu JSON**.
- Zawiera akcję **Usuń telemetrię**, aby usunąć całą przechowywaną telemetrię dla Twojego konta.

Wszyscy inni widzą tylko **zagregowane liczniki instalacji**; nikt inny nie może zobaczyć Twoich katalogów głównych/folderów.

Usunięcie konta powoduje również usunięcie Twoich danych telemetrycznych.

## Jak wyłączyć telemetrię

Ustaw zmienną środowiskową:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Po jej ustawieniu CLI nie będzie wysyłać telemetrii podczas `clawhub sync`.
