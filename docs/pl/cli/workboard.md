---
read_when:
    - Chcesz przeglądać lub tworzyć karty Workboard z poziomu terminala
    - Chcesz uruchamiać zadania workerów Workboard z poziomu CLI
    - Debugowanie działania CLI Workboard lub poleceń z ukośnikiem
summary: Dokumentacja CLI dotycząca kart `openclaw workboard`, przydzielania i uruchomień workerów
title: CLI tablicy zadań
x-i18n:
    generated_at: "2026-07-16T18:15:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: c109402dad26a44a277febf895e4f4305060e3b6c8ecc024aca5f255de8b5717
    source_path: cli/workboard.md
    workflow: 16
---

`openclaw workboard` to interfejs terminalowy dołączonego [pluginu Workboard](/pl/plugins/workboard). Umożliwia operatorowi wyświetlanie kart, tworzenie karty, sprawdzanie pojedynczej karty oraz zlecanie działającemu Gatewayowi przekazania gotowej pracy do uruchomień subagentów roboczych.

Przed użyciem polecenia należy włączyć plugin:

```bash
openclaw plugins enable workboard
openclaw gateway restart
```

## Użycie

```bash
openclaw workboard list [--board <id>] [--status <status>] [--include-archived] [--json]
openclaw workboard create <title...> [--notes <text>] [--status <status>] [--priority <priority>] [--agent <id>] [--board <id>] [--labels <items>] [--json]
openclaw workboard show <id> [--json]
openclaw workboard move <id> --status <status> [--json]
openclaw workboard dispatch [--board <id>] [--max-starts <count>] [--admin] [--url <url>] [--token <token>] [--timeout <ms>] [--json]
```

Polecenie odczytuje i zapisuje tę samą należącą do pluginu bazę danych SQLite, której używają pulpit i narzędzia agenta Workboard. Identyfikatory kart są identyfikatorami UUID; polecenia przyjmujące identyfikator karty akceptują również jednoznaczny prefiks identyfikatora (zwarty tekst wyjściowy pokazuje pierwsze 8 znaków).

Prawidłowe wartości `status`: `triage`, `backlog`, `todo`, `scheduled`, `ready`, `running`, `review`, `blocked`, `done`. Prawidłowe wartości `priority`: `low`, `normal`, `high`, `urgent`.

## `list`

```bash
openclaw workboard list
openclaw workboard list --board default --status ready
openclaw workboard list --json
```

Tekst wyjściowy ma zwartą postać:

```text
7f4a2c10  ready     high    default agent-a  Napraw nieaktualny Heartbeat procesu roboczego
```

Kolumny zawierają prefiks identyfikatora, status, priorytet, identyfikator tablicy, opcjonalny identyfikator agenta oraz tytuł.

| Flaga                | Przeznaczenie                                                |
| -------------------- | ------------------------------------------------------------ |
| `--board <id>`   | Ograniczenie wyników do przestrzeni nazw jednej tablicy      |
| `--status <status>`   | Ograniczenie wyników do jednego statusu Workboard            |
| `--include-archived`   | Uwzględnienie zarchiwizowanych kart w zwartym tekście wyjściowym |
| `--json`   | Wyświetlenie pełnej listy kart jako JSON do przetwarzania maszynowego |

Zwarty tekst wyjściowy domyślnie ukrywa zarchiwizowane karty, dzięki czemu CLI odpowiada `/workboard list`. Aby je wyświetlić, należy przekazać `--include-archived`. Dane wyjściowe JSON zawsze zachowują pełną listę kart, w tym karty zarchiwizowane, na potrzeby istniejącej automatyzacji.

## `create`

```bash
openclaw workboard create "Fix stale worker heartbeat" --priority high --labels bug,workboard
openclaw workboard create "Write Workboard docs" --status ready --agent docs-agent --board docs --notes "Cover CLI, slash command, dispatch, and SQLite state."
```

| Flaga                | Przeznaczenie                                      |
| -------------------- | -------------------------------------------------- |
| `--notes <text>`   | Początkowe notatki karty                           |
| `--status <status>`   | Status początkowy, domyślnie `todo`    |
| `--priority <priority>`   | Priorytet, domyślnie `normal`            |
| `--agent <id>`   | Przypisanie karty do agenta lub identyfikatora właściciela |
| `--board <id>`   | Zapisanie karty w przestrzeni nazw tablicy         |
| `--labels <items>`   | Etykiety rozdzielone przecinkami                   |
| `--json`   | Wyświetlenie utworzonej karty jako JSON do przetwarzania maszynowego |

`create` zapisuje bezpośrednio do stanu SQLite Workboard. Karta jest natychmiast widoczna na karcie Workboard w Control UI oraz dla narzędzi Workboard.

## `show`

```bash
openclaw workboard show 7f4a2c10
openclaw workboard show 7f4a2c10 --json
```

