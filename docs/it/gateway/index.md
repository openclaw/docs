---
read_when:
    - Esecuzione o debug del processo gateway
summary: Runbook per il servizio Gateway, il ciclo di vita e le operazioni
title: Runbook del Gateway
x-i18n:
    generated_at: "2026-04-07T08:13:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: fd2c21036e88612861ef2195b8ff7205aca31386bb11558614ade8d1a54fdebd
    source_path: gateway/index.md
    workflow: 15
---

# Runbook del gateway

Usa questa pagina per l'avvio del servizio Gateway il primo giorno e per le operazioni dal secondo giorno in poi.

<CardGroup cols={2}>
  <Card title="Risoluzione avanzata dei problemi" icon="siren" href="/it/gateway/troubleshooting">
    Diagnostica orientata ai sintomi con sequenze di comandi esatte e firme nei log.
  </Card>
  <Card title="Configurazione" icon="sliders" href="/it/gateway/configuration">
    Guida di configurazione orientata alle attività + riferimento completo della configurazione.
  </Card>
  <Card title="Gestione dei segreti" icon="key-round" href="/it/gateway/secrets">
    Contratto SecretRef, comportamento degli snapshot a runtime e operazioni di migrazione/ricarica.
  </Card>
  <Card title="Contratto del piano dei segreti" icon="shield-check" href="/it/gateway/secrets-plan-contract">
    Regole esatte per target/path di `secrets apply` e comportamento dei profili di autenticazione solo-ref.
  </Card>
</CardGroup>

## Avvio locale in 5 minuti

<Steps>
  <Step title="Avvia il Gateway">

```bash
openclaw gateway --port 18789
# debug/trace rispecchiati su stdio
openclaw gateway --port 18789 --verbose
# termina forzatamente il listener sulla porta selezionata, quindi avvia
openclaw gateway --force
```

  </Step>

  <Step title="Verifica lo stato del servizio">

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
```

Baseline di stato corretto: `Runtime: running` e `RPC probe: ok`.

  </Step>

  <Step title="Convalida la disponibilità dei canali">

```bash
openclaw channels status --probe
```

Con un gateway raggiungibile, questo esegue probe live per account dei canali e audit opzionali.
Se il gateway non è raggiungibile, la CLI torna a riepiloghi dei canali basati solo sulla configurazione invece
dell'output dei probe live.

  </Step>
</Steps>

<Note>
La ricarica della configurazione del Gateway osserva il percorso del file di configurazione attivo (risolto dai valori predefiniti del profilo/dello stato, oppure da `OPENCLAW_CONFIG_PATH` se impostato).
La modalità predefinita è `gateway.reload.mode="hybrid"`.
Dopo il primo caricamento riuscito, il processo in esecuzione serve lo snapshot di configurazione attivo in memoria; una ricarica riuscita sostituisce atomicamente quello snapshot.
</Note>

## Modello di runtime

- Un unico processo sempre attivo per routing, control plane e connessioni dei canali.
- Una singola porta multiplexata per:
  - control/RPC WebSocket
  - API HTTP, compatibili con OpenAI (`/v1/models`, `/v1/embeddings`, `/v1/chat/completions`, `/v1/responses`, `/tools/invoke`)
  - Control UI e hook
- Modalità di bind predefinita: `loopback`.
- L'autenticazione è richiesta per impostazione predefinita. Le configurazioni con segreto condiviso usano
  `gateway.auth.token` / `gateway.auth.password` (oppure
  `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`), e le configurazioni con reverse proxy
  non-loopback possono usare `gateway.auth.mode: "trusted-proxy"`.

## Endpoint compatibili con OpenAI

La superficie di compatibilità a più alto impatto di OpenClaw ora è:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`
- `POST /v1/responses`

Perché questo insieme è importante:

- La maggior parte delle integrazioni con Open WebUI, LobeChat e LibreChat esegue prima probe su `/v1/models`.
- Molte pipeline RAG e di memoria si aspettano `/v1/embeddings`.
- I client nativi per agenti preferiscono sempre più spesso `/v1/responses`.

Nota di pianificazione:

- `/v1/models` è agent-first: restituisce `openclaw`, `openclaw/default` e `openclaw/<agentId>`.
- `openclaw/default` è l'alias stabile che mappa sempre all'agente predefinito configurato.
- Usa `x-openclaw-model` quando vuoi un override del provider/modello di backend; altrimenti il normale modello e la configurazione degli embedding dell'agente selezionato restano in controllo.

Tutti questi endpoint vengono eseguiti sulla porta principale del Gateway e usano lo stesso confine di autenticazione dell'operatore attendibile del resto dell'API HTTP del Gateway.

### Precedenza di porta e bind

| Impostazione     | Ordine di risoluzione                                         |
| ---------------- | ------------------------------------------------------------- |
| Porta del Gateway | `--port` → `OPENCLAW_GATEWAY_PORT` → `gateway.port` → `18789` |
| Modalità bind    | CLI/override → `gateway.bind` → `loopback`                    |

### Modalità di hot reload

| `gateway.reload.mode` | Comportamento                              |
| --------------------- | ------------------------------------------ |
| `off`                 | Nessuna ricarica della configurazione      |
| `hot`                 | Applica solo modifiche sicure a caldo      |
| `restart`             | Riavvia quando le modifiche richiedono reload |
| `hybrid` (predefinita) | Applica a caldo quando sicuro, riavvia quando richiesto |

## Set di comandi per operatori

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

`gateway status --deep` serve per discovery aggiuntiva dei servizi (unità di sistema LaunchDaemons/systemd/schtasks), non per un probe RPC di stato più approfondito.

## Più gateway (stesso host)

