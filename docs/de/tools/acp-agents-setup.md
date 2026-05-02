---
read_when:
    - Installieren oder Konfigurieren des acpx-Harnesses für Claude Code / Codex / Gemini CLI
    - Aktivieren der plugin-tools- oder OpenClaw-tools-MCP-Bridge
    - ACP-Berechtigungsmodi konfigurieren
summary: 'ACP-Agenten einrichten: acpx-Harness-Konfiguration, Plugin-Einrichtung, Berechtigungen'
title: ACP-Agenten — Einrichtung
x-i18n:
    generated_at: "2026-05-02T06:46:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4426219227e77d5dc57039c0c8f7324590388db141689239deaa2441609f4afd
    source_path: tools/acp-agents-setup.md
    workflow: 16
---

Für Übersicht, Operator-Runbook und Konzepte siehe [ACP-Agenten](/de/tools/acp-agents).

Die folgenden Abschnitte behandeln die acpx-Harness-Konfiguration, die Plugin-Einrichtung für die MCP-Bridges und die Berechtigungskonfiguration.

Verwenden Sie diese Seite nur, wenn Sie die ACP/acpx-Route einrichten. Für die Laufzeitkonfiguration des nativen Codex-App-Servers verwenden Sie [Codex-Harness](/de/plugins/codex-harness). Für OpenAI-API-Schlüssel oder Codex-OAuth-Konfiguration des Modell-Providers verwenden Sie [OpenAI](/de/providers/openai).

Codex hat zwei OpenClaw-Routen:

| Route                      | Konfiguration/Befehl                                  | Einrichtungsseite                       |
| -------------------------- | ------------------------------------------------------ | --------------------------------------- |
| Nativer Codex-App-Server   | `/codex ...`, `agentRuntime.id: "codex"`               | [Codex-Harness](/de/plugins/codex-harness) |
| Expliziter Codex-ACP-Adapter | `/acp spawn codex`, `runtime: "acp", agentId: "codex"` | Diese Seite                             |

Bevorzugen Sie die native Route, es sei denn, Sie benötigen ausdrücklich ACP/acpx-Verhalten.

## acpx-Harness-Unterstützung (aktuell)

Aktuelle integrierte Harness-Aliasse von acpx:

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
Wenn Ihre lokale Cursor-Installation ACP weiterhin als `agent acp` bereitstellt, überschreiben Sie den Agent-Befehl `cursor` in Ihrer acpx-Konfiguration, statt die integrierte Standardeinstellung zu ändern.

Die direkte Nutzung der acpx-CLI kann über `--agent <command>` auch beliebige Adapter ansteuern, aber diese rohe Ausweichmöglichkeit ist ein acpx-CLI-Feature (nicht der normale OpenClaw-`agentId`-Pfad).

Die Modellsteuerung hängt von den Fähigkeiten des Adapters ab. Codex-ACP-Modellreferenzen werden vor dem Start von OpenClaw normalisiert. Andere Harnesses benötigen ACP-`models` plus Unterstützung für `session/set_model`; wenn ein Harness weder diese ACP-Fähigkeit noch ein eigenes Start-Flag für das Modell bereitstellt, kann OpenClaw/acpx keine Modellauswahl erzwingen.

## Erforderliche Konfiguration

ACP-Kernbaseline:

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

Die Konfiguration der Thread-Bindung ist kanaladapterspezifisch. Beispiel für Discord:

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

Wenn das threadgebundene ACP-Spawn nicht funktioniert, prüfen Sie zuerst den Feature-Flag des Adapters:

- Discord: `channels.discord.threadBindings.spawnSessions=true`

Bindungen an die aktuelle Unterhaltung erfordern keine Erstellung von Kind-Threads. Sie erfordern einen aktiven Unterhaltungskontext und einen Kanaladapter, der ACP-Unterhaltungsbindungen bereitstellt.

Siehe [Konfigurationsreferenz](/de/gateway/configuration-reference).

