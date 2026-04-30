---
read_when:
    - Esecuzione o debug del processo Gateway
summary: Runbook per il servizio Gateway, il ciclo di vita e le operazioni
title: Manuale operativo del Gateway
x-i18n:
    generated_at: "2026-04-30T08:52:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 14f3d288c426848bc176291ff084a2b63b00e81739cd02f31fdf517d230d8111
    source_path: gateway/index.md
    workflow: 16
---

Usa questa pagina per l'avvio del primo giorno e le operazioni del secondo giorno del servizio Gateway.

<CardGroup cols={2}>
  <Card title="Deep troubleshooting" icon="siren" href="/it/gateway/troubleshooting">
    Diagnostica basata sui sintomi con sequenze esatte di comandi e firme nei log.
  </Card>
  <Card title="Configuration" icon="sliders" href="/it/gateway/configuration">
    Guida alla configurazione orientata alle attività + riferimento completo alla configurazione.
  </Card>
  <Card title="Secrets management" icon="key-round" href="/it/gateway/secrets">
    Contratto SecretRef, comportamento degli snapshot a runtime e operazioni di migrazione/ricaricamento.
  </Card>
  <Card title="Secrets plan contract" icon="shield-check" href="/it/gateway/secrets-plan-contract">
    Regole esatte di destinazione/percorso per `secrets apply` e comportamento dei profili di autenticazione solo-ref.
  </Card>
</CardGroup>

## Avvio locale in 5 minuti

<Steps>
  <Step title="Start the Gateway">

```bash
openclaw gateway --port 18789
# debug/trace mirrored to stdio
openclaw gateway --port 18789 --verbose
# force-kill listener on selected port, then start
openclaw gateway --force
```

  </Step>

  <Step title="Verify service health">

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
```

Baseline integro: `Runtime: running`, `Connectivity probe: ok` e `Capability: ...` corrispondente a ciò che ti aspetti. Usa `openclaw gateway status --require-rpc` quando ti serve una prova RPC con ambito di lettura, non solo la raggiungibilità.

  </Step>

  <Step title="Validate channel readiness">

```bash
openclaw channels status --probe
```

Con un gateway raggiungibile, esegue probe live dei canali per account e audit opzionali.
Se il gateway non è raggiungibile, la CLI ricade invece su riepiloghi dei canali basati solo sulla configurazione
anziché sull'output dei probe live.

  </Step>
</Steps>

<Note>
Il ricaricamento della configurazione del Gateway osserva il percorso del file di configurazione attivo (risolto dai default di profilo/stato, o da `OPENCLAW_CONFIG_PATH` quando impostato).
La modalità predefinita è `gateway.reload.mode="hybrid"`.
Dopo il primo caricamento riuscito, il processo in esecuzione serve lo snapshot della configurazione attiva in memoria; un ricaricamento riuscito sostituisce quello snapshot in modo atomico.
</Note>

## Modello di runtime

- Un processo sempre attivo per routing, piano di controllo e connessioni dei canali.
- Singola porta multiplexata per:
  - Controllo/RPC WebSocket
  - API HTTP compatibili con OpenAI (`/v1/models`, `/v1/embeddings`, `/v1/chat/completions`, `/v1/responses`, `/tools/invoke`)
  - Control UI e hook
- Modalità di binding predefinita: `loopback`.
- L'autenticazione è richiesta per impostazione predefinita. Le configurazioni con segreto condiviso usano
  `gateway.auth.token` / `gateway.auth.password` (oppure
  `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`) e le configurazioni con reverse proxy
  non-loopback possono usare `gateway.auth.mode: "trusted-proxy"`.

## Endpoint compatibili con OpenAI

La superficie di compatibilità a più alto impatto di OpenClaw ora è:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`
- `POST /v1/responses`

Perché questo insieme è importante:

- La maggior parte delle integrazioni Open WebUI, LobeChat e LibreChat esegue prima il probe di `/v1/models`.
- Molte pipeline RAG e di memoria si aspettano `/v1/embeddings`.
- I client nativi per agenti preferiscono sempre più `/v1/responses`.

Nota di pianificazione:

- `/v1/models` è agent-first: restituisce `openclaw`, `openclaw/default` e `openclaw/<agentId>`.
- `openclaw/default` è l'alias stabile che punta sempre all'agente predefinito configurato.
- Usa `x-openclaw-model` quando vuoi sovrascrivere provider/modello di backend; altrimenti la normale configurazione di modello ed embedding dell'agente selezionato rimane in controllo.

Tutti questi endpoint vengono eseguiti sulla porta principale del Gateway e usano lo stesso confine di autenticazione per operatori attendibili del resto dell'API HTTP del Gateway.

### Precedenza di porta e binding

| Impostazione | Ordine di risoluzione |
| ------------ | ------------------------------------------------------------- |
| Porta Gateway | `--port` → `OPENCLAW_GATEWAY_PORT` → `gateway.port` → `18789` |
| Modalità di binding | CLI/override → `gateway.bind` → `loopback` |

I servizi gateway installati registrano il `--port` risolto nei metadati del supervisore. Dopo aver modificato `gateway.port`, esegui `openclaw doctor --fix` oppure `openclaw gateway install --force` affinché launchd/systemd/schtasks avvii il processo sulla nuova porta.

L'avvio del Gateway usa la stessa porta e lo stesso binding effettivi quando inizializza le origini locali
della Control UI per binding non-loopback. Per esempio, `--bind lan --port 3000`
inizializza `http://localhost:3000` e `http://127.0.0.1:3000` prima dell'esecuzione
della validazione a runtime. Aggiungi esplicitamente qualsiasi origine di browser remota, come URL proxy HTTPS, a
`gateway.controlUi.allowedOrigins`.

### Modalità di hot reload

| `gateway.reload.mode` | Comportamento |
| --------------------- | ------------------------------------------ |
| `off`                 | Nessun ricaricamento della configurazione |
| `hot`                 | Applica solo modifiche sicure per hot reload |
| `restart`             | Riavvia in caso di modifiche che richiedono ricaricamento |
| `hybrid` (predefinita) | Applica a caldo quando sicuro, riavvia quando richiesto |

## Set di comandi per operatori

```bash
openclaw gateway status
openclaw gateway status --deep   # adds a system-level service scan
openclaw gateway status --json
openclaw gateway install
openclaw gateway restart
openclaw gateway stop
openclaw secrets reload
openclaw logs --follow
openclaw doctor
```

`gateway status --deep` serve per l'individuazione aggiuntiva dei servizi (LaunchDaemons/unità systemd di sistema
/schtasks), non per un probe RPC di stato più approfondito.

## Gateway multipli (stesso host)

La maggior parte delle installazioni dovrebbe eseguire un solo gateway per macchina. Un singolo gateway può ospitare più
agenti e canali.

Ti servono più gateway solo quando vuoi intenzionalmente isolamento o un bot di soccorso.

Controlli utili:

```bash
openclaw gateway status --deep
openclaw gateway probe
```

Cosa aspettarsi:

- `gateway status --deep` può segnalare `Other gateway-like services detected (best effort)`
  e stampare suggerimenti di pulizia quando sono ancora presenti vecchie installazioni launchd/systemd/schtasks.
- `gateway probe` può avvisare di `multiple reachable gateways` quando risponde più di un target.
- Se è intenzionale, isola porte, configurazione/stato e radici workspace per ogni gateway.

Checklist per istanza:

- `gateway.port` univoca
- `OPENCLAW_CONFIG_PATH` univoco
- `OPENCLAW_STATE_DIR` univoco
- `agents.defaults.workspace` univoco

