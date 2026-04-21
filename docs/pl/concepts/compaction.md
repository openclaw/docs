---
read_when:
    - Chcesz zrozumieć automatyczny Compaction i `/compact`
    - Debugujesz długie sesje osiągające limity kontekstu
summary: Jak OpenClaw podsumowuje długie rozmowy, aby zmieścić się w limitach modelu
title: Compaction
x-i18n:
    generated_at: "2026-04-21T09:53:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 382e4a879e65199bd98d7476bff556571e09344a21e909862a34e6029db6d765
    source_path: concepts/compaction.md
    workflow: 15
---

# Compaction

Każdy model ma okno kontekstu — maksymalną liczbę tokenów, które może przetworzyć.
Gdy rozmowa zbliża się do tego limitu, OpenClaw wykonuje **Compaction** starszych wiadomości
do postaci podsumowania, aby czat mógł być kontynuowany.

## Jak to działa

1. Starsze tury rozmowy są podsumowywane do zwartego wpisu.
2. Podsumowanie jest zapisywane w transkrypcji sesji.
3. Ostatnie wiadomości pozostają nienaruszone.

Gdy OpenClaw dzieli historię na fragmenty Compaction, zachowuje wywołania
narzędzi asystenta sparowane z odpowiadającymi im wpisami `toolResult`. Jeśli punkt
podziału wypada wewnątrz bloku narzędzia, OpenClaw przesuwa granicę tak, aby para
pozostała razem i aby bieżący, niepodsumowany ogon został zachowany.

Pełna historia rozmowy pozostaje na dysku. Compaction zmienia tylko to, co
model widzi w następnej turze.

## Automatyczny Compaction

Automatyczny Compaction jest domyślnie włączony. Uruchamia się, gdy sesja zbliża się do limitu
kontekstu albo gdy model zwraca błąd przepełnienia kontekstu (w takim przypadku
OpenClaw wykonuje Compaction i ponawia próbę). Typowe oznaki przepełnienia to
`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model` oraz `ollama error: context length
exceeded`.

<Info>
Przed wykonaniem Compaction OpenClaw automatycznie przypomina agentowi o zapisaniu ważnych
notatek do plików [memory](/pl/concepts/memory). Zapobiega to utracie kontekstu.
</Info>

Użyj ustawienia `agents.defaults.compaction` w swoim `openclaw.json`, aby skonfigurować zachowanie Compaction (tryb, docelową liczbę tokenów itp.).
Podsumowywanie w Compaction domyślnie zachowuje nieprzezroczyste identyfikatory (`identifierPolicy: "strict"`). Możesz to zmienić przez `identifierPolicy: "off"` albo podać własny tekst przez `identifierPolicy: "custom"` i `identifierInstructions`.

Możesz opcjonalnie wskazać inny model do podsumowywania Compaction przez `agents.defaults.compaction.model`. Jest to przydatne, gdy Twój główny model jest lokalny albo mały, a chcesz, aby podsumowania Compaction były tworzone przez bardziej zaawansowany model. To nadpisanie akceptuje dowolny ciąg `provider/model-id`:

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

Działa to także z modelami lokalnymi, na przykład z drugim modelem Ollama przeznaczonym do podsumowywania albo specjalistą od Compaction po dostrojeniu:

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

Jeśli nie jest ustawione, Compaction używa głównego modelu agenta.

## Wymienne providery Compaction

Pluginy mogą rejestrować niestandardowy provider Compaction przez `registerCompactionProvider()` w API pluginu. Gdy provider jest zarejestrowany i skonfigurowany, OpenClaw przekazuje do niego podsumowywanie zamiast używać wbudowanego potoku LLM.

Aby użyć zarejestrowanego providera, ustaw identyfikator providera w konfiguracji:

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

