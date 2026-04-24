---
read_when:
    - Esecuzione o risoluzione dei problemi di configurazioni Gateway remote
summary: Accesso remoto tramite tunnel SSH (Gateway WS) e tailnet
title: Accesso remoto
x-i18n:
    generated_at: "2026-04-24T08:42:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 66eebbe3762134f29f982201d7e79a789624b96042bd931e07d9855710d64bfe
    source_path: gateway/remote.md
    workflow: 15
---

# Accesso remoto (SSH, tunnel e tailnet)

Questo repository supporta il modello “remoto tramite SSH” mantenendo un singolo Gateway (il master) in esecuzione su un host dedicato (desktop/server) e collegando ad esso i client.

- Per gli **operatori (tu / l'app macOS)**: il tunneling SSH è il fallback universale.
- Per i **Node (iOS/Android e futuri dispositivi)**: connettiti al **WebSocket** del Gateway (LAN/tailnet o tunnel SSH secondo necessità).

## L'idea di base

- Il Gateway WebSocket fa bind su **loopback** sulla porta configurata (predefinita 18789).
- Per l'uso remoto, inoltri quella porta loopback tramite SSH (oppure usi una tailnet/VPN e riduci l'uso dei tunnel).

## Configurazioni comuni VPN/tailnet (dove vive l'agente)

Pensa all'**host Gateway** come al luogo “in cui vive l'agente”. È lui a possedere sessioni, profili auth, canali e stato.
Il tuo laptop/desktop (e i Node) si connettono a quell'host.

### 1) Gateway always-on nella tua tailnet (VPS o server domestico)

Esegui il Gateway su un host persistente e raggiungilo tramite **Tailscale** o SSH.

- **Migliore UX:** mantieni `gateway.bind: "loopback"` e usa **Tailscale Serve** per la Control UI.
- **Fallback:** mantieni loopback + tunnel SSH da qualsiasi macchina necessiti accesso.
- **Esempi:** [exe.dev](/it/install/exe-dev) (VM semplice) o [Hetzner](/it/install/hetzner) (VPS di produzione).

Questo è ideale quando il tuo laptop va spesso in stop ma vuoi che l'agente resti sempre attivo.

### 2) Il desktop di casa esegue il Gateway, il laptop è il controllo remoto

Il laptop **non** esegue l'agente. Si connette da remoto:

- Usa la modalità **Remote over SSH** dell'app macOS (Impostazioni → Generale → “OpenClaw runs”).
- L'app apre e gestisce il tunnel, così WebChat + controlli di stato “funzionano e basta”.

Runbook: [accesso remoto macOS](/it/platforms/mac/remote).

### 3) Il laptop esegue il Gateway, accesso remoto da altre macchine

Mantieni il Gateway locale ma esponilo in modo sicuro:

- Tunnel SSH verso il laptop da altre macchine, oppure
- Tailscale Serve per la Control UI mantenendo il Gateway solo su loopback.

Guida: [Tailscale](/it/gateway/tailscale) e [Panoramica Web](/it/web).

## Flusso dei comandi (cosa viene eseguito e dove)

Un servizio Gateway possiede stato + canali. I Node sono periferiche.

Esempio di flusso (Telegram → Node):

- Un messaggio Telegram arriva al **Gateway**.
- Il Gateway esegue l'**agente** e decide se chiamare uno strumento del Node.
- Il Gateway chiama il **Node** tramite il Gateway WebSocket (RPC `node.*`).
- Il Node restituisce il risultato; il Gateway risponde di nuovo su Telegram.

Note:

- **I Node non eseguono il servizio Gateway.** Solo un Gateway dovrebbe essere eseguito per host, a meno che tu non esegua intenzionalmente profili isolati (vedi [Gateway multipli](/it/gateway/multiple-gateways)).
- La “modalità Node” dell'app macOS è solo un client Node tramite il Gateway WebSocket.

## Tunnel SSH (CLI + strumenti)

Crea un tunnel locale verso il Gateway WS remoto:

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

Con il tunnel attivo:

- `openclaw health` e `openclaw status --deep` raggiungono ora il Gateway remoto tramite `ws://127.0.0.1:18789`.
- Anche `openclaw gateway status`, `openclaw gateway health`, `openclaw gateway probe` e `openclaw gateway call` possono puntare all'URL inoltrato tramite `--url` quando necessario.

Nota: sostituisci `18789` con la tua `gateway.port` configurata (o `--port`/`OPENCLAW_GATEWAY_PORT`).
Nota: quando passi `--url`, la CLI non usa come fallback credenziali da configurazione o ambiente.
Includi esplicitamente `--token` o `--password`. L'assenza di credenziali esplicite è un errore.

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

Quando il Gateway è solo loopback, mantieni l'URL su `ws://127.0.0.1:18789` e apri prima il tunnel SSH.

## Precedenza delle credenziali

La risoluzione delle credenziali del Gateway segue un contratto condiviso tra percorsi call/probe/status e monitoraggio delle approvazioni exec di Discord. L'host Node usa lo stesso contratto di base con un'eccezione in modalità locale (ignora intenzionalmente `gateway.remote.*`):

- Le credenziali esplicite (`--token`, `--password` o `gatewayToken` dello strumento) vincono sempre nei percorsi call che accettano auth esplicita.
- Sicurezza degli override URL:
  - Gli override URL CLI (`--url`) non riutilizzano mai credenziali implicite da config/env.
  - Gli override URL env (`OPENCLAW_GATEWAY_URL`) possono usare solo credenziali env (`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`).
