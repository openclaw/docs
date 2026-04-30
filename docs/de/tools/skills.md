---
read_when:
    - Skills hinzufügen oder ändern
    - Skill-Gating, Allowlists oder Laderegeln ändern
    - Skill-Priorität und Snapshot-Verhalten verstehen
sidebarTitle: Skills
summary: 'Skills: verwaltet vs. Arbeitsbereich, Gate-Regeln, Zulassungslisten für Agenten und Konfigurationsverdrahtung'
title: Skills
x-i18n:
    generated_at: "2026-04-30T20:05:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: b58d690786756bd3539940aae9f2abcb8a497798ed7b6afeb5e6d6e255fcf257
    source_path: tools/skills.md
    workflow: 16
---

OpenClaw verwendet **[AgentSkills](https://agentskills.io)-kompatible** Skill-Ordner, um dem Agenten den Umgang mit Tools beizubringen. Jeder Skill ist ein Verzeichnis, das eine `SKILL.md` mit YAML-Frontmatter und Anweisungen enthält. OpenClaw lädt gebündelte Skills sowie optionale lokale Überschreibungen und filtert sie zur Ladezeit anhand von Umgebung, Konfiguration und vorhandenen Binärdateien.

## Speicherorte und Priorität

OpenClaw lädt Skills aus diesen Quellen, **höchste Priorität zuerst**:

| #   | Quelle                    | Pfad                             |
| --- | ------------------------- | -------------------------------- |
| 1   | Workspace-Skills          | `<workspace>/skills`             |
| 2   | Projekt-Agenten-Skills    | `<workspace>/.agents/skills`     |
| 3   | Persönliche Agenten-Skills | `~/.agents/skills`               |
| 4   | Verwaltete/lokale Skills  | `~/.openclaw/skills`             |
| 5   | Gebündelte Skills         | mit der Installation ausgeliefert |
| 6   | Zusätzliche Skill-Ordner  | `skills.load.extraDirs` (Konfiguration) |

Wenn ein Skill-Name in Konflikt steht, gewinnt die Quelle mit der höchsten Priorität.

Das native Verzeichnis `$CODEX_HOME/skills` der Codex CLI gehört nicht zu diesen OpenClaw-Skill-Wurzeln. Im Codex-Harness-Modus verwenden lokale App-Server-Starts isolierte Codex-Homes pro Agent, sodass persönliche Codex-CLI-Skills nicht implizit geladen werden. Verwenden Sie `openclaw migrate codex --dry-run`, um sie zu inventarisieren, und `openclaw migrate codex`, um Skill-Verzeichnisse über eine interaktive Checkbox-Abfrage auszuwählen, bevor sie in den aktuellen OpenClaw-Agent-Workspace kopiert werden. Für nicht interaktive Ausführungen wiederholen Sie `--skill <name>` für die exakt zu kopierenden Skills.

## Agentenspezifische und gemeinsame Skills

In **Multi-Agent**-Setups hat jeder Agent seinen eigenen Workspace:

| Umfang               | Pfad                                        | Sichtbar für                  |
| -------------------- | ------------------------------------------- | ----------------------------- |
| Pro Agent            | `<workspace>/skills`                        | Nur diesen Agenten            |
| Projekt-Agent        | `<workspace>/.agents/skills`                | Nur den Agenten dieses Workspace |
| Persönlicher Agent   | `~/.agents/skills`                          | Alle Agenten auf diesem Rechner |
| Gemeinsame verwaltete/lokale Skills | `~/.openclaw/skills`          | Alle Agenten auf diesem Rechner |
| Gemeinsame zusätzliche Verzeichnisse | `skills.load.extraDirs` (niedrigste Priorität) | Alle Agenten auf diesem Rechner |

Gleicher Name an mehreren Orten → die Quelle mit der höchsten Priorität gewinnt. Workspace schlägt Projekt-Agent, schlägt persönlichen Agent, schlägt verwaltet/lokal, schlägt gebündelt, schlägt zusätzliche Verzeichnisse.

## Skill-Allowlists für Agenten

Skill-**Speicherort** und Skill-**Sichtbarkeit** sind getrennte Steuerelemente. Speicherort/Priorität entscheidet, welche Kopie eines gleich benannten Skills gewinnt; Agenten-Allowlists entscheiden, welche Skills ein Agent tatsächlich verwenden kann.

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"],
    },
    list: [
      { id: "writer" }, // inherits github, weather
      { id: "docs", skills: ["docs-search"] }, // replaces defaults
      { id: "locked-down", skills: [] }, // no skills
    ],
  },
}
```

<AccordionGroup>
  <Accordion title="Allowlist rules">
    - Lassen Sie `agents.defaults.skills` weg, um standardmäßig uneingeschränkte Skills zuzulassen.
    - Lassen Sie `agents.list[].skills` weg, um `agents.defaults.skills` zu erben.
    - Setzen Sie `agents.list[].skills: []`, um keine Skills zuzulassen.
    - Eine nicht leere Liste `agents.list[].skills` ist die **endgültige** Menge für diesen Agenten — sie wird nicht mit den Standardwerten zusammengeführt.
    - Die wirksame Allowlist gilt für Prompt-Erstellung, Skill-Slash-Command-Erkennung, Sandbox-Synchronisierung und Skill-Snapshots.

  </Accordion>
</AccordionGroup>

## Plugins und Skills

Plugins können eigene Skills mitliefern, indem sie `skills`-Verzeichnisse in `openclaw.plugin.json` auflisten (Pfade relativ zum Plugin-Stammverzeichnis). Plugin-Skills werden geladen, wenn das Plugin aktiviert ist. Dies ist der richtige Ort für toolspezifische Bedienungsleitfäden, die zu lang für die Tool-Beschreibung sind, aber verfügbar sein sollten, wann immer das Plugin installiert ist — zum Beispiel liefert das Browser-Plugin einen `browser-automation`-Skill für mehrstufige Browser-Steuerung mit.

Plugin-Skill-Verzeichnisse werden in denselben Pfad mit niedriger Priorität wie `skills.load.extraDirs` zusammengeführt, sodass ein gleich benannter gebündelter, verwalteter, Agenten- oder Workspace-Skill sie überschreibt. Sie können sie über `metadata.openclaw.requires.config` im Konfigurationseintrag des Plugins steuern.

Siehe [Plugins](/de/tools/plugin) für Erkennung/Konfiguration und [Tools](/de/tools) für die Tool-Oberfläche, die diese Skills vermitteln.

## Skill Workshop

Das optionale, experimentelle **Skill Workshop**-Plugin kann Workspace-Skills aus wiederverwendbaren Verfahren erstellen oder aktualisieren, die während der Agentenarbeit beobachtet wurden. Es ist standardmäßig deaktiviert und muss explizit über `plugins.entries.skill-workshop` aktiviert werden.

Skill Workshop schreibt nur nach `<workspace>/skills`, scannt generierte Inhalte, unterstützt ausstehende Genehmigung oder automatische sichere Schreibvorgänge, stellt unsichere Vorschläge unter Quarantäne und aktualisiert den Skill-Snapshot nach erfolgreichen Schreibvorgängen, damit neue Skills ohne Gateway-Neustart verfügbar werden.

Verwenden Sie es für Korrekturen wie _„nächstes Mal GIF-Attribution prüfen“_ oder hart erarbeitete Workflows wie QA-Checklisten für Medien. Beginnen Sie mit ausstehender Genehmigung; verwenden Sie automatische Schreibvorgänge nur in vertrauenswürdigen Workspaces, nachdem Sie die Vorschläge geprüft haben. Vollständige Anleitung: [Skill Workshop-Plugin](/de/plugins/skill-workshop).

## ClawHub (Installieren und Synchronisieren)

[ClawHub](https://clawhub.ai) ist das öffentliche Skill-Register für OpenClaw. Verwenden Sie native `openclaw skills`-Befehle zum Entdecken/Installieren/Aktualisieren oder die separate `clawhub` CLI für Veröffentlichungs-/Synchronisierungs-Workflows. Vollständige Anleitung: [ClawHub](/de/tools/clawhub).

| Aktion                             | Befehl                                |
| ---------------------------------- | ------------------------------------- |
| Einen Skill in den Workspace installieren | `openclaw skills install <skill-slug>` |
| Alle installierten Skills aktualisieren | `openclaw skills update --all`        |
| Synchronisieren (scannen + Updates veröffentlichen) | `clawhub sync --all`                  |

Das native `openclaw skills install` installiert in das aktive Workspace-Verzeichnis `skills/`. Die separate `clawhub` CLI installiert ebenfalls in `./skills` unter Ihrem aktuellen Arbeitsverzeichnis (oder fällt auf den konfigurierten OpenClaw-Workspace zurück). OpenClaw erkennt dies in der nächsten Sitzung als `<workspace>/skills`.
Konfigurierte Skill-Wurzeln unterstützen außerdem eine Gruppierungsebene, etwa `skills/<group>/<skill>/SKILL.md`, sodass verwandte Drittanbieter-Skills in einem gemeinsamen Ordner gehalten werden können, ohne breit rekursiv zu scannen.

ClawHub-Skill-Seiten zeigen vor der Installation den neuesten Sicherheits-Scan-Status an, mit Scanner-Detailseiten für VirusTotal, ClawScan und statische Analyse. `openclaw skills install <slug>` bleibt ausschließlich der Installationspfad; Herausgeber beheben False Positives über das ClawHub-Dashboard oder `clawhub skill rescan <slug>`.

## Sicherheit

<Warning>
Behandeln Sie Drittanbieter-Skills als **nicht vertrauenswürdigen Code**. Lesen Sie sie, bevor Sie sie aktivieren. Bevorzugen Sie sandboxierte Ausführungen für nicht vertrauenswürdige Eingaben und riskante Tools. Siehe [Sandboxing](/de/gateway/sandboxing) für die agentenseitigen Steuerelemente.
</Warning>

- Die Erkennung von Workspace- und Extra-Dir-Skills akzeptiert nur Skill-Wurzeln und `SKILL.md`-Dateien, deren aufgelöster Realpath innerhalb der konfigurierten Wurzel bleibt.
- Gateway-gestützte Installationen von Skill-Abhängigkeiten (`skills.install`, Onboarding und die Skills-Einstellungen-UI) führen den integrierten Scanner für gefährlichen Code aus, bevor Installer-Metadaten ausgeführt werden. `critical`-Funde blockieren standardmäßig, sofern der Aufrufer nicht explizit die gefährliche Überschreibung setzt; verdächtige Funde warnen weiterhin nur.
- `openclaw skills install <slug>` ist anders — es lädt einen ClawHub-Skill-Ordner in den Workspace herunter und verwendet nicht den oben genannten Installer-Metadaten-Pfad.
- `skills.entries.*.env` und `skills.entries.*.apiKey` injizieren Geheimnisse für diesen Agentendurchlauf in den **Host**-Prozess (nicht in die Sandbox). Halten Sie Geheimnisse aus Prompts und Logs heraus.

Für ein breiteres Bedrohungsmodell und Checklisten siehe [Sicherheit](/de/gateway/security).

## SKILL.md-Format

`SKILL.md` muss mindestens Folgendes enthalten:

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---
```

