---
read_when: You hit 'sandbox jail' or see a tool/elevated refusal and want the exact config key to change.
status: active
summary: 'Warum ein Tool blockiert ist: Sandbox-Laufzeit, Richtlinie zum Zulassen/Ablehnen von Tools und Freigabebedingungen für die Ausführung mit erhöhten Rechten'
title: Sandbox vs. Tool-Richtlinie vs. erhöhte Berechtigungen
x-i18n:
    generated_at: "2026-07-12T15:27:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 2fce3dab337e89fc2b196f59e763a169d76206ce2695744e00252c158b161260
    source_path: gateway/sandbox-vs-tool-policy-vs-elevated.md
    workflow: 16
---

OpenClaw verfügt über drei zusammengehörige, aber unterschiedliche Steuerungsmöglichkeiten:

1. **Sandbox** (`agents.defaults.sandbox.*` / `agents.list[].sandbox.*`) legt fest, **wo Tools ausgeführt werden** (Sandbox-Backend oder Host).
2. **Tool-Richtlinie** (`tools.*`, `tools.sandbox.tools.*`, `agents.list[].tools.*`) legt fest, **welche Tools verfügbar/zulässig sind**.
3. **Erhöht** (`tools.elevated.*`, `agents.list[].tools.elevated.*`) ist ein **ausschließlich für exec vorgesehener Ausweg**, um außerhalb der Sandbox ausgeführt zu werden, wenn Sie sich in einer Sandbox befinden (standardmäßig `gateway` oder `node`, wenn das exec-Ziel auf `node` konfiguriert ist).

## Schnelle Fehlerdiagnose

Verwenden Sie den Inspektor, um zu sehen, was OpenClaw _tatsächlich_ tut:

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

Es gibt Folgendes aus:

- effektiver Sandbox-Modus/-Geltungsbereich und Arbeitsbereichszugriff
- ob die Sitzung derzeit in einer Sandbox ausgeführt wird (Hauptsitzung oder Nicht-Hauptsitzung)
- effektive Zulassungs-/Sperrregeln für Sandbox-Tools (und ob sie vom Agenten, aus der globalen Konfiguration oder aus der Standardkonfiguration stammen)
- Berechtigungsfreigaben und Schlüsselpfade zur Fehlerbehebung

## Sandbox: Ausführungsort der Tools

Das Sandboxing wird durch `agents.defaults.sandbox.mode` gesteuert:

- `"off"`: Alles wird auf dem Host ausgeführt.
- `"non-main"`: Nur Nicht-Hauptsitzungen werden in einer Sandbox ausgeführt (eine häufige „Überraschung“ bei Gruppen/Kanälen).
- `"all"`: Alles wird in einer Sandbox ausgeführt.

`agents.defaults.sandbox.workspaceAccess` steuert, was die Sandbox sehen kann: `"none"`, `"ro"` oder `"rw"`.

Die vollständige Matrix (Geltungsbereich, Workspace-Einbindungen, Images) finden Sie unter [Sandboxing](/de/gateway/sandboxing).

### Bind-Mounts (Sicherheits-Schnellprüfung)

- `docker.binds` _durchdringt_ das Sandbox-Dateisystem: Alles, was Sie einbinden, ist innerhalb des Containers in dem von Ihnen festgelegten Modus (`:ro` oder `:rw`) sichtbar.
- Wenn Sie den Modus weglassen, ist der Standard Lese- und Schreibzugriff; bevorzugen Sie `:ro` für Quellcode und Secrets.
- `scope: "shared"` ignoriert agentenspezifische Bind-Mounts (nur globale Bind-Mounts gelten).
- OpenClaw validiert Bind-Quellen zweimal: zuerst anhand des normalisierten Quellpfads und dann erneut nach der Auflösung über den tiefsten vorhandenen übergeordneten Pfad. Ausbrüche über Symlinks in übergeordneten Pfaden umgehen weder Prüfungen auf gesperrte Pfade noch auf zulässige Wurzelverzeichnisse.
- Nicht vorhandene Blattpfade werden dennoch sicher geprüft. Wenn `/workspace/alias-out/new-file` über einen als Symlink angelegten übergeordneten Pfad zu einem gesperrten Pfad oder außerhalb der konfigurierten zulässigen Wurzelverzeichnisse aufgelöst wird, wird der Bind-Mount abgelehnt.
- Das Einbinden von `/var/run/docker.sock` überträgt der Sandbox faktisch die Kontrolle über den Host; tun Sie dies nur bewusst.
- Der Workspace-Zugriff (`workspaceAccess`) ist unabhängig von den Bind-Mount-Modi.