## Plugin-Einrichtung für das acpx-Backend

Neuinstallationen liefern das gebündelte Laufzeit-Plugin `acpx` standardmäßig aktiviert aus, sodass ACP in der Regel ohne manuellen Plugin-Installationsschritt funktioniert.

Beginnen Sie mit:

```text
/acp doctor
```

Wenn Sie `acpx` deaktiviert, über `plugins.allow` / `plugins.deny` verweigert haben oder zu einem lokalen Entwicklungs-Checkout wechseln möchten, verwenden Sie den expliziten Plugin-Pfad:

```bash
openclaw plugins install acpx
openclaw config set plugins.entries.acpx.enabled true
```

Lokale Workspace-Installation während der Entwicklung:

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

Prüfen Sie anschließend den Zustand des Backends:

```text
/acp doctor
```

### acpx-Befehl und Versionskonfiguration

Standardmäßig registriert das gebündelte Plugin `acpx` das eingebettete ACP-Backend, ohne während des Gateway-Starts einen ACP-Agenten zu starten. Führen Sie `/acp doctor` für eine explizite Live-Prüfung aus. Setzen Sie `OPENCLAW_ACPX_RUNTIME_STARTUP_PROBE=1` nur, wenn das Gateway den konfigurierten Agenten beim Start prüfen soll.

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

- `command` akzeptiert einen absoluten Pfad, einen relativen Pfad (aufgelöst vom OpenClaw-Workspace aus) oder einen Befehlsnamen.
- `expectedVersion: "any"` deaktiviert den strikten Versionsabgleich.
- Benutzerdefinierte `command`-Pfade deaktivieren die Plugin-lokale automatische Installation.

Siehe [Plugins](/de/tools/plugin).

### Automatische Dependency-Installation

Wenn Sie OpenClaw global mit `npm install -g openclaw` installieren, werden die acpx-Laufzeit-Dependencies (plattformspezifische Binärdateien) automatisch über einen Postinstall-Hook installiert. Wenn die automatische Installation fehlschlägt, startet das Gateway dennoch normal und meldet die fehlende Dependency über `openclaw acp doctor`.

### MCP-Bridge für Plugin-Tools

Standardmäßig stellen ACPX-Sitzungen dem ACP-Harness **keine** von OpenClaw-Plugins registrierten Tools bereit.

Wenn ACP-Agenten wie Codex oder Claude Code installierte OpenClaw-Plugin-Tools wie Speicherabruf/-speicherung aufrufen können sollen, aktivieren Sie die dedizierte Bridge:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

Was dies bewirkt:

- Fügt einen integrierten MCP-Server namens `openclaw-plugin-tools` in das Bootstrap von ACPX-Sitzungen ein.
- Stellt Plugin-Tools bereit, die bereits von installierten und aktivierten OpenClaw-Plugins registriert wurden.
- Hält das Feature explizit und standardmäßig deaktiviert.

Sicherheits- und Vertrauenshinweise:

- Dies erweitert die Tool-Oberfläche des ACP-Harnesses.
- ACP-Agenten erhalten nur Zugriff auf Plugin-Tools, die bereits im Gateway aktiv sind.
- Behandeln Sie dies als dieselbe Vertrauensgrenze wie die Ausführung dieser Plugins in OpenClaw selbst.
- Prüfen Sie installierte Plugins, bevor Sie dies aktivieren.

Benutzerdefinierte `mcpServers` funktionieren weiterhin wie zuvor. Die integrierte Bridge für Plugin-Tools ist eine zusätzliche optionale Komfortfunktion, kein Ersatz für die generische MCP-Server-Konfiguration.

### MCP-Bridge für OpenClaw-Tools

Standardmäßig stellen ACPX-Sitzungen integrierte OpenClaw-Tools ebenfalls **nicht** über MCP bereit. Aktivieren Sie die separate Bridge für Core-Tools, wenn ein ACP-Agent ausgewählte integrierte Tools wie `cron` benötigt:

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

