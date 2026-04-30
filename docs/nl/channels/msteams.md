---
read_when:
    - Werken aan functies voor het Microsoft Teams-kanaal
summary: Status, mogelijkheden en configuratie van Microsoft Teams-botondersteuning
title: Microsoft Teams
x-i18n:
    generated_at: "2026-04-30T09:35:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: c2c8cd13a72941a18d609b1f7263d9b9ed3284873f9b1483975ca1356b543979
    source_path: channels/msteams.md
    workflow: 16
---

Status: tekst + DM-bijlagen worden ondersteund; het verzenden van bestanden in kanalen/groepen vereist `sharePointSiteId` + Graph-machtigingen (zie [Bestanden verzenden in groepschats](#sending-files-in-group-chats)). Polls worden verzonden via Adaptive Cards. Berichtacties bieden expliciet `upload-file` voor verzendingen waarbij het bestand vooropstaat.

## Gebundelde Plugin

Microsoft Teams wordt als gebundelde Plugin meegeleverd in huidige OpenClaw-releases, dus in de normale verpakte build is geen aparte installatie vereist.

Als je een oudere build gebruikt of een aangepaste installatie die gebundelde Teams uitsluit, installeer dan een huidig npm-pakket zodra er een is gepubliceerd:

```bash
openclaw plugins install @openclaw/msteams
```

Als npm meldt dat het OpenClaw-pakket is afgeschaft, gebruik dan een huidige verpakte OpenClaw-build of het lokale checkout-pad totdat er een nieuwer npm-pakket is gepubliceerd.

Lokale checkout (bij uitvoeren vanuit een git-repo):

```bash
openclaw plugins install ./path/to/local/msteams-plugin
```

Details: [Plugins](/nl/tools/plugin)

## Snelle configuratie

De [`@microsoft/teams.cli`](https://www.npmjs.com/package/@microsoft/teams.cli) verwerkt botregistratie, het maken van manifesten en het genereren van referenties in één opdracht.

**1. Installeer en log in**

```bash
npm install -g @microsoft/teams.cli@preview
teams login
teams status   # verify you're logged in and see your tenant info
```

<Note>
De Teams CLI is momenteel in preview. Opdrachten en vlaggen kunnen tussen releases wijzigen.
</Note>

**2. Start een tunnel** (Teams kan localhost niet bereiken)

Installeer en verifieer de devtunnel CLI als je dat nog niet hebt gedaan ([aan-de-slag-handleiding](https://learn.microsoft.com/en-us/azure/developer/dev-tunnels/get-started)).

```bash
# One-time setup (persistent URL across sessions):
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# Each dev session:
devtunnel host my-openclaw-bot
# Your endpoint: https://<tunnel-id>.devtunnels.ms/api/messages
```

<Note>
`--allow-anonymous` is vereist omdat Teams zich niet kan verifiëren bij devtunnels. Elk binnenkomend botverzoek wordt nog steeds automatisch gevalideerd door de Teams SDK.
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
- Registreert de bot (standaard beheerd door Teams — geen Azure-abonnement nodig)

De uitvoer toont `CLIENT_ID`, `CLIENT_SECRET`, `TENANT_ID` en een **Teams App ID** — noteer deze voor de volgende stappen. De opdracht biedt ook aan om de app rechtstreeks in Teams te installeren.

**4. Configureer OpenClaw** met de referenties uit de uitvoer:

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

Of gebruik omgevingsvariabelen rechtstreeks: `MSTEAMS_APP_ID`, `MSTEAMS_APP_PASSWORD`, `MSTEAMS_TENANT_ID`.

**5. Installeer de app in Teams**

`teams app create` vraagt je om de app te installeren — selecteer "Install in Teams". Als je dit hebt overgeslagen, kun je de link later ophalen:

```bash
teams app get <teamsAppId> --install-link
```

**6. Controleer of alles werkt**

```bash
teams app doctor <teamsAppId>
```

Dit voert diagnostiek uit voor botregistratie, AAD-appconfiguratie, manifestgeldigheid en SSO-configuratie.

Overweeg voor productie-implementaties [federatieve verificatie](/nl/channels/msteams#federated-authentication-certificate-plus-managed-identity) (certificaat of beheerde identiteit) te gebruiken in plaats van clientgeheimen.

<Note>
Groepschats zijn standaard geblokkeerd (`channels.msteams.groupPolicy: "allowlist"`). Stel `channels.msteams.groupAllowFrom` in om groepsantwoorden toe te staan, of gebruik `groupPolicy: "open"` om elk lid toe te staan (vermelding vereist).
</Note>

## Doelen

- Praat met OpenClaw via Teams-DM's, groepschats of kanalen.
- Houd routering deterministisch: antwoorden gaan altijd terug naar het kanaal waarop ze zijn binnengekomen.
- Gebruik standaard veilig kanaalgedrag (vermeldingen vereist tenzij anders geconfigureerd).

## Configuratiewrites

Standaard mag Microsoft Teams configuratie-updates schrijven die worden geactiveerd door `/config set|unset` (vereist `commands.config: true`).

Uitschakelen met:

```json5
{
  channels: { msteams: { configWrites: false } },
}
```

## Toegangscontrole (DM's + groepen)

**DM-toegang**

- Standaard: `channels.msteams.dmPolicy = "pairing"`. Onbekende afzenders worden genegeerd totdat ze zijn goedgekeurd.
- `channels.msteams.allowFrom` moet stabiele AAD-object-ID's gebruiken.
- Vertrouw niet op UPN-/weergavenaam-matching voor allowlists — die kunnen veranderen. OpenClaw schakelt directe naammatching standaard uit; meld je er expliciet voor aan met `channels.msteams.dangerouslyAllowNameMatching: true`.
- De wizard kan namen naar ID's omzetten via Microsoft Graph wanneer referenties dit toestaan.

**Groepstoegang**

- Standaard: `channels.msteams.groupPolicy = "allowlist"` (geblokkeerd tenzij je `groupAllowFrom` toevoegt). Gebruik `channels.defaults.groupPolicy` om de standaardwaarde te overschrijven wanneer die niet is ingesteld.
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

**Teams + toegestane lijst voor kanalen**

- Beperk groeps-/kanaalantwoorden door teams en kanalen te vermelden onder `channels.msteams.teams`.
- Sleutels moeten stabiele Teams-gespreks-ID's uit Teams-links gebruiken, geen veranderlijke weergavenamen.
- Wanneer `groupPolicy="allowlist"` en er een toegestane lijst voor teams aanwezig is, worden alleen vermelde teams/kanalen geaccepteerd (vermelding‑afhankelijk).
- De configuratiewizard accepteert `Team/Channel`-items en slaat ze voor je op.
- Bij het opstarten zet OpenClaw namen uit de toegestane lijsten voor team/kanaal en gebruiker om naar ID's (wanneer Graph-machtigingen dit toestaan)
  en logt de mapping; niet-opgeloste team-/kanaalnamen blijven zoals ingevoerd behouden, maar worden standaard genegeerd voor routering tenzij `channels.msteams.dangerouslyAllowNameMatching: true` is ingeschakeld.

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

1. Zorg dat de Microsoft Teams Plugin beschikbaar is (meegeleverd in huidige releases).
2. Maak een **Azure Bot** (App ID + geheim + tenant-ID).
3. Bouw een **Teams-app-pakket** dat naar de bot verwijst en de onderstaande RSC-machtigingen bevat.
4. Upload/installeer de Teams-app in een team (of in persoonlijke scope voor DM's).
5. Configureer `msteams` in `~/.openclaw/openclaw.json` (of env vars) en start de Gateway.
6. De Gateway luistert standaard op `/api/messages` naar Bot Framework-Webhook-verkeer.

### Stap 1: Azure Bot maken

1. Ga naar [Azure Bot maken](https://portal.azure.com/#create/Microsoft.AzureBot)
2. Vul het tabblad **Basis** in:

   | Veld               | Waarde                                                        |
   | ------------------ | ------------------------------------------------------------- |
   | **Bot-handle**     | Je botnaam, bijv. `openclaw-msteams` (moet uniek zijn)        |
   | **Abonnement**     | Selecteer je Azure-abonnement                                 |
   | **Resourcegroep**  | Maak een nieuwe of gebruik een bestaande                      |
   | **Prijscategorie** | **Gratis** voor ontwikkeling/testen                           |
   | **Type app**       | **Single Tenant** (aanbevolen - zie opmerking hieronder)      |
   | **Aanmaaktype**    | **Nieuwe Microsoft App ID maken**                             |

<Warning>
Het maken van nieuwe multi-tenant bots is na 2025-07-31 afgeschaft. Gebruik **Single Tenant** voor nieuwe bots.
</Warning>

3. Klik op **Controleren + maken** → **Maken** (wacht ~1-2 minuten)

### Stap 2: Referenties ophalen

1. Ga naar je Azure Bot-resource → **Configuratie**
2. Kopieer **Microsoft App ID** → dit is je `appId`
3. Klik op **Wachtwoord beheren** → ga naar de app-registratie
4. Onder **Certificaten en geheimen** → **Nieuw clientgeheim** → kopieer de **Waarde** → dit is je `appPassword`
5. Ga naar **Overzicht** → kopieer **Directory-ID (tenant)** → dit is je `tenantId`

### Stap 3: Messaging-eindpunt configureren

1. In Azure Bot → **Configuratie**
2. Stel **Messaging-eindpunt** in op je Webhook-URL:
   - Productie: `https://your-domain.com/api/messages`
   - Lokale ontwikkeling: gebruik een tunnel (zie [Lokale ontwikkeling](#local-development-tunneling) hieronder)

### Stap 4: Teams-kanaal inschakelen

1. In Azure Bot → **Kanalen**
2. Klik op **Microsoft Teams** → Configureren → Opslaan
3. Accepteer de servicevoorwaarden

### Stap 5: Teams-appmanifest bouwen

- Neem een `bot`-item op met `botId = <App ID>`.
- Scopes: `personal`, `team`, `groupChat`.
- `supportsFiles: true` (vereist voor bestandsafhandeling in persoonlijke scope).
- Voeg RSC-machtigingen toe (zie [RSC-machtigingen](#current-teams-rsc-permissions-manifest)).
- Maak pictogrammen: `outline.png` (32x32) en `color.png` (192x192).
- Zip alle drie bestanden samen: `manifest.json`, `outline.png`, `color.png`.

### Stap 6: OpenClaw configureren

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

### Stap 7: De Gateway uitvoeren

Het Teams-kanaal start automatisch wanneer de Plugin beschikbaar is en er een `msteams`-configuratie met referenties bestaat.

</details>

## Gefedereerde authenticatie (certificaat plus beheerde identiteit)

> Toegevoegd in 2026.4.11

Voor productie-implementaties ondersteunt OpenClaw **gefedereerde authenticatie** als veiliger alternatief voor clientgeheimen. Er zijn twee methoden beschikbaar:

### Optie A: Authenticatie op basis van certificaten

Gebruik een PEM-certificaat dat is geregistreerd bij je Entra ID-appregistratie.

**Instellen:**

1. Genereer of verkrijg een certificaat (PEM-indeling met privésleutel).
2. In Entra ID → App-registratie → **Certificaten en geheimen** → **Certificaten** → Upload het openbare certificaat.

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

**Env vars:**

- `MSTEAMS_AUTH_TYPE=federated`
- `MSTEAMS_CERTIFICATE_PATH=/path/to/cert.pem`

### Optie B: Azure Managed Identity

Gebruik Azure Managed Identity voor authenticatie zonder wachtwoord. Dit is ideaal voor implementaties op Azure-infrastructuur (AKS, App Service, Azure-VM's) waar een beheerde identiteit beschikbaar is.

**Hoe het werkt:**

1. De bot-pod/VM heeft een beheerde identiteit (door het systeem toegewezen of door de gebruiker toegewezen).
2. Een **referentie voor gefedereerde identiteit** koppelt de beheerde identiteit aan de Entra ID-appregistratie.
3. Tijdens runtime gebruikt OpenClaw `@azure/identity` om tokens op te halen van het Azure IMDS-eindpunt (`169.254.169.254`).
4. Het token wordt doorgegeven aan de Teams SDK voor bot-authenticatie.

**Vereisten:**

- Azure-infrastructuur met beheerde identiteit ingeschakeld (AKS-workloadidentiteit, App Service, VM)
- Referentie voor gefedereerde identiteit aangemaakt op de Entra ID-appregistratie
- Netwerktoegang tot IMDS (`169.254.169.254:80`) vanaf de pod/VM

**Configuratie (door het systeem toegewezen beheerde identiteit):**

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

**Configuratie (door het systeem toegewezen beheerde identiteit):**

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
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID=<client-id>` (alleen voor door de gebruiker toegewezen)

### AKS Workload Identity instellen

Voor AKS-implementaties die workload-identiteit gebruiken:

1. **Schakel workload-identiteit in** op je AKS-cluster.
2. **Maak een federatieve identiteitsreferentie aan** op de Entra ID-appregistratie:

   ```bash
   az ad app federated-credential create --id <APP_OBJECT_ID> --parameters '{
     "name": "my-bot-workload-identity",
     "issuer": "<AKS_OIDC_ISSUER_URL>",
     "subject": "system:serviceaccount:<NAMESPACE>:<SERVICE_ACCOUNT>",
     "audiences": ["api://AzureADTokenExchange"]
   }'
   ```

3. **Annoteer het Kubernetes-serviceaccount** met de client-ID van de app:

   ```yaml
   apiVersion: v1
   kind: ServiceAccount
   metadata:
     name: my-bot-sa
     annotations:
       azure.workload.identity/client-id: "<APP_CLIENT_ID>"
   ```

4. **Label de pod** voor injectie van workload-identiteit:

   ```yaml
   metadata:
     labels:
       azure.workload.identity/use: "true"
   ```

5. **Zorg voor netwerktoegang** tot IMDS (`169.254.169.254`) — als je NetworkPolicy gebruikt, voeg dan een egress-regel toe die verkeer naar `169.254.169.254/32` op poort 80 toestaat.

### Vergelijking van verificatietypen

| Methode                    | Configuratie                                   | Voordelen                                  | Nadelen                                         |
| -------------------------- | ---------------------------------------------- | ------------------------------------------ | ----------------------------------------------- |
| **Clientgeheim**           | `appPassword`                                  | Eenvoudige installatie                     | Geheimrotatie vereist, minder veilig            |
| **Certificaat**            | `authType: "federated"` + `certificatePath`    | Geen gedeeld geheim via het netwerk        | Extra beheer van certificaten                   |
| **Beheerde identiteit**    | `authType: "federated"` + `useManagedIdentity` | Zonder wachtwoord, geen geheimen te beheren | Azure-infrastructuur vereist                    |

**Standaardgedrag:** Wanneer `authType` niet is ingesteld, gebruikt OpenClaw standaard verificatie met clientgeheim. Bestaande configuraties blijven zonder wijzigingen werken.

## Lokale ontwikkeling (tunneling)

Teams kan `localhost` niet bereiken. Gebruik een persistente ontwikkeltunnel zodat je URL in alle sessies hetzelfde blijft:

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

**Voer diagnostiek uit:**

```bash
teams app doctor <teamsAppId>
```

Controleert botregistratie, AAD-app, manifest en SSO-configuratie in één doorgang.

**Stuur een testbericht:**

1. Installeer de Teams-app (gebruik de installatielink van `teams app get <id> --install-link`)
2. Zoek de bot in Teams en stuur een DM
3. Controleer de Gateway-logboeken op binnenkomende activiteit

## Omgevingsvariabelen

Alle configuratiesleutels kunnen in plaats daarvan via omgevingsvariabelen worden ingesteld:

- `MSTEAMS_APP_ID`
- `MSTEAMS_APP_PASSWORD`
- `MSTEAMS_TENANT_ID`
- `MSTEAMS_AUTH_TYPE` (optioneel: `"secret"` of `"federated"`)
- `MSTEAMS_CERTIFICATE_PATH` (federatief + certificaat)
- `MSTEAMS_CERTIFICATE_THUMBPRINT` (optioneel, niet vereist voor verificatie)
- `MSTEAMS_USE_MANAGED_IDENTITY` (federatief + beheerde identiteit)
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID` (alleen door gebruiker toegewezen MI)

## Actie voor ledeninformatie

OpenClaw stelt een door Graph ondersteunde `member-info`-actie beschikbaar voor Microsoft Teams, zodat agents en automatiseringen kanaalledengegevens (weergavenaam, e-mail, rol) rechtstreeks vanuit Microsoft Graph kunnen opvragen.

Vereisten:

- `Member.Read.Group` RSC-machtiging (al in het aanbevolen manifest)
- Voor zoekopdrachten over teams heen: `User.Read.All` Graph-toepassingsmachtiging met beheerderstoestemming

De actie wordt beheerd door `channels.msteams.actions.memberInfo` (standaard: ingeschakeld wanneer Graph-referenties beschikbaar zijn).

## Geschiedeniscontext

- `channels.msteams.historyLimit` bepaalt hoeveel recente kanaal-/groepsberichten in de prompt worden opgenomen.
- Valt terug op `messages.groupChat.historyLimit`. Stel in op `0` om uit te schakelen (standaard 50).
- Opgehaalde threadgeschiedenis wordt gefilterd op allowlists van afzenders (`allowFrom` / `groupAllowFrom`), zodat het vullen van threadcontext alleen berichten van toegestane afzenders bevat.
- Context van geciteerde bijlagen (`ReplyTo*` afgeleid van Teams-antwoord-HTML) wordt momenteel doorgegeven zoals ontvangen.
- Met andere woorden: allowlists bepalen wie de agent kan activeren; alleen specifieke aanvullende contextpaden worden vandaag gefilterd.
- DM-geschiedenis kan worden beperkt met `channels.msteams.dmHistoryLimit` (gebruikersbeurten). Overschrijvingen per gebruiker: `channels.msteams.dms["<user_id>"].historyLimit`.

## Huidige Teams RSC-machtigingen (manifest)

Dit zijn de **bestaande resourceSpecific-machtigingen** in ons Teams-appmanifest. Ze gelden alleen binnen het team/de chat waarin de app is geïnstalleerd.

**Voor kanalen (teambereik):**

- `ChannelMessage.Read.Group` (Application) - alle kanaalberichten ontvangen zonder @vermelding
- `ChannelMessage.Send.Group` (Application)
- `Member.Read.Group` (Application)
- `Owner.Read.Group` (Application)
- `ChannelSettings.Read.Group` (Application)
- `TeamMember.Read.Group` (Application)
- `TeamSettings.Read.Group` (Application)

**Voor groepschats:**

- `ChatMessage.Read.Chat` (Application) - alle groepschatberichten ontvangen zonder @vermelding

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

### Manifestkanttekeningen (verplichte velden)

- `bots[].botId` **moet** overeenkomen met de Azure Bot App ID.
- `webApplicationInfo.id` **moet** overeenkomen met de Azure Bot App ID.
- `bots[].scopes` moet de oppervlakken bevatten die je wilt gebruiken (`personal`, `team`, `groupChat`).
- `bots[].supportsFiles: true` is vereist voor bestandsafhandeling in persoonlijk bereik.
- `authorization.permissions.resourceSpecific` moet lezen/verzenden voor kanalen bevatten als je kanaalverkeer wilt.

### Een bestaande app bijwerken

Om een al geïnstalleerde Teams-app bij te werken (bijvoorbeeld om RSC-machtigingen toe te voegen):

```bash
# Download, edit, and re-upload the manifest
teams app manifest download <teamsAppId> manifest.json
# Edit manifest.json locally...
teams app manifest upload manifest.json <teamsAppId>
# Version is auto-bumped if content changed
```

Installeer na het bijwerken de app opnieuw in elk team zodat nieuwe machtigingen van kracht worden, en **sluit Teams volledig af en start het opnieuw** (niet alleen het venster sluiten) om gecachte appmetadata te wissen.

<details>
<summary>Handmatige manifestupdate (zonder CLI)</summary>

1. Werk je `manifest.json` bij met de nieuwe instellingen
2. **Verhoog het veld `version`** (bijv. `1.0.0` → `1.1.0`)
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
- Bestandsbijlagen in **persoonlijke (DM)** gesprekken ontvangen.

Werkt NIET:

- **Afbeeldings- of bestandsinhoud** van kanaal/groep (payload bevat alleen HTML-stub).
- Bijlagen downloaden die in SharePoint/OneDrive zijn opgeslagen.
- Berichtgeschiedenis lezen (buiten de live Webhook-gebeurtenis).

### Met **Teams RSC + Microsoft Graph-toepassingsmachtigingen**

Voegt toe:

- Gehoste inhoud downloaden (afbeeldingen die in berichten zijn geplakt).
- Bestandsbijlagen downloaden die in SharePoint/OneDrive zijn opgeslagen.
- Kanaal-/chatberichtgeschiedenis lezen via Graph.

### RSC versus Graph API

| Mogelijkheid              | RSC-machtigingen   | Graph API                                      |
| ------------------------- | ------------------ | ---------------------------------------------- |
| **Realtime berichten**    | Ja (via Webhook)   | Nee (alleen polling)                           |
| **Historische berichten** | Nee                | Ja (kan geschiedenis opvragen)                 |
| **Installatiecomplexiteit** | Alleen appmanifest | Vereist beheerderstoestemming + tokenstroom    |
| **Werkt offline**         | Nee (moet actief zijn) | Ja (op elk moment opvragen)                 |

**Kortom:** RSC is voor realtime luisteren; Graph API is voor historische toegang. Om gemiste berichten in te halen terwijl je offline was, heb je Graph API met `ChannelMessage.Read.All` nodig (vereist beheerderstoestemming).

## Media + geschiedenis met Graph ingeschakeld (vereist voor kanalen)

Als je afbeeldingen/bestanden in **kanalen** nodig hebt of **berichtgeschiedenis** wilt ophalen, moet je Microsoft Graph-machtigingen inschakelen en beheerderstoestemming verlenen.

1. Voeg in Entra ID (Azure AD) **Appregistratie** Microsoft Graph **toepassingsmachtigingen** toe:
   - `ChannelMessage.Read.All` (kanaalbijlagen + geschiedenis)
   - `Chat.Read.All` of `ChatMessage.Read.All` (groepschats)
2. **Verleen beheerderstoestemming** voor de tenant.
3. Verhoog de **manifestversie** van de Teams-app, upload opnieuw en **installeer de app opnieuw in Teams**.
4. **Sluit Teams volledig af en start het opnieuw** om gecachte appmetadata te wissen.

**Aanvullende machtiging voor gebruikersvermeldingen:** Gebruikers-@vermeldingen werken standaard voor gebruikers in het gesprek. Als je echter dynamisch gebruikers wilt zoeken en vermelden die **niet in het huidige gesprek** zitten, voeg dan de machtiging `User.Read.All` (Application) toe en verleen beheerderstoestemming.

## Bekende beperkingen

### Webhook-time-outs

Teams levert berichten via HTTP-Webhook. Als verwerking te lang duurt (bijv. trage LLM-antwoorden), kun je het volgende zien:

- Gateway-time-outs
- Teams probeert het bericht opnieuw te verzenden (waardoor duplicaten ontstaan)
- Weggevallen antwoorden

OpenClaw handelt dit af door snel terug te keren en antwoorden proactief te verzenden, maar zeer trage reacties kunnen nog steeds problemen veroorzaken.

### Opmaak

Teams-markdown is beperkter dan Slack of Discord:

- Basisopmaak werkt: **vet**, _cursief_, `code`, links
- Complexe markdown (tabellen, geneste lijsten) wordt mogelijk niet correct weergegeven
- Adaptive Cards worden ondersteund voor polls en semantische presentatieverzendingen (zie hieronder)

## Configuratie

Belangrijke instellingen (zie `/gateway/configuration` voor gedeelde kanaalpatronen):

- `channels.msteams.enabled`: schakel het kanaal in/uit.
- `channels.msteams.appId`, `channels.msteams.appPassword`, `channels.msteams.tenantId`: botreferenties.
- `channels.msteams.webhook.port` (standaard `3978`)
- `channels.msteams.webhook.path` (standaard `/api/messages`)
- `channels.msteams.dmPolicy`: `pairing | allowlist | open | disabled` (standaard: pairing)
- `channels.msteams.allowFrom`: DM-allowlist (AAD-object-ID's aanbevolen). De wizard zet namen om naar ID's tijdens de installatie wanneer Graph-toegang beschikbaar is.
- `channels.msteams.dangerouslyAllowNameMatching`: noodschakelaar om veranderlijke UPN-/weergavenaam-matching en directe team-/kanaalnaamroutering opnieuw in te schakelen.
- `channels.msteams.textChunkLimit`: chunkgrootte voor uitgaande tekst.
- `channels.msteams.chunkMode`: `length` (standaard) of `newline` om te splitsen op lege regels (alinea-grenzen) vóór chunking op lengte.
- `channels.msteams.mediaAllowHosts`: allowlist voor hosts van inkomende bijlagen (standaard Microsoft-/Teams-domeinen).
- `channels.msteams.mediaAuthAllowHosts`: allowlist voor het toevoegen van Authorization-headers bij mediaretry's (standaard Graph + Bot Framework-hosts).
- `channels.msteams.requireMention`: vereis @mention in kanalen/groepen (standaard true).
- `channels.msteams.replyStyle`: `thread | top-level` (zie [Antwoordstijl](#reply-style-threads-vs-posts)).
- `channels.msteams.teams.<teamId>.replyStyle`: override per team.
- `channels.msteams.teams.<teamId>.requireMention`: override per team.
- `channels.msteams.teams.<teamId>.tools`: standaard overrides voor toolbeleid per team (`allow`/`deny`/`alsoAllow`) die worden gebruikt wanneer een kanaaloverride ontbreekt.
- `channels.msteams.teams.<teamId>.toolsBySender`: standaard overrides voor toolbeleid per team per afzender (`"*"` wildcard ondersteund).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`: override per kanaal.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.requireMention`: override per kanaal.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.tools`: overrides voor toolbeleid per kanaal (`allow`/`deny`/`alsoAllow`).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.toolsBySender`: overrides voor toolbeleid per kanaal per afzender (`"*"` wildcard ondersteund).
- `toolsBySender`-sleutels moeten expliciete prefixen gebruiken:
  `id:`, `e164:`, `username:`, `name:` (verouderde sleutels zonder prefix worden nog steeds alleen naar `id:` gemapt).
- `channels.msteams.actions.memberInfo`: schakel de door Graph ondersteunde actie voor ledeninformatie in of uit (standaard: ingeschakeld wanneer Graph-referenties beschikbaar zijn).
- `channels.msteams.authType`: authenticatietype — `"secret"` (standaard) of `"federated"`.
- `channels.msteams.certificatePath`: pad naar PEM-certificaatbestand (federated + certificaatauthenticatie).
- `channels.msteams.certificateThumbprint`: certificaat-thumbprint (optioneel, niet vereist voor auth).
- `channels.msteams.useManagedIdentity`: schakel authenticatie met managed identity in (federated-modus).
- `channels.msteams.managedIdentityClientId`: client-ID voor door de gebruiker toegewezen managed identity.
- `channels.msteams.sharePointSiteId`: SharePoint-site-ID voor bestandsuploads in groepschats/kanalen (zie [Bestanden verzenden in groepschats](#sending-files-in-group-chats)).

## Routering en sessies

- Sessiesleutels volgen de standaard agentindeling (zie [/concepts/session](/nl/concepts/session)):
  - Directe berichten delen de hoofdsessie (`agent:<agentId>:<mainKey>`).
  - Kanaal-/groepsberichten gebruiken conversation-id:
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## Antwoordstijl: threads versus berichten

Teams heeft onlangs twee kanaal-UI-stijlen geïntroduceerd boven op hetzelfde onderliggende datamodel:

| Stijl                    | Beschrijving                                               | Aanbevolen `replyStyle` |
| ------------------------ | ---------------------------------------------------------- | ----------------------- |
| **Berichten** (klassiek) | Berichten verschijnen als kaarten met thread-antwoorden eronder | `thread` (standaard)    |
| **Threads** (Slack-achtig) | Berichten lopen lineair door, meer zoals Slack           | `top-level`             |

**Het probleem:** De Teams-API maakt niet zichtbaar welke UI-stijl een kanaal gebruikt. Als je de verkeerde `replyStyle` gebruikt:

- `thread` in een kanaal met Threads-stijl → antwoorden verschijnen ongemakkelijk genest
- `top-level` in een kanaal met berichtenstijl → antwoorden verschijnen als afzonderlijke top-level berichten in plaats van in de thread

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

- **DM's:** Afbeeldingen en bestandsbijlagen werken via de Teams-botbestands-API's.
- **Kanalen/groepen:** Bijlagen bevinden zich in M365-opslag (SharePoint/OneDrive). De Webhook-payload bevat alleen een HTML-stub, niet de daadwerkelijke bestandsbytes. **Graph API-machtigingen zijn vereist** om kanaalbijlagen te downloaden.
- Gebruik voor expliciete file-first verzendingen `action=upload-file` met `media` / `filePath` / `path`; optioneel `message` wordt de begeleidende tekst/opmerking, en `filename` overschrijft de geüploade naam.

Zonder Graph-machtigingen worden kanaalberichten met afbeeldingen ontvangen als alleen tekst (de afbeeldingsinhoud is niet toegankelijk voor de bot).
Standaard downloadt OpenClaw alleen media van Microsoft-/Teams-hostnamen. Overschrijf dit met `channels.msteams.mediaAllowHosts` (gebruik `["*"]` om elke host toe te staan).
Authorization-headers worden alleen toegevoegd voor hosts in `channels.msteams.mediaAuthAllowHosts` (standaard Graph + Bot Framework-hosts). Houd deze lijst strikt (vermijd multi-tenant suffixen).

## Bestanden verzenden in groepschats

Bots kunnen bestanden verzenden in DM's met de FileConsentCard-flow (ingebouwd). **Bestanden verzenden in groepschats/kanalen** vereist echter extra configuratie:

| Context                  | Hoe bestanden worden verzonden              | Vereiste configuratie                            |
| ------------------------ | ------------------------------------------- | ----------------------------------------------- |
| **DM's**                 | FileConsentCard → gebruiker accepteert → bot uploadt | Werkt direct                                  |
| **Groepschats/kanalen**  | Uploaden naar SharePoint → link delen       | Vereist `sharePointSiteId` + Graph-machtigingen |
| **Afbeeldingen (elke context)** | Base64-gecodeerd inline              | Werkt direct                                    |

### Waarom groepschats SharePoint nodig hebben

Bots hebben geen persoonlijke OneDrive-drive (het Graph API-eindpunt `/me/drive` werkt niet voor applicatie-identiteiten). Om bestanden in groepschats/kanalen te verzenden, uploadt de bot naar een **SharePoint-site** en maakt een deellink.

### Installatie

1. **Voeg Graph API-machtigingen toe** in Entra ID (Azure AD) → App Registration:
   - `Sites.ReadWrite.All` (Application) - bestanden uploaden naar SharePoint
   - `Chat.Read.All` (Application) - optioneel, maakt deellinks per gebruiker mogelijk

2. **Verleen admin consent** voor de tenant.

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
| Alleen `Sites.ReadWrite.All`            | Organisatiebrede deellink (iedereen in de org heeft toegang) |
| `Sites.ReadWrite.All` + `Chat.Read.All` | Deellink per gebruiker (alleen chatleden hebben toegang)  |

Delen per gebruiker is veiliger, omdat alleen de chatdeelnemers toegang hebben tot het bestand. Als de machtiging `Chat.Read.All` ontbreekt, valt de bot terug op organisatiebreed delen.

### Fallback-gedrag

| Scenario                                          | Resultaat                                          |
| ------------------------------------------------- | -------------------------------------------------- |
| Groepschat + bestand + `sharePointSiteId` geconfigureerd | Uploaden naar SharePoint, deellink verzenden |
| Groepschat + bestand + geen `sharePointSiteId`    | OneDrive-upload proberen (kan mislukken), alleen tekst verzenden |
| Persoonlijke chat + bestand                       | FileConsentCard-flow (werkt zonder SharePoint)    |
| Elke context + afbeelding                         | Base64-gecodeerd inline (werkt zonder SharePoint) |

### Locatie van opgeslagen bestanden

Geüploade bestanden worden opgeslagen in een map `/OpenClawShared/` in de standaard documentbibliotheek van de geconfigureerde SharePoint-site.

## Polls (Adaptive Cards)

OpenClaw verzendt Teams-polls als Adaptive Cards (er is geen native Teams-poll-API).

- CLI: `openclaw message poll --channel msteams --target conversation:<id> ...`
- Stemmen worden door de Gateway geregistreerd in `~/.openclaw/msteams-polls.json`.
- De Gateway moet online blijven om stemmen te registreren.
- Polls plaatsen nog niet automatisch resultaatsamenvattingen (inspecteer indien nodig het opslagbestand).

## Presentatiekaarten

Verzend semantische presentatiepayloads naar Teams-gebruikers of -gesprekken met de `message`-tool of CLI. OpenClaw rendert ze als Teams Adaptive Cards vanuit het generieke presentatiecontract.

De parameter `presentation` accepteert semantische blokken. Wanneer `presentation` is opgegeven, is de berichttekst optioneel.

**Agenttool:**

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

Zie [Doelformaten](#target-formats) hieronder voor details over de doelindeling.

## Doelformaten

MSTeams-doelen gebruiken prefixen om onderscheid te maken tussen gebruikers en gesprekken:

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
Zonder het voorvoegsel `user:` worden namen standaard als groep of team opgezocht. Gebruik altijd `user:` wanneer je personen op weergavenaam target.
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
- **Negeer** de queryparameter `groupId` voor OpenClaw-routering. Dit is de Microsoft Entra-groep-ID, niet de Bot Framework-gespreks-ID die wordt gebruikt in inkomende Teams-activiteiten.

## Privékanalen

Bots hebben beperkte ondersteuning in privékanalen:

| Functie                       | Standaardkanalen | Privékanalen             |
| ----------------------------- | ---------------- | ------------------------ |
| Botinstallatie                | Ja               | Beperkt                  |
| Realtimeberichten (webhook)   | Ja               | Werkt mogelijk niet      |
| RSC-machtigingen              | Ja               | Kan anders werken        |
| @vermeldingen                 | Ja               | Als de bot toegankelijk is |
| Graph API-geschiedenis        | Ja               | Ja (met machtigingen)    |

**Workarounds als privékanalen niet werken:**

1. Gebruik standaardkanalen voor botinteracties
2. Gebruik DM's - gebruikers kunnen de bot altijd rechtstreeks berichten sturen
3. Gebruik Graph API voor historische toegang (vereist `ChannelMessage.Read.All`)

## Problemen oplossen

### Veelvoorkomende problemen

- **Afbeeldingen worden niet weergegeven in kanalen:** Graph-machtigingen of beheerderstoestemming ontbreken. Installeer de Teams-app opnieuw en sluit Teams volledig af/open het opnieuw.
- **Geen reacties in kanaal:** vermeldingen zijn standaard vereist; stel `channels.msteams.requireMention=false` in of configureer dit per team/kanaal.
- **Versiemismatch (Teams toont nog steeds het oude manifest):** verwijder de app, voeg deze opnieuw toe en sluit Teams volledig af om te vernieuwen.
- **401 Unauthorized van webhook:** Verwacht bij handmatig testen zonder Azure JWT - betekent dat het endpoint bereikbaar is, maar authenticatie is mislukt. Gebruik Azure Web Chat om correct te testen.

### Fouten bij manifestupload

- **"Icon file cannot be empty":** Het manifest verwijst naar pictogrambestanden van 0 bytes. Maak geldige PNG-pictogrammen (32x32 voor `outline.png`, 192x192 voor `color.png`).
- **"webApplicationInfo.Id already in use":** De app is nog geïnstalleerd in een ander team/andere chat. Zoek en verwijder de installatie eerst, of wacht 5-10 minuten op propagatie.
- **"Something went wrong" bij uploaden:** Upload in plaats daarvan via [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com), open browser-DevTools (F12) → tabblad Network en controleer de response body op de daadwerkelijke fout.
- **Sideloaden mislukt:** Probeer "Upload an app to your org's app catalog" in plaats van "Upload a custom app" - dit omzeilt vaak sideload-beperkingen.

### RSC-machtigingen werken niet

1. Controleer of `webApplicationInfo.id` exact overeenkomt met de App ID van je bot
2. Upload de app opnieuw en installeer deze opnieuw in het team/de chat
3. Controleer of je organisatiebeheerder RSC-machtigingen heeft geblokkeerd
4. Bevestig dat je het juiste bereik gebruikt: `ChannelMessage.Read.Group` voor teams, `ChatMessage.Read.Chat` voor groepschats

## Referenties

- [Azure Bot maken](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) - installatiegids voor Azure Bot
- [Teams Developer Portal](https://dev.teams.microsoft.com/apps) - Teams-apps maken/beheren
- [Schema voor Teams-appmanifest](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [Kanaalberichten ontvangen met RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [Referentie voor RSC-machtigingen](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [Bestandsafhandeling voor Teams-bots](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4) (kanaal/groep vereist Graph)
- [Proactieve berichten](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)
- [@microsoft/teams.cli](https://www.npmjs.com/package/@microsoft/teams.cli) - Teams CLI voor botbeheer

## Gerelateerd

- [Kanalenoverzicht](/nl/channels) — alle ondersteunde kanalen
- [Koppelen](/nl/channels/pairing) — DM-authenticatie en koppelingsflow
- [Groepen](/nl/channels/groups) — gedrag van groepschats en vermeldingsgating
- [Kanaalroutering](/nl/channels/channel-routing) — sessieroutering voor berichten
- [Beveiliging](/nl/gateway/security) — toegangsmodel en hardening
