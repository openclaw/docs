---
read_when:
    - Potrzebujesz wielu odizolowanych agentów (obszary robocze + routing + uwierzytelnianie)
summary: Dokumentacja CLI dla `openclaw agents` (wyświetlanie/dodawanie/usuwanie/powiązania/powiązywanie/odwiązywanie/ustawianie tożsamości)
title: Agenci
x-i18n:
    generated_at: "2026-07-12T14:57:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 89b6c59a9ce0fd0514343cc3fa66ae5e6d963cdfa5c6f58ffe6b9a6b5e943f09
    source_path: cli/agents.md
    workflow: 16
---

# `openclaw agents`

Zarządzaj odizolowanymi agentami (obszarami roboczymi, uwierzytelnianiem i trasowaniem). Uruchomienie `openclaw agents` bez podkomendy jest równoważne poleceniu `openclaw agents list`.

Powiązane:

- [Trasowanie wieloagentowe](/pl/concepts/multi-agent)
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

## Zakres poleceń

### `agents list`

Opcje: `--json`, `--bindings` (uwzględnia pełne reguły trasowania, a nie tylko liczniki lub podsumowania dla poszczególnych agentów).

### `agents add [name]`

Opcje: `--workspace <dir>`, `--model <id>`, `--agent-dir <dir>`, `--bind <channel[:accountId]>` (można podać wielokrotnie), `--non-interactive`, `--json`.

- Podanie dowolnej jawnej flagi dodawania przełącza polecenie na tryb nieinteraktywny.
- Tryb nieinteraktywny wymaga zarówno nazwy agenta, jak i opcji `--workspace`.
- Identyfikator `main` jest zarezerwowany i nie może zostać użyty jako identyfikator nowego agenta.
- Tryb interaktywny inicjuje uwierzytelnianie, kopiując wyłącznie przenośne, statyczne poświadczenia (profile `api_key` i statycznego `token`), chyba że poświadczenie wyłącza kopiowanie za pomocą `copyToAgents: false`. Profile tokenów odświeżania OAuth nie są kopiowane, chyba że dostawca włączy kopiowanie za pomocą `copyToAgents: true`. Bez kopii OAuth pozostaje dostępne wyłącznie przez dziedziczenie z odczytem z rzeczywistego magazynu agenta `main`. Jeśli skonfigurowanym agentem domyślnym nie jest `main`, zaloguj się osobno do profili OAuth na nowym agencie.

### `agents bindings`

Opcje: `--agent <id>`, `--json`.

### `agents bind`

Opcje: `--agent <id>` (domyślnie bieżący agent domyślny), `--bind <channel[:accountId]>` (można podać wielokrotnie), `--json`.

### `agents unbind`

Opcje: `--agent <id>` (domyślnie bieżący agent domyślny), `--bind <channel[:accountId]>` (można podać wielokrotnie), `--all`, `--json`. Przyjmuje albo `--all`, albo co najmniej jedną wartość `--bind`, ale nie oba warianty jednocześnie.

### `agents set-identity`

