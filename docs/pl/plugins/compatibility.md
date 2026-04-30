---
read_when:
    - Utrzymujesz Plugin OpenClaw
    - Widzisz ostrzeżenie o zgodności typu Plugin
    - Planujesz migrację Plugin SDK lub manifestu
summary: Kontrakty zgodności Plugin, metadane wycofania i oczekiwania dotyczące migracji
title: Zgodność Plugin
x-i18n:
    generated_at: "2026-04-30T10:06:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 344dbaac86db7259adc09bc91b7fbe7ba540fc6fdd96cc422918ccf2c34d9cec
    source_path: plugins/compatibility.md
    workflow: 16
---

OpenClaw utrzymuje starsze kontrakty Pluginów podłączone przez nazwane adaptery zgodności przed ich usunięciem. Chroni to istniejące wbudowane i zewnętrzne Pluginy, gdy ewoluują kontrakty SDK, manifestu, konfiguracji początkowej, konfiguracji i środowiska uruchomieniowego agenta.

## Rejestr zgodności

Kontrakty zgodności Pluginów są śledzone w głównym rejestrze pod adresem
`src/plugins/compat/registry.ts`.

Każdy rekord zawiera:

- stabilny kod zgodności
- status: `active`, `deprecated`, `removal-pending` lub `removed`
- właściciela: SDK, konfigurację, konfigurację początkową, kanał, dostawcę, wykonywanie Pluginu, środowisko uruchomieniowe agenta lub core
- daty wprowadzenia i wycofania, jeśli mają zastosowanie
- wskazówki dotyczące zamiennika
- dokumentację, diagnostykę i testy obejmujące stare i nowe zachowanie

Rejestr jest źródłem dla planowania przez maintainerów i przyszłych kontroli inspektora Pluginów. Jeśli zachowanie widoczne dla Pluginów się zmienia, dodaj lub zaktualizuj rekord zgodności w tej samej zmianie, która dodaje adapter.

Zgodność napraw i migracji Doctor jest śledzona osobno w
`src/commands/doctor/shared/deprecation-compat.ts`. Te rekordy obejmują stare kształty konfiguracji, układy dziennika instalacji i warstwy naprawcze, które mogą wymagać dostępności po usunięciu ścieżki zgodności środowiska uruchomieniowego.

Przeglądy wydania powinny sprawdzać oba rejestry. Nie usuwaj migracji Doctor tylko dlatego, że odpowiadający jej rekord zgodności środowiska uruchomieniowego lub konfiguracji wygasł; najpierw zweryfikuj, że nie istnieje obsługiwana ścieżka aktualizacji, która nadal wymaga naprawy. Podczas planowania wydania ponownie zweryfikuj także każdą adnotację zamiennika, ponieważ własność Pluginów i zakres konfiguracji mogą się zmieniać, gdy dostawcy i kanały przenoszą się poza core.

## Pakiet inspektora Pluginów

Inspektor Pluginów powinien żyć poza głównym repozytorium OpenClaw jako osobny pakiet/repozytorium oparte na wersjonowanych kontraktach zgodności i manifestu.

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

Użyj `--json` dla stabilnego, czytelnego maszynowo wyjścia w adnotacjach CI. Core OpenClaw powinno udostępniać kontrakty i fixture’y, z których inspektor może korzystać, ale nie powinno publikować binarium inspektora z głównego pakietu `openclaw`.

### Ścieżka akceptacyjna maintainerów

Używaj Blacksmith Testbox dla ścieżki akceptacji instalowalnego pakietu podczas walidowania zewnętrznego inspektora względem pakietów Pluginów OpenClaw. Uruchom to z czystego checkoutu OpenClaw po zbudowaniu pakietu:

```sh
blacksmith testbox warmup ci-check-testbox.yml --ref main --idle-timeout 90
blacksmith testbox run --id <tbx_id> "pnpm install && pnpm build && npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/telegram --json"
blacksmith testbox run --id <tbx_id> "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/discord --json"
blacksmith testbox run --id <tbx_id> "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- <clawhub-plugin-dir> --json"
blacksmith testbox stop <tbx_id>
```

Ta ścieżka powinna pozostać opcjonalna dla maintainerów, ponieważ instaluje zewnętrzny pakiet npm i może sprawdzać pakiety Pluginów sklonowane poza repozytorium. Lokalne zabezpieczenia repozytorium obejmują mapę eksportów SDK, metadane rejestru zgodności, redukcję wycofanych importów SDK i granice importów wbudowanych rozszerzeń; dowód z inspektora w Testbox obejmuje pakiet tak, jak konsumują go zewnętrzni autorzy Pluginów.

## Zasady wycofywania

OpenClaw nie powinien usuwać udokumentowanego kontraktu Pluginu w tym samym wydaniu, które wprowadza jego zamiennik.

Sekwencja migracji wygląda następująco:

1. Dodaj nowy kontrakt.
2. Utrzymaj stare zachowanie podłączone przez nazwany adapter zgodności.
3. Emituj diagnostykę lub ostrzeżenia, gdy autorzy Pluginów mogą podjąć działanie.
4. Udokumentuj zamiennik i harmonogram.
5. Testuj zarówno stare, jak i nowe ścieżki.
6. Odczekaj ogłoszone okno migracji.
7. Usuwaj tylko za wyraźną zgodą na wydanie z breaking changes.

Wycofane rekordy muszą zawierać datę rozpoczęcia ostrzegania, zamiennik, link do dokumentacji i ostateczną datę usunięcia nie późniejszą niż trzy miesiące od rozpoczęcia ostrzegania. Nie dodawaj wycofanej ścieżki zgodności z otwartym oknem usunięcia, chyba że maintainerzy wyraźnie zdecydują, że jest to trwała zgodność, i oznaczą ją zamiast tego jako `active`.

## Obecne obszary zgodności

Obecne rekordy zgodności obejmują:

- starsze szerokie importy SDK, takie jak `openclaw/plugin-sdk/compat`
- starsze kształty Pluginów oparte wyłącznie na hookach oraz `before_agent_start`
- starsze punkty wejścia Pluginów `activate(api)`, gdy Pluginy migrują do `register(api)`
- starsze aliasy SDK, takie jak `openclaw/extension-api`,
  `openclaw/plugin-sdk/channel-runtime`, konstruktory statusu `openclaw/plugin-sdk/command-auth`,
  `openclaw/plugin-sdk/test-utils` (zastąpione przez ukierunkowane
  podścieżki testowe `openclaw/plugin-sdk/*`) oraz aliasy typów `ClawdbotConfig` /
  `OpenClawSchemaType`
- lista dozwolonych wbudowanych Pluginów i zachowanie włączania
- starsze metadane manifestu zmiennych środowiskowych dostawców/kanałów
- starsze hooki Pluginów dostawców i aliasy typów, gdy dostawcy przechodzą na
  jawne hooki katalogu, uwierzytelniania, myślenia, odtwarzania i transportu
- starsze aliasy środowiska uruchomieniowego, takie jak `api.runtime.taskFlow`,
  `api.runtime.subagent.getSession`, `api.runtime.stt` oraz wycofane
  `api.runtime.config.loadConfig()` / `api.runtime.config.writeConfigFile(...)`
- starsza dzielona rejestracja Pluginów pamięci, gdy Pluginy pamięci przechodzą na
  `registerMemoryCapability`
- starsze pomocniki SDK kanałów dla natywnych schematów wiadomości, bramkowania wzmianek,
  formatowania kopert przychodzących i zagnieżdżania możliwości zatwierdzania
- starszy klucz trasy kanału i aliasy pomocników porównywalnych celów, gdy Pluginy
  przechodzą na `openclaw/plugin-sdk/channel-route`
- wskazówki aktywacji zastępowane przez własność kontrybucji w manifeście
- wycofane niejawne ładowanie bocznych procesów podczas startu dla Pluginów, które nie zadeklarowały
  `activation.onStartup`; maintainerzy mogą testować przyszłe bardziej rygorystyczne zachowanie za pomocą
  `OPENCLAW_DISABLE_LEGACY_IMPLICIT_STARTUP_SIDECARS=1`
- fallback środowiska uruchomieniowego `setup-api`, gdy deskryptory konfiguracji początkowej przechodzą na zimne
  metadane `setup.requiresRuntime: false`
- hooki `discovery` dostawców, gdy hooki katalogu dostawców przechodzą na
  `catalog.run(...)`
- metadane kanału `showConfigured` / `showInSetup`, gdy pakiety kanałów przechodzą na
  `openclaw.channel.exposure`
- starsze klucze konfiguracji polityki środowiska uruchomieniowego, gdy Doctor migruje operatorów do
  `agentRuntime`
- fallback wygenerowanych metadanych konfiguracji wbudowanych kanałów, gdy wprowadzane są metadane `channelConfigs` oparte najpierw na rejestrze
- utrwalone flagi środowiskowe wyłączania rejestru Pluginów i migracji instalacji, gdy
  przepływy naprawcze migrują operatorów do `openclaw plugins registry --refresh` i
  `openclaw doctor --fix`
- starsze ścieżki konfiguracji wyszukiwania w sieci, pobierania z sieci i x_search należące do Pluginu, gdy
  Doctor migruje je do `plugins.entries.<plugin>.config`
- starsza konfiguracja autorska `plugins.installs` i aliasy ścieżki ładowania wbudowanych Pluginów,
  gdy metadane instalacji przechodzą do zarządzanego stanem dziennika Pluginów

Nowy kod Pluginów powinien preferować zamiennik wymieniony w rejestrze i w konkretnym przewodniku migracji. Istniejące Pluginy mogą nadal używać ścieżki zgodności, dopóki dokumentacja, diagnostyka i informacje o wydaniu nie ogłoszą okna usunięcia.

## Informacje o wydaniu

Informacje o wydaniu powinny zawierać nadchodzące wycofania Pluginów wraz z docelowymi datami i linkami do dokumentacji migracji. To ostrzeżenie musi nastąpić, zanim ścieżka zgodności przejdzie do `removal-pending` lub `removed`.
