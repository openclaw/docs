---
read_when:
    - Configurazione del controllo di accesso ai DM
    - Associazione di un nuovo nodo iOS/Android
    - Revisione della postura di sicurezza di OpenClaw
summary: 'Panoramica dell''associazione: approva chi può inviarti messaggi diretti + quali nodi possono unirsi'
title: Abbinamento
x-i18n:
    generated_at: "2026-05-04T02:21:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4fb27840f7c9ef55e7270cc29f813e6db90b240aa2180f30952eb9485f0f8874
    source_path: channels/pairing.md
    workflow: 16
---

“Abbinamento” è il passaggio esplicito di approvazione dell'accesso di OpenClaw.
Viene usato in due punti:

1. **Abbinamento DM** (chi può parlare con il bot)
2. **Abbinamento Node** (quali dispositivi/nodi possono unirsi alla rete Gateway)

Contesto di sicurezza: [Sicurezza](/it/gateway/security)

## 1) Abbinamento DM (accesso chat in ingresso)

Quando un canale è configurato con la policy DM `pairing`, i mittenti sconosciuti ricevono un codice breve e il loro messaggio **non viene elaborato** finché non approvi.

Le policy DM predefinite sono documentate in: [Sicurezza](/it/gateway/security)

`dmPolicy: "open"` è pubblica solo quando l'elenco consentiti DM effettivo include `"*"`.
La configurazione e la convalida richiedono quel carattere jolly per le configurazioni pubbliche aperte. Se lo stato esistente
contiene `open` con voci `allowFrom` concrete, a runtime continuano a essere ammessi
solo quei mittenti, e le approvazioni nello store di abbinamento non ampliano l'accesso `open`.

Codici di abbinamento:

