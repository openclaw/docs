---
read_when:
    - Chcesz wyszukiwania w sieci obsługiwanego przez Tavily
    - Potrzebujesz klucza API Tavily
    - Chcesz używać Tavily jako dostawcy web_search
    - Chcesz wyodrębniać treści z adresów URL
summary: Narzędzia wyszukiwania i wyodrębniania Tavily
title: Tavily
x-i18n:
    generated_at: "2026-06-27T18:31:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 539e76120e858129dabfb85c1fe379837fc87be491d5a57803917bf6bb7018ae
    source_path: tools/tavily.md
    workflow: 16
---

[Tavily](https://tavily.com) to API wyszukiwania zaprojektowane dla aplikacji AI. OpenClaw udostępnia je na dwa sposoby:

- jako dostawcę `web_search` dla ogólnego narzędzia wyszukiwania
- jako jawne narzędzia Plugin: `tavily_search` i `tavily_extract`

Tavily zwraca wyniki strukturalne zoptymalizowane pod kątem użycia przez LLM, z konfigurowalną głębokością wyszukiwania, filtrowaniem tematów, filtrami domen, wygenerowanymi przez AI podsumowaniami odpowiedzi oraz ekstrakcją treści z URL-i (w tym stron renderowanych przez JavaScript).

| Właściwość       | Wartość                             |
| ---------------- | ----------------------------------- |
| Identyfikator Plugin | `tavily`                        |
| Pakiet           | `@openclaw/tavily-plugin`           |
| Uwierzytelnianie | `TAVILY_API_KEY` lub config `apiKey` |
| Bazowy URL       | `https://api.tavily.com` (domyślnie) |
| Narzędzia        | `tavily_search`, `tavily_extract`   |

## Pierwsze kroki

<Steps>
  <Step title="Install the plugin">
    ```bash
    openclaw plugins install @openclaw/tavily-plugin
    ```
  </Step>
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
    Wywołaj `web_search` z dowolnego agenta albo wywołaj bezpośrednio `tavily_search`.
  </Step>
</Steps>

<Tip>
Wybranie Tavily podczas onboardingu albo przez `openclaw configure --section web` instaluje i włącza oficjalny Tavily Plugin, gdy jest potrzebny.
</Tip>

## Dokumentacja narzędzi

### `tavily_search`

Użyj tego narzędzia, gdy potrzebujesz sterowania wyszukiwaniem specyficznego dla Tavily zamiast ogólnego `web_search`.

| Parametr          | Typ          | Ograniczenia / domyślnie              | Opis                                            |
| ----------------- | ------------ | -------------------------------------- | ----------------------------------------------- |
| `query`           | string       | wymagane                              | Tekst zapytania wyszukiwania. Nie przekraczaj 400 znaków. |
| `search_depth`    | enum         | `basic` (domyślnie), `advanced`       | `advanced` jest wolniejsze, ale daje większą trafność. |
| `topic`           | enum         | `general` (domyślnie), `news`, `finance` | Filtruj według rodziny tematów.              |
| `max_results`     | integer      | 1-20                                   | Liczba wyników.                                 |
| `include_answer`  | boolean      | domyślnie `false`                      | Dołącz wygenerowane przez AI podsumowanie odpowiedzi Tavily. |
| `time_range`      | enum         | `day`, `week`, `month`, `year`         | Filtruj wyniki według świeżości.                |
| `include_domains` | string array | (brak)                                 | Uwzględnij tylko wyniki z tych domen.           |
| `exclude_domains` | string array | (brak)                                 | Wyklucz wyniki z tych domen.                    |

Kompromis głębokości wyszukiwania:

| Głębokość | Szybkość | Trafność | Najlepsze do                         |
| --------- | -------- | -------- | ------------------------------------ |
| `basic`   | Szybsze  | Wysoka   | Zapytania ogólnego przeznaczenia (domyślnie). |
| `advanced` | Wolniejsze | Najwyższa | Precyzyjne badania i ustalanie faktów. |

### `tavily_extract`

Użyj tego narzędzia, aby wyodrębnić czystą treść z jednego lub wielu URL-i. Obsługuje strony renderowane przez JavaScript i wspiera porcjowanie ukierunkowane zapytaniem dla celowanej ekstrakcji.

| Parametr           | Typ          | Ograniczenia / domyślnie      | Opis                                                        |
| ------------------- | ------------ | ----------------------------- | ----------------------------------------------------------- |
| `urls`              | string array | wymagane, 1-20                | URL-e, z których należy wyodrębnić treść.                   |
| `query`             | string       | (opcjonalne)                  | Ponownie szereguj wyodrębnione fragmenty według trafności względem tego zapytania. |
| `extract_depth`     | enum         | `basic` (domyślnie), `advanced` | Użyj `advanced` dla stron intensywnie korzystających z JS, SPA lub dynamicznych tabel. |
| `chunks_per_source` | integer      | 1-5; **wymaga `query`**       | Fragmenty zwracane na URL. Powoduje błąd, jeśli ustawione bez `query`. |
| `include_images`    | boolean      | domyślnie `false`             | Dołącz URL-e obrazów w wynikach.                            |

Kompromis głębokości ekstrakcji:

| Głębokość | Kiedy używać                              |
| --------- | ------------------------------------------ |
| `basic`   | Proste strony. Wypróbuj najpierw to.       |
| `advanced` | SPA renderowane przez JS, dynamiczna treść, tabele. |

<Tip>
Dziel większe listy URL-i na wiele wywołań `tavily_extract` (maks. 20 na żądanie). Użyj `query` wraz z `chunks_per_source`, aby uzyskać tylko istotną treść zamiast pełnych stron.
</Tip>

## Wybór właściwego narzędzia

| Potrzeba                              | Narzędzie        |
| ------------------------------------- | ---------------- |
| Szybkie wyszukiwanie w sieci, bez specjalnych opcji | `web_search` |
| Wyszukiwanie z głębokością, tematem, odpowiedziami AI | `tavily_search` |
| Ekstrakcja treści z konkretnych URL-i | `tavily_extract` |

<Note>
Ogólne narzędzie `web_search` z Tavily jako dostawcą obsługuje `query` i `count` (do 20 wyników). Aby użyć opcji specyficznych dla Tavily (`search_depth`, `topic`, `include_answer`, filtry domen, zakres czasu), użyj zamiast tego `tavily_search`.
</Note>

## Zaawansowana konfiguracja

<AccordionGroup>
  <Accordion title="API key resolution order">
    Klient Tavily wyszukuje swój klucz API w tej kolejności:

    1. `plugins.entries.tavily.config.webSearch.apiKey` (rozwiązywane przez SecretRefs).
    2. `TAVILY_API_KEY` ze środowiska Gateway.

    `tavily_extract` zgłasza błąd konfiguracji, jeśli żadne z nich nie jest obecne.

  </Accordion>

  <Accordion title="Custom base URL">
    Nadpisz `plugins.entries.tavily.config.webSearch.baseUrl`, jeśli udostępniasz Tavily przez proxy. Wartość domyślna to `https://api.tavily.com`.
  </Accordion>

  <Accordion title="`chunks_per_source` requires `query`">
    `tavily_extract` odrzuca wywołania, które przekazują `chunks_per_source` bez `query`. Tavily klasyfikuje fragmenty według trafności zapytania, więc bez niego parametr nie ma znaczenia.
  </Accordion>
</AccordionGroup>

## Powiązane

<CardGroup cols={2}>
  <Card title="Web Search overview" href="/pl/tools/web" icon="magnifying-glass">
    Wszyscy dostawcy i reguły automatycznego wykrywania.
  </Card>
  <Card title="Firecrawl" href="/pl/tools/firecrawl" icon="fire">
    Wyszukiwanie plus scraping z ekstrakcją treści.
  </Card>
  <Card title="Exa Search" href="/pl/tools/exa-search" icon="binoculars">
    Wyszukiwanie neuronowe z ekstrakcją treści.
  </Card>
  <Card title="Configuration" href="/pl/gateway/configuration" icon="gear">
    Pełny schemat konfiguracji wpisów Plugin i routingu narzędzi.
  </Card>
</CardGroup>
