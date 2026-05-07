---
read_when:
    - Travail sur les fonctionnalités du canal Microsoft Teams
summary: État de la prise en charge, fonctionnalités et configuration du bot Microsoft Teams
title: Microsoft Teams
x-i18n:
    generated_at: "2026-05-07T13:13:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2fa2aff4d957a59f694cf37d9a4e5ad6b7ee18004d84cbaf8d7ac1aa16860090
    source_path: channels/msteams.md
    workflow: 16
---

Statut : les pièces jointes textuelles et en DM sont prises en charge ; l’envoi de fichiers dans les canaux/groupes nécessite `sharePointSiteId` + des autorisations Graph (voir [Envoi de fichiers dans les discussions de groupe](#sending-files-in-group-chats)). Les sondages sont envoyés via Adaptive Cards. Les actions de message exposent explicitement `upload-file` pour les envois centrés sur les fichiers.

## Plugin groupé

Microsoft Teams est fourni comme Plugin groupé dans les versions actuelles d’OpenClaw, donc aucune
installation séparée n’est requise dans la version empaquetée normale.

Si vous utilisez une ancienne version ou une installation personnalisée qui exclut Teams groupé,
installez directement le package npm :

```bash
openclaw plugins install @openclaw/msteams
```

Utilisez le package nu pour suivre le tag de version officiel actuel. Épinglez une
version exacte uniquement lorsque vous avez besoin d’une installation reproductible.

Checkout local (lors de l’exécution depuis un dépôt git) :

```bash
openclaw plugins install ./path/to/local/msteams-plugin
```

Détails : [Plugins](/fr/tools/plugin)

## Configuration rapide

Le [`@microsoft/teams.cli`](https://www.npmjs.com/package/@microsoft/teams.cli) gère l’enregistrement du bot, la création du manifeste et la génération des identifiants dans une seule commande.

**1. Installez-vous et connectez-vous**

```bash
npm install -g @microsoft/teams.cli@preview
teams login
teams status   # verify you're logged in and see your tenant info
```

<Note>
La Teams CLI est actuellement en préversion. Les commandes et les options peuvent changer entre les versions.
</Note>

**2. Démarrez un tunnel** (Teams ne peut pas atteindre localhost)

Installez et authentifiez la CLI devtunnel si vous ne l’avez pas déjà fait ([guide de démarrage](https://learn.microsoft.com/en-us/azure/developer/dev-tunnels/get-started)).

```bash
# One-time setup (persistent URL across sessions):
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# Each dev session:
devtunnel host my-openclaw-bot
# Your endpoint: https://<tunnel-id>.devtunnels.ms/api/messages
```

<Note>
`--allow-anonymous` est requis, car Teams ne peut pas s’authentifier avec devtunnels. Chaque requête de bot entrante est toutefois validée automatiquement par le Teams SDK.
</Note>

Alternatives : `ngrok http 3978` ou `tailscale funnel 3978` (mais ces options peuvent changer d’URL à chaque session).

**3. Créez l’application**

```bash
teams app create \
  --name "OpenClaw" \
  --endpoint "https://<your-tunnel-url>/api/messages"
```

Cette commande unique :

- Crée une application Entra ID (Azure AD)
- Génère un secret client
- Construit et téléverse un manifeste d’application Teams (avec icônes)
- Enregistre le bot (géré par Teams par défaut - aucun abonnement Azure nécessaire)

La sortie affichera `CLIENT_ID`, `CLIENT_SECRET`, `TENANT_ID` et un **ID d’application Teams** - notez-les pour les étapes suivantes. Elle propose aussi d’installer directement l’application dans Teams.

**4. Configurez OpenClaw** avec les identifiants fournis dans la sortie :

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

Ou utilisez directement les variables d’environnement : `MSTEAMS_APP_ID`, `MSTEAMS_APP_PASSWORD`, `MSTEAMS_TENANT_ID`.

**5. Installez l’application dans Teams**

`teams app create` vous invitera à installer l’application - sélectionnez "Install in Teams". Si vous avez ignoré cette étape, vous pourrez obtenir le lien plus tard :

```bash
teams app get <teamsAppId> --install-link
```

**6. Vérifiez que tout fonctionne**

```bash
teams app doctor <teamsAppId>
```

Cette commande exécute des diagnostics sur l’enregistrement du bot, la configuration de l’application AAD, la validité du manifeste et la configuration SSO.

Pour les déploiements de production, envisagez d’utiliser [l’authentification fédérée](/fr/channels/msteams#federated-authentication-certificate-plus-managed-identity) (certificat ou identité managée) au lieu des secrets client.

<Note>
Les discussions de groupe sont bloquées par défaut (`channels.msteams.groupPolicy: "allowlist"`). Pour autoriser les réponses de groupe, définissez `channels.msteams.groupAllowFrom`, ou utilisez `groupPolicy: "open"` pour autoriser n’importe quel membre (avec mention requise).
</Note>

## Objectifs

- Parler à OpenClaw via des DM Teams, des discussions de groupe ou des canaux.
- Garder un routage déterministe : les réponses retournent toujours au canal d’où elles proviennent.
- Utiliser par défaut un comportement de canal sûr (mentions requises sauf configuration contraire).

## Écritures de configuration

Par défaut, Microsoft Teams est autorisé à écrire les mises à jour de configuration déclenchées par `/config set|unset` (nécessite `commands.config: true`).

Désactivez avec :

```json5
{
  channels: { msteams: { configWrites: false } },
}
```

## Contrôle d’accès (DM + groupes)

**Accès DM**

- Par défaut : `channels.msteams.dmPolicy = "pairing"`. Les expéditeurs inconnus sont ignorés jusqu’à approbation.
- `channels.msteams.allowFrom` doit utiliser des ID d’objet AAD stables.
- Ne vous fiez pas à la correspondance UPN/nom d’affichage pour les listes d’autorisation - ils peuvent changer. OpenClaw désactive par défaut la correspondance directe par nom ; activez-la explicitement avec `channels.msteams.dangerouslyAllowNameMatching: true`.
- L’assistant peut résoudre les noms en ID via Microsoft Graph lorsque les identifiants le permettent.

**Accès de groupe**

- Par défaut : `channels.msteams.groupPolicy = "allowlist"` (bloqué sauf si vous ajoutez `groupAllowFrom`). Utilisez `channels.defaults.groupPolicy` pour remplacer la valeur par défaut lorsqu’elle n’est pas définie.
- `channels.msteams.groupAllowFrom` contrôle quels expéditeurs peuvent déclencher des actions dans les discussions de groupe/canaux (retombe sur `channels.msteams.allowFrom`).
- Définissez `groupPolicy: "open"` pour autoriser n’importe quel membre (toujours avec mention requise par défaut).
- Pour n’autoriser **aucun canal**, définissez `channels.msteams.groupPolicy: "disabled"`.

Exemple :

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

**Liste d’autorisation Teams + canal**

- Limitez les réponses de groupe/canal en listant les équipes et les canaux sous `channels.msteams.teams`.
- Les clés doivent utiliser des ID de conversation Teams stables provenant de liens Teams, pas des noms d’affichage modifiables.
- Lorsque `groupPolicy="allowlist"` et qu’une liste d’autorisation d’équipes est présente, seules les équipes/canaux listés sont acceptés (avec mention requise).
- L’assistant de configuration accepte les entrées `Team/Channel` et les stocke pour vous.
- Au démarrage, OpenClaw résout les noms de liste d’autorisation d’équipe/canal et d’utilisateur en ID (lorsque les autorisations Graph le permettent)
  et journalise la correspondance ; les noms d’équipe/canal non résolus sont conservés tels que saisis, mais ignorés par défaut pour le routage sauf si `channels.msteams.dangerouslyAllowNameMatching: true` est activé.

Exemple :

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
<summary><strong>Configuration manuelle (sans la Teams CLI)</strong></summary>

Si vous ne pouvez pas utiliser la Teams CLI, vous pouvez configurer le bot manuellement via le portail Azure.

### Fonctionnement

1. Assurez-vous que le Plugin Microsoft Teams est disponible (groupé dans les versions actuelles).
2. Créez un **Azure Bot** (ID d’application + secret + ID de locataire).
3. Construisez un **package d’application Teams** qui référence le bot et inclut les autorisations RSC ci-dessous.
4. Téléversez/installez l’application Teams dans une équipe (ou en portée personnelle pour les DM).
5. Configurez `msteams` dans `~/.openclaw/openclaw.json` (ou avec des variables d’environnement) et démarrez le Gateway.
6. Le Gateway écoute par défaut le trafic Webhook Bot Framework sur `/api/messages`.

### Étape 1 : Créer Azure Bot

1. Accédez à [Créer Azure Bot](https://portal.azure.com/#create/Microsoft.AzureBot)
2. Remplissez l’onglet **Bases** :

   | Champ              | Valeur                                                   |
   | ------------------ | -------------------------------------------------------- |
   | **Bot handle**     | Nom de votre bot, par ex. `openclaw-msteams` (doit être unique) |
   | **Subscription**   | Sélectionnez votre abonnement Azure                      |
   | **Resource group** | Créez-en un nouveau ou utilisez un existant              |
   | **Pricing tier**   | **Free** pour le développement/test                      |
   | **Type of App**    | **Single Tenant** (recommandé - voir la note ci-dessous) |
   | **Creation type**  | **Create new Microsoft App ID**                          |

<Warning>
La création de nouveaux bots multi-locataires a été dépréciée après le 2025-07-31. Utilisez **Single Tenant** pour les nouveaux bots.
</Warning>

3. Cliquez sur **Review + create** → **Create** (attendez ~1 à 2 minutes)

### Étape 2 : Obtenir les identifiants

1. Accédez à votre ressource Azure Bot → **Configuration**
2. Copiez **Microsoft App ID** → c’est votre `appId`
3. Cliquez sur **Manage Password** → accédez à l’inscription d’application
4. Sous **Certificates & secrets** → **New client secret** → copiez la **Value** → c’est votre `appPassword`
5. Accédez à **Overview** → copiez **Directory (tenant) ID** → c’est votre `tenantId`

### Étape 3 : Configurer le point de terminaison de messagerie

1. Dans Azure Bot → **Configuration**
2. Définissez **Messaging endpoint** sur votre URL de Webhook :
   - Production : `https://your-domain.com/api/messages`
   - Développement local : utilisez un tunnel (voir [Développement local](#local-development-tunneling) ci-dessous)

### Étape 4 : Activer le canal Teams

1. Dans Azure Bot → **Channels**
2. Cliquez sur **Microsoft Teams** → Configure → Save
3. Acceptez les conditions d’utilisation

### Étape 5 : Construire le manifeste d’application Teams

- Incluez une entrée `bot` avec `botId = <App ID>`.
- Portées : `personal`, `team`, `groupChat`.
- `supportsFiles: true` (requis pour la gestion des fichiers en portée personnelle).
- Ajoutez les autorisations RSC (voir [Autorisations RSC](#current-teams-rsc-permissions-manifest)).
- Créez des icônes : `outline.png` (32x32) et `color.png` (192x192).
- Zippez les trois fichiers ensemble : `manifest.json`, `outline.png`, `color.png`.

### Étape 6 : Configurer OpenClaw

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

Variables d’environnement : `MSTEAMS_APP_ID`, `MSTEAMS_APP_PASSWORD`, `MSTEAMS_TENANT_ID`.

### Étape 7 : Exécuter le Gateway

Le canal Teams démarre automatiquement lorsque le Plugin est disponible et que la configuration `msteams` existe avec les identifiants.

</details>

## Authentification fédérée (certificat plus identité managée)

> Ajouté dans 2026.4.11

Pour les déploiements de production, OpenClaw prend en charge **l’authentification fédérée** comme alternative plus sûre aux secrets client. Deux méthodes sont disponibles :

### Option A : Authentification basée sur certificat

Utilisez un certificat PEM enregistré avec votre inscription d’application Entra ID.

**Configuration :**

1. Générez ou obtenez un certificat (format PEM avec clé privée).
2. Dans Entra ID → App Registration → **Certificates & secrets** → **Certificates** → Téléversez le certificat public.

**Configuration :**

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

**Variables d’environnement :**

- `MSTEAMS_AUTH_TYPE=federated`
- `MSTEAMS_CERTIFICATE_PATH=/path/to/cert.pem`

### Option B : Azure Managed Identity

Utilisez Azure Managed Identity pour une authentification sans mot de passe. C’est idéal pour les déploiements sur l’infrastructure Azure (AKS, App Service, machines virtuelles Azure) où une identité managée est disponible.

**Fonctionnement :**

1. Le pod/la VM du bot dispose d’une identité managée (affectée par le système ou affectée par l’utilisateur).
2. Un **identifiant d’identité fédérée** lie l’identité managée à l’inscription d’application Entra ID.
3. À l’exécution, OpenClaw utilise `@azure/identity` pour acquérir des jetons depuis le point de terminaison Azure IMDS (`169.254.169.254`).
4. Le jeton est transmis au Teams SDK pour l’authentification du bot.

**Prérequis :**

- Infrastructure Azure avec identité managée activée (identité de charge de travail AKS, App Service, VM)
- Identifiant d’identité fédérée créé sur l’inscription d’application Entra ID
- Accès réseau à IMDS (`169.254.169.254:80`) depuis le pod/la VM

**Configuration (identité managée affectée par le système) :**

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

**Config (identité managée affectée par l’utilisateur) :**

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

**Variables d’environnement :**

- `MSTEAMS_AUTH_TYPE=federated`
- `MSTEAMS_USE_MANAGED_IDENTITY=true`
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID=<client-id>` (uniquement pour une identité affectée par l’utilisateur)

### Configuration de Workload Identity AKS

Pour les déploiements AKS utilisant l’identité de charge de travail :

1. **Activez l’identité de charge de travail** sur votre cluster AKS.
2. **Créez une information d’identification d’identité fédérée** sur l’inscription de l’application Entra ID :

   ```bash
   az ad app federated-credential create --id <APP_OBJECT_ID> --parameters '{
     "name": "my-bot-workload-identity",
     "issuer": "<AKS_OIDC_ISSUER_URL>",
     "subject": "system:serviceaccount:<NAMESPACE>:<SERVICE_ACCOUNT>",
     "audiences": ["api://AzureADTokenExchange"]
   }'
   ```

3. **Annotez le compte de service Kubernetes** avec l’ID client de l’application :

   ```yaml
   apiVersion: v1
   kind: ServiceAccount
   metadata:
     name: my-bot-sa
     annotations:
       azure.workload.identity/client-id: "<APP_CLIENT_ID>"
   ```

4. **Étiquetez le pod** pour l’injection de l’identité de charge de travail :

   ```yaml
   metadata:
     labels:
       azure.workload.identity/use: "true"
   ```

5. **Assurez l’accès réseau** à IMDS (`169.254.169.254`) - si vous utilisez NetworkPolicy, ajoutez une règle de sortie autorisant le trafic vers `169.254.169.254/32` sur le port 80.

### Comparaison des types d’authentification

| Méthode                | Config                                         | Avantages                          | Inconvénients                                  |
| ---------------------- | ---------------------------------------------- | ---------------------------------- | ---------------------------------------------- |
| **Secret client**      | `appPassword`                                  | Configuration simple               | Rotation du secret requise, moins sécurisé     |
| **Certificat**         | `authType: "federated"` + `certificatePath`    | Aucun secret partagé sur le réseau | Surcharge de gestion des certificats           |
| **Managed Identity**   | `authType: "federated"` + `useManagedIdentity` | Sans mot de passe, aucun secret à gérer | Infrastructure Azure requise              |

**Comportement par défaut :** Quand `authType` n’est pas défini, OpenClaw utilise par défaut l’authentification par secret client. Les configurations existantes continuent de fonctionner sans modification.

## Développement local (tunnelisation)

Teams ne peut pas atteindre `localhost`. Utilisez un tunnel de développement persistant afin que votre URL reste identique d’une session à l’autre :

```bash
# One-time setup:
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# Each dev session:
devtunnel host my-openclaw-bot
```

Alternatives : `ngrok http 3978` ou `tailscale funnel 3978` (les URL peuvent changer à chaque session).

Si l’URL de votre tunnel change, mettez à jour le point de terminaison :

```bash
teams app update <teamsAppId> --endpoint "https://<new-url>/api/messages"
```

## Tester le bot

**Exécuter les diagnostics :**

```bash
teams app doctor <teamsAppId>
```

Vérifie en une seule passe l’inscription du bot, l’application AAD, le manifeste et la configuration SSO.

**Envoyer un message de test :**

1. Installez l’application Teams (utilisez le lien d’installation depuis `teams app get <id> --install-link`)
2. Trouvez le bot dans Teams et envoyez-lui un message privé
3. Consultez les journaux du Gateway pour l’activité entrante

## Variables d’environnement

Toutes les clés de configuration peuvent également être définies au moyen de variables d’environnement :

- `MSTEAMS_APP_ID`
- `MSTEAMS_APP_PASSWORD`
- `MSTEAMS_TENANT_ID`
- `MSTEAMS_AUTH_TYPE` (facultatif : `"secret"` ou `"federated"`)
- `MSTEAMS_CERTIFICATE_PATH` (fédéré + certificat)
- `MSTEAMS_CERTIFICATE_THUMBPRINT` (facultatif, non requis pour l’authentification)
- `MSTEAMS_USE_MANAGED_IDENTITY` (fédéré + identité managée)
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID` (MI affectée par l’utilisateur uniquement)

## Action d’informations sur les membres

OpenClaw expose une action `member-info` basée sur Graph pour Microsoft Teams afin que les agents et automatisations puissent résoudre les détails des membres d’un canal (nom d’affichage, e-mail, rôle) directement depuis Microsoft Graph.

Prérequis :

- Autorisation RSC `Member.Read.Group` (déjà présente dans le manifeste recommandé)
- Pour les recherches entre équipes : autorisation d’application Graph `User.Read.All` avec consentement administrateur

L’action est contrôlée par `channels.msteams.actions.memberInfo` (par défaut : activée lorsque les informations d’identification Graph sont disponibles).

## Contexte d’historique

- `channels.msteams.historyLimit` contrôle combien de messages récents de canal/groupe sont intégrés dans le prompt.
- Repli sur `messages.groupChat.historyLimit`. Définissez `0` pour désactiver (50 par défaut).
- L’historique de fil récupéré est filtré par les listes d’autorisation d’expéditeurs (`allowFrom` / `groupAllowFrom`), donc l’amorçage du contexte de fil n’inclut que les messages des expéditeurs autorisés.
- Le contexte des pièces jointes citées (`ReplyTo*` dérivé du HTML de réponse Teams) est actuellement transmis tel que reçu.
- En d’autres termes, les listes d’autorisation contrôlent qui peut déclencher l’agent ; seuls certains chemins de contexte supplémentaire sont filtrés aujourd’hui.
- L’historique des messages privés peut être limité avec `channels.msteams.dmHistoryLimit` (tours utilisateur). Remplacements par utilisateur : `channels.msteams.dms["<user_id>"].historyLimit`.

## Autorisations RSC Teams actuelles (manifeste)

Voici les **resourceSpecific permissions existantes** dans notre manifeste d’application Teams. Elles s’appliquent uniquement dans l’équipe/le chat où l’application est installée.

**Pour les canaux (portée équipe) :**

- `ChannelMessage.Read.Group` (Application) - recevoir tous les messages de canal sans @mention
- `ChannelMessage.Send.Group` (Application)
- `Member.Read.Group` (Application)
- `Owner.Read.Group` (Application)
- `ChannelSettings.Read.Group` (Application)
- `TeamMember.Read.Group` (Application)
- `TeamSettings.Read.Group` (Application)

**Pour les discussions de groupe :**

- `ChatMessage.Read.Chat` (Application) - recevoir tous les messages de discussion de groupe sans @mention

Pour ajouter des autorisations RSC via la CLI Teams :

```bash
teams app rsc add <teamsAppId> ChannelMessage.Read.Group --type Application
```

## Exemple de manifeste Teams (expurgé)

Exemple minimal et valide avec les champs requis. Remplacez les ID et les URL.

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

### Réserves sur le manifeste (champs indispensables)

- `bots[].botId` **doit** correspondre à l’ID d’application Azure Bot.
- `webApplicationInfo.id` **doit** correspondre à l’ID d’application Azure Bot.
- `bots[].scopes` doit inclure les surfaces que vous prévoyez d’utiliser (`personal`, `team`, `groupChat`).
- `bots[].supportsFiles: true` est requis pour la gestion des fichiers dans la portée personnelle.
- `authorization.permissions.resourceSpecific` doit inclure la lecture/l’envoi de canal si vous voulez du trafic de canal.

### Mettre à jour une application existante

Pour mettre à jour une application Teams déjà installée (par exemple, pour ajouter des autorisations RSC) :

```bash
# Download, edit, and re-upload the manifest
teams app manifest download <teamsAppId> manifest.json
# Edit manifest.json locally...
teams app manifest upload manifest.json <teamsAppId>
# Version is auto-bumped if content changed
```

Après la mise à jour, réinstallez l’application dans chaque équipe afin que les nouvelles autorisations prennent effet, et **quittez complètement puis relancez Teams** (ne vous contentez pas de fermer la fenêtre) pour vider les métadonnées d’application mises en cache.

<details>
<summary>Mise à jour manuelle du manifeste (sans CLI)</summary>

1. Mettez à jour votre `manifest.json` avec les nouveaux paramètres
2. **Incrémentez le champ `version`** (par exemple, `1.0.0` → `1.1.0`)
3. **Recompressez** le manifeste avec les icônes (`manifest.json`, `outline.png`, `color.png`)
4. Téléversez le nouveau zip :
   - **Centre d’administration Teams :** Applications Teams → Gérer les applications → trouvez votre application → Téléverser une nouvelle version
   - **Chargement indépendant :** Dans Teams → Applications → Gérer vos applications → Téléverser une application personnalisée

</details>

## Capacités : RSC uniquement vs Graph

### Avec **Teams RSC uniquement** (application installée, aucune autorisation Graph API)

Fonctionne :

- Lire le contenu **texte** des messages de canal.
- Envoyer du contenu **texte** dans les messages de canal.
- Recevoir les pièces jointes de fichiers en **message personnel (DM)**.

Ne fonctionne PAS :

- **Contenu d’image ou de fichier** de canal/groupe (la charge utile inclut uniquement un stub HTML).
- Téléchargement des pièces jointes stockées dans SharePoint/OneDrive.
- Lecture de l’historique des messages (au-delà de l’événement Webhook en direct).

### Avec **Teams RSC + autorisations d’application Microsoft Graph**

Ajoute :

- Téléchargement des contenus hébergés (images collées dans les messages).
- Téléchargement des pièces jointes de fichiers stockées dans SharePoint/OneDrive.
- Lecture de l’historique des messages de canal/chat via Graph.

### RSC vs Graph API

| Capacité                | Autorisations RSC      | Graph API                                 |
| ----------------------- | ---------------------- | ----------------------------------------- |
| **Messages en temps réel** | Oui (via Webhook)    | Non (interrogation uniquement)            |
| **Messages historiques** | Non                   | Oui (peut interroger l’historique)        |
| **Complexité de configuration** | Manifeste d’application uniquement | Nécessite un consentement administrateur + un flux de jeton |
| **Fonctionne hors ligne** | Non (doit être en cours d’exécution) | Oui (interrogation à tout moment) |

**Conclusion :** RSC sert à l’écoute en temps réel ; Graph API sert à l’accès historique. Pour rattraper les messages manqués pendant une période hors ligne, vous avez besoin de Graph API avec `ChannelMessage.Read.All` (nécessite le consentement administrateur).

## Médias et historique avec Graph (requis pour les canaux)

Si vous avez besoin d’images/fichiers dans les **canaux** ou souhaitez récupérer l’**historique des messages**, vous devez activer les autorisations Microsoft Graph et accorder le consentement administrateur.

1. Dans l’**Inscription d’application** Entra ID (Azure AD), ajoutez les **autorisations d’application** Microsoft Graph :
   - `ChannelMessage.Read.All` (pièces jointes de canal + historique)
   - `Chat.Read.All` ou `ChatMessage.Read.All` (discussions de groupe)
2. **Accordez le consentement administrateur** pour le locataire.
3. Augmentez la **version du manifeste** de l’application Teams, téléversez-le de nouveau et **réinstallez l’application dans Teams**.
4. **Quittez complètement puis relancez Teams** pour vider les métadonnées d’application mises en cache.

**Autorisation supplémentaire pour les mentions d’utilisateurs :** Les @mentions d’utilisateurs fonctionnent immédiatement pour les utilisateurs présents dans la conversation. Toutefois, si vous voulez rechercher et mentionner dynamiquement des utilisateurs qui ne sont **pas dans la conversation actuelle**, ajoutez l’autorisation `User.Read.All` (Application) et accordez le consentement administrateur.

## Limites connues

### Expirations de délai Webhook

Teams remet les messages via Webhook HTTP. Si le traitement prend trop de temps (par exemple, réponses LLM lentes), vous pouvez observer :

- Expirations de délai du Gateway
- Nouvelles tentatives de Teams pour le message (provoquant des doublons)
- Réponses abandonnées

OpenClaw gère cela en retournant rapidement et en envoyant les réponses de façon proactive, mais des réponses très lentes peuvent encore causer des problèmes.

### Mise en forme

Le Markdown Teams est plus limité que celui de Slack ou Discord :

- La mise en forme de base fonctionne : **gras**, _italique_, `code`, liens
- Le Markdown complexe (tableaux, listes imbriquées) peut ne pas s’afficher correctement
- Les Adaptive Cards sont prises en charge pour les sondages et les envois de présentation sémantique (voir ci-dessous)

## Configuration

Paramètres clés (voir `/gateway/configuration` pour les modèles de canaux partagés) :

- `channels.msteams.enabled` : active/désactive le canal.
- `channels.msteams.appId`, `channels.msteams.appPassword`, `channels.msteams.tenantId` : identifiants du bot.
- `channels.msteams.webhook.port` (par défaut `3978`)
- `channels.msteams.webhook.path` (par défaut `/api/messages`)
- `channels.msteams.dmPolicy` : `pairing | allowlist | open | disabled` (par défaut : pairing)
- `channels.msteams.allowFrom` : liste d’autorisation des messages privés (ID d’objet AAD recommandés). L’assistant de configuration résout les noms en ID pendant la configuration lorsque l’accès à Graph est disponible.
- `channels.msteams.dangerouslyAllowNameMatching` : option de dernier recours pour réactiver la correspondance mutable par UPN/nom d’affichage et le routage direct par nom d’équipe/canal.
- `channels.msteams.textChunkLimit` : taille des segments de texte sortants.
- `channels.msteams.chunkMode` : `length` (par défaut) ou `newline` pour scinder sur les lignes vides (limites de paragraphes) avant le découpage par longueur.
- `channels.msteams.mediaAllowHosts` : liste d’autorisation des hôtes de pièces jointes entrantes (par défaut, les domaines Microsoft/Teams).
- `channels.msteams.mediaAuthAllowHosts` : liste d’autorisation des hôtes pour l’ajout d’en-têtes Authorization lors des nouvelles tentatives média (par défaut, les hôtes Graph + Bot Framework).
- `channels.msteams.requireMention` : exige une @mention dans les canaux/groupes (par défaut true).
- `channels.msteams.replyStyle` : `thread | top-level` (voir [Style de réponse](#reply-style-threads-vs-posts)).
- `channels.msteams.teams.<teamId>.replyStyle` : remplacement par équipe.
- `channels.msteams.teams.<teamId>.requireMention` : remplacement par équipe.
- `channels.msteams.teams.<teamId>.tools` : remplacements par défaut de la politique d’outils par équipe (`allow`/`deny`/`alsoAllow`) utilisés lorsqu’aucun remplacement de canal n’est présent.
- `channels.msteams.teams.<teamId>.toolsBySender` : remplacements par défaut de la politique d’outils par expéditeur et par équipe (caractère générique `"*"` pris en charge).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle` : remplacement par canal.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.requireMention` : remplacement par canal.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.tools` : remplacements de la politique d’outils par canal (`allow`/`deny`/`alsoAllow`).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.toolsBySender` : remplacements de la politique d’outils par expéditeur et par canal (caractère générique `"*"` pris en charge).
- Les clés `toolsBySender` doivent utiliser des préfixes explicites :
  `id:`, `e164:`, `username:`, `name:` (les anciennes clés sans préfixe correspondent encore uniquement à `id:`).
- `channels.msteams.actions.memberInfo` : active ou désactive l’action d’informations sur les membres basée sur Graph (par défaut : activée lorsque les identifiants Graph sont disponibles).
- `channels.msteams.authType` : type d’authentification - `"secret"` (par défaut) ou `"federated"`.
- `channels.msteams.certificatePath` : chemin vers le fichier de certificat PEM (authentification fédérée + certificat).
- `channels.msteams.certificateThumbprint` : empreinte du certificat (facultatif, non requis pour l’authentification).
- `channels.msteams.useManagedIdentity` : active l’authentification par identité managée (mode fédéré).
- `channels.msteams.managedIdentityClientId` : ID client pour l’identité managée attribuée par l’utilisateur.
- `channels.msteams.sharePointSiteId` : ID de site SharePoint pour les téléversements de fichiers dans les discussions de groupe/canaux (voir [Envoi de fichiers dans les discussions de groupe](#sending-files-in-group-chats)).

## Routage et sessions

- Les clés de session suivent le format d’agent standard (voir [/concepts/session](/fr/concepts/session)) :
  - Les messages directs partagent la session principale (`agent:<agentId>:<mainKey>`).
  - Les messages de canal/groupe utilisent l’ID de conversation :
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## Style de réponse : fils de discussion ou publications

Teams a récemment introduit deux styles d’interface de canal sur le même modèle de données sous-jacent :

| Style                    | Description                                               | `replyStyle` recommandé |
| ------------------------ | --------------------------------------------------------- | ------------------------ |
| **Publications** (classique) | Les messages apparaissent comme des cartes avec des réponses en fil en dessous | `thread` (par défaut) |
| **Fils de discussion** (comme Slack) | Les messages s’enchaînent linéairement, davantage comme Slack | `top-level` |

**Le problème :** L’API Teams n’expose pas le style d’interface utilisé par un canal. Si vous utilisez le mauvais `replyStyle` :

- `thread` dans un canal de style Fils de discussion → les réponses apparaissent imbriquées maladroitement
- `top-level` dans un canal de style Publications → les réponses apparaissent comme des publications de premier niveau distinctes au lieu d’être dans le fil

**Solution :** Configurez `replyStyle` par canal selon la configuration du canal :

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

### Priorité de résolution

Lorsque le bot envoie une réponse dans un canal, `replyStyle` est résolu depuis le remplacement le plus spécifique jusqu’à la valeur par défaut. La première valeur non-`undefined` l’emporte :

1. **Par canal** — `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`
2. **Par équipe** — `channels.msteams.teams.<teamId>.replyStyle`
3. **Global** — `channels.msteams.replyStyle`
4. **Valeur par défaut implicite** — dérivée de `requireMention` :
   - `requireMention: true` → `thread`
   - `requireMention: false` → `top-level`

Si vous définissez `requireMention: false` globalement sans `replyStyle` explicite, les mentions dans les canaux de style Publications apparaîtront comme des publications de premier niveau même lorsque le message entrant était une réponse dans un fil. Définissez `replyStyle: "thread"` au niveau global, de l’équipe ou du canal pour éviter les surprises.

### Préservation du contexte du fil

Lorsque `replyStyle: "thread"` est actif et que le bot a été @mentionné depuis l’intérieur d’un fil de canal, OpenClaw rattache la racine du fil d’origine à la référence de conversation sortante (`19:…@thread.tacv2;messageid=<root>`) afin que la réponse arrive dans le même fil. Cela vaut à la fois pour les envois en direct (pendant le tour) et pour les envois proactifs effectués après l’expiration du contexte de tour du Bot Framework (par exemple, agents de longue durée, réponses d’appels d’outils mises en file via `mcp__openclaw__message`).

La racine du fil est prise depuis le `threadId` stocké dans la référence de conversation. Les anciennes références stockées qui précèdent `threadId` se rabattent sur `activityId` (l’activité entrante qui a ensemencé la conversation en dernier), de sorte que les déploiements existants continuent de fonctionner sans réensemencement.

Lorsque `replyStyle: "top-level"` est actif, les messages entrants depuis des fils de canal reçoivent intentionnellement une réponse sous forme de nouvelles publications de premier niveau — aucun suffixe de fil n’est attaché. C’est le comportement correct pour les canaux de style Fils de discussion ; si vous voyez des publications de premier niveau alors que vous attendiez des réponses en fil, votre `replyStyle` est mal configuré pour ce canal.

## Pièces jointes et images

**Limites actuelles :**

- **Messages privés :** Les images et pièces jointes de fichiers fonctionnent via les API de fichiers du bot Teams.
- **Canaux/groupes :** Les pièces jointes résident dans le stockage M365 (SharePoint/OneDrive). La charge utile du Webhook inclut uniquement un fragment HTML, pas les octets réels du fichier. **Des autorisations Graph API sont requises** pour télécharger les pièces jointes de canal.
- Pour les envois explicitement centrés sur un fichier, utilisez `action=upload-file` avec `media` / `filePath` / `path` ; le `message` facultatif devient le texte/commentaire d’accompagnement, et `filename` remplace le nom téléversé.

Sans autorisations Graph, les messages de canal contenant des images seront reçus uniquement comme texte (le contenu de l’image n’est pas accessible au bot).
Par défaut, OpenClaw télécharge uniquement les médias depuis des noms d’hôte Microsoft/Teams. Remplacez ce comportement avec `channels.msteams.mediaAllowHosts` (utilisez `["*"]` pour autoriser n’importe quel hôte).
Les en-têtes Authorization ne sont ajoutés que pour les hôtes dans `channels.msteams.mediaAuthAllowHosts` (par défaut, les hôtes Graph + Bot Framework). Gardez cette liste stricte (évitez les suffixes multi-locataires).

## Envoi de fichiers dans les discussions de groupe

Les bots peuvent envoyer des fichiers en messages privés à l’aide du flux FileConsentCard (intégré). Cependant, **l’envoi de fichiers dans les discussions de groupe/canaux** nécessite une configuration supplémentaire :

| Contexte                  | Mode d’envoi des fichiers                           | Configuration nécessaire                                    |
| ------------------------ | -------------------------------------------- | ----------------------------------------------- |
| **Messages privés**                  | FileConsentCard → l’utilisateur accepte → le bot téléverse | Fonctionne immédiatement                            |
| **Discussions de groupe/canaux** | Téléversement vers SharePoint → partage du lien            | Nécessite `sharePointSiteId` + autorisations Graph |
| **Images (tout contexte)** | Encodées en Base64 en ligne                        | Fonctionne immédiatement                            |

### Pourquoi les discussions de groupe nécessitent SharePoint

Les bots n’ont pas de lecteur OneDrive personnel (le point de terminaison Graph API `/me/drive` ne fonctionne pas pour les identités d’application). Pour envoyer des fichiers dans les discussions de groupe/canaux, le bot les téléverse vers un **site SharePoint** et crée un lien de partage.

### Configuration

1. **Ajoutez les autorisations Graph API** dans Entra ID (Azure AD) → App Registration :
   - `Sites.ReadWrite.All` (Application) - téléverser des fichiers vers SharePoint
   - `Chat.Read.All` (Application) - facultatif, active les liens de partage par utilisateur

2. **Accordez le consentement administrateur** pour le locataire.

3. **Obtenez votre ID de site SharePoint :**

   ```bash
   # Via Graph Explorer or curl with a valid token:
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/{hostname}:/{site-path}"

   # Example: for a site at "contoso.sharepoint.com/sites/BotFiles"
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com:/sites/BotFiles"

   # Response includes: "id": "contoso.sharepoint.com,guid1,guid2"
   ```

4. **Configurez OpenClaw :**

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

### Comportement de partage

| Autorisation                              | Comportement de partage                                          |
| --------------------------------------- | --------------------------------------------------------- |
| `Sites.ReadWrite.All` uniquement              | Lien de partage à l’échelle de l’organisation (toute personne de l’organisation peut y accéder) |
| `Sites.ReadWrite.All` + `Chat.Read.All` | Lien de partage par utilisateur (seuls les membres de la discussion peuvent y accéder)      |

Le partage par utilisateur est plus sécurisé, car seuls les participants à la discussion peuvent accéder au fichier. Si l’autorisation `Chat.Read.All` est absente, le bot se rabat sur un partage à l’échelle de l’organisation.

### Comportement de repli

| Scénario                                          | Résultat                                             |
| ------------------------------------------------- | -------------------------------------------------- |
| Discussion de groupe + fichier + `sharePointSiteId` configuré | Téléversement vers SharePoint, envoi du lien de partage            |
| Discussion de groupe + fichier + pas de `sharePointSiteId`         | Tentative de téléversement OneDrive (peut échouer), envoi du texte uniquement |
| Discussion personnelle + fichier                              | Flux FileConsentCard (fonctionne sans SharePoint)    |
| Tout contexte + image                               | Encodée en Base64 en ligne (fonctionne sans SharePoint)   |

### Emplacement de stockage des fichiers

Les fichiers téléversés sont stockés dans un dossier `/OpenClawShared/` dans la bibliothèque de documents par défaut du site SharePoint configuré.

## Sondages (Adaptive Cards)

OpenClaw envoie les sondages Teams sous forme d’Adaptive Cards (il n’existe pas d’API native de sondage Teams).

- CLI : `openclaw message poll --channel msteams --target conversation:<id> ...`
- Les votes sont enregistrés par le Gateway dans `~/.openclaw/msteams-polls.json`.
- Le Gateway doit rester en ligne pour enregistrer les votes.
- Les sondages ne publient pas encore automatiquement de résumés des résultats (inspectez le fichier de stockage si nécessaire).

## Cartes de présentation

Envoyez des charges utiles de présentation sémantique à des utilisateurs ou conversations Teams avec l’outil `message` ou la CLI. OpenClaw les affiche sous forme de Teams Adaptive Cards à partir du contrat de présentation générique.

Le paramètre `presentation` accepte des blocs sémantiques. Lorsque `presentation` est fourni, le texte du message est facultatif.

**Outil d’agent :**

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

**CLI :**

```bash
openclaw message send --channel msteams \
  --target "conversation:19:abc...@thread.tacv2" \
  --presentation '{"title":"Hello","blocks":[{"type":"text","text":"Hello!"}]}'
```

Pour plus de détails sur le format des cibles, consultez [Formats des cibles](#target-formats) ci-dessous.

## Formats des cibles

Les cibles MSTeams utilisent des préfixes pour distinguer les utilisateurs des conversations :

| Type de cible       | Format                           | Exemple                                             |
| ------------------- | -------------------------------- | --------------------------------------------------- |
| Utilisateur (par ID) | `user:<aad-object-id>`           | `user:40a1a0ed-4ff2-4164-a219-55518990c197`         |
| Utilisateur (par nom) | `user:<display-name>`            | `user:John Smith` (nécessite Graph API)              |
| Groupe/canal        | `conversation:<conversation-id>` | `conversation:19:abc123...@thread.tacv2`            |
| Groupe/canal (brut) | `<conversation-id>`              | `19:abc123...@thread.tacv2` (s’il contient `@thread`) |

**Exemples CLI :**

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

**Exemples d’outil d’agent :**

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
Sans le préfixe `user:`, les noms utilisent par défaut la résolution de groupe ou d’équipe. Utilisez toujours `user:` lorsque vous ciblez des personnes par nom d’affichage.
</Note>

## Messagerie proactive

- Les messages proactifs ne sont possibles **qu’après** qu’un utilisateur a interagi, car nous stockons les références de conversation à ce moment-là.
- Consultez `/gateway/configuration` pour `dmPolicy` et le contrôle par liste d’autorisation.

## ID d’équipe et de canal (piège courant)

Le paramètre de requête `groupId` dans les URL Teams n’est **PAS** l’ID d’équipe utilisé pour la configuration. Extrayez plutôt les ID depuis le chemin de l’URL :

**URL d’équipe :**

```
https://teams.microsoft.com/l/team/19%3ABk4j...%40thread.tacv2/conversations?groupId=...
                                    └────────────────────────────┘
                                    Team conversation ID (URL-decode this)
```

**URL de canal :**

```
https://teams.microsoft.com/l/channel/19%3A15bc...%40thread.tacv2/ChannelName?groupId=...
                                      └─────────────────────────┘
                                      Channel ID (URL-decode this)
```

**Pour la configuration :**

- Clé d’équipe = segment de chemin après `/team/` (décodé depuis l’URL, par exemple `19:Bk4j...@thread.tacv2` ; les anciens tenants peuvent afficher `@thread.skype`, ce qui est également valide)
- Clé de canal = segment de chemin après `/channel/` (décodé depuis l’URL)
- **Ignorez** le paramètre de requête `groupId` pour le routage OpenClaw. Il s’agit de l’ID de groupe Microsoft Entra, et non de l’ID de conversation Bot Framework utilisé dans les activités Teams entrantes.

## Canaux privés

Les bots disposent d’une prise en charge limitée dans les canaux privés :

| Fonctionnalité              | Canaux standard | Canaux privés          |
| ---------------------------- | ----------------- | ---------------------- |
| Installation du bot          | Oui               | Limitée                |
| Messages en temps réel (Webhook) | Oui               | Peut ne pas fonctionner |
| Autorisations RSC            | Oui               | Peuvent se comporter différemment |
| @mentions                    | Oui               | Si le bot est accessible |
| Historique Graph API         | Oui               | Oui (avec autorisations) |

**Solutions de contournement si les canaux privés ne fonctionnent pas :**

1. Utilisez les canaux standard pour les interactions avec le bot
2. Utilisez les DM : les utilisateurs peuvent toujours envoyer directement un message au bot
3. Utilisez Graph API pour l’accès à l’historique (nécessite `ChannelMessage.Read.All`)

## Dépannage

### Problèmes courants

- **Les images ne s’affichent pas dans les canaux :** autorisations Graph ou consentement administrateur manquants. Réinstallez l’application Teams, puis quittez et rouvrez complètement Teams.
- **Aucune réponse dans le canal :** les mentions sont requises par défaut ; définissez `channels.msteams.requireMention=false` ou configurez par équipe/canal.
- **Incompatibilité de version (Teams affiche encore l’ancien manifeste) :** supprimez puis rajoutez l’application, et quittez complètement Teams pour l’actualiser.
- **401 Unauthorized depuis le Webhook :** attendu lors d’un test manuel sans JWT Azure ; cela signifie que l’endpoint est joignable, mais que l’authentification a échoué. Utilisez Azure Web Chat pour tester correctement.

### Erreurs de téléversement du manifeste

- **"Icon file cannot be empty" :** le manifeste référence des fichiers d’icônes qui font 0 octet. Créez des icônes PNG valides (32x32 pour `outline.png`, 192x192 pour `color.png`).
- **"webApplicationInfo.Id already in use" :** l’application est encore installée dans une autre équipe/conversation. Trouvez-la et désinstallez-la d’abord, ou attendez 5 à 10 minutes pour la propagation.
- **"Something went wrong" lors du téléversement :** téléversez plutôt via [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com), ouvrez les DevTools du navigateur (F12) → onglet Réseau, puis vérifiez le corps de la réponse pour voir l’erreur réelle.
- **Échec du chargement local :** essayez "Upload an app to your org's app catalog" au lieu de "Upload a custom app" ; cela contourne souvent les restrictions de chargement local.

### Les autorisations RSC ne fonctionnent pas

1. Vérifiez que `webApplicationInfo.id` correspond exactement à l’App ID de votre bot
2. Téléversez de nouveau l’application et réinstallez-la dans l’équipe/conversation
3. Vérifiez si l’administrateur de votre organisation a bloqué les autorisations RSC
4. Confirmez que vous utilisez le bon périmètre : `ChannelMessage.Read.Group` pour les équipes, `ChatMessage.Read.Chat` pour les conversations de groupe

## Références

- [Créer un Azure Bot](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) - guide de configuration Azure Bot
- [Portail développeur Teams](https://dev.teams.microsoft.com/apps) - créer/gérer des applications Teams
- [Schéma du manifeste d’application Teams](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [Recevoir des messages de canal avec RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [Référence des autorisations RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [Gestion des fichiers par les bots Teams](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4) (un canal/groupe nécessite Graph)
- [Messagerie proactive](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)
- [@microsoft/teams.cli](https://www.npmjs.com/package/@microsoft/teams.cli) - CLI Teams pour la gestion des bots

## Associés

- [Vue d’ensemble des canaux](/fr/channels) - tous les canaux pris en charge
- [Pairing](/fr/channels/pairing) - authentification par DM et flux de Pairing
- [Groupes](/fr/channels/groups) - comportement des conversations de groupe et contrôle par mention
- [Routage des canaux](/fr/channels/channel-routing) - routage des sessions pour les messages
- [Sécurité](/fr/gateway/security) - modèle d’accès et renforcement
