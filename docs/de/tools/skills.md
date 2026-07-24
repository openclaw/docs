---
read_when:
    - Skills hinzufügen oder ändern
    - Ändern von Skill-Zugriffsbeschränkungen, Zulassungslisten oder Laderegeln
    - Grundlagen zur Priorität von Skills und zum Snapshot-Verhalten
sidebarTitle: Skills
summary: Skills zeigen Ihrem Agenten, wie er Tools verwendet. Erfahren Sie, wie sie geladen werden, wie die Rangfolge funktioniert und wie Sie Zugriffsbeschränkungen, Positivlisten und die Umgebungsinjektion konfigurieren.
title: Skills
x-i18n:
    generated_at: "2026-07-24T04:14:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 6925add85652023e3dd2f51f607412fd0bf00581923f76ab2aafd2ca5b8d72be
    source_path: tools/skills.md
    workflow: 16
---

Skills sind Markdown-Anweisungsdateien, die dem Agenten vermitteln, wie und wann
Tools zu verwenden sind. Jeder Skill befindet sich in einem Verzeichnis, das eine Datei `SKILL.md` mit YAML-
Frontmatter und einem Markdown-Textkörper enthält. OpenClaw lädt gebündelte Skills sowie alle lokalen
Überschreibungen und filtert sie beim Laden anhand von Umgebung, Konfiguration und
Vorhandensein von Binärdateien.

<CardGroup cols={2}>
  <Card title="Skills erstellen" href="/de/tools/creating-skills" icon="hammer">
    Erstellen und testen Sie einen benutzerdefinierten Skill von Grund auf.
  </Card>
  <Card title="Skill Workshop" href="/de/tools/skill-workshop" icon="flask">
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

OpenClaw lädt aus diesen Quellen, **beginnend mit der höchsten Priorität**. Wenn derselbe
Skill-Name an mehreren Stellen vorkommt, hat die Quelle mit der höchsten Priorität Vorrang.

| Priorität   | Quelle                         | Pfad                                    |
| ----------- | ------------------------------ | --------------------------------------- |
| 1 — höchste | Workspace-Skills               | `<workspace>/skills`                    |
| 2           | Projekt-Agenten-Skills         | `<workspace>/.agents/skills`            |
| 3           | Persönliche Agenten-Skills     | `~/.agents/skills`                      |
| 4           | Verwaltete / lokale Skills     | `~/.openclaw/skills`                    |
| 5           | Gebündelte Skills              | werden mit der Installation ausgeliefert |
| 6 — niedrigste | Zusätzliche Verzeichnisse   | `skills.load.extraDirs` + Plugin-Skills |

Skill-Stammverzeichnisse unterstützen gruppierte Strukturen. OpenClaw erkennt einen Skill, sobald
`SKILL.md` irgendwo unterhalb eines konfigurierten Stammverzeichnisses erscheint (bis zu 6 Ebenen tief):

```text
<workspace>/skills/research/SKILL.md          ✓ als "research" gefunden
<workspace>/skills/personal/research/SKILL.md ✓ ebenfalls als "research" gefunden
```

Der Ordnerpfad dient ausschließlich der Organisation. Der Name und der Slash-Befehl des Skills
stammen aus dem Frontmatter-Feld `name` (oder aus dem Verzeichnisnamen, wenn `name`
fehlt). Agenten-Zulassungslisten (siehe unten) gleichen ebenfalls diesen `name` ab.

<Note>
  Das native Verzeichnis `$CODEX_HOME/skills` der Codex CLI ist **kein** OpenClaw-
  Skill-Stammverzeichnis. Verwenden Sie `openclaw migrate plan codex`, um diese Skills zu erfassen, und anschließend
  `openclaw migrate codex`, um sie in Ihren OpenClaw-Workspace zu kopieren.
</Note>

## Auf Nodes gehostete Skills

