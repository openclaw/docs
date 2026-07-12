---
read_when:
    - Configurazione o debug del controllo remoto del Mac
summary: Flusso dell'app macOS per controllare un Gateway OpenClaw remoto
title: Controllo remoto
x-i18n:
    generated_at: "2026-07-12T07:14:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bd3ee71838737c1b8cf67d91d00b135283f4284400c75309646e62921e8c3633
    source_path: platforms/mac/remote.md
    workflow: 16
---

Questo flusso consente all'app macOS di agire come telecomando completo per un Gateway OpenClaw in esecuzione su un altro host (desktop/server). L'app si connette direttamente agli URL del Gateway attendibili sulla LAN/Tailnet oppure gestisce un tunnel SSH quando il Gateway remoto è accessibile solo tramite local loopback. I controlli di integrità, l'inoltro di Voice Wake e Web Chat riutilizzano la stessa configurazione remota da _Settings -> General_.

## Modalità

- **Locale (questo Mac)**: tutto viene eseguito sul portatile; SSH non è coinvolto.
- **Remota tramite SSH (predefinita)**: i comandi OpenClaw vengono eseguiti sull'host remoto. L'app apre una connessione SSH con `-o BatchMode`, l'identità/chiave scelta e un port forwarding locale.
- **Remota diretta (ws/wss)**: nessun tunnel SSH; l'app si connette direttamente all'URL del Gateway (LAN, Tailscale, Tailscale Serve o un reverse proxy HTTPS pubblico).

## Trasporti remoti

- **Tunnel SSH** (predefinito): usa `ssh -N -L ...` per inoltrare la porta del Gateway a localhost. Il Gateway vede l'indirizzo IP del Node come `127.0.0.1` perché il tunnel utilizza il local loopback.
- **Diretto (ws/wss)**: si connette direttamente all'URL del Gateway. Il Gateway vede l'indirizzo IP reale del client.

L'app disabilita il multiplexing delle connessioni SSH e l'esecuzione in background dopo l'autenticazione per i propri processi SSH, in modo da poter monitorare e riavviare esattamente il processo interessato, anche se l'alias selezionato abilita `ControlMaster` o `ForkAfterAuthentication`.

La verifica della chiave host SSH è rigorosa per impostazione predefinita, poiché le credenziali del Gateway transitano attraverso questo tunnel. Per utilizzare il comportamento di attendibilità proprio di un alias SSH gestito, imposta `--ssh-host-key-policy openssh` tramite `openclaw-mac configure-remote` oppure imposta direttamente `gateway.remote.sshHostKeyPolicy` su `"openssh"`. Prima di procedere, esamina l'alias e qualsiasi configurazione `Host *` corrispondente o configurazione di sistema. La modifica della destinazione SSH (nell'app o tramite `configure-remote`) reimposta il criterio su `strict`, a meno che tu non scelga esplicitamente di nuovo l'opzione per la nuova destinazione.

In modalità tunnel SSH, i nomi host LAN/Tailnet rilevati vengono salvati come `gateway.remote.sshTarget`. L'app mantiene `gateway.remote.url` sull'endpoint del tunnel locale (ad esempio `ws://127.0.0.1:18789`), così la CLI, Web Chat e il servizio host del Node locale utilizzano tutti lo stesso trasporto local loopback. Quando il rilevamento restituisce sia indirizzi IP Tailnet grezzi sia nomi host stabili, l'app preferisce i nomi Tailscale MagicDNS o LAN, affinché le connessioni resistano meglio ai cambiamenti di indirizzo. Se la porta del tunnel locale è diversa dalla porta del Gateway remoto, imposta `gateway.remote.remotePort` sulla porta dell'host remoto.

L'automazione del browser in modalità remota è gestita dall'host del Node della CLI, non dal Node dell'app macOS nativa. Quando possibile, l'app avvia il servizio host del Node installato; per abilitare il controllo del browser da quel Mac, installalo/avvialo con `openclaw node install ...` e `openclaw node start` (oppure esegui `openclaw node run ...` in primo piano), quindi seleziona come destinazione quel Node con funzionalità browser.

## Prerequisiti sull'host remoto

1. Installa Node + pnpm e compila/installa la CLI OpenClaw (`pnpm install && pnpm build && pnpm link --global`).
2. Assicurati che `openclaw` sia disponibile nel PATH per le shell non interattive (se necessario, crea un collegamento simbolico in `/usr/local/bin` o `/opt/homebrew/bin`).
3. Per il trasporto SSH: configura l'autenticazione SSH basata su chiave. Gli indirizzi IP Tailscale sono consigliati per garantire una raggiungibilità stabile al di fuori della LAN.

## Configurazione dell'app macOS

Per preconfigurare l'app senza il flusso di benvenuto, tramite SSH:

```bash
openclaw-mac configure-remote \
  --ssh-target user@gateway-host \
  --local-port 18789 \
  --remote-port 18789 \
  --token "$OPENCLAW_GATEWAY_TOKEN"
```

In alternativa, per un Gateway già raggiungibile su una LAN o Tailnet attendibile, evita completamente SSH:

```bash
openclaw-mac configure-remote \
  --direct-url ws://192.168.0.202:18789 \
  --token "$OPENCLAW_GATEWAY_TOKEN"
```

Entrambe le forme scrivono in `~/.openclaw/openclaw.json`, contrassegnano l'onboarding come completato e consentono all'app di gestire il trasporto selezionato al successivo avvio. I valori predefiniti di `--local-port`/`--remote-port` sono `18789`. Altri flag: `--password`, `--identity <path>`, `--ssh-host-key-policy <strict|openssh>`, `--project-root <path>`, `--cli-path <path>`, `--json`. Esegui `openclaw-mac configure-remote --help` per la documentazione completa.

