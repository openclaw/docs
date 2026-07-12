---
read_when:
    - Uruchomiono `clawhub package validate` i trzeba naprawić wykryte problemy z pluginem
    - ClawHub odrzucił publikację pakietu pluginu lub wyświetlił ostrzeżenie
    - Aktualizujesz metadane pakietu Pluginu przed wydaniem
summary: Napraw problemy wykryte podczas walidacji pakietu Pluginu ClawHub przed publikacją
title: Poprawki walidacji Pluginu
x-i18n:
    generated_at: "2026-07-12T14:58:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2cb869e41c9a9f1c0725f514f6b48095eb3838bf61aaf06c2474a18192f0e819
    source_path: clawhub/plugin-validation-fixes.md
    workflow: 16
---

# Poprawki błędów walidacji pluginów

ClawHub weryfikuje pakiety pluginów przed publikacją, a także może wyświetlać ustalenia z automatycznych skanów pakietów. Ta strona opisuje ustalenia przeznaczone dla autorów, czyli takie, które autor pluginu może naprawić w metadanych pakietu, manifeście, importach SDK lub opublikowanym artefakcie.

Nie obejmuje ona wewnętrznych ustaleń dotyczących zakresu działania narzędzia Plugin Inspector. Jeśli pełny raport zawiera kody związane z utrzymaniem skanera bez wskazówek naprawczych dla autora, są one przeznaczone dla opiekunów OpenClaw, a nie autorów pluginów.

Po zastosowaniu każdej poprawki uruchom ponownie:

```bash
clawhub package validate <path-to-plugin>
```

## Ustalenia przeznaczone dla autorów