OpenClaw folgt der AgentSkills-Spezifikation für Layout/Intention. Der vom eingebetteten Agenten verwendete Parser unterstützt nur **einzeilige** Frontmatter-Schlüssel; `metadata` sollte ein **einzeiliges JSON-Objekt** sein. Verwenden Sie `{baseDir}` in Anweisungen, um auf den Pfad des Skill-Ordners zu verweisen.

### Optionale Frontmatter-Schlüssel

<ParamField path="homepage" type="string">
  URL, die in der macOS-Skills-UI als „Website“ angezeigt wird. Wird auch über `metadata.openclaw.homepage` unterstützt.
</ParamField>
<ParamField path="user-invocable" type="boolean" default="true">
  Wenn `true`, wird der Skill als Benutzer-Slash-Command bereitgestellt.
</ParamField>
<ParamField path="disable-model-invocation" type="boolean" default="false">
  Wenn `true`, wird der Skill aus dem Modell-Prompt ausgeschlossen (weiterhin über Benutzeraufruf verfügbar).
</ParamField>
<ParamField path="command-dispatch" type='"tool"'>
  Wenn auf `tool` gesetzt, umgeht der Slash-Command das Modell und dispatcht direkt an ein Tool.
</ParamField>
<ParamField path="command-tool" type="string">
  Tool-Name, der aufgerufen wird, wenn `command-dispatch: tool` gesetzt ist.
