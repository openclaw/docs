---
read_when:
    - Skills hinzufügen oder ändern
    - Ändern von Skill-Gating, Allowlists oder Laderegeln
    - Priorität von Skills und Snapshot-Verhalten verstehen
sidebarTitle: Skills
summary: Skills bringen Ihrem Agenten bei, wie er Tools verwendet. Erfahren Sie, wie sie geladen werden, wie Priorität funktioniert und wie Sie Gating, Allow Lists und Environment Injection konfigurieren.
title: Skills
x-i18n:
    generated_at: "2026-07-01T05:41:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d278a83bcd92e8c24ad0e01ec8fbf462450556493453ca1152e317727be34400
    source_path: tools/skills.md
    workflow: 16
---

Skills sind Markdown-Anweisungsdateien, die dem Agent beibringen, wie und wann er
Tools verwenden soll. Jeder Skill liegt in einem Verzeichnis, das eine `SKILL.md`-Datei mit YAML-Frontmatter und einem Markdown-Text enthält. OpenClaw lädt gebündelte Skills sowie lokale Überschreibungen und filtert sie beim Laden anhand von Umgebung, Konfiguration und vorhandenen Binärdateien.

<CardGroup cols={2}>
  <Card title="Skills erstellen" href="/de/tools/creating-skills" icon="hammer">
    Erstellen und testen Sie einen benutzerdefinierten Skill von Grund auf.
  </Card>
  <Card title="Skill Workshop" href="/de/tools/skill-workshop" icon="flask">
    Prüfen und genehmigen Sie vom Agent entworfene Skill-Vorschläge.
  </Card>
  <Card title="Skills-Konfiguration" href="/de/tools/skills-config" icon="gear">
    Vollständiges `skills.*`-Konfigurationsschema und Agent-Allowlists.
  </Card>
  <Card title="ClawHub" href="/clawhub" icon="cloud">
    Durchsuchen und installieren Sie Community-Skills.
  </Card>
</CardGroup>

## Ladereihenfolge

OpenClaw lädt aus diesen Quellen, **höchste Priorität zuerst**. Wenn derselbe
Skill-Name an mehreren Stellen vorkommt, gewinnt die Quelle mit der höchsten Priorität.

| Priorität      | Quelle                    | Pfad                                    |
| -------------- | ------------------------- | --------------------------------------- |
| 1 — höchste    | Workspace-Skills          | `<workspace>/skills`                    |
| 2              | Projekt-Agent-Skills      | `<workspace>/.agents/skills`            |
| 3              | Persönliche Agent-Skills  | `~/.agents/skills`                      |
| 4              | Verwaltete/lokale Skills  | `~/.openclaw/skills`                    |
| 5              | Gebündelte Skills         | mit der Installation ausgeliefert       |
| 6 — niedrigste | Zusätzliche Verzeichnisse | `skills.load.extraDirs` + Plugin-Skills |

Skill-Wurzeln unterstützen gruppierte Layouts. OpenClaw erkennt einen Skill, sobald
`SKILL.md` irgendwo unter einer konfigurierten Wurzel erscheint:

```text
<workspace>/skills/research/SKILL.md          ✓ found as "research"
<workspace>/skills/personal/research/SKILL.md ✓ also found as "research"
```

Der Ordnerpfad dient nur der Organisation. Der Name des Skills, der Slash-Befehl und
der Allowlist-Schlüssel stammen alle aus dem Frontmatter-Feld `name` (oder aus dem Verzeichnisnamen, wenn `name` fehlt).

<Note>
  Das native `$CODEX_HOME/skills`-Verzeichnis der Codex CLI ist **keine** OpenClaw-
  Skill-Wurzel. Verwenden Sie `openclaw migrate plan codex`, um diese Skills zu inventarisieren, und dann
  `openclaw migrate codex`, um sie in Ihren OpenClaw-Workspace zu kopieren.
</Note>

## Agent-spezifische vs. gemeinsame Skills

