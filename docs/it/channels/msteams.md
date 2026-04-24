---
read_when:
    - Lavorare sulle funzionalità del canale Microsoft Teams
summary: Stato del supporto del bot Microsoft Teams, funzionalità e configurazione
title: Microsoft Teams
x-i18n:
    generated_at: "2026-04-24T08:30:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: ba01e831382d31a3787b94d1c882d911c91c0f43d2aff84fd4ac5041423a08ac
    source_path: channels/msteams.md
    workflow: 15
---

Gli allegati di testo e dei messaggi diretti sono supportati; l'invio di file in canali e gruppi richiede `sharePointSiteId` + autorizzazioni Graph (vedi [Invio di file nelle chat di gruppo](#sending-files-in-group-chats)). I sondaggi vengono inviati tramite Adaptive Cards. Le azioni sui messaggi espongono `upload-file` esplicito per invii incentrati sui file.

## Plugin integrato

Microsoft Teams è incluso come Plugin integrato nelle attuali release di OpenClaw, quindi nella normale build pacchettizzata non è richiesta alcuna installazione separata.

Se usi una build meno recente o un'installazione personalizzata che esclude Teams integrato, installalo manualmente:

```bash
openclaw plugins install @openclaw/msteams
```

Checkout locale (quando esegui da un repository git):

```bash
openclaw plugins install ./path/to/local/msteams-plugin
```

Dettagli: [Plugins](/it/tools/plugin)

## Configurazione rapida (principianti)

1. Assicurati che il Plugin Microsoft Teams sia disponibile.
   - Le attuali release pacchettizzate di OpenClaw lo includono già.
   - Le installazioni meno recenti/personalizzate possono aggiungerlo manualmente con i comandi sopra.
2. Crea un **Azure Bot** (App ID + client secret + tenant ID).
3. Configura OpenClaw con queste credenziali.
4. Espone `/api/messages` (porta 3978 per impostazione predefinita) tramite un URL pubblico o un tunnel.
5. Installa il pacchetto dell'app Teams e avvia il gateway.

Configurazione minima (client secret):

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

Per le distribuzioni in produzione, valuta l'uso di [autenticazione federata](#federated-authentication) (certificato o identità gestita) invece dei client secret.

Nota: le chat di gruppo sono bloccate per impostazione predefinita (`channels.msteams.groupPolicy: "allowlist"`). Per consentire le risposte nei gruppi, imposta `channels.msteams.groupAllowFrom` (oppure usa `groupPolicy: "open"` per consentire qualsiasi membro, con gating delle menzioni).

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

- Predefinito: `channels.msteams.dmPolicy = "pairing"`. I mittenti sconosciuti vengono ignorati fino all'approvazione.
- `channels.msteams.allowFrom` dovrebbe usare ID oggetto AAD stabili.
- Non fare affidamento sulla corrispondenza UPN/display-name per le allowlist: possono cambiare. OpenClaw disabilita per impostazione predefinita la corrispondenza diretta per nome; attivala esplicitamente con `channels.msteams.dangerouslyAllowNameMatching: true`.
- La procedura guidata può risolvere i nomi in ID tramite Microsoft Graph quando le credenziali lo consentono.

**Accesso gruppo**

- Predefinito: `channels.msteams.groupPolicy = "allowlist"` (bloccato finché non aggiungi `groupAllowFrom`). Usa `channels.defaults.groupPolicy` per sovrascrivere il valore predefinito quando non è impostato.
- `channels.msteams.groupAllowFrom` controlla quali mittenti possono attivare il bot nelle chat di gruppo/canali (con fallback a `channels.msteams.allowFrom`).
- Imposta `groupPolicy: "open"` per consentire qualsiasi membro (ancora con gating delle menzioni per impostazione predefinita).
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

**Teams + allowlist dei canali**

- Limita le risposte in gruppo/canale elencando team e canali in `channels.msteams.teams`.
- Le chiavi dovrebbero usare ID stabili del team e ID di conversazione del canale.
- Quando `groupPolicy="allowlist"` ed è presente una allowlist dei team, vengono accettati solo i team/canali elencati (con gating delle menzioni).
- La procedura guidata di configurazione accetta voci `Team/Channel` e le memorizza per te.
- All'avvio, OpenClaw risolve i nomi di team/canale e degli utenti nelle allowlist in ID (quando le autorizzazioni Graph lo consentono)
  e registra la mappatura; i nomi di team/canale non risolti vengono mantenuti come digitati ma ignorati per l'instradamento per impostazione predefinita, a meno che non sia abilitato `channels.msteams.dangerouslyAllowNameMatching: true`.

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

## Configurazione di Azure Bot

