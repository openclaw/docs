---
read_when:
    - Publikowanie Skills
    - Debugowanie niepowodzeń publikowania
summary: Format folderu Skills, wymagane pliki, dozwolone typy plików, limity.
x-i18n:
    generated_at: "2026-06-28T22:32:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bbd17c0b7a5c4e6ad6c554bdd3f604424283990503a1c493f49000fbfbb29712
    source_path: clawhub/skill-format.md
    workflow: 16
---

# Format umiejętności

## Na dysku

Umiejętność to folder.

Wymagane:

- `SKILL.md` (lub `skill.md`; starsze `skills.md` jest również akceptowane)

Opcjonalne:

- dowolne pomocnicze pliki _tekstowe_ (zobacz „Dozwolone pliki”)
- `.clawhubignore` (wzorce ignorowania podczas publikowania, starsze `.clawdhubignore`)
- `.gitignore` (również respektowany)

## Import z GitHub

Webowy importer GitHub jest bardziej rygorystyczny niż lokalne publikowanie/synchronizacja. Wykrywa tylko pliki
`SKILL.md` lub starsze `skills.md` w publicznych repozytoriach, które nie są forkami i należą do
zalogowanego konta GitHub. Nie importuje repozytoriów prywatnych, forków,
repozytoriów zarchiwizowanych/wyłączonych ani publicznych repozytoriów firm trzecich.

Lokalne metadane instalacji (zapisywane przez CLI):

- `<skill>/.clawhub/origin.json` (starsze `.clawdhub`)

Stan instalacji w katalogu roboczym (zapisywany przez CLI):

- `<workdir>/.clawhub/lock.json` (starsze `.clawdhub`)

## `SKILL.md`

- Markdown z opcjonalnym frontmatter YAML.
- Serwer wyodrębnia metadane z frontmatter podczas publikowania.
- `description` jest używane jako podsumowanie umiejętności w UI/wyszukiwaniu.

## Metadane frontmatter

Metadane umiejętności deklaruje się we frontmatter YAML na początku pliku `SKILL.md`. Informuje to rejestr (oraz analizę bezpieczeństwa), czego umiejętność potrzebuje do działania.

### Podstawowy frontmatter

```yaml
---
name: my-skill
description: Short summary of what this skill does.
version: 1.0.0
---
```

### Metadane środowiska uruchomieniowego (`metadata.openclaw`)

Zadeklaruj wymagania środowiska uruchomieniowego umiejętności pod `metadata.openclaw` (aliasy: `metadata.clawdbot`, `metadata.clawdis`).

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

### Pełna dokumentacja pól

| Pole               | Typ        | Opis                                                                                                                                                  |
| ------------------ | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `requires.env`     | `string[]` | Wymagane zmienne środowiskowe, których oczekuje umiejętność.                                                                                          |
| `requires.bins`    | `string[]` | Pliki binarne CLI, które muszą być wszystkie zainstalowane.                                                                                           |
| `requires.anyBins` | `string[]` | Pliki binarne CLI, z których co najmniej jeden musi istnieć.                                                                                          |
| `requires.config`  | `string[]` | Ścieżki plików konfiguracyjnych odczytywanych przez umiejętność.                                                                                      |
| `primaryEnv`       | `string`   | Główna zmienna środowiskowa poświadczeń dla umiejętności.                                                                                             |
| `envVars`          | `array`    | Deklaracje zmiennych środowiskowych z `name`, opcjonalnym `required` i opcjonalnym `description`. Ustaw `required: false` dla opcjonalnych zmiennych środowiskowych. |
| `always`           | `boolean`  | Jeśli `true`, umiejętność jest zawsze aktywna (nie wymaga jawnej instalacji).                                                                          |
| `skillKey`         | `string`   | Nadpisuje klucz wywołania umiejętności.                                                                                                               |
| `emoji`            | `string`   | Emoji wyświetlane dla umiejętności.                                                                                                                   |
| `homepage`         | `string`   | URL strony domowej lub dokumentacji umiejętności.                                                                                                     |
| `os`               | `string[]` | Ograniczenia systemu operacyjnego (np. `["macos"]`, `["linux"]`).                                                                                     |
| `install`          | `array`    | Specyfikacje instalacji zależności (zobacz niżej).                                                                                                    |
| `nix`              | `object`   | Specyfikacja Nix Plugin (zobacz README).                                                                                                              |
| `config`           | `object`   | Specyfikacja konfiguracji Clawdbot (zobacz README).                                                                                                   |

### Specyfikacje instalacji

Jeśli umiejętność wymaga zainstalowania zależności, zadeklaruj je w tablicy `install`:

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

Zadeklaruj opcjonalne zmienne środowiskowe pod `metadata.openclaw.envVars` i ustaw `required: false`. Nie dodawaj opcjonalnych wpisów do `requires.env`, ponieważ `requires.env` oznacza, że umiejętność nie może działać bez tych zmiennych.

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

Analiza bezpieczeństwa ClawHub sprawdza, czy deklaracje umiejętności są zgodne z tym, co faktycznie robi. Jeśli kod odwołuje się do `TODOIST_API_KEY`, ale frontmatter nie deklaruje jej pod `requires.env`, `primaryEnv` ani `envVars`, analiza zgłosi niezgodność metadanych. Dokładne deklaracje pomagają umiejętności przejść przegląd i pomagają użytkownikom zrozumieć, co instalują.

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
- Typy zawartości zaczynające się od `text/` są traktowane jako tekst; dodatkowo obowiązuje mała lista dozwolonych typów (JSON/YAML/TOML/JS/TS/Markdown/SVG).

Limity (po stronie serwera):

- Łączny rozmiar pakietu: 50 MB.
- Osadzany tekst obejmuje `SKILL.md` + do około 40 plików innych niż `.md` (limit best-effort).

## Slugi

- Domyślnie wyprowadzane z nazwy folderu.
- Zakresy pakietów muszą dokładnie odpowiadać uchwytowi wydawcy ClawHub. Uchwyty wydawców mogą używać małych liter, cyfr, łączników, kropek i podkreśleń; muszą zaczynać się i kończyć małą literą lub cyfrą.
- Slugi pakietów muszą być pisane małymi literami i bezpieczne dla npm, na przykład `@example.tools/demo-plugin` lub `demo-plugin`.

## Wersjonowanie + tagi

- Każda publikacja tworzy nową wersję (semver).
- Tagi są wskaźnikami tekstowymi do wersji; często używa się `latest`.

## Licencja

- Wszystkie umiejętności opublikowane w ClawHub są licencjonowane na warunkach `MIT-0`.
- Każdy może używać, modyfikować i redystrybuować opublikowane umiejętności, również komercyjnie.
- Atrybucja nie jest wymagana.
- Nie dodawaj sprzecznych warunków licencyjnych w `SKILL.md`; ClawHub nie obsługuje nadpisywania licencji dla poszczególnych umiejętności.

## Płatne umiejętności

- ClawHub nie obsługuje płatnych umiejętności, cen dla poszczególnych umiejętności, paywalli ani udziału w przychodach.
- Nie dodawaj metadanych cenowych do `SKILL.md`; nie są częścią formatu umiejętności i nie sprawią, że opublikowana umiejętność stanie się płatna.
- Jeśli umiejętność integruje się z płatną usługą firmy trzeciej, jasno udokumentuj zewnętrzny koszt i wymagane konto w instrukcjach umiejętności oraz deklaracjach środowiskowych (`requires.env` dla wymaganych zmiennych albo `envVars` z `required: false` dla zmiennych opcjonalnych).
