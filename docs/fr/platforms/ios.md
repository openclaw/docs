---
read_when:
    - Jumelage ou reconnexion du Node iOS
    - Activation ou dépannage du Node Apple Watch direct
    - Exécuter l’application iOS à partir du code source
    - Débogage de la détection du Gateway ou des commandes canvas
summary: 'Application de nœud iOS : connexion au Gateway, appairage, canevas et dépannage'
title: Application iOS
x-i18n:
    generated_at: "2026-07-16T13:26:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 7db2f099602435837cc18fcd3e7670067d4b58b6cdb6f6502704a1565d1d1c61
    source_path: platforms/ios.md
    workflow: 16
---

Disponibilité : les versions de l’app iPhone sont distribuées via les canaux Apple lorsqu’elles sont activées pour une version. Les versions de développement local peuvent également être exécutées depuis le code source.

## Fonctionnalités

- Se connecte à un Gateway via WebSocket (réseau local ou tailnet).
- Expose les capacités du Node : Canvas, capture d’écran, capture par l’appareil photo, localisation, mode conversation, activation vocale et résumés de santé facultatifs.
- Reçoit les commandes `node.invoke` et signale les événements d’état du Node.
- Permet de parcourir en lecture seule l’espace de travail de l’agent sélectionné depuis la surface Agents (Fichiers) : navigation dans les répertoires, aperçus de texte avec coloration syntaxique, aperçus d’images et exportation via la feuille de partage. Aucune opération d’écriture ; la taille des aperçus est limitée par le Gateway.
- Conserve un petit cache hors ligne en lecture seule des sessions de discussion et transcriptions récentes pour chaque Gateway associé : lors d’un démarrage à froid, la dernière transcription connue s’affiche immédiatement, puis est actualisée dès que le Gateway répond ; les discussions récentes restent consultables hors connexion ; la réinitialisation ou l’oubli purge le cache local protégé.
- Place les messages texte envoyés hors connexion dans une boîte d’envoi durable propre à chaque Gateway (jusqu’à 50) : les bulles en attente apparaissent dans la transcription, sont envoyées dans l’ordre à la reconnexion avec des nouvelles tentatives idempotentes, restent conservées jusqu’à ce que l’historique canonique confirme l’envoi, font l’objet de nouvelles tentatives avec temporisation progressive avant l’affichage d’une action permettant de réessayer ou de les supprimer, et expirent au lieu d’être envoyées après 48 heures hors ligne ; la réinitialisation ou l’oubli efface la file d’attente avec le cache.
- Lit les messages de l’assistant à la demande : appuyez longuement sur un message dans la discussion et choisissez **Écouter**. L’app lit les extraits `tts.speak` pris en charge par le Gateway avec le fournisseur TTS configuré et utilise la synthèse vocale de l’appareil lorsque l’audio du Gateway est indisponible ou illisible. La lecture s’arrête lors d’un changement de session ou du passage en arrière-plan.

## Prérequis

- Gateway exécuté sur un autre appareil (macOS, Linux ou Windows via WSL2).
- Chemin réseau :
  - Même réseau local via Bonjour, **ou**
  - Tailnet via DNS-SD unicast (exemple de domaine : `openclaw.internal.`), **ou**
  - Hôte/port manuel (solution de repli).

## Démarrage rapide (associer et connecter)

Lors du premier lancement, l’app présente une brève explication de l’association et une
page d’autorisations (notifications, appareil photo, microphone, photos, contacts,
calendrier, rappels, localisation). Chaque autorisation est facultative et peut être modifiée
ultérieurement dans **Réglages** -> **Autorisations**, ou dans l’app Réglages d’iOS.

1. Démarrez un Gateway authentifié avec une route accessible depuis votre téléphone. Tailscale
   Serve est le chemin distant recommandé :

```bash
openclaw gateway --port 18789 --tailscale serve
```

Pour une configuration approuvée sur le même réseau local, utilisez plutôt un `gateway.bind: "lan"`
authentifié. La liaison à l’interface de bouclage par défaut n’est pas accessible depuis un téléphone. Si le
Gateway n’a pas encore été configuré, exécutez d’abord `openclaw onboard` afin que la création
du code de configuration dispose d’un chemin d’authentification par jeton ou mot de passe.

