---
read_when:
    - Skills hinzufügen oder ändern
    - Skill-Gating oder Laderegeln ändern
summary: 'Skills: verwaltet vs. Workspace, Gating-Regeln und Konfigurations-/env-Verdrahtung'
title: Skills
x-i18n:
    generated_at: "2026-04-22T04:27:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: c2ff6a3a92bc3c1c3892620a00e2eb01c73364bc6388a3513943defa46e49749
    source_path: tools/skills.md
    workflow: 15
---

# Skills (OpenClaw)

OpenClaw verwendet mit **[AgentSkills](https://agentskills.io)** kompatible Skill-Ordner, um dem Agenten beizubringen, wie er Tools verwendet. Jeder Skill ist ein Verzeichnis mit einer `SKILL.md`, die YAML-Frontmatter und Anweisungen enthält. OpenClaw lädt **gebündelte Skills** plus optionale lokale Überschreibungen und filtert sie zur Ladezeit anhand von Umgebung, Konfiguration und vorhandenen Binärdateien.

## Speicherorte und Priorität

OpenClaw lädt Skills aus diesen Quellen:

1. **Zusätzliche Skill-Ordner**: konfiguriert über `skills.load.extraDirs`
2. **Gebündelte Skills**: mit der Installation ausgeliefert (npm-Paket oder OpenClaw.app)
3. **Verwaltete/lokale Skills**: `~/.openclaw/skills`
4. **Persönliche Agent-Skills**: `~/.agents/skills`
5. **Projekt-Agent-Skills**: `<workspace>/.agents/skills`
6. **Workspace-Skills**: `<workspace>/skills`

Wenn ein Skill-Name kollidiert, gilt folgende Priorität:

`<workspace>/skills` (höchste) → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → gebündelte Skills → `skills.load.extraDirs` (niedrigste)

## Skills pro Agent vs. gemeinsame Skills

In **Multi-Agent**-Setups hat jeder Agent seinen eigenen Workspace. Das bedeutet:

- **Skills pro Agent** liegen in `<workspace>/skills` und gelten nur für diesen Agenten.
- **Projekt-Agent-Skills** liegen in `<workspace>/.agents/skills` und gelten für
  diesen Workspace vor dem normalen Ordner `skills/` des Workspace.
- **Persönliche Agent-Skills** liegen in `~/.agents/skills` und gelten über
  Workspaces hinweg auf dieser Maschine.
- **Gemeinsame Skills** liegen in `~/.openclaw/skills` (verwaltet/lokal) und sind
  für **alle Agenten** auf derselben Maschine sichtbar.
- **Gemeinsame Ordner** können auch über `skills.load.extraDirs` hinzugefügt werden (niedrigste
  Priorität), wenn Sie ein gemeinsames Skill-Paket für mehrere Agenten verwenden möchten.

Wenn derselbe Skill-Name an mehr als einem Ort existiert, gilt die übliche Priorität:
Workspace gewinnt, dann Projekt-Agent-Skills, dann persönliche Agent-Skills,
dann verwaltet/lokal, dann gebündelt, dann zusätzliche Verzeichnisse.

## Skill-Allowlists pro Agent

Skill-**Speicherort** und Skill-**Sichtbarkeit** sind getrennte Steuerungen.

- Speicherort/Priorität entscheidet, welche Kopie eines gleichnamigen Skills gewinnt.
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
      { id: "docs", skills: ["docs-search"] }, // ersetzt Standardwerte
      { id: "locked-down", skills: [] }, // keine Skills
    ],
  },
}
```

Regeln:

- Lassen Sie `agents.defaults.skills` weg, um standardmäßig uneingeschränkte Skills zu haben.
- Lassen Sie `agents.list[].skills` weg, um `agents.defaults.skills` zu erben.
- Setzen Sie `agents.list[].skills: []` für keine Skills.
- Eine nicht leere Liste in `agents.list[].skills` ist die endgültige Menge für diesen Agenten; sie
  wird nicht mit den Standardwerten zusammengeführt.

OpenClaw wendet die effektive Skill-Menge des Agenten bei Prompt-Erstellung, Skill-
Slash-Command-Erkennung, Sandbox-Synchronisierung und Skill-Snapshots an.

## Plugins + Skills

Plugins können eigene Skills mitliefern, indem sie `skills`-Verzeichnisse in
`openclaw.plugin.json` auflisten (Pfade relativ zum Plugin-Root). Plugin-Skills werden geladen,
wenn das Plugin aktiviert ist. Heute werden diese Verzeichnisse in denselben
Pfad mit niedriger Priorität wie `skills.load.extraDirs` zusammengeführt, sodass ein gleichnamiger gebündelter,
verwalteter, Agenten- oder Workspace-Skill sie überschreibt.
Sie können sie über `metadata.openclaw.requires.config` im Konfigurationseintrag des Plugins
gaten. Siehe [Plugins](/de/tools/plugin) für Erkennung/Konfiguration und [Tools](/de/tools) für die
Tool-Oberfläche, die diese Skills vermitteln.

## Skill Workshop

Das optionale, experimentelle Skill-Workshop-Plugin kann Workspace-
Skills aus wiederverwendbaren Abläufen erstellen oder aktualisieren, die bei der Arbeit des Agenten beobachtet wurden. Es ist standardmäßig deaktiviert und muss explizit über
`plugins.entries.skill-workshop` aktiviert werden.

Skill Workshop schreibt nur in `<workspace>/skills`, scannt generierte Inhalte,
unterstützt ausstehende Genehmigung oder automatische sichere Schreibvorgänge, verschiebt unsichere
Proposals in Quarantäne und aktualisiert den Skill-Snapshot nach erfolgreichen Schreibvorgängen, sodass neue
Skills ohne Neustart des Gateways verfügbar werden können.

Verwenden Sie es, wenn Sie möchten, dass Korrekturen wie „nächstes Mal GIF-Attribution prüfen“ oder
mühsam erarbeitete Workflows wie Checklisten für Media-QA zu dauerhaften prozeduralen
Anweisungen werden. Beginnen Sie mit ausstehender Genehmigung; verwenden Sie automatische Schreibvorgänge nur in vertrauenswürdigen
Workspaces, nachdem Sie die Proposals geprüft haben. Vollständiger Leitfaden:
[Skill Workshop Plugin](/de/plugins/skill-workshop).

## ClawHub (Installation + Synchronisierung)

ClawHub ist die öffentliche Skill-Registry für OpenClaw. Aufrufbar unter
[https://clawhub.ai](https://clawhub.ai). Verwenden Sie native `openclaw skills`-
Befehle, um Skills zu entdecken/installieren/aktualisieren, oder die separate `clawhub`-CLI, wenn
Sie Publish-/Sync-Workflows benötigen.
Vollständiger Leitfaden: [ClawHub](/de/tools/clawhub).

Häufige Abläufe:

- Einen Skill in Ihren Workspace installieren:
  - `openclaw skills install <skill-slug>`
- Alle installierten Skills aktualisieren:
  - `openclaw skills update --all`
- Synchronisieren (scannen + Updates veröffentlichen):
  - `clawhub sync --all`

Das native `openclaw skills install` installiert in das Verzeichnis `skills/`
des aktiven Workspace. Die separate `clawhub`-CLI installiert ebenfalls in `./skills` unter Ihrem
aktuellen Arbeitsverzeichnis (oder greift auf den konfigurierten OpenClaw-Workspace zurück).
OpenClaw erkennt dies in der nächsten Sitzung als `<workspace>/skills`.

## Sicherheitshinweise

- Behandeln Sie Skills von Drittanbietern als **nicht vertrauenswürdigen Code**. Lesen Sie sie, bevor Sie sie aktivieren.
- Bevorzugen Sie Sandbox-Läufe für nicht vertrauenswürdige Eingaben und riskante Tools. Siehe [Sandboxing](/de/gateway/sandboxing).
- Die Erkennung von Workspace-Skills und Skills aus zusätzlichen Verzeichnissen akzeptiert nur Skill-Roots und `SKILL.md`-Dateien, deren aufgelöster Realpath innerhalb des konfigurierten Roots bleibt.
- Gateway-gestützte Installationen von Skill-Abhängigkeiten (`skills.install`, Onboarding und die Skills-Einstellungs-UI) führen den integrierten Scanner für gefährlichen Code aus, bevor Installer-Metadaten ausgeführt werden. Findings der Stufe `critical` blockieren standardmäßig, es sei denn, der Aufrufer setzt explizit die gefährliche Überschreibung; verdächtige Findings lösen weiterhin nur Warnungen aus.
- `openclaw skills install <slug>` ist etwas anderes: Es lädt einen ClawHub-Skill-Ordner in den Workspace herunter und verwendet nicht den oben genannten Pfad für Installer-Metadaten.
- `skills.entries.*.env` und `skills.entries.*.apiKey` injizieren Secrets in den **Host**-Prozess
  für diesen Agent-Zug (nicht in die Sandbox). Halten Sie Secrets aus Prompts und Logs heraus.
- Ein breiteres Bedrohungsmodell und Checklisten finden Sie unter [Security](/de/gateway/security).

## Format (AgentSkills + Pi-kompatibel)

`SKILL.md` muss mindestens enthalten:

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
  - `user-invocable` — `true|false` (Standard: `true`). Wenn `true`, wird der Skill als Benutzer-Slash-Command bereitgestellt.
  - `disable-model-invocation` — `true|false` (Standard: `false`). Wenn `true`, wird der Skill aus dem Modell-Prompt ausgeschlossen (weiterhin per Benutzeraufruf verfügbar).
  - `command-dispatch` — `tool` (optional). Wenn auf `tool` gesetzt, umgeht der Slash-Command das Modell und dispatcht direkt an ein Tool.
  - `command-tool` — Tool-Name, der aufgerufen wird, wenn `command-dispatch: tool` gesetzt ist.
  - `command-arg-mode` — `raw` (Standard). Für Tool-Dispatch wird die rohe Argumentzeichenfolge an das Tool weitergeleitet (kein Core-Parsing).

    Das Tool wird mit folgenden Parametern aufgerufen:
    `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`.

## Gating (Filter zur Ladezeit)

OpenClaw **filtert Skills zur Ladezeit** über `metadata` (einzeiliges JSON):

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
- `emoji` — optionales Emoji, das von der macOS-Skills-UI verwendet wird.
- `homepage` — optionale URL, die in der macOS-Skills-UI als „Website“ angezeigt wird.
- `os` — optionale Liste von Plattformen (`darwin`, `linux`, `win32`). Wenn gesetzt, ist der Skill nur auf diesen Betriebssystemen zulässig.
- `requires.bins` — Liste; jeder Eintrag muss auf `PATH` existieren.
- `requires.anyBins` — Liste; mindestens ein Eintrag muss auf `PATH` existieren.
- `requires.env` — Liste; env-Variable muss existieren **oder** in der Konfiguration bereitgestellt sein.
- `requires.config` — Liste von Pfaden in `openclaw.json`, die truthy sein müssen.
- `primaryEnv` — Name der env-Variable, die mit `skills.entries.<name>.apiKey` verknüpft ist.
- `install` — optionales Array von Installer-Spezifikationen, das von der macOS-Skills-UI verwendet wird (brew/node/go/uv/download).

Hinweis zu Sandboxing:

- `requires.bins` wird auf dem **Host** zur Ladezeit des Skills geprüft.
- Wenn ein Agent in einer Sandbox läuft, muss die Binärdatei auch **im Container** existieren.
  Installieren Sie sie über `agents.defaults.sandbox.docker.setupCommand` (oder ein benutzerdefiniertes Image).
  `setupCommand` wird einmal ausgeführt, nachdem der Container erstellt wurde.
  Paketinstallationen erfordern außerdem Netzwerk-Egress, ein beschreibbares Root-FS und einen Root-Benutzer in der Sandbox.
  Beispiel: Der Skill `summarize` (`skills/summarize/SKILL.md`) benötigt die CLI `summarize`
  im Sandbox-Container, um dort ausgeführt werden zu können.

Installer-Beispiel:

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

- Wenn mehrere Installer aufgelistet sind, wählt das Gateway **eine einzige** bevorzugte Option (brew, wenn verfügbar, sonst node).
- Wenn alle Installer `download` sind, listet OpenClaw jeden Eintrag auf, damit Sie die verfügbaren Artefakte sehen können.
- Installer-Spezifikationen können `os: ["darwin"|"linux"|"win32"]` enthalten, um Optionen nach Plattform zu filtern.
- Node-Installationen berücksichtigen `skills.install.nodeManager` in `openclaw.json` (Standard: npm; Optionen: npm/pnpm/yarn/bun).
  Dies betrifft nur **Skill-Installationen**; die Laufzeit des Gateway sollte weiterhin Node sein
  (Bun wird für WhatsApp/Telegram nicht empfohlen).
- Die Auswahl des Gateway-gestützten Installers ist präferenzgesteuert, nicht nur node-basiert:
  wenn Install-Spezifikationen verschiedene Arten mischen, bevorzugt OpenClaw Homebrew, wenn
  `skills.install.preferBrew` aktiviert ist und `brew` existiert, dann `uv`, dann den
  konfigurierten Node-Manager, dann andere Fallbacks wie `go` oder `download`.
- Wenn jede Install-Spezifikation `download` ist, zeigt OpenClaw alle Download-Optionen an,
  statt sie auf einen bevorzugten Installer zu reduzieren.
- Go-Installationen: Wenn `go` fehlt und `brew` verfügbar ist, installiert das Gateway zuerst Go über Homebrew und setzt `GOBIN` nach Möglichkeit auf `bin` von Homebrew.
- Download-Installationen: `url` (erforderlich), `archive` (`tar.gz` | `tar.bz2` | `zip`), `extract` (Standard: automatisch, wenn Archiv erkannt wird), `stripComponents`, `targetDir` (Standard: `~/.openclaw/tools/<skillKey>`).

Wenn kein `metadata.openclaw` vorhanden ist, ist der Skill immer zulässig (außer
er ist in der Konfiguration deaktiviert oder wird bei gebündelten Skills durch `skills.allowBundled` blockiert).

## Konfigurationsüberschreibungen (`~/.openclaw/openclaw.json`)

Gebündelte/verwaltete Skills können umgeschaltet und mit env-Werten versorgt werden:

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

Wenn Sie standardmäßige Bildgenerierung/-bearbeitung direkt innerhalb von OpenClaw möchten, verwenden Sie das Core-
Tool `image_generate` mit `agents.defaults.imageGenerationModel` anstelle eines
gebündelten Skills. Die Skill-Beispiele hier sind für benutzerdefinierte oder Drittanbieter-Workflows gedacht.

Für native Bildanalyse verwenden Sie das Tool `image` mit `agents.defaults.imageModel`.
Für native Bildgenerierung/-bearbeitung verwenden Sie `image_generate` mit
`agents.defaults.imageGenerationModel`. Wenn Sie `openai/*`, `google/*`,
`fal/*` oder ein anderes anbieter­spezifisches Bildmodell wählen, fügen Sie auch die Auth/API-
Schlüssel dieses Anbieters hinzu.

Konfigurationsschlüssel entsprechen standardmäßig dem **Skill-Namen**. Wenn ein Skill
`metadata.openclaw.skillKey` definiert, verwenden Sie diesen Schlüssel unter `skills.entries`.

Regeln:

- `enabled: false` deaktiviert den Skill, auch wenn er gebündelt/installiert ist.
- `env`: wird **nur dann** injiziert, wenn die Variable noch nicht im Prozess gesetzt ist.
- `apiKey`: Komfortfunktion für Skills, die `metadata.openclaw.primaryEnv` deklarieren.
  Unterstützt Klartext-String oder SecretRef-Objekt (`{ source, provider, id }`).
- `config`: optionaler Beutel für benutzerdefinierte Felder pro Skill; benutzerdefinierte Schlüssel müssen hier stehen.
- `allowBundled`: optionale Allowlist nur für **gebündelte** Skills. Wenn gesetzt, sind nur
  gebündelte Skills in der Liste zulässig (verwaltete/Workspace-Skills bleiben unberührt).

## Umgebungsinjektion (pro Agent-Lauf)

Wenn ein Agent-Lauf startet, führt OpenClaw Folgendes aus:

1. Liest Skill-Metadaten.
2. Wendet `skills.entries.<key>.env` oder `skills.entries.<key>.apiKey` auf
   `process.env` an.
3. Erstellt den System-Prompt mit **zulässigen** Skills.
4. Stellt die ursprüngliche Umgebung nach Ende des Laufs wieder her.

Dies ist **auf den Agent-Lauf begrenzt**, nicht auf eine globale Shell-Umgebung.

Für das gebündelte Backend `claude-cli` materialisiert OpenClaw außerdem denselben
zulässigen Snapshot als temporäres Claude-Code-Plugin und übergibt es mit
`--plugin-dir`. Claude Code kann dann seinen nativen Skill-Resolver verwenden, während
OpenClaw weiterhin Priorität, Allowlists pro Agent, Gating und
env-/API-Key-Injektion über `skills.entries.*` verwaltet. Andere CLI-Backends verwenden nur den Prompt-
Katalog.

## Sitzungs-Snapshot (Leistung)

OpenClaw erstellt einen Snapshot der zulässigen Skills **beim Start einer Sitzung** und verwendet diese Liste für nachfolgende Züge in derselben Sitzung wieder. Änderungen an Skills oder Konfiguration werden mit der nächsten neuen Sitzung wirksam.

Skills können auch mitten in einer Sitzung aktualisiert werden, wenn der Skills-Watcher aktiviert ist oder wenn ein neuer zulässiger Remote-Node erscheint (siehe unten). Verstehen Sie dies als **Hot Reload**: Die aktualisierte Liste wird beim nächsten Agent-Zug übernommen.

Wenn sich die effektive Skill-Allowlist für diesen Agenten in der Sitzung ändert, aktualisiert OpenClaw
den Snapshot, damit die sichtbaren Skills mit dem aktuellen
Agenten übereinstimmen.

## Remote-macOS-Nodes (Linux-Gateway)

Wenn das Gateway auf Linux läuft, aber ein **macOS-Node** verbunden ist **mit erlaubtem `system.run`** (Exec-Genehmigungen in Security nicht auf `deny` gesetzt), kann OpenClaw rein macOS-spezifische Skills als zulässig behandeln, wenn die erforderlichen Binärdateien auf diesem Node vorhanden sind. Der Agent sollte diese Skills über das Tool `exec` mit `host=node` ausführen.

Dies setzt voraus, dass der Node seine Befehlsunterstützung meldet und eine Binärdateiprüfung über `system.run` erfolgt. Wenn der macOS-Node später offline geht, bleiben die Skills sichtbar; Aufrufe können fehlschlagen, bis der Node wieder verbunden ist.

## Skills-Watcher (Auto-Refresh)

Standardmäßig überwacht OpenClaw Skill-Ordner und erhöht den Skills-Snapshot, wenn sich `SKILL.md`-Dateien ändern. Konfigurieren Sie dies unter `skills.load`:

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
- **Pro Skill:** 97 Zeichen + die Länge der XML-escaped Werte in `<name>`, `<description>` und `<location>`.

Formel (Zeichen):

```
total = 195 + Σ (97 + len(name_escaped) + len(description_escaped) + len(location_escaped))
```

Hinweise:

- XML-Escaping erweitert `& < > " '` zu Entities (`&amp;`, `&lt;` usw.) und erhöht dadurch die Länge.
- Die Anzahl der Tokens variiert je nach Tokenizer des Modells. Eine grobe Schätzung im OpenAI-Stil ist ~4 Zeichen/Token, also **97 Zeichen ≈ 24 Tokens** pro Skill plus die tatsächliche Länge Ihrer Felder.

## Lebenszyklus verwalteter Skills

OpenClaw liefert einen Basissatz von Skills als **gebündelte Skills** als Teil der
Installation aus (npm-Paket oder OpenClaw.app). `~/.openclaw/skills` dient lokalen
Überschreibungen (zum Beispiel zum Pinnen/Patchen eines Skills, ohne die gebündelte
Kopie zu ändern). Workspace-Skills gehören dem Benutzer und überschreiben beide bei Namenskonflikten.

## Konfigurationsreferenz

Siehe [Skills config](/de/tools/skills-config) für das vollständige Konfigurationsschema.

## Auf der Suche nach mehr Skills?

Durchsuchen Sie [https://clawhub.ai](https://clawhub.ai).

---

## Verwandt

- [Creating Skills](/de/tools/creating-skills) — benutzerdefinierte Skills erstellen
- [Skills Config](/de/tools/skills-config) — Referenz zur Skill-Konfiguration
- [Slash Commands](/de/tools/slash-commands) — alle verfügbaren Slash-Befehle
- [Plugins](/de/tools/plugin) — Überblick über das Plugin-System
