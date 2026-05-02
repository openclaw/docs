---
read_when:
    - Sie möchten mehrere isolierte Agenten (Arbeitsbereiche + Routing + Authentifizierung)
summary: CLI-Referenz für `openclaw agents` (list/add/delete/bindings/bind/unbind/set identity)
title: Agenten
x-i18n:
    generated_at: "2026-05-02T20:42:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3522394dd416a9c8b4bf25767a14073484df0ff3d7c546cf6c730f111c5c51dc
    source_path: cli/agents.md
    workflow: 16
---

# `openclaw agents`

Isolierte Agenten verwalten (Arbeitsbereiche + Authentifizierung + Routing).

Verwandt:

- [Multi-Agent-Routing](/de/concepts/multi-agent)
- [Agent-Arbeitsbereich](/de/concepts/agent-workspace)
- [Skills-Konfiguration](/de/tools/skills-config): Konfiguration der Skills-Sichtbarkeit.

## Beispiele

```bash
openclaw agents list
openclaw agents list --bindings
openclaw agents add work --workspace ~/.openclaw/workspace-work
openclaw agents add ops --workspace ~/.openclaw/workspace-ops --bind telegram:ops --non-interactive
openclaw agents bindings
openclaw agents bind --agent work --bind telegram:ops
openclaw agents unbind --agent work --bind telegram:ops
openclaw agents set-identity --workspace ~/.openclaw/workspace --from-identity
openclaw agents set-identity --agent main --avatar avatars/openclaw.png
openclaw agents delete work
```

## Routing-Bindungen

Verwenden Sie Routing-Bindungen, um eingehenden Kanalverkehr einem bestimmten Agenten fest zuzuordnen.

