---
doc-schema-version: 1
read_when:
    - Instalowanie lub konfigurowanie pluginów
    - Opis mechanizmu wykrywania Pluginów i reguł ich ładowania
    - Praca z pakietami Pluginów zgodnymi z Codex/Claude
sidebarTitle: Getting Started
summary: Instalowanie, konfigurowanie i zarządzanie pluginami OpenClaw
title: Pluginy
x-i18n:
    generated_at: "2026-07-12T15:43:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9de5b54c1c7b8ecf789816aa909ee1538de4295f0503a1ea9eecd535077a7cbc
    source_path: tools/plugin.md
    workflow: 16
---

Pluginy rozszerzają OpenClaw o kanały, dostawców modeli, środowiska wykonawcze agentów, narzędzia,
Skills, syntezę mowy, transkrypcję w czasie rzeczywistym, obsługę głosu, analizę multimediów, generowanie,
pobieranie treści z sieci, wyszukiwanie w sieci i inne możliwości środowiska wykonawczego.

Na tej stronie opisano, jak zainstalować plugin, ponownie uruchomić Gateway, sprawdzić, czy środowisko
wykonawcze go załadowało, oraz rozwiązać typowe problemy z konfiguracją. Przykłady obejmujące wyłącznie polecenia zawiera strona
[Zarządzanie pluginami](/pl/plugins/manage-plugins). Wygenerowany wykaz
pluginów wbudowanych, oficjalnych zewnętrznych i dostępnych wyłącznie jako kod źródłowy zawiera
[Wykaz pluginów](/pl/plugins/plugin-inventory).

## Wymagania

- kopia robocza lub instalacja OpenClaw z dostępnym CLI `openclaw`
- dostęp sieciowy do wybranego źródła (ClawHub, npm lub host Git)
- wszelkie poświadczenia, klucze konfiguracji lub narzędzia systemu operacyjnego wymagane przez
  dokumentację konfiguracji danego pluginu
- uprawnienia umożliwiające przeładowanie lub ponowne uruchomienie Gateway obsługującego Twoje kanały

## Szybki start

