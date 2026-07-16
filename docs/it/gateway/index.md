---
read_when:
    - Esecuzione o debug del processo Gateway
summary: Runbook per il servizio Gateway, il ciclo di vita e le operazioni
title: Runbook del Gateway
x-i18n:
    generated_at: "2026-07-16T14:24:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: d8b50b6041905c321887ea0f579f8d4c3b74552b2b72c37ec655e43a53dfc130
    source_path: gateway/index.md
    workflow: 16
---

Usare questa pagina per l'avvio iniziale e le operazioni successive del servizio Gateway.

<CardGroup cols={2}>
  <Card title="Risoluzione avanzata dei problemi" icon="siren" href="/it/gateway/troubleshooting">
    Diagnostica basata innanzitutto sui sintomi, con sequenze esatte di comandi e firme dei log.
  </Card>
  <Card title="Configurazione" icon="sliders" href="/it/gateway/configuration">
    Guida alla configurazione orientata alle attività e riferimento completo della configurazione.
  </Card>
  <Card title="Gestione dei segreti" icon="key-round" href="/it/gateway/secrets">
    Contratto SecretRef, comportamento degli snapshot di runtime e operazioni di migrazione/ricaricamento.
  </Card>
  <Card title="Contratto del piano dei segreti" icon="shield-check" href="/it/gateway/secrets-plan-contract">
    Regole esatte di destinazione/percorso `secrets apply` e comportamento dei profili di autenticazione basati solo su riferimenti.
  </Card>
</CardGroup>

## Avvio locale in 5 minuti

<Steps>
  <Step title="Avviare il Gateway">

```bash
openclaw gateway --port 18789
# debug/trace replicati su stdio
openclaw gateway --port 18789 --verbose
# terminare forzatamente il listener sulla porta selezionata, quindi avviare
openclaw gateway --force
```

  </Step>

  <Step title="Verificare lo stato del servizio">

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
```

Stato di riferimento corretto: `Runtime: running`, `Connectivity probe: ok` e una riga `Capability` corrispondente alle aspettative. Usare `openclaw gateway status --require-rpc` per verificare l'RPC con ambito di lettura, non soltanto la raggiungibilità.

  </Step>

  <Step title="Convalidare la disponibilità dei canali">

```bash
openclaw channels status --probe
```

Con un Gateway raggiungibile, questo comando esegue sonde live dei canali per ciascun account ed eventuali controlli facoltativi. Se il Gateway non è raggiungibile, la CLI ripiega su riepiloghi dei canali basati esclusivamente sulla configurazione.

  </Step>
</Steps>

<Note>
Il ricaricamento della configurazione del Gateway monitora il percorso del file di configurazione attivo, risolto dai valori predefiniti del profilo/stato oppure da `OPENCLAW_CONFIG_PATH`, se impostato. La modalità predefinita è `gateway.reload.mode="hybrid"`. Dopo il primo caricamento riuscito, il processo in esecuzione usa lo snapshot attivo della configurazione in memoria; un ricaricamento riuscito sostituisce atomicamente tale snapshot.
</Note>

## Modello di runtime

- Un unico processo sempre attivo per instradamento, piano di controllo e connessioni ai canali.
- Un'unica porta multiplex per:
  - Controllo/RPC WebSocket
  - API HTTP (`/v1/models`, `/v1/embeddings`, `/v1/chat/completions`, `/v1/responses`, `/tools/invoke`)
  - Route HTTP dei Plugin, come l'opzione `/api/v1/admin/rpc`
  - Control UI e hook
- Modalità di associazione predefinita: `loopback`. All'interno di un ambiente container rilevato, il valore predefinito effettivo è `auto` (risolto in `0.0.0.0` per l'inoltro delle porte), a meno che Tailscale serve/funnel non sia attivo, nel qual caso viene sempre imposto `loopback`.
- L'autenticazione è obbligatoria per impostazione predefinita. Le configurazioni con segreto condiviso usano `gateway.auth.token` / `gateway.auth.password` (oppure `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`), mentre le configurazioni con proxy inverso non loopback possono usare `gateway.auth.mode: "trusted-proxy"`.

## Endpoint compatibili con OpenAI

La superficie di compatibilità a maggior impatto di OpenClaw:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`
- `POST /v1/responses`

Perché questo insieme è importante:

- La maggior parte delle integrazioni Open WebUI, LobeChat e LibreChat verifica prima `/v1/models`.
- Molte pipeline RAG e di memoria richiedono `/v1/embeddings`.
- I client progettati nativamente per gli agenti preferiscono sempre più spesso `/v1/responses`.

