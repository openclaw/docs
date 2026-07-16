---
read_when:
    - Publikowanie Skills
    - Debugowanie błędów publikowania
summary: Format folderu umiejętności, wymagane pliki, dozwolone typy plików, limity.
x-i18n:
    generated_at: "2026-07-16T18:09:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 5759edf5f509d16335bcecaa96b3b64a0d3f430e473ede2211831ba062638a15
    source_path: clawhub/skill-format.md
    workflow: 16
---

# Format skilla

## Na dysku

Skill jest folderem.

Wymagane:

- `SKILL.md` (lub `skill.md`; akceptowany jest również starszy format `skills.md`)

Opcjonalne:

- dowolne pomocnicze pliki _tekstowe_ (zobacz „Dozwolone pliki”)
- `.clawhubignore` (wzorce ignorowania podczas publikowania, starszy format `.clawdhubignore`)
- `.gitignore` (również uwzględniany)

## Import z GitHub

Internetowy importer GitHub jest bardziej restrykcyjny niż lokalne publikowanie i synchronizacja. Wykrywa tylko
pliki `SKILL.md` lub starsze `skills.md` w publicznych repozytoriach niebędących forkami, należących do
zalogowanego konta GitHub. Nie importuje prywatnych repozytoriów, forków,
repozytoriów zarchiwizowanych lub wyłączonych ani publicznych repozytoriów innych podmiotów.

Metadane instalacji lokalnej (zapisywane przez CLI):

- `<skill>/.clawhub/origin.json` (starszy format `.clawdhub`)

Stan instalacji w katalogu roboczym (zapisywany przez CLI):

- `<workdir>/.clawhub/lock.json` (starszy format `.clawdhub`)

## `SKILL.md`

- Markdown z opcjonalnym frontmatterem YAML.
- Podczas publikowania serwer wyodrębnia metadane z frontmatteru.
- `description` służy jako podsumowanie skilla w interfejsie i wynikach wyszukiwania.

W przypadku przenośnych Agent Skills wartość `name` powinna odpowiadać nazwie katalogu nadrzędnego i zawierać
od 1 do 64 małych liter, cyfr lub łączników. ClawHub przechowuje oddzielnie trasowalny slug i
nazwę wyświetlaną w katalogu, dzięki czemu istniejące nazwy z innych klientów nadal można
publikować i nie są one automatycznie zmieniane. Listy katalogowe mogą wizualnie skracać długie nazwy
bez zmiany zapisanej nazwy.

## Metadane frontmatteru

Metadane skilla deklaruje się we frontmatterze YAML na początku pliku `SKILL.md`. Informują one rejestr (oraz mechanizm analizy bezpieczeństwa), czego skill potrzebuje do działania.

### Podstawowy frontmatter

```yaml
---
name: my-skill
description: Krótkie podsumowanie działania tego skilla.
version: 1.0.0
---
```

### Metadane środowiska uruchomieniowego (`metadata.openclaw`)

Wymagania środowiska uruchomieniowego skilla należy zadeklarować w sekcji `metadata.openclaw` (aliasy: `metadata.clawdbot`, `metadata.clawdis`).

```yaml
---
name: my-skill
description: Zarządzanie zadaniami za pośrednictwem API Todoist.
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

Wartości `requires.env` należy używać dla zmiennych środowiskowych, które muszą być dostępne przed uruchomieniem skilla. Wartości `envVars` należy używać, gdy potrzebne są metadane poszczególnych zmiennych, w tym zmiennych opcjonalnych oznaczonych za pomocą `required: false`.

### Pełna dokumentacja pól

| Pole               | Typ        | Opis                                                                                                                                         |
| ------------------ | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `requires.env`     | `string[]` | Wymagane zmienne środowiskowe oczekiwane przez skill.                                                                                         |
| `requires.bins`    | `string[]` | Pliki wykonywalne CLI, które muszą być wszystkie zainstalowane.                                                                               |
| `requires.anyBins` | `string[]` | Pliki wykonywalne CLI, z których co najmniej jeden musi istnieć.                                                                              |
| `requires.config`  | `string[]` | Ścieżki plików konfiguracyjnych odczytywanych przez skill.                                                                                    |
| `primaryEnv`       | `string`   | Główna zmienna środowiskowa zawierająca dane uwierzytelniające skilla.                                                                        |
| `envVars`          | `array`    | Deklaracje zmiennych środowiskowych z `name`, opcjonalnym `required` i opcjonalnym `description`. Dla opcjonalnych zmiennych środowiskowych należy ustawić `required: false`. |
| `always`           | `boolean`  | Jeśli ustawiono `true`, skill jest zawsze aktywny (nie wymaga jawnej instalacji).                                                  |
| `skillKey`         | `string`   | Zastępuje klucz wywołania skilla.                                                                                                             |
| `emoji`            | `string`   | Emoji wyświetlane dla skilla.                                                                                                                 |
| `homepage`         | `string`   | Adres URL strony głównej lub dokumentacji skilla.                                                                                             |
| `os`               | `string[]` | Ograniczenia dotyczące systemu operacyjnego (np. `["macos"]`, `["linux"]`).                                                    |
| `install`          | `array`    | Specyfikacje instalacji zależności (zobacz poniżej).                                                                                           |
| `nix`              | `object`   | Specyfikacja pluginu Nix (zobacz README).                                                                                                     |
| `config`           | `object`   | Specyfikacja konfiguracji Clawdbot (zobacz README).                                                                                           |

### Specyfikacje instalacji

Jeśli skill wymaga zainstalowania zależności, należy zadeklarować je w tablicy `install`:

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

Opcjonalne zmienne środowiskowe należy zadeklarować w sekcji `metadata.openclaw.envVars` i ustawić `required: false`. Nie należy dodawać opcjonalnych wpisów do `requires.env`, ponieważ `requires.env` oznacza, że skill nie może bez nich działać.

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
        description: Opcjonalny domyślny identyfikator projektu używany, gdy użytkownik nie określi innego.
```

