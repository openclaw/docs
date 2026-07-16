---
read_when:
    - Chcesz zrozumieć automatyczną kompaktację i `/compact`
    - Debugowanie długich sesji osiągających limity kontekstu
summary: Jak OpenClaw podsumowuje długie rozmowy, aby nie przekraczać limitów modelu
title: Compaction
x-i18n:
    generated_at: "2026-07-16T18:31:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f00fb0cf59184ef450f1fc4d39a21a40ee4e8327d872766bca7f3642c0145514
    source_path: concepts/compaction.md
    workflow: 16
---

Każdy model ma okno kontekstu: maksymalną liczbę tokenów, które może przetworzyć. Gdy rozmowa zbliża się do tego limitu, OpenClaw **kompaktuje** starsze wiadomości do postaci podsumowania, aby można było kontynuować czat.

## Jak to działa

1. Starsze tury rozmowy są podsumowywane w zwięzłym wpisie.
2. Podsumowanie jest zapisywane w transkrypcji sesji.
3. Ostatnie wiadomości pozostają nienaruszone.

Podczas wybierania punktu podziału na potrzeby Compaction OpenClaw zachowuje wywołania narzędzi asystenta razem z odpowiadającymi im wpisami `toolResult`. Jeśli punkt wypada wewnątrz bloku narzędzia, OpenClaw przesuwa granicę, aby para pozostała razem, a bieżąca niepodsumowana końcówka została zachowana.

Pełna historia rozmowy pozostaje na dysku. Compaction zmienia jedynie to, co model widzi w następnej turze.

<Note>
W nowych konfiguracjach `agents.defaults.compaction.mode` ma domyślnie wartość `"safeguard"` (bardziej rygorystyczne zabezpieczenia i audyty jakości podsumowań). Aby z tego zrezygnować, należy jawnie ustawić `mode: "default"`.
</Note>

## Automatyczna Compaction

Automatyczna Compaction jest domyślnie włączona. Uruchamia się, gdy sesja zbliża się do limitu kontekstu lub gdy model zwraca błąd przepełnienia kontekstu (w takim przypadku OpenClaw wykonuje Compaction i ponawia próbę).

Widoczne będą:

- `embedded run auto-compaction start` / `complete` w standardowych dziennikach Gateway.
- `🧹 Auto-compaction complete` w trybie szczegółowym.
- `/status` pokazujące `🧹 Compactions: <count>`.

<Info>
Przed wykonaniem Compaction OpenClaw automatycznie przypomina agentowi o zapisaniu ważnych notatek w plikach [pamięci](/pl/concepts/memory). Zapobiega to utracie kontekstu.
</Info>

<AccordionGroup>
  <Accordion title="Wzorce błędów przepełnienia rozpoznawane przez OpenClaw">
    OpenClaw dopasowuje dziesiątki charakterystycznych dla poszczególnych dostawców komunikatów o przepełnieniu (Anthropic, OpenAI, Bedrock, Gemini, Ollama, OpenRouter i inni). Typowe przykłady:

    - `request_too_large`
    - `context length exceeded`
    - `input exceeds the maximum number of tokens`
    - `input token count exceeds the maximum number of input tokens` (Bedrock)
    - `input is too long for the model`
    - `ollama error: context length exceeded`

  </Accordion>
</AccordionGroup>

## Ręczna Compaction

Aby wymusić Compaction, należy wpisać `/compact` w dowolnym czacie. Można dodać instrukcje określające treść podsumowania:

```text
/compact Skup się na decyzjach dotyczących projektu API
```

Gdy ustawiono `agents.defaults.compaction.keepRecentTokens` (domyślnie: 20,000), ręczna Compaction respektuje ten punkt odcięcia i zachowuje ostatnią część w przebudowanym kontekście. Bez jawnie określonego budżetu zachowania ręczna Compaction działa jak twardy punkt kontrolny i kontynuuje wyłącznie od nowego podsumowania.

## Konfiguracja

