---
read_when:
    - Installieren oder Konfigurieren des acpx-Harness für Claude Code / Codex / Gemini CLI
    - Aktivieren der MCP-Bridge für plugin-tools oder OpenClaw-tools
    - ACP-Berechtigungsmodi konfigurieren
summary: 'ACP-Agenten einrichten: acpx-Harness-Konfiguration, Plugin-Einrichtung, Berechtigungen'
title: ACP-Agenten — Einrichtung
x-i18n:
    generated_at: "2026-05-02T21:03:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 92a53744f13ad4301d40c04dd28bbc28ca9d0a21070c20ddbda55ae9f6673001
    source_path: tools/acp-agents-setup.md
    workflow: 16
---

Die Übersicht, das Operator-Runbook und die Konzepte finden Sie unter [ACP-Agenten](/de/tools/acp-agents).

Die folgenden Abschnitte behandeln die acpx-Harness-Konfiguration, die Plugin-Einrichtung für die MCP-Bridges und die Berechtigungskonfiguration.

Verwenden Sie diese Seite nur, wenn Sie die ACP/acpx-Route einrichten. Für die native Codex-App-Server-Laufzeitkonfiguration verwenden Sie [Codex-Harness](/de/plugins/codex-harness). Für OpenAI-API-Schlüssel oder die Codex-OAuth-Konfiguration für Modell-Provider verwenden Sie [OpenAI](/de/providers/openai).

Codex hat zwei OpenClaw-Routen:

| Route                        | Konfiguration/Befehl                                  | Einrichtungsseite                         |
| ---------------------------- | ----------------------------------------------------- | ----------------------------------------- |
| Nativer Codex-App-Server     | `/codex ...`, `agentRuntime.id: "codex"`              | [Codex-Harness](/de/plugins/codex-harness)   |
| Expliziter Codex-ACP-Adapter | `/acp spawn codex`, `runtime: "acp", agentId: "codex"` | Diese Seite                               |

Bevorzugen Sie die native Route, sofern Sie nicht ausdrücklich ACP/acpx-Verhalten benötigen.

## acpx-Harness-Unterstützung (aktuell)

Aktuelle integrierte acpx-Harness-Aliasse:

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

Wenn OpenClaw das acpx-Backend verwendet, bevorzugen Sie diese Werte für `agentId`, sofern Ihre acpx-Konfiguration keine benutzerdefinierten Agent-Aliasse definiert.
Wenn Ihre lokale Cursor-Installation ACP noch als `agent acp` bereitstellt, überschreiben Sie den Befehl des `cursor`-Agents in Ihrer acpx-Konfiguration, statt den integrierten Standard zu ändern.

Direkte acpx-CLI-Nutzung kann über `--agent <command>` auch beliebige Adapter ansprechen, aber dieser rohe Ausweichmechanismus ist eine acpx-CLI-Funktion (nicht der normale OpenClaw-`agentId`-Pfad).

Die Modellsteuerung hängt von den Adapterfähigkeiten ab. Codex-ACP-Modellreferenzen werden vor dem Start von OpenClaw normalisiert. Andere Harnesses benötigen ACP-`models` plus Unterstützung für `session/set_model`; wenn ein Harness weder diese ACP-Fähigkeit noch ein eigenes Startmodell-Flag bereitstellt, kann OpenClaw/acpx keine Modellauswahl erzwingen.

## Erforderliche Konfiguration

ACP-Baseline für den Kern:

```json5
{
  acp: {
    enabled: true,
    // Optional. Default is true; set false to pause ACP dispatch while keeping /acp controls.
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

Die Thread-Binding-Konfiguration ist kanaladapterspezifisch. Beispiel für Discord:

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
        spawnSessions: true,
      },
    },
  },
}
```

Wenn threadgebundenes ACP-Spawn nicht funktioniert, prüfen Sie zuerst das Adapter-Feature-Flag:

- Discord: `channels.discord.threadBindings.spawnSessions=true`

Bindungen für die aktuelle Unterhaltung erfordern keine Erstellung von Child-Threads. Sie erfordern einen aktiven Unterhaltungskontext und einen Kanaladapter, der ACP-Unterhaltungsbindungen bereitstellt.

