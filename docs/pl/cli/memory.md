---
read_when:
    - Chcesz indeksować lub przeszukiwać pamięć semantyczną
    - Debugujesz dostępność pamięci lub indeksowanie
    - Chcesz promować przywołaną pamięć krótkoterminową do `MEMORY.md`
summary: Dokumentacja CLI dla `openclaw memory` (status/index/search/promote/promote-explain/rem-harness)
title: Pamięć
x-i18n:
    generated_at: "2026-04-24T09:03:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4bcb1af05ecddceef7cd1d3244c8f0e4fc740d6d41fc5e9daa37177d1bfe3674
    source_path: cli/memory.md
    workflow: 15
---

# `openclaw memory`

Zarządzanie indeksowaniem i wyszukiwaniem pamięci semantycznej.
Dostarczane przez aktywny Plugin pamięci (domyślnie: `memory-core`; ustaw `plugins.slots.memory = "none"`, aby wyłączyć).

Powiązane:

- Koncepcja pamięci: [Memory](/pl/concepts/memory)
- Wiki pamięci: [Memory Wiki](/pl/plugins/memory-wiki)
- CLI wiki: [wiki](/pl/cli/wiki)
- Pluginy: [Plugins](/pl/tools/plugin)

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

- `--agent <id>`: ogranicza do jednego agenta. Bez tego te polecenia są uruchamiane dla każdego skonfigurowanego agenta; jeśli nie skonfigurowano listy agentów, wracają do agenta domyślnego.
- `--verbose`: emituje szczegółowe logi podczas sondowania i indeksowania.

`memory status`:

- `--deep`: sonduje dostępność wektorów i embeddingów.
- `--index`: uruchamia ponowne indeksowanie, jeśli magazyn jest zabrudzony (implikuje `--deep`).
- `--fix`: naprawia nieaktualne blokady recall i normalizuje metadane promocji.
- `--json`: wypisuje dane wyjściowe w formacie JSON.

