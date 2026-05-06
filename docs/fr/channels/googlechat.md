---
read_when:
    - Travailler sur les fonctionnalités du canal Google Chat
summary: État de prise en charge, fonctionnalités et configuration de l’application Google Chat
title: Google Chat
x-i18n:
    generated_at: "2026-05-06T07:13:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2b6ac581578df0fccfb560057e4b30ec359a368cb671519a153e1c727d7b920c
    source_path: channels/googlechat.md
    workflow: 16
---

Statut : plugin téléchargeable pour les messages privés et les espaces via les webhooks de l’API Google Chat (HTTP uniquement).

## Installation

Installez Google Chat avant de configurer le canal :

```bash
openclaw plugins install @openclaw/googlechat
```

Checkout local (lors de l’exécution depuis un dépôt git) :

```bash
openclaw plugins install ./path/to/local/googlechat-plugin
```

## Configuration rapide (débutant)

1. Créez un projet Google Cloud et activez la **Google Chat API**.
   - Accédez à : [Identifiants de la Google Chat API](https://console.cloud.google.com/apis/api/chat.googleapis.com/credentials)
   - Activez l’API si elle ne l’est pas déjà.
2. Créez un **compte de service** :
   - Appuyez sur **Créer des identifiants** > **Compte de service**.
   - Donnez-lui le nom que vous voulez (par exemple, `openclaw-chat`).
   - Laissez les autorisations vides (appuyez sur **Continuer**).
   - Laissez les comptes principaux avec accès vides (appuyez sur **OK**).
3. Créez et téléchargez la **clé JSON** :
   - Dans la liste des comptes de service, cliquez sur celui que vous venez de créer.
   - Accédez à l’onglet **Clés**.
   - Cliquez sur **Ajouter une clé** > **Créer une clé**.
   - Sélectionnez **JSON** et appuyez sur **Créer**.
4. Stockez le fichier JSON téléchargé sur votre hôte Gateway (par exemple, `~/.openclaw/googlechat-service-account.json`).
5. Créez une application Google Chat dans la [configuration Chat de Google Cloud Console](https://console.cloud.google.com/apis/api/chat.googleapis.com/hangouts-chat) :
   - Renseignez les **informations de l’application** :
     - **Nom de l’application** : (par exemple `OpenClaw`)
     - **URL de l’avatar** : (par exemple `https://openclaw.ai/logo.png`)
     - **Description** : (par exemple `Assistant IA personnel`)
   - Activez les **fonctionnalités interactives**.
   - Sous **Fonctionnalité**, cochez **Rejoindre les espaces et les conversations de groupe**.
   - Sous **Paramètres de connexion**, sélectionnez **URL de point de terminaison HTTP**.
   - Sous **Déclencheurs**, sélectionnez **Utiliser une URL de point de terminaison HTTP commune pour tous les déclencheurs** et définissez-la sur l’URL publique de votre Gateway suivie de `/googlechat`.
     - _Conseil : exécutez `openclaw status` pour trouver l’URL publique de votre Gateway._
   - Sous **Visibilité**, cochez **Rendre cette application Chat disponible pour des personnes et des groupes spécifiques dans `<Your Domain>`**.
   - Saisissez votre adresse e-mail (par exemple `user@example.com`) dans la zone de texte.
   - Cliquez sur **Enregistrer** en bas.
6. **Activez le statut de l’application** :
   - Après l’enregistrement, **actualisez la page**.
   - Recherchez la section **Statut de l’application** (généralement près du haut ou du bas après l’enregistrement).
   - Changez le statut en **En direct - disponible pour les utilisateurs**.
   - Cliquez à nouveau sur **Enregistrer**.
7. Configurez OpenClaw avec le chemin du compte de service et l’audience du webhook :
   - Env : `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE=/path/to/service-account.json`
   - Ou configuration : `channels.googlechat.serviceAccountFile: "/path/to/service-account.json"`.
8. Définissez le type et la valeur d’audience du webhook (correspond à la configuration de votre application Chat).
9. Démarrez le Gateway. Google Chat enverra des requêtes POST vers votre chemin de webhook.

## Ajouter à Google Chat

Une fois le Gateway en cours d’exécution et votre e-mail ajouté à la liste de visibilité :

1. Accédez à [Google Chat](https://chat.google.com/).
2. Cliquez sur l’icône **+** (plus) à côté de **Messages privés**.
3. Dans la barre de recherche (où vous ajoutez habituellement des personnes), saisissez le **nom de l’application** que vous avez configuré dans Google Cloud Console.
   - **Remarque** : le bot n’apparaîtra _pas_ dans la liste de navigation « Marketplace », car il s’agit d’une application privée. Vous devez le rechercher par son nom.
4. Sélectionnez votre bot dans les résultats.
5. Cliquez sur **Ajouter** ou **Chat** pour démarrer une conversation 1:1.
6. Envoyez « Bonjour » pour déclencher l’assistant !

## URL publique (webhook uniquement)

Les webhooks Google Chat nécessitent un point de terminaison HTTPS public. Pour des raisons de sécurité, **n’exposez que le chemin `/googlechat`** à Internet. Gardez le tableau de bord OpenClaw et les autres points de terminaison sensibles sur votre réseau privé.

### Option A : Tailscale Funnel (recommandé)

Utilisez Tailscale Serve pour le tableau de bord privé et Funnel pour le chemin de webhook public. Cela garde `/` privé tout en exposant uniquement `/googlechat`.

1. **Vérifiez l’adresse à laquelle votre Gateway est lié :**

   ```bash
   ss -tlnp | grep 18789
   ```

   Notez l’adresse IP (par exemple, `127.0.0.1`, `0.0.0.0` ou votre adresse IP Tailscale comme `100.x.x.x`).

2. **Exposez le tableau de bord au tailnet uniquement (port 8443) :**

   ```bash
   # If bound to localhost (127.0.0.1 or 0.0.0.0):
   tailscale serve --bg --https 8443 http://127.0.0.1:18789

   # If bound to Tailscale IP only (e.g., 100.106.161.80):
   tailscale serve --bg --https 8443 http://100.106.161.80:18789
   ```

3. **Exposez publiquement uniquement le chemin de webhook :**

   ```bash
   # If bound to localhost (127.0.0.1 or 0.0.0.0):
   tailscale funnel --bg --set-path /googlechat http://127.0.0.1:18789/googlechat

   # If bound to Tailscale IP only (e.g., 100.106.161.80):
   tailscale funnel --bg --set-path /googlechat http://100.106.161.80:18789/googlechat
   ```

4. **Autorisez le nœud pour l’accès à Funnel :**
   Si vous y êtes invité, consultez l’URL d’autorisation affichée dans la sortie pour activer Funnel pour ce nœud dans votre politique de tailnet.

5. **Vérifiez la configuration :**

   ```bash
   tailscale serve status
   tailscale funnel status
   ```

Votre URL de webhook publique sera :
`https://<node-name>.<tailnet>.ts.net/googlechat`

Votre tableau de bord privé reste limité au tailnet :
`https://<node-name>.<tailnet>.ts.net:8443/`

Utilisez l’URL publique (sans `:8443`) dans la configuration de l’application Google Chat.

> Remarque : cette configuration persiste après les redémarrages. Pour la supprimer plus tard, exécutez `tailscale funnel reset` et `tailscale serve reset`.

### Option B : proxy inverse (Caddy)

Si vous utilisez un proxy inverse comme Caddy, ne proxyfiez que le chemin spécifique :

```caddy
your-domain.com {
    reverse_proxy /googlechat* localhost:18789
}
```

Avec cette configuration, toute requête vers `your-domain.com/` sera ignorée ou renvoyée en 404, tandis que `your-domain.com/googlechat` sera acheminée en toute sécurité vers OpenClaw.

### Option C : Cloudflare Tunnel

Configurez les règles d’entrée de votre tunnel pour acheminer uniquement le chemin de webhook :

- **Chemin** : `/googlechat` -> `http://localhost:18789/googlechat`
- **Règle par défaut** : HTTP 404 (introuvable)

## Fonctionnement

1. Google Chat envoie des POST de webhook au Gateway. Chaque requête inclut un en-tête `Authorization: Bearer <token>`.
   - OpenClaw vérifie l’authentification bearer avant de lire/analyser les corps complets des webhooks lorsque l’en-tête est présent.
   - Les requêtes Google Workspace Add-on qui transportent `authorizationEventObject.systemIdToken` dans le corps sont prises en charge via un budget de corps pré-authentification plus strict.
2. OpenClaw vérifie le jeton par rapport aux `audienceType` + `audience` configurés :
   - `audienceType: "app-url"` → l’audience est votre URL de webhook HTTPS.
   - `audienceType: "project-number"` → l’audience est le numéro de projet Cloud.
3. Les messages sont routés par espace :
   - Les messages privés utilisent la clé de session `agent:<agentId>:googlechat:direct:<spaceId>`.
   - Les espaces utilisent la clé de session `agent:<agentId>:googlechat:group:<spaceId>`.
4. L’accès aux messages privés repose par défaut sur l’appairage. Les expéditeurs inconnus reçoivent un code d’appairage ; approuvez avec :
   - `openclaw pairing approve googlechat <code>`
5. Les espaces de groupe nécessitent par défaut une @-mention. Utilisez `botUser` si la détection des mentions a besoin du nom d’utilisateur de l’application.

## Cibles

Utilisez ces identifiants pour la livraison et les listes d’autorisation :

- Messages privés : `users/<userId>` (recommandé).
- L’e-mail brut `name@example.com` est mutable et utilisé uniquement pour la correspondance de liste d’autorisation directe lorsque `channels.googlechat.dangerouslyAllowNameMatching: true`.
- Obsolète : `users/<email>` est traité comme un ID utilisateur, pas comme une liste d’autorisation d’e-mail.
- Espaces : `spaces/<spaceId>`.

## Points clés de configuration

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

Remarques :

- Les identifiants du compte de service peuvent également être transmis en ligne avec `serviceAccount` (chaîne JSON).
- `serviceAccountRef` est également pris en charge (SecretRef env/fichier), y compris les références par compte sous `channels.googlechat.accounts.<id>.serviceAccountRef`.
- Le chemin de webhook par défaut est `/googlechat` si `webhookPath` n’est pas défini.
- `dangerouslyAllowNameMatching` réactive la correspondance de principal e-mail mutable pour les listes d’autorisation (mode de compatibilité d’urgence).
- Les réactions sont disponibles via l’outil `reactions` et `channels action` lorsque `actions.reactions` est activé.
- Les actions de message exposent `send` pour le texte et `upload-file` pour les envois explicites de pièces jointes. `upload-file` accepte `media` / `filePath` / `path` ainsi que les paramètres facultatifs `message`, `filename` et le ciblage de fil.
- `typingIndicator` prend en charge `none`, `message` (par défaut) et `reaction` (la réaction nécessite OAuth utilisateur).
- Les pièces jointes sont téléchargées via l’API Chat et stockées dans le pipeline média (taille plafonnée par `mediaMaxMb`).

Détails des références de secrets : [Gestion des secrets](/fr/gateway/secrets).

## Dépannage

### 405 Method Not Allowed

Si Google Cloud Logs Explorer affiche des erreurs comme :

```
status code: 405, reason phrase: HTTP error response: HTTP/1.1 405 Method Not Allowed
```

Cela signifie que le gestionnaire de webhook n’est pas enregistré. Causes courantes :

1. **Canal non configuré** : la section `channels.googlechat` est absente de votre configuration. Vérifiez avec :

   ```bash
   openclaw config get channels.googlechat
   ```

   Si cela renvoie « Config path not found », ajoutez la configuration (voir [Points clés de configuration](#config-highlights)).

2. **Plugin non activé** : vérifiez le statut du plugin :

   ```bash
   openclaw plugins list | grep googlechat
   ```

   Si cela affiche « disabled », ajoutez `plugins.entries.googlechat.enabled: true` à votre configuration.

3. **Gateway non redémarré** : après avoir ajouté la configuration, redémarrez le Gateway :

   ```bash
   openclaw gateway restart
   ```

Vérifiez que le canal est en cours d’exécution :

```bash
openclaw channels status
# Should show: Google Chat default: enabled, configured, ...
```

### Autres problèmes

- Vérifiez `openclaw channels status --probe` pour les erreurs d’authentification ou une configuration d’audience manquante.
- Si aucun message n’arrive, confirmez l’URL de webhook de l’application Chat et les abonnements aux événements.
- Si le filtrage par mention bloque les réponses, définissez `botUser` sur le nom de ressource utilisateur de l’application et vérifiez `requireMention`.
- Utilisez `openclaw logs --follow` pendant l’envoi d’un message de test pour voir si les requêtes atteignent le Gateway.

Documentation associée :

- [Configuration du Gateway](/fr/gateway/configuration)
- [Sécurité](/fr/gateway/security)
- [Réactions](/fr/tools/reactions)

## Associé

- [Vue d’ensemble des canaux](/fr/channels) — tous les canaux pris en charge
- [Appairage](/fr/channels/pairing) — authentification des messages privés et flux d’appairage
- [Groupes](/fr/channels/groups) — comportement des conversations de groupe et filtrage par mention
- [Routage des canaux](/fr/channels/channel-routing) — routage de session pour les messages
- [Sécurité](/fr/gateway/security) — modèle d’accès et durcissement
