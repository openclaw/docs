---
read_when:
    - Skills hinzufügen oder ändern
    - Skill-Gating, Allowlisten oder Laderegeln ändern
    - Skill-Priorität und Snapshot-Verhalten verstehen
sidebarTitle: Skills
summary: 'Skills: verwaltet vs. Arbeitsbereich, Gate-Regeln, Allowlists für Agenten und Konfigurationsanbindung'
title: Skills
x-i18n:
    generated_at: "2026-04-30T07:19:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: f744f5e961f872cae02aa0ed77e0bbba35e4715f5762ac45ce190b74b2fd8c5e
    source_path: tools/skills.md
    workflow: 16
---

OpenClaw verwendet **[AgentSkills](https://agentskills.io)-kompatible** Skill-Ordner, um dem Agenten die Verwendung von Tools beizubringen. Jeder Skill ist ein Verzeichnis, das eine `SKILL.md` mit YAML-Frontmatter und Anweisungen enthält. OpenClaw lädt gebündelte Skills plus optionale lokale Überschreibungen und filtert sie zur Ladezeit basierend auf Umgebung, Konfiguration und vorhandenen Binärdateien.

## Speicherorte und Rangfolge

OpenClaw lädt Skills aus diesen Quellen, **höchste Rangfolge zuerst**:

| #   | Quelle                  | Pfad                             |
| --- | ----------------------- | -------------------------------- |
| 1   | Arbeitsbereich-Skills   | `<workspace>/skills`             |
| 2   | Projekt-Agent-Skills    | `<workspace>/.agents/skills`     |
| 3   | Persönliche Agent-Skills | `~/.agents/skills`               |
| 4   | Verwaltete/lokale Skills | `~/.openclaw/skills`             |
| 5   | Gebündelte Skills       | mit der Installation ausgeliefert |
| 6   | Zusätzliche Skill-Ordner | `skills.load.extraDirs` (config) |

Wenn ein Skill-Name in Konflikt steht, gewinnt die Quelle mit der höchsten Rangfolge.

## Agent-spezifische vs. geteilte Skills

In **Multi-Agent**-Setups hat jeder Agent seinen eigenen Arbeitsbereich:

| Geltungsbereich        | Pfad                                        | Sichtbar für                         |
| ---------------------- | ------------------------------------------- | ------------------------------------ |
| Agent-spezifisch       | `<workspace>/skills`                        | Nur diesen Agenten                   |
| Projekt-Agent          | `<workspace>/.agents/skills`                | Nur den Agenten dieses Arbeitsbereichs |
| Persönlicher Agent     | `~/.agents/skills`                          | Alle Agenten auf dieser Maschine     |
| Gemeinsam verwaltet/lokal | `~/.openclaw/skills`                     | Alle Agenten auf dieser Maschine     |
| Gemeinsame Zusatzverzeichnisse | `skills.load.extraDirs` (niedrigste Rangfolge) | Alle Agenten auf dieser Maschine |

Gleicher Name an mehreren Orten → die Quelle mit der höchsten Rangfolge gewinnt. Arbeitsbereich schlägt Projekt-Agent, schlägt persönlichen Agenten, schlägt verwaltet/lokal, schlägt gebündelt, schlägt Zusatzverzeichnisse.

## Agent-Skill-Zulassungslisten

Skill-**Speicherort** und Skill-**Sichtbarkeit** sind getrennte Steuerungen. Speicherort/Rangfolge entscheidet, welche Kopie eines gleichnamigen Skills gewinnt; Agent-Zulassungslisten entscheiden, welche Skills ein Agent tatsächlich verwenden kann.

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
  <Accordion title="Regeln für Zulassungslisten">
    - Lassen Sie `agents.defaults.skills` weg, um Skills standardmäßig uneingeschränkt zuzulassen.
    - Lassen Sie `agents.list[].skills` weg, um `agents.defaults.skills` zu erben.
    - Setzen Sie `agents.list[].skills: []`, um keine Skills zuzulassen.
    - Eine nicht leere Liste `agents.list[].skills` ist die **endgültige** Menge für diesen Agenten — sie wird nicht mit Defaults zusammengeführt.
    - Die effektive Zulassungsliste gilt für Prompt-Erstellung, Skill-Slash-Befehl-Erkennung, Sandbox-Synchronisierung und Skill-Snapshots.
  </Accordion>
</AccordionGroup>

## Plugins und Skills

Plugins können eigene Skills mitliefern, indem sie `skills`-Verzeichnisse in `openclaw.plugin.json` auflisten (Pfade relativ zum Plugin-Stammverzeichnis). Plugin-Skills werden geladen, wenn das Plugin aktiviert ist. Dies ist der richtige Ort für Tool-spezifische Bedienungsanleitungen, die zu lang für die Tool-Beschreibung sind, aber verfügbar sein sollten, sobald das Plugin installiert ist — zum Beispiel liefert das Browser-Plugin einen `browser-automation`-Skill für mehrstufige Browsersteuerung mit.

Plugin-Skill-Verzeichnisse werden in denselben Pfad mit niedriger Rangfolge wie `skills.load.extraDirs` zusammengeführt, daher überschreibt ein gleichnamiger gebündelter, verwalteter, Agent- oder Arbeitsbereich-Skill sie. Sie können sie über `metadata.openclaw.requires.config` im Konfigurationseintrag des Plugins steuern.

Siehe [Plugins](/de/tools/plugin) für Erkennung/Konfiguration und [Tools](/de/tools) für die Tool-Oberfläche, die diese Skills vermitteln.

## Skill Workshop

Das optionale, experimentelle **Skill Workshop**-Plugin kann Arbeitsbereich-Skills aus wiederverwendbaren Verfahren erstellen oder aktualisieren, die während der Agent-Arbeit beobachtet wurden. Es ist standardmäßig deaktiviert und muss explizit über `plugins.entries.skill-workshop` aktiviert werden.

Skill Workshop schreibt nur nach `<workspace>/skills`, scannt generierte Inhalte, unterstützt ausstehende Genehmigung oder automatische sichere Schreibvorgänge, stellt unsichere Vorschläge unter Quarantäne und aktualisiert den Skill-Snapshot nach erfolgreichen Schreibvorgängen, damit neue Skills ohne Gateway-Neustart verfügbar werden.

Verwenden Sie es für Korrekturen wie _„nächstes Mal GIF-Zuordnung prüfen“_ oder hart erarbeitete Arbeitsabläufe wie Medien-QA-Checklisten. Beginnen Sie mit ausstehender Genehmigung; verwenden Sie automatische Schreibvorgänge nur in vertrauenswürdigen Arbeitsbereichen, nachdem Sie die Vorschläge geprüft haben. Vollständige Anleitung: [Skill Workshop-Plugin](/de/plugins/skill-workshop).

## ClawHub (installieren und synchronisieren)

[ClawHub](https://clawhub.ai) ist die öffentliche Skills-Registry für OpenClaw. Verwenden Sie native `openclaw skills`-Befehle zum Entdecken/Installieren/Aktualisieren oder die separate `clawhub`-CLI für Publish-/Sync-Workflows. Vollständige Anleitung: [ClawHub](/de/tools/clawhub).

| Aktion                                      | Befehl                                |
| ------------------------------------------- | ------------------------------------- |
| Einen Skill im Arbeitsbereich installieren  | `openclaw skills install <skill-slug>` |
| Alle installierten Skills aktualisieren     | `openclaw skills update --all`        |
| Synchronisieren (scannen + Updates veröffentlichen) | `clawhub sync --all`                  |

Das native `openclaw skills install` installiert in das `skills/`-Verzeichnis des aktiven Arbeitsbereichs. Die separate `clawhub`-CLI installiert ebenfalls in `./skills` unter Ihrem aktuellen Arbeitsverzeichnis (oder greift auf den konfigurierten OpenClaw-Arbeitsbereich zurück). OpenClaw greift dies in der nächsten Sitzung als `<workspace>/skills` auf.

ClawHub-Skill-Seiten zeigen vor der Installation den neuesten Sicherheits-Scanstatus an, mit Scanner-Detailseiten für VirusTotal, ClawScan und statische Analyse. `openclaw skills install <slug>` bleibt nur der Installationspfad; Herausgeber beheben falsch positive Ergebnisse über das ClawHub-Dashboard oder `clawhub skill rescan <slug>`.

## Sicherheit

<Warning>
Behandeln Sie Drittanbieter-Skills als **nicht vertrauenswürdigen Code**. Lesen Sie sie, bevor Sie sie aktivieren. Bevorzugen Sie Sandbox-Ausführungen für nicht vertrauenswürdige Eingaben und riskante Tools. Siehe [Sandboxing](/de/gateway/sandboxing) für die agentseitigen Steuerungen.
</Warning>

- Die Skill-Erkennung in Arbeitsbereichs- und Zusatzverzeichnissen akzeptiert nur Skill-Stammverzeichnisse und `SKILL.md`-Dateien, deren aufgelöster Realpath innerhalb des konfigurierten Stammverzeichnisses bleibt.
- Gateway-gestützte Installationen von Skill-Abhängigkeiten (`skills.install`, Onboarding und die Skills-Einstellungsoberfläche) führen den eingebauten Dangerous-Code-Scanner aus, bevor Installationsmetadaten ausgeführt werden. `critical`-Funde blockieren standardmäßig, sofern der Aufrufer nicht ausdrücklich die gefährliche Überschreibung setzt; verdächtige Funde warnen weiterhin nur.
- `openclaw skills install <slug>` ist anders — es lädt einen ClawHub-Skill-Ordner in den Arbeitsbereich herunter und verwendet nicht den oben beschriebenen Installationsmetadatenpfad.
- `skills.entries.*.env` und `skills.entries.*.apiKey` injizieren Geheimnisse in den **Host**-Prozess für diesen Agent-Durchlauf (nicht in die Sandbox). Halten Sie Geheimnisse aus Prompts und Logs heraus.

Für ein umfassenderes Bedrohungsmodell und Checklisten siehe [Sicherheit](/de/gateway/security).

## SKILL.md-Format

`SKILL.md` muss mindestens Folgendes enthalten:

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---
```

OpenClaw folgt der AgentSkills-Spezifikation für Layout/Absicht. Der vom eingebetteten Agenten verwendete Parser unterstützt nur **einzeilige** Frontmatter-Schlüssel; `metadata` sollte ein **einzeiliges JSON-Objekt** sein. Verwenden Sie `{baseDir}` in Anweisungen, um auf den Pfad des Skill-Ordners zu verweisen.

### Optionale Frontmatter-Schlüssel

<ParamField path="homepage" type="string">
  URL, die in der macOS-Skills-Oberfläche als „Website“ angezeigt wird. Wird auch über `metadata.openclaw.homepage` unterstützt.
</ParamField>
<ParamField path="user-invocable" type="boolean" default="true">
  Wenn `true`, wird der Skill als Benutzer-Slash-Befehl bereitgestellt.
</ParamField>
<ParamField path="disable-model-invocation" type="boolean" default="false">
  Wenn `true`, wird der Skill vom Modell-Prompt ausgeschlossen (weiterhin per Benutzeraufruf verfügbar).
</ParamField>
<ParamField path="command-dispatch" type='"tool"'>
  Wenn auf `tool` gesetzt, umgeht der Slash-Befehl das Modell und dispatcht direkt an ein Tool.
</ParamField>
<ParamField path="command-tool" type="string">
  Tool-Name, der aufgerufen wird, wenn `command-dispatch: tool` gesetzt ist.
</ParamField>
<ParamField path="command-arg-mode" type='"raw"' default="raw">
  Für Tool-Dispatch wird die rohe Argumentzeichenfolge an das Tool weitergereicht (kein Core-Parsing). Das Tool wird mit `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }` aufgerufen.
</ParamField>

## Gating (Ladezeitfilter)

OpenClaw filtert Skills zur Ladezeit mit `metadata` (einzeiliges JSON):

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
  Optionales Emoji, das von der macOS-Skills-Oberfläche verwendet wird.
</ParamField>
<ParamField path="homepage" type="string">
  Optionale URL, die in der macOS-Skills-Oberfläche als „Website“ angezeigt wird.
</ParamField>
<ParamField path="os" type='"darwin" | "linux" | "win32"' >
  Optionale Plattformliste. Wenn gesetzt, ist der Skill nur auf diesen Betriebssystemen zulässig.
</ParamField>
<ParamField path="requires.bins" type="string[]">
  Jeder Eintrag muss auf `PATH` vorhanden sein.
</ParamField>
<ParamField path="requires.anyBins" type="string[]">
  Mindestens ein Eintrag muss auf `PATH` vorhanden sein.
</ParamField>
<ParamField path="requires.env" type="string[]">
  Env-Variable muss vorhanden sein oder in der Konfiguration bereitgestellt werden.
</ParamField>
<ParamField path="requires.config" type="string[]">
  Liste von `openclaw.json`-Pfaden, die truthy sein müssen.
</ParamField>
<ParamField path="primaryEnv" type="string">
  Name der Env-Variable, die `skills.entries.<name>.apiKey` zugeordnet ist.
</ParamField>
<ParamField path="install" type="object[]">
  Optionale Installer-Spezifikationen, die von der macOS-Skills-Oberfläche verwendet werden (brew/node/go/uv/download).
</ParamField>

Wenn kein `metadata.openclaw` vorhanden ist, ist der Skill immer zulässig (sofern er nicht in der Konfiguration deaktiviert oder durch `skills.allowBundled` für gebündelte Skills blockiert ist).

<Note>
Legacy-`metadata.clawdbot`-Blöcke werden weiterhin akzeptiert, wenn `metadata.openclaw` fehlt, sodass ältere installierte Skills ihre Abhängigkeits-Gates und Installer-Hinweise behalten. Neue und aktualisierte Skills sollten `metadata.openclaw` verwenden.
</Note>

### Sandbox-Hinweise

- `requires.bins` wird zur Skill-Ladezeit auf dem **Host** geprüft.
- Wenn ein Agent in einer Sandbox ausgeführt wird, muss die Binärdatei auch **innerhalb des Containers** vorhanden sein. Installieren Sie sie über `agents.defaults.sandbox.docker.setupCommand` (oder ein benutzerdefiniertes Image). `setupCommand` wird einmal ausgeführt, nachdem der Container erstellt wurde. Paketinstallationen benötigen außerdem Netzwerk-Egress, ein beschreibbares Root-Dateisystem und einen Root-Benutzer in der Sandbox.
- Beispiel: Der `summarize`-Skill (`skills/summarize/SKILL.md`) benötigt die `summarize`-CLI im Sandbox-Container, um dort ausgeführt zu werden.

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
  <Accordion title="Regeln für die Installer-Auswahl">
    - Wenn mehrere Installer aufgeführt sind, wählt der Gateway eine einzige bevorzugte Option aus (brew, wenn verfügbar, andernfalls node).
    - Wenn alle Installer `download` sind, listet OpenClaw jeden Eintrag auf, damit Sie die verfügbaren Artefakte sehen können.
    - Installer-Spezifikationen können `os: ["darwin"|"linux"|"win32"]` enthalten, um Optionen nach Plattform zu filtern.
    - Node-Installationen berücksichtigen `skills.install.nodeManager` in `openclaw.json` (Standard: npm; Optionen: npm/pnpm/yarn/bun). Dies betrifft nur Skill-Installationen; die Gateway-Laufzeit sollte weiterhin Node sein — Bun wird für WhatsApp/Telegram nicht empfohlen.
    - Die Gateway-gestützte Installer-Auswahl ist präferenzgesteuert: Wenn Installationsspezifikationen verschiedene Arten mischen, bevorzugt OpenClaw Homebrew, wenn `skills.install.preferBrew` aktiviert ist und `brew` existiert, dann `uv`, dann den konfigurierten Node-Manager, dann andere Fallbacks wie `go` oder `download`.
    - Wenn jede Installationsspezifikation `download` ist, zeigt OpenClaw alle Download-Optionen an, statt sie auf einen bevorzugten Installer zu reduzieren.

  </Accordion>
  <Accordion title="Details pro Installer">
    - **Go-Installationen:** Wenn `go` fehlt und `brew` verfügbar ist, installiert der Gateway zuerst Go über Homebrew und setzt `GOBIN` nach Möglichkeit auf Homebrews `bin`.
    - **Download-Installationen:** `url` (erforderlich), `archive` (`tar.gz` | `tar.bz2` | `zip`), `extract` (Standard: automatisch, wenn ein Archiv erkannt wird), `stripComponents`, `targetDir` (Standard: `~/.openclaw/tools/<skillKey>`).

  </Accordion>
</AccordionGroup>

## Konfigurationsüberschreibungen

Gebündelte und verwaltete Skills können unter `skills.entries` in
`~/.openclaw/openclaw.json` aktiviert/deaktiviert und mit Umgebungswerten versehen werden:

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
  Der gebündelte `coding-agent`-Skill ist Opt-in: Setzen Sie
  `skills.entries.coding-agent.enabled: true`, bevor Sie ihn Agents verfügbar machen,
  und stellen Sie dann sicher, dass eines von `claude`, `codex`, `opencode` oder `pi` installiert und
  für die eigene CLI authentifiziert ist.
</ParamField>
<ParamField path="apiKey" type='string | { source, provider, id }'>
  Komfortoption für Skills, die `metadata.openclaw.primaryEnv` deklarieren. Unterstützt Klartext oder SecretRef.
</ParamField>
<ParamField path="env" type="Record<string, string>">
  Wird nur injiziert, wenn die Variable im Prozess noch nicht gesetzt ist.
</ParamField>
<ParamField path="config" type="object">
  Optionaler Container für benutzerdefinierte Skill-spezifische Felder. Benutzerdefinierte Schlüssel müssen hier liegen.
</ParamField>
<ParamField path="allowBundled" type="string[]">
  Optionale Allowlist nur für **gebündelte** Skills. Wenn gesetzt, kommen nur gebündelte Skills in der Liste infrage (verwaltete/Workspace-Skills bleiben unberührt).
</ParamField>

Wenn der Skill-Name Bindestriche enthält, setzen Sie den Schlüssel in Anführungszeichen (JSON5 erlaubt
Schlüssel in Anführungszeichen). Konfigurationsschlüssel entsprechen standardmäßig dem **Skill-Namen** — wenn ein Skill
`metadata.openclaw.skillKey` definiert, verwenden Sie diesen Schlüssel unter `skills.entries`.

<Note>
Für die standardmäßige Bilderzeugung/-bearbeitung innerhalb von OpenClaw verwenden Sie das zentrale
`image_generate`-Tool mit `agents.defaults.imageGenerationModel` statt
eines gebündelten Skills. Die Skill-Beispiele hier sind für benutzerdefinierte oder Drittanbieter-
Workflows gedacht. Für native Bildanalyse verwenden Sie das `image`-Tool mit
`agents.defaults.imageModel`. Wenn Sie `openai/*`, `google/*`,
`fal/*` oder ein anderes providerspezifisches Bildmodell auswählen, fügen Sie auch den
Auth-/API-Schlüssel dieses Providers hinzu.
</Note>

## Umgebungsinjektion

Wenn ein Agent-Lauf startet, führt OpenClaw Folgendes aus:

1. Skill-Metadaten lesen.
2. `skills.entries.<key>.env` und `skills.entries.<key>.apiKey` auf `process.env` anwenden.
3. Den System-Prompt mit **berechtigten** Skills erstellen.
4. Die ursprüngliche Umgebung nach Ende des Laufs wiederherstellen.

Die Umgebungsinjektion ist **auf den Agent-Lauf beschränkt**, nicht auf eine globale Shell-
Umgebung.

Für das gebündelte `claude-cli`-Backend materialisiert OpenClaw denselben
berechtigten Snapshot zusätzlich als temporäres Claude Code-Plugin und übergibt ihn mit
`--plugin-dir`. Claude Code kann dann seinen nativen Skill-Resolver verwenden, während
OpenClaw weiterhin Vorrang, Agent-spezifische Allowlists, Gating und die
`skills.entries.*`-Injektion von Umgebungsvariablen/API-Schlüsseln steuert. Andere CLI-Backends verwenden nur den
Prompt-Katalog.

## Snapshots und Aktualisierung

OpenClaw erstellt einen Snapshot der berechtigten Skills **beim Start einer Sitzung** und
verwendet diese Liste für nachfolgende Turns in derselben Sitzung wieder. Änderungen an
Skills oder Konfiguration werden in der nächsten neuen Sitzung wirksam.

Skills können während einer Sitzung in zwei Fällen aktualisiert werden:

- Der Skills-Watcher ist aktiviert.
- Ein neuer berechtigter Remote-Node erscheint.

Betrachten Sie dies als **Hot Reload**: Die aktualisierte Liste wird beim
nächsten Agent-Turn übernommen. Wenn sich die effektive Skill-Allowlist des Agents für diese
Sitzung ändert, aktualisiert OpenClaw den Snapshot, sodass sichtbare Skills mit dem
aktuellen Agent abgeglichen bleiben.

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

Wenn der Gateway unter Linux läuft, aber ein **macOS-Node** mit erlaubtem
`system.run` verbunden ist (Exec-Approvals-Sicherheit nicht auf `deny` gesetzt),
kann OpenClaw macOS-exklusive Skills als berechtigt behandeln, wenn die erforderlichen
Binärdateien auf diesem Node vorhanden sind. Der Agent sollte diese Skills
über das `exec`-Tool mit `host=node` ausführen.

Dies hängt davon ab, dass der Node seine Befehlsunterstützung meldet, sowie von einer Binärdatei-Prüfung
über `system.which` oder `system.run`. Offline-Nodes machen **keine**
Remote-exklusiven Skills sichtbar. Wenn ein verbundener Node nicht mehr auf Binärdatei-
Prüfungen antwortet, löscht OpenClaw seine zwischengespeicherten Binärdatei-Treffer, sodass Agents keine
Skills mehr sehen, die dort aktuell nicht ausgeführt werden können.

## Token-Auswirkung

Wenn Skills berechtigt sind, injiziert OpenClaw eine kompakte XML-Liste verfügbarer
Skills in den System-Prompt (über `formatSkillsForPrompt` in
`pi-coding-agent`). Die Kosten sind deterministisch:

- **Basis-Overhead** (nur wenn ≥1 Skill): 195 Zeichen.
- **Pro Skill:** 97 Zeichen + die Länge der XML-escaped Werte für `<name>`, `<description>` und `<location>`.

Formel (Zeichen):

```text
total = 195 + Σ (97 + len(name_escaped) + len(description_escaped) + len(location_escaped))
```

XML-Escaping erweitert `& < > " '` zu Entitäten (`&amp;`, `&lt;` usw.),
was die Länge erhöht. Token-Zahlen variieren je nach Modell-Tokenizer. Eine grobe
OpenAI-ähnliche Schätzung liegt bei etwa 4 Zeichen/Token, also **97 Zeichen ≈ 24 Token** pro
Skill plus Ihre tatsächlichen Feldlängen.

## Lebenszyklus verwalteter Skills

OpenClaw liefert eine Baseline-Auswahl von Skills als **gebündelte Skills** mit der
Installation aus (npm-Paket oder OpenClaw.app). `~/.openclaw/skills` ist für
lokale Überschreibungen vorgesehen — zum Beispiel, um einen Skill zu pinnen oder zu patchen, ohne
die gebündelte Kopie zu ändern. Workspace-Skills gehören dem Benutzer und überschreiben
bei Namenskonflikten beide.

## Suchen Sie nach weiteren Skills?

Durchsuchen Sie [https://clawhub.ai](https://clawhub.ai). Vollständiges Konfigurationsschema:
[Skills-Konfiguration](/de/tools/skills-config).

## Verwandt

- [ClawHub](/de/tools/clawhub) — öffentliches Skills-Register
- [Skills erstellen](/de/tools/creating-skills) — benutzerdefinierte Skills erstellen
- [Plugins](/de/tools/plugin) — Überblick über das Plugin-System
- [Skill-Workshop-Plugin](/de/plugins/skill-workshop) — Skills aus Agent-Arbeit generieren
- [Skills-Konfiguration](/de/tools/skills-config) — Referenz zur Skill-Konfiguration
- [Slash-Befehle](/de/tools/slash-commands) — alle verfügbaren Slash-Befehle
