---
read_when:
    - Chcesz indeksować lub przeszukiwać pamięć semantyczną
    - Debugujesz dostępność pamięci lub indeksowanie
    - Chcesz promować przywołaną pamięć krótkotrwałą do `MEMORY.md`
summary: Dokumentacja referencyjna CLI dla `openclaw memory` (status/index/search/promote/promote-explain/rem-harness)
title: Pamięć
x-i18n:
    generated_at: "2026-06-27T17:21:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 553c69ccc92d398e765a33bfadb8cc9a0bf9e0f86b319fb4fcff05464ebebe7c
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

- `--deep`: sonduj gotowość lokalnego magazynu wektorowego, gotowość dostawcy osadzeń oraz gotowość semantycznego wyszukiwania wektorowego. Zwykłe `memory status` pozostaje szybkie i nie uruchamia aktywnego osadzania ani wykrywania dostawcy; nieznany stan magazynu wektorowego lub wektora semantycznego oznacza, że nie był sondowany w tym poleceniu. Leksykalny tryb QMD `searchMode: "search"` pomija sondy wektorów semantycznych i utrzymanie osadzeń nawet z `--deep`.
- `--index`: uruchom ponowne indeksowanie, jeśli magazyn jest zabrudzony (implikuje `--deep`).
- `--fix`: napraw przestarzałe blokady przywołań i znormalizuj metadane promocji.
- `--json`: wypisz wynik JSON.