Was dies bewirkt:

- Fügt einen integrierten MCP-Server namens `openclaw-tools` in das Bootstrap von ACPX-Sitzungen ein.
- Stellt ausgewählte integrierte OpenClaw-Tools bereit. Der initiale Server stellt `cron` bereit.
- Hält die Offenlegung von Core-Tools explizit und standardmäßig deaktiviert.

### Laufzeit-Timeout-Konfiguration

Das gebündelte Plugin `acpx` setzt für eingebettete Laufzeit-Turns standardmäßig ein Timeout von 120 Sekunden. Dadurch haben langsamere Harnesses wie Gemini CLI genug Zeit, ACP-Start und Initialisierung abzuschließen. Überschreiben Sie dies, wenn Ihr Host ein anderes Laufzeitlimit benötigt:

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

Starten Sie das Gateway nach Änderung dieses Werts neu.

### Konfiguration des Agenten für Zustandsprüfungen

Wenn `/acp doctor` oder die optionale Startprüfung das Backend prüft, testet das gebündelte Plugin `acpx` einen Harness-Agenten. Wenn `acp.allowedAgents` gesetzt ist, wird standardmäßig der erste erlaubte Agent verwendet; andernfalls ist der Standard `codex`. Wenn Ihre Bereitstellung einen anderen ACP-Agenten für Zustandsprüfungen benötigt, setzen Sie den Prüf-Agenten explizit:

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

Starten Sie das Gateway nach Änderung dieses Werts neu.

## Berechtigungskonfiguration

ACP-Sitzungen laufen nicht interaktiv – es gibt kein TTY, um Berechtigungsabfragen für Dateischreibzugriffe und Shell-Ausführung zu genehmigen oder abzulehnen. Das acpx-Plugin stellt zwei Konfigurationsschlüssel bereit, die steuern, wie Berechtigungen behandelt werden:

Diese ACPX-Harness-Berechtigungen sind getrennt von OpenClaw-Ausführungsgenehmigungen und getrennt von Bypass-Flags der CLI-Backend-Vendoren wie Claude CLI `--permission-mode bypassPermissions`. ACPX `approve-all` ist der Break-Glass-Schalter auf Harness-Ebene für ACP-Sitzungen.

### `permissionMode`

Steuert, welche Operationen der Harness-Agent ohne Rückfrage ausführen kann.

| Wert            | Verhalten                                                |
| --------------- | -------------------------------------------------------- |
| `approve-all`   | Alle Dateischreibzugriffe und Shell-Befehle automatisch genehmigen. |
| `approve-reads` | Nur Lesezugriffe automatisch genehmigen; Schreibzugriffe und Ausführung erfordern Rückfragen. |
| `deny-all`      | Alle Berechtigungsabfragen ablehnen.                     |

### `nonInteractivePermissions`

Steuert, was passiert, wenn eine Berechtigungsabfrage angezeigt würde, aber kein interaktives TTY verfügbar ist (was bei ACP-Sitzungen immer der Fall ist).

| Wert   | Verhalten                                                       |
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
OpenClaw verwendet standardmäßig `permissionMode=approve-reads` und `nonInteractivePermissions=fail`. In nicht interaktiven ACP-Sitzungen kann jeder Schreib- oder Ausführungsvorgang, der eine Berechtigungsabfrage auslöst, mit `AcpRuntimeError: Permission prompt unavailable in non-interactive mode` fehlschlagen.

Wenn Sie Berechtigungen einschränken müssen, setzen Sie `nonInteractivePermissions` auf `deny`, damit Sitzungen graceful degradation nutzen, statt abzustürzen.
</Warning>

## Verwandt

- [ACP-Agenten](/de/tools/acp-agents) – Übersicht, Operator-Runbook, Konzepte
- [Sub-Agenten](/de/tools/subagents)
- [Multi-Agent-Routing](/de/concepts/multi-agent)
