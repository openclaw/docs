---
read_when:
    - Skills hinzufügen oder ändern
    - Skill-Gating, Allowlists oder Laderegeln ändern
    - Skill-Priorität und Snapshot-Verhalten verstehen
sidebarTitle: Skills
summary: 'Skills: verwaltet vs. Workspace, Gating-Regeln, Agent-Allowlists und Konfigurationsverdrahtung'
title: Skills
x-i18n:
    generated_at: "2026-04-26T11:41:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 19fd880e88051db9d4d9090a64123a2dc5a16a6211fa46879ddecaa86f25149c
    source_path: tools/skills.md
    workflow: 15
---

OpenClaw verwendet mit **[AgentSkills](https://agentskills.io) kompatible**
Skill-Ordner, um dem Agenten beizubringen, wie Tools verwendet werden. Jeder Skill ist ein Verzeichnis,
das eine `SKILL.md` mit YAML-Frontmatter und Anweisungen enthält. OpenClaw
lädt gebündelte Skills plus optionale lokale Overrides und filtert sie
beim Laden basierend auf Umgebung, Konfiguration und Binärdateipräsenz.

## Speicherorte und Priorität

OpenClaw lädt Skills aus diesen Quellen, **höchste Priorität zuerst**:

| #   | Quelle                | Pfad                             |
| --- | --------------------- | -------------------------------- |
| 1   | Workspace-Skills      | `<workspace>/skills`             |
| 2   | Projekt-Agent-Skills  | `<workspace>/.agents/skills`     |
| 3   | Persönliche Agent-Skills | `~/.agents/skills`            |
| 4   | Verwaltete/lokale Skills | `~/.openclaw/skills`          |
| 5   | Gebündelte Skills     | mit der Installation ausgeliefert |
| 6   | Zusätzliche Skill-Ordner | `skills.load.extraDirs` (Konfiguration) |

Wenn ein Skill-Name kollidiert, gewinnt die höchste Quelle.

## Pro-Agent- vs. gemeinsame Skills

In Setups mit **mehreren Agenten** hat jeder Agent seinen eigenen Workspace:

| Bereich              | Pfad                                        | Sichtbar für                |
| -------------------- | ------------------------------------------- | --------------------------- |
| Pro-Agent            | `<workspace>/skills`                        | Nur für diesen Agenten      |
| Projekt-Agent        | `<workspace>/.agents/skills`                | Nur für den Agenten dieses Workspace |
| Persönlicher Agent   | `~/.agents/skills`                          | Alle Agenten auf diesem Rechner |
| Gemeinsam verwaltet/lokal | `~/.openclaw/skills`                   | Alle Agenten auf diesem Rechner |
| Gemeinsame Extra-Verzeichnisse | `skills.load.extraDirs` (niedrigste Priorität) | Alle Agenten auf diesem Rechner |

Gleicher Name an mehreren Orten → höchste Quelle gewinnt. Workspace schlägt
Projekt-Agent, schlägt persönlicher Agent, schlägt verwaltet/lokal, schlägt gebündelt,
schlägt Extra-Verzeichnisse.

## Agenten-Skill-Allowlists

Skill-**Speicherort** und Skill-**Sichtbarkeit** sind separate Steuerungen.
Speicherort/Priorität entscheidet, welche Kopie eines gleichnamigen Skills gewinnt; Agenten-
Allowlists entscheiden, welche Skills ein Agent tatsächlich verwenden kann.

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"],
    },
    list: [
      { id: "writer" }, // erbt github, weather
      { id: "docs", skills: ["docs-search"] }, // ersetzt defaults
      { id: "locked-down", skills: [] }, // keine Skills
    ],
  },
}
```

<AccordionGroup>
  <Accordion title="Allowlist-Regeln">
    - Lassen Sie `agents.defaults.skills` weg, wenn Skills standardmäßig nicht eingeschränkt sein sollen.
    - Lassen Sie `agents.list[].skills` weg, um `agents.defaults.skills` zu erben.
    - Setzen Sie `agents.list[].skills: []` für keine Skills.
    - Eine nicht leere Liste `agents.list[].skills` ist die **endgültige** Menge für diesen
      Agenten — sie wird nicht mit den Defaults zusammengeführt.
    - Die effektive Allowlist gilt für Prompt-Erstellung, Entdeckung von Skill-
      Slash-Befehlen, Sandbox-Sync und Skill-Snapshots.
  </Accordion>
</AccordionGroup>

## Plugins und Skills

Plugins können ihre eigenen Skills ausliefern, indem sie Verzeichnisse `skills` in
`openclaw.plugin.json` auflisten (Pfade relativ zum Plugin-Stamm). Plugin-Skills
werden geladen, wenn das Plugin aktiviert ist. Das ist der richtige Ort für tool-spezifische
Anleitungen zur Bedienung, die für die Tool-Beschreibung zu lang sind, aber
verfügbar sein sollen, sobald das Plugin installiert ist — zum Beispiel liefert das Browser-
Plugin einen Skill `browser-automation` für mehrstufige Browsersteuerung aus.

Plugin-Skill-Verzeichnisse werden in denselben Pfad mit niedriger Priorität zusammengeführt wie
`skills.load.extraDirs`, sodass ein gleichnamiger gebündelter, verwalteter, Agenten- oder
Workspace-Skill sie überschreibt. Sie können sie über
`metadata.openclaw.requires.config` im Konfigurationseintrag des Plugins gaten.

Siehe [Plugins](/de/tools/plugin) für Erkennung/Konfiguration und [Tools](/de/tools) für
die Tool-Oberfläche, die diese Skills vermitteln.

## Skill Workshop

Das optionale, experimentelle Plugin **Skill Workshop** kann Workspace-Skills aus wiederverwendbaren Verfahren erstellen oder aktualisieren, die bei der Agentenarbeit beobachtet wurden. Es
ist standardmäßig deaktiviert und muss explizit über
`plugins.entries.skill-workshop` aktiviert werden.

Skill Workshop schreibt nur in `<workspace>/skills`, scannt generierte
Inhalte, unterstützt ausstehende Genehmigung oder automatische sichere Schreibvorgänge, stellt
unsichere Vorschläge unter Quarantäne und aktualisiert den Skill-Snapshot nach erfolgreichen
Schreibvorgängen, sodass neue Skills ohne Gateway-Neustart verfügbar werden.

Verwenden Sie es für Korrekturen wie _„nächstes Mal GIF-Zuordnung verifizieren“_ oder
mühsam erarbeitete Workflows wie Medien-QA-Checklisten. Beginnen Sie mit ausstehender
Genehmigung; verwenden Sie automatische Schreibvorgänge nur in vertrauenswürdigen Workspaces nach Prüfung
der Vorschläge. Vollständige Anleitung: [Skill-Workshop-Plugin](/de/plugins/skill-workshop).

## ClawHub (Installation und Synchronisierung)

[ClawHub](https://clawhub.ai) ist die öffentliche Skill-Registry für OpenClaw.
Verwenden Sie native `openclaw skills`-Befehle zum Entdecken/Installieren/Aktualisieren oder die
separate CLI `clawhub` für Veröffentlichen-/Synchronisierungs-Workflows. Vollständige Anleitung:
[ClawHub](/de/tools/clawhub).

| Aktion                             | Befehl                                |
| ---------------------------------- | -------------------------------------- |
| Einen Skill im Workspace installieren | `openclaw skills install <skill-slug>` |
| Alle installierten Skills aktualisieren | `openclaw skills update --all`      |
| Synchronisieren (Scannen + Updates veröffentlichen) | `clawhub sync --all`     |

Das native `openclaw skills install` installiert in das aktive Workspace-
Verzeichnis `skills/`. Die separate CLI `clawhub` installiert ebenfalls in
`./skills` unter Ihrem aktuellen Arbeitsverzeichnis (oder fällt auf den
konfigurierten OpenClaw-Workspace zurück). OpenClaw übernimmt das als
`<workspace>/skills` in der nächsten Sitzung.

## Sicherheit

<Warning>
Behandeln Sie Skills von Drittanbietern als **nicht vertrauenswürdigen Code**. Lesen Sie sie, bevor Sie sie aktivieren.
Bevorzugen Sie sandboxed Ausführungen für nicht vertrauenswürdige Eingaben und riskante Tools. Siehe
[Sandboxing](/de/gateway/sandboxing) für die agentseitigen Steuerelemente.
</Warning>

- Die Erkennung von Workspace- und Extra-Verzeichnis-Skills akzeptiert nur Skill-Wurzeln und `SKILL.md`-Dateien, deren aufgelöster Realpath innerhalb der konfigurierten Wurzel bleibt.
- Gateway-gestützte Installationen von Skill-Abhängigkeiten (`skills.install`, Onboarding und die Settings-UI für Skills) führen den integrierten Scanner für gefährlichen Code aus, bevor Installer-Metadaten ausgeführt werden. Befunde der Stufe `critical` blockieren standardmäßig, es sei denn, der Aufrufer setzt explizit das gefährliche Override; verdächtige Befunde führen weiterhin nur zu Warnungen.
- `openclaw skills install <slug>` ist anders — es lädt einen ClawHub-Skill-Ordner in den Workspace herunter und verwendet nicht den obigen Pfad für Installer-Metadaten.
- `skills.entries.*.env` und `skills.entries.*.apiKey` injizieren Geheimnisse in den **Host**-Prozess für diesen Agenten-Turn (nicht in die Sandbox). Halten Sie Geheimnisse aus Prompts und Logs fern.

Für ein breiteres Bedrohungsmodell und Checklisten siehe [Sicherheit](/de/gateway/security).

## Format von `SKILL.md`

`SKILL.md` muss mindestens Folgendes enthalten:

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---
```

