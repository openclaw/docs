---
read_when:
    - Usi ancora `openclaw daemon ...` negli script
    - Sono necessari comandi per il ciclo di vita del servizio (install/start/stop/restart/status)
summary: Riferimento CLI per `openclaw daemon` (alias legacy per la gestione del servizio Gateway)
title: Demone
x-i18n:
    generated_at: "2026-04-30T08:42:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 51839f7cbc180cc0c43caa2d7e83cc2add7cbca40665f83f64e6ce9dde8574dd
    source_path: cli/daemon.md
    workflow: 16
---

# `openclaw daemon`

Alias obsoleto per i comandi di gestione del servizio Gateway.

`openclaw daemon ...` corrisponde alla stessa interfaccia di controllo del servizio dei comandi di servizio `openclaw gateway ...`.

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

- `status`: mostra lo stato di installazione del servizio e verifica l'integrità del Gateway
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

- `status` risolve le SecretRefs di autenticazione configurate per l'autenticazione della verifica, quando possibile.
- Se una SecretRef di autenticazione richiesta non è risolta in questo percorso di comando, `daemon status --json` riporta `rpc.authWarning` quando la connettività/autenticazione della verifica non riesce; passa esplicitamente `--token`/`--password` oppure risolvi prima l'origine del segreto.
- Se la verifica riesce, gli avvisi per auth-ref non risolti vengono soppressi per evitare falsi positivi.
- `status --deep` aggiunge una scansione del servizio a livello di sistema nel miglior modo possibile. Quando trova altri servizi simili a Gateway, l'output leggibile stampa suggerimenti di pulizia e avvisa che un Gateway per macchina è ancora la raccomandazione normale.
- Nelle installazioni systemd su Linux, i controlli di deriva del token di `status` includono sia le origini unità `Environment=` sia `EnvironmentFile=`.
- I controlli di deriva risolvono le SecretRefs `gateway.auth.token` usando l'env di runtime unito (prima l'env del comando di servizio, poi il fallback all'env del processo).
- Se l'autenticazione tramite token non è effettivamente attiva (`gateway.auth.mode` esplicito di `password`/`none`/`trusted-proxy`, oppure modalità non impostata in cui la password può prevalere e nessun candidato token può prevalere), i controlli di deriva del token saltano la risoluzione del token di configurazione.
- Quando l'autenticazione tramite token richiede un token e `gateway.auth.token` è gestito da SecretRef, `install` verifica che la SecretRef sia risolvibile ma non persiste il token risolto nei metadati dell'ambiente del servizio.
- Se l'autenticazione tramite token richiede un token e la SecretRef del token configurata non è risolta, l'installazione fallisce in modo chiuso.
- Se sono configurati sia `gateway.auth.token` sia `gateway.auth.password` e `gateway.auth.mode` non è impostato, l'installazione viene bloccata finché la modalità non viene impostata esplicitamente.
- Su macOS, `install` mantiene i plist LaunchAgent accessibili solo al proprietario e carica i valori dell'ambiente del servizio gestito tramite un file e un wrapper accessibili solo al proprietario, invece di serializzare chiavi API o riferimenti env auth-profile in `EnvironmentVariables`.
- Se esegui intenzionalmente più Gateway su un solo host, isola porte, configurazione/stato e workspace; consulta [/gateway#multiple-gateways-same-host](/it/gateway#multiple-gateways-same-host).

## Preferisci

Usa [`openclaw gateway`](/it/cli/gateway) per la documentazione e gli esempi attuali.

## Correlati

- [Riferimento CLI](/it/cli)
- [Runbook Gateway](/it/gateway)
