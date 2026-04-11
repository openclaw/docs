---
read_when:
    - Skills hinzufügen oder ändern
    - Gating- oder Laderegeln für Skills ändern
summary: 'Skills: verwaltet vs. Workspace, Gating-Regeln und Konfigurations-/Umgebungsvariablen-Verdrahtung'
title: Skills
x-i18n:
    generated_at: "2026-04-11T02:48:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: b1eaf130966950b6eb24f859d9a77ecbf81c6cb80deaaa6a3a79d2c16d83115d
    source_path: tools/skills.md
    workflow: 15
---

# Skills (OpenClaw)

OpenClaw verwendet **mit [AgentSkills](https://agentskills.io) kompatible** Skill-Ordner, um dem Agenten beizubringen, wie Tools zu verwenden sind. Jeder Skill ist ein Verzeichnis mit einer `SKILL.md`, die YAML-Frontmatter und Anweisungen enthält. OpenClaw lädt **gebündelte Skills** plus optionale lokale Überschreibungen und filtert sie beim Laden anhand von Umgebung, Konfiguration und vorhandenen Binaries.

## Speicherorte und Priorität

OpenClaw lädt Skills aus diesen Quellen:

1. **Zusätzliche Skill-Ordner**: konfiguriert über `skills.load.extraDirs`
2. **Gebündelte Skills**: werden mit der Installation ausgeliefert (npm-Paket oder OpenClaw.app)
3. **Verwaltete/lokale Skills**: `~/.openclaw/skills`
4. **Persönliche Agent-Skills**: `~/.agents/skills`
5. **Projekt-Agent-Skills**: `<workspace>/.agents/skills`
6. **Workspace-Skills**: `<workspace>/skills`

Wenn ein Skill-Name kollidiert, gilt folgende Priorität:

`<workspace>/skills` (höchste) → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → gebündelte Skills → `skills.load.extraDirs` (niedrigste)

## Skills pro Agent vs. gemeinsam genutzte Skills

In Setups mit **mehreren Agenten** hat jeder Agent seinen eigenen Workspace. Das bedeutet:

- **Skills pro Agent** befinden sich in `<workspace>/skills` nur für diesen Agenten.
- **Projekt-Agent-Skills** befinden sich in `<workspace>/.agents/skills` und gelten für diesen Workspace vor dem normalen Workspace-Ordner `skills/`.
- **Persönliche Agent-Skills** befinden sich in `~/.agents/skills` und gelten über alle Workspaces auf diesem Rechner hinweg.
- **Gemeinsam genutzte Skills** befinden sich in `~/.openclaw/skills` (verwaltet/lokal) und sind für **alle Agenten** auf demselben Rechner sichtbar.
- **Gemeinsame Ordner** können auch über `skills.load.extraDirs` hinzugefügt werden (niedrigste Priorität), wenn Sie ein gemeinsames Skill-Paket für mehrere Agenten verwenden möchten.

Wenn derselbe Skill-Name an mehr als einem Ort existiert, gilt die übliche Priorität:
Workspace gewinnt, dann Projekt-Agent-Skills, dann persönliche Agent-Skills,
dann verwaltet/lokal, dann gebündelt, dann zusätzliche Verzeichnisse.

## Allowlists für Agent-Skills

**Speicherort** und **Sichtbarkeit** von Skills sind separate Steuerungen.

- Speicherort/Priorität entscheidet, welche Version eines gleichnamigen Skills gewinnt.
- Allowlists pro Agent entscheiden, welche sichtbaren Skills ein Agent tatsächlich verwenden kann.

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
      { id: "docs", skills: ["docs-search"] }, // ersetzt Standards
      { id: "locked-down", skills: [] }, // keine Skills
    ],
  },
}
```

Regeln:

- Lassen Sie `agents.defaults.skills` weg, wenn Skills standardmäßig nicht eingeschränkt sein sollen.
- Lassen Sie `agents.list[].skills` weg, damit `agents.defaults.skills` geerbt wird.
- Setzen Sie `agents.list[].skills: []` für keine Skills.
- Eine nicht leere Liste `agents.list[].skills` ist die endgültige Menge für diesen Agenten; sie
  wird nicht mit den Standards zusammengeführt.

OpenClaw wendet die effektive Skill-Menge eines Agenten auf Prompt-Erstellung, Erkennung von Skill-Slash-Befehlen, Sandbox-Synchronisierung und Skill-Snapshots an.

## Plugins + Skills

Plugins können ihre eigenen Skills mitliefern, indem sie Verzeichnisse `skills` in
`openclaw.plugin.json` auflisten (Pfade relativ zur Plugin-Wurzel). Plugin-Skills werden geladen,
wenn das Plugin aktiviert ist. Diese Verzeichnisse werden derzeit in denselben Pfad mit
niedriger Priorität wie `skills.load.extraDirs` zusammengeführt, sodass ein gleichnamiger gebündelter,
verwalteter, Agenten- oder Workspace-Skill sie überschreibt.
Sie können sie über `metadata.openclaw.requires.config` am Konfigurationseintrag des Plugins
gaten. Siehe [Plugins](/de/tools/plugin) für Erkennung/Konfiguration und [Tools](/de/tools) für die
Tool-Oberfläche, die diese Skills vermitteln.

## ClawHub (Installieren + Synchronisieren)

ClawHub ist die öffentliche Skill-Registry für OpenClaw. Stöbern Sie unter
[https://clawhub.ai](https://clawhub.ai). Verwenden Sie native Befehle `openclaw skills`,
um Skills zu finden/zu installieren/zu aktualisieren, oder die separate CLI `clawhub`, wenn
Sie Workflows zum Veröffentlichen/Synchronisieren benötigen.
Vollständiger Leitfaden: [ClawHub](/de/tools/clawhub).

Häufige Abläufe:

- Einen Skill in Ihren Workspace installieren:
  - `openclaw skills install <skill-slug>`
- Alle installierten Skills aktualisieren:
  - `openclaw skills update --all`
- Synchronisieren (scannen + Updates veröffentlichen):
  - `clawhub sync --all`

Das native `openclaw skills install` installiert in das aktive Workspace-Verzeichnis `skills/`.
Die separate CLI `clawhub` installiert ebenfalls in `./skills` unter Ihrem aktuellen
Arbeitsverzeichnis (oder greift auf den konfigurierten OpenClaw-Workspace zurück).
OpenClaw übernimmt das in der nächsten Sitzung als `<workspace>/skills`.

## Sicherheitshinweise

- Behandeln Sie Skills von Drittanbietern als **nicht vertrauenswürdigen Code**. Lesen Sie sie, bevor Sie sie aktivieren.
- Bevorzugen Sie Sandbox-Ausführungen für nicht vertrauenswürdige Eingaben und riskante Tools. Siehe [Sandboxing](/de/gateway/sandboxing).
- Die Erkennung von Workspace-Skills und Skills in zusätzlichen Verzeichnissen akzeptiert nur Skill-Wurzeln und `SKILL.md`-Dateien, deren aufgelöster realpath innerhalb der konfigurierten Wurzel bleibt.
- Gateway-gestützte Installationen von Skill-Abhängigkeiten (`skills.install`, Onboarding und die Skills-Einstellungsoberfläche) führen den integrierten Scanner für gefährlichen Code aus, bevor Installationsmetadaten ausgeführt werden. Ergebnisse vom Typ `critical` blockieren standardmäßig, sofern der Aufrufer nicht ausdrücklich die gefährliche Überschreibung setzt; verdächtige Ergebnisse führen weiterhin nur zu Warnungen.
- `openclaw skills install <slug>` ist etwas anderes: Es lädt einen ClawHub-Skill-Ordner in den Workspace herunter und verwendet nicht den oben genannten Pfad für Installationsmetadaten.
- `skills.entries.*.env` und `skills.entries.*.apiKey` injizieren Secrets in den **Host**-Prozess
  für diesen Agenten-Turn (nicht in die Sandbox). Halten Sie Secrets aus Prompts und Logs heraus.
- Für ein umfassenderes Bedrohungsmodell und Checklisten siehe [Security](/de/gateway/security).

## Format (AgentSkills + Pi-kompatibel)

`SKILL.md` muss mindestens Folgendes enthalten:

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---
```

