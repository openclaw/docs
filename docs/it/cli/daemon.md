---
read_when:
    - Usi ancora `openclaw daemon ...` negli script
    - Sono necessari i comandi del ciclo di vita del servizio (install/start/stop/restart/status)
summary: Riferimento CLI per `openclaw daemon` (alias obsoleto per la gestione del servizio Gateway)
title: Demone
x-i18n:
    generated_at: "2026-05-11T20:25:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0131c3838ac0240f38e755eb779134d19a935821d90bb2898648b947696be12e
    source_path: cli/daemon.md
    workflow: 16
---

# `openclaw daemon`

Alias legacy per i comandi di gestione del servizio Gateway.

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
- `restart`: `--safe`, `--skip-deferral`, `--force`, `--wait <duration>`, `--json`
- ciclo di vita (`uninstall|start|stop`): `--json`

Note:

- `status` risolve le SecretRef di autenticazione configurate per l'autenticazione della verifica quando possibile.
- Se una SecretRef di autenticazione richiesta non viene risolta in questo percorso di comando, `daemon status --json` segnala `rpc.authWarning` quando la connettività/autenticazione della verifica non riesce; passa esplicitamente `--token`/`--password` oppure risolvi prima l'origine del segreto.
- Se la verifica riesce, gli avvisi di auth-ref non risolti vengono soppressi per evitare falsi positivi.
- `status --deep` aggiunge una scansione del servizio a livello di sistema best-effort. Quando trova altri servizi simili al Gateway, l'output leggibile dagli utenti stampa suggerimenti di pulizia e avvisa che un Gateway per macchina resta comunque la raccomandazione normale.
- `status --deep` esegue anche la convalida della configurazione in modalità consapevole dei Plugin e mostra gli avvisi del manifest dei Plugin configurati (per esempio metadati di configurazione del canale mancanti), in modo che i controlli smoke di installazione e aggiornamento li rilevino. Il `status` predefinito mantiene il percorso rapido in sola lettura che salta la convalida dei Plugin.
- Nelle installazioni systemd su Linux, i controlli di drift dei token di `status` includono sia le sorgenti unità `Environment=` sia `EnvironmentFile=`.
- I controlli di drift risolvono le SecretRef `gateway.auth.token` usando l'env runtime unito (prima l'env del comando di servizio, poi il fallback sull'env del processo).
- Se l'autenticazione tramite token non è effettivamente attiva (`gateway.auth.mode` esplicito di `password`/`none`/`trusted-proxy`, oppure mode non impostato dove la password può prevalere e nessun candidato token può prevalere), i controlli di drift dei token saltano la risoluzione del token di configurazione.
- Quando l'autenticazione tramite token richiede un token e `gateway.auth.token` è gestito da SecretRef, `install` convalida che la SecretRef sia risolvibile ma non rende persistente il token risolto nei metadati dell'ambiente del servizio.
- Se l'autenticazione tramite token richiede un token e la SecretRef del token configurata non è risolta, l'installazione fallisce in modo chiuso.
- Se sono configurati sia `gateway.auth.token` sia `gateway.auth.password` e `gateway.auth.mode` non è impostato, l'installazione viene bloccata finché mode non viene impostato esplicitamente.
- Su macOS, `install` mantiene le plist LaunchAgent accessibili solo al proprietario e carica i valori dell'ambiente del servizio gestito tramite un file e un wrapper accessibili solo al proprietario invece di serializzare chiavi API o riferimenti env del profilo di autenticazione in `EnvironmentVariables`.
- Se esegui intenzionalmente più Gateway su un host, isola porte, configurazione/stato e workspace; vedi [/gateway#multiple-gateways-same-host](/it/gateway#multiple-gateways-same-host).
- `restart --safe` chiede al Gateway in esecuzione di eseguire un preflight del lavoro attivo e pianificare un unico riavvio accorpato dopo lo svuotamento del lavoro attivo. Il semplice `restart` mantiene il comportamento esistente del gestore del servizio; `--force` resta il percorso di override immediato.
- `restart --safe --skip-deferral` esegue il riavvio sicuro consapevole di OpenClaw ma bypassa il gate di rinvio del lavoro attivo, così il Gateway emette immediatamente il riavvio anche quando vengono segnalati blocker. Via di fuga per l'operatore quando un'esecuzione di task bloccata mantiene attivo il riavvio sicuro; richiede `--safe`.

## Preferisci

Usa [`openclaw gateway`](/it/cli/gateway) per la documentazione e gli esempi correnti.

## Correlati

- [Riferimento CLI](/it/cli)
- [Runbook del Gateway](/it/gateway)
