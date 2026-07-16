---
read_when:
    - Sviluppo delle funzionalità del canale Microsoft Teams
summary: Stato del supporto, funzionalità e configurazione del bot Microsoft Teams
title: Microsoft Teams
x-i18n:
    generated_at: "2026-07-16T14:01:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: cb16cf89ed2ab7ae69389ac30e9cc32cc7d1bc2d3c6bccbd139d367380b7b32c
    source_path: channels/msteams.md
    workflow: 16
---

Stato: sono supportati testo + allegati nei DM; l'invio di file nei canali/gruppi richiede `sharePointSiteId` + autorizzazioni Graph (vedere [Invio di file nelle chat di gruppo](#sending-files-in-group-chats)). I sondaggi vengono inviati tramite Adaptive Cards. Le azioni dei messaggi espongono esplicitamente `upload-file` per gli invii in cui il file viene prima.

## Plugin incluso

Microsoft Teams viene distribuito come Plugin incluso nelle versioni correnti di OpenClaw; nella normale build pacchettizzata non è richiesta un'installazione separata.

In una build precedente o in un'installazione personalizzata che esclude Teams incluso, installare direttamente il pacchetto npm:

```bash
openclaw plugins install @openclaw/msteams
```

Usare il pacchetto senza versione per seguire il tag della versione ufficiale corrente. Specificare una versione esatta solo quando è necessaria un'installazione riproducibile.

Checkout locale (esecuzione da un repository git):

```bash
openclaw plugins install ./path/to/local/msteams-plugin
```

Dettagli: [Plugin](/it/tools/plugin)

## Configurazione rapida

