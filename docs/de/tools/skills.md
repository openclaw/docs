---
read_when:
    - Skills hinzufügen oder ändern
    - Skill-Zugriffsbeschränkungen, Zulassungslisten oder Laderegeln ändern
    - Priorität von Skills und Snapshot-Verhalten verstehen
sidebarTitle: Skills
summary: Skills zeigen Ihrem Agenten, wie er Werkzeuge verwendet. Erfahren Sie, wie sie geladen werden, wie die Prioritätsreihenfolge funktioniert und wie Sie Zugriffsbeschränkungen, Zulassungslisten und die Umgebungsinjektion konfigurieren.
title: Skills
x-i18n:
    generated_at: "2026-07-12T15:59:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 9eb87daab8a10caab2823e35d68293fe306d11a951e8a2b264cbbe3f2c3e8fff
    source_path: tools/skills.md
    workflow: 16
---

Skills sind Markdown-Anweisungsdateien, die dem Agenten vermitteln, wie und wann
Tools verwendet werden. Jeder Skill befindet sich in einem Verzeichnis mit einer
`SKILL.md`-Datei, die YAML-Frontmatter und einen Markdown-Textkörper enthält.
OpenClaw lädt mitgelieferte Skills sowie lokale Überschreibungen und filtert sie
beim Laden anhand von Umgebung, Konfiguration und vorhandenen Binärdateien.

<CardGroup cols={2}>
  <Card title="Skills erstellen" href="/de/tools/creating-skills" icon="hammer">
    Erstellen und testen Sie einen benutzerdefinierten Skill von Grund auf.
  </Card>
  <Card title="Skill-Workshop" href="/de/tools/skill-workshop" icon="flask">
    Prüfen und genehmigen Sie vom Agenten entworfene Skill-Vorschläge.
  </Card>
  <Card title="Skills-Konfiguration" href="/de/tools/skills-config" icon="gear">
    Vollständiges `skills.*`-Konfigurationsschema und Agenten-Zulassungslisten.
  </Card>
  <Card title="ClawHub" href="/clawhub" icon="cloud">
    Durchsuchen und installieren Sie Community-Skills.
  </Card>
</CardGroup>

## Ladereihenfolge

OpenClaw lädt aus diesen Quellen, **mit der höchsten Priorität zuerst**. Wenn
derselbe Skill-Name an mehreren Stellen vorkommt, hat die Quelle mit der höchsten
Priorität Vorrang.

| Priorität       | Quelle                         | Pfad                                    |
| --------------- | ------------------------------ | --------------------------------------- |
| 1 — höchste     | Workspace-Skills               | `<workspace>/skills`                    |
| 2               | Projektbezogene Agenten-Skills | `<workspace>/.agents/skills`            |
| 3               | Persönliche Agenten-Skills     | `~/.agents/skills`                      |
| 4               | Verwaltete / lokale Skills     | `~/.openclaw/skills`                    |
| 5               | Mitgelieferte Skills           | mit der Installation ausgeliefert       |
| 6 — niedrigste  | Zusätzliche Verzeichnisse      | `skills.load.extraDirs` + Plugin-Skills |

Skill-Stammverzeichnisse unterstützen gruppierte Strukturen. OpenClaw erkennt
einen Skill, sobald `SKILL.md` an einer beliebigen Stelle unterhalb eines
konfigurierten Stammverzeichnisses erscheint (bis zu 6 Ebenen tief):

```text
<workspace>/skills/research/SKILL.md          ✓ als „research“ gefunden
<workspace>/skills/personal/research/SKILL.md ✓ ebenfalls als „research“ gefunden
```

Der Ordnerpfad dient nur der Organisation. Der Name und der Slash-Befehl des
Skills stammen aus dem Frontmatter-Feld `name` (oder aus dem Verzeichnisnamen,
wenn `name` fehlt). Agenten-Zulassungslisten (siehe unten) gleichen ebenfalls
diesen `name` ab.

<Note>
  Das native Verzeichnis `$CODEX_HOME/skills` der Codex CLI ist **kein**
  Skill-Stammverzeichnis von OpenClaw. Verwenden Sie `openclaw migrate plan codex`,
  um diese Skills zu erfassen, und anschließend `openclaw migrate codex`, um sie
  in Ihren OpenClaw-Workspace zu kopieren.
</Note>

## Von Node bereitgestellte Skills

