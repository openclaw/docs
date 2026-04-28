---
read_when:
    - Chcesz, aby agenci pokazywali zmiany w kodzie lub Markdown jako różnice.
    - Chcesz adres URL widoku gotowego do Canvas albo wyrenderowany plik różnic.
    - Potrzebujesz kontrolowanych, tymczasowych artefaktów różnic z bezpiecznymi ustawieniami domyślnymi.
sidebarTitle: Diffs
summary: 'Tylko do odczytu: przeglądarka różnic i renderer plików dla agentów (opcjonalne narzędzie Plugin)'
title: Różnice
x-i18n:
    generated_at: "2026-04-26T11:42:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8af098a294a4ba56e1a8df3b4f9650802fc53392634fee97b330f03b69e10781
    source_path: tools/diffs.md
    workflow: 15
---

`diffs` to opcjonalne narzędzie Plugin z krótkimi wbudowanymi wskazówkami systemowymi i towarzyszącym Skill, który zamienia treść zmian w artefakt różnic tylko do odczytu dla agentów.

Akceptuje ono jeden z następujących wariantów:

- tekst `before` i `after`
- ujednolicony `patch`

Może zwracać:

- adres URL przeglądarki Gateway do prezentacji w Canvas
- ścieżkę do wyrenderowanego pliku (PNG lub PDF) do dostarczania w wiadomości
- oba wyniki w jednym wywołaniu

Po włączeniu Plugin dodaje zwięzłe wskazówki dotyczące użycia do przestrzeni system promptu oraz udostępnia szczegółowy Skill na wypadek, gdy agent potrzebuje pełniejszych instrukcji.

## Szybki start

<Steps>
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
        Przepływy zorientowane na Canvas: agenci wywołują `diffs` z `mode: "view"` i otwierają `details.viewerUrl` za pomocą `canvas present`.
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

Jeśli chcesz pozostawić narzędzie `diffs` włączone, ale wyłączyć jego wbudowane wskazówki w system prompt, ustaw `plugins.entries.diffs.hooks.allowPromptInjection` na `false`:

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

To blokuje hook `before_prompt_build` Pluginu diffs, pozostawiając jednocześnie dostępne Plugin, narzędzie i towarzyszący Skill.

Jeśli chcesz wyłączyć zarówno wskazówki, jak i narzędzie, zamiast tego wyłącz Plugin.

## Typowy przepływ pracy agenta

<Steps>
  <Step title="Wywołaj diffs">
    Agent wywołuje narzędzie `diffs` z danymi wejściowymi.
  </Step>
  <Step title="Odczytaj szczegóły">
    Agent odczytuje pola `details` z odpowiedzi.
  </Step>
  <Step title="Przedstaw">
    Agent albo otwiera `details.viewerUrl` za pomocą `canvas present`, wysyła `details.filePath` za pomocą `message`, używając `path` lub `filePath`, albo robi obie rzeczy.
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

## Dokumentacja danych wejściowych narzędzia

Wszystkie pola są opcjonalne, chyba że zaznaczono inaczej.

<ParamField path="before" type="string">
  Tekst oryginalny. Wymagany razem z `after`, gdy pominięto `patch`.
</ParamField>
<ParamField path="after" type="string">
  Tekst zaktualizowany. Wymagany razem z `before`, gdy pominięto `patch`.
</ParamField>
<ParamField path="patch" type="string">
  Tekst różnic ujednoliconych. Wzajemnie wyklucza się z `before` i `after`.
</ParamField>
<ParamField path="path" type="string">
  Wyświetlana nazwa pliku dla trybu before i after.
</ParamField>
<ParamField path="lang" type="string">
  Wskazówka zastąpienia języka dla trybu before i after. Nieznane wartości wracają do zwykłego tekstu.
</ParamField>
<ParamField path="title" type="string">
  Zastąpienie tytułu przeglądarki.
</ParamField>
<ParamField path="mode" type='"view" | "file" | "both"'>
  Tryb wyjścia. Domyślnie używana jest wartość domyślna Pluginu `defaults.mode`. Przestarzały alias: `"image"` działa jak `"file"` i nadal jest akceptowany dla zgodności wstecznej.
</ParamField>
<ParamField path="theme" type='"light" | "dark"'>
  Motyw przeglądarki. Domyślnie używana jest wartość domyślna Pluginu `defaults.theme`.
</ParamField>
<ParamField path="layout" type='"unified" | "split"'>
  Układ różnic. Domyślnie używana jest wartość domyślna Pluginu `defaults.layout`.
