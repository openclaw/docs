---
read_when:
    - Installation oder Konfiguration des acpx-Harnesses für Claude Code / Codex / Gemini CLI
    - Aktivieren der MCP-Bridge plugin-tools oder OpenClaw-tools
    - ACP-Berechtigungsmodi konfigurieren
summary: 'ACP-Agenten einrichten: acpx-Harness-Konfiguration, Plugin-Einrichtung, Berechtigungen'
title: ACP-Agenten — Einrichtung
x-i18n:
    generated_at: "2026-05-10T19:53:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 68515dc3c97e511dbbf257131e24f8e4de36b1eb47ff717ae1cc5b4980e85cdf
    source_path: tools/acp-agents-setup.md
    workflow: 16
---

Für die Übersicht, das Operator-Runbook und die Konzepte siehe [ACP-Agenten](/de/tools/acp-agents).

Die folgenden Abschnitte behandeln die acpx-Harness-Konfiguration, die Plugin-Einrichtung für die MCP-Bridges und die Berechtigungskonfiguration.

Verwenden Sie diese Seite nur, wenn Sie die ACP/acpx-Route einrichten. Für die native Runtime-Konfiguration des Codex-App-Servers verwenden Sie [Codex-Harness](/de/plugins/codex-harness). Für OpenAI-API-Schlüssel oder die Codex-OAuth-Modell-Provider-Konfiguration verwenden Sie [OpenAI](/de/providers/openai).

Codex hat zwei OpenClaw-Routen:

| Route                         | Konfiguration/Befehl                                   | Einrichtungsseite                       |
| ----------------------------- | ------------------------------------------------------ | --------------------------------------- |
| Nativer Codex-App-Server      | `/codex ...`, `openai/gpt-*` agent refs                | [Codex-Harness](/de/plugins/codex-harness) |
| Expliziter Codex-ACP-Adapter  | `/acp spawn codex`, `runtime: "acp", agentId: "codex"` | Diese Seite                             |

Bevorzugen Sie die native Route, sofern Sie nicht ausdrücklich ACP/acpx-Verhalten benötigen.

## Unterstützung für den acpx-Harness (aktuell)

Aktuelle integrierte acpx-Harness-Aliasse:

- `claude`
- `codex`
- `copilot`
- `cursor` (Cursor-CLI: `cursor-agent acp`)
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
Wenn Ihre lokale Cursor-Installation ACP weiterhin als `agent acp` bereitstellt, überschreiben Sie den Befehl des `cursor`-Agents in Ihrer acpx-Konfiguration, anstatt den integrierten Standard zu ändern.

Die direkte Verwendung der acpx-CLI kann über `--agent <command>` auch beliebige Adapter ansprechen, aber diese rohe Ausweichmöglichkeit ist eine acpx-CLI-Funktion (nicht der normale OpenClaw-`agentId`-Pfad).

Die Modellsteuerung hängt von den Adapter-Fähigkeiten ab. Codex-ACP-Modell-Refs werden vor dem Start von OpenClaw normalisiert. Andere Harnesses benötigen ACP-`models` sowie Unterstützung für `session/set_model`; wenn ein Harness weder diese ACP-Fähigkeit noch ein eigenes Startmodell-Flag bereitstellt, kann OpenClaw/acpx keine Modellauswahl erzwingen.

## Erforderliche Konfiguration

ACP-Core-Baseline:

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

Die Thread-Binding-Konfiguration ist spezifisch für den Channel-Adapter. Beispiel für Discord:

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

Wenn threadgebundenes ACP-Spawn nicht funktioniert, prüfen Sie zuerst das Feature-Flag des Adapters:

- Discord: `channels.discord.threadBindings.spawnSessions=true`

Bindings für die aktuelle Unterhaltung erfordern keine Erstellung von Child-Threads. Sie erfordern einen aktiven Unterhaltungskontext und einen Channel-Adapter, der ACP-Unterhaltungs-Bindings bereitstellt.

Siehe [Konfigurationsreferenz](/de/gateway/configuration-reference).

## Plugin-Einrichtung für das acpx-Backend

Paketierte Installationen verwenden das offizielle Runtime-Plugin `@openclaw/acpx` für ACP.
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

