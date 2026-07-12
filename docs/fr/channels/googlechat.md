---
read_when:
    - Développement de fonctionnalités pour le canal Google Chat
summary: État de la prise en charge de l’application Google Chat, fonctionnalités et configuration
title: Google Chat
x-i18n:
    generated_at: "2026-07-12T02:19:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 72a08c41f7da019f91265cbf7ae73134a0767c603449ebd8cd9a5354936a3b52
    source_path: channels/googlechat.md
    workflow: 16
---

Google Chat fonctionne via le plugin officiel `@openclaw/googlechat` : messages privés et espaces au moyen des webhooks de l’API Google Chat (point de terminaison HTTP uniquement, sans Pub/Sub).

## Installation

```bash
openclaw plugins install @openclaw/googlechat
```

Dépôt local (en cas d’exécution depuis un dépôt git) :

```bash
openclaw plugins install ./path/to/local/googlechat-plugin
```

## Configuration rapide (débutant)

1. Créez un projet Google Cloud et activez **Google Chat API**.
   - Accédez à : [Identifiants de Google Chat API](https://console.cloud.google.com/apis/api/chat.googleapis.com/credentials)
   - Activez l’API si elle ne l’est pas déjà.
2. Créez un **Service Account** :
   - Cliquez sur **Create Credentials** > **Service Account**.
   - Donnez-lui le nom de votre choix (par exemple, `openclaw-chat`).
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
7. Configurez OpenClaw avec le compte de service et l’audience du webhook (elle doit correspondre à la configuration de l’application Chat) :
   - Variable d’environnement : `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE=/path/to/service-account.json` (compte par défaut uniquement), ou
   - Configuration : consultez [Principaux paramètres de configuration](#config-highlights). `openclaw channels add --channel googlechat` accepte également `--audience-type`, `--audience`, `--webhook-path` et `--webhook-url`.
8. Démarrez le Gateway. Google Chat enverra des requêtes POST à votre chemin de webhook (`/googlechat` par défaut).

## Ajout à Google Chat

Une fois le Gateway en cours d’exécution et votre adresse e-mail ajoutée à la liste de visibilité :

1. Accédez à [Google Chat](https://chat.google.com/).
2. Cliquez sur l’icône **+** (plus) à côté de **Direct Messages**.
3. Recherchez l’**App name** configuré dans la console Google Cloud.
   - Le bot n’apparaît _pas_ dans la liste de navigation de Marketplace, car il s’agit d’une application privée ; recherchez-le par son nom.
4. Sélectionnez le bot, cliquez sur **Add** ou **Chat**, puis envoyez un message.

## URL publique (webhook uniquement)

Les webhooks Google Chat nécessitent un point de terminaison HTTPS public. Pour des raisons de sécurité, exposez **uniquement le chemin `/googlechat`** à Internet et gardez le tableau de bord OpenClaw ainsi que les autres points de terminaison privés.

### Option A : Tailscale Funnel (recommandé)

Utilisez Tailscale Serve pour le tableau de bord privé et Funnel pour le chemin public du webhook.

1. Vérifiez l’adresse à laquelle votre Gateway est lié :

   ```bash
   ss -tlnp | grep 18789
   ```

   Notez l’adresse IP (par exemple, `127.0.0.1`, `0.0.0.0` ou une adresse Tailscale de type `100.x.x.x`).

2. Exposez le tableau de bord uniquement au tailnet (port 8443) :

   ```bash
   # If bound to localhost (127.0.0.1 or 0.0.0.0):
   tailscale serve --bg --https 8443 http://127.0.0.1:18789

   # If bound to a Tailscale IP only:
   tailscale serve --bg --https 8443 http://100.x.x.x:18789
   ```

3. Exposez publiquement uniquement le chemin du webhook :

   ```bash
   # If bound to localhost (127.0.0.1 or 0.0.0.0):
   tailscale funnel --bg --set-path /googlechat http://127.0.0.1:18789/googlechat

   # If bound to a Tailscale IP only:
   tailscale funnel --bg --set-path /googlechat http://100.x.x.x:18789/googlechat
   ```

4. Si vous y êtes invité, consultez l’URL d’autorisation affichée dans la sortie afin d’activer Funnel pour ce Node.

5. Vérifiez :

   ```bash
   tailscale serve status
   tailscale funnel status
   ```

L’URL publique de votre webhook est `https://<node-name>.<tailnet>.ts.net/googlechat` ; le tableau de bord reste accessible uniquement depuis le tailnet à l’adresse `https://<node-name>.<tailnet>.ts.net:8443/`. Utilisez l’URL publique (sans `:8443`) dans la configuration de l’application Google Chat.

> Remarque : cette configuration persiste après les redémarrages. Pour la supprimer ultérieurement, utilisez `tailscale funnel reset` et `tailscale serve reset`.

### Option B : proxy inverse (Caddy)

Transmettez uniquement le chemin du webhook :

```caddy
your-domain.com {
    reverse_proxy /googlechat* localhost:18789
}
```

Les requêtes vers `your-domain.com/` sont ignorées ou renvoient une erreur 404, tandis que `your-domain.com/googlechat` les achemine vers OpenClaw.

### Option C : Cloudflare Tunnel

Configurez les règles d’entrée du tunnel pour acheminer uniquement le chemin du webhook :

- **Path** : `/googlechat` -> `http://localhost:18789/googlechat`
- **Default rule** : HTTP 404 (Not Found)

## Fonctionnement

1. Google Chat envoie du JSON par requête POST au chemin du webhook du Gateway (POST uniquement, type de contenu JSON obligatoire, limitation du débit par adresse IP).
2. OpenClaw authentifie chaque requête avant son traitement :
   - Les événements de l’application Chat transmettent `Authorization: Bearer <token>` ; le jeton est vérifié avant l’analyse du corps complet.
   - Les événements des modules complémentaires Google Workspace transmettent le jeton dans le corps (`authorizationEventObject.systemIdToken`) et sont lus avec un budget de préauthentification plus strict (16 Ko, 3 s) avant vérification.
3. Le jeton est vérifié par rapport à `audienceType` + `audience` :
   - `audienceType: "app-url"` → l’audience correspond à l’URL HTTPS de votre webhook.
   - `audienceType: "project-number"` → l’audience correspond au numéro du projet Cloud.
   - Avec `app-url`, les jetons de module complémentaire exigent en outre que `appPrincipal` soit défini sur l’identifiant client OAuth 2.0 numérique de l’application (21 chiffres, et non une adresse e-mail) ; sinon, la vérification échoue et un avertissement est consigné.
4. Les messages sont acheminés par espace :
   - Les espaces disposent de sessions propres à chaque espace `agent:<agentId>:googlechat:group:<spaceId>` ; les réponses sont envoyées dans le fil de discussion du message.
   - Par défaut, les messages privés sont regroupés dans la session principale de l’agent ; définissez `session.dmScope` pour créer des sessions de messages privés par interlocuteur (voir [Session](/fr/concepts/session)).
5. L’accès aux messages privés utilise l’association par défaut. Les expéditeurs inconnus reçoivent un code d’association ; approuvez-le avec :
   - `openclaw pairing approve googlechat <code>`
6. Par défaut, les espaces de groupe exigent une @mention. Les mentions sont détectées à partir des annotations Chat `USER_MENTION` ciblant l’application ; définissez `botUser` (par exemple, `users/1234567890`) si la détection nécessite le nom de ressource utilisateur de l’application.
7. Lorsqu’une approbation d’exécution ou de plugin démarre depuis Google Chat et qu’un approbateur stable `users/<id>` est configuré, OpenClaw publie une carte d’approbation native (`cardsV2`) dans l’espace ou le fil d’origine. Les boutons de la carte transmettent des jetons de rappel opaques ; l’invite manuelle `/approve <id> <decision>` apparaît uniquement lorsque l’envoi natif n’est pas disponible.

## Cibles

Utilisez ces identifiants pour l’envoi et les listes d’autorisation :

- Messages privés : `users/<userId>` (recommandé).
- Espaces : `spaces/<spaceId>`.
- L’adresse e-mail brute `name@example.com` est modifiable et n’est utilisée pour la correspondance avec les listes d’autorisation que lorsque `channels.googlechat.dangerouslyAllowNameMatching: true`.
- Obsolète : `users/<email>` est traité comme un identifiant utilisateur, et non comme une entrée d’adresse e-mail dans une liste d’autorisation.
- Les préfixes `googlechat:`, `google-chat:` et `gchat:` sont acceptés et supprimés.

## Principaux paramètres de configuration

```json5
{
  channels: {
    googlechat: {
      enabled: true,
      serviceAccountFile: "/path/to/service-account.json",
      // or serviceAccountRef: { source: "file", provider: "filemain", id: "/channels/googlechat/serviceAccount" }
      audienceType: "app-url",
      audience: "https://gateway.example.com/googlechat",
      appPrincipal: "123456789012345678901", // add-on verification only; numeric OAuth client ID
      webhookPath: "/googlechat",
      botUser: "users/1234567890", // optional; helps mention detection
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
          systemPrompt: "Short answers only.",
        },
      },
      typingIndicator: "message",
      mediaMaxMb: 20,
    },
  },
}
```

Remarques :

- Identifiants du compte de service : `serviceAccountFile` (chemin), `serviceAccount` (chaîne JSON intégrée ou objet) ou `serviceAccountRef` (SecretRef d’environnement/de fichier). Les variables d’environnement `GOOGLE_CHAT_SERVICE_ACCOUNT` (JSON intégré) et `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE` (chemin) s’appliquent uniquement au compte par défaut. Les configurations multicomptes utilisent `channels.googlechat.accounts.<id>` avec les mêmes clés, y compris un `serviceAccountRef` propre à chaque compte.
- Le chemin de webhook par défaut est `/googlechat` lorsque `webhookPath` n’est pas défini ; `webhookUrl` peut fournir le chemin à la place.
- Les clés de groupe doivent être des identifiants d’espace stables (`spaces/<spaceId>`). Les clés fondées sur le nom d’affichage sont obsolètes et consignées comme telles.
- `dangerouslyAllowNameMatching` réactive la correspondance des comptes principaux à partir d’adresses e-mail modifiables pour les listes d’autorisation (mode de compatibilité d’urgence) ; doctor avertit de la présence d’entrées d’adresse e-mail.
- Les actions de réaction Google Chat ne sont pas exposées. Le plugin utilise l’authentification par compte de service, tandis que les points de terminaison de réaction Google Chat exigent une authentification utilisateur. La configuration existante `actions.reactions` est acceptée pour des raisons de compatibilité, mais n’a aucun effet.
- Les cartes d’approbation natives utilisent les clics sur les boutons Google Chat `cardsV2`, et non les événements de réaction. Les approbateurs proviennent de `dm.allowFrom` ou de `defaultTo` et doivent être des valeurs numériques stables au format `users/<id>`.
- Les actions de message exposent uniquement l’envoi de texte `send`. Le téléversement de pièces jointes dans Google Chat exige une authentification utilisateur, tandis que ce plugin utilise une authentification par compte de service ; le téléversement de fichiers sortants n’est donc pas exposé.
- `typingIndicator` : `message` (valeur par défaut) publie un texte temporaire `_<Bot> is typing..._`, puis le remplace par la première réponse ; `none` le désactive ; `reaction` exige une autorisation OAuth utilisateur et se rabat actuellement sur `message`, avec consignation d’une erreur lors de l’authentification par compte de service.
- Les pièces jointes entrantes (la première pièce jointe de chaque message) sont téléchargées au moyen de l’API Chat dans le pipeline multimédia, dans la limite de `mediaMaxMb` (20 par défaut).
- Les messages rédigés par des bots sont ignorés par défaut. Avec `allowBots: true`, les messages de bot acceptés utilisent la [protection partagée contre les boucles de bots](/fr/channels/bot-loop-protection) : configurez `channels.defaults.botLoopProtection`, puis remplacez cette valeur avec `channels.googlechat.botLoopProtection` ou `channels.googlechat.groups.<space>.botLoopProtection`.

Détails sur les références de secrets : [Gestion des secrets](/fr/gateway/secrets).

## Dépannage

### 405 Méthode non autorisée

Si l’explorateur de journaux Google Cloud affiche des erreurs telles que :

```text
status code: 405, reason phrase: HTTP error response: HTTP/1.1 405 Method Not Allowed
```

Le gestionnaire du webhook n’est pas enregistré. Causes courantes :

1. **Canal non configuré** : la section `channels.googlechat` est absente. Vérifiez avec :

   ```bash
   openclaw config get channels.googlechat
   ```

   Si la commande renvoie « Config path not found », ajoutez la configuration (voir [Principaux paramètres de configuration](#config-highlights)).

2. **Plugin non activé** : vérifiez l’état du plugin :

   ```bash
   openclaw plugins list | grep googlechat
   ```

   S’il indique « disabled », ajoutez `plugins.entries.googlechat.enabled: true` à votre configuration.

3. **Gateway non redémarré** après les modifications de configuration :

   ```bash
   openclaw gateway restart
   ```

Vérifiez que le canal fonctionne :

```bash
openclaw channels status
# Should show: Google Chat default: enabled, configured, ...
```

### Autres problèmes

- `openclaw channels status --probe` signale les erreurs d’authentification et l’absence de configuration de l’audience (`audience` et `audienceType` sont tous deux obligatoires).
- Si aucun message n’arrive, vérifiez l’URL du webhook de l’application Chat et la configuration du déclencheur.
- Si le filtrage par mention bloque les réponses, définissez `botUser` sur le nom de ressource utilisateur de l’application et vérifiez `requireMention`.
- L’exécution de `openclaw logs --follow` pendant l’envoi d’un message de test permet de vérifier si les requêtes atteignent le Gateway.

## Pages connexes

- [Présentation des canaux](/fr/channels) — tous les canaux pris en charge
- [Routage des canaux](/fr/channels/channel-routing) — routage des sessions pour les messages
- [Configuration du Gateway](/fr/gateway/configuration)
- [Groupes](/fr/channels/groups) — comportement des discussions de groupe et filtrage des mentions
- [Appairage](/fr/channels/pairing) — authentification par message privé et processus d’appairage
- [Sécurité](/fr/gateway/security) — modèle d’accès et renforcement de la sécurité