`/v1/models` è progettato innanzitutto per gli agenti: restituisce `openclaw`, `openclaw/default` e `openclaw/<agentId>` per ogni agente configurato. `openclaw/default` è l'alias stabile associato sempre all'agente predefinito configurato. Inviare `x-openclaw-model` per sostituire provider/modello del backend; in caso contrario, restano attive le normali impostazioni del modello e degli embedding dell'agente selezionato.

Tutti questi endpoint vengono eseguiti sulla porta principale del Gateway e usano lo stesso confine di autenticazione attendibile dell'operatore del resto dell'API HTTP del Gateway.

L'RPC HTTP amministrativo (`POST /api/v1/admin/rpc`) è una route Plugin distinta, disattivata per impostazione predefinita, destinata agli strumenti host che non possono usare l'RPC WebSocket. Consultare [RPC HTTP amministrativo](/it/plugins/admin-http-rpc).

### Precedenza di porta e associazione

| Impostazione   | Ordine di risoluzione                                                  |
| -------------- | ---------------------------------------------------------------------- |
| Porta Gateway  | `--port` → `OPENCLAW_GATEWAY_PORT` → `gateway.port` → `18789`        |
| Modalità di associazione | CLI/override → `gateway.bind` → `loopback` (oppure `auto` nei container) |

I servizi Gateway installati registrano il valore `--port` risolto nei metadati del supervisore. Dopo aver modificato `gateway.port`, eseguire `openclaw doctor --fix` o `openclaw gateway install --force` affinché launchd/systemd/schtasks avvii il processo sulla nuova porta.

All'avvio, il Gateway usa la stessa porta e associazione effettive quando inizializza le origini locali della Control UI per le associazioni non loopback. Ad esempio, `--bind lan --port 3000` inizializza `http://localhost:3000` e `http://127.0.0.1:3000` prima dell'esecuzione della convalida di runtime. Aggiungere esplicitamente a `gateway.controlUi.allowedOrigins` tutte le origini dei browser remoti, ad esempio gli URL dei proxy HTTPS.

### Modalità di ricaricamento a caldo

| `gateway.reload.mode` | Comportamento                              |
| --------------------- | ------------------------------------------ |
| `off`                 | Nessun ricaricamento della configurazione  |
| `hot`                 | Applica solo le modifiche sicure a caldo   |
| `restart`             | Riavvia per le modifiche che lo richiedono |
| `hybrid` (predefinita) | Applica a caldo quando è sicuro, riavvia quando necessario |

## Insieme di comandi per l'operatore

```bash
openclaw gateway status
openclaw gateway status --deep   # aggiunge una scansione dei servizi a livello di sistema
openclaw gateway status --json
openclaw gateway install
openclaw gateway restart
openclaw gateway stop
openclaw secrets reload
openclaw logs --follow
openclaw doctor
```

`gateway status --deep` serve per il rilevamento aggiuntivo dei servizi (LaunchDaemon/unità di sistema systemd/schtasks), non per una verifica più approfondita dello stato RPC.

## Più Gateway sullo stesso host

Nella maggior parte delle installazioni è opportuno eseguire un solo Gateway per macchina. Un singolo Gateway può ospitare più agenti e canali. Sono necessari più Gateway solo quando si desidera intenzionalmente l'isolamento o un bot di emergenza.

Controlli utili:

```bash
openclaw gateway status --deep
openclaw gateway probe
```

Cosa aspettarsi:

- `gateway status --deep` può segnalare `Other gateway-like services detected (best effort)` e mostrare suggerimenti per la pulizia quando sono ancora presenti installazioni launchd/systemd/schtasks obsolete.
- `gateway probe` può avvisare della presenza di `multiple reachable gateway identities` quando rispondono Gateway distinti o quando OpenClaw non può dimostrare che le destinazioni raggiungibili corrispondano allo stesso Gateway. Un tunnel SSH, un URL proxy o un URL remoto configurato verso lo stesso Gateway rappresenta un unico Gateway con più trasporti, anche quando le porte di trasporto sono diverse.
- Se è intenzionale, isolare porte, configurazione/stato e directory radice degli spazi di lavoro per ciascun Gateway.

Lista di controllo per ogni istanza:

- `gateway.port` univoco
- `OPENCLAW_CONFIG_PATH` univoco
- `OPENCLAW_STATE_DIR` univoco
- `agents.defaults.workspace` univoco

