---
read_when:
    - Chcesz samodzielnie hostowanego dostawcę wyszukiwania internetowego
    - Chcesz używać SearXNG do web_search
    - Potrzebujesz opcji wyszukiwania ukierunkowanej na prywatność lub działającej w środowisku odizolowanym od sieci
summary: Wyszukiwanie internetowe SearXNG — samodzielnie hostowany dostawca metawyszukiwania niewymagający klucza
title: Wyszukiwanie SearXNG
x-i18n:
    generated_at: "2026-07-12T15:46:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cae8de9f8e2c8dd9cec615adb48da5c1fd7654bffe96c7afc1acea3effbcf1fc
    source_path: tools/searxng-search.md
    workflow: 16
---

OpenClaw obsługuje [SearXNG](https://docs.searxng.org/) jako **samodzielnie hostowanego,
niewymagającego klucza** dostawcę `web_search`. SearXNG to metawyszukiwarka o otwartym kodzie źródłowym,
która agreguje wyniki z Google, Bing, DuckDuckGo i innych źródeł.

Zalety:

- **Bezpłatne i bez limitów** -- nie wymaga klucza API ani komercyjnej subskrypcji
- **Prywatność / izolacja sieciowa** -- zapytania nigdy nie opuszczają Twojej sieci
- **Działa wszędzie** -- brak ograniczeń regionalnych komercyjnych interfejsów API wyszukiwania

## Konfiguracja

<Steps>
  <Step title="Zainstaluj Plugin">
    ```bash
    openclaw plugins install @openclaw/searxng-plugin
    ```
  </Step>
  <Step title="Uruchom instancję SearXNG">
    ```bash
    docker run -d -p 8888:8080 searxng/searxng
    ```

    Możesz również użyć dowolnego istniejącego wdrożenia SearXNG, do którego masz dostęp. Instrukcje dotyczące
    konfiguracji produkcyjnej znajdziesz w [dokumentacji SearXNG](https://docs.searxng.org/).

  </Step>
  <Step title="Skonfiguruj">
    ```bash
    openclaw configure --section web
    # Wybierz "searxng" jako dostawcę
    ```

    Możesz też ustawić zmienną środowiskową i pozwolić mechanizmowi automatycznego wykrywania ją znaleźć:

    ```bash
    export SEARXNG_BASE_URL="http://localhost:8888"
    ```

  </Step>
</Steps>

## Konfiguracja

```json5
{
  tools: {
    web: {
      search: {
        provider: "searxng",
      },
    },
  },
}
```

Ustawienia instancji SearXNG na poziomie Pluginu:

```json5
{
  plugins: {
    entries: {
      searxng: {
        config: {
          webSearch: {
            baseUrl: "http://localhost:8888",
            categories: "general,news", // opcjonalne
            language: "en", // opcjonalne
          },
        },
      },
    },
  },
}
```

`baseUrl` akceptuje również obiekt SecretRef (na przykład `{ source: "env", id: "SEARXNG_BASE_URL" }`).

## Zmienna środowiskowa

Jako alternatywę dla konfiguracji ustaw `SEARXNG_BASE_URL`:

```bash
export SEARXNG_BASE_URL="http://localhost:8888"
```

Kolejność rozpoznawania: skonfigurowany ciąg `baseUrl`, następnie wbudowany SecretRef zmiennej środowiskowej w
`baseUrl`, a następnie `SEARXNG_BASE_URL`. Gdy żadna ze ścieżek konfiguracji nie jest ustawiona,
zmienna `SEARXNG_BASE_URL` jest dostępna i nie wybrano jawnie dostawcy, mechanizm automatycznego wykrywania
wybiera SearXNG.

## Dokumentacja konfiguracji Pluginu

| Pole         | Opis                                                               |
| ------------ | ------------------------------------------------------------------ |
| `baseUrl`    | Bazowy adres URL instancji SearXNG (wymagany)                       |
| `categories` | Kategorie rozdzielone przecinkami, takie jak `general`, `news` lub `science` |
| `language`   | Kod języka wyników, taki jak `en`, `de` lub `fr`                    |

Wywołanie narzędzia `web_search` akceptuje również parametry `count` (1–10 wyników), `categories`
i `language` jako ustawienia zastępujące dla poszczególnych wywołań.

## Uwagi

- **API JSON** -- korzysta z natywnego punktu końcowego `format=json` SearXNG, a nie z pozyskiwania danych z HTML
- **Adresy URL wyników graficznych** -- wyniki z kategorii obrazów zawierają `img_src`, gdy SearXNG
  zwraca bezpośredni adres URL obrazu
- **Bez klucza API** -- działa od razu z dowolną instancją SearXNG
- **Walidacja bazowego adresu URL** -- `baseUrl` musi być prawidłowym adresem URL `http://` lub `https://`
- **Ochrona sieciowa** -- bazowe adresy URL `http://` muszą wskazywać zaufany prywatny host lub
  local loopback (hosty publiczne muszą używać `https://`); bazowe adresy URL `https://`, które
  są rozpoznawane jako adres prywatny lub wewnętrzny, otrzymują takie samo zezwolenie dla samodzielnego hostowania,
  natomiast bazowe adresy URL `https://`, które są rozpoznawane jako publiczne, zachowują ścisłą ochronę przed SSRF
- **Kolejność automatycznego wykrywania** -- SearXNG wymaga skonfigurowanego `baseUrl` (pozycja
  200 wśród dostawców, którzy mają już wymagane dane uwierzytelniające). Dostawcy niewymagający klucza,
  tacy jak DuckDuckGo lub Ollama Web Search, nigdy nie są wybierani niejawnie przez automatyczne wykrywanie;
  aktywują się tylko po jawnym wyborze `provider`
- **Samodzielne hostowanie** -- kontrolujesz instancję, zapytania i nadrzędne wyszukiwarki
- **Kategorie** domyślnie przyjmują wartość `general`, jeśli nie zostały skonfigurowane
- **Mechanizm zastępczy kategorii** -- jeśli żądanie kategorii innej niż `general` zakończy się powodzeniem, ale
  zwróci zero wyników, OpenClaw ponowi to samo zapytanie jeden raz z kategorią `general`,
  zanim zwróci pusty zestaw wyników
- **Buforowanie wyników** -- identyczne zapytania (to samo zapytanie, liczba wyników, kategorie,
  język i bazowy adres URL) są przez krótki czas TTL przechowywane w pamięci podręcznej procesu
- **Wymagana wersja** -- Plugin deklaruje `minHostVersion: >=2026.6.9`

<Tip>
  Aby interfejs API JSON SearXNG działał, upewnij się, że w instancji SearXNG włączono format `json`
  w pliku `settings.yml` w sekcji `search.formats`.
</Tip>

## Powiązane

- [Omówienie wyszukiwania internetowego](/pl/tools/web) -- wszyscy dostawcy i automatyczne wykrywanie
- [Wyszukiwanie DuckDuckGo](/pl/tools/duckduckgo-search) -- kolejny dostawca niewymagający klucza
- [Wyszukiwanie Brave](/pl/tools/brave-search) -- ustrukturyzowane wyniki z bezpłatnym pakietem