Hinweise:

- Wir folgen der AgentSkills-Spezifikation für Layout/Intention.
- Der Parser, der vom eingebetteten Agenten verwendet wird, unterstützt nur Frontmatter-Schlüssel in **einer einzigen Zeile**.
- `metadata` sollte ein **einzeiliges JSON-Objekt** sein.
- Verwenden Sie `{baseDir}` in Anweisungen, um auf den Pfad des Skill-Ordners zu verweisen.
- Optionale Frontmatter-Schlüssel:
  - `homepage` — URL, die in der macOS-Skills-Oberfläche als „Website“ angezeigt wird (auch unterstützt über `metadata.openclaw.homepage`).
  - `user-invocable` — `true|false` (Standard: `true`). Wenn `true`, wird der Skill als Benutzerslash-Befehl bereitgestellt.
  - `disable-model-invocation` — `true|false` (Standard: `false`). Wenn `true`, wird der Skill aus dem Modell-Prompt ausgeschlossen (über Benutzeraufruf aber weiterhin verfügbar).
  - `command-dispatch` — `tool` (optional). Wenn auf `tool` gesetzt, umgeht der Slash-Befehl das Modell und dispatcht direkt an ein Tool.
  - `command-tool` — Name des Tools, das aufgerufen werden soll, wenn `command-dispatch: tool` gesetzt ist.
  - `command-arg-mode` — `raw` (Standard). Für Tool-Dispatch wird die rohe Argumentzeichenfolge an das Tool weitergeleitet (keine Core-Analyse).

    Das Tool wird mit folgenden Parametern aufgerufen:
    `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`.

