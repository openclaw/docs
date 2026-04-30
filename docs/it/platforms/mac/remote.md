---
read_when:
    - Configurazione o debug del controllo remoto del Mac
summary: Flusso dell'app macOS per controllare un Gateway OpenClaw remoto tramite SSH
title: Controllo remoto
x-i18n:
    generated_at: "2026-04-30T16:29:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2c63f752c3636a253220310c7c8e57a28549704b74b2f0370bac432bae28a7d3
    source_path: platforms/mac/remote.md
    workflow: 16
---

# OpenClaw remoto (macOS ⇄ host remoto)

Questo flusso consente all’app macOS di agire come un controllo remoto completo per un Gateway OpenClaw in esecuzione su un altro host (desktop/server). È la funzionalità **Remoto su SSH** (esecuzione remota) dell’app. Tutte le funzionalità, ovvero controlli di integrità, inoltro di Voice Wake e Web Chat, riutilizzano la stessa configurazione SSH remota da _Impostazioni → Generali_.

## Modalità

- **Locale (questo Mac)**: tutto viene eseguito sul laptop. Nessun SSH coinvolto.
- **Remoto su SSH (predefinito)**: i comandi OpenClaw vengono eseguiti sull’host remoto. L’app Mac apre una connessione SSH con `-o BatchMode` più l’identità/chiave scelta e un port forwarding locale.
- **Remoto diretto (ws/wss)**: nessun tunnel SSH. L’app Mac si connette direttamente all’URL del Gateway (ad esempio tramite Tailscale Serve o un reverse proxy HTTPS pubblico).

## Trasporti remoti

La modalità remota supporta due trasporti:

- **Tunnel SSH** (predefinito): usa `ssh -N -L ...` per inoltrare la porta del Gateway a localhost. Il Gateway vedrà l’IP del nodo come `127.0.0.1` perché il tunnel è loopback.
- **Diretto (ws/wss)**: si connette direttamente all’URL del Gateway. Il Gateway vede il vero IP del client.

In modalità tunnel SSH, i nomi host LAN/tailnet rilevati vengono salvati come
`gateway.remote.sshTarget`. L’app mantiene `gateway.remote.url` sull’endpoint del
tunnel locale, ad esempio `ws://127.0.0.1:18789`, così CLI, Web Chat e
il servizio host del nodo locale usano tutti lo stesso trasporto loopback sicuro.

L’automazione del browser in modalità remota è di proprietà dell’host del nodo CLI, non del
nodo dell’app macOS nativa. L’app avvia il servizio host del nodo installato quando
possibile; se ti serve il controllo del browser da quel Mac, installalo/avvialo con
`openclaw node install ...` e `openclaw node start` (oppure esegui
`openclaw node run ...` in primo piano), quindi scegli come destinazione quel
nodo con capacità browser.

## Prerequisiti sull’host remoto

1. Installa Node + pnpm e compila/installa la CLI OpenClaw (`pnpm install && pnpm build && pnpm link --global`).
2. Assicurati che `openclaw` sia nel PATH per le shell non interattive (crea un symlink in `/usr/local/bin` o `/opt/homebrew/bin` se necessario).
3. Abilita SSH con autenticazione tramite chiave. Consigliamo gli IP **Tailscale** per una raggiungibilità stabile fuori dalla LAN.

## Configurazione dell’app macOS

1. Apri _Impostazioni → Generali_.
2. In **OpenClaw viene eseguito**, scegli **Remoto su SSH** e imposta:
   - **Trasporto**: **Tunnel SSH** o **Diretto (ws/wss)**.
   - **Destinazione SSH**: `user@host` (opzionale `:port`).
     - Se il Gateway è sulla stessa LAN e annuncia Bonjour, selezionalo dall’elenco rilevato per compilare automaticamente questo campo.
   - **URL del Gateway** (solo Diretto): `wss://gateway.example.ts.net` (oppure `ws://...` per locale/LAN).
   - **File identità** (avanzato): percorso della tua chiave.
   - **Root progetto** (avanzato): percorso del checkout remoto usato per i comandi.
   - **Percorso CLI** (avanzato): percorso facoltativo a un entrypoint/binario `openclaw` eseguibile (compilato automaticamente quando annunciato).
