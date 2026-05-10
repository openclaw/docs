---
read_when:
    - Chcesz, aby agenci pokazywali zmiany w kodzie lub Markdownie w formie różnic
    - Chcesz adresu URL podglądu gotowego do użycia w canvasie albo wyrenderowanego pliku diff
    - Potrzebne są kontrolowane, tymczasowe artefakty diff z bezpiecznymi ustawieniami domyślnymi
sidebarTitle: Diffs
summary: Przeglądarka różnic i renderer plików tylko do odczytu dla agentów (opcjonalne narzędzie Plugin)
title: Różnice
x-i18n:
    generated_at: "2026-05-10T19:56:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: b9a3dfcab6b4c654645075e3768c13726e10df10632d62ffeeb4de7cc41edf58
    source_path: tools/diffs.md
    workflow: 16
---

`diffs` to opcjonalne narzędzie Plugin z krótkimi wbudowanymi wskazówkami systemowymi i towarzyszącą mu umiejętnością, która przekształca treść zmian w artefakt diff tylko do odczytu dla agentów.

Przyjmuje albo:

- tekst `before` i `after`
- zunifikowany `patch`

Może zwrócić:

- adres URL przeglądarki gateway do prezentacji na canvas
- ścieżkę wyrenderowanego pliku (PNG lub PDF) do dostarczenia w wiadomości
- oba wyniki w jednym wywołaniu

Po włączeniu Plugin dodaje zwięzłe wskazówki użycia do przestrzeni promptu systemowego, a także udostępnia szczegółową umiejętność dla przypadków, gdy agent potrzebuje pełniejszych instrukcji.

## Szybki start

<Steps>
  <Step title="Zainstaluj Plugin">
    ```bash
    openclaw plugins install diffs
    ```
  </Step>
  <Step title="Włącz Plugin">
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
  <Step title="Wybierz tryb">
    <Tabs>
      <Tab title="view">
        Przepływy z canvas na pierwszym planie: agenci wywołują `diffs` z `mode: "view"` i otwierają `details.viewerUrl` za pomocą `canvas present`.
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

## Wyłącz wbudowane wskazówki systemowe

Jeśli chcesz zachować włączone narzędzie `diffs`, ale wyłączyć jego wbudowane wskazówki promptu systemowego, ustaw `plugins.entries.diffs.hooks.allowPromptInjection` na `false`:

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

Blokuje to hook `before_prompt_build` pluginu diffs, pozostawiając dostępne Plugin, narzędzie i towarzyszącą umiejętność.

Jeśli chcesz wyłączyć zarówno wskazówki, jak i narzędzie, wyłącz zamiast tego Plugin.

## Typowy przepływ pracy agenta

<Steps>
  <Step title="Wywołaj diffs">
    Agent wywołuje narzędzie `diffs` z danymi wejściowymi.
  </Step>
  <Step title="Odczytaj details">
    Agent odczytuje pola `details` z odpowiedzi.
  </Step>
  <Step title="Zaprezentuj">
    Agent otwiera `details.viewerUrl` za pomocą `canvas present`, wysyła `details.filePath` za pomocą `message`, używając `path` lub `filePath`, albo robi jedno i drugie.
  </Step>
</Steps>

## Przykłady danych wejściowych

<Tabs>
  <Tab title="Przed i po">
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

## Referencja danych wejściowych narzędzia

Wszystkie pola są opcjonalne, chyba że zaznaczono inaczej.

<ParamField path="before" type="string">
  Tekst oryginalny. Wymagany z `after`, gdy pominięto `patch`.
</ParamField>
<ParamField path="after" type="string">
  Zaktualizowany tekst. Wymagany z `before`, gdy pominięto `patch`.
</ParamField>
<ParamField path="patch" type="string">
  Tekst zunifikowanego diff. Wzajemnie wyklucza się z `before` i `after`.
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
  Tryb wyjścia. Domyślnie używa wartości domyślnej Plugin `defaults.mode`. Przestarzały alias: `"image"` działa jak `"file"` i nadal jest akceptowany dla zgodności wstecznej.
</ParamField>
<ParamField path="theme" type='"light" | "dark"'>
  Motyw przeglądarki. Domyślnie używa wartości domyślnej Plugin `defaults.theme`.
