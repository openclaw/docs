---
read_when:
    - Werken aan Microsoft Teams-kanaalfuncties
summary: Ondersteuningsstatus, mogelijkheden en configuratie van de Microsoft Teams-bot
title: Microsoft Teams
x-i18n:
    generated_at: "2026-06-27T17:11:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cad5dc92b3a70e85412cbf34c926d7211dce7534c31387744e6f085bcfe23f08
    source_path: channels/msteams.md
    workflow: 16
---

Status: tekst + DM-bijlagen worden ondersteund; bestanden verzenden in kanalen/groepen vereist `sharePointSiteId` + Graph-machtigingen (zie [Bestanden verzenden in groepschats](#sending-files-in-group-chats)). Polls worden verzonden via Adaptive Cards. Berichtacties bieden expliciet `upload-file` voor sends waarbij het bestand eerst komt.

## Gebundelde Plugin

Microsoft Teams wordt in huidige OpenClaw-releases geleverd als gebundelde Plugin, dus in de normale packaged build is geen
aparte installatie vereist.

Als je een oudere build gebruikt of een aangepaste installatie die gebundelde Teams uitsluit,
installeer het npm-pakket dan direct:

```bash
openclaw plugins install @openclaw/msteams
```

Gebruik het kale pakket om de huidige officiële release-tag te volgen. Pin een exacte
versie alleen wanneer je een reproduceerbare installatie nodig hebt.

Lokale checkout (wanneer je vanuit een git-repo draait):

```bash
openclaw plugins install ./path/to/local/msteams-plugin
```

Details: [Plugins](/nl/tools/plugin)

## Snelle setup

De [`@microsoft/teams.cli`](https://www.npmjs.com/package/@microsoft/teams.cli) verwerkt botregistratie, manifestaanmaak en credentialgeneratie in één command.

**1. Installeer en log in**

```bash
npm install -g @microsoft/teams.cli@preview
teams login
teams status   # verify you're logged in and see your tenant info
```

<Note>
De Teams CLI is momenteel in preview. Commands en flags kunnen tussen releases veranderen.
</Note>

**2. Start een tunnel** (Teams kan localhost niet bereiken)

Installeer en authenticeer de devtunnel CLI als je dat nog niet hebt gedaan ([aan-de-slag-gids](https://learn.microsoft.com/en-us/azure/developer/dev-tunnels/get-started)).

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

Dit ene command:

- Maakt een Entra ID-applicatie (Azure AD) aan
- Genereert een client secret
- Bouwt en uploadt een Teams-appmanifest (met pictogrammen)
- Registreert de bot (standaard beheerd door Teams - geen Azure-abonnement nodig)

De output toont `CLIENT_ID`, `CLIENT_SECRET`, `TENANT_ID` en een **Teams App ID** - noteer deze voor de volgende stappen. Ook wordt aangeboden om de app direct in Teams te installeren.

**4. Configureer OpenClaw** met de credentials uit de output:

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

`teams app create` vraagt je om de app te installeren - selecteer "Installeren in Teams". Als je dit hebt overgeslagen, kun je de link later ophalen:

```bash
teams app get <teamsAppId> --install-link
```

**6. Controleer of alles werkt**

```bash
teams app doctor <teamsAppId>
```

Dit voert diagnostiek uit voor botregistratie, AAD-appconfiguratie, manifestgeldigheid en SSO-setup.

Voor productie-implementaties kun je overwegen [gefedereerde authenticatie](/nl/channels/msteams#federated-authentication-certificate-plus-managed-identity) (certificaat of beheerde identiteit) te gebruiken in plaats van client secrets.

<Note>
Groepschats worden standaard geblokkeerd (`channels.msteams.groupPolicy: "allowlist"`). Om groepsantwoorden toe te staan, stel je `channels.msteams.groupAllowFrom` in, of gebruik je `groupPolicy: "open"` om elk lid toe te staan (vermelding vereist).
</Note>

## Doelen

- Praat met OpenClaw via Teams-DM's, groepschats of kanalen.
- Houd routing deterministisch: antwoorden gaan altijd terug naar het kanaal waarop ze binnenkwamen.
- Gebruik standaard veilig kanaalgedrag (vermeldingen vereist tenzij anders geconfigureerd).

## Configuratieschrijfacties

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
- `channels.msteams.allowFrom` moet stabiele AAD-object-ID's gebruiken of statische afzendertoegangsgroepen zoals `accessGroup:core-team`.
- Vertrouw niet op UPN-/weergavenaam-matching voor allowlists - die kunnen veranderen. OpenClaw schakelt directe naammatching standaard uit; schakel dit expliciet in met `channels.msteams.dangerouslyAllowNameMatching: true`.
- De wizard kan namen naar ID's herleiden via Microsoft Graph wanneer credentials dat toestaan.

**Groepstoegang**

- Standaard: `channels.msteams.groupPolicy = "allowlist"` (geblokkeerd tenzij je `groupAllowFrom` toevoegt). Gebruik `channels.defaults.groupPolicy` om de standaardwaarde te overschrijven wanneer deze niet is ingesteld.
- `channels.msteams.groupAllowFrom` bepaalt welke afzenders of statische afzendertoegangsgroepen in groepschats/kanalen kunnen triggeren (valt terug op `channels.msteams.allowFrom`).
- Stel `groupPolicy: "open"` in om elk lid toe te staan (standaard nog steeds met vermelding vereist).
- Om **geen kanalen** toe te staan, stel je `channels.msteams.groupPolicy: "disabled"` in.

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

**Teams + kanaal-allowlist**

- Beperk groeps-/kanaalantwoorden door teams en kanalen te vermelden onder `channels.msteams.teams`.
- Sleutels moeten stabiele Teams-gespreks-ID's uit Teams-links gebruiken, geen veranderlijke weergavenamen.
- Wanneer `groupPolicy="allowlist"` en er een teams-allowlist aanwezig is, worden alleen vermelde teams/kanalen geaccepteerd (met vermelding vereist).
- De configuratiewizard accepteert `Team/Channel`-items en slaat ze voor je op.
- Bij het opstarten herleidt OpenClaw namen van team/kanaal- en gebruikers-allowlists naar ID's (wanneer Graph-machtigingen dat toestaan)
  en logt de mapping; niet-herleide team-/kanaalnamen worden behouden zoals getypt, maar standaard genegeerd voor routing tenzij `channels.msteams.dangerouslyAllowNameMatching: true` is ingeschakeld.

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
<summary><strong>Handmatige setup (zonder de Teams CLI)</strong></summary>

Als je de Teams CLI niet kunt gebruiken, kun je de bot handmatig instellen via de Azure Portal.

### Hoe het werkt

1. Zorg ervoor dat de Microsoft Teams Plugin beschikbaar is (gebundeld in huidige releases).
2. Maak een **Azure Bot** aan (App ID + secret + tenant ID).
3. Bouw een **Teams-apppakket** dat naar de bot verwijst en de onderstaande RSC-machtigingen bevat.
4. Upload/installeer de Teams-app in een team (of persoonlijke scope voor DM's).
5. Configureer `msteams` in `~/.openclaw/openclaw.json` (of env-vars) en start de Gateway.
6. De Gateway luistert standaard naar Bot Framework Webhook-verkeer op `/api/messages`.

### Stap 1: Maak Azure Bot aan

1. Ga naar [Azure Bot maken](https://portal.azure.com/#create/Microsoft.AzureBot)
2. Vul het tabblad **Basis** in:

   | Veld               | Waarde                                                   |
   | ------------------ | -------------------------------------------------------- |
   | **Bothandle**      | Je botnaam, bijv. `openclaw-msteams` (moet uniek zijn)   |
   | **Abonnement**     | Selecteer je Azure-abonnement                            |
   | **Resourcegroep**  | Maak nieuw aan of gebruik een bestaande                  |
   | **Prijscategorie** | **Gratis** voor dev/testen                               |
   | **Type app**       | **Eén tenant** (aanbevolen - zie opmerking hieronder)    |
   | **Aanmaaktype**    | **Nieuwe Microsoft App ID maken**                        |

<Warning>
Het aanmaken van nieuwe multi-tenant bots is na 2025-07-31 afgeschaft. Gebruik **Eén tenant** voor nieuwe bots.
</Warning>

3. Klik op **Beoordelen + maken** → **Maken** (wacht ~1-2 minuten)

### Stap 2: Credentials ophalen

1. Ga naar je Azure Bot-resource → **Configuratie**
2. Kopieer **Microsoft App ID** → dit is je `appId`
3. Klik op **Wachtwoord beheren** → ga naar de App Registration
4. Onder **Certificaten en geheimen** → **Nieuw client secret** → kopieer de **Waarde** → dit is je `appPassword`
5. Ga naar **Overzicht** → kopieer **Directory (tenant) ID** → dit is je `tenantId`

### Stap 3: Messaging-endpoint configureren

1. In Azure Bot → **Configuratie**
2. Stel **Messaging-endpoint** in op je Webhook-URL:
   - Productie: `https://your-domain.com/api/messages`
   - Lokale dev: gebruik een tunnel (zie [Lokale ontwikkeling](#local-development-tunneling) hieronder)

### Stap 4: Teams-kanaal inschakelen

1. In Azure Bot → **Kanalen**
2. Klik op **Microsoft Teams** → Configureren → Opslaan
3. Accepteer de Servicevoorwaarden

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

Het Teams-kanaal start automatisch wanneer de Plugin beschikbaar is en `msteams`-configuratie met credentials bestaat.

</details>

## Gefedereerde authenticatie (certificaat plus beheerde identiteit)

> Toegevoegd in 2026.4.11

Voor productie-implementaties ondersteunt OpenClaw **gefedereerde authenticatie** als veiliger alternatief voor client secrets. Er zijn twee methoden beschikbaar:

### Optie A: Certificaatgebaseerde authenticatie

Gebruik een PEM-certificaat dat is geregistreerd bij je Entra ID-appregistratie.

**Setup:**

1. Genereer of verkrijg een certificaat (PEM-indeling met privésleutel).
2. In Entra ID → App Registration → **Certificaten en geheimen** → **Certificaten** → upload het openbare certificaat.

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

Gebruik Azure Managed Identity voor wachtwoordloze authenticatie. Dit is ideaal voor implementaties op Azure-infrastructuur (AKS, App Service, Azure-VM's) waar een beheerde identiteit beschikbaar is.

**Hoe het werkt:**

1. De bot-pod/VM heeft een beheerde identiteit (door het systeem toegewezen of door de gebruiker toegewezen).
2. Een **gefedereerde identiteitscredential** koppelt de beheerde identiteit aan de Entra ID-appregistratie.
3. Tijdens runtime gebruikt OpenClaw `@azure/identity` om tokens op te halen van het Azure IMDS-endpoint (`169.254.169.254`).
4. Het token wordt doorgegeven aan de Teams SDK voor botauthenticatie.

**Vereisten:**

- Azure-infrastructuur met beheerde identiteit ingeschakeld (AKS workload identity, App Service, VM)
- Gefedereerde identiteitscredential aangemaakt op de Entra ID-appregistratie
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
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID=<client-id>` (alleen voor door gebruiker toegewezen)

### AKS Workload Identity instellen

Voor AKS-implementaties die workload identity gebruiken:

1. **Schakel workload identity in** op je AKS-cluster.
2. **Maak een federated identity credential** op de Entra ID-appregistratie:

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

4. **Label de pod** voor injectie van workload identity:

   ```yaml
   metadata:
     labels:
       azure.workload.identity/use: "true"
   ```

5. **Zorg voor netwerktoegang** tot IMDS (`169.254.169.254`) - als je NetworkPolicy gebruikt, voeg dan een egress-regel toe die verkeer naar `169.254.169.254/32` op poort 80 toestaat.

### Vergelijking van auth-typen

| Methode               | Configuratie                                   | Voordelen                          | Nadelen                                      |
| -------------------- | ---------------------------------------------- | ---------------------------------- | -------------------------------------------- |
| **Client secret**    | `appPassword`                                  | Eenvoudige installatie             | Secretrotatie vereist, minder veilig         |
| **Certificaat**      | `authType: "federated"` + `certificatePath`    | Geen gedeeld secret via netwerk    | Extra beheerlast voor certificaten           |
| **Managed Identity** | `authType: "federated"` + `useManagedIdentity` | Zonder wachtwoord, geen secrets te beheren | Azure-infrastructuur vereist          |

**Standaardgedrag:** Wanneer `authType` niet is ingesteld, gebruikt OpenClaw standaard client-secret-authenticatie. Bestaande configuraties blijven zonder wijzigingen werken.

## Lokale ontwikkeling (tunneling)

Teams kan `localhost` niet bereiken. Gebruik een persistente dev-tunnel zodat je URL hetzelfde blijft tussen sessies:

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

## De Bot testen

**Diagnostiek uitvoeren:**

```bash
teams app doctor <teamsAppId>
```

Controleert botregistratie, AAD-app, manifest en SSO-configuratie in één keer.

**Een testbericht verzenden:**

1. Installeer de Teams-app (gebruik de installatielink van `teams app get <id> --install-link`)
2. Zoek de bot in Teams en stuur een DM
3. Controleer de Gateway-logs op inkomende activiteit

## Omgevingsvariabelen

Alle configuratiesleutels kunnen in plaats daarvan via omgevingsvariabelen worden ingesteld:

- `MSTEAMS_APP_ID`
- `MSTEAMS_APP_PASSWORD`
- `MSTEAMS_TENANT_ID`
- `MSTEAMS_AUTH_TYPE` (optioneel: `"secret"` of `"federated"`)
- `MSTEAMS_CERTIFICATE_PATH` (federated + certificaat)
- `MSTEAMS_CERTIFICATE_THUMBPRINT` (optioneel, niet vereist voor auth)
- `MSTEAMS_USE_MANAGED_IDENTITY` (federated + managed identity)
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID` (alleen door gebruiker toegewezen MI)

## Actie voor ledeninformatie

OpenClaw biedt een door Graph ondersteunde `member-info`-actie voor Microsoft Teams, zodat agents en automatiseringen kanaalledengegevens (weergavenaam, e-mail, rol) rechtstreeks vanuit Microsoft Graph kunnen ophalen.

Vereisten:

- `Member.Read.Group` RSC-machtiging (al aanwezig in het aanbevolen manifest)
- Voor lookups over meerdere teams: `User.Read.All` Graph Application-machtiging met beheerderstoestemming

De actie wordt bewaakt door `channels.msteams.actions.memberInfo` (standaard: ingeschakeld wanneer Graph-referenties beschikbaar zijn).

## Geschiedeniscontext

- `channels.msteams.historyLimit` bepaalt hoeveel recente kanaal-/groepsberichten in de prompt worden verpakt.
- Valt terug op `messages.groupChat.historyLimit`. Stel in op `0` om uit te schakelen (standaard 50).
- Opgehaalde threadgeschiedenis wordt gefilterd op afzender-allowlists (`allowFrom` / `groupAllowFrom`), zodat het vullen van threadcontext alleen berichten van toegestane afzenders bevat.
- Context van geciteerde bijlagen (`ReplyTo*` afgeleid uit Teams-antwoord-HTML) wordt momenteel doorgegeven zoals ontvangen.
- Met andere woorden: allowlists bepalen wie de agent kan activeren; alleen specifieke aanvullende contextpaden worden vandaag gefilterd.
- DM-geschiedenis kan worden beperkt met `channels.msteams.dmHistoryLimit` (gebruikersbeurten). Overrides per gebruiker: `channels.msteams.dms["<user_id>"].historyLimit`.

## Huidige Teams RSC-machtigingen (manifest)

Dit zijn de **bestaande resourceSpecific-machtigingen** in ons Teams-appmanifest. Ze gelden alleen binnen het team/de chat waar de app is geïnstalleerd.

**Voor kanalen (teambereik):**

- `ChannelMessage.Read.Group` (Application) - ontvang alle kanaalberichten zonder @mention
- `ChannelMessage.Send.Group` (Application)
- `Member.Read.Group` (Application)
- `Owner.Read.Group` (Application)
- `ChannelSettings.Read.Group` (Application)
- `TeamMember.Read.Group` (Application)
- `TeamSettings.Read.Group` (Application)

**Voor groepschats:**

- `ChatMessage.Read.Chat` (Application) - ontvang alle groepschatberichten zonder @mention

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

### Kanttekeningen bij het manifest (vereiste velden)

- `bots[].botId` **moet** overeenkomen met de Azure Bot App ID.
- `webApplicationInfo.id` **moet** overeenkomen met de Azure Bot App ID.
- `bots[].scopes` moet de oppervlakken bevatten die je wilt gebruiken (`personal`, `team`, `groupChat`).
- `bots[].supportsFiles: true` is vereist voor bestandsverwerking in persoonlijk bereik.
- `authorization.permissions.resourceSpecific` moet kanaallezen/-verzenden bevatten als je kanaalverkeer wilt.

### Een bestaande app bijwerken

Een al geïnstalleerde Teams-app bijwerken (bijvoorbeeld om RSC-machtigingen toe te voegen):

```bash
# Download, edit, and re-upload the manifest
teams app manifest download <teamsAppId> manifest.json
# Edit manifest.json locally...
teams app manifest upload manifest.json <teamsAppId>
# Version is auto-bumped if content changed
```

Installeer de app na het bijwerken opnieuw in elk team om nieuwe machtigingen van kracht te laten worden, en **sluit Teams volledig af en start het opnieuw** (niet alleen het venster sluiten) om gecachete appmetadata te wissen.

<details>
<summary>Handmatige manifestupdate (zonder CLI)</summary>

1. Werk je `manifest.json` bij met de nieuwe instellingen
2. **Verhoog het veld `version`** (bijvoorbeeld `1.0.0` → `1.1.0`)
3. **Zip het manifest opnieuw** met iconen (`manifest.json`, `outline.png`, `color.png`)
4. Upload de nieuwe zip:
   - **Teams Admin Center:** Teams-apps → Apps beheren → zoek je app → Nieuwe versie uploaden
   - **Sideload:** In Teams → Apps → Je apps beheren → Een aangepaste app uploaden

</details>

## Mogelijkheden: alleen RSC versus Graph

### Met **alleen Teams RSC** (app geïnstalleerd, geen Graph API-machtigingen)

Werkt:

- **Tekstinhoud** van kanaalberichten lezen.
- **Tekstinhoud** van kanaalberichten verzenden.
- **Persoonlijke (DM)** bestandsbijlagen ontvangen.

Werkt NIET:

- **Afbeeldings- of bestandsinhoud** van kanalen/groepen (payload bevat alleen HTML-stub).
- Bijlagen downloaden die zijn opgeslagen in SharePoint/OneDrive.
- Berichtgeschiedenis lezen (buiten de live Webhook-gebeurtenis).

### Met **Teams RSC + Microsoft Graph Application-machtigingen**

Voegt toe:

- Gehoste inhoud downloaden (afbeeldingen die in berichten zijn geplakt).
- Bestandsbijlagen downloaden die zijn opgeslagen in SharePoint/OneDrive.
- Kanaal-/chatberichtgeschiedenis lezen via Graph.

### RSC versus Graph API

| Mogelijkheid             | RSC-machtigingen     | Graph API                           |
| ------------------------ | -------------------- | ----------------------------------- |
| **Realtime berichten**   | Ja (via Webhook)     | Nee (alleen polling)                |
| **Historische berichten** | Nee                 | Ja (kan geschiedenis opvragen)      |
| **Installatiecomplexiteit** | Alleen appmanifest | Vereist beheerderstoestemming + tokenflow |
| **Werkt offline**        | Nee (moet draaien)   | Ja (altijd opvragen)                |

**Kortom:** RSC is voor realtime luisteren; Graph API is voor historische toegang. Om gemiste berichten in te halen terwijl je offline was, heb je Graph API nodig met `ChannelMessage.Read.All` (vereist beheerderstoestemming).

## Graph-ingeschakelde media + geschiedenis (vereist voor kanalen)

Als je afbeeldingen/bestanden in **kanalen** nodig hebt of **berichtgeschiedenis** wilt ophalen, moet je Microsoft Graph-machtigingen inschakelen en beheerderstoestemming verlenen.

1. Voeg in Entra ID (Azure AD) **App Registration** Microsoft Graph **Application-machtigingen** toe:
   - `ChannelMessage.Read.All` (kanaalbijlagen + geschiedenis)
   - `Chat.Read.All` of `ChatMessage.Read.All` (groepschats)
2. **Verleen beheerderstoestemming** voor de tenant.
3. Verhoog de **manifestversie** van de Teams-app, upload opnieuw en **installeer de app opnieuw in Teams**.
4. **Sluit Teams volledig af en start het opnieuw** om gecachete appmetadata te wissen.

**Aanvullende machtiging voor gebruikersvermeldingen:** @mentions van gebruikers werken standaard voor gebruikers in het gesprek. Als je echter dynamisch gebruikers wilt zoeken en vermelden die **niet in het huidige gesprek** zitten, voeg dan de `User.Read.All` (Application)-machtiging toe en verleen beheerderstoestemming.

## Bekende beperkingen

### Webhook-time-outs

Teams levert berichten via HTTP-Webhook. Als de verwerking te lang duurt (bijvoorbeeld trage LLM-antwoorden), kun je het volgende zien:

- Gateway-time-outs
- Teams probeert het bericht opnieuw te verzenden (waardoor duplicaten ontstaan)
- Weggevallen antwoorden

OpenClaw handelt dit af door snel terug te keren en proactief antwoorden te sturen, maar zeer trage reacties kunnen nog steeds problemen veroorzaken.

### Ondersteuning voor Teams-cloud en service-URL

Dit door de SDK ondersteunde Teams-pad is live-gevalideerd voor de openbare cloud van Microsoft Teams.

Inkomende antwoorden gebruiken de inkomende Teams SDK-turncontext. Proactieve bewerkingen buiten de context - verzenden, bewerken, verwijderen, kaarten, polls, berichten voor bestandstoestemming en in de wachtrij geplaatste langdurige antwoorden - gebruiken de opgeslagen gespreksreferentie `serviceUrl`. De openbare cloud gebruikt standaard de openbare-cloudomgeving van de Teams SDK en staat opgeslagen referenties toe op de openbare Teams Connector-host: `https://smba.trafficmanager.net/`.

De openbare cloud is de standaard. Je hoeft `channels.msteams.cloud` of `channels.msteams.serviceUrl` niet in te stellen voor normale bots in de openbare cloud.

Stel voor niet-openbare Teams-clouds `cloud` en de bijbehorende proactieve grens in zodra Microsoft die publiceert:

- `channels.msteams.cloud` selecteert de Teams SDK-cloudpreset voor authenticatie, JWT-validatie, tokenservices en Graph-scope.
- `channels.msteams.serviceUrl` selecteert de Bot Connector-eindpuntgrens die wordt gebruikt om opgeslagen gespreksreferenties te valideren voordat proactieve verzendingen, bewerkingen, verwijderingen, kaarten, polls, berichten voor bestandstoestemming en in de wachtrij geplaatste langdurige antwoorden worden uitgevoerd. Dit is vereist voor USGov- en DoD-SDK-clouds. Voor China/21Vianet gebruikt OpenClaw de SDK-preset `China` en accepteert het alleen opgeslagen/geconfigureerde service-URL's op Azure China Bot Framework-kanaalhosts.

Microsoft publiceert de globale proactieve Bot Connector-eindpunten in de sectie [Het gesprek maken](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages?tabs=dotnet#create-the-conversation) van de Teams-documentatie voor proactieve berichten. Gebruik de `serviceUrl` van de inkomende activiteit wanneer die beschikbaar is; als je een globaal proactief eindpunt nodig hebt, gebruik dan de tabel van Microsoft.

| Teams-omgeving | OpenClaw-configuratie                                       | Proactieve `serviceUrl`                         |
| --------------- | ----------------------------------------------------------- | ----------------------------------------------- |
| Openbaar        | geen cloud/serviceUrl-configuratie nodig                    | `https://smba.trafficmanager.net/teams`         |
| GCC             | stel `serviceUrl` in; er bestaat geen aparte Teams SDK-cloudpreset | `https://smba.infra.gcc.teams.microsoft.com/teams` |
| GCC High        | `cloud: "USGov"` + `serviceUrl`                             | `https://smba.infra.gov.teams.microsoft.us/teams` |
| DoD             | `cloud: "USGovDoD"` + `serviceUrl`                          | `https://smba.infra.dod.teams.microsoft.us/teams` |
| China/21Vianet  | `cloud: "China"`                                            | gebruik de `serviceUrl` van de inkomende activiteit |

Voorbeeld voor GCC, waar Microsoft een aparte proactieve service-URL documenteert maar de Teams SDK geen aparte GCC-cloudpreset beschikbaar stelt:

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

`channels.msteams.serviceUrl` is beperkt tot ondersteunde Microsoft Teams Bot Connector-hosts. Wanneer een service-URL is geconfigureerd, controleert OpenClaw of de opgeslagen gespreks-`serviceUrl` dezelfde host gebruikt voordat proactieve verzendingen, bewerkingen, verwijderingen, kaarten, polls of in de wachtrij geplaatste langdurige antwoorden worden uitgevoerd. Met de standaardconfiguratie voor de openbare cloud faalt OpenClaw gesloten als een opgeslagen gesprek naar buiten de openbare Teams Connector-host wijst. Ontvang een nieuw bericht uit het gesprek nadat je cloud/service-URL-instellingen hebt gewijzigd, zodat de opgeslagen gespreksreferentie actueel is.

China/21Vianet heeft geen aparte globale proactieve `smba`-URL in de tabel met proactieve Teams-eindpunten van Microsoft. Configureer `cloud: "China"` zodat de Teams SDK Azure China-authenticatie-, token- en JWT-eindpunten gebruikt. Proactieve verzendingen vereisen dan een opgeslagen gespreksreferentie van een inkomende China Teams-activiteit, of een expliciet geconfigureerde service-URL, op de Azure China Bot Framework-kanaalgrens (`*.botframework.azure.cn`). Door Graph ondersteunde Teams-helpers zijn momenteel uitgeschakeld voor `cloud: "China"` totdat OpenClaw Graph-aanvragen via het Azure China Graph-eindpunt routeert.

### Opmaak

Teams-markdown is beperkter dan Slack of Discord:

- Basisopmaak werkt: **vet**, _cursief_, `code`, links
- Complexe markdown (tabellen, geneste lijsten) wordt mogelijk niet correct weergegeven
- Adaptive Cards worden ondersteund voor polls en semantische presentatieverzendingen (zie hieronder)

## Configuratie

Belangrijke instellingen (zie `/gateway/configuration` voor gedeelde kanaalpatronen):

- `channels.msteams.enabled`: schakel het kanaal in/uit.
- `channels.msteams.appId`, `channels.msteams.appPassword`, `channels.msteams.tenantId`: botreferenties.
- `channels.msteams.cloud`: Teams SDK-cloudomgeving (`Public`, `USGov`, `USGovDoD` of `China`; standaard `Public`). Stel dit in met `serviceUrl` voor USGov/DoD-SDK-clouds; China gebruikt de SDK-preset en opgeslagen Azure China Bot Framework-gespreksreferenties, met door Graph ondersteunde helpers uitgeschakeld totdat Azure China Graph-routering is geïmplementeerd.
- `channels.msteams.serviceUrl`: Bot Connector-service-URL-grens voor proactieve SDK-bewerkingen. De openbare cloud gebruikt de SDK-standaard; stel dit in voor GCC (`https://smba.infra.gcc.teams.microsoft.com/teams`), GCC High of DoD. China accepteert Azure China Bot Framework-kanaalhosts wanneer de opgeslagen gespreksreferentie afkomstig is van Teams beheerd door 21Vianet.
- `channels.msteams.webhook.port` (standaard `3978`)
- `channels.msteams.webhook.path` (standaard `/api/messages`)
- `channels.msteams.dmPolicy`: `pairing | allowlist | open | disabled` (standaard: pairing)
- `channels.msteams.allowFrom`: DM-allowlist (AAD-object-ID's aanbevolen). De wizard zet namen tijdens de installatie om naar ID's wanneer Graph-toegang beschikbaar is.
- `channels.msteams.dangerouslyAllowNameMatching`: noodschakelaar om wijzigbare UPN/weergavenaam-matching en directe team-/kanaalnaamroutering opnieuw in te schakelen.
- `channels.msteams.textChunkLimit`: chunkgrootte voor uitgaande tekst.
- `channels.msteams.chunkMode`: `length` (standaard) of `newline` om vóór chunking op lengte op lege regels (alinea-grenzen) te splitsen.
- `channels.msteams.mediaAllowHosts`: allowlist voor hosts van inkomende bijlagen (standaard Microsoft/Teams-domeinen).
- `channels.msteams.mediaAuthAllowHosts`: allowlist voor het toevoegen van Authorization-headers bij media-retries (standaard Graph + Bot Framework-hosts).
- `channels.msteams.requireMention`: vereis @mention in kanalen/groepen (standaard true).
- `channels.msteams.replyStyle`: `thread | top-level` (zie [Antwoordstijl](#reply-style-threads-vs-posts)).
- `channels.msteams.teams.<teamId>.replyStyle`: override per team.
- `channels.msteams.teams.<teamId>.requireMention`: override per team.
- `channels.msteams.teams.<teamId>.tools`: standaardoverschrijvingen voor toolbeleid per team (`allow`/`deny`/`alsoAllow`) die worden gebruikt wanneer een kanaaloverride ontbreekt.
- `channels.msteams.teams.<teamId>.toolsBySender`: standaardoverschrijvingen voor toolbeleid per team per afzender (`"*"`-wildcard ondersteund).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`: override per kanaal.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.requireMention`: override per kanaal.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.tools`: overschrijvingen voor toolbeleid per kanaal (`allow`/`deny`/`alsoAllow`).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.toolsBySender`: overschrijvingen voor toolbeleid per kanaal per afzender (`"*"`-wildcard ondersteund).
- `toolsBySender`-sleutels moeten expliciete voorvoegsels gebruiken:
  `channel:`, `id:`, `e164:`, `username:`, `name:` (verouderde sleutels zonder voorvoegsel worden nog steeds alleen aan `id:` gekoppeld).
- `channels.msteams.actions.memberInfo`: schakel de door Graph ondersteunde actie voor ledeninformatie in of uit (standaard: ingeschakeld wanneer Graph-referenties beschikbaar zijn).
- `channels.msteams.authType`: authenticatietype - `"secret"` (standaard) of `"federated"`.
- `channels.msteams.certificatePath`: pad naar PEM-certificaatbestand (federated + certificaatauthenticatie).
- `channels.msteams.certificateThumbprint`: certificaatvingerafdruk (optioneel, niet vereist voor auth).
- `channels.msteams.useManagedIdentity`: schakel managed identity-authenticatie in (federated-modus).
- `channels.msteams.managedIdentityClientId`: client-ID voor door de gebruiker toegewezen managed identity.
- `channels.msteams.sharePointSiteId`: SharePoint-site-ID voor bestandsuploads in groepschats/kanalen (zie [Bestanden verzenden in groepschats](#sending-files-in-group-chats)).

## Routering en sessies

- Sessiesleutels volgen de standaard agent-indeling (zie [/concepts/session](/nl/concepts/session)):
  - Directe berichten delen de hoofdsessie (`agent:<agentId>:<mainKey>`).
  - Kanaal-/groepsberichten gebruiken conversation id:
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## Antwoordstijl: threads versus posts

Teams heeft onlangs twee kanaal-UI-stijlen geïntroduceerd boven hetzelfde onderliggende datamodel:

| Stijl                    | Beschrijving                                               | Aanbevolen `replyStyle` |
| ------------------------ | ---------------------------------------------------------- | ----------------------- |
| **Posts** (klassiek)     | Berichten verschijnen als kaarten met daaronder threaded antwoorden | `thread` (standaard)    |
| **Threads** (Slack-achtig) | Berichten lopen lineair door, meer zoals Slack             | `top-level`             |

**Het probleem:** De Teams-API geeft niet vrij welke UI-stijl een kanaal gebruikt. Als je de verkeerde `replyStyle` gebruikt:

- `thread` in een kanaal met Threads-stijl → antwoorden verschijnen onhandig genest
- `top-level` in een kanaal met Posts-stijl → antwoorden verschijnen als afzonderlijke posts op het hoogste niveau in plaats van in-thread

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

### Resolutievolgorde

Wanneer de bot een antwoord naar een kanaal stuurt, wordt `replyStyle` opgelost van de meest specifieke override naar de standaard. De eerste niet-`undefined` waarde wint:

1. **Per kanaal** — `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`
2. **Per team** — `channels.msteams.teams.<teamId>.replyStyle`
3. **Globaal** — `channels.msteams.replyStyle`
4. **Impliciete standaard** — afgeleid van `requireMention`:
   - `requireMention: true` → `thread`
   - `requireMention: false` → `top-level`

Als je `requireMention: false` globaal instelt zonder expliciete `replyStyle`, verschijnen vermeldingen in kanalen met Posts-stijl als posts op het hoogste niveau, zelfs wanneer het inkomende bericht een threadantwoord was. Zet `replyStyle: "thread"` vast op globaal, team- of kanaalniveau om verrassingen te voorkomen.

### Behoud van threadcontext

Wanneer `replyStyle: "thread"` van kracht is en de bot vanuit een kanaalthread met @mention is genoemd, koppelt OpenClaw de oorspronkelijke thread-root opnieuw aan de uitgaande gespreksreferentie (`19:…@thread.tacv2;messageid=<root>`), zodat het antwoord in dezelfde thread terechtkomt. Dit geldt zowel voor live verzendingen (in-turn) als voor proactieve verzendingen nadat de Bot Framework-turncontext is verlopen (bijvoorbeeld langdurige agents, in de wachtrij geplaatste antwoorden op tool-calls via `mcp__openclaw__message`).

De thread-root wordt gehaald uit de opgeslagen `threadId` op de gespreksreferentie. Oudere opgeslagen referenties van vóór `threadId` vallen terug op `activityId` (welke inkomende activiteit het gesprek als laatste heeft geïnitialiseerd), zodat bestaande implementaties blijven werken zonder opnieuw te initialiseren.

Wanneer `replyStyle: "top-level"` actief is, worden inkomende berichten in channel-threads bewust beantwoord als nieuwe posts op het hoogste niveau — er wordt geen thread-achtervoegsel toegevoegd. Dit is het juiste gedrag voor channels in Threads-stijl; als je posts op het hoogste niveau ziet terwijl je thread-antwoorden verwachtte, is je `replyStyle` verkeerd ingesteld voor die channel.

## Bijlagen en afbeeldingen

**Huidige beperkingen:**

- **Privéberichten:** Afbeeldingen en bestandsbijlagen werken via Teams bot-bestands-API's.
- **Channels/groepen:** Bijlagen staan in M365-opslag (SharePoint/OneDrive). De webhook-payload bevat alleen een HTML-stub, niet de daadwerkelijke bestandsbytes. **Graph API-machtigingen zijn vereist** om channel-bijlagen te downloaden.
- Gebruik voor expliciete bestands-eerst verzendingen `action=upload-file` met `media` / `filePath` / `path`; optioneel `message` wordt de begeleidende tekst/opmerking, en `filename` overschrijft de geüploade naam.

Zonder Graph-machtigingen worden channel-berichten met afbeeldingen ontvangen als alleen tekst (de afbeeldingsinhoud is niet toegankelijk voor de bot).
Standaard downloadt OpenClaw alleen media van Microsoft/Teams-hostnamen. Overschrijf dit met `channels.msteams.mediaAllowHosts` (gebruik `["*"]` om elke host toe te staan).
Autorisatieheaders worden alleen toegevoegd voor hosts in `channels.msteams.mediaAuthAllowHosts` (standaard Graph + Bot Framework-hosts). Houd deze lijst strikt (vermijd multi-tenant achtervoegsels).

## Bestanden verzenden in groepschats

Bots kunnen bestanden in privéberichten verzenden met de FileConsentCard-flow (ingebouwd). **Bestanden verzenden in groepschats/channels** vereist echter extra configuratie:

| Context                  | Hoe bestanden worden verzonden              | Benodigde configuratie                            |
| ------------------------ | ------------------------------------------- | ------------------------------------------------- |
| **Privéberichten**       | FileConsentCard → gebruiker accepteert → bot uploadt | Werkt direct                                      |
| **Groepschats/channels** | Uploaden naar SharePoint → link delen       | Vereist `sharePointSiteId` + Graph-machtigingen   |
| **Afbeeldingen (elke context)** | Base64-gecodeerd inline              | Werkt direct                                      |

### Waarom groepschats SharePoint nodig hebben

Bots hebben geen persoonlijke OneDrive-schijf (het `/me/drive` Graph API-eindpunt werkt niet voor applicatie-identiteiten). Om bestanden in groepschats/channels te verzenden, uploadt de bot naar een **SharePoint-site** en maakt hij een deellink.

### Configuratie

1. **Voeg Graph API-machtigingen toe** in Entra ID (Azure AD) → App Registration:
   - `Sites.ReadWrite.All` (Application) - upload files to SharePoint
   - `Chat.Read.All` (Application) - optional, enables per-user sharing links

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

### Fallback-gedrag

| Scenario                                          | Resultaat                                          |
| ------------------------------------------------- | -------------------------------------------------- |
| Groepschat + bestand + `sharePointSiteId` geconfigureerd | Uploaden naar SharePoint, deellink verzenden       |
| Groepschat + bestand + geen `sharePointSiteId`    | OneDrive-upload proberen (kan mislukken), alleen tekst verzenden |
| Persoonlijke chat + bestand                       | FileConsentCard-flow (werkt zonder SharePoint)     |
| Elke context + afbeelding                         | Base64-gecodeerd inline (werkt zonder SharePoint)  |

### Locatie waar bestanden worden opgeslagen

Geüploade bestanden worden opgeslagen in een map `/OpenClawShared/` in de standaarddocumentbibliotheek van de geconfigureerde SharePoint-site.

## Peilingen (Adaptive Cards)

OpenClaw verzendt Teams-peilingen als Adaptive Cards (er is geen native Teams-peiling-API).

- CLI: `openclaw message poll --channel msteams --target conversation:<id> ...`
- Stemmen worden door de Gateway vastgelegd in de OpenClaw SQLite voor Plugin-status onder `state/openclaw.sqlite`.
- Bestaande `msteams-polls.json`-bestanden worden geïmporteerd door `openclaw doctor --fix`, niet door de draaiende Plugin.
- De Gateway moet online blijven om stemmen vast te leggen.
- Peilingen plaatsen nog niet automatisch samenvattingen van resultaten, en er is nog geen ondersteunde CLI voor peilingresultaten.

## Presentatiekaarten

Verzend semantische presentatie-payloads naar Teams-gebruikers of gesprekken met de `message`-tool, CLI of normale antwoordbezorging. OpenClaw rendert ze als Teams Adaptive Cards vanuit het generieke presentatiecontract.

De parameter `presentation` accepteert semantische blokken. Wanneer `presentation` is opgegeven, is de berichttekst optioneel. Knoppen worden gerenderd als Adaptive Card-submit- of URL-acties. Selectiemenu's zijn nog niet native in de Teams-renderer, dus OpenClaw zet ze vóór bezorging om naar leesbare tekst.

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

Zie [Doelformaten](#target-formats) hieronder voor details over doelformaten.

## Doelformaten

MSTeams-doelen gebruiken voorvoegsels om onderscheid te maken tussen gebruikers en gesprekken:

| Doeltype            | Formaat                          | Voorbeeld                                           |
| ------------------- | -------------------------------- | --------------------------------------------------- |
| Gebruiker (op ID)   | `user:<aad-object-id>`           | `user:40a1a0ed-4ff2-4164-a219-55518990c197`         |
| Gebruiker (op naam) | `user:<display-name>`            | `user:John Smith` (vereist Graph API)               |
| Groep/channel       | `conversation:<conversation-id>` | `conversation:19:abc123...@thread.tacv2`            |
| Groep/channel (raw) | `<conversation-id>`              | `19:abc123...@thread.tacv2` (als dit `@thread` bevat) |

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

**Voorbeelden voor Agent-tool:**

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
Zonder het voorvoegsel `user:` worden namen standaard opgelost als groep of team. Gebruik altijd `user:` wanneer je personen op weergavenaam target.
</Note>

## Proactieve berichten

- Proactieve berichten zijn alleen mogelijk **nadat** een gebruiker interactie heeft gehad, omdat we op dat moment gespreksreferenties opslaan.
- Zie `/gateway/configuration` voor `dmPolicy` en allowlist-poorten.

## Team- en channel-ID's (veelvoorkomende valkuil)

De queryparameter `groupId` in Teams-URL's is **NIET** de team-ID die voor configuratie wordt gebruikt. Haal ID's in plaats daarvan uit het URL-pad:

**Team-URL:**

```
https://teams.microsoft.com/l/team/19%3ABk4j...%40thread.tacv2/conversations?groupId=...
                                    └────────────────────────────┘
                                    Team conversation ID (URL-decode this)
```

**Channel-URL:**

```
https://teams.microsoft.com/l/channel/19%3A15bc...%40thread.tacv2/ChannelName?groupId=...
                                      └─────────────────────────┘
                                      Channel ID (URL-decode this)
```

**Voor configuratie:**

- Teamsleutel = padsegment na `/team/` (URL-gedecodeerd, bijv. `19:Bk4j...@thread.tacv2`; oudere tenants kunnen `@thread.skype` tonen, wat ook geldig is)
- Channelsleutel = padsegment na `/channel/` (URL-gedecodeerd)
- **Negeer** de queryparameter `groupId` voor OpenClaw-routering. Dit is de Microsoft Entra-groep-ID, niet de Bot Framework-gespreks-ID die in inkomende Teams-activiteiten wordt gebruikt.

## Privéchannels

Bots hebben beperkte ondersteuning in privéchannels:

| Functie                      | Standaardchannels | Privéchannels             |
| ---------------------------- | ----------------- | ------------------------- |
| Botinstallatie               | Ja                | Beperkt                   |
| Realtimeberichten (webhook)  | Ja                | Werkt mogelijk niet       |
| RSC-machtigingen             | Ja                | Kan zich anders gedragen  |
| @mentions                    | Ja                | Als de bot toegankelijk is |
| Graph API-geschiedenis       | Ja                | Ja (met machtigingen)     |

**Workarounds als privéchannels niet werken:**

1. Gebruik standaardchannels voor botinteracties
2. Gebruik privéberichten - gebruikers kunnen de bot altijd rechtstreeks berichten
3. Gebruik Graph API voor historische toegang (vereist `ChannelMessage.Read.All`)

## Probleemoplossing

### Veelvoorkomende problemen

- **Afbeeldingen worden niet weergegeven in channels:** Graph-machtigingen of beheerderstoestemming ontbreken. Installeer de Teams-app opnieuw en sluit Teams volledig af en open het opnieuw.
- **Geen reacties in channel:** vermeldingen zijn standaard vereist; stel `channels.msteams.requireMention=false` in of configureer dit per team/channel.
- **Versiemismatch (Teams toont nog steeds oud manifest):** verwijder de app, voeg deze opnieuw toe en sluit Teams volledig af om te vernieuwen.
- **401 Unauthorized van webhook:** Verwacht bij handmatig testen zonder Azure JWT - betekent dat het eindpunt bereikbaar is, maar autorisatie is mislukt. Gebruik Azure Web Chat om correct te testen.

### Fouten bij manifest-upload

- **"Icon file cannot be empty":** Het manifest verwijst naar pictogrambestanden die 0 bytes zijn. Maak geldige PNG-pictogrammen (32x32 voor `outline.png`, 192x192 voor `color.png`).
- **"webApplicationInfo.Id already in use":** De app is nog geïnstalleerd in een ander team/chat. Zoek deze en verwijder deze eerst, of wacht 5-10 minuten op propagatie.
- **"Something went wrong" bij uploaden:** Upload in plaats daarvan via [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com), open browser-DevTools (F12) → tabblad Network, en controleer de response body op de daadwerkelijke fout.
- **Sideload mislukt:** Probeer "Upload an app to your org's app catalog" in plaats van "Upload a custom app" - dit omzeilt vaak sideload-beperkingen.

### RSC-machtigingen werken niet

1. Controleer of `webApplicationInfo.id` exact overeenkomt met de App ID van je bot
2. Upload de app opnieuw en installeer deze opnieuw in het team/de chat
3. Controleer of je organisatiebeheerder RSC-machtigingen heeft geblokkeerd
4. Bevestig dat je het juiste bereik gebruikt: `ChannelMessage.Read.Group` voor Teams, `ChatMessage.Read.Chat` voor groepschats

## Verwijzingen

- [Azure Bot maken](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) - installatiehandleiding voor Azure Bot
- [Teams-ontwikkelaarsportal](https://dev.teams.microsoft.com/apps) - Teams-apps maken/beheren
- [Teams-appmanifestschema](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [Kanaalberichten ontvangen met RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [RSC-machtigingenreferentie](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [Bestandsafhandeling voor Teams-bots](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4) (kanaal/groep vereist Graph)
- [Proactieve berichten](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)
- [@microsoft/teams.cli](https://www.npmjs.com/package/@microsoft/teams.cli) - Teams CLI voor botbeheer

## Gerelateerd

- [Overzicht van kanalen](/nl/channels) - alle ondersteunde kanalen
- [Koppelen](/nl/channels/pairing) - DM-authenticatie en koppelingsflow
- [Groepen](/nl/channels/groups) - gedrag van groepschats en vermeldingstoegang
- [Kanaalroutering](/nl/channels/channel-routing) - sessieroutering voor berichten
- [Beveiliging](/nl/gateway/security) - toegangsmodel en hardening
