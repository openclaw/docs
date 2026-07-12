---
read_when:
    - Développement des fonctionnalités du canal Google Chat
summary: État de la prise en charge, fonctionnalités et configuration de l'application Google Chat
title: Google Chat
x-i18n:
    generated_at: "2026-07-12T15:02:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 72a08c41f7da019f91265cbf7ae73134a0767c603449ebd8cd9a5354936a3b52
    source_path: channels/googlechat.md
    workflow: 16
---

Google Chat fonctionne comme le plugin officiel `@openclaw/googlechat` : messages privés et espaces via les Webhooks de l’API Google Chat (point de terminaison HTTP uniquement, sans Pub/Sub).

## Installation

```bash
openclaw plugins install @openclaw/googlechat
```

Dépôt local (lors d’une exécution depuis un dépôt git) :

```bash
openclaw plugins install ./path/to/local/googlechat-plugin
```

## Configuration rapide (débutants)

1. Créez un projet Google Cloud et activez **Google Chat API**.
   - Accédez à : [Identifiants de l’API Google Chat](https://console.cloud.google.com/apis/api/chat.googleapis.com/credentials)
   - Activez l’API si elle ne l’est pas déjà.
2. Créez un **Service Account** :
   - Cliquez sur **Create Credentials** > **Service Account**.
   - Attribuez-lui le nom de votre choix (par exemple, `openclaw-chat`).
   - Laissez les autorisations et les comptes principaux vides (**Continue**, puis **Done**).
3. Créez et téléchargez la **clé JSON** :
   - Cliquez sur le nouveau compte de service > onglet **Keys** > **Add Key** > **Create new key** > **JSON** > **Create**.
4. Stockez le fichier JSON téléchargé sur l’hôte de votre Gateway (par exemple, `~/.openclaw/googlechat-service-account.json`).
5. Créez une application Google Chat dans la [configuration de Chat de la console Google Cloud](https://console.cloud.google.com/apis/api/chat.googleapis.com/hangouts-chat) :
   - Renseignez **Application info** (nom de l’application, URL de l’avatar, description).
   - Activez **Interactive features**.
   - Sous **Functionality**, cochez **Join spaces and group conversations**.
   - Sous **Connection settings**, sélectionnez **HTTP endpoint URL**.
   - Sous **Triggers**, sélectionnez **Use a common HTTP endpoint URL for all triggers** et définissez-la sur l’URL publique de votre Gateway suivie de `/googlechat` (voir [URL publique](#public-url-webhook-only)).
   - Sous **Visibility**, cochez **Make this Chat app available to specific people and groups in `<Your Domain>`** et saisissez votre adresse e-mail.
   - Cliquez sur **Save**.
6. Activez l’état de l’application : actualisez la page, recherchez **App status**, définissez-le sur **Live - available to users**, puis cliquez de nouveau sur **Save**.
7. Configurez OpenClaw avec le compte de service et l’audience du Webhook (elle doit correspondre à la configuration de l’application Chat) :
   - Variable d’environnement : `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE=/path/to/service-account.json` (compte par défaut uniquement), ou
   - Configuration : consultez les [principaux paramètres de configuration](#config-highlights). `openclaw channels add --channel googlechat` accepte également `--audience-type`, `--audience`, `--webhook-path` et `--webhook-url`.
8. Démarrez le Gateway. Google Chat enverra des requêtes POST vers le chemin de votre Webhook (`/googlechat` par défaut).

## Ajout à Google Chat

Une fois le Gateway en cours d’exécution et votre adresse e-mail ajoutée à la liste de visibilité :

1. Accédez à [Google Chat](https://chat.google.com/).
2. Cliquez sur l’icône **+** (plus) à côté de **Direct Messages**.
3. Recherchez l’**App name** configuré dans la console Google Cloud.
   - Le bot n’apparaît _pas_ dans la liste de navigation de Marketplace, car il s’agit d’une application privée ; recherchez-le par son nom.
4. Sélectionnez le bot, cliquez sur **Add** ou **Chat**, puis envoyez un message.

## URL publique (Webhook uniquement)

Les Webhooks Google Chat nécessitent un point de terminaison HTTPS public. Pour des raisons de sécurité, exposez **uniquement le chemin `/googlechat`** à Internet et conservez le tableau de bord OpenClaw ainsi que les autres points de terminaison privés.

### Option A : Tailscale Funnel (recommandé)

Utilisez Tailscale Serve pour le tableau de bord privé et Funnel pour le chemin public du Webhook.

1. Vérifiez l’adresse sur laquelle votre Gateway écoute :

   ```bash
   ss -tlnp | grep 18789
   ```

   Notez l’adresse IP (par exemple, `127.0.0.1`, `0.0.0.0` ou une adresse Tailscale `100.x.x.x`).

2. Exposez le tableau de bord uniquement au tailnet (port 8443) :

   ```bash
   # Si l’écoute se fait sur localhost (127.0.0.1 ou 0.0.0.0) :
   tailscale serve --bg --https 8443 http://127.0.0.1:18789

   # Si l’écoute se fait uniquement sur une adresse IP Tailscale :
   tailscale serve --bg --https 8443 http://100.x.x.x:18789
   ```

3. Exposez publiquement uniquement le chemin du Webhook :

   ```bash
   # Si l’écoute se fait sur localhost (127.0.0.1 ou 0.0.0.0) :
   tailscale funnel --bg --set-path /googlechat http://127.0.0.1:18789/googlechat

   # Si l’écoute se fait uniquement sur une adresse IP Tailscale :
   tailscale funnel --bg --set-path /googlechat http://100.x.x.x:18789/googlechat
   ```

4. Si vous y êtes invité, accédez à l’URL d’autorisation affichée dans la sortie pour activer Funnel pour ce Node.

5. Vérifiez :

   ```bash
   tailscale serve status
   tailscale funnel status
   ```

L’URL publique de votre Webhook est `https://<node-name>.<tailnet>.ts.net/googlechat` ; le tableau de bord reste accessible uniquement depuis le tailnet à l’adresse `https://<node-name>.<tailnet>.ts.net:8443/`. Utilisez l’URL publique (sans `:8443`) dans la configuration de l’application Google Chat.

> Remarque : cette configuration persiste après les redémarrages. Pour la supprimer ultérieurement, utilisez `tailscale funnel reset` et `tailscale serve reset`.

### Option B : proxy inverse (Caddy)

Redirigez uniquement le chemin du Webhook :

```caddy
your-domain.com {
    reverse_proxy /googlechat* localhost:18789
}
```

Les requêtes vers `your-domain.com/` sont ignorées ou renvoient une erreur 404, tandis que `your-domain.com/googlechat` est acheminé vers OpenClaw.

### Option C : tunnel Cloudflare

Configurez les règles d’entrée du tunnel pour acheminer uniquement le chemin du Webhook :

- **Chemin** : `/googlechat` -> `http://localhost:18789/googlechat`
- **Règle par défaut** : HTTP 404 (Not Found)

## Fonctionnement

1. Google Chat envoie du JSON par POST au chemin du Webhook du Gateway (POST uniquement, type de contenu JSON obligatoire, limitation du débit par adresse IP).
2. OpenClaw authentifie chaque requête avant son traitement :
   - Les événements de l’application de chat contiennent `Authorization: Bearer <token>` ; le jeton est vérifié avant l’analyse du corps complet.
   - Les événements du module complémentaire Google Workspace contiennent le jeton dans le corps (`authorizationEventObject.systemIdToken`) et sont lus avec des limites de préauthentification plus strictes (16 KB, 3 s) avant vérification.
3. Le jeton est vérifié par rapport à `audienceType` + `audience` :
   - `audienceType: "app-url"` → l’audience est l’URL HTTPS de votre Webhook.
   - `audienceType: "project-number"` → l’audience est le numéro du projet Cloud.
   - Avec `app-url`, les jetons des modules complémentaires exigent également que `appPrincipal` soit défini sur l’identifiant client OAuth 2.0 numérique de l’application (21 chiffres, et non une adresse e-mail) ; sinon, la vérification échoue et un avertissement est consigné.
4. Les messages sont acheminés selon l’espace :
   - Les espaces disposent de sessions propres à chaque espace `agent:<agentId>:googlechat:group:<spaceId>` ; les réponses sont envoyées dans le fil du message.
   - Par défaut, les messages privés sont regroupés dans la session principale de l’agent ; définissez `session.dmScope` pour utiliser des sessions de messages privés par interlocuteur (voir [Session](/fr/concepts/session)).
5. Par défaut, l’accès aux messages privés repose sur l’association. Les expéditeurs inconnus reçoivent un code d’association ; approuvez-le avec :
   - `openclaw pairing approve googlechat <code>`
6. Par défaut, les espaces de groupe exigent une @mention. Les mentions sont détectées à partir des annotations Chat `USER_MENTION` ciblant l’application ; définissez `botUser` (par exemple, `users/1234567890`) si la détection nécessite le nom de ressource utilisateur de l’application.
7. Lorsqu’une approbation d’exécution ou de Plugin est lancée depuis Google Chat et qu’un approbateur stable `users/<id>` est configuré, OpenClaw publie une carte d’approbation native (`cardsV2`) dans l’espace ou le fil d’origine. Les boutons de la carte contiennent des jetons de rappel opaques ; l’invite manuelle `/approve <id> <decision>` apparaît uniquement lorsque la remise native n’est pas disponible.

## Cibles

Utilisez ces identifiants pour la remise et les listes d’autorisation :

- Messages privés : `users/<userId>` (recommandé).
- Espaces : `spaces/<spaceId>`.
- L’adresse e-mail brute `name@example.com` est modifiable et n’est utilisée pour la mise en correspondance avec les listes d’autorisation que lorsque `channels.googlechat.dangerouslyAllowNameMatching: true`.
- Obsolète : `users/<email>` est traité comme un identifiant utilisateur, et non comme une entrée d’adresse e-mail dans une liste d’autorisation.
- Les préfixes `googlechat:`, `google-chat:` et `gchat:` sont acceptés et supprimés.

## Principaux éléments de configuration

```json5
{
  channels: {
    googlechat: {
      enabled: true,
      serviceAccountFile: "/path/to/service-account.json",
      // ou serviceAccountRef: { source: "file", provider: "filemain", id: "/channels/googlechat/serviceAccount" }
      audienceType: "app-url",
      audience: "https://gateway.example.com/googlechat",
      appPrincipal: "123456789012345678901", // vérification des modules complémentaires uniquement ; identifiant client OAuth numérique
      webhookPath: "/googlechat",
      botUser: "users/1234567890", // facultatif ; facilite la détection des mentions
      allowBots: false,
      dm: {
        policy: "pairing",
        allowFrom: ["users/1234567890"],
      },
      groupPolicy: "allowlist",
      groups: {
        "spaces/AAAA": {
          enabled: true,
          requireMention: true,
          users: ["users/1234567890"],
          systemPrompt: "Réponses courtes uniquement.",
        },
      },
      typingIndicator: "message",
      mediaMaxMb: 20,
    },
  },
}
```

Remarques :

- Identifiants du compte de service : `serviceAccountFile` (chemin), `serviceAccount` (chaîne JSON intégrée ou objet) ou `serviceAccountRef` (SecretRef d’environnement/fichier). Les variables d’environnement `GOOGLE_CHAT_SERVICE_ACCOUNT` (JSON intégré) et `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE` (chemin) s’appliquent uniquement au compte par défaut. Les configurations multicomptes utilisent `channels.googlechat.accounts.<id>` avec les mêmes clés, notamment un `serviceAccountRef` propre à chaque compte.
- Le chemin du Webhook par défaut est `/googlechat` lorsque `webhookPath` n’est pas défini ; `webhookUrl` peut fournir le chemin à la place.
- Les clés de groupe doivent être des identifiants d’espace stables (`spaces/<spaceId>`). Les clés correspondant à des noms d’affichage sont obsolètes et consignées comme telles.
- `dangerouslyAllowNameMatching` réactive la mise en correspondance des principaux d’adresse e-mail modifiables pour les listes d’autorisation (mode de compatibilité d’urgence) ; doctor émet un avertissement concernant les entrées d’adresse e-mail.
- Les actions de réaction Google Chat ne sont pas exposées. Le Plugin utilise l’authentification par compte de service, tandis que les points de terminaison de réaction Google Chat nécessitent une authentification utilisateur. La configuration existante `actions.reactions` est acceptée à des fins de compatibilité, mais n’a aucun effet.
- Les cartes d’approbation natives utilisent les clics sur les boutons Google Chat `cardsV2`, et non les événements de réaction. Les approbateurs proviennent de `dm.allowFrom` ou de `defaultTo` et doivent être des valeurs numériques stables `users/<id>`.
- Les actions de message exposent uniquement l’envoi de texte `send`. Le téléversement de pièces jointes Google Chat nécessite une authentification utilisateur, tandis que ce Plugin utilise l’authentification par compte de service ; le téléversement de fichiers sortants n’est donc pas exposé.
- `typingIndicator` : `message` (par défaut) publie un espace réservé `_<Bot> is typing..._`, puis le remplace par la première réponse ; `none` le désactive ; `reaction` nécessite OAuth utilisateur et revient actuellement à `message`, avec une erreur consignée, lors de l’authentification par compte de service.
- Les pièces jointes entrantes (la première pièce jointe de chaque message) sont téléchargées via l’API Chat dans le pipeline multimédia, dans la limite définie par `mediaMaxMb` (20 par défaut).
- Par défaut, les messages rédigés par des bots sont ignorés. Avec `allowBots: true`, les messages de bots acceptés utilisent la [protection partagée contre les boucles de bots](/fr/channels/bot-loop-protection) : configurez `channels.defaults.botLoopProtection`, puis remplacez ce réglage avec `channels.googlechat.botLoopProtection` ou `channels.googlechat.groups.<space>.botLoopProtection`.

Détails sur les références de secrets : [Gestion des secrets](/fr/gateway/secrets).

## Résolution des problèmes

### 405 Method Not Allowed

Si l’explorateur de journaux Google Cloud affiche des erreurs telles que :

```text
code d’état : 405, motif : réponse d’erreur HTTP : HTTP/1.1 405 Method Not Allowed
```

Le gestionnaire du Webhook n’est pas enregistré. Causes courantes :

1. **Canal non configuré** : la section `channels.googlechat` est absente. Vérifiez avec :

   ```bash
   openclaw config get channels.googlechat
   ```

   Si la commande renvoie « Config path not found », ajoutez la configuration (voir [Principaux éléments de configuration](#config-highlights)).

2. **Plugin non activé** : vérifiez l’état du Plugin :

   ```bash
   openclaw plugins list | grep googlechat
   ```

   Si la commande affiche « disabled », ajoutez `plugins.entries.googlechat.enabled: true` à votre configuration.

3. **Gateway non redémarré** après les modifications de configuration :

   ```bash
   openclaw gateway restart
   ```

Vérifiez que le canal est actif :

```bash
openclaw channels status
# Doit afficher : Google Chat default: enabled, configured, ...
```

### Autres problèmes

- `openclaw channels status --probe` affiche les erreurs d’authentification et les configurations d’audience manquantes (`audience` et `audienceType` sont tous deux obligatoires).
- Si aucun message n’arrive, vérifiez l’URL du Webhook et la configuration des déclencheurs de l’application Chat.
- Si l’exigence de mention bloque les réponses, définissez `botUser` sur le nom de ressource utilisateur de l’application et vérifiez `requireMention`.
- L’exécution de `openclaw logs --follow` pendant l’envoi d’un message de test indique si les requêtes atteignent le Gateway.

## Pages connexes

- [Vue d’ensemble des canaux](/fr/channels) — tous les canaux pris en charge
- [Routage des canaux](/fr/channels/channel-routing) — routage des sessions pour les messages
- [Configuration du Gateway](/fr/gateway/configuration)
- [Groupes](/fr/channels/groups) — comportement des discussions de groupe et filtrage par mention
- [Appairage](/fr/channels/pairing) — authentification des messages privés et processus d’appairage
- [Sécurité](/fr/gateway/security) — modèle d’accès et renforcement de la sécurité