## Gating (Filter beim Laden)

OpenClaw **filtert Skills beim Laden** anhand von `metadata` (einzeiliges JSON):

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
- `emoji` — optionales Emoji, das von der macOS-Skills-Oberfläche verwendet wird.
- `homepage` — optionale URL, die in der macOS-Skills-Oberfläche als „Website“ angezeigt wird.
- `os` — optionale Liste von Plattformen (`darwin`, `linux`, `win32`). Wenn gesetzt, ist der Skill nur auf diesen Betriebssystemen zulässig.
- `requires.bins` — Liste; jedes Element muss auf `PATH` existieren.
- `requires.anyBins` — Liste; mindestens eines muss auf `PATH` existieren.
- `requires.env` — Liste; Umgebungsvariable muss existieren **oder** in der Konfiguration bereitgestellt werden.
- `requires.config` — Liste von Pfaden in `openclaw.json`, die truthy sein müssen.
- `primaryEnv` — Name der Umgebungsvariable, die mit `skills.entries.<name>.apiKey` verknüpft ist.
- `install` — optionales Array von Installer-Spezifikationen, die von der macOS-Skills-Oberfläche verwendet werden (brew/node/go/uv/download).

Hinweis zu Sandboxing:

- `requires.bins` wird beim Laden des Skills auf dem **Host** geprüft.
- Wenn ein Agent sandboxed ist, muss das Binary auch **innerhalb des Containers** existieren.
  Installieren Sie es über `agents.defaults.sandbox.docker.setupCommand` (oder ein benutzerdefiniertes Image).
  `setupCommand` läuft einmal nach dem Erstellen des Containers.
  Paketinstallationen erfordern außerdem Netzwerk-Egress, ein beschreibbares Root-FS und einen Root-Benutzer in der Sandbox.
  Beispiel: Der Skill `summarize` (`skills/summarize/SKILL.md`) benötigt die CLI
  `summarize` im Sandbox-Container, um dort zu laufen.

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
- Node-Installationen beachten `skills.install.nodeManager` in `openclaw.json` (Standard: npm; Optionen: npm/pnpm/yarn/bun).
  Dies betrifft nur **Skill-Installationen**; die Gateway-Runtime sollte weiterhin Node sein
  (Bun wird für WhatsApp/Telegram nicht empfohlen).
- Die Auswahl von Gateway-gestützten Installern ist präferenzgesteuert, nicht nur node-basiert:
  Wenn Install-Spezifikationen unterschiedliche Arten mischen, bevorzugt OpenClaw Homebrew, wenn
  `skills.install.preferBrew` aktiviert ist und `brew` existiert, dann `uv`, dann den
  konfigurierten Node-Manager und anschließend andere Fallbacks wie `go` oder `download`.