Ein verbundener Headless-Node kann Skills veröffentlichen, die in seinem aktiven OpenClaw-
Skills-Verzeichnis installiert sind (standardmäßig `~/.openclaw/skills`; Überschreibungen
durch die Profilumgebung gelten). Sie werden in der normalen Skill-Liste des Agenten angezeigt, solange der Node verbunden ist,
und verschwinden, wenn die Verbindung getrennt wird. Bei einem Namenskonflikt behält ein lokaler oder Gateway-Skill seinen Namen;
der Node-Skill erhält einen deterministischen Namen mit Node-Präfix.
Bei Node-gehostetem v1 muss der Verzeichnisname mit dem Frontmatter-Feld `name`
des Skills übereinstimmen.

Der Skill-Eintrag enthält den Node-Locator. Seine Dateien, relativen Verweise und
Binärdateien befinden sich auf dem Node. Laden Sie ihn daher mit
`exec host=node node=<node-id>` und führen Sie ihn damit aus. Starten Sie den Node-Host neu, nachdem Sie seine Skill-
Dateien geändert haben. Informationen zur Kopplung und zu Deaktivierungsoptionen finden Sie unter [Nodes](/de/nodes#node-hosted-skills).

## Agentenspezifische und gemeinsam genutzte Skills

In Multi-Agent-Setups verfügt jeder Agent über einen eigenen Workspace. Verwenden Sie den Pfad, der
der gewünschten Sichtbarkeit entspricht:

| Geltungsbereich                  | Pfad                         | Sichtbar für                         |
| -------------------------------- | ---------------------------- | ------------------------------------ |
| Agentenspezifisch                | `<workspace>/skills`         | Nur diesen Agenten                   |
| Projektagent                     | `<workspace>/.agents/skills` | Nur den Agenten dieses Workspace     |
| Persönlicher Agent               | `~/.agents/skills`           | Alle Agenten auf diesem Rechner      |
| Gemeinsam verwaltet              | `~/.openclaw/skills`         | Alle Agenten auf diesem Rechner      |
| Zusätzliche Verzeichnisse        | `skills.load.extraDirs`      | Alle Agenten auf diesem Rechner      |

## Agent-Allowlists

Skill-**Speicherort** (Priorität) und Skill-**Sichtbarkeit** (welcher Agent ihn verwenden kann) sind separate Steuerungsmöglichkeiten. Verwenden Sie Allowlists, um einzuschränken, welche Skills ein Agent sieht, unabhängig davon, von wo sie geladen werden.

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"], // gemeinsame Basis
    },
    list: [
      { id: "writer" }, // übernimmt github, weather
      { id: "docs", skills: ["docs-search"] }, // ersetzt die Standardwerte vollständig
      { id: "locked-down", skills: [] }, // keine Skills
    ],
  },
}
```

<AccordionGroup>
  <Accordion title="Allowlist-Regeln">
    - Lassen Sie `agents.defaults.skills` weg, damit standardmäßig alle Skills uneingeschränkt bleiben.
    - Lassen Sie `agents.list[].skills` weg, um `agents.defaults.skills` zu übernehmen.
    - Legen Sie `agents.list[].skills: []` fest, um für diesen Agent keine Skills bereitzustellen.
    - Eine nicht leere Liste `agents.list[].skills` ist die **endgültige** Menge — sie wird nicht mit den Standardwerten zusammengeführt.
    - Die resultierende Allowlist gilt für die Prompt-Erstellung, die Ermittlung von Slash-Befehlen, die Sandbox-Synchronisierung und Skill-Snapshots.
    - Dies ist keine Autorisierungsgrenze für die Host-Shell. Wenn derselbe Agent `exec` verwenden kann, schränken Sie diese Shell separat durch Sandboxing, Betriebssystembenutzer-Isolation, Exec-Deny-/Allowlists und ressourcenspezifische Anmeldedaten ein.

  </Accordion>
</AccordionGroup>

## Plugins und Skills

Plugins können eigene Skills bereitstellen, indem sie `skills`-Verzeichnisse in `openclaw.plugin.json` auflisten (Pfade relativ zum Plugin-Stammverzeichnis). Plugin-Skills werden geladen, wenn das Plugin aktiviert ist — beispielsweise stellt das Browser-Plugin einen `browser-automation`-Skill zur mehrstufigen Browsersteuerung bereit.

Plugin-Skill-Verzeichnisse werden auf derselben Ebene mit niedriger Priorität wie
`skills.load.extraDirs` zusammengeführt, sodass ein gleichnamiger gebündelter, verwalteter, Agent- oder Workspace-
Skill sie überschreibt. Steuern Sie die Eignung eines Plugin-eigenen Skills über
`metadata.openclaw.requires` in dessen Frontmatter, genau wie bei jedem anderen Skill.

Das vollständige Plugin-System finden Sie unter [Plugins](/de/tools/plugin) und [Tools](/de/tools).

## Skill Workshop

[Skill Workshop](/de/tools/skill-workshop) ist eine Vorschlagswarteschlange zwischen dem Agenten
und Ihren aktiven Skill-Dateien. Wenn der Agent wiederverwendbare Arbeit erkennt, entwirft er einen
Vorschlag, anstatt direkt in `SKILL.md` zu schreiben. Sie prüfen und genehmigen ihn,
bevor Änderungen vorgenommen werden.

```bash
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop apply <proposal-id>
```

Den vollständigen Lebenszyklus, die CLI-Referenz und die Konfiguration finden Sie unter
[Skill Workshop](/de/tools/skill-workshop).

## Installation von ClawHub

[ClawHub](https://clawhub.ai) ist das öffentliche Skills-Register. Verwenden Sie
`openclaw skills`-Befehle für Installation und Aktualisierung oder die `clawhub`-CLI zum
Veröffentlichen und Synchronisieren.

| Aktion                                      | Befehl                                                 |
| ------------------------------------------- | ------------------------------------------------------ |
| Einen Skill im Workspace installieren       | `openclaw skills install @owner/<slug>`                |
| Aus einem Git-Repository installieren       | `openclaw skills install git:owner/repo@ref`           |
| Ein lokales Skill-Verzeichnis installieren  | `openclaw skills install ./path/to/skill --as my-tool` |
| Für alle lokalen Agenten installieren       | `openclaw skills install @owner/<slug> --global`       |
| Alle Workspace-Skills aktualisieren         | `openclaw skills update --all`                         |
| Einen gemeinsam verwalteten Skill aktualisieren | `openclaw skills update @owner/<slug> --global`    |
| Alle gemeinsam verwalteten Skills aktualisieren | `openclaw skills update --all --global`            |
| Vertrauensrahmen eines Skills überprüfen    | `openclaw skills verify @owner/<slug>`                 |
| Die generierte Skill Card ausgeben          | `openclaw skills verify @owner/<slug> --card`          |
| Über die ClawHub-CLI veröffentlichen/synchronisieren | `clawhub sync --all`                           |

<AccordionGroup>
  <Accordion title="Installationsdetails">
    `openclaw skills install` installiert standardmäßig in das Verzeichnis `skills/`
    des aktiven Workspace. Fügen Sie `--global` hinzu, um in das gemeinsame Verzeichnis
    `~/.openclaw/skills` zu installieren, das für alle lokalen Agenten sichtbar ist,
    sofern Agent-Zulassungslisten es nicht einschränken.

    Git- und lokale Installationen erwarten `SKILL.md` im Stammverzeichnis der Quelle. Der Slug wird
    aus `name` im Frontmatter von `SKILL.md` übernommen, sofern dieser gültig ist, und andernfalls wird
    der Verzeichnis- oder Repository-Name verwendet. Verwenden Sie `--as <slug>`, um dies zu überschreiben.
    `openclaw skills update` verfolgt nur ClawHub-Installationen — installieren Sie Git-
    oder lokale Quellen erneut, um sie zu aktualisieren.

  </Accordion>
  <Accordion title="Überprüfung und Sicherheitsscans">
    `openclaw skills verify @owner/<slug>` fragt bei ClawHub den
    `clawhub.skill.verify.v1`-Vertrauensrahmen des Skills ab. Installierte ClawHub-Skills werden
    anhand der in `.clawhub/origin.json` aufgezeichneten Version und Registry überprüft.
    Reine Slugs werden für bereits installierte oder eindeutige Skills weiterhin akzeptiert, aber
    Referenzen mit Eigentümerangabe vermeiden Mehrdeutigkeiten beim Herausgeber.

    ClawHub-Skill-Seiten zeigen vor der Installation den aktuellen Status des Sicherheitsscans an,
    mit Detailseiten für VirusTotal, ClawScan und statische Analyse. Der
    Befehl wird mit einem von null verschiedenen Status beendet, wenn ClawHub die Überprüfung als fehlgeschlagen markiert. Herausgeber
    können Fehlalarme über das ClawHub-Dashboard oder mit
    `clawhub skill rescan @owner/<slug>` beheben.

  </Accordion>
  <Accordion title="Installationen aus privaten Archiven">
    Gateway-Clients, die eine Bereitstellung außerhalb von ClawHub benötigen, können ein ZIP-Skill-Archiv
    mit `skills.upload.begin`, `skills.upload.chunk` und `skills.upload.commit` bereitstellen
    und es anschließend mit `skills.install({ source: "upload", ... })` installieren. Dieser Pfad ist
    standardmäßig deaktiviert und erfordert `skills.install.allowUploadedArchives: true` in
    `openclaw.json`. Normale ClawHub-Installationen benötigen diese Einstellung niemals.
  </Accordion>
</AccordionGroup>

## Sicherheit

<Warning>
  Behandeln Sie Skills von Drittanbietern als **nicht vertrauenswürdigen Code**. Lesen Sie sie vor der Aktivierung.
  Bevorzugen Sie Sandbox-Ausführungen für nicht vertrauenswürdige Eingaben und riskante Tools. Weitere Informationen zu
  agentenseitigen Kontrollen finden Sie unter [Sandboxing](/de/gateway/sandboxing).
</Warning>

<AccordionGroup>
  <Accordion title="Pfadbegrenzung">
    Die Skill-Erkennung für Workspace, Projekt-Agenten und zusätzliche Verzeichnisse akzeptiert nur Skill-
    Stammverzeichnisse, deren aufgelöster Realpfad innerhalb des konfigurierten Stammverzeichnisses bleibt, sofern
    `skills.load.allowSymlinkTargets` nicht ausdrücklich einem Zielstammverzeichnis vertraut.
    Skill Workshop schreibt nur dann über diese vertrauenswürdigen Ziele, wenn
    `skills.workshop.allowSymlinkTargetWrites` aktiviert ist.
    Das verwaltete Verzeichnis `~/.openclaw/skills` und das persönliche Verzeichnis `~/.agents/skills` dürfen
    über symbolische Links eingebundene Skill-Ordner enthalten, aber der Realpfad jeder `SKILL.md` muss dennoch
    innerhalb ihres aufgelösten Skill-Verzeichnisses bleiben.
  </Accordion>
  <Accordion title="Installationsrichtlinie für Betreiber">
    Konfigurieren Sie `security.installPolicy`, um einen vertrauenswürdigen lokalen Richtlinienbefehl auszuführen,
    bevor Skill-Installationen fortgesetzt werden. Die Richtlinie erhält Metadaten und den Pfad zur bereitgestellten
    Quelle, gilt für ClawHub-, hochgeladene, Git- und lokale Quellen sowie für Aktualisierungs- und
    Abhängigkeitsinstallationspfade und verweigert den Vorgang, wenn der Befehl keine
    gültige Entscheidung zurückgeben kann.
  </Accordion>
  <Accordion title="Umfang der Secret-Injektion">
    `skills.entries.*.env` und `skills.entries.*.apiKey` injizieren Secrets nur für diesen Agent-Durchlauf in den
    **Host**-Prozess — nicht in die Sandbox. Halten Sie
    Secrets aus Prompts und Protokollen heraus.
  </Accordion>
</AccordionGroup>

Das umfassendere Bedrohungsmodell und die Sicherheitschecklisten finden Sie unter
[Sicherheit](/de/gateway/security).

## SKILL.md-Format

Jeder Skill benötigt im Frontmatter mindestens `name` und `description`:

```markdown
---
name: image-lab
description: Bilder über einen Provider-gestützten Bild-Workflow generieren oder bearbeiten
---