- Valori predefiniti della modalità locale:
  - token: `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token` -> `gateway.remote.token` (il fallback remoto si applica solo quando l'input del token auth locale non è impostato)
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.auth.password` -> `gateway.remote.password` (il fallback remoto si applica solo quando l'input della password auth locale non è impostato)
- Valori predefiniti della modalità remota:
  - token: `gateway.remote.token` -> `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token`
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.remote.password` -> `gateway.auth.password`
- Eccezione della modalità locale dell'host Node: `gateway.remote.token` / `gateway.remote.password` vengono ignorati.
- I controlli token remoti di probe/status sono rigorosi per impostazione predefinita: usano solo `gateway.remote.token` (nessun fallback al token locale) quando puntano alla modalità remota.
- Gli override env del Gateway usano solo `OPENCLAW_GATEWAY_*`.

## Interfaccia chat tramite SSH

WebChat non usa più una porta HTTP separata. La UI chat SwiftUI si connette direttamente al Gateway WebSocket.

- Inoltra `18789` tramite SSH (vedi sopra), poi collega i client a `ws://127.0.0.1:18789`.
- Su macOS, preferisci la modalità “Remote over SSH” dell'app, che gestisce automaticamente il tunnel.

## App macOS "Remote over SSH"

L'app macOS nella barra dei menu può gestire questa stessa configurazione end-to-end (controlli di stato remoti, WebChat e inoltro di Voice Wake).

Runbook: [accesso remoto macOS](/it/platforms/mac/remote).

## Regole di sicurezza (remoto/VPN)

In breve: **mantieni il Gateway solo su loopback** a meno che tu non sia sicuro di aver bisogno di un bind.

- **Loopback + SSH/Tailscale Serve** è il valore predefinito più sicuro (nessuna esposizione pubblica).
- `ws://` in chiaro è consentito solo su loopback per impostazione predefinita. Per reti private attendibili,
  imposta `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` nel processo client come
  opzione di emergenza. Non esiste un equivalente in `openclaw.json`; deve essere
  nell'ambiente del processo del client che effettua la connessione WebSocket.
- I **bind non loopback** (`lan`/`tailnet`/`custom`, o `auto` quando loopback non è disponibile) devono usare auth del Gateway: token, password o un reverse proxy identity-aware con `gateway.auth.mode: "trusted-proxy"`.
- `gateway.remote.token` / `.password` sono fonti di credenziali del client. Da sole **non** configurano l'auth del server.
- I percorsi di chiamata locali possono usare `gateway.remote.*` come fallback solo quando `gateway.auth.*` non è impostato.
- Se `gateway.auth.token` / `gateway.auth.password` sono configurati esplicitamente tramite SecretRef e non risolti, la risoluzione fallisce in modo chiuso (nessun fallback remoto che mascheri il problema).
- `gateway.remote.tlsFingerprint` esegue il pin del certificato TLS remoto quando si usa `wss://`.
- **Tailscale Serve** può autenticare il traffico di Control UI/WebSocket tramite header di identità
  quando `gateway.auth.allowTailscale: true`; gli endpoint API HTTP non usano quell'auth tramite header Tailscale e seguono invece la normale modalità di auth HTTP del Gateway. Questo flusso senza token presume che l'host Gateway sia attendibile. Impostalo su
  `false` se vuoi auth con segreto condiviso ovunque.
- L'auth **trusted-proxy** è solo per configurazioni non loopback con proxy identity-aware.
  I reverse proxy loopback sullo stesso host non soddisfano `gateway.auth.mode: "trusted-proxy"`.
- Tratta il controllo del browser come accesso operator: solo tailnet + associazione deliberata del Node.

Approfondimento: [Sicurezza](/it/gateway/security).

### macOS: tunnel SSH persistente tramite LaunchAgent

Per i client macOS che si connettono a un Gateway remoto, la configurazione persistente più semplice usa una voce SSH `LocalForward` più un LaunchAgent per mantenere vivo il tunnel tra riavvii e crash.

#### Passo 1: aggiungi la configurazione SSH

Modifica `~/.ssh/config`:

```ssh
Host remote-gateway
    HostName <REMOTE_IP>
    User <REMOTE_USER>
    LocalForward 18789 127.0.0.1:18789
    IdentityFile ~/.ssh/id_rsa
```

Sostituisci `<REMOTE_IP>` e `<REMOTE_USER>` con i tuoi valori.

#### Passo 2: copia la chiave SSH (una sola volta)

```bash
ssh-copy-id -i ~/.ssh/id_rsa <REMOTE_USER>@<REMOTE_IP>
```

#### Passo 3: configura il token del Gateway

Memorizza il token nella configurazione così persiste tra i riavvii:

```bash
openclaw config set gateway.remote.token "<your-token>"
```

#### Passo 4: crea il LaunchAgent

Salvalo come `~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist`:

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

#### Passo 5: carica il LaunchAgent

```bash
launchctl bootstrap gui/$UID ~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist
```

Il tunnel si avvierà automaticamente al login, verrà riavviato in caso di crash e manterrà attiva la porta inoltrata.

Nota: se hai un LaunchAgent `com.openclaw.ssh-tunnel` residuo da una configurazione precedente, scaricalo ed eliminalo.

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

| Voce di configurazione                 | Cosa fa                                                      |
| -------------------------------------- | ------------------------------------------------------------ |
| `LocalForward 18789 127.0.0.1:18789`   | Inoltra la porta locale 18789 alla porta remota 18789        |
| `ssh -N`                               | SSH senza eseguire comandi remoti (solo port forwarding)     |
| `KeepAlive`                            | Riavvia automaticamente il tunnel in caso di crash           |
| `RunAtLoad`                            | Avvia il tunnel quando il LaunchAgent viene caricato al login |

## Correlati

- [Tailscale](/it/gateway/tailscale)
- [Autenticazione](/it/gateway/authentication)
- [Configurazione del Gateway remoto](/it/gateway/remote-gateway-readme)
