---
read_when:
    - Configurazione o debug del controllo remoto del Mac
summary: Flusso dell’app macOS per controllare un Gateway OpenClaw remoto tramite SSH
title: Controllo remoto
x-i18n:
    generated_at: "2026-05-06T09:00:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: bd7eb110f4c3e6a52b4b9baeccce4ef9d02c01104c188940c28f245bc161894a
    source_path: platforms/mac/remote.md
    workflow: 16
---

Questo flusso consente all'app macOS di agire come controllo remoto completo per un Gateway OpenClaw in esecuzione su un altro host (desktop/server). È la funzionalità **Remoto tramite SSH** (esecuzione remota) dell'app. Tutte le funzionalità, controlli di integrità, inoltro del Risveglio vocale e Chat Web, riutilizzano la stessa configurazione SSH remota da _Impostazioni → Generali_.

## Modalità

- **Locale (questo Mac)**: tutto viene eseguito sul laptop. Nessun SSH coinvolto.
- **Remoto tramite SSH (predefinito)**: i comandi OpenClaw vengono eseguiti sull'host remoto. L'app Mac apre una connessione SSH con `-o BatchMode` più l'identità/chiave scelta e un port-forward locale.
- **Diretto remoto (ws/wss)**: nessun tunnel SSH. L'app Mac si connette direttamente all'URL del Gateway (ad esempio, tramite Tailscale Serve o un proxy inverso HTTPS pubblico).

## Trasporti remoti

La modalità remota supporta due trasporti:

- **Tunnel SSH** (predefinito): usa `ssh -N -L ...` per inoltrare la porta del Gateway a localhost. Il Gateway vedrà l'IP del Node come `127.0.0.1` perché il tunnel è loopback.
- **Diretto (ws/wss)**: si connette direttamente all'URL del Gateway. Il Gateway vede il vero IP del client.

In modalità tunnel SSH, i nomi host LAN/tailnet rilevati vengono salvati come
`gateway.remote.sshTarget`. L'app mantiene `gateway.remote.url` sull'endpoint
locale del tunnel, ad esempio `ws://127.0.0.1:18789`, così CLI, Chat Web e
il servizio host Node locale usano tutti lo stesso trasporto local loopback sicuro.

L'automazione del browser in modalità remota è di proprietà dell'host Node della CLI, non del
Node nativo dell'app macOS. L'app avvia il servizio host Node installato quando
possibile; se ti serve il controllo del browser da quel Mac, installalo/avvialo con
`openclaw node install ...` e `openclaw node start` (oppure esegui
`openclaw node run ...` in primo piano), quindi punta a quel
Node con capacità browser.

## Prerequisiti sull'host remoto

1. Installa Node + pnpm e compila/installa la CLI OpenClaw (`pnpm install && pnpm build && pnpm link --global`).
2. Assicurati che `openclaw` sia nel PATH per shell non interattive (crea un symlink in `/usr/local/bin` o `/opt/homebrew/bin` se necessario).
3. Apri SSH con autenticazione a chiave. Consigliamo gli IP **Tailscale** per una raggiungibilità stabile fuori LAN.

## Configurazione dell'app macOS

1. Apri _Impostazioni → Generali_.
2. In **OpenClaw viene eseguito**, scegli **Remoto tramite SSH** e imposta:
   - **Trasporto**: **Tunnel SSH** o **Diretto (ws/wss)**.
   - **Destinazione SSH**: `user@host` (`:port` facoltativo).
     - Se il Gateway è sulla stessa LAN e annuncia Bonjour, selezionalo dall'elenco rilevato per compilare automaticamente questo campo.
   - **URL Gateway** (solo Diretto): `wss://gateway.example.ts.net` (o `ws://...` per locale/LAN).
   - **File identità** (avanzato): percorso della tua chiave.
   - **Radice progetto** (avanzato): percorso del checkout remoto usato per i comandi.
   - **Percorso CLI** (avanzato): percorso facoltativo a un entrypoint/binario `openclaw` eseguibile (compilato automaticamente quando annunciato).
