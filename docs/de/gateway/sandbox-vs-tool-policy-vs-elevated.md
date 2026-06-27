---
read_when: You hit 'sandbox jail' or see a tool/elevated refusal and want the exact config key to change.
status: active
summary: 'Warum ein Tool blockiert ist: Sandbox-Laufzeitumgebung, Allow-/Deny-Richtlinie für Tools und Gates für erhöhte exec-Ausführung'
title: Sandbox vs. Tool-Richtlinie vs. erhöhte Berechtigungen
x-i18n:
    generated_at: "2026-06-27T17:32:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f4156cc494a6aff4fb9c44cbca8fdfde10a3343dde624c485833dd7508e4c4d6
    source_path: gateway/sandbox-vs-tool-policy-vs-elevated.md
    workflow: 16
---

OpenClaw hat drei verwandte (aber unterschiedliche) Steuerungen:

1. **Sandbox** (`agents.defaults.sandbox.*` / `agents.list[].sandbox.*`) entscheidet, **wo Tools ausgeführt werden** (Sandbox-Backend oder Host).
2. **Tool-Richtlinie** (`tools.*`, `tools.sandbox.tools.*`, `agents.list[].tools.*`) entscheidet, **welche Tools verfügbar/erlaubt sind**.
3. **Elevated** (`tools.elevated.*`, `agents.list[].tools.elevated.*`) ist eine **nur für exec gedachte Ausweichmöglichkeit**, um außerhalb der Sandbox auszuführen, wenn Sie in einer Sandbox sind (standardmäßig `gateway`, oder `node`, wenn das exec-Ziel auf `node` konfiguriert ist).

## Schnelles Debugging

Verwenden Sie den Inspector, um zu sehen, was OpenClaw _tatsächlich_ tut:

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

Er gibt Folgendes aus:

- effektiver Sandbox-Modus/-Scope und Workspace-Zugriff
- ob die Sitzung aktuell in einer Sandbox läuft (main vs. nicht-main)
- effektive Sandbox-Tool-Erlaubnis/-Ablehnung (und ob sie von Agent/global/default stammt)
- Elevated-Gates und Fix-it-Schlüsselpfade

## Sandbox: wo Tools ausgeführt werden

Sandboxing wird über `agents.defaults.sandbox.mode` gesteuert:

- `"off"`: Alles läuft auf dem Host.
- `"non-main"`: Nur nicht-main-Sitzungen laufen in einer Sandbox (häufige „Überraschung“ für Gruppen/Kanäle).
- `"all"`: Alles läuft in einer Sandbox.

Die vollständige Matrix (Scope, Workspace-Mounts, Images) finden Sie unter [Sandboxing](/de/gateway/sandboxing).

### Bind-Mounts (schneller Sicherheitscheck)

- `docker.binds` _durchdringt_ das Sandbox-Dateisystem: Alles, was Sie mounten, ist im Container mit dem von Ihnen gesetzten Modus sichtbar (`:ro` oder `:rw`).
- Standard ist Lese-/Schreibzugriff, wenn Sie den Modus weglassen; bevorzugen Sie `:ro` für Source/Secrets.
- `scope: "shared"` ignoriert agentenspezifische Binds (nur globale Binds gelten).
- OpenClaw validiert Bind-Quellen zweimal: zuerst auf dem normalisierten Quellpfad, dann erneut nach der Auflösung über den tiefsten existierenden Vorfahren. Symlink-Parent-Escapes umgehen keine Prüfungen für blockierte Pfade oder erlaubte Roots.
- Nicht vorhandene Leaf-Pfade werden weiterhin sicher geprüft. Wenn `/workspace/alias-out/new-file` über einen verlinkten Parent zu einem blockierten Pfad oder außerhalb der konfigurierten erlaubten Roots aufgelöst wird, wird der Bind abgelehnt.
- Das Binden von `/var/run/docker.sock` übergibt der Sandbox effektiv die Kontrolle über den Host; tun Sie dies nur absichtlich.
- Workspace-Zugriff (`workspaceAccess: "ro"`/`"rw"`) ist unabhängig von Bind-Modi.

