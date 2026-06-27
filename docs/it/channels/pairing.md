---
read_when:
    - Configurazione del controllo dell'accesso ai DM
    - Associazione di un nuovo nodo iOS/Android
    - Revisione della postura di sicurezza di OpenClaw
summary: 'Panoramica dell''abbinamento: approva chi può inviarti DM + quali nodi possono unirsi'
title: Abbinamento
x-i18n:
    generated_at: "2026-06-27T17:12:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 92870489b62aeec710f49ec92908f4b83c7d9ee2ce34174b42e283839748e549
    source_path: channels/pairing.md
    workflow: 16
---

"L'abbinamento" è il passaggio esplicito di approvazione dell'accesso di OpenClaw.
Viene usato in due punti:

1. **Abbinamento DM** (chi può parlare con il bot)
2. **Abbinamento Node** (quali dispositivi/nodi possono unirsi alla rete Gateway)

Contesto di sicurezza: [Sicurezza](/it/gateway/security)

## 1) Abbinamento DM (accesso chat in ingresso)

Quando un canale è configurato con la policy DM `pairing`, i mittenti sconosciuti ricevono un codice breve e il loro messaggio **non viene elaborato** finché non lo approvi.

Le policy DM predefinite sono documentate in: [Sicurezza](/it/gateway/security)

`dmPolicy: "open"` è pubblico solo quando l'allowlist DM effettiva include `"*"`.
La configurazione e la convalida richiedono quel carattere jolly per le configurazioni pubbliche aperte. Se lo stato esistente
contiene `open` con voci `allowFrom` concrete, il runtime ammette comunque
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
`commands.ownerAllowFrom` con il mittente approvato, ad esempio `telegram:123456789`.
Questo assegna alle prime configurazioni un proprietario esplicito per i comandi privilegiati e i prompt di approvazione
dell'esecuzione. Dopo che esiste un proprietario, le approvazioni di abbinamento successive concedono solo l'accesso DM;
non aggiungono altri proprietari.

Canali supportati: `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `matrix`, `mattermost`, `msteams`, `nextcloud-talk`, `nostr`, `openclaw-weixin`, `signal`, `slack`, `synology-chat`, `telegram`, `twitch`, `whatsapp`, `zalo`, `zalouser`.

### Gruppi di mittenti riutilizzabili

Usa `accessGroups` di primo livello quando lo stesso insieme di mittenti attendibili deve applicarsi a
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

Comportamento dell'ambito account:

- Gli account non predefiniti leggono/scrivono solo il loro file allowlist con ambito.
- L'account predefinito usa il file allowlist senza ambito con ambito di canale.

Trattali come sensibili (controllano l'accesso al tuo assistente).

<Note>
Lo store allowlist di abbinamento serve per l'accesso DM. L'autorizzazione dei gruppi è separata.
L'approvazione di un codice di abbinamento DM non consente automaticamente a quel mittente di eseguire comandi di gruppo
o controllare il bot nei gruppi. L'inizializzazione del primo proprietario è uno stato di configurazione separato
in `commands.ownerAllowFrom`, e la consegna nelle chat di gruppo segue comunque le allowlist di gruppo
del canale (ad esempio `groupAllowFrom`, `groups` oppure override per gruppo
o per argomento, a seconda del canale).
</Note>

## 2) Abbinamento dispositivi Node (nodi iOS/Android/macOS/headless)

I nodi si connettono al Gateway come **dispositivi** con `role: node`. Il Gateway
crea una richiesta di abbinamento dispositivo che deve essere approvata.

### Abbinamento tramite Telegram (consigliato per iOS)

Se usi il Plugin `device-pair`, puoi completare il primo abbinamento del dispositivo interamente da Telegram:

1. In Telegram, invia un messaggio al tuo bot: `/pair`
2. Il bot risponde con due messaggi: un messaggio di istruzioni e un messaggio separato con il **codice di configurazione** (facile da copiare/incollare in Telegram).
3. Sul telefono, apri l'app OpenClaw per iOS → Impostazioni → Gateway.
4. Scansiona il codice QR o incolla il codice di configurazione e connettiti.
5. Di nuovo in Telegram: `/pair pending` (rivedi ID richiesta, ruolo e ambiti), quindi approva.

Il codice di configurazione è un payload JSON codificato in base64 che contiene:

- `url`: l'URL WebSocket del Gateway (`ws://...` o `wss://...`)
- `bootstrapToken`: un token bootstrap di breve durata per un singolo dispositivo, usato per l'handshake di abbinamento iniziale

