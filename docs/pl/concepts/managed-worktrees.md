---
read_when:
    - Potrzebujesz odizolowanej gałęzi i kopii roboczej do zadania agenta
    - Konfigurujesz karty Workboard z obszarami roboczymi worktree
    - Musisz przywrócić lub uporządkować drzewo robocze zarządzane przez OpenClaw
summary: Uruchamiaj zadania agenta w odizolowanych kopiach roboczych Git z automatycznymi migawkami i czyszczeniem
title: Zarządzane drzewa robocze
x-i18n:
    generated_at: "2026-07-12T15:05:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 12a33dc2d9f1ff30060ddead200196b09cfe9498462f58a7aa8a73fa2273f31f
    source_path: concepts/managed-worktrees.md
    workflow: 16
---

Zarządzane drzewa robocze zapewniają zadaniu agenta własną gałąź git i kopię roboczą bez umieszczania katalogów tymczasowych w repozytorium źródłowym. OpenClaw tworzy je w swoim katalogu stanu, rejestruje we współdzielonej bazie danych stanu oraz wykonuje migawki ich śledzonej i nieignorowanej, nieśledzonej zawartości przed usunięciem.

## Układ i nazwy

Każde drzewo robocze znajduje się w:

```text
<openclaw-state-dir>/worktrees/<repo-fingerprint>/<name>
```

Odcisk repozytorium to pierwszych 16 znaków szesnastkowych skrótu SHA-256 obliczonego na podstawie kanonicznego wspólnego katalogu git i adresu URL origin. Podana nazwa musi odpowiadać wzorcowi `[a-z0-9][a-z0-9-]{0,63}`. Jeśli nazwa nie zostanie podana, OpenClaw generuje `wt-`, po którym następuje osiem losowych znaków szesnastkowych.

OpenClaw tworzy gałąź `openclaw/<name>` we wskazanym odwołaniu bazowym. Jeśli odwołanie bazowe nie zostanie podane, pobiera dane z `origin`, używa domyślnej gałęzi zdalnej, jeśli jest dostępna, a gdy repozytorium jest offline lub nie ma użytecznego repozytorium zdalnego, używa lokalnego `HEAD`.

## Udostępnianie ignorowanych plików

Dodaj `.worktreeinclude` w katalogu głównym repozytorium źródłowego, aby kopiować wybrane ignorowane, nieśledzone pliki do nowego drzewa roboczego. Plik używa składni wzorców gitignore, po jednym wzorcu w każdym wierszu, z komentarzami `#`:

```gitignore
.env.local
fixtures/generated/**
```

Kwalifikują się wyłącznie pliki zgłaszane przez git jednocześnie jako ignorowane i nieśledzone. Śledzone pliki są już obecne dzięki git i nigdy nie są kopiowane na tym etapie. OpenClaw nie nadpisuje plików docelowych ani nie podąża za katalogami będącymi dowiązaniami symbolicznymi oraz zachowuje tryby kopiowanych plików.

## Uruchamianie konfiguracji repozytorium

Jeśli `.openclaw/worktree-setup.sh` istnieje w repozytorium źródłowym i jest wykonywalny, OpenClaw uruchamia go z nowym drzewem roboczym jako katalogiem bieżącym. Skrypt otrzymuje:

```text
OPENCLAW_SOURCE_TREE_PATH=<source checkout>
OPENCLAW_WORKTREE_PATH=<managed worktree>
```

Niezerowy kod wyjścia przerywa tworzenie i usuwa nowe drzewo robocze oraz gałąź. Jest to kontrakt lokalny dla repozytorium; nie istnieje dla niego klucz konfiguracji OpenClaw.

## Drzewa robocze sesji

Rozpocznij odizolowany czat z przestrzeni roboczej git aktywnego agenta, używając sesji opartej na drzewie roboczym: włącz **Drzewo robocze** na stronie Nowa sesja w interfejsie Control UI (która udostępnia również selektor gałęzi bazowej i opcjonalną nazwę drzewa roboczego) albo użyj menu działań czatu w systemie iOS lub dodatkowego działania obok Nowy czat w systemie Android. Opcja jest dostępna tylko dla agenta opartego na git, gdy klient obsługuje tę funkcję; klienci, które nie mogą przeprowadzić wstępnej kontroli, wyświetlają zamiast tego błąd Gateway.

