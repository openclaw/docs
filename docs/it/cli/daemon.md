---
read_when:
    - Usi ancora `openclaw daemon ...` negli script
    - Sono necessari i comandi del ciclo di vita del servizio (install/start/stop/restart/status)
summary: Riferimento CLI per `openclaw daemon` (alias storico per la gestione del servizio Gateway)
title: Demone
x-i18n:
    generated_at: "2026-05-02T22:17:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3f11b75bf2781e69f6f59b23364f06cf359f9f24407f25f19b9d2186f7158512
    source_path: cli/daemon.md
    workflow: 16
---

# `openclaw daemon`

Alias legacy per i comandi di gestione del servizio Gateway.

`openclaw daemon ...` mappa alla stessa superficie di controllo del servizio dei comandi di servizio `openclaw gateway ...`.

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

- `status`: mostra lo stato di installazione del servizio e verifica la salute del Gateway
- `install`: installa il servizio (`launchd`/`systemd`/`schtasks`)
- `uninstall`: rimuove il servizio
- `start`: avvia il servizio
- `stop`: arresta il servizio
- `restart`: riavvia il servizio

## Opzioni comuni

- `status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
- `install`: `--port`, `--runtime <node|bun>`, `--token`, `--force`, `--json`
- `restart`: `--force`, `--wait <duration>`, `--json`
- ciclo di vita (`uninstall|start|stop`): `--json`

Note:

- `status` risolve i SecretRef di autenticazione configurati per l'autenticazione del probe quando possibile.
- Se un SecretRef di autenticazione richiesto non viene risolto in questo percorso di comando, `daemon status --json` segnala `rpc.authWarning` quando la connettività/autenticazione del probe non riesce; passa `--token`/`--password` esplicitamente oppure risolvi prima la fonte del segreto.
- Se il probe riesce, gli avvisi auth-ref non risolti vengono soppressi per evitare falsi positivi.
- `status --deep` aggiunge una scansione best-effort del servizio a livello di sistema. Quando trova altri servizi simili al gateway, l'output leggibile stampa suggerimenti di pulizia e avvisa che un gateway per macchina resta comunque la raccomandazione normale.
- Nelle installazioni systemd su Linux, i controlli di deriva del token di `status` includono sia le sorgenti unità `Environment=` sia `EnvironmentFile=`.
- I controlli di deriva risolvono i SecretRef `gateway.auth.token` usando l'env di runtime unito (prima l'env del comando di servizio, poi il fallback all'env di processo).
- Se l'autenticazione con token non è effettivamente attiva (`gateway.auth.mode` esplicito di `password`/`none`/`trusted-proxy`, oppure mode non impostata dove la password può prevalere e nessun candidato token può prevalere), i controlli di deriva del token saltano la risoluzione del token di configurazione.
- Quando l'autenticazione con token richiede un token e `gateway.auth.token` è gestito da SecretRef, `install` verifica che il SecretRef sia risolvibile ma non persiste il token risolto nei metadati dell'ambiente di servizio.
- Se l'autenticazione con token richiede un token e il SecretRef del token configurato non è risolto, l'installazione fallisce in modo chiuso.
- Se sono configurati sia `gateway.auth.token` sia `gateway.auth.password` e `gateway.auth.mode` non è impostato, l'installazione viene bloccata finché la mode non viene impostata esplicitamente.
- Su macOS, `install` mantiene i plist LaunchAgent accessibili solo al proprietario e carica i valori dell'ambiente del servizio gestito tramite un file e un wrapper accessibili solo al proprietario, invece di serializzare chiavi API o riferimenti env del profilo di autenticazione in `EnvironmentVariables`.
- Se esegui intenzionalmente più gateway su un host, isola porte, config/stato e workspace; vedi [/gateway#multiple-gateways-same-host](/it/gateway#multiple-gateways-same-host).

## Da preferire

Usa [`openclaw gateway`](/it/cli/gateway) per la documentazione e gli esempi correnti.

## Correlati

- [Riferimento CLI](/it/cli)
- [Runbook Gateway](/it/gateway)
