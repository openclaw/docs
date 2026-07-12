---
read_when:
    - Chcesz używać Grok do wyszukiwania w internecie
    - Chcesz używać OAuth xAI lub klucza XAI_API_KEY do wyszukiwania w internecie
summary: Wyszukiwanie w sieci Grok za pośrednictwem odpowiedzi xAI opartych na danych z sieci
title: Wyszukiwanie Grok
x-i18n:
    generated_at: "2026-07-12T15:45:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6e39edd660d0ffe8be066ae81317810da691a7dbd8c59a74222a59145cff5c77
    source_path: tools/grok-search.md
    workflow: 16
---

OpenClaw obsługuje Grok jako dostawcę `web_search`, wykorzystując odpowiedzi xAI
oparte na danych z internetu do generowania przez AI odpowiedzi popartych aktualnymi
wynikami wyszukiwania wraz z cytowaniami.

Wyszukiwanie internetowe Grok preferuje istniejące logowanie OAuth xAI, jeśli jest
dostępne. Jeśli profil OAuth nie istnieje, ten sam klucz API xAI obsługuje również
wbudowane narzędzie `x_search` do wyszukiwania postów w serwisie X (dawniej Twitter)
oraz narzędzie `code_execution`. Zapisanie klucza w
`plugins.entries.xai.config.webSearch.apiKey` pozwala również OpenClaw ponownie użyć
go jako rozwiązania zapasowego dla dołączonego dostawcy modeli xAI.

Aby uzyskać metryki poszczególnych postów w serwisie X (reposty, odpowiedzi, zakładki,
wyświetlenia), użyj [`x_search`](/pl/tools/web#x_search) z dokładnym adresem URL posta
lub identyfikatorem statusu zamiast ogólnego zapytania wyszukiwania.

## Wprowadzenie i konfiguracja

Wybranie opcji **Grok** podczas wykonywania `openclaw onboard` lub
`openclaw configure --section web` pozwala OpenClaw ponownie użyć istniejącego
profilu OAuth xAI bez pytania o osobny klucz wyszukiwania internetowego. Jeśli OAuth
nie jest dostępny, używana jest konfiguracja klucza API xAI.

Następnie OpenClaw proponuje dodatkowy krok umożliwiający włączenie `x_search` przy
użyciu tych samych danych uwierzytelniających xAI. Ten dodatkowy krok:

- pojawia się tylko po wybraniu Grok jako dostawcy `web_search`
- nie stanowi osobnego wyboru dostawcy wyszukiwania internetowego najwyższego poziomu
- może opcjonalnie ustawić model `x_search` w tym samym procesie

Pomiń go, aby później włączyć lub zmienić `x_search` w konfiguracji.

## Zaloguj się lub uzyskaj klucz API

<Steps>
  <Step title="Użyj OAuth xAI">
    Jeśli zalogowano się już w xAI podczas wprowadzenia lub uwierzytelniania modelu,
    wybierz Grok jako dostawcę `web_search`. Osobny klucz API nie jest wymagany:

    ```bash
    openclaw onboard --auth-choice xai-oauth
    openclaw config set tools.web.search.provider grok
    ```

  </Step>
  <Step title="Użyj zapasowego klucza API">
    Uzyskaj klucz API od [xAI](https://console.x.ai/), gdy OAuth jest niedostępny
    lub celowo chcesz skonfigurować wyszukiwanie internetowe oparte na kluczu.
  </Step>
  <Step title="Zapisz klucz">
    Ustaw `XAI_API_KEY` w środowisku Gateway lub skonfiguruj go za pomocą:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

## Konfiguracja

```json5
{
  plugins: {
    entries: {
      xai: {
        config: {
          webSearch: {
            apiKey: "xai-...", // opcjonalne, jeśli dostępne jest OAuth xAI lub XAI_API_KEY
            baseUrl: "https://api.x.ai/v1", // opcjonalne zastąpienie adresu URL serwera proxy/bazowego interfejsu Responses API
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "grok",
      },
    },
  },
}
```

**Alternatywne dane uwierzytelniające:** `openclaw models auth login --provider xai
--method oauth`, `XAI_API_KEY` w środowisku Gateway lub
`plugins.entries.xai.config.webSearch.apiKey`. W przypadku instalacji Gateway umieść
zmienne środowiskowe w `~/.openclaw/.env`.

## Jak to działa

Grok wykorzystuje odpowiedzi xAI oparte na danych z internetu do generowania
odpowiedzi z cytowaniami w treści, podobnie jak mechanizm opierania odpowiedzi na
wynikach wyszukiwania Google stosowany przez Gemini.

## Obsługiwane parametry

Wyszukiwanie Grok obsługuje parametr `query`. Parametr `count` jest akceptowany ze
względu na zgodność ze wspólnym interfejsem `web_search`, ale Grok zawsze zwraca
jedną wygenerowaną odpowiedź z cytowaniami, a nie listę N wyników. Filtry właściwe
dla dostawcy nie są obsługiwane.

Domyślny limit czasu wyszukiwania Grok wynosi 60 sekund, ponieważ wyszukiwania xAI
oparte na danych z internetu, korzystające z Responses API, mogą trwać dłużej niż
domyślny limit wspólnego narzędzia `web_search`. Zmień go za pomocą
`tools.web.search.timeoutSeconds`.

## Zastępowanie bazowego adresu URL

Ustaw `plugins.entries.xai.config.webSearch.baseUrl`, aby kierować wyszukiwanie
internetowe Grok przez serwer proxy operatora lub punkt końcowy Responses zgodny
z xAI. OpenClaw wysyła żądania POST do `<baseUrl>/responses` po usunięciu końcowych
ukośników. `x_search` używa w zastępstwie tego samego `webSearch.baseUrl`, chyba że
ustawiono `plugins.entries.xai.config.xSearch.baseUrl`.

## Powiązane materiały

- [Omówienie wyszukiwania internetowego](/pl/tools/web) -- wszyscy dostawcy i automatyczne wykrywanie
- [x_search w wyszukiwaniu internetowym](/pl/tools/web#x_search) -- natywne wyszukiwanie w serwisie X za pośrednictwem xAI
- [Wyszukiwanie Gemini](/pl/tools/gemini-search) -- odpowiedzi generowane przez AI na podstawie wyników Google
