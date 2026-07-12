---
read_when:
    - Association ou reconnexion du Node iOS
    - Activation ou dépannage du Node Apple Watch direct
    - Exécuter l’application iOS depuis le code source
    - Débogage de la découverte du Gateway ou des commandes de canevas
summary: 'Application de nœud iOS : connexion au Gateway, appairage, canevas et dépannage'
title: Application iOS
x-i18n:
    generated_at: "2026-07-12T15:29:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 30d70f6df7fa1226bbcc79da4e7ece29f8531d5ea1fcf23b742e78d36fb9fc02
    source_path: platforms/ios.md
    workflow: 16
---

Disponibilité : les versions de l’app iPhone sont distribuées par les canaux Apple lorsqu’elles sont activées pour une version. Les versions de développement locales peuvent également être exécutées à partir du code source.

## Fonctionnalités

- Se connecte à un Gateway via WebSocket (réseau local ou tailnet).
- Expose les capacités du Node : Canvas, capture d’écran, capture avec l’appareil photo, localisation, mode Conversation, activation vocale.
- Reçoit les commandes `node.invoke` et signale les événements d’état du Node.
- Permet de parcourir en lecture seule l’espace de travail de l’agent sélectionné depuis la surface Agents (Fichiers) : navigation dans les répertoires, aperçus de texte avec coloration syntaxique, aperçus d’images et exportation via la feuille de partage. Aucune opération d’écriture ; la taille des aperçus est limitée par le Gateway.
- Conserve un petit cache hors ligne en lecture seule des sessions de discussion et transcriptions récentes pour chaque Gateway appairé : lors d’un démarrage à froid, la dernière transcription connue s’affiche immédiatement et est actualisée dès que le Gateway répond ; les discussions récentes restent consultables hors connexion ; la réinitialisation ou l’oubli purge le cache local protégé.
- Place les messages texte envoyés hors connexion dans une boîte d’envoi persistante propre à chaque Gateway (jusqu’à 50) : les bulles en attente apparaissent dans la transcription, sont envoyées dans l’ordre lors de la reconnexion avec des nouvelles tentatives idempotentes, restent conservées jusqu’à ce que l’historique canonique confirme l’envoi, font l’objet de nouvelles tentatives avec temporisation exponentielle avant de proposer une action de nouvelle tentative ou de suppression, et expirent au lieu d’être envoyées après 48 heures hors ligne ; la réinitialisation ou l’oubli efface la file d’attente avec le cache.
- Lit les messages de l’assistant à la demande : effectuez un appui long sur un message dans la discussion et choisissez **Écouter**. L’app lit les extraits `tts.speak` pris en charge par le Gateway avec le fournisseur TTS configuré et utilise la synthèse vocale de l’appareil lorsque l’audio du Gateway est indisponible ou illisible. La lecture s’arrête lors d’un changement de session ou du passage en arrière-plan.

## Prérequis

- Gateway exécuté sur un autre appareil (macOS, Linux ou Windows via WSL2).
- Chemin réseau :
  - Même réseau local via Bonjour, **ou**
  - Tailnet via DNS-SD monodiffusion (exemple de domaine : `openclaw.internal.`), **ou**
  - Hôte/port manuel (solution de repli).

## Démarrage rapide (appairage et connexion)

1. Démarrez un Gateway authentifié avec une route accessible depuis votre téléphone. Tailscale
   Serve est le chemin distant recommandé :

```bash
openclaw gateway --port 18789 --tailscale serve
```

Pour une configuration fiable sur le même réseau local, utilisez plutôt un
`gateway.bind: "lan"` authentifié. La liaison en boucle locale par défaut n’est
pas accessible depuis un téléphone. Si le Gateway n’a pas encore été configuré,
exécutez d’abord `openclaw onboard` afin que la création du code de configuration
dispose d’un chemin d’authentification par jeton ou mot de passe.

2. Ouvrez l’[interface de contrôle](/fr/web/control-ui), sélectionnez **Nodes**, puis cliquez sur
   **Pair mobile device** sur la page **Devices**.

