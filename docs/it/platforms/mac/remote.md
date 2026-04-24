---
read_when:
    - Configurazione o debug del controllo remoto macOS remoto
summary: Flusso dell'app macOS per controllare un gateway OpenClaw remoto tramite SSH
title: Controllo remoto
x-i18n:
    generated_at: "2026-04-24T08:50:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: c1b436fe35db300f719cf3e72530e74914df6023509907d485670746c29656d8
    source_path: platforms/mac/remote.md
    workflow: 15
---

# OpenClaw remoto (macOS ⇄ host remoto)

Questo flusso consente all'app macOS di agire come controllo remoto completo per un gateway OpenClaw in esecuzione su un altro host (desktop/server). È la funzionalità **Remote over SSH** (esecuzione remota) dell'app. Tutte le funzionalità—controlli di stato, inoltro Voice Wake e Web Chat—riutilizzano la stessa configurazione SSH remota da _Settings → General_.

## Modalità

- **Local (this Mac)**: tutto viene eseguito sul laptop. Nessun SSH coinvolto.
- **Remote over SSH (default)**: i comandi OpenClaw vengono eseguiti sull'host remoto. L'app mac apre una connessione SSH con `-o BatchMode` più la tua identità/chiave scelta e un port-forward locale.
- **Remote direct (ws/wss)**: nessun tunnel SSH. L'app mac si collega direttamente all'URL del gateway (ad esempio tramite Tailscale Serve o un reverse proxy HTTPS pubblico).

## Trasporti remoti

La modalità remota supporta due trasporti:

- **Tunnel SSH** (predefinito): usa `ssh -N -L ...` per inoltrare la porta del gateway a localhost. Il gateway vedrà l'IP del Node come `127.0.0.1` perché il tunnel è loopback.
- **Direct (ws/wss)**: si collega direttamente all'URL del gateway. Il gateway vede il vero IP del client.

## Prerequisiti sull'host remoto

1. Installa Node + pnpm e compila/installa la CLI OpenClaw (`pnpm install && pnpm build && pnpm link --global`).
2. Assicurati che `openclaw` sia nel PATH per shell non interattive (symlink in `/usr/local/bin` o `/opt/homebrew/bin` se necessario).
3. Apri SSH con autenticazione a chiave. Consigliamo IP **Tailscale** per una raggiungibilità stabile fuori LAN.

## Configurazione dell'app macOS

1. Apri _Settings → General_.
2. In **OpenClaw runs**, scegli **Remote over SSH** e imposta:
   - **Transport**: **SSH tunnel** oppure **Direct (ws/wss)**.
   - **SSH target**: `user@host` (facoltativo `:port`).
     - Se il gateway è sulla stessa LAN e pubblicizza Bonjour, selezionalo dall'elenco rilevato per compilare automaticamente questo campo.
   - **Gateway URL** (solo Direct): `wss://gateway.example.ts.net` (oppure `ws://...` per locale/LAN).
   - **Identity file** (avanzato): percorso della tua chiave.
   - **Project root** (avanzato): percorso del checkout remoto usato per i comandi.
   - **CLI path** (avanzato): percorso facoltativo a un entrypoint/binario `openclaw` eseguibile (compilato automaticamente quando pubblicizzato).
3. Premi **Test remote**. Il successo indica che `openclaw status --json` remoto viene eseguito correttamente. I fallimenti di solito indicano problemi PATH/CLI; il codice di uscita 127 significa che la CLI non viene trovata in remoto.
4. I controlli di stato e Web Chat ora passeranno automaticamente attraverso questo tunnel SSH.

## Web Chat

- **Tunnel SSH**: Web Chat si collega al gateway tramite la porta di controllo WebSocket inoltrata (predefinita 18789).
- **Direct (ws/wss)**: Web Chat si collega direttamente all'URL del gateway configurato.
- Non esiste più un server HTTP WebChat separato.

## Permessi

- L'host remoto richiede le stesse approvazioni TCC del locale (Automation, Accessibility, Screen Recording, Microphone, Speech Recognition, Notifications). Esegui l'onboarding su quella macchina per concederle una volta.
- I Node pubblicizzano il proprio stato dei permessi tramite `node.list` / `node.describe` così gli agenti sanno cosa è disponibile.

## Note di sicurezza

- Preferisci bind loopback sull'host remoto e collegati tramite SSH o Tailscale.
- Il tunneling SSH usa un rigoroso controllo della chiave host; considera attendibile la chiave host prima, in modo che esista in `~/.ssh/known_hosts`.
- Se colleghi il Gateway a un'interfaccia non-loopback, richiedi un'autenticazione Gateway valida: token, password o un reverse proxy consapevole dell'identità con `gateway.auth.mode: "trusted-proxy"`.
- Vedi [Security](/it/gateway/security) e [Tailscale](/it/gateway/tailscale).

## Flusso di login WhatsApp (remoto)

- Esegui `openclaw channels login --verbose` **sull'host remoto**. Scansiona il QR con WhatsApp sul telefono.
- Esegui di nuovo il login su quell'host se l'autenticazione scade. Il controllo di stato mostrerà i problemi di collegamento.

## Risoluzione dei problemi

- **exit 127 / not found**: `openclaw` non è nel PATH per le shell non-login. Aggiungilo a `/etc/paths`, al file rc della tua shell, oppure crea un symlink in `/usr/local/bin`/`/opt/homebrew/bin`.
- **Health probe failed**: controlla la raggiungibilità SSH, il PATH e che Baileys abbia effettuato l'accesso (`openclaw status --json`).
- **Web Chat bloccata**: conferma che il gateway sia in esecuzione sull'host remoto e che la porta inoltrata corrisponda alla porta WS del gateway; la UI richiede una connessione WS sana.
- **L'IP del Node mostra 127.0.0.1**: è previsto con il tunnel SSH. Passa **Transport** a **Direct (ws/wss)** se vuoi che il gateway veda il vero IP del client.
- **Voice Wake**: le frasi trigger vengono inoltrate automaticamente in modalità remota; non serve un inoltro separato.

## Suoni delle notifiche

Scegli i suoni per notifica dagli script con `openclaw` e `node.invoke`, ad esempio:

```bash
openclaw nodes notify --node <id> --title "Ping" --body "Remote gateway ready" --sound Glass
```

Non esiste più un toggle globale “default sound” nell'app; i chiamanti scelgono un suono (o nessuno) per ogni richiesta.

## Correlati

- [App macOS](/it/platforms/macos)
- [Accesso remoto](/it/gateway/remote)
