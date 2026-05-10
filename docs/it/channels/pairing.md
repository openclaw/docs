---
read_when:
    - Configurazione del controllo dell'accesso ai messaggi diretti
    - Abbinamento di un nuovo nodo iOS/Android
    - Revisione della postura di sicurezza di OpenClaw
summary: 'Panoramica dell''associazione: approva chi può inviarti messaggi diretti + quali nodi possono unirsi'
title: Associazione
x-i18n:
    generated_at: "2026-05-10T19:23:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0e26bfd98d9de3b834b737be1aa70eb2272267b3cb9cf6d66b030629111a12fc
    source_path: channels/pairing.md
    workflow: 16
---

L'"abbinamento" è il passaggio esplicito di approvazione dell'accesso di OpenClaw.
Viene usato in due punti:

1. **Abbinamento DM** (chi è autorizzato a parlare con il bot)
2. **Abbinamento dei Node** (quali dispositivi/nodi sono autorizzati a unirsi alla rete Gateway)

Contesto di sicurezza: [Sicurezza](/it/gateway/security)

## 1) Abbinamento DM (accesso chat in ingresso)

Quando un canale è configurato con la policy DM `pairing`, i mittenti sconosciuti ricevono un codice breve e il loro messaggio **non viene elaborato** finché non lo approvi.

Le policy DM predefinite sono documentate in: [Sicurezza](/it/gateway/security)

`dmPolicy: "open"` è pubblica solo quando l'allowlist DM effettiva include `"*"`.
Configurazione e validazione richiedono quel carattere jolly per le configurazioni pubbliche aperte. Se lo stato esistente
contiene `open` con voci `allowFrom` concrete, il runtime ammette comunque
solo quei mittenti, e le approvazioni dello store di abbinamento non ampliano l'accesso `open`.

Codici di abbinamento:

- 8 caratteri, maiuscoli, senza caratteri ambigui (`0O1I`).
- **Scadono dopo 1 ora**. Il bot invia il messaggio di abbinamento solo quando viene creata una nuova richiesta (circa una volta all'ora per mittente).
- Le richieste di abbinamento DM in sospeso sono limitate a **3 per canale** per impostazione predefinita; le richieste aggiuntive vengono ignorate finché una non scade o non viene approvata.

### Approva un mittente

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

Se non è ancora configurato alcun proprietario dei comandi, l'approvazione di un codice di abbinamento DM inizializza anche
`commands.ownerAllowFrom` con il mittente approvato, ad esempio `telegram:123456789`.
Questo fornisce alle prime configurazioni un proprietario esplicito per i comandi privilegiati e le richieste di approvazione
exec. Dopo che esiste un proprietario, le approvazioni di abbinamento successive concedono solo l'accesso DM;
non aggiungono altri proprietari.

Canali supportati: `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `matrix`, `mattermost`, `msteams`, `nextcloud-talk`, `nostr`, `openclaw-weixin`, `signal`, `slack`, `synology-chat`, `telegram`, `twitch`, `whatsapp`, `zalo`, `zalouser`.

### Gruppi di mittenti riutilizzabili

Usa `accessGroups` di primo livello quando lo stesso insieme di mittenti attendibili deve applicarsi a
più canali di messaggistica o sia alle allowlist DM sia a quelle dei gruppi.

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
- Store allowlist approvate:
  - Account predefinito: `<channel>-allowFrom.json`
  - Account non predefinito: `<channel>-<accountId>-allowFrom.json`

Comportamento dell'ambito dell'account:

- Gli account non predefiniti leggono/scrivono solo il rispettivo file allowlist con ambito.
- L'account predefinito usa il file allowlist senza ambito specifico del canale.

Trattali come dati sensibili (controllano l'accesso al tuo assistente).

<Note>
Lo store allowlist di abbinamento serve per l'accesso DM. L'autorizzazione dei gruppi è separata.
L'approvazione di un codice di abbinamento DM non consente automaticamente a quel mittente di eseguire comandi
di gruppo o controllare il bot nei gruppi. L'inizializzazione del primo proprietario è uno stato di configurazione separato
in `commands.ownerAllowFrom`, e la consegna nelle chat di gruppo segue comunque le allowlist di gruppo
del canale (ad esempio `groupAllowFrom`, `groups`, o override per gruppo
o per argomento a seconda del canale).
</Note>

## 2) Abbinamento dei dispositivi Node (nodi iOS/Android/macOS/headless)

I Node si connettono al Gateway come **dispositivi** con `role: node`. Il Gateway
crea una richiesta di abbinamento del dispositivo che deve essere approvata.

### Abbina tramite Telegram (consigliato per iOS)

Se usi il Plugin `device-pair`, puoi eseguire il primo abbinamento del dispositivo interamente da Telegram:

1. In Telegram, invia un messaggio al tuo bot: `/pair`
2. Il bot risponde con due messaggi: un messaggio di istruzioni e un messaggio separato con **codice di configurazione** (facile da copiare/incollare in Telegram).
3. Sul telefono, apri l'app iOS OpenClaw → Impostazioni → Gateway.
4. Scansiona il codice QR o incolla il codice di configurazione e connettiti.
5. Di nuovo in Telegram: `/pair pending` (controlla ID richiesta, ruolo e ambiti), quindi approva.

Il codice di configurazione è un payload JSON codificato in base64 che contiene:

- `url`: l'URL WebSocket del Gateway (`ws://...` o `wss://...`)
- `bootstrapToken`: un token bootstrap a breve durata per singolo dispositivo usato per l'handshake di abbinamento iniziale

Quel token bootstrap include il profilo bootstrap di abbinamento integrato:

- il token `node` principale trasferito resta `scopes: []`
- qualsiasi token `operator` trasferito resta limitato alla allowlist bootstrap:
  `operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`
- i controlli degli ambiti bootstrap sono prefissati dal ruolo, non un unico insieme piatto di ambiti:
  le voci di ambito operator soddisfano solo richieste operator, e i ruoli non operator
  devono comunque richiedere ambiti con il proprio prefisso di ruolo
- la rotazione/revoca successiva dei token resta limitata sia dal contratto di ruolo approvato
  del dispositivo sia dagli ambiti operator della sessione chiamante

Tratta il codice di configurazione come una password finché è valido.

Per Tailscale, abbinamento mobile pubblico o altro abbinamento mobile remoto, usa Tailscale Serve/Funnel
o un altro URL Gateway `wss://`. I codici di configurazione in chiaro `ws://` sono accettati solo
per loopback, indirizzi LAN privati, host Bonjour `.local` e l'host dell'emulatore Android.
Gli indirizzi CGNAT tailnet, i nomi `.ts.net` e gli host pubblici continuano
a fallire in modo chiuso prima dell'emissione del QR/codice di configurazione.

### Approva un dispositivo Node

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Quando un'approvazione esplicita viene negata perché la sessione del dispositivo abbinato che approva
è stata aperta con ambito solo di abbinamento, la CLI ritenta la stessa richiesta con
`operator.admin`. Questo consente a un dispositivo abbinato esistente con capacità di amministrazione di recuperare un nuovo
abbinamento Control UI/browser senza modificare `devices/paired.json` a mano. Il
Gateway valida comunque la connessione ritentata; i token che non possono autenticarsi
con `operator.admin` restano bloccati.

Se lo stesso dispositivo ritenta con dettagli di autenticazione diversi (ad esempio ruolo/ambiti/chiave pubblica
diversi), la richiesta in sospeso precedente viene sostituita e viene creato un nuovo
`requestId`.

<Note>
Un dispositivo già abbinato non ottiene silenziosamente un accesso più ampio. Se si riconnette chiedendo più ambiti o un ruolo più ampio, OpenClaw mantiene l'approvazione esistente così com'è e crea una nuova richiesta di upgrade in sospeso. Usa `openclaw devices list` per confrontare l'accesso attualmente approvato con il nuovo accesso richiesto prima di approvare.
</Note>

### Approvazione automatica opzionale dei Node tramite CIDR attendibili

L'abbinamento dei dispositivi resta manuale per impostazione predefinita. Per reti Node rigidamente controllate,
puoi abilitare l'approvazione automatica al primo accesso dei Node con CIDR espliciti o IP esatti:

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
ambiti richiesti. Client operator, browser, Control UI e WebChat richiedono comunque l'approvazione
manuale. Le modifiche a ruolo, ambito, metadati e chiave pubblica richiedono comunque l'approvazione
manuale.

### Archiviazione dello stato di abbinamento dei Node

Archiviato in `~/.openclaw/devices/`:

- `pending.json` (breve durata; le richieste in sospeso scadono)
- `paired.json` (dispositivi abbinati + token)

### Note

- L'API legacy `node.pair.*` (CLI: `openclaw nodes pending|approve|reject|remove|rename`) è uno
  store di abbinamento separato di proprietà del gateway. I Node WS richiedono comunque l'abbinamento del dispositivo.
- Il record di abbinamento è la fonte di verità durevole per i ruoli approvati. I token dispositivo
  attivi restano limitati a quell'insieme di ruoli approvati; una voce token isolata
  al di fuori dei ruoli approvati non crea nuovo accesso.

## Documenti correlati

- Modello di sicurezza + prompt injection: [Sicurezza](/it/gateway/security)
- Aggiornamento sicuro (esegui doctor): [Aggiornamento](/it/install/updating)
- Configurazioni dei canali:
  - Telegram: [Telegram](/it/channels/telegram)
  - WhatsApp: [WhatsApp](/it/channels/whatsapp)
  - Signal: [Signal](/it/channels/signal)
  - iMessage: [iMessage](/it/channels/imessage)
  - Discord: [Discord](/it/channels/discord)
  - Slack: [Slack](/it/channels/slack)