3. Dans l’app iOS, ouvrez **Settings** -> **Gateway**, scannez le code QR (ou collez
   le code de configuration), puis connectez-vous.

   Si le code de configuration contient à la fois des routes de réseau local et Tailscale Serve, l’app
   les sonde dans l’ordre et enregistre le premier point de terminaison accessible.

4. L’app officielle se connecte automatiquement. Si **Pending approval** affiche une
   demande, examinez son rôle et ses portées avant de l’approuver.

Le bouton de l’interface de contrôle nécessite une session déjà appairée avec `operator.admin`.
Comme solution de repli dans le terminal, choisissez un Gateway détecté dans l’app iOS (ou activez
Manual Host et saisissez l’hôte/le port), puis approuvez la demande sur l’hôte du Gateway :

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Si l’app tente de nouveau l’appairage avec des informations d’authentification modifiées (rôle/portées/clé publique), la demande en attente précédente est remplacée et un nouveau `requestId` est créé. Exécutez de nouveau `openclaw devices list` avant l’approbation.

Facultatif : si le Node iOS se connecte toujours depuis un sous-réseau strictement contrôlé, vous pouvez activer l’approbation automatique du Node lors du premier appairage avec des CIDR explicites ou des adresses IP exactes :

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

Cette option est désactivée par défaut. Elle ne s’applique qu’à un nouvel appairage avec `role: node` sans portée demandée. L’appairage d’un opérateur/navigateur et toute modification du rôle, de la portée, des métadonnées ou de la clé publique nécessitent toujours une approbation manuelle.

5. Vérifiez la connexion :

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

Par défaut, l’app complémentaire Apple Watch continue d’utiliser le relais iPhone existant et
ne nécessite pas d’appairage Gateway distinct. Appairez la montre à l’iPhone dans
l’app Watch d’Apple, installez OpenClaw depuis **Watch app -> My Watch -> Available
Apps**, puis ouvrez OpenClaw une fois sur les deux appareils.

## Examiner les approbations de commandes

Une connexion d’opérateur avec `operator.admin`, ou une connexion
`operator.approvals` appairée et explicitement ciblée par le Gateway, peut examiner
les demandes d’exécution en attente sur iPhone. La carte d’approbation affiche
l’aperçu de commande nettoyé fourni par le Gateway, l’avertissement, le contexte
de l’hôte, l’expiration et uniquement les décisions proposées par cette demande.
L’Apple Watch appairée reçoit la même invite sûre pour l’examinateur par
l’intermédiaire du relais iPhone existant et propose le sous-ensemble compact de
décisions autoriser une fois/refuser. Le mode Gateway direct de la montre ne
transmet pas les invites d’approbation.

L’état d’approbation est partagé avec l’interface de contrôle et les surfaces de
discussion prises en charge. La première réponse validée prévaut. L’iPhone et la
montre récupèrent l’enregistrement terminal canonique du Gateway après qu’une
autre surface a résolu la demande, après une notification distante de résolution
et chaque fois qu’un accusé de résolution peut avoir été perdu. Les actions
restent indisponibles jusqu’à ce que cette relecture confirme si la demande est
toujours en attente.

La propriété de l’approbation est liée au Gateway sélectionné. Le changement de
Gateway ne peut pas appliquer une ancienne invite à la connexion de remplacement.
Les Gateway antérieurs aux méthodes d’approbation unifiées utilisent comme
solution de repli les méthodes spécifiques à l’exécution déjà distribuées ;
la conservation de l’état terminal et les résultats inter-surfaces plus riches
nécessitent un Gateway mis à jour.

## Node Apple Watch direct facultatif

Le mode direct attribue à la montre sa propre identité de Node signée et sa propre connexion au Gateway.
Les commandes de Node prises en charge continuent de fonctionner par Wi-Fi ou réseau cellulaire sur la montre pendant
qu’OpenClaw est actif, même lorsque l’iPhone appairé est indisponible.

Prérequis :