## Tool-Richtlinie: welche Tools existieren/aufrufbar sind

Zwei Ebenen sind wichtig:

- **Tool-Profil**: `tools.profile` und `agents.list[].tools.profile` (Basis-Allowlist)
- **Provider-Tool-Profil**: `tools.byProvider[provider].profile` und `agents.list[].tools.byProvider[provider].profile`
- **Globale/agentenspezifische Tool-Richtlinie**: `tools.allow`/`tools.deny` und `agents.list[].tools.allow`/`agents.list[].tools.deny`
- **Provider-Tool-Richtlinie**: `tools.byProvider[provider].allow/deny` und `agents.list[].tools.byProvider[provider].allow/deny`
- **Sandbox-Tool-Richtlinie** (gilt nur in einer Sandbox): `tools.sandbox.tools.allow`/`tools.sandbox.tools.deny` und `agents.list[].tools.sandbox.tools.*`

Faustregeln:

- `deny` gewinnt immer.
- Wenn `allow` nicht leer ist, wird alles andere als blockiert behandelt.
- Die Tool-Richtlinie ist die harte Grenze: `/exec` kann ein abgelehntes `exec`-Tool nicht überschreiben.
- Die Tool-Richtlinie filtert die Tool-Verfügbarkeit nach Name; sie prüft keine Nebenwirkungen innerhalb von `exec`. Wenn `exec` erlaubt ist, macht das Ablehnen von `write`, `edit` oder `apply_patch` Shell-Befehle nicht schreibgeschützt.
- `/exec` ändert nur Sitzungsstandards für autorisierte Absender; es gewährt keinen Tool-Zugriff.
  Provider-Tool-Schlüssel akzeptieren entweder `provider` (z. B. `google-antigravity`) oder `provider/model` (z. B. `openai/gpt-5.4`).
- Gateway-Logs enthalten `agents/tool-policy`-Audit-Einträge, wenn ein Schritt der Tool-Richtlinie Tools entfernt oder eine Sandbox-Tool-Richtlinie einen Aufruf blockiert. Verwenden Sie `openclaw logs`, um das Regel-Label, den Konfigurationsschlüssel und die betroffenen Tool-Namen zu sehen.

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

- `group:runtime`: `exec`, `process`, `code_execution` (`bash` wird als
  Alias für `exec` akzeptiert)
- `group:fs`: `read`, `write`, `edit`, `apply_patch`
  Für schreibgeschützte Agenten lehnen Sie `group:runtime` sowie mutierende Dateisystem-Tools ab, sofern die Sandbox-Dateisystemrichtlinie oder eine separate Host-Grenze die Schreibschutzbeschränkung nicht erzwingt.
- `group:sessions`: `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status`
- `group:memory`: `memory_search`, `memory_get`
- `group:web`: `web_search`, `x_search`, `web_fetch`
- `group:ui`: `browser`, `canvas`
- `group:automation`: `heartbeat_respond`, `cron`, `gateway`
- `group:messaging`: `message`
- `group:nodes`: `nodes`
- `group:agents`: `agents_list`, `update_plan`
- `group:media`: `image`, `image_generate`, `music_generate`, `video_generate`, `tts`
- `group:openclaw`: alle integrierten OpenClaw-Tools (ohne Provider-Plugins)
- `group:plugins`: alle geladenen Plugin-eigenen Tools, einschließlich konfigurierter MCP-Server, die über `bundle-mcp` verfügbar gemacht werden