La maggior parte delle installazioni dovrebbe eseguire un gateway per macchina. Un singolo gateway può ospitare più
agenti e canali.

Ti servono più gateway solo quando vuoi intenzionalmente isolamento oppure un bot di emergenza.

Controlli utili:

```bash
openclaw gateway status --deep
openclaw gateway probe
```

Cosa aspettarsi:

- `gateway status --deep` può segnalare `Other gateway-like services detected (best effort)`
  e stampare suggerimenti di pulizia quando sono ancora presenti installazioni stale di launchd/systemd/schtasks.
- `gateway probe` può avvisare con `multiple reachable gateways` quando risponde più di una destinazione.
- Se ciò è intenzionale, isola porte, config/stato e root del workspace per ciascun gateway.

Configurazione dettagliata: [/gateway/multiple-gateways](/it/gateway/multiple-gateways).

## Accesso remoto

Preferito: Tailscale/VPN.
Alternativa: tunnel SSH.

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

Poi collega i client localmente a `ws://127.0.0.1:18789`.

<Warning>
I tunnel SSH non aggirano l'autenticazione del gateway. Per l'autenticazione con segreto condiviso, i client devono comunque
inviare `token`/`password` anche attraverso il tunnel. Per le modalità con identità incorporata,
la richiesta deve comunque soddisfare quel percorso di autenticazione.
</Warning>

Vedi: [Gateway remoto](/it/gateway/remote), [Autenticazione](/it/gateway/authentication), [Tailscale](/it/gateway/tailscale).

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

Le etichette LaunchAgent sono `ai.openclaw.gateway` (predefinita) oppure `ai.openclaw.<profile>` (profilo con nome). `openclaw doctor` verifica e ripara la deriva della configurazione del servizio.

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

Esempio manuale di unità utente quando ti serve un percorso di installazione personalizzato:

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

L'avvio gestito nativo di Windows usa un'Attività pianificata chiamata `OpenClaw Gateway`
(o `OpenClaw Gateway (<profile>)` per i profili con nome). Se la creazione dell'Attività pianificata
viene negata, OpenClaw torna a un launcher per utente nella cartella Esecuzione automatica
che punta a `gateway.cmd` all'interno della directory di stato.

  </Tab>

  <Tab title="Linux (servizio di sistema)">

Usa un'unità di sistema per host multiutente/sempre attivi.

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now openclaw-gateway[-<profile>].service
```

Usa lo stesso corpo del servizio dell'unità utente, ma installalo sotto
`/etc/systemd/system/openclaw-gateway[-<profile>].service` e regola
`ExecStart=` se il tuo binario `openclaw` si trova altrove.

  </Tab>
</Tabs>

## Più gateway su un host

La maggior parte delle configurazioni dovrebbe eseguire **un** solo Gateway.
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

Vedi: [Più gateway](/it/gateway/multiple-gateways).

### Percorso rapido del profilo dev

```bash
openclaw --dev setup
openclaw --dev gateway --allow-unconfigured
openclaw --dev status
```

I valori predefiniti includono stato/config isolati e porta base del gateway `19001`.

## Riferimento rapido del protocollo (vista operatore)

- Il primo frame del client deve essere `connect`.
- Il Gateway restituisce uno snapshot `hello-ok` (`presence`, `health`, `stateVersion`, `uptimeMs`, limiti/policy).
- `hello-ok.features.methods` / `events` sono un elenco di discovery prudente, non
  un dump generato di ogni route helper richiamabile.
- Richieste: `req(method, params)` → `res(ok/payload|error)`.
- Gli eventi comuni includono `connect.challenge`, `agent`, `chat`,
  `session.message`, `session.tool`, `sessions.changed`, `presence`, `tick`,
  `health`, `heartbeat`, eventi del ciclo di vita pairing/approval e `shutdown`.

Le esecuzioni degli agenti sono in due fasi:

1. Ack di accettazione immediata (`status:"accepted"`)
2. Risposta finale di completamento (`status:"ok"|"error"`), con eventi `agent` in streaming nel mezzo.

Vedi la documentazione completa del protocollo: [Protocollo Gateway](/it/gateway/protocol).

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

Gli eventi non vengono riprodotti. In caso di gap di sequenza, aggiorna lo stato (`health`, `system-presence`) prima di continuare.

## Firme di errore comuni

| Firma                                                         | Problema probabile                                                               |
| ------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `refusing to bind gateway ... without auth`                   | Bind non-loopback senza un percorso di autenticazione del gateway valido         |
| `another gateway instance is already listening` / `EADDRINUSE` | Conflitto di porta                                                               |
| `Gateway start blocked: set gateway.mode=local`               | Config impostata in modalità remota, oppure stamp di modalità locale mancante in una config danneggiata |
| `unauthorized` during connect                                 | Mancata corrispondenza dell'autenticazione tra client e gateway                 |

Per sequenze complete di diagnosi, usa [Risoluzione dei problemi del Gateway](/it/gateway/troubleshooting).

## Garanzie di sicurezza

- I client del protocollo Gateway falliscono rapidamente quando il Gateway non è disponibile (nessun fallback implicito diretto al canale).
- I first frame non validi/non-connect vengono rifiutati e la connessione viene chiusa.
- Lo shutdown ordinato emette l'evento `shutdown` prima della chiusura del socket.

---

Correlati:

- [Risoluzione dei problemi](/it/gateway/troubleshooting)
- [Processo in background](/it/gateway/background-process)
- [Configurazione](/it/gateway/configuration)
- [Health](/it/gateway/health)
- [Doctor](/it/gateway/doctor)
- [Autenticazione](/it/gateway/authentication)
