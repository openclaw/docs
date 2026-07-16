---
read_when:
    - Configurazione del controllo degli accessi ai messaggi diretti
    - Abbinamento di un nuovo nodo iOS/Android
    - Revisione della postura di sicurezza di OpenClaw
summary: 'Panoramica dell''associazione: approvare chi può inviarti messaggi diretti e quali Node possono unirsi'
title: Associazione
x-i18n:
    generated_at: "2026-07-16T14:00:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ef58100d222604ab2f0e073c268750eb0996b598dc37b3d4ca20a444d2c69f1e
    source_path: channels/pairing.md
    workflow: 16
---

Il "pairing" è il passaggio esplicito di approvazione dell'accesso di OpenClaw.
Viene utilizzato in due ambiti:

1. **Pairing dei DM** (chi è autorizzato a comunicare con il bot)
2. **Pairing dei Node** (quali dispositivi/Node sono autorizzati a unirsi alla rete del Gateway)

Contesto di sicurezza: [Sicurezza](/it/gateway/security)

## 1) Pairing dei DM (accesso alle chat in entrata)

Quando un canale è configurato con il criterio DM `pairing`, i mittenti sconosciuti ricevono un codice breve e il loro messaggio **non viene elaborato** finché non viene concesso il consenso.

I criteri DM predefiniti sono documentati in: [Sicurezza](/it/gateway/security)

`dmPolicy: "open"` è pubblico solo quando l'elenco dei mittenti DM consentiti effettivo include `"*"`.
La configurazione e la convalida richiedono tale carattere jolly per le configurazioni aperte al pubblico. Se lo stato esistente
contiene `open` con voci `allowFrom` specifiche, il runtime continua ad ammettere
solo tali mittenti e le approvazioni nell'archivio di pairing non ampliano l'accesso `open`.

Codici di pairing:

- 8 caratteri, maiuscoli, senza caratteri ambigui (`0O1I`).
- **Scadono dopo 1 ora**. Il bot invia il messaggio di pairing solo quando viene creata una nuova richiesta (all'incirca una volta all'ora per mittente).
- Le richieste di pairing DM in sospeso sono limitate a **3 per account del canale**; le richieste aggiuntive vengono ignorate finché una non scade o non viene approvata.

### Approvare un mittente

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

Aggiungere `--notify` al comando di approvazione per informare il richiedente sullo stesso canale. I canali con più account accettano `--account <id>`.

Se non è ancora configurato alcun proprietario dei comandi, l'approvazione di un codice di pairing DM inizializza anche
`commands.ownerAllowFrom` con il mittente approvato, ad esempio `telegram:123456789`.
In questo modo, le configurazioni iniziali dispongono di un proprietario esplicito per i comandi privilegiati e le richieste
di approvazione dell'esecuzione. Una volta definito un proprietario, le approvazioni di pairing successive concedono solo
l'accesso ai DM e non aggiungono altri proprietari.

