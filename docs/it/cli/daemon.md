---
read_when:
    - Usi ancora `openclaw daemon ...` negli script
    - Sono necessari i comandi del ciclo di vita del servizio (install/start/stop/restart/status)
summary: Riferimento CLI per `openclaw daemon` (alias obsoleto per la gestione del servizio Gateway)
title: Demone
x-i18n:
    generated_at: "2026-05-10T19:28:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: b1951ade64d538130e4f04954cc8dec136f54a78b1fdf94e6ce988ded8cab516
    source_path: cli/daemon.md
    workflow: 16
---

# `openclaw daemon`

Alias storico per i comandi di gestione del servizio Gateway.

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

- `status` risolve i SecretRefs di autenticazione configurati per l'autenticazione del probe quando possibile.
- Se un SecretRef di autenticazione richiesto non viene risolto in questo percorso di comando, `daemon status --json` segnala `rpc.authWarning` quando la connettività/autenticazione del probe non riesce; passa `--token`/`--password` esplicitamente o risolvi prima la sorgente del segreto.
- Se il probe riesce, gli avvisi di auth-ref non risolti vengono soppressi per evitare falsi positivi.
- `status --deep` aggiunge una scansione best-effort del servizio a livello di sistema. Quando trova altri servizi simili al gateway, l'output umano stampa suggerimenti di pulizia e avvisa che un gateway per macchina resta comunque la raccomandazione normale.
- Nelle installazioni systemd su Linux, i controlli di deriva del token di `status` includono entrambe le sorgenti di unità `Environment=` ed `EnvironmentFile=`.
- I controlli di deriva risolvono i SecretRefs `gateway.auth.token` usando l'ambiente di runtime unito (prima l'ambiente del comando di servizio, poi il fallback all'ambiente del processo).
- Se l'autenticazione tramite token non è effettivamente attiva (`gateway.auth.mode` esplicito impostato su `password`/`none`/`trusted-proxy`, oppure modalità non impostata in cui la password può prevalere e nessun candidato token può prevalere), i controlli di deriva del token saltano la risoluzione del token di configurazione.
- Quando l'autenticazione tramite token richiede un token e `gateway.auth.token` è gestito da SecretRef, `install` verifica che il SecretRef sia risolvibile ma non persiste il token risolto nei metadati dell'ambiente del servizio.
- Se l'autenticazione tramite token richiede un token e il SecretRef del token configurato non è risolto, l'installazione fallisce in modo chiuso.
- Se sono configurati sia `gateway.auth.token` sia `gateway.auth.password` e `gateway.auth.mode` non è impostato, l'installazione viene bloccata finché la modalità non viene impostata esplicitamente.
- Su macOS, `install` mantiene le plist LaunchAgent accessibili solo al proprietario e carica i valori dell'ambiente del servizio gestito tramite un file e un wrapper accessibili solo al proprietario, invece di serializzare chiavi API o riferimenti env di profili di autenticazione in `EnvironmentVariables`.
- Se esegui intenzionalmente più gateway su un host, isola porte, configurazione/stato e workspace; vedi [/gateway#multiple-gateways-same-host](/it/gateway#multiple-gateways-same-host).
- `restart --safe` chiede al Gateway in esecuzione di prevalidare il lavoro attivo e pianificare un singolo riavvio aggregato dopo lo svuotamento del lavoro attivo. Il semplice `restart` mantiene il comportamento esistente del gestore del servizio; `--force` resta il percorso di override immediato.
- `restart --safe --skip-deferral` esegue il riavvio sicuro consapevole di OpenClaw ma bypassa il gate di rinvio del lavoro attivo, quindi il Gateway emette immediatamente il riavvio anche quando vengono segnalati blocchi. Valvola di uscita per l'operatore quando un'esecuzione di attività bloccata impedisce il riavvio sicuro; richiede `--safe`.

## Preferire

Usa [`openclaw gateway`](/it/cli/gateway) per la documentazione e gli esempi correnti.

## Correlati

- [Riferimento CLI](/it/cli)
- [Runbook del Gateway](/it/gateway)