OpenClaw folgt der AgentSkills-Spezifikation für Layout/Absicht. Der Parser, der
vom eingebetteten Agenten verwendet wird, unterstützt nur **einzeilige** Frontmatter-Schlüssel;
`metadata` sollte ein **einzeiliges JSON-Objekt** sein. Verwenden Sie `{baseDir}` in
Anweisungen, um auf den Skill-Ordnerpfad zu verweisen.

### Optionale Frontmatter-Schlüssel

<ParamField path="homepage" type="string">
  URL, die in der macOS-Skills-UI als „Website“ angezeigt wird. Wird auch über `metadata.openclaw.homepage` unterstützt.
</ParamField>
<ParamField path="user-invocable" type="boolean" default="true">
  Wenn `true`, wird der Skill als Benutzer-Slash-Befehl bereitgestellt.
</ParamField>
<ParamField path="disable-model-invocation" type="boolean" default="false">
  Wenn `true`, wird der Skill aus dem Modell-Prompt ausgeschlossen (weiterhin per Benutzeraufruf verfügbar).
</ParamField>
<ParamField path="command-dispatch" type='"tool"'>
  Wenn auf `tool` gesetzt, umgeht der Slash-Befehl das Modell und wird direkt an ein Tool dispatcht.
</ParamField>
<ParamField path="command-tool" type="string">
  Name des Tools, das aufgerufen wird, wenn `command-dispatch: tool` gesetzt ist.
