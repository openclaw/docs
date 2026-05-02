---
read_when:
    - Kierujesz czaty grupowe do dedykowanych agentów
    - Chcesz pracy równoległej bez blokowania każdego czatu przez jedno długie zadanie
    - Projektujesz konfigurację operacyjną dla wielu agentów
sidebarTitle: Specialist lanes
status: active
summary: Uruchamiaj równoległych wyspecjalizowanych agentów bez zapychania współdzielonej przepustowości modeli i narzędzi
title: Równoległe ścieżki specjalistyczne
x-i18n:
    generated_at: "2026-05-02T20:43:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: b09f10ce4fbd79954a7196fbedb23f9b3f34b459b98eb7a5480f7eeb0bb6be98
    source_path: concepts/parallel-specialist-lanes.md
    workflow: 16
---

Równoległe ścieżki specjalistyczne pozwalają jednemu Gateway kierować różne czaty lub pokoje do
różnych agentów, jednocześnie utrzymując szybką obsługę użytkownika. Sztuka polega na traktowaniu
równoległości jako problemu projektowania pod kątem ograniczonych zasobów, a nie tylko jako „więcej agentów”.

## Podstawowe zasady

Ścieżka specjalistyczna poprawia przepustowość tylko wtedy, gdy zmniejsza rywalizację o
rzeczywiste wąskie gardła:

- **Blokady sesji**: tylko jedno uruchomienie powinno modyfikować daną sesję naraz.
- **Globalna pojemność modelu**: wszystkie widoczne uruchomienia czatów nadal współdzielą limity dostawcy.
- **Pojemność narzędzi**: praca w powłoce, przeglądarce, sieci i repozytorium może być wolniejsza
  niż sama tura modelu.
- **Budżet kontekstu**: długie transkrypty spowalniają każdą przyszłą turę i zmniejszają jej
  skupienie.
- **Niejasność własności**: zduplikowani agenci wykonujący tę samą pracę marnują pojemność.

OpenClaw już serializuje uruchomienia na sesję i ogranicza globalną równoległość przez
[kolejkę poleceń](/pl/concepts/queue). Ścieżki specjalistyczne dodają na to warstwę zasad:
który agent odpowiada za którą pracę, co pozostaje w czacie, a co staje się pracą w tle.

## Zalecane wdrożenie

### Faza 1: kontrakty ścieżek + ciężka praca w tle

Daj każdej ścieżce pisemny kontrakt w jej obszarze roboczym i prompcie systemowym:

- **Cel**: praca, za którą ta ścieżka odpowiada.
- **Poza zakresem**: praca, którą powinna przekazać zamiast wykonywać samodzielnie.
- **Budżet czatu**: szybkie odpowiedzi pozostają w czacie; długie zadania powinny być krótko
  potwierdzone, a następnie uruchomione w tle przez podagenta lub zadanie.
- **Zasada przekazania**: gdy inna ścieżka odpowiada za pracę, powiedz, dokąd powinna trafić, i
  podaj zwięzłe podsumowanie przekazania.
- **Zasada ryzyka narzędzi**: preferuj najmniejszą powierzchnię narzędzi, która może wykonać zadanie.

To najtańsza faza i rozwiązuje większość zatorów: jedno zadanie programistyczne nie zamienia już
ścieżki badawczej w melasę, a każdy czat utrzymuje własny kontekst w czystości.

### Faza 2: priorytety i kontrola współbieżności

Dostrój kolejkę i pojemność modelu wokół wartości biznesowej każdej ścieżki:

```json5
{
  agents: {
    defaults: {
      maxConcurrent: 4,
      subagents: { maxConcurrent: 8 },
    },
  },
  messages: {
    queue: {
      mode: "collect",
      debounceMs: 1000,
      cap: 20,
      drop: "summarize",
    },
  },
}
```

Używaj bezpośrednich/prywatnych czatów oraz agentów operacji produkcyjnych do pracy o wysokim priorytecie. Pozwól,
aby badania, redagowanie i wsadowe programowanie przechodziły do zadań w tle, gdy system jest
zajęty.

### Faza 3: koordynator / kontroler ruchu

Dodaj mały wzorzec koordynatora, gdy wiele ścieżek jest już aktywnych:

- Śledź aktywne zadania ścieżek i właścicieli.
- Wykrywaj zduplikowane prośby w grupach.
- Kieruj podsumowania przekazań między ścieżkami.
- Pokazuj tylko blokady, ukończone wyniki i decyzje, które musi podjąć człowiek.

Nie zaczynaj od tego. Koordynator bez kontraktów ścieżek tylko koordynuje chaos.

## Minimalny szablon kontraktu ścieżki

```md
# Lane contract

## Owns

- <job this lane is responsible for>

## Does not own

- <work to hand off>

## Chat budget

- Answer quick questions directly.
- For multi-step, slow, or tool-heavy work: acknowledge briefly, spawn/background
  the work, then return the result when complete.

## Handoff

If another lane owns the request, reply with:

- target lane
- objective
- relevant context
- exact next action

## Tool posture

Use the smallest tool surface that can complete the task. Avoid broad shell or
network work unless this lane explicitly owns it.
```

## Powiązane

- [Routing wieloagentowy](/pl/concepts/multi-agent)
- [Kolejka poleceń](/pl/concepts/queue)
- [Podagenci](/pl/tools/subagents)
