---
read_when:
    - Appairage ou reconnexion du Node Android
    - Débogage de la découverte ou de l’authentification du Gateway sur Android
    - Recopie ou contrôle d’un appareil Android depuis un Mac distant
    - Vérification de la cohérence de l’historique des conversations entre les clients
summary: 'Application Android (Node) : guide opérationnel de connexion + surface de commandes Connexion/Chat/Voix/Canvas'
title: Application Android
x-i18n:
    generated_at: "2026-07-12T15:29:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 7cba1a3db2743dc9145ba5cd3eb3129b87952d7ec4090afd2776bb71a590627b
    source_path: platforms/android.md
    workflow: 16
---

<Note>
L'application Android officielle est disponible sur [Google Play](https://play.google.com/store/apps/details?id=ai.openclaw.app&hl=en_IN) ainsi que sous forme d'APK autonome signé dans les [versions GitHub](https://github.com/openclaw/openclaw/releases) prises en charge. Il s'agit d'un nœud compagnon qui nécessite un Gateway OpenClaw en cours d'exécution. Source : [apps/android](https://github.com/openclaw/openclaw/tree/main/apps/android) ([instructions de compilation](https://github.com/openclaw/openclaw/blob/main/apps/android/README.md)).
</Note>

## Aperçu de la prise en charge

- Rôle : application de nœud compagnon (Android n'héberge pas le Gateway).
- Gateway requis : oui (exécutez-le sous macOS, Linux ou Windows via WSL2).
- Installation : [Google Play](https://play.google.com/store/apps/details?id=ai.openclaw.app&hl=en_IN) ou `OpenClaw-Android.apk` provenant d'une [version GitHub](https://github.com/openclaw/openclaw/releases) prise en charge, [Bien démarrer](/fr/start/getting-started) pour le Gateway, puis [Association](/fr/channels/pairing).
- Gateway : [Guide d'exploitation](/fr/gateway) + [Configuration](/fr/gateway/configuration).
  - Protocoles : [Protocole du Gateway](/fr/gateway/protocol) (nœuds + plan de contrôle).

Le contrôle système (launchd/systemd) s'effectue sur l'hôte du Gateway — consultez [Gateway](/fr/gateway).

## Installation en dehors de Google Play

Les versions GitHub finales et correctives standard incluent un fichier universel `OpenClaw-Android.apk` et `OpenClaw-Android-SHA256SUMS.txt`. L'APK est compilé à partir de l'étiquette de version, signé avec la clé de publication Android d'OpenClaw et accompagné d'une attestation de provenance GitHub Actions.

Choisissez une [version](https://github.com/openclaw/openclaw/releases) qui répertorie ces deux ressources, puis téléchargez et vérifiez cette étiquette exacte avant d'effectuer l'installation manuelle :

```bash
release_tag=vYYYY.M.PATCH
gh release download "$release_tag" \
  --repo openclaw/openclaw \
  --pattern OpenClaw-Android.apk \
  --pattern OpenClaw-Android-SHA256SUMS.txt
sha256sum --check OpenClaw-Android-SHA256SUMS.txt
gh attestation verify OpenClaw-Android.apk \
  --repo openclaw/openclaw \
  --signer-workflow openclaw/openclaw/.github/workflows/android-release.yml \
  --source-ref "refs/tags/${release_tag}" \
  --deny-self-hosted-runners
```

<Warning>
Les installations depuis Google Play et au moyen de l'APK autonome utilisent des canaux de mise à jour différents et peuvent avoir des identités de signature différentes. Android peut exiger la désinstallation de l'application existante avant de changer de canal, ce qui supprime les données locales de l'application. Restez sur un même canal pour les mises à jour normales.
</Warning>

## Afficher et contrôler Android depuis un Mac distant

[scrcpy](https://github.com/Genymobile/scrcpy) affiche l'écran d'un appareil Android dans une fenêtre macOS et
transmet les entrées du clavier et du pointeur via Android Debug Bridge (ADB). Il s'agit d'un processus
côté opérateur, distinct de la connexion du nœud OpenClaw. Il est utile lorsque l'appareil Android et le
Mac se trouvent à des emplacements différents, mais partagent un réseau Tailscale privé.

### Avant de commencer

- Installez Tailscale sur l'appareil Android et le Mac, puis connectez-les au même tailnet.
- Sur Android, activez **Developer options** et **USB debugging**. Android 16 place **Wireless
  debugging** sous **Settings > System > Developer options**. Consultez les [options pour les développeurs
  Android](https://developer.android.com/studio/debug/dev-options).
- Installez scrcpy et ADB sur le Mac :

  ```bash
  brew install scrcpy
  brew install --cask android-platform-tools
  ```

- Gardez l'appareil Android à disposition lors de la première connexion. Android doit approuver la clé
  ADB de chaque Mac avant que celui-ci puisse contrôler l'appareil.

### Activer ADB sur TCP

Pour la configuration initiale, connectez l'appareil Android par USB à un ordinateur de confiance et
approuvez la demande d'autorisation de débogage. Exécutez ensuite :

```bash
adb devices
adb tcpip 5555
```

Vous pouvez maintenant déconnecter le câble USB. Si le port 5555 cesse d'écouter après le redémarrage
de l'appareil ou la réinitialisation du débogage, répétez cette étape de configuration locale. Android 11
et les versions ultérieures permettent également d'établir la confiance initiale avec
**Wireless debugging > Pair device with pairing code** et `adb pair`.

### Autoriser uniquement le Mac de contrôle

Les tailnets dotés d'autorisations restrictives doivent explicitement permettre au Mac de contrôle
d'accéder au port TCP 5555 de l'appareil Android. Ajoutez une règle restrictive à la politique du
tailnet en remplaçant les adresses d'exemple par les adresses IP Tailscale stables des deux appareils :

```json5
{
  grants: [
    {
      src: ["<remote-mac-tailnet-ip>"],
      dst: ["<android-tailnet-ip>"],
      ip: ["tcp:5555"],
    },
  ],
}
```

Consultez les [autorisations Tailscale](https://tailscale.com/docs/reference/syntax/grants) pour les alias d'hôtes et les autres
sélecteurs. N'autorisez pas l'accès à ce port depuis l'Internet public et ne l'exposez pas avec Funnel : un client ADB
autorisé dispose d'un contrôle étendu sur l'appareil.

### Se connecter et démarrer l'affichage

Sur le Mac distant :

```bash
adb connect <android-tailnet-ip>:5555
adb devices
scrcpy --serial <android-tailnet-ip>:5555
```

La première commande `adb connect` exécutée depuis ce Mac affiche une boîte de dialogue d'autorisation sur Android. Déverrouillez l'appareil,
confirmez l'empreinte de la clé et sélectionnez **Always allow from this computer** uniquement si le Mac est
digne de confiance. Une entrée `adb devices` réussie se termine par `device` ; `unauthorized` signifie que la demande sur l'appareil
n'a pas été approuvée.

Lorsque la fenêtre scrcpy s'ouvre, utilisez-la directement ou ciblez-la avec un outil d'automatisation d'écran macOS tel
que [Peekaboo](https://peekaboo.sh/). scrcpy transmet l'affichage et les entrées ; Tailscale fournit uniquement le
chemin réseau privé.

### Résolution des problèmes

- `Connection timed out` : vérifiez l'autorisation du tailnet pour le port TCP 5555. Une commande `tailscale ping` réussie prouve
  que le pair est joignable, mais pas que la politique autorise ce port TCP. Testez avec
  `nc -vz <android-tailnet-ip> 5555` depuis le Mac.
- `unauthorized` : déverrouillez Android et approuvez la clé ADB du Mac distant, ou supprimez le poste de travail obsolète
  sous **Wireless debugging > Paired devices**, puis associez-le de nouveau.
- `Connection refused` : reconnectez l'appareil localement et exécutez de nouveau `adb tcpip 5555`.
- Plusieurs appareils répertoriés : conservez l'argument explicite `--serial <android-tailnet-ip>:5555`.

Lorsque vous avez terminé, fermez scrcpy et déconnectez ADB :

```bash
adb disconnect <android-tailnet-ip>:5555
```

## Guide d'exploitation de la connexion

Application de nœud Android ⇄ (mDNS/NSD + WebSocket) ⇄ **Gateway**

Android se connecte directement au WebSocket du Gateway et utilise l'association d'appareils (`role: node`).

Pour les hôtes Tailscale ou publics, Android exige un point de terminaison sécurisé :

- Recommandé : Tailscale Serve / Funnel avec `https://<magicdns>` / `wss://<magicdns>`
- Également pris en charge : toute autre URL de Gateway `wss://` avec un véritable point de terminaison TLS
- Le protocole non chiffré `ws://` reste pris en charge pour les adresses de réseau local privé et les hôtes `.local`, ainsi que pour `localhost`, `127.0.0.1` et la passerelle de l'émulateur Android (`10.0.2.2`)

### Prérequis

- Gateway exécuté sur une autre machine (ou accessible via SSH).
- L'appareil ou l'émulateur Android peut accéder au WebSocket du Gateway :
  - Même réseau local avec mDNS/NSD, **ou**
  - Même tailnet Tailscale avec Wide-Area Bonjour / DNS-SD monodiffusion (voir ci-dessous), **ou**
  - Hôte/port du Gateway saisi manuellement (solution de secours)
- L'association mobile via un tailnet ou un hôte public n'utilise **pas** de points de terminaison `ws://` avec une adresse IP brute du tailnet. Utilisez plutôt Tailscale Serve ou une autre URL `wss://`.
- La CLI `openclaw` est disponible sur la machine du Gateway (ou via SSH) afin d'approuver les demandes d'association.

### 1. Démarrer le Gateway

```bash
openclaw gateway --port 18789 --verbose
```

Vérifiez que les journaux contiennent un message semblable à celui-ci :

- `listening on ws://0.0.0.0:18789`

Pour l'accès Android distant via Tailscale, préférez Serve/Funnel à une liaison directe au tailnet :

```bash
openclaw gateway --tailscale serve
```

Android dispose ainsi d'un point de terminaison sécurisé `wss://` / `https://`. Une simple configuration `gateway.bind: "tailnet"` ne suffit pas pour la première association Android distante, sauf si vous terminez également TLS séparément.

### 2. Vérifier la découverte (facultatif)

Depuis la machine du Gateway :

```bash
dns-sd -B _openclaw-gw._tcp local.
```

Pour plus d'informations de débogage : [Bonjour](/fr/gateway/bonjour).

Si vous avez également configuré un domaine de découverte étendu, comparez-le avec :

```bash
openclaw gateway discover --json
```

Cette commande affiche `local.` et le domaine étendu configuré en une seule exécution, en utilisant le point de terminaison de service résolu au lieu d'indications provenant uniquement de TXT.

#### Découverte entre réseaux via DNS-SD monodiffusion

La découverte Android NSD/mDNS ne traverse pas les réseaux. Si le nœud Android et le Gateway se trouvent sur des réseaux différents, mais sont connectés via Tailscale, utilisez plutôt Wide-Area Bonjour / DNS-SD monodiffusion. La découverte seule ne suffit pas pour l'association Android via un tailnet ou un hôte public : la route découverte doit toujours disposer d'un point de terminaison sécurisé (`wss://` ou Tailscale Serve) :

1. Configurez une zone DNS-SD (par exemple `openclaw.internal.`) sur l'hôte du Gateway et publiez des enregistrements `_openclaw-gw._tcp`.
2. Configurez le DNS partagé Tailscale pour que le domaine choisi pointe vers ce serveur DNS.

Détails et exemple de configuration CoreDNS : [Bonjour](/fr/gateway/bonjour).

### 3. Se connecter depuis Android

Dans l'application Android :

- L'application maintient la connexion au Gateway active au moyen d'un **service au premier plan** (notification persistante).
- Ouvrez l'onglet **Connect**.
- Utilisez le mode **Setup Code** ou **Manual**.
- Si la découverte est bloquée, utilisez la saisie manuelle de l'hôte et du port dans **Advanced controls**. Pour les hôtes d'un réseau local privé, `ws://` fonctionne toujours. Pour les hôtes Tailscale ou publics, activez TLS et utilisez un point de terminaison `wss://` / Tailscale Serve.

Après la première association réussie, Android se reconnecte automatiquement au démarrage au Gateway associé actif (dans la mesure du possible pour les Gateway découverts, qui doivent être visibles sur le réseau).

### Plusieurs Gateway

L'application conserve un registre de tous les Gateway auxquels elle a été associée, afin que vous puissiez passer de l'un à l'autre sans effectuer une nouvelle association :

- **Settings -> Gateways** répertorie les Gateway associés et indique celui qui est actif. Touchez une entrée pour basculer ; l'application interrompt les sessions actuelles et se reconnecte au Gateway sélectionné.
- L'onglet **Connect** affiche un sélecteur rapide lorsque plusieurs Gateway sont associés.
- Les identifiants, les jetons d'appareil, la confiance TLS, l'historique des conversations et les messages hors ligne en attente sont stockés séparément pour chaque Gateway. Le changement de Gateway ne mélange jamais leurs états, et les messages mis en file d'attente hors ligne sont transmis uniquement au Gateway auquel ils étaient destinés.
- **Forget** supprime l'entrée du registre d'un Gateway ainsi que ses identifiants, ses jetons d'appareil, son épingle TLS et ses conversations en cache.

### Signaux de présence active

Après la connexion de la session de nœud authentifiée, et lorsque l'application passe en arrière-plan tandis que le service au premier plan reste connecté, Android appelle `node.event` avec `event: "node.presence.alive"`. Le Gateway enregistre cet événement sous la forme `lastSeenAtMs`/`lastSeenReason` dans les métadonnées du nœud ou de l'appareil associé, uniquement après avoir déterminé l'identité authentifiée de l'appareil du nœud.

L'application considère le signal comme correctement enregistré uniquement lorsque la réponse du Gateway contient `handled: true`. Les anciens Gateway peuvent accuser réception de `node.event` avec `{ "ok": true }` ; cette réponse est compatible, mais n'est pas considérée comme une mise à jour persistante de la dernière activité.

### 4. Approuver l'association (CLI)

Sur la machine du Gateway :

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Détails sur l'association : [Association](/fr/channels/pairing).

Facultatif : si le nœud Android se connecte toujours depuis un sous-réseau strictement contrôlé, vous pouvez activer l'approbation automatique de la première association du nœud avec des CIDR explicites ou des adresses IP exactes :

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

Cette fonctionnalité est désactivée par défaut. Elle s'applique uniquement à une nouvelle association `role: node` sans étendue demandée. L'association d'un opérateur ou d'un navigateur, ainsi que toute modification du rôle, de l'étendue, des métadonnées ou de la clé publique, nécessitent toujours une approbation manuelle.

### 5. Vérifier que le nœud est connecté

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

### 6. Conversation + historique

L'onglet Chat de l'application Android permet de sélectionner une session (`main` par défaut, ainsi que les autres sessions existantes) :

- Historique : `chat.history` (normalisé pour l’affichage — les balises de directives intégrées, les charges utiles XML en texte brut des appels d’outils (`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>` et leurs variantes tronquées), ainsi que les jetons de contrôle du modèle ASCII/pleine chasse ayant fuité sont supprimés ; les lignes de l’assistant contenant un jeton silencieux tel que l’exact `NO_REPLY` / `no_reply` sont omises ; les lignes trop volumineuses peuvent être remplacées par des espaces réservés)
- Envoi : `chat.send`
- Envoi durable : chaque envoi (texte, images sélectionnées et notes vocales) est consigné dans une boîte d’envoi locale à l’appareil et propre à chaque Gateway avant toute tentative réseau, afin que l’arrêt de l’application ne puisse pas entraîner la perte d’une saisie envoyée. Les envois mis en file d’attente hors ligne sont livrés dans l’ordre lors de la reconnexion avec des clés d’idempotence stables, et un envoi n’est retiré qu’une fois le tour visible dans l’historique canonique `chat.history` — un accusé de réception seul n’est pas considéré comme une preuve de livraison. Les résultats ambigus (accusé de réception perdu, application arrêtée en cours d’envoi, redémarrage du Gateway avant l’écriture de la transcription) apparaissent sous forme de lignes visibles proposant explicitement **Réessayer**/**Supprimer**, au lieu de déclencher un nouvel envoi automatique. Les commandes obliques ne sont jamais relancées automatiquement après une reconnexion ; elles restent en attente d’une nouvelle tentative explicite. La file d’attente est limitée (50 messages et 48 MB de pièces jointes par Gateway) et les lignes non envoyées expirent après 48 heures. Les brouillons de l’éditeur qui n’ont jamais été envoyés ne persistent pas après l’arrêt du processus.
- Mises à jour push (au mieux) : `chat.subscribe` -> `event:"chat"`
- Écoute : effectuez un appui prolongé sur un message de l’assistant et choisissez **Écouter** pour l’entendre ; l’audio est généré via `tts.speak` du Gateway avec la chaîne de fournisseurs TTS configurée, et la synthèse vocale système de l’appareil est utilisée lorsque le Gateway ne peut pas générer l’audio. La lecture s’arrête lors d’un changement de session, d’une nouvelle discussion, du passage de l’application en arrière-plan ou de la fermeture de la discussion.

### 7. Canevas + caméra

#### Hôte de canevas du Gateway (recommandé pour le contenu web)

Pour que le Node affiche de véritables contenus HTML/CSS/JS que l’agent peut modifier sur le disque, faites pointer le Node vers l’hôte de canevas du Gateway.

<Note>
Les Nodes chargent le canevas depuis le serveur HTTP du Gateway (même port que `gateway.port`, `18789` par défaut).
</Note>

1. Créez `~/.openclaw/workspace/canvas/index.html` sur l’hôte du Gateway.
2. Accédez-y depuis le Node (réseau local) :

```bash
openclaw nodes invoke --node "<Android Node>" --command canvas.navigate --params '{"url":"http://<gateway-hostname>.local:18789/__openclaw__/canvas/"}'
```

Tailnet (facultatif) : si les deux appareils utilisent Tailscale, utilisez un nom MagicDNS ou une adresse IP du tailnet au lieu de `.local`, par exemple `http://<gateway-magicdns>:18789/__openclaw__/canvas/`.

Ce serveur injecte un client de rechargement en direct dans le HTML et recharge la page lorsque les fichiers sont modifiés. Le Gateway fournit également `/__openclaw__/a2ui/`, mais l’application Android traite les pages A2UI distantes uniquement comme du contenu à afficher. Les commandes A2UI capables de déclencher des actions utilisent la page A2UI intégrée appartenant à l’application.

Commandes de canevas (au premier plan uniquement) :

- `canvas.eval`, `canvas.snapshot`, `canvas.navigate` (utilisez `{"url":""}` ou `{"url":"/"}` pour revenir à la structure par défaut). `canvas.snapshot` renvoie `{ format, base64 }` (`format="jpeg"` par défaut).
- A2UI : `canvas.a2ui.push`, `canvas.a2ui.reset` (ancien alias `canvas.a2ui.pushJSONL`). Elles utilisent la page A2UI intégrée appartenant à l’application pour un rendu capable de déclencher des actions.

Commandes de caméra (au premier plan uniquement ; soumises à autorisation) : `camera.snap` (jpg), `camera.clip` (mp4). Consultez [Node de caméra](/fr/nodes/camera) pour les paramètres et les outils d’assistance de la CLI.

### 8. Voix + surface étendue des commandes Android

- Onglet Voix : Android propose deux modes de capture explicites. **Micro** est une session manuelle de l’onglet Voix qui envoie chaque pause sous forme de tour de discussion et s’arrête lorsque l’application quitte le premier plan ou lorsque l’utilisateur quitte l’onglet Voix. **Conversation** est le mode Conversation continu et poursuit l’écoute jusqu’à sa désactivation ou la déconnexion du Node.
- Le mode Conversation fait passer le service de premier plan existant de `connectedDevice` à `connectedDevice|microphone` avant le début de la capture, puis le rétablit lorsque le mode Conversation s’arrête. Le service du Node déclare `FOREGROUND_SERVICE_CONNECTED_DEVICE` avec `CHANGE_NETWORK_STATE` ; Android 14+ exige également la déclaration `FOREGROUND_SERVICE_MICROPHONE`, l’autorisation d’exécution `RECORD_AUDIO` et le type de service microphone à l’exécution.
- Par défaut, la fonctionnalité Conversation d’Android utilise la reconnaissance vocale native, la discussion du Gateway et `talk.speak` par l’intermédiaire du fournisseur Conversation configuré sur le Gateway. La synthèse vocale du système local est utilisée uniquement lorsque `talk.speak` est indisponible.
- La fonctionnalité Conversation d’Android utilise le relais en temps réel du Gateway uniquement lorsque `talk.realtime.mode` vaut `realtime` et que `talk.realtime.transport` vaut `gateway-relay`.
- Android ne déclare pas la capacité `voiceWake`. Utilisez **Micro** ou **Conversation** pour la saisie vocale.
- Familles de commandes Android supplémentaires (la disponibilité dépend de l’appareil, des autorisations et des paramètres de l’utilisateur) :
  - `device.status`, `device.info`, `device.permissions`, `device.health`
  - `device.apps` uniquement lorsque **Settings > Phone Capabilities > Installed Apps** est activé ; cette commande répertorie par défaut les applications visibles dans le lanceur (transmettez `includeNonLaunchable` pour obtenir la liste complète).
  - `notifications.list`, `notifications.actions` (consultez [Transfert des notifications](#notification-forwarding) ci-dessous)
  - `photos.latest`
  - `contacts.search`, `contacts.add`
  - `calendar.events`, `calendar.add`
  - `callLog.search`
  - `sms.search`
  - `motion.activity`, `motion.pedometer`

### 9. Fichiers de l’espace de travail (lecture seule)

La vue d’ensemble de l’accueil comprend une carte **Fichiers** qui permet de parcourir l’espace de travail de l’agent actif par l’intermédiaire des RPC du Gateway en lecture seule `agents.workspace.list` / `agents.workspace.get` : navigation dans les répertoires, aperçus de texte et d’images, et exportation au moyen de la feuille de partage Android. Aucune opération d’écriture n’est disponible, et la taille des aperçus est limitée par le Gateway.

## Examiner les approbations de commandes

Une connexion d’opérateur disposant de `operator.admin`, ou une connexion
`operator.approvals` appairée et explicitement ciblée par le Gateway, peut examiner
les requêtes d’exécution en attente sous **Settings -> Approvals**. L’application charge
l’enregistrement d’approbation assaini du Gateway avant d’activer ses boutons, affiche tous
les avertissements de sécurité et les décisions exactes proposées par cette requête, puis transmet
l’identifiant d’approbation et le type de propriétaire au Gateway.

L’état d’approbation est partagé avec l’interface de contrôle et les surfaces de discussion prises en charge. La
première réponse validée l’emporte ; Android affiche ce résultat canonique même lorsqu’une
autre surface a répondu en premier. Si une réponse de résolution est perdue ou si le Gateway
se déconnecte, l’application maintient l’action verrouillée et relit l’approbation
avant de proposer une autre décision.

Les Gateway antérieurs aux méthodes d’approbation unifiées utilisent en dernier recours les méthodes
propres à l’exécution fournies avec leur version. L’examen en attente continue de fonctionner, mais l’état conservé du terminal
et le résultat enrichi partagé entre les surfaces nécessitent un Gateway mis à jour.

## Points d’entrée de l’assistant

Android permet de lancer OpenClaw à partir du déclencheur de l’assistant système (Google Assistant). Maintenir le bouton d’accueil enfoncé (ou utiliser un autre déclencheur `ACTION_ASSIST`) ouvre l’application ; prononcer « Hey Google, ask OpenClaw `<prompt>` » correspond au modèle de requête App Actions déclaré par l’application et transmet le texte à l’éditeur de discussion sans l’envoyer automatiquement.

Cette fonctionnalité utilise les **App Actions** d’Android (capacité de `shortcuts.xml`) déclarées dans le manifeste de l’application. Aucune configuration du côté du Gateway n’est nécessaire — l’intention de l’assistant est entièrement gérée par l’application Android.

<Note>
La disponibilité des App Actions dépend de l’appareil, de la version des services Google Play et du choix éventuel d’OpenClaw comme application d’assistant par défaut.
</Note>

## Transfert des notifications

Android peut transférer les notifications de l’appareil au Gateway sous forme d’éléments `node.event`. Cette fonctionnalité se configure **sur l’appareil**, dans la feuille Paramètres de l’application — et non dans la configuration du Gateway/`openclaw.json`.

| Paramètre                   | Description                                                                                                                                                                                            |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Forward Notification Events | Interrupteur principal. Désactivé par défaut ; exige d’abord l’octroi de l’accès à l’écoute des notifications.                                                                                          |
| Package Filter              | **Allowlist** (seuls les identifiants de paquets répertoriés sont transférés) ou **Blocklist** (par défaut : tous les paquets sauf les identifiants répertoriés). Le paquet d’OpenClaw est toujours exclu en mode Blocklist afin d’éviter les boucles de transfert. |
| Quiet Hours                 | Plage locale de début/fin au format HH:mm pendant laquelle le transfert est suspendu. Désactivée par défaut ; utilise `22:00`-`07:00` par défaut une fois activée.                                      |
| Max Events / Minute         | Limite par appareil du débit de notifications transférées. Valeur par défaut : 20.                                                                                                                      |
| Route Session Key           | Facultatif. Épingle les événements de notification transférés à une session spécifique plutôt qu’à la route de notification par défaut de l’appareil.                                                  |

<Note>
Le transfert des notifications nécessite l’autorisation Android d’écoute des notifications. L’application vous invite à l’accorder pendant la configuration.
</Note>

Les notifications de WhatsApp, WhatsApp Business, Telegram, Telegram X, Discord et Signal sont toujours exclues. Leurs messages sont déjà pris en charge par les sessions de canal natives d’OpenClaw ; transférer la notification Android sous forme d’événement de Node distinct pourrait acheminer une réponse vers la mauvaise conversation.

## Pages connexes

- [Application iOS](/fr/platforms/ios)
- [Nodes](/fr/nodes)
- [Dépannage des Nodes Android](/fr/nodes/troubleshooting)
