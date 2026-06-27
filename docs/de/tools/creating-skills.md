---
read_when:
    - Sie erstellen eine neue benutzerdefinierte Skill
    - Sie benötigen einen schnellen Einstiegs-Workflow für SKILL.md-basierte Skills
    - Sie möchten Skill Workshop verwenden, um einen Skill zur Agentenprüfung vorzuschlagen
sidebarTitle: Creating skills
summary: Erstellen, testen und veröffentlichen Sie benutzerdefinierte SKILL.md-Arbeitsbereich-Skills für Ihre OpenClaw-Agenten.
title: Skills erstellen
x-i18n:
    generated_at: "2026-06-27T18:16:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7a744e9010c66b8465449d24430520473717edde86711bbb59774519189b9e72
    source_path: tools/creating-skills.md
    workflow: 16
---

Skills bringen dem Agent bei, wie und wann er Tools verwendet. Jeder Skill ist ein Verzeichnis,
das eine `SKILL.md`-Datei mit YAML-Frontmatter und Markdown-Anweisungen enthält.
OpenClaw lädt Skills aus mehreren Roots in einer definierten [Rangfolge](/de/tools/skills#loading-order).

## Ihren ersten Skill erstellen

<Steps>
  <Step title="Create the skill directory">
    Skills liegen im Ordner `skills/` Ihres Workspace. Erstellen Sie ein Verzeichnis für Ihren
    neuen Skill:

    ```bash
    mkdir -p ~/.openclaw/workspace/skills/hello-world
    ```

    Sie können Skills zur Organisation in Unterordnern gruppieren — der Skill wird weiterhin
    durch das `SKILL.md`-Frontmatter benannt, nicht durch den Ordnerpfad:

    ```bash
    mkdir -p ~/.openclaw/workspace/skills/personal/hello-world
    # skill name is still "hello-world", invoked as /hello-world
    ```

  </Step>

  <Step title="Write SKILL.md">
    Erstellen Sie `SKILL.md` im Verzeichnis. Das Frontmatter definiert Metadaten;
    der Body gibt dem Agent Anweisungen.

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

    Benennungsregeln:
    - Verwenden Sie Kleinbuchstaben, Ziffern und Bindestriche für `name`.
    - Halten Sie den Verzeichnisnamen und den Frontmatter-`name` konsistent.
    - `description` wird dem Agent und in der Slash-Command-Erkennung angezeigt —
      halten Sie sie einzeilig und unter 160 Zeichen.

  </Step>

  <Step title="Verify the skill loaded">
    ```bash
    openclaw skills list
    ```

    OpenClaw überwacht `SKILL.md`-Dateien unter Skills-Roots standardmäßig. Wenn der
    Watcher deaktiviert ist oder Sie eine bestehende Sitzung fortsetzen, starten Sie eine neue,
    damit der Agent die aktualisierte Liste erhält:

    ```bash
    # From chat — archive current session and start fresh
    /new

    # Or restart the gateway
    openclaw gateway restart
    ```

  </Step>

  <Step title="Test it">
    Senden Sie eine Nachricht, die den Skill auslösen sollte:

    ```bash
    openclaw agent --message "give me a greeting"
    ```

    Oder öffnen Sie einen Chat und fragen Sie den Agent direkt. Verwenden Sie `/skill hello-world`, um
    ihn ausdrücklich nach Namen aufzurufen.

  </Step>
</Steps>

## SKILL.md-Referenz

### Erforderliche Felder

| Feld          | Beschreibung                                                   |
| ------------- | -------------------------------------------------------------- |
| `name`        | Eindeutiger Slug mit Kleinbuchstaben, Ziffern und Bindestrichen |
| `description` | Einzeilige Beschreibung, die dem Agent und in der Erkennungsausgabe angezeigt wird |

### Optionale Frontmatter-Schlüssel

| Feld                       | Standard | Beschreibung                                                                      |
| -------------------------- | -------- | --------------------------------------------------------------------------------- |
| `user-invocable`           | `true`   | Den Skill als Slash-Command für Benutzer bereitstellen                            |
| `disable-model-invocation` | `false`  | Den Skill aus dem System-Prompt des Agent heraushalten (läuft weiterhin über `/skill`) |
| `command-dispatch`         | —        | Auf `tool` setzen, um den Slash-Command direkt an ein Tool zu routen und das Modell zu umgehen |
| `command-tool`             | —        | Name des Tools, das aufgerufen wird, wenn `command-dispatch: tool` gesetzt ist    |
| `command-arg-mode`         | `raw`    | Leitet beim Tool-Dispatch den rohen args-String an das Tool weiter                |
| `homepage`                 | —        | URL, die in der macOS-Skills-UI als „Website“ angezeigt wird                      |

Für Gating-Felder (`requires.bins`, `requires.env` usw.) siehe
[Skills — Gating](/de/tools/skills#gating).

### `{baseDir}` verwenden

Verwenden Sie `{baseDir}` im Skill-Body, um auf Dateien innerhalb des Skill-Verzeichnisses
zu verweisen, ohne Pfade fest zu codieren:

```markdown
Run the helper script at `{baseDir}/scripts/run.sh`.
```

## Bedingte Aktivierung hinzufügen

Schränken Sie Ihren Skill so ein, dass er nur geladen wird, wenn seine Abhängigkeiten verfügbar sind:

```markdown
---
name: gemini-search
description: Search using Gemini CLI.
metadata: { "openclaw": { "requires": { "bins": ["gemini"] }, "primaryEnv": "GEMINI_API_KEY" } }
---
```

<AccordionGroup>
  <Accordion title="Gating options">
    | Schlüssel | Beschreibung |
    | --- | --- |
    | `requires.bins` | Alle Binaries müssen auf `PATH` vorhanden sein |
    | `requires.anyBins` | Mindestens ein Binary muss auf `PATH` vorhanden sein |
    | `requires.env` | Jede env var muss im Prozess oder in der Konfiguration vorhanden sein |
    | `requires.config` | Jeder `openclaw.json`-Pfad muss truthy sein |
    | `os` | Plattformfilter: `["darwin"]`, `["linux"]`, `["win32"]` |
    | `always` | Auf `true` setzen, um alle Gates zu überspringen und den Skill immer einzubeziehen |

    Vollständige Referenz: [Skills — Gating](/de/tools/skills#gating).

  </Accordion>
  <Accordion title="Environment and API keys">
    Verdrahten Sie einen API-Schlüssel mit einem Skill-Eintrag in `openclaw.json`:

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

    Der Schlüssel wird nur für diesen Agent-Turn in den Host-Prozess injiziert.
    Er erreicht die Sandbox nicht — siehe
    [sandboxed env vars](/de/tools/skills-config#sandboxed-skills-and-env-vars).

  </Accordion>
</AccordionGroup>

## Über Skill Workshop vorschlagen

Für vom Agent entworfene Skills oder wenn Sie eine Operator-Prüfung wünschen, bevor ein Skill
live geht, verwenden Sie [Skill Workshop](/de/tools/skill-workshop)-Vorschläge, statt
`SKILL.md` direkt zu schreiben.

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

Verwenden Sie `--proposal-dir`, wenn der Vorschlag Unterstützungsdateien enthält:

```bash
openclaw skills workshop propose-create \
  --name "hello-world" \
  --description "A simple skill that prints a greeting." \
  --proposal-dir ./hello-world-proposal/
```

Das Verzeichnis muss `PROPOSAL.md` enthalten. Unterstützungsdateien können in `assets/`,
`examples/`, `references/`, `scripts/` oder `templates/` liegen.

Nach der Prüfung:

```bash
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop apply <proposal-id>
```

Siehe [Skill Workshop](/de/tools/skill-workshop) für den vollständigen Vorschlagslebenszyklus.

## In ClawHub veröffentlichen

<Steps>
  <Step title="Ensure your SKILL.md is complete">
    Stellen Sie sicher, dass `name`, `description` und alle `metadata.openclaw`-Gating-Felder
    gesetzt sind. Fügen Sie eine `homepage`-URL hinzu, wenn Sie eine Projektseite haben.
  </Step>
  <Step title="Install the ClawHub skill">
    Der ClawHub-Skill dokumentiert die aktuelle Form des Publish-Befehls und die erforderlichen
    Metadaten:

    ```bash
    openclaw skills install @openclaw/clawhub-publish
    ```

  </Step>
  <Step title="Publish">
    ```bash
    clawhub publish
    ```

    Siehe [ClawHub — Publishing](/de/clawhub/publishing) für den vollständigen Ablauf.

  </Step>
</Steps>

## Bewährte Vorgehensweisen

<Tip>
  - **Fassen Sie sich kurz** — weisen Sie das Modell an, *was* zu tun ist, nicht wie es eine KI sein soll.
  - **Sicherheit zuerst** — wenn Ihr Skill `exec` verwendet, stellen Sie sicher, dass Prompts keine
    beliebige Command Injection aus nicht vertrauenswürdiger Eingabe erlauben.
  - **Lokal testen** — verwenden Sie `openclaw agent --message "..."`, bevor Sie ihn teilen.
  - **ClawHub verwenden** — durchsuchen Sie Community-Skills auf [clawhub.ai](https://clawhub.ai),
    bevor Sie etwas von Grund auf neu bauen.
</Tip>

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Skills reference" href="/de/tools/skills" icon="puzzle-piece">
    Ladereihenfolge, Gating, Allowlists und SKILL.md-Format.
  </Card>
  <Card title="Skill Workshop" href="/de/tools/skill-workshop" icon="flask">
    Vorschlagswarteschlange für vom Agent entworfene Skills.
  </Card>
  <Card title="Skills config" href="/de/tools/skills-config" icon="gear">
    Vollständiges `skills.*`-Konfigurationsschema.
  </Card>
  <Card title="ClawHub" href="/de/clawhub" icon="cloud">
    Skills im öffentlichen Registry durchsuchen und veröffentlichen.
  </Card>
  <Card title="Building plugins" href="/de/plugins/building-plugins" icon="plug">
    Plugins können Skills zusammen mit den Tools ausliefern, die sie dokumentieren.
  </Card>
</CardGroup>
