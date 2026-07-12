---
read_when:
    - Chcesz indeksować lub przeszukiwać pamięć semantyczną
    - Debugujesz dostępność pamięci lub indeksowanie
    - Chcesz przenieść przywołaną pamięć krótkotrwałą do `MEMORY.md`
summary: Dokumentacja CLI dla `openclaw memory` (status/index/search/promote/promote-explain/rem-harness/rem-backfill)
title: Pamięć
x-i18n:
    generated_at: "2026-07-12T14:59:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f0002c48044455520f32a5a3e111415a746fbafba2a27a655ded90abdc94623b
    source_path: cli/memory.md
    workflow: 16
---

# `openclaw memory`

Zarządzaj indeksowaniem pamięci semantycznej, wyszukiwaniem i przenoszeniem wpisów do `MEMORY.md`.
Funkcję udostępnia dołączony plugin `memory-core`, dostępny, gdy
`plugins.slots.memory` wskazuje `memory-core` (wartość domyślna). Inne pluginy
pamięci udostępniają własne przestrzenie nazw CLI.

Powiązane: koncepcja [pamięci](/pl/concepts/memory), [Dreaming](/pl/concepts/dreaming),
[dokumentacja konfiguracji pamięci](/pl/reference/memory-config), [wiki pamięci](/pl/plugins/memory-wiki),
[wiki](/pl/cli/wiki), [pluginy](/pl/tools/plugin).

## `memory status`

```bash
openclaw memory status [--agent <id>] [--deep] [--index] [--fix] [--json] [--verbose]
```

Bez `--agent` polecenie jest wykonywane dla każdego agenta z `agents.list`; jeśli lista agentów
nie jest skonfigurowana, używany jest agent domyślny.

| Flaga       | Działanie                                                                                                                                                                                                                                                                                                 |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--deep`    | Sprawdza gotowość magazynu wektorowego, dostawcy osadzeń i wyszukiwania semantycznego (co oznacza dodatkowe wywołania dostawcy). Zwykłe `memory status` pozostaje szybkie i pomija tę kontrolę; nieznany stan funkcji wektorowych/semantycznych oznacza, że nie został sprawdzony. Wyszukiwanie leksykalne QMD z `searchMode: "search"` zawsze pomija semantyczne testy wektorowe, nawet z `--deep`. |
| `--index`   | Ponownie indeksuje, jeśli magazyn jest nieaktualny. Implikuje `--deep`.                                                                                                                                                                                                                                    |
| `--fix`     | Naprawia nieaktualne blokady przywoływania i normalizuje metadane przenoszenia.                                                                                                                                                                                                                            |
| `--json`    | Wyświetla dane JSON.                                                                                                                                                                                                                                                                                       |
| `--verbose` | Wyświetla szczegółowe dzienniki poszczególnych faz.                                                                                                                                                                                                                                                       |

Jeśli wiersz `Dreaming` pozostaje ustawiony na `off` nawet przy
`dreaming.enabled: true` albo zaplanowane przebiegi nigdy nie są wykonywane, zarządzane zadanie
Cron systemu Dreaming zależy od uruchamiania Heartbeat domyślnego agenta, które wyzwala uzgadnianie.
Szczegóły harmonogramu zawiera dokumentacja [Dreaming](/pl/concepts/dreaming).

Stan zawiera również wszystkie dodatkowe ścieżki wyszukiwania z `agents.defaults.memorySearch.extraPaths`.

## `memory index`

```bash
openclaw memory index [--agent <id>] [--force] [--verbose]
```

Zakres agentów jest taki sam jak w przypadku `status`. `--force` wykonuje pełne ponowne indeksowanie
zamiast indeksowania przyrostowego. `--verbose` wyświetla informacje o dostawcy, modelu, źródłach
i dodatkowych ścieżkach każdego agenta przed pokazaniem postępu indeksowania.

## `memory search`

```bash
openclaw memory search [query] [--query <text>] [--agent <id>] [--max-results <n>] [--min-score <n>] [--json]
```

- Zapytanie: pozycyjny argument `[query]` lub `--query <text>`. Jeśli ustawiono oba, pierwszeństwo ma `--query`.
  Jeśli nie ustawiono żadnego, polecenie zwraca błąd.
- `--agent <id>`: domyślnie używa agenta domyślnego (nie pełnej listy agentów).
- `--max-results <n>`: ogranicza liczbę wyników (dodatnia liczba całkowita).
- `--min-score <n>`: odfiltrowuje dopasowania z wynikiem niższym od podanego.

## `memory promote`

Uszereguj krótkoterminowych kandydatów z `memory/YYYY-MM-DD.md` i opcjonalnie dołącz
najlepsze wpisy do `MEMORY.md`.

```bash
openclaw memory promote [--agent <id>] [--limit <n>] [--min-score <n>] \
  [--min-recall-count <n>] [--min-unique-queries <n>] [--apply] [--include-promoted] [--json]
