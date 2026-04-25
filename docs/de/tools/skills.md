---
read_when:
    - Skills hinzufügen oder ändern
    - Gating oder Laderegeln für Skills ändern
summary: 'Skills: verwaltet vs. Workspace, Gating-Regeln und Konfigurations-/Umgebungsvariablen-Anbindung'
title: Skills
x-i18n:
    generated_at: "2026-04-25T13:58:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 44f946d91588c878754340aaf55e0e3b9096bba12aea36fb90c445cd41e4f892
    source_path: tools/skills.md
    workflow: 15
---

OpenClaw verwendet **mit [AgentSkills](https://agentskills.io) kompatible** Skill-Ordner, um dem Agenten beizubringen, wie Tools verwendet werden. Jeder Skill ist ein Verzeichnis, das eine `SKILL.md` mit YAML-Frontmatter und Anweisungen enthält. OpenClaw lädt **gebündelte Skills** sowie optionale lokale Overrides und filtert sie beim Laden anhand von Umgebung, Konfiguration und vorhandenen Binärdateien.

## Speicherorte und Vorrang

OpenClaw lädt Skills aus diesen Quellen:

1. **Zusätzliche Skill-Ordner**: konfiguriert mit `skills.load.extraDirs`
2. **Gebündelte Skills**: mit der Installation ausgeliefert (npm-Paket oder OpenClaw.app)
3. **Verwaltete/lokale Skills**: `~/.openclaw/skills`
4. **Persönliche Agent-Skills**: `~/.agents/skills`
5. **Projekt-Agent-Skills**: `<workspace>/.agents/skills`
6. **Workspace-Skills**: `<workspace>/skills`

Wenn ein Skill-Name kollidiert, ist die Reihenfolge:

`<workspace>/skills` (höchste Priorität) → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → gebündelte Skills → `skills.load.extraDirs` (niedrigste Priorität)

## Skills pro Agent vs. gemeinsame Skills

In **Multi-Agent**-Setups hat jeder Agent seinen eigenen Workspace. Das bedeutet:

- **Skills pro Agent** liegen unter `<workspace>/skills` und gelten nur für diesen Agenten.
- **Projekt-Agent-Skills** liegen unter `<workspace>/.agents/skills` und gelten für
  diesen Workspace vor dem normalen Workspace-Ordner `skills/`.
- **Persönliche Agent-Skills** liegen unter `~/.agents/skills` und gelten
  workspaceübergreifend auf diesem Rechner.
- **Gemeinsame Skills** liegen unter `~/.openclaw/skills` (verwaltet/lokal) und sind
  für **alle Agenten** auf demselben Rechner sichtbar.
- **Gemeinsame Ordner** können auch über `skills.load.extraDirs` hinzugefügt werden (niedrigste
  Priorität), wenn Sie ein gemeinsames Skill-Paket für mehrere Agenten verwenden möchten.

Wenn derselbe Skill-Name an mehreren Orten existiert, gilt die übliche Priorität:
Workspace gewinnt, dann Projekt-Agent-Skills, dann persönliche Agent-Skills,
dann verwaltete/lokale Skills, dann gebündelte Skills, dann zusätzliche Verzeichnisse.

## Allowlists für Agent-Skills

Skill-**Standort** und Skill-**Sichtbarkeit** sind getrennte Steuerungen.

- Standort/Priorität entscheidet, welche Kopie eines gleichnamigen Skills gewinnt.
- Agent-Allowlists entscheiden, welche sichtbaren Skills ein Agent tatsächlich verwenden kann.

Verwenden Sie `agents.defaults.skills` für eine gemeinsame Basis und überschreiben Sie dann pro Agent mit
`agents.list[].skills`:

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"],
    },
    list: [
      { id: "writer" }, // erbt github, weather
      { id: "docs", skills: ["docs-search"] }, // ersetzt die Standardwerte
      { id: "locked-down", skills: [] }, // keine Skills
    ],
  },
}
```

Regeln:

- Lassen Sie `agents.defaults.skills` weg für standardmäßig uneingeschränkte Skills.
- Lassen Sie `agents.list[].skills` weg, um `agents.defaults.skills` zu erben.
- Setzen Sie `agents.list[].skills: []` für keine Skills.
- Eine nicht leere Liste `agents.list[].skills` ist die endgültige Menge für diesen Agenten; sie
  wird nicht mit den Standardwerten zusammengeführt.

OpenClaw wendet die effektive Agent-Skill-Menge beim Erstellen von Prompts, bei der
Erkennung von Skill-Slash-Befehlen, bei der Sandbox-Synchronisierung und bei Skill-Snapshots an.

## Plugins + Skills

Plugins können ihre eigenen Skills ausliefern, indem sie Verzeichnisse `skills` in
`openclaw.plugin.json` aufführen (Pfade relativ zum Plugin-Root). Plugin-Skills werden geladen,
wenn das Plugin aktiviert ist. Das ist der richtige Ort für toolspezifische
Anleitungen, die für die Tool-Beschreibung zu lang sind, aber verfügbar sein
sollten, sobald das Plugin installiert ist; zum Beispiel liefert das
Browser-Plugin einen Skill `browser-automation` für mehrstufige Browsersteuerung aus. Aktuell werden diese
Verzeichnisse in denselben Pfad mit niedriger Priorität wie
`skills.load.extraDirs` zusammengeführt, sodass ein gleichnamiger gebündelter, verwalteter, Agent- oder Workspace-
Skill sie überschreibt.
Sie können sie über `metadata.openclaw.requires.config` am Konfigurationseintrag des Plugins
gaten. Siehe [Plugins](/de/tools/plugin) für Discovery/Konfiguration und [Tools](/de/tools) für die
Tool-Oberfläche, die diese Skills vermitteln.

## Skill Workshop

Das optionale, experimentelle Plugin Skill Workshop kann Workspace-
Skills aus wiederverwendbaren Verfahren erstellen oder aktualisieren, die während der Arbeit des Agenten beobachtet wurden. Es ist standardmäßig deaktiviert und muss explizit über
`plugins.entries.skill-workshop` aktiviert werden.

Skill Workshop schreibt nur nach `<workspace>/skills`, scannt generierte Inhalte,
unterstützt ausstehende Freigabe oder automatische sichere Schreibvorgänge, quarantänisiert unsichere
Vorschläge und aktualisiert den Skill-Snapshot nach erfolgreichen Schreibvorgängen, sodass neue
Skills ohne Neustart des Gateway verfügbar werden können.

Verwenden Sie es, wenn Korrekturen wie „beim nächsten Mal GIF-Attribution prüfen“ oder
hart erarbeitete Abläufe wie Medien-QA-Checklisten zu dauerhaften prozeduralen
Anweisungen werden sollen. Beginnen Sie mit ausstehender Freigabe; automatische Schreibvorgänge sollten nur in vertrauenswürdigen
Workspaces nach Prüfung der Vorschläge verwendet werden. Vollständiger Leitfaden:
[Skill Workshop Plugin](/de/plugins/skill-workshop).

## ClawHub (Installation + Synchronisierung)

ClawHub ist die öffentliche Skills-Registry für OpenClaw. Durchsuchen Sie sie unter
[https://clawhub.ai](https://clawhub.ai). Verwenden Sie native `openclaw skills`-
Befehle, um Skills zu entdecken/installieren/aktualisieren, oder die separate `clawhub`-CLI, wenn
Sie Veröffentlichungs-/Synchronisierungs-Workflows benötigen.
Vollständiger Leitfaden: [ClawHub](/de/tools/clawhub).

Häufige Abläufe:

- Einen Skill in Ihren Workspace installieren:
  - `openclaw skills install <skill-slug>`
- Alle installierten Skills aktualisieren:
  - `openclaw skills update --all`
- Synchronisieren (scannen + Updates veröffentlichen):
  - `clawhub sync --all`

Das native `openclaw skills install` installiert in das aktive Workspace-Verzeichnis `skills/`.
Die separate `clawhub`-CLI installiert ebenfalls in `./skills` unter Ihrem
aktuellen Arbeitsverzeichnis (oder greift auf den konfigurierten OpenClaw-Workspace zurück).
OpenClaw übernimmt dies in der nächsten Sitzung als `<workspace>/skills`.

## Sicherheitshinweise

- Behandeln Sie Skills von Drittanbietern als **nicht vertrauenswürdigen Code**. Lesen Sie sie vor dem Aktivieren.
- Bevorzugen Sie Sandbox-Ausführungen für nicht vertrauenswürdige Eingaben und riskante Tools. Siehe [Sandboxing](/de/gateway/sandboxing).
- Die Erkennung von Workspace-Skills und zusätzlichen Skill-Verzeichnissen akzeptiert nur Skill-Roots und `SKILL.md`-Dateien, deren aufgelöster Realpath innerhalb des konfigurierten Roots bleibt.
- Gateway-gestützte Installationen von Skill-Abhängigkeiten (`skills.install`, Onboarding und die Skills-Einstellungs-UI) führen den integrierten Scanner für gefährlichen Code aus, bevor Installationsmetadaten ausgeführt werden. Ergebnisse mit `critical` blockieren standardmäßig, sofern der Aufrufer nicht explizit das gefährliche Override setzt; verdächtige Ergebnisse führen weiterhin nur zu Warnungen.
- `openclaw skills install <slug>` ist anders: Es lädt einen ClawHub-Skill-Ordner in den Workspace herunter und verwendet nicht den oben beschriebenen Pfad über Installationsmetadaten.
- `skills.entries.*.env` und `skills.entries.*.apiKey` injizieren Secrets in den **Host**-Prozess
  für diesen Agent-Turn (nicht in die Sandbox). Halten Sie Secrets aus Prompts und Logs fern.
- Ein breiteres Bedrohungsmodell und Checklisten finden Sie unter [Security](/de/gateway/security).

## Format (AgentSkills + Pi-kompatibel)

`SKILL.md` muss mindestens Folgendes enthalten:

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---
```

