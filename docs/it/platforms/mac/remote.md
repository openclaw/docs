---
read_when:
    - Configurazione o debug del controllo remoto del Mac
summary: flusso dell'app macOS per controllare un Gateway OpenClaw remoto
title: Controllo remoto
x-i18n:
    generated_at: "2026-06-27T17:45:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b3634785f797af55f7dc6d217e0116313e8ef7d314c503275fbc66b54eb29a69
    source_path: platforms/mac/remote.md
    workflow: 16
---

Questo flusso consente all'app macOS di agire come controllo remoto completo per un gateway OpenClaw in esecuzione su un altro host (desktop/server). L'app può connettersi direttamente a URL del gateway LAN/Tailnet attendibili o gestire un tunnel SSH quando il gateway remoto è solo loopback. I controlli di integrità, l'inoltro di Voice Wake e la Chat web riutilizzano la stessa configurazione remota da _Impostazioni → Generali_.

## Modalità

- **Locale (questo Mac)**: tutto viene eseguito sul laptop. SSH non è coinvolto.
- **Remoto tramite SSH (predefinito)**: i comandi OpenClaw vengono eseguiti sull'host remoto. L'app Mac apre una connessione SSH con `-o BatchMode`, più l'identità/chiave scelta e un inoltro di porta locale.
- **Remoto diretto (ws/wss)**: nessun tunnel SSH. L'app Mac si connette direttamente all'URL del gateway (ad esempio tramite LAN, Tailscale, Tailscale Serve o un proxy inverso HTTPS pubblico).

## Trasporti remoti

La modalità remota supporta due trasporti:

- **Tunnel SSH** (predefinito): usa `ssh -N -L ...` per inoltrare la porta del gateway a localhost. Il gateway vedrà l'IP del nodo come `127.0.0.1` perché il tunnel è loopback.
- **Diretto (ws/wss)**: si connette direttamente all'URL del gateway. Il gateway vede l'IP reale del client.

In modalità tunnel SSH, i nomi host LAN/tailnet rilevati vengono salvati come
`gateway.remote.sshTarget`. L'app mantiene `gateway.remote.url` sull'endpoint
del tunnel locale, ad esempio `ws://127.0.0.1:18789`, quindi CLI, Chat web e
il servizio host del nodo locale usano tutti lo stesso trasporto loopback sicuro.
Se la porta del tunnel locale è diversa dalla porta del gateway remoto, imposta
`gateway.remote.remotePort` sulla porta dell'host remoto.

L'automazione del browser in modalità remota è di proprietà dell'host nodo CLI, non del
nodo dell'app macOS nativa. L'app avvia il servizio host nodo installato quando
possibile; se ti serve il controllo del browser da quel Mac, installalo/avvialo con
`openclaw node install ...` e `openclaw node start` (oppure esegui
`openclaw node run ...` in primo piano), quindi scegli come destinazione quel
nodo con capacità browser.

## Prerequisiti sull'host remoto

1. Installa Node + pnpm e compila/installa la CLI OpenClaw (`pnpm install && pnpm build && pnpm link --global`).
2. Assicurati che `openclaw` sia nel PATH per le shell non interattive (crea un symlink in `/usr/local/bin` o `/opt/homebrew/bin` se necessario).
3. Solo per il trasporto SSH: apri SSH con autenticazione tramite chiave. Consigliamo gli IP **Tailscale** per una raggiungibilità stabile fuori LAN.

## Configurazione dell'app macOS

Per preconfigurare l'app senza il flusso di benvenuto:

```bash
openclaw-mac configure-remote \
  --ssh-target user@gateway.local \
  --local-port 18789 \
  --remote-port 18789 \
  --token "$OPENCLAW_GATEWAY_TOKEN"
```

Per un gateway già raggiungibile su una LAN o Tailnet attendibile, salta completamente SSH:

```bash
openclaw-mac configure-remote \
  --direct-url ws://192.168.0.202:18789 \
  --token "$OPENCLAW_GATEWAY_TOKEN"
```

Questo scrive la configurazione remota, contrassegna l'onboarding come completato e permette all'app di gestire
il trasporto selezionato all'avvio.

1. Apri _Impostazioni → Generali_.
2. In **OpenClaw viene eseguito**, scegli **Remoto** e imposta:
   - **Trasporto**: **Tunnel SSH** o **Diretto (ws/wss)**.
   - **Destinazione SSH**: `user@host` (`:port` opzionale).
     - Se il gateway è sulla stessa LAN e annuncia Bonjour, selezionalo dall'elenco rilevato per compilare automaticamente questo campo.
   - **URL gateway** (solo Diretto): `wss://gateway.example.ts.net` (o `ws://...` per locale/LAN).
   - **File identità** (avanzato): percorso della tua chiave.
   - **Root progetto** (avanzato): percorso del checkout remoto usato per i comandi.
   - **Percorso CLI** (avanzato): percorso opzionale a un entrypoint/binario `openclaw` eseguibile (compilato automaticamente quando annunciato).
