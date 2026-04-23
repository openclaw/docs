---
read_when:
    - Sie möchten mehrere isolierte Agents (Workspaces + Routing + Authentifizierung)
summary: CLI-Referenz für `openclaw agents` (auflisten/hinzufügen/löschen/Bindungen/binden/lösen/Identität festlegen)
title: Agents
x-i18n:
    generated_at: "2026-04-23T06:25:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: f328d9f4ce636ce27defdcbcc48b1ca041bc25d0888c3e4df0dd79840f44ca8f
    source_path: cli/agents.md
    workflow: 15
---

# `openclaw agents`

Isolierte Agents verwalten (Workspaces + Authentifizierung + Routing).

Verwandt:

- Multi-Agent-Routing: [Multi-Agent Routing](/de/concepts/multi-agent)
- Agent-Workspace: [Agent workspace](/de/concepts/agent-workspace)
- Skills-Sichtbarkeitskonfiguration: [Skills config](/de/tools/skills-config)

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

Verwenden Sie Routing-Bindungen, um eingehenden Kanalverkehr an einen bestimmten Agent anzuheften.

Wenn Sie zusätzlich unterschiedliche sichtbare Skills pro Agent möchten, konfigurieren Sie
`agents.defaults.skills` und `agents.list[].skills` in `openclaw.json`. Siehe
[Skills config](/de/tools/skills-config) und
[Konfigurationsreferenz](/de/gateway/configuration-reference#agents-defaults-skills).

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

Wenn Sie `accountId` weglassen (`--bind <channel>`), löst OpenClaw sie aus den Kanalstandards und Plugin-Setup-Hooks auf, sofern verfügbar.

Wenn Sie `--agent` bei `bind` oder `unbind` weglassen, verwendet OpenClaw den aktuellen Standard-Agent.

### Verhalten des Bindungsbereichs

- Eine Bindung ohne `accountId` passt nur auf das Standardkonto des Kanals.
- `accountId: "*"` ist der kanalweite Fallback (alle Konten) und weniger spezifisch als eine explizite Kontobindung.
- Wenn derselbe Agent bereits eine passende Kanalbindung ohne `accountId` hat und Sie später mit einer expliziten oder aufgelösten `accountId` binden, aktualisiert OpenClaw diese vorhandene Bindung direkt, anstatt ein Duplikat hinzuzufügen.

Beispiel:

```bash
# anfängliche kanalbezogene Bindung
openclaw agents bind --agent work --bind telegram

# spätere Aktualisierung zu einer kontobezogenen Bindung
openclaw agents bind --agent work --bind telegram:ops
```

Nach der Aktualisierung ist das Routing für diese Bindung auf `telegram:ops` begrenzt. Wenn Sie zusätzlich Routing für das Standardkonto möchten, fügen Sie es explizit hinzu (zum Beispiel `--bind telegram:default`).

Bindungen entfernen:

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
- `--bindings`: vollständige Routing-Regeln einschließen, nicht nur Zählwerte/Zusammenfassungen pro Agent

### `agents add [name]`

Optionen:

- `--workspace <dir>`
- `--model <id>`
- `--agent-dir <dir>`
- `--bind <channel[:accountId]>` (wiederholbar)
- `--non-interactive`
- `--json`

Hinweise:

- Die Übergabe beliebiger expliziter Add-Flags schaltet den Befehl in den nicht interaktiven Pfad.
- Der nicht interaktive Modus erfordert sowohl einen Agent-Namen als auch `--workspace`.
- `main` ist reserviert und kann nicht als neue Agent-ID verwendet werden.

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
- Workspace-, Agent-Status- und Sitzungs-Transkriptverzeichnisse werden in den Papierkorb verschoben, nicht endgültig gelöscht.

## Identitätsdateien

Jeder Agent-Workspace kann im Workspace-Stamm eine `IDENTITY.md` enthalten:

- Beispielpfad: `~/.openclaw/workspace/IDENTITY.md`
- `set-identity --from-identity` liest aus dem Workspace-Stamm (oder aus einer expliziten `--identity-file`)

Avatar-Pfade werden relativ zum Workspace-Stamm aufgelöst.

## Identität festlegen

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

- `--agent` oder `--workspace` kann verwendet werden, um den Ziel-Agent auszuwählen.
- Wenn Sie sich auf `--workspace` verlassen und mehrere Agents diesen Workspace gemeinsam nutzen, schlägt der Befehl fehl und fordert Sie auf, `--agent` zu übergeben.
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
          theme: "Weltraum-Hummer",
          emoji: "🦞",
          avatar: "avatars/openclaw.png",
        },
      },
    ],
  },
}
```
