---
read_when:
    - Chcesz, aby agenci pokazywali edycje kodu lub Markdown jako różnice
    - Chcesz adres URL widoku gotowy do Canvas lub wyrenderowany plik z różnicami
    - Potrzebujesz kontrolowanych, tymczasowych artefaktów różnic z bezpiecznymi ustawieniami domyślnymi
summary: Narzędzie pluginu tylko do odczytu do wyświetlania różnic i renderowania plików dla agentów (opcjonalne)
title: Diffs
x-i18n:
    generated_at: "2026-04-05T14:08:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 935539a6e584980eb7e57067c18112bb40a0be8522b9da649c7cf7f180fb45d4
    source_path: tools/diffs.md
    workflow: 15
---

# Diffs

`diffs` to opcjonalne narzędzie pluginu z krótkimi wbudowanymi wskazówkami systemowymi oraz towarzyszącym Skill, który zamienia treść zmian w artefakt różnic tylko do odczytu dla agentów.

Akceptuje ono:

- tekst `before` i `after`
- ujednolicony `patch`

Może zwracać:

- adres URL widoku Gateway do prezentacji w Canvas
- ścieżkę do wyrenderowanego pliku (PNG lub PDF) do dostarczenia w wiadomości
- oba wyniki w jednym wywołaniu

Po włączeniu plugin dołącza zwięzłe wskazówki użycia do przestrzeni promptu systemowego, a także udostępnia szczegółowy Skill na wypadek, gdy agent potrzebuje pełniejszych instrukcji.

## Szybki start

1. Włącz plugin.
2. Wywołaj `diffs` z `mode: "view"` dla przepływów zorientowanych najpierw na Canvas.
3. Wywołaj `diffs` z `mode: "file"` dla przepływów dostarczania plików w czacie.
4. Wywołaj `diffs` z `mode: "both"`, gdy potrzebujesz obu artefaktów.

## Włącz plugin

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

To blokuje hook `before_prompt_build` pluginu diffs, pozostawiając plugin, narzędzie i towarzyszący Skill dostępne.

Jeśli chcesz wyłączyć zarówno wskazówki, jak i narzędzie, wyłącz sam plugin.

## Typowy przepływ pracy agenta

1. Agent wywołuje `diffs`.
2. Agent odczytuje pola `details`.
3. Agent:
   - otwiera `details.viewerUrl` przez `canvas present`
   - wysyła `details.filePath` za pomocą `message`, używając `path` lub `filePath`
   - robi obie rzeczy

## Przykłady wejścia

Before i after:

```json
{
  "before": "# Hello\n\nOne",
  "after": "# Hello\n\nTwo",
  "path": "docs/example.md",
  "mode": "view"
}
```

Patch:

```json
{
  "patch": "diff --git a/src/example.ts b/src/example.ts\n--- a/src/example.ts\n+++ b/src/example.ts\n@@ -1 +1 @@\n-const x = 1;\n+const x = 2;\n",
  "mode": "both"
}
```

## Odniesienie do danych wejściowych narzędzia

Wszystkie pola są opcjonalne, o ile nie zaznaczono inaczej:

- `before` (`string`): tekst oryginalny. Wymagany wraz z `after`, gdy pominięto `patch`.
- `after` (`string`): zaktualizowany tekst. Wymagany wraz z `before`, gdy pominięto `patch`.
- `patch` (`string`): tekst ujednoliconej różnicy. Wzajemnie wyklucza się z `before` i `after`.
- `path` (`string`): wyświetlana nazwa pliku dla trybu before i after.
- `lang` (`string`): wskazówka nadpisania języka dla trybu before i after. Nieznane wartości wracają do zwykłego tekstu.
- `title` (`string`): nadpisanie tytułu widoku.
- `mode` (`"view" | "file" | "both"`): tryb wyjścia. Domyślnie używa ustawienia pluginu `defaults.mode`.
  Przestarzały alias: `"image"` działa jak `"file"` i nadal jest akceptowany dla zgodności wstecznej.