Siehe [Konfigurationsreferenz](/de/gateway/configuration-reference).

## Plugin-Einrichtung für acpx-Backend

Paketierte Installationen verwenden das offizielle `@openclaw/acpx`-Laufzeit-Plugin für ACP.
Installieren und aktivieren Sie es, bevor Sie ACP-Harness-Sitzungen verwenden:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

Source-Checkouts können nach `pnpm install` auch das lokale Workspace-Plugin verwenden.

Beginnen Sie mit:

```text
/acp doctor
```

Wenn Sie `acpx` deaktiviert, über `plugins.allow` / `plugins.deny` verweigert haben oder zurück zum paketierten Plugin wechseln möchten, verwenden Sie den expliziten Paketpfad:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

Lokale Workspace-Installation während der Entwicklung:

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

Prüfen Sie anschließend den Backend-Zustand:

```text
/acp doctor
```

### acpx-Befehl und Versionskonfiguration

Standardmäßig registriert das `acpx`-Plugin das eingebettete ACP-Backend, ohne beim Gateway-Start einen ACP-Agent zu starten. Führen Sie `/acp doctor` für eine explizite Live-Prüfung aus. Setzen Sie `OPENCLAW_ACPX_RUNTIME_STARTUP_PROBE=1` nur, wenn das Gateway den konfigurierten Agent beim Start prüfen soll.

Überschreiben Sie den Befehl oder die Version in der Plugin-Konfiguration:

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

- `command` akzeptiert einen absoluten Pfad, einen relativen Pfad (aufgelöst vom OpenClaw-Workspace) oder einen Befehlsnamen.
- `expectedVersion: "any"` deaktiviert den strikten Versionsabgleich.
- Benutzerdefinierte `command`-Pfade deaktivieren die Plugin-lokale automatische Installation.

Siehe [Plugins](/de/tools/plugin).

### Automatische Installation von Abhängigkeiten

Wenn Sie OpenClaw global mit `npm install -g openclaw` installieren, werden die acpx-Laufzeitabhängigkeiten (plattformspezifische Binärdateien) automatisch über einen Postinstall-Hook installiert. Wenn die automatische Installation fehlschlägt, startet das Gateway weiterhin normal und meldet die fehlende Abhängigkeit über `openclaw acp doctor`.

### MCP-Bridge für Plugin-Tools

Standardmäßig stellen ACPX-Sitzungen dem ACP-Harness **keine** von OpenClaw-Plugins registrierten Tools bereit.

Wenn ACP-Agenten wie Codex oder Claude Code installierte OpenClaw-Plugin-Tools wie Speicherabruf/-speicherung aufrufen sollen, aktivieren Sie die dedizierte Bridge:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

Dies bewirkt Folgendes:

- Fügt einen integrierten MCP-Server namens `openclaw-plugin-tools` in den Bootstrap der ACPX-Sitzung ein.
- Stellt Plugin-Tools bereit, die bereits von installierten und aktivierten OpenClaw-Plugins registriert wurden.
- Hält die Funktion explizit und standardmäßig deaktiviert.

Sicherheits- und Vertrauenshinweise:

- Dies erweitert die Tool-Oberfläche des ACP-Harness.
- ACP-Agenten erhalten nur Zugriff auf Plugin-Tools, die bereits im Gateway aktiv sind.
- Behandeln Sie dies als dieselbe Vertrauensgrenze wie das Ausführen dieser Plugins in OpenClaw selbst.
- Prüfen Sie installierte Plugins, bevor Sie dies aktivieren.

Benutzerdefinierte `mcpServers` funktionieren weiterhin wie zuvor. Die integrierte Plugin-Tools-Bridge ist eine zusätzliche Opt-in-Komfortfunktion, kein Ersatz für generische MCP-Serverkonfiguration.

### MCP-Bridge für OpenClaw-Tools

Standardmäßig stellen ACPX-Sitzungen auch integrierte OpenClaw-Tools nicht über MCP bereit. Aktivieren Sie die separate Core-Tools-Bridge, wenn ein ACP-Agent ausgewählte integrierte Tools wie `cron` benötigt:

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

Dies bewirkt Folgendes:

