---
read_when:
    - Publikowanie Skills
    - Debugowanie niepowodzeń publikowania
summary: Format folderu Skills, wymagane pliki, dozwolone typy plików, limity.
x-i18n:
    generated_at: "2026-07-02T01:17:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bbd17c0b7a5c4e6ad6c554bdd3f604424283990503a1c493f49000fbfbb29712
    source_path: clawhub/skill-format.md
    workflow: 16
---

# Format skilla

## Na dysku

Skill jest folderem.

Wymagane:

- `SKILL.md` (lub `skill.md`; starsze `skills.md` jest również akceptowane)

Opcjonalne:

- dowolne pomocnicze pliki _tekstowe_ (zobacz „Dozwolone pliki”)
- `.clawhubignore` (wzorce ignorowania przy publikowaniu, starsze `.clawdhubignore`)
- `.gitignore` (również respektowane)

## Import z GitHub

Webowy importer GitHub jest bardziej rygorystyczny niż lokalne publikowanie/synchronizacja. Wykrywa tylko
pliki `SKILL.md` lub starsze `skills.md` w publicznych repozytoriach, które nie są forkami i należą do
zalogowanego konta GitHub. Nie importuje prywatnych repozytoriów, forków,
repozytoriów zarchiwizowanych/wyłączonych ani publicznych repozytoriów innych firm.

Lokalne metadane instalacji (zapisywane przez CLI):

- `<skill>/.clawhub/origin.json` (starsze `.clawdhub`)

Stan instalacji w katalogu roboczym (zapisywany przez CLI):

- `<workdir>/.clawhub/lock.json` (starsze `.clawdhub`)

## `SKILL.md`

- Markdown z opcjonalnym frontmatter YAML.
- Serwer wyodrębnia metadane z frontmatter podczas publikowania.
- `description` jest używane jako podsumowanie skilla w UI/wyszukiwaniu.

## Metadane frontmatter

Metadane skilla są deklarowane we frontmatter YAML na początku pliku `SKILL.md`. Informuje to rejestr (oraz analizę bezpieczeństwa), czego skill potrzebuje do działania.

### Podstawowy frontmatter

```yaml
---
name: my-skill
description: Short summary of what this skill does.
version: 1.0.0
---
```

### Metadane środowiska uruchomieniowego (`metadata.openclaw`)

Zadeklaruj wymagania środowiska uruchomieniowego skilla w `metadata.openclaw` (aliasy: `metadata.clawdbot`, `metadata.clawdis`).

```yaml
---
name: my-skill
description: Manage tasks via the Todoist API.
metadata:
  openclaw:
    requires:
      env:
        - TODOIST_API_KEY
      bins:
        - curl
    primaryEnv: TODOIST_API_KEY
---
```

Użyj `requires.env` dla zmiennych środowiskowych, które muszą być obecne, zanim skill będzie mógł działać. Użyj `envVars`, gdy potrzebujesz metadanych dla poszczególnych zmiennych, w tym zmiennych opcjonalnych z `required: false`.

### Pełna dokumentacja pól

| Pole               | Typ        | Opis                                                                                                                                                  |
| ------------------ | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `requires.env`     | `string[]` | Wymagane zmienne środowiskowe, których oczekuje skill.                                                                                                |
| `requires.bins`    | `string[]` | Binaria CLI, które muszą być wszystkie zainstalowane.                                                                                                 |
| `requires.anyBins` | `string[]` | Binaria CLI, z których co najmniej jedno musi istnieć.                                                                                                |
| `requires.config`  | `string[]` | Ścieżki plików konfiguracyjnych odczytywanych przez skill.                                                                                            |
| `primaryEnv`       | `string`   | Główna zmienna środowiskowa z poświadczeniem dla skilla.                                                                                              |
| `envVars`          | `array`    | Deklaracje zmiennych środowiskowych z `name`, opcjonalnym `required` i opcjonalnym `description`. Ustaw `required: false` dla opcjonalnych zmiennych. |
| `always`           | `boolean`  | Jeśli `true`, skill jest zawsze aktywny (bez potrzeby jawnej instalacji).                                                                             |
| `skillKey`         | `string`   | Nadpisuje klucz wywołania skilla.                                                                                                                     |
| `emoji`            | `string`   | Emoji wyświetlane dla skilla.                                                                                                                         |
| `homepage`         | `string`   | URL strony głównej lub dokumentacji skilla.                                                                                                           |
| `os`               | `string[]` | Ograniczenia systemu operacyjnego (np. `["macos"]`, `["linux"]`).                                                                                     |
| `install`          | `array`    | Specyfikacje instalacji zależności (zobacz poniżej).                                                                                                  |
| `nix`              | `object`   | Specyfikacja Plugin Nix (zobacz README).                                                                                                             |
| `config`           | `object`   | Specyfikacja konfiguracji Clawdbot (zobacz README).                                                                                                  |

