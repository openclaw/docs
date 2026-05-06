---
read_when:
    - Esecuzione o risoluzione dei problemi delle configurazioni remote del Gateway
summary: Accesso remoto tramite tunnel SSH (Gateway WS) e tailnet
title: Accesso remoto
x-i18n:
    generated_at: "2026-05-06T08:52:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: c6272f4ee9fa52091d461cd70be05ccf01c209c3b26fe98a71752f6ea86ea448
    source_path: gateway/remote.md
    workflow: 16
---

Questo repository supporta "remoto via SSH" mantenendo un singolo Gateway (il master) in esecuzione su un host dedicato (desktop/server) e collegando i client a esso.

- Per gli **operatori (tu / l'app macOS)**: il tunneling SSH è il fallback universale.
- Per i **nodi (iOS/Android e dispositivi futuri)**: connettiti al Gateway **WebSocket** (LAN/tailnet o tunnel SSH secondo necessità).

## L'idea di base

- Il Gateway WebSocket si associa al **loopback** sulla porta configurata (predefinita: 18789).
- Per l'uso remoto, inoltri quella porta di loopback tramite SSH (oppure usi una tailnet/VPN e riduci il tunneling).

## Configurazioni VPN e tailnet comuni

Pensa all'**host Gateway** come al luogo in cui vive l'agente. Possiede sessioni, profili di autenticazione, canali e stato. Laptop, desktop e nodi si connettono a quell'host.

### Gateway sempre attivo nella tua tailnet

Esegui il Gateway su un host persistente (VPS o server domestico) e raggiungilo tramite **Tailscale** o SSH.

- **Migliore UX:** mantieni `gateway.bind: "loopback"` e usa **Tailscale Serve** per l'UI di controllo.
- **Fallback:** mantieni il loopback più un tunnel SSH da qualsiasi macchina che debba accedere.
- **Esempi:** [exe.dev](/it/install/exe-dev) (VM semplice) o [Hetzner](/it/install/hetzner) (VPS di produzione).

Ideale quando il tuo laptop va spesso in stop ma vuoi che l'agente sia sempre attivo.

### Il desktop domestico esegue il Gateway

Il laptop **non** esegue l'agente. Si connette da remoto:

- Usa la modalità **Remoto via SSH** dell'app macOS (Impostazioni → Generali → OpenClaw viene eseguito).
- L'app apre e gestisce il tunnel, quindi WebChat e i controlli di integrità funzionano direttamente.

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
- Il Gateway chiama il **nodo** tramite il Gateway WebSocket (RPC `node.*`).
- Il nodo restituisce il risultato; il Gateway risponde di nuovo su Telegram.

Note:

- **I nodi non eseguono il servizio gateway.** Deve essere eseguito un solo gateway per host, salvo che tu esegua intenzionalmente profili isolati (vedi [Gateway multipli](/it/gateway/multiple-gateways)).
- La "modalità nodo" dell'app macOS è solo un client nodo tramite il Gateway WebSocket.

## Tunnel SSH (CLI + strumenti)

Crea un tunnel locale verso il Gateway WS remoto:

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

Con il tunnel attivo:

- `openclaw health` e `openclaw status --deep` raggiungono ora il gateway remoto tramite `ws://127.0.0.1:18789`.
- `openclaw gateway status`, `openclaw gateway health`, `openclaw gateway probe` e `openclaw gateway call` possono anche indirizzare l'URL inoltrato tramite `--url` quando necessario.

<Note>
Sostituisci `18789` con il tuo `gateway.port` configurato (oppure `--port` o `OPENCLAW_GATEWAY_PORT`).
</Note>

<Warning>
Quando passi `--url`, la CLI non usa come fallback le credenziali di configurazione o ambiente. Includi esplicitamente `--token` o `--password`. La mancanza di credenziali esplicite è un errore.
</Warning>

## Impostazioni remote predefinite della CLI

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

Quando il gateway è solo su loopback, mantieni l'URL su `ws://127.0.0.1:18789` e apri prima il tunnel SSH.
Nel trasporto tunnel SSH dell'app macOS, i nomi host gateway rilevati vanno in
`gateway.remote.sshTarget`; `gateway.remote.url` rimane l'URL del tunnel locale.

## Precedenza delle credenziali

La risoluzione delle credenziali del Gateway segue un contratto condiviso tra i percorsi di call/probe/status e il monitoraggio delle approvazioni di esecuzione Discord. Node-host usa lo stesso contratto di base con un'eccezione per la modalità locale (ignora intenzionalmente `gateway.remote.*`):

- Le credenziali esplicite (`--token`, `--password` o lo strumento `gatewayToken`) hanno sempre la precedenza sui percorsi di chiamata che accettano autenticazione esplicita.
- Sicurezza dell'override URL:
  - Gli override URL della CLI (`--url`) non riutilizzano mai credenziali implicite da configurazione/env.
  - Gli override URL da env (`OPENCLAW_GATEWAY_URL`) possono usare solo credenziali env (`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`).
- Impostazioni predefinite della modalità locale:
  - token: `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token` -> `gateway.remote.token` (il fallback remoto si applica solo quando l'input del token di autenticazione locale non è impostato)
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.auth.password` -> `gateway.remote.password` (il fallback remoto si applica solo quando l'input della password di autenticazione locale non è impostato)
- Impostazioni predefinite della modalità remota:
  - token: `gateway.remote.token` -> `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token`
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.remote.password` -> `gateway.auth.password`
- Eccezione node-host in modalità locale: `gateway.remote.token` / `gateway.remote.password` vengono ignorati.
- I controlli token remoti probe/status sono rigorosi per impostazione predefinita: usano solo `gateway.remote.token` (nessun fallback al token locale) quando indirizzano la modalità remota.
- Gli override env del Gateway usano solo `OPENCLAW_GATEWAY_*`.

## UI chat via SSH

WebChat non usa più una porta HTTP separata. L'UI chat SwiftUI si connette direttamente al Gateway WebSocket.

- Inoltra `18789` tramite SSH (vedi sopra), quindi connetti i client a `ws://127.0.0.1:18789`.
- Su macOS, preferisci la modalità "Remoto via SSH" dell'app, che gestisce automaticamente il tunnel.

## Remoto via SSH dell'app macOS

L'app macOS nella barra dei menu può gestire la stessa configurazione end-to-end (controlli di stato remoti, WebChat e inoltro Voice Wake).

Runbook: [accesso remoto macOS](/it/platforms/mac/remote).

## Regole di sicurezza (remoto/VPN)

Versione breve: **mantieni il Gateway solo su loopback** salvo che tu sia certo di aver bisogno di un bind.

- **Loopback + SSH/Tailscale Serve** è l'impostazione predefinita più sicura (nessuna esposizione pubblica).
- Il testo in chiaro `ws://` è solo su loopback per impostazione predefinita. Per reti private attendibili,
  imposta `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` sul processo client come
  misura di emergenza. Non esiste un equivalente `openclaw.json`; deve essere l'ambiente
  del processo per il client che effettua la connessione WebSocket.
- I **bind non-loopback** (`lan`/`tailnet`/`custom`, o `auto` quando il loopback non è disponibile) devono usare l'autenticazione del gateway: token, password o un reverse proxy consapevole dell'identità con `gateway.auth.mode: "trusted-proxy"`.
- `gateway.remote.token` / `.password` sono fonti di credenziali client. **Non** configurano da soli l'autenticazione server.
- I percorsi di chiamata locali possono usare `gateway.remote.*` come fallback solo quando `gateway.auth.*` non è impostato.
- Se `gateway.auth.token` / `gateway.auth.password` è configurato esplicitamente tramite SecretRef e non viene risolto, la risoluzione fallisce in modo chiuso (nessuna mascheratura tramite fallback remoto).
- `gateway.remote.tlsFingerprint` fissa il certificato TLS remoto quando si usa `wss://`.
- **Tailscale Serve** può autenticare il traffico UI di controllo/WebSocket tramite header di identità
  quando `gateway.auth.allowTailscale: true`; gli endpoint API HTTP non usano
  quell'autenticazione tramite header Tailscale e seguono invece la normale modalità di autenticazione HTTP
  del gateway. Questo flusso senza token presuppone che l'host gateway sia attendibile. Impostalo su
  `false` se vuoi l'autenticazione con segreto condiviso ovunque.
- L'autenticazione **trusted-proxy** si aspetta per impostazione predefinita configurazioni proxy non-loopback consapevoli dell'identità.
  I reverse proxy su loopback sullo stesso host richiedono `gateway.auth.trustedProxy.allowLoopback = true` esplicito.
- Tratta il controllo dal browser come accesso operatore: solo tailnet + abbinamento nodo deliberato.

Approfondimento: [Sicurezza](/it/gateway/security).

### macOS: tunnel SSH persistente tramite LaunchAgent

Per i client macOS che si connettono a un gateway remoto, la configurazione persistente più semplice usa una voce di configurazione SSH `LocalForward` più un LaunchAgent per mantenere il tunnel attivo tra riavvii e arresti anomali.

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

Il tunnel si avvierà automaticamente all'accesso, si riavvierà in caso di arresto anomalo e manterrà attiva la porta inoltrata.

<Note>
Se hai un LaunchAgent `com.openclaw.ssh-tunnel` residuo da una configurazione precedente, scaricalo ed eliminalo.
</Note>

#### Risoluzione dei problemi

Verifica se il tunnel è in esecuzione:

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
| `KeepAlive`                          | Riavvia automaticamente il tunnel se si arresta in modo anomalo |
| `RunAtLoad`                          | Avvia il tunnel quando il LaunchAgent viene caricato all'accesso |

## Correlati

- [Tailscale](/it/gateway/tailscale)
- [Autenticazione](/it/gateway/authentication)
- [Configurazione gateway remoto](/it/gateway/remote-gateway-readme)