</ParamField>
<ParamField path="command-arg-mode" type='"raw"' default="raw">
  Bei Tool-Dispatch wird die rohe Argumentzeichenfolge an das Tool weitergeleitet (kein Core-Parsing). Das Tool wird mit `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }` aufgerufen.
</ParamField>

## Gating (Filter beim Laden)

OpenClaw filtert Skills beim Laden mithilfe von `metadata` (einzeiliges JSON):

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

Felder unter `metadata.openclaw`:

<ParamField path="always" type="boolean">
  Wenn `true`, den Skill immer einschließen (andere Gates überspringen).
</ParamField>
<ParamField path="emoji" type="string">
  Optionales Emoji, das von der macOS-Skills-UI verwendet wird.
</ParamField>
<ParamField path="homepage" type="string">
  Optionale URL, die in der macOS-Skills-UI als „Website“ angezeigt wird.
</ParamField>
<ParamField path="os" type='"darwin" | "linux" | "win32"' >
  Optionale Liste von Plattformen. Wenn gesetzt, ist der Skill nur auf diesen Betriebssystemen zulässig.
</ParamField>
<ParamField path="requires.bins" type="string[]">
  Jedes muss auf `PATH` existieren.
</ParamField>
<ParamField path="requires.anyBins" type="string[]">
  Mindestens eines muss auf `PATH` existieren.
