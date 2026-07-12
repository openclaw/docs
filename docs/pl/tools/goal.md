---
doc-schema-version: 1
read_when:
    - Chcesz, aby OpenClaw utrzymywał jeden cel widoczny przez całą długą sesję
    - Musisz wstrzymać, wznowić, zablokować, ukończyć lub wyczyścić cel sesji
    - Chcesz zrozumieć narzędzia get_goal, create_goal i update_goal
    - Chcesz zobaczyć, jak cele są wyświetlane w TUI
summary: 'Cele sesji: trwałe cele dla poszczególnych sesji, elementy sterujące `/goal`, narzędzia modelu do obsługi celów, budżety tokenów i stan TUI'
title: Cel
x-i18n:
    generated_at: "2026-07-12T15:39:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 046356770522dc8a5584a59f3322b4502554a4b7f129b074da633861050ee5fd
    source_path: tools/goal.md
    workflow: 16
---

# Cel

**Cel** to jeden trwały zamiar przypisany do bieżącej sesji OpenClaw.
Zapewnia agentowi i operatorowi wspólny punkt docelowy dla długotrwałej pracy,
bez przekształcania go w zadanie działające w tle, przypomnienie, zadanie Cron ani
stałe zlecenie.

Cele są stanem sesji: są powiązane z kluczem sesji, zachowują się po ponownym
uruchomieniu procesu i pojawiają się w `/goal`, narzędziach celów dostępnych
dla modelu oraz w stopce TUI.

## Szybki start

```text
/goal start doprowadź CI do stanu poprawnego dla PR 87469 i wypchnij poprawkę
/goal
/goal edit doprowadź CI do stanu poprawnego dla PR 87469, wypchnij poprawkę i zaktualizuj dokumentację
/goal pause oczekiwanie na CI
/goal resume
/goal complete wypchnięto i zweryfikowano
/goal clear
```

`start` jest opcjonalne: `/goal doprowadź CI do stanu poprawnego dla PR 87469`
również tworzy cel, ponieważ każdy tekst po `/goal`, który nie jest rozpoznanym
słowem akcji, jest traktowany jako nowy zamiar.

## Do czego służą cele

Użyj celu, gdy sesja ma konkretny rezultat, który powinien pozostawać widoczny
przez wiele tur:

- Finalizacja PR: poprawienie, zweryfikowanie, automatyczny przegląd, wypchnięcie
  oraz otwarcie lub zaktualizowanie PR.
- Sesja debugowania: odtworzenie błędu, zidentyfikowanie odpowiedzialnego obszaru,
  wprowadzenie poprawki i potwierdzenie jej działania.
- Prace nad dokumentacją: przeczytanie odpowiedniej dokumentacji, napisanie nowej
  strony, dodanie odsyłaczy i zweryfikowanie kompilacji dokumentacji.
- Zadanie konserwacyjne: sprawdzenie bieżącego stanu, wprowadzenie ograniczonych
  zmian, uruchomienie odpowiednich kontroli i opisanie zmian.

Cel nie jest kolejką zadań. Użyj [Task Flow](/pl/automation/taskflow),
[zadań](/pl/automation/tasks), [zadań Cron](/pl/automation/cron-jobs) lub
[stałych zleceń](/pl/automation/standing-orders), gdy praca ma działać niezależnie,
powtarzać się zgodnie z harmonogramem, rozdzielać się na zarządzane podzadania
lub być utrwalona jako zasada.

## Dokumentacja poleceń

`/goal` bez argumentów wyświetla podsumowanie bieżącego celu:

```text
Cel
Stan: aktywny
Zamiar: doprowadź CI do stanu poprawnego dla PR 87469 i wypchnij poprawkę
Użyte tokeny: 12k
Budżet tokenów: 12k/50k

Polecenia: /goal edit <zamiar>, /goal pause, /goal complete, /goal clear
```

| Polecenie                                           | Działanie                                                                       |
| --------------------------------------------------- | ------------------------------------------------------------------------------- |
| `/goal` lub `/goal status`                          | Wyświetla bieżący cel.                                                          |
| `/goal start <objective>`                           | Tworzy nowy cel dla bieżącej sesji.                                             |
| `/goal set <objective>`, `/goal create <objective>` | Aliasy polecenia `start`.                                                       |
| `/goal <objective>`                                 | Również tworzy nowy cel (dowolny tekst, który nie jest rozpoznanym słowem akcji). |
| `/goal edit <objective>`                            | Zmienia sformułowanie bieżącego zamiaru; stan i rozliczenie tokenów pozostają bez zmian. |
| `/goal pause [note]`                                | Wstrzymuje aktywny cel.                                                         |
| `/goal resume [note]`                               | Wznawia cel wstrzymany, zablokowany albo ograniczony użyciem lub budżetem.      |
| `/goal complete [note]`                             | Oznacza cel jako osiągnięty.                                                    |
| `/goal done [note]`                                 | Alias polecenia `complete`.                                                     |
| `/goal block [note]`                                | Oznacza cel jako zablokowany.                                                   |
| `/goal blocked [note]`                              | Alias polecenia `block`.                                                        |
| `/goal clear`                                       | Usuwa cel z sesji.                                                              |

