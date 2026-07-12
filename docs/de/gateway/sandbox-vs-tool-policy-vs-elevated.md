---
read_when: You hit 'sandbox jail' or see a tool/elevated refusal and want the exact config key to change.
status: active
summary: 'Warum ein Tool blockiert wird: Sandbox-Laufzeit, Richtlinie zum Zulassen/Ablehnen von Tools und Freigabemechanismen für die Ausführung mit erhöhten Berechtigungen'
title: Sandbox vs. Tool-Richtlinie vs. erhöhte Berechtigungen
x-i18n:
    generated_at: "2026-07-12T01:42:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2fce3dab337e89fc2b196f59e763a169d76206ce2695744e00252c158b161260
    source_path: gateway/sandbox-vs-tool-policy-vs-elevated.md
    workflow: 16
---

OpenClaw verfügt über drei miteinander zusammenhängende, aber unterschiedliche Steuerungsmöglichkeiten:

1. **Sandbox** (`agents.defaults.sandbox.*` / `agents.list[].sandbox.*`) legt fest, **wo Tools ausgeführt werden** (Sandbox-Backend oder Host).
2. **Tool-Richtlinie** (`tools.*`, `tools.sandbox.tools.*`, `agents.list[].tools.*`) legt fest, **welche Tools verfügbar/zulässig sind**.
3. **Elevated** (`tools.elevated.*`, `agents.list[].tools.elevated.*`) ist ein **nur für `exec` vorgesehener Ausweg**, um bei aktivierter Sandbox außerhalb der Sandbox auszuführen (standardmäßig `gateway` oder `node`, wenn das `exec`-Ziel auf `node` konfiguriert ist).

## Schnelle Fehlerdiagnose

Verwenden Sie den Inspektor, um zu sehen, was OpenClaw _tatsächlich_ tut:

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

Er gibt Folgendes aus:

- effektiver Sandbox-Modus/-Geltungsbereich/-Arbeitsbereichszugriff
- ob die Sitzung derzeit in einer Sandbox ausgeführt wird (Hauptsitzung oder Nicht-Hauptsitzung)
- effektive Zulassungs-/Sperrregeln für Sandbox-Tools (und ob sie vom Agenten, global oder aus den Standardwerten stammen)
- Elevated-Schranken und Konfigurationspfade zur Behebung

## Sandbox: Wo Tools ausgeführt werden

Die Sandbox-Ausführung wird durch `agents.defaults.sandbox.mode` gesteuert:

- `"off"`: Alles wird auf dem Host ausgeführt.
- `"non-main"`: Nur Nicht-Hauptsitzungen werden in einer Sandbox ausgeführt (eine häufige „Überraschung“ bei Gruppen/Kanälen).
- `"all"`: Alles wird in einer Sandbox ausgeführt.

`agents.defaults.sandbox.workspaceAccess` steuert, was die Sandbox sehen kann: `"none"`, `"ro"` oder `"rw"`.

Die vollständige Matrix (Geltungsbereiche, Einbindungen von Arbeitsbereichen, Images) finden Sie unter [Sandbox-Ausführung](/de/gateway/sandboxing).

### Bind-Mounts (kurze Sicherheitsprüfung)

- `docker.binds` _durchbricht_ das Sandbox-Dateisystem: Alles, was Sie einbinden, ist innerhalb des Containers in dem von Ihnen festgelegten Modus (`:ro` oder `:rw`) sichtbar.
- Wenn Sie den Modus weglassen, gilt standardmäßig Lese- und Schreibzugriff; verwenden Sie für Quellcode/geheime Daten vorzugsweise `:ro`.
- `scope: "shared"` ignoriert agentenspezifische Bind-Mounts (es gelten nur globale Bind-Mounts).
- OpenClaw validiert Bind-Quellen zweimal: zuerst anhand des normalisierten Quellpfads und anschließend erneut nach der Auflösung über den tiefsten vorhandenen übergeordneten Pfad. Ausbrüche über symbolisch verknüpfte übergeordnete Verzeichnisse umgehen weder Prüfungen auf gesperrte Pfade noch Prüfungen auf zulässige Stammverzeichnisse.
- Nicht vorhandene Endpfade werden dennoch sicher geprüft. Wenn `/workspace/alias-out/new-file` über ein symbolisch verknüpftes übergeordnetes Verzeichnis zu einem gesperrten Pfad oder aus den konfigurierten zulässigen Stammverzeichnissen heraus aufgelöst wird, wird der Bind-Mount abgelehnt.
- Das Einbinden von `/var/run/docker.sock` überträgt der Sandbox faktisch die Kontrolle über den Host; tun Sie dies nur bewusst.
- Der Arbeitsbereichszugriff (`workspaceAccess`) ist von den Bind-Mount-Modi unabhängig.

