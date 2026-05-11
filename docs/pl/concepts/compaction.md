---
read_when:
    - Chcesz zrozumieć automatyczną Compaction i /compact
    - Debugujesz długie sesje, które osiągają limity kontekstu
summary: Jak OpenClaw streszcza długie rozmowy, aby mieścić się w limitach modelu
title: Compaction
x-i18n:
    generated_at: "2026-05-11T20:27:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: edef60498a1e91405bd42d5e6eb4883719487f6d6f40936c4168e8bc5f40a39a
    source_path: concepts/compaction.md
    workflow: 16
---

Każdy model ma okno kontekstu: maksymalną liczbę tokenów, które może przetworzyć. Gdy rozmowa zbliża się do tego limitu, OpenClaw **przekształca** starsze wiadomości w podsumowanie, aby czat mógł być kontynuowany.

## Jak to działa

1. Starsze tury rozmowy są podsumowywane do zwartego wpisu.
2. Podsumowanie jest zapisywane w transkrypcie sesji.
3. Ostatnie wiadomości pozostają nienaruszone.

Gdy OpenClaw dzieli historię na fragmenty Compaction, zachowuje wywołania narzędzi asystenta razem z odpowiadającymi im wpisami `toolResult`. Jeśli punkt podziału wypadnie wewnątrz bloku narzędzia, OpenClaw przesuwa granicę, aby para pozostała razem, a bieżąca niepodsumowana końcówka została zachowana.

Pełna historia rozmowy pozostaje na dysku. Compaction zmienia tylko to, co model widzi w następnej turze.

## Automatyczna Compaction

Automatyczna Compaction jest domyślnie włączona. Uruchamia się, gdy sesja zbliża się do limitu kontekstu albo gdy model zwróci błąd przepełnienia kontekstu (w takim przypadku OpenClaw wykonuje Compaction i ponawia próbę).

Zobaczysz:

- `embedded run auto-compaction start` / `complete` w zwykłych logach Gateway.
- `🧹 Auto-compaction complete` w trybie szczegółowym.
- `/status` pokazujące `🧹 Compactions: <count>`.

<Info>
Przed wykonaniem Compaction OpenClaw automatycznie przypomina agentowi, aby zapisał ważne notatki w plikach [pamięci](/pl/concepts/memory). Zapobiega to utracie kontekstu.
</Info>

<AccordionGroup>
  <Accordion title="Recognized overflow signatures">
    OpenClaw wykrywa przepełnienie kontekstu na podstawie tych wzorców błędów dostawców:

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

Gdy ustawiono `agents.defaults.compaction.keepRecentTokens`, ręczna Compaction respektuje ten punkt odcięcia Pi i zachowuje ostatnią końcówkę w odbudowanym kontekście. Bez jawnego budżetu zachowania ręczna Compaction działa jak twardy punkt kontrolny i kontynuuje wyłącznie od nowego podsumowania.

## Konfiguracja

Skonfiguruj Compaction w `agents.defaults.compaction` w swoim `openclaw.json`. Najczęstsze przełączniki wymieniono poniżej; pełną dokumentację znajdziesz w sekcji [Dogłębne omówienie zarządzania sesją](/pl/reference/session-management-compaction).

### Używanie innego modelu

Domyślnie Compaction używa podstawowego modelu agenta. Ustaw `agents.defaults.compaction.model`, aby delegować podsumowywanie do bardziej wydajnego lub wyspecjalizowanego modelu. Nadpisanie akceptuje dowolny ciąg `provider/model-id`:

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

Gdy nie ustawiono tej opcji, Compaction zaczyna od aktywnego modelu sesji. Jeśli podsumowywanie nie powiedzie się z błędem dostawcy kwalifikującym się do zapasowego modelu, OpenClaw ponawia tę próbę Compaction przez istniejący łańcuch zapasowych modeli sesji. Wybór zapasowy jest tymczasowy i nie jest zapisywany z powrotem do stanu sesji. Jawne nadpisanie `agents.defaults.compaction.model` pozostaje dokładne i nie dziedziczy łańcucha zapasowego sesji.

### Zachowywanie identyfikatorów

Podsumowywanie Compaction domyślnie zachowuje nieprzezroczyste identyfikatory (`identifierPolicy: "strict"`). Nadpisz to przez `identifierPolicy: "off"`, aby wyłączyć, albo `identifierPolicy: "custom"` wraz z `identifierInstructions`, aby dodać własne wskazówki.

### Ochrona bajtów aktywnego transkryptu

Gdy ustawiono `agents.defaults.compaction.maxActiveTranscriptBytes`, OpenClaw uruchamia zwykłą lokalną Compaction przed przebiegiem, jeśli aktywny JSONL osiągnie ten rozmiar. Jest to przydatne w długo działających sesjach, w których zarządzanie kontekstem po stronie dostawcy może utrzymywać kontekst modelu w dobrym stanie, podczas gdy lokalny transkrypt nadal rośnie. Nie dzieli surowych bajtów JSONL; prosi zwykły potok Compaction o utworzenie semantycznego podsumowania.

