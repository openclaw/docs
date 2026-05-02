---
read_when:
    - Utrzymujesz Plugin OpenClaw
    - Widzisz ostrzeżenie dotyczące zgodności Plugin
    - Planujesz migrację Plugin SDK lub manifestu
summary: Kontrakty zgodności Plugin, metadane wycofywania i oczekiwania dotyczące migracji
title: Zgodność Plugin
x-i18n:
    generated_at: "2026-05-02T09:56:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: eecf94743cf34c5b773bfa8066164f90b7c8a75667c43f3f1002d32ec1d04902
    source_path: plugins/compatibility.md
    workflow: 16
---

OpenClaw utrzymuje starsze kontrakty pluginów podłączone przez nazwane adaptery zgodności przed ich usunięciem. Chroni to istniejące wbudowane i zewnętrzne pluginy, podczas gdy kontrakty SDK, manifestu, konfiguracji początkowej, konfiguracji i środowiska uruchomieniowego agenta ewoluują.

## Rejestr zgodności

Kontrakty zgodności pluginów są śledzone w głównym rejestrze w
`src/plugins/compat/registry.ts`.

Każdy rekord zawiera:

- stabilny kod zgodności
- status: `active`, `deprecated`, `removal-pending` albo `removed`
- właściciela: SDK, konfiguracja, konfiguracja początkowa, kanał, dostawca, wykonywanie pluginu, środowisko uruchomieniowe agenta
  albo core
- daty wprowadzenia i wycofania, gdy mają zastosowanie
- wskazówki dotyczące zamiennika
- dokumentację, diagnostykę i testy obejmujące stare i nowe zachowanie

Rejestr jest źródłem do planowania przez maintainerów i przyszłych kontroli inspektora pluginów. Jeśli zachowanie widoczne dla pluginów się zmienia, dodaj lub zaktualizuj rekord zgodności w tej samej zmianie, która dodaje adapter.

Zgodność napraw Doctor i migracji jest śledzona osobno w
`src/commands/doctor/shared/deprecation-compat.ts`. Te rekordy obejmują stare kształty konfiguracji, układy rejestru instalacji i warstwy naprawcze, które mogą musieć pozostać dostępne po usunięciu ścieżki zgodności środowiska uruchomieniowego.

Przeglądy wydania powinny sprawdzać oba rejestry. Nie usuwaj migracji Doctor tylko dlatego, że pasujący rekord zgodności środowiska uruchomieniowego lub konfiguracji wygasł; najpierw sprawdź, czy nie istnieje obsługiwana ścieżka aktualizacji, która nadal wymaga naprawy. Ponownie zweryfikuj też każdą adnotację zamiennika podczas planowania wydania, ponieważ własność pluginów i zakres konfiguracji mogą się zmieniać, gdy dostawcy i kanały są przenoszeni poza core.

## Pakiet inspektora pluginów

Inspektor pluginów powinien istnieć poza głównym repozytorium OpenClaw jako osobny pakiet/repozytorium oparte na wersjonowanych kontraktach zgodności i manifestu.

CLI pierwszego dnia powinno mieć postać:

```sh
openclaw-plugin-inspector ./my-plugin
```

Powinno emitować:

- walidację manifestu/schematu
- wersję zgodności kontraktu, która jest sprawdzana
- kontrole metadanych instalacji/źródła
- kontrole importu zimnej ścieżki
- ostrzeżenia o wycofaniu i zgodności

Użyj `--json`, aby uzyskać stabilne dane wyjściowe czytelne maszynowo w adnotacjach CI. Core OpenClaw powinien udostępniać kontrakty i fikstury, których inspektor może używać, ale nie powinien publikować binarnego inspektora z głównego pakietu `openclaw`.

### Ścieżka akceptacyjna maintainerów

Użyj Blacksmith Testbox dla ścieżki akceptacyjnej instalowalnego pakietu podczas walidowania zewnętrznego inspektora względem pakietów pluginów OpenClaw. Uruchom ją z czystego checkoutu OpenClaw po zbudowaniu pakietu:

```sh
blacksmith testbox warmup ci-check-testbox.yml --ref main --idle-timeout 90
blacksmith testbox run --id <tbx_id> "pnpm install && pnpm build && npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/telegram --json"
blacksmith testbox run --id <tbx_id> "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/discord --json"
blacksmith testbox run --id <tbx_id> "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- <clawhub-plugin-dir> --json"
blacksmith testbox stop <tbx_id>
```

Ta ścieżka powinna pozostać opcjonalna dla maintainerów, ponieważ instaluje zewnętrzny pakiet npm i może inspektować pakiety pluginów sklonowane poza repozytorium. Lokalne zabezpieczenia repozytorium obejmują mapę eksportów SDK, metadane rejestru zgodności, redukcję wycofanych importów SDK i granice importów wbudowanych rozszerzeń; dowód z inspektora w Testbox obejmuje pakiet tak, jak używają go autorzy zewnętrznych pluginów.

## Zasady wycofywania

OpenClaw nie powinien usuwać udokumentowanego kontraktu pluginu w tym samym wydaniu, które wprowadza jego zamiennik.

