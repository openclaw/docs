---
read_when:
    - Chcesz pobrać URL i wyodrębnić czytelną treść
    - Musisz skonfigurować web_fetch albo jego zapasowy mechanizm Firecrawl
    - Chcesz zrozumieć limity i buforowanie web_fetch
sidebarTitle: Web Fetch
summary: narzędzie web_fetch -- pobieranie HTTP z ekstrakcją czytelnej treści
title: Pobieranie z sieci
x-i18n:
    generated_at: "2026-06-27T18:32:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b5a4127b97ded80eec1a5944bc8606069e630c61f89c4d5ce9cb729390b4eb4d
    source_path: tools/web-fetch.md
    workflow: 16
---

Narzędzie `web_fetch` wykonuje zwykłe żądanie HTTP GET i wyodrębnia czytelną treść
(HTML do Markdown lub tekstu). **Nie** wykonuje JavaScriptu.

W przypadku witryn mocno zależnych od JS lub stron chronionych logowaniem użyj zamiast tego
[Przeglądarki internetowej](/pl/tools/browser).

## Szybki start

`web_fetch` jest **włączone domyślnie** -- konfiguracja nie jest potrzebna. Agent może
wywołać je od razu:

```javascript
await web_fetch({ url: "https://example.com/article" });
```

## Parametry narzędzia

<ParamField path="url" type="string" required>
Adres URL do pobrania. Tylko `http(s)`.
</ParamField>

<ParamField path="extractMode" type="'markdown' | 'text'" default="markdown">
Format wyjściowy po wyodrębnieniu głównej treści.
</ParamField>

<ParamField path="maxChars" type="number">
Skróć dane wyjściowe do tylu znaków.
</ParamField>

## Jak to działa

<Steps>
  <Step title="Fetch">
    Wysyła żądanie HTTP GET z User-Agent podobnym do Chrome oraz nagłówkiem
    `Accept-Language`. Blokuje prywatne/wewnętrzne nazwy hostów i ponownie sprawdza przekierowania.
  </Step>
  <Step title="Extract">
    Uruchamia Readability (wyodrębnianie głównej treści) na odpowiedzi HTML.
  </Step>
  <Step title="Fallback (optional)">
    Jeśli Readability się nie powiedzie i wybrano Firecrawl, ponawia próbę przez
    API Firecrawl w trybie omijania botów.
  </Step>
  <Step title="Cache">
    Wyniki są buforowane przez 15 minut (konfigurowalne), aby ograniczyć powtarzane
    pobieranie tego samego adresu URL.
  </Step>
</Steps>

## Aktualizacje postępu

`web_fetch` emituje publiczny wiersz postępu tylko wtedy, gdy pobieranie nadal trwa
po pięciu sekundach:

```text
Fetching page content...
```

Szybkie trafienia w pamięć podręczną i szybkie odpowiedzi sieciowe kończą się przed uruchomieniem timera, więc
nie pokazują wiersza postępu. Jeśli wywołanie zostanie anulowane, timer jest czyszczony.
Gdy pobieranie ostatecznie się zakończy, agent otrzymuje normalny wynik narzędzia;
wiersz postępu jest wyłącznie stanem interfejsu kanału i nigdy nie zawiera pobranej
treści strony.

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

## Zapasowe użycie Firecrawl

Jeśli wyodrębnianie Readability się nie powiedzie, `web_fetch` może użyć
[Firecrawl](/pl/tools/firecrawl) jako rozwiązania zapasowego do omijania botów i lepszego wyodrębniania:

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
            // apiKey: "fc-...", // optional; omit for keyless starter access
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

`plugins.entries.firecrawl.config.webFetch.apiKey` jest opcjonalne i obsługuje obiekty SecretRef.
Starsza konfiguracja `tools.web.fetch.firecrawl.*` jest automatycznie migrowana przez `openclaw doctor --fix`.

<Note>
  Jeśli skonfigurujesz SecretRef klucza API Firecrawl i nie zostanie on rozwiązany bez zapasowej zmiennej środowiskowej
  `FIRECRAWL_API_KEY`, uruchamianie Gateway szybko kończy się niepowodzeniem.