Per eseguire invece la configurazione dall'interfaccia:

1. Apri _Settings -> General_.
2. In **OpenClaw runs**, scegli **Remote** e imposta:
   - **Transport**: **SSH tunnel** o **Direct (ws/wss)**.
   - **SSH target**: `user@host` (`:port` facoltativa). Se il Gateway si trova sulla stessa LAN e si annuncia tramite Bonjour, selezionalo dall'elenco dei dispositivi rilevati per compilare automaticamente questo campo.
   - **Gateway URL** (solo Direct): `wss://gateway.example.ts.net` (oppure `ws://...` per locale/LAN).
   - **Identity file** (avanzato): percorso della chiave.
   - **Project root** (avanzato): percorso remoto del checkout utilizzato per i comandi.
   - **CLI path** (avanzato): percorso facoltativo di un punto di ingresso/binario `openclaw` eseguibile (compilato automaticamente quando annunciato).
3. Premi **Test remote**. L'esito positivo indica che il comando remoto `openclaw status --json` è stato eseguito correttamente. Gli errori indicano in genere problemi relativi al PATH o alla CLI; il codice di uscita 127 indica che la CLI non è stata trovata sull'host remoto.
4. I controlli di integrità e Web Chat ora vengono eseguiti automaticamente tramite il trasporto selezionato.

## Web Chat

- **Tunnel SSH**: si connette al Gateway tramite la porta di controllo WebSocket inoltrata (valore predefinito: 18789).
- **Diretto (ws/wss)**: si connette direttamente all'URL del Gateway configurato.
- Non esiste un server HTTP separato per Web Chat.

## Autorizzazioni

- L'host remoto necessita delle stesse autorizzazioni TCC dell'host locale (Automazione, Accessibilità, Registrazione schermo, Microfono, Riconoscimento vocale, Notifiche). Esegui una volta l'onboarding su tale macchina per concederle.
- I Node annunciano lo stato delle proprie autorizzazioni tramite `node.list` / `node.describe`, in modo che gli agenti sappiano quali funzionalità sono disponibili.

## Note sulla sicurezza

- Preferisci associazioni al local loopback sull'host remoto e connettiti tramite SSH, Tailscale Serve oppure un URL diretto attendibile su Tailnet/LAN.
- Per impostazione predefinita, il tunneling SSH richiede una chiave host già considerata attendibile. Rendi prima attendibile la chiave host (aggiungendola al file degli host noti configurato) oppure imposta esplicitamente `gateway.remote.sshHostKeyPolicy: "openssh"` per un alias gestito di cui accetti il criterio di attendibilità OpenSSH.
- Se associ il Gateway a un'interfaccia diversa dal local loopback, richiedi un'autenticazione Gateway valida: token, password oppure un reverse proxy sensibile all'identità con `gateway.auth.mode: "trusted-proxy"`.
- Consulta [Sicurezza](/it/gateway/security) e [Tailscale](/it/gateway/tailscale).

## Flusso di accesso a WhatsApp (remoto)

- Esegui `openclaw channels login --channel whatsapp --verbose` **sull'host remoto**. Scansiona il codice QR con WhatsApp sul telefono.
- Ripeti l'accesso su tale host se l'autenticazione scade. Il controllo di integrità segnala i problemi di collegamento.

## Risoluzione dei problemi

| Sintomo                                          | Causa / soluzione                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `exit 127` / comando non trovato                 | `openclaw` non è nel PATH per le shell non di login. Aggiungilo a `/etc/paths` o al file rc della shell, oppure crea un collegamento simbolico in `/usr/local/bin`/`/opt/homebrew/bin`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| Probe di integrità non riuscito                  | Verifica la raggiungibilità tramite SSH, il PATH e che Baileys (WhatsApp) abbia effettuato l'accesso (`openclaw status --json`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| Web Chat bloccata                                | Verifica che il Gateway sia in esecuzione sull'host remoto e che la porta inoltrata corrisponda alla porta WS del Gateway; l'interfaccia utente richiede una connessione WS funzionante.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| L'IP del Node mostra `127.0.0.1`                 | È il comportamento previsto con il tunnel SSH. Imposta **Trasporto** su **Diretto (ws/wss)** se vuoi che il Gateway rilevi l'IP reale del client.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| La dashboard funziona, ma le funzionalità del Mac sono offline | La connessione di operatore/controllo funziona, ma la connessione del Node complementare non è attiva o non dispone della relativa interfaccia di comandi. Apri la sezione dei dispositivi nella barra dei menu e verifica se il Mac risulta `abbinato · disconnesso`. Per gli endpoint Tailscale Serve `wss://*.ts.net`, dopo la rotazione del certificato l'app rileva i pin TLS foglia obsoleti del sistema precedente, elimina il pin obsoleto quando macOS considera attendibile il nuovo certificato e riprova automaticamente. Se il certificato non è considerato attendibile dal sistema o l'host non è un nome Tailscale Serve, imposta `gateway.remote.tlsFingerprint` sull'impronta digitale prevista del certificato, esamina il certificato oppure passa a **Connessione remota tramite SSH**. |
| Attivazione vocale                               | Le frasi di attivazione vengono inoltrate automaticamente in modalità remota; non è necessario un inoltratore separato.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |

## Suoni delle notifiche

Scegli un suono per ogni notifica dagli script con `openclaw nodes notify`, ad esempio:

```bash
openclaw nodes notify --node <id> --title "Ping" --body "Remote gateway ready" --sound Glass
```

Nell'app non è presente un'opzione globale per il suono predefinito; per ogni richiesta, i chiamanti scelgono un suono oppure nessun suono.

## Argomenti correlati

- [App macOS](/it/platforms/macos)
- [Accesso remoto](/it/gateway/remote)
