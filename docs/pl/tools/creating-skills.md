---
read_when:
    - Tworzysz nowy własny Skill w swoim workspace
    - Potrzebujesz szybkiego przepływu startowego dla Skills opartych na `SKILL.md`
summary: Budowanie i testowanie własnych Skills workspace z `SKILL.md`
title: Tworzenie Skills
x-i18n:
    generated_at: "2026-04-24T09:35:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: df9249e14936c65143580a6618679cf2d79a2960390e5c7afc5dbea1a9a6e045
    source_path: tools/creating-skills.md
    workflow: 15
---

Skills uczą agenta, jak i kiedy używać narzędzi. Każdy Skill to katalog
zawierający plik `SKILL.md` z YAML frontmatter i instrukcjami w markdownie.

Aby dowiedzieć się, jak Skills są ładowane i priorytetyzowane, zobacz [Skills](/pl/tools/skills).

## Utwórz swój pierwszy Skill

<Steps>
  <Step title="Utwórz katalog Skill">
    Skills znajdują się w Twoim workspace. Utwórz nowy folder:

    ```bash
    mkdir -p ~/.openclaw/workspace/skills/hello-world
    ```

  </Step>

  <Step title="Napisz SKILL.md">
    Utwórz `SKILL.md` w tym katalogu. Frontmatter definiuje metadane,
    a treść markdown zawiera instrukcje dla agenta.

    ```markdown
    ---
    name: hello_world
    description: Prosty Skill, który mówi cześć.
    ---

    # Skill Hello World

    Gdy użytkownik poprosi o powitanie, użyj narzędzia `echo`, aby powiedzieć
    "Hello from your custom skill!".
    ```

  </Step>

  <Step title="Dodaj narzędzia (opcjonalnie)">
    Możesz zdefiniować własne schematy narzędzi we frontmatter albo poinstruować agenta,
    aby używał istniejących narzędzi systemowych (takich jak `exec` lub `browser`). Skills mogą też
    być dostarczane w Pluginach obok narzędzi, które opisują.

  </Step>

  <Step title="Załaduj Skill">
    Rozpocznij nową sesję, aby OpenClaw wykrył Skill:

    ```bash
    # Z czatu
    /new

    # Albo zrestartuj gateway
    openclaw gateway restart
    ```

    Sprawdź, czy Skill został załadowany:

    ```bash
    openclaw skills list
    ```

  </Step>

  <Step title="Przetestuj">
    Wyślij wiadomość, która powinna uruchomić Skill:

    ```bash
    openclaw agent --message "give me a greeting"
    ```

    Albo po prostu porozmawiaj z agentem i poproś o powitanie.

  </Step>
</Steps>

## Dokumentacja referencyjna metadanych Skill

YAML frontmatter obsługuje następujące pola:

| Pole                                | Wymagane | Opis                                        |
| ----------------------------------- | -------- | ------------------------------------------- |
| `name`                              | Tak      | Unikalny identyfikator (snake_case)         |
| `description`                       | Tak      | Jednowierszowy opis pokazywany agentowi     |
| `metadata.openclaw.os`              | Nie      | Filtr systemu operacyjnego (`["darwin"]`, `["linux"]` itd.) |
| `metadata.openclaw.requires.bins`   | Nie      | Wymagane pliki binarne w PATH               |
| `metadata.openclaw.requires.config` | Nie      | Wymagane klucze konfiguracji                |

## Dobre praktyki

- **Pisz zwięźle** — instruuj model, _co_ ma zrobić, a nie jak ma być AI
- **Najpierw bezpieczeństwo** — jeśli Twój Skill używa `exec`, upewnij się, że prompty nie pozwalają na dowolne wstrzykiwanie poleceń z niezaufanych danych wejściowych
- **Testuj lokalnie** — użyj `openclaw agent --message "..."`, aby przetestować przed udostępnieniem
- **Używaj ClawHub** — przeglądaj i udostępniaj Skills na [ClawHub](https://clawhub.ai)

## Gdzie znajdują się Skills

| Lokalizacja                    | Priorytet najwyższy | Zakres                |
| ------------------------------ | ------------------- | --------------------- |
| `\<workspace\>/skills/`        | Najwyższy           | Per-agent             |
| `\<workspace\>/.agents/skills/` | Wysoki             | Agent per-workspace   |
| `~/.agents/skills/`            | Średni              | Współdzielony profil agenta |
| `~/.openclaw/skills/`          | Średni              | Współdzielone (wszyscy agenci) |
| Dołączone (dostarczane z OpenClaw) | Niski          | Globalny              |
| `skills.load.extraDirs`        | Najniższy           | Własne współdzielone foldery |

## Powiązane

- [Dokumentacja referencyjna Skills](/pl/tools/skills) — reguły ładowania, priorytetu i bramkowania
- [Konfiguracja Skills](/pl/tools/skills-config) — schemat konfiguracji `skills.*`
- [ClawHub](/pl/tools/clawhub) — publiczny rejestr Skills
- [Tworzenie Pluginów](/pl/plugins/building-plugins) — Pluginy mogą dostarczać Skills