Canali supportati (qualsiasi Plugin del canale installato che dichiari il pairing; i Plugin esterni come `openclaw-weixin` possono aggiungerne altri): `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `matrix`, `mattermost`, `msteams`, `nextcloud-talk`, `nostr`, `signal`, `slack`, `sms`, `synology-chat`, `telegram`, `twitch`, `whatsapp`, `zalo`, `zalouser`.

### Gruppi di mittenti riutilizzabili

Utilizzare `accessGroups` al livello principale quando lo stesso insieme di mittenti attendibili deve essere applicato a
più canali di messaggistica o sia agli elenchi consentiti dei DM sia a quelli dei gruppi.

I gruppi statici utilizzano `type: "message.senders"` e sono referenziati con
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

### Posizione dello stato

Archiviato nel database di stato SQLite condiviso in
`~/.openclaw/state/openclaw.sqlite`:

- richieste in sospeso in `channel_pairing_requests`
- mittenti approvati in `channel_pairing_allow_entries`

Comportamento dell'ambito degli account:

- ogni richiesta e mittente approvato è identificato per canale e account
- il runtime legge solo le righe SQLite canoniche e non combina i file legacy

I Gateway meno recenti scrivevano `<channel>-pairing.json` e
`<channel>-<accountId>-allowFrom.json` in `~/.openclaw/credentials/`.
La migrazione all'avvio e `openclaw doctor --fix` importano questi file in SQLite e
rimuovono ogni origine dopo un'importazione riuscita. Il database SQLite deve essere considerato
sensibile, poiché queste righe regolano l'accesso all'assistente.

<Note>
L'archivio dell'elenco consentito per il pairing riguarda l'accesso ai DM. L'autorizzazione dei gruppi è distinta.
L'approvazione di un codice di pairing DM non autorizza automaticamente il mittente a eseguire comandi nei gruppi
o a controllare il bot nei gruppi. L'inizializzazione del primo proprietario è uno stato di configurazione distinto
in `commands.ownerAllowFrom` e la consegna nelle chat di gruppo continua a seguire gli elenchi consentiti
dei gruppi del canale (ad esempio `groupAllowFrom`, `groups` o le sostituzioni specifiche per gruppo
o argomento, a seconda del canale).
</Note>

## 2) Pairing dei dispositivi Node (Node iOS/Android/macOS/headless)

I Node si connettono al Gateway come **dispositivi** con `role: node`. Il Gateway
crea una richiesta di pairing del dispositivo che deve essere approvata.

### Eseguire il pairing dalla Control UI (consigliato)

Utilizzare una sessione Control UI già connessa con accesso `operator.admin`:

1. Aprire la Control UI e passare a **Settings → Devices**.
2. Nella pagina **Devices**, fare clic su **Pair mobile device**.
3. Mantenere **Full access (recommended)** oppure selezionare **Limited access** per escludere
   i controlli amministrativi del Gateway.
4. Fare clic su **Create setup code**.
5. Sul telefono, aprire l'app OpenClaw → **Settings** → **Gateway**.
6. Scansionare il codice QR o incollare il codice di configurazione, quindi connettersi.

Le app OpenClaw ufficiali per iOS e Android vengono approvate automaticamente quando i relativi
metadati del codice di configurazione corrispondono. Se **Pending approval** mostra una richiesta (ad
esempio per un client non ufficiale o metadati non corrispondenti), esaminarne il ruolo e
gli ambiti prima di approvarla.

Il pulsante è disabilitato quando la sessione Control UI corrente non dispone
dell'accesso amministratore. In tal caso, utilizzare dal sistema host del Gateway la procedura di approvazione tramite CLI
riportata di seguito.

### Eseguire il pairing tramite Telegram

Se si utilizza il Plugin `device-pair`, è possibile eseguire interamente da Telegram il pairing iniziale del dispositivo:

1. In Telegram, inviare al bot: `/pair`
2. Il bot risponde con due messaggi: un messaggio di istruzioni e un messaggio separato contenente il **codice di configurazione** (facile da copiare e incollare in Telegram).
3. Sul telefono, aprire l'app OpenClaw per iOS → Settings → Gateway.
4. Scansionare il codice QR (`/pair qr`) oppure incollare il codice di configurazione e connettersi.
5. L'app mobile ufficiale si connette automaticamente. Se `/pair pending` mostra una
   richiesta, esaminarne il ruolo e gli ambiti prima di approvarla.

Il codice di configurazione è un payload JSON codificato in base64 che contiene:

- `url`: l'URL WebSocket del Gateway (`ws://...` o `wss://...`)
- `urls`: quando disponibili, le route LAN/Tailnet ordinate che l'app mobile può provare
- `bootstrapToken`: un token di bootstrap monouso per l'handshake iniziale di pairing; il Gateway lo fa scadere dopo 10 minuti

Eseguire `/pair cleanup` per invalidare i codici di configurazione inutilizzati al termine del pairing.

Il token di bootstrap include il profilo di bootstrap di pairing integrato:

- una configurazione `wss://` sicura (o loopback sullo stesso host) utilizza per impostazione predefinita `node` più l'accesso
  `operator` nativo mobile completo
- il token `node` trasferito rimane `scopes: []`
- il token `operator` trasferito predefinito include `operator.admin`,
  `operator.approvals`, `operator.read`, `operator.talk.secrets` e
  `operator.write`
- **Limited access** della Control UI e `openclaw qr --limited` omettono
  `operator.admin` mantenendo gli altri ambiti dell'operatore
- la configurazione LAN in testo normale `ws://` utilizza automaticamente lo stesso profilo limitato;
  configurare `wss://` o Tailscale Serve e generare un nuovo codice per l'accesso completo
- la successiva rotazione/revoca del token rimane limitata sia dal contratto di ruolo approvato
  del dispositivo sia dagli ambiti dell'operatore della sessione chiamante

Finché è valido, il codice di configurazione deve essere trattato come una password.

Le pagine **Settings → Gateway** di iOS e Android mostrano l'accesso **Full** o **Limited**.
Per aggiornare un telefono con accesso limitato, configurare innanzitutto una route `wss://` sicura o
Tailscale Serve, quindi generare un nuovo codice di configurazione con accesso completo, scansionarlo o incollarlo
nella pagina delle impostazioni e riconnettersi.

