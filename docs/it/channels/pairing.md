---
read_when:
    - Configurazione del controllo degli accessi ai messaggi diretti
    - Associazione di un nuovo nodo iOS/Android
    - Revisione della postura di sicurezza di OpenClaw
summary: 'Panoramica dell''abbinamento: approva chi può inviarti messaggi diretti + quali Node possono unirsi'
title: Associazione
x-i18n:
    generated_at: "2026-05-02T08:16:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: bb68d87c0e1dfe7c9a6a6d9415f4c63625755fb43a2e22a1d1374ff0a63e49c4
    source_path: channels/pairing.md
    workflow: 16
---

“Abbinamento” è il passaggio esplicito di approvazione dell’accesso di OpenClaw.
Viene usato in due punti:

1. **Abbinamento DM** (chi è autorizzato a parlare con il bot)
2. **Abbinamento Node** (quali dispositivi/nodi sono autorizzati a unirsi alla rete Gateway)

Contesto di sicurezza: [Sicurezza](/it/gateway/security)

## 1) Abbinamento DM (accesso chat in ingresso)

Quando un canale è configurato con la policy DM `pairing`, i mittenti sconosciuti ricevono un codice breve e il loro messaggio **non viene elaborato** finché non lo approvi.

Le policy DM predefinite sono documentate in: [Sicurezza](/it/gateway/security)

`dmPolicy: "open"` è pubblico solo quando la allowlist DM effettiva include `"*"`.
La configurazione e la validazione richiedono quel carattere jolly per le configurazioni pubbliche-aperte. Se lo stato esistente
contiene `open` con voci `allowFrom` concrete, a runtime vengono comunque ammessi
solo quei mittenti, e le approvazioni dello store di abbinamento non ampliano l’accesso `open`.

Codici di abbinamento:

- 8 caratteri, maiuscoli, senza caratteri ambigui (`0O1I`).
- **Scadono dopo 1 ora**. Il bot invia il messaggio di abbinamento solo quando viene creata una nuova richiesta (all’incirca una volta all’ora per mittente).
- Le richieste di abbinamento DM in sospeso sono limitate a **3 per canale** per impostazione predefinita; le richieste aggiuntive vengono ignorate finché una non scade o viene approvata.

### Approvare un mittente

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

Se non è ancora configurato alcun proprietario dei comandi, l’approvazione di un codice di abbinamento DM inizializza anche
`commands.ownerAllowFrom` sul mittente approvato, ad esempio `telegram:123456789`.
Questo fornisce alle prime configurazioni un proprietario esplicito per i comandi privilegiati e le richieste di approvazione
exec. Dopo che esiste un proprietario, le approvazioni di abbinamento successive concedono solo l’accesso DM;
non aggiungono altri proprietari.

