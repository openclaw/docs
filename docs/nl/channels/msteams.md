---
read_when:
    - Werken aan functies voor het Microsoft Teams-kanaal
summary: Ondersteuningsstatus, mogelijkheden en configuratie van de Microsoft Teams-bot
title: Microsoft Teams
x-i18n:
    generated_at: "2026-07-16T15:20:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: cb16cf89ed2ab7ae69389ac30e9cc32cc7d1bc2d3c6bccbd139d367380b7b32c
    source_path: channels/msteams.md
    workflow: 16
---

Status: tekst + DM-bijlagen worden ondersteund; voor het verzenden van bestanden in kanalen/groepen zijn `sharePointSiteId` + Graph-machtigingen vereist (zie [Bestanden verzenden in groepschats](#sending-files-in-group-chats)). Peilingen worden via Adaptive Cards verzonden. Berichtacties bieden expliciete `upload-file` voor verzendingen waarbij het bestand vooropstaat.

## Gebundelde Plugin

Microsoft Teams wordt als gebundelde Plugin geleverd in huidige OpenClaw-releases; in de normale verpakte build is geen afzonderlijke installatie vereist.

Installeer op een oudere build of een aangepaste installatie zonder de gebundelde Teams-Plugin het npm-pakket rechtstreeks:

```bash
openclaw plugins install @openclaw/msteams
```

Gebruik het pakket zonder versieaanduiding om de huidige officiële releasetag te volgen. Zet alleen een exacte versie vast wanneer je een reproduceerbare installatie nodig hebt.

Lokale checkout (uitgevoerd vanuit een git-repository):

```bash
openclaw plugins install ./path/to/local/msteams-plugin
```

Details: [Plugins](/nl/tools/plugin)

## Snelle configuratie

[`@microsoft/teams.cli`](https://www.npmjs.com/package/@microsoft/teams.cli) verwerkt botregistratie, het maken van het manifest en het genereren van aanmeldgegevens met één opdracht.

**1. Installeren en aanmelden**

```bash
npm install -g @microsoft/teams.cli@preview
teams login
teams status   # controleer of je bent aangemeld en bekijk je tenantgegevens
```

<Note>
De Teams CLI bevindt zich momenteel in preview. Opdrachten en vlaggen kunnen tussen releases veranderen.
</Note>

**2. Een tunnel starten** (Teams kan localhost niet bereiken)

Installeer en authenticeer zo nodig de devtunnel-CLI ([handleiding om aan de slag te gaan](https://learn.microsoft.com/en-us/azure/developer/dev-tunnels/get-started)).

```bash
# Eenmalige configuratie (permanente URL tussen sessies):
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# Elke ontwikkelsessie:
devtunnel host my-openclaw-bot
# Je eindpunt: https://<tunnel-id>.devtunnels.ms/api/messages
```

<Note>
`--allow-anonymous` is vereist omdat Teams zich niet kan authenticeren met devtunnels. Elk binnenkomend botverzoek wordt nog steeds door de Teams SDK gevalideerd.
</Note>

Alternatieven: `ngrok http 3978` of `tailscale funnel 3978` (URL's kunnen per sessie veranderen).

**3. De app maken**

```bash
teams app create \
  --name "OpenClaw" \
  --endpoint "https://<your-tunnel-url>/api/messages"
```

Hiermee wordt een Entra ID-toepassing (Azure AD) gemaakt, een clientgeheim gegenereerd, een Teams-appmanifest (met pictogrammen) gebouwd en geüpload, en een door Teams beheerde bot geregistreerd (geen Azure-abonnement vereist). De uitvoer bevat `CLIENT_ID`, `CLIENT_SECRET`, `TENANT_ID` en een **Teams App ID**; ook wordt aangeboden de app rechtstreeks in Teams te installeren.

**4. OpenClaw configureren** met de aanmeldgegevens uit de uitvoer:

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

Of gebruik rechtstreeks omgevingsvariabelen: `MSTEAMS_APP_ID`, `MSTEAMS_APP_PASSWORD`, `MSTEAMS_TENANT_ID`.

**5. De app in Teams installeren**

`teams app create` vraagt je de app te installeren; selecteer "Install in Teams". Gebruik het volgende om de installatielink later op te halen:

```bash
teams app get <teamsAppId> --install-link
```

**6. Controleren of alles werkt**

```bash
teams app doctor <teamsAppId>
```

Voert diagnostiek uit voor de botregistratie, AAD-appconfiguratie, geldigheid van het manifest en SSO-configuratie.

Overweeg voor productie [federatieve authenticatie](#federated-authentication-certificate-plus-managed-identity) (certificaat of beheerde identiteit) in plaats van clientgeheimen.

<Note>
Groepschats worden standaard geblokkeerd (`channels.msteams.groupPolicy: "allowlist"`). Stel `channels.msteams.groupAllowFrom` in om groepsantwoorden toe te staan, of gebruik `groupPolicy: "open"` om elk lid toe te staan (alleen bij vermelding).
</Note>

## Doelen

- Praat met OpenClaw via Teams-DM's, groepschats of kanalen.
- Houd routering deterministisch: antwoorden gaan altijd terug naar het kanaal waarop ze zijn binnengekomen.
- Gebruik standaard veilig kanaalgedrag (vermeldingen vereist, tenzij anders geconfigureerd).

## Configuratiewijzigingen

Microsoft Teams kan standaard configuratie-updates schrijven die worden geactiveerd door `/config set|unset` (vereist `commands.config: true`).

Uitschakelen met:

```json5
{
  channels: { msteams: { configWrites: false } },
}
```

## Toegangsbeheer (DM's + groepen)

**DM-toegang**

- Standaard: `channels.msteams.dmPolicy = "pairing"`. Onbekende afzenders worden genegeerd totdat ze zijn goedgekeurd.
- `channels.msteams.allowFrom` moet stabiele AAD-object-id's of statische afzendertoegangsgroepen gebruiken, zoals `accessGroup:core-team`.
- Vertrouw voor toelatingslijsten niet op overeenkomsten met UPN/weergavenaam; deze kunnen veranderen. OpenClaw schakelt rechtstreekse naamvergelijking standaard uit; schakel deze in met `channels.msteams.dangerouslyAllowNameMatching: true`.
- De wizard kan namen via Microsoft Graph omzetten in id's wanneer de aanmeldgegevens dit toestaan.

**Groepstoegang**

- Standaard: `channels.msteams.groupPolicy = "allowlist"` (geblokkeerd tenzij je `groupAllowFrom` toevoegt). `channels.defaults.groupPolicy` kan de gedeelde standaard overschrijven wanneer `channels.msteams.groupPolicy` niet is ingesteld.
- `channels.msteams.groupAllowFrom` bepaalt welke afzenders of statische afzendertoegangsgroepen acties kunnen activeren in groepschats/kanalen (valt terug op `channels.msteams.allowFrom`).
- Stel `groupPolicy: "open"` in om elk lid toe te staan (standaard nog steeds alleen bij vermelding).
- Stel `channels.msteams.groupPolicy: "disabled"` in om **alle** kanalen te blokkeren.

Voorbeeld:

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

**Toelatingslijst voor teams + kanalen**

- Beperk antwoorden in groepen/kanalen door teams en kanalen onder `channels.msteams.teams` te vermelden.
- Gebruik stabiele Teams-gespreks-id's uit Teams-links als sleutels, niet veranderlijke weergavenamen (zie [Team- en kanaal-id's](#team-and-channel-ids-common-gotcha)).
- Wanneer `groupPolicy="allowlist"` en een toelatingslijst voor teams aanwezig zijn, worden alleen vermelde teams/kanalen geaccepteerd (alleen bij vermelding).
- De configuratiewizard accepteert `Team/Channel`-vermeldingen en slaat deze voor je op.
- Bij het opstarten zet OpenClaw namen uit de toelatingslijsten voor teams/kanalen en gebruikers om in id's (wanneer Graph-machtigingen dit toestaan) en registreert de toewijzing in het logboek. Namen die niet kunnen worden omgezet, blijven staan zoals ingevoerd, maar worden voor routering genegeerd, tenzij `channels.msteams.dangerouslyAllowNameMatching: true` is ingesteld.

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
<summary><strong>Handmatige configuratie (zonder de Teams CLI)</strong></summary>

### Werking

1. Zorg dat de Microsoft Teams-Plugin beschikbaar is (gebundeld in huidige releases).
2. Maak een **Azure Bot** (App ID + geheim + tenant-id).
3. Bouw een **Teams-app-pakket** dat naar de bot verwijst, inclusief de onderstaande RSC-machtigingen.
4. Upload/installeer de Teams-app in een team (of met persoonlijk bereik voor DM's).
5. Configureer `msteams` in `~/.openclaw/openclaw.json` (of omgevingsvariabelen) en start de Gateway.
6. De Gateway luistert standaard op `/api/messages` naar Webhook-verkeer van Bot Framework.

### Stap 1: Azure Bot maken

1. Ga naar [Create Azure Bot](https://portal.azure.com/#create/Microsoft.AzureBot)
2. Vul het tabblad **Basics** in:

   | Veld               | Waarde                                                     |
   | ------------------ | ---------------------------------------------------------- |
   | **Bot handle**     | Je botnaam, bijvoorbeeld `openclaw-msteams` (moet uniek zijn) |
   | **Subscription**   | Selecteer je Azure-abonnement                              |
   | **Resource group** | Maak een nieuwe of gebruik een bestaande                   |
   | **Pricing tier**   | **Free** voor ontwikkeling/tests                           |
   | **Type of App**    | **Single Tenant** (aanbevolen; zie opmerking hieronder)    |
   | **Creation type**  | **Create new Microsoft App ID**                            |

<Warning>
Het maken van nieuwe multitenantbots is na 2025-07-31 afgeschaft. Gebruik **Single Tenant** voor nieuwe bots.
</Warning>

3. Klik op **Review + create** en vervolgens op **Create** (~1-2 minuten).

### Stap 2: Aanmeldgegevens ophalen

1. Azure Bot-resource → **Configuration** → kopieer **Microsoft App ID** (je `appId`).
2. **Manage Password** → App Registration → **Certificates & secrets** → **New client secret** → kopieer de **Value** (je `appPassword`).
3. **Overview** → kopieer **Directory (tenant) ID** (je `tenantId`).

### Stap 3: Berichteindpunt configureren

1. Azure Bot → **Configuration**.
2. Stel **Messaging endpoint** in:
   - Productie: `https://your-domain.com/api/messages`
   - Lokale ontwikkeling: gebruik een tunnel (zie [Lokale ontwikkeling](#local-development-tunneling))

### Stap 4: Teams-kanaal inschakelen

1. Azure Bot → **Channels**.
2. Klik op **Microsoft Teams** → Configure → Save.
3. Accepteer de Servicevoorwaarden.

### Stap 5: Teams-appmanifest bouwen

- Neem een `bot`-vermelding op met `botId = <App ID>`.
- Bereiken: `personal`, `team`, `groupChat`.
- `supportsFiles: true` (vereist voor bestandsverwerking met persoonlijk bereik).
- Voeg RSC-machtigingen toe (zie [RSC-machtigingen](#current-teams-rsc-permissions-manifest)).
- Maak pictogrammen: `outline.png` (32x32) en `color.png` (192x192).
- Zip `manifest.json`, `outline.png` en `color.png` samen.

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

Het Teams-kanaal start automatisch wanneer de Plugin beschikbaar is en de configuratie van `msteams` aanmeldgegevens bevat.

</details>

## Federatieve authenticatie (certificaat plus beheerde identiteit)

Voor productie ondersteunt OpenClaw **federatieve authenticatie** via `channels.msteams.authType: "federated"` als alternatief voor clientgeheimen. Er zijn twee methoden:

### Optie A: Authenticatie op basis van certificaten

Gebruik een PEM-certificaat dat bij je Entra ID-appregistratie is geregistreerd.

**Configuratie:**

1. Genereer of verkrijg een certificaat (PEM-indeling met privésleutel).
2. Entra ID → App Registration → **Certificates & secrets** → **Certificates** → upload het openbare certificaat.

**Configuratiebestand:**

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

**Omgevingsvariabelen:**

- `MSTEAMS_AUTH_TYPE=federated`
- `MSTEAMS_CERTIFICATE_PATH=/path/to/cert.pem`

### Optie B: Azure Managed Identity

Gebruik Azure Managed Identity voor authenticatie zonder wachtwoord op Azure-infrastructuur (AKS, App Service, Azure-VM's).

**Werking:**

1. De botpod/VM heeft een beheerde identiteit (door het systeem of de gebruiker toegewezen).
2. Een federatieve identiteitsreferentie koppelt de beheerde identiteit aan de Entra ID-appregistratie.
3. Tijdens runtime gebruikt OpenClaw `@azure/identity` om tokens van het Azure IMDS-eindpunt op te halen.
4. Het token wordt voor botauthenticatie doorgegeven aan de Teams SDK.

**Vereisten:**

- Azure-infrastructuur waarop beheerde identiteit is ingeschakeld (AKS-workloadidentiteit, App Service, VM).
- Federatieve identiteitsreferentie aangemaakt voor de Entra ID-appregistratie.
- Netwerktoegang tot IMDS (`169.254.169.254:80`) vanuit de pod/VM.

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

**Configuratie (door de gebruiker toegewezen beheerde identiteit):** voeg `managedIdentityClientId: "<MI_CLIENT_ID>"` toe aan het bovenstaande blok.

**Omgevingsvariabelen:**

- `MSTEAMS_AUTH_TYPE=federated`
- `MSTEAMS_USE_MANAGED_IDENTITY=true`
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID=<client-id>` (alleen door de gebruiker toegewezen)

### AKS Workload Identity instellen

Voor AKS-implementaties die workloadidentiteit gebruiken:

1. **Schakel workloadidentiteit in** op je AKS-cluster.
2. **Maak een federatieve identiteitsreferentie aan** voor de Entra ID-appregistratie:

   ```bash
   az ad app federated-credential create --id <APP_OBJECT_ID> --parameters '{
     "name": "my-bot-workload-identity",
     "issuer": "<AKS_OIDC_ISSUER_URL>",
     "subject": "system:serviceaccount:<NAMESPACE>:<SERVICE_ACCOUNT>",
     "audiences": ["api://AzureADTokenExchange"]
   }'
   ```

3. **Annoteer het Kubernetes-serviceaccount** met de client-id van de app:

   ```yaml
   apiVersion: v1
   kind: ServiceAccount
   metadata:
     name: my-bot-sa
     annotations:
       azure.workload.identity/client-id: "<APP_CLIENT_ID>"
   ```

4. **Label de pod** voor injectie van workloadidentiteit:

   ```yaml
   metadata:
     labels:
       azure.workload.identity/use: "true"
   ```

5. **Sta netwerktoegang toe** tot IMDS (`169.254.169.254`): voeg bij gebruik van NetworkPolicy een uitgaande regel toe voor `169.254.169.254/32` op poort 80.

### Vergelijking van verificatietypen

| Methode                        | Configuratie                                    | Voordelen                                  | Nadelen                                           |
| ------------------------------ | ----------------------------------------------- | ------------------------------------------ | ------------------------------------------------- |
| **Clientgeheim**               | `appPassword`                              | Eenvoudig in te stellen                    | Geheimrotatie vereist, minder veilig               |
| **Certificaat**                | `authType: "federated"` + `certificatePath`         | Geen gedeeld geheim via het netwerk        | Extra beheerlast voor certificaten                 |
| **Beheerde identiteit**        | `authType: "federated"` + `useManagedIdentity`         | Wachtwoordloos, geen geheimen om te beheren | Azure-infrastructuur vereist                       |

`certificateThumbprint` kan samen met `certificatePath` worden ingesteld, maar wordt momenteel niet door het verificatiepad gelezen; dit wordt uitsluitend geaccepteerd voor voorwaartse compatibiliteit.

**Standaard:** wanneer `authType` niet is ingesteld, gebruikt OpenClaw verificatie met een clientgeheim (`appPassword`). Bestaande configuraties blijven ongewijzigd werken.

## Lokale ontwikkeling (tunneling)

Teams kan `localhost` niet bereiken. Gebruik een permanente ontwikkelingstunnel, zodat de URL tussen sessies stabiel blijft:

```bash
# Eenmalig instellen:
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# Elke ontwikkelsessie:
devtunnel host my-openclaw-bot
```

Alternatieven: `ngrok http 3978` of `tailscale funnel 3978` (URL's kunnen per sessie veranderen).

Werk het eindpunt bij als de tunnel-URL verandert:

```bash
teams app update <teamsAppId> --endpoint "https://<new-url>/api/messages"
```

## De bot testen

**Voer diagnostiek uit:**

```bash
teams app doctor <teamsAppId>
```

Controleert in één keer de botregistratie, AAD-app, het manifest en de SSO-configuratie.

**Stuur een testbericht:**

1. Installeer de Teams-app (installatielink via `teams app get <id> --install-link`).
2. Zoek de bot in Teams en stuur een privébericht.
3. Controleer de Gateway-logboeken op binnenkomende activiteit.

## Omgevingsvariabelen

Deze verificatiegerelateerde configuratiesleutels kunnen via omgevingsvariabelen worden ingesteld in plaats van via `openclaw.json` (andere configuratiesleutels, zoals `groupPolicy` of `historyLimit`, kunnen alleen via configuratie worden ingesteld):

| Omgevingsvariabele                    | Configuratiesleutel       | Opmerkingen                                  |
| ------------------------------------- | ------------------------- | -------------------------------------------- |
| `MSTEAMS_APP_ID`                   | `appId`        |                                              |
| `MSTEAMS_APP_PASSWORD`                   | `appPassword`        |                                              |
| `MSTEAMS_TENANT_ID`                   | `tenantId`        |                                              |
| `MSTEAMS_AUTH_TYPE`                   | `authType`        | `"secret"` of `"federated"`    |
| `MSTEAMS_CERTIFICATE_PATH`                   | `certificatePath`        | federatief + certificaat                     |
| `MSTEAMS_CERTIFICATE_THUMBPRINT`                   | `certificateThumbprint`        | geaccepteerd, niet vereist voor verificatie  |
| `MSTEAMS_USE_MANAGED_IDENTITY`                   | `useManagedIdentity`        | federatief + beheerde identiteit             |
| `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID`                   | `managedIdentityClientId`        | alleen door gebruiker toegewezen identiteit  |

## Actie voor ledeninformatie

OpenClaw biedt voor Microsoft Teams een door Graph ondersteunde actie `member-info`, zodat agents en automatiseringen geverifieerde roostergegevens voor een geconfigureerd gesprek kunnen opzoeken.

Vereisten:

- `ChannelSettings.Read.Group`- en `TeamMember.Read.Group`-RSC-machtigingen (al opgenomen in het aanbevolen manifest).

De actie is beschikbaar zodra Graph-referenties zijn geconfigureerd; er is geen afzonderlijke `channels.msteams.actions.memberInfo`-schakelaar.
Zoekopdrachten in standaardkanalen retourneren de overeenkomende identiteit uit het teamrooster, de weergavenaam, het e-mailadres en de rollen.
In het huidige privébericht of de huidige groepschat kan de actie de stabiele gebruikers-id van de vertrouwde afzender retourneren.
Voor het opzoeken van leden in privé-/gedeelde kanalen en niet-huidige chats zijn aanvullende roostermachtigingen vereist
en deze zoekopdrachten worden door de standaardmachtigingsbasis geweigerd.

## Geschiedeniscontext

- `channels.msteams.historyLimit` bepaalt hoeveel recente kanaal-/groepsberichten in de prompt worden opgenomen. Valt terug op `messages.groupChat.historyLimit` en gebruikt vervolgens standaard 50. Stel `0` in om dit uit te schakelen.
- Opgehaalde threadgeschiedenis wordt gefilterd op afzenderstoestaanlijsten (`allowFrom` / `groupAllowFrom`), zodat het vullen van threadcontext alleen berichten van toegestane afzenders bevat.
- Aangehaalde bijlagecontext (geparseerd uit de HTML volgens het Skype Reply-schema in de eigen bijlagen van een antwoord) wordt ongefilterd doorgegeven; momenteel wordt alleen bij het vullen van threadgeschiedenis het filter voor de afzenderstoestaanlijst toegepast.
- De geschiedenis van privéberichten kan worden beperkt met `channels.msteams.dmHistoryLimit` (gebruikersbeurten). Overschrijvingen per gebruiker: `channels.msteams.dms["<user_id>"].historyLimit`.

## Huidige Teams-RSC-machtigingen (manifest)

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

Voeg RSC-machtigingen toe via de Teams-CLI:

```bash
teams app rsc add <teamsAppId> ChannelMessage.Read.Group --type Application
```

## Voorbeeld van een Teams-manifest (geredigeerd)

Minimaal, geldig voorbeeld met de vereiste velden. Vervang id's en URL's.

```json5
{
  $schema: "https://developer.microsoft.com/en-us/json-schemas/teams/v1.23/MicrosoftTeams.schema.json",
  manifestVersion: "1.23",
  version: "1.0.0",
  id: "00000000-0000-0000-0000-000000000000",
  name: { short: "OpenClaw" },
  developer: {
    name: "Je organisatie",
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

### Aandachtspunten voor het manifest (verplichte velden)

- `bots[].botId` **moet** overeenkomen met de Azure Bot App ID.
- `webApplicationInfo.id` **moet** overeenkomen met de Azure Bot App ID.
- `bots[].scopes` moet de oppervlakken bevatten die je wilt gebruiken (`personal`, `team`, `groupChat`).
- `bots[].supportsFiles: true` is vereist voor bestandsverwerking binnen het persoonlijke bereik.
- `authorization.permissions.resourceSpecific` moet lees-/verzendmachtigingen voor kanalen bevatten voor kanaalverkeer.

### Een bestaande app bijwerken

```bash
# Download, bewerk en upload het manifest opnieuw
teams app manifest download <teamsAppId> manifest.json
# Bewerk manifest.json lokaal...
teams app manifest upload manifest.json <teamsAppId>
# De versie wordt automatisch verhoogd als de inhoud is gewijzigd
```

Installeer de app na het bijwerken opnieuw in elk team en **sluit Teams volledig af en start het opnieuw** (niet alleen het venster sluiten) om metagegevens van de app uit de cache te wissen.

<details>
<summary>Handmatige manifestupdate (zonder CLI)</summary>

1. Werk `manifest.json` bij met de nieuwe instellingen.
2. **Verhoog het veld `version`** (bijv. `1.0.0` → `1.1.0`).
3. **Maak opnieuw een zipbestand** van het manifest met pictogrammen (`manifest.json`, `outline.png`, `color.png`).
4. Upload het nieuwe zipbestand:
   - **Teams Admin Center:** Teams apps → Manage apps → zoek je app → Upload new version.
   - **Sideload:** Teams → Apps → Manage your apps → Upload a custom app.

</details>

## Mogelijkheden: alleen RSC versus Graph

### Met **alleen Teams RSC** (app geïnstalleerd, geen Graph API-machtigingen)

Werkt:

- De **tekstuele** inhoud van kanaalberichten lezen.
- De **tekstuele** inhoud van kanaalberichten verzenden.
- Bestandsbijlagen in **persoonlijke berichten (DM's)** ontvangen.

Werkt NIET:

- **Afbeeldings- of bestandsinhoud** in kanalen/groepen (de payload bevat alleen een HTML-placeholder).
- Bijlagen downloaden die in SharePoint/OneDrive zijn opgeslagen.
- Berichtgeschiedenis lezen buiten de live Webhook-gebeurtenis.

### Met **Teams RSC + Microsoft Graph-toepassingsmachtigingen**

Voegt het volgende toe:

- Gehoste inhoud downloaden (afbeeldingen die in berichten zijn geplakt).
- Bestandsbijlagen downloaden die in SharePoint/OneDrive zijn opgeslagen.
- Kanaal-/chatberichtgeschiedenis lezen via Graph.

### RSC versus Graph API

| Mogelijkheid            | RSC-machtigingen      | Graph API                                      |
| ----------------------- | --------------------- | ---------------------------------------------- |
| **Realtimeberichten**   | Ja (via webhook)      | Nee (alleen polling)                           |
| **Historische berichten** | Nee                 | Ja (kan geschiedenis opvragen)                 |
| **Complexiteit van installatie** | Alleen app-manifest | Vereist beheerderstoestemming + tokenstroom |
| **Werkt offline**       | Nee (moet actief zijn) | Ja (op elk moment opvragen)                   |

**Kortom:** RSC is bedoeld voor realtime luisteren; Graph API is bedoeld voor historische toegang. Om gemiste berichten in te halen nadat je offline was, heb je Graph API met `ChannelMessage.Read.All` nodig (vereist beheerderstoestemming).

## Media + geschiedenis via Graph

Schakel alleen de Microsoft Graph-toepassingsmachtigingen in die nodig zijn voor de Teams-bereiken en gegevens die je gebruikt:

1. Entra ID (Azure AD) **App Registration** → voeg Graph **Application permissions** toe:
   - `ChannelMessage.Read.All` voor kanaalbijlagen en kanaalgeschiedenis.
   - `Chat.Read.All` voor groepschatbijlagen en groepschatgeschiedenis.
   - `Files.Read.All` wanneer de bytes van bijlagen uit SharePoint-/OneDrive-opslag moeten worden gedownload; configuraties die alleen geschiedenis gebruiken, hebben dit niet nodig.
2. **Grant admin consent** voor de tenant.
3. Verhoog de **manifest version** van de Teams-app, upload deze opnieuw en **installeer de app opnieuw in Teams**.
4. **Sluit Teams volledig af en start het opnieuw** om gecachte app-metadata te wissen.

### Bestandsherstel voor kanalen/groepen (`graphMediaFallback`)

Teams kan bestandsmarkeringen verwijderen uit de HTML-activiteit die naar een bot wordt verzonden. In dat geval is de Bot Framework-activiteit niet te onderscheiden van een gewoon HTML-bericht; de volledige bijlagereferentie bestaat alleen in de Graph-kopie van het bericht.

Schakel de fallback in nadat je de bovenstaande machtigingen hebt verleend:

```json5
{
  channels: {
    msteams: {
      graphMediaFallback: true,
    },
  },
}
```

Dit geldt alleen voor kanalen en groepschats. Het voegt één Graph-berichtopzoeking toe wanneer een HTML-activiteit geen rechtstreeks downloadbare media opleverde, waaronder gewone berichten en berichten met alleen een vermelding. De standaardwaarde is `false`, zodat bestaande installaties niet automatisch extra Graph-verkeer of machtigingsfouten krijgen.

**Gebruikersvermeldingen:** @vermeldingen werken direct voor gebruikers die al aan het gesprek deelnemen. Voeg de machtiging `User.Read.All` (Application) toe en verleen beheerderstoestemming om dynamisch te zoeken naar gebruikers die **niet aan het huidige gesprek deelnemen** en hen te vermelden.

## Bekende beperkingen

### Webhooktime-outs

Teams levert berichten via een HTTP-webhook. OpenClaw past vaste HTTP-servertime-outs toe op die webhooklistener: 30s inactiviteit, 30s totale aanvraagduur en 15s om headers te ontvangen. Optionele verrijking van inkomende media en context heeft een gedeeld budget van 10 seconden, maar de Teams-SDK wacht nog steeds op de agentbeurt voordat het webhookantwoord wordt geretourneerd. Als de volledige beurt het herhaalvenster van Teams overschrijdt, kun je het volgende zien:

- Teams probeert het bericht opnieuw te verzenden (waardoor duplicaten ontstaan).
- Weggevallen antwoorden.

Antwoorden worden proactief verzonden zodra de agent reageert, maar trage agentuitvoeringen kunnen aan de Teams-zijde nog steeds leiden tot nieuwe pogingen of duplicaten.

### Ondersteuning voor Teams-clouds en service-URL's

Dit op de SDK gebaseerde Teams-pad is live gevalideerd voor de openbare cloud van Microsoft Teams.

Inkomende antwoorden gebruiken de Teams-SDK-beurtcontext van het inkomende bericht. Proactieve bewerkingen buiten de context — verzenden, bewerken, verwijderen, kaarten, peilingen, berichten voor bestandstoestemming en in de wachtrij geplaatste langlopende antwoorden — gebruiken de opgeslagen gespreksreferentie `serviceUrl`. De openbare cloud gebruikt standaard de openbare-cloudomgeving van de Teams-SDK en staat opgeslagen referenties toe op de openbare Teams Connector-host: `https://smba.trafficmanager.net/`.

De openbare cloud is de standaardinstelling. Voor normale bots in de openbare cloud hoef je `channels.msteams.cloud` of `channels.msteams.serviceUrl` niet in te stellen.

Stel voor niet-openbare Teams-clouds `cloud` en de bijbehorende proactieve grens in wanneer Microsoft er een publiceert:

- `channels.msteams.cloud` selecteert de Teams-SDK-cloudvoorinstelling voor authenticatie, JWT-validatie, tokenservices en het Graph-bereik.
- `channels.msteams.serviceUrl` selecteert de Bot Connector-eindpuntgrens die wordt gebruikt om opgeslagen gespreksreferenties te valideren vóór proactieve verzendingen, bewerkingen, verwijderingen, kaarten, peilingen, berichten voor bestandstoestemming en in de wachtrij geplaatste langlopende antwoorden. Dit is vereist voor de SDK-clouds USGov en DoD. Voor China/21Vianet gebruikt OpenClaw de SDK-voorinstelling `China` en accepteert het opgeslagen/geconfigureerde service-URL's alleen op Azure China Bot Framework-kanaalhosts.

Microsoft publiceert de wereldwijde proactieve Bot Connector-eindpunten in het gedeelte [Het gesprek maken](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages?tabs=dotnet#create-the-conversation) van de Teams-documentatie over proactieve berichten. Gebruik indien beschikbaar de `serviceUrl` van de inkomende activiteit; gebruik anders de onderstaande tabel van Microsoft.

| Teams-omgeving | OpenClaw-configuratie                                      | Proactieve `serviceUrl`                             |
| ----------------- | ----------------------------------------------------------- | -------------------------------------------------- |
| Openbaar          | geen cloud-/serviceUrl-configuratie nodig                  | `https://smba.trafficmanager.net/teams`            |
| GCC               | stel `serviceUrl` in; er bestaat geen afzonderlijke Teams-SDK-cloudvoorinstelling | `https://smba.infra.gcc.teams.microsoft.com/teams` |
| GCC High          | `cloud: "USGov"` + `serviceUrl`                             | `https://smba.infra.gov.teams.microsoft.us/teams`  |
| DoD               | `cloud: "USGovDoD"` + `serviceUrl`                          | `https://smba.infra.dod.teams.microsoft.us/teams`  |
| China/21Vianet    | `cloud: "China"`                                            | gebruik de `serviceUrl` van de inkomende activiteit           |

Voorbeeld voor GCC, waarvoor Microsoft een afzonderlijke proactieve service-URL documenteert, maar de Teams-SDK geen afzonderlijke GCC-cloudvoorinstelling biedt:

```json
{
  "channels": {
    "msteams": {
      "serviceUrl": "https://smba.infra.gcc.teams.microsoft.com/teams"
    }
  }
}
```

Voorbeeld voor GCC High:

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

`channels.msteams.serviceUrl` is beperkt tot ondersteunde Microsoft Teams Bot Connector-hosts. Wanneer een service-URL is geconfigureerd, controleert OpenClaw of de opgeslagen gespreks-`serviceUrl` dezelfde host gebruikt voordat proactieve verzendingen, bewerkingen, verwijderingen, kaarten, peilingen of in de wachtrij geplaatste langlopende antwoorden worden uitgevoerd. Met de standaardconfiguratie voor de openbare cloud weigert OpenClaw de bewerking als een opgeslagen gesprek naar een locatie buiten de openbare Teams Connector-host verwijst. Ontvang na het wijzigen van de cloud-/service-URL-instellingen een nieuw bericht uit het gesprek, zodat de opgeslagen gespreksreferentie actueel is.

China/21Vianet heeft geen afzonderlijke wereldwijde proactieve `smba`-URL in de tabel met proactieve Teams-eindpunten van Microsoft. Configureer `cloud: "China"`, zodat de Teams-SDK Azure China-eindpunten voor authenticatie, tokens en JWT gebruikt. Proactieve verzendingen vereisen vervolgens een opgeslagen gespreksreferentie van een inkomende China Teams-activiteit, of een expliciet geconfigureerde service-URL, binnen de Azure China Bot Framework-kanaalgrens (`*.botframework.azure.cn`). Op Graph gebaseerde Teams-helpers zijn uitgeschakeld voor `cloud: "China"` totdat OpenClaw Graph-aanvragen via het Azure China Graph-eindpunt routeert.

### Opmaak

Teams-markdown is beperkter dan Slack- of Discord-markdown:

- Basisopmaak werkt: **vet**, _cursief_, `code`, links.
- Complexe markdown (tabellen, geneste lijsten) wordt mogelijk niet correct weergegeven.
- Adaptive Cards worden ondersteund voor peilingen en verzendingen met semantische presentatie (zie hieronder).

## Configuratie

Belangrijkste instellingen (zie [/gateway/configuration](/nl/gateway/configuration) voor gedeelde kanaalpatronen):

- `channels.msteams.enabled`: het kanaal in-/uitschakelen.
- `channels.msteams.appId`, `channels.msteams.appPassword`, `channels.msteams.tenantId`: botreferenties.
- `channels.msteams.cloud`: Teams SDK-cloudomgeving (`Public`, `USGov`, `USGovDoD` of `China`; standaard `Public`). Stel dit met `serviceUrl` in voor USGov/DoD SDK-clouds; China gebruikt de SDK-voorinstelling en opgeslagen Azure China Bot Framework-gespreksreferenties, waarbij Graph-ondersteunde helpers zijn uitgeschakeld totdat routering voor Azure China Graph beschikbaar is.
- `channels.msteams.serviceUrl`: grens van de Bot Connector-service-URL voor proactieve SDK-bewerkingen. De openbare cloud gebruikt de SDK-standaard; stel dit in voor GCC (`https://smba.infra.gcc.teams.microsoft.com/teams`), GCC High of DoD. China accepteert Azure China Bot Framework-kanaalhosts wanneer de opgeslagen gespreksreferentie afkomstig is van Teams beheerd door 21Vianet.
- `channels.msteams.webhook.port` (standaard `3978`).
- `channels.msteams.webhook.path` (standaard `/api/messages`).
- `channels.msteams.dmPolicy`: `pairing | allowlist | open | disabled` (standaard `pairing`).
- `channels.msteams.allowFrom`: toelatingslijst voor DM's (AAD-object-id's aanbevolen). De wizard zet tijdens de installatie namen om in id's wanneer Graph-toegang beschikbaar is.
- `channels.msteams.dangerouslyAllowNameMatching`: noodschakelaar om veranderlijke overeenkomsten op basis van UPN/weergavenaam en directe routering op team-/kanaalnaam opnieuw in te schakelen.
- `channels.msteams.textChunkLimit`: grootte van uitgaande tekstsegmenten in tekens (standaard `4000`, met een harde bovengrens van `4000`, ongeacht een hoger geconfigureerde waarde).
- `channels.msteams.streaming.chunkMode`: `length` (standaard) of `newline` om vóór segmentering op lengte te splitsen op lege regels (alineagrenzen).
- `channels.msteams.mediaAllowHosts`: toelatingslijst voor hosts van inkomende bijlagen (standaard Microsoft-/Teams-domeinen: Graph, SharePoint/OneDrive, Teams CDN, Bot Framework, Azure Media Services).
- `channels.msteams.mediaAuthAllowHosts`: toelatingslijst voor het toevoegen van Authorization-headers bij nieuwe pogingen voor media (standaard Graph- en Bot Framework-hosts).
- `channels.msteams.graphMediaFallback`: Graph-zoekacties voor berichten inschakelen wanneer HTML van kanalen/groepen geen bestandsmarkeringen bevat (standaard `false`; zie [Bestandsherstel voor kanalen/groepen](#channelgroup-file-recovery-graphmediafallback)).
- `channels.msteams.mediaMaxMb`: kanaalspecifieke overschrijving van de limiet voor mediagrootte in MB. Valt terug op `agents.defaults.mediaMaxMb` wanneer niet ingesteld.
- `channels.msteams.requireMention`: @vermelding vereisen in kanalen/groepen (standaard `true`).
- `channels.msteams.replyStyle`: `thread | top-level` (zie [Antwoordstijl](#reply-style-threads-vs-posts)).
- `channels.msteams.teams.<teamId>.replyStyle`: overschrijving per team.
- `channels.msteams.teams.<teamId>.requireMention`: overschrijving per team.
- `channels.msteams.teams.<teamId>.tools`: standaardoverschrijvingen per team voor toolbeleid (`allow`/`deny`/`alsoAllow`) die worden gebruikt wanneer een kanaaloverschrijving ontbreekt.
- `channels.msteams.teams.<teamId>.toolsBySender`: standaardoverschrijvingen per team en per afzender voor toolbeleid (jokerteken `"*"` wordt ondersteund).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`: overschrijving per kanaal.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.requireMention`: overschrijving per kanaal.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.tools`: overschrijvingen per kanaal voor toolbeleid (`allow`/`deny`/`alsoAllow`).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.toolsBySender`: overschrijvingen per kanaal en per afzender voor toolbeleid (jokerteken `"*"` wordt ondersteund).
- `toolsBySender`-sleutels moeten expliciete voorvoegsels gebruiken: `channel:`, `id:`, `e164:`, `username:`, `name:` (verouderde sleutels zonder voorvoegsel worden nog uitsluitend aan `id:` gekoppeld).
- `channels.msteams.authType`: authenticatietype: `"secret"` (standaard) of `"federated"`.
- `channels.msteams.certificatePath`: pad naar PEM-certificaatbestand (federatieve authenticatie en certificaatauthenticatie).
- `channels.msteams.certificateThumbprint`: certificaatvingerafdruk; wordt geaccepteerd, maar is niet vereist voor authenticatie.
- `channels.msteams.useManagedIdentity`: authenticatie met beheerde identiteit inschakelen (federatieve modus).
- `channels.msteams.managedIdentityClientId`: client-id voor een door de gebruiker toegewezen beheerde identiteit.
- `channels.msteams.sharePointSiteId`: SharePoint-site-id voor bestandsuploads in groepschats/kanalen (zie [Bestanden verzenden in groepschats](#sending-files-in-group-chats)).
- `channels.msteams.welcomeCard`, `channels.msteams.groupWelcomeCard`, `channels.msteams.promptStarters`: Adaptive Card als welkomstbericht dat bij het eerste DM-/groepscontact wordt weergegeven, met de bijbehorende knoppen voor voorgestelde prompts.
- `channels.msteams.responsePrefix`: tekst die vóór uitgaande antwoorden wordt geplaatst.
- `channels.msteams.feedbackEnabled` (standaard `true`), `channels.msteams.feedbackReflection` (standaard `true`), `channels.msteams.feedbackReflectionCooldownMs`: feedback met duim omhoog/omlaag op antwoorden en de reflectieve vervolgvraag na negatieve feedback.
- `channels.msteams.sso`, `channels.msteams.delegatedAuth`: Bot Framework OAuth-verbinding en gedelegeerde Graph-bereiken voor door SSO ondersteunde stromen; `sso.enabled: true` vereist `sso.connectionName`.

## Routering en sessies

- Sessiesleutels volgen de standaardindeling voor agents (zie [/concepts/session](/nl/concepts/session)):
  - Directe berichten delen de hoofdsessie (`agent:<agentId>:<mainKey>`).
  - Kanaal-/groepsberichten gebruiken de gespreks-id:
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## Antwoordstijl: threads versus posts

Teams heeft twee kanaal-UI-stijlen boven op hetzelfde onderliggende gegevensmodel:

| Stijl                    | Beschrijving                                               | Aanbevolen `replyStyle` |
| ------------------------ | --------------------------------------------------------- | ------------------------ |
| **Posts** (klassiek)      | Berichten verschijnen als kaarten met daaronder antwoorden in threads | `thread` (standaard)       |
| **Threads** (zoals Slack) | Berichten verlopen lineair, meer zoals in Slack                   | `top-level`              |

**Het probleem:** de Teams-API maakt niet bekend welke UI-stijl een kanaal gebruikt. Als je de verkeerde `replyStyle` gebruikt:

- `thread` in een kanaal met de Threads-stijl → antwoorden worden onhandig genest weergegeven.
- `top-level` in een kanaal met de Posts-stijl → antwoorden verschijnen als afzonderlijke posts op het hoogste niveau in plaats van in de thread.

**Oplossing:** configureer `replyStyle` per kanaal op basis van hoe het kanaal is ingesteld:

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

### Resolutievolgorde

Wanneer de bot een antwoord naar een kanaal verzendt, wordt `replyStyle` bepaald vanaf de meest specifieke overschrijving tot aan de standaardwaarde. De eerste waarde die niet `undefined` is, wint:

1. **Per kanaal** - `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`
2. **Per team** - `channels.msteams.teams.<teamId>.replyStyle`
3. **Globaal** - `channels.msteams.replyStyle`
4. **Impliciete standaardwaarde** - afgeleid van `requireMention`:
   - `requireMention: true` → `thread`
   - `requireMention: false` → `top-level`

Als je `requireMention: false` globaal instelt zonder een expliciete `replyStyle`, verschijnen vermeldingen in kanalen met de Posts-stijl als posts op het hoogste niveau, zelfs wanneer het inkomende bericht een antwoord in een thread was. Zet `replyStyle: "thread"` vast op globaal, team- of kanaalniveau om verrassingen te voorkomen.

Voor proactieve verzendingen naar een opgeslagen kanaalgesprek (antwoorden op toolaanroepen in een wachtrij, langlopende agents) geldt dezelfde team-/kanaalresolutie; groepschats en persoonlijke gesprekken (DM's) worden voor proactieve verzendingen altijd omgezet naar `top-level`, ongeacht `replyStyle`.

### Behoud van threadcontext

Wanneer `replyStyle: "thread"` van kracht is en de bot vanuit een kanaalthread met @ is vermeld, koppelt OpenClaw de oorspronkelijke threadroot opnieuw aan de uitgaande gespreksreferentie (`19:...@thread.tacv2;messageid=<root>`), zodat het antwoord in dezelfde thread terechtkomt. Dit geldt voor zowel live verzendingen (binnen dezelfde beurt) als proactieve verzendingen nadat de context van de Bot Framework-beurt is verlopen (bijvoorbeeld langlopende agents en antwoorden op toolaanroepen in een wachtrij via `mcp__openclaw__message`).

De threadroot wordt overgenomen uit de opgeslagen `threadId` in de gespreksreferentie. Oudere opgeslagen referenties van vóór `threadId` vallen terug op `activityId` (de inkomende activiteit waarmee het gesprek het laatst is geïnitialiseerd), zodat bestaande implementaties zonder nieuwe initialisatie blijven werken.

Wanneer `replyStyle: "top-level"` van kracht is, worden inkomende berichten in kanaalthreads bewust beantwoord als nieuwe posts op het hoogste niveau; er wordt geen threadsuffix toegevoegd. Dit is correct voor kanalen met de Threads-stijl; als posts op het hoogste niveau verschijnen waar je antwoorden in threads verwachtte, is `replyStyle` voor dat kanaal onjuist ingesteld.

## Bijlagen en afbeeldingen

**Huidige beperkingen:**

- **DM's:** afbeeldingen en bestandsbijlagen werken via de Teams-botbestands-API's.
- **Kanalen/groepen:** bijlagen worden opgeslagen in M365-opslag (SharePoint/OneDrive). De Webhook-payload bevat alleen een HTML-stub, niet de daadwerkelijke bestandsbytes. **Graph API-machtigingen zijn vereist** om kanaalbijlagen te downloaden.
- Gebruik voor expliciete verzendingen waarbij het bestand vooropstaat `action=upload-file` met `media` / `filePath` / `path`; de optionele `message` wordt de bijbehorende tekst/opmerking en `filename` (of `title`) overschrijft de geüploade naam.

Zonder Graph-machtigingen komen kanaalberichten met afbeeldingen alleen als tekst binnen (de bot heeft geen toegang tot de inhoud van de afbeelding).
Standaard downloadt OpenClaw alleen media van Microsoft-/Teams-hostnamen. Overschrijf dit met `channels.msteams.mediaAllowHosts` (gebruik `["*"]` om elke host toe te staan).
Authorization-headers worden alleen toegevoegd voor hosts in `channels.msteams.mediaAuthAllowHosts` (standaard Graph- en Bot Framework-hosts). Houd deze lijst strikt (vermijd achtervoegsels voor meerdere tenants).

## Bestanden verzenden in groepschats

Bots kunnen bestanden in DM's verzenden via de ingebouwde FileConsentCard-stroom. **Voor het verzenden van bestanden in groepschats/kanalen** is aanvullende configuratie vereist:

| Context                  | Hoe bestanden worden verzonden                           | Vereiste configuratie                                    |
| ------------------------ | -------------------------------------------- | ----------------------------------------------- |
| **DM's**                  | FileConsentCard → gebruiker accepteert → bot uploadt | Werkt direct                            |
| **Groepschats/kanalen** | Uploaden naar SharePoint → systeemeigen bestandskaart      | Vereist `sharePointSiteId` + Graph-machtigingen |
| **Afbeeldingen (elke context)** | Inline gecodeerd met Base64                        | Werkt direct                            |

### Waarom groepschats SharePoint nodig hebben

Bots gebruiken een toepassingsidentiteit, terwijl de `/me`-resource van Microsoft Graph [een aangemelde gebruiker vereist](https://learn.microsoft.com/en-us/graph/api/user-get?view=graph-rest-1.0). Om bestanden in groepschats/kanalen te verzenden, uploadt de bot ze naar een **SharePoint-site** en maakt deze een koppeling om te delen.

### Configuratie

1. **Voeg Graph API-machtigingen toe** in Entra ID (Azure AD) → App Registration:
   - `Sites.ReadWrite.All` (toepassing) - bestanden uploaden naar SharePoint.
   - `ChatMember.Read.All` (toepassing) - tenantbrede machtiging met minimale bevoegdheden voor het verzenden van bestanden in groepschats. `Chat.Read.All` werkt ook en dekt dit al wanneer de geschiedenis van groepschats is ingeschakeld. Gebruik als alternatief per chat de `ChatMember.Read.Chat`-[machtiging voor resourcespecifieke toestemming](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent).
2. **Verleen beheerderstoestemming** voor de tenant.
3. **Haal de id van je SharePoint-site op:**

   ```bash
   # Via Graph Explorer of curl met een geldig token:
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/{hostname}:/{site-path}"

   # Voorbeeld: voor een site op "contoso.sharepoint.com/sites/BotFiles"
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com:/sites/BotFiles"

   # Antwoord bevat: "id": "contoso.sharepoint.com,guid1,guid2"
   ```

4. **OpenClaw configureren:**

   ```json5
   {
     channels: {
       msteams: {
         // ... overige configuratie ...
         sharePointSiteId: "contoso.sharepoint.com,guid1,guid2",
       },
     },
   }
   ```

### Deelgedrag

| Context en machtiging                                                  | Deelgedrag                                                       |
| ---------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Kanaal + `Sites.ReadWrite.All`                                           | Deelbare koppeling voor de hele organisatie (iedereen in de organisatie heeft toegang) |
| Groepschat + `Sites.ReadWrite.All` + een ondersteunde leestoekenning voor chatleden | Deelbare koppeling per gebruiker (alleen chatleden hebben toegang) |
| Groepschat zonder ondersteunde leestoekenning voor chatleden           | Verzenden wordt veilig geweigerd                                 |

Delen per gebruiker is veiliger, omdat alleen chatdeelnemers toegang hebben tot het bestand. OpenClaw vereist dat het opzoeken van leden voor groepschats slaagt; bij time-outs, transportfouten, lege resultaten en weigeringen van de Graph API mislukt het verzenden in plaats van de toegang uit te breiden naar de organisatie.

### Terugvalgedrag

| Scenario                                                         | Resultaat                                               |
| ---------------------------------------------------------------- | ------------------------------------------------------- |
| Groepschat + bestand + SharePoint- en ledenmachtigingen geconfigureerd | Uploaden naar SharePoint, een systeemeigen bestandskaart verzenden |
| Groepschat + bestand + ontbrekende SharePoint- of ledenmachtigingen | Mislukken met een uitvoerbare configuratiefout          |
| Kanaal + bestand + `sharePointSiteId` geconfigureerd             | Uploaden naar SharePoint, een systeemeigen bestandskaart verzenden |
| Persoonlijke chat + bestand                                      | FileConsentCard-stroom (werkt zonder SharePoint)        |
| Elke context + afbeelding                                        | Inline met Base64-codering (werkt zonder SharePoint)    |

### Opslaglocatie van bestanden

Geüploade bestanden worden opgeslagen in een map `/OpenClawShared/` in de standaarddocumentbibliotheek van de geconfigureerde SharePoint-site.

## Peilingen (Adaptive Cards)

OpenClaw verzendt Teams-peilingen als Adaptive Cards (er is geen systeemeigen Teams-API voor peilingen).

- CLI: `openclaw message poll --channel msteams --target conversation:<id> --poll-question "..." --poll-option "..." --poll-option "..."`.
- Stemmen worden door de Gateway vastgelegd in de SQLite-database met OpenClaw-pluginstatus onder `state/openclaw.sqlite`.
- Bestaande `msteams-polls.json`-bestanden worden geïmporteerd door `openclaw doctor --fix`, niet door de actieve plugin.
- De Gateway moet online blijven om stemmen vast te leggen.
- Peilingen plaatsen niet automatisch samenvattingen van resultaten en er is nog geen CLI voor peilingresultaten.

## Presentatiekaarten

Verzend semantische presentatiepayloads naar Teams-gebruikers of -gesprekken met het hulpprogramma `message`, de CLI of normale antwoordbezorging. OpenClaw geeft ze vanuit het generieke presentatiecontract weer als Teams Adaptive Cards.

De parameter `presentation` accepteert semantische blokken. Wanneer `presentation` is opgegeven, is de berichttekst optioneel. Knoppen worden weergegeven als verzend- of URL-acties van Adaptive Cards. Selectiemenu's zijn niet systeemeigen in de Teams-renderer, dus zet OpenClaw ze vóór bezorging om in leesbare tekst.

**Agenthulpprogramma:**

```json5
{
  action: "send",
  channel: "msteams",
  target: "user:<id>",
  presentation: {
    title: "Hallo",
    blocks: [{ type: "text", text: "Hallo!" }],
  },
}
```

**CLI:**

```bash
openclaw message send --channel msteams \
  --target "conversation:19:abc...@thread.tacv2" \
  --presentation '{"title":"Hallo","blocks":[{"type":"text","text":"Hallo!"}]}'
```

Zie [Doelindelingen](#target-formats) hieronder voor details over de doelindeling.

## Doelindelingen

MSTeams-doelen gebruiken voorvoegsels om onderscheid te maken tussen gebruikers en gesprekken:

| Doeltype            | Indeling                         | Voorbeeld                                                                                               |
| ------------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Gebruiker (op ID)   | `user:<aad-object-id>`               | `user:40a1a0ed-4ff2-4164-a219-55518990c197`                                                                                      |
| Gebruiker (op naam) | `user:<display-name>`               | `user:John Smith` (vereist Graph API)                                                                  |
| Groep/kanaal        | `conversation:<conversation-id>`               | `conversation:19:abc123...@thread.tacv2`                                                                                      |
| Groep/kanaal (onbewerkt) | `<conversation-id>`          | `19:abc123...@thread.tacv2`, `19:...@unq.gbl.spaces` of een kale `a:`/`8:orgid:`/`29:` Bot Framework-id |

**CLI-voorbeelden:**

```bash
# Naar een gebruiker verzenden op basis van ID
openclaw message send --channel msteams --target "user:40a1a0ed-..." --message "Hallo"

# Naar een gebruiker verzenden op basis van weergavenaam (activeert opzoeken via Graph API)
openclaw message send --channel msteams --target "user:John Smith" --message "Hallo"

# Naar een groepschat of kanaal verzenden
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" --message "Hallo"

# Een presentatiekaart naar een gesprek verzenden
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" \
  --presentation '{"title":"Hallo","blocks":[{"type":"text","text":"Hallo"}]}'
```

**Voorbeelden voor het agenthulpprogramma:**

```json5
{
  action: "send",
  channel: "msteams",
  target: "user:John Smith",
  message: "Hallo!",
}
```

```json5
{
  action: "send",
  channel: "msteams",
  target: "conversation:19:abc...@thread.tacv2",
  presentation: {
    title: "Hallo",
    blocks: [{ type: "text", text: "Hallo" }],
  },
}
```

<Note>
Zonder het voorvoegsel `user:` worden namen standaard als groep of team opgezocht. Gebruik altijd `user:` wanneer je personen op basis van hun weergavenaam als doel instelt.
</Note>

## Proactieve berichten

- Proactieve berichten zijn alleen mogelijk **nadat** een gebruiker interactie heeft gehad, omdat OpenClaw op dat moment gespreksverwijzingen opslaat.
- Zie [/gateway/configuration](/nl/gateway/configuration) voor `dmPolicy` en beperking via een toelatingslijst.

## Team- en kanaal-ID's (veelvoorkomende valkuil)

De queryparameter `groupId` in Teams-URL's is **NIET** de team-ID die voor de configuratie wordt gebruikt. Haal de ID's in plaats daarvan uit het URL-pad:

**Team-URL:**

```text
https://teams.microsoft.com/l/team/19%3ABk4j...%40thread.tacv2/conversations?groupId=...
                                    └────────────────────────────┘
                                    Teamgespreks-ID (URL-decodeer deze)
```

**Kanaal-URL:**

```text
https://teams.microsoft.com/l/channel/19%3A15bc...%40thread.tacv2/ChannelName?groupId=...
                                      └─────────────────────────┘
                                      Kanaal-ID (URL-decodeer deze)
```

**Voor configuratie:**

- Teamsleutel = padsegment na `/team/` (URL-gedecodeerd, bijvoorbeeld `19:Bk4j...@thread.tacv2`; oudere tenants kunnen `@thread.skype` weergeven, wat ook geldig is).
- Kanaalsleutel = padsegment na `/channel/` (URL-gedecodeerd).
- **Negeer** de queryparameter `groupId` voor OpenClaw-routering. Dit is de Microsoft Entra-groeps-ID, niet de Bot Framework-gespreks-ID die in inkomende Teams-activiteiten wordt gebruikt.

## Privékanalen

Bots hebben beperkte ondersteuning in privékanalen:

| Functie                      | Standaardkanalen | Privékanalen               |
| ---------------------------- | ---------------- | -------------------------- |
| Botinstallatie               | Ja               | Beperkt                    |
| Realtimeberichten (Webhook)  | Ja               | Werkt mogelijk niet        |
| RSC-machtigingen             | Ja               | Kunnen zich anders gedragen |
| @vermeldingen                | Ja               | Als de bot toegankelijk is |
| Geschiedenis via Graph API   | Ja               | Ja (met machtigingen)      |

**Tijdelijke oplossingen als privékanalen niet werken:**

1. Gebruik standaardkanalen voor interacties met de bot.
2. Gebruik privéberichten; gebruikers kunnen de bot altijd rechtstreeks een bericht sturen.
3. Gebruik Graph API voor historische toegang (vereist `ChannelMessage.Read.All`).

## Probleemoplossing

### Veelvoorkomende problemen

- **Afbeeldingen worden niet weergegeven in kanalen:** Graph-machtigingen of beheerderstoestemming ontbreken. Installeer de Teams-app opnieuw, sluit Teams volledig af en open het opnieuw.
- **Geen antwoorden in het kanaal:** vermeldingen zijn standaard vereist; stel `channels.msteams.requireMention=false` in of configureer dit per team/kanaal.
- **Versie komt niet overeen (Teams toont nog steeds het oude manifest):** verwijder de app, voeg deze opnieuw toe, sluit Teams volledig af en open het opnieuw om te vernieuwen.
- **401 Unauthorized van de webhook:** verwacht bij handmatig testen zonder een Azure-JWT; dit betekent dat het eindpunt bereikbaar is, maar dat de authenticatie is mislukt. Gebruik Azure Web Chat om correct te testen.

### Fouten bij het uploaden van het manifest

- **"Icon file cannot be empty":** het manifest verwijst naar pictogrambestanden van 0 bytes. Maak geldige PNG-pictogrammen (32x32 voor `outline.png`, 192x192 voor `color.png`).
- **"webApplicationInfo.Id already in use":** de app is nog in een ander team of een andere chat geïnstalleerd. Zoek de app en verwijder deze eerst, of wacht 5-10 minuten op de propagatie.
- **"Something went wrong" bij het uploaden:** upload in plaats daarvan via [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com), open de browserontwikkelaarshulpmiddelen (F12) → tabblad Network en controleer de antwoordbody op de werkelijke fout.
- **Sideloaden mislukt:** probeer "Upload an app to your org's app catalog" in plaats van "Upload a custom app"; hiermee worden sideloadbeperkingen vaak omzeild.

### RSC-machtigingen werken niet

1. Controleer of `webApplicationInfo.id` exact overeenkomt met de App ID van je bot.
2. Upload de app opnieuw en installeer deze opnieuw in het team/de chat.
3. Controleer of de beheerder van je organisatie RSC-machtigingen heeft geblokkeerd.
4. Bevestig dat je het juiste bereik gebruikt: `ChannelMessage.Read.Group` voor teams, `ChatMessage.Read.Chat` voor groepschats.

## Verwijzingen

- [Azure Bot maken](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) - installatiehandleiding voor Azure Bot
- [Teams Developer Portal](https://dev.teams.microsoft.com/apps) - Teams-apps maken/beheren
- [Manifestschema voor Teams-apps](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [Kanaalberichten ontvangen met RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [Naslaginformatie voor RSC-machtigingen](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [Bestandsverwerking door Teams-bots](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4) (kanaal/groep vereist Graph)
- [Proactieve berichten](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)
- [@microsoft/teams.cli](https://www.npmjs.com/package/@microsoft/teams.cli) - Teams-CLI voor botbeheer

## Gerelateerd

- [Overzicht van kanalen](/nl/channels) - alle ondersteunde kanalen
- [Koppelen](/nl/channels/pairing) - DM-authenticatie en koppelingsproces
- [Groepen](/nl/channels/groups) - gedrag van groepschats en vermelding als voorwaarde
- [Kanaalroutering](/nl/channels/channel-routing) - sessieroutering voor berichten
- [Beveiliging](/nl/gateway/security) - toegangsmodel en beveiligingsversterking
