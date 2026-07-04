---
read_when:
    - Uruchomiono clawhub package validate i trzeba naprawić problemy zgłoszone dla Pluginu
    - ClawHub odrzucił publikację pakietu Plugin albo wyświetlił ostrzeżenie
    - Aktualizujesz metadane pakietu Plugin przed wydaniem
summary: Napraw ustalenia z walidacji pakietu Plugin ClawHub przed publikacją
title: Poprawki walidacji Plugin
x-i18n:
    generated_at: "2026-07-04T06:53:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2cb869e41c9a9f1c0725f514f6b48095eb3838bf61aaf06c2474a18192f0e819
    source_path: clawhub/plugin-validation-fixes.md
    workflow: 16
---

# Poprawki walidacji Plugin

ClawHub weryfikuje pakiety pluginów przed publikacją i może też pokazywać ustalenia z
automatycznych skanów pakietów. Ta strona omawia ustalenia skierowane do autorów, czyli
ustalenia, które autor pluginu może naprawić w metadanych pakietu, manifeście, importach SDK
albo opublikowanym artefakcie.

Nie obejmuje wewnętrznych ustaleń pokrycia z Plugin Inspector. Jeśli pełny raport
zawiera kody konserwacyjne skanera bez wskazówek naprawczych dla autora, są one
przeznaczone dla opiekunów OpenClaw, a nie dla autorów pluginów.

Po zastosowaniu dowolnej poprawki uruchom ponownie:

```bash
clawhub package validate <path-to-plugin>
```

## Ustalenia skierowane do autorów