</ParamField>
<ParamField path="layout" type='"unified" | "split"'>
  Układ diff. Domyślnie używa wartości domyślnej Plugin `defaults.layout`.
</ParamField>
<ParamField path="expandUnchanged" type="boolean">
  Rozwiń niezmienione sekcje, gdy dostępny jest pełny kontekst. Tylko opcja dla pojedynczego wywołania (nie jest domyślnym kluczem Plugin).
</ParamField>
<ParamField path="fileFormat" type='"png" | "pdf"'>
  Format wyrenderowanego pliku. Domyślnie używa wartości domyślnej Plugin `defaults.fileFormat`.
</ParamField>
<ParamField path="fileQuality" type='"standard" | "hq" | "print"'>
  Preset jakości dla renderowania PNG lub PDF.
</ParamField>
<ParamField path="fileScale" type="number">
  Nadpisanie skali urządzenia (`1`-`4`).
</ParamField>
<ParamField path="fileMaxWidth" type="number">
  Maksymalna szerokość renderowania w pikselach CSS (`640`-`2400`).
</ParamField>
<ParamField path="ttlSeconds" type="number" default="1800">
  TTL artefaktu w sekundach dla wyników przeglądarki i samodzielnego pliku. Maks. 21600.
</ParamField>
<ParamField path="baseUrl" type="string">
  Nadpisanie pochodzenia adresu URL przeglądarki. Nadpisuje `viewerBaseUrl` Plugin. Musi być `http` lub `https`, bez query/hash.
</ParamField>

<AccordionGroup>
  <Accordion title="Starsze aliasy danych wejściowych">
    Nadal akceptowane dla zgodności wstecznej:

    - `format` -> `fileFormat`
    - `imageFormat` -> `fileFormat`
    - `imageQuality` -> `fileQuality`
    - `imageScale` -> `fileScale`
    - `imageMaxWidth` -> `fileMaxWidth`

  </Accordion>
  <Accordion title="Walidacja i limity">
    - `before` i `after` mają maks. po 512 KiB.
    - `patch` maks. 2 MiB.
    - `path` maks. 2048 bajtów.
    - `lang` maks. 128 bajtów.
    - `title` maks. 1024 bajty.
    - Limit złożoności patcha: maks. 128 plików i 120000 łącznych wierszy.
    - `patch` razem z `before` lub `after` jest odrzucany.
    - Limity bezpieczeństwa wyrenderowanego pliku (dotyczą PNG i PDF):
      - `fileQuality: "standard"`: maks. 8 MP (8 000 000 wyrenderowanych pikseli).
      - `fileQuality: "hq"`: maks. 14 MP (14 000 000 wyrenderowanych pikseli).
      - `fileQuality: "print"`: maks. 24 MP (24 000 000 wyrenderowanych pikseli).
      - PDF ma także maksimum 50 stron.

  </Accordion>
</AccordionGroup>

## Kontrakt szczegółów wyjściowych

Narzędzie zwraca ustrukturyzowane metadane w `details`.

<AccordionGroup>
  <Accordion title="Pola przeglądarki">
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
  <Accordion title="Pola pliku">
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
  <Accordion title="Aliasy zgodności">
    Zwracane także dla istniejących wywołujących:

    - `format` (ta sama wartość co `fileFormat`)
    - `imagePath` (ta sama wartość co `filePath`)
    - `imageBytes` (ta sama wartość co `fileBytes`)
    - `imageQuality` (ta sama wartość co `fileQuality`)
    - `imageScale` (ta sama wartość co `fileScale`)
    - `imageMaxWidth` (ta sama wartość co `fileMaxWidth`)

  </Accordion>
</AccordionGroup>

Podsumowanie działania trybów:

| Tryb     | Co jest zwracane                                                                                                       |
| -------- | ---------------------------------------------------------------------------------------------------------------------- |
| `"view"` | Tylko pola przeglądarki.                                                                                               |
| `"file"` | Tylko pola pliku, bez artefaktu przeglądarki.                                                                          |
| `"both"` | Pola przeglądarki plus pola pliku. Jeśli renderowanie pliku się nie powiedzie, przeglądarka nadal zwraca wynik z aliasem `fileError` i `imageError`. |

## Zwinięte niezmienione sekcje