<Warning>
Ochrona bajtów wymaga `truncateAfterCompaction: true`. Bez rotacji transkryptu aktywny plik nie zmniejszyłby się, a ochrona pozostałaby nieaktywna.
</Warning>

### Transkrypty następcze

Gdy włączono `agents.defaults.compaction.truncateAfterCompaction`, OpenClaw nie przepisuje istniejącego transkryptu w miejscu. Tworzy nowy aktywny transkrypt następczy z podsumowania Compaction, zachowanego stanu i niepodsumowanej końcówki, a następnie zachowuje poprzedni JSONL jako zarchiwizowane źródło punktu kontrolnego.
Transkrypty następcze usuwają też dokładne duplikaty długich tur użytkownika, które pojawiają się
w krótkim oknie ponownej próby, aby burze ponowień kanału nie były przenoszone do
następnego aktywnego transkryptu po Compaction.

Punkty kontrolne sprzed Compaction są zachowywane tylko wtedy, gdy pozostają poniżej limitu
rozmiaru punktu kontrolnego OpenClaw; zbyt duże aktywne transkrypty nadal podlegają Compaction, ale OpenClaw
pomija duży zrzut debugowania zamiast podwajać użycie dysku.

### Powiadomienia Compaction

Domyślnie Compaction działa cicho. Ustaw `notifyUser`, aby pokazywać krótkie komunikaty statusu, gdy Compaction zaczyna się i kończy:

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

Przed Compaction OpenClaw może uruchomić **cichy zrzut pamięci** jako turę, aby zapisać trwałe notatki na dysku. Ustaw `agents.defaults.compaction.memoryFlush.model`, gdy ta tura porządkowa powinna używać modelu lokalnego zamiast aktywnego modelu rozmowy:

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

Nadpisanie modelu zrzutu pamięci jest dokładne i nie dziedziczy łańcucha zapasowego aktywnej sesji. Szczegóły i konfigurację znajdziesz w sekcji [Pamięć](/pl/concepts/memory).

## Wymienni dostawcy Compaction

Plugins mogą rejestrować niestandardowego dostawcę Compaction przez `registerCompactionProvider()` w API pluginu. Gdy dostawca jest zarejestrowany i skonfigurowany, OpenClaw deleguje podsumowywanie do niego zamiast do wbudowanego potoku LLM.

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

Ustawienie `provider` automatycznie wymusza `mode: "safeguard"`. Dostawcy otrzymują te same instrukcje Compaction i zasady zachowywania identyfikatorów co ścieżka wbudowana, a OpenClaw nadal zachowuje kontekst ostatnich tur i sufiksu przerwanej tury po wyjściu dostawcy.

<Note>
Jeśli dostawca zawiedzie lub zwróci pusty wynik, OpenClaw wróci do wbudowanego podsumowywania LLM.
</Note>

## Compaction a przycinanie

|                  | Compaction                    | Przycinanie                          |
| ---------------- | ----------------------------- | ------------------------------------ |
| **Co robi**      | Podsumowuje starszą rozmowę   | Przycina stare wyniki narzędzi       |
| **Zapisane?**    | Tak (w transkrypcie sesji)    | Nie (tylko w pamięci, na żądanie)    |
| **Zakres**       | Cała rozmowa                  | Tylko wyniki narzędzi                |

[Przycinanie sesji](/pl/concepts/session-pruning) jest lżejszym uzupełnieniem, które przycina dane wyjściowe narzędzi bez podsumowywania.

## Rozwiązywanie problemów

**Compaction uruchamia się zbyt często?** Okno kontekstu modelu może być małe albo dane wyjściowe narzędzi mogą być duże. Spróbuj włączyć [przycinanie sesji](/pl/concepts/session-pruning).

**Kontekst po Compaction wydaje się nieaktualny?** Użyj `/compact Focus on <topic>`, aby ukierunkować podsumowanie, albo włącz [zrzut pamięci](/pl/concepts/memory), aby notatki przetrwały.

**Potrzebujesz czystego startu?** `/new` rozpoczyna nową sesję bez Compaction.

Zaawansowaną konfigurację (zarezerwowane tokeny, zachowywanie identyfikatorów, niestandardowe silniki kontekstu, serwerowa Compaction OpenAI) znajdziesz w sekcji [Dogłębne omówienie zarządzania sesją](/pl/reference/session-management-compaction).

## Powiązane

- [Sesja](/pl/concepts/session): zarządzanie sesją i cykl życia.
- [Przycinanie sesji](/pl/concepts/session-pruning): przycinanie wyników narzędzi.
- [Kontekst](/pl/concepts/context): jak budowany jest kontekst dla tur agenta.
- [Haki](/pl/automation/hooks): haki cyklu życia Compaction (`before_compaction`, `after_compaction`).
