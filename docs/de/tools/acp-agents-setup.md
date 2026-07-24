---
read_when:
    - Installation oder Konfiguration des acpx-Harness für Claude Code / Codex / Gemini CLI
    - Aktivieren der MCP-Bridge für Plugin-Tools oder OpenClaw-Tools
    - ACP-Berechtigungsmodi konfigurieren
summary: 'ACP-Agenten einrichten: acpx-Harness-Konfiguration, Plugin-Einrichtung, Berechtigungen'
title: ACP-Agenten — Einrichtung
x-i18n:
    generated_at: "2026-07-24T05:22:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ae3750092175b44252dd080717a1af176995df43c653f245f82d7e556cfd25eb
    source_path: tools/acp-agents-setup.md
    workflow: 16
---

Eine Übersicht, das Betriebshandbuch und die Konzepte finden Sie unter [ACP-Agenten](/de/tools/acp-agents).

Diese Seite behandelt die acpx-Harness-Konfiguration, die Plugin-Einrichtung für die MCP-Bridges und die Berechtigungskonfiguration.

Verwenden Sie diese Seite nur, wenn Sie die ACP/acpx-Route einrichten. Informationen zur nativen Laufzeitkonfiguration des Codex-
App-Servers finden Sie unter [Codex-Harness](/de/plugins/codex-harness). Informationen zu
OpenAI-API-Schlüsseln oder zur Codex-OAuth-Konfiguration des Modell-Providers finden Sie unter
[OpenAI](/de/providers/openai).

Codex bietet zwei OpenClaw-Routen:

| Route                          | Konfiguration/Befehl                                    | Einrichtungsseite                       |
| ------------------------------ | ------------------------------------------------------- | --------------------------------------- |
| Nativer Codex-App-Server       | `/codex ...`, `openai/gpt-*`-Agentenreferenzen          | [Codex-Harness](/de/plugins/codex-harness) |
| Expliziter Codex-ACP-Adapter   | `/acp spawn codex`, `runtime: "acp", agentId: "codex"` | Diese Seite                             |

Bevorzugen Sie die native Route, sofern Sie nicht ausdrücklich ACP/acpx-Verhalten benötigen.

## acpx-Harness-Unterstützung (aktuell)

