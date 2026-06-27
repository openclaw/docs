---
doc-schema-version: 1
read_when:
    - Instalowanie lub konfigurowanie pluginów
    - Omówienie reguł wykrywania i ładowania Pluginów
    - Praca z pakietami Plugin zgodnymi z Codex/Claude
sidebarTitle: Getting Started
summary: Instaluj, konfiguruj i zarządzaj pluginami OpenClaw
title: Pluginy
x-i18n:
    generated_at: "2026-06-27T18:30:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c61e0ddb164baba368fbf57883e7a72eddadc28cb100ed6c4f11977c55576513
    source_path: tools/plugin.md
    workflow: 16
---

Pluginy rozszerzają OpenClaw o kanały, dostawców modeli, środowiska agentów, narzędzia,
skills, mowę, transkrypcję w czasie rzeczywistym, głos, rozumienie multimediów, generowanie,
pobieranie z sieci, wyszukiwanie w sieci oraz inne możliwości runtime.

Użyj tej strony, gdy chcesz zainstalować plugin, ponownie uruchomić Gateway, sprawdzić,
czy runtime go załadował, i rozwiązać typowe błędy konfiguracji. Przykłady ograniczone do poleceń
znajdziesz w [Zarządzanie pluginami](/pl/plugins/manage-plugins). Pełny wygenerowany
spis wbudowanych, oficjalnych zewnętrznych i dostępnych tylko w źródłach pluginów znajdziesz w
[Spis pluginów](/pl/plugins/plugin-inventory).

## Wymagania

Przed zainstalowaniem pluginu upewnij się, że masz:

- checkout lub instalację OpenClaw z dostępnym CLI `openclaw`
- dostęp sieciowy do wybranego źródła, takiego jak ClawHub, npm lub host git
- wszelkie poświadczenia, klucze konfiguracji lub narzędzia systemu operacyjnego specyficzne dla pluginu, wskazane
  w dokumentacji konfiguracji tego pluginu
- uprawnienia dla Gateway obsługującego Twoje kanały do przeładowania lub ponownego uruchomienia

## Szybki start