Hinweise:

- Wir folgen der AgentSkills-Spezifikation für Layout/Absicht.
- Der vom eingebetteten Agenten verwendete Parser unterstützt nur **einzeilige** Frontmatter-Schlüssel.
- `metadata` sollte ein **einzeiliges JSON-Objekt** sein.
- Verwenden Sie `{baseDir}` in Anweisungen, um auf den Pfad des Skill-Ordners zu verweisen.
- Optionale Frontmatter-Schlüssel:
  - `homepage` — URL, die in der macOS-Skills-UI als „Website“ angezeigt wird (auch unterstützt über `metadata.openclaw.homepage`).
  - `user-invocable` — `true|false` (Standard: `true`). Wenn `true`, wird der Skill als Benutzer-Slash-Befehl bereitgestellt.
  - `disable-model-invocation` — `true|false` (Standard: `false`). Wenn `true`, wird der Skill aus dem Modell-Prompt ausgeschlossen (weiterhin per Benutzeraufruf verfügbar).
  - `command-dispatch` — `tool` (optional). Wenn auf `tool` gesetzt, umgeht der Slash-Befehl das Modell und wird direkt an ein Tool weitergeleitet.
  - `command-tool` — Name des aufzurufenden Tools, wenn `command-dispatch: tool` gesetzt ist.
  - `command-arg-mode` — `raw` (Standard). Für Tool-Dispatch wird der rohe Argument-String an das Tool weitergeleitet (keine Core-Analyse).

    Das Tool wird mit folgenden Parametern aufgerufen:
    `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`.