2. Ouvrez l’[interface de contrôle](/fr/web/control-ui), sélectionnez **Nodes**, puis cliquez sur
   **Associer un appareil mobile** sur la page **Appareils**. L’accès complet est recommandé
   et sélectionné par défaut ; choisissez l’accès limité uniquement si vous souhaitez exclure
   les commandes administratives du Gateway, puis cliquez sur **Créer un code de configuration**.

3. Dans l’app iOS, ouvrez **Réglages** -> **Gateway**, scannez le code QR (ou collez
   le code de configuration), puis connectez-vous.

   Si le code de configuration contient à la fois des routes de réseau local et de Tailscale Serve, l’app
   les teste dans l’ordre et enregistre le premier point de terminaison accessible.

4. L’app officielle se connecte automatiquement. Si **Approbation en attente** affiche une
   demande, vérifiez son rôle et ses portées avant de l’approuver.

   **Réglages → Gateway** indique si la connexion d’opérateur enregistrée dispose d’un accès
   **Complet** ou **Limité**. La configuration `ws://` en texte clair sur le réseau local est automatiquement
   limitée pour protéger le jeton au porteur. Si elle est limitée, configurez `wss://` ou
   Tailscale Serve, scannez un nouveau code d’accès complet depuis l’interface de contrôle ou `openclaw qr`,
   puis reconnectez-vous pour activer les réglages et les mises à niveau.

Le bouton de l’interface de contrôle nécessite une session déjà associée avec `operator.admin`.
Comme solution de repli dans le terminal, choisissez un Gateway découvert dans l’app iOS (ou activez
Hôte manuel et saisissez l’hôte et le port), puis approuvez la demande sur l’hôte du Gateway :

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Si l’app tente de nouveau l’association avec des informations d’authentification modifiées (rôle, portées ou clé publique), la demande en attente précédente est remplacée et un nouvel `requestId` est créé. Exécutez de nouveau `openclaw devices list` avant l’approbation.

Facultatif : si le Node iOS se connecte toujours depuis un sous-réseau strictement contrôlé, vous pouvez activer l’approbation automatique lors de la première association du Node avec des CIDR explicites ou des adresses IP exactes :

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

Cette option est désactivée par défaut. Elle s’applique uniquement à une nouvelle association `role: node` ne demandant aucune portée. L’association d’un opérateur ou d’un navigateur, ainsi que toute modification du rôle, de la portée, des métadonnées ou de la clé publique, nécessite toujours une approbation manuelle.

5. Vérifiez la connexion :

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## Résumés de santé

Le Node iOS peut renvoyer, avec consentement, un agrégat HealthKit en lecture seule pour la journée
calendaire en cours. Le consentement sur l’iPhone et l’autorisation explicite de la commande du Gateway
sont deux conditions indépendantes. Consultez les [résumés HealthKit](/platforms/ios-healthkit) pour
la configuration, l’appel, les champs de charge utile, le comportement relatif à la confidentialité et le dépannage.

Par défaut, l’app compagnon de l’Apple Watch continue d’utiliser le relais iPhone existant et
ne nécessite pas d’association distincte au Gateway. Associez la Watch à l’iPhone dans
l’app Watch d’Apple, installez OpenClaw depuis **Watch app -> My Watch -> Available
Apps**, puis ouvrez OpenClaw une fois sur les deux appareils.

## Examiner les approbations de commandes

Une connexion d’opérateur avec `operator.admin`, ou une connexion
`operator.approvals` associée et explicitement ciblée par le Gateway, peut examiner
les demandes d’exécution en attente sur l’iPhone. La carte d’approbation affiche l’aperçu
nettoyé de la commande du Gateway, l’avertissement, le contexte de l’hôte, l’expiration et uniquement les
décisions proposées par cette demande. L’Apple Watch associée reçoit la même
invite sécurisée pour l’examinateur via le relais iPhone existant et propose le sous-ensemble compact
autoriser une fois/refuser. Le mode de connexion directe de la Watch au Gateway ne transmet pas
les demandes d’approbation.

L’état d’approbation est partagé avec l’interface de contrôle et les surfaces de discussion prises en charge. La
première réponse validée prévaut. L’iPhone et la Watch récupèrent l’enregistrement terminal canonique
du Gateway après la résolution de la demande par une autre surface, après une
notification distante de résolution et chaque fois qu’un accusé de réception de résolution peut avoir été
perdu. Les actions restent indisponibles jusqu’à ce que cette relecture confirme si la
demande est toujours en attente.

