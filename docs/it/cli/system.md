---
read_when:
    - Vuoi accodare un evento di sistema senza creare un processo Cron
    - Devi abilitare o disabilitare gli Heartbeat
    - Vuoi esaminare le voci di presenza del sistema
summary: Riferimento CLI per `openclaw system` (eventi di sistema, Heartbeat, presenza)
title: Sistema
x-i18n:
    generated_at: "2026-07-12T06:55:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: aaca206d8b463fd33f9e3cb21382bbf36469e9daa2706d8a9e2c7fab14b76e7a
    source_path: cli/system.md
    workflow: 16
---

# `openclaw system`

Strumenti di supporto a livello di sistema per il Gateway: accodano eventi di sistema, controllano gli
heartbeat e visualizzano la presenza.

Tutti i sottocomandi `system` usano l'RPC del Gateway e accettano le opzioni client condivise:

| Opzione           | Valore predefinito                        | Descrizione                                                                                                                                                                                                 |
| ----------------- | ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--url <url>`     | `gateway.remote.url` se configurato       | URL WebSocket del Gateway.                                                                                                                                                                                  |
| `--token <token>` | nessuno                                   | Token del Gateway (se richiesto).                                                                                                                                                                           |
| `--timeout <ms>`  | `30000`                                   | Timeout RPC in millisecondi.                                                                                                                                                                                |
| `--expect-final`  | disattivato                               | Attende la risposta finale (agente).                                                                                                                                                                        |
| `--json`          | disattivato                               | Produce output JSON. `heartbeat last/enable/disable` e `system presence` stampano sempre il payload JSON RPC non elaborato indipendentemente da questa opzione; `system event` la usa per scegliere tra JSON e una semplice riga `ok`. |

## Comandi comuni

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
openclaw system event --text "Check for urgent follow-ups" --url ws://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
openclaw system heartbeat enable
openclaw system heartbeat last
openclaw system presence
```

## `system event`

Per impostazione predefinita, accoda un evento di sistema nella sessione **principale**. Il successivo
heartbeat lo inserisce nel prompt come riga `System:`. Usa `--mode now` per
attivare immediatamente l'heartbeat; `next-heartbeat` (valore predefinito) attende il
successivo ciclo pianificato.

Specifica `--session-key` per scegliere come destinazione una sessione specifica, ad esempio per inoltrare il
completamento di un'attività asincrona al canale che l'ha avviata.

<Note>
**Eccezione temporale con `--session-key`:** quando viene specificato `--session-key`,
`--mode next-heartbeat` si riduce a un'attivazione mirata immediata anziché
attendere il successivo ciclo pianificato. Le attivazioni mirate usano l'intento heartbeat
`immediate`, quindi ignorano il controllo del runner che verificherebbe se l'esecuzione non è ancora prevista e altrimenti
rinvierebbe (e di fatto eliminerebbe) un'attivazione con intento `event`. Per ottenere una consegna
ritardata, ometti `--session-key`, così l'evento viene inserito nella sessione principale e
viene trasportato dal successivo heartbeat regolare.
</Note>

Opzioni:

- `--text <text>`: testo obbligatorio dell'evento di sistema.
- `--mode <mode>`: `now` o `next-heartbeat` (valore predefinito).
- `--session-key <sessionKey>`: facoltativo; sceglie come destinazione una sessione specifica dell'agente
  anziché la sessione principale dell'agente. Le chiavi che non appartengono all'agente
  individuato ripiegano sulla sessione principale dell'agente.

## `system heartbeat last|enable|disable`

- `last`: mostra l'ultimo evento heartbeat.
- `enable`: riattiva gli heartbeat (usalo se erano stati disattivati).
- `disable`: sospende gli heartbeat.

## `system presence`

Elenca le voci correnti relative alla presenza del sistema note al Gateway (nodi,
istanze e righe di stato simili).

## Note

- Richiede un Gateway in esecuzione e raggiungibile tramite la configurazione corrente (locale o
  remota).
- Gli eventi di sistema sono temporanei e non vengono conservati dopo i riavvii.

## Contenuti correlati

- [Riferimento della CLI](/it/cli)
