---
read_when:
    - Configurazione del controllo degli accessi ai DM
    - Associazione di un nuovo nodo iOS/Android
    - Revisione della postura di sicurezza di OpenClaw
summary: 'Panoramica dell''associazione: approva chi può inviarti DM + quali nodi possono unirsi'
title: Associazione
x-i18n:
    generated_at: "2026-07-04T18:03:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e9c6508b8fd991f3a61ce026d1d453364de566a5b1373a6311ad24f43dcdb267
    source_path: channels/pairing.md
    workflow: 16
---

L'"associazione" è il passaggio esplicito di approvazione dell'accesso di OpenClaw.
Viene usata in due punti:

1. **Associazione DM** (chi è autorizzato a parlare con il bot)
2. **Associazione Node** (quali dispositivi/nodi sono autorizzati a unirsi alla rete Gateway)

Contesto di sicurezza: [Sicurezza](/it/gateway/security)

## 1) Associazione DM (accesso chat in ingresso)

Quando un canale è configurato con il criterio DM `pairing`, i mittenti sconosciuti ricevono un codice breve e il loro messaggio **non viene elaborato** finché non lo approvi.

I criteri DM predefiniti sono documentati in: [Sicurezza](/it/gateway/security)

`dmPolicy: "open"` è pubblico solo quando la lista consentiti DM effettiva include `"*"`.
Configurazione e convalida richiedono quel carattere jolly per le configurazioni public-open. Se lo stato
esistente contiene `open` con voci `allowFrom` concrete, il runtime ammette comunque
solo quei mittenti, e le approvazioni dell'archivio di associazione non ampliano l'accesso `open`.

Codici di associazione:

