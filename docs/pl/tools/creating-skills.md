---
read_when:
    - Tworzysz nową niestandardową umiejętność w swoim obszarze roboczym
    - Potrzebujesz szybkiego przepływu pracy na start dla umiejętności opartych na SKILL.md
summary: Twórz i testuj niestandardowe Skills obszaru roboczego za pomocą SKILL.md
title: Tworzenie Skills
x-i18n:
    generated_at: "2026-04-30T10:21:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 201718f4088f4243b0dabe12fb4fce4b8a7e64df9a4b7d651356ab4ae0dd3579
    source_path: tools/creating-skills.md
    workflow: 16
---

Skills uczą agenta, jak i kiedy używać narzędzi. Każdy skill jest katalogiem
zawierającym plik `SKILL.md` z frontmatter YAML i instrukcjami w Markdown.

Informacje o tym, jak Skills są ładowane i priorytetyzowane, znajdziesz w [Skills](/pl/tools/skills).

## Utwórz swój pierwszy skill

<Steps>
  <Step title="Utwórz katalog skill">
    Skills znajdują się w Twoim obszarze roboczym. Utwórz nowy folder:

    ```bash
    mkdir -p ~/.openclaw/workspace/skills/hello-world
    ```

  </Step>

  <Step title="Napisz SKILL.md">
    Utwórz `SKILL.md` w tym katalogu. Frontmatter definiuje metadane,
    a treść Markdown zawiera instrukcje dla agenta.

    ```markdown
    ---
    name: hello-world
    description: A simple skill that says hello.
    ---

    # Hello World Skill

    When the user asks for a greeting, use the `echo` tool to say
    "Hello from your custom skill!".
    ```

    Użyj zapisu z dywizami, małymi literami, cyframi i dywizami dla `name`
    skill. Zachowaj zgodność nazwy folderu i `name` we frontmatter.

  </Step>

  <Step title="Dodaj narzędzia (opcjonalnie)">
    Możesz zdefiniować niestandardowe schematy narzędzi we frontmatter albo poinstruować agenta,
    aby używał istniejących narzędzi systemowych (takich jak `exec` lub `browser`). Skills mogą także
    być dostarczane wewnątrz plugins razem z narzędziami, które dokumentują.

  </Step>

  <Step title="Załaduj skill">
    Uruchom nową sesję, aby OpenClaw wykrył skill:

    ```bash
    # From chat
    /new

    # Or restart the gateway
    openclaw gateway restart
    ```

    Sprawdź, czy skill został załadowany:

    ```bash
    openclaw skills list
    ```

  </Step>

  <Step title="Przetestuj go">
    Wyślij wiadomość, która powinna uruchomić skill:

    ```bash
    openclaw agent --message "give me a greeting"
    ```

    Albo po prostu porozmawiaj z agentem i poproś o powitanie.

  </Step>
</Steps>

## Dokumentacja metadanych skill

Frontmatter YAML obsługuje te pola:

| Pole                                | Wymagane | Opis                                                           |
| ----------------------------------- | -------- | -------------------------------------------------------------- |
| `name`                              | Tak      | Unikalny identyfikator używający małych liter, cyfr i dywizów  |
| `description`                       | Tak      | Jednowierszowy opis pokazywany agentowi                        |
| `metadata.openclaw.os`              | Nie      | Filtr systemu operacyjnego (`["darwin"]`, `["linux"]` itd.)    |
| `metadata.openclaw.requires.bins`   | Nie      | Wymagane pliki binarne w PATH                                  |
| `metadata.openclaw.requires.config` | Nie      | Wymagane klucze konfiguracji                                   |

## Najlepsze praktyki

- **Pisz zwięźle** — instruuj model, _co_ ma zrobić, a nie jak być AI
- **Najpierw bezpieczeństwo** — jeśli Twój skill używa `exec`, upewnij się, że prompty nie pozwalają na dowolne wstrzykiwanie poleceń z niezaufanych danych wejściowych
- **Testuj lokalnie** — użyj `openclaw agent --message "..."`, aby przetestować przed udostępnieniem
- **Używaj ClawHub** — przeglądaj i współtwórz Skills na [ClawHub](https://clawhub.ai)

## Gdzie znajdują się Skills

| Lokalizacja                      | Pierwszeństwo | Zakres                  |
| ------------------------------- | ------------- | ----------------------- |
| `\<workspace\>/skills/`         | Najwyższe     | Na agenta               |
| `\<workspace\>/.agents/skills/` | Wysokie       | Na agenta w obszarze roboczym |
| `~/.agents/skills/`             | Średnie       | Wspólny profil agenta   |
| `~/.openclaw/skills/`           | Średnie       | Wspólne (wszyscy agenci) |
| Wbudowane (dostarczane z OpenClaw) | Niskie      | Globalny                |
| `skills.load.extraDirs`         | Najniższe     | Niestandardowe foldery współdzielone |

## Powiązane

- [Dokumentacja Skills](/pl/tools/skills) — ładowanie, pierwszeństwo i reguły bramkowania
- [Konfiguracja Skills](/pl/tools/skills-config) — schemat konfiguracji `skills.*`
- [ClawHub](/pl/tools/clawhub) — publiczny rejestr Skills
- [Tworzenie Plugins](/pl/plugins/building-plugins) — plugins mogą dostarczać Skills