Tekst wyjściowy zawiera zwarty wiersz karty i notatki. Dane wyjściowe JSON zwracają pełny rekord karty, w tym metadane wykonania, próby, komentarze, łącza, dowody, artefakty, dzienniki procesów roboczych, stan protokołu, diagnostykę i metadane automatyzacji.

## `move`

```bash
openclaw workboard move 7f4a2c10 --status review
openclaw workboard move 7f4a2c10 --status done --json
```

`move` zmienia status karty przy użyciu tej samej ścieżki ręcznej obsługi, co przeciąganie karty na pulpicie. Akceptuje pełny identyfikator karty lub jego jednoznaczny prefiks. Aktywne blokady wynikające z zależności i harmonogramu nadal obowiązują. Operatorzy mogą przenieść przejętą kartę bez tokenu przejęcia jej agenta; tokeny przejęcia pozostają ograniczone do modyfikacji wykonywanych przez narzędzia agenta i są redagowane w danych wyjściowych JSON.

## `dispatch`

```bash
openclaw workboard dispatch
openclaw workboard dispatch --json
openclaw workboard dispatch --max-starts 10
openclaw workboard dispatch --admin
openclaw workboard dispatch --url http://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
```

`dispatch` najpierw wywołuje metodę RPC `workboard.cards.dispatch` działającego Gatewaya, która używa tego samego środowiska wykonawczego subagentów co czynność wysyłania na pulpicie, dzięki czemu gotowe karty stają się śledzonymi zadaniami uruchomieniami procesów roboczych z powiązanymi kluczami sesji. `--max-starts` używa addytywnej metody `workboard.cards.dispatchWithOptions`, aby starszy Gateway odrzucił opcję przed uruchomieniem jakichkolwiek procesów roboczych; przed użyciem flagi po aktualizacji należy ponownie uruchomić Gateway. Karty z przypisanym agentem używają kluczy sesji subagenta ograniczonych do agenta; nieprzypisane karty zachowują klucz subagenta bez takiego ograniczenia, dzięki czemu skonfigurowany domyślny agent Gatewaya zostaje zachowany.

Pętla wysyłania:

1. Przenosi elementy podrzędne z gotowymi zależnościami do `ready`.
2. Blokuje wygasłe przejęcia lub uruchomienia procesów roboczych, które przekroczyły limit czasu.
3. Rejestruje metadane wysyłania na gotowych kartach.
4. Wybiera niewielką partię nieprzejętych gotowych kart.
5. Przejmuje każdą wybraną kartę dla dyspozytora lub przypisanego agenta.
6. Uruchamia subagenta roboczego z ograniczonym kontekstem karty i tokenem przejęcia karty.
7. Zapisuje na karcie identyfikator uruchomienia procesu roboczego, klucz sesji, powiązanie z zadaniem, gdy zgłosi je rejestr zadań Gatewaya, status wykonania oraz dziennik procesu roboczego.

Wybór jest zachowawczy: pojedyncze wysłanie domyślnie uruchamia najwyżej trzy procesy robocze, pomija zarchiwizowane lub już przejęte karty i w jednym przebiegu uruchamia tylko jedną kartę na właściciela lub agenta. Karty należące już do aktywnej pracy w toku lub przeglądzie pozostają do późniejszego wysłania. Aby zmienić limit na przebieg, należy przekazać `--max-starts <count>` z dodatnią liczbą całkowitą; reguła jednej karty na właściciela nadal obowiązuje, więc rzeczywista liczba uruchomień może być niższa.

Jeśli uruchomienie procesu roboczego nie powiedzie się po przejęciu karty, Workboard blokuje tę kartę, usuwa przejęcie i rejestruje błąd w metadanych wykonania karty oraz dziennika procesu roboczego, dzięki czemu nieudane uruchomienia pozostają widoczne zamiast po cichu zwracać kartę do kolejki.

Jeśli nie podano jawnego celu Gatewaya, a lokalny Gateway jest niedostępny lub nie udostępnia jeszcze metody wysyłania Workboard, CLI przechodzi na wysyłanie wyłącznie danych względem lokalnego stanu Workboard. Wysyłanie wyłącznie danych nadal może promować zależności, usuwać nieaktualne przejęcia i blokować uruchomienia, które przekroczyły limit czasu, ale nie uruchamia procesów roboczych. Błędy uwierzytelniania, uprawnień i walidacji oraz błędy jawnego celu `--url` lub `--token` są zgłaszane bezpośrednio zamiast uruchamiania mechanizmu rezerwowego.

Tekst wyjściowy zgłasza uruchomienia procesów roboczych:

```text
wysyłanie zakończone: uruchomiono=2 błędy=0
```

Dane wyjściowe mechanizmu rezerwowego są jednoznaczne:

```text
gateway niedostępny; tylko wysyłanie danych: przeniesiono=1 zablokowano=0
```

