---
read_when:
    - Esecuzione o risoluzione dei problemi delle configurazioni remote del Gateway
summary: Accesso remoto tramite Gateway WS, tunnel SSH e tailnet
title: Accesso remoto
x-i18n:
    generated_at: "2026-06-27T17:34:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f5f885026fe76acb46f49955c6e485e08714a5cc5e90c165d20e25cea1acf864
    source_path: gateway/remote.md
    workflow: 16
---

Questo repository supporta l'accesso remoto al Gateway mantenendo un singolo Gateway (il master) in esecuzione su un host dedicato (desktop/server) e collegando i client a esso.

- Per **operatori (tu / l'app macOS)**: il WebSocket diretto su LAN/Tailnet è la soluzione più semplice quando il gateway è raggiungibile; il tunneling SSH è il fallback universale.
- Per **nodi (iOS/Android e dispositivi futuri)**: connettiti al **WebSocket** del Gateway (LAN/tailnet o tunnel SSH secondo necessità).

## L'idea di base

- Il WebSocket del Gateway di solito effettua il bind al **loopback** sulla porta configurata (valore predefinito 18789).
- Per l'uso remoto, esponilo tramite Tailscale Serve o un bind LAN/Tailnet attendibile, oppure inoltra la porta loopback via SSH.

## Configurazioni VPN e tailnet comuni

Considera l'**host Gateway** come il luogo in cui vive l'agente. Possiede sessioni, profili di autenticazione, canali e stato. Laptop, desktop e nodi si connettono a quell'host.

### Gateway sempre attivo nella tua tailnet

Esegui il Gateway su un host persistente (VPS o server domestico) e raggiungilo tramite **Tailscale** o SSH.

- **Migliore esperienza utente:** mantieni `gateway.bind: "loopback"` e usa **Tailscale Serve** per la Control UI.
- **LAN/Tailnet attendibile:** effettua il bind del gateway a un'interfaccia privata e connettiti direttamente con `gateway.remote.transport: "direct"`.
- **Fallback:** mantieni il loopback più un tunnel SSH da qualsiasi macchina che richieda accesso.
- **Esempi:** [exe.dev](/it/install/exe-dev) (VM semplice) o [Hetzner](/it/install/hetzner) (VPS di produzione).

Ideale quando il laptop va spesso in stop ma vuoi che l'agente resti sempre attivo.

### Il desktop di casa esegue il Gateway

Il laptop **non** esegue l'agente. Si connette da remoto:

- Usa la modalità remota dell'app macOS (Impostazioni → Generali → OpenClaw runs).
- L'app si connette direttamente quando il gateway è raggiungibile su LAN/Tailnet, oppure apre e gestisce un tunnel SSH quando scegli SSH.

Runbook: [accesso remoto macOS](/it/platforms/mac/remote).

### Il laptop esegue il Gateway

Mantieni il Gateway locale ma esponilo in modo sicuro:

- Tunnel SSH verso il laptop da altre macchine, oppure
- Tailscale Serve per la Control UI e Gateway solo su loopback.

Guide: [Tailscale](/it/gateway/tailscale) e [Panoramica web](/it/web).

## Flusso dei comandi (cosa viene eseguito dove)

Un servizio gateway possiede stato + canali. I nodi sono periferiche.

Esempio di flusso (Telegram → nodo):

- Il messaggio Telegram arriva al **Gateway**.
- Il Gateway esegue l'**agente** e decide se chiamare uno strumento del nodo.
- Il Gateway chiama il **nodo** tramite il WebSocket del Gateway (RPC `node.*`).
- Il nodo restituisce il risultato; il Gateway risponde di nuovo su Telegram.

Note:

- **I nodi non eseguono il servizio gateway.** Dovrebbe essere in esecuzione un solo gateway per host, a meno che tu non esegua intenzionalmente profili isolati (vedi [Gateway multipli](/it/gateway/multiple-gateways)).
- La "modalità nodo" dell'app macOS è semplicemente un client nodo tramite il WebSocket del Gateway.

## Tunnel SSH (CLI + strumenti)

Crea un tunnel locale verso il WS del Gateway remoto:

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

Con il tunnel attivo:

- `openclaw health` e `openclaw status --deep` raggiungono ora il gateway remoto tramite `ws://127.0.0.1:18789`.
- `openclaw gateway status`, `openclaw gateway health`, `openclaw gateway probe` e `openclaw gateway call` possono anche puntare all'URL inoltrato tramite `--url` quando necessario.

<Note>
Sostituisci `18789` con il tuo `gateway.port` configurato (oppure `--port` o `OPENCLAW_GATEWAY_PORT`).
</Note>

<Warning>
Quando passi `--url`, la CLI non torna alla configurazione o alle credenziali d'ambiente. Includi esplicitamente `--token` o `--password`. La mancanza di credenziali esplicite è un errore.
</Warning>

## Valori predefiniti remoti della CLI

Puoi rendere persistente una destinazione remota in modo che i comandi CLI la usino per impostazione predefinita:

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
`gateway.remote.sshTarget`; `gateway.remote.url` rimane l'URL del tunnel locale.
Se quelle porte differiscono, imposta `gateway.remote.remotePort` sulla porta del gateway sull'host SSH.

Per un gateway già raggiungibile su una LAN o Tailnet attendibile, usa la modalità diretta:

```json5
{
  gateway: {
    mode: "remote",
    remote: {
      transport: "direct",
      url: "ws://192.168.0.202:18789",
      token: "your-token",
    },
  },
}
```

## Precedenza delle credenziali

La risoluzione delle credenziali del Gateway segue un unico contratto condiviso tra i percorsi call/probe/status e il monitoraggio dell'approvazione exec di Discord. Node-host usa lo stesso contratto di base con una sola eccezione in modalità locale (ignora intenzionalmente `gateway.remote.*`):

- Le credenziali esplicite (`--token`, `--password` o `gatewayToken` dello strumento) vincono sempre sui percorsi di chiamata che accettano autenticazione esplicita.
- Sicurezza dell'override URL:
  - Gli override URL della CLI (`--url`) non riutilizzano mai credenziali implicite da config/env.
  - Gli override URL da env (`OPENCLAW_GATEWAY_URL`) possono usare solo credenziali env (`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`).
- Valori predefiniti in modalità locale:
  - token: `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token` -> `gateway.remote.token` (il fallback remoto si applica solo quando l'input del token di autenticazione locale non è impostato)
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.auth.password` -> `gateway.remote.password` (il fallback remoto si applica solo quando l'input della password di autenticazione locale non è impostato)
- Valori predefiniti in modalità remota:
  - token: `gateway.remote.token` -> `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token`
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.remote.password` -> `gateway.auth.password`
- Eccezione in modalità locale per node-host: `gateway.remote.token` / `gateway.remote.password` vengono ignorati.
- I controlli token di probe/status remoti sono rigorosi per impostazione predefinita: usano solo `gateway.remote.token` (nessun fallback al token locale) quando puntano alla modalità remota.
- Gli override env del Gateway usano solo `OPENCLAW_GATEWAY_*`.

## Accesso remoto alla Chat UI

WebChat non usa più una porta HTTP separata. La chat UI SwiftUI si connette direttamente al WebSocket del Gateway.

- Inoltra `18789` tramite SSH (vedi sopra), quindi connetti i client a `ws://127.0.0.1:18789`.
- Per la modalità diretta LAN/Tailnet, connetti i client all'URL privato `ws://` configurato o all'URL sicuro `wss://`.
- Su macOS, preferisci la modalità remota dell'app, che gestisce automaticamente il trasporto selezionato.

## Modalità remota dell'app macOS

L'app della barra dei menu macOS può gestire la stessa configurazione end-to-end (controlli di stato remoti, WebChat e inoltro Voice Wake).

Runbook: [accesso remoto macOS](/it/platforms/mac/remote).

## Regole di sicurezza (remoto/VPN)

Versione breve: **mantieni il Gateway solo su loopback** a meno che tu non sia certo di aver bisogno di un bind.

- **Loopback + SSH/Tailscale Serve** è il valore predefinito più sicuro (nessuna esposizione pubblica).
- `ws://` in chiaro è accettato per loopback, LAN, link-local, `.local`, `.ts.net` e host Tailscale CGNAT. Gli host remoti pubblici devono usare `wss://`.
- I **bind non-loopback** (`lan`/`tailnet`/`custom`, o `auto` quando il loopback non è disponibile) devono usare l'autenticazione gateway: token, password o un reverse proxy identity-aware con `gateway.auth.mode: "trusted-proxy"`.
- `gateway.remote.token` / `.password` sono sorgenti di credenziali client. **Non** configurano da soli l'autenticazione server.
- I percorsi di chiamata locali possono usare `gateway.remote.*` come fallback solo quando `gateway.auth.*` non è impostato.
- Se `gateway.auth.token` / `gateway.auth.password` è configurato esplicitamente tramite SecretRef e non viene risolto, la risoluzione fallisce in modo chiuso (nessun mascheramento tramite fallback remoto).
- `gateway.remote.tlsFingerprint` blocca il certificato TLS remoto quando si usa `wss://`, inclusa la modalità diretta macOS. Senza un pin configurato o memorizzato in precedenza, macOS blocca un certificato al primo utilizzo solo dopo che la normale fiducia di sistema è stata superata; i gateway autofirmati o con CA privata che macOS non considera già attendibili richiedono un fingerprint esplicito o Remote over SSH.
- **Tailscale Serve** può autenticare il traffico Control UI/WebSocket tramite header di identità
  quando `gateway.auth.allowTailscale: true`; gli endpoint HTTP API non usano
  quell'autenticazione header Tailscale e seguono invece la normale modalità di
  autenticazione HTTP del gateway. Questo flusso senza token presuppone che l'host gateway sia attendibile. Impostalo su
  `false` se vuoi l'autenticazione con segreto condiviso ovunque.
- L'autenticazione **trusted-proxy** si aspetta per impostazione predefinita configurazioni proxy identity-aware non-loopback.
  I reverse proxy loopback sullo stesso host richiedono esplicitamente `gateway.auth.trustedProxy.allowLoopback = true`.
- Tratta il controllo da browser come accesso operatore: solo tailnet + abbinamento deliberato dei nodi.

Approfondimento: [Sicurezza](/it/gateway/security).

### macOS: tunnel SSH persistente tramite LaunchAgent

Per i client macOS che si connettono a un gateway remoto, la configurazione persistente più semplice usa una voce di configurazione SSH `LocalForward` più un LaunchAgent per mantenere vivo il tunnel tra riavvii e crash.

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

#### Passaggio 2: copia la chiave SSH (una tantum)

```bash
ssh-copy-id -i ~/.ssh/id_rsa <REMOTE_USER>@<REMOTE_IP>
```

#### Passaggio 3: configura il token del gateway

Memorizza il token nella configurazione in modo che persista tra i riavvii:

```bash
openclaw config set gateway.remote.token "<your-token>"
```

#### Passaggio 4: crea il LaunchAgent

Salva questo come `~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist`:

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

Il tunnel si avvierà automaticamente all'accesso, si riavvierà in caso di crash e manterrà attiva la porta inoltrata.

<Note>
Se hai un LaunchAgent `com.openclaw.ssh-tunnel` residuo da una configurazione precedente, scaricalo ed eliminalo.
</Note>

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

Arresta il tunnel:

```bash
launchctl bootout gui/$UID/ai.openclaw.ssh-tunnel
```

| Voce di configurazione               | Cosa fa                                                      |
| ------------------------------------ | ------------------------------------------------------------ |
| `LocalForward 18789 127.0.0.1:18789` | Inoltra la porta locale 18789 alla porta remota 18789        |
| `ssh -N`                             | SSH senza eseguire comandi remoti (solo port-forwarding)     |
| `KeepAlive`                          | Riavvia automaticamente il tunnel se va in crash             |
| `RunAtLoad`                          | Avvia il tunnel quando il LaunchAgent viene caricato all'accesso |

## Correlati

- [Tailscale](/it/gateway/tailscale)
- [Autenticazione](/it/gateway/authentication)
- [Configurazione del Gateway remoto](/it/gateway/remote-gateway-readme)
