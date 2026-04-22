---
read_when:
    - Travail sur les fonctionnalités du canal Microsoft Teams
summary: Statut de prise en charge, capacités et configuration du bot Microsoft Teams
title: Microsoft Teams
x-i18n:
    generated_at: "2026-04-22T04:20:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: ee9d52fb2cc7801e84249a705e0fa2052d4afbb7ef58cee2d3362b3e7012348c
    source_path: channels/msteams.md
    workflow: 15
---

# Microsoft Teams

> « Vous qui entrez ici, abandonnez toute espérance. »

Statut : le texte et les pièces jointes en message privé sont pris en charge ; l’envoi de fichiers dans les canaux/groupes nécessite `sharePointSiteId` + des autorisations Graph (voir [Envoi de fichiers dans les discussions de groupe](#sending-files-in-group-chats)). Les sondages sont envoyés via des cartes adaptatives. Les actions de message exposent `upload-file` de façon explicite pour les envois centrés sur les fichiers.

## Plugin intégré

Microsoft Teams est livré comme plugin intégré dans les versions actuelles d’OpenClaw, donc aucune installation séparée n’est requise dans la build packagée normale.

Si vous utilisez une ancienne build ou une installation personnalisée qui exclut Teams intégré,
installez-le manuellement :

```bash
openclaw plugins install @openclaw/msteams
```

Extraction locale (lors d’une exécution depuis un dépôt git) :

```bash
openclaw plugins install ./path/to/local/msteams-plugin
```

Détails : [Plugins](/fr/tools/plugin)

## Configuration rapide (débutant)

1. Assurez-vous que le plugin Microsoft Teams est disponible.
   - Les versions packagées actuelles d’OpenClaw l’intègrent déjà.
   - Les installations anciennes/personnalisées peuvent l’ajouter manuellement avec les commandes ci-dessus.
2. Créez un **Azure Bot** (App ID + secret client + ID du locataire).
3. Configurez OpenClaw avec ces identifiants.
4. Exposez `/api/messages` (port 3978 par défaut) via une URL publique ou un tunnel.
5. Installez le package d’application Teams et démarrez la Gateway.

Configuration minimale (secret client) :

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

Pour les déploiements en production, envisagez d’utiliser [l’authentification fédérée](#federated-authentication-certificate--managed-identity) (certificat ou identité managée) au lieu des secrets client.

Remarque : les discussions de groupe sont bloquées par défaut (`channels.msteams.groupPolicy: "allowlist"`). Pour autoriser les réponses de groupe, définissez `channels.msteams.groupAllowFrom` (ou utilisez `groupPolicy: "open"` pour autoriser n’importe quel membre, sous réserve de mention).

## Objectifs

- Parler à OpenClaw via les messages privés Teams, les discussions de groupe ou les canaux.
- Garder un routage déterministe : les réponses reviennent toujours au canal sur lequel elles sont arrivées.
- Adopter par défaut un comportement de canal sûr (mentions requises sauf configuration contraire).

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

- Par défaut : `channels.msteams.dmPolicy = "pairing"`. Les expéditeurs inconnus sont ignorés jusqu’à leur approbation.
- `channels.msteams.allowFrom` doit utiliser des identifiants d’objet AAD stables.
- Les UPN/noms d’affichage sont modifiables ; la correspondance directe est désactivée par défaut et n’est activée qu’avec `channels.msteams.dangerouslyAllowNameMatching: true`.
- L’assistant peut résoudre les noms en identifiants via Microsoft Graph lorsque les identifiants le permettent.

**Accès aux groupes**

- Par défaut : `channels.msteams.groupPolicy = "allowlist"` (bloqué tant que vous n’ajoutez pas `groupAllowFrom`). Utilisez `channels.defaults.groupPolicy` pour remplacer la valeur par défaut lorsqu’elle n’est pas définie.
- `channels.msteams.groupAllowFrom` contrôle quels expéditeurs peuvent déclencher dans les discussions de groupe/canaux (revient à `channels.msteams.allowFrom` par défaut).
- Définissez `groupPolicy: "open"` pour autoriser n’importe quel membre (toujours soumis à une mention par défaut).
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

- Limitez les réponses de groupe/canal en listant les équipes et les canaux sous `channels.msteams.teams`.
- Les clés doivent utiliser des identifiants d’équipe stables et des identifiants de conversation de canal.
- Lorsque `groupPolicy="allowlist"` et qu’une liste d’autorisation d’équipes est présente, seules les équipes/canaux listés sont acceptés (soumis à mention).
- L’assistant de configuration accepte les entrées `Team/Channel` et les enregistre pour vous.
- Au démarrage, OpenClaw résout les noms d’équipe/canal et les noms d’utilisateur de la liste d’autorisation en identifiants (lorsque les autorisations Graph le permettent)
  et consigne le mapping ; les noms d’équipe/canal non résolus sont conservés tels qu’ils ont été saisis mais ignorés pour le routage par défaut, sauf si `channels.msteams.dangerouslyAllowNameMatching: true` est activé.

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

## Fonctionnement

1. Assurez-vous que le plugin Microsoft Teams est disponible.
   - Les versions packagées actuelles d’OpenClaw l’intègrent déjà.
   - Les installations anciennes/personnalisées peuvent l’ajouter manuellement avec les commandes ci-dessus.
2. Créez un **Azure Bot** (App ID + secret + ID du locataire).
3. Créez un **package d’application Teams** qui référence le bot et inclut les autorisations RSC ci-dessous.
4. Téléversez/installez l’application Teams dans une équipe (ou dans un périmètre personnel pour les messages privés).
5. Configurez `msteams` dans `~/.openclaw/openclaw.json` (ou via des variables d’environnement) et démarrez la Gateway.
6. La Gateway écoute par défaut le trafic de Webhook Bot Framework sur `/api/messages`.

## Configuration Azure Bot (prérequis)

Avant de configurer OpenClaw, vous devez créer une ressource Azure Bot.

### Étape 1 : créer Azure Bot

1. Accédez à [Créer Azure Bot](https://portal.azure.com/#create/Microsoft.AzureBot)
2. Renseignez l’onglet **Basics** :

   | Champ              | Valeur                                                   |
   | ------------------ | -------------------------------------------------------- |
   | **Bot handle**     | Le nom de votre bot, par ex. `openclaw-msteams` (doit être unique) |
   | **Subscription**   | Sélectionnez votre abonnement Azure                      |
   | **Resource group** | Créez-en un nouveau ou utilisez un existant              |
   | **Pricing tier**   | **Free** pour le développement/test                      |
   | **Type of App**    | **Single Tenant** (recommandé - voir la note ci-dessous) |
   | **Creation type**  | **Create new Microsoft App ID**                          |

> **Avis de dépréciation :** la création de nouveaux bots multi-locataires a été déconseillée après le 2025-07-31. Utilisez **Single Tenant** pour les nouveaux bots.

3. Cliquez sur **Review + create** → **Create** (attendez ~1-2 minutes)

### Étape 2 : récupérer les identifiants

1. Accédez à votre ressource Azure Bot → **Configuration**
2. Copiez **Microsoft App ID** → il s’agit de votre `appId`
3. Cliquez sur **Manage Password** → accédez à l’enregistrement d’application
4. Sous **Certificates & secrets** → **New client secret** → copiez la **Value** → il s’agit de votre `appPassword`
5. Accédez à **Overview** → copiez **Directory (tenant) ID** → il s’agit de votre `tenantId`

### Étape 3 : configurer le point de terminaison de messagerie

1. Dans Azure Bot → **Configuration**
2. Définissez **Messaging endpoint** sur votre URL de Webhook :
   - Production : `https://your-domain.com/api/messages`
   - Développement local : utilisez un tunnel (voir [Développement local](#local-development-tunneling) ci-dessous)

### Étape 4 : activer le canal Teams

1. Dans Azure Bot → **Channels**
2. Cliquez sur **Microsoft Teams** → Configure → Save
3. Acceptez les Conditions d’utilisation

## Authentification fédérée (certificat + identité managée)

> Ajouté dans 2026.3.24

Pour les déploiements en production, OpenClaw prend en charge **l’authentification fédérée** comme alternative plus sûre aux secrets client. Deux méthodes sont disponibles :

### Option A : authentification basée sur un certificat

Utilisez un certificat PEM enregistré dans l’enregistrement de votre application Entra ID.

**Configuration :**

1. Générez ou obtenez un certificat (format PEM avec clé privée).
2. Dans Entra ID → App Registration → **Certificates & secrets** → **Certificates** → téléversez le certificat public.

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

Utilisez Azure Managed Identity pour une authentification sans mot de passe. C’est idéal pour les déploiements sur une infrastructure Azure (AKS, App Service, machines virtuelles Azure) lorsqu’une identité managée est disponible.

**Fonctionnement :**

1. Le pod/VM du bot possède une identité managée (attribuée par le système ou par l’utilisateur).
2. Un **federated identity credential** relie l’identité managée à l’enregistrement de l’application Entra ID.
3. À l’exécution, OpenClaw utilise `@azure/identity` pour acquérir des jetons depuis le point de terminaison Azure IMDS (`169.254.169.254`).
4. Le jeton est transmis au SDK Teams pour l’authentification du bot.

**Prérequis :**

- Infrastructure Azure avec identité managée activée (AKS workload identity, App Service, VM)
- Federated identity credential créé sur l’enregistrement de l’application Entra ID
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
2. **Créez un federated identity credential** sur l’enregistrement de l’application Entra ID :

   ```bash
   az ad app federated-credential create --id <APP_OBJECT_ID> --parameters '{
     "name": "my-bot-workload-identity",
     "issuer": "<AKS_OIDC_ISSUER_URL>",
     "subject": "system:serviceaccount:<NAMESPACE>:<SERVICE_ACCOUNT>",
     "audiences": ["api://AzureADTokenExchange"]
   }'
   ```

3. **Annotez le compte de service Kubernetes** avec l’identifiant client de l’application :

   ```yaml
   apiVersion: v1
   kind: ServiceAccount
   metadata:
     name: my-bot-sa
     annotations:
       azure.workload.identity/client-id: "<APP_CLIENT_ID>"
   ```

4. **Étiquetez le pod** pour l’injection de workload identity :

   ```yaml
   metadata:
     labels:
       azure.workload.identity/use: "true"
   ```

5. **Assurez l’accès réseau** à IMDS (`169.254.169.254`) — si vous utilisez NetworkPolicy, ajoutez une règle de sortie autorisant le trafic vers `169.254.169.254/32` sur le port 80.

### Comparaison des types d’authentification

| Méthode              | Config                                         | Avantages                          | Inconvénients                         |
| -------------------- | ---------------------------------------------- | ---------------------------------- | ------------------------------------- |
| **Secret client**    | `appPassword`                                  | Configuration simple               | Rotation du secret requise, moins sûr |
| **Certificat**       | `authType: "federated"` + `certificatePath`    | Aucun secret partagé sur le réseau | Gestion des certificats plus lourde   |
| **Managed Identity** | `authType: "federated"` + `useManagedIdentity` | Sans mot de passe, aucun secret à gérer | Infrastructure Azure requise      |

**Comportement par défaut :** lorsque `authType` n’est pas défini, OpenClaw utilise par défaut l’authentification par secret client. Les configurations existantes continuent de fonctionner sans modification.

## Développement local (tunneling)

Teams ne peut pas atteindre `localhost`. Utilisez un tunnel pour le développement local :

**Option A : ngrok**

```bash
ngrok http 3978
# Copiez l’URL https, par ex. https://abc123.ngrok.io
# Définissez le point de terminaison de messagerie sur : https://abc123.ngrok.io/api/messages
```

**Option B : Tailscale Funnel**

```bash
tailscale funnel 3978
# Utilisez votre URL Tailscale funnel comme point de terminaison de messagerie
```

## Teams Developer Portal (alternative)

Au lieu de créer manuellement une archive ZIP du manifeste, vous pouvez utiliser le [Teams Developer Portal](https://dev.teams.microsoft.com/apps) :

1. Cliquez sur **+ New app**
2. Renseignez les informations de base (nom, description, informations du développeur)
3. Accédez à **App features** → **Bot**
4. Sélectionnez **Enter a bot ID manually** et collez votre Azure Bot App ID
5. Cochez les périmètres : **Personal**, **Team**, **Group Chat**
6. Cliquez sur **Distribute** → **Download app package**
7. Dans Teams : **Apps** → **Manage your apps** → **Upload a custom app** → sélectionnez le ZIP

C’est souvent plus simple que de modifier manuellement des manifestes JSON.

## Tester le bot

**Option A : Azure Web Chat (vérifiez d’abord le Webhook)**

1. Dans Azure Portal → votre ressource Azure Bot → **Test in Web Chat**
2. Envoyez un message — vous devriez voir une réponse
3. Cela confirme que votre point de terminaison Webhook fonctionne avant la configuration de Teams

**Option B : Teams (après installation de l’application)**

1. Installez l’application Teams (chargement local ou catalogue de l’organisation)
2. Trouvez le bot dans Teams et envoyez un message privé
3. Vérifiez les journaux de la Gateway pour l’activité entrante

## Configuration (texte uniquement, minimale)

1. **Assurez-vous que le plugin Microsoft Teams est disponible**
   - Les versions packagées actuelles d’OpenClaw l’intègrent déjà.
   - Les installations anciennes/personnalisées peuvent l’ajouter manuellement :
     - Depuis npm : `openclaw plugins install @openclaw/msteams`
     - Depuis une extraction locale : `openclaw plugins install ./path/to/local/msteams-plugin`

2. **Enregistrement du bot**
   - Créez un Azure Bot (voir ci-dessus) et notez :
     - App ID
     - Secret client (mot de passe de l’application)
     - Tenant ID (locataire unique)

3. **Manifeste de l’application Teams**
   - Incluez une entrée `bot` avec `botId = <App ID>`.
   - Périmètres : `personal`, `team`, `groupChat`.
   - `supportsFiles: true` (requis pour la gestion des fichiers dans le périmètre personnel).
   - Ajoutez les autorisations RSC (ci-dessous).
   - Créez les icônes : `outline.png` (32x32) et `color.png` (192x192).
   - Archivez ensemble les trois fichiers : `manifest.json`, `outline.png`, `color.png`.

4. **Configurer OpenClaw**

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

   Vous pouvez aussi utiliser des variables d’environnement au lieu des clés de config :
   - `MSTEAMS_APP_ID`
   - `MSTEAMS_APP_PASSWORD`
   - `MSTEAMS_TENANT_ID`
   - `MSTEAMS_AUTH_TYPE` (facultatif : `"secret"` ou `"federated"`)
   - `MSTEAMS_CERTIFICATE_PATH` (fédéré + certificat)
   - `MSTEAMS_CERTIFICATE_THUMBPRINT` (facultatif, non requis pour l’authentification)
   - `MSTEAMS_USE_MANAGED_IDENTITY` (fédéré + identité managée)
   - `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID` (MI attribuée par l’utilisateur uniquement)

5. **Point de terminaison du bot**
   - Définissez le Messaging Endpoint Azure Bot sur :
     - `https://<host>:3978/api/messages` (ou votre chemin/port choisi).

6. **Exécuter la Gateway**
   - Le canal Teams démarre automatiquement lorsque le plugin intégré ou installé manuellement est disponible et que la configuration `msteams` existe avec des identifiants.

## Action d’information sur les membres

OpenClaw expose une action `member-info` adossée à Graph pour Microsoft Teams afin que les agents et automatisations puissent résoudre directement depuis Microsoft Graph les détails des membres du canal (nom d’affichage, e-mail, rôle).

Exigences :

- Autorisation RSC `Member.Read.Group` (déjà présente dans le manifeste recommandé)
- Pour les recherches inter-équipes : autorisation d’application Graph `User.Read.All` avec consentement administrateur

L’action est contrôlée par `channels.msteams.actions.memberInfo` (par défaut : activée lorsque des identifiants Graph sont disponibles).

## Contexte d’historique

- `channels.msteams.historyLimit` contrôle combien de messages récents du canal/groupe sont intégrés dans le prompt.
- Revient à `messages.groupChat.historyLimit`. Définissez `0` pour désactiver (50 par défaut).
- L’historique de fil récupéré est filtré par les listes d’autorisation d’expéditeurs (`allowFrom` / `groupAllowFrom`), donc l’initialisation du contexte du fil n’inclut que les messages d’expéditeurs autorisés.
- Le contexte de pièce jointe citée (`ReplyTo*` dérivé du HTML de réponse Teams) est actuellement transmis tel que reçu.
- En d’autres termes, les listes d’autorisation contrôlent qui peut déclencher l’agent ; seuls certains chemins de contexte complémentaires sont filtrés aujourd’hui.
- L’historique des messages privés peut être limité avec `channels.msteams.dmHistoryLimit` (tours utilisateur). Remplacements par utilisateur : `channels.msteams.dms["<user_id>"].historyLimit`.

## Autorisations RSC Teams actuelles (manifeste)

Ce sont les **autorisations resourceSpecific existantes** dans notre manifeste d’application Teams. Elles ne s’appliquent qu’à l’intérieur de l’équipe/de la discussion où l’application est installée.

**Pour les canaux (périmètre équipe) :**

- `ChannelMessage.Read.Group` (Application) - recevoir tous les messages de canal sans @mention
- `ChannelMessage.Send.Group` (Application)
- `Member.Read.Group` (Application)
- `Owner.Read.Group` (Application)
- `ChannelSettings.Read.Group` (Application)
- `TeamMember.Read.Group` (Application)
- `TeamSettings.Read.Group` (Application)

**Pour les discussions de groupe :**

- `ChatMessage.Read.Chat` (Application) - recevoir tous les messages de discussion de groupe sans @mention

## Exemple de manifeste Teams (expurgé)

Exemple minimal et valide avec les champs requis. Remplacez les identifiants et les URL.

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

- `bots[].botId` **doit** correspondre à l’Azure Bot App ID.
- `webApplicationInfo.id` **doit** correspondre à l’Azure Bot App ID.
- `bots[].scopes` doit inclure les surfaces que vous prévoyez d’utiliser (`personal`, `team`, `groupChat`).
- `bots[].supportsFiles: true` est requis pour la gestion des fichiers dans le périmètre personnel.
- `authorization.permissions.resourceSpecific` doit inclure la lecture/l’envoi de canal si vous voulez du trafic de canal.

### Mettre à jour une application existante

Pour mettre à jour une application Teams déjà installée (par exemple, pour ajouter des autorisations RSC) :

1. Mettez à jour votre `manifest.json` avec les nouveaux paramètres
2. **Incrémentez le champ `version`** (par ex. `1.0.0` → `1.1.0`)
3. **Recréez l’archive ZIP** du manifeste avec les icônes (`manifest.json`, `outline.png`, `color.png`)
4. Téléversez le nouveau zip :
   - **Option A (Teams Admin Center) :** Teams Admin Center → Teams apps → Manage apps → trouvez votre application → Upload new version
   - **Option B (chargement local) :** dans Teams → Apps → Manage your apps → Upload a custom app
5. **Pour les canaux d’équipe :** réinstallez l’application dans chaque équipe pour que les nouvelles autorisations prennent effet
6. **Quittez complètement et relancez Teams** (pas seulement fermer la fenêtre) pour effacer les métadonnées d’application mises en cache

## Capacités : RSC uniquement vs Graph

### Avec **Teams RSC uniquement** (application installée, sans autorisations API Graph)

Fonctionne :

- Lire le contenu **texte** des messages de canal.
- Envoyer le contenu **texte** des messages de canal.
- Recevoir les pièces jointes de fichier en **personnel (DM)**.

Ne fonctionne PAS :

- Le contenu des **images ou fichiers** de canal/groupe (la charge utile n’inclut qu’un stub HTML).
- Le téléchargement des pièces jointes stockées dans SharePoint/OneDrive.
- La lecture de l’historique des messages (au-delà de l’événement Webhook en direct).

### Avec **Teams RSC + autorisations d’application Microsoft Graph**

Ajoute :

- Le téléchargement des contenus hébergés (images collées dans les messages).
- Le téléchargement des pièces jointes stockées dans SharePoint/OneDrive.
- La lecture de l’historique des messages de canal/discussion via Graph.

### RSC vs API Graph

| Capacité                | Autorisations RSC    | API Graph                           |
| ----------------------- | -------------------- | ----------------------------------- |
| **Messages en temps réel** | Oui (via Webhook) | Non (interrogation uniquement)      |
| **Messages historiques**   | Non               | Oui (peut interroger l’historique)  |
| **Complexité de configuration** | Manifeste d’application uniquement | Consentement administrateur + flux de jetons requis |
| **Fonctionne hors ligne** | Non (doit être en cours d’exécution) | Oui (interrogeable à tout moment) |

**En résumé :** RSC sert à l’écoute en temps réel ; l’API Graph sert à l’accès historique. Pour rattraper des messages manqués hors ligne, vous avez besoin de l’API Graph avec `ChannelMessage.Read.All` (nécessite le consentement administrateur).

## Médias + historique activés par Graph (requis pour les canaux)

Si vous avez besoin d’images/fichiers dans les **canaux** ou si vous voulez récupérer **l’historique des messages**, vous devez activer les autorisations Microsoft Graph et accorder le consentement administrateur.

1. Dans Entra ID (Azure AD) **App Registration**, ajoutez des **autorisations d’application** Microsoft Graph :
   - `ChannelMessage.Read.All` (pièces jointes de canal + historique)
   - `Chat.Read.All` ou `ChatMessage.Read.All` (discussions de groupe)
2. **Accordez le consentement administrateur** pour le locataire.
3. Incrémentez la **version du manifeste** de l’application Teams, téléversez-la à nouveau et **réinstallez l’application dans Teams**.
4. **Quittez complètement et relancez Teams** pour effacer les métadonnées d’application mises en cache.

**Autorisation supplémentaire pour les mentions d’utilisateurs :** les @mentions d’utilisateurs fonctionnent immédiatement pour les utilisateurs présents dans la conversation. Cependant, si vous souhaitez rechercher et mentionner dynamiquement des utilisateurs qui **ne sont pas dans la conversation actuelle**, ajoutez l’autorisation d’application `User.Read.All` et accordez le consentement administrateur.

## Limitations connues

### Délais d’expiration du Webhook

Teams transmet les messages via un Webhook HTTP. Si le traitement prend trop de temps (par ex. réponses LLM lentes), vous pouvez voir :

- Des délais d’expiration de la Gateway
- Teams réessayer le message (provoquant des doublons)
- Des réponses perdues

OpenClaw gère cela en répondant rapidement et en envoyant les réponses de manière proactive, mais des réponses très lentes peuvent toujours poser problème.

### Formatage

Le markdown Teams est plus limité que celui de Slack ou Discord :

- Le formatage de base fonctionne : **gras**, _italique_, `code`, liens
- Le markdown complexe (tableaux, listes imbriquées) peut ne pas s’afficher correctement
- Les cartes adaptatives sont prises en charge pour les sondages et les envois de présentation sémantique (voir ci-dessous)

## Configuration

Paramètres clés (voir `/gateway/configuration` pour les modèles partagés entre canaux) :

- `channels.msteams.enabled` : active/désactive le canal.
- `channels.msteams.appId`, `channels.msteams.appPassword`, `channels.msteams.tenantId` : identifiants du bot.
- `channels.msteams.webhook.port` (par défaut `3978`)
- `channels.msteams.webhook.path` (par défaut `/api/messages`)
- `channels.msteams.dmPolicy` : `pairing | allowlist | open | disabled` (par défaut : pairing)
- `channels.msteams.allowFrom` : liste d’autorisation des messages privés (identifiants d’objet AAD recommandés). L’assistant résout les noms en identifiants pendant la configuration lorsque l’accès Graph est disponible.
- `channels.msteams.dangerouslyAllowNameMatching` : option de secours pour réactiver la correspondance avec des UPN/noms d’affichage modifiables et le routage direct par nom d’équipe/canal.
- `channels.msteams.textChunkLimit` : taille des segments de texte sortants.
- `channels.msteams.chunkMode` : `length` (par défaut) ou `newline` pour découper sur les lignes vides (limites de paragraphe) avant le découpage par longueur.
- `channels.msteams.mediaAllowHosts` : liste d’autorisation des hôtes pour les pièces jointes entrantes (utilise par défaut les domaines Microsoft/Teams).
- `channels.msteams.mediaAuthAllowHosts` : liste d’autorisation pour joindre des en-têtes Authorization lors des nouvelles tentatives sur les médias (utilise par défaut les hôtes Graph + Bot Framework).
- `channels.msteams.requireMention` : exige une @mention dans les canaux/groupes (par défaut true).
- `channels.msteams.replyStyle` : `thread | top-level` (voir [Style de réponse](#reply-style-threads-vs-posts)).
- `channels.msteams.teams.<teamId>.replyStyle` : remplacement par équipe.
- `channels.msteams.teams.<teamId>.requireMention` : remplacement par équipe.
- `channels.msteams.teams.<teamId>.tools` : remplacements de stratégie d’outils par équipe par défaut (`allow`/`deny`/`alsoAllow`) utilisés lorsqu’un remplacement au niveau du canal est absent.
- `channels.msteams.teams.<teamId>.toolsBySender` : remplacements de stratégie d’outils par expéditeur par équipe par défaut (joker `"*"` pris en charge).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle` : remplacement par canal.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.requireMention` : remplacement par canal.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.tools` : remplacements de stratégie d’outils par canal (`allow`/`deny`/`alsoAllow`).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.toolsBySender` : remplacements de stratégie d’outils par expéditeur par canal (joker `"*"` pris en charge).
- Les clés `toolsBySender` doivent utiliser des préfixes explicites :
  `id:`, `e164:`, `username:`, `name:` (les anciennes clés sans préfixe continuent d’être mappées uniquement vers `id:`).
- `channels.msteams.actions.memberInfo` : active ou désactive l’action d’information sur les membres adossée à Graph (par défaut : activée lorsque des identifiants Graph sont disponibles).
- `channels.msteams.authType` : type d’authentification — `"secret"` (par défaut) ou `"federated"`.
- `channels.msteams.certificatePath` : chemin vers le fichier de certificat PEM (authentification fédérée + certificat).
- `channels.msteams.certificateThumbprint` : empreinte du certificat (facultatif, non requis pour l’authentification).
- `channels.msteams.useManagedIdentity` : active l’authentification par identité managée (mode fédéré).
- `channels.msteams.managedIdentityClientId` : identifiant client pour une identité managée attribuée par l’utilisateur.
- `channels.msteams.sharePointSiteId` : identifiant du site SharePoint pour les téléversements de fichiers dans les discussions de groupe/canaux (voir [Envoi de fichiers dans les discussions de groupe](#sending-files-in-group-chats)).

## Routage et sessions

- Les clés de session suivent le format standard des agents (voir [/concepts/session](/fr/concepts/session)) :
  - Les messages privés partagent la session principale (`agent:<agentId>:<mainKey>`).
  - Les messages de canal/groupe utilisent l’identifiant de conversation :
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## Style de réponse : fils vs publications

Teams a récemment introduit deux styles d’interface de canal au-dessus du même modèle de données sous-jacent :

| Style                   | Description                                              | `replyStyle` recommandé |
| ----------------------- | -------------------------------------------------------- | ----------------------- |
| **Posts** (classique)   | Les messages apparaissent sous forme de cartes avec des réponses en fil en dessous | `thread` (par défaut)   |
| **Threads** (type Slack) | Les messages s’enchaînent de façon linéaire, davantage comme Slack | `top-level`             |

**Le problème :** l’API Teams n’indique pas quel style d’interface un canal utilise. Si vous utilisez le mauvais `replyStyle` :

- `thread` dans un canal de style Threads → les réponses apparaissent imbriquées de manière peu naturelle
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

- **Messages privés :** les images et les pièces jointes de fichier fonctionnent via les API de fichiers du bot Teams.
- **Canaux/groupes :** les pièces jointes résident dans le stockage M365 (SharePoint/OneDrive). La charge utile du Webhook ne contient qu’un stub HTML, pas les octets réels du fichier. **Des autorisations API Graph sont requises** pour télécharger les pièces jointes de canal.
- Pour les envois explicites centrés sur les fichiers, utilisez `action=upload-file` avec `media` / `filePath` / `path` ; `message` facultatif devient le texte/commentaire d’accompagnement, et `filename` remplace le nom téléversé.

Sans autorisations Graph, les messages de canal contenant des images seront reçus en texte seul (le contenu de l’image n’est pas accessible au bot).
Par défaut, OpenClaw ne télécharge les médias que depuis des noms d’hôte Microsoft/Teams. Remplacez cela avec `channels.msteams.mediaAllowHosts` (utilisez `["*"]` pour autoriser n’importe quel hôte).
Les en-têtes Authorization ne sont joints que pour les hôtes présents dans `channels.msteams.mediaAuthAllowHosts` (Graph + hôtes Bot Framework par défaut). Gardez cette liste stricte (évitez les suffixes multi-locataires).

## Envoi de fichiers dans les discussions de groupe

Les bots peuvent envoyer des fichiers en message privé via le flux FileConsentCard (intégré). Cependant, **l’envoi de fichiers dans les discussions de groupe/canaux** nécessite une configuration supplémentaire :

| Contexte                 | Méthode d’envoi des fichiers                 | Configuration requise                              |
| ------------------------ | -------------------------------------------- | -------------------------------------------------- |
| **Messages privés**      | FileConsentCard → l’utilisateur accepte → le bot téléverse | Fonctionne immédiatement                      |
| **Discussions de groupe/canaux** | Téléversement vers SharePoint → lien de partage | Nécessite `sharePointSiteId` + autorisations Graph |
| **Images (tout contexte)** | Encodées en base64 en ligne               | Fonctionne immédiatement                           |

### Pourquoi les discussions de groupe nécessitent SharePoint

Les bots n’ont pas de lecteur OneDrive personnel (le point de terminaison Graph API `/me/drive` ne fonctionne pas pour les identités d’application). Pour envoyer des fichiers dans les discussions de groupe/canaux, le bot téléverse vers un **site SharePoint** et crée un lien de partage.

### Configuration

1. **Ajoutez des autorisations API Graph** dans Entra ID (Azure AD) → App Registration :
   - `Sites.ReadWrite.All` (Application) - téléverser des fichiers vers SharePoint
   - `Chat.Read.All` (Application) - facultatif, active les liens de partage par utilisateur

2. **Accordez le consentement administrateur** pour le locataire.

3. **Récupérez l’identifiant de votre site SharePoint :**

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

### Comportement de partage

| Autorisation                             | Comportement de partage                                  |
| ---------------------------------------- | -------------------------------------------------------- |
| `Sites.ReadWrite.All` uniquement         | Lien de partage à l’échelle de l’organisation (toute personne de l’organisation peut y accéder) |
| `Sites.ReadWrite.All` + `Chat.Read.All`  | Lien de partage par utilisateur (seuls les membres de la discussion peuvent y accéder) |

Le partage par utilisateur est plus sécurisé car seuls les participants à la discussion peuvent accéder au fichier. Si l’autorisation `Chat.Read.All` est absente, le bot revient à un partage à l’échelle de l’organisation.

### Comportement de repli

| Scénario                                          | Résultat                                           |
| ------------------------------------------------- | -------------------------------------------------- |
| Discussion de groupe + fichier + `sharePointSiteId` configuré | Téléversement vers SharePoint, envoi d’un lien de partage |
| Discussion de groupe + fichier + aucun `sharePointSiteId` | Tentative de téléversement vers OneDrive (peut échouer), envoi de texte seul |
| Discussion personnelle + fichier                  | Flux FileConsentCard (fonctionne sans SharePoint)  |
| Tout contexte + image                             | Encodage base64 en ligne (fonctionne sans SharePoint) |

### Emplacement de stockage des fichiers

Les fichiers téléversés sont stockés dans un dossier `/OpenClawShared/` dans la bibliothèque de documents par défaut du site SharePoint configuré.

## Sondages (cartes adaptatives)

OpenClaw envoie les sondages Teams sous forme de cartes adaptatives (il n’existe pas d’API de sondage native Teams).

- CLI : `openclaw message poll --channel msteams --target conversation:<id> ...`
- Les votes sont enregistrés par la Gateway dans `~/.openclaw/msteams-polls.json`.
- La Gateway doit rester en ligne pour enregistrer les votes.
- Les sondages ne publient pas encore automatiquement de résumé des résultats (inspectez le fichier de stockage si nécessaire).

## Cartes de présentation

Envoyez des charges utiles de présentation sémantique à des utilisateurs ou conversations Teams à l’aide de l’outil `message` ou de la CLI. OpenClaw les affiche sous forme de cartes adaptatives Teams à partir du contrat générique de présentation.

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

Pour les détails sur le format des cibles, voir [Formats de cible](#target-formats) ci-dessous.

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

# Envoyer à un utilisateur par nom d’affichage (déclenche une recherche API Graph)
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

Remarque : sans le préfixe `user:`, les noms utilisent par défaut la résolution de groupe/d’équipe. Utilisez toujours `user:` lorsque vous ciblez des personnes par nom d’affichage.

## Messagerie proactive

- Les messages proactifs ne sont possibles **qu’après** qu’un utilisateur a interagi, car nous stockons les références de conversation à ce moment-là.
- Voir `/gateway/configuration` pour `dmPolicy` et le contrôle par liste d’autorisation.

## Identifiants d’équipe et de canal (piège courant)

Le paramètre de requête `groupId` dans les URL Teams n’est **PAS** l’identifiant d’équipe utilisé pour la configuration. Extrayez plutôt les identifiants depuis le chemin de l’URL :

**URL d’équipe :**

```
https://teams.microsoft.com/l/team/19%3ABk4j...%40thread.tacv2/conversations?groupId=...
                                    └────────────────────────────┘
                                    Identifiant d’équipe (décoder cette URL)
```

**URL de canal :**

```
https://teams.microsoft.com/l/channel/19%3A15bc...%40thread.tacv2/ChannelName?groupId=...
                                      └─────────────────────────┘
                                      Identifiant de canal (décoder cette URL)
```

**Pour la config :**

- Identifiant d’équipe = segment du chemin après `/team/` (décodé de l’URL, par ex. `19:Bk4j...@thread.tacv2`)
- Identifiant de canal = segment du chemin après `/channel/` (décodé de l’URL)
- **Ignorez** le paramètre de requête `groupId`

## Canaux privés

Les bots ont une prise en charge limitée dans les canaux privés :

| Fonctionnalité                | Canaux standard   | Canaux privés         |
| ---------------------------- | ----------------- | --------------------- |
| Installation du bot          | Oui               | Limitée               |
| Messages en temps réel (Webhook) | Oui           | Peut ne pas fonctionner |
| Autorisations RSC            | Oui               | Peuvent se comporter différemment |
| @mentions                    | Oui               | Si le bot est accessible |
| Historique via API Graph     | Oui               | Oui (avec autorisations) |

**Solutions de contournement si les canaux privés ne fonctionnent pas :**

1. Utilisez des canaux standard pour les interactions avec le bot
2. Utilisez les messages privés — les utilisateurs peuvent toujours envoyer des messages directement au bot
3. Utilisez l’API Graph pour l’accès historique (nécessite `ChannelMessage.Read.All`)

## Dépannage

### Problèmes courants

- **Les images ne s’affichent pas dans les canaux :** il manque les autorisations Graph ou le consentement administrateur. Réinstallez l’application Teams et quittez/rouvrez complètement Teams.
- **Aucune réponse dans le canal :** les mentions sont requises par défaut ; définissez `channels.msteams.requireMention=false` ou configurez cela par équipe/canal.
- **Incompatibilité de version (Teams affiche toujours l’ancien manifeste) :** supprimez puis rajoutez l’application et quittez complètement Teams pour actualiser.
- **401 Unauthorized depuis le Webhook :** normal lors de tests manuels sans JWT Azure — cela signifie que le point de terminaison est accessible mais que l’authentification a échoué. Utilisez Azure Web Chat pour tester correctement.

### Erreurs de téléversement du manifeste

- **"Icon file cannot be empty" :** le manifeste référence des fichiers d’icône de 0 octet. Créez des icônes PNG valides (32x32 pour `outline.png`, 192x192 pour `color.png`).
- **"webApplicationInfo.Id already in use" :** l’application est encore installée dans une autre équipe/discussion. Trouvez-la et désinstallez-la d’abord, ou attendez 5 à 10 minutes pour la propagation.
- **"Something went wrong" lors du téléversement :** téléversez via [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com) à la place, ouvrez les DevTools du navigateur (F12) → onglet Network, et vérifiez le corps de la réponse pour l’erreur réelle.
- **Échec du chargement local :** essayez « Upload an app to your org's app catalog » au lieu de « Upload a custom app » — cela contourne souvent les restrictions de chargement local.

### Les autorisations RSC ne fonctionnent pas

1. Vérifiez que `webApplicationInfo.id` correspond exactement à l’App ID de votre bot
2. Téléversez à nouveau l’application et réinstallez-la dans l’équipe/la discussion
3. Vérifiez si l’administrateur de votre organisation a bloqué les autorisations RSC
4. Confirmez que vous utilisez le bon périmètre : `ChannelMessage.Read.Group` pour les équipes, `ChatMessage.Read.Chat` pour les discussions de groupe

## Références

- [Create Azure Bot](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) - guide de configuration d’Azure Bot
- [Teams Developer Portal](https://dev.teams.microsoft.com/apps) - créer/gérer des applications Teams
- [Teams app manifest schema](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [Receive channel messages with RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [RSC permissions reference](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [Teams bot file handling](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4) (canal/groupe nécessite Graph)
- [Proactive messaging](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)

## Lié

- [Aperçu des canaux](/fr/channels) — tous les canaux pris en charge
- [Appairage](/fr/channels/pairing) — authentification des messages privés et flux d’appairage
- [Groupes](/fr/channels/groups) — comportement des discussions de groupe et contrôle par mention
- [Routage des canaux](/fr/channels/channel-routing) — routage de session pour les messages
- [Sécurité](/fr/gateway/security) — modèle d’accès et durcissement
