---
read_when:
    - Uruchomiono clawhub package validate i trzeba naprawić ustalenia dotyczące Plugin
    - ClawHub odrzucił lub ostrzegł przy publikacji pakietu pluginu
    - Aktualizujesz metadane pakietu pluginu przed wydaniem
summary: Napraw ustalenia walidacji pakietu pluginu ClawHub przed publikacją
title: Poprawki w walidacji Plugin
x-i18n:
    generated_at: "2026-06-28T07:42:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0c50f57c8feb79c7ff304ad1c8e115b362795621d7cd4f85f435c44cc75308b9
    source_path: clawhub/plugin-validation-fixes.md
    workflow: 16
---

# Poprawki walidacji Plugin

ClawHub weryfikuje pakiety pluginów przed publikacją i może także pokazywać ustalenia z
automatycznych skanów pakietów. Ta strona omawia ustalenia przeznaczone dla autorów, czyli
ustalenia, które autor pluginu może naprawić w metadanych pakietu, manifeście, importach SDK
lub opublikowanym artefakcie.

Nie obejmuje wewnętrznych ustaleń pokrycia Plugin Inspector. Jeśli pełny raport
zawiera kody utrzymania skanera bez wskazówek dotyczących działań naprawczych dla autora, są one
przeznaczone dla maintainerów OpenClaw, a nie dla autorów pluginów.

Po zastosowaniu dowolnej poprawki uruchom ponownie:

```bash
clawhub package validate <path-to-plugin>
```

## Ustalenia przeznaczone dla autorów

