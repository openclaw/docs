---
read_when:
    - Kierujesz czaty grupowe do dedykowanych agentów
    - Chcesz równoległej pracy bez jednego długiego zadania blokującego każdy czat
    - Projektujesz wieloagentową konfigurację operacyjną
sidebarTitle: Specialist lanes
status: active
summary: Uruchamiaj równoległych agentów specjalistycznych bez przeciążania współdzielonej przepustowości modelu i narzędzi
title: Równoległe ścieżki specjalistyczne
x-i18n:
    generated_at: "2026-05-10T19:33:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8721056fbe08822ac92d4bc14c8c2b0977e93eaa58c2849f83b3c0f310992f93
    source_path: concepts/parallel-specialist-lanes.md
    workflow: 16
    postprocess_version: locale-links-v1
---

Równoległe tory specjalistyczne pozwalają jednemu Gateway kierować różne czaty lub pokoje do
różnych agentów, zachowując przy tym szybką obsługę użytkownika. Sztuka polega na traktowaniu
równoległości jako problemu projektowania z ograniczonymi zasobami, a nie tylko jako „więcej agentów”.

## Pierwsze zasady

Tor specjalistyczny poprawia przepustowość tylko wtedy, gdy zmniejsza rywalizację o
rzeczywiste wąskie gardła:

- **Blokady sesji**: tylko jedno uruchomienie powinno jednocześnie modyfikować daną sesję.
- **Globalna przepustowość modelu**: wszystkie widoczne uruchomienia czatu nadal współdzielą limity dostawcy.
- **Przepustowość narzędzi**: praca z powłoką, przeglądarką, siecią i repozytorium może być wolniejsza
  niż sama tura modelu.
- **Budżet kontekstu**: długie transkrypty spowalniają każdą przyszłą turę i zmniejszają jej
  koncentrację.
- **Niejasność własności**: zduplikowani agenci wykonujący tę samą pracę marnują przepustowość.

OpenClaw już szereguje uruchomienia w ramach sesji i ogranicza globalną równoległość przez
[kolejkę poleceń](/pl/concepts/queue). Tory specjalistyczne dodają na to politykę:
który agent jest właścicielem której pracy, co zostaje w czacie, a co staje się pracą w tle.

## Zalecane wdrożenie

### Faza 1: kontrakty torów + ciężka praca w tle

Nadaj każdemu torowi pisemny kontrakt w jego przestrzeni roboczej i prompcie systemowym:

- **Cel**: praca, za którą odpowiada ten tor.
- **Poza zakresem**: praca, którą powinien przekazać dalej zamiast próbować wykonać.
- **Budżet czatu**: szybkie odpowiedzi zostają w czacie; długie zadania powinny zostać krótko
  potwierdzone, a następnie uruchomione w subagencie lub zadaniu w tle.
- **Reguła przekazania**: gdy inny tor jest właścicielem pracy, powiedz, dokąd powinna trafić, i
  podaj zwięzłe podsumowanie przekazania.
- **Reguła ryzyka narzędzi**: preferuj najmniejszą powierzchnię narzędziową, która może wykonać zadanie.

To najtańsza faza i rozwiązuje większość zatorów: jedno zadanie programistyczne nie zamienia już
toru badawczego w melasę, a każdy czat utrzymuje własny kontekst w czystości.

### Faza 2: priorytet i kontrola współbieżności

Dostrój kolejkę i przepustowość modelu wokół wartości biznesowej każdego toru:

```json5
{
  agents: {
    defaults: {
      maxConcurrent: 4,
      subagents: { maxConcurrent: 8, delegationMode: "prefer" },
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

Używaj bezpośrednich/prywatnych czatów i agentów operacji produkcyjnych do pracy o wysokim priorytecie. Pozwól,
aby badania, szkicowanie i wsadowe programowanie przechodziły do zadań w tle, gdy system jest
zajęty.

### Faza 3: koordynator / kontroler ruchu

Dodaj mały wzorzec koordynatora, gdy aktywnych jest już wiele torów:

- Śledź aktywne zadania torów i ich właścicieli.
- Wykrywaj zduplikowane żądania w różnych grupach.
- Przekazuj podsumowania między torami.
- Pokazuj tylko blokery, ukończone wyniki i decyzje, które musi podjąć człowiek.

Nie zaczynaj od tego. Koordynator bez kontraktów torów tylko koordynuje chaos.

## Minimalny szablon kontraktu toru

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
- [Subagenci](/pl/tools/subagents)