Wenn Sie `acpx` deaktiviert haben, es über `plugins.allow` / `plugins.deny` verweigert haben oder zurück zum paketierten Plugin wechseln möchten, verwenden Sie den expliziten Paketpfad:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

Lokale Workspace-Installation während der Entwicklung:

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

Prüfen Sie anschließend die Backend-Gesundheit:

```text
/acp doctor
```

### acpx-Befehl und Versionskonfiguration

Standardmäßig prüft das `acpx`-Plugin das eingebettete ACP-Backend während des Gateway-Starts und wartet auf diese Prüfung, bevor das Gateway-`ready`-Signal gesendet wird. Setzen Sie `OPENCLAW_ACPX_RUNTIME_STARTUP_PROBE=0`, um die Startprüfung zu überspringen und das Backend stattdessen verzögert zu registrieren. Führen Sie `/acp doctor` für eine explizite bedarfsorientierte Prüfung aus.

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

- `command` akzeptiert einen absoluten Pfad, relativen Pfad (aufgelöst vom OpenClaw-Workspace) oder Befehlsnamen.
- `expectedVersion: "any"` deaktiviert strikte Versionsübereinstimmung.
- Benutzerdefinierte `command`-Pfade deaktivieren die Plugin-lokale automatische Installation.

Überschreiben Sie einen einzelnen ACP-Agent-Befehl mit strukturierten Argumenten, wenn ein Pfad oder Flag-Wert ein einzelnes argv-Token bleiben soll:

```json
{
  "plugins": {
    "entries": {
      "acpx": {
        "enabled": true,
        "config": {
          "agents": {
            "claude": {
              "command": "node",
              "args": ["/path/to/custom adapter.mjs", "--verbose"]
            }
          }
        }
      }
    }
  }
}
```

- `agents.<id>.command` ist die ausführbare Datei oder vorhandene Befehlszeichenfolge für diesen ACP-Agent.
- `agents.<id>.args` ist optional. Jedes Array-Element wird Shell-gequotet, bevor OpenClaw es über die aktuelle acpx-Befehlszeichenfolgen-Registry weitergibt.

Siehe [Plugins](/de/tools/plugin).

### Automatische Installation von Abhängigkeiten

Wenn Sie OpenClaw global mit `npm install -g openclaw` installieren, werden die acpx-Runtime-Abhängigkeiten (plattformspezifische Binärdateien) automatisch über einen Postinstall-Hook installiert. Wenn die automatische Installation fehlschlägt, startet das Gateway weiterhin normal und meldet die fehlende Abhängigkeit über `openclaw acp doctor`.

### MCP-Bridge für Plugin-Tools

Standardmäßig stellen ACPX-Sitzungen dem ACP-Harness **keine** von OpenClaw-Plugins registrierten Tools bereit.

Wenn Sie möchten, dass ACP-Agenten wie Codex oder Claude Code installierte OpenClaw-Plugin-Tools wie Memory Recall/Store aufrufen, aktivieren Sie die dedizierte Bridge:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

Was dies bewirkt:

- Fügt einen integrierten MCP-Server namens `openclaw-plugin-tools` in den Bootstrap der ACPX-Sitzung ein.
- Stellt Plugin-Tools bereit, die bereits von installierten und aktivierten OpenClaw-Plugins registriert wurden.
- Hält die Funktion explizit und standardmäßig deaktiviert.

Sicherheits- und Vertrauenshinweise:

- Dies erweitert die Tool-Oberfläche des ACP-Harness.
- ACP-Agenten erhalten nur Zugriff auf Plugin-Tools, die bereits im Gateway aktiv sind.
- Behandeln Sie dies als dieselbe Vertrauensgrenze, als würden Sie diese Plugins in OpenClaw selbst ausführen lassen.
- Prüfen Sie installierte Plugins, bevor Sie dies aktivieren.

Benutzerdefinierte `mcpServers` funktionieren weiterhin wie zuvor. Die integrierte Plugin-Tools-Bridge ist eine zusätzliche Opt-in-Komfortfunktion, kein Ersatz für generische MCP-Server-Konfiguration.

### MCP-Bridge für OpenClaw-Tools

Standardmäßig stellen ACPX-Sitzungen integrierte OpenClaw-Tools ebenfalls **nicht** über MCP bereit. Aktivieren Sie die separate Core-Tools-Bridge, wenn ein ACP-Agent ausgewählte integrierte Tools wie `cron` benötigt:

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

