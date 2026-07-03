---
read_when:
    - Configurazione del controllo di accesso ai DM
    - Associazione di un nuovo nodo iOS/Android
    - Revisione della postura di sicurezza di OpenClaw
summary: 'Panoramica dell''associazione: approva chi può inviarti DM e quali nodi possono unirsi'
title: Associazione
x-i18n:
    generated_at: "2026-07-03T17:25:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c62f42116b71467576b2c1e005fa2e606a3d0f40cbf7b92fc4a7dd47c8f0568e
    source_path: channels/pairing.md
    workflow: 16
---

L'"associazione" è il passaggio esplicito di approvazione dell'accesso di OpenClaw.
Viene usata in due punti:

1. **Associazione DM** (chi è autorizzato a parlare con il bot)
2. **Associazione Node** (quali dispositivi/nodi sono autorizzati a unirsi alla rete Gateway)

Contesto di sicurezza: [Sicurezza](/it/gateway/security)

## 1) Associazione DM (accesso chat in ingresso)

Quando un canale è configurato con la policy DM `pairing`, i mittenti sconosciuti ricevono un codice breve e il loro messaggio **non viene elaborato** finché non lo approvi.

Le policy DM predefinite sono documentate in: [Sicurezza](/it/gateway/security)

`dmPolicy: "open"` è pubblico solo quando l'allowlist DM effettiva include `"*"`.
La configurazione e la validazione richiedono quel carattere jolly per le configurazioni pubbliche aperte. Se lo stato esistente
contiene `open` con voci `allowFrom` concrete, il runtime ammette comunque
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
Questo fornisce alle prime configurazioni un proprietario esplicito per i comandi privilegiati e le richieste di approvazione
di exec. Dopo che esiste un proprietario, le approvazioni di associazione successive concedono solo l'accesso DM;
non aggiungono altri proprietari.

Canali supportati: `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `matrix`, `mattermost`, `msteams`, `nextcloud-talk`, `nostr`, `openclaw-weixin`, `signal`, `slack`, `synology-chat`, `telegram`, `twitch`, `whatsapp`, `zalo`, `zalouser`.

### Gruppi di mittenti riutilizzabili

Usa `accessGroups` di livello superiore quando lo stesso insieme di mittenti attendibili deve applicarsi a
più canali di messaggistica o sia alle allowlist DM sia a quelle di gruppo.

I gruppi statici usano `type: "message.senders"` e sono referenziati con
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
- Archivio allowlist approvate:
  - Account predefinito: `<channel>-allowFrom.json`
  - Account non predefinito: `<channel>-<accountId>-allowFrom.json`

Comportamento di ambito degli account:

- Gli account non predefiniti leggono/scrivono solo il loro file allowlist con ambito.
- L'account predefinito usa il file allowlist senza ambito specifico per account del canale.

Trattali come sensibili (regolano l'accesso al tuo assistente).

<Note>
L'archivio allowlist di associazione è per l'accesso DM. L'autorizzazione dei gruppi è separata.
Approvare un codice di associazione DM non consente automaticamente a quel mittente di eseguire comandi di gruppo
o controllare il bot nei gruppi. L'inizializzazione del primo proprietario è uno stato di configurazione separato
in `commands.ownerAllowFrom`, e la consegna nelle chat di gruppo segue comunque le allowlist di gruppo
del canale (ad esempio `groupAllowFrom`, `groups`, oppure override per gruppo
o per argomento a seconda del canale).
</Note>

## 2) Associazione dei dispositivi Node (nodi iOS/Android/macOS/headless)

I nodi si connettono al Gateway come **dispositivi** con `role: node`. Il Gateway
crea una richiesta di associazione del dispositivo che deve essere approvata.

### Associare tramite Telegram (consigliato per iOS)

Se usi il Plugin `device-pair`, puoi eseguire la prima associazione del dispositivo interamente da Telegram:

1. In Telegram, invia un messaggio al tuo bot: `/pair`
2. Il bot risponde con due messaggi: un messaggio di istruzioni e un messaggio separato con il **codice di configurazione** (facile da copiare/incollare in Telegram).
3. Sul telefono, apri l'app iOS di OpenClaw → Settings → Gateway.
4. Scansiona il codice QR o incolla il codice di configurazione e connettiti.
5. Di nuovo in Telegram: `/pair pending` (controlla ID richiesta, ruolo e ambiti), quindi approva.

Il codice di configurazione è un payload JSON codificato in base64 che contiene:

- `url`: l'URL WebSocket del Gateway (`ws://...` o `wss://...`)
- `bootstrapToken`: un token di bootstrap a vita breve per un singolo dispositivo, usato per l'handshake iniziale di associazione

