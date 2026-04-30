---
read_when:
    - Chcesz pobrać adres URL i wyodrębnić czytelną treść
    - Należy skonfigurować web_fetch lub jego mechanizm rezerwowy Firecrawl
    - Chcesz zrozumieć limity i buforowanie web_fetch
sidebarTitle: Web Fetch
summary: narzędzie web_fetch -- pobieranie HTTP z wyodrębnianiem czytelnej treści
title: Pobieranie z sieci
x-i18n:
    generated_at: "2026-04-30T10:25:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 430ff19fe477cff22bb88bc69f1fdd53185cb61c935f2b64481e98b2e5f4aff9
    source_path: tools/web-fetch.md
    workflow: 16
---

Narzędzie `web_fetch` wykonuje zwykłe żądanie HTTP GET i wyodrębnia czytelną treść
(HTML do Markdown lub tekstu). **Nie** wykonuje JavaScriptu.

W przypadku witryn intensywnie korzystających z JS lub stron chronionych logowaniem użyj zamiast tego
[Przeglądarki internetowej](/pl/tools/browser).

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
Skróć wynik do tylu znaków.
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
    Jeśli Readability się nie powiedzie, a Firecrawl jest skonfigurowany, ponawia próbę przez
    API Firecrawl w trybie obchodzenia botów.
  </Step>
  <Step title="Cache">
    Wyniki są buforowane przez 15 minut (konfigurowalne), aby ograniczyć powtarzane
    pobrania tego samego URL.
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

## Awaryjne użycie Firecrawl

Jeśli wyodrębnianie Readability się nie powiedzie, `web_fetch` może awaryjnie użyć
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
  Jeśli Firecrawl jest włączony, a jego SecretRef nie zostanie rozwiązany i nie ma awaryjnej
  zmiennej środowiskowej `FIRECRAWL_API_KEY`, uruchamianie Gateway szybko kończy się niepowodzeniem.
</Note>

<Note>
  Nadpisania `baseUrl` Firecrawl są ograniczone: muszą używać `https://` oraz
  oficjalnego hosta Firecrawl (`api.firecrawl.dev`).
</Note>

Bieżące zachowanie środowiska uruchomieniowego:

- `tools.web.fetch.provider` jawnie wybiera awaryjnego dostawcę pobierania.
- Jeśli `provider` zostanie pominięty, OpenClaw automatycznie wykrywa pierwszego gotowego dostawcę web-fetch
  na podstawie dostępnych poświadczeń. Obecnie dołączonym dostawcą jest Firecrawl.
- Jeśli Readability jest wyłączone, `web_fetch` przechodzi od razu do wybranego
  awaryjnego dostawcy. Jeśli żaden dostawca nie jest dostępny, kończy się bezpiecznym niepowodzeniem.

## Limity i bezpieczeństwo

- `maxChars` jest ograniczane do `tools.web.fetch.maxCharsCap`
- Treść odpowiedzi jest ograniczana do `maxResponseBytes` przed analizą; zbyt duże
  odpowiedzi są skracane z ostrzeżeniem
- Prywatne/wewnętrzne nazwy hostów są blokowane
- `tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` oraz
  `tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange` to wąskie zgody opt-in
  dla zaufanych stosów proxy fake-IP; pozostaw je nieustawione, chyba że proxy jest właścicielem
  tych syntetycznych zakresów i egzekwuje własną politykę miejsc docelowych
- Przekierowania są sprawdzane i ograniczane przez `maxRedirects`
- `web_fetch` działa na zasadzie best-effort -- niektóre witryny wymagają [Przeglądarki internetowej](/pl/tools/browser)

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

- [Wyszukiwanie w sieci](/pl/tools/web) -- wyszukuj w sieci przy użyciu wielu dostawców
- [Przeglądarka internetowa](/pl/tools/browser) -- pełna automatyzacja przeglądarki dla witryn intensywnie korzystających z JS
- [Firecrawl](/pl/tools/firecrawl) -- narzędzia wyszukiwania i scrapowania Firecrawl
