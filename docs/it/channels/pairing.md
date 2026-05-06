---
read_when:
    - Configurazione del controllo dell'accesso ai DM
    - Associazione di un nuovo nodo iOS/Android
    - Revisione della postura di sicurezza di OpenClaw
summary: 'Panoramica dell''associazione: approva chi può inviarti messaggi diretti + quali nodi possono unirsi'
title: Abbinamento
x-i18n:
    generated_at: "2026-05-06T08:41:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5543c10868418234714b175cd4bd373818be8dd40327121ac6c44819ed7519b2
    source_path: channels/pairing.md
    workflow: 16
---

“Abbinamento” è il passaggio esplicito di approvazione dell’accesso di OpenClaw.
Viene usato in due punti:

1. **Abbinamento DM** (chi è autorizzato a parlare con il bot)
2. **Abbinamento dei Node** (quali dispositivi/Node sono autorizzati a unirsi alla rete del Gateway)

Contesto di sicurezza: [Sicurezza](/it/gateway/security)

## 1) Abbinamento DM (accesso chat in ingresso)

Quando un canale è configurato con la policy DM `pairing`, i mittenti sconosciuti ricevono un codice breve e il loro messaggio **non viene elaborato** finché non approvi.

Le policy DM predefinite sono documentate in: [Sicurezza](/it/gateway/security)

`dmPolicy: "open"` è pubblico solo quando la allowlist DM effettiva include `"*"`.
La configurazione e la convalida richiedono quel carattere jolly per le configurazioni pubbliche aperte. Se lo stato esistente
contiene `open` con voci `allowFrom` concrete, a runtime vengono comunque ammessi
solo quei mittenti, e le approvazioni nello store di abbinamento non ampliano l’accesso `open`.

Codici di abbinamento:

- 8 caratteri, maiuscoli, senza caratteri ambigui (`0O1I`).
- **Scadono dopo 1 ora**. Il bot invia il messaggio di abbinamento solo quando viene creata una nuova richiesta (circa una volta all’ora per mittente).
- Le richieste di abbinamento DM in sospeso sono limitate per impostazione predefinita a **3 per canale**; le richieste aggiuntive vengono ignorate finché una non scade o viene approvata.

### Approvare un mittente

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

Se non è ancora configurato alcun proprietario dei comandi, l’approvazione di un codice di abbinamento DM inizializza anche
`commands.ownerAllowFrom` con il mittente approvato, ad esempio `telegram:123456789`.
Questo dà alle configurazioni iniziali un proprietario esplicito per i comandi privilegiati e le richieste di approvazione
dell’esecuzione. Dopo che esiste un proprietario, le approvazioni di abbinamento successive concedono solo l’accesso DM;
non aggiungono altri proprietari.

Canali supportati: `bluebubbles`, `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `matrix`, `mattermost`, `msteams`, `nextcloud-talk`, `nostr`, `openclaw-weixin`, `signal`, `slack`, `synology-chat`, `telegram`, `twitch`, `whatsapp`, `zalo`, `zalouser`.

### Gruppi di mittenti riutilizzabili

Usa `accessGroups` di livello superiore quando lo stesso insieme di mittenti fidati deve applicarsi a
più canali di messaggistica o sia alle allowlist DM sia a quelle di gruppo.

I gruppi statici usano `type: "message.senders"` e vengono referenziati con
`accessGroup:<name>` dalle allowlist dei canali:

```json5
{
  accessGroups: {
    operators: {
      type: "message.senders",
      members: {
        discord: ["discord:123456789012345678"],
        telegram: ["987654321"],
        whatsapp: ["+15551234567"],
      },
    },
  },
  channels: {
    telegram: { dmPolicy: "allowlist", allowFrom: ["accessGroup:operators"] },
    whatsapp: { groupPolicy: "allowlist", groupAllowFrom: ["accessGroup:operators"] },
  },
}
```

I gruppi di accesso sono documentati in dettaglio qui: [Gruppi di accesso](/it/channels/access-groups)

### Dove risiede lo stato

Archiviato in `~/.openclaw/credentials/`:

- Richieste in sospeso: `<channel>-pairing.json`
- Store allowlist approvata:
  - Account predefinito: `<channel>-allowFrom.json`
  - Account non predefinito: `<channel>-<accountId>-allowFrom.json`

Comportamento dell’ambito degli account:

- Gli account non predefiniti leggono/scrivono solo il loro file allowlist con ambito.
- L’account predefinito usa il file allowlist senza ambito specifico del canale.

Trattali come dati sensibili (regolano l’accesso al tuo assistente).

<Note>
Lo store allowlist di abbinamento è per l’accesso DM. L’autorizzazione di gruppo è separata.
L’approvazione di un codice di abbinamento DM non consente automaticamente a quel mittente di eseguire comandi di gruppo
o controllare il bot nei gruppi. L’inizializzazione del primo proprietario è uno stato di configurazione separato
in `commands.ownerAllowFrom`, e la consegna nelle chat di gruppo segue comunque le allowlist di gruppo
del canale (ad esempio `groupAllowFrom`, `groups` oppure override per gruppo
o per topic a seconda del canale).
</Note>

## 2) Abbinamento dei dispositivi Node (Node iOS/Android/macOS/headless)

I Node si connettono al Gateway come **dispositivi** con `role: node`. Il Gateway
crea una richiesta di abbinamento del dispositivo che deve essere approvata.

### Abbinare tramite Telegram (consigliato per iOS)

Se usi il Plugin `device-pair`, puoi effettuare il primo abbinamento del dispositivo interamente da Telegram:

1. In Telegram, invia un messaggio al tuo bot: `/pair`
2. Il bot risponde con due messaggi: un messaggio di istruzioni e un messaggio separato con il **codice di configurazione** (facile da copiare/incollare in Telegram).
3. Sul telefono, apri l’app OpenClaw per iOS → Settings → Gateway.
4. Scansiona il codice QR o incolla il codice di configurazione e connettiti.
5. Di nuovo in Telegram: `/pair pending` (controlla ID richiesta, ruolo e ambiti), poi approva.

Il codice di configurazione è un payload JSON codificato in base64 che contiene:

- `url`: l’URL WebSocket del Gateway (`ws://...` o `wss://...`)
- `bootstrapToken`: un token di bootstrap di breve durata per un singolo dispositivo usato per l’handshake di abbinamento iniziale