Wenn der Benutzer darum bittet, ein Bild zu generieren, verwenden Sie das Tool `image_generate`...
```

<Note>
  OpenClaw folgt der [AgentSkills](https://agentskills.io)-Spezifikation. Frontmatter
  wird zuerst als YAML geparst; schlägt dies fehl, wird auf einen Parser
  zurückgegriffen, der nur einzelne Zeilen unterstützt. Verschachtelte `metadata`-Blöcke
  (einschließlich mehrzeiliger YAML-Zuordnungen) werden zu einer JSON-Zeichenfolge
  abgeflacht und erneut als JSON5 geparst, sodass die unter [Zugangssteuerung](#gating)
  gezeigte Blockform funktioniert. Verwenden Sie `{baseDir}` im Textkörper, um auf den
  Pfad des Skill-Ordners zu verweisen.
</Note>

### Optionale Frontmatter-Schlüssel

<ParamField path="homepage" type="string">
  URL, die in der macOS-Benutzeroberfläche für Skills als "Website" angezeigt wird.
  Wird auch über `metadata.openclaw.homepage` unterstützt.
</ParamField>

<ParamField path="user-invocable" type="boolean" default="true">
  Bei `true` wird der Skill als vom Benutzer aufrufbarer Slash-Befehl bereitgestellt.
</ParamField>

<ParamField path="disable-model-invocation" type="boolean" default="false">
  Bei `true` hält OpenClaw die Anweisungen des Skills aus dem normalen Prompt
  des Agenten heraus. Der Skill ist weiterhin als Slash-Befehl verfügbar, wenn
  `user-invocable` ebenfalls `true` ist.
</ParamField>

<ParamField path="command-dispatch" type='"tool"'>
  Bei der Einstellung `tool` umgeht der Slash-Befehl das Modell und leitet
  den Aufruf direkt an ein registriertes Tool weiter.
</ParamField>

<ParamField path="command-tool" type="string">
  Name des aufzurufenden Tools, wenn `command-dispatch: tool` festgelegt ist.
</ParamField>

<ParamField path="command-arg-mode" type='"raw"' default="raw">
  Leitet bei der Tool-Weiterleitung die unverarbeitete Argumentzeichenfolge ohne
  Parsing durch den Kern an das Tool weiter. Das Tool erhält
  `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`.
</ParamField>

## Zugangssteuerung

OpenClaw filtert Skills beim Laden anhand von `metadata.openclaw` (ein in das
Frontmatter eingebettetes JSON5-Objekt; siehe den Parsing-Hinweis oben). Ein Skill
ohne `metadata.openclaw`-Block ist immer zulässig, sofern er nicht ausdrücklich
deaktiviert wurde.

```markdown
---
name: image-lab
description: Bilder über einen Provider-gestützten Bild-Workflow generieren oder bearbeiten
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
  Bei `true` wird der Skill immer einbezogen und alle anderen Zugangsprüfungen werden übersprungen.
