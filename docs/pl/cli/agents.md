---
read_when:
    - Chcesz mieć wielu odizolowanych agentów (workspace + routing + uwierzytelnianie)
summary: Dokumentacja CLI dla `openclaw agents` (list/add/delete/bindings/bind/unbind/set identity)
title: agents
x-i18n:
    generated_at: "2026-04-05T13:47:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 90b90c4915993bd8af322c0590d4cb59baabb8940598ce741315f8f95ef43179
    source_path: cli/agents.md
    workflow: 15
---

# `openclaw agents`

Zarządzanie odizolowanymi agentami (workspace + uwierzytelnianie + routing).

Powiązane:

- Routing wielu agentów: [Multi-Agent Routing](/concepts/multi-agent)
- Workspace agenta: [Agent workspace](/concepts/agent-workspace)
- Konfiguracja widoczności Skills: [Skills config](/tools/skills-config)

## Przykłady

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

## Powiązania routingu

Użyj powiązań routingu, aby przypisać ruch przychodzący z kanału do konkretnego agenta.

Jeśli chcesz także mieć różne widoczne Skills dla poszczególnych agentów, skonfiguruj
`agents.defaults.skills` i `agents.list[].skills` w `openclaw.json`. Zobacz
[Skills config](/tools/skills-config) i
[Dokumentacja konfiguracji](/gateway/configuration-reference#agentsdefaultsskills).

Wyświetlanie powiązań:

```bash
openclaw agents bindings
openclaw agents bindings --agent work
openclaw agents bindings --json
```

Dodawanie powiązań:

```bash
openclaw agents bind --agent work --bind telegram:ops --bind discord:guild-a
```

Jeśli pominiesz `accountId` (`--bind <channel>`), OpenClaw ustali je na podstawie domyślnych ustawień kanału i hooków konfiguracji pluginów, jeśli są dostępne.

Jeśli pominiesz `--agent` dla `bind` lub `unbind`, OpenClaw kieruje operację do bieżącego domyślnego agenta.

### Zachowanie zakresu powiązań

- Powiązanie bez `accountId` pasuje tylko do domyślnego konta kanału.
- `accountId: "*"` jest fallbackiem na poziomie całego kanału (wszystkie konta) i ma mniejszą specyficzność niż jawne powiązanie konta.
- Jeśli ten sam agent ma już pasujące powiązanie kanału bez `accountId`, a później dodasz powiązanie z jawnym lub ustalonym `accountId`, OpenClaw zaktualizuje istniejące powiązanie na miejscu zamiast dodawać duplikat.

Przykład:

```bash
# początkowe powiązanie tylko z kanałem
openclaw agents bind --agent work --bind telegram

# późniejsza zmiana na powiązanie ograniczone do konta
openclaw agents bind --agent work --bind telegram:ops
```

Po tej zmianie routing dla tego powiązania będzie ograniczony do `telegram:ops`. Jeśli chcesz także routing dla konta domyślnego, dodaj go jawnie (na przykład `--bind telegram:default`).

Usuwanie powiązań:

```bash
openclaw agents unbind --agent work --bind telegram:ops
openclaw agents unbind --agent work --all
```

`unbind` akceptuje albo `--all`, albo co najmniej jedną wartość `--bind`, ale nie oba jednocześnie.

## Powierzchnia poleceń

### `agents`

Uruchomienie `openclaw agents` bez podkomendy jest równoważne `openclaw agents list`.

### `agents list`

Opcje:

- `--json`
- `--bindings`: dołącza pełne reguły routingu, a nie tylko liczniki/podsumowania per agent

### `agents add [name]`

Opcje:

- `--workspace <dir>`
- `--model <id>`
- `--agent-dir <dir>`
- `--bind <channel[:accountId]>` (można powtarzać)
- `--non-interactive`
- `--json`

Uwagi:

- Przekazanie dowolnych jawnych flag add przełącza polecenie na ścieżkę nieinteraktywną.
- Tryb nieinteraktywny wymaga zarówno nazwy agenta, jak i `--workspace`.
- `main` jest zarezerwowane i nie może być użyte jako identyfikator nowego agenta.

### `agents bindings`

Opcje:

- `--agent <id>`
- `--json`

### `agents bind`

Opcje:

- `--agent <id>` (domyślnie bieżący domyślny agent)
- `--bind <channel[:accountId]>` (można powtarzać)
- `--json`

### `agents unbind`

Opcje:

- `--agent <id>` (domyślnie bieżący domyślny agent)
- `--bind <channel[:accountId]>` (można powtarzać)
- `--all`
- `--json`

### `agents delete <id>`

Opcje:

- `--force`
- `--json`

Uwagi:

- `main` nie można usunąć.
- Bez `--force` wymagane jest interaktywne potwierdzenie.
- Katalogi workspace, stanu agenta i transkryptów sesji są przenoszone do Kosza, a nie trwale usuwane.

## Pliki tożsamości

Każdy workspace agenta może zawierać plik `IDENTITY.md` w katalogu głównym workspace:

- Przykładowa ścieżka: `~/.openclaw/workspace/IDENTITY.md`
- `set-identity --from-identity` odczytuje go z katalogu głównego workspace (lub z jawnie podanego `--identity-file`)

Ścieżki avatarów są rozwiązywane względem katalogu głównego workspace.

## Ustawianie tożsamości

`set-identity` zapisuje pola w `agents.list[].identity`:

- `name`
- `theme`
- `emoji`
- `avatar` (ścieżka względna względem workspace, URL http(s) lub URI data)

Opcje:

- `--agent <id>`
- `--workspace <dir>`
- `--identity-file <path>`
- `--from-identity`
- `--name <name>`
- `--theme <theme>`
- `--emoji <emoji>`
- `--avatar <value>`
- `--json`

Uwagi:

- Do wyboru docelowego agenta można użyć `--agent` albo `--workspace`.
- Jeśli polegasz na `--workspace`, a wielu agentów współdzieli ten sam workspace, polecenie zakończy się błędem i poprosi o podanie `--agent`.
- Gdy nie podano jawnie żadnych pól tożsamości, polecenie odczyta dane tożsamości z `IDENTITY.md`.

Wczytywanie z `IDENTITY.md`:

```bash
openclaw agents set-identity --workspace ~/.openclaw/workspace --from-identity
```

Jawne nadpisanie pól:

```bash
openclaw agents set-identity --agent main --name "OpenClaw" --emoji "🦞" --avatar avatars/openclaw.png
```

Przykład konfiguracji:

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