</Note>

<Note>
  Nadpisania `baseUrl` Firecrawl są ograniczone: ruch hostowany używa
  `https://api.firecrawl.dev`; samodzielnie hostowane nadpisania muszą wskazywać prywatne lub
  wewnętrzne punkty końcowe, a `http://` jest akceptowane tylko dla tych prywatnych celów.
</Note>

Bieżące zachowanie środowiska uruchomieniowego:

- `tools.web.fetch.provider` jawnie wybiera zapasowego dostawcę pobierania.
- Jeśli `provider` zostanie pominięte, OpenClaw automatycznie wykrywa pierwszego gotowego dostawcę web-fetch
  na podstawie skonfigurowanych poświadczeń. Niesandboxowane `web_fetch` może używać
  zainstalowanych pluginów, które deklarują `contracts.webFetchProviders` i rejestrują
  pasującego dostawcę w czasie działania. Oficjalny plugin Firecrawl zapewnia to
  rozwiązanie zapasowe.
- Sandboxowane wywołania `web_fetch` dopuszczają dostawców wbudowanych oraz zainstalowanych dostawców,
  których oficjalne pochodzenie z npm lub ClawHub zostało zweryfikowane. Obecnie zezwala to na
  oficjalny plugin Firecrawl; zewnętrzne pluginy pobierania innych firm pozostają wykluczone.
- Jeśli Readability jest wyłączone, `web_fetch` przechodzi od razu do wybranego
  zapasowego dostawcy. Jeśli żaden dostawca nie jest dostępny, kończy się niepowodzeniem w trybie zamkniętym.

## Zaufany proxy środowiskowy

Jeśli Twoje wdrożenie wymaga, aby `web_fetch` przechodziło przez zaufany wychodzący
proxy HTTP(S), ustaw `tools.web.fetch.useTrustedEnvProxy: true`.

W tym trybie OpenClaw nadal stosuje kontrole SSRF oparte na nazwie hosta przed wysłaniem
żądania, ale pozwala proxy rozwiązywać DNS zamiast wykonywać lokalne
przypinanie DNS. Włącz to tylko wtedy, gdy proxy jest kontrolowane przez operatora i egzekwuje
politykę wychodzącą po rozwiązaniu DNS.

<Note>
  Jeśli nie skonfigurowano zmiennej środowiskowej proxy HTTP(S) albo host docelowy jest wykluczony przez
  `NO_PROXY`, `web_fetch` wraca do normalnej ścisłej ścieżki z lokalnym
  przypinaniem DNS.
</Note>

## Limity i bezpieczeństwo

- `maxChars` jest ograniczane do `tools.web.fetch.maxCharsCap`
- Treść odpowiedzi jest ograniczana do `maxResponseBytes` przed parsowaniem; zbyt duże
  odpowiedzi są skracane z ostrzeżeniem
- Prywatne/wewnętrzne nazwy hostów są blokowane
- `tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` i
  `tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange` to wąskie opcje opt-in
  dla zaufanych stosów proxy z fałszywymi adresami IP; pozostaw je nieustawione, chyba że Twój proxy jest właścicielem
  tych syntetycznych zakresów i egzekwuje własną politykę miejsc docelowych
- Przekierowania są sprawdzane i ograniczane przez `maxRedirects`
- `useTrustedEnvProxy` jest jawną opcją opt-in i powinno być włączane tylko dla
  proxy kontrolowanych przez operatora, które nadal egzekwują politykę wychodzącą po
  rozwiązaniu DNS
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

- [Wyszukiwanie w sieci](/pl/tools/web) -- przeszukuj sieć z użyciem wielu dostawców
- [Przeglądarka internetowa](/pl/tools/browser) -- pełna automatyzacja przeglądarki dla witryn mocno zależnych od JS
- [Firecrawl](/pl/tools/firecrawl) -- narzędzia wyszukiwania i scrapowania Firecrawl