- 8 caratteri, maiuscoli, senza caratteri ambigui (`0O1I`).
- **Scadono dopo 1 ora**. Il bot invia il messaggio di associazione solo quando viene creata una nuova richiesta (circa una volta all'ora per mittente).
- Le richieste di associazione DM in sospeso sono limitate a **3 per canale** per impostazione predefinita; le richieste aggiuntive vengono ignorate finché una non scade o viene approvata.

### Approvare un mittente

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

Se non è ancora configurato alcun proprietario dei comandi, l'approvazione di un codice di associazione DM inizializza anche
`commands.ownerAllowFrom` con il mittente approvato, ad esempio `telegram:123456789`.
Questo assegna alle configurazioni iniziali un proprietario esplicito per i comandi privilegiati e le richieste di approvazione
exec. Dopo che esiste un proprietario, le approvazioni di associazione successive concedono solo
l'accesso DM; non aggiungono altri proprietari.

Canali supportati: `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `matrix`, `mattermost`, `msteams`, `nextcloud-talk`, `nostr`, `openclaw-weixin`, `signal`, `slack`, `synology-chat`, `telegram`, `twitch`, `whatsapp`, `zalo`, `zalouser`.

### Gruppi di mittenti riutilizzabili

Usa `accessGroups` di primo livello quando lo stesso insieme di mittenti attendibili deve applicarsi a
più canali di messaggistica o sia alle liste consentiti DM sia a quelle dei gruppi.

I gruppi statici usano `type: "message.senders"` e sono referenziati con
`accessGroup:<name>` dalle liste consentiti dei canali:

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

### Dove si trova lo stato

Archiviato in `~/.openclaw/credentials/`:

- Richieste in sospeso: `<channel>-pairing.json`
- Archivio lista consentiti approvata:
  - Account predefinito: `<channel>-allowFrom.json`
  - Account non predefinito: `<channel>-<accountId>-allowFrom.json`

Comportamento dell'ambito dell'account:

- Gli account non predefiniti leggono/scrivono solo il proprio file di lista consentiti con ambito.
- L'account predefinito usa il file di lista consentiti senza ambito a livello di canale.

Trattali come dati sensibili (regolano l'accesso al tuo assistente).

<Note>
L'archivio della lista consentiti di associazione è per l'accesso DM. L'autorizzazione dei gruppi è separata.
L'approvazione di un codice di associazione DM non consente automaticamente a quel mittente di eseguire comandi di gruppo
o controllare il bot nei gruppi. L'inizializzazione del primo proprietario è uno stato di configurazione separato
in `commands.ownerAllowFrom`, e la consegna nelle chat di gruppo segue comunque le liste consentiti di gruppo
del canale (ad esempio `groupAllowFrom`, `groups`, oppure override per gruppo
o per argomento a seconda del canale).
</Note>

## 2) Associazione dei dispositivi Node (nodi iOS/Android/macOS/headless)

I Node si connettono al Gateway come **dispositivi** con `role: node`. Il Gateway
crea una richiesta di associazione del dispositivo che deve essere approvata.

### Associare dalla Control UI (consigliato)

Usa una sessione Control UI già connessa con accesso `operator.admin`:

1. Apri la Control UI e seleziona **Nodi**.
2. In **Dispositivi**, fai clic su **Associa dispositivo mobile**.
3. Sul telefono, apri l'app OpenClaw → **Impostazioni** → **Gateway**.
4. Scansiona il codice QR o incolla il codice di configurazione, quindi connettiti.

Le app ufficiali OpenClaw per iOS e Android vengono approvate automaticamente quando i loro
metadati del codice di configurazione corrispondono. Se **Dispositivi** mostra una richiesta in sospeso (ad
esempio per un client non ufficiale o metadati non corrispondenti), controlla il ruolo e
gli ambiti prima di approvarla.

Il pulsante è disabilitato quando la sessione Control UI corrente non ha
accesso amministratore. In quel caso usa il flusso di approvazione CLI qui sotto dall'host Gateway.

### Associare tramite Telegram

Se usi il Plugin `device-pair`, puoi eseguire la prima associazione del dispositivo interamente da Telegram:

1. In Telegram, invia al bot: `/pair`
2. Il bot risponde con due messaggi: un messaggio di istruzioni e un messaggio separato con il **codice di configurazione** (facile da copiare/incollare in Telegram).
3. Sul telefono, apri l'app OpenClaw per iOS → Impostazioni → Gateway.
4. Scansiona il codice QR oppure incolla il codice di configurazione e connettiti.
5. L'app mobile ufficiale si connette automaticamente. Se `/pair pending` mostra una
   richiesta, controlla il ruolo e gli ambiti prima di approvarla.

Il codice di configurazione è un payload JSON codificato in base64 che contiene:

- `url`: l'URL WebSocket del Gateway (`ws://...` o `wss://...`)
- `bootstrapToken`: un token bootstrap a breve durata per un singolo dispositivo usato per l'handshake di associazione iniziale

Quel token bootstrap contiene il profilo bootstrap di associazione integrato:

- il profilo di configurazione integrato consente solo la baseline QR/codice di configurazione nuova:
  `node` più un passaggio `operator` limitato
- il token `node` passato resta `scopes: []`
- il token `operator` passato è limitato a `operator.approvals`,
  `operator.read`, `operator.talk.secrets` e `operator.write`
- `operator.admin` non viene concesso dal bootstrap QR/codice di configurazione; richiede un
  flusso separato di associazione o token operatore approvato
- la successiva rotazione/revoca dei token resta limitata sia dal contratto di ruolo approvato
  del dispositivo sia dagli ambiti operatore della sessione chiamante

Tratta il codice di configurazione come una password finché è valido.

Per Tailscale, pubblico o altre associazioni mobili remote, usa Tailscale Serve/Funnel
o un altro URL Gateway `wss://`. I codici di configurazione `ws://` in chiaro sono accettati solo
per local loopback, indirizzi LAN privati, host Bonjour `.local` e l'host
dell'emulatore Android. Gli indirizzi CGNAT tailnet, i nomi `.ts.net` e gli host pubblici continuano a
fallire in modo chiuso prima dell'emissione del QR/codice di configurazione.

### Approvare un dispositivo Node

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Quando un'approvazione esplicita viene negata perché la sessione del dispositivo associato che approva
è stata aperta con ambito solo di associazione, la CLI ritenta la stessa richiesta con
`operator.admin`. Questo consente a un dispositivo associato esistente con capacità di amministratore di recuperare una nuova
associazione Control UI/browser senza modificare `devices/paired.json` a mano. Il
Gateway convalida comunque la connessione ritentata; i token che non possono autenticarsi
con `operator.admin` restano bloccati.

Se lo stesso dispositivo ritenta con dettagli di autenticazione diversi (ad esempio ruolo/ambiti/chiave pubblica
diversi), la richiesta in sospeso precedente viene sostituita e viene creato un nuovo
`requestId`.

<Note>
Un dispositivo già associato non ottiene silenziosamente un accesso più ampio. Se si riconnette chiedendo più ambiti o un ruolo più ampio, OpenClaw mantiene invariata l'approvazione esistente e crea una nuova richiesta di upgrade in sospeso. Usa `openclaw devices list` per confrontare l'accesso attualmente approvato con il nuovo accesso richiesto prima di approvare.
</Note>

### Approvazione automatica opzionale dei Node con CIDR attendibile

L'associazione dei dispositivi resta manuale per impostazione predefinita. Per reti Node strettamente controllate,
puoi scegliere di abilitare l'approvazione automatica dei Node alla prima connessione con CIDR espliciti o IP esatti:

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

Questo si applica solo alle richieste di associazione nuove con `role: node` senza
ambiti richiesti. I client operatore, browser, Control UI e WebChat richiedono comunque
approvazione manuale. Le modifiche a ruolo, ambito, metadati e chiave pubblica richiedono comunque
approvazione manuale.

### Archiviazione dello stato di associazione dei Node

Archiviato in `~/.openclaw/devices/`:

- `pending.json` (a breve durata; le richieste in sospeso scadono)
- `paired.json` (dispositivi associati + token)

### Note

- L'API legacy `node.pair.*` (CLI: `openclaw nodes pending|approve|reject|remove|rename`) è un
  archivio di associazione separato di proprietà del gateway. I Node WS richiedono comunque l'associazione dei dispositivi.
- Il record di associazione è la fonte di verità persistente per i ruoli approvati. I token dei dispositivi
  attivi restano limitati a quell'insieme di ruoli approvati; una voce token isolata
  al di fuori dei ruoli approvati non crea nuovo accesso.

## Documentazione correlata

- Modello di sicurezza + prompt injection: [Sicurezza](/it/gateway/security)
- Aggiornamento sicuro (esegui doctor): [Aggiornamento](/it/install/updating)
- Configurazioni dei canali:
  - Telegram: [Telegram](/it/channels/telegram)
  - WhatsApp: [WhatsApp](/it/channels/whatsapp)
  - Signal: [Signal](/it/channels/signal)
  - iMessage: [iMessage](/it/channels/imessage)
  - Discord: [Discord](/it/channels/discord)
  - Slack: [Slack](/it/channels/slack)
