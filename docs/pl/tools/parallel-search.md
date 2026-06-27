---
read_when:
    - Chcesz korzystać z wyszukiwania w internecie bez klucza API
    - Potrzebujesz płatnego interfejsu API wyszukiwania firmy Parallel
    - Chcesz zwarte fragmenty uszeregowane pod kątem wydajności kontekstu LLM
summary: Wyszukiwanie równoległe -- zoptymalizowane pod kątem LLM gęste fragmenty ze źródeł internetowych
title: Wyszukiwanie równoległe
x-i18n:
    generated_at: "2026-06-27T18:29:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ef64c2c125d2885385308dd8a57421b696fa1a9a5455b8c3b83854016f6514cb
    source_path: tools/parallel-search.md
    workflow: 16
---

Plugin Parallel udostępnia dwóch dostawców `web_search` [Parallel](https://parallel.ai/):

- **Parallel Search (Free)** (`parallel-free`) -- bezpłatny
  [Search MCP](https://docs.parallel.ai/integrations/mcp/search-mcp) od Parallel. Nie wymaga
  konta ani klucza API. Wybierz go jawnie, gdy chcesz użyć hostowanej przez Parallel
  ścieżki wyszukiwania bez klucza.
- **Parallel Search** (`parallel`) -- płatne Search API od Parallel. Wymaga
  `PARALLEL_API_KEY` i oferuje wyższe limity szybkości oraz dostrajanie celu.

Oba zwracają uszeregowane, zoptymalizowane pod LLM fragmenty z indeksu internetowego zbudowanego dla agentów AI.
Ustaw `tools.web.search.provider` na `parallel-free` albo `parallel`, aby wybrać jedno
jawnie.

<Note>
  Modele OpenAI Responses używają natywnego wyszukiwania internetowego OpenAI, gdy
  `tools.web.search.provider` nie jest ustawione, więc omijają dostawców Parallel.
  Ustaw `tools.web.search.provider` na `parallel-free` albo `parallel`, aby kierować je
  przez Parallel.
</Note>

## Instalacja Plugin

Zainstaluj oficjalny plugin, a następnie uruchom ponownie Gateway:

```bash
openclaw plugins install @openclaw/parallel-plugin
openclaw gateway restart
```

## Klucz API (płatny dostawca)

`parallel-free` nie wymaga klucza API, ale nadal musi zostać wybrany jako
zarządzany dostawca. Płatny dostawca `parallel` wymaga klucza API:

<Steps>
  <Step title="Utwórz konto">
    Zarejestruj się na [platform.parallel.ai](https://platform.parallel.ai) i
    wygeneruj klucz API z panelu.
  </Step>
  <Step title="Przechowaj klucz">
    Ustaw `PARALLEL_API_KEY` w środowisku Gateway albo skonfiguruj przez:

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
            apiKey: "par-...", // optional if PARALLEL_API_KEY is set
            baseUrl: "https://api.parallel.ai", // optional; OpenClaw appends /v1/search
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        // Use "parallel-free" for the free Search MCP, or "parallel" for
        // the paid API-backed provider shown here.
        provider: "parallel",
      },
    },
  },
}
```

**Alternatywa środowiskowa:** ustaw `PARALLEL_API_KEY` w środowisku Gateway.
W przypadku instalacji gateway umieść go w `~/.openclaw/.env`.

## Nadpisanie bazowego adresu URL

Nadpisanie bazowego adresu URL dotyczy tylko płatnego dostawcy `parallel`. Bezpłatny
dostawca `parallel-free` zawsze używa `https://search.parallel.ai/mcp`.

Ustaw `plugins.entries.parallel.config.webSearch.baseUrl`, gdy żądania Parallel
mają przechodzić przez zgodny serwer proxy albo alternatywny punkt końcowy Parallel (na
przykład Cloudflare AI Gateway). OpenClaw normalizuje same hosty przez
dodanie na początku `https://` i dopisuje `/v1/search`, chyba że ścieżka już się
tak kończy. Rozwiązany punkt końcowy jest uwzględniany w kluczu pamięci podręcznej wyszukiwania, więc wyniki
z różnych punktów końcowych Parallel nie są współdzielone.

