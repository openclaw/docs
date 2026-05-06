---
read_when:
    - Lavorare sulle funzionalità del canale Microsoft Teams
summary: Stato del supporto, funzionalità e configurazione del bot Microsoft Teams
title: Microsoft Teams
x-i18n:
    generated_at: "2026-05-06T17:52:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: be669545bd692754fbee8b670b1b482c39399a3d26e06a7ae01230fdaee645fe
    source_path: channels/msteams.md
    workflow: 16
---

Stato: testo + allegati DM sono supportati; l'invio di file in canali/gruppi richiede `sharePointSiteId` + autorizzazioni Graph (vedi [Invio di file nelle chat di gruppo](#sending-files-in-group-chats)). I sondaggi vengono inviati tramite Adaptive Cards. Le azioni dei messaggi espongono `upload-file` esplicito per invii incentrati sui file.

## Plugin in bundle

Microsoft Teams viene fornito come Plugin in bundle nelle versioni attuali di OpenClaw, quindi nella normale build pacchettizzata non è richiesta alcuna installazione separata.

Se usi una build meno recente o un'installazione personalizzata che esclude Teams in bundle, installa direttamente il pacchetto npm:

```bash
openclaw plugins install @openclaw/msteams
```

Usa il pacchetto semplice per seguire il tag di rilascio ufficiale corrente. Blocca una versione esatta solo quando ti serve un'installazione riproducibile.

Checkout locale (quando esegui da un repository git):

```bash
openclaw plugins install ./path/to/local/msteams-plugin
```

Dettagli: [Plugin](/it/tools/plugin)

## Configurazione rapida

