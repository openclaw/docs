---
read_when:
    - Appairage ou reconnexion du nœud Android
    - Débogage de la découverte du Gateway Android ou de l’authentification
    - Vérification de la parité de l’historique de discussion entre les clients
summary: 'Application Android (Node) : runbook de connexion + surface de commande Connexion/Discussion/Voix/Canvas'
title: Application Android
x-i18n:
    generated_at: "2026-04-30T07:36:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: ae8bec406a006165f124f305e00c848f5527d43dba3cbcd07bd0d7e6f0dcc247
    source_path: platforms/android.md
    workflow: 16
---

<Note>
L’application Android n’a pas encore été publiée publiquement. Le code source est disponible dans le [dépôt OpenClaw](https://github.com/openclaw/openclaw) sous `apps/android`. Vous pouvez la compiler vous-même avec Java 17 et le SDK Android (`./gradlew :app:assemblePlayDebug`). Consultez [apps/android/README.md](https://github.com/openclaw/openclaw/blob/main/apps/android/README.md) pour les instructions de compilation.
</Note>

## Aperçu de la prise en charge

- Rôle : application de nœud compagnon (Android n’héberge pas le Gateway).
- Gateway requis : oui (exécutez-le sur macOS, Linux ou Windows via WSL2).
- Installation : [Bien démarrer](/fr/start/getting-started) + [Appairage](/fr/channels/pairing).
- Gateway : [Runbook](/fr/gateway) + [Configuration](/fr/gateway/configuration).
  - Protocoles : [Protocole Gateway](/fr/gateway/protocol) (nœuds + plan de contrôle).

## Contrôle système

Le contrôle système (launchd/systemd) réside sur l’hôte du Gateway. Consultez [Gateway](/fr/gateway).

## Runbook de connexion

Application de nœud Android ⇄ (mDNS/NSD + WebSocket) ⇄ **Gateway**

Android se connecte directement au WebSocket du Gateway et utilise l’appairage d’appareil (`role: node`).

Pour Tailscale ou les hôtes publics, Android nécessite un point de terminaison sécurisé :

- Préféré : Tailscale Serve / Funnel avec `https://<magicdns>` / `wss://<magicdns>`
- Également pris en charge : toute autre URL Gateway `wss://` avec un vrai point de terminaison TLS
- Le texte clair `ws://` reste pris en charge sur les adresses LAN privées / hôtes `.local`, ainsi que `localhost`, `127.0.0.1` et le pont de l’émulateur Android (`10.0.2.2`)

### Prérequis

- Vous pouvez exécuter le Gateway sur la machine « maître ».
- L’appareil/émulateur Android peut atteindre le WebSocket du gateway :
  - Même LAN avec mDNS/NSD, **ou**
  - Même tailnet Tailscale avec Wide-Area Bonjour / DNS-SD unicast (voir ci-dessous), **ou**
  - Hôte/port de gateway manuel (solution de secours)
- L’appairage mobile tailnet/public n’utilise **pas** de points de terminaison IP tailnet bruts `ws://`. Utilisez plutôt Tailscale Serve ou une autre URL `wss://`.
- Vous pouvez exécuter le CLI (`openclaw`) sur la machine gateway (ou via SSH).

### 1) Démarrer le Gateway

```bash
openclaw gateway --port 18789 --verbose
```

Vérifiez dans les journaux que vous voyez quelque chose comme :

- `listening on ws://0.0.0.0:18789`

Pour l’accès Android distant via Tailscale, préférez Serve/Funnel plutôt qu’une liaison tailnet brute :

```bash
openclaw gateway --tailscale serve
```

Cela donne à Android un point de terminaison sécurisé `wss://` / `https://`. Une configuration simple `gateway.bind: "tailnet"` ne suffit pas pour un premier appairage Android distant, sauf si vous terminez également TLS séparément.

### 2) Vérifier la découverte (facultatif)

Depuis la machine gateway :

```bash
dns-sd -B _openclaw-gw._tcp local.
```

Notes de débogage supplémentaires : [Bonjour](/fr/gateway/bonjour).

Si vous avez également configuré un domaine de découverte wide-area, comparez avec :

```bash
openclaw gateway discover --json
```

Cela affiche `local.` ainsi que le domaine wide-area configuré en une seule passe et utilise le
point de terminaison de service résolu plutôt que des indices uniquement TXT.

#### Découverte tailnet (Vienne ⇄ Londres) via DNS-SD unicast

La découverte NSD/mDNS Android ne traverse pas les réseaux. Si votre nœud Android et le gateway sont sur des réseaux différents mais connectés via Tailscale, utilisez plutôt Wide-Area Bonjour / DNS-SD unicast.

La découverte seule ne suffit pas pour l’appairage Android tailnet/public. La route découverte nécessite toujours un point de terminaison sécurisé (`wss://` ou Tailscale Serve) :

1. Configurez une zone DNS-SD (exemple `openclaw.internal.`) sur l’hôte du gateway et publiez les enregistrements `_openclaw-gw._tcp`.
2. Configurez le DNS fractionné Tailscale pour votre domaine choisi, pointant vers ce serveur DNS.

Détails et exemple de configuration CoreDNS : [Bonjour](/fr/gateway/bonjour).

### 3) Se connecter depuis Android

Dans l’application Android :

- L’application maintient sa connexion gateway active via un **service au premier plan** (notification persistante).
- Ouvrez l’onglet **Connexion**.
- Utilisez le mode **Code de configuration** ou **Manuel**.
- Si la découverte est bloquée, utilisez l’hôte/le port manuel dans **Contrôles avancés**. Pour les hôtes LAN privés, `ws://` fonctionne toujours. Pour les hôtes Tailscale/publics, activez TLS et utilisez un point de terminaison `wss://` / Tailscale Serve.

Après le premier appairage réussi, Android se reconnecte automatiquement au lancement :

- Point de terminaison manuel (si activé), sinon
- Le dernier gateway découvert (au mieux).

### Signaux de présence active

Une fois la session de nœud authentifiée connectée, et lorsque l’application passe en arrière-plan alors que le
service au premier plan est toujours connecté, Android appelle `node.event` avec
`event: "node.presence.alive"`. Le gateway enregistre cela comme `lastSeenAtMs`/`lastSeenReason` dans les
métadonnées du nœud/de l’appareil appairé uniquement après que l’identité authentifiée de l’appareil nœud est connue.

L’application considère que le signal a été correctement enregistré uniquement lorsque la réponse du gateway inclut
`handled: true`. Les gateways plus anciens peuvent acquitter `node.event` avec `{ "ok": true }` ; cette réponse est
compatible, mais ne compte pas comme une mise à jour durable du dernier état vu.

### 4) Approuver l’appairage (CLI)

Sur la machine gateway :

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Détails de l’appairage : [Appairage](/fr/channels/pairing).

Facultatif : si le nœud Android se connecte toujours depuis un sous-réseau strictement contrôlé,
vous pouvez activer l’auto-approbation du premier appairage de nœud avec des CIDR explicites ou des IP exactes :

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

Cette option est désactivée par défaut. Elle s’applique uniquement au nouvel appairage `role: node`
sans portées demandées. L’appairage opérateur/navigateur et toute modification de rôle, de portée, de métadonnées ou
de clé publique nécessitent toujours une approbation manuelle.

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
  sont supprimés, les lignes d’assistant composées uniquement de jetons silencieux comme exactement `NO_REPLY` /
  `no_reply` sont omises, et les lignes surdimensionnées peuvent être remplacées par des espaces réservés)
