---
read_when:
    - Vuoi mettere in coda un evento di sistema senza creare un processo Cron
    - Devi abilitare o disabilitare gli Heartbeat
    - Vuoi ispezionare le voci di presenza del sistema
summary: Riferimento CLI per `openclaw system` (eventi di sistema, Heartbeat, presenza)
title: Sistema
x-i18n:
    generated_at: "2026-04-24T08:35:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0f4be30b0b2d18ee5653071d6375cebeb9fc94733e30bdb7b89a19c286df880b
    source_path: cli/system.md
    workflow: 15
---

# `openclaw system`

Helper a livello di sistema per il Gateway: mette in coda eventi di sistema, controlla gli Heartbeat
e mostra la presenza.

Tutti i sottocomandi `system` usano Gateway RPC e accettano i flag client condivisi:

- `--url <url>`
- `--token <token>`
- `--timeout <ms>`
- `--expect-final`

## Comandi comuni

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
openclaw system event --text "Check for urgent follow-ups" --url ws://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
openclaw system heartbeat enable
openclaw system heartbeat last
openclaw system presence
```

## `system event`

Mette in coda un evento di sistema nella sessione **principale**. L'Heartbeat successivo lo inserirà
nel prompt come riga `System:`. Usa `--mode now` per attivare immediatamente l'Heartbeat;
`next-heartbeat` attende il successivo tick pianificato.

Flag:

- `--text <text>`: testo obbligatorio dell'evento di sistema.
- `--mode <mode>`: `now` oppure `next-heartbeat` (predefinito).
- `--json`: output leggibile dalla macchina.
- `--url`, `--token`, `--timeout`, `--expect-final`: flag Gateway RPC condivisi.

## `system heartbeat last|enable|disable`

Controlli Heartbeat:

- `last`: mostra l'ultimo evento Heartbeat.
- `enable`: riattiva gli Heartbeat (usalo se sono stati disabilitati).
- `disable`: mette in pausa gli Heartbeat.

Flag:

- `--json`: output leggibile dalla macchina.
- `--url`, `--token`, `--timeout`, `--expect-final`: flag Gateway RPC condivisi.

## `system presence`

Elenca le voci di presenza di sistema correnti note al Gateway (Node,
istanze e righe di stato simili).

Flag:

- `--json`: output leggibile dalla macchina.
- `--url`, `--token`, `--timeout`, `--expect-final`: flag Gateway RPC condivisi.

## Note

- Richiede un Gateway in esecuzione raggiungibile dalla configurazione corrente (locale o remota).
- Gli eventi di sistema sono effimeri e non vengono mantenuti tra i riavvii.

## Correlati

- [Riferimento CLI](/it/cli)
