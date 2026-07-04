---
read_when:
    - Skills hinzufügen oder ändern
    - Ändern von Skill-Gating, Allowlists oder Laderegeln
    - Skill-Priorität und Snapshot-Verhalten verstehen
sidebarTitle: Skills
summary: Skills bringen Ihrem Agenten bei, wie er Tools verwendet. Erfahren Sie, wie sie geladen werden, wie Vorrang funktioniert und wie Sie Gating, Allowlisten und Umgebungseinbindung konfigurieren.
title: Skills
x-i18n:
    generated_at: "2026-07-04T06:27:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 81b0f8dfc6522994b2dba865e236d1de3220fe265698506332d3139e38d9c929
    source_path: tools/skills.md
    workflow: 16
---

Skills sind Markdown-Anweisungsdateien, die dem Agenten beibringen, wie und wann er
Tools verwendet. Jeder Skill liegt in einem Verzeichnis, das eine `SKILL.md`-Datei
mit YAML-Frontmatter und einem Markdown-Body enthält. OpenClaw lädt gebündelte
Skills sowie lokale Überschreibungen und filtert sie beim Laden basierend auf
Umgebung, Konfiguration und vorhandenen Binärdateien.

<CardGroup cols={2}>
  <Card title="Skills erstellen" href="/de/tools/creating-skills" icon="hammer">
    Erstellen und testen Sie einen benutzerdefinierten Skill von Grund auf.
  </Card>
  <Card title="Skill-Workshop" href="/de/tools/skill-workshop" icon="flask">
    Prüfen und genehmigen Sie vom Agenten entworfene Skill-Vorschläge.
  </Card>
  <Card title="Skills-Konfiguration" href="/de/tools/skills-config" icon="gear">
    Vollständiges `skills.*`-Konfigurationsschema und Agent-Allowlists.
  </Card>
  <Card title="ClawHub" href="/clawhub" icon="cloud">
    Community-Skills durchsuchen und installieren.
  </Card>
</CardGroup>

## Ladereihenfolge

OpenClaw lädt aus diesen Quellen, **höchste Priorität zuerst**. Wenn derselbe
Skill-Name an mehreren Stellen erscheint, gewinnt die Quelle mit der höchsten
Priorität.

| Priorität     | Quelle                  | Pfad                                    |
| ------------- | ----------------------- | --------------------------------------- |
| 1 — höchste   | Workspace-Skills        | `<workspace>/skills`                    |
| 2             | Projekt-Agent-Skills    | `<workspace>/.agents/skills`            |
| 3             | Persönliche Agent-Skills | `~/.agents/skills`                      |
| 4             | Verwaltete / lokale Skills | `~/.openclaw/skills`                    |
| 5             | Gebündelte Skills       | mit der Installation ausgeliefert       |
| 6 — niedrigste | Zusätzliche Verzeichnisse | `skills.load.extraDirs` + Plugin-Skills |

Skill-Wurzeln unterstützen gruppierte Layouts. OpenClaw entdeckt einen Skill,
sobald `SKILL.md` irgendwo unter einer konfigurierten Wurzel erscheint:

```text
<workspace>/skills/research/SKILL.md          ✓ found as "research"
<workspace>/skills/personal/research/SKILL.md ✓ also found as "research"
```

Der Ordnerpfad dient nur der Organisation. Der Name des Skills, der
Slash-Befehl und der Allowlist-Schlüssel stammen alle aus dem Frontmatter-Feld
`name` (oder aus dem Verzeichnisnamen, wenn `name` fehlt).

<Note>
  Das native `$CODEX_HOME/skills`-Verzeichnis der Codex CLI ist **keine**
  OpenClaw-Skill-Wurzel. Verwenden Sie `openclaw migrate plan codex`, um diese
  Skills zu inventarisieren, und anschließend `openclaw migrate codex`, um sie
  in Ihren OpenClaw-Workspace zu kopieren.
