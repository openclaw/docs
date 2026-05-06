---
read_when:
    - Chcesz pobrać adres URL i wyodrębnić czytelną treść
    - Musisz skonfigurować web_fetch albo jego mechanizm awaryjny Firecrawl
    - Chcesz zrozumieć limity i buforowanie web_fetch
sidebarTitle: Web Fetch
summary: narzędzie web_fetch -- pobieranie HTTP z wyodrębnianiem czytelnej treści
title: Pobieranie z sieci
x-i18n:
    generated_at: "2026-05-06T18:00:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 337174898861db217bf0db052d8e8749989c295e89c73d9d5a6911f6335ba03d
    source_path: tools/web-fetch.md
    workflow: 16
---

Narzędzie `web_fetch` wykonuje zwykłe żądanie HTTP GET i wyodrębnia czytelną treść
(HTML do markdown lub tekstu). **Nie** wykonuje JavaScriptu.

W przypadku witryn mocno opartych na JS lub stron chronionych logowaniem użyj zamiast tego
[przeglądarki internetowej](/pl/tools/browser).

## Szybki start

`web_fetch` jest **włączone domyślnie** -- konfiguracja nie jest potrzebna. Agent może
wywołać je natychmiast:

```javascript
await web_fetch({ url: "https://example.com/article" });
```

## Parametry narzędzia

<ParamField path="url" type="string" required>
URL do pobrania. Tylko `http(s)`.
</ParamField>

<ParamField path="extractMode" type="'markdown' | 'text'" default="markdown">
Format wyjściowy po wyodrębnieniu głównej treści.
</ParamField>

<ParamField path="maxChars" type="number">
Przytnij dane wyjściowe do tej liczby znaków.
</ParamField>

## Jak to działa

<Steps>
  <Step title="Pobieranie">
    Wysyła żądanie HTTP GET z nagłówkiem User-Agent podobnym do Chrome oraz
    nagłówkiem `Accept-Language`. Blokuje prywatne/wewnętrzne nazwy hostów i ponownie sprawdza przekierowania.
  </Step>
  <Step title="Wyodrębnianie">
    Uruchamia Readability (wyodrębnianie głównej treści) na odpowiedzi HTML.
  </Step>
  <Step title="Fallback (opcjonalnie)">
    Jeśli Readability zawiedzie, a Firecrawl jest skonfigurowany, ponawia próbę przez
    API Firecrawl w trybie obchodzenia botów.
  </Step>
  <Step title="Pamięć podręczna">
    Wyniki są buforowane przez 15 minut (konfigurowalne), aby ograniczyć powtarzane
    pobieranie tego samego URL-a.
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
        useTrustedEnvProxy: false, // let a trusted HTTP(S) env proxy resolve DNS
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

## Fallback Firecrawl

Jeśli wyodrębnianie Readability zawiedzie, `web_fetch` może przejść na
[Firecrawl](/pl/tools/firecrawl), aby obchodzić boty i lepiej wyodrębniać treść:

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
  Jeśli Firecrawl jest włączony, a jego SecretRef pozostaje nierozwiązany i nie ma
  awaryjnej zmiennej środowiskowej `FIRECRAWL_API_KEY`, uruchamianie Gateway kończy się szybko błędem.
</Note>

<Note>
  Nadpisania `baseUrl` Firecrawl są ograniczone: ruch hostowany używa
  `https://api.firecrawl.dev`; samodzielnie hostowane nadpisania muszą wskazywać prywatne lub
  wewnętrzne punkty końcowe, a `http://` jest akceptowane tylko dla tych prywatnych celów.
</Note>

Bieżące zachowanie środowiska uruchomieniowego:

- `tools.web.fetch.provider` jawnie wybiera dostawcę fallback pobierania.
- Jeśli `provider` zostanie pominięty, OpenClaw automatycznie wykrywa pierwszego gotowego dostawcę web-fetch
  na podstawie dostępnych poświadczeń. Niesandboxowane `web_fetch` może używać
  zainstalowanych plugins, które deklarują `contracts.webFetchProviders` i rejestrują
  pasującego dostawcę w czasie działania. Obecnie dołączonym dostawcą jest Firecrawl.
- Sandboxowane wywołania `web_fetch` pozostają ograniczone do dołączonych dostawców.
- Jeśli Readability jest wyłączone, `web_fetch` przechodzi od razu do wybranego
  fallback dostawcy. Jeśli żaden dostawca nie jest dostępny, kończy się zamkniętym błędem.

## Zaufany proxy środowiskowy

Jeśli Twoje wdrożenie wymaga, aby `web_fetch` przechodziło przez zaufany wychodzący
proxy HTTP(S), ustaw `tools.web.fetch.useTrustedEnvProxy: true`.

W tym trybie OpenClaw nadal stosuje kontrole SSRF oparte na nazwach hostów przed wysłaniem
żądania, ale pozwala proxy rozwiązywać DNS zamiast wykonywać lokalne przypinanie DNS.
Włącz to tylko wtedy, gdy proxy jest kontrolowany przez operatora i egzekwuje
politykę wychodzącą po rozwiązaniu DNS.

<Note>
  Jeśli nie skonfigurowano żadnej zmiennej środowiskowej proxy HTTP(S) albo host docelowy jest wykluczony przez
  `NO_PROXY`, `web_fetch` wraca do normalnej ścisłej ścieżki z lokalnym
  przypinaniem DNS.
</Note>

## Limity i bezpieczeństwo

- `maxChars` jest ograniczane do `tools.web.fetch.maxCharsCap`
- Treść odpowiedzi jest ograniczana do `maxResponseBytes` przed parsowaniem; zbyt duże
  odpowiedzi są przycinane z ostrzeżeniem
- Prywatne/wewnętrzne nazwy hostów są blokowane
- `tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` oraz
  `tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange` to wąskie opcje opt-in
  dla zaufanych stosów proxy z fałszywymi IP; pozostaw je nieustawione, chyba że Twój proxy jest właścicielem
  tych syntetycznych zakresów i egzekwuje własną politykę miejsc docelowych
- Przekierowania są sprawdzane i ograniczane przez `maxRedirects`
- `useTrustedEnvProxy` to jawna opcja opt-in i powinna być włączana tylko dla
  proxy kontrolowanych przez operatora, które nadal egzekwują politykę wychodzącą po
  rozwiązaniu DNS
- `web_fetch` działa na zasadzie najlepszej możliwej próby -- niektóre witryny wymagają [przeglądarki internetowej](/pl/tools/browser)

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

- [Wyszukiwanie w sieci](/pl/tools/web) -- przeszukuj sieć za pomocą wielu dostawców
- [Przeglądarka internetowa](/pl/tools/browser) -- pełna automatyzacja przeglądarki dla witryn mocno opartych na JS
- [Firecrawl](/pl/tools/firecrawl) -- narzędzia wyszukiwania i scrapowania Firecrawl