Per il pairing mobile tramite Tailscale, pubblico o comunque remoto, utilizzare Tailscale Serve/Funnel
o un altro URL `wss://` del Gateway. I codici di configurazione in testo normale `ws://` vengono accettati solo
per il loopback, gli indirizzi LAN privati, gli host Bonjour `.local` e l'host dell'emulatore
Android. Le route in testo normale non di loopback ricevono un accesso limitato. Gli indirizzi CGNAT
della Tailnet, i nomi `.ts.net` e gli host pubblici continuano a non consentire l'accesso prima
dell'emissione del codice QR/di configurazione.

Per gli URL di configurazione `gateway.bind=lan`, OpenClaw rileva le radici HTTPS persistenti di Tailscale Serve
che fungono da proxy per la porta di loopback del Gateway attivo e le segnala
insieme alla route LAN. Il comando di configurazione aggiunge questo fallback solo
per `lan`; `custom` e `tailnet` mantengono le route indicate esplicitamente. L'app
iOS verifica le route indicate nell'ordine e salva il primo endpoint raggiungibile.

### Approvare un dispositivo Node

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Quando un'approvazione esplicita viene negata perché la sessione del dispositivo associato che concede
l'approvazione è stata aperta con il solo ambito di pairing, la CLI riprova la stessa richiesta con
`operator.admin`. Ciò consente a un dispositivo associato esistente con capacità amministrative di recuperare un nuovo
pairing della Control UI/del browser senza modificare manualmente l'archivio di pairing. Il
Gateway convalida comunque la connessione riprovata; i token che non possono autenticarsi
con `operator.admin` rimangono bloccati.

Se lo stesso dispositivo riprova con dettagli di autenticazione diversi (ad esempio un diverso
ruolo/ambiti/chiave pubblica), la richiesta precedente in sospeso viene sostituita e viene creato un nuovo
`requestId`.

<Note>
Un dispositivo già associato non ottiene silenziosamente un accesso più ampio. Se si riconnette richiedendo più ambiti o un ruolo più ampio, OpenClaw mantiene invariata l'approvazione esistente e crea una nuova richiesta di aggiornamento in sospeso. Utilizzare `openclaw devices list` per confrontare l'accesso attualmente approvato con il nuovo accesso richiesto prima di procedere all'approvazione.
</Note>

### Approvazione automatica facoltativa dei Node per CIDR attendibili

Per impostazione predefinita, il pairing dei dispositivi rimane manuale. Per le reti di Node strettamente controllate,
è possibile abilitare l'approvazione automatica al primo pairing dei Node con CIDR espliciti o IP esatti:

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

Ciò si applica solo alle nuove richieste di pairing `role: node` prive di ambiti
richiesti. I client operatore, browser, Control UI e WebChat richiedono comunque l'approvazione
manuale. Le modifiche a ruolo, ambito, metadati e chiave pubblica richiedono comunque l'approvazione
manuale.

### Archiviazione dello stato di pairing dei Node

Archiviato nel database di stato SQLite condiviso in `~/.openclaw/state/openclaw.sqlite`:

- richieste di pairing dei dispositivi in sospeso (di breve durata; scadono dopo 5 minuti)
- dispositivi associati + token

I Gateway meno recenti conservavano questo stato in `~/.openclaw/devices/*.json`; tali file vengono
importati in SQLite all'avvio del Gateway e archiviati con il suffisso `.migrated`.

### Note

- L'API `node.pair.*` (CLI: `openclaw nodes pending|approve|reject|remove|rename`) gestisce
  le approvazioni delle funzionalità dei Node archiviate negli stessi record dei dispositivi associati. I Node WS
  richiedono comunque il pairing del dispositivo; consultare [Pairing dei Node](/it/gateway/pairing).
- Il record di pairing è la fonte di verità persistente per i ruoli approvati. I token
  dei dispositivi attivi rimangono limitati a tale insieme di ruoli approvati; una voce token isolata
  al di fuori dei ruoli approvati non crea un nuovo accesso.

## Documentazione correlata

- Modello di sicurezza + prompt injection: [Sicurezza](/it/gateway/security)
- Aggiornamento sicuro (eseguire doctor): [Aggiornamento](/it/install/updating)
- Configurazioni dei canali:
  - Telegram: [Telegram](/it/channels/telegram)
  - WhatsApp: [WhatsApp](/it/channels/whatsapp)
  - Signal: [Signal](/it/channels/signal)
  - iMessage: [iMessage](/it/channels/imessage)
  - Discord: [Discord](/it/channels/discord)
  - Slack: [Slack](/it/channels/slack)