- Wenn jede Install-Spezifikation `download` ist, zeigt OpenClaw alle Download-Optionen an,
  statt sie auf einen bevorzugten Installer zu reduzieren.
- Go-Installationen: Wenn `go` fehlt und `brew` verfügbar ist, installiert das Gateway Go zuerst über Homebrew und setzt `GOBIN` nach Möglichkeit auf `bin` von Homebrew.
- Download-Installationen: `url` (erforderlich), `archive` (`tar.gz` | `tar.bz2` | `zip`), `extract` (Standard: automatisch, wenn ein Archiv erkannt wird), `stripComponents`, `targetDir` (Standard: `~/.openclaw/tools/<skillKey>`).

Wenn kein `metadata.openclaw` vorhanden ist, ist der Skill immer zulässig (es sei denn,
er ist in der Konfiguration deaktiviert oder wird bei gebündelten Skills durch `skills.allowBundled` blockiert).

## Konfigurationsüberschreibungen (`~/.openclaw/openclaw.json`)

Gebündelte/verwaltete Skills können ein- oder ausgeschaltet und mit Umgebungswerten versorgt werden:

```json5
{
  skills: {
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // oder Klartextzeichenfolge
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

Wenn Sie Standard-Bildgenerierung/-bearbeitung direkt in OpenClaw selbst möchten, verwenden Sie das Core-Tool
`image_generate` mit `agents.defaults.imageGenerationModel` statt eines
gebündelten Skills. Die Skill-Beispiele hier sind für benutzerdefinierte oder Drittanbieter-Workflows.

Für native Bildanalyse verwenden Sie das Tool `image` mit `agents.defaults.imageModel`.
Für native Bildgenerierung/-bearbeitung verwenden Sie `image_generate` mit
`agents.defaults.imageGenerationModel`. Wenn Sie `openai/*`, `google/*`,
`fal/*` oder ein anderes providerspezifisches Bildmodell wählen, fügen Sie auch die Authentifizierung/den API-Schlüssel dieses Providers hinzu.

Konfigurationsschlüssel entsprechen standardmäßig dem **Skill-Namen**. Wenn ein Skill
`metadata.openclaw.skillKey` definiert, verwenden Sie diesen Schlüssel unter `skills.entries`.

Regeln:

- `enabled: false` deaktiviert den Skill, auch wenn er gebündelt/installiert ist.
- `env`: wird **nur dann** injiziert, wenn die Variable im Prozess noch nicht gesetzt ist.
- `apiKey`: Komfortfunktion für Skills, die `metadata.openclaw.primaryEnv` deklarieren.
  Unterstützt eine Klartextzeichenfolge oder ein SecretRef-Objekt (`{ source, provider, id }`).
- `config`: optionale Sammlung für benutzerdefinierte Felder pro Skill; benutzerdefinierte Schlüssel müssen hier liegen.
- `allowBundled`: optionale Allowlist nur für **gebündelte** Skills. Wenn gesetzt, sind nur
  gebündelte Skills in der Liste zulässig (verwaltete/Workspace-Skills bleiben unberührt).

## Umgebungsinjektion (pro Agenten-Ausführung)

Wenn eine Agenten-Ausführung startet, führt OpenClaw Folgendes aus:

1. Liest Skill-Metadaten.
2. Wendet `skills.entries.<key>.env` oder `skills.entries.<key>.apiKey` auf
   `process.env` an.
3. Baut den System-Prompt mit **zulässigen** Skills auf.
4. Stellt die ursprüngliche Umgebung nach Ende der Ausführung wieder her.

Dies ist **auf die Agenten-Ausführung begrenzt**, nicht auf eine globale Shell-Umgebung.

Für das gebündelte Backend `claude-cli` materialisiert OpenClaw außerdem denselben
zulässigen Snapshot als temporäres Claude-Code-Plugin und übergibt ihn mit
`--plugin-dir`. Claude Code kann dann seinen nativen Skill-Resolver verwenden, während
OpenClaw weiterhin Priorität, Allowlists pro Agent, Gating und die Injektion von
Umgebungsvariablen/API-Schlüsseln über `skills.entries.*` steuert. Andere CLI-Backends verwenden nur den Prompt-Katalog.

## Sitzungs-Snapshot (Leistung)

OpenClaw erstellt beim Start einer Sitzung einen Snapshot der zulässigen Skills und verwendet diese Liste für nachfolgende Turns in derselben Sitzung erneut. Änderungen an Skills oder der Konfiguration werden in der nächsten neuen Sitzung wirksam.

Skills können auch mitten in einer Sitzung aktualisiert werden, wenn der Skills-Watcher aktiviert ist oder wenn ein neuer zulässiger entfernter Node erscheint (siehe unten). Betrachten Sie das als **Hot Reload**: Die aktualisierte Liste wird beim nächsten Agenten-Turn übernommen.

Wenn sich die effektive Allowlist der Agent-Skills für diese Sitzung ändert, aktualisiert OpenClaw den Snapshot, damit die sichtbaren Skills mit dem aktuellen Agenten übereinstimmen.

## Entfernte macOS-Nodes (Linux-Gateway)

Wenn das Gateway unter Linux läuft, aber ein **macOS-Node** verbunden ist **mit erlaubtem `system.run`** (Exec-Approvals-Sicherheit nicht auf `deny` gesetzt), kann OpenClaw Skills nur für macOS als zulässig behandeln, wenn die erforderlichen Binaries auf diesem Node vorhanden sind. Der Agent sollte diese Skills über das Tool `exec` mit `host=node` ausführen.

Dies setzt voraus, dass der Node seine Befehlsunterstützung meldet und dass eine Binärprüfung über `system.run` erfolgt. Wenn der macOS-Node später offline geht, bleiben die Skills sichtbar; Aufrufe können fehlschlagen, bis der Node wieder verbunden ist.

## Skills-Watcher (automatisches Aktualisieren)

Standardmäßig beobachtet OpenClaw Skill-Ordner und erhöht den Snapshot der Skills, wenn sich `SKILL.md`-Dateien ändern. Konfigurieren Sie dies unter `skills.load`:

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

Wenn Skills zulässig sind, injiziert OpenClaw eine kompakte XML-Liste der verfügbaren Skills in den System-Prompt (über `formatSkillsForPrompt` in `pi-coding-agent`). Die Kosten sind deterministisch:

- **Basis-Overhead (nur wenn ≥1 Skill):** 195 Zeichen.
- **Pro Skill:** 97 Zeichen + die Länge der XML-escaped Werte von `<name>`, `<description>` und `<location>`.

Formel (Zeichen):

```
total = 195 + Σ (97 + len(name_escaped) + len(description_escaped) + len(location_escaped))
```

Hinweise:

- XML-Escaping erweitert `& < > " '` zu Entities (`&amp;`, `&lt;` usw.), wodurch die Länge zunimmt.
- Tokenzahlen variieren je nach Modell-Tokenizer. Eine grobe Schätzung im OpenAI-Stil ist ~4 Zeichen/Token, also **97 Zeichen ≈ 24 Token** pro Skill plus die tatsächlichen Längen Ihrer Felder.

## Lebenszyklus verwalteter Skills

OpenClaw liefert einen Basissatz von Skills als **gebündelte Skills** als Teil der
Installation aus (npm-Paket oder OpenClaw.app). `~/.openclaw/skills` ist für lokale
Überschreibungen gedacht (z. B. zum Pinnen/Patchen eines Skills, ohne die gebündelte
Kopie zu ändern). Workspace-Skills gehören dem Benutzer und überschreiben beide bei Namenskonflikten.

## Konfigurationsreferenz

Siehe [Skills-Konfiguration](/de/tools/skills-config) für das vollständige Konfigurationsschema.

## Suchen Sie nach weiteren Skills?

Stöbern Sie unter [https://clawhub.ai](https://clawhub.ai).

---

## Verwandt

- [Skills erstellen](/de/tools/creating-skills) — benutzerdefinierte Skills erstellen
- [Skills-Konfiguration](/de/tools/skills-config) — Referenz zur Skill-Konfiguration
- [Slash-Befehle](/de/tools/slash-commands) — alle verfügbaren Slash-Befehle
- [Plugins](/de/tools/plugin) — Überblick über das Plugin-System
