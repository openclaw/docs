---
read_when:
    - Chcesz ograniczyć rozrost kontekstu spowodowany danymi wyjściowymi narzędzi
    - Chcesz zrozumieć optymalizację pamięci podręcznej promptów Anthropic
summary: Usuwanie starych wyników narzędzi w celu zachowania zwięzłego kontekstu i wydajnego buforowania
title: Przycinanie sesji
x-i18n:
    generated_at: "2026-07-12T15:05:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dd5cb4582cb8d9d7265213abe1f5b5893634882b9f8b3ce1deef746293dd07db
    source_path: concepts/session-pruning.md
    workflow: 16
---

Przycinanie sesji usuwa **stare wyniki narzędzi** z kontekstu przed każdym wywołaniem LLM. Ogranicza rozrost kontekstu spowodowany nagromadzonymi wynikami narzędzi (wynikami wykonania poleceń, odczytami plików i wynikami wyszukiwania) bez modyfikowania zwykłego tekstu rozmowy.

<Info>
Przycinanie odbywa się wyłącznie w pamięci — nie modyfikuje zapisanego na dysku transkryptu sesji. Pełna historia jest zawsze zachowywana.
</Info>

## Dlaczego jest to ważne

W długich sesjach gromadzą się wyniki narzędzi, które powiększają okno kontekstu. Zwiększa to koszty i może wymusić [Compaction](/pl/concepts/compaction) wcześniej, niż jest to konieczne.

Przycinanie jest szczególnie przydatne w przypadku **buforowania promptów Anthropic**. Po wygaśnięciu czasu TTL pamięci podręcznej następne żądanie ponownie zapisuje w niej cały prompt. Przycinanie zmniejsza rozmiar zapisu w pamięci podręcznej, bezpośrednio obniżając koszty.

## Jak to działa

Przycinanie działa w trybie `cache-ttl` i jest uzależnione zarówno od kontroli czasu, jak i kontroli rozmiaru kontekstu:

1. Poczekaj na wygaśnięcie czasu TTL pamięci podręcznej (domyślnie 5 minut w przypadku ręcznej konfiguracji; automatyślną wartość domyślną dla Anthropic opisano w sekcji [Inteligentne wartości domyślne](#smart-defaults)). Przed upływem czasu TTL przycinanie jest całkowicie pomijane, aby zachować możliwość ponownego użycia pamięci podręcznej promptu w kolejnych, następujących niedługo po sobie turach.
2. Po upływie czasu TTL oszacuj całkowity rozmiar kontekstu względem okna kontekstu modelu. Jeśli współczynnik jest niższy niż `softTrimRatio` (domyślnie 0,3), pomiń przycinanie i nie resetuj zegara TTL.
3. **Łagodnie przytnij** ponadwymiarowe wyniki narzędzi przekraczające ten współczynnik: zachowaj początek i koniec (domyślnie po 1500 znaków, maksymalnie łącznie 4000 znaków), a pomiędzy nimi wstaw `...`.
4. Jeśli współczynnik nadal jest równy `hardClearRatio` lub wyższy (domyślnie 0,5), a pozostała zawartość narzędzi możliwa do przycięcia ma co najmniej `minPrunableToolChars` znaków (domyślnie 50 000), **całkowicie wyczyść** te wyniki: zastąp ich zawartość symbolem zastępczym (domyślnie `[Wyczyszczono zawartość starego wyniku narzędzia]`).
5. Resetuj zegar TTL tylko wtedy, gdy przycinanie rzeczywiście zmieniło kontekst, aby kolejne żądania ponownie wykorzystywały świeżą pamięć podręczną.

Niezależnie od progów obowiązują dwie reguły bezpieczeństwa: najnowsze tury asystenta w liczbie określonej przez `keepLastAssistants` (domyślnie 3) nigdy nie są przycinane, a nic przed pierwszą wiadomością użytkownika w sesji nie jest przycinane (chroni to początkowe odczyty plików takich jak `SOUL.md`/`USER.md`).

Przycinane mogą być wyłącznie wiadomości `toolResult`; zwykły tekst rozmowy pozostaje niezmieniony. Użyj `agents.defaults.contextPruning.tools.{allow,deny}`, aby określić, które nazwy narzędzi mogą być przycinane.

## Czyszczenie starszych obrazów

OpenClaw tworzy również osobny, idempotentny widok odtwarzania dla sesji, które przechowują w historii nieprzetworzone bloki obrazów lub znaczniki multimediów używane podczas wczytywania promptu.

- Zachowuje **3 najnowsze zakończone tury** bajt po bajcie, dzięki czemu prefiksy pamięci podręcznej promptu pozostają stabilne dla ostatnich kolejnych żądań. Liczba ta obejmuje wszystkie zakończone tury, nie tylko te zawierające obrazy, dlatego tury zawierające wyłącznie tekst również wykorzystują to okno.
- W widoku odtwarzania starsze, już przetworzone bloki obrazów z historii `user` lub `toolResult` są zastępowane tekstem `[usunięto dane obrazu — zostały już przetworzone przez model]`.
- Starsze tekstowe odwołania do multimediów, takie jak `[media attached: ...]`, `[Image: source: ...]` i `media://inbound/...`, są zastępowane tekstem `[usunięto odwołanie do multimediów — zostało już przetworzone przez model]`. Znaczniki załączników z bieżącej tury pozostają nienaruszone, aby modele obsługujące przetwarzanie obrazu nadal mogły wczytywać nowe obrazy.
- Nieprzetworzony transkrypt sesji nie jest modyfikowany, dlatego przeglądarki historii nadal mogą wyświetlać oryginalne wpisy wiadomości i zawarte w nich obrazy.
- Mechanizm ten jest niezależny od opisanego powyżej standardowego przycinania na podstawie czasu TTL pamięci podręcznej. Zapobiega wielokrotnemu unieważnianiu pamięci podręcznej promptu przez powtarzające się dane obrazów lub nieaktualne odwołania do multimediów w późniejszych turach.

## Inteligentne wartości domyślne

Dołączony Plugin Anthropic automatycznie konfiguruje przycinanie i częstotliwość Heartbeat przy pierwszym rozpoznaniu profilu uwierzytelniania Anthropic (lub Claude CLI), ale tylko w przypadku pól, których nie ustawiono wcześniej jawnie:

| Tryb uwierzytelniania                           | `contextPruning.mode` | `contextPruning.ttl` | `heartbeat.every` |
| ----------------------------------------------- | --------------------- | -------------------- | ----------------- |
| OAuth/token (w tym ponowne użycie Claude CLI)   | `cache-ttl`           | `1h`                 | `1h`              |
| Klucz API                                       | `cache-ttl`           | `1h`                 | `30m`             |

Jeśli samodzielnie ustawisz `agents.defaults.contextPruning.mode` lub `agents.defaults.heartbeat.every`, OpenClaw ich nie zastąpi. Ta automatyczna wartość domyślna jest stosowana tylko do uwierzytelniania z rodziny Anthropic; w przypadku innych dostawców przycinanie ma wartość `off`, o ile nie zostanie skonfigurowane.

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

Aby je wyłączyć: ustaw `mode: "off"`.

## Przycinanie a Compaction

|                 | Przycinanie               | Compaction              |
| --------------- | ------------------------- | ----------------------- |
| **Działanie**   | Przycina wyniki narzędzi  | Podsumowuje rozmowę     |
| **Zapisywane?** | Nie (dla każdego żądania) | Tak (w transkrypcie)    |
| **Zakres**      | Tylko wyniki narzędzi     | Cała rozmowa            |

Mechanizmy te wzajemnie się uzupełniają — przycinanie ogranicza rozmiar wyników narzędzi między cyklami Compaction.

## Dalsze informacje

- [Compaction](/pl/concepts/compaction): ograniczanie kontekstu na podstawie podsumowania
- [Konfiguracja Gateway](/pl/gateway/configuration): wszystkie ustawienia przycinania (`contextPruning.*`)

## Powiązane

- [Zarządzanie sesjami](/pl/concepts/session)
- [Narzędzia sesji](/pl/concepts/session-tool)
- [Mechanizm kontekstu](/pl/concepts/context-engine)