- `theme` (`"light" | "dark"`): motyw widoku. Domyślnie używa ustawienia pluginu `defaults.theme`.
- `layout` (`"unified" | "split"`): układ różnic. Domyślnie używa ustawienia pluginu `defaults.layout`.
- `expandUnchanged` (`boolean`): rozwija niezmienione sekcje, gdy dostępny jest pełny kontekst. Opcja tylko dla pojedynczego wywołania (nie jest kluczem domyślnym pluginu).
- `fileFormat` (`"png" | "pdf"`): format wyrenderowanego pliku. Domyślnie używa ustawienia pluginu `defaults.fileFormat`.
- `fileQuality` (`"standard" | "hq" | "print"`): preset jakości dla renderowania PNG lub PDF.
- `fileScale` (`number`): nadpisanie skali urządzenia (`1`-`4`).
- `fileMaxWidth` (`number`): maksymalna szerokość renderowania w pikselach CSS (`640`-`2400`).
- `ttlSeconds` (`number`): TTL artefaktu w sekundach dla widoku i samodzielnych wyników plikowych. Domyślnie 1800, maksymalnie 21600.
- `baseUrl` (`string`): nadpisanie źródła URL widoku. Nadpisuje pluginowe `viewerBaseUrl`. Musi używać `http` lub `https`, bez query/hash.

Starsze aliasy wejściowe nadal akceptowane dla zgodności wstecznej:

- `format` -> `fileFormat`
- `imageFormat` -> `fileFormat`
- `imageQuality` -> `fileQuality`
- `imageScale` -> `fileScale`
- `imageMaxWidth` -> `fileMaxWidth`

Walidacja i limity:

- `before` i `after` mają maksymalnie po 512 KiB.
- `patch` ma maksymalnie 2 MiB.
- `path` ma maksymalnie 2048 bajtów.
- `lang` ma maksymalnie 128 bajtów.
- `title` ma maksymalnie 1024 bajty.
- Limit złożoności patcha: maksymalnie 128 plików i 120000 linii łącznie.
- `patch` oraz `before` lub `after` razem są odrzucane.
- Limity bezpieczeństwa dla renderowanych plików (dotyczą PNG i PDF):
  - `fileQuality: "standard"`: maksymalnie 8 MP (8 000 000 wyrenderowanych pikseli).
  - `fileQuality: "hq"`: maksymalnie 14 MP (14 000 000 wyrenderowanych pikseli).
  - `fileQuality: "print"`: maksymalnie 24 MP (24 000 000 wyrenderowanych pikseli).
  - PDF ma także limit 50 stron.

## Kontrakt wyjściowy `details`

Narzędzie zwraca ustrukturyzowane metadane w `details`.

Pola współdzielone dla trybów tworzących widok:

- `artifactId`
- `viewerUrl`
- `viewerPath`
- `title`
- `expiresAt`
- `inputKind`
- `fileCount`
- `mode`
- `context` (`agentId`, `sessionId`, `messageChannel`, `agentAccountId`, gdy dostępne)

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

Aliasy zgodności również zwracane dla istniejących wywołujących:

- `format` (ta sama wartość co `fileFormat`)
- `imagePath` (ta sama wartość co `filePath`)
- `imageBytes` (ta sama wartość co `fileBytes`)
- `imageQuality` (ta sama wartość co `fileQuality`)
- `imageScale` (ta sama wartość co `fileScale`)
- `imageMaxWidth` (ta sama wartość co `fileMaxWidth`)

Podsumowanie zachowania trybów:

- `mode: "view"`: tylko pola widoku.
- `mode: "file"`: tylko pola pliku, bez artefaktu widoku.
- `mode: "both"`: pola widoku plus pola pliku. Jeśli renderowanie pliku się nie powiedzie, widok nadal jest zwracany z `fileError` i aliasem zgodności `imageError`.

## Zwinięte niezmienione sekcje

