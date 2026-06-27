---
read_when:
    - Chcesz, aby agenci pokazywali zmiany w kodzie lub Markdown jako diffy
    - Potrzebujesz adresu URL widoku gotowego do użycia w kanwie albo wyrenderowanego pliku diff
    - Potrzebujesz kontrolowanych, tymczasowych artefaktów różnic z bezpiecznymi ustawieniami domyślnymi
sidebarTitle: Diffs
summary: Przeglądarka różnic i renderer plików tylko do odczytu dla agentów (opcjonalne narzędzie pluginu)
title: Różnice
x-i18n:
    generated_at: "2026-06-27T18:25:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ea3d8e9e026e10b2f3658b795c07ea21062896ab0d45a8cb2dc7e0e9ed9aa658
    source_path: tools/diffs.md
    workflow: 16
---

`diffs` to opcjonalne narzędzie Plugin z krótkimi wbudowanymi wskazówkami systemowymi i towarzyszącym Skill, które przekształca treść zmian w artefakt diff tylko do odczytu dla agentów.

Akceptuje jedno z poniższych:

- tekst `before` i `after`
- ujednolicony `patch`

Może zwrócić:

- URL przeglądarki Gateway do prezentacji canvas
- ścieżkę wyrenderowanego pliku (PNG lub PDF) do dostarczenia w wiadomości
- oba wyniki w jednym wywołaniu

Po włączeniu Plugin dodaje zwięzłe wskazówki użycia do przestrzeni promptu systemowego oraz udostępnia szczegółowy Skill na przypadki, gdy agent potrzebuje pełniejszych instrukcji.

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
        Przepływy z canvas jako pierwszym wyborem: agenci wywołują `diffs` z `mode: "view"` i otwierają `details.viewerUrl` przez `canvas present`.
      </Tab>
      <Tab title="file">
        Dostarczanie pliku na czacie: agenci wywołują `diffs` z `mode: "file"` i wysyłają `details.filePath` przez `message`, używając `path` albo `filePath`.
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

Blokuje to hook `before_prompt_build` Plugin `diffs`, zachowując dostępność Plugin, narzędzia i towarzyszącego Skill.

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
    Agent otwiera `details.viewerUrl` przez `canvas present`, wysyła `details.filePath` przez `message`, używając `path` albo `filePath`, lub robi jedno i drugie.
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
  Tekst oryginalny. Wymagany z `after`, gdy pominięto `patch`.
</ParamField>
<ParamField path="after" type="string">
  Tekst zaktualizowany. Wymagany z `before`, gdy pominięto `patch`.
</ParamField>
<ParamField path="patch" type="string">
  Tekst ujednoliconego diff. Wzajemnie wykluczający się z `before` i `after`.
</ParamField>
<ParamField path="path" type="string">
  Wyświetlana nazwa pliku dla trybu przed i po.
</ParamField>
<ParamField path="lang" type="string">
  Podpowiedź nadpisania języka dla trybu przed i po. Nieznane wartości i języki spoza domyślnego zestawu przeglądarki wracają do zwykłego tekstu, chyba że zainstalowano Plugin Diff Viewer Language Pack.
</ParamField>

<ParamField path="title" type="string">
  Nadpisanie tytułu przeglądarki.
</ParamField>
<ParamField path="mode" type='"view" | "file" | "both"'>
  Tryb wyjścia. Domyślnie używa wartości domyślnej Plugin `defaults.mode`. Przestarzały alias: `"image"` zachowuje się jak `"file"` i nadal jest akceptowany ze względu na kompatybilność wsteczną.
</ParamField>
<ParamField path="theme" type='"light" | "dark"'>
  Motyw przeglądarki. Domyślnie używa wartości domyślnej Plugin `defaults.theme`.
</ParamField>
<ParamField path="layout" type='"unified" | "split"'>
  Układ diff. Domyślnie używa wartości domyślnej Plugin `defaults.layout`.
</ParamField>
<ParamField path="expandUnchanged" type="boolean">
  Rozwiń niezmienione sekcje, gdy dostępny jest pełny kontekst. Tylko opcja pojedynczego wywołania (nie klucz domyślny Plugin).
</ParamField>
<ParamField path="fileFormat" type='"png" | "pdf"'>
  Format wyrenderowanego pliku. Domyślnie używa wartości domyślnej Plugin `defaults.fileFormat`.