Jeśli `memory status` pokazuje `Dreaming status: blocked`, zarządzane zadanie cron Dreaming jest włączone, ale heartbeat, który je napędza, nie uruchamia się dla domyślnego agenta. Zobacz [Dreaming never runs](/pl/concepts/dreaming#dreaming-never-runs-status-shows-blocked), aby poznać dwie typowe przyczyny.

`memory index`:

- `--force`: wymusza pełne ponowne indeksowanie.

`memory search`:

- Wejście zapytania: przekaż albo pozycyjne `[query]`, albo `--query <text>`.
- Jeśli podano oba, pierwszeństwo ma `--query`.
- Jeśli nie podano żadnego, polecenie kończy się błędem.
- `--agent <id>`: ogranicza do jednego agenta (domyślnie: agent domyślny).
- `--max-results <n>`: ogranicza liczbę zwracanych wyników.
- `--min-score <n>`: odfiltrowuje dopasowania z niskim wynikiem.
- `--json`: wypisuje wyniki JSON.

`memory promote`:

Podgląd i stosowanie promocji pamięci krótkoterminowej.

```bash
openclaw memory promote [--apply] [--limit <n>] [--include-promoted]
```

- `--apply` -- zapisuje promocje do `MEMORY.md` (domyślnie: tylko podgląd).
- `--limit <n>` -- ogranicza liczbę pokazywanych kandydatów.
- `--include-promoted` -- uwzględnia wpisy już promowane w poprzednich cyklach.

Pełne opcje:

- Ranguje kandydatów krótkoterminowych z `memory/YYYY-MM-DD.md` przy użyciu ważonych sygnałów promocji (`frequency`, `relevance`, `query diversity`, `recency`, `consolidation`, `conceptual richness`).
- Używa sygnałów krótkoterminowych zarówno z recall pamięci, jak i z dziennych przebiegów ingestii, plus lekkich sygnałów wzmocnienia fazy REM.
- Gdy Dreaming jest włączone, `memory-core` automatycznie zarządza jednym zadaniem cron, które uruchamia pełny przebieg (`light -> REM -> deep`) w tle (bez ręcznego `openclaw cron add`).
- `--agent <id>`: ogranicza do jednego agenta (domyślnie: agent domyślny).
- `--limit <n>`: maksymalna liczba kandydatów do zwrócenia/zastosowania.
- `--min-score <n>`: minimalny ważony wynik promocji.
- `--min-recall-count <n>`: minimalna liczba recall wymagana dla kandydata.
- `--min-unique-queries <n>`: minimalna liczba różnych zapytań wymagana dla kandydata.
- `--apply`: dołącza wybranych kandydatów do `MEMORY.md` i oznacza ich jako promowanych.
- `--include-promoted`: uwzględnia już promowanych kandydatów w danych wyjściowych.
- `--json`: wypisuje dane wyjściowe JSON.

`memory promote-explain`:

Wyjaśnia konkretnego kandydata do promocji i rozbicie jego wyniku.

```bash
openclaw memory promote-explain <selector> [--agent <id>] [--include-promoted] [--json]
```

- `<selector>`: klucz kandydata, fragment ścieżki lub fragment snippetu do wyszukania.
- `--agent <id>`: ogranicza do jednego agenta (domyślnie: agent domyślny).
- `--include-promoted`: uwzględnia już promowanych kandydatów.
- `--json`: wypisuje dane wyjściowe JSON.

`memory rem-harness`:

Podgląd refleksji REM, prawd kandydatów i danych wyjściowych głębokiej promocji bez zapisywania czegokolwiek.

```bash
openclaw memory rem-harness [--agent <id>] [--include-promoted] [--json]
```

- `--agent <id>`: ogranicza do jednego agenta (domyślnie: agent domyślny).
- `--include-promoted`: uwzględnia już promowanych głębokich kandydatów.
- `--json`: wypisuje dane wyjściowe JSON.

## Dreaming

Dreaming to działający w tle system konsolidacji pamięci z trzema współpracującymi
fazami: **light** (sortowanie/przygotowanie materiału krótkoterminowego), **deep** (promowanie trwałych
faktów do `MEMORY.md`) i **REM** (refleksja i wydobywanie motywów).

- Włącz przez `plugins.entries.memory-core.config.dreaming.enabled: true`.
- Przełączaj z czatu za pomocą `/dreaming on|off` (lub sprawdzaj przez `/dreaming status`).
- Dreaming działa według jednego zarządzanego harmonogramu przebiegów (`dreaming.frequency`) i wykonuje fazy w kolejności: light, REM, deep.
- Tylko faza deep zapisuje trwałą pamięć do `MEMORY.md`.
- Czytelne dla człowieka dane wyjściowe faz i wpisy dziennika są zapisywane do `DREAMS.md` (lub istniejącego `dreams.md`), z opcjonalnymi raportami dla poszczególnych faz w `memory/dreaming/<phase>/YYYY-MM-DD.md`.
- Ranking używa ważonych sygnałów: częstotliwości recall, trafności odzyskania, różnorodności zapytań, recency czasowej, konsolidacji między dniami i pochodnej bogatości pojęciowej.
- Promocja ponownie odczytuje bieżącą notatkę dzienną przed zapisem do `MEMORY.md`, więc edytowane lub usunięte krótkoterminowe snippety nie są promowane ze starych snapshotów magazynu recall.
- Zaplanowane i ręczne uruchomienia `memory promote` współdzielą te same domyślne ustawienia fazy deep, chyba że przekażesz nadpisania progów CLI.
- Automatyczne uruchomienia rozchodzą się na wszystkie skonfigurowane obszary robocze pamięci.

Domyślny harmonogram:

- **Częstotliwość przebiegu**: `dreaming.frequency = 0 3 * * *`
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

- `memory index --verbose` wypisuje szczegóły dla każdej fazy (provider, model, źródła, aktywność batch).
- `memory status` uwzględnia wszelkie dodatkowe ścieżki skonfigurowane przez `memorySearch.extraPaths`.
- Jeśli efektywnie aktywne pola klucza API pamięci zdalnej są skonfigurowane jako SecretRefs, polecenie rozwiązuje te wartości z aktywnego snapshotu gateway. Jeśli gateway jest niedostępny, polecenie natychmiast kończy się błędem.
- Uwaga o różnicy wersji Gateway: ta ścieżka poleceń wymaga gateway, który obsługuje `secrets.resolve`; starsze gatewaye zwracają błąd nieznanej metody.
- Dostosuj częstotliwość zaplanowanych przebiegów za pomocą `dreaming.frequency`. Poza tym polityka głębokiej promocji jest wewnętrzna; używaj flag CLI w `memory promote`, gdy potrzebujesz jednorazowych ręcznych nadpisań.
- `memory rem-harness --path <file-or-dir> --grounded` pokazuje podgląd ugruntowanych `What Happened`, `Reflections` i `Possible Lasting Updates` z historycznych notatek dziennych bez zapisywania czegokolwiek.
- `memory rem-backfill --path <file-or-dir>` zapisuje odwracalne ugruntowane wpisy dziennika do `DREAMS.md` do przeglądu w UI.
- `memory rem-backfill --path <file-or-dir> --stage-short-term` dodatkowo zasila ugruntowanych trwałych kandydatów do aktywnego magazynu promocji krótkoterminowej, aby normalna faza deep mogła ich uszeregować.
- `memory rem-backfill --rollback` usuwa wcześniej zapisane ugruntowane wpisy dziennika, a `memory rem-backfill --rollback-short-term` usuwa wcześniej przygotowanych ugruntowanych kandydatów krótkoterminowych.
- Zobacz [Dreaming](/pl/concepts/dreaming), aby poznać pełne opisy faz i dokumentację konfiguracji.

## Powiązane

- [CLI reference](/pl/cli)
- [Memory overview](/pl/concepts/memory)
