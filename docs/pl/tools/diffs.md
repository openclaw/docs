---
read_when:
    - Chcesz, aby agenci pokazywali zmiany w kodzie lub Markdown w formie różnic
    - Potrzebujesz adresu URL podglądu gotowego do użycia w kanwie albo wyrenderowanego pliku różnic
    - Potrzebujesz kontrolowanych, tymczasowych artefaktów różnic z bezpiecznymi ustawieniami domyślnymi
sidebarTitle: Diffs
summary: Przeglądarka różnic i renderer plików tylko do odczytu dla agentów (opcjonalne narzędzie Plugin)
title: Różnice
x-i18n:
    generated_at: "2026-04-30T10:21:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8d8938b11f6bc612168057b7f4f5ceaafb22c2445e015fb746795b2e93f033e5
    source_path: tools/diffs.md
    workflow: 16
---

`diffs` to opcjonalne narzędzie pluginu z krótkimi wbudowanymi wskazówkami systemowymi i towarzyszącą funkcją Skills, która przekształca treść zmian w artefakt różnic tylko do odczytu dla agentów.

Przyjmuje jedno z poniższych:

- tekst `before` i `after`
- ujednolicony `patch`

Może zwrócić:

- URL przeglądarki Gateway do prezentacji na canvasie
- wyrenderowaną ścieżkę pliku (PNG lub PDF) do dostarczenia w wiadomości
- oba wyniki w jednym wywołaniu

Po włączeniu plugin dodaje zwięzłe wskazówki użycia do przestrzeni promptu systemowego i udostępnia także szczegółową funkcję Skills dla przypadków, w których agent potrzebuje pełniejszych instrukcji.

## Szybki start

<Steps>
  <Step title="Włącz plugin">
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
        Przepływy z canvasem jako pierwszym miejscem prezentacji: agenci wywołują `diffs` z `mode: "view"` i otwierają `details.viewerUrl` za pomocą `canvas present`.
      </Tab>
      <Tab title="file">
        Dostarczanie plików na czacie: agenci wywołują `diffs` z `mode: "file"` i wysyłają `details.filePath` za pomocą `message`, używając `path` lub `filePath`.
      </Tab>
      <Tab title="both">
        Tryb łączony: agenci wywołują `diffs` z `mode: "both"`, aby uzyskać oba artefakty w jednym wywołaniu.
      </Tab>
    </Tabs>
  </Step>
</Steps>

## Wyłącz wbudowane wskazówki systemowe

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

To blokuje hook `before_prompt_build` pluginu diffs, zachowując dostępność pluginu, narzędzia i towarzyszącej funkcji Skills.

Jeśli chcesz wyłączyć zarówno wskazówki, jak i narzędzie, wyłącz zamiast tego plugin.

## Typowy przepływ pracy agenta

<Steps>
  <Step title="Wywołaj diffs">
    Agent wywołuje narzędzie `diffs` z danymi wejściowymi.
  </Step>
  <Step title="Odczytaj szczegóły">
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
  Tryb wyjścia. Domyślnie używa wartości domyślnej pluginu `defaults.mode`. Przestarzały alias: `"image"` zachowuje się jak `"file"` i nadal jest akceptowany dla zgodności wstecznej.
</ParamField>
<ParamField path="theme" type='"light" | "dark"'>
  Motyw przeglądarki. Domyślnie używa wartości domyślnej pluginu `defaults.theme`.
</ParamField>
<ParamField path="layout" type='"unified" | "split"'>
  Układ diffu. Domyślnie używa wartości domyślnej pluginu `defaults.layout`.
</ParamField>
<ParamField path="expandUnchanged" type="boolean">
  Rozwiń niezmienione sekcje, gdy dostępny jest pełny kontekst. Opcja tylko dla pojedynczego wywołania (nie jest domyślnym kluczem pluginu).
</ParamField>
<ParamField path="fileFormat" type='"png" | "pdf"'>
  Format wyrenderowanego pliku. Domyślnie używa wartości domyślnej pluginu `defaults.fileFormat`.
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
  TTL artefaktu w sekundach dla wyników przeglądarki i samodzielnego pliku. Maksymalnie 21600.
</ParamField>
<ParamField path="baseUrl" type="string">
  Nadpisanie źródła URL przeglądarki. Nadpisuje `viewerBaseUrl` pluginu. Musi być `http` lub `https`, bez zapytania ani hasha.
</ParamField>

