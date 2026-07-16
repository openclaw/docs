---
read_when:
    - Travail sur les fonctionnalités du canal Microsoft Teams
summary: État de la prise en charge du bot Microsoft Teams, fonctionnalités et configuration
title: Microsoft Teams
x-i18n:
    generated_at: "2026-07-16T12:57:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: cb16cf89ed2ab7ae69389ac30e9cc32cc7d1bc2d3c6bccbd139d367380b7b32c
    source_path: channels/msteams.md
    workflow: 16
---

Statut : le texte et les pièces jointes dans les messages privés sont pris en charge ; l’envoi de fichiers dans les canaux/groupes nécessite `sharePointSiteId` ainsi que des autorisations Graph (voir [Envoi de fichiers dans les conversations de groupe](#sending-files-in-group-chats)). Les sondages sont envoyés au moyen de cartes adaptatives. Les actions de message exposent explicitement `upload-file` pour les envois où le fichier précède le texte.

## Plugin intégré

Microsoft Teams est fourni comme Plugin intégré dans les versions actuelles d’OpenClaw ; aucune installation distincte n’est requise avec la version empaquetée normale.

Sur une ancienne version ou une installation personnalisée qui exclut le Plugin Teams intégré, installez directement le paquet npm :

```bash
openclaw plugins install @openclaw/msteams
```

Utilisez le paquet sans version pour suivre l’étiquette de la version officielle actuelle. Épinglez une version exacte uniquement lorsqu’une installation reproductible est nécessaire.

Dépôt local (exécution depuis un dépôt git) :

```bash
openclaw plugins install ./path/to/local/msteams-plugin
```

Détails : [Plugins](/fr/tools/plugin)

## Configuration rapide

[`@microsoft/teams.cli`](https://www.npmjs.com/package/@microsoft/teams.cli) gère l’enregistrement du bot, la création du manifeste et la génération des identifiants en une seule commande.

**1. Installer et se connecter**

```bash
npm install -g @microsoft/teams.cli@preview
teams login
teams status   # vérifiez que vous êtes connecté et consultez les informations de votre locataire
```

<Note>
La CLI Teams est actuellement en préversion. Les commandes et les indicateurs peuvent changer d’une version à l’autre.
</Note>

**2. Démarrer un tunnel** (Teams ne peut pas accéder à localhost)

Installez et authentifiez la CLI devtunnel si nécessaire ([guide de démarrage](https://learn.microsoft.com/en-us/azure/developer/dev-tunnels/get-started)).

```bash
# Configuration unique (URL persistante entre les sessions) :
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# À chaque session de développement :
devtunnel host my-openclaw-bot
# Votre point de terminaison : https://<tunnel-id>.devtunnels.ms/api/messages
```

<Note>
`--allow-anonymous` est requis, car Teams ne peut pas s’authentifier auprès de devtunnels. Chaque requête entrante adressée au bot est néanmoins validée par le SDK Teams.
</Note>

Autres possibilités : `ngrok http 3978` ou `tailscale funnel 3978` (les URL peuvent changer à chaque session).

**3. Créer l’application**

```bash
teams app create \
  --name "OpenClaw" \
  --endpoint "https://<your-tunnel-url>/api/messages"
```

Cette commande crée une application Entra ID (Azure AD), génère un secret client, crée et téléverse un manifeste d’application Teams (avec des icônes), puis enregistre un bot géré par Teams (aucun abonnement Azure requis). La sortie comprend `CLIENT_ID`, `CLIENT_SECRET`, `TENANT_ID` et un **ID d’application Teams** ; elle propose également d’installer directement l’application dans Teams.

**4. Configurer OpenClaw** avec les identifiants fournis dans la sortie :

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

Vous pouvez aussi utiliser directement les variables d’environnement : `MSTEAMS_APP_ID`, `MSTEAMS_APP_PASSWORD`, `MSTEAMS_TENANT_ID`.

**5. Installer l’application dans Teams**

`teams app create` vous invite à installer l’application ; sélectionnez "Install in Teams". Pour obtenir ultérieurement le lien d’installation :

```bash
teams app get <teamsAppId> --install-link
```

**6. Vérifier que tout fonctionne**

```bash
teams app doctor <teamsAppId>
```

Exécute des diagnostics sur l’enregistrement du bot, la configuration de l’application AAD, la validité du manifeste et la configuration de l’authentification unique.

Pour la production, envisagez l’[authentification fédérée](#federated-authentication-certificate-plus-managed-identity) (certificat ou identité managée) plutôt que les secrets clients.

<Note>
Les conversations de groupe sont bloquées par défaut (`channels.msteams.groupPolicy: "allowlist"`). Pour autoriser les réponses de groupe, définissez `channels.msteams.groupAllowFrom`, ou utilisez `groupPolicy: "open"` pour autoriser n’importe quel membre (avec mention obligatoire).
</Note>

## Objectifs

- Communiquer avec OpenClaw par messages privés, conversations de groupe ou canaux Teams.
- Maintenir un routage déterministe : les réponses retournent toujours dans le canal dont elles proviennent.
- Appliquer par défaut un comportement sûr dans les canaux (mentions obligatoires, sauf configuration contraire).

## Écriture de la configuration

Par défaut, Microsoft Teams peut écrire les mises à jour de configuration déclenchées par `/config set|unset` (nécessite `commands.config: true`).

Pour désactiver cette fonction :

```json5
{
  channels: { msteams: { configWrites: false } },
}
```

## Contrôle d’accès (messages privés et groupes)

**Accès aux messages privés**

- Valeur par défaut : `channels.msteams.dmPolicy = "pairing"`. Les expéditeurs inconnus sont ignorés jusqu’à leur approbation.
- `channels.msteams.allowFrom` doit utiliser des ID d’objet AAD stables ou des groupes d’accès statiques d’expéditeurs tels que `accessGroup:core-team`.
- Ne vous fiez pas à la correspondance des UPN ou des noms d’affichage pour les listes d’autorisation ; ils peuvent changer. OpenClaw désactive par défaut la correspondance directe des noms ; activez-la avec `channels.msteams.dangerouslyAllowNameMatching: true`.
- L’assistant peut résoudre les noms en ID par l’intermédiaire de Microsoft Graph lorsque les identifiants le permettent.

**Accès aux groupes**

- Valeur par défaut : `channels.msteams.groupPolicy = "allowlist"` (bloqué tant que vous n’ajoutez pas `groupAllowFrom`). `channels.defaults.groupPolicy` peut remplacer la valeur par défaut partagée lorsque `channels.msteams.groupPolicy` n’est pas défini.
- `channels.msteams.groupAllowFrom` détermine quels expéditeurs ou groupes d’accès statiques d’expéditeurs peuvent déclencher des actions dans les conversations de groupe et les canaux (utilise `channels.msteams.allowFrom` comme solution de repli).
- Définissez `groupPolicy: "open"` pour autoriser n’importe quel membre (une mention reste obligatoire par défaut).
- Pour bloquer **tous** les canaux, définissez `channels.msteams.groupPolicy: "disabled"`.

Exemple :

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

**Liste d’autorisation des équipes et des canaux**

- Limitez les réponses de groupe ou de canal en répertoriant les équipes et les canaux sous `channels.msteams.teams`.
- Utilisez comme clés les ID de conversation Teams stables provenant des liens Teams, et non des noms d’affichage modifiables (voir [ID d’équipe et de canal](#team-and-channel-ids-common-gotcha)).
- Lorsque `groupPolicy="allowlist"` et une liste d’autorisation d’équipes sont présents, seules les équipes et les canaux répertoriés sont acceptés (avec mention obligatoire).
- L’assistant de configuration accepte les entrées `Team/Channel` et les enregistre pour vous.
- Au démarrage, OpenClaw résout les noms d’équipe, de canal et les noms figurant dans la liste d’autorisation des utilisateurs en ID (lorsque les autorisations Graph le permettent), puis journalise la correspondance. Les noms non résolus sont conservés tels qu’ils ont été saisis, mais ignorés pour le routage, sauf si `channels.msteams.dangerouslyAllowNameMatching: true` est défini.

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

### Fonctionnement

1. Vérifiez que le Plugin Microsoft Teams est disponible (intégré aux versions actuelles).
2. Créez un **bot Azure** (ID d’application + secret + ID de locataire).
3. Créez un **paquet d’application Teams** faisant référence au bot et comprenant les autorisations RSC ci-dessous.
4. Téléversez ou installez l’application Teams dans une équipe (ou dans l’étendue personnelle pour les messages privés).
5. Configurez `msteams` dans `~/.openclaw/openclaw.json` (ou les variables d’environnement), puis démarrez le Gateway.
6. Par défaut, le Gateway écoute le trafic Webhook de Bot Framework sur `/api/messages`.

### Étape 1 : Créer le bot Azure

1. Accédez à [Créer un bot Azure](https://portal.azure.com/#create/Microsoft.AzureBot)
2. Renseignez l’onglet **Basics** :

   | Champ              | Valeur                                                    |
   | ------------------ | -------------------------------------------------------- |
   | **Bot handle**     | Le nom de votre bot, par exemple `openclaw-msteams` (doit être unique) |
   | **Subscription**   | Sélectionnez votre abonnement Azure                           |
   | **Resource group** | Créez-en un ou utilisez-en un existant                               |
   | **Pricing tier**   | **Free** pour le développement et les tests                                 |
   | **Type of App**    | **Single Tenant** (recommandé ; voir la remarque ci-dessous)          |
   | **Creation type**  | **Create new Microsoft App ID**                          |

<Warning>
La création de nouveaux bots multilocataires est obsolète depuis le 2025-07-31. Utilisez **Single Tenant** pour les nouveaux bots.
</Warning>

3. Cliquez sur **Review + create**, puis sur **Create** (environ 1 à 2 minutes).

### Étape 2 : Obtenir les identifiants

1. Ressource Azure Bot → **Configuration** → copiez **Microsoft App ID** (votre `appId`).
2. **Manage Password** → App Registration → **Certificates & secrets** → **New client secret** → copiez la **Value** (votre `appPassword`).
3. **Overview** → copiez **Directory (tenant) ID** (votre `tenantId`).

### Étape 3 : Configurer le point de terminaison de messagerie

1. Azure Bot → **Configuration**.
2. Définissez **Messaging endpoint** :
   - Production : `https://your-domain.com/api/messages`
   - Développement local : utilisez un tunnel (voir [Développement local](#local-development-tunneling))

### Étape 4 : Activer le canal Teams

1. Azure Bot → **Channels**.
2. Cliquez sur **Microsoft Teams** → Configure → Save.
3. Acceptez les conditions d’utilisation.

### Étape 5 : Créer le manifeste de l’application Teams

- Incluez une entrée `bot` avec `botId = <App ID>`.
- Étendues : `personal`, `team`, `groupChat`.
- `supportsFiles: true` (requis pour la gestion des fichiers dans l’étendue personnelle).
- Ajoutez les autorisations RSC (voir [Autorisations RSC](#current-teams-rsc-permissions-manifest)).
- Créez les icônes : `outline.png` (32x32) et `color.png` (192x192).
- Regroupez `manifest.json`, `outline.png` et `color.png` dans une archive ZIP.

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

Le canal Teams démarre automatiquement lorsque le Plugin est disponible et que la configuration `msteams` contient des identifiants.

</details>

## Authentification fédérée (certificat et identité managée)

Pour la production, OpenClaw prend en charge l’**authentification fédérée** comme solution de remplacement des secrets clients, au moyen de `channels.msteams.authType: "federated"`. Deux méthodes sont disponibles :

### Option A : Authentification par certificat

Utilisez un certificat PEM enregistré auprès de votre inscription d’application Entra ID.

**Configuration :**

1. Générez ou obtenez un certificat (format PEM avec clé privée).
2. Entra ID → App Registration → **Certificates & secrets** → **Certificates** → téléversez le certificat public.

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

### Option B : Identité managée Azure

Utilisez une identité managée Azure pour une authentification sans mot de passe sur l’infrastructure Azure (AKS, App Service, machines virtuelles Azure).

**Fonctionnement :**

1. Le pod ou la machine virtuelle du bot dispose d’une identité managée (attribuée par le système ou par l’utilisateur).
2. Un identifiant d’identité fédérée associe l’identité managée à l’inscription d’application Entra ID.
3. À l’exécution, OpenClaw utilise `@azure/identity` pour acquérir des jetons auprès du point de terminaison Azure IMDS.
4. Le jeton est transmis au SDK Teams pour l’authentification du bot.

**Prérequis :**

- Infrastructure Azure avec identité managée activée (identité de charge de travail AKS, App Service, machine virtuelle).
- Informations d’identification d’identité fédérée créées sur l’inscription d’application Entra ID.
- Accès réseau à IMDS (`169.254.169.254:80`) depuis le pod/la machine virtuelle.

**Configuration (identité managée attribuée par le système) :**

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

**Configuration (identité managée attribuée par l’utilisateur) :** ajoutez `managedIdentityClientId: "<MI_CLIENT_ID>"` au bloc ci-dessus.

**Variables d’environnement :**

- `MSTEAMS_AUTH_TYPE=federated`
- `MSTEAMS_USE_MANAGED_IDENTITY=true`
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID=<client-id>` (uniquement pour une identité attribuée par l’utilisateur)

### Configuration de l’identité de charge de travail AKS

Pour les déploiements AKS utilisant une identité de charge de travail :

1. **Activez l’identité de charge de travail** sur votre cluster AKS.
2. **Créez des informations d’identification d’identité fédérée** sur l’inscription d’application Entra ID :

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

5. **Autorisez l’accès réseau** à IMDS (`169.254.169.254`) : si vous utilisez NetworkPolicy, ajoutez une règle de trafic sortant pour `169.254.169.254/32` sur le port 80.

### Comparaison des types d’authentification

| Méthode                       | Configuration                                  | Avantages                                  | Inconvénients                                             |
| ----------------------------- | ---------------------------------------------- | ------------------------------------------ | --------------------------------------------------------- |
| **Secret client**             | `appPassword`                             | Configuration simple                       | Rotation du secret requise, sécurité moindre              |
| **Certificat**                | `authType: "federated"` + `certificatePath`        | Aucun secret partagé transmis sur le réseau | Surcharge liée à la gestion des certificats               |
| **Identité managée**          | `authType: "federated"` + `useManagedIdentity`        | Sans mot de passe, aucun secret à gérer    | Infrastructure Azure requise                              |

`certificateThumbprint` peut être défini avec `certificatePath`, mais n’est actuellement pas lu par le chemin d’authentification ; il est accepté uniquement à des fins de compatibilité future.

**Valeur par défaut :** lorsque `authType` n’est pas défini, OpenClaw utilise l’authentification par secret client (`appPassword`). Les configurations existantes continuent de fonctionner sans modification.

## Développement local (tunnel)

Teams ne peut pas atteindre `localhost`. Utilisez un tunnel de développement persistant afin que l’URL reste stable d’une session à l’autre :

```bash
# Configuration initiale :
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# À chaque session de développement :
devtunnel host my-openclaw-bot
```

Autres possibilités : `ngrok http 3978` ou `tailscale funnel 3978` (les URL peuvent changer à chaque session).

Si l’URL du tunnel change, mettez à jour le point de terminaison :

```bash
teams app update <teamsAppId> --endpoint "https://<new-url>/api/messages"
```

## Test du bot

**Exécutez les diagnostics :**

```bash
teams app doctor <teamsAppId>
```

Vérifie en une seule opération l’inscription du bot, l’application AAD, le manifeste et la configuration SSO.

**Envoyez un message de test :**

1. Installez l’application Teams (lien d’installation depuis `teams app get <id> --install-link`).
2. Trouvez le bot dans Teams et envoyez-lui un message privé.
3. Consultez les journaux du Gateway pour vérifier l’activité entrante.

## Variables d’environnement

Ces clés de configuration liées à l’authentification peuvent être définies au moyen de variables d’environnement plutôt que dans `openclaw.json` (les autres clés de configuration, telles que `groupPolicy` ou `historyLimit`, ne peuvent être définies que dans la configuration) :

| Variable d’environnement              | Clé de configuration      | Remarques                                      |
| ------------------------------------- | ------------------------- | ---------------------------------------------- |
| `MSTEAMS_APP_ID`                    | `appId`        |                                                |
| `MSTEAMS_APP_PASSWORD`                    | `appPassword`        |                                                |
| `MSTEAMS_TENANT_ID`                    | `tenantId`        |                                                |
| `MSTEAMS_AUTH_TYPE`                    | `authType`        | `"secret"` ou `"federated"`       |
| `MSTEAMS_CERTIFICATE_PATH`                    | `certificatePath`        | fédérée + certificat                           |
| `MSTEAMS_CERTIFICATE_THUMBPRINT`                    | `certificateThumbprint`        | acceptée, non requise pour l’authentification  |
| `MSTEAMS_USE_MANAGED_IDENTITY`                    | `useManagedIdentity`        | fédérée + identité managée                     |
| `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID`                    | `managedIdentityClientId`        | identité managée attribuée par l’utilisateur uniquement |

## Action d’informations sur les membres

OpenClaw expose une action `member-info` reposant sur Graph pour Microsoft Teams, afin que les agents et les automatisations puissent obtenir des informations vérifiées sur les membres d’une conversation configurée.

Exigences :

- Autorisations RSC `ChannelSettings.Read.Group` et `TeamMember.Read.Group` (déjà incluses dans le manifeste recommandé).

L’action est disponible dès que les informations d’identification Graph sont configurées ; il n’existe pas de commutateur `channels.msteams.actions.memberInfo` distinct.
Les recherches dans les canaux standard renvoient l’identité correspondante dans la liste des membres de l’équipe, le nom d’affichage, l’adresse e-mail et les rôles.
Dans le message privé ou la conversation de groupe en cours, l’action peut renvoyer l’ID utilisateur stable de l’expéditeur approuvé.
Les recherches de membres dans les canaux privés/partagés et dans les conversations autres que celle en cours nécessitent des autorisations supplémentaires d’accès à la liste des membres
et sont rejetées par l’ensemble d’autorisations par défaut.

## Contexte de l’historique

- `channels.msteams.historyLimit` détermine combien de messages récents d’un canal ou d’un groupe sont intégrés à l’invite. À défaut, `messages.groupChat.historyLimit` est utilisé, puis la valeur par défaut est 50. Définissez `0` pour désactiver cette fonction.
- L’historique de fil récupéré est filtré selon les listes d’expéditeurs autorisés (`allowFrom` / `groupAllowFrom`) ; l’initialisation du contexte du fil n’inclut donc que les messages provenant d’expéditeurs autorisés.
- Le contexte des pièces jointes citées (analysé depuis le HTML conforme au schéma Skype Reply dans les pièces jointes propres à une réponse) est transmis sans filtrage ; actuellement, seule l’initialisation par l’historique du fil applique le filtre de la liste des expéditeurs autorisés.
- L’historique des messages privés peut être limité avec `channels.msteams.dmHistoryLimit` (tours de l’utilisateur). Remplacements par utilisateur : `channels.msteams.dms["<user_id>"].historyLimit`.

## Autorisations RSC Teams actuelles (manifeste)

Voici les **autorisations resourceSpecific existantes** dans le manifeste de notre application Teams. Elles s’appliquent uniquement au sein de l’équipe ou de la conversation dans laquelle l’application est installée.

**Pour les canaux (portée équipe) :**

- `ChannelMessage.Read.Group` (Application) - recevoir tous les messages du canal sans @mention
- `ChannelMessage.Send.Group` (Application)
- `Member.Read.Group` (Application)
- `Owner.Read.Group` (Application)
- `ChannelSettings.Read.Group` (Application)
- `TeamMember.Read.Group` (Application)
- `TeamSettings.Read.Group` (Application)

**Pour les conversations de groupe :**

- `ChatMessage.Read.Chat` (Application) - recevoir tous les messages de la conversation de groupe sans @mention

Ajoutez des autorisations RSC via la CLI Teams :

```bash
teams app rsc add <teamsAppId> ChannelMessage.Read.Group --type Application
```

## Exemple de manifeste Teams (expurgé)

Exemple minimal et valide contenant les champs obligatoires. Remplacez les ID et les URL.

```json5
{
  $schema: "https://developer.microsoft.com/en-us/json-schemas/teams/v1.23/MicrosoftTeams.schema.json",
  manifestVersion: "1.23",
  version: "1.0.0",
  id: "00000000-0000-0000-0000-000000000000",
  name: { short: "OpenClaw" },
  developer: {
    name: "Votre organisation",
    websiteUrl: "https://example.com",
    privacyUrl: "https://example.com/privacy",
    termsOfUseUrl: "https://example.com/terms",
  },
  description: { short: "OpenClaw dans Teams", full: "OpenClaw dans Teams" },
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

### Points d’attention concernant le manifeste (champs obligatoires)

- `bots[].botId` **doit** correspondre à l’ID d’application Azure Bot.
- `webApplicationInfo.id` **doit** correspondre à l’ID d’application Azure Bot.
- `bots[].scopes` doit inclure les surfaces que vous prévoyez d’utiliser (`personal`, `team`, `groupChat`).
- `bots[].supportsFiles: true` est requis pour la gestion des fichiers dans la portée personnelle.
- `authorization.permissions.resourceSpecific` doit inclure la lecture et l’envoi dans les canaux pour le trafic des canaux.

### Mise à jour d’une application existante

```bash
# Téléchargez, modifiez et téléversez à nouveau le manifeste
teams app manifest download <teamsAppId> manifest.json
# Modifiez manifest.json localement...
teams app manifest upload manifest.json <teamsAppId>
# La version est incrémentée automatiquement si le contenu a changé
```

Après la mise à jour, réinstallez l’application dans chaque équipe et **quittez complètement Teams, puis relancez-le** (ne vous contentez pas de fermer la fenêtre) afin d’effacer les métadonnées d’application mises en cache.

<details>
<summary>Mise à jour manuelle du manifeste (sans CLI)</summary>

1. Mettez à jour `manifest.json` avec les nouveaux paramètres.
2. **Incrémentez le champ `version`** (par exemple, `1.0.0` → `1.1.0`).
3. **Recréez l’archive ZIP** du manifeste avec les icônes (`manifest.json`, `outline.png`, `color.png`).
4. Téléversez la nouvelle archive ZIP :
   - **Teams Admin Center :** Teams apps → Manage apps → find your app → Upload new version.
   - **Chargement indépendant :** Teams → Apps → Manage your apps → Upload a custom app.

</details>

## Fonctionnalités : RSC uniquement ou Graph

### Avec **Teams RSC uniquement** (application installée, aucune autorisation d’API Graph)

Fonctionne :

- Lire le contenu **textuel** des messages de canal.
- Envoyer du contenu **textuel** dans les messages de canal.
- Recevoir des pièces jointes dans les **messages personnels (privés)**.

Ne fonctionne PAS :

- Contenu des **images ou fichiers** de canal/groupe (la charge utile ne contient qu’un fragment HTML).
- Téléchargement des pièces jointes stockées dans SharePoint/OneDrive.
- Lecture de l’historique des messages au-delà de l’événement Webhook en direct.

### Avec **Teams RSC + autorisations d’application Microsoft Graph**

Ajoute :

- Téléchargement du contenu hébergé (images collées dans les messages).
- Téléchargement des pièces jointes stockées dans SharePoint/OneDrive.
- Lecture de l’historique des messages de canal/conversation via Graph.

### RSC ou API Graph

| Fonctionnalité              | Autorisations RSC      | API Graph                                      |
| --------------------------- | ---------------------- | ---------------------------------------------- |
| **Messages en temps réel**  | Oui (via Webhook)      | Non (interrogation périodique uniquement)      |
| **Messages historiques**    | Non                    | Oui (permet d’interroger l’historique)         |
| **Complexité de la configuration** | Manifeste d’application uniquement | Nécessite le consentement de l’administrateur + un flux de jeton |
| **Fonctionne hors ligne**   | Non (doit être en cours d’exécution) | Oui (interrogation à tout moment)               |

**En bref :** RSC sert à l’écoute en temps réel ; l’API Graph sert à l’accès à l’historique. Pour récupérer les messages manqués pendant une période hors ligne, l’API Graph avec `ChannelMessage.Read.All` est nécessaire (requiert le consentement de l’administrateur).

## Médias et historique avec Graph

Activez uniquement les autorisations d’application Microsoft Graph nécessaires aux étendues Teams et aux données utilisées :

1. Entra ID (Azure AD) **App Registration** → ajoutez les **Application permissions** Graph :
   - `ChannelMessage.Read.All` pour les pièces jointes et l’historique des canaux.
   - `Chat.Read.All` pour les pièces jointes et l’historique des conversations de groupe.
   - `Files.Read.All` lorsque les octets des pièces jointes doivent être téléchargés depuis le stockage SharePoint/OneDrive ; les configurations limitées à l’historique n’en ont pas besoin.
2. **Grant admin consent** pour le locataire.
3. Incrémentez la **version du manifeste** de l’application Teams, téléversez-la à nouveau et **réinstallez l’application dans Teams**.
4. **Quittez complètement Teams et relancez-le** pour effacer les métadonnées d’application mises en cache.

### Récupération des fichiers de canal/groupe (`graphMediaFallback`)

Teams peut supprimer les marqueurs de fichiers de l’activité HTML envoyée à un bot. Dans ce cas, l’activité Bot Framework ne peut pas être distinguée d’un message HTML ordinaire ; la référence complète de la pièce jointe n’existe que dans la copie Graph du message.

Activez la solution de repli après avoir accordé les autorisations ci-dessus :

```json5
{
  channels: {
    msteams: {
      graphMediaFallback: true,
    },
  },
}
```

Cela s’applique uniquement aux canaux et aux conversations de groupe. Une recherche de message Graph supplémentaire est effectuée chaque fois qu’une activité HTML ne produit aucun média directement téléchargeable, y compris pour les messages ordinaires ou contenant uniquement une mention. La valeur par défaut est `false` afin que les installations existantes ne génèrent pas automatiquement de trafic Graph supplémentaire ni d’erreurs d’autorisation.

**Mentions d’utilisateurs :** les @mentions fonctionnent sans configuration pour les utilisateurs déjà présents dans la conversation. Pour rechercher et mentionner dynamiquement des utilisateurs **absents de la conversation actuelle**, ajoutez l’autorisation `User.Read.All` (Application) et accordez le consentement de l’administrateur.

## Limitations connues

### Délais d’expiration des Webhooks

Teams transmet les messages via un Webhook HTTP. OpenClaw applique des délais d’expiration fixes du serveur HTTP à l’écouteur de ce Webhook : 30 s d’inactivité, 30 s pour la requête totale et 15 s pour recevoir les en-têtes. L’enrichissement facultatif des médias entrants et du contexte dispose d’un budget partagé de 10 secondes, mais le SDK Teams attend toujours la fin du tour de l’agent avant de renvoyer la réponse du Webhook. Si le tour complet dépasse la fenêtre de nouvelle tentative de Teams, les comportements suivants peuvent se produire :

- Teams tente à nouveau d’envoyer le message (ce qui crée des doublons).
- Des réponses sont abandonnées.

Les réponses sont envoyées de manière proactive lorsque l’agent répond, mais les exécutions lentes de l’agent peuvent tout de même entraîner des nouvelles tentatives ou des doublons côté Teams.

### Prise en charge du cloud Teams et de l’URL de service

Ce chemin Teams reposant sur le SDK est validé en conditions réelles pour le cloud public Microsoft Teams.

Les réponses entrantes utilisent le contexte de tour du SDK Teams entrant. Les opérations proactives hors contexte — envois, modifications, suppressions, cartes, sondages, messages de consentement aux fichiers et réponses différées de longue durée — utilisent la référence de conversation stockée `serviceUrl`. Par défaut, le cloud public utilise l’environnement de cloud public du SDK Teams et autorise les références stockées sur l’hôte public Teams Connector : `https://smba.trafficmanager.net/`.

Le cloud public est utilisé par défaut. Il n’est pas nécessaire de définir `channels.msteams.cloud` ou `channels.msteams.serviceUrl` pour les bots ordinaires du cloud public.

Pour les clouds Teams non publics, définissez `cloud` et la limite proactive correspondante lorsque Microsoft en publie une :

- `channels.msteams.cloud` sélectionne le préréglage de cloud du SDK Teams pour l’authentification, la validation JWT, les services de jetons et l’étendue Graph.
- `channels.msteams.serviceUrl` sélectionne la limite du point de terminaison Bot Connector utilisée pour valider les références de conversation stockées avant les envois, modifications, suppressions, cartes, sondages, messages de consentement aux fichiers et réponses différées de longue durée proactifs. Elle est requise pour les clouds SDK USGov et DoD. Pour la Chine/21Vianet, OpenClaw utilise le préréglage SDK `China` et accepte les URL de service stockées/configurées uniquement sur les hôtes de canaux Azure China Bot Framework.

Microsoft publie les points de terminaison Bot Connector proactifs globaux dans la section [Créer la conversation](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages?tabs=dotnet#create-the-conversation) de la documentation sur la messagerie proactive Teams. Utilisez le `serviceUrl` de l’activité entrante lorsqu’il est disponible ; sinon, utilisez le tableau de Microsoft ci-dessous.

| Environnement Teams | Configuration OpenClaw                                      | `serviceUrl` proactif                             |
| ------------------- | ----------------------------------------------------------- | ------------------------------------------------------- |
| Public              | aucune configuration de cloud/serviceUrl nécessaire         | `https://smba.trafficmanager.net/teams`                                      |
| GCC                 | définissez `serviceUrl` ; aucun préréglage de cloud SDK Teams distinct n’existe | `https://smba.infra.gcc.teams.microsoft.com/teams` |
| GCC High            | `cloud: "USGov"` + `serviceUrl`                     | `https://smba.infra.gov.teams.microsoft.us/teams`                                      |
| DoD                 | `cloud: "USGovDoD"` + `serviceUrl`                     | `https://smba.infra.dod.teams.microsoft.us/teams`                                      |
| Chine/21Vianet      | `cloud: "China"`                                           | utilisez le `serviceUrl` de l’activité entrante   |

Exemple pour GCC, où Microsoft documente une URL de service proactive distincte, mais où le SDK Teams ne fournit aucun préréglage de cloud GCC distinct :

```json
{
  "channels": {
    "msteams": {
      "serviceUrl": "https://smba.infra.gcc.teams.microsoft.com/teams"
    }
  }
}
```

Exemple pour GCC High :

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

`channels.msteams.serviceUrl` est limité aux hôtes Microsoft Teams Bot Connector pris en charge. Lorsqu’une URL de service est configurée, OpenClaw vérifie que le `serviceUrl` de la conversation stockée utilise le même hôte avant l’exécution des envois, modifications, suppressions, cartes, sondages ou réponses différées de longue durée proactifs. Avec la configuration par défaut du cloud public, OpenClaw bloque l’opération si une conversation stockée pointe en dehors de l’hôte public Teams Connector. Après avoir modifié les paramètres du cloud ou de l’URL de service, recevez un nouveau message de la conversation afin d’actualiser la référence de conversation stockée.

La Chine/21Vianet ne dispose d’aucune URL `smba` proactive globale distincte dans le tableau des points de terminaison proactifs Teams de Microsoft. Configurez `cloud: "China"` afin que le SDK Teams utilise les points de terminaison d’authentification, de jetons et JWT d’Azure China. Les envois proactifs nécessitent alors une référence de conversation stockée provenant d’une activité Teams Chine entrante, ou une URL de service explicitement configurée, sur la limite des canaux Azure China Bot Framework (`*.botframework.azure.cn`). Les assistants Teams reposant sur Graph sont désactivés pour `cloud: "China"` jusqu’à ce qu’OpenClaw achemine les requêtes Graph via le point de terminaison Graph d’Azure China.

### Mise en forme

Le Markdown de Teams est plus limité que celui de Slack ou Discord :

- La mise en forme de base fonctionne : **gras**, _italique_, `code`, liens.
- Le Markdown complexe (tableaux, listes imbriquées) peut ne pas s’afficher correctement.
- Les cartes adaptatives sont prises en charge pour les sondages et les envois de présentations sémantiques (voir ci-dessous).

## Configuration

Paramètres principaux (consultez [/gateway/configuration](/fr/gateway/configuration) pour les modèles communs aux canaux) :

- `channels.msteams.enabled` : activer/désactiver le canal.
- `channels.msteams.appId`, `channels.msteams.appPassword`, `channels.msteams.tenantId` : identifiants du bot.
- `channels.msteams.cloud` : environnement cloud du SDK Teams (`Public`, `USGov`, `USGovDoD` ou `China` ; valeur par défaut : `Public`). Définissez-le avec `serviceUrl` pour les clouds SDK USGov/DoD ; la Chine utilise le préréglage du SDK et les références de conversation Azure China Bot Framework stockées, tandis que les assistants reposant sur Graph sont désactivés jusqu’à la disponibilité du routage Azure China Graph.
- `channels.msteams.serviceUrl` : limite d’URL du service Bot Connector pour les opérations proactives du SDK. Le cloud public utilise la valeur par défaut du SDK ; définissez-la pour GCC (`https://smba.infra.gcc.teams.microsoft.com/teams`), GCC High ou DoD. La Chine accepte les hôtes de canaux Azure China Bot Framework lorsque la référence de conversation stockée provient de Teams exploité par 21Vianet.
- `channels.msteams.webhook.port` (valeur par défaut : `3978`).
- `channels.msteams.webhook.path` (valeur par défaut : `/api/messages`).
- `channels.msteams.dmPolicy` : `pairing | allowlist | open | disabled` (valeur par défaut : `pairing`).
- `channels.msteams.allowFrom` : liste d’autorisation des messages privés (identifiants d’objet AAD recommandés). L’assistant résout les noms en identifiants pendant la configuration lorsque l’accès à Graph est disponible.
- `channels.msteams.dangerouslyAllowNameMatching` : option de dernier recours permettant de réactiver la correspondance modifiable des UPN/noms d’affichage et le routage direct par nom d’équipe/de canal.
- `channels.msteams.textChunkLimit` : taille des segments de texte sortant en caractères (valeur par défaut : `4000`, avec un plafond strict de `4000`, même si une valeur supérieure est configurée).
- `channels.msteams.streaming.chunkMode` : `length` (valeur par défaut) ou `newline` pour segmenter d’abord au niveau des lignes vides (limites de paragraphes), avant la segmentation selon la longueur.
- `channels.msteams.mediaAllowHosts` : liste d’autorisation des hôtes de pièces jointes entrantes (par défaut, les domaines Microsoft/Teams : Graph, SharePoint/OneDrive, CDN Teams, Bot Framework et Azure Media Services).
- `channels.msteams.mediaAuthAllowHosts` : liste d’autorisation pour joindre les en-têtes Authorization lors des nouvelles tentatives de récupération de médias (par défaut, les hôtes Graph et Bot Framework).
- `channels.msteams.graphMediaFallback` : activer les recherches de messages Graph lorsque le HTML d’un canal/groupe omet les marqueurs de fichiers (valeur par défaut : `false` ; voir [Récupération des fichiers de canal/groupe](#channelgroup-file-recovery-graphmediafallback)).
- `channels.msteams.mediaMaxMb` : remplacement par canal de la limite de taille des médias en Mo. Utilise `agents.defaults.mediaMaxMb` si aucune valeur n’est définie.
- `channels.msteams.requireMention` : exiger une @mention dans les canaux/groupes (valeur par défaut : `true`).
- `channels.msteams.replyStyle` : `thread | top-level` (voir [Style de réponse](#reply-style-threads-vs-posts)).
- `channels.msteams.teams.<teamId>.replyStyle` : remplacement par équipe.
- `channels.msteams.teams.<teamId>.requireMention` : remplacement par équipe.
- `channels.msteams.teams.<teamId>.tools` : remplacements par défaut de la stratégie d’outils par équipe (`allow`/`deny`/`alsoAllow`), utilisés lorsqu’aucun remplacement de canal n’est défini.
- `channels.msteams.teams.<teamId>.toolsBySender` : remplacements par défaut de la stratégie d’outils par équipe et par expéditeur (caractère générique `"*"` pris en charge).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle` : remplacement par canal.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.requireMention` : remplacement par canal.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.tools` : remplacements de la stratégie d’outils par canal (`allow`/`deny`/`alsoAllow`).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.toolsBySender` : remplacements de la stratégie d’outils par canal et par expéditeur (caractère générique `"*"` pris en charge).
- Les clés `toolsBySender` doivent utiliser des préfixes explicites : `channel:`, `id:`, `e164:`, `username:`, `name:` (les anciennes clés sans préfixe correspondent toujours uniquement à `id:`).
- `channels.msteams.authType` : type d’authentification — `"secret"` (valeur par défaut) ou `"federated"`.
- `channels.msteams.certificatePath` : chemin vers le fichier de certificat PEM (authentification fédérée + certificat).
- `channels.msteams.certificateThumbprint` : empreinte du certificat ; acceptée, mais non requise pour l’authentification.
- `channels.msteams.useManagedIdentity` : activer l’authentification par identité managée (mode fédéré).
- `channels.msteams.managedIdentityClientId` : identifiant client de l’identité managée attribuée par l’utilisateur.
- `channels.msteams.sharePointSiteId` : identifiant du site SharePoint pour les téléversements de fichiers dans les conversations de groupe/canaux (voir [Envoi de fichiers dans les conversations de groupe](#sending-files-in-group-chats)).
- `channels.msteams.welcomeCard`, `channels.msteams.groupWelcomeCard`, `channels.msteams.promptStarters` : carte adaptative de bienvenue affichée lors du premier contact par message privé/groupe, ainsi que ses boutons de suggestions d’invites.
- `channels.msteams.responsePrefix` : texte ajouté au début des réponses sortantes.
- `channels.msteams.feedbackEnabled` (valeur par défaut : `true`), `channels.msteams.feedbackReflection` (valeur par défaut : `true`), `channels.msteams.feedbackReflectionCooldownMs` : évaluations positives/négatives des réponses et suivi de réflexion après une évaluation négative.
- `channels.msteams.sso`, `channels.msteams.delegatedAuth` : connexion OAuth Bot Framework et étendues Graph déléguées pour les flux reposant sur l’authentification unique ; `sso.enabled: true` nécessite `sso.connectionName`.

## Routage et sessions

- Les clés de session suivent le format standard des agents (voir [/concepts/session](/fr/concepts/session)) :
  - Les messages privés partagent la session principale (`agent:<agentId>:<mainKey>`).
  - Les messages de canal/groupe utilisent l’identifiant de conversation :
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## Style de réponse : fils de discussion ou publications

Teams propose deux styles d’interface de canal reposant sur le même modèle de données sous-jacent :

| Style                              | Description                                                              | `replyStyle` recommandé |
| ---------------------------------- | ------------------------------------------------------------------------ | ----------------------------- |
| **Publications** (classique)       | Les messages apparaissent sous forme de cartes avec les réponses en dessous dans un fil | `thread` (valeur par défaut) |
| **Fils de discussion** (type Slack) | Les messages se suivent linéairement, comme dans Slack                   | `top-level`             |

**Le problème :** l’API Teams n’indique pas le style d’interface utilisé par un canal. Si vous utilisez le mauvais `replyStyle` :

- `thread` dans un canal de type Fils de discussion → les réponses apparaissent imbriquées de manière maladroite.
- `top-level` dans un canal de type Publications → les réponses apparaissent comme des publications de premier niveau distinctes plutôt que dans le fil.

**Solution :** configurez `replyStyle` pour chaque canal selon sa configuration :

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

### Ordre de priorité de résolution

Lorsque le bot envoie une réponse dans un canal, `replyStyle` est résolu en partant du remplacement le plus spécifique jusqu’à la valeur par défaut. La première valeur différente de `undefined` l’emporte :

1. **Par canal** — `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`
2. **Par équipe** — `channels.msteams.teams.<teamId>.replyStyle`
3. **Global** — `channels.msteams.replyStyle`
4. **Valeur par défaut implicite** — dérivée de `requireMention` :
   - `requireMention: true` → `thread`
   - `requireMention: false` → `top-level`

Si vous définissez globalement `requireMention: false` sans `replyStyle` explicite, les mentions dans les canaux de type Publications apparaissent comme des publications de premier niveau, même lorsque le message entrant était une réponse dans un fil. Fixez `replyStyle: "thread"` au niveau global, de l’équipe ou du canal pour éviter les surprises.

Pour les envois proactifs dans une conversation de canal stockée (réponses aux appels d’outils mises en file d’attente, agents de longue durée), la même résolution équipe/canal s’applique ; pour les envois proactifs, les conversations de groupe et personnelles (messages privés) sont toujours résolues en `top-level`, quelle que soit la valeur de `replyStyle`.

### Préservation du contexte du fil de discussion

Lorsque `replyStyle: "thread"` s’applique et que le bot a été @mentionné depuis un fil de discussion de canal, OpenClaw rattache la racine du fil d’origine à la référence de conversation sortante (`19:...@thread.tacv2;messageid=<root>`) afin que la réponse soit publiée dans le même fil. Cela vaut aussi bien pour les envois en direct (pendant le tour) que pour les envois proactifs effectués après l’expiration du contexte de tour Bot Framework (par exemple, agents de longue durée, réponses aux appels d’outils mises en file d’attente via `mcp__openclaw__message`).

La racine du fil provient de la valeur `threadId` stockée dans la référence de conversation. Les anciennes références stockées antérieures à `threadId` utilisent à défaut `activityId` (l’activité entrante ayant initialisé la conversation en dernier), afin que les déploiements existants continuent de fonctionner sans nouvelle initialisation.

Lorsque `replyStyle: "top-level"` s’applique, les messages entrants d’un fil de canal reçoivent intentionnellement une réponse sous forme de nouvelle publication de premier niveau ; aucun suffixe de fil n’est joint. Ce comportement est correct pour les canaux de type Fils de discussion ; si des publications de premier niveau apparaissent alors que vous attendiez des réponses dans un fil, `replyStyle` est mal configuré pour ce canal.

## Pièces jointes et images

**Limitations actuelles :**

- **Messages privés :** les images et pièces jointes fonctionnent via les API de fichiers des bots Teams.
- **Canaux/groupes :** les pièces jointes résident dans le stockage M365 (SharePoint/OneDrive). La charge utile du Webhook ne contient qu’un fragment HTML, pas les octets réels du fichier. **Des autorisations d’API Graph sont requises** pour télécharger les pièces jointes des canaux.
- Pour les envois explicites où le fichier précède le texte, utilisez `action=upload-file` avec `media` / `filePath` / `path` ; la valeur facultative `message` devient le texte/commentaire d’accompagnement, et `filename` (ou `title`) remplace le nom du fichier téléversé.

Sans autorisations Graph, les messages de canal contenant des images sont reçus sous forme de texte uniquement (le contenu de l’image n’est pas accessible au bot).
Par défaut, OpenClaw télécharge uniquement les médias provenant de noms d’hôte Microsoft/Teams. Remplacez ce comportement avec `channels.msteams.mediaAllowHosts` (utilisez `["*"]` pour autoriser tous les hôtes).
Les en-têtes Authorization ne sont joints que pour les hôtes répertoriés dans `channels.msteams.mediaAuthAllowHosts` (par défaut, les hôtes Graph et Bot Framework). Maintenez cette liste stricte (évitez les suffixes mutualisés).

## Envoi de fichiers dans les conversations de groupe

Les bots peuvent envoyer des fichiers dans les messages privés à l’aide du flux FileConsentCard intégré. **L’envoi de fichiers dans les conversations de groupe/canaux** nécessite une configuration supplémentaire :

| Contexte                       | Mode d’envoi des fichiers                                  | Configuration requise                                      |
| ------------------------------ | ---------------------------------------------------------- | ---------------------------------------------------------- |
| **Messages privés**            | FileConsentCard → l’utilisateur accepte → le bot téléverse | Fonctionne sans configuration supplémentaire               |
| **Conversations de groupe/canaux** | Téléversement vers SharePoint → carte de fichier native    | Nécessite `sharePointSiteId` + des autorisations Graph     |
| **Images (tout contexte)**     | Intégrées et encodées en Base64                            | Fonctionne sans configuration supplémentaire               |

### Pourquoi les conversations de groupe nécessitent SharePoint

Les bots utilisent une identité d’application, tandis que la ressource `/me` de Microsoft Graph [nécessite un utilisateur connecté](https://learn.microsoft.com/en-us/graph/api/user-get?view=graph-rest-1.0). Pour envoyer des fichiers dans les conversations de groupe/canaux, le bot les téléverse vers un **site SharePoint** et crée un lien de partage.

### Configuration

1. **Ajoutez les autorisations d’API Graph** dans Entra ID (Azure AD) → App Registration :
   - `Sites.ReadWrite.All` (Application) — téléverser des fichiers vers SharePoint.
   - `ChatMember.Read.All` (Application) — autorisation à l’échelle du locataire avec privilèges minimaux pour l’envoi de fichiers dans les conversations de groupe. `Chat.Read.All` fonctionne également et couvre déjà ce besoin lorsque l’historique des conversations de groupe est activé. Comme solution de remplacement par conversation, utilisez l’[autorisation de consentement spécifique à une ressource](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent) `ChatMember.Read.Chat`.
2. **Accordez le consentement administrateur** pour le locataire.
3. **Obtenez l’identifiant de votre site SharePoint :**

   ```bash
   # Via Graph Explorer ou curl avec un jeton valide :
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/{hostname}:/{site-path}"

   # Exemple : pour un site à l’adresse "contoso.sharepoint.com/sites/BotFiles"
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com:/sites/BotFiles"

   # La réponse comprend : "id": "contoso.sharepoint.com,guid1,guid2"
   ```

4. **Configurer OpenClaw :**

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

| Contexte et autorisation                                                | Comportement du partage                                             |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Canal + `Sites.ReadWrite.All`                                         | Lien de partage à l’échelle de l’organisation (toute personne de l’organisation peut y accéder) |
| Discussion de groupe + `Sites.ReadWrite.All` + une autorisation de lecture des membres de la discussion prise en charge | Lien de partage par utilisateur (seuls les membres de la discussion peuvent y accéder) |
| Discussion de groupe sans autorisation de lecture des membres de la discussion prise en charge | L’envoi échoue de manière sécurisée                                 |

Le partage par utilisateur est plus sécurisé, car seuls les participants à la discussion peuvent accéder au fichier. OpenClaw exige que la recherche des membres aboutisse pour les discussions de groupe ; les expirations de délai, les échecs de transport, les résultats vides et les refus de l’API Graph font échouer l’envoi au lieu d’étendre l’accès à l’organisation.

### Comportement de repli

| Scénario                                                         | Résultat                                           |
| ---------------------------------------------------------------- | -------------------------------------------------- |
| Discussion de groupe + fichier + autorisations SharePoint et des membres configurées | Téléversement vers SharePoint, envoi d’une carte de fichier native |
| Discussion de groupe + fichier + autorisations SharePoint ou des membres manquantes | Échec avec une erreur de configuration exploitable |
| Canal + fichier + `sharePointSiteId` configuré                   | Téléversement vers SharePoint, envoi d’une carte de fichier native |
| Discussion personnelle + fichier                                | Flux FileConsentCard (fonctionne sans SharePoint)  |
| Tout contexte + image                                           | Intégration encodée en Base64 (fonctionne sans SharePoint) |

### Emplacement de stockage des fichiers

Les fichiers téléversés sont stockés dans un dossier `/OpenClawShared/` de la bibliothèque de documents par défaut du site SharePoint configuré.

## Sondages (cartes adaptatives)

OpenClaw envoie les sondages Teams sous forme de cartes adaptatives (il n’existe aucune API de sondage Teams native).

- CLI : `openclaw message poll --channel msteams --target conversation:<id> --poll-question "..." --poll-option "..." --poll-option "..."`.
- Les votes sont enregistrés par le Gateway dans la base SQLite d’état du Plugin OpenClaw sous `state/openclaw.sqlite`.
- Les fichiers `msteams-polls.json` existants sont importés par `openclaw doctor --fix`, et non par le Plugin en cours d’exécution.
- Le Gateway doit rester en ligne pour enregistrer les votes.
- Les sondages ne publient pas automatiquement de récapitulatif des résultats et il n’existe pas encore de CLI pour les résultats des sondages.

## Cartes de présentation

Envoyez des charges utiles de présentation sémantiques aux utilisateurs ou conversations Teams à l’aide de l’outil `message`, de la CLI ou de la remise normale des réponses. OpenClaw les affiche sous forme de cartes adaptatives Teams à partir du contrat de présentation générique.

Le paramètre `presentation` accepte des blocs sémantiques. Lorsque `presentation` est fourni, le texte du message est facultatif. Les boutons sont affichés comme des actions d’envoi ou d’URL de carte adaptative. Les menus de sélection ne sont pas natifs dans le moteur de rendu Teams ; OpenClaw les convertit donc en texte lisible avant la remise.

**Outil d’agent :**

```json5
{
  action: "send",
  channel: "msteams",
  target: "user:<id>",
  presentation: {
    title: "Bonjour",
    blocks: [{ type: "text", text: "Bonjour !" }],
  },
}
```

**CLI :**

```bash
openclaw message send --channel msteams \
  --target "conversation:19:abc...@thread.tacv2" \
  --presentation '{"title":"Bonjour","blocks":[{"type":"text","text":"Bonjour !"}]}'
```

Pour plus de détails sur le format des cibles, consultez [Formats des cibles](#target-formats) ci-dessous.

## Formats des cibles

Les cibles MSTeams utilisent des préfixes pour distinguer les utilisateurs des conversations :

| Type de cible       | Format                           | Exemple                                                                                                |
| ------------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Utilisateur (par ID) | `user:<aad-object-id>`           | `user:40a1a0ed-4ff2-4164-a219-55518990c197`                                                            |
| Utilisateur (par nom) | `user:<display-name>`            | `user:John Smith` (nécessite l’API Graph)                                                                 |
| Groupe/canal        | `conversation:<conversation-id>` | `conversation:19:abc123...@thread.tacv2`                                                               |
| Groupe/canal (brut) | `<conversation-id>`              | `19:abc123...@thread.tacv2`, `19:...@unq.gbl.spaces` ou un ID Bot Framework `a:`/`8:orgid:`/`29:` sans préfixe |

**Exemples de CLI :**

```bash
# Envoyer à un utilisateur par ID
openclaw message send --channel msteams --target "user:40a1a0ed-..." --message "Bonjour"

# Envoyer à un utilisateur par nom d’affichage (déclenche une recherche dans l’API Graph)
openclaw message send --channel msteams --target "user:John Smith" --message "Bonjour"

# Envoyer à une discussion de groupe ou à un canal
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" --message "Bonjour"

# Envoyer une carte de présentation à une conversation
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" \
  --presentation '{"title":"Bonjour","blocks":[{"type":"text","text":"Bonjour"}]}'
```

**Exemples d’outil d’agent :**

```json5
{
  action: "send",
  channel: "msteams",
  target: "user:John Smith",
  message: "Bonjour !",
}
```

```json5
{
  action: "send",
  channel: "msteams",
  target: "conversation:19:abc...@thread.tacv2",
  presentation: {
    title: "Bonjour",
    blocks: [{ type: "text", text: "Bonjour" }],
  },
}
```

<Note>
Sans le préfixe `user:`, les noms sont par défaut résolus comme des groupes ou des équipes. Utilisez toujours `user:` lorsque vous ciblez des personnes par leur nom d’affichage.
</Note>

## Messagerie proactive

- Les messages proactifs ne sont possibles **qu’après** qu’un utilisateur a interagi, car OpenClaw enregistre alors les références de conversation.
- Consultez [/gateway/configuration](/fr/gateway/configuration) pour `dmPolicy` et le contrôle par liste d’autorisation.

## ID d’équipe et de canal (piège courant)

Le paramètre de requête `groupId` dans les URL Teams n’est **PAS** l’ID d’équipe utilisé pour la configuration. Extrayez plutôt les ID du chemin de l’URL :

**URL d’équipe :**

```text
https://teams.microsoft.com/l/team/19%3ABk4j...%40thread.tacv2/conversations?groupId=...
                                    └────────────────────────────┘
                                    ID de conversation de l’équipe (décodez cette valeur d’URL)
```

**URL de canal :**

```text
https://teams.microsoft.com/l/channel/19%3A15bc...%40thread.tacv2/ChannelName?groupId=...
                                      └─────────────────────────┘
                                      ID du canal (décodez cette valeur d’URL)
```

**Pour la configuration :**

- Clé d’équipe = segment du chemin après `/team/` (décodé depuis l’URL, par exemple `19:Bk4j...@thread.tacv2` ; les locataires plus anciens peuvent afficher `@thread.skype`, qui est également valide).
- Clé de canal = segment du chemin après `/channel/` (décodé depuis l’URL).
- **Ignorez** le paramètre de requête `groupId` pour le routage OpenClaw. Il s’agit de l’ID de groupe Microsoft Entra, et non de l’ID de conversation Bot Framework utilisé dans les activités Teams entrantes.

## Canaux privés

La prise en charge des bots dans les canaux privés est limitée :

| Fonctionnalité                 | Canaux standard | Canaux privés                    |
| ------------------------------ | --------------- | -------------------------------- |
| Installation du bot            | Oui             | Limitée                          |
| Messages en temps réel (Webhook) | Oui           | Peut ne pas fonctionner          |
| Autorisations RSC              | Oui             | Peuvent se comporter différemment |
| @mentions                      | Oui             | Si le bot est accessible         |
| Historique de l’API Graph      | Oui             | Oui (avec les autorisations)     |

**Solutions de contournement si les canaux privés ne fonctionnent pas :**

1. Utilisez des canaux standard pour les interactions avec le bot.
2. Utilisez les messages privés ; les utilisateurs peuvent toujours envoyer directement un message au bot.
3. Utilisez l’API Graph pour l’accès à l’historique (nécessite `ChannelMessage.Read.All`).

## Dépannage

### Problèmes courants

- **Les images ne s’affichent pas dans les canaux :** les autorisations Graph ou le consentement de l’administrateur sont manquants. Réinstallez l’application Teams, puis quittez et rouvrez complètement Teams.
- **Aucune réponse dans le canal :** les mentions sont requises par défaut ; définissez `channels.msteams.requireMention=false` ou configurez ce comportement par équipe/canal.
- **Incompatibilité de version (Teams affiche toujours l’ancien manifeste) :** supprimez puis ajoutez de nouveau l’application, et quittez complètement Teams pour l’actualiser.
- **401 Unauthorized provenant du Webhook :** comportement attendu lors d’un test manuel sans JWT Azure ; cela signifie que le point de terminaison est accessible, mais que l’authentification a échoué. Utilisez Azure Web Chat pour effectuer un test correct.

### Erreurs de téléversement du manifeste

- **"Icon file cannot be empty":** le manifeste fait référence à des fichiers d’icône de 0 octet. Créez des icônes PNG valides (32x32 pour `outline.png`, 192x192 pour `color.png`).
- **"webApplicationInfo.Id already in use":** l’application est encore installée dans une autre équipe ou discussion. Recherchez-la et désinstallez-la d’abord, ou attendez 5-10 minutes pour la propagation.
- **"Something went wrong" lors du téléversement :** effectuez plutôt le téléversement via [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com), ouvrez les outils de développement du navigateur (F12) → onglet Network, puis consultez le corps de la réponse pour connaître l’erreur réelle.
- **Échec du chargement indépendant :** essayez "Upload an app to your org's app catalog" au lieu de "Upload a custom app" ; cela contourne souvent les restrictions de chargement indépendant.

### Les autorisations RSC ne fonctionnent pas

1. Vérifiez que `webApplicationInfo.id` correspond exactement à l’ID d’application de votre bot.
2. Téléversez de nouveau l’application et réinstallez-la dans l’équipe ou la discussion.
3. Vérifiez si l’administrateur de votre organisation a bloqué les autorisations RSC.
4. Confirmez que vous utilisez la bonne étendue : `ChannelMessage.Read.Group` pour les équipes, `ChatMessage.Read.Chat` pour les discussions de groupe.

## Références

- [Créer un bot Azure](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) - guide de configuration d’un bot Azure
- [Portail des développeurs Teams](https://dev.teams.microsoft.com/apps) - créer/gérer des applications Teams
- [Schéma du manifeste d’application Teams](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [Recevoir les messages d’un canal avec RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [Référence des autorisations RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [Gestion des fichiers par les bots Teams](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4) (Graph est requis pour les canaux/groupes)
- [Messagerie proactive](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)
- [@microsoft/teams.cli](https://www.npmjs.com/package/@microsoft/teams.cli) - CLI Teams pour la gestion des bots

## Contenu associé

- [Présentation des canaux](/fr/channels) - tous les canaux pris en charge
- [Appairage](/fr/channels/pairing) - authentification par message privé et processus d’appairage
- [Groupes](/fr/channels/groups) - comportement des discussions de groupe et filtrage par mention
- [Routage des canaux](/fr/channels/channel-routing) - routage des sessions pour les messages
- [Sécurité](/fr/gateway/security) - modèle d’accès et renforcement de la sécurité
