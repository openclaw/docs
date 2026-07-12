---
read_when:
    - Publikowanie Skills
    - Debugowanie niepowodzeń publikowania
summary: Format folderu Skills, wymagane pliki, dozwolone typy plików, limity.
x-i18n:
    generated_at: "2026-07-12T14:52:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5759edf5f509d16335bcecaa96b3b64a0d3f430e473ede2211831ba062638a15
    source_path: clawhub/skill-format.md
    workflow: 16
---

# Format Skills

## Na dysku

Skill to folder.

Wymagane:

- `SKILL.md` (lub `skill.md`; akceptowany jest również starszy plik `skills.md`)

Opcjonalne:

- dowolne pomocnicze pliki _tekstowe_ (zobacz „Dozwolone pliki”)
- `.clawhubignore` (wzorce ignorowania podczas publikowania, starsza nazwa `.clawdhubignore`)
- `.gitignore` (również uwzględniany)

## Import z GitHub

Internetowy importer GitHub ma bardziej rygorystyczne wymagania niż lokalne publikowanie i synchronizacja. Wykrywa wyłącznie pliki `SKILL.md` lub starsze pliki `skills.md` w publicznych repozytoriach niebędących forkami, które należą do zalogowanego konta GitHub. Nie importuje repozytoriów prywatnych, forków, repozytoriów zarchiwizowanych lub wyłączonych ani publicznych repozytoriów innych podmiotów.

Metadane instalacji lokalnej (zapisywane przez CLI):

- `<skill>/.clawhub/origin.json` (starsza nazwa `.clawdhub`)

Stan instalacji w katalogu roboczym (zapisywany przez CLI):

- `<workdir>/.clawhub/lock.json` (starsza nazwa `.clawdhub`)

## `SKILL.md`

- Markdown z opcjonalnym frontmatter YAML.
- Podczas publikowania serwer wyodrębnia metadane z frontmatter.
- Pole `description` służy jako podsumowanie Skilla w interfejsie i wynikach wyszukiwania.

W przypadku przenośnych Agent Skills wartość `name` powinna odpowiadać nazwie katalogu nadrzędnego i składać się z 1–64 małych liter, cyfr lub łączników. ClawHub przechowuje obsługiwany w routingu slug oddzielnie od nazwy wyświetlanej w katalogu, dzięki czemu istniejące nazwy pochodzące z innych klientów nadal można publikować i nie są one niejawnie zmieniane. Listy katalogowe mogą wizualnie skracać długie nazwy bez zmiany zapisanej nazwy.

## Metadane frontmatter

Metadane Skilla deklaruje się we frontmatter YAML na początku pliku `SKILL.md`. Informują one rejestr (oraz mechanizm analizy bezpieczeństwa), czego Skill potrzebuje do działania.

### Podstawowy frontmatter

```yaml
---
name: my-skill
description: Krótkie podsumowanie działania tego Skilla.
version: 1.0.0
---
```

### Metadane środowiska uruchomieniowego (`metadata.openclaw`)

Wymagania środowiska uruchomieniowego Skilla zadeklaruj w sekcji `metadata.openclaw` (aliasy: `metadata.clawdbot`, `metadata.clawdis`).

```yaml
---
name: my-skill
description: Zarządzaj zadaniami za pośrednictwem API Todoist.
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

Użyj `requires.env` dla zmiennych środowiskowych, które muszą być dostępne, zanim Skill będzie mógł działać. Użyj `envVars`, gdy potrzebujesz metadanych poszczególnych zmiennych, w tym zmiennych opcjonalnych z ustawieniem `required: false`.

### Pełna dokumentacja pól

| Pole               | Typ        | Opis                                                                                                                                                             |
| ------------------ | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `requires.env`     | `string[]` | Wymagane zmienne środowiskowe oczekiwane przez Skill.                                                                                                             |
| `requires.bins`    | `string[]` | Pliki wykonywalne CLI, które muszą być zainstalowane.                                                                                                             |
| `requires.anyBins` | `string[]` | Pliki wykonywalne CLI, z których co najmniej jeden musi być dostępny.                                                                                             |
| `requires.config`  | `string[]` | Ścieżki plików konfiguracyjnych odczytywanych przez Skill.                                                                                                        |
| `primaryEnv`       | `string`   | Główna zmienna środowiskowa zawierająca dane uwierzytelniające Skilla.                                                                                            |
| `envVars`          | `array`    | Deklaracje zmiennych środowiskowych zawierające `name` oraz opcjonalne pola `required` i `description`. Dla opcjonalnych zmiennych ustaw `required: false`.        |
| `always`           | `boolean`  | Jeśli ustawiono `true`, Skill jest zawsze aktywny (nie wymaga jawnej instalacji).                                                                                  |
| `skillKey`         | `string`   | Zastępuje klucz wywołania Skilla.                                                                                                                                 |
| `emoji`            | `string`   | Emoji wyświetlane dla Skilla.                                                                                                                                     |
| `homepage`         | `string`   | Adres URL strony głównej lub dokumentacji Skilla.                                                                                                                 |
| `os`               | `string[]` | Ograniczenia dotyczące systemu operacyjnego (np. `["macos"]`, `["linux"]`).                                                                                        |
| `install`          | `array`    | Specyfikacje instalacji zależności (zobacz poniżej).                                                                                                              |
| `nix`              | `object`   | Specyfikacja Pluginu Nix (zobacz README).                                                                                                                         |
| `config`           | `object`   | Specyfikacja konfiguracji Clawdbot (zobacz README).                                                                                                               |

### Specyfikacje instalacji

Jeśli Skill wymaga zainstalowania zależności, zadeklaruj je w tablicy `install`:

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

Zadeklaruj opcjonalne zmienne środowiskowe w sekcji `metadata.openclaw.envVars` i ustaw `required: false`. Nie dodawaj opcjonalnych wpisów do `requires.env`, ponieważ `requires.env` oznacza, że Skill nie może bez nich działać.

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
        description: Opcjonalny identyfikator projektu domyślnego używany, gdy użytkownik go nie określi.
```