Esempio:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json OPENCLAW_STATE_DIR=~/.openclaw-a openclaw gateway --port 19001
OPENCLAW_CONFIG_PATH=~/.openclaw/b.json OPENCLAW_STATE_DIR=~/.openclaw-b openclaw gateway --port 19002
```

Configurazione dettagliata: [/gateway/multiple-gateways](/it/gateway/multiple-gateways).

## Endpoint brain in tempo reale di VoiceClaw

OpenClaw espone un endpoint WebSocket in tempo reale compatibile con VoiceClaw su
`/voiceclaw/realtime`. Usalo quando un client desktop VoiceClaw deve parlare
direttamente con un brain OpenClaw in tempo reale invece di passare attraverso un processo relay
separato.

L'endpoint usa Gemini Live per l'audio in tempo reale e chiama OpenClaw come
brain esponendo gli strumenti OpenClaw direttamente a Gemini Live. Le chiamate agli strumenti restituiscono un
risultato `working` immediato per mantenere reattivo il turno vocale, quindi OpenClaw
esegue lo strumento effettivo in modo asincrono e reinserisce il risultato nella
sessione live. Imposta `GEMINI_API_KEY` nell'ambiente del processo gateway. Se
l'autenticazione gateway è abilitata, il client desktop invia il token o la password del gateway
nel primo messaggio `session.config`.

L'accesso brain in tempo reale esegue comandi dell'agente OpenClaw autorizzati dal proprietario. Mantieni
`gateway.auth.mode: "none"` limitato a istanze di test solo loopback. Le connessioni brain
in tempo reale non locali richiedono l'autenticazione gateway.

Per un gateway di test isolato, esegui un'istanza separata con porta, configurazione
e stato propri:

```bash
OPENCLAW_CONFIG_PATH=/path/to/openclaw-realtime/openclaw.json \
OPENCLAW_STATE_DIR=/path/to/openclaw-realtime/state \
OPENCLAW_SKIP_CHANNELS=1 \
GEMINI_API_KEY=... \
openclaw gateway --port 19789
```

Poi configura VoiceClaw per usare:

```text
ws://127.0.0.1:19789/voiceclaw/realtime
```

## Accesso remoto

Preferito: Tailscale/VPN.
Fallback: tunnel SSH.

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

Poi connetti i client localmente a `ws://127.0.0.1:18789`.

<Warning>
I tunnel SSH non bypassano l'autenticazione gateway. Per l'autenticazione con segreto condiviso, i client devono comunque
inviare `token`/`password` anche attraverso il tunnel. Per le modalità con identità,
la richiesta deve comunque soddisfare quel percorso di autenticazione.
</Warning>

Vedi: [Gateway remoto](/it/gateway/remote), [Autenticazione](/it/gateway/authentication), [Tailscale](/it/gateway/tailscale).

## Supervisione e ciclo di vita del servizio

Usa esecuzioni supervisionate per un'affidabilità simile alla produzione.

<Tabs>
  <Tab title="macOS (launchd)">

```bash
openclaw gateway install
openclaw gateway status
openclaw gateway restart
openclaw gateway stop
```

Usa `openclaw gateway restart` per i riavvii. Non concatenare `openclaw gateway stop` e `openclaw gateway start`; su macOS, `gateway stop` disabilita intenzionalmente il LaunchAgent prima di arrestarlo.

Le etichette LaunchAgent sono `ai.openclaw.gateway` (predefinita) oppure `ai.openclaw.<profile>` (profilo con nome). `openclaw doctor` controlla e ripara la deriva della configurazione del servizio.

  </Tab>

  <Tab title="Linux (systemd user)">

```bash
openclaw gateway install
systemctl --user enable --now openclaw-gateway[-<profile>].service
openclaw gateway status
```

Per la persistenza dopo il logout, abilita lingering:

```bash
sudo loginctl enable-linger <user>
```

Esempio di unità utente manuale quando ti serve un percorso di installazione personalizzato:

```ini
[Unit]
Description=OpenClaw Gateway
After=network-online.target
Wants=network-online.target

[Service]
ExecStart=/usr/local/bin/openclaw gateway --port 18789
Restart=always
RestartSec=5
TimeoutStopSec=30
TimeoutStartSec=30
SuccessExitStatus=0 143
KillMode=control-group

[Install]
WantedBy=default.target
```

  </Tab>

  <Tab title="Windows (native)">

```powershell
openclaw gateway install
openclaw gateway status --json
openclaw gateway restart
openclaw gateway stop
```

L'avvio gestito nativo di Windows usa un'Attività pianificata denominata `OpenClaw Gateway`
(o `OpenClaw Gateway (<profile>)` per i profili con nome). Se la creazione dell'Attività pianificata
viene negata, OpenClaw ricade su un launcher nella cartella Esecuzione automatica per utente
che punta a `gateway.cmd` dentro la directory di stato.

  </Tab>

  <Tab title="Linux (system service)">