Sekwencja migracji wygląda tak:

1. Dodaj nowy kontrakt.
2. Zachowaj stare zachowanie podłączone przez nazwany adapter zgodności.
3. Emituj diagnostykę lub ostrzeżenia, gdy autorzy pluginów mogą podjąć działanie.
4. Udokumentuj zamiennik i harmonogram.
5. Przetestuj zarówno starą, jak i nową ścieżkę.
6. Odczekaj ogłoszone okno migracji.
7. Usuń tylko z wyraźną zgodą na wydanie z breaking changes.

Wycofane rekordy muszą zawierać datę rozpoczęcia ostrzeżeń, zamiennik, link do dokumentacji i ostateczną datę usunięcia nie później niż trzy miesiące po rozpoczęciu ostrzegania. Nie dodawaj wycofanej ścieżki zgodności z bezterminowym oknem usunięcia, chyba że maintainerzy wyraźnie zdecydują, że jest to trwała zgodność, i zamiast tego oznaczą ją jako `active`.

## Obecne obszary zgodności

Obecne rekordy zgodności obejmują:

- starsze szerokie importy SDK, takie jak `openclaw/plugin-sdk/compat`
- starsze kształty pluginów oparte wyłącznie na hookach oraz `before_agent_start`
- starsze punkty wejścia pluginów `activate(api)`, podczas gdy pluginy migrują do
  `register(api)`
- starsze aliasy SDK, takie jak `openclaw/extension-api`,
  `openclaw/plugin-sdk/channel-runtime`, kreatory statusu `openclaw/plugin-sdk/command-auth`,
  `openclaw/plugin-sdk/test-utils` (zastąpione przez ukierunkowane
  podścieżki testowe `openclaw/plugin-sdk/*`) oraz aliasy typów `ClawdbotConfig` /
  `OpenClawSchemaType`
- listę dozwolonych wbudowanych pluginów i zachowanie włączania
- starsze metadane manifestu zmiennych środowiskowych dostawcy/kanału
- starsze hooki pluginów dostawców i aliasy typów, podczas gdy dostawcy przechodzą na
  jawne hooki katalogu, uwierzytelniania, myślenia, odtwarzania i transportu
- starsze aliasy środowiska uruchomieniowego, takie jak `api.runtime.taskFlow`,
  `api.runtime.subagent.getSession`, `api.runtime.stt` oraz wycofane
  `api.runtime.config.loadConfig()` / `api.runtime.config.writeConfigFile(...)`
- starszą podzieloną rejestrację pluginów pamięci, podczas gdy pluginy pamięci przechodzą na
  `registerMemoryCapability`
- starsze pomocniki SDK kanału dla natywnych schematów wiadomości, bramkowania wzmianek,
  formatowania przychodzących kopert i zagnieżdżania zdolności zatwierdzania
- starszy klucz trasy kanału i aliasy pomocników porównywalnego celu, podczas gdy pluginy
  przechodzą na `openclaw/plugin-sdk/channel-route`
- wskazówki aktywacji, które są zastępowane własnością wkładów w manifeście
- awaryjną ścieżkę środowiska uruchomieniowego `setup-api`, podczas gdy deskryptory konfiguracji początkowej przechodzą na zimne
  metadane `setup.requiresRuntime: false`
- hooki `discovery` dostawców, podczas gdy hooki katalogu dostawcy przechodzą na
  `catalog.run(...)`
- metadane kanału `showConfigured` / `showInSetup`, podczas gdy pakiety kanałów przechodzą na
  `openclaw.channel.exposure`
- starsze klucze konfiguracji zasad środowiska uruchomieniowego, podczas gdy Doctor migruje operatorów do
  `agentRuntime`
- awaryjną ścieżkę generowanych metadanych konfiguracji wbudowanych kanałów, podczas gdy trafiają metadane
  `channelConfigs` oparte najpierw na rejestrze
- utrwalone flagi środowiskowe wyłączenia rejestru pluginów i migracji instalacji, podczas gdy
  przepływy napraw migrują operatorów do `openclaw plugins registry --refresh` i
  `openclaw doctor --fix`
- starsze ścieżki konfiguracji wyszukiwania w sieci, pobierania z sieci i x_search należące do pluginów, podczas gdy
  Doctor migruje je do `plugins.entries.<plugin>.config`
- starszą autorską konfigurację `plugins.installs` i aliasy ścieżki ładowania wbudowanych pluginów,
  podczas gdy metadane instalacji przenoszą się do zarządzanego stanem rejestru pluginów

Nowy kod pluginów powinien preferować zamiennik wskazany w rejestrze i w konkretnym przewodniku migracji. Istniejące pluginy mogą nadal używać ścieżki zgodności, dopóki dokumentacja, diagnostyka i informacje o wydaniu nie ogłoszą okna usunięcia.

## Informacje o wydaniu

Informacje o wydaniu powinny zawierać nadchodzące wycofania pluginów wraz z docelowymi datami i linkami do dokumentacji migracji. Takie ostrzeżenie musi nastąpić, zanim ścieżka zgodności przejdzie do `removal-pending` albo `removed`.