</ParamField>
<ParamField path="expandUnchanged" type="boolean">
  Rozwiń niezmienione sekcje, gdy dostępny jest pełny kontekst. Opcja tylko dla wywołania (nie jest kluczem domyślnym Pluginu).
</ParamField>
<ParamField path="fileFormat" type='"png" | "pdf"'>
  Format wyrenderowanego pliku. Domyślnie używana jest wartość domyślna Pluginu `defaults.fileFormat`.
</ParamField>
<ParamField path="fileQuality" type='"standard" | "hq" | "print"'>
  Ustawienie jakości dla renderowania PNG lub PDF.
</ParamField>
<ParamField path="fileScale" type="number">
  Zastąpienie skali urządzenia (`1`-`4`).
</ParamField>
<ParamField path="fileMaxWidth" type="number">
  Maksymalna szerokość renderowania w pikselach CSS (`640`-`2400`).
</ParamField>
<ParamField path="ttlSeconds" type="number" default="1800">
  TTL artefaktu w sekundach dla przeglądarki i samodzielnych wyników plikowych. Maksymalnie 21600.
</ParamField>
<ParamField path="baseUrl" type="string">
  Zastąpienie pochodzenia adresu URL przeglądarki. Zastępuje Plugin `viewerBaseUrl`. Musi używać `http` lub `https`, bez query/hash.
</ParamField>

<AccordionGroup>
  <Accordion title="Starsze aliasy wejścia">
    Nadal akceptowane dla zgodności wstecznej:

    - `format` -> `fileFormat`
    - `imageFormat` -> `fileFormat`
    - `imageQuality` -> `fileQuality`
    - `imageScale` -> `fileScale`
    - `imageMaxWidth` -> `fileMaxWidth`

  </Accordion>
  <Accordion title="Walidacja i limity">
    - `before` i `after` mają limit po 512 KiB.
    - `patch` ma limit 2 MiB.
    - `path` ma limit 2048 bajtów.
    - `lang` ma limit 128 bajtów.
    - `title` ma limit 1024 bajtów.
    - Limit złożoności patcha: maksymalnie 128 plików i 120000 linii łącznie.
    - `patch` razem z `before` lub `after` jest odrzucany.
    - Limity bezpieczeństwa dla renderowanych plików (dotyczą PNG i PDF):
      - `fileQuality: "standard"`: maks. 8 MP (8,000,000 wyrenderowanych pikseli).
      - `fileQuality: "hq"`: maks. 14 MP (14,000,000 wyrenderowanych pikseli).
      - `fileQuality: "print"`: maks. 24 MP (24,000,000 wyrenderowanych pikseli).
      - PDF ma dodatkowo limit 50 stron.

  </Accordion>
</AccordionGroup>

## Kontrakt szczegółów wyjścia

Narzędzie zwraca ustrukturyzowane metadane w `details`.

<AccordionGroup>
  <Accordion title="Pola przeglądarki">
    Współdzielone pola dla trybów tworzących przeglądarkę:

    - `artifactId`
    - `viewerUrl`
    - `viewerPath`
    - `title`
    - `expiresAt`
    - `inputKind`
    - `fileCount`
    - `mode`
    - `context` (`agentId`, `sessionId`, `messageChannel`, `agentAccountId`, gdy są dostępne)

  </Accordion>
  <Accordion title="Pola pliku">
    Pola pliku, gdy renderowany jest PNG lub PDF:

    - `artifactId`
    - `expiresAt`
    - `filePath`
    - `path` (ta sama wartość co `filePath`, dla zgodności z narzędziem message)
    - `fileBytes`
    - `fileFormat`
    - `fileQuality`
    - `fileScale`
    - `fileMaxWidth`

  </Accordion>
  <Accordion title="Aliasy zgodności">
    Zwracane również dla istniejących wywołujących:

    - `format` (ta sama wartość co `fileFormat`)
    - `imagePath` (ta sama wartość co `filePath`)
    - `imageBytes` (ta sama wartość co `fileBytes`)
    - `imageQuality` (ta sama wartość co `fileQuality`)
    - `imageScale` (ta sama wartość co `fileScale`)
    - `imageMaxWidth` (ta sama wartość co `fileMaxWidth`)

  </Accordion>
</AccordionGroup>

Podsumowanie działania trybów:

| Tryb     | Co jest zwracane                                                                 |
| -------- | -------------------------------------------------------------------------------- |
| `"view"` | Tylko pola przeglądarki.                                                         |
| `"file"` | Tylko pola pliku, bez artefaktu przeglądarki.                                    |
| `"both"` | Pola przeglądarki i pola pliku. Jeśli renderowanie pliku się nie powiedzie, przeglądarka nadal jest zwracana z `fileError` i aliasem `imageError`. |

## Zwinięte niezmienione sekcje

- Przeglądarka może pokazywać wiersze takie jak `N unmodified lines`.
- Elementy sterujące rozwijaniem tych wierszy są warunkowe i nie są gwarantowane dla każdego rodzaju danych wejściowych.
- Elementy sterujące rozwijaniem pojawiają się, gdy wyrenderowana różnica ma rozwijalne dane kontekstowe, co jest typowe dla danych wejściowych before i after.
- W przypadku wielu ujednoliconych danych wejściowych patch, pominięte treści kontekstowe nie są dostępne w sparsowanych hunkach patcha, więc wiersz może pojawić się bez elementów sterujących rozwijaniem. To jest oczekiwane zachowanie.
- `expandUnchanged` ma zastosowanie tylko wtedy, gdy istnieje rozwijalny kontekst.

## Wartości domyślne Pluginu

Ustaw domyślne wartości dla całego Pluginu w `~/.openclaw/openclaw.json`:

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
  Należąca do Pluginu wartość zapasowa dla zwracanych linków przeglądarki, gdy wywołanie narzędzia nie przekazuje `baseUrl`. Musi używać `http` lub `https`, bez query/hash.
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
  `false`: żądania spoza loopback do tras przeglądarki są odrzucane. `true`: zdalne przeglądarki są dozwolone, jeśli ścieżka z tokenem jest prawidłowa.
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

## Cykl życia artefaktów i przechowywanie

- Artefakty są przechowywane w podfolderze tymczasowym: `$TMPDIR/openclaw-diffs`.
- Metadane artefaktu przeglądarki zawierają:
  - losowy identyfikator artefaktu (20 znaków szesnastkowych)
  - losowy token (48 znaków szesnastkowych)
  - `createdAt` i `expiresAt`
  - zapisaną ścieżkę `viewer.html`
- Domyślny TTL artefaktu wynosi 30 minut, jeśli nie został określony.
- Maksymalny akceptowany TTL przeglądarki to 6 godzin.
- Czyszczenie jest uruchamiane oportunistycznie po utworzeniu artefaktu.
- Wygasłe artefakty są usuwane.
- Zapasowe czyszczenie usuwa nieaktualne foldery starsze niż 24 godziny, gdy brakuje metadanych.

## Adres URL przeglądarki i zachowanie sieciowe

Trasa przeglądarki:

- `/plugins/diffs/view/{artifactId}/{token}`

Zasoby przeglądarki:

- `/plugins/diffs/assets/viewer.js`
- `/plugins/diffs/assets/viewer-runtime.js`

Dokument przeglądarki rozwiązuje te zasoby względem adresu URL przeglądarki, więc opcjonalny prefiks ścieżki `baseUrl` jest zachowywany również dla żądań zasobów.

Zachowanie konstruowania URL:

- Jeśli przekazano `baseUrl` w wywołaniu narzędzia, jest ono używane po ścisłej walidacji.
- W przeciwnym razie, jeśli skonfigurowano Plugin `viewerBaseUrl`, używana jest ta wartość.
- Bez żadnego zastąpienia adres URL przeglądarki domyślnie używa loopback `127.0.0.1`.
- Jeśli tryb powiązania Gateway to `custom` i ustawiono `gateway.customBindHost`, używany jest ten host.

Zasady `baseUrl`:

- Musi używać `http://` lub `https://`.
- Query i hash są odrzucane.
- Dozwolone jest pochodzenie oraz opcjonalna ścieżka bazowa.

## Model bezpieczeństwa

<AccordionGroup>
  <Accordion title="Wzmocnienie zabezpieczeń przeglądarki">
    - Domyślnie tylko loopback.
    - Ścieżki przeglądarki z tokenem i ścisłą walidacją identyfikatora oraz tokena.
    - CSP odpowiedzi przeglądarki:
      - `default-src 'none'`
      - skrypty i zasoby tylko z self
      - brak wychodzącego `connect-src`
    - Ograniczanie częstotliwości zdalnych niepowodzeń, gdy zdalny dostęp jest włączony:
      - 40 niepowodzeń na 60 sekund
      - blokada na 60 sekund (`429 Too Many Requests`)

  </Accordion>
  <Accordion title="Wzmocnienie zabezpieczeń renderowania plików">
    - Routing żądań przeglądarki do zrzutów ekranu domyślnie wszystko odrzuca.
    - Dozwolone są tylko lokalne zasoby przeglądarki z `http://127.0.0.1/plugins/diffs/assets/*`.
    - Zewnętrzne żądania sieciowe są blokowane.

  </Accordion>
