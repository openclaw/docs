---
read_when:
    - Lavoro sulle funzionalità del canale Microsoft Teams
summary: Stato del supporto, funzionalità e configurazione del bot Microsoft Teams
title: Microsoft Teams
x-i18n:
    generated_at: "2026-06-27T17:12:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cad5dc92b3a70e85412cbf34c926d7211dce7534c31387744e6f085bcfe23f08
    source_path: channels/msteams.md
    workflow: 16
---

Stato: sono supportati testo + allegati DM; l'invio di file in canali/gruppi richiede `sharePointSiteId` + autorizzazioni Graph (vedi [Invio di file nelle chat di gruppo](#sending-files-in-group-chats)). I sondaggi vengono inviati tramite Adaptive Cards. Le azioni dei messaggi espongono `upload-file` esplicito per invii incentrati sui file.

## Plugin incluso

Microsoft Teams viene distribuito come Plugin incluso nelle versioni correnti di OpenClaw, quindi nella normale build pacchettizzata non è richiesta alcuna installazione separata.

Se usi una build precedente o un'installazione personalizzata che esclude Teams incluso, installa direttamente il pacchetto npm:

```bash
openclaw plugins install @openclaw/msteams
```

Usa il pacchetto senza versione per seguire il tag della release ufficiale corrente. Fissa una versione esatta solo quando hai bisogno di un'installazione riproducibile.

Checkout locale (quando esegui da un repo git):

```bash
openclaw plugins install ./path/to/local/msteams-plugin
```

Dettagli: [Plugin](/it/tools/plugin)

## Configurazione rapida