Canali supportati: `bluebubbles`, `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `matrix`, `mattermost`, `msteams`, `nextcloud-talk`, `nostr`, `openclaw-weixin`, `signal`, `slack`, `synology-chat`, `telegram`, `twitch`, `whatsapp`, `zalo`, `zalouser`.

### Gruppi di mittenti riutilizzabili

Usa `accessGroups` di primo livello quando lo stesso insieme di mittenti attendibili deve applicarsi a
più canali di messaggi oppure sia alle allowlist DM sia a quelle dei gruppi.

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

### Dove si trova lo stato

Archiviato sotto `~/.openclaw/credentials/`:

- Richieste in sospeso: `<channel>-pairing.json`
- Store della allowlist approvata:
  - Account predefinito: `<channel>-allowFrom.json`
  - Account non predefinito: `<channel>-<accountId>-allowFrom.json`

Comportamento dell’ambito account:

- Gli account non predefiniti leggono/scrivono solo il loro file allowlist con ambito.
- L’account predefinito usa il file allowlist senza ambito del canale.

Trattali come sensibili (controllano l’accesso al tuo assistente).

<Note>
Lo store della allowlist di abbinamento serve per l’accesso DM. L’autorizzazione dei gruppi è separata.
Approvare un codice di abbinamento DM non consente automaticamente a quel mittente di eseguire comandi di gruppo
o controllare il bot nei gruppi. L’inizializzazione del primo proprietario è uno stato di configurazione separato
in `commands.ownerAllowFrom`, e la consegna nelle chat di gruppo segue comunque le allowlist di gruppo
del canale (ad esempio `groupAllowFrom`, `groups`, oppure override per gruppo
o per topic a seconda del canale).
</Note>

## 2) Abbinamento dei dispositivi Node (nodi iOS/Android/macOS/headless)

I nodi si connettono al Gateway come **dispositivi** con `role: node`. Il Gateway
crea una richiesta di abbinamento dispositivo che deve essere approvata.

### Abbinamento tramite Telegram (consigliato per iOS)

Se usi il Plugin `device-pair`, puoi eseguire il primo abbinamento dispositivo interamente da Telegram:

1. In Telegram, invia un messaggio al tuo bot: `/pair`
2. Il bot risponde con due messaggi: un messaggio di istruzioni e un messaggio separato con il **codice di configurazione** (facile da copiare/incollare in Telegram).
3. Sul telefono, apri l’app OpenClaw per iOS → Impostazioni → Gateway.
4. Incolla il codice di configurazione e connettiti.
5. Di nuovo in Telegram: `/pair pending` (controlla ID richiesta, ruolo e ambiti), quindi approva.

Il codice di configurazione è un payload JSON codificato in base64 che contiene:

- `url`: l’URL WebSocket del Gateway (`ws://...` o `wss://...`)
- `bootstrapToken`: un token di bootstrap di breve durata per singolo dispositivo usato per l’handshake di abbinamento iniziale

Quel token di bootstrap porta il profilo di bootstrap di abbinamento integrato:

- il token `node` primario trasferito resta `scopes: []`
- qualsiasi token `operator` trasferito resta limitato alla allowlist di bootstrap:
  `operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`
- i controlli degli ambiti di bootstrap sono prefissati per ruolo, non un unico pool piatto di ambiti:
  le voci di ambito operator soddisfano solo richieste operator, e i ruoli non operator
  devono comunque richiedere ambiti sotto il prefisso del proprio ruolo
- la rotazione/revoca successiva dei token resta limitata sia dal contratto di ruolo approvato
  del dispositivo sia dagli ambiti operator della sessione chiamante

Tratta il codice di configurazione come una password finché è valido.

### Approvare un dispositivo Node

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Se lo stesso dispositivo riprova con dettagli di autenticazione diversi (ad esempio ruolo/ambiti/chiave pubblica
diversi), la precedente richiesta in sospeso viene sostituita e viene creato un nuovo
`requestId`.

<Note>
Un dispositivo già abbinato non ottiene silenziosamente un accesso più ampio. Se si riconnette chiedendo più ambiti o un ruolo più ampio, OpenClaw mantiene l’approvazione esistente invariata e crea una nuova richiesta di upgrade in sospeso. Usa `openclaw devices list` per confrontare l’accesso attualmente approvato con il nuovo accesso richiesto prima di approvare.
</Note>

### Approvazione automatica Node opzionale con CIDR attendibili

L’abbinamento dispositivo resta manuale per impostazione predefinita. Per reti Node strettamente controllate,
puoi attivare l’approvazione automatica del primo Node con CIDR espliciti o IP esatti:

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
ambiti richiesti. I client Operator, browser, Control UI e WebChat richiedono comunque l’approvazione manuale.
Le modifiche a ruolo, ambito, metadati e chiave pubblica richiedono comunque l’approvazione manuale.

### Archiviazione dello stato di abbinamento Node

Archiviato sotto `~/.openclaw/devices/`:

- `pending.json` (di breve durata; le richieste in sospeso scadono)
- `paired.json` (dispositivi abbinati + token)

### Note

- L’API legacy `node.pair.*` (CLI: `openclaw nodes pending|approve|reject|remove|rename`) è uno
  store di abbinamento separato di proprietà del gateway. I nodi WS richiedono comunque l’abbinamento dispositivo.
- Il record di abbinamento è la fonte di verità durevole per i ruoli approvati. I token dispositivo attivi
  restano limitati a quell’insieme di ruoli approvato; una voce token isolata
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
