---
read_when:
    - Sie möchten mehrere isolierte Agenten (Workspaces + Routing + Authentifizierung)
summary: CLI-Referenz für `openclaw agents` (auflisten/hinzufügen/löschen/Bindungen/binden/entbinden/Identität festlegen)
title: Agenten
x-i18n:
    generated_at: "2026-06-27T17:17:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7905bc2465c48b5bfee4ce90fdf96dcd92b304a9fb29de93f8f49afdff0e6672
    source_path: cli/agents.md
    workflow: 16
---

# `openclaw agents`

Isolierte Agenten verwalten (Workspaces + Authentifizierung + Routing).

Verwandt:

- [Multi-Agent-Routing](/de/concepts/multi-agent)
- [Agent-Workspace](/de/concepts/agent-workspace)
- [Skills-Konfiguration](/de/tools/skills-config): Konfiguration der Skill-Sichtbarkeit.

## Beispiele

```bash
openclaw agents list
openclaw agents list --bindings
openclaw agents add work --workspace ~/.openclaw/workspace-work
openclaw agents add work --workspace ~/.openclaw/workspace-work --bind telegram:*
openclaw agents add ops --workspace ~/.openclaw/workspace-ops --bind telegram:ops --non-interactive
openclaw agents bindings
openclaw agents bind --agent work --bind telegram:ops
openclaw agents unbind --agent work --bind telegram:ops
openclaw agents set-identity --workspace ~/.openclaw/workspace --from-identity
openclaw agents set-identity --agent main --avatar avatars/openclaw.png
openclaw agents delete work
```

## Routing-Bindings

Verwenden Sie Routing-Bindings, um eingehenden Channel-Traffic einem bestimmten Agenten fest zuzuordnen.

Wenn Sie außerdem pro Agent unterschiedliche sichtbare Skills verwenden möchten, konfigurieren Sie `agents.defaults.skills` und `agents.list[].skills` in `openclaw.json`. Siehe [Skills-Konfiguration](/de/tools/skills-config) und [Konfigurationsreferenz](/de/gateway/config-agents#agents-defaults-skills).

Bindings auflisten:

```bash
openclaw agents bindings
openclaw agents bindings --agent work
openclaw agents bindings --json
```

Bindings hinzufügen:

```bash
openclaw agents bind --agent work --bind telegram:ops --bind discord:guild-a
```

Sie können Bindings auch beim Erstellen eines Agenten hinzufügen:

```bash
openclaw agents add work --workspace ~/.openclaw/workspace-work --bind telegram:* --bind discord:*
```

Wenn Sie `accountId` weglassen (`--bind <channel>`), löst OpenClaw sie aus Plugin-Setup-Hooks, erzwungenem Account-Binding oder der konfigurierten Account-Anzahl des Channels auf.

Wenn Sie `--agent` für `bind` oder `unbind` weglassen, verwendet OpenClaw den aktuellen Standardagenten als Ziel.

### `--bind`-Format

| Format                       | Bedeutung                                                                                         |
| ---------------------------- | ------------------------------------------------------------------------------------------------- |
| `--bind <channel>:*`         | Entspricht allen Accounts auf dem Channel.                                                        |
| `--bind <channel>:<account>` | Entspricht einem Account.                                                                         |
| `--bind <channel>`           | Entspricht nur dem Standardaccount, außer die CLI kann einen Plugin-spezifischen Account-Scope sicher auflösen. |

### Verhalten des Binding-Scopes

- Ein gespeichertes Binding ohne `accountId` entspricht nur dem Standardaccount des Channels.
- `accountId: "*"` ist der channelweite Fallback (alle Accounts) und ist weniger spezifisch als ein explizites Account-Binding.
- Wenn derselbe Agent bereits ein passendes Channel-Binding ohne `accountId` hat und Sie später mit einer expliziten oder aufgelösten `accountId` binden, aktualisiert OpenClaw dieses vorhandene Binding direkt, statt ein Duplikat hinzuzufügen.

Beispiele:

```bash
# match all accounts on the channel
openclaw agents bind --agent work --bind telegram:*

# match a specific account
openclaw agents bind --agent work --bind telegram:ops

# initial channel-only binding
openclaw agents bind --agent work --bind telegram

# later upgrade to account-scoped binding
openclaw agents bind --agent work --bind telegram:alerts
```

Nach dem Upgrade ist das Routing für dieses Binding auf `telegram:alerts` beschränkt. Wenn Sie zusätzlich Routing für den Standardaccount möchten, fügen Sie es explizit hinzu (zum Beispiel `--bind telegram:default`).

Bindings entfernen:

```bash
openclaw agents unbind --agent work --bind telegram:ops
openclaw agents unbind --agent work --all
```

`unbind` akzeptiert entweder `--all` oder einen oder mehrere `--bind`-Werte, nicht beides.

## Befehlsoberfläche

### `agents`

Das Ausführen von `openclaw agents` ohne Unterbefehl entspricht `openclaw agents list`.

### `agents list`

Optionen:

- `--json`
- `--bindings`: vollständige Routing-Regeln einschließen, nicht nur Zählungen/Zusammenfassungen pro Agent

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
- Im interaktiven Modus kopiert das Auth-Seeding nur portierbare statische Profile
  (`api_key` und statisches `token` standardmäßig). OAuth-Refresh-Token-Profile bleiben
  nur per Read-through-Vererbung aus dem echten `main`-Agentenspeicher verfügbar.
  Wenn der konfigurierte Standardagent nicht `main` ist, melden Sie sich separat für OAuth-
  Profile auf dem neuen Agenten an.

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
- Workspace-, Agentenstatus- und Sitzungs-Transkriptverzeichnisse werden in den Papierkorb verschoben, nicht endgültig gelöscht.
- Wenn der Gateway erreichbar ist, wird die Löschung über den Gateway gesendet, damit Konfiguration und Bereinigung des Sitzungsspeichers denselben Writer wie Runtime-Traffic verwenden. Wenn der Gateway nicht erreichbar ist, fällt die CLI auf den lokalen Offline-Pfad zurück.
- Wenn der Workspace eines anderen Agenten derselbe Pfad ist, innerhalb dieses Workspaces liegt oder diesen Workspace enthält,
  bleibt der Workspace erhalten und `--json` meldet `workspaceRetained`,
  `workspaceRetainedReason` und `workspaceSharedWith`.

## Identitätsdateien

Jeder Agenten-Workspace kann eine `IDENTITY.md` im Workspace-Stammverzeichnis enthalten:

- Beispielpfad: `~/.openclaw/workspace/IDENTITY.md`
- `set-identity --from-identity` liest aus dem Workspace-Stammverzeichnis (oder aus einer expliziten `--identity-file`)

Avatar-Pfade werden relativ zum Workspace-Stammverzeichnis aufgelöst.

## Identität festlegen

`set-identity` schreibt Felder in `agents.list[].identity`:

- `name`
- `theme`
- `emoji`
- `avatar` (workspace-relativer Pfad, http(s)-URL oder Data-URI)

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

- Mit `--agent` oder `--workspace` können Sie den Zielagenten auswählen.
- Wenn Sie sich auf `--workspace` verlassen und mehrere Agenten diesen Workspace teilen, schlägt der Befehl fehl und fordert Sie auf, `--agent` zu übergeben.
- Lokale workspace-relative Avatar-Bilddateien sind auf 2 MB begrenzt. HTTP(S)-URLs und `data:`-URIs werden nicht mit der lokalen Dateigrößenbegrenzung geprüft.
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
- [Agent-Workspace](/de/concepts/agent-workspace)