</AccordionGroup>

## Wymagania przeglądarki dla trybu plikowego

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
  <Step title="Awaryjnie dla platformy">
    Zapasowe wykrywanie polecenia/ścieżki dla platformy.
  </Step>
</Steps>

Typowy komunikat błędu:

- `Diff PNG/PDF rendering requires a Chromium-compatible browser...`

Napraw to, instalując Chrome, Chromium, Edge lub Brave albo ustawiając jedną z powyższych opcji ścieżki wykonywalnej.

## Rozwiązywanie problemów

<AccordionGroup>
  <Accordion title="Błędy walidacji danych wejściowych">
    - `Provide patch or both before and after text.` — uwzględnij zarówno `before`, jak i `after`, albo podaj `patch`.
    - `Provide either patch or before/after input, not both.` — nie mieszaj trybów wejścia.
    - `Invalid baseUrl: ...` — użyj pochodzenia `http(s)` z opcjonalną ścieżką, bez query/hash.
    - `{field} exceeds maximum size (...)` — zmniejsz rozmiar ładunku.
    - Odrzucenie dużego patcha — zmniejsz liczbę plików w patchu lub łączną liczbę linii.

  </Accordion>
  <Accordion title="Dostępność przeglądarki">
    - Adres URL przeglądarki domyślnie wskazuje na `127.0.0.1`.
    - W scenariuszach zdalnego dostępu:
      - ustaw Plugin `viewerBaseUrl`, albo
      - przekazuj `baseUrl` dla każdego wywołania narzędzia, albo
      - użyj `gateway.bind=custom` i `gateway.customBindHost`
    - Jeśli `gateway.trustedProxies` obejmuje loopback dla proxy działającego na tym samym hoście (na przykład Tailscale Serve), surowe żądania loopback do przeglądarki bez przekazanych nagłówków IP klienta kończą się zamknięciem zgodnie z założeniami.
    - Dla takiej topologii proxy:
      - preferuj `mode: "file"` lub `mode: "both"`, gdy potrzebujesz tylko załącznika, albo
      - celowo włącz `security.allowRemoteViewer` i ustaw Plugin `viewerBaseUrl` lub przekaż proxy/publiczny `baseUrl`, gdy potrzebujesz współdzielonego adresu URL przeglądarki
    - Włączaj `security.allowRemoteViewer` tylko wtedy, gdy zamierzasz udostępniać zewnętrzny dostęp do przeglądarki.

  </Accordion>
  <Accordion title="Wiersz niezmienionych linii nie ma przycisku rozwijania">
    Może się to zdarzyć dla danych wejściowych patch, gdy patch nie zawiera rozwijalnego kontekstu. Jest to oczekiwane i nie oznacza awarii przeglądarki.
  </Accordion>
  <Accordion title="Nie znaleziono artefaktu">
    - Artefakt wygasł z powodu TTL.
    - Token lub ścieżka zostały zmienione.
    - Czyszczenie usunęło nieaktualne dane.

  </Accordion>
</AccordionGroup>

## Wskazówki operacyjne

- Preferuj `mode: "view"` przy lokalnych interaktywnych przeglądach w Canvas.
- Preferuj `mode: "file"` dla wychodzących kanałów czatu wymagających załącznika.
- Pozostaw `allowRemoteViewer` wyłączone, chyba że Twoje wdrożenie wymaga zdalnych adresów URL przeglądarki.
- Ustawiaj jawne krótkie `ttlSeconds` dla wrażliwych różnic.
- Unikaj wysyłania tajnych danych w wejściu różnic, jeśli nie jest to wymagane.
- Jeśli Twój kanał agresywnie kompresuje obrazy (na przykład Telegram lub WhatsApp), preferuj wynik PDF (`fileFormat: "pdf"`).

<Note>
Silnik renderowania różnic jest oparty na [Diffs](https://diffs.com).
</Note>

## Powiązane

- [Przeglądarka](/pl/tools/browser)
- [Pluginy](/pl/tools/plugin)
- [Przegląd narzędzi](/pl/tools)
