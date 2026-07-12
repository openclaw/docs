---
read_when:
    - Installieren oder Konfigurieren des acpx-Harness für Claude Code / Codex / Gemini CLI
    - Aktivieren der MCP-Bridge für plugin-tools oder OpenClaw-tools
    - ACP-Berechtigungsmodi konfigurieren
summary: 'ACP-Agenten einrichten: acpx-Harness-Konfiguration, Plugin-Einrichtung, Berechtigungen'
title: ACP-Agenten — Einrichtung
x-i18n:
    generated_at: "2026-07-12T15:56:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 6a654c7513df0bd54dc69eecc45a408df76c852bcf1d9e932b960f4944fa4239
    source_path: tools/acp-agents-setup.md
    workflow: 16
---

Eine Übersicht, das Betriebshandbuch und die Konzepte finden Sie unter [ACP-Agenten](/de/tools/acp-agents).

Diese Seite behandelt die acpx-Harness-Konfiguration, die Plugin-Einrichtung für die MCP-Bridges und die Berechtigungskonfiguration.

Verwenden Sie diese Seite nur, wenn Sie die ACP/acpx-Route einrichten. Für die native Codex-
App-Server-Laufzeitkonfiguration verwenden Sie [Codex-Harness](/de/plugins/codex-harness). Für
OpenAI-API-Schlüssel oder die Codex-OAuth-Konfiguration des Modell-Providers verwenden Sie
[OpenAI](/de/providers/openai).

Codex verfügt über zwei OpenClaw-Routen:

| Route                       | Konfiguration/Befehl                                  | Einrichtungsseite                         |
| --------------------------- | ----------------------------------------------------- | ----------------------------------------- |
| Nativer Codex-App-Server    | `/codex ...`, `openai/gpt-*`-Agentenreferenzen        | [Codex-Harness](/de/plugins/codex-harness)   |
| Expliziter Codex-ACP-Adapter | `/acp spawn codex`, `runtime: "acp", agentId: "codex"` | Diese Seite                               |

Bevorzugen Sie die native Route, sofern Sie nicht ausdrücklich ACP/acpx-Verhalten benötigen.

## acpx-Harness-Unterstützung (aktuell)

Integrierte acpx-Harness-Aliasse (aus der festgelegten `acpx`-Abhängigkeit):