Quel token bootstrap porta il profilo bootstrap di abbinamento integrato:

- il profilo di configurazione integrato consente solo la baseline QR/codice di configurazione appena creata:
  `node` più un passaggio `operator` limitato
- il token `node` trasferito rimane `scopes: []`
- il token `operator` trasferito è limitato a `operator.approvals`,
  `operator.read` e `operator.write`
- `operator.admin` e `operator.pairing` non vengono concessi dal bootstrap
  QR/codice di configurazione; richiedono un flusso separato di abbinamento operatore o token approvato
- la rotazione/revoca successiva dei token resta limitata sia dal contratto di ruolo approvato
  del dispositivo sia dagli ambiti operatore della sessione chiamante

Tratta il codice di configurazione come una password finché è valido.

Per Tailscale, l'abbinamento mobile pubblico o altro abbinamento mobile remoto, usa Tailscale Serve/Funnel
o un altro URL Gateway `wss://`. I codici di configurazione `ws://` in chiaro sono accettati solo
per loopback, indirizzi LAN privati, host Bonjour `.local` e host dell'emulatore Android.
Gli indirizzi CGNAT tailnet, i nomi `.ts.net` e gli host pubblici falliscono comunque in modo chiuso
prima dell'emissione del QR/codice di configurazione.

### Approvare un dispositivo Node

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Quando un'approvazione esplicita viene negata perché la sessione del dispositivo abbinato che approva
è stata aperta con ambito solo abbinamento, la CLI ritenta la stessa richiesta con
`operator.admin`. Questo consente a un dispositivo abbinato esistente con capacità di amministrazione di recuperare un nuovo
abbinamento Control UI/browser senza modificare manualmente `devices/paired.json`. Il
Gateway convalida comunque la connessione ritentata; i token che non possono autenticarsi
con `operator.admin` restano bloccati.

Se lo stesso dispositivo riprova con dettagli di autenticazione diversi (ad esempio ruolo/ambiti/chiave pubblica
diversi), la richiesta in sospeso precedente viene sostituita e viene creato un nuovo
`requestId`.

<Note>
Un dispositivo già abbinato non ottiene silenziosamente un accesso più ampio. Se si riconnette chiedendo più ambiti o un ruolo più ampio, OpenClaw mantiene l'approvazione esistente invariata e crea una nuova richiesta di aggiornamento in sospeso. Usa `openclaw devices list` per confrontare l'accesso attualmente approvato con l'accesso appena richiesto prima di approvare.
</Note>

### Approvazione automatica opzionale dei Node con CIDR attendibili

L'abbinamento dei dispositivi resta manuale per impostazione predefinita. Per reti Node strettamente controllate,
puoi abilitare l'approvazione automatica dei Node al primo uso con CIDR espliciti o IP esatti:

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

Questo si applica solo alle nuove richieste di abbinamento con `role: node` senza
ambiti richiesti. I client operatore, browser, Control UI e WebChat richiedono comunque l'approvazione
manuale. Le modifiche a ruolo, ambito, metadati e chiave pubblica richiedono comunque l'approvazione
manuale.

### Archiviazione dello stato di abbinamento Node

Archiviato in `~/.openclaw/devices/`:

- `pending.json` (di breve durata; le richieste in sospeso scadono)
- `paired.json` (dispositivi abbinati + token)

### Note

- L'API legacy `node.pair.*` (CLI: `openclaw nodes pending|approve|reject|remove|rename`) è uno
  store di abbinamento separato di proprietà del gateway. I nodi WS richiedono comunque l'abbinamento dispositivo.
- Il record di abbinamento è la fonte di verità durevole per i ruoli approvati. I token dispositivo
  attivi restano limitati all'insieme di ruoli approvato; una voce token anomala
  fuori dai ruoli approvati non crea nuovo accesso.

## Documentazione correlata

- Modello di sicurezza + prompt injection: [Sicurezza](/it/gateway/security)
- Aggiornare in sicurezza (esegui doctor): [Aggiornamento](/it/install/updating)
- Configurazioni dei canali:
  - Telegram: [Telegram](/it/channels/telegram)
  - WhatsApp: [WhatsApp](/it/channels/whatsapp)
  - Signal: [Signal](/it/channels/signal)
  - iMessage: [iMessage](/it/channels/imessage)
  - Discord: [Discord](/it/channels/discord)
  - Slack: [Slack](/it/channels/slack)