- Fügt einen integrierten MCP-Server namens `openclaw-tools` in den Bootstrap der ACPX-Sitzung ein.
- Stellt ausgewählte integrierte OpenClaw-Tools bereit. Der initiale Server stellt `cron` bereit.
- Hält die Core-Tool-Bereitstellung explizit und standardmäßig deaktiviert.

### Laufzeit-Timeout-Konfiguration

Das `acpx`-Plugin setzt für eingebettete Laufzeit-Turns standardmäßig ein Timeout von 120 Sekunden. Dadurch haben langsamere Harnesses wie Gemini CLI genug Zeit, ACP-Start und Initialisierung abzuschließen. Überschreiben Sie dies, wenn Ihr Host ein anderes Laufzeitlimit benötigt:

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

Starten Sie das Gateway nach Änderung dieses Werts neu.

### Konfiguration des Health-Probe-Agents

Wenn `/acp doctor` oder die Opt-in-Startprüfung das Backend prüft, prüft das gebündelte `acpx`-Plugin einen Harness-Agent. Wenn `acp.allowedAgents` gesetzt ist, wird standardmäßig der erste erlaubte Agent verwendet; andernfalls ist der Standard `codex`. Wenn Ihre Bereitstellung einen anderen ACP-Agent für Health-Checks benötigt, setzen Sie den Probe-Agent explizit:

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

Starten Sie das Gateway nach Änderung dieses Werts neu.

## Berechtigungskonfiguration

ACP-Sitzungen laufen nicht interaktiv: Es gibt kein TTY, um Berechtigungsabfragen für Dateischreibzugriffe und Shell-Ausführung zu genehmigen oder abzulehnen. Das acpx-Plugin stellt zwei Konfigurationsschlüssel bereit, die steuern, wie Berechtigungen behandelt werden:

Diese ACPX-Harness-Berechtigungen sind getrennt von OpenClaw-Ausführungsgenehmigungen und getrennt von CLI-Backend-vendorspezifischen Bypass-Flags wie Claude CLI `--permission-mode bypassPermissions`. ACPX `approve-all` ist der Harness-seitige Notfallschalter für ACP-Sitzungen.

### `permissionMode`

Steuert, welche Operationen der Harness-Agent ohne Nachfrage ausführen kann.

| Wert            | Verhalten                                                |
| --------------- | -------------------------------------------------------- |
| `approve-all`   | Alle Dateischreibzugriffe und Shell-Befehle automatisch genehmigen. |
| `approve-reads` | Nur Lesezugriffe automatisch genehmigen; Schreibzugriffe und Ausführung erfordern Abfragen. |
| `deny-all`      | Alle Berechtigungsabfragen ablehnen.                     |

### `nonInteractivePermissions`

Steuert, was passiert, wenn eine Berechtigungsabfrage angezeigt würde, aber kein interaktives TTY verfügbar ist (was bei ACP-Sitzungen immer der Fall ist).

| Wert   | Verhalten                                                        |
| ------ | ---------------------------------------------------------------- |
| `fail` | Sitzung mit `AcpRuntimeError` abbrechen. **(Standard)**          |
| `deny` | Berechtigung stillschweigend ablehnen und fortfahren (graceful degradation). |

### Konfiguration

Über Plugin-Konfiguration setzen:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

Starten Sie das Gateway nach Änderung dieser Werte neu.

<Warning>
OpenClaw verwendet standardmäßig `permissionMode=approve-reads` und `nonInteractivePermissions=fail`. In nicht interaktiven ACP-Sitzungen kann jeder Schreibzugriff oder jede Ausführung, die eine Berechtigungsabfrage auslöst, mit `AcpRuntimeError: Permission prompt unavailable in non-interactive mode` fehlschlagen.

Wenn Sie Berechtigungen einschränken müssen, setzen Sie `nonInteractivePermissions` auf `deny`, damit Sitzungen kontrolliert degradieren, statt abzustürzen.
</Warning>

## Verwandt

- [ACP-Agenten](/de/tools/acp-agents) — Übersicht, Operator-Runbook, Konzepte
- [Sub-Agents](/de/tools/subagents)
- [Multi-Agent-Routing](/de/concepts/multi-agent)