In Multi-Agent-Setups hat jeder Agent seinen eigenen Workspace. Verwenden Sie den Pfad, der
Ihrer gewünschten Sichtbarkeit entspricht:

| Geltungsbereich        | Pfad                         | Sichtbar für                           |
| ---------------------- | ---------------------------- | -------------------------------------- |
| Agent-spezifisch       | `<workspace>/skills`         | Nur diesen Agent                       |
| Projekt-Agent          | `<workspace>/.agents/skills` | Nur den Agent dieses Workspace         |
| Persönlicher Agent     | `~/.agents/skills`           | Alle Agenten auf diesem Rechner        |
| Gemeinsam verwaltet    | `~/.openclaw/skills`         | Alle Agenten auf diesem Rechner        |
| Zusätzliche Verzeichnisse | `skills.load.extraDirs`   | Alle Agenten auf diesem Rechner        |

## Agent-Allowlists

Skill-**Speicherort** (Priorität) und Skill-**Sichtbarkeit** (welcher Agent ihn verwenden kann)
sind getrennte Steuerungen. Verwenden Sie Allowlists, um einzuschränken, welche Skills ein Agent sieht,
unabhängig davon, woher sie geladen werden.

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
    - Lassen Sie `agents.defaults.skills` weg, um standardmäßig alle Skills uneingeschränkt zu lassen.
    - Lassen Sie `agents.list[].skills` weg, um `agents.defaults.skills` zu erben.
    - Setzen Sie `agents.list[].skills: []`, um für diesen Agent keine Skills bereitzustellen.
    - Eine nicht leere Liste `agents.list[].skills` ist die **endgültige** Menge — sie wird nicht
      mit den Defaults zusammengeführt.
    - Die effektive Allowlist gilt für Prompt-Erstellung, Slash-Befehl-Erkennung,
      Sandbox-Synchronisierung und Skill-Snapshots.
    - Dies ist keine Autorisierungsgrenze für die Host-Shell. Wenn derselbe Agent
      `exec` verwenden kann, beschränken Sie diese Shell separat mit Sandboxing, OS-Benutzer-
      Isolation, Exec-Deny-/Allowlists und ressourcenspezifischen Zugangsdaten.
  </Accordion>
</AccordionGroup>

## Plugins und Skills

Plugins können eigene Skills ausliefern, indem sie `skills`-Verzeichnisse in
`openclaw.plugin.json` auflisten (Pfade relativ zur Plugin-Wurzel). Plugin-Skills werden geladen,
wenn das Plugin aktiviert ist — zum Beispiel liefert das Browser-Plugin einen
`browser-automation`-Skill für mehrstufige Browser-Steuerung aus.

Plugin-Skill-Verzeichnisse werden auf derselben niedrigen Prioritätsstufe wie
`skills.load.extraDirs` zusammengeführt, sodass ein gleichnamiger gebündelter, verwalteter, Agent- oder Workspace-
Skill sie überschreibt. Steuern Sie sie über `metadata.openclaw.requires.config` im
Konfigurationseintrag des Plugins.

Siehe [Plugins](/de/tools/plugin) und [Tools](/de/tools) für das vollständige Plugin-System.

## Skill Workshop

[Skill Workshop](/de/tools/skill-workshop) ist eine Vorschlagswarteschlange zwischen dem Agent
und Ihren aktiven Skill-Dateien. Wenn der Agent wiederverwendbare Arbeit erkennt, entwirft er
einen Vorschlag, statt direkt in `SKILL.md` zu schreiben. Sie prüfen und genehmigen,
bevor sich etwas ändert.

```bash
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop apply <proposal-id>
```

Siehe [Skill Workshop](/de/tools/skill-workshop) für den vollständigen Lebenszyklus, die CLI-
Referenz und die Konfiguration.

## Installation aus ClawHub

