---
read_when:
    - Esecuzione o risoluzione dei problemi delle configurazioni di Gateway remoto
summary: Accesso remoto tramite Gateway WS, tunnel SSH e tailnet
title: Accesso remoto
x-i18n:
    generated_at: "2026-07-03T23:34:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cb6fd38698480f1dff93a6e4819082711e8e4395556a2fd85a8eb772ef6fbe31
    source_path: gateway/remote.md
    workflow: 16
---

Questo repo supporta l'accesso remoto al Gateway mantenendo un singolo Gateway (il master) in esecuzione su un host dedicato (desktop/server) e collegando i client a esso.

- Per gli **operatori (tu / l'app macOS)**: WebSocket LAN/Tailnet diretto è la soluzione più semplice quando il gateway è raggiungibile; il tunneling SSH è il fallback universale.
- Per i **nodi (iOS/Android e dispositivi futuri)**: connettiti al **WebSocket** del Gateway (LAN/tailnet o tunnel SSH secondo necessità).

## L'idea centrale

- Il WebSocket del Gateway di solito si associa al **loopback** sulla porta configurata (predefinita: 18789).
- Per l'uso remoto, esponilo tramite Tailscale Serve o un binding LAN/Tailnet attendibile, oppure inoltra la porta loopback tramite SSH.

## Configurazioni VPN e tailnet comuni

Pensa all'**host Gateway** come al luogo in cui vive l'agente. Possiede sessioni, profili di autenticazione, canali e stato. Il tuo laptop, desktop e i nodi si connettono a quell'host.

### Gateway sempre attivo nella tua tailnet

Esegui il Gateway su un host persistente (VPS o server domestico) e raggiungilo tramite **Tailscale** o SSH.

- **Migliore UX:** mantieni `gateway.bind: "loopback"` e usa **Tailscale Serve** per l'UI di controllo.
- **LAN/Tailnet attendibile:** associa il gateway a un'interfaccia privata e connettiti direttamente con `gateway.remote.transport: "direct"`.
- **Fallback:** mantieni il loopback più un tunnel SSH da qualsiasi macchina che necessita di accesso.
- **Esempi:** [exe.dev](/it/install/exe-dev) (VM semplice) o [Hetzner](/it/install/hetzner) (VPS di produzione).

Ideale quando il tuo laptop va spesso in sospensione ma vuoi che l'agente sia sempre attivo.

### Il desktop domestico esegue il Gateway

Il laptop **non** esegue l'agente. Si connette da remoto:

- Usa la modalità remota dell'app macOS (Settings → General → OpenClaw runs).
- L'app si connette direttamente quando il gateway è raggiungibile su LAN/Tailnet, oppure apre e gestisce un tunnel SSH quando scegli SSH.

Runbook: [accesso remoto macOS](/it/platforms/mac/remote).

### Il laptop esegue il Gateway

Mantieni il Gateway locale ma esponilo in modo sicuro:

- Tunnel SSH verso il laptop da altre macchine, oppure
- Tailscale Serve per l'UI di controllo e mantieni il Gateway solo su loopback.

Guide: [Tailscale](/it/gateway/tailscale) e [panoramica Web](/it/web).

## Flusso dei comandi (cosa viene eseguito dove)

Un servizio gateway possiede stato + canali. I nodi sono periferiche.

Esempio di flusso (Telegram → nodo):

- Il messaggio Telegram arriva al **Gateway**.
- Il Gateway esegue l'**agente** e decide se chiamare uno strumento del nodo.
- Il Gateway chiama il **nodo** tramite il WebSocket del Gateway (`node.*` RPC).
- Il nodo restituisce il risultato; il Gateway risponde su Telegram.

Note:

- **I nodi non eseguono il servizio gateway.** Deve essere eseguito un solo gateway per host, a meno che tu non esegua intenzionalmente profili isolati (vedi [Gateway multipli](/it/gateway/multiple-gateways)).
- La "modalità nodo" dell'app macOS è solo un client nodo tramite il WebSocket del Gateway.

## Tunnel SSH (CLI + strumenti)

Crea un tunnel locale verso il WS del Gateway remoto:

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

Con il tunnel attivo:

- `openclaw health` e `openclaw status --deep` ora raggiungono il gateway remoto tramite `ws://127.0.0.1:18789`.
- `openclaw gateway status`, `openclaw gateway health`, `openclaw gateway probe` e `openclaw gateway call` possono anche puntare all'URL inoltrato tramite `--url` quando necessario.

<Note>
Sostituisci `18789` con il tuo `gateway.port` configurato (oppure `--port` o `OPENCLAW_GATEWAY_PORT`).
</Note>

<Warning>
Quando passi `--url`, la CLI non ricorre alle credenziali di configurazione o ambiente. Includi esplicitamente `--token` o `--password`. La mancanza di credenziali esplicite è un errore.
</Warning>

## Predefiniti remoti della CLI

Puoi rendere persistente un target remoto in modo che i comandi CLI lo usino per impostazione predefinita:

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

Quando il gateway è solo su loopback, mantieni l'URL su `ws://127.0.0.1:18789` e apri prima il tunnel SSH.
Nel trasporto tunnel SSH dell'app macOS, i nomi host gateway rilevati appartengono a
`gateway.remote.sshTarget`; `gateway.remote.url` resta l'URL del tunnel locale.
Se quelle porte differiscono, imposta `gateway.remote.remotePort` sulla porta gateway sull'host SSH.
La verifica della chiave host è rigorosa per impostazione predefinita. Gli alias gestiti possono usare esplicitamente
la loro policy di attendibilità OpenSSH effettiva con
`gateway.remote.sshHostKeyPolicy: "openssh"`; rivedi le impostazioni SSH utente e di sistema corrispondenti prima di abilitarla.

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

La risoluzione delle credenziali del Gateway segue un contratto condiviso tra i percorsi call/probe/status e il monitoraggio dell'approvazione exec di Discord. Node-host usa lo stesso contratto di base con un'eccezione in modalità locale (ignora intenzionalmente `gateway.remote.*`):

- Le credenziali esplicite (`--token`, `--password` o lo strumento `gatewayToken`) hanno sempre la precedenza sui percorsi di chiamata che accettano autenticazione esplicita.
- Sicurezza dell'override URL:
  - Gli override URL della CLI (`--url`) non riutilizzano mai credenziali implicite da config/env.
  - Gli override URL env (`OPENCLAW_GATEWAY_URL`) possono usare solo credenziali env (`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`).
- Predefiniti della modalità locale:
  - token: `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token` -> `gateway.remote.token` (il fallback remoto si applica solo quando l'input del token auth locale non è impostato)
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.auth.password` -> `gateway.remote.password` (il fallback remoto si applica solo quando l'input della password auth locale non è impostato)
- Predefiniti della modalità remota:
  - token: `gateway.remote.token` -> `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token`
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.remote.password` -> `gateway.auth.password`
- Eccezione della modalità locale di node-host: `gateway.remote.token` / `gateway.remote.password` vengono ignorati.
- I controlli token remoti probe/status sono rigorosi per impostazione predefinita: usano solo `gateway.remote.token` (nessun fallback al token locale) quando puntano alla modalità remota.
- Gli override env del Gateway usano solo `OPENCLAW_GATEWAY_*`.

## Accesso remoto all'UI chat

WebChat non usa più una porta HTTP separata. L'UI chat SwiftUI si connette direttamente al WebSocket del Gateway.

- Inoltra `18789` tramite SSH (vedi sopra), quindi connetti i client a `ws://127.0.0.1:18789`.
- Per la modalità diretta LAN/Tailnet, connetti i client all'URL privato `ws://` o sicuro `wss://` configurato.
- Su macOS, preferisci la modalità remota dell'app, che gestisce automaticamente il trasporto selezionato.

## Modalità remota dell'app macOS

L'app macOS nella barra dei menu può gestire la stessa configurazione end-to-end (controlli di stato remoto, WebChat e inoltro di Voice Wake).

Runbook: [accesso remoto macOS](/it/platforms/mac/remote).

## Regole di sicurezza (remoto/VPN)

Versione breve: **mantieni il Gateway solo su loopback** a meno che tu non sia sicuro di aver bisogno di un bind.

- **Loopback + SSH/Tailscale Serve** è il predefinito più sicuro (nessuna esposizione pubblica).
- `ws://` in chiaro è accettato per loopback, LAN, link-local, `.local`, `.ts.net` e host Tailscale CGNAT. Gli host remoti pubblici devono usare `wss://`.
- I **bind non-loopback** (`lan`/`tailnet`/`custom`, o `auto` quando il loopback non è disponibile) devono usare l'autenticazione gateway: token, password o un reverse proxy identity-aware con `gateway.auth.mode: "trusted-proxy"`.
- `gateway.remote.token` / `.password` sono fonti di credenziali client. Non configurano da soli l'autenticazione server.
- I percorsi di chiamata locali possono usare `gateway.remote.*` come fallback solo quando `gateway.auth.*` non è impostato.
- Se `gateway.auth.token` / `gateway.auth.password` è configurato esplicitamente tramite SecretRef e non risolto, la risoluzione fallisce in modo chiuso (nessun mascheramento tramite fallback remoto).
- `gateway.remote.tlsFingerprint` vincola il certificato TLS remoto quando si usa `wss://`, inclusa la modalità diretta macOS. Senza un pin configurato o precedentemente archiviato, macOS vincola un certificato al primo utilizzo solo dopo che la normale attendibilità di sistema è riuscita; i gateway autofirmati o con CA privata che macOS non considera già attendibili richiedono un fingerprint esplicito o Remote over SSH.
- **Tailscale Serve** può autenticare il traffico UI di controllo/WebSocket tramite header di identità
  quando `gateway.auth.allowTailscale: true`; gli endpoint API HTTP non usano
  quell'autenticazione tramite header Tailscale e seguono invece la normale modalità
  auth HTTP del gateway. Questo flusso senza token presuppone che l'host gateway sia attendibile. Impostalo su
  `false` se vuoi autenticazione con segreto condiviso ovunque.
- L'autenticazione **trusted-proxy** si aspetta per impostazione predefinita configurazioni proxy identity-aware non-loopback.
  I reverse proxy loopback sullo stesso host richiedono `gateway.auth.trustedProxy.allowLoopback = true` esplicito.
- Tratta il controllo dal browser come accesso operatore: solo tailnet + pairing deliberato dei nodi.

Approfondimento: [Sicurezza](/it/gateway/security).

### macOS: tunnel SSH persistente tramite LaunchAgent

Per i client macOS che si connettono a un gateway remoto, la configurazione persistente più semplice usa una voce di configurazione SSH `LocalForward` più un LaunchAgent per mantenere attivo il tunnel tra riavvii e crash.

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

Archivia il token nella configurazione in modo che persista tra i riavvii:

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
| `RunAtLoad`                          | Avvia il tunnel quando il LaunchAgent viene caricato al login |

## Correlati

- [Tailscale](/it/gateway/tailscale)
- [Autenticazione](/it/gateway/authentication)
- [Configurazione del gateway remoto](/it/gateway/remote-gateway-readme)