## Tool-Richtlinie: Welche Tools vorhanden/aufrufbar sind

Mehrere Ebenen sind relevant:

- **Tool-Profil**: `tools.profile` und `agents.list[].tools.profile` (grundlegende Zulassungsliste)
- **Provider-Tool-Profil**: `tools.byProvider[provider].profile` und `agents.list[].tools.byProvider[provider].profile`
- **Globale/agentenspezifische Tool-Richtlinie**: `tools.allow`/`tools.deny` und `agents.list[].tools.allow`/`agents.list[].tools.deny`
- **Provider-Tool-Richtlinie**: `tools.byProvider[provider].allow/deny` und `agents.list[].tools.byProvider[provider].allow/deny`
- **Sandbox-Tool-Richtlinie** (gilt nur bei Ausführung in einer Sandbox): `tools.sandbox.tools.allow`/`tools.sandbox.tools.deny` und `agents.list[].tools.sandbox.tools.*`

Faustregeln:

- `deny` hat immer Vorrang.
- Wenn `allow` nicht leer ist, gilt alles andere als gesperrt.
- Die Tool-Richtlinie ist eine harte Grenze: `/exec` kann ein gesperrtes `exec`-Tool nicht freigeben.
- Die Tool-Richtlinie filtert die Tool-Verfügbarkeit nach Namen; sie prüft keine Nebenwirkungen innerhalb von `exec`. Wenn `exec` zulässig ist, werden Shell-Befehle durch das Sperren von `write`, `edit` oder `apply_patch` nicht schreibgeschützt.
- `/exec` ändert nur die Sitzungsvorgaben für autorisierte Absender; es gewährt keinen Tool-Zugriff.
- Provider-Tool-Schlüssel akzeptieren entweder `provider` (z. B. `google-antigravity`) oder `provider/model` (z. B. `openai/gpt-5.4`).
- Gateway-Protokolle enthalten `agents/tool-policy`-Prüfeinträge, wenn ein Schritt der Tool-Richtlinie Tools entfernt oder eine Sandbox-Tool-Richtlinie einen Aufruf blockiert. Verwenden Sie `openclaw logs`, um die Regelbezeichnung, den Konfigurationsschlüssel und die betroffenen Tool-Namen anzuzeigen.

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

| Gruppe             | Tools                                                                                                                                                      |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | `exec`, `process`, `code_execution` (`bash` wird als Alias für `exec` akzeptiert)                                                                           |
| `group:fs`         | `read`, `write`, `edit`, `apply_patch`                                                                                                                     |
| `group:sessions`   | `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status`                                    |
| `group:memory`     | `memory_search`, `memory_get`                                                                                                                              |
| `group:web`        | `web_search`, `x_search`, `web_fetch`                                                                                                                      |
| `group:ui`         | `browser`, `canvas`                                                                                                                                        |
| `group:automation` | `heartbeat_respond`, `cron`, `gateway`                                                                                                                     |
| `group:messaging`  | `message`                                                                                                                                                  |
| `group:nodes`      | `nodes`, `computer`                                                                                                                                        |
| `group:agents`     | `agents_list`, `get_goal`, `create_goal`, `update_goal`, `update_plan`, `skill_workshop`                                                                   |
| `group:media`      | `image`, `image_generate`, `music_generate`, `video_generate`, `tts`                                                                                       |
| `group:openclaw`   | die meisten integrierten OpenClaw-Tools (ausgenommen die Dateisystem- und Laufzeitprimitive `read`/`write`/`edit`/`apply_patch`/`exec`/`process`, `canvas` und Provider-Plugins) |
| `group:plugins`    | alle geladenen Plugin-eigenen Tools, einschließlich konfigurierter MCP-Server, die über `bundle-mcp` bereitgestellt werden                                  |

Sperren Sie bei schreibgeschützten Agenten sowohl `group:runtime` als auch Dateisystem-Tools mit Schreibwirkung, sofern nicht die Sandbox-Dateisystemrichtlinie oder eine separate Host-Grenze die Schreibschutzbeschränkung durchsetzt.