```

| Flaga                      | Wartość domyślna       | Działanie                                                                    |
| -------------------------- | ---------------------- | --------------------------------------------------------------------------- |
| `--limit <n>`              |                        | Maksymalna liczba kandydatów do zwrócenia/zastosowania.                      |
| `--min-score <n>`          | `0.75`                 | Minimalny ważony wynik przenoszenia.                                         |
| `--min-recall-count <n>`   | `3`                    | Minimalna wymagana liczba przywołań.                                         |
| `--min-unique-queries <n>` | `2`                    | Minimalna wymagana liczba odrębnych zapytań.                                 |
| `--apply`                  | tylko podgląd          | Dołącza wybranych kandydatów do `MEMORY.md` i oznacza ich jako przeniesionych. |
| `--include-promoted`       |                        | Uwzględnia kandydatów przeniesionych już w poprzednich cyklach.               |
| `--json`                   |                        | Wyświetla dane JSON.                                                         |

Te wartości domyślne CLI różnią się od progów fazy głębokiej zaplanowanego przebiegu systemu Dreaming
(zobacz [Dreaming](#dreaming) poniżej); aby jednorazowe ręczne uruchomienie odpowiadało
zachowaniu zaplanowanego przebiegu, przekaż jawne flagi.

Sygnały klasyfikacji: częstotliwość przywołań, trafność pobierania, różnorodność zapytań,
aktualność czasowa, konsolidacja między dniami i bogactwo wyprowadzonych koncepcji, pochodzące
zarówno z przywołań pamięci, jak i codziennych przebiegów pozyskiwania danych, a także niewielkie
wzmocnienie z fazy lekkiej/REM za powtarzające się ponowne odwiedziny systemu Dreaming. Przed zapisem
mechanizm przenoszenia ponownie odczytuje bieżącą notatkę dzienną, dzięki czemu uwzględnia zmiany
lub usunięcia krótkoterminowych fragmentów dokonane po klasyfikacji, zamiast przenosić dane
z nieaktualnej migawki.

## `memory promote-explain`

Wyjaśnij składowe wyniku jednego kandydata do przeniesienia.

```bash
openclaw memory promote-explain <selector> [--agent <id>] [--include-promoted] [--json]
```

`<selector>` dopasowuje klucz kandydata (dokładnie lub jako podciąg), ścieżkę albo tekst
fragmentu.

## `memory rem-harness`

Wyświetl podgląd refleksji REM, potencjalnych prawd i wyników przenoszenia w fazie głębokiej
bez zapisywania czegokolwiek.

```bash
openclaw memory rem-harness [--agent <id>] [--path <file-or-dir>] [--grounded] [--include-promoted] [--json]
```

- `--path <file-or-dir>`: inicjalizuje środowisko testowe z historycznych plików dziennych
  `YYYY-MM-DD.md` zamiast z bieżącego obszaru roboczego.
- `--grounded`: dodatkowo generuje oparty na źródłach podgląd sekcji `Co się wydarzyło` /
  `Refleksje` / `Możliwe trwałe aktualizacje` z notatek historycznych.

## `memory rem-backfill`

Zapisz oparte na źródłach historyczne podsumowania REM w `DREAMS.md` do weryfikacji
w interfejsie użytkownika. Operację można cofnąć.

```bash
openclaw memory rem-backfill --path <file-or-dir> [--agent <id>] [--stage-short-term] [--json]
openclaw memory rem-backfill --rollback [--rollback-short-term] [--json]
```

- `--path <file-or-dir>`: wymagane, jeśli nie ustawiono `--rollback`/`--rollback-short-term`.
  Historyczne pliki dzienne pamięci lub katalog, z których mają zostać uzupełnione dane.
- `--stage-short-term`: dodatkowo dodaje oparte na źródłach trwałe wpisy kandydujące do bieżącego
  krótkoterminowego magazynu przenoszenia, aby mogły zostać sklasyfikowane przez zwykłą fazę głęboką.
- `--rollback`: usuwa wcześniej zapisane, oparte na źródłach wpisy dziennika z
  `DREAMS.md`.
- `--rollback-short-term`: usuwa wcześniej przygotowanych, opartych na źródłach kandydatów
  krótkoterminowych.

## Dreaming

Dreaming to działający w tle system konsolidacji pamięci obejmujący trzy współpracujące
fazy, wykonywane kolejno według jednego harmonogramu: **lekką** (sortowanie/przygotowywanie materiału
krótkoterminowego), **REM** (refleksja i wyodrębnianie tematów), **głęboką** (przenoszenie trwałych
faktów do `MEMORY.md`). Tylko faza głęboka zapisuje dane w `MEMORY.md`.

- Włącz za pomocą `plugins.entries.memory-core.config.dreaming.enabled: true`
  (domyślnie `false`); `memory-core` automatycznie zarządza zadaniem Cron przebiegu, więc ręczne
  użycie `openclaw cron add` nie jest wymagane.
- Przełączaj na czacie poleceniem `/dreaming on|off`; sprawdzaj stan poleceniem `/dreaming status`
  (lub `/dreaming`/`/dreaming help`). `on`/`off` wymaga statusu właściciela kanału
  albo uprawnienia `operator.admin` Gateway; stan i pomoc pozostają dostępne dla każdego, kto
  może wywołać polecenie.
- Czytelne dla człowieka dane wyjściowe faz są zapisywane w `DREAMS.md` (lub istniejącym `dreams.md`).
  Domyślnie (`dreaming.storage.mode: "separate"`) każda faza zapisuje również
  osobny raport w `memory/dreaming/<phase>/YYYY-MM-DD.md`; ustaw `mode:
