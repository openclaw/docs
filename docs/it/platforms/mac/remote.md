---
read_when:
    - Configurazione o debug del controllo remoto del Mac
summary: flusso dell’app macOS per controllare un Gateway OpenClaw remoto
title: Controllo remoto
x-i18n:
    generated_at: "2026-06-28T00:12:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 96ac4af5af9d3250f907818751120984106c3c7bcb1f3349d3f0678b4fefb120
    source_path: platforms/mac/remote.md
    workflow: 16
---

Questo flusso consente all'app macOS di agire come controllo remoto completo per un Gateway OpenClaw in esecuzione su un altro host (desktop/server). L'app può connettersi direttamente a URL del Gateway LAN/Tailnet attendibili o gestire un tunnel SSH quando il Gateway remoto è solo loopback. I controlli di integrità, l'inoltro di Voice Wake e Web Chat riutilizzano la stessa configurazione remota da _Impostazioni → Generale_.

## Modalità

- **Locale (questo Mac)**: tutto viene eseguito sul portatile. SSH non è coinvolto.
- **Remoto tramite SSH (predefinito)**: i comandi OpenClaw vengono eseguiti sull'host remoto. L'app Mac apre una connessione SSH con `-o BatchMode` più l'identità/chiave scelta e un inoltro di porta locale.
- **Remoto diretto (ws/wss)**: nessun tunnel SSH. L'app Mac si connette direttamente all'URL del Gateway (ad esempio tramite LAN, Tailscale, Tailscale Serve o un reverse proxy HTTPS pubblico).

## Trasporti remoti

La modalità remota supporta due trasporti:

- **Tunnel SSH** (predefinito): usa `ssh -N -L ...` per inoltrare la porta del Gateway a localhost. Il Gateway vedrà l'IP del Node come `127.0.0.1` perché il tunnel è loopback.
- **Diretto (ws/wss)**: si connette direttamente all'URL del Gateway. Il Gateway vede l'IP reale del client.

In modalità tunnel SSH, i nomi host LAN/tailnet rilevati vengono salvati come
`gateway.remote.sshTarget`. L'app mantiene `gateway.remote.url` sull'endpoint
del tunnel locale, ad esempio `ws://127.0.0.1:18789`, così CLI, Web Chat e
il servizio node-host locale usano tutti lo stesso trasporto loopback sicuro.
Quando il rilevamento restituisce sia IP Tailnet grezzi sia nomi host stabili, l'app
preferisce Tailscale MagicDNS o nomi LAN, così le connessioni remote resistono meglio
ai cambi di indirizzo.
Se la porta del tunnel locale è diversa dalla porta del Gateway remoto, imposta
`gateway.remote.remotePort` sulla porta dell'host remoto.

L'automazione del browser in modalità remota è di proprietà dell'host Node CLI, non del
Node nativo dell'app macOS. L'app avvia il servizio host Node installato quando
possibile; se ti serve il controllo del browser da quel Mac, installalo/avvialo con
`openclaw node install ...` e `openclaw node start` (oppure esegui
`openclaw node run ...` in primo piano), quindi scegli come destinazione quel
Node con capacità browser.

## Prerequisiti sull'host remoto

1. Installa Node + pnpm e compila/installa la CLI OpenClaw (`pnpm install && pnpm build && pnpm link --global`).
2. Assicurati che `openclaw` sia nel PATH per shell non interattive (crea un symlink in `/usr/local/bin` o `/opt/homebrew/bin` se necessario).
3. Solo per il trasporto SSH: apri SSH con autenticazione a chiave. Consigliamo gli IP **Tailscale** per una raggiungibilità stabile fuori dalla LAN.

## Configurazione dell'app macOS

Per preconfigurare l'app senza il flusso di benvenuto:

```bash
openclaw-mac configure-remote \
  --ssh-target user@gateway.local \
  --local-port 18789 \
  --remote-port 18789 \
  --token "$OPENCLAW_GATEWAY_TOKEN"
```

Per un Gateway già raggiungibile su una LAN o Tailnet attendibile, salta completamente SSH:

```bash
openclaw-mac configure-remote \
  --direct-url ws://192.168.0.202:18789 \
  --token "$OPENCLAW_GATEWAY_TOKEN"
```

Questo scrive la configurazione remota, contrassegna l'onboarding come completato e consente all'app di possedere
il trasporto selezionato all'avvio.