</ParamField>

<ParamField path="emoji" type="string">
  Optionales Emoji, das in der macOS-Benutzeroberfläche für Skills angezeigt wird.
</ParamField>

<ParamField path="homepage" type="string">
  Optionale URL, die in der macOS-Benutzeroberfläche für Skills als "Website" angezeigt wird.
</ParamField>

<ParamField path="os" type='("darwin" | "linux" | "win32")[]'>
  Plattformfilter. Wenn festgelegt, ist der Skill nur auf einem aufgeführten Betriebssystem zulässig.
</ParamField>

<ParamField path="requires.bins" type="string[]">
  Jede Binärdatei muss im `PATH` vorhanden sein.
</ParamField>

<ParamField path="requires.anyBins" type="string[]">
  Mindestens eine Binärdatei muss im `PATH` vorhanden sein.
</ParamField>

<ParamField path="requires.env" type="string[]">
  Jede Umgebungsvariable muss im Prozess vorhanden sein oder über die Konfiguration bereitgestellt werden.
</ParamField>

<ParamField path="requires.config" type="string[]">
  Jeder `openclaw.json`-Pfad muss einen als wahr ausgewerteten Wert haben.
</ParamField>

<ParamField path="primaryEnv" type="string">
  Name der Umgebungsvariable, die `skills.entries.<name>.apiKey` zugeordnet ist.
