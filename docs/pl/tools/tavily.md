---
read_when:
    - Chcesz wyszukiwać w internecie za pomocą Tavily
    - Potrzebujesz klucza API Tavily
    - Chcesz używać Tavily jako dostawcy web_search
    - Chcesz wyodrębniać treść z adresów URL
summary: Narzędzia wyszukiwania i wyodrębniania Tavily
title: Tavily
x-i18n:
    generated_at: "2026-07-12T15:41:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9a61351872eb8aecb0b3ada9b573ee8d3db1dcec3d7bd74074446fbe9dc1f274
    source_path: tools/tavily.md
    workflow: 16
---

[Tavily](https://tavily.com) to interfejs API wyszukiwania zaprojektowany dla aplikacji AI. OpenClaw udostępnia go na dwa sposoby:

- jako dostawcę `web_search` dla ogólnego narzędzia wyszukiwania
- jako jawne narzędzia pluginu: `tavily_search` i `tavily_extract`

Tavily zwraca ustrukturyzowane wyniki zoptymalizowane pod kątem wykorzystania przez modele LLM, z konfigurowalną głębokością wyszukiwania, filtrowaniem tematów i domen, generowanymi przez AI podsumowaniami odpowiedzi oraz wyodrębnianiem treści z adresów URL (w tym ze stron renderowanych przy użyciu JavaScriptu).

| Właściwość    | Wartość                                                                                                      |
| ------------- | ------------------------------------------------------------------------------------------------------------ |
| Identyfikator pluginu | `tavily`                                                                                             |
| Pakiet        | `@openclaw/tavily-plugin`                                                                                    |
| Uwierzytelnianie | zmienna środowiskowa `TAVILY_API_KEY` lub ustawienie `apiKey`                                             |
| Bazowy adres URL | `https://api.tavily.com` (domyślnie); zmienna środowiskowa `TAVILY_BASE_URL` lub ustawienie `baseUrl`, aby go zastąpić |
| Limity czasu  | 30 s dla wyszukiwania, 60 s dla wyodrębniania (domyślnie)                                                    |
| Narzędzia     | `tavily_search`, `tavily_extract`                                                                            |

## Pierwsze kroki

<Steps>
  <Step title="Zainstaluj plugin">
    ```bash
    openclaw plugins install @openclaw/tavily-plugin
    ```
  </Step>
  <Step title="Uzyskaj klucz API">
    Utwórz konto Tavily na stronie [tavily.com](https://tavily.com), a następnie wygeneruj klucz API w panelu.
  </Step>
  <Step title="Skonfiguruj plugin i dostawcę">
    ```json5
    {
      plugins: {
        entries: {
          tavily: {
            enabled: true,
            config: {
              webSearch: {
                apiKey: "tvly-...", // opcjonalne, jeśli ustawiono TAVILY_API_KEY
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
  <Step title="Sprawdź działanie wyszukiwania">
    Uruchom `web_search` z dowolnego agenta lub wywołaj bezpośrednio `tavily_search`.
  </Step>
</Steps>

<Tip>
Wybranie Tavily podczas wdrażania lub w poleceniu `openclaw configure --section web` instaluje i włącza oficjalny plugin Tavily, gdy jest potrzebny.
</Tip>

## Dokumentacja narzędzi

### `tavily_search`

Użyj tego narzędzia, gdy potrzebujesz ustawień wyszukiwania specyficznych dla Tavily zamiast ogólnego narzędzia `web_search`.

| Parametr          | Typ              | Ograniczenia / wartość domyślna         | Opis                                                   |
| ----------------- | ---------------- | --------------------------------------- | ------------------------------------------------------ |
| `query`           | ciąg znaków      | wymagany                                | Ciąg zapytania wyszukiwania.                            |
| `search_depth`    | wyliczenie       | `basic` (domyślnie), `advanced`         | `advanced` działa wolniej, ale zapewnia większą trafność. |
| `topic`           | wyliczenie       | `general` (domyślnie), `news`, `finance` | Filtrowanie według kategorii tematycznej.              |
| `max_results`     | liczba całkowita | 1–20, domyślnie `5`                     | Liczba wyników.                                         |
| `include_answer`  | wartość logiczna | domyślnie `false`                       | Dołącza wygenerowane przez AI Tavily podsumowanie odpowiedzi. |
| `time_range`      | wyliczenie       | `day`, `week`, `month`, `year`          | Filtrowanie wyników według aktualności.                 |
| `include_domains` | tablica ciągów znaków | (brak)                              | Uwzględnia tylko wyniki z tych domen.                   |
| `exclude_domains` | tablica ciągów znaków | (brak)                              | Wyklucza wyniki z tych domen.                           |

Kompromis dotyczący głębokości wyszukiwania:

| Głębokość  | Szybkość | Trafność  | Najlepsze zastosowanie                              |
| ---------- | -------- | --------- | --------------------------------------------------- |
| `basic`    | Większa  | Wysoka    | Zapytania ogólnego przeznaczenia (domyślnie).       |
| `advanced` | Mniejsza | Najwyższa | Precyzyjne badania i wyszukiwanie informacji.       |

### `tavily_extract`

Użyj tego narzędzia, aby wyodrębnić uporządkowaną treść z jednego lub wielu adresów URL. Obsługuje strony renderowane przy użyciu JavaScriptu i dzielenie treści na fragmenty ukierunkowane na zapytanie, co umożliwia precyzyjne wyodrębnianie.

| Parametr            | Typ                  | Ograniczenia / wartość domyślna | Opis                                                               |
| ------------------- | -------------------- | ------------------------------- | ------------------------------------------------------------------ |
| `urls`              | tablica ciągów znaków | wymagany, 1–20                 | Adresy URL, z których ma zostać wyodrębniona treść.                 |
| `query`             | ciąg znaków          | (opcjonalny)                    | Ponownie porządkuje wyodrębnione fragmenty według trafności względem tego zapytania. |
| `extract_depth`     | wyliczenie           | `basic` (domyślnie), `advanced` | Użyj `advanced` w przypadku stron intensywnie korzystających z JS, aplikacji SPA lub dynamicznych tabel. |
| `chunks_per_source` | liczba całkowita     | 1–5; **wymaga `query`**         | Liczba fragmentów zwracanych dla każdego adresu URL. Ustawienie bez `query` powoduje błąd. |
| `include_images`    | wartość logiczna     | domyślnie `false`               | Dołącza adresy URL obrazów do wyników.                              |

Kompromis dotyczący głębokości wyodrębniania:

| Głębokość  | Kiedy używać                                      |
| ---------- | ------------------------------------------------- |
| `basic`    | Proste strony. Wypróbuj tę opcję najpierw.        |
| `advanced` | Aplikacje SPA renderowane przy użyciu JS, treści dynamiczne, tabele. |

<Tip>
Dziel większe listy adresów URL na wiele wywołań `tavily_extract` (maksymalnie 20 na żądanie). Użyj `query` wraz z `chunks_per_source`, aby uzyskać tylko odpowiednią treść zamiast całych stron.
</Tip>

## Wybór odpowiedniego narzędzia

| Potrzeba                                           | Narzędzie         |
| -------------------------------------------------- | ----------------- |
| Szybkie wyszukiwanie w internecie bez opcji specjalnych | `web_search` |
| Wyszukiwanie z określeniem głębokości, tematu i odpowiedziami AI | `tavily_search` |
| Wyodrębnianie treści z określonych adresów URL     | `tavily_extract`  |

<Note>
Ogólne narzędzie `web_search` z Tavily jako dostawcą obsługuje parametry `query` i `count` (do 20 wyników). Aby skorzystać z ustawień specyficznych dla Tavily (`search_depth`, `topic`, `include_answer`, filtrów domen i zakresu czasu), użyj zamiast niego `tavily_search`.
</Note>

## Konfiguracja zaawansowana

<AccordionGroup>
  <Accordion title="Kolejność rozpoznawania klucza API">
    Klient Tavily wyszukuje klucz API w następującej kolejności:

    1. `plugins.entries.tavily.config.webSearch.apiKey` (rozpoznawany za pośrednictwem SecretRefs).
    2. `TAVILY_API_KEY` ze środowiska Gateway.

    Zarówno `tavily_search`, jak i `tavily_extract` zgłaszają błąd konfiguracji, jeśli żadna z tych wartości nie jest dostępna.

  </Accordion>

  <Accordion title="Niestandardowy bazowy adres URL">
    Jeśli korzystasz z Tavily za pośrednictwem serwera proxy, zastąp wartość `plugins.entries.tavily.config.webSearch.baseUrl` lub ustaw `TAVILY_BASE_URL`. Konfiguracja ma pierwszeństwo przed zmienną środowiskową. Wartość domyślna to `https://api.tavily.com`.
  </Accordion>

  <Accordion title="`chunks_per_source` wymaga `query`">
    `tavily_extract` odrzuca wywołania przekazujące `chunks_per_source` bez parametru `query`. Tavily szereguje fragmenty według trafności względem zapytania, dlatego bez niego ten parametr nie ma znaczenia.
  </Accordion>
</AccordionGroup>

## Powiązane materiały

<CardGroup cols={2}>
  <Card title="Omówienie wyszukiwania internetowego" href="/pl/tools/web" icon="magnifying-glass">
    Wszyscy dostawcy i reguły automatycznego wykrywania.
  </Card>
  <Card title="Firecrawl" href="/pl/tools/firecrawl" icon="fire">
    Wyszukiwanie i pobieranie danych z wyodrębnianiem treści.
  </Card>
  <Card title="Wyszukiwanie Exa" href="/pl/tools/exa-search" icon="binoculars">
    Wyszukiwanie neuronowe z wyodrębnianiem treści.
  </Card>
  <Card title="Konfiguracja" href="/pl/gateway/configuration" icon="gear">
    Pełny schemat konfiguracji wpisów pluginów i routingu narzędzi.
  </Card>
</CardGroup>