</Note>

## Agent-spezifische vs. gemeinsame Skills

In Multi-Agent-Setups hat jeder Agent seinen eigenen Workspace. Verwenden Sie
den Pfad, der Ihrer gewünschten Sichtbarkeit entspricht:

| Geltungsbereich       | Pfad                         | Sichtbar für                         |
| --------------------- | ---------------------------- | ------------------------------------ |
| Agent-spezifisch      | `<workspace>/skills`         | Nur diesen Agenten                   |
| Projekt-Agent         | `<workspace>/.agents/skills` | Nur den Agenten dieses Workspace     |
| Persönlicher Agent    | `~/.agents/skills`           | Alle Agenten auf diesem Computer     |
| Gemeinsam verwaltet   | `~/.openclaw/skills`         | Alle Agenten auf diesem Computer     |
| Zusätzliche Verzeichnisse | `skills.load.extraDirs`      | Alle Agenten auf diesem Computer     |

## Agent-Allowlists

Skill-**Speicherort** (Priorität) und Skill-**Sichtbarkeit** (welcher Agent ihn
verwenden kann) sind getrennte Steuerungen. Verwenden Sie Allowlists, um
einzuschränken, welche Skills ein Agent sieht, unabhängig davon, von wo sie
geladen werden.

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"], // shared baseline
    },
    list: [
      { id: "writer" }, // inherits github, weather
      { id: "docs", skills: ["docs-search"] }, // replaces defaults entirely
      { id: "locked-down", skills: [] }, // no skills
    ],
  },
}
```

<AccordionGroup>
  <Accordion title="Allowlist-Regeln">
    - Lassen Sie `agents.defaults.skills` weg, damit standardmäßig alle Skills uneingeschränkt bleiben.
    - Lassen Sie `agents.list[].skills` weg, um `agents.defaults.skills` zu erben.
    - Setzen Sie `agents.list[].skills: []`, um für diesen Agenten keine Skills bereitzustellen.
    - Eine nicht leere `agents.list[].skills`-Liste ist die **endgültige** Menge — sie wird nicht
      mit den Defaults zusammengeführt.
    - Die effektive Allowlist gilt für Prompt-Erstellung, Slash-Befehls-Erkennung,
      Sandbox-Synchronisierung und Skill-Snapshots.
    - Dies ist keine Autorisierungsgrenze für die Host-Shell. Wenn derselbe Agent
      `exec` verwenden kann, beschränken Sie diese Shell separat mit Sandboxing,
      OS-Benutzer-Isolation, Exec-Deny-/Allowlists und ressourcenspezifischen Anmeldedaten.
  </Accordion>
</AccordionGroup>

## Plugins und Skills

Plugins können eigene Skills ausliefern, indem sie `skills`-Verzeichnisse in
`openclaw.plugin.json` auflisten (Pfade relativ zur Plugin-Wurzel). Plugin-Skills
werden geladen, wenn das Plugin aktiviert ist — zum Beispiel liefert das
Browser-Plugin einen `browser-automation`-Skill für mehrstufige Browser-Steuerung aus.

Plugin-Skill-Verzeichnisse werden auf derselben niedrig priorisierten Ebene wie
`skills.load.extraDirs` zusammengeführt, sodass ein gleichnamiger gebündelter,
verwalteter, Agent- oder Workspace-Skill sie überschreibt. Begrenzen Sie sie über
`metadata.openclaw.requires.config` im Konfigurationseintrag des Plugins.

Siehe [Plugins](/de/tools/plugin) und [Tools](/de/tools) für das vollständige Plugin-System.

## Skill-Workshop

[Skill-Workshop](/de/tools/skill-workshop) ist eine Vorschlagswarteschlange zwischen
dem Agenten und Ihren aktiven Skill-Dateien. Wenn der Agent wiederverwendbare
Arbeit erkennt, erstellt er einen Vorschlag, statt direkt in `SKILL.md` zu
schreiben. Sie prüfen und genehmigen ihn, bevor sich etwas ändert.

```bash
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop apply <proposal-id>
```

Siehe [Skill-Workshop](/de/tools/skill-workshop) für den vollständigen Lebenszyklus,
die CLI-Referenz und die Konfiguration.

## Installation aus ClawHub

[ClawHub](https://clawhub.ai) ist die öffentliche Skills-Registry. Verwenden Sie
`openclaw skills`-Befehle für Installation und Aktualisierung oder die `clawhub`
CLI für Veröffentlichung und Synchronisierung.

| Aktion                                      | Befehl                                                 |
| ------------------------------------------- | ------------------------------------------------------ |
| Einen Skill im Workspace installieren       | `openclaw skills install @owner/<slug>`                |
| Aus einem Git-Repository installieren       | `openclaw skills install git:owner/repo@ref`           |
| Ein lokales Skill-Verzeichnis installieren  | `openclaw skills install ./path/to/skill --as my-tool` |
| Für alle lokalen Agenten installieren       | `openclaw skills install @owner/<slug> --global`       |
| Alle Workspace-Skills aktualisieren         | `openclaw skills update --all`                         |
| Einen gemeinsam verwalteten Skill aktualisieren | `openclaw skills update @owner/<slug> --global`        |
| Alle gemeinsam verwalteten Skills aktualisieren | `openclaw skills update --all --global`                |
| Trust Envelope eines Skills prüfen          | `openclaw skills verify @owner/<slug>`                 |
| Die generierte Skill Card ausgeben          | `openclaw skills verify @owner/<slug> --card`          |
| Über ClawHub CLI veröffentlichen / synchronisieren | `clawhub sync --all`                                   |

<AccordionGroup>
  <Accordion title="Installationsdetails">
    `openclaw skills install` installiert standardmäßig in das `skills/`-Verzeichnis
    des aktiven Workspace. Fügen Sie `--global` hinzu, um in das gemeinsam genutzte
    Verzeichnis `~/.openclaw/skills` zu installieren, das für alle lokalen Agenten
    sichtbar ist, sofern Agent-Allowlists es nicht einschränken.

    Git- und lokale Installationen erwarten `SKILL.md` an der Quellwurzel. Der Slug
    stammt aus dem `name`-Frontmatter von `SKILL.md`, wenn gültig, und fällt sonst
    auf den Verzeichnis- oder Repository-Namen zurück. Verwenden Sie `--as <slug>`,
    um ihn zu überschreiben. `openclaw skills update` verfolgt nur ClawHub-Installationen —
    installieren Sie Git- oder lokale Quellen erneut, um sie zu aktualisieren.

  </Accordion>
  <Accordion title="Verifizierung und Sicherheitsscans">
    `openclaw skills verify @owner/<slug>` fragt ClawHub nach dem
    `clawhub.skill.verify.v1` Trust Envelope des Skills. Installierte ClawHub-Skills
    werden gegen die Version und Registry geprüft, die in `.clawhub/origin.json`
    aufgezeichnet sind. Bloße Slugs bleiben für bestehende installierte oder
    eindeutige Skills akzeptiert, aber owner-qualifizierte Refs vermeiden
    Publisher-Mehrdeutigkeit.

    ClawHub-Skill-Seiten zeigen vor der Installation den neuesten Sicherheits-Scanstatus
    mit Detailseiten für VirusTotal, ClawScan und statische Analyse. Der Befehl beendet
    sich mit einem Wert ungleich null, wenn ClawHub die Verifizierung als fehlgeschlagen
    markiert. Publisher beheben False Positives über das ClawHub-Dashboard oder
    `clawhub skill rescan @owner/<slug>`.

  </Accordion>
  <Accordion title="Installationen aus privaten Archiven">
    Gateway-Clients, die eine Bereitstellung außerhalb von ClawHub benötigen, können
    ein ZIP-Skill-Archiv mit `skills.upload.begin`, `skills.upload.chunk` und
    `skills.upload.commit` bereitstellen und anschließend mit
    `skills.install({ source: "upload", ... })` installieren. Dieser Pfad ist
    standardmäßig deaktiviert und erfordert `skills.install.allowUploadedArchives: true`
    in `openclaw.json`. Normale ClawHub-Installationen benötigen diese Einstellung nie.
  </Accordion>
</AccordionGroup>

## Sicherheit

<Warning>
  Behandeln Sie Skills von Drittanbietern als **nicht vertrauenswürdigen Code**.
  Lesen Sie sie, bevor Sie sie aktivieren. Bevorzugen Sie sandboxed Runs für
  nicht vertrauenswürdige Eingaben und riskante Tools. Siehe
  [Sandboxing](/de/gateway/sandboxing) für agentenseitige Steuerungen.
</Warning>

<AccordionGroup>
  <Accordion title="Pfadbegrenzung">
    Die Skill-Erkennung für Workspace-, Projekt-Agent- und Zusatzverzeichnis-Skills
    akzeptiert nur Skill-Wurzeln, deren aufgelöster Realpath innerhalb der
    konfigurierten Wurzel bleibt, es sei denn, `skills.load.allowSymlinkTargets`
    vertraut explizit einer Zielwurzel. Skill-Workshop schreibt nur dann über
    diese vertrauenswürdigen Ziele, wenn `skills.workshop.allowSymlinkTargetWrites`
    aktiviert ist. Verwaltete `~/.openclaw/skills` und persönliche
    `~/.agents/skills` dürfen symlinkte Skill-Ordner enthalten, aber jeder
    `SKILL.md`-Realpath muss weiterhin innerhalb seines aufgelösten
    Skill-Verzeichnisses bleiben.
  </Accordion>
  <Accordion title="Installationsrichtlinie des Operators">
    Konfigurieren Sie `security.installPolicy`, um einen vertrauenswürdigen lokalen
    Richtlinienbefehl auszuführen, bevor Skill-Installationen fortgesetzt werden.
    Die Richtlinie erhält Metadaten und den bereitgestellten Quellpfad, gilt für
    ClawHub-, Upload-, Git-, lokale, Update- und Dependency-Installer-Pfade und
    schlägt geschlossen fehl, wenn der Befehl keine gültige Entscheidung zurückgeben kann.
  </Accordion>
  <Accordion title="Geltungsbereich der Secret-Injektion">
    `skills.entries.*.env` und `skills.entries.*.apiKey` injizieren Secrets nur
    für diesen Agent-Turn in den **Host**-Prozess — nicht in die Sandbox. Halten
    Sie Secrets aus Prompts und Logs heraus.
  </Accordion>
</AccordionGroup>

Für das umfassendere Bedrohungsmodell und Sicherheits-Checklisten siehe
[Security](/de/gateway/security).

## SKILL.md-Format

Jeder Skill benötigt mindestens `name` und `description` im Frontmatter:

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---

When the user asks to generate an image, use the `image_generate` tool...
```