[ClawHub](https://clawhub.ai) ist das öffentliche Skills-Register. Verwenden Sie
`openclaw skills`-Befehle für Installation und Aktualisierung oder die `clawhub` CLI für
Veröffentlichung und Synchronisierung.

| Aktion                                    | Befehl                                                |
| ----------------------------------------- | ----------------------------------------------------- |
| Einen Skill im Workspace installieren     | `openclaw skills install @owner/<slug>`               |
| Aus einem Git-Repository installieren     | `openclaw skills install git:owner/repo@ref`          |
| Ein lokales Skill-Verzeichnis installieren | `openclaw skills install ./path/to/skill --as my-tool` |
| Für alle lokalen Agenten installieren     | `openclaw skills install @owner/<slug> --global`      |
| Alle Workspace-Skills aktualisieren       | `openclaw skills update --all`                        |
| Einen gemeinsam verwalteten Skill aktualisieren | `openclaw skills update @owner/<slug> --global` |
| Alle gemeinsam verwalteten Skills aktualisieren | `openclaw skills update --all --global`        |
| Trust Envelope eines Skills verifizieren  | `openclaw skills verify @owner/<slug>`                |
| Die generierte Skill Card ausgeben        | `openclaw skills verify @owner/<slug> --card`         |
| Über die ClawHub CLI veröffentlichen/synchronisieren | `clawhub sync --all`                         |

<AccordionGroup>
  <Accordion title="Installationsdetails">
    `openclaw skills install` installiert standardmäßig in das `skills/`-Verzeichnis
    des aktiven Workspace. Fügen Sie `--global` hinzu, um in das gemeinsame
    `~/.openclaw/skills`-Verzeichnis zu installieren, das für alle lokalen Agenten sichtbar ist, sofern Agent-
    Allowlists es nicht einschränken.

    Git- und lokale Installationen erwarten `SKILL.md` im Quellstamm. Der Slug stammt
    aus dem Frontmatter-Feld `name` von `SKILL.md`, wenn es gültig ist, und fällt dann auf den
    Verzeichnis- oder Repository-Namen zurück. Verwenden Sie `--as <slug>` zum Überschreiben.
    `openclaw skills update` verfolgt nur ClawHub-Installationen — installieren Sie Git- oder
    lokale Quellen erneut, um sie zu aktualisieren.

  </Accordion>
  <Accordion title="Verifizierung und Sicherheitsscans">
    `openclaw skills verify @owner/<slug>` fragt ClawHub nach dem
    `clawhub.skill.verify.v1` Trust Envelope des Skills. Installierte ClawHub-Skills werden
    gegen die Version und das Register verifiziert, die in `.clawhub/origin.json` aufgezeichnet sind.
    Bloße Slugs bleiben für bestehende installierte oder eindeutige Skills akzeptiert, aber
    inhaberqualifizierte Referenzen vermeiden Mehrdeutigkeit beim Herausgeber.

    ClawHub-Skill-Seiten zeigen vor der Installation den neuesten Sicherheits-Scanstatus
    mit Detailseiten für VirusTotal, ClawScan und statische Analyse. Der
    Befehl beendet sich mit einem Nicht-Null-Code, wenn ClawHub die Verifizierung als fehlgeschlagen markiert. Herausgeber
    beheben False Positives über das ClawHub-Dashboard oder
    `clawhub skill rescan @owner/<slug>`.

  </Accordion>
  <Accordion title="Private Archivinstallationen">
    Gateway-Clients, die eine Nicht-ClawHub-Auslieferung benötigen, können ein Zip-Skill-Archiv
    mit `skills.upload.begin`, `skills.upload.chunk` und `skills.upload.commit` bereitstellen
    und anschließend mit `skills.install({ source: "upload", ... })` installieren. Dieser Pfad ist
    standardmäßig deaktiviert und erfordert `skills.install.allowUploadedArchives: true` in
    `openclaw.json`. Normale ClawHub-Installationen benötigen diese Einstellung nie.
  </Accordion>
</AccordionGroup>

## Sicherheit

<Warning>
  Behandeln Sie Skills von Drittanbietern als **nicht vertrauenswürdigen Code**. Lesen Sie sie vor der Aktivierung.
  Bevorzugen Sie Sandbox-Läufe für nicht vertrauenswürdige Eingaben und riskante Tools. Siehe
  [Sandboxing](/de/gateway/sandboxing) für agentseitige Steuerungen.
</Warning>

<AccordionGroup>
  <Accordion title="Pfadbegrenzung">
    Workspace-, Projekt-Agent- und Extra-Dir-Skill-Erkennung akzeptiert nur Skill-
    Wurzeln, deren aufgelöster Realpath innerhalb der konfigurierten Wurzel bleibt, es sei denn,
    `skills.load.allowSymlinkTargets` vertraut ausdrücklich einer Zielwurzel.
    Skill Workshop schreibt nur dann durch diese vertrauenswürdigen Ziele, wenn
    `skills.workshop.allowSymlinkTargetWrites` aktiviert ist.
    Verwaltete `~/.openclaw/skills` und persönliche `~/.agents/skills` können
    symlinkte Skill-Ordner enthalten, aber jeder `SKILL.md`-Realpath muss weiterhin
    innerhalb seines aufgelösten Skill-Verzeichnisses bleiben.
  </Accordion>
  <Accordion title="Installationsrichtlinie für Operatoren">
    Konfigurieren Sie `security.installPolicy`, um einen vertrauenswürdigen lokalen Richtlinienbefehl
    auszuführen, bevor Skill-Installationen fortgesetzt werden. Die Richtlinie erhält Metadaten und den bereitgestellten
    Quellpfad, gilt für ClawHub-, hochgeladene, Git-, lokale, Update- und
    Dependency-Installer-Pfade und schlägt geschlossen fehl, wenn der Befehl keine
    gültige Entscheidung zurückgeben kann.
  </Accordion>
  <Accordion title="Geltungsbereich der Secret-Injektion">
    `skills.entries.*.env` und `skills.entries.*.apiKey` injizieren Secrets nur in den
    **Host**-Prozess für diesen Agent-Turn — nicht in die Sandbox. Halten Sie
    Secrets aus Prompts und Logs heraus.
  </Accordion>
</AccordionGroup>

Für das breitere Bedrohungsmodell und Sicherheits-Checklisten siehe
[Sicherheit](/de/gateway/security).

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
  Frontmatter-Parser unterstützt **nur einzeilige Schlüssel** — `metadata` muss ein
  einzeiliges JSON-Objekt sein. Verwenden Sie `{baseDir}` im Text, um auf den Pfad des Skill-
  Ordners zu verweisen.
</Note>

### Optionale Frontmatter-Schlüssel

<ParamField path="homepage" type="string">
  URL, die in der macOS Skills-UI als "Website" angezeigt wird. Auch über
  `metadata.openclaw.homepage` unterstützt.
</ParamField>

<ParamField path="user-invocable" type="boolean" default="true">
  Wenn `true`, wird der Skill als vom Benutzer aufrufbarer Slash-Befehl bereitgestellt.
</ParamField>

<ParamField path="disable-model-invocation" type="boolean" default="false">
  Wenn `true`, hält OpenClaw die Anweisungen des Skills aus dem normalen
  Prompt des Agent heraus. Der Skill ist weiterhin als Slash-Befehl verfügbar, wenn `user-invocable`
  ebenfalls `true` ist.
</ParamField>

<ParamField path="command-dispatch" type='"tool"'>
  Wenn auf `tool` gesetzt, umgeht der Slash-Befehl das Modell und leitet
  direkt an ein registriertes Tool weiter.
</ParamField>

<ParamField path="command-tool" type="string">
  Tool-Name, der aufgerufen wird, wenn `command-dispatch: tool` gesetzt ist.
</ParamField>

<ParamField path="command-arg-mode" type='"raw"' default="raw">
  Für die Tool-Weiterleitung wird der rohe Argumentstring ohne Core-Parsing an
  das Tool weitergegeben. Das Tool erhält
  `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`.
</ParamField>

## Gating

OpenClaw filtert Skills beim Laden mit `metadata.openclaw` (einzeiliges
JSON im Frontmatter). Ein Skill ohne `metadata.openclaw`-Block ist immer
zulässig, sofern er nicht ausdrücklich deaktiviert ist.

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
  Optionales Emoji, das in der macOS-Skills-UI angezeigt wird.
</ParamField>

<ParamField path="homepage" type="string">
  Optionale URL, die in der macOS-Skills-UI als „Website“ angezeigt wird.
</ParamField>

<ParamField path="os" type='"darwin" | "linux" | "win32"'>
  Plattformfilter. Wenn gesetzt, ist der Skill nur auf den aufgelisteten Betriebssystemen zulässig.
</ParamField>

<ParamField path="requires.bins" type="string[]">
  Jedes Binary muss in `PATH` vorhanden sein.
</ParamField>

<ParamField path="requires.anyBins" type="string[]">
  Mindestens ein Binary muss in `PATH` vorhanden sein.
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
  Optionale Installer-Spezifikationen, die von der macOS-Skills-UI verwendet werden (brew / node / go / uv / download).
</ParamField>

<Note>
  Legacy-`metadata.clawdbot`-Blöcke werden weiterhin akzeptiert, wenn
  `metadata.openclaw` fehlt, damit ältere installierte Skills ihre
  Abhängigkeits-Gates und Installer-Hinweise behalten. Neue Skills sollten
  `metadata.openclaw` verwenden.
</Note>

### Installer-Spezifikationen

Installer-Spezifikationen teilen der macOS-Skills-UI mit, wie eine Abhängigkeit installiert wird:

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
  <Accordion title="Regeln für die Installer-Auswahl">
    - Wenn mehrere Installer aufgelistet sind, wählt der Gateway eine bevorzugte
      Option aus (`brew`, wenn verfügbar, andernfalls `node`).
    - Wenn alle Installer `download` sind, listet OpenClaw jeden Eintrag auf, damit Sie
      alle verfügbaren Artefakte sehen können.
    - Spezifikationen können `os: ["darwin"|"linux"|"win32"]` enthalten, um nach Plattform zu filtern.
    - Node-Installationen beachten `skills.install.nodeManager` in `openclaw.json`
      (Standard: npm; Optionen: npm / pnpm / yarn / bun). Dies betrifft nur Skill-
      Installationen; die Gateway-Laufzeit sollte weiterhin Node sein.
    - Installer-Präferenz des Gateway: Homebrew → uv → konfigurierter Node-Manager →
      go → download.
  </Accordion>
  <Accordion title="Details pro Installer">
    - **Homebrew:** OpenClaw installiert Homebrew nicht automatisch und übersetzt brew-
      Formulas nicht in Systempaketbefehle. In Linux-Containern ohne
      `brew` werden reine brew-Installer ausgeblendet; verwenden Sie ein eigenes Image oder installieren
      Sie die Abhängigkeit manuell.
    - **Go:** Wenn `go` fehlt und `brew` verfügbar ist, installiert der Gateway
      Go zuerst über Homebrew und setzt `GOBIN` auf Homebrews `bin`.
    - **Download:** `url` (erforderlich), `archive` (`tar.gz` | `tar.bz2` | `zip`),
      `extract` (Standard: automatisch, wenn ein Archiv erkannt wird), `stripComponents`,
      `targetDir` (Standard: `~/.openclaw/tools/<skillKey>`).
  </Accordion>
  <Accordion title="Hinweise zum Sandboxing">
    `requires.bins` wird beim Laden des Skills auf dem **Host** geprüft. Wenn ein Agent
    in einer Sandbox läuft, muss das Binary auch **innerhalb des Containers** vorhanden sein.
    Installieren Sie es über `agents.defaults.sandbox.docker.setupCommand` oder ein eigenes
    Image. `setupCommand` wird einmal nach der Container-Erstellung ausgeführt und erfordert
    Netzwerk-Egress, ein beschreibbares Root-Dateisystem und einen Root-Benutzer in der Sandbox.
  </Accordion>
</AccordionGroup>

## Konfigurations-Overrides

Aktivieren und konfigurieren Sie gebündelte oder verwaltete Skills unter `skills.entries` in
`~/.openclaw/openclaw.json`:

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
  `false` deaktiviert den Skill, auch wenn er gebündelt oder installiert ist. Der gebündelte
  Skill `coding-agent` ist opt-in — setzen Sie `skills.entries.coding-agent.enabled: true`
  und stellen Sie sicher, dass `claude`, `codex`, `opencode` oder eine andere unterstützte CLI
  installiert und authentifiziert ist.
</ParamField>

<ParamField path="apiKey" type='string | { source, provider, id }'>
  Komfortfeld für Skills, die `metadata.openclaw.primaryEnv` deklarieren.
  Unterstützt einen Klartextstring oder ein SecretRef-Objekt.
</ParamField>

<ParamField path="env" type="Record<string, string>">
  Für den Agentenlauf injizierte Umgebungsvariablen. Werden nur injiziert, wenn die
  Variable im Prozess noch nicht gesetzt ist.
</ParamField>

<ParamField path="config" type="object">
  Optionaler Container für benutzerdefinierte Konfigurationsfelder pro Skill.
</ParamField>

<ParamField path="allowBundled" type="string[]">
  Optionale Allowlist nur für **gebündelte** Skills. Wenn gesetzt, sind nur gebündelte Skills
  in der Liste zulässig. Verwaltete Skills und Workspace-Skills sind nicht betroffen.
</ParamField>

<Note>
  Konfigurationsschlüssel entsprechen standardmäßig dem **Skill-Namen**. Wenn ein Skill
  `metadata.openclaw.skillKey` definiert, verwenden Sie diesen Schlüssel unter `skills.entries`. Setzen Sie
  Namen mit Bindestrichen in Anführungszeichen: JSON5 erlaubt Schlüssel in Anführungszeichen.
</Note>

## Umgebungsinjektion

Wenn ein Agentenlauf startet, führt OpenClaw Folgendes aus:

<Steps>
  <Step title="Skill-Metadaten lesen">
    OpenClaw löst die effektive Skill-Liste für den Agenten auf und wendet Gating-
    Regeln, Allowlists und Konfigurations-Overrides an.
  </Step>
  <Step title="Umgebung und API-Schlüssel injizieren">
    `skills.entries.<key>.env` und `skills.entries.<key>.apiKey` werden für die
    Dauer des Laufs auf `process.env` angewendet.
  </Step>
  <Step title="System-Prompt erstellen">
    Zulässige Skills werden in einen kompakten XML-Block kompiliert und in den
    System-Prompt injiziert.
  </Step>
  <Step title="Umgebung wiederherstellen">
    Nach dem Ende des Laufs wird die ursprüngliche Umgebung wiederhergestellt.
  </Step>
</Steps>

<Warning>
  Die Umgebungsinjektion ist auf den **Host**-Agentenlauf beschränkt, nicht auf die Sandbox. Innerhalb einer
  Sandbox haben `env` und `apiKey` keine Wirkung. Siehe
  [Skills-Konfiguration](/de/tools/skills-config#sandboxed-skills-and-env-vars), um zu erfahren,
  wie Sie Secrets in Sandbox-Läufe übergeben.
</Warning>

Für das gebündelte `claude-cli`-Backend materialisiert OpenClaw außerdem denselben
zulässigen Skill-Snapshot als temporäres Claude-Code-Plugin und übergibt ihn über
`--plugin-dir`. Andere CLI-Backends verwenden nur den Prompt-Katalog.

## Snapshots und Aktualisierung

OpenClaw erstellt Snapshots zulässiger Skills **beim Start einer Sitzung** und verwendet diese
Liste für alle nachfolgenden Turns in der Sitzung erneut. Änderungen an Skills oder Konfiguration werden
erst in der nächsten neuen Sitzung wirksam.

Skills werden mitten in einer Sitzung in zwei Fällen aktualisiert:

- Der Skills-Watcher erkennt eine Änderung an `SKILL.md`.
- Ein neuer zulässiger Remote-Node verbindet sich.

Die aktualisierte Liste wird beim nächsten Agenten-Turn übernommen. Wenn sich die effektive Agent-
Allowlist ändert, aktualisiert OpenClaw den Snapshot, damit sichtbare Skills
synchron bleiben.

<AccordionGroup>
  <Accordion title="Skills-Watcher">
    Standardmäßig überwacht OpenClaw Skill-Ordner und erhöht den Snapshot, wenn
    `SKILL.md`-Dateien geändert werden. Konfigurieren Sie dies unter `skills.load`:

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

    Verwenden Sie `allowSymlinkTargets` für bewusst per Symlink verknüpfte Layouts, bei denen ein Skill-
    Root-Symlink außerhalb des konfigurierten Roots zeigt, zum Beispiel
    `<workspace>/skills/manager -> ~/Projects/manager/skills`.
    Aktivieren Sie `skills.workshop.allowSymlinkTargetWrites` nur, wenn Skill Workshop
    Vorschläge auch über diese vertrauenswürdigen Symlink-Pfade anwenden soll.

  </Accordion>
  <Accordion title="Remote-macOS-Nodes (Linux-Gateway)">
    Wenn der Gateway unter Linux läuft, aber ein **macOS-Node** mit erlaubtem
    `system.run` verbunden ist, kann OpenClaw reine macOS-Skills als zulässig behandeln, wenn
    die erforderlichen Binaries auf diesem Node vorhanden sind. Der Agent sollte diese
    Skills über das Tool `exec` mit `host=node` ausführen.

    Offline-Nodes machen reine Remote-Skills **nicht** sichtbar. Wenn ein Node nicht mehr
    auf Binary-Probes antwortet, löscht OpenClaw seine zwischengespeicherten Binary-Treffer.

  </Accordion>
</AccordionGroup>

## Token-Auswirkung

Wenn Skills zulässig sind, injiziert OpenClaw einen kompakten XML-Block in den System-
Prompt. Die Kosten sind deterministisch:

```text
total = 195 + Σ (97 + len(name) + len(description) + len(filepath))
```

- **Basis-Overhead** (nur bei ≥ 1 Skill): ~195 Zeichen
- **Pro Skill:** ~97 Zeichen + die Feldlängen von `name`, `description` und `location`
- XML-Escaping erweitert `& < > " '` zu Entitäten und fügt pro Vorkommen einige Zeichen hinzu
- Bei ~4 Zeichen/Token entsprechen 97 Zeichen vor Feldlängen ≈ 24 Tokens pro Skill

Halten Sie Beschreibungen kurz und aussagekräftig, um den Prompt-Overhead zu minimieren.

## Verwandt

<CardGroup cols={2}>
  <Card title="Skills erstellen" href="/de/tools/creating-skills" icon="hammer">
    Schritt-für-Schritt-Anleitung zum Erstellen eines benutzerdefinierten Skills.
  </Card>
  <Card title="Skill Workshop" href="/de/tools/skill-workshop" icon="flask">
    Vorschlagswarteschlange für von Agenten entworfene Skills.
  </Card>
  <Card title="Skills-Konfiguration" href="/de/tools/skills-config" icon="gear">
    Vollständiges `skills.*`-Konfigurationsschema und Agenten-Allowlists.
  </Card>
  <Card title="Slash-Befehle" href="/de/tools/slash-commands" icon="terminal">
    Wie Skill-Slash-Befehle registriert und geroutet werden.
  </Card>
  <Card title="ClawHub" href="/clawhub" icon="cloud">
    Skills in der öffentlichen Registry durchsuchen und veröffentlichen.
  </Card>
  <Card title="Plugins" href="/de/tools/plugin" icon="plug">
    Plugins können Skills zusammen mit den Tools ausliefern, die sie dokumentieren.
  </Card>
</CardGroup>