</ParamField>

<ParamField path="install" type="object[]">
  Optionale Installationsspezifikationen, die von der macOS-Benutzeroberfläche für Skills verwendet werden (brew / node / go / uv / download).
</ParamField>

<Note>
  Veraltete `metadata.clawdbot`-Blöcke werden weiterhin akzeptiert, wenn
  `metadata.openclaw` fehlt, damit ältere installierte Skills ihre
  Abhängigkeitsprüfungen und Installationshinweise behalten. Neue Skills sollten
  `metadata.openclaw` verwenden.
</Note>

### Installationsspezifikationen

Installationsspezifikationen teilen der macOS-Benutzeroberfläche für Skills mit, wie eine Abhängigkeit installiert wird:

```markdown
---
name: gemini
description: Gemini CLI für Unterstützung beim Programmieren und Suchabfragen bei Google verwenden.
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
              "label": "Gemini CLI installieren (brew)",
            },
          ],
      },
  }
---
```

<AccordionGroup>
  <Accordion title="Regeln zur Auswahl des Installationsprogramms">
    - Wenn mehrere Installationsprogramme aufgeführt sind, wählt der Gateway eine
      bevorzugte Option aus (brew, falls verfügbar, andernfalls node).
    - Wenn alle Installationsprogramme `download` verwenden, führt OpenClaw jeden
      Eintrag auf, damit Sie alle verfügbaren Artefakte sehen können.
    - Spezifikationen können `os: ["darwin"|"linux"|"win32"]` enthalten, um nach Plattform zu filtern.
    - Node-Installationen berücksichtigen `skills.install.nodeManager` in `openclaw.json`
      (Standard: npm; Optionen: npm / pnpm / yarn / bun). Dies betrifft nur
      Skill-Installationen; die Gateway-Laufzeit sollte weiterhin Node sein.
    - Bevorzugte Installationsprogramme des Gateways: Homebrew → uv → konfigurierter Node-Manager →
      go → download.
  </Accordion>
  <Accordion title="Details zu den einzelnen Installationsprogrammen">
    - **Homebrew:** OpenClaw installiert Homebrew nicht automatisch und übersetzt
      brew-Formeln nicht in Systempaketbefehle. In Linux-Containern ohne
      `brew` werden reine brew-Installationsprogramme ausgeblendet; verwenden Sie
      ein benutzerdefiniertes Image oder installieren Sie die Abhängigkeit manuell.
    - **Go:** OpenClaw benötigt Go 1.21 oder neuer für automatische Skill-Installationen.
      Wenn `go` fehlt und Homebrew verfügbar ist, installiert OpenClaw zunächst Go über
      Homebrew; unter Linux ohne Homebrew kann stattdessen `apt-get`
      als Root oder über `sudo` ohne Passwort verwendet werden, wenn der aktualisierte
      `golang-go`-Kandidat die Mindestversion erfüllt. Der eigentliche Befehl `go install`
      für die Abhängigkeit verwendet immer ein dediziertes, von OpenClaw verwaltetes
      Binärverzeichnis (bei einer Neuinstallation `bin` von Homebrew, andernfalls
      `~/.local/bin`) statt Ihres konfigurierten `GOBIN` — Ihre eigenen
      Umgebungsvariablen `GOBIN`, `GOPATH` und `GOTOOLCHAIN` werden gelesen, aber
      niemals überschrieben.
    - **Download:** `url` (erforderlich), `archive` (`tar.gz` | `tar.bz2` | `zip`),
      `extract` (Standard: automatisch, wenn ein Archiv erkannt wird), `stripComponents`,
      `targetDir` (Standard: `~/.openclaw/tools/<skillKey>`).
  </Accordion>
  <Accordion title="Hinweise zur Sandbox">
    `requires.bins` wird beim Laden des Skills auf dem **Host** geprüft. Wenn ein
    Agent in einer Sandbox ausgeführt wird, muss die Binärdatei auch **innerhalb des
    Containers** vorhanden sein. Installieren Sie sie über
    `agents.defaults.sandbox.docker.setupCommand` oder ein benutzerdefiniertes Image.
    `setupCommand` wird einmal nach der Containererstellung ausgeführt und erfordert
    ausgehenden Netzwerkzugriff, ein beschreibbares Root-Dateisystem und einen
    Root-Benutzer in der Sandbox.
  </Accordion>
