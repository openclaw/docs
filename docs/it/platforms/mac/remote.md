---
read_when:
    - Configurazione o risoluzione dei problemi del controllo remoto del Mac
summary: flusso dell'app macOS per controllare un Gateway OpenClaw remoto
title: Controllo remoto
x-i18n:
    generated_at: "2026-07-03T23:34:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4d1ac5065011ef16085b3349ee7224fe3e806a6de61feaac2dcd5c9ed264227e
    source_path: platforms/mac/remote.md
    workflow: 16
---

Questo flusso consente all'app macOS di agire come controllo remoto completo per un Gateway OpenClaw in esecuzione su un altro host (desktop/server). L'app può connettersi direttamente a URL Gateway LAN/Tailnet attendibili oppure gestire un tunnel SSH quando il Gateway remoto è solo loopback. I controlli di integrità, l'inoltro del risveglio vocale e la Chat Web riutilizzano la stessa configurazione remota da _Impostazioni → Generali_.

## Modalità

- **Locale (questo Mac)**: tutto viene eseguito sul laptop. Nessun SSH coinvolto.
- **Remoto tramite SSH (predefinito)**: i comandi OpenClaw vengono eseguiti sull'host remoto. L'app Mac apre una connessione SSH con `-o BatchMode` più l'identità/chiave scelta e un inoltro di porta locale.
- **Remoto diretto (ws/wss)**: nessun tunnel SSH. L'app Mac si connette direttamente all'URL del Gateway (ad esempio tramite LAN, Tailscale, Tailscale Serve o un reverse proxy HTTPS pubblico).

## Trasporti remoti

La modalità remota supporta due trasporti:

- **Tunnel SSH** (predefinito): usa `ssh -N -L ...` per inoltrare la porta del Gateway a localhost. Il Gateway vedrà l'IP del nodo come `127.0.0.1` perché il tunnel è loopback.
- **Diretto (ws/wss)**: si connette direttamente all'URL del Gateway. Il Gateway vede l'IP reale del client.

L'app disabilita il multiplexing della connessione SSH e l'esecuzione in background post-autenticazione per i processi SSH gestiti dall'app, così può monitorare e riavviare il processo esatto anche quando l'alias selezionato abilita `ControlMaster` o `ForkAfterAuthentication`.

La verifica della chiave host SSH è rigorosa per impostazione predefinita perché le credenziali del Gateway passano attraverso questo tunnel. Per un alias SSH gestito di cui intendi usare esplicitamente il comportamento di attendibilità, abilitalo con `openclaw-mac configure-remote --ssh-target <alias> --ssh-host-key-policy openssh` oppure imposta `gateway.remote.sshHostKeyPolicy` su `"openssh"`. Questa abilitazione usa la policy effettiva delle chiavi host OpenSSH; prima controlla l'alias e qualsiasi configurazione `Host *` o di sistema corrispondente. Cambiare il target SSH nell'app o con `configure-remote` reimposta la policy su `strict`, a meno che tu non la abiliti esplicitamente di nuovo.

In modalità tunnel SSH, i nomi host LAN/tailnet rilevati vengono salvati come
`gateway.remote.sshTarget`. L'app mantiene `gateway.remote.url` sull'endpoint
locale del tunnel, ad esempio `ws://127.0.0.1:18789`, così CLI, Chat Web e
il servizio host del nodo locale usano tutti lo stesso trasporto loopback sicuro.
Quando il rilevamento restituisce sia IP Tailnet grezzi sia nomi host stabili, l'app
preferisce Tailscale MagicDNS o nomi LAN, così le connessioni remote resistono meglio
ai cambiamenti di indirizzo.
Se la porta locale del tunnel è diversa dalla porta del Gateway remoto, imposta
`gateway.remote.remotePort` sulla porta dell'host remoto.

L'automazione del browser in modalità remota è gestita dall'host del nodo CLI, non dal
nodo nativo dell'app macOS. L'app avvia il servizio host del nodo installato quando
possibile; se ti serve il controllo del browser da quel Mac, installalo/avvialo con
`openclaw node install ...` e `openclaw node start` (oppure esegui
`openclaw node run ...` in primo piano), quindi punta a quel nodo con capacità browser.

## Prerequisiti sull'host remoto

1. Installa Node + pnpm e compila/installa la CLI OpenClaw (`pnpm install && pnpm build && pnpm link --global`).
2. Assicurati che `openclaw` sia nel PATH per le shell non interattive (crea un symlink in `/usr/local/bin` o `/opt/homebrew/bin`, se necessario).
3. Solo per il trasporto SSH: apri SSH con autenticazione tramite chiave. Consigliamo gli IP **Tailscale** per una raggiungibilità stabile fuori dalla LAN.

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

Questo scrive la configurazione remota, contrassegna l'onboarding come completato e consente all'app di gestire
il trasporto selezionato all'avvio.

