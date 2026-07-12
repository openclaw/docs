---
read_when:
    - Tworzenie lub reorganizowanie kart i widżetów przestrzeni roboczej
    - Umożliwianie agentowi tworzenia przestrzeni roboczej
    - Przegląd modelu zatwierdzania i piaskownicy widżetów niestandardowych
summary: Przestrzenie robocze komponowane przez agentów w interfejsie sterowania
title: Obszary robocze
x-i18n:
    generated_at: "2026-07-12T15:47:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 234baefc18be736599addeeb35f8404b617c1d8f07f058c4a02ec2615ca21aa0
    source_path: web/workspaces.md
    workflow: 16
---

Karta **Obszary robocze** w [interfejsie sterowania](/pl/web/control-ui) to przestrzeń, którą wspólnie organizujecie Ty i Twoi agenci. Karty, widżety, ich pozycje w 12-kolumnowej siatce oraz ich powiązania danych znajdują się w jednym dokumencie. Każdy, kto może edytować ten dokument, może komponować obszar roboczy: Ty, CLI `openclaw workspaces` lub agent wywołujący narzędzia `workspace_*`.

Każdy zapis przechodzi przez tę samą walidowaną ścieżkę, dlatego układ utworzony przez człowieka i układ utworzony przez agenta nie mogą się rozbiegać. Każdy zaakceptowany zapis zwiększa numer wersji i rozgłasza zdarzenie `plugin.workspaces.changed`, dzięki czemu zmiana agenta pojawia się w już otwartej przeglądarce bez ponownego ładowania.

## Włączanie obszarów roboczych

Dołączony Plugin Workspaces jest domyślnie wyłączony. W interfejsie sterowania otwórz **Plugins**, znajdź **Workspaces** i wybierz **Enable**. Możesz go również włączyć z poziomu CLI:

```sh
openclaw plugins enable workspaces
```

Włączenie Pluginu dodaje kartę **Obszary robocze** oraz udostępnia CLI `openclaw workspaces` i narzędzia agenta `workspace_*`. Wyłączenie go usuwa te interfejsy bez usuwania bazy danych obszarów roboczych ani zasobów widżetów.

## Domyślny obszar roboczy

Przy pierwszym uruchomieniu otrzymujesz obszar roboczy **Przegląd**: karty kosztów i tokenów, stan instancji, sesje, stan zadań Cron oraz kanał aktywności. Jest to zwykła zawartość obszaru roboczego — możesz ją przeciągać, zwijać, ukrywać lub usuwać.

## Wbudowane widżety

Wraz z Pluginem dostarczanych jest dziewięć zaufanych widżetów renderowanych jako natywny interfejs użytkownika:

`stat-card`, `markdown`, `table`, `iframe-embed`, `sessions`, `usage`, `cron`,
`instances`, `activity`.

Widżety deklarują dane za pomocą **powiązań** i nigdy nie pobierają ich samodzielnie:

| Powiązanie | Wynik rozwiązania                                                                                               |
| ---------- | --------------------------------------------------------------------------------------------------------------- |
| `static`   | Wartość literałowa przechowywana w dokumencie (maks. 8 KB).                                                     |
| `file`     | Plik JSON, Markdown lub CSV w katalogu `<stateDir>/workspaces/data/`, opcjonalnie zawężony za pomocą wskaźnika JSON. |
| `rpc`      | Jedna z metod Gateway tylko do odczytu, należących do stałej listy dozwolonych metod, rozwiązywana przez zaufany interfejs sterowania. |

Powiązanie `file` jest najprostszym sposobem na umieszczenie własnych wartości liczbowych w obszarze roboczym: zapisz plik JSON w katalogu danych i skieruj do niego widżet `stat-card`.

## Pochodzenie

Karty i widżety zawierają znacznik `createdBy` — `user`, `system` lub `agent:<id>` — ustawiany na podstawie tego, kto dokonał zapisu. Wywołujący nie może go podać, dlatego agent nie może oznaczyć swojej pracy jako Twojej, a plakietka „AI” na widżecie utworzonym przez agenta zawsze oznacza dokładnie to, co deklaruje.

## Niestandardowe widżety

Agent może utworzyć rzeczywisty widżet HTML za pomocą `workspace_widget_scaffold` (Ty również możesz to zrobić, używając `openclaw workspaces widget-scaffold <name>`). Kod utworzony przez agenta jest traktowany jako wrogi:

- Utworzony szkielet widżetu trafia do rejestru ze stanem **oczekujący**. Element iframe nie jest tworzony, a trasa zasobów zwraca dla jego plików błąd 404, dopóki operator go nie zatwierdzi.
- Zatwierdzenie jest decyzją odrębną od edycji układu: `workspaces.widget.approve` wymaga zakresu `operator.approvals`, tego samego, który chroni zatwierdzenia wykonywania poleceń.
- Zatwierdzony widżet jest renderowany w elemencie `<iframe sandbox="allow-scripts">` — nigdy z `allow-same-origin` — dzięki czemu jego źródło jest nieprzezroczyste i nie może on uzyskać dostępu do modelu DOM, pamięci ani plików cookie elementu nadrzędnego.
- Jego zasoby są udostępniane z dyrektywą `connect-src 'none'`, która blokuje komunikację sieciową skryptów, taką jak `fetch`, XHR i WebSockety. Widżet nie ma żadnych danych uwierzytelniających i nigdy nie komunikuje się z Gateway.
- Dane docierają do niego wyłącznie przez wersjonowany most `postMessage`. Kod niestandardowy może otrzymywać zadeklarowane powiązania `static`, które są wartościami obszaru roboczego utworzonymi wcześniej przez agenta lub operatora. Powiązania RPC i plikowe pozostają w zaufanych wbudowanych widżetach: przeglądarki pozwalają dziecku działającemu w piaskownicy na nawigowanie we własnej ramce, dlatego uprzywilejowane dane nigdy nie są przekazywane do kodu HTML utworzonego przez agenta.

Wysłanie polecenia do czatu z widżetu wymaga dodatkowo możliwości zadeklarowanej w manifeście, potwierdzenia przy każdym wywołaniu zawierającego dokładny tekst oraz podlega limitowi częstotliwości.

## CLI

```sh
openclaw workspaces tabs list
openclaw workspaces tabs create --title Financials
openclaw workspaces widget-scaffold revenue-chart --title "Revenue Chart"
openclaw workspaces widget-approve revenue-chart
```

Polecenie `widget-approve` wymaga urządzenia sparowanego z zakresem `operator.approvals`; zatwierdzanie z poziomu interfejsu sterowania tego nie wymaga, ponieważ przeglądarka już dysponuje tym zakresem.

## Przechowywanie

Dokument obszaru roboczego, rejestr niestandardowych widżetów oraz bufor cofania obejmujący 20 wpisów znajdują się w pliku `<stateDir>/workspaces/workspaces.sqlite`. Zasoby widżetów utworzone przez agenta pozostają na dysku w katalogu `<stateDir>/workspaces/widgets/<name>/`, a dane powiązań plikowych w katalogu `<stateDir>/workspaces/data/`, ponieważ agent tworzy je za pomocą zwykłych narzędzi plikowych, a trasa widżetu udostępnia ich bajty.
