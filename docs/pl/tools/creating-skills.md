---
read_when:
    - Tworzysz nową niestandardową umiejętność
    - Potrzebujesz szybkiego początkowego przepływu pracy dla umiejętności opartych na SKILL.md
    - Chcesz użyć Skill Workshop, aby zaproponować umiejętność do przeglądu przez agenta
sidebarTitle: Creating skills
summary: Twórz, testuj i publikuj niestandardowe Skills obszaru roboczego SKILL.md dla swoich agentów OpenClaw.
title: Tworzenie Skills
x-i18n:
    generated_at: "2026-06-27T18:25:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7a744e9010c66b8465449d24430520473717edde86711bbb59774519189b9e72
    source_path: tools/creating-skills.md
    workflow: 16
---

Skills uczą agenta, jak i kiedy używać narzędzi. Każdy skill to katalog
zawierający plik `SKILL.md` z YAML frontmatter i instrukcjami w Markdown.
OpenClaw ładuje Skills z kilku katalogów głównych w zdefiniowanej [kolejności pierwszeństwa](/pl/tools/skills#loading-order).

## Utwórz swój pierwszy skill

<Steps>
  <Step title="Create the skill directory">
    Skills znajdują się w folderze `skills/` Twojego workspace. Utwórz katalog
    dla nowego skilla:

    ```bash
    mkdir -p ~/.openclaw/workspace/skills/hello-world
    ```

    Możesz grupować Skills w podfolderach dla lepszej organizacji — skill nadal
    jest nazywany przez frontmatter w `SKILL.md`, a nie przez ścieżkę folderu:

    ```bash
    mkdir -p ~/.openclaw/workspace/skills/personal/hello-world
    # skill name is still "hello-world", invoked as /hello-world
    ```

  </Step>

  <Step title="Write SKILL.md">
    Utwórz `SKILL.md` w katalogu. Frontmatter definiuje metadane;
    treść zawiera instrukcje dla agenta.

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

    Zasady nazewnictwa:
    - Używaj małych liter, cyfr i łączników w polu `name`.
    - Utrzymuj zgodność nazwy katalogu i frontmatter `name`.
    - `description` jest pokazywane agentowi i w wykrywaniu poleceń slash —
      powinno być jednowierszowe i mieć mniej niż 160 znaków.

  </Step>

  <Step title="Verify the skill loaded">
    ```bash
    openclaw skills list
    ```

    OpenClaw domyślnie obserwuje pliki `SKILL.md` w katalogach głównych Skills.
    Jeśli obserwator jest wyłączony albo kontynuujesz istniejącą sesję, rozpocznij
    nową, aby agent otrzymał odświeżoną listę:

    ```bash
    # From chat — archive current session and start fresh
    /new

    # Or restart the gateway
    openclaw gateway restart
    ```

  </Step>

  <Step title="Test it">
    Wyślij wiadomość, która powinna uruchomić skill:

    ```bash
    openclaw agent --message "give me a greeting"
    ```

    Możesz też otworzyć czat i zapytać agenta bezpośrednio. Użyj `/skill hello-world`,
    aby jawnie wywołać go po nazwie.

  </Step>
</Steps>

## Dokumentacja `SKILL.md`

### Wymagane pola

| Pole          | Opis                                                            |
| ------------- | --------------------------------------------------------------- |
| `name`        | Unikalny slug używający małych liter, cyfr i łączników          |
| `description` | Jednowierszowy opis pokazywany agentowi i w wynikach wykrywania |

### Opcjonalne klucze frontmatter

| Pole                       | Domyślnie | Opis                                                                                       |
| -------------------------- | --------- | ------------------------------------------------------------------------------------------ |
| `user-invocable`           | `true`    | Udostępnia skill jako polecenie slash użytkownika                                          |
| `disable-model-invocation` | `false`   | Nie umieszcza skilla w system prompt agenta (nadal działa przez `/skill`)                  |
| `command-dispatch`         | —         | Ustaw na `tool`, aby skierować polecenie slash bezpośrednio do narzędzia, z pominięciem modelu |
| `command-tool`             | —         | Nazwa narzędzia do wywołania, gdy ustawiono `command-dispatch: tool`                       |
| `command-arg-mode`         | `raw`     | Dla wysyłania do narzędzia przekazuje surowy ciąg argumentów do narzędzia                  |
| `homepage`                 | —         | URL pokazywany jako „Witryna” w interfejsie Skills na macOS                                |

Pola bramkujące (`requires.bins`, `requires.env` itd.) opisuje sekcja
[Skills — Bramkowanie](/pl/tools/skills#gating).

### Używanie `{baseDir}`

Użyj `{baseDir}` w treści skilla, aby odwoływać się do plików wewnątrz
katalogu skilla bez wpisywania ścieżek na stałe:

```markdown
Run the helper script at `{baseDir}/scripts/run.sh`.
```

## Dodawanie aktywacji warunkowej

Ogranicz ładowanie skilla tak, aby ładował się tylko wtedy, gdy jego zależności są dostępne:

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
    | `requires.bins` | Wszystkie pliki binarne muszą istnieć w `PATH` |
    | `requires.anyBins` | Co najmniej jeden plik binarny musi istnieć w `PATH` |
    | `requires.env` | Każda zmienna env musi istnieć w procesie lub konfiguracji |
    | `requires.config` | Każda ścieżka `openclaw.json` musi być prawdziwa |
    | `os` | Filtr platformy: `["darwin"]`, `["linux"]`, `["win32"]` |
    | `always` | Ustaw `true`, aby pominąć wszystkie warunki i zawsze uwzględniać skill |

    Pełna dokumentacja: [Skills — Bramkowanie](/pl/tools/skills#gating).

  </Accordion>
  <Accordion title="Environment and API keys">
    Powiąż klucz API z wpisem skilla w `openclaw.json`:

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

    Klucz jest wstrzykiwany do procesu hosta tylko na czas danej tury agenta.
    Nie trafia do sandboxa — zobacz
    [zmienne env w sandboxie](/pl/tools/skills-config#sandboxed-skills-and-env-vars).

  </Accordion>
</AccordionGroup>

## Proponowanie przez Warsztat Skills

W przypadku Skills przygotowanych przez agenta albo gdy chcesz, aby operator
sprawdził skill przed uruchomieniem go produkcyjnie, użyj propozycji
[Warsztatu Skills](/pl/tools/skill-workshop) zamiast pisać `SKILL.md` bezpośrednio.

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

Katalog musi zawierać `PROPOSAL.md`. Pliki pomocnicze mogą znajdować się w `assets/`,
`examples/`, `references/`, `scripts/` lub `templates/`.

Po przeglądzie:

```bash
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop apply <proposal-id>
```

Zobacz [Warsztat Skills](/pl/tools/skill-workshop), aby poznać pełny cykl życia propozycji.

## Publikowanie w ClawHub

<Steps>
  <Step title="Ensure your SKILL.md is complete">
    Upewnij się, że ustawiono `name`, `description` oraz wszystkie pola bramkujące
    `metadata.openclaw`. Dodaj URL `homepage`, jeśli masz stronę projektu.
  </Step>
  <Step title="Install the ClawHub skill">
    Skill ClawHub dokumentuje aktualny kształt polecenia publikowania i wymagane
    metadane:

    ```bash
    openclaw skills install @openclaw/clawhub-publish
    ```

  </Step>
  <Step title="Publish">
    ```bash
    clawhub publish
    ```

    Pełny proces opisuje [ClawHub — Publikowanie](/pl/clawhub/publishing).

  </Step>
</Steps>

## Najlepsze praktyki

<Tip>
  - **Pisz zwięźle** — poinstruuj model, *co* ma zrobić, a nie jak być AI.
  - **Najpierw bezpieczeństwo** — jeśli Twój skill używa `exec`, upewnij się, że prompty nie pozwalają
    na dowolne wstrzykiwanie poleceń z niezaufanych danych wejściowych.
  - **Testuj lokalnie** — użyj `openclaw agent --message "..."` przed udostępnieniem.
  - **Używaj ClawHub** — przejrzyj społecznościowe Skills na [clawhub.ai](https://clawhub.ai)
    przed budowaniem od zera.
</Tip>

## Powiązane

<CardGroup cols={2}>
  <Card title="Skills reference" href="/pl/tools/skills" icon="puzzle-piece">
    Kolejność ładowania, bramkowanie, listy dozwolonych elementów i format SKILL.md.
  </Card>
  <Card title="Skill Workshop" href="/pl/tools/skill-workshop" icon="flask">
    Kolejka propozycji dla Skills przygotowanych przez agenta.
  </Card>
  <Card title="Skills config" href="/pl/tools/skills-config" icon="gear">
    Pełny schemat konfiguracji `skills.*`.
  </Card>
  <Card title="ClawHub" href="/pl/clawhub" icon="cloud">
    Przeglądaj i publikuj Skills w publicznym rejestrze.
  </Card>
  <Card title="Building plugins" href="/pl/plugins/building-plugins" icon="plug">
    Plugins mogą dostarczać Skills razem z narzędziami, które dokumentują.
  </Card>
</CardGroup>
