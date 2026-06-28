---
read_when:
    - Chcesz ograniczyć rozrost kontekstu spowodowany wynikami narzędzi
    - Chcesz zrozumieć optymalizację pamięci podręcznej promptów Anthropic
summary: Przycinanie starych wyników narzędzi, aby zachować lekki kontekst i wydajne buforowanie
title: Przycinanie sesji
x-i18n:
    generated_at: "2026-04-26T11:27:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3ea07f0ae23076906e2ff0246ac75813572f98cffa50afddb6a6b0af8964c4a9
    source_path: concepts/session-pruning.md
    workflow: 15
    postprocess_version: locale-links-v1
---

Przycinanie sesji przycina **stare wyniki narzędzi** z kontekstu przed każdym
wywołaniem LLM. Ogranicza rozrost kontekstu spowodowany nagromadzonymi wynikami narzędzi (wyniki `exec`, odczyty plików, wyniki wyszukiwania), bez przepisywania zwykłego tekstu rozmowy.

<Info>
Przycinanie działa tylko w pamięci -- nie modyfikuje transkryptu sesji na dysku.
Pełna historia jest zawsze zachowywana.
</Info>

## Dlaczego to ma znaczenie

Długie sesje gromadzą wyniki narzędzi, które powiększają okno kontekstu. To
zwiększa koszty i może wymusić [Compaction](/pl/concepts/compaction) wcześniej, niż
jest to konieczne.

Przycinanie jest szczególnie wartościowe dla **pamięci podręcznej promptów Anthropic**. Po wygaśnięciu
TTL pamięci podręcznej następne żądanie ponownie zapisuje w cache cały prompt. Przycinanie zmniejsza rozmiar zapisu do cache, bezpośrednio obniżając koszt.

## Jak to działa

1. Poczekaj na wygaśnięcie TTL cache (domyślnie 5 minut).
2. Znajdź stare wyniki narzędzi do zwykłego przycinania (tekst rozmowy pozostaje bez zmian).
3. **Miękkie przycięcie** zbyt dużych wyników -- zachowaj początek i koniec, wstaw `...`.
4. **Twarde wyczyszczenie** pozostałych -- zastąp placeholderem.
5. Zresetuj TTL, aby kolejne żądania korzystały ze świeżego cache.

## Czyszczenie starszych obrazów

OpenClaw buduje też osobny idempotentny widok odtwarzania dla sesji, które
zachowują surowe bloki obrazów lub znaczniki mediów z hydracji promptu w historii.

- Zachowuje **3 najnowsze ukończone tury** bajt w bajt, aby prefiksy pamięci podręcznej promptu dla ostatnich działań następczych pozostały stabilne.
- W widoku odtwarzania starsze już przetworzone bloki obrazów z historii `user` lub
  `toolResult` mogą zostać zastąpione przez
  `[image data removed - already processed by model]`.
- Starsze tekstowe odwołania do mediów, takie jak `[media attached: ...]`,
  `[Image: source: ...]` i `media://inbound/...`, mogą zostać zastąpione przez
  `[media reference removed - already processed by model]`. Znaczniki załączników bieżącej tury pozostają nienaruszone, aby modele vision nadal mogły hydratuować nowe
  obrazy.
- Surowy transkrypt sesji nie jest przepisywany, więc przeglądarki historii nadal mogą
  renderować oryginalne wpisy wiadomości i ich obrazy.
- To rozwiązanie jest oddzielne od zwykłego przycinania według TTL cache. Istnieje po to, by zatrzymać powtarzające się
  ładunki obrazów lub nieaktualne odwołania do mediów przed psuciem pamięci podręcznej promptów w późniejszych turach.

## Inteligentne wartości domyślne

OpenClaw automatycznie włącza przycinanie dla profili Anthropic:

| Typ profilu                                            | Przycinanie włączone | Heartbeat |
| ------------------------------------------------------ | -------------------- | --------- |
| Uwierzytelnianie Anthropic OAuth/token (w tym ponowne użycie Claude CLI) | Tak                  | 1 godzina |
| Klucz API                                              | Tak                  | 30 min    |

Jeśli ustawisz jawne wartości, OpenClaw ich nie nadpisze.

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

## Przycinanie a Compaction

|            | Przycinanie         | Compaction              |
| ---------- | ------------------- | ----------------------- |
| **Co**     | Przycina wyniki narzędzi | Streszcza rozmowę   |
| **Zapisywane?** | Nie (na żądanie) | Tak (w transkrypcie)    |
| **Zakres** | Tylko wyniki narzędzi | Cała rozmowa         |

Uzupełniają się nawzajem -- przycinanie utrzymuje lekkie wyniki narzędzi pomiędzy
cyklami Compaction.

## Dalsza lektura

- [Compaction](/pl/concepts/compaction) -- redukcja kontekstu oparta na streszczaniu
- [Konfiguracja Gateway](/pl/gateway/configuration) -- wszystkie ustawienia konfiguracyjne przycinania
  (`contextPruning.*`)

## Powiązane

- [Zarządzanie sesjami](/pl/concepts/session)
- [Narzędzia sesji](/pl/concepts/session-tool)
- [Silnik kontekstu](/pl/concepts/context-engine)
