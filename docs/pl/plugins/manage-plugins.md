---
doc-schema-version: 1
read_when:
    - Chcesz szybko zobaczyć przykłady listy pluginów, instalacji, aktualizacji, inspekcji lub odinstalowania
    - Chcesz wybrać źródło instalacji Plugin
    - Chcesz mieć właściwy punkt odniesienia do publikowania pakietów pluginów
sidebarTitle: Manage plugins
summary: Szybkie przykłady wyświetlania listy, instalowania, aktualizowania, sprawdzania i odinstalowywania Pluginów OpenClaw
title: Zarządzanie pluginami
x-i18n:
    generated_at: "2026-06-27T17:54:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dd0c1143c6312603311931cbbdc63069a44bc5ec487e2a46b0266b86a556da4e
    source_path: plugins/manage-plugins.md
    workflow: 16
---

Użyj tej strony do typowych poleceń zarządzania wtyczkami. Pełny kontrakt
poleceń, flagi, reguły wyboru źródła i przypadki brzegowe znajdziesz w
[`openclaw plugins`](/pl/cli/plugins).

Większość przepływów instalacji wygląda tak:

1. znajdź pakiet
2. zainstaluj go z ClawHub, npm, git albo ścieżki lokalnej
3. pozwól zarządzanemu Gateway automatycznie się zrestartować albo zrestartuj go ręcznie, gdy nie jest zarządzany
4. zweryfikuj rejestracje wykonawcze wtyczki

## Wyświetlanie i wyszukiwanie wtyczek

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
openclaw plugins search "calendar"
```

Użyj `--json` w skryptach:

```bash
openclaw plugins list --json \
  | jq '.plugins[] | {id, enabled, format, source, dependencyStatus}'
```

`plugins list` to zimne sprawdzenie inwentarza. Pokazuje, co OpenClaw może wykryć
z konfiguracji, manifestów i rejestru wtyczek; nie dowodzi, że już uruchomiony
Gateway zaimportował runtime wtyczki. Dane wyjściowe JSON zawierają diagnostykę
rejestru oraz statyczny `dependencyStatus` każdej wtyczki, gdy pakiet wtyczki
deklaruje `dependencies` albo `optionalDependencies`.

`plugins search` odpytuje ClawHub o instalowalne pakiety wtyczek i wypisuje
wskazówki instalacyjne, takie jak `openclaw plugins install clawhub:<package>`.

## Instalowanie wtyczek

```bash
# Search ClawHub for plugin packages.
openclaw plugins search "calendar"

# Install from ClawHub.
openclaw plugins install clawhub:<package>
openclaw plugins install clawhub:<package>@1.2.3
openclaw plugins install clawhub:<package>@beta

# Install from npm.
openclaw plugins install npm:<package>
openclaw plugins install npm:@scope/openclaw-plugin@1.2.3
openclaw plugins install npm:@openclaw/codex

# Install from a local npm pack artifact.
openclaw plugins install npm-pack:<path.tgz>

