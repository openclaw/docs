---
read_when:
    - Chcesz, aby agenty pokazywały zmiany w kodzie lub Markdown jako różnice
    - Chcesz adres URL podglądu gotowy do użycia z canvasem albo wyrenderowany plik diff
    - Potrzebujesz kontrolowanych, tymczasowych artefaktów różnic z bezpiecznymi ustawieniami domyślnymi
sidebarTitle: Diffs
summary: Przeglądarka różnic tylko do odczytu i renderer plików dla agentów (opcjonalne narzędzie pluginu)
title: Różnice
x-i18n:
    generated_at: "2026-05-02T10:04:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 935f19ce45ff9a91d2c87c70603ce39b0f27f3fe58e52d809f25000a0c1ae82f
    source_path: tools/diffs.md
    workflow: 16
---

`diffs` to opcjonalne narzędzie Plugin z krótkimi wbudowanymi wskazówkami systemowymi i towarzyszącą mu umiejętnością, która przekształca treść zmian w artefakt różnic tylko do odczytu dla agentów.

Przyjmuje jedno z poniższych:

- tekst `before` i `after`
- ujednolicony `patch`

Może zwrócić:

- adres URL przeglądarki Gateway do prezentacji na kanwie
- ścieżkę wyrenderowanego pliku (PNG lub PDF) do dostarczenia w wiadomości
- oba wyniki w jednym wywołaniu

Po włączeniu Plugin dodaje zwięzłe wskazówki użycia do przestrzeni promptu systemowego i udostępnia też szczegółową umiejętność dla przypadków, w których agent potrzebuje pełniejszych instrukcji.

## Szybki start

<Steps>
  <Step title="Install the plugin">
    ```bash
    openclaw plugins install diffs
    ```
  </Step>
  <Step title="Enable the plugin">
    ```json5
    {
      plugins: {
        entries: {
          diffs: {
            enabled: true,
          },
        },
      },
    }
    ```
  </Step>
  <Step title="Pick a mode">
    <Tabs>
      <Tab title="view">
        Przepływy z kanwą jako pierwszym widokiem: agenci wywołują `diffs` z `mode: "view"` i otwierają `details.viewerUrl` za pomocą `canvas present`.
      </Tab>
      <Tab title="file">
        Dostarczanie pliku na czacie: agenci wywołują `diffs` z `mode: "file"` i wysyłają `details.filePath` za pomocą `message`, używając `path` lub `filePath`.
      </Tab>
      <Tab title="both">
        Tryb łączony: agenci wywołują `diffs` z `mode: "both"`, aby uzyskać oba artefakty w jednym wywołaniu.
      </Tab>
    </Tabs>
  </Step>
</Steps>

## Wyłączanie wbudowanych wskazówek systemowych

Jeśli chcesz pozostawić narzędzie `diffs` włączone, ale wyłączyć jego wbudowane wskazówki promptu systemowego, ustaw `plugins.entries.diffs.hooks.allowPromptInjection` na `false`:

```json5
{
  plugins: {
    entries: {
      diffs: {
        enabled: true,
        hooks: {
          allowPromptInjection: false,
        },
      },
    },
  },
}
```

Blokuje to hook `before_prompt_build` Plugin diffs, pozostawiając Plugin, narzędzie i towarzyszącą umiejętność dostępne.

Jeśli chcesz wyłączyć zarówno wskazówki, jak i narzędzie, wyłącz zamiast tego Plugin.

## Typowy przepływ pracy agenta

<Steps>
  <Step title="Call diffs">
    Agent wywołuje narzędzie `diffs` z danymi wejściowymi.
  </Step>
  <Step title="Read details">
    Agent odczytuje pola `details` z odpowiedzi.
  </Step>
  <Step title="Present">
    Agent otwiera `details.viewerUrl` za pomocą `canvas present`, wysyła `details.filePath` za pomocą `message`, używając `path` lub `filePath`, albo robi jedno i drugie.
  </Step>
</Steps>

## Przykłady danych wejściowych

<Tabs>
  <Tab title="Before and after">
    ```json
    {
      "before": "# Hello\n\nOne",
      "after": "# Hello\n\nTwo",
      "path": "docs/example.md",
      "mode": "view"
    }
    ```
  </Tab>
  <Tab title="Patch">
    ```json
    {
      "patch": "diff --git a/src/example.ts b/src/example.ts\n--- a/src/example.ts\n+++ b/src/example.ts\n@@ -1 +1 @@\n-const x = 1;\n+const x = 2;\n",
      "mode": "both"
    }
    ```
  </Tab>