W danej sesji może istnieć tylko jeden cel naraz. Próba rozpoczęcia drugiego
celu kończy się błędem `Goal error: goal already exists`, dopóki bieżący cel
nie zostanie usunięty.

`/goal start` nie przyjmuje flagi budżetu tokenów; budżet można ustawić wyłącznie
za pomocą dostępnego dla modelu narzędzia `create_goal`.

## Stany

- `active`: sesja dąży do osiągnięcia celu.
- `paused`: operator wstrzymał cel; `/goal resume` ponownie go aktywuje.
- `blocked`: agent lub operator zgłosił rzeczywistą przeszkodę; `/goal resume`
  ponownie aktywuje cel, gdy pojawią się nowe informacje lub zmieni się stan.
- `budget_limited`: skonfigurowany budżet tokenów został wyczerpany; `/goal resume`
  wznawia dążenie do tego samego zamiaru z nowym oknem budżetu.
- `usage_limited`: stan zarezerwowany na potrzeby przyszłego zatrzymania z powodu
  limitu użycia; `/goal resume` wznawia dążenie w ten sam sposób.
- `complete`: cel został osiągnięty. Ukończone cele są stanem końcowym; przed
  rozpoczęciem kolejnego celu użyj `/goal clear`.

`/new` i `/reset` usuwają bieżący cel sesji, ponieważ celowo rozpoczynają nowy
kontekst sesji.

## Budżety tokenów

Cele mogą mieć opcjonalny dodatni budżet tokenów, ustawiany za pomocą parametru
`token_budget` narzędzia `create_goal`. Budżet jest mierzony od aktualnej liczby
tokenów sesji w chwili utworzenia celu. Jeśli podczas rozpoczynania celu sesja
ma jedynie nieaktualny lub nieznany stan tokenów, OpenClaw czeka na kolejny
aktualny stan i używa go jako wartości bazowej, dzięki czemu tokeny wykorzystane
przed utworzeniem celu nie są do niego zaliczane.

Gdy użycie osiągnie budżet, cel przechodzi do stanu `budget_limited`. Nie usuwa
to celu ani zamiaru; informuje operatora i agenta, że cel nie jest już aktywnie
realizowany, dopóki nie zostanie wznowiony lub usunięty. Wznowienie rozpoczyna
nowe okno budżetu od bieżącej aktualnej liczby tokenów.

Budżety tokenów są zabezpieczeniem celu sesji, a nie limitem rozliczeniowym.
Limity dostawcy, raportowanie kosztów i działanie okna kontekstu nadal korzystają
ze standardowych mechanizmów użycia i sterowania modelem w OpenClaw.

## Narzędzia modelu

OpenClaw udostępnia środowiskom agentów trzy narzędzia celów:

| Narzędzie     | Przeznaczenie                                                                                                            |
| ------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `get_goal`    | Odczytuje bieżący cel sesji: stan, zamiar, użycie tokenów i budżet tokenów.                                               |
| `create_goal` | Tworzy cel tylko wtedy, gdy użytkownik lub instrukcje systemowe wyraźnie tego wymagają. Zwraca błąd, jeśli sesja ma już cel. |
| `update_goal` | Oznacza cel jako `complete` lub `blocked`.                                                                               |

Model nie może niejawnie wstrzymać, wznowić, usunąć ani zastąpić celu. Operacje
te pozostają mechanizmami sterowania operatora i sesji dostępnymi przez `/goal`
oraz polecenia resetowania, dzięki czemu agent może zgłosić osiągnięcie celu lub
rzeczywistą przeszkodę bez potajemnej zmiany zamiaru.

`update_goal` powinno oznaczyć cel jako `complete` tylko wtedy, gdy zamiar został
rzeczywiście osiągnięty. Powinno oznaczyć cel jako `blocked` dopiero wtedy, gdy
ta sama przeszkoda wystąpi w co najmniej trzech kolejnych turach celu, a nie
z powodu zwykłych trudności lub braku ostatecznych poprawek.

