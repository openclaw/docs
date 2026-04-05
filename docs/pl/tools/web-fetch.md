---
read_when:
    - Chcesz pobrać URL i wyodrębnić czytelną treść
    - Musisz skonfigurować `web_fetch` lub jego fallback Firecrawl
    - Chcesz zrozumieć limity i cache `web_fetch`
sidebarTitle: Web Fetch
summary: Narzędzie `web_fetch` — pobieranie HTTP z ekstrakcją czytelnej treści
title: Web Fetch
x-i18n:
    generated_at: "2026-04-05T14:10:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 60c933a25d0f4511dc1683985988e115b836244c5eac4c6667b67c8eb15401e0
    source_path: tools/web-fetch.md
    workflow: 15
---

# Web Fetch

Narzędzie `web_fetch` wykonuje zwykłe żądanie HTTP GET i wyodrębnia czytelną treść
(HTML do markdown lub tekstu). **Nie** wykonuje JavaScript.

W przypadku stron mocno opartych na JS lub stron chronionych logowaniem użyj zamiast tego
[Web Browser](/tools/browser).

## Szybki start

`web_fetch` jest **domyślnie włączone** — nie wymaga konfiguracji. Agent może
wywołać je od razu:

```javascript
await web_fetch({ url: "https://example.com/article" });
```

## Parametry narzędzia

| Parametr      | Typ      | Opis                                     |
| ------------- | -------- | ---------------------------------------- |
| `url`         | `string` | URL do pobrania (wymagany, tylko http/https) |
| `extractMode` | `string` | `"markdown"` (domyślnie) lub `"text"`    |
| `maxChars`    | `number` | Obetnij wyjście do tej liczby znaków     |

## Jak to działa

<Steps>
  <Step title="Pobranie">
    Wysyła HTTP GET z nagłówkiem User-Agent podobnym do Chrome oraz nagłówkiem `Accept-Language`.
    Blokuje prywatne/wewnętrzne hostname i ponownie sprawdza przekierowania.
  </Step>
  <Step title="Ekstrakcja">
    Uruchamia Readability (ekstrakcję głównej treści) na odpowiedzi HTML.
  </Step>
  <Step title="Fallback (opcjonalnie)">
    Jeśli Readability się nie powiedzie i Firecrawl jest skonfigurowany, ponawia próbę przez
    API Firecrawl z trybem obchodzenia zabezpieczeń przed botami.
  </Step>
  <Step title="Cache">
    Wyniki są cache’owane przez 15 minut (konfigurowalne), aby ograniczyć ponowne
    pobieranie tego samego URL.
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
      },
    },
  },
}
```

## Fallback Firecrawl

Jeśli ekstrakcja przez Readability się nie powiedzie, `web_fetch` może użyć fallbacku do
[Firecrawl](/tools/firecrawl) w celu obejścia zabezpieczeń przed botami i uzyskania lepszej ekstrakcji:

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
  Jeśli Firecrawl jest włączony, a jego SecretRef nie jest rozwiązany i nie ma
  fallbacku env `FIRECRAWL_API_KEY`, uruchomienie gateway kończy się natychmiast błędem.
</Note>

<Note>
  Nadpisania `baseUrl` Firecrawl są ograniczone: muszą używać `https://` i
  oficjalnego hosta Firecrawl (`api.firecrawl.dev`).
</Note>

Aktualne zachowanie runtime:

- `tools.web.fetch.provider` jawnie wybiera providera fallbacku pobierania.
- Jeśli `provider` jest pominięty, OpenClaw automatycznie wykrywa pierwszego gotowego providera web fetch
  na podstawie dostępnych poświadczeń. Obecnie dołączonym providerem jest Firecrawl.
- Jeśli Readability jest wyłączone, `web_fetch` od razu przechodzi do wybranego
  fallbacku providera. Jeśli żaden provider nie jest dostępny, kończy działanie bezpieczną odmową.

## Limity i bezpieczeństwo

- `maxChars` jest ograniczane do `tools.web.fetch.maxCharsCap`
- Treść odpowiedzi jest ograniczana do `maxResponseBytes` przed parsowaniem; zbyt duże
  odpowiedzi są obcinane z ostrzeżeniem
- Prywatne/wewnętrzne hostname są blokowane
- Przekierowania są sprawdzane i ograniczane przez `maxRedirects`
- `web_fetch` działa w trybie best-effort — niektóre strony wymagają [Web Browser](/tools/browser)

## Profile narzędzi

Jeśli używasz profili narzędzi lub list dozwolonych, dodaj `web_fetch` lub `group:web`:

```json5
{
  tools: {
    allow: ["web_fetch"],
    // or: allow: ["group:web"]  (includes web_fetch, web_search, and x_search)
  },
}
```

## Powiązane

- [Web Search](/tools/web) -- przeszukuj sieć z użyciem wielu providerów
- [Web Browser](/tools/browser) -- pełna automatyzacja browser dla stron mocno opartych na JS
- [Firecrawl](/tools/firecrawl) -- narzędzia wyszukiwania i scrape w Firecrawl
