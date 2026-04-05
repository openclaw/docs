---
read_when:
    - Esecuzione o debug del processo gateway
summary: Runbook per il servizio Gateway, il ciclo di vita e le operazioni
title: Runbook del Gateway
x-i18n:
    generated_at: "2026-04-05T13:52:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0ec17674370de4e171779389c83580317308a4f07ebf335ad236a47238af18e1
    source_path: gateway/index.md
    workflow: 15
---

# Runbook del Gateway

Usa questa pagina per l'avvio iniziale e le operazioni continuative del servizio Gateway.

<CardGroup cols={2}>
  <Card title="Risoluzione avanzata dei problemi" icon="siren" href="/gateway/troubleshooting">
    Diagnostica orientata ai sintomi con sequenze esatte di comandi e firme dei log.
  </Card>
  <Card title="Configurazione" icon="sliders" href="/gateway/configuration">
    Guida all'impostazione orientata alle attività + riferimento completo della configurazione.
  </Card>
  <Card title="Gestione dei segreti" icon="key-round" href="/gateway/secrets">
    Contratto SecretRef, comportamento dello snapshot di runtime e operazioni di migrazione/ricaricamento.
  </Card>
  <Card title="Contratto del piano dei segreti" icon="shield-check" href="/gateway/secrets-plan-contract">
    Regole esatte di destinazione/percorso per `secrets apply` e comportamento dei profili di autenticazione solo-ref.
  </Card>
</CardGroup>

## Avvio locale in 5 minuti

<Steps>
  <Step title="Avvia il Gateway">

```bash
openclaw gateway --port 18789
# debug/trace rispecchiati su stdio
openclaw gateway --port 18789 --verbose
# termina forzatamente il listener sulla porta selezionata, poi avvia
openclaw gateway --force
```

  </Step>

  <Step title="Verifica lo stato di salute del servizio">

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
```

Baseline sana: `Runtime: running` e `RPC probe: ok`.

  </Step>

  <Step title="Convalida la disponibilità dei canali">

```bash
openclaw channels status --probe
```

Con un gateway raggiungibile, questo esegue probe live per account e audit facoltativi dei canali.
Se il gateway non è raggiungibile, la CLI torna a riepiloghi dei canali basati solo sulla configurazione
invece dell'output del probe live.

  </Step>
</Steps>

<Note>
Il ricaricamento della configurazione del Gateway osserva il percorso del file di configurazione attivo (risolto dai valori predefiniti di profilo/stato, oppure `OPENCLAW_CONFIG_PATH` se impostato).
La modalità predefinita è `gateway.reload.mode="hybrid"`.
Dopo il primo caricamento riuscito, il processo in esecuzione serve lo snapshot di configurazione attivo in memoria; un ricaricamento riuscito sostituisce tale snapshot in modo atomico.
</Note>

## Modello di runtime

- Un processo sempre attivo per routing, control plane e connessioni ai canali.
- Una singola porta multiplexata per:
  - control/RPC WebSocket
  - API HTTP, compatibili OpenAI (`/v1/models`, `/v1/embeddings`, `/v1/chat/completions`, `/v1/responses`, `/tools/invoke`)
  - UI di controllo e hook
- Modalità di bind predefinita: `loopback`.
- L'autenticazione è richiesta per impostazione predefinita. Le configurazioni con segreto condiviso usano
  `gateway.auth.token` / `gateway.auth.password` (oppure
  `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`), e le configurazioni
  reverse-proxy non loopback possono usare `gateway.auth.mode: "trusted-proxy"`.

## Endpoint compatibili OpenAI

La superficie di compatibilità a più alto impatto di OpenClaw è ora:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`
- `POST /v1/responses`

Perché questo insieme è importante:

- La maggior parte delle integrazioni con Open WebUI, LobeChat e LibreChat sonda prima `/v1/models`.
- Molte pipeline RAG e di memoria si aspettano `/v1/embeddings`.
- I client nativi per agenti preferiscono sempre più `/v1/responses`.

Nota di pianificazione:

- `/v1/models` è agent-first: restituisce `openclaw`, `openclaw/default` e `openclaw/<agentId>`.
- `openclaw/default` è l'alias stabile che punta sempre all'agente predefinito configurato.
- Usa `x-openclaw-model` quando vuoi un override di provider/modello backend; altrimenti restano in controllo il normale modello e la configurazione degli embedding dell'agente selezionato.

