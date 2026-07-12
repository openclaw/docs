---
read_when:
    - W starszej dokumentacji lub informacjach o wydaniu możesz napotkać `openclaw flows`
    - Potrzebujesz krótkiego przewodnika po inspekcji TaskFlow
summary: 'Przekierowanie: polecenia przepływu znajdują się w `openclaw tasks flow`'
title: Przepływy (przekierowanie)
x-i18n:
    generated_at: "2026-07-12T14:54:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 05d27154190d6087649612d81ce15f0cbc9459aa89ab22211582c18f4fc2943c
    source_path: cli/flows.md
    workflow: 16
---

# `openclaw tasks flow`

Nie istnieje polecenie najwyższego poziomu `openclaw flows`. Trwałe sprawdzanie TaskFlow jest dostępne w ramach `openclaw tasks flow`.

## Podpolecenia

```bash
openclaw tasks flow list   [--json] [--status <name>]
openclaw tasks flow show   <lookup> [--json]
openclaw tasks flow cancel <lookup>
```

| Podpolecenie | Opis                         | Argumenty / opcje                                                                                 |
| ------------ | ---------------------------- | ------------------------------------------------------------------------------------------------- |
| `list`       | Wyświetla śledzone TaskFlow. | Wynik w formacie maszynowym `--json`; filtr `--status <name>` (zobacz wartości stanu poniżej).     |
| `show`       | Wyświetla jeden TaskFlow.    | Identyfikator przepływu lub klucz właściciela `<lookup>`; wynik w formacie maszynowym `--json`.    |
| `cancel`     | Anuluje działający TaskFlow. | Identyfikator przepływu lub klucz właściciela `<lookup>`.                                         |

`<lookup>` przyjmuje identyfikator przepływu (zwracany przez `list` / `show`) albo klucz właściciela przepływu (stabilny identyfikator używany przez podsystem będący właścicielem do śledzenia przepływu).

### Wartości filtra stanu

Opcja `--status` polecenia `list` przyjmuje jedną z wartości: `queued`, `running`, `waiting`, `blocked`, `succeeded`, `failed`, `cancelled`, `lost`.

## Przykłady

```bash
openclaw tasks flow list
openclaw tasks flow list --status running
openclaw tasks flow list --json
openclaw tasks flow show flow_abc123
openclaw tasks flow show flow_abc123 --json
openclaw tasks flow cancel flow_abc123
```

Informacje o koncepcjach TaskFlow i ich tworzeniu znajdziesz w sekcji [TaskFlow](/pl/automation/taskflow). Informacje o nadrzędnym poleceniu `tasks` znajdziesz w [dokumentacji polecenia `tasks` w CLI](/pl/cli/tasks).

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Automatyzacja](/pl/automation)
- [TaskFlow](/pl/automation/taskflow)