3. Premi **Testa remoto**. Il successo indica che `openclaw status --json` remoto viene eseguito correttamente. Gli errori di solito indicano problemi di PATH/CLI; exit 127 significa che la CLI non viene trovata da remoto.
4. I controlli di integrità e Web Chat verranno ora eseguiti automaticamente attraverso questo tunnel SSH.

## Web Chat

- **Tunnel SSH**: Web Chat si connette al Gateway tramite la porta di controllo WebSocket inoltrata (predefinita 18789).
- **Diretto (ws/wss)**: Web Chat si connette direttamente all’URL del Gateway configurato.
- Non esiste più un server HTTP WebChat separato.

## Autorizzazioni

- L’host remoto richiede le stesse approvazioni TCC del locale (Automazione, Accessibilità, Registrazione schermo, Microfono, Riconoscimento vocale, Notifiche). Esegui l’onboarding su quella macchina per concederle una volta.
- I nodi annunciano il loro stato delle autorizzazioni tramite `node.list` / `node.describe`, così gli agenti sanno cosa è disponibile.

## Note sulla sicurezza

- Preferisci bind loopback sull’host remoto e connettiti tramite SSH o Tailscale.
- Il tunneling SSH usa il controllo rigoroso della chiave host; considera attendibile prima la chiave host, così esiste in `~/.ssh/known_hosts`.
- Se esegui il bind del Gateway a un’interfaccia non loopback, richiedi un’autenticazione Gateway valida: token, password o un reverse proxy consapevole dell’identità con `gateway.auth.mode: "trusted-proxy"`.
- Vedi [Sicurezza](/it/gateway/security) e [Tailscale](/it/gateway/tailscale).

## Flusso di accesso WhatsApp (remoto)

- Esegui `openclaw channels login --verbose` **sull’host remoto**. Scansiona il QR con WhatsApp sul telefono.
- Riesegui il login su quell’host se l’autenticazione scade. Il controllo di integrità segnalerà i problemi di collegamento.

## Risoluzione dei problemi

- **exit 127 / non trovato**: `openclaw` non è nel PATH per le shell non di login. Aggiungilo a `/etc/paths`, al tuo shell rc, oppure crea un symlink in `/usr/local/bin`/`/opt/homebrew/bin`.
- **Probe di integrità non riuscito**: verifica la raggiungibilità SSH, il PATH e che Baileys abbia effettuato l’accesso (`openclaw status --json`).
- **Web Chat bloccata**: conferma che il Gateway sia in esecuzione sull’host remoto e che la porta inoltrata corrisponda alla porta WS del Gateway; l’interfaccia utente richiede una connessione WS integra.
- **L’IP del nodo mostra 127.0.0.1**: previsto con il tunnel SSH. Cambia **Trasporto** in **Diretto (ws/wss)** se vuoi che il Gateway veda il vero IP del client.
- **La dashboard funziona ma le capacità del Mac sono offline**: significa che la connessione operatore/controllo dell’app è integra, ma la connessione del nodo companion non è connessa o manca della sua superficie di comando. Apri la sezione dispositivo nella barra dei menu e controlla se il Mac è `paired · disconnected`. Per endpoint Tailscale Serve `wss://*.ts.net`, l’app rileva i vecchi pin TLS leaf obsoleti dopo la rotazione del certificato, cancella il pin obsoleto quando macOS considera attendibile il nuovo certificato e riprova automaticamente. Se il certificato non è attendibile per il sistema o l’host non è un nome Tailscale Serve, controlla il certificato oppure passa a **Remoto su SSH**.
- **Voice Wake**: le frasi di attivazione vengono inoltrate automaticamente in modalità remota; non serve un inoltratore separato.

## Suoni delle notifiche

Scegli i suoni per notifica dagli script con `openclaw` e `node.invoke`, ad esempio:

```bash
openclaw nodes notify --node <id> --title "Ping" --body "Remote gateway ready" --sound Glass
```

Non esiste più nell’app un interruttore globale per il “suono predefinito”; i chiamanti scelgono un suono (o nessuno) per ogni richiesta.

## Correlati

- [App macOS](/it/platforms/macos)
- [Accesso remoto](/it/gateway/remote)
