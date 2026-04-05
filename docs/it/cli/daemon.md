---
read_when:
    - Usi ancora `openclaw daemon ...` negli script
    - Hai bisogno di comandi per il ciclo di vita del servizio (install/start/stop/restart/status)
summary: Riferimento CLI per `openclaw daemon` (alias legacy per la gestione del servizio gateway)
title: daemon
x-i18n:
    generated_at: "2026-04-05T13:47:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 91fdaf3c4f3e7dd4dff86f9b74a653dcba2674573698cf51efc4890077994169
    source_path: cli/daemon.md
    workflow: 15
---

# `openclaw daemon`

Alias legacy per i comandi di gestione del servizio Gateway.

`openclaw daemon ...` corrisponde alla stessa superficie di controllo del servizio dei comandi di servizio `openclaw gateway ...`.

## Utilizzo

```bash
openclaw daemon status
openclaw daemon install
openclaw daemon start
openclaw daemon stop
openclaw daemon restart
openclaw daemon uninstall
```

## Sottocomandi

- `status`: mostra lo stato di installazione del servizio ed esegue una probe dello stato di salute del Gateway
- `install`: installa il servizio (`launchd`/`systemd`/`schtasks`)
- `uninstall`: rimuove il servizio
- `start`: avvia il servizio
- `stop`: arresta il servizio
- `restart`: riavvia il servizio

## Opzioni comuni

- `status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
- `install`: `--port`, `--runtime <node|bun>`, `--token`, `--force`, `--json`
- ciclo di vita (`uninstall|start|stop|restart`): `--json`

Note:

- `status` risolve, quando possibile, i SecretRef di autenticazione configurati per l'autenticazione della probe.
- Se un SecretRef di autenticazione richiesto non è risolto in questo percorso di comando, `daemon status --json` segnala `rpc.authWarning` quando la connettività/l'autenticazione della probe fallisce; passa `--token`/`--password` esplicitamente oppure risolvi prima la sorgente del segreto.
- Se la probe ha esito positivo, gli avvisi su auth-ref non risolti vengono soppressi per evitare falsi positivi.
- `status --deep` aggiunge una scansione best-effort del servizio a livello di sistema. Quando trova altri servizi simili al gateway, l'output per umani stampa suggerimenti di pulizia e avvisa che un gateway per macchina resta comunque la raccomandazione normale.
- Nelle installazioni Linux systemd, i controlli di token drift di `status` includono sia le sorgenti dell'unità `Environment=` sia `EnvironmentFile=`.
- I controlli di drift risolvono i SecretRef `gateway.auth.token` usando l'env runtime unito (prima l'env del comando di servizio, poi l'env del processo come fallback).
- Se l'autenticazione tramite token non è effettivamente attiva (modalità `gateway.auth.mode` esplicita `password`/`none`/`trusted-proxy`, oppure modalità non impostata in cui può prevalere la password e nessun candidato token può prevalere), i controlli di token drift saltano la risoluzione del token di configurazione.
- Quando l'autenticazione tramite token richiede un token e `gateway.auth.token` è gestito da SecretRef, `install` convalida che il SecretRef sia risolvibile ma non persiste il token risolto nei metadati dell'ambiente del servizio.
- Se l'autenticazione tramite token richiede un token e il SecretRef del token configurato non è risolto, l'installazione fallisce in modalità fail-closed.
- Se sono configurati sia `gateway.auth.token` sia `gateway.auth.password` e `gateway.auth.mode` non è impostato, l'installazione viene bloccata finché la modalità non viene impostata esplicitamente.
- Se esegui intenzionalmente più gateway sullo stesso host, isola porte, config/stato e workspace; vedi [/gateway#multiple-gateways-same-host](/gateway#multiple-gateways-same-host).

## Preferisci

Usa [`openclaw gateway`](/cli/gateway) per la documentazione e gli esempi correnti.
