---
read_when:
    - Esecuzione o risoluzione dei problemi di configurazioni gateway remote
summary: Accesso remoto tramite tunnel SSH (Gateway WS) e tailnet
title: Accesso remoto
x-i18n:
    generated_at: "2026-04-05T13:53:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8596fa2a7fd44117dfe92b70c9d8f28c0e16d7987adf0d0769a9eff71d5bc081
    source_path: gateway/remote.md
    workflow: 15
---

# Accesso remoto (SSH, tunnel e tailnet)

Questo repository supporta il modello “remote over SSH” mantenendo un unico Gateway (il master) in esecuzione su un host dedicato (desktop/server) e collegandovi i client.

- Per gli **operatori (tu / l'app macOS)**: il tunneling SSH è il fallback universale.
- Per i **nodi (iOS/Android e futuri dispositivi)**: connettiti al **WebSocket** del Gateway (LAN/tailnet o tunnel SSH secondo necessità).

## L'idea di base

- Il WebSocket del Gateway si associa al **loopback** sulla porta configurata (predefinita: 18789).
- Per l'uso remoto, inoltri quella porta loopback tramite SSH (oppure usi una tailnet/VPN e riduci il bisogno di tunnel).

## Configurazioni VPN/tailnet comuni (dove vive l'agente)

Pensa all'**host Gateway** come al luogo “dove vive l'agente”. Gestisce sessioni, profili di autenticazione, canali e stato.
Il tuo laptop/desktop (e i nodi) si connettono a quell'host.

### 1) Gateway always-on nella tua tailnet (VPS o server domestico)

Esegui il Gateway su un host persistente e raggiungilo tramite **Tailscale** o SSH.

- **Migliore UX:** mantieni `gateway.bind: "loopback"` e usa **Tailscale Serve** per la Control UI.
- **Fallback:** mantieni il loopback + tunnel SSH da qualsiasi macchina che abbia bisogno di accesso.
- **Esempi:** [exe.dev](/install/exe-dev) (VM semplice) oppure [Hetzner](/install/hetzner) (VPS di produzione).

È l'ideale quando il tuo laptop va spesso in sospensione ma vuoi che l'agente resti sempre attivo.

### 2) Il desktop di casa esegue il Gateway, il laptop è il controllo remoto

Il laptop **non** esegue l'agente. Si connette da remoto:

- Usa la modalità **Remote over SSH** dell'app macOS (Impostazioni → Generali → “OpenClaw runs”).
- L'app apre e gestisce il tunnel, quindi WebChat + controlli di integrità “funzionano e basta”.

Runbook: [accesso remoto macOS](/platforms/mac/remote).

### 3) Il laptop esegue il Gateway, accesso remoto da altre macchine

Mantieni il Gateway locale ma esponilo in modo sicuro:

- Tunnel SSH verso il laptop da altre macchine, oppure
- esponi la Control UI tramite Tailscale Serve e mantieni il Gateway accessibile solo via loopback.

Guida: [Tailscale](/gateway/tailscale) e [Panoramica web](/web).

## Flusso dei comandi (cosa viene eseguito e dove)

Un unico servizio gateway gestisce stato + canali. I nodi sono periferiche.

Esempio di flusso (Telegram → nodo):

- Un messaggio Telegram arriva al **Gateway**.
- Il Gateway esegue l'**agente** e decide se chiamare uno strumento del nodo.
- Il Gateway chiama il **nodo** tramite il WebSocket del Gateway (RPC `node.*`).
- Il nodo restituisce il risultato; il Gateway risponde nuovamente su Telegram.

Note:

- **I nodi non eseguono il servizio gateway.** Dovrebbe essere in esecuzione un solo gateway per host, a meno che tu non stia eseguendo intenzionalmente profili isolati (vedi [Gateway multipli](/gateway/multiple-gateways)).
- La “modalità nodo” dell'app macOS è semplicemente un client nodo tramite il WebSocket del Gateway.

## Tunnel SSH (CLI + tools)

Crea un tunnel locale verso il WS del Gateway remoto:

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

Con il tunnel attivo:

- `openclaw health` e `openclaw status --deep` raggiungono ora il gateway remoto tramite `ws://127.0.0.1:18789`.
- Anche `openclaw gateway status`, `openclaw gateway health`, `openclaw gateway probe` e `openclaw gateway call` possono puntare all'URL inoltrato tramite `--url` quando necessario.

Nota: sostituisci `18789` con la tua `gateway.port` configurata (oppure `--port`/`OPENCLAW_GATEWAY_PORT`).
Nota: quando passi `--url`, la CLI non usa il fallback alle credenziali di configurazione o di ambiente.
Includi esplicitamente `--token` o `--password`. L'assenza di credenziali esplicite è un errore.

## Valori predefiniti remoti della CLI

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

Quando il gateway è accessibile solo via loopback, mantieni l'URL su `ws://127.0.0.1:18789` e apri prima il tunnel SSH.

## Precedenza delle credenziali

La risoluzione delle credenziali del Gateway segue un unico contratto condiviso tra i percorsi call/probe/status e il monitoraggio dell'approvazione delle exec Discord. Node-host usa lo stesso contratto di base con un'eccezione in modalità locale (ignora intenzionalmente `gateway.remote.*`):

- Le credenziali esplicite (`--token`, `--password` o il tool `gatewayToken`) hanno sempre la precedenza nei percorsi call che accettano autenticazione esplicita.
- Sicurezza degli override URL:
  - Gli override URL della CLI (`--url`) non riusano mai implicitamente credenziali di configurazione/env.
  - Gli override URL tramite env (`OPENCLAW_GATEWAY_URL`) possono usare solo credenziali env (`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`).
- Valori predefiniti della modalità locale:
  - token: `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token` -> `gateway.remote.token` (il fallback remoto si applica solo quando l'input del token di autenticazione locale non è impostato)
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.auth.password` -> `gateway.remote.password` (il fallback remoto si applica solo quando l'input della password di autenticazione locale non è impostato)
- Valori predefiniti della modalità remota:
  - token: `gateway.remote.token` -> `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token`
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.remote.password` -> `gateway.auth.password`
- Eccezione node-host in modalità locale: `gateway.remote.token` / `gateway.remote.password` vengono ignorati.
- I controlli token remoti probe/status sono rigorosi per impostazione predefinita: usano solo `gateway.remote.token` (senza fallback al token locale) quando puntano alla modalità remota.
- Gli override env del Gateway usano solo `OPENCLAW_GATEWAY_*`.

## Interfaccia chat tramite SSH

WebChat non usa più una porta HTTP separata. L'interfaccia chat SwiftUI si connette direttamente al WebSocket del Gateway.

- Inoltra `18789` tramite SSH (vedi sopra), poi collega i client a `ws://127.0.0.1:18789`.
- Su macOS, preferisci la modalità “Remote over SSH” dell'app, che gestisce automaticamente il tunnel.

## App macOS "Remote over SSH"

L'app macOS nella barra dei menu può gestire questa configurazione end-to-end (controlli di stato remoti, WebChat e inoltro Voice Wake).

Runbook: [accesso remoto macOS](/platforms/mac/remote).

## Regole di sicurezza (remoto/VPN)

Versione breve: **mantieni il Gateway accessibile solo via loopback** a meno che tu non sia sicuro di aver bisogno di un bind.

- **Loopback + SSH/Tailscale Serve** è il valore predefinito più sicuro (nessuna esposizione pubblica).
- `ws://` in chiaro è limitato al loopback per impostazione predefinita. Per reti private affidabili,
  imposta `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` nel processo client come opzione di emergenza.
- I **bind non loopback** (`lan`/`tailnet`/`custom`, oppure `auto` quando il loopback non è disponibile) devono usare l'autenticazione gateway: token, password o un reverse proxy identity-aware con `gateway.auth.mode: "trusted-proxy"`.
- `gateway.remote.token` / `.password` sono sorgenti di credenziali del client. **Non** configurano da sole l'autenticazione del server.
- I percorsi di chiamata locali possono usare `gateway.remote.*` come fallback solo quando `gateway.auth.*` non è impostato.
- Se `gateway.auth.token` / `gateway.auth.password` sono configurati esplicitamente tramite SecretRef e non risolti, la risoluzione fallisce in modo sicuro (nessun fallback remoto che mascheri il problema).
- `gateway.remote.tlsFingerprint` fissa il certificato TLS remoto quando si usa `wss://`.
- **Tailscale Serve** può autenticare il traffico Control UI/WebSocket tramite header di identità quando `gateway.auth.allowTailscale: true`; gli endpoint HTTP API non
  usano questa autenticazione header di Tailscale e seguono invece la normale modalità HTTP
  del gateway. Questo flusso senza token presuppone che l'host gateway sia attendibile. Impostalo su
  `false` se vuoi l'autenticazione con secret condiviso ovunque.
- L'autenticazione **trusted-proxy** è pensata solo per configurazioni non-loopback con proxy identity-aware.
  I reverse proxy loopback sullo stesso host non soddisfano `gateway.auth.mode: "trusted-proxy"`.
- Considera il controllo del browser come accesso da operatore: solo tailnet + pairing deliberato del nodo.

Approfondimento: [Sicurezza](/gateway/security).

### macOS: tunnel SSH persistente tramite LaunchAgent

Per i client macOS che si connettono a un gateway remoto, la configurazione persistente più semplice usa una voce `LocalForward` nella configurazione SSH più un LaunchAgent per mantenere attivo il tunnel tra riavvii e crash.

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

Salva il token nella configurazione così resta persistente tra i riavvii:

```bash
openclaw config set gateway.remote.token "<your-token>"
```

#### Passaggio 4: crea il LaunchAgent

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

#### Passaggio 5: carica il LaunchAgent

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

Arresta il tunnel:

```bash
launchctl bootout gui/$UID/ai.openclaw.ssh-tunnel
```

| Voce di configurazione               | Cosa fa                                                      |
| ------------------------------------ | ------------------------------------------------------------ |
| `LocalForward 18789 127.0.0.1:18789` | Inoltra la porta locale 18789 alla porta remota 18789        |
| `ssh -N`                             | SSH senza eseguire comandi remoti (solo port forwarding)     |
| `KeepAlive`                          | Riavvia automaticamente il tunnel se va in crash             |
| `RunAtLoad`                          | Avvia il tunnel quando il LaunchAgent viene caricato al login |