| Kod                                     | Zacznij tutaj                                                                                                               |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `package-json-missing`                  | [Dodaj metadane pakietu](/pl/clawhub/plugin-validation-fixes#package-json-missing)                                             |
| `package-openclaw-metadata-missing`     | [Dodaj blok openclaw pakietu](/pl/clawhub/plugin-validation-fixes#package-openclaw-metadata-missing)                           |
| `package-openclaw-entry-missing`        | [Zadeklaruj punkty wejścia pakietu OpenClaw](/pl/clawhub/plugin-validation-fixes#package-openclaw-entry-missing)               |
| `package-entrypoint-missing`            | [Opublikuj zadeklarowany punkt wejścia](/pl/clawhub/plugin-validation-fixes#package-entrypoint-missing)                        |
| `package-install-metadata-incomplete`   | [Uzupełnij metadane instalacji](/pl/clawhub/plugin-validation-fixes#package-install-metadata-incomplete)                       |
| `package-plugin-api-compat-missing`     | [Zadeklaruj zgodność API pluginu](/pl/clawhub/plugin-validation-fixes#package-plugin-api-compat-missing)                       |
| `package-min-host-version-drift`        | [Wyrównaj minimalną wersję hosta](/pl/clawhub/plugin-validation-fixes#package-min-host-version-drift)                          |
| `package-manifest-version-drift`        | [Wyrównaj wersje pakietu i manifestu](/pl/clawhub/plugin-validation-fixes#package-manifest-version-drift)                      |
| `package-openclaw-unsupported-metadata` | [Usuń nieobsługiwane metadane pakietu OpenClaw](/pl/clawhub/plugin-validation-fixes#package-openclaw-unsupported-metadata)     |
| `package-npm-pack-unavailable`          | [Spraw, aby artefakt npm dało się spakować](/pl/clawhub/plugin-validation-fixes#package-npm-pack-unavailable)                  |
| `package-npm-pack-entrypoint-missing`   | [Uwzględnij punkty wejścia w wyniku npm pack](/pl/clawhub/plugin-validation-fixes#package-npm-pack-entrypoint-missing)         |
| `package-npm-pack-metadata-missing`     | [Uwzględnij metadane w wyniku npm pack](/pl/clawhub/plugin-validation-fixes#package-npm-pack-metadata-missing)                 |
| `manifest-name-missing`                 | [Dodaj nazwę wyświetlaną manifestu](/pl/clawhub/plugin-validation-fixes#manifest-name-missing)                                 |
| `manifest-unknown-fields`               | [Usuń nieobsługiwane pola manifestu](/pl/clawhub/plugin-validation-fixes#manifest-unknown-fields)                              |
| `manifest-unknown-contracts`            | [Usuń nieobsługiwane klucze kontraktów](/pl/clawhub/plugin-validation-fixes#manifest-unknown-contracts)                        |
| `legacy-root-sdk-import`                | [Zastąp importy główne SDK](/pl/clawhub/plugin-validation-fixes#legacy-root-sdk-import)                                        |
| `reserved-sdk-import`                   | [Usuń zarezerwowane importy SDK](/pl/clawhub/plugin-validation-fixes#reserved-sdk-import)                                      |
| `sdk-load-session-store`                | [Zastąp dostęp do całego magazynu sesji](/pl/clawhub/plugin-validation-fixes#sdk-load-session-store)                           |
| `legacy-before-agent-start`             | [Zastąp before_agent_start](/pl/clawhub/plugin-validation-fixes#legacy-before-agent-start)                                     |
| `provider-auth-env-vars`                | [Przenieś zmienne środowiskowe dostawcy do metadanych konfiguracji](/pl/clawhub/plugin-validation-fixes#provider-auth-env-vars) |
| `channel-env-vars`                      | [Odzwierciedl zmienne środowiskowe kanału w bieżących metadanych](/pl/clawhub/plugin-validation-fixes#channel-env-vars)        |
| `security-manifest-schema-unavailable`  | [Usuń niedostępne odwołania do schematu manifestu zabezpieczeń](/pl/clawhub/plugin-validation-fixes#security-manifest-schema-unavailable) |
| `unrecognized-security-manifest`        | [Usuń nieobsługiwane pliki manifestu zabezpieczeń](/pl/clawhub/plugin-validation-fixes#unrecognized-security-manifest)         |

## Metadane pakietu

### package-json-missing

Katalog główny pakietu nie zawiera `package.json`, więc ClawHub nie może zidentyfikować
pakietu npm, wersji, punktów wejścia ani metadanych OpenClaw.

- Dodaj `package.json` z `name`, `version` i `type`.
- Dodaj blok `openclaw`, gdy pakiet dostarcza plugin OpenClaw.
- Skorzystaj z [Budowania pluginów](/pl/plugins/building-plugins), aby zobaczyć minimalny przykład pakietu,
  oraz z [Manifestu pluginu](/pl/plugins/manifest#manifest-versus-packagejson),
  aby zrozumieć podział między pakietem a manifestem.
- Uruchom ponownie `clawhub package validate <path-to-plugin>`.

### package-openclaw-metadata-missing

Pakiet ma `package.json`, ale nie deklaruje metadanych pakietu OpenClaw.

- Dodaj `package.json#openclaw`.
- Uwzględnij metadane punktów wejścia, takie jak `openclaw.extensions` lub
  `openclaw.runtimeExtensions`.
- Dodaj metadane zgodności i instalacji, gdy pakiet będzie publikowany lub
  instalowany przez ClawHub.
- Zobacz [Pola package.json wpływające na wykrywanie](/pl/plugins/manifest#packagejson-fields-that-affect-discovery).
- Uruchom ponownie `clawhub package validate <path-to-plugin>`.

### package-openclaw-entry-missing

Metadane pakietu istnieją, ale nie deklarują punktu wejścia środowiska uruchomieniowego OpenClaw.

- Dodaj `openclaw.extensions` dla natywnych punktów wejścia pluginu.
- Dodaj `openclaw.runtimeExtensions`, gdy opublikowany pakiet powinien ładować zbudowany
  JavaScript.
- Zachowaj wszystkie ścieżki punktów wejścia wewnątrz katalogu pakietu.
- Zobacz [Punkty wejścia pluginu](/pl/plugins/sdk-entrypoints) i
  [Pola package.json wpływające na wykrywanie](/pl/plugins/manifest#packagejson-fields-that-affect-discovery).
- Uruchom ponownie `clawhub package validate <path-to-plugin>`.

### package-entrypoint-missing

Pakiet deklaruje punkt wejścia OpenClaw, ale wskazanego pliku brakuje
w walidowanym pakiecie.

- Sprawdź każdą ścieżkę w `openclaw.extensions`, `openclaw.runtimeExtensions`,
  `openclaw.setupEntry` i `openclaw.runtimeSetupEntry`.
- Zbuduj pakiet, jeśli punkt wejścia jest generowany do `dist`.
- Zaktualizuj metadane, jeśli punkt wejścia został przeniesiony.
- Zobacz [Punkty wejścia pluginu](/pl/plugins/sdk-entrypoints).
- Uruchom ponownie `clawhub package validate <path-to-plugin>`.

### package-install-metadata-incomplete

ClawHub nie może określić, jak pakiet powinien być instalowany lub aktualizowany.

- Wypełnij `openclaw.install` obsługiwanym źródłem instalacji, takim jak
  `clawhubSpec`, `npmSpec` lub `localPath`.
- Ustaw `openclaw.install.defaultChoice`, gdy dostępne jest więcej niż jedno źródło instalacji.
- Użyj `openclaw.install.minHostVersion` dla minimalnej wersji hosta OpenClaw.
- Zobacz [Pola package.json wpływające na wykrywanie](/pl/plugins/manifest#packagejson-fields-that-affect-discovery).
- Uruchom ponownie `clawhub package validate <path-to-plugin>`.

### package-plugin-api-compat-missing

Pakiet nie deklaruje obsługiwanego zakresu API pluginu OpenClaw.

- Dodaj `openclaw.compat.pluginApi` do `package.json`.
- Użyj wersji API pluginu OpenClaw lub dolnej granicy semver, względem której zbudowano i przetestowano
  pakiet.
- Zachowaj to oddzielnie od wersji pakietu. Wersja pakietu opisuje
  wydanie pluginu; `openclaw.compat.pluginApi` opisuje kontrakt API hosta.
- Zobacz [Pola package.json wpływające na wykrywanie](/pl/plugins/manifest#packagejson-fields-that-affect-discovery).
- Uruchom ponownie `clawhub package validate <path-to-plugin>`.

### package-min-host-version-drift

Minimalna wersja hosta pakietu nie odpowiada metadanym wersji OpenClaw,
względem której pakiet został zbudowany.

- Sprawdź `openclaw.install.minHostVersion`.
- Sprawdź wszelkie metadane kompilacji OpenClaw w pakiecie, takie jak wersja OpenClaw
  użyta podczas wydania.
- Wyrównaj minimalną wersję hosta z zakresem wersji hosta, który pakiet
  faktycznie obsługuje.
- Zobacz [Pola package.json wpływające na wykrywanie](/pl/plugins/manifest#packagejson-fields-that-affect-discovery).
- Uruchom ponownie `clawhub package validate <path-to-plugin>`.

### package-manifest-version-drift

Wersja pakietu i wersja manifestu pluginu są rozbieżne.

- Preferuj `package.json#version` jako wersję wydania pakietu.
- Jeśli `openclaw.plugin.json` także ma `version`, zaktualizuj ją, aby pasowała, lub usuń
  nieaktualne metadane wersji manifestu, gdy metadane pakietu są autorytatywne.
- Opublikuj nową wersję pakietu po zmianie opublikowanych metadanych.
- Zobacz [Manifest pluginu](/pl/plugins/manifest).
- Uruchom ponownie `clawhub package validate <path-to-plugin>`.

### package-openclaw-unsupported-metadata

Blok `package.json#openclaw` zawiera pola, które nie są obsługiwanymi
metadanymi pakietu OpenClaw.

- Usuń nieobsługiwane pola, takie jak `openclaw.bundle`.
- Przechowuj natywne metadane pluginu w `openclaw.plugin.json`.
- Przechowuj punkty wejścia pakietu, zgodność, instalację, konfigurację i metadane katalogu
  w obsługiwanych polach `package.json#openclaw`.
- Zobacz [Pola package.json wpływające na wykrywanie](/pl/plugins/manifest#packagejson-fields-that-affect-discovery).
- Uruchom ponownie `clawhub package validate <path-to-plugin>`.

## Opublikowany artefakt

### package-npm-pack-unavailable

Pakietu nie da się spakować do artefaktu, który ClawHub miałby sprawdzić lub
opublikować.

- Uruchom `npm pack --dry-run` z katalogu głównego pakietu.
- Napraw nieprawidłowe metadane pakietu, uszkodzone skrypty cyklu życia lub wpisy files, które
  powodują niepowodzenie pakowania.
- Usuń `private: true`, jeśli ten pakiet jest przeznaczony do publicznej publikacji.
- Uruchom ponownie `clawhub package validate <path-to-plugin>`.

### package-npm-pack-entrypoint-missing

Pakiet da się spakować, ale spakowany artefakt nie zawiera
plików punktów wejścia zadeklarowanych w `package.json#openclaw`.

- Uruchom `npm pack --dry-run` i sprawdź pliki, które zostałyby uwzględnione.
- Zbuduj generowane punkty wejścia przed pakowaniem.
- Zaktualizuj `files`, `.npmignore` lub wynik kompilacji, aby zadeklarowane punkty wejścia były
  uwzględnione.
- Zobacz [Punkty wejścia pluginu](/pl/plugins/sdk-entrypoints).
- Uruchom ponownie `clawhub package validate <path-to-plugin>`.

### package-npm-pack-metadata-missing

W spakowanym artefakcie brakuje metadanych OpenClaw, które istnieją w źródłowym
pakiecie.

- Uruchom `npm pack --dry-run` i sprawdź uwzględnione pliki metadanych.
- Upewnij się, że `package.json` zawiera blok `openclaw` w spakowanym artefakcie.
- Upewnij się, że `openclaw.plugin.json` jest uwzględniony, gdy pakiet jest natywnym
  pluginem OpenClaw.
- Zaktualizuj `files` lub `.npmignore`, aby metadane pakietu nie były wykluczone.
- Zobacz [Budowanie pluginów](/pl/plugins/building-plugins).
- Uruchom ponownie `clawhub package validate <path-to-plugin>`.

## Metadane manifestu

### manifest-name-missing

Manifest natywnego pluginu nie zawiera nazwy wyświetlanej.

- Dodaj niepuste pole `name` do `openclaw.plugin.json`.
- Zachowaj `name` w formie czytelnej dla człowieka, a `id` jako stabilny identyfikator maszynowy.
- Zobacz [Manifest pluginu](/pl/plugins/manifest).
- Uruchom ponownie `clawhub package validate <path-to-plugin>`.

### manifest-unknown-fields

Manifest pluginu ma pola najwyższego poziomu, których OpenClaw nie obsługuje.

- Porównaj każde pole najwyższego poziomu z
  [odniesieniem pól manifestu](/pl/plugins/manifest#top-level-field-reference).
- Usuń niestandardowe pola z `openclaw.plugin.json`.
- Przenieś metadane pakietu lub instalacji do obsługiwanych pól `package.json#openclaw`
  zamiast do manifestu.
- Uruchom ponownie `clawhub package validate <path-to-plugin>`.

### manifest-unknown-contracts

Manifest deklaruje nieobsługiwane klucze wewnątrz `contracts`.

- Porównaj każdy klucz w `contracts` z
  [odniesieniem kontraktów](/pl/plugins/manifest#contracts-reference).
- Usuń nieobsługiwane klucze kontraktów.
- Przenieś zachowanie runtime do kodu rejestracji pluginu i ogranicz `contracts`
  do statycznych metadanych własności możliwości.
- Uruchom ponownie `clawhub package validate <path-to-plugin>`.

## SDK i migracja zgodności

### legacy-root-sdk-import

Plugin importuje z przestarzałego głównego barrela SDK:
`openclaw/plugin-sdk`.

- Zastąp importy z głównego barrela zawężonymi importami z publicznych podścieżek.
- Użyj `openclaw/plugin-sdk/plugin-entry` dla `definePluginEntry`.
- Użyj `openclaw/plugin-sdk/channel-core` dla helperów punktów wejścia kanałów.
- Użyj [konwencji importu](/pl/plugins/building-plugins#import-conventions) i
  [podścieżek Plugin SDK](/pl/plugins/sdk-subpaths), aby znaleźć zawężony import.
- Uruchom ponownie `clawhub package validate <path-to-plugin>`.

### reserved-sdk-import

Plugin importuje ścieżkę SDK zarezerwowaną dla bundled pluginów lub wewnętrznej
zgodności.

- Zastąp zarezerwowane wewnętrzne importy SDK OpenClaw udokumentowanymi publicznymi
  podścieżkami `openclaw/plugin-sdk/*`.
- Jeśli dane zachowanie nie ma publicznego SDK, zachowaj helper w swoim pakiecie lub
  poproś o publiczne API OpenClaw.
- Użyj [podścieżek Plugin SDK](/pl/plugins/sdk-subpaths) i
  [migracji SDK](/pl/plugins/sdk-migration), aby wybrać obsługiwany import.
- Uruchom ponownie `clawhub package validate <path-to-plugin>`.

### sdk-load-session-store

Plugin nadal używa przestarzałego helpera całego magazynu sesji
`loadSessionStore`.

- Używaj `getSessionEntry(...)` lub `listSessionEntries(...)` przy odczytywaniu
  stanu sesji.
- Używaj `patchSessionEntry(...)` lub `upsertSessionEntry(...)` przy zapisywaniu stanu
  sesji.
- Unikaj ładowania, mutowania i zapisywania całego obiektu magazynu sesji.
- Zachowaj `loadSessionStore(...)` tylko wtedy, gdy zadeklarowany zakres zgodności
  nadal obsługuje starsze wersje OpenClaw, które go wymagają.
- Zobacz [API runtime](/pl/plugins/sdk-runtime#agent-session-state) i
  [podścieżki Plugin SDK](/pl/plugins/sdk-subpaths).
- Uruchom ponownie `clawhub package validate <path-to-plugin>`.

### legacy-before-agent-start

Plugin nadal używa starszego hooka `before_agent_start`.

- Przenieś pracę nad nadpisaniem modelu lub providera do `before_model_resolve`.
- Przenieś pracę nad mutacją promptu lub kontekstu do `before_prompt_build`.
- Zachowaj `before_agent_start` tylko wtedy, gdy zadeklarowany zakres zgodności nadal
  obsługuje starsze wersje OpenClaw, które go wymagają.
- Zobacz [hooki](/pl/plugins/hooks) i
  [zgodność pluginów](/pl/plugins/compatibility).
- Uruchom ponownie `clawhub package validate <path-to-plugin>`.

### provider-auth-env-vars

Manifest nadal używa starszych metadanych uwierzytelniania providera
`providerAuthEnvVars`.

- Odzwierciedl metadane zmiennych środowiskowych providera w `setup.providers[].envVars`.
- Zachowaj `providerAuthEnvVars` tylko jako metadane zgodności, gdy obsługiwany przez Ciebie
  zakres OpenClaw nadal ich potrzebuje.
- Zobacz [odniesienie setupu](/pl/plugins/manifest#setup-reference) i
  [migrację SDK](/pl/plugins/sdk-migration).
- Uruchom ponownie `clawhub package validate <path-to-plugin>`.

### channel-env-vars

Manifest używa starszych lub dawnych metadanych zmiennych środowiskowych kanału bez bieżących
metadanych setupu lub konfiguracji, których oczekuje ClawHub.

- Utrzymuj metadane zmiennych środowiskowych kanału w formie deklaratywnej, aby OpenClaw mógł sprawdzać stan setupu
  bez ładowania runtime kanału.
- Odzwierciedl setup kanału sterowany zmiennymi środowiskowymi w bieżącym setupie, konfiguracji kanału lub
  metadanych kanału pakietu używanych przez kształt Twojego pluginu.
- Zachowaj `channelEnvVars` tylko jako metadane zgodności, gdy starsze obsługiwane
  wersje OpenClaw nadal ich wymagają.
- Zobacz [manifest pluginu](/pl/plugins/manifest) i
  [pluginy kanałów](/pl/plugins/sdk-channel-plugins).
- Uruchom ponownie `clawhub package validate <path-to-plugin>`.

## Manifest bezpieczeństwa

### security-manifest-schema-unavailable

Pakiet dostarcza `openclaw.security.json` z odniesieniem do schematu, którego ClawHub
nie rozpoznaje jako dostępnego.

- Usuń URL schematu, jeśli ma wyłącznie charakter informacyjny.
- Użyj udokumentowanego wersjonowanego schematu dopiero po tym, jak OpenClaw go opublikuje.
- Uruchom ponownie `clawhub package validate <path-to-plugin>`.

### unrecognized-security-manifest

Pakiet dostarcza nieobsługiwany plik manifestu bezpieczeństwa.

- Usuń `openclaw.security.json`, dopóki OpenClaw nie udokumentuje wersjonowanego schematu manifestu bezpieczeństwa
  i zachowania ClawHub.
- Zachowaj zachowanie wrażliwe z punktu widzenia bezpieczeństwa udokumentowane w publicznej dokumentacji pakietu lub
  README, dopóki kontrakt manifestu nie będzie istnieć.
- Uruchom ponownie `clawhub package validate <path-to-plugin>`.

## Powiązane

- [CLI ClawHub](/pl/clawhub/cli)
- [publikowanie ClawHub](/pl/clawhub/publishing)
- [tworzenie pluginów](/pl/plugins/building-plugins)
- [manifest pluginu](/pl/plugins/manifest)
- [punkty wejścia pluginu](/pl/plugins/sdk-entrypoints)
- [zgodność pluginów](/pl/plugins/compatibility)