<AccordionGroup>
  <Accordion title="Starsze aliasy wejściowe">
    Nadal akceptowane dla zgodności wstecznej:

    - `format` -> `fileFormat`
    - `imageFormat` -> `fileFormat`
    - `imageQuality` -> `fileQuality`
    - `imageScale` -> `fileScale`
    - `imageMaxWidth` -> `fileMaxWidth`

  </Accordion>
  <Accordion title="Walidacja i limity">
    - `before` i `after` mają maksymalnie po 512 KiB.
    - `patch` ma maksymalnie 2 MiB.
    - `path` ma maksymalnie 2048 bajtów.
    - `lang` ma maksymalnie 128 bajtów.
    - `title` ma maksymalnie 1024 bajty.
    - Limit złożoności patcha: maksymalnie 128 plików i 120000 łącznych linii.
    - `patch` razem z `before` lub `after` są odrzucane.
    - Limity bezpieczeństwa wyrenderowanego pliku (dotyczą PNG i PDF):
      - `fileQuality: "standard"`: maks. 8 MP (8 000 000 wyrenderowanych pikseli).
      - `fileQuality: "hq"`: maks. 14 MP (14 000 000 wyrenderowanych pikseli).
      - `fileQuality: "print"`: maks. 24 MP (24 000 000 wyrenderowanych pikseli).
      - PDF ma także limit maksymalnie 50 stron.

  </Accordion>
</AccordionGroup>

## Kontrakt szczegółów wyjściowych

Narzędzie zwraca ustrukturyzowane metadane pod `details`.

<AccordionGroup>
  <Accordion title="Pola przeglądarki">
    Wspólne pola dla trybów tworzących przeglądarkę:

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

Podsumowanie zachowania trybów:

| Tryb     | Co jest zwracane                                                                                                       |
| -------- | ---------------------------------------------------------------------------------------------------------------------- |
| `"view"` | Tylko pola przeglądarki.                                                                                               |
| `"file"` | Tylko pola pliku, bez artefaktu przeglądarki.                                                                          |
| `"both"` | Pola przeglądarki oraz pola pliku. Jeśli renderowanie pliku się nie powiedzie, przeglądarka nadal zostanie zwrócona z aliasem `fileError` i `imageError`. |

## Zwinięte niezmienione sekcje

- Przeglądarka może pokazywać wiersze takie jak `N unmodified lines`.
- Kontrolki rozwijania w tych wierszach są warunkowe i nie są gwarantowane dla każdego rodzaju danych wejściowych.
- Kontrolki rozwijania pojawiają się, gdy wyrenderowany diff ma rozwijalne dane kontekstowe, co jest typowe dla danych wejściowych przed i po zmianie.
- Dla wielu danych wejściowych w formacie unified patch pominięte treści kontekstowe nie są dostępne w sparsowanych hunkach patcha, więc wiersz może pojawić się bez kontrolek rozwijania. To oczekiwane zachowanie.
- `expandUnchanged` ma zastosowanie tylko wtedy, gdy istnieje rozwijalny kontekst.

## Domyślne wartości Plugin

Ustaw domyślne wartości dla całego Plugin w `~/.openclaw/openclaw.json`:

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

Jawne parametry narzędzia zastępują te wartości domyślne.

### Trwała konfiguracja adresu URL przeglądarki

<ParamField path="viewerBaseUrl" type="string">
  Należący do Plugin adres zapasowy dla zwracanych linków przeglądarki, gdy wywołanie narzędzia nie przekazuje `baseUrl`. Musi być `http` albo `https`, bez zapytania ani hasha.
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

## Konfiguracja zabezpieczeń

<ParamField path="security.allowRemoteViewer" type="boolean" default="false">
  `false`: żądania spoza loopback do tras przeglądarki są odrzucane. `true`: zdalne przeglądarki są dozwolone, jeśli tokenizowana ścieżka jest poprawna.
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

## Cykl życia i przechowywanie artefaktów

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
- Czyszczenie zapasowe usuwa nieaktualne foldery starsze niż 24 godziny, gdy brakuje metadanych.

## Adres URL przeglądarki i zachowanie sieciowe

Trasa przeglądarki:

- `/plugins/diffs/view/{artifactId}/{token}`

Zasoby przeglądarki:

- `/plugins/diffs/assets/viewer.js`
- `/plugins/diffs/assets/viewer-runtime.js`

Dokument przeglądarki rozwiązuje te zasoby względem adresu URL przeglądarki, więc opcjonalny prefiks ścieżki `baseUrl` jest zachowywany także dla obu żądań zasobów.

Zachowanie konstruowania adresu URL:

- Jeśli podano `baseUrl` w wywołaniu narzędzia, jest on używany po ścisłej walidacji.
- W przeciwnym razie, jeśli skonfigurowano `viewerBaseUrl` Plugin, jest on używany.
- Bez żadnego z tych nadpisań adres URL przeglądarki domyślnie używa loopback `127.0.0.1`.
- Jeśli tryb bindowania Gateway to `custom` i ustawiono `gateway.customBindHost`, używany jest ten host.

Reguły `baseUrl`:

- Musi być `http://` albo `https://`.
- Zapytanie i hash są odrzucane.
- Dozwolone jest origin oraz opcjonalna ścieżka bazowa.

## Model zabezpieczeń

