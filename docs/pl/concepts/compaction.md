---
read_when:
    - Chcesz zrozumieć automatyczne Compaction i /compact
    - Debugujesz długie sesje, które osiągają limity kontekstu
summary: Jak OpenClaw streszcza długie rozmowy, aby zmieścić się w limitach modelu
title: Compaction
x-i18n:
    generated_at: "2026-05-02T09:47:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2f8e6f372508a0f5421654d3e2a694695eb8a7fda4e3928159bf8f08b2a2156b
    source_path: concepts/compaction.md
    workflow: 16
---

Każdy model ma okno kontekstu: maksymalną liczbę tokenów, które może przetworzyć. Gdy rozmowa zbliża się do tego limitu, OpenClaw wykonuje **Compaction** starszych wiadomości do podsumowania, aby czat mógł być kontynuowany.

## Jak to działa

1. Starsze tury rozmowy są podsumowywane w kompaktowym wpisie.
2. Podsumowanie jest zapisywane w transkrypcie sesji.
3. Ostatnie wiadomości pozostają nienaruszone.

Gdy OpenClaw dzieli historię na fragmenty Compaction, utrzymuje wywołania narzędzi asystenta sparowane z odpowiadającymi im wpisami `toolResult`. Jeśli punkt podziału wypada wewnątrz bloku narzędzia, OpenClaw przesuwa granicę, aby para pozostała razem, a bieżący niepodsumowany ogon został zachowany.

Pełna historia rozmowy pozostaje na dysku. Compaction zmienia tylko to, co model widzi w następnej turze.

## Automatyczne Compaction

Automatyczne Compaction jest domyślnie włączone. Uruchamia się, gdy sesja zbliża się do limitu kontekstu albo gdy model zwraca błąd przepełnienia kontekstu (w takim przypadku OpenClaw wykonuje Compaction i ponawia próbę).

Zobaczysz:

- `🧹 Auto-compaction complete` w trybie szczegółowym.
- `/status` pokazujące `🧹 Compactions: <count>`.

<Info>
Przed wykonaniem Compaction OpenClaw automatycznie przypomina agentowi, aby zapisał ważne notatki do plików [pamięci](/pl/concepts/memory). Zapobiega to utracie kontekstu.
</Info>

<AccordionGroup>
  <Accordion title="Rozpoznawane sygnatury przepełnienia">
    OpenClaw wykrywa przepełnienie kontekstu na podstawie tych wzorców błędów dostawcy:

    - `request_too_large`
    - `context length exceeded`
    - `input exceeds the maximum number of tokens`
    - `input token count exceeds the maximum number of input tokens`
    - `input is too long for the model`
    - `ollama error: context length exceeded`

  </Accordion>
</AccordionGroup>

## Ręczne Compaction

Wpisz `/compact` w dowolnym czacie, aby wymusić Compaction. Dodaj instrukcje, aby pokierować podsumowaniem:

```
/compact Focus on the API design decisions
```

Gdy ustawione jest `agents.defaults.compaction.keepRecentTokens`, ręczne Compaction respektuje ten punkt odcięcia Pi i zachowuje ostatni ogon w odbudowanym kontekście. Bez jawnego budżetu zachowania ręczne Compaction działa jak twardy punkt kontrolny i kontynuuje wyłącznie od nowego podsumowania.

## Konfiguracja

Skonfiguruj Compaction w sekcji `agents.defaults.compaction` w swoim `openclaw.json`. Najczęściej używane pokrętła wymieniono poniżej; pełny opis znajduje się w [Szczegółowym omówieniu zarządzania sesją](/pl/reference/session-management-compaction).

### Używanie innego modelu

Domyślnie Compaction używa głównego modelu agenta. Ustaw `agents.defaults.compaction.model`, aby przekazać podsumowywanie bardziej zaawansowanemu lub wyspecjalizowanemu modelowi. Nadpisanie przyjmuje dowolny ciąg `provider/model-id`:

```json
{
  "agents": {
    "defaults": {
      "compaction": {
        "model": "openrouter/anthropic/claude-sonnet-4-6"
      }
    }
  }
}
```

Działa to także z modelami lokalnymi, na przykład z drugim modelem Ollama przeznaczonym do podsumowywania:

```json
{
  "agents": {
    "defaults": {
      "compaction": {
        "model": "ollama/llama3.1:8b"
      }
    }
  }
}
```

Gdy nie jest ustawione, Compaction zaczyna od aktywnego modelu sesji. Jeśli podsumowywanie zakończy się błędem dostawcy kwalifikującym się do awaryjnego wyboru modelu, OpenClaw ponawia tę próbę Compaction przez istniejący łańcuch awaryjnych modeli sesji. Wybór awaryjny jest tymczasowy i nie jest zapisywany z powrotem do stanu sesji. Jawne nadpisanie `agents.defaults.compaction.model` pozostaje dokładne i nie dziedziczy łańcucha awaryjnego sesji.

### Zachowanie identyfikatorów

Podsumowywanie Compaction domyślnie zachowuje nieprzezroczyste identyfikatory (`identifierPolicy: "strict"`). Nadpisz za pomocą `identifierPolicy: "off"`, aby wyłączyć, albo `identifierPolicy: "custom"` oraz `identifierInstructions`, aby podać własne wskazówki.

### Ochrona bajtów aktywnego transkryptu