1. Apri _Impostazioni → Generali_.
2. In **OpenClaw viene eseguito**, scegli **Remoto** e imposta:
   - **Trasporto**: **Tunnel SSH** o **Diretto (ws/wss)**.
   - **Target SSH**: `user@host` (`:port` opzionale).
     - Se il Gateway è sulla stessa LAN e annuncia Bonjour, sceglilo dall'elenco rilevato per compilare automaticamente questo campo.
   - **URL Gateway** (solo Diretto): `wss://gateway.example.ts.net` (o `ws://...` per locale/LAN).
   - **File identità** (avanzato): percorso della tua chiave.
   - **Radice progetto** (avanzato): percorso del checkout remoto usato per i comandi.
   - **Percorso CLI** (avanzato): percorso opzionale a un entrypoint/binario `openclaw` eseguibile (compilato automaticamente quando annunciato).
3. Premi **Test remoto**. Il successo indica che il comando remoto `openclaw status --json` viene eseguito correttamente. Gli errori di solito indicano problemi di PATH/CLI; il codice di uscita 127 significa che la CLI non viene trovata da remoto.
4. I controlli di integrità e la Chat Web ora verranno eseguiti automaticamente tramite il trasporto selezionato.

## Chat Web

- **Tunnel SSH**: la Chat Web si connette al Gateway tramite la porta di controllo WebSocket inoltrata (predefinita 18789).
- **Diretto (ws/wss)**: la Chat Web si connette direttamente all'URL Gateway configurato.
- Non esiste più un server HTTP WebChat separato.

## Autorizzazioni

- L'host remoto richiede le stesse approvazioni TCC della modalità locale (Automazione, Accessibilità, Registrazione schermo, Microfono, Riconoscimento vocale, Notifiche). Esegui l'onboarding su quella macchina per concederle una volta.
- I nodi annunciano il proprio stato delle autorizzazioni tramite `node.list` / `node.describe`, così gli agenti sanno cosa è disponibile.

## Note di sicurezza

- Preferisci bind loopback sull'host remoto e connettiti tramite SSH, Tailscale Serve o un URL diretto Tailnet/LAN attendibile.
- Il tunneling SSH richiede per impostazione predefinita una chiave host già attendibile. Considera prima attendibile la chiave host, così esiste nel file known-hosts configurato, oppure scegli esplicitamente `gateway.remote.sshHostKeyPolicy: "openssh"` per un alias gestito di cui accetti la policy di attendibilità OpenSSH.
- Se esponi il Gateway su un'interfaccia non loopback, richiedi un'autenticazione Gateway valida: token, password o un reverse proxy identity-aware con `gateway.auth.mode: "trusted-proxy"`.
- Vedi [Sicurezza](/it/gateway/security) e [Tailscale](/it/gateway/tailscale).

## Flusso di accesso WhatsApp (remoto)

- Esegui `openclaw channels login --verbose` **sull'host remoto**. Scansiona il QR con WhatsApp sul telefono.
- Esegui di nuovo l'accesso su quell'host se l'autenticazione scade. Il controllo di integrità segnalerà i problemi di collegamento.

## Risoluzione dei problemi

- **exit 127 / non trovato**: `openclaw` non è nel PATH per le shell non di login. Aggiungilo a `/etc/paths`, al file rc della tua shell oppure crea un symlink in `/usr/local/bin`/`/opt/homebrew/bin`.
- **Sonda di integrità non riuscita**: controlla la raggiungibilità SSH, il PATH e che Baileys abbia effettuato l'accesso (`openclaw status --json`).
- **Chat Web bloccata**: conferma che il Gateway sia in esecuzione sull'host remoto e che la porta inoltrata corrisponda alla porta WS del Gateway; l'interfaccia richiede una connessione WS integra.
- **L'IP del nodo mostra 127.0.0.1**: previsto con il tunnel SSH. Cambia **Trasporto** in **Diretto (ws/wss)** se vuoi che il Gateway veda l'IP reale del client.
- **La dashboard funziona ma le capacità del Mac sono offline**: significa che la connessione operatore/controllo dell'app è integra, ma la connessione del nodo companion non è connessa o non ha la propria superficie di comandi. Apri la sezione dispositivo della barra dei menu e controlla se il Mac è `paired · disconnected`. Per gli endpoint Tailscale Serve `wss://*.ts.net`, l'app rileva pin TLS leaf legacy obsoleti dopo la rotazione del certificato, cancella il pin obsoleto quando macOS considera attendibile il nuovo certificato e riprova automaticamente. Se il certificato non è considerato attendibile dal sistema o l'host non è un nome Tailscale Serve, imposta `gateway.remote.tlsFingerprint` sull'impronta digitale attesa del certificato, controlla il certificato oppure passa a **Remoto tramite SSH**.
- **Risveglio vocale**: le frasi di attivazione vengono inoltrate automaticamente in modalità remota; non è necessario un inoltratore separato.

## Suoni delle notifiche

Scegli i suoni per notifica dagli script con `openclaw` e `node.invoke`, ad esempio:

```bash
openclaw nodes notify --node <id> --title "Ping" --body "Remote gateway ready" --sound Glass
```

Non esiste più un interruttore globale "suono predefinito" nell'app; i chiamanti scelgono un suono (o nessuno) per ogni richiesta.

## Correlati

- [app macOS](/it/platforms/macos)
- [Accesso remoto](/it/gateway/remote)
