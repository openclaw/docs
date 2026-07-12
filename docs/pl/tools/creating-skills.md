---
read_when:
    - Tworzysz nową niestandardową umiejętność
    - Potrzebujesz szybkiego przepływu pracy na początek dla Skills opartych na pliku SKILL.md
    - Chcesz użyć Skill Workshop, aby zaproponować umiejętność do weryfikacji przez agenta
sidebarTitle: Creating skills
summary: Twórz, testuj i publikuj niestandardowe umiejętności obszaru roboczego SKILL.md dla swoich agentów OpenClaw.
title: Tworzenie Skills
x-i18n:
    generated_at: "2026-07-12T15:40:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cba2aa863ebd083d4592e8a764dbdc2c30a0dd8aff49d273927e82df0069bc81
    source_path: tools/creating-skills.md
    workflow: 16
---

Skills uczą agenta, jak i kiedy używać narzędzi. Każdy Skill jest katalogiem
zawierającym plik `SKILL.md` z frontmatterem YAML i instrukcjami w formacie Markdown.
OpenClaw ładuje Skills z kilku katalogów głównych zgodnie ze zdefiniowaną [kolejnością pierwszeństwa](/pl/tools/skills#loading-order).

## Utwórz swój pierwszy Skill

<Steps>
  <Step title="Create the skill directory">
    Skills znajdują się w folderze `skills/` Twojego obszaru roboczego:

    ```bash
    mkdir -p ~/.openclaw/workspace/skills/hello-world
    ```

    Aby uporządkować Skills, możesz grupować je w podfolderach — nazwa Skilla nadal
    pochodzi z frontmatteru pliku `SKILL.md`, a nie ze ścieżki katalogu:

    ```bash
    mkdir -p ~/.openclaw/workspace/skills/personal/hello-world
    # skill name is still "hello-world", invoked as /hello-world
    ```

  </Step>

  <Step title="Write SKILL.md">
    Frontmatter definiuje metadane, a treść zawiera instrukcje dla agenta.

    ```markdown
    ---
    name: hello-world
    description: A simple skill that prints a greeting.
    ---

    # Hello World

    When the user asks for a greeting, use the `exec` tool to run:

    ```bash
    echo "Hello from your custom skill!"
    ```
    ```

    Reguły nazewnictwa:
    - W polu `name` używaj małych liter, cyfr i łączników.
    - Nazwa katalogu i pole `name` we frontmatterze powinny być zgodne.
    - Pole `description` jest wyświetlane agentowi oraz podczas wyszukiwania poleceń z ukośnikiem —
      powinno mieścić się w jednym wierszu i zawierać mniej niż 160 znaków.

  </Step>

  <Step title="Verify the skill loaded">
    ```bash
    openclaw skills list
    ```

    OpenClaw domyślnie monitoruje pliki `SKILL.md` w katalogach głównych Skills. Jeśli
    monitorowanie jest wyłączone lub kontynuujesz istniejącą sesję, rozpocznij nową,
    aby agent otrzymał odświeżoną listę:

    ```bash
    # From chat — archive current session and start fresh
    /new

    # Or restart the gateway
    openclaw gateway restart
    ```

  </Step>

  <Step title="Test it">
    ```bash
    openclaw agent --message "give me a greeting"
    ```

    Możesz też otworzyć czat i poprosić agenta bezpośrednio. Użyj `/skill hello-world`,
    aby jawnie wywołać Skill według nazwy.

  </Step>
</Steps>

## Dokumentacja pliku SKILL.md

### Pola wymagane

| Pole          | Opis                                                               |
| ------------- | ------------------------------------------------------------------ |
| `name`        | Unikatowy identyfikator z małych liter, cyfr i łączników           |
| `description` | Jednowierszowy opis wyświetlany agentowi i w wynikach wyszukiwania |

### Opcjonalne klucze frontmatteru

| Pole                       | Wartość domyślna | Opis                                                                                     |
| -------------------------- | ---------------- | ---------------------------------------------------------------------------------------- |
| `user-invocable`           | `true`           | Udostępnia Skill jako polecenie użytkownika z ukośnikiem                                  |
| `disable-model-invocation` | `false`          | Wyklucza Skill z monitu systemowego agenta (nadal można go uruchomić przez `/skill`)       |
| `command-dispatch`         | —                | Ustaw `tool`, aby kierować polecenie z ukośnikiem bezpośrednio do narzędzia, z pominięciem modelu |
| `command-tool`             | —                | Nazwa narzędzia wywoływanego po ustawieniu `command-dispatch: tool`                       |
| `command-arg-mode`         | `raw`            | Przy przekazywaniu do narzędzia przesyła nieprzetworzony ciąg argumentów                   |
| `homepage`                 | —                | Adres URL wyświetlany jako „Website” w interfejsie Skills systemu macOS                   |

Informacje o polach warunkowych (`requires.bins`, `requires.env` itd.) znajdziesz w sekcji
[Skills — warunki aktywacji](/pl/tools/skills#gating).

### Używanie `{baseDir}`

Odwołuj się do plików wewnątrz katalogu Skilla bez wpisywania ścieżek na stałe —
agent rozpoznaje `{baseDir}` względem katalogu danego Skilla:

```markdown
Run the helper script at `{baseDir}/scripts/run.sh`.
```

## Dodawanie aktywacji warunkowej

Ustaw warunki Skilla, aby był ładowany tylko wtedy, gdy jego zależności są dostępne:

```markdown
---
name: gemini-search
description: Search using Gemini CLI.
metadata: { "openclaw": { "requires": { "bins": ["gemini"] }, "primaryEnv": "GEMINI_API_KEY" } }
---
```

<AccordionGroup>
  <Accordion title="Gating options">
    | Klucz | Opis |
    | --- | --- |
    | `requires.bins` | Wszystkie pliki wykonywalne muszą istnieć w `PATH` |
    | `requires.anyBins` | Co najmniej jeden plik wykonywalny musi istnieć w `PATH` |
    | `requires.env` | Każda zmienna środowiskowa musi istnieć w procesie lub konfiguracji |
    | `requires.config` | Każda ścieżka w `openclaw.json` musi mieć wartość logiczną prawda |
    | `os` | Filtr platformy: `["darwin"]`, `["linux"]`, `["win32"]` |
    | `always` | Ustaw `true`, aby pominąć wszystkie warunki i zawsze uwzględniać Skill |

    Pełna dokumentacja: [Skills — warunki aktywacji](/pl/tools/skills#gating).

  </Accordion>
  <Accordion title="Environment and API keys">
    Powiąż klucz API z wpisem Skilla w pliku `openclaw.json`:

    ```json5
    {
      skills: {
        entries: {
          "gemini-search": {
            enabled: true,
            apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" },
          },
        },
      },
    }
    ```

    Klucz jest wstrzykiwany do procesu hosta wyłącznie na czas danego przebiegu agenta.
    Nie trafia do piaskownicy — zobacz
    [zmienne środowiskowe w piaskownicy](/pl/tools/skills-config#sandboxed-skills-and-env-vars).

  </Accordion>
</AccordionGroup>

## Zgłaszanie propozycji przez Skill Workshop

W przypadku Skills przygotowanych przez agenta lub gdy chcesz, aby operator sprawdził Skill
przed jego uruchomieniem, użyj propozycji w [Skill Workshop](/pl/tools/skill-workshop), zamiast
bezpośrednio zapisywać plik `SKILL.md`.

```bash
# Propose a brand-new skill
openclaw skills workshop propose-create \
  --name "hello-world" \
  --description "A simple skill that prints a greeting." \
  --proposal ./PROPOSAL.md

# Propose an update to an existing skill
openclaw skills workshop propose-update hello-world \
  --proposal ./PROPOSAL.md \
  --description "Updated greeting skill"
```

Użyj `--proposal-dir`, gdy propozycja zawiera pliki pomocnicze:

```bash
openclaw skills workshop propose-create \
  --name "hello-world" \
  --description "A simple skill that prints a greeting." \
  --proposal-dir ./hello-world-proposal/
```

Katalog musi zawierać plik `PROPOSAL.md` w swoim katalogu głównym. Pliki pomocnicze umieść
w katalogach `assets/`, `examples/`, `references/`, `scripts/` lub `templates/`.

Po sprawdzeniu:

```bash
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop apply <proposal-id>
```

Pełny cykl życia propozycji opisano w sekcji [Skill Workshop](/pl/tools/skill-workshop).

## Publikowanie w ClawHub

<Steps>
  <Step title="Ensure your SKILL.md is complete">
    Upewnij się, że ustawiono pola `name`, `description` oraz wszystkie pola warunkowe
    `metadata.openclaw`. Dodaj adres URL `homepage`, jeśli masz stronę projektu.
  </Step>
  <Step title="Install the standalone ClawHub CLI and log in">
    ```bash
    npm i -g clawhub
    clawhub login
    ```
  </Step>
  <Step title="Publish">
    ```bash
    clawhub skill publish ./path/to/hello-world
    ```

    Dodaj `--version <version>` lub `--owner <owner>`, aby zastąpić wykrytą
    wersję albo opublikować Skill jako określony właściciel. Pełny proces, zakres właściciela
    i pozostałe polecenia konserwacyjne (`clawhub sync`, `clawhub skill rename`, ...)
    opisano w sekcjach [ClawHub — publikowanie](/pl/clawhub/publishing) oraz
    [CLI ClawHub](/pl/clawhub/cli).

  </Step>
</Steps>

## Najlepsze praktyki

<Tip>
  - **Pisz zwięźle** — poinstruuj model, *co* ma zrobić, zamiast wyjaśniać, jak ma być sztuczną inteligencją.
  - **Bezpieczeństwo przede wszystkim** — jeśli Twój Skill używa `exec`, upewnij się, że monity nie umożliwiają
    wstrzykiwania dowolnych poleceń z niezaufanych danych wejściowych.
  - **Testuj lokalnie** — przed udostępnieniem użyj `openclaw agent --message "..."`.
  - **Korzystaj z ClawHub** — przed tworzeniem od podstaw przejrzyj Skills społeczności na stronie [clawhub.ai](https://clawhub.ai).
</Tip>

## Powiązane materiały

<CardGroup cols={2}>
  <Card title="Skills reference" href="/pl/tools/skills" icon="puzzle-piece">
    Kolejność ładowania, warunki aktywacji, listy dozwolonych elementów i format pliku SKILL.md.
  </Card>
  <Card title="Skill Workshop" href="/pl/tools/skill-workshop" icon="flask">
    Kolejka propozycji Skills przygotowanych przez agenta.
  </Card>
  <Card title="Skills config" href="/pl/tools/skills-config" icon="gear">
    Pełny schemat konfiguracji `skills.*`.
  </Card>
  <Card title="ClawHub" href="/clawhub" icon="cloud">
    Przeglądaj i publikuj Skills w publicznym rejestrze.
  </Card>
  <Card title="Building plugins" href="/pl/plugins/building-plugins" icon="plug">
    Pluginy mogą dostarczać Skills wraz z narzędziami, które dokumentują.
  </Card>
</CardGroup>
