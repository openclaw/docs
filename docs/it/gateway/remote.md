---
read_when:
    - Eseguire o risolvere configurazioni di gateway remote
summary: Accesso remoto tramite tunnel SSH (Gateway WS) e tailnet
title: Accesso remoto
x-i18n:
  refreshed_at: '2026-04-28T04:45:00Z'
    generated_at: "2026-04-26T11:29:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 208f0e6a4dbb342df878ea99d70606327efdfd3df36b07dfa3e68aafcae98e5c
    source_path: gateway/remote.md
    workflow: 15
---

Questo repo supporta il modello “remoto tramite SSH” mantenendo un unico Gateway (il master) in esecuzione su un host dedicato (desktop/server) e collegando a esso i client.

- Per gli **operatori (tu / l'app macOS)**: il tunneling SSH è il fallback universale.
- Per i **node (iOS/Android e dispositivi futuri)**: collegati al **WebSocket** del Gateway (LAN/tailnet o tunnel SSH secondo necessità).

## L'idea di base

- Il WebSocket del Gateway fa bind su **loopback** sulla porta configurata (predefinita 18789).
- Per uso remoto, inoltri quella porta loopback tramite SSH (oppure usi una tailnet/VPN e riduci l'uso dei tunnel).

## Configurazioni comuni VPN/tailnet (dove vive l'agente)

Pensa all'**host del Gateway** come al luogo “dove vive l'agente”. Possiede sessioni, profili auth, canali e stato.
Il tuo laptop/desktop (e i node) si collegano a quell'host.

### 1) Gateway sempre attivo nella tua tailnet (VPS o server domestico)

Esegui il Gateway su un host persistente e raggiungilo tramite **Tailscale** o SSH.

- **Migliore UX:** mantieni `gateway.bind: "loopback"` e usa **Tailscale Serve** per la Control UI.
- **Fallback:** mantieni loopback + tunnel SSH da qualunque macchina abbia bisogno di accesso.
- **Esempi:** [exe.dev](/it/install/exe-dev) (VM semplice) oppure [Hetzner](/it/install/hetzner) (VPS di produzione).

È l'ideale quando il tuo laptop va spesso in stop ma vuoi che l'agente resti sempre attivo.

### 2) Il desktop di casa esegue il Gateway, il laptop è il controllo remoto

Il laptop **non** esegue l'agente. Si collega da remoto:

- Usa la modalità **Remote over SSH** dell'app macOS (Impostazioni → Generale → “OpenClaw runs”).
- L'app apre e gestisce il tunnel, quindi WebChat + controlli health “funzionano semplicemente”.

Runbook: [accesso remoto macOS](/it/platforms/mac/remote).

### 3) Il laptop esegue il Gateway, accesso remoto da altre macchine

Mantieni il Gateway locale ma esponilo in modo sicuro:

- tunnel SSH verso il laptop da altre macchine, oppure
- Tailscale Serve della Control UI mantenendo il Gateway solo loopback.

Guida: [Tailscale](/it/gateway/tailscale) e [Panoramica web](/it/web).

## Flusso dei comandi (cosa viene eseguito e dove)

Un solo servizio gateway possiede stato + canali. I node sono periferiche.

Esempio di flusso (Telegram → node):

- Un messaggio Telegram arriva al **Gateway**.
- Il Gateway esegue l'**agente** e decide se chiamare uno strumento node.
- Il Gateway chiama il **node** tramite il WebSocket del Gateway (`node.*` RPC).
- Il node restituisce il risultato; il Gateway risponde di nuovo su Telegram.

Note:

- **I node non eseguono il servizio gateway.** Su ogni host dovrebbe essere in esecuzione un solo gateway, a meno che tu non stia intenzionalmente eseguendo profili isolati (vedi [Gateway multipli](/it/gateway/multiple-gateways)).
- La “modalità node” dell'app macOS è solo un client node tramite il WebSocket del Gateway.

## Tunnel SSH (CLI + strumenti)

Crea un tunnel locale verso il Gateway WS remoto:

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

Con il tunnel attivo:

- `openclaw health` e `openclaw status --deep` raggiungono ora il gateway remoto tramite `ws://127.0.0.1:18789`.
- Anche `openclaw gateway status`, `openclaw gateway health`, `openclaw gateway probe` e `openclaw gateway call` possono puntare all'URL inoltrato tramite `--url` quando necessario.

Nota: sostituisci `18789` con il tuo `gateway.port` configurato (oppure `--port`/`OPENCLAW_GATEWAY_PORT`).
Nota: quando passi `--url`, la CLI non usa fallback alle credenziali di configurazione o ambiente.
Includi esplicitamente `--token` oppure `--password`. L'assenza di credenziali esplicite è un errore.

## Valori predefiniti remoti della CLI

Puoi rendere persistente un target remoto così i comandi CLI lo usano per impostazione predefinita:

```json5
{
  gateway: {
    mode: "remote",
    remote: {
      url: "ws://127.0.0.1:18789",
      token: "your-token",
    },
  },
}
```

Quando il gateway è solo loopback, mantieni l'URL su `ws://127.0.0.1:18789` e apri prima il tunnel SSH.
Nel trasporto tunnel SSH dell'app macOS, i nomi host del gateway rilevati appartengono a
`gateway.remote.sshTarget`; `gateway.remote.url` resta l'URL del tunnel locale.

## Precedenza delle credenziali

La risoluzione delle credenziali del Gateway segue un unico contratto condiviso tra percorsi call/probe/status e monitoraggio dell'approvazione exec di Discord. Node-host usa lo stesso contratto di base con un'eccezione in modalità locale (ignora intenzionalmente `gateway.remote.*`):

- Le credenziali esplicite (`--token`, `--password` o lo strumento `gatewayToken`) hanno sempre la precedenza nei percorsi call che accettano auth esplicita.
- Sicurezza degli override URL:
  - Gli override URL della CLI (`--url`) non riusano mai credenziali implicite di config/env.
  - Gli override URL env (`OPENCLAW_GATEWAY_URL`) possono usare solo credenziali env (`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`).
- Valori predefiniti in modalità locale:
  - token: `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token` -> `gateway.remote.token` (il fallback remoto si applica solo quando l'input del token auth locale non è impostato)
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.auth.password` -> `gateway.remote.password` (il fallback remoto si applica solo quando l'input della password auth locale non è impostato)
- Valori predefiniti in modalità remota:
  - token: `gateway.remote.token` -> `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token`
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.remote.password` -> `gateway.auth.password`
- Eccezione node-host in modalità locale: `gateway.remote.token` / `gateway.remote.password` vengono ignorati.
- I controlli del token per probe/status remoti sono severi per impostazione predefinita: usano solo `gateway.remote.token` (nessun fallback al token locale) quando puntano alla modalità remota.
- Gli override env del Gateway usano solo `OPENCLAW_GATEWAY_*`.

## UI chat tramite SSH

WebChat non usa più una porta HTTP separata. La UI chat SwiftUI si collega direttamente al WebSocket del Gateway.

- Inoltra `18789` tramite SSH (vedi sopra), poi collega i client a `ws://127.0.0.1:18789`.
- Su macOS, preferisci la modalità “Remote over SSH” dell'app, che gestisce automaticamente il tunnel.

## App macOS "Remote over SSH"

L'app macOS nella barra dei menu può gestire la stessa configurazione end-to-end (controlli di stato remoti, WebChat e inoltro Voice Wake).

Runbook: [accesso remoto macOS](/it/platforms/mac/remote).

## Regole di sicurezza (remoto/VPN)

In breve: **mantieni il Gateway solo loopback** a meno che tu non sia sicuro di avere bisogno di un bind.

- **Loopback + SSH/Tailscale Serve** è il valore predefinito più sicuro (nessuna esposizione pubblica).
- `ws://` in chiaro è consentito per impostazione predefinita solo su loopback. Per reti private fidate,
  imposta `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` sul processo client come
  soluzione di emergenza. Non esiste un equivalente in `openclaw.json`; deve essere
  una variabile d'ambiente del processo client che effettua la connessione WebSocket.
- I **bind non-loopback** (`lan`/`tailnet`/`custom`, oppure `auto` quando loopback non è disponibile) devono usare auth del gateway: token, password o un reverse proxy identity-aware con `gateway.auth.mode: "trusted-proxy"`.
- `gateway.remote.token` / `.password` sono fonti di credenziali client. **Non** configurano da soli l'auth del server.
- I percorsi di chiamata locali possono usare `gateway.remote.*` come fallback solo quando `gateway.auth.*` non è impostato.
- Se `gateway.auth.token` / `gateway.auth.password` è configurato esplicitamente tramite SecretRef e non risolto, la risoluzione fallisce in modalità fail closed (nessun fallback remoto che mascheri il problema).
- `gateway.remote.tlsFingerprint` fissa il certificato TLS remoto quando si usa `wss://`.
- **Tailscale Serve** può autenticare il traffico di Control UI/WebSocket tramite header di identità quando `gateway.auth.allowTailscale: true`; gli endpoint HTTP API non usano questa auth Tailscale basata su header e seguono invece la normale modalità di auth HTTP del gateway. Questo flusso senza token presuppone che l'host del gateway sia affidabile. Impostalo su `false` se vuoi auth con segreto condiviso ovunque.
- L'auth **trusted-proxy** è pensata solo per configurazioni non-loopback con proxy identity-aware.
  I reverse proxy loopback sullo stesso host non soddisfano `gateway.auth.mode: "trusted-proxy"`.
- Tratta il controllo del browser come accesso operatore: solo tailnet + pairing node deliberato.

Approfondimento: [Sicurezza](/it/gateway/security).

### macOS: tunnel SSH persistente tramite LaunchAgent

Per i client macOS che si collegano a un gateway remoto, la configurazione persistente più semplice usa una voce SSH `LocalForward` più un LaunchAgent per mantenere attivo il tunnel tra riavvii e crash.

#### Passaggio 1: aggiungi la configurazione SSH

Modifica `~/.ssh/config`:

```ssh
Host remote-gateway
    HostName <REMOTE_IP>
    User <REMOTE_USER>
    LocalForward 18789 127.0.0.1:18789
    IdentityFile ~/.ssh/id_rsa
```

Sostituisci `<REMOTE_IP>` e `<REMOTE_USER>` con i tuoi valori.

#### Passaggio 2: copia la chiave SSH (una sola volta)

```bash
ssh-copy-id -i ~/.ssh/id_rsa <REMOTE_USER>@<REMOTE_IP>
```

#### Passaggio 3: configura il token del gateway

Memorizza il token nella configurazione così persiste tra i riavvii:

```bash
openclaw config set gateway.remote.token "<your-token>"
```

#### Passaggio 4: crea il LaunchAgent

Salva questo file come `~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>ai.openclaw.ssh-tunnel</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/bin/ssh</string>
        <string>-N</string>
        <string>remote-gateway</string>
    </array>
    <key>KeepAlive</key>
    <true/>
    <key>RunAtLoad</key>
    <true/>
</dict>
</plist>
```

#### Passaggio 5: carica il LaunchAgent

```bash
launchctl bootstrap gui/$UID ~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist
```

Il tunnel si avvierà automaticamente al login, si riavvierà in caso di crash e manterrà attiva la porta inoltrata.

Nota: se hai un vecchio LaunchAgent `com.openclaw.ssh-tunnel` avanzato da una configurazione precedente, scaricalo ed eliminalo.

#### Risoluzione dei problemi

Controlla se il tunnel è in esecuzione:

```bash
ps aux | grep "ssh -N remote-gateway" | grep -v grep
lsof -i :18789
```

Riavvia il tunnel:

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.ssh-tunnel
```

Ferma il tunnel:

```bash
launchctl bootout gui/$UID/ai.openclaw.ssh-tunnel
```

| Voce di configurazione                  | Cosa fa                                                      |
| --------------------------------------- | ------------------------------------------------------------ |
| `LocalForward 18789 127.0.0.1:18789`    | Inoltra la porta locale 18789 alla porta remota 18789        |
| `ssh -N`                                | SSH senza eseguire comandi remoti (solo port forwarding)     |
| `KeepAlive`                             | Riavvia automaticamente il tunnel in caso di crash           |
| `RunAtLoad`                             | Avvia il tunnel quando il LaunchAgent viene caricato al login |

## Correlati

- [Tailscale](/it/gateway/tailscale)
- [Autenticazione](/it/gateway/authentication)
- [Configurazione del gateway remoto](/it/gateway/remote-gateway-readme)
