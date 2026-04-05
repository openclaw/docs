---
read_when:
    - Lavoro sulle funzionalità del canale Microsoft Teams
summary: Stato del supporto del bot Microsoft Teams, capacità e configurazione
title: Microsoft Teams
x-i18n:
    generated_at: "2026-04-05T13:47:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 99fc6e136893ec65dc85d3bc0c0d92134069a2f3b8cb4fcf66c14674399b3eaf
    source_path: channels/msteams.md
    workflow: 15
---

# Microsoft Teams

> "Lasciate ogni speranza, voi che entrate qui."

Aggiornato: 2026-01-21

Stato: il testo + gli allegati DM sono supportati; l'invio di file in canali/gruppi richiede `sharePointSiteId` + autorizzazioni Graph (vedi [Invio di file nelle chat di gruppo](#sending-files-in-group-chats)). I sondaggi vengono inviati tramite Adaptive Cards. Le azioni del messaggio espongono `upload-file` esplicito per gli invii con file come primo elemento.

## Plugin incluso

Microsoft Teams viene fornito come plugin incluso nelle attuali versioni di OpenClaw, quindi
non è necessaria alcuna installazione separata nella normale build pacchettizzata.

Se usi una build precedente o un'installazione personalizzata che esclude Teams incluso,
installalo manualmente:

```bash
openclaw plugins install @openclaw/msteams
```

Checkout locale (quando esegui da un repository git):

```bash
openclaw plugins install ./path/to/local/msteams-plugin
```

Dettagli: [Plugins](/tools/plugin)

## Configurazione rapida (principianti)

1. Assicurati che il plugin Microsoft Teams sia disponibile.
   - Le attuali versioni pacchettizzate di OpenClaw lo includono già.
   - Le installazioni precedenti/personalizzate possono aggiungerlo manualmente con i comandi sopra.
2. Crea un **Azure Bot** (ID app + client secret + ID tenant).
3. Configura OpenClaw con queste credenziali.
4. Esponi `/api/messages` (porta 3978 per impostazione predefinita) tramite un URL pubblico o un tunnel.
5. Installa il pacchetto app Teams e avvia il gateway.

Configurazione minima:

```json5
{
  channels: {
    msteams: {
      enabled: true,
      appId: "<APP_ID>",
      appPassword: "<APP_PASSWORD>",
      tenantId: "<TENANT_ID>",
      webhook: { port: 3978, path: "/api/messages" },
    },
  },
}
```

Nota: le chat di gruppo sono bloccate per impostazione predefinita (`channels.msteams.groupPolicy: "allowlist"`). Per consentire le risposte nei gruppi, imposta `channels.msteams.groupAllowFrom` (oppure usa `groupPolicy: "open"` per consentire qualsiasi membro, con gate basato su menzione).

## Obiettivi

- Parlare con OpenClaw tramite DM Teams, chat di gruppo o canali.
- Mantenere il routing deterministico: le risposte tornano sempre al canale da cui sono arrivate.
- Adottare per impostazione predefinita un comportamento sicuro nei canali (menzioni richieste salvo diversa configurazione).

## Scritture di configurazione

Per impostazione predefinita, Microsoft Teams può scrivere aggiornamenti di configurazione attivati da `/config set|unset` (richiede `commands.config: true`).

Disabilita con:

```json5
{
  channels: { msteams: { configWrites: false } },
}
```

## Controllo degli accessi (DM + gruppi)

**Accesso DM**

- Predefinito: `channels.msteams.dmPolicy = "pairing"`. I mittenti sconosciuti vengono ignorati finché non vengono approvati.
- `channels.msteams.allowFrom` dovrebbe usare ID oggetto AAD stabili.
- UPN/nomi visualizzati sono modificabili; la corrispondenza diretta è disabilitata per impostazione predefinita e viene abilitata solo con `channels.msteams.dangerouslyAllowNameMatching: true`.
- La procedura guidata può risolvere i nomi in ID tramite Microsoft Graph quando le credenziali lo consentono.

**Accesso ai gruppi**

- Predefinito: `channels.msteams.groupPolicy = "allowlist"` (bloccato a meno che non aggiungi `groupAllowFrom`). Usa `channels.defaults.groupPolicy` per sovrascrivere il valore predefinito quando non è impostato.
- `channels.msteams.groupAllowFrom` controlla quali mittenti possono attivarsi nelle chat di gruppo/canali (con fallback a `channels.msteams.allowFrom`).
- Imposta `groupPolicy: "open"` per consentire qualsiasi membro (comunque con gate basato su menzione per impostazione predefinita).
- Per non consentire **alcun canale**, imposta `channels.msteams.groupPolicy: "disabled"`.

Esempio:

```json5
{
  channels: {
    msteams: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["user@org.com"],
    },
  },
}
```

**Teams + allowlist canali**