<Steps>
  <Step title="Znajdź plugin">
    Przeszukaj [ClawHub](/pl/clawhub) pod kątem publicznych pakietów pluginów:

    ```bash
    openclaw plugins search "calendar"
    ```

    ClawHub to główna powierzchnia odkrywania pluginów społecznościowych. Podczas
    przejścia na uruchomienie zwykłe specyfikacje pakietów bez prefiksu nadal instalują się z npm, chyba że
    pasują do oficjalnego identyfikatora pluginu. Surowe specyfikacje pakietów `@openclaw/*`, które pasują
    do wbudowanych pluginów, używają wbudowanej kopii z bieżącej kompilacji OpenClaw. Użyj
    jawnego prefiksu, gdy potrzebujesz konkretnego źródła.

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

    Traktuj instalacje pluginów jak uruchamianie kodu. Preferuj przypięte wersje, gdy
    potrzebujesz odtwarzalnych instalacji produkcyjnych.

  </Step>

  <Step title="Skonfiguruj i włącz">
    Skonfiguruj ustawienia specyficzne dla pluginu w `plugins.entries.<id>.config`.
    Włącz plugin, jeśli nie jest jeszcze włączony:

    ```bash
    openclaw plugins enable <plugin-id>
    ```

    Jeśli Twoja konfiguracja używa restrykcyjnej listy `plugins.allow`, identyfikator zainstalowanego pluginu
    musi być na niej obecny, zanim plugin będzie mógł się załadować.
    `openclaw plugins install` dodaje zainstalowany identyfikator do istniejącej
    listy `plugins.allow` i usuwa ten sam identyfikator z `plugins.deny`, aby
    jawna instalacja mogła się załadować po ponownym uruchomieniu.

  </Step>

  <Step title="Pozwól Gateway się przeładować">
    Instalowanie, aktualizowanie lub odinstalowywanie kodu pluginu wymaga ponownego uruchomienia Gateway.
    Gdy zarządzany Gateway jest już uruchomiony z włączonym przeładowaniem konfiguracji,
    OpenClaw wykrywa zmieniony rekord instalacji pluginu i automatycznie restartuje
    Gateway. Jeśli Gateway nie jest zarządzany albo przeładowanie jest wyłączone,
    uruchom go ponownie samodzielnie:

    ```bash
    openclaw gateway restart
    ```

    Operacje włączania i wyłączania aktualizują konfigurację i odświeżają zimny rejestr.
    Inspekcja runtime nadal jest najczytelniejszą ścieżką weryfikacji powierzchni live runtime.

  </Step>

  <Step title="Zweryfikuj rejestrację runtime">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json
    ```

    Użyj `--runtime`, gdy musisz udowodnić zarejestrowane narzędzia, hooki, usługi,
    metody Gateway lub polecenia CLI należące do pluginu. Zwykłe `inspect` to zimna
    kontrola manifestu i rejestru.

  </Step>
</Steps>

## Konfiguracja

### Wybierz źródło instalacji

| Źródło      | Użyj, gdy                                                                       | Przykład                                                        |
| ----------- | ------------------------------------------------------------------------------ | -------------------------------------------------------------- |
| ClawHub     | Chcesz natywne dla OpenClaw odkrywanie, skany, metadane wersji i wskazówki instalacji | `openclaw plugins install clawhub:<package>`                   |
| npm         | Potrzebujesz bezpośredniego rejestru npm lub przepływów dist-tag                             | `openclaw plugins install npm:<package>`                       |
| git         | Potrzebujesz gałęzi, tagu lub commita z repozytorium                            | `openclaw plugins install git:github.com/<owner>/<repo>@<ref>` |
| ścieżka lokalna  | Tworzysz lub testujesz plugin na tej samej maszynie                     | `openclaw plugins install --link ./my-plugin`                  |
| marketplace | Instalujesz plugin marketplace zgodny z Claude                      | `openclaw plugins install <plugin> --marketplace <source>`     |

Specyfikacje pakietów bez prefiksu mają specjalne zachowanie zgodności. Jeśli nazwa bez prefiksu pasuje
do identyfikatora wbudowanego pluginu, OpenClaw używa tego wbudowanego źródła. Jeśli pasuje do
identyfikatora oficjalnego zewnętrznego pluginu, OpenClaw używa oficjalnego katalogu pakietów. Inne
zwykłe specyfikacje pakietów bez prefiksu instalują się przez npm podczas przejścia na uruchomienie. Surowe
specyfikacje pakietów `@openclaw/*`, które pasują do wbudowanych pluginów, również rozwiązują się do
wbudowanej kopii przed fallbackiem do npm. Użyj `npm:@openclaw/<plugin>@<version>`, gdy
celowo chcesz zewnętrzny pakiet npm zamiast wbudowanej kopii należącej do obrazu.
Użyj `clawhub:`, `npm:`, `git:` lub `npm-pack:`, gdy potrzebujesz
deterministycznego wyboru źródła. Pełny kontrakt polecenia znajdziesz w [`openclaw plugins`](/pl/cli/plugins#install).

W przypadku instalacji z npm nieprzypięte specyfikacje pakietów i `@latest` wybierają najnowszy stabilny
pakiet, który deklaruje zgodność z tą kompilacją OpenClaw. Jeśli bieżące najnowsze wydanie npm
deklaruje nowsze `openclaw.compat.pluginApi` lub
`openclaw.install.minHostVersion`, OpenClaw skanuje starsze stabilne wersje pakietu
i instaluje najnowszą pasującą. Dokładne wersje i jawne tagi kanałów,
takie jak `@beta`, pozostają przypięte do wybranego pakietu i kończą się niepowodzeniem, gdy są niezgodne.

### Polityka instalacji operatora

Skonfiguruj `security.installPolicy`, aby uruchamiać zaufane lokalne polecenie polityki przed
kontynuowaniem instalacji lub aktualizacji pluginu. Polityka otrzymuje metadane oraz przygotowaną
ścieżkę źródłową i może zezwolić na instalację albo ją zablokować. Obejmuje ścieżki
instalacji/aktualizacji pluginów obsługiwane przez CLI i Gateway. Hooki `before_install` pluginu uruchamiają się później tylko w
procesach OpenClaw, w których załadowano hooki pluginów, więc użyj `security.installPolicy`
do decyzji instalacyjnych należących do operatora. Przestarzała flaga
`--dangerously-force-unsafe-install` jest akceptowana dla zgodności, ale nie
omija polityki instalacji ani wbudowanej listy blokowania zależności pluginów OpenClaw.

Zobacz [Konfiguracja Skills](/pl/tools/skills-config#operator-install-policy-securityinstallpolicy),
aby poznać współdzielony schemat exec `security.installPolicy` używany zarówno przez skills, jak i
pluginy.

### Skonfiguruj politykę pluginów

Wspólny kształt konfiguracji pluginów to:

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

Najważniejsze reguły polityki:

- `plugins.enabled: false` wyłącza wszystkie pluginy i pomija wykrywanie/ładowanie pluginów.
  Nieaktualne odwołania do pluginów są nieaktywne, gdy to ustawienie jest aktywne; ponownie włącz
  pluginy przed uruchomieniem czyszczenia doctor, gdy chcesz usunąć nieaktualne identyfikatory.
- `plugins.deny` ma pierwszeństwo przed allow i włączeniem pojedynczego pluginu.
- `plugins.allow` to wyłączna allowlista. Narzędzia należące do pluginów poza
  allowlistą pozostają niedostępne, nawet gdy `tools.allow` zawiera `"*"`.
- `plugins.entries.<id>.enabled: false` wyłącza jeden plugin, zachowując jego
  konfigurację.
- `plugins.load.paths` dodaje jawne lokalne pliki lub katalogi pluginów. Zarządzane
  ścieżki lokalne `plugins install` muszą być katalogami lub archiwami pluginów; użyj
  `plugins.load.paths` dla samodzielnych plików pluginów.
- Pluginy pochodzące z workspace są domyślnie wyłączone; jawnie je włącz lub
  dodaj do allowlisty przed użyciem lokalnego kodu workspace.
- Wbudowane pluginy podążają za swoimi wbudowanymi metadanymi domyślnie włączone/domyślnie wyłączone, chyba że
  konfiguracja jawnie je nadpisuje.
- `plugins.slots.<slot>` wybiera jeden plugin dla wyłącznych kategorii, takich jak
  silniki pamięci i kontekstu. Wybór slotu wymusza włączenie wybranego pluginu
  dla tego slotu, licząc się jako jawna aktywacja; może się załadować nawet wtedy, gdy
  w innym przypadku wymagałby zgody. `plugins.deny` i
  `plugins.entries.<id>.enabled: false` nadal go blokują.
- Wbudowane pluginy opt-in mogą aktywować się automatycznie, gdy konfiguracja wskazuje jedną z należących do nich
  powierzchni, taką jak odwołanie provider/model, konfiguracja kanału, backend CLI lub
  runtime środowiska agenta.
- Routing Codex z rodziny OpenAI utrzymuje granice pluginów dostawcy i runtime
  oddzielnie: starsze odwołania do modeli Codex to starsza konfiguracja naprawiana przez doctor, natomiast wbudowany
  plugin `codex` jest właścicielem runtime serwera aplikacji Codex dla kanonicznych odwołań agentów `openai/*`,
  jawnego `agentRuntime.id: "codex"` oraz starszych odwołań `codex/*`.

Gdy `plugins.allow` nie jest ustawione, a niewbudowane pluginy są automatycznie wykrywane z
workspace lub globalnych katalogów głównych pluginów, logi startowe zawierają
`plugins.allow is empty; discovered non-bundled plugins may auto-load: ...`.
Ostrzeżenie zawiera wykryte identyfikatory pluginów oraz, dla krótkich list, minimalny
fragment `plugins.allow`. Uruchom
[`openclaw plugins list --enabled --verbose`](/pl/cli/plugins#list) lub
[`openclaw plugins inspect <id>`](/pl/cli/plugins#inspect) z wymienionym identyfikatorem pluginu
przed skopiowaniem zaufanych pluginów do `openclaw.json`. Te same wskazówki
dotyczące przypinania zaufania mają zastosowanie, gdy diagnostyka mówi, że plugin został załadowany
`without install/load-path provenance`: sprawdź ten identyfikator pluginu, a następnie przypnij
zaufany identyfikator w `plugins.allow` albo zainstaluj ponownie z zaufanego źródła, aby OpenClaw
zapisał pochodzenie instalacji.

Uruchom `openclaw doctor` lub `openclaw doctor --fix`, gdy walidacja konfiguracji zgłasza
nieaktualne identyfikatory pluginów, niezgodności allowlisty/narzędzi albo starsze ścieżki wbudowanych pluginów.

## Poznaj formaty pluginów

OpenClaw rozpoznaje dwa formaty pluginów:

| Format                 | Jak się ładuje                                                                 | Użyj, gdy                                                               |
| ---------------------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Natywny plugin OpenClaw | `openclaw.plugin.json` plus moduł runtime ładowany w procesie               | Instalujesz lub budujesz możliwości runtime specyficzne dla OpenClaw  |
| Zgodny bundle      | Układ pluginu Codex, Claude lub Cursor mapowany na spis pluginów OpenClaw | Ponownie używasz zgodnych skills, poleceń, hooków lub metadanych bundle |

Oba formaty pojawiają się w `openclaw plugins list`, `openclaw plugins inspect`,
`openclaw plugins enable` i `openclaw plugins disable`. Zobacz
[Bundle pluginów](/pl/plugins/bundles), aby poznać granicę zgodności bundle, oraz
[Budowanie pluginów](/pl/plugins/building-plugins), aby poznać tworzenie natywnych pluginów.

## Hooki pluginów

Pluginy mogą rejestrować hooki w runtime, ale istnieją dwa różne API z
różnymi zadaniami.

- Używaj typowanych hooków przez `api.on(...)` dla hooków cyklu życia runtime. To
  preferowana powierzchnia dla middleware, polityki, przepisywania wiadomości, kształtowania promptów
  i kontroli narzędzi.
- Używaj `api.registerHook(...)` tylko wtedy, gdy chcesz uczestniczyć w wewnętrznym
  systemie hooków opisanym w [Hooki](/pl/automation/hooks). Służy on głównie do ogólnych
  efektów ubocznych poleceń/cyklu życia i zgodności z istniejącą automatyzacją w stylu HOOK.

Szybka reguła:

- Jeśli handler potrzebuje priorytetu, semantyki scalania albo zachowania blokowania/anulowania, użyj
  typowanych hooków pluginów.
- Jeśli handler tylko reaguje na `command:new`, `command:reset`, `message:sent`
  lub podobne ogólne zdarzenia, `api.registerHook(...)` jest w porządku.

Wewnętrzne hooki zarządzane przez plugin pojawiają się w `openclaw hooks list` z
`plugin:<id>`. Nie możesz ich włączyć ani wyłączyć przez `openclaw hooks`;
zamiast tego włącz lub wyłącz plugin.

## Zweryfikuj aktywny Gateway

`openclaw plugins list` oraz zwykłe `openclaw plugins inspect` odczytują zimny stan
konfiguracji, manifestu i rejestru. Nie dowodzą, że już działający Gateway
zaimportował ten sam kod Plugin.

Gdy Plugin wygląda na zainstalowany, ale ruch czatu na żywo go nie używa:

```bash
openclaw gateway status --deep --require-rpc
openclaw plugins inspect <plugin-id> --runtime --json
openclaw gateway restart
```

Zarządzane Gatewaye restartują się automatycznie po zmianach instalacji,
aktualizacji i odinstalowania Plugin, które zmieniają źródło Plugin. W
instalacjach na VPS lub w kontenerze upewnij się, że ręczny restart obejmuje
rzeczywisty proces potomny `openclaw gateway run`, który obsługuje Twoje kanały,
a nie tylko wrapper lub supervisor.

## Rozwiązywanie problemów

| Objaw                                                          | Sprawdź                                                                                                                                     | Naprawa                                                                                                |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Plugin pojawia się w `plugins list`, ale hooki runtime się nie uruchamiają | Użyj `openclaw plugins inspect <id> --runtime --json` i potwierdź aktywny Gateway za pomocą `gateway status --deep --require-rpc`           | Zrestartuj działający Gateway po instalacji, aktualizacji, konfiguracji lub zmianach źródła            |
| Pojawiają się diagnostyki zduplikowanego właściciela kanału lub narzędzia | Uruchom `openclaw plugins list --enabled --verbose`, sprawdź każdy podejrzany Plugin za pomocą `--runtime --json` i porównaj własność kanału/narzędzia | Wyłącz jednego właściciela, usuń nieaktualne instalacje albo użyj `preferOver` w manifeście dla zamierzonego zastąpienia |
| Konfiguracja mówi, że brakuje Plugin                           | Sprawdź [inwentarz Plugin](/pl/plugins/plugin-inventory), aby ustalić, czy jest wbudowany, oficjalnie zewnętrzny, czy tylko źródłowy           | Zainstaluj pakiet zewnętrzny, włącz wbudowany Plugin albo usuń nieaktualną konfigurację                |
| Konfiguracja jest nieprawidłowa podczas instalacji             | Przeczytaj komunikat walidacji i uruchom `openclaw doctor --fix`, gdy wskazuje na nieaktualny stan Plugin                                  | Doctor może poddać nieprawidłową konfigurację Plugin kwarantannie, wyłączając wpis i usuwając nieprawidłowy payload |
| Ścieżka Plugin jest zablokowana z powodu podejrzanej własności lub uprawnień | Sprawdź diagnostykę przed błędem konfiguracji                                                                                                | Napraw własność/uprawnienia systemu plików, a następnie uruchom `openclaw plugins registry --refresh`  |
| `OPENCLAW_NIX_MODE=1` blokuje polecenia cyklu życia            | Potwierdź, że instalacja jest zarządzana przez Nix                                                                                          | Zmień wybór Plugin w źródle Nix zamiast używać poleceń modyfikujących Plugin                          |
| Import zależności kończy się niepowodzeniem w runtime          | Sprawdź, czy Plugin został zainstalowany przez npm/git/ClawHub, czy załadowany ze ścieżki lokalnej                                          | Uruchom `openclaw plugins update <id>`, zainstaluj ponownie źródło albo samodzielnie zainstaluj lokalne zależności Plugin |

Gdy nieaktualna konfiguracja Plugin nadal wskazuje już niewykrywalny Plugin
kanału, uruchamianie Gateway pomija ten kanał oparty na Plugin zamiast blokować
wszystkie pozostałe kanały. Uruchom `openclaw doctor --fix`, aby usunąć
nieaktualne wpisy Plugin i kanału. Nieznane klucze kanałów bez dowodów na
nieaktualny Plugin nadal powodują błąd walidacji, aby literówki pozostały
widoczne.

W przypadku zamierzonego zastąpienia kanału preferowany Plugin powinien
zadeklarować `channelConfigs.<channel-id>.preferOver` z identyfikatorem
starszego lub niżej priorytetowego Plugin. Jeśli oba Plugin są jawnie włączone,
OpenClaw zachowuje to żądanie i zgłasza diagnostyki zduplikowanego kanału lub
narzędzia zamiast po cichu wybierać jednego właściciela.

Jeśli zainstalowany pakiet zgłasza, że `requires compiled runtime output for
TypeScript entry ...`, pakiet został opublikowany bez plików JavaScript
wymaganych przez OpenClaw w runtime. Zaktualizuj lub zainstaluj ponownie po
opublikowaniu skompilowanego JavaScript przez wydawcę albo do tego czasu wyłącz
lub odinstaluj Plugin.

### Zablokowana własność ścieżki Plugin

Jeśli diagnostyki Plugin mówią
`blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
a po nich walidacja konfiguracji zgłasza `plugin present but blocked`, OpenClaw
znalazł pliki Plugin należące do innego użytkownika Unix niż proces, który je
ładuje. Pozostaw konfigurację Plugin na miejscu; napraw własność systemu plików
albo uruchom OpenClaw jako ten sam użytkownik, który jest właścicielem katalogu
stanu.

W instalacjach Docker oficjalny obraz działa jako `node` (uid `1000`), więc
podmontowane z hosta katalogi konfiguracji i workspace OpenClaw zwykle powinny
należeć do uid `1000`:

```bash
sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
```

Jeśli celowo uruchamiasz OpenClaw jako root, napraw zarządzany root Plugin,
ustawiając zamiast tego własność root:

```bash
sudo chown -R root:root /path/to/openclaw-config/npm
```

Po naprawieniu własności uruchom ponownie `openclaw doctor --fix` albo
`openclaw plugins registry --refresh`, aby utrwalony rejestr Plugin odpowiadał
naprawionym plikom.

### Wolna konfiguracja narzędzi Plugin

Jeśli tury agenta wyglądają na zatrzymane podczas przygotowywania narzędzi,
włącz logowanie trace i sprawdź linie czasu fabryk narzędzi Plugin:

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

Szukaj:

```text
[trace:plugin-tools] factory timings ...
```

Podsumowanie pokazuje całkowity czas fabryk i najwolniejsze fabryki narzędzi
Plugin, w tym identyfikator Plugin, zadeklarowane nazwy narzędzi, kształt wyniku
oraz informację, czy narzędzie jest opcjonalne. Wolne linie są promowane do
ostrzeżeń, gdy pojedyncza fabryka trwa co najmniej 1s albo całkowite
przygotowanie fabryk narzędzi Plugin trwa co najmniej 5s.

OpenClaw buforuje udane wyniki fabryk narzędzi Plugin dla powtarzanych
rozwiązań z tym samym efektywnym kontekstem żądania. Klucz cache obejmuje
efektywną konfigurację runtime, workspace, identyfikatory agenta/sesji, politykę
sandbox, ustawienia przeglądarki, kontekst dostarczania, tożsamość żądającego i
stan własności, więc fabryki zależne od tych zaufanych pól są uruchamiane
ponownie, gdy kontekst się zmienia. Jeśli czasy pozostają wysokie, Plugin może
wykonywać kosztowną pracę przed zwróceniem definicji narzędzi.

Jeśli jeden Plugin dominuje w czasie, sprawdź jego rejestracje runtime:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

Następnie zaktualizuj, zainstaluj ponownie albo wyłącz ten Plugin. Autorzy
Plugin powinni przenieść kosztowne ładowanie zależności za ścieżkę wykonania
narzędzia zamiast wykonywać je wewnątrz fabryki narzędzia.

Informacje o rootach zależności, walidacji metadanych pakietu, rekordach
rejestru, zachowaniu przeładowania przy starcie i czyszczeniu starszych danych
znajdziesz w [rozwiązywaniu zależności Plugin](/pl/plugins/dependency-resolution).

## Powiązane

- [Zarządzanie Plugin](/pl/plugins/manage-plugins) - przykłady poleceń dla listy, instalacji, aktualizacji, odinstalowania i publikacji
- [`openclaw plugins`](/pl/cli/plugins) - pełna dokumentacja CLI
- [Inwentarz Plugin](/pl/plugins/plugin-inventory) - wygenerowana lista wbudowanych i zewnętrznych Plugin
- [Dokumentacja Plugin](/pl/plugins/reference) - wygenerowane strony dokumentacji dla poszczególnych Plugin
- [Społecznościowe Plugin](/pl/plugins/community) - odkrywanie ClawHub i polityka PR do dokumentacji
- [Rozwiązywanie zależności Plugin](/pl/plugins/dependency-resolution) - rooty instalacji, rekordy rejestru i granice runtime
- [Budowanie Plugin](/pl/plugins/building-plugins) - przewodnik tworzenia natywnych Plugin
- [Omówienie Plugin SDK](/pl/plugins/sdk-overview) - rejestracja runtime, hooki i pola API
- [Manifest Plugin](/pl/plugins/manifest) - metadane manifestu i pakietu
