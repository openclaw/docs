---
read_when:
    - Utrzymujesz plugin OpenClaw
    - Widzisz ostrzeżenie o zgodności pluginu
    - Planujesz migrację SDK pluginu lub manifestu
summary: Kontrakty zgodności Plugin, metadane wycofania i oczekiwania dotyczące migracji
title: Zgodność Plugin
x-i18n:
    generated_at: "2026-05-11T20:35:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1afd37697f55721ca8419256a6e8187c398d4b20fb11a65776b755050dd5368b
    source_path: plugins/compatibility.md
    workflow: 16
---

OpenClaw utrzymuje starsze kontrakty pluginów podłączone przez nazwane adaptery zgodności przed ich usunięciem. Chroni to istniejące pluginy wbudowane i zewnętrzne, gdy kontrakty SDK, manifestu, konfiguracji, configu i środowiska uruchomieniowego agenta ewoluują.

## Rejestr zgodności

Kontrakty zgodności pluginów są śledzone w głównym rejestrze pod adresem
`src/plugins/compat/registry.ts`.

Każdy rekord ma:

- stabilny kod zgodności
- status: `active`, `deprecated`, `removal-pending` albo `removed`
- właściciela: SDK, config, konfigurację, kanał, dostawcę, wykonywanie pluginu, środowisko uruchomieniowe agenta
  albo core
- daty wprowadzenia i wycofania, gdy mają zastosowanie
- wskazówki dotyczące zamiennika
- dokumentację, diagnostykę i testy obejmujące stare i nowe zachowanie

Rejestr jest źródłem do planowania utrzymania i przyszłych kontroli inspektora pluginów. Jeśli zachowanie widoczne dla pluginu się zmienia, dodaj lub zaktualizuj rekord zgodności w tej samej zmianie, która dodaje adapter.

Zgodność napraw i migracji Doctor jest śledzona osobno pod adresem
`src/commands/doctor/shared/deprecation-compat.ts`. Te rekordy obejmują stare kształty configu, układy rejestru instalacji i podkładki naprawcze, które mogą wymagać dalszej dostępności po usunięciu ścieżki zgodności środowiska uruchomieniowego.

Przeglądy wydaniowe powinny sprawdzać oba rejestry. Nie usuwaj migracji Doctor tylko dlatego, że odpowiadający jej rekord zgodności środowiska uruchomieniowego lub configu wygasł; najpierw zweryfikuj, czy nie istnieje obsługiwana ścieżka aktualizacji, która nadal wymaga naprawy. Ponownie zweryfikuj też każdą adnotację zamiennika podczas planowania wydania, ponieważ własność pluginów i ślad configu mogą się zmieniać, gdy dostawcy i kanały są przenoszone poza core.

## Pakiet inspektora pluginów

Inspektor pluginów powinien żyć poza głównym repozytorium OpenClaw jako osobny pakiet/repozytorium oparte na wersjonowanych kontraktach zgodności i manifestu.

CLI pierwszego dnia powinno wyglądać tak:

```sh
openclaw-plugin-inspector ./my-plugin
```

Powinno emitować:

- walidację manifestu/schematu
- sprawdzaną wersję zgodności kontraktu
- kontrole metadanych instalacji/źródła
- kontrole importów ścieżki zimnej
- ostrzeżenia o wycofaniu i zgodności

Użyj `--json`, aby uzyskać stabilne dane wyjściowe czytelne maszynowo w adnotacjach CI. Core OpenClaw powinien udostępniać kontrakty i fixtures, z których inspektor może korzystać, ale nie powinien publikować binarium inspektora z głównego pakietu `openclaw`.

### Ścieżka akceptacji utrzymujących

Użyj wspieranego przez Crabbox Blacksmith Testbox dla ścieżki akceptacji instalowalnego pakietu podczas walidowania zewnętrznego inspektora względem pakietów pluginów OpenClaw. Uruchom ją z czystego checkoutu OpenClaw po zbudowaniu pakietu:

```sh
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "pnpm install && pnpm build && npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/telegram --json"
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/discord --json"
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- <clawhub-plugin-dir> --json"
```

Pozostaw tę ścieżkę jako opcjonalną dla utrzymujących, ponieważ instaluje zewnętrzny pakiet npm i może sprawdzać pakiety pluginów sklonowane poza repozytorium. Lokalne zabezpieczenia repozytorium obejmują mapę eksportów SDK, metadane rejestru zgodności, wygaszanie wycofanych importów SDK i granice importów wbudowanych rozszerzeń; dowód inspektora z Testbox obejmuje pakiet tak, jak korzystają z niego autorzy zewnętrznych pluginów.

## Zasady wycofywania

OpenClaw nie powinien usuwać udokumentowanego kontraktu pluginu w tym samym wydaniu, które wprowadza jego zamiennik.