</Tabs>

## Dokumentacja danych wejściowych narzędzia

Wszystkie pola są opcjonalne, chyba że zaznaczono inaczej.

<ParamField path="before" type="string">
  Oryginalny tekst. Wymagane z `after`, gdy pominięto `patch`.
</ParamField>
<ParamField path="after" type="string">
  Zaktualizowany tekst. Wymagane z `before`, gdy pominięto `patch`.
</ParamField>
<ParamField path="patch" type="string">
  Tekst ujednoliconego diffu. Wzajemnie wyklucza się z `before` i `after`.
</ParamField>
<ParamField path="path" type="string">
  Wyświetlana nazwa pliku dla trybu przed i po.
</ParamField>
<ParamField path="lang" type="string">
  Wskazówka nadpisania języka dla trybu przed i po. Nieznane wartości wracają do zwykłego tekstu.
</ParamField>
<ParamField path="title" type="string">
  Nadpisanie tytułu przeglądarki.
</ParamField>
<ParamField path="mode" type='"view" | "file" | "both"'>
  Tryb wyjścia. Domyślnie używa wartości domyślnej Plugin `defaults.mode`. Przestarzały alias: `"image"` działa jak `"file"` i nadal jest akceptowany ze względu na zgodność wsteczną.
</ParamField>
<ParamField path="theme" type='"light" | "dark"'>
  Motyw przeglądarki. Domyślnie używa wartości domyślnej Plugin `defaults.theme`.
</ParamField>
<ParamField path="layout" type='"unified" | "split"'>
  Układ diffu. Domyślnie używa wartości domyślnej Plugin `defaults.layout`.
</ParamField>
<ParamField path="expandUnchanged" type="boolean">
  Rozwijaj niezmienione sekcje, gdy dostępny jest pełny kontekst. Tylko opcja pojedynczego wywołania (nie jest domyślnym kluczem Plugin).
</ParamField>
<ParamField path="fileFormat" type='"png" | "pdf"'>
  Format wyrenderowanego pliku. Domyślnie używa wartości domyślnej Plugin `defaults.fileFormat`.
</ParamField>
<ParamField path="fileQuality" type='"standard" | "hq" | "print"'>
  Ustawienie jakości renderowania PNG lub PDF.
</ParamField>
<ParamField path="fileScale" type="number">
  Nadpisanie skali urządzenia (`1`-`4`).
</ParamField>
<ParamField path="fileMaxWidth" type="number">
  Maksymalna szerokość renderowania w pikselach CSS (`640`-`2400`).
</ParamField>
<ParamField path="ttlSeconds" type="number" default="1800">
  TTL artefaktu w sekundach dla wyjść przeglądarki i samodzielnego pliku. Maksymalnie 21600.
</ParamField>
<ParamField path="baseUrl" type="string">
  Nadpisanie źródła adresu URL przeglądarki. Nadpisuje `viewerBaseUrl` Plugin. Musi być `http` lub `https`, bez zapytania ani hasha.
</ParamField>

<AccordionGroup>
  <Accordion title="Legacy input aliases">
    Nadal akceptowane ze względu na zgodność wsteczną:

    - `format` -> `fileFormat`
    - `imageFormat` -> `fileFormat`
    - `imageQuality` -> `fileQuality`
    - `imageScale` -> `fileScale`
    - `imageMaxWidth` -> `fileMaxWidth`

  </Accordion>
  <Accordion title="Validation and limits">
    - `before` i `after`: każde maks. 512 KiB.
    - `patch`: maks. 2 MiB.
    - `path`: maks. 2048 bajtów.
    - `lang`: maks. 128 bajtów.
    - `title`: maks. 1024 bajty.
    - Limit złożoności łatki: maks. 128 plików i 120000 łącznych wierszy.
    - Jednoczesne użycie `patch` oraz `before` lub `after` jest odrzucane.
    - Limity bezpieczeństwa wyrenderowanego pliku (dotyczą PNG i PDF):
      - `fileQuality: "standard"`: maks. 8 MP (8 000 000 wyrenderowanych pikseli).
      - `fileQuality: "hq"`: maks. 14 MP (14 000 000 wyrenderowanych pikseli).
      - `fileQuality: "print"`: maks. 24 MP (24 000 000 wyrenderowanych pikseli).
      - PDF ma również limit 50 stron.

  </Accordion>
