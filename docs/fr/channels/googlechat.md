---
read_when:
    - Travail sur les fonctionnalités du canal Google Chat
summary: État de la prise en charge de l’application Google Chat, fonctionnalités et configuration
title: Google Chat
x-i18n:
    generated_at: "2026-05-04T02:21:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: afa2ca4d9673396aa24a55ca5855a34ad26a4640c3a1f6928dbf7246e403cb04
    source_path: channels/googlechat.md
    workflow: 16
---

Statut : plugin téléchargeable pour les messages privés et les espaces via les webhooks de l’API Google Chat (HTTP uniquement).

## Installation

Installez Google Chat avant de configurer le canal :

```bash
openclaw plugins install @openclaw/googlechat
```

Checkout local (lors de l’exécution depuis un dépôt git) :

```bash
openclaw plugins install ./path/to/local/googlechat-plugin
```

## Configuration rapide (débutant)

1. Créez un projet Google Cloud et activez la **Google Chat API**.
   - Accédez à : [Identifiants Google Chat API](https://console.cloud.google.com/apis/api/chat.googleapis.com/credentials)
   - Activez l’API si elle ne l’est pas déjà.
2. Créez un **Compte de service** :
   - Appuyez sur **Créer des identifiants** > **Compte de service**.
   - Donnez-lui le nom que vous voulez (par exemple, `openclaw-chat`).
   - Laissez les autorisations vides (appuyez sur **Continuer**).
   - Laissez les principaux avec accès vides (appuyez sur **Terminé**).
3. Créez et téléchargez la **Clé JSON** :
   - Dans la liste des comptes de service, cliquez sur celui que vous venez de créer.
   - Accédez à l’onglet **Clés**.
   - Cliquez sur **Ajouter une clé** > **Créer une nouvelle clé**.
   - Sélectionnez **JSON** et appuyez sur **Créer**.
4. Stockez le fichier JSON téléchargé sur votre hôte Gateway (par exemple, `~/.openclaw/googlechat-service-account.json`).
5. Créez une application Google Chat dans la [Configuration Chat de Google Cloud Console](https://console.cloud.google.com/apis/api/chat.googleapis.com/hangouts-chat) :
   - Renseignez les **Informations sur l’application** :
     - **Nom de l’application** : (par exemple `OpenClaw`)
     - **URL de l’avatar** : (par exemple `https://openclaw.ai/logo.png`)
     - **Description** : (par exemple `Assistant IA personnel`)
   - Activez les **Fonctionnalités interactives**.
   - Sous **Fonctionnalité**, cochez **Rejoindre les espaces et les conversations de groupe**.
   - Sous **Paramètres de connexion**, sélectionnez **URL de point de terminaison HTTP**.
   - Sous **Déclencheurs**, sélectionnez **Utiliser une URL de point de terminaison HTTP commune pour tous les déclencheurs** et définissez-la sur l’URL publique de votre Gateway suivie de `/googlechat`.
     - _Astuce : exécutez `openclaw status` pour trouver l’URL publique de votre Gateway._
   - Sous **Visibilité**, cochez **Rendre cette application Chat disponible pour des personnes et des groupes spécifiques dans `<Your Domain>`**.
   - Saisissez votre adresse e-mail (par exemple `user@example.com`) dans la zone de texte.
   - Cliquez sur **Enregistrer** en bas.
6. **Activez le statut de l’application** :
   - Après l’enregistrement, **actualisez la page**.
   - Recherchez la section **Statut de l’application** (généralement près du haut ou du bas après l’enregistrement).
   - Remplacez le statut par **En direct - disponible pour les utilisateurs**.
   - Cliquez de nouveau sur **Enregistrer**.
7. Configurez OpenClaw avec le chemin du compte de service + l’audience du webhook :
   - Env : `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE=/path/to/service-account.json`
   - Ou configuration : `channels.googlechat.serviceAccountFile: "/path/to/service-account.json"`.
8. Définissez le type + la valeur de l’audience du webhook (correspond à la configuration de votre application Chat).
9. Démarrez le Gateway. Google Chat enverra des requêtes POST vers le chemin de votre webhook.

## Ajouter à Google Chat

Une fois que le Gateway est en cours d’exécution et que votre e-mail est ajouté à la liste de visibilité :

1. Accédez à [Google Chat](https://chat.google.com/).
2. Cliquez sur l’icône **+** (plus) à côté de **Messages privés**.
3. Dans la barre de recherche (là où vous ajoutez habituellement des personnes), saisissez le **Nom de l’application** que vous avez configuré dans Google Cloud Console.
   - **Remarque** : le bot n’apparaîtra _pas_ dans la liste de navigation « Marketplace », car il s’agit d’une application privée. Vous devez le rechercher par nom.
4. Sélectionnez votre bot dans les résultats.
5. Cliquez sur **Ajouter** ou **Chat** pour démarrer une conversation 1:1.
6. Envoyez « Hello » pour déclencher l’assistant !

## URL publique (Webhook uniquement)

Les webhooks Google Chat exigent un point de terminaison HTTPS public. Pour la sécurité, **n’exposez que le chemin `/googlechat`** à Internet. Gardez le tableau de bord OpenClaw et les autres points de terminaison sensibles sur votre réseau privé.

### Option A : Tailscale Funnel (recommandé)

Utilisez Tailscale Serve pour le tableau de bord privé et Funnel pour le chemin de webhook public. Cela garde `/` privé tout en exposant uniquement `/googlechat`.

1. **Vérifiez à quelle adresse votre Gateway est lié :**

   ```bash
   ss -tlnp | grep 18789
   ```

   Notez l’adresse IP (par exemple, `127.0.0.1`, `0.0.0.0`, ou votre IP Tailscale comme `100.x.x.x`).

2. **Exposez le tableau de bord uniquement au tailnet (port 8443) :**

   ```bash
   # If bound to localhost (127.0.0.1 or 0.0.0.0):
   tailscale serve --bg --https 8443 http://127.0.0.1:18789

   # If bound to Tailscale IP only (e.g., 100.106.161.80):
   tailscale serve --bg --https 8443 http://100.106.161.80:18789
   ```

3. **Exposez publiquement uniquement le chemin de webhook :**

   ```bash
   # If bound to localhost (127.0.0.1 or 0.0.0.0):
   tailscale funnel --bg --set-path /googlechat http://127.0.0.1:18789/googlechat

   # If bound to Tailscale IP only (e.g., 100.106.161.80):
   tailscale funnel --bg --set-path /googlechat http://100.106.161.80:18789/googlechat
   ```

4. **Autorisez le Node pour l’accès Funnel :**
   Si vous y êtes invité, consultez l’URL d’autorisation affichée dans la sortie pour activer Funnel pour ce Node dans votre politique tailnet.

5. **Vérifiez la configuration :**

   ```bash
   tailscale serve status
   tailscale funnel status
   ```

Votre URL de webhook publique sera :
`https://<node-name>.<tailnet>.ts.net/googlechat`

Votre tableau de bord privé reste limité au tailnet :
`https://<node-name>.<tailnet>.ts.net:8443/`

Utilisez l’URL publique (sans `:8443`) dans la configuration de l’application Google Chat.

> Remarque : cette configuration persiste après les redémarrages. Pour la supprimer plus tard, exécutez `tailscale funnel reset` et `tailscale serve reset`.

### Option B : proxy inverse (Caddy)

Si vous utilisez un proxy inverse comme Caddy, ne proxifiez que le chemin spécifique :

```caddy
your-domain.com {
    reverse_proxy /googlechat* localhost:18789
}
```

Avec cette configuration, toute requête vers `your-domain.com/` sera ignorée ou renvoyée en 404, tandis que `your-domain.com/googlechat` est acheminé en toute sécurité vers OpenClaw.

### Option C : Cloudflare Tunnel

Configurez les règles d’entrée de votre tunnel pour ne router que le chemin de webhook :

- **Chemin** : `/googlechat` -> `http://localhost:18789/googlechat`
- **Règle par défaut** : HTTP 404 (Not Found)

## Fonctionnement

1. Google Chat envoie des POSTs de webhook au Gateway. Chaque requête inclut un en-tête `Authorization: Bearer <token>`.
   - OpenClaw vérifie l’authentification bearer avant de lire/analyser les corps complets de webhook lorsque l’en-tête est présent.
   - Les requêtes Google Workspace Add-on qui transportent `authorizationEventObject.systemIdToken` dans le corps sont prises en charge via un budget de corps de pré-authentification plus strict.
2. OpenClaw vérifie le jeton par rapport au `audienceType` + `audience` configurés :
   - `audienceType: "app-url"` → l’audience est votre URL de webhook HTTPS.
   - `audienceType: "project-number"` → l’audience est le numéro du projet Cloud.
3. Les messages sont routés par espace :
   - Les messages privés utilisent la clé de session `agent:<agentId>:googlechat:direct:<spaceId>`.
   - Les espaces utilisent la clé de session `agent:<agentId>:googlechat:group:<spaceId>`.
4. L’accès aux messages privés utilise l’appairage par défaut. Les expéditeurs inconnus reçoivent un code d’appairage ; approuvez avec :
   - `openclaw pairing approve googlechat <code>`
5. Les espaces de groupe exigent une @mention par défaut. Utilisez `botUser` si la détection des mentions a besoin du nom d’utilisateur de l’application.

## Cibles

Utilisez ces identifiants pour la livraison et les listes d’autorisation :

- Messages privés : `users/<userId>` (recommandé).
- L’e-mail brut `name@example.com` est modifiable et utilisé uniquement pour la correspondance de liste d’autorisation directe lorsque `channels.googlechat.dangerouslyAllowNameMatching: true`.
- Obsolète : `users/<email>` est traité comme un identifiant utilisateur, pas comme une liste d’autorisation d’e-mails.
- Espaces : `spaces/<spaceId>`.

## Points forts de la configuration

```json5
{
  channels: {
    googlechat: {
      enabled: true,
      serviceAccountFile: "/path/to/service-account.json",
      // or serviceAccountRef: { source: "file", provider: "filemain", id: "/channels/googlechat/serviceAccount" }
      audienceType: "app-url",
      audience: "https://gateway.example.com/googlechat",
      webhookPath: "/googlechat",
      botUser: "users/1234567890", // optional; helps mention detection
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
      actions: { reactions: true },
      typingIndicator: "message",
      mediaMaxMb: 20,
    },
  },
}
```

Remarques :

- Les identifiants du compte de service peuvent aussi être transmis en ligne avec `serviceAccount` (chaîne JSON).
- `serviceAccountRef` est également pris en charge (env/file SecretRef), y compris les refs par compte sous `channels.googlechat.accounts.<id>.serviceAccountRef`.
- Le chemin de webhook par défaut est `/googlechat` si `webhookPath` n’est pas défini.
- `dangerouslyAllowNameMatching` réactive la correspondance de principaux e-mail modifiables pour les listes d’autorisation (mode de compatibilité break-glass).
- Les réactions sont disponibles via l’outil `reactions` et `channels action` lorsque `actions.reactions` est activé.
- Les actions de message exposent `send` pour le texte et `upload-file` pour les envois explicites de pièces jointes. `upload-file` accepte `media` / `filePath` / `path` plus les paramètres facultatifs `message`, `filename` et le ciblage de fil.
- `typingIndicator` prend en charge `none`, `message` (par défaut) et `reaction` (la réaction nécessite OAuth utilisateur).
- Les pièces jointes sont téléchargées via l’API Chat et stockées dans le pipeline multimédia (taille plafonnée par `mediaMaxMb`).

Détails des références de secrets : [Gestion des secrets](/fr/gateway/secrets).

## Dépannage

### 405 Method Not Allowed

Si Google Cloud Logs Explorer affiche des erreurs comme :

```
status code: 405, reason phrase: HTTP error response: HTTP/1.1 405 Method Not Allowed
```

Cela signifie que le gestionnaire de webhook n’est pas enregistré. Causes courantes :

1. **Canal non configuré** : la section `channels.googlechat` est absente de votre configuration. Vérifiez avec :

   ```bash
   openclaw config get channels.googlechat
   ```

   S’il renvoie « Config path not found », ajoutez la configuration (voir [Points forts de la configuration](#config-highlights)).

2. **Plugin non activé** : vérifiez le statut du plugin :

   ```bash
   openclaw plugins list | grep googlechat
   ```

   S’il affiche « disabled », ajoutez `plugins.entries.googlechat.enabled: true` à votre configuration.

3. **Gateway non redémarré** : après l’ajout de la configuration, redémarrez le Gateway :

   ```bash
   openclaw gateway restart
   ```

Vérifiez que le canal est en cours d’exécution :

```bash
openclaw channels status
# Should show: Google Chat default: enabled, configured, ...
```

### Autres problèmes

- Vérifiez `openclaw channels status --probe` pour les erreurs d’authentification ou une configuration d’audience manquante.
- Si aucun message n’arrive, confirmez l’URL de webhook + les abonnements aux événements de l’application Chat.
- Si le filtrage par mention bloque les réponses, définissez `botUser` sur le nom de ressource utilisateur de l’application et vérifiez `requireMention`.
- Utilisez `openclaw logs --follow` pendant l’envoi d’un message de test pour voir si les requêtes atteignent le Gateway.

Docs connexes :

- [Configuration du Gateway](/fr/gateway/configuration)
- [Sécurité](/fr/gateway/security)
- [Réactions](/fr/tools/reactions)

## Connexe

- [Vue d’ensemble des canaux](/fr/channels) — tous les canaux pris en charge
- [Appairage](/fr/channels/pairing) — authentification des messages privés et flux d’appairage
- [Groupes](/fr/channels/groups) — comportement des discussions de groupe et filtrage par mention
- [Routage des canaux](/fr/channels/channel-routing) — routage de session pour les messages
- [Sécurité](/fr/gateway/security) — modèle d’accès et renforcement
