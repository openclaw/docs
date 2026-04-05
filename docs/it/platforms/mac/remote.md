---
read_when:
    - Configurare o eseguire il debug del controllo remoto da Mac
summary: Flusso dell'app macOS per controllare un gateway OpenClaw remoto tramite SSH
title: Controllo remoto
x-i18n:
    generated_at: "2026-04-05T13:58:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 96e46e603c2275d04596b5d1ae0fb6858bd1a102a727dc13924ffcd9808fdf7e
    source_path: platforms/mac/remote.md
    workflow: 15
---

# OpenClaw remoto (macOS ⇄ host remoto)

Questo flusso consente all'app macOS di agire come un controllo remoto completo per un gateway OpenClaw in esecuzione su un altro host (desktop/server). È la funzionalità **Remote over SSH** (esecuzione remota) dell'app. Tutte le funzionalità — controlli di integrità, inoltro Voice Wake e Web Chat — riutilizzano la stessa configurazione SSH remota da _Settings → General_.

## Modalità

- **Local (this Mac)**: tutto viene eseguito sul laptop. Nessun SSH coinvolto.
- **Remote over SSH (default)**: i comandi OpenClaw vengono eseguiti sull'host remoto. L'app Mac apre una connessione SSH con `-o BatchMode` più la tua identità/chiave scelta e un inoltro di porta locale.
- **Remote direct (ws/wss)**: nessun tunnel SSH. L'app Mac si connette direttamente all'URL del gateway (ad esempio tramite Tailscale Serve o un reverse proxy HTTPS pubblico).

## Trasporti remoti

La modalità remota supporta due trasporti:

- **Tunnel SSH** (predefinito): usa `ssh -N -L ...` per inoltrare la porta del gateway a localhost. Il gateway vedrà l'IP del nodo come `127.0.0.1` perché il tunnel è loopback.
- **Direct (ws/wss)**: si connette direttamente all'URL del gateway. Il gateway vede il vero IP del client.

## Prerequisiti sull'host remoto

1. Installa Node + pnpm e compila/installa la CLI OpenClaw (`pnpm install && pnpm build && pnpm link --global`).
2. Assicurati che `openclaw` sia nel PATH per le shell non interattive (crea un symlink in `/usr/local/bin` o `/opt/homebrew/bin` se necessario).
3. Apri SSH con autenticazione a chiave. Consigliamo gli IP **Tailscale** per una raggiungibilità stabile fuori LAN.

## Configurazione dell'app macOS

1. Apri _Settings → General_.
2. In **OpenClaw runs**, scegli **Remote over SSH** e imposta:
   - **Transport**: **SSH tunnel** oppure **Direct (ws/wss)**.
   - **SSH target**: `user@host` (facoltativo `:port`).
     - Se il gateway è sulla stessa LAN e pubblicizza Bonjour, selezionalo dall'elenco rilevato per compilare automaticamente questo campo.
   - **Gateway URL** (solo Direct): `wss://gateway.example.ts.net` (oppure `ws://...` per locale/LAN).
   - **Identity file** (avanzato): percorso della tua chiave.
   - **Project root** (avanzato): percorso remoto del checkout usato per i comandi.
   - **CLI path** (avanzato): percorso facoltativo a un entrypoint/binario `openclaw` eseguibile (compilato automaticamente quando pubblicizzato).
3. Premi **Test remote**. Il successo indica che `openclaw status --json` viene eseguito correttamente sul remoto. I fallimenti di solito significano problemi di PATH/CLI; l'uscita 127 significa che la CLI non viene trovata in remoto.
4. I controlli di integrità e Web Chat ora verranno eseguiti automaticamente attraverso questo tunnel SSH.

## Web Chat

- **Tunnel SSH**: Web Chat si connette al gateway tramite la porta di controllo WebSocket inoltrata (predefinita 18789).
- **Direct (ws/wss)**: Web Chat si connette direttamente all'URL gateway configurato.
- Non esiste più un server HTTP WebChat separato.

## Permessi

- L'host remoto necessita delle stesse approvazioni TCC di quello locale (Automation, Accessibility, Screen Recording, Microphone, Speech Recognition, Notifications). Esegui l'onboarding su quella macchina per concederle una volta.
- I nodi pubblicizzano il loro stato dei permessi tramite `node.list` / `node.describe` così gli agenti sanno cosa è disponibile.

## Note di sicurezza

- Preferisci bind loopback sull'host remoto e connettiti tramite SSH o Tailscale.
- Il tunneling SSH usa un controllo rigoroso della chiave host; considera attendibile prima la chiave host in modo che esista in `~/.ssh/known_hosts`.
- Se fai il bind del Gateway a un'interfaccia non loopback, richiedi un'autenticazione Gateway valida: token, password oppure un reverse proxy identity-aware con `gateway.auth.mode: "trusted-proxy"`.
- Vedi [Security](/gateway/security) e [Tailscale](/gateway/tailscale).

## Flusso di login WhatsApp (remoto)

- Esegui `openclaw channels login --verbose` **sull'host remoto**. Scansiona il codice QR con WhatsApp sul tuo telefono.
- Riesegui il login su quell'host se l'autenticazione scade. Il controllo di integrità mostrerà i problemi di collegamento.

## Troubleshooting

- **exit 127 / not found**: `openclaw` non è nel PATH per le shell non di login. Aggiungilo a `/etc/paths`, al file rc della tua shell oppure crea un symlink in `/usr/local/bin`/`/opt/homebrew/bin`.
- **Health probe failed**: controlla la raggiungibilità SSH, il PATH e che Baileys abbia effettuato il login (`openclaw status --json`).
- **Web Chat bloccata**: conferma che il gateway sia in esecuzione sull'host remoto e che la porta inoltrata corrisponda alla porta WS del gateway; la UI richiede una connessione WS integra.
- **L'IP del nodo mostra 127.0.0.1**: è previsto con il tunnel SSH. Passa **Transport** a **Direct (ws/wss)** se vuoi che il gateway veda il vero IP del client.
- **Voice Wake**: le frasi di attivazione vengono inoltrate automaticamente in modalità remota; non è necessario alcun forwarder separato.

## Suoni di notifica

Scegli i suoni per notifica dagli script con `openclaw` e `node.invoke`, ad esempio:

```bash
openclaw nodes notify --node <id> --title "Ping" --body "Remote gateway ready" --sound Glass
```

Nell'app non esiste più un'opzione globale per il “suono predefinito”; i chiamanti scelgono un suono (o nessuno) per ogni richiesta.