[`@microsoft/teams.cli`](https://www.npmjs.com/package/@microsoft/teams.cli) gestisce registrazione del bot, creazione del manifest e generazione delle credenziali con un unico comando.

**1. Installa e accedi**

```bash
npm install -g @microsoft/teams.cli@preview
teams login
teams status   # verify you're logged in and see your tenant info
```

<Note>
La Teams CLI è attualmente in anteprima. Comandi e flag possono cambiare tra le versioni.
</Note>

**2. Avvia un tunnel** (Teams non può raggiungere localhost)

Installa e autentica la devtunnel CLI se non l'hai già fatto ([guida introduttiva](https://learn.microsoft.com/en-us/azure/developer/dev-tunnels/get-started)).

```bash
# One-time setup (persistent URL across sessions):
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# Each dev session:
devtunnel host my-openclaw-bot
# Your endpoint: https://<tunnel-id>.devtunnels.ms/api/messages
```

<Note>
`--allow-anonymous` è necessario perché Teams non può autenticarsi con devtunnels. Ogni richiesta bot in ingresso viene comunque convalidata automaticamente dal Teams SDK.
</Note>

Alternative: `ngrok http 3978` o `tailscale funnel 3978` (ma questi possono cambiare URL a ogni sessione).

**3. Crea l'app**

```bash
teams app create \
  --name "OpenClaw" \
  --endpoint "https://<your-tunnel-url>/api/messages"
```

Questo singolo comando:

- Crea un'applicazione Entra ID (Azure AD)
- Genera un client secret
- Crea e carica un manifest dell'app Teams (con icone)
- Registra il bot (gestito da Teams per impostazione predefinita - non serve un abbonamento Azure)

L'output mostrerà `CLIENT_ID`, `CLIENT_SECRET`, `TENANT_ID` e un **ID app Teams** - annotali per i passaggi successivi. Offre anche di installare direttamente l'app in Teams.

**4. Configura OpenClaw** usando le credenziali dell'output:

```json5
{
  channels: {
    msteams: {
      enabled: true,
      appId: "<CLIENT_ID>",
      appPassword: "<CLIENT_SECRET>",
      tenantId: "<TENANT_ID>",
      webhook: { port: 3978, path: "/api/messages" },
    },
  },
}
```

Oppure usa direttamente le variabili d'ambiente: `MSTEAMS_APP_ID`, `MSTEAMS_APP_PASSWORD`, `MSTEAMS_TENANT_ID`.

**5. Installa l'app in Teams**

`teams app create` ti chiederà di installare l'app - seleziona "Installa in Teams". Se hai saltato questo passaggio, puoi ottenere il link in seguito:

```bash
teams app get <teamsAppId> --install-link
```

**6. Verifica che tutto funzioni**

```bash
teams app doctor <teamsAppId>
```

Questo esegue diagnostica su registrazione del bot, configurazione dell'app AAD, validità del manifest e configurazione SSO.

Per distribuzioni di produzione, valuta l'uso dell'[autenticazione federata](/it/channels/msteams#federated-authentication-certificate-plus-managed-identity) (certificato o identità gestita) invece dei client secret.

<Note>
Le chat di gruppo sono bloccate per impostazione predefinita (`channels.msteams.groupPolicy: "allowlist"`). Per consentire risposte di gruppo, imposta `channels.msteams.groupAllowFrom`, oppure usa `groupPolicy: "open"` per consentire qualsiasi membro (con gate su menzione).
</Note>

## Obiettivi

- Parlare con OpenClaw tramite DM, chat di gruppo o canali Teams.
- Mantenere il routing deterministico: le risposte tornano sempre al canale da cui sono arrivate.
- Usare per impostazione predefinita un comportamento sicuro dei canali (menzioni richieste salvo configurazione diversa).

## Scritture della configurazione

Per impostazione predefinita, Microsoft Teams può scrivere aggiornamenti di configurazione attivati da `/config set|unset` (richiede `commands.config: true`).

Disabilita con:

```json5
{
  channels: { msteams: { configWrites: false } },
}
```

## Controllo accessi (DM + gruppi)

**Accesso DM**

- Predefinito: `channels.msteams.dmPolicy = "pairing"`. I mittenti sconosciuti vengono ignorati finché non vengono approvati.
- `channels.msteams.allowFrom` dovrebbe usare ID oggetto AAD stabili.
- Non fare affidamento sulla corrispondenza UPN/nome visualizzato per le allowlist - possono cambiare. OpenClaw disabilita per impostazione predefinita la corrispondenza diretta dei nomi; attivala esplicitamente con `channels.msteams.dangerouslyAllowNameMatching: true`.
- La procedura guidata può risolvere i nomi in ID tramite Microsoft Graph quando le credenziali lo consentono.

**Accesso di gruppo**

- Predefinito: `channels.msteams.groupPolicy = "allowlist"` (bloccato salvo aggiunta di `groupAllowFrom`). Usa `channels.defaults.groupPolicy` per sovrascrivere il valore predefinito quando non impostato.
- `channels.msteams.groupAllowFrom` controlla quali mittenti possono attivare nelle chat/canali di gruppo (con fallback a `channels.msteams.allowFrom`).
- Imposta `groupPolicy: "open"` per consentire qualsiasi membro (comunque con gate su menzione per impostazione predefinita).
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

**Allowlist Teams + canali**

- Limita l'ambito delle risposte di gruppo/canale elencando team e canali in `channels.msteams.teams`.
- Le chiavi dovrebbero usare ID conversazione Teams stabili ricavati dai link Teams, non nomi visualizzati modificabili.
- Quando `groupPolicy="allowlist"` ed è presente una allowlist di team, vengono accettati solo i team/canali elencati (con gate su menzione).
- La procedura guidata di configurazione accetta voci `Team/Channel` e le memorizza per te.
- All'avvio, OpenClaw risolve i nomi di team/canali e degli utenti in allowlist in ID (quando le autorizzazioni Graph lo consentono)
  e registra la mappatura; i nomi di team/canali non risolti vengono conservati come digitati ma ignorati per il routing per impostazione predefinita, salvo abilitare `channels.msteams.dangerouslyAllowNameMatching: true`.

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

<details>
<summary><strong>Configurazione manuale (senza la Teams CLI)</strong></summary>

Se non puoi usare la Teams CLI, puoi configurare manualmente il bot tramite Azure Portal.

### Come funziona

1. Assicurati che il Plugin Microsoft Teams sia disponibile (in bundle nelle versioni attuali).
2. Crea un **Azure Bot** (ID app + secret + ID tenant).
3. Crea un **pacchetto app Teams** che fa riferimento al bot e include le autorizzazioni RSC sotto.
4. Carica/installa l'app Teams in un team (o nello scope personale per i DM).
5. Configura `msteams` in `~/.openclaw/openclaw.json` (o nelle variabili d'ambiente) e avvia il Gateway.
6. Il Gateway ascolta il traffico Webhook Bot Framework su `/api/messages` per impostazione predefinita.

### Passaggio 1: Crea Azure Bot

1. Vai a [Crea Azure Bot](https://portal.azure.com/#create/Microsoft.AzureBot)
2. Compila la scheda **Basics**:

   | Campo              | Valore                                                   |
   | ------------------ | -------------------------------------------------------- |
   | **Bot handle**     | Il nome del tuo bot, ad es. `openclaw-msteams` (deve essere univoco) |
   | **Subscription**   | Seleziona il tuo abbonamento Azure                       |
   | **Resource group** | Crea nuovo o usa esistente                               |
   | **Pricing tier**   | **Free** per sviluppo/test                               |
   | **Type of App**    | **Single Tenant** (consigliato - vedi nota sotto)        |
   | **Creation type**  | **Create new Microsoft App ID**                          |

<Warning>
La creazione di nuovi bot multi-tenant è stata deprecata dopo il 2025-07-31. Usa **Single Tenant** per i nuovi bot.
</Warning>

3. Fai clic su **Review + create** → **Create** (attendi ~1-2 minuti)

### Passaggio 2: Ottieni le credenziali

1. Vai alla tua risorsa Azure Bot → **Configuration**
2. Copia **Microsoft App ID** → questo è il tuo `appId`
3. Fai clic su **Manage Password** → vai alla registrazione dell'app
4. In **Certificates & secrets** → **New client secret** → copia il **Value** → questo è il tuo `appPassword`
5. Vai a **Overview** → copia **Directory (tenant) ID** → questo è il tuo `tenantId`

### Passaggio 3: Configura l'endpoint di messaggistica

1. In Azure Bot → **Configuration**
2. Imposta **Messaging endpoint** sul tuo URL Webhook:
   - Produzione: `https://your-domain.com/api/messages`
   - Sviluppo locale: usa un tunnel (vedi [Sviluppo locale](#local-development-tunneling) sotto)

### Passaggio 4: Abilita il canale Teams

1. In Azure Bot → **Channels**
2. Fai clic su **Microsoft Teams** → Configura → Salva
3. Accetta i Termini di servizio

### Passaggio 5: Crea il manifest dell'app Teams

- Includi una voce `bot` con `botId = <App ID>`.
- Scope: `personal`, `team`, `groupChat`.
- `supportsFiles: true` (richiesto per la gestione dei file nello scope personale).
- Aggiungi autorizzazioni RSC (vedi [Autorizzazioni RSC](#current-teams-rsc-permissions-manifest)).
- Crea icone: `outline.png` (32x32) e `color.png` (192x192).
- Comprimi insieme tutti e tre i file: `manifest.json`, `outline.png`, `color.png`.

### Passaggio 6: Configura OpenClaw

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

Variabili d'ambiente: `MSTEAMS_APP_ID`, `MSTEAMS_APP_PASSWORD`, `MSTEAMS_TENANT_ID`.

### Passaggio 7: Esegui il Gateway

Il canale Teams si avvia automaticamente quando il Plugin è disponibile e la configurazione `msteams` esiste con le credenziali.

</details>

## Autenticazione federata (certificato più identità gestita)

> Aggiunto in 2026.4.11

Per distribuzioni di produzione, OpenClaw supporta **l'autenticazione federata** come alternativa più sicura ai client secret. Sono disponibili due metodi:

### Opzione A: Autenticazione basata su certificato

Usa un certificato PEM registrato con la registrazione della tua app Entra ID.

**Configurazione:**

1. Genera o ottieni un certificato (formato PEM con chiave privata).
2. In Entra ID → Registrazione app → **Certificates & secrets** → **Certificates** → Carica il certificato pubblico.

**Configurazione:**

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

Usa Azure Managed Identity per l'autenticazione senza password. È ideale per distribuzioni su infrastruttura Azure (AKS, App Service, VM Azure) in cui è disponibile un'identità gestita.

**Come funziona:**

1. Il pod/VM del bot dispone di un'identità gestita (assegnata dal sistema o dall'utente).
2. Una **credenziale di identità federata** collega l'identità gestita alla registrazione dell'app Entra ID.
3. In fase di esecuzione, OpenClaw usa `@azure/identity` per acquisire token dall'endpoint Azure IMDS (`169.254.169.254`).
4. Il token viene passato al Teams SDK per l'autenticazione del bot.

**Prerequisiti:**

- Infrastruttura Azure con identità gestita abilitata (identità workload AKS, App Service, VM)
- Credenziale di identità federata creata sulla registrazione dell'app Entra ID
- Accesso di rete a IMDS (`169.254.169.254:80`) dal pod/VM

**Configurazione (identità gestita assegnata dal sistema):**

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
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID=<client-id>` (solo per assegnata dall'utente)

### Configurazione di AKS Workload Identity

Per distribuzioni AKS che usano workload identity:

1. **Abilita workload identity** nel tuo cluster AKS.
2. **Crea una credenziale di identità federata** nella registrazione dell'app Entra ID:

   ```bash
   az ad app federated-credential create --id <APP_OBJECT_ID> --parameters '{
     "name": "my-bot-workload-identity",
     "issuer": "<AKS_OIDC_ISSUER_URL>",
     "subject": "system:serviceaccount:<NAMESPACE>:<SERVICE_ACCOUNT>",
     "audiences": ["api://AzureADTokenExchange"]
   }'
   ```

3. **Annota il service account Kubernetes** con l'ID client dell'app:

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

5. **Assicurati che ci sia accesso di rete** a IMDS (`169.254.169.254`) - se usi NetworkPolicy, aggiungi una regola di uscita che consenta il traffico verso `169.254.169.254/32` sulla porta 80.

### Confronto dei tipi di autenticazione

| Metodo               | Config                                         | Vantaggi                           | Svantaggi                                      |
| -------------------- | ---------------------------------------------- | ---------------------------------- | ---------------------------------------------- |
| **Segreto client**   | `appPassword`                                  | Configurazione semplice            | Rotazione del segreto richiesta, meno sicuro   |
| **Certificato**      | `authType: "federated"` + `certificatePath`    | Nessun segreto condiviso sulla rete | Onere di gestione dei certificati              |
| **Managed Identity** | `authType: "federated"` + `useManagedIdentity` | Senza password, nessun segreto da gestire | Infrastruttura Azure richiesta           |

**Comportamento predefinito:** quando `authType` non è impostato, OpenClaw usa per impostazione predefinita l'autenticazione con segreto client. Le configurazioni esistenti continuano a funzionare senza modifiche.

## Sviluppo locale (tunneling)

Teams non può raggiungere `localhost`. Usa un tunnel di sviluppo persistente in modo che il tuo URL resti invariato tra le sessioni:

```bash
# One-time setup:
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# Each dev session:
devtunnel host my-openclaw-bot
```

Alternative: `ngrok http 3978` o `tailscale funnel 3978` (gli URL possono cambiare a ogni sessione).

Se l'URL del tunnel cambia, aggiorna l'endpoint:

```bash
teams app update <teamsAppId> --endpoint "https://<new-url>/api/messages"
```

## Test del bot

**Esegui la diagnostica:**

```bash
teams app doctor <teamsAppId>
```

Controlla registrazione del bot, app AAD, manifesto e configurazione SSO in un unico passaggio.

**Invia un messaggio di test:**

1. Installa l'app Teams (usa il link di installazione da `teams app get <id> --install-link`)
2. Trova il bot in Teams e invia un DM
3. Controlla i log del gateway per l'attività in arrivo

## Variabili d'ambiente

Tutte le chiavi di configurazione possono invece essere impostate tramite variabili d'ambiente:

- `MSTEAMS_APP_ID`
- `MSTEAMS_APP_PASSWORD`
- `MSTEAMS_TENANT_ID`
- `MSTEAMS_AUTH_TYPE` (facoltativo: `"secret"` o `"federated"`)
- `MSTEAMS_CERTIFICATE_PATH` (federata + certificato)
- `MSTEAMS_CERTIFICATE_THUMBPRINT` (facoltativo, non richiesto per l'autenticazione)
- `MSTEAMS_USE_MANAGED_IDENTITY` (federata + identità gestita)
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID` (solo MI assegnata dall'utente)

## Azione informazioni membro

OpenClaw espone un'azione `member-info` basata su Graph per Microsoft Teams, così agenti e automazioni possono risolvere i dettagli dei membri del canale (nome visualizzato, email, ruolo) direttamente da Microsoft Graph.

Requisiti:

- Autorizzazione RSC `Member.Read.Group` (già nel manifesto consigliato)
- Per ricerche tra team: autorizzazione Graph Application `User.Read.All` con consenso dell'amministratore

L'azione è controllata da `channels.msteams.actions.memberInfo` (predefinito: abilitata quando sono disponibili le credenziali Graph).

## Contesto della cronologia

- `channels.msteams.historyLimit` controlla quanti messaggi recenti di canale/gruppo vengono inseriti nel prompt.
- Ripiega su `messages.groupChat.historyLimit`. Imposta `0` per disabilitare (predefinito 50).
- La cronologia del thread recuperata viene filtrata in base agli elenchi di mittenti consentiti (`allowFrom` / `groupAllowFrom`), quindi l'inizializzazione del contesto del thread include solo messaggi da mittenti consentiti.
- Il contesto degli allegati citati (`ReplyTo*` derivato dall'HTML di risposta di Teams) viene attualmente passato così come ricevuto.
- In altre parole, gli elenchi consentiti controllano chi può attivare l'agente; oggi vengono filtrati solo percorsi specifici di contesto supplementare.
- La cronologia dei DM può essere limitata con `channels.msteams.dmHistoryLimit` (turni utente). Override per utente: `channels.msteams.dms["<user_id>"].historyLimit`.

## Autorizzazioni RSC Teams attuali (manifesto)

Queste sono le **autorizzazioni resourceSpecific esistenti** nel manifesto della nostra app Teams. Si applicano solo all'interno del team/chat in cui l'app è installata.

**Per i canali (ambito team):**

- `ChannelMessage.Read.Group` (Application) - ricevi tutti i messaggi di canale senza @mention
- `ChannelMessage.Send.Group` (Application)
- `Member.Read.Group` (Application)
- `Owner.Read.Group` (Application)
- `ChannelSettings.Read.Group` (Application)
- `TeamMember.Read.Group` (Application)
- `TeamSettings.Read.Group` (Application)

**Per le chat di gruppo:**

- `ChatMessage.Read.Chat` (Application) - ricevi tutti i messaggi della chat di gruppo senza @mention

Per aggiungere autorizzazioni RSC tramite la CLI di Teams:

```bash
teams app rsc add <teamsAppId> ChannelMessage.Read.Group --type Application
```

## Esempio di manifesto Teams (redatto)

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

### Avvertenze sul manifesto (campi obbligatori)

- `bots[].botId` **deve** corrispondere all'ID dell'app Azure Bot.
- `webApplicationInfo.id` **deve** corrispondere all'ID dell'app Azure Bot.
- `bots[].scopes` deve includere le superfici che prevedi di usare (`personal`, `team`, `groupChat`).
- `bots[].supportsFiles: true` è richiesto per la gestione dei file nell'ambito personale.
- `authorization.permissions.resourceSpecific` deve includere lettura/invio del canale se vuoi traffico di canale.

### Aggiornamento di un'app esistente

Per aggiornare un'app Teams già installata (ad esempio per aggiungere autorizzazioni RSC):

```bash
# Download, edit, and re-upload the manifest
teams app manifest download <teamsAppId> manifest.json
# Edit manifest.json locally...
teams app manifest upload manifest.json <teamsAppId>
# Version is auto-bumped if content changed
```

Dopo l'aggiornamento, reinstalla l'app in ogni team affinché le nuove autorizzazioni abbiano effetto e **chiudi completamente e riavvia Teams** (non limitarti a chiudere la finestra) per svuotare i metadati dell'app memorizzati nella cache.

<details>
<summary>Aggiornamento manuale del manifesto (senza CLI)</summary>

1. Aggiorna il tuo `manifest.json` con le nuove impostazioni
2. **Incrementa il campo `version`** (ad esempio, `1.0.0` → `1.1.0`)
3. **Ricrea lo zip** del manifesto con le icone (`manifest.json`, `outline.png`, `color.png`)
4. Carica il nuovo zip:
   - **Teams Admin Center:** app Teams → Gestisci app → trova la tua app → Carica nuova versione
   - **Sideload:** in Teams → App → Gestisci le tue app → Carica un'app personalizzata

</details>

## Funzionalità: solo RSC vs Graph

### Con **solo Teams RSC** (app installata, nessuna autorizzazione Graph API)

Funziona:

- Leggere il contenuto **testuale** dei messaggi di canale.
- Inviare contenuto **testuale** nei messaggi di canale.
- Ricevere allegati di file **personali (DM)**.

Non funziona:

- **Contenuti di immagini o file** in canali/gruppi (il payload include solo uno stub HTML).
- Download di allegati archiviati in SharePoint/OneDrive.
- Lettura della cronologia dei messaggi (oltre l'evento Webhook live).

### Con **Teams RSC + autorizzazioni Microsoft Graph Application**

Aggiunge:

- Download di contenuti ospitati (immagini incollate nei messaggi).
- Download di allegati di file archiviati in SharePoint/OneDrive.
- Lettura della cronologia dei messaggi di canale/chat tramite Graph.

### RSC vs Graph API

| Funzionalità          | Autorizzazioni RSC    | Graph API                                |
| --------------------- | --------------------- | ---------------------------------------- |
| **Messaggi in tempo reale** | Sì (tramite Webhook) | No (solo polling)                        |
| **Messaggi storici**  | No                    | Sì (può interrogare la cronologia)       |
| **Complessità di configurazione** | Solo manifesto dell'app | Richiede consenso amministratore + flusso token |
| **Funziona offline**  | No (deve essere in esecuzione) | Sì (interrogazione in qualsiasi momento) |

**In sintesi:** RSC serve per l'ascolto in tempo reale; Graph API serve per l'accesso storico. Per recuperare messaggi persi mentre eri offline, ti serve Graph API con `ChannelMessage.Read.All` (richiede consenso dell'amministratore).

## Media + cronologia abilitati da Graph (richiesti per i canali)

Se ti servono immagini/file nei **canali** o vuoi recuperare la **cronologia dei messaggi**, devi abilitare le autorizzazioni Microsoft Graph e concedere il consenso dell'amministratore.

1. In Entra ID (Azure AD) **Registrazione app**, aggiungi autorizzazioni Microsoft Graph **Application**:
   - `ChannelMessage.Read.All` (allegati di canale + cronologia)
   - `Chat.Read.All` o `ChatMessage.Read.All` (chat di gruppo)
2. **Concedi il consenso dell'amministratore** per il tenant.
3. Incrementa la **versione del manifesto** dell'app Teams, ricaricalo e **reinstalla l'app in Teams**.
4. **Chiudi completamente e riavvia Teams** per svuotare i metadati dell'app memorizzati nella cache.

**Autorizzazione aggiuntiva per le menzioni utente:** le @mention agli utenti funzionano immediatamente per gli utenti nella conversazione. Tuttavia, se vuoi cercare e menzionare dinamicamente utenti che **non sono nella conversazione corrente**, aggiungi l'autorizzazione `User.Read.All` (Application) e concedi il consenso dell'amministratore.

## Limitazioni note

### Timeout del Webhook

Teams consegna i messaggi tramite Webhook HTTP. Se l'elaborazione richiede troppo tempo (ad esempio, risposte LLM lente), potresti vedere:

- Timeout del Gateway
- Teams che riprova a inviare il messaggio (causando duplicati)
- Risposte scartate

OpenClaw gestisce questo restituendo rapidamente e inviando risposte in modo proattivo, ma risposte molto lente possono comunque causare problemi.

### Formattazione

Il markdown di Teams è più limitato di quello di Slack o Discord:

- La formattazione di base funziona: **grassetto**, _corsivo_, `code`, link
- Il markdown complesso (tabelle, elenchi annidati) potrebbe non essere renderizzato correttamente
- Le Adaptive Cards sono supportate per sondaggi e invii di presentazioni semantiche (vedi sotto)

## Configurazione

Impostazioni chiave (vedi `/gateway/configuration` per i pattern condivisi dei canali):

- `channels.msteams.enabled`: abilita/disabilita il canale.
- `channels.msteams.appId`, `channels.msteams.appPassword`, `channels.msteams.tenantId`: credenziali del bot.
- `channels.msteams.webhook.port` (predefinito `3978`)
- `channels.msteams.webhook.path` (predefinito `/api/messages`)
- `channels.msteams.dmPolicy`: `pairing | allowlist | open | disabled` (predefinito: pairing)
- `channels.msteams.allowFrom`: allowlist DM (ID oggetto AAD consigliati). La procedura guidata risolve i nomi in ID durante la configurazione quando l'accesso a Graph è disponibile.
- `channels.msteams.dangerouslyAllowNameMatching`: interruttore di emergenza per riabilitare il matching mutabile di UPN/nome visualizzato e il routing diretto per nome di team/canale.
- `channels.msteams.textChunkLimit`: dimensione dei blocchi di testo in uscita.
- `channels.msteams.chunkMode`: `length` (predefinito) o `newline` per dividere sulle righe vuote (confini di paragrafo) prima della suddivisione per lunghezza.
- `channels.msteams.mediaAllowHosts`: allowlist per gli host degli allegati in ingresso (predefinita sui domini Microsoft/Teams).
- `channels.msteams.mediaAuthAllowHosts`: allowlist per allegare header Authorization sui retry dei media (predefinita sugli host Graph + Bot Framework).
- `channels.msteams.requireMention`: richiedi @mention in canali/gruppi (predefinito true).
- `channels.msteams.replyStyle`: `thread | top-level` (vedi [Stile di risposta](#reply-style-threads-vs-posts)).
- `channels.msteams.teams.<teamId>.replyStyle`: override per team.
- `channels.msteams.teams.<teamId>.requireMention`: override per team.
- `channels.msteams.teams.<teamId>.tools`: override predefiniti per team delle policy degli strumenti (`allow`/`deny`/`alsoAllow`) usati quando manca un override del canale.
- `channels.msteams.teams.<teamId>.toolsBySender`: override predefiniti per team e per mittente delle policy degli strumenti (wildcard `"*"` supportata).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`: override per canale.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.requireMention`: override per canale.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.tools`: override per canale delle policy degli strumenti (`allow`/`deny`/`alsoAllow`).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.toolsBySender`: override per canale e per mittente delle policy degli strumenti (wildcard `"*"` supportata).
- Le chiavi `toolsBySender` dovrebbero usare prefissi espliciti:
  `id:`, `e164:`, `username:`, `name:` (le chiavi legacy senza prefisso vengono ancora mappate solo a `id:`).
- `channels.msteams.actions.memberInfo`: abilita o disabilita l'azione di informazioni membro supportata da Graph (predefinito: abilitata quando le credenziali Graph sono disponibili).
- `channels.msteams.authType`: tipo di autenticazione - `"secret"` (predefinito) o `"federated"`.
- `channels.msteams.certificatePath`: percorso del file certificato PEM (autenticazione federata + certificato).
- `channels.msteams.certificateThumbprint`: thumbprint del certificato (opzionale, non richiesto per l'autenticazione).
- `channels.msteams.useManagedIdentity`: abilita l'autenticazione con identità gestita (modalità federata).
- `channels.msteams.managedIdentityClientId`: ID client per l'identità gestita assegnata dall'utente.
- `channels.msteams.sharePointSiteId`: ID sito SharePoint per i caricamenti di file in chat di gruppo/canali (vedi [Invio di file nelle chat di gruppo](#sending-files-in-group-chats)).

## Routing e sessioni

- Le chiavi di sessione seguono il formato standard dell'agente (vedi [/concepts/session](/it/concepts/session)):
  - I messaggi diretti condividono la sessione principale (`agent:<agentId>:<mainKey>`).
  - I messaggi di canale/gruppo usano l'id conversazione:
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## Stile di risposta: thread vs post

Teams ha introdotto di recente due stili UI di canale sullo stesso modello dati sottostante:

| Stile                    | Descrizione                                               | `replyStyle` consigliato |
| ------------------------ | --------------------------------------------------------- | ------------------------ |
| **Post** (classico)      | I messaggi appaiono come schede con risposte in thread sotto | `thread` (predefinito)       |
| **Thread** (stile Slack) | I messaggi scorrono linearmente, più come Slack                   | `top-level`              |

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

- **DM:** le immagini e gli allegati file funzionano tramite le API file del bot Teams.
- **Canali/gruppi:** gli allegati risiedono nello storage M365 (SharePoint/OneDrive). Il payload del Webhook include solo uno stub HTML, non i byte effettivi del file. **Sono richiesti i permessi Graph API** per scaricare gli allegati dei canali.
- Per invii espliciti file-first, usa `action=upload-file` con `media` / `filePath` / `path`; il `message` opzionale diventa il testo/commento di accompagnamento e `filename` sovrascrive il nome caricato.

Senza permessi Graph, i messaggi di canale con immagini verranno ricevuti solo come testo (il contenuto dell'immagine non è accessibile al bot).
Per impostazione predefinita, OpenClaw scarica media solo dagli hostname Microsoft/Teams. Sovrascrivi con `channels.msteams.mediaAllowHosts` (usa `["*"]` per consentire qualsiasi host).
Gli header Authorization vengono allegati solo per gli host in `channels.msteams.mediaAuthAllowHosts` (predefinito sugli host Graph + Bot Framework). Mantieni questo elenco rigoroso (evita suffissi multi-tenant).

## Invio di file nelle chat di gruppo

I bot possono inviare file nei DM usando il flusso FileConsentCard (integrato). Tuttavia, **l'invio di file nelle chat di gruppo/canali** richiede configurazione aggiuntiva:

| Contesto                  | Come vengono inviati i file                           | Configurazione necessaria                                    |
| ------------------------ | -------------------------------------------- | ----------------------------------------------- |
| **DM**                  | FileConsentCard → l'utente accetta → il bot carica | Funziona subito                            |
| **Chat di gruppo/canali** | Caricamento su SharePoint → link di condivisione            | Richiede `sharePointSiteId` + permessi Graph |
| **Immagini (qualsiasi contesto)** | Inline codificato Base64                        | Funziona subito                            |

### Perché le chat di gruppo richiedono SharePoint

I bot non hanno un'unità OneDrive personale (l'endpoint Graph API `/me/drive` non funziona per le identità applicative). Per inviare file in chat di gruppo/canali, il bot carica su un **sito SharePoint** e crea un link di condivisione.

### Configurazione

1. **Aggiungi permessi Graph API** in Entra ID (Azure AD) → App Registration:
   - `Sites.ReadWrite.All` (Applicazione) - caricare file su SharePoint
   - `Chat.Read.All` (Applicazione) - opzionale, abilita link di condivisione per utente

2. **Concedi il consenso amministratore** per il tenant.

3. **Ottieni l'ID del tuo sito SharePoint:**

   ```bash
   # Via Graph Explorer or curl with a valid token:
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/{hostname}:/{site-path}"

   # Example: for a site at "contoso.sharepoint.com/sites/BotFiles"
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com:/sites/BotFiles"

   # Response includes: "id": "contoso.sharepoint.com,guid1,guid2"
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

| Permesso                              | Comportamento di condivisione                                          |
| --------------------------------------- | --------------------------------------------------------- |
| Solo `Sites.ReadWrite.All`              | Link di condivisione a livello di organizzazione (chiunque nell'org può accedere) |
| `Sites.ReadWrite.All` + `Chat.Read.All` | Link di condivisione per utente (solo i membri della chat possono accedere)      |

La condivisione per utente è più sicura perché solo i partecipanti alla chat possono accedere al file. Se manca il permesso `Chat.Read.All`, il bot ripiega sulla condivisione a livello di organizzazione.

### Comportamento di fallback

| Scenario                                          | Risultato                                             |
| ------------------------------------------------- | -------------------------------------------------- |
| Chat di gruppo + file + `sharePointSiteId` configurato | Carica su SharePoint, invia link di condivisione            |
| Chat di gruppo + file + nessun `sharePointSiteId`         | Tenta il caricamento su OneDrive (potrebbe fallire), invia solo testo |
| Chat personale + file                              | Flusso FileConsentCard (funziona senza SharePoint)    |
| Qualsiasi contesto + immagine                               | Inline codificato Base64 (funziona senza SharePoint)   |

### Posizione dei file archiviati

I file caricati vengono archiviati in una cartella `/OpenClawShared/` nella raccolta documenti predefinita del sito SharePoint configurato.

## Sondaggi (Adaptive Cards)

OpenClaw invia i sondaggi Teams come Adaptive Cards (non esiste una API nativa per i sondaggi Teams).

- CLI: `openclaw message poll --channel msteams --target conversation:<id> ...`
- I voti vengono registrati dal Gateway in `~/.openclaw/msteams-polls.json`.
- Il Gateway deve rimanere online per registrare i voti.
- I sondaggi non pubblicano ancora automaticamente riepiloghi dei risultati (ispeziona il file dello store se necessario).

## Schede di presentazione

Invia payload di presentazione semantici a utenti o conversazioni Teams usando lo strumento `message` o la CLI. OpenClaw li renderizza come Teams Adaptive Cards dal contratto di presentazione generico.

Il parametro `presentation` accetta blocchi semantici. Quando viene fornito `presentation`, il testo del messaggio è opzionale.

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

Per i dettagli sul formato dei target, vedi [Formati target](#target-formats) sotto.

## Formati target

I target MSTeams usano prefissi per distinguere tra utenti e conversazioni:

| Tipo di target         | Formato                           | Esempio                                             |
| ------------------- | -------------------------------- | --------------------------------------------------- |
| Utente (per ID)        | `user:<aad-object-id>`           | `user:40a1a0ed-4ff2-4164-a219-55518990c197`         |
| Utente (per nome)      | `user:<display-name>`            | `user:John Smith` (richiede Graph API)              |
| Gruppo/canale       | `conversation:<conversation-id>` | `conversation:19:abc123...@thread.tacv2`            |
| Gruppo/canale (raw) | `<conversation-id>`              | `19:abc123...@thread.tacv2` (se contiene `@thread`) |

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

**Esempi di strumenti dell’agente:**

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

<Note>
Senza il prefisso `user:`, i nomi usano per impostazione predefinita la risoluzione di gruppo o team. Usa sempre `user:` quando scegli come destinatarie persone tramite nome visualizzato.
</Note>

## Messaggistica proattiva

- I messaggi proattivi sono possibili solo **dopo** che un utente ha interagito, perché a quel punto memorizziamo i riferimenti alla conversazione.
- Consulta `/gateway/configuration` per `dmPolicy` e il controllo tramite allowlist.

## ID di team e canali (insidia comune)

Il parametro di query `groupId` negli URL di Teams **NON** è l’ID del team usato per la configurazione. Estrai invece gli ID dal percorso dell’URL:

**URL del team:**

```
https://teams.microsoft.com/l/team/19%3ABk4j...%40thread.tacv2/conversations?groupId=...
                                    └────────────────────────────┘
                                    ID conversazione del team (decodifica questo URL)
```

**URL del canale:**

```
https://teams.microsoft.com/l/channel/19%3A15bc...%40thread.tacv2/ChannelName?groupId=...
                                      └─────────────────────────┘
                                      ID del canale (decodifica questo URL)
```

**Per la configurazione:**

- Chiave del team = segmento del percorso dopo `/team/` (decodificato dall’URL, ad esempio `19:Bk4j...@thread.tacv2`; i tenant meno recenti possono mostrare `@thread.skype`, anch’esso valido)
- Chiave del canale = segmento del percorso dopo `/channel/` (decodificato dall’URL)
- **Ignora** il parametro di query `groupId` per il routing di OpenClaw. È l’ID del gruppo Microsoft Entra, non l’ID conversazione di Bot Framework usato nelle attività Teams in ingresso.

## Canali privati

I bot hanno un supporto limitato nei canali privati:

| Funzionalità                  | Canali standard | Canali privati                 |
| ---------------------------- | --------------- | ------------------------------ |
| Installazione del bot        | Sì              | Limitata                       |
| Messaggi in tempo reale (Webhook) | Sì          | Potrebbero non funzionare      |
| Autorizzazioni RSC           | Sì              | Possono comportarsi diversamente |
| @menzioni                    | Sì              | Se il bot è accessibile        |
| Cronologia Graph API         | Sì              | Sì (con autorizzazioni)        |

**Soluzioni alternative se i canali privati non funzionano:**

1. Usa i canali standard per le interazioni con il bot
2. Usa i DM: gli utenti possono sempre inviare messaggi direttamente al bot
3. Usa Graph API per l’accesso alla cronologia (richiede `ChannelMessage.Read.All`)

## Risoluzione dei problemi

### Problemi comuni

- **Le immagini non vengono mostrate nei canali:** autorizzazioni Graph o consenso dell’amministratore mancanti. Reinstalla l’app Teams e chiudi/riapri completamente Teams.
- **Nessuna risposta nel canale:** le menzioni sono obbligatorie per impostazione predefinita; imposta `channels.msteams.requireMention=false` o configura per team/canale.
- **Versione non corrispondente (Teams mostra ancora il vecchio manifesto):** rimuovi e aggiungi di nuovo l’app, quindi chiudi completamente Teams per aggiornare.
- **401 Unauthorized dal Webhook:** previsto durante i test manuali senza Azure JWT: significa che l’endpoint è raggiungibile ma l’autenticazione non è riuscita. Usa Azure Web Chat per testare correttamente.

### Errori di caricamento del manifesto

- **"Icon file cannot be empty":** il manifesto fa riferimento a file di icona da 0 byte. Crea icone PNG valide (32x32 per `outline.png`, 192x192 per `color.png`).
- **"webApplicationInfo.Id already in use":** l’app è ancora installata in un altro team/chat. Trovala e disinstallala prima, oppure attendi 5-10 minuti per la propagazione.
- **"Something went wrong" durante il caricamento:** carica invece tramite [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com), apri DevTools del browser (F12) → scheda Network e controlla il corpo della risposta per l’errore effettivo.
- **Sideload non riuscito:** prova "Upload an app to your org's app catalog" invece di "Upload a custom app": spesso aggira le restrizioni di sideload.

### Autorizzazioni RSC non funzionanti

1. Verifica che `webApplicationInfo.id` corrisponda esattamente all’App ID del tuo bot
2. Ricarica l’app e reinstallala nel team/chat
3. Controlla se l’amministratore della tua organizzazione ha bloccato le autorizzazioni RSC
4. Conferma di usare l’ambito corretto: `ChannelMessage.Read.Group` per i team, `ChatMessage.Read.Chat` per le chat di gruppo

## Riferimenti

- [Crea Azure Bot](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) - guida alla configurazione di Azure Bot
- [Teams Developer Portal](https://dev.teams.microsoft.com/apps) - crea/gestisci app Teams
- [Schema del manifesto dell’app Teams](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [Ricevere messaggi di canale con RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [Riferimento autorizzazioni RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [Gestione dei file nei bot Teams](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4) (canale/gruppo richiede Graph)
- [Messaggistica proattiva](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)
- [@microsoft/teams.cli](https://www.npmjs.com/package/@microsoft/teams.cli) - Teams CLI per la gestione dei bot

## Correlati

- [Panoramica dei canali](/it/channels) - tutti i canali supportati
- [Abbinamento](/it/channels/pairing) - autenticazione DM e flusso di abbinamento
- [Gruppi](/it/channels/groups) - comportamento delle chat di gruppo e controllo delle menzioni
- [Routing dei canali](/it/channels/channel-routing) - routing delle sessioni per i messaggi
- [Sicurezza](/it/gateway/security) - modello di accesso e rafforzamento
