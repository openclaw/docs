---
read_when:
    - Chcesz wyszukiwania w sieci opartego na Tavily
    - Wymagany jest klucz API Tavily
    - Chcesz używać Tavily jako dostawcy web_search
    - Chcesz wyodrębniać treści z adresów URL
summary: Narzędzia Tavily do wyszukiwania i wyodrębniania
title: Tavily
x-i18n:
    generated_at: "2026-05-10T19:59:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 071e2b1be054890711e32d7424d16d94133d16ff1ce7da3703e62c53b5c217ef
    source_path: tools/tavily.md
    workflow: 16
---

[Tavily](https://tavily.com) to API wyszukiwania zaprojektowane dla aplikacji AI. OpenClaw udostępnia je na dwa sposoby:

- jako dostawcę `web_search` dla ogólnego narzędzia wyszukiwania
- jako jawne narzędzia Plugin: `tavily_search` i `tavily_extract`

Tavily zwraca uporządkowane wyniki zoptymalizowane pod użycie przez LLM, z konfigurowalną głębokością wyszukiwania, filtrowaniem tematów, filtrami domen, generowanymi przez AI podsumowaniami odpowiedzi oraz wyodrębnianiem treści z URL-i (w tym stron renderowanych przez JavaScript).

| Właściwość        | Wartość                             |
| ----------------- | ----------------------------------- |
| Identyfikator Plugin | `tavily`                         |
| Uwierzytelnianie  | `TAVILY_API_KEY` lub config `apiKey` |
| Bazowy URL        | `https://api.tavily.com` (domyślnie) |
| Dołączone narzędzia | `tavily_search`, `tavily_extract` |

## Pierwsze kroki

<Steps>
  <Step title="Get an API key">
    Utwórz konto Tavily na [tavily.com](https://tavily.com), a następnie wygeneruj klucz API w panelu.
  </Step>
  <Step title="Configure the plugin and provider">
    ```json5
    {
      plugins: {
        entries: {
          tavily: {
            enabled: true,
            config: {
              webSearch: {
                apiKey: "tvly-...", // optional if TAVILY_API_KEY is set
                baseUrl: "https://api.tavily.com",
              },
            },
          },
        },
      },
      tools: {
        web: {
          search: {
            provider: "tavily",
          },
        },
      },
    }
    ```
  </Step>
  <Step title="Verify search runs">
    Uruchom `web_search` z dowolnego agenta albo wywołaj bezpośrednio `tavily_search`.
  </Step>
</Steps>

<Tip>
Wybranie Tavily podczas onboardingu lub przez `openclaw configure --section web` automatycznie włącza dołączony Plugin Tavily.
</Tip>

## Dokumentacja narzędzi

### `tavily_search`

Użyj tego, gdy potrzebujesz kontrolek wyszukiwania specyficznych dla Tavily zamiast ogólnego `web_search`.

| Parametr          | Typ          | Ograniczenia / domyślne               | Opis                                            |
| ----------------- | ------------ | -------------------------------------- | ----------------------------------------------- |
| `query`           | string       | wymagane                              | Ciąg zapytania wyszukiwania. Nie przekraczaj 400 znaków. |
| `search_depth`    | enum         | `basic` (domyślnie), `advanced`       | `advanced` jest wolniejsze, ale trafniejsze.    |
| `topic`           | enum         | `general` (domyślnie), `news`, `finance` | Filtruj według rodziny tematów.              |
| `max_results`     | integer      | 1-20                                   | Liczba wyników.                                 |
| `include_answer`  | boolean      | domyślnie `false`                     | Dołącz wygenerowane przez Tavily AI podsumowanie odpowiedzi. |
| `time_range`      | enum         | `day`, `week`, `month`, `year`        | Filtruj wyniki według aktualności.              |
| `include_domains` | string array | (brak)                                | Uwzględniaj tylko wyniki z tych domen.          |
| `exclude_domains` | string array | (brak)                                | Wyklucz wyniki z tych domen.                    |

Kompromis głębokości wyszukiwania:

| Głębokość  | Szybkość | Trafność  | Najlepsze do                          |
| ---------- | -------- | --------- | ------------------------------------ |
| `basic`    | Szybsze  | Wysoka    | Zapytania ogólnego przeznaczenia (domyślnie). |
| `advanced` | Wolniejsze | Najwyższa | Precyzyjne badania i ustalanie faktów. |

### `tavily_extract`

Użyj tego, aby wyodrębnić czystą treść z jednego lub wielu URL-i. Obsługuje strony renderowane przez JavaScript i wspiera dzielenie na fragmenty ukierunkowane zapytaniem na potrzeby celowanego wyodrębniania.

| Parametr           | Typ          | Ograniczenia / domyślne      | Opis                                                     |
| ------------------- | ------------ | ----------------------------- | -------------------------------------------------------- |
| `urls`              | string array | wymagane, 1-20                | URL-e, z których należy wyodrębnić treść.                |
| `query`             | string       | (opcjonalne)                  | Ponownie uszereguj wyodrębnione fragmenty według trafności względem tego zapytania. |
| `extract_depth`     | enum         | `basic` (domyślnie), `advanced` | Użyj `advanced` dla stron mocno opartych na JS, SPA lub dynamicznych tabel. |
| `chunks_per_source` | integer      | 1-5; **wymaga `query`**       | Fragmenty zwracane na URL. Zwraca błąd, jeśli ustawione bez `query`. |
| `include_images`    | boolean      | domyślnie `false`             | Dołącz URL-e obrazów w wynikach.                         |

Kompromis głębokości wyodrębniania:

| Głębokość  | Kiedy używać                               |
| ---------- | ------------------------------------------ |
| `basic`    | Proste strony. Wypróbuj to najpierw.       |
| `advanced` | SPA renderowane przez JS, treść dynamiczna, tabele. |

<Tip>
Dziel większe listy URL-i na wiele wywołań `tavily_extract` (maks. 20 na żądanie). Użyj `query` wraz z `chunks_per_source`, aby otrzymać tylko odpowiednią treść zamiast pełnych stron.
</Tip>

## Wybór właściwego narzędzia

| Potrzeba                              | Narzędzie        |
| ------------------------------------- | ---------------- |
| Szybkie wyszukiwanie w sieci, bez opcji specjalnych | `web_search` |
| Wyszukiwanie z głębokością, tematem, odpowiedziami AI | `tavily_search` |
| Wyodrębnianie treści z konkretnych URL-i | `tavily_extract` |

<Note>
Ogólne narzędzie `web_search` z Tavily jako dostawcą obsługuje `query` i `count` (do 20 wyników). Aby użyć kontrolek specyficznych dla Tavily (`search_depth`, `topic`, `include_answer`, filtry domen, zakres czasu), użyj zamiast tego `tavily_search`.
</Note>

## Konfiguracja zaawansowana

<AccordionGroup>
  <Accordion title="API key resolution order">
    Klient Tavily wyszukuje swój klucz API w tej kolejności:

    1. `plugins.entries.tavily.config.webSearch.apiKey` (rozwiązywane przez SecretRefs).
    2. `TAVILY_API_KEY` ze środowiska Gateway.

    `tavily_extract` zgłasza błąd konfiguracji, jeśli żadne z nich nie jest dostępne.

  </Accordion>

  <Accordion title="Custom base URL">
    Nadpisz `plugins.entries.tavily.config.webSearch.baseUrl`, jeśli udostępniasz Tavily przez proxy. Domyślna wartość to `https://api.tavily.com`.
  </Accordion>

  <Accordion title="`chunks_per_source` requires `query`">
    `tavily_extract` odrzuca wywołania, które przekazują `chunks_per_source` bez `query`. Tavily szereguje fragmenty według trafności zapytania, więc parametr jest bez niego bez znaczenia.
  </Accordion>
</AccordionGroup>

## Powiązane

<CardGroup cols={2}>
  <Card title="Web Search overview" href="/pl/tools/web" icon="magnifying-glass">
    Wszyscy dostawcy i reguły automatycznego wykrywania.
  </Card>
  <Card title="Firecrawl" href="/pl/tools/firecrawl" icon="fire">
    Wyszukiwanie oraz scraping z wyodrębnianiem treści.
  </Card>
  <Card title="Exa Search" href="/pl/tools/exa-search" icon="binoculars">
    Wyszukiwanie neuronowe z wyodrębnianiem treści.
  </Card>
  <Card title="Configuration" href="/pl/gateway/configuration" icon="gear">
    Pełny schemat konfiguracji wpisów Plugin i routingu narzędzi.
  </Card>
</CardGroup>