| Kod                                     | Zacznij tutaj                                                                                                               |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `package-json-missing`                  | [Dodaj metadane pakietu](/pl/clawhub/plugin-validation-fixes#package-json-missing)                                             |
| `package-openclaw-metadata-missing`     | [Dodaj blok openclaw pakietu](/pl/clawhub/plugin-validation-fixes#package-openclaw-metadata-missing)                           |
| `package-openclaw-entry-missing`        | [Zadeklaruj punkty wejścia pakietu OpenClaw](/pl/clawhub/plugin-validation-fixes#package-openclaw-entry-missing)               |
| `package-entrypoint-missing`            | [Opublikuj zadeklarowany punkt wejścia](/pl/clawhub/plugin-validation-fixes#package-entrypoint-missing)                        |
| `package-install-metadata-incomplete`   | [Uzupełnij metadane instalacji](/pl/clawhub/plugin-validation-fixes#package-install-metadata-incomplete)                       |
| `package-plugin-api-compat-missing`     | [Zadeklaruj zgodność API pluginów](/pl/clawhub/plugin-validation-fixes#package-plugin-api-compat-missing)                      |
| `package-min-host-version-drift`        | [Wyrównaj minimalną wersję hosta](/pl/clawhub/plugin-validation-fixes#package-min-host-version-drift)                          |
| `package-manifest-version-drift`        | [Wyrównaj wersje pakietu i manifestu](/pl/clawhub/plugin-validation-fixes#package-manifest-version-drift)                      |
| `package-openclaw-unsupported-metadata` | [Usuń nieobsługiwane metadane pakietu OpenClaw](/pl/clawhub/plugin-validation-fixes#package-openclaw-unsupported-metadata)     |
| `package-npm-pack-unavailable`          | [Spraw, aby artefakt npm dało się spakować](/pl/clawhub/plugin-validation-fixes#package-npm-pack-unavailable)                  |
| `package-npm-pack-entrypoint-missing`   | [Uwzględnij punkty wejścia w wyniku npm pack](/pl/clawhub/plugin-validation-fixes#package-npm-pack-entrypoint-missing)         |
| `package-npm-pack-metadata-missing`     | [Uwzględnij metadane w wyniku npm pack](/pl/clawhub/plugin-validation-fixes#package-npm-pack-metadata-missing)                 |
| `manifest-name-missing`                 | [Dodaj wyświetlaną nazwę manifestu](/pl/clawhub/plugin-validation-fixes#manifest-name-missing)                                 |
| `manifest-unknown-fields`               | [Usuń nieobsługiwane pola manifestu](/pl/clawhub/plugin-validation-fixes#manifest-unknown-fields)                              |
| `manifest-unknown-contracts`            | [Usuń nieobsługiwane klucze kontraktów](/pl/clawhub/plugin-validation-fixes#manifest-unknown-contracts)                        |
| `legacy-root-sdk-import`                | [Zastąp importy z głównego SDK](/pl/clawhub/plugin-validation-fixes#legacy-root-sdk-import)                                    |
| `reserved-sdk-import`                   | [Usuń zastrzeżone importy SDK](/pl/clawhub/plugin-validation-fixes#reserved-sdk-import)                                        |
| `sdk-load-session-store`                | [Zastąp dostęp do całego magazynu sesji](/pl/clawhub/plugin-validation-fixes#sdk-load-session-store)                           |
| `sdk-session-store-write`               | [Zastąp zapisy całego magazynu sesji](/pl/clawhub/plugin-validation-fixes#sdk-session-store-write)                             |
| `sdk-session-file-helper`               | [Zastąp pomocniki ścieżek plików sesji](/pl/clawhub/plugin-validation-fixes#sdk-session-file-helper)                           |
| `sdk-session-transcript-file-target`    | [Zastąp starsze cele plików transkrypcji](/pl/clawhub/plugin-validation-fixes#sdk-session-transcript-file-target)              |
| `sdk-session-transcript-low-level`      | [Zastąp niskopoziomowe pomocniki transkrypcji](/pl/clawhub/plugin-validation-fixes#sdk-session-transcript-low-level)           |
| `legacy-before-agent-start`             | [Zastąp before_agent_start](/pl/clawhub/plugin-validation-fixes#legacy-before-agent-start)                                     |
| `provider-auth-env-vars`                | [Przenieś zmienne środowiskowe dostawcy do metadanych konfiguracji](/pl/clawhub/plugin-validation-fixes#provider-auth-env-vars) |
| `channel-env-vars`                      | [Odzwierciedl zmienne środowiskowe kanału w bieżących metadanych](/pl/clawhub/plugin-validation-fixes#channel-env-vars)        |
| `security-manifest-schema-unavailable`  | [Usuń odwołania do niedostępnych schematów manifestu zabezpieczeń](/pl/clawhub/plugin-validation-fixes#security-manifest-schema-unavailable) |
| `unrecognized-security-manifest`        | [Usuń nieobsługiwane pliki manifestu zabezpieczeń](/pl/clawhub/plugin-validation-fixes#unrecognized-security-manifest)         |

## Metadane pakietu

### package-json-missing

Katalog główny pakietu nie zawiera `package.json`, więc ClawHub nie może zidentyfikować
pakietu npm, wersji, punktów wejścia ani metadanych OpenClaw.

- Dodaj `package.json` z `name`, `version` i `type`.
- Dodaj blok `openclaw`, gdy pakiet dostarcza plugin OpenClaw.
- Skorzystaj z [Budowania pluginów](/pl/plugins/building-plugins), aby zobaczyć minimalny przykład pakietu,
  oraz z [Manifestu Plugin](/pl/plugins/manifest#manifest-versus-packagejson),
  aby poznać rozdział między pakietem a manifestem.
- Uruchom ponownie `clawhub package validate <path-to-plugin>`.

### package-openclaw-metadata-missing

Pakiet ma `package.json`, ale nie deklaruje metadanych pakietu OpenClaw.

- Dodaj `package.json#openclaw`.
- Uwzględnij metadane punktów wejścia, takie jak `openclaw.extensions` lub
  `openclaw.runtimeExtensions`.
- Dodaj metadane zgodności i instalacji, gdy pakiet będzie publikowany lub
  instalowany przez ClawHub.
- Zobacz [pola package.json wpływające na wykrywanie](/pl/plugins/manifest#packagejson-fields-that-affect-discovery).
- Uruchom ponownie `clawhub package validate <path-to-plugin>`.

### package-openclaw-entry-missing

Metadane pakietu istnieją, ale nie deklarują punktu wejścia środowiska uruchomieniowego OpenClaw.

- Dodaj `openclaw.extensions` dla natywnych punktów wejścia pluginu.
- Dodaj `openclaw.runtimeExtensions`, gdy opublikowany pakiet ma ładować zbudowany
  JavaScript.
- Trzymaj wszystkie ścieżki punktów wejścia wewnątrz katalogu pakietu.
- Zobacz [Punkty wejścia Plugin](/pl/plugins/sdk-entrypoints) oraz
  [pola package.json wpływające na wykrywanie](/pl/plugins/manifest#packagejson-fields-that-affect-discovery).
- Uruchom ponownie `clawhub package validate <path-to-plugin>`.

### package-entrypoint-missing

Pakiet deklaruje punkt wejścia OpenClaw, ale wskazanego pliku brakuje
w walidowanym pakiecie.

- Sprawdź każdą ścieżkę w `openclaw.extensions`, `openclaw.runtimeExtensions`,
  `openclaw.setupEntry` i `openclaw.runtimeSetupEntry`.
- Zbuduj pakiet, jeśli punkt wejścia jest generowany do `dist`.
- Zaktualizuj metadane, jeśli punkt wejścia został przeniesiony.
- Zobacz [Punkty wejścia Plugin](/pl/plugins/sdk-entrypoints).
- Uruchom ponownie `clawhub package validate <path-to-plugin>`.

### package-install-metadata-incomplete

ClawHub nie może określić, jak pakiet powinien być instalowany lub aktualizowany.

- Wypełnij `openclaw.install` obsługiwanym źródłem instalacji, takim jak
  `clawhubSpec`, `npmSpec` lub `localPath`.
- Ustaw `openclaw.install.defaultChoice`, gdy dostępne jest więcej niż jedno źródło
  instalacji.
- Użyj `openclaw.install.minHostVersion` dla minimalnej wersji hosta OpenClaw.
- Zobacz [pola package.json wpływające na wykrywanie](/pl/plugins/manifest#packagejson-fields-that-affect-discovery).
- Uruchom ponownie `clawhub package validate <path-to-plugin>`.

### package-plugin-api-compat-missing

Pakiet nie deklaruje zakresu API pluginów OpenClaw, który obsługuje.

- Dodaj `openclaw.compat.pluginApi` do `package.json`.
- Użyj wersji API pluginów OpenClaw albo dolnej granicy semver, względem której
  zbudowano i przetestowano pakiet.
- Trzymaj to oddzielnie od wersji pakietu. Wersja pakietu opisuje wydanie
  pluginu; `openclaw.compat.pluginApi` opisuje kontrakt API hosta.
- Zobacz [pola package.json wpływające na wykrywanie](/pl/plugins/manifest#packagejson-fields-that-affect-discovery).
- Uruchom ponownie `clawhub package validate <path-to-plugin>`.

### package-min-host-version-drift

Minimalna wersja hosta pakietu nie zgadza się z metadanymi wersji OpenClaw,
względem których pakiet został zbudowany.

- Sprawdź `openclaw.install.minHostVersion`.
- Sprawdź wszelkie metadane kompilacji OpenClaw w pakiecie, takie jak wersja OpenClaw
  użyta podczas wydania.
- Wyrównaj minimalną wersję hosta z zakresem wersji hosta, który pakiet
  faktycznie obsługuje.
- Zobacz [pola package.json wpływające na wykrywanie](/pl/plugins/manifest#packagejson-fields-that-affect-discovery).
- Uruchom ponownie `clawhub package validate <path-to-plugin>`.

### package-manifest-version-drift

Wersja pakietu i wersja manifestu pluginu są ze sobą niezgodne.

- Preferuj `package.json#version` jako wersję wydania pakietu.
- Jeśli `openclaw.plugin.json` także ma `version`, zaktualizuj ją, aby była zgodna, albo usuń
  nieaktualne metadane wersji manifestu, gdy metadane pakietu są rozstrzygające.
- Opublikuj nową wersję pakietu po zmianie opublikowanych metadanych.
- Zobacz [Manifest Plugin](/pl/plugins/manifest).
- Uruchom ponownie `clawhub package validate <path-to-plugin>`.

### package-openclaw-unsupported-metadata

Blok `package.json#openclaw` zawiera pola, które nie są obsługiwanymi
metadanymi pakietu OpenClaw.

- Usuń nieobsługiwane pola, takie jak `openclaw.bundle`.
- Trzymaj natywne metadane pluginu w `openclaw.plugin.json`.
- Trzymaj punkty wejścia pakietu, zgodność, instalację, konfigurację i metadane katalogu
  w obsługiwanych polach `package.json#openclaw`.
- Zobacz [pola package.json wpływające na wykrywanie](/pl/plugins/manifest#packagejson-fields-that-affect-discovery).
- Uruchom ponownie `clawhub package validate <path-to-plugin>`.

## Opublikowany artefakt

### package-npm-pack-unavailable

Pakietu nie da się spakować do artefaktu, który ClawHub mógłby sprawdzić lub
opublikować.

- Uruchom `npm pack --dry-run` z katalogu głównego pakietu.
- Napraw nieprawidłowe metadane pakietu, uszkodzone skrypty cyklu życia albo wpisy plików, które
  powodują niepowodzenie pakowania.
- Usuń `private: true`, jeśli ten pakiet jest przeznaczony do publicznej publikacji.
- Uruchom ponownie `clawhub package validate <path-to-plugin>`.

### package-npm-pack-entrypoint-missing

Pakiet da się spakować, ale spakowany artefakt nie zawiera plików punktów wejścia
zadeklarowanych w `package.json#openclaw`.

- Uruchom `npm pack --dry-run` i sprawdź pliki, które zostałyby uwzględnione.
- Zbuduj generowane punkty wejścia przed pakowaniem.
- Zaktualizuj `files`, `.npmignore` lub wynik kompilacji, aby zadeklarowane punkty wejścia
  były uwzględnione.
- Zobacz [Punkty wejścia Plugin](/pl/plugins/sdk-entrypoints).
- Uruchom ponownie `clawhub package validate <path-to-plugin>`.

### package-npm-pack-metadata-missing

W spakowanym artefakcie brakuje metadanych OpenClaw, które istnieją w pakiecie
źródłowym.

- Uruchom `npm pack --dry-run` i sprawdź uwzględnione pliki metadanych.
- Upewnij się, że `package.json` zawiera blok `openclaw` w spakowanym artefakcie.
- Upewnij się, że `openclaw.plugin.json` jest uwzględniony, gdy pakiet jest natywnym
  pluginem OpenClaw.
- Zaktualizuj `files` lub `.npmignore`, aby metadane pakietu nie były wykluczone.
- Zobacz [Budowanie pluginów](/pl/plugins/building-plugins).
- Uruchom ponownie `clawhub package validate <path-to-plugin>`.

## Metadane manifestu

### manifest-name-missing

Natywny manifest Plugin nie zawiera nazwy wyświetlanej.

- Dodaj niepuste pole `name` do `openclaw.plugin.json`.
- Utrzymuj `name` jako czytelne dla człowieka, a `id` jako stabilny identyfikator maszynowy.
- Zobacz [Manifest Plugin](/pl/plugins/manifest).
- Uruchom ponownie `clawhub package validate <path-to-plugin>`.

### manifest-unknown-fields

Manifest Plugin ma pola najwyższego poziomu, których OpenClaw nie obsługuje.

- Porównaj każde pole najwyższego poziomu z
  [referencją pól manifestu](/pl/plugins/manifest#top-level-field-reference).
- Usuń pola niestandardowe z `openclaw.plugin.json`.
- Przenieś metadane pakietu lub instalacji do obsługiwanych pól `package.json#openclaw`
  zamiast do manifestu.
- Uruchom ponownie `clawhub package validate <path-to-plugin>`.

### manifest-unknown-contracts

Manifest deklaruje nieobsługiwane klucze wewnątrz `contracts`.

- Porównaj każdy klucz pod `contracts` z
  [referencją kontraktów](/pl/plugins/manifest#contracts-reference).
- Usuń nieobsługiwane klucze kontraktów.
- Przenieś zachowanie środowiska uruchomieniowego do kodu rejestracji Plugin i ogranicz `contracts`
  do statycznych metadanych własności możliwości.
- Uruchom ponownie `clawhub package validate <path-to-plugin>`.

## SDK i migracja zgodności

### legacy-root-sdk-import

Plugin importuje z przestarzałego głównego barrela SDK:
`openclaw/plugin-sdk`.

- Zastąp importy z głównego barrela ukierunkowanymi importami z publicznych podścieżek.
- Użyj `openclaw/plugin-sdk/plugin-entry` dla `definePluginEntry`.
- Użyj `openclaw/plugin-sdk/channel-core` dla pomocników wejścia kanału.
- Użyj [konwencji importu](/pl/plugins/building-plugins#import-conventions) i
  [podścieżek SDK Plugin](/pl/plugins/sdk-subpaths), aby znaleźć wąski import.
- Uruchom ponownie `clawhub package validate <path-to-plugin>`.

### reserved-sdk-import

Plugin importuje ścieżkę SDK zarezerwowaną dla dołączonych Plugin lub wewnętrznej
zgodności.

- Zastąp zarezerwowane wewnętrzne importy SDK OpenClaw udokumentowanymi publicznymi
  podścieżkami `openclaw/plugin-sdk/*`.
- Jeśli dane zachowanie nie ma publicznego SDK, zachowaj pomocnik wewnątrz swojego pakietu albo
  poproś o publiczne API OpenClaw.
- Użyj [podścieżek SDK Plugin](/pl/plugins/sdk-subpaths) i
  [migracji SDK](/pl/plugins/sdk-migration), aby wybrać obsługiwany import.
- Uruchom ponownie `clawhub package validate <path-to-plugin>`.

### sdk-load-session-store

Plugin nadal używa przestarzałego pomocnika całego magazynu sesji
`loadSessionStore`.

- Używaj `getSessionEntry(...)` lub `listSessionEntries(...)` podczas odczytu stanu
  sesji.
- Używaj `patchSessionEntry(...)` lub `upsertSessionEntry(...)` podczas zapisu stanu
  sesji.
- Unikaj ładowania, modyfikowania i zapisywania całego obiektu magazynu sesji.
- Zachowaj `loadSessionStore(...)` tylko wtedy, gdy deklarowany zakres zgodności
  nadal obsługuje starsze wersje OpenClaw, które go wymagają.
- Zobacz [API środowiska uruchomieniowego](/pl/plugins/sdk-runtime#agent-session-state) i
  [podścieżki SDK Plugin](/pl/plugins/sdk-subpaths).
- Uruchom ponownie `clawhub package validate <path-to-plugin>`.

### sdk-session-store-write

Plugin nadal używa przestarzałego pomocnika zapisu całego magazynu sesji, takiego jak
`saveSessionStore` lub `updateSessionStore`.

- Używaj `patchSessionEntry(...)` podczas aktualizowania pól w istniejącym wpisie
  sesji.
- Używaj `upsertSessionEntry(...)` podczas zastępowania lub tworzenia wpisu sesji.
- Unikaj ładowania, modyfikowania i zapisywania całego obiektu magazynu sesji.
- Zachowaj pomocniki zapisu całego magazynu tylko wtedy, gdy deklarowany zakres zgodności
  nadal obsługuje starsze wersje OpenClaw, które ich wymagają.
- Zobacz [API środowiska uruchomieniowego](/pl/plugins/sdk-runtime#agent-session-state) i
  [podścieżki SDK Plugin](/pl/plugins/sdk-subpaths).
- Uruchom ponownie `clawhub package validate <path-to-plugin>`.

### sdk-session-file-helper

Plugin nadal używa przestarzałych pomocników ścieżek plików sesji, takich jak
`resolveSessionFilePath` lub `resolveAndPersistSessionFile`.

- Użyj `getSessionEntry(...)`, aby odczytać metadane sesji według agenta i tożsamości
  sesji.
- Użyj `patchSessionEntry(...)` lub `upsertSessionEntry(...)`, aby utrwalić metadane
  sesji.
- Użyj tożsamości transkrypcji lub pomocników celu, gdy kod przygotowuje operację
  transkrypcji.
- Nie utrwalaj ani nie polegaj na starszych ścieżkach plików transkrypcji.
- Zobacz [API środowiska uruchomieniowego](/pl/plugins/sdk-runtime#agent-session-state) i
  [podścieżki SDK Plugin](/pl/plugins/sdk-subpaths).
- Uruchom ponownie `clawhub package validate <path-to-plugin>`.

### sdk-session-transcript-file-target

Plugin nadal używa przestarzałego pomocnika celu pliku transkrypcji
`resolveSessionTranscriptLegacyFileTarget`.

- Użyj `resolveSessionTranscriptIdentity(...)`, gdy kod potrzebuje tylko publicznej
  tożsamości sesji.
- Użyj `resolveSessionTranscriptTarget(...)`, gdy kod potrzebuje ustrukturyzowanego
  celu operacji transkrypcji.
- Unikaj bezpośredniego odczytywania lub konstruowania starszych celów plików transkrypcji.
- Zachowaj starszy pomocnik tylko wtedy, gdy deklarowany zakres zgodności nadal
  obsługuje starsze wersje OpenClaw, które go wymagają.
- Zobacz [API środowiska uruchomieniowego](/pl/plugins/sdk-runtime#agent-session-state) i
  [podścieżki SDK Plugin](/pl/plugins/sdk-subpaths).
- Uruchom ponownie `clawhub package validate <path-to-plugin>`.

### sdk-session-transcript-low-level

Plugin nadal używa przestarzałych niskopoziomowych pomocników transkrypcji, takich jak
`appendSessionTranscriptMessage` lub `emitSessionTranscriptUpdate`.

- Używaj `appendSessionTranscriptMessageByIdentity(...)` do dołączania transkrypcji.
- Używaj `publishSessionTranscriptUpdateByIdentity(...)` do powiadomień o aktualizacji
  transkrypcji.
- Preferuj ustrukturyzowaną powierzchnię środowiska uruchomieniowego transkrypcji, aby OpenClaw mógł stosować
  poprawne granice transakcji i obsługę tożsamości.
- Zachowaj niskopoziomowe pomocniki transkrypcji tylko wtedy, gdy deklarowany zakres zgodności
  nadal obsługuje starsze wersje OpenClaw, które ich wymagają.
- Zobacz [API środowiska uruchomieniowego](/pl/plugins/sdk-runtime#agent-session-state) i
  [podścieżki SDK Plugin](/pl/plugins/sdk-subpaths).
- Uruchom ponownie `clawhub package validate <path-to-plugin>`.

### legacy-before-agent-start

Plugin nadal używa starszego haka `before_agent_start`.

- Przenieś pracę nad nadpisaniem modelu lub dostawcy do `before_model_resolve`.
- Przenieś pracę nad modyfikacją promptu lub kontekstu do `before_prompt_build`.
- Zachowaj `before_agent_start` tylko wtedy, gdy deklarowany zakres zgodności nadal
  obsługuje starsze wersje OpenClaw, które go wymagają.
- Zobacz [haki](/pl/plugins/hooks) i
  [zgodność Plugin](/pl/plugins/compatibility).
- Uruchom ponownie `clawhub package validate <path-to-plugin>`.

### provider-auth-env-vars

Manifest nadal używa starszych metadanych uwierzytelniania dostawcy `providerAuthEnvVars`.

- Odzwierciedl metadane zmiennych środowiskowych dostawcy w `setup.providers[].envVars`.
- Zachowaj `providerAuthEnvVars` tylko jako metadane zgodności, dopóki obsługiwany
  zakres OpenClaw nadal ich potrzebuje.
- Zobacz [referencję setup](/pl/plugins/manifest#setup-reference) i
  [migrację SDK](/pl/plugins/sdk-migration).
- Uruchom ponownie `clawhub package validate <path-to-plugin>`.

### channel-env-vars

Manifest używa starszych lub dawnych metadanych zmiennych środowiskowych kanału bez bieżących
metadanych setup lub konfiguracji, których oczekuje ClawHub.

- Utrzymuj metadane zmiennych środowiskowych kanału jako deklaratywne, aby OpenClaw mógł sprawdzać status setup
  bez ładowania środowiska uruchomieniowego kanału.
- Odzwierciedl setup kanału sterowany zmiennymi środowiskowymi w bieżących metadanych setup, konfiguracji kanału lub
  metadanych kanału pakietu używanych przez kształt Twojego Plugin.
- Zachowaj `channelEnvVars` tylko jako metadane zgodności, dopóki starsze obsługiwane
  wersje OpenClaw nadal ich wymagają.
- Zobacz [Manifest Plugin](/pl/plugins/manifest) i
  [Plugin kanałów](/pl/plugins/sdk-channel-plugins).
- Uruchom ponownie `clawhub package validate <path-to-plugin>`.

## Manifest bezpieczeństwa

### security-manifest-schema-unavailable

Pakiet dostarcza `openclaw.security.json` z odniesieniem do schematu, którego ClawHub
nie rozpoznaje jako dostępnego.

- Usuń URL schematu, jeśli ma charakter wyłącznie doradczy.
- Użyj udokumentowanego wersjonowanego schematu dopiero po opublikowaniu go przez OpenClaw.
- Uruchom ponownie `clawhub package validate <path-to-plugin>`.

### unrecognized-security-manifest

Pakiet dostarcza nieobsługiwany plik manifestu bezpieczeństwa.

- Usuń `openclaw.security.json`, dopóki OpenClaw nie udokumentuje wersjonowanego schematu manifestu bezpieczeństwa
  i zachowania ClawHub.
- Zachowaj zachowania wrażliwe na bezpieczeństwo udokumentowane w publicznej dokumentacji pakietu lub
  README, dopóki kontrakt manifestu nie będzie istnieć.
- Uruchom ponownie `clawhub package validate <path-to-plugin>`.

## Powiązane

- [CLI ClawHub](/pl/clawhub/cli)
- [Publikowanie ClawHub](/pl/clawhub/publishing)
- [Budowanie Plugin](/pl/plugins/building-plugins)
- [Manifest Plugin](/pl/plugins/manifest)
- [Punkty wejścia Plugin](/pl/plugins/sdk-entrypoints)
- [Zgodność Plugin](/pl/plugins/compatibility)
