---
read_when:
    - Appairer ou reconnecter le nœud Android
    - Déboguer la découverte du Gateway Android ou l’authentification
    - Vérification de la parité de l’historique des discussions entre les clients
summary: 'Application Android (node) : guide d’exploitation de connexion + surface de commandes Connect/Chat/Voice/Canvas'
title: Application Android
x-i18n:
    generated_at: "2026-06-27T17:42:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5c02d4921c3f3011c09e564d83b773a7c155d17a82a6e70d3fd3e973597142f1
    source_path: platforms/android.md
    workflow: 16
---

<Note>
L’application Android officielle est disponible sur [Google Play](https://play.google.com/store/apps/details?id=ai.openclaw.app&hl=en_IN). C’est un nœud compagnon et elle nécessite un OpenClaw Gateway en cours d’exécution. Le code source est également disponible dans le [dépôt OpenClaw](https://github.com/openclaw/openclaw) sous `apps/android` ; consultez [apps/android/README.md](https://github.com/openclaw/openclaw/blob/main/apps/android/README.md) pour les instructions de build.
</Note>

## Aperçu de la prise en charge

- Rôle : application de nœud compagnon (Android n’héberge pas le Gateway).
- Gateway requis : oui (exécutez-le sur macOS, Linux ou Windows via WSL2).
- Installation : [Google Play](https://play.google.com/store/apps/details?id=ai.openclaw.app&hl=en_IN) pour l’application, [Bien démarrer](/fr/start/getting-started) pour le Gateway, puis [Appairage](/fr/channels/pairing).
- Gateway : [Runbook](/fr/gateway) + [Configuration](/fr/gateway/configuration).
  - Protocoles : [protocole Gateway](/fr/gateway/protocol) (nœuds + plan de contrôle).

## Contrôle système

Le contrôle système (launchd/systemd) réside sur l’hôte du Gateway. Consultez [Gateway](/fr/gateway).

## Runbook de connexion

Application de nœud Android ⇄ (mDNS/NSD + WebSocket) ⇄ **Gateway**

Android se connecte directement au WebSocket du Gateway et utilise l’appairage de l’appareil (`role: node`).

Pour Tailscale ou les hôtes publics, Android nécessite un point de terminaison sécurisé :

- Recommandé : Tailscale Serve / Funnel avec `https://<magicdns>` / `wss://<magicdns>`
- Également pris en charge : toute autre URL de Gateway en `wss://` avec un vrai point de terminaison TLS
- Le `ws://` en clair reste pris en charge sur les adresses LAN privées / hôtes `.local`, ainsi que `localhost`, `127.0.0.1` et le pont de l’émulateur Android (`10.0.2.2`)

### Prérequis

- Vous pouvez exécuter le Gateway sur la machine « maître ».
- L’appareil/émulateur Android peut atteindre le WebSocket du Gateway :
  - Même LAN avec mDNS/NSD, **ou**
  - Même tailnet Tailscale avec Bonjour étendu / DNS-SD unicast (voir ci-dessous), **ou**
  - Hôte/port du Gateway manuel (solution de repli)
- L’appairage mobile tailnet/public n’utilise **pas** de points de terminaison IP tailnet bruts en `ws://`. Utilisez plutôt Tailscale Serve ou une autre URL `wss://`.
- Vous pouvez exécuter la CLI (`openclaw`) sur la machine du Gateway (ou via SSH).

### 1) Démarrer le Gateway

```bash
openclaw gateway --port 18789 --verbose
```

Confirmez que les journaux affichent quelque chose comme :

- `listening on ws://0.0.0.0:18789`

Pour l’accès Android distant via Tailscale, préférez Serve/Funnel plutôt qu’une liaison tailnet brute :

```bash
openclaw gateway --tailscale serve
```

Cela fournit à Android un point de terminaison sécurisé `wss://` / `https://`. Une configuration simple `gateway.bind: "tailnet"` ne suffit pas pour un premier appairage Android distant, sauf si vous terminez aussi TLS séparément.

### 2) Vérifier la découverte (facultatif)

Depuis la machine du Gateway :

```bash
dns-sd -B _openclaw-gw._tcp local.
```

Notes de débogage supplémentaires : [Bonjour](/fr/gateway/bonjour).

Si vous avez aussi configuré un domaine de découverte étendue, comparez avec :

```bash
openclaw gateway discover --json
```

Cela affiche `local.` ainsi que le domaine étendu configuré en une seule passe et utilise le point de terminaison
du service résolu au lieu des seuls indices TXT.

#### Découverte tailnet (Vienne ⇄ Londres) via DNS-SD unicast

La découverte NSD/mDNS Android ne traverse pas les réseaux. Si votre nœud Android et le Gateway sont sur des réseaux différents mais connectés via Tailscale, utilisez plutôt Bonjour étendu / DNS-SD unicast.

La découverte seule ne suffit pas pour l’appairage Android tailnet/public. La route découverte nécessite toujours un point de terminaison sécurisé (`wss://` ou Tailscale Serve) :

1. Configurez une zone DNS-SD (exemple `openclaw.internal.`) sur l’hôte du Gateway et publiez des enregistrements `_openclaw-gw._tcp`.
2. Configurez le DNS fractionné Tailscale pour le domaine choisi, pointant vers ce serveur DNS.

Détails et exemple de configuration CoreDNS : [Bonjour](/fr/gateway/bonjour).

### 3) Se connecter depuis Android

Dans l’application Android :

- L’application maintient sa connexion au Gateway active via un **service de premier plan** (notification persistante).
- Ouvrez l’onglet **Connexion**.
- Utilisez le mode **Code de configuration** ou **Manuel**.
- Si la découverte est bloquée, utilisez l’hôte/port manuel dans les **contrôles avancés**. Pour les hôtes LAN privés, `ws://` fonctionne toujours. Pour les hôtes Tailscale/publics, activez TLS et utilisez un point de terminaison `wss://` / Tailscale Serve.

Après le premier appairage réussi, Android se reconnecte automatiquement au lancement :

- Point de terminaison manuel (s’il est activé), sinon
- Le dernier Gateway découvert (au mieux).

### Signaux de présence active

Une fois la session de nœud authentifiée connectée, et lorsque l’application passe en arrière-plan pendant que le
service de premier plan est toujours connecté, Android appelle `node.event` avec
`event: "node.presence.alive"`. Le Gateway l’enregistre comme `lastSeenAtMs`/`lastSeenReason` dans les
métadonnées du nœud/appareil appairé seulement après que l’identité de l’appareil nœud authentifié est connue.

L’application considère que le signal a été correctement enregistré uniquement lorsque la réponse du Gateway inclut
`handled: true`. Les anciens Gateways peuvent accuser réception de `node.event` avec `{ "ok": true }` ; cette réponse est
compatible, mais ne compte pas comme une mise à jour durable de la dernière présence.

### 4) Approuver l’appairage (CLI)

Sur la machine du Gateway :

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Détails de l’appairage : [Appairage](/fr/channels/pairing).

Facultatif : si le nœud Android se connecte toujours depuis un sous-réseau strictement contrôlé,
vous pouvez activer l’approbation automatique au premier appairage de nœud avec des CIDR explicites ou des IP exactes :

```json5
{
  gateway: {
    nodes: {
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24"],
      },
    },
  },
}
```

C’est désactivé par défaut. Cela s’applique uniquement à un nouvel appairage `role: node`
sans portées demandées. L’appairage opérateur/navigateur et tout changement de rôle, portée, métadonnées ou
clé publique nécessitent toujours une approbation manuelle.

### 5) Vérifier que le nœud est connecté

- Via l’état des nœuds :

  ```bash
  openclaw nodes status
  ```

- Via Gateway :

  ```bash
  openclaw gateway call node.list --params "{}"
  ```

### 6) Chat + historique

L’onglet Chat Android prend en charge la sélection de session (`main` par défaut, plus les autres sessions existantes) :

- Historique : `chat.history` (normalisé pour l’affichage ; les balises de directive en ligne sont
  supprimées du texte visible, les charges utiles XML d’appels d’outils en texte brut (y compris
  `<tool_call>...</tool_call>`, `<function_call>...</function_call>`,
  `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` et
  les blocs d’appels d’outils tronqués) ainsi que les jetons de contrôle de modèle ASCII/pleine chasse divulgués
  sont supprimés, les lignes d’assistant constituées uniquement de jetons silencieux comme `NO_REPLY` /
  `no_reply` exacts sont omises, et les lignes trop volumineuses peuvent être remplacées par des espaces réservés)
- Envoi : `chat.send`
- Mises à jour push (au mieux) : `chat.subscribe` → `event:"chat"`

### 7) Canvas + caméra

#### Hôte Gateway Canvas (recommandé pour le contenu web)

Si vous voulez que le nœud affiche du vrai HTML/CSS/JS que l’agent peut modifier sur disque, pointez le nœud vers l’hôte Canvas du Gateway.

<Note>
Les nœuds chargent Canvas depuis le serveur HTTP du Gateway (même port que `gateway.port`, par défaut `18789`).
</Note>

1. Créez `~/.openclaw/workspace/canvas/index.html` sur l’hôte du Gateway.

2. Naviguez le nœud vers celui-ci (LAN) :

```bash
openclaw nodes invoke --node "<Android Node>" --command canvas.navigate --params '{"url":"http://<gateway-hostname>.local:18789/__openclaw__/canvas/"}'
```

Tailnet (facultatif) : si les deux appareils sont sur Tailscale, utilisez un nom MagicDNS ou une IP tailnet au lieu de `.local`, par exemple `http://<gateway-magicdns>:18789/__openclaw__/canvas/`.

Ce serveur injecte un client de rechargement à chaud dans le HTML et recharge lors des changements de fichiers.
Le Gateway sert aussi `/__openclaw__/a2ui/`, mais l’application Android traite les pages A2UI distantes comme uniquement rendues. Les commandes A2UI capables d’actions utilisent la page A2UI intégrée appartenant à l’application avant d’appliquer les messages.

Commandes Canvas (premier plan uniquement) :

- `canvas.eval`, `canvas.snapshot`, `canvas.navigate` (utilisez `{"url":""}` ou `{"url":"/"}` pour revenir à l’échafaudage par défaut). `canvas.snapshot` renvoie `{ format, base64 }` (`format="jpeg"` par défaut).
- A2UI : `canvas.a2ui.push`, `canvas.a2ui.reset` (alias hérité `canvas.a2ui.pushJSONL`). Ces commandes utilisent la page A2UI intégrée appartenant à l’application pour le rendu capable d’actions.

Commandes caméra (premier plan uniquement ; soumises aux autorisations) :

- `camera.snap` (jpg)
- `camera.clip` (mp4)

Consultez [Nœud caméra](/fr/nodes/camera) pour les paramètres et les assistants CLI.

### 8) Voix + surface de commandes Android étendue

- Onglet Voix : Android propose deux modes de capture explicites. **Micro** est une session manuelle de l’onglet Voix qui envoie chaque pause comme un tour de chat et s’arrête lorsque l’application quitte le premier plan ou que l’utilisateur quitte l’onglet Voix. **Conversation** est le mode Conversation continu et continue d’écouter jusqu’à ce qu’il soit désactivé ou que le nœud se déconnecte.
- Le mode Conversation promeut le service de premier plan existant de `connectedDevice` à `connectedDevice|microphone` avant le début de la capture, puis le rétrograde lorsque le mode Conversation s’arrête. Le service de nœud déclare `FOREGROUND_SERVICE_CONNECTED_DEVICE` avec `CHANGE_NETWORK_STATE` ; Android 14+ nécessite aussi la déclaration `FOREGROUND_SERVICE_MICROPHONE`, l’autorisation d’exécution `RECORD_AUDIO` et le type de service microphone à l’exécution.
- Par défaut, Conversation Android utilise la reconnaissance vocale native, le chat Gateway et `talk.speak` via le fournisseur Conversation configuré du Gateway. La synthèse vocale système locale n’est utilisée que lorsque `talk.speak` n’est pas disponible.
- Conversation Android utilise le relais Gateway en temps réel uniquement lorsque `talk.realtime.mode` est `realtime` et que `talk.realtime.transport` est `gateway-relay`.
- Le réveil vocal reste désactivé dans l’UX/le runtime Android.
- Familles de commandes Android supplémentaires (la disponibilité dépend de l’appareil, des autorisations et des paramètres utilisateur) :
  - `device.status`, `device.info`, `device.permissions`, `device.health`
  - `device.apps` uniquement lorsque **Paramètres > Fonctionnalités du téléphone > Applications installées** est activé ; liste par défaut les applications visibles dans le lanceur.
  - `notifications.list`, `notifications.actions` (voir [Transfert de notifications](#notification-forwarding) ci-dessous)
  - `photos.latest`
  - `contacts.search`, `contacts.add`
  - `calendar.events`, `calendar.add`
  - `callLog.search`
  - `sms.search`
  - `motion.activity`, `motion.pedometer`

## Points d’entrée de l’assistant

Android prend en charge le lancement d’OpenClaw depuis le déclencheur d’assistant système (Google
Assistant). Une fois configuré, maintenir le bouton d’accueil ou dire « Hey Google, demande à
OpenClaw... » ouvre l’application et transmet la requête dans le compositeur de chat.

Cela utilise les métadonnées Android **App Actions** déclarées dans le manifeste de l’application. Aucune
configuration supplémentaire n’est nécessaire côté Gateway : l’intention de l’assistant est
entièrement gérée par l’application Android et transférée comme un message de chat normal.

<Note>
La disponibilité d’App Actions dépend de l’appareil, de la version des services Google Play
et du fait que l’utilisateur ait défini OpenClaw comme application d’assistant par défaut.
</Note>

## Transfert de notifications

Android peut transférer les notifications de l’appareil au Gateway sous forme d’événements. Plusieurs contrôles permettent de limiter quelles notifications sont transférées et quand.

| Clé                              | Type           | Description                                                                                       |
| -------------------------------- | -------------- | ------------------------------------------------------------------------------------------------- |
| `notifications.allowPackages`    | string[]       | Transférer uniquement les notifications provenant de ces noms de packages. Si défini, tous les autres packages sont ignorés. |
| `notifications.denyPackages`     | string[]       | Ne jamais transférer les notifications provenant de ces noms de packages. Appliqué après `allowPackages`. |
| `notifications.quietHours.start` | string (HH:mm) | Début de la plage d’heures silencieuses (heure locale de l’appareil). Les notifications sont supprimées pendant cette plage. |
| `notifications.quietHours.end`   | string (HH:mm) | Fin de la plage d’heures silencieuses.                                                           |
| `notifications.rateLimit`        | number         | Nombre maximal de notifications transférées par package et par minute. Les notifications en excès sont abandonnées. |

Le sélecteur de notifications utilise également un comportement plus sûr pour les événements de notification transférés, afin d’éviter le transfert accidentel de notifications système sensibles.

Exemple de configuration :

```json5
{
  notifications: {
    allowPackages: ["com.slack", "com.whatsapp"],
    denyPackages: ["com.android.systemui"],
    quietHours: {
      start: "22:00",
      end: "07:00",
    },
    rateLimit: 5,
  },
}
```

<Note>
Le transfert des notifications nécessite l’autorisation Android Notification Listener. L’application la demande pendant la configuration.
</Note>

## Associé

- [Application iOS](/fr/platforms/ios)
- [Nœuds](/fr/nodes)
- [Dépannage des nœuds Android](/fr/nodes/troubleshooting)
