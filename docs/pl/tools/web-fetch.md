---
read_when:
    - Chcesz pobrać adres URL i wyodrębnić czytelną treść
    - Musisz skonfigurować web_fetch lub jego mechanizm zapasowy Firecrawl
    - Chcesz poznać limity i mechanizm buforowania web_fetch
sidebarTitle: Web Fetch
summary: narzędzie web_fetch — pobieranie przez HTTP z wyodrębnianiem czytelnej treści
title: Pobieranie z sieci Web
x-i18n:
    generated_at: "2026-07-12T15:47:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8c956b01fce44dc4b8f3ac289b312691c3fe4293ed2e6777fb53f3345dd99e93
    source_path: tools/web-fetch.md
    workflow: 16
---

`web_fetch` wykonuje zwykłe żądanie HTTP GET i wyodrębnia czytelną treść (z HTML do
markdownu lub tekstu). **Nie** wykonuje kodu JavaScript. W przypadku witryn intensywnie
korzystających z JS lub stron chronionych logowaniem użyj zamiast tego [przeglądarki internetowej](/pl/tools/browser).

## Szybki start

Włączone domyślnie, bez konieczności konfiguracji:

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
Przycina dane wyjściowe do podanej liczby znaków. Wartość jest ograniczona przez `tools.web.fetch.maxCharsCap`.
</ParamField>

## Jak to działa

<Steps>
  <Step title="Pobieranie">
    Wysyła żądanie HTTP GET z nagłówkami User-Agent podobnym do Chrome oraz
    `Accept-Language`. Blokuje prywatne/wewnętrzne nazwy hostów i ponownie sprawdza przekierowania.
  </Step>
  <Step title="Wyodrębnianie">
    Uruchamia Readability (wyodrębnianie głównej treści) dla odpowiedzi HTML.
  </Step>
  <Step title="Tryb rezerwowy (opcjonalny)">
    Jeśli Readability zawiedzie, a dostawca pobierania jest dostępny, ponawia próbę za
    jego pośrednictwem (na przykład w trybie omijania zabezpieczeń przed botami Firecrawl).
  </Step>
  <Step title="Pamięć podręczna">
    Wyniki są przechowywane w pamięci podręcznej przez 15 minut (wartość konfigurowalna), aby ograniczyć wielokrotne
    pobieranie tego samego adresu URL.
  </Step>
</Steps>

## Aktualizacje postępu

`web_fetch` emituje publiczny wiersz postępu tylko wtedy, gdy pobieranie nadal trwa
po pięciu sekundach:

```text
Pobieranie treści strony...
```

Szybkie trafienia w pamięci podręcznej i krótkie odpowiedzi sieciowe kończą się przed uruchomieniem licznika czasu, dlatego
wiersz postępu nigdy się dla nich nie pojawia. Anulowanie wywołania usuwa licznik czasu.
Wiersz postępu jest wyłącznie stanem interfejsu kanału i nigdy nie zawiera pobranej treści strony.

## Konfiguracja

```json5
{
  tools: {
    web: {
      fetch: {
        enabled: true, // domyślnie: true
        provider: "firecrawl", // opcjonalne; pomiń, aby wykryć automatycznie
        maxChars: 20000, // domyślna liczba znaków wyjściowych; ograniczona przez maxCharsCap
        maxCharsCap: 20000, // bezwzględny limit parametru maxChars
        maxResponseBytes: 750000, // maksymalny rozmiar pobierania przed przycięciem (32000-10000000)
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
        maxRedirects: 3,
        useTrustedEnvProxy: false, // zezwól zaufanemu serwerowi proxy HTTP(S) ze zmiennej środowiskowej rozwiązywać DNS
        readability: true, // użyj wyodrębniania Readability
        userAgent: "Mozilla/5.0 ...", // zastąp User-Agent
        ssrfPolicy: {
          allowRfc2544BenchmarkRange: true, // opcjonalna zgoda dla zaufanych serwerów proxy z fałszywymi adresami IP używających 198.18.0.0/15
          allowIpv6UniqueLocalRange: true, // opcjonalna zgoda dla zaufanych serwerów proxy z fałszywymi adresami IP używających fc00::/7
        },
      },
    },
  },
}
```

## Rezerwowe użycie Firecrawl

Jeśli wyodrębnianie za pomocą Readability zawiedzie, `web_fetch` może użyć rezerwowo
[Firecrawl](/pl/tools/firecrawl), aby ominąć zabezpieczenia przed botami i uzyskać lepsze wyniki wyodrębniania:

```json5
{
  tools: {
    web: {
      fetch: {
        provider: "firecrawl", // opcjonalne; pomiń, aby wykryć automatycznie na podstawie dostępnych danych uwierzytelniających
      },
    },
  },
  plugins: {
    entries: {
      firecrawl: {
        enabled: true,
        config: {
          webFetch: {
            // apiKey: "fc-...", // opcjonalne; pomiń, aby korzystać z dostępu początkowego bez klucza
            baseUrl: "https://api.firecrawl.dev",
            onlyMainContent: true,
            maxAgeMs: 172800000, // czas przechowywania w pamięci podręcznej (2 dni)
            timeoutSeconds: 60,
          },
        },
      },
    },
  },
}
```