## Gating (Filter beim Laden)

OpenClaw **filtert Skills beim Laden** mithilfe von `metadata` (einzeiliges JSON):

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

- `always: true` — Skill immer einschließen (andere Gates überspringen).
- `emoji` — optionales Emoji, das in der macOS-Skills-UI verwendet wird.
- `homepage` — optionale URL, die in der macOS-Skills-UI als „Website“ angezeigt wird.
- `os` — optionale Liste von Plattformen (`darwin`, `linux`, `win32`). Wenn gesetzt, ist der Skill nur auf diesen Betriebssystemen zulässig.
- `requires.bins` — Liste; jede muss auf `PATH` vorhanden sein.
- `requires.anyBins` — Liste; mindestens eine muss vorhanden sein.
- `requires.env` — Liste; Umgebungsvariable muss vorhanden sein **oder** in der Konfiguration bereitgestellt werden.
- `requires.config` — Liste von Pfaden in `openclaw.json`, die truthy sein müssen.
- `primaryEnv` — Name der Umgebungsvariable, die mit `skills.entries.<name>.apiKey` verknüpft ist.
- `install` — optionales Array von Installer-Spezifikationen, das von der macOS-Skills-UI verwendet wird (brew/node/go/uv/download).

Veraltete Blöcke `metadata.clawdbot` werden weiterhin akzeptiert, wenn
`metadata.openclaw` fehlt, sodass ältere installierte Skills ihre Abhängigkeits-
gates und Installer-Hinweise beibehalten. Neue und aktualisierte Skills sollten
`metadata.openclaw` verwenden.

