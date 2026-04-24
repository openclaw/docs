---
read_when:
    - Chcesz dodać zdarzenie systemowe do kolejki bez tworzenia zadania Cron
    - Musisz włączyć lub wyłączyć Heartbeat
    - Chcesz sprawdzić wpisy obecności systemu
summary: Odwołanie CLI dla `openclaw system` (zdarzenia systemowe, Heartbeat, obecność)
title: System
x-i18n:
    generated_at: "2026-04-24T09:04:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0f4be30b0b2d18ee5653071d6375cebeb9fc94733e30bdb7b89a19c286df880b
    source_path: cli/system.md
    workflow: 15
---

# `openclaw system`

Pomocniki na poziomie systemu dla Gateway: dodawanie zdarzeń systemowych do kolejki, sterowanie Heartbeat
oraz wyświetlanie obecności.

Wszystkie podpolecenia `system` używają RPC Gateway i akceptują współdzielone flagi klienta:

- `--url <url>`
- `--token <token>`
- `--timeout <ms>`
- `--expect-final`

## Typowe polecenia

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
openclaw system event --text "Check for urgent follow-ups" --url ws://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
openclaw system heartbeat enable
openclaw system heartbeat last
openclaw system presence
```

## `system event`

Dodaje zdarzenie systemowe do kolejki w sesji **main**. Następny Heartbeat wstrzyknie
je jako wiersz `System:` do promptu. Użyj `--mode now`, aby wyzwolić Heartbeat
natychmiast; `next-heartbeat` czeka na następny zaplanowany tick.

Flagi:

- `--text <text>`: wymagany tekst zdarzenia systemowego.
- `--mode <mode>`: `now` lub `next-heartbeat` (domyślnie).
- `--json`: wyjście czytelne maszynowo.
- `--url`, `--token`, `--timeout`, `--expect-final`: współdzielone flagi RPC Gateway.

## `system heartbeat last|enable|disable`

Sterowanie Heartbeat:

- `last`: pokazuje ostatnie zdarzenie Heartbeat.
- `enable`: ponownie włącza Heartbeat (użyj tego, jeśli zostały wyłączone).
- `disable`: wstrzymuje Heartbeat.

Flagi:

- `--json`: wyjście czytelne maszynowo.
- `--url`, `--token`, `--timeout`, `--expect-final`: współdzielone flagi RPC Gateway.

## `system presence`

Wyświetla bieżące wpisy obecności systemu znane Gateway (Node,
instancje i podobne wiersze stanu).

Flagi:

- `--json`: wyjście czytelne maszynowo.
- `--url`, `--token`, `--timeout`, `--expect-final`: współdzielone flagi RPC Gateway.

## Uwagi

- Wymaga działającego Gateway osiągalnego przez bieżącą konfigurację (lokalną lub zdalną).
- Zdarzenia systemowe są efemeryczne i nie są utrwalane po restartach.

## Powiązane

- [Odwołanie CLI](/pl/cli)