| Kod                                     | Zacznij tutaj                                                                                                                          |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `package-json-missing`                  | [Dodaj metadane pakietu](/pl/clawhub/plugin-validation-fixes#package-json-missing)                                                        |
| `package-openclaw-metadata-missing`     | [Dodaj blok openclaw pakietu](/pl/clawhub/plugin-validation-fixes#package-openclaw-metadata-missing)                                      |
| `package-openclaw-entry-missing`        | [Zadeklaruj punkty wejścia pakietu OpenClaw](/pl/clawhub/plugin-validation-fixes#package-openclaw-entry-missing)                           |
| `package-entrypoint-missing`            | [Opublikuj zadeklarowany punkt wejścia](/pl/clawhub/plugin-validation-fixes#package-entrypoint-missing)                                   |
| `package-install-metadata-incomplete`   | [Uzupełnij metadane instalacji](/pl/clawhub/plugin-validation-fixes#package-install-metadata-incomplete)                                  |
| `package-plugin-api-compat-missing`     | [Zadeklaruj zgodność z API pluginów](/pl/clawhub/plugin-validation-fixes#package-plugin-api-compat-missing)                               |
| `package-min-host-version-drift`        | [Ujednolić minimalną wersję hosta](/pl/clawhub/plugin-validation-fixes#package-min-host-version-drift)                                    |
| `package-manifest-version-drift`        | [Ujednolić wersje pakietu i manifestu](/pl/clawhub/plugin-validation-fixes#package-manifest-version-drift)                                |
| `package-openclaw-unsupported-metadata` | [Usuń nieobsługiwane metadane pakietu OpenClaw](/pl/clawhub/plugin-validation-fixes#package-openclaw-unsupported-metadata)                 |
| `package-npm-pack-unavailable`          | [Zapewnij możliwość spakowania artefaktu npm](/pl/clawhub/plugin-validation-fixes#package-npm-pack-unavailable)                           |
| `package-npm-pack-entrypoint-missing`   | [Uwzględnij punkty wejścia w wyniku npm pack](/pl/clawhub/plugin-validation-fixes#package-npm-pack-entrypoint-missing)                     |
| `package-npm-pack-metadata-missing`     | [Uwzględnij metadane w wyniku npm pack](/pl/clawhub/plugin-validation-fixes#package-npm-pack-metadata-missing)                            |
| `manifest-name-missing`                 | [Dodaj nazwę wyświetlaną manifestu](/pl/clawhub/plugin-validation-fixes#manifest-name-missing)                                            |
| `manifest-unknown-fields`               | [Usuń nieobsługiwane pola manifestu](/pl/clawhub/plugin-validation-fixes#manifest-unknown-fields)                                         |
| `manifest-unknown-contracts`            | [Usuń nieobsługiwane klucze kontraktów](/pl/clawhub/plugin-validation-fixes#manifest-unknown-contracts)                                   |
| `legacy-root-sdk-import`                | [Zastąp importy z głównego modułu SDK](/pl/clawhub/plugin-validation-fixes#legacy-root-sdk-import)                                        |
| `reserved-sdk-import`                   | [Usuń zastrzeżone importy SDK](/pl/clawhub/plugin-validation-fixes#reserved-sdk-import)                                                   |
| `sdk-load-session-store`                | [Zastąp dostęp do całego magazynu sesji](/pl/clawhub/plugin-validation-fixes#sdk-load-session-store)                                      |
| `sdk-session-store-write`               | [Zastąp zapisy całego magazynu sesji](/pl/clawhub/plugin-validation-fixes#sdk-session-store-write)                                        |
| `sdk-session-file-helper`               | [Zastąp funkcje pomocnicze ścieżek plików sesji](/pl/clawhub/plugin-validation-fixes#sdk-session-file-helper)                             |
| `sdk-session-transcript-file-target`    | [Zastąp starsze docelowe pliki transkrypcji](/pl/clawhub/plugin-validation-fixes#sdk-session-transcript-file-target)                      |
| `sdk-session-transcript-low-level`      | [Zastąp niskopoziomowe funkcje pomocnicze transkrypcji](/pl/clawhub/plugin-validation-fixes#sdk-session-transcript-low-level)             |
| `legacy-before-agent-start`             | [Zastąp before_agent_start](/pl/clawhub/plugin-validation-fixes#legacy-before-agent-start)                                                |
| `provider-auth-env-vars`                | [Przenieś zmienne środowiskowe dostawcy do metadanych konfiguracji](/pl/clawhub/plugin-validation-fixes#provider-auth-env-vars)           |
| `channel-env-vars`                      | [Odwzoruj zmienne środowiskowe kanału w bieżących metadanych](/pl/clawhub/plugin-validation-fixes#channel-env-vars)                       |
| `security-manifest-schema-unavailable`  | [Usuń odwołania do niedostępnego schematu manifestu zabezpieczeń](/pl/clawhub/plugin-validation-fixes#security-manifest-schema-unavailable) |
| `unrecognized-security-manifest`        | [Usuń nieobsługiwane pliki manifestu zabezpieczeń](/pl/clawhub/plugin-validation-fixes#unrecognized-security-manifest)                    |

## Metadane pakietu

### package-json-missing

Katalog główny pakietu nie zawiera pliku `package.json`, dlatego ClawHub nie może zidentyfikować pakietu npm, jego wersji, punktów wejścia ani metadanych OpenClaw.

- Dodaj plik `package.json` z polami `name`, `version` i `type`.
- Dodaj blok `openclaw`, jeśli pakiet zawiera plugin OpenClaw.
- Zapoznaj się ze stroną [Tworzenie pluginów](/pl/plugins/building-plugins), aby zobaczyć minimalny przykład pakietu, oraz stroną [Manifest pluginu](/pl/plugins/manifest#manifest-versus-packagejson), aby poznać podział między pakietem a manifestem.
- Uruchom ponownie `clawhub package validate <path-to-plugin>`.

### package-openclaw-metadata-missing

Pakiet zawiera plik `package.json`, ale nie deklaruje metadanych pakietu OpenClaw.

- Dodaj `package.json#openclaw`.
- Uwzględnij metadane punktów wejścia, takie jak `openclaw.extensions` lub `openclaw.runtimeExtensions`.
- Dodaj metadane zgodności i instalacji, jeśli pakiet będzie publikowany lub instalowany za pośrednictwem ClawHub.
- Zobacz [Pola package.json wpływające na wykrywanie](/pl/plugins/manifest#packagejson-fields-that-affect-discovery).
- Uruchom ponownie `clawhub package validate <path-to-plugin>`.

### package-openclaw-entry-missing

Metadane pakietu istnieją, ale nie deklarują punktu wejścia środowiska uruchomieniowego OpenClaw.

- Dodaj `openclaw.extensions` dla natywnych punktów wejścia pluginu.
- Dodaj `openclaw.runtimeExtensions`, jeśli opublikowany pakiet ma wczytywać skompilowany kod JavaScript.
- Wszystkie ścieżki punktów wejścia przechowuj wewnątrz katalogu pakietu.
- Zobacz [Punkty wejścia pluginu](/pl/plugins/sdk-entrypoints) oraz [Pola package.json wpływające na wykrywanie](/pl/plugins/manifest#packagejson-fields-that-affect-discovery).
- Uruchom ponownie `clawhub package validate <path-to-plugin>`.

### package-entrypoint-missing

Pakiet deklaruje punkt wejścia OpenClaw, ale wskazany plik nie występuje w weryfikowanym pakiecie.

- Sprawdź każdą ścieżkę w `openclaw.extensions`, `openclaw.runtimeExtensions`, `openclaw.setupEntry` i `openclaw.runtimeSetupEntry`.
- Zbuduj pakiet, jeśli punkt wejścia jest generowany w katalogu `dist`.
- Zaktualizuj metadane, jeśli punkt wejścia został przeniesiony.
- Zobacz [Punkty wejścia pluginu](/pl/plugins/sdk-entrypoints).
- Uruchom ponownie `clawhub package validate <path-to-plugin>`.

### package-install-metadata-incomplete

ClawHub nie może określić, w jaki sposób pakiet powinien być instalowany lub aktualizowany.

- Uzupełnij `openclaw.install` o obsługiwane źródło instalacji, takie jak `clawhubSpec`, `npmSpec` lub `localPath`.
- Ustaw `openclaw.install.defaultChoice`, jeśli dostępne jest więcej niż jedno źródło instalacji.
- Użyj `openclaw.install.minHostVersion`, aby określić minimalną wersję hosta OpenClaw.
- Zobacz [Pola package.json wpływające na wykrywanie](/pl/plugins/manifest#packagejson-fields-that-affect-discovery).
- Uruchom ponownie `clawhub package validate <path-to-plugin>`.

### package-plugin-api-compat-missing

Pakiet nie deklaruje obsługiwanego zakresu API pluginów OpenClaw.

- Dodaj `openclaw.compat.pluginApi` do pliku `package.json`.
- Użyj wersji API pluginów OpenClaw lub minimalnej wersji semantycznej, względem której pakiet został utworzony i przetestowany.
- Nie łącz tej wartości z wersją pakietu. Wersja pakietu opisuje wydanie pluginu, natomiast `openclaw.compat.pluginApi` opisuje kontrakt API hosta.
- Zobacz [Pola package.json wpływające na wykrywanie](/pl/plugins/manifest#packagejson-fields-that-affect-discovery).
- Uruchom ponownie `clawhub package validate <path-to-plugin>`.

### package-min-host-version-drift

Minimalna wersja hosta określona w pakiecie nie jest zgodna z metadanymi wersji OpenClaw, względem której pakiet został utworzony.

- Sprawdź `openclaw.install.minHostVersion`.
- Sprawdź wszystkie metadane kompilacji OpenClaw w pakiecie, takie jak wersja OpenClaw użyta podczas wydania.
- Ujednolić minimalną wersję hosta z zakresem wersji hosta faktycznie obsługiwanym przez pakiet.
- Zobacz [Pola package.json wpływające na wykrywanie](/pl/plugins/manifest#packagejson-fields-that-affect-discovery).
- Uruchom ponownie `clawhub package validate <path-to-plugin>`.

### package-manifest-version-drift

Wersja pakietu i wersja manifestu pluginu są niezgodne.

- Preferuj `package.json#version` jako wersję wydania pakietu.
- Jeśli plik `openclaw.plugin.json` również zawiera pole `version`, zaktualizuj je, aby było zgodne, lub usuń nieaktualne metadane wersji manifestu, gdy nadrzędne są metadane pakietu.
- Po zmianie opublikowanych metadanych opublikuj nową wersję pakietu.
- Zobacz [Manifest pluginu](/pl/plugins/manifest).
- Uruchom ponownie `clawhub package validate <path-to-plugin>`.

### package-openclaw-unsupported-metadata

Blok `package.json#openclaw` zawiera pola, które nie są obsługiwanymi metadanymi pakietu OpenClaw.

- Usuń nieobsługiwane pola, takie jak `openclaw.bundle`.
- Metadane natywnego pluginu przechowuj w pliku `openclaw.plugin.json`.
- Punkty wejścia pakietu oraz metadane zgodności, instalacji, konfiguracji i katalogu przechowuj w obsługiwanych polach `package.json#openclaw`.
- Zobacz [Pola package.json wpływające na wykrywanie](/pl/plugins/manifest#packagejson-fields-that-affect-discovery).
- Uruchom ponownie `clawhub package validate <path-to-plugin>`.

## Opublikowany artefakt

### package-npm-pack-unavailable

Pakietu nie można spakować do postaci artefaktu, który ClawHub sprawdzałby lub publikował.

- Uruchom `npm pack --dry-run` z katalogu głównego pakietu.
- Popraw nieprawidłowe metadane pakietu, uszkodzone skrypty cyklu życia lub wpisy pola `files`, które powodują niepowodzenie pakowania.
- Usuń `private: true`, jeśli ten pakiet jest przeznaczony do publicznej publikacji.
- Uruchom ponownie `clawhub package validate <path-to-plugin>`.

### package-npm-pack-entrypoint-missing

Pakiet można spakować, ale spakowany artefakt nie zawiera plików punktów wejścia zadeklarowanych w `package.json#openclaw`.

- Uruchom `npm pack --dry-run` i sprawdź pliki, które zostałyby uwzględnione.
- Zbuduj generowane punkty wejścia przed pakowaniem.
- Zaktualizuj `files`, `.npmignore` lub wynik kompilacji, aby zadeklarowane punkty wejścia zostały uwzględnione.
- Zobacz [Punkty wejścia pluginu](/pl/plugins/sdk-entrypoints).
- Uruchom ponownie `clawhub package validate <path-to-plugin>`.

### package-npm-pack-metadata-missing

W spakowanym artefakcie brakuje metadanych OpenClaw, które istnieją w pakiecie źródłowym.

- Uruchom `npm pack --dry-run` i sprawdź dołączone pliki metadanych.
- Upewnij się, że plik `package.json` zawiera blok `openclaw` w spakowanym artefakcie.
- Upewnij się, że plik `openclaw.plugin.json` jest dołączony, gdy pakiet jest natywnym pluginem OpenClaw.
- Zaktualizuj `files` lub `.npmignore`, aby metadane pakietu nie były wykluczone.
- Zobacz [Tworzenie pluginów](/pl/plugins/building-plugins).
- Uruchom ponownie `clawhub package validate <path-to-plugin>`.

## Metadane manifestu

### manifest-name-missing

Natywny manifest pluginu nie zawiera nazwy wyświetlanej.

- Dodaj niepuste pole `name` do pliku `openclaw.plugin.json`.
- Wartość `name` powinna być czytelna dla człowieka, natomiast `id` powinno pozostać stabilnym identyfikatorem maszynowym.
- Zobacz [Manifest pluginu](/pl/plugins/manifest).
- Ponownie uruchom `clawhub package validate <path-to-plugin>`.

### manifest-unknown-fields

Manifest pluginu zawiera pola najwyższego poziomu, których OpenClaw nie obsługuje.

- Porównaj każde pole najwyższego poziomu z
  [dokumentacją pól manifestu](/pl/plugins/manifest#top-level-field-reference).
- Usuń niestandardowe pola z pliku `openclaw.plugin.json`.
- Przenieś metadane pakietu lub instalacji do obsługiwanych pól `package.json#openclaw`
  zamiast umieszczać je w manifeście.
- Ponownie uruchom `clawhub package validate <path-to-plugin>`.

### manifest-unknown-contracts

Manifest deklaruje nieobsługiwane klucze wewnątrz `contracts`.

- Porównaj każdy klucz w `contracts` z
  [dokumentacją kontraktów](/pl/plugins/manifest#contracts-reference).
- Usuń nieobsługiwane klucze kontraktów.
- Przenieś zachowanie środowiska uruchomieniowego do kodu rejestracji pluginu, a zawartość `contracts`
  ogranicz do statycznych metadanych własności możliwości.
- Ponownie uruchom `clawhub package validate <path-to-plugin>`.

## Migracja SDK i zgodności

### legacy-root-sdk-import

Plugin importuje elementy z przestarzałego głównego pliku zbiorczego SDK:
`openclaw/plugin-sdk`.

- Zastąp importy z głównego pliku zbiorczego precyzyjnymi importami z publicznych podścieżek.
- Użyj `openclaw/plugin-sdk/plugin-entry` dla `definePluginEntry`.
- Użyj `openclaw/plugin-sdk/channel-core` dla funkcji pomocniczych punktu wejścia kanału.
- Skorzystaj z [Konwencji importowania](/pl/plugins/building-plugins#import-conventions) i
  [Podścieżek SDK pluginów](/pl/plugins/sdk-subpaths), aby znaleźć precyzyjny import.
- Ponownie uruchom `clawhub package validate <path-to-plugin>`.

### reserved-sdk-import

Plugin importuje ścieżkę SDK zarezerwowaną dla wbudowanych pluginów lub wewnętrznej
zgodności.

- Zastąp zarezerwowane wewnętrzne importy SDK OpenClaw udokumentowanymi publicznymi
  podścieżkami `openclaw/plugin-sdk/*`.
- Jeśli dane zachowanie nie ma publicznego SDK, umieść funkcję pomocniczą we własnym pakiecie lub
  poproś o publiczne API OpenClaw.
- Skorzystaj z [Podścieżek SDK pluginów](/pl/plugins/sdk-subpaths) i
  [Migracji SDK](/pl/plugins/sdk-migration), aby wybrać obsługiwany import.
- Ponownie uruchom `clawhub package validate <path-to-plugin>`.

### sdk-load-session-store

Plugin nadal używa przestarzałej funkcji pomocniczej całego magazynu sesji
`loadSessionStore`.

- Podczas odczytywania stanu sesji używaj `getSessionEntry(...)` lub
  `listSessionEntries(...)`.
- Podczas zapisywania stanu sesji używaj `patchSessionEntry(...)` lub
  `upsertSessionEntry(...)`.
- Unikaj wczytywania, modyfikowania i zapisywania całego obiektu magazynu sesji.
- Zachowaj `loadSessionStore(...)` tylko dopóty, dopóki deklarowany zakres zgodności
  nadal obsługuje starsze wersje OpenClaw, które jej wymagają.
- Zobacz [API środowiska uruchomieniowego](/pl/plugins/sdk-runtime#agent-session-state) i
  [Podścieżki SDK pluginów](/pl/plugins/sdk-subpaths).
- Ponownie uruchom `clawhub package validate <path-to-plugin>`.

### sdk-session-store-write

Plugin nadal używa przestarzałej funkcji pomocniczej zapisu całego magazynu sesji, takiej jak
`saveSessionStore` lub `updateSessionStore`.

- Podczas aktualizowania pól istniejącego wpisu sesji używaj
  `patchSessionEntry(...)`.
- Podczas zastępowania lub tworzenia wpisu sesji używaj `upsertSessionEntry(...)`.
- Unikaj wczytywania, modyfikowania i zapisywania całego obiektu magazynu sesji.
- Zachowaj funkcje pomocnicze zapisu całego magazynu tylko dopóty, dopóki deklarowany zakres zgodności
  nadal obsługuje starsze wersje OpenClaw, które ich wymagają.
- Zobacz [API środowiska uruchomieniowego](/pl/plugins/sdk-runtime#agent-session-state) i
  [Podścieżki SDK pluginów](/pl/plugins/sdk-subpaths).
- Ponownie uruchom `clawhub package validate <path-to-plugin>`.

### sdk-session-file-helper

Plugin nadal używa przestarzałych funkcji pomocniczych ścieżek plików sesji, takich jak
`resolveSessionFilePath` lub `resolveAndPersistSessionFile`.

- Używaj `getSessionEntry(...)`, aby odczytywać metadane sesji według tożsamości
  agenta i sesji.
- Używaj `patchSessionEntry(...)` lub `upsertSessionEntry(...)`, aby utrwalać metadane
  sesji.
- Gdy kod przygotowuje operację na transkrypcji, używaj funkcji pomocniczych tożsamości lub celu transkrypcji.
- Nie utrwalaj starszych ścieżek plików transkrypcji ani nie uzależniaj od nich działania.
- Zobacz [API środowiska uruchomieniowego](/pl/plugins/sdk-runtime#agent-session-state) i
  [Podścieżki SDK pluginów](/pl/plugins/sdk-subpaths).
- Ponownie uruchom `clawhub package validate <path-to-plugin>`.

### sdk-session-transcript-file-target

Plugin nadal używa przestarzałej funkcji pomocniczej celu pliku transkrypcji
`resolveSessionTranscriptLegacyFileTarget`.

- Używaj `resolveSessionTranscriptIdentity(...)`, gdy kod potrzebuje tylko publicznej
  tożsamości sesji.
- Używaj `resolveSessionTranscriptTarget(...)`, gdy kod potrzebuje ustrukturyzowanego
  celu operacji na transkrypcji.
- Unikaj bezpośredniego odczytywania lub tworzenia starszych celów plików transkrypcji.
- Zachowaj starszą funkcję pomocniczą tylko dopóty, dopóki deklarowany zakres zgodności nadal
  obsługuje starsze wersje OpenClaw, które jej wymagają.
- Zobacz [API środowiska uruchomieniowego](/pl/plugins/sdk-runtime#agent-session-state) i
  [Podścieżki SDK pluginów](/pl/plugins/sdk-subpaths).
- Ponownie uruchom `clawhub package validate <path-to-plugin>`.

### sdk-session-transcript-low-level

Plugin nadal używa przestarzałych niskopoziomowych funkcji pomocniczych transkrypcji, takich jak
`appendSessionTranscriptMessage` lub `emitSessionTranscriptUpdate`.

- Używaj `appendSessionTranscriptMessageByIdentity(...)` do dołączania wpisów do transkrypcji.
- Używaj `publishSessionTranscriptUpdateByIdentity(...)` do powiadamiania
  o aktualizacjach transkrypcji.
- Preferuj ustrukturyzowany interfejs transkrypcji środowiska uruchomieniowego, aby OpenClaw mógł stosować
  prawidłowe granice transakcji i obsługę tożsamości.
- Zachowaj niskopoziomowe funkcje pomocnicze transkrypcji tylko dopóty, dopóki deklarowany zakres zgodności
  nadal obsługuje starsze wersje OpenClaw, które ich wymagają.
- Zobacz [API środowiska uruchomieniowego](/pl/plugins/sdk-runtime#agent-session-state) i
  [Podścieżki SDK pluginów](/pl/plugins/sdk-subpaths).
- Ponownie uruchom `clawhub package validate <path-to-plugin>`.

### legacy-before-agent-start

Plugin nadal używa starszego punktu zaczepienia `before_agent_start`.

- Przenieś logikę nadpisywania modelu lub dostawcy do `before_model_resolve`.
- Przenieś logikę modyfikowania promptu lub kontekstu do `before_prompt_build`.
- Zachowaj `before_agent_start` tylko dopóty, dopóki deklarowany zakres zgodności nadal
  obsługuje starsze wersje OpenClaw, które go wymagają.
- Zobacz [Punkty zaczepienia](/pl/plugins/hooks) i
  [Zgodność pluginów](/pl/plugins/compatibility).
- Ponownie uruchom `clawhub package validate <path-to-plugin>`.

### provider-auth-env-vars

Manifest nadal używa starszych metadanych uwierzytelniania dostawcy `providerAuthEnvVars`.

- Odzwierciedl metadane zmiennych środowiskowych dostawcy w `setup.providers[].envVars`.
- Zachowaj `providerAuthEnvVars` tylko jako metadane zgodności, dopóki obsługiwany
  zakres wersji OpenClaw nadal ich wymaga.
- Zobacz [Dokumentację konfiguracji](/pl/plugins/manifest#setup-reference) i
  [Migrację SDK](/pl/plugins/sdk-migration).
- Ponownie uruchom `clawhub package validate <path-to-plugin>`.

### channel-env-vars

Manifest używa starszych metadanych zmiennych środowiskowych kanału bez bieżących
metadanych konfiguracji lub ustawień wymaganych przez ClawHub.

- Zachowaj deklaratywną postać metadanych zmiennych środowiskowych kanału, aby OpenClaw mógł sprawdzać stan konfiguracji
  bez wczytywania środowiska uruchomieniowego kanału.
- Odzwierciedl konfigurację kanału opartą na zmiennych środowiskowych w bieżących metadanych konfiguracji, ustawień kanału lub
  kanału pakietu używanych przez strukturę pluginu.
- Zachowaj `channelEnvVars` tylko jako metadane zgodności, dopóki starsze obsługiwane
  wersje OpenClaw nadal ich wymagają.
- Zobacz [Manifest pluginu](/pl/plugins/manifest) i
  [Pluginy kanałów](/pl/plugins/sdk-channel-plugins).
- Ponownie uruchom `clawhub package validate <path-to-plugin>`.

## Manifest zabezpieczeń

### security-manifest-schema-unavailable

Pakiet zawiera plik `openclaw.security.json` z odwołaniem do schematu, którego ClawHub
nie rozpoznaje jako dostępnego.

- Usuń adres URL schematu, jeśli pełni on wyłącznie funkcję informacyjną.
- Używaj udokumentowanego, wersjonowanego schematu dopiero po jego opublikowaniu przez OpenClaw.
- Ponownie uruchom `clawhub package validate <path-to-plugin>`.

### unrecognized-security-manifest

Pakiet zawiera nieobsługiwany plik manifestu zabezpieczeń.

- Usuń `openclaw.security.json`, dopóki OpenClaw nie udokumentuje wersjonowanego schematu
  manifestu zabezpieczeń i sposobu jego obsługi przez ClawHub.
- Dopóki kontrakt manifestu nie istnieje, dokumentuj zachowania mające wpływ na bezpieczeństwo w publicznej dokumentacji pakietu lub
  pliku README.
- Ponownie uruchom `clawhub package validate <path-to-plugin>`.

## Powiązane materiały

- [CLI ClawHub](/pl/clawhub/cli)
- [Publikowanie w ClawHub](/pl/clawhub/publishing)
- [Tworzenie pluginów](/pl/plugins/building-plugins)
- [Manifest pluginu](/pl/plugins/manifest)
- [Punkty wejścia pluginu](/pl/plugins/sdk-entrypoints)
- [Zgodność pluginów](/pl/plugins/compatibility)