Hinweis zum Sandboxing:

- `requires.bins` wird auf dem **Host** zur Ladezeit des Skills geprüft.
- Wenn ein Agent sandboxed ist, muss die Binärdatei auch **innerhalb des Containers** vorhanden sein.
  Installieren Sie sie über `agents.defaults.sandbox.docker.setupCommand` (oder ein benutzerdefiniertes Image).
  `setupCommand` wird einmal nach der Erstellung des Containers ausgeführt.
  Paketinstallationen erfordern im Sandbox außerdem Netzwerk-Egress, ein beschreibbares Root-FS und einen Root-Benutzer.
  Beispiel: Der Skill `summarize` (`skills/summarize/SKILL.md`) benötigt die CLI
  `summarize` im Sandbox-Container, um dort ausgeführt werden zu können.

Beispiel für einen Installer:

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

Hinweise:

- Wenn mehrere Installer aufgeführt sind, wählt das Gateway eine **einzige** bevorzugte Option (brew, wenn verfügbar, sonst node).
- Wenn alle Installer `download` sind, listet OpenClaw jeden Eintrag auf, damit Sie die verfügbaren Artefakte sehen können.
- Installer-Spezifikationen können `os: ["darwin"|"linux"|"win32"]` enthalten, um Optionen nach Plattform zu filtern.
- Node-Installationen berücksichtigen `skills.install.nodeManager` in `openclaw.json` (Standard: npm; Optionen: npm/pnpm/yarn/bun).
  Dies wirkt sich nur auf **Skill-Installationen** aus; die Gateway-Runtime sollte weiterhin Node
  sein (Bun wird für WhatsApp/Telegram nicht empfohlen).
- Die Auswahl Gateway-gestützter Installer ist präferenzgesteuert, nicht nur node-basiert:
  Wenn Installationsspezifikationen mehrere Arten mischen, bevorzugt OpenClaw Homebrew, wenn
  `skills.install.preferBrew` aktiviert ist und `brew` existiert, dann `uv`, dann den
  konfigurierten Node-Manager, dann andere Fallbacks wie `go` oder `download`.
- Wenn jede Installationsspezifikation `download` ist, zeigt OpenClaw alle Download-Optionen
  an, statt sie auf einen bevorzugten Installer zu reduzieren.
- Go-Installationen: Wenn `go` fehlt und `brew` verfügbar ist, installiert das Gateway zuerst Go über Homebrew und setzt `GOBIN` nach Möglichkeit auf das `bin` von Homebrew.
- Download-Installationen: `url` (erforderlich), `archive` (`tar.gz` | `tar.bz2` | `zip`), `extract` (Standard: automatisch bei erkanntem Archiv), `stripComponents`, `targetDir` (Standard: `~/.openclaw/tools/<skillKey>`).

