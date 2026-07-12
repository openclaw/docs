---
read_when:
    - Sie möchten mehrere isolierte Agenten (Arbeitsbereiche + Routing + Authentifizierung)
summary: CLI-Referenz für `openclaw agents` (auflisten/hinzufügen/löschen/Bindungen/binden/Bindung aufheben/Identität festlegen)
title: Agenten
x-i18n:
    generated_at: "2026-07-12T15:10:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 89b6c59a9ce0fd0514343cc3fa66ae5e6d963cdfa5c6f58ffe6b9a6b5e943f09
    source_path: cli/agents.md
    workflow: 16
---

# `openclaw agents`

Verwalten Sie isolierte Agenten (Arbeitsbereiche + Authentifizierung + Routing). Das Ausführen von `openclaw agents` ohne Unterbefehl entspricht `openclaw agents list`.

Verwandte Themen:

- [Multi-Agent-Routing](/de/concepts/multi-agent)
- [Agentenarbeitsbereich](/de/concepts/agent-workspace)
- [Skills-Konfiguration](/de/tools/skills-config): Konfiguration der Sichtbarkeit von Skills.

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

## Befehlsübersicht

### `agents list`

Optionen: `--json`, `--bindings` (vollständige Routingregeln einschließen, nicht nur Anzahlen/Zusammenfassungen pro Agent).

### `agents add [name]`

Optionen: `--workspace <dir>`, `--model <id>`, `--agent-dir <dir>`, `--bind <channel[:accountId]>` (wiederholbar), `--non-interactive`, `--json`.

- Die Angabe eines beliebigen expliziten Hinzufügungs-Flags versetzt den Befehl in den nicht interaktiven Modus.
- Der nicht interaktive Modus erfordert sowohl einen Agentennamen als auch `--workspace`.
- `main` ist reserviert und kann nicht als neue Agenten-ID verwendet werden.
- Im interaktiven Modus wird die Authentifizierung initialisiert, indem nur portable statische Anmeldedaten (`api_key`- und statische `token`-Profile) kopiert werden, sofern Anmeldedaten dies nicht mit `copyToAgents: false` deaktivieren; OAuth-Aktualisierungstoken-Profile werden nur kopiert, wenn ein Provider dies mit `copyToAgents: true` aktiviert. Ohne Kopie bleibt OAuth ausschließlich durch durchgereichte Vererbung aus dem Speicher des tatsächlichen `main`-Agenten verfügbar. Wenn der konfigurierte Standardagent nicht `main` ist, melden Sie sich für OAuth-Profile beim neuen Agenten separat an.

### `agents bindings`

Optionen: `--agent <id>`, `--json`.

### `agents bind`

Optionen: `--agent <id>` (standardmäßig der aktuelle Standardagent), `--bind <channel[:accountId]>` (wiederholbar), `--json`.

### `agents unbind`

Optionen: `--agent <id>` (standardmäßig der aktuelle Standardagent), `--bind <channel[:accountId]>` (wiederholbar), `--all`, `--json`. Akzeptiert entweder `--all` oder einen oder mehrere `--bind`-Werte, nicht beides.

### `agents set-identity`

