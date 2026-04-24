---
read_when:
    - Configurazione del controllo degli accessi ai DM
    - Abbinare un nuovo Node iOS/Android
    - Esaminare il livello di sicurezza di OpenClaw
summary: 'Panoramica dell''abbinamento: approva chi può inviarti DM e quali Node possono unirsi'
title: Abbinamento
x-i18n:
    generated_at: "2026-04-24T08:30:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 373eaa02865995ada0c906df9bad4e8328f085a8bb3679b0a5820dc397130137
    source_path: channels/pairing.md
    workflow: 15
---

L'“abbinamento” è il passaggio esplicito di **approvazione del proprietario** di OpenClaw.
Viene usato in due casi:

1. **Abbinamento DM** (chi è autorizzato a parlare con il bot)
2. **Abbinamento Node** (quali dispositivi/node sono autorizzati a unirsi alla rete del gateway)

Contesto di sicurezza: [Sicurezza](/it/gateway/security)

## 1) Abbinamento DM (accesso alla chat in entrata)

Quando un canale è configurato con il criterio DM `pairing`, i mittenti sconosciuti ricevono un codice breve e il loro messaggio **non viene elaborato** finché non lo approvi.

I criteri DM predefiniti sono documentati in: [Sicurezza](/it/gateway/security)

Codici di abbinamento:

- 8 caratteri, maiuscoli, senza caratteri ambigui (`0O1I`).
- **Scadono dopo 1 ora**. Il bot invia il messaggio di abbinamento solo quando viene creata una nuova richiesta (circa una volta all'ora per mittente).
- Le richieste di abbinamento DM in sospeso sono limitate per impostazione predefinita a **3 per canale**; le richieste aggiuntive vengono ignorate finché una non scade o non viene approvata.

### Approvare un mittente

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

Canali supportati: `bluebubbles`, `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `matrix`, `mattermost`, `msteams`, `nextcloud-talk`, `nostr`, `openclaw-weixin`, `signal`, `slack`, `synology-chat`, `telegram`, `twitch`, `whatsapp`, `zalo`, `zalouser`.

### Dove si trova lo stato

Memorizzato in `~/.openclaw/credentials/`:

- Richieste in sospeso: `<channel>-pairing.json`
- Archivio allowlist approvata:
  - Account predefinito: `<channel>-allowFrom.json`
  - Account non predefinito: `<channel>-<accountId>-allowFrom.json`

Comportamento dell'ambito per account:

- Gli account non predefiniti leggono/scrivono solo il proprio file allowlist con ambito.
- L'account predefinito usa il file allowlist senza ambito a livello di canale.

Tratta questi file come sensibili (controllano l'accesso al tuo assistente).

Importante: questo archivio è per l'accesso DM. L'autorizzazione dei gruppi è separata.
Approvare un codice di abbinamento DM non consente automaticamente a quel mittente di eseguire comandi di gruppo o di controllare il bot nei gruppi. Per l'accesso ai gruppi, configura le allowlist esplicite del canale per i gruppi (ad esempio `groupAllowFrom`, `groups` o override per gruppo/per topic a seconda del canale).

## 2) Abbinamento dei dispositivi Node (Node iOS/Android/macOS/headless)

I Node si connettono al Gateway come **dispositivi** con `role: node`. Il Gateway
crea una richiesta di abbinamento del dispositivo che deve essere approvata.

### Abbinare tramite Telegram (consigliato per iOS)

Se usi il Plugin `device-pair`, puoi effettuare il primo abbinamento del dispositivo interamente da Telegram:

1. In Telegram, invia al tuo bot: `/pair`
2. Il bot risponde con due messaggi: un messaggio di istruzioni e un messaggio separato con il **codice di configurazione** (facile da copiare/incollare in Telegram).
3. Sul telefono, apri l'app iOS di OpenClaw → Impostazioni → Gateway.
4. Incolla il codice di configurazione e connettiti.
5. Tornato su Telegram: `/pair pending` (rivedi gli ID richiesta, il ruolo e gli scope), quindi approva.

Il codice di configurazione è un payload JSON codificato in base64 che contiene:

- `url`: l'URL WebSocket del Gateway (`ws://...` o `wss://...`)
- `bootstrapToken`: un token bootstrap monouso e di breve durata usato per l'handshake iniziale di abbinamento

Quel token bootstrap contiene il profilo bootstrap di abbinamento integrato:

- il token `node` principale passato resta `scopes: []`
- qualsiasi token `operator` passato resta limitato alla allowlist bootstrap:
  `operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`
- i controlli degli scope bootstrap hanno prefisso di ruolo, non un unico pool piatto di scope:
  le voci di scope operator soddisfano solo richieste operator, e i ruoli non operator
  devono comunque richiedere scope sotto il proprio prefisso di ruolo

Tratta il codice di configurazione come una password finché è valido.

### Approvare un dispositivo Node

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Se lo stesso dispositivo riprova con dettagli di autenticazione diversi (ad esempio
ruolo/scope/chiave pubblica differenti), la richiesta in sospeso precedente viene sostituita e viene creato un nuovo `requestId`.

Importante: un dispositivo già abbinato non ottiene in silenzio un accesso più ampio. Se
si riconnette richiedendo più scope o un ruolo più ampio, OpenClaw mantiene
l'approvazione esistente così com'è e crea una nuova richiesta di upgrade in sospeso. Usa
`openclaw devices list` per confrontare l'accesso attualmente approvato con il nuovo
accesso richiesto prima di approvare.

### Archiviazione dello stato di abbinamento dei Node

Memorizzato in `~/.openclaw/devices/`:

- `pending.json` (di breve durata; le richieste in sospeso scadono)
- `paired.json` (dispositivi abbinati + token)

### Note

- L'API legacy `node.pair.*` (CLI: `openclaw nodes pending|approve|reject|rename`) è un
  archivio di abbinamento separato gestito dal gateway. I Node WS richiedono comunque l'abbinamento del dispositivo.
- Il record di abbinamento è la fonte attendibile durevole per i ruoli approvati. I
  token dei dispositivi attivi restano limitati a quel set di ruoli approvati; una voce token isolata
  al di fuori dei ruoli approvati non crea nuovo accesso.

## Documenti correlati

- Modello di sicurezza + prompt injection: [Sicurezza](/it/gateway/security)
- Aggiornare in sicurezza (esegui doctor): [Aggiornamento](/it/install/updating)
- Configurazioni dei canali:
  - Telegram: [Telegram](/it/channels/telegram)
  - WhatsApp: [WhatsApp](/it/channels/whatsapp)
  - Signal: [Signal](/it/channels/signal)
  - BlueBubbles (iMessage): [BlueBubbles](/it/channels/bluebubbles)
  - iMessage (legacy): [iMessage](/it/channels/imessage)
  - Discord: [Discord](/it/channels/discord)
  - Slack: [Slack](/it/channels/slack)
