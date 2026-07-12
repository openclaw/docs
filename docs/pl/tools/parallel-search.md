---
read_when:
    - Chcesz korzystać z wyszukiwania w sieci bez klucza API
    - Chcesz korzystać z płatnego interfejsu Search API firmy Parallel
    - Chcesz uzyskać zwarte fragmenty uporządkowane według efektywności wykorzystania kontekstu LLM
summary: Wyszukiwanie równoległe — zoptymalizowane pod kątem LLM zwarte fragmenty ze źródeł internetowych
title: Wyszukiwanie równoległe
x-i18n:
    generated_at: "2026-07-12T15:46:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eff693f286015b287bbdacf44f11ff6f07f2f7d2605ef6f09259e7402b40515e
    source_path: tools/parallel-search.md
    workflow: 16
---

Plugin Parallel udostępnia dwóch dostawców `web_search` usługi [Parallel](https://parallel.ai/), którzy zwracają uszeregowane fragmenty zoptymalizowane pod kątem LLM z indeksu internetowego utworzonego dla agentów AI:

| Dostawca                        | id              | Uwierzytelnianie                                                                                     |
| ------------------------------- | --------------- | ---------------------------------------------------------------------------------------------------- |
| Parallel Search (bezpłatny)     | `parallel-free` | Brak — bezpłatny [Search MCP](https://docs.parallel.ai/integrations/mcp/search-mcp) usługi Parallel |
| Parallel Search                 | `parallel`      | `PARALLEL_API_KEY` — płatny interfejs Search API, wyższe limity zapytań i dostrajanie celu          |

Ustaw `tools.web.search.provider` na `parallel-free` lub `parallel`, aby jawnie wybrać jednego z nich; żaden nie jest wykrywany automatycznie.

<Note>
  Bezpośrednie modele OpenAI Responses (`api: "openai-responses"`, dostawca
  `openai`, oficjalny bazowy adres URL API) automatycznie korzystają z
  natywnego wyszukiwania internetowego hostowanego przez OpenAI, gdy
  `tools.web.search.provider` jest nieustawione, puste, ma wartość `"auto"`
  lub `"openai"` — dlatego domyślnie pomijają Parallel. Ustaw
  `tools.web.search.provider` na `parallel-free` lub `parallel`, aby zamiast
  tego kierować je przez Parallel. Zobacz [omówienie wyszukiwania internetowego](/pl/tools/web).
</Note>

## Instalowanie pluginu

```bash
openclaw plugins install @openclaw/parallel-plugin
openclaw gateway restart
```

## Klucz API (płatny dostawca)

`parallel-free` nie wymaga klucza, ale nadal musi zostać wybrany jawnie. Płatny dostawca `parallel` wymaga klucza API:

<Steps>
  <Step title="Utwórz konto">
    Zarejestruj się w serwisie [platform.parallel.ai](https://platform.parallel.ai) i
    wygeneruj klucz API w swoim panelu.
  </Step>
  <Step title="Zapisz klucz">
    Ustaw `PARALLEL_API_KEY` w środowisku Gateway lub skonfiguruj go za pomocą:

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
      parallel: {
        config: {
          webSearch: {
            apiKey: "par-...", // opcjonalne, jeśli ustawiono PARALLEL_API_KEY
            baseUrl: "https://api.parallel.ai", // opcjonalne; OpenClaw dołącza /v1/search
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        // "parallel-free" dla bezpłatnego Search MCP lub "parallel" dla
        // pokazanego tutaj płatnego dostawcy korzystającego z API.
        provider: "parallel",
      },
    },
  },
}
```

**Alternatywa środowiskowa:** ustaw `PARALLEL_API_KEY` w środowisku Gateway. W przypadku instalacji Gateway umieść go w `~/.openclaw/.env`.

## Nadpisywanie bazowego adresu URL

Dotyczy tylko płatnego dostawcy `parallel`; `parallel-free` zawsze używa adresu `https://search.parallel.ai/mcp` i ignoruje to ustawienie.

Ustaw `plugins.entries.parallel.config.webSearch.baseUrl`, aby kierować płatne żądania przez zgodny serwer proxy lub alternatywny punkt końcowy (na przykład Cloudflare AI Gateway). OpenClaw normalizuje same nazwy hostów, dodając przed nimi `https://`, oraz dołącza `/v1/search`, chyba że ścieżka już się nim kończy. Ustalony punkt końcowy jest częścią klucza pamięci podręcznej wyszukiwania, dlatego wyniki z różnych punktów końcowych nigdy nie są współdzielone.

## Parametry narzędzia

Obaj dostawcy udostępniają natywny format wyszukiwania Parallel, dzięki czemu model podaje cel w języku naturalnym oraz kilka krótkich zapytań opartych na słowach kluczowych — jest to połączenie [zalecane](https://docs.parallel.ai/search/best-practices) przez Parallel w celu uzyskania najlepszych wyników.

<ParamField path="objective" type="string" required>
Opis podstawowego pytania lub celu w języku naturalnym (maks. 5000 znaków). Powinien być samodzielnie zrozumiały.
</ParamField>

<ParamField path="search_queries" type="string[]" required>
Zwięzłe zapytania wyszukiwania oparte na słowach kluczowych, każde po 3–6 słów (1–5 pozycji, maks. 200 znaków każda). Aby uzyskać najlepsze wyniki, podaj 2–3 zróżnicowane zapytania.
</ParamField>

<ParamField path="count" type="number">
Liczba zwracanych wyników (1–40).
</ParamField>

<ParamField path="session_id" type="string">
Opcjonalny identyfikator sesji Parallel z pola `sessionId` poprzedniego wyniku. Przekazuj go w kolejnych wyszukiwaniach w ramach tego samego zadania, aby Parallel grupował powiązane wywołania i ulepszał następne wyniki. Maksymalnie 1000 znaków w `parallel`; bezpłatny Search MCP `parallel-free` ogranicza go do 100. Identyfikator przekraczający limit jest odrzucany (wersja płatna) lub zastępowany nowym (wersja bezpłatna).
</ParamField>

<ParamField path="client_model" type="string">
Opcjonalny identyfikator modelu wykonującego wywołanie (np. `claude-opus-4-7`, `gpt-5.6-sol`), maks. 100 znaków. Umożliwia Parallel dostosowanie ustawień domyślnych do możliwości modelu. Przekaż dokładny identyfikator aktywnego modelu; nie skracaj go do aliasu rodziny.
</ParamField>

## Uwagi

- Parallel szereguje i kompresuje wyniki pod kątem przydatności w rozumowaniu LLM, a nie przechodzenia użytkowników do stron; należy oczekiwać treściwych fragmentów dla każdego wyniku zamiast zawartości całych stron.
- Fragmenty wyników są zwracane jako tablica `excerpts`, a także łączone w polu `description` w celu zapewnienia zgodności z ogólnym kontraktem `web_search`.
- Obaj dostawcy zwracają `session_id`; OpenClaw udostępnia go jako `sessionId` w danych narzędzia, aby wywołujący mogli grupować kolejne wyszukiwania. Identyfikator sesji wygenerowany przez Parallel (czyli taki, którego nie podał wywołujący) jest wykluczany z wpisu pamięci podręcznej, ponieważ niepowiązane zadania z identycznymi zapytaniami nie powinny go dziedziczyć.
- Pola `searchId`, `warnings` i `usage` z Parallel są przekazywane, gdy są dostępne.
- OpenClaw zawsze przekazuje ustaloną liczbę wyników do Parallel jako `advanced_settings.max_results` (`parallel`) lub stosuje `count` po stronie klienta po otrzymaniu odpowiedzi Parallel o stałym rozmiarze (`parallel-free`). Argument `count` wywołującego ma pierwszeństwo, następnie `tools.web.search.maxResults`, a w pozostałych przypadkach używana jest ogólna wartość domyślna `web_search` w OpenClaw (5) — domyślna wartość własnego API Parallel wynosi 10.
- Wyniki są domyślnie przechowywane w pamięci podręcznej przez 15 minut (`cacheTtlMinutes`).
- `parallel-free` tworzy nowy `session_id` dla każdego wywołania za pośrednictwem uzgadniania MCP, gdy wywołujący go nie poda; `parallel` pozostawia go w takim przypadku nieustawionym.

## Powiązane

- [Omówienie wyszukiwania internetowego](/pl/tools/web) — wszyscy dostawcy i automatyczne wykrywanie
- [Wyszukiwanie Exa](/pl/tools/exa-search) — wyszukiwanie neuronowe z wyodrębnianiem treści
- [Perplexity Search](/pl/tools/perplexity-search) — ustrukturyzowane wyniki z filtrowaniem domen