Compaction konfiguruje się w sekcji `agents.defaults.compaction` pliku `openclaw.json`. Najczęściej używane opcje wymieniono poniżej; pełna dokumentacja znajduje się w sekcji [Szczegółowe omówienie zarządzania sesjami](/pl/reference/session-management-compaction).

### Używanie innego modelu

Domyślnie Compaction korzysta z głównego modelu agenta. Ustawienie `agents.defaults.compaction.model` pozwala przekazać podsumowywanie bardziej zaawansowanemu lub wyspecjalizowanemu modelowi. Wartość zastępująca przyjmuje ciąg `provider/model-id` albo sam alias skonfigurowany w sekcji `agents.defaults.models`:

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

Przed rozpoczęciem Compaction same skonfigurowane aliasy są rozwiązywane do ich kanonicznego dostawcy i modelu. Jeśli sama wartość pasuje zarówno do aliasu, jak i skonfigurowanego literalnego identyfikatora modelu, pierwszeństwo ma literalny identyfikator modelu. Niedopasowana sama wartość pozostaje identyfikatorem modelu aktywnego dostawcy.

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

Jeśli ta opcja nie jest ustawiona, Compaction rozpoczyna się z aktywnym modelem sesji. Jeśli podsumowywanie zakończy się błędem dostawcy kwalifikującym się do użycia modelu rezerwowego, OpenClaw ponawia tę próbę Compaction przy użyciu istniejącego łańcucha modeli rezerwowych sesji. Wybór modelu rezerwowego jest tymczasowy i nie jest zapisywany w stanie sesji. Jawna wartość zastępująca `agents.defaults.compaction.model` pozostaje ścisła i nie dziedziczy łańcucha modeli rezerwowych sesji.

### Zachowywanie identyfikatorów

Podsumowywanie podczas Compaction domyślnie zachowuje nieprzezroczyste identyfikatory (`identifierPolicy: "strict"`). Aby to wyłączyć, należy użyć `identifierPolicy: "off"`, a aby podać niestandardowe wytyczne — `identifierPolicy: "custom"` wraz z `identifierInstructions`.

### Ograniczenie liczby bajtów aktywnej transkrypcji

Gdy ustawiono `agents.defaults.compaction.maxActiveTranscriptBytes`, OpenClaw
uruchamia standardową lokalną Compaction przed wykonaniem, jeśli historia transkrypcji osiągnie
ten rozmiar. Jest to przydatne w długotrwałych sesjach, w których zarządzanie kontekstem
po stronie dostawcy może utrzymywać kontekst modelu w dobrym stanie, podczas gdy utrwalona historia transkrypcji
nadal rośnie. Mechanizm ten nie dzieli surowych bajtów, lecz zleca standardowemu procesowi Compaction
utworzenie semantycznego podsumowania.

<Warning>
Ograniczenie liczby bajtów dotyczy historii aktywnej transkrypcji SQLite. Starsze artefakty
punktów kontrolnych JSONL nie są aktywnym celem Compaction.
</Warning>

### Transkrypcje następcze

Gdy włączono `agents.defaults.compaction.truncateAfterCompaction`, OpenClaw nie przepisuje istniejącej transkrypcji w miejscu. Tworzy nową aktywną transkrypcję następczą na podstawie podsumowania Compaction, zachowanego stanu i niepodsumowanej końcówki, a następnie zapisuje metadane punktu kontrolnego, które kierują przepływy rozgałęziania i przywracania do tego skompaktowanego następcy.
Transkrypcje następcze usuwają również dokładnie zduplikowane długie tury użytkownika, które pojawiają się
w krótkim przedziale ponawiania, dzięki czemu lawiny ponowień kanału nie są przenoszone do
następnej aktywnej transkrypcji po Compaction.

OpenClaw nie zapisuje już oddzielnych kopii `.checkpoint.*.jsonl` dla nowych
operacji Compaction. Istniejące starsze pliki punktów kontrolnych nadal mogą być używane, dopóki istnieją do nich odwołania,
i są usuwane podczas standardowego czyszczenia sesji.

