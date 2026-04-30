---
read_when:
    - Chcesz zrozumieć automatyczną kompakcję i /compact
    - Debugujesz długie sesje, które osiągają limity kontekstu
summary: Jak OpenClaw podsumowuje długie rozmowy, aby mieścić się w limitach modelu
title: Compaction
x-i18n:
    generated_at: "2026-04-30T09:46:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9beac513a8226a7dd107cdc3a7bfd7550d87e98648004c80487db968c57742d4
    source_path: concepts/compaction.md
    workflow: 16
---

Każdy model ma okno kontekstu: maksymalną liczbę tokenów, które może przetworzyć. Gdy rozmowa zbliża się do tego limitu, OpenClaw **kompaktuje** starsze wiadomości w podsumowanie, aby czat mógł być kontynuowany.

## Jak to działa

1. Starsze tury rozmowy są streszczane do zwartego wpisu.
2. Podsumowanie jest zapisywane w transkrypcie sesji.
3. Ostatnie wiadomości pozostają nienaruszone.

Gdy OpenClaw dzieli historię na fragmenty kompaktowania, zachowuje wywołania narzędzi asystenta sparowane z odpowiadającymi im wpisami `toolResult`. Jeśli punkt podziału wypada wewnątrz bloku narzędzia, OpenClaw przesuwa granicę, aby para pozostała razem, a bieżący niestreszczony ogon został zachowany.

Pełna historia rozmowy pozostaje na dysku. Kompaktowanie zmienia tylko to, co model widzi w następnej turze.

## Automatyczne kompaktowanie

Automatyczne kompaktowanie jest domyślnie włączone. Uruchamia się, gdy sesja zbliża się do limitu kontekstu albo gdy model zwróci błąd przepełnienia kontekstu (w takim przypadku OpenClaw kompaktuje i ponawia próbę).

Zobaczysz:

- `🧹 Auto-compaction complete` w trybie szczegółowym.
- `/status` pokazujące `🧹 Compactions: <count>`.

<Info>
Przed kompaktowaniem OpenClaw automatycznie przypomina agentowi, aby zapisał ważne notatki w plikach [pamięci](/pl/concepts/memory). Zapobiega to utracie kontekstu.
</Info>

<AccordionGroup>
  <Accordion title="Rozpoznawane sygnatury przepełnienia">
    OpenClaw wykrywa przepełnienie kontekstu na podstawie tych wzorców błędów dostawców:

    - `request_too_large`
    - `context length exceeded`
    - `input exceeds the maximum number of tokens`
    - `input token count exceeds the maximum number of input tokens`
    - `input is too long for the model`
    - `ollama error: context length exceeded`

  </Accordion>
</AccordionGroup>

## Ręczne kompaktowanie

Wpisz `/compact` w dowolnym czacie, aby wymusić kompaktowanie. Dodaj instrukcje, aby ukierunkować podsumowanie:

```
/compact Focus on the API design decisions
```

Gdy ustawiono `agents.defaults.compaction.keepRecentTokens`, ręczne kompaktowanie respektuje ten punkt odcięcia Pi i zachowuje ostatni ogon w odbudowanym kontekście. Bez jawnego budżetu zachowania ręczne kompaktowanie działa jak twardy punkt kontrolny i kontynuuje wyłącznie od nowego podsumowania.

## Konfiguracja

Skonfiguruj kompaktowanie w `agents.defaults.compaction` w swoim `openclaw.json`. Najczęstsze opcje wymieniono poniżej; pełną dokumentację znajdziesz w sekcji [Szczegółowe omówienie zarządzania sesją](/pl/reference/session-management-compaction).

### Używanie innego modelu

Domyślnie kompaktowanie używa głównego modelu agenta. Ustaw `agents.defaults.compaction.model`, aby delegować streszczanie do bardziej wydajnego lub wyspecjalizowanego modelu. Nadpisanie akceptuje dowolny ciąg `provider/model-id`:

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

Działa to także z modelami lokalnymi, na przykład z drugim modelem Ollama przeznaczonym do streszczania:

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

Gdy nie ustawiono tej opcji, kompaktowanie używa głównego modelu agenta.

### Zachowywanie identyfikatorów

Streszczanie podczas kompaktowania domyślnie zachowuje nieprzezroczyste identyfikatory (`identifierPolicy: "strict"`). Nadpisz za pomocą `identifierPolicy: "off"`, aby wyłączyć, albo `identifierPolicy: "custom"` oraz `identifierInstructions`, aby podać własne wskazówki.

### Ochrona bajtów aktywnego transkryptu

Gdy ustawiono `agents.defaults.compaction.maxActiveTranscriptBytes`, OpenClaw uruchamia normalne lokalne kompaktowanie przed wykonaniem, jeśli aktywny JSONL osiągnie ten rozmiar. Jest to przydatne w długotrwałych sesjach, w których zarządzanie kontekstem po stronie dostawcy może utrzymywać kontekst modelu w dobrej kondycji, podczas gdy lokalny transkrypt nadal rośnie. Nie dzieli surowych bajtów JSONL; prosi normalny potok kompaktowania o utworzenie semantycznego podsumowania.