Esempio:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json OPENCLAW_STATE_DIR=~/.openclaw-a openclaw gateway --port 19001
OPENCLAW_CONFIG_PATH=~/.openclaw/b.json OPENCLAW_STATE_DIR=~/.openclaw-b openclaw gateway --port 19002
```

Configurazione dettagliata: [/gateway/multiple-gateways](/it/gateway/multiple-gateways).

## Accesso remoto

Opzione preferita: Tailscale/VPN.
Alternativa: tunnel SSH.

```bash
ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
```

Collegare quindi i client localmente a `ws://127.0.0.1:18789`.

<Warning>
I tunnel SSH non aggirano l'autenticazione del Gateway. Per l'autenticazione con segreto condiviso, i client devono comunque
inviare `token`/`password` anche attraverso il tunnel. Per le modalità basate sull'identità,
la richiesta deve comunque soddisfare il relativo percorso di autenticazione.
</Warning>

Consultare: [Gateway remoto](/it/gateway/remote), [Autenticazione](/it/gateway/authentication), [Tailscale](/it/gateway/tailscale).

## Supervisione e ciclo di vita del servizio

Per un'affidabilità adatta ad ambienti simili alla produzione, usare esecuzioni supervisionate.

<Tabs>
  <Tab title="macOS (launchd)">

```bash
openclaw gateway install
openclaw gateway status
openclaw gateway restart
openclaw gateway stop
```

Usare `openclaw gateway restart` per i riavvii. Non concatenare `openclaw gateway stop` e `openclaw gateway start` come sostituto del riavvio.

Su macOS, `gateway stop` usa `launchctl bootout` per impostazione predefinita. In questo modo il LaunchAgent viene rimosso dalla sessione di avvio corrente senza rendere persistente la disabilitazione, così il ripristino automatico tramite KeepAlive continua a funzionare dopo arresti anomali imprevisti e `gateway start` lo riattiva correttamente. Per impedire in modo persistente il riavvio automatico anche dopo il riavvio del sistema, passare `--disable`: `openclaw gateway stop --disable`.

Le etichette LaunchAgent sono `ai.openclaw.gateway` (predefinita) o `ai.openclaw.<profile>` (profilo denominato). `openclaw doctor` controlla e corregge le divergenze nella configurazione del servizio.

  </Tab>

  <Tab title="Linux (systemd utente)">

```bash
openclaw gateway install
systemctl --user enable --now openclaw-gateway[-<profile>].service
openclaw gateway status
```

Per mantenere il servizio attivo dopo la disconnessione, abilitare il lingering:

```bash
sudo loginctl enable-linger $(whoami)
```

Su un server headless senza sessione desktop, assicurarsi inoltre che `XDG_RUNTIME_DIR` sia impostato (`export XDG_RUNTIME_DIR=/run/user/$(id -u)`) prima di riprovare i comandi `systemctl --user`.

Esempio di unità utente manuale quando è necessario un percorso di installazione personalizzato:

```ini
[Unit]
Description=OpenClaw Gateway
After=network-online.target
Wants=network-online.target
StartLimitBurst=5
StartLimitIntervalSec=60

[Service]
ExecStart=/usr/local/bin/openclaw gateway --port 18789
Restart=always
RestartSec=5
RestartPreventExitStatus=78
TimeoutStopSec=30
TimeoutStartSec=30
SuccessExitStatus=0 143
OOMPolicy=continue
KillMode=control-group

[Install]
WantedBy=default.target
```

  </Tab>

  <Tab title="Windows (nativo)">

```powershell
openclaw gateway install
openclaw gateway status --json
openclaw gateway restart
openclaw gateway stop
```

L'avvio gestito nativo di Windows usa un'attività pianificata denominata `OpenClaw Gateway`
(o `OpenClaw Gateway (<profile>)` per i profili denominati). Se la creazione dell'attività pianificata
viene negata, OpenClaw ripiega su un programma di avvio nella cartella Esecuzione automatica dell'utente
che punta a `gateway.cmd` nella directory di stato.

  </Tab>

  <Tab title="Linux (servizio di sistema)">

