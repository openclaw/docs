---
read_when:
    - Si usa ancora `openclaw daemon ...` negli script
    - Sono necessari comandi per il ciclo di vita del servizio (installazione/avvio/arresto/riavvio/stato)
summary: Riferimento CLI per `openclaw daemon` (alias legacy per la gestione del servizio Gateway)
title: Demone
x-i18n:
    generated_at: "2026-07-16T14:12:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: a5e08114a8a0de959b54fcb0fcef88b880424fd89c133f7c383f254d18f0d71d
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

| Sottocomando | Opzioni                                                                                          |
| ------------- | ------------------------------------------------------------------------------------------------ |
| `status`    | `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json` |
| `install`   | `--port`, `--runtime <node>`, `--token`, `--wrapper <path>`, `--force`, `--json`                 |
| `uninstall` | `--json`                                                                                         |
| `start`     | `--json`                                                                                         |
| `stop`      | `--json`, `--disable` (solo launchd: disabilita in modo persistente KeepAlive/RunAtLoad fino all'avvio successivo) |
| `restart`   | `--force`, `--safe`, `--skip-deferral`, `--wait <duration>`, `--json`                            |

- `status`: mostra lo stato di installazione del servizio (launchd/systemd/schtasks) e verifica lo stato del Gateway.
- `install`: installa il servizio; `--force` reinstalla/sovrascrive un'installazione esistente.
- `restart --safe`: richiede al Gateway in esecuzione di eseguire un controllo preliminare delle attività in corso e pianificare un unico riavvio accorpato dopo il loro completamento, entro il limite di `gateway.reload.deferralTimeoutMs` (valore predefinito: 300000ms/5 minuti; impostare `0` per attendere indefinitamente). Allo scadere di tale limite, il riavvio viene comunque forzato. Il semplice `restart` usa direttamente il gestore del servizio; `--force` consente di ignorare immediatamente l'attesa.
- `restart --safe --skip-deferral`: ignora il controllo che rinvia l'operazione in presenza di attività in corso, così il Gateway viene riavviato immediatamente anche quando vengono segnalati elementi bloccanti. Richiede `--safe`.

## Note

- `status` risolve, quando possibile, i SecretRef di autenticazione configurati per autenticare la verifica. Se un SecretRef obbligatorio non viene risolto, `status --json` segnala `rpc.authWarning`; passare esplicitamente `--token`/`--password` oppure risolvere prima l'origine del segreto. Gli avvisi relativi all'autenticazione non risolta vengono soppressi quando la verifica riesce comunque.
- `status --deep` aggiunge una scansione di sistema di tipo best effort per rilevare altri servizi simili al Gateway (mostra suggerimenti per la pulizia; resta consigliato un solo Gateway per macchina) ed esegue la convalida della configurazione in modalità compatibile con i plugin, mostrando gli avvisi del manifesto dei plugin ignorati dal rapido percorso predefinito.
- Nelle installazioni systemd su Linux, i controlli delle divergenze dei token esaminano sia le origini delle unità `Environment=` sia quelle `EnvironmentFile=`.
- I controlli delle divergenze dei token risolvono i SecretRef `gateway.auth.token` usando l'ambiente di runtime combinato (prima l'ambiente del comando del servizio, poi l'ambiente del processo). Se l'autenticazione tramite token non è effettivamente attiva (`gateway.auth.mode` con valore `password`/`none`/`trusted-proxy`, oppure non impostato quando la password può avere la precedenza), la risoluzione del token di configurazione viene ignorata.
- `install` verifica che un `gateway.auth.token` gestito tramite SecretRef sia risolvibile, ma non salva mai il valore risolto nei metadati dell'ambiente del servizio; se non è possibile risolverlo, l'installazione non viene eseguita.
- Se sono configurati sia `gateway.auth.token` sia `gateway.auth.password` e `gateway.auth.mode` non è impostato, `install` blocca l'operazione finché la modalità non viene impostata esplicitamente.
- Su macOS, `install` mantiene i plist di LaunchAgent e il file di ambiente/wrapper generato accessibili solo al proprietario (modalità `0600`/`0700`), anziché incorporare i segreti in `EnvironmentVariables`.
- Per eseguire più Gateway sullo stesso host, isolare porte, configurazione/stato e aree di lavoro. Consultare [Più gateway](/it/gateway#multiple-gateways-same-host).

## Contenuti correlati

- [Riferimento della CLI](/it/cli)
- [Manuale operativo del Gateway](/it/gateway)
