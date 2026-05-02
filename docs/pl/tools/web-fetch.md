---
read_when:
    - Chcesz pobrać zawartość z adresu URL i wyodrębnić czytelną treść
    - Musisz skonfigurować web_fetch lub jego mechanizm awaryjny Firecrawl.
    - Chcesz zrozumieć limity i buforowanie web_fetch
sidebarTitle: Web Fetch
summary: narzędzie web_fetch -- pobieranie HTTP z ekstrakcją czytelnej treści
title: Pobieranie z sieci
x-i18n:
    generated_at: "2026-05-02T10:06:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: f455da77c20049f0ed0246fa53e9f49d3cf2004e65bd64a0bf871861c6e93229
    source_path: tools/web-fetch.md
    workflow: 16
---

Narzędzie `web_fetch` wykonuje zwykłe żądanie HTTP GET i wyodrębnia czytelną treść
(HTML do markdown lub tekstu). **Nie** wykonuje JavaScriptu.

W przypadku witryn mocno opartych na JS lub stron chronionych logowaniem użyj zamiast tego
[Web Browser](/pl/tools/browser).

## Szybki start

`web_fetch` jest **włączone domyślnie** -- konfiguracja nie jest potrzebna. Agent może
wywołać je od razu:

```javascript
await web_fetch({ url: "https://example.com/article" });
```

## Parametry narzędzia

<ParamField path="url" type="string" required>
URL do pobrania. Tylko `http(s)`.
</ParamField>

<ParamField path="extractMode" type="'markdown' | 'text'" default="markdown">
Format wyjścia po wyodrębnieniu głównej treści.
</ParamField>

<ParamField path="maxChars" type="number">
Skróć wyjście do tej liczby znaków.
</ParamField>

## Jak to działa

<Steps>
  <Step title="Fetch">
    Wysyła żądanie HTTP GET z nagłówkiem User-Agent podobnym do Chrome oraz nagłówkiem
    `Accept-Language`. Blokuje prywatne/wewnętrzne nazwy hostów i ponownie sprawdza przekierowania.
  </Step>
  <Step title="Extract">
    Uruchamia Readability (wyodrębnianie głównej treści) na odpowiedzi HTML.
  </Step>
  <Step title="Fallback (optional)">
    Jeśli Readability się nie powiedzie i skonfigurowano Firecrawl, ponawia próbę przez
    API Firecrawl w trybie omijania botów.
  </Step>
  <Step title="Cache">
    Wyniki są buforowane przez 15 minut (konfigurowalne), aby ograniczyć powtarzane
    pobrania tego samego adresu URL.
  </Step>
</Steps>

## Konfiguracja

```json5
{
  tools: {
    web: {
      fetch: {
        enabled: true, // default: true
        provider: "firecrawl", // optional; omit for auto-detect
        maxChars: 50000, // max output chars
        maxCharsCap: 50000, // hard cap for maxChars param
        maxResponseBytes: 2000000, // max download size before truncation
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
        maxRedirects: 3,
        readability: true, // use Readability extraction
        userAgent: "Mozilla/5.0 ...", // override User-Agent
        ssrfPolicy: {
          allowRfc2544BenchmarkRange: true, // opt-in for trusted fake-IP proxies using 198.18.0.0/15
          allowIpv6UniqueLocalRange: true, // opt-in for trusted fake-IP proxies using fc00::/7
        },
      },
    },
  },
}
```

## Zapasowe użycie Firecrawl

Jeśli wyodrębnianie przez Readability się nie powiedzie, `web_fetch` może użyć jako zapasowego
[Firecrawl](/pl/tools/firecrawl) do omijania botów i lepszego wyodrębniania:

```json5
{
  tools: {
    web: {
      fetch: {
        provider: "firecrawl", // optional; omit for auto-detect from available credentials
      },
    },
  },
  plugins: {
    entries: {
      firecrawl: {
        enabled: true,
        config: {
          webFetch: {
            apiKey: "fc-...", // optional if FIRECRAWL_API_KEY is set
            baseUrl: "https://api.firecrawl.dev",
            onlyMainContent: true,
            maxAgeMs: 86400000, // cache duration (1 day)
            timeoutSeconds: 60,
          },
        },
      },
    },
  },
}
```

`plugins.entries.firecrawl.config.webFetch.apiKey` obsługuje obiekty SecretRef.
Starsza konfiguracja `tools.web.fetch.firecrawl.*` jest automatycznie migrowana przez `openclaw doctor --fix`.

<Note>
  Jeśli Firecrawl jest włączony, a jego SecretRef nie może zostać rozwiązany i nie ma zapasowej
  zmiennej środowiskowej `FIRECRAWL_API_KEY`, Gateway szybko przerywa uruchamianie.
</Note>

<Note>
  Nadpisania `baseUrl` Firecrawl są ograniczone: ruch hostowany używa
  `https://api.firecrawl.dev`; nadpisania self-hosted muszą wskazywać prywatne lub
  wewnętrzne punkty końcowe, a `http://` jest akceptowane tylko dla tych prywatnych celów.
</Note>

Bieżące zachowanie w czasie wykonywania:

- `tools.web.fetch.provider` jawnie wybiera zapasowego dostawcę pobierania.
- Jeśli `provider` zostanie pominięty, OpenClaw automatycznie wykrywa pierwszego gotowego dostawcę web-fetch
  na podstawie dostępnych poświadczeń. Nieizolowane w sandboxie `web_fetch` może używać
  zainstalowanych plugins, które deklarują `contracts.webFetchProviders` i rejestrują
  pasującego dostawcę w czasie wykonywania. Obecnie dostawcą dołączonym w pakiecie jest Firecrawl.
- Wywołania `web_fetch` w sandboxie pozostają ograniczone do dostawców dołączonych w pakiecie.
- Jeśli Readability jest wyłączone, `web_fetch` przechodzi od razu do wybranego
  zapasowego dostawcy. Jeśli żaden dostawca nie jest dostępny, kończy się bezpieczną odmową.

## Limity i bezpieczeństwo

- `maxChars` jest ograniczane do `tools.web.fetch.maxCharsCap`
- Treść odpowiedzi jest ograniczana do `maxResponseBytes` przed parsowaniem; zbyt duże
  odpowiedzi są obcinane z ostrzeżeniem
- Prywatne/wewnętrzne nazwy hostów są blokowane
- `tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` i
  `tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange` to wąskie opcje opt-in
  dla zaufanych stosów proxy z fałszywymi adresami IP; pozostaw je nieustawione, chyba że Twoje proxy jest właścicielem
  tych syntetycznych zakresów i egzekwuje własną politykę miejsca docelowego
- Przekierowania są sprawdzane i ograniczane przez `maxRedirects`
- `web_fetch` działa w trybie best-effort -- niektóre witryny wymagają [Web Browser](/pl/tools/browser)

## Profile narzędzi

Jeśli używasz profili narzędzi lub list dozwolonych, dodaj `web_fetch` albo `group:web`:

```json5
{
  tools: {
    allow: ["web_fetch"],
    // or: allow: ["group:web"]  (includes web_fetch, web_search, and x_search)
  },
}
```

## Powiązane

- [Web Search](/pl/tools/web) -- wyszukiwanie w sieci przez wielu dostawców
- [Web Browser](/pl/tools/browser) -- pełna automatyzacja przeglądarki dla witryn mocno opartych na JS
- [Firecrawl](/pl/tools/firecrawl) -- narzędzia wyszukiwania i scrapowania Firecrawl