</ParamField>
<ParamField path="command-arg-mode" type='"raw"' default="raw">
  Für Tool-Dispatch wird die rohe Argumentzeichenfolge an das Tool weitergeleitet (kein Core-Parsing). Das Tool wird mit `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }` aufgerufen.
</ParamField>

## Gating (Ladezeitfilter)

OpenClaw filtert Skills zur Ladezeit mithilfe von `metadata` (einzeiliges JSON):

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
  Wenn `true`, wird der Skill immer einbezogen (andere Gates überspringen).
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
  Jeder Eintrag muss auf `PATH` vorhanden sein.
</ParamField>
<ParamField path="requires.anyBins" type="string[]">
  Mindestens ein Eintrag muss auf `PATH` vorhanden sein.
</ParamField>
<ParamField path="requires.env" type="string[]">
  Umgebungsvariable muss vorhanden sein oder in der Konfiguration bereitgestellt werden.
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

Wenn kein `metadata.openclaw` vorhanden ist, ist der Skill immer zulässig (sofern er nicht in der Konfiguration deaktiviert oder durch `skills.allowBundled` für gebündelte Skills blockiert wird).

<Note>
Legacy-`metadata.clawdbot`-Blöcke werden weiterhin akzeptiert, wenn `metadata.openclaw` fehlt, sodass ältere installierte Skills ihre Abhängigkeits-Gates und Installer-Hinweise behalten. Neue und aktualisierte Skills sollten `metadata.openclaw` verwenden.
</Note>

