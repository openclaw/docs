---
read_when:
    - Tworzysz nową niestandardową Skill w swoim workspace
    - Potrzebujesz szybkiego przepływu startowego dla Skills opartych na SKILL.md
summary: Twórz i testuj niestandardowe Skills workspace z użyciem SKILL.md
title: Tworzenie Skills
x-i18n:
    generated_at: "2026-04-05T14:07:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 747cebc5191b96311d1d6760bede1785a099acd7633a0b88de6b7882b57e1db6
    source_path: tools/creating-skills.md
    workflow: 15
---

# Tworzenie Skills

Skills uczą agenta, jak i kiedy używać narzędzi. Każda Skill jest katalogiem
zawierającym plik `SKILL.md` z frontmatter YAML i instrukcjami w Markdown.

Aby dowiedzieć się, jak Skills są ładowane i priorytetyzowane, zobacz [Skills](/tools/skills).

## Utwórz swoją pierwszą Skill

<Steps>
  <Step title="Utwórz katalog Skill">
    Skills znajdują się w Twoim workspace. Utwórz nowy folder:

    ```bash
    mkdir -p ~/.openclaw/workspace/skills/hello-world
    ```

  </Step>

  <Step title="Napisz SKILL.md">
    Utwórz `SKILL.md` wewnątrz tego katalogu. Frontmatter definiuje metadane,
    a treść Markdown zawiera instrukcje dla agenta.

    ```markdown
    ---
    name: hello_world
    description: A simple skill that says hello.
    ---

    # Hello World Skill

    When the user asks for a greeting, use the `echo` tool to say
    "Hello from your custom skill!".
    ```

  </Step>

  <Step title="Dodaj narzędzia (opcjonalnie)">
    Możesz zdefiniować niestandardowe schematy narzędzi w frontmatter albo poinstruować agenta,
    aby używał istniejących narzędzi systemowych (takich jak `exec` lub `browser`). Skills mogą być też
    dostarczane we wtyczkach razem z narzędziami, które dokumentują.

  </Step>

  <Step title="Załaduj Skill">
    Rozpocznij nową sesję, aby OpenClaw wykrył Skill:

    ```bash
    # Z czatu
    /new

    # Albo zrestartuj gateway
    openclaw gateway restart
    ```

    Sprawdź, czy Skill została załadowana:

    ```bash
    openclaw skills list
    ```

  </Step>

  <Step title="Przetestuj">
    Wyślij wiadomość, która powinna uruchomić Skill:

    ```bash
    openclaw agent --message "give me a greeting"
    ```

    Albo po prostu rozmawiaj z agentem i poproś o powitanie.

  </Step>
</Steps>

## Dokumentacja metadanych Skill

Frontmatter YAML obsługuje następujące pola:

| Pole                                | Wymagane | Opis                                        |
| ----------------------------------- | -------- | ------------------------------------------- |
| `name`                              | Tak      | Unikalny identyfikator (`snake_case`)       |
| `description`                       | Tak      | Jednowierszowy opis wyświetlany agentowi    |
| `metadata.openclaw.os`              | Nie      | Filtr systemu operacyjnego (`["darwin"]`, `["linux"]` itp.) |
| `metadata.openclaw.requires.bins`   | Nie      | Wymagane pliki binarne w PATH               |
| `metadata.openclaw.requires.config` | Nie      | Wymagane klucze konfiguracji                |

## Dobre praktyki

- **Bądź zwięzły** — instruuj model, _co_ ma zrobić, a nie jak ma być AI
- **Bezpieczeństwo przede wszystkim** — jeśli Twoja Skill używa `exec`, upewnij się, że prompty nie pozwalają na dowolne wstrzykiwanie poleceń z niezaufanego wejścia
- **Testuj lokalnie** — używaj `openclaw agent --message "..."`, aby testować przed udostępnieniem
- **Używaj ClawHub** — przeglądaj i współtwórz Skills na [ClawHub](https://clawhub.ai)

## Gdzie znajdują się Skills

| Lokalizacja                     | Priorytet najwyższeństwa | Zakres                |
| ------------------------------- | ------------------------ | --------------------- |
| `\<workspace\>/skills/`         | Najwyższy                | Per-agent             |
| `\<workspace\>/.agents/skills/` | Wysoki                   | Per-workspace agent   |
| `~/.agents/skills/`             | Średni                   | Współdzielony profil agenta |
| `~/.openclaw/skills/`           | Średni                   | Współdzielone (wszyscy agenci) |
| Dołączone (dostarczane z OpenClaw) | Niski                 | Globalny              |
| `skills.load.extraDirs`         | Najniższy                | Niestandardowe foldery współdzielone |

## Powiązane

- [Dokumentacja Skills](/tools/skills) — zasady ładowania, priorytetu i bramkowania
- [Konfiguracja Skills](/tools/skills-config) — schemat konfiguracji `skills.*`
- [ClawHub](/tools/clawhub) — publiczny rejestr Skills
- [Tworzenie wtyczek](/plugins/building-plugins) — wtyczki mogą dostarczać Skills