Dane wyjściowe JSON zawierają wynik wysyłania. Wysyłanie obsługiwane przez Gateway może zawierać `started` i `startFailures`; mechanizm rezerwowy działający wyłącznie na danych zawiera `gatewayUnavailable: true`. Tokeny przejęcia są redagowane w danych wyjściowych JSON karty.

Na pulpicie ten sam wynik wysyłania jest wyświetlany jako krótkie podsumowanie, dzięki czemu operator może bez otwierania szczegółów karty zobaczyć, ile kart uruchomiono, przeniesiono, zablokowano, odzyskano lub zakończono błędem.

## Zgodność poleceń ukośnikowych

Kanały obsługujące polecenia mogą używać odpowiadającego polecenia ukośnikowego:

```text
/workboard list
/workboard show 7f4a2c10
/workboard create Napraw nieaktualny Heartbeat procesu roboczego
/workboard move 7f4a2c10 --status review
/workboard dispatch
```

Wysyłanie za pomocą polecenia ukośnikowego również używa środowiska wykonawczego subagentów Gatewaya, więc stosuje takie same zasady przejmowania, uruchamiania procesów roboczych i obsługi błędów jak ścieżka Gatewaya w pulpicie i CLI.

`/workboard list` i `/workboard show` są poleceniami odczytu dla autoryzowanych nadawców poleceń. `/workboard create`, `/workboard move` i `/workboard dispatch` modyfikują stan tablicy i wymagają statusu właściciela w interfejsach czatu albo klienta Gatewaya z `operator.write` lub `operator.admin`.

## Uprawnienia

Ścieżka wysyłania CLI zwykle żąda zakresów Gatewaya `operator.write` i `operator.read`. Karty powiązane z obszarem roboczym są uruchamiane bezpośrednio w dokładnie skonfigurowanym obszarze roboczym agenta; żądanie drzewa roboczego jest zawężane do tego katalogu zamiast zezwalać hostowi na materializację kodu kontrolowanego przez repozytorium. Wybrany proces roboczy musi mieć zapisywalny, niewspółdzielony dostęp do piaskownicy Docker dokładnie dla tego obszaru roboczego, aktywny skrót kontenera zgodny z wymaganymi punktami montowania i zasadami oraz nie może mieć możliwości wydostania się na hosta. Należy przekazać `--admin`, aby jawnie zażądać `operator.admin`, zezwolić na inne pobranie repozytorium na hoście i użyć standardowej konfiguracji zarządzanego drzewa roboczego; połączenie nie powiedzie się, jeśli ten zakres nie zostanie zatwierdzony dla klienta. Token Gatewaya tylko do odczytu może sprawdzać dane Workboard za pomocą metod odczytu, ale nie może tworzyć kart ani wysyłać procesów roboczych. Poza tym ograniczenia obszaru roboczego nie zmieniają ręcznego przenoszenia kart przez wywołujących mających uprawnienie do modyfikowania Workboard.

Lokalne polecenia `list`, `create`, `show` i `move` działają na lokalnym katalogu stanu OpenClaw używanym przez bieżący profil. Gdy potrzebny jest inny katalog główny stanu, należy użyć `--dev` lub `--profile <name>` w poleceniu najwyższego poziomu `openclaw`.

## Rozwiązywanie problemów

### Nie pojawiają się żadne karty

Należy potwierdzić, że plugin jest włączony dla tego samego profilu i katalogu głównego stanu:

```bash
openclaw plugins inspect workboard --runtime --json
```

Jeśli pulpit pokazuje karty, ale CLI ich nie pokazuje, należy sprawdzić, czy oba polecenia używają tego samego ustawienia `--dev` lub `--profile`.

### Wysyłanie zgłasza tryb wyłącznie danych

Należy uruchomić lub ponownie uruchomić Gateway:

```bash
openclaw gateway restart
openclaw gateway status --deep
```

Następnie należy ponowić `openclaw workboard dispatch`. Mechanizm rezerwowy działający wyłącznie na danych jest przydatny do czyszczenia stanu lokalnego, ale uruchomienia procesów roboczych wymagają aktywnego Gatewaya.

### Wysyłanie niczego nie uruchamia

Należy sprawdzić, czy istnieje co najmniej jedna karta `ready` bez aktywnego przejęcia:

```bash
openclaw workboard list --status ready
```

Karty mogą być również pomijane, gdy ten sam właściciel ma już pracę w toku lub w przeglądzie. Należy przenieść ukończoną pracę do `done`, zwolnić nieaktualne przejęcia za pomocą narzędzi Workboard albo ponownie uruchomić wysyłanie po zakończeniu pracy przez aktywny proces roboczy.

## Powiązane materiały

- [Plugin Workboard](/pl/plugins/workboard)
- [Dokumentacja CLI](/pl/cli)
- [Polecenia ukośnikowe](/pl/tools/slash-commands)
- [Control UI](/pl/web/control-ui)
