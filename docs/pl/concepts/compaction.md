---
read_when:
    - Chcesz zrozumieć automatyczną Compaction i /compact
    - Debugujesz długie sesje osiągające limity kontekstu
summary: Jak OpenClaw podsumowuje długie rozmowy, aby mieścić się w limitach modelu
title: Compaction
x-i18n:
    generated_at: "2026-06-27T17:25:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 71c1665055574622926a4f13ee82b97f1c45e679a895db78da983919c0a5458f
    source_path: concepts/compaction.md
    workflow: 16
---

Każdy model ma okno kontekstu: maksymalną liczbę tokenów, które może przetworzyć. Gdy rozmowa zbliża się do tego limitu, OpenClaw **compacts** starsze wiadomości do podsumowania, aby czat mógł być kontynuowany.

## Jak to działa

1. Starsze tury rozmowy są podsumowywane w zwartym wpisie.
2. Podsumowanie jest zapisywane w transkrypcie sesji.
3. Najnowsze wiadomości pozostają nienaruszone.

Gdy OpenClaw dzieli historię na fragmenty Compaction, zachowuje wywołania narzędzi asystenta sparowane z odpowiadającymi im wpisami `toolResult`. Jeśli punkt podziału wypada wewnątrz bloku narzędzia, OpenClaw przesuwa granicę tak, aby para pozostała razem, a bieżący niepodsumowany ogon został zachowany.

Pełna historia rozmowy pozostaje na dysku. Compaction zmienia tylko to, co model widzi w następnej turze.

## Automatyczna Compaction

Automatyczna Compaction jest domyślnie włączona. Uruchamia się, gdy sesja zbliża się do limitu kontekstu albo gdy model zwraca błąd przepełnienia kontekstu (w takim przypadku OpenClaw wykonuje Compaction i ponawia próbę).

Zobaczysz:

- `embedded run auto-compaction start` / `complete` w zwykłych logach Gateway.
- `🧹 Auto-compaction complete` w trybie szczegółowym.
- `/status` pokazujące `🧹 Compactions: <count>`.

<Info>
Przed wykonaniem Compaction OpenClaw automatycznie przypomina agentowi o zapisaniu ważnych notatek do plików [pamięci](/pl/concepts/memory). Zapobiega to utracie kontekstu.
</Info>

<AccordionGroup>
  <Accordion title="Recognized overflow signatures">
    OpenClaw wykrywa przepełnienie kontekstu na podstawie tych wzorców błędów dostawcy:

    - `request_too_large`
    - `context length exceeded`
    - `input exceeds the maximum number of tokens`
    - `input token count exceeds the maximum number of input tokens`
    - `input is too long for the model`
    - `ollama error: context length exceeded`

  </Accordion>
</AccordionGroup>

## Ręczna Compaction

Wpisz `/compact` w dowolnym czacie, aby wymusić Compaction. Dodaj instrukcje, aby ukierunkować podsumowanie:

```
/compact Focus on the API design decisions
```

Gdy ustawiono `agents.defaults.compaction.keepRecentTokens`, ręczna Compaction respektuje ten punkt odcięcia OpenClaw i zachowuje najnowszy ogon w odbudowanym kontekście. Bez jawnego budżetu zachowania ręczna Compaction działa jak twardy punkt kontrolny i kontynuuje wyłącznie od nowego podsumowania.

## Konfiguracja

Skonfiguruj Compaction w `agents.defaults.compaction` w pliku `openclaw.json`. Najczęściej używane ustawienia są wymienione poniżej; pełną dokumentację znajdziesz w [szczegółowym omówieniu zarządzania sesją](/pl/reference/session-management-compaction).

### Używanie innego modelu

Domyślnie Compaction używa głównego modelu agenta. Ustaw `agents.defaults.compaction.model`, aby delegować podsumowywanie do wydajniejszego lub wyspecjalizowanego modelu. Nadpisanie przyjmuje ciąg `provider/model-id` albo prosty alias skonfigurowany w `agents.defaults.models`:

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

Proste skonfigurowane aliasy są rozwiązywane do kanonicznego dostawcy i modelu przed rozpoczęciem Compaction. Jeśli prosta wartość pasuje jednocześnie do aliasu i skonfigurowanego dosłownego identyfikatora modelu, wygrywa dosłowny identyfikator modelu. Niedopasowana prosta wartość pozostaje identyfikatorem modelu aktywnego dostawcy.

Działa to również z modelami lokalnymi, na przykład z drugim modelem Ollama przeznaczonym do podsumowywania:

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

Gdy nie ustawiono tej opcji, Compaction zaczyna od aktywnego modelu sesji. Jeśli podsumowywanie zakończy się błędem dostawcy kwalifikującym się do przełączenia awaryjnego modelu, OpenClaw ponawia tę próbę Compaction przez istniejący łańcuch przełączania awaryjnego modeli sesji. Wybór awaryjny jest tymczasowy i nie jest zapisywany z powrotem w stanie sesji. Jawne nadpisanie `agents.defaults.compaction.model` pozostaje dokładne i nie dziedziczy łańcucha przełączania awaryjnego sesji.

### Zachowywanie identyfikatorów

Podsumowywanie Compaction domyślnie zachowuje nieprzezroczyste identyfikatory (`identifierPolicy: "strict"`). Nadpisz ustawieniem `identifierPolicy: "off"`, aby wyłączyć, albo `identifierPolicy: "custom"` wraz z `identifierInstructions`, aby podać własne wskazówki.

