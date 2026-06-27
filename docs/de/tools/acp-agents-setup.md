---
read_when:
    - Installieren oder Konfigurieren des acpx-Harness für Claude Code / Codex / Gemini CLI
    - Aktivieren der MCP-Bridge plugin-tools oder OpenClaw-tools
    - ACP-Berechtigungsmodi konfigurieren
summary: 'ACP-Agenten einrichten: acpx-Harness-Konfiguration, Plugin-Einrichtung, Berechtigungen'
title: ACP-Agenten — Einrichtung
x-i18n:
    generated_at: "2026-06-27T18:15:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c56a4d3bfae71a5c91dffe7121cae6a5ae96d276d0c598251d48a60b5ffee5e5
    source_path: tools/acp-agents-setup.md
    workflow: 16
---

Eine Übersicht, das Operator-Runbook und Konzepte finden Sie unter [ACP-Agenten](/de/tools/acp-agents).

Die folgenden Abschnitte behandeln die acpx-Harness-Konfiguration, die Plugin-Einrichtung für die MCP-Bridges und die Berechtigungskonfiguration.

Verwenden Sie diese Seite nur, wenn Sie die ACP/acpx-Route einrichten. Für die native Codex-App-Server-Laufzeitkonfiguration verwenden Sie [Codex-Harness](/de/plugins/codex-harness). Für OpenAI-API-Schlüssel oder die Codex-OAuth-Konfiguration des Modell-Providers verwenden Sie [OpenAI](/de/providers/openai).

Codex hat zwei OpenClaw-Routen:

| Route                         | Konfiguration/Befehl                                  | Einrichtungsseite                       |
| ----------------------------- | ------------------------------------------------------ | --------------------------------------- |
| Nativer Codex-App-Server      | `/codex ...`, `openai/gpt-*`-Agent-Referenzen          | [Codex-Harness](/de/plugins/codex-harness) |
| Expliziter Codex-ACP-Adapter  | `/acp spawn codex`, `runtime: "acp", agentId: "codex"` | Diese Seite                             |

Bevorzugen Sie die native Route, sofern Sie nicht ausdrücklich ACP/acpx-Verhalten benötigen.

## acpx-Harness-Unterstützung (aktuell)

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
- `qwen`

Wenn OpenClaw das acpx-Backend verwendet, bevorzugen Sie diese Werte für `agentId`, sofern Ihre acpx-Konfiguration keine benutzerdefinierten Agent-Aliasse definiert.
Wenn Ihre lokale Cursor-Installation ACP noch als `agent acp` bereitstellt, überschreiben Sie den Agent-Befehl `cursor` in Ihrer acpx-Konfiguration, statt den integrierten Standard zu ändern.

Die direkte Nutzung der acpx-CLI kann über `--agent <command>` auch beliebige Adapter ansteuern, aber diese rohe Ausweichmöglichkeit ist eine acpx-CLI-Funktion (nicht der normale OpenClaw-`agentId`-Pfad).

Die Modellsteuerung hängt von den Adapter-Fähigkeiten ab. Codex-ACP-Modellreferenzen werden von OpenClaw vor dem Start normalisiert. Andere Harnesses benötigen ACP-`models` plus Unterstützung für `session/set_model`; wenn ein Harness weder diese ACP-Fähigkeit noch ein eigenes Start-Modell-Flag bereitstellt, kann OpenClaw/acpx keine Modellauswahl erzwingen.

## Erforderliche Konfiguration

ACP-Basis im Kern:

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
      "openclaw",
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

Die Thread-Bindungskonfiguration ist kanaladapter-spezifisch. Beispiel für Discord:

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

Wenn Thread-gebundenes ACP-Spawn nicht funktioniert, prüfen Sie zuerst das Adapter-Feature-Flag:

- Discord: `channels.discord.threadBindings.spawnSessions=true`

Bindungen an die aktuelle Unterhaltung erfordern keine Erstellung von Child-Threads. Sie erfordern einen aktiven Unterhaltungskontext und einen Kanaladapter, der ACP-Unterhaltungsbindungen bereitstellt.

Siehe [Konfigurationsreferenz](/de/gateway/configuration-reference).

## Plugin-Einrichtung für das acpx-Backend

Paketierte Installationen verwenden das offizielle Laufzeit-Plugin `@openclaw/acpx` für ACP.
Installieren und aktivieren Sie es, bevor Sie ACP-Harness-Sitzungen verwenden:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

