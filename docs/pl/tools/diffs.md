---
read_when:
    - Chcesz, aby agenci przedstawiali zmiany w kodzie lub Markdown jako różnice.
    - Potrzebny jest adres URL podglądu gotowego do użycia w canvasie lub wyrenderowany plik różnicowy
    - Potrzebne są kontrolowane, tymczasowe artefakty różnic z bezpiecznymi ustawieniami domyślnymi
sidebarTitle: Diffs
summary: Przeglądarka różnic i moduł renderowania plików w trybie tylko do odczytu dla agentów (opcjonalne narzędzie pluginu)
title: Różnice
x-i18n:
    generated_at: "2026-07-16T19:12:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f28a8ac4191f72376ba5c8823337bd337e3fac236ea4ecc2204e6dcf2930e607
    source_path: tools/diffs.md
    workflow: 16
---

`diffs` to opcjonalne dołączone narzędzie Pluginu, które przekształca tekst przed zmianą i po zmianie lub ujednoliconą łatkę w artefakt różnic tylko do odczytu. Dodaje również na początku promptu systemowego krótkie wskazówki dla agenta i zawiera powiązaną umiejętność z pełniejszymi instrukcjami.

Dane wejściowe: tekst `before` + `after` albo ujednolicony `patch` (wzajemnie wykluczające się).

Dane wyjściowe: adres URL przeglądarki Gateway do prezentacji na kanwie, ścieżka do wyrenderowanego pliku PNG/PDF na potrzeby dostarczenia w wiadomości albo oba te elementy.

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
        Przepływy z kanwą jako głównym widokiem: agenci wywołują `diffs` z `mode: "view"` i otwierają `details.viewerUrl` za pomocą `canvas present`.
      </Tab>
      <Tab title="file">
        Dostarczanie pliku na czacie: agenci wywołują `diffs` z `mode: "file"` i wysyłają `details.filePath` z `message` za pomocą `path` lub `filePath`.
      </Tab>
      <Tab title="both">
        Tryb łączony (domyślny): agenci wywołują `diffs` z `mode: "both"`, aby uzyskać oba artefakty w jednym wywołaniu.
      </Tab>
    </Tabs>
  </Step>
</Steps>

## Wyłączanie wbudowanych wskazówek systemowych

Aby zachować narzędzie, ale usunąć wskazówki dodawane na początku promptu systemowego, ustaw `plugins.entries.diffs.hooks.allowPromptInjection` na `false`:

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

Blokuje to hook `before_prompt_build` Pluginu, pozostawiając dostępne narzędzie i umiejętność. Aby wyłączyć zarówno wskazówki, jak i narzędzie, wyłącz Plugin.

## Dokumentacja danych wejściowych narzędzia

Wszystkie pola są opcjonalne, o ile nie zaznaczono inaczej.

<ParamField path="before" type="string">
  Tekst oryginalny. Wymagany wraz z `after`, gdy pominięto `patch`.
</ParamField>
<ParamField path="after" type="string">
  Tekst zaktualizowany. Wymagany wraz z `before`, gdy pominięto `patch`.
</ParamField>
<ParamField path="patch" type="string">
  Tekst ujednoliconej różnicy. Wzajemnie wyklucza się z `before` i `after`.
</ParamField>
<ParamField path="path" type="string">
  Wyświetlana nazwa pliku w trybie przed zmianą/po zmianie.
</ParamField>
<ParamField path="lang" type="string">
  Wskazówka zastępująca język dla trybu przed zmianą/po zmianie. Nieznane wartości i języki spoza domyślnego zestawu przeglądarki są wyświetlane jako zwykły tekst, chyba że zainstalowano Plugin Diff Viewer Language Pack.
</ParamField>
<ParamField path="title" type="string">
  Zastępczy tytuł przeglądarki.
</ParamField>
<ParamField path="mode" type='"view" | "file" | "both"'>
  Tryb wyjściowy. Domyślnie używa wartości Pluginu `defaults.mode` (`both`). Przestarzały alias: `"image"` działa identycznie jak `"file"`.
</ParamField>
<ParamField path="theme" type='"light" | "dark"'>
  Motyw przeglądarki. Domyślnie używa wartości Pluginu `defaults.theme`.
</ParamField>
<ParamField path="layout" type='"unified" | "split"'>
  Układ różnic. Domyślnie używa wartości Pluginu `defaults.layout`.
</ParamField>
<ParamField path="expandUnchanged" type="boolean">
  Rozwija niezmienione sekcje, gdy dostępny jest pełny kontekst. Opcja tylko dla pojedynczego wywołania (nie jest domyślnym kluczem Pluginu).