Agenci programistyczni mogą również wywołać `spawn_task`, gdy odkryją potwierdzone dalsze prace wykraczające poza bieżące zadanie. Control UI wyświetla element z sugestią bez uruchamiania czegokolwiek, natomiast TUI oparte na Gateway wyświetla interaktywny monit z tymi samymi działaniami. Wybranie **Rozpocznij w drzewie roboczym** tworzy nowe drzewo robocze należące do sesji na podstawie sugerowanego projektu i wysyła samodzielny monit jako pierwszą turę; odrzucenie sugestii pozostawia repozytorium bez zmian. Sugestie i ich identyfikatory są tymczasowe i nie zachowują się po ponownym uruchomieniu Gateway.

OpenClaw udostępnia te narzędzia wyłącznie sesjom operatora z interfejsem Gateway umożliwiającym działanie. Sesje kanałów oraz lokalne/osadzone sesje TUI nie otrzymują ich, dopóki te powierzchnie nie będą miały przenośnego, typowanego kontraktu działań zadań.

Powstałe zarządzane drzewo robocze należy do sesji, a każde uruchomienie agenta w tej sesji korzysta z jego kopii roboczej. Gdy przestrzeń robocza jest podkatalogiem repozytorium, drzewo robocze jest zakotwiczone w katalogu głównym repozytorium, a sesja działa w odpowiadającym mu podkatalogu. Tworzenie drzewa roboczego sesji używa zakresu metody `operator.write`, ale etap `.openclaw/worktree-setup.sh` jest uruchamiany tylko dla wywołujących z uprawnieniem `operator.admin`, ponieważ wykonuje kod repozytorium; udostępnianie przez `.worktreeinclude` nadal dotyczy każdego wywołującego. Usunięcie sesji usuwa drzewo robocze tylko wtedy, gdy nie powoduje to utraty danych. Zmodyfikowane drzewa robocze lub gałęzie z niewysłanymi commitami pozostają dostępne; cogodzinne czyszczenie wykonuje migawki drzew roboczych sesji po 7 dniach bezczynności, traktując niedawną aktywność sesji jako aktywność drzewa roboczego. Usunięte drzewa robocze można odtworzyć z ich migawek zgodnie z opisem poniżej.

`sessions.create` może zawierać bezwzględną ścieżkę `cwd` wraz z `worktree: true`, gdy zadanie dotyczy projektu innego niż skonfigurowana przestrzeń robocza agenta. Taka jawna ścieżka hosta wymaga `operator.admin`; zwykłe tworzenie czatu z drzewem roboczym nadal wymaga `operator.write` i pozostaje zakotwiczone w skonfigurowanej przestrzeni roboczej.

`sessions.create` akceptuje również `worktreeBaseRef` i `worktreeName` wraz z `worktree: true`, aby wybrać odwołanie bazowe i nazwę drzewa roboczego (gałąź przyjmuje postać `openclaw/<name>`); oba pozostają na poziomie `operator.write`. Utworzone drzewo robocze jest zwracane w wyniku tworzenia i zapisywane w wierszu sesji jako `worktree: { id, branch, repoRoot }`, dzięki czemu listy sesji mogą wyświetlać kopię roboczą i gałąź. Usunięcie sesji zgłasza zachowaną zmodyfikowaną kopię roboczą jako `worktreePreserved`, zamiast pozostawiać ją bez powiadomienia.

## Migawki, czyszczenie i odtwarzanie

Przed usunięciem tworzony jest syntetyczny commit zawierający śledzone i nieignorowane, nieśledzone pliki oraz przypinany pod `refs/openclaw/snapshots/<id>`. Pliki ignorowane przez git są wykluczone z bazy obiektów repozytorium; pliki wybrane przez `.worktreeinclude` są ponownie kopiowane podczas odtwarzania. Jeśli utworzenie migawki się nie powiedzie, usuwanie zostaje zatrzymane. Jawne wymuszenie usunięcia może kontynuować bez migawki.

OpenClaw stosuje następujące reguły czyszczenia:

- Po zakończeniu uruchomienia usuwa drzewo robocze tylko wtedy, gdy `git status --porcelain` nie zwraca żadnych danych, a `git log HEAD --not --remotes --oneline` nie znajduje niewysłanych commitów. W przeciwnym razie jedynie zwalnia blokadę aktywności.
- Cogodzinne czyszczenie wykonuje migawki i usuwa niezablokowane drzewa robocze należące do Workboard i sesji, które pozostają bezczynne przez ponad 7 dni, nawet gdy są zmodyfikowane. Ręczne drzewa robocze nigdy nie są usuwane automatycznie.
- Rekordy migawek można odtwarzać przez 30 dni. Następnie czyszczenie usuwa odwołanie migawki i wiersz rejestru.
- Blokada aktywnego procesu OpenClaw oraz każda obca lub nierozpoznana blokada drzewa roboczego git chronią drzewo robocze przed usuwaniem nieużywanych danych.