- Limita le risposte in gruppi/canali elencando team e canali in `channels.msteams.teams`.
- Le chiavi dovrebbero usare ID team stabili e ID conversazione del canale.
- Quando `groupPolicy="allowlist"` ed è presente una allowlist di team, vengono accettati solo team/canali elencati (con gate basato su menzione).
- La procedura guidata di configurazione accetta voci `Team/Channel` e le memorizza per te.
- All'avvio, OpenClaw risolve i nomi nelle allowlist di team/canali e utenti in ID (quando le autorizzazioni Graph lo consentono)
  e registra la mappatura; i nomi di team/canali non risolti vengono mantenuti così come digitati ma ignorati per il routing per impostazione predefinita, a meno che non sia abilitato `channels.msteams.dangerouslyAllowNameMatching: true`.

Esempio:

```json5
{
  channels: {
    msteams: {
      groupPolicy: "allowlist",
      teams: {
        "My Team": {
          channels: {
            General: { requireMention: true },
          },
        },
      },
    },
  },
}
```

## Come funziona

1. Assicurati che il plugin Microsoft Teams sia disponibile.
   - Le attuali versioni pacchettizzate di OpenClaw lo includono già.
   - Le installazioni precedenti/personalizzate possono aggiungerlo manualmente con i comandi sopra.