### Dlaczego jest to ważne

Analiza bezpieczeństwa ClawHub sprawdza, czy deklaracje skilla odpowiadają jego rzeczywistemu działaniu. Jeśli kod odwołuje się do `TODOIST_API_KEY`, ale frontmatter nie deklaruje tej wartości w sekcji `requires.env`, `primaryEnv` ani `envVars`, analiza zgłosi niezgodność metadanych. Dokładne deklaracje pomagają skillowi przejść weryfikację oraz ułatwiają użytkownikom zrozumienie, co instalują.

### Przykład: kompletny frontmatter

```yaml
---
name: todoist-cli
description: Zarządzanie zadaniami, projektami i etykietami Todoist z poziomu wiersza poleceń.
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

Podczas publikowania akceptowane są wyłącznie pliki „tekstowe”.

- Lista dozwolonych rozszerzeń znajduje się w `packages/schema/src/textFiles.ts` (`TEXT_FILE_EXTENSIONS`).
- Pliki skryptów są nadal skanowane po przesłaniu; pliki PowerShell `.ps1`, `.psm1` i `.psd1` są akceptowane jako tekst.
- Typy zawartości zaczynające się od `text/` są traktowane jako tekst; istnieje również niewielka lista dozwolonych formatów (JSON/YAML/TOML/JS/TS/Markdown/SVG).

Limity (po stronie serwera):

- Łączny rozmiar pakietu: 50MB.
- Tekst osadzania obejmuje `SKILL.md` oraz maksymalnie około 40 plików innych niż `.md` (limit stosowany w miarę możliwości).

## Slugi

- Domyślnie wyprowadzane z nazwy folderu.
- Zakresy pakietów muszą dokładnie odpowiadać identyfikatorowi wydawcy ClawHub. Identyfikatory wydawców mogą zawierać małe litery, cyfry, łączniki, kropki i podkreślenia; muszą zaczynać się i kończyć małą literą lub cyfrą.
- Slugi pakietów muszą być zapisane małymi literami i zgodne z npm, na przykład `@example.tools/demo-plugin` lub `demo-plugin`.

## Wersjonowanie i tagi

- Każda publikacja tworzy nową wersję (semver).
- Tagi są wskaźnikami tekstowymi do wersji; często używa się `latest`.

## Licencja

- Wszystkie skille publikowane w ClawHub są udostępniane na licencji `MIT-0`.
- Każdy może używać, modyfikować i redystrybuować opublikowane skille, również komercyjnie.
- Podanie autorstwa nie jest wymagane.
- Nie należy dodawać sprzecznych warunków licencyjnych w `SKILL.md`; ClawHub nie obsługuje zastępowania licencji dla poszczególnych skilli.

## Płatne skille

- ClawHub nie obsługuje płatnych skilli, indywidualnych cen skilli, zapór płatniczych ani podziału przychodów.
- Nie należy dodawać metadanych cenowych do `SKILL.md`; nie są one częścią formatu skilla i nie spowodują, że opublikowany skill stanie się płatny.
- Jeśli skill integruje się z płatną usługą zewnętrzną, należy jasno udokumentować zewnętrzny koszt i wymagane konto w instrukcjach skilla oraz deklaracjach zmiennych środowiskowych (`requires.env` dla wymaganych zmiennych lub `envVars` z `required: false` dla zmiennych opcjonalnych).