### Dlaczego jest to ważne

Analiza bezpieczeństwa ClawHub sprawdza, czy deklaracje Skilla odpowiadają jego rzeczywistemu działaniu. Jeśli kod odwołuje się do `TODOIST_API_KEY`, ale frontmatter nie deklaruje tej zmiennej w `requires.env`, `primaryEnv` ani `envVars`, analiza zgłosi niezgodność metadanych. Utrzymywanie dokładnych deklaracji pomaga Skillowi przejść weryfikację i ułatwia użytkownikom zrozumienie, co instalują.

### Przykład: kompletny frontmatter

```yaml
---
name: todoist-cli
description: Zarządzaj zadaniami, projektami i etykietami Todoist z poziomu wiersza poleceń.
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
        description: Opcjonalny identyfikator projektu domyślnego.
    emoji: "\u2705"
    homepage: https://github.com/example/todoist-cli
---
```

## Dozwolone pliki

Podczas publikowania akceptowane są wyłącznie pliki „tekstowe”.

- Lista dozwolonych rozszerzeń znajduje się w `packages/schema/src/textFiles.ts` (`TEXT_FILE_EXTENSIONS`).
- Pliki skryptów są nadal skanowane po przesłaniu; pliki PowerShell `.ps1`, `.psm1` i `.psd1` są akceptowane jako tekst.
- Typy zawartości zaczynające się od `text/` są traktowane jako tekst, podobnie jak typy z niewielkiej listy dozwolonych formatów (JSON/YAML/TOML/JS/TS/Markdown/SVG).

Limity (po stronie serwera):

- Łączny rozmiar pakietu: 50 MB.
- Tekst do osadzania obejmuje `SKILL.md` oraz maksymalnie około 40 plików innych niż `.md` (limit stosowany w miarę możliwości).

## Slugi

- Domyślnie pochodzą od nazwy folderu.
- Zakresy pakietów muszą dokładnie odpowiadać identyfikatorowi wydawcy ClawHub. Identyfikatory wydawców mogą zawierać małe litery, cyfry, łączniki, kropki i podkreślenia; muszą zaczynać się i kończyć małą literą lub cyfrą.
- Slugi pakietów muszą składać się z małych liter i być zgodne z npm, na przykład `@example.tools/demo-plugin` lub `demo-plugin`.

## Wersjonowanie i tagi

- Każda publikacja tworzy nową wersję (semver).
- Tagi są tekstowymi wskaźnikami do wersji; często używany jest tag `latest`.

## Licencja

- Wszystkie Skills opublikowane w ClawHub są objęte licencją `MIT-0`.
- Każdy może używać, modyfikować i redystrybuować opublikowane Skills, również komercyjnie.
- Uznanie autorstwa nie jest wymagane.
- Nie dodawaj sprzecznych warunków licencyjnych w `SKILL.md`; ClawHub nie obsługuje zastępowania licencji dla poszczególnych Skills.

## Płatne Skills

- ClawHub nie obsługuje płatnych Skills, indywidualnych cen Skills, zapór płatniczych ani podziału przychodów.
- Nie dodawaj metadanych cenowych do `SKILL.md`; nie należą one do formatu Skilla i nie spowodują, że opublikowany Skill stanie się płatny.
- Jeśli Skill integruje się z płatną usługą zewnętrzną, wyraźnie udokumentuj koszt zewnętrzny i wymagane konto w instrukcjach Skilla oraz deklaracjach zmiennych środowiskowych (`requires.env` dla zmiennych wymaganych lub `envVars` z `required: false` dla zmiennych opcjonalnych).
