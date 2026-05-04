---
read_when:
    - Usi ancora `openclaw daemon ...` negli script
    - Sono necessari comandi del ciclo di vita del servizio (install/start/stop/restart/status)
summary: Riferimento CLI per `openclaw daemon` (alias legacy per la gestione del servizio Gateway)
title: Demone
x-i18n:
    generated_at: "2026-05-04T18:23:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: f84e11fc50bdf38da518a8fcf415ae461a2688c2299f996eee384357c0d04a05
    source_path: cli/daemon.md
    workflow: 16
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

- `status`: mostra lo stato di installazione del servizio e verifica lo stato del Gateway
- `install`: installa il servizio (`launchd`/`systemd`/`schtasks`)
- `uninstall`: rimuove il servizio
- `start`: avvia il servizio
- `stop`: arresta il servizio
- `restart`: riavvia il servizio

## Opzioni comuni

- `status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
- `install`: `--port`, `--runtime <node|bun>`, `--token`, `--force`, `--json`
- `restart`: `--safe`, `--force`, `--wait <duration>`, `--json`
- ciclo di vita (`uninstall|start|stop`): `--json`

Note:

- `status` risolve, quando possibile, le SecretRefs di autenticazione configurate per l'autenticazione del probe.
- Se una SecretRef di autenticazione richiesta non viene risolta in questo percorso del comando, `daemon status --json` segnala `rpc.authWarning` quando la connettività/autenticazione del probe non riesce; passa esplicitamente `--token`/`--password` oppure risolvi prima la sorgente del segreto.
- Se il probe riesce, gli avvisi per auth-ref non risolti vengono soppressi per evitare falsi positivi.
- `status --deep` aggiunge una scansione del servizio a livello di sistema, eseguita al meglio. Quando trova altri servizi simili al gateway, l'output leggibile stampa suggerimenti di pulizia e avvisa che la raccomandazione normale resta un gateway per macchina.
- Nelle installazioni systemd su Linux, i controlli di divergenza del token di `status` includono sia le sorgenti unit `Environment=` sia `EnvironmentFile=`.
- I controlli di divergenza risolvono le SecretRefs `gateway.auth.token` usando l'ambiente runtime unito (prima l'ambiente del comando di servizio, poi il fallback all'ambiente del processo).
- Se l'autenticazione tramite token non è effettivamente attiva (`gateway.auth.mode` esplicito di `password`/`none`/`trusted-proxy`, oppure modalità non impostata in cui la password può prevalere e nessun candidato token può prevalere), i controlli di divergenza del token saltano la risoluzione del token di configurazione.
- Quando l'autenticazione tramite token richiede un token e `gateway.auth.token` è gestito da SecretRef, `install` verifica che la SecretRef sia risolvibile ma non persiste il token risolto nei metadati dell'ambiente del servizio.
- Se l'autenticazione tramite token richiede un token e la SecretRef del token configurata non è risolta, l'installazione fallisce in modo chiuso.
- Se sono configurati sia `gateway.auth.token` sia `gateway.auth.password` e `gateway.auth.mode` non è impostato, l'installazione viene bloccata finché la modalità non viene impostata esplicitamente.
- Su macOS, `install` mantiene i plist LaunchAgent accessibili solo al proprietario e carica i valori dell'ambiente del servizio gestito tramite un file e un wrapper accessibili solo al proprietario, invece di serializzare chiavi API o riferimenti env del profilo di autenticazione in `EnvironmentVariables`.
- Se esegui intenzionalmente più gateway su un host, isola porte, configurazione/stato e workspace; vedi [/gateway#multiple-gateways-same-host](/it/gateway#multiple-gateways-same-host).
- `restart --safe` chiede al Gateway in esecuzione di eseguire il preflight del lavoro attivo e pianificare un unico riavvio aggregato dopo che il lavoro attivo si è esaurito. `restart` semplice mantiene il comportamento esistente del gestore del servizio; `--force` resta il percorso di override immediato.

## Preferisci

Usa [`openclaw gateway`](/it/cli/gateway) per la documentazione e gli esempi correnti.

## Correlati

- [Riferimento CLI](/it/cli)
- [Runbook Gateway](/it/gateway)
