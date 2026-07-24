---
read_when:
    - Sie erstellen einen neuen benutzerdefinierten Skill
    - Sie benötigen einen schnellen Einstiegs-Workflow für auf SKILL.md basierende Skills
    - Sie möchten Skill Workshop verwenden, um einen Skill zur Agentenprüfung vorzuschlagen
sidebarTitle: Creating skills
summary: Erstellen, testen und veröffentlichen Sie benutzerdefinierte SKILL.md-Arbeitsbereichs-Skills für Ihre OpenClaw-Agenten.
title: Skills erstellen
x-i18n:
    generated_at: "2026-07-24T04:11:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: cba2aa863ebd083d4592e8a764dbdc2c30a0dd8aff49d273927e82df0069bc81
    source_path: tools/creating-skills.md
    workflow: 16
---

Skills vermitteln dem Agenten, wie und wann Werkzeuge verwendet werden. Jeder Skill ist ein Verzeichnis,
das eine `SKILL.md`-Datei mit YAML-Frontmatter und Markdown-Anweisungen enthält.
OpenClaw lädt Skills aus mehreren Stammverzeichnissen in einer festgelegten [Prioritätsreihenfolge](/de/tools/skills#loading-order).

## Erstellen Sie Ihren ersten Skill

<Steps>
  <Step title="Skill-Verzeichnis erstellen">
    Skills befinden sich im Ordner `skills/` Ihres Arbeitsbereichs:

    ```bash
    mkdir -p ~/.openclaw/workspace/skills/hello-world
    ```

    Zur besseren Organisation können Sie Skills in Unterordnern gruppieren — der Skill wird weiterhin
    durch das `SKILL.md`-Frontmatter benannt, nicht durch den Ordnerpfad:

    ```bash
    mkdir -p ~/.openclaw/workspace/skills/personal/hello-world
    # Der Skill-Name lautet weiterhin "hello-world", aufgerufen als /hello-world
    ```

  </Step>

  <Step title="SKILL.md schreiben">
    Das Frontmatter definiert die Metadaten; der Textkörper enthält die Anweisungen für den Agenten.

    ```markdown
    ---
    name: hello-world
    description: Ein einfacher Skill, der eine Begrüßung ausgibt.
    ---

    # Hallo Welt

    Wenn der Benutzer um eine Begrüßung bittet, verwenden Sie das Werkzeug `exec`, um Folgendes auszuführen:

    ```bash
    echo "Hallo von Ihrem benutzerdefinierten Skill!"
    ```
    ```

    Benennungsregeln:
    - Verwenden Sie für `name` Kleinbuchstaben, Ziffern und Bindestriche.
    - Halten Sie den Verzeichnisnamen und den Frontmatter-Wert `name` identisch.
    - `description` wird dem Agenten und bei der Ermittlung von Slash-Befehlen angezeigt —
      halten Sie die Beschreibung einzeilig und kürzer als 160 Zeichen.

  </Step>

  <Step title="Laden des Skills überprüfen">
    ```bash
    openclaw skills list
    ```

    OpenClaw überwacht standardmäßig `SKILL.md`-Dateien unter den Stammverzeichnissen für Skills. Wenn die
    Überwachung deaktiviert ist oder Sie eine bestehende Sitzung fortsetzen, starten Sie eine neue
    Sitzung, damit der Agent die aktualisierte Liste erhält:

    ```bash
    # Im Chat — aktuelle Sitzung archivieren und eine neue starten
    /new

    # Oder das Gateway neu starten
    openclaw gateway restart
    ```

  </Step>

  <Step title="Skill testen">
    ```bash
    openclaw agent --message "gib mir eine Begrüßung"
    ```

    Alternativ können Sie einen Chat öffnen und den Agenten direkt fragen. Verwenden Sie `/skill hello-world`, um
    ihn ausdrücklich anhand seines Namens aufzurufen.

  </Step>
</Steps>

## SKILL.md-Referenz

### Erforderliche Felder

| Feld          | Beschreibung                                                    |
| ------------- | --------------------------------------------------------------- |
| `name`        | Eindeutiger Slug aus Kleinbuchstaben, Ziffern und Bindestrichen |
| `description` | Einzeilige Beschreibung, die dem Agenten und in der Ermittlungsausgabe angezeigt wird |

### Optionale Frontmatter-Schlüssel

| Feld                       | Standardwert | Beschreibung                                                                   |
| -------------------------- | ------------ | ------------------------------------------------------------------------------ |
| `user-invocable`           | `true`  | Den Skill als Slash-Befehl für Benutzer verfügbar machen                       |
| `disable-model-invocation` | `false` | Den Skill aus dem System-Prompt des Agenten ausschließen (wird weiterhin über `/skill` ausgeführt) |
| `command-dispatch`         | —            | Auf `tool` setzen, um den Slash-Befehl unter Umgehung des Modells direkt an ein Werkzeug weiterzuleiten |
| `command-tool`             | —            | Name des aufzurufenden Werkzeugs, wenn `command-dispatch: tool` gesetzt ist          |
| `command-arg-mode`         | `raw`   | Leitet bei der Werkzeugweiterleitung die unverarbeitete Argumentzeichenfolge an das Werkzeug weiter |
| `homepage`                 | —            | URL, die in der macOS-Benutzeroberfläche für Skills als „Website“ angezeigt wird |

Informationen zu Aktivierungsfeldern (`requires.bins`, `requires.env` usw.) finden Sie unter
[Skills — Aktivierung](/de/tools/skills#gating).

### Verwendung von `{baseDir}`

Verweisen Sie auf Dateien innerhalb des Skill-Verzeichnisses, ohne Pfade fest zu codieren — der
Agent löst `{baseDir}` relativ zum Verzeichnis des Skills auf:

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
    | `requires.bins` | Alle Binärdateien müssen unter `PATH` vorhanden sein |
    | `requires.anyBins` | Mindestens eine Binärdatei muss unter `PATH` vorhanden sein |
    | `requires.env` | Jede Umgebungsvariable muss im Prozess oder in der Konfiguration vorhanden sein |
    | `requires.config` | Jeder `openclaw.json`-Pfad muss einen als wahr ausgewerteten Wert haben |
    | `os` | Plattformfilter: `["darwin"]`, `["linux"]`, `["win32"]` |
    | `always` | Setzen Sie `true`, um alle Aktivierungsbedingungen zu überspringen und den Skill immer einzubeziehen |

    Vollständige Referenz: [Skills — Aktivierung](/de/tools/skills#gating).

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

Verwenden Sie für vom Agenten entworfene Skills oder wenn Sie eine Überprüfung durch den Betreiber wünschen, bevor ein Skill
aktiviert wird, Vorschläge über [Skill Workshop](/de/tools/skill-workshop), anstatt
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

Das Verzeichnis muss in seinem Stammverzeichnis `PROPOSAL.md` enthalten. Unterstützende Dateien werden unter
`assets/`, `examples/`, `references/`, `scripts/` oder `templates/` abgelegt.

Nach der Überprüfung:

```bash
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop apply <proposal-id>
```

Den vollständigen Lebenszyklus eines Vorschlags finden Sie unter [Skill Workshop](/de/tools/skill-workshop).

## Auf ClawHub veröffentlichen

<Steps>
  <Step title="Vollständigkeit Ihrer SKILL.md sicherstellen">
    Stellen Sie sicher, dass `name`, `description` und alle `metadata.openclaw`-Aktivierungsfelder
    festgelegt sind. Fügen Sie eine `homepage`-URL hinzu, wenn Sie über eine Projektseite verfügen.
  </Step>
  <Step title="Eigenständige ClawHub CLI installieren und anmelden">
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
    Version zu überschreiben oder unter einem bestimmten Eigentümer zu veröffentlichen. Informationen zum vollständigen Ablauf, zur Eingrenzung auf Eigentümer und zu weiteren
    Wartungsbefehlen (`clawhub sync`, `clawhub skill rename`, ...) finden Sie unter
    [ClawHub — Veröffentlichung](/de/clawhub/publishing) und
    [ClawHub CLI](/de/clawhub/cli).

  </Step>
</Steps>

## Bewährte Verfahren

<Tip>
  - **Fassen Sie sich kurz** — weisen Sie das Modell an, *was* es tun soll, nicht, wie es eine KI sein soll.
  - **Sicherheit zuerst** — wenn Ihr Skill `exec` verwendet, stellen Sie sicher, dass Prompts keine
    beliebige Befehlseinschleusung aus nicht vertrauenswürdigen Eingaben zulassen.
  - **Lokal testen** — verwenden Sie vor dem Teilen `openclaw agent --message "..."`.
  - **ClawHub verwenden** — durchsuchen Sie vor einer Neuentwicklung die Community-Skills unter [clawhub.ai](https://clawhub.ai).

</Tip>

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Skills-Referenz" href="/de/tools/skills" icon="puzzle-piece">
    Ladereihenfolge, Aktivierungsbedingungen, Positivlisten und SKILL.md-Format.
  </Card>
  <Card title="Skill Workshop" href="/de/tools/skill-workshop" icon="flask">
    Vorschlagswarteschlange für vom Agenten entworfene Skills.
  </Card>
  <Card title="Skills-Konfiguration" href="/de/tools/skills-config" icon="gear">
    Vollständiges `skills.*`-Konfigurationsschema.
  </Card>
  <Card title="ClawHub" href="/clawhub" icon="cloud">
    Skills im öffentlichen Register durchsuchen und veröffentlichen.
  </Card>
  <Card title="Plugins erstellen" href="/de/plugins/building-plugins" icon="plug">
    Plugins können Skills zusammen mit den Werkzeugen bereitstellen, die sie dokumentieren.
  </Card>
</CardGroup>