Odtwarzanie ponownie tworzy `openclaw/<name>` w pierwotnym commicie sprzed migawki, a następnie rekonstruuje różnice migawki jako nieprzygotowane zmiany i nieśledzone pliki. Dzięki temu syntetyczny commit migawki nie trafia do historii gałęzi. Odwołanie migawki pozostaje zarejestrowane jako informacja o pochodzeniu.

## CLI

```bash
openclaw worktrees list [--json]
openclaw worktrees create <repo-root> [--name <name>] [--base-ref <ref>] [--json]
openclaw worktrees remove <id> [--force] [--json]
openclaw worktrees restore <id> [--json]
openclaw worktrees gc [--json]
```

Strona **Drzewa robocze** w sekcji Ustawienia interfejsu Control UI udostępnia te same działania, a także tworzenie z selektorem gałęzi bazowej, wyświetla właściciela każdego drzewa roboczego (ręczne, Workboard lub sesja będąca właścicielem wraz z łączem do jej czatu) oraz umożliwia wymuszenie ponownej próby, gdy podczas usuwania zostanie zgłoszony błąd migawki.

## Metody Gateway

| Metoda               | Przeznaczenie                                                                 |
| -------------------- | ----------------------------------------------------------------------------- |
| `worktrees.list`     | Wyświetla aktywne i możliwe do odtworzenia rekordy drzew roboczych.           |
| `worktrees.branches` | Wyświetla lokalne i zdalne gałęzie repozytorium na potrzeby selektorów odwołania bazowego. |
| `worktrees.create`   | Tworzy lub ponownie wykorzystuje nazwane zarządzane drzewo robocze.           |
| `worktrees.remove`   | Wykonuje migawkę i usuwa drzewo robocze. Wymuszone usunięcia zgłaszają `snapshotError`. |
| `worktrees.restore`  | Odtwarza usunięte drzewo robocze z jego migawki.                              |
| `worktrees.gc`       | Natychmiast uruchamia czyszczenie bezczynnych i osieroconych elementów oraz danych po upływie okresu przechowywania. |

`worktrees.list` wymaga `operator.read`, a metody modyfikujące wymagają `operator.admin`. `worktrees.branches` wymaga `operator.write` dla skonfigurowanych przestrzeni roboczych agentów, natomiast każda inna ścieżka hosta wymaga `operator.admin` (zgodnie z wymaganiami dotyczącymi cwd w `sessions.create`). Odczytuje wyłącznie istniejące odwołania i nigdy nie pobiera danych, a gałęzie istniejące tylko zdalnie są zwracane z kwalifikatorem zdalnym (`origin/feature-a`), dzięki czemu każda zwrócona nazwa może zostać rozpoznana jako odwołanie bazowe.

## Przestrzenie robocze Workboard

Dołączony [Plugin Workboard](/pl/plugins/workboard) może zmaterializować przestrzeń roboczą karty jako zarządzane drzewo robocze:

```json
{
  "kind": "worktree",
  "path": "/absolute/path/to/source-checkout",
  "branch": "main"
}
```

`path` wskazuje źródłową kopię roboczą git. `branch` jest opcjonalne i staje się odwołaniem bazowym. Gdy wysyłanie uruchamia wykonawcę karty, Workboard tworzy lub ponownie wykorzystuje `wb-<card-id>`, uruchamia podagenta z zarządzaną kopią roboczą jako jego katalogiem roboczym oraz zapisuje rozpoznaną ścieżkę i gałąź z powrotem w karcie. Materializacja wyzwalana przez Gateway wymaga `operator.admin`. Po zakończeniu uruchomienia Workboard usuwa kopię roboczą tylko wtedy, gdy można udowodnić, że nie spowoduje to utraty danych; zmodyfikowana praca lub niewysłane commity pozostają dostępne.

Osadzeni agenci działający w piaskownicy obecnie odrzucają katalog roboczy zadania znajdujący się poza skonfigurowaną przestrzenią roboczą agenta. W przypadku kart Workboard z zarządzanymi drzewami roboczymi używaj agenta docelowego bez piaskownicy, dopóki środowisko uruchomieniowe piaskownicy nie będzie obsługiwać dodatkowego montowania kopii roboczej.