</AccordionGroup>

## Konfigurationsüberschreibungen

Aktivieren und konfigurieren Sie gebündelte oder verwaltete Skills unter
`skills.entries` in `~/.openclaw/openclaw.json`:

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
  `false` deaktiviert den Skill, selbst wenn er gebündelt oder installiert ist. Der
  gebündelte Skill `coding-agent` muss explizit aktiviert werden — legen Sie
  `skills.entries.coding-agent.enabled: true` fest und stellen Sie sicher, dass
  `claude`, `codex`, `opencode` oder eine andere unterstützte CLI installiert und
  authentifiziert ist.
</ParamField>

<ParamField path="apiKey" type='string | { source, provider, id }'>
  Komfortfeld für Skills, die `metadata.openclaw.primaryEnv` deklarieren.
  Unterstützt eine Klartextzeichenfolge oder ein SecretRef-Objekt.
</ParamField>

<ParamField path="env" type="Record<string, string>">
  Für den Agentenlauf eingespeiste Umgebungsvariablen. Sie werden nur eingespeist,
  wenn die Variable nicht bereits im Prozess festgelegt ist.
</ParamField>

<ParamField path="config" type="object">
  Optionaler Container für benutzerdefinierte Konfigurationsfelder pro Skill.
</ParamField>

<ParamField path="allowBundled" type="string[]">
  Optionale Positivliste ausschließlich für **gebündelte** Skills. Wenn sie
  festgelegt ist, sind nur die in der Liste enthaltenen gebündelten Skills
  zulässig. Verwaltete Skills und Workspace-Skills sind nicht betroffen.