Was dies bewirkt:

- Fügt einen integrierten MCP-Server namens `openclaw-tools` in den Bootstrap der ACPX-Sitzung ein.
- Stellt ausgewählte integrierte OpenClaw-Tools bereit. Der anfängliche Server stellt `cron` bereit.
- Hält die Core-Tool-Bereitstellung explizit und standardmäßig deaktiviert.

### Runtime-Timeout-Konfiguration

Das `acpx`-Plugin setzt für eingebettete Runtime-Turns standardmäßig ein Timeout von 120 Sekunden. Dies gibt langsameren Harnesses wie Gemini CLI genug Zeit, ACP-Start und Initialisierung abzuschließen. Überschreiben Sie den Wert, wenn Ihr Host ein anderes Runtime-Limit benötigt:

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

Starten Sie das Gateway neu, nachdem Sie diesen Wert geändert haben.

### Konfiguration des Health-Probe-Agents

Wenn `/acp doctor` oder die Startprüfung das Backend prüft, prüft das gebündelte `acpx`-Plugin einen Harness-Agent. Wenn `acp.allowedAgents` gesetzt ist, wird standardmäßig der erste erlaubte Agent verwendet; andernfalls ist der Standard `codex`. Wenn Ihre Bereitstellung einen anderen ACP-Agent für Health Checks benötigt, setzen Sie den Probe-Agent explizit:

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

Starten Sie das Gateway neu, nachdem Sie diesen Wert geändert haben.

## Berechtigungskonfiguration

ACP-Sitzungen laufen nicht interaktiv; es gibt kein TTY, um Berechtigungsabfragen für Dateischreibvorgänge und Shell-Ausführung zu genehmigen oder abzulehnen. Das acpx-Plugin stellt zwei Konfigurationsschlüssel bereit, die steuern, wie Berechtigungen behandelt werden:

Diese ACPX-Harness-Berechtigungen sind getrennt von OpenClaw-Exec-Genehmigungen und getrennt von Bypass-Flags der CLI-Backend-Vendoren wie Claude CLI `--permission-mode bypassPermissions`. ACPX `approve-all` ist der Harness-Level-Notfallschalter für ACP-Sitzungen.

### `permissionMode`

Steuert, welche Operationen der Harness-Agent ohne Abfrage ausführen kann.

| Wert            | Verhalten                                                  |
| --------------- | ---------------------------------------------------------- |
| `approve-all`   | Alle Dateischreibvorgänge und Shell-Befehle automatisch genehmigen. |
| `approve-reads` | Nur Lesevorgänge automatisch genehmigen; Schreibvorgänge und Exec erfordern Abfragen. |
| `deny-all`      | Alle Berechtigungsabfragen ablehnen.                       |

### `nonInteractivePermissions`

Steuert, was passiert, wenn eine Berechtigungsabfrage angezeigt würde, aber kein interaktives TTY verfügbar ist (was bei ACP-Sitzungen immer der Fall ist).

| Wert   | Verhalten                                                        |
| ------ | ---------------------------------------------------------------- |
| `fail` | Sitzung mit `AcpRuntimeError` abbrechen. **(Standard)**          |
| `deny` | Berechtigung stillschweigend verweigern und fortfahren (graceful degradation). |

### Konfiguration

Über die Plugin-Konfiguration setzen:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

Starten Sie das Gateway neu, nachdem Sie diese Werte geändert haben.

<Warning>
OpenClaw verwendet standardmäßig `permissionMode=approve-reads` und `nonInteractivePermissions=fail`. In nicht interaktiven ACP-Sitzungen kann jeder Schreib- oder Exec-Vorgang, der eine Berechtigungsabfrage auslöst, mit `AcpRuntimeError: Permission prompt unavailable in non-interactive mode` fehlschlagen.

Wenn Sie Berechtigungen einschränken müssen, setzen Sie `nonInteractivePermissions` auf `deny`, damit Sitzungen graceful degradieren, anstatt abzustürzen.
</Warning>

## Verwandt

- [ACP-Agenten](/de/tools/acp-agents) — Übersicht, Operator-Runbook, Konzepte
- [Sub-Agenten](/de/tools/subagents)
- [Multi-Agent-Routing](/de/concepts/multi-agent)