Wenn kein `metadata.openclaw` vorhanden ist, ist der Skill immer zulässig (sofern
er nicht in der Konfiguration deaktiviert oder bei gebündelten Skills durch `skills.allowBundled` blockiert wird).

## Konfigurations-Overrides (`~/.openclaw/openclaw.json`)

Gebündelte/verwaltete Skills können umgeschaltet und mit Umgebungswerten versorgt werden:

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

Hinweis: Wenn der Skill-Name Bindestriche enthält, setzen Sie den Schlüssel in Anführungszeichen (JSON5 erlaubt Schlüssel in Anführungszeichen).

Wenn Sie Standard-Bildgenerierung/-bearbeitung direkt in OpenClaw möchten, verwenden Sie das Core-
Tool `image_generate` mit `agents.defaults.imageGenerationModel` statt eines
gebündelten Skills. Die Skill-Beispiele hier sind für benutzerdefinierte oder Workflows von Drittanbietern gedacht.

Für native Bildanalyse verwenden Sie das Tool `image` mit `agents.defaults.imageModel`.
Für native Bildgenerierung/-bearbeitung verwenden Sie `image_generate` mit
`agents.defaults.imageGenerationModel`. Wenn Sie `openai/*`, `google/*`,
`fal/*` oder ein anderes providerspezifisches Bildmodell wählen, fügen Sie auch die Auth/API-
Schlüssel dieses Providers hinzu.

Konfigurationsschlüssel entsprechen standardmäßig dem **Skill-Namen**. Wenn ein Skill
`metadata.openclaw.skillKey` definiert, verwenden Sie diesen Schlüssel unter `skills.entries`.

Regeln:

- `enabled: false` deaktiviert den Skill, auch wenn er gebündelt/installiert ist.
- `env`: wird **nur dann** injiziert, wenn die Variable im Prozess nicht bereits gesetzt ist.
- `apiKey`: Kurzform für Skills, die `metadata.openclaw.primaryEnv` deklarieren.
  Unterstützt Klartext-String oder ein SecretRef-Objekt (`{ source, provider, id }`).
- `config`: optionales Feld für benutzerdefinierte Felder pro Skill; benutzerdefinierte Schlüssel müssen hier liegen.
- `allowBundled`: optionale Allowlist nur für **gebündelte** Skills. Wenn gesetzt, sind nur
  gebündelte Skills in der Liste zulässig (verwaltete/Workspace-Skills bleiben unberührt).

## Umgebungsinjektion (pro Agent-Ausführung)

Wenn eine Agent-Ausführung startet, macht OpenClaw Folgendes:

1. Liest die Skill-Metadaten.
2. Wendet `skills.entries.<key>.env` oder `skills.entries.<key>.apiKey` auf
   `process.env` an.
3. Erstellt den System-Prompt mit **zulässigen** Skills.
4. Stellt die ursprüngliche Umgebung wieder her, nachdem die Ausführung beendet ist.

Dies ist **auf die Agent-Ausführung begrenzt**, nicht auf eine globale Shell-Umgebung.

Für das gebündelte Backend `claude-cli` materialisiert OpenClaw denselben
zulässigen Snapshot auch als temporäres Claude-Code-Plugin und übergibt ihn mit
`--plugin-dir`. Claude Code kann dann seinen nativen Skill-Resolver verwenden, während
OpenClaw weiterhin Priorität, Allowlists pro Agent, Gating und
Umgebungs-/API-Key-Injektion über `skills.entries.*` besitzt. Andere CLI-Backends verwenden nur den Prompt-
Katalog.

## Sitzungs-Snapshot (Performance)

OpenClaw erstellt einen Snapshot der zulässigen Skills **beim Start einer Sitzung** und verwendet diese Liste für nachfolgende Turns in derselben Sitzung wieder. Änderungen an Skills oder der Konfiguration werden in der nächsten neuen Sitzung wirksam.

