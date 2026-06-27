---
read_when:
    - Chcesz mieć wielu izolowanych agentów (przestrzenie robocze + routowanie + uwierzytelnianie)
summary: Dokumentacja CLI dla `openclaw agents` (list/add/delete/bindings/bind/unbind/set identity)
title: Agenci
x-i18n:
    generated_at: "2026-06-27T17:18:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7905bc2465c48b5bfee4ce90fdf96dcd92b304a9fb29de93f8f49afdff0e6672
    source_path: cli/agents.md
    workflow: 16
---

# `openclaw agents`

Zarządzaj odizolowanymi agentami (obszary robocze + uwierzytelnianie + routing).

Powiązane:

- [Routing wielu agentów](/pl/concepts/multi-agent)
- [Obszar roboczy agenta](/pl/concepts/agent-workspace)
- [Konfiguracja Skills](/pl/tools/skills-config): konfiguracja widoczności Skills.

## Przykłady

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

## Powiązania routingu

Użyj powiązań routingu, aby przypiąć przychodzący ruch kanału do konkretnego agenta.

Jeśli chcesz także mieć różne widoczne Skills dla poszczególnych agentów, skonfiguruj `agents.defaults.skills` i `agents.list[].skills` w `openclaw.json`. Zobacz [Konfiguracja Skills](/pl/tools/skills-config) i [Referencja konfiguracji](/pl/gateway/config-agents#agents-defaults-skills).

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

Możesz także dodać powiązania podczas tworzenia agenta:

```bash
openclaw agents add work --workspace ~/.openclaw/workspace-work --bind telegram:* --bind discord:*
```

Jeśli pominiesz `accountId` (`--bind <channel>`), OpenClaw ustali je na podstawie hooków konfiguracji Plugin, wymuszonego powiązania konta albo skonfigurowanej liczby kont kanału.

Jeśli pominiesz `--agent` dla `bind` lub `unbind`, OpenClaw użyje bieżącego agenta domyślnego.

### Format `--bind`

| Format                       | Znaczenie                                                                                         |
| ---------------------------- | ------------------------------------------------------------------------------------------------- |
| `--bind <channel>:*`         | Dopasowuje wszystkie konta w kanale.                                                              |
| `--bind <channel>:<account>` | Dopasowuje jedno konto.                                                                           |
| `--bind <channel>`           | Dopasowuje tylko konto domyślne, chyba że CLI może bezpiecznie ustalić zakres konta specyficzny dla Plugin. |

### Zachowanie zakresu powiązania

- Zapisane powiązanie bez `accountId` dopasowuje tylko konto domyślne kanału.
- `accountId: "*"` to zapasowe ustawienie dla całego kanału (wszystkie konta) i jest mniej szczegółowe niż jawne powiązanie konta.
- Jeśli ten sam agent ma już pasujące powiązanie kanału bez `accountId`, a później utworzysz powiązanie z jawnym lub ustalonym `accountId`, OpenClaw uaktualni istniejące powiązanie w miejscu zamiast dodawać duplikat.

Przykłady:

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

Po uaktualnieniu routing dla tego powiązania jest ograniczony do `telegram:alerts`. Jeśli chcesz także routing dla konta domyślnego, dodaj go jawnie (na przykład `--bind telegram:default`).

Usuń powiązania:

```bash
openclaw agents unbind --agent work --bind telegram:ops
openclaw agents unbind --agent work --all
```

`unbind` akceptuje albo `--all`, albo co najmniej jedną wartość `--bind`, ale nie oba naraz.

## Zakres poleceń

### `agents`

Uruchomienie `openclaw agents` bez podpolecenia jest równoważne z `openclaw agents list`.

### `agents list`

Opcje:

- `--json`
- `--bindings`: uwzględnia pełne reguły routingu, a nie tylko liczniki/podsumowania dla poszczególnych agentów

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
  (domyślnie `api_key` i statyczny `token`). Profile OAuth z tokenem odświeżania pozostają
  dostępne tylko przez dziedziczenie z odczytem z rzeczywistego magazynu agenta `main`.
  Jeśli skonfigurowany agent domyślny nie jest `main`, zaloguj się osobno dla profili OAuth
  na nowym agencie.

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
- Katalogi obszaru roboczego, stanu agenta i transkryptów sesji są przenoszone do Kosza, a nie trwale usuwane.
- Gdy Gateway jest osiągalny, usunięcie jest wysyłane przez Gateway, dzięki czemu czyszczenie konfiguracji i magazynu sesji używa tego samego zapisującego co ruch w czasie działania. Jeśli Gateway jest nieosiągalny, CLI wraca do lokalnej ścieżki offline.
- Jeśli obszar roboczy innego agenta ma tę samą ścieżkę, znajduje się wewnątrz tego obszaru roboczego albo zawiera ten obszar roboczy,
  obszar roboczy zostaje zachowany, a `--json` zgłasza `workspaceRetained`,
  `workspaceRetainedReason` i `workspaceSharedWith`.

## Pliki tożsamości

Każdy obszar roboczy agenta może zawierać plik `IDENTITY.md` w katalogu głównym obszaru roboczego:

- Przykładowa ścieżka: `~/.openclaw/workspace/IDENTITY.md`
- `set-identity --from-identity` odczytuje z katalogu głównego obszaru roboczego (albo z jawnego `--identity-file`)

Ścieżki awatarów są rozwiązywane względem katalogu głównego obszaru roboczego.

## Ustawianie tożsamości

`set-identity` zapisuje pola w `agents.list[].identity`:

- `name`
- `theme`
- `emoji`
- `avatar` (ścieżka względna względem obszaru roboczego, adres URL http(s) albo data URI)

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

- Do wybrania agenta docelowego można użyć `--agent` albo `--workspace`.
- Jeśli polegasz na `--workspace`, a wiele agentów współdzieli ten obszar roboczy, polecenie kończy się niepowodzeniem i prosi o przekazanie `--agent`.
- Lokalne pliki obrazów awatarów ze ścieżkami względnymi względem obszaru roboczego są ograniczone do 2 MB. Adresy URL HTTP(S) i URI `data:` nie są sprawdzane pod kątem lokalnego limitu rozmiaru pliku.
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

- [Referencja CLI](/pl/cli)
- [Routing wielu agentów](/pl/concepts/multi-agent)
- [Obszar roboczy agenta](/pl/concepts/agent-workspace)