</ParamField>
<ParamField path="requires.env" type="string[]">
  Umgebungsvariable muss existieren oder in der Konfiguration bereitgestellt werden.
</ParamField>
<ParamField path="requires.config" type="string[]">
  Liste von `openclaw.json`-Pfaden, die truthy sein müssen.
</ParamField>
<ParamField path="primaryEnv" type="string">
  Name der Umgebungsvariable, die mit `skills.entries.<name>.apiKey` verknüpft ist.
</ParamField>
<ParamField path="install" type="object[]">
  Optionale Installer-Spezifikationen, die von der macOS-Skills-UI verwendet werden (brew/node/go/uv/download).
</ParamField>

Wenn kein `metadata.openclaw` vorhanden ist, ist der Skill immer zulässig (sofern
er nicht in der Konfiguration deaktiviert oder bei gebündelten Skills durch `skills.allowBundled` blockiert ist).

<Note>
Legacy-Blöcke `metadata.clawdbot` werden weiterhin akzeptiert, wenn
`metadata.openclaw` fehlt, sodass ältere installierte Skills ihre
Abhängigkeits-Gates und Installer-Hinweise behalten. Neue und aktualisierte Skills sollten
`metadata.openclaw` verwenden.
</Note>

### Hinweise zum Sandboxing

- `requires.bins` wird beim Laden des Skills auf dem **Host** geprüft.
- Wenn ein Agent sandboxed ist, muss die Binärdatei auch **im Container** existieren. Installieren Sie sie über `agents.defaults.sandbox.docker.setupCommand` (oder ein benutzerdefiniertes Image). `setupCommand` läuft einmal nach der Erstellung des Containers. Paketinstallationen erfordern außerdem Netzwerk-Egress, ein beschreibbares Root-FS und einen Root-Benutzer in der Sandbox.
- Beispiel: Der Skill `summarize` (`skills/summarize/SKILL.md`) benötigt die CLI `summarize` im Sandbox-Container, um dort zu laufen.

### Installer-Spezifikationen

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
  <Accordion title="Regeln zur Installer-Auswahl">
    - Wenn mehrere Installer aufgelistet sind, wählt das Gateway eine einzelne bevorzugte Option aus (Homebrew, wenn verfügbar, andernfalls node).
    - Wenn alle Installer `download` sind, listet OpenClaw jeden Eintrag auf, damit Sie die verfügbaren Artefakte sehen können.
    - Installer-Spezifikationen können `os: ["darwin"|"linux"|"win32"]` enthalten, um Optionen nach Plattform zu filtern.
    - Node-Installationen berücksichtigen `skills.install.nodeManager` in `openclaw.json` (Standard: npm; Optionen: npm/pnpm/yarn/bun). Dies betrifft nur Skill-Installationen; die Gateway-Laufzeit sollte weiterhin Node sein — Bun wird für WhatsApp/Telegram nicht empfohlen.
    - Die Gateway-gestützte Installer-Auswahl ist präferenzgesteuert: Wenn Installer-Spezifikationen verschiedene Typen mischen, bevorzugt OpenClaw Homebrew, wenn `skills.install.preferBrew` aktiviert ist und `brew` existiert, dann `uv`, dann den konfigurierten Node-Manager und danach andere Fallbacks wie `go` oder `download`.
    - Wenn jede Installer-Spezifikation `download` ist, zeigt OpenClaw alle Download-Optionen an, statt auf einen bevorzugten Installer zu reduzieren.

  </Accordion>
  <Accordion title="Details pro Installer">
    - **Go-Installationen:** Wenn `go` fehlt und `brew` verfügbar ist, installiert das Gateway zuerst Go über Homebrew und setzt `GOBIN` wenn möglich auf Homebrews `bin`.
    - **Download-Installationen:** `url` (erforderlich), `archive` (`tar.gz` | `tar.bz2` | `zip`), `extract` (Standard: automatisch, wenn ein Archiv erkannt wird), `stripComponents`, `targetDir` (Standard: `~/.openclaw/tools/<skillKey>`).

  </Accordion>