| Alias        | Umschließt                                                                                                      |
| ------------ | --------------------------------------------------------------------------------------------------------------- |
| `claude`     | [Claude Code](https://claude.ai/code)                                                                           |
| `codex`      | [Codex CLI](https://codex.openai.com)                                                                           |
| `copilot`    | [GitHub Copilot CLI](https://docs.github.com/copilot/how-tos/copilot-chat/use-copilot-chat-in-the-command-line) |
| `cursor`     | [Cursor CLI](https://cursor.com/docs/cli/acp) (`cursor-agent acp`)                                              |
| `droid`      | [Factory Droid](https://www.factory.ai)                                                                         |
| `fast-agent` | [fast-agent](https://fast-agent.ai)                                                                             |
| `gemini`     | [Gemini CLI](https://github.com/google/gemini-cli)                                                              |
| `iflow`      | [iFlow CLI](https://github.com/iflow-ai/iflow-cli)                                                              |
| `kilocode`   | [Kilocode](https://kilocode.ai)                                                                                 |
| `kimi`       | [Kimi CLI](https://github.com/MoonshotAI/kimi-cli)                                                              |
| `kiro`       | [Kiro CLI](https://kiro.dev)                                                                                    |
| `mux`        | [Mux](https://mux.coder.com)                                                                                    |
| `opencode`   | [OpenCode](https://opencode.ai)                                                                                 |
| `openclaw`   | OpenClaw-ACP-Bridge (nativ: `openclaw acp`)                                                                     |
| `pi`         | [Pi Coding Agent](https://github.com/mariozechner/pi)                                                           |
| `qoder`      | [Qoder CLI](https://docs.qoder.com/cli/acp)                                                                     |
| `qwen`       | [Qwen Code](https://github.com/QwenLM/qwen-code)                                                                |
| `trae`       | [Trae CLI](https://docs.trae.cn/cli)                                                                            |

`factory-droid` und `factorydroid` werden ebenfalls zum integrierten `droid`-Adapter aufgelöst.

Wenn OpenClaw das acpx-Backend verwendet, bevorzugen Sie diese Werte für `agentId`, sofern Ihre acpx-Konfiguration keine benutzerdefinierten Agentenaliase definiert.
Falls Ihre lokale Cursor-Installation ACP weiterhin als `agent acp` bereitstellt, überschreiben Sie den Befehl des `cursor`-Agenten in Ihrer acpx-Konfiguration, anstatt den integrierten Standard zu ändern.

Bei der direkten Verwendung der acpx-CLI können über `--agent <command>` auch beliebige Adapter angegeben werden. Dieser direkte Ausweg ist jedoch eine Funktion der acpx-CLI und nicht der normale `agentId`-Pfad von OpenClaw.

Die Modellsteuerung hängt von den Fähigkeiten des Adapters ab. Codex-ACP-Modellreferenzen werden
vor dem Start von OpenClaw normalisiert. Andere Harnesses benötigen die ACP-Fähigkeit `models` sowie
Unterstützung für `session/set_model`. Wenn ein Harness weder diese ACP-Fähigkeit
noch ein eigenes Startflag für das Modell bereitstellt, kann OpenClaw/acpx keine Modellauswahl erzwingen.

## Erforderliche Konfiguration

ACP-Kernbasis:

```json5
{
  acp: {
    enabled: true,
    // Optional. Standardwert ist true; auf false setzen, um die ACP-Weiterleitung zu pausieren und die /acp-Steuerung beizubehalten.
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
      "qwen",
    ],
    maxConcurrentSessions: 8,
    stream: {
      // Standardwerte sind coalesceIdleMs: 350, maxChunkChars: 1800; hier ausdrücklich angegeben.
      coalesceIdleMs: 350,
      maxChunkChars: 1800,
    },
    runtime: {
      ttlMinutes: 120,
    },
  },
}
```

Die Konfiguration der Thread-Bindung ist vom Kanaladapter abhängig. Beispiel für Discord:

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
        // Der Standardwert ist bereits true; hier ausdrücklich angegeben.
        spawnSessions: true,
      },
    },
  },
}
```

Wenn das Starten einer Thread-gebundenen ACP-Sitzung nicht funktioniert, prüfen Sie zuerst das Feature-Flag des Adapters:

- Discord: `channels.discord.threadBindings.spawnSessions=true`

Bindungen an die aktuelle Unterhaltung erfordern keine Erstellung eines untergeordneten Threads. Sie erfordern einen aktiven Unterhaltungskontext und einen Kanaladapter, der ACP-Unterhaltungsbindungen bereitstellt.

Siehe [Konfigurationsreferenz](/de/gateway/configuration-reference).

## Plugin-Einrichtung für das acpx-Backend

Paketinstallationen verwenden das offizielle Laufzeit-Plugin `@openclaw/acpx` für ACP.
Installieren und aktivieren Sie es, bevor Sie ACP-Harness-Sitzungen verwenden:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

Quellcode-Checkouts können nach `pnpm install` auch das lokale Workspace-Plugin verwenden.

Beginnen Sie mit:

```text
/acp doctor
```

Wenn Sie `acpx` deaktiviert, es über `plugins.allow` / `plugins.deny` abgelehnt haben oder
zum paketierten Plugin zurückwechseln möchten, verwenden Sie den ausdrücklichen Paketpfad:

```bash
openclaw plugins install @openclaw/acpx
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

### Startprüfung der acpx-Laufzeit

Das `acpx`-Plugin bettet die ACP-Laufzeit direkt ein (es gibt keine separate `acpx`-Binärdatei oder
zu konfigurierende Version). Standardmäßig registriert es das eingebettete Backend während
des Gateway-Starts und wartet vor dem Gateway-Signal `ready` auf eine Startprüfung.
Setzen Sie `OPENCLAW_ACPX_RUNTIME_STARTUP_PROBE=0` oder
`OPENCLAW_SKIP_ACPX_RUNTIME_PROBE=1` nur für Skripte oder Umgebungen, in denen
die Startprüfung absichtlich deaktiviert bleiben soll. Führen Sie `/acp doctor` für eine ausdrückliche
Prüfung bei Bedarf aus.

Überschreiben Sie einen einzelnen ACP-Agentenbefehl mit strukturierten Argumenten, wenn ein Pfad
oder Flagwert als einzelnes argv-Token erhalten bleiben soll:

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
- `agents.<id>.args` ist optional. Jedes Array-Element wird für die Shell maskiert, bevor OpenClaw es an die aktuelle acpx-Befehlszeichenfolgen-Registry weitergibt.

Siehe [Plugins](/de/tools/plugin).

### Automatischer Adapter-Download

`acpx` lädt ACP-Adapter (beispielsweise die ACP-Bridges für Claude und Codex)
bei der ersten Verwendung automatisch über `npx` herunter. Sie müssen Adapterpakete nicht
manuell installieren, und für OpenClaw selbst gibt es keinen separaten Postinstall-Schritt. Wenn der
Download oder Start eines Adapters fehlschlägt, meldet `/acp doctor` den Fehler.

### MCP-Bridge für Plugin-Werkzeuge

Standardmäßig stellen ACPX-Sitzungen die von OpenClaw-Plugins registrierten Werkzeuge
dem ACP-Harness **nicht** bereit.

Wenn ACP-Agenten wie Codex oder Claude Code installierte
OpenClaw-Plugin-Werkzeuge wie das Abrufen oder Speichern von Erinnerungen aufrufen sollen, aktivieren Sie die dafür vorgesehene Bridge:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

Dies bewirkt Folgendes:

- Fügt während der Initialisierung der ACPX-Sitzung einen integrierten MCP-Server namens `openclaw-plugin-tools`
  ein.
- Stellt Plugin-Werkzeuge bereit, die bereits von installierten und aktivierten OpenClaw-
  Plugins registriert wurden.
- Hält die Funktion ausdrücklich optional und standardmäßig deaktiviert.

Hinweise zu Sicherheit und Vertrauen:

- Dadurch wird die Werkzeugoberfläche des ACP-Harness erweitert.
- ACP-Agenten erhalten nur Zugriff auf Plugin-Werkzeuge, die bereits im Gateway aktiv sind.
- Behandeln Sie dies als dieselbe Vertrauensgrenze, als würden Sie diesen Plugins die Ausführung
  direkt in OpenClaw erlauben.
- Prüfen Sie die installierten Plugins, bevor Sie die Funktion aktivieren.

Benutzerdefinierte `mcpServers` funktionieren weiterhin wie zuvor. Die integrierte Bridge für Plugin-Werkzeuge ist eine
zusätzliche optionale Komfortfunktion und kein Ersatz für die allgemeine MCP-Server-Konfiguration.

### MCP-Bridge für OpenClaw-Werkzeuge

Standardmäßig stellen ACPX-Sitzungen integrierte OpenClaw-Werkzeuge ebenfalls **nicht** über
MCP bereit. Aktivieren Sie die separate Bridge für Kernwerkzeuge, wenn ein ACP-Agent ausgewählte
integrierte Werkzeuge wie `cron` benötigt:

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

Dies bewirkt Folgendes:

- Fügt während der Initialisierung der ACPX-Sitzung einen integrierten MCP-Server namens `openclaw-tools`
  ein.
- Stellt ausgewählte integrierte OpenClaw-Werkzeuge bereit. Der anfängliche Server stellt `cron` bereit.
- Hält die Bereitstellung von Kernwerkzeugen ausdrücklich optional und standardmäßig deaktiviert.

### Konfiguration des Zeitlimits für Laufzeitvorgänge

Das `acpx`-Plugin gewährt eingebetteten Laufzeitstart- und Steuerungsvorgängen standardmäßig 120
Sekunden. Dadurch haben langsamere Harnesses wie Gemini CLI ausreichend Zeit,
den ACP-Start und die Initialisierung abzuschließen. Überschreiben Sie den Wert, wenn Ihr Host ein
anderes Vorgangslimit benötigt:

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

Laufzeitdurchläufe verwenden die OpenClaw-Zeitlimits für Agenten/Ausführungen, einschließlich `/acp timeout`.
`sessions_spawn` akzeptiert keine Zeitlimitüberschreibungen pro Aufruf; der Betreiberpfad
lautet `agents.defaults.subagents.runTimeoutSeconds`. Starten Sie das Gateway nach
einer Änderung von `timeoutSeconds` neu.

### Konfiguration des Agenten für Zustandsprüfungen

Wenn `/acp doctor` oder die Startprüfung das Backend prüft, testet das mitgelieferte `acpx`-
Plugin einen Harness-Agenten. Wenn `acp.allowedAgents` festgelegt ist, wird standardmäßig
der erste zugelassene Agent verwendet; andernfalls ist der Standardwert `codex`. Wenn Ihre Bereitstellung
für Zustandsprüfungen einen anderen ACP-Agenten benötigt, legen Sie den Prüfagenten ausdrücklich fest:

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

Starten Sie das Gateway nach einer Änderung dieses Werts neu.

## Berechtigungskonfiguration

ACP-Sitzungen werden nicht interaktiv ausgeführt – es gibt keine TTY, über die Berechtigungsaufforderungen zum Schreiben von Dateien oder Ausführen von Shell-Befehlen genehmigt oder abgelehnt werden könnten. Das acpx-Plugin stellt zwei Konfigurationsschlüssel bereit, die steuern, wie Berechtigungen behandelt werden:

Diese ACPX-Harness-Berechtigungen sind von den OpenClaw-Ausführungsgenehmigungen und von Umgehungsflags der Anbieter für CLI-Backends wie `--permission-mode bypassPermissions` der Claude CLI getrennt. ACPX `approve-all` ist der Notfallschalter auf Harness-Ebene für ACP-Sitzungen.

Einen umfassenderen Vergleich zwischen OpenClaw `tools.exec.mode`, Codex-Guardian-
Genehmigungen und ACPX-Harness-Berechtigungen finden Sie unter
[Berechtigungsmodi](/de/tools/permission-modes).

### `permissionMode`

Steuert, welche Vorgänge der Harness-Agent ohne Rückfrage ausführen kann.

| Wert            | Verhalten                                                                    |
| --------------- | ---------------------------------------------------------------------------- |
| `approve-all`   | Alle Dateischreibvorgänge und Shell-Befehle automatisch genehmigen.          |
| `approve-reads` | Nur Lesevorgänge automatisch genehmigen; Schreib- und Ausführungsvorgänge erfordern Bestätigungen. |
| `deny-all`      | Alle Berechtigungsabfragen ablehnen.                                          |

### `nonInteractivePermissions`

Steuert, was geschieht, wenn eine Berechtigungsabfrage angezeigt werden müsste, aber keine interaktive TTY verfügbar ist (was bei ACP-Sitzungen immer der Fall ist).

| Wert   | Verhalten                                                                         |
| ------ | --------------------------------------------------------------------------------- |
| `fail` | Sitzung mit `PermissionPromptUnavailableError` abbrechen. **(Standard)**           |
| `deny` | Berechtigung stillschweigend ablehnen und fortfahren (kontrollierte Einschränkung). |

### Konfiguration

Über die Plugin-Konfiguration festlegen:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

Starten Sie das Gateway neu, nachdem Sie diese Werte geändert haben.

<Warning>
OpenClaw verwendet standardmäßig `permissionMode=approve-reads` und `nonInteractivePermissions=fail`. In nicht interaktiven ACP-Sitzungen können Schreib- oder Ausführungsvorgänge, die eine Berechtigungsabfrage auslösen, mit `PermissionPromptUnavailableError: Permission prompt unavailable in non-interactive mode` fehlschlagen.

Wenn Sie Berechtigungen einschränken müssen, setzen Sie `nonInteractivePermissions` auf `deny`, damit Sitzungen kontrolliert mit eingeschränkter Funktionalität fortgesetzt werden, statt abzustürzen.
</Warning>

## Verwandte Themen

- [ACP-Agenten](/de/tools/acp-agents) — Übersicht, Betriebshandbuch, Konzepte
- [Untergeordnete Agenten](/de/tools/subagents)
- [Multi-Agent-Routing](/de/concepts/multi-agent)