Skills können auch mitten in einer Sitzung aktualisiert werden, wenn der Skills-Watcher aktiviert ist oder wenn ein neuer zulässiger Remote-Node erscheint (siehe unten). Betrachten Sie dies als **Hot Reload**: Die aktualisierte Liste wird beim nächsten Agent-Turn übernommen.

Wenn sich die effektive Skill-Allowlist des Agenten für diese Sitzung ändert, aktualisiert OpenClaw
den Snapshot, damit die sichtbaren Skills mit dem aktuellen
Agenten synchron bleiben.

## Remote-macOS-Nodes (Linux-Gateway)

Wenn das Gateway unter Linux läuft, aber ein **macOS-Node** verbunden ist **mit erlaubtem `system.run`** (Exec-Approvals-Sicherheit nicht auf `deny` gesetzt), kann OpenClaw macOS-exklusive Skills als zulässig behandeln, wenn die erforderlichen Binärdateien auf diesem Node vorhanden sind. Der Agent sollte diese Skills über das Tool `exec` mit `host=node` ausführen.

Dies setzt voraus, dass der Node seine Befehlsunterstützung meldet und eine Binärprüfung über `system.run` erfolgt. Wenn der macOS-Node später offline geht, bleiben die Skills sichtbar; Aufrufe können fehlschlagen, bis der Node sich wieder verbindet.

## Skills-Watcher (automatische Aktualisierung)

Standardmäßig überwacht OpenClaw Skill-Ordner und erhöht den Snapshot der Skills, wenn sich `SKILL.md`-Dateien ändern. Konfigurieren Sie dies unter `skills.load`:

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

## Token-Auswirkung (Skills-Liste)

Wenn Skills zulässig sind, injiziert OpenClaw eine kompakte XML-Liste verfügbarer Skills in den System-Prompt (über `formatSkillsForPrompt` in `pi-coding-agent`). Die Kosten sind deterministisch:

- **Basis-Overhead (nur wenn ≥1 Skill):** 195 Zeichen.
- **Pro Skill:** 97 Zeichen + die Länge der XML-escaped Werte von `<name>`, `<description>` und `<location>`.

Formel (Zeichen):

```
total = 195 + Σ (97 + len(name_escaped) + len(description_escaped) + len(location_escaped))
```

Hinweise:

- XML-Escaping erweitert `& < > " '` zu Entitäten (`&amp;`, `&lt;` usw.), wodurch die Länge steigt.
- Token-Anzahlen variieren je nach Modell-Tokenizer. Eine grobe Schätzung im OpenAI-Stil sind ~4 Zeichen/Token, also **97 Zeichen ≈ 24 Tokens** pro Skill plus die tatsächlichen Feldlängen.

## Lebenszyklus verwalteter Skills

OpenClaw liefert eine Basismenge an Skills als **gebündelte Skills** mit der
Installation aus (npm-Paket oder OpenClaw.app). `~/.openclaw/skills` ist für lokale
Overrides vorgesehen (zum Beispiel, um einen Skill zu pinnen/patchen, ohne die gebündelte
Kopie zu ändern). Workspace-Skills gehören dem Benutzer und überschreiben beide bei Namenskonflikten.

## Konfigurationsreferenz

Siehe [Skills config](/de/tools/skills-config) für das vollständige Konfigurationsschema.

## Auf der Suche nach weiteren Skills?

Durchsuchen Sie [https://clawhub.ai](https://clawhub.ai).

---

## Verwandt

- [Creating Skills](/de/tools/creating-skills) — benutzerdefinierte Skills erstellen
- [Skills Config](/de/tools/skills-config) — Konfigurationsreferenz für Skills
- [Slash Commands](/de/tools/slash-commands) — alle verfügbaren Slash-Befehle
- [Plugins](/de/tools/plugin) — Überblick über das Plugin-System