Tutti questi endpoint vengono eseguiti sulla porta principale del Gateway e usano lo stesso confine di autenticazione per operatore attendibile del resto dell'API HTTP del Gateway.

### Precedenza di porta e bind

| Impostazione | Ordine di risoluzione                                          |
| ------------ | -------------------------------------------------------------- |
| Porta Gateway | `--port` → `OPENCLAW_GATEWAY_PORT` → `gateway.port` → `18789` |
| Modalità bind | CLI/override → `gateway.bind` → `loopback`                    |

### Modalità di hot reload

| `gateway.reload.mode` | Comportamento                              |
| --------------------- | ------------------------------------------ |
| `off`                 | Nessun ricaricamento della configurazione  |
| `hot`                 | Applica solo modifiche sicure per hot reload |
| `restart`             | Riavvia per modifiche che richiedono reload |
| `hybrid` (predefinito) | Applica a caldo quando sicuro, riavvia quando richiesto |

## Set di comandi dell'operatore

```bash
openclaw gateway status
openclaw gateway status --deep   # aggiunge una scansione del servizio a livello di sistema
openclaw gateway status --json
openclaw gateway install
openclaw gateway restart
openclaw gateway stop
openclaw secrets reload
openclaw logs --follow
openclaw doctor
```

`gateway status --deep` serve per il rilevamento aggiuntivo dei servizi (unità di sistema LaunchDaemons/systemd/schtasks), non per un probe RPC di salute più approfondito.

## Più gateway (stesso host)

La maggior parte delle installazioni dovrebbe eseguire un gateway per macchina. Un singolo gateway può ospitare più
agenti e canali.

Hai bisogno di più gateway solo quando vuoi intenzionalmente isolamento o un bot di emergenza.

Controlli utili:

```bash
openclaw gateway status --deep
openclaw gateway probe
```

Cosa aspettarsi:

- `gateway status --deep` può segnalare `Other gateway-like services detected (best effort)`
  e stampare suggerimenti di pulizia quando sono ancora presenti installazioni launchd/systemd/schtasks obsolete.
- `gateway probe` può avvisare con `multiple reachable gateways` quando risponde più di una destinazione.
- Se è intenzionale, isola porte, configurazione/stato e radici del workspace per gateway.

Configurazione dettagliata: [/gateway/multiple-gateways](/gateway/multiple-gateways).

## Accesso remoto

Scelta preferita: Tailscale/VPN.
Fallback: tunnel SSH.

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

Quindi collega i client a `ws://127.0.0.1:18789` in locale.

<Warning>
I tunnel SSH non bypassano l'autenticazione del gateway. Per l'autenticazione con segreto condiviso, i client devono comunque
inviare `token`/`password` anche attraverso il tunnel. Per le modalità con identità,
la richiesta deve comunque soddisfare quel percorso di autenticazione.
</Warning>

Vedi: [Gateway remoto](/gateway/remote), [Autenticazione](/gateway/authentication), [Tailscale](/gateway/tailscale).

## Supervisione e ciclo di vita del servizio

Usa esecuzioni supervisionate per un'affidabilità di tipo produzione.

<Tabs>
  <Tab title="macOS (launchd)">

```bash
openclaw gateway install
openclaw gateway status
openclaw gateway restart
openclaw gateway stop
```

Le etichette LaunchAgent sono `ai.openclaw.gateway` (predefinita) o `ai.openclaw.<profile>` (profilo nominato). `openclaw doctor` verifica e corregge la deriva della configurazione del servizio.

  </Tab>

  <Tab title="Linux (systemd utente)">

```bash
openclaw gateway install
systemctl --user enable --now openclaw-gateway[-<profile>].service
openclaw gateway status
```

Per la persistenza dopo il logout, abilita lingering:

```bash
sudo loginctl enable-linger <user>
```

Esempio di unità utente manuale quando serve un percorso di installazione personalizzato:

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

  <Tab title="Windows (nativo)">

```powershell
openclaw gateway install
openclaw gateway status --json
openclaw gateway restart
openclaw gateway stop
```

L'avvio gestito nativo di Windows usa un'attività pianificata chiamata `OpenClaw Gateway`
(o `OpenClaw Gateway (<profile>)` per profili nominati). Se la creazione dell'attività pianificata
viene negata, OpenClaw usa come fallback un launcher per utente nella cartella Esecuzione automatica
che punta a `gateway.cmd` nella directory di stato.

  </Tab>

  <Tab title="Linux (servizio di sistema)">

