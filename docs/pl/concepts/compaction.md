---
read_when:
    - Chcesz zrozumieć automatyczne kompaktowanie i /compact
    - Debugujesz długie sesje osiągające limity kontekstu
summary: Jak OpenClaw podsumowuje długie rozmowy, aby zmieścić się w limitach modelu
title: Kompaktowanie
x-i18n:
    generated_at: "2026-04-05T13:50:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4c6dbd6ebdcd5f918805aafdc153925efef3e130faa3fab3c630832e938219fc
    source_path: concepts/compaction.md
    workflow: 15
---

# Kompaktowanie

Każdy model ma okno kontekstu — maksymalną liczbę tokenów, które może przetworzyć.
Gdy rozmowa zbliża się do tego limitu, OpenClaw **kompaktuje** starsze wiadomości
do postaci podsumowania, aby czat mógł być kontynuowany.

## Jak to działa

1. Starsze tury rozmowy są podsumowywane do zwartego wpisu.
2. Podsumowanie jest zapisywane w transkrypcie sesji.
3. Ostatnie wiadomości pozostają nienaruszone.

Gdy OpenClaw dzieli historię na fragmenty do kompaktowania, utrzymuje wywołania
narzędzi asystenta sparowane z odpowiadającymi im wpisami `toolResult`. Jeśli punkt podziału
wypada wewnątrz bloku narzędzia, OpenClaw przesuwa granicę tak, aby para pozostała razem, a
bieżący niepodsumowany ogon został zachowany.

Pełna historia rozmowy pozostaje na dysku. Kompaktowanie zmienia tylko to,
co model widzi w następnej turze.

## Automatyczne kompaktowanie

Automatyczne kompaktowanie jest domyślnie włączone. Uruchamia się, gdy sesja zbliża się do limitu
kontekstu albo gdy model zwróci błąd przepełnienia kontekstu (w takim przypadku
OpenClaw kompaktuje i ponawia próbę). Typowe sygnatury przepełnienia obejmują
`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model` oraz `ollama error: context length
exceeded`.

<Info>
Przed kompaktowaniem OpenClaw automatycznie przypomina agentowi o zapisaniu ważnych
notatek do plików [memory](/concepts/memory). Zapobiega to utracie kontekstu.
</Info>

## Ręczne kompaktowanie

Wpisz `/compact` w dowolnym czacie, aby wymusić kompaktowanie. Dodaj instrukcje,
aby ukierunkować podsumowanie:

```
/compact Skup się na decyzjach projektowych dotyczących API
```

## Używanie innego modelu

Domyślnie kompaktowanie używa głównego modelu agenta. Możesz użyć bardziej
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

## Powiadomienie o rozpoczęciu kompaktowania

Domyślnie kompaktowanie działa po cichu. Aby wyświetlać krótkie powiadomienie, gdy kompaktowanie
się rozpoczyna, włącz `notifyUser`:

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

Po włączeniu użytkownik widzi krótki komunikat (na przykład „Kompaktowanie
kontekstu...”) na początku każdego uruchomienia kompaktowania.

## Kompaktowanie a przycinanie

|                  | Kompaktowanie                 | Przycinanie                      |
| ---------------- | ----------------------------- | -------------------------------- |
| **Co robi**      | Podsumowuje starszą rozmowę   | Przycina stare wyniki narzędzi   |
| **Zapisywane?**  | Tak (w transkrypcie sesji)    | Nie (tylko w pamięci, na żądanie) |
| **Zakres**       | Cała rozmowa                  | Tylko wyniki narzędzi            |

[Przycinanie sesji](/concepts/session-pruning) to lżejsze uzupełnienie, które
przycina dane wyjściowe narzędzi bez tworzenia podsumowania.

## Rozwiązywanie problemów

**Kompaktowanie uruchamia się zbyt często?** Okno kontekstu modelu może być małe albo
dane wyjściowe narzędzi mogą być duże. Spróbuj włączyć
[przycinanie sesji](/concepts/session-pruning).

**Czy po kompaktowaniu kontekst wydaje się nieaktualny?** Użyj `/compact Skup się na <temat>`, aby
ukierunkować podsumowanie, albo włącz [opróżnianie memory](/concepts/memory), aby notatki
zostały zachowane.

**Potrzebujesz czystego startu?** `/new` rozpoczyna nową sesję bez kompaktowania.

Zaawansowaną konfigurację (rezerwowe tokeny, zachowanie identyfikatorów, niestandardowe
silniki kontekstu, kompaktowanie po stronie serwera OpenAI) opisano w
[Dogłębne omówienie zarządzania sesją](/reference/session-management-compaction).

## Powiązane

- [Session](/concepts/session) — zarządzanie sesją i jej cykl życia
- [Session Pruning](/concepts/session-pruning) — przycinanie wyników narzędzi
- [Context](/concepts/context) — jak budowany jest kontekst dla tur agenta
- [Hooks](/pl/automation/hooks) — hooki cyklu życia kompaktowania (before_compaction, after_compaction)
