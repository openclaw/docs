---
doc-schema-version: 1
read_when:
    - Instalowanie lub konfigurowanie pluginów
    - Omówienie reguł wykrywania i ładowania pluginów
    - Praca z pakietami pluginów zgodnymi z Codex/Claude
sidebarTitle: Getting Started
summary: Instalowanie, konfigurowanie i zarządzanie pluginami OpenClaw
title: Pluginy
x-i18n:
    generated_at: "2026-07-16T19:10:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: cd6b19616c14fbbfcec47beca02f206d7a8ca9500c530d06958a30a9e5488bde
    source_path: tools/plugin.md
    workflow: 16
---

Pluginy rozszerzają OpenClaw o kanały, dostawców modeli, środowiska wykonawcze agentów, narzędzia,
Skills, mowę, transkrypcję w czasie rzeczywistym, głos, rozumienie multimediów, generowanie,
pobieranie treści z internetu, wyszukiwanie w internecie i inne możliwości środowiska uruchomieniowego.

Na tej stronie opisano instalowanie pluginu, ponowne uruchamianie Gateway, sprawdzanie, czy środowisko
uruchomieniowe go załadowało, oraz rozwiązywanie typowych problemów z konfiguracją. Przykłady obejmujące tylko polecenia zawiera
strona [Zarządzanie pluginami](/pl/plugins/manage-plugins). Wygenerowany wykaz
pluginów wbudowanych, oficjalnych zewnętrznych i dostępnych wyłącznie w kodzie źródłowym zawiera
[Wykaz pluginów](/pl/plugins/plugin-inventory).

## Wymagania

- kopia robocza lub instalacja OpenClaw z dostępnym CLI `openclaw`
- dostęp sieciowy do wybranego źródła (ClawHub, npm lub host git)
- wszelkie dane uwierzytelniające, klucze konfiguracji lub narzędzia systemu operacyjnego wymagane
  w dokumentacji konfiguracji danego pluginu
- uprawnienie do przeładowania lub ponownego uruchomienia Gateway obsługującego kanały

## Szybki start

