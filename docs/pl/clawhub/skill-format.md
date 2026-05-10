---
read_when:
    - Publikowanie Skills
    - Debugowanie błędów publikowania/synchronizacji
summary: Format folderu Skill, wymagane pliki, dozwolone typy plików, limity.
x-i18n:
    generated_at: "2026-05-10T19:26:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 76c6a9f1c5b7b8df66a460d0f74b39581e40f43dbe99b825800e709ec57bd2fb
    source_path: clawhub/skill-format.md
    workflow: 16
---

# Format umiejętności

## Na dysku

Umiejętność to folder.

Wymagane:

- `SKILL.md` (lub `skill.md`)

Opcjonalne:

- dowolne pomocnicze pliki _tekstowe_ (zobacz „Dozwolone pliki”)
- `.clawhubignore` (wzorce ignorowania dla publikowania/synchronizacji, starsze `.clawdhubignore`)
- `.gitignore` (również uwzględniany)

Lokalne metadane instalacji (zapisywane przez CLI):

- `<skill>/.clawhub/origin.json` (starsze `.clawdhub`)

Stan instalacji w katalogu roboczym (zapisywany przez CLI):

- `<workdir>/.clawhub/lock.json` (starsze `.clawdhub`)

## `SKILL.md`

- Markdown z opcjonalnym frontmatter YAML.
- Serwer wyodrębnia metadane z frontmatter podczas publikowania.
- `description` jest używane jako podsumowanie umiejętności w interfejsie użytkownika/wyszukiwaniu.

## Metadane frontmatter

Metadane umiejętności są deklarowane we frontmatter YAML na początku pliku `SKILL.md`. Informuje to rejestr (i analizę bezpieczeństwa), czego Twoja umiejętność potrzebuje do uruchomienia.

### Podstawowy frontmatter

```yaml
---
name: my-skill
description: Short summary of what this skill does.
version: 1.0.0
---
```

### Metadane środowiska uruchomieniowego (`metadata.openclaw`)

Zadeklaruj wymagania środowiska uruchomieniowego swojej umiejętności w `metadata.openclaw` (aliasy: `metadata.clawdbot`, `metadata.clawdis`).

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

Użyj `requires.env` dla zmiennych środowiskowych, które muszą być obecne, zanim umiejętność będzie mogła działać. Użyj `envVars`, gdy potrzebujesz metadanych dla poszczególnych zmiennych, w tym zmiennych opcjonalnych z `required: false`.

### Pełny opis pól

| Pole               | Typ        | Opis                                                                                                                                                                  |
| ------------------ | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `requires.env`     | `string[]` | Wymagane zmienne środowiskowe, których oczekuje Twoja umiejętność.                                                                                                    |
| `requires.bins`    | `string[]` | Pliki binarne CLI, które wszystkie muszą być zainstalowane.                                                                                                           |
| `requires.anyBins` | `string[]` | Pliki binarne CLI, z których co najmniej jeden musi istnieć.                                                                                                          |
| `requires.config`  | `string[]` | Ścieżki plików konfiguracyjnych odczytywane przez Twoją umiejętność.                                                                                                  |
| `primaryEnv`       | `string`   | Główna zmienna środowiskowa poświadczeń dla Twojej umiejętności.                                                                                                      |
| `envVars`          | `array`    | Deklaracje zmiennych środowiskowych z `name`, opcjonalnym `required` i opcjonalnym `description`. Ustaw `required: false` dla opcjonalnych zmiennych środowiskowych. |
| `always`           | `boolean`  | Jeśli `true`, umiejętność jest zawsze aktywna (nie jest wymagana jawna instalacja).                                                                                   |
| `skillKey`         | `string`   | Zastępuje klucz wywołania umiejętności.                                                                                                                              |
| `emoji`            | `string`   | Emoji wyświetlane dla umiejętności.                                                                                                                                  |
| `homepage`         | `string`   | URL strony głównej lub dokumentacji umiejętności.                                                                                                                    |
| `os`               | `string[]` | Ograniczenia systemu operacyjnego (np. `["macos"]`, `["linux"]`).                                                                                                    |
| `install`          | `array`    | Specyfikacje instalacji zależności (zobacz poniżej).                                                                                                                 |
| `nix`              | `object`   | Specyfikacja pluginu Nix (zobacz README).                                                                                                                            |
| `config`           | `object`   | Specyfikacja konfiguracji Clawdbot (zobacz README).                                                                                                                  |

### Specyfikacje instalacji

Jeśli Twoja umiejętność wymaga zainstalowania zależności, zadeklaruj je w tablicy `install`:

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

Zadeklaruj opcjonalne zmienne środowiskowe w `metadata.openclaw.envVars` i ustaw `required: false`. Nie dodawaj opcjonalnych wpisów do `requires.env`, ponieważ `requires.env` oznacza, że umiejętność nie może działać bez tych zmiennych.

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

Analiza bezpieczeństwa ClawHub sprawdza, czy to, co deklaruje Twoja umiejętność, odpowiada temu, co faktycznie robi. Jeśli Twój kod odwołuje się do `TODOIST_API_KEY`, ale frontmatter nie deklaruje go w `requires.env`, `primaryEnv` ani `envVars`, analiza oznaczy niezgodność metadanych. Utrzymywanie dokładnych deklaracji pomaga Twojej umiejętności przejść przegląd i pomaga użytkownikom zrozumieć, co instalują.

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

- Całkowity rozmiar pakietu: 50 MB.
- Tekst osadzania obejmuje `SKILL.md` + maksymalnie około 40 plików innych niż `.md` (limit stosowany w miarę możliwości).

## Slugi

- Domyślnie wyprowadzane z nazwy folderu.
- Muszą być zapisane małymi literami i bezpieczne dla URL: `^[a-z0-9][a-z0-9-]*$`.

## Wersjonowanie + tagi

- Każda publikacja tworzy nową wersję (semver).
- Tagi są wskaźnikami tekstowymi do wersji; często używany jest `latest`.

## Licencja

- Wszystkie umiejętności opublikowane w ClawHub są licencjonowane na warunkach `MIT-0`.
- Każdy może używać, modyfikować i redystrybuować opublikowane umiejętności, w tym komercyjnie.
- Uznanie autorstwa nie jest wymagane.
- Nie dodawaj sprzecznych warunków licencyjnych w `SKILL.md`; ClawHub nie obsługuje zastępowania licencji dla poszczególnych umiejętności.

## Płatne umiejętności

- ClawHub nie obsługuje płatnych umiejętności, cen dla poszczególnych umiejętności, płatnych ograniczeń dostępu ani podziału przychodów.
- Nie dodawaj metadanych cenowych do `SKILL.md`; nie są one częścią formatu umiejętności i nie sprawią, że opublikowana umiejętność będzie płatna.
- Jeśli Twoja umiejętność integruje się z płatną usługą zewnętrzną, jasno udokumentuj koszt zewnętrzny i wymagane konto w instrukcjach umiejętności oraz deklaracjach zmiennych środowiskowych (`requires.env` dla wymaganych zmiennych albo `envVars` z `required: false` dla zmiennych opcjonalnych).
