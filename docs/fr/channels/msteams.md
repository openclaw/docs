---
read_when:
    - Travail sur les fonctionnalités du canal Microsoft Teams
summary: Statut de la prise en charge du bot Microsoft Teams, capacités et configuration
title: Microsoft Teams
x-i18n:
    generated_at: "2026-04-26T11:23:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 497bd2a0216f7de2345a52b178567964884a4bf6801daef3a2529f92b794cb0c
    source_path: channels/msteams.md
    workflow: 15
---

Statut : le texte et les pièces jointes de message privé sont pris en charge ; l’envoi de fichiers dans les canaux/groupes nécessite `sharePointSiteId` + des autorisations Graph (voir [Envoi de fichiers dans les discussions de groupe](#sending-files-in-group-chats)). Les sondages sont envoyés via des Adaptive Cards. Les actions de message exposent un `upload-file` explicite pour les envois axés sur les fichiers.

## Plugin intégré

Microsoft Teams est fourni comme Plugin intégré dans les versions actuelles d’OpenClaw, donc aucune installation séparée n’est nécessaire dans la version packagée normale.

Si vous utilisez une ancienne version ou une installation personnalisée qui exclut Teams intégré, installez-le manuellement :

```bash
openclaw plugins install @openclaw/msteams
```

Copie locale (lors d’une exécution depuis un dépôt git) :

```bash
openclaw plugins install ./path/to/local/msteams-plugin
```

Détails : [Plugins](/fr/tools/plugin)

## Configuration rapide

Le [`@microsoft/teams.cli`](https://www.npmjs.com/package/@microsoft/teams.cli) gère l’enregistrement du bot, la création du manifeste et la génération des identifiants en une seule commande.

**1. Installer et se connecter**

```bash
npm install -g @microsoft/teams.cli@preview
teams login
teams status   # vérifiez que vous êtes connecté et que les informations de votre locataire s’affichent
```

> **Remarque :** la CLI Teams est actuellement en préversion. Les commandes et les options peuvent changer d’une version à l’autre.

**2. Démarrer un tunnel** (Teams ne peut pas joindre localhost)

Installez et authentifiez la CLI devtunnel si ce n’est pas déjà fait ([guide de démarrage](https://learn.microsoft.com/en-us/azure/developer/dev-tunnels/get-started)).

```bash
# Configuration unique (URL persistante entre les sessions) :
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# À chaque session de développement :
devtunnel host my-openclaw-bot
# Votre point de terminaison : https://<tunnel-id>.devtunnels.ms/api/messages
```

> **Remarque :** `--allow-anonymous` est requis, car Teams ne peut pas s’authentifier avec devtunnels. Chaque requête entrante du bot est tout de même validée automatiquement par le SDK Teams.

Alternatives : `ngrok http 3978` ou `tailscale funnel 3978` (mais ces solutions peuvent changer d’URL à chaque session).

**3. Créer l’application**

```bash
teams app create \
  --name "OpenClaw" \
  --endpoint "https://<your-tunnel-url>/api/messages"
```

Cette commande unique :

- Crée une application Entra ID (Azure AD)
- Génère un secret client
- Construit et téléverse un manifeste d’application Teams (avec icônes)
- Enregistre le bot (géré par Teams par défaut — aucun abonnement Azure nécessaire)

La sortie affichera `CLIENT_ID`, `CLIENT_SECRET`, `TENANT_ID` et un **Teams App ID** — notez-les pour les étapes suivantes. Elle propose également d’installer directement l’application dans Teams.

**4. Configurer OpenClaw** avec les identifiants de la sortie :

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

**5. Installer l’application dans Teams**

`teams app create` vous invitera à installer l’application — sélectionnez « Install in Teams ». Si vous avez ignoré cette étape, vous pouvez obtenir le lien plus tard :

```bash
teams app get <teamsAppId> --install-link
```

**6. Vérifier que tout fonctionne**

```bash
teams app doctor <teamsAppId>
```

Cette commande exécute des diagnostics sur l’enregistrement du bot, la configuration de l’application AAD, la validité du manifeste et la configuration SSO.

Pour les déploiements en production, envisagez d’utiliser [l’authentification fédérée](#federated-authentication-certificate--managed-identity) (certificat ou identité managée) au lieu des secrets client.

Remarque : les discussions de groupe sont bloquées par défaut (`channels.msteams.groupPolicy: "allowlist"`). Pour autoriser les réponses dans les groupes, définissez `channels.msteams.groupAllowFrom` (ou utilisez `groupPolicy: "open"` pour autoriser n’importe quel membre, avec contrôle par mention).

## Objectifs

- Parler à OpenClaw via des messages privés, des discussions de groupe ou des canaux Teams.
- Garder un routage déterministe : les réponses reviennent toujours vers le canal sur lequel elles sont arrivées.
- Utiliser un comportement de canal sûr par défaut (mentions requises sauf configuration contraire).

## Écritures de configuration

Par défaut, Microsoft Teams est autorisé à écrire des mises à jour de configuration déclenchées par `/config set|unset` (nécessite `commands.config: true`).

Désactivez avec :

```json5
{
  channels: { msteams: { configWrites: false } },
}
```

## Contrôle d’accès (messages privés + groupes)

**Accès aux messages privés**

- Par défaut : `channels.msteams.dmPolicy = "pairing"`. Les expéditeurs inconnus sont ignorés jusqu’à approbation.
- `channels.msteams.allowFrom` doit utiliser des ID d’objet AAD stables.
- Ne vous fiez pas à la correspondance UPN/nom d’affichage pour les listes d’autorisation — ils peuvent changer. OpenClaw désactive par défaut la correspondance directe par nom ; activez-la explicitement avec `channels.msteams.dangerouslyAllowNameMatching: true`.
- L’assistant peut résoudre les noms en ID via Microsoft Graph lorsque les identifiants le permettent.

**Accès aux groupes**

- Par défaut : `channels.msteams.groupPolicy = "allowlist"` (bloqué tant que vous n’ajoutez pas `groupAllowFrom`). Utilisez `channels.defaults.groupPolicy` pour remplacer la valeur par défaut lorsqu’elle n’est pas définie.
- `channels.msteams.groupAllowFrom` contrôle quels expéditeurs peuvent déclencher des réponses dans les discussions de groupe/canaux (se replie sur `channels.msteams.allowFrom`).
- Définissez `groupPolicy: "open"` pour autoriser n’importe quel membre (avec contrôle par mention par défaut).
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

**Liste d’autorisation Teams + canaux**

- Délimitez les réponses de groupe/canal en listant les équipes et les canaux sous `channels.msteams.teams`.
- Les clés doivent utiliser des ID d’équipe stables et des ID de conversation de canal.
- Lorsque `groupPolicy="allowlist"` et qu’une liste d’autorisation d’équipes est présente, seules les équipes/canaux listés sont acceptés (avec contrôle par mention).
- L’assistant de configuration accepte des entrées `Team/Channel` et les enregistre pour vous.
- Au démarrage, OpenClaw résout les noms d’équipe/canal et les noms des listes d’autorisation utilisateur en ID (lorsque les autorisations Graph le permettent)
  et journalise le mappage ; les noms d’équipe/canal non résolus sont conservés tels qu’ils ont été saisis mais ignorés pour le routage par défaut, sauf si `channels.msteams.dangerouslyAllowNameMatching: true` est activé.

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
<summary><strong>Configuration manuelle (sans la CLI Teams)</strong></summary>

Si vous ne pouvez pas utiliser la CLI Teams, vous pouvez configurer le bot manuellement via le portail Azure.

### Fonctionnement

1. Assurez-vous que le Plugin Microsoft Teams est disponible (intégré dans les versions actuelles).
2. Créez un **Azure Bot** (App ID + secret + tenant ID).
3. Construisez un **package d’application Teams** qui référence le bot et inclut les autorisations RSC ci-dessous.
4. Téléversez/installez l’application Teams dans une équipe (ou dans l’étendue personnelle pour les messages privés).
5. Configurez `msteams` dans `~/.openclaw/openclaw.json` (ou via des variables d’environnement) et démarrez la Gateway.
6. La Gateway écoute le trafic webhook Bot Framework sur `/api/messages` par défaut.

### Étape 1 : Créer Azure Bot

1. Accédez à [Create Azure Bot](https://portal.azure.com/#create/Microsoft.AzureBot)
2. Remplissez l’onglet **Basics** :

   | Field              | Value                                                             |
   | ------------------ | ----------------------------------------------------------------- |
   | **Bot handle**     | Nom de votre bot, par ex. `openclaw-msteams` (doit être unique)   |
   | **Subscription**   | Sélectionnez votre abonnement Azure                               |
   | **Resource group** | Créez-en un nouveau ou utilisez un groupe existant                |
   | **Pricing tier**   | **Free** pour le développement/test                               |
   | **Type of App**    | **Single Tenant** (recommandé — voir la note ci-dessous)          |
   | **Creation type**  | **Create new Microsoft App ID**                                   |

> **Avis de dépréciation :** la création de nouveaux bots multi-locataires est déconseillée depuis le 2025-07-31. Utilisez **Single Tenant** pour les nouveaux bots.

3. Cliquez sur **Review + create** → **Create** (attendez ~1-2 minutes)

### Étape 2 : Obtenir les identifiants

1. Accédez à votre ressource Azure Bot → **Configuration**
2. Copiez **Microsoft App ID** → c’est votre `appId`
3. Cliquez sur **Manage Password** → accédez à l’enregistrement d’application
4. Sous **Certificates & secrets** → **New client secret** → copiez la **Value** → c’est votre `appPassword`
5. Accédez à **Overview** → copiez **Directory (tenant) ID** → c’est votre `tenantId`

### Étape 3 : Configurer le point de terminaison de messagerie

1. Dans Azure Bot → **Configuration**
2. Définissez **Messaging endpoint** sur votre URL de webhook :
   - Production : `https://your-domain.com/api/messages`
   - Développement local : utilisez un tunnel (voir [Développement local](#local-development-tunneling) ci-dessous)

### Étape 4 : Activer le canal Teams

1. Dans Azure Bot → **Channels**
2. Cliquez sur **Microsoft Teams** → Configure → Save
3. Acceptez les conditions d’utilisation

### Étape 5 : Construire le manifeste de l’application Teams

- Incluez une entrée `bot` avec `botId = <App ID>`.
- Étendues : `personal`, `team`, `groupChat`.
- `supportsFiles: true` (requis pour la gestion des fichiers dans l’étendue personnelle).
- Ajoutez les autorisations RSC (voir [Autorisations RSC](#current-teams-rsc-permissions-manifest)).
- Créez des icônes : `outline.png` (32x32) et `color.png` (192x192).
- Compressez les trois fichiers ensemble : `manifest.json`, `outline.png`, `color.png`.

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

### Étape 7 : Exécuter la Gateway

Le canal Teams démarre automatiquement lorsque le Plugin est disponible et que la configuration `msteams` existe avec les identifiants.

</details>

## Authentification fédérée (certificat + identité managée)

> Ajouté dans 2026.3.24

Pour les déploiements en production, OpenClaw prend en charge **l’authentification fédérée** comme alternative plus sûre aux secrets client. Deux méthodes sont disponibles :

### Option A : Authentification par certificat

Utilisez un certificat PEM enregistré avec votre enregistrement d’application Entra ID.

**Configuration :**

1. Générez ou obtenez un certificat (format PEM avec clé privée).
2. Dans Entra ID → Enregistrement d’application → **Certificates & secrets** → **Certificates** → téléversez le certificat public.

**Config :**

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

Utilisez Azure Managed Identity pour une authentification sans mot de passe. Cette option est idéale pour les déploiements sur une infrastructure Azure (AKS, App Service, machines virtuelles Azure) où une identité managée est disponible.

**Fonctionnement :**

1. Le pod/VM du bot possède une identité managée (attribuée par le système ou par l’utilisateur).
2. Un **federated identity credential** relie l’identité managée à l’enregistrement d’application Entra ID.
3. À l’exécution, OpenClaw utilise `@azure/identity` pour acquérir des jetons depuis le point de terminaison Azure IMDS (`169.254.169.254`).
4. Le jeton est transmis au SDK Teams pour l’authentification du bot.

**Prérequis :**

- Infrastructure Azure avec identité managée activée (identité de charge de travail AKS, App Service, VM)
- Federated identity credential créé sur l’enregistrement d’application Entra ID
- Accès réseau à IMDS (`169.254.169.254:80`) depuis le pod/VM

**Config (identité managée attribuée par le système) :**

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

**Config (identité managée attribuée par l’utilisateur) :**

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
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID=<client-id>` (uniquement pour une identité attribuée par l’utilisateur)

### Configuration d’AKS Workload Identity

Pour les déploiements AKS utilisant workload identity :

1. **Activez workload identity** sur votre cluster AKS.
2. **Créez un federated identity credential** sur l’enregistrement d’application Entra ID :

   ```bash
   az ad app federated-credential create --id <APP_OBJECT_ID> --parameters '{
     "name": "my-bot-workload-identity",
     "issuer": "<AKS_OIDC_ISSUER_URL>",
     "subject": "system:serviceaccount:<NAMESPACE>:<SERVICE_ACCOUNT>",
     "audiences": ["api://AzureADTokenExchange"]
   }'
   ```

3. **Ajoutez une annotation au compte de service Kubernetes** avec l’ID client de l’application :

   ```yaml
   apiVersion: v1
   kind: ServiceAccount
   metadata:
     name: my-bot-sa
     annotations:
       azure.workload.identity/client-id: "<APP_CLIENT_ID>"
   ```

4. **Ajoutez un libellé au pod** pour l’injection de workload identity :

   ```yaml
   metadata:
     labels:
       azure.workload.identity/use: "true"
   ```

5. **Assurez l’accès réseau** à IMDS (`169.254.169.254`) — si vous utilisez NetworkPolicy, ajoutez une règle de sortie autorisant le trafic vers `169.254.169.254/32` sur le port 80.

### Comparaison des types d’authentification

| Method               | Config                                         | Pros                                   | Cons                                     |
| -------------------- | ---------------------------------------------- | -------------------------------------- | ---------------------------------------- |
| **Client secret**    | `appPassword`                                  | Configuration simple                   | Rotation du secret requise, moins sécurisé |
| **Certificate**      | `authType: "federated"` + `certificatePath`    | Aucun secret partagé sur le réseau     | Surcharge de gestion des certificats     |
| **Managed Identity** | `authType: "federated"` + `useManagedIdentity` | Sans mot de passe, aucun secret à gérer | Infrastructure Azure requise             |

**Comportement par défaut :** lorsque `authType` n’est pas défini, OpenClaw utilise par défaut l’authentification par secret client. Les configurations existantes continuent de fonctionner sans modification.

## Développement local (tunneling)

Teams ne peut pas joindre `localhost`. Utilisez un tunnel de développement persistant afin que votre URL reste la même entre les sessions :

```bash
# Configuration unique :
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# À chaque session de développement :
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

Vérifie en une seule passe l’enregistrement du bot, l’application AAD, le manifeste et la configuration SSO.

**Envoyer un message de test :**

1. Installez l’application Teams (utilisez le lien d’installation depuis `teams app get <id> --install-link`)
2. Trouvez le bot dans Teams et envoyez-lui un message privé
3. Vérifiez les journaux de la Gateway pour l’activité entrante

## Variables d’environnement

Toutes les clés de configuration peuvent aussi être définies via des variables d’environnement :

- `MSTEAMS_APP_ID`
- `MSTEAMS_APP_PASSWORD`
- `MSTEAMS_TENANT_ID`
- `MSTEAMS_AUTH_TYPE` (facultatif : `"secret"` ou `"federated"`)
- `MSTEAMS_CERTIFICATE_PATH` (fédéré + certificat)
- `MSTEAMS_CERTIFICATE_THUMBPRINT` (facultatif, non requis pour l’authentification)
- `MSTEAMS_USE_MANAGED_IDENTITY` (fédéré + identité managée)
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID` (identité managée attribuée par l’utilisateur uniquement)

## Action d’informations sur les membres

OpenClaw expose une action `member-info` adossée à Graph pour Microsoft Teams afin que les agents et automatisations puissent résoudre directement depuis Microsoft Graph les détails des membres d’un canal (nom d’affichage, e-mail, rôle).

Exigences :

- Autorisation RSC `Member.Read.Group` (déjà présente dans le manifeste recommandé)
- Pour les recherches inter-équipes : autorisation d’application Graph `User.Read.All` avec consentement administrateur

L’action est contrôlée par `channels.msteams.actions.memberInfo` (activée par défaut lorsque des identifiants Graph sont disponibles).

## Contexte de l’historique

- `channels.msteams.historyLimit` contrôle le nombre de messages récents de canal/groupe intégrés dans le prompt.
- Revient à `messages.groupChat.historyLimit`. Définissez `0` pour désactiver (par défaut 50).
- L’historique de fil récupéré est filtré par les listes d’autorisation d’expéditeur (`allowFrom` / `groupAllowFrom`), de sorte que l’amorçage du contexte du fil n’inclut que les messages des expéditeurs autorisés.
- Le contexte des pièces jointes citées (`ReplyTo*` dérivé du HTML de réponse Teams) est actuellement transmis tel que reçu.
- En d’autres termes, les listes d’autorisation contrôlent qui peut déclencher l’agent ; seuls certains chemins de contexte supplémentaires spécifiques sont filtrés aujourd’hui.
- L’historique des messages privés peut être limité avec `channels.msteams.dmHistoryLimit` (tours utilisateur). Remplacements par utilisateur : `channels.msteams.dms["<user_id>"].historyLimit`.

## Autorisations RSC Teams actuelles (manifeste)

Voici les **autorisations resourceSpecific** existantes dans notre manifeste d’application Teams. Elles s’appliquent uniquement dans l’équipe/la discussion où l’application est installée.

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

### Points d’attention du manifeste (champs indispensables)

- `bots[].botId` **doit** correspondre à l’App ID Azure Bot.
- `webApplicationInfo.id` **doit** correspondre à l’App ID Azure Bot.
- `bots[].scopes` doit inclure les surfaces que vous prévoyez d’utiliser (`personal`, `team`, `groupChat`).
- `bots[].supportsFiles: true` est requis pour la gestion des fichiers dans la portée personnelle.
- `authorization.permissions.resourceSpecific` doit inclure la lecture/l’envoi de canal si vous voulez du trafic de canal.

### Mettre à jour une application existante

Pour mettre à jour une application Teams déjà installée (par ex. pour ajouter des autorisations RSC) :

```bash
# Télécharger, modifier et retéléverser le manifeste
teams app manifest download <teamsAppId> manifest.json
# Modifiez manifest.json localement...
teams app manifest upload manifest.json <teamsAppId>
# La version est incrémentée automatiquement si le contenu a changé
```

Après la mise à jour, réinstallez l’application dans chaque équipe pour que les nouvelles autorisations prennent effet, puis **quittez complètement et relancez Teams** (et pas seulement fermer la fenêtre) pour effacer les métadonnées d’application en cache.

<details>
<summary>Mise à jour manuelle du manifeste (sans CLI)</summary>

1. Mettez à jour votre `manifest.json` avec les nouveaux paramètres
2. **Incrémentez le champ `version`** (par ex. `1.0.0` → `1.1.0`)
3. **Recompressez** le manifeste avec les icônes (`manifest.json`, `outline.png`, `color.png`)
4. Téléversez le nouveau zip :
   - **Teams Admin Center :** Applications Teams → Gérer les applications → trouvez votre application → Téléverser une nouvelle version
   - **Sideload :** Dans Teams → Applications → Gérer vos applications → Téléverser une application personnalisée

</details>

## Capacités : RSC uniquement vs Graph

### Avec **Teams RSC uniquement** (application installée, sans autorisations d’API Graph)

Fonctionne :

- Lire le contenu **texte** des messages de canal.
- Envoyer le contenu **texte** des messages de canal.
- Recevoir des pièces jointes de fichier en **portée personnelle (message privé)**.

Ne fonctionne PAS :

- Contenu **d’image ou de fichier** de canal/groupe (la charge utile inclut seulement un stub HTML).
- Téléchargement des pièces jointes stockées dans SharePoint/OneDrive.
- Lecture de l’historique des messages (au-delà de l’événement webhook en direct).

### Avec **Teams RSC + autorisations d’application Microsoft Graph**

Ajoute :

- Téléchargement des contenus hébergés (images collées dans les messages).
- Téléchargement des pièces jointes de fichiers stockées dans SharePoint/OneDrive.
- Lecture de l’historique des messages de canal/discussion via Graph.

### RSC vs API Graph

| Capability              | RSC Permissions        | Graph API                               |
| ----------------------- | ---------------------- | --------------------------------------- |
| **Real-time messages**  | Oui (via webhook)      | Non (sondage uniquement)                |
| **Historical messages** | Non                    | Oui (peut interroger l’historique)      |
| **Setup complexity**    | Manifeste d’application uniquement | Nécessite consentement administrateur + flux de jetons |
| **Works offline**       | Non (doit être en cours d’exécution) | Oui (interrogation possible à tout moment) |

**En résumé :** RSC sert à l’écoute en temps réel ; l’API Graph sert à l’accès historique. Pour rattraper les messages manqués hors ligne, vous avez besoin de l’API Graph avec `ChannelMessage.Read.All` (nécessite le consentement administrateur).

## Médias + historique avec Graph (requis pour les canaux)

Si vous avez besoin d’images/fichiers dans les **canaux** ou si vous voulez récupérer **l’historique des messages**, vous devez activer les autorisations Microsoft Graph et accorder le consentement administrateur.

1. Dans **App Registration** Entra ID (Azure AD), ajoutez les **autorisations d’application** Microsoft Graph :
   - `ChannelMessage.Read.All` (pièces jointes de canal + historique)
   - `Chat.Read.All` ou `ChatMessage.Read.All` (discussions de groupe)
2. **Accordez le consentement administrateur** pour le locataire.
3. Incrémentez la **version du manifeste** de l’application Teams, retéléversez-le et **réinstallez l’application dans Teams**.
4. **Quittez complètement et relancez Teams** pour effacer les métadonnées d’application en cache.

**Autorisation supplémentaire pour les mentions utilisateur :** les @mentions d’utilisateurs fonctionnent immédiatement pour les utilisateurs de la conversation. En revanche, si vous voulez rechercher dynamiquement et mentionner des utilisateurs qui **ne sont pas dans la conversation actuelle**, ajoutez l’autorisation d’application `User.Read.All` et accordez le consentement administrateur.

## Limitations connues

### Délais d’expiration des webhooks

Teams distribue les messages via webhook HTTP. Si le traitement prend trop de temps (par ex. réponses LLM lentes), vous pouvez constater :

- Délais d’expiration de la Gateway
- Nouvelles tentatives de Teams sur le message (provoquant des doublons)
- Réponses perdues

OpenClaw gère cela en répondant rapidement et en envoyant des réponses de manière proactive, mais des réponses très lentes peuvent malgré tout poser problème.

### Mise en forme

Le Markdown Teams est plus limité que celui de Slack ou Discord :

- La mise en forme de base fonctionne : **gras**, _italique_, `code`, liens
- Le Markdown complexe (tableaux, listes imbriquées) peut ne pas s’afficher correctement
- Les Adaptive Cards sont prises en charge pour les sondages et les envois de présentation sémantique (voir ci-dessous)

## Configuration

Paramètres clés (voir `/gateway/configuration` pour les modèles partagés entre canaux) :

- `channels.msteams.enabled` : activer/désactiver le canal.
- `channels.msteams.appId`, `channels.msteams.appPassword`, `channels.msteams.tenantId` : identifiants du bot.
- `channels.msteams.webhook.port` (par défaut `3978`)
- `channels.msteams.webhook.path` (par défaut `/api/messages`)
- `channels.msteams.dmPolicy` : `pairing | allowlist | open | disabled` (par défaut : pairing)
- `channels.msteams.allowFrom` : liste d’autorisation des messages privés (ID d’objet AAD recommandés). L’assistant résout les noms en ID pendant la configuration lorsque l’accès Graph est disponible.
- `channels.msteams.dangerouslyAllowNameMatching` : bouton de secours pour réactiver la correspondance avec des UPN/noms d’affichage modifiables et le routage direct par nom d’équipe/canal.
- `channels.msteams.textChunkLimit` : taille des segments de texte sortants.
- `channels.msteams.chunkMode` : `length` (par défaut) ou `newline` pour découper sur les lignes vides (limites de paragraphe) avant le découpage par longueur.
- `channels.msteams.mediaAllowHosts` : liste d’autorisation des hôtes pour les pièces jointes entrantes (par défaut les domaines Microsoft/Teams).
- `channels.msteams.mediaAuthAllowHosts` : liste d’autorisation pour joindre des en-têtes Authorization lors des nouvelles tentatives sur les médias (par défaut les hôtes Graph + Bot Framework).
- `channels.msteams.requireMention` : exiger une @mention dans les canaux/groupes (par défaut true).
- `channels.msteams.replyStyle` : `thread | top-level` (voir [Style de réponse](#reply-style-threads-vs-posts)).
- `channels.msteams.teams.<teamId>.replyStyle` : remplacement par équipe.
- `channels.msteams.teams.<teamId>.requireMention` : remplacement par équipe.
- `channels.msteams.teams.<teamId>.tools` : remplacements par défaut de politique d’outils par équipe (`allow`/`deny`/`alsoAllow`) utilisés lorsqu’un remplacement de canal est absent.
- `channels.msteams.teams.<teamId>.toolsBySender` : remplacements par défaut de politique d’outils par équipe et par expéditeur (`"*"` pris en charge).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle` : remplacement par canal.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.requireMention` : remplacement par canal.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.tools` : remplacements de politique d’outils par canal (`allow`/`deny`/`alsoAllow`).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.toolsBySender` : remplacements de politique d’outils par canal et par expéditeur (`"*"` pris en charge).
- Les clés `toolsBySender` doivent utiliser des préfixes explicites :
  `id:`, `e164:`, `username:`, `name:` (les anciennes clés sans préfixe sont toujours mappées vers `id:` uniquement).
- `channels.msteams.actions.memberInfo` : activer ou désactiver l’action d’informations sur les membres adossée à Graph (activée par défaut lorsque des identifiants Graph sont disponibles).
- `channels.msteams.authType` : type d’authentification — `"secret"` (par défaut) ou `"federated"`.
- `channels.msteams.certificatePath` : chemin vers le fichier de certificat PEM (fédéré + authentification par certificat).
- `channels.msteams.certificateThumbprint` : empreinte du certificat (facultatif, non requis pour l’authentification).
- `channels.msteams.useManagedIdentity` : activer l’authentification par identité managée (mode fédéré).
- `channels.msteams.managedIdentityClientId` : ID client pour une identité managée attribuée par l’utilisateur.
- `channels.msteams.sharePointSiteId` : ID du site SharePoint pour les téléversements de fichiers dans les discussions de groupe/canaux (voir [Envoi de fichiers dans les discussions de groupe](#sending-files-in-group-chats)).

## Routage et sessions

- Les clés de session suivent le format standard des agents (voir [/concepts/session](/fr/concepts/session)) :
  - Les messages privés partagent la session principale (`agent:<agentId>:<mainKey>`).
  - Les messages de canal/groupe utilisent l’ID de conversation :
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## Style de réponse : fils vs publications

Teams a récemment introduit deux styles d’interface de canal sur le même modèle de données sous-jacent :

| Style                    | Description                                               | `replyStyle` recommandé |
| ------------------------ | --------------------------------------------------------- | ----------------------- |
| **Posts** (classique)    | Les messages apparaissent comme des cartes avec des réponses en fil dessous | `thread` (par défaut)   |
| **Threads** (type Slack) | Les messages s’enchaînent de manière linéaire, davantage comme Slack | `top-level`             |

**Le problème :** l’API Teams n’indique pas quel style d’interface un canal utilise. Si vous utilisez le mauvais `replyStyle` :

- `thread` dans un canal de style Threads → les réponses apparaissent imbriquées de manière peu pratique
- `top-level` dans un canal de style Posts → les réponses apparaissent comme des publications séparées de niveau supérieur au lieu d’être dans le fil

**Solution :** configurez `replyStyle` par canal selon la configuration du canal :

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

## Pièces jointes et images

**Limitations actuelles :**

- **Messages privés :** les images et pièces jointes de fichier fonctionnent via les API de fichiers du bot Teams.
- **Canaux/groupes :** les pièces jointes vivent dans le stockage M365 (SharePoint/OneDrive). La charge utile webhook inclut uniquement un stub HTML, pas les octets du fichier réel. **Les autorisations d’API Graph sont requises** pour télécharger les pièces jointes de canal.
- Pour les envois explicitement axés sur les fichiers, utilisez `action=upload-file` avec `media` / `filePath` / `path` ; `message` facultatif devient le texte/commentaire d’accompagnement, et `filename` remplace le nom téléversé.

Sans autorisations Graph, les messages de canal avec images seront reçus comme texte uniquement (le contenu de l’image n’est pas accessible au bot).
Par défaut, OpenClaw ne télécharge les médias que depuis les noms d’hôte Microsoft/Teams. Remplacez avec `channels.msteams.mediaAllowHosts` (utilisez `["*"]` pour autoriser n’importe quel hôte).
Les en-têtes Authorization ne sont joints que pour les hôtes de `channels.msteams.mediaAuthAllowHosts` (par défaut les hôtes Graph + Bot Framework). Gardez cette liste stricte (évitez les suffixes multi-locataires).

## Envoi de fichiers dans les discussions de groupe

Les bots peuvent envoyer des fichiers dans les messages privés via le flux FileConsentCard (intégré). Cependant, **l’envoi de fichiers dans les discussions de groupe/canaux** nécessite une configuration supplémentaire :

| Context                  | How files are sent                           | Setup needed                                    |
| ------------------------ | -------------------------------------------- | ----------------------------------------------- |
| **DMs**                  | FileConsentCard → l’utilisateur accepte → le bot téléverse | Fonctionne immédiatement                        |
| **Group chats/channels** | Téléversement vers SharePoint → lien de partage | Nécessite `sharePointSiteId` + autorisations Graph |
| **Images (any context)** | Inline codé en Base64                        | Fonctionne immédiatement                        |

### Pourquoi les discussions de groupe ont besoin de SharePoint

Les bots n’ont pas de lecteur OneDrive personnel (le point de terminaison d’API Graph `/me/drive` ne fonctionne pas pour les identités d’application). Pour envoyer des fichiers dans les discussions de groupe/canaux, le bot téléverse sur un **site SharePoint** et crée un lien de partage.

### Configuration

1. **Ajoutez les autorisations d’API Graph** dans Entra ID (Azure AD) → App Registration :
   - `Sites.ReadWrite.All` (Application) - téléverser des fichiers vers SharePoint
   - `Chat.Read.All` (Application) - facultatif, active les liens de partage par utilisateur

2. **Accordez le consentement administrateur** pour le locataire.

3. **Obtenez l’ID de votre site SharePoint :**

   ```bash
   # Via Graph Explorer ou curl avec un jeton valide :
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/{hostname}:/{site-path}"

   # Exemple : pour un site à "contoso.sharepoint.com/sites/BotFiles"
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com:/sites/BotFiles"

   # La réponse inclut : "id": "contoso.sharepoint.com,guid1,guid2"
   ```

4. **Configurez OpenClaw :**

   ```json5
   {
     channels: {
       msteams: {
         // ... autre configuration ...
         sharePointSiteId: "contoso.sharepoint.com,guid1,guid2",
       },
     },
   }
   ```

### Comportement du partage

| Permission                              | Comportement du partage                                 |
| --------------------------------------- | ------------------------------------------------------- |
| `Sites.ReadWrite.All` uniquement        | Lien de partage à l’échelle de l’organisation (toute personne de l’organisation peut accéder) |
| `Sites.ReadWrite.All` + `Chat.Read.All` | Lien de partage par utilisateur (seuls les membres de la discussion peuvent accéder) |

Le partage par utilisateur est plus sûr, car seuls les participants à la discussion peuvent accéder au fichier. Si l’autorisation `Chat.Read.All` est absente, le bot revient à un partage à l’échelle de l’organisation.

### Comportement de repli

| Scenario                                          | Result                                              |
| ------------------------------------------------- | --------------------------------------------------- |
| Discussion de groupe + fichier + `sharePointSiteId` configuré | Téléversement vers SharePoint, envoi d’un lien de partage |
| Discussion de groupe + fichier + aucun `sharePointSiteId` | Tentative de téléversement OneDrive (peut échouer), envoi du texte uniquement |
| Discussion personnelle + fichier                  | Flux FileConsentCard (fonctionne sans SharePoint)   |
| N’importe quel contexte + image                   | Inline codé en Base64 (fonctionne sans SharePoint)  |

### Emplacement de stockage des fichiers

Les fichiers téléversés sont stockés dans un dossier `/OpenClawShared/` de la bibliothèque de documents par défaut du site SharePoint configuré.

## Sondages (Adaptive Cards)

OpenClaw envoie les sondages Teams sous forme d’Adaptive Cards (il n’existe pas d’API native de sondage Teams).

- CLI : `openclaw message poll --channel msteams --target conversation:<id> ...`
- Les votes sont enregistrés par la Gateway dans `~/.openclaw/msteams-polls.json`.
- La Gateway doit rester en ligne pour enregistrer les votes.
- Les sondages ne publient pas encore automatiquement de synthèse des résultats (inspectez le fichier de stockage si nécessaire).

## Cartes de présentation

Envoyez des charges utiles de présentation sémantique à des utilisateurs ou conversations Teams à l’aide de l’outil `message` ou de la CLI. OpenClaw les affiche comme des Adaptive Cards Teams à partir du contrat de présentation générique.

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

Pour les détails du format de cible, voir [Formats de cible](#target-formats) ci-dessous.

## Formats de cible

Les cibles MSTeams utilisent des préfixes pour distinguer les utilisateurs des conversations :

| Type de cible          | Format                           | Exemple                                             |
| ---------------------- | -------------------------------- | --------------------------------------------------- |
| Utilisateur (par ID)   | `user:<aad-object-id>`           | `user:40a1a0ed-4ff2-4164-a219-55518990c197`         |
| Utilisateur (par nom)  | `user:<display-name>`            | `user:John Smith` (nécessite l’API Graph)           |
| Groupe/canal           | `conversation:<conversation-id>` | `conversation:19:abc123...@thread.tacv2`            |
| Groupe/canal (brut)    | `<conversation-id>`              | `19:abc123...@thread.tacv2` (si contient `@thread`) |

**Exemples CLI :**

```bash
# Envoyer à un utilisateur par ID
openclaw message send --channel msteams --target "user:40a1a0ed-..." --message "Hello"

# Envoyer à un utilisateur par nom d’affichage (déclenche une recherche via l’API Graph)
openclaw message send --channel msteams --target "user:John Smith" --message "Hello"

# Envoyer à une discussion de groupe ou à un canal
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" --message "Hello"

# Envoyer une carte de présentation à une conversation
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" \
  --presentation '{"title":"Hello","blocks":[{"type":"text","text":"Hello"}]}'
```

**Exemples d’outils d’agent :**

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

Remarque : sans le préfixe `user:`, les noms sont résolus par défaut comme des groupes/équipes. Utilisez toujours `user:` lorsque vous ciblez des personnes par nom d’affichage.

## Messagerie proactive

- Les messages proactifs ne sont possibles **qu’après** qu’un utilisateur a interagi, car nous stockons alors les références de conversation.
- Voir `/gateway/configuration` pour `dmPolicy` et le contrôle par liste d’autorisation.

## ID d’équipe et de canal (piège fréquent)

Le paramètre de requête `groupId` dans les URL Teams n’est **PAS** l’ID d’équipe utilisé pour la configuration. Extrayez plutôt les ID depuis le chemin de l’URL :

**URL d’équipe :**

```
https://teams.microsoft.com/l/team/19%3ABk4j...%40thread.tacv2/conversations?groupId=...
                                    └────────────────────────────┘
                                    ID d’équipe (à décoder depuis l’URL)
```

**URL de canal :**

```
https://teams.microsoft.com/l/channel/19%3A15bc...%40thread.tacv2/ChannelName?groupId=...
                                      └─────────────────────────┘
                                      ID de canal (à décoder depuis l’URL)
```

**Pour la configuration :**

- ID d’équipe = segment de chemin après `/team/` (décodé depuis l’URL, par ex. `19:Bk4j...@thread.tacv2`)
- ID de canal = segment de chemin après `/channel/` (décodé depuis l’URL)
- **Ignorez** le paramètre de requête `groupId`

## Canaux privés

Les bots ont une prise en charge limitée dans les canaux privés :

| Feature                      | Standard Channels  | Private Channels       |
| ---------------------------- | ------------------ | ---------------------- |
| Installation du bot          | Oui                | Limitée                |
| Messages en temps réel (webhook) | Oui            | Peut ne pas fonctionner |
| Autorisations RSC            | Oui                | Peuvent se comporter différemment |
| @mentions                    | Oui                | Si le bot est accessible |
| Historique via API Graph     | Oui                | Oui (avec autorisations) |

**Solutions de contournement si les canaux privés ne fonctionnent pas :**

1. Utilisez des canaux standard pour les interactions avec le bot
2. Utilisez les messages privés - les utilisateurs peuvent toujours envoyer directement un message au bot
3. Utilisez l’API Graph pour l’accès à l’historique (nécessite `ChannelMessage.Read.All`)

## Dépannage

### Problèmes courants

- **Les images ne s’affichent pas dans les canaux :** autorisations Graph ou consentement administrateur manquants. Réinstallez l’application Teams et quittez/rouvrez complètement Teams.
- **Aucune réponse dans le canal :** les mentions sont requises par défaut ; définissez `channels.msteams.requireMention=false` ou configurez cela par équipe/canal.
- **Incompatibilité de version (Teams affiche toujours l’ancien manifeste) :** supprimez puis rajoutez l’application, puis quittez complètement Teams pour actualiser.
- **401 Unauthorized depuis le webhook :** comportement attendu lors de tests manuels sans JWT Azure - cela signifie que le point de terminaison est accessible mais que l’authentification a échoué. Utilisez Azure Web Chat pour tester correctement.

### Erreurs de téléversement du manifeste

- **"Icon file cannot be empty" :** le manifeste référence des fichiers d’icône de 0 octet. Créez des icônes PNG valides (32x32 pour `outline.png`, 192x192 pour `color.png`).
- **"webApplicationInfo.Id already in use" :** l’application est encore installée dans une autre équipe/discussion. Trouvez-la et désinstallez-la d’abord, ou attendez 5 à 10 minutes pour la propagation.
- **"Something went wrong" lors du téléversement :** téléversez via [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com) à la place, ouvrez les DevTools du navigateur (F12) → onglet Network, puis vérifiez le corps de la réponse pour voir l’erreur réelle.
- **Échec du sideload :** essayez « Upload an app to your org's app catalog » au lieu de « Upload a custom app » - cela contourne souvent les restrictions de sideload.

### Les autorisations RSC ne fonctionnent pas

1. Vérifiez que `webApplicationInfo.id` correspond exactement à l’App ID de votre bot
2. Retéléversez l’application et réinstallez-la dans l’équipe/la discussion
3. Vérifiez si l’administrateur de votre organisation a bloqué les autorisations RSC
4. Confirmez que vous utilisez la bonne portée : `ChannelMessage.Read.Group` pour les équipes, `ChatMessage.Read.Chat` pour les discussions de groupe

## Références

- [Create Azure Bot](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) - guide de configuration Azure Bot
- [Teams Developer Portal](https://dev.teams.microsoft.com/apps) - créer/gérer des applications Teams
- [Teams app manifest schema](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [Receive channel messages with RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [RSC permissions reference](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [Teams bot file handling](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4) (le canal/groupe nécessite Graph)
- [Proactive messaging](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)
- [@microsoft/teams.cli](https://www.npmjs.com/package/@microsoft/teams.cli) - CLI Teams pour la gestion des bots

## Liens connexes

- [Vue d’ensemble des canaux](/fr/channels) — tous les canaux pris en charge
- [Association](/fr/channels/pairing) — authentification par message privé et flux d’association
- [Groupes](/fr/channels/groups) — comportement des discussions de groupe et contrôle par mention
- [Routage des canaux](/fr/channels/channel-routing) — routage de session pour les messages
- [Sécurité](/fr/gateway/security) — modèle d’accès et renforcement de la sécurité
