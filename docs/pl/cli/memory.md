---
read_when:
    - Chcesz zindeksować lub przeszukać pamięć semantyczną
    - Rozwiązujesz problemy z dostępnością pamięci lub indeksowaniem
    - Chcesz przenieść przywołaną pamięć krótkotrwałą do `MEMORY.md`
summary: Dokumentacja referencyjna CLI dla `openclaw memory` (status/index/search/promote/promote-explain/rem-harness)
title: Pamięć
x-i18n:
    generated_at: "2026-05-06T17:53:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7137f8a9529095204699de5fee7a0baf5d5a377792dc93b4059145d0eefab737
    source_path: cli/memory.md
    workflow: 16
---

# `openclaw memory`

Zarządzaj indeksowaniem i wyszukiwaniem pamięci semantycznej.
Dostarczane przez aktywny Plugin pamięci (domyślnie: `memory-core`; ustaw `plugins.slots.memory = "none"`, aby wyłączyć).

Powiązane:

- Koncepcja pamięci: [Pamięć](/pl/concepts/memory)
- Wiki pamięci: [Wiki pamięci](/pl/plugins/memory-wiki)
- Wiki CLI: [wiki](/pl/cli/wiki)
- Plugins: [Plugins](/pl/tools/plugin)

## Przykłady

```bash
openclaw memory status
openclaw memory status --deep
openclaw memory status --fix
openclaw memory index --force
openclaw memory search "meeting notes"
openclaw memory search --query "deployment" --max-results 20
openclaw memory promote --limit 10 --min-score 0.75
openclaw memory promote --apply
openclaw memory promote --json --min-recall-count 0 --min-unique-queries 0
openclaw memory promote-explain "router vlan"
openclaw memory promote-explain "router vlan" --json
openclaw memory rem-harness
openclaw memory rem-harness --json
openclaw memory status --json
openclaw memory status --deep --index
openclaw memory status --deep --index --verbose
openclaw memory status --agent main
openclaw memory index --agent main --verbose
```

## Opcje

`memory status` i `memory index`:

- `--agent <id>`: ogranicza zakres do jednego agenta. Bez tej opcji te polecenia działają dla każdego skonfigurowanego agenta; jeśli nie skonfigurowano listy agentów, wracają do agenta domyślnego.
- `--verbose`: emituje szczegółowe dzienniki podczas sondowania i indeksowania.

`memory status`:

- `--deep`: sprawdza gotowość lokalnego magazynu wektorowego, gotowość dostawcy osadzeń oraz gotowość semantycznego wyszukiwania wektorowego. Zwykłe `memory status` pozostaje szybkie i nie uruchamia pracy z żywymi osadzeniami ani wykrywania dostawców; nieznany stan magazynu wektorowego lub wektora semantycznego oznacza, że nie został sprawdzony w tym poleceniu. Leksykalny QMD `searchMode: "search"` pomija sondowanie wektorów semantycznych i utrzymanie osadzeń nawet z `--deep`.
- `--index`: uruchamia ponowne indeksowanie, jeśli magazyn jest brudny (implikuje `--deep`).
- `--fix`: naprawia nieaktualne blokady przywołań i normalizuje metadane promocji.
- `--json`: wypisuje wynik JSON.

