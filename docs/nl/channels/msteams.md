---
read_when:
    - Werken aan Microsoft Teams-kanaalfuncties
summary: Ondersteuningsstatus, mogelijkheden en configuratie van de Microsoft Teams-bot
title: Microsoft Teams
x-i18n:
    generated_at: "2026-05-06T17:52:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: be669545bd692754fbee8b670b1b482c39399a3d26e06a7ae01230fdaee645fe
    source_path: channels/msteams.md
    workflow: 16
---

Status: tekst + DM-bijlagen worden ondersteund; bestanden verzenden in kanalen/groepen vereist `sharePointSiteId` + Graph-machtigingen (zie [Bestanden verzenden in groepschats](#sending-files-in-group-chats)). Peilingen worden verzonden via Adaptive Cards. Berichtacties bieden expliciet `upload-file` voor verzendingen waarbij het bestand vooropstaat.

## Gebundelde Plugin

Microsoft Teams wordt als gebundelde Plugin meegeleverd in huidige OpenClaw-releases, dus in de normale verpakte build is geen aparte installatie vereist.

Als je een oudere build gebruikt of een aangepaste installatie die gebundelde Teams uitsluit, installeer dan het npm-pakket direct:

```bash
openclaw plugins install @openclaw/msteams
```

Gebruik het kale pakket om de huidige officiële releasetag te volgen. Pin een exacte versie alleen wanneer je een reproduceerbare installatie nodig hebt.

Lokale checkout (wanneer je vanuit een git-repo draait):

```bash
openclaw plugins install ./path/to/local/msteams-plugin
```

Details: [Plugins](/nl/tools/plugin)

## Snelle installatie

De [`@microsoft/teams.cli`](https://www.npmjs.com/package/@microsoft/teams.cli) handelt botregistratie, manifestaanmaak en het genereren van inloggegevens af met één opdracht.

**1. Installeer en log in**

```bash
npm install -g @microsoft/teams.cli@preview
teams login
teams status   # verify you're logged in and see your tenant info
```

<Note>
De Teams CLI is momenteel in preview. Opdrachten en flags kunnen tussen releases veranderen.
</Note>

**2. Start een tunnel** (Teams kan localhost niet bereiken)

Installeer en authenticeer de devtunnel CLI als je dat nog niet hebt gedaan ([handleiding om te beginnen](https://learn.microsoft.com/en-us/azure/developer/dev-tunnels/get-started)).

```bash
# One-time setup (persistent URL across sessions):
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# Each dev session:
devtunnel host my-openclaw-bot
# Your endpoint: https://<tunnel-id>.devtunnels.ms/api/messages
```

<Note>
`--allow-anonymous` is vereist omdat Teams niet kan authenticeren met devtunnels. Elk binnenkomend botverzoek wordt nog steeds automatisch gevalideerd door de Teams SDK.
</Note>

Alternatieven: `ngrok http 3978` of `tailscale funnel 3978` (maar deze kunnen per sessie URL's wijzigen).

**3. Maak de app**

```bash
teams app create \
  --name "OpenClaw" \
  --endpoint "https://<your-tunnel-url>/api/messages"
```

Deze ene opdracht:

- Maakt een Entra ID-toepassing (Azure AD) aan
- Genereert een clientgeheim
- Bouwt en uploadt een Teams-appmanifest (met pictogrammen)
- Registreert de bot (standaard door Teams beheerd - geen Azure-abonnement nodig)

De uitvoer toont `CLIENT_ID`, `CLIENT_SECRET`, `TENANT_ID` en een **Teams-app-ID** - noteer deze voor de volgende stappen. De uitvoer biedt ook aan om de app direct in Teams te installeren.

**4. Configureer OpenClaw** met de inloggegevens uit de uitvoer:

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

Of gebruik omgevingsvariabelen direct: `MSTEAMS_APP_ID`, `MSTEAMS_APP_PASSWORD`, `MSTEAMS_TENANT_ID`.

**5. Installeer de app in Teams**

`teams app create` vraagt je om de app te installeren - selecteer "Install in Teams". Als je dit hebt overgeslagen, kun je de link later ophalen:

```bash
teams app get <teamsAppId> --install-link
```

**6. Controleer of alles werkt**

```bash
teams app doctor <teamsAppId>
```

Dit voert diagnostiek uit voor botregistratie, AAD-appconfiguratie, manifestgeldigheid en SSO-installatie.

Overweeg voor productie-implementaties [gefedereerde authenticatie](/nl/channels/msteams#federated-authentication-certificate-plus-managed-identity) (certificaat of beheerde identiteit) te gebruiken in plaats van clientgeheimen.

<Note>
Groepschats worden standaard geblokkeerd (`channels.msteams.groupPolicy: "allowlist"`). Stel `channels.msteams.groupAllowFrom` in om groepsantwoorden toe te staan, of gebruik `groupPolicy: "open"` om elk lid toe te staan (vermelding vereist).
</Note>

## Doelen

- Praat met OpenClaw via Teams-DM's, groepschats of kanalen.
- Houd routering deterministisch: antwoorden gaan altijd terug naar het kanaal waarop ze zijn binnengekomen.
- Gebruik standaard veilig kanaalgedrag (vermeldingen vereist tenzij anders geconfigureerd).

## Configuratieschrijfacties

Standaard mag Microsoft Teams configuratie-updates schrijven die worden geactiveerd door `/config set|unset` (vereist `commands.config: true`).

Uitschakelen met:

```json5
{
  channels: { msteams: { configWrites: false } },
}
```

## Toegangsbeheer (DM's + groepen)

**DM-toegang**

- Standaard: `channels.msteams.dmPolicy = "pairing"`. Onbekende afzenders worden genegeerd totdat ze zijn goedgekeurd.
- `channels.msteams.allowFrom` moet stabiele AAD-object-ID's gebruiken.
- Vertrouw niet op UPN-/weergavenaamvergelijking voor allowlists - die kunnen veranderen. OpenClaw schakelt directe naamvergelijking standaard uit; schakel dit expliciet in met `channels.msteams.dangerouslyAllowNameMatching: true`.
- De wizard kan namen naar ID's omzetten via Microsoft Graph wanneer de inloggegevens dit toestaan.

**Groepstoegang**

- Standaard: `channels.msteams.groupPolicy = "allowlist"` (geblokkeerd tenzij je `groupAllowFrom` toevoegt). Gebruik `channels.defaults.groupPolicy` om de standaard te overschrijven wanneer deze niet is ingesteld.
- `channels.msteams.groupAllowFrom` bepaalt welke afzenders in groepschats/kanalen kunnen activeren (valt terug op `channels.msteams.allowFrom`).
- Stel `groupPolicy: "open"` in om elk lid toe te staan (standaard nog steeds alleen bij vermelding).
- Stel `channels.msteams.groupPolicy: "disabled"` in om **geen kanalen** toe te staan.

Voorbeeld:

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

**Teams + kanaal-allowlist**

- Beperk groeps-/kanaalantwoorden door teams en kanalen te vermelden onder `channels.msteams.teams`.
- Sleutels moeten stabiele Teams-gespreks-ID's uit Teams-links gebruiken, geen veranderlijke weergavenamen.
- Wanneer `groupPolicy="allowlist"` en een teams-allowlist aanwezig is, worden alleen vermelde teams/kanalen geaccepteerd (vermelding vereist).
- De configuratiewizard accepteert `Team/Channel`-vermeldingen en slaat ze voor je op.
- Bij het opstarten zet OpenClaw team-/kanaal- en gebruikersnamen in allowlists om naar ID's (wanneer Graph-machtigingen dit toestaan)
  en logt de mapping; niet-opgeloste team-/kanaalnamen worden bewaard zoals ingevoerd, maar standaard genegeerd voor routering tenzij `channels.msteams.dangerouslyAllowNameMatching: true` is ingeschakeld.

Voorbeeld:

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
<summary><strong>Handmatige installatie (zonder de Teams CLI)</strong></summary>

Als je de Teams CLI niet kunt gebruiken, kun je de bot handmatig instellen via de Azure Portal.

### Hoe het werkt

1. Zorg dat de Microsoft Teams Plugin beschikbaar is (gebundeld in huidige releases).
2. Maak een **Azure Bot** aan (App-ID + geheim + tenant-ID).
3. Bouw een **Teams-apppakket** dat naar de bot verwijst en de onderstaande RSC-machtigingen bevat.
4. Upload/installeer de Teams-app in een team (of persoonlijke scope voor DM's).
5. Configureer `msteams` in `~/.openclaw/openclaw.json` (of env-vars) en start de Gateway.
6. De Gateway luistert standaard naar Bot Framework-Webhook-verkeer op `/api/messages`.

### Stap 1: Maak Azure Bot aan

1. Ga naar [Azure Bot maken](https://portal.azure.com/#create/Microsoft.AzureBot)
2. Vul het tabblad **Basis** in:

   | Veld               | Waarde                                                   |
   | ------------------ | -------------------------------------------------------- |
   | **Bothandle**      | Je botnaam, bijv. `openclaw-msteams` (moet uniek zijn)   |
   | **Abonnement**     | Selecteer je Azure-abonnement                            |
   | **Resourcegroep**  | Maak nieuw aan of gebruik bestaande                      |
   | **Prijscategorie** | **Gratis** voor dev/testing                              |
   | **Type app**       | **Single Tenant** (aanbevolen - zie opmerking hieronder) |
   | **Aanmaaktype**    | **Create new Microsoft App ID**                          |

<Warning>
Het aanmaken van nieuwe multitenant-bots is na 2025-07-31 afgeschaft. Gebruik **Single Tenant** voor nieuwe bots.
</Warning>

3. Klik op **Review + create** → **Create** (wacht ~1-2 minuten)

### Stap 2: Haal inloggegevens op

1. Ga naar je Azure Bot-resource → **Configuration**
2. Kopieer **Microsoft App ID** → dit is je `appId`
3. Klik op **Manage Password** → ga naar de App Registration
4. Onder **Certificates & secrets** → **New client secret** → kopieer de **Value** → dit is je `appPassword`
5. Ga naar **Overview** → kopieer **Directory (tenant) ID** → dit is je `tenantId`

### Stap 3: Configureer Messaging Endpoint

1. In Azure Bot → **Configuration**
2. Stel **Messaging endpoint** in op je Webhook-URL:
   - Productie: `https://your-domain.com/api/messages`
   - Lokale ontwikkeling: gebruik een tunnel (zie [Lokale ontwikkeling](#local-development-tunneling) hieronder)

### Stap 4: Schakel Teams Channel in

1. In Azure Bot → **Channels**
2. Klik op **Microsoft Teams** → Configure → Save
3. Accepteer de servicevoorwaarden

### Stap 5: Bouw Teams-appmanifest

- Neem een `bot`-vermelding op met `botId = <App ID>`.
- Scopes: `personal`, `team`, `groupChat`.
- `supportsFiles: true` (vereist voor bestandsafhandeling in persoonlijke scope).
- Voeg RSC-machtigingen toe (zie [RSC-machtigingen](#current-teams-rsc-permissions-manifest)).
- Maak pictogrammen: `outline.png` (32x32) en `color.png` (192x192).
- Zip alle drie bestanden samen: `manifest.json`, `outline.png`, `color.png`.

### Stap 6: Configureer OpenClaw

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

Omgevingsvariabelen: `MSTEAMS_APP_ID`, `MSTEAMS_APP_PASSWORD`, `MSTEAMS_TENANT_ID`.

### Stap 7: Start de Gateway

Het Teams-kanaal start automatisch wanneer de Plugin beschikbaar is en `msteams`-configuratie met inloggegevens bestaat.

</details>

## Gefedereerde authenticatie (certificaat plus beheerde identiteit)

> Toegevoegd in 2026.4.11

Voor productie-implementaties ondersteunt OpenClaw **gefedereerde authenticatie** als veiliger alternatief voor clientgeheimen. Er zijn twee methoden beschikbaar:

### Optie A: authenticatie op basis van certificaat

Gebruik een PEM-certificaat dat is geregistreerd bij je Entra ID-appregistratie.

**Installatie:**

1. Genereer of verkrijg een certificaat (PEM-indeling met privésleutel).
2. In Entra ID → App Registration → **Certificates & secrets** → **Certificates** → upload het openbare certificaat.

**Configuratie:**

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

**Env-vars:**

- `MSTEAMS_AUTH_TYPE=federated`
- `MSTEAMS_CERTIFICATE_PATH=/path/to/cert.pem`

### Optie B: Azure Managed Identity

Gebruik Azure Managed Identity voor authenticatie zonder wachtwoord. Dit is ideaal voor implementaties op Azure-infrastructuur (AKS, App Service, Azure-VM's) waar een beheerde identiteit beschikbaar is.

**Hoe het werkt:**

1. De bot-pod/VM heeft een beheerde identiteit (door het systeem toegewezen of door de gebruiker toegewezen).
2. Een **federated identity credential** koppelt de beheerde identiteit aan de Entra ID-appregistratie.
3. Tijdens runtime gebruikt OpenClaw `@azure/identity` om tokens op te halen van het Azure IMDS-eindpunt (`169.254.169.254`).
4. Het token wordt doorgegeven aan de Teams SDK voor botauthenticatie.

**Vereisten:**

- Azure-infrastructuur met beheerde identiteit ingeschakeld (AKS-workloadidentiteit, App Service, VM)
- Federated identity credential aangemaakt op de Entra ID-appregistratie
- Netwerktoegang tot IMDS (`169.254.169.254:80`) vanaf de pod/VM

**Configuratie (door systeem toegewezen beheerde identiteit):**

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

**Configuratie (door gebruiker toegewezen Managed Identity):**

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

**Omgevingsvariabelen:**

- `MSTEAMS_AUTH_TYPE=federated`
- `MSTEAMS_USE_MANAGED_IDENTITY=true`
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID=<client-id>` (alleen voor door gebruiker toegewezen)

### AKS Workload Identity instellen

Voor AKS-implementaties die Workload Identity gebruiken:

1. **Schakel Workload Identity in** op je AKS-cluster.
2. **Maak een federated identity credential aan** op de Entra ID-appregistratie:

   ```bash
   az ad app federated-credential create --id <APP_OBJECT_ID> --parameters '{
     "name": "my-bot-workload-identity",
     "issuer": "<AKS_OIDC_ISSUER_URL>",
     "subject": "system:serviceaccount:<NAMESPACE>:<SERVICE_ACCOUNT>",
     "audiences": ["api://AzureADTokenExchange"]
   }'
   ```

3. **Annoteer het Kubernetes-serviceaccount** met de app-client-ID:

   ```yaml
   apiVersion: v1
   kind: ServiceAccount
   metadata:
     name: my-bot-sa
     annotations:
       azure.workload.identity/client-id: "<APP_CLIENT_ID>"
   ```

4. **Label de pod** voor Workload Identity-injectie:

   ```yaml
   metadata:
     labels:
       azure.workload.identity/use: "true"
   ```

5. **Zorg voor netwerktoegang** tot IMDS (`169.254.169.254`) - als je NetworkPolicy gebruikt, voeg dan een egress-regel toe die verkeer naar `169.254.169.254/32` op poort 80 toestaat.

### Vergelijking van authenticatietypen

| Methode              | Configuratie                                  | Voordelen                             | Nadelen                                         |
| -------------------- | -------------------------------------------- | ------------------------------------- | ----------------------------------------------- |
| **Clientgeheim**     | `appPassword`                                | Eenvoudige instelling                 | Geheimrotatie vereist, minder veilig            |
| **Certificaat**      | `authType: "federated"` + `certificatePath`  | Geen gedeeld geheim via het netwerk   | Extra beheerlast voor certificaten              |
| **Managed Identity** | `authType: "federated"` + `useManagedIdentity` | Zonder wachtwoord, geen geheimen te beheren | Azure-infrastructuur vereist              |

**Standaardgedrag:** Wanneer `authType` niet is ingesteld, valt OpenClaw standaard terug op authenticatie met een clientgeheim. Bestaande configuraties blijven zonder wijzigingen werken.

## Lokale ontwikkeling (tunneling)

Teams kan `localhost` niet bereiken. Gebruik een blijvende ontwikkeltunnel zodat je URL tussen sessies hetzelfde blijft:

```bash
# One-time setup:
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# Each dev session:
devtunnel host my-openclaw-bot
```

Alternatieven: `ngrok http 3978` of `tailscale funnel 3978` (URL's kunnen per sessie veranderen).

Als je tunnel-URL verandert, werk dan het endpoint bij:

```bash
teams app update <teamsAppId> --endpoint "https://<new-url>/api/messages"
```

## De bot testen

**Diagnostiek uitvoeren:**

```bash
teams app doctor <teamsAppId>
```

Controleert botregistratie, AAD-app, manifest en SSO-configuratie in één keer.

**Een testbericht sturen:**

1. Installeer de Teams-app (gebruik de installatielink uit `teams app get <id> --install-link`)
2. Zoek de bot in Teams en stuur een DM
3. Controleer de Gateway-logs op binnenkomende activiteit

## Omgevingsvariabelen

Alle configuratiesleutels kunnen in plaats daarvan via omgevingsvariabelen worden ingesteld:

- `MSTEAMS_APP_ID`
- `MSTEAMS_APP_PASSWORD`
- `MSTEAMS_TENANT_ID`
- `MSTEAMS_AUTH_TYPE` (optioneel: `"secret"` of `"federated"`)
- `MSTEAMS_CERTIFICATE_PATH` (federated + certificaat)
- `MSTEAMS_CERTIFICATE_THUMBPRINT` (optioneel, niet vereist voor auth)
- `MSTEAMS_USE_MANAGED_IDENTITY` (federated + Managed Identity)
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID` (alleen door gebruiker toegewezen MI)

## Actie voor ledeninformatie

OpenClaw biedt een door Graph ondersteunde `member-info`-actie voor Microsoft Teams, zodat agents en automatiseringen details van kanaalleden (weergavenaam, e-mail, rol) rechtstreeks vanuit Microsoft Graph kunnen ophalen.

Vereisten:

- RSC-machtiging `Member.Read.Group` (al opgenomen in het aanbevolen manifest)
- Voor opzoekacties tussen teams: Graph Application-machtiging `User.Read.All` met beheerderstoestemming

De actie wordt beheerd door `channels.msteams.actions.memberInfo` (standaard: ingeschakeld wanneer Graph-referenties beschikbaar zijn).

## Geschiedeniscontext

- `channels.msteams.historyLimit` bepaalt hoeveel recente kanaal-/groepsberichten in de prompt worden opgenomen.
- Valt terug op `messages.groupChat.historyLimit`. Stel in op `0` om uit te schakelen (standaard 50).
- Opgehaalde threadgeschiedenis wordt gefilterd op afzender-allowlists (`allowFrom` / `groupAllowFrom`), zodat het vullen van threadcontext alleen berichten van toegestane afzenders bevat.
- Context van geciteerde bijlagen (`ReplyTo*` afgeleid uit Teams-antwoord-HTML) wordt momenteel ongewijzigd doorgegeven.
- Met andere woorden: allowlists bepalen wie de agent kan activeren; alleen specifieke aanvullende contextpaden worden vandaag gefilterd.
- DM-geschiedenis kan worden beperkt met `channels.msteams.dmHistoryLimit` (gebruikersbeurten). Overrides per gebruiker: `channels.msteams.dms["<user_id>"].historyLimit`.

## Huidige Teams RSC-machtigingen (manifest)

Dit zijn de **bestaande resourceSpecific-machtigingen** in ons Teams-appmanifest. Ze gelden alleen binnen het team/de chat waar de app is geïnstalleerd.

**Voor kanalen (teambereik):**

- `ChannelMessage.Read.Group` (Application) - alle kanaalberichten ontvangen zonder @mention
- `ChannelMessage.Send.Group` (Application)
- `Member.Read.Group` (Application)
- `Owner.Read.Group` (Application)
- `ChannelSettings.Read.Group` (Application)
- `TeamMember.Read.Group` (Application)
- `TeamSettings.Read.Group` (Application)

**Voor groepschats:**

- `ChatMessage.Read.Chat` (Application) - alle groepschatberichten ontvangen zonder @mention

RSC-machtigingen toevoegen via de Teams CLI:

```bash
teams app rsc add <teamsAppId> ChannelMessage.Read.Group --type Application
```

## Voorbeeld van Teams-manifest (geredigeerd)

Minimaal, geldig voorbeeld met de vereiste velden. Vervang ID's en URL's.

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

### Manifestwaarschuwingen (vereiste velden)

- `bots[].botId` **moet** overeenkomen met de Azure Bot App ID.
- `webApplicationInfo.id` **moet** overeenkomen met de Azure Bot App ID.
- `bots[].scopes` moet de oppervlakken bevatten die je wilt gebruiken (`personal`, `team`, `groupChat`).
- `bots[].supportsFiles: true` is vereist voor bestandsverwerking in persoonlijk bereik.
- `authorization.permissions.resourceSpecific` moet kanaal lezen/verzenden bevatten als je kanaalverkeer wilt.

### Een bestaande app bijwerken

Een al geïnstalleerde Teams-app bijwerken (bijvoorbeeld om RSC-machtigingen toe te voegen):

```bash
# Download, edit, and re-upload the manifest
teams app manifest download <teamsAppId> manifest.json
# Edit manifest.json locally...
teams app manifest upload manifest.json <teamsAppId>
# Version is auto-bumped if content changed
```

Na het bijwerken moet je de app opnieuw installeren in elk team zodat nieuwe machtigingen van kracht worden, en **Teams volledig afsluiten en opnieuw starten** (niet alleen het venster sluiten) om appmetadata in de cache te wissen.

<details>
<summary>Handmatige manifestupdate (zonder CLI)</summary>

1. Werk je `manifest.json` bij met de nieuwe instellingen
2. **Verhoog het veld `version`** (bijvoorbeeld `1.0.0` → `1.1.0`)
3. **Zip het manifest opnieuw** met pictogrammen (`manifest.json`, `outline.png`, `color.png`)
4. Upload de nieuwe zip:
   - **Teams Admin Center:** Teams-apps → Apps beheren → zoek je app → Nieuwe versie uploaden
   - **Sideload:** In Teams → Apps → Je apps beheren → Een aangepaste app uploaden

</details>

## Mogelijkheden: alleen RSC versus Graph

### Met **alleen Teams RSC** (app geïnstalleerd, geen Graph API-machtigingen)

Werkt:

- **Tekstinhoud** van kanaalberichten lezen.
- **Tekstinhoud** van kanaalberichten verzenden.
- Bestandsbijlagen in **persoonlijke berichten (DM)** ontvangen.

Werkt NIET:

- **Afbeeldings- of bestandsinhoud** in kanaal/groep (payload bevat alleen HTML-stub).
- Bijlagen downloaden die in SharePoint/OneDrive zijn opgeslagen.
- Berichtgeschiedenis lezen (buiten de live Webhook-gebeurtenis).

### Met **Teams RSC + Microsoft Graph Application-machtigingen**

Voegt toe:

- Gehoste inhoud downloaden (afbeeldingen die in berichten zijn geplakt).
- Bestandsbijlagen downloaden die in SharePoint/OneDrive zijn opgeslagen.
- Kanaal-/chatberichtgeschiedenis lezen via Graph.

### RSC versus Graph API

| Mogelijkheid             | RSC-machtigingen      | Graph API                                      |
| ------------------------ | --------------------- | ---------------------------------------------- |
| **Realtime berichten**   | Ja (via Webhook)      | Nee (alleen polling)                           |
| **Historische berichten** | Nee                  | Ja (kan geschiedenis opvragen)                 |
| **Complexiteit van instelling** | Alleen appmanifest | Vereist beheerderstoestemming + tokenstroom |
| **Werkt offline**        | Nee (moet draaien)    | Ja (op elk moment opvragen)                    |

**Kort samengevat:** RSC is voor realtime luisteren; Graph API is voor historische toegang. Om gemiste berichten in te halen terwijl je offline was, heb je Graph API nodig met `ChannelMessage.Read.All` (vereist beheerderstoestemming).

## Media + geschiedenis met Graph ingeschakeld (vereist voor kanalen)

Als je afbeeldingen/bestanden in **kanalen** nodig hebt of **berichtgeschiedenis** wilt ophalen, moet je Microsoft Graph-machtigingen inschakelen en beheerderstoestemming verlenen.

1. Voeg in Entra ID (Azure AD) **App Registration** Microsoft Graph **Application-machtigingen** toe:
   - `ChannelMessage.Read.All` (kanaalbijlagen + geschiedenis)
   - `Chat.Read.All` of `ChatMessage.Read.All` (groepschats)
2. **Verleen beheerderstoestemming** voor de tenant.
3. Verhoog de **manifestversie** van de Teams-app, upload opnieuw en **installeer de app opnieuw in Teams**.
4. **Sluit Teams volledig af en start opnieuw** om appmetadata in de cache te wissen.

**Aanvullende machtiging voor gebruikersvermeldingen:** User @mentions werken standaard voor gebruikers in het gesprek. Als je echter dynamisch gebruikers wilt zoeken en vermelden die **niet in het huidige gesprek** zitten, voeg dan de machtiging `User.Read.All` (Application) toe en verleen beheerderstoestemming.

## Bekende beperkingen

### Webhook-time-outs

Teams levert berichten via HTTP Webhook. Als verwerking te lang duurt (bijvoorbeeld trage LLM-antwoorden), kun je het volgende zien:

- Gateway-time-outs
- Teams probeert het bericht opnieuw (waardoor duplicaten ontstaan)
- Weggevallen antwoorden

OpenClaw handelt dit af door snel terug te keren en antwoorden proactief te verzenden, maar zeer trage antwoorden kunnen nog steeds problemen veroorzaken.

### Opmaak

Teams-markdown is beperkter dan Slack of Discord:

- Basisopmaak werkt: **vet**, _cursief_, `code`, links
- Complexe markdown (tabellen, geneste lijsten) wordt mogelijk niet correct weergegeven
- Adaptive Cards worden ondersteund voor peilingen en semantische presentatiesends (zie hieronder)

## Configuratie

Belangrijke instellingen (zie `/gateway/configuration` voor gedeelde kanaalpatronen):

- `channels.msteams.enabled`: schakel het kanaal in/uit.
- `channels.msteams.appId`, `channels.msteams.appPassword`, `channels.msteams.tenantId`: botreferenties.
- `channels.msteams.webhook.port` (standaard `3978`)
- `channels.msteams.webhook.path` (standaard `/api/messages`)
- `channels.msteams.dmPolicy`: `pairing | allowlist | open | disabled` (standaard: pairing)
- `channels.msteams.allowFrom`: DM-toelatingslijst (AAD-object-ID's aanbevolen). De wizard zet namen tijdens de configuratie om naar ID's wanneer Graph-toegang beschikbaar is.
- `channels.msteams.dangerouslyAllowNameMatching`: noodschakelaar om wijzigbare matching op UPN/weergavenaam en directe routering op team-/kanaalnaam opnieuw in te schakelen.
- `channels.msteams.textChunkLimit`: chunkgrootte voor uitgaande tekst.
- `channels.msteams.chunkMode`: `length` (standaard) of `newline` om op lege regels (alinea-grenzen) te splitsen voordat op lengte wordt opgesplitst.
- `channels.msteams.mediaAllowHosts`: toelatingslijst voor hosts van inkomende bijlagen (standaard Microsoft-/Teams-domeinen).
- `channels.msteams.mediaAuthAllowHosts`: toelatingslijst voor het toevoegen van Authorization-headers bij mediapogingen opnieuw (standaard Graph + Bot Framework-hosts).
- `channels.msteams.requireMention`: vereis @mention in kanalen/groepen (standaard true).
- `channels.msteams.replyStyle`: `thread | top-level` (zie [Antwoordstijl](#reply-style-threads-vs-posts)).
- `channels.msteams.teams.<teamId>.replyStyle`: overschrijving per team.
- `channels.msteams.teams.<teamId>.requireMention`: overschrijving per team.
- `channels.msteams.teams.<teamId>.tools`: standaard overschrijvingen per team voor toolbeleid (`allow`/`deny`/`alsoAllow`) die worden gebruikt wanneer een kanaaloverschrijving ontbreekt.
- `channels.msteams.teams.<teamId>.toolsBySender`: standaard overschrijvingen per team en per afzender voor toolbeleid (`"*"` wildcard ondersteund).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`: overschrijving per kanaal.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.requireMention`: overschrijving per kanaal.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.tools`: overschrijvingen per kanaal voor toolbeleid (`allow`/`deny`/`alsoAllow`).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.toolsBySender`: overschrijvingen per kanaal en per afzender voor toolbeleid (`"*"` wildcard ondersteund).
- `toolsBySender`-sleutels moeten expliciete voorvoegsels gebruiken:
  `id:`, `e164:`, `username:`, `name:` (verouderde sleutels zonder voorvoegsel worden nog steeds alleen aan `id:` gekoppeld).
- `channels.msteams.actions.memberInfo`: schakel de door Graph ondersteunde actie voor ledeninformatie in of uit (standaard: ingeschakeld wanneer Graph-referenties beschikbaar zijn).
- `channels.msteams.authType`: authenticatietype - `"secret"` (standaard) of `"federated"`.
- `channels.msteams.certificatePath`: pad naar PEM-certificaatbestand (federated + certificaatauthenticatie).
- `channels.msteams.certificateThumbprint`: certificaatvingerafdruk (optioneel, niet vereist voor authenticatie).
- `channels.msteams.useManagedIdentity`: schakel authenticatie met managed identity in (federated-modus).
- `channels.msteams.managedIdentityClientId`: client-ID voor door de gebruiker toegewezen managed identity.
- `channels.msteams.sharePointSiteId`: SharePoint-site-ID voor bestandsuploads in groepschats/kanalen (zie [Bestanden verzenden in groepschats](#sending-files-in-group-chats)).

## Routering en sessies

- Sessiesleutels volgen de standaard agent-indeling (zie [/concepts/session](/nl/concepts/session)):
  - Directe berichten delen de hoofdsessie (`agent:<agentId>:<mainKey>`).
  - Kanaal-/groepsberichten gebruiken conversatie-ID:
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## Antwoordstijl: threads versus berichten

Teams heeft onlangs twee kanaal-UI-stijlen geïntroduceerd bovenop hetzelfde onderliggende datamodel:

| Stijl                    | Beschrijving                                               | Aanbevolen `replyStyle` |
| ------------------------ | ---------------------------------------------------------- | ----------------------- |
| **Berichten** (klassiek) | Berichten verschijnen als kaarten met threaded antwoorden eronder | `thread` (standaard)    |
| **Threads** (Slack-achtig) | Berichten lopen lineair, meer zoals Slack                | `top-level`             |

**Het probleem:** De Teams API geeft niet vrij welke UI-stijl een kanaal gebruikt. Als je de verkeerde `replyStyle` gebruikt:

- `thread` in een kanaal met Threads-stijl → antwoorden verschijnen onhandig genest
- `top-level` in een kanaal met Berichten-stijl → antwoorden verschijnen als afzonderlijke top-level berichten in plaats van in-thread

**Oplossing:** Configureer `replyStyle` per kanaal op basis van hoe het kanaal is ingesteld:

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

## Bijlagen en afbeeldingen

**Huidige beperkingen:**

- **DM's:** Afbeeldingen en bestandsbijlagen werken via Teams bot-bestands-API's.
- **Kanalen/groepen:** Bijlagen staan in M365-opslag (SharePoint/OneDrive). De Webhook-payload bevat alleen een HTML-stub, niet de daadwerkelijke bestandsbytes. **Graph API-machtigingen zijn vereist** om kanaalbijlagen te downloaden.
- Gebruik voor expliciete file-first sends `action=upload-file` met `media` / `filePath` / `path`; optioneel wordt `message` de begeleidende tekst/opmerking, en `filename` overschrijft de geüploade naam.

Zonder Graph-machtigingen worden kanaalberichten met afbeeldingen ontvangen als alleen tekst (de afbeeldingsinhoud is niet toegankelijk voor de bot).
Standaard downloadt OpenClaw alleen media van Microsoft-/Teams-hostnamen. Overschrijf dit met `channels.msteams.mediaAllowHosts` (gebruik `["*"]` om elke host toe te staan).
Authorization-headers worden alleen toegevoegd voor hosts in `channels.msteams.mediaAuthAllowHosts` (standaard Graph + Bot Framework-hosts). Houd deze lijst strikt (vermijd multi-tenant suffixen).

## Bestanden verzenden in groepschats

Bots kunnen bestanden in DM's verzenden met de FileConsentCard-flow (ingebouwd). **Bestanden verzenden in groepschats/kanalen** vereist echter extra configuratie:

| Context                  | Hoe bestanden worden verzonden              | Benodigde configuratie                          |
| ------------------------ | ------------------------------------------- | ----------------------------------------------- |
| **DM's**                 | FileConsentCard → gebruiker accepteert → bot uploadt | Werkt direct                             |
| **Groepschats/kanalen**  | Uploaden naar SharePoint → link delen       | Vereist `sharePointSiteId` + Graph-machtigingen |
| **Afbeeldingen (elke context)** | Base64-gecodeerd inline               | Werkt direct                                    |

### Waarom groepschats SharePoint nodig hebben

Bots hebben geen persoonlijke OneDrive-drive (het Graph API-eindpunt `/me/drive` werkt niet voor applicatie-identiteiten). Om bestanden in groepschats/kanalen te verzenden, uploadt de bot naar een **SharePoint-site** en maakt hij een deellink.

### Configuratie

1. **Voeg Graph API-machtigingen toe** in Entra ID (Azure AD) → App Registration:
   - `Sites.ReadWrite.All` (Application) - bestanden uploaden naar SharePoint
   - `Chat.Read.All` (Application) - optioneel, maakt deellinks per gebruiker mogelijk

2. **Verleen beheerderstoestemming** voor de tenant.

3. **Haal je SharePoint-site-ID op:**

   ```bash
   # Via Graph Explorer or curl with a valid token:
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/{hostname}:/{site-path}"

   # Example: for a site at "contoso.sharepoint.com/sites/BotFiles"
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com:/sites/BotFiles"

   # Response includes: "id": "contoso.sharepoint.com,guid1,guid2"
   ```

4. **Configureer OpenClaw:**

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

### Deelgedrag

| Machtiging                              | Deelgedrag                                                |
| --------------------------------------- | --------------------------------------------------------- |
| Alleen `Sites.ReadWrite.All`            | Organisatiebrede deellink (iedereen in de organisatie heeft toegang) |
| `Sites.ReadWrite.All` + `Chat.Read.All` | Deellink per gebruiker (alleen chatleden hebben toegang)  |

Delen per gebruiker is veiliger, omdat alleen de chatdeelnemers toegang hebben tot het bestand. Als de machtiging `Chat.Read.All` ontbreekt, valt de bot terug op organisatiebreed delen.

### Fallbackgedrag

| Scenario                                          | Resultaat                                          |
| ------------------------------------------------- | -------------------------------------------------- |
| Groepschat + bestand + `sharePointSiteId` geconfigureerd | Uploaden naar SharePoint, deellink verzenden |
| Groepschat + bestand + geen `sharePointSiteId`    | OneDrive-upload proberen (kan mislukken), alleen tekst verzenden |
| Persoonlijke chat + bestand                       | FileConsentCard-flow (werkt zonder SharePoint)     |
| Elke context + afbeelding                         | Base64-gecodeerd inline (werkt zonder SharePoint)  |

### Locatie van opgeslagen bestanden

Geüploade bestanden worden opgeslagen in een map `/OpenClawShared/` in de standaard documentbibliotheek van de geconfigureerde SharePoint-site.

## Peilingen (Adaptive Cards)

OpenClaw verzendt Teams-peilingen als Adaptive Cards (er is geen native Teams-peiling-API).

- CLI: `openclaw message poll --channel msteams --target conversation:<id> ...`
- Stemmen worden door de Gateway vastgelegd in `~/.openclaw/msteams-polls.json`.
- De Gateway moet online blijven om stemmen vast te leggen.
- Peilingen plaatsen nog niet automatisch resultatensamenvattingen (inspecteer indien nodig het opslagbestand).

## Presentatiekaarten

Verzend semantische presentatiepayloads naar Teams-gebruikers of -conversaties met de `message`-tool of CLI. OpenClaw rendert ze als Teams Adaptive Cards vanuit het generieke presentatiecontract.

De parameter `presentation` accepteert semantische blokken. Wanneer `presentation` is opgegeven, is de berichttekst optioneel.

**Agent-tool:**

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

Zie [Doelindelingen](#target-formats) hieronder voor details over de doelindeling.

## Doelindelingen

MSTeams-doelen gebruiken voorvoegsels om onderscheid te maken tussen gebruikers en conversaties:

| Doeltype            | Indeling                         | Voorbeeld                                           |
| ------------------- | -------------------------------- | --------------------------------------------------- |
| Gebruiker (op ID)   | `user:<aad-object-id>`           | `user:40a1a0ed-4ff2-4164-a219-55518990c197`         |
| Gebruiker (op naam) | `user:<display-name>`            | `user:John Smith` (vereist Graph API)               |
| Groep/kanaal        | `conversation:<conversation-id>` | `conversation:19:abc123...@thread.tacv2`            |
| Groep/kanaal (raw)  | `<conversation-id>`              | `19:abc123...@thread.tacv2` (als het `@thread` bevat) |

**CLI-voorbeelden:**

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

**Voorbeelden van agenttools:**

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
Zonder het voorvoegsel `user:` worden namen standaard opgelost als groep of team. Gebruik altijd `user:` wanneer je personen target op weergavenaam.
</Note>

## Proactieve berichten

- Proactieve berichten zijn alleen mogelijk **nadat** een gebruiker interactie heeft gehad, omdat we op dat moment gespreksreferenties opslaan.
- Zie `/gateway/configuration` voor `dmPolicy` en allowlist-gating.

## Team- en kanaal-ID's (veelvoorkomende valkuil)

De queryparameter `groupId` in Teams-URL's is **NIET** de team-ID die voor configuratie wordt gebruikt. Haal in plaats daarvan ID's uit het URL-pad:

**Team-URL:**

```
https://teams.microsoft.com/l/team/19%3ABk4j...%40thread.tacv2/conversations?groupId=...
                                    └────────────────────────────┘
                                    Team conversation ID (URL-decode this)
```

**Kanaal-URL:**

```
https://teams.microsoft.com/l/channel/19%3A15bc...%40thread.tacv2/ChannelName?groupId=...
                                      └─────────────────────────┘
                                      Channel ID (URL-decode this)
```

**Voor configuratie:**

- Teamsleutel = padsegment na `/team/` (URL-gedecodeerd, bijvoorbeeld `19:Bk4j...@thread.tacv2`; oudere tenants kunnen `@thread.skype` tonen, wat ook geldig is)
- Kanaalsleutel = padsegment na `/channel/` (URL-gedecodeerd)
- **Negeer** de queryparameter `groupId` voor OpenClaw-routering. Dit is de Microsoft Entra-groeps-ID, niet de Bot Framework-gespreks-ID die wordt gebruikt in inkomende Teams-activiteiten.

## Privékanalen

Bots hebben beperkte ondersteuning in privékanalen:

| Functie                      | Standaardkanalen | Privékanalen          |
| ---------------------------- | ---------------- | --------------------- |
| Botinstallatie               | Ja               | Beperkt               |
| Realtimeberichten (webhook)  | Ja               | Werkt mogelijk niet   |
| RSC-machtigingen             | Ja               | Kan anders werken     |
| @vermeldingen                | Ja               | Als bot toegankelijk is |
| Graph API-geschiedenis       | Ja               | Ja (met machtigingen) |

**Workarounds als privékanalen niet werken:**

1. Gebruik standaardkanalen voor botinteracties
2. Gebruik DM's - gebruikers kunnen de bot altijd rechtstreeks een bericht sturen
3. Gebruik Graph API voor historische toegang (vereist `ChannelMessage.Read.All`)

## Probleemoplossing

### Veelvoorkomende problemen

- **Afbeeldingen worden niet weergegeven in kanalen:** Graph-machtigingen of admin consent ontbreken. Installeer de Teams-app opnieuw en sluit/heropen Teams volledig.
- **Geen reacties in kanaal:** vermeldingen zijn standaard vereist; stel `channels.msteams.requireMention=false` in of configureer dit per team/kanaal.
- **Versiemismatch (Teams toont nog steeds oud manifest):** verwijder de app, voeg deze opnieuw toe en sluit Teams volledig af om te vernieuwen.
- **401 Unauthorized van webhook:** Verwacht bij handmatig testen zonder Azure JWT - betekent dat endpoint bereikbaar is, maar auth is mislukt. Gebruik Azure Web Chat om correct te testen.

### Fouten bij manifestupload

- **"Icon file cannot be empty":** Het manifest verwijst naar pictogrambestanden van 0 bytes. Maak geldige PNG-pictogrammen (`outline.png` 32x32, `color.png` 192x192).
- **"webApplicationInfo.Id already in use":** De app is nog geïnstalleerd in een ander team/chat. Zoek deze en verwijder de installatie eerst, of wacht 5-10 minuten op propagatie.
- **"Something went wrong" bij uploaden:** Upload in plaats daarvan via [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com), open browser-DevTools (F12) → tabblad Network en controleer de responsebody voor de daadwerkelijke fout.
- **Sideload mislukt:** Probeer "Upload an app to your org's app catalog" in plaats van "Upload a custom app" - dit omzeilt vaak sideload-beperkingen.

### RSC-machtigingen werken niet

1. Controleer of `webApplicationInfo.id` exact overeenkomt met de App ID van je bot
2. Upload de app opnieuw en installeer deze opnieuw in het team/chat
3. Controleer of je organisatiebeheerder RSC-machtigingen heeft geblokkeerd
4. Bevestig dat je de juiste scope gebruikt: `ChannelMessage.Read.Group` voor teams, `ChatMessage.Read.Chat` voor groepschats

## Referenties

- [Azure Bot maken](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) - installatiegids voor Azure Bot
- [Teams Developer Portal](https://dev.teams.microsoft.com/apps) - Teams-apps maken/beheren
- [Teams-appmanifestschema](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [Kanaalberichten ontvangen met RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [Referentie voor RSC-machtigingen](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [Bestandsafhandeling voor Teams-bots](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4) (kanaal/groep vereist Graph)
- [Proactieve berichten](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)
- [@microsoft/teams.cli](https://www.npmjs.com/package/@microsoft/teams.cli) - Teams CLI voor botbeheer

## Gerelateerd

- [Kanalenoverzicht](/nl/channels) - alle ondersteunde kanalen
- [Koppeling](/nl/channels/pairing) - DM-authenticatie en koppelingsflow
- [Groepen](/nl/channels/groups) - gedrag van groepschats en mention-gating
- [Kanaalroutering](/nl/channels/channel-routing) - sessieroutering voor berichten
- [Beveiliging](/nl/gateway/security) - toegangsmodel en hardening