Jeśli `memory status` pokazuje `Dreaming status: blocked`, zarządzany cron Dreaming jest włączony, ale Heartbeat, który go napędza, nie działa dla domyślnego agenta. Zobacz [Dreaming nigdy się nie uruchamia](/pl/concepts/dreaming#dreaming-never-runs-status-shows-blocked), aby poznać dwie częste przyczyny.

`memory index`:

- `--force`: wymuś pełne ponowne indeksowanie.

`memory search`:

- Dane wejściowe zapytania: przekaż pozycyjne `[query]` albo `--query <text>`.
- Jeśli podano oba, wygrywa `--query`.
- Jeśli nie podano żadnego, polecenie kończy się błędem.
- `--agent <id>`: ogranicz zakres do jednego agenta (domyślnie: agent domyślny).
- `--max-results <n>`: ogranicz liczbę zwracanych wyników.
- `--min-score <n>`: odfiltruj dopasowania z niskim wynikiem.
- `--json`: wypisz wyniki JSON.

`memory promote`:

Wyświetl podgląd i zastosuj promocje pamięci krótkoterminowej.

```bash
openclaw memory promote [--apply] [--limit <n>] [--include-promoted]
```

- `--apply` -- zapisz promocje do `MEMORY.md` (domyślnie: tylko podgląd).
- `--limit <n>` -- ogranicz liczbę pokazywanych kandydatów.
- `--include-promoted` -- uwzględnij wpisy już promowane w poprzednich cyklach.

Pełne opcje:

- Klasyfikuje kandydatów krótkoterminowych z `memory/YYYY-MM-DD.md` przy użyciu ważonych sygnałów promocji (`frequency`, `relevance`, `query diversity`, `recency`, `consolidation`, `conceptual richness`).
- Używa sygnałów krótkoterminowych zarówno z przywołań pamięci, jak i dziennych przebiegów ingestii, a także sygnałów wzmocnienia faz light/REM.
- Gdy Dreaming jest włączony, `memory-core` automatycznie zarządza jednym zadaniem cron, które uruchamia pełny przebieg (`light -> REM -> deep`) w tle (ręczne `openclaw cron add` nie jest wymagane).
- `--agent <id>`: ogranicz zakres do jednego agenta (domyślnie: agent domyślny).
- `--limit <n>`: maksymalna liczba kandydatów do zwrócenia/zastosowania.
- `--min-score <n>`: minimalny ważony wynik promocji.
- `--min-recall-count <n>`: minimalna wymagana liczba przywołań dla kandydata.
- `--min-unique-queries <n>`: minimalna wymagana liczba odrębnych zapytań dla kandydata.
- `--apply`: dołącz wybranych kandydatów do `MEMORY.md` i oznacz ich jako promowanych.
- `--include-promoted`: uwzględnij w wyniku kandydatów już promowanych.
- `--json`: wypisz wynik JSON.

`memory promote-explain`:

Wyjaśnij konkretnego kandydata do promocji i rozbicie jego wyniku.

```bash
openclaw memory promote-explain <selector> [--agent <id>] [--include-promoted] [--json]
```

- `<selector>`: klucz kandydata, fragment ścieżki albo fragment wycinka do wyszukania.
- `--agent <id>`: ogranicz zakres do jednego agenta (domyślnie: agent domyślny).
- `--include-promoted`: uwzględnij kandydatów już promowanych.
- `--json`: wypisz wynik JSON.

`memory rem-harness`:

Wyświetl podgląd refleksji REM, kandydatów na prawdy i wyniku głębokiej promocji bez zapisywania czegokolwiek.

```bash
openclaw memory rem-harness [--agent <id>] [--include-promoted] [--json]
```

- `--agent <id>`: ogranicz zakres do jednego agenta (domyślnie: agent domyślny).
- `--include-promoted`: uwzględnij już promowanych głębokich kandydatów.
- `--json`: wypisz wynik JSON.

## Dreaming

Dreaming to działający w tle system konsolidacji pamięci z trzema współpracującymi
fazami: **light** (sortowanie/przygotowanie materiału krótkoterminowego), **deep** (promowanie trwałych
faktów do `MEMORY.md`) oraz **REM** (refleksja i wydobywanie tematów).

- Włącz za pomocą `plugins.entries.memory-core.config.dreaming.enabled: true`.
- Przełącz z czatu za pomocą `/dreaming on|off` (albo sprawdź przez `/dreaming status`).
- Dreaming działa według jednego zarządzanego harmonogramu przebiegów (`dreaming.frequency`) i wykonuje fazy w kolejności: light, REM, deep.
- Tylko faza deep zapisuje trwałą pamięć do `MEMORY.md`.
- Czytelne dla człowieka wyniki faz i wpisy dziennika są zapisywane do `DREAMS.md` (albo istniejącego `dreams.md`), z opcjonalnymi raportami per faza w `memory/dreaming/<phase>/YYYY-MM-DD.md`.
- Ranking używa ważonych sygnałów: częstotliwości przywołań, trafności pobierania, różnorodności zapytań, czasowej świeżości, konsolidacji między dniami oraz pochodnego bogactwa pojęciowego.
- Promocja ponownie odczytuje aktywną dzienną notatkę przed zapisem do `MEMORY.md`, więc edytowane lub usunięte wycinki krótkoterminowe nie są promowane z przestarzałych migawek magazynu przywołań.
- Zaplanowane i ręczne uruchomienia `memory promote` współdzielą te same domyślne ustawienia fazy deep, chyba że przekażesz nadpisania progów przez CLI.
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

- `memory index --verbose` wypisuje szczegóły per faza (dostawca, model, źródła, aktywność partii).
- `memory status` uwzględnia wszystkie dodatkowe ścieżki skonfigurowane przez `memorySearch.extraPaths`.
- Jeśli faktycznie aktywne pola klucza API zdalnej pamięci są skonfigurowane jako SecretRefs, polecenie rozwiązuje te wartości z aktywnej migawki Gateway. Jeśli Gateway jest niedostępny, polecenie szybko kończy się błędem.
- Uwaga o rozjechaniu wersji Gateway: ta ścieżka polecenia wymaga Gateway obsługującego `secrets.resolve`; starsze Gateway zwracają błąd nieznanej metody.
- Dostrój rytm zaplanowanych przebiegów za pomocą `dreaming.frequency`. Zasady promocji deep są poza tym wewnętrzne, z wyjątkiem `dreaming.phases.deep.maxPromotedSnippetTokens`, które ogranicza długość promowanego wycinka, zachowując widoczne pochodzenie. Użyj flag CLI w `memory promote`, gdy potrzebujesz jednorazowych ręcznych nadpisań progów.
- `memory rem-harness --path <file-or-dir> --grounded` pokazuje podgląd ugruntowanych sekcji `What Happened`, `Reflections` i `Possible Lasting Updates` z historycznych dziennych notatek bez zapisywania czegokolwiek.
- `memory rem-backfill --path <file-or-dir>` zapisuje odwracalne, ugruntowane wpisy dziennika do `DREAMS.md` do przeglądu w UI.
- `memory rem-backfill --path <file-or-dir> --stage-short-term` dodatkowo zasila aktywny krótkoterminowy magazyn promocji ugruntowanymi trwałymi kandydatami, aby zwykła faza deep mogła ich sklasyfikować.
- `memory rem-backfill --rollback` usuwa wcześniej zapisane ugruntowane wpisy dziennika, a `memory rem-backfill --rollback-short-term` usuwa wcześniej przygotowanych ugruntowanych kandydatów krótkoterminowych.
- Zobacz [Dreaming](/pl/concepts/dreaming), aby poznać pełne opisy faz i dokumentację konfiguracji.

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Omówienie pamięci](/pl/concepts/memory)