Ein verbundener Headless-Node kann Skills veröffentlichen, die in seinem aktiven OpenClaw-
Skills-Verzeichnis installiert sind (standardmäßig `~/.openclaw/skills`; Überschreibungen durch die Profilumgebung
gelten). Sie erscheinen in der normalen Skill-Liste des Agenten, solange der Node verbunden ist,
und verschwinden, wenn seine Verbindung getrennt wird. Bei einer Namenskollision behält ein lokaler oder Gateway-Skill
seinen Namen; der Node-Skill erhält einen deterministischen, mit dem Node-Präfix versehenen Namen.
Bei auf Nodes gehosteten Skills der Version v1 muss der Verzeichnisname mit dem Frontmatter-Feld
`name` des Skills übereinstimmen.

Der Skill-Eintrag enthält den Node-Locator. Seine Dateien, relativen Referenzen und
Binärdateien befinden sich auf dem Node; laden Sie ihn daher mit
`exec host=node node=<node-id>` und führen Sie ihn damit aus. Starten Sie den Node-Host neu, nachdem Sie seine Skill-
Dateien geändert haben. Informationen zur Kopplung und zu Deaktivierungsoptionen finden Sie unter [Nodes](/de/nodes#node-hosted-skills).

## Agentenspezifische und gemeinsam genutzte Skills

In Multi-Agenten-Konfigurationen verfügt jeder Agent über einen eigenen Workspace. Verwenden Sie den Pfad, der
der gewünschten Sichtbarkeit entspricht:

| Geltungsbereich          | Pfad                         | Sichtbar für                         |
| ------------------------ | ---------------------------- | ------------------------------------ |
| Agentenspezifisch        | `<workspace>/skills`         | Nur diesen Agenten                   |
| Projekt-Agent            | `<workspace>/.agents/skills` | Nur den Agenten dieses Workspace     |
| Persönlicher Agent       | `~/.agents/skills`           | Alle Agenten auf diesem Rechner      |
| Gemeinsam verwaltet      | `~/.openclaw/skills`         | Alle Agenten auf diesem Rechner      |
| Zusätzliche Verzeichnisse | `skills.load.extraDirs`      | Alle Agenten auf diesem Rechner      |

## Agenten-Zulassungslisten

Der **Speicherort** eines Skills (Priorität) und seine **Sichtbarkeit** (welcher Agent ihn verwenden kann)
sind separate Steuerungsmöglichkeiten. Verwenden Sie Zulassungslisten, um einzuschränken, welche Skills ein Agent sieht,
unabhängig davon, woher sie geladen werden.

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
  <Accordion title="Regeln für Zulassungslisten">
    - Lassen Sie `agents.defaults.skills` weg, damit standardmäßig alle Skills uneingeschränkt bleiben.
    - Lassen Sie `agents.entries.*.skills` weg, um `agents.defaults.skills` zu übernehmen.
    - Setzen Sie `agents.entries.*.skills: []`, damit für diesen Agenten keine Skills verfügbar sind.
    - Eine nicht leere Liste `agents.entries.*.skills` ist die **endgültige** Menge — sie wird nicht
      mit den Standardwerten zusammengeführt.
    - Die effektive Zulassungsliste gilt für den Aufbau von Prompts, die Erkennung von Slash-Befehlen,
      die Sandbox-Synchronisierung und Skill-Snapshots.
    - Dies ist keine Autorisierungsgrenze für die Host-Shell. Wenn derselbe Agent
      `exec` verwenden kann, schränken Sie diese Shell separat durch Sandboxing, Isolation auf
      Betriebssystembenutzerebene, Ausführungs-Sperr-/Zulassungslisten und ressourcenspezifische Zugangsdaten ein.
  </Accordion>
</AccordionGroup>

## Plugins und Skills

Plugins können eigene Skills mitliefern, indem sie `skills`-Verzeichnisse in
`openclaw.plugin.json` auflisten (Pfade relativ zum Plugin-Stammverzeichnis). Plugin-Skills werden geladen,
wenn das Plugin aktiviert ist — beispielsweise liefert das Browser-Plugin einen
`browser-automation`-Skill für die mehrstufige Browsersteuerung mit.

Plugin-Skill-Verzeichnisse werden auf derselben niedrigen Prioritätsstufe wie
`skills.load.extraDirs` zusammengeführt, sodass ein gleichnamiger gebündelter, verwalteter, Agenten- oder Workspace-
Skill sie überschreibt. Steuern Sie die Verfügbarkeit eines Plugin-Skills über
`metadata.openclaw.requires` in seinem Frontmatter, genau wie bei jedem anderen Skill.

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

Den vollständigen Lebenszyklus, die CLI-Referenz
und die Konfiguration finden Sie unter [Skill Workshop](/de/tools/skill-workshop).

## Installation aus ClawHub

[ClawHub](https://clawhub.ai) ist das öffentliche Skills-Register. Verwenden Sie
`openclaw skills`-Befehle zur Installation und Aktualisierung oder die CLI `clawhub`
zur Veröffentlichung und Synchronisierung.

| Aktion                                         | Befehl                                                 |
| ---------------------------------------------- | ------------------------------------------------------ |
| Einen Skill im Workspace installieren          | `openclaw skills install @owner/<slug>`                |
| Aus einem Git-Repository installieren          | `openclaw skills install git:owner/repo@ref`           |
| Ein lokales Skill-Verzeichnis installieren     | `openclaw skills install ./path/to/skill --as my-tool` |
| Für alle lokalen Agenten installieren          | `openclaw skills install @owner/<slug> --global`       |
| Alle Workspace-Skills aktualisieren            | `openclaw skills update --all`                         |
| Einen gemeinsam verwalteten Skill aktualisieren | `openclaw skills update @owner/<slug> --global`        |
| Alle gemeinsam verwalteten Skills aktualisieren | `openclaw skills update --all --global`                |
| Die Vertrauenshülle eines Skills überprüfen    | `openclaw skills verify @owner/<slug>`                 |
| Die generierte Skill Card ausgeben             | `openclaw skills verify @owner/<slug> --card`          |
| Über die ClawHub-CLI veröffentlichen/synchronisieren | `clawhub sync --all`                                   |

<AccordionGroup>
  <Accordion title="Installationsdetails">
    `openclaw skills install` installiert standardmäßig in das Verzeichnis `skills/`
    des aktiven Workspace. Fügen Sie `--global` hinzu, um in das gemeinsam genutzte
    Verzeichnis `~/.openclaw/skills` zu installieren, das für alle lokalen Agenten sichtbar ist, sofern
    Agenten-Zulassungslisten es nicht einschränken.

    Git- und lokale Installationen erwarten `SKILL.md` im Quellstammverzeichnis. Der Slug wird
    aus dem Frontmatter `SKILL.md` `name` übernommen, sofern er gültig ist, und greift andernfalls auf den
    Verzeichnis- oder Repository-Namen zurück. Verwenden Sie `--as <slug>`, um ihn zu überschreiben.
    `openclaw skills update` verfolgt ausschließlich ClawHub-Installationen — installieren Sie Git-
    oder lokale Quellen erneut, um sie zu aktualisieren.

  </Accordion>
  <Accordion title="Überprüfung und Sicherheitsscans">
    `openclaw skills verify @owner/<slug>` fordert von ClawHub die
    `clawhub.skill.verify.v1`-Vertrauenshülle des Skills an. Installierte ClawHub-Skills werden
    anhand der in `.clawhub/origin.json` aufgezeichneten Version und Registry überprüft.
    Reine Slugs werden für bereits installierte oder eindeutig bestimmbare Skills weiterhin akzeptiert,
    aber durch den Besitzer qualifizierte Referenzen vermeiden Mehrdeutigkeiten beim Herausgeber.

    ClawHub-Skill-Seiten zeigen vor der Installation den Status des neuesten Sicherheitsscans an,
    mit Detailseiten für VirusTotal, ClawScan und statische Analyse. Der
    Befehl wird mit einem von null verschiedenen Status beendet, wenn ClawHub die Überprüfung als fehlgeschlagen kennzeichnet. Herausgeber
    beheben Fehlalarme über das ClawHub-Dashboard oder
    `clawhub skill rescan @owner/<slug>`.

  </Accordion>
  <Accordion title="Installationen aus privaten Archiven">
    Gateway-Clients, die eine Bereitstellung außerhalb von ClawHub benötigen, können ein ZIP-Skill-Archiv
    mit `skills.upload.begin`, `skills.upload.chunk` und `skills.upload.commit` bereitstellen
    und anschließend mit `skills.install({ source: "upload", ... })` installieren. Dieser Pfad ist
    standardmäßig deaktiviert und erfordert `skills.install.allowUploadedArchives: true` in
    `openclaw.json`. Normale ClawHub-Installationen benötigen diese Einstellung nie.
  </Accordion>
</AccordionGroup>

## Sicherheit

<Warning>
  Behandeln Sie Skills von Drittanbietern als **nicht vertrauenswürdigen Code**. Lesen Sie sie vor der Aktivierung.
  Bevorzugen Sie Ausführungen in einer Sandbox für nicht vertrauenswürdige Eingaben und riskante Tools. Informationen zu
  agentenseitigen Steuerungsmöglichkeiten finden Sie unter [Sandboxing](/de/gateway/sandboxing).
</Warning>

<AccordionGroup>
  <Accordion title="Pfadbegrenzung">
    Die Erkennung von Skills in Workspace-, Projekt-Agenten- und zusätzlichen Verzeichnissen akzeptiert nur Skill-
    Stammverzeichnisse, deren aufgelöster realpath innerhalb des konfigurierten Stammverzeichnisses bleibt, es sei denn,
    `skills.load.allowSymlinkTargets` vertraut einem Zielstammverzeichnis ausdrücklich.
    Skill Workshop schreibt nur dann über diese vertrauenswürdigen Ziele, wenn
    `skills.workshop.allowSymlinkTargetWrites` aktiviert ist.
    Das verwaltete Verzeichnis `~/.openclaw/skills` und das persönliche Verzeichnis `~/.agents/skills` dürfen
    über symbolische Links eingebundene Skill-Ordner enthalten, aber jeder realpath von `SKILL.md` muss dennoch
    innerhalb seines aufgelösten Skill-Verzeichnisses bleiben.
  </Accordion>
  <Accordion title="Installationsrichtlinie des Betreibers">
    Konfigurieren Sie `security.installPolicy`, um einen vertrauenswürdigen lokalen Richtlinienbefehl auszuführen,
    bevor Skill-Installationen fortgesetzt werden. Die Richtlinie erhält Metadaten und den bereitgestellten
    Quellpfad, gilt für ClawHub-, Upload-, Git-, lokale, Aktualisierungs- und
    Abhängigkeitsinstallationspfade und schlägt geschlossen fehl, wenn der Befehl keine
    gültige Entscheidung zurückgeben kann.
  </Accordion>
  <Accordion title="Geltungsbereich der Geheimnisinjektion">
    `skills.entries.*.env` und `skills.entries.*.apiKey` injizieren Geheimnisse ausschließlich für diesen Agentendurchlauf in den
    **Host**-Prozess — nicht in die Sandbox. Halten Sie
    Geheimnisse aus Prompts und Protokollen heraus.
  </Accordion>
</AccordionGroup>

Das umfassendere Bedrohungsmodell und Sicherheitschecklisten finden Sie unter
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
  OpenClaw folgt der Spezifikation [AgentSkills](https://agentskills.io). Das Frontmatter
  wird zunächst als YAML geparst; wenn dies fehlschlägt, wird auf einen Parser zurückgegriffen, der nur
  einzelne Zeilen unterstützt. Verschachtelte `metadata`-Blöcke (einschließlich mehrzeiliger YAML-Zuordnungen) werden
  in eine JSON-Zeichenfolge abgeflacht und erneut als JSON5 geparst, sodass die unter
  [Zugriffssteuerung](#gating) gezeigte Blockform funktioniert. Verwenden Sie `{baseDir}` im Textkörper, um auf den
  Pfad des Skill-Ordners zu verweisen.
</Note>

### Optionale Frontmatter-Schlüssel

<ParamField path="homepage" type="string">
  URL, die in der macOS-Skills-Benutzeroberfläche als "Website" angezeigt wird. Wird auch über
  `metadata.openclaw.homepage` unterstützt.
</ParamField>

<ParamField path="user-invocable" type="boolean" default="true">
  Wenn `true`, wird der Skill als durch Benutzer aufrufbarer Slash-Befehl bereitgestellt.
</ParamField>

<ParamField path="disable-model-invocation" type="boolean" default="false">
  Wenn `true`, nimmt OpenClaw die Anweisungen des Skills nicht in den normalen
  Prompt des Agenten auf. Der Skill ist weiterhin als Slash-Befehl verfügbar, wenn `user-invocable`
  ebenfalls `true` ist.
</ParamField>

<ParamField path="command-dispatch" type='"tool"'>
  Bei der Einstellung `tool` umgeht der Slash-Befehl das Modell und leitet
  den Aufruf direkt an ein registriertes Tool weiter.
</ParamField>

<ParamField path="command-tool" type="string">
  Name des aufzurufenden Tools, wenn `command-dispatch: tool` festgelegt ist.
</ParamField>

<ParamField path="command-arg-mode" type='"raw"' default="raw">
  Bei der Weiterleitung an ein Tool wird die unverarbeitete Argumentzeichenfolge ohne
  Parsing durch den Kern an das Tool weitergegeben. Das Tool empfängt
  `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`.
</ParamField>

## Zugriffssteuerung

OpenClaw filtert Skills beim Laden anhand von `metadata.openclaw` (ein in das
Frontmatter eingebettetes JSON5-Objekt; siehe den Parsing-Hinweis oben). Ein Skill ohne
`metadata.openclaw`-Block ist immer zulässig, sofern er nicht ausdrücklich deaktiviert ist.

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
  Wenn `true`, wird der Skill immer einbezogen und alle anderen Prüfungen werden übersprungen.
</ParamField>

<ParamField path="emoji" type="string">
  Optionales Emoji, das in der macOS-Skills-Benutzeroberfläche angezeigt wird.
</ParamField>

<ParamField path="homepage" type="string">
  Optionale URL, die in der macOS-Skills-Benutzeroberfläche als "Website" angezeigt wird.
</ParamField>

<ParamField path="os" type='("darwin" | "linux" | "win32")[]'>
  Plattformfilter. Wenn festgelegt, ist der Skill nur auf einem aufgeführten Betriebssystem zulässig.
</ParamField>

<ParamField path="requires.bins" type="string[]">
  Jede Binärdatei muss unter `PATH` vorhanden sein.
</ParamField>

<ParamField path="requires.anyBins" type="string[]">
  Mindestens eine Binärdatei muss unter `PATH` vorhanden sein.
</ParamField>

<ParamField path="requires.env" type="string[]">
  Jede Umgebungsvariable muss im Prozess vorhanden sein oder über die Konfiguration bereitgestellt werden.
</ParamField>

<ParamField path="requires.config" type="string[]">
  Jeder `openclaw.json`-Pfad muss einen als wahr ausgewerteten Wert haben.
</ParamField>

<ParamField path="primaryEnv" type="string">
  Name der mit `skills.entries.<name>.apiKey` verknüpften Umgebungsvariable.
</ParamField>

<ParamField path="install" type="object[]">
  Optionale Installationsspezifikationen für die macOS-Skills-Benutzeroberfläche (brew / node / go / uv / download).
</ParamField>

<Note>
  Veraltete `metadata.clawdbot`-Blöcke werden weiterhin akzeptiert, wenn
  `metadata.openclaw` fehlt, damit ältere installierte Skills ihre
  Abhängigkeitsprüfungen und Installationshinweise behalten. Neue Skills sollten
  `metadata.openclaw` verwenden.
</Note>

### Installationsspezifikationen

Installationsspezifikationen teilen der macOS-Skills-Benutzeroberfläche mit, wie eine Abhängigkeit installiert wird:

```markdown
---
name: gemini
description: Gemini CLI für Programmierunterstützung und Google-Suchabfragen verwenden.
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
    - Wenn mehrere Installationsprogramme aufgeführt sind, wählt das Gateway eine bevorzugte
      Option aus (brew, sofern verfügbar, andernfalls node).
    - Wenn alle Installationsprogramme `download` sind, listet OpenClaw jeden Eintrag auf, damit Sie
      alle verfügbaren Artefakte sehen können.
    - Spezifikationen können `os: ["darwin"|"linux"|"win32"]` enthalten, um nach Plattform zu filtern.
    - Node-Installationen berücksichtigen `skills.install.nodeManager` in `openclaw.json`
      (Standard: npm; Optionen: npm / pnpm / yarn / bun). Dies wirkt sich nur auf
      Skill-Installationen aus; die Gateway-Laufzeit sollte weiterhin Node sein.
    - Installationspräferenz des Gateways: Homebrew → uv → konfigurierter Node-Manager →
      go → download.
  </Accordion>
  <Accordion title="Details zu den einzelnen Installationsprogrammen">
    - **Homebrew:** OpenClaw installiert Homebrew nicht automatisch und übersetzt brew-
      Formeln nicht in Befehle des Systempaketmanagers. In Linux-Containern ohne
      `brew` werden reine brew-Installationsprogramme ausgeblendet; verwenden Sie ein benutzerdefiniertes Image oder installieren
      Sie die Abhängigkeit manuell.
    - **Go:** OpenClaw benötigt Go 1.21 oder neuer für automatische Skill-Installationen.
      Wenn `go` fehlt und Homebrew verfügbar ist, installiert OpenClaw zunächst Go über
      Homebrew; unter Linux ohne Homebrew kann OpenClaw stattdessen `apt-get`
      als root oder über passwortloses `sudo` verwenden, wenn der aktualisierte `golang-go`-
      Kandidat die Mindestversion erfüllt. Der tatsächliche `go install` für die
      Abhängigkeit zielt immer auf ein dediziertes, von OpenClaw verwaltetes Binärverzeichnis
      (bei einer Neuinstallation `bin` von Homebrew, andernfalls `~/.local/bin`) statt auf
      Ihr konfiguriertes `GOBIN` — Ihre eigenen Umgebungsvariablen `GOBIN`, `GOPATH` und `GOTOOLCHAIN`
      werden gelesen, aber niemals überschrieben.
    - **Download:** `url` (erforderlich), `archive` (`tar.gz` | `tar.bz2` | `zip`),
      `extract` (Standard: automatisch, wenn ein Archiv erkannt wird), `stripComponents`,
      `targetDir` (Standard: `~/.openclaw/tools/<skillKey>`).
  </Accordion>
  <Accordion title="Hinweise zur Sandbox">
    `requires.bins` wird beim Laden des Skills auf dem **Host** geprüft. Wenn ein Agent
    in einer Sandbox ausgeführt wird, muss die Binärdatei auch **innerhalb des Containers** vorhanden sein.
    Installieren Sie sie über `agents.defaults.sandbox.docker.setupCommand` oder ein benutzerdefiniertes
    Image. `setupCommand` wird einmal nach der Containererstellung ausgeführt und erfordert
    ausgehenden Netzwerkzugriff, ein beschreibbares Root-Dateisystem und einen Root-Benutzer in der Sandbox.
  </Accordion>
</AccordionGroup>

## Konfigurationsüberschreibungen

Aktivieren und konfigurieren Sie mitgelieferte oder verwaltete Skills unter `skills.entries` in
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
  `false` deaktiviert den Skill, selbst wenn er mitgeliefert oder installiert ist. Der mitgelieferte Skill
  `coding-agent` muss ausdrücklich aktiviert werden — legen Sie `skills.entries.coding-agent.enabled: true` fest
  und stellen Sie sicher, dass `claude`, `codex`, `opencode` oder eine andere unterstützte CLI
  installiert und authentifiziert ist.
</ParamField>

<ParamField path="apiKey" type='string | { source, provider, id }'>
  Komfortfeld für Skills, die `metadata.openclaw.primaryEnv` deklarieren.
  Unterstützt eine Klartextzeichenfolge oder ein SecretRef-Objekt.
</ParamField>

<ParamField path="env" type="Record<string, string>">
  Für die Agentenausführung injizierte Umgebungsvariablen. Sie werden nur injiziert, wenn die
  Variable nicht bereits im Prozess gesetzt ist.
</ParamField>

<ParamField path="config" type="object">
  Optionales Objekt für benutzerdefinierte, skillspezifische Konfigurationsfelder.
</ParamField>

<ParamField path="allowBundled" type="string[]">
  Optionale Positivliste ausschließlich für **mitgelieferte** Skills. Wenn sie festgelegt ist, sind nur die
  in der Liste enthaltenen mitgelieferten Skills zulässig. Verwaltete und Workspace-Skills sind davon nicht betroffen.
</ParamField>

<Note>
  Konfigurationsschlüssel entsprechen standardmäßig dem **Skill-Namen**. Wenn ein Skill
  `metadata.openclaw.skillKey` definiert, verwenden Sie stattdessen diesen Schlüssel unter `skills.entries`.
  Setzen Sie Namen mit Bindestrichen in Anführungszeichen: JSON5 erlaubt Schlüssel in Anführungszeichen.
</Note>

## Injektion von Umgebungsvariablen

Wenn eine Agentenausführung beginnt, führt OpenClaw folgende Schritte aus:

<Steps>
  <Step title="Skill-Metadaten lesen">
    OpenClaw ermittelt die effektive Skill-Liste für den Agenten und wendet dabei Zugriffsregeln,
    Positivlisten und Konfigurationsüberschreibungen an.
  </Step>
  <Step title="Umgebungsvariablen und API-Schlüssel injizieren">
    `skills.entries.<key>.env` und `skills.entries.<key>.apiKey` werden für die Dauer der
    Ausführung auf `process.env` angewendet.
  </Step>
  <Step title="System-Prompt erstellen">
    Zulässige Skills werden in einem kompakten XML-Block zusammengefasst und in den
    System-Prompt injiziert.
  </Step>
  <Step title="Umgebung wiederherstellen">
    Nach dem Ende der Ausführung wird die ursprüngliche Umgebung wiederhergestellt.
  </Step>
</Steps>

<Warning>
  Die Injektion von Umgebungsvariablen gilt für die Agentenausführung auf dem **Host**, nicht für die Sandbox. Innerhalb einer
  Sandbox haben `env` und `apiKey` keine Wirkung. Unter
  [Skills-Konfiguration](/de/tools/skills-config#sandboxed-skills-and-env-vars) erfahren Sie, wie
  Secrets an Ausführungen in einer Sandbox übergeben werden.
</Warning>

Für das mitgelieferte `claude-cli`-Backend materialisiert OpenClaw außerdem denselben
Snapshot der zulässigen Skills als temporäres Claude-Code-Plugin und übergibt ihn über
`--plugin-dir`. Andere CLI-Backends verwenden nur den Prompt-Katalog.

## Snapshots und Aktualisierung

OpenClaw erstellt **beim Start einer Sitzung** einen Snapshot der zulässigen Skills und verwendet diese
Liste für alle nachfolgenden Interaktionen der Sitzung wieder. Änderungen an Skills oder der Konfiguration werden
in der nächsten neuen Sitzung wirksam.

Skills werden während einer Sitzung in zwei Fällen aktualisiert:

- Die Skill-Überwachung erkennt eine Änderung an `SKILL.md`.
- Eine neue zulässige Remote-Node stellt eine Verbindung her.

Die aktualisierte Liste wird bei der nächsten Agenteninteraktion übernommen. Wenn sich die effektive
Positivliste des Agenten ändert, aktualisiert OpenClaw den Snapshot, damit die sichtbaren Skills
übereinstimmen.

<AccordionGroup>
  <Accordion title="Skill-Überwachung">
    Standardmäßig überwacht OpenClaw Skill-Ordner und aktualisiert den Snapshot, wenn sich
    `SKILL.md`-Dateien ändern. Konfigurieren Sie dies unter `skills.load`:

    ```json5
    {
      skills: {
        load: {
          extraDirs: ["~/Projects/agent-scripts/skills"],
          allowSymlinkTargets: ["~/Projects/manager/skills"],
          watch: true, // Standard
        },
      },
    }
    ```

    Überwachungsereignisse verwenden eine integrierte Entprellzeit von 250 ms. Verwenden Sie `allowSymlinkTargets`
    für bewusst über symbolische Links verknüpfte Strukturen, bei denen ein symbolischer Link des Skill-
    Stammverzeichnisses außerhalb des konfigurierten Stammverzeichnisses liegt, beispielsweise
    `<workspace>/skills/manager -> ~/Projects/manager/skills`.
    Aktivieren Sie `skills.workshop.allowSymlinkTargetWrites` nur, wenn Skill Workshop
    Vorschläge auch über diese vertrauenswürdigen, symbolisch verknüpften Pfade anwenden soll.

  </Accordion>
  <Accordion title="Remote-macOS-Nodes (Linux-Gateway)">
    Wenn das Gateway unter Linux ausgeführt wird, aber eine **macOS-Node** verbunden ist, auf der
    `system.run` zulässig ist, kann OpenClaw reine macOS-Skills als zulässig behandeln, wenn
    die erforderlichen Binärdateien auf dieser Node vorhanden sind. Der Agent sollte diese
    Skills über das Tool `exec` mit `host=node` ausführen.

    Offline-Nodes machen reine Remote-Skills **nicht** sichtbar. Wenn eine Node nicht mehr
    auf Binärdateiabfragen antwortet, löscht OpenClaw ihre zwischengespeicherten Binärdateiübereinstimmungen.

  </Accordion>
</AccordionGroup>

## Token-Auswirkung

Wenn Skills zulässig sind, injiziert OpenClaw einen kompakten XML-Block in den System-
Prompt. Die Kosten sind deterministisch und steigen linear pro Skill:

- **Grundaufwand** (nur wenn mindestens 1 Skill zulässig ist): ein fester Block aus einleitendem
  Text und dem `<available_skills>`-Wrapper.
- **Pro Skill:** ~97 Zeichen plus die Längen Ihrer Felder `name`, `description` und `location`.
- XML-Escaping erweitert `& < > " '` zu Entitäten und fügt pro
  Vorkommen einige Zeichen hinzu.
- Bei ~4 Zeichen/Token entsprechen 97 Zeichen ≈ 24 Token pro Skill vor Berücksichtigung der Feldlängen.

Wenn der gerenderte Block das konfigurierte Prompt-Budget
(`skills.limits.maxSkillsPromptChars`) überschreiten würde, behält OpenClaw zunächst so viele Skill-
Identitäten (Name, Speicherort und Version) bei, wie in das kompakte Format
ohne Beschreibungen passen. Anschließend wird das verbleibende Budget für gekürzte Beschreibungen verwendet. Wenn kein
Budget für Beschreibungen verbleibt, werden die Beschreibungen weggelassen. Der Prompt enthält einen
Hinweis auf `openclaw skills check`, wenn eine kompakte Formatierung oder das Kürzen
der Liste erforderlich ist.

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
    So werden Slash-Befehle von Skills registriert und weitergeleitet.
  </Card>
  <Card title="ClawHub" href="/clawhub" icon="cloud">
    Skills im öffentlichen Register durchsuchen und veröffentlichen.
  </Card>
  <Card title="Plugins" href="/de/tools/plugin" icon="plug">
    Plugins können Skills zusammen mit den von ihnen dokumentierten Tools bereitstellen.
  </Card>
</CardGroup>
