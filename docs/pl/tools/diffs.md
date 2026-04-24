---
read_when:
    - Chcesz, aby agenci pokazywali edycje kodu lub markdown jako różnice
    - Chcesz uzyskać gotowy do canvas URL podglądu albo wyrenderowany plik diff
    - Potrzebujesz kontrolowanych, tymczasowych artefaktów diff z bezpiecznymi ustawieniami domyślnymi
summary: Narzędzie do odczytu różnic i renderowania plików dla agentów tylko do odczytu (opcjonalne narzędzie Plugin)
title: Różnice
x-i18n:
    generated_at: "2026-04-24T09:35:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: fe32441699b06dd27580b7e80afcfa3d1e466d7e2b74e52e60b327e73325eeca
    source_path: tools/diffs.md
    workflow: 15
---

`diffs` to opcjonalne narzędzie Plugin z krótkimi wbudowanymi wskazówkami systemowymi i towarzyszącym Skills, który zamienia treść zmian w artefakt różnic tylko do odczytu dla agentów.

Akceptuje jedno z poniższych:

- tekst `before` i `after`
- ujednolicony `patch`

Może zwrócić:

- URL podglądu Gateway do prezentacji w canvas
- ścieżkę do wyrenderowanego pliku (PNG lub PDF) do dostarczenia w wiadomości
- oba wyniki w jednym wywołaniu

Po włączeniu Plugin dodaje zwięzłe wskazówki użycia do przestrzeni system promptu, a także udostępnia szczegółowy Skills na wypadek, gdy agent potrzebuje pełniejszych instrukcji.

## Szybki start

1. Włącz Plugin.
2. Wywołaj `diffs` z `mode: "view"` dla przepływów canvas-first.
3. Wywołaj `diffs` z `mode: "file"` dla przepływów dostarczania plików w czacie.
4. Wywołaj `diffs` z `mode: "both"`, gdy potrzebujesz obu artefaktów.

## Włączanie Plugin

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

## Wyłączanie wbudowanych wskazówek systemowych

Jeśli chcesz pozostawić narzędzie `diffs` włączone, ale wyłączyć jego wbudowane wskazówki system promptu, ustaw `plugins.entries.diffs.hooks.allowPromptInjection` na `false`:

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

To blokuje hook `before_prompt_build` Plugin diffs, pozostawiając jednocześnie dostępne Plugin, narzędzie i towarzyszący Skills.

Jeśli chcesz wyłączyć zarówno wskazówki, jak i narzędzie, zamiast tego wyłącz Plugin.

## Typowy przepływ pracy agenta

1. Agent wywołuje `diffs`.
2. Agent odczytuje pola `details`.
3. Agent wykonuje jedną z następujących czynności:
   - otwiera `details.viewerUrl` za pomocą `canvas present`
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

## Dokumentacja wejścia narzędzia

Wszystkie pola są opcjonalne, o ile nie zaznaczono inaczej:

- `before` (`string`): tekst oryginalny. Wymagany razem z `after`, gdy pominięto `patch`.
- `after` (`string`): tekst zaktualizowany. Wymagany razem z `before`, gdy pominięto `patch`.
- `patch` (`string`): tekst ujednoliconego diff. Wzajemnie wykluczający się z `before` i `after`.
- `path` (`string`): wyświetlana nazwa pliku dla trybu before i after.
- `lang` (`string`): wskazówka nadpisania języka dla trybu before i after. Nieznane wartości przechodzą na zwykły tekst.
- `title` (`string`): nadpisanie tytułu podglądu.
- `mode` (`"view" | "file" | "both"`): tryb wyjścia. Domyślnie wartość domyślna Plugin `defaults.mode`.
  Przestarzały alias: `"image"` działa jak `"file"` i jest nadal akceptowany dla zgodności wstecznej.
- `theme` (`"light" | "dark"`): motyw podglądu. Domyślnie wartość domyślna Plugin `defaults.theme`.
- `layout` (`"unified" | "split"`): układ diff. Domyślnie wartość domyślna Plugin `defaults.layout`.
- `expandUnchanged` (`boolean`): rozwija niezmienione sekcje, gdy dostępny jest pełny kontekst. Opcja tylko dla pojedynczego wywołania (nie jest domyślnym kluczem Plugin).
- `fileFormat` (`"png" | "pdf"`): format wyrenderowanego pliku. Domyślnie wartość domyślna Plugin `defaults.fileFormat`.
- `fileQuality` (`"standard" | "hq" | "print"`): preset jakości dla renderowania PNG lub PDF.
- `fileScale` (`number`): nadpisanie skali urządzenia (`1`-`4`).
- `fileMaxWidth` (`number`): maksymalna szerokość renderowania w pikselach CSS (`640`-`2400`).
- `ttlSeconds` (`number`): TTL artefaktu w sekundach dla podglądu i samodzielnych wyjść plikowych. Domyślnie 1800, maksymalnie 21600.
- `baseUrl` (`string`): nadpisanie origin URL podglądu. Nadpisuje Plugin `viewerBaseUrl`. Musi być `http` lub `https`, bez query/hash.