La propriété de l’approbation est liée au Gateway sélectionné. Le changement de Gateway ne peut pas
appliquer une ancienne invite à la connexion de remplacement. Les Gateway antérieurs aux
méthodes d’approbation unifiées utilisent comme solution de repli les méthodes spécifiques à l’exécution déjà publiées ;
la conservation de l’état terminal et les résultats inter-surfaces plus détaillés nécessitent un
Gateway à jour.

## Node Apple Watch direct facultatif

Le mode direct attribue à la montre sa propre identité de Node signée et sa propre connexion au Gateway.
Les commandes de Node prises en charge continuent de fonctionner via le Wi-Fi ou le réseau cellulaire de la montre tant que
OpenClaw est actif, même si l’iPhone associé est indisponible.

Prérequis :

- L’iPhone est connecté au Gateway avec la portée `operator.admin`.
- Le code de configuration annonce un point de terminaison Gateway `wss://` avec un certificat approuvé
  par watchOS ; la montre interroge périodiquement l’origine `https://` correspondante. Le HTTP en texte clair et
  les certificats autosignés ou approuvés uniquement par empreinte ne sont pas pris en charge. Consultez l’[association
  gérée par le Gateway](/fr/gateway/pairing) pour la configuration du point de terminaison. Les routes de bouclage, accessibles uniquement depuis l’iPhone
  ou limitées au tailnet ne sont pas accessibles indépendamment par la montre.
