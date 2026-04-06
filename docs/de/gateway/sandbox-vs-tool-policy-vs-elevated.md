---
read_when: You hit 'sandbox jail' or see a tool/elevated refusal and want the exact config key to change.
status: active
summary: 'Warum ein Tool blockiert ist: Sandbox-Laufzeit, Tool-Allow-/Deny-Richtlinie und Gates für Elevated Exec'
title: Sandbox vs. Tool-Richtlinie vs. Elevated
x-i18n:
    generated_at: "2026-04-06T03:07:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 331f5b2f0d5effa1320125d9f29948e16d0deaffa59eb1e4f25a63481cbe22d6
    source_path: gateway/sandbox-vs-tool-policy-vs-elevated.md
    workflow: 15
---

# Sandbox vs. Tool-Richtlinie vs. Elevated

OpenClaw hat drei verwandte (aber unterschiedliche) Steuerungen:

1. **Sandbox** (`agents.defaults.sandbox.*` / `agents.list[].sandbox.*`) entscheidet, **wo Tools ausgeführt werden** (Docker vs. Host).
2. **Tool-Richtlinie** (`tools.*`, `tools.sandbox.tools.*`, `agents.list[].tools.*`) entscheidet, **welche Tools verfügbar/erlaubt sind**.
3. **Elevated** (`tools.elevated.*`, `agents.list[].tools.elevated.*`) ist ein **nur für Exec gedachter Escape Hatch**, um außerhalb der Sandbox auszuführen, wenn Sie in einer Sandbox sind (`gateway` standardmäßig oder `node`, wenn das Exec-Ziel auf `node` konfiguriert ist).

## Schnelles Debugging

Verwenden Sie den Inspektor, um zu sehen, was OpenClaw _tatsächlich_ tut:

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

Er gibt Folgendes aus:

- effektiver Sandbox-Modus/-Scope/-Workspace-Zugriff
- ob die Sitzung derzeit in einer Sandbox läuft (main vs. non-main)
- effektive Allow-/Deny-Richtlinie für Sandbox-Tools (und ob sie von Agent/global/Standard stammt)
- Elevated-Gates und Fix-it-Schlüsselpfade

## Sandbox: wo Tools ausgeführt werden

Sandboxing wird über `agents.defaults.sandbox.mode` gesteuert:

- `"off"`: Alles wird auf dem Host ausgeführt.
- `"non-main"`: Nur non-main-Sitzungen laufen in einer Sandbox (eine häufige „Überraschung“ bei Gruppen/Channels).
- `"all"`: Alles läuft in einer Sandbox.

Siehe [Sandboxing](/de/gateway/sandboxing) für die vollständige Matrix (Scope, Workspace-Mounts, Images).

### Bind-Mounts (Sicherheits-Kurzprüfung)

- `docker.binds` _durchbricht_ das Sandbox-Dateisystem: Alles, was Sie mounten, ist innerhalb des Containers mit dem von Ihnen gesetzten Modus sichtbar (`:ro` oder `:rw`).
- Standardmäßig ist der Modus Read-Write, wenn Sie ihn weglassen; bevorzugen Sie `:ro` für Quellcode/Secrets.
- `scope: "shared"` ignoriert Bind-Mounts pro Agent (es gelten nur globale Bind-Mounts).
- OpenClaw validiert Bind-Quellen zweimal: zuerst am normalisierten Quellpfad, dann erneut nach der Auflösung über den tiefsten vorhandenen Vorfahren. Escapes über Symlink-Eltern umgehen weder Prüfungen auf blockierte Pfade noch auf erlaubte Root-Pfade.
- Nicht vorhandene Leaf-Pfade werden weiterhin sicher geprüft. Wenn `/workspace/alias-out/new-file` über einen per Symlink verknüpften Elternpfad zu einem blockierten Pfad oder außerhalb der konfigurierten erlaubten Roots aufgelöst wird, wird der Bind-Mount abgelehnt.
- Das Binden von `/var/run/docker.sock` übergibt der Sandbox effektiv die Kontrolle über den Host; tun Sie dies nur bewusst.
- Workspace-Zugriff (`workspaceAccess: "ro"`/`"rw"`) ist unabhängig von Bind-Modi.

## Tool-Richtlinie: welche Tools existieren/aufrufbar sind

Zwei Ebenen sind wichtig:

- **Tool-Profil**: `tools.profile` und `agents.list[].tools.profile` (Basis-Allowlist)
- **Provider-Tool-Profil**: `tools.byProvider[provider].profile` und `agents.list[].tools.byProvider[provider].profile`
- **Globale/pro-Agent-Tool-Richtlinie**: `tools.allow`/`tools.deny` und `agents.list[].tools.allow`/`agents.list[].tools.deny`
- **Provider-Tool-Richtlinie**: `tools.byProvider[provider].allow/deny` und `agents.list[].tools.byProvider[provider].allow/deny`
- **Sandbox-Tool-Richtlinie** (gilt nur in der Sandbox): `tools.sandbox.tools.allow`/`tools.sandbox.tools.deny` und `agents.list[].tools.sandbox.tools.*`

Faustregeln:

- `deny` gewinnt immer.
- Wenn `allow` nicht leer ist, wird alles andere als blockiert behandelt.
- Die Tool-Richtlinie ist der harte Stopp: `/exec` kann ein verweigertes `exec`-Tool nicht überschreiben.
- `/exec` ändert nur Sitzungsstandards für autorisierte Absender; es gewährt keinen Tool-Zugriff.
  Provider-Tool-Schlüssel akzeptieren entweder `provider` (z. B. `google-antigravity`) oder `provider/model` (z. B. `openai/gpt-5.4`).

### Tool-Gruppen (Kurzformen)

Tool-Richtlinien (global, Agent, Sandbox) unterstützen `group:*`-Einträge, die auf mehrere Tools erweitert werden:

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
- `group:automation`: `cron`, `gateway`
- `group:messaging`: `message`
- `group:nodes`: `nodes`
- `group:agents`: `agents_list`
- `group:media`: `image`, `image_generate`, `video_generate`, `tts`
- `group:openclaw`: alle integrierten OpenClaw-Tools (ohne Provider-Plugins)

## Elevated: nur für Exec gedachtes „auf dem Host ausführen“

Elevated gewährt **keine** zusätzlichen Tools; es betrifft nur `exec`.

- Wenn Sie in einer Sandbox sind, führt `/elevated on` (oder `exec` mit `elevated: true`) außerhalb der Sandbox aus (Genehmigungen können weiterhin gelten).
- Verwenden Sie `/elevated full`, um Exec-Genehmigungen für die Sitzung zu überspringen.
- Wenn Sie bereits direkt ausführen, ist Elevated effektiv ein No-op (weiterhin gated).
- Elevated ist **nicht** auf Skills beschränkt und überschreibt keine Tool-Allow-/Deny-Richtlinie.
- Elevated gewährt keine beliebigen hostübergreifenden Überschreibungen von `host=auto`; es folgt den normalen Regeln für Exec-Ziele und behält `node` nur dann bei, wenn das konfigurierte/Sitzungsziel bereits `node` ist.
- `/exec` ist von Elevated getrennt. Es passt nur die Exec-Standards pro Sitzung für autorisierte Absender an.

Gates:

- Aktivierung: `tools.elevated.enabled` (und optional `agents.list[].tools.elevated.enabled`)
- Absender-Allowlists: `tools.elevated.allowFrom.<provider>` (und optional `agents.list[].tools.elevated.allowFrom.<provider>`)

Siehe [Elevated Mode](/de/tools/elevated).

## Häufige Korrekturen für die „Sandbox-Jail“

### „Tool X durch Sandbox-Tool-Richtlinie blockiert“

Fix-it-Schlüssel (wählen Sie einen):

- Sandbox deaktivieren: `agents.defaults.sandbox.mode=off` (oder pro Agent `agents.list[].sandbox.mode=off`)
- Das Tool innerhalb der Sandbox erlauben:
  - aus `tools.sandbox.tools.deny` entfernen (oder pro Agent `agents.list[].tools.sandbox.tools.deny`)
  - oder zu `tools.sandbox.tools.allow` hinzufügen (oder zur pro-Agent-Allowlist)

### „Ich dachte, das wäre main, warum läuft es in einer Sandbox?“

Im Modus `"non-main"` sind Gruppen-/Channel-Schlüssel _nicht_ main. Verwenden Sie den main-Sitzungsschlüssel (wird von `sandbox explain` angezeigt) oder wechseln Sie den Modus zu `"off"`.

## Siehe auch

- [Sandboxing](/de/gateway/sandboxing) -- vollständige Sandbox-Referenz (Modi, Scopes, Backends, Images)
- [Multi-Agent Sandbox & Tools](/de/tools/multi-agent-sandbox-tools) -- Überschreibungen pro Agent und Priorität
- [Elevated Mode](/de/tools/elevated)