Source-Checkouts können nach `pnpm install` auch das lokale Workspace-Plugin verwenden.

Starten Sie mit:

```text
/acp doctor
```

Wenn Sie `acpx` deaktiviert haben, es über `plugins.allow` / `plugins.deny` verweigert haben oder zum paketierten Plugin zurückwechseln möchten, verwenden Sie den expliziten Paketpfad:

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

Standardmäßig registriert das `acpx`-Plugin das eingebettete ACP-Backend während des Gateway-Starts und wartet vor dem `ready`-Signal des Gateway auf den Start-Probe der eingebetteten Laufzeit. Setzen Sie `OPENCLAW_ACPX_RUNTIME_STARTUP_PROBE=0` oder `OPENCLAW_SKIP_ACPX_RUNTIME_PROBE=1` nur für Skripte oder Umgebungen, die den Start-Probe absichtlich deaktiviert lassen. Führen Sie `/acp doctor` für einen expliziten Probe bei Bedarf aus.

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

- `command` akzeptiert einen absoluten Pfad, relativen Pfad (aus dem OpenClaw-Workspace aufgelöst) oder Befehlsnamen.
- `expectedVersion: "any"` deaktiviert den strikten Versionsabgleich.
- Benutzerdefinierte `command`-Pfade deaktivieren die Plugin-lokale automatische Installation.

Überschreiben Sie einen einzelnen ACP-Agent-Befehl mit strukturierten Argumenten, wenn ein Pfad oder Flag-Wert ein argv-Token bleiben soll:

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

- `agents.<id>.command` ist die ausführbare Datei oder vorhandene Befehlszeichenfolge für diesen ACP-Agenten.
- `agents.<id>.args` ist optional. Jedes Array-Element wird per Shell-Quoting maskiert, bevor OpenClaw es durch die aktuelle acpx-Befehlszeichenfolgen-Registry weitergibt.

Siehe [Plugins](/de/tools/plugin).

### Automatische Abhängigkeitsinstallation

Wenn Sie OpenClaw global mit `npm install -g openclaw` installieren, werden die acpx-Laufzeitabhängigkeiten (plattformspezifische Binärdateien) automatisch über einen Postinstall-Hook installiert. Wenn die automatische Installation fehlschlägt, startet das Gateway trotzdem normal und meldet die fehlende Abhängigkeit über `openclaw acp doctor`.

### MCP-Bridge für Plugin-Tools

Standardmäßig stellen ACPX-Sitzungen dem ACP-Harness **keine** von OpenClaw-Plugins registrierten Tools bereit.

Wenn Sie möchten, dass ACP-Agenten wie Codex oder Claude Code installierte OpenClaw-Plugin-Tools wie Memory Recall/Store aufrufen, aktivieren Sie die dedizierte Bridge:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

Das bewirkt Folgendes:

- Fügt einen integrierten MCP-Server namens `openclaw-plugin-tools` in den ACPX-Sitzungsbootstrap ein.
- Stellt Plugin-Tools bereit, die bereits von installierten und aktivierten OpenClaw-Plugins registriert wurden.
- Hält die Funktion explizit und standardmäßig deaktiviert.

Sicherheits- und Vertrauenshinweise:

- Dies erweitert die Tool-Oberfläche des ACP-Harness.
- ACP-Agenten erhalten nur Zugriff auf Plugin-Tools, die bereits im Gateway aktiv sind.
- Behandeln Sie dies als dieselbe Vertrauensgrenze, als würden Sie diese Plugins in OpenClaw selbst ausführen lassen.
- Prüfen Sie installierte Plugins, bevor Sie es aktivieren.

Benutzerdefinierte `mcpServers` funktionieren weiterhin wie zuvor. Die integrierte Plugin-Tools-Bridge ist eine zusätzliche Opt-in-Komfortfunktion, kein Ersatz für generische MCP-Server-Konfiguration.

### MCP-Bridge für OpenClaw-Tools

Standardmäßig stellen ACPX-Sitzungen auch keine integrierten OpenClaw-Tools über MCP bereit. Aktivieren Sie die separate Core-Tools-Bridge, wenn ein ACP-Agent ausgewählte integrierte Tools wie `cron` benötigt:

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

Das bewirkt Folgendes:

- Fügt einen integrierten MCP-Server namens `openclaw-tools` in den ACPX-Sitzungsbootstrap ein.
- Stellt ausgewählte integrierte OpenClaw-Tools bereit. Der anfängliche Server stellt `cron` bereit.
- Hält die Core-Tool-Bereitstellung explizit und standardmäßig deaktiviert.

