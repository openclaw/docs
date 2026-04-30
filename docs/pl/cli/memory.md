---
read_when:
    - Chcesz indeksować lub przeszukiwać pamięć semantyczną
    - Rozwiązujesz problemy z dostępnością pamięci lub indeksowaniem
    - Chcesz przenieść przywołaną pamięć krótkoterminową do `MEMORY.md`
summary: Dokumentacja referencyjna CLI dla `openclaw memory` (status/index/search/promote/promote-explain/rem-harness)
title: Pamięć
x-i18n:
    generated_at: "2026-04-30T09:44:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 53301e82d4ebe72b161b3a58078e7b75b9e499bc55cbceec5032c7e410619bd4
    source_path: cli/memory.md
    workflow: 16
---

# `openclaw memory`

Zarządzaj indeksowaniem i wyszukiwaniem pamięci semantycznej.
Dostarczane przez Plugin aktywnej pamięci (domyślnie: `memory-core`; ustaw `plugins.slots.memory = "none"`, aby wyłączyć).

Powiązane:

- Koncepcja pamięci: [Pamięć](/pl/concepts/memory)
- Wiki pamięci: [Wiki pamięci](/pl/plugins/memory-wiki)
- CLI wiki: [wiki](/pl/cli/wiki)
- Pluginy: [Pluginy](/pl/tools/plugin)

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

- `--agent <id>`: ogranicz zakres do jednego agenta. Bez tej opcji polecenia te działają dla każdego skonfigurowanego agenta; jeśli lista agentów nie jest skonfigurowana, używają agenta domyślnego.
- `--verbose`: emituj szczegółowe dzienniki podczas sondowania i indeksowania.

`memory status`:

- `--deep`: sprawdź dostępność wektorów i osadzania. Zwykłe `memory status` pozostaje szybkie i nie wykonuje aktywnego testu osadzania. Leksykalne QMD `searchMode: "search"` pomija semantyczne sondowanie wektorów i utrzymanie osadzania nawet z `--deep`.
- `--index`: uruchom ponowne indeksowanie, jeśli magazyn jest nieaktualny (implikuje `--deep`).
- `--fix`: napraw nieaktualne blokady przywołań i znormalizuj metadane promocji.
- `--json`: wydrukuj dane wyjściowe JSON.