3. Premi **Test remoto**. Il successo indica che il comando remoto `openclaw status --json` viene eseguito correttamente. Gli errori di solito indicano problemi di PATH/CLI; il codice di uscita 127 significa che la CLI non viene trovata in remoto.
4. I controlli di integrità e la Chat Web ora passeranno automaticamente attraverso questo tunnel SSH.

## Chat Web

- **Tunnel SSH**: la Chat Web si connette al Gateway tramite la porta di controllo WebSocket inoltrata (predefinita 18789).
- **Diretto (ws/wss)**: la Chat Web si connette direttamente all'URL Gateway configurato.
- Non esiste più un server HTTP separato per WebChat.

## Autorizzazioni

- L'host remoto richiede le stesse approvazioni TCC della modalità locale (Automazione, Accessibilità, Registrazione schermo, Microfono, Riconoscimento vocale, Notifiche). Esegui l'onboarding su quella macchina per concederle una volta.
- I Node annunciano il proprio stato delle autorizzazioni tramite `node.list` / `node.describe` così gli agenti sanno cosa è disponibile.

## Note di sicurezza

- Preferisci bind loopback sull'host remoto e connettiti tramite SSH o Tailscale.
- Il tunneling SSH usa il controllo rigoroso della chiave host; considera attendibile prima la chiave host così esiste in `~/.ssh/known_hosts`.
- Se associ il Gateway a un'interfaccia non loopback, richiedi un'autenticazione Gateway valida: token, password o un proxy inverso identity-aware con `gateway.auth.mode: "trusted-proxy"`.
- Vedi [Sicurezza](/it/gateway/security) e [Tailscale](/it/gateway/tailscale).

## Flusso di accesso WhatsApp (remoto)

- Esegui `openclaw channels login --verbose` **sull'host remoto**. Scansiona il QR con WhatsApp sul telefono.
- Ripeti l'accesso su quell'host se l'autenticazione scade. Il controllo di integrità mostrerà i problemi di collegamento.

## Risoluzione dei problemi

- **exit 127 / non trovato**: `openclaw` non è nel PATH per shell non di login. Aggiungilo a `/etc/paths`, al file rc della tua shell, oppure crea un symlink in `/usr/local/bin`/`/opt/homebrew/bin`.
- **Sonda di integrità non riuscita**: controlla la raggiungibilità SSH, il PATH e che Baileys abbia effettuato l'accesso (`openclaw status --json`).
- **Chat Web bloccata**: conferma che il Gateway sia in esecuzione sull'host remoto e che la porta inoltrata corrisponda alla porta WS del Gateway; l'interfaccia richiede una connessione WS integra.
- **L'IP Node mostra 127.0.0.1**: previsto con il tunnel SSH. Cambia **Trasporto** in **Diretto (ws/wss)** se vuoi che il Gateway veda il vero IP del client.
- **La dashboard funziona ma le capacità Mac sono offline**: significa che la connessione operatore/controllo dell'app è integra, ma la connessione del Node companion non è connessa o manca della sua superficie di comandi. Apri la sezione dispositivo nella barra dei menu e controlla se il Mac è `paired · disconnected`. Per endpoint Tailscale Serve `wss://*.ts.net`, l'app rileva pin TLS foglia legacy obsoleti dopo la rotazione del certificato, cancella il pin obsoleto quando macOS considera attendibile il nuovo certificato e riprova automaticamente. Se il certificato non è considerato attendibile dal sistema o l'host non è un nome Tailscale Serve, controlla il certificato o passa a **Remoto tramite SSH**.
- **Risveglio vocale**: le frasi di attivazione vengono inoltrate automaticamente in modalità remota; non serve un inoltratore separato.

## Suoni di notifica

Scegli i suoni per ogni notifica da script con `openclaw` e `node.invoke`, ad esempio:

```bash
openclaw nodes notify --node <id> --title "Ping" --body "Remote gateway ready" --sound Glass
```

Nell'app non esiste più un interruttore globale per il "suono predefinito"; i chiamanti scelgono un suono (o nessuno) per ogni richiesta.

## Correlati

- [app macOS](/it/platforms/macos)
- [Accesso remoto](/it/gateway/remote)
