---
read_when:
    - Rozszerzasz qa-lab lub qa-channel
    - Dodajesz scenariusze QA oparte na repozytorium
    - Budujesz automatyzację QA o większym realizmie wokół dashboardu Gateway
summary: Kształt prywatnej automatyzacji QA dla qa-lab, qa-channel, scenariuszy seed i raportów protokołu
title: Automatyzacja QA E2E
x-i18n:
    generated_at: "2026-04-07T09:44:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: b68cfcfb50532dbda93ba62e1ed8dc6a7ddd4214cb1db8c9a84a7bc0b32b3060
    source_path: concepts/qa-e2e-automation.md
    workflow: 15
---

# Automatyzacja QA E2E

Prywatny stos QA ma testować OpenClaw w bardziej realistyczny,
kanałowy sposób niż pojedynczy test jednostkowy.

Obecne elementy:

- `extensions/qa-channel`: syntetyczny kanał wiadomości z powierzchniami DM, kanału, wątku,
  reakcji, edycji i usuwania.
- `extensions/qa-lab`: interfejs debugowania i magistrala QA do obserwacji transkryptu,
  wstrzykiwania wiadomości przychodzących i eksportowania raportu Markdown.
- `qa/`: zasoby seed oparte na repozytorium dla zadania startowego i bazowych scenariuszy QA.

Obecny przepływ pracy operatora QA to dwupanelowa witryna QA:

- Po lewej: dashboard Gateway (Control UI) z agentem.
- Po prawej: QA Lab, pokazujący transkrypt w stylu Slack i plan scenariusza.

Uruchom ją poleceniem:

```bash
pnpm qa:lab:up
```

To buduje witrynę QA, uruchamia obsługiwaną przez Docker ścieżkę gateway i udostępnia
stronę QA Lab, na której operator lub pętla automatyzacji może dać agentowi misję
QA, obserwować rzeczywiste zachowanie kanału oraz rejestrować, co działało, co się nie powiodło
i co pozostało zablokowane.

Aby szybciej iterować nad interfejsem QA Lab bez przebudowywania obrazu Dockera za każdym razem,
uruchom stos z bind-mountowanym bundle QA Lab:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` utrzymuje usługi Dockera na wcześniej zbudowanym obrazie i bind-mountuje
`extensions/qa-lab/web/dist` do kontenera `qa-lab`. `qa:lab:watch`
przebudowuje ten bundle po zmianach, a przeglądarka automatycznie się przeładowuje, gdy hash zasobów QA Lab się zmieni.

## Seedy oparte na repozytorium

Zasoby seed znajdują się w `qa/`:

- `qa/QA_KICKOFF_TASK.md`
- `qa/seed-scenarios.json`

Celowo znajdują się one w git, aby plan QA był widoczny zarówno dla ludzi, jak i dla
agenta. Lista bazowa powinna pozostać wystarczająco szeroka, aby obejmować:

- czat DM i kanałowy
- zachowanie wątków
- cykl życia akcji na wiadomościach
- wywołania zwrotne cron
- przywoływanie pamięci
- przełączanie modeli
- przekazanie do subagenta
- odczyt repozytorium i dokumentacji
- jedno małe zadanie build, takie jak Lobster Invaders

## Raportowanie

`qa-lab` eksportuje raport protokołu Markdown na podstawie obserwowanej osi czasu magistrali.
Raport powinien odpowiadać na pytania:

- Co działało
- Co się nie powiodło
- Co pozostało zablokowane
- Jakie scenariusze uzupełniające warto dodać

## Powiązana dokumentacja

- [Testowanie](/pl/help/testing)
- [QA Channel](/pl/channels/qa-channel)
- [Dashboard](/web/dashboard)