- Widok może pokazywać wiersze takie jak `N unmodified lines`.
- Kontrolki rozwijania w tych wierszach są warunkowe i nie są gwarantowane dla każdego rodzaju wejścia.
- Kontrolki rozwijania pojawiają się, gdy wyrenderowana różnica zawiera rozwijalne dane kontekstu, co jest typowe dla wejścia before i after.
- Dla wielu wejść ujednoliconego patcha pominięte treści kontekstu nie są dostępne w sparsowanych fragmentach patcha, więc wiersz może pojawić się bez kontrolek rozwijania. To oczekiwane zachowanie.
- `expandUnchanged` ma zastosowanie tylko wtedy, gdy istnieje rozwijalny kontekst.

## Domyślne ustawienia pluginu

Ustaw domyślne wartości dla całego pluginu w `~/.openclaw/openclaw.json`:

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

Trwała konfiguracja URL widoku:

- `viewerBaseUrl` (`string`, opcjonalne)
  - Własny fallback pluginu dla zwracanych linków widoku, gdy wywołanie narzędzia nie przekazuje `baseUrl`.
  - Musi używać `http` lub `https`, bez query/hash.

Przykład:

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

- `security.allowRemoteViewer` (`boolean`, domyślnie `false`)
  - `false`: żądania spoza loopback do tras widoku są odrzucane.
  - `true`: zdalne widoki są dozwolone, jeśli ścieżka z tokenem jest prawidłowa.

Przykład:

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

- Artefakty są przechowywane w podfolderze katalogu tymczasowego: `$TMPDIR/openclaw-diffs`.
- Metadane artefaktu widoku zawierają:
  - losowy identyfikator artefaktu (20 znaków hex)
  - losowy token (48 znaków hex)
  - `createdAt` i `expiresAt`
  - zapisaną ścieżkę `viewer.html`
- Domyślny TTL artefaktu to 30 minut, jeśli nie został określony.
- Maksymalny akceptowany TTL widoku to 6 godzin.
- Czyszczenie uruchamia się oportunistycznie po utworzeniu artefaktu.
- Wygasłe artefakty są usuwane.
- Zapasowe czyszczenie usuwa nieaktualne foldery starsze niż 24 godziny, gdy brakuje metadanych.

## URL widoku i zachowanie sieciowe

Trasa widoku:

- `/plugins/diffs/view/{artifactId}/{token}`

Zasoby widoku:

- `/plugins/diffs/assets/viewer.js`
- `/plugins/diffs/assets/viewer-runtime.js`

Dokument widoku rozstrzyga te zasoby względnie względem URL widoku, więc opcjonalny prefiks ścieżki `baseUrl` jest zachowywany również dla żądań tych zasobów.

Zachowanie budowy URL:

- Jeśli podano `baseUrl` w wywołaniu narzędzia, jest używane po ścisłej walidacji.
- W przeciwnym razie, jeśli skonfigurowano pluginowe `viewerBaseUrl`, ono jest używane.
- Bez żadnego nadpisania URL widoku domyślnie wskazuje na loopback `127.0.0.1`.
- Jeśli tryb bindowania gateway to `custom` i ustawiono `gateway.customBindHost`, używany jest ten host.

Zasady `baseUrl`:

- Musi zaczynać się od `http://` lub `https://`.
- Query i hash są odrzucane.
- Dozwolone jest źródło plus opcjonalna ścieżka bazowa.

## Model bezpieczeństwa

Wzmocnienia widoku:

- Domyślnie tylko loopback.
- Ścieżki widoku z tokenem oraz ścisłą walidacją identyfikatora i tokenu.
- CSP odpowiedzi widoku:
  - `default-src 'none'`
  - skrypty i zasoby tylko z self
  - brak wychodzącego `connect-src`
- Ograniczanie zdalnych nieudanych prób, gdy dostęp zdalny jest włączony:
  - 40 niepowodzeń na 60 sekund
  - blokada na 60 sekund (`429 Too Many Requests`)

Wzmocnienia renderowania plików:

- Trasowanie żądań przeglądarki dla zrzutów ekranu domyślnie odrzuca wszystko.
- Dozwolone są tylko lokalne zasoby widoku z `http://127.0.0.1/plugins/diffs/assets/*`.
- Zewnętrzne żądania sieciowe są blokowane.