### Ochrona rozmiaru aktywnego transkryptu

Gdy ustawiono `agents.defaults.compaction.maxActiveTranscriptBytes`, OpenClaw wyzwala normalną lokalną Compaction przed uruchomieniem, jeśli aktywny JSONL osiągnie ten rozmiar. Jest to przydatne w długo działających sesjach, w których zarządzanie kontekstem po stronie dostawcy może utrzymywać kontekst modelu w dobrym stanie, podczas gdy lokalny transkrypt nadal rośnie. Nie dzieli surowych bajtów JSONL; prosi normalny potok Compaction o utworzenie semantycznego podsumowania.

<Warning>
Ochrona rozmiaru wymaga `truncateAfterCompaction: true`. Bez rotacji transkryptu aktywny plik nie zmniejszyłby się, a ochrona pozostałaby nieaktywna.
</Warning>

### Transkrypty następcze

Gdy `agents.defaults.compaction.truncateAfterCompaction` jest włączone, OpenClaw nie przepisuje istniejącego transkryptu w miejscu. Tworzy nowy aktywny transkrypt następczy z podsumowania Compaction, zachowanego stanu i niepodsumowanego ogona, a następnie zapisuje metadane punktu kontrolnego, które kierują przepływy gałęzi/przywracania do tego zwartego następcy.
Transkrypty następcze usuwają także dokładne duplikaty długich tur użytkownika, które trafiają
w krótkim oknie ponawiania prób, dzięki czemu burze ponowień kanału nie są przenoszone do
następnego aktywnego transkryptu po Compaction.

OpenClaw nie zapisuje już oddzielnych kopii `.checkpoint.*.jsonl` dla nowych
Compaction. Istniejące starsze pliki punktów kontrolnych nadal mogą być używane, dopóki są przywoływane,
i są przycinane przez normalne czyszczenie sesji.

### Powiadomienia Compaction

Domyślnie Compaction działa po cichu. Ustaw `notifyUser`, aby pokazywać krótkie komunikaty stanu, gdy Compaction się rozpoczyna i kończy:

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

Przed Compaction OpenClaw może uruchomić **cichy zrzut pamięci**, aby zapisać trwałe notatki na dysku. Ustaw `agents.defaults.compaction.memoryFlush.model`, gdy ta porządkowa tura ma używać modelu lokalnego zamiast aktywnego modelu rozmowy:

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

Nadpisanie modelu zrzutu pamięci jest dokładne i nie dziedziczy aktywnego łańcucha przełączania awaryjnego sesji. Szczegóły i konfigurację znajdziesz w [Pamięci](/pl/concepts/memory).

## Wymienni dostawcy Compaction

Plugins mogą rejestrować niestandardowego dostawcę Compaction przez `registerCompactionProvider()` w API Plugin. Gdy dostawca jest zarejestrowany i skonfigurowany, OpenClaw deleguje podsumowywanie do niego zamiast używać wbudowanego potoku LLM.

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

Ustawienie `provider` automatycznie wymusza `mode: "safeguard"`. Dostawcy otrzymują te same instrukcje Compaction i zasady zachowywania identyfikatorów co wbudowana ścieżka, a OpenClaw nadal zachowuje kontekst najnowszych tur i sufiks podzielonej tury po wyniku dostawcy.

<Note>
Jeśli dostawca zawiedzie albo zwróci pusty wynik, OpenClaw wraca do wbudowanego podsumowywania LLM.
</Note>

## Compaction a przycinanie

|                  | Compaction                    | Przycinanie                          |
| ---------------- | ----------------------------- | ------------------------------------ |
| **Co robi**      | Podsumowuje starszą rozmowę   | Przycina stare wyniki narzędzi       |
| **Zapisane?**    | Tak (w transkrypcie sesji)    | Nie (tylko w pamięci, dla żądania)   |
| **Zakres**       | Cała rozmowa                  | Tylko wyniki narzędzi                |

[Przycinanie sesji](/pl/concepts/session-pruning) to lżejsze uzupełnienie, które przycina dane wyjściowe narzędzi bez podsumowywania.

## Rozwiązywanie problemów

**Compaction uruchamia się zbyt często?** Okno kontekstu modelu może być małe albo dane wyjściowe narzędzi mogą być duże. Spróbuj włączyć [przycinanie sesji](/pl/concepts/session-pruning).

**Kontekst wydaje się nieświeży po Compaction?** Użyj `/compact Focus on <topic>`, aby ukierunkować podsumowanie, albo włącz [zrzut pamięci](/pl/concepts/memory), aby notatki przetrwały.

**Potrzebujesz czystego startu?** `/new` rozpoczyna świeżą sesję bez Compaction.

Zaawansowaną konfigurację (rezerwowanie tokenów, zachowywanie identyfikatorów, niestandardowe silniki kontekstu, serwerową Compaction OpenAI) znajdziesz w [szczegółowym omówieniu zarządzania sesją](/pl/reference/session-management-compaction).

## Powiązane

- [Sesja](/pl/concepts/session): zarządzanie sesją i cykl życia.
- [Przycinanie sesji](/pl/concepts/session-pruning): przycinanie wyników narzędzi.
- [Kontekst](/pl/concepts/context): jak kontekst jest budowany dla tur agenta.
- [Hooki](/pl/automation/hooks): hooki cyklu życia Compaction (`before_compaction`, `after_compaction`).
