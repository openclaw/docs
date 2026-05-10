---
read_when: You hit 'sandbox jail' or see a tool/elevated refusal and want the exact config key to change.
status: active
summary: 'Warum ein Tool blockiert wird: Sandbox-Laufzeit, Tool-Zulassungs-/Sperr-Richtlinie und Gates für erhöhte Ausführung'
title: Sandbox vs. Tool-Richtlinie vs. erhöhte Rechte
x-i18n:
    generated_at: "2026-05-10T19:37:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9d670aa4f2e0f2265590e0de6198de841e744d210bbc54d291cb448d368e63b6
    source_path: gateway/sandbox-vs-tool-policy-vs-elevated.md
    workflow: 16
---

OpenClaw verfügt über drei verwandte (aber unterschiedliche) Steuerelemente:

1. **Sandbox** (`agents.defaults.sandbox.*` / `agents.list[].sandbox.*`) entscheidet, **wo Tools ausgeführt werden** (Sandbox-Backend oder Host).
2. **Tool-Richtlinie** (`tools.*`, `tools.sandbox.tools.*`, `agents.list[].tools.*`) entscheidet, **welche Tools verfügbar/erlaubt sind**.
3. **Erhöhte Ausführung** (`tools.elevated.*`, `agents.list[].tools.elevated.*`) ist ein **nur für exec vorgesehener Ausweg**, um außerhalb der Sandbox auszuführen, wenn Sie sich in einer Sandbox befinden (standardmäßig `gateway` oder `node`, wenn das exec-Ziel auf `node` konfiguriert ist).

## Schnelles Debugging

Verwenden Sie den Inspector, um zu sehen, was OpenClaw _tatsächlich_ tut:

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

Er gibt Folgendes aus:

- effektiver Sandbox-Modus/-Scope/Workspace-Zugriff
- ob die Sitzung derzeit in einer Sandbox ausgeführt wird (main vs. non-main)
- effektives Erlauben/Verweigern von Sandbox-Tools (und ob dies von Agent/global/Standard stammt)
- Gates für erhöhte Ausführung und Fix-it-Schlüsselpfade

## Sandbox: Wo Tools ausgeführt werden

Sandboxing wird über `agents.defaults.sandbox.mode` gesteuert:

- `"off"`: alles wird auf dem Host ausgeführt.
- `"non-main"`: nur Nicht-main-Sitzungen werden in einer Sandbox ausgeführt (häufige „Überraschung“ bei Gruppen/Kanälen).
- `"all"`: alles wird in einer Sandbox ausgeführt.

Siehe [Sandboxing](/de/gateway/sandboxing) für die vollständige Matrix (Scope, Workspace-Mounts, Images).

### Bind-Mounts (schneller Sicherheitscheck)

- `docker.binds` _durchbricht_ das Sandbox-Dateisystem: Alles, was Sie einhängen, ist im Container mit dem von Ihnen gesetzten Modus sichtbar (`:ro` oder `:rw`).
- Standard ist Lesen/Schreiben, wenn Sie den Modus weglassen; bevorzugen Sie `:ro` für Quellcode/Secrets.
- `scope: "shared"` ignoriert agentenspezifische Binds (nur globale Binds gelten).
- OpenClaw validiert Bind-Quellen zweimal: zuerst auf dem normalisierten Quellpfad, dann erneut nach dem Auflösen über den tiefsten existierenden Vorfahren. Symlink-Parent-Escapes umgehen keine Prüfungen für blockierte Pfade oder erlaubte Roots.
- Nicht vorhandene Blattpfade werden weiterhin sicher geprüft. Wenn `/workspace/alias-out/new-file` über einen Symlink-Parent zu einem blockierten Pfad oder außerhalb der konfigurierten erlaubten Roots aufgelöst wird, wird der Bind abgelehnt.
- Das Einbinden von `/var/run/docker.sock` übergibt der Sandbox effektiv die Kontrolle über den Host; tun Sie dies nur absichtlich.
- Workspace-Zugriff (`workspaceAccess: "ro"`/`"rw"`) ist unabhängig von Bind-Modi.

## Tool-Richtlinie: Welche Tools existieren/aufrufbar sind

Zwei Ebenen sind relevant:

- **Tool-Profil**: `tools.profile` und `agents.list[].tools.profile` (Basis-Allowlist)
- **Provider-Tool-Profil**: `tools.byProvider[provider].profile` und `agents.list[].tools.byProvider[provider].profile`
- **Globale/pro-Agent-Tool-Richtlinie**: `tools.allow`/`tools.deny` und `agents.list[].tools.allow`/`agents.list[].tools.deny`
- **Provider-Tool-Richtlinie**: `tools.byProvider[provider].allow/deny` und `agents.list[].tools.byProvider[provider].allow/deny`
- **Sandbox-Tool-Richtlinie** (gilt nur in der Sandbox): `tools.sandbox.tools.allow`/`tools.sandbox.tools.deny` und `agents.list[].tools.sandbox.tools.*`

