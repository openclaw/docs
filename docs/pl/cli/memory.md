---
read_when:
    - Chcesz indeksować lub przeszukiwać pamięć semantyczną
    - Debugujesz dostępność pamięci lub indeksowanie
    - Chcesz przenieść przywołaną pamięć krótkoterminową do `MEMORY.md`
summary: Dokumentacja CLI dla `openclaw memory` (status/index/search/promote)
title: memory
x-i18n:
    generated_at: "2026-04-05T13:49:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: a89e3a819737bb63521128ae63d9e25b5cd9db35c3ea4606d087a8ad48b41eab
    source_path: cli/memory.md
    workflow: 15
---

# `openclaw memory`

Zarządzaj indeksowaniem i wyszukiwaniem pamięci semantycznej.
Udostępniane przez aktywną wtyczkę pamięci (domyślnie: `memory-core`; ustaw `plugins.slots.memory = "none"`, aby wyłączyć).

Powiązane:

- Koncepcja pamięci: [Pamięć](/concepts/memory)
- Wtyczki: [Plugins](/tools/plugin)

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
openclaw memory status --json
openclaw memory status --deep --index
openclaw memory status --deep --index --verbose
openclaw memory status --agent main
openclaw memory index --agent main --verbose
```

## Opcje

`memory status` i `memory index`:

- `--agent <id>`: ogranicza do jednego agenta. Bez tej opcji polecenia uruchamiają się dla każdego skonfigurowanego agenta; jeśli nie skonfigurowano listy agentów, przechodzą do agenta domyślnego.
- `--verbose`: wyświetla szczegółowe logi podczas sondowania i indeksowania.

`memory status`:

- `--deep`: sprawdza dostępność wektorów i osadzeń.
- `--index`: uruchamia ponowne indeksowanie, jeśli magazyn jest zabrudzony (implikuje `--deep`).
- `--fix`: naprawia nieaktualne blokady przywołań i normalizuje metadane promocji.
- `--json`: wypisuje dane wyjściowe JSON.

`memory index`:

- `--force`: wymusza pełne ponowne indeksowanie.

`memory search`:

- Dane wejściowe zapytania: przekaż albo pozycyjne `[query]`, albo `--query <text>`.
- Jeśli podane są oba, pierwszeństwo ma `--query`.
- Jeśli nie podano żadnego, polecenie kończy się błędem.
- `--agent <id>`: ogranicza do jednego agenta (domyślnie: agent domyślny).
- `--max-results <n>`: ogranicza liczbę zwracanych wyników.
- `--min-score <n>`: odfiltrowuje dopasowania z niskim wynikiem.
- `--json`: wypisuje wyniki JSON.

`memory promote`:

Wyświetla podgląd i stosuje promocje pamięci krótkoterminowej.

```bash
openclaw memory promote [--apply] [--limit <n>] [--include-promoted]
```

- `--apply` -- zapisuje promocje do `MEMORY.md` (domyślnie: tylko podgląd).
- `--limit <n>` -- ogranicza liczbę wyświetlanych kandydatów.
- `--include-promoted` -- uwzględnia wpisy już promowane w poprzednich cyklach.

Pełne opcje:

- Ranking krótkoterminowych kandydatów z `memory/YYYY-MM-DD.md` na podstawie ważonych sygnałów przywołań (`frequency`, `relevance`, `query diversity`, `recency`).
- Używa zdarzeń przywołań rejestrowanych, gdy `memory_search` zwraca trafienia z pamięci dziennej.
- Opcjonalny tryb automatycznego dreaming: gdy `plugins.entries.memory-core.config.dreaming.mode` ma wartość `core`, `deep` lub `rem`, `memory-core` automatycznie zarządza zadaniem cron, które uruchamia promocję w tle (ręczne `openclaw cron add` nie jest wymagane).
- `--agent <id>`: ogranicza do jednego agenta (domyślnie: agent domyślny).
- `--limit <n>`: maksymalna liczba kandydatów do zwrócenia/zastosowania.
- `--min-score <n>`: minimalny ważony wynik promocji.
- `--min-recall-count <n>`: minimalna liczba przywołań wymagana dla kandydata.
- `--min-unique-queries <n>`: minimalna liczba odrębnych zapytań wymagana dla kandydata.
- `--apply`: dopisuje wybranych kandydatów do `MEMORY.md` i oznacza ich jako promowanych.
- `--include-promoted`: uwzględnia już promowanych kandydatów w danych wyjściowych.
- `--json`: wypisuje dane wyjściowe JSON.

## Dreaming (eksperymentalne)

Dreaming to nocny etap refleksji dla pamięci. Nazywa się go „dreaming”, ponieważ system ponownie analizuje to, co zostało przywołane w ciągu dnia, i decyduje, co warto zachować długoterminowo.

- Jest to funkcja opt-in i domyślnie jest wyłączona.
- Włącz ją za pomocą `plugins.entries.memory-core.config.dreaming.mode`.
- Możesz przełączać tryby z czatu za pomocą `/dreaming off|core|rem|deep`. Uruchom `/dreaming` (lub `/dreaming options`), aby zobaczyć, co robi każdy tryb.
- Po włączeniu `memory-core` automatycznie tworzy i utrzymuje zarządzane zadanie cron.
- Ustaw `dreaming.limit` na `0`, jeśli chcesz mieć włączone dreaming, ale z efektywnie wstrzymaną automatyczną promocją.
- Ranking wykorzystuje ważone sygnały: częstotliwość przywołań, trafność wyszukiwania, różnorodność zapytań i świeżość czasową (ostatnie przywołania z czasem tracą na znaczeniu).
- Promocja do `MEMORY.md` następuje tylko wtedy, gdy spełnione są progi jakości, dzięki czemu pamięć długoterminowa pozostaje bogata w istotne sygnały zamiast gromadzić jednorazowe szczegóły.

Domyślne presety trybów:

- `core`: codziennie o `0 3 * * *`, `minScore=0.75`, `minRecallCount=3`, `minUniqueQueries=2`
- `deep`: co 12 godzin (`0 */12 * * *`), `minScore=0.8`, `minRecallCount=3`, `minUniqueQueries=3`
- `rem`: co 6 godzin (`0 */6 * * *`), `minScore=0.85`, `minRecallCount=4`, `minUniqueQueries=3`

Przykład:

```json
{
  "plugins": {
    "entries": {
      "memory-core": {
        "config": {
          "dreaming": {
            "mode": "core"
          }
        }
      }
    }
  }
}
```

Uwagi:

- `memory index --verbose` wypisuje szczegóły dla każdego etapu (provider, model, źródła, aktywność wsadów).
- `memory status` uwzględnia wszystkie dodatkowe ścieżki skonfigurowane przez `memorySearch.extraPaths`.
- Jeśli efektywnie aktywne pola kluczy zdalnego API pamięci są skonfigurowane jako SecretRefs, polecenie rozwiązuje te wartości z aktywnego snapshotu gateway. Jeśli gateway jest niedostępny, polecenie kończy się natychmiast błędem.
- Uwaga o rozbieżności wersji gateway: ta ścieżka polecenia wymaga gateway obsługującego `secrets.resolve`; starsze gateway zwracają błąd nieznanej metody.
- Domyślna częstotliwość dreaming odpowiada presetowi harmonogramu dla danego trybu. Zastąp częstotliwość za pomocą `plugins.entries.memory-core.config.dreaming.frequency` jako wyrażenia cron (na przykład `0 3 * * *`) i dostrój działanie za pomocą `timezone`, `limit`, `minScore`, `minRecallCount` oraz `minUniqueQueries`.