1. Apri _Impostazioni → Generale_.
2. In **OpenClaw runs**, scegli **Remoto** e imposta:
   - **Trasporto**: **Tunnel SSH** o **Diretto (ws/wss)**.
   - **Destinazione SSH**: `user@host` (`:port` opzionale).
     - Se il Gateway è sulla stessa LAN e pubblicizza Bonjour, selezionalo dall'elenco rilevato per compilare automaticamente questo campo.
   - **URL Gateway** (solo diretto): `wss://gateway.example.ts.net` (o `ws://...` per locale/LAN).
   - **File identità** (avanzato): percorso della tua chiave.
   - **Radice progetto** (avanzato): percorso del checkout remoto usato per i comandi.
   - **Percorso CLI** (avanzato): percorso opzionale a un entrypoint/binario `openclaw` eseguibile (compilato automaticamente quando pubblicizzato).
3. Premi **Test remoto**. Il successo indica che `openclaw status --json` remoto viene eseguito correttamente. Gli errori di solito indicano problemi di PATH/CLI; il codice di uscita 127 significa che la CLI non viene trovata da remoto.
4. I controlli di integrità e Web Chat ora passeranno automaticamente attraverso il trasporto selezionato.

## Web Chat

- **Tunnel SSH**: Web Chat si connette al Gateway tramite la porta di controllo WebSocket inoltrata (predefinita 18789).
- **Diretto (ws/wss)**: Web Chat si connette direttamente all'URL del Gateway configurato.
- Non esiste più un server HTTP WebChat separato.

## Permessi

- L'host remoto necessita delle stesse approvazioni TCC del locale (Automazione, Accessibilità, Registrazione schermo, Microfono, Riconoscimento vocale, Notifiche). Esegui l'onboarding su quella macchina per concederle una volta.
- I Node pubblicizzano il proprio stato dei permessi tramite `node.list` / `node.describe`, così gli agenti sanno cosa è disponibile.

## Note sulla sicurezza

- Preferisci bind loopback sull'host remoto e connettiti tramite SSH, Tailscale Serve o un URL diretto Tailnet/LAN attendibile.
- Il tunneling SSH usa un controllo rigoroso della chiave host; considera attendibile prima la chiave host così che esista in `~/.ssh/known_hosts`.
- Se esponi il Gateway su un'interfaccia non loopback, richiedi un'autenticazione Gateway valida: token, password o un reverse proxy identity-aware con `gateway.auth.mode: "trusted-proxy"`.
- Vedi [Sicurezza](/it/gateway/security) e [Tailscale](/it/gateway/tailscale).

## Flusso di accesso WhatsApp (remoto)

- Esegui `openclaw channels login --verbose` **sull'host remoto**. Scansiona il QR con WhatsApp sul telefono.
- Riesegui l'accesso su quell'host se l'autenticazione scade. Il controllo di integrità segnalerà i problemi di collegamento.

## Risoluzione dei problemi

- **exit 127 / non trovato**: `openclaw` non è nel PATH per shell non di login. Aggiungilo a `/etc/paths`, al tuo rc della shell, oppure crea un symlink in `/usr/local/bin`/`/opt/homebrew/bin`.
- **Sonda di integrità non riuscita**: controlla la raggiungibilità SSH, il PATH e che Baileys abbia effettuato l'accesso (`openclaw status --json`).
- **Web Chat bloccata**: conferma che il Gateway sia in esecuzione sull'host remoto e che la porta inoltrata corrisponda alla porta WS del Gateway; l'interfaccia richiede una connessione WS sana.
- **L'IP del Node mostra 127.0.0.1**: previsto con il tunnel SSH. Cambia **Trasporto** in **Diretto (ws/wss)** se vuoi che il Gateway veda l'IP reale del client.
- **La Dashboard funziona ma le capacità del Mac sono offline**: significa che la connessione operatore/controllo dell'app è sana, ma la connessione del Node companion non è connessa o manca della sua superficie di comando. Apri la sezione del dispositivo nella barra dei menu e controlla se il Mac è `paired · disconnected`. Per gli endpoint Tailscale Serve `wss://*.ts.net`, l'app rileva i vecchi pin TLS leaf obsoleti dopo la rotazione del certificato, cancella il pin obsoleto quando macOS considera attendibile il nuovo certificato e riprova automaticamente. Se il certificato non è considerato attendibile dal sistema o l'host non è un nome Tailscale Serve, imposta `gateway.remote.tlsFingerprint` sull'impronta prevista del certificato, verifica il certificato oppure passa a **Remoto tramite SSH**.
- **Voice Wake**: le frasi di attivazione vengono inoltrate automaticamente in modalità remota; non serve un inoltratore separato.

## Suoni delle notifiche

Scegli i suoni per notifica dagli script con `openclaw` e `node.invoke`, ad esempio:

```bash
openclaw nodes notify --node <id> --title "Ping" --body "Remote gateway ready" --sound Glass
```

Non esiste più un interruttore globale "suono predefinito" nell'app; i chiamanti scelgono un suono (o nessuno) per ogni richiesta.

## Correlati

- [App macOS](/it/platforms/macos)
- [Accesso remoto](/it/gateway/remote)