La [`@microsoft/teams.cli`](https://www.npmjs.com/package/@microsoft/teams.cli) gestisce registrazione del bot, creazione del manifesto e generazione delle credenziali in un unico comando.

**1. Installa e accedi**

```bash
npm install -g @microsoft/teams.cli@preview
teams login
teams status   # verify you're logged in and see your tenant info
```

<Note>
La Teams CLI è attualmente in anteprima. Comandi e flag possono cambiare tra una release e l'altra.
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
`--allow-anonymous` è richiesto perché Teams non può autenticarsi con devtunnels. Ogni richiesta bot in ingresso viene comunque convalidata automaticamente dal Teams SDK.
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
- Compila e carica un manifesto dell'app Teams (con icone)
- Registra il bot (gestito da Teams per impostazione predefinita - nessuna sottoscrizione Azure necessaria)

L'output mostrerà `CLIENT_ID`, `CLIENT_SECRET`, `TENANT_ID` e un **Teams App ID**: annotali per i passaggi successivi. Offre anche di installare l'app direttamente in Teams.

**4. Configura OpenClaw** usando le credenziali dall'output:

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

Oppure usa direttamente le variabili di ambiente: `MSTEAMS_APP_ID`, `MSTEAMS_APP_PASSWORD`, `MSTEAMS_TENANT_ID`.

**5. Installa l'app in Teams**

`teams app create` ti chiederà di installare l'app: seleziona "Installa in Teams". Se hai saltato questo passaggio, puoi ottenere il link in seguito:

```bash
teams app get <teamsAppId> --install-link
```

**6. Verifica che tutto funzioni**

```bash
teams app doctor <teamsAppId>
```

Questo esegue la diagnostica su registrazione del bot, configurazione dell'app AAD, validità del manifesto e configurazione SSO.

Per distribuzioni in produzione, valuta l'uso dell'[autenticazione federata](/it/channels/msteams#federated-authentication-certificate-plus-managed-identity) (certificato o managed identity) invece dei client secret.

<Note>
Le chat di gruppo sono bloccate per impostazione predefinita (`channels.msteams.groupPolicy: "allowlist"`). Per consentire risposte di gruppo, imposta `channels.msteams.groupAllowFrom`, oppure usa `groupPolicy: "open"` per consentire qualsiasi membro (con gate tramite menzione).
</Note>

## Obiettivi

- Parlare con OpenClaw tramite DM, chat di gruppo o canali Teams.
- Mantenere il routing deterministico: le risposte tornano sempre al canale da cui sono arrivate.
- Usare per impostazione predefinita un comportamento sicuro del canale (menzioni richieste salvo configurazione diversa).

## Scritture di configurazione

Per impostazione predefinita, Microsoft Teams può scrivere aggiornamenti di configurazione attivati da `/config set|unset` (richiede `commands.config: true`).

Disabilita con:

```json5
{
  channels: { msteams: { configWrites: false } },
}
```

## Controllo accessi (DM + gruppi)

**Accesso DM**

- Predefinito: `channels.msteams.dmPolicy = "pairing"`. I mittenti sconosciuti vengono ignorati finché non sono approvati.
- `channels.msteams.allowFrom` dovrebbe usare ID oggetto AAD stabili o gruppi statici di accesso mittenti come `accessGroup:core-team`.
- Non fare affidamento sulla corrispondenza UPN/nome visualizzato per le allowlist: possono cambiare. OpenClaw disabilita per impostazione predefinita la corrispondenza diretta dei nomi; abilitala esplicitamente con `channels.msteams.dangerouslyAllowNameMatching: true`.
- La procedura guidata può risolvere i nomi in ID tramite Microsoft Graph quando le credenziali lo consentono.

**Accesso gruppo**

- Predefinito: `channels.msteams.groupPolicy = "allowlist"` (bloccato salvo aggiunta di `groupAllowFrom`). Usa `channels.defaults.groupPolicy` per sovrascrivere il valore predefinito quando non è impostato.
- `channels.msteams.groupAllowFrom` controlla quali mittenti o gruppi statici di accesso mittenti possono attivare nelle chat/canali di gruppo (ricade su `channels.msteams.allowFrom`).
- Imposta `groupPolicy: "open"` per consentire qualsiasi membro (ancora con gate tramite menzione per impostazione predefinita).
- Per consentire **nessun canale**, imposta `channels.msteams.groupPolicy: "disabled"`.

Esempio:

```json5
{
  channels: {
    msteams: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["00000000-0000-0000-0000-000000000000", "accessGroup:core-team"],
    },
  },
}
```

**Allowlist di Teams + canali**

- Limita l'ambito delle risposte di gruppo/canale elencando team e canali sotto `channels.msteams.teams`.
- Le chiavi dovrebbero usare ID conversazione Teams stabili dai link Teams, non nomi visualizzati modificabili.
- Quando `groupPolicy="allowlist"` e una allowlist di team è presente, vengono accettati solo i team/canali elencati (con gate tramite menzione).
- La procedura guidata di configurazione accetta voci `Team/Channel` e le memorizza per te.
- All'avvio, OpenClaw risolve i nomi allowlist di team/canali e utenti in ID (quando le autorizzazioni Graph lo consentono)
  e registra la mappatura; i nomi team/canale non risolti vengono mantenuti come digitati ma ignorati per il routing per impostazione predefinita, salvo abilitazione di `channels.msteams.dangerouslyAllowNameMatching: true`.

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

1. Assicurati che il Plugin Microsoft Teams sia disponibile (incluso nelle release correnti).
2. Crea un **Azure Bot** (App ID + secret + tenant ID).
3. Compila un **pacchetto app Teams** che fa riferimento al bot e include le autorizzazioni RSC di seguito.
4. Carica/installa l'app Teams in un team (o nell'ambito personale per i DM).
5. Configura `msteams` in `~/.openclaw/openclaw.json` (o env vars) e avvia il Gateway.
6. Il Gateway ascolta il traffico Webhook Bot Framework su `/api/messages` per impostazione predefinita.

### Passaggio 1: crea Azure Bot

1. Vai a [Crea Azure Bot](https://portal.azure.com/#create/Microsoft.AzureBot)
2. Compila la scheda **Informazioni di base**:

   | Campo              | Valore                                                    |
   | ------------------ | -------------------------------------------------------- |
   | **Handle bot**     | Il nome del tuo bot, ad es. `openclaw-msteams` (deve essere univoco) |
   | **Sottoscrizione** | Seleziona la tua sottoscrizione Azure                    |
   | **Gruppo di risorse** | Creane uno nuovo o usane uno esistente                |
   | **Livello prezzi** | **Free** per sviluppo/test                               |
   | **Tipo di app**    | **Single Tenant** (consigliato - vedi nota sotto)        |
   | **Tipo di creazione** | **Crea nuovo Microsoft App ID**                       |

<Warning>
La creazione di nuovi bot multi-tenant è stata deprecata dopo il 2025-07-31. Usa **Single Tenant** per i nuovi bot.
</Warning>

3. Fai clic su **Review + create** → **Create** (attendi circa 1-2 minuti)

### Passaggio 2: ottieni le credenziali

1. Vai alla tua risorsa Azure Bot → **Configuration**
2. Copia **Microsoft App ID** → questo è il tuo `appId`
3. Fai clic su **Manage Password** → vai alla registrazione dell'app
4. In **Certificates & secrets** → **New client secret** → copia il **Value** → questo è il tuo `appPassword`
5. Vai a **Overview** → copia **Directory (tenant) ID** → questo è il tuo `tenantId`

### Passaggio 3: configura l'endpoint di messaggistica

1. In Azure Bot → **Configuration**
2. Imposta **Messaging endpoint** sull'URL del tuo Webhook:
   - Produzione: `https://your-domain.com/api/messages`
   - Sviluppo locale: usa un tunnel (vedi [Sviluppo locale](#local-development-tunneling) sotto)

### Passaggio 4: abilita il canale Teams

1. In Azure Bot → **Channels**
2. Fai clic su **Microsoft Teams** → Configure → Save
3. Accetta i Termini di servizio

### Passaggio 5: compila il manifesto dell'app Teams

- Includi una voce `bot` con `botId = <App ID>`.
- Ambiti: `personal`, `team`, `groupChat`.
- `supportsFiles: true` (richiesto per la gestione dei file nell'ambito personale).
- Aggiungi autorizzazioni RSC (vedi [Autorizzazioni RSC](#current-teams-rsc-permissions-manifest)).
- Crea icone: `outline.png` (32x32) e `color.png` (192x192).
- Comprimi insieme tutti e tre i file: `manifest.json`, `outline.png`, `color.png`.

### Passaggio 6: configura OpenClaw

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

Variabili di ambiente: `MSTEAMS_APP_ID`, `MSTEAMS_APP_PASSWORD`, `MSTEAMS_TENANT_ID`.

### Passaggio 7: esegui il Gateway

Il canale Teams si avvia automaticamente quando il Plugin è disponibile e la configurazione `msteams` esiste con credenziali.

</details>

## Autenticazione federata (certificato più managed identity)

> Aggiunta in 2026.4.11

Per distribuzioni in produzione, OpenClaw supporta l'**autenticazione federata** come alternativa più sicura ai client secret. Sono disponibili due metodi:

### Opzione A: autenticazione basata su certificato

Usa un certificato PEM registrato con la registrazione della tua app Entra ID.

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

**Env vars:**

- `MSTEAMS_AUTH_TYPE=federated`
- `MSTEAMS_CERTIFICATE_PATH=/path/to/cert.pem`

### Opzione B: Azure Managed Identity

Usa Azure Managed Identity per l'autenticazione senza password. È ideale per distribuzioni su infrastruttura Azure (AKS, App Service, VM Azure) dove è disponibile una managed identity.

**Come funziona:**

1. Il pod/VM del bot ha una managed identity (assegnata dal sistema o assegnata dall'utente).
2. Una **credenziale di identità federata** collega la managed identity alla registrazione dell'app Entra ID.
3. A runtime, OpenClaw usa `@azure/identity` per acquisire token dall'endpoint Azure IMDS (`169.254.169.254`).
4. Il token viene passato al Teams SDK per l'autenticazione del bot.

**Prerequisiti:**

- Infrastruttura Azure con managed identity abilitata (AKS workload identity, App Service, VM)
- Credenziale di identità federata creata sulla registrazione dell'app Entra ID
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

**Configurazione (identità gestita assegnata dall'utente):**

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

Per le distribuzioni AKS che usano Workload Identity:

1. **Abilita Workload Identity** nel tuo cluster AKS.
2. **Crea una credenziale di identità federata** nella registrazione dell'app Entra ID:

   ```bash
   az ad app federated-credential create --id <APP_OBJECT_ID> --parameters '{
     "name": "my-bot-workload-identity",
     "issuer": "<AKS_OIDC_ISSUER_URL>",
     "subject": "system:serviceaccount:<NAMESPACE>:<SERVICE_ACCOUNT>",
     "audiences": ["api://AzureADTokenExchange"]
   }'
   ```

3. **Annota l'account di servizio Kubernetes** con l'ID client dell'app:

   ```yaml
   apiVersion: v1
   kind: ServiceAccount
   metadata:
     name: my-bot-sa
     annotations:
       azure.workload.identity/client-id: "<APP_CLIENT_ID>"
   ```

4. **Etichetta il pod** per l'iniezione di Workload Identity:

   ```yaml
   metadata:
     labels:
       azure.workload.identity/use: "true"
   ```

5. **Assicurati che l'accesso di rete** a IMDS (`169.254.169.254`) sia disponibile: se usi NetworkPolicy, aggiungi una regola di uscita che consenta il traffico verso `169.254.169.254/32` sulla porta 80.

### Confronto dei tipi di autenticazione

| Metodo               | Configurazione                                 | Vantaggi                           | Svantaggi                                      |
| -------------------- | ---------------------------------------------- | ---------------------------------- | ---------------------------------------------- |
| **Segreto client**   | `appPassword`                                  | Configurazione semplice            | Rotazione del segreto richiesta, meno sicuro   |
| **Certificato**      | `authType: "federated"` + `certificatePath`    | Nessun segreto condiviso sulla rete | Sovraccarico di gestione dei certificati       |
| **Identità gestita** | `authType: "federated"` + `useManagedIdentity` | Senza password, nessun segreto da gestire | Infrastruttura Azure richiesta             |

**Comportamento predefinito:** Quando `authType` non è impostato, OpenClaw usa per impostazione predefinita l'autenticazione con segreto client. Le configurazioni esistenti continuano a funzionare senza modifiche.

## Sviluppo locale (tunneling)

Teams non può raggiungere `localhost`. Usa un tunnel di sviluppo persistente in modo che il tuo URL resti lo stesso tra le sessioni:

```bash
# Configurazione iniziale:
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# Ogni sessione di sviluppo:
devtunnel host my-openclaw-bot
```

Alternative: `ngrok http 3978` o `tailscale funnel 3978` (gli URL possono cambiare a ogni sessione).

Se l'URL del tunnel cambia, aggiorna l'endpoint:

```bash
teams app update <teamsAppId> --endpoint "https://<new-url>/api/messages"
```

## Test del Bot

**Esegui la diagnostica:**

```bash
teams app doctor <teamsAppId>
```

Controlla in un unico passaggio la registrazione del bot, l'app AAD, il manifest e la configurazione SSO.

**Invia un messaggio di test:**

1. Installa l'app Teams (usa il link di installazione da `teams app get <id> --install-link`)
2. Trova il bot in Teams e invia un DM
3. Controlla i log del Gateway per l'attività in ingresso

## Variabili d'ambiente

Tutte le chiavi di configurazione possono invece essere impostate tramite variabili d'ambiente:

- `MSTEAMS_APP_ID`
- `MSTEAMS_APP_PASSWORD`
- `MSTEAMS_TENANT_ID`
- `MSTEAMS_AUTH_TYPE` (facoltativo: `"secret"` o `"federated"`)
- `MSTEAMS_CERTIFICATE_PATH` (federated + certificato)
- `MSTEAMS_CERTIFICATE_THUMBPRINT` (facoltativo, non richiesto per l'autenticazione)
- `MSTEAMS_USE_MANAGED_IDENTITY` (federated + managed identity)
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID` (solo MI assegnata dall'utente)

## Azione informazioni membro

OpenClaw espone un'azione `member-info` basata su Graph per Microsoft Teams, così agenti e automazioni possono risolvere i dettagli dei membri del canale (nome visualizzato, email, ruolo) direttamente da Microsoft Graph.

Requisiti:

- Autorizzazione RSC `Member.Read.Group` (già nel manifest consigliato)
- Per ricerche tra team diversi: autorizzazione Graph Application `User.Read.All` con consenso dell'amministratore

L'azione è controllata da `channels.msteams.actions.memberInfo` (predefinito: abilitata quando sono disponibili le credenziali Graph).

## Contesto della cronologia

- `channels.msteams.historyLimit` controlla quanti messaggi recenti di canale/gruppo vengono inclusi nel prompt.
- Ripiega su `messages.groupChat.historyLimit`. Imposta `0` per disabilitare (predefinito 50).
- La cronologia dei thread recuperata viene filtrata in base agli elenchi di mittenti consentiti (`allowFrom` / `groupAllowFrom`), quindi l'inizializzazione del contesto del thread include solo i messaggi dei mittenti consentiti.
- Il contesto degli allegati citati (`ReplyTo*` derivato dall'HTML delle risposte di Teams) viene attualmente passato così come ricevuto.
- In altre parole, gli elenchi di consentiti regolano chi può attivare l'agente; oggi vengono filtrati solo specifici percorsi di contesto supplementare.
- La cronologia dei DM può essere limitata con `channels.msteams.dmHistoryLimit` (turni utente). Override per utente: `channels.msteams.dms["<user_id>"].historyLimit`.

## Autorizzazioni RSC Teams correnti (manifest)

Queste sono le **autorizzazioni resourceSpecific esistenti** nel manifest della nostra app Teams. Si applicano solo all'interno del team/chat in cui l'app è installata.

**Per i canali (ambito team):**

- `ChannelMessage.Read.Group` (Application) - ricevere tutti i messaggi del canale senza @menzione
- `ChannelMessage.Send.Group` (Application)
- `Member.Read.Group` (Application)
- `Owner.Read.Group` (Application)
- `ChannelSettings.Read.Group` (Application)
- `TeamMember.Read.Group` (Application)
- `TeamSettings.Read.Group` (Application)

**Per le chat di gruppo:**

- `ChatMessage.Read.Chat` (Application) - ricevere tutti i messaggi della chat di gruppo senza @menzione

Per aggiungere autorizzazioni RSC tramite Teams CLI:

```bash
teams app rsc add <teamsAppId> ChannelMessage.Read.Group --type Application
```

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

- `bots[].botId` **deve** corrispondere all'Azure Bot App ID.
- `webApplicationInfo.id` **deve** corrispondere all'Azure Bot App ID.
- `bots[].scopes` deve includere le superfici che prevedi di usare (`personal`, `team`, `groupChat`).
- `bots[].supportsFiles: true` è richiesto per la gestione dei file nell'ambito personale.
- `authorization.permissions.resourceSpecific` deve includere lettura/invio dei canali se vuoi traffico dei canali.

### Aggiornare un'app esistente

Per aggiornare un'app Teams già installata (ad esempio, per aggiungere autorizzazioni RSC):

```bash
# Download, edit, and re-upload the manifest
teams app manifest download <teamsAppId> manifest.json
# Edit manifest.json locally...
teams app manifest upload manifest.json <teamsAppId>
# Version is auto-bumped if content changed
```

Dopo l'aggiornamento, reinstalla l'app in ogni team affinché le nuove autorizzazioni abbiano effetto e **chiudi completamente e riavvia Teams** (non limitarti a chiudere la finestra) per cancellare i metadati dell'app memorizzati nella cache.

<details>
<summary>Aggiornamento manuale del manifest (senza CLI)</summary>

1. Aggiorna il tuo `manifest.json` con le nuove impostazioni
2. **Incrementa il campo `version`** (ad esempio, `1.0.0` → `1.1.0`)
3. **Ricrea lo zip** del manifest con le icone (`manifest.json`, `outline.png`, `color.png`)
4. Carica il nuovo zip:
   - **Teams Admin Center:** app Teams → Gestisci app → trova la tua app → Carica nuova versione
   - **Sideload:** In Teams → App → Gestisci le tue app → Carica un'app personalizzata

</details>

## Funzionalità: solo RSC vs Graph

### Con **solo Teams RSC** (app installata, nessuna autorizzazione Graph API)

Funziona:

- Lettura del contenuto **testuale** dei messaggi del canale.
- Invio di contenuto **testuale** nei messaggi del canale.
- Ricezione di allegati file **personali (DM)**.

NON funziona:

- **Contenuti di immagini o file** di canali/gruppi (il payload include solo uno stub HTML).
- Download di allegati archiviati in SharePoint/OneDrive.
- Lettura della cronologia dei messaggi (oltre l'evento Webhook live).

### Con **Teams RSC + autorizzazioni Microsoft Graph Application**

Aggiunge:

- Download dei contenuti ospitati (immagini incollate nei messaggi).
- Download di allegati file archiviati in SharePoint/OneDrive.
- Lettura della cronologia dei messaggi di canali/chat tramite Graph.

### RSC vs Graph API

| Funzionalità              | Autorizzazioni RSC   | Graph API                                      |
| ------------------------- | -------------------- | ---------------------------------------------- |
| **Messaggi in tempo reale** | Sì (tramite Webhook) | No (solo polling)                              |
| **Messaggi storici**      | No                   | Sì (può interrogare la cronologia)             |
| **Complessità di configurazione** | Solo manifest dell'app | Richiede consenso dell'amministratore + flusso di token |
| **Funziona offline**      | No (deve essere in esecuzione) | Sì (interrogazione in qualsiasi momento)       |

**In sintesi:** RSC serve per l'ascolto in tempo reale; Graph API serve per l'accesso storico. Per recuperare i messaggi persi mentre eri offline, ti serve Graph API con `ChannelMessage.Read.All` (richiede consenso dell'amministratore).

## Media e cronologia abilitati da Graph (richiesti per i canali)

Se ti servono immagini/file nei **canali** o vuoi recuperare la **cronologia dei messaggi**, devi abilitare le autorizzazioni Microsoft Graph e concedere il consenso dell'amministratore.

1. In Entra ID (Azure AD) **Registrazione app**, aggiungi le **autorizzazioni Application** Microsoft Graph:
   - `ChannelMessage.Read.All` (allegati del canale + cronologia)
   - `Chat.Read.All` o `ChatMessage.Read.All` (chat di gruppo)
2. **Concedi il consenso dell'amministratore** per il tenant.
3. Incrementa la **versione del manifest** dell'app Teams, ricaricalo e **reinstalla l'app in Teams**.
4. **Chiudi completamente e riavvia Teams** per cancellare i metadati dell'app memorizzati nella cache.

**Autorizzazione aggiuntiva per le menzioni utente:** Le @menzioni degli utenti funzionano subito per gli utenti nella conversazione. Tuttavia, se vuoi cercare e menzionare dinamicamente utenti che **non sono nella conversazione corrente**, aggiungi l'autorizzazione `User.Read.All` (Application) e concedi il consenso dell'amministratore.

## Limitazioni note

### Timeout dei Webhook

Teams recapita i messaggi tramite Webhook HTTP. Se l'elaborazione richiede troppo tempo (ad esempio, risposte LLM lente), potresti vedere:

- Timeout del Gateway
- Teams che riprova il messaggio (causando duplicati)
- Risposte perse

OpenClaw gestisce questo restituendo rapidamente una risposta e inviando risposte in modo proattivo, ma risposte molto lente possono comunque causare problemi.

### Supporto per il cloud di Teams e l'URL del servizio

Questo percorso Teams basato su SDK è validato dal vivo per il cloud pubblico Microsoft Teams.

Le risposte in ingresso usano il contesto del turno Teams SDK in arrivo. Le operazioni proattive fuori contesto - invii, modifiche, eliminazioni, schede, sondaggi, messaggi di consenso ai file e risposte accodate di lunga durata - usano il `serviceUrl` del riferimento alla conversazione archiviato. Il cloud pubblico usa per impostazione predefinita l'ambiente cloud pubblico di Teams SDK e consente riferimenti archiviati sull'host pubblico Teams Connector: `https://smba.trafficmanager.net/`.

Il cloud pubblico è l'impostazione predefinita. Non è necessario impostare `channels.msteams.cloud` o `channels.msteams.serviceUrl` per i bot normali nel cloud pubblico.

Per i cloud Teams non pubblici, imposta `cloud` e il limite proattivo corrispondente quando Microsoft ne pubblica uno:

- `channels.msteams.cloud` seleziona il preset cloud di Teams SDK per autenticazione, validazione JWT, servizi token e ambito Graph.
- `channels.msteams.serviceUrl` seleziona il limite dell'endpoint Bot Connector usato per validare i riferimenti alla conversazione archiviati prima di invii, modifiche, eliminazioni, schede, sondaggi, messaggi di consenso ai file e risposte accodate di lunga durata proattivi. È obbligatorio per i cloud SDK USGov e DoD. Per China/21Vianet, OpenClaw usa il preset SDK `China` e accetta URL di servizio archiviati/configurati solo sugli host del canale Azure China Bot Framework.

Microsoft pubblica gli endpoint globali proattivi di Bot Connector nella sezione [Crea la conversazione](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages?tabs=dotnet#create-the-conversation) della documentazione sui messaggi proattivi di Teams. Usa il `serviceUrl` dell'attività in ingresso quando disponibile; se hai bisogno di un endpoint proattivo globale, usa la tabella di Microsoft.

| Ambiente Teams | Configurazione OpenClaw                                      | `serviceUrl` proattivo                            |
| ----------------- | ----------------------------------------------------------- | -------------------------------------------------- |
| Pubblico            | nessuna configurazione cloud/serviceUrl necessaria          | `https://smba.trafficmanager.net/teams`            |
| GCC               | imposta `serviceUrl`; non esiste un preset cloud Teams SDK separato | `https://smba.infra.gcc.teams.microsoft.com/teams` |
| GCC High          | `cloud: "USGov"` + `serviceUrl`                             | `https://smba.infra.gov.teams.microsoft.us/teams`  |
| DoD               | `cloud: "USGovDoD"` + `serviceUrl`                          | `https://smba.infra.dod.teams.microsoft.us/teams`  |
| China/21Vianet    | `cloud: "China"`                                            | usa il `serviceUrl` dell'attività in ingresso      |

Esempio per GCC, dove Microsoft documenta un URL di servizio proattivo separato ma Teams SDK non espone un preset cloud GCC separato:

```json
{
  "channels": {
    "msteams": {
      "serviceUrl": "https://smba.infra.gcc.teams.microsoft.com/teams"
    }
  }
}
```

Esempio per GCC High:

```json
{
  "channels": {
    "msteams": {
      "cloud": "USGov",
      "serviceUrl": "https://smba.infra.gov.teams.microsoft.us/teams"
    }
  }
}
```

`channels.msteams.serviceUrl` è limitato agli host Microsoft Teams Bot Connector supportati. Quando è configurato un URL di servizio, OpenClaw verifica che il `serviceUrl` della conversazione archiviata usi lo stesso host prima dell'esecuzione di invii, modifiche, eliminazioni, schede, sondaggi o risposte accodate di lunga durata proattivi. Con la configurazione predefinita del cloud pubblico, OpenClaw fallisce in modo chiuso se una conversazione archiviata punta fuori dall'host pubblico Teams Connector. Ricevi un nuovo messaggio dalla conversazione dopo aver modificato le impostazioni di cloud/URL del servizio, in modo che il riferimento alla conversazione archiviato sia aggiornato.

China/21Vianet non ha un URL globale proattivo `smba` separato nella tabella degli endpoint proattivi Teams di Microsoft. Configura `cloud: "China"` affinché Teams SDK usi gli endpoint di autenticazione, token e JWT di Azure China. Gli invii proattivi richiedono quindi un riferimento alla conversazione archiviato da un'attività Teams China in ingresso, oppure un URL di servizio configurato esplicitamente, sul limite del canale Azure China Bot Framework (`*.botframework.azure.cn`). Gli helper Teams basati su Graph sono attualmente disabilitati per `cloud: "China"` finché OpenClaw non instraderà le richieste Graph tramite l'endpoint Azure China Graph.

### Formattazione

Il markdown Teams è più limitato rispetto a Slack o Discord:

- La formattazione di base funziona: **grassetto**, _corsivo_, `code`, link
- Il markdown complesso (tabelle, elenchi annidati) potrebbe non essere renderizzato correttamente
- Le Adaptive Cards sono supportate per sondaggi e invii di presentazione semantica (vedi sotto)

## Configurazione

Impostazioni principali (vedi `/gateway/configuration` per i pattern condivisi dei canali):

- `channels.msteams.enabled`: abilita/disabilita il canale.
- `channels.msteams.appId`, `channels.msteams.appPassword`, `channels.msteams.tenantId`: credenziali del bot.
- `channels.msteams.cloud`: ambiente cloud Teams SDK (`Public`, `USGov`, `USGovDoD` o `China`; predefinito `Public`). Impostalo con `serviceUrl` per i cloud SDK USGov/DoD; China usa il preset SDK e i riferimenti alla conversazione Azure China Bot Framework archiviati, con gli helper basati su Graph disabilitati finché non sarà implementato l'instradamento Azure China Graph.
- `channels.msteams.serviceUrl`: limite dell'URL di servizio Bot Connector per le operazioni proattive SDK. Il cloud pubblico usa il valore predefinito SDK; impostalo per GCC (`https://smba.infra.gcc.teams.microsoft.com/teams`), GCC High o DoD. China accetta host del canale Azure China Bot Framework quando il riferimento alla conversazione archiviato proviene da Teams gestito da 21Vianet.
- `channels.msteams.webhook.port` (predefinito `3978`)
- `channels.msteams.webhook.path` (predefinito `/api/messages`)
- `channels.msteams.dmPolicy`: `pairing | allowlist | open | disabled` (predefinito: pairing)
- `channels.msteams.allowFrom`: allowlist DM (ID oggetto AAD consigliati). La procedura guidata risolve i nomi in ID durante la configurazione quando è disponibile l'accesso a Graph.
- `channels.msteams.dangerouslyAllowNameMatching`: interruttore di emergenza per riabilitare la corrispondenza di UPN/nome visualizzato mutabili e l'instradamento diretto per nome di team/canale.
- `channels.msteams.textChunkLimit`: dimensione dei blocchi di testo in uscita.
- `channels.msteams.chunkMode`: `length` (predefinito) o `newline` per dividere su righe vuote (limiti di paragrafo) prima del chunking per lunghezza.
- `channels.msteams.mediaAllowHosts`: allowlist per gli host degli allegati in ingresso (per impostazione predefinita domini Microsoft/Teams).
- `channels.msteams.mediaAuthAllowHosts`: allowlist per allegare intestazioni Authorization ai tentativi successivi sui media (per impostazione predefinita host Graph + Bot Framework).
- `channels.msteams.requireMention`: richiede @mention in canali/gruppi (predefinito true).
- `channels.msteams.replyStyle`: `thread | top-level` (vedi [Stile di risposta](#reply-style-threads-vs-posts)).
- `channels.msteams.teams.<teamId>.replyStyle`: override per team.
- `channels.msteams.teams.<teamId>.requireMention`: override per team.
- `channels.msteams.teams.<teamId>.tools`: override predefiniti per team dei criteri degli strumenti (`allow`/`deny`/`alsoAllow`) usati quando manca un override del canale.
- `channels.msteams.teams.<teamId>.toolsBySender`: override predefiniti per team e per mittente dei criteri degli strumenti (carattere jolly `"*"` supportato).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`: override per canale.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.requireMention`: override per canale.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.tools`: override per canale dei criteri degli strumenti (`allow`/`deny`/`alsoAllow`).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.toolsBySender`: override per canale e per mittente dei criteri degli strumenti (carattere jolly `"*"` supportato).
- Le chiavi `toolsBySender` devono usare prefissi espliciti:
  `channel:`, `id:`, `e164:`, `username:`, `name:` (le chiavi legacy senza prefisso continuano a mappare solo a `id:`).
- `channels.msteams.actions.memberInfo`: abilita o disabilita l'azione di informazioni sul membro basata su Graph (predefinito: abilitata quando sono disponibili le credenziali Graph).
- `channels.msteams.authType`: tipo di autenticazione - `"secret"` (predefinito) o `"federated"`.
- `channels.msteams.certificatePath`: percorso del file di certificato PEM (autenticazione federata + certificato).
- `channels.msteams.certificateThumbprint`: identificazione personale del certificato (facoltativa, non obbligatoria per l'autenticazione).
- `channels.msteams.useManagedIdentity`: abilita l'autenticazione con identità gestita (modalità federata).
- `channels.msteams.managedIdentityClientId`: ID client per l'identità gestita assegnata dall'utente.
- `channels.msteams.sharePointSiteId`: ID del sito SharePoint per i caricamenti di file in chat di gruppo/canali (vedi [Inviare file nelle chat di gruppo](#sending-files-in-group-chats)).

## Instradamento e sessioni

- Le chiavi di sessione seguono il formato agente standard (vedi [/concepts/session](/it/concepts/session)):
  - I messaggi diretti condividono la sessione principale (`agent:<agentId>:<mainKey>`).
  - I messaggi di canale/gruppo usano l'ID conversazione:
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## Stile di risposta: thread vs post

Teams ha introdotto di recente due stili di UI dei canali sullo stesso modello dati sottostante:

| Stile                    | Descrizione                                               | `replyStyle` consigliato |
| ------------------------ | --------------------------------------------------------- | ------------------------ |
| **Post** (classico)      | I messaggi appaiono come schede con risposte in thread sotto | `thread` (predefinito)       |
| **Thread** (simile a Slack) | I messaggi scorrono linearmente, più simili a Slack        | `top-level`              |

**Il problema:** L'API Teams non espone quale stile di UI usa un canale. Se usi il `replyStyle` sbagliato:

- `thread` in un canale in stile Thread → le risposte appaiono annidate in modo poco naturale
- `top-level` in un canale in stile Post → le risposte appaiono come post separati di primo livello invece che nel thread

**Soluzione:** Configura `replyStyle` per canale in base a come è configurato il canale:

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

### Precedenza di risoluzione

Quando il bot invia una risposta in un canale, `replyStyle` viene risolto dall'override più specifico fino al valore predefinito. Vince il primo valore non `undefined`:

1. **Per canale** — `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`
2. **Per team** — `channels.msteams.teams.<teamId>.replyStyle`
3. **Globale** — `channels.msteams.replyStyle`
4. **Predefinito implicito** — derivato da `requireMention`:
   - `requireMention: true` → `thread`
   - `requireMention: false` → `top-level`

Se imposti `requireMention: false` globalmente senza un `replyStyle` esplicito, le menzioni nei canali in stile Post emergeranno come post di primo livello anche quando l'ingresso era una risposta in thread. Fissa `replyStyle: "thread"` a livello globale, di team o di canale per evitare sorprese.

### Conservazione del contesto del thread

Quando `replyStyle: "thread"` è attivo e il bot è stato @menzionato dall'interno di un thread di canale, OpenClaw riassocia la radice del thread originale al riferimento alla conversazione in uscita (`19:…@thread.tacv2;messageid=<root>`) così la risposta arriva nello stesso thread. Questo vale sia per gli invii live (nel turno) sia per gli invii proattivi effettuati dopo la scadenza del contesto di turno Bot Framework (ad esempio agenti di lunga durata, risposte accodate a chiamate di strumenti tramite `mcp__openclaw__message`).

La radice del thread viene presa dal `threadId` archiviato nel riferimento alla conversazione. I riferimenti archiviati più vecchi, precedenti a `threadId`, ripiegano su `activityId` (qualsiasi attività in ingresso abbia inizializzato per ultima la conversazione), quindi le distribuzioni esistenti continuano a funzionare senza una nuova inizializzazione.

Quando `replyStyle: "top-level"` è attivo, i messaggi in ingresso dai thread dei canali ricevono intenzionalmente risposta come nuovi post di primo livello: non viene aggiunto alcun suffisso di thread. Questo è il comportamento corretto per i canali in stile Threads; se vedi post di primo livello dove ti aspettavi risposte nei thread, il tuo `replyStyle` è configurato in modo errato per quel canale.

## Allegati e immagini

**Limitazioni attuali:**

- **DM:** le immagini e gli allegati file funzionano tramite le API file del bot Teams.
- **Canali/gruppi:** gli allegati risiedono nello storage M365 (SharePoint/OneDrive). Il payload del Webhook include solo uno stub HTML, non i byte effettivi del file. **Sono richieste autorizzazioni Graph API** per scaricare gli allegati dei canali.
- Per invii espliciti con file come contenuto principale, usa `action=upload-file` con `media` / `filePath` / `path`; il `message` facoltativo diventa il testo/commento di accompagnamento e `filename` sovrascrive il nome caricato.

Senza autorizzazioni Graph, i messaggi dei canali con immagini saranno ricevuti solo come testo (il contenuto dell'immagine non è accessibile al bot).
Per impostazione predefinita, OpenClaw scarica media solo dagli hostname Microsoft/Teams. Sovrascrivi con `channels.msteams.mediaAllowHosts` (usa `["*"]` per consentire qualsiasi host).
Gli header di autorizzazione vengono allegati solo per gli host in `channels.msteams.mediaAuthAllowHosts` (predefiniti: host Graph + Bot Framework). Mantieni questo elenco rigoroso (evita suffissi multi-tenant).

## Invio di file nelle chat di gruppo

I bot possono inviare file nei DM usando il flusso FileConsentCard (integrato). Tuttavia, **l'invio di file nelle chat di gruppo/canali** richiede una configurazione aggiuntiva:

| Contesto                 | Come vengono inviati i file                 | Configurazione necessaria                         |
| ------------------------ | ------------------------------------------- | ------------------------------------------------- |
| **DM**                   | FileConsentCard → l'utente accetta → il bot carica | Funziona subito                              |
| **Chat di gruppo/canali** | Caricamento su SharePoint → link condiviso | Richiede `sharePointSiteId` + autorizzazioni Graph |
| **Immagini (qualsiasi contesto)** | Inline con codifica Base64          | Funziona subito                                   |

### Perché le chat di gruppo richiedono SharePoint

I bot non hanno un drive OneDrive personale (l'endpoint Graph API `/me/drive` non funziona per le identità applicative). Per inviare file nelle chat di gruppo/canali, il bot carica su un **sito SharePoint** e crea un link di condivisione.

### Configurazione

1. **Aggiungi autorizzazioni Graph API** in Entra ID (Azure AD) → Registrazione app:
   - `Sites.ReadWrite.All` (Application) - caricare file su SharePoint
   - `Chat.Read.All` (Application) - facoltativo, abilita link di condivisione per utente

2. **Concedi il consenso amministratore** per il tenant.

3. **Ottieni l'ID del sito SharePoint:**

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

| Autorizzazione                         | Comportamento di condivisione                                  |
| -------------------------------------- | -------------------------------------------------------------- |
| Solo `Sites.ReadWrite.All`             | Link di condivisione a livello di organizzazione (chiunque nell'organizzazione può accedere) |
| `Sites.ReadWrite.All` + `Chat.Read.All` | Link di condivisione per utente (solo i membri della chat possono accedere) |

La condivisione per utente è più sicura perché solo i partecipanti alla chat possono accedere al file. Se l'autorizzazione `Chat.Read.All` manca, il bot ripiega sulla condivisione a livello di organizzazione.

### Comportamento di fallback

| Scenario                                          | Risultato                                          |
| ------------------------------------------------- | -------------------------------------------------- |
| Chat di gruppo + file + `sharePointSiteId` configurato | Carica su SharePoint, invia link di condivisione |
| Chat di gruppo + file + nessun `sharePointSiteId` | Tenta caricamento OneDrive (potrebbe fallire), invia solo testo |
| Chat personale + file                             | Flusso FileConsentCard (funziona senza SharePoint) |
| Qualsiasi contesto + immagine                     | Inline con codifica Base64 (funziona senza SharePoint) |

### Posizione dei file archiviati

I file caricati vengono archiviati in una cartella `/OpenClawShared/` nella raccolta documenti predefinita del sito SharePoint configurato.

## Sondaggi (Adaptive Cards)

OpenClaw invia i sondaggi Teams come Adaptive Cards (non esiste una API nativa per i sondaggi Teams).

- CLI: `openclaw message poll --channel msteams --target conversation:<id> ...`
- I voti vengono registrati dal Gateway nello SQLite dello stato Plugin di OpenClaw in `state/openclaw.sqlite`.
- I file `msteams-polls.json` esistenti vengono importati da `openclaw doctor --fix`, non dal Plugin in esecuzione.
- Il Gateway deve rimanere online per registrare i voti.
- I sondaggi non pubblicano ancora automaticamente riepiloghi dei risultati e non esiste ancora una CLI supportata per i risultati dei sondaggi.

## Schede di presentazione

Invia payload di presentazione semantici a utenti o conversazioni Teams usando lo strumento `message`, la CLI o la normale consegna delle risposte. OpenClaw li renderizza come Teams Adaptive Cards dal contratto di presentazione generico.

Il parametro `presentation` accetta blocchi semantici. Quando viene fornito `presentation`, il testo del messaggio è facoltativo. I pulsanti vengono renderizzati come azioni di invio o URL di Adaptive Card. I menu di selezione non sono ancora nativi nel renderer Teams, quindi OpenClaw li degrada a testo leggibile prima della consegna.

**Strumento dell'agente:**

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

| Tipo di target     | Formato                          | Esempio                                             |
| ------------------ | -------------------------------- | --------------------------------------------------- |
| Utente (per ID)    | `user:<aad-object-id>`           | `user:40a1a0ed-4ff2-4164-a219-55518990c197`         |
| Utente (per nome)  | `user:<display-name>`            | `user:John Smith` (richiede Graph API)              |
| Gruppo/canale      | `conversation:<conversation-id>` | `conversation:19:abc123...@thread.tacv2`            |
| Gruppo/canale (grezzo) | `<conversation-id>`          | `19:abc123...@thread.tacv2` (se contiene `@thread`) |

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

**Esempi di strumento dell'agente:**

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
Senza il prefisso `user:`, i nomi usano per impostazione predefinita la risoluzione di gruppi o team. Usa sempre `user:` quando indirizzi persone per nome visualizzato.
</Note>

## Messaggistica proattiva

- I messaggi proattivi sono possibili solo **dopo** che un utente ha interagito, perché a quel punto archiviamo i riferimenti alla conversazione.
- Vedi `/gateway/configuration` per `dmPolicy` e il gating tramite allowlist.

## ID team e canale (errore comune)

Il parametro di query `groupId` negli URL Teams **NON** è l'ID team usato per la configurazione. Estrai invece gli ID dal percorso dell'URL:

**URL team:**

```
https://teams.microsoft.com/l/team/19%3ABk4j...%40thread.tacv2/conversations?groupId=...
                                    └────────────────────────────┘
                                    Team conversation ID (URL-decode this)
```

**URL canale:**

```
https://teams.microsoft.com/l/channel/19%3A15bc...%40thread.tacv2/ChannelName?groupId=...
                                      └─────────────────────────┘
                                      Channel ID (URL-decode this)
```

**Per la configurazione:**

- Chiave team = segmento del percorso dopo `/team/` (decodificato da URL, ad es. `19:Bk4j...@thread.tacv2`; i tenant più vecchi possono mostrare `@thread.skype`, anch'esso valido)
- Chiave canale = segmento del percorso dopo `/channel/` (decodificato da URL)
- **Ignora** il parametro di query `groupId` per il routing OpenClaw. È l'ID gruppo Microsoft Entra, non l'ID conversazione Bot Framework usato nelle attività Teams in ingresso.

## Canali privati

I bot hanno supporto limitato nei canali privati:

| Funzionalità                 | Canali standard | Canali privati          |
| ---------------------------- | --------------- | ----------------------- |
| Installazione del bot        | Sì              | Limitata                |
| Messaggi in tempo reale (Webhook) | Sì        | Potrebbe non funzionare |
| Autorizzazioni RSC           | Sì              | Potrebbero comportarsi diversamente |
| @mentions                    | Sì              | Se il bot è accessibile |
| Cronologia Graph API         | Sì              | Sì (con autorizzazioni) |

**Soluzioni alternative se i canali privati non funzionano:**

1. Usa canali standard per le interazioni con il bot
2. Usa i DM: gli utenti possono sempre inviare messaggi direttamente al bot
3. Usa Graph API per l'accesso storico (richiede `ChannelMessage.Read.All`)

## Risoluzione dei problemi

### Problemi comuni

- **Immagini non visualizzate nei canali:** autorizzazioni Graph o consenso amministratore mancanti. Reinstalla l'app Teams e chiudi/riapri completamente Teams.
- **Nessuna risposta nel canale:** le menzioni sono richieste per impostazione predefinita; imposta `channels.msteams.requireMention=false` o configura per team/canale.
- **Mancata corrispondenza di versione (Teams mostra ancora il vecchio manifest):** rimuovi e riaggiungi l'app, quindi chiudi completamente Teams per aggiornare.
- **401 Unauthorized dal Webhook:** previsto durante il test manuale senza Azure JWT: significa che l'endpoint è raggiungibile ma l'autenticazione non è riuscita. Usa Azure Web Chat per testare correttamente.

### Errori di caricamento del manifest

- **"Icon file cannot be empty":** il manifest fa riferimento a file icona da 0 byte. Crea icone PNG valide (32x32 per `outline.png`, 192x192 per `color.png`).
- **"webApplicationInfo.Id already in use":** l'app è ancora installata in un altro team/chat. Trovala e disinstallala prima, oppure attendi 5-10 minuti per la propagazione.
- **"Something went wrong" durante il caricamento:** carica invece tramite [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com), apri DevTools del browser (F12) → scheda Network e controlla il corpo della risposta per l'errore effettivo.
- **Sideload non riuscito:** prova "Upload an app to your org's app catalog" invece di "Upload a custom app": spesso aggira le restrizioni di sideload.

### Autorizzazioni RSC non funzionanti

1. Verifica che `webApplicationInfo.id` corrisponda esattamente all'App ID del tuo bot
2. Carica di nuovo l'app e reinstallala nel team/chat
3. Controlla se l'amministratore della tua organizzazione ha bloccato le autorizzazioni RSC
4. Conferma di usare l'ambito corretto: `ChannelMessage.Read.Group` per i team, `ChatMessage.Read.Chat` per le chat di gruppo

## Riferimenti

- [Crea Azure Bot](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) - guida alla configurazione di Azure Bot
- [Portale per sviluppatori Teams](https://dev.teams.microsoft.com/apps) - crea/gestisci app Teams
- [Schema del manifesto dell'app Teams](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [Ricevere messaggi di canale con RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [Riferimento autorizzazioni RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [Gestione dei file dei bot Teams](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4) (canale/gruppo richiede Graph)
- [Messaggistica proattiva](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)
- [@microsoft/teams.cli](https://www.npmjs.com/package/@microsoft/teams.cli) - CLI Teams per la gestione dei bot

## Correlati

- [Panoramica dei canali](/it/channels) - tutti i canali supportati
- [Abbinamento](/it/channels/pairing) - autenticazione tramite DM e flusso di abbinamento
- [Gruppi](/it/channels/groups) - comportamento delle chat di gruppo e gating delle menzioni
- [Instradamento dei canali](/it/channels/channel-routing) - instradamento delle sessioni per i messaggi
- [Sicurezza](/it/gateway/security) - modello di accesso e hardening