Usa un'unità di sistema per host multiutente/sempre attivi.

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now openclaw-gateway[-<profile>].service
```

Usa lo stesso contenuto del servizio dell'unità utente, ma installalo in
`/etc/systemd/system/openclaw-gateway[-<profile>].service` e regola
`ExecStart=` se il tuo binario `openclaw` si trova altrove.

  </Tab>
</Tabs>

## Più gateway su un host

La maggior parte delle configurazioni dovrebbe eseguire **un** Gateway.
Usane più di uno solo per isolamento/ridondanza rigorosi (ad esempio un profilo di emergenza).

Checklist per istanza:

- `gateway.port` univoco
- `OPENCLAW_CONFIG_PATH` univoco
- `OPENCLAW_STATE_DIR` univoco
- `agents.defaults.workspace` univoco

Esempio:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json OPENCLAW_STATE_DIR=~/.openclaw-a openclaw gateway --port 19001
OPENCLAW_CONFIG_PATH=~/.openclaw/b.json OPENCLAW_STATE_DIR=~/.openclaw-b openclaw gateway --port 19002
```

Vedi: [Più gateway](/gateway/multiple-gateways).

### Percorso rapido per il profilo dev

```bash
openclaw --dev setup
openclaw --dev gateway --allow-unconfigured
openclaw --dev status
```

I valori predefiniti includono stato/configurazione isolati e porta base del gateway `19001`.

## Riferimento rapido del protocollo (vista operatore)

- Il primo frame client deve essere `connect`.
- Il Gateway restituisce uno snapshot `hello-ok` (`presence`, `health`, `stateVersion`, `uptimeMs`, limiti/policy).
- `hello-ok.features.methods` / `events` sono un elenco di rilevamento conservativo, non
  un dump generato di ogni route helper richiamabile.
- Richieste: `req(method, params)` → `res(ok/payload|error)`.
- Gli eventi comuni includono `connect.challenge`, `agent`, `chat`,
  `session.message`, `session.tool`, `sessions.changed`, `presence`, `tick`,
  `health`, `heartbeat`, eventi del ciclo di vita pairing/approval e `shutdown`.

Le esecuzioni dell'agente hanno due fasi:

1. Ack immediato di accettazione (`status:"accepted"`)
2. Risposta finale di completamento (`status:"ok"|"error"`), con eventi `agent` in streaming nel mezzo.

Vedi la documentazione completa del protocollo: [Protocollo Gateway](/gateway/protocol).

## Controlli operativi

### Liveness

- Apri WS e invia `connect`.
- Attendi una risposta `hello-ok` con snapshot.

### Readiness

```bash
openclaw gateway status
openclaw channels status --probe
openclaw health
```

### Recupero dei gap

Gli eventi non vengono ritrasmessi. In caso di gap di sequenza, aggiorna lo stato (`health`, `system-presence`) prima di continuare.

## Firme di errore comuni

| Firma                                                          | Problema probabile                                                               |
| -------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `refusing to bind gateway ... without auth`                    | Bind non loopback senza un percorso di autenticazione gateway valido             |
| `another gateway instance is already listening` / `EADDRINUSE` | Conflitto di porta                                                               |
| `Gateway start blocked: set gateway.mode=local`                | Configurazione impostata in modalità remota, oppure manca il marcatore di modalità locale in una configurazione danneggiata |
| `unauthorized` during connect                                  | Mancata corrispondenza dell'autenticazione tra client e gateway                  |

Per sequenze complete di diagnosi, usa [Risoluzione dei problemi del Gateway](/gateway/troubleshooting).

## Garanzie di sicurezza

- I client del protocollo Gateway falliscono rapidamente quando il Gateway non è disponibile (nessun fallback implicito diretto del canale).
- I primi frame non validi/non `connect` vengono rifiutati e la connessione viene chiusa.
- L'arresto graduale emette l'evento `shutdown` prima della chiusura del socket.

---

Correlati:

- [Risoluzione dei problemi](/gateway/troubleshooting)
- [Processo in background](/gateway/background-process)
- [Configurazione](/gateway/configuration)
- [Health](/gateway/health)
- [Doctor](/gateway/doctor)
- [Autenticazione](/gateway/authentication)
