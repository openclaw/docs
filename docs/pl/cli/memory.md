---
read_when:
    - Chcesz indeksować lub przeszukiwać pamięć semantyczną
    - Debugujesz dostępność pamięci lub indeksowanie
    - Chcesz przenieść przywołaną pamięć krótkoterminową do `MEMORY.md`
summary: Dokumentacja referencyjna CLI dla `openclaw memory` (status/index/search/promote/promote-explain/rem-harness)
title: Pamięć
x-i18n:
    generated_at: "2026-06-30T14:27:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 74b85d7299cc12e6133a10678f7c8fe17ee704e029993aebea417727ba94e629
    source_path: cli/memory.md
    workflow: 16
---

# `openclaw memory`

Zarządzaj indeksowaniem i wyszukiwaniem pamięci semantycznej.
Udostępniane przez dołączony plugin `memory-core`. Polecenie jest dostępne, gdy
`plugins.slots.memory` wybiera `memory-core` (domyślnie); inne pluginy pamięci
udostępniają własne przestrzenie nazw CLI.

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

- `--agent <id>`: ogranicz zakres do jednego agenta. Bez tej opcji te polecenia działają dla każdego skonfigurowanego agenta; jeśli nie skonfigurowano listy agentów, wracają do agenta domyślnego.
- `--verbose`: emituj szczegółowe logi podczas sondowania i indeksowania.

`memory status`:

- `--deep`: sprawdź gotowość lokalnego magazynu wektorowego, gotowość dostawcy embeddingów i gotowość semantycznego wyszukiwania wektorowego. Zwykłe `memory status` pozostaje szybkie i nie uruchamia pracy z aktywnymi embeddingami ani wykrywania dostawców; nieznany stan magazynu wektorowego lub wektora semantycznego oznacza, że nie był sondowany w tym poleceniu. Leksykalny QMD `searchMode: "search"` pomija semantyczne sondy wektorowe i utrzymanie embeddingów nawet z `--deep`.
- `--index`: uruchom ponowne indeksowanie, jeśli magazyn jest zabrudzony (implikuje `--deep`).
- `--fix`: napraw nieaktualne blokady recall i znormalizuj metadane promocji.
- `--json`: wypisz dane wyjściowe JSON.

