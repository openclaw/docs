---
read_when:
    - Installieren oder Konfigurieren der acpx-Harness für Claude Code / Codex / Gemini CLI
    - Aktivieren der MCP-Bridge für plugin-tools oder OpenClaw-tools
    - ACP-Berechtigungsmodi konfigurieren
summary: 'ACP-Agenten einrichten: acpx-Harness-Konfiguration, Plugin-Setup, Berechtigungen'
title: ACP Agents — Einrichtung
x-i18n:
    generated_at: "2026-04-25T13:57:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: a6c23d8245c4893c48666096a296820e003685252cedee7df41ea7a2be1f4bf0
    source_path: tools/acp-agents-setup.md
    workflow: 15
---

Für den Überblick, das Runbook für Operatoren und die Konzepte siehe [ACP agents](/de/tools/acp-agents).

Die folgenden Abschnitte behandeln die Konfiguration der acpx-Harness, das Plugin-Setup für die MCP-Bridges und die Berechtigungskonfiguration.

## Unterstützung der acpx-Harness (aktuell)

Aktuelle eingebaute Harness-Aliasse von acpx:

- `claude`
- `codex`
- `copilot`
- `cursor` (Cursor CLI: `cursor-agent acp`)
- `droid`
- `gemini`
- `iflow`
- `kilocode`
- `kimi`
- `kiro`
- `openclaw`
- `opencode`
- `pi`
- `qwen`

Wenn OpenClaw das acpx-Backend verwendet, sollten Sie diese Werte für `agentId` bevorzugen, sofern Ihre acpx-Konfiguration keine benutzerdefinierten Agenten-Aliasse definiert.
Wenn Ihre lokale Cursor-Installation ACP weiterhin als `agent acp` bereitstellt, überschreiben Sie den Befehl des `cursor`-Agenten in Ihrer acpx-Konfiguration, anstatt den eingebauten Standard zu ändern.

Die direkte Nutzung der acpx-CLI kann über `--agent <command>` auch beliebige Adapter ansprechen, aber diese rohe Escape-Hatch ist eine Funktion der acpx-CLI (nicht der normale `agentId`-Pfad von OpenClaw).

## Erforderliche Konfiguration

ACP-Basis im Core:

```json5
{
  acp: {
    enabled: true,
    // Optional. Standard ist true; auf false setzen, um ACP-Dispatch zu pausieren, während /acp-Steuerungen erhalten bleiben.
    dispatch: { enabled: true },
    backend: "acpx",
    defaultAgent: "codex",
    allowedAgents: [
      "claude",
      "codex",
      "copilot",
      "cursor",
      "droid",
      "gemini",
      "iflow",
      "kilocode",
      "kimi",
      "kiro",
      "openclaw",
      "opencode",
      "pi",
      "qwen",
    ],
    maxConcurrentSessions: 8,
    stream: {
      coalesceIdleMs: 300,
      maxChunkChars: 1200,
    },
    runtime: {
      ttlMinutes: 120,
    },
  },
}
```

Die Konfiguration von Thread-Bindings ist kanalspezifisch. Beispiel für Discord:

```json5
{
  session: {
    threadBindings: {
      enabled: true,
      idleHours: 24,
      maxAgeHours: 0,
    },
  },
  channels: {
    discord: {
      threadBindings: {
        enabled: true,
        spawnAcpSessions: true,
      },
    },
  },
}
```

Wenn das Starten threadgebundener ACP-Sitzungen nicht funktioniert, prüfen Sie zuerst das Feature-Flag des Adapters:

- Discord: `channels.discord.threadBindings.spawnAcpSessions=true`

Bindings an die aktuelle Konversation erfordern keine Erstellung von Child-Threads. Sie erfordern einen aktiven Konversationskontext und einen Kanal-Adapter, der ACP-Gesprächsbindungen bereitstellt.

Siehe [Configuration Reference](/de/gateway/configuration-reference).

## Plugin-Setup für das acpx-Backend

Frische Installationen liefern das gebündelte Runtime-Plugin `acpx` standardmäßig aktiviert aus, daher funktioniert ACP normalerweise ohne manuellen Installationsschritt für Plugins.

Beginnen Sie mit:

```text
/acp doctor
```

Wenn Sie `acpx` deaktiviert, über `plugins.allow` / `plugins.deny` verweigert oder
zu einem lokalen Entwicklungs-Checkout wechseln möchten, verwenden Sie den expliziten Plugin-Pfad:

```bash
openclaw plugins install acpx
openclaw config set plugins.entries.acpx.enabled true
```

Lokale Workspace-Installation während der Entwicklung:

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

Dann den Zustand des Backends verifizieren:

```text
/acp doctor
```

### Konfiguration von acpx-Befehl und Version

Standardmäßig verwendet das gebündelte `acpx`-Plugin seine pluginlokal fixierte Binärdatei (`node_modules/.bin/acpx` innerhalb des Plugin-Pakets). Beim Start registriert es das Backend als nicht bereit, und ein Hintergrundjob prüft `acpx --version`; wenn die Binärdatei fehlt oder nicht passt, führt es `npm install --omit=dev --no-save acpx@<pinned>` aus und prüft erneut. Das Gateway bleibt dabei durchgehend nicht blockierend.

Befehl oder Version in der Plugin-Konfiguration überschreiben:

```json
{
  "plugins": {
    "entries": {
      "acpx": {
        "enabled": true,
        "config": {
          "command": "../acpx/dist/cli.js",
          "expectedVersion": "any"
        }
      }
    }
  }
}
```

- `command` akzeptiert einen absoluten Pfad, einen relativen Pfad (aufgelöst vom OpenClaw-Workspace aus) oder einen Befehlsnamen.
- `expectedVersion: "any"` deaktiviert striktes Version-Matching.
- Benutzerdefinierte `command`-Pfade deaktivieren die pluginlokale automatische Installation.

Siehe [Plugins](/de/tools/plugin).

### Automatische Installation von Abhängigkeiten

Wenn Sie OpenClaw global mit `npm install -g openclaw` installieren, werden die Laufzeitabhängigkeiten von acpx
(plattformspezifische Binärdateien) automatisch
über einen Postinstall-Hook installiert. Falls die automatische Installation fehlschlägt, startet das Gateway trotzdem
normal und meldet die fehlende Abhängigkeit über `openclaw acp doctor`.

### MCP-Bridge für Plugin-Tools

Standardmäßig exponieren ACPX-Sitzungen **nicht** die von OpenClaw-Plugins registrierten Tools für
die ACP-Harness.

Wenn ACP-Agenten wie Codex oder Claude Code installierte
Plugin-Tools von OpenClaw wie Memory Recall/Store aufrufen sollen, aktivieren Sie die dedizierte Bridge:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

Was das bewirkt:

- Injiziert einen eingebauten MCP-Server mit dem Namen `openclaw-plugin-tools` in den Bootstrap von ACPX-Sitzungen.
- Exponiert Plugin-Tools, die bereits von installierten und aktivierten OpenClaw-
  Plugins registriert wurden.
- Hält die Funktion explizit und standardmäßig deaktiviert.

Hinweise zu Sicherheit und Vertrauen:

- Dies erweitert die Tool-Oberfläche der ACP-Harness.
- ACP-Agenten erhalten nur Zugriff auf Plugin-Tools, die bereits im Gateway aktiv sind.
- Behandeln Sie dies als dieselbe Vertrauensgrenze wie bei der Ausführung dieser Plugins
  in OpenClaw selbst.
- Prüfen Sie installierte Plugins, bevor Sie dies aktivieren.

Benutzerdefinierte `mcpServers` funktionieren weiterhin wie bisher. Die eingebaute Bridge für Plugin-Tools ist
eine zusätzliche Komfortfunktion per Opt-in, kein Ersatz für die generische Konfiguration von MCP-Servern.

### MCP-Bridge für OpenClaw-Tools

Standardmäßig exponieren ACPX-Sitzungen auch eingebaute OpenClaw-Tools nicht über
MCP. Aktivieren Sie die separate Bridge für Core-Tools, wenn ein ACP-Agent ausgewählte
eingebaute Tools wie `cron` benötigt:

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

Was das bewirkt:

- Injiziert einen eingebauten MCP-Server mit dem Namen `openclaw-tools` in den Bootstrap
  von ACPX-Sitzungen.
- Exponiert ausgewählte eingebaute OpenClaw-Tools. Der erste Server exponiert `cron`.
- Hält die Exposition von Core-Tools explizit und standardmäßig deaktiviert.

### Konfiguration des Runtime-Timeouts

Das gebündelte `acpx`-Plugin setzt für eingebettete Runtime-Züge standardmäßig ein
Timeout von 120 Sekunden. Dadurch haben langsamere Harnesses wie Gemini CLI genug Zeit, den ACP-Start und die Initialisierung abzuschließen. Überschreiben Sie dies, wenn Ihr Host ein anderes
Runtime-Limit benötigt:

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

Starten Sie das Gateway nach Änderung dieses Werts neu.

### Konfiguration des Health-Probe-Agenten

Das gebündelte `acpx`-Plugin prüft einen Harness-Agenten, während es entscheidet, ob das
eingebettete Runtime-Backend bereit ist. Wenn `acp.allowedAgents` gesetzt ist, verwendet es standardmäßig
den ersten erlaubten Agenten; andernfalls standardmäßig `codex`. Wenn Ihre Bereitstellung
einen anderen ACP-Agenten für Health-Checks benötigt, setzen Sie den Probe-Agenten explizit:

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

Starten Sie das Gateway nach Änderung dieses Werts neu.

## Berechtigungskonfiguration

ACP-Sitzungen laufen nicht interaktiv — es gibt kein TTY, um Berechtigungsaufforderungen für Schreibzugriffe auf Dateien und Shell-Ausführung zu genehmigen oder abzulehnen. Das acpx-Plugin stellt zwei Konfigurationsschlüssel bereit, die steuern, wie mit Berechtigungen umgegangen wird:

Diese Berechtigungen der ACPX-Harness sind getrennt von OpenClaw-Exec-Genehmigungen und getrennt von anbieterspezifischen Bypass-Flags für CLI-Backends wie Claude CLI `--permission-mode bypassPermissions`. ACPX `approve-all` ist der Break-Glass-Schalter auf Harness-Ebene für ACP-Sitzungen.

### `permissionMode`

Steuert, welche Operationen der Harness-Agent ohne Rückfrage ausführen kann.

| Wert            | Verhalten                                                |
| --------------- | -------------------------------------------------------- |
| `approve-all`   | Alle Dateischreibvorgänge und Shell-Befehle automatisch genehmigen. |
| `approve-reads` | Nur Lesevorgänge automatisch genehmigen; Schreibvorgänge und Exec erfordern Prompts. |
| `deny-all`      | Alle Berechtigungsaufforderungen ablehnen.               |

### `nonInteractivePermissions`

Steuert, was geschieht, wenn eine Berechtigungsaufforderung angezeigt würde, aber kein interaktives TTY verfügbar ist (was bei ACP-Sitzungen immer der Fall ist).

| Wert   | Verhalten                                                        |
| ------ | ---------------------------------------------------------------- |
| `fail` | Die Sitzung mit `AcpRuntimeError` abbrechen. **(Standard)**      |
| `deny` | Die Berechtigung stillschweigend verweigern und fortfahren (graceful degradation). |

### Konfiguration

Über Plugin-Konfiguration setzen:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

Starten Sie das Gateway nach Änderung dieser Werte neu.

> **Wichtig:** OpenClaw verwendet derzeit standardmäßig `permissionMode=approve-reads` und `nonInteractivePermissions=fail`. In nicht interaktiven ACP-Sitzungen kann jeder Schreibvorgang oder Exec, der eine Berechtigungsaufforderung auslöst, mit `AcpRuntimeError: Permission prompt unavailable in non-interactive mode` fehlschlagen.
>
> Wenn Sie Berechtigungen einschränken müssen, setzen Sie `nonInteractivePermissions` auf `deny`, damit Sitzungen sich graceful degradieren, statt abzustürzen.

## Verwandt

- [ACP agents](/de/tools/acp-agents) — Überblick, Runbook für Operatoren, Konzepte
- [Sub-agents](/de/tools/subagents)
- [Multi-agent routing](/de/concepts/multi-agent)