<Steps>
  <Step title="Znajdź plugin">
    Wyszukaj publiczne pakiety pluginów w [ClawHub](/clawhub):

    ```bash
    openclaw plugins search "calendar"
    ```

    ClawHub jest głównym miejscem odkrywania pluginów społeczności. W okresie
    przejściowym po uruchomieniu zwykłe specyfikacje pakietów bez prefiksu nadal są instalowane z npm, chyba że
    pasują do identyfikatora oficjalnego pluginu. Surowe specyfikacje `@openclaw/*`, które pasują do
    wbudowanego pluginu, wskazują jego wbudowaną kopię. Użyj jawnego prefiksu źródła,
    gdy potrzebujesz konkretnego źródła.

  </Step>

  <Step title="Zainstaluj plugin">
    ```bash
    # From ClawHub.
    openclaw plugins install clawhub:<package>

    # From npm.
    openclaw plugins install npm:<package>

    # From git.
    openclaw plugins install git:github.com/<owner>/<repo>@<ref>

    # From a local development checkout.
    openclaw plugins install ./my-plugin
    openclaw plugins install --link ./my-plugin
    ```

    Instalowanie pluginów traktuj tak samo jak uruchamianie kodu. W środowisku
    produkcyjnym preferuj przypięte wersje, aby instalacje były powtarzalne.

  </Step>

  <Step title="Skonfiguruj i włącz plugin">
    Ustaw opcje właściwe dla pluginu w `plugins.entries.<id>.config`.
    Włącz plugin, jeśli nie jest jeszcze włączony:

    ```bash
    openclaw plugins enable <plugin-id>
    ```

    Jeśli ustawiono `plugins.allow`, identyfikator zainstalowanego pluginu musi znajdować się na tej liście,
    zanim plugin będzie mógł zostać załadowany. Polecenie `openclaw plugins install` dodaje identyfikator
    instalowanego pluginu do istniejącej listy `plugins.allow` i usuwa ten sam identyfikator z
    `plugins.deny`, aby jawnie zainstalowany plugin mógł zostać załadowany po ponownym uruchomieniu.

  </Step>

  <Step title="Pozwól Gateway na przeładowanie">
    Instalacja, aktualizacja lub odinstalowanie kodu pluginu wymaga ponownego uruchomienia
    Gateway. Zarządzany Gateway z włączonym przeładowywaniem konfiguracji wykrywa zmianę
    rekordu instalacji pluginu i automatycznie uruchamia się ponownie. W przeciwnym razie uruchom go
    ponownie samodzielnie:

    ```bash
    openclaw gateway restart
    ```

    Włączenie lub wyłączenie aktualizuje konfigurację i rejestr w stanie zimnym. Inspekcja środowiska wykonawczego
    nadal stanowi najbardziej jednoznaczny dowód dostępności aktywnych powierzchni środowiska wykonawczego.

  </Step>

  <Step title="Sprawdź rejestrację w środowisku wykonawczym">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json
    ```

    Użyj `--runtime`, aby potwierdzić rejestrację narzędzi, hooków, usług, metod Gateway
    lub poleceń CLI należących do pluginu. Zwykłe polecenie `inspect` sprawdza wyłącznie manifest
    i rejestr w stanie zimnym.

  </Step>
</Steps>

## Konfiguracja

### Wybór źródła instalacji

| Źródło      | Kiedy używać                                                                    | Przykład                                                        |
| ----------- | ------------------------------------------------------------------------------ | -------------------------------------------------------------- |
| ClawHub     | Gdy potrzebujesz natywnego dla OpenClaw odkrywania, skanowania, metadanych wersji i wskazówek instalacyjnych | `openclaw plugins install clawhub:<package>`                   |
| npm         | Gdy potrzebujesz bezpośredniej obsługi rejestru npm lub znaczników dist-tag    | `openclaw plugins install npm:<package>`                       |
| Git         | Gdy potrzebujesz gałęzi, znacznika lub commitu z repozytorium                  | `openclaw plugins install git:github.com/<owner>/<repo>@<ref>` |
| ścieżka lokalna | Gdy tworzysz lub testujesz plugin na tym samym komputerze                  | `openclaw plugins install --link ./my-plugin`                  |
| marketplace | Gdy instalujesz plugin z marketplace zgodny z Claude                          | `openclaw plugins install <plugin> --marketplace <source>`     |

Specyfikacje pakietów bez prefiksu mają szczególne zasady zgodności: nazwa bez prefiksu, która
pasuje do identyfikatora wbudowanego pluginu, używa tego wbudowanego źródła; nazwa bez prefiksu, która pasuje
do identyfikatora oficjalnego zewnętrznego pluginu, używa oficjalnego katalogu pakietów; każda inna
specyfikacja bez prefiksu jest instalowana przez npm w okresie przejściowym po uruchomieniu. Surowe specyfikacje `@openclaw/*`,
które pasują do wbudowanych pluginów, również wskazują wbudowaną kopię przed użyciem
npm jako rozwiązania rezerwowego. Użyj `npm:@openclaw/<plugin>@<version>`, aby celowo zainstalować
zewnętrzny pakiet npm zamiast wbudowanej kopii. Użyj `clawhub:`, `npm:`,
`git:` lub `npm-pack:`, aby deterministycznie wybrać źródło. Pełny kontrakt polecenia opisano na stronie
[`openclaw plugins`](/pl/cli/plugins#install).

W przypadku instalacji z npm specyfikacje bez przypiętej wersji oraz `@latest` wybierają najnowszy stabilny
pakiet, który deklaruje zgodność z tą wersją OpenClaw. Jeśli bieżące najnowsze wydanie npm
deklaruje nowszą wartość `openclaw.compat.pluginApi` lub
`openclaw.install.minHostVersion`, niż obsługuje ta kompilacja, OpenClaw przeszukuje
starsze stabilne wersje i instaluje najnowszą zgodną wersję. Dokładne wersje
i jawne znaczniki kanałów, takie jak `@beta`, pozostają przypięte do wybranego pakietu
i powodują błąd w przypadku niezgodności.

### Zasady instalacji operatora

Skonfiguruj `security.installPolicy`, aby przed instalacją lub aktualizacją pluginu uruchamiać
zaufane lokalne polecenie zasad. Zasady otrzymują metadane oraz ścieżkę do przygotowanego
źródła i mogą zezwolić na instalację lub ją zablokować. Obejmują zarówno ścieżki instalacji i aktualizacji
przez CLI, jak i przez Gateway. Hooki `before_install` pluginu są uruchamiane
później i tylko w procesach OpenClaw, w których załadowano hooki pluginów, dlatego do decyzji
instalacyjnych należących do operatora używaj zamiast nich `security.installPolicy`. Przestarzała
flaga `--dangerously-force-unsafe-install` jest akceptowana ze względu na zgodność,
ale niczego nie robi: nie omija zasad instalacji ani wbudowanej w OpenClaw
listy zabronionych zależności pluginów.

Wspólny schemat wykonywania `security.installPolicy`, używany zarówno przez Skills, jak i
pluginy, opisano na stronie [Konfiguracja Skills](/pl/tools/skills-config#operator-install-policy-securityinstallpolicy).

### Konfiguracja zasad pluginów

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

- `plugins.enabled: false` wyłącza wszystkie pluginy i pomija ich wykrywanie oraz
  ładowanie. Nieaktualne odwołania do pluginów pozostają nieaktywne, dopóki to ustawienie obowiązuje; jeśli chcesz usunąć
  nieaktualne identyfikatory, ponownie włącz pluginy przed uruchomieniem czyszczenia przez `doctor`.
- `plugins.deny` ma pierwszeństwo przed listą dozwolonych pluginów i ustawieniami włączenia poszczególnych pluginów.
- `plugins.allow` jest wyłączną listą dozwolonych pluginów. Narzędzia należące do pluginów spoza
  tej listy pozostają niedostępne, nawet jeśli `tools.allow` zawiera `"*"`.
- `plugins.entries.<id>.enabled: false` wyłącza jeden plugin, zachowując jego
  konfigurację.
- `plugins.load.paths` dodaje jawne lokalne pliki lub katalogi pluginów.
  Lokalne ścieżki zarządzane przez `plugins install` muszą wskazywać katalogi pluginów lub
  archiwa; dla samodzielnych plików pluginów używaj `plugins.load.paths`.
- Pluginy pochodzące z obszaru roboczego są domyślnie wyłączone; przed użyciem lokalnego kodu
  z obszaru roboczego jawnie je włącz lub dodaj do listy dozwolonych pluginów.
- Wbudowane pluginy działają zgodnie ze swoimi wbudowanymi metadanymi określającymi domyślne
  włączenie lub wyłączenie, chyba że konfiguracja jawnie je nadpisuje.
- `plugins.slots.<slot>` (`memory` lub `contextEngine`) wybiera jeden plugin dla
  wyłącznej kategorii. Wybór gniazda jest traktowany jako jawna aktywacja i
  wymusza włączenie wybranego pluginu dla tego gniazda, nawet jeśli w innym przypadku
  wymagałby jawnego włączenia. `plugins.deny` i `plugins.entries.<id>.enabled: false` nadal
  go blokują.
- Wbudowane pluginy wymagające jawnego włączenia mogą aktywować się automatycznie, gdy konfiguracja wskazuje jedną z
  należących do nich powierzchni, takich jak odwołanie do dostawcy lub modelu, konfiguracja kanału, backend CLI
  albo środowisko wykonawcze agenta.
- Trasowanie Codex z rodziny OpenAI zachowuje oddzielne granice dostawcy i pluginu środowiska wykonawczego:
  starsze odwołania do modeli Codex są starszą konfiguracją naprawianą przez `doctor`,
  natomiast wbudowany plugin `codex` jest właścicielem środowiska wykonawczego serwera aplikacji Codex dla
  kanonicznych odwołań agentów `openai/*`, jawnego `agentRuntime.id: "codex"` oraz
  starszych odwołań `codex/*`.

Gdy `plugins.allow` nie jest ustawione, a niewbudowane pluginy są automatycznie wykrywane
w obszarze roboczym lub globalnych katalogach głównych pluginów, dzienniki uruchamiania zawierają komunikat
`plugins.allow is empty; discovered non-bundled plugins may auto-load: ...`
z identyfikatorami wykrytych pluginów oraz, w przypadku krótkich list, minimalnym fragmentem `plugins.allow`.
Przed skopiowaniem zaufanych pluginów do `openclaw.json` uruchom
[`openclaw plugins list --enabled --verbose`](/pl/cli/plugins#list)
lub [`openclaw plugins inspect <id>`](/pl/cli/plugins#inspect) dla podanego
identyfikatora pluginu. To samo przypięcie zaufania obowiązuje, gdy diagnostyka informuje, że plugin został załadowany
`without install/load-path provenance`: sprawdź ten identyfikator pluginu, a następnie przypnij go w
`plugins.allow` lub zainstaluj ponownie z zaufanego źródła, aby OpenClaw zarejestrował
pochodzenie instalacji.

Uruchom `openclaw doctor` lub `openclaw doctor --fix`, gdy walidacja konfiguracji
zgłasza nieaktualne identyfikatory pluginów, niezgodności list dozwolonych pluginów i narzędzi albo starsze ścieżki
wbudowanych pluginów.

## Formaty pluginów

OpenClaw rozpoznaje dwa formaty pluginów:

| Format                  | Sposób ładowania                                                            | Kiedy używać                                                            |
| ----------------------- | --------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Natywny plugin OpenClaw | `openclaw.plugin.json` oraz moduł środowiska wykonawczego ładowany w procesie | Gdy instalujesz lub tworzysz możliwości środowiska wykonawczego przeznaczone dla OpenClaw |
| Zgodny pakiet            | Układ pluginu Codex, Claude lub Cursor odwzorowany w wykazie pluginów OpenClaw | Gdy ponownie wykorzystujesz zgodne Skills, polecenia, hooki lub metadane pakietu |

Oba formaty są widoczne w `openclaw plugins list`, `openclaw plugins inspect`,
`openclaw plugins enable` i `openclaw plugins disable`. Granicę zgodności pakietów opisano na stronie
[Pakiety pluginów](/pl/plugins/bundles), a tworzenie natywnych pluginów — na stronie
[Tworzenie pluginów](/pl/plugins/building-plugins).

## Hooki pluginów

Pluginy mogą rejestrować hooki w czasie działania za pomocą dwóch różnych interfejsów API:

- Typowane hooki `api.on(...)` dla zdarzeń cyklu życia środowiska wykonawczego. Jest to
  preferowana powierzchnia dla oprogramowania pośredniczącego, zasad, przepisywania wiadomości, kształtowania
  promptów i sterowania narzędziami.
- `api.registerHook(...)` dla wewnętrznego systemu hooków opisanego na stronie
  [Hooki](/pl/automation/hooks). Służy głównie do ogólnych efektów ubocznych poleceń i cyklu życia
  oraz zachowania zgodności z istniejącą automatyzacją w stylu HOOK.

Prosta zasada: jeśli procedura obsługi wymaga priorytetu, semantyki scalania albo
możliwości blokowania lub anulowania, użyj typowanych hooków. Jeśli jedynie reaguje na `command:new`,
`command:reset`, `message:sent` lub podobne ogólne zdarzenia, odpowiedni będzie `api.registerHook`.

Wewnętrzne hooki zarządzane przez plugin są widoczne w `openclaw hooks list` jako
`plugin:<id>`. Nie można ich włączać ani wyłączać za pomocą `openclaw hooks`;
zamiast tego włącz lub wyłącz plugin.

## Sprawdzanie aktywnego Gateway

Polecenia `openclaw plugins list` i zwykłe `openclaw plugins inspect` odczytują konfigurację,
manifest i stan rejestru w stanie zimnym. Nie potwierdzają, że już działający
Gateway zaimportował ten sam kod pluginu.

Gdy plugin wygląda na zainstalowany, ale aktywny ruch czatu go nie używa:

```bash
openclaw gateway status --deep --require-rpc
openclaw plugins inspect <plugin-id> --runtime --json
openclaw gateway restart
```

Zarządzane instancje Gateway są automatycznie uruchamiane ponownie po instalacji, aktualizacji i
odinstalowaniu pluginu, jeśli zmiany modyfikują jego kod źródłowy. W instalacjach na VPS-ie lub w kontenerze
upewnij się, że każde ręczne ponowne uruchomienie obejmuje właściwy proces podrzędny `openclaw gateway run`,
który obsługuje Twoje kanały, a nie tylko proces opakowujący lub nadzorujący.

## Rozwiązywanie problemów

| Objaw                                                          | Sprawdzenie                                                                                                                                | Rozwiązanie                                                                                              |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| Plugin jest widoczny w `plugins list`, ale hooki środowiska uruchomieniowego nie działają | Użyj `openclaw plugins inspect <id> --runtime --json` i potwierdź aktywną instancję Gateway za pomocą `gateway status --deep --require-rpc` | Uruchom ponownie działającą instancję Gateway po zmianach instalacji, aktualizacji, konfiguracji lub kodu źródłowego |
| Pojawiają się komunikaty diagnostyczne o powielonej własności kanału lub narzędzia | Uruchom `openclaw plugins list --enabled --verbose`, sprawdź każdy podejrzany plugin za pomocą `--runtime --json` i porównaj własność kanałów/narzędzi | Wyłącz jednego właściciela, usuń nieaktualne instalacje lub użyj `preferOver` w manifeście w celu celowego zastąpienia |
| Konfiguracja informuje o brakującym pluginie                    | Sprawdź w [wykazie pluginów](/pl/plugins/plugin-inventory), czy jest on dołączony, oficjalny zewnętrzny, czy dostępny tylko jako kod źródłowy | Zainstaluj pakiet zewnętrzny, włącz dołączony plugin lub usuń nieaktualną konfigurację                    |
| Konfiguracja jest nieprawidłowa podczas instalacji              | Przeczytaj komunikat walidacji i uruchom `openclaw doctor --fix`, jeśli wskazuje on nieaktualny stan pluginu                               | Doctor może odizolować nieprawidłową konfigurację pluginu przez wyłączenie wpisu i usunięcie nieprawidłowych danych |
| Ścieżka pluginu jest zablokowana z powodu podejrzanej własności lub uprawnień | Sprawdź komunikat diagnostyczny poprzedzający błąd konfiguracji                                                                            | Popraw własność/uprawnienia systemu plików, a następnie uruchom `openclaw plugins registry --refresh`   |
| `OPENCLAW_NIX_MODE=1` blokuje polecenia cyklu życia             | Potwierdź, że instalacja jest zarządzana przez Nix                                                                                         | Zmień wybór pluginu w źródle Nix zamiast używać poleceń modyfikujących pluginy                          |
| Import zależności kończy się niepowodzeniem w czasie działania  | Sprawdź, czy plugin został zainstalowany przez npm/git/ClawHub, czy wczytany ze ścieżki lokalnej                                           | Uruchom `openclaw plugins update <id>`, ponownie zainstaluj źródło lub samodzielnie zainstaluj lokalne zależności pluginu |

Jeśli nieaktualna konfiguracja pluginu nadal wskazuje plugin kanału, którego nie można już wykryć,
walidacja konfiguracji zmienia błąd tego klucza kanału w ostrzeżenie zamiast błędu krytycznego,
dzięki czemu uruchomiona instancja Gateway może nadal obsługiwać wszystkie pozostałe kanały. Uruchom
`openclaw doctor --fix`, aby usunąć nieaktualne wpisy pluginów i kanałów. Nieznane
klucze kanałów bez dowodów na istnienie nieaktualnego pluginu nadal powodują błąd walidacji,
aby literówki pozostawały widoczne.

W przypadku celowego zastąpienia kanału preferowany plugin powinien deklarować
`channelConfigs.<channel-id>.preferOver` z identyfikatorem starszego pluginu lub pluginu
o niższym priorytecie. Jeśli oba pluginy są jawnie włączone, OpenClaw zachowuje to żądanie
i zgłasza komunikaty diagnostyczne o powielonej własności kanału/narzędzia zamiast bezgłośnie
wybierać jednego właściciela.

Jeśli zainstalowany pakiet zgłasza, że `requires compiled runtime output for
TypeScript entry ...`, oznacza to, że został opublikowany bez plików JavaScript
wymaganych przez OpenClaw w czasie działania. Zaktualizuj go lub zainstaluj ponownie, gdy wydawca
udostępni skompilowany JavaScript, albo do tego czasu wyłącz/odinstaluj plugin.

### Zablokowana własność ścieżki pluginu

Jeśli komunikaty diagnostyczne zawierają
`blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`,
a walidacja następnie zgłasza `plugin present but blocked`, OpenClaw znalazł
pliki pluginu należące do innego użytkownika systemu Unix niż proces, który je wczytuje.
Pozostaw konfigurację pluginu bez zmian; popraw własność plików w systemie plików lub uruchom OpenClaw
jako ten sam użytkownik, do którego należy katalog stanu.

W instalacjach Docker oficjalny obraz działa jako `node` (uid `1000`), dlatego
katalogi konfiguracji i przestrzeni roboczej OpenClaw zamontowane z hosta powinny zwykle
należeć do uid `1000`:

```bash
sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
```

Jeśli celowo uruchamiasz OpenClaw jako root, ustaw zamiast tego własność zarządzanego katalogu głównego pluginów
na root:

```bash
sudo chown -R root:root /path/to/openclaw-config/npm
```

Po poprawieniu własności ponownie uruchom `openclaw doctor --fix` lub
`openclaw plugins registry --refresh`, aby zapisany rejestr pluginów
odpowiadał naprawionym plikom.

### Powolne przygotowywanie narzędzi pluginów

Jeśli przebiegi agenta zdają się zatrzymywać podczas przygotowywania narzędzi, włącz rejestrowanie na poziomie śledzenia
i sprawdź wpisy dotyczące czasu działania fabryk narzędzi pluginów:

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

Szukaj wpisów:

```text
[trace:plugin-tools] factory timings ...
```

Podsumowanie zawiera łączny czas działania fabryk oraz najwolniejsze fabryki narzędzi pluginów,
w tym identyfikator pluginu, zadeklarowane nazwy narzędzi, strukturę wyniku oraz informację,
czy narzędzie jest opcjonalne. Powolne wpisy są podnoszone do poziomu ostrzeżeń, gdy pojedyncza fabryka działa
co najmniej 1 s lub łączne przygotowanie fabryk narzędzi pluginów trwa co najmniej 5 s.

OpenClaw buforuje pomyślne wyniki fabryk narzędzi pluginów na potrzeby wielokrotnych
rozstrzygnięć z tym samym efektywnym kontekstem żądania. Klucz pamięci podręcznej obejmuje
efektywną konfigurację środowiska uruchomieniowego, przestrzeń roboczą i identyfikator agenta, zasady piaskownicy, ustawienia
przeglądarki, kontekst dostarczenia, tożsamość żądającego oraz stan własności, dzięki czemu
fabryki zależne od tych zaufanych pól uruchamiają się ponownie po zmianie kontekstu.
Jeśli czasy pozostają wysokie, plugin może wykonywać kosztowne operacje przed
zwróceniem definicji swoich narzędzi.

Jeśli jeden plugin odpowiada za większość czasu, sprawdź jego rejestracje środowiska uruchomieniowego:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

Następnie zaktualizuj, zainstaluj ponownie lub wyłącz ten plugin. Autorzy pluginów powinni przenieść
kosztowne wczytywanie zależności do ścieżki wykonywania narzędzia zamiast wykonywać je
wewnątrz fabryki narzędzia.

Informacje o katalogach głównych zależności, walidacji metadanych pakietów, rekordach rejestru, zachowaniu
ponownego wczytywania podczas uruchamiania oraz czyszczeniu starszych danych zawiera sekcja
[Rozwiązywanie zależności pluginów](/pl/plugins/dependency-resolution).

## Powiązane materiały

- [Zarządzanie pluginami](/pl/plugins/manage-plugins) — przykłady poleceń wyświetlania, instalowania, aktualizowania, odinstalowywania i publikowania
- [`openclaw plugins`](/pl/cli/plugins) — pełna dokumentacja CLI
- [Wykaz pluginów](/pl/plugins/plugin-inventory) — wygenerowana lista dołączonych i zewnętrznych pluginów
- [Dokumentacja pluginów](/pl/plugins/reference) — wygenerowane strony dokumentacji poszczególnych pluginów
- [Pluginy społeczności](/pl/plugins/community) — wyszukiwanie w ClawHub i zasady dotyczące PR-ów dokumentacji
- [Rozwiązywanie zależności pluginów](/pl/plugins/dependency-resolution) — katalogi główne instalacji, rekordy rejestru i granice środowiska uruchomieniowego
- [Tworzenie pluginów](/pl/plugins/building-plugins) — przewodnik tworzenia natywnych pluginów
- [Omówienie zestawu SDK pluginów](/pl/plugins/sdk-overview) — rejestracja środowiska uruchomieniowego, hooki i pola API
- [Manifest pluginu](/pl/plugins/manifest) — manifest i metadane pakietu
