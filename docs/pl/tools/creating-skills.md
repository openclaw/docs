---
read_when:
    - Tworzysz nową niestandardową umiejętność w swoim obszarze roboczym
    - Potrzebujesz szybkiego początkowego przepływu pracy dla Skills opartych na SKILL.md
summary: Tworzenie i testowanie niestandardowych Skills obszaru roboczego za pomocą SKILL.md
title: Tworzenie Skills
x-i18n:
    generated_at: "2026-05-10T19:56:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: a468a0b21f4e43542b175b8acb8ad8b19dbbea06ce8e0b97c48206bf88a661c5
    source_path: tools/creating-skills.md
    workflow: 16
---

Skills uczą agenta, jak i kiedy używać narzędzi. Każda umiejętność jest katalogiem
zawierającym plik `SKILL.md` z frontmatter YAML i instrukcjami w markdown.

Informacje o tym, jak Skills są ładowane i priorytetyzowane, znajdziesz w [Skills](/pl/tools/skills).

## Utwórz swoją pierwszą umiejętność

<Steps>
  <Step title="Utwórz katalog umiejętności">
    Skills znajdują się w Twoim obszarze roboczym. Utwórz nowy folder:

    ```bash
    mkdir -p ~/.openclaw/workspace/skills/hello-world
    ```

  </Step>

  <Step title="Napisz SKILL.md">
    Utwórz `SKILL.md` w tym katalogu. Frontmatter definiuje metadane,
    a treść markdown zawiera instrukcje dla agenta.

    ```markdown
    ---
    name: hello-world
    description: A simple skill that says hello.
    ---

    # Hello World Skill

    When the user asks for a greeting, use the `echo` tool to say
    "Hello from your custom skill!".
    ```

    Używaj zapisu z łącznikami, małymi literami, cyframi i łącznikami dla
    `name` umiejętności. Utrzymuj nazwę folderu i `name` we frontmatter spójne.

  </Step>

  <Step title="Dodaj narzędzia (opcjonalnie)">
    Możesz definiować niestandardowe schematy narzędzi we frontmatter albo poinstruować agenta,
    aby używał istniejących narzędzi systemowych (takich jak `exec` lub `browser`). Skills mogą także
    być dostarczane w pluginach razem z narzędziami, które dokumentują.

  </Step>

  <Step title="Załaduj umiejętność">
    Uruchom nową sesję, aby OpenClaw wykrył umiejętność:

    ```bash
    # From chat
    /new

    # Or restart the gateway
    openclaw gateway restart
    ```

    Sprawdź, czy umiejętność została załadowana:

    ```bash
    openclaw skills list
    ```

  </Step>

  <Step title="Przetestuj ją">
    Wyślij wiadomość, która powinna wyzwolić umiejętność:

    ```bash
    openclaw agent --message "give me a greeting"
    ```

    Możesz też po prostu porozmawiać z agentem i poprosić o powitanie.

  </Step>
</Steps>

## Dokumentacja metadanych umiejętności

Frontmatter YAML obsługuje te pola:

| Pole                                | Wymagane | Opis                                                           |
| ----------------------------------- | -------- | -------------------------------------------------------------- |
| `name`                              | Tak      | Unikalny identyfikator używający małych liter, cyfr i łączników |
| `description`                       | Tak      | Jednowierszowy opis pokazywany agentowi                        |
| `metadata.openclaw.os`              | Nie      | Filtr systemu operacyjnego (`["darwin"]`, `["linux"]` itd.)    |
| `metadata.openclaw.requires.bins`   | Nie      | Wymagane pliki binarne w PATH                                  |
| `metadata.openclaw.requires.config` | Nie      | Wymagane klucze konfiguracji                                   |

## Najlepsze praktyki

- **Pisz zwięźle** — instruuj model, _co_ ma zrobić, a nie jak być AI
- **Bezpieczeństwo przede wszystkim** — jeśli Twoja umiejętność używa `exec`, upewnij się, że prompty nie pozwalają na dowolne wstrzykiwanie poleceń z niezaufanych danych wejściowych
- **Testuj lokalnie** — użyj `openclaw agent --message "..."`, aby przetestować przed udostępnieniem
- **Używaj ClawHub** — przeglądaj i współtwórz umiejętności w [ClawHub](https://clawhub.ai)

## Gdzie znajdują się Skills

| Lokalizacja                     | Priorytet  | Zakres                    |
| ------------------------------- | ---------- | ------------------------- |
| `\<workspace\>/skills/`         | Najwyższy  | Dla agenta                |
| `\<workspace\>/.agents/skills/` | Wysoki     | Dla agenta w obszarze roboczym |
| `~/.agents/skills/`             | Średni     | Współdzielony profil agenta |
| `~/.openclaw/skills/`           | Średni     | Współdzielone (wszyscy agenci) |
| Wbudowane (dostarczane z OpenClaw) | Niski    | Globalny                  |
| `skills.load.extraDirs`         | Najniższy  | Niestandardowe foldery współdzielone |

## Powiązane

- [Dokumentacja Skills](/pl/tools/skills) — reguły ładowania, priorytetu i bramkowania
- [Konfiguracja Skills](/pl/tools/skills-config) — schemat konfiguracji `skills.*`
- [ClawHub](/pl/clawhub) — publiczny rejestr umiejętności
- [Tworzenie Pluginów](/pl/plugins/building-plugins) — pluginy mogą dostarczać Skills