Jeśli `memory status` pokazuje `Dreaming status: blocked`, zarządzany Cron Dreaming jest włączony, ale Heartbeat, który go napędza, nie uruchamia się dla agenta domyślnego. Zobacz [Dreaming nigdy się nie uruchamia](/pl/concepts/dreaming#dreaming-never-runs-status-shows-blocked), aby poznać dwie częste przyczyny.

`memory index`:

- `--force`: wymuś pełne ponowne indeksowanie.

`memory search`:

- Dane wejściowe zapytania: przekaż pozycyjne `[query]` albo `--query <text>`.
- Jeśli podano oba, wygrywa `--query`.
- Jeśli nie podano żadnego, polecenie kończy się błędem.
- `--agent <id>`: ogranicz zakres do jednego agenta (domyślnie: agent domyślny).
- `--max-results <n>`: ogranicz liczbę zwracanych wyników.
- `--min-score <n>`: odfiltruj dopasowania o niskim wyniku.
- `--json`: wypisz wyniki JSON.

`memory promote`:

Podejrzyj i zastosuj promocje pamięci krótkoterminowej.

```bash
openclaw memory promote [--apply] [--limit <n>] [--include-promoted]
```

- `--apply` -- zapisuj promocje do `MEMORY.md` (domyślnie: tylko podgląd).
- `--limit <n>` -- ogranicz liczbę pokazywanych kandydatów.
- `--include-promoted` -- uwzględnij wpisy już wypromowane w poprzednich cyklach.

Pełne opcje:

- Porządkuje kandydatów krótkoterminowych z `memory/YYYY-MM-DD.md` przy użyciu ważonych sygnałów promocji (`frequency`, `relevance`, `query diversity`, `recency`, `consolidation`, `conceptual richness`).
- Używa sygnałów krótkoterminowych zarówno z recall pamięci, jak i przebiegów dziennego pobierania, plus sygnałów wzmocnienia z faz light/REM.
- Gdy Dreaming jest włączony, `memory-core` automatycznie zarządza jednym zadaniem Cron, które uruchamia pełny przebieg (`light -> REM -> deep`) w tle (ręczne `openclaw cron add` nie jest wymagane).
- `--agent <id>`: ogranicz zakres do jednego agenta (domyślnie: agent domyślny).
- `--limit <n>`: maksymalna liczba kandydatów do zwrócenia/zastosowania.
- `--min-score <n>`: minimalny ważony wynik promocji.
- `--min-recall-count <n>`: minimalna liczba recall wymagana dla kandydata.
- `--min-unique-queries <n>`: minimalna liczba odrębnych zapytań wymagana dla kandydata.
- `--apply`: dopisz wybranych kandydatów do `MEMORY.md` i oznacz ich jako wypromowanych.
- `--include-promoted`: uwzględnij już wypromowanych kandydatów w danych wyjściowych.
- `--json`: wypisz dane wyjściowe JSON.

`memory promote-explain`:

Wyjaśnij konkretnego kandydata do promocji i rozbicie jego wyniku.

```bash
openclaw memory promote-explain <selector> [--agent <id>] [--include-promoted] [--json]
```

- `<selector>`: klucz kandydata, fragment ścieżki lub fragment wycinka do wyszukania.
- `--agent <id>`: ogranicz zakres do jednego agenta (domyślnie: agent domyślny).
- `--include-promoted`: uwzględnij już wypromowanych kandydatów.
- `--json`: wypisz dane wyjściowe JSON.

`memory rem-harness`:

Podejrzyj refleksje REM, prawdy kandydujące i wynik głębokiej promocji bez zapisywania czegokolwiek.

```bash
openclaw memory rem-harness [--agent <id>] [--include-promoted] [--json]
```

- `--agent <id>`: ogranicz zakres do jednego agenta (domyślnie: agent domyślny).
- `--include-promoted`: uwzględnij już wypromowanych głębokich kandydatów.
- `--json`: wypisz dane wyjściowe JSON.

## Dreaming

Dreaming to działający w tle system konsolidacji pamięci z trzema współpracującymi
fazami: **light** (sortowanie/przygotowanie materiału krótkoterminowego), **deep** (promowanie trwałych
faktów do `MEMORY.md`) i **REM** (refleksja i wydobywanie tematów).

- Włącz za pomocą `plugins.entries.memory-core.config.dreaming.enabled: true`.
- Przełącz z czatu za pomocą `/dreaming on|off` (albo sprawdź przez `/dreaming status`).
  Wywołujący z kanałów muszą być właścicielami, aby zmienić ustawienie; klienci Gateway potrzebują
  `operator.admin`. Status tylko do odczytu i pomoc pozostają dostępne dla autoryzowanych
  nadawców poleceń.
- Dreaming działa według jednego zarządzanego harmonogramu przebiegu (`dreaming.frequency`) i wykonuje fazy w kolejności: light, REM, deep.
- Tylko faza deep zapisuje trwałą pamięć do `MEMORY.md`.
- Czytelne dla człowieka dane wyjściowe faz i wpisy dziennika są zapisywane do `DREAMS.md` (lub istniejącego `dreams.md`), z opcjonalnymi raportami dla każdej fazy w `memory/dreaming/<phase>/YYYY-MM-DD.md`.
- Ranking używa ważonych sygnałów: częstotliwości recall, trafności pobierania, różnorodności zapytań, świeżości czasowej, konsolidacji między dniami i wyprowadzonego bogactwa pojęciowego.
- Promocja ponownie odczytuje aktywną dzienną notatkę przed zapisem do `MEMORY.md`, więc edytowane lub usunięte krótkoterminowe wycinki nie są promowane z nieaktualnych migawek magazynu recall.
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

- `memory index --verbose` wypisuje szczegóły dla każdej fazy (dostawca, model, źródła, aktywność partii).
- `memory status` uwzględnia wszystkie dodatkowe ścieżki skonfigurowane przez `memorySearch.extraPaths`.
- Jeśli efektywnie używane pola klucza API zdalnej Active Memory są skonfigurowane jako SecretRefs, polecenie rozwiązuje te wartości z aktywnej migawki Gateway. Jeśli Gateway jest niedostępny, polecenie szybko kończy się niepowodzeniem.
- Uwaga o niezgodności wersji Gateway: ta ścieżka polecenia wymaga Gateway obsługującego `secrets.resolve`; starsze Gateway zwracają błąd nieznanej metody.
- Dostrój rytm zaplanowanego przebiegu za pomocą `dreaming.frequency`. Polityka promocji deep jest poza tym wewnętrzna, z wyjątkiem `dreaming.phases.deep.maxPromotedSnippetTokens`, które ogranicza długość promowanego wycinka, zachowując widoczne pochodzenie. Użyj flag CLI na `memory promote`, gdy potrzebujesz jednorazowych ręcznych nadpisań progów.
- `memory rem-harness --path <file-or-dir> --grounded` pokazuje podgląd ugruntowanych sekcji `What Happened`, `Reflections` i `Possible Lasting Updates` z historycznych dziennych notatek bez zapisywania czegokolwiek.
- `memory rem-backfill --path <file-or-dir>` zapisuje odwracalne ugruntowane wpisy dziennika do `DREAMS.md` do przeglądu w UI.
- `memory rem-backfill --path <file-or-dir> --stage-short-term` dodatkowo zasila aktywny magazyn krótkoterminowych promocji ugruntowanymi trwałymi kandydatami, aby zwykła faza deep mogła je uszeregować.
- `memory rem-backfill --rollback` usuwa wcześniej zapisane ugruntowane wpisy dziennika, a `memory rem-backfill --rollback-short-term` usuwa wcześniej przygotowanych ugruntowanych kandydatów krótkoterminowych.
- Zobacz [Dreaming](/pl/concepts/dreaming), aby poznać pełne opisy faz i referencję konfiguracji.

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Przegląd pamięci](/pl/concepts/memory)