## Tool-Richtlinie: Welche Tools vorhanden/aufrufbar sind

Zwei Ebenen sind relevant:

- **Tool-Profil**: `tools.profile` und `agents.list[].tools.profile` (Basis-Zulassungsliste)
- **Provider-Tool-Profil**: `tools.byProvider[provider].profile` und `agents.list[].tools.byProvider[provider].profile`
- **Globale/agentenspezifische Tool-Richtlinie**: `tools.allow`/`tools.deny` und `agents.list[].tools.allow`/`agents.list[].tools.deny`
- **Provider-Tool-Richtlinie**: `tools.byProvider[provider].allow/deny` und `agents.list[].tools.byProvider[provider].allow/deny`
- **Sandbox-Tool-Richtlinie** (gilt nur in einer Sandbox): `tools.sandbox.tools.allow`/`tools.sandbox.tools.deny` und `agents.list[].tools.sandbox.tools.*`

Faustregeln:

- `deny` hat immer Vorrang.
- Wenn `allow` nicht leer ist, wird alles andere als gesperrt behandelt.
- Die Tool-Richtlinie ist die endgültige Grenze: `/exec` kann ein verweigertes `exec`-Tool nicht außer Kraft setzen.
- Die Tool-Richtlinie filtert die Tool-Verfügbarkeit nach Namen; sie prüft keine Nebeneffekte innerhalb von `exec`. Wenn `exec` zulässig ist, werden Shell-Befehle durch das Verweigern von `write`, `edit` oder `apply_patch` nicht schreibgeschützt.
- `/exec` ändert nur die Sitzungsstandards für autorisierte Absender; es gewährt keinen Tool-Zugriff.
- Provider-Tool-Schlüssel akzeptieren entweder `provider` (z. B. `google-antigravity`) oder `provider/model` (z. B. `openai/gpt-5.4`).
- Gateway-Protokolle enthalten `agents/tool-policy`-Audit-Einträge, wenn ein Schritt der Tool-Richtlinie Tools entfernt oder eine Sandbox-Tool-Richtlinie einen Aufruf blockiert. Verwenden Sie `openclaw logs`, um die Regelbezeichnung, den Konfigurationsschlüssel und die betroffenen Tool-Namen anzuzeigen.

### Tool-Gruppen (Kurzformen)

Tool-Richtlinien (global, Agent, Sandbox) unterstützen `group:*`-Einträge, die zu mehreren Tools erweitert werden:

```json5
{
  tools: {
    sandbox: {
      tools: {
        allow: ["group:runtime", "group:fs", "group:sessions", "group:memory"],
      },
    },
  },
}
```

Verfügbare Gruppen:

| Gruppe             | Tools                                                                                                                                                                                                                     |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | `exec`, `process`, `code_execution` (`bash` wird als Alias für `exec` akzeptiert)                                                                                                                                          |
| `group:fs`         | `read`, `write`, `edit`, `apply_patch`                                                                                                                                                                                    |
| `group:sessions`   | `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status`                                                                                                   |
| `group:memory`     | `memory_search`, `memory_get`                                                                                                                                                                                             |
| `group:web`        | `web_search`, `x_search`, `web_fetch`                                                                                                                                                                                     |
| `group:ui`         | `browser`, `canvas`                                                                                                                                                                                                       |
| `group:automation` | `heartbeat_respond`, `cron`, `gateway`                                                                                                                                                                                    |
| `group:messaging`  | `message`                                                                                                                                                                                                                 |
| `group:nodes`      | `nodes`, `computer`                                                                                                                                                                                                       |
| `group:agents`     | `agents_list`, `get_goal`, `create_goal`, `update_goal`, `update_plan`, `skill_workshop`                                                                                                                                  |
| `group:media`      | `image`, `image_generate`, `music_generate`, `video_generate`, `tts`                                                                                                                                                      |
| `group:openclaw`   | die meisten integrierten OpenClaw-Tools (ausgenommen die Dateisystem- und Laufzeitprimitive `read`/`write`/`edit`/`apply_patch`/`exec`/`process`, `canvas` sowie Provider-Plugins)                                         |
| `group:plugins`    | alle geladenen Plugin-eigenen Tools, einschließlich konfigurierter MCP-Server, die über `bundle-mcp` bereitgestellt werden                                                                                                 |

Verweigern Sie für schreibgeschützte Agenten sowohl `group:runtime` als auch Dateisystem-Tools mit Schreibzugriff, sofern nicht die Sandbox-Dateisystemrichtlinie oder eine separate Host-Grenze die Schreibschutzbeschränkung durchsetzt.