</ParamField>
<ParamField path="fileFormat" type='"png" | "pdf"'>
  Format wyrenderowanego pliku. Domyślnie używa wartości Pluginu `defaults.fileFormat`.
</ParamField>
<ParamField path="fileQuality" type='"standard" | "hq" | "print"'>
  Ustawienie jakości renderowania PNG/PDF.
</ParamField>
<ParamField path="fileScale" type="number">
  Zastępcza skala urządzenia (`1`-`4`).
</ParamField>
<ParamField path="fileMaxWidth" type="number">
  Maksymalna szerokość renderowania w pikselach CSS (`640`-`2400`).
</ParamField>
<ParamField path="ttlSeconds" type="number" default="1800">
  Czas TTL artefaktu w sekundach dla danych wyjściowych przeglądarki i samodzielnych plików. Maksymalnie `21600`.
</ParamField>
<ParamField path="baseUrl" type="string">
  Zastępcze źródło adresu URL przeglądarki. Zastępuje wartość Pluginu `viewerBaseUrl`. Musi mieć wartość `http` lub `https`, bez zapytania ani skrótu.
</ParamField>

<AccordionGroup>
  <Accordion title="Walidacja i limity">
    - `before`/`after`: maks. 512 KiB każde.
    - `patch`: maks. 2 MiB.
    - `path`: maks. 2048 bajtów.
    - `lang`: maks. 128 bajtów.
    - `title`: maks. 1024 bajty.
    - Limit złożoności łatki: maks. 128 plików i łącznie 120000 wierszy.
    - `patch` wraz z `before`/`after` jest odrzucane.
    - Limity bezpieczeństwa renderowanych plików (PNG i PDF):
      - `fileQuality: "standard"`: maks. 8 MP (8,000,000 wyrenderowanych pikseli).
      - `fileQuality: "hq"`: maks. 14 MP.
      - `fileQuality: "print"`: maks. 24 MP.
      - Pliki PDF mają również limit 50 stron.

  </Accordion>
</AccordionGroup>

## Podświetlanie składni

Wbudowane języki:

`javascript`, `typescript`, `tsx`, `jsx`, `json`, `markdown`, `yaml`, `css`, `html`, `sh`, `python`, `go`, `rust`, `java`, `c`, `cpp`, `csharp`, `php`, `sql`, `docker`, `ruby`, `swift`, `kotlin`, `r`, `dart`, `lua`, `powershell`, `xml` oraz `toml`.

Popularne aliasy (`js`, `ts`, `bash`, `md`, `yml`, `c++`, `dockerfile`, `rb`, `kt`, `ps1` itd.) są normalizowane do tych języków.

Aby uzyskać więcej języków (Astro, Vue, Svelte, MDX, GraphQL, Terraform/HCL, Nix, Clojure, Elixir, Haskell, OCaml, Scala, Zig, Solidity, Verilog/VHDL, Fortran, MATLAB, LaTeX, Mermaid, Sass/Less/SCSS, Nginx, Apache, CSV, dotenv, INI, diff i inne), zainstaluj Plugin Diff Viewer Language Pack:

```bash
openclaw plugins install clawhub:@openclaw/diffs-language-pack
```