- L’utilisation du réseau cellulaire nécessite une Apple Watch compatible avec cette fonctionnalité et disposant d’un service actif.
- OpenClaw est actif sur la montre. Apple n’autorise pas les apps watchOS ordinaires à
  maintenir des connexions WebSocket/TCP génériques ; le Node direct utilise donc de courtes
  interrogations HTTPS et se reconnecte lorsque l’app revient au premier plan. Consultez les
  [recommandations d’Apple sur les réseaux de bas niveau sous watchOS](https://developer.apple.com/documentation/technotes/tn3135-low-level-networking-on-watchOS).

Configuration :

1. Sur l’iPhone, ouvrez **Réglages -> Apple Watch**.
2. Touchez **Activer la connexion directe au Gateway**.
3. Ouvrez OpenClaw sur la montre avant l’expiration du code de configuration de courte durée.
4. Vérifiez la ligne Apple Watch distincte avec `openclaw nodes status`.

Le code de configuration contient un identifiant d’amorçage de courte durée, réservé au Node ; traitez-le
comme un mot de passe jusqu’à son expiration. Il ne contient jamais le mot de passe ou le jeton
du Gateway enregistré sur l’iPhone. Après l’association, la montre enregistre son propre jeton d’appareil et
supprime l’identifiant d’amorçage. Le mode direct couvre uniquement les commandes ci-dessous.
La discussion, le mode conversation, les approbations et le flux de notifications `watch.*` existant restent
des fonctionnalités relayées par l’iPhone et nécessitent toujours l’iPhone associé.

Commandes directes du Node watchOS :

| Surface       | Commandes                       | Remarques                                                   |
| ------------- | ------------------------------ | ------------------------------------------------------- |
| Appareil        | `device.info`, `device.status` | Identité, batterie, état thermique, stockage et réseau de la Watch. |
| Notifications | `system.notify`                | Tant que l’app est active ; nécessite l’autorisation de la Watch.     |

watchOS n’expose pas WebKit aux apps tierces ; le Node direct de la Watch
n’annonce donc pas les commandes Canvas.

## Notifications push relayées pour les versions officielles

Les versions iOS officielles distribuées utilisent un relais de notifications push externe au lieu de publier le jeton APNs brut auprès du Gateway. Les versions officielles de l’App Store issues du canal de publication public utilisent le relais hébergé à l’adresse `https://ios-push-relay.openclaw.ai` ; cette URL de base est codée en dur pour la distribution sur l’App Store et ne lit aucun remplacement.

Les déploiements de relais personnalisés nécessitent un chemin de compilation et de déploiement iOS délibérément distinct, dont l’URL de relais correspond à celle du Gateway. Le canal de publication de l’App Store n’accepte jamais d’URL de relais personnalisée. Si vous utilisez une version avec relais personnalisé, définissez l’URL de relais correspondante sur le Gateway :

```json5
{
  gateway: {
    push: {
      apns: {
        relay: {
          baseUrl: "https://relay.example.com",
        },
      },
    },
  },
}
```

Fonctionnement du flux :

- L’app iOS s’enregistre auprès du relais à l’aide d’App Attest et d’un JWS de transaction d’app StoreKit.
- Le relais renvoie un identifiant de relais opaque ainsi qu’une autorisation d’envoi limitée à l’enregistrement.
- L’app iOS récupère l’identité du Gateway associé (`gateway.identity.get`) et l’inclut dans l’enregistrement auprès du relais, afin que l’enregistrement relayé soit délégué à ce Gateway précis.
- L’app transmet cet enregistrement relayé au Gateway associé avec `push.apns.register`.
- Le Gateway utilise cet identifiant de relais enregistré pour `push.test`, les réveils en arrière-plan et les sollicitations de réveil.
- Si l’app se connecte ensuite à un autre Gateway ou si une version utilise une URL de base de relais différente, elle actualise l’enregistrement auprès du relais au lieu de réutiliser l’ancienne liaison.

Ce dont le Gateway n’a **pas** besoin pour ce chemin : aucun jeton de relais valable pour l’ensemble du déploiement, aucune clé APNs directe pour les envois officiels relayés de l’App Store.

Flux attendu pour l’opérateur :

1. Installez l’app iOS officielle.
2. Facultatif : définissez `gateway.push.apns.relay.baseUrl` sur le Gateway uniquement lors de l’utilisation d’une version avec relais personnalisé délibérément distincte.
3. Associez l’app au Gateway et laissez-la terminer la connexion.
4. L’app publie `push.apns.register` dès qu’elle dispose d’un jeton APNs, que la session de l’opérateur est connectée et que l’enregistrement auprès du relais a réussi.
5. Ensuite, `push.test`, les réveils lors de la reconnexion et les sollicitations de réveil peuvent utiliser l’enregistrement relayé conservé.

## Balises de présence actives en arrière-plan

Lorsque iOS réveille l’app pour une notification push silencieuse, une actualisation en arrière-plan ou un événement de changement de position significatif, l’app tente une brève reconnexion du Node, puis appelle `node.event` avec `event: "node.presence.alive"`. Le Gateway enregistre cette opération sous la forme `lastSeenAtMs`/`lastSeenReason` dans les métadonnées du Node/appareil appairé uniquement après que l’identité authentifiée de l’appareil Node est connue.

L’app considère qu’un réveil en arrière-plan a été correctement enregistré uniquement lorsque la réponse du Gateway inclut `handled: true`. Les anciens Gateway peuvent accuser réception de `node.event` avec `{ "ok": true }` ; cette réponse est compatible, mais ne compte pas comme une mise à jour durable de la dernière activité.

Remarque sur la compatibilité :

- `OPENCLAW_APNS_RELAY_BASE_URL` fonctionne toujours comme remplacement temporaire par variable d’environnement pour le Gateway (`gateway.push.apns.relay.baseUrl` est la voie privilégiant la configuration).
- Le mode push de la version App Store code en dur l’hôte du relais hébergé et ne lit jamais de remplacement de l’URL du relais — la variable d’environnement de compilation `OPENCLAW_PUSH_RELAY_BASE_URL` affecte uniquement les modes de compilation iOS locaux/de bac à sable.

## Flux d’authentification et de confiance

Le relais existe pour imposer deux contraintes que l’utilisation directe d’APNs sur le Gateway ne peut pas assurer pour les versions iOS officielles :

- Seules les versions iOS OpenClaw authentiques distribuées par Apple peuvent utiliser le relais hébergé.
- Un Gateway peut envoyer des notifications push via le relais uniquement aux appareils iOS appairés avec ce Gateway précis.

Étape par étape :

1. `iOS app -> gateway` : l’app s’appaire avec le Gateway via le flux d’authentification Gateway normal, ce qui lui fournit une session Node authentifiée ainsi qu’une session opérateur authentifiée. La session opérateur appelle `gateway.identity.get`.
2. `iOS app -> relay` : l’app appelle les points de terminaison d’enregistrement du relais via HTTPS avec une preuve App Attest et un JWS de transaction d’app StoreKit. Le relais valide l’identifiant du bundle, la preuve App Attest et la preuve de distribution Apple, et exige le circuit de distribution officiel/de production — c’est ce qui empêche les versions Xcode/de développement locales d’utiliser le relais hébergé, car une version locale ne peut pas fournir la preuve de distribution Apple officielle.
3. `gateway identity delegation` : avant l’enregistrement auprès du relais, l’app récupère l’identité du Gateway appairé depuis `gateway.identity.get` et l’inclut dans la charge utile d’enregistrement du relais. Le relais renvoie un identifiant de relais et une autorisation d’envoi limitée à l’enregistrement, déléguée à cette identité de Gateway.
4. `gateway -> relay` : le Gateway stocke l’identifiant de relais et l’autorisation d’envoi provenant de `push.apns.register`. Lors de `push.test`, des réveils de reconnexion et des sollicitations de réveil, le Gateway signe la demande d’envoi avec sa propre identité d’appareil ; le relais vérifie à la fois l’autorisation d’envoi stockée et la signature du Gateway par rapport à l’identité de Gateway déléguée lors de l’enregistrement. Un autre Gateway ne peut pas réutiliser cet enregistrement stocké, même s’il obtient l’identifiant d’une manière ou d’une autre.
5. `relay -> APNs` : le relais détient les identifiants APNs de production et le jeton APNs brut de la version officielle. Le Gateway ne stocke jamais le jeton APNs brut des versions officielles utilisant le relais ; le relais envoie la notification push finale à APNs pour le compte du Gateway appairé.

Raison de cette conception : conserver les identifiants APNs de production hors des Gateway des utilisateurs, éviter de stocker les jetons APNs bruts des versions officielles sur le Gateway, réserver l’utilisation du relais hébergé aux versions iOS OpenClaw officielles et empêcher un Gateway d’envoyer des notifications push de réveil aux appareils iOS appartenant à un autre Gateway.

Les versions locales/manuelles continuent d’utiliser directement APNs. Si vous testez ces versions sans le relais, le Gateway a toujours besoin d’identifiants APNs directs :

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

Il s’agit de variables d’environnement d’exécution de l’hôte du Gateway, et non de paramètres Fastlane. `apps/ios/fastlane/.env` stocke uniquement l’authentification App Store Connect, telle que `APP_STORE_CONNECT_KEY_ID` et `APP_STORE_CONNECT_ISSUER_ID` ; cela ne configure pas l’envoi direct par APNs pour les versions iOS locales.

Stockage recommandé sur l’hôte du Gateway, conforme aux autres identifiants de fournisseurs sous `~/.openclaw/credentials/` :

```bash
mkdir -p ~/.openclaw/credentials/apns
chmod 700 ~/.openclaw/credentials/apns
mv /path/to/AuthKey_KEYID.p8 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
chmod 600 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
export OPENCLAW_APNS_PRIVATE_KEY_PATH="$HOME/.openclaw/credentials/apns/AuthKey_KEYID.p8"
```

Ne validez pas le fichier `.p8` dans Git et ne le placez pas dans l’extraction du dépôt.

## Voies de découverte

### Bonjour (LAN)

L’app iOS recherche `_openclaw-gw._tcp` sur `local.` et, lorsqu’il est configuré, le même domaine de découverte DNS-SD étendu. Les Gateway situés sur le même LAN apparaissent automatiquement via `local.` ; la découverte entre réseaux peut utiliser le domaine étendu configuré sans modifier le type de balise.

### Tailnet (interréseaux)

Si mDNS est bloqué, utilisez une zone DNS-SD monodiffusion (choisissez un domaine ; exemple : `openclaw.internal.`) et le DNS partagé de Tailscale. Consultez [Bonjour](/fr/gateway/bonjour) pour l’exemple CoreDNS.

### Hôte/port manuel

Dans Settings, activez **Manual Host** et saisissez l’hôte et le port du Gateway (valeur par défaut : `18789`).

## Plusieurs Gateway

L’app conserve un registre de tous les Gateway avec lesquels elle a été appairée afin que vous puissiez passer de l’un à l’autre sans recommencer l’appairage :

- **Settings -> Gateway** affiche une liste **Paired Gateways** dans laquelle le Gateway actif est indiqué. Touchez une entrée pour changer de Gateway ; l’app met fin aux sessions actuelles et se reconnecte au Gateway sélectionné. Un menu de changement rapide apparaît à côté de la ligne de connexion lorsque plusieurs Gateway sont appairés.
- Les identifiants, les décisions de confiance TLS, les préférences propres à chaque Gateway et l’historique de discussion mis en cache sont stockés séparément pour chaque Gateway. Le changement de Gateway ne mélange jamais les états, et l’enregistrement des notifications push suit le Gateway actif.
- Balayez un Gateway appairé (ou utilisez son menu contextuel) pour sélectionner **Forget**, ce qui supprime ses identifiants, ses jetons d’appareil, son ancrage TLS et ses discussions mises en cache.
- Les Gateway découverts doivent être visibles sur le réseau pour permettre d’y basculer ; les Gateway manuels se reconnectent à l’aide de l’hôte et du port enregistrés.

## Canvas + A2UI

Le Node iOS affiche un Canvas WKWebView. Utilisez `node.invoke` pour le piloter :

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

Remarques :

- L’hôte Canvas du Gateway sert `/__openclaw__/canvas/` et `/__openclaw__/a2ui/` depuis le serveur HTTP du Gateway (même port que `gateway.port`, valeur par défaut : `18789`).
- Le Node iOS conserve l’interface intégrée comme vue connectée par défaut. `canvas.a2ui.push` et `canvas.a2ui.reset` utilisent la page A2UI intégrée appartenant à l’app.
- Les pages A2UI distantes du Gateway sont uniquement affichables sur iOS ; les actions des boutons A2UI natifs sont acceptées uniquement depuis les pages intégrées appartenant à l’app.
- Revenez à l’interface intégrée avec `canvas.navigate` et `{"url":""}`.

## Relation avec Computer Use

L’app iOS est une interface de Node mobile, et non un backend Codex Computer Use. Codex Computer Use et `cua-driver mcp` contrôlent un bureau macOS local à l’aide d’outils MCP ; l’app iOS expose les capacités de l’iPhone au moyen de commandes de Node OpenClaw telles que `canvas.*`, `camera.*`, `screen.*`, `location.*` et `talk.*`.

Les agents peuvent tout de même utiliser l’app iOS via OpenClaw en invoquant des commandes de Node, mais ces appels passent par le protocole de Node du Gateway et sont soumis aux limitations d’iOS au premier plan et en arrière-plan. Utilisez [Codex Computer Use](/fr/plugins/codex-computer-use) pour contrôler le bureau local et cette page pour les capacités du Node iOS.

### Évaluation / instantané du Canvas

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## Réveil vocal + mode conversation

- Le réveil vocal et le mode conversation sont disponibles dans Settings.
- La conversation en temps réel d’OpenAI utilise WebRTC côté client lorsque `talk.realtime.transport` est `webrtc` ; une configuration explicite de `gateway-relay` reste gérée par le Gateway. Consultez [Mode conversation](/fr/nodes/talk).
- Les Nodes iOS compatibles avec la conversation annoncent la capacité `talk` et peuvent déclarer `talk.ptt.start`, `talk.ptt.stop`, `talk.ptt.cancel` et `talk.ptt.once` ; le Gateway autorise par défaut ces commandes d’appui pour parler pour les Nodes de confiance compatibles avec la conversation.
- iOS peut suspendre l’audio en arrière-plan ; considérez les fonctionnalités vocales comme fournies au mieux lorsque l’app n’est pas active.

## Erreurs courantes

- `NODE_BACKGROUND_UNAVAILABLE` : placez l’app iOS au premier plan (les commandes Canvas, caméra et écran l’exigent).
- `A2UI_HOST_UNAVAILABLE` : la page A2UI intégrée était inaccessible dans la WebView de l’app ; gardez l’app au premier plan dans l’onglet Screen, puis réessayez.
- L’invite d’appairage n’apparaît jamais : exécutez `openclaw devices list` et approuvez manuellement.
- La Watch n’affiche aucun état de l’iPhone : vérifiez que l’iPhone signale `watchPaired: true`
  et `watchAppInstalled: true` dans `watch.status`. Si l’appairage est faux, appairez la
  Watch dans l’app Watch d’Apple. Si l’installation est fausse, installez l’app compagnon
  depuis **My Watch -> Available Apps**. Après l’un ou l’autre changement, ouvrez OpenClaw une fois sur la
  Watch ; l’accessibilité immédiate exige toujours que les deux apps soient en cours d’exécution,
  tandis que les mises à jour en file d’attente peuvent arriver ultérieurement en arrière-plan.
- La reconnexion échoue après une réinstallation : le jeton d’appairage du trousseau a été effacé ; appairez de nouveau le Node.

## Documentation associée

- [Appairage](/fr/channels/pairing)
- [Découverte](/fr/gateway/discovery)
- [Bonjour](/fr/gateway/bonjour)