### Powiadomienia o Compaction

Domyślnie Compaction przebiega bez komunikatów. Ustawienie `notifyUser` powoduje wyświetlanie krótkich komunikatów o stanie przy rozpoczęciu i zakończeniu Compaction oraz komunikatu o obniżonej jakości, gdy wyczerpią się próby opróżnienia pamięci przed Compaction, ale odpowiedź jest nadal kontynuowana:

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

Przed wykonaniem Compaction OpenClaw może uruchomić turę **cichego opróżniania pamięci**, aby zapisać trwałe notatki na dysku. Jeśli ta tura porządkowa ma korzystać z modelu lokalnego zamiast aktywnego modelu rozmowy, należy ustawić `agents.defaults.compaction.memoryFlush.model`:

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

Wartość zastępująca model opróżniania pamięci jest ścisła i nie dziedziczy łańcucha modeli rezerwowych aktywnej sesji. Szczegóły i konfigurację opisano w sekcji [Pamięć](/pl/concepts/memory).

## Wymienne dostawcy Compaction

Pluginy mogą rejestrować niestandardowego dostawcę Compaction za pośrednictwem `registerCompactionProvider()` w API pluginu. Gdy dostawca jest zarejestrowany i skonfigurowany, OpenClaw przekazuje mu podsumowywanie zamiast używać wbudowanego procesu LLM.

Aby użyć zarejestrowanego dostawcy, należy ustawić jego identyfikator w konfiguracji:

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

Ustawienie `provider` automatycznie wymusza `mode: "safeguard"`. Dostawcy otrzymują te same instrukcje Compaction i zasady zachowywania identyfikatorów co wbudowana ścieżka, a OpenClaw nadal zachowuje kontekst ostatnich tur i końcówki podzielonej tury po otrzymaniu wyniku od dostawcy.

<Note>
Jeśli dostawca zawiedzie lub zwróci pusty wynik, OpenClaw wróci do wbudowanego podsumowywania LLM.
</Note>

## Compaction a przycinanie

|                  | Compaction                         | Przycinanie                               |
| ---------------- | ---------------------------------- | ----------------------------------------- |
| **Działanie**    | Podsumowuje starszą część rozmowy | Przycina stare wyniki narzędzi            |
| **Zapisywane?**  | Tak (w transkrypcji sesji)         | Nie (tylko w pamięci, dla każdego żądania) |
| **Zakres**       | Cała rozmowa                       | Tylko wyniki narzędzi                     |

[Przycinanie sesji](/pl/concepts/session-pruning) jest lżejszym mechanizmem uzupełniającym, który przycina wyniki narzędzi bez ich podsumowywania.

## Rozwiązywanie problemów

**Compaction jest wykonywana zbyt często?** Okno kontekstu modelu może być małe albo wyniki narzędzi mogą być obszerne. Warto spróbować włączyć [przycinanie sesji](/pl/concepts/session-pruning).

**Po Compaction kontekst wydaje się nieaktualny?** Należy użyć `/compact Focus on <topic>`, aby określić treść podsumowania, lub włączyć [opróżnianie pamięci](/pl/concepts/memory), aby notatki zostały zachowane.

**Potrzebny jest czysty start?** `/new` rozpoczyna nową sesję bez wykonywania Compaction.

Zaawansowane opcje konfiguracji (rezerwa tokenów, zachowywanie identyfikatorów, niestandardowe mechanizmy kontekstu i Compaction po stronie serwera OpenAI) opisano w sekcji [Szczegółowe omówienie zarządzania sesjami](/pl/reference/session-management-compaction).

## Powiązane

- [Sesja](/pl/concepts/session): zarządzanie sesją i jej cykl życia.
- [Przycinanie sesji](/pl/concepts/session-pruning): przycinanie wyników narzędzi.
- [Kontekst](/pl/concepts/context): sposób tworzenia kontekstu dla tur agenta.
- [Hooki](/pl/automation/hooks): hooki cyklu życia Compaction (`before_compaction`, `after_compaction`).