Bez tego pakietu nieobsługiwane języki nadal są renderowane jako czytelny zwykły tekst. Zobacz [Plugin Diffs Language Pack](/pl/plugins/reference/diffs-language-pack) i [języki Shiki](https://shiki.style/languages), aby zapoznać się z katalogiem projektu nadrzędnego.

## Kontrakt szczegółów danych wyjściowych

Wszystkie pomyślne wyniki zawierają `changed`: identyczne dane wejściowe przed zmianą i po zmianie zwracają `false` bez tworzenia artefaktu; wyrenderowane wyniki zwracają `true`.

<AccordionGroup>
  <Accordion title="Pola przeglądarki (tryby view i both)">
    - `changed`
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
  <Accordion title="Pola pliku (tryby file i both)">
    - `changed`
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
</AccordionGroup>

| Tryb     | Zwracane dane                                                                                   |
| -------- | ----------------------------------------------------------------------------------------------- |
| `"view"` | Tylko pola przeglądarki.                                                                        |
| `"file"` | Tylko pola pliku, bez artefaktu przeglądarki.                                                    |
| `"both"` | Pola przeglądarki i pola pliku. Jeśli renderowanie pliku się nie powiedzie, przeglądarka nadal zwróci wynik z `fileError`. |

### Zwinięte niezmienione sekcje

Przeglądarka wyświetla wiersze takie jak `N unmodified lines`. Elementy sterujące rozwijaniem pojawiają się tylko wtedy, gdy wyrenderowana różnica zawiera możliwe do rozwinięcia dane kontekstowe (typowo dla danych wejściowych przed zmianą/po zmianie). W wielu ujednoliconych łatkach treść kontekstu jest pomijana w fragmentach, więc wiersz może pojawić się bez elementu sterującego rozwijaniem — jest to oczekiwane zachowanie, a nie błąd. `expandUnchanged` ma zastosowanie tylko wtedy, gdy istnieje możliwy do rozwinięcia kontekst.

### Nawigacja między wieloma plikami

Łatki obejmujące więcej niż jeden plik rozpoczynają się kartą podsumowania zmienionych plików: łączną liczbą `+N` / `-N`, liczbami dla poszczególnych plików, oznaczeniami plików dodanych/usuniętych/ze zmienioną nazwą oraz linkami kotwiczącymi prowadzącymi do każdego pliku. Wyrenderowane pliki PNG/PDF zachowują liczby w nagłówkach poszczególnych plików, ale pomijają interaktywne przełączniki widoku, ponieważ w pliku statycznym nie działają.

## Domyślne ustawienia Pluginu

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
            ttlSeconds: 21600,
          },
        },
      },
    },
  },
}
```

Obsługiwane klucze `defaults`: `fontFamily`, `fontSize`, `lineSpacing`, `layout`, `showLineNumbers`, `diffIndicators`, `wordWrap`, `background`, `theme`, `fileFormat`, `fileQuality`, `fileScale`, `fileMaxWidth`, `mode`, `ttlSeconds`. Jawne parametry wywołania narzędzia zastępują te wartości.

### Konfiguracja trwałego adresu URL przeglądarki

<ParamField path="viewerBaseUrl" type="string">
  Wartość rezerwowa należąca do Pluginu dla zwracanych linków do przeglądarki, gdy wywołanie narzędzia nie przekazuje `baseUrl`. Musi mieć wartość `http` lub `https`, bez zapytania ani skrótu.
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
  `false`: żądania do tras przeglądarki spoza interfejsu pętli zwrotnej są odrzucane. `true`: zdalne przeglądarki są dozwolone, jeśli tokenizowana ścieżka jest prawidłowa.
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

- Artefakty znajdują się w `$TMPDIR/openclaw-diffs`.
- Metadane przeglądarki przechowują losowy 20-znakowy identyfikator artefaktu w zapisie szesnastkowym, losowy 48-znakowy token w zapisie szesnastkowym, `createdAt`/`expiresAt` oraz zapisaną ścieżkę `viewer.html`.
- Domyślny czas TTL artefaktu: 30 minut. Maksymalny akceptowany czas TTL: 6 godzin.
- Czyszczenie jest uruchamiane oportunistycznie po każdym wywołaniu tworzącym artefakt; wygasłe artefakty są usuwane.
- Rezerwowe przeszukiwanie usuwa nieaktualne foldery starsze niż 24 godziny, gdy brakuje metadanych.

## Adres URL przeglądarki i działanie sieci

Trasa przeglądarki: `/plugins/diffs/view/{artifactId}/{token}`

Zasoby przeglądarki:

- `/plugins/diffs/assets/viewer.js`
- `/plugins/diffs/assets/viewer-runtime.js`
- `/plugins/diffs-language-pack/assets/viewer.js` (tylko gdy diff używa języka pakietu językowego)

Dokument przeglądarki rozwiązuje te zasoby względem adresu URL przeglądarki, dlatego opcjonalny prefiks ścieżki `baseUrl` jest również stosowany do żądań zasobów.

Kolejność rozwiązywania adresu URL: `baseUrl` wywołania narzędzia (po ścisłej walidacji) -> `viewerBaseUrl` pluginu -> domyślna wartość loopback `127.0.0.1`. Jeśli tryb powiązania Gateway to `custom` i ustawiono `gateway.customBindHost`, ten host jest używany zamiast loopback.

Reguły `baseUrl`: musi mieć wartość `http://` lub `https://`; zapytanie i skrót są odrzucane; dozwolone jest źródło z opcjonalną ścieżką bazową.

## Model zabezpieczeń

