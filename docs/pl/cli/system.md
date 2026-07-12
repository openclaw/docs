---
read_when:
    - Chcesz dodać zdarzenie systemowe do kolejki bez tworzenia zadania Cron
    - Musisz włączyć lub wyłączyć Heartbeat’y
    - Chcesz sprawdzić wpisy obecności systemowej
summary: Dokumentacja CLI dla `openclaw system` (zdarzenia systemowe, Heartbeat, obecność)
title: System
x-i18n:
    generated_at: "2026-07-12T14:56:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: aaca206d8b463fd33f9e3cb21382bbf36469e9daa2706d8a9e2c7fab14b76e7a
    source_path: cli/system.md
    workflow: 16
---

# `openclaw system`

Pomocnicze funkcje systemowe dla Gateway: kolejkowanie zdarzeń systemowych, sterowanie
sygnałami Heartbeat i wyświetlanie informacji o obecności.

Wszystkie podpolecenia `system` używają RPC Gateway i przyjmują wspólne flagi klienta:

| Flaga             | Wartość domyślna                     | Opis                                                                                                                                                                                                   |
| ----------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `--url <url>`     | `gateway.remote.url`, jeśli ustawiono | Adres URL WebSocket Gateway.                                                                                                                                                                           |
| `--token <token>` | brak                                 | Token Gateway (jeśli jest wymagany).                                                                                                                                                                   |
| `--timeout <ms>`  | `30000`                              | Limit czasu RPC w milisekundach.                                                                                                                                                                       |
| `--expect-final`  | wyłączone                            | Oczekuj na odpowiedź końcową (agenta).                                                                                                                                                                 |
| `--json`          | wyłączone                            | Wyświetl dane JSON. Polecenia `heartbeat last/enable/disable` i `system presence` zawsze wyświetlają nieprzetworzony ładunek JSON RPC niezależnie od tej flagi; `system event` używa jej do przełączania między formatem JSON a zwykłym wierszem `ok`. |

## Typowe polecenia

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
openclaw system event --text "Check for urgent follow-ups" --url ws://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
openclaw system heartbeat enable
openclaw system heartbeat last
openclaw system presence
```

## `system event`

Domyślnie kolejkuje zdarzenie systemowe w sesji **głównej**. Następny
Heartbeat wstawia je do monitu jako wiersz `System:`. Użyj `--mode now`, aby
natychmiast wyzwolić Heartbeat; `next-heartbeat` (wartość domyślna) oczekuje na
następne zaplanowane wywołanie.

Przekaż `--session-key`, aby wskazać konkretną sesję, na przykład w celu przekazania
informacji o zakończeniu zadania asynchronicznego z powrotem do kanału, który je uruchomił.

<Note>
**Wyjątek dotyczący czasu wykonania z `--session-key`:** gdy podano `--session-key`,
`--mode next-heartbeat` powoduje natychmiastowe ukierunkowane wybudzenie zamiast
oczekiwania na następne zaplanowane wywołanie. Ukierunkowane wybudzenia używają intencji Heartbeat
`immediate`, dzięki czemu pomijają mechanizm wykonawcy blokujący przedwczesne uruchomienie, który w przeciwnym razie
odroczyłby (i w praktyce porzucił) wybudzenie z intencją `event`. Jeśli chcesz opóźnić
dostarczenie, pomiń `--session-key`, aby zdarzenie trafiło do sesji głównej i zostało
dostarczone przy następnym regularnym sygnale Heartbeat.
</Note>

Flagi:

- `--text <text>`: wymagany tekst zdarzenia systemowego.
- `--mode <mode>`: `now` lub `next-heartbeat` (wartość domyślna).
- `--session-key <sessionKey>`: opcjonalne; wskazuje konkretną sesję agenta
  zamiast jego sesji głównej. Klucze, które nie należą do
  rozpoznanego agenta, powodują użycie jego sesji głównej.

## `system heartbeat last|enable|disable`

- `last`: wyświetla ostatnie zdarzenie Heartbeat.
- `enable`: ponownie włącza sygnały Heartbeat (użyj tej opcji, jeśli zostały wyłączone).
- `disable`: wstrzymuje sygnały Heartbeat.

## `system presence`

Wyświetla bieżące wpisy obecności systemowej znane Gateway (węzły,
instancje i podobne wiersze stanu).

## Uwagi

- Wymaga działającego Gateway dostępnego przy użyciu bieżącej konfiguracji (lokalnie lub
  zdalnie).
- Zdarzenia systemowe są tymczasowe i nie są zachowywane po ponownym uruchomieniu.

## Powiązane materiały

- [Dokumentacja CLI](/pl/cli)