<Warning>
Ochrona bajtów wymaga `truncateAfterCompaction: true`. Bez rotacji transkryptu aktywny plik nie zmniejszyłby się, a ochrona pozostałaby nieaktywna.
</Warning>

### Transkrypty następcze

Gdy włączono `agents.defaults.compaction.truncateAfterCompaction`, OpenClaw nie przepisuje istniejącego transkryptu w miejscu. Tworzy nowy aktywny transkrypt następczy z podsumowania kompaktowania, zachowanego stanu i niestreszczonego ogona, a następnie zachowuje poprzedni JSONL jako zarchiwizowane źródło punktu kontrolnego.
Transkrypty następcze usuwają także dokładne duplikaty długich tur użytkownika, które trafiają
w krótkim oknie ponawiania, dzięki czemu burze ponowień kanału nie są przenoszone do
następnego aktywnego transkryptu po kompaktowaniu.

Punkty kontrolne sprzed kompaktowania są zachowywane tylko wtedy, gdy pozostają poniżej limitu
rozmiaru punktu kontrolnego OpenClaw; zbyt duże aktywne transkrypty nadal są kompaktowane, ale OpenClaw
pomija duży zrzut debugowania zamiast podwajać użycie dysku.

### Powiadomienia o kompaktowaniu

Domyślnie kompaktowanie działa po cichu. Ustaw `notifyUser`, aby pokazywać krótkie komunikaty stanu, gdy kompaktowanie się rozpoczyna i kończy:

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

### Opróżnianie pamięci

Przed kompaktowaniem OpenClaw może uruchomić turę **cichego opróżniania pamięci**, aby zapisać trwałe notatki na dysku. Ustaw `agents.defaults.compaction.memoryFlush.model`, gdy ta tura porządkowa powinna używać modelu lokalnego zamiast aktywnego modelu rozmowy:

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

Nadpisanie modelu opróżniania pamięci jest dokładne i nie dziedziczy łańcucha awaryjnego aktywnej sesji. Szczegóły i konfigurację znajdziesz w sekcji [Pamięć](/pl/concepts/memory).

## Wymienni dostawcy kompaktowania

Plugins mogą rejestrować niestandardowego dostawcę kompaktowania za pomocą `registerCompactionProvider()` w API Plugin. Gdy dostawca jest zarejestrowany i skonfigurowany, OpenClaw deleguje streszczanie do niego zamiast do wbudowanego potoku LLM.

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

Ustawienie `provider` automatycznie wymusza `mode: "safeguard"`. Dostawcy otrzymują te same instrukcje kompaktowania i politykę zachowywania identyfikatorów co wbudowana ścieżka, a OpenClaw nadal zachowuje kontekst sufiksu ostatnich tur i podzielonych tur po wyniku dostawcy.

<Note>
Jeśli dostawca zawiedzie albo zwróci pusty wynik, OpenClaw wraca do wbudowanego streszczania LLM.
</Note>

## Compaction a przycinanie

|                  | Compaction                    | Przycinanie                      |
| ---------------- | ----------------------------- | -------------------------------- |
| **Co robi**      | Streszcza starszą rozmowę     | Przycina stare wyniki narzędzi   |
| **Zapisane?**    | Tak (w transkrypcie sesji)    | Nie (tylko w pamięci, dla żądania) |
| **Zakres**       | Cała rozmowa                  | Tylko wyniki narzędzi            |

[Przycinanie sesji](/pl/concepts/session-pruning) jest lżejszym uzupełnieniem, które przycina dane wyjściowe narzędzi bez streszczania.

## Rozwiązywanie problemów

**Kompaktowanie odbywa się zbyt często?** Okno kontekstu modelu może być małe albo dane wyjściowe narzędzi mogą być duże. Spróbuj włączyć [przycinanie sesji](/pl/concepts/session-pruning).

**Kontekst wydaje się nieaktualny po kompaktowaniu?** Użyj `/compact Focus on <topic>`, aby ukierunkować podsumowanie, albo włącz [opróżnianie pamięci](/pl/concepts/memory), aby notatki przetrwały.

**Potrzebujesz czystego startu?** `/new` rozpoczyna świeżą sesję bez kompaktowania.

Zaawansowaną konfigurację (tokeny rezerwowe, zachowywanie identyfikatorów, niestandardowe silniki kontekstu, kompaktowanie po stronie serwera OpenAI) znajdziesz w sekcji [Szczegółowe omówienie zarządzania sesją](/pl/reference/session-management-compaction).

## Powiązane

- [Sesja](/pl/concepts/session): zarządzanie sesją i cykl życia.
- [Przycinanie sesji](/pl/concepts/session-pruning): przycinanie wyników narzędzi.
- [Kontekst](/pl/concepts/context): jak kontekst jest budowany dla tur agenta.
- [Hooks](/pl/automation/hooks): haki cyklu życia kompaktowania (`before_compaction`, `after_compaction`).
