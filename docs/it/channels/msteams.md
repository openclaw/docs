---
read_when:
    - Lavorare sulle funzionalità del canale Microsoft Teams
summary: Stato del supporto del bot Microsoft Teams, funzionalità e configurazione
title: Microsoft Teams
x-i18n:
    generated_at: "2026-04-23T08:23:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: c1f093cbb9aed7d7f7348ec796b00f05ef66c601b5345214a08986940020d28e
    source_path: channels/msteams.md
    workflow: 15
---

# Microsoft Teams

> "Lasciate ogni speranza, voi che entrate."

Stato: sono supportati testo + allegati DM; l’invio di file in canali/gruppi richiede `sharePointSiteId` + autorizzazioni Graph (vedi [Invio di file nelle chat di gruppo](#sending-files-in-group-chats)). I sondaggi vengono inviati tramite Adaptive Cards. Le azioni sui messaggi espongono `upload-file` esplicito per invii con priorità ai file.

## Plugin bundled

Microsoft Teams è incluso come plugin bundled nelle attuali versioni di OpenClaw, quindi
non è necessaria alcuna installazione separata nella normale build pacchettizzata.

Se usi una build meno recente o un’installazione personalizzata che esclude Teams bundled,
installalo manualmente:

```bash
openclaw plugins install @openclaw/msteams
```

Checkout locale (quando esegui da un repository git):

```bash
openclaw plugins install ./path/to/local/msteams-plugin
```

Dettagli: [Plugins](/it/tools/plugin)

## Configurazione rapida (principianti)

1. Assicurati che il plugin Microsoft Teams sia disponibile.
   - Le attuali versioni pacchettizzate di OpenClaw lo includono già.
   - Le installazioni meno recenti/personalizzate possono aggiungerlo manualmente con i comandi sopra.
2. Crea un **Azure Bot** (App ID + client secret + tenant ID).
3. Configura OpenClaw con queste credenziali.
4. Esponi `/api/messages` (porta 3978 per impostazione predefinita) tramite un URL pubblico o un tunnel.
5. Installa il pacchetto dell’app Teams e avvia il Gateway.

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

Per i deployment di produzione, valuta l’uso di [autenticazione federata](#federated-authentication-certificate--managed-identity) (certificato o managed identity) invece dei client secret.

Nota: le chat di gruppo sono bloccate per impostazione predefinita (`channels.msteams.groupPolicy: "allowlist"`). Per consentire risposte nei gruppi, imposta `channels.msteams.groupAllowFrom` (oppure usa `groupPolicy: "open"` per consentire qualsiasi membro, con controllo tramite menzione).

## Obiettivi

- Parlare con OpenClaw tramite DM, chat di gruppo o canali di Teams.
- Mantenere deterministico l’instradamento: le risposte tornano sempre al canale da cui sono arrivate.
- Usare per impostazione predefinita un comportamento sicuro nei canali (menzioni richieste se non diversamente configurato).

## Scritture di configurazione

Per impostazione predefinita, Microsoft Teams può scrivere aggiornamenti di configurazione attivati da `/config set|unset` (richiede `commands.config: true`).

Disabilita con:

```json5
{
  channels: { msteams: { configWrites: false } },
}
```

## Controllo di accesso (DM + gruppi)

**Accesso DM**

- Predefinito: `channels.msteams.dmPolicy = "pairing"`. I mittenti sconosciuti vengono ignorati finché non vengono approvati.
- `channels.msteams.allowFrom` dovrebbe usare ID oggetto AAD stabili.
- UPN/nomi visualizzati sono modificabili; la corrispondenza diretta è disabilitata per impostazione predefinita ed è abilitata solo con `channels.msteams.dangerouslyAllowNameMatching: true`.
- La procedura guidata può risolvere i nomi in ID tramite Microsoft Graph quando le credenziali lo consentono.

**Accesso gruppo**

- Predefinito: `channels.msteams.groupPolicy = "allowlist"` (bloccato a meno che non aggiungi `groupAllowFrom`). Usa `channels.defaults.groupPolicy` per sostituire il valore predefinito quando non impostato.
- `channels.msteams.groupAllowFrom` controlla quali mittenti possono attivare nelle chat di gruppo/canali (usa come fallback `channels.msteams.allowFrom`).
- Imposta `groupPolicy: "open"` per consentire qualsiasi membro (comunque soggetto per impostazione predefinita al controllo tramite menzione).
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
- Le chiavi dovrebbero usare ID team stabili e ID conversazione canale.
- Quando `groupPolicy="allowlist"` ed è presente un’allowlist di team, vengono accettati solo i team/canali elencati (con controllo tramite menzione).
- La procedura guidata di configurazione accetta voci `Team/Channel` e le salva per te.
- All’avvio, OpenClaw risolve i nomi di team/canali e degli utenti nell’allowlist in ID (quando le autorizzazioni Graph lo consentono)
  e registra la mappatura; i nomi di team/canali non risolti vengono mantenuti come digitati ma ignorati per impostazione predefinita per l’instradamento, a meno che `channels.msteams.dangerouslyAllowNameMatching: true` non sia abilitato.

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
   - Le installazioni meno recenti/personalizzate possono aggiungerlo manualmente con i comandi sopra.
2. Crea un **Azure Bot** (App ID + secret + tenant ID).
3. Crea un **pacchetto app Teams** che faccia riferimento al bot e includa le autorizzazioni RSC sotto.
4. Carica/installa l’app Teams in un team (o in ambito personale per i DM).
5. Configura `msteams` in `~/.openclaw/openclaw.json` (o nelle variabili d’ambiente) e avvia il Gateway.
6. Per impostazione predefinita, il Gateway resta in ascolto del traffico webhook Bot Framework su `/api/messages`.

## Configurazione Azure Bot (prerequisiti)

Prima di configurare OpenClaw, devi creare una risorsa Azure Bot.

### Passaggio 1: creare Azure Bot

1. Vai a [Create Azure Bot](https://portal.azure.com/#create/Microsoft.AzureBot)
2. Compila la scheda **Basics**:

   | Campo              | Valore                                                   |
   | ------------------ | -------------------------------------------------------- |
   | **Bot handle**     | Il nome del tuo bot, ad es. `openclaw-msteams` (deve essere univoco) |
   | **Subscription**   | Seleziona la tua sottoscrizione Azure                    |
   | **Resource group** | Creane uno nuovo o usane uno esistente                   |
   | **Pricing tier**   | **Free** per sviluppo/test                               |
   | **Type of App**    | **Single Tenant** (consigliato - vedi nota sotto)        |
   | **Creation type**  | **Create new Microsoft App ID**                          |

> **Avviso di deprecazione:** la creazione di nuovi bot multi-tenant è stata deprecata dopo il 2025-07-31. Usa **Single Tenant** per i nuovi bot.

3. Fai clic su **Review + create** → **Create** (attendi ~1-2 minuti)

### Passaggio 2: ottenere le credenziali

1. Vai alla tua risorsa Azure Bot → **Configuration**
2. Copia **Microsoft App ID** → questo è il tuo `appId`
3. Fai clic su **Manage Password** → vai all’App Registration
4. In **Certificates & secrets** → **New client secret** → copia il **Value** → questo è il tuo `appPassword`
5. Vai a **Overview** → copia **Directory (tenant) ID** → questo è il tuo `tenantId`

### Passaggio 3: configurare l’endpoint di messaggistica

1. In Azure Bot → **Configuration**
2. Imposta **Messaging endpoint** sul tuo URL webhook:
   - Produzione: `https://your-domain.com/api/messages`
   - Sviluppo locale: usa un tunnel (vedi [Sviluppo locale](#local-development-tunneling) sotto)

### Passaggio 4: abilitare il canale Teams

1. In Azure Bot → **Channels**
2. Fai clic su **Microsoft Teams** → Configure → Save
3. Accetta i Terms of Service

<a id="federated-authentication-certificate--managed-identity"></a>

## Autenticazione federata (certificato + managed identity)

> Aggiunto in 2026.3.24

Per i deployment di produzione, OpenClaw supporta l’**autenticazione federata** come alternativa più sicura ai client secret. Sono disponibili due metodi:

### Opzione A: autenticazione basata su certificato

Usa un certificato PEM registrato con la registrazione dell’app Entra ID.

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

**Variabili d’ambiente:**

- `MSTEAMS_AUTH_TYPE=federated`
- `MSTEAMS_CERTIFICATE_PATH=/path/to/cert.pem`

### Opzione B: Azure Managed Identity

Usa Azure Managed Identity per l’autenticazione senza password. È ideale per deployment su infrastruttura Azure (AKS, App Service, Azure VM) dove è disponibile una managed identity.

**Come funziona:**

1. Il pod/VM del bot ha una managed identity (assegnata dal sistema o dall’utente).
2. Una **federated identity credential** collega la managed identity alla registrazione dell’app Entra ID.
3. In fase di esecuzione, OpenClaw usa `@azure/identity` per acquisire token dall’endpoint Azure IMDS (`169.254.169.254`).
4. Il token viene passato all’SDK Teams per l’autenticazione del bot.

**Prerequisiti:**

- Infrastruttura Azure con managed identity abilitata (AKS workload identity, App Service, VM)
- Federated identity credential creata sulla registrazione dell’app Entra ID
- Accesso di rete a IMDS (`169.254.169.254:80`) dal pod/VM

**Config (managed identity assegnata dal sistema):**

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

**Config (managed identity assegnata dall’utente):**

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

**Variabili d’ambiente:**

- `MSTEAMS_AUTH_TYPE=federated`
- `MSTEAMS_USE_MANAGED_IDENTITY=true`
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID=<client-id>` (solo per quelle assegnate dall’utente)

### Configurazione AKS Workload Identity

Per deployment AKS che usano workload identity:

1. **Abilita workload identity** sul tuo cluster AKS.
2. **Crea una federated identity credential** sulla registrazione dell’app Entra ID:

   ```bash
   az ad app federated-credential create --id <APP_OBJECT_ID> --parameters '{
     "name": "my-bot-workload-identity",
     "issuer": "<AKS_OIDC_ISSUER_URL>",
     "subject": "system:serviceaccount:<NAMESPACE>:<SERVICE_ACCOUNT>",
     "audiences": ["api://AzureADTokenExchange"]
   }'
   ```

3. **Aggiungi un’annotazione al service account Kubernetes** con l’ID client dell’app:

   ```yaml
   apiVersion: v1
   kind: ServiceAccount
   metadata:
     name: my-bot-sa
     annotations:
       azure.workload.identity/client-id: "<APP_CLIENT_ID>"
   ```

4. **Aggiungi un’etichetta al pod** per l’iniezione della workload identity:

   ```yaml
   metadata:
     labels:
       azure.workload.identity/use: "true"
   ```

5. **Assicura accesso di rete** a IMDS (`169.254.169.254`) — se usi NetworkPolicy, aggiungi una regola di egress che consenta traffico verso `169.254.169.254/32` sulla porta 80.

### Confronto dei tipi di autenticazione

| Metodo               | Config                                         | Pro                                | Contro                                |
| -------------------- | ---------------------------------------------- | ---------------------------------- | ------------------------------------- |
| **Client secret**    | `appPassword`                                  | Configurazione semplice            | Richiede rotazione dei secret, meno sicuro |
| **Certificate**      | `authType: "federated"` + `certificatePath`    | Nessun secret condiviso in rete    | Sovraccarico di gestione certificati  |
| **Managed Identity** | `authType: "federated"` + `useManagedIdentity` | Senza password, nessun secret da gestire | Richiede infrastruttura Azure         |

**Comportamento predefinito:** quando `authType` non è impostato, OpenClaw usa per impostazione predefinita l’autenticazione con client secret. Le configurazioni esistenti continuano a funzionare senza modifiche.

## Sviluppo locale (tunneling)

Teams non può raggiungere `localhost`. Usa un tunnel per lo sviluppo locale:

**Opzione A: ngrok**

```bash
ngrok http 3978
# Copia l'URL https, ad es. https://abc123.ngrok.io
# Imposta l'endpoint di messaggistica su: https://abc123.ngrok.io/api/messages
```

**Opzione B: Tailscale Funnel**

```bash
tailscale funnel 3978
# Usa il tuo URL Tailscale Funnel come endpoint di messaggistica
```

## Teams Developer Portal (alternativa)

Invece di creare manualmente un ZIP del manifest, puoi usare il [Teams Developer Portal](https://dev.teams.microsoft.com/apps):

1. Fai clic su **+ New app**
2. Compila le informazioni di base (nome, descrizione, informazioni sullo sviluppatore)
3. Vai a **App features** → **Bot**
4. Seleziona **Enter a bot ID manually** e incolla il tuo Azure Bot App ID
5. Seleziona gli ambiti: **Personal**, **Team**, **Group Chat**
6. Fai clic su **Distribute** → **Download app package**
7. In Teams: **Apps** → **Manage your apps** → **Upload a custom app** → seleziona lo ZIP

Spesso è più semplice che modificare manualmente i manifest JSON.

## Test del bot

**Opzione A: Azure Web Chat (verifica prima il webhook)**

1. In Azure Portal → la tua risorsa Azure Bot → **Test in Web Chat**
2. Invia un messaggio: dovresti vedere una risposta
3. Questo conferma che il tuo endpoint webhook funziona prima della configurazione di Teams

**Opzione B: Teams (dopo l’installazione dell’app)**

1. Installa l’app Teams (sideload o catalogo dell’organizzazione)
2. Trova il bot in Teams e invia un DM
3. Controlla i log del Gateway per l’attività in ingresso

## Configurazione (minima, solo testo)

1. **Assicurati che il plugin Microsoft Teams sia disponibile**
   - Le attuali versioni pacchettizzate di OpenClaw lo includono già.
   - Le installazioni meno recenti/personalizzate possono aggiungerlo manualmente:
     - Da npm: `openclaw plugins install @openclaw/msteams`
     - Da un checkout locale: `openclaw plugins install ./path/to/local/msteams-plugin`

2. **Registrazione del bot**
   - Crea un Azure Bot (vedi sopra) e annota:
     - App ID
     - Client secret (App password)
     - Tenant ID (single-tenant)

3. **Manifest dell’app Teams**
   - Includi una voce `bot` con `botId = <App ID>`.
   - Ambiti: `personal`, `team`, `groupChat`.
   - `supportsFiles: true` (richiesto per la gestione file nell’ambito personale).
   - Aggiungi autorizzazioni RSC (sotto).
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

   Puoi anche usare variabili d’ambiente invece delle chiavi di configurazione:
   - `MSTEAMS_APP_ID`
   - `MSTEAMS_APP_PASSWORD`
   - `MSTEAMS_TENANT_ID`
   - `MSTEAMS_AUTH_TYPE` (facoltativo: `"secret"` o `"federated"`)
   - `MSTEAMS_CERTIFICATE_PATH` (federata + certificato)
   - `MSTEAMS_CERTIFICATE_THUMBPRINT` (facoltativo, non richiesto per l’autenticazione)
   - `MSTEAMS_USE_MANAGED_IDENTITY` (federata + managed identity)
   - `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID` (solo MI assegnata dall’utente)

5. **Endpoint del bot**
   - Imposta Azure Bot Messaging Endpoint su:
     - `https://<host>:3978/api/messages` (oppure il percorso/porta scelti).

6. **Esegui il Gateway**
   - Il canale Teams si avvia automaticamente quando il plugin bundled o installato manualmente è disponibile e la configurazione `msteams` esiste con le credenziali.

## Azione informazioni membro

OpenClaw espone un’azione `member-info` basata su Graph per Microsoft Teams, così agenti e automazioni possono risolvere direttamente da Microsoft Graph i dettagli dei membri del canale (nome visualizzato, email, ruolo).

Requisiti:

- Autorizzazione RSC `Member.Read.Group` (già nel manifest consigliato)
- Per ricerche tra team diversi: autorizzazione Application `User.Read.All` di Graph con consenso amministratore

L’azione è controllata da `channels.msteams.actions.memberInfo` (predefinita: abilitata quando sono disponibili credenziali Graph).

## Contesto cronologia

- `channels.msteams.historyLimit` controlla quanti messaggi recenti di canale/gruppo vengono inclusi nel prompt.
- Usa come fallback `messages.groupChat.historyLimit`. Imposta `0` per disabilitare (predefinito 50).
- La cronologia del thread recuperata è filtrata dalle allowlist dei mittenti (`allowFrom` / `groupAllowFrom`), quindi il seeding del contesto del thread include solo messaggi da mittenti consentiti.
- Il contesto degli allegati citati (`ReplyTo*` derivato dall’HTML di risposta di Teams) al momento viene passato così come ricevuto.
- In altre parole, le allowlist controllano chi può attivare l’agente; oggi solo alcuni percorsi di contesto supplementare specifici vengono filtrati.
- La cronologia DM può essere limitata con `channels.msteams.dmHistoryLimit` (turni utente). Override per utente: `channels.msteams.dms["<user_id>"].historyLimit`.

## Attuali autorizzazioni RSC di Teams (manifest)

Queste sono le **attuali autorizzazioni resourceSpecific** nel nostro manifest dell’app Teams. Si applicano solo all’interno del team/chat in cui l’app è installata.

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

### Avvertenze sul manifest (campi obbligatori)

- `bots[].botId` **deve** corrispondere all’Azure Bot App ID.
- `webApplicationInfo.id` **deve** corrispondere all’Azure Bot App ID.
- `bots[].scopes` deve includere le superfici che prevedi di usare (`personal`, `team`, `groupChat`).
- `bots[].supportsFiles: true` è richiesto per la gestione file nell’ambito personale.
- `authorization.permissions.resourceSpecific` deve includere lettura/invio dei canali se vuoi traffico di canale.

### Aggiornamento di un’app esistente

Per aggiornare un’app Teams già installata (ad esempio, per aggiungere autorizzazioni RSC):

1. Aggiorna `manifest.json` con le nuove impostazioni
2. **Incrementa il campo `version`** (ad esempio `1.0.0` → `1.1.0`)
3. **Ricrea lo ZIP** del manifest con le icone (`manifest.json`, `outline.png`, `color.png`)
4. Carica il nuovo zip:
   - **Opzione A (Teams Admin Center):** Teams Admin Center → Teams apps → Manage apps → trova la tua app → Upload new version
   - **Opzione B (Sideload):** In Teams → Apps → Manage your apps → Upload a custom app
5. **Per i canali del team:** reinstalla l’app in ogni team affinché le nuove autorizzazioni abbiano effetto
6. **Chiudi completamente e riavvia Teams** (non limitarti a chiudere la finestra) per svuotare i metadati dell’app in cache

## Funzionalità: solo RSC vs Graph

### Con **solo Teams RSC** (app installata, nessuna autorizzazione API Graph)

Funziona:

- Lettura del contenuto **testuale** dei messaggi del canale.
- Invio del contenuto **testuale** dei messaggi del canale.
- Ricezione di allegati file in **ambito personale (DM)**.

NON funziona:

- Contenuto di **immagini o file** in canali/gruppi (il payload include solo uno stub HTML).
- Download di allegati archiviati in SharePoint/OneDrive.
- Lettura della cronologia dei messaggi (oltre l’evento webhook live).

### Con **Teams RSC + autorizzazioni Microsoft Graph Application**

Aggiunge:

- Download di contenuti ospitati (immagini incollate nei messaggi).
- Download di allegati file archiviati in SharePoint/OneDrive.
- Lettura della cronologia dei messaggi di canale/chat tramite Graph.

### RSC vs API Graph

| Funzionalità           | Autorizzazioni RSC    | API Graph                           |
| ---------------------- | --------------------- | ----------------------------------- |
| **Messaggi in tempo reale** | Sì (tramite webhook) | No (solo polling)                  |
| **Messaggi storici**   | No                    | Sì (può interrogare la cronologia) |
| **Complessità di configurazione** | Solo manifest app | Richiede consenso amministratore + flusso token |
| **Funziona offline**   | No (deve essere in esecuzione) | Sì (interrogabile in qualsiasi momento) |

**In sintesi:** RSC serve per l’ascolto in tempo reale; l’API Graph serve per l’accesso storico. Per recuperare i messaggi persi mentre eri offline, ti serve l’API Graph con `ChannelMessage.Read.All` (richiede consenso amministratore).

## Media + cronologia abilitati con Graph (richiesti per i canali)

Se hai bisogno di immagini/file nei **canali** o vuoi recuperare la **cronologia dei messaggi**, devi abilitare le autorizzazioni Microsoft Graph e concedere il consenso amministratore.

1. In Entra ID (Azure AD) **App Registration**, aggiungi autorizzazioni Microsoft Graph **Application**:
   - `ChannelMessage.Read.All` (allegati canale + cronologia)
   - `Chat.Read.All` o `ChatMessage.Read.All` (chat di gruppo)
2. **Concedi il consenso amministratore** per il tenant.
3. Incrementa la **versione del manifest** dell’app Teams, ricaricala e **reinstalla l’app in Teams**.
4. **Chiudi completamente e riavvia Teams** per svuotare i metadati dell’app in cache.

**Autorizzazione aggiuntiva per menzioni utente:** le @mention degli utenti funzionano subito per gli utenti nella conversazione. Tuttavia, se vuoi cercare dinamicamente e menzionare utenti che **non sono nella conversazione corrente**, aggiungi l’autorizzazione Application `User.Read.All` e concedi il consenso amministratore.

## Limitazioni note

### Timeout webhook

Teams recapita i messaggi tramite webhook HTTP. Se l’elaborazione richiede troppo tempo (ad esempio, risposte LLM lente), potresti vedere:

- timeout del Gateway
- Teams che ritenta il messaggio (causando duplicati)
- risposte perse

OpenClaw gestisce questo comportamento restituendo rapidamente una risposta e inviando poi le risposte in modo proattivo, ma risposte molto lente possono comunque causare problemi.

### Formattazione

Il markdown di Teams è più limitato di quello di Slack o Discord:

- La formattazione di base funziona: **grassetto**, _corsivo_, `code`, link
- Il markdown complesso (tabelle, liste annidate) potrebbe non essere visualizzato correttamente
- Le Adaptive Cards sono supportate per sondaggi e invii di presentazione semantica (vedi sotto)

## Configurazione

Impostazioni chiave (vedi `/gateway/configuration` per i pattern condivisi dei canali):

- `channels.msteams.enabled`: abilita/disabilita il canale.
- `channels.msteams.appId`, `channels.msteams.appPassword`, `channels.msteams.tenantId`: credenziali del bot.
- `channels.msteams.webhook.port` (predefinito `3978`)
- `channels.msteams.webhook.path` (predefinito `/api/messages`)
- `channels.msteams.dmPolicy`: `pairing | allowlist | open | disabled` (predefinito: pairing)
- `channels.msteams.allowFrom`: allowlist DM (consigliati ID oggetto AAD). La procedura guidata risolve i nomi in ID durante la configurazione quando è disponibile l’accesso a Graph.
- `channels.msteams.dangerouslyAllowNameMatching`: interruttore break-glass per riabilitare la corrispondenza su UPN/nome visualizzato modificabili e l’instradamento diretto per nome di team/canale.
- `channels.msteams.textChunkLimit`: dimensione dei chunk di testo in uscita.
- `channels.msteams.chunkMode`: `length` (predefinito) oppure `newline` per dividere sulle righe vuote (confini di paragrafo) prima della suddivisione per lunghezza.
- `channels.msteams.mediaAllowHosts`: allowlist per gli host degli allegati in ingresso (predefiniti: domini Microsoft/Teams).
- `channels.msteams.mediaAuthAllowHosts`: allowlist per allegare header Authorization nei retry dei media (predefiniti: host Graph + Bot Framework).
- `channels.msteams.requireMention`: richiede @mention in canali/gruppi (predefinito true).
- `channels.msteams.replyStyle`: `thread | top-level` (vedi [Stile di risposta](#reply-style-threads-vs-posts)).
- `channels.msteams.teams.<teamId>.replyStyle`: override per team.
- `channels.msteams.teams.<teamId>.requireMention`: override per team.
- `channels.msteams.teams.<teamId>.tools`: override predefiniti della policy degli strumenti per team (`allow`/`deny`/`alsoAllow`) usati quando manca un override del canale.
- `channels.msteams.teams.<teamId>.toolsBySender`: override predefiniti della policy degli strumenti per mittente a livello di team (supportato il jolly `"*"`).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`: override per canale.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.requireMention`: override per canale.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.tools`: override della policy degli strumenti per canale (`allow`/`deny`/`alsoAllow`).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.toolsBySender`: override della policy degli strumenti per mittente a livello di canale (supportato il jolly `"*"`).
- Le chiavi di `toolsBySender` dovrebbero usare prefissi espliciti:
  `id:`, `e164:`, `username:`, `name:` (le chiavi legacy senza prefisso continuano a essere mappate solo a `id:`).
- `channels.msteams.actions.memberInfo`: abilita o disabilita l’azione member info basata su Graph (predefinita: abilitata quando sono disponibili credenziali Graph).
- `channels.msteams.authType`: tipo di autenticazione — `"secret"` (predefinito) oppure `"federated"`.
- `channels.msteams.certificatePath`: percorso del file certificato PEM (federata + autenticazione con certificato).
- `channels.msteams.certificateThumbprint`: thumbprint del certificato (facoltativo, non richiesto per l’autenticazione).
- `channels.msteams.useManagedIdentity`: abilita l’autenticazione managed identity (modalità federata).
- `channels.msteams.managedIdentityClientId`: client ID per managed identity assegnata dall’utente.
- `channels.msteams.sharePointSiteId`: SharePoint site ID per i caricamenti di file in chat di gruppo/canali (vedi [Invio di file nelle chat di gruppo](#sending-files-in-group-chats)).

## Instradamento e sessioni

- Le chiavi di sessione seguono il formato standard degli agenti (vedi [/concepts/session](/it/concepts/session)):
  - I messaggi diretti condividono la sessione principale (`agent:<agentId>:<mainKey>`).
  - I messaggi di canale/gruppo usano l’ID conversazione:
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## Stile di risposta: thread vs post

Teams ha recentemente introdotto due stili UI per i canali sullo stesso modello dati sottostante:

| Stile                  | Descrizione                                              | `replyStyle` consigliato |
| ---------------------- | -------------------------------------------------------- | ------------------------ |
| **Posts** (classico)   | I messaggi appaiono come card con risposte in thread sotto | `thread` (predefinito) |
| **Threads** (stile Slack) | I messaggi scorrono linearmente, più simili a Slack    | `top-level`              |

**Il problema:** l’API di Teams non espone quale stile UI usa un canale. Se usi il `replyStyle` sbagliato:

- `thread` in un canale in stile Threads → le risposte appaiono annidate in modo scomodo
- `top-level` in un canale in stile Posts → le risposte appaiono come post separati di primo livello invece che nel thread

**Soluzione:** configura `replyStyle` per canale in base a come è impostato il canale:

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
- **Canali/gruppi:** gli allegati risiedono nell’archiviazione M365 (SharePoint/OneDrive). Il payload del webhook include solo uno stub HTML, non i byte reali del file. **Sono richieste autorizzazioni API Graph** per scaricare gli allegati dei canali.
- Per invii espliciti con priorità ai file, usa `action=upload-file` con `media` / `filePath` / `path`; `message` facoltativo diventa il testo/commento di accompagnamento e `filename` sostituisce il nome caricato.

Senza autorizzazioni Graph, i messaggi di canale con immagini verranno ricevuti come solo testo (il contenuto dell’immagine non è accessibile al bot).
Per impostazione predefinita, OpenClaw scarica i media solo da host Microsoft/Teams. Sostituisci con `channels.msteams.mediaAllowHosts` (usa `["*"]` per consentire qualsiasi host).
Gli header Authorization vengono allegati solo per host presenti in `channels.msteams.mediaAuthAllowHosts` (predefiniti: host Graph + Bot Framework). Mantieni questo elenco restrittivo (evita suffissi multi-tenant).

## Invio di file nelle chat di gruppo

I bot possono inviare file nei DM usando il flusso FileConsentCard (integrato). Tuttavia, **l’invio di file in chat di gruppo/canali** richiede una configurazione aggiuntiva:

| Contesto                 | Modalità di invio dei file                  | Configurazione necessaria                         |
| ------------------------ | ------------------------------------------- | ------------------------------------------------ |
| **DM**                   | FileConsentCard → l’utente accetta → il bot carica | Funziona subito                             |
| **Chat di gruppo/canali** | Caricamento su SharePoint → link di condivisione | Richiede `sharePointSiteId` + autorizzazioni Graph |
| **Immagini (qualsiasi contesto)** | Inline con codifica Base64           | Funziona subito                                  |

### Perché le chat di gruppo richiedono SharePoint

I bot non hanno un drive OneDrive personale (l’endpoint API Graph `/me/drive` non funziona per le identità application). Per inviare file in chat di gruppo/canali, il bot carica su un **sito SharePoint** e crea un link di condivisione.

### Configurazione

1. **Aggiungi autorizzazioni API Graph** in Entra ID (Azure AD) → App Registration:
   - `Sites.ReadWrite.All` (Application) - carica file su SharePoint
   - `Chat.Read.All` (Application) - facoltativo, abilita link di condivisione per utente

2. **Concedi il consenso amministratore** per il tenant.

3. **Ottieni il tuo SharePoint site ID:**

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

### Comportamento della condivisione

| Autorizzazione                           | Comportamento della condivisione                          |
| ---------------------------------------- | --------------------------------------------------------- |
| `Sites.ReadWrite.All` soltanto           | Link di condivisione a livello di organizzazione (chiunque nell’organizzazione può accedere) |
| `Sites.ReadWrite.All` + `Chat.Read.All`  | Link di condivisione per utente (solo i membri della chat possono accedere) |

La condivisione per utente è più sicura perché solo i partecipanti della chat possono accedere al file. Se manca l’autorizzazione `Chat.Read.All`, il bot usa come fallback la condivisione a livello di organizzazione.

### Comportamento di fallback

| Scenario                                          | Risultato                                          |
| ------------------------------------------------- | -------------------------------------------------- |
| Chat di gruppo + file + `sharePointSiteId` configurato | Carica su SharePoint, invia link di condivisione |
| Chat di gruppo + file + nessun `sharePointSiteId` | Tenta upload su OneDrive (può fallire), invia solo testo |
| Chat personale + file                             | Flusso FileConsentCard (funziona senza SharePoint) |
| Qualsiasi contesto + immagine                     | Inline con codifica Base64 (funziona senza SharePoint) |

### Posizione di archiviazione dei file

I file caricati vengono archiviati in una cartella `/OpenClawShared/` nella libreria documenti predefinita del sito SharePoint configurato.

## Sondaggi (Adaptive Cards)

OpenClaw invia i sondaggi di Teams come Adaptive Cards (non esiste un’API nativa Teams per i sondaggi).

- CLI: `openclaw message poll --channel msteams --target conversation:<id> ...`
- I voti vengono registrati dal Gateway in `~/.openclaw/msteams-polls.json`.
- Il Gateway deve restare online per registrare i voti.
- I sondaggi non pubblicano ancora automaticamente riepiloghi dei risultati (se necessario, ispeziona il file di archiviazione).

## Card di presentazione

Invia payload di presentazione semantica a utenti o conversazioni Teams usando lo strumento `message` o la CLI. OpenClaw li rende come Teams Adaptive Cards a partire dal contratto di presentazione generico.

Il parametro `presentation` accetta blocchi semantici. Quando viene fornito `presentation`, il testo del messaggio è facoltativo.

**Strumento agent:**

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

Per i dettagli sul formato del target, vedi [Formati target](#target-formats) sotto.

## Formati target

I target MSTeams usano prefissi per distinguere tra utenti e conversazioni:

| Tipo di target        | Formato                         | Esempio                                             |
| --------------------- | ------------------------------- | --------------------------------------------------- |
| Utente (per ID)       | `user:<aad-object-id>`          | `user:40a1a0ed-4ff2-4164-a219-55518990c197`         |
| Utente (per nome)     | `user:<display-name>`           | `user:John Smith` (richiede API Graph)             |
| Gruppo/canale         | `conversation:<conversation-id>` | `conversation:19:abc123...@thread.tacv2`           |
| Gruppo/canale (raw)   | `<conversation-id>`             | `19:abc123...@thread.tacv2` (se contiene `@thread`) |

**Esempi CLI:**

```bash
# Invia a un utente per ID
openclaw message send --channel msteams --target "user:40a1a0ed-..." --message "Hello"

# Invia a un utente per nome visualizzato (attiva una ricerca API Graph)
openclaw message send --channel msteams --target "user:John Smith" --message "Hello"

# Invia a una chat di gruppo o a un canale
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" --message "Hello"

# Invia una card di presentazione a una conversazione
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" \
  --presentation '{"title":"Hello","blocks":[{"type":"text","text":"Hello"}]}'
```

**Esempi di strumenti agent:**

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

Nota: senza il prefisso `user:`, i nomi vengono risolti per impostazione predefinita come gruppi/team. Usa sempre `user:` quando indirizzi persone tramite nome visualizzato.

## Messaggistica proattiva

- I messaggi proattivi sono possibili **solo dopo** che un utente ha interagito, perché in quel momento memorizziamo i riferimenti di conversazione.
- Vedi `/gateway/configuration` per `dmPolicy` e il controllo tramite allowlist.

## ID team e canale (problema comune)

Il parametro di query `groupId` negli URL di Teams **NON** è l’ID team usato per la configurazione. Estrai invece gli ID dal percorso dell’URL:

**URL team:**

```
https://teams.microsoft.com/l/team/19%3ABk4j...%40thread.tacv2/conversations?groupId=...
                                    └────────────────────────────┘
                                    Team ID (decodifica questo URL)
```

**URL canale:**

```
https://teams.microsoft.com/l/channel/19%3A15bc...%40thread.tacv2/ChannelName?groupId=...
                                      └─────────────────────────┘
                                      Channel ID (decodifica questo URL)
```

**Per la configurazione:**

- Team ID = segmento del percorso dopo `/team/` (decodificato dall’URL, ad es. `19:Bk4j...@thread.tacv2`)
- Channel ID = segmento del percorso dopo `/channel/` (decodificato dall’URL)
- **Ignora** il parametro di query `groupId`

## Canali privati

I bot hanno supporto limitato nei canali privati:

| Funzionalità                | Canali standard | Canali privati        |
| --------------------------- | --------------- | --------------------- |
| Installazione bot           | Sì              | Limitata              |
| Messaggi in tempo reale (webhook) | Sì       | Potrebbe non funzionare |
| Autorizzazioni RSC          | Sì              | Potrebbero comportarsi in modo diverso |
| @mentions                   | Sì              | Se il bot è accessibile |
| Cronologia API Graph        | Sì              | Sì (con autorizzazioni) |

**Soluzioni alternative se i canali privati non funzionano:**

1. Usa canali standard per le interazioni con il bot
2. Usa i DM: gli utenti possono sempre scrivere direttamente al bot
3. Usa l’API Graph per l’accesso storico (richiede `ChannelMessage.Read.All`)

## Risoluzione dei problemi

### Problemi comuni

- **Le immagini non vengono mostrate nei canali:** mancano autorizzazioni Graph o consenso amministratore. Reinstalla l’app Teams e chiudi/riapri completamente Teams.
- **Nessuna risposta nel canale:** le menzioni sono richieste per impostazione predefinita; imposta `channels.msteams.requireMention=false` o configura per team/canale.
- **Version mismatch (Teams mostra ancora il vecchio manifest):** rimuovi e riaggiungi l’app e chiudi completamente Teams per aggiornare.
- **401 Unauthorized dal webhook:** previsto durante test manuali senza JWT Azure — significa che l’endpoint è raggiungibile ma l’autenticazione è fallita. Usa Azure Web Chat per testare correttamente.

### Errori nel caricamento del manifest

- **"Icon file cannot be empty":** il manifest fa riferimento a file icona di 0 byte. Crea icone PNG valide (32x32 per `outline.png`, 192x192 per `color.png`).
- **"webApplicationInfo.Id already in use":** l’app è ancora installata in un altro team/chat. Trovala e disinstallala prima, oppure attendi 5-10 minuti per la propagazione.
- **"Something went wrong" durante il caricamento:** carica invece tramite [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com), apri i DevTools del browser (F12) → scheda Network e controlla il corpo della risposta per l’errore reale.
- **Sideload non riuscito:** prova "Upload an app to your org's app catalog" invece di "Upload a custom app" — spesso questo aggira le restrizioni del sideload.

### Autorizzazioni RSC non funzionanti

1. Verifica che `webApplicationInfo.id` corrisponda esattamente all’App ID del tuo bot
2. Ricarica l’app e reinstallala nel team/chat
3. Controlla se l’amministratore della tua organizzazione ha bloccato le autorizzazioni RSC
4. Conferma di usare l’ambito giusto: `ChannelMessage.Read.Group` per i team, `ChatMessage.Read.Chat` per le chat di gruppo

## Riferimenti

- [Create Azure Bot](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) - guida alla configurazione di Azure Bot
- [Teams Developer Portal](https://dev.teams.microsoft.com/apps) - crea/gestisci app Teams
- [Teams app manifest schema](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [Receive channel messages with RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [RSC permissions reference](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [Teams bot file handling](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4) (canale/gruppo richiede Graph)
- [Proactive messaging](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)

## Correlati

- [Panoramica dei canali](/it/channels) — tutti i canali supportati
- [Pairing](/it/channels/pairing) — autenticazione DM e flusso di pairing
- [Gruppi](/it/channels/groups) — comportamento delle chat di gruppo e controllo tramite menzioni
- [Instradamento dei canali](/it/channels/channel-routing) — instradamento della sessione per i messaggi
- [Sicurezza](/it/gateway/security) — modello di accesso e hardening
