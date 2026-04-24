---
read_when:
    - Chcesz wielu odizolowanych agentów (obszary robocze + routing + uwierzytelnianie)
summary: Dokumentacja referencyjna CLI dla `openclaw agents` (`list`/`add`/`delete`/`bindings`/`bind`/`unbind`/`set identity`)
title: Agenci
x-i18n:
    generated_at: "2026-04-24T09:01:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 04d0ce4f3fb3d0c0ba8ffb3676674cda7d9a60441a012bc94ff24a17105632f1
    source_path: cli/agents.md
    workflow: 15
---

# `openclaw agents`

Zarządzanie odizolowanymi agentami (obszary robocze + uwierzytelnianie + routing).

Powiązane:

- Routing wielu agentów: [Multi-Agent Routing](/pl/concepts/multi-agent)
- Obszar roboczy agenta: [Agent workspace](/pl/concepts/agent-workspace)
- Konfiguracja widoczności Skills: [Skills config](/pl/tools/skills-config)

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

Używaj powiązań routingu, aby przypisać przychodzący ruch kanału do konkretnego agenta.

Jeśli chcesz także mieć różną widoczność Skills dla każdego agenta, skonfiguruj
`agents.defaults.skills` i `agents.list[].skills` w `openclaw.json`. Zobacz
[Skills config](/pl/tools/skills-config) oraz
[Configuration Reference](/pl/gateway/config-agents#agents-defaults-skills).

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

Jeśli pominiesz `accountId` (`--bind <channel>`), OpenClaw rozwiąże go na podstawie domyślnych ustawień kanału i haków konfiguracji Pluginów, jeśli są dostępne.

Jeśli pominiesz `--agent` dla `bind` lub `unbind`, OpenClaw kieruje operację do bieżącego domyślnego agenta.

### Zachowanie zakresu powiązań

- Powiązanie bez `accountId` pasuje tylko do domyślnego konta kanału.
- `accountId: "*"` jest ustawieniem awaryjnym dla całego kanału (wszystkie konta) i ma mniejszą specyficzność niż jawne powiązanie konta.
- Jeśli ten sam agent ma już pasujące powiązanie kanału bez `accountId`, a później dodasz powiązanie z jawnym lub rozwiązanym `accountId`, OpenClaw uaktualni istniejące powiązanie w miejscu zamiast dodawać duplikat.

Przykład:

```bash
# initial channel-only binding
openclaw agents bind --agent work --bind telegram

# later upgrade to account-scoped binding
openclaw agents bind --agent work --bind telegram:ops
```

Po uaktualnieniu routing dla tego powiązania jest ograniczony do `telegram:ops`. Jeśli chcesz także routing dla konta domyślnego, dodaj go jawnie (na przykład `--bind telegram:default`).

Usuwanie powiązań:

```bash
openclaw agents unbind --agent work --bind telegram:ops
openclaw agents unbind --agent work --all
```

`unbind` akceptuje albo `--all`, albo co najmniej jedną wartość `--bind`, ale nie oba naraz.

## Powierzchnia poleceń

### `agents`

Uruchomienie `openclaw agents` bez podpolecenia jest równoważne `openclaw agents list`.

### `agents list`

Opcje:

- `--json`
- `--bindings`: dołącz pełne reguły routingu, a nie tylko liczniki/podsumowania per agent

### `agents add [name]`

Opcje:

- `--workspace <dir>`
- `--model <id>`
- `--agent-dir <dir>`
- `--bind <channel[:accountId]>` (można powtarzać)
- `--non-interactive`
- `--json`

Uwagi:

- Przekazanie dowolnych jawnych flag dodawania przełącza polecenie w tryb nieinteraktywny.
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

- `main` nie może zostać usunięte.
- Bez `--force` wymagana jest interaktywna prośba o potwierdzenie.
- Katalogi obszaru roboczego, stanu agenta i transkryptów sesji są przenoszone do Kosza, a nie trwale usuwane.

## Pliki tożsamości

Każdy obszar roboczy agenta może zawierać `IDENTITY.md` w katalogu głównym obszaru roboczego:

- Przykładowa ścieżka: `~/.openclaw/workspace/IDENTITY.md`
- `set-identity --from-identity` odczytuje dane z katalogu głównego obszaru roboczego (lub z jawnie podanego `--identity-file`)

Ścieżki awatarów są rozwiązywane względem katalogu głównego obszaru roboczego.

## Ustawianie tożsamości

`set-identity` zapisuje pola do `agents.list[].identity`:

- `name`
- `theme`
- `emoji`
- `avatar` (ścieżka względna względem obszaru roboczego, URL http(s) lub URI danych)

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

- `--agent` lub `--workspace` mogą zostać użyte do wskazania docelowego agenta.
- Jeśli polegasz na `--workspace`, a wiele agentów współdzieli ten obszar roboczy, polecenie zakończy się błędem i poprosi o przekazanie `--agent`.
- Gdy nie podano jawnych pól tożsamości, polecenie odczytuje dane tożsamości z `IDENTITY.md`.

Wczytanie z `IDENTITY.md`:

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

## Powiązane

- [Dokumentacja referencyjna CLI](/pl/cli)
- [Routing wielu agentów](/pl/concepts/multi-agent)
- [Agent workspace](/pl/concepts/agent-workspace)