Quel token di bootstrap contiene il profilo di bootstrap di associazione integrato:

- il profilo di configurazione integrato consente solo la baseline fresca QR/codice di configurazione:
  `node` più un passaggio `operator` limitato
- il token `node` trasferito rimane `scopes: []`
- il token `operator` trasferito è limitato a `operator.approvals`,
  `operator.read`, `operator.talk.secrets` e `operator.write`
- `operator.admin` non viene concesso dal bootstrap tramite QR/codice di configurazione; richiede un
  flusso separato di associazione o token operator approvato
- la rotazione/revoca successiva dei token rimane limitata sia dal contratto di ruolo approvato
  del dispositivo sia dagli ambiti operator della sessione chiamante

Tratta il codice di configurazione come una password finché è valido.

Per Tailscale, associazione mobile pubblica o altra associazione mobile remota, usa Tailscale Serve/Funnel
o un altro URL Gateway `wss://`. I codici di configurazione `ws://` in chiaro sono accettati solo
per loopback, indirizzi LAN privati, host Bonjour `.local` e host dell'emulatore Android.
Gli indirizzi CGNAT tailnet, i nomi `.ts.net` e gli host pubblici continuano
a fallire in modo chiuso prima dell'emissione del QR/codice di configurazione.

### Approvare un dispositivo Node

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Quando un'approvazione esplicita viene negata perché la sessione del dispositivo associato che approva
è stata aperta con ambito solo di associazione, la CLI riprova la stessa richiesta con
`operator.admin`. Questo consente a un dispositivo associato esistente con capacità di amministrazione di recuperare una nuova
associazione Control UI/browser senza modificare manualmente `devices/paired.json`. Il
Gateway valida comunque la connessione ritentata; i token che non possono autenticarsi
con `operator.admin` restano bloccati.

Se lo stesso dispositivo riprova con dettagli di autenticazione diversi (ad esempio
ruolo/ambiti/chiave pubblica diversi), la precedente richiesta in sospeso viene sostituita e viene creato un nuovo
`requestId`.

<Note>
Un dispositivo già associato non riceve silenziosamente un accesso più ampio. Se si riconnette chiedendo più ambiti o un ruolo più ampio, OpenClaw mantiene l'approvazione esistente così com'è e crea una nuova richiesta di upgrade in sospeso. Usa `openclaw devices list` per confrontare l'accesso attualmente approvato con il nuovo accesso richiesto prima di approvare.
</Note>

### Approvazione automatica facoltativa dei Node con CIDR attendibili

L'associazione dei dispositivi rimane manuale per impostazione predefinita. Per reti di nodi strettamente controllate,
puoi scegliere l'approvazione automatica alla prima associazione dei Node con CIDR espliciti o IP esatti:

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

Questo si applica solo alle nuove richieste di associazione `role: node` senza
ambiti richiesti. I client operator, browser, Control UI e WebChat richiedono comunque
approvazione manuale. Le modifiche a ruolo, ambito, metadati e chiave pubblica richiedono comunque
approvazione manuale.

### Archiviazione dello stato dell'associazione Node

Archiviato in `~/.openclaw/devices/`:

- `pending.json` (a vita breve; le richieste in sospeso scadono)
- `paired.json` (dispositivi associati + token)

### Note

- L'API legacy `node.pair.*` (CLI: `openclaw nodes pending|approve|reject|remove|rename`) è un
  archivio di associazione separato di proprietà del Gateway. I nodi WS richiedono comunque l'associazione dei dispositivi.
- Il record di associazione è la fonte di verità duratura per i ruoli approvati. I token dei dispositivi
  attivi restano limitati a quel set di ruoli approvato; una voce token isolata
  fuori dai ruoli approvati non crea nuovo accesso.

## Documenti correlati

- Modello di sicurezza + prompt injection: [Sicurezza](/it/gateway/security)
- Aggiornare in sicurezza (esegui doctor): [Aggiornamento](/it/install/updating)
- Configurazioni dei canali:
  - Telegram: [Telegram](/it/channels/telegram)
  - WhatsApp: [WhatsApp](/it/channels/whatsapp)
  - Signal: [Signal](/it/channels/signal)
  - iMessage: [iMessage](/it/channels/imessage)
  - Discord: [Discord](/it/channels/discord)
  - Slack: [Slack](/it/channels/slack)
