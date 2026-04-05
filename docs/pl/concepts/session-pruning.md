---
read_when:
    - Chcesz ograniczyć wzrost kontekstu powodowany przez dane wyjściowe narzędzi
    - Chcesz zrozumieć optymalizację prompt cache w Anthropic
summary: Przycinanie starych wyników narzędzi, aby utrzymać lekki kontekst i wydajne cache'owanie
title: Przycinanie sesji
x-i18n:
    generated_at: "2026-04-05T13:51:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1569a50e0018cca3e3ceefbdddaf093843df50cdf2f7bf62fe925299875cb487
    source_path: concepts/session-pruning.md
    workflow: 15
---

# Przycinanie sesji

Przycinanie sesji skraca **stare wyniki narzędzi** w kontekście przed każdym
wywołaniem LLM. Ogranicza rozrost kontekstu spowodowany nagromadzonymi danymi wyjściowymi narzędzi (wyniki `exec`, odczyty
plików, wyniki wyszukiwania) bez przepisywania zwykłego tekstu rozmowy.

<Info>
Przycinanie działa tylko w pamięci — nie modyfikuje transkrypcji sesji zapisanej na dysku.
Pełna historia jest zawsze zachowywana.
</Info>

## Dlaczego to ważne

Długie sesje gromadzą dane wyjściowe narzędzi, które powiększają okno kontekstu. To
zwiększa koszt i może wymusić [kompaktowanie](/concepts/compaction) wcześniej, niż
jest to konieczne.

Przycinanie jest szczególnie wartościowe dla **prompt cache Anthropic**. Po wygaśnięciu
TTL cache następne żądanie ponownie cache'uje cały prompt. Przycinanie zmniejsza rozmiar
zapisu do cache, bezpośrednio obniżając koszt.

## Jak to działa

1. Poczekaj na wygaśnięcie TTL cache (domyślnie 5 minut).
2. Znajdź stare wyniki narzędzi do zwykłego przycinania (tekst rozmowy pozostaje bez zmian).
3. **Miękkie przycinanie** zbyt dużych wyników — zachowaj początek i koniec, wstaw `...`.
4. **Twarde czyszczenie** pozostałych — zastąp je placeholderem.
5. Zresetuj TTL, aby kolejne żądania mogły ponownie użyć świeżego cache.

## Czyszczenie starszych obrazów

OpenClaw uruchamia też osobne idempotentne czyszczenie dla starszych sesji legacy, które
zapisywały surowe bloki obrazów w historii.

- Zachowuje **3 najnowsze ukończone tury** bajt po bajcie, aby prefiksy prompt cache
  dla ostatnich followupów pozostały stabilne.
- Starsze, już przetworzone bloki obrazów w historii `user` lub `toolResult` mogą zostać
  zastąpione przez `[image data removed - already processed by model]`.
- To jest oddzielne od zwykłego przycinania według TTL cache. Istnieje po to, aby powstrzymać
  powtarzające się ładunki obrazów przed psuciem prompt cache w późniejszych turach.

## Rozsądne ustawienia domyślne

OpenClaw automatycznie włącza przycinanie dla profili Anthropic:

| Typ profilu                                             | Przycinanie włączone | Heartbeat |
| ------------------------------------------------------- | -------------------- | --------- |
| Uwierzytelnianie Anthropic OAuth/token (w tym ponowne użycie Claude CLI) | Tak                  | 1 godzina |
| Klucz API                                               | Tak                  | 30 min    |

Jeśli ustawisz wartości jawnie, OpenClaw ich nie nadpisze.

## Włączanie lub wyłączanie

Przycinanie jest domyślnie wyłączone dla dostawców innych niż Anthropic. Aby je włączyć:

```json5
{
  agents: {
    defaults: {
      contextPruning: { mode: "cache-ttl", ttl: "5m" },
    },
  },
}
```

Aby wyłączyć: ustaw `mode: "off"`.

## Przycinanie a kompaktowanie

|            | Przycinanie         | Kompaktowanie          |
| ---------- | ------------------- | ---------------------- |
| **Co**     | Skraca wyniki narzędzi | Podsumowuje rozmowę |
| **Zapisane?** | Nie (na żądanie)  | Tak (w transkrypcji)   |
| **Zakres** | Tylko wyniki narzędzi | Cała rozmowa         |

Te mechanizmy się uzupełniają — przycinanie utrzymuje lekkie dane wyjściowe narzędzi między
cyklami kompaktowania.

## Dalsza lektura

- [Kompaktowanie](/concepts/compaction) — redukcja kontekstu oparta na podsumowaniach
- [Konfiguracja Gateway](/gateway/configuration) — wszystkie ustawienia konfiguracji przycinania
  (`contextPruning.*`)
