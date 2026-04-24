---
read_when:
    - Usi ancora `openclaw daemon ...` negli script
    - Hai bisogno dei comandi del ciclo di vita del servizio (install, start, stop, restart, status)
summary: Riferimento CLI per `openclaw daemon` (alias legacy per la gestione del servizio Gateway)
title: Daemon
x-i18n:
    generated_at: "2026-04-24T08:33:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: b492768b46c459b69cd3127c375e0c573db56c76572fdbf7b2b8eecb3e9835ce
    source_path: cli/daemon.md
    workflow: 15
---

# `openclaw daemon`

Alias legacy per i comandi di gestione del servizio Gateway.

`openclaw daemon ...` corrisponde alla stessa superficie di controllo del servizio di `openclaw gateway ...`.

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

- `status`: mostra lo stato di installazione del servizio e verifica lo stato di salute del Gateway
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

- `status` risolve i SecretRef di autenticazione configurati per l'autenticazione della probe quando possibile.
- Se un SecretRef di autenticazione richiesto non è risolto in questo percorso di comando, `daemon status --json` riporta `rpc.authWarning` quando la connettività/autenticazione della probe fallisce; passa esplicitamente `--token`/`--password` oppure risolvi prima la sorgente del secret.
- Se la probe riesce, gli avvisi auth-ref non risolti vengono soppressi per evitare falsi positivi.
- `status --deep` aggiunge una scansione best-effort del servizio a livello di sistema. Quando trova altri servizi simili a gateway, l'output leggibile stampa suggerimenti di pulizia e avvisa che un gateway per macchina resta comunque la raccomandazione normale.
- Nelle installazioni Linux systemd, i controlli token-drift di `status` includono sia le sorgenti unit `Environment=` sia `EnvironmentFile=`.
- I controlli di drift risolvono i SecretRef di `gateway.auth.token` usando l'ambiente runtime unito (prima l'ambiente del comando di servizio, poi il fallback all'ambiente del processo).
- Se l'autenticazione token non è effettivamente attiva (modalità `gateway.auth.mode` esplicita `password`/`none`/`trusted-proxy`, oppure modalità non impostata dove può prevalere la password e nessun candidato token può prevalere), i controlli token-drift saltano la risoluzione del token di configurazione.
- Quando l'autenticazione token richiede un token e `gateway.auth.token` è gestito da SecretRef, `install` verifica che il SecretRef sia risolvibile ma non rende persistente il token risolto nei metadati dell'ambiente di servizio.
- Se l'autenticazione token richiede un token e il SecretRef del token configurato non è risolto, l'installazione fallisce in modalità fail-closed.
- Se sia `gateway.auth.token` sia `gateway.auth.password` sono configurati e `gateway.auth.mode` non è impostato, l'installazione viene bloccata finché la modalità non viene impostata esplicitamente.
- Se esegui intenzionalmente più gateway su un solo host, isola porte, configurazione/stato e workspace; vedi [/gateway#multiple-gateways-same-host](/it/gateway#multiple-gateways-same-host).

## Preferisci

Usa [`openclaw gateway`](/it/cli/gateway) per la documentazione e gli esempi aggiornati.

## Correlati

- [Riferimento CLI](/it/cli)
- [Runbook del Gateway](/it/gateway)