Bei MCP-Servern in einer Sandbox stellt die Sandbox-Tool-Richtlinie eine zweite Zulassungsschranke dar. Wenn `mcp.servers` konfiguriert ist, aber Sandbox-Durchläufe nur integrierte Tools anzeigen, fügen Sie `bundle-mcp`, `group:plugins` oder einen MCP-Tool-Namen bzw. ein Glob-Muster mit Serverpräfix wie `outlook__send_mail` oder `outlook__*` zu `tools.sandbox.tools.alsoAllow` hinzu. Starten Sie anschließend den Gateway neu bzw. laden Sie ihn neu und erfassen Sie die Tool-Liste erneut. Server-Glob-Muster verwenden das Provider-sichere MCP-Serverpräfix: Zeichen außerhalb von `[A-Za-z0-9_-]` werden zu `-`, Namen, die nicht mit einem Buchstaben beginnen, erhalten das Präfix `mcp-`, und lange oder doppelte Präfixe können gekürzt oder mit einem Suffix versehen werden.

`openclaw doctor` prüft diese Struktur derzeit für von OpenClaw verwaltete Server in `mcp.servers`. MCP-Server, die aus gebündelten Plugin-Manifesten oder der Claude-Datei `.mcp.json` geladen werden, verwenden dieselbe Sandbox-Schranke, diese Diagnose führt diese Quellen jedoch noch nicht auf. Verwenden Sie dieselben Einträge in der Zulassungsliste, wenn deren Tools in Sandbox-Durchläufen verschwinden.

## Elevated: Nur `exec` „auf dem Host ausführen“

Elevated gewährt **keine** zusätzlichen Tools; es wirkt sich nur auf `exec` aus.

- Wenn Sie sich in einer Sandbox befinden, führt `/elevated on` (oder `exec` mit `elevated: true`) den Vorgang außerhalb der Sandbox aus (Genehmigungen können weiterhin erforderlich sein).
- Verwenden Sie `/elevated full`, um `exec`-Genehmigungen für die Sitzung zu überspringen.
- Wenn Sie bereits direkt ausführen, hat Elevated faktisch keine Wirkung (die Schranken gelten weiterhin).
- Elevated ist **nicht** auf Skills beschränkt und setzt die Tool-Zulassungs-/Sperrregeln **nicht** außer Kraft.
- Elevated gewährt bei `host=auto` keine beliebigen hostübergreifenden Außerkraftsetzungen; es folgt den normalen Regeln für `exec`-Ziele und behält `node` nur bei, wenn das konfigurierte Ziel bzw. das Sitzungsziel bereits `node` ist.
- `/exec` ist von Elevated getrennt. Es passt lediglich die sitzungsspezifischen `exec`-Vorgaben für autorisierte Absender an.

Schranken:

- Aktivierung: `tools.elevated.enabled` (und optional `agents.list[].tools.elevated.enabled`)
- Absender-Zulassungslisten: `tools.elevated.allowFrom.<provider>` (und optional `agents.list[].tools.elevated.allowFrom.<provider>`)

Siehe [Elevated-Modus](/de/tools/elevated).

## Häufige Lösungen bei „Sandbox-Gefängnis“

### „Tool X durch die Sandbox-Tool-Richtlinie gesperrt“

Konfigurationsschlüssel zur Behebung (wählen Sie eine Möglichkeit):

- Sandbox deaktivieren: `agents.defaults.sandbox.mode=off` (oder agentenspezifisch `agents.list[].sandbox.mode=off`)
- Das Tool innerhalb der Sandbox zulassen:
  - Entfernen Sie es aus `tools.sandbox.tools.deny` (oder agentenspezifisch aus `agents.list[].tools.sandbox.tools.deny`).
  - Oder fügen Sie es zu `tools.sandbox.tools.allow` hinzu (bzw. zur agentenspezifischen Zulassungsliste).
- Prüfen Sie `openclaw logs` auf den Eintrag `agents/tool-policy`. Er zeichnet den Sandbox-Modus auf und gibt an, ob die Zulassungs- oder Sperrregel das Tool blockiert hat.

### „Ich dachte, dies sei die Hauptsitzung. Warum wird sie in einer Sandbox ausgeführt?“

Im Modus `"non-main"` sind Gruppen-/Kanalschlüssel _keine_ Hauptsitzungen. Verwenden Sie den Schlüssel der Hauptsitzung (angezeigt durch `sandbox explain`) oder ändern Sie den Modus in `"off"`.

## Verwandte Themen

- [Sandbox-Ausführung](/de/gateway/sandboxing) -- vollständige Sandbox-Referenz (Modi, Geltungsbereiche, Backends, Images)
- [Sandbox und Tools für mehrere Agenten](/de/tools/multi-agent-sandbox-tools) -- agentenspezifische Außerkraftsetzungen und Vorrangregeln
- [Elevated-Modus](/de/tools/elevated)