Faustregeln:

- `deny` gewinnt immer.
- Wenn `allow` nicht leer ist, wird alles andere als blockiert behandelt.
- Die Tool-Richtlinie ist der harte Stopp: `/exec` kann ein verweigertes `exec`-Tool nicht überschreiben.
- Die Tool-Richtlinie filtert die Tool-Verfügbarkeit nach Name; sie prüft keine Seiteneffekte innerhalb von `exec`. Wenn `exec` erlaubt ist, machen verweigerte `write`-, `edit`- oder `apply_patch`-Tools Shell-Befehle nicht schreibgeschützt.
- `/exec` ändert nur Sitzungsvorgaben für autorisierte Absender; es gewährt keinen Tool-Zugriff.
  Provider-Tool-Schlüssel akzeptieren entweder `provider` (z. B. `google-antigravity`) oder `provider/model` (z. B. `openai/gpt-5.4`).

### Tool-Gruppen (Kurzformen)

Tool-Richtlinien (global, Agent, Sandbox) unterstützen `group:*`-Einträge, die zu mehreren Tools expandieren:

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
  Verweigern Sie für schreibgeschützte Agents `group:runtime` ebenso wie mutierende Dateisystem-Tools, sofern die Sandbox-Dateisystemrichtlinie oder eine separate Host-Grenze die Schreibschutzanforderung nicht erzwingt.
- `group:sessions`: `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status`
- `group:memory`: `memory_search`, `memory_get`
- `group:web`: `web_search`, `x_search`, `web_fetch`
- `group:ui`: `browser`, `canvas`
- `group:automation`: `heartbeat_respond`, `cron`, `gateway`
- `group:messaging`: `message`
- `group:nodes`: `nodes`
- `group:agents`: `agents_list`, `update_plan`
- `group:media`: `image`, `image_generate`, `music_generate`, `video_generate`, `tts`
- `group:openclaw`: alle integrierten OpenClaw-Tools (schließt Provider-Plugins aus)

## Erhöhte Ausführung: nur für exec „auf dem Host ausführen“

Erhöhte Ausführung gewährt **keine** zusätzlichen Tools; sie wirkt sich nur auf `exec` aus.

- Wenn Sie sich in einer Sandbox befinden, führt `/elevated on` (oder `exec` mit `elevated: true`) außerhalb der Sandbox aus (Genehmigungen können weiterhin gelten).
- Verwenden Sie `/elevated full`, um exec-Genehmigungen für die Sitzung zu überspringen.
- Wenn Sie bereits direkt ausführen, ist erhöhte Ausführung effektiv ein No-op (weiterhin durch Gates geschützt).
- Erhöhte Ausführung ist **nicht** auf Skills beschränkt und überschreibt **nicht** Tool-Erlauben/-Verweigern.
- Erhöhte Ausführung gewährt keine beliebigen hostübergreifenden Überschreibungen aus `host=auto`; sie folgt den normalen exec-Zielregeln und behält `node` nur bei, wenn das konfigurierte/Sitzungsziel bereits `node` ist.
- `/exec` ist von erhöhter Ausführung getrennt. Es passt nur exec-Vorgaben pro Sitzung für autorisierte Absender an.

Gates:

- Aktivierung: `tools.elevated.enabled` (und optional `agents.list[].tools.elevated.enabled`)
- Absender-Allowlists: `tools.elevated.allowFrom.<provider>` (und optional `agents.list[].tools.elevated.allowFrom.<provider>`)

Siehe [Erhöhter Modus](/de/tools/elevated).

## Häufige Korrekturen für das „Sandbox-Gefängnis“

### „Tool X durch Sandbox-Tool-Richtlinie blockiert“

Fix-it-Schlüssel (wählen Sie einen):

- Sandbox deaktivieren: `agents.defaults.sandbox.mode=off` (oder pro Agent `agents.list[].sandbox.mode=off`)
- Tool innerhalb der Sandbox erlauben:
  - aus `tools.sandbox.tools.deny` entfernen (oder pro Agent `agents.list[].tools.sandbox.tools.deny`)
  - oder zu `tools.sandbox.tools.allow` hinzufügen (oder pro-Agent-Allow)

### „Ich dachte, dies wäre main, warum ist es in der Sandbox?“

Im Modus `"non-main"` sind Gruppen-/Kanalschlüssel _nicht_ main. Verwenden Sie den main-Sitzungsschlüssel (angezeigt von `sandbox explain`) oder wechseln Sie den Modus zu `"off"`.

## Verwandte Themen

- [Sandboxing](/de/gateway/sandboxing) -- vollständige Sandbox-Referenz (Modi, Scopes, Backends, Images)
- [Multi-Agent-Sandbox und Tools](/de/tools/multi-agent-sandbox-tools) -- Überschreibungen und Priorität pro Agent
- [Erhöhter Modus](/de/tools/elevated)