Wenn Sie außerdem je Agent unterschiedliche sichtbare Skills verwenden möchten, konfigurieren Sie `agents.defaults.skills` und `agents.list[].skills` in `openclaw.json`. Siehe [Skills-Konfiguration](/de/tools/skills-config) und [Konfigurationsreferenz](/de/gateway/config-agents#agents-defaults-skills).

Bindungen auflisten:

```bash
openclaw agents bindings
openclaw agents bindings --agent work
openclaw agents bindings --json
```

Bindungen hinzufügen:

```bash
openclaw agents bind --agent work --bind telegram:ops --bind discord:guild-a
```

Wenn Sie `accountId` (`--bind <channel>`) weglassen, löst OpenClaw diese aus den Kanalstandards und Plugin-Setup-Hooks auf, sofern verfügbar.

Wenn Sie `--agent` für `bind` oder `unbind` weglassen, verwendet OpenClaw den aktuellen Standardagenten als Ziel.

### Verhalten des Bindungsbereichs

- Eine Bindung ohne `accountId` entspricht nur dem Standardkonto des Kanals.
- `accountId: "*"` ist der kanalweite Fallback (alle Konten) und ist weniger spezifisch als eine explizite Kontobindung.
- Wenn derselbe Agent bereits eine passende Kanalbindung ohne `accountId` hat und Sie später mit einer expliziten oder aufgelösten `accountId` binden, aktualisiert OpenClaw diese vorhandene Bindung direkt, statt ein Duplikat hinzuzufügen.

Beispiel:

```bash
# initial channel-only binding
openclaw agents bind --agent work --bind telegram

# later upgrade to account-scoped binding
openclaw agents bind --agent work --bind telegram:ops
```

Nach der Aktualisierung ist das Routing für diese Bindung auf `telegram:ops` begrenzt. Wenn Sie auch Routing für das Standardkonto möchten, fügen Sie es explizit hinzu (zum Beispiel `--bind telegram:default`).

Bindungen entfernen:

```bash
openclaw agents unbind --agent work --bind telegram:ops
openclaw agents unbind --agent work --all
```

`unbind` akzeptiert entweder `--all` oder einen oder mehrere `--bind`-Werte, aber nicht beides.

## Befehlsoberfläche

### `agents`

Das Ausführen von `openclaw agents` ohne Unterbefehl entspricht `openclaw agents list`.

### `agents list`

Optionen:

- `--json`
- `--bindings`: vollständige Routing-Regeln einschließen, nicht nur Zählungen/Zusammenfassungen je Agent

### `agents add [name]`

Optionen:

- `--workspace <dir>`
- `--model <id>`
- `--agent-dir <dir>`
- `--bind <channel[:accountId]>` (wiederholbar)
- `--non-interactive`
- `--json`

Hinweise:

- Das Übergeben expliziter Add-Flags schaltet den Befehl in den nicht interaktiven Pfad.
- Der nicht interaktive Modus erfordert sowohl einen Agentennamen als auch `--workspace`.
- `main` ist reserviert und kann nicht als neue Agenten-ID verwendet werden.
- Im interaktiven Modus kopiert das Authentifizierungs-Seeding nur portable statische Profile
  (`api_key` und standardmäßig statische `token`). OAuth-Refresh-Token-Profile bleiben
  nur über Read-through-Vererbung aus dem echten `main`-Agentenspeicher verfügbar.
  Wenn der konfigurierte Standardagent nicht `main` ist, melden Sie sich für OAuth-
  Profile auf dem neuen Agenten separat an.

### `agents bindings`

Optionen:

- `--agent <id>`
- `--json`

### `agents bind`

Optionen:

- `--agent <id>` (standardmäßig der aktuelle Standardagent)
- `--bind <channel[:accountId]>` (wiederholbar)
- `--json`

### `agents unbind`

Optionen:

- `--agent <id>` (standardmäßig der aktuelle Standardagent)
- `--bind <channel[:accountId]>` (wiederholbar)
- `--all`
- `--json`

### `agents delete <id>`

Optionen:

- `--force`
- `--json`

Hinweise:

- `main` kann nicht gelöscht werden.
- Ohne `--force` ist eine interaktive Bestätigung erforderlich.
- Arbeitsbereich, Agentenstatus und Sitzungs-Transkriptverzeichnisse werden in den Papierkorb verschoben, nicht endgültig gelöscht.
- Wenn der Gateway erreichbar ist, wird die Löschung über den Gateway gesendet, sodass Konfiguration und Bereinigung des Sitzungsspeichers denselben Writer wie der Laufzeitverkehr verwenden. Wenn der Gateway nicht erreichbar ist, fällt die CLI auf den lokalen Offline-Pfad zurück.
- Wenn der Arbeitsbereich eines anderen Agenten derselbe Pfad ist, innerhalb dieses Arbeitsbereichs liegt oder diesen Arbeitsbereich enthält,
  bleibt der Arbeitsbereich erhalten und `--json` meldet `workspaceRetained`,
  `workspaceRetainedReason` und `workspaceSharedWith`.

## Identitätsdateien

Jeder Agenten-Arbeitsbereich kann eine `IDENTITY.md` im Stammverzeichnis des Arbeitsbereichs enthalten:

- Beispielpfad: `~/.openclaw/workspace/IDENTITY.md`
- `set-identity --from-identity` liest aus dem Stammverzeichnis des Arbeitsbereichs (oder aus einer expliziten `--identity-file`)

Avatar-Pfade werden relativ zum Stammverzeichnis des Arbeitsbereichs aufgelöst.

## Identität festlegen

`set-identity` schreibt Felder in `agents.list[].identity`:

- `name`
- `theme`
- `emoji`
- `avatar` (arbeitsbereichsrelativer Pfad, http(s)-URL oder Daten-URI)

Optionen:

- `--agent <id>`
- `--workspace <dir>`
- `--identity-file <path>`
- `--from-identity`
- `--name <name>`
- `--theme <theme>`
- `--emoji <emoji>`
- `--avatar <value>`
- `--json`

Hinweise:

- `--agent` oder `--workspace` kann verwendet werden, um den Zielagenten auszuwählen.
- Wenn Sie `--workspace` verwenden und mehrere Agenten diesen Arbeitsbereich teilen, schlägt der Befehl fehl und fordert Sie auf, `--agent` zu übergeben.
- Wenn keine expliziten Identitätsfelder angegeben werden, liest der Befehl Identitätsdaten aus `IDENTITY.md`.

Aus `IDENTITY.md` laden:

```bash
openclaw agents set-identity --workspace ~/.openclaw/workspace --from-identity
```

Felder explizit überschreiben:

```bash
openclaw agents set-identity --agent main --name "OpenClaw" --emoji "🦞" --avatar avatars/openclaw.png
```

Konfigurationsbeispiel:

```json5
{
  agents: {
    list: [
      {
        id: "main",
        identity: {
          name: "OpenClaw",
          theme: "space lobster",
          emoji: "🦞",
          avatar: "avatars/openclaw.png",
        },
      },
    ],
  },
}
```

## Verwandt

- [CLI-Referenz](/de/cli)
- [Multi-Agent-Routing](/de/concepts/multi-agent)
- [Agent-Arbeitsbereich](/de/concepts/agent-workspace)