## Parametry narzędzia

OpenClaw udostępnia natywny kształt wyszukiwania Parallel, aby model mógł wypełnić zarówno
cel w języku naturalnym, jak i kilka krótkich zapytań słów kluczowych — zestawienie,
które Parallel [zaleca](https://docs.parallel.ai/search/best-practices), aby uzyskać
najlepsze wyniki.

<ParamField path="objective" type="string" required>
Opis bazowego pytania lub celu w języku naturalnym (maks. 5000
znaków). Powinien być samowystarczalny.
</ParamField>

<ParamField path="search_queries" type="string[]" required>
Zwięzłe zapytania wyszukiwania słów kluczowych, po 3-6 słów każde (1-5 pozycji, maks. 200 znaków
każde). Podaj 2-3 zróżnicowane zapytania, aby uzyskać najlepsze wyniki.
</ParamField>

<ParamField path="count" type="number">
Liczba wyników do zwrócenia (1-40).
</ParamField>

<ParamField path="session_id" type="string">
Opcjonalny identyfikator sesji Parallel (maks. 1000 znaków dla `parallel`; bezpłatny
Search MCP `parallel-free` ogranicza go do 100). Przekaż `sessionId` z poprzedniego
wyniku Parallel w kolejnych wyszukiwaniach należących do tego samego zadania, aby Parallel
mógł grupować powiązane wywołania i poprawiać kolejne wyniki. Identyfikator przekraczający limit jest
odrzucany i generowany jest nowy.
</ParamField>

<ParamField path="client_model" type="string">
Opcjonalny identyfikator modelu wykonującego wywołanie (np. `claude-opus-4-7`,
`gpt-5.5`). Pozwala Parallel dopasować domyślne ustawienia do
możliwości Twojego modelu. Przekaż dokładny slug aktywnego modelu; nie skracaj do aliasu
rodziny.
</ParamField>

## Uwagi

- Parallel szereguje i kompresuje wyniki na podstawie przydatności dla rozumowania LLM, a nie
  kliknięć użytkowników; oczekuj gęstych fragmentów w każdym wyniku zamiast
  pełnej treści strony
- Fragmenty wyników wracają jako tablica `excerpts` i są też łączone w
  polu `description` dla zgodności z ogólnym kontraktem `web_search`
- Parallel zwraca `session_id` w każdej odpowiedzi; OpenClaw udostępnia go jako
  `sessionId` w ładunku narzędzia, aby wywołujący mogli grupować kolejne wyszukiwania
- `searchId`, `warnings` i `usage` z Parallel są przekazywane dalej, gdy
  są obecne
- OpenClaw zawsze przekazuje do Parallel rozwiązaną liczbę wyników jako
  `advanced_settings.max_results`. Argument `count` wywołującego ma pierwszeństwo, potem
  ustawienie najwyższego poziomu `tools.web.search.maxResults`, a w przeciwnym razie
  ogólna wartość domyślna `web_search` OpenClaw (5). Dzięki temu wolumen wyników pozostaje spójny
  podczas przełączania między dostawcami; sam Parallel domyślnie używa 10
- Wyniki są domyślnie buforowane przez 15 minut (konfigurowalne przez
  `cacheTtlMinutes`)
- Bezpłatny dostawca `parallel-free` akceptuje te same parametry. Stosuje
  `count` po stronie klienta i generuje `session_id` dla każdego wywołania, gdy nie
  zostanie podany.

## Powiązane

- [Omówienie Web Search](/pl/tools/web) -- wszyscy dostawcy i automatyczne wykrywanie
- [Wyszukiwanie Exa](/pl/tools/exa-search) -- wyszukiwanie neuronowe z ekstrakcją treści
- [Perplexity Search](/pl/tools/perplexity-search) -- strukturyzowane wyniki z filtrowaniem domen
