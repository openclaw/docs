---
read_when:
    - Chcesz przeglądać lub tworzyć karty Workboard z poziomu terminala
    - Chcesz uruchamiać zadania wykonawcze Workboard z poziomu CLI
    - Debugujesz działanie Workboard CLI lub poleceń z ukośnikiem
summary: Dokumentacja CLI dotycząca kart `openclaw workboard`, przydzielania i uruchomień procesów roboczych
title: CLI Workboard
x-i18n:
    generated_at: "2026-07-12T14:56:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3c62dd10aff146cae9f7475423148cf61fedb39983b065a9815c629349b4e233
    source_path: cli/workboard.md
    workflow: 16
---

`openclaw workboard` to interfejs terminalowy dołączonego [Pluginu Workboard](/pl/plugins/workboard). Umożliwia operatorowi wyświetlanie listy kart, tworzenie karty, sprawdzanie pojedynczej karty oraz zlecanie działającemu Gatewayowi przekazywania gotowych zadań do wykonań subagentów roboczych.

Przed użyciem polecenia włącz Plugin:

```bash
openclaw plugins enable workboard
openclaw gateway restart
```

## Użycie

```bash
openclaw workboard list [--board <id>] [--status <status>] [--include-archived] [--json]
openclaw workboard create <title...> [--notes <text>] [--status <status>] [--priority <priority>] [--agent <id>] [--board <id>] [--labels <items>] [--json]
openclaw workboard show <id> [--json]
openclaw workboard dispatch [--url <url>] [--token <token>] [--timeout <ms>] [--json]
```

Polecenie odczytuje i zapisuje tę samą bazę danych SQLite należącą do Pluginu, której używają panel oraz narzędzia agenta Workboard. Identyfikatory kart są UUID; polecenia przyjmujące identyfikator karty akceptują również jego jednoznaczny prefiks (zwięzły format tekstowy wyświetla pierwszych 8 znaków).

Prawidłowe wartości `status`: `triage`, `backlog`, `todo`, `scheduled`, `ready`, `running`, `review`, `blocked`, `done`. Prawidłowe wartości `priority`: `low`, `normal`, `high`, `urgent`.

## `list`

```bash
openclaw workboard list
openclaw workboard list --board default --status ready
openclaw workboard list --json
```

Format tekstowy jest zwięzły:

```text
7f4a2c10  ready     high    default agent-a  Fix stale worker heartbeat
```

Kolumny zawierają prefiks identyfikatora, status, priorytet, identyfikator tablicy, opcjonalny identyfikator agenta oraz tytuł.

| Flaga                | Przeznaczenie                                              |
| -------------------- | ---------------------------------------------------------- |
| `--board <id>`       | Ogranicza wyniki do przestrzeni nazw jednej tablicy         |
| `--status <status>`  | Ogranicza wyniki do jednego statusu Workboard               |
| `--include-archived` | Uwzględnia zarchiwizowane karty w zwięzłym formacie tekstowym |
| `--json`             | Wyświetla pełną listę kart jako dane JSON do przetwarzania maszynowego |

Zwięzły format tekstowy domyślnie ukrywa zarchiwizowane karty, dzięki czemu CLI zachowuje się tak samo jak `/workboard list`. Aby je wyświetlić, przekaż `--include-archived`. Dane wyjściowe JSON zawsze zawierają pełną listę kart, w tym karty zarchiwizowane, aby zachować zgodność z istniejącymi automatyzacjami.

## `create`

```bash
openclaw workboard create "Fix stale worker heartbeat" --priority high --labels bug,workboard
openclaw workboard create "Write Workboard docs" --status ready --agent docs-agent --board docs --notes "Cover CLI, slash command, dispatch, and SQLite state."
```

