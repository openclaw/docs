---
doc-schema-version: 1
read_when:
    - Chcesz, aby OpenClaw utrzymywał jeden cel widoczny przez całą długą sesję
    - Musisz wstrzymać, wznowić, zablokować, ukończyć lub wyczyścić cel sesji
    - Chcesz zrozumieć narzędzia get_goal, create_goal i update_goal
    - Chcesz zobaczyć, jak cele pojawiają się w TUI
summary: 'Cele sesji: trwałe cele na sesję, kontrolki /goal, narzędzia celów modelu, budżety tokenów i status TUI'
title: Cel
x-i18n:
    generated_at: "2026-06-27T18:27:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4313983dff7f37496f6c996303cace75f6863a71c8a9cd5367fdafbcc3f459c4
    source_path: tools/goal.md
    workflow: 16
---

# Cel

**Cel** to jeden trwały zamiar przypięty do bieżącej sesji OpenClaw.
Daje agentowi i operatorowi wspólny punkt odniesienia dla długotrwałej pracy,
bez przekształcania go w zadanie w tle, przypomnienie, zadanie cron ani
stałe polecenie.

Cele są stanem sesji. Przenoszą się wraz z kluczem sesji, przetrwają ponowne
uruchomienie procesu, pojawiają się w `/goal`, są dostępne dla modelu przez
narzędzia celu i są widoczne w stopce TUI, gdy aktywna sesja ma cel.

## Szybki start

Ustaw cel:

```text
/goal start get CI green for PR 87469 and push the fix
```

Sprawdź go:

```text
/goal
```

Wstrzymaj go, gdy praca celowo czeka:

```text
/goal pause waiting for CI
```

Wznów go:

```text
/goal resume
```

Oznacz jako ukończony:

```text
/goal complete pushed and verified
```

Wyczyść go:

```text
/goal clear
```

## Do czego służą cele

Użyj celu, gdy sesja ma konkretny wynik, który powinien pozostać widoczny
przez wiele tur:

- Domknięcie PR: napraw, zweryfikuj, uruchom autoreview, wypchnij oraz otwórz lub zaktualizuj PR.
- Przebieg debugowania: odtwórz błąd, wskaż odpowiedzialny obszar, popraw go i udowodnij
  naprawę.
- Przejście przez dokumentację: przeczytaj odpowiednią dokumentację, napisz nową stronę, dodaj linki krzyżowe i
  zweryfikuj kompilację dokumentacji.
- Zadanie utrzymaniowe: sprawdź bieżący stan, wprowadź ograniczone zmiany, uruchom właściwe
  kontrole i zgłoś, co się zmieniło.

Cel nie jest kolejką zadań. Użyj [Przepływu zadań](/pl/automation/taskflow),
[zadań](/pl/automation/tasks), [zadań cron](/pl/automation/cron-jobs) lub
[stałych poleceń](/pl/automation/standing-orders), gdy praca ma działać odłączona,
powtarzać się według harmonogramu, rozgałęziać się na zarządzane podprace albo utrzymywać się jako zasada.

## Dokumentacja poleceń

`/goal` bez argumentów wypisuje podsumowanie bieżącego celu:

```text
Goal
Status: active
Objective: get CI green for PR 87469 and push the fix
Tokens used: 12k
Token budget: 12k/50k

Commands: /goal pause, /goal complete, /goal clear
```

Polecenia:

- `/goal` lub `/goal status` pokazuje bieżący cel.
- `/goal start <objective>` tworzy nowy cel dla bieżącej sesji.
- `/goal set <objective>` i `/goal create <objective>` są aliasami
  `start`.
- `/goal pause [note]` wstrzymuje aktywny cel.
- `/goal resume [note]` wznawia cel wstrzymany, zablokowany, ograniczony użyciem albo
  ograniczony budżetem.
- `/goal complete [note]` oznacza cel jako osiągnięty.
- `/goal done [note]` jest aliasem `complete`.
- `/goal block [note]` oznacza cel jako zablokowany.
- `/goal blocked [note]` jest aliasem `block`.
- `/goal clear` usuwa cel z sesji.

W sesji może istnieć tylko jeden cel naraz. Rozpoczęcie drugiego celu kończy się niepowodzeniem,
dopóki bieżący nie zostanie wyczyszczony.

## Statusy

Cele używają małego zestawu statusów:

- `active`: sesja realizuje cel.
- `paused`: operator wstrzymał cel; `/goal resume` ponownie go aktywuje.
- `blocked`: agent lub operator zgłosił rzeczywistą blokadę; `/goal resume`
  ponownie go aktywuje, gdy będą dostępne nowe informacje lub nowy stan.
- `budget_limited`: skonfigurowany budżet tokenów został osiągnięty; `/goal resume`
  wznawia realizację tego samego zamiaru.
- `usage_limited`: zarezerwowane dla stanów zatrzymania z powodu limitów użycia; `/goal resume`
  wznawia realizację, gdy jest dozwolona.
- `complete`: cel został osiągnięty. Ukończone cele są terminalne; użyj
  `/goal clear` przed rozpoczęciem kolejnego celu.

