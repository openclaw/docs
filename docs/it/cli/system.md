---
read_when:
    - Vuoi accodare un evento di sistema senza creare un job Cron
    - È necessario abilitare o disabilitare gli Heartbeat
    - Vuoi ispezionare le voci di presenza del sistema
summary: Riferimento CLI per `openclaw system` (eventi di sistema, Heartbeat, presenza)
title: Sistema
x-i18n:
    generated_at: "2026-05-11T20:26:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2810fb064ea4afeac24ca0d71419913a664bbec0721cabdb09196075914f4864
    source_path: cli/system.md
    workflow: 16
    postprocess_version: locale-links-v1
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

Accoda un evento di sistema nella sessione **main** per impostazione predefinita. Il prossimo heartbeat
lo inserirà come riga `System:` nel prompt. Usa `--mode now` per attivare
subito l'heartbeat; `next-heartbeat` attende il prossimo tick pianificato.

Passa `--session-key` per indirizzare una sessione specifica (per esempio per inoltrare il completamento di un
async-task al canale che l'ha avviato).

> **Eccezione di timing con `--session-key`:** quando viene fornito `--session-key`,
> `--mode next-heartbeat` si riduce a un risveglio mirato immediato invece di
> attendere il prossimo tick pianificato. I risvegli mirati usano l'intent heartbeat
> `immediate`, quindi bypassano il gate not-due del runner che altrimenti
> differirebbe (e di fatto scarterebbe) un risveglio con intent `event`. Se vuoi una
> consegna ritardata, ometti `--session-key` così l'evento arriva nella sessione main e
> segue il successivo heartbeat regolare.

Flag:

- `--text <text>`: testo dell'evento di sistema obbligatorio.
- `--mode <mode>`: `now` o `next-heartbeat` (predefinito).
- `--session-key <sessionKey>`: opzionale; indirizza una sessione agente specifica
  invece della sessione main dell'agente. Le chiavi che non appartengono
  all'agente risolto ricadono sulla sessione main dell'agente.
- `--json`: output leggibile dalla macchina.
- `--url`, `--token`, `--timeout`, `--expect-final`: flag Gateway RPC condivisi.

## `system heartbeat last|enable|disable`

Controlli heartbeat:

- `last`: mostra l'ultimo evento heartbeat.
- `enable`: riattiva gli heartbeat (usalo se erano stati disabilitati).
- `disable`: mette in pausa gli heartbeat.

Flag:

- `--json`: output leggibile dalla macchina.
- `--url`, `--token`, `--timeout`, `--expect-final`: flag Gateway RPC condivisi.

## `system presence`

Elenca le voci di presenza di sistema correnti note al Gateway (nodi,
istanze e righe di stato simili).

Flag:

- `--json`: output leggibile dalla macchina.
- `--url`, `--token`, `--timeout`, `--expect-final`: flag Gateway RPC condivisi.

## Note

- Richiede un Gateway in esecuzione raggiungibile dalla configurazione corrente (locale o remoto).
- Gli eventi di sistema sono effimeri e non vengono mantenuti tra i riavvii.

## Correlati

- [Riferimento CLI](/it/cli)