Ustawienie `provider` automatycznie wymusza `mode: "safeguard"`. Providery otrzymują te same instrukcje Compaction i tę samą politykę zachowywania identyfikatorów co ścieżka wbudowana, a OpenClaw nadal zachowuje kontekst ostatnich tur i sufiksu rozdzielonej tury po wyniku providera. Jeśli provider zakończy się błędem albo zwróci pusty wynik, OpenClaw wraca do wbudowanego podsumowywania LLM.

## Automatyczny Compaction (domyślnie włączony)

Gdy sesja zbliża się do okna kontekstu modelu lub je przekracza, OpenClaw uruchamia automatyczny Compaction i może ponowić pierwotne żądanie z użyciem skompaktowanego kontekstu.

Zobaczysz:

- `🧹 Auto-compaction complete` w trybie verbose
- `/status` pokazujące `🧹 Compactions: <count>`

Przed Compaction OpenClaw może uruchomić **silent memory flush**, aby zapisać
trwałe notatki na dysku. Szczegóły i konfigurację znajdziesz w [Memory](/pl/concepts/memory).

## Ręczny Compaction

Wpisz `/compact` w dowolnym czacie, aby wymusić Compaction. Dodaj instrukcje, aby ukierunkować
podsumowanie:

```
/compact Skup się na decyzjach projektowych API
```

## Użycie innego modelu

Domyślnie Compaction używa głównego modelu Twojego agenta. Możesz użyć bardziej
zaawansowanego modelu, aby uzyskać lepsze podsumowania:

```json5
{
  agents: {
    defaults: {
      compaction: {
        model: "openrouter/anthropic/claude-sonnet-4-6",
      },
    },
  },
}
```

## Powiadomienia o Compaction

Domyślnie Compaction działa po cichu. Aby wyświetlać krótkie powiadomienia, gdy Compaction
się rozpoczyna i gdy się kończy, włącz `notifyUser`:

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

Po włączeniu użytkownik widzi krótkie komunikaty o stanie przy każdym uruchomieniu Compaction
(na przykład „Kompaktowanie kontekstu...” i „Compaction ukończony”).

## Compaction a pruning

|                  | Compaction                    | Pruning                         |
| ---------------- | ----------------------------- | ------------------------------- |
| **Co robi**      | Podsumowuje starszą rozmowę   | Przycina stare wyniki narzędzi  |
| **Zapisywane?**  | Tak (w transkrypcji sesji)    | Nie (tylko w pamięci, na żądanie) |
| **Zakres**       | Cała rozmowa                  | Tylko wyniki narzędzi           |

[Session pruning](/pl/concepts/session-pruning) to lżejsze uzupełnienie, które
przycina wyniki narzędzi bez podsumowywania.

## Rozwiązywanie problemów

**Compaction uruchamia się zbyt często?** Okno kontekstu modelu może być małe albo
wyniki narzędzi mogą być duże. Spróbuj włączyć
[session pruning](/pl/concepts/session-pruning).

**Po Compaction kontekst wydaje się nieaktualny?** Użyj `/compact Skup się na <topic>`, aby
ukierunkować podsumowanie, albo włącz [memory flush](/pl/concepts/memory), aby notatki
przetrwały.

**Potrzebujesz czystego startu?** `/new` rozpoczyna nową sesję bez wykonywania Compaction.

Zaawansowaną konfigurację (rezerwa tokenów, zachowywanie identyfikatorów, niestandardowe
silniki kontekstu, Compaction po stronie serwera OpenAI) znajdziesz w
[Session Management Deep Dive](/pl/reference/session-management-compaction).

## Powiązane

- [Session](/pl/concepts/session) — zarządzanie sesją i cykl życia
- [Session Pruning](/pl/concepts/session-pruning) — przycinanie wyników narzędzi
- [Context](/pl/concepts/context) — jak budowany jest kontekst dla tur agenta
- [Hooks](/pl/automation/hooks) — hooki cyklu życia Compaction (`before_compaction`, `after_compaction`)