`/new` i `/reset` czyszczą cel bieżącej sesji, ponieważ celowo
rozpoczynają świeży kontekst sesji.

## Budżety tokenów

Cele mogą mieć opcjonalny dodatni budżet tokenów. Budżet jest przechowywany z
celem i mierzony od świeżej liczby tokenów sesji w chwili utworzenia. Jeśli
bieżąca sesja ma tylko nieaktualne lub nieznane użycie tokenów, gdy cel startuje,
OpenClaw czeka na następną świeżą migawkę tokenów sesji i używa jej jako
punktu bazowego, więc tokeny wydane przed istnieniem celu nie są doliczane do celu.

Gdy użycie tokenów osiągnie budżet, cel zmienia się na `budget_limited`. To
nie usuwa celu ani nie kasuje zamiaru. Informuje operatora i
agenta, że cel nie jest już aktywnie realizowany, dopóki nie zostanie wznowiony lub
wyczyszczony.

Budżety tokenów są zabezpieczeniem celu sesji, a nie limitem rozliczeniowym. Limity dostawcy,
raportowanie kosztów i zachowanie okna kontekstu nadal używają normalnych
kontroli użycia i modelu OpenClaw.

## Narzędzia modelu

OpenClaw udostępnia harnessom agentów trzy podstawowe narzędzia celu:

- `get_goal`: odczytuje cel bieżącej sesji, w tym status, zamiar, użycie
  tokenów i budżet tokenów.
- `create_goal`: tworzy cel tylko wtedy, gdy instrukcje użytkownika, systemowe lub deweloperskie
  jawnie o to proszą. Kończy się niepowodzeniem, jeśli sesja ma już
  cel.
- `update_goal`: oznacza cel jako `complete` albo `blocked`.

Model nie może po cichu wstrzymać, wznowić, wyczyścić ani zastąpić celu. To są
kontrole operatora/sesji przez `/goal` i polecenia resetowania. Dzięki temu
agent nie przesuwa po cichu celu, zachowując czystą ścieżkę dla
agenta do zgłoszenia osiągnięcia albo rzeczywistej blokady.

Narzędzie `update_goal` powinno oznaczyć cel jako `complete` tylko wtedy, gdy zamiar jest
faktycznie osiągnięty. Powinno oznaczyć cel jako `blocked` tylko wtedy, gdy ten sam warunek
blokujący się powtórzył, a agent nie może poczynić znaczącego postępu bez
nowych danych od użytkownika albo zmiany stanu zewnętrznego.

## TUI

TUI utrzymuje cel aktywnej sesji widoczny w stopce obok
agenta, sesji, modelu, kontrolek uruchomienia i liczników tokenów.

Przykłady stopki:

- `Pursuing goal (12k/50k)` dla aktywnego celu z budżetem tokenów.
- `Goal paused (/goal resume)` dla wstrzymanego celu.
- `Goal blocked (/goal resume)` dla zablokowanego celu.
- `Goal hit usage limits (/goal resume)` dla celu ograniczonego użyciem.
- `Goal unmet (50k/50k)` dla celu ograniczonego budżetem.
- `Goal achieved (42k)` dla ukończonego celu.

Stopka jest celowo zwięzła. Użyj `/goal`, aby zobaczyć pełny zamiar, notatkę,
budżet tokenów i dostępne polecenia.

## Zachowanie kanałów

Polecenie `/goal` działa w sesjach OpenClaw obsługujących polecenia, w tym w
TUI i powierzchniach czatu, które pozwalają na polecenia tekstowe. Stan celu jest przypięty do
klucza sesji, a nie do transportu. Jeśli dwie powierzchnie używają tej samej sesji, widzą
ten sam cel.

Stan celu nie jest dyrektywą dostarczania. Nie wymusza odpowiedzi przez
kanał, nie zmienia zachowania kolejki, nie zatwierdza narzędzi ani nie planuje pracy.

## Rozwiązywanie problemów

`Goal error: goal already exists` oznacza, że sesja ma już cel. Użyj
`/goal`, aby go sprawdzić, `/goal complete`, jeśli jest wykonany, albo `/goal clear` przed
rozpoczęciem innego zamiaru.

`Goal error: goal not found` oznacza, że sesja nie ma jeszcze celu. Rozpocznij go poleceniem
`/goal start <objective>`.

`Goal error: goal is already complete` oznacza, że cel jest terminalny. Wyczyść go
przed rozpoczęciem lub wznowieniem innego zamiaru.

Jeśli użycie tokenów wygląda jak `0` albo jest nieaktualne, aktywna sesja może jeszcze nie mieć świeżej
migawki tokenów. Użycie odświeża się, gdy OpenClaw zapisuje użycie sesji i
sumy pochodzące z transkrypcji.

## Powiązane

- [Polecenia ukośnikowe](/pl/tools/slash-commands)
- [TUI](/pl/web/tui)
- [Narzędzie sesji](/pl/concepts/session-tool)
- [Compaction](/pl/concepts/compaction)
- [Przepływ zadań](/pl/automation/taskflow)
- [Stałe polecenia](/pl/automation/standing-orders)