### Specyfikacje instalacji

Jeśli skill potrzebuje zainstalowanych zależności, zadeklaruj je w tablicy `install`:

```yaml
metadata:
  openclaw:
    install:
      - kind: brew
        formula: jq
        bins: [jq]
      - kind: node
        package: typescript
        bins: [tsc]
```

Obsługiwane rodzaje instalacji: `brew`, `node`, `go`, `uv`.

### Opcjonalne zmienne środowiskowe

Zadeklaruj opcjonalne zmienne środowiskowe w `metadata.openclaw.envVars` i ustaw `required: false`. Nie dodawaj opcjonalnych wpisów do `requires.env`, ponieważ `requires.env` oznacza, że skill nie może bez nich działać.

```yaml
metadata:
  openclaw:
    primaryEnv: TODOIST_API_KEY
    envVars:
      - name: TODOIST_API_KEY
        required: true
        description: Todoist API token used for authenticated requests.
      - name: TODOIST_PROJECT_ID
        required: false
        description: Optional default project ID when the user does not specify one.
```

### Dlaczego to ma znaczenie

Analiza bezpieczeństwa ClawHub sprawdza, czy to, co deklaruje skill, odpowiada temu, co faktycznie robi. Jeśli kod odwołuje się do `TODOIST_API_KEY`, ale frontmatter nie deklaruje go w `requires.env`, `primaryEnv` ani `envVars`, analiza zgłosi niezgodność metadanych. Utrzymywanie dokładnych deklaracji pomaga skillowi przejść przegląd i pomaga użytkownikom zrozumieć, co instalują.

### Przykład: kompletny frontmatter

```yaml
---
name: todoist-cli
description: Manage Todoist tasks, projects, and labels from the command line.
version: 1.2.0
metadata:
  openclaw:
    requires:
      env:
        - TODOIST_API_KEY
      bins:
        - curl
    primaryEnv: TODOIST_API_KEY
    envVars:
      - name: TODOIST_API_KEY
        required: true
        description: Todoist API token.
      - name: TODOIST_PROJECT_ID
        required: false
        description: Optional default project ID.
    emoji: "\u2705"
    homepage: https://github.com/example/todoist-cli
---
```

## Dozwolone pliki

Publikowanie akceptuje tylko pliki „tekstowe”.

- Lista dozwolonych rozszerzeń znajduje się w `packages/schema/src/textFiles.ts` (`TEXT_FILE_EXTENSIONS`).
- Pliki skryptów są nadal skanowane po przesłaniu; pliki PowerShell `.ps1`, `.psm1` i `.psd1` są akceptowane jako tekst.
- Typy treści zaczynające się od `text/` są traktowane jako tekst; dodatkowo obowiązuje mała lista dozwolonych typów (JSON/YAML/TOML/JS/TS/Markdown/SVG).

Limity (po stronie serwera):

- Całkowity rozmiar pakietu: 50MB.
- Osadzany tekst obejmuje `SKILL.md` + do około 40 plików innych niż `.md` (limit best-effort).

## Slugi

- Domyślnie wyprowadzane z nazwy folderu.
- Zakresy pakietów muszą dokładnie odpowiadać uchwytowi wydawcy ClawHub. Uchwyty wydawców mogą używać małych liter, cyfr, łączników, kropek i podkreśleń; muszą zaczynać się i kończyć małą literą lub cyfrą.
- Slugi pakietów muszą być zapisane małymi literami i zgodne z npm, na przykład `@example.tools/demo-plugin` lub `demo-plugin`.

## Wersjonowanie + tagi

- Każda publikacja tworzy nową wersję (semver).
- Tagi są wskaźnikami tekstowymi do wersji; często używa się `latest`.

## Licencja

- Wszystkie skille publikowane w ClawHub są licencjonowane na zasadach `MIT-0`.
- Każdy może używać, modyfikować i redystrybuować opublikowane skille, również komercyjnie.
- Atrybucja nie jest wymagana.
- Nie dodawaj sprzecznych warunków licencyjnych w `SKILL.md`; ClawHub nie obsługuje nadpisań licencji dla poszczególnych skilli.

## Płatne skille

- ClawHub nie obsługuje płatnych skilli, wyceny dla poszczególnych skilli, paywalli ani udziału w przychodach.
- Nie dodawaj metadanych cenowych do `SKILL.md`; nie są częścią formatu skilla i nie sprawią, że opublikowany skill stanie się płatny.
- Jeśli skill integruje się z płatną usługą zewnętrzną, jasno udokumentuj zewnętrzny koszt i wymagane konto w instrukcjach skilla oraz deklaracjach zmiennych środowiskowych (`requires.env` dla wymaganych zmiennych albo `envVars` z `required: false` dla zmiennych opcjonalnych).