<AccordionGroup>
  <Accordion title="Wzmocnienie przeglądarki">
    - Domyślnie tylko loopback.
    - Tokenizowane ścieżki przeglądarki ze ścisłą walidacją identyfikatora i tokenu.
    - CSP odpowiedzi przeglądarki:
      - `default-src 'none'`
      - skrypty i zasoby tylko z self
      - brak wychodzącego `connect-src`
    - Ograniczanie zdalnych chybień, gdy zdalny dostęp jest włączony:
      - 40 niepowodzeń na 60 sekund
      - 60-sekundowa blokada (`429 Too Many Requests`)

  </Accordion>
  <Accordion title="Wzmocnienie renderowania plików">
    - Routing żądań przeglądarki do zrzutów ekranu domyślnie odmawia dostępu.
    - Dozwolone są tylko lokalne zasoby przeglądarki z `http://127.0.0.1/plugins/diffs/assets/*`.
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
  <Step title="Rozwiązanie zastępcze platformy">
    Zastępcze wykrywanie poleceń/ścieżek platformy.
  </Step>
</Steps>

Typowy tekst błędu:

- `Diff PNG/PDF rendering requires a Chromium-compatible browser...`

Napraw, instalując Chrome, Chromium, Edge lub Brave albo ustawiając jedną z powyższych opcji ścieżki do pliku wykonywalnego.

## Rozwiązywanie problemów

<AccordionGroup>
  <Accordion title="Błędy walidacji danych wejściowych">
    - `Provide patch or both before and after text.` — dołącz oba pola `before` i `after` albo podaj `patch`.
    - `Provide either patch or before/after input, not both.` — nie mieszaj trybów danych wejściowych.
    - `Invalid baseUrl: ...` — użyj źródła `http(s)` z opcjonalną ścieżką, bez zapytania/hasza.
    - `{field} exceeds maximum size (...)` — zmniejsz rozmiar ładunku.
    - Odrzucenie dużej łatki — zmniejsz liczbę plików łatki lub łączną liczbę wierszy.

  </Accordion>
  <Accordion title="Dostępność przeglądarki">
    - Adres URL przeglądarki domyślnie rozwiązuje się do `127.0.0.1`.
    - W scenariuszach dostępu zdalnego:
      - ustaw `viewerBaseUrl` Pluginu, albo
      - przekaż `baseUrl` przy każdym wywołaniu narzędzia, albo
      - użyj `gateway.bind=custom` i `gateway.customBindHost`
    - Jeśli `gateway.trustedProxies` obejmuje pętlę zwrotną dla proxy na tym samym hoście (na przykład Tailscale Serve), surowe żądania przeglądarki przez pętlę zwrotną bez przekazanych nagłówków IP klienta zgodnie z projektem kończą się bezpiecznym niepowodzeniem.
    - Dla tej topologii proxy:
      - preferuj `mode: "file"` lub `mode: "both"`, gdy potrzebujesz tylko załącznika, albo
      - celowo włącz `security.allowRemoteViewer` i ustaw `viewerBaseUrl` Pluginu albo przekaż proxy/publiczny `baseUrl`, gdy potrzebujesz udostępnialnego adresu URL przeglądarki
    - Włączaj `security.allowRemoteViewer` tylko wtedy, gdy zamierzasz udostępnić przeglądarkę z zewnątrz.

  </Accordion>
  <Accordion title="Wiersz niezmodyfikowanych linii nie ma przycisku rozwijania">
    Może się tak zdarzyć dla danych wejściowych łatki, gdy łatka nie zawiera rozwijalnego kontekstu. Jest to oczekiwane i nie oznacza awarii przeglądarki.
  </Accordion>
  <Accordion title="Nie znaleziono artefaktu">
    - Artefakt wygasł z powodu TTL.
    - Token lub ścieżka się zmieniły.
    - Czyszczenie usunęło nieaktualne dane.

  </Accordion>
</AccordionGroup>

## Wskazówki operacyjne

- Preferuj `mode: "view"` do lokalnych interaktywnych przeglądów w canvas.
- Preferuj `mode: "file"` dla wychodzących kanałów czatu, które potrzebują załącznika.
- Pozostaw `allowRemoteViewer` wyłączone, chyba że Twoje wdrożenie wymaga zdalnych adresów URL przeglądarki.
- Ustaw wyraźnie krótkie `ttlSeconds` dla wrażliwych diffów.
- Unikaj wysyłania sekretów w danych wejściowych diffów, gdy nie jest to wymagane.
- Jeśli Twój kanał agresywnie kompresuje obrazy (na przykład Telegram lub WhatsApp), preferuj dane wyjściowe PDF (`fileFormat: "pdf"`).

<Note>
Silnik renderowania diffów oparty na [Diffs](https://diffs.com).
</Note>

## Powiązane

- [Przeglądarka](/pl/tools/browser)
- [Pluginy](/pl/tools/plugin)
- [Omówienie narzędzi](/pl/tools)