Sekwencja migracji jest następująca:

1. Dodaj nowy kontrakt.
2. Zachowaj stare zachowanie podłączone przez nazwany adapter zgodności.
3. Emituj diagnostykę lub ostrzeżenia, gdy autorzy pluginów mogą podjąć działanie.
4. Udokumentuj zamiennik i harmonogram.
5. Przetestuj stare i nowe ścieżki.
6. Odczekaj ogłoszone okno migracji.
7. Usuń tylko po jawnej zgodzie na wydanie z niekompatybilnymi zmianami.

Wycofane rekordy muszą zawierać datę rozpoczęcia ostrzegania, zamiennik, link do dokumentacji i ostateczną datę usunięcia nie późniejszą niż trzy miesiące po rozpoczęciu ostrzegania. Nie dodawaj wycofanej ścieżki zgodności z otwartym oknem usunięcia, chyba że utrzymujący jawnie zdecydują, że jest to trwała zgodność, i zamiast tego oznaczą ją jako `active`.

## Obecne obszary zgodności

Obecne rekordy zgodności obejmują:

- stare szerokie importy SDK, takie jak `openclaw/plugin-sdk/compat`
- stare kształty pluginów tylko z hookami oraz `before_agent_start`
- stare punkty wejścia pluginów `activate(api)`, gdy pluginy migrują do
  `register(api)`
- stare aliasy SDK, takie jak `openclaw/extension-api`,
  `openclaw/plugin-sdk/channel-runtime`, kreatory statusu `openclaw/plugin-sdk/command-auth`,
  `openclaw/plugin-sdk/test-utils` (zastąpione przez wyspecjalizowane podścieżki testowe
  `openclaw/plugin-sdk/*`) oraz aliasy typów `ClawdbotConfig` /
  `OpenClawSchemaType`
- listę dozwolonych wbudowanych pluginów i zachowanie włączania
- stare metadane manifestu zmiennych środowiskowych dostawcy/kanału
- stare hooki pluginów dostawców i aliasy typów, gdy dostawcy przechodzą na
  jawne hooki katalogu, uwierzytelniania, thinking, replay i transportu
- stare aliasy środowiska uruchomieniowego, takie jak `api.runtime.taskFlow`,
  `api.runtime.subagent.getSession`, `api.runtime.stt` oraz wycofane
  `api.runtime.config.loadConfig()` / `api.runtime.config.writeConfigFile(...)`
- stary podzielony zapis pluginu pamięci, gdy pluginy pamięci przechodzą na
  `registerMemoryCapability`
- stare helpery SDK kanału dla natywnych schematów wiadomości, bramkowania wzmianek,
  formatowania koperty przychodzącej i zagnieżdżania capability zatwierdzania
- stary klucz trasy kanału i aliasy helperów porównywalnego celu, gdy pluginy
  przechodzą na `openclaw/plugin-sdk/channel-route`
- wskazówki aktywacji zastępowane własnością udziałów manifestu
- awaryjny runtime `setup-api`, gdy deskryptory konfiguracji przechodzą na zimne
  metadane `setup.requiresRuntime: false`
- hooki `discovery` dostawcy, gdy hooki katalogu dostawcy przechodzą na
  `catalog.run(...)`
- metadane kanału `showConfigured` / `showInSetup`, gdy pakiety kanałów przechodzą
  na `openclaw.channel.exposure`
- stare klucze configu polityki środowiska uruchomieniowego, gdy Doctor migruje operatorów do
  `agentRuntime`
- awaryjne wygenerowane metadane configu wbudowanych kanałów, gdy lądują metadane `channelConfigs` oparte najpierw na rejestrze
- utrwalone flagi środowiskowe wyłączenia rejestru pluginów i migracji instalacji, gdy
  przepływy napraw migrują operatorów do `openclaw plugins registry --refresh` i
  `openclaw doctor --fix`
- stare ścieżki configu wyszukiwania w sieci, pobierania z sieci i x_search należące do pluginów, gdy
  Doctor migruje je do `plugins.entries.<plugin>.config`
- stary autorski config `plugins.installs` i aliasy ścieżki ładowania wbudowanych pluginów, gdy metadane instalacji przechodzą do zarządzanego stanem rejestru pluginów

Nowy kod pluginu powinien preferować zamiennik wymieniony w rejestrze i w konkretnym przewodniku migracji. Istniejące pluginy mogą nadal używać ścieżki zgodności, dopóki dokumentacja, diagnostyka i informacje o wydaniu nie ogłoszą okna usunięcia.

## Informacje o wydaniu

Informacje o wydaniu powinny zawierać nadchodzące wycofania pluginów z docelowymi datami i linkami do dokumentacji migracji. To ostrzeżenie musi nastąpić, zanim ścieżka zgodności przejdzie do `removal-pending` albo `removed`.