Für MCP-Server in einer Sandbox ist die Sandbox-Tool-Richtlinie ein zweites Allow-Gate. Wenn `mcp.servers` konfiguriert ist, aber Sandbox-Turns nur integrierte Tools anzeigen, fügen Sie `bundle-mcp`, `group:plugins` oder einen serverpräfixierten MCP-Tool-Namen/-Glob wie `outlook__send_mail` oder `outlook__*` zu `tools.sandbox.tools.alsoAllow` hinzu, starten/laden Sie dann den Gateway neu und erfassen Sie die Tool-Liste erneut. Server-Globs verwenden den Provider-sicheren MCP-Server-Präfix: Nicht-`[A-Za-z0-9_-]`-Zeichen werden zu `-`, Namen, die nicht mit einem Buchstaben beginnen, erhalten ein `mcp-`-Präfix, und lange oder doppelte Präfixe können gekürzt oder mit einem Suffix versehen werden.

`openclaw doctor` prüft diese Form aktuell für von OpenClaw verwaltete Server in `mcp.servers`. MCP-Server, die aus gebündelten Plugin-Manifesten oder Claude `.mcp.json` geladen werden, verwenden dasselbe Sandbox-Gate, aber diese Diagnose listet diese Quellen noch nicht auf; verwenden Sie dieselben Allowlist-Einträge, wenn deren Tools in Sandbox-Turns verschwinden.

## Elevated: nur exec „auf dem Host ausführen“

Elevated gewährt **keine** zusätzlichen Tools; es wirkt sich nur auf `exec` aus.

- Wenn Sie in einer Sandbox sind, führt `/elevated on` (oder `exec` mit `elevated: true`) außerhalb der Sandbox aus (Genehmigungen können weiterhin gelten).
- Verwenden Sie `/elevated full`, um exec-Genehmigungen für die Sitzung zu überspringen.
- Wenn Sie bereits direkt ausführen, ist Elevated effektiv ein No-op (weiterhin gegated).
- Elevated ist **nicht** Skill-scoped und überschreibt **keine** Tool-Erlaubnis/-Ablehnung.
- Elevated gewährt keine beliebigen hostübergreifenden Overrides von `host=auto`; es folgt den normalen exec-Zielregeln und bewahrt `node` nur, wenn das konfigurierte/Sitzungsziel bereits `node` ist.
- `/exec` ist von Elevated getrennt. Es passt nur agentenspezifische exec-Standards für autorisierte Absender an.

Gates:

- Aktivierung: `tools.elevated.enabled` (und optional `agents.list[].tools.elevated.enabled`)
- Absender-Allowlists: `tools.elevated.allowFrom.<provider>` (und optional `agents.list[].tools.elevated.allowFrom.<provider>`)

Siehe [Elevated Mode](/de/tools/elevated).

## Häufige „Sandbox-Gefängnis“-Korrekturen

### „Tool X blocked by sandbox tool policy“

Fix-it-Schlüssel (wählen Sie einen):

- Sandbox deaktivieren: `agents.defaults.sandbox.mode=off` (oder agentenspezifisch `agents.list[].sandbox.mode=off`)
- Tool innerhalb der Sandbox erlauben:
  - entfernen Sie es aus `tools.sandbox.tools.deny` (oder agentenspezifisch `agents.list[].tools.sandbox.tools.deny`)
  - oder fügen Sie es zu `tools.sandbox.tools.allow` hinzu (oder agentenspezifische Erlaubnis)
- Prüfen Sie `openclaw logs` auf den Eintrag `agents/tool-policy`. Er zeichnet den Sandbox-Modus auf und ob die Allow- oder Deny-Regel das Tool blockiert hat.

### „Ich dachte, dies sei main, warum läuft es in einer Sandbox?“

Im Modus `"non-main"` sind Gruppen-/Kanalschlüssel _nicht_ main. Verwenden Sie den main-Sitzungsschlüssel (angezeigt von `sandbox explain`) oder wechseln Sie den Modus zu `"off"`.

## Verwandt

- [Sandboxing](/de/gateway/sandboxing) -- vollständige Sandbox-Referenz (Modi, Scopes, Backends, Images)
- [Multi-Agent Sandbox & Tools](/de/tools/multi-agent-sandbox-tools) -- agentenspezifische Overrides und Rangfolge
- [Elevated Mode](/de/tools/elevated)