Integrierte acpx-Harness-Aliasse (aus der fixierten Abhängigkeit `acpx`):

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
| `openclaw`   | OpenClaw-ACP-Bridge (nativ `openclaw acp`)                                                                  |
| `pi`         | [Pi Coding Agent](https://github.com/mariozechner/pi)                                                           |
| `qoder`      | [Qoder CLI](https://docs.qoder.com/cli/acp)                                                                     |
| `qwen`       | [Qwen Code](https://github.com/QwenLM/qwen-code)                                                                |
| `trae`       | [Trae CLI](https://docs.trae.cn/cli)                                                                            |

`factory-droid` und `factorydroid` werden ebenfalls zum integrierten `droid`-Adapter aufgelöst.

Wenn OpenClaw das acpx-Backend verwendet, bevorzugen Sie diese Werte für `agentId`, sofern Ihre acpx-Konfiguration keine benutzerdefinierten Agenten-Aliasse definiert.
Falls Ihre lokale Cursor-Installation ACP weiterhin als `agent acp` bereitstellt, überschreiben Sie den Agentenbefehl `cursor` in Ihrer acpx-Konfiguration, anstatt den integrierten Standard zu ändern.

Bei direkter Verwendung der acpx-CLI können über `--agent <command>` auch beliebige Adapter angesprochen werden. Dieser direkte Ausweg ist jedoch eine Funktion der acpx-CLI und nicht der normale OpenClaw-Pfad `agentId`.

Die Modellsteuerung hängt von den Fähigkeiten des Adapters ab. Codex-ACP-Modellreferenzen werden
vor dem Start von OpenClaw normalisiert. Andere Harnesses benötigen ACP-`models` sowie
Unterstützung für `session/set_model`. Wenn ein Harness weder diese ACP-Fähigkeit
noch ein eigenes Modellflag für den Start bereitstellt, können OpenClaw/acpx keine Modellauswahl erzwingen.

## Erforderliche Konfiguration

ACP-Basiskonfiguration im Core:

```json5
{
  acp: {
    enabled: true,
    // Optional. Standardwert ist true; auf false setzen, um den ACP-Versand anzuhalten und die /acp-Steuerung beizubehalten.
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
    stream: {
      deliveryMode: "live",
    },
  },
}
```

Die Konfiguration der Thread-Bindung wird von den unterstützten Kanaladaptern gemeinsam verwendet:

```json5
{
  session: {
    threadBindings: {
      enabled: true,
      idleHours: 24,
      maxAgeHours: 0,
      spawnSessions: true,
    },
  },
}
```

Wenn das Thread-gebundene Starten von ACP nicht funktioniert, prüfen Sie zuerst das Feature-Flag des Adapters:

- Discord: `session.threadBindings.spawnSessions=true`

Bindungen an die aktuelle Unterhaltung erfordern keine Erstellung eines untergeordneten Threads. Sie benötigen einen aktiven Unterhaltungskontext und einen Kanaladapter, der ACP-Unterhaltungsbindungen bereitstellt.

Siehe [Konfigurationsreferenz](/de/gateway/configuration-reference).

## Plugin-Einrichtung für das acpx-Backend

Paketierte Installationen verwenden das offizielle Laufzeit-Plugin `@openclaw/acpx` für ACP.
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

Wenn Sie `acpx` deaktiviert, über `plugins.allow` / `plugins.deny` verweigert haben oder
zum paketierten Plugin zurückkehren möchten, verwenden Sie den expliziten Paketpfad:

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

### acpx-Laufzeit-Startprüfung

Das Plugin `acpx` bettet die ACP-Laufzeit direkt ein (es muss keine separate `acpx`-Binärdatei oder
-version konfiguriert werden). Standardmäßig registriert es das eingebettete Backend beim
Start des Gateways und wartet vor dem Gateway-Signal `ready`
auf eine Startprüfung. Legen Sie `OPENCLAW_ACPX_RUNTIME_STARTUP_PROBE=0` oder
`OPENCLAW_SKIP_ACPX_RUNTIME_PROBE=1` nur für Skripte oder Umgebungen fest, in denen
die Startprüfung absichtlich deaktiviert bleibt. Führen Sie `/acp doctor` für eine explizite
Prüfung bei Bedarf aus.

Überschreiben Sie den Befehl eines einzelnen ACP-Agenten mit strukturierten Argumenten, wenn ein Pfad
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

- `agents.<id>.command` ist die ausführbare Datei oder die vorhandene Befehlszeichenfolge für diesen ACP-Agenten.
- `agents.<id>.args` ist optional. Jedes Array-Element wird für die Shell quotiert, bevor OpenClaw es über die aktuelle acpx-Registry für Befehlszeichenfolgen weitergibt.

Siehe [Plugins](/de/tools/plugin).

### Automatischer Adapter-Download

`acpx` lädt ACP-Adapter (beispielsweise die ACP-Bridges für Claude und Codex)
bei der ersten Verwendung automatisch über `npx` herunter. Sie müssen Adapterpakete nicht
manuell installieren, und für OpenClaw selbst gibt es keinen separaten Postinstallationsschritt. Wenn der
Download oder Start eines Adapters fehlschlägt, meldet `/acp doctor` den Fehler.

### MCP-Bridge für Plugin-Tools

Standardmäßig stellen ACPX-Sitzungen dem ACP-Harness **keine** von OpenClaw-Plugins registrierten Tools
zur Verfügung.

Wenn ACP-Agenten wie Codex oder Claude Code installierte
OpenClaw-Plugin-Tools wie Speicherabruf/-speicherung aufrufen sollen, aktivieren Sie die dafür vorgesehene Bridge:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

Auswirkungen:

- Fügt beim Bootstrap der ACPX-Sitzung einen integrierten MCP-Server namens `openclaw-plugin-tools`
  ein.
- Stellt Plugin-Tools bereit, die bereits von installierten und aktivierten OpenClaw-
  Plugins registriert wurden.
- Übergibt die Identität der aktiven ACP-Sitzung an Plugin-Tool-Factories, sodass
  agentenspezifische Tools im Namespace dieses Agenten bleiben.
- Behält die Funktion explizit bei und lässt sie standardmäßig deaktiviert.

Hinweise zu Sicherheit und Vertrauen:

- Dies erweitert die Tool-Oberfläche des ACP-Harnesses.
- ACP-Agenten erhalten nur Zugriff auf Plugin-Tools, die bereits im Gateway aktiv sind.
- Behandeln Sie dies als dieselbe Vertrauensgrenze wie die Ausführung dieser Plugins
  in OpenClaw selbst.
- Prüfen Sie installierte Plugins, bevor Sie die Funktion aktivieren.

Benutzerdefinierte `mcpServers` funktionieren weiterhin wie bisher. Die integrierte Plugin-Tools-Bridge ist eine
zusätzliche optionale Vereinfachung und kein Ersatz für eine generische MCP-Serverkonfiguration.

### MCP-Bridge für OpenClaw-Tools

Standardmäßig stellen ACPX-Sitzungen integrierte OpenClaw-Tools ebenfalls **nicht** über
MCP bereit. Aktivieren Sie die separate Core-Tools-Bridge, wenn ein ACP-Agent ausgewählte
integrierte Tools wie `cron` benötigt:

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

Auswirkungen:

- Fügt beim Bootstrap der ACPX-Sitzung einen integrierten MCP-Server namens `openclaw-tools`
  ein.
- Stellt ausgewählte integrierte OpenClaw-Tools bereit. Der ursprüngliche Server stellt `cron` bereit.
- Hält die Bereitstellung von Core-Tools explizit und standardmäßig deaktiviert.

### Konfiguration des Zeitlimits für Laufzeitoperationen

Das Plugin `acpx` gewährt dem Start der eingebetteten Laufzeit und Steuerungsoperationen standardmäßig 120
Sekunden. Dadurch haben langsamere Harnesses wie die Gemini CLI ausreichend Zeit,
den ACP-Start und die Initialisierung abzuschließen. Überschreiben Sie den Wert, wenn Ihr Host ein
anderes Operationslimit benötigt:

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

Laufzeit-Turns verwenden die OpenClaw-Zeitlimits für Agenten/Ausführungen, einschließlich `/acp timeout`.
`sessions_spawn` akzeptiert keine Zeitlimitüberschreibungen pro Aufruf; der Betreiberpfad
ist `agents.defaults.subagents.runTimeoutSeconds`. Starten Sie das Gateway nach einer
Änderung von `timeoutSeconds` neu.

### Konfiguration des Agenten für Zustandsprüfungen

Wenn `/acp doctor` oder die Startprüfung das Backend prüft, testet das gebündelte Plugin `acpx`
einen Harness-Agenten. Wenn `acp.allowedAgents` festgelegt ist, wird standardmäßig
der erste zulässige Agent verwendet; andernfalls ist der Standardwert `codex`. Wenn Ihre Bereitstellung
einen anderen ACP-Agenten für Zustandsprüfungen benötigt, legen Sie den Prüfagenten explizit fest:

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

Starten Sie das Gateway nach einer Änderung dieses Werts neu.

## Berechtigungskonfiguration

ACP-Sitzungen werden nicht interaktiv ausgeführt – es steht kein TTY zur Verfügung, um Berechtigungsaufforderungen für Schreibzugriffe auf Dateien und die Ausführung von Shell-Befehlen zu genehmigen oder abzulehnen. Das acpx-Plugin stellt zwei Konfigurationsschlüssel bereit, die steuern, wie Berechtigungen behandelt werden:

Diese ACPX-Harness-Berechtigungen sind von den OpenClaw-Ausführungsgenehmigungen und von den Umgehungsflags der CLI-Backend-Anbieter wie Claude CLI `--permission-mode bypassPermissions` getrennt. ACPX `approve-all` ist der Notfallschalter auf Harness-Ebene für ACP-Sitzungen.

Einen umfassenderen Vergleich zwischen OpenClaw `tools.exec.mode`, Codex-Guardian-Genehmigungen
und ACPX-Harness-Berechtigungen finden Sie unter
[Berechtigungsmodi](/de/tools/permission-modes).

### `permissionMode`

Steuert, welche Vorgänge der Harness-Agent ohne Rückfrage ausführen kann.

| Wert           | Verhalten                                                  |
| --------------- | --------------------------------------------------------- |
| `approve-all`   | Alle Schreibvorgänge in Dateien und Shell-Befehle automatisch genehmigen.          |
| `approve-reads` | Nur Lesevorgänge automatisch genehmigen; Schreib- und Ausführungsvorgänge erfordern Rückfragen. |
| `deny-all`      | Alle Berechtigungsanfragen ablehnen.                              |

### `nonInteractivePermissions`

Steuert, was geschieht, wenn eine Berechtigungsanfrage angezeigt werden müsste, aber keine interaktive TTY verfügbar ist (was bei ACP-Sitzungen immer der Fall ist).

| Wert  | Verhalten                                                                 |
| ------ | ------------------------------------------------------------------------ |
| `fail` | Die Sitzung mit `PermissionPromptUnavailableError` abbrechen. **(Standard)** |
| `deny` | Die Berechtigung stillschweigend ablehnen und fortfahren (kontrollierte Einschränkung).        |

### Konfiguration

Über die Plugin-Konfiguration festlegen:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

Starten Sie das Gateway nach einer Änderung dieser Werte neu.

<Warning>
OpenClaw verwendet standardmäßig `permissionMode=approve-reads` und `nonInteractivePermissions=fail`. In nicht interaktiven ACP-Sitzungen können Schreib- oder Ausführungsvorgänge, die eine Berechtigungsanfrage auslösen, mit `PermissionPromptUnavailableError: Permission prompt unavailable in non-interactive mode` fehlschlagen.

Wenn Sie Berechtigungen einschränken müssen, setzen Sie `nonInteractivePermissions` auf `deny`, damit Sitzungen kontrolliert mit eingeschränkter Funktionalität fortgesetzt werden, statt abzustürzen.
</Warning>

## Verwandte Themen

- [ACP-Agenten](/de/tools/acp-agents) — Übersicht, Betriebshandbuch, Konzepte
- [Sub-Agenten](/de/tools/subagents)
- [Multi-Agent-Routing](/de/concepts/multi-agent)
