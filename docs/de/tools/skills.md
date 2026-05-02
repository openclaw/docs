---
read_when:
    - Skills hinzufügen oder ändern
    - Ändern von Skill-Zugriffssteuerung, Zulassungslisten oder Laderegeln
    - Vorrang von Skills und Snapshot-Verhalten verstehen
sidebarTitle: Skills
summary: 'Skills: verwaltet vs. Workspace, Gate-Regeln, Agent-Allowlists und Konfigurationsanbindung'
title: Skills
x-i18n:
    generated_at: "2026-05-02T21:04:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 85d9a5305216abd277721a9cf46404505ac6bedcad78417e10862bf7f54591ea
    source_path: tools/skills.md
    workflow: 16
---

OpenClaw verwendet **[AgentSkills](https://agentskills.io)-kompatible** Skill-Ordner, um dem Agenten beizubringen, wie er Tools verwendet. Jeder Skill ist ein Verzeichnis, das eine `SKILL.md` mit YAML-Frontmatter und Anweisungen enthält. OpenClaw lädt gebündelte Skills plus optionale lokale Überschreibungen und filtert sie zur Ladezeit basierend auf Umgebung, Konfiguration und vorhandenen Binärdateien.

## Speicherorte und Vorrang

OpenClaw lädt Skills aus diesen Quellen, **höchster Vorrang zuerst**:

| #   | Quelle                  | Pfad                             |
| --- | ----------------------- | -------------------------------- |
| 1   | Arbeitsbereich-Skills   | `<workspace>/skills`             |
| 2   | Projekt-Agent-Skills    | `<workspace>/.agents/skills`     |
| 3   | Persönliche Agent-Skills | `~/.agents/skills`               |
| 4   | Verwaltete/lokale Skills | `~/.openclaw/skills`             |
| 5   | Gebündelte Skills       | mit der Installation ausgeliefert |
| 6   | Zusätzliche Skill-Ordner | `skills.load.extraDirs` (Konfiguration) |

Wenn ein Skill-Name kollidiert, gewinnt die Quelle mit dem höchsten Vorrang.

Das native `$CODEX_HOME/skills`-Verzeichnis der Codex CLI gehört nicht zu diesen OpenClaw-Skill-Roots. Im Codex-Harness-Modus verwenden lokale App-Server-Starts isolierte Codex-Homes pro Agent, sodass persönliche Codex-CLI-Skills nicht implizit geladen werden. Verwenden Sie `openclaw migrate codex --dry-run`, um sie zu inventarisieren, und `openclaw migrate codex`, um Skill-Verzeichnisse mit einer interaktiven Checkbox-Eingabe auszuwählen, bevor sie in den aktuellen OpenClaw-Agent-Arbeitsbereich kopiert werden. Wiederholen Sie für nicht interaktive Läufe `--skill <name>` für die exakt zu kopierenden Skills.

## Agent-spezifische und gemeinsame Skills

In **Multi-Agent**-Setups hat jeder Agent seinen eigenen Arbeitsbereich:

| Geltungsbereich          | Pfad                                        | Sichtbar für                         |
| ------------------------ | ------------------------------------------- | ------------------------------------ |
| Agent-spezifisch         | `<workspace>/skills`                        | Nur diesen Agent                     |
| Projekt-Agent            | `<workspace>/.agents/skills`                | Nur den Agent dieses Arbeitsbereichs |
| Persönlicher Agent       | `~/.agents/skills`                          | Alle Agenten auf diesem Rechner      |
| Gemeinsam verwaltet/lokal | `~/.openclaw/skills`                        | Alle Agenten auf diesem Rechner      |
| Gemeinsame Extra-Verzeichnisse | `skills.load.extraDirs` (niedrigster Vorrang) | Alle Agenten auf diesem Rechner      |

Gleicher Name an mehreren Orten → höchste Quelle gewinnt. Arbeitsbereich schlägt Projekt-Agent, schlägt persönlichen Agent, schlägt verwaltet/lokal, schlägt gebündelt, schlägt Extra-Verzeichnisse.

## Agent-Skill-Allowlists

Skill-**Speicherort** und Skill-**Sichtbarkeit** sind getrennte Steuerungen. Speicherort/Vorrang entscheidet, welche Kopie eines gleichnamigen Skills gewinnt; Agent-Allowlists entscheiden, welche Skills ein Agent tatsächlich verwenden kann.

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
  <Accordion title="Allowlist-Regeln">
    - Lassen Sie `agents.defaults.skills` weg, um standardmäßig uneingeschränkte Skills zu erlauben.
    - Lassen Sie `agents.list[].skills` weg, um `agents.defaults.skills` zu erben.
    - Setzen Sie `agents.list[].skills: []`, um keine Skills zu erlauben.
    - Eine nicht leere `agents.list[].skills`-Liste ist die **abschließende** Menge für diesen Agenten — sie wird nicht mit den Standardwerten zusammengeführt.
    - Die effektive Allowlist gilt über Prompt-Erstellung, Skill-Slash-Command-Erkennung, Sandbox-Synchronisierung und Skill-Snapshots hinweg.

  </Accordion>
</AccordionGroup>

## Plugins und Skills

Plugins können eigene Skills ausliefern, indem sie `skills`-Verzeichnisse in `openclaw.plugin.json` auflisten (Pfade relativ zum Plugin-Root). Plugin-Skills werden geladen, wenn das Plugin aktiviert ist. Das ist der richtige Ort für tool-spezifische Betriebsanleitungen, die zu lang für die Tool-Beschreibung sind, aber verfügbar sein sollten, sobald das Plugin installiert ist — zum Beispiel liefert das Browser-Plugin einen `browser-automation`-Skill für mehrstufige Browser-Steuerung aus.

Plugin-Skill-Verzeichnisse werden in denselben Pfad mit niedrigem Vorrang wie `skills.load.extraDirs` zusammengeführt, sodass ein gleichnamiger gebündelter, verwalteter, Agent- oder Arbeitsbereichs-Skill sie überschreibt. Sie können sie über `metadata.openclaw.requires.config` im Konfigurationseintrag des Plugins steuern.

Siehe [Plugins](/de/tools/plugin) für Erkennung/Konfiguration und [Tools](/de/tools) für die Tool-Oberfläche, die diese Skills vermitteln.

## Skill Workshop

Das optionale, experimentelle **Skill Workshop**-Plugin kann Arbeitsbereichs-Skills aus wiederverwendbaren Verfahren erstellen oder aktualisieren, die während der Agent-Arbeit beobachtet wurden. Es ist standardmäßig deaktiviert und muss explizit über `plugins.entries.skill-workshop` aktiviert werden.

Skill Workshop schreibt nur nach `<workspace>/skills`, scannt generierte Inhalte, unterstützt ausstehende Genehmigung oder automatische sichere Schreibvorgänge, stellt unsichere Vorschläge unter Quarantäne und aktualisiert den Skill-Snapshot nach erfolgreichen Schreibvorgängen, damit neue Skills ohne Gateway-Neustart verfügbar werden.

Verwenden Sie es für Korrekturen wie _„nächstes Mal GIF-Attribution prüfen“_ oder hart erarbeitete Workflows wie Medien-QA-Checklisten. Beginnen Sie mit ausstehender Genehmigung; verwenden Sie automatische Schreibvorgänge nur in vertrauenswürdigen Arbeitsbereichen, nachdem Sie die Vorschläge geprüft haben. Vollständige Anleitung: [Skill Workshop-Plugin](/de/plugins/skill-workshop).

## ClawHub (Installation und Synchronisierung)

[ClawHub](https://clawhub.ai) ist die öffentliche Skills-Registry für OpenClaw. Verwenden Sie native `openclaw skills`-Befehle für Erkennung/Installation/Aktualisierung oder die separate `clawhub` CLI für Veröffentlichungs-/Synchronisierungs-Workflows. Vollständige Anleitung: [ClawHub](/de/tools/clawhub).

| Aktion                                      | Befehl                                |
| ------------------------------------------- | ------------------------------------- |
| Einen Skill im Arbeitsbereich installieren  | `openclaw skills install <skill-slug>` |
| Alle installierten Skills aktualisieren     | `openclaw skills update --all`        |
| Synchronisieren (scannen + Updates veröffentlichen) | `clawhub sync --all`                  |

Das native `openclaw skills install` installiert in das `skills/`-Verzeichnis des aktiven Arbeitsbereichs. Die separate `clawhub` CLI installiert ebenfalls in `./skills` unter Ihrem aktuellen Arbeitsverzeichnis (oder fällt auf den konfigurierten OpenClaw-Arbeitsbereich zurück). OpenClaw erkennt dies in der nächsten Sitzung als `<workspace>/skills`.
Konfigurierte Skill-Roots unterstützen außerdem eine Gruppierungsebene, etwa `skills/<group>/<skill>/SKILL.md`, sodass verwandte Drittanbieter-Skills unter einem gemeinsamen Ordner gehalten werden können, ohne breit rekursiv zu scannen.

ClawHub-Skill-Seiten zeigen vor der Installation den neuesten Status des Sicherheitsscans mit Scanner-Detailseiten für VirusTotal, ClawScan und statische Analyse. `openclaw skills install <slug>` bleibt nur der Installationspfad; Publisher beheben False Positives über das ClawHub-Dashboard oder `clawhub skill rescan <slug>`.

## Sicherheit

<Warning>
Behandeln Sie Drittanbieter-Skills als **nicht vertrauenswürdigen Code**. Lesen Sie sie, bevor Sie sie aktivieren. Bevorzugen Sie Sandbox-Läufe für nicht vertrauenswürdige Eingaben und riskante Tools. Siehe [Sandboxing](/de/gateway/sandboxing) für die agentenseitigen Steuerungen.
</Warning>

- Die Skill-Erkennung für Arbeitsbereichs- und Extra-Verzeichnisse akzeptiert nur Skill-Roots und `SKILL.md`-Dateien, deren aufgelöster Realpath innerhalb des konfigurierten Roots bleibt.
- Gateway-gestützte Installationen von Skill-Abhängigkeiten (`skills.install`, Onboarding und die Skills-Einstellungen-UI) führen den integrierten Dangerous-Code-Scanner aus, bevor Installationsmetadaten ausgeführt werden. `critical`-Befunde blockieren standardmäßig, sofern der Aufrufer nicht explizit die Dangerous-Override setzt; verdächtige Befunde warnen weiterhin nur.
- `openclaw skills install <slug>` ist anders — es lädt einen ClawHub-Skill-Ordner in den Arbeitsbereich herunter und verwendet nicht den oben genannten Installationsmetadatenpfad.
- `skills.entries.*.env` und `skills.entries.*.apiKey` injizieren Secrets für diesen Agent-Turn in den **Host**-Prozess (nicht in die Sandbox). Halten Sie Secrets aus Prompts und Logs heraus.

Für ein umfassenderes Threat Model und Checklisten siehe [Sicherheit](/de/gateway/security).

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
  URL, die in der macOS Skills-UI als „Website“ angezeigt wird. Auch über `metadata.openclaw.homepage` unterstützt.
</ParamField>
<ParamField path="user-invocable" type="boolean" default="true">
  Wenn `true`, wird der Skill als Benutzer-Slash-Command bereitgestellt.
</ParamField>
<ParamField path="disable-model-invocation" type="boolean" default="false">
  Wenn `true`, hält OpenClaw die Anweisungen des Skills aus dem normalen Prompt des Agenten heraus. Der Skill ist weiterhin installiert und kann weiterhin explizit als Slash-Command ausgeführt werden, wenn `user-invocable` ebenfalls `true` ist.
</ParamField>
<ParamField path="command-dispatch" type='"tool"'>
  Wenn auf `tool` gesetzt, umgeht der Slash-Command das Modell und wird direkt an ein Tool weitergeleitet.
</ParamField>
<ParamField path="command-tool" type="string">
  Tool-Name, der aufgerufen wird, wenn `command-dispatch: tool` gesetzt ist.
</ParamField>
<ParamField path="command-arg-mode" type='"raw"' default="raw">
  Für Tool-Dispatch wird der rohe Argumentstring an das Tool weitergereicht (kein Core-Parsing). Das Tool wird mit `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }` aufgerufen.
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
  Wenn `true`, wird der Skill immer einbezogen (andere Gates werden übersprungen).
</ParamField>
<ParamField path="emoji" type="string">
  Optionales Emoji, das von der macOS Skills-UI verwendet wird.
</ParamField>
<ParamField path="homepage" type="string">
  Optionale URL, die in der macOS Skills-UI als „Website“ angezeigt wird.
</ParamField>
<ParamField path="os" type='"darwin" | "linux" | "win32"' >
  Optionale Liste von Plattformen. Wenn gesetzt, ist der Skill nur auf diesen Betriebssystemen zulässig.
</ParamField>
<ParamField path="requires.bins" type="string[]">
  Jeder Eintrag muss auf `PATH` existieren.
</ParamField>
<ParamField path="requires.anyBins" type="string[]">
  Mindestens ein Eintrag muss auf `PATH` existieren.
</ParamField>
<ParamField path="requires.env" type="string[]">
  Umgebungsvariable muss existieren oder in der Konfiguration bereitgestellt werden.
</ParamField>
<ParamField path="requires.config" type="string[]">
  Liste von `openclaw.json`-Pfaden, die truthy sein müssen.
</ParamField>
<ParamField path="primaryEnv" type="string">
  Name der Umgebungsvariable, die `skills.entries.<name>.apiKey` zugeordnet ist.
</ParamField>
<ParamField path="install" type="object[]">
  Optionale Installerspezifikationen, die von der macOS Skills-UI verwendet werden (brew/node/go/uv/download).
</ParamField>

Wenn kein `metadata.openclaw` vorhanden ist, ist der Skill immer zulässig (außer er ist in der Konfiguration deaktiviert oder für gebündelte Skills durch `skills.allowBundled` blockiert).

<Note>
Legacy-`metadata.clawdbot`-Blöcke werden weiterhin akzeptiert, wenn `metadata.openclaw` fehlt, sodass ältere installierte Skills ihre Abhängigkeits-Gates und Installer-Hinweise behalten. Neue und aktualisierte Skills sollten `metadata.openclaw` verwenden.
</Note>

### Sandbox-Hinweise

- `requires.bins` wird zur Skill-Ladezeit auf dem **Host** geprüft.
- Wenn ein Agent in einer Sandbox ausgeführt wird, muss die Binärdatei auch **innerhalb des Containers** existieren. Installieren Sie sie über `agents.defaults.sandbox.docker.setupCommand` (oder ein benutzerdefiniertes Image). `setupCommand` wird einmal ausgeführt, nachdem der Container erstellt wurde. Paketinstallationen erfordern außerdem Netzwerk-Egress, ein beschreibbares Root-FS und einen Root-Benutzer in der Sandbox.
- Beispiel: Der `summarize`-Skill (`skills/summarize/SKILL.md`) benötigt die `summarize` CLI im Sandbox-Container, um dort ausgeführt zu werden.

### Installationsspezifikationen

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
  <Accordion title="Auswahlregeln für Installer">
    - Wenn mehrere Installer aufgeführt sind, wählt das Gateway eine einzelne bevorzugte Option aus (`brew`, wenn verfügbar, andernfalls `node`).
    - Wenn alle Installer `download` sind, listet OpenClaw jeden Eintrag auf, damit Sie die verfügbaren Artefakte sehen können.
    - Installationsspezifikationen können `os: ["darwin"|"linux"|"win32"]` enthalten, um Optionen nach Plattform zu filtern.
    - Node-Installationen berücksichtigen `skills.install.nodeManager` in `openclaw.json` (Standard: npm; Optionen: npm/pnpm/yarn/bun). Dies betrifft nur Skill-Installationen; die Gateway-Laufzeit sollte weiterhin Node sein — Bun wird für WhatsApp/Telegram nicht empfohlen.
    - Die vom Gateway gestützte Installer-Auswahl ist präferenzgesteuert: Wenn Installationsspezifikationen verschiedene Arten mischen, bevorzugt OpenClaw Homebrew, wenn `skills.install.preferBrew` aktiviert ist und `brew` existiert, danach `uv`, danach den konfigurierten Node-Manager und danach weitere Fallbacks wie `go` oder `download`.
    - Wenn jede Installationsspezifikation `download` ist, zeigt OpenClaw alle Download-Optionen an, statt sie auf einen bevorzugten Installer zu reduzieren.

  </Accordion>
  <Accordion title="Details pro Installer">
    - **Go-Installationen:** Wenn `go` fehlt und `brew` verfügbar ist, installiert das Gateway zuerst Go über Homebrew und setzt `GOBIN` nach Möglichkeit auf das `bin` von Homebrew.
    - **Download-Installationen:** `url` (erforderlich), `archive` (`tar.gz` | `tar.bz2` | `zip`), `extract` (Standard: automatisch, wenn Archiv erkannt), `stripComponents`, `targetDir` (Standard: `~/.openclaw/tools/<skillKey>`).

  </Accordion>
</AccordionGroup>

## Konfigurationsüberschreibungen

Gebündelte und verwaltete Skills können unter `skills.entries` in `~/.openclaw/openclaw.json` aktiviert bzw. deaktiviert und mit Umgebungswerten versehen werden:

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
  `false` deaktiviert den Skill, selbst wenn er gebündelt oder installiert ist.
  Der gebündelte `coding-agent`-Skill ist optional: Setzen Sie
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
  Optionale Allowlist nur für **gebündelte** Skills. Wenn gesetzt, sind nur gebündelte Skills in der Liste zulässig (verwaltete Skills und Workspace-Skills bleiben unberührt).
</ParamField>

Wenn der Skill-Name Bindestriche enthält, setzen Sie den Schlüssel in Anführungszeichen (JSON5 erlaubt
Schlüssel in Anführungszeichen). Konfigurationsschlüssel entsprechen standardmäßig dem **Skill-Namen** — wenn ein Skill
`metadata.openclaw.skillKey` definiert, verwenden Sie diesen Schlüssel unter `skills.entries`.

<Note>
Für standardmäßige Bilderzeugung/-bearbeitung innerhalb von OpenClaw verwenden Sie das Kernwerkzeug
`image_generate` mit `agents.defaults.imageGenerationModel` statt
eines gebündelten Skills. Die Skill-Beispiele hier sind für benutzerdefinierte oder Drittanbieter-
Workflows gedacht. Für native Bildanalyse verwenden Sie das Werkzeug `image` mit
`agents.defaults.imageModel`. Wenn Sie `openai/*`, `google/*`,
`fal/*` oder ein anderes Provider-spezifisches Bildmodell auswählen, fügen Sie auch den
Auth-/API-Schlüssel dieses Providers hinzu.
</Note>

## Umgebungsinjektion

Wenn ein Agent-Lauf startet, führt OpenClaw Folgendes aus:

1. Skill-Metadaten lesen.
2. `skills.entries.<key>.env` und `skills.entries.<key>.apiKey` auf `process.env` anwenden.
3. Den System-Prompt mit **zulässigen** Skills erstellen.
4. Die ursprüngliche Umgebung wiederherstellen, nachdem der Lauf endet.

Die Umgebungsinjektion ist **auf den Agent-Lauf begrenzt**, nicht auf eine globale Shell-
Umgebung.

Für das gebündelte `claude-cli`-Backend materialisiert OpenClaw außerdem denselben
zulässigen Snapshot als temporäres Claude Code-Plugin und übergibt ihn mit
`--plugin-dir`. Claude Code kann dann seinen nativen Skill-Resolver verwenden, während
OpenClaw weiterhin Vorrang, Allowlists pro Agent, Gating und
`skills.entries.*`-Umgebungs-/API-Schlüssel-Injektion besitzt. Andere CLI-Backends verwenden nur den
Prompt-Katalog.

## Snapshots und Aktualisierung

OpenClaw erstellt Snapshots der zulässigen Skills **beim Start einer Sitzung** und
verwendet diese Liste für spätere Turns in derselben Sitzung wieder. Änderungen an
Skills oder Konfiguration werden in der nächsten neuen Sitzung wirksam.

Skills können sich während einer Sitzung in zwei Fällen aktualisieren:

- Der Skills-Watcher ist aktiviert.
- Ein neuer zulässiger Remote-Node erscheint.

Betrachten Sie dies als **Hot Reload**: Die aktualisierte Liste wird beim
nächsten Agent-Turn übernommen. Wenn sich die effektive Skill-Allowlist des Agents für diese
Sitzung ändert, aktualisiert OpenClaw den Snapshot, damit sichtbare Skills mit
dem aktuellen Agent ausgerichtet bleiben.

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

Wenn das Gateway auf Linux läuft, aber ein **macOS-Node** verbunden ist, für den
`system.run` erlaubt ist (Exec approvals-Sicherheit nicht auf `deny` gesetzt),
kann OpenClaw macOS-only Skills als zulässig behandeln, wenn die erforderlichen
Binärdateien auf diesem Node vorhanden sind. Der Agent sollte diese Skills
über das Werkzeug `exec` mit `host=node` ausführen.

Dies hängt davon ab, dass der Node seine Befehlsunterstützung meldet, und von einer Binärdatei-Prüfung
über `system.which` oder `system.run`. Offline-Nodes machen
Remote-only Skills **nicht** sichtbar. Wenn ein verbundener Node nicht mehr auf Binärdatei-
Prüfungen antwortet, löscht OpenClaw seine zwischengespeicherten Binärdatei-Treffer, damit Agents keine
Skills mehr sehen, die dort aktuell nicht ausgeführt werden können.

## Token-Auswirkung

Wenn Skills zulässig sind, injiziert OpenClaw eine kompakte XML-Liste verfügbarer
Skills in den System-Prompt (über `formatSkillsForPrompt` in
`pi-coding-agent`). Die Kosten sind deterministisch:

- **Basis-Overhead** (nur bei ≥1 Skill): 195 Zeichen.
- **Pro Skill:** 97 Zeichen + die Länge der XML-escaped Werte für `<name>`, `<description>` und `<location>`.

Formel (Zeichen):

```text
total = 195 + Σ (97 + len(name_escaped) + len(description_escaped) + len(location_escaped))
```

XML-Escaping erweitert `& < > " '` zu Entitäten (`&amp;`, `&lt;` usw.),
wodurch die Länge steigt. Token-Zahlen variieren je nach Modell-Tokenizer. Eine grobe
Schätzung im OpenAI-Stil liegt bei ~4 Zeichen/Token, also **97 Zeichen ≈ 24 Token** pro
Skill plus Ihre tatsächlichen Feldlängen.

## Lebenszyklus verwalteter Skills

OpenClaw liefert einen Basissatz von Skills als **gebündelte Skills** mit der
Installation aus (npm-Paket oder OpenClaw.app). `~/.openclaw/skills` ist für
lokale Überschreibungen vorgesehen — zum Beispiel, um einen Skill zu pinnen oder zu patchen, ohne
die gebündelte Kopie zu ändern. Workspace-Skills gehören den Benutzern und überschreiben
bei Namenskonflikten beide.

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