</ParamField>
<ParamField path="fileQuality" type='"standard" | "hq" | "print"'>
  Preset jakości renderowania PNG lub PDF.
</ParamField>
<ParamField path="fileScale" type="number">
  Nadpisanie skali urządzenia (`1`-`4`).
</ParamField>
<ParamField path="fileMaxWidth" type="number">
  Maksymalna szerokość renderowania w pikselach CSS (`640`-`2400`).
</ParamField>
<ParamField path="ttlSeconds" type="number" default="1800">
  TTL artefaktu w sekundach dla przeglądarki i samodzielnych wyjść plikowych. Maks. 21600.
</ParamField>
<ParamField path="baseUrl" type="string">
  Nadpisanie źródła URL przeglądarki. Nadpisuje Plugin `viewerBaseUrl`. Musi być `http` albo `https`, bez query/hash.
</ParamField>

<AccordionGroup>
  <Accordion title="Legacy input aliases">
    Nadal akceptowane ze względu na kompatybilność wsteczną:

    - `format` -> `fileFormat`
    - `imageFormat` -> `fileFormat`
    - `imageQuality` -> `fileQuality`
    - `imageScale` -> `fileScale`
    - `imageMaxWidth` -> `fileMaxWidth`

  </Accordion>
  <Accordion title="Validation and limits">
    - `before` i `after` maksymalnie po 512 KiB.
    - `patch` maksymalnie 2 MiB.
    - `path` maksymalnie 2048 bajtów.
    - `lang` maksymalnie 128 bajtów.
    - `title` maksymalnie 1024 bajty.
    - Limit złożoności patcha: maksymalnie 128 plików i 120000 łącznych wierszy.
    - `patch` razem z `before` lub `after` są odrzucane.
    - Limity bezpieczeństwa wyrenderowanego pliku (dotyczą PNG i PDF):
      - `fileQuality: "standard"`: maks. 8 MP (8 000 000 wyrenderowanych pikseli).
      - `fileQuality: "hq"`: maks. 14 MP (14 000 000 wyrenderowanych pikseli).
      - `fileQuality: "print"`: maks. 24 MP (24 000 000 wyrenderowanych pikseli).
      - PDF ma także limit maksymalnie 50 stron.

  </Accordion>
</AccordionGroup>

## Podświetlanie składni

OpenClaw obejmuje podświetlanie składni dla popularnych języków kodu źródłowego, konfiguracji i dokumentacji:

`javascript`, `typescript`, `tsx`, `jsx`, `json`, `markdown`, `yaml`, `css`, `html`, `sh`, `python`, `go`, `rust`, `java`, `c`, `cpp`, `csharp`, `php`, `sql`, `docker`, `ruby`, `swift`, `kotlin`, `r`, `dart`, `lua`, `powershell`, `xml` i `toml`.

Popularne aliasy, takie jak `js`, `ts`, `bash`, `md`, `yml`, `c++`, `dockerfile`, `rb`, `kt` i `ps1`, są normalizowane do tych domyślnych języków.

Zainstaluj Plugin Diff Viewer Language Pack, aby podświetlać inne języki: 

```bash
openclaw plugins install clawhub:@openclaw/diffs-language-pack
```

Gdy pakiet językowy jest dostępny, OpenClaw może podświetlać znacznie więcej języków. Jeśli pakiet nie jest zainstalowany, pliki spoza domyślnej listy nadal są renderowane jako czytelny zwykły tekst. Przykłady obejmują pliki Astro, Vue, Svelte, MDX, GraphQL, Terraform/HCL, Nix, Clojure, Elixir, Haskell, OCaml, Scala, Zig, Solidity, Verilog/VHDL, Fortran, MATLAB, LaTeX, Mermaid, Sass/Less/SCSS, Nginx, Apache, CSV, dotenv, INI oraz pliki diff.