- L’iPhone est connecté au Gateway avec la portée `operator.admin`.
- Le code de configuration annonce un point de terminaison Gateway `wss://` avec un certificat approuvé
  par watchOS ; la montre interroge périodiquement l’origine `https://` correspondante. Le HTTP simple et
  les certificats autosignés ou la confiance fondée uniquement sur l’empreinte ne sont pas pris en charge. Consultez l’[appairage
  géré par le Gateway](/fr/gateway/pairing) pour la configuration du point de terminaison. Les routes en boucle locale, propres à l’iPhone
  et limitées au tailnet ne sont pas accessibles indépendamment par la montre.
- L’utilisation du réseau cellulaire nécessite une Apple Watch compatible avec le réseau cellulaire et un service actif.
- OpenClaw est actif sur la montre. Apple n’autorise pas les apps watchOS ordinaires à
  maintenir des connexions WebSocket/TCP génériques ; le Node direct utilise donc de courtes
  interrogations HTTPS et se reconnecte lorsque l’app revient au premier plan. Consultez les
  [recommandations d’Apple sur la mise en réseau de bas niveau sous watchOS](https://developer.apple.com/documentation/technotes/tn3135-low-level-networking-on-watchOS).

Configuration :

1. Sur l’iPhone, ouvrez **Settings -> Apple Watch**.
2. Touchez **Enable Direct Gateway Connection**.
3. Ouvrez OpenClaw sur la montre avant l’expiration du code de configuration à courte durée de vie.
4. Vérifiez la ligne Apple Watch distincte avec `openclaw nodes status`.

Le code de configuration contient un identifiant d’amorçage à courte durée de vie réservé au Node ; traitez-le
comme un mot de passe jusqu’à son expiration. Il ne contient jamais le mot de passe ni le jeton du Gateway
enregistré sur l’iPhone. Après l’appairage, la montre stocke son propre jeton d’appareil et
supprime l’identifiant d’amorçage. Le mode direct couvre uniquement les commandes ci-dessous.
La discussion, le mode Conversation, les approbations et le flux de notifications `watch.*` existant restent
des fonctionnalités du relais iPhone et nécessitent toujours l’iPhone appairé.

Commandes directes du Node watchOS :

| Surface       | Commandes                      | Remarques                                                     |
| ------------- | ------------------------------ | ------------------------------------------------------------- |
| Appareil      | `device.info`, `device.status` | Identité de la montre, batterie, état thermique, stockage et réseau. |
| Notifications | `system.notify`                | Lorsque l’app est active ; nécessite l’autorisation de la montre. |

watchOS n’expose pas WebKit aux apps tierces ; le Node direct de la montre
n’annonce donc pas de commandes Canvas.

## Notifications push par relais pour les versions officielles

Les versions iOS officielles distribuées utilisent un relais de notifications push externe au lieu de publier le jeton APNs brut auprès du Gateway. Les versions officielles de l’App Store issues du canal de publication public utilisent le relais hébergé à l’adresse `https://ios-push-relay.openclaw.ai` ; cette URL de base est codée en dur pour la distribution sur l’App Store et ne lit aucune valeur de remplacement.

Les déploiements de relais personnalisés nécessitent un chemin de compilation/déploiement iOS volontairement distinct dont l’URL de relais correspond à celle du Gateway. Le canal de publication de l’App Store n’accepte jamais d’URL de relais personnalisée. Si vous utilisez une version avec relais personnalisé, définissez l’URL de relais correspondante sur le Gateway :

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
- L’app iOS récupère l’identité du Gateway appairé (`gateway.identity.get`) et l’inclut dans l’enregistrement auprès du relais, afin que l’enregistrement soutenu par le relais soit délégué à ce Gateway précis.
- L’app transmet cet enregistrement soutenu par le relais au Gateway appairé avec `push.apns.register`.
- Le Gateway utilise cet identifiant de relais enregistré pour `push.test`, les réveils en arrière-plan et les sollicitations de réveil.
- Si l’app se connecte ensuite à un autre Gateway ou à une version utilisant une autre URL de base du relais, elle actualise l’enregistrement auprès du relais au lieu de réutiliser l’ancienne liaison.

Ce dont le Gateway n’a **pas** besoin pour ce chemin : aucun jeton de relais à l’échelle du déploiement, aucune clé APNs directe pour les envois officiels de l’App Store soutenus par le relais.

Flux attendu pour l’opérateur :

1. Installez l’app iOS officielle.
2. Facultatif : définissez `gateway.push.apns.relay.baseUrl` sur le Gateway uniquement lorsque vous utilisez une version personnalisée volontairement distincte avec relais.
3. Appairez l’app au Gateway et laissez-la terminer la connexion.
4. L’app publie `push.apns.register` dès qu’elle dispose d’un jeton APNs, que la session de l’opérateur est connectée et que l’enregistrement auprès du relais réussit.
5. Ensuite, `push.test`, les réveils de reconnexion et les sollicitations de réveil peuvent utiliser l’enregistrement soutenu par le relais qui a été stocké.

## Signaux de présence en arrière-plan

Quand iOS réveille l’app à la suite d’une notification push silencieuse, d’une actualisation en arrière-plan ou d’un événement de changement significatif de localisation, l’app tente une brève reconnexion du Node, puis appelle `node.event` avec `event: "node.presence.alive"`. Le Gateway enregistre cet événement sous la forme `lastSeenAtMs`/`lastSeenReason` dans les métadonnées du Node/appareil appairé uniquement après avoir identifié l’identité authentifiée de l’appareil Node.

L’app considère qu’un réveil en arrière-plan a été correctement enregistré uniquement lorsque la réponse du Gateway contient `handled: true`. Les anciens Gateway peuvent accuser réception de `node.event` avec `{ "ok": true }` ; cette réponse est compatible, mais ne compte pas comme une mise à jour persistante de la dernière activité.

Remarque sur la compatibilité :

- `OPENCLAW_APNS_RELAY_BASE_URL` fonctionne toujours comme remplacement temporaire par variable d’environnement pour le Gateway (`gateway.push.apns.relay.baseUrl` est le chemin de configuration prioritaire).
- Le mode de notifications push de la version App Store code en dur l’hôte du relais hébergé et ne lit jamais de remplacement de l’URL du relais — la variable d’environnement de compilation `OPENCLAW_PUSH_RELAY_BASE_URL` affecte uniquement les modes de compilation iOS locaux/de bac à sable.

## Flux d’authentification et de confiance

Le relais sert à faire respecter deux contraintes que l’utilisation directe d’APNs sur le Gateway ne permet pas de garantir pour les versions iOS officielles :

- Seules les versions iOS authentiques d’OpenClaw distribuées par Apple peuvent utiliser le relais hébergé.
- Un Gateway peut envoyer des notifications push soutenues par le relais uniquement aux appareils iOS appairés avec ce Gateway précis.

Étape par étape :

1. `iOS app -> gateway` : l’app s’associe au Gateway via le flux d’authentification normal du Gateway, ce qui lui fournit une session de Node authentifiée ainsi qu’une session d’opérateur authentifiée. La session d’opérateur appelle `gateway.identity.get`.
2. `iOS app -> relay` : l’app appelle les points de terminaison d’enregistrement du relais via HTTPS avec une preuve App Attest ainsi qu’un JWS de transaction d’app StoreKit. Le relais valide l’identifiant du bundle, la preuve App Attest et la preuve de distribution Apple, et exige le canal de distribution officiel/de production — c’est ce qui empêche les builds Xcode/de développement locaux d’utiliser le relais hébergé, puisqu’un build local ne peut pas fournir la preuve de distribution Apple officielle.
3. `gateway identity delegation` : avant l’enregistrement auprès du relais, l’app récupère l’identité du Gateway associé via `gateway.identity.get` et l’inclut dans la charge utile d’enregistrement auprès du relais. Le relais renvoie un handle de relais ainsi qu’une autorisation d’envoi limitée à l’enregistrement et déléguée à cette identité de Gateway.
4. `gateway -> relay` : le Gateway stocke le handle de relais et l’autorisation d’envoi provenant de `push.apns.register`. Lors de `push.test`, des réveils de reconnexion et des sollicitations de réveil, le Gateway signe la requête d’envoi avec sa propre identité d’appareil ; le relais vérifie à la fois l’autorisation d’envoi stockée et la signature du Gateway par rapport à l’identité de Gateway déléguée lors de l’enregistrement. Un autre Gateway ne peut pas réutiliser cet enregistrement stocké, même s’il obtient le handle d’une manière ou d’une autre.
5. `relay -> APNs` : le relais détient les identifiants APNs de production et le jeton APNs brut du build officiel. Le Gateway ne stocke jamais le jeton APNs brut pour les builds officiels utilisant le relais ; le relais envoie la notification push finale à APNs pour le compte du Gateway associé.

Pourquoi cette conception a été créée : pour conserver les identifiants APNs de production hors des Gateways des utilisateurs, éviter de stocker les jetons APNs bruts des builds officiels sur le Gateway, autoriser l’utilisation du relais hébergé uniquement pour les builds iOS officiels d’OpenClaw et empêcher un Gateway d’envoyer des notifications push de réveil à des appareils iOS appartenant à un autre Gateway.

Les builds locaux/manuels continuent d’utiliser directement APNs. Si vous testez ces builds sans le relais, le Gateway a toujours besoin d’identifiants APNs directs :

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

Il s’agit de variables d’environnement d’exécution de l’hôte du Gateway, et non de paramètres Fastlane. `apps/ios/fastlane/.env` stocke uniquement les données d’authentification App Store Connect telles que `APP_STORE_CONNECT_KEY_ID` et `APP_STORE_CONNECT_ISSUER_ID` ; il ne configure pas la remise directe via APNs pour les builds iOS locaux.

Stockage recommandé sur l’hôte du Gateway, conformément aux autres identifiants de fournisseurs sous `~/.openclaw/credentials/` :

```bash
mkdir -p ~/.openclaw/credentials/apns
chmod 700 ~/.openclaw/credentials/apns
mv /path/to/AuthKey_KEYID.p8 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
chmod 600 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
export OPENCLAW_APNS_PRIVATE_KEY_PATH="$HOME/.openclaw/credentials/apns/AuthKey_KEYID.p8"
```

Ne validez pas le fichier `.p8` dans Git et ne le placez pas dans le checkout du dépôt.

## Méthodes de découverte

### Bonjour (LAN)

L’app iOS recherche `_openclaw-gw._tcp` sur `local.` et, lorsqu’il est configuré, sur le même domaine de découverte DNS-SD étendu. Les Gateways du même LAN apparaissent automatiquement depuis `local.` ; la découverte entre réseaux peut utiliser le domaine étendu configuré sans modifier le type de balise.

### Tailnet (interréseaux)

Si mDNS est bloqué, utilisez une zone DNS-SD monodiffusion (choisissez un domaine ; exemple : `openclaw.internal.`) et le DNS fractionné de Tailscale. Consultez [Bonjour](/fr/gateway/bonjour) pour l’exemple CoreDNS.

### Hôte/port manuel

Dans Settings, activez **Manual Host** et saisissez l’hôte et le port du Gateway (par défaut `18789`).

## Plusieurs Gateways

L’app conserve un registre de tous les Gateways auxquels elle a été associée, afin que vous puissiez passer de l’un à l’autre sans les associer de nouveau :

- **Settings -> Gateway** affiche une liste **Paired Gateways** où le Gateway actif est indiqué. Touchez une entrée pour changer de Gateway ; l’app ferme les sessions actuelles et se reconnecte au Gateway sélectionné. Un menu de changement rapide apparaît à côté de la ligne de connexion lorsque plusieurs Gateways sont associés.
- Les identifiants, les décisions d’approbation TLS, les préférences propres à chaque Gateway et l’historique de discussion mis en cache sont stockés séparément pour chaque Gateway. Le changement de Gateway ne mélange jamais les états, et l’enregistrement des notifications push suit le Gateway actif.
- Balayez un Gateway associé (ou utilisez son menu contextuel) pour l’**Forget**, ce qui supprime ses identifiants, ses jetons d’appareil, son ancrage TLS et ses discussions mises en cache.
- Les Gateways découverts doivent être visibles sur le réseau pour pouvoir basculer vers eux ; les Gateways manuels se reconnectent au moyen de l’hôte et du port enregistrés.

## Canevas + A2UI

Le Node iOS affiche un canevas WKWebView. Utilisez `node.invoke` pour le piloter :

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

Remarques :

- L’hôte du canevas du Gateway sert `/__openclaw__/canvas/` et `/__openclaw__/a2ui/` depuis le serveur HTTP du Gateway (même port que `gateway.port`, `18789` par défaut).
- Le Node iOS conserve la structure intégrée comme vue connectée par défaut. `canvas.a2ui.push` et `canvas.a2ui.reset` utilisent la page A2UI intégrée appartenant à l’app.
- Les pages A2UI distantes du Gateway sont uniquement destinées au rendu sur iOS ; les actions natives des boutons A2UI sont acceptées uniquement depuis les pages intégrées appartenant à l’app.
- Revenez à la structure intégrée avec `canvas.navigate` et `{"url":""}`.

## Relation avec Computer Use

L’app iOS est une interface de Node mobile, et non un backend Codex Computer Use. Codex Computer Use et `cua-driver mcp` contrôlent un bureau macOS local au moyen d’outils MCP ; l’app iOS expose les fonctionnalités de l’iPhone par l’intermédiaire de commandes de Node OpenClaw telles que `canvas.*`, `camera.*`, `screen.*`, `location.*` et `talk.*`.

Les agents peuvent néanmoins piloter l’app iOS via OpenClaw en invoquant des commandes de Node, mais ces appels passent par le protocole de Node du Gateway et respectent les limites d’exécution d’iOS au premier plan et en arrière-plan. Utilisez [Codex Computer Use](/fr/plugins/codex-computer-use) pour contrôler le bureau local et cette page pour les fonctionnalités du Node iOS.

### Évaluation / instantané du canevas

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## Réveil vocal + mode conversation

- Le réveil vocal et le mode conversation sont disponibles dans Settings.
- Le mode Talk en temps réel d’OpenAI utilise WebRTC côté client lorsque `talk.realtime.transport` vaut `webrtc` ; une configuration explicite `gateway-relay` reste gérée par le Gateway. Consultez [Mode Talk](/fr/nodes/talk).
- Les Nodes iOS compatibles avec Talk annoncent la fonctionnalité `talk` et peuvent déclarer `talk.ptt.start`, `talk.ptt.stop`, `talk.ptt.cancel` et `talk.ptt.once` ; le Gateway autorise par défaut ces commandes push-to-talk pour les Nodes compatibles avec Talk et approuvés.
- iOS peut suspendre l’audio en arrière-plan ; considérez les fonctionnalités vocales comme étant fournies sans garantie lorsque l’app n’est pas active.

## Erreurs courantes

- `NODE_BACKGROUND_UNAVAILABLE` : placez l’app iOS au premier plan (les commandes de canevas, de caméra et d’écran l’exigent).
- `A2UI_HOST_UNAVAILABLE` : la page A2UI intégrée n’était pas accessible dans la WebView de l’app ; maintenez l’app au premier plan dans l’onglet Screen et réessayez.
- L’invite d’association n’apparaît jamais : exécutez `openclaw devices list` et approuvez manuellement.
- La Watch n’affiche aucun état de l’iPhone : vérifiez que l’iPhone indique `watchPaired: true`
  et `watchAppInstalled: true` dans `watch.status`. Si l’association est fausse, associez la
  Watch dans l’app Watch d’Apple. Si l’installation est fausse, installez l’app compagnon
  depuis **My Watch -> Available Apps**. Après l’une ou l’autre modification, ouvrez une fois OpenClaw sur la
  Watch ; l’accessibilité immédiate exige toujours que les deux apps soient en cours d’exécution,
  tandis que les mises à jour en file d’attente peuvent arriver ultérieurement en arrière-plan.
- Échec de la reconnexion après une réinstallation : le jeton d’association du trousseau a été effacé ; associez de nouveau le Node.

## Documentation associée

- [Association](/fr/channels/pairing)
- [Découverte](/fr/gateway/discovery)
- [Bonjour](/fr/gateway/bonjour)