</AccordionGroup>

## Konfigurations-Overrides

Gebündelte und verwaltete Skills können unter `skills.entries` in
`~/.openclaw/openclaw.json` umgeschaltet und mit Umgebungswerten versorgt werden:

```json5
{
  skills: {
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // oder Klartext-String
        env: {
          GEMINI_API_KEY: "GEMINI_KEY_HERE",
        },
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
  `false` deaktiviert den Skill, auch wenn er gebündelt oder installiert ist.
</ParamField>
<ParamField path="apiKey" type='string | { source, provider, id }'>
  Komfortfunktion für Skills, die `metadata.openclaw.primaryEnv` deklarieren. Unterstützt Klartext oder SecretRef.
</ParamField>
<ParamField path="env" type="Record<string, string>">
  Wird nur injiziert, wenn die Variable im Prozess noch nicht gesetzt ist.
</ParamField>
<ParamField path="config" type="object">
  Optionaler Container für benutzerdefinierte Felder pro Skill. Benutzerdefinierte Schlüssel müssen hier liegen.
</ParamField>
<ParamField path="allowBundled" type="string[]">
  Optionale Allowlist nur für **gebündelte** Skills. Wenn gesetzt, sind nur gebündelte Skills in der Liste zulässig (verwaltete/Workspace-Skills sind nicht betroffen).
</ParamField>

Wenn der Skill-Name Bindestriche enthält, setzen Sie den Schlüssel in Anführungszeichen (JSON5 erlaubt
Schlüssel in Anführungszeichen). Konfigurationsschlüssel entsprechen standardmäßig dem **Skill-Namen** — wenn ein Skill
`metadata.openclaw.skillKey` definiert, verwenden Sie diesen Schlüssel unter `skills.entries`.

<Note>
Für die standardmäßige Bildgenerierung/-bearbeitung in OpenClaw verwenden Sie das Core-
Tool `image_generate` mit `agents.defaults.imageGenerationModel` statt
eines gebündelten Skills. Skill-Beispiele hier sind für benutzerdefinierte oder Drittanbieter-
Workflows. Für native Bildanalyse verwenden Sie das Tool `image` mit
`agents.defaults.imageModel`. Wenn Sie `openai/*`, `google/*`,
`fal/*` oder ein anderes anbieterspezifisches Bildmodell wählen, fügen Sie auch
dessen Authentifizierung/API-Schlüssel hinzu.
</Note>

## Umgebungsinjektion

Wenn eine Agenten-Ausführung startet, führt OpenClaw Folgendes aus:

1. Liest die Skill-Metadaten.
2. Wendet `skills.entries.<key>.env` und `skills.entries.<key>.apiKey` auf `process.env` an.
3. Erstellt den System-Prompt mit **zulässigen** Skills.
4. Stellt die ursprüngliche Umgebung nach Ende der Ausführung wieder her.

Die Umgebungsinjektion ist **auf die Agenten-Ausführung begrenzt**, nicht auf eine globale Shell-
Umgebung.

Für das gebündelte Backend `claude-cli` materialisiert OpenClaw außerdem denselben
zulässigen Snapshot als temporäres Claude-Code-Plugin und übergibt ihn mit
`--plugin-dir`. Claude Code kann dann seinen nativen Skills-Resolver verwenden, während
OpenClaw weiterhin Priorität, Allowlists pro Agent, Gating und die
Injektion von env/API-Schlüsseln über `skills.entries.*` verwaltet. Andere CLI-Backends verwenden nur
den Prompt-Katalog.

## Snapshots und Aktualisierung

OpenClaw erstellt einen Snapshot der zulässigen Skills **beim Start einer Sitzung** und
verwendet diese Liste für nachfolgende Turns in derselben Sitzung erneut. Änderungen an
Skills oder der Konfiguration werden in der nächsten neuen Sitzung wirksam.

Skills können in zwei Fällen mitten in einer Sitzung aktualisiert werden:

- Der Skills-Watcher ist aktiviert.
- Ein neuer zulässiger Remote-Node erscheint.

Denken Sie daran als **Hot Reload**: Die aktualisierte Liste wird im
nächsten Agenten-Turn übernommen. Wenn sich die effektive Skill-Allowlist des Agenten für diese
Sitzung ändert, aktualisiert OpenClaw den Snapshot, damit die sichtbaren Skills mit dem
aktuellen Agenten ausgerichtet bleiben.

### Skills-Watcher

Standardmäßig überwacht OpenClaw Skill-Ordner und erhöht den Skills-Snapshot,
wenn sich `SKILL.md`-Dateien ändern. Konfiguration unter `skills.load`:

```json5
{
  skills: {
    load: {
      watch: true,
      watchDebounceMs: 250,
    },
  },
}
```

### Remote-macOS-Nodes (Linux-Gateway)

Wenn das Gateway auf Linux läuft, aber ein **macOS-Node** verbunden ist und
`system.run` erlaubt ist (Exec-Approvals-Sicherheit nicht auf `deny` gesetzt),
kann OpenClaw reine macOS-Skills als zulässig behandeln, wenn die erforderlichen
Binärdateien auf diesem Node vorhanden sind. Der Agent sollte diese Skills
über das Tool `exec` mit `host=node` ausführen.

Dies setzt voraus, dass der Node seine Befehlsunterstützung meldet und eine Binär-
Prüfung über `system.which` oder `system.run` möglich ist. Offline-Nodes machen
ausschließlich remote verfügbare Skills **nicht** sichtbar. Wenn ein verbundener Node nicht mehr auf Binär-
Prüfungen antwortet, löscht OpenClaw seine gecachten Binär-Treffer, sodass Agenten keine
Skills mehr sehen, die derzeit nicht ausgeführt werden können.

## Token-Auswirkung

Wenn Skills zulässig sind, injiziert OpenClaw eine kompakte XML-Liste der verfügbaren
Skills in den System-Prompt (über `formatSkillsForPrompt` in
`pi-coding-agent`). Die Kosten sind deterministisch:

- **Basis-Overhead** (nur wenn ≥1 Skill): 195 Zeichen.
- **Pro Skill:** 97 Zeichen + die Länge der XML-escaped Werte von `<name>`, `<description>` und `<location>`.

Formel (Zeichen):

```text
total = 195 + Σ (97 + len(name_escaped) + len(description_escaped) + len(location_escaped))
```

XML-Escaping erweitert `& < > " '` zu Entities (`&amp;`, `&lt;` usw.),
wodurch sich die Länge erhöht. Die Token-Anzahl variiert je nach Modell-Tokenizer. Eine grobe
Schätzung im OpenAI-Stil ist ~4 Zeichen/Token, also **97 Zeichen ≈ 24 Tokens** pro
Skill plus Ihre tatsächlichen Feldlängen.

## Lebenszyklus verwalteter Skills

OpenClaw liefert eine Basismenge von Skills als **gebündelte Skills** mit der
Installation aus (npm-Paket oder OpenClaw.app). `~/.openclaw/skills` ist für
lokale Overrides gedacht — zum Beispiel zum Anheften oder Patchen eines Skills, ohne
die gebündelte Kopie zu ändern. Workspace-Skills gehören dem Nutzer und überschreiben
beide bei Namenskonflikten.

## Auf der Suche nach weiteren Skills?

Stöbern Sie auf [https://clawhub.ai](https://clawhub.ai). Vollständiges Konfigurations-
schema: [Skills-Konfiguration](/de/tools/skills-config).

## Verwandte Themen

- [ClawHub](/de/tools/clawhub) — öffentliche Skill-Registry
- [Skills erstellen](/de/tools/creating-skills) — benutzerdefinierte Skills entwickeln
- [Plugins](/de/tools/plugin) — Überblick über das Plugin-System
- [Skill-Workshop-Plugin](/de/plugins/skill-workshop) — Skills aus Agentenarbeit generieren
- [Skills-Konfiguration](/de/tools/skills-config) — Referenz zur Skill-Konfiguration
- [Slash-Befehle](/de/tools/slash-commands) — alle verfügbaren Slash-Befehle