# Install from git or a local development checkout.
openclaw plugins install git:github.com/acme/openclaw-plugin@v1.0.0
openclaw plugins install ./my-plugin
openclaw plugins install --link ./my-plugin
```

Nieprefiksowane specyfikacje pakietów instalują z npm podczas przejścia
uruchomieniowego. Użyj `clawhub:`, `npm:`, `git:` albo `npm-pack:`, gdy
potrzebujesz deterministycznego wyboru źródła. Jeśli nieprefiksowana nazwa
pasuje do oficjalnego identyfikatora wtyczki, OpenClaw może bezpośrednio
zainstalować wpis katalogowy.

Używaj `--force` tylko wtedy, gdy celowo chcesz nadpisać istniejący cel
instalacji. Do rutynowych aktualizacji śledzonych instalacji npm, ClawHub albo
hook-pack używaj `openclaw plugins update`.

## Restart i inspekcja

Po zainstalowaniu, zaktualizowaniu albo odinstalowaniu kodu wtyczki działający
zarządzany Gateway z włączonym ponownym ładowaniem konfiguracji restartuje się
automatycznie. Jeśli Gateway nie jest zarządzany albo ponowne ładowanie jest
wyłączone, zrestartuj go samodzielnie przed sprawdzeniem żywych powierzchni
runtime:

```bash
openclaw gateway restart
openclaw plugins inspect <plugin-id> --runtime --json
```

Użyj `inspect --runtime`, gdy potrzebujesz dowodu, że wtyczka zarejestrowała
powierzchnie runtime, takie jak narzędzia, haki, usługi, metody Gateway, trasy
HTTP albo polecenia CLI należące do wtyczki. Zwykłe `inspect` i `list` to zimne
sprawdzenia manifestu, konfiguracji i rejestru.

## Aktualizowanie wtyczek

```bash
openclaw plugins update <plugin-id>
openclaw plugins update <npm-package-or-spec>
openclaw plugins update --all
openclaw plugins update <plugin-id> --dry-run
```

Gdy podasz identyfikator wtyczki, OpenClaw ponownie użyje śledzonej specyfikacji
instalacji. Zapisane dist-tagi, takie jak `@beta`, oraz dokładnie przypięte
wersje nadal będą używane przy późniejszych uruchomieniach `update <plugin-id>`.

`openclaw plugins update --all` to ścieżka zbiorczej konserwacji. Nadal respektuje
zwykłe śledzone specyfikacje instalacji, ale zaufane oficjalne rekordy wtyczek
OpenClaw mogą synchronizować się z bieżącym celem oficjalnego katalogu zamiast
pozostawać przy nieaktualnym dokładnym pakiecie oficjalnym. Jeśli `update.channel`
jest ustawione na `beta`, ta zbiorcza oficjalna synchronizacja używa kontekstu
kanału beta. Użyj ukierunkowanego `update <plugin-id>`, gdy celowo chcesz
pozostawić dokładną albo otagowaną oficjalną specyfikację bez zmian.

W przypadku instalacji npm możesz podać jawną specyfikację pakietu, aby
przełączyć śledzony rekord:

```bash
openclaw plugins update @scope/openclaw-plugin@beta
openclaw plugins update @scope/openclaw-plugin
```

Drugie polecenie przenosi wtyczkę z powrotem na domyślną linię wydań rejestru,
gdy wcześniej była przypięta do dokładnej wersji albo tagu.

Gdy `openclaw update` działa na kanale beta, rekordy wtyczek mogą preferować
pasujące wydania `@beta`. Dokładne reguły fallbacku i przypinania opisuje
[`openclaw plugins`](/pl/cli/plugins#update).

## Odinstalowywanie wtyczek

```bash
openclaw plugins uninstall <plugin-id> --dry-run
openclaw plugins uninstall <plugin-id>
openclaw plugins uninstall <plugin-id> --keep-files
```

Odinstalowanie usuwa wpis konfiguracji wtyczki, utrwalony rekord indeksu
wtyczek, wpisy list allow/deny oraz podlinkowane ścieżki ładowania, gdy mają
zastosowanie. Zarządzane katalogi instalacji są usuwane, chyba że podasz
`--keep-files`. Działający zarządzany Gateway restartuje się automatycznie, gdy
odinstalowanie zmienia źródło wtyczki.

W trybie Nix (`OPENCLAW_NIX_MODE=1`) polecenia instalowania, aktualizowania,
odinstalowywania, włączania i wyłączania wtyczek są wyłączone. Zarządzaj tymi
wyborami w źródle Nix dla instalacji.

## Wybór źródła

| Źródło      | Użyj, gdy                                                                    | Przykład                                                       |
| ----------- | --------------------------------------------------------------------------- | -------------------------------------------------------------- |
| ClawHub     | Chcesz natywne dla OpenClaw wykrywanie, podsumowania skanów, wersje i wskazówki | `openclaw plugins install clawhub:<package>`                   |
| npmjs.com   | Już publikujesz pakiety JavaScript albo potrzebujesz dist-tagów npm/prywatnego rejestru | `openclaw plugins install npm:@acme/openclaw-plugin`           |
| git         | Chcesz gałąź, tag albo commit z repozytorium                                | `openclaw plugins install git:github.com/<owner>/<repo>@<ref>` |
| ścieżka lokalna | Rozwijasz albo testujesz wtyczkę na tej samej maszynie                  | `openclaw plugins install --link ./my-plugin`                  |
| npm pack    | Dowodzisz lokalny artefakt pakietu przez semantykę instalacji npm           | `openclaw plugins install npm-pack:<path.tgz>`                 |
| marketplace | Instalujesz wtyczkę marketplace zgodną z Claude                             | `openclaw plugins install <plugin> --marketplace <source>`     |

Zarządzane instalacje ze ścieżki lokalnej muszą być katalogami wtyczek albo
archiwami. Samodzielne pliki wtyczek umieszczaj w `plugins.load.paths` zamiast
instalować je przez `plugins install`.

## Publikowanie wtyczek

ClawHub to podstawowa publiczna powierzchnia odkrywania wtyczek OpenClaw.
Publikuj tam, gdy chcesz, aby użytkownicy znaleźli metadane wtyczki, historię
wersji, wyniki skanowania rejestru i wskazówki instalacyjne przed instalacją.

```bash
npm i -g clawhub
clawhub login
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
clawhub package publish your-org/your-plugin@v1.0.0
```

Natywne wtyczki npm muszą zawierać manifest wtyczki i metadane pakietu przed
publikacją:

```json package.json
{
  "name": "@acme/openclaw-plugin",
  "version": "1.0.0",
  "type": "module",
  "openclaw": {
    "extensions": ["./dist/index.js"]
  }
}
```

```bash
npm publish --access public
openclaw plugins install npm:@acme/openclaw-plugin
openclaw plugins install npm:@acme/openclaw-plugin@beta
openclaw plugins install npm:@acme/openclaw-plugin@1.0.0
```

Użyj tych stron jako pełnego kontraktu publikowania zamiast traktować tę stronę
jako referencję publikowania:

- [Publikowanie w ClawHub](/pl/clawhub/publishing) wyjaśnia właścicieli, zakresy, wydania,
  przegląd, walidację pakietów i transfer pakietów.
- [Tworzenie wtyczek](/pl/plugins/building-plugins) pokazuje kształt pakietu wtyczki
  i pierwszy przepływ publikowania.
- [Manifest wtyczki](/pl/plugins/manifest) definiuje pola natywnego manifestu wtyczki.

Jeśli ten sam pakiet jest dostępny zarówno w ClawHub, jak i npm, użyj jawnego
prefiksu `clawhub:` albo `npm:`, gdy musisz wymusić jedno źródło.

## Powiązane

- [Wtyczki](/pl/tools/plugin) - instalowanie, konfigurowanie, restartowanie i rozwiązywanie problemów
- [`openclaw plugins`](/pl/cli/plugins) - pełna dokumentacja CLI
- [Wtyczki społecznościowe](/pl/plugins/community) - publiczne odkrywanie i publikowanie w ClawHub
- [ClawHub](/pl/clawhub/cli) - operacje CLI rejestru
- [Tworzenie wtyczek](/pl/plugins/building-plugins) - utworzenie pakietu wtyczki
- [Manifest wtyczki](/pl/plugins/manifest) - manifest i metadane pakietu