- Envoi : `chat.send`
- Mises à jour push (au mieux) : `chat.subscribe` → `event:"chat"`

### 7) Canvas + caméra

#### Hôte Canvas du Gateway (recommandé pour le contenu web)

Si vous souhaitez que le nœud affiche du vrai HTML/CSS/JS que l’agent peut modifier sur disque, pointez le nœud vers l’hôte Canvas du Gateway.

<Note>
Les nœuds chargent canvas depuis le serveur HTTP du Gateway (même port que `gateway.port`, par défaut `18789`).
</Note>

1. Créez `~/.openclaw/workspace/canvas/index.html` sur l’hôte du gateway.

2. Naviguez le nœud vers celui-ci (LAN) :

```bash
openclaw nodes invoke --node "<Android Node>" --command canvas.navigate --params '{"url":"http://<gateway-hostname>.local:18789/__openclaw__/canvas/"}'
```

Tailnet (facultatif) : si les deux appareils sont sur Tailscale, utilisez un nom MagicDNS ou une IP tailnet au lieu de `.local`, par exemple `http://<gateway-magicdns>:18789/__openclaw__/canvas/`.

Ce serveur injecte un client de rechargement à chaud dans le HTML et recharge lors des modifications de fichiers.
L’hôte A2UI réside à `http://<gateway-host>:18789/__openclaw__/a2ui/`.

