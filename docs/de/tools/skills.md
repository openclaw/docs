---
read_when:
    - Skills hinzufügen oder ändern
    - Skill-Gating, Allowlists oder Laderegeln ändern
    - Skill-Priorität und Snapshot-Verhalten verstehen
sidebarTitle: Skills
summary: Skills bringen Ihrem Agenten bei, wie er Tools verwendet. Erfahren Sie, wie sie geladen werden, wie die Rangfolge funktioniert und wie Sie Gating, Allowlisten und Umgebungsinjektion konfigurieren.
title: Skills
x-i18n:
    generated_at: "2026-06-27T18:21:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e42d89d47125a4d92f68a20d754de571d5582858a9c44618b999a27335e78ab2
    source_path: tools/skills.md
    workflow: 16
---

Skills sind Markdown-Anweisungsdateien, die dem Agent beibringen, wie und wann er
Tools verwenden soll. Jeder Skill liegt in einem Verzeichnis mit einer `SKILL.md`-Datei
mit YAML-Frontmatter und einem Markdown-Body. OpenClaw lädt gebündelte Skills plus
alle lokalen Überschreibungen und filtert sie beim Laden anhand von Umgebung,
Konfiguration und vorhandenen Binaries.

<CardGroup cols={2}>
  <Card title="Creating skills" href="/de/tools/creating-skills" icon="hammer">
    Erstellen und testen Sie einen benutzerdefinierten Skill von Grund auf.
  </Card>
  <Card title="Skill Workshop" href="/de/tools/skill-workshop" icon="flask">
    Prüfen und genehmigen Sie vom Agent entworfene Skill-Vorschläge.
  </Card>
  <Card title="Skills config" href="/de/tools/skills-config" icon="gear">
    Vollständiges `skills.*`-Konfigurationsschema und Agent-Allowlists.
  </Card>
  <Card title="ClawHub" href="/de/clawhub" icon="cloud">
    Durchsuchen und installieren Sie Community-Skills.
  </Card>
</CardGroup>

## Ladereihenfolge

OpenClaw lädt aus diesen Quellen, **höchste Priorität zuerst**. Wenn derselbe
Skill-Name an mehreren Stellen vorkommt, gewinnt die Quelle mit der höchsten Priorität.

| Priorität     | Quelle                  | Pfad                                    |
| ------------- | ----------------------- | --------------------------------------- |
| 1 — höchste   | Workspace-Skills        | `<workspace>/skills`                    |
| 2             | Projekt-Agent-Skills    | `<workspace>/.agents/skills`            |
| 3             | Persönliche Agent-Skills| `~/.agents/skills`                      |
| 4             | Verwaltete / lokale Skills | `~/.openclaw/skills`                 |
| 5             | Gebündelte Skills       | mit der Installation ausgeliefert       |
| 6 — niedrigste| Zusätzliche Verzeichnisse | `skills.load.extraDirs` + Plugin-Skills |

Skill-Roots unterstützen gruppierte Layouts. OpenClaw erkennt einen Skill immer dann,
wenn `SKILL.md` irgendwo unter einem konfigurierten Root erscheint:

```text
<workspace>/skills/research/SKILL.md          ✓ found as "research"
<workspace>/skills/personal/research/SKILL.md ✓ also found as "research"
```

Der Ordnerpfad dient nur der Organisation. Der Name des Skills, der Slash-Befehl
und der Allowlist-Schlüssel stammen alle aus dem Frontmatter-Feld `name` (oder aus
dem Verzeichnisnamen, wenn `name` fehlt).

<Note>
  Das native `$CODEX_HOME/skills`-Verzeichnis der Codex CLI ist **kein**
  OpenClaw-Skill-Root. Verwenden Sie `openclaw migrate plan codex`, um diese
  Skills zu inventarisieren, und anschließend `openclaw migrate codex`, um sie
  in Ihren OpenClaw-Workspace zu kopieren.
</Note>

## Pro-Agent- gegenüber gemeinsamen Skills

In Multi-Agent-Setups hat jeder Agent seinen eigenen Workspace. Verwenden Sie den
Pfad, der zur gewünschten Sichtbarkeit passt:

| Geltungsbereich | Pfad                         | Sichtbar für                 |
| ---------------- | ---------------------------- | ---------------------------- |
| Pro Agent        | `<workspace>/skills`         | Nur diesen Agent             |
| Projekt-Agent    | `<workspace>/.agents/skills` | Nur den Agent dieses Workspace |
| Persönlicher Agent | `~/.agents/skills`         | Alle Agents auf dieser Maschine |
| Gemeinsam verwaltet | `~/.openclaw/skills`      | Alle Agents auf dieser Maschine |
| Zusätzliche Verzeichnisse | `skills.load.extraDirs` | Alle Agents auf dieser Maschine |

## Agent-Allowlists

Skill-**Speicherort** (Priorität) und Skill-**Sichtbarkeit** (welcher Agent ihn
verwenden kann) sind getrennte Steuerungen. Verwenden Sie Allowlists, um
einzuschränken, welche Skills ein Agent sieht, unabhängig davon, woher sie geladen
werden.

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
  <Accordion title="Allowlist rules">
    - Lassen Sie `agents.defaults.skills` weg, damit standardmäßig alle Skills uneingeschränkt bleiben.
    - Lassen Sie `agents.list[].skills` weg, um `agents.defaults.skills` zu erben.
    - Setzen Sie `agents.list[].skills: []`, um für diesen Agent keine Skills bereitzustellen.
    - Eine nicht leere `agents.list[].skills`-Liste ist die **endgültige** Menge — sie wird nicht
      mit den Defaults zusammengeführt.
    - Die effektive Allowlist gilt über Prompt-Erstellung, Slash-Befehl-Erkennung,
      Sandbox-Synchronisierung und Skill-Snapshots hinweg.
  </Accordion>
</AccordionGroup>

## Plugins und Skills

Plugins können ihre eigenen Skills ausliefern, indem sie `skills`-Verzeichnisse in
`openclaw.plugin.json` auflisten (Pfade relativ zum Plugin-Root). Plugin-Skills
werden geladen, wenn das Plugin aktiviert ist — zum Beispiel liefert das Browser-Plugin
einen `browser-automation`-Skill für mehrstufige Browser-Steuerung aus.

Plugin-Skill-Verzeichnisse werden auf derselben Ebene mit niedriger Priorität wie
`skills.load.extraDirs` zusammengeführt, sodass ein gleichnamiger gebündelter,
verwalteter, Agent- oder Workspace-Skill sie überschreibt. Steuern Sie sie über
`metadata.openclaw.requires.config` im Konfigurationseintrag des Plugins.

Siehe [Plugins](/de/tools/plugin) und [Tools](/de/tools) für das vollständige Plugin-System.

## Skill Workshop

[Skill Workshop](/de/tools/skill-workshop) ist eine Vorschlagswarteschlange zwischen
dem Agent und Ihren aktiven Skill-Dateien. Wenn der Agent wiederverwendbare Arbeit
erkennt, entwirft er einen Vorschlag, statt direkt in `SKILL.md` zu schreiben.
Sie prüfen und genehmigen, bevor sich etwas ändert.

```bash
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop apply <proposal-id>
```

Siehe [Skill Workshop](/de/tools/skill-workshop) für den vollständigen Lebenszyklus,
die CLI-Referenz und die Konfiguration.

## Installation aus ClawHub

