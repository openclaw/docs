---
read_when:
    - Sie erstellen eine neue benutzerdefinierte Skill.
    - Sie benötigen einen schnellen Einstiegs-Workflow für Skills auf Basis von SKILL.md
    - Sie möchten Skill Workshop verwenden, um einen Skill zur Überprüfung durch einen Agenten vorzuschlagen
sidebarTitle: Creating skills
summary: Erstellen, testen und veröffentlichen Sie benutzerdefinierte SKILL.md-Arbeitsbereich-Skills für Ihre OpenClaw-Agenten.
title: Skills erstellen
x-i18n:
    generated_at: "2026-07-12T15:56:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: cba2aa863ebd083d4592e8a764dbdc2c30a0dd8aff49d273927e82df0069bc81
    source_path: tools/creating-skills.md
    workflow: 16
---

Skills zeigen dem Agenten, wie und wann er Tools verwenden soll. Jeder Skill ist ein Verzeichnis
mit einer `SKILL.md`-Datei, die YAML-Frontmatter und Markdown-Anweisungen enthält.
OpenClaw lädt Skills aus mehreren Stammverzeichnissen in einer festgelegten [Prioritätsreihenfolge](/de/tools/skills#loading-order).

## Erstellen Sie Ihren ersten Skill

<Steps>
  <Step title="Erstellen Sie das Skill-Verzeichnis">
    Skills befinden sich im Ordner `skills/` Ihres Workspace:

    ```bash
    mkdir -p ~/.openclaw/workspace/skills/hello-world
    ```

    Sie können Skills zur besseren Organisation in Unterordnern gruppieren — der Skill wird
    weiterhin durch das `SKILL.md`-Frontmatter benannt, nicht durch den Ordnerpfad:

    ```bash
    mkdir -p ~/.openclaw/workspace/skills/personal/hello-world
    # Der Skill heißt weiterhin "hello-world" und wird als /hello-world aufgerufen
    ```

  </Step>

  <Step title="Schreiben Sie SKILL.md">
    Das Frontmatter definiert die Metadaten; der Textkörper enthält die Anweisungen für den Agenten.

    ```markdown
    ---
    name: hello-world
    description: Ein einfacher Skill, der eine Begrüßung ausgibt.
    ---

    # Hallo Welt

    Wenn der Benutzer um eine Begrüßung bittet, verwenden Sie das Tool `exec`, um Folgendes auszuführen:

    ```bash
    echo "Hallo von Ihrem benutzerdefinierten Skill!"
    ```
    ```

    Benennungsregeln:
    - Verwenden Sie für `name` Kleinbuchstaben, Ziffern und Bindestriche.
    - Halten Sie den Verzeichnisnamen und den Frontmatter-Wert `name` konsistent.
    - `description` wird dem Agenten und bei der Ermittlung von Slash-Befehlen angezeigt —
      halten Sie die Beschreibung einzeilig und kürzer als 160 Zeichen.

  </Step>

  <Step title="Überprüfen Sie, ob der Skill geladen wurde">
    ```bash
    openclaw skills list
    ```

    OpenClaw überwacht standardmäßig `SKILL.md`-Dateien unter den Stammverzeichnissen für Skills. Wenn die
    Überwachung deaktiviert ist oder Sie eine bestehende Sitzung fortsetzen, starten Sie eine neue,
    damit der Agent die aktualisierte Liste erhält:

    ```bash
    # Im Chat — aktuelle Sitzung archivieren und eine neue starten
    /new

    # Oder den Gateway neu starten
    openclaw gateway restart
    ```

  </Step>

  <Step title="Testen Sie den Skill">
    ```bash
    openclaw agent --message "Gib mir eine Begrüßung"
    ```

    Alternativ können Sie einen Chat öffnen und den Agenten direkt fragen. Verwenden Sie `/skill hello-world`, um
    den Skill ausdrücklich über seinen Namen aufzurufen.

  </Step>
</Steps>

## SKILL.md-Referenz

### Erforderliche Felder

| Feld          | Beschreibung                                                            |
| ------------- | ----------------------------------------------------------------------- |
| `name`        | Eindeutiger Slug aus Kleinbuchstaben, Ziffern und Bindestrichen         |
| `description` | Einzeilige Beschreibung, die dem Agenten und bei der Ermittlung angezeigt wird |

### Optionale Frontmatter-Schlüssel

| Feld                       | Standardwert | Beschreibung                                                                        |
| -------------------------- | ------------ | ----------------------------------------------------------------------------------- |
| `user-invocable`           | `true`       | Stellt den Skill als Slash-Befehl für Benutzer bereit                               |
| `disable-model-invocation` | `false`      | Schließt den Skill vom System-Prompt des Agenten aus (wird weiterhin über `/skill` ausgeführt) |
| `command-dispatch`         | —            | Auf `tool` setzen, um den Slash-Befehl unter Umgehung des Modells direkt an ein Tool weiterzuleiten |
| `command-tool`             | —            | Name des aufzurufenden Tools, wenn `command-dispatch: tool` festgelegt ist          |
| `command-arg-mode`         | `raw`        | Leitet bei der Tool-Weiterleitung die unverarbeitete Argumentzeichenfolge an das Tool weiter |
| `homepage`                 | —            | URL, die in der macOS-Benutzeroberfläche für Skills als "Website" angezeigt wird    |

Informationen zu Aktivierungsfeldern (`requires.bins`, `requires.env` usw.) finden Sie unter
[Skills — Aktivierungsbedingungen](/de/tools/skills#gating).

### Verwendung von `{baseDir}`

Verweisen Sie auf Dateien innerhalb des Skill-Verzeichnisses, ohne Pfade fest zu codieren — der
Agent löst `{baseDir}` relativ zum eigenen Verzeichnis des Skills auf:

```markdown
Führen Sie das Hilfsskript unter `{baseDir}/scripts/run.sh` aus.
```

## Bedingte Aktivierung hinzufügen

Beschränken Sie Ihren Skill so, dass er nur geladen wird, wenn seine Abhängigkeiten verfügbar sind:

```markdown
---
name: gemini-search
description: Suche mit der Gemini CLI.
metadata: { "openclaw": { "requires": { "bins": ["gemini"] }, "primaryEnv": "GEMINI_API_KEY" } }
---
```

<AccordionGroup>
  <Accordion title="Aktivierungsoptionen">
    | Schlüssel | Beschreibung |
    | --- | --- |
    | `requires.bins` | Alle Binärdateien müssen in `PATH` vorhanden sein |
    | `requires.anyBins` | Mindestens eine Binärdatei muss in `PATH` vorhanden sein |
    | `requires.env` | Jede Umgebungsvariable muss im Prozess oder in der Konfiguration vorhanden sein |
    | `requires.config` | Jeder Pfad in `openclaw.json` muss einen Wahrheitswert ergeben |
    | `os` | Plattformfilter: `["darwin"]`, `["linux"]`, `["win32"]` |
    | `always` | Auf `true` setzen, um alle Aktivierungsbedingungen zu überspringen und den Skill immer einzubeziehen |

    Vollständige Referenz: [Skills — Aktivierungsbedingungen](/de/tools/skills#gating).

  </Accordion>
  <Accordion title="Umgebung und API-Schlüssel">
    Verknüpfen Sie einen API-Schlüssel mit einem Skill-Eintrag in `openclaw.json`:

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

    Der Schlüssel wird nur für diesen Agentendurchlauf in den Hostprozess eingefügt.
    Er gelangt nicht in die Sandbox — siehe
    [Umgebungsvariablen in der Sandbox](/de/tools/skills-config#sandboxed-skills-and-env-vars).

  </Accordion>
</AccordionGroup>

## Über Skill Workshop vorschlagen

Verwenden Sie für vom Agenten entworfene Skills oder wenn Sie vor der
Aktivierung eines Skills eine Prüfung durch den Betreiber wünschen, Vorschläge im [Skill Workshop](/de/tools/skill-workshop), statt
`SKILL.md` direkt zu schreiben.

```bash
# Einen völlig neuen Skill vorschlagen
openclaw skills workshop propose-create \
  --name "hello-world" \
  --description "Ein einfacher Skill, der eine Begrüßung ausgibt." \
  --proposal ./PROPOSAL.md

# Eine Aktualisierung für einen bestehenden Skill vorschlagen
openclaw skills workshop propose-update hello-world \
  --proposal ./PROPOSAL.md \
  --description "Aktualisierter Begrüßungs-Skill"
```

Verwenden Sie `--proposal-dir`, wenn der Vorschlag unterstützende Dateien enthält:

```bash
openclaw skills workshop propose-create \
  --name "hello-world" \
  --description "Ein einfacher Skill, der eine Begrüßung ausgibt." \
  --proposal-dir ./hello-world-proposal/
```

Das Verzeichnis muss in seinem Stammverzeichnis eine Datei namens `PROPOSAL.md` enthalten. Unterstützende Dateien gehören in
`assets/`, `examples/`, `references/`, `scripts/` oder `templates/`.

Nach der Prüfung:

```bash
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop apply <proposal-id>
```

Den vollständigen Lebenszyklus eines Vorschlags finden Sie unter [Skill Workshop](/de/tools/skill-workshop).

## Auf ClawHub veröffentlichen

<Steps>
  <Step title="Stellen Sie sicher, dass Ihre SKILL.md vollständig ist">
    Vergewissern Sie sich, dass `name`, `description` und alle Aktivierungsfelder unter `metadata.openclaw`
    festgelegt sind. Fügen Sie eine `homepage`-URL hinzu, wenn Sie über eine Projektseite verfügen.
  </Step>
  <Step title="Installieren Sie die eigenständige ClawHub CLI und melden Sie sich an">
    ```bash
    npm i -g clawhub
    clawhub login
    ```
  </Step>
  <Step title="Veröffentlichen">
    ```bash
    clawhub skill publish ./path/to/hello-world
    ```

    Fügen Sie `--version <version>` oder `--owner <owner>` hinzu, um die abgeleitete
    Version zu überschreiben oder unter einem bestimmten Eigentümer zu veröffentlichen. Unter
    [ClawHub — Veröffentlichung](/de/clawhub/publishing) und
    [ClawHub CLI](/de/clawhub/cli) finden Sie den vollständigen Ablauf, die Zuordnung zu Eigentümern und weitere
    Wartungsbefehle (`clawhub sync`, `clawhub skill rename`, ...).

  </Step>
</Steps>

## Bewährte Methoden

<Tip>
  - **Fassen Sie sich kurz** — weisen Sie das Modell an, *was* es tun soll, nicht, wie es eine KI sein soll.
  - **Sicherheit zuerst** — wenn Ihr Skill `exec` verwendet, stellen Sie sicher, dass Prompts keine
    beliebige Befehlsinjektion aus nicht vertrauenswürdigen Eingaben ermöglichen.
  - **Lokal testen** — verwenden Sie vor dem Teilen `openclaw agent --message "..."`.
  - **ClawHub verwenden** — durchsuchen Sie die Community-Skills unter [clawhub.ai](https://clawhub.ai),
    bevor Sie etwas von Grund auf neu entwickeln.
</Tip>

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Skills-Referenz" href="/de/tools/skills" icon="puzzle-piece">
    Ladereihenfolge, Aktivierungsbedingungen, Zulassungslisten und das SKILL.md-Format.
  </Card>
  <Card title="Skill Workshop" href="/de/tools/skill-workshop" icon="flask">
    Vorschlagswarteschlange für vom Agenten entworfene Skills.
  </Card>
  <Card title="Skills-Konfiguration" href="/de/tools/skills-config" icon="gear">
    Vollständiges Konfigurationsschema für `skills.*`.
  </Card>
  <Card title="ClawHub" href="/clawhub" icon="cloud">
    Durchsuchen und veröffentlichen Sie Skills im öffentlichen Register.
  </Card>
  <Card title="Plugins entwickeln" href="/de/plugins/building-plugins" icon="plug">
    Plugins können Skills zusammen mit den Tools bereitstellen, die sie dokumentieren.
  </Card>
</CardGroup>