Quel token di bootstrap include il profilo di bootstrap di abbinamento integrato:

- il token `node` primario trasferito resta `scopes: []`
- qualsiasi token `operator` trasferito resta limitato alla allowlist di bootstrap:
  `operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`
- i controlli degli ambiti di bootstrap sono prefissati per ruolo, non un unico pool piatto di ambiti:
  le voci di ambito operatore soddisfano solo richieste operatore, e i ruoli non operatore
  devono comunque richiedere gli ambiti sotto il proprio prefisso di ruolo
- la rotazione/revoca successiva dei token resta limitata sia dal contratto di ruolo approvato
  del dispositivo sia dagli ambiti operatore della sessione chiamante

Tratta il codice di configurazione come una password finché è valido.

Per abbinamento mobile remoto tramite Tailscale, pubblico o altro, usa Tailscale Serve/Funnel
o un altro URL Gateway `wss://`. I codici di configurazione in chiaro `ws://` sono accettati solo
per loopback, indirizzi LAN privati, host Bonjour `.local` e host dell’emulatore
Android. Gli indirizzi CGNAT della tailnet, i nomi `.ts.net` e gli host pubblici continuano
a fallire in modo chiuso prima dell’emissione del QR/codice di configurazione.

### Approvare un dispositivo Node

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Quando un’approvazione esplicita viene negata perché la sessione del dispositivo abbinato approvante
è stata aperta con ambito solo di abbinamento, la CLI riprova la stessa richiesta con
`operator.admin`. Questo consente a un dispositivo abbinato esistente con capacità amministrative di recuperare un nuovo
abbinamento Control UI/browser senza modificare `devices/paired.json` a mano. Il
Gateway convalida comunque la connessione ritentata; i token che non possono autenticarsi
con `operator.admin` restano bloccati.

Se lo stesso dispositivo riprova con dettagli di autenticazione diversi (ad esempio
ruolo/ambiti/chiave pubblica diversi), la richiesta in sospeso precedente viene sostituita e viene creato un nuovo
`requestId`.

<Note>
Un dispositivo già abbinato non ottiene silenziosamente un accesso più ampio. Se si riconnette chiedendo più ambiti o un ruolo più ampio, OpenClaw mantiene l’approvazione esistente invariata e crea una nuova richiesta di upgrade in sospeso. Usa `openclaw devices list` per confrontare l’accesso attualmente approvato con il nuovo accesso richiesto prima di approvare.
</Note>

### Approvazione automatica opzionale dei Node con CIDR fidati

L’abbinamento dei dispositivi resta manuale per impostazione predefinita. Per reti Node strettamente controllate,
puoi abilitare l’approvazione automatica del primo Node con CIDR espliciti o IP esatti:

```json5
{
  gateway: {
    nodes: {
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24"],
      },
    },
  },
}
```

Questo si applica solo alle nuove richieste di abbinamento `role: node` senza
ambiti richiesti. I client operatore, browser, Control UI e WebChat richiedono comunque
approvazione manuale. Modifiche a ruolo, ambito, metadati e chiave pubblica richiedono comunque
approvazione manuale.

### Archiviazione dello stato di abbinamento dei Node

Archiviato in `~/.openclaw/devices/`:

- `pending.json` (di breve durata; le richieste in sospeso scadono)
- `paired.json` (dispositivi abbinati + token)

### Note

- L’API legacy `node.pair.*` (CLI: `openclaw nodes pending|approve|reject|remove|rename`) è uno
  store di abbinamento separato di proprietà del Gateway. I Node WS richiedono comunque l’abbinamento del dispositivo.
- Il record di abbinamento è la fonte di verità durevole per i ruoli approvati. I token
  dispositivo attivi restano limitati a quell’insieme di ruoli approvato; una voce token isolata
  fuori dai ruoli approvati non crea nuovo accesso.

## Documentazione correlata

- Modello di sicurezza + prompt injection: [Sicurezza](/it/gateway/security)
- Aggiornare in sicurezza (eseguire doctor): [Aggiornamento](/it/install/updating)
- Configurazioni dei canali:
  - Telegram: [Telegram](/it/channels/telegram)
  - WhatsApp: [WhatsApp](/it/channels/whatsapp)
  - Signal: [Signal](/it/channels/signal)
  - BlueBubbles (iMessage): [BlueBubbles](/it/channels/bluebubbles)
  - iMessage (legacy): [iMessage](/it/channels/imessage)
  - Discord: [Discord](/it/channels/discord)
  - Slack: [Slack](/it/channels/slack)