| Flaga                   | Przeznaczenie                                      |
| ----------------------- | -------------------------------------------------- |
| `--notes <text>`        | Początkowe notatki karty                            |
| `--status <status>`     | Początkowy status, domyślnie `todo`                 |
| `--priority <priority>` | Priorytet, domyślnie `normal`                       |
| `--agent <id>`          | Przypisuje kartę do agenta lub identyfikatora właściciela |
| `--board <id>`          | Zapisuje kartę w przestrzeni nazw tablicy           |
| `--labels <items>`      | Etykiety rozdzielone przecinkami                    |
| `--json`                | Wyświetla utworzoną kartę jako dane JSON do przetwarzania maszynowego |

`create` zapisuje dane bezpośrednio w stanie SQLite Workboard. Karta jest natychmiast widoczna na karcie Workboard w interfejsie Control UI oraz dla narzędzi Workboard.

## `show`

```bash
openclaw workboard show 7f4a2c10
openclaw workboard show 7f4a2c10 --json
```

Format tekstowy wyświetla zwięzły wiersz karty i notatki. Format JSON zwraca pełny rekord karty, w tym metadane wykonania, próby, komentarze, odnośniki, dowody, artefakty, dzienniki procesów roboczych, stan protokołu, diagnostykę i metadane automatyzacji.

## `dispatch`

```bash
openclaw workboard dispatch
openclaw workboard dispatch --json
openclaw workboard dispatch --url http://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
```

`dispatch` najpierw wywołuje metodę RPC `workboard.cards.dispatch` działającego Gatewaya, która korzysta z tego samego środowiska uruchomieniowego subagentów co akcja przekazywania w panelu. Dzięki temu gotowe karty stają się śledzonymi zadaniami wykonań roboczych z powiązanymi kluczami sesji. Karty z przypisanym agentem używają kluczy sesji subagenta ograniczonych do tego agenta; karty bez przypisania zachowują klucz subagenta bez określonego zakresu, co pozwala zachować domyślnego agenta skonfigurowanego w Gatewayu.

Pętla przekazywania:

1. Przenosi zadania podrzędne z gotowymi zależnościami do stanu `ready`.
2. Blokuje wygasłe rezerwacje lub wykonania robocze, które przekroczyły limit czasu.
3. Zapisuje metadane przekazania na gotowych kartach.
4. Wybiera niewielką partię nieobjętych rezerwacją gotowych kart.
5. Rezerwuje każdą wybraną kartę dla procesu przekazującego lub przypisanego agenta.
6. Uruchamia wykonanie subagenta roboczego z ograniczonym kontekstem karty i tokenem rezerwacji karty.
7. Zapisuje na karcie identyfikator wykonania roboczego, klucz sesji, powiązanie z zadaniem, gdy zgłosi je rejestr zadań Gatewaya, status wykonania oraz dziennik procesu roboczego.

Wybór jest zachowawczy: pojedyncze przekazanie domyślnie uruchamia najwyżej trzy procesy robocze, pomija karty zarchiwizowane lub już objęte rezerwacją i w jednym przebiegu uruchamia tylko jedną kartę na właściciela lub agenta. Karty należące już do aktywnych zadań w toku lub przeglądzie pozostają do późniejszego przekazania.

Jeśli uruchomienie procesu roboczego nie powiedzie się po zarezerwowaniu karty, Workboard blokuje tę kartę, usuwa rezerwację i zapisuje błąd w metadanych wykonania karty oraz dziennika procesu roboczego. Dzięki temu nieudane uruchomienia pozostają widoczne, zamiast po cichu przywracać kartę do kolejki.

Jeśli nie podano jawnego celu Gatewaya, a lokalny Gateway jest niedostępny lub nie udostępnia jeszcze metody przekazywania Workboard, CLI przechodzi na przekazywanie wyłącznie danych względem lokalnego stanu Workboard. Przekazywanie wyłącznie danych nadal może przenosić zadania z gotowymi zależnościami, usuwać nieaktualne rezerwacje i blokować wykonania, które przekroczyły limit czasu, ale nie uruchamia procesów roboczych. Błędy uwierzytelniania, uprawnień i walidacji, a także błędy dotyczące jawnie określonego celu `--url` lub `--token`, są zgłaszane bezpośrednio zamiast uruchamiania trybu zastępczego.

