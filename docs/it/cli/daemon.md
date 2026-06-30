---
read_when:
    - Usi ancora `openclaw daemon ...` negli script
    - Sono necessari i comandi del ciclo di vita del servizio (install/start/stop/restart/status)
summary: Riferimento CLI per `openclaw daemon` (alias legacy per la gestione del servizio Gateway)
title: Demone
x-i18n:
    generated_at: "2026-06-30T14:07:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1a3ec72b22907994ecefac84b2b9e5b22bf1d922e5b2822a1c0db80f0362dade
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
- `status --deep` aggiunge una scansione del servizio a livello di sistema basata sul massimo impegno. Quando trova altri servizi simili a gateway, l'output umano stampa suggerimenti di pulizia e avvisa che un gateway per macchina resta comunque la raccomandazione normale.
- `status --deep` esegue anche la convalida della configurazione in modalità consapevole dei plugin ed espone gli avvisi del manifesto dei plugin configurati (per esempio metadati mancanti della configurazione del canale), così i controlli smoke di installazione e aggiornamento li intercettano. `status` predefinito mantiene il percorso rapido in sola lettura che salta la convalida dei plugin.
- Nelle installazioni Linux systemd, i controlli di deriva del token di `status` includono sia le origini unità `Environment=` sia `EnvironmentFile=`.
- I controlli di deriva risolvono le SecretRef `gateway.auth.token` usando l'ambiente runtime unito (prima l'ambiente del comando di servizio, poi il fallback all'ambiente di processo).
- Se l'autenticazione con token non è effettivamente attiva (`gateway.auth.mode` esplicito impostato su `password`/`none`/`trusted-proxy`, oppure modalità non impostata in cui la password può prevalere e nessun candidato token può prevalere), i controlli di deriva del token saltano la risoluzione del token di configurazione.
- Quando l'autenticazione con token richiede un token e `gateway.auth.token` è gestito tramite SecretRef, `install` convalida che la SecretRef sia risolvibile ma non persiste il token risolto nei metadati dell'ambiente del servizio.
- Se l'autenticazione con token richiede un token e la SecretRef del token configurata non è risolta, l'installazione fallisce in modo chiuso.
- Se sono configurati sia `gateway.auth.token` sia `gateway.auth.password` e `gateway.auth.mode` non è impostato, l'installazione viene bloccata finché la modalità non viene impostata esplicitamente.
- Su macOS, `install` mantiene i plist LaunchAgent accessibili solo al proprietario e carica i valori dell'ambiente del servizio gestito tramite un file e un wrapper accessibili solo al proprietario invece di serializzare chiavi API o riferimenti env del profilo di autenticazione in `EnvironmentVariables`.
- Se esegui intenzionalmente più gateway su un host, isola porte, configurazione/stato e workspace; vedi [/gateway#multiple-gateways-same-host](/it/gateway#multiple-gateways-same-host).
- `restart --safe` chiede al Gateway in esecuzione di eseguire il preflight del lavoro attivo e pianificare un riavvio coalescente dopo che il lavoro attivo si è esaurito. Il riavvio sicuro predefinito attende il lavoro attivo fino al valore configurato di `gateway.reload.deferralTimeoutMs` (predefinito 5 minuti); quando tale budget scade, il riavvio viene forzato. Imposta `gateway.reload.deferralTimeoutMs` su `0` per un'attesa sicura indefinita che non forza mai. `restart` semplice mantiene il comportamento esistente del gestore del servizio; `--force` resta il percorso di override immediato.
- `restart --safe --skip-deferral` esegue il riavvio sicuro consapevole di OpenClaw ma aggira il gate di rinvio del lavoro attivo, quindi il Gateway emette immediatamente il riavvio anche quando vengono segnalati blocchi. Via di fuga per l'operatore quando un'esecuzione di task bloccata immobilizza il riavvio sicuro; richiede `--safe`.

## Preferisci

Usa [`openclaw gateway`](/it/cli/gateway) per la documentazione e gli esempi attuali.

## Correlati

- [Riferimento CLI](/it/cli)
- [Runbook del Gateway](/it/gateway)