### Konfiguration des Laufzeit-Operation-Timeouts

Das `acpx`-Plugin gibt dem Start der eingebetteten Laufzeit und Steuerungsoperationen standardmäßig 120 Sekunden. Das gibt langsameren Harnesses wie Gemini CLI genug Zeit, ACP-Start und Initialisierung abzuschließen. Überschreiben Sie den Wert, wenn Ihr Host ein anderes Operationslimit benötigt:

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

Laufzeit-Turns verwenden OpenClaw-Agent-/Run-Timeouts, einschließlich `/acp timeout`.
`sessions_spawn` akzeptiert keine Timeout-Überschreibungen pro Aufruf. Starten Sie das Gateway neu, nachdem Sie diesen Wert geändert haben.

### Konfiguration des Health-Probe-Agenten

Wenn `/acp doctor` oder der Start-Probe das Backend prüft, testet das gebündelte `acpx`-Plugin einen Harness-Agenten. Wenn `acp.allowedAgents` gesetzt ist, wird standardmäßig der erste erlaubte Agent verwendet; andernfalls standardmäßig `codex`. Wenn Ihre Bereitstellung einen anderen ACP-Agenten für Health Checks benötigt, setzen Sie den Probe-Agenten explizit:

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

Starten Sie das Gateway neu, nachdem Sie diesen Wert geändert haben.

## Berechtigungskonfiguration

ACP-Sitzungen laufen nicht-interaktiv - es gibt kein TTY, um Berechtigungs-Prompts für Datei-Schreibzugriffe und Shell-Ausführung zu genehmigen oder abzulehnen. Das acpx-Plugin stellt zwei Konfigurationsschlüssel bereit, die steuern, wie Berechtigungen behandelt werden:

Diese ACPX-Harness-Berechtigungen sind getrennt von OpenClaw-Exec-Genehmigungen und getrennt von CLI-Backend-Vendor-Bypass-Flags wie Claude CLI `--permission-mode bypassPermissions`. ACPX `approve-all` ist der Harness-Level-Notfallschalter für ACP-Sitzungen.

Für den breiteren Vergleich zwischen OpenClaw `tools.exec.mode`, Codex-Guardian-Genehmigungen und ACPX-Harness-Berechtigungen siehe [Berechtigungsmodi](/de/tools/permission-modes).

### `permissionMode`

Steuert, welche Operationen der Harness-Agent ohne Prompt ausführen kann.

| Wert            | Verhalten                                               |
| --------------- | ------------------------------------------------------- |
| `approve-all`   | Alle Datei-Schreibzugriffe und Shell-Befehle automatisch genehmigen. |
| `approve-reads` | Nur Lesezugriffe automatisch genehmigen; Schreibzugriffe und Exec erfordern Prompts. |
| `deny-all`      | Alle Berechtigungs-Prompts ablehnen.                    |

### `nonInteractivePermissions`

Steuert, was passiert, wenn ein Berechtigungs-Prompt angezeigt würde, aber kein interaktives TTY verfügbar ist (was bei ACP-Sitzungen immer der Fall ist).

| Wert   | Verhalten                                                        |
| ------ | ---------------------------------------------------------------- |
| `fail` | Sitzung mit `AcpRuntimeError` abbrechen. **(Standard)**          |
| `deny` | Berechtigung stillschweigend ablehnen und fortfahren (graceful degradation). |

### Konfiguration

Per Plugin-Konfiguration setzen:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

Starten Sie das Gateway neu, nachdem Sie diese Werte geändert haben.

<Warning>
OpenClaw verwendet standardmäßig `permissionMode=approve-reads` und `nonInteractivePermissions=fail`. In nicht-interaktiven ACP-Sitzungen kann jeder Schreibzugriff oder Exec, der einen Berechtigungs-Prompt auslöst, mit `AcpRuntimeError: Permission prompt unavailable in non-interactive mode` fehlschlagen.

Wenn Sie Berechtigungen einschränken müssen, setzen Sie `nonInteractivePermissions` auf `deny`, damit Sitzungen graceful degradation nutzen, statt abzustürzen.
</Warning>

## Verwandte Themen

- [ACP-Agenten](/de/tools/acp-agents) - Übersicht, Operator-Runbook, Konzepte
- [Sub-Agents](/de/tools/subagents)
- [Multi-Agent-Routing](/de/concepts/multi-agent)