### Hinweise zum Sandboxing

- `requires.bins` wird zur Skill-Ladezeit auf dem **Host** geprüft.
- Wenn ein Agent sandboxiert ist, muss die Binärdatei auch **innerhalb des Containers** vorhanden sein. Installieren Sie sie über `agents.defaults.sandbox.docker.setupCommand` (oder ein benutzerdefiniertes Image). `setupCommand` wird einmal ausgeführt, nachdem der Container erstellt wurde. Paketinstallationen erfordern außerdem Netzwerk-Egress, ein beschreibbares Root-Dateisystem und einen Root-Benutzer in der Sandbox.
- Beispiel: Der `summarize`-Skill (`skills/summarize/SKILL.md`) benötigt die `summarize` CLI im Sandbox-Container, um dort ausgeführt zu werden.

### Installer-Spezifikationen

```markdown
---
name: gemini
description: Verwenden Sie Gemini CLI für Coding-Unterstützung und Google-Suchabfragen.
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
  <Accordion title="Regeln für die Installer-Auswahl">
    - Wenn mehrere Installer aufgeführt sind, wählt der Gateway eine einzelne bevorzugte Option aus (brew, wenn verfügbar, andernfalls node).
    - Wenn alle Installer `download` sind, listet OpenClaw jeden Eintrag auf, damit Sie die verfügbaren Artefakte sehen können.
    - Installer-Spezifikationen können `os: ["darwin"|"linux"|"win32"]` enthalten, um Optionen nach Plattform zu filtern.
    - Node-Installationen berücksichtigen `skills.install.nodeManager` in `openclaw.json` (Standard: npm; Optionen: npm/pnpm/yarn/bun). Dies wirkt sich nur auf Skill-Installationen aus; die Gateway-Laufzeit sollte weiterhin Node sein — Bun wird für WhatsApp/Telegram nicht empfohlen.
    - Die Gateway-gestützte Installer-Auswahl ist präferenzgesteuert: Wenn Installationsspezifikationen verschiedene Arten mischen, bevorzugt OpenClaw Homebrew, wenn `skills.install.preferBrew` aktiviert ist und `brew` vorhanden ist, dann `uv`, dann den konfigurierten Node-Manager und anschließend andere Fallbacks wie `go` oder `download`.
    - Wenn jede Installationsspezifikation `download` ist, zeigt OpenClaw alle Download-Optionen an, statt sie auf einen bevorzugten Installer zu reduzieren.

  </Accordion>
  <Accordion title="Details pro Installer">
    - **Go-Installationen:** Wenn `go` fehlt und `brew` verfügbar ist, installiert der Gateway zuerst Go über Homebrew und setzt `GOBIN` nach Möglichkeit auf das `bin` von Homebrew.
    - **Download-Installationen:** `url` (erforderlich), `archive` (`tar.gz` | `tar.bz2` | `zip`), `extract` (Standard: automatisch, wenn ein Archiv erkannt wird), `stripComponents`, `targetDir` (Standard: `~/.openclaw/tools/<skillKey>`).

  </Accordion>
</AccordionGroup>

## Konfigurationsüberschreibungen

Gebündelte und verwaltete Skills können unter `skills.entries` in
`~/.openclaw/openclaw.json` aktiviert/deaktiviert und mit env-Werten versorgt werden:

```json5
{
  skills: {
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // or plaintext string
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
  Der gebündelte `coding-agent`-Skill ist opt-in: Setzen Sie
  `skills.entries.coding-agent.enabled: true`, bevor Sie ihn Agents bereitstellen,
  und stellen Sie dann sicher, dass eines von `claude`, `codex`, `opencode` oder `pi` installiert und
  für seine eigene CLI authentifiziert ist.
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
Für Standard-Bilderzeugung/-bearbeitung innerhalb von OpenClaw verwenden Sie das Core-Tool
`image_generate` mit `agents.defaults.imageGenerationModel` statt
eines gebündelten Skills. Die Skill-Beispiele hier sind für benutzerdefinierte oder Drittanbieter-Workflows gedacht. Für native Bildanalyse verwenden Sie das Tool `image` mit
`agents.defaults.imageModel`. Wenn Sie `openai/*`, `google/*`,
`fal/*` oder ein anderes Provider-spezifisches Bildmodell wählen, fügen Sie auch den Auth-/API-Schlüssel dieses Providers hinzu.
</Note>

## Umgebungsinjektion

Wenn ein Agent-Lauf startet, führt OpenClaw Folgendes aus:

1. Skill-Metadaten lesen.
2. `skills.entries.<key>.env` und `skills.entries.<key>.apiKey` auf `process.env` anwenden.
3. Den System-Prompt mit **zulässigen** Skills erstellen.
4. Die ursprüngliche Umgebung nach Ende des Laufs wiederherstellen.

Die Umgebungsinjektion ist **auf den Agent-Lauf beschränkt**, nicht auf eine globale Shell-Umgebung.

Für das gebündelte `claude-cli`-Backend materialisiert OpenClaw außerdem denselben
zulässigen Snapshot als temporäres Claude Code-Plugin und übergibt ihn mit
`--plugin-dir`. Claude Code kann dann seinen nativen Skill-Resolver verwenden, während
OpenClaw weiterhin Vorrang, agentenspezifische Allowlists, Gating und
`skills.entries.*` env/API-Key-Injektion verwaltet. Andere CLI-Backends verwenden nur den
Prompt-Katalog.

## Snapshots und Aktualisierung

OpenClaw erstellt Snapshots der zulässigen Skills **beim Start einer Sitzung** und
verwendet diese Liste für nachfolgende Turns in derselben Sitzung erneut. Änderungen an
Skills oder Konfiguration werden in der nächsten neuen Sitzung wirksam.

Skills können in zwei Fällen während einer Sitzung aktualisiert werden:

- Der Skills-Watcher ist aktiviert.
- Ein neuer zulässiger Remote-Node erscheint.

Betrachten Sie dies als **Hot Reload**: Die aktualisierte Liste wird im
nächsten Agent-Turn übernommen. Wenn sich die effektive Skill-Allowlist des Agents für diese
Sitzung ändert, aktualisiert OpenClaw den Snapshot, damit sichtbare Skills mit dem aktuellen Agent
abgestimmt bleiben.

### Skills-Watcher

Standardmäßig überwacht OpenClaw Skill-Ordner und erhöht den Skills-Snapshot,
wenn sich `SKILL.md`-Dateien ändern. Konfigurieren Sie dies unter `skills.load`:

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

Wenn der Gateway unter Linux läuft, aber ein **macOS-Node** verbunden ist und
`system.run` erlaubt ist (Exec-Zulassungssicherheit nicht auf `deny` gesetzt),
kann OpenClaw macOS-only-Skills als zulässig behandeln, wenn die erforderlichen
Binärdateien auf diesem Node vorhanden sind. Der Agent sollte diese Skills
über das Tool `exec` mit `host=node` ausführen.

Dies hängt davon ab, dass der Node seine Befehlsunterstützung meldet und ein Bin-Probe
über `system.which` oder `system.run` erfolgt. Offline-Nodes machen
Remote-only-Skills **nicht** sichtbar. Wenn ein verbundener Node nicht mehr auf Bin-Probes
antwortet, löscht OpenClaw seine gecachten Bin-Treffer, sodass Agents keine
Skills mehr sehen, die dort derzeit nicht ausgeführt werden können.

## Token-Auswirkung

Wenn Skills zulässig sind, injiziert OpenClaw eine kompakte XML-Liste verfügbarer
Skills in den System-Prompt (über `formatSkillsForPrompt` in
`pi-coding-agent`). Die Kosten sind deterministisch:

- **Basis-Overhead** (nur bei ≥1 Skill): 195 Zeichen.
- **Pro Skill:** 97 Zeichen + die Länge der XML-escaped `<name>`-, `<description>`- und `<location>`-Werte.

Formel (Zeichen):

```text
total = 195 + Σ (97 + len(name_escaped) + len(description_escaped) + len(location_escaped))
```

XML-Escaping erweitert `& < > " '` zu Entities (`&amp;`, `&lt;` usw.),
wodurch die Länge steigt. Token-Anzahlen variieren je nach Modell-Tokenizer. Eine grobe
OpenAI-artige Schätzung liegt bei etwa ~4 Zeichen/Token, also **97 Zeichen ≈ 24 Tokens** pro
Skill plus die tatsächlichen Feldlängen.

## Lebenszyklus verwalteter Skills

OpenClaw liefert einen Basissatz von Skills als **gebündelte Skills** mit der
Installation aus (npm-Paket oder OpenClaw.app). `~/.openclaw/skills` dient für
lokale Überschreibungen — zum Beispiel zum Fixieren oder Patchen eines Skills, ohne
die gebündelte Kopie zu ändern. Workspace-Skills gehören dem Benutzer und überschreiben
beide bei Namenskonflikten.

## Suchen Sie weitere Skills?

Durchsuchen Sie [https://clawhub.ai](https://clawhub.ai). Vollständiges Konfigurationsschema:
[Skills-Konfiguration](/de/tools/skills-config).

## Verwandt

- [ClawHub](/de/tools/clawhub) — öffentliches Skills-Registry
- [Skills erstellen](/de/tools/creating-skills) — benutzerdefinierte Skills erstellen
- [Plugins](/de/tools/plugin) — Überblick über das Plugin-System
- [Skill Workshop-Plugin](/de/plugins/skill-workshop) — Skills aus Agent-Arbeit generieren
- [Skills-Konfiguration](/de/tools/skills-config) — Referenz zur Skill-Konfiguration
- [Slash-Befehle](/de/tools/slash-commands) — alle verfügbaren Slash-Befehle