- 8 caratteri, maiuscoli, senza caratteri ambigui (`0O1I`).
- **Scadono dopo 1 ora**. Il bot invia il messaggio di abbinamento solo quando viene creata una nuova richiesta (circa una volta all'ora per mittente).
- Le richieste di abbinamento DM in sospeso sono limitate a **3 per canale** per impostazione predefinita; le richieste aggiuntive vengono ignorate finché una non scade o viene approvata.

### Approvare un mittente

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

Se non è ancora configurato alcun proprietario dei comandi, l'approvazione di un codice di abbinamento DM inizializza anche
`commands.ownerAllowFrom` sul mittente approvato, ad esempio `telegram:123456789`.
Questo assegna alle configurazioni iniziali un proprietario esplicito per i comandi privilegiati e le richieste di approvazione
exec. Dopo che esiste un proprietario, le approvazioni di abbinamento successive concedono solo l'accesso DM;
non aggiungono altri proprietari.

Canali supportati: `bluebubbles`, `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `matrix`, `mattermost`, `msteams`, `nextcloud-talk`, `nostr`, `openclaw-weixin`, `signal`, `slack`, `synology-chat`, `telegram`, `twitch`, `whatsapp`, `zalo`, `zalouser`.

### Gruppi di mittenti riutilizzabili

Usa `accessGroups` di primo livello quando lo stesso insieme di mittenti fidati deve applicarsi a
più canali di messaggistica o sia agli elenchi consentiti DM sia a quelli di gruppo.

I gruppi statici usano `type: "message.senders"` e vengono referenziati con
`accessGroup:<name>` dagli elenchi consentiti dei canali:

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

Archiviato sotto `~/.openclaw/credentials/`:

- Richieste in sospeso: `<channel>-pairing.json`
- Store dell'elenco consentiti approvato:
  - Account predefinito: `<channel>-allowFrom.json`
  - Account non predefinito: `<channel>-<accountId>-allowFrom.json`

Comportamento dell'ambito account:

- Gli account non predefiniti leggono/scrivono solo il loro file di elenco consentiti con ambito.
- L'account predefinito usa il file di elenco consentiti senza ambito, con ambito di canale.

Trattali come sensibili (regolano l'accesso al tuo assistente).

<Note>
Lo store dell'elenco consentiti di abbinamento è per l'accesso DM. L'autorizzazione dei gruppi è separata.
L'approvazione di un codice di abbinamento DM non consente automaticamente a quel mittente di eseguire comandi di gruppo
o controllare il bot nei gruppi. L'inizializzazione del primo proprietario è uno stato di configurazione separato
in `commands.ownerAllowFrom`, e la consegna nelle chat di gruppo segue comunque gli elenchi consentiti di gruppo
del canale (ad esempio `groupAllowFrom`, `groups`, oppure override per gruppo
o per argomento a seconda del canale).
</Note>

## 2) Abbinamento dei dispositivi Node (nodi iOS/Android/macOS/headless)

I Node si connettono al Gateway come **dispositivi** con `role: node`. Il Gateway
crea una richiesta di abbinamento dispositivo che deve essere approvata.

### Abbina tramite Telegram (consigliato per iOS)

Se usi il Plugin `device-pair`, puoi completare il primo abbinamento del dispositivo interamente da Telegram:

1. In Telegram, invia un messaggio al tuo bot: `/pair`
2. Il bot risponde con due messaggi: un messaggio di istruzioni e un messaggio separato con il **codice di configurazione** (facile da copiare/incollare in Telegram).
3. Sul telefono, apri l'app iOS OpenClaw → Impostazioni → Gateway.
4. Incolla il codice di configurazione e connettiti.
5. Di nuovo in Telegram: `/pair pending` (controlla ID richiesta, ruolo e ambiti), quindi approva.

Il codice di configurazione è un payload JSON codificato in base64 che contiene:

- `url`: l'URL WebSocket del Gateway (`ws://...` o `wss://...`)
- `bootstrapToken`: un token di bootstrap a breve durata e per un singolo dispositivo usato per l'handshake di abbinamento iniziale

Quel token di bootstrap porta il profilo di bootstrap di abbinamento integrato:

- il token `node` primario consegnato rimane `scopes: []`
- qualsiasi token `operator` consegnato rimane limitato all'elenco consentiti di bootstrap:
  `operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`
- i controlli degli ambiti di bootstrap sono prefissati per ruolo, non un unico pool piatto di ambiti:
  le voci di ambito operatore soddisfano solo le richieste operatore, e i ruoli non operatore
  devono comunque richiedere ambiti sotto il proprio prefisso di ruolo
- la successiva rotazione/revoca dei token rimane limitata sia dal contratto di ruolo approvato
  del dispositivo sia dagli ambiti operatore della sessione chiamante

Tratta il codice di configurazione come una password finché è valido.

### Approvare un dispositivo Node

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Quando un'approvazione esplicita viene negata perché la sessione del dispositivo abbinato che approva
è stata aperta con ambito di solo abbinamento, la CLI riprova la stessa richiesta con
`operator.admin`. Questo consente a un dispositivo abbinato esistente con capacità admin di recuperare un nuovo
abbinamento interfaccia di controllo/browser senza modificare `devices/paired.json` a mano. Il
Gateway convalida comunque la connessione ritentata; i token che non possono autenticarsi
con `operator.admin` rimangono bloccati.

Se lo stesso dispositivo riprova con dettagli di autenticazione diversi (ad esempio ruolo/ambiti/chiave pubblica
diversi), la richiesta in sospeso precedente viene sostituita e viene creato un nuovo
`requestId`.

<Note>
Un dispositivo già abbinato non ottiene silenziosamente un accesso più ampio. Se si riconnette chiedendo più ambiti o un ruolo più ampio, OpenClaw mantiene invariata l'approvazione esistente e crea una nuova richiesta di upgrade in sospeso. Usa `openclaw devices list` per confrontare l'accesso attualmente approvato con il nuovo accesso richiesto prima di approvare.
</Note>

### Approvazione automatica Node facoltativa con CIDR fidati

L'abbinamento dei dispositivi resta manuale per impostazione predefinita. Per reti Node strettamente controllate,
puoi attivare l'approvazione automatica del primo Node con CIDR espliciti o IP esatti:

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

Questo si applica solo a nuove richieste di abbinamento `role: node` senza
ambiti richiesti. I client operatore, browser, interfaccia di controllo e WebChat richiedono comunque l'approvazione
manuale. Le modifiche a ruolo, ambito, metadati e chiave pubblica richiedono comunque l'approvazione
manuale.

### Archiviazione dello stato di abbinamento Node

Archiviato sotto `~/.openclaw/devices/`:

- `pending.json` (a breve durata; le richieste in sospeso scadono)
- `paired.json` (dispositivi abbinati + token)

### Note

- L'API legacy `node.pair.*` (CLI: `openclaw nodes pending|approve|reject|remove|rename`) è uno
  store di abbinamento separato di proprietà del Gateway. I Node WS richiedono comunque l'abbinamento dispositivo.
- Il record di abbinamento è la fonte di verità durevole per i ruoli approvati. I token
  dispositivo attivi rimangono limitati a quell'insieme di ruoli approvati; una voce token isolata
  fuori dai ruoli approvati non crea nuovo accesso.

## Documenti correlati

- Modello di sicurezza + prompt injection: [Sicurezza](/it/gateway/security)
- Aggiornamento sicuro (esegui doctor): [Aggiornamento](/it/install/updating)
- Configurazioni dei canali:
  - Telegram: [Telegram](/it/channels/telegram)
  - WhatsApp: [WhatsApp](/it/channels/whatsapp)
  - Signal: [Signal](/it/channels/signal)
  - BlueBubbles (iMessage): [BlueBubbles](/it/channels/bluebubbles)
  - iMessage (legacy): [iMessage](/it/channels/imessage)
  - Discord: [Discord](/it/channels/discord)
  - Slack: [Slack](/it/channels/slack)