- Przeglądarka może pokazywać wiersze takie jak `N unmodified lines`.
- Kontrolki rozwijania w tych wierszach są warunkowe i nie są gwarantowane dla każdego rodzaju danych wejściowych.
- Kontrolki rozwijania pojawiają się, gdy wyrenderowany diff ma dane kontekstu możliwe do rozwinięcia, co jest typowe dla danych wejściowych przed i po.
- Dla wielu zunifikowanych danych wejściowych patcha pominięte treści kontekstu nie są dostępne w sparsowanych hunkach patcha, więc wiersz może pojawić się bez kontrolek rozwijania. To oczekiwane zachowanie.
- `expandUnchanged` ma zastosowanie tylko wtedy, gdy istnieje kontekst możliwy do rozwinięcia.

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
            ttlSeconds: 21600,
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
- `ttlSeconds`

Jawne parametry narzędzia nadpisują te wartości domyślne.

### Trwała konfiguracja adresu URL przeglądarki

<ParamField path="viewerBaseUrl" type="string">
  Rezerwowa wartość należąca do Plugin dla zwracanych linków przeglądarki, gdy wywołanie narzędzia nie przekazuje `baseUrl`. Musi być `http` lub `https`, bez query/hash.
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
  `false`: żądania inne niż loopback do tras przeglądarki są odrzucane. `true`: zdalne przeglądarki są dozwolone, jeśli tokenizowana ścieżka jest prawidłowa.
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

- Artefakty są przechowywane w podfolderze tymczasowym: `$TMPDIR/openclaw-diffs`.
- Metadane artefaktu przeglądarki zawierają:
  - losowy identyfikator artefaktu (20 znaków szesnastkowych)
  - losowy token (48 znaków szesnastkowych)
  - `createdAt` i `expiresAt`
  - zapisaną ścieżkę `viewer.html`
- Domyślny TTL artefaktu wynosi 30 minut, gdy nie podano inaczej.
- Maksymalny akceptowany TTL przeglądarki wynosi 6 godzin.
- Czyszczenie uruchamia się oportunistycznie po utworzeniu artefaktu.
- Wygasłe artefakty są usuwane.
- Czyszczenie rezerwowe usuwa nieaktualne foldery starsze niż 24 godziny, gdy brakuje metadanych.

## Adres URL przeglądarki i zachowanie sieciowe

Trasa przeglądarki:

- `/plugins/diffs/view/{artifactId}/{token}`

Zasoby przeglądarki:

- `/plugins/diffs/assets/viewer.js`
- `/plugins/diffs/assets/viewer-runtime.js`

Dokument przeglądarki rozwiązuje te zasoby względem adresu URL przeglądarki, więc opcjonalny prefiks ścieżki `baseUrl` jest zachowywany także dla obu żądań zasobów.

Zachowanie konstrukcji adresu URL:

- Jeśli podano `baseUrl` wywołania narzędzia, jest używane po ścisłej walidacji.
- W przeciwnym razie, jeśli skonfigurowano `viewerBaseUrl` Plugin, jest używane.
- Bez żadnego z tych nadpisań adres URL przeglądarki domyślnie używa loopback `127.0.0.1`.
- Jeśli tryb bindowania gateway to `custom` i ustawiono `gateway.customBindHost`, używany jest ten host.

Reguły `baseUrl`:

- Musi być `http://` lub `https://`.
- Query i hash są odrzucane.
- Dozwolone jest pochodzenie plus opcjonalna ścieżka bazowa.

## Model bezpieczeństwa

<AccordionGroup>
  <Accordion title="Wzmocnienie bezpieczeństwa przeglądarki">
    - Domyślnie tylko loopback.
    - Tokenizowane ścieżki przeglądarki ze ścisłą walidacją identyfikatora i tokenu.
    - CSP odpowiedzi przeglądarki:
      - `default-src 'none'`
      - skrypty i zasoby tylko z tego samego źródła
      - brak wychodzącego `connect-src`
    - Ograniczanie zdalnych nietrafień, gdy dostęp zdalny jest włączony:
      - 40 niepowodzeń na 60 sekund
      - 60-sekundowa blokada (`429 Too Many Requests`)

  </Accordion>
  <Accordion title="Wzmocnienie bezpieczeństwa renderowania plików">
    - Trasowanie żądań przeglądarki zrzutów ekranu domyślnie odmawia dostępu.
    - Dozwolone są tylko lokalne zasoby przeglądarki z `http://127.0.0.1/plugins/diffs/assets/*`.
    - Zewnętrzne żądania sieciowe są blokowane.

  </Accordion>