## Wymagania przeglądarki dla trybu plikowego

`mode: "file"` i `mode: "both"` wymagają przeglądarki zgodnej z Chromium.

Kolejność rozstrzygania:

1. `browser.executablePath` w konfiguracji OpenClaw.
2. Zmienne środowiskowe:
   - `OPENCLAW_BROWSER_EXECUTABLE_PATH`
   - `BROWSER_EXECUTABLE_PATH`
   - `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`
3. Zapasowe wykrywanie poleceń/ścieżek na platformie.

Typowy tekst błędu:

- `Diff PNG/PDF rendering requires a Chromium-compatible browser...`

Napraw to, instalując Chrome, Chromium, Edge lub Brave, albo ustawiając jedną z powyższych opcji ścieżki pliku wykonywalnego.

## Rozwiązywanie problemów

Błędy walidacji danych wejściowych:

- `Provide patch or both before and after text.`
  - Dołącz oba pola `before` i `after` albo podaj `patch`.
- `Provide either patch or before/after input, not both.`
  - Nie mieszaj trybów wejścia.
- `Invalid baseUrl: ...`
  - Użyj źródła `http(s)` z opcjonalną ścieżką, bez query/hash.
- `{field} exceeds maximum size (...)`
  - Zmniejsz rozmiar ładunku.
- Odrzucenie dużego patcha
  - Zmniejsz liczbę plików w patchu lub łączną liczbę linii.

Problemy z dostępnością widoku:

- URL widoku domyślnie wskazuje na `127.0.0.1`.
- W scenariuszach dostępu zdalnego:
  - ustaw pluginowe `viewerBaseUrl`, albo
  - przekaż `baseUrl` dla danego wywołania narzędzia, albo
  - użyj `gateway.bind=custom` i `gateway.customBindHost`
- Jeśli `gateway.trustedProxies` zawiera loopback dla proxy działającego na tym samym hoście (na przykład Tailscale Serve), surowe żądania widoku loopback bez nagłówków przekazanego IP klienta są zgodnie z projektem bezpiecznie odrzucane.
- Dla tej topologii proxy:
  - preferuj `mode: "file"` lub `mode: "both"`, gdy potrzebujesz tylko załącznika, albo
  - świadomie włącz `security.allowRemoteViewer` i ustaw pluginowe `viewerBaseUrl` lub przekaż proxy/publiczne `baseUrl`, gdy potrzebujesz współdzielonego URL widoku
- Włączaj `security.allowRemoteViewer` tylko wtedy, gdy zamierzasz umożliwić zewnętrzny dostęp do widoku.

Wiersz niezmienionych linii nie ma przycisku rozwijania:

- Może się to zdarzyć dla wejścia patch, gdy patch nie zawiera rozwijalnego kontekstu.
- To oczekiwane i nie oznacza błędu widoku.

Nie znaleziono artefaktu:

- Artefakt wygasł z powodu TTL.
- Token lub ścieżka zostały zmienione.
- Czyszczenie usunęło nieaktualne dane.

## Wskazówki operacyjne

- Preferuj `mode: "view"` dla lokalnych interaktywnych przeglądów w Canvas.
- Preferuj `mode: "file"` dla wychodzących kanałów czatu, które wymagają załącznika.
- Pozostaw `allowRemoteViewer` wyłączone, chyba że wdrożenie wymaga zdalnych URL-i widoku.
- Ustaw jawne krótkie `ttlSeconds` dla wrażliwych różnic.
- Unikaj wysyłania sekretów w danych wejściowych różnic, jeśli nie jest to konieczne.
- Jeśli kanał agresywnie kompresuje obrazy (na przykład Telegram lub WhatsApp), preferuj wynik PDF (`fileFormat: "pdf"`).

Silnik renderowania różnic:

- Napędzany przez [Diffs](https://diffs.com).

## Powiązane dokumenty

- [Przegląd narzędzi](/tools)
- [Pluginy](/tools/plugin)
- [Przeglądarka](/tools/browser)