Gdy ustawione jest `agents.defaults.compaction.maxActiveTranscriptBytes`, OpenClaw uruchamia zwykłe lokalne Compaction przed przebiegiem, jeśli aktywny JSONL osiągnie ten rozmiar. Jest to przydatne w długotrwałych sesjach, w których zarządzanie kontekstem po stronie dostawcy może utrzymywać kontekst modelu w dobrym stanie, podczas gdy lokalny transkrypt nadal rośnie. Nie dzieli surowych bajtów JSONL; prosi zwykły potok Compaction o utworzenie semantycznego podsumowania.

<Warning>
Ochrona bajtów wymaga `truncateAfterCompaction: true`. Bez rotacji transkryptu aktywny plik nie zmniejszyłby się, a ochrona pozostałaby nieaktywna.
</Warning>

### Transkrypty następcze

Gdy `agents.defaults.compaction.truncateAfterCompaction` jest włączone, OpenClaw nie przepisuje istniejącego transkryptu w miejscu. Tworzy nowy aktywny transkrypt następczy z podsumowania Compaction, zachowanego stanu i niepodsumowanego ogona, a następnie zachowuje poprzedni JSONL jako zarchiwizowane źródło punktu kontrolnego.
Transkrypty następcze usuwają także dokładne duplikaty długich tur użytkownika, które pojawiają się
w krótkim oknie ponowień, dzięki czemu burze ponowień kanału nie są przenoszone do
następnego aktywnego transkryptu po Compaction.

Punkty kontrolne sprzed Compaction są zachowywane tylko wtedy, gdy pozostają poniżej limitu
rozmiaru punktu kontrolnego OpenClaw; zbyt duże aktywne transkrypty nadal przechodzą Compaction, ale OpenClaw
pomija dużą migawkę debugowania zamiast podwajać użycie dysku.

### Powiadomienia o Compaction

Domyślnie Compaction działa cicho. Ustaw `notifyUser`, aby pokazywać krótkie komunikaty statusu, gdy Compaction się zaczyna i kończy:

```json5
{
  agents: {
    defaults: {
      compaction: {
        notifyUser: true,
      },
    },
  },
}
```

### Zrzut pamięci

Przed Compaction OpenClaw może uruchomić turę **cichego zrzutu pamięci**, aby zapisać trwałe notatki na dysku. Ustaw `agents.defaults.compaction.memoryFlush.model`, gdy ta tura porządkowa powinna używać modelu lokalnego zamiast aktywnego modelu rozmowy:

```json
{
  "agents": {
    "defaults": {
      "compaction": {
        "memoryFlush": {
          "model": "ollama/qwen3:8b"
        }
      }
    }
  }
}
```

Nadpisanie modelu zrzutu pamięci jest dokładne i nie dziedziczy łańcucha awaryjnego aktywnej sesji. Szczegóły i konfigurację znajdziesz w [Pamięci](/pl/concepts/memory).

## Wymienni dostawcy Compaction

Pluginy mogą rejestrować niestandardowego dostawcę Compaction za pomocą `registerCompactionProvider()` w API Pluginu. Gdy dostawca jest zarejestrowany i skonfigurowany, OpenClaw deleguje do niego podsumowywanie zamiast używać wbudowanego potoku LLM.

Aby użyć zarejestrowanego dostawcy, ustaw jego identyfikator w konfiguracji:

```json
{
  "agents": {
    "defaults": {
      "compaction": {
        "provider": "my-provider"
      }
    }
  }
}
```

Ustawienie `provider` automatycznie wymusza `mode: "safeguard"`. Dostawcy otrzymują te same instrukcje Compaction i zasady zachowania identyfikatorów co wbudowana ścieżka, a OpenClaw nadal zachowuje kontekst sufiksu ostatnich tur i podzielonych tur po wyniku dostawcy.

<Note>
Jeśli dostawca zawiedzie lub zwróci pusty wynik, OpenClaw wraca do wbudowanego podsumowywania LLM.
</Note>

## Compaction a przycinanie

|                  | Compaction                    | Przycinanie                          |
| ---------------- | ----------------------------- | -------------------------------- |
| **Co robi** | Podsumowuje starszą rozmowę | Przycina stare wyniki narzędzi           |
| **Zapisane?**       | Tak (w transkrypcie sesji)   | Nie (tylko w pamięci, na żądanie) |
| **Zakres**        | Cała rozmowa           | Tylko wyniki narzędzi                |

[Przycinanie sesji](/pl/concepts/session-pruning) to lżejsze uzupełnienie, które przycina wynik narzędzi bez podsumowywania.

## Rozwiązywanie problemów

**Compaction wykonywane zbyt często?** Okno kontekstu modelu może być małe albo wyniki narzędzi mogą być duże. Spróbuj włączyć [przycinanie sesji](/pl/concepts/session-pruning).

**Kontekst wydaje się nieaktualny po Compaction?** Użyj `/compact Focus on <topic>`, aby pokierować podsumowaniem, albo włącz [zrzut pamięci](/pl/concepts/memory), aby notatki przetrwały.

**Potrzebujesz czystego startu?** `/new` rozpoczyna nową sesję bez wykonywania Compaction.

Zaawansowaną konfigurację (tokeny rezerwowe, zachowanie identyfikatorów, niestandardowe silniki kontekstu, Compaction po stronie serwera OpenAI) znajdziesz w [Szczegółowym omówieniu zarządzania sesją](/pl/reference/session-management-compaction).

## Powiązane

- [Sesja](/pl/concepts/session): zarządzanie sesją i cykl życia.
- [Przycinanie sesji](/pl/concepts/session-pruning): przycinanie wyników narzędzi.
- [Kontekst](/pl/concepts/context): jak budowany jest kontekst dla tur agenta.
- [Hooki](/pl/automation/hooks): hooki cyklu życia Compaction (`before_compaction`, `after_compaction`).