<AccordionGroup>
  <Accordion title="Wzmocnienie zabezpieczeń przeglądarki">
    - Domyślnie tylko loopback.
    - Tokenizowane ścieżki przeglądarki ze ścisłą walidacją wzorców identyfikatora i tokenu.
    - CSP odpowiedzi przeglądarki: `default-src 'none'`; skrypty/zasoby wyłącznie z własnego źródła; bez wychodzących `connect-src`.
    - Ograniczanie zdalnych nietrafień po włączeniu dostępu zdalnego: 40 niepowodzeń w ciągu 60 sekund powoduje blokadę na 60 sekund (`429 Too Many Requests`).

  </Accordion>
  <Accordion title="Wzmocnienie zabezpieczeń renderowania plików">
    - Trasowanie żądań przeglądarki wykonującej zrzuty ekranu domyślnie odrzuca wszystkie żądania.
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
  <Step title="Mechanizm rezerwowy platformy">
    Typowe ścieżki instalacji i wyszukiwania `PATH` dla Chrome, Chromium, Edge i Brave.
  </Step>
</Steps>

Typowy tekst błędu: `Diff PNG/PDF rendering requires a Chromium-compatible browser...`. Aby rozwiązać problem, należy zainstalować Chrome, Chromium, Edge lub Brave albo ustawić jedną z powyższych opcji ścieżki do pliku wykonywalnego.

## Rozwiązywanie problemów

<AccordionGroup>
  <Accordion title="Błędy walidacji danych wejściowych">
    - `Provide patch or both before and after text.` -- należy uwzględnić zarówno `before`, jak i `after` albo podać `patch`.
    - `Provide either patch or before/after input, not both.` -- nie należy łączyć trybów danych wejściowych.
    - `Invalid baseUrl: ...` -- należy użyć źródła `http(s)` z opcjonalną ścieżką, bez zapytania ani skrótu.
    - `{field} exceeds maximum size (...)` -- należy zmniejszyć rozmiar ładunku.
    - Odrzucenie dużej poprawki -- należy zmniejszyć liczbę plików poprawki lub łączną liczbę wierszy.

  </Accordion>
  <Accordion title="Dostępność przeglądarki">
    - Adres URL przeglądarki domyślnie wskazuje na `127.0.0.1`.
    - Aby uzyskać dostęp zdalny, należy ustawić `viewerBaseUrl` pluginu, przekazywać `baseUrl` przy każdym wywołaniu albo użyć `gateway.bind=custom` z `gateway.customBindHost`.
    - Jeśli `gateway.trustedProxies` obejmuje loopback dla serwera proxy na tym samym hoście (na przykład Tailscale Serve), nieprzetworzone żądania przeglądarki przez loopback bez przekazanych nagłówków adresu IP klienta są z założenia odrzucane.
    - W przypadku tej topologii serwera proxy preferowane jest `mode: "file"`/`"both"` jako załącznik albo celowe włączenie `security.allowRemoteViewer` wraz z `viewerBaseUrl` pluginu/`baseUrl` serwera proxy w celu uzyskania udostępnialnego łącza do przeglądarki.
    - Należy włączyć `security.allowRemoteViewer` tylko wtedy, gdy zamierzony jest zewnętrzny dostęp do przeglądarki.

  </Accordion>
  <Accordion title="Wiersz niezmodyfikowanych linii nie ma przycisku rozwijania">
    Jest to oczekiwane dla danych wejściowych poprawki bez kontekstu możliwego do rozwinięcia; nie oznacza awarii przeglądarki.
  </Accordion>
  <Accordion title="Nie znaleziono artefaktu">
    - Artefakt wygasł z powodu TTL.
    - Token lub ścieżka uległy zmianie.
    - Proces czyszczenia usunął nieaktualne dane.

  </Accordion>
</AccordionGroup>

## Wskazówki operacyjne

- W przypadku lokalnych, interaktywnych przeglądów w obszarze roboczym preferowane jest `mode: "view"`.
- W przypadku wychodzących kanałów czatu wymagających załącznika preferowane jest `mode: "file"`.
- Opcja `allowRemoteViewer` powinna pozostać wyłączona, chyba że wdrożenie wymaga zdalnych adresów URL przeglądarki.
- Dla poufnych diffów należy ustawić jawnie krótki `ttlSeconds`.
- Należy unikać wysyłania sekretów w danych wejściowych diffa, gdy nie jest to wymagane.
- Jeśli kanał agresywnie kompresuje obrazy (na przykład Telegram lub WhatsApp), preferowane są dane wyjściowe PDF (`fileFormat: "pdf"`).

<Note>
Silnik renderowania diffów jest obsługiwany przez [Diffs](https://diffs.com).
</Note>

## Powiązane materiały

- [Przeglądarka](/pl/tools/browser)
- [Pluginy](/pl/tools/plugin)
- [Przegląd narzędzi](/pl/tools)
