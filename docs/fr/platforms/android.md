---
read_when:
    - Appairer ou reconnecter le nœud Android
    - Déboguer la découverte de gateway ou l’authentification Android
    - Vérifier la parité de l’historique de chat entre les clients
summary: 'Application Android (nœud) : runbook de connexion + surface de commande Connect/Chat/Voice/Canvas'
title: Application Android
x-i18n:
    generated_at: "2026-04-26T11:34:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5a47c07e3301ad7b98f4827c9c34c42b7ba2f92c55aabd7b49606ab688191b66
    source_path: platforms/android.md
    workflow: 15
---

> **Remarque :** l’application Android n’a pas encore été publiée publiquement. Le code source est disponible dans le [dépôt OpenClaw](https://github.com/openclaw/openclaw) sous `apps/android`. Vous pouvez la compiler vous-même avec Java 17 et le SDK Android (`./gradlew :app:assemblePlayDebug`). Voir [apps/android/README.md](https://github.com/openclaw/openclaw/blob/main/apps/android/README.md) pour les instructions de compilation.

## Aperçu de la prise en charge

- Rôle : application nœud compagnon (Android n’héberge pas la Gateway).
- Gateway requise : oui (exécutez-la sur macOS, Linux ou Windows via WSL2).
- Installation : [Prise en main](/fr/start/getting-started) + [Appairage](/fr/channels/pairing).
- Gateway : [Runbook](/fr/gateway) + [Configuration](/fr/gateway/configuration).
  - Protocoles : [Protocole Gateway](/fr/gateway/protocol) (nœuds + plan de contrôle).

## Contrôle système

Le contrôle système (launchd/systemd) se trouve sur l’hôte Gateway. Voir [Gateway](/fr/gateway).

## Runbook de connexion

Application nœud Android ⇄ (mDNS/NSD + WebSocket) ⇄ **Gateway**

Android se connecte directement au WebSocket de la Gateway et utilise l’appairage d’appareil (`role: node`).

Pour Tailscale ou les hôtes publics, Android exige un point de terminaison sécurisé :

- Préféré : Tailscale Serve / Funnel avec `https://<magicdns>` / `wss://<magicdns>`
- Également pris en charge : toute autre URL Gateway `wss://` avec un vrai point de terminaison TLS
- Le texte clair `ws://` reste pris en charge sur les adresses de LAN privé / hôtes `.local`, ainsi que `localhost`, `127.0.0.1` et le pont d’émulateur Android (`10.0.2.2`)

### Prérequis

- Vous pouvez exécuter la Gateway sur la machine « maître ».
- L’appareil/l’émulateur Android peut atteindre le WebSocket gateway :
  - sur le même LAN avec mDNS/NSD, **ou**
  - sur le même tailnet Tailscale en utilisant Wide-Area Bonjour / unicast DNS-SD (voir ci-dessous), **ou**
  - via hôte/port gateway saisi manuellement (secours)
- L’appairage mobile tailnet/public n’utilise **pas** de points de terminaison `ws://` bruts d’IP tailnet. Utilisez plutôt Tailscale Serve ou une autre URL `wss://`.
- Vous pouvez exécuter le CLI (`openclaw`) sur la machine gateway (ou via SSH).

### 1) Démarrer la Gateway

```bash
openclaw gateway --port 18789 --verbose
```

Confirmez dans les journaux que vous voyez quelque chose comme :

- `listening on ws://0.0.0.0:18789`

Pour l’accès Android distant via Tailscale, préférez Serve/Funnel à une liaison tailnet brute :

```bash
openclaw gateway --tailscale serve
```

Cela donne à Android un point de terminaison sécurisé `wss://` / `https://`. Une simple configuration `gateway.bind: "tailnet"` ne suffit pas pour un premier appairage Android distant sauf si vous terminez aussi TLS séparément.

### 2) Vérifier la découverte (facultatif)

Depuis la machine gateway :

```bash
dns-sd -B _openclaw-gw._tcp local.
```

Plus de notes de débogage : [Bonjour](/fr/gateway/bonjour).

Si vous avez aussi configuré un domaine de découverte wide-area, comparez avec :

```bash
openclaw gateway discover --json
```

Cela affiche `local.` plus le domaine wide-area configuré en une seule passe et utilise le point de terminaison de service résolu au lieu d’indices TXT uniquement.

#### Découverte tailnet (Vienne ⇄ Londres) via unicast DNS-SD

La découverte Android NSD/mDNS ne traverse pas les réseaux. Si votre nœud Android et la gateway sont sur des réseaux différents mais connectés via Tailscale, utilisez plutôt Wide-Area Bonjour / unicast DNS-SD.

La découverte seule ne suffit pas pour l’appairage Android tailnet/public. La route découverte nécessite quand même un point de terminaison sécurisé (`wss://` ou Tailscale Serve) :

1. Configurez une zone DNS-SD (exemple `openclaw.internal.`) sur l’hôte gateway et publiez les enregistrements `_openclaw-gw._tcp`.
2. Configurez le split DNS Tailscale pour votre domaine choisi en pointant vers ce serveur DNS.

Détails et exemple de configuration CoreDNS : [Bonjour](/fr/gateway/bonjour).

### 3) Se connecter depuis Android

Dans l’application Android :

- L’application garde sa connexion gateway active via un **service de premier plan** (notification persistante).
- Ouvrez l’onglet **Connect**.
- Utilisez le mode **Setup Code** ou **Manual**.
- Si la découverte est bloquée, utilisez l’hôte/port manuel dans **Advanced controls**. Pour les hôtes de LAN privé, `ws://` fonctionne toujours. Pour les hôtes Tailscale/publics, activez TLS et utilisez un point de terminaison `wss://` / Tailscale Serve.

Après le premier appairage réussi, Android se reconnecte automatiquement au lancement :

- au point de terminaison manuel (s’il est activé), sinon
- à la dernière gateway découverte (au mieux).

### 4) Approuver l’appairage (CLI)

Sur la machine gateway :

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Détails sur l’appairage : [Appairage](/fr/channels/pairing).

Facultatif : si le nœud Android se connecte toujours depuis un sous-réseau strictement contrôlé,
vous pouvez autoriser l’auto-approbation du premier appairage de nœud avec des CIDR explicites ou des IP exactes :

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

Ceci est désactivé par défaut. Cela s’applique uniquement à un nouvel appairage `role: node` sans périmètres demandés. L’appairage operator/Browser et tout changement de rôle, de périmètre, de métadonnées ou de clé publique exigent toujours une approbation manuelle.

### 5) Vérifier que le nœud est connecté

- Via l’état des nœuds :

  ```bash
  openclaw nodes status
  ```

- Via la Gateway :

  ```bash
  openclaw gateway call node.list --params "{}"
  ```

### 6) Chat + historique

L’onglet Chat Android prend en charge la sélection de session (par défaut `main`, plus les autres sessions existantes) :

- Historique : `chat.history` (normalisé pour l’affichage ; les balises de directives en ligne sont retirées du texte visible, les charges utiles XML d’appels d’outils en texte brut (y compris `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` et les blocs tronqués d’appels d’outils) ainsi que les jetons de contrôle de modèle ASCII/pleine largeur divulgués sont retirés, les lignes assistant qui ne contiennent que des silent tokens tels que `NO_REPLY` / `no_reply` exacts sont omises, et les lignes surdimensionnées peuvent être remplacées par des placeholders)
- Envoi : `chat.send`
- Mises à jour push (au mieux) : `chat.subscribe` → `event:"chat"`

### 7) Canvas + caméra

#### Hôte Canvas Gateway (recommandé pour le contenu Web)

Si vous voulez que le nœud affiche du HTML/CSS/JS réel que l’agent peut modifier sur disque, pointez le nœud vers l’hôte canvas de la Gateway.

Remarque : les nœuds chargent le canvas depuis le serveur HTTP Gateway (même port que `gateway.port`, `18789` par défaut).

1. Créez `~/.openclaw/workspace/canvas/index.html` sur l’hôte gateway.

2. Naviguez le nœud vers celui-ci (LAN) :

```bash
openclaw nodes invoke --node "<Android Node>" --command canvas.navigate --params '{"url":"http://<gateway-hostname>.local:18789/__openclaw__/canvas/"}'
```

Tailnet (facultatif) : si les deux appareils sont sur Tailscale, utilisez un nom MagicDNS ou une IP tailnet à la place de `.local`, par ex. `http://<gateway-magicdns>:18789/__openclaw__/canvas/`.

Ce serveur injecte un client de live-reload dans le HTML et recharge lors des changements de fichier.
L’hôte A2UI se trouve à `http://<gateway-host>:18789/__openclaw__/a2ui/`.

Commandes canvas (premier plan uniquement) :

- `canvas.eval`, `canvas.snapshot`, `canvas.navigate` (utilisez `{"url":""}` ou `{"url":"/"}` pour revenir à l’échafaudage par défaut). `canvas.snapshot` renvoie `{ format, base64 }` (`format="jpeg"` par défaut).
- A2UI : `canvas.a2ui.push`, `canvas.a2ui.reset` (alias hérité `canvas.a2ui.pushJSONL`)

Commandes caméra (premier plan uniquement ; soumises à permission) :

- `camera.snap` (jpg)
- `camera.clip` (mp4)

Voir [Nœud caméra](/fr/nodes/camera) pour les paramètres et les aides CLI.

### 8) Voice + surface de commande Android étendue

- Onglet Voice : Android dispose de deux modes de capture explicites. **Mic** est une session manuelle d’onglet Voice qui envoie chaque pause comme tour de chat et s’arrête lorsque l’application quitte le premier plan ou que l’utilisateur quitte l’onglet Voice. **Talk** est le Talk Mode continu et continue d’écouter jusqu’à désactivation ou déconnexion du nœud.
- Le Talk Mode promeut le service de premier plan existant de `dataSync` à `dataSync|microphone` avant le début de la capture, puis le rétrograde lorsque le Talk Mode s’arrête. Android 14+ exige la déclaration `FOREGROUND_SERVICE_MICROPHONE`, l’autorisation d’exécution `RECORD_AUDIO` et le type de service microphone à l’exécution.
- Les réponses parlées utilisent `talk.speak` via le fournisseur Talk configuré de la gateway. Le TTS système local n’est utilisé que lorsque `talk.speak` n’est pas disponible.
- Le réveil vocal reste désactivé dans l’UX/runtime Android.
- Familles de commandes Android supplémentaires (la disponibilité dépend de l’appareil + des permissions) :
  - `device.status`, `device.info`, `device.permissions`, `device.health`
  - `notifications.list`, `notifications.actions` (voir [Transmission de notifications](#notification-forwarding) ci-dessous)
  - `photos.latest`
  - `contacts.search`, `contacts.add`
  - `calendar.events`, `calendar.add`
  - `callLog.search`
  - `sms.search`
  - `motion.activity`, `motion.pedometer`

## Points d’entrée assistant

Android prend en charge le lancement d’OpenClaw depuis le déclencheur d’assistant système (Google
Assistant). Lorsqu’il est configuré, maintenir le bouton d’accueil ou dire « Hey Google, ask
OpenClaw... » ouvre l’application et transmet le prompt dans le composeur de chat.

Cela utilise les métadonnées Android **App Actions** déclarées dans le manifeste de l’application. Aucune configuration supplémentaire n’est nécessaire côté gateway -- l’intention assistant est entièrement gérée par l’application Android et transmise comme un message de chat normal.

<Note>
La disponibilité d’App Actions dépend de l’appareil, de la version de Google Play Services et du fait que l’utilisateur a défini OpenClaw comme application d’assistant par défaut.
</Note>

## Transmission de notifications

Android peut transmettre les notifications de l’appareil à la gateway sous forme d’événements. Plusieurs contrôles vous permettent de limiter quelles notifications sont transmises et à quel moment.

| Clé                              | Type           | Description                                                                                       |
| -------------------------------- | -------------- | ------------------------------------------------------------------------------------------------- |
| `notifications.allowPackages`    | string[]       | Transmettre uniquement les notifications provenant de ces noms de package. Si défini, tous les autres packages sont ignorés. |
| `notifications.denyPackages`     | string[]       | Ne jamais transmettre les notifications provenant de ces noms de package. Appliqué après `allowPackages`. |
| `notifications.quietHours.start` | string (HH:mm) | Début de la fenêtre d’heures calmes (heure locale de l’appareil). Les notifications sont supprimées durant cette fenêtre. |
| `notifications.quietHours.end`   | string (HH:mm) | Fin de la fenêtre d’heures calmes.                                                                |
| `notifications.rateLimit`        | number         | Nombre maximum de notifications transmises par package et par minute. Les notifications excédentaires sont supprimées. |

Le sélecteur de notifications utilise aussi un comportement plus sûr pour les événements de notifications transmis, empêchant la transmission accidentelle de notifications système sensibles.

Exemple de configuration :

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
La transmission de notifications nécessite l’autorisation Android Notification Listener. L’application la demande pendant la configuration.
</Note>

## Lié

- [Application iOS](/fr/platforms/ios)
- [Nodes](/fr/nodes)
- [Dépannage du nœud Android](/fr/nodes/troubleshooting)
