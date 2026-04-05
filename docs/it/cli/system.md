---
read_when:
    - Vuoi accodare un evento di sistema senza creare un job cron
    - Devi abilitare o disabilitare gli heartbeat
    - Vuoi ispezionare le voci di presenza del sistema
summary: Riferimento CLI per `openclaw system` (eventi di sistema, heartbeat, presenza)
title: system
x-i18n:
    generated_at: "2026-04-05T13:48:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: a7d19afde9d9cde8a79b0bb8cec6e5673466f4cb9b575fb40111fc32f4eee5d7
    source_path: cli/system.md
    workflow: 15
---

# `openclaw system`

Helper a livello di sistema per il Gateway: accodano eventi di sistema, controllano gli heartbeat
e visualizzano la presenza.

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

Accoda un evento di sistema nella sessione **principale**. Il prossimo heartbeat lo inserirà
come riga `System:` nel prompt. Usa `--mode now` per attivare l'heartbeat
immediatamente; `next-heartbeat` attende il prossimo tick pianificato.

Flag:

- `--text <text>`: testo dell'evento di sistema obbligatorio.
- `--mode <mode>`: `now` o `next-heartbeat` (predefinito).
- `--json`: output leggibile da macchina.
- `--url`, `--token`, `--timeout`, `--expect-final`: flag Gateway RPC condivisi.

## `system heartbeat last|enable|disable`

Controlli heartbeat:

- `last`: mostra l'ultimo evento heartbeat.
- `enable`: riattiva gli heartbeat (usalo se erano stati disabilitati).
- `disable`: mette in pausa gli heartbeat.

Flag:

- `--json`: output leggibile da macchina.
- `--url`, `--token`, `--timeout`, `--expect-final`: flag Gateway RPC condivisi.

## `system presence`

Elenca le voci di presenza di sistema correnti note al Gateway (nodi,
istanze e righe di stato simili).

Flag:

- `--json`: output leggibile da macchina.
- `--url`, `--token`, `--timeout`, `--expect-final`: flag Gateway RPC condivisi.

## Note

- Richiede un Gateway in esecuzione raggiungibile dalla tua configurazione attuale (locale o remota).
- Gli eventi di sistema sono effimeri e non vengono mantenuti dopo i riavvii.