<Note>
  OpenClaw folgt der [AgentSkills](https://agentskills.io)-Spezifikation. Der
  Frontmatter-Parser unterstützt **nur einzeilige Schlüssel** — `metadata` muss
  ein einzeiliges JSON-Objekt sein. Verwenden Sie `{baseDir}` im Body, um auf den
  Ordnerpfad des Skills zu verweisen.
</Note>

### Optionale Frontmatter-Schlüssel

<ParamField path="homepage" type="string">
  URL, die in der macOS-Skills-UI als "Website" angezeigt wird. Auch über
  `metadata.openclaw.homepage` unterstützt.
</ParamField>

<ParamField path="user-invocable" type="boolean" default="true">
  Wenn `true`, wird der Skill als vom Benutzer aufrufbarer Slash-Befehl verfügbar gemacht.
</ParamField>

<ParamField path="disable-model-invocation" type="boolean" default="false">
  Wenn `true`, hält OpenClaw die Anweisungen des Skills aus dem normalen Prompt
  des Agenten heraus. Der Skill ist weiterhin als Slash-Befehl verfügbar, wenn
  `user-invocable` ebenfalls `true` ist.
</ParamField>

<ParamField path="command-dispatch" type='"tool"'>
  Wenn auf `tool` gesetzt, umgeht der Slash-Befehl das Modell und dispatcht
  direkt an ein registriertes Tool.
</ParamField>

<ParamField path="command-tool" type="string">
  Tool-Name, der aufgerufen wird, wenn `command-dispatch: tool` gesetzt ist.
</ParamField>

<ParamField path="command-arg-mode" type='"raw"' default="raw">
  Für Tool-Dispatch wird die rohe Argumentzeichenfolge ohne Core-Parsing an das Tool
  weitergeleitet. Das Tool erhält
  `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`.
</ParamField>

## Gating

OpenClaw filtert Skills beim Laden mit `metadata.openclaw` (einzeiliges
JSON im Frontmatter). Ein Skill ohne `metadata.openclaw`-Block ist immer
zulässig, sofern er nicht ausdrücklich deaktiviert wurde.

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
metadata:
  {
    "openclaw":
      {
        "requires": { "bins": ["uv"], "env": ["GEMINI_API_KEY"], "config": ["browser.enabled"] },
        "primaryEnv": "GEMINI_API_KEY",
      },
  }
---
```

<ParamField path="always" type="boolean">
  Wenn `true`, wird der Skill immer einbezogen und alle anderen Gates werden übersprungen.
</ParamField>

<ParamField path="emoji" type="string">
  Optionales Emoji, das in der macOS Skills UI angezeigt wird.
</ParamField>

<ParamField path="homepage" type="string">
  Optionale URL, die als „Website“ in der macOS Skills UI angezeigt wird.
</ParamField>

<ParamField path="os" type='"darwin" | "linux" | "win32"'>
  Plattformfilter. Wenn gesetzt, ist der Skill nur auf den aufgeführten Betriebssystemen zulässig.
</ParamField>

<ParamField path="requires.bins" type="string[]">
  Jede Binärdatei muss auf `PATH` vorhanden sein.
</ParamField>

<ParamField path="requires.anyBins" type="string[]">
  Mindestens eine Binärdatei muss auf `PATH` vorhanden sein.
</ParamField>

<ParamField path="requires.env" type="string[]">
  Jede Umgebungsvariable muss im Prozess vorhanden sein oder über die Konfiguration bereitgestellt werden.
</ParamField>

<ParamField path="requires.config" type="string[]">
  Jeder `openclaw.json`-Pfad muss truthy sein.
</ParamField>

<ParamField path="primaryEnv" type="string">
  Name der Umgebungsvariable, die `skills.entries.<name>.apiKey` zugeordnet ist.
</ParamField>

<ParamField path="install" type="object[]">
  Optionale Installationsspezifikationen, die von der macOS Skills UI verwendet werden (brew / node / go / uv / download).
</ParamField>

<Note>
  Legacy-`metadata.clawdbot`-Blöcke werden weiterhin akzeptiert, wenn
  `metadata.openclaw` fehlt, sodass ältere installierte Skills ihre
  Abhängigkeits-Gates und Installationshinweise behalten. Neue Skills sollten
  `metadata.openclaw` verwenden.
</Note>

### Installationsspezifikationen

Installationsspezifikationen teilen der macOS Skills UI mit, wie eine Abhängigkeit installiert wird:

```markdown
---
name: gemini
description: Use Gemini CLI for coding assistance and Google search lookups.
metadata:
  {
    "openclaw":
      {
        "emoji": "♊️",
        "requires": { "bins": ["gemini"] },
        "install":
          [
            {
              "id": "brew",
              "kind": "brew",
              "formula": "gemini-cli",
              "bins": ["gemini"],
              "label": "Install Gemini CLI (brew)",
            },
          ],
      },
  }
---
```

<AccordionGroup>
  <Accordion title="Installer selection rules">
    - Wenn mehrere Installationsprogramme aufgeführt sind, wählt der Gateway
      eine bevorzugte Option (brew, wenn verfügbar, andernfalls node).
    - Wenn alle Installationsprogramme `download` sind, listet OpenClaw jeden
      Eintrag auf, damit Sie alle verfügbaren Artefakte sehen können.
    - Spezifikationen können `os: ["darwin"|"linux"|"win32"]` enthalten, um nach Plattform zu filtern.
    - Node-Installationen berücksichtigen `skills.install.nodeManager` in `openclaw.json`
      (Standard: npm; Optionen: npm / pnpm / yarn / bun). Dies wirkt sich nur auf
      Skill-Installationen aus; die Gateway-Laufzeit sollte weiterhin Node sein.
    - Gateway-Präferenz für Installationsprogramme: Homebrew → uv → konfigurierter Node-Manager →
      go → download.
  </Accordion>
  <Accordion title="Per-installer details">
    - **Homebrew:** OpenClaw installiert Homebrew nicht automatisch und übersetzt brew-Formeln
      nicht in Systempaketbefehle. In Linux-Containern ohne
      `brew` werden nur-brew-Installationsprogramme ausgeblendet; verwenden Sie ein eigenes Image oder installieren
      Sie die Abhängigkeit manuell.
    - **Go:** OpenClaw erfordert Go 1.21 oder neuer für automatische Skill-Installationen und
      bewahrt die vorhandenen Einstellungen `GOBIN`, `GOPATH` und `GOTOOLCHAIN`. Wenn die
      konfigurierte Toolchain die erforderliche Go-Version eines Moduls nicht erfüllen kann,
      gruppiert das Onboarding den Skill nach dem Installationsversuch mit manuellen Go-Voraussetzungen.
      Wenn `go` fehlt und Homebrew verfügbar ist, installiert OpenClaw
      zuerst Go über Homebrew und setzt `GOBIN` auf das `bin` von Homebrew. Unter Linux
      kann OpenClaw stattdessen `apt-get` als root oder über passwortloses `sudo`
      verwenden, wenn der aktualisierte `golang-go`-Kandidat die Mindestversion erfüllt.
    - **Download:** `url` (erforderlich), `archive` (`tar.gz` | `tar.bz2` | `zip`),
      `extract` (Standard: auto, wenn Archiv erkannt), `stripComponents`,
      `targetDir` (Standard: `~/.openclaw/tools/<skillKey>`).
  </Accordion>
  <Accordion title="Sandboxing notes">
    `requires.bins` wird beim Laden des Skills auf dem **Host** geprüft. Wenn ein Agent
    in einer Sandbox läuft, muss die Binärdatei auch **innerhalb des Containers** vorhanden sein.
    Installieren Sie sie über `agents.defaults.sandbox.docker.setupCommand` oder ein eigenes
    Image. `setupCommand` läuft einmal nach der Containererstellung und erfordert
    ausgehenden Netzwerkzugriff, ein beschreibbares Root-Dateisystem und einen root-Benutzer in der Sandbox.
  </Accordion>
</AccordionGroup>

## Konfigurationsüberschreibungen

Schalten Sie gebündelte oder verwaltete Skills unter `skills.entries` in
`~/.openclaw/openclaw.json` ein und konfigurieren Sie sie:

```json5
{
  skills: {
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" },
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
        config: {
          endpoint: "https://example.invalid",
          model: "nano-pro",
        },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

<ParamField path="enabled" type="boolean">
  `false` deaktiviert den Skill, selbst wenn er gebündelt oder installiert ist. Der gebündelte
  Skill `coding-agent` ist opt-in — setzen Sie `skills.entries.coding-agent.enabled: true`
  und stellen Sie sicher, dass eines von `claude`, `codex`, `opencode` oder eine andere unterstützte CLI
  installiert und authentifiziert ist.
</ParamField>

<ParamField path="apiKey" type='string | { source, provider, id }'>
  Komfortfeld für Skills, die `metadata.openclaw.primaryEnv` deklarieren.
  Unterstützt eine Klartextzeichenfolge oder ein SecretRef-Objekt.
</ParamField>

<ParamField path="env" type="Record<string, string>">
  Umgebungsvariablen, die für den Agent-Lauf injiziert werden. Sie werden nur injiziert, wenn die
  Variable nicht bereits im Prozess gesetzt ist.
</ParamField>

<ParamField path="config" type="object">
  Optionale Sammlung für benutzerdefinierte Konfigurationsfelder pro Skill.
</ParamField>

<ParamField path="allowBundled" type="string[]">
  Optionale Allowlist nur für **gebündelte** Skills. Wenn gesetzt, sind nur gebündelte Skills
  in der Liste zulässig. Verwaltete und Workspace-Skills sind nicht betroffen.
</ParamField>

<Note>
  Konfigurationsschlüssel entsprechen standardmäßig dem **Skill-Namen**. Wenn ein Skill
  `metadata.openclaw.skillKey` definiert, verwenden Sie diesen Schlüssel unter `skills.entries`. Setzen
  Sie Namen mit Bindestrichen in Anführungszeichen: JSON5 erlaubt Schlüssel in Anführungszeichen.
</Note>

## Umgebungsinjektion

Wenn ein Agent-Lauf startet, führt OpenClaw Folgendes aus:

<Steps>
  <Step title="Reads skill metadata">
    OpenClaw löst die effektive Skill-Liste für den Agent auf und wendet dabei Gating-Regeln,
    Allowlists und Konfigurationsüberschreibungen an.
  </Step>
  <Step title="Injects env and API keys">
    `skills.entries.<key>.env` und `skills.entries.<key>.apiKey` werden für die Dauer des Laufs auf
    `process.env` angewendet.
  </Step>
  <Step title="Builds the system prompt">
    Zulässige Skills werden in einen kompakten XML-Block kompiliert und in den
    System-Prompt injiziert.
  </Step>
  <Step title="Restores the environment">
    Nach Ende des Laufs wird die ursprüngliche Umgebung wiederhergestellt.
  </Step>
</Steps>

<Warning>
  Die Env-Injektion ist auf den **Host**-Agent-Lauf beschränkt, nicht auf die Sandbox. Innerhalb einer
  Sandbox haben `env` und `apiKey` keine Wirkung. Siehe
  [Skills config](/de/tools/skills-config#sandboxed-skills-and-env-vars), um zu erfahren,
  wie Sie Secrets an sandboxed Läufe übergeben.
</Warning>

Für das gebündelte Backend `claude-cli` materialisiert OpenClaw denselben
zulässigen Skill-Snapshot außerdem als temporäres Claude Code Plugin und übergibt ihn über
`--plugin-dir`. Andere CLI-Backends verwenden nur den Prompt-Katalog.

## Snapshots und Aktualisierung

OpenClaw erstellt Snapshots zulässiger Skills **beim Start einer Sitzung** und verwendet diese
Liste für alle nachfolgenden Turns in der Sitzung wieder. Änderungen an Skills oder Konfiguration
werden bei der nächsten neuen Sitzung wirksam.

Skills werden mitten in der Sitzung in zwei Fällen aktualisiert:

- Der Skills-Watcher erkennt eine Änderung an `SKILL.md`.
- Ein neuer zulässiger Remote-Knoten verbindet sich.

Die aktualisierte Liste wird beim nächsten Agent-Turn übernommen. Wenn sich die effektive
Agent-Allowlist ändert, aktualisiert OpenClaw den Snapshot, damit sichtbare Skills
ausgerichtet bleiben.

<AccordionGroup>
  <Accordion title="Skills watcher">
    Standardmäßig überwacht OpenClaw Skill-Ordner und erhöht den Snapshot, wenn sich
    `SKILL.md`-Dateien ändern. Konfigurieren Sie dies unter `skills.load`:

    ```json5
    {
      skills: {
        load: {
          extraDirs: ["~/Projects/agent-scripts/skills"],
          allowSymlinkTargets: ["~/Projects/manager/skills"],
          watch: true,
          watchDebounceMs: 250,
        },
      },
    }
    ```

    Verwenden Sie `allowSymlinkTargets` für absichtlich per Symlink verknüpfte Layouts, bei denen ein Skill-Root-Symlink
    außerhalb des konfigurierten Roots zeigt, zum Beispiel
    `<workspace>/skills/manager -> ~/Projects/manager/skills`.
    Aktivieren Sie `skills.workshop.allowSymlinkTargetWrites` nur, wenn Skill Workshop
    Vorschläge auch über diese vertrauenswürdigen Symlink-Pfade anwenden soll.

  </Accordion>
  <Accordion title="Remote macOS nodes (Linux gateway)">
    Wenn der Gateway unter Linux läuft, aber ein **macOS-Knoten** mit erlaubtem
    `system.run` verbunden ist, kann OpenClaw macOS-only Skills als zulässig behandeln, wenn
    die erforderlichen Binärdateien auf diesem Knoten vorhanden sind. Der Agent sollte diese
    Skills über das Tool `exec` mit `host=node` ausführen.

    Offline-Knoten machen remote-only Skills **nicht** sichtbar. Wenn ein Knoten nicht mehr
    auf Binärdatei-Probes antwortet, löscht OpenClaw seine gecachten Binärdatei-Treffer.

  </Accordion>
</AccordionGroup>

## Token-Auswirkung

Wenn Skills zulässig sind, injiziert OpenClaw einen kompakten XML-Block in den System-
Prompt. Die Kosten sind deterministisch:

```text
total = 195 + Σ (97 + len(name) + len(description) + len(filepath))
```

- **Basis-Overhead** (nur bei ≥ 1 Skill): ~195 Zeichen
- **Pro Skill:** ~97 Zeichen + die Längen Ihrer Felder `name`, `description` und `location`
- XML-Escaping erweitert `& < > " '` zu Entitäten und fügt pro Vorkommen einige Zeichen hinzu
- Bei ~4 Zeichen/Token entsprechen 97 Zeichen ≈ 24 Tokens pro Skill vor den Feldlängen

Halten Sie Beschreibungen kurz und aussagekräftig, um den Prompt-Overhead zu minimieren.

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Creating skills" href="/de/tools/creating-skills" icon="hammer">
    Schritt-für-Schritt-Anleitung zum Erstellen eines benutzerdefinierten Skills.
  </Card>
  <Card title="Skill Workshop" href="/de/tools/skill-workshop" icon="flask">
    Vorschlagswarteschlange für von Agenten entworfene Skills.
  </Card>
  <Card title="Skills config" href="/de/tools/skills-config" icon="gear">
    Vollständiges `skills.*`-Konfigurationsschema und Agent-Allowlists.
  </Card>
  <Card title="Slash commands" href="/de/tools/slash-commands" icon="terminal">
    Wie Skill-Slash-Commands registriert und geroutet werden.
  </Card>
  <Card title="ClawHub" href="/clawhub" icon="cloud">
    Skills in der öffentlichen Registry durchsuchen und veröffentlichen.
  </Card>
  <Card title="Plugins" href="/de/tools/plugin" icon="plug">
    Plugins können Skills zusammen mit den Tools ausliefern, die sie dokumentieren.
  </Card>
</CardGroup>
