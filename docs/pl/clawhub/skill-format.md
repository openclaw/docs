---
read_when:
    - Publikowanie Skills
    - Debugowanie błędów publikacji
summary: Format folderu Skills, wymagane pliki, dozwolone typy plików, limity.
x-i18n:
    generated_at: "2026-07-02T22:51:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bbd17c0b7a5c4e6ad6c554bdd3f604424283990503a1c493f49000fbfbb29712
    source_path: clawhub/skill-format.md
    workflow: 16
---

# Format umiejętności

## Na dysku

Umiejętność jest folderem.

Wymagane:

- `SKILL.md` (lub `skill.md`; starsze `skills.md` jest również akceptowane)

Opcjonalne:

- dowolne pomocnicze pliki _tekstowe_ (zobacz „Dozwolone pliki”)
- `.clawhubignore` (wzorce ignorowania przy publikowaniu, starsze `.clawdhubignore`)
- `.gitignore` (również respektowane)

## Import z GitHub

Webowy importer GitHub jest bardziej rygorystyczny niż lokalne publikowanie/synchronizacja. Wykrywa tylko pliki
`SKILL.md` lub starsze `skills.md` w publicznych repozytoriach, które nie są forkami i należą do
zalogowanego konta GitHub. Nie importuje prywatnych repozytoriów, forków,
zarchiwizowanych/wyłączonych repozytoriów ani publicznych repozytoriów stron trzecich.

Metadane lokalnej instalacji (zapisywane przez CLI):

- `<skill>/.clawhub/origin.json` (starsze `.clawdhub`)

Stan instalacji w katalogu roboczym (zapisywany przez CLI):

- `<workdir>/.clawhub/lock.json` (starsze `.clawdhub`)

## `SKILL.md`

- Markdown z opcjonalnym frontmatter YAML.
- Serwer wyodrębnia metadane z frontmatter podczas publikowania.
- `description` jest używane jako podsumowanie umiejętności w UI/wyszukiwaniu.

## Metadane frontmatter

Metadane umiejętności są deklarowane we frontmatter YAML na początku pliku `SKILL.md`. Informuje to rejestr (oraz analizę bezpieczeństwa), czego umiejętność potrzebuje do działania.

### Podstawowy frontmatter

```yaml
---
name: my-skill
description: Krótkie podsumowanie działania tej umiejętności.
version: 1.0.0
---
```

### Metadane środowiska uruchomieniowego (`metadata.openclaw`)

Zadeklaruj wymagania środowiska uruchomieniowego umiejętności w `metadata.openclaw` (aliasy: `metadata.clawdbot`, `metadata.clawdis`).

```yaml
---
name: my-skill
description: Zarządzaj zadaniami przez API Todoist.
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

### Pełna lista pól

| Pole               | Typ        | Opis                                                                                                                                                 |
| ------------------ | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `requires.env`     | `string[]` | Wymagane zmienne środowiskowe oczekiwane przez umiejętność.                                                                                          |
| `requires.bins`    | `string[]` | Pliki binarne CLI, które wszystkie muszą być zainstalowane.                                                                                          |
| `requires.anyBins` | `string[]` | Pliki binarne CLI, z których co najmniej jeden musi istnieć.                                                                                         |
| `requires.config`  | `string[]` | Ścieżki plików konfiguracyjnych odczytywanych przez umiejętność.                                                                                     |
| `primaryEnv`       | `string`   | Główna zmienna środowiskowa z poświadczeniem dla umiejętności.                                                                                       |
| `envVars`          | `array`    | Deklaracje zmiennych środowiskowych z `name`, opcjonalnym `required` i opcjonalnym `description`. Ustaw `required: false` dla opcjonalnych zmiennych. |
| `always`           | `boolean`  | Jeśli `true`, umiejętność jest zawsze aktywna (bez potrzeby jawnej instalacji).                                                                       |
| `skillKey`         | `string`   | Nadpisuje klucz wywołania umiejętności.                                                                                                              |
| `emoji`            | `string`   | Emoji wyświetlane dla umiejętności.                                                                                                                  |
| `homepage`         | `string`   | URL strony głównej lub dokumentacji umiejętności.                                                                                                    |
| `os`               | `string[]` | Ograniczenia systemu operacyjnego (np. `["macos"]`, `["linux"]`).                                                                                    |
| `install`          | `array`    | Specyfikacje instalacji zależności (zobacz niżej).                                                                                                   |
| `nix`              | `object`   | Specyfikacja Plugin Nix (zobacz README).                                                                                                            |
| `config`           | `object`   | Specyfikacja konfiguracji Clawdbot (zobacz README).                                                                                                  |

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

Zadeklaruj opcjonalne zmienne środowiskowe w `metadata.openclaw.envVars` i ustaw `required: false`. Nie dodawaj opcjonalnych wpisów do `requires.env`, ponieważ `requires.env` oznacza, że umiejętność nie może działać bez tych zmiennych.

```yaml
metadata:
  openclaw:
    primaryEnv: TODOIST_API_KEY
    envVars:
      - name: TODOIST_API_KEY
        required: true
        description: Token API Todoist używany do uwierzytelnionych żądań.
      - name: TODOIST_PROJECT_ID
        required: false
        description: Opcjonalny domyślny identyfikator projektu, gdy użytkownik go nie poda.