"inline"`, aby zamiast tego dołączać raporty do dziennego pliku pamięci, albo `"both"`,
  aby używać obu sposobów.
- Zaplanowane i ręczne uruchomienia `memory promote` korzystają z tych samych sygnałów
  klasyfikacji fazy głębokiej; różnią się tylko wartości domyślne progów (zobacz tabelę powyżej
  oraz zaplanowane wartości domyślne poniżej).
- Zaplanowane uruchomienia są rozdzielane między obszary robocze pamięci wszystkich skonfigurowanych agentów.

Zaplanowane wartości domyślne (`plugins.entries.memory-core.config.dreaming`):

| Klucz                                  | Wartość domyślna |
| -------------------------------------- | ---------------- |
| `frequency`                            | `0 3 * * *`      |
| `phases.deep.minScore`                 | `0.8`            |
| `phases.deep.minRecallCount`           | `3`              |
| `phases.deep.minUniqueQueries`         | `3`              |
| `phases.deep.recencyHalfLifeDays`      | `14`             |
| `phases.deep.maxAgeDays`               | `30`             |
| `phases.deep.maxPromotedSnippetTokens` | `160`            |

```json
{
  "plugins": {
    "entries": {
      "memory-core": {
        "config": {
          "dreaming": {
            "enabled": true
          }
        }
      }
    }
  }
}
```

Pełna lista kluczy i szczegóły faz: [Dreaming](/pl/concepts/dreaming),
[dokumentacja konfiguracji pamięci](/pl/reference/memory-config#dreaming).

## Zależność od Gateway dla SecretRef

Jeśli pola kluczy zdalnego API Active Memory są skonfigurowane jako SecretRef, polecenia `memory`
rozwiązują je na podstawie aktywnej migawki Gateway; jeśli Gateway jest niedostępny,
polecenie natychmiast kończy się niepowodzeniem. Wymaga to Gateway obsługującego metodę
`secrets.resolve`; starsze wersje Gateway zwracają błąd nieznanej metody.

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Omówienie pamięci](/pl/concepts/memory)