Jeśli `memory status` pokazuje `Dreaming status: blocked`, zarządzany Cron Dreaming jest włączony, ale Heartbeat, który go napędza, nie uruchamia się dla agenta domyślnego. Zobacz [Dreaming nigdy się nie uruchamia](/pl/concepts/dreaming#dreaming-never-runs-status-shows-blocked), aby poznać dwie częste przyczyny.

`memory index`:

- `--force`: wymusza pełne ponowne indeksowanie.

`memory search`:

- Dane wejściowe zapytania: przekaż pozycyjny argument `[query]` albo `--query <text>`.
- Jeśli podano oba, wygrywa `--query`.
- Jeśli nie podano żadnego, polecenie kończy się błędem.
- `--agent <id>`: ogranicza zakres do jednego agenta (domyślnie: agent domyślny).
- `--max-results <n>`: ogranicza liczbę zwracanych wyników.
- `--min-score <n>`: odfiltrowuje dopasowania o niskim wyniku.
- `--json`: wypisuje wyniki JSON.

`memory promote`:

Podglądaj i stosuj promocje pamięci krótkotrwałej.

```bash
openclaw memory promote [--apply] [--limit <n>] [--include-promoted]
```

- `--apply` -- zapisuje promocje do `MEMORY.md` (domyślnie: tylko podgląd).
- `--limit <n>` -- ogranicza liczbę wyświetlanych kandydatów.
- `--include-promoted` -- uwzględnia wpisy już wypromowane w poprzednich cyklach.

Pełne opcje:

- Szereguje kandydatów krótkotrwałych z `memory/YYYY-MM-DD.md` przy użyciu ważonych sygnałów promocji (`frequency`, `relevance`, `query diversity`, `recency`, `consolidation`, `conceptual richness`).
- Używa sygnałów krótkotrwałych zarówno z przywołań pamięci, jak i dziennych przebiegów ingestii, oraz sygnałów wzmocnienia z faz light/REM.
- Gdy Dreaming jest włączony, `memory-core` automatycznie zarządza jednym zadaniem Cron, które uruchamia pełny przebieg (`light -> REM -> deep`) w tle (ręczne `openclaw cron add` nie jest wymagane).
- `--agent <id>`: ogranicza zakres do jednego agenta (domyślnie: agent domyślny).
- `--limit <n>`: maksymalna liczba kandydatów do zwrócenia/zastosowania.
- `--min-score <n>`: minimalny ważony wynik promocji.
- `--min-recall-count <n>`: minimalna liczba przywołań wymagana dla kandydata.
- `--min-unique-queries <n>`: minimalna liczba odrębnych zapytań wymagana dla kandydata.
- `--apply`: dołącza wybranych kandydatów do `MEMORY.md` i oznacza ich jako wypromowanych.
- `--include-promoted`: uwzględnia w wyniku już wypromowanych kandydatów.
- `--json`: wypisuje wynik JSON.

`memory promote-explain`:

Wyjaśnia konkretnego kandydata do promocji i rozbicie jego wyniku.

```bash
openclaw memory promote-explain <selector> [--agent <id>] [--include-promoted] [--json]
```

- `<selector>`: klucz kandydata, fragment ścieżki lub fragment wycinka do wyszukania.
- `--agent <id>`: ogranicza zakres do jednego agenta (domyślnie: agent domyślny).
- `--include-promoted`: uwzględnia już wypromowanych kandydatów.
- `--json`: wypisuje wynik JSON.

`memory rem-harness`:

Podglądaj refleksje REM, prawdy kandydujące i wynik głębokiej promocji bez zapisywania czegokolwiek.

```bash
openclaw memory rem-harness [--agent <id>] [--include-promoted] [--json]
```

- `--agent <id>`: ogranicza zakres do jednego agenta (domyślnie: agent domyślny).
- `--include-promoted`: uwzględnia już wypromowanych głębokich kandydatów.
- `--json`: wypisuje wynik JSON.

## Dreaming

Dreaming to działający w tle system konsolidacji pamięci z trzema współpracującymi
fazami: **light** (sortowanie/etapowanie materiału krótkotrwałego), **deep** (promowanie trwałych
faktów do `MEMORY.md`) oraz **REM** (refleksja i wydobywanie tematów).

- Włącz za pomocą `plugins.entries.memory-core.config.dreaming.enabled: true`.
- Przełączaj z czatu za pomocą `/dreaming on|off` (lub sprawdzaj za pomocą `/dreaming status`).
- Dreaming działa według jednego zarządzanego harmonogramu przebiegu (`dreaming.frequency`) i wykonuje fazy w kolejności: light, REM, deep.
- Tylko faza deep zapisuje trwałą pamięć do `MEMORY.md`.
- Czytelny dla człowieka wynik faz i wpisy dziennika są zapisywane do `DREAMS.md` (lub istniejącego `dreams.md`), z opcjonalnymi raportami dla poszczególnych faz w `memory/dreaming/<phase>/YYYY-MM-DD.md`.
- Ranking używa ważonych sygnałów: częstotliwości przywołań, trafności pobierania, różnorodności zapytań, czasowej świeżości, konsolidacji między dniami i wyprowadzonego bogactwa pojęciowego.
- Promocja ponownie odczytuje bieżącą dzienną notatkę przed zapisaniem do `MEMORY.md`, więc edytowane lub usunięte krótkotrwałe wycinki nie są promowane z nieaktualnych migawek magazynu przywołań.
- Zaplanowane i ręczne uruchomienia `memory promote` współdzielą te same domyślne ustawienia fazy deep, chyba że przekażesz nadpisania progów w CLI.
- Automatyczne uruchomienia rozchodzą się na skonfigurowane obszary robocze pamięci.

Domyślny harmonogram:

- **Rytm przebiegu**: `dreaming.frequency = 0 3 * * *`
- **Progi deep**: `minScore=0.8`, `minRecallCount=3`, `minUniqueQueries=3`, `recencyHalfLifeDays=14`, `maxAgeDays=30`

Przykład:

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

Uwagi:

- `memory index --verbose` wypisuje szczegóły dla poszczególnych faz (dostawca, model, źródła, aktywność partii).
- `memory status` obejmuje wszelkie dodatkowe ścieżki skonfigurowane przez `memorySearch.extraPaths`.
- Jeśli efektywnie aktywne pola kluczy API zdalnej pamięci są skonfigurowane jako SecretRefs, polecenie rozwiązuje te wartości z aktywnej migawki Gateway. Jeśli Gateway jest niedostępny, polecenie szybko kończy się błędem.
- Uwaga o rozbieżności wersji Gateway: ta ścieżka polecenia wymaga Gateway obsługującego `secrets.resolve`; starsze Gateway zwracają błąd nieznanej metody.
- Dostrój rytm zaplanowanych przebiegów za pomocą `dreaming.frequency`. Polityka promocji deep jest poza tym wewnętrzna; używaj flag CLI w `memory promote`, gdy potrzebujesz jednorazowych ręcznych nadpisań.
- `memory rem-harness --path <file-or-dir> --grounded` podgląda ugruntowane sekcje `What Happened`, `Reflections` i `Possible Lasting Updates` z historycznych dziennych notatek bez zapisywania czegokolwiek.
- `memory rem-backfill --path <file-or-dir>` zapisuje odwracalne ugruntowane wpisy dziennika do `DREAMS.md` w celu przeglądu w UI.
- `memory rem-backfill --path <file-or-dir> --stage-short-term` dodatkowo zasila żywy magazyn promocji krótkotrwałych ugruntowanymi trwałymi kandydatami, aby normalna faza deep mogła ich uszeregować.
- `memory rem-backfill --rollback` usuwa wcześniej zapisane ugruntowane wpisy dziennika, a `memory rem-backfill --rollback-short-term` usuwa wcześniej etapowanych ugruntowanych kandydatów krótkotrwałych.
- Zobacz [Dreaming](/pl/concepts/dreaming), aby poznać pełne opisy faz i dokumentację konfiguracji.

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Przegląd pamięci](/pl/concepts/memory)