</AccordionGroup>

## Kontrakt szczegółów wyjścia

Narzędzie zwraca ustrukturyzowane metadane w `details`.

<AccordionGroup>
  <Accordion title="Viewer fields">
    Wspólne pola dla trybów, które tworzą przeglądarkę:

    - `artifactId`
    - `viewerUrl`
    - `viewerPath`
    - `title`
    - `expiresAt`
    - `inputKind`
    - `fileCount`
    - `mode`
    - `context` (`agentId`, `sessionId`, `messageChannel`, `agentAccountId`, gdy dostępne)

  </Accordion>
  <Accordion title="File fields">
    Pola pliku, gdy renderowany jest PNG lub PDF:

    - `artifactId`
    - `expiresAt`
    - `filePath`
    - `path` (ta sama wartość co `filePath`, dla zgodności z narzędziem wiadomości)
    - `fileBytes`
    - `fileFormat`
    - `fileQuality`
    - `fileScale`
    - `fileMaxWidth`

  </Accordion>
  <Accordion title="Compatibility aliases">
    Zwracane również dla istniejących wywołujących:

    - `format` (ta sama wartość co `fileFormat`)
    - `imagePath` (ta sama wartość co `filePath`)
    - `imageBytes` (ta sama wartość co `fileBytes`)
    - `imageQuality` (ta sama wartość co `fileQuality`)
    - `imageScale` (ta sama wartość co `fileScale`)
    - `imageMaxWidth` (ta sama wartość co `fileMaxWidth`)

  </Accordion>
</AccordionGroup>

Podsumowanie zachowania trybów:

| Tryb     | Co jest zwracane                                                                                                       |
| -------- | ---------------------------------------------------------------------------------------------------------------------- |
| `"view"` | Tylko pola przeglądarki.                                                                                               |
| `"file"` | Tylko pola pliku, bez artefaktu przeglądarki.                                                                          |
| `"both"` | Pola przeglądarki oraz pola pliku. Jeśli renderowanie pliku się nie powiedzie, przeglądarka nadal zwraca alias `fileError` i `imageError`. |

## Zwinięte niezmienione sekcje

- Przeglądarka może pokazywać wiersze takie jak `N unmodified lines`.
- Elementy sterujące rozwijaniem w tych wierszach są warunkowe i nie są gwarantowane dla każdego rodzaju danych wejściowych.
- Elementy sterujące rozwijaniem pojawiają się, gdy wyrenderowany diff zawiera rozwijalne dane kontekstowe, co jest typowe dla danych wejściowych przed i po.
- W przypadku wielu danych wejściowych w postaci ujednoliconych łatek pominięte treści kontekstu nie są dostępne w sparsowanych hunkach łatki, więc wiersz może pojawić się bez elementów sterujących rozwijaniem. To oczekiwane zachowanie.
- `expandUnchanged` ma zastosowanie tylko wtedy, gdy istnieje rozwijalny kontekst.

## Wartości domyślne Plugin

Ustaw wartości domyślne dla całego Plugin w `~/.openclaw/openclaw.json`:

```json5
{
  plugins: {
    entries: {
      diffs: {
        enabled: true,
        config: {
          defaults: {
            fontFamily: "Fira Code",
            fontSize: 15,
            lineSpacing: 1.6,
            layout: "unified",
            showLineNumbers: true,
            diffIndicators: "bars",
            wordWrap: true,
            background: true,
            theme: "dark",
            fileFormat: "png",
            fileQuality: "standard",
            fileScale: 2,
            fileMaxWidth: 960,
            mode: "both",
          },
        },
      },
    },
  },
}
```

Obsługiwane wartości domyślne:

- `fontFamily`
- `fontSize`
- `lineSpacing`
- `layout`
- `showLineNumbers`
- `diffIndicators`
- `wordWrap`
- `background`
- `theme`
- `fileFormat`
- `fileQuality`
- `fileScale`
- `fileMaxWidth`
- `mode`

Jawne parametry narzędzia nadpisują te wartości domyślne.

### Konfiguracja trwałego adresu URL przeglądarki