3. Premi **Test remoto**. Il successo indica che il comando remoto `openclaw status --json` viene eseguito correttamente. Gli errori di solito indicano problemi di PATH/CLI; il codice di uscita 127 significa che la CLI non viene trovata da remoto.
4. I controlli di integrità e la Chat web ora verranno eseguiti automaticamente tramite il trasporto selezionato.

## Chat web

- **Tunnel SSH**: la Chat web si connette al gateway tramite la porta di controllo WebSocket inoltrata (predefinita 18789).
- **Diretto (ws/wss)**: la Chat web si connette direttamente all'URL del gateway configurato.
- Non esiste più un server HTTP separato per la Chat web.

## Permessi

- L'host remoto necessita delle stesse approvazioni TCC del locale (Automazione, Accessibilità, Registrazione schermo, Microfono, Riconoscimento vocale, Notifiche). Esegui l'onboarding su quella macchina per concederle una volta.
- I nodi annunciano il proprio stato dei permessi tramite `node.list` / `node.describe`, così gli agenti sanno cosa è disponibile.

## Note di sicurezza

- Preferisci bind loopback sull'host remoto e connettiti tramite SSH, Tailscale Serve o un URL diretto Tailnet/LAN attendibile.
- Il tunneling SSH usa il controllo rigoroso della chiave host; considera attendibile prima la chiave host, così esiste in `~/.ssh/known_hosts`.
- Se associ il Gateway a un'interfaccia non loopback, richiedi un'autenticazione Gateway valida: token, password o un proxy inverso consapevole dell'identità con `gateway.auth.mode: "trusted-proxy"`.
- Vedi [Sicurezza](/it/gateway/security) e [Tailscale](/it/gateway/tailscale).

## Flusso di accesso WhatsApp (remoto)

- Esegui `openclaw channels login --verbose` **sull'host remoto**. Scansiona il QR con WhatsApp sul telefono.
- Ripeti l'accesso su quell'host se l'autenticazione scade. Il controllo di integrità mostrerà i problemi di collegamento.

## Risoluzione dei problemi

- **codice di uscita 127 / non trovato**: `openclaw` non è nel PATH per le shell non di login. Aggiungilo a `/etc/paths`, al file rc della tua shell, oppure crea un symlink in `/usr/local/bin`/`/opt/homebrew/bin`.
- **Probe di integrità non riuscito**: controlla la raggiungibilità SSH, il PATH e che Baileys abbia effettuato l'accesso (`openclaw status --json`).
- **Chat web bloccata**: conferma che il gateway sia in esecuzione sull'host remoto e che la porta inoltrata corrisponda alla porta WS del gateway; l'interfaccia richiede una connessione WS integra.
- **L'IP del nodo mostra 127.0.0.1**: previsto con il tunnel SSH. Cambia **Trasporto** in **Diretto (ws/wss)** se vuoi che il gateway veda l'IP reale del client.
- **La dashboard funziona ma le capacità del Mac sono offline**: significa che la connessione operatore/controllo dell'app è integra, ma la connessione del nodo companion non è connessa o manca della sua superficie di comando. Apri la sezione dispositivi nella barra dei menu e controlla se il Mac è `paired · disconnected`. Per gli endpoint Tailscale Serve `wss://*.ts.net`, l'app rileva pin TLS legacy obsoleti del certificato leaf dopo la rotazione del certificato, cancella il pin obsoleto quando macOS considera attendibile il nuovo certificato e riprova automaticamente. Se il certificato non è considerato attendibile dal sistema o l'host non è un nome Tailscale Serve, imposta `gateway.remote.tlsFingerprint` sull'impronta prevista del certificato, rivedi il certificato oppure passa a **Remoto tramite SSH**.
- **Voice Wake**: le frasi di attivazione vengono inoltrate automaticamente in modalità remota; non serve un inoltratore separato.

## Suoni di notifica

Scegli i suoni per notifica dagli script con `openclaw` e `node.invoke`, ad esempio:

```bash
openclaw nodes notify --node <id> --title "Ping" --body "Remote gateway ready" --sound Glass
```

Nell'app non c'è più un interruttore globale per il "suono predefinito"; i chiamanti scelgono un suono (o nessuno) per ogni richiesta.

## Correlati

- [app macOS](/it/platforms/macos)
- [Accesso remoto](/it/gateway/remote)