Szczegóły znajdziesz w [Pluginie Diffs Language Pack](/pl/plugins/reference/diffs-language-pack), a nadrzędny katalog języków i aliasów Shiki w [językach Shiki](https://shiki.style/languages).

## Kontrakt szczegółów wyjścia

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

Podsumowanie zachowania trybów:

| Tryb     | Co jest zwracane                                                                                                      |
| -------- | ---------------------------------------------------------------------------------------------------------------------- |
| `"view"` | Tylko pola przeglądarki.                                                                                               |
| `"file"` | Tylko pola pliku, bez artefaktu przeglądarki.                                                                          |
| `"both"` | Pola przeglądarki oraz pola pliku. Jeśli renderowanie pliku się nie powiedzie, przeglądarka nadal zostanie zwrócona z aliasami `fileError` i `imageError`. |

## Zwinięte niezmienione sekcje

- Przeglądarka może pokazywać wiersze takie jak `N unmodified lines`.
- Kontrolki rozwijania w tych wierszach są warunkowe i nie są gwarantowane dla każdego rodzaju wejścia.
- Kontrolki rozwijania pojawiają się, gdy wyrenderowany diff zawiera dane kontekstu możliwe do rozwinięcia, co jest typowe dla wejścia przed i po.
- Dla wielu wejść w formacie unified patch pominięte treści kontekstu nie są dostępne w przeanalizowanych hunkach patcha, więc wiersz może pojawić się bez kontrolek rozwijania. To oczekiwane zachowanie.
- `expandUnchanged` ma zastosowanie tylko wtedy, gdy istnieje kontekst możliwy do rozwinięcia.

## Domyślne ustawienia Pluginu

Ustaw domyślne ustawienia dla całego Pluginu w `~/.openclaw/openclaw.json`:

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

Obsługiwane ustawienia domyślne:

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

Jawne parametry narzędzia zastępują te ustawienia domyślne.

### Konfiguracja trwałego adresu URL przeglądarki

<ParamField path="viewerBaseUrl" type="string">
  Fallback należący do Pluginu dla zwracanych linków przeglądarki, gdy wywołanie narzędzia nie przekazuje `baseUrl`. Musi być `http` lub `https`, bez zapytania ani hasha.
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
  `false`: żądania do tras przeglądarki spoza local loopback są odrzucane. `true`: zdalne przeglądarki są dozwolone, jeśli ścieżka z tokenem jest prawidłowa.
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

- Artefakty są przechowywane w tymczasowym podfolderze: `$TMPDIR/openclaw-diffs`.
- Metadane artefaktu przeglądarki zawierają:
  - losowy identyfikator artefaktu (20 znaków szesnastkowych)
  - losowy token (48 znaków szesnastkowych)
  - `createdAt` i `expiresAt`
  - zapisaną ścieżkę `viewer.html`
- Domyślny TTL artefaktu wynosi 30 minut, gdy nie podano innej wartości.
- Maksymalny akceptowany TTL przeglądarki wynosi 6 godzin.
- Czyszczenie uruchamia się oportunistycznie po utworzeniu artefaktu.
- Wygasłe artefakty są usuwane.
- Czyszczenie awaryjne usuwa nieaktualne foldery starsze niż 24 godziny, gdy brakuje metadanych.

## Adres URL przeglądarki i zachowanie sieciowe

Trasa przeglądarki:

- `/plugins/diffs/view/{artifactId}/{token}`

Zasoby przeglądarki:

- `/plugins/diffs/assets/viewer.js`
- `/plugins/diffs/assets/viewer-runtime.js`
- `/plugins/diffs-language-pack/assets/viewer.js` gdy diff używa języka z Diff Viewer Language Pack

Dokument przeglądarki rozwiązuje te zasoby względem adresu URL przeglądarki, więc opcjonalny prefiks ścieżki `baseUrl` jest zachowywany także dla obu żądań zasobów.

Zachowanie konstruowania adresu URL:

- Jeśli podano `baseUrl` wywołania narzędzia, jest używany po ścisłej walidacji.
- W przeciwnym razie, jeśli skonfigurowano `viewerBaseUrl` pluginu, jest on używany.
- Bez żadnego z tych nadpisań adres URL przeglądarki domyślnie używa loopback `127.0.0.1`.
- Jeśli tryb wiązania Gateway to `custom` i ustawiono `gateway.customBindHost`, używany jest ten host.

Reguły `baseUrl`:

- Musi być `http://` albo `https://`.
- Query i hash są odrzucane.
- Dozwolone jest origin plus opcjonalna ścieżka bazowa.

## Model bezpieczeństwa

<AccordionGroup>
  <Accordion title="Wzmacnianie zabezpieczeń przeglądarki">
    - Domyślnie tylko loopback.
    - Tokenizowane ścieżki przeglądarki ze ścisłą walidacją identyfikatora i tokenu.
    - CSP odpowiedzi przeglądarki:
      - `default-src 'none'`
      - skrypty i zasoby tylko z self
      - brak wychodzącego `connect-src`
    - Ograniczanie zdalnych chybień, gdy dostęp zdalny jest włączony:
      - 40 niepowodzeń na 60 sekund
      - 60-sekundowa blokada (`429 Too Many Requests`)

  </Accordion>
  <Accordion title="Wzmacnianie zabezpieczeń renderowania plików">
    - Routing żądań przeglądarki zrzutu ekranu domyślnie odmawia dostępu.
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
  <Step title="Awaryjne rozwiązanie platformy">
    Awaryjne wykrywanie polecenia/ścieżki platformy.
  </Step>
</Steps>

Typowy tekst błędu:

- `Diff PNG/PDF rendering requires a Chromium-compatible browser...`

Napraw przez zainstalowanie Chrome, Chromium, Edge albo Brave, albo ustawienie jednej z powyższych opcji ścieżki wykonywalnej.

## Rozwiązywanie problemów

<AccordionGroup>
  <Accordion title="Błędy walidacji danych wejściowych">
    - `Provide patch or both before and after text.` — podaj zarówno `before`, jak i `after`, albo podaj `patch`.
    - `Provide either patch or before/after input, not both.` — nie mieszaj trybów wejścia.
    - `Invalid baseUrl: ...` — użyj origin `http(s)` z opcjonalną ścieżką, bez query/hash.
    - `{field} exceeds maximum size (...)` — zmniejsz rozmiar ładunku.
    - Odrzucenie dużego patcha — zmniejsz liczbę plików patcha albo łączną liczbę wierszy.

  </Accordion>
  <Accordion title="Dostępność przeglądarki">
    - Adres URL przeglądarki domyślnie rozwiązuje się do `127.0.0.1`.
    - W scenariuszach dostępu zdalnego:
      - ustaw `viewerBaseUrl` pluginu, albo
      - przekaż `baseUrl` dla danego wywołania narzędzia, albo
      - użyj `gateway.bind=custom` i `gateway.customBindHost`
    - Jeśli `gateway.trustedProxies` zawiera loopback dla proxy na tym samym hoście (na przykład Tailscale Serve), surowe żądania przeglądarki przez loopback bez przekazanych nagłówków IP klienta z założenia kończą się zamknięciem z odmową.
    - Dla tej topologii proxy:
      - preferuj `mode: "file"` albo `mode: "both"`, gdy potrzebujesz tylko załącznika, albo
      - celowo włącz `security.allowRemoteViewer` i ustaw `viewerBaseUrl` pluginu albo przekaż proxy/publiczny `baseUrl`, gdy potrzebujesz współdzielonego adresu URL przeglądarki
    - Włącz `security.allowRemoteViewer` tylko wtedy, gdy zamierzasz udostępnić zewnętrzny dostęp do przeglądarki.

  </Accordion>
  <Accordion title="Wiersz niezmienionych linii nie ma przycisku rozwijania">
    Może się to zdarzyć dla wejścia patcha, gdy patch nie zawiera rozszerzalnego kontekstu. Jest to oczekiwane i nie oznacza awarii przeglądarki.
  </Accordion>
  <Accordion title="Nie znaleziono artefaktu">
    - Artefakt wygasł z powodu TTL.
    - Token lub ścieżka uległy zmianie.
    - Czyszczenie usunęło nieaktualne dane.

  </Accordion>
</AccordionGroup>

## Wskazówki operacyjne

- Preferuj `mode: "view"` do lokalnych interaktywnych przeglądów w canvas.
- Preferuj `mode: "file"` dla wychodzących kanałów czatu, które potrzebują załącznika.
- Pozostaw `allowRemoteViewer` wyłączone, chyba że Twoje wdrożenie wymaga zdalnych adresów URL przeglądarki.
- Ustaw jawny krótki `ttlSeconds` dla wrażliwych diffów.
- Unikaj wysyłania sekretów w danych wejściowych diffu, gdy nie jest to wymagane.
- Jeśli Twój kanał agresywnie kompresuje obrazy (na przykład Telegram lub WhatsApp), preferuj wyjście PDF (`fileFormat: "pdf"`).

<Note>
Silnik renderowania diffów oparty na [Diffs](https://diffs.com).
</Note>

## Powiązane

- [Przeglądarka](/pl/tools/browser)
- [Pluginy](/pl/tools/plugin)
- [Omówienie narzędzi](/pl/tools)