Jeśli `memory status` pokazuje `Dreaming status: blocked`, zarządzany Cron Dreaming jest włączony, ale Heartbeat, który go napędza, nie działa dla agenta domyślnego. Zobacz [Dreaming nigdy się nie uruchamia](/pl/concepts/dreaming#dreaming-never-runs-status-shows-blocked), aby poznać dwie częste przyczyny.

`memory index`:

- `--force`: wymuś pełne ponowne indeksowanie.

`memory search`:

- Dane wejściowe zapytania: przekaż pozycyjnie `[query]` albo przez `--query <text>`.
- Jeśli podano oba, wygrywa `--query`.
- Jeśli nie podano żadnego, polecenie kończy się błędem.
- `--agent <id>`: ogranicz zakres do jednego agenta (domyślnie: agent domyślny).
- `--max-results <n>`: ogranicz liczbę zwracanych wyników.
- `--min-score <n>`: odfiltruj dopasowania z niską punktacją.
- `--json`: wydrukuj wyniki JSON.

`memory promote`:

Wyświetl podgląd i zastosuj promocje pamięci krótkoterminowej.

```bash
openclaw memory promote [--apply] [--limit <n>] [--include-promoted]
```

- `--apply` -- zapisz promocje do `MEMORY.md` (domyślnie: tylko podgląd).
- `--limit <n>` -- ogranicz liczbę pokazywanych kandydatów.
- `--include-promoted` -- uwzględnij wpisy już wypromowane w poprzednich cyklach.

Pełne opcje:

- Porządkuje kandydatów krótkoterminowych z `memory/YYYY-MM-DD.md` przy użyciu ważonych sygnałów promocji (`frequency`, `relevance`, `query diversity`, `recency`, `consolidation`, `conceptual richness`).
- Używa sygnałów krótkoterminowych zarówno z przywołań pamięci, jak i dziennych przebiegów ingestii, plus sygnałów wzmocnienia z faz light/REM.
- Gdy Dreaming jest włączone, `memory-core` automatycznie zarządza jednym zadaniem Cron, które uruchamia pełny przebieg (`light -> REM -> deep`) w tle (nie jest wymagane ręczne `openclaw cron add`).
- `--agent <id>`: ogranicz zakres do jednego agenta (domyślnie: agent domyślny).
- `--limit <n>`: maksymalna liczba kandydatów do zwrócenia/zastosowania.
- `--min-score <n>`: minimalna ważona punktacja promocji.
- `--min-recall-count <n>`: minimalna liczba przywołań wymagana dla kandydata.
- `--min-unique-queries <n>`: minimalna liczba odrębnych zapytań wymagana dla kandydata.
- `--apply`: dopisz wybranych kandydatów do `MEMORY.md` i oznacz ich jako wypromowanych.
- `--include-promoted`: uwzględnij w danych wyjściowych kandydatów już wypromowanych.
- `--json`: wydrukuj dane wyjściowe JSON.

`memory promote-explain`:

Wyjaśnij konkretnego kandydata do promocji i rozbicie jego punktacji.

```bash
openclaw memory promote-explain <selector> [--agent <id>] [--include-promoted] [--json]
```

- `<selector>`: klucz kandydata, fragment ścieżki albo fragment wycinka do wyszukania.
- `--agent <id>`: ogranicz zakres do jednego agenta (domyślnie: agent domyślny).
- `--include-promoted`: uwzględnij kandydatów już wypromowanych.
- `--json`: wydrukuj dane wyjściowe JSON.

`memory rem-harness`:

Wyświetl podgląd refleksji REM, prawd kandydujących i danych wyjściowych głębokiej promocji bez zapisywania czegokolwiek.

```bash
openclaw memory rem-harness [--agent <id>] [--include-promoted] [--json]
```

- `--agent <id>`: ogranicz zakres do jednego agenta (domyślnie: agent domyślny).
- `--include-promoted`: uwzględnij już wypromowanych głębokich kandydatów.
- `--json`: wydrukuj dane wyjściowe JSON.

## Dreaming

Dreaming to działający w tle system konsolidacji pamięci z trzema współpracującymi
fazami: **light** (sortowanie/etapowanie materiału krótkoterminowego), **deep** (promowanie trwałych
faktów do `MEMORY.md`) i **REM** (refleksja i wydobywanie motywów).

- Włącz przez `plugins.entries.memory-core.config.dreaming.enabled: true`.
- Przełączaj z czatu za pomocą `/dreaming on|off` (albo sprawdź przez `/dreaming status`).
- Dreaming działa według jednego zarządzanego harmonogramu przebiegu (`dreaming.frequency`) i wykonuje fazy w kolejności: light, REM, deep.
- Tylko faza deep zapisuje trwałą pamięć do `MEMORY.md`.
- Czytelne dla człowieka dane wyjściowe faz i wpisy dziennika są zapisywane do `DREAMS.md` (albo istniejącego `dreams.md`), z opcjonalnymi raportami per faza w `memory/dreaming/<phase>/YYYY-MM-DD.md`.
- Ranking używa ważonych sygnałów: częstotliwości przywołań, relewantności pobierania, różnorodności zapytań, świeżości czasowej, konsolidacji międzydniowej i pochodnego bogactwa pojęciowego.
- Promocja ponownie odczytuje bieżącą notatkę dzienną przed zapisem do `MEMORY.md`, więc edytowane lub usunięte wycinki krótkoterminowe nie zostaną wypromowane z nieaktualnych migawek magazynu przywołań.
- Zaplanowane i ręczne uruchomienia `memory promote` współdzielą te same domyślne ustawienia fazy deep, chyba że przekażesz nadpisania progów CLI.
- Automatyczne uruchomienia rozchodzą się na skonfigurowane obszary robocze pamięci.

Domyślne planowanie:

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

- `memory index --verbose` drukuje szczegóły per faza (dostawca, model, źródła, aktywność wsadowa).
- `memory status` uwzględnia wszelkie dodatkowe ścieżki skonfigurowane przez `memorySearch.extraPaths`.
- Jeśli efektywnie aktywne pola kluczy API zdalnej pamięci są skonfigurowane jako SecretRefs, polecenie rozwiązuje te wartości z aktywnej migawki Gateway. Jeśli Gateway jest niedostępny, polecenie szybko kończy się błędem.
- Uwaga o rozjechaniu wersji Gateway: ta ścieżka polecenia wymaga Gateway obsługującego `secrets.resolve`; starsze Gateway zwracają błąd nieznanej metody.
- Dostosuj rytm zaplanowanego przebiegu za pomocą `dreaming.frequency`. Polityka promocji deep jest poza tym wewnętrzna; użyj flag CLI przy `memory promote`, gdy potrzebujesz jednorazowych ręcznych nadpisań.
- `memory rem-harness --path <file-or-dir> --grounded` pokazuje podgląd ugruntowanych sekcji `What Happened`, `Reflections` i `Possible Lasting Updates` z historycznych notatek dziennych bez zapisywania czegokolwiek.
- `memory rem-backfill --path <file-or-dir>` zapisuje odwracalne ugruntowane wpisy dziennika do `DREAMS.md` do przeglądu w UI.
- `memory rem-backfill --path <file-or-dir> --stage-short-term` dodatkowo zasila ugruntowanych trwałych kandydatów w aktywnym magazynie promocji krótkoterminowych, aby zwykła faza deep mogła ich ocenić rankingowo.
- `memory rem-backfill --rollback` usuwa wcześniej zapisane ugruntowane wpisy dziennika, a `memory rem-backfill --rollback-short-term` usuwa wcześniej zainscenizowanych ugruntowanych kandydatów krótkoterminowych.
- Zobacz [Dreaming](/pl/concepts/dreaming), aby uzyskać pełne opisy faz i referencję konfiguracji.

## Powiązane

- [Referencja CLI](/pl/cli)
- [Omówienie pamięci](/pl/concepts/memory)