<ParamField path="viewerBaseUrl" type="string">
  Fallback należący do Plugin dla zwracanych linków przeglądarki, gdy wywołanie narzędzia nie przekazuje `baseUrl`. Musi być `http` lub `https`, bez zapytania ani hasha.
</ParamField>

```json5
{
  plugins: {
    entries: {
      diffs: {
        enabled: true,
        config: {
          viewerBaseUrl: "https://gateway.example.com/openclaw",
        },
      },
    },
  },
}
```

## Konfiguracja bezpieczeństwa

<ParamField path="security.allowRemoteViewer" type="boolean" default="false">
  `false`: żądania do tras przeglądarki spoza loopback są odrzucane. `true`: zdalne przeglądarki są dozwolone, jeśli ścieżka z tokenem jest prawidłowa.
</ParamField>

```json5
{
  plugins: {
    entries: {
      diffs: {
        enabled: true,
        config: {
          security: {
            allowRemoteViewer: false,
          },
        },
      },
    },
  },
}
```

## Cykl życia artefaktu i przechowywanie

- Artefakty są przechowywane w tymczasowym podfolderze: `$TMPDIR/openclaw-diffs`.
- Metadane artefaktu przeglądarki zawierają:
  - losowy identyfikator artefaktu (20 znaków szesnastkowych)
  - losowy token (48 znaków szesnastkowych)
  - `createdAt` i `expiresAt`
  - zapisaną ścieżkę `viewer.html`
- Domyślny TTL artefaktu wynosi 30 minut, gdy nie zostanie określony.
- Maksymalny akceptowany TTL przeglądarki wynosi 6 godzin.
- Czyszczenie uruchamia się oportunistycznie po utworzeniu artefaktu.
- Wygasłe artefakty są usuwane.
- Czyszczenie fallback usuwa nieaktualne foldery starsze niż 24 godziny, gdy brakuje metadanych.

## Adres URL przeglądarki i zachowanie sieci

Trasa przeglądarki:

- `/plugins/diffs/view/{artifactId}/{token}`

Zasoby przeglądarki:

- `/plugins/diffs/assets/viewer.js`
- `/plugins/diffs/assets/viewer-runtime.js`

Dokument przeglądarki rozwiązuje te zasoby względem adresu URL przeglądarki, więc opcjonalny prefiks ścieżki `baseUrl` jest zachowywany także dla obu żądań zasobów.

Zachowanie konstruowania adresu URL:

- Jeśli podano `baseUrl` w wywołaniu narzędzia, jest ono używane po ścisłej walidacji.
- W przeciwnym razie, jeśli skonfigurowano `viewerBaseUrl` Plugin, jest ono używane.
- Bez żadnego z tych nadpisań adres URL przeglądarki domyślnie wskazuje loopback `127.0.0.1`.
- Jeśli tryb bindowania Gateway to `custom` i ustawiono `gateway.customBindHost`, używany jest ten host.

Reguły `baseUrl`:

- Musi być `http://` lub `https://`.
- Zapytanie i hash są odrzucane.
- Dozwolone jest źródło oraz opcjonalna ścieżka bazowa.

## Model bezpieczeństwa

<AccordionGroup>
  <Accordion title="Wzmocnienie zabezpieczeń viewer">
    - Domyślnie tylko przez local loopback.
    - Tokenizowane ścieżki viewer ze ścisłą walidacją identyfikatora i tokenu.
    - CSP odpowiedzi viewer:
      - `default-src 'none'`
      - skrypty i zasoby tylko z własnego źródła
      - brak wychodzącego `connect-src`
    - Ograniczanie zdalnych nieudanych prób, gdy dostęp zdalny jest włączony:
      - 40 niepowodzeń na 60 sekund
      - 60-sekundowa blokada (`429 Too Many Requests`)

  </Accordion>
  <Accordion title="Wzmocnienie renderowania plików">
    - Routing żądań przeglądarki do zrzutów ekranu domyślnie odmawia dostępu.
    - Dozwolone są tylko lokalne zasoby viewer z `http://127.0.0.1/plugins/diffs/assets/*`.
    - Zewnętrzne żądania sieciowe są blokowane.

  </Accordion>
</AccordionGroup>

## Wymagania przeglądarki dla trybu pliku

`mode: "file"` i `mode: "both"` wymagają przeglądarki zgodnej z Chromium.

