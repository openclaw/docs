---
read_when:
    - Chcesz dodać zdarzenie systemowe do kolejki bez tworzenia zadania Cron
    - Musisz włączyć lub wyłączyć sygnały Heartbeat
    - Chcesz sprawdzić wpisy obecności systemu
summary: Dokumentacja referencyjna CLI dla `openclaw system` (zdarzenia systemowe, Heartbeat, obecność)
title: System
x-i18n:
    generated_at: "2026-05-11T20:27:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2810fb064ea4afeac24ca0d71419913a664bbec0721cabdb09196075914f4864
    source_path: cli/system.md
    workflow: 16
---

# `openclaw system`

Pomocnicze narzędzia na poziomie systemu dla Gateway: kolejkowanie zdarzeń systemowych, sterowanie mechanizmem Heartbeat
i wyświetlanie obecności.

Wszystkie podpolecenia `system` używają Gateway RPC i akceptują wspólne flagi klienta:

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

Domyślnie dodaje zdarzenie systemowe do kolejki w sesji **main**. Następny Heartbeat
wstrzyknie je do promptu jako wiersz `System:`. Użyj `--mode now`, aby uruchomić
Heartbeat natychmiast; `next-heartbeat` czeka na następny zaplanowany takt.

Przekaż `--session-key`, aby wskazać konkretną sesję (na przykład w celu przekazania
zakończenia zadania asynchronicznego z powrotem do kanału, który je uruchomił).

> **Wyjątek czasowy z `--session-key`:** gdy podano `--session-key`,
> `--mode next-heartbeat` jest sprowadzane do natychmiastowego, ukierunkowanego wybudzenia zamiast
> czekania na następny zaplanowany takt. Ukierunkowane wybudzenia używają intencji Heartbeat
> `immediate`, więc omijają bramkę „not-due” runnera, która w przeciwnym razie
> odroczyłaby (i w praktyce porzuciła) wybudzenie z intencją `event`. Jeśli chcesz opóźnionego
> dostarczenia, pomiń `--session-key`, aby zdarzenie trafiło do sesji main i
> zostało obsłużone przy następnym regularnym Heartbeat.

Flagi:

- `--text <text>`: wymagany tekst zdarzenia systemowego.
- `--mode <mode>`: `now` albo `next-heartbeat` (domyślnie).
- `--session-key <sessionKey>`: opcjonalne; wskazuje konkretną sesję agenta
  zamiast głównej sesji agenta. Klucze, które nie należą do
  rozwiązanego agenta, wracają do głównej sesji agenta.
- `--json`: wyjście czytelne maszynowo.
- `--url`, `--token`, `--timeout`, `--expect-final`: współdzielone flagi Gateway RPC.

## `system heartbeat last|enable|disable`

Elementy sterujące Heartbeat:

- `last`: pokaż ostatnie zdarzenie Heartbeat.
- `enable`: ponownie włącz Heartbeat (użyj tego, jeśli były wyłączone).
- `disable`: wstrzymaj Heartbeat.

Flagi:

- `--json`: wyjście czytelne maszynowo.
- `--url`, `--token`, `--timeout`, `--expect-final`: współdzielone flagi Gateway RPC.

## `system presence`

Wyświetla bieżące wpisy obecności systemu znane Gateway (węzły,
instancje i podobne wiersze statusu).

Flagi:

- `--json`: wyjście czytelne maszynowo.
- `--url`, `--token`, `--timeout`, `--expect-final`: współdzielone flagi Gateway RPC.

## Uwagi

- Wymaga działającego Gateway osiągalnego przez bieżącą konfigurację (lokalną lub zdalną).
- Zdarzenia systemowe są efemeryczne i nie są zachowywane między ponownymi uruchomieniami.

## Powiązane

- [Dokumentacja CLI](/pl/cli)
