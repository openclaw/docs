---
read_when:
    - Configurazione del controllo di accesso ai DM
    - Associazione di un nuovo Node iOS/Android
    - Revisione della postura di sicurezza di OpenClaw
summary: 'Panoramica dell''associazione: approva chi può inviarti messaggi diretti + quali nodi possono unirsi'
title: Abbinamento
x-i18n:
    generated_at: "2026-04-30T08:39:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: cfdcaf831aedb122ea85200518b8dc1c6f42eff365444dee6c4b740050b1ce26
    source_path: channels/pairing.md
    workflow: 16
---

L'“associazione” è il passaggio esplicito di approvazione dell'accesso di OpenClaw.
Viene usata in due punti:

1. **Associazione dei messaggi diretti** (chi è autorizzato a parlare con il bot)
2. **Associazione dei Node** (quali dispositivi/nodi sono autorizzati a unirsi alla rete del Gateway)

Contesto di sicurezza: [Sicurezza](/it/gateway/security)

## 1) Associazione dei messaggi diretti (accesso chat in entrata)

Quando un canale è configurato con la policy dei messaggi diretti `pairing`, i mittenti sconosciuti ricevono un codice breve e il loro messaggio **non viene elaborato** finché non lo approvi.

Le policy predefinite per i messaggi diretti sono documentate in: [Sicurezza](/it/gateway/security)

`dmPolicy: "open"` è pubblico solo quando l'allowlist effettiva dei messaggi diretti include `"*"`.
La configurazione e la convalida richiedono quel carattere jolly per le configurazioni pubbliche aperte. Se lo stato esistente
contiene `open` con voci `allowFrom` concrete, a runtime vengono comunque ammessi
solo quei mittenti e le approvazioni dell'archivio di associazione non estendono l'accesso `open`.

Codici di associazione:

- 8 caratteri, maiuscoli, senza caratteri ambigui (`0O1I`).
- **Scadono dopo 1 ora**. Il bot invia il messaggio di associazione solo quando viene creata una nuova richiesta (circa una volta all'ora per mittente).
- Le richieste di associazione dei messaggi diretti in sospeso sono limitate per impostazione predefinita a **3 per canale**; le richieste aggiuntive vengono ignorate finché una non scade o viene approvata.

### Approvare un mittente

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

Se non è ancora configurato alcun proprietario dei comandi, l'approvazione di un codice di associazione dei messaggi diretti inizializza anche
`commands.ownerAllowFrom` con il mittente approvato, per esempio `telegram:123456789`.
Questo fornisce alle configurazioni iniziali un proprietario esplicito per i comandi privilegiati e le richieste di approvazione di esecuzione.
Dopo che esiste un proprietario, le approvazioni di associazione successive concedono solo l'accesso ai messaggi diretti;
non aggiungono altri proprietari.

Canali supportati: `bluebubbles`, `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `matrix`, `mattermost`, `msteams`, `nextcloud-talk`, `nostr`, `openclaw-weixin`, `signal`, `slack`, `synology-chat`, `telegram`, `twitch`, `whatsapp`, `zalo`, `zalouser`.

### Dove si trova lo stato

Archiviato in `~/.openclaw/credentials/`:

- Richieste in sospeso: `<channel>-pairing.json`
- Archivio allowlist approvata:
  - Account predefinito: `<channel>-allowFrom.json`
  - Account non predefinito: `<channel>-<accountId>-allowFrom.json`

Comportamento dell'ambito degli account:

- Gli account non predefiniti leggono/scrivono solo il proprio file allowlist con ambito.
- L'account predefinito usa il file allowlist senza ambito specifico del canale.

Trattali come dati sensibili (controllano l'accesso al tuo assistente).

<Note>
L'archivio allowlist di associazione è per l'accesso ai messaggi diretti. L'autorizzazione dei gruppi è separata.
L'approvazione di un codice di associazione dei messaggi diretti non autorizza automaticamente quel mittente a eseguire comandi di gruppo
o a controllare il bot nei gruppi. L'inizializzazione del primo proprietario è uno stato di configurazione separato
in `commands.ownerAllowFrom`, e la consegna nelle chat di gruppo segue comunque le allowlist di gruppo
del canale (per esempio `groupAllowFrom`, `groups`, oppure override per gruppo
o per topic a seconda del canale).
</Note>

## 2) Associazione dei dispositivi Node (nodi iOS/Android/macOS/headless)

I nodi si connettono al Gateway come **dispositivi** con `role: node`. Il Gateway
crea una richiesta di associazione del dispositivo che deve essere approvata.

### Associare tramite Telegram (consigliato per iOS)

Se usi il Plugin `device-pair`, puoi completare la prima associazione del dispositivo interamente da Telegram:

1. In Telegram, invia un messaggio al tuo bot: `/pair`
2. Il bot risponde con due messaggi: un messaggio di istruzioni e un messaggio separato con il **codice di configurazione** (facile da copiare/incollare in Telegram).
3. Sul telefono, apri l'app iOS di OpenClaw → Impostazioni → Gateway.
4. Incolla il codice di configurazione e connettiti.
5. Di nuovo in Telegram: `/pair pending` (controlla ID richiesta, ruolo e ambiti), poi approva.

Il codice di configurazione è un payload JSON codificato in base64 che contiene:

- `url`: l'URL WebSocket del Gateway (`ws://...` o `wss://...`)
- `bootstrapToken`: un token bootstrap di breve durata per un singolo dispositivo usato per l'handshake di associazione iniziale

Quel token bootstrap include il profilo bootstrap di associazione integrato:

- il token `node` principale trasferito resta `scopes: []`
- qualsiasi token `operator` trasferito resta limitato all'allowlist bootstrap:
  `operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`
- i controlli degli ambiti bootstrap hanno il prefisso del ruolo, non un unico pool piatto di ambiti:
  le voci di ambito operator soddisfano solo le richieste operator, e i ruoli non operator
  devono comunque richiedere ambiti sotto il proprio prefisso di ruolo
- la successiva rotazione/revoca dei token resta limitata sia dal contratto di ruolo approvato del dispositivo
  sia dagli ambiti operator della sessione chiamante

Tratta il codice di configurazione come una password finché è valido.

### Approvare un dispositivo Node

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Se lo stesso dispositivo riprova con dettagli di autenticazione diversi (per esempio ruolo/ambiti/chiave pubblica diversi),
la precedente richiesta in sospeso viene sostituita e viene creato un nuovo
`requestId`.

<Note>
Un dispositivo già associato non riceve silenziosamente un accesso più ampio. Se si riconnette chiedendo più ambiti o un ruolo più ampio, OpenClaw mantiene invariata l'approvazione esistente e crea una nuova richiesta di upgrade in sospeso. Usa `openclaw devices list` per confrontare l'accesso attualmente approvato con il nuovo accesso richiesto prima di approvare.
</Note>

### Approvazione automatica opzionale dei Node con CIDR attendibili

L'associazione dei dispositivi resta manuale per impostazione predefinita. Per reti Node strettamente controllate,
puoi abilitare l'approvazione automatica iniziale dei Node con CIDR espliciti o IP esatti:

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

Questo si applica solo alle nuove richieste di associazione `role: node` senza ambiti richiesti.
I client operator, browser, Control UI e WebChat richiedono comunque l'approvazione manuale.
Le modifiche a ruolo, ambito, metadati e chiave pubblica richiedono comunque l'approvazione manuale.

### Archiviazione dello stato di associazione dei Node

Archiviato in `~/.openclaw/devices/`:

- `pending.json` (di breve durata; le richieste in sospeso scadono)
- `paired.json` (dispositivi associati + token)

### Note

- L'API legacy `node.pair.*` (CLI: `openclaw nodes pending|approve|reject|remove|rename`) è un
  archivio di associazione separato di proprietà del gateway. I nodi WS richiedono comunque l'associazione del dispositivo.
- Il record di associazione è la fonte di verità durevole per i ruoli approvati. I token dispositivo attivi
  restano limitati a quel set di ruoli approvato; una voce di token isolata
  al di fuori dei ruoli approvati non crea nuovo accesso.

## Documenti correlati

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
