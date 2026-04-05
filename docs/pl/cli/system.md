---
read_when:
    - Chcesz umieścić zdarzenie systemowe w kolejce bez tworzenia zadania cron
    - Musisz włączyć lub wyłączyć heartbeat
    - Chcesz sprawdzić wpisy system presence
summary: Dokumentacja CLI dla `openclaw system` (zdarzenia systemowe, heartbeat, presence)
title: system
x-i18n:
    generated_at: "2026-04-05T13:49:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: a7d19afde9d9cde8a79b0bb8cec6e5673466f4cb9b575fb40111fc32f4eee5d7
    source_path: cli/system.md
    workflow: 15
---

# `openclaw system`

Pomocniki na poziomie systemu dla Gateway: umieszczanie zdarzeń systemowych w kolejce, sterowanie heartbeat
i podgląd presence.

Wszystkie podpolecenia `system` używają Gateway RPC i akceptują współdzielone flagi klienta:

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

Umieszcza zdarzenie systemowe w kolejce w sesji **main**. Następny heartbeat wstrzyknie
je jako linię `System:` do promptu. Użyj `--mode now`, aby wywołać heartbeat
natychmiast; `next-heartbeat` czeka na następny zaplanowany tick.

Flagi:

- `--text <text>`: wymagany tekst zdarzenia systemowego.
- `--mode <mode>`: `now` lub `next-heartbeat` (domyślnie).
- `--json`: wyjście czytelne maszynowo.
- `--url`, `--token`, `--timeout`, `--expect-final`: współdzielone flagi Gateway RPC.

## `system heartbeat last|enable|disable`

Sterowanie heartbeat:

- `last`: pokazuje ostatnie zdarzenie heartbeat.
- `enable`: ponownie włącza heartbeat (użyj tego, jeśli zostały wyłączone).
- `disable`: wstrzymuje heartbeat.

Flagi:

- `--json`: wyjście czytelne maszynowo.
- `--url`, `--token`, `--timeout`, `--expect-final`: współdzielone flagi Gateway RPC.

## `system presence`

Wyświetla bieżące wpisy system presence znane Gateway (węzły,
instancje i podobne linie statusu).

Flagi:

- `--json`: wyjście czytelne maszynowo.
- `--url`, `--token`, `--timeout`, `--expect-final`: współdzielone flagi Gateway RPC.

## Uwagi

- Wymaga działającego Gateway osiągalnego przez bieżący config (lokalnego lub zdalnego).
- Zdarzenia systemowe są efemeryczne i nie są zachowywane po restartach.