Prima di configurare OpenClaw, crea una risorsa Azure Bot e acquisiscine le credenziali.

<Steps>
  <Step title="Crea Azure Bot">
    Vai a [Create Azure Bot](https://portal.azure.com/#create/Microsoft.AzureBot) e compila la scheda **Basics**:

    | Campo              | Valore                                                   |
    | ------------------ | -------------------------------------------------------- |
    | **Bot handle**     | Nome del tuo bot, ad esempio `openclaw-msteams` (deve essere univoco) |
    | **Subscription**   | La tua sottoscrizione Azure                              |
    | **Resource group** | Creane uno nuovo oppure usa uno esistente                |
    | **Pricing tier**   | **Free** per sviluppo/test                               |
    | **Type of App**    | **Single Tenant** (consigliato)                          |
    | **Creation type**  | **Create new Microsoft App ID**                          |

    <Note>
    I nuovi bot multi-tenant sono stati deprecati dopo il 2025-07-31. Usa **Single Tenant** per i nuovi bot.
    </Note>

    Fai clic su **Review + create** → **Create** (attendi ~1-2 minuti).

  </Step>

  <Step title="Acquisisci le credenziali">
    Dalla risorsa Azure Bot → **Configuration**:

    - copia **Microsoft App ID** → `appId`
    - **Manage Password** → **Certificates & secrets** → **New client secret** → copia il valore → `appPassword`
    - **Overview** → **Directory (tenant) ID** → `tenantId`

  </Step>

  <Step title="Configura l'endpoint di messaggistica">
    Azure Bot → **Configuration** → imposta **Messaging endpoint**:

    - Produzione: `https://your-domain.com/api/messages`
    - Sviluppo locale: usa un tunnel (vedi [Sviluppo locale](#local-development-tunneling))

  </Step>

  <Step title="Abilita il canale Teams">
    Azure Bot → **Channels** → fai clic su **Microsoft Teams** → Configure → Save. Accetta i Termini di servizio.
  </Step>
</Steps>

## Autenticazione federata

> Aggiunta in 2026.3.24

Per le distribuzioni in produzione, OpenClaw supporta l'**autenticazione federata** come alternativa più sicura ai client secret. Sono disponibili due metodi:

### Opzione A: autenticazione basata su certificato

Usa un certificato PEM registrato con la tua registrazione dell'app Entra ID.

**Configurazione:**

1. Genera o ottieni un certificato (formato PEM con chiave privata).
2. In Entra ID → App Registration → **Certificates & secrets** → **Certificates** → carica il certificato pubblico.

**Config:**

```json5
{
  channels: {
    msteams: {
      enabled: true,
      appId: "<APP_ID>",
      tenantId: "<TENANT_ID>",
      authType: "federated",
      certificatePath: "/path/to/cert.pem",
      webhook: { port: 3978, path: "/api/messages" },
    },
  },
}
```

**Variabili d'ambiente:**

- `MSTEAMS_AUTH_TYPE=federated`
- `MSTEAMS_CERTIFICATE_PATH=/path/to/cert.pem`

### Opzione B: Azure Managed Identity

Usa Azure Managed Identity per un'autenticazione senza password. È l'ideale per distribuzioni su infrastruttura Azure (AKS, App Service, VM Azure) dove è disponibile un'identità gestita.

**Come funziona:**

1. Il pod/la VM del bot ha un'identità gestita (assegnata dal sistema o dall'utente).
2. Una **federated identity credential** collega l'identità gestita alla registrazione dell'app Entra ID.
3. A runtime, OpenClaw usa `@azure/identity` per acquisire token dall'endpoint Azure IMDS (`169.254.169.254`).
4. Il token viene passato all'SDK Teams per l'autenticazione del bot.

**Prerequisiti:**

- Infrastruttura Azure con identità gestita abilitata (AKS workload identity, App Service, VM)
- Federated identity credential creata sulla registrazione dell'app Entra ID
- Accesso di rete a IMDS (`169.254.169.254:80`) dal pod/dalla VM

**Config (identità gestita assegnata dal sistema):**

```json5
{
  channels: {
    msteams: {
      enabled: true,
      appId: "<APP_ID>",
      tenantId: "<TENANT_ID>",
      authType: "federated",
      useManagedIdentity: true,
      webhook: { port: 3978, path: "/api/messages" },
    },
  },
}
```

**Config (identità gestita assegnata dall'utente):**

```json5
{
  channels: {
    msteams: {
      enabled: true,
      appId: "<APP_ID>",
      tenantId: "<TENANT_ID>",
      authType: "federated",
      useManagedIdentity: true,
      managedIdentityClientId: "<MI_CLIENT_ID>",
      webhook: { port: 3978, path: "/api/messages" },
    },
  },
}
```

**Variabili d'ambiente:**

- `MSTEAMS_AUTH_TYPE=federated`
- `MSTEAMS_USE_MANAGED_IDENTITY=true`
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID=<client-id>` (solo per identità assegnata dall'utente)

### Configurazione workload identity AKS

Per distribuzioni AKS che usano workload identity:

1. **Abilita workload identity** sul tuo cluster AKS.
2. **Crea una federated identity credential** sulla registrazione dell'app Entra ID:

   ```bash
   az ad app federated-credential create --id <APP_OBJECT_ID> --parameters '{
     "name": "my-bot-workload-identity",
     "issuer": "<AKS_OIDC_ISSUER_URL>",
     "subject": "system:serviceaccount:<NAMESPACE>:<SERVICE_ACCOUNT>",
     "audiences": ["api://AzureADTokenExchange"]
   }'
   ```

3. **Annota il service account Kubernetes** con il client ID dell'app:

   ```yaml
   apiVersion: v1
   kind: ServiceAccount
   metadata:
     name: my-bot-sa
     annotations:
       azure.workload.identity/client-id: "<APP_CLIENT_ID>"
   ```

4. **Etichetta il pod** per l'iniezione di workload identity:

   ```yaml
   metadata:
     labels:
       azure.workload.identity/use: "true"
   ```

5. **Assicurati l'accesso di rete** a IMDS (`169.254.169.254`) — se usi NetworkPolicy, aggiungi una regola egress che consenta traffico verso `169.254.169.254/32` sulla porta 80.

### Confronto tra i tipi di autenticazione

| Metodo               | Config                                         | Pro                               | Contro                                |
| -------------------- | ---------------------------------------------- | --------------------------------- | ------------------------------------- |
| **Client secret**    | `appPassword`                                  | Configurazione semplice           | Richiede rotazione dei secret, meno sicuro |
| **Certificate**      | `authType: "federated"` + `certificatePath`    | Nessun secret condiviso in rete   | Overhead di gestione dei certificati  |
| **Managed Identity** | `authType: "federated"` + `useManagedIdentity` | Senza password, nessun secret da gestire | Richiede infrastruttura Azure         |

**Comportamento predefinito:** quando `authType` non è impostato, OpenClaw usa per impostazione predefinita l'autenticazione con client secret. Le configurazioni esistenti continuano a funzionare senza modifiche.

## Sviluppo locale (tunneling)

Teams non può raggiungere `localhost`. Usa un tunnel per lo sviluppo locale:

**Opzione A: ngrok**

```bash
ngrok http 3978
# Copy the https URL, e.g., https://abc123.ngrok.io
# Set messaging endpoint to: https://abc123.ngrok.io/api/messages
```

**Opzione B: Tailscale Funnel**

```bash
tailscale funnel 3978
# Use your Tailscale funnel URL as the messaging endpoint
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

Spesso questo è più semplice che modificare manualmente i manifest JSON.

## Test del bot

**Opzione A: Azure Web Chat (prima verifica il webhook)**

1. In Azure Portal → la tua risorsa Azure Bot → **Test in Web Chat**
2. Invia un messaggio: dovresti vedere una risposta
3. Questo conferma che il tuo endpoint webhook funziona prima della configurazione di Teams

**Opzione B: Teams (dopo l'installazione dell'app)**

1. Installa l'app Teams (sideload o catalogo dell'organizzazione)
2. Trova il bot in Teams e invia un DM
3. Controlla i log del gateway per l'attività in ingresso

<Accordion title="Override tramite variabili d'ambiente">

Qualsiasi chiave di configurazione del bot/autenticazione può essere impostata anche tramite variabili d'ambiente:

- `MSTEAMS_APP_ID`, `MSTEAMS_APP_PASSWORD`, `MSTEAMS_TENANT_ID`
- `MSTEAMS_AUTH_TYPE` (`"secret"` o `"federated"`)
- `MSTEAMS_CERTIFICATE_PATH`, `MSTEAMS_CERTIFICATE_THUMBPRINT` (federata + certificato)
- `MSTEAMS_USE_MANAGED_IDENTITY`, `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID` (federata + identità gestita; client ID solo per identità assegnata dall'utente)

</Accordion>

## Azione informazioni membro

OpenClaw espone un'azione `member-info` supportata da Graph per Microsoft Teams, così agenti e automazioni possono risolvere direttamente da Microsoft Graph i dettagli dei membri del canale (nome visualizzato, email, ruolo).

Requisiti:

- Autorizzazione RSC `Member.Read.Group` (già inclusa nel manifest consigliato)
- Per ricerche tra team diversi: autorizzazione Application di Graph `User.Read.All` con consenso amministratore

L'azione è controllata da `channels.msteams.actions.memberInfo` (predefinita: abilitata quando sono disponibili credenziali Graph).

## Contesto della cronologia

- `channels.msteams.historyLimit` controlla quanti messaggi recenti di canale/gruppo vengono inclusi nel prompt.
- Usa come fallback `messages.groupChat.historyLimit`. Imposta `0` per disabilitare (predefinito 50).
- La cronologia del thread recuperata viene filtrata dalle allowlist dei mittenti (`allowFrom` / `groupAllowFrom`), quindi il seeding del contesto del thread include solo messaggi da mittenti consentiti.
- Il contesto degli allegati citati (`ReplyTo*` derivato dall'HTML di risposta di Teams) attualmente viene passato così come ricevuto.
- In altre parole, le allowlist controllano chi può attivare l'agente; oggi vengono filtrati solo percorsi di contesto supplementari specifici.
- La cronologia dei DM può essere limitata con `channels.msteams.dmHistoryLimit` (turni dell'utente). Override per utente: `channels.msteams.dms["<user_id>"].historyLimit`.

## Attuali autorizzazioni RSC di Teams

Queste sono le **resourceSpecific permissions** esistenti nel nostro manifest dell'app Teams. Si applicano solo all'interno del team/chat in cui l'app è installata.

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

## Esempio di manifest Teams

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

### Avvertenze sul manifest (campi obbligatori)

- `bots[].botId` **deve** corrispondere all'Azure Bot App ID.
- `webApplicationInfo.id` **deve** corrispondere all'Azure Bot App ID.
- `bots[].scopes` deve includere le superfici che intendi usare (`personal`, `team`, `groupChat`).
- `bots[].supportsFiles: true` è obbligatorio per la gestione dei file nell'ambito personale.
- `authorization.permissions.resourceSpecific` deve includere lettura/invio del canale se vuoi traffico di canale.

### Aggiornamento di un'app esistente

Per aggiornare un'app Teams già installata (ad esempio, per aggiungere autorizzazioni RSC):

1. Aggiorna il tuo `manifest.json` con le nuove impostazioni
2. **Incrementa il campo `version`** (ad esempio `1.0.0` → `1.1.0`)
3. **Ricrea lo zip** del manifest con le icone (`manifest.json`, `outline.png`, `color.png`)
4. Carica il nuovo zip:
   - **Opzione A (Teams Admin Center):** Teams Admin Center → Teams apps → Manage apps → trova la tua app → Upload new version
   - **Opzione B (Sideload):** In Teams → Apps → Manage your apps → Upload a custom app
5. **Per i canali del team:** reinstalla l'app in ogni team affinché le nuove autorizzazioni abbiano effetto
6. **Chiudi completamente e riavvia Teams** (non solo chiudere la finestra) per cancellare i metadati dell'app in cache

## Funzionalità: solo RSC vs Graph

### Solo Teams RSC (senza autorizzazioni Graph API)

Funziona:

- Lettura del contenuto **testuale** dei messaggi del canale.
- Invio del contenuto **testuale** dei messaggi del canale.
- Ricezione di allegati di file nei **messaggi personali (DM)**.

NON funziona:

- Contenuti di **immagini o file** di canale/gruppo (il payload include solo uno stub HTML).
- Download di allegati archiviati in SharePoint/OneDrive.
- Lettura della cronologia dei messaggi (oltre l'evento Webhook live).

### Teams RSC più autorizzazioni Application di Microsoft Graph

Aggiunge:

- Download di contenuti ospitati (immagini incollate nei messaggi).
- Download di allegati di file archiviati in SharePoint/OneDrive.
- Lettura della cronologia dei messaggi di canale/chat tramite Graph.

### RSC vs Graph API

| Funzionalità            | Autorizzazioni RSC   | Graph API                           |
| ----------------------- | -------------------- | ----------------------------------- |
| **Messaggi in tempo reale** | Sì (tramite Webhook) | No (solo polling)                |
| **Messaggi storici**    | No                   | Sì (può interrogare la cronologia)  |
| **Complessità di configurazione** | Solo manifest dell'app | Richiede consenso amministratore + flusso token |
| **Funziona offline**    | No (deve essere in esecuzione) | Sì (interroga in qualsiasi momento) |

**In sintesi:** RSC serve per l'ascolto in tempo reale; Graph API serve per l'accesso storico. Per recuperare i messaggi persi mentre eri offline, hai bisogno di Graph API con `ChannelMessage.Read.All` (richiede consenso amministratore).

## Media + cronologia abilitati con Graph (obbligatori per i canali)

Se ti servono immagini/file nei **canali** o vuoi recuperare la **cronologia dei messaggi**, devi abilitare le autorizzazioni Microsoft Graph e concedere il consenso amministratore.

1. In Entra ID (Azure AD) **App Registration**, aggiungi autorizzazioni **Application** di Microsoft Graph:
   - `ChannelMessage.Read.All` (allegati del canale + cronologia)
   - `Chat.Read.All` o `ChatMessage.Read.All` (chat di gruppo)
2. **Concedi il consenso amministratore** per il tenant.
3. Incrementa la **versione del manifest** dell'app Teams, ricaricalo e **reinstalla l'app in Teams**.
4. **Chiudi completamente e riavvia Teams** per cancellare i metadati dell'app in cache.

**Autorizzazione aggiuntiva per le menzioni utente:** le @mention degli utenti funzionano immediatamente per gli utenti nella conversazione. Tuttavia, se vuoi cercare dinamicamente e menzionare utenti che **non sono nella conversazione corrente**, aggiungi l'autorizzazione Application `User.Read.All` e concedi il consenso amministratore.

## Limitazioni note

### Timeout del Webhook

Teams consegna i messaggi tramite HTTP Webhook. Se l'elaborazione richiede troppo tempo (ad esempio, risposte LLM lente), potresti vedere:

- timeout del gateway
- nuovi tentativi di Teams sul messaggio (che causano duplicati)
- risposte perse

OpenClaw gestisce questo caso rispondendo rapidamente e inviando risposte in modo proattivo, ma risposte molto lente possono comunque causare problemi.

### Formattazione

Il markdown di Teams è più limitato rispetto a Slack o Discord:

- La formattazione di base funziona: **grassetto**, _corsivo_, `code`, link
- Il markdown complesso (tabelle, elenchi nidificati) potrebbe non essere renderizzato correttamente
- Le Adaptive Cards sono supportate per sondaggi e invii di presentazione semantica (vedi sotto)

## Configurazione

Impostazioni raggruppate (vedi `/gateway/configuration` per i pattern condivisi dei canali).

<AccordionGroup>
  <Accordion title="Core e Webhook">
    - `channels.msteams.enabled`
    - `channels.msteams.appId`, `appPassword`, `tenantId`: credenziali del bot
    - `channels.msteams.webhook.port` (predefinito `3978`)
    - `channels.msteams.webhook.path` (predefinito `/api/messages`)
  </Accordion>

  <Accordion title="Autenticazione">
    - `authType`: `"secret"` (predefinito) oppure `"federated"`
    - `certificatePath`, `certificateThumbprint`: autenticazione federata + certificato (thumbprint facoltativo)
    - `useManagedIdentity`, `managedIdentityClientId`: autenticazione federata + identità gestita
  </Accordion>

  <Accordion title="Controllo degli accessi">
    - `dmPolicy`: `pairing | allowlist | open | disabled` (predefinito: pairing)
    - `allowFrom`: allowlist DM, preferisci ID oggetto AAD; la procedura guidata risolve i nomi quando è disponibile l'accesso Graph
    - `dangerouslyAllowNameMatching`: opzione di emergenza per UPN/display-name mutabili e instradamento per nome di team/canale
    - `requireMention`: richiede @mention in canali/gruppi (predefinito `true`)
  </Accordion>

  <Accordion title="Override di team e canale">
    Tutti questi sovrascrivono i valori predefiniti di livello superiore:

    - `teams.<teamId>.replyStyle`, `.requireMention`
    - `teams.<teamId>.tools`, `.toolsBySender`: policy degli strumenti predefinite per team
    - `teams.<teamId>.channels.<conversationId>.replyStyle`, `.requireMention`
    - `teams.<teamId>.channels.<conversationId>.tools`, `.toolsBySender`

    Le chiavi `toolsBySender` accettano prefissi `id:`, `e164:`, `username:`, `name:` (le chiavi senza prefisso corrispondono a `id:`). `"*"` è un carattere jolly.

  </Accordion>

  <Accordion title="Consegna, media e azioni">
    - `textChunkLimit`: dimensione dei blocchi di testo in uscita
    - `chunkMode`: `length` (predefinito) oppure `newline` (divide sui confini dei paragrafi prima della lunghezza)
    - `mediaAllowHosts`: allowlist degli host per allegati in ingresso (predefinita ai domini Microsoft/Teams)
    - `mediaAuthAllowHosts`: host che possono ricevere header Authorization nei nuovi tentativi (predefiniti a Graph + Bot Framework)
    - `replyStyle`: `thread | top-level` (vedi [Stile di risposta](#reply-style-threads-vs-posts))
    - `actions.memberInfo`: attiva/disattiva l'azione informazioni membro supportata da Graph (attiva per impostazione predefinita quando Graph è disponibile)
    - `sharePointSiteId`: obbligatorio per i caricamenti di file in chat di gruppo/canali (vedi [Invio di file nelle chat di gruppo](#sending-files-in-group-chats))
  </Accordion>
</AccordionGroup>

## Instradamento e sessioni

- Le chiavi di sessione seguono il formato standard dell'agente (vedi [/concepts/session](/it/concepts/session)):
  - I messaggi diretti condividono la sessione principale (`agent:<agentId>:<mainKey>`).
  - I messaggi di canale/gruppo usano l'id della conversazione:
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## Stile di risposta: thread vs post

Di recente Teams ha introdotto due stili UI per i canali sullo stesso modello di dati sottostante:

| Stile                    | Descrizione                                               | `replyStyle` consigliato |
| ------------------------ | --------------------------------------------------------- | ------------------------ |
| **Posts** (classico)     | I messaggi appaiono come schede con risposte in thread sotto | `thread` (predefinito) |
| **Threads** (simile a Slack) | I messaggi scorrono linearmente, più simili a Slack   | `top-level`              |

**Il problema:** l'API Teams non espone quale stile UI usa un canale. Se usi il `replyStyle` sbagliato:

- `thread` in un canale in stile Threads → le risposte appaiono annidate in modo scomodo
- `top-level` in un canale in stile Posts → le risposte appaiono come post separati di primo livello invece che nel thread

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

- **DM:** immagini e allegati di file funzionano tramite le API file del bot Teams.
- **Canali/gruppi:** gli allegati risiedono nello storage M365 (SharePoint/OneDrive). Il payload Webhook include solo uno stub HTML, non i byte effettivi del file. **Le autorizzazioni Graph API sono obbligatorie** per scaricare gli allegati del canale.
- Per invii espliciti incentrati sui file, usa `action=upload-file` con `media` / `filePath` / `path`; `message` facoltativo diventa il testo/commento di accompagnamento, e `filename` sovrascrive il nome caricato.

Senza autorizzazioni Graph, i messaggi di canale con immagini verranno ricevuti come solo testo (il contenuto dell'immagine non è accessibile al bot).
Per impostazione predefinita, OpenClaw scarica media solo da nomi host Microsoft/Teams. Sovrascrivi con `channels.msteams.mediaAllowHosts` (usa `["*"]` per consentire qualsiasi host).
Gli header Authorization vengono allegati solo per gli host in `channels.msteams.mediaAuthAllowHosts` (predefiniti agli host Graph + Bot Framework). Mantieni questo elenco rigoroso (evita suffissi multi-tenant).

## Invio di file nelle chat di gruppo

I bot possono inviare file nei DM usando il flusso FileConsentCard (integrato). Tuttavia, **l'invio di file nelle chat di gruppo/canali** richiede configurazione aggiuntiva:

| Contesto                 | Come vengono inviati i file                 | Configurazione necessaria                         |
| ------------------------ | ------------------------------------------- | ------------------------------------------------- |
| **DM**                   | FileConsentCard → utente accetta → bot carica | Funziona immediatamente                         |
| **Chat di gruppo/canali** | Caricamento su SharePoint → link di condivisione | Richiede `sharePointSiteId` + autorizzazioni Graph |
| **Immagini (qualsiasi contesto)** | Inline con codifica Base64            | Funziona immediatamente                           |

### Perché le chat di gruppo richiedono SharePoint

I bot non hanno un drive OneDrive personale (l'endpoint Graph API `/me/drive` non funziona per le identità applicative). Per inviare file nelle chat di gruppo/canali, il bot carica su un **sito SharePoint** e crea un link di condivisione.

### Configurazione

1. **Aggiungi autorizzazioni Graph API** in Entra ID (Azure AD) → App Registration:
   - `Sites.ReadWrite.All` (Application) - carica file su SharePoint
   - `Chat.Read.All` (Application) - facoltativo, abilita link di condivisione per utente

2. **Concedi il consenso amministratore** per il tenant.

3. **Ottieni l'ID del tuo sito SharePoint:**

   ```bash
   # Via Graph Explorer o curl con un token valido:
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
         // ... other config ...
         sharePointSiteId: "contoso.sharepoint.com,guid1,guid2",
       },
     },
   }
   ```

### Comportamento di condivisione

| Autorizzazione                            | Comportamento di condivisione                             |
| ----------------------------------------- | --------------------------------------------------------- |
| `Sites.ReadWrite.All` solo                | Link di condivisione a livello di organizzazione (chiunque nell'organizzazione può accedere) |
| `Sites.ReadWrite.All` + `Chat.Read.All`   | Link di condivisione per utente (solo i membri della chat possono accedere) |

La condivisione per utente è più sicura perché solo i partecipanti alla chat possono accedere al file. Se manca l'autorizzazione `Chat.Read.All`, il bot usa come fallback la condivisione a livello di organizzazione.

### Comportamento di fallback

| Scenario                                          | Risultato                                          |
| ------------------------------------------------- | -------------------------------------------------- |
| Chat di gruppo + file + `sharePointSiteId` configurato | Carica su SharePoint, invia link di condivisione |
| Chat di gruppo + file + nessun `sharePointSiteId` | Tenta caricamento su OneDrive (può fallire), invia solo testo |
| Chat personale + file                             | Flusso FileConsentCard (funziona senza SharePoint) |
| Qualsiasi contesto + immagine                     | Inline con codifica Base64 (funziona senza SharePoint) |

### Posizione di archiviazione dei file

I file caricati vengono archiviati in una cartella `/OpenClawShared/` nella libreria documenti predefinita del sito SharePoint configurato.

## Sondaggi (Adaptive Cards)

OpenClaw invia sondaggi Teams come Adaptive Cards (non esiste una API nativa per i sondaggi Teams).

- CLI: `openclaw message poll --channel msteams --target conversation:<id> ...`
- I voti vengono registrati dal gateway in `~/.openclaw/msteams-polls.json`.
- Il gateway deve rimanere online per registrare i voti.
- I sondaggi non pubblicano ancora automaticamente riepiloghi dei risultati (se necessario, ispeziona il file di archivio).

## Schede di presentazione

Invia payload di presentazione semantica a utenti o conversazioni Teams usando lo strumento `message` o la CLI. OpenClaw li renderizza come Adaptive Cards di Teams a partire dal contratto di presentazione generico.

Il parametro `presentation` accetta blocchi semantici. Quando viene fornito `presentation`, il testo del messaggio è facoltativo.

**Strumento agente:**

```json5
{
  action: "send",
  channel: "msteams",
  target: "user:<id>",
  presentation: {
    title: "Hello",
    blocks: [{ type: "text", text: "Hello!" }],
  },
}
```

**CLI:**

```bash
openclaw message send --channel msteams \
  --target "conversation:19:abc...@thread.tacv2" \
  --presentation '{"title":"Hello","blocks":[{"type":"text","text":"Hello!"}]}'
```

Per i dettagli sul formato della destinazione, vedi [Formati di destinazione](#target-formats) sotto.

## Formati di destinazione

Le destinazioni MSTeams usano prefissi per distinguere utenti e conversazioni:

| Tipo di destinazione     | Formato                         | Esempio                                             |
| ------------------------ | ------------------------------- | --------------------------------------------------- |
| Utente (per ID)          | `user:<aad-object-id>`          | `user:40a1a0ed-4ff2-4164-a219-55518990c197`         |
| Utente (per nome)        | `user:<display-name>`           | `user:John Smith` (richiede Graph API)              |
| Gruppo/canale            | `conversation:<conversation-id>` | `conversation:19:abc123...@thread.tacv2`           |
| Gruppo/canale (raw)      | `<conversation-id>`             | `19:abc123...@thread.tacv2` (se contiene `@thread`) |

**Esempi CLI:**

```bash
# Send to a user by ID
openclaw message send --channel msteams --target "user:40a1a0ed-..." --message "Hello"

# Send to a user by display name (triggers Graph API lookup)
openclaw message send --channel msteams --target "user:John Smith" --message "Hello"

# Send to a group chat or channel
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" --message "Hello"

# Send a presentation card to a conversation
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" \
  --presentation '{"title":"Hello","blocks":[{"type":"text","text":"Hello"}]}'
```

**Esempi di strumenti agente:**

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
  presentation: {
    title: "Hello",
    blocks: [{ type: "text", text: "Hello" }],
  },
}
```

Nota: senza il prefisso `user:`, i nomi usano come predefinito la risoluzione di gruppo/team. Usa sempre `user:` quando indirizzi persone per display name.

## Messaggistica proattiva

- I messaggi proattivi sono possibili solo **dopo** che un utente ha interagito, perché in quel momento memorizziamo i riferimenti della conversazione.
- Vedi `/gateway/configuration` per `dmPolicy` e il gating delle allowlist.

## ID di team e canale

Il parametro di query `groupId` negli URL Teams **NON** è l'ID team usato per la configurazione. Estrai invece gli ID dal percorso dell'URL:

**URL team:**

```
https://teams.microsoft.com/l/team/19%3ABk4j...%40thread.tacv2/conversations?groupId=...
                                    └────────────────────────────┘
                                    ID team (decodifica URL di questo)
```

**URL canale:**

```
https://teams.microsoft.com/l/channel/19%3A15bc...%40thread.tacv2/ChannelName?groupId=...
                                      └─────────────────────────┘
                                      ID canale (decodifica URL di questo)
```

**Per la configurazione:**

- ID team = segmento del percorso dopo `/team/` (decodificato URL, ad esempio `19:Bk4j...@thread.tacv2`)
- ID canale = segmento del percorso dopo `/channel/` (decodificato URL)
- **Ignora** il parametro di query `groupId`

## Canali privati

I bot hanno supporto limitato nei canali privati:

| Funzionalità                 | Canali standard    | Canali privati         |
| --------------------------- | ------------------ | ---------------------- |
| Installazione del bot       | Sì                 | Limitata               |
| Messaggi in tempo reale (Webhook) | Sì          | Potrebbe non funzionare |
| Autorizzazioni RSC          | Sì                 | Potrebbero comportarsi diversamente |
| @mentions                   | Sì                 | Se il bot è accessibile |
| Cronologia Graph API        | Sì                 | Sì (con autorizzazioni) |

**Soluzioni alternative se i canali privati non funzionano:**

1. Usa canali standard per le interazioni con il bot
2. Usa i DM - gli utenti possono sempre inviare messaggi direttamente al bot
3. Usa Graph API per l'accesso storico (richiede `ChannelMessage.Read.All`)

## Risoluzione dei problemi

### Problemi comuni

- **Le immagini non vengono visualizzate nei canali:** mancano autorizzazioni Graph o consenso amministratore. Reinstalla l'app Teams e chiudi/riapri completamente Teams.
- **Nessuna risposta nel canale:** le menzioni sono obbligatorie per impostazione predefinita; imposta `channels.msteams.requireMention=false` o configura per team/canale.
- **Version mismatch (Teams mostra ancora il vecchio manifest):** rimuovi e aggiungi di nuovo l'app e chiudi completamente Teams per aggiornare.
- **401 Unauthorized dal Webhook:** previsto durante i test manuali senza Azure JWT - significa che l'endpoint è raggiungibile ma l'autenticazione è fallita. Usa Azure Web Chat per testare correttamente.

### Errori di caricamento del manifest

- **"Icon file cannot be empty":** il manifest fa riferimento a file icona di 0 byte. Crea icone PNG valide (32x32 per `outline.png`, 192x192 per `color.png`).
- **"webApplicationInfo.Id already in use":** l'app è ancora installata in un altro team/chat. Trovala e disinstallala prima, oppure attendi 5-10 minuti per la propagazione.
- **"Something went wrong" durante il caricamento:** carica invece tramite [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com), apri gli strumenti di sviluppo del browser (F12) → scheda Network, e controlla il corpo della risposta per l'errore effettivo.
- **Sideload non riuscito:** prova "Upload an app to your org's app catalog" invece di "Upload a custom app" - spesso questo aggira le restrizioni di sideload.

### Le autorizzazioni RSC non funzionano

1. Verifica che `webApplicationInfo.id` corrisponda esattamente all'App ID del tuo bot
2. Ricarica l'app e reinstallala nel team/chat
3. Controlla se l'amministratore della tua organizzazione ha bloccato le autorizzazioni RSC
4. Conferma di usare l'ambito corretto: `ChannelMessage.Read.Group` per i team, `ChatMessage.Read.Chat` per le chat di gruppo

## Riferimenti

- [Create Azure Bot](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) - guida alla configurazione di Azure Bot
- [Teams Developer Portal](https://dev.teams.microsoft.com/apps) - crea/gestisci app Teams
- [Teams app manifest schema](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [Receive channel messages with RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [RSC permissions reference](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [Teams bot file handling](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4) (canale/gruppo richiede Graph)
- [Proactive messaging](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)

## Correlati

<CardGroup cols={2}>
  <Card title="Panoramica dei canali" icon="list" href="/it/channels">
    Tutti i canali supportati.
  </Card>
  <Card title="Pairing" icon="link" href="/it/channels/pairing">
    Autenticazione DM e flusso di pairing.
  </Card>
  <Card title="Groups" icon="users" href="/it/channels/groups">
    Comportamento della chat di gruppo e gating delle menzioni.
  </Card>
  <Card title="Instradamento dei canali" icon="route" href="/it/channels/channel-routing">
    Instradamento della sessione per i messaggi.
  </Card>
  <Card title="Sicurezza" icon="shield" href="/it/gateway/security">
    Modello di accesso e hardening.
  </Card>
</CardGroup>