Opcje: `--agent <id>`, `--workspace <dir>`, `--identity-file <path>`, `--from-identity`, `--name <name>`, `--theme <theme>`, `--emoji <emoji>`, `--avatar <value>`, `--json`. Zobacz sekcję [Ustawianie tożsamości](#set-identity) poniżej.

### `agents delete <id>`

Opcje: `--force`, `--json`.

- Agenta `main` nie można usunąć.
- Bez opcji `--force` wymagane jest interaktywne potwierdzenie (polecenie zakończy się niepowodzeniem w sesji bez TTY; uruchom je ponownie z opcją `--force`).
- Obszar roboczy, stan agenta oraz katalogi transkrypcji sesji są przenoszone do Kosza, a nie trwale usuwane.
- Gdy Gateway jest osiągalny, usuwanie odbywa się za jego pośrednictwem, dzięki czemu czyszczenie konfiguracji i magazynu sesji korzysta z tego samego mechanizmu zapisu co ruch środowiska uruchomieniowego. Jeśli Gateway jest nieosiągalny, CLI przechodzi na lokalną ścieżkę offline.
- Jeśli obszar roboczy innego agenta wskazuje tę samą ścieżkę, znajduje się wewnątrz tego obszaru roboczego lub go zawiera, obszar roboczy zostaje zachowany, a `--json` zwraca pola `workspaceRetained`, `workspaceRetainedReason` i `workspaceSharedWith`.

## Powiązania trasowania

Użyj powiązań trasowania, aby przypisać ruch przychodzący z kanału do konkretnego agenta.

Jeśli chcesz również ustawić różne widoczne Skills dla poszczególnych agentów, skonfiguruj `agents.defaults.skills` i `agents.list[].skills` w pliku `openclaw.json`. Zobacz [Konfiguracja Skills](/pl/tools/skills-config) i [Dokumentacja konfiguracji](/pl/gateway/config-agents#agentsdefaultsskills).

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

Powiązania można również dodać podczas tworzenia agenta:

```bash
openclaw agents add work --workspace ~/.openclaw/workspace-work --bind telegram:* --bind discord:*
```

Jeśli pominiesz `accountId` (`--bind <channel>`), OpenClaw ustali je na podstawie haków konfiguracji Pluginu, wymuszonego powiązania konta lub liczby kont skonfigurowanych dla kanału.

Jeśli pominiesz `--agent` dla polecenia `bind` lub `unbind`, OpenClaw wybierze bieżącego agenta domyślnego.

### Format `--bind`

| Format                       | Znaczenie                                                                                                        |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `--bind <channel>:*`         | Dopasowuje wszystkie konta w kanale.                                                                             |
| `--bind <channel>:<account>` | Dopasowuje jedno konto.                                                                                          |
| `--bind <channel>`           | Dopasowuje tylko konto domyślne, chyba że CLI może bezpiecznie ustalić zakres konta specyficzny dla Pluginu.      |

### Zachowanie zakresu powiązań

- Zapisane powiązanie bez `accountId` dopasowuje tylko domyślne konto kanału.
- `accountId: "*"` jest rezerwowym dopasowaniem dla całego kanału (wszystkich kont) i jest mniej szczegółowe niż jawne powiązanie konta.
- Jeśli ten sam agent ma już pasujące powiązanie kanału bez `accountId`, a następnie dodasz powiązanie z jawnym lub ustalonym `accountId`, OpenClaw zaktualizuje istniejące powiązanie w miejscu, zamiast dodawać duplikat.

Przykłady:

```bash
# dopasuj wszystkie konta w kanale
openclaw agents bind --agent work --bind telegram:*

# dopasuj określone konto
openclaw agents bind --agent work --bind telegram:ops

# początkowe powiązanie obejmujące tylko kanał
openclaw agents bind --agent work --bind telegram

# późniejsze rozszerzenie do powiązania o zakresie konta
openclaw agents bind --agent work --bind telegram:alerts
```

Po aktualizacji trasowanie dla tego powiązania jest ograniczone do `telegram:alerts`. Jeśli chcesz również trasować ruch dla konta domyślnego, dodaj je jawnie (na przykład `--bind telegram:default`).

Usuwanie powiązań:

```bash
openclaw agents unbind --agent work --bind telegram:ops
openclaw agents unbind --agent work --all
```

## Pliki tożsamości

Każdy obszar roboczy agenta może zawierać plik `IDENTITY.md` w swoim katalogu głównym:

- Przykładowa ścieżka: `~/.openclaw/workspace/IDENTITY.md`
- `set-identity --from-identity` odczytuje dane z katalogu głównego obszaru roboczego (lub z pliku podanego jawnie za pomocą `--identity-file`).

Ścieżki awatarów są rozwiązywane względem katalogu głównego obszaru roboczego i nie mogą wskazywać poza niego, nawet za pośrednictwem dowiązania symbolicznego.

## Ustawianie tożsamości

Polecenie `set-identity` zapisuje pola w `agents.list[].identity`: `name`, `theme`, `emoji`, `avatar` (ścieżka względna wobec obszaru roboczego, adres URL HTTP(S) lub identyfikator URI danych).

- `--agent` lub `--workspace` wybiera agenta docelowego. Jeśli `--workspace` pasuje do więcej niż jednego agenta, polecenie kończy się niepowodzeniem i prosi o podanie `--agent`.
- Lokalne pliki obrazów awatarów ze ścieżkami względnymi wobec obszaru roboczego mogą mieć maksymalnie 2 MB. Adresy URL HTTP(S) i identyfikatory URI `data:` nie podlegają lokalnemu limitowi rozmiaru pliku.
- Jeśli nie podano jawnie żadnych pól tożsamości, polecenie odczytuje dane tożsamości z pliku `IDENTITY.md`.

Wczytywanie z pliku `IDENTITY.md`:

```bash
openclaw agents set-identity --workspace ~/.openclaw/workspace --from-identity
```

Jawne zastępowanie pól:

```bash
openclaw agents set-identity --agent main --name "OpenClaw" --emoji "🦞" --avatar avatars/openclaw.png
```

Przykładowa konfiguracja:

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