Format tekstowy zgłasza uruchomienia procesów roboczych:

```text
dispatch complete: started=2 failures=0
```

Komunikat trybu zastępczego jest jednoznaczny:

```text
gateway unavailable; data dispatch only: promoted=1 blocked=0
```

Format JSON zawiera wynik przekazania. Przekazywanie obsługiwane przez Gateway może zawierać pola `started` i `startFailures`; tryb zastępczy obejmujący wyłącznie dane zawiera `gatewayUnavailable: true`. Tokeny rezerwacji są maskowane w danych JSON karty.

W panelu ten sam wynik przekazania jest przedstawiany jako krótkie podsumowanie, dzięki czemu operator może zobaczyć, ile kart uruchomiono, przeniesiono do kolejnego stanu, zablokowano, ponownie zarezerwowano lub zakończono niepowodzeniem, bez otwierania szczegółów kart.

## Zgodność z poleceniem ukośnikowym

Kanały obsługujące polecenia mogą używać odpowiadającego polecenia ukośnikowego:

```text
/workboard list
/workboard show 7f4a2c10
/workboard create Fix stale worker heartbeat
/workboard dispatch
```

Przekazywanie za pomocą polecenia ukośnikowego również korzysta ze środowiska uruchomieniowego subagentów Gatewaya, dlatego rezerwowanie, uruchamianie procesów roboczych i obsługa błędów działają tak samo jak w panelu oraz ścieżce Gatewaya używanej przez CLI.

`/workboard list` i `/workboard show` to polecenia odczytu dla upoważnionych nadawców poleceń. `/workboard create` i `/workboard dispatch` modyfikują stan tablicy i wymagają statusu właściciela w interfejsach czatu albo klienta Gatewaya z uprawnieniem `operator.write` lub `operator.admin`.

## Uprawnienia

Ścieżka przekazywania CLI wywołuje RPC Gatewaya z zakresami `operator.read` i `operator.write`. Token Gatewaya tylko do odczytu może przeglądać dane Workboard za pomocą metod odczytu, ale nie może tworzyć kart ani przekazywać zadań procesom roboczym.

Lokalne polecenia `list`, `create` i `show` działają na lokalnym katalogu stanu OpenClaw używanym przez bieżący profil. Jeśli potrzebujesz innego katalogu głównego stanu, użyj `--dev` lub `--profile <name>` w poleceniu najwyższego poziomu `openclaw`.

## Rozwiązywanie problemów

### Nie pojawiają się żadne karty

Potwierdź, że Plugin jest włączony dla tego samego profilu i katalogu głównego stanu:

```bash
openclaw plugins inspect workboard --runtime --json
```

Jeśli panel wyświetla karty, ale CLI ich nie pokazuje, sprawdź, czy oba polecenia używają tego samego ustawienia `--dev` lub `--profile`.

### Przekazywanie zgłasza tryb wyłącznie danych

Uruchom lub ponownie uruchom Gateway:

```bash
openclaw gateway restart
openclaw gateway status --deep
```

Następnie ponów `openclaw workboard dispatch`. Tryb zastępczy obejmujący wyłącznie dane jest przydatny do porządkowania stanu lokalnego, ale wykonania robocze wymagają działającego Gatewaya.

### Przekazywanie niczego nie uruchamia

Sprawdź, czy istnieje co najmniej jedna karta `ready` bez aktywnej rezerwacji:

```bash
openclaw workboard list --status ready
```

Karty mogą być również pomijane, jeśli ten sam właściciel ma już zadania w toku lub w przeglądzie. Przenieś ukończone zadania do stanu `done`, zwolnij nieaktualne rezerwacje za pomocą narzędzi Workboard albo ponów przekazywanie po zakończeniu działania aktywnego procesu roboczego.

## Powiązane materiały

- [Plugin Workboard](/pl/plugins/workboard)
- [Dokumentacja CLI](/pl/cli)
- [Polecenia ukośnikowe](/pl/tools/slash-commands)
- [Control UI](/pl/web/control-ui)