[ClawHub](https://clawhub.ai) ist die öffentliche Skills-Registry. Verwenden Sie
`openclaw skills`-Befehle für Installation und Aktualisierung oder die `clawhub` CLI
für Veröffentlichung und Synchronisierung.

| Aktion                                  | Befehl                                                 |
| --------------------------------------- | ------------------------------------------------------ |
| Einen Skill im Workspace installieren   | `openclaw skills install @owner/<slug>`                |
| Aus einem Git-Repository installieren   | `openclaw skills install git:owner/repo@ref`           |
| Ein lokales Skill-Verzeichnis installieren | `openclaw skills install ./path/to/skill --as my-tool` |
| Für alle lokalen Agents installieren    | `openclaw skills install @owner/<slug> --global`       |
| Alle Workspace-Skills aktualisieren     | `openclaw skills update --all`                         |
| Einen gemeinsam verwalteten Skill aktualisieren | `openclaw skills update @owner/<slug> --global` |
| Alle gemeinsam verwalteten Skills aktualisieren | `openclaw skills update --all --global`          |
| Trust Envelope eines Skills prüfen      | `openclaw skills verify @owner/<slug>`                 |
| Die generierte Skill Card ausgeben      | `openclaw skills verify @owner/<slug> --card`          |
| Über die ClawHub CLI veröffentlichen / synchronisieren | `clawhub sync --all`                      |

<AccordionGroup>
  <Accordion title="Installationsdetails">
    `openclaw skills install` installiert standardmäßig in das `skills/`-Verzeichnis
    des aktiven Workspace. Fügen Sie `--global` hinzu, um in das gemeinsame
    Verzeichnis `~/.openclaw/skills` zu installieren, das für alle lokalen Agents
    sichtbar ist, sofern Agent-Allowlists es nicht einschränken.

    Git- und lokale Installationen erwarten `SKILL.md` im Quell-Root. Der Slug stammt
    aus dem `SKILL.md`-Frontmatter-`name`, wenn gültig, und fällt dann auf den
    Verzeichnis- oder Repository-Namen zurück. Verwenden Sie `--as <slug>`, um ihn
    zu überschreiben. `openclaw skills update` verfolgt nur ClawHub-Installationen —
    installieren Sie Git- oder lokale Quellen erneut, um sie zu aktualisieren.

  </Accordion>
  <Accordion title="Verifizierung und Sicherheitsscans">
    `openclaw skills verify @owner/<slug>` fragt ClawHub nach dem
    `clawhub.skill.verify.v1`-Trust Envelope des Skills. Installierte ClawHub-Skills
    werden gegen die Version und Registry geprüft, die in `.clawhub/origin.json`
    aufgezeichnet sind. Reine Slugs bleiben für vorhandene installierte oder eindeutige
    Skills akzeptiert, aber inhaberqualifizierte Refs vermeiden Publisher-Mehrdeutigkeit.

    ClawHub-Skill-Seiten zeigen vor der Installation den neuesten Sicherheits-Scanstatus
    mit Detailseiten für VirusTotal, ClawScan und statische Analyse. Der Befehl beendet
    sich mit einem Nicht-Null-Code, wenn ClawHub die Verifizierung als fehlgeschlagen
    markiert. Publisher beheben False Positives über das ClawHub-Dashboard oder
    `clawhub skill rescan @owner/<slug>`.

  </Accordion>
  <Accordion title="Installationen aus privaten Archiven">
    Gateway-Clients, die eine Nicht-ClawHub-Bereitstellung benötigen, können ein
    Zip-Skill-Archiv mit `skills.upload.begin`, `skills.upload.chunk` und
    `skills.upload.commit` bereitstellen und dann mit
    `skills.install({ source: "upload", ... })` installieren. Dieser Pfad ist
    standardmäßig deaktiviert und erfordert `skills.install.allowUploadedArchives: true`
    in `openclaw.json`. Normale ClawHub-Installationen benötigen diese Einstellung nie.
  </Accordion>
</AccordionGroup>

## Sicherheit

<Warning>
  Behandeln Sie Skills von Drittanbietern als **nicht vertrauenswürdigen Code**.
  Lesen Sie sie, bevor Sie sie aktivieren. Bevorzugen Sie Sandbox-Ausführungen für
  nicht vertrauenswürdige Eingaben und riskante Tools. Siehe
  [Sandboxing](/de/gateway/sandboxing) für agentseitige Steuerungen.
</Warning>

<AccordionGroup>
  <Accordion title="Pfadbegrenzung">
    Die Skill-Erkennung für Workspace-, Projekt-Agent- und Extra-Dir-Skills akzeptiert
    nur Skill-Roots, deren aufgelöster Realpath innerhalb des konfigurierten Roots
    bleibt, sofern `skills.load.allowSymlinkTargets` nicht ausdrücklich einen Ziel-Root
    als vertrauenswürdig einstuft. Skill Workshop schreibt nur dann über diese
    vertrauenswürdigen Ziele, wenn `skills.workshop.allowSymlinkTargetWrites` aktiviert ist.
    Verwaltete `~/.openclaw/skills` und persönliche `~/.agents/skills` dürfen
    symlinkte Skill-Ordner enthalten, aber jeder `SKILL.md`-Realpath muss weiterhin
    innerhalb seines aufgelösten Skill-Verzeichnisses bleiben.
  </Accordion>
  <Accordion title="Installationsrichtlinie für Betreiber">
    Konfigurieren Sie `security.installPolicy`, um einen vertrauenswürdigen lokalen
    Richtlinienbefehl auszuführen, bevor Skill-Installationen fortgesetzt werden.
    Die Richtlinie erhält Metadaten und den bereitgestellten Quellpfad, gilt für
    ClawHub-, Upload-, Git-, lokale, Update- und Dependency-Installer-Pfade und
    schlägt geschlossen fehl, wenn der Befehl keine gültige Entscheidung zurückgeben kann.
  </Accordion>
  <Accordion title="Umfang der Secret-Injektion">
    `skills.entries.*.env` und `skills.entries.*.apiKey` injizieren Secrets nur für
    diesen Agent-Turn in den **Host**-Prozess — nicht in die Sandbox. Halten Sie
    Secrets aus Prompts und Logs heraus.
  </Accordion>
</AccordionGroup>

Für das umfassendere Bedrohungsmodell und Sicherheits-Checklisten siehe
[Security](/de/gateway/security).

## SKILL.md-Format

Jeder Skill benötigt mindestens einen `name` und eine `description` im Frontmatter:

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
  einzeiliges JSON-Objekt sein. Verwenden Sie `{baseDir}` im Body, um auf den
  Skill-Ordnerpfad zu verweisen.
</Note>

### Optionale Frontmatter-Schlüssel

<ParamField path="homepage" type="string">
  URL, die in der macOS-Skills-UI als "Website" angezeigt wird. Wird auch über
  `metadata.openclaw.homepage` unterstützt.
</ParamField>

<ParamField path="user-invocable" type="boolean" default="true">
  Wenn `true`, wird der Skill als vom Benutzer aufrufbarer Slash-Befehl bereitgestellt.
</ParamField>

<ParamField path="disable-model-invocation" type="boolean" default="false">
  Wenn `true`, hält OpenClaw die Anweisungen des Skills aus dem normalen Prompt des
  Agent heraus. Der Skill ist weiterhin als Slash-Befehl verfügbar, wenn
  `user-invocable` ebenfalls `true` ist.
</ParamField>

<ParamField path="command-dispatch" type='"tool"'>
  Wenn auf `tool` gesetzt, umgeht der Slash-Befehl das Modell und dispatcht direkt
  an ein registriertes Tool.
</ParamField>

<ParamField path="command-tool" type="string">
  Tool-Name, der aufgerufen wird, wenn `command-dispatch: tool` gesetzt ist.
</ParamField>

<ParamField path="command-arg-mode" type='"raw"' default="raw">
  Für Tool-Dispatch wird der rohe Args-String ohne Core-Parsing an das Tool
  weitergeleitet. Das Tool erhält
  `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`.
</ParamField>

## Gating

OpenClaw filtert Skills zur Ladezeit anhand von `metadata.openclaw` (einzeiliges
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
  Wenn `true`, wird der Skill immer eingeschlossen und alle anderen Gates werden übersprungen.
</ParamField>

<ParamField path="emoji" type="string">
  Optionales Emoji, das in der macOS-Skills-UI angezeigt wird.
</ParamField>

<ParamField path="homepage" type="string">
  Optionale URL, die in der macOS-Skills-UI als „Website“ angezeigt wird.
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
  Optionale Installer-Spezifikationen, die von der macOS-Skills-UI verwendet werden (brew / node / go / uv / download).
</ParamField>

<Note>
  Legacy-`metadata.clawdbot`-Blöcke werden weiterhin akzeptiert, wenn
  `metadata.openclaw` fehlt, sodass ältere installierte Skills ihre
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
    - Wenn mehrere Installer aufgeführt sind, wählt der Gateway eine bevorzugte
      Option aus (brew, wenn verfügbar, andernfalls node).
    - Wenn alle Installer `download` sind, listet OpenClaw jeden Eintrag auf, damit Sie
      alle verfügbaren Artefakte sehen können.
    - Spezifikationen können `os: ["darwin"|"linux"|"win32"]` enthalten, um nach Plattform zu filtern.
    - Node-Installationen berücksichtigen `skills.install.nodeManager` in `openclaw.json`
      (Standard: npm; Optionen: npm / pnpm / yarn / bun). Dies betrifft nur Skill-
      Installationen; die Gateway-Runtime sollte weiterhin Node sein.
    - Installer-Präferenz des Gateway: Homebrew → uv → konfigurierter Node-Manager →
      go → download.
  </Accordion>
  <Accordion title="Details pro Installer">
    - **Homebrew:** OpenClaw installiert Homebrew nicht automatisch und übersetzt brew-
      Formeln nicht in Systempaketbefehle. In Linux-Containern ohne
      `brew` werden Installer, die nur brew unterstützen, ausgeblendet; verwenden Sie ein eigenes Image oder installieren
      Sie die Abhängigkeit manuell.
    - **Go:** Wenn `go` fehlt und `brew` verfügbar ist, installiert der Gateway
      zuerst Go über Homebrew und setzt `GOBIN` auf Homebrews `bin`.
    - **Download:** `url` (erforderlich), `archive` (`tar.gz` | `tar.bz2` | `zip`),
      `extract` (Standard: automatisch, wenn Archiv erkannt), `stripComponents`,
      `targetDir` (Standard: `~/.openclaw/tools/<skillKey>`).
  </Accordion>
  <Accordion title="Hinweise zum Sandboxing">
    `requires.bins` wird zur Skill-Ladezeit auf dem **Host** geprüft. Wenn ein Agent
    in einer Sandbox ausgeführt wird, muss die Binärdatei auch **im Container** vorhanden sein.
    Installieren Sie sie über `agents.defaults.sandbox.docker.setupCommand` oder ein eigenes
    Image. `setupCommand` wird einmal nach der Container-Erstellung ausgeführt und erfordert
    Netzwerk-Egress, ein beschreibbares Root-Dateisystem und einen Root-Benutzer in der Sandbox.
  </Accordion>
</AccordionGroup>

## Konfigurationsüberschreibungen

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
  `coding-agent`-Skill ist Opt-in — setzen Sie `skills.entries.coding-agent.enabled: true`
  und stellen Sie sicher, dass `claude`, `codex`, `opencode` oder eine andere unterstützte CLI
  installiert und authentifiziert ist.
</ParamField>

<ParamField path="apiKey" type='string | { source, provider, id }'>
  Komfortfeld für Skills, die `metadata.openclaw.primaryEnv` deklarieren.
  Unterstützt eine Klartextzeichenfolge oder ein SecretRef-Objekt.
</ParamField>

<ParamField path="env" type="Record<string, string>">
  Umgebungsvariablen, die für den Agent-Lauf injiziert werden. Sie werden nur injiziert, wenn die
  Variable im Prozess noch nicht gesetzt ist.
</ParamField>

<ParamField path="config" type="object">
  Optionale Sammlung für benutzerdefinierte Konfigurationsfelder pro Skill.
</ParamField>

<ParamField path="allowBundled" type="string[]">
  Optionale Allowlist nur für **gebündelte** Skills. Wenn gesetzt, sind nur gebündelte Skills
  in der Liste zulässig. Verwaltete Skills und Workspace-Skills sind nicht betroffen.
</ParamField>

<Note>
  Konfigurationsschlüssel entsprechen standardmäßig dem **Skill-Namen**. Wenn ein Skill
  `metadata.openclaw.skillKey` definiert, verwenden Sie diesen Schlüssel unter `skills.entries`. Setzen
  Sie Namen mit Bindestrich in Anführungszeichen: JSON5 erlaubt Schlüssel in Anführungszeichen.
</Note>

## Umgebungsinjektion

Wenn ein Agent-Lauf startet, führt OpenClaw Folgendes aus:

<Steps>
  <Step title="Liest Skill-Metadaten">
    OpenClaw ermittelt die effektive Skill-Liste für den Agent und wendet dabei Gating-
    Regeln, Allowlists und Konfigurationsüberschreibungen an.
  </Step>
  <Step title="Injiziert env und API-Schlüssel">
    `skills.entries.<key>.env` und `skills.entries.<key>.apiKey` werden für die Dauer
    des Laufs auf `process.env` angewendet.
  </Step>
  <Step title="Erstellt den System-Prompt">
    Zulässige Skills werden in einen kompakten XML-Block kompiliert und in den
    System-Prompt injiziert.
  </Step>
  <Step title="Stellt die Umgebung wieder her">
    Nachdem der Lauf endet, wird die ursprüngliche Umgebung wiederhergestellt.
  </Step>
</Steps>

<Warning>
  Die env-Injektion ist auf den **Host**-Agent-Lauf beschränkt, nicht auf die Sandbox. Innerhalb einer
  Sandbox haben `env` und `apiKey` keine Wirkung. Siehe
  [Skills-Konfiguration](/de/tools/skills-config#sandboxed-skills-and-env-vars), um zu erfahren,
  wie Secrets an Sandbox-Läufe übergeben werden.
</Warning>

Für das gebündelte `claude-cli`-Backend materialisiert OpenClaw außerdem denselben
zulässigen Skill-Snapshot als temporäres Claude-Code-Plugin und übergibt ihn über
`--plugin-dir`. Andere CLI-Backends verwenden nur den Prompt-Katalog.

## Snapshots und Aktualisierung

OpenClaw erstellt Snapshots zulässiger Skills **beim Start einer Session** und verwendet diese
Liste für alle nachfolgenden Turns in der Session wieder. Änderungen an Skills oder Konfiguration
werden bei der nächsten neuen Session wirksam.

Skills werden mitten in einer Session in zwei Fällen aktualisiert:

- Der Skills-Watcher erkennt eine Änderung an `SKILL.md`.
- Ein neuer zulässiger Remote-Knoten verbindet sich.

Die aktualisierte Liste wird beim nächsten Agent-Turn übernommen. Wenn sich die effektive Agent-
Allowlist ändert, aktualisiert OpenClaw den Snapshot, damit sichtbare Skills
abgeglichen bleiben.

<AccordionGroup>
  <Accordion title="Skills-Watcher">
    Standardmäßig überwacht OpenClaw Skill-Ordner und erhöht den Snapshot, wenn
    sich `SKILL.md`-Dateien ändern. Konfigurieren Sie dies unter `skills.load`:

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

    Verwenden Sie `allowSymlinkTargets` für beabsichtigte Symlink-Layouts, bei denen ein Skill-
    Root-Symlink außerhalb des konfigurierten Roots zeigt, zum Beispiel
    `<workspace>/skills/manager -> ~/Projects/manager/skills`.
    Aktivieren Sie `skills.workshop.allowSymlinkTargetWrites` nur, wenn der Skill Workshop
    Vorschläge auch über diese vertrauenswürdigen Symlink-Pfade anwenden soll.

  </Accordion>
  <Accordion title="Remote-macOS-Knoten (Linux-Gateway)">
    Wenn der Gateway auf Linux läuft, aber ein **macOS-Knoten** mit erlaubtem
    `system.run` verbunden ist, kann OpenClaw macOS-exklusive Skills als zulässig behandeln, wenn
    die erforderlichen Binärdateien auf diesem Knoten vorhanden sind. Der Agent sollte diese
    Skills über das `exec`-Tool mit `host=node` ausführen.

    Offline-Knoten machen **keine** reinen Remote-Skills sichtbar. Wenn ein Knoten nicht mehr
    auf Binärdatei-Probes antwortet, löscht OpenClaw seine zwischengespeicherten Binärdatei-Treffer.

  </Accordion>
</AccordionGroup>

## Token-Auswirkung

Wenn Skills zulässig sind, injiziert OpenClaw einen kompakten XML-Block in den System-
Prompt. Die Kosten sind deterministisch:

```text
total = 195 + Σ (97 + len(name) + len(description) + len(filepath))
```

- **Basis-Overhead** (nur bei ≥ 1 Skill): ~195 Zeichen
- **Pro Skill:** ~97 Zeichen + die Feldlängen Ihrer `name`-, `description`- und `location`-Felder
- XML-Escaping erweitert `& < > " '` zu Entitäten und fügt pro Vorkommen einige Zeichen hinzu
- Bei ~4 Zeichen/Token entsprechen 97 Zeichen etwa 24 Tokens pro Skill vor Feldlängen

Halten Sie Beschreibungen kurz und aussagekräftig, um den Prompt-Overhead zu minimieren.

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Skills erstellen" href="/de/tools/creating-skills" icon="hammer">
    Schritt-für-Schritt-Anleitung zum Erstellen eines benutzerdefinierten Skill.
  </Card>
  <Card title="Skill Workshop" href="/de/tools/skill-workshop" icon="flask">
    Vorschlagswarteschlange für von Agents entworfene Skills.
  </Card>
  <Card title="Skills-Konfiguration" href="/de/tools/skills-config" icon="gear">
    Vollständiges `skills.*`-Konfigurationsschema und Agent-Allowlists.
  </Card>
  <Card title="Slash-Befehle" href="/de/tools/slash-commands" icon="terminal">
    Wie Skill-Slash-Befehle registriert und geroutet werden.
  </Card>
  <Card title="ClawHub" href="/de/clawhub" icon="cloud">
    Skills im öffentlichen Registry durchsuchen und veröffentlichen.
  </Card>
  <Card title="Plugins" href="/de/tools/plugin" icon="plug">
    Plugins können Skills zusammen mit den Tools ausliefern, die sie dokumentieren.
  </Card>
</CardGroup>