2. Crea un **Azure Bot** (ID app + secret + ID tenant).
3. Crea un **pacchetto app Teams** che faccia riferimento al bot e includa le autorizzazioni RSC qui sotto.
4. Carica/installa l'app Teams in un team (o nell'ambito personale per i DM).
5. Configura `msteams` in `~/.openclaw/openclaw.json` (o variabili d'ambiente) e avvia il gateway.
6. Per impostazione predefinita, il gateway ascolta il traffico webhook Bot Framework su `/api/messages`.

## Configurazione Azure Bot (prerequisiti)

Prima di configurare OpenClaw, devi creare una risorsa Azure Bot.

### Passaggio 1: crea Azure Bot

1. Vai a [Create Azure Bot](https://portal.azure.com/#create/Microsoft.AzureBot)
2. Compila la scheda **Basics**:

   | Campo              | Valore                                                   |
   | ------------------ | -------------------------------------------------------- |
   | **Bot handle**     | Il nome del tuo bot, ad esempio `openclaw-msteams` (deve essere univoco) |
   | **Subscription**   | Seleziona la tua sottoscrizione Azure                    |
   | **Resource group** | Creane uno nuovo o usane uno esistente                   |
   | **Pricing tier**   | **Free** per sviluppo/test                               |
   | **Type of App**    | **Single Tenant** (consigliato - vedi nota sotto)        |
   | **Creation type**  | **Create new Microsoft App ID**                          |

> **Avviso di deprecazione:** la creazione di nuovi bot multi-tenant è stata deprecata dopo il 2025-07-31. Usa **Single Tenant** per i nuovi bot.

3. Fai clic su **Review + create** → **Create** (attendi ~1-2 minuti)

### Passaggio 2: ottieni le credenziali

1. Vai alla tua risorsa Azure Bot → **Configuration**
2. Copia **Microsoft App ID** → questo è il tuo `appId`
3. Fai clic su **Manage Password** → vai all'App Registration
4. In **Certificates & secrets** → **New client secret** → copia il **Value** → questo è il tuo `appPassword`
5. Vai a **Overview** → copia **Directory (tenant) ID** → questo è il tuo `tenantId`

### Passaggio 3: configura l'endpoint di messaggistica

1. In Azure Bot → **Configuration**
2. Imposta **Messaging endpoint** sul tuo URL webhook:
   - Produzione: `https://your-domain.com/api/messages`
   - Sviluppo locale: usa un tunnel (vedi [Sviluppo locale](#local-development-tunneling) sotto)

### Passaggio 4: abilita il canale Teams

1. In Azure Bot → **Channels**
2. Fai clic su **Microsoft Teams** → Configure → Save
3. Accetta i Termini di servizio

## Sviluppo locale (tunneling)

Teams non può raggiungere `localhost`. Usa un tunnel per lo sviluppo locale:

**Opzione A: ngrok**

```bash
ngrok http 3978
# Copia l'URL https, ad esempio https://abc123.ngrok.io
# Imposta l'endpoint di messaggistica su: https://abc123.ngrok.io/api/messages
```

**Opzione B: Tailscale Funnel**

```bash
tailscale funnel 3978
# Usa il tuo URL Tailscale funnel come endpoint di messaggistica
```

## Teams Developer Portal (alternativa)

Invece di creare manualmente un file ZIP del manifest, puoi usare il [Teams Developer Portal](https://dev.teams.microsoft.com/apps):

1. Fai clic su **+ New app**
2. Compila le informazioni di base (nome, descrizione, informazioni sullo sviluppatore)
3. Vai a **App features** → **Bot**
4. Seleziona **Enter a bot ID manually** e incolla il tuo Azure Bot App ID
5. Seleziona gli ambiti: **Personal**, **Team**, **Group Chat**
6. Fai clic su **Distribute** → **Download app package**
7. In Teams: **Apps** → **Manage your apps** → **Upload a custom app** → seleziona il file ZIP

Spesso è più semplice che modificare manualmente i manifest JSON.

## Test del bot

**Opzione A: Azure Web Chat (verifica prima il webhook)**

1. In Azure Portal → la tua risorsa Azure Bot → **Test in Web Chat**
2. Invia un messaggio: dovresti vedere una risposta
3. Questo conferma che il tuo endpoint webhook funziona prima della configurazione Teams

**Opzione B: Teams (dopo l'installazione dell'app)**

1. Installa l'app Teams (sideload o catalogo org)
2. Trova il bot in Teams e invia un DM
3. Controlla i log del gateway per l'attività in ingresso

## Configurazione (solo testo minima)

1. **Assicurati che il plugin Microsoft Teams sia disponibile**
   - Le attuali versioni pacchettizzate di OpenClaw lo includono già.
   - Le installazioni precedenti/personalizzate possono aggiungerlo manualmente:
     - Da npm: `openclaw plugins install @openclaw/msteams`
     - Da un checkout locale: `openclaw plugins install ./path/to/local/msteams-plugin`

2. **Registrazione del bot**
   - Crea un Azure Bot (vedi sopra) e annota:
     - ID app
     - Client secret (password app)
     - ID tenant (single-tenant)

3. **Manifest dell'app Teams**
   - Includi una voce `bot` con `botId = <App ID>`.
   - Ambiti: `personal`, `team`, `groupChat`.
   - `supportsFiles: true` (richiesto per la gestione dei file nell'ambito personale).
   - Aggiungi le autorizzazioni RSC (sotto).
   - Crea le icone: `outline.png` (32x32) e `color.png` (192x192).
   - Comprimi insieme tutti e tre i file: `manifest.json`, `outline.png`, `color.png`.

4. **Configura OpenClaw**

   ```json5
   {
     channels: {
       msteams: {
         enabled: true,
         appId: "<APP_ID>",
         appPassword: "<APP_PASSWORD>",
         tenantId: "<TENANT_ID>",
         webhook: { port: 3978, path: "/api/messages" },
       },
     },
   }
   ```

   Puoi anche usare variabili d'ambiente invece delle chiavi di configurazione:
   - `MSTEAMS_APP_ID`
   - `MSTEAMS_APP_PASSWORD`
   - `MSTEAMS_TENANT_ID`

5. **Endpoint del bot**
   - Imposta l'Azure Bot Messaging Endpoint su:
     - `https://<host>:3978/api/messages` (o il tuo percorso/porta scelti).

6. **Esegui il gateway**
   - Il canale Teams si avvia automaticamente quando il plugin incluso o installato manualmente è disponibile e la configurazione `msteams` esiste con le credenziali.

## Azione informazioni membro

OpenClaw espone un'azione `member-info` supportata da Graph per Microsoft Teams in modo che agenti e automazioni possano risolvere i dettagli dei membri del canale (nome visualizzato, email, ruolo) direttamente da Microsoft Graph.

Requisiti:

- Autorizzazione RSC `Member.Read.Group` (già presente nel manifest consigliato)
- Per ricerche tra team diversi: autorizzazione applicazione Graph `User.Read.All` con consenso amministratore

L'azione è controllata da `channels.msteams.actions.memberInfo` (predefinito: abilitata quando sono disponibili credenziali Graph).

## Contesto cronologia

- `channels.msteams.historyLimit` controlla quanti messaggi recenti di canale/gruppo vengono inseriti nel prompt.
- Usa come fallback `messages.groupChat.historyLimit`. Imposta `0` per disabilitare (predefinito 50).
- La cronologia del thread recuperata viene filtrata tramite allowlist dei mittenti (`allowFrom` / `groupAllowFrom`), quindi l'inizializzazione del contesto del thread include solo messaggi di mittenti consentiti.
- Il contesto degli allegati citati (`ReplyTo*` derivato dall'HTML di risposta Teams) viene attualmente passato così come ricevuto.
- In altre parole, le allowlist controllano chi può attivare l'agente; oggi vengono filtrati solo specifici percorsi di contesto supplementare.
- La cronologia DM può essere limitata con `channels.msteams.dmHistoryLimit` (turni utente). Override per utente: `channels.msteams.dms["<user_id>"].historyLimit`.

## Autorizzazioni RSC Teams attuali (Manifest)

Queste sono le **attuali autorizzazioni resourceSpecific** nel nostro manifest dell'app Teams. Si applicano solo all'interno del team/chat in cui l'app è installata.

**Per i canali (ambito team):**

- `ChannelMessage.Read.Group` (Application) - riceve tutti i messaggi del canale senza @mention
- `ChannelMessage.Send.Group` (Application)
- `Member.Read.Group` (Application)
- `Owner.Read.Group` (Application)
- `ChannelSettings.Read.Group` (Application)
- `TeamMember.Read.Group` (Application)
- `TeamSettings.Read.Group` (Application)

**Per le chat di gruppo:**

- `ChatMessage.Read.Chat` (Application) - riceve tutti i messaggi della chat di gruppo senza @mention

## Esempio di manifest Teams (redatto)

Esempio minimo e valido con i campi richiesti. Sostituisci ID e URL.

```json5
{
  $schema: "https://developer.microsoft.com/en-us/json-schemas/teams/v1.23/MicrosoftTeams.schema.json",
  manifestVersion: "1.23",
  version: "1.0.0",
  id: "00000000-0000-0000-0000-000000000000",
  name: { short: "OpenClaw" },
  developer: {
    name: "Your Org",
    websiteUrl: "https://example.com",
    privacyUrl: "https://example.com/privacy",
    termsOfUseUrl: "https://example.com/terms",
  },
  description: { short: "OpenClaw in Teams", full: "OpenClaw in Teams" },
  icons: { outline: "outline.png", color: "color.png" },
  accentColor: "#5B6DEF",
  bots: [
    {
      botId: "11111111-1111-1111-1111-111111111111",
      scopes: ["personal", "team", "groupChat"],
      isNotificationOnly: false,
      supportsCalling: false,
      supportsVideo: false,
      supportsFiles: true,
    },
  ],
  webApplicationInfo: {
    id: "11111111-1111-1111-1111-111111111111",
  },
  authorization: {
    permissions: {
      resourceSpecific: [
        { name: "ChannelMessage.Read.Group", type: "Application" },
        { name: "ChannelMessage.Send.Group", type: "Application" },
        { name: "Member.Read.Group", type: "Application" },
        { name: "Owner.Read.Group", type: "Application" },
        { name: "ChannelSettings.Read.Group", type: "Application" },
        { name: "TeamMember.Read.Group", type: "Application" },
        { name: "TeamSettings.Read.Group", type: "Application" },
        { name: "ChatMessage.Read.Chat", type: "Application" },
      ],
    },
  },
}
```

### Limitazioni del manifest (campi obbligatori)

- `bots[].botId` **deve** corrispondere all'Azure Bot App ID.
- `webApplicationInfo.id` **deve** corrispondere all'Azure Bot App ID.
- `bots[].scopes` deve includere le superfici che intendi usare (`personal`, `team`, `groupChat`).
- `bots[].supportsFiles: true` è richiesto per la gestione dei file nell'ambito personale.
- `authorization.permissions.resourceSpecific` deve includere lettura/invio canale se vuoi traffico canale.

### Aggiornare un'app esistente

Per aggiornare un'app Teams già installata (ad esempio, per aggiungere autorizzazioni RSC):

1. Aggiorna il tuo `manifest.json` con le nuove impostazioni
2. **Incrementa il campo `version`** (ad esempio `1.0.0` → `1.1.0`)
3. **Ricomprimi** il manifest con le icone (`manifest.json`, `outline.png`, `color.png`)
4. Carica il nuovo zip:
   - **Opzione A (Teams Admin Center):** Teams Admin Center → Teams apps → Manage apps → trova la tua app → Upload new version
   - **Opzione B (Sideload):** In Teams → Apps → Manage your apps → Upload a custom app
5. **Per i canali team:** reinstalla l'app in ogni team affinché le nuove autorizzazioni abbiano effetto
6. **Chiudi completamente e riavvia Teams** (non solo chiudere la finestra) per cancellare i metadati dell'app memorizzati nella cache

## Capacità: solo RSC vs Graph

### Con **solo Teams RSC** (app installata, nessuna autorizzazione API Graph)

Funziona:

- Lettura del contenuto **testuale** dei messaggi di canale.
- Invio del contenuto **testuale** dei messaggi di canale.
- Ricezione di allegati file **personali (DM)**.

NON funziona:

- **Contenuto di immagini o file** in canali/gruppi (il payload include solo uno stub HTML).
- Download di allegati archiviati in SharePoint/OneDrive.
- Lettura della cronologia messaggi (oltre l'evento webhook in tempo reale).

### Con **Teams RSC + autorizzazioni applicazione Microsoft Graph**

Aggiunge:

- Download dei contenuti ospitati (immagini incollate nei messaggi).
- Download degli allegati file archiviati in SharePoint/OneDrive.
- Lettura della cronologia dei messaggi di canale/chat tramite Graph.

### RSC vs API Graph

| Capacità                | Autorizzazioni RSC   | API Graph                           |
| ----------------------- | -------------------- | ----------------------------------- |
| **Messaggi in tempo reale** | Sì (tramite webhook) | No (solo polling)                   |
| **Messaggi storici**    | No                   | Sì (può interrogare la cronologia)  |
| **Complessità di setup** | Solo manifest app    | Richiede consenso amministratore + flusso token |
| **Funziona offline**    | No (deve essere in esecuzione) | Sì (interrogabile in qualsiasi momento) |

**In sintesi:** RSC serve per l'ascolto in tempo reale; l'API Graph serve per l'accesso storico. Per recuperare i messaggi persi mentre si è offline, serve l'API Graph con `ChannelMessage.Read.All` (richiede consenso amministratore).

## Media + cronologia abilitati da Graph (richiesti per i canali)

Se hai bisogno di immagini/file nei **canali** o vuoi recuperare la **cronologia dei messaggi**, devi abilitare le autorizzazioni Microsoft Graph e concedere il consenso amministratore.

1. In Entra ID (Azure AD) **App Registration**, aggiungi autorizzazioni Microsoft Graph **Application**:
   - `ChannelMessage.Read.All` (allegati canale + cronologia)
   - `Chat.Read.All` o `ChatMessage.Read.All` (chat di gruppo)
2. **Concedi il consenso amministratore** per il tenant.
3. Incrementa la **versione del manifest** dell'app Teams, ricaricala e **reinstalla l'app in Teams**.
4. **Chiudi completamente e riavvia Teams** per cancellare i metadati dell'app memorizzati nella cache.

**Autorizzazione aggiuntiva per le menzioni utente:** le @mention utente funzionano subito per gli utenti nella conversazione. Tuttavia, se vuoi cercare dinamicamente e menzionare utenti che **non sono nella conversazione corrente**, aggiungi l'autorizzazione `User.Read.All` (Application) e concedi il consenso amministratore.

## Limitazioni note

### Timeout webhook

Teams consegna i messaggi tramite webhook HTTP. Se l'elaborazione richiede troppo tempo (ad esempio risposte LLM lente), potresti vedere:

- Timeout del gateway
- Teams che ritenta il messaggio (causando duplicati)
- Risposte perse

OpenClaw gestisce questo problema restituendo rapidamente e inviando le risposte in modo proattivo, ma risposte molto lente possono comunque causare problemi.

### Formattazione

Il markdown di Teams è più limitato di Slack o Discord:

- La formattazione di base funziona: **grassetto**, _corsivo_, `code`, link
- Il markdown complesso (tabelle, elenchi annidati) potrebbe non essere renderizzato correttamente
- Le Adaptive Cards sono supportate per sondaggi e invii arbitrari di card (vedi sotto)

## Configurazione

Impostazioni principali (vedi `/gateway/configuration` per i pattern canale condivisi):

- `channels.msteams.enabled`: abilita/disabilita il canale.
- `channels.msteams.appId`, `channels.msteams.appPassword`, `channels.msteams.tenantId`: credenziali del bot.
- `channels.msteams.webhook.port` (predefinito `3978`)
- `channels.msteams.webhook.path` (predefinito `/api/messages`)
- `channels.msteams.dmPolicy`: `pairing | allowlist | open | disabled` (predefinito: pairing)
- `channels.msteams.allowFrom`: allowlist DM (consigliati ID oggetto AAD). La procedura guidata risolve i nomi in ID durante la configurazione quando l'accesso Graph è disponibile.
- `channels.msteams.dangerouslyAllowNameMatching`: interruttore di emergenza per riabilitare la corrispondenza con UPN/nome visualizzato modificabili e il routing diretto per nome team/canale.
- `channels.msteams.textChunkLimit`: dimensione chunk testo in uscita.
- `channels.msteams.chunkMode`: `length` (predefinito) o `newline` per dividere sulle righe vuote (confini di paragrafo) prima del chunking per lunghezza.
- `channels.msteams.mediaAllowHosts`: allowlist per host di allegati in ingresso (predefinito: domini Microsoft/Teams).
- `channels.msteams.mediaAuthAllowHosts`: allowlist per allegare header Authorization ai retry dei media (predefinito: host Graph + Bot Framework).
- `channels.msteams.requireMention`: richiede @mention in canali/gruppi (predefinito true).
- `channels.msteams.replyStyle`: `thread | top-level` (vedi [Stile di risposta](#reply-style-threads-vs-posts)).
- `channels.msteams.teams.<teamId>.replyStyle`: override per team.
- `channels.msteams.teams.<teamId>.requireMention`: override per team.
- `channels.msteams.teams.<teamId>.tools`: override predefiniti dei criteri strumenti per team (`allow`/`deny`/`alsoAllow`) usati quando manca un override di canale.
- `channels.msteams.teams.<teamId>.toolsBySender`: override predefiniti dei criteri strumenti per team per mittente (`"*"` wildcard supportato).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`: override per canale.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.requireMention`: override per canale.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.tools`: override dei criteri strumenti per canale (`allow`/`deny`/`alsoAllow`).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.toolsBySender`: override dei criteri strumenti per canale per mittente (`"*"` wildcard supportato).
- Le chiavi `toolsBySender` dovrebbero usare prefissi espliciti:
  `id:`, `e164:`, `username:`, `name:` (le chiavi legacy senza prefisso continuano a essere mappate solo a `id:`).
- `channels.msteams.actions.memberInfo`: abilita o disabilita l'azione informazioni membro supportata da Graph (predefinito: abilitata quando sono disponibili credenziali Graph).
- `channels.msteams.sharePointSiteId`: ID sito SharePoint per caricamenti file in chat di gruppo/canali (vedi [Invio di file nelle chat di gruppo](#sending-files-in-group-chats)).

## Routing e sessioni

- Le chiavi di sessione seguono il formato agente standard (vedi [/concepts/session](/concepts/session)):
  - I messaggi diretti condividono la sessione principale (`agent:<agentId>:<mainKey>`).
  - I messaggi di canale/gruppo usano l'id conversazione:
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## Stile di risposta: thread vs post

Teams ha recentemente introdotto due stili UI per i canali sullo stesso modello dati sottostante:

| Stile                   | Descrizione                                              | `replyStyle` consigliato |
| ----------------------- | -------------------------------------------------------- | ------------------------ |
| **Posts** (classico)    | I messaggi appaiono come card con risposte in thread sotto | `thread` (predefinito)   |
| **Threads** (simile a Slack) | I messaggi scorrono linearmente, più come Slack        | `top-level`              |

**Il problema:** l'API Teams non espone quale stile UI usa un canale. Se usi il `replyStyle` sbagliato:

- `thread` in un canale in stile Threads → le risposte appaiono annidate in modo scomodo
- `top-level` in un canale in stile Posts → le risposte appaiono come post top-level separati invece che nel thread

**Soluzione:** configura `replyStyle` per canale in base a come è configurato il canale:

```json5
{
  channels: {
    msteams: {
      replyStyle: "thread",
      teams: {
        "19:abc...@thread.tacv2": {
          channels: {
            "19:xyz...@thread.tacv2": {
              replyStyle: "top-level",
            },
          },
        },
      },
    },
  },
}
```

## Allegati e immagini

**Limitazioni attuali:**

- **DM:** immagini e allegati file funzionano tramite le API file del bot Teams.
- **Canali/gruppi:** gli allegati vivono nello storage M365 (SharePoint/OneDrive). Il payload webhook include solo uno stub HTML, non i byte effettivi del file. **Sono richieste autorizzazioni API Graph** per scaricare gli allegati dei canali.
- Per invii espliciti file-first, usa `action=upload-file` con `media` / `filePath` / `path`; `message` opzionale diventa il testo/commento di accompagnamento, e `filename` sovrascrive il nome caricato.

Senza autorizzazioni Graph, i messaggi di canale con immagini verranno ricevuti solo come testo (il contenuto dell'immagine non è accessibile al bot).
Per impostazione predefinita, OpenClaw scarica media solo da host Microsoft/Teams. Sovrascrivi con `channels.msteams.mediaAllowHosts` (usa `["*"]` per consentire qualsiasi host).
Gli header Authorization vengono allegati solo per gli host in `channels.msteams.mediaAuthAllowHosts` (predefinito: host Graph + Bot Framework). Mantieni questo elenco rigoroso (evita suffissi multi-tenant).

## Invio di file nelle chat di gruppo

I bot possono inviare file nei DM usando il flusso FileConsentCard (integrato). Tuttavia, **l'invio di file nelle chat di gruppo/canali** richiede configurazione aggiuntiva:

| Contesto                 | Come vengono inviati i file               | Configurazione necessaria                        |
| ------------------------ | ----------------------------------------- | ------------------------------------------------ |
| **DM**                   | FileConsentCard → l'utente accetta → il bot carica | Funziona subito                                  |
| **Chat di gruppo/canali** | Caricamento su SharePoint → link di condivisione | Richiede `sharePointSiteId` + autorizzazioni Graph |
| **Immagini (qualsiasi contesto)** | Inline con codifica Base64                 | Funziona subito                                  |

### Perché i gruppi richiedono SharePoint

I bot non hanno un drive personale OneDrive (l'endpoint Graph API `/me/drive` non funziona per identità applicative). Per inviare file in chat di gruppo/canali, il bot carica su un **sito SharePoint** e crea un link di condivisione.

### Configurazione

1. **Aggiungi autorizzazioni API Graph** in Entra ID (Azure AD) → App Registration:
   - `Sites.ReadWrite.All` (Application) - carica file su SharePoint
   - `Chat.Read.All` (Application) - facoltativo, abilita link di condivisione per utente

2. **Concedi il consenso amministratore** per il tenant.

3. **Ottieni il tuo ID sito SharePoint:**

   ```bash
   # Tramite Graph Explorer o curl con un token valido:
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/{hostname}:/{site-path}"

   # Esempio: per un sito in "contoso.sharepoint.com/sites/BotFiles"
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com:/sites/BotFiles"

   # La risposta include: "id": "contoso.sharepoint.com,guid1,guid2"
   ```

4. **Configura OpenClaw:**

   ```json5
   {
     channels: {
       msteams: {
         // ... altra configurazione ...
         sharePointSiteId: "contoso.sharepoint.com,guid1,guid2",
       },
     },
   }
   ```

### Comportamento di condivisione

| Autorizzazione                           | Comportamento di condivisione                             |
| ---------------------------------------- | --------------------------------------------------------- |
| `Sites.ReadWrite.All` soltanto           | Link di condivisione a livello organizzazione (chiunque nell'org può accedere) |
| `Sites.ReadWrite.All` + `Chat.Read.All`  | Link di condivisione per utente (solo i membri della chat possono accedere) |

La condivisione per utente è più sicura perché solo i partecipanti alla chat possono accedere al file. Se manca l'autorizzazione `Chat.Read.All`, il bot usa come fallback la condivisione a livello organizzazione.

### Comportamento di fallback

| Scenario                                          | Risultato                                          |
| ------------------------------------------------- | -------------------------------------------------- |
| Chat di gruppo + file + `sharePointSiteId` configurato | Caricamento su SharePoint, invio link di condivisione |
| Chat di gruppo + file + nessun `sharePointSiteId` | Tentativo di caricamento su OneDrive (può fallire), invio solo testo |
| Chat personale + file                             | Flusso FileConsentCard (funziona senza SharePoint) |
| Qualsiasi contesto + immagine                     | Inline con codifica Base64 (funziona senza SharePoint) |

### Posizione dei file archiviati

I file caricati vengono archiviati in una cartella `/OpenClawShared/` nella raccolta documenti predefinita del sito SharePoint configurato.

## Sondaggi (Adaptive Cards)

OpenClaw invia i sondaggi Teams come Adaptive Cards (non esiste un'API nativa dei sondaggi Teams).

- CLI: `openclaw message poll --channel msteams --target conversation:<id> ...`
- I voti vengono registrati dal gateway in `~/.openclaw/msteams-polls.json`.
- Il gateway deve restare online per registrare i voti.
- I sondaggi non pubblicano ancora automaticamente riepiloghi dei risultati (se necessario, ispeziona il file dello store).

## Adaptive Cards (arbitrarie)

Invia qualsiasi JSON Adaptive Card a utenti o conversazioni Teams usando lo strumento `message` o la CLI.

Il parametro `card` accetta un oggetto JSON Adaptive Card. Quando `card` è fornito, il testo del messaggio è facoltativo.

**Strumento agente:**

```json5
{
  action: "send",
  channel: "msteams",
  target: "user:<id>",
  card: {
    type: "AdaptiveCard",
    version: "1.5",
    body: [{ type: "TextBlock", text: "Hello!" }],
  },
}
```

**CLI:**

```bash
openclaw message send --channel msteams \
  --target "conversation:19:abc...@thread.tacv2" \
  --card '{"type":"AdaptiveCard","version":"1.5","body":[{"type":"TextBlock","text":"Hello!"}]}'
```

Vedi [la documentazione Adaptive Cards](https://adaptivecards.io/) per schema ed esempi delle card. Per i dettagli sul formato target, vedi [Formati target](#target-formats) sotto.

## Formati target

I target MSTeams usano prefissi per distinguere utenti e conversazioni:

| Tipo di target        | Formato                         | Esempio                                             |
| --------------------- | ------------------------------- | --------------------------------------------------- |
| Utente (per ID)       | `user:<aad-object-id>`          | `user:40a1a0ed-4ff2-4164-a219-55518990c197`         |
| Utente (per nome)     | `user:<display-name>`           | `user:John Smith` (richiede API Graph)              |
| Gruppo/canale         | `conversation:<conversation-id>` | `conversation:19:abc123...@thread.tacv2`            |
| Gruppo/canale (raw)   | `<conversation-id>`             | `19:abc123...@thread.tacv2` (se contiene `@thread`) |

**Esempi CLI:**

```bash
# Invia a un utente per ID
openclaw message send --channel msteams --target "user:40a1a0ed-..." --message "Hello"

# Invia a un utente per nome visualizzato (attiva una ricerca API Graph)
openclaw message send --channel msteams --target "user:John Smith" --message "Hello"

# Invia a una chat di gruppo o a un canale
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" --message "Hello"

# Invia un'Adaptive Card a una conversazione
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" \
  --card '{"type":"AdaptiveCard","version":"1.5","body":[{"type":"TextBlock","text":"Hello"}]}'
```

**Esempi strumento agente:**

```json5
{
  action: "send",
  channel: "msteams",
  target: "user:John Smith",
  message: "Hello!",
}
```

```json5
{
  action: "send",
  channel: "msteams",
  target: "conversation:19:abc...@thread.tacv2",
  card: {
    type: "AdaptiveCard",
    version: "1.5",
    body: [{ type: "TextBlock", text: "Hello" }],
  },
}
```

Nota: senza il prefisso `user:`, i nomi sono interpretati per impostazione predefinita come risoluzione gruppo/team. Usa sempre `user:` quando indirizzi persone per nome visualizzato.

## Messaggistica proattiva

- I messaggi proattivi sono possibili **solo dopo** che un utente ha interagito, perché a quel punto memorizziamo i riferimenti alla conversazione.
- Vedi `/gateway/configuration` per `dmPolicy` e il controllo tramite allowlist.

## ID team e canale (problema comune)

Il parametro di query `groupId` negli URL Teams **NON** è l'ID team usato per la configurazione. Estrai invece gli ID dal percorso URL:

**URL team:**

```
https://teams.microsoft.com/l/team/19%3ABk4j...%40thread.tacv2/conversations?groupId=...
                                    └────────────────────────────┘
                                    ID team (decodifica questo URL)
```

**URL canale:**

```
https://teams.microsoft.com/l/channel/19%3A15bc...%40thread.tacv2/ChannelName?groupId=...
                                      └─────────────────────────┘
                                      ID canale (decodifica questo URL)
```

**Per la configurazione:**

- ID team = segmento del percorso dopo `/team/` (decodificato URL, ad esempio `19:Bk4j...@thread.tacv2`)
- ID canale = segmento del percorso dopo `/channel/` (decodificato URL)
- **Ignora** il parametro di query `groupId`

## Canali privati

I bot hanno supporto limitato nei canali privati:

| Funzionalità                 | Canali standard    | Canali privati         |
| ---------------------------- | ------------------ | ---------------------- |
| Installazione bot            | Sì                 | Limitata               |
| Messaggi in tempo reale (webhook) | Sì            | Potrebbe non funzionare |
| Autorizzazioni RSC           | Sì                 | Potrebbero comportarsi diversamente |
| @mentions                    | Sì                 | Se il bot è accessibile |
| Cronologia API Graph         | Sì                 | Sì (con autorizzazioni) |

**Soluzioni alternative se i canali privati non funzionano:**

1. Usa canali standard per le interazioni col bot
2. Usa i DM - gli utenti possono sempre inviare messaggi direttamente al bot
3. Usa l'API Graph per l'accesso storico (richiede `ChannelMessage.Read.All`)

## Risoluzione dei problemi

### Problemi comuni

- **Le immagini non vengono mostrate nei canali:** mancano autorizzazioni Graph o consenso amministratore. Reinstalla l'app Teams e chiudi/riapri completamente Teams.
- **Nessuna risposta nel canale:** le menzioni sono richieste per impostazione predefinita; imposta `channels.msteams.requireMention=false` oppure configura per team/canale.
- **Version mismatch (Teams mostra ancora il vecchio manifest):** rimuovi e aggiungi di nuovo l'app, quindi chiudi completamente Teams per aggiornare.
- **401 Unauthorized dal webhook:** previsto quando si testa manualmente senza JWT Azure - significa che l'endpoint è raggiungibile ma l'autenticazione è fallita. Usa Azure Web Chat per testare correttamente.

### Errori di caricamento del manifest

- **"Icon file cannot be empty":** il manifest fa riferimento a file icona da 0 byte. Crea icone PNG valide (32x32 per `outline.png`, 192x192 per `color.png`).
- **"webApplicationInfo.Id already in use":** l'app è ancora installata in un altro team/chat. Trovala e disinstallala prima, oppure attendi 5-10 minuti per la propagazione.
- **"Something went wrong" durante il caricamento:** carica invece tramite [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com), apri DevTools del browser (F12) → scheda Network, e controlla il corpo della risposta per l'errore effettivo.
- **Sideload non riuscito:** prova "Upload an app to your org's app catalog" invece di "Upload a custom app" - spesso aggira le restrizioni sul sideload.

### Le autorizzazioni RSC non funzionano

1. Verifica che `webApplicationInfo.id` corrisponda esattamente all'App ID del tuo bot
2. Ricarica l'app e reinstallala nel team/chat
3. Controlla se l'amministratore dell'organizzazione ha bloccato le autorizzazioni RSC
4. Conferma di usare l'ambito corretto: `ChannelMessage.Read.Group` per i team, `ChatMessage.Read.Chat` per le chat di gruppo

## Riferimenti

- [Create Azure Bot](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) - guida alla configurazione Azure Bot
- [Teams Developer Portal](https://dev.teams.microsoft.com/apps) - crea/gestisci app Teams
- [Teams app manifest schema](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [Receive channel messages with RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [RSC permissions reference](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [Teams bot file handling](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4) (canale/gruppo richiede Graph)
- [Proactive messaging](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)

## Correlati

- [Panoramica canali](/it/channels) — tutti i canali supportati
- [Pairing](/it/channels/pairing) — autenticazione DM e flusso di pairing
- [Gruppi](/it/channels/groups) — comportamento della chat di gruppo e gate basato su menzione
- [Routing del canale](/it/channels/channel-routing) — routing della sessione per i messaggi
- [Sicurezza](/gateway/security) — modello di accesso e hardening