</AccordionGroup>

## Wymagania przeglądarki dla trybu pliku

`mode: "file"` i `mode: "both"` wymagają przeglądarki zgodnej z Chromium.

Kolejność rozwiązywania:

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

Napraw to, instalując Chrome, Chromium, Edge lub Brave albo ustawiając jedną z powyższych opcji ścieżki do pliku wykonywalnego.

## Rozwiązywanie problemów

<AccordionGroup>
  <Accordion title="Błędy walidacji danych wejściowych">
    - `Provide patch or both before and after text.` — podaj zarówno `before`, jak i `after`, albo podaj `patch`.
    - `Provide either patch or before/after input, not both.` — nie mieszaj trybów wejścia.
    - `Invalid baseUrl: ...` — użyj źródła `http(s)` z opcjonalną ścieżką, bez zapytania/fragmentu.
    - `{field} exceeds maximum size (...)` — zmniejsz rozmiar ładunku.
    - Odrzucenie dużej poprawki — zmniejsz liczbę plików poprawki lub łączną liczbę wierszy.

  </Accordion>
  <Accordion title="Dostępność przeglądarki">
    - URL przeglądarki domyślnie rozwiązuje się do `127.0.0.1`.
    - W scenariuszach dostępu zdalnego:
      - ustaw `viewerBaseUrl` pluginu, albo
      - przekaż `baseUrl` dla każdego wywołania narzędzia, albo
      - użyj `gateway.bind=custom` i `gateway.customBindHost`
    - Jeśli `gateway.trustedProxies` obejmuje loopback dla proxy na tym samym hoście (na przykład Tailscale Serve), surowe żądania przeglądarki przez loopback bez przekazanych nagłówków IP klienta są z założenia zamykane niepowodzeniem.
    - Dla tej topologii proxy:
      - preferuj `mode: "file"` albo `mode: "both"`, gdy potrzebujesz tylko załącznika, albo
      - celowo włącz `security.allowRemoteViewer` i ustaw `viewerBaseUrl` pluginu albo przekaż proxy/publiczne `baseUrl`, gdy potrzebujesz udostępnialnego URL-a przeglądarki
    - Włącz `security.allowRemoteViewer` tylko wtedy, gdy zamierzasz udostępnić zewnętrzny dostęp do przeglądarki.

  </Accordion>
  <Accordion title="Wiersz niezmodyfikowanych linii nie ma przycisku rozwijania">
    Może się to zdarzyć dla wejścia poprawki, gdy poprawka nie zawiera rozwijalnego kontekstu. Jest to oczekiwane i nie oznacza awarii przeglądarki.
  </Accordion>
  <Accordion title="Nie znaleziono artefaktu">
    - Artefakt wygasł z powodu TTL.
    - Token lub ścieżka się zmieniły.
    - Czyszczenie usunęło nieaktualne dane.

  </Accordion>
</AccordionGroup>

## Wskazówki operacyjne

- Preferuj `mode: "view"` do lokalnych interaktywnych przeglądów w kanwie.
- Preferuj `mode: "file"` dla wychodzących kanałów czatu, które potrzebują załącznika.
- Pozostaw `allowRemoteViewer` wyłączone, chyba że Twoje wdrożenie wymaga zdalnych URL-i przeglądarki.
- Ustaw jawne krótkie `ttlSeconds` dla wrażliwych różnic.
- Unikaj wysyłania sekretów w wejściu różnic, gdy nie jest to wymagane.
- Jeśli Twój kanał agresywnie kompresuje obrazy (na przykład Telegram lub WhatsApp), preferuj wyjście PDF (`fileFormat: "pdf"`).

<Note>
Silnik renderowania różnic oparty na [Diffs](https://diffs.com).
</Note>

## Powiązane

- [Przeglądarka](/pl/tools/browser)
- [Pluginy](/pl/tools/plugin)
- [Przegląd narzędzi](/pl/tools)