Kolejność rozpoznawania:

<Steps>
  <Step title="Konfiguracja">
    `browser.executablePath` w konfiguracji OpenClaw.
  </Step>
  <Step title="Zmienne środowiskowe">
    - `OPENCLAW_BROWSER_EXECUTABLE_PATH`
    - `BROWSER_EXECUTABLE_PATH`
    - `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`

  </Step>
  <Step title="Zapasowy mechanizm platformy">
    Zapasowe wykrywanie polecenia/ścieżki platformy.
  </Step>
</Steps>

Typowy tekst błędu:

- `Diff PNG/PDF rendering requires a Chromium-compatible browser...`

Napraw to, instalując Chrome, Chromium, Edge albo Brave, lub ustawiając jedną z powyższych opcji ścieżki do pliku wykonywalnego.

## Rozwiązywanie problemów

<AccordionGroup>
  <Accordion title="Błędy walidacji danych wejściowych">
    - `Provide patch or both before and after text.` — dołącz oba pola `before` i `after` albo podaj `patch`.
    - `Provide either patch or before/after input, not both.` — nie mieszaj trybów wejściowych.
    - `Invalid baseUrl: ...` — użyj źródła `http(s)` z opcjonalną ścieżką, bez zapytania/hasza.
    - `{field} exceeds maximum size (...)` — zmniejsz rozmiar payloadu.
    - Odrzucenie dużej łatki — zmniejsz liczbę plików łatki albo łączną liczbę wierszy.

  </Accordion>
  <Accordion title="Dostępność viewer">
    - URL viewer domyślnie rozpoznaje się na `127.0.0.1`.
    - W scenariuszach dostępu zdalnego:
      - ustaw `viewerBaseUrl` Plugin, albo
      - przekaż `baseUrl` dla każdego wywołania narzędzia, albo
      - użyj `gateway.bind=custom` i `gateway.customBindHost`
    - Jeśli `gateway.trustedProxies` obejmuje local loopback dla proxy na tym samym hoście (na przykład Tailscale Serve), surowe żądania viewer przez local loopback bez przekazanych nagłówków client-IP zawodzą w trybie zamkniętym zgodnie z projektem.
    - Dla tej topologii proxy:
      - preferuj `mode: "file"` albo `mode: "both"`, gdy potrzebujesz tylko załącznika, albo
      - celowo włącz `security.allowRemoteViewer` i ustaw `viewerBaseUrl` Plugin lub przekaż proxy/publiczny `baseUrl`, gdy potrzebujesz udostępnialnego URL viewer
    - Włączaj `security.allowRemoteViewer` tylko wtedy, gdy zamierzasz udostępnić zewnętrzny dostęp do viewer.

  </Accordion>
  <Accordion title="Wiersz niezmodyfikowanych linii nie ma przycisku rozwijania">
    Może się tak zdarzyć dla danych wejściowych łatki, gdy łatka nie zawiera rozwijalnego kontekstu. Jest to oczekiwane i nie oznacza awarii viewer.
  </Accordion>
  <Accordion title="Nie znaleziono artefaktu">
    - Artefakt wygasł z powodu TTL.
    - Token albo ścieżka się zmieniły.
    - Czyszczenie usunęło nieaktualne dane.

  </Accordion>
</AccordionGroup>

## Wskazówki operacyjne

- Preferuj `mode: "view"` dla lokalnych interaktywnych przeglądów w canvas.
- Preferuj `mode: "file"` dla wychodzących kanałów czatu, które potrzebują załącznika.
- Pozostaw `allowRemoteViewer` wyłączone, chyba że wdrożenie wymaga zdalnych adresów URL viewer.
- Ustaw jawnie krótkie `ttlSeconds` dla wrażliwych diffów.
- Unikaj wysyłania sekretów w danych wejściowych diffu, gdy nie jest to wymagane.
- Jeśli Twój kanał agresywnie kompresuje obrazy (na przykład Telegram albo WhatsApp), preferuj wyjście PDF (`fileFormat: "pdf"`).

<Note>
Silnik renderowania diffów obsługiwany przez [Diffs](https://diffs.com).
</Note>

## Powiązane

- [Przeglądarka](/pl/tools/browser)
- [Plugins](/pl/tools/plugin)
- [Przegląd narzędzi](/pl/tools)