Usare un'unità di sistema per gli host multiutente o sempre attivi.

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now openclaw-gateway[-<profile>].service
```

Usare la stessa definizione del servizio dell'unità utente, ma installarla in
`/etc/systemd/system/openclaw-gateway[-<profile>].service` e modificare
`ExecStart=` se il file binario `openclaw` si trova altrove.

Non consentire anche a `openclaw doctor --fix` di installare un servizio Gateway a livello utente per lo stesso profilo/porta. Doctor rifiuta tale installazione automatica quando rileva un servizio Gateway OpenClaw a livello di sistema; usare `OPENCLAW_SERVICE_REPAIR_POLICY=external` quando l'unità di sistema gestisce il ciclo di vita.

  </Tab>
</Tabs>

Gli errori di configurazione non valida terminano con il codice `78`. Le unità systemd Linux usano `RestartPreventExitStatus=78` per interrompere i riavvii finché la configurazione non viene corretta. launchd e l'Utilità di pianificazione di Windows non dispongono di una regola equivalente per interrompersi in base al codice di uscita; pertanto il Gateway conserva anche la cronologia degli avvii rapidi terminati in modo anomalo e impedisce l'avvio automatico degli account di canali/provider dopo ripetuti errori di avvio. In questa modalità sicura, il piano di controllo continua ad avviarsi per consentire ispezione e riparazione, i ricaricamenti a caldo della configurazione e `secrets.reload` rifiutano i riavvii automatici dei canali, mentre una richiesta esplicita dell'operatore `channels.start` può ignorare il blocco.

## Percorso rapido per il profilo di sviluppo

```bash
openclaw --dev setup
openclaw --dev gateway --allow-unconfigured
openclaw --dev status
```

I valori predefiniti includono stato/configurazione isolati e la porta Gateway di base `19001`.

## Riferimento rapido del protocollo (prospettiva dell'operatore)

- Il primo frame del client deve essere `connect`.
- Il Gateway restituisce un frame `hello-ok` con un `snapshot` (`presence`, `health`, `stateVersion`, `uptimeMs`) più i limiti `policy` (`maxPayload`, `maxBufferedBytes`, `tickIntervalMs`).
- `hello-ok.features.methods` / `events` sono un elenco di rilevamento prudenziale, non
  un dump generato di ogni route helper richiamabile.
- Richieste: `req(method, params)` → `res(ok/payload|error)`.
- Gli eventi comuni includono `connect.challenge`, `agent`, `chat`,
  `session.message`, `session.operation`, `session.tool`, gli eventi facoltativi
  `session.approval`, `sessions.changed`, `presence`, `tick`, `health`,
  `heartbeat`, gli eventi del ciclo di vita di associazione/approvazione e `shutdown`.

Le esecuzioni dell'agente avvengono in due fasi:

1. Conferma immediata di accettazione (`status:"accepted"`)
2. Risposta finale di completamento (`status:"ok"|"error"`), con eventi `agent` trasmessi in streaming nel frattempo.

Consultare la documentazione completa del protocollo: [Protocollo del Gateway](/it/gateway/protocol).

## Controlli operativi

### Operatività

- Aprire WS e inviare `connect`.
- Attendere una risposta `hello-ok` con snapshot.

### Disponibilità

```bash
openclaw gateway status
openclaw channels status --probe
openclaw health
```

### Recupero delle lacune

Gli eventi non vengono riprodotti. In caso di lacune nella sequenza, aggiornare lo stato (`health`, `system-presence`) prima di continuare.

## Segnali di errore comuni

| Segnale                                                        | Problema probabile                                                            |
| -------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `refusing to bind gateway ... without auth`                    | Binding non loopback senza un percorso di autenticazione del Gateway valido   |
| `another gateway instance is already listening` / `EADDRINUSE` | Conflitto di porta                                                            |
| `Gateway start blocked: set gateway.mode=local`                | Configurazione impostata sulla modalità remota oppure `gateway.mode` mancante da una configurazione danneggiata |
| `unauthorized` durante la connessione                           | Mancata corrispondenza dell'autenticazione tra client e Gateway                |

Per le procedure diagnostiche complete, consultare [Risoluzione dei problemi del Gateway](/it/gateway/troubleshooting).

## Garanzie di sicurezza

- I client del protocollo Gateway terminano immediatamente con errore quando il Gateway non è disponibile (nessun fallback implicito al canale diretto).
- I primi frame non validi o diversi da quelli di connessione vengono rifiutati e chiusi.
- L'arresto controllato emette l'evento `shutdown` prima della chiusura del socket.

## Argomenti correlati

- [Configurazione](/it/gateway/configuration)
- [Risoluzione dei problemi del Gateway](/it/gateway/troubleshooting)
- [Processo in background](/it/gateway/background-process)
- [Stato di integrità](/it/gateway/health)
- [Doctor](/it/gateway/doctor)
- [Autenticazione](/it/gateway/authentication)
- [Accesso remoto](/it/gateway/remote)
- [Gestione dei segreti](/it/gateway/secrets)
