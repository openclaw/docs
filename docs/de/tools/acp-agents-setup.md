---
read_when:
    - Installieren oder Konfigurieren des acpx-Harness für Claude Code / Codex / Gemini CLI
    - Aktivieren der MCP-Bridge für plugin-tools oder OpenClaw-tools
    - Konfigurieren von ACP-Berechtigungsmodi
summary: 'Einrichten von ACP-Agents: Konfiguration des acpx-Harness, Plugin-Setup, Berechtigungen'
title: ACP Agents — Setup
x-i18n:
    generated_at: "2026-04-26T11:39:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5c7a638dd26b9343ea5a183954dd3ce3822b904bd2f46dd24f13a6785a646ea3
    source_path: tools/acp-agents-setup.md
    workflow: 15
---

Für Überblick, Operator-Runbook und Konzepte siehe [ACP agents](/de/tools/acp-agents).

Die folgenden Abschnitte behandeln die Konfiguration des acpx-Harness, das Plugin-Setup für die MCP-Bridges und die Konfiguration der Berechtigungen.

Verwenden Sie diese Seite nur, wenn Sie die ACP-/acpx-Route einrichten. Für die Konfiguration der nativen Codex-
App-Server-Laufzeit verwenden Sie [Codex harness](/de/plugins/codex-harness). Für
OpenAI-API-Schlüssel oder die Konfiguration von Modell-Providern mit Codex OAuth verwenden Sie
[OpenAI](/de/providers/openai).

Codex hat in OpenClaw zwei Routen:

| Route                        | Konfiguration/Befehl                                   | Setup-Seite                             |
| ---------------------------- | ------------------------------------------------------ | --------------------------------------- |
| Nativer Codex-App-Server     | `/codex ...`, `agentRuntime.id: "codex"`               | [Codex harness](/de/plugins/codex-harness) |
| Expliziter Codex ACP adapter | `/acp spawn codex`, `runtime: "acp", agentId: "codex"` | Diese Seite                             |

Bevorzugen Sie die native Route, sofern Sie nicht ausdrücklich ACP-/acpx-Verhalten benötigen.

## Unterstützung des acpx-Harness (aktuell)

Aktuelle integrierte Aliasnamen für acpx-Harnesses:

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

Wenn OpenClaw das Backend acpx verwendet, bevorzugen Sie diese Werte für `agentId`, sofern Ihre acpx-Konfiguration keine benutzerdefinierten Agent-Aliasse definiert.
Wenn Ihre lokale Cursor-Installation ACP weiterhin als `agent acp` bereitstellt, überschreiben Sie stattdessen den Befehl des Agent `cursor` in Ihrer acpx-Konfiguration, statt den integrierten Standard zu ändern.

Direkte Nutzung der acpx-CLI kann auch beliebige Adapter über `--agent <command>` ansprechen, aber dieser rohe Escape-Hatch ist eine Funktion der acpx-CLI (nicht der normale OpenClaw-Pfad über `agentId`).

Modellsteuerung hängt von den Fähigkeiten des Adapters ab. Codex-ACP-Modell-Refs werden
vor dem Start von OpenClaw normalisiert. Andere Harnesses benötigen ACP `models` plus
Unterstützung für `session/set_model`; wenn ein Harness weder diese ACP-Fähigkeit
noch ein eigenes Start-Flag für das Modell bereitstellt, können OpenClaw/acpx keine Modellauswahl erzwingen.

## Erforderliche Konfiguration

Grundlegende ACP-Basis:

```json5
{
  acp: {
    enabled: true,
    // Optional. Standard ist true; auf false setzen, um ACP-Dispatch zu pausieren und /acp-Steuerung beizubehalten.
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

Die Konfiguration für Thread-Bindings ist spezifisch für Kanal-Adapter. Beispiel für Discord:

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

Wenn das threadgebundene ACP-Spawn nicht funktioniert, prüfen Sie zuerst das Feature-Flag des Adapters:

- Discord: `channels.discord.threadBindings.spawnAcpSessions=true`

Bindings an die aktuelle Konversation erfordern keine Erstellung eines Child-Threads. Sie erfordern einen aktiven Konversationskontext und einen Kanal-Adapter, der ACP-Konversations-Bindings bereitstellt.

Siehe [Configuration Reference](/de/gateway/configuration-reference).

## Plugin-Setup für das Backend acpx

Frische Installationen liefern das mitgelieferte Laufzeit-Plugin `acpx` standardmäßig aktiviert aus, daher funktioniert ACP
in der Regel ohne manuellen Plugin-Installationsschritt.

Beginnen Sie mit:

```text
/acp doctor
```

Wenn Sie `acpx` deaktiviert, über `plugins.allow` / `plugins.deny` verboten haben oder
stattdessen zu einem lokalen Entwicklungs-Checkout wechseln möchten, verwenden Sie den expliziten Plugin-Pfad:

```bash
openclaw plugins install acpx
openclaw config set plugins.entries.acpx.enabled true
```

Lokale Workspace-Installation während der Entwicklung:

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

Dann den Zustand des Backends prüfen:

```text
/acp doctor
```

### Konfiguration von acpx-Befehl und Version

Standardmäßig registriert das mitgelieferte Plugin `acpx` das eingebettete ACP-Backend, ohne
beim Start des Gateway einen ACP-Agent zu starten. Führen Sie `/acp doctor` für eine explizite
Live-Probe aus. Setzen Sie `OPENCLAW_ACPX_RUNTIME_STARTUP_PROBE=1` nur dann, wenn das
Gateway den konfigurierten Agent beim Start prüfen soll.

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

- `command` akzeptiert einen absoluten Pfad, relativen Pfad (aufgelöst vom OpenClaw-Workspace aus) oder einen Befehlsnamen.
- `expectedVersion: "any"` deaktiviert die strikte Versionsprüfung.
- Benutzerdefinierte Pfade in `command` deaktivieren die plugin-lokale automatische Installation.

Siehe [Plugins](/de/tools/plugin).

### Automatische Installation von Abhängigkeiten

Wenn Sie OpenClaw global mit `npm install -g openclaw` installieren, werden die Laufzeitabhängigkeiten von acpx
(plattformspezifische Binaries) automatisch
über einen Postinstall-Hook installiert. Wenn die automatische Installation fehlschlägt, startet das Gateway trotzdem
normal und meldet die fehlende Abhängigkeit über `openclaw acp doctor`.

### MCP-Bridge für Plugin-Tools

Standardmäßig stellen ACPX-Sitzungen registrierte Plugin-Tools von OpenClaw dem
ACP-Harness **nicht** bereit.

Wenn ACP-Agents wie Codex oder Claude Code installierte
Plugin-Tools von OpenClaw wie Memory Recall/Store aufrufen können sollen, aktivieren Sie die dedizierte Bridge:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

Was dies bewirkt:

- Injiziert einen integrierten MCP-Server namens `openclaw-plugin-tools` in den ACPX-Sitzungs-
  Bootstrap.
- Stellt Plugin-Tools bereit, die bereits durch installierte und aktivierte OpenClaw-
  Plugins registriert wurden.
- Hält die Funktion explizit und standardmäßig deaktiviert.

Hinweise zu Sicherheit und Vertrauen:

- Dies erweitert die Tool-Oberfläche des ACP-Harness.
- ACP-Agents erhalten nur Zugriff auf Plugin-Tools, die bereits im Gateway aktiv sind.
- Behandeln Sie dies als dieselbe Vertrauensgrenze, als würden diese Plugins in
  OpenClaw selbst ausgeführt.
- Prüfen Sie installierte Plugins, bevor Sie dies aktivieren.

Benutzerdefinierte `mcpServers` funktionieren weiterhin wie bisher. Die integrierte Bridge für Plugin-Tools ist eine
zusätzliche bequeme Opt-in-Funktion, kein Ersatz für generische MCP-Server-Konfiguration.

### MCP-Bridge für OpenClaw-Tools

Standardmäßig stellen ACPX-Sitzungen auch integrierte OpenClaw-Tools über
MCP **nicht** bereit. Aktivieren Sie die separate Bridge für Core-Tools, wenn ein ACP-Agent ausgewählte
integrierte Tools wie `cron` benötigt:

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

Was dies bewirkt:

- Injiziert einen integrierten MCP-Server namens `openclaw-tools` in den ACPX-Sitzungs-
  Bootstrap.
- Stellt ausgewählte integrierte OpenClaw-Tools bereit. Der erste Server stellt `cron` bereit.
- Hält die Freigabe von Core-Tools explizit und standardmäßig deaktiviert.

### Konfiguration des Laufzeit-Timeouts

Das mitgelieferte Plugin `acpx` verwendet für eingebettete Laufzeitdurchläufe standardmäßig ein
Timeout von 120 Sekunden. Dadurch haben langsamere Harnesses wie Gemini CLI genug Zeit, den
ACP-Start und die Initialisierung abzuschließen. Überschreiben Sie dies, wenn Ihr Host ein anderes
Laufzeitlimit benötigt:

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

Starten Sie das Gateway neu, nachdem Sie diesen Wert geändert haben.

### Konfiguration des Health-Probe-Agent

Wenn `/acp doctor` oder die optionale Startup-Probe das Backend prüft, prüft das mitgelieferte
Plugin `acpx` einen Harness-Agent. Wenn `acp.allowedAgents` gesetzt ist, wird standardmäßig
der erste erlaubte Agent verwendet; andernfalls ist der Standard `codex`. Wenn Ihre
Bereitstellung einen anderen ACP-Agent für Health-Checks benötigt, setzen Sie den Probe-Agent explizit:

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

Starten Sie das Gateway neu, nachdem Sie diesen Wert geändert haben.

## Konfiguration der Berechtigungen

ACP-Sitzungen laufen nicht interaktiv — es gibt kein TTY, um Aufforderungen zur Genehmigung oder Ablehnung von Dateischreib- und Shell-Exec-Berechtigungen zu beantworten. Das Plugin acpx stellt zwei Konfigurationsschlüssel bereit, die steuern, wie mit Berechtigungen umgegangen wird:

Diese ACPX-Harness-Berechtigungen sind getrennt von OpenClaw-Exec-Genehmigungen und getrennt von CLI-Backend-spezifischen Bypass-Flags wie Claude CLI `--permission-mode bypassPermissions`. ACPX `approve-all` ist der Break-Glass-Schalter auf Harness-Ebene für ACP-Sitzungen.

### `permissionMode`

Steuert, welche Operationen der Harness-Agent ohne Prompt ausführen kann.

| Wert            | Verhalten                                                |
| --------------- | -------------------------------------------------------- |
| `approve-all`   | Alle Dateischreibvorgänge und Shell-Befehle automatisch genehmigen. |
| `approve-reads` | Nur Lesevorgänge automatisch genehmigen; Schreiben und Exec erfordern Prompts. |
| `deny-all`      | Alle Berechtigungsaufforderungen ablehnen.               |

### `nonInteractivePermissions`

Steuert, was passiert, wenn eine Berechtigungsaufforderung angezeigt würde, aber kein interaktives TTY verfügbar ist (was bei ACP-Sitzungen immer der Fall ist).

| Wert   | Verhalten                                                           |
| ------ | ------------------------------------------------------------------- |
| `fail` | Sitzung mit `AcpRuntimeError` abbrechen. **(Standard)**             |
| `deny` | Berechtigung stillschweigend verweigern und fortfahren (graceful degradation). |

### Konfiguration

Über die Plugin-Konfiguration setzen:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

Starten Sie das Gateway neu, nachdem Sie diese Werte geändert haben.

> **Wichtig:** OpenClaw verwendet derzeit standardmäßig `permissionMode=approve-reads` und `nonInteractivePermissions=fail`. In nicht interaktiven ACP-Sitzungen kann jeder Schreib- oder Exec-Vorgang, der eine Berechtigungsaufforderung auslöst, mit `AcpRuntimeError: Permission prompt unavailable in non-interactive mode` fehlschlagen.
>
> Wenn Sie Berechtigungen einschränken müssen, setzen Sie `nonInteractivePermissions` auf `deny`, damit Sitzungen graceful degradieren, statt abzustürzen.

## Verwandt

- [ACP agents](/de/tools/acp-agents) — Überblick, Operator-Runbook, Konzepte
- [Sub-agents](/de/tools/subagents)
- [Multi-agent routing](/de/concepts/multi-agent)
