---
read_when:
    - Napotykasz `openclaw flows` w starszej dokumentacji lub informacjach o wydaniu
    - Potrzebujesz szybkiego odniesienia do inspekcji TaskFlow
summary: 'Przekierowanie: polecenia przepływu znajdują się pod `openclaw tasks flow`'
title: Przepływy (przekierowanie)
x-i18n:
    generated_at: "2026-05-10T19:28:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: b41e8a911cfbba32f3a1af059df34f73443ea7649bce46a5926cdf26c8399c12
    source_path: cli/flows.md
    workflow: 16
---

# `openclaw tasks flow`

Nie ma polecenia najwyższego poziomu `openclaw flows`. Inspekcja trwałych TaskFlow jest dostępna w `openclaw tasks flow`.

## Podpolecenia

```bash
openclaw tasks flow list   [--json] [--status <name>]
openclaw tasks flow show   <lookup> [--json]
openclaw tasks flow cancel <lookup>
```

| Podpolecenie | Opis                         | Argumenty / opcje                                                                    |
| ------------ | ---------------------------- | ------------------------------------------------------------------------------------ |
| `list`       | Wyświetl śledzone TaskFlow.  | Wyjście czytelne maszynowo `--json`; filtr `--status <name>` (zobacz wartości stanu poniżej). |
| `show`       | Pokaż jeden TaskFlow.        | Identyfikator flow `<lookup>` lub klucz właściciela; wyjście czytelne maszynowo `--json`. |
| `cancel`     | Anuluj uruchomiony TaskFlow. | Identyfikator flow `<lookup>` lub klucz właściciela.                                 |

`<lookup>` przyjmuje identyfikator flow (zwracany przez `list` / `show`) albo klucz właściciela flow (stabilny identyfikator używany przez podsystem właścicielski do śledzenia flow).

### Wartości filtra stanu

`--status` w `list` przyjmuje jedną z wartości:

`queued`, `running`, `waiting`, `blocked`, `succeeded`, `failed`, `cancelled`, `lost`

## Przykłady

```bash
openclaw tasks flow list
openclaw tasks flow list --status running
openclaw tasks flow list --json
openclaw tasks flow show flow_abc123
openclaw tasks flow show flow_abc123 --json
openclaw tasks flow cancel flow_abc123
```

Pełne omówienie pojęć TaskFlow i tworzenia znajdziesz w [TaskFlow](/pl/automation/taskflow). Polecenie nadrzędne `tasks` opisano w [dokumentacji CLI tasks](/pl/cli/tasks).

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Automatyzacja](/pl/automation)
- [TaskFlow](/pl/automation/taskflow)