</ParamField>

<Note>
  Konfigurationsschlüssel entsprechen standardmäßig dem **Skill-Namen**. Wenn ein
  Skill `metadata.openclaw.skillKey` definiert, verwenden Sie stattdessen diesen
  Schlüssel unter `skills.entries`. Setzen Sie Namen mit Bindestrichen in
  Anführungszeichen: JSON5 erlaubt Schlüssel in Anführungszeichen.
</Note>

## Einspeisung von Umgebungsvariablen

Wenn ein Agentenlauf startet, führt OpenClaw folgende Schritte aus:

<Steps>
  <Step title="Liest Skill-Metadaten">
    OpenClaw ermittelt die effektive Skill-Liste für den Agenten und wendet dabei
    Zugangsregeln, Positivlisten und Konfigurationsüberschreibungen an.
  </Step>
  <Step title="Speist Umgebungsvariablen und API-Schlüssel ein">
    `skills.entries.<key>.env` und `skills.entries.<key>.apiKey` werden für die
    Dauer des Laufs auf `process.env` angewendet.
  </Step>
  <Step title="Erstellt den System-Prompt">
    Zulässige Skills werden in einen kompakten XML-Block kompiliert und in den
    System-Prompt eingespeist.
  </Step>
  <Step title="Stellt die Umgebung wieder her">
    Nach Ende des Laufs wird die ursprüngliche Umgebung wiederhergestellt.
  </Step>
</Steps>