```

### Dlaczego to ma znaczenie

Analiza bezpieczeństwa ClawHub sprawdza, czy deklaracje umiejętności są zgodne z tym, co faktycznie robi. Jeśli kod odwołuje się do `TODOIST_API_KEY`, ale frontmatter nie deklaruje jej w `requires.env`, `primaryEnv` ani `envVars`, analiza oznaczy niezgodność metadanych. Utrzymywanie dokładnych deklaracji pomaga umiejętności przejść weryfikację i pomaga użytkownikom zrozumieć, co instalują.

### Przykład: kompletny frontmatter

```yaml
---
name: todoist-cli
description: Zarządzaj zadaniami, projektami i etykietami Todoist z wiersza poleceń.
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
        description: Token API Todoist.
      - name: TODOIST_PROJECT_ID
        required: false
        description: Opcjonalny domyślny identyfikator projektu.
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

- Całkowity rozmiar pakietu: 50 MB.
- Tekst osadzany obejmuje `SKILL.md` + do około 40 plików innych niż `.md` (limit best-effort).

## Slugi

- Domyślnie wyprowadzane z nazwy folderu.
- Zakresy pakietów muszą dokładnie odpowiadać uchwytowi wydawcy ClawHub. Uchwyty wydawców mogą używać małych liter, cyfr, łączników, kropek i podkreśleń; muszą zaczynać się i kończyć małą literą lub cyfrą.
- Slugi pakietów muszą być pisane małymi literami i bezpieczne dla npm, na przykład `@example.tools/demo-plugin` lub `demo-plugin`.

## Wersjonowanie + tagi

- Każda publikacja tworzy nową wersję (semver).
- Tagi są wskaźnikami tekstowymi do wersji; często używany jest `latest`.

## Licencja

- Wszystkie umiejętności opublikowane w ClawHub są licencjonowane na warunkach `MIT-0`.
- Każdy może używać, modyfikować i redystrybuować opublikowane umiejętności, również komercyjnie.
- Atrybucja nie jest wymagana.
- Nie dodawaj sprzecznych warunków licencji w `SKILL.md`; ClawHub nie obsługuje nadpisywania licencji dla poszczególnych umiejętności.

## Płatne umiejętności

- ClawHub nie obsługuje płatnych umiejętności, wyceny dla poszczególnych umiejętności, paywalli ani udziału w przychodach.
- Nie dodawaj metadanych cenowych do `SKILL.md`; nie są częścią formatu umiejętności i nie sprawią, że opublikowana umiejętność stanie się płatna.
- Jeśli umiejętność integruje się z płatną usługą strony trzeciej, jasno udokumentuj zewnętrzny koszt i wymagane konto w instrukcjach umiejętności oraz deklaracjach zmiennych środowiskowych (`requires.env` dla wymaganych zmiennych lub `envVars` z `required: false` dla zmiennych opcjonalnych).
