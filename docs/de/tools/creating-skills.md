---
read_when:
    - Sie erstellen einen neuen benutzerdefinierten Skill in Ihrem Arbeitsbereich
    - Sie benötigen einen schnellen Einstiegs-Workflow für SKILL.md-basierte Skills
summary: Benutzerdefinierte Arbeitsbereichs-Skills mit SKILL.md erstellen und testen
title: Skills erstellen
x-i18n:
    generated_at: "2026-04-30T07:17:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 201718f4088f4243b0dabe12fb4fce4b8a7e64df9a4b7d651356ab4ae0dd3579
    source_path: tools/creating-skills.md
    workflow: 16
---

Skills vermitteln dem Agenten, wie und wann er Tools verwenden soll. Jeder Skill ist ein Verzeichnis,
das eine `SKILL.md`-Datei mit YAML-Frontmatter und Markdown-Anweisungen enthält.

Informationen dazu, wie Skills geladen und priorisiert werden, finden Sie unter [Skills](/de/tools/skills).

## Ihren ersten Skill erstellen

<Steps>
  <Step title="Create the skill directory">
    Skills befinden sich in Ihrem Workspace. Erstellen Sie einen neuen Ordner:

    ```bash
    mkdir -p ~/.openclaw/workspace/skills/hello-world
    ```

  </Step>

  <Step title="Write SKILL.md">
    Erstellen Sie `SKILL.md` in diesem Verzeichnis. Das Frontmatter definiert Metadaten,
    und der Markdown-Body enthält Anweisungen für den Agenten.

    ```markdown
    ---
    name: hello-world
    description: A simple skill that says hello.
    ---

    # Hello World Skill

    When the user asks for a greeting, use the `echo` tool to say
    "Hello from your custom skill!".
    ```

    Verwenden Sie Bindestrich-Schreibweise mit Kleinbuchstaben, Ziffern und Bindestrichen für den Skill-
    `name`. Halten Sie den Ordnernamen und den Frontmatter-`name` konsistent.

  </Step>

  <Step title="Add tools (optional)">
    Sie können benutzerdefinierte Tool-Schemas im Frontmatter definieren oder den Agenten anweisen,
    vorhandene System-Tools (wie `exec` oder `browser`) zu verwenden. Skills können auch
    innerhalb von Plugins zusammen mit den Tools ausgeliefert werden, die sie dokumentieren.

  </Step>

  <Step title="Load the skill">
    Starten Sie eine neue Sitzung, damit OpenClaw den Skill übernimmt:

    ```bash
    # From chat
    /new

    # Or restart the gateway
    openclaw gateway restart
    ```

    Prüfen Sie, ob der Skill geladen wurde:

    ```bash
    openclaw skills list
    ```

  </Step>

  <Step title="Test it">
    Senden Sie eine Nachricht, die den Skill auslösen sollte:

    ```bash
    openclaw agent --message "give me a greeting"
    ```

    Oder chatten Sie einfach mit dem Agenten und bitten Sie um eine Begrüßung.

  </Step>
</Steps>

## Referenz für Skill-Metadaten

Das YAML-Frontmatter unterstützt diese Felder:

| Feld                                | Erforderlich | Beschreibung                                                   |
| ----------------------------------- | ------------ | -------------------------------------------------------------- |
| `name`                              | Ja           | Eindeutiger Bezeichner mit Kleinbuchstaben, Ziffern und Bindestrichen |
| `description`                       | Ja           | Einzeilige Beschreibung, die dem Agenten angezeigt wird         |
| `metadata.openclaw.os`              | Nein         | OS-Filter (`["darwin"]`, `["linux"]` usw.)                     |
| `metadata.openclaw.requires.bins`   | Nein         | Erforderliche Binärdateien in PATH                             |
| `metadata.openclaw.requires.config` | Nein         | Erforderliche Konfigurationsschlüssel                          |

## Bewährte Methoden

- **Fassen Sie sich kurz** — weisen Sie das Modell an, _was_ zu tun ist, nicht, wie es eine KI sein soll
- **Sicherheit zuerst** — wenn Ihr Skill `exec` verwendet, stellen Sie sicher, dass Prompts keine beliebige Command Injection aus nicht vertrauenswürdigen Eingaben erlauben
- **Lokal testen** — verwenden Sie `openclaw agent --message "..."`, um vor dem Teilen zu testen
- **ClawHub verwenden** — durchsuchen Sie Skills und tragen Sie welche bei auf [ClawHub](https://clawhub.ai)

## Speicherorte von Skills

| Speicherort                     | Vorrang       | Geltungsbereich             |
| ------------------------------- | ------------- | --------------------------- |
| `\<workspace\>/skills/`         | Höchster      | Pro Agent                   |
| `\<workspace\>/.agents/skills/` | Hoch          | Pro Workspace-Agent         |
| `~/.agents/skills/`             | Mittel        | Gemeinsames Agentenprofil   |
| `~/.openclaw/skills/`           | Mittel        | Gemeinsam (alle Agenten)    |
| Gebündelt (mit OpenClaw ausgeliefert) | Niedrig       | Global                      |
| `skills.load.extraDirs`         | Niedrigster   | Benutzerdefinierte gemeinsame Ordner |

## Verwandte Themen

- [Skills-Referenz](/de/tools/skills) — Ladeverhalten, Vorrang und Gating-Regeln
- [Skills-Konfiguration](/de/tools/skills-config) — `skills.*`-Konfigurationsschema
- [ClawHub](/de/tools/clawhub) — öffentliche Skill-Registry
- [Plugins erstellen](/de/plugins/building-plugins) — Plugins können Skills ausliefern