`plugins.entries.firecrawl.config.webFetch.apiKey` jest opcjonalne i obsługuje obiekty SecretRef.
Starsza konfiguracja `tools.web.fetch.firecrawl.*` jest automatycznie migrowana do
`plugins.entries.firecrawl.config.webFetch` przez `openclaw doctor --fix`.

<Note>
  Jeśli skonfigurujesz SecretRef klucza API Firecrawl, którego nie można rozwiązać, i nie istnieje
  rezerwowa zmienna środowiskowa `FIRECRAWL_API_KEY`, uruchamianie Gateway natychmiast zakończy się niepowodzeniem.
</Note>

<Note>
  Nadpisywanie `baseUrl` Firecrawl podlega ograniczeniom: ruch do usługi hostowanej używa
  `https://api.firecrawl.dev`; nadpisania dla instalacji samodzielnie hostowanych muszą wskazywać prywatne lub
  wewnętrzne punkty końcowe, a `http://` jest akceptowane tylko dla takich prywatnych celów.
</Note>

Bieżące zachowanie środowiska wykonawczego:

- `tools.web.fetch.provider` jawnie wybiera rezerwowego dostawcę pobierania.
- Jeśli `provider` zostanie pominięty, OpenClaw automatycznie wykryje pierwszego gotowego dostawcę
  pobierania stron internetowych na podstawie skonfigurowanych danych uwierzytelniających. Wywołanie `web_fetch` poza piaskownicą może używać
  zainstalowanych pluginów, które deklarują `contracts.webFetchProviders` i rejestrują
  zgodnego dostawcę w czasie wykonywania. Obecnie tę funkcję rezerwową zapewnia oficjalny plugin Firecrawl.
- Wywołania `web_fetch` w piaskownicy dopuszczają dostawców dołączonych do pakietu oraz zainstalowanych dostawców,
  których oficjalne pochodzenie z npm lub ClawHub zostało zweryfikowane. Obecnie pozwala to na użycie
  oficjalnego pluginu Firecrawl; zewnętrzne pluginy pobierania innych firm pozostają wykluczone.
- Jeśli Readability jest wyłączone, `web_fetch` przechodzi bezpośrednio do wybranego
  dostawcy rezerwowego. Jeśli żaden dostawca nie jest dostępny, kończy działanie niepowodzeniem.

## Zaufany serwer proxy ze zmiennych środowiskowych

Jeśli wdrożenie wymaga, aby `web_fetch` korzystało z zaufanego wychodzącego
serwera proxy HTTP(S), ustaw `tools.web.fetch.useTrustedEnvProxy: true`.

W tym trybie OpenClaw nadal stosuje kontrole SSRF oparte na nazwie hosta przed wysłaniem
żądania, ale pozwala serwerowi proxy rozwiązywać DNS zamiast lokalnego przypinania DNS.
Włącz tę opcję tylko wtedy, gdy serwer proxy jest kontrolowany przez operatora i egzekwuje
zasady ruchu wychodzącego po rozwiązaniu DNS.

<Note>
  Jeśli nie skonfigurowano zmiennej środowiskowej serwera proxy HTTP(S) albo host docelowy jest wykluczony przez
  `NO_PROXY`, `web_fetch` powraca do standardowej ścisłej ścieżki z lokalnym
  przypinaniem DNS.
</Note>

## Limity i bezpieczeństwo

- `maxChars` jest ograniczane do `tools.web.fetch.maxCharsCap` (domyślnie `20000`)
- Treść odpowiedzi jest ograniczona do `maxResponseBytes` (domyślnie `750000`, zakres
  32000-10000000) przed analizą; zbyt duże odpowiedzi są przycinane z ostrzeżeniem
- Prywatne/wewnętrzne nazwy hostów są blokowane
- `tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` oraz
  `tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange` to wąskie opcjonalne zgody
  przeznaczone dla zaufanych stosów proxy z fałszywymi adresami IP; pozostaw je nieustawione, chyba że serwer proxy zarządza
  tymi syntetycznymi zakresami i egzekwuje własne zasady dotyczące miejsc docelowych
- Przekierowania są sprawdzane i ograniczane przez `maxRedirects` (domyślnie `3`)
- `useTrustedEnvProxy` wymaga jawnego włączenia i powinno być włączane wyłącznie dla
  serwerów proxy kontrolowanych przez operatora, które nadal egzekwują zasady ruchu wychodzącego po rozwiązaniu
  DNS
- `web_fetch` działa w miarę możliwości — niektóre witryny wymagają [przeglądarki internetowej](/pl/tools/browser)

## Profile narzędzi

Jeśli używasz profili narzędzi lub list dozwolonych elementów, dodaj `web_fetch` albo `group:web`:

```json5
{
  tools: {
    allow: ["web_fetch"],
    // albo: allow: ["group:web"]  (obejmuje web_fetch, web_search oraz x_search)
  },
}
```

## Powiązane

- [Wyszukiwanie w internecie](/pl/tools/web) — przeszukiwanie internetu przy użyciu wielu dostawców
- [Przeglądarka internetowa](/pl/tools/browser) — pełna automatyzacja przeglądarki dla witryn intensywnie korzystających z JS
- [Firecrawl](/pl/tools/firecrawl) — narzędzia Firecrawl do wyszukiwania i pobierania treści
