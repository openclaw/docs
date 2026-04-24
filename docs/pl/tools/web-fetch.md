---
read_when:
    - Chcesz pobrać URL i wyodrębnić czytelną treść
    - Musisz skonfigurować `web_fetch` lub jego fallback Firecrawl
    - Chcesz zrozumieć limity i cache’owanie `web_fetch`
sidebarTitle: Web Fetch
summary: Narzędzie `web_fetch` -- pobieranie HTTP z ekstrakcją czytelnej treści
title: Web Fetch
x-i18n:
    generated_at: "2026-04-24T09:38:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 56113bf358194d364a61f0e3f52b8f8437afc55565ab8dda5b5069671bc35735
    source_path: tools/web-fetch.md
    workflow: 15
---

Narzędzie `web_fetch` wykonuje zwykły HTTP GET i wyodrębnia czytelną treść
(HTML do markdown albo tekstu). **Nie** wykonuje JavaScript.

W przypadku stron intensywnie używających JS albo stron chronionych logowaniem użyj zamiast tego
[Narzędzia Web Browser](/pl/tools/browser).

## Szybki start

`web_fetch` jest **domyślnie włączone** -- nie wymaga konfiguracji. Agent może
wywołać je od razu:

```javascript
await web_fetch({ url: "https://example.com/article" });
```

## Parametry narzędzia

<ParamField path="url" type="string" required>
URL do pobrania. Tylko `http(s)`.
</ParamField>

<ParamField path="extractMode" type="'markdown' | 'text'" default="markdown">
Format wyjścia po ekstrakcji głównej treści.
</ParamField>

<ParamField path="maxChars" type="number">
Obcina wyjście do tej liczby znaków.
</ParamField>

## Jak to działa

<Steps>
  <Step title="Pobieranie">
    Wysyła HTTP GET z User-Agent podobnym do Chrome i nagłówkiem `Accept-Language`.
    Blokuje prywatne/wewnętrzne nazwy hostów i ponownie sprawdza przekierowania.
  </Step>
  <Step title="Ekstrakcja">
    Uruchamia Readability (ekstrakcję głównej treści) na odpowiedzi HTML.
  </Step>
  <Step title="Fallback (opcjonalnie)">
    Jeśli Readability zawiedzie i Firecrawl jest skonfigurowany, ponawia próbę przez
    interfejs API Firecrawl z trybem omijania botów.
  </Step>
  <Step title="Cache">
    Wyniki są cache’owane przez 15 minut (konfigurowalne), aby ograniczyć powtarzane
    pobrania tego samego URL.
  </Step>
</Steps>

## Konfiguracja

```json5
{
  tools: {
    web: {
      fetch: {
        enabled: true, // domyślnie: true
        provider: "firecrawl", // opcjonalne; pomiń, aby użyć automatycznego wykrywania
        maxChars: 50000, // maks. liczba znaków wyjścia
        maxCharsCap: 50000, // twardy limit dla parametru maxChars
        maxResponseBytes: 2000000, // maks. rozmiar pobierania przed obcięciem
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
        maxRedirects: 3,
        readability: true, // używa ekstrakcji Readability
        userAgent: "Mozilla/5.0 ...", // nadpisuje User-Agent
      },
    },
  },
}
```

## Fallback Firecrawl

Jeśli ekstrakcja Readability zawiedzie, `web_fetch` może użyć fallbacku do
[Firecrawl](/pl/tools/firecrawl) w celu omijania botów i lepszej ekstrakcji:

```json5
{
  tools: {
    web: {
      fetch: {
        provider: "firecrawl", // opcjonalne; pomiń, aby użyć automatycznego wykrywania na podstawie dostępnych poświadczeń
      },
    },
  },
  plugins: {
    entries: {
      firecrawl: {
        enabled: true,
        config: {
          webFetch: {
            apiKey: "fc-...", // opcjonalne, jeśli ustawiono FIRECRAWL_API_KEY
            baseUrl: "https://api.firecrawl.dev",
            onlyMainContent: true,
            maxAgeMs: 86400000, // czas cache (1 dzień)
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
  Jeśli Firecrawl jest włączony i jego SecretRef nie jest rozwiązany bez
  fallbacku środowiskowego `FIRECRAWL_API_KEY`, uruchomienie Gateway kończy się natychmiastowym błędem.
</Note>

<Note>
  Nadpisania `baseUrl` dla Firecrawl są zablokowane: muszą używać `https://` oraz
  oficjalnego hosta Firecrawl (`api.firecrawl.dev`).
</Note>

Bieżące zachowanie runtime:

- `tools.web.fetch.provider` jawnie wybiera dostawcę fallbacku pobierania.
- Jeśli `provider` zostanie pominięty, OpenClaw automatycznie wykrywa pierwszego gotowego dostawcę
  `web_fetch` na podstawie dostępnych poświadczeń. Obecnie wbudowanym dostawcą jest Firecrawl.
- Jeśli Readability jest wyłączone, `web_fetch` od razu przechodzi do wybranego
  fallbacku dostawcy. Jeśli żaden dostawca nie jest dostępny, kończy się zamknięciem.

## Limity i bezpieczeństwo

- `maxChars` jest ograniczane do `tools.web.fetch.maxCharsCap`
- Treść odpowiedzi jest ograniczana do `maxResponseBytes` przed parsowaniem; zbyt duże
  odpowiedzi są obcinane z ostrzeżeniem
- Prywatne/wewnętrzne nazwy hostów są blokowane
- Przekierowania są sprawdzane i ograniczane przez `maxRedirects`
- `web_fetch` działa w trybie best-effort -- niektóre strony wymagają [Web Browser](/pl/tools/browser)

## Profile narzędzi

Jeśli używasz profili narzędzi albo list dozwolonych, dodaj `web_fetch` albo `group:web`:

```json5
{
  tools: {
    allow: ["web_fetch"],
    // albo: allow: ["group:web"]  (obejmuje web_fetch, web_search i x_search)
  },
}
```

## Powiązane

- [Web Search](/pl/tools/web) -- przeszukiwanie sieci z wieloma dostawcami
- [Web Browser](/pl/tools/browser) -- pełna automatyzacja przeglądarki dla stron intensywnie używających JS
- [Firecrawl](/pl/tools/firecrawl) -- narzędzia wyszukiwania i scrapingu Firecrawl
