---
read_when:
    - Sie möchten mehrere isolierte Agenten (Workspaces + Routing + Authentifizierung)
summary: CLI-Referenz für `openclaw agents` (`list`/`add`/`delete`/`bindings`/`bind`/`unbind`/`set identity`)
title: Agenten
x-i18n:
    generated_at: "2026-04-25T13:42:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: fcd0698f0821f9444e84cd82fe78ee46071447fb4c3cada6d1a98b5130147691
    source_path: cli/agents.md
    workflow: 15
---

# `openclaw agents`

Verwalten Sie isolierte Agenten (Workspaces + Authentifizierung + Routing).

Verwandt:

- Multi-Agent-Routing: [Multi-Agent Routing](/de/concepts/multi-agent)
- Agent-Workspace: [Agent workspace](/de/concepts/agent-workspace)
- Konfiguration der Skills-Sichtbarkeit: [Skills config](/de/tools/skills-config)

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

Verwenden Sie Routing-Bindungen, um eingehenden Kanalverkehr an einen bestimmten Agenten zu binden.

Wenn Sie außerdem pro Agent unterschiedliche sichtbare Skills möchten, konfigurieren Sie
`agents.defaults.skills` und `agents.list[].skills` in `openclaw.json`. Siehe
[Skills config](/de/tools/skills-config) und
[Configuration Reference](/de/gateway/config-agents#agents-defaults-skills).

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

Wenn Sie `accountId` weglassen (`--bind <channel>`), löst OpenClaw ihn aus den Kanalstandards und Plugin-Setup-Hooks auf, sofern verfügbar.

Wenn Sie `--agent` bei `bind` oder `unbind` weglassen, verwendet OpenClaw den aktuellen Standard-Agenten als Ziel.

### Verhalten des Bindungsumfangs

- Eine Bindung ohne `accountId` entspricht nur dem Standardkonto des Kanals.
- `accountId: "*"` ist der kanalweite Fallback (alle Konten) und weniger spezifisch als eine explizite Kontobindung.
- Wenn derselbe Agent bereits eine passende Kanalbindung ohne `accountId` hat und Sie später mit einer expliziten oder aufgelösten `accountId` binden, stuft OpenClaw diese bestehende Bindung direkt hoch, anstatt ein Duplikat hinzuzufügen.

Beispiel:

```bash
# anfängliche rein kanalbezogene Bindung
openclaw agents bind --agent work --bind telegram

# späteres Upgrade auf kontobezogene Bindung
openclaw agents bind --agent work --bind telegram:ops
```

Nach dem Upgrade ist das Routing für diese Bindung auf `telegram:ops` begrenzt. Wenn Sie außerdem Routing für das Standardkonto möchten, fügen Sie es explizit hinzu (zum Beispiel `--bind telegram:default`).

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
- `--bindings`: vollständige Routing-Regeln einbeziehen, nicht nur Zählungen/Zusammenfassungen pro Agent

### `agents add [name]`

Optionen:

- `--workspace <dir>`
- `--model <id>`
- `--agent-dir <dir>`
- `--bind <channel[:accountId]>` (wiederholbar)
- `--non-interactive`
- `--json`

Hinweise:

- Die Übergabe expliziter Add-Flags schaltet den Befehl in den nicht interaktiven Pfad.
- Der nicht interaktive Modus erfordert sowohl einen Agentennamen als auch `--workspace`.
- `main` ist reserviert und kann nicht als neue Agenten-ID verwendet werden.

### `agents bindings`

Optionen:

- `--agent <id>`
- `--json`

### `agents bind`

Optionen:

- `--agent <id>` (standardmäßig der aktuelle Standard-Agent)
- `--bind <channel[:accountId]>` (wiederholbar)
- `--json`

### `agents unbind`

Optionen:

- `--agent <id>` (standardmäßig der aktuelle Standard-Agent)
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
- Workspace-, Agentenzustands- und Sitzungstranskriptverzeichnisse werden in den Papierkorb verschoben, nicht endgültig gelöscht.
- Wenn der Workspace eines anderen Agenten derselbe Pfad ist, sich innerhalb dieses Workspace befindet oder diesen Workspace enthält,
  bleibt der Workspace erhalten, und `--json` meldet `workspaceRetained`,
  `workspaceRetainedReason` und `workspaceSharedWith`.

## Identity-Dateien

Jeder Agent-Workspace kann ein `IDENTITY.md` im Workspace-Stamm enthalten:

- Beispielpfad: `~/.openclaw/workspace/IDENTITY.md`
- `set-identity --from-identity` liest aus dem Workspace-Stamm (oder aus einer expliziten `--identity-file`)

Avatar-Pfade werden relativ zum Workspace-Stamm aufgelöst.

## Identity festlegen

`set-identity` schreibt Felder in `agents.list[].identity`:

- `name`
- `theme`
- `emoji`
- `avatar` (workspace-relativer Pfad, http(s)-URL oder Daten-URI)

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

- `--agent` oder `--workspace` kann verwendet werden, um den Ziel-Agenten auszuwählen.
- Wenn Sie sich auf `--workspace` verlassen und mehrere Agenten denselben Workspace gemeinsam nutzen, schlägt der Befehl fehl und fordert Sie auf, `--agent` zu übergeben.
- Wenn keine expliziten Identity-Felder angegeben werden, liest der Befehl die Identity-Daten aus `IDENTITY.md`.

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
          theme: "Weltraum-Hummer",
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