## Kontekst celu w każdej turze

Każda tura użytkownika lub czatu z aktywnym celem zawiera następujący wiersz
kontekstu w roli użytkownika:

```text
Aktywny cel: <zamiar> — realizuj go lub zaktualizuj jego stan (get_goal/update_goal).
```

OpenClaw zachowuje zwięzłość wiersza, skracając długie zamiary. Cele wstrzymane,
zablokowane, ograniczone budżetem lub użyciem oraz ukończone nie są wstawiane,
dzięki czemu zatrzymanie przez operatora obowiązuje do czasu wznowienia celu.

## Interfejs sterowania

Internetowy interfejs sterowania wyświetla cel jako zwartą etykietę nad polem
tworzenia wiadomości czatu: ikonę stanu, etykietę stanu (na przykład
`Realizowanie celu`), skrócony zamiar oraz aktualizowany na żywo licznik czasu.

Etykieta zawiera wbudowane elementy sterujące:

- **Ołówek** wstępnie wypełnia pole tworzenia wiadomości tekstem
  `/goal edit <objective>`, aby można było przeformułować i przesłać zamiar.
- **Wstrzymaj / wznów** przełącza między `/goal pause` i `/goal resume`
  zależnie od bieżącego stanu.
- **Kosz** wysyła `/goal clear`.
- **Szewron** rozwija etykietę, aby wyświetlić pełny zamiar, najnowszą notatkę
  o stanie, użycie tokenów i czas, który upłynął.

Przyciski akcji są ukryte, gdy pole tworzenia wiadomości nie może wysyłać
(na przykład gdy połączenie z Gateway jest niedostępne); szewron rozwijania
nadal działa.

## TUI

Stopka TUI wyświetla cel aktywnej sesji obok pól agenta, sesji i modelu, przed
wskaźnikami tokenów i trybu.

Przykłady stopek:

- `Realizowanie celu (12k/50k)` dla aktywnego celu z budżetem tokenów.
- `Cel wstrzymany (/goal resume)` dla wstrzymanego celu.
- `Cel zablokowany (/goal resume)` dla zablokowanego celu.
- `Cel osiągnął limity użycia (/goal resume)` dla celu ograniczonego użyciem.
- `Cel niezrealizowany (50k/50k)` dla celu ograniczonego budżetem.
- `Cel osiągnięty (42k)` dla ukończonego celu.

Stopka jest celowo zwięzła. Użyj `/goal`, aby wyświetlić pełny zamiar, notatkę,
budżet tokenów i dostępne polecenia.

## Działanie w kanałach

`/goal` działa w sesjach OpenClaw obsługujących polecenia, w tym w TUI oraz
interfejsach czatu, które zezwalają na polecenia tekstowe. Stan celu jest
przypisany do klucza sesji, a nie do mechanizmu transportowego, dlatego dwa
interfejsy współdzielące klucz sesji widzą ten sam cel.

Stan celu nie jest dyrektywą dostarczania: nie wymusza odpowiedzi przez kanał,
nie zmienia działania kolejki, nie zatwierdza narzędzi ani nie planuje pracy.

## Rozwiązywanie problemów

| Komunikat                              | Znaczenie                                                                                                                                   |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `Goal error: goal already exists`      | Sesja ma już cel. Użyj `/goal`, aby go sprawdzić, `/goal complete`, jeśli został osiągnięty, lub `/goal clear` przed rozpoczęciem innego zamiaru. |
| `Goal error: goal not found`           | Sesja nie ma jeszcze celu. Rozpocznij go za pomocą `/goal start <objective>`.                                                               |
| `Goal error: goal is already complete` | Cel jest w stanie końcowym. Usuń go przed rozpoczęciem lub wznowieniem innego zamiaru.                                                       |

Jeśli użycie tokenów wynosi `0` lub wygląda na nieaktualne, aktywna sesja może
jeszcze nie mieć aktualnego stanu tokenów. Użycie jest odświeżane, gdy OpenClaw
rejestruje użycie sesji i sumy wyprowadzone z transkrypcji.

## Powiązane

- [Polecenia z ukośnikiem](/pl/tools/slash-commands)
- [TUI](/pl/web/tui)
- [Narzędzie sesji](/pl/concepts/session-tool)
- [Compaction](/pl/concepts/compaction)
- [Task Flow](/pl/automation/taskflow)
- [Stałe zlecenia](/pl/automation/standing-orders)