<Steps>
  <Step title="Znajdź plugin">
    Wyszukaj publiczne pakiety pluginów w [ClawHub](/clawhub):

    ```bash
    openclaw plugins search "calendar"
    ```

    ClawHub jest głównym miejscem wyszukiwania pluginów społecznościowych. Podczas
    migracji związanej z uruchomieniem zwykłe specyfikacje pakietów bez prefiksu nadal są instalowane z npm, chyba że
    odpowiadają identyfikatorowi oficjalnego pluginu. Surowe specyfikacje `@openclaw/*`, które odpowiadają
    pluginowi wbudowanemu, wskazują jego wbudowaną kopię. Jeśli potrzebne jest konkretne źródło,
    należy użyć jawnego prefiksu źródła.

  </Step>

  <Step title="Zainstaluj plugin">
    ```bash
    # Z ClawHub.
    openclaw plugins install clawhub:<package>

    # Z npm.
    openclaw plugins install npm:<package>

    # Z git.
    openclaw plugins install git:github.com/<owner>/<repo>@<ref>

    # Z lokalnej kopii roboczej używanej do programowania.
    openclaw plugins install ./my-plugin
    openclaw plugins install --link ./my-plugin
    ```

    Instalowanie pluginów należy traktować jak uruchamianie kodu. W instalacjach
    produkcyjnych warto używać przypiętych wersji, aby zapewnić powtarzalność. Pakiety ClawHub oraz
    katalog wbudowanych i oficjalnych pluginów OpenClaw są zaufanymi źródłami. Nowe dowolne źródła npm, git,
    lokalne ścieżki lub archiwa, `npm-pack:` albo marketplace wymagają
    `--force` w instalacjach nieinteraktywnych po
    przejrzeniu źródła i uznaniu go za zaufane.

  </Step>

  <Step title="Skonfiguruj i włącz plugin">
    Skonfiguruj ustawienia specyficzne dla pluginu w sekcji `plugins.entries.<id>.config`.
    Włącz plugin, jeśli nie jest jeszcze włączony:

    ```bash
    openclaw plugins enable <plugin-id>
    ```

    Jeśli ustawiono `plugins.allow`, identyfikator zainstalowanego pluginu musi znajdować się na tej liście,
    zanim plugin będzie mógł zostać załadowany. `openclaw plugins install` dodaje zainstalowany
    identyfikator do istniejącej listy `plugins.allow` i usuwa ten sam identyfikator z
    `plugins.deny`, dzięki czemu jawnie zainstalowany plugin może zostać załadowany po ponownym uruchomieniu.

  </Step>

  <Step title="Zezwól Gateway na przeładowanie">
    Instalowanie, aktualizowanie lub odinstalowywanie kodu pluginu wymaga ponownego uruchomienia
    Gateway. Zarządzany Gateway z włączonym przeładowywaniem konfiguracji wykrywa zmieniony
    rekord instalacji pluginu i automatycznie uruchamia się ponownie. W przeciwnym razie należy uruchomić go
    ponownie ręcznie:

    ```bash
    openclaw gateway restart
    ```

    Włączenie lub wyłączenie aktualizuje konfigurację i zimny rejestr. Inspekcja środowiska uruchomieniowego
    nadal stanowi najczytelniejszy dowód dostępności aktywnych powierzchni środowiska uruchomieniowego.

  </Step>

  <Step title="Sprawdź rejestrację w środowisku uruchomieniowym">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json
    ```

    Użyj `--runtime`, aby potwierdzić zarejestrowane narzędzia, hooki, usługi, metody Gateway
    lub polecenia CLI należące do pluginu. Zwykłe `inspect` sprawdza jedynie zimny manifest
    i rejestr.

  </Step>
</Steps>

## Konfiguracja

### Wybór źródła instalacji

| Źródło      | Kiedy używać                                                                   | Przykład                                                       |
| ----------- | ------------------------------------------------------------------------------ | -------------------------------------------------------------- |
| ClawHub     | Gdy potrzebne są natywne dla OpenClaw wyszukiwanie, skanowanie, metadane wersji i wskazówki instalacyjne | `openclaw plugins install clawhub:<package>`                   |
| npm         | Gdy potrzebne są bezpośrednie przepływy pracy rejestru npm lub tagów dystrybucji | `openclaw plugins install npm:<package>`                       |
| git         | Gdy potrzebna jest gałąź, tag lub commit z repozytorium                        | `openclaw plugins install git:github.com/<owner>/<repo>@<ref>` |
| ścieżka lokalna | Gdy plugin jest tworzony lub testowany na tym samym komputerze             | `openclaw plugins install --link ./my-plugin`                  |
| marketplace | Gdy instalowany jest plugin marketplace zgodny z Claude                       | `openclaw plugins install <plugin> --marketplace <source>`     |

Specyfikacje pakietów bez prefiksu mają specjalne zachowanie zgodności: nazwa bez prefiksu, która
odpowiada identyfikatorowi pluginu wbudowanego, używa tego wbudowanego źródła; nazwa bez prefiksu, która odpowiada
identyfikatorowi oficjalnego pluginu zewnętrznego, używa oficjalnego katalogu pakietów; każda inna
specyfikacja bez prefiksu jest podczas migracji związanej z uruchomieniem instalowana przez npm. Surowe specyfikacje `@openclaw/*`,
które odpowiadają pluginom wbudowanym, również wskazują wbudowaną kopię przed
przejściem awaryjnym do npm. Użyj `npm:@openclaw/<plugin>@<version>`, aby celowo zainstalować
zewnętrzny pakiet npm zamiast wbudowanej kopii. Użyj `clawhub:`, `npm:`,
`git:` lub `npm-pack:`, aby deterministycznie wybrać źródło. Pełną umowę polecenia opisano w
[`openclaw plugins`](/pl/cli/plugins#install).

W przypadku instalacji z npm nieprzypięte specyfikacje i `@latest` wybierają najnowszy stabilny
pakiet deklarujący zgodność z tą kompilacją OpenClaw. Jeśli bieżące najnowsze wydanie npm
deklaruje nowszą wartość `openclaw.compat.pluginApi` lub
`openclaw.install.minHostVersion`, niż obsługuje ta kompilacja, OpenClaw skanuje
starsze stabilne wersje i instaluje najnowszą zgodną. Dokładne wersje
i jawne tagi kanałów, takie jak `@beta`, pozostają przypięte do wybranego pakietu
i w razie niezgodności powodują błąd.

### Zasady instalacji operatora

Skonfiguruj `security.installPolicy`, aby przed instalacją lub aktualizacją pluginu uruchamiać zaufane lokalne polecenie zasad.
Zasada otrzymuje metadane oraz
ścieżkę do przygotowanego źródła i może zezwolić na instalację lub ją zablokować. Obejmuje zarówno ścieżki
instalowania i aktualizowania przez CLI, jak i przez Gateway. Hooki pluginu `before_install` są uruchamiane
później i tylko w procesach OpenClaw, w których załadowano hooki pluginów, dlatego do
decyzji instalacyjnych należących do operatora należy zamiast nich używać `security.installPolicy`. Przestarzała
flaga `--dangerously-force-unsafe-install` jest akceptowana ze względu na
zgodność, ale nie wykonuje żadnej operacji: nie omija zasad instalacji ani wbudowanej w OpenClaw
listy zabronionych zależności pluginów.

Wspólny schemat wykonywania `security.installPolicy`, używany zarówno przez Skills, jak i
pluginy, opisano w sekcji [Konfiguracja Skills](/pl/tools/skills-config#operator-install-policy-securityinstallpolicy).

### Konfigurowanie zasad pluginów

Typowa struktura konfiguracji pluginów wygląda następująco:

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    deny: ["untrusted-plugin"],
    load: { paths: ["~/Projects/oss/voice-call-plugin"] },
    slots: { memory: "memory-core" },
    entries: {
      "voice-call": { enabled: true, config: { provider: "twilio" } },
    },
  },
}
```

Najważniejsze reguły zasad:

- `plugins.enabled: false` wyłącza wszystkie pluginy oraz pomija ich wykrywanie i ładowanie.
  Nieaktualne odwołania do pluginów pozostają nieaktywne podczas obowiązywania tego ustawienia; przed uruchomieniem
  czyszczenia przez doctor należy ponownie włączyć pluginy, jeśli nieaktualne identyfikatory mają zostać usunięte.
- `plugins.deny` ma pierwszeństwo przed listą dozwolonych i ustawieniem włączenia poszczególnych pluginów.
- `plugins.allow` jest wyłączną listą dozwolonych. Narzędzia należące do pluginów spoza
  listy dozwolonych pozostają niedostępne, nawet jeśli `tools.allow` zawiera `"*"`.
- `plugins.entries.<id>.enabled: false` wyłącza jeden plugin, zachowując jego
  konfigurację.
- `plugins.load.paths` dodaje jawne lokalne pliki lub katalogi pluginów.
  Zarządzane ścieżki lokalne `plugins install` muszą wskazywać katalogi pluginów lub
  archiwa; w przypadku samodzielnych plików pluginów należy użyć `plugins.load.paths`.
- Pluginy pochodzące z obszaru roboczego są domyślnie wyłączone; przed użyciem lokalnego kodu
  z obszaru roboczego należy je jawnie włączyć lub dodać do listy dozwolonych.
- Pluginy wbudowane przestrzegają własnych metadanych określających domyślne włączenie lub wyłączenie,
  chyba że konfiguracja jawnie je zastąpi.
- `plugins.slots.<slot>` (`memory` lub `contextEngine`) wybiera jeden plugin dla
  wyłącznej kategorii. Wybór slotu jest traktowany jako jawna aktywacja i
  wymusza włączenie wybranego pluginu dla tego slotu, nawet jeśli w przeciwnym razie
  wymagałby zgody na włączenie. `plugins.deny` i `plugins.entries.<id>.enabled: false` nadal
  go blokują.
- Wbudowane pluginy wymagające zgody na włączenie mogą aktywować się automatycznie, gdy konfiguracja wskazuje jedną z należących do nich
  powierzchni, taką jak odwołanie do dostawcy lub modelu, konfiguracja kanału, backend CLI
  albo środowisko uruchomieniowe agenta.
- Routing Codex z rodziny OpenAI zachowuje oddzielne granice dostawcy i pluginu środowiska uruchomieniowego:
  starsze odwołania do modeli Codex stanowią starszą konfigurację naprawianą przez doctor,
  natomiast wbudowany plugin `codex` jest właścicielem środowiska uruchomieniowego serwera aplikacji Codex dla
  kanonicznych odwołań agentów `openai/*`, jawnych `agentRuntime.id: "codex"` oraz
  starszych odwołań `codex/*`.

Gdy `plugins.allow` nie jest ustawione, a niewbudowane pluginy są automatycznie wykrywane w
obszarze roboczym lub globalnych katalogach głównych pluginów, podczas uruchamiania rejestrowany jest komunikat
`plugins.allow is empty; discovered non-bundled plugins may auto-load: ...`
z identyfikatorami wykrytych pluginów oraz, w przypadku krótkich list, minimalnym fragmentem `plugins.allow`.
Przed skopiowaniem zaufanych pluginów do `openclaw.json` uruchom [`openclaw plugins list --enabled --verbose`](/pl/cli/plugins#list)
lub [`openclaw plugins inspect <id>`](/pl/cli/plugins#inspect) dla wymienionego
identyfikatora pluginu. To samo przypinanie zaufania obowiązuje, gdy diagnostyka informuje, że plugin został załadowany
`without install/load-path provenance`: sprawdź ten identyfikator pluginu, a następnie przypnij go w
`plugins.allow` lub zainstaluj ponownie z zaufanego źródła, aby OpenClaw zapisał pochodzenie
instalacji.

Uruchom `openclaw doctor` lub `openclaw doctor --fix`, gdy walidacja konfiguracji
zgłasza nieaktualne identyfikatory pluginów, niezgodności listy dozwolonych z narzędziami albo starsze ścieżki
pluginów wbudowanych.

## Formaty pluginów

OpenClaw rozpoznaje dwa formaty pluginów:

| Format                 | Sposób ładowania                                                             | Kiedy używać                                                            |
| ---------------------- | ---------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Natywny plugin OpenClaw | `openclaw.plugin.json` oraz moduł środowiska uruchomieniowego ładowany w procesie | Gdy instalowane lub tworzone są możliwości środowiska uruchomieniowego specyficzne dla OpenClaw |
| Zgodny pakiet           | Układ pluginu Codex, Claude lub Cursor odwzorowany na wykaz pluginów OpenClaw | Gdy ponownie wykorzystywane są zgodne Skills, polecenia, hooki lub metadane pakietu |

Oba formaty są widoczne w `openclaw plugins list`, `openclaw plugins inspect`,
`openclaw plugins enable` i `openclaw plugins disable`. Granicę zgodności pakietów opisano w sekcji
[Pakiety pluginów](/pl/plugins/bundles), a tworzenie natywnych pluginów — w sekcji
[Tworzenie pluginów](/pl/plugins/building-plugins).

## Hooki pluginów

Pluginy mogą rejestrować hooki w czasie działania za pośrednictwem dwóch różnych interfejsów API:

- Typowane hooki `api.on(...)` dla zdarzeń cyklu życia środowiska uruchomieniowego. Jest to
  preferowana powierzchnia dla oprogramowania pośredniczącego, zasad, przepisywania wiadomości, kształtowania
  promptów i kontroli narzędzi.
- `api.registerHook(...)` dla wewnętrznego systemu hooków opisanego w sekcji
  [Hooki](/pl/automation/hooks). Służy głównie do ogólnych efektów ubocznych poleceń i cyklu życia
  oraz zapewniania zgodności z istniejącą automatyzacją w stylu HOOK.

Prosta reguła: jeśli procedura obsługi wymaga priorytetu, semantyki scalania albo
możliwości blokowania lub anulowania, należy użyć typowanych hooków. Jeśli tylko reaguje na `command:new`,
`command:reset`, `message:sent` lub podobne zdarzenia ogólne, `api.registerHook`
jest odpowiednie.

Wewnętrzne hooki zarządzane przez plugin są widoczne w `openclaw hooks list` z oznaczeniem
`plugin:<id>`. Nie można ich włączać ani wyłączać za pomocą `openclaw hooks`;
zamiast tego należy włączyć lub wyłączyć plugin.

## Sprawdzanie aktywnego Gateway

`openclaw plugins list` i zwykłe `openclaw plugins inspect` odczytują nieaktywną konfigurację,
manifest i stan rejestru. Nie dowodzą, że już działający
Gateway zaimportował ten sam kod pluginu.

Gdy plugin wydaje się zainstalowany, ale ruch czatu na żywo go nie używa:

```bash
openclaw gateway status --deep --require-rpc
openclaw plugins inspect <plugin-id> --runtime --json
openclaw gateway restart
```

Zarządzane Gatewaye automatycznie uruchamiają się ponownie po instalacji, aktualizacji
i odinstalowaniu, jeśli zmiany modyfikują kod źródłowy pluginu. W instalacjach na VPS-ie
lub w kontenerze należy dopilnować, aby ręczne ponowne uruchomienie obejmowało właściwy
proces podrzędny `openclaw gateway run`, który obsługuje kanały, a nie tylko proces opakowujący
lub nadzorujący.

## Rozwiązywanie problemów

| Objaw                                                        | Kontrola                                                                                                                                      | Rozwiązanie                                                                                                     |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| Plugin pojawia się w `plugins list`, ale hooki środowiska uruchomieniowego nie działają  | Użyj `openclaw plugins inspect <id> --runtime --json` i potwierdź aktywny Gateway za pomocą `gateway status --deep --require-rpc`             | Uruchom ponownie aktywny Gateway po instalacji, aktualizacji albo zmianach konfiguracji lub kodu źródłowego                               |
| Pojawiają się komunikaty diagnostyczne o zduplikowanej własności kanału lub narzędzia         | Uruchom `openclaw plugins list --enabled --verbose`, sprawdź każdy podejrzany plugin za pomocą `--runtime --json` i porównaj własność kanałów/narzędzi | Wyłącz jednego właściciela, usuń nieaktualne instalacje lub użyj wpisu manifestu `preferOver` do celowego zastąpienia      |
| Konfiguracja informuje o braku pluginu                                | Sprawdź w [wykazie pluginów](/pl/plugins/plugin-inventory), czy jest on wbudowany, oficjalny zewnętrzny czy dostępny tylko jako kod źródłowy                           | Zainstaluj pakiet zewnętrzny, włącz wbudowany plugin lub usuń nieaktualną konfigurację                         |
| Konfiguracja jest nieprawidłowa podczas instalacji                               | Przeczytaj komunikat walidacji i uruchom `openclaw doctor --fix`, jeśli wskazuje on nieaktualny stan pluginu                                             | Doctor może poddać kwarantannie nieprawidłową konfigurację pluginu, wyłączając wpis i usuwając nieprawidłową zawartość     |
| Ścieżka pluginu jest blokowana z powodu podejrzanej własności lub uprawnień | Sprawdź komunikat diagnostyczny poprzedzający błąd konfiguracji                                                                                             | Popraw własność/uprawnienia systemu plików, a następnie uruchom `openclaw plugins registry --refresh`                    |
| `OPENCLAW_NIX_MODE=1` blokuje polecenia cyklu życia                | Potwierdź, że instalacją zarządza Nix                                                                                                      | Zmień wybór pluginu w źródle Nix zamiast używać poleceń modyfikujących pluginy                      |
| Import zależności kończy się niepowodzeniem w środowisku uruchomieniowym                             | Sprawdź, czy plugin zainstalowano przez npm/git/ClawHub, czy załadowano ze ścieżki lokalnej                                                 | Uruchom `openclaw plugins update <id>`, ponownie zainstaluj źródło lub samodzielnie zainstaluj lokalne zależności pluginu |

Gdy nieaktualna konfiguracja pluginu nadal wskazuje niewykrywalny już plugin kanału,
walidacja konfiguracji obniża błąd tego klucza kanału do ostrzeżenia zamiast błędu
krytycznego, dzięki czemu Gateway może się uruchomić i nadal obsługiwać wszystkie
pozostałe kanały. Uruchom `openclaw doctor --fix`, aby usunąć nieaktualne wpisy
pluginu i kanału. Nieznane klucze kanałów bez dowodów na nieaktualny plugin nadal
powodują niepowodzenie walidacji, aby literówki pozostawały widoczne.

W przypadku celowego zastąpienia kanału preferowany plugin powinien deklarować
`channelConfigs.<channel-id>.preferOver` z identyfikatorem starszego pluginu lub pluginu o niższym
priorytecie. Jeśli oba pluginy są jawnie włączone, OpenClaw zachowuje to żądanie
i zgłasza komunikaty diagnostyczne o zduplikowanej własności kanału/narzędzia,
zamiast niejawnie wybierać jednego właściciela.

Jeśli zainstalowany pakiet zgłasza, że `requires compiled runtime output for
TypeScript entry ...`, pakiet opublikowano bez plików JavaScript
potrzebnych OpenClaw w środowisku uruchomieniowym. Zaktualizuj lub zainstaluj go ponownie,
gdy wydawca udostępni skompilowany kod JavaScript, albo do tego czasu wyłącz/odinstaluj plugin.

### Zablokowana własność ścieżki pluginu

Jeśli komunikaty diagnostyczne podają
`blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`,
a następnie walidacja zgłasza `plugin present but blocked`, oznacza to, że OpenClaw znalazł
pliki pluginu należące do innego użytkownika systemu Unix niż proces, który je ładuje.
Pozostaw konfigurację pluginu bez zmian; popraw własność w systemie plików lub uruchom
OpenClaw jako ten sam użytkownik, do którego należy katalog stanu.

W instalacjach Docker oficjalny obraz działa jako `node` (uid `1000`),
więc montowane z hosta katalogi konfiguracji i przestrzeni roboczej OpenClaw powinny
zwykle należeć do uid `1000`:

```bash
sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
```

Jeśli OpenClaw jest celowo uruchamiany jako root, zamiast tego ustaw właściciela
zarządzanego katalogu głównego pluginów na root:

```bash
sudo chown -R root:root /path/to/openclaw-config/npm
```

Po poprawieniu własności ponownie uruchom `openclaw doctor --fix` lub
`openclaw plugins registry --refresh`, aby zapisany rejestr pluginów
odpowiadał naprawionym plikom.

### Powolne konfigurowanie narzędzi pluginu

Jeśli przebiegi agenta zdają się zatrzymywać podczas przygotowywania narzędzi, włącz
rejestrowanie na poziomie śledzenia i sprawdź wiersze czasów fabryk narzędzi pluginów:

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

Poszukaj:

```text
[trace:plugin-tools] czasy fabryk ...
```

Podsumowanie zawiera całkowity czas fabryk oraz najwolniejsze fabryki narzędzi pluginów,
w tym identyfikator pluginu, zadeklarowane nazwy narzędzi, kształt wyniku oraz informację,
czy narzędzie jest opcjonalne. Powolne wiersze są podnoszone do poziomu ostrzeżeń,
gdy pojedyncza fabryka działa przez co najmniej 1s lub łączne przygotowanie fabryk
narzędzi pluginów trwa co najmniej 5s.

OpenClaw buforuje pomyślne wyniki fabryk narzędzi pluginów na potrzeby wielokrotnego
rozstrzygania w tym samym efektywnym kontekście żądania. Klucz pamięci podręcznej
obejmuje efektywną konfigurację środowiska uruchomieniowego, przestrzeń roboczą
i identyfikator agenta, zasady piaskownicy, ustawienia przeglądarki, kontekst dostarczania,
tożsamość żądającego oraz stan własności, więc fabryki zależne od tych zaufanych pól
uruchamiają się ponownie po zmianie kontekstu. Jeśli czasy pozostają wysokie, plugin
może wykonywać kosztowne operacje przed zwróceniem definicji swoich narzędzi.

Jeśli jeden plugin odpowiada za większość czasu, sprawdź jego rejestracje w środowisku uruchomieniowym:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

Następnie zaktualizuj, ponownie zainstaluj lub wyłącz ten plugin. Autorzy pluginów
powinni przenieść kosztowne ładowanie zależności do ścieżki wykonywania narzędzia,
zamiast wykonywać je wewnątrz fabryki narzędzia.

Informacje o katalogach głównych zależności, walidacji metadanych pakietu, rekordach
rejestru, przeładowywaniu przy uruchamianiu i usuwaniu starszych danych zawiera
[Rozwiązywanie zależności pluginów](/pl/plugins/dependency-resolution).

## Powiązane

- [Zarządzanie pluginami](/pl/plugins/manage-plugins) - przykłady poleceń do wyświetlania listy, instalowania, aktualizowania, odinstalowywania i publikowania
- [`openclaw plugins`](/pl/cli/plugins) - pełna dokumentacja CLI
- [Wykaz pluginów](/pl/plugins/plugin-inventory) - wygenerowana lista pluginów wbudowanych i zewnętrznych
- [Dokumentacja pluginów](/pl/plugins/reference) - wygenerowane strony dokumentacji poszczególnych pluginów
- [Pluginy społeczności](/pl/plugins/community) - wyszukiwanie w ClawHub i zasady PR-ów dotyczących dokumentacji
- [Rozwiązywanie zależności pluginów](/pl/plugins/dependency-resolution) - katalogi główne instalacji, rekordy rejestru i granice środowiska uruchomieniowego
- [Tworzenie pluginów](/pl/plugins/building-plugins) - przewodnik tworzenia natywnych pluginów
- [Omówienie SDK pluginów](/pl/plugins/sdk-overview) - rejestracja w środowisku uruchomieniowym, hooki i pola API
- [Manifest pluginu](/pl/plugins/manifest) - manifest i metadane pakietu