Optionen: `--agent <id>`, `--workspace <dir>`, `--identity-file <path>`, `--from-identity`, `--name <name>`, `--theme <theme>`, `--emoji <emoji>`, `--avatar <value>`, `--json`. Siehe unten [Identität festlegen](#set-identity).

### `agents delete <id>`

Optionen: `--force`, `--json`.

- `main` kann nicht gelöscht werden.
- Ohne `--force` ist eine interaktive Bestätigung erforderlich (schlägt in einer Sitzung ohne TTY fehl; führen Sie den Befehl erneut mit `--force` aus).
- Arbeitsbereich, Agentenstatus und Verzeichnisse mit Sitzungsprotokollen werden in den Papierkorb verschoben und nicht endgültig gelöscht.
- Wenn der Gateway erreichbar ist, erfolgt das Löschen über den Gateway, sodass die Bereinigung von Konfiguration und Sitzungsspeicher denselben Schreibprozess wie der Laufzeitdatenverkehr verwendet. Wenn der Gateway nicht erreichbar ist, greift die CLI auf den lokalen Offline-Pfad zurück.
- Wenn der Arbeitsbereich eines anderen Agenten denselben Pfad verwendet, sich innerhalb dieses Arbeitsbereichs befindet oder diesen Arbeitsbereich enthält, wird der Arbeitsbereich beibehalten, und `--json` meldet `workspaceRetained`, `workspaceRetainedReason` und `workspaceSharedWith`.

## Routing-Bindungen

Verwenden Sie Routing-Bindungen, um eingehenden Kanalverkehr einem bestimmten Agenten fest zuzuordnen.

Wenn Sie außerdem pro Agent unterschiedliche sichtbare Skills wünschen, konfigurieren Sie `agents.defaults.skills` und `agents.list[].skills` in `openclaw.json`. Siehe [Skills-Konfiguration](/de/tools/skills-config) und [Konfigurationsreferenz](/de/gateway/config-agents#agentsdefaultsskills).

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

Sie können Bindungen auch beim Erstellen eines Agenten hinzufügen:

```bash
openclaw agents add work --workspace ~/.openclaw/workspace-work --bind telegram:* --bind discord:*
```

Wenn Sie `accountId` weglassen (`--bind <channel>`), löst OpenClaw sie über Plugin-Einrichtungs-Hooks, eine erzwungene Kontobindung oder die konfigurierte Kontenanzahl des Kanals auf.

Wenn Sie `--agent` bei `bind` oder `unbind` weglassen, verwendet OpenClaw den aktuellen Standardagenten als Ziel.

### Format von `--bind`

| Format                       | Bedeutung                                                                                                                    |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `--bind <channel>:*`         | Entspricht allen Konten des Kanals.                                                                                           |
| `--bind <channel>:<account>` | Entspricht einem Konto.                                                                                                       |
| `--bind <channel>`           | Entspricht nur dem Standardkonto, sofern die CLI nicht sicher einen Plugin-spezifischen Kontobereich auflösen kann.           |

### Verhalten des Bindungsbereichs

- Eine gespeicherte Bindung ohne `accountId` entspricht nur dem Standardkonto des Kanals.
- `accountId: "*"` ist der kanalweite Fallback (alle Konten) und weniger spezifisch als eine explizite Kontobindung.
- Wenn derselbe Agent bereits über eine passende Kanalbindung ohne `accountId` verfügt und Sie später eine Bindung mit einer expliziten oder aufgelösten `accountId` hinzufügen, aktualisiert OpenClaw die bestehende Bindung direkt, anstatt ein Duplikat hinzuzufügen.

Beispiele:

```bash
# allen Konten des Kanals entsprechen
openclaw agents bind --agent work --bind telegram:*

# einem bestimmten Konto entsprechen
openclaw agents bind --agent work --bind telegram:ops

# anfängliche reine Kanalbindung
openclaw agents bind --agent work --bind telegram

# später auf eine kontobezogene Bindung aktualisieren
openclaw agents bind --agent work --bind telegram:alerts
```

Nach der Aktualisierung ist das Routing für diese Bindung auf `telegram:alerts` beschränkt. Wenn Sie außerdem Routing für das Standardkonto wünschen, fügen Sie es explizit hinzu (zum Beispiel `--bind telegram:default`).

Bindungen entfernen:

```bash
openclaw agents unbind --agent work --bind telegram:ops
openclaw agents unbind --agent work --all
```

## Identitätsdateien

Jeder Agentenarbeitsbereich kann im Stammverzeichnis des Arbeitsbereichs eine `IDENTITY.md` enthalten:

- Beispielpfad: `~/.openclaw/workspace/IDENTITY.md`
- `set-identity --from-identity` liest aus dem Stammverzeichnis des Arbeitsbereichs (oder aus einer expliziten `--identity-file`).

Avatar-Pfade werden relativ zum Stammverzeichnis des Arbeitsbereichs aufgelöst und können dieses auch über einen symbolischen Link nicht verlassen.

## Identität festlegen

`set-identity` schreibt Felder in `agents.list[].identity`: `name`, `theme`, `emoji`, `avatar` (arbeitsbereichsrelativer Pfad, HTTP(S)-URL oder Daten-URI).

- `--agent` oder `--workspace` wählt den Zielagenten aus. Wenn `--workspace` mit mehr als einem Agenten übereinstimmt, schlägt der Befehl fehl und fordert Sie auf, `--agent` anzugeben.
- Lokale, arbeitsbereichsrelative Avatar-Bilddateien sind auf 2 MB begrenzt. HTTP(S)-URLs und `data:`-URIs werden nicht anhand der lokalen Dateigrößenbegrenzung geprüft.
- Wenn keine expliziten Identitätsfelder angegeben werden, liest der Befehl die Identitätsdaten aus `IDENTITY.md`.

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
          theme: "Weltraumhummer",
          emoji: "🦞",
          avatar: "avatars/openclaw.png",
        },
      },
    ],
  },
}
```

## Verwandte Themen

- [CLI-Referenz](/de/cli)
- [Multi-Agent-Routing](/de/concepts/multi-agent)
- [Agentenarbeitsbereich](/de/concepts/agent-workspace)
