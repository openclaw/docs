---
read_when:
    - Rozszerzanie qa-lab lub qa-channel
    - Dodawanie scenariuszy QA wspieranych przez repozytorium
    - Budowanie bardziej realistycznej automatyzacji QA wokół panelu Gateway
summary: Prywatna struktura automatyzacji QA dla qa-lab, qa-channel, scenariuszy seedowanych i raportów protokołu
title: Automatyzacja QA E2E
x-i18n:
    generated_at: "2026-04-08T06:00:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 57da147dc06abf9620290104e01a83b42182db1806514114fd9e8467492cda99
    source_path: concepts/qa-e2e-automation.md
    workflow: 15
---

# Automatyzacja QA E2E

Prywatny stos QA ma na celu testowanie OpenClaw w bardziej realistyczny,
ukształtowany przez kanały sposób, niż może to zrobić pojedynczy test jednostkowy.

Obecne elementy:

- `extensions/qa-channel`: syntetyczny kanał wiadomości z powierzchniami DM, kanału, wątku,
  reakcji, edycji i usuwania.
- `extensions/qa-lab`: interfejs debugowania i magistrala QA do obserwowania transkryptu,
  wstrzykiwania wiadomości przychodzących oraz eksportowania raportu Markdown.
- `qa/`: zasoby seedowane wspierane przez repozytorium dla zadania startowego i bazowych
  scenariuszy QA.

Obecny przepływ pracy operatora QA to dwupanelowa strona QA:

- Po lewej: panel Gateway (Control UI) z agentem.
- Po prawej: QA Lab, pokazujące transkrypt w stylu Slacka i plan scenariusza.

Uruchom to za pomocą:

```bash
pnpm qa:lab:up
```

To buduje stronę QA, uruchamia ścieżkę gateway opartą na Dockerze i udostępnia
stronę QA Lab, na której operator lub pętla automatyzacji może przydzielić agentowi misję QA,
obserwować rzeczywiste zachowanie kanału oraz zapisywać, co zadziałało, co się nie udało lub
co pozostało zablokowane.

Aby szybciej iterować nad interfejsem QA Lab bez przebudowywania obrazu Dockera za każdym razem,
uruchom stos z bind-montowanym bundtem QA Lab:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` utrzymuje usługi Docker na wstępnie zbudowanym obrazie i bind-montuje
`extensions/qa-lab/web/dist` do kontenera `qa-lab`. `qa:lab:watch`
przebudowuje ten bundel przy zmianach, a przeglądarka automatycznie przeładowuje się, gdy hash zasobu QA Lab się zmieni.

## Zasoby seedowane wspierane przez repozytorium

Zasoby seedowane znajdują się w `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/*.md`

Są one celowo przechowywane w git, aby plan QA był widoczny zarówno dla ludzi, jak i dla
agenta. Lista bazowa powinna pozostać na tyle szeroka, aby obejmować:

- czat DM i kanałowy
- zachowanie wątków
- cykl życia akcji wiadomości
- wywołania cron
- przywoływanie pamięci
- przełączanie modeli
- przekazanie do subagenta
- odczyt repozytorium i dokumentacji
- jedno małe zadanie build, takie jak Lobster Invaders

## Raportowanie

`qa-lab` eksportuje raport protokołu Markdown na podstawie obserwowanej osi czasu magistrali.
Raport powinien odpowiadać na pytania:

- Co zadziałało
- Co się nie udało
- Co pozostało zablokowane
- Jakie scenariusze uzupełniające warto dodać

## Powiązane dokumenty

- [Testing](/pl/help/testing)
- [QA Channel](/pl/channels/qa-channel)
- [Dashboard](/web/dashboard)