Usa un'unità di sistema per host multiutente/sempre attivi.

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now openclaw-gateway[-<profile>].service
```

Usa lo stesso corpo del servizio dell'unità utente, ma installalo sotto
`/etc/systemd/system/openclaw-gateway[-<profile>].service` e modifica
`ExecStart=` se il binario `openclaw` si trova altrove.

Non consentire anche a `openclaw doctor --fix` di installare un servizio gateway a livello utente per lo stesso profilo/porta. Doctor rifiuta quell'installazione automatica quando trova un servizio gateway OpenClaw a livello di sistema; usa `OPENCLAW_SERVICE_REPAIR_POLICY=external` quando l'unità di sistema possiede il ciclo di vita.

  </Tab>
</Tabs>

## Percorso rapido profilo dev

```bash
openclaw --dev setup
openclaw --dev gateway --allow-unconfigured
openclaw --dev status
```

I valori predefiniti includono stato/configurazione isolati e porta gateway base `19001`.

## Riferimento rapido del protocollo (vista operatore)

- Il primo frame del client deve essere `connect`.
- Il Gateway restituisce lo snapshot `hello-ok` (`presence`, `health`, `stateVersion`, `uptimeMs`, limiti/policy).
- `hello-ok.features.methods` / `events` sono un elenco di discovery conservativo, non
  un dump generato di ogni route helper invocabile.
- Richieste: `req(method, params)` → `res(ok/payload|error)`.
- Gli eventi comuni includono `connect.challenge`, `agent`, `chat`,
  `session.message`, `session.tool`, `sessions.changed`, `presence`, `tick`,
  `health`, `heartbeat`, eventi del ciclo di vita pairing/approvazione e `shutdown`.

Le esecuzioni degli agenti sono in due fasi:

1. Ack di accettazione immediato (`status:"accepted"`)
2. Risposta finale di completamento (`status:"ok"|"error"`), con eventi `agent` in streaming nel mezzo.

Vedi la documentazione completa del protocollo: [Protocollo Gateway](/it/gateway/protocol).

## Controlli operativi

### Liveness

- Apri WS e invia `connect`.
- Aspettati una risposta `hello-ok` con snapshot.

### Prontezza

```bash
openclaw gateway status
openclaw channels status --probe
openclaw health
```

### Recupero delle lacune

Gli eventi non vengono riprodotti. In caso di lacune nella sequenza, aggiorna lo stato (`health`, `system-presence`) prima di continuare.

## Firme di errore comuni

| Firma                                                          | Problema probabile                                                            |
| -------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `refusing to bind gateway ... without auth`                    | Bind non loopback senza un percorso di autenticazione Gateway valido          |
| `another gateway instance is already listening` / `EADDRINUSE` | Conflitto di porta                                                            |
| `Gateway start blocked: set gateway.mode=local`                | Configurazione impostata in modalità remota, oppure timbro della modalità locale mancante in una configurazione danneggiata |
| `unauthorized` durante connect                                | Mancata corrispondenza di autenticazione tra client e Gateway                 |

Per le procedure diagnostiche complete, usa [Risoluzione dei problemi del Gateway](/it/gateway/troubleshooting).

## Garanzie di sicurezza

- I client del protocollo Gateway falliscono rapidamente quando il Gateway non è disponibile (nessun fallback implicito al canale diretto).
- I primi frame non validi/non-connect vengono rifiutati e chiusi.
- Lo spegnimento ordinato emette l'evento `shutdown` prima della chiusura del socket.

---

Correlati:

- [Risoluzione dei problemi](/it/gateway/troubleshooting)
- [Processo in background](/it/gateway/background-process)
- [Configurazione](/it/gateway/configuration)
- [Salute](/it/gateway/health)
- [Doctor](/it/gateway/doctor)
- [Autenticazione](/it/gateway/authentication)

## Correlati

- [Configurazione](/it/gateway/configuration)
- [Risoluzione dei problemi del Gateway](/it/gateway/troubleshooting)
- [Accesso remoto](/it/gateway/remote)
- [Gestione dei segreti](/it/gateway/secrets)
