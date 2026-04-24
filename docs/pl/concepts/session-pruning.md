---
read_when:
    - |-
      Chcesz ograniczyć wzrost kontekstu spowodowany danymi wyjściowymi narzędzi กรุงเทพมหานครฯassistant to=final code ცა
      print("Chcesz ograniczyć wzrost kontekstu spowodowany danymi wyjściowymi narzędzi")
    - Chcesz zrozumieć optymalizację cache promptów Anthropic
summary: Przycinanie starych wyników narzędzi, aby utrzymać lekki kontekst i wydajny cache
title: Przycinanie sesji
x-i18n:
    generated_at: "2026-04-24T09:07:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: af47997b83cd478dac0e2ebb6d277a948713f28651751bec6cff4ef4b70a16c6
    source_path: concepts/session-pruning.md
    workflow: 15
---

Przycinanie sesji usuwa z kontekstu **stare wyniki narzędzi** przed każdym
wywołaniem LLM. Ogranicza puchnięcie kontekstu spowodowane nagromadzonymi danymi wyjściowymi narzędzi (wyniki exec, odczyty
plików, wyniki wyszukiwania) bez przepisywania zwykłego tekstu konwersacji.

<Info>
Przycinanie odbywa się tylko w pamięci — nie modyfikuje transkryptu sesji na dysku.
Pełna historia jest zawsze zachowywana.
</Info>

## Dlaczego to ma znaczenie

Długie sesje gromadzą dane wyjściowe narzędzi, które zwiększają rozmiar okna kontekstowego. To
zwiększa koszt i może wymusić [Compaction](/pl/concepts/compaction) wcześniej, niż
to konieczne.

Przycinanie jest szczególnie wartościowe dla **cache promptów Anthropic**. Po wygaśnięciu TTL
cache następne żądanie ponownie zapisuje w cache cały prompt. Przycinanie zmniejsza rozmiar
zapisu do cache, bezpośrednio obniżając koszt.

## Jak to działa

1. Poczekaj, aż TTL cache wygaśnie (domyślnie 5 minut).
2. Znajdź stare wyniki narzędzi do zwykłego przycinania (tekst konwersacji pozostaje bez zmian).
3. **Miękko przytnij** zbyt duże wyniki — zachowaj początek i koniec, wstaw `...`.
4. **Twardo wyczyść** resztę — zastąp placeholderem.
5. Zresetuj TTL, aby kolejne żądania używały świeżego cache.

## Czyszczenie starszych obrazów legacy

OpenClaw uruchamia też oddzielne idempotentne czyszczenie dla starszych sesji legacy, które
zachowywały surowe bloki obrazów w historii.

- Zachowuje **3 najnowsze ukończone tury** bajt w bajt, aby prefiksy cache promptów
  dla ostatnich kontynuacji pozostawały stabilne.
- Starsze, już przetworzone bloki obrazów w historii `user` lub `toolResult` mogą zostać
  zastąpione przez `[image data removed - already processed by model]`.
- To jest oddzielone od zwykłego przycinania według TTL cache. Istnieje po to, aby zatrzymać
  powtarzające się ładunki obrazów przed psuciem cache promptów w późniejszych turach.

## Inteligentne ustawienia domyślne

OpenClaw automatycznie włącza przycinanie dla profili Anthropic:

| Typ profilu                                            | Przycinanie włączone | Heartbeat |
| ------------------------------------------------------ | -------------------- | --------- |
| Uwierzytelnianie Anthropic OAuth/token (w tym ponowne użycie Claude CLI) | Tak      | 1 godzina |
| Klucz API                                              | Tak                  | 30 min    |

Jeśli ustawisz jawne wartości, OpenClaw ich nie nadpisze.

## Włączanie lub wyłączanie

Przycinanie jest domyślnie wyłączone dla providerów innych niż Anthropic. Aby je włączyć:

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

## Przycinanie a Compaction

|            | Przycinanie         | Compaction              |
| ---------- | ------------------- | ----------------------- |
| **Co**     | Przycina wyniki narzędzi | Podsumowuje konwersację |
| **Zapisywane?** | Nie (na żądanie) | Tak (w transkrypcie)     |
| **Zakres** | Tylko wyniki narzędzi | Cała konwersacja      |

Te mechanizmy się uzupełniają — przycinanie utrzymuje lekkie dane wyjściowe narzędzi pomiędzy
cyklami Compaction.

## Dalsza lektura

- [Compaction](/pl/concepts/compaction) — redukcja kontekstu oparta na podsumowywaniu
- [Konfiguracja Gateway](/pl/gateway/configuration) — wszystkie ustawienia przycinania
  (`contextPruning.*`)

## Powiązane

- [Zarządzanie sesją](/pl/concepts/session)
- [Narzędzia sesji](/pl/concepts/session-tool)
- [Silnik kontekstu](/pl/concepts/context-engine)
