---
read_when:
    - Configurazione del controllo degli accessi DM
    - Pairing di un nuovo nodo iOS/Android
    - Revisione della postura di sicurezza di OpenClaw
summary: 'Panoramica del pairing: approva chi può inviarti DM e quali nodi possono unirsi'
title: Pairing
x-i18n:
    generated_at: "2026-04-05T13:43:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2bd99240b3530def23c05a26915d07cf8b730565c2822c6338437f8fb3f285c9
    source_path: channels/pairing.md
    workflow: 15
---

# Pairing

Il “pairing” è il passaggio esplicito di **approvazione del proprietario** di OpenClaw.
Viene usato in due punti:

1. **DM pairing** (chi è autorizzato a parlare con il bot)
2. **Node pairing** (quali dispositivi/nodi sono autorizzati a unirsi alla rete del gateway)

Contesto di sicurezza: [Security](/gateway/security)

## 1) DM pairing (accesso alla chat in ingresso)

Quando un canale è configurato con la policy DM `pairing`, i mittenti sconosciuti ricevono un codice breve e il loro messaggio **non viene elaborato** finché non approvi.

Le policy DM predefinite sono documentate in: [Security](/gateway/security)

Codici di pairing:

- 8 caratteri, maiuscoli, senza caratteri ambigui (`0O1I`).
- **Scadono dopo 1 ora**. Il bot invia il messaggio di pairing solo quando viene creata una nuova richiesta (all'incirca una volta all'ora per mittente).
- Le richieste di DM pairing in sospeso sono limitate per impostazione predefinita a **3 per canale**; le richieste aggiuntive vengono ignorate finché una non scade o non viene approvata.

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

Comportamento dell'ambito account:

- Gli account non predefiniti leggono/scrivono solo il proprio file allowlist con ambito.
- L'account predefinito usa il file allowlist senza ambito, con ambito del canale.

Tratta questi file come sensibili (controllano l'accesso al tuo assistente).

Importante: questo archivio serve per l'accesso DM. L'autorizzazione dei gruppi è separata.
Approvare un codice di DM pairing non consente automaticamente a quel mittente di eseguire comandi di gruppo o controllare il bot nei gruppi. Per l'accesso ai gruppi, configura le allowlist esplicite del canale per i gruppi (ad esempio `groupAllowFrom`, `groups` o override per gruppo/per argomento a seconda del canale).

## 2) Pairing del dispositivo nodo (nodi iOS/Android/macOS/headless)

I nodi si connettono al Gateway come **dispositivi** con `role: node`. Il Gateway
crea una richiesta di pairing del dispositivo che deve essere approvata.

### Pairing tramite Telegram (consigliato per iOS)

Se usi il plugin `device-pair`, puoi eseguire il primo pairing del dispositivo interamente da Telegram:

1. In Telegram, invia al tuo bot: `/pair`
2. Il bot risponde con due messaggi: un messaggio di istruzioni e un messaggio separato con il **codice di configurazione** (facile da copiare/incollare in Telegram).
3. Sul telefono, apri l'app iOS di OpenClaw → Impostazioni → Gateway.
4. Incolla il codice di configurazione e connettiti.
5. Tornato in Telegram: `/pair pending` (rivedi ID richiesta, ruolo e scope), quindi approva.

Il codice di configurazione è un payload JSON codificato in base64 che contiene:

- `url`: l'URL WebSocket del Gateway (`ws://...` oppure `wss://...`)
- `bootstrapToken`: un bootstrap token a breve durata, per un solo dispositivo, usato per l'handshake iniziale di pairing

Quel bootstrap token contiene il profilo bootstrap di pairing integrato:

- il token `node` primario trasferito resta `scopes: []`
- qualsiasi token `operator` trasferito resta vincolato all'allowlist bootstrap:
  `operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`
- i controlli degli scope bootstrap usano prefissi di ruolo, non un unico pool di scope:
  le voci di scope operator soddisfano solo richieste operator, e i ruoli non operator
  devono comunque richiedere scope sotto il proprio prefisso di ruolo

Tratta il codice di configurazione come una password finché è valido.

### Approvare un dispositivo nodo

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Se lo stesso dispositivo ritenta con dettagli di autenticazione diversi (ad esempio
ruolo/scope/chiave pubblica diversi), la precedente richiesta in sospeso viene sostituita e viene creato un nuovo
`requestId`.

### Archiviazione dello stato di pairing del nodo

Memorizzato in `~/.openclaw/devices/`:

- `pending.json` (a breve durata; le richieste in sospeso scadono)
- `paired.json` (dispositivi abbinati + token)

### Note

- L'API legacy `node.pair.*` (CLI: `openclaw nodes pending|approve|reject|rename`) è un
  archivio di pairing separato di proprietà del gateway. I nodi WS richiedono comunque il pairing del dispositivo.
- Il record di pairing è la fonte di verità durevole per i ruoli approvati. I token attivi del
  dispositivo restano vincolati a quell'insieme di ruoli approvati; una voce token isolata
  al di fuori dei ruoli approvati non crea nuovo accesso.

## Documenti correlati

- Modello di sicurezza + prompt injection: [Security](/gateway/security)
- Aggiornare in sicurezza (esegui doctor): [Updating](/install/updating)
- Configurazioni dei canali:
  - Telegram: [Telegram](/channels/telegram)
  - WhatsApp: [WhatsApp](/channels/whatsapp)
  - Signal: [Signal](/channels/signal)
  - BlueBubbles (iMessage): [BlueBubbles](/channels/bluebubbles)
  - iMessage (legacy): [iMessage](/channels/imessage)
  - Discord: [Discord](/channels/discord)
  - Slack: [Slack](/channels/slack)