<Warning>
  Die Einspeisung von Umgebungsvariablen ist auf den Agentenlauf auf dem **Host**
  beschränkt, nicht auf die Sandbox. Innerhalb einer Sandbox haben `env` und
  `apiKey` keine Wirkung. Unter
  [Skills-Konfiguration](/de/tools/skills-config#sandboxed-skills-and-env-vars)
  erfahren Sie, wie Sie Geheimnisse an Sandbox-Läufe übergeben.
</Warning>

Für das gebündelte Backend `claude-cli` materialisiert OpenClaw denselben
zulässigen Skill-Snapshot außerdem als temporäres Claude-Code-Plugin und
übergibt ihn über `--plugin-dir`. Andere CLI-Backends verwenden nur den
Prompt-Katalog.

## Snapshots und Aktualisierung

OpenClaw erstellt einen Snapshot der zulässigen Skills, **wenn eine Sitzung
beginnt**, und verwendet diese Liste für alle nachfolgenden Interaktionen in der
Sitzung erneut. Änderungen an Skills oder der Konfiguration werden mit der
nächsten neuen Sitzung wirksam.

Skills werden während einer Sitzung in zwei Fällen aktualisiert:

- Die Skill-Überwachung erkennt eine Änderung an `SKILL.md`.
- Ein neuer zulässiger Remote-Node stellt eine Verbindung her.

Die aktualisierte Liste wird beim nächsten Agentenlauf übernommen. Wenn sich die
effektive Positivliste des Agenten ändert, aktualisiert OpenClaw den Snapshot,
damit die sichtbaren Skills übereinstimmen.

<AccordionGroup>
  <Accordion title="Skill-Überwachung">
    Standardmäßig überwacht OpenClaw Skill-Ordner und aktualisiert den Snapshot,
    wenn sich `SKILL.md`-Dateien ändern. Konfigurieren Sie dies unter `skills.load`:

    ```json5
    {
      skills: {
        load: {
          extraDirs: ["~/Projects/agent-scripts/skills"],
          allowSymlinkTargets: ["~/Projects/manager/skills"],
          watch: true, // Standard
          watchDebounceMs: 250, // Standard
        },
      },
    }
    ```

    Verwenden Sie `allowSymlinkTargets` für beabsichtigte Layouts mit symbolischen
    Links, bei denen ein symbolischer Link des Skill-Stammverzeichnisses außerhalb
    des konfigurierten Stammverzeichnisses verweist, beispielsweise
    `<workspace>/skills/manager -> ~/Projects/manager/skills`.
    Aktivieren Sie `skills.workshop.allowSymlinkTargetWrites` nur, wenn Skill Workshop
    Vorschläge auch über diese vertrauenswürdigen Pfade mit symbolischen Links
    anwenden soll.

  </Accordion>
  <Accordion title="Entfernte macOS-Nodes (Linux-Gateway)">
    Wenn der Gateway unter Linux ausgeführt wird, aber ein **macOS-Node** mit
    zugelassenem `system.run` verbunden ist, kann OpenClaw ausschließlich für macOS
    vorgesehene Skills als zulässig behandeln, wenn die erforderlichen Binärdateien
    auf diesem Node vorhanden sind. Der Agent sollte diese Skills über das Tool
    `exec` mit `host=node` ausführen.

    Offline-Nodes machen ausschließlich remote verfügbare Skills **nicht** sichtbar.
    Wenn ein Node nicht mehr auf Prüfungen von Binärdateien antwortet, löscht
    OpenClaw seine zwischengespeicherten Binärdateiübereinstimmungen.

  </Accordion>
</AccordionGroup>

## Token-Auswirkung

Wenn Skills zulässig sind, speist OpenClaw einen kompakten XML-Block in den
System-Prompt ein. Die Kosten sind deterministisch und skalieren linear pro Skill:

- **Grundaufwand** (nur wenn mindestens 1 Skill zulässig ist): ein fester Block
  einleitenden Textes sowie das `<available_skills>`-Wrapper-Element.
- **Pro Skill:** ~97 Zeichen + die Längen Ihrer Felder `name`, `description` und
  `location`.
- XML-Escaping wandelt `& < > " '` in Entitäten um und fügt pro Vorkommen einige
  Zeichen hinzu.
- Bei ~4 Zeichen/Token entsprechen 97 Zeichen ≈ 24 Token pro Skill vor den
  Feldlängen.

Wenn der gerenderte Block das konfigurierte Prompt-Budget überschreiten würde
(`skills.limits.maxSkillsPromptChars`), bewahrt OpenClaw zunächst so viele
Skill-Identitäten (Name, Speicherort und Version) wie möglich in dem kompakten
Format ohne Beschreibungen. Anschließend wird das verbleibende Budget für
gekürzte Beschreibungen verwendet. Wenn kein Budget für Beschreibungen
verbleibt, werden sie weggelassen. Der Prompt enthält einen Hinweis auf
`openclaw skills check`, wenn eine kompakte Formatierung oder das Kürzen der
Liste erforderlich ist.

Halten Sie Beschreibungen kurz und aussagekräftig, um den Prompt-Overhead zu minimieren.

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Skills erstellen" href="/de/tools/creating-skills" icon="hammer">
    Schritt-für-Schritt-Anleitung zum Erstellen eines benutzerdefinierten Skills.
  </Card>
  <Card title="Skill-Workshop" href="/de/tools/skill-workshop" icon="flask">
    Vorschlagswarteschlange für von Agenten entworfene Skills.
  </Card>
  <Card title="Skills-Konfiguration" href="/de/tools/skills-config" icon="gear">
    Vollständiges `skills.*`-Konfigurationsschema und Zulassungslisten für Agenten.
  </Card>
  <Card title="Slash-Befehle" href="/de/tools/slash-commands" icon="terminal">
    Wie Slash-Befehle von Skills registriert und weitergeleitet werden.
  </Card>
  <Card title="ClawHub" href="/clawhub" icon="cloud">
    Durchsuchen und veröffentlichen Sie Skills im öffentlichen Register.
  </Card>
  <Card title="Plugins" href="/de/tools/plugin" icon="plug">
    Plugins können Skills zusammen mit den von ihnen dokumentierten Werkzeugen bereitstellen.
  </Card>
</CardGroup>