Bei MCP-Servern in einer Sandbox bildet die Sandbox-Tool-Richtlinie eine zweite Freigabestufe. Wenn `mcp.servers` konfiguriert ist, bei Sandbox-Ausführungen jedoch nur integrierte Tools angezeigt werden, fügen Sie `bundle-mcp`, `group:plugins` oder einen MCP-Tool-Namen bzw. ein Glob-Muster mit Serverpräfix wie `outlook__send_mail` oder `outlook__*` zu `tools.sandbox.tools.alsoAllow` hinzu. Starten Sie anschließend den Gateway neu bzw. laden Sie ihn neu und erfassen Sie die Tool-Liste erneut. Server-Glob-Muster verwenden das Provider-sichere MCP-Serverpräfix: Zeichen außerhalb von `[A-Za-z0-9_-]` werden zu `-`, Namen, die nicht mit einem Buchstaben beginnen, erhalten das Präfix `mcp-`, und lange oder doppelte Präfixe können gekürzt oder mit einem Suffix versehen werden.

`openclaw doctor` prüft diese Struktur derzeit für von OpenClaw verwaltete Server in `mcp.servers`. MCP-Server, die aus gebündelten Plugin-Manifesten oder Claudes `.mcp.json` geladen werden, verwenden dieselbe Sandbox-Freigabestufe, diese Diagnose führt diese Quellen jedoch noch nicht auf. Verwenden Sie dieselben Positivlisteneinträge, wenn deren Tools bei Sandbox-Ausführungen verschwinden.

## Elevated: nur für exec „auf dem Host ausführen“

Elevated gewährt **keine** zusätzlichen Tools; es wirkt sich nur auf `exec` aus.

- Wenn Sie sich in einer Sandbox befinden, wird `/elevated on` (oder `exec` mit `elevated: true`) außerhalb der Sandbox ausgeführt (Genehmigungen können weiterhin erforderlich sein).
- Verwenden Sie `/elevated full`, um exec-Genehmigungen für die Sitzung zu überspringen.
- Wenn Sie bereits direkt ausgeführt werden, ist Elevated praktisch wirkungslos (die Einschränkungen gelten weiterhin).
- Elevated ist **nicht** auf Skills beschränkt und überschreibt **keine** Tool-Freigaben oder -Sperren.
- Elevated gewährt bei `host=auto` keine beliebigen hostübergreifenden Überschreibungen; es folgt den normalen Regeln für das exec-Ziel und behält `node` nur bei, wenn das konfigurierte Ziel bzw. das Sitzungsziel bereits `node` ist.
- `/exec` ist von Elevated getrennt. Es passt lediglich die sitzungsbezogenen exec-Standardeinstellungen für autorisierte Absender an.

Schranken:

- Aktivierung: `tools.elevated.enabled` (und optional `agents.list[].tools.elevated.enabled`)
- Absender-Zulassungslisten: `tools.elevated.allowFrom.<provider>` (und optional `agents.list[].tools.elevated.allowFrom.<provider>`)

Siehe [Erweiterter Modus](/de/tools/elevated).

## Häufige Lösungen für die „Sandbox-Isolation“

### „Tool X durch die Sandbox-Tool-Richtlinie blockiert“

Schlüssel zur Behebung (wählen Sie einen):

- Sandbox deaktivieren: `agents.defaults.sandbox.mode=off` (oder pro Agent `agents.list[].sandbox.mode=off`)
- Das Tool innerhalb der Sandbox zulassen:
  - aus `tools.sandbox.tools.deny` entfernen (oder pro Agent aus `agents.list[].tools.sandbox.tools.deny`)
  - oder zu `tools.sandbox.tools.allow` hinzufügen (oder zur agentenspezifischen Zulassungsliste)
- Prüfen Sie `openclaw logs` auf den Eintrag `agents/tool-policy`. Er protokolliert den Sandbox-Modus und ob die Zulassungs- oder Ablehnungsregel das Tool blockiert hat.

### „Ich dachte, dies sei die Hauptsitzung – warum läuft sie in einer Sandbox?“

Im Modus `"non-main"` sind Gruppen-/Kanalschlüssel _keine_ Hauptsitzungsschlüssel. Verwenden Sie den Schlüssel der Hauptsitzung (angezeigt durch `sandbox explain`) oder wechseln Sie in den Modus `"off"`.

## Verwandte Themen

- [Sandboxing](/de/gateway/sandboxing) -- vollständige Sandbox-Referenz (Modi, Geltungsbereiche, Backends, Images)
- [Multi-Agent-Sandbox und -Tools](/de/tools/multi-agent-sandbox-tools) -- agentenspezifische Überschreibungen und Rangfolge
- [Erweiterter Modus](/de/tools/elevated)
