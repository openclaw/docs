---
read_when: You hit 'sandbox jail' or see a tool/elevated refusal and want the exact config key to change.
status: active
summary: 'Warum ein Tool blockiert wird: Sandbox-Laufzeitumgebung, Tool-Richtlinie zum Zulassen/Ablehnen und Gates für erhöhte exec-Ausführungen'
title: Sandbox vs. Tool-Richtlinie vs. erhöhte Berechtigungen
x-i18n:
    generated_at: "2026-05-06T06:49:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: cd303355774e3d73161b5704ba664d7418160e9b6792a904c7d5092e0351b320
    source_path: gateway/sandbox-vs-tool-policy-vs-elevated.md
    workflow: 16
---

OpenClaw hat drei verwandte (aber unterschiedliche) Steuerungen:

1. **Sandbox** (`agents.defaults.sandbox.*` / `agents.list[].sandbox.*`) entscheidet, **wo Tools laufen** (Sandbox-Backend oder Host).
2. **Tool-Richtlinie** (`tools.*`, `tools.sandbox.tools.*`, `agents.list[].tools.*`) entscheidet, **welche Tools verfügbar/erlaubt sind**.
3. **Elevated** (`tools.elevated.*`, `agents.list[].tools.elevated.*`) ist ein **nur für exec vorgesehener Ausweg**, um außerhalb der Sandbox zu laufen, wenn Sie sich in der Sandbox befinden (standardmäßig `gateway`, oder `node`, wenn das exec-Ziel auf `node` konfiguriert ist).

## Schnelles Debugging

Verwenden Sie den Inspector, um zu sehen, was OpenClaw _tatsächlich_ tut:

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

Er gibt Folgendes aus:

- effektiver Sandbox-Modus/-Scope/Zugriff auf den Workspace
- ob die Sitzung derzeit in der Sandbox läuft (main gegenüber non-main)
- effektives Zulassen/Verweigern von Sandbox-Tools (und ob dies von Agent/global/default stammt)
- Elevated-Gates und Fix-it-Schlüsselpfade

## Sandbox: wo Tools laufen

Sandboxing wird über `agents.defaults.sandbox.mode` gesteuert:

- `"off"`: Alles läuft auf dem Host.
- `"non-main"`: Nur non-main-Sitzungen laufen in der Sandbox (häufige „Überraschung“ bei Gruppen/Kanälen).
- `"all"`: Alles läuft in der Sandbox.

Siehe [Sandboxing](/de/gateway/sandboxing) für die vollständige Matrix (Scope, Workspace-Mounts, Images).

### Bind-Mounts (schneller Sicherheitscheck)

- `docker.binds` _durchstößt_ das Sandbox-Dateisystem: Alles, was Sie mounten, ist im Container mit dem von Ihnen gesetzten Modus sichtbar (`:ro` oder `:rw`).
- Der Standard ist Lesen/Schreiben, wenn Sie den Modus weglassen; bevorzugen Sie `:ro` für Quellcode/Secrets.
- `scope: "shared"` ignoriert agentenspezifische Binds (nur globale Binds gelten).
- OpenClaw validiert Bind-Quellen zweimal: zuerst auf dem normalisierten Quellpfad, dann erneut nach Auflösung über den tiefsten vorhandenen Vorgänger. Symlink-Eltern-Escapes umgehen keine Prüfungen auf blockierte Pfade oder erlaubte Roots.
- Nicht vorhandene Blattpfade werden weiterhin sicher geprüft. Wenn `/workspace/alias-out/new-file` über einen symlinkten Elternpfad zu einem blockierten Pfad oder außerhalb der konfigurierten erlaubten Roots aufgelöst wird, wird der Bind abgelehnt.
- Das Binden von `/var/run/docker.sock` übergibt der Sandbox effektiv die Kontrolle über den Host; tun Sie dies nur bewusst.
- Workspace-Zugriff (`workspaceAccess: "ro"`/`"rw"`) ist unabhängig von Bind-Modi.

## Tool-Richtlinie: welche Tools existieren/aufrufbar sind

Zwei Ebenen sind wichtig:

- **Tool-Profil**: `tools.profile` und `agents.list[].tools.profile` (Basis-Allowlist)
- **Provider-Tool-Profil**: `tools.byProvider[provider].profile` und `agents.list[].tools.byProvider[provider].profile`
- **Globale/agentenspezifische Tool-Richtlinie**: `tools.allow`/`tools.deny` und `agents.list[].tools.allow`/`agents.list[].tools.deny`
- **Provider-Tool-Richtlinie**: `tools.byProvider[provider].allow/deny` und `agents.list[].tools.byProvider[provider].allow/deny`
- **Sandbox-Tool-Richtlinie** (gilt nur in der Sandbox): `tools.sandbox.tools.allow`/`tools.sandbox.tools.deny` und `agents.list[].tools.sandbox.tools.*`

Faustregeln:

- `deny` gewinnt immer.
- Wenn `allow` nicht leer ist, wird alles andere als blockiert behandelt.
- Die Tool-Richtlinie ist die harte Grenze: `/exec` kann ein verweigertes `exec`-Tool nicht überschreiben.
- `/exec` ändert nur Sitzungsstandards für autorisierte Absender; es gewährt keinen Tool-Zugriff.
  Provider-Tool-Schlüssel akzeptieren entweder `provider` (z. B. `google-antigravity`) oder `provider/model` (z. B. `openai/gpt-5.4`).

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

## Elevated: nur für exec „auf dem Host ausführen“

Elevated gewährt **keine** zusätzlichen Tools; es betrifft nur `exec`.

- Wenn Sie in der Sandbox sind, läuft `/elevated on` (oder `exec` mit `elevated: true`) außerhalb der Sandbox (Genehmigungen können weiterhin gelten).
- Verwenden Sie `/elevated full`, um exec-Genehmigungen für die Sitzung zu überspringen.
- Wenn Sie bereits direkt laufen, ist Elevated effektiv wirkungslos (weiterhin durch Gates geschützt).
- Elevated ist **nicht** Skills-bezogen und überschreibt **nicht** Tool-Zulassen/-Verweigern.
- Elevated gewährt keine beliebigen hostübergreifenden Überschreibungen von `host=auto`; es folgt den normalen exec-Zielregeln und bewahrt `node` nur, wenn das konfigurierte/Sitzungsziel bereits `node` ist.
- `/exec` ist von Elevated getrennt. Es passt nur sitzungsspezifische exec-Standards für autorisierte Absender an.

Gates:

- Aktivierung: `tools.elevated.enabled` (und optional `agents.list[].tools.elevated.enabled`)
- Absender-Allowlists: `tools.elevated.allowFrom.<provider>` (und optional `agents.list[].tools.elevated.allowFrom.<provider>`)

Siehe [Elevated-Modus](/de/tools/elevated).

## Häufige Korrekturen für „Sandbox-Gefängnis“

### „Tool X durch Sandbox-Tool-Richtlinie blockiert“

Fix-it-Schlüssel (einen auswählen):

- Sandbox deaktivieren: `agents.defaults.sandbox.mode=off` (oder agentenspezifisch `agents.list[].sandbox.mode=off`)
- Das Tool innerhalb der Sandbox zulassen:
  - entfernen Sie es aus `tools.sandbox.tools.deny` (oder agentenspezifisch aus `agents.list[].tools.sandbox.tools.deny`)
  - oder fügen Sie es zu `tools.sandbox.tools.allow` hinzu (oder zur agentenspezifischen Allowlist)

### „Ich dachte, dies wäre main, warum läuft es in der Sandbox?“

Im Modus `"non-main"` sind Gruppen-/Kanalschlüssel _nicht_ main. Verwenden Sie den main-Sitzungsschlüssel (angezeigt durch `sandbox explain`) oder wechseln Sie den Modus zu `"off"`.

## Verwandte Themen

- [Sandboxing](/de/gateway/sandboxing) -- vollständige Sandbox-Referenz (Modi, Scopes, Backends, Images)
- [Multi-Agent-Sandbox & Tools](/de/tools/multi-agent-sandbox-tools) -- agentenspezifische Überschreibungen und Präzedenz
- [Elevated-Modus](/de/tools/elevated)
