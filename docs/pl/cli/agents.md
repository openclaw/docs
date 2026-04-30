---
read_when:
    - Chcesz mieć wielu odizolowanych agentów (obszary robocze + routing + uwierzytelnianie)
summary: Dokumentacja referencyjna CLI dla `openclaw agents` (list/add/delete/bindings/bind/unbind/set identity)
title: Agenci
x-i18n:
    generated_at: "2026-04-30T09:41:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 46742a890a57cb1035a053f14fe574044e4a3d7dcc04812cd11c633bd808819b
    source_path: cli/agents.md
    workflow: 16
---

# `openclaw agents`

Zarządzaj izolowanymi agentami (obszary robocze + uwierzytelnianie + trasowanie).

Powiązane:

- [Trasowanie wieloagentowe](/pl/concepts/multi-agent)
- [Obszar roboczy agenta](/pl/concepts/agent-workspace)
- [Konfiguracja Skills](/pl/tools/skills-config): konfiguracja widoczności Skills.

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

## Powiązania trasowania

Użyj powiązań trasowania, aby przypiąć ruch przychodzący z kanału do konkretnego agenta.

Jeśli chcesz także mieć różne widoczne Skills dla poszczególnych agentów, skonfiguruj `agents.defaults.skills` i `agents.list[].skills` w `openclaw.json`. Zobacz [Konfiguracja Skills](/pl/tools/skills-config) oraz [Dokumentacja konfiguracji](/pl/gateway/config-agents#agents-defaults-skills).

Wyświetl powiązania:

```bash
openclaw agents bindings
openclaw agents bindings --agent work
openclaw agents bindings --json
```

Dodaj powiązania:

```bash
openclaw agents bind --agent work --bind telegram:ops --bind discord:guild-a
```

Jeśli pominiesz `accountId` (`--bind <channel>`), OpenClaw rozwiąże go z domyślnych ustawień kanału i haków konfiguracji Plugin, gdy są dostępne.

Jeśli pominiesz `--agent` dla `bind` lub `unbind`, OpenClaw wybierze bieżącego agenta domyślnego.

### Zachowanie zakresu powiązania

- Powiązanie bez `accountId` pasuje tylko do domyślnego konta kanału.
- `accountId: "*"` to awaryjne ustawienie dla całego kanału (wszystkie konta) i jest mniej szczegółowe niż jawne powiązanie konta.
- Jeśli ten sam agent ma już pasujące powiązanie kanału bez `accountId`, a później dodasz powiązanie z jawnym lub rozpoznanym `accountId`, OpenClaw zaktualizuje to istniejące powiązanie w miejscu zamiast dodawać duplikat.

Przykład:

```bash
# initial channel-only binding
openclaw agents bind --agent work --bind telegram

# later upgrade to account-scoped binding
openclaw agents bind --agent work --bind telegram:ops
```

Po aktualizacji trasowanie dla tego powiązania jest ograniczone do `telegram:ops`. Jeśli chcesz także trasować do domyślnego konta, dodaj je jawnie (na przykład `--bind telegram:default`).

Usuń powiązania:

```bash
openclaw agents unbind --agent work --bind telegram:ops
openclaw agents unbind --agent work --all
```

`unbind` akceptuje albo `--all`, albo jedną lub więcej wartości `--bind`, ale nie oba naraz.

## Zakres poleceń

### `agents`

Uruchomienie `openclaw agents` bez podpolecenia jest równoważne z `openclaw agents list`.

### `agents list`

Opcje:

- `--json`
- `--bindings`: uwzględnij pełne reguły trasowania, nie tylko liczniki/podsumowania per agent

### `agents add [name]`

Opcje:

- `--workspace <dir>`
- `--model <id>`
- `--agent-dir <dir>`
- `--bind <channel[:accountId]>` (powtarzalne)
- `--non-interactive`
- `--json`

Uwagi:

- Przekazanie dowolnych jawnych flag dodawania przełącza polecenie na ścieżkę nieinteraktywną.
- Tryb nieinteraktywny wymaga zarówno nazwy agenta, jak i `--workspace`.
- `main` jest zarezerwowane i nie może zostać użyte jako identyfikator nowego agenta.
- W trybie interaktywnym inicjowanie uwierzytelniania kopiuje tylko przenośne profile statyczne
  (`api_key` i statyczny `token` domyślnie). Profile tokenów odświeżania OAuth pozostają
  dostępne tylko przez dziedziczenie odczytu z rzeczywistego magazynu agenta `main`.
  Jeśli skonfigurowany agent domyślny nie jest `main`, zaloguj się osobno dla profili OAuth
  w nowym agencie.

### `agents bindings`

Opcje:

- `--agent <id>`
- `--json`

### `agents bind`

Opcje:

- `--agent <id>` (domyślnie bieżący agent domyślny)
- `--bind <channel[:accountId]>` (powtarzalne)
- `--json`

### `agents unbind`

Opcje:

- `--agent <id>` (domyślnie bieżący agent domyślny)
- `--bind <channel[:accountId]>` (powtarzalne)
- `--all`
- `--json`

### `agents delete <id>`

Opcje:

- `--force`
- `--json`

Uwagi:

- `main` nie może zostać usunięte.
- Bez `--force` wymagane jest interaktywne potwierdzenie.
- Obszar roboczy, stan agenta i katalogi transkrypcji sesji są przenoszone do Kosza, a nie trwale usuwane.
- Jeśli obszar roboczy innego agenta ma tę samą ścieżkę, znajduje się wewnątrz tego obszaru roboczego albo zawiera ten obszar roboczy,
  obszar roboczy zostaje zachowany, a `--json` raportuje `workspaceRetained`,
  `workspaceRetainedReason` i `workspaceSharedWith`.

## Pliki tożsamości

Każdy obszar roboczy agenta może zawierać `IDENTITY.md` w katalogu głównym obszaru roboczego:

- Przykładowa ścieżka: `~/.openclaw/workspace/IDENTITY.md`
- `set-identity --from-identity` odczytuje z katalogu głównego obszaru roboczego (lub jawnego `--identity-file`)

Ścieżki awatarów są rozwiązywane względem katalogu głównego obszaru roboczego.

## Ustawianie tożsamości

`set-identity` zapisuje pola w `agents.list[].identity`:

- `name`
- `theme`
- `emoji`
- `avatar` (ścieżka względna wobec obszaru roboczego, URL http(s) albo data URI)

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

- `--agent` albo `--workspace` można użyć do wybrania agenta docelowego.
- Jeśli polegasz na `--workspace`, a wielu agentów współdzieli ten obszar roboczy, polecenie kończy się niepowodzeniem i prosi o przekazanie `--agent`.
- Gdy nie podano jawnych pól tożsamości, polecenie odczytuje dane tożsamości z `IDENTITY.md`.

Wczytaj z `IDENTITY.md`:

```bash
openclaw agents set-identity --workspace ~/.openclaw/workspace --from-identity
```

Jawnie nadpisz pola:

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

- [Dokumentacja CLI](/pl/cli)
- [Trasowanie wieloagentowe](/pl/concepts/multi-agent)
- [Obszar roboczy agenta](/pl/concepts/agent-workspace)
