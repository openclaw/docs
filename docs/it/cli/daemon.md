---
read_when:
    - Usi ancora `openclaw daemon ...` negli script
    - Sono necessari i comandi per il ciclo di vita del servizio (installazione/avvio/arresto/riavvio/stato)
summary: Riferimento della CLI per `openclaw daemon` (alias legacy per la gestione del servizio Gateway)
title: Demone
x-i18n:
    generated_at: "2026-07-12T06:55:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4933885078d067ff2e077f25f14483aa5a10e3cd36951d0dc25c625d8b4d78e6
    source_path: cli/daemon.md
    workflow: 16
---

# `openclaw daemon`

Alias legacy per la gestione del servizio Gateway. `openclaw daemon ...` corrisponde agli stessi comandi di controllo del servizio di `openclaw gateway ...`. Per la documentazione e gli esempi attuali, preferire [`openclaw gateway`](/it/cli/gateway).

## Utilizzo

```bash
openclaw daemon status
openclaw daemon install
openclaw daemon start
openclaw daemon stop
openclaw daemon restart
openclaw daemon uninstall
```

## Sottocomandi e opzioni

| Sottocomando | Opzioni                                                                                                                        |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `status`      | `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`                               |
| `install`     | `--port`, `--runtime <node\|bun>`, `--token`, `--wrapper <path>`, `--force`, `--json`                                          |
| `uninstall`   | `--json`                                                                                                                       |
| `start`       | `--json`                                                                                                                       |
| `stop`        | `--json`, `--disable` (solo launchd: disabilita in modo persistente KeepAlive/RunAtLoad fino all'avvio successivo)             |
| `restart`     | `--force`, `--safe`, `--skip-deferral`, `--wait <duration>`, `--json`                                                          |

- `status`: mostra lo stato di installazione del servizio (launchd/systemd/schtasks) e verifica lo stato del Gateway.
- `install`: installa il servizio; `--force` reinstalla o sovrascrive un'installazione esistente.
- `restart --safe`: chiede al Gateway in esecuzione di eseguire una verifica preliminare delle attività attive e di pianificare un singolo riavvio accorpato dopo il loro completamento, entro il limite definito da `gateway.reload.deferralTimeoutMs` (valore predefinito: 300000 ms/5 minuti; impostare `0` per attendere indefinitamente). Alla scadenza di questo intervallo, il riavvio viene comunque forzato. Il semplice `restart` usa direttamente il gestore del servizio; `--force` forza il riavvio immediato.
- `restart --safe --skip-deferral`: ignora il meccanismo di rinvio basato sulle attività attive, quindi il Gateway si riavvia immediatamente anche quando vengono segnalati blocchi. Richiede `--safe`.

## Note

- Quando possibile, `status` risolve i SecretRef di autenticazione configurati per autenticare la verifica. Se un SecretRef obbligatorio non viene risolto, `status --json` segnala `rpc.authWarning`; passare esplicitamente `--token`/`--password` oppure risolvere prima l'origine del segreto. Gli avvisi relativi all'autenticazione non risolta vengono soppressi se la verifica riesce comunque.
- `status --deep` aggiunge un'analisi di sistema, con approccio best effort, alla ricerca di altri servizi simili a Gateway (mostra suggerimenti per la pulizia; resta consigliato un solo Gateway per macchina) ed esegue la convalida della configurazione in modalità compatibile con i Plugin, mostrando gli avvisi dei manifest dei Plugin ignorati dal percorso rapido predefinito.
- Nelle installazioni Linux con systemd, i controlli sulla divergenza dei token esaminano sia le origini `Environment=` sia quelle `EnvironmentFile=` delle unità.
- I controlli sulla divergenza dei token risolvono i SecretRef di `gateway.auth.token` usando l'ambiente di runtime combinato (prima l'ambiente del comando del servizio, quindi quello del processo). Se l'autenticazione tramite token non è effettivamente attiva (`gateway.auth.mode` impostato su `password`/`none`/`trusted-proxy`, oppure non impostato quando la password può prevalere), la risoluzione del token dalla configurazione viene ignorata.
- `install` verifica che un `gateway.auth.token` gestito tramite SecretRef sia risolvibile, ma non salva mai il valore risolto nei metadati dell'ambiente del servizio; se non è possibile risolverlo, l'installazione si interrompe in modo sicuro.
- Se sono configurati sia `gateway.auth.token` sia `gateway.auth.password` e `gateway.auth.mode` non è impostato, `install` viene bloccato finché la modalità non viene impostata esplicitamente.
- Su macOS, `install` mantiene i plist LaunchAgent e il file di ambiente/wrapper generato accessibili solo al proprietario (modalità `0600`/`0700`), anziché incorporare i segreti in `EnvironmentVariables`.
- Per eseguire più Gateway sullo stesso host, isolare porte, configurazione/stato e spazi di lavoro. Consultare [Gateway multipli](/it/gateway#multiple-gateways-same-host).

## Contenuti correlati

- [Riferimento della CLI](/it/cli)
- [Manuale operativo del Gateway](/it/gateway)
