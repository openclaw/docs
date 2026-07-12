---
read_when:
    - Kierujesz czaty grupowe do dedykowanych agentów
    - Chcesz wykonywać zadania równolegle, aby jedno długie zadanie nie blokowało wszystkich czatów
    - Projektujesz konfigurację operacyjną systemu wieloagentowego
sidebarTitle: Specialist lanes
status: active
summary: Uruchamiaj równolegle wyspecjalizowane agenty bez blokowania współdzielonej przepustowości modelu i narzędzi
title: Równoległe ścieżki specjalistyczne
x-i18n:
    generated_at: "2026-07-12T15:04:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 09852b6cf5a790e98fb5e0805b0df57b2f3719b1387ecfacfb4973bb6841abb4
    source_path: concepts/parallel-specialist-lanes.md
    workflow: 16
---

Równoległe wyspecjalizowane ścieżki umożliwiają jednemu Gateway kierowanie różnych czatów lub pokojów do
różnych agentów przy zachowaniu szybkiej obsługi użytkownika. Traktuj równoległość jako
problem projektowania z uwzględnieniem ograniczonych zasobów, a nie tylko jako „więcej agentów”.

## Podstawowe zasady

Wyspecjalizowana ścieżka zwiększa przepustowość tylko wtedy, gdy zmniejsza rywalizację o
rzeczywiste wąskie gardła:

- **Blokady sesji**: tylko jedno uruchomienie powinno modyfikować daną sesję w danym momencie.
- **Globalna wydajność modelu**: wszystkie widoczne uruchomienia czatu nadal współdzielą limity dostawcy.
- **Wydajność narzędzi**: praca w powłoce, przeglądarce, sieci i repozytorium może być wolniejsza
  niż sama tura modelu.
- **Budżet kontekstu**: długie transkrypcje spowalniają każdą kolejną turę i zmniejszają
  jej ukierunkowanie.
- **Niejednoznaczność odpowiedzialności**: powielający się agenci wykonujący to samo zadanie marnują zasoby.

OpenClaw już serializuje uruchomienia w ramach każdej sesji i ogranicza globalną równoległość
za pomocą [kolejki poleceń](/pl/concepts/queue). Wyspecjalizowane ścieżki nakładają na to
zasady: który agent odpowiada za dane zadanie, co pozostaje na czacie, a co staje się
pracą w tle.

## Zalecane wdrażanie

### Faza 1: kontrakty ścieżek i wymagająca praca w tle

Nadaj każdej ścieżce pisemny kontrakt w jej obszarze roboczym i poleceniu systemowym:

- **Cel**: praca, za którą odpowiada ta ścieżka.
- **Zakres wykluczony**: praca, którą należy przekazać zamiast próbować ją wykonać.
- **Budżet czatu**: szybkie odpowiedzi pozostają na czacie; w przypadku długich zadań najpierw krótko
  potwierdź ich przyjęcie, a następnie uruchom je w podagencie lub zadaniu w tle.
- **Reguła przekazywania**: gdy za pracę odpowiada inna ścieżka, wskaż, dokąd należy ją przekazać,
  i podaj zwięzłe podsumowanie.
- **Reguła ryzyka narzędzi**: preferuj najmniejszy zestaw narzędzi, który pozwala wykonać zadanie.

To najtańsza faza, która usuwa większość zatorów: pojedyncze zadanie programistyczne nie
zamienia już ścieżki badawczej w ślimaka, a każdy czat zachowuje czysty
kontekst.

### Faza 2: sterowanie priorytetami i współbieżnością

Dostosuj kolejkę i wydajność modelu do wartości biznesowej każdej ścieżki:

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

Wykorzystuj czaty bezpośrednie i osobiste oraz agentów operacji produkcyjnych do pracy o wysokim priorytecie. Gdy
system jest obciążony, przenoś badania, redagowanie i wsadowe zadania programistyczne do zadań
w tle.

### Faza 3: koordynator / kontroler ruchu

Po uruchomieniu wielu ścieżek dodaj prosty wzorzec koordynatora:

- Śledź aktywne zadania ścieżek i ich właścicieli.
- Wykrywaj powielające się żądania w różnych grupach.
- Przekazuj podsumowania między ścieżkami.
- Pokazuj tylko blokady, ukończone wyniki i decyzje, które musi podjąć człowiek.

Nie zaczynaj od tego etapu. Koordynator bez kontraktów ścieżek jedynie koordynuje chaos.

## Minimalny szablon kontraktu ścieżki

```md
# Kontrakt ścieżki

## Zakres odpowiedzialności

- <zadanie, za które odpowiada ta ścieżka>

## Poza zakresem odpowiedzialności

- <praca do przekazania>

## Budżet czatu

- Odpowiadaj bezpośrednio na szybkie pytania.
- W przypadku pracy wieloetapowej, powolnej lub wymagającej intensywnego użycia narzędzi: krótko potwierdź jej przyjęcie, uruchom
  pracę w tle lub w podagencie, a następnie zwróć wynik po jej ukończeniu.

## Przekazywanie

Jeśli za żądanie odpowiada inna ścieżka, odpowiedz, podając:

- ścieżkę docelową
- cel
- istotny kontekst
- dokładną następną czynność

## Podejście do narzędzi

Używaj najmniejszego zestawu narzędzi, który pozwala wykonać zadanie. Unikaj szerokiego użycia powłoki lub
sieci, chyba że wyraźnie należy ono do zakresu odpowiedzialności tej ścieżki.
```

## Powiązane materiały

- [Kierowanie w systemie wieloagentowym](/pl/concepts/multi-agent)
- [Kolejka poleceń](/pl/concepts/queue)
- [Podagenci](/pl/tools/subagents)
