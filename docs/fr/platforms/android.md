---
read_when:
    - Appairer ou reconnecter le node Android
    - Déboguer la découverte ou l’authentification du gateway Android
    - Vérifier la parité de l’historique de chat entre clients
summary: 'Application Android (node) : runbook de connexion + surface de commande Connect/Chat/Voice/Canvas'
title: Application Android
x-i18n:
    generated_at: "2026-04-25T13:51:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 789de91275a11e63878ba670b9f316538d6b4731c22ec491b2c802f1cd14dcec
    source_path: platforms/android.md
    workflow: 15
---

> **Remarque :** L’application Android n’a pas encore été publiée publiquement. Le code source est disponible dans le [dépôt OpenClaw](https://github.com/openclaw/openclaw) sous `apps/android`. Vous pouvez la compiler vous-même avec Java 17 et le SDK Android (`./gradlew :app:assemblePlayDebug`). Voir [apps/android/README.md](https://github.com/openclaw/openclaw/blob/main/apps/android/README.md) pour les instructions de build.

## Aperçu de la prise en charge

- Rôle : application node compagnon (Android n’héberge pas le Gateway).
- Gateway requis : oui (exécutez-le sur macOS, Linux ou Windows via WSL2).
- Installation : [Premiers pas](/fr/start/getting-started) + [Appairage](/fr/channels/pairing).
- Gateway : [Runbook](/fr/gateway) + [Configuration](/fr/gateway/configuration).
  - Protocoles : [Protocole Gateway](/fr/gateway/protocol) (nodes + plan de contrôle).

## Contrôle système

Le contrôle système (launchd/systemd) réside sur l’hôte Gateway. Voir [Gateway](/fr/gateway).

## Runbook de connexion

Application node Android ⇄ (mDNS/NSD + WebSocket) ⇄ **Gateway**

Android se connecte directement au WebSocket du Gateway et utilise l’appairage d’appareil (`role: node`).

Pour Tailscale ou les hôtes publics, Android exige un endpoint sécurisé :

- Recommandé : Tailscale Serve / Funnel avec `https://<magicdns>` / `wss://<magicdns>`
- Également pris en charge : toute autre URL Gateway `wss://` avec un véritable endpoint TLS
- Le `ws://` en clair reste pris en charge sur les adresses LAN privées / les hôtes `.local`, ainsi que `localhost`, `127.0.0.1` et le pont d’émulateur Android (`10.0.2.2`)

### Prérequis

- Vous pouvez exécuter le Gateway sur la machine « maître ».
- L’appareil/l’émulateur Android peut atteindre le WebSocket du gateway :
  - Même LAN avec mDNS/NSD, **ou**
  - Même tailnet Tailscale en utilisant Wide-Area Bonjour / DNS-SD unicast (voir ci-dessous), **ou**
  - Hôte/port du gateway saisi manuellement (solution de repli)
- L’appairage mobile tailnet/public n’utilise **pas** d’endpoints `ws://` d’IP tailnet bruts. Utilisez plutôt Tailscale Serve ou une autre URL `wss://`.
- Vous pouvez exécuter la CLI (`openclaw`) sur la machine gateway (ou via SSH).

### 1) Démarrer le Gateway

```bash
openclaw gateway --port 18789 --verbose
```

Confirmez dans les journaux que vous voyez quelque chose comme :

- `listening on ws://0.0.0.0:18789`

Pour l’accès Android distant via Tailscale, préférez Serve/Funnel à une simple liaison tailnet brute :

```bash
openclaw gateway --tailscale serve
```

Cela donne à Android un endpoint sécurisé `wss://` / `https://`. Une simple configuration `gateway.bind: "tailnet"` n’est pas suffisante pour un premier appairage Android distant, sauf si vous terminez aussi TLS séparément.

### 2) Vérifier la découverte (facultatif)

Depuis la machine gateway :

```bash
dns-sd -B _openclaw-gw._tcp local.
```

Plus de notes de débogage : [Bonjour](/fr/gateway/bonjour).

Si vous avez aussi configuré un domaine de découverte wide-area, comparez avec :

```bash
openclaw gateway discover --json
```

Cela affiche `local.` plus le domaine wide-area configuré en un seul passage et utilise l’endpoint de service résolu au lieu d’indices TXT uniquement.

#### Découverte tailnet (Vienne ⇄ Londres) via DNS-SD unicast

La découverte Android NSD/mDNS ne traverse pas les réseaux. Si votre node Android et le gateway sont sur des réseaux différents mais connectés via Tailscale, utilisez plutôt Wide-Area Bonjour / DNS-SD unicast.

La découverte seule ne suffit pas pour l’appairage Android tailnet/public. La route découverte nécessite toujours un endpoint sécurisé (`wss://` ou Tailscale Serve) :

1. Configurez une zone DNS-SD (par exemple `openclaw.internal.`) sur l’hôte gateway et publiez des enregistrements `_openclaw-gw._tcp`.
2. Configurez le split DNS Tailscale pour le domaine choisi en le pointant vers ce serveur DNS.

Détails et exemple de configuration CoreDNS : [Bonjour](/fr/gateway/bonjour).

### 3) Se connecter depuis Android

Dans l’application Android :

- L’application maintient sa connexion au gateway via un **service de premier plan** (notification persistante).
- Ouvrez l’onglet **Connect**.
- Utilisez le mode **Setup Code** ou **Manual**.
- Si la découverte est bloquée, utilisez l’hôte/port manuel dans **Advanced controls**. Pour les hôtes LAN privés, `ws://` fonctionne toujours. Pour les hôtes Tailscale/publics, activez TLS et utilisez un endpoint `wss://` / Tailscale Serve.

Après le premier appairage réussi, Android se reconnecte automatiquement au lancement :

- endpoint manuel (s’il est activé), sinon
- le dernier gateway découvert (best-effort).

### 4) Approuver l’appairage (CLI)

Sur la machine gateway :

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Détails de l’appairage : [Appairage](/fr/channels/pairing).

Facultatif : si le node Android se connecte toujours depuis un sous-réseau étroitement contrôlé,
vous pouvez activer l’approbation automatique du node lors du premier appairage avec des CIDR explicites ou des IP exactes :

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

Ceci est désactivé par défaut. Cela ne s’applique qu’à un appairage frais `role: node` sans portées demandées. L’appairage opérateur/browser, ainsi que tout changement de rôle, de portée, de métadonnées ou de clé publique, exigent toujours une approbation manuelle.

### 5) Vérifier que le node est connecté

- Via le statut des nodes :

  ```bash
  openclaw nodes status
  ```

- Via Gateway :

  ```bash
  openclaw gateway call node.list --params "{}"
  ```

### 6) Chat + historique

L’onglet Chat Android prend en charge la sélection de session (par défaut `main`, plus les autres sessions existantes) :

- Historique : `chat.history` (normalisé pour l’affichage ; les balises de directives inline sont retirées du texte visible, les payloads XML d’appel d’outil en texte brut (y compris `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>`, ainsi que les blocs d’appel d’outil tronqués) et les jetons de contrôle du modèle ASCII/full-width ayant fuité sont retirés, les lignes assistant contenant uniquement un jeton silencieux pur comme `NO_REPLY` / `no_reply` exact sont omises, et les lignes surdimensionnées peuvent être remplacées par des placeholders)
- Envoi : `chat.send`
- Mises à jour push (best-effort) : `chat.subscribe` → `event:"chat"`

### 7) Canvas + caméra

#### Hôte Gateway Canvas (recommandé pour le contenu web)

Si vous voulez que le node affiche du HTML/CSS/JS réel que l’agent peut modifier sur disque, pointez le node vers l’hôte canvas du Gateway.

Remarque : les nodes chargent canvas depuis le serveur HTTP du Gateway (même port que `gateway.port`, par défaut `18789`).

1. Créez `~/.openclaw/workspace/canvas/index.html` sur l’hôte gateway.

2. Naviguez le node vers celui-ci (LAN) :

```bash
openclaw nodes invoke --node "<Android Node>" --command canvas.navigate --params '{"url":"http://<gateway-hostname>.local:18789/__openclaw__/canvas/"}'
```

Tailnet (facultatif) : si les deux appareils sont sur Tailscale, utilisez un nom MagicDNS ou une IP tailnet à la place de `.local`, par exemple `http://<gateway-magicdns>:18789/__openclaw__/canvas/`.

Ce serveur injecte un client de live-reload dans le HTML et recharge lors des changements de fichiers.
L’hôte A2UI se trouve à `http://<gateway-host>:18789/__openclaw__/a2ui/`.

Commandes Canvas (premier plan uniquement) :

- `canvas.eval`, `canvas.snapshot`, `canvas.navigate` (utilisez `{"url":""}` ou `{"url":"/"}` pour revenir au scaffold par défaut). `canvas.snapshot` renvoie `{ format, base64 }` (par défaut `format="jpeg"`).
- A2UI : `canvas.a2ui.push`, `canvas.a2ui.reset` (ancien alias `canvas.a2ui.pushJSONL`)

Commandes caméra (premier plan uniquement ; soumises aux permissions) :

- `camera.snap` (jpg)
- `camera.clip` (mp4)

Voir [Node caméra](/fr/nodes/camera) pour les paramètres et les helpers CLI.

### 8) Voice + surface de commande Android étendue

- Voice : Android utilise un flux unique micro activé/désactivé dans l’onglet Voice avec capture de transcription et lecture `talk.speak`. Le TTS système local n’est utilisé qu’en l’absence de cette RPC `talk.speak`. Voice s’arrête lorsque l’application quitte le premier plan.
- Les bascules voice wake/talk-mode sont actuellement retirées de l’UX/runtime Android.
- Familles de commandes Android supplémentaires (la disponibilité dépend de l’appareil + des permissions) :
  - `device.status`, `device.info`, `device.permissions`, `device.health`
  - `notifications.list`, `notifications.actions` (voir [Transfert des notifications](#notification-forwarding) ci-dessous)
  - `photos.latest`
  - `contacts.search`, `contacts.add`
  - `calendar.events`, `calendar.add`
  - `callLog.search`
  - `sms.search`
  - `motion.activity`, `motion.pedometer`

## Points d’entrée de l’assistant

Android prend en charge le lancement d’OpenClaw depuis le déclencheur d’assistant système (Google
Assistant). Lorsqu’il est configuré, maintenir le bouton home enfoncé ou dire « Hey Google, ask
OpenClaw... » ouvre l’application et transmet le prompt dans le composeur de chat.

Cela utilise les métadonnées Android **App Actions** déclarées dans le manifeste de l’application. Aucune
configuration supplémentaire n’est nécessaire côté gateway -- l’intent assistant est
géré entièrement par l’application Android puis transmis comme un message de chat normal.

<Note>
La disponibilité de App Actions dépend de l’appareil, de la version de Google Play Services,
et du fait que l’utilisateur ait défini OpenClaw comme application d’assistant par défaut.
</Note>

## Transfert des notifications

Android peut transférer les notifications de l’appareil au gateway sous forme d’événements. Plusieurs contrôles permettent de définir quelles notifications sont transférées et à quel moment.

| Clé                              | Type           | Description                                                                                       |
| -------------------------------- | -------------- | ------------------------------------------------------------------------------------------------- |
| `notifications.allowPackages`    | string[]       | Ne transférer que les notifications de ces noms de package. Si défini, tous les autres packages sont ignorés. |
| `notifications.denyPackages`     | string[]       | Ne jamais transférer les notifications de ces noms de package. Appliqué après `allowPackages`.    |
| `notifications.quietHours.start` | string (HH:mm) | Début de la fenêtre d’heures calmes (heure locale de l’appareil). Les notifications sont supprimées pendant cette fenêtre. |
| `notifications.quietHours.end`   | string (HH:mm) | Fin de la fenêtre d’heures calmes.                                                                |
| `notifications.rateLimit`        | number         | Nombre maximal de notifications transférées par package et par minute. Les notifications excédentaires sont abandonnées. |

Le sélecteur de notifications utilise également un comportement plus sûr pour les événements de notification transférés, empêchant le transfert accidentel de notifications système sensibles.

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

## Connexes

- [Application iOS](/fr/platforms/ios)
- [Nodes](/fr/nodes)
- [Dépannage du node Android](/fr/nodes/troubleshooting)