Commandes Canvas (premier plan uniquement) :

- `canvas.eval`, `canvas.snapshot`, `canvas.navigate` (utilisez `{"url":""}` ou `{"url":"/"}` pour revenir à l’échafaudage par défaut). `canvas.snapshot` renvoie `{ format, base64 }` (`format="jpeg"` par défaut).
- A2UI : `canvas.a2ui.push`, `canvas.a2ui.reset` (alias hérité `canvas.a2ui.pushJSONL`)

Commandes caméra (premier plan uniquement ; soumises aux autorisations) :

- `camera.snap` (jpg)
- `camera.clip` (mp4)

Consultez [Nœud caméra](/fr/nodes/camera) pour les paramètres et assistants CLI.

### 8) Voix + surface de commandes Android étendue

- Onglet Voix : Android dispose de deux modes de capture explicites. **Micro** est une session manuelle de l’onglet Voix qui envoie chaque pause comme un tour de chat et s’arrête lorsque l’application quitte le premier plan ou que l’utilisateur quitte l’onglet Voix. **Parler** est le mode Parler continu et continue d’écouter jusqu’à ce qu’il soit désactivé ou que le nœud se déconnecte.
- Le mode Parler promeut le service au premier plan existant de `dataSync` à `dataSync|microphone` avant le début de la capture, puis le rétrograde lorsque le mode Parler s’arrête. Android 14+ exige la déclaration `FOREGROUND_SERVICE_MICROPHONE`, l’autorisation d’exécution `RECORD_AUDIO` et le type de service microphone à l’exécution.
- Les réponses vocales utilisent `talk.speak` via le fournisseur Talk gateway configuré. Le TTS système local n’est utilisé que lorsque `talk.speak` est indisponible.
- Le réveil vocal reste désactivé dans l’UX/le runtime Android.
- Familles de commandes Android supplémentaires (la disponibilité dépend de l’appareil + des autorisations) :
  - `device.status`, `device.info`, `device.permissions`, `device.health`
  - `notifications.list`, `notifications.actions` (voir [Transfert de notifications](#notification-forwarding) ci-dessous)
  - `photos.latest`
  - `contacts.search`, `contacts.add`
  - `calendar.events`, `calendar.add`
  - `callLog.search`
  - `sms.search`
  - `motion.activity`, `motion.pedometer`

## Points d’entrée de l’assistant

Android prend en charge le lancement d’OpenClaw depuis le déclencheur d’assistant système (Google
Assistant). Une fois configuré, maintenir le bouton d’accueil ou dire « Hey Google, ask
OpenClaw... » ouvre l’application et transmet la demande au compositeur de chat.

Cela utilise les métadonnées Android **App Actions** déclarées dans le manifeste de l’application. Aucune
configuration supplémentaire n’est nécessaire côté gateway : l’intent de l’assistant est
géré entièrement par l’application Android et transmis comme message de chat normal.

<Note>
La disponibilité d’App Actions dépend de l’appareil, de la version de Google Play Services
et du fait que l’utilisateur ait défini OpenClaw comme application d’assistant par défaut.
</Note>

## Transfert de notifications

Android peut transférer les notifications de l’appareil vers le gateway sous forme d’événements. Plusieurs contrôles permettent de définir quelles notifications sont transférées et quand.

| Clé                              | Type           | Description                                                                                       |
| -------------------------------- | -------------- | ------------------------------------------------------------------------------------------------- |
| `notifications.allowPackages`    | string[]       | Transférer uniquement les notifications de ces noms de package. Si défini, tous les autres packages sont ignorés. |
| `notifications.denyPackages`     | string[]       | Ne jamais transférer les notifications de ces noms de package. Appliqué après `allowPackages`.    |
| `notifications.quietHours.start` | string (HH:mm) | Début de la plage d’heures calmes (heure locale de l’appareil). Les notifications sont supprimées pendant cette plage. |
| `notifications.quietHours.end`   | string (HH:mm) | Fin de la plage d’heures calmes.                                                                  |
| `notifications.rateLimit`        | number         | Nombre maximal de notifications transférées par package et par minute. Les notifications excédentaires sont abandonnées. |

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
Le transfert de notifications nécessite l’autorisation Android Notification Listener. L’application la demande pendant la configuration.
</Note>

## Associés

- [Application iOS](/fr/platforms/ios)
- [Nœuds](/fr/nodes)
- [Dépannage du nœud Android](/fr/nodes/troubleshooting)
