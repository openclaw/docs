---
read_when:
    - Chcesz zrozumieć automatyczny Compaction i /compact
    - Debugujesz długie sesje osiągające limity kontekstu
summary: Jak OpenClaw podsumowuje długie konwersacje, aby mieścić się w limitach modelu
title: Compaction
x-i18n:
    generated_at: "2026-04-24T09:05:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: b88a757b19a7c040599a0a7901d8596001ffff148f7f6e861a3cc783100393f7
    source_path: concepts/compaction.md
    workflow: 15
---

Każdy model ma okno kontekstu — maksymalną liczbę tokenów, które może przetworzyć.
Gdy konwersacja zbliża się do tego limitu, OpenClaw wykonuje **Compaction** starszych wiadomości
do postaci podsumowania, aby czat mógł być kontynuowany.

## Jak to działa

1. Starsze tury konwersacji są podsumowywane do zwartego wpisu.
2. Podsumowanie jest zapisywane w transkrypcie sesji.
3. Ostatnie wiadomości pozostają nienaruszone.

Gdy OpenClaw dzieli historię na fragmenty Compaction, utrzymuje wywołania narzędzi
asystenta sparowane z odpowiadającymi im wpisami `toolResult`. Jeśli punkt podziału
wypada wewnątrz bloku narzędzia, OpenClaw przesuwa granicę tak, aby para pozostała razem,
a bieżący niepodsumowany ogon został zachowany.

Pełna historia konwersacji pozostaje na dysku. Compaction zmienia tylko to,
co model widzi w następnej turze.

## Automatyczny Compaction

Automatyczny Compaction jest domyślnie włączony. Uruchamia się, gdy sesja zbliża się do limitu
kontekstu lub gdy model zwraca błąd przepełnienia kontekstu (w takim przypadku
OpenClaw wykonuje Compaction i ponawia próbę). Typowe sygnatury przepełnienia to
`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model` oraz `ollama error: context length
exceeded`.

<Info>
Przed wykonaniem Compaction OpenClaw automatycznie przypomina agentowi o zapisaniu ważnych
notatek do plików [memory](/pl/concepts/memory). Zapobiega to utracie kontekstu.
</Info>

Użyj ustawienia `agents.defaults.compaction` w swoim `openclaw.json`, aby skonfigurować zachowanie Compaction (tryb, docelową liczbę tokenów itp.).
Podsumowywanie w Compaction domyślnie zachowuje nieprzezroczyste identyfikatory (`identifierPolicy: "strict"`). Możesz to nadpisać przez `identifierPolicy: "off"` albo podać własny tekst przez `identifierPolicy: "custom"` i `identifierInstructions`.

Opcjonalnie możesz wskazać inny model do podsumowywania Compaction za pomocą `agents.defaults.compaction.model`. Jest to przydatne, gdy główny model jest lokalny lub mały, a chcesz, aby podsumowania Compaction były tworzone przez bardziej zaawansowany model. Nadpisanie akceptuje dowolny ciąg `provider/model-id`:

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

Działa to również z modelami lokalnymi, na przykład drugim modelem Ollama przeznaczonym do podsumowań lub specjalistą fine-tuned do Compaction:

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

Gdy ustawienie nie jest określone, Compaction używa głównego modelu agenta.

## Rozszerzalni providerzy Compaction

Plugins mogą rejestrować własnego providera Compaction przez `registerCompactionProvider()` w API pluginu. Gdy provider jest zarejestrowany i skonfigurowany, OpenClaw deleguje podsumowywanie do niego zamiast do wbudowanego potoku LLM.

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

Ustawienie `provider` automatycznie wymusza `mode: "safeguard"`. Providerzy otrzymują te same instrukcje Compaction i tę samą politykę zachowania identyfikatorów co ścieżka wbudowana, a OpenClaw nadal zachowuje kontekst ostatnich tur i sufiksów podzielonych tur po danych wyjściowych providera. Jeśli provider zakończy się błędem lub zwróci pusty wynik, OpenClaw wraca do wbudowanego podsumowywania LLM.

## Automatyczny Compaction (domyślnie włączony)

Gdy sesja zbliża się do okna kontekstu modelu lub je przekracza, OpenClaw uruchamia automatyczny Compaction i może ponowić pierwotne żądanie z użyciem skompaktowanego kontekstu.

Zobaczysz:

- `🧹 Auto-compaction complete` w trybie szczegółowym
- `/status` pokazujące `🧹 Compactions: <count>`

Przed Compaction OpenClaw może wykonać **cichą turę opróżniania pamięci**, aby zapisać
trwałe notatki na dysku. Szczegóły i konfigurację znajdziesz w [Memory](/pl/concepts/memory).

## Ręczny Compaction

Wpisz `/compact` w dowolnym czacie, aby wymusić Compaction. Dodaj instrukcje, aby ukierunkować
podsumowanie:

```
/compact Focus on the API design decisions
```

## Używanie innego modelu

Domyślnie Compaction używa głównego modelu agenta. Możesz użyć bardziej
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

## Powiadomienia Compaction

Domyślnie Compaction działa po cichu. Aby pokazywać krótkie powiadomienia podczas rozpoczęcia i zakończenia Compaction,
włącz `notifyUser`:

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

Po włączeniu użytkownik widzi krótkie komunikaty o stanie wokół każdego uruchomienia Compaction
(na przykład „Compacting context...” i „Compaction complete”).

## Compaction a przycinanie

|                  | Compaction                   | Przycinanie                      |
| ---------------- | ---------------------------- | -------------------------------- |
| **Co robi**      | Podsumowuje starszą konwersację | Przycina stare wyniki narzędzi   |
| **Zapisywane?**  | Tak (w transkrypcie sesji)   | Nie (tylko w pamięci, per request) |
| **Zakres**       | Cała konwersacja            | Tylko wyniki narzędzi            |

[Przycinanie sesji](/pl/concepts/session-pruning) to lżejsze uzupełnienie, które
przycina dane wyjściowe narzędzi bez podsumowywania.

## Rozwiązywanie problemów

**Compaction uruchamia się zbyt często?** Okno kontekstu modelu może być małe lub
dane wyjściowe narzędzi mogą być duże. Spróbuj włączyć
[przycinanie sesji](/pl/concepts/session-pruning).

**Kontekst wydaje się nieaktualny po Compaction?** Użyj `/compact Focus on <topic>`, aby
ukierunkować podsumowanie, albo włącz [opróżnianie memory](/pl/concepts/memory), aby notatki
przetrwały.

**Potrzebujesz czystego startu?** `/new` rozpoczyna nową sesję bez wykonywania Compaction.

Zaawansowaną konfigurację (rezerwę tokenów, zachowanie identyfikatorów, niestandardowe
silniki kontekstu, server-side Compaction OpenAI) znajdziesz w
[Dogłębnym omówieniu zarządzania sesją](/pl/reference/session-management-compaction).

## Powiązane

- [Sesja](/pl/concepts/session) — zarządzanie sesją i cykl życia
- [Przycinanie sesji](/pl/concepts/session-pruning) — przycinanie wyników narzędzi
- [Kontekst](/pl/concepts/context) — jak budowany jest kontekst dla tur agenta
- [Hooks](/pl/automation/hooks) — hooki cyklu życia Compaction (`before_compaction`, `after_compaction`)
