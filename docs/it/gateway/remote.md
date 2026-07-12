---
read_when:
    - Esecuzione o risoluzione dei problemi delle configurazioni del Gateway remoto
summary: Accesso remoto tramite Gateway WS, tunnel SSH e tailnet
title: Accesso remoto
x-i18n:
    generated_at: "2026-07-12T07:04:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 78daaad7bcb9f80072eaa2d6946bff9f28ba1ec4f95a68edb0d24cf7f9c3fec2
    source_path: gateway/remote.md
    workflow: 16
---

OpenClaw esegue un solo Gateway (il principale) su un host e vi connette ogni client. Il Gateway gestisce sessioni, profili di autenticazione, canali e stato; tutto il resto è un client.

- **Operatori** (tu o l'app macOS): una connessione WebSocket diretta tramite LAN/Tailnet è la soluzione più semplice quando il Gateway è raggiungibile; il tunnel SSH è l'alternativa universale.
- **Nodi** (iOS/Android e altri dispositivi): si connettono al **WebSocket** del Gateway (tramite LAN/tailnet o tunnel SSH).

## Il concetto fondamentale

Per impostazione predefinita, il WebSocket del Gateway si associa all'interfaccia **loopback**, sulla porta `18789` (`gateway.port`). Per l'uso remoto, esponilo tramite Tailscale Serve o un'associazione LAN-Tailnet attendibile, oppure inoltra la porta loopback tramite SSH.

## Opzioni di topologia

| Configurazione                         | Dove viene eseguito il Gateway                                                                                       | Ideale per                                                                                                                                                    |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Gateway sempre attivo nella tua tailnet | Host persistente (VPS o server domestico), raggiunto tramite Tailscale o SSH                                         | Portatili che entrano spesso in sospensione ma richiedono che l'agente sia sempre attivo. Vedi [exe.dev](/it/install/exe-dev) (VM semplice) o [Hetzner](/it/install/hetzner) (VPS di produzione). |
| Desktop domestico                     | Desktop; il portatile si connette da remoto tramite la modalità remota dell'app macOS (Settings → Connection → OpenClaw runs) | Mantenere l'agente su hardware che resta acceso. Procedura: [accesso remoto macOS](/it/platforms/mac/remote).                                                     |
| Portatile                              | Portatile esposto in modo sicuro tramite tunnel SSH o Tailscale Serve (mantieni `gateway.bind: "loopback"`)          | Configurazioni con un solo computer. Vedi [Tailscale](/it/gateway/tailscale) e [Web](/it/web).                                                                        |

Per le configurazioni con Gateway sempre attivo e con portatile, è preferibile mantenere `gateway.bind: "loopback"` e utilizzare **Tailscale Serve** per l'interfaccia di controllo, oppure un'associazione LAN/Tailnet attendibile con `gateway.remote.transport: "direct"`. Il tunnel SSH è l'alternativa che funziona da qualsiasi computer.

## Flusso dei comandi (cosa viene eseguito e dove)

Un solo Gateway gestisce stato e canali; i nodi sono periferiche. Esempio (messaggio Telegram instradato a uno strumento del nodo):

1. Il messaggio Telegram arriva al **Gateway**.
2. Il Gateway esegue l'**agente**, che decide se chiamare uno strumento del nodo.
3. Il Gateway chiama il **nodo** tramite il WebSocket del Gateway (RPC `node.invoke`).
4. Il nodo restituisce il risultato; il Gateway risponde su Telegram.

I nodi non eseguono il servizio Gateway. Deve essere eseguito un solo Gateway per host, a meno che non vengano eseguiti intenzionalmente profili isolati (vedi [Gateway multipli](/it/gateway/multiple-gateways)). La "modalità nodo" dell'app macOS è semplicemente un client nodo connesso tramite il WebSocket del Gateway.

## Tunnel SSH (CLI + strumenti)

```bash
ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
```

Con il tunnel attivo, `openclaw health` e `openclaw status --deep` raggiungono il Gateway remoto tramite `ws://127.0.0.1:18789`. Anche `openclaw gateway status`, `openclaw gateway health`, `openclaw gateway probe` e `openclaw gateway call` possono utilizzare un URL inoltrato tramite `--url`.

<Note>
Sostituisci `18789` con il valore configurato per `gateway.port` (oppure `--port` / `OPENCLAW_GATEWAY_PORT`).
</Note>

<Warning>
`--url` non utilizza mai come alternativa le credenziali della configurazione o dell'ambiente. Passa esplicitamente `--token` o `--password`; in loro assenza, il client non invia credenziali e la connessione non riesce se il Gateway di destinazione richiede l'autenticazione.
</Warning>

## Impostazioni remote predefinite della CLI

Salva una destinazione remota affinché i comandi CLI la utilizzino per impostazione predefinita:

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

Quando il Gateway è limitato al loopback, mantieni l'URL impostato su `ws://127.0.0.1:18789` e apri prima il tunnel SSH. Nel trasporto tramite tunnel SSH dell'app macOS, il nome host del Gateway rilevato va inserito in `gateway.remote.sshTarget` (`user@host` o `user@host:port`); `gateway.remote.url` rimane l'URL del tunnel locale. Se la porta remota è diversa da quella locale, imposta `gateway.remote.remotePort`.

La verifica della chiave host è rigorosa per impostazione predefinita (`gateway.remote.sshHostKeyPolicy: "strict"`). Impostala su `"openssh"` per delegarla invece alla configurazione OpenSSH effettiva; prima di abilitarla, controlla le impostazioni SSH dell'utente e del sistema.

Per un Gateway già raggiungibile tramite una LAN o una Tailnet attendibile, utilizza la modalità diretta:

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

La risoluzione delle credenziali del Gateway segue un unico contratto condiviso tra i percorsi di chiamata, verifica e stato e il monitoraggio delle approvazioni di esecuzione di Discord. L'host del nodo utilizza lo stesso contratto, con una sola eccezione per la modalità locale (ignora `gateway.remote.*`).

- Le credenziali esplicite (`--token`, `--password` o il `gatewayToken` di uno strumento) hanno sempre la precedenza nei percorsi di chiamata che accettano un'autenticazione esplicita.
- Sicurezza della sostituzione dell'URL:
  - Il parametro CLI `--url` non riutilizza mai credenziali implicite provenienti dalla configurazione o dall'ambiente.
  - La variabile d'ambiente `OPENCLAW_GATEWAY_URL` può utilizzare solo credenziali dell'ambiente (`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`).
- Valori predefiniti della modalità locale:
  - token: `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token` -> `gateway.remote.token` (alternativa remota solo quando il token locale non è impostato)
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.auth.password` -> `gateway.remote.password` (alternativa remota solo quando la password locale non è impostata)
- Valori predefiniti della modalità remota:
  - token: `gateway.remote.token` -> `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token`
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.remote.password` -> `gateway.auth.password`
- Eccezione della modalità locale dell'host del nodo: `gateway.remote.token` / `gateway.remote.password` vengono ignorati.
- Per impostazione predefinita, i controlli del token per verifica e stato remoti sono rigorosi: quando la destinazione è in modalità remota, utilizzano solo `gateway.remote.token` (senza ricorrere al token locale).
- Le sostituzioni tramite variabili d'ambiente del Gateway utilizzano solo `OPENCLAW_GATEWAY_*`.

## Accesso remoto all'interfaccia di chat

WebChat non dispone di una porta HTTP separata; l'interfaccia di chat SwiftUI si connette direttamente al WebSocket del Gateway.

- Inoltra la porta `18789` tramite SSH (vedi sopra), quindi connetti i client a `ws://127.0.0.1:18789`.
- Per la modalità diretta tramite LAN/Tailnet, connetti i client all'URL privato `ws://` o sicuro `wss://` configurato.
- Su macOS, la modalità remota dell'app gestisce automaticamente il trasporto selezionato.

## Modalità remota dell'app macOS

L'app macOS nella barra dei menu gestisce la stessa configurazione dall'inizio alla fine: controlli dello stato remoto, WebChat e inoltro dell'attivazione vocale. Procedura: [accesso remoto macOS](/it/platforms/mac/remote).

## Regole di sicurezza (remoto/VPN)

Mantieni il Gateway **limitato al loopback**, a meno che tu non sia certo di aver bisogno di un'associazione diversa.

- **Loopback + SSH/Tailscale Serve** è l'impostazione predefinita più sicura (nessuna esposizione pubblica).
- Il protocollo `ws://` non crittografato è accettato per host loopback, privati/LAN (RFC 1918), link-local, CGNAT, `.local` e `.ts.net`. Gli host remoti pubblici devono utilizzare `wss://`.
- Le **associazioni non loopback** (`lan`/`tailnet`/`custom` oppure `auto` quando il loopback non è disponibile) devono utilizzare l'autenticazione del Gateway: token, password oppure un proxy inverso sensibile all'identità con `gateway.auth.mode: "trusted-proxy"`.
- `gateway.remote.token` / `.password` sono origini delle credenziali del client; da sole non configurano l'autenticazione del server.
- I percorsi di chiamata locali possono utilizzare `gateway.remote.*` come alternativa solo quando `gateway.auth.*` non è impostato.
- Se `gateway.auth.token` / `gateway.auth.password` è configurato esplicitamente tramite SecretRef e non può essere risolto, la risoluzione si interrompe in modo sicuro (senza che l'alternativa remota mascheri il problema).
- `gateway.remote.tlsFingerprint` vincola il certificato TLS remoto per `wss://`, inclusa la modalità diretta di macOS. Senza un'impronta salvata, macOS esegue il vincolo al primo utilizzo solo dopo il superamento della normale verifica di attendibilità del sistema; i Gateway autofirmati o con CA privata richiedono un'impronta esplicita oppure la modalità remota tramite SSH.
- **Tailscale Serve** può autenticare il traffico dell'interfaccia di controllo/WebSocket tramite intestazioni di identità quando `gateway.auth.allowTailscale: true`. Gli endpoint dell'API HTTP non utilizzano questa autenticazione tramite intestazioni e seguono invece la normale modalità di autenticazione HTTP del Gateway. Questo flusso senza token presuppone che l'host del Gateway sia attendibile; impostalo su `false` per utilizzare ovunque l'autenticazione con segreto condiviso.
- L'autenticazione tramite **proxy attendibile** richiede per impostazione predefinita un proxy sensibile all'identità non associato al loopback. I proxy inversi loopback sullo stesso host richiedono l'impostazione esplicita `gateway.auth.trustedProxy.allowLoopback = true`.
- Considera il controllo tramite browser equivalente all'accesso dell'operatore: solo nella tailnet e con associazione intenzionale dei nodi.

Approfondimento: [Sicurezza](/it/gateway/security).

### macOS: tunnel SSH persistente tramite LaunchAgent

Per i client macOS, la configurazione persistente più semplice utilizza una voce SSH `LocalForward` e un LaunchAgent che mantiene attivo il tunnel dopo riavvii e arresti anomali.

#### Passaggio 1: aggiungere la configurazione SSH

Modifica `~/.ssh/config`:

```ssh
Host remote-gateway
    HostName <REMOTE_IP>
    User <REMOTE_USER>
    LocalForward 18789 127.0.0.1:18789
    IdentityFile ~/.ssh/id_rsa
```

Sostituisci `<REMOTE_IP>` e `<REMOTE_USER>` con i tuoi valori.

#### Passaggio 2: copiare la chiave SSH (una sola volta)

```bash
ssh-copy-id -i ~/.ssh/id_rsa <REMOTE_USER>@<REMOTE_IP>
```

#### Passaggio 3: configurare il token del Gateway

```bash
openclaw config set gateway.remote.token "<your-token>"
```

Utilizza invece `gateway.remote.password` se il Gateway remoto usa l'autenticazione tramite password. `OPENCLAW_GATEWAY_TOKEN` rimane valido come sostituzione a livello di shell, ma la configurazione persistente del client remoto è `gateway.remote.token` / `gateway.remote.password`.

#### Passaggio 4: creare il LaunchAgent

Salva il file come `~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist`:

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

#### Passaggio 5: caricare il LaunchAgent

```bash
launchctl bootstrap gui/$UID ~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist
```

Il tunnel si avvia automaticamente all'accesso, si riavvia dopo un arresto anomalo e mantiene attiva la porta inoltrata.

<Note>
Se è ancora presente un LaunchAgent `com.openclaw.ssh-tunnel` di una configurazione precedente, scaricalo ed eliminalo.
</Note>

#### Risoluzione dei problemi

```bash
# Check if the tunnel is running
ps aux | grep "ssh -N remote-gateway" | grep -v grep
lsof -i :18789

# Restart the tunnel
launchctl kickstart -k gui/$UID/ai.openclaw.ssh-tunnel

# Stop the tunnel
launchctl bootout gui/$UID/ai.openclaw.ssh-tunnel
```

| Voce di configurazione                 | Funzione                                                              |
| -------------------------------------- | --------------------------------------------------------------------- |
| `LocalForward 18789 127.0.0.1:18789` | Inoltra la porta locale 18789 alla porta remota 18789                  |
| `ssh -N`                             | SSH senza eseguire comandi remoti (solo inoltro delle porte)           |
| `KeepAlive`                          | Riavvia automaticamente il tunnel in caso di arresto anomalo           |
| `RunAtLoad`                          | Avvia il tunnel quando il LaunchAgent viene caricato all'accesso       |

## Argomenti correlati

- [Tailscale](/it/gateway/tailscale)
- [Autenticazione](/it/gateway/authentication)
- [Configurazione del Gateway remoto](/it/gateway/remote-gateway-readme)