Przestarzałe aliasy wejścia nadal są akceptowane dla zgodności wstecznej:

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
- Limit złożoności patch: maksymalnie 128 plików i 120000 łącznych linii.
- `patch` razem z `before` lub `after` jest odrzucany.
- Limity bezpieczeństwa renderowanego pliku (dotyczą PNG i PDF):
  - `fileQuality: "standard"`: maks. 8 MP (8 000 000 wyrenderowanych pikseli).
  - `fileQuality: "hq"`: maks. 14 MP (14 000 000 wyrenderowanych pikseli).
  - `fileQuality: "print"`: maks. 24 MP (24 000 000 wyrenderowanych pikseli).
  - PDF ma dodatkowo limit 50 stron.

## Kontrakt szczegółów wyjścia

Narzędzie zwraca ustrukturyzowane metadane w `details`.

Pola współdzielone dla trybów tworzących podgląd:

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

Aliasy zgodności również zwracane dla istniejących wywołań:

- `format` (ta sama wartość co `fileFormat`)
- `imagePath` (ta sama wartość co `filePath`)
- `imageBytes` (ta sama wartość co `fileBytes`)
- `imageQuality` (ta sama wartość co `fileQuality`)
- `imageScale` (ta sama wartość co `fileScale`)
- `imageMaxWidth` (ta sama wartość co `fileMaxWidth`)

Podsumowanie zachowania trybów:

- `mode: "view"`: tylko pola podglądu.
- `mode: "file"`: tylko pola pliku, bez artefaktu podglądu.
- `mode: "both"`: pola podglądu plus pola pliku. Jeśli renderowanie pliku się nie powiedzie, podgląd nadal zostanie zwrócony z `fileError` i aliasem zgodności `imageError`.

## Zwinięte niezmienione sekcje

- Podgląd może pokazywać wiersze typu `N unmodified lines`.
- Kontrolki rozwijania tych wierszy są warunkowe i nie są gwarantowane dla każdego rodzaju wejścia.
- Kontrolki rozwijania pojawiają się, gdy wyrenderowany diff ma dane rozwijalnego kontekstu, co jest typowe dla wejścia before i after.
- W przypadku wielu wejść unified patch pominięte treści kontekstu nie są dostępne w sparsowanych fragmentach patch, więc wiersz może pojawić się bez kontrolek rozwijania. To oczekiwane zachowanie.
- `expandUnchanged` ma zastosowanie tylko wtedy, gdy istnieje rozwijalny kontekst.

## Domyślne ustawienia Plugin

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

Jawne parametry narzędzia nadpisują te wartości domyślne.

Konfiguracja trwałego URL podglądu:

- `viewerBaseUrl` (`string`, opcjonalne)
  - Zapasowa wartość należąca do Plugin dla zwracanych linków podglądu, gdy wywołanie narzędzia nie przekazuje `baseUrl`.
  - Musi być `http` lub `https`, bez query/hash.

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
  - `false`: żądania spoza local loopback do tras podglądu są odrzucane.
  - `true`: zdalne podglądy są dozwolone, jeśli ścieżka z tokenem jest prawidłowa.

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

- Artefakty są przechowywane w podfolderze tymczasowym: `$TMPDIR/openclaw-diffs`.
- Metadane artefaktu podglądu zawierają:
  - losowy identyfikator artefaktu (20 znaków hex)
  - losowy token (48 znaków hex)
  - `createdAt` i `expiresAt`
  - przechowywaną ścieżkę `viewer.html`
- Domyślny TTL artefaktu wynosi 30 minut, jeśli nie został określony.
- Maksymalny akceptowany TTL podglądu to 6 godzin.
- Czyszczenie uruchamia się oportunistycznie po utworzeniu artefaktu.
- Wygasłe artefakty są usuwane.
- Zapasowe czyszczenie usuwa nieaktualne foldery starsze niż 24 godziny, gdy brakuje metadanych.

## URL podglądu i zachowanie sieciowe

Trasa podglądu:

- `/plugins/diffs/view/{artifactId}/{token}`

Zasoby podglądu:

- `/plugins/diffs/assets/viewer.js`
- `/plugins/diffs/assets/viewer-runtime.js`

Dokument podglądu rozwiązuje te zasoby względem URL podglądu, więc opcjonalny prefiks ścieżki `baseUrl` jest zachowywany również dla żądań o zasoby.

Zachowanie przy konstruowaniu URL:

- Jeśli podano `baseUrl` w wywołaniu narzędzia, jest używany po ścisłej walidacji.
- W przeciwnym razie, jeśli skonfigurowano `viewerBaseUrl` Plugin, jest on używany.
- Bez żadnego z tych nadpisań URL podglądu domyślnie wskazuje na loopback `127.0.0.1`.
- Jeśli tryb powiązania Gateway to `custom` i ustawiono `gateway.customBindHost`, używany jest ten host.

Zasady `baseUrl`:

- Musi mieć postać `http://` lub `https://`.
- Query i hash są odrzucane.
- Dozwolone jest origin plus opcjonalna ścieżka bazowa.

## Model bezpieczeństwa

Wzmocnienia podglądu:

- Domyślnie tylko loopback.
- Ścieżki podglądu z tokenem i ścisłą walidacją identyfikatora oraz tokena.
- CSP odpowiedzi podglądu:
  - `default-src 'none'`
  - skrypty i zasoby tylko z self
  - brak wychodzącego `connect-src`
- Ograniczanie zdalnych chybionych prób, gdy dostęp zdalny jest włączony:
  - 40 niepowodzeń na 60 sekund
  - 60 sekund blokady (`429 Too Many Requests`)

Wzmocnienia renderowania plików:

- Routing żądań przeglądarki zrzutów ekranu jest domyślnie blokowany.
- Dozwolone są tylko lokalne zasoby podglądu z `http://127.0.0.1/plugins/diffs/assets/*`.
- Zewnętrzne żądania sieciowe są blokowane.

## Wymagania przeglądarki dla trybu plikowego

`mode: "file"` i `mode: "both"` wymagają przeglądarki zgodnej z Chromium.

Kolejność rozwiązywania:

1. `browser.executablePath` w konfiguracji OpenClaw.
2. Zmienne środowiskowe:
   - `OPENCLAW_BROWSER_EXECUTABLE_PATH`
   - `BROWSER_EXECUTABLE_PATH`
   - `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`
3. Zapasowe wykrywanie polecenia/ścieżki dla platformy.

Typowy komunikat błędu:

- `Diff PNG/PDF rendering requires a Chromium-compatible browser...`

Naprawa: zainstaluj Chrome, Chromium, Edge lub Brave albo ustaw jedną z powyższych opcji ścieżki do pliku wykonywalnego.

## Rozwiązywanie problemów

Błędy walidacji wejścia:

- `Provide patch or both before and after text.`
  - Dołącz zarówno `before`, jak i `after`, albo podaj `patch`.
- `Provide either patch or before/after input, not both.`
  - Nie mieszaj trybów wejścia.
- `Invalid baseUrl: ...`
  - Użyj origin `http(s)` z opcjonalną ścieżką, bez query/hash.
- `{field} exceeds maximum size (...)`
  - Zmniejsz rozmiar ładunku.
- Odrzucenie dużego patch
  - Zmniejsz liczbę plików patch lub łączną liczbę linii.

Problemy z dostępnością podglądu:

- URL podglądu domyślnie rozwiązuje się do `127.0.0.1`.
- W scenariuszach dostępu zdalnego:
  - ustaw `viewerBaseUrl` Plugin, albo
  - przekazuj `baseUrl` dla każdego wywołania narzędzia, albo
  - użyj `gateway.bind=custom` i `gateway.customBindHost`
- Jeśli `gateway.trustedProxies` obejmuje loopback dla proxy na tym samym hoście (na przykład Tailscale Serve), surowe żądania podglądu loopback bez nagłówków przekazanego IP klienta kończą się zamknięciem zgodnie z projektem.
- Dla tej topologii proxy:
  - preferuj `mode: "file"` lub `mode: "both"`, gdy potrzebujesz tylko załącznika, albo
  - świadomie włącz `security.allowRemoteViewer` i ustaw `viewerBaseUrl` Plugin albo przekaż proxy/publiczne `baseUrl`, gdy potrzebujesz udostępnialnego URL podglądu
- Włączaj `security.allowRemoteViewer` tylko wtedy, gdy zamierzasz udostępniać podgląd na zewnątrz.

Wiersz niezmienionych linii nie ma przycisku rozwijania:

- Może się to zdarzyć dla wejścia patch, gdy patch nie zawiera rozwijalnego kontekstu.
- Jest to oczekiwane i nie oznacza awarii podglądu.

Nie znaleziono artefaktu:

- Artefakt wygasł z powodu TTL.
- Token lub ścieżka zostały zmienione.
- Czyszczenie usunęło nieaktualne dane.

## Wskazówki operacyjne

- Preferuj `mode: "view"` do lokalnych interaktywnych przeglądów w canvas.
- Preferuj `mode: "file"` dla wychodzących kanałów czatu, które wymagają załącznika.
- Pozostaw `allowRemoteViewer` wyłączone, chyba że Twoje wdrożenie wymaga zdalnych URL podglądu.
- Ustawiaj jawne krótkie `ttlSeconds` dla wrażliwych diff.
- Unikaj wysyłania sekretów w danych wejściowych diff, jeśli nie jest to konieczne.
- Jeśli Twój kanał agresywnie kompresuje obrazy (na przykład Telegram lub WhatsApp), preferuj wyjście PDF (`fileFormat: "pdf"`).

Silnik renderowania diff:

- Oparty na [Diffs](https://diffs.com).

## Powiązana dokumentacja

- [Przegląd narzędzi](/pl/tools)
- [Pluginy](/pl/tools/plugin)
- [Przeglądarka](/pl/tools/browser)