[`@microsoft/teams.cli`](https://www.npmjs.com/package/@microsoft/teams.cli) gestisce la registrazione del bot, la creazione del manifesto e la generazione delle credenziali con un solo comando.

**1. Installare ed effettuare l'accesso**

```bash
npm install -g @microsoft/teams.cli@preview
teams login
teams status   # verificare di aver effettuato l'accesso e visualizzare le informazioni sul tenant
```

<Note>
La CLI di Teams è attualmente in anteprima. Comandi e flag possono cambiare tra una versione e l'altra.
</Note>

**2. Avviare un tunnel** (Teams non può raggiungere localhost)

Se necessario, installare e autenticare la CLI devtunnel ([guida introduttiva](https://learn.microsoft.com/en-us/azure/developer/dev-tunnels/get-started)).

```bash
# Configurazione una tantum (URL persistente tra le sessioni):
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# Per ogni sessione di sviluppo:
devtunnel host my-openclaw-bot
# Endpoint: https://<tunnel-id>.devtunnels.ms/api/messages
```

<Note>
`--allow-anonymous` è obbligatorio perché Teams non può autenticarsi con devtunnels. Ogni richiesta in entrata del bot viene comunque convalidata dall'SDK di Teams.
</Note>

Alternative: `ngrok http 3978` o `tailscale funnel 3978` (gli URL possono cambiare a ogni sessione).

**3. Creare l'app**

```bash
teams app create \
  --name "OpenClaw" \
  --endpoint "https://<your-tunnel-url>/api/messages"
```

Questo comando crea un'applicazione Entra ID (Azure AD), genera un segreto client, compila e carica un manifesto dell'app Teams (con icone) e registra un bot gestito da Teams (non è necessario un abbonamento Azure). L'output include `CLIENT_ID`, `CLIENT_SECRET`, `TENANT_ID` e un **ID app Teams**; consente inoltre di installare direttamente l'app in Teams.

**4. Configurare OpenClaw** usando le credenziali dell'output:

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

In alternativa, usare direttamente le variabili di ambiente: `MSTEAMS_APP_ID`, `MSTEAMS_APP_PASSWORD`, `MSTEAMS_TENANT_ID`.

**5. Installare l'app in Teams**

`teams app create` richiede di installare l'app; selezionare "Install in Teams". Per ottenere successivamente il collegamento di installazione:

```bash
teams app get <teamsAppId> --install-link
```

**6. Verificare che tutto funzioni**

```bash
teams app doctor <teamsAppId>
```

Esegue la diagnostica della registrazione del bot, della configurazione dell'app AAD, della validità del manifesto e della configurazione SSO.

Per la produzione, valutare l'[autenticazione federata](#federated-authentication-certificate-plus-managed-identity) (certificato o identità gestita) anziché i segreti client.

<Note>
Le chat di gruppo sono bloccate per impostazione predefinita (`channels.msteams.groupPolicy: "allowlist"`). Per consentire le risposte di gruppo, impostare `channels.msteams.groupAllowFrom` oppure usare `groupPolicy: "open"` per consentirle a qualsiasi membro (con menzione obbligatoria).
</Note>

## Obiettivi

- Comunicare con OpenClaw tramite DM, chat di gruppo o canali di Teams.
- Mantenere deterministico l'instradamento: le risposte tornano sempre al canale da cui sono arrivate.
- Adottare per impostazione predefinita un comportamento sicuro nei canali (menzioni obbligatorie, salvo diversa configurazione).

## Scritture della configurazione

Per impostazione predefinita, Microsoft Teams può scrivere aggiornamenti della configurazione attivati da `/config set|unset` (richiede `commands.config: true`).

Disabilitare con:

```json5
{
  channels: { msteams: { configWrites: false } },
}
```

## Controllo degli accessi (DM + gruppi)

**Accesso ai DM**

- Impostazione predefinita: `channels.msteams.dmPolicy = "pairing"`. I mittenti sconosciuti vengono ignorati finché non vengono approvati.
- `channels.msteams.allowFrom` deve usare ID oggetto AAD stabili o gruppi statici di accesso dei mittenti, come `accessGroup:core-team`.
- Non fare affidamento sulla corrispondenza di UPN/nomi visualizzati per le liste di elementi consentiti, poiché possono cambiare. OpenClaw disabilita per impostazione predefinita la corrispondenza diretta dei nomi; abilitarla esplicitamente con `channels.msteams.dangerouslyAllowNameMatching: true`.
- La procedura guidata può risolvere i nomi in ID tramite Microsoft Graph quando le credenziali lo consentono.

**Accesso ai gruppi**

- Impostazione predefinita: `channels.msteams.groupPolicy = "allowlist"` (bloccato finché non si aggiunge `groupAllowFrom`). `channels.defaults.groupPolicy` può sostituire l'impostazione predefinita condivisa quando `channels.msteams.groupPolicy` non è impostato.
- `channels.msteams.groupAllowFrom` controlla quali mittenti o gruppi statici di accesso dei mittenti possono attivare il bot nelle chat di gruppo/nei canali (in alternativa usa `channels.msteams.allowFrom`).
- Impostare `groupPolicy: "open"` per consentire l'accesso a qualsiasi membro (per impostazione predefinita è comunque richiesta una menzione).
- Per bloccare **tutti** i canali, impostare `channels.msteams.groupPolicy: "disabled"`.

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

**Lista di team + canali consentiti**

- Limitare le risposte nei gruppi/canali elencando team e canali in `channels.msteams.teams`.
- Usare come chiavi gli ID conversazione stabili di Teams ricavati dai collegamenti di Teams, non nomi visualizzati modificabili (vedere [ID di team e canali](#team-and-channel-ids-common-gotcha)).
- Quando `groupPolicy="allowlist"` è presente insieme a una lista di team consentiti, vengono accettati solo i team/canali elencati (con menzione obbligatoria).
- La procedura guidata di configurazione accetta voci `Team/Channel` e le memorizza.
- All'avvio, OpenClaw risolve in ID i nomi di team/canali e quelli nella lista di utenti consentiti (quando le autorizzazioni Graph lo permettono) e registra la mappatura nei log. I nomi non risolti vengono conservati come immessi, ma ignorati per l'instradamento a meno che non sia impostato `channels.msteams.dangerouslyAllowNameMatching: true`.

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
<summary><strong>Configurazione manuale (senza la CLI di Teams)</strong></summary>

### Funzionamento

1. Assicurarsi che il Plugin Microsoft Teams sia disponibile (incluso nelle versioni correnti).
2. Creare un **bot Azure** (ID app + segreto + ID tenant).
3. Creare un **pacchetto dell'app Teams** che faccia riferimento al bot, includendo le autorizzazioni RSC riportate di seguito.
4. Caricare/installare l'app Teams in un team (o nell'ambito personale per i DM).
5. Configurare `msteams` in `~/.openclaw/openclaw.json` (o nelle variabili di ambiente) e avviare il Gateway.
6. Per impostazione predefinita, il Gateway resta in ascolto del traffico Webhook di Bot Framework su `/api/messages`.

### Passaggio 1: creare il bot Azure

1. Accedere a [Create Azure Bot](https://portal.azure.com/#create/Microsoft.AzureBot)
2. Compilare la scheda **Basics**:

   | Campo              | Valore                                                                  |
   | ------------------ | ----------------------------------------------------------------------- |
   | **Bot handle**     | Nome del bot, ad esempio `openclaw-msteams` (deve essere univoco)       |
   | **Subscription**   | Selezionare l'abbonamento Azure                                         |
   | **Resource group** | Crearne uno nuovo o usarne uno esistente                                |
   | **Pricing tier**   | **Free** per sviluppo/test                                              |
   | **Type of App**    | **Single Tenant** (scelta consigliata; vedere la nota seguente)         |
   | **Creation type**  | **Create new Microsoft App ID**                                         |

<Warning>
La creazione di nuovi bot multi-tenant è stata deprecata dopo il 2025-07-31. Usare **Single Tenant** per i nuovi bot.
</Warning>

3. Fare clic su **Review + create**, quindi su **Create** (~1-2 minuti).

### Passaggio 2: ottenere le credenziali

1. Risorsa Azure Bot → **Configuration** → copiare **Microsoft App ID** (il valore `appId`).
2. **Manage Password** → App Registration → **Certificates & secrets** → **New client secret** → copiare il **Value** (il valore `appPassword`).
3. **Overview** → copiare **Directory (tenant) ID** (il valore `tenantId`).

### Passaggio 3: configurare l'endpoint di messaggistica

1. Azure Bot → **Configuration**.
2. Impostare **Messaging endpoint**:
   - Produzione: `https://your-domain.com/api/messages`
   - Sviluppo locale: usare un tunnel (vedere [Sviluppo locale](#local-development-tunneling))

### Passaggio 4: abilitare il canale Teams

1. Azure Bot → **Channels**.
2. Fare clic su **Microsoft Teams** → Configure → Save.
3. Accettare i Termini di servizio.

### Passaggio 5: creare il manifesto dell'app Teams

- Includere una voce `bot` con `botId = <App ID>`.
- Ambiti: `personal`, `team`, `groupChat`.
- `supportsFiles: true` (obbligatorio per la gestione dei file nell'ambito personale).
- Aggiungere le autorizzazioni RSC (vedere [Autorizzazioni RSC](#current-teams-rsc-permissions-manifest)).
- Creare le icone: `outline.png` (32x32) e `color.png` (192x192).
- Comprimere insieme in un file ZIP `manifest.json`, `outline.png` e `color.png`.

### Passaggio 6: configurare OpenClaw

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

### Passaggio 7: eseguire il Gateway

Il canale Teams si avvia automaticamente quando il Plugin è disponibile e la configurazione `msteams` contiene le credenziali.

</details>

## Autenticazione federata (certificato più identità gestita)

Per la produzione, OpenClaw supporta l'**autenticazione federata** come alternativa ai segreti client, tramite `channels.msteams.authType: "federated"`. Sono disponibili due metodi:

### Opzione A: autenticazione basata su certificato

Usare un certificato PEM registrato nell'applicazione Entra ID.

**Configurazione:**

1. Generare o ottenere un certificato (formato PEM con chiave privata).
2. Entra ID → App Registration → **Certificates & secrets** → **Certificates** → caricare il certificato pubblico.

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

**Variabili di ambiente:**

- `MSTEAMS_AUTH_TYPE=federated`
- `MSTEAMS_CERTIFICATE_PATH=/path/to/cert.pem`

### Opzione B: identità gestita di Azure

Usare l'identità gestita di Azure per l'autenticazione senza password nell'infrastruttura Azure (AKS, App Service, macchine virtuali Azure).

**Funzionamento:**

1. Il pod/la macchina virtuale del bot dispone di un'identità gestita (assegnata dal sistema o dall'utente).
2. Una credenziale di identità federata collega l'identità gestita all'applicazione Entra ID.
3. Durante l'esecuzione, OpenClaw usa `@azure/identity` per acquisire i token dall'endpoint IMDS di Azure.
4. Il token viene passato all'SDK di Teams per l'autenticazione del bot.

**Prerequisiti:**

- Infrastruttura Azure con identità gestita abilitata (identità del carico di lavoro AKS, App Service, VM).
- Credenziale di identità federata creata nella registrazione dell'app Entra ID.
- Accesso di rete a IMDS (`169.254.169.254:80`) dal pod/dalla VM.

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

**Configurazione (identità gestita assegnata dall'utente):** aggiungere `managedIdentityClientId: "<MI_CLIENT_ID>"` al blocco precedente.

**Variabili di ambiente:**

- `MSTEAMS_AUTH_TYPE=federated`
- `MSTEAMS_USE_MANAGED_IDENTITY=true`
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID=<client-id>` (solo assegnata dall'utente)

### Configurazione dell'identità del carico di lavoro AKS

Per le distribuzioni AKS che usano l'identità del carico di lavoro:

1. **Abilitare l'identità del carico di lavoro** nel cluster AKS.
2. **Creare una credenziale di identità federata** nella registrazione dell'app Entra ID:

   ```bash
   az ad app federated-credential create --id <APP_OBJECT_ID> --parameters '{
     "name": "my-bot-workload-identity",
     "issuer": "<AKS_OIDC_ISSUER_URL>",
     "subject": "system:serviceaccount:<NAMESPACE>:<SERVICE_ACCOUNT>",
     "audiences": ["api://AzureADTokenExchange"]
   }'
   ```

3. **Annotare l'account di servizio Kubernetes** con l'ID client dell'app:

   ```yaml
   apiVersion: v1
   kind: ServiceAccount
   metadata:
     name: my-bot-sa
     annotations:
       azure.workload.identity/client-id: "<APP_CLIENT_ID>"
   ```

4. **Etichettare il pod** per l'inserimento dell'identità del carico di lavoro:

   ```yaml
   metadata:
     labels:
       azure.workload.identity/use: "true"
   ```

5. **Consentire l'accesso di rete** a IMDS (`169.254.169.254`): se si usa NetworkPolicy, aggiungere una regola di uscita per `169.254.169.254/32` sulla porta 80.

### Confronto dei tipi di autenticazione

| Metodo                 | Configurazione                                 | Vantaggi                                      | Svantaggi                                           |
| ---------------------- | ---------------------------------------------- | --------------------------------------------- | --------------------------------------------------- |
| **Segreto client**     | `appPassword`                             | Configurazione semplice                       | Rotazione del segreto necessaria, meno sicuro       |
| **Certificato**        | `authType: "federated"` + `certificatePath`        | Nessun segreto condiviso trasmesso sulla rete | Costi operativi di gestione del certificato         |
| **Identità gestita**   | `authType: "federated"` + `useManagedIdentity`        | Senza password, nessun segreto da gestire     | Infrastruttura Azure necessaria                     |

`certificateThumbprint` può essere impostato insieme a `certificatePath`, ma attualmente non viene letto dal percorso di autenticazione; è accettato esclusivamente per compatibilità futura.

**Impostazione predefinita:** quando `authType` non è impostato, OpenClaw usa l'autenticazione con segreto client (`appPassword`). Le configurazioni esistenti continuano a funzionare senza modifiche.

## Sviluppo locale (tunneling)

Teams non può raggiungere `localhost`. Usare un tunnel di sviluppo persistente affinché l'URL rimanga stabile tra le sessioni:

```bash
# Configurazione iniziale:
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# A ogni sessione di sviluppo:
devtunnel host my-openclaw-bot
```

Alternative: `ngrok http 3978` o `tailscale funnel 3978` (gli URL possono cambiare a ogni sessione).

Se l'URL del tunnel cambia, aggiornare l'endpoint:

```bash
teams app update <teamsAppId> --endpoint "https://<new-url>/api/messages"
```

## Test del bot

**Eseguire la diagnostica:**

```bash
teams app doctor <teamsAppId>
```

Controlla in un unico passaggio la registrazione del bot, l'app AAD, il manifesto e la configurazione SSO.

**Inviare un messaggio di prova:**

1. Installare l'app Teams (collegamento di installazione da `teams app get <id> --install-link`).
2. Trovare il bot in Teams e inviargli un messaggio diretto.
3. Controllare nei log del Gateway la presenza di attività in entrata.

## Variabili di ambiente

Queste chiavi di configurazione relative all'autenticazione possono essere impostate tramite variabili di ambiente anziché in `openclaw.json` (le altre chiavi di configurazione, come `groupPolicy` o `historyLimit`, possono essere impostate solo nella configurazione):

| Variabile di ambiente                 | Chiave di configurazione   | Note                                      |
| ------------------------------------- | -------------------------- | ----------------------------------------- |
| `MSTEAMS_APP_ID`                    | `appId`         |                                           |
| `MSTEAMS_APP_PASSWORD`                    | `appPassword`         |                                           |
| `MSTEAMS_TENANT_ID`                    | `tenantId`         |                                           |
| `MSTEAMS_AUTH_TYPE`                    | `authType`         | `"secret"` o `"federated"`   |
| `MSTEAMS_CERTIFICATE_PATH`                    | `certificatePath`         | federata + certificato                    |
| `MSTEAMS_CERTIFICATE_THUMBPRINT`                    | `certificateThumbprint`         | accettata, non necessaria per autenticarsi |
| `MSTEAMS_USE_MANAGED_IDENTITY`                    | `useManagedIdentity`         | federata + identità gestita               |
| `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID`                    | `managedIdentityClientId`         | solo identità gestita assegnata dall'utente |

## Azione per le informazioni sui membri

OpenClaw mette a disposizione un'azione `member-info` basata su Graph per Microsoft Teams, affinché agenti e automazioni possano recuperare i dettagli verificati dell'elenco dei membri per una conversazione configurata.

Requisiti:

- Autorizzazioni RSC `ChannelSettings.Read.Group` e `TeamMember.Read.Group` (già incluse nel manifesto consigliato).

L'azione è disponibile ogni volta che sono configurate le credenziali Graph; non esiste un'opzione `channels.msteams.actions.memberInfo` separata.
Le ricerche nei canali standard restituiscono l'identità corrispondente nell'elenco dei membri del team, il nome visualizzato, l'indirizzo e-mail e i ruoli.
Nel messaggio diretto o nella chat di gruppo corrente, l'azione può restituire l'ID utente stabile del mittente attendibile.
Le ricerche dei membri nei canali privati/condivisi e nelle chat diverse da quella corrente richiedono autorizzazioni aggiuntive per l'elenco dei membri
e vengono rifiutate dal set di autorizzazioni predefinito.

## Contesto della cronologia

- `channels.msteams.historyLimit` determina quanti messaggi recenti del canale o del gruppo vengono inclusi nel prompt. In alternativa usa `messages.groupChat.historyLimit`, quindi il valore predefinito è 50. Impostare `0` per disabilitare.
- La cronologia recuperata del thread viene filtrata mediante gli elenchi dei mittenti consentiti (`allowFrom` / `groupAllowFrom`); pertanto, l'inizializzazione del contesto del thread include solo i messaggi dei mittenti consentiti.
- Il contesto degli allegati citati (analizzato dall'HTML dello schema Skype Reply negli allegati della risposta stessa) viene trasmesso senza filtri; attualmente solo l'inizializzazione tramite la cronologia del thread applica il filtro dell'elenco dei mittenti consentiti.
- La cronologia dei messaggi diretti può essere limitata con `channels.msteams.dmHistoryLimit` (turni dell'utente). Sostituzioni per singolo utente: `channels.msteams.dms["<user_id>"].historyLimit`.

## Autorizzazioni RSC di Teams correnti (manifesto)

Queste sono le **autorizzazioni resourceSpecific esistenti** nel manifesto della nostra app Teams. Si applicano solo nel team o nella chat in cui è installata l'app.

**Per i canali (ambito team):**

- `ChannelMessage.Read.Group` (Application) - ricezione di tutti i messaggi del canale senza @menzione
- `ChannelMessage.Send.Group` (Application)
- `Member.Read.Group` (Application)
- `Owner.Read.Group` (Application)
- `ChannelSettings.Read.Group` (Application)
- `TeamMember.Read.Group` (Application)
- `TeamSettings.Read.Group` (Application)

**Per le chat di gruppo:**

- `ChatMessage.Read.Chat` (Application) - ricezione di tutti i messaggi della chat di gruppo senza @menzione

Aggiungere le autorizzazioni RSC tramite la CLI di Teams:

```bash
teams app rsc add <teamsAppId> ChannelMessage.Read.Group --type Application
```

## Esempio di manifesto Teams (dati sensibili rimossi)

Esempio minimo e valido con i campi obbligatori. Sostituire gli ID e gli URL.

```json5
{
  $schema: "https://developer.microsoft.com/en-us/json-schemas/teams/v1.23/MicrosoftTeams.schema.json",
  manifestVersion: "1.23",
  version: "1.0.0",
  id: "00000000-0000-0000-0000-000000000000",
  name: { short: "OpenClaw" },
  developer: {
    name: "La propria organizzazione",
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

- `bots[].botId` **deve** corrispondere all'ID app di Azure Bot.
- `webApplicationInfo.id` **deve** corrispondere all'ID app di Azure Bot.
- `bots[].scopes` deve includere le superfici che si prevede di usare (`personal`, `team`, `groupChat`).
- `bots[].supportsFiles: true` è obbligatorio per la gestione dei file nell'ambito personale.
- `authorization.permissions.resourceSpecific` deve includere la lettura e l'invio nei canali per il traffico dei canali.

### Aggiornamento di un'app esistente

```bash
# Scaricare, modificare e ricaricare il manifesto
teams app manifest download <teamsAppId> manifest.json
# Modificare manifest.json localmente...
teams app manifest upload manifest.json <teamsAppId>
# La versione viene incrementata automaticamente se il contenuto è cambiato
```

Dopo l'aggiornamento, reinstallare l'app in ogni team e **chiudere completamente e riavviare Teams** (non limitarsi a chiudere la finestra) per cancellare i metadati dell'app memorizzati nella cache.

<details>
<summary>Aggiornamento manuale del manifesto (senza CLI)</summary>

1. Aggiornare `manifest.json` con le nuove impostazioni.
2. **Incrementare il campo `version`** (ad esempio, `1.0.0` → `1.1.0`).
3. **Creare nuovamente il file zip** del manifesto con le icone (`manifest.json`, `outline.png`, `color.png`).
4. Caricare il nuovo file zip:
   - **Teams Admin Center:** Teams apps → Manage apps → trovare l'app → Upload new version.
   - **Sideload:** Teams → Apps → Manage your apps → Upload a custom app.

</details>

## Funzionalità: solo RSC o Graph

### Con **solo RSC di Teams** (app installata, nessuna autorizzazione API Graph)

Funziona:

- Lettura del contenuto **testuale** dei messaggi del canale.
- Invio del contenuto **testuale** dei messaggi del canale.
- Ricezione degli allegati nei messaggi **personali (DM)**.

NON funziona:

- Contenuto di **immagini o file** nei canali/gruppi (il payload include solo uno stub HTML).
- Download degli allegati archiviati in SharePoint/OneDrive.
- Lettura della cronologia dei messaggi oltre l'evento Webhook in tempo reale.

### Con **RSC di Teams + autorizzazioni Application di Microsoft Graph**

Aggiunge:

- Download dei contenuti ospitati (immagini incollate nei messaggi).
- Download degli allegati archiviati in SharePoint/OneDrive.
- Lettura della cronologia dei messaggi dei canali/delle chat tramite Graph.

### RSC e API Graph

| Funzionalità                | Autorizzazioni RSC        | Graph API                                      |
| --------------------------- | ------------------------- | ---------------------------------------------- |
| **Messaggi in tempo reale** | Sì (tramite webhook)      | No (solo polling)                              |
| **Messaggi cronologici**    | No                        | Sì (può interrogare la cronologia)             |
| **Complessità di configurazione** | Solo manifesto dell'app | Richiede il consenso dell'amministratore + flusso del token |
| **Funziona offline**        | No (deve essere in esecuzione) | Sì (interrogabile in qualsiasi momento)    |

**In sintesi:** RSC serve per l'ascolto in tempo reale; Graph API serve per l'accesso alla cronologia. Per recuperare i messaggi persi mentre il sistema era offline, è necessaria Graph API con `ChannelMessage.Read.All` (richiede il consenso dell'amministratore).

## Contenuti multimediali e cronologia abilitati tramite Graph

Abilitare solo le autorizzazioni applicazione di Microsoft Graph necessarie per gli ambiti e i dati di Teams utilizzati:

1. Entra ID (Azure AD) **App Registration** → aggiungere le **Application permissions** di Graph:
   - `ChannelMessage.Read.All` per gli allegati e la cronologia dei canali.
   - `Chat.Read.All` per gli allegati e la cronologia delle chat di gruppo.
   - `Files.Read.All` quando è necessario scaricare i byte degli allegati dall'archiviazione SharePoint/OneDrive; le configurazioni dedicate esclusivamente alla cronologia non ne hanno bisogno.
2. **Grant admin consent** per il tenant.
3. Incrementare la **versione del manifesto** dell'app Teams, ricaricarla e **reinstallare l'app in Teams**.
4. **Chiudere completamente e riavviare Teams** per cancellare i metadati dell'app memorizzati nella cache.

### Recupero dei file di canali e gruppi (`graphMediaFallback`)

Teams può rimuovere gli indicatori dei file dall'attività HTML inviata a un bot. In tal caso, l'attività di Bot Framework è indistinguibile da un normale messaggio HTML; il riferimento completo all'allegato esiste solo nella copia del messaggio presente in Graph.

Abilitare il meccanismo di ripiego dopo aver concesso le autorizzazioni indicate sopra:

```json5
{
  channels: {
    msteams: {
      graphMediaFallback: true,
    },
  },
}
```

Si applica solo ai canali e alle chat di gruppo. Aggiunge una ricerca del messaggio in Graph ogni volta che un'attività HTML non produce contenuti multimediali scaricabili direttamente, inclusi i messaggi ordinari o contenenti soltanto menzioni. Il valore predefinito è `false`, affinché le installazioni esistenti non generino automaticamente traffico Graph aggiuntivo o errori di autorizzazione.

**Menzioni degli utenti:** le @menzioni funzionano immediatamente per gli utenti già presenti nella conversazione. Per cercare e menzionare dinamicamente utenti **non presenti nella conversazione corrente**, aggiungere l'autorizzazione `User.Read.All` (Application) e concedere il consenso dell'amministratore.

## Limitazioni note

### Timeout dei webhook

Teams consegna i messaggi tramite webhook HTTP. OpenClaw applica timeout fissi del server HTTP al listener del webhook: 30 s di inattività, 30 s per la richiesta totale e 15 s per ricevere le intestazioni. I contenuti multimediali in ingresso e l'arricchimento del contesto facoltativi condividono un limite di 10 secondi, ma l'SDK di Teams attende comunque il turno dell'agente prima di restituire la risposta del webhook. Se il turno completo supera la finestra di ripetizione dei tentativi di Teams, potrebbero verificarsi:

- Ripetizione del messaggio da parte di Teams (con conseguenti duplicati).
- Risposte perse.

Le risposte vengono inviate proattivamente non appena l'agente risponde, ma le esecuzioni lente dell'agente possono comunque causare nuovi tentativi o duplicati sul lato Teams.

### Supporto per il cloud Teams e gli URL del servizio

Questo percorso Teams basato sull'SDK è convalidato dal vivo per il cloud pubblico di Microsoft Teams.

Le risposte in ingresso utilizzano il contesto del turno dell'SDK di Teams relativo alla richiesta ricevuta. Le operazioni proattive fuori contesto — invii, modifiche, eliminazioni, schede, sondaggi, messaggi di consenso ai file e risposte in coda con esecuzione prolungata — utilizzano il riferimento alla conversazione memorizzato `serviceUrl`. Per impostazione predefinita, il cloud pubblico utilizza l'ambiente cloud pubblico dell'SDK di Teams e consente riferimenti memorizzati nell'host pubblico di Teams Connector: `https://smba.trafficmanager.net/`.

Il cloud pubblico è l'impostazione predefinita. Per i normali bot nel cloud pubblico non è necessario impostare `channels.msteams.cloud` o `channels.msteams.serviceUrl`.

Per i cloud Teams non pubblici, impostare `cloud` e il limite proattivo corrispondente quando Microsoft ne pubblica uno:

- `channels.msteams.cloud` seleziona la preimpostazione cloud dell'SDK di Teams per l'autenticazione, la convalida JWT, i servizi token e l'ambito Graph.
- `channels.msteams.serviceUrl` seleziona il limite dell'endpoint Bot Connector utilizzato per convalidare i riferimenti alle conversazioni memorizzati prima di invii, modifiche, eliminazioni, schede, sondaggi, messaggi di consenso ai file e risposte in coda con esecuzione prolungata. È obbligatorio per i cloud SDK USGov e DoD. Per China/21Vianet, OpenClaw utilizza la preimpostazione `China` dell'SDK e accetta URL del servizio memorizzati o configurati solo negli host dei canali Azure China Bot Framework.

Microsoft pubblica gli endpoint globali proattivi di Bot Connector nella sezione [Creare la conversazione](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages?tabs=dotnet#create-the-conversation) della documentazione sulla messaggistica proattiva di Teams. Utilizzare `serviceUrl` dell'attività in ingresso quando disponibile; in caso contrario, utilizzare la tabella Microsoft seguente.

| Ambiente Teams | Configurazione OpenClaw                                             | `serviceUrl` proattivo                             |
| ----------------- | ----------------------------------------------------------- | -------------------------------------------------- |
| Pubblico            | non è necessaria alcuna configurazione cloud/serviceUrl                           | `https://smba.trafficmanager.net/teams`            |
| GCC               | impostare `serviceUrl`; non esiste una preimpostazione cloud separata dell'SDK di Teams | `https://smba.infra.gcc.teams.microsoft.com/teams` |
| GCC High          | `cloud: "USGov"` + `serviceUrl`                             | `https://smba.infra.gov.teams.microsoft.us/teams`  |
| DoD               | `cloud: "USGovDoD"` + `serviceUrl`                          | `https://smba.infra.dod.teams.microsoft.us/teams`  |
| China/21Vianet    | `cloud: "China"`                                            | utilizzare `serviceUrl` dell'attività in ingresso           |

Esempio per GCC, per il quale Microsoft documenta un URL separato del servizio proattivo, ma l'SDK di Teams non espone una preimpostazione cloud GCC separata:

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

`channels.msteams.serviceUrl` è limitato agli host Microsoft Teams Bot Connector supportati. Quando è configurato un URL del servizio, OpenClaw verifica che `serviceUrl` della conversazione memorizzata utilizzi lo stesso host prima di eseguire invii, modifiche, eliminazioni, schede, sondaggi o risposte in coda con esecuzione prolungata. Con la configurazione predefinita del cloud pubblico, OpenClaw blocca l'operazione se una conversazione memorizzata punta al di fuori dell'host pubblico di Teams Connector. Dopo aver modificato le impostazioni del cloud o dell'URL del servizio, ricevere un nuovo messaggio dalla conversazione affinché il riferimento memorizzato sia aggiornato.

China/21Vianet non dispone di un URL `smba` proattivo globale separato nella tabella degli endpoint proattivi di Teams pubblicata da Microsoft. Configurare `cloud: "China"` affinché l'SDK di Teams utilizzi gli endpoint di autenticazione, token e JWT di Azure China. Gli invii proattivi richiedono quindi un riferimento alla conversazione memorizzato proveniente da un'attività Teams China in ingresso, oppure un URL del servizio configurato esplicitamente, entro il limite del canale Azure China Bot Framework (`*.botframework.azure.cn`). Gli helper di Teams basati su Graph sono disabilitati per `cloud: "China"` finché OpenClaw non instrada le richieste Graph attraverso l'endpoint Graph di Azure China.

### Formattazione

Il Markdown di Teams è più limitato rispetto a quello di Slack o Discord:

- La formattazione di base funziona: **grassetto**, _corsivo_, `code`, link.
- Il Markdown complesso (tabelle, elenchi nidificati) potrebbe non essere visualizzato correttamente.
- Le schede adattive sono supportate per i sondaggi e gli invii con presentazione semantica (vedere sotto).

## Configurazione

Impostazioni principali (consultare [/gateway/configuration](/it/gateway/configuration) per i modelli condivisi dei canali):

- `channels.msteams.enabled`: abilita/disabilita il canale.
- `channels.msteams.appId`, `channels.msteams.appPassword`, `channels.msteams.tenantId`: credenziali del bot.
- `channels.msteams.cloud`: ambiente cloud dell'SDK di Teams (`Public`, `USGov`, `USGovDoD` o `China`; valore predefinito `Public`). Impostare con `serviceUrl` per i cloud SDK USGov/DoD; la Cina utilizza la configurazione predefinita dell'SDK e i riferimenti alle conversazioni di Azure China Bot Framework archiviati, con gli strumenti basati su Graph disabilitati finché non sarà disponibile l'instradamento di Azure China Graph.
- `channels.msteams.serviceUrl`: limite dell'URL del servizio Bot Connector per le operazioni proattive dell'SDK. Il cloud pubblico utilizza il valore predefinito dell'SDK; impostarlo per GCC (`https://smba.infra.gcc.teams.microsoft.com/teams`), GCC High o DoD. La Cina accetta gli host dei canali di Azure China Bot Framework quando il riferimento alla conversazione archiviato proviene da Teams gestito da 21Vianet.
- `channels.msteams.webhook.port` (valore predefinito `3978`).
- `channels.msteams.webhook.path` (valore predefinito `/api/messages`).
- `channels.msteams.dmPolicy`: `pairing | allowlist | open | disabled` (valore predefinito `pairing`).
- `channels.msteams.allowFrom`: elenco di autorizzazione per i DM (sono consigliati gli ID oggetto AAD). Durante la configurazione guidata, i nomi vengono risolti in ID quando è disponibile l'accesso a Graph.
- `channels.msteams.dangerouslyAllowNameMatching`: opzione di emergenza per riabilitare la corrispondenza modificabile di UPN/nome visualizzato e l'instradamento diretto per nome di team/canale.
- `channels.msteams.textChunkLimit`: dimensione in caratteri dei segmenti di testo in uscita (valore predefinito `4000` e limite massimo rigido di `4000`, indipendentemente da un valore configurato superiore).
- `channels.msteams.streaming.chunkMode`: `length` (valore predefinito) o `newline` per suddividere in corrispondenza delle righe vuote (limiti dei paragrafi) prima della segmentazione per lunghezza.
- `channels.msteams.mediaAllowHosts`: elenco di autorizzazione per gli host degli allegati in entrata (per impostazione predefinita, i domini Microsoft/Teams: Graph, SharePoint/OneDrive, Teams CDN, Bot Framework, Azure Media Services).
- `channels.msteams.mediaAuthAllowHosts`: elenco di autorizzazione per l'aggiunta delle intestazioni Authorization ai nuovi tentativi di recupero dei contenuti multimediali (per impostazione predefinita, host Graph + Bot Framework).
- `channels.msteams.graphMediaFallback`: abilita le ricerche dei messaggi tramite Graph quando il codice HTML del canale/gruppo omette gli indicatori dei file (valore predefinito `false`; vedere [Recupero dei file di canali/gruppi](#channelgroup-file-recovery-graphmediafallback)).
- `channels.msteams.mediaMaxMb`: sostituzione del limite delle dimensioni dei contenuti multimediali per canale, in MB. Se non impostato, utilizza `agents.defaults.mediaMaxMb`.
- `channels.msteams.requireMention`: richiede una @menzione nei canali/gruppi (valore predefinito `true`).
- `channels.msteams.replyStyle`: `thread | top-level` (vedere [Stile delle risposte](#reply-style-threads-vs-posts)).
- `channels.msteams.teams.<teamId>.replyStyle`: sostituzione per team.
- `channels.msteams.teams.<teamId>.requireMention`: sostituzione per team.
- `channels.msteams.teams.<teamId>.tools`: sostituzioni predefinite dei criteri degli strumenti per team (`allow`/`deny`/`alsoAllow`), utilizzate quando manca una sostituzione per il canale.
- `channels.msteams.teams.<teamId>.toolsBySender`: sostituzioni predefinite dei criteri degli strumenti per team e mittente (carattere jolly `"*"` supportato).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`: sostituzione per canale.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.requireMention`: sostituzione per canale.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.tools`: sostituzioni dei criteri degli strumenti per canale (`allow`/`deny`/`alsoAllow`).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.toolsBySender`: sostituzioni dei criteri degli strumenti per canale e mittente (carattere jolly `"*"` supportato).
- Le chiavi `toolsBySender` devono utilizzare prefissi espliciti: `channel:`, `id:`, `e164:`, `username:`, `name:` (le chiavi legacy senza prefisso continuano a essere associate esclusivamente a `id:`).
- `channels.msteams.authType`: tipo di autenticazione: `"secret"` (valore predefinito) o `"federated"`.
- `channels.msteams.certificatePath`: percorso del file del certificato PEM (autenticazione federata + certificato).
- `channels.msteams.certificateThumbprint`: identificazione personale del certificato; accettata, ma non necessaria per l'autenticazione.
- `channels.msteams.useManagedIdentity`: abilita l'autenticazione tramite identità gestita (modalità federata).
- `channels.msteams.managedIdentityClientId`: ID client per l'identità gestita assegnata dall'utente.
- `channels.msteams.sharePointSiteId`: ID del sito SharePoint per il caricamento dei file nelle chat di gruppo/nei canali (vedere [Invio di file nelle chat di gruppo](#sending-files-in-group-chats)).
- `channels.msteams.welcomeCard`, `channels.msteams.groupWelcomeCard`, `channels.msteams.promptStarters`: Adaptive Card di benvenuto mostrata al primo contatto tramite DM/gruppo e relativi pulsanti con prompt suggeriti.
- `channels.msteams.responsePrefix`: testo anteposto alle risposte in uscita.
- `channels.msteams.feedbackEnabled` (valore predefinito `true`), `channels.msteams.feedbackReflection` (valore predefinito `true`), `channels.msteams.feedbackReflectionCooldownMs`: feedback positivo/negativo sulle risposte e successiva riflessione sul feedback negativo.
- `channels.msteams.sso`, `channels.msteams.delegatedAuth`: connessione OAuth di Bot Framework e ambiti Graph delegati per i flussi basati su SSO; `sso.enabled: true` richiede `sso.connectionName`.

## Instradamento e sessioni

- Le chiavi di sessione seguono il formato standard dell'agente (vedere [/concetti/sessione](/it/concepts/session)):
  - I messaggi diretti condividono la sessione principale (`agent:<agentId>:<mainKey>`).
  - I messaggi di canale/gruppo utilizzano l'ID della conversazione:
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## Stile delle risposte: thread e post

Teams dispone di due stili di interfaccia per i canali basati sullo stesso modello di dati sottostante:

| Stile                    | Descrizione                                               | `replyStyle` consigliato |
| ------------------------ | --------------------------------------------------------- | ------------------------ |
| **Post** (classico)      | I messaggi vengono visualizzati come schede con le risposte in thread sotto di essi | `thread` (valore predefinito)       |
| **Thread** (simile a Slack) | I messaggi scorrono in modo lineare, più simile a Slack                   | `top-level`              |

**Il problema:** l'API di Teams non indica quale stile di interfaccia utilizza un canale. Se si utilizza il valore `replyStyle` errato:

- `thread` in un canale in stile Thread → le risposte appaiono nidificate in modo innaturale.
- `top-level` in un canale in stile Post → le risposte appaiono come post separati di primo livello anziché all'interno del thread.

**Soluzione:** configurare `replyStyle` per ciascun canale in base alla relativa configurazione:

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

### Precedenza della risoluzione

Quando il bot invia una risposta in un canale, `replyStyle` viene risolto dalla sostituzione più specifica fino al valore predefinito. Il primo valore diverso da `undefined` ha la precedenza:

1. **Per canale** - `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`
2. **Per team** - `channels.msteams.teams.<teamId>.replyStyle`
3. **Globale** - `channels.msteams.replyStyle`
4. **Valore predefinito implicito** - derivato da `requireMention`:
   - `requireMention: true` → `thread`
   - `requireMention: false` → `top-level`

Se si imposta `requireMention: false` globalmente senza un valore `replyStyle` esplicito, le menzioni nei canali in stile Post vengono visualizzate come post di primo livello anche quando il messaggio in entrata era una risposta in un thread. Impostare in modo esplicito `replyStyle: "thread"` a livello globale, di team o di canale per evitare comportamenti imprevisti.

Per gli invii proattivi a una conversazione di canale archiviata (risposte alle chiamate di strumenti in coda, agenti con esecuzioni prolungate), si applica la stessa risoluzione per team/canale; per gli invii proattivi, le chat di gruppo e le conversazioni personali (DM) vengono sempre risolte in `top-level`, indipendentemente da `replyStyle`.

### Conservazione del contesto del thread

Quando è attivo `replyStyle: "thread"` e il bot è stato @menzionato all'interno di un thread di canale, OpenClaw ricollega la radice del thread originale al riferimento alla conversazione in uscita (`19:...@thread.tacv2;messageid=<root>`), in modo che la risposta venga inserita nello stesso thread. Ciò vale sia per gli invii in tempo reale (durante il turno) sia per quelli proattivi effettuati dopo la scadenza del contesto del turno di Bot Framework (ad esempio agenti con esecuzioni prolungate e risposte alle chiamate di strumenti in coda tramite `mcp__openclaw__message`).

La radice del thread viene ricavata dal valore `threadId` archiviato nel riferimento alla conversazione. I riferimenti archiviati meno recenti, precedenti a `threadId`, utilizzano come ripiego `activityId` (l'attività in entrata che ha inizializzato più recentemente la conversazione), in modo che le distribuzioni esistenti continuino a funzionare senza una nuova inizializzazione.

Quando è attivo `replyStyle: "top-level"`, ai messaggi in entrata nei thread dei canali viene intenzionalmente risposto con nuovi post di primo livello; non viene aggiunto alcun suffisso del thread. Questo comportamento è corretto per i canali in stile Thread; la presenza di post di primo livello quando ci si aspettano risposte in thread indica che `replyStyle` è impostato in modo errato per quel canale.

## Allegati e immagini

**Limitazioni attuali:**

- **DM:** le immagini e gli allegati di file funzionano tramite le API per i file dei bot di Teams.
- **Canali/gruppi:** gli allegati risiedono nello spazio di archiviazione M365 (SharePoint/OneDrive). Il payload del Webhook include solo uno stub HTML, non i byte effettivi del file. **Per scaricare gli allegati dei canali sono necessarie le autorizzazioni dell'API Graph**.
- Per gli invii espliciti incentrati sui file, utilizzare `action=upload-file` con `media` / `filePath` / `path`; il valore facoltativo `message` diventa il testo/commento di accompagnamento e `filename` (o `title`) sostituisce il nome del file caricato.

Senza le autorizzazioni Graph, i messaggi dei canali contenenti immagini arrivano solo come testo (il contenuto dell'immagine non è accessibile al bot).
Per impostazione predefinita, OpenClaw scarica i contenuti multimediali solo dai nomi host di Microsoft/Teams. Sostituire questa impostazione con `channels.msteams.mediaAllowHosts` (utilizzare `["*"]` per consentire qualsiasi host).
Le intestazioni Authorization vengono aggiunte solo per gli host inclusi in `channels.msteams.mediaAuthAllowHosts` (per impostazione predefinita, host Graph + Bot Framework). Mantenere questo elenco rigoroso (evitare i suffissi multi-tenant).

## Invio di file nelle chat di gruppo

I bot possono inviare file nei DM utilizzando il flusso FileConsentCard integrato. **L'invio di file nelle chat di gruppo/nei canali** richiede una configurazione aggiuntiva:

| Contesto                  | Modalità di invio dei file                           | Configurazione necessaria                                    |
| ------------------------ | -------------------------------------------- | ----------------------------------------------- |
| **DM**                  | FileConsentCard → l'utente accetta → il bot carica il file | Funziona senza configurazione aggiuntiva                            |
| **Chat di gruppo/canali** | Caricamento in SharePoint → scheda file nativa      | Richiede `sharePointSiteId` + autorizzazioni Graph |
| **Immagini (qualsiasi contesto)** | Incorporate con codifica Base64                        | Funziona senza configurazione aggiuntiva                            |

### Perché le chat di gruppo richiedono SharePoint

I bot utilizzano un'identità applicazione, mentre la risorsa `/me` di Microsoft Graph [richiede un utente connesso](https://learn.microsoft.com/en-us/graph/api/user-get?view=graph-rest-1.0). Per inviare file nelle chat di gruppo/nei canali, il bot esegue il caricamento in un **sito SharePoint** e crea un collegamento di condivisione.

### Configurazione

1. **Aggiungere le autorizzazioni dell'API Graph** in Entra ID (Azure AD) → App Registration:
   - `Sites.ReadWrite.All` (Applicazione) - consente di caricare file in SharePoint.
   - `ChatMember.Read.All` (Applicazione) - autorizzazione con privilegi minimi a livello di tenant per l'invio di file nelle chat di gruppo. Anche `Chat.Read.All` è supportata e copre già questa operazione quando è abilitata la cronologia delle chat di gruppo. Come alternativa per singola chat, utilizzare l'[autorizzazione di consenso specifica della risorsa](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent) `ChatMember.Read.Chat`.
2. **Concedere il consenso dell'amministratore** per il tenant.
3. **Ottenere l'ID del sito SharePoint:**

   ```bash
   # Tramite Graph Explorer o curl con un token valido:
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/{hostname}:/{site-path}"

   # Esempio: per un sito in "contoso.sharepoint.com/sites/BotFiles"
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com:/sites/BotFiles"

   # La risposta include: "id": "contoso.sharepoint.com,guid1,guid2"
   ```

4. **Configurare OpenClaw:**

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

| Contesto e autorizzazione                                               | Comportamento della condivisione                                  |
| ----------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Canale + `Sites.ReadWrite.All`                                             | Link di condivisione per l'intera organizzazione (accessibile a chiunque nell'organizzazione) |
| Chat di gruppo + `Sites.ReadWrite.All` + un'autorizzazione di lettura supportata per i membri della chat | Link di condivisione per utente (accessibile solo ai membri della chat) |
| Chat di gruppo senza un'autorizzazione di lettura supportata per i membri della chat | L'invio viene bloccato in modo sicuro                              |

La condivisione per utente è più sicura, poiché solo i partecipanti alla chat possono accedere al file. OpenClaw richiede che la ricerca dei membri riesca per le chat di gruppo; timeout, errori di trasporto, risultati vuoti e rifiuti dell'API Graph bloccano l'invio anziché estendere l'accesso all'intera organizzazione.

### Comportamento di ripiego

| Scenario                                                         | Risultato                                                        |
| ---------------------------------------------------------------- | ---------------------------------------------------------------- |
| Chat di gruppo + file + autorizzazioni SharePoint e dei membri configurate | Caricamento in SharePoint e invio di una scheda file nativa      |
| Chat di gruppo + file + autorizzazioni SharePoint o dei membri mancanti | Errore di configurazione con indicazioni operative               |
| Canale + file + `sharePointSiteId` configurato                   | Caricamento in SharePoint e invio di una scheda file nativa      |
| Chat personale + file                                            | Flusso FileConsentCard (funziona senza SharePoint)               |
| Qualsiasi contesto + immagine                                    | Incorporamento con codifica Base64 (funziona senza SharePoint)   |

### Posizione di archiviazione dei file

I file caricati vengono archiviati in una cartella `/OpenClawShared/` nella raccolta documenti predefinita del sito SharePoint configurato.

## Sondaggi (Adaptive Cards)

OpenClaw invia i sondaggi di Teams come Adaptive Cards (non esiste un'API nativa di Teams per i sondaggi).

- CLI: `openclaw message poll --channel msteams --target conversation:<id> --poll-question "..." --poll-option "..." --poll-option "..."`.
- I voti vengono registrati dal Gateway nel database SQLite dello stato del Plugin OpenClaw in `state/openclaw.sqlite`.
- I file `msteams-polls.json` esistenti vengono importati da `openclaw doctor --fix`, non dal Plugin in esecuzione.
- Il Gateway deve rimanere online per registrare i voti.
- I sondaggi non pubblicano automaticamente riepiloghi dei risultati e non esiste ancora una CLI per i risultati dei sondaggi.

## Schede di presentazione

Inviare payload di presentazione semantici a utenti o conversazioni di Teams utilizzando lo strumento `message`, la CLI o il normale recapito delle risposte. OpenClaw li rende come Adaptive Cards di Teams a partire dal contratto di presentazione generico.

Il parametro `presentation` accetta blocchi semantici. Quando viene fornito `presentation`, il testo del messaggio è facoltativo. I pulsanti vengono resi come azioni di invio o URL delle Adaptive Cards. I menu di selezione non sono nativi nel renderer di Teams, quindi OpenClaw li converte in testo leggibile prima del recapito.

**Strumento dell'agente:**

```json5
{
  action: "send",
  channel: "msteams",
  target: "user:<id>",
  presentation: {
    title: "Ciao",
    blocks: [{ type: "text", text: "Ciao!" }],
  },
}
```

**CLI:**

```bash
openclaw message send --channel msteams \
  --target "conversation:19:abc...@thread.tacv2" \
  --presentation '{"title":"Ciao","blocks":[{"type":"text","text":"Ciao!"}]}'
```

Per i dettagli sul formato delle destinazioni, vedere [Formati delle destinazioni](#target-formats) di seguito.

## Formati delle destinazioni

Le destinazioni MSTeams utilizzano prefissi per distinguere utenti e conversazioni:

| Tipo di destinazione | Formato                          | Esempio                                                                                                 |
| -------------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Utente (per ID)      | `user:<aad-object-id>`               | `user:40a1a0ed-4ff2-4164-a219-55518990c197`                                                                                      |
| Utente (per nome)    | `user:<display-name>`               | `user:John Smith` (richiede l'API Graph)                                                               |
| Gruppo/canale        | `conversation:<conversation-id>`               | `conversation:19:abc123...@thread.tacv2`                                                                                      |
| Gruppo/canale (grezzo) | `<conversation-id>`             | `19:abc123...@thread.tacv2`, `19:...@unq.gbl.spaces` o un ID Bot Framework `a:`/`8:orgid:`/`29:` senza prefisso |

**Esempi di CLI:**

```bash
# Invia a un utente tramite ID
openclaw message send --channel msteams --target "user:40a1a0ed-..." --message "Ciao"

# Invia a un utente tramite nome visualizzato (attiva la ricerca tramite API Graph)
openclaw message send --channel msteams --target "user:John Smith" --message "Ciao"

# Invia a una chat di gruppo o a un canale
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" --message "Ciao"

# Invia una scheda di presentazione a una conversazione
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" \
  --presentation '{"title":"Ciao","blocks":[{"type":"text","text":"Ciao"}]}'
```

**Esempi dello strumento dell'agente:**

```json5
{
  action: "send",
  channel: "msteams",
  target: "user:John Smith",
  message: "Ciao!",
}
```

```json5
{
  action: "send",
  channel: "msteams",
  target: "conversation:19:abc...@thread.tacv2",
  presentation: {
    title: "Ciao",
    blocks: [{ type: "text", text: "Ciao" }],
  },
}
```

<Note>
Senza il prefisso `user:`, per impostazione predefinita i nomi vengono risolti come gruppi o team. Utilizzare sempre `user:` quando si specificano persone tramite nome visualizzato.
</Note>

## Messaggistica proattiva

- I messaggi proattivi sono possibili solo **dopo** che un utente ha interagito, perché OpenClaw memorizza i riferimenti alla conversazione in quel momento.
- Vedere [/gateway/configuration](/it/gateway/configuration) per `dmPolicy` e il controllo tramite elenco di elementi consentiti.

## ID di team e canali (problema comune)

Il parametro di query `groupId` negli URL di Teams **NON** è l'ID del team utilizzato per la configurazione. Estrarre invece gli ID dal percorso dell'URL:

**URL del team:**

```text
https://teams.microsoft.com/l/team/19%3ABk4j...%40thread.tacv2/conversations?groupId=...
                                    └────────────────────────────┘
                                    ID conversazione del team (decodificare l'URL)
```

**URL del canale:**

```text
https://teams.microsoft.com/l/channel/19%3A15bc...%40thread.tacv2/ChannelName?groupId=...
                                      └─────────────────────────┘
                                      ID del canale (decodificare l'URL)
```

**Per la configurazione:**

- Chiave del team = segmento del percorso dopo `/team/` (con URL decodificato, ad esempio `19:Bk4j...@thread.tacv2`; i tenant meno recenti possono mostrare `@thread.skype`, anch'esso valido).
- Chiave del canale = segmento del percorso dopo `/channel/` (con URL decodificato).
- **Ignorare** il parametro di query `groupId` per l'instradamento di OpenClaw. È l'ID del gruppo Microsoft Entra, non l'ID conversazione di Bot Framework utilizzato nelle attività Teams in ingresso.

## Canali privati

I bot dispongono di un supporto limitato nei canali privati:

| Funzionalità                   | Canali standard | Canali privati                    |
| ----------------------------- | --------------- | --------------------------------- |
| Installazione del bot         | Sì              | Limitata                          |
| Messaggi in tempo reale (Webhook) | Sì          | Potrebbero non funzionare         |
| Autorizzazioni RSC            | Sì              | Potrebbero comportarsi diversamente |
| @menzioni                     | Sì              | Se il bot è accessibile           |
| Cronologia tramite API Graph  | Sì              | Sì (con autorizzazioni)           |

**Soluzioni alternative se i canali privati non funzionano:**

1. Utilizzare i canali standard per le interazioni con il bot.
2. Utilizzare i messaggi diretti; gli utenti possono sempre inviare messaggi direttamente al bot.
3. Utilizzare l'API Graph per accedere alla cronologia (richiede `ChannelMessage.Read.All`).

## Risoluzione dei problemi

### Problemi comuni

- **Le immagini non vengono visualizzate nei canali:** mancano le autorizzazioni Graph o il consenso dell'amministratore. Reinstallare l'app Teams, quindi chiudere completamente e riaprire Teams.
- **Nessuna risposta nel canale:** per impostazione predefinita sono richieste le menzioni; impostare `channels.msteams.requireMention=false` o configurare l'opzione per ogni team/canale.
- **Versione non corrispondente (Teams mostra ancora il vecchio manifesto):** rimuovere e aggiungere nuovamente l'app, quindi chiudere completamente Teams per aggiornarla.
- **401 Unauthorized dal Webhook:** è previsto durante i test manuali senza un JWT di Azure; indica che l'endpoint è raggiungibile, ma l'autenticazione non è riuscita. Utilizzare Azure Web Chat per eseguire correttamente il test.

### Errori di caricamento del manifesto

- **"Icon file cannot be empty":** il manifesto fa riferimento a file di icone di 0 byte. Creare icone PNG valide (32x32 per `outline.png`, 192x192 per `color.png`).
- **"webApplicationInfo.Id already in use":** l'app è ancora installata in un altro team o in un'altra chat. Individuarla e disinstallarla prima oppure attendere 5-10 minuti per la propagazione.
- **"Something went wrong" durante il caricamento:** caricare invece tramite [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com), aprire gli strumenti di sviluppo del browser (F12) → scheda Network e controllare il corpo della risposta per individuare l'errore effettivo.
- **Caricamento locale non riuscito:** provare "Upload an app to your org's app catalog" anziché "Upload a custom app"; spesso ciò consente di aggirare le restrizioni sul caricamento locale.

### Autorizzazioni RSC non funzionanti

1. Verificare che `webApplicationInfo.id` corrisponda esattamente all'ID app del bot.
2. Caricare nuovamente l'app e reinstallarla nel team o nella chat.
3. Verificare se l'amministratore dell'organizzazione ha bloccato le autorizzazioni RSC.
4. Confermare che sia utilizzato l'ambito corretto: `ChannelMessage.Read.Group` per i team, `ChatMessage.Read.Chat` per le chat di gruppo.

## Riferimenti

- [Creare un Azure Bot](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) - guida alla configurazione di Azure Bot
- [Portale per sviluppatori di Teams](https://dev.teams.microsoft.com/apps) - creazione e gestione delle app Teams
- [Schema del manifesto delle app Teams](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [Ricevere messaggi dei canali con RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [Riferimento delle autorizzazioni RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [Gestione dei file dei bot di Teams](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4) (i canali e i gruppi richiedono Graph)
- [Messaggistica proattiva](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)
- [@microsoft/teams.cli](https://www.npmjs.com/package/@microsoft/teams.cli) - CLI di Teams per la gestione dei bot

## Contenuti correlati

- [Panoramica dei canali](/it/channels) - tutti i canali supportati
- [Associazione](/it/channels/pairing) - autenticazione tramite messaggio diretto e flusso di associazione
- [Gruppi](/it/channels/groups) - comportamento delle chat di gruppo e filtro basato sulle menzioni
- [Instradamento dei canali](/it/channels/channel-routing) - instradamento delle sessioni per i messaggi
- [Sicurezza](/it/gateway/security) - modello di accesso e rafforzamento della sicurezza
