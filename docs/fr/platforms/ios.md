---
read_when:
    - Jumelage ou reconnexion du Node iOS
    - Activation ou dépannage du Node Apple Watch direct
    - Exécuter l’application iOS à partir du code source
    - Débogage de la découverte du Gateway ou des commandes canvas
summary: 'Application Node iOS : connexion au Gateway, appairage, canvas et dépannage'
title: Application iOS
x-i18n:
    generated_at: "2026-07-12T21:39:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: bf3c90d9b9be2fdfd1e4b85eebe9b79fe17a8f4aeaf05b60d4911c781e87c075
    source_path: platforms/ios.md
    workflow: 16
---

Disponibilité : les builds de l’app iPhone sont distribués par les canaux Apple lorsqu’ils sont activés pour une version. Les builds de développement locaux peuvent également être exécutés depuis les sources.

## Fonctionnalités

- Se connecte à un Gateway via WebSocket (LAN ou tailnet).
- Expose les capacités du Node : Canvas, capture d’écran, capture par caméra, localisation, mode conversation, activation vocale et résumés de santé facultatifs.
- Reçoit les commandes `node.invoke` et signale les événements d’état du Node.
- Permet de parcourir en lecture seule l’espace de travail de l’agent sélectionné depuis la surface Agents (Fichiers) : navigation dans les répertoires, aperçus de texte avec coloration syntaxique, aperçus d’images et export via la feuille de partage. Aucune opération d’écriture ; la taille des aperçus est limitée par le Gateway.
- Conserve un petit cache hors ligne en lecture seule des sessions de chat et transcriptions récentes pour chaque Gateway jumelé : lors d’un démarrage à froid, la dernière transcription connue s’affiche immédiatement et s’actualise dès que le Gateway répond, les chats récents restent consultables hors connexion et la réinitialisation ou l’oubli purge le cache local protégé.
- Place les messages texte envoyés hors connexion dans une boîte d’envoi durable propre à chaque Gateway (jusqu’à 50) : les bulles en attente s’affichent dans la transcription, sont envoyées dans l’ordre à la reconnexion avec des tentatives idempotentes, restent conservées jusqu’à ce que l’historique canonique confirme l’envoi, font l’objet de nouvelles tentatives avec temporisation avant l’affichage d’une action permettant de réessayer ou de les supprimer, et expirent au lieu d’être envoyées après 48 heures hors ligne ; la réinitialisation ou l’oubli efface la file d’attente avec le cache.
- Lit les messages de l’assistant à la demande : appuyez longuement sur un message dans le chat et choisissez **Écouter**. L’app lit les extraits `tts.speak` pris en charge par le Gateway avec le fournisseur TTS configuré et utilise la synthèse vocale de l’appareil lorsque l’audio du Gateway est indisponible ou illisible. La lecture s’arrête lors d’un changement de session ou du passage en arrière-plan.

## Prérequis

- Gateway exécuté sur un autre appareil (macOS, Linux ou Windows via WSL2).
- Chemin réseau :
  - Même LAN via Bonjour, **ou**
  - Tailnet via DNS-SD monodiffusion (exemple de domaine : `openclaw.internal.`), **ou**
  - Hôte/port manuel (solution de secours).

## Démarrage rapide (jumeler et connecter)

1. Démarrez un Gateway authentifié avec une route accessible depuis votre téléphone. Tailscale
   Serve est le chemin distant recommandé :

```bash
openclaw gateway --port 18789 --tailscale serve
```

Pour une configuration approuvée sur le même LAN, utilisez plutôt un
`gateway.bind: "lan"` authentifié. L’association à l’adresse de bouclage par
défaut n’est pas accessible depuis un téléphone. Si le Gateway n’a pas encore
été configuré, exécutez d’abord `openclaw onboard` afin que la création du code
de configuration dispose d’un chemin d’authentification par jeton ou mot de
passe.

2. Ouvrez la [Control UI](/fr/web/control-ui), sélectionnez **Nodes**, puis cliquez
   sur **Pair mobile device** sur la page **Devices**.

3. Dans l’app iOS, ouvrez **Settings** -> **Gateway**, scannez le code QR (ou
   collez le code de configuration), puis connectez-vous.

   Si le code de configuration contient à la fois des routes LAN et Tailscale Serve,
   l’app les teste dans l’ordre et enregistre le premier point de terminaison accessible.

4. L’app officielle se connecte automatiquement. Si **Pending approval** affiche
   une demande, examinez son rôle et ses portées avant de l’approuver.

Le bouton de la Control UI nécessite une session déjà jumelée avec `operator.admin`.
Comme solution de secours dans le terminal, choisissez un Gateway découvert dans
l’app iOS (ou activez Manual Host et saisissez l’hôte/le port), puis approuvez la
demande sur l’hôte du Gateway :

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Si l’app relance le jumelage avec des informations d’authentification modifiées (rôle/portées/clé publique), la demande en attente précédente est remplacée et un nouveau `requestId` est créé. Exécutez de nouveau `openclaw devices list` avant l’approbation.

Facultatif : si le Node iOS se connecte toujours depuis un sous-réseau étroitement contrôlé, vous pouvez activer l’approbation automatique du Node lors du premier jumelage avec des CIDR explicites ou des adresses IP exactes :

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

Cette option est désactivée par défaut. Elle s’applique uniquement à un nouveau jumelage avec `role: node` sans portée demandée. Le jumelage d’un opérateur/navigateur ainsi que toute modification du rôle, de la portée, des métadonnées ou de la clé publique nécessitent toujours une approbation manuelle.

5. Vérifiez la connexion :

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## Résumés de santé

Le Node iOS peut renvoyer un agrégat en lecture seule calculé sur l’appareil pour `today`. Le résumé fixe comprend le nombre de pas, la durée du sommeil, la fréquence cardiaque moyenne au repos ainsi que le nombre et la durée des entraînements. Il ne renvoie jamais d’échantillons HealthKit individuels, de sources, de métadonnées, de dossiers cliniques ni d’accès en écriture.

Cette surface comporte deux activations facultatives indépendantes :

1. Dans l’app iOS, ouvrez **Settings -> Permissions -> Privacy & Access -> Health Summaries**, puis
   touchez **Enable & Share Summaries**. L’avis explique que l’agrégat demandé
   quitte le téléphone via votre Gateway, atteint votre fournisseur d’IA
   configuré et peut rester dans l’historique du chat.
2. Ajoutez `health.summary` à `gateway.nodes.allowCommands`, puis rejetez et
   approuvez de nouveau la surface de commandes modifiée du Node iPhone. Gardez
   votre Gateway en local ou limité au tailnet ; l’audit de sécurité signale
   cette commande sensible lorsqu’elle est activée.

Les modèles utilisent l’outil `nodes` existant avec `action: "invoke"`,
`invokeCommand: "health.summary"` et `invokeParamsJson` défini sur
`{"period":"today"}`.

HealthKit ne révèle délibérément pas si l’accès en lecture a été refusé. Les
mesures manquantes signifient donc uniquement qu’aucune valeur lisible n’a été
renvoyée ; elles ne prouvent ni un refus ni l’absence de données de santé.
OpenClaw limite les résumés au jour calendaire en cours afin qu’une fenêtre
d’accès historique limitée ne puisse pas donner l’impression qu’un total sur
plusieurs jours est complet. OpenClaw n’ingère pas les données de santé en
arrière-plan et n’utilise pas les résumés à des fins de diagnostic ou de
conseil médical.

Par défaut, l’app compagnon de l’Apple Watch continue d’utiliser le relais iPhone
existant et ne nécessite pas de jumelage distinct avec le Gateway. Jumelez la
Watch avec l’iPhone dans l’app Watch d’Apple, installez OpenClaw depuis **Watch app -> My Watch -> Available
Apps**, puis ouvrez OpenClaw une fois sur les deux appareils.

## Examiner les approbations de commandes

Une connexion d’opérateur avec `operator.admin`, ou une connexion
`operator.approvals` jumelée et explicitement ciblée par le Gateway, peut
examiner les demandes d’exécution en attente sur l’iPhone. La carte
d’approbation affiche l’aperçu assaini de la commande fourni par le Gateway,
l’avertissement, le contexte de l’hôte, l’expiration et uniquement les décisions
proposées par cette demande. L’Apple Watch jumelée reçoit la même invite
sécurisée pour l’examinateur via le relais iPhone existant et propose le
sous-ensemble compact des décisions autoriser une fois/refuser. Le mode Gateway
direct de la Watch ne transmet pas les invites d’approbation.

L’état de l’approbation est partagé avec la Control UI et les surfaces de chat
prises en charge. La première réponse validée prévaut. L’iPhone et la Watch
récupèrent l’enregistrement terminal canonique du Gateway après la résolution de
la demande par une autre surface, après une notification distante de résolution
et chaque fois qu’un accusé de réception de résolution peut avoir été perdu. Les
actions restent indisponibles jusqu’à ce que cette relecture confirme si la
demande est toujours en attente.

La propriété de l’approbation est liée au Gateway sélectionné. Le changement de
Gateway ne peut pas appliquer une ancienne invite à la connexion de remplacement.
Les Gateway antérieurs aux méthodes d’approbation unifiées utilisent comme
solution de secours les méthodes livrées propres à l’exécution ; la conservation
de l’état terminal et les résultats inter-surfaces plus riches nécessitent un
Gateway mis à jour.

## Node Apple Watch direct facultatif

Le mode direct attribue à la montre sa propre identité de Node signée et sa
propre connexion au Gateway. Les commandes de Node prises en charge continuent
de fonctionner via le Wi-Fi ou le réseau cellulaire de la montre lorsque
OpenClaw est actif, même si l’iPhone jumelé est indisponible.

Prérequis :

- L’iPhone est connecté au Gateway avec la portée `operator.admin`.
- Le code de configuration annonce un point de terminaison Gateway `wss://` avec un certificat approuvé
  par watchOS ; la montre interroge l’origine `https://` correspondante. Le HTTP
  simple et les approbations reposant uniquement sur un certificat autosigné ou
  une empreinte ne sont pas pris en charge. Consultez [Jumelage géré par le
  Gateway](/fr/gateway/pairing) pour la configuration du point de terminaison. Les
  routes de bouclage, limitées à l’iPhone et limitées au tailnet ne sont pas
  accessibles indépendamment par la montre.
- L’utilisation du réseau cellulaire nécessite une Apple Watch compatible avec le réseau cellulaire et un service actif.
- OpenClaw est actif sur la montre. Apple n’autorise pas les apps watchOS ordinaires à
  maintenir des connexions WebSocket/TCP génériques ; le Node direct utilise
  donc de courtes interrogations HTTPS et se reconnecte lorsque l’app revient au
  premier plan. Consultez les [recommandations d’Apple sur les réseaux de bas niveau sous watchOS](https://developer.apple.com/documentation/technotes/tn3135-low-level-networking-on-watchOS).

Configuration :

1. Sur l’iPhone, ouvrez **Settings -> Apple Watch**.
2. Touchez **Enable Direct Gateway Connection**.
3. Ouvrez OpenClaw sur la montre avant l’expiration du code de configuration de courte durée.
4. Vérifiez la ligne Apple Watch distincte avec `openclaw nodes status`.

Le code de configuration contient un identifiant d’amorçage de courte durée,
réservé au Node ; traitez-le comme un mot de passe jusqu’à son expiration. Il ne
contient jamais le mot de passe ni le jeton Gateway enregistré sur l’iPhone.
Après le jumelage, la montre stocke son propre jeton d’appareil et supprime
l’identifiant d’amorçage. Le mode direct couvre uniquement les commandes
ci-dessous. Le chat, le mode conversation, les approbations et le flux de
notifications `watch.*` existant restent des fonctionnalités relayées par
l’iPhone et nécessitent toujours l’iPhone jumelé.

Commandes du Node watchOS direct :

| Surface       | Commandes                      | Remarques                                                         |
| ------------- | ------------------------------ | ----------------------------------------------------------------- |
| Appareil      | `device.info`, `device.status` | Identité, batterie, état thermique, stockage et réseau de la Watch. |
| Notifications | `system.notify`                | Lorsque l’app est active ; nécessite l’autorisation de la Watch.  |

watchOS n’expose pas WebKit aux apps tierces ; le Node Watch direct n’annonce
donc pas de commandes Canvas.

## Notifications push relayées pour les builds officiels

Les builds iOS officiels distribués utilisent un relais de notifications push externe au lieu de publier le jeton APNs brut auprès du Gateway. Les builds officiels de l’App Store issus du canal de publication public utilisent le relais hébergé à `https://ios-push-relay.openclaw.ai` ; cette URL de base est codée en dur pour la distribution sur l’App Store et ne lit aucun remplacement.

Les déploiements de relais personnalisés nécessitent un chemin de build/déploiement iOS délibérément distinct, dont l’URL de relais correspond à celle du Gateway. Le canal de publication de l’App Store n’accepte jamais d’URL de relais personnalisée. Si vous utilisez un build avec relais personnalisé, définissez l’URL de relais correspondante du Gateway :

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
- L’app iOS récupère l’identité du Gateway jumelé (`gateway.identity.get`) et l’inclut dans l’enregistrement auprès du relais, de sorte que cet enregistrement soit délégué à ce Gateway précis.
- L’app transmet cet enregistrement adossé au relais au Gateway jumelé avec `push.apns.register`.
- Le Gateway utilise cet identifiant de relais enregistré pour `push.test`, les réveils en arrière-plan et les sollicitations de réveil.
- Si l’app se connecte ensuite à un Gateway différent ou à un build utilisant une autre URL de base de relais, elle actualise l’enregistrement auprès du relais au lieu de réutiliser l’ancienne association.

Ce dont le Gateway n’a **pas** besoin pour ce chemin : aucun jeton de relais valable pour l’ensemble du déploiement ni aucune clé APNs directe pour les envois officiels de l’App Store adossés au relais.

Flux attendu pour l’opérateur :

1. Installez l’app iOS officielle.
2. Facultatif : définissez `gateway.push.apns.relay.baseUrl` sur le Gateway uniquement si vous utilisez un build avec relais personnalisé délibérément distinct.
3. Jumelez l’app au Gateway et laissez-la terminer la connexion.
4. L’app publie `push.apns.register` lorsqu’elle dispose d’un jeton APNs, que la session de l’opérateur est connectée et que l’enregistrement auprès du relais a réussi.
5. Ensuite, `push.test`, les réveils de reconnexion et les sollicitations de réveil peuvent utiliser l’enregistrement adossé au relais qui a été stocké.

## Signaux périodiques d’activité en arrière-plan

Lorsque iOS réveille l’app pour une notification push silencieuse, une actualisation en arrière-plan ou un événement de changement significatif de localisation, l’app tente une brève reconnexion du Node, puis appelle `node.event` avec `event: "node.presence.alive"`. Le Gateway enregistre cet événement dans `lastSeenAtMs`/`lastSeenReason` au niveau des métadonnées du Node/appareil appairé, uniquement après avoir déterminé l’identité authentifiée de l’appareil Node.

L’app considère qu’un réveil en arrière-plan a été correctement enregistré uniquement lorsque la réponse du Gateway inclut `handled: true`. Les anciens Gateways peuvent accuser réception de `node.event` avec `{ "ok": true }` ; cette réponse est compatible, mais ne compte pas comme une mise à jour persistante de la dernière activité.

Remarque sur la compatibilité :

- `OPENCLAW_APNS_RELAY_BASE_URL` fonctionne toujours comme remplacement temporaire par variable d’environnement pour le Gateway (`gateway.push.apns.relay.baseUrl` est le chemin de configuration prioritaire).
- Le mode push de la version App Store intègre en dur l’hôte du relais hébergé et ne lit jamais de remplacement d’URL de relais — la variable d’environnement de compilation `OPENCLAW_PUSH_RELAY_BASE_URL` affecte uniquement les modes de compilation iOS locaux/sandbox.

## Flux d’authentification et de confiance

Le relais existe pour appliquer deux contraintes que l’utilisation directe d’APNs depuis le Gateway ne peut pas garantir pour les versions iOS officielles :

- Seules les versions iOS authentiques d’OpenClaw distribuées par Apple peuvent utiliser le relais hébergé.
- Un Gateway ne peut envoyer des notifications push via le relais qu’aux appareils iOS appairés à ce Gateway précis.

Étape par étape :

1. `iOS app -> gateway` : l’app s’appaire au Gateway via le flux d’authentification normal du Gateway, ce qui lui fournit une session Node authentifiée ainsi qu’une session opérateur authentifiée. La session opérateur appelle `gateway.identity.get`.
2. `iOS app -> relay` : l’app appelle les points de terminaison d’inscription du relais via HTTPS avec une preuve App Attest ainsi qu’un JWS de transaction d’app StoreKit. Le relais valide l’identifiant du bundle, la preuve App Attest et la preuve de distribution Apple, et exige le circuit de distribution officiel/de production — c’est ce qui empêche les versions Xcode/de développement locales d’utiliser le relais hébergé, car une version locale ne peut pas fournir la preuve de distribution Apple officielle.
3. `gateway identity delegation` : avant l’inscription auprès du relais, l’app récupère l’identité du Gateway appairé via `gateway.identity.get` et l’inclut dans la charge utile d’inscription du relais. Le relais renvoie un identifiant de relais et une autorisation d’envoi limitée à l’inscription, déléguée à cette identité de Gateway.
4. `gateway -> relay` : le Gateway stocke l’identifiant du relais et l’autorisation d’envoi provenant de `push.apns.register`. Lors de `push.test`, des réveils de reconnexion et des sollicitations de réveil, le Gateway signe la demande d’envoi avec sa propre identité d’appareil ; le relais vérifie à la fois l’autorisation d’envoi stockée et la signature du Gateway par rapport à l’identité de Gateway déléguée lors de l’inscription. Un autre Gateway ne peut pas réutiliser cette inscription stockée, même s’il parvient d’une manière ou d’une autre à obtenir l’identifiant.
5. `relay -> APNs` : le relais détient les identifiants APNs de production et le jeton APNs brut de la version officielle. Le Gateway ne stocke jamais le jeton APNs brut des versions officielles utilisant le relais ; le relais envoie la notification push finale à APNs pour le compte du Gateway appairé.

Raison de cette conception : conserver les identifiants APNs de production hors des Gateways des utilisateurs, éviter de stocker les jetons APNs bruts des versions officielles sur le Gateway, réserver l’utilisation du relais hébergé aux versions iOS officielles d’OpenClaw et empêcher un Gateway d’envoyer des notifications push de réveil aux appareils iOS appartenant à un autre Gateway.

Les versions locales/manuelles continuent d’utiliser APNs directement. Si vous testez ces versions sans le relais, le Gateway a toujours besoin d’identifiants APNs directs :

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

Il s’agit de variables d’environnement d’exécution de l’hôte du Gateway, et non de paramètres Fastlane. `apps/ios/fastlane/.env` stocke uniquement les informations d’authentification App Store Connect telles que `APP_STORE_CONNECT_KEY_ID` et `APP_STORE_CONNECT_ISSUER_ID` ; il ne configure pas la distribution APNs directe pour les versions iOS locales.

Stockage recommandé sur l’hôte du Gateway, conforme à celui des autres identifiants de fournisseurs sous `~/.openclaw/credentials/` :

```bash
mkdir -p ~/.openclaw/credentials/apns
chmod 700 ~/.openclaw/credentials/apns
mv /path/to/AuthKey_KEYID.p8 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
chmod 600 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
export OPENCLAW_APNS_PRIVATE_KEY_PATH="$HOME/.openclaw/credentials/apns/AuthKey_KEYID.p8"
```

Ne validez pas le fichier `.p8` dans le dépôt et ne le placez pas dans l’arborescence de travail du dépôt.

## Méthodes de découverte

### Bonjour (LAN)

L’app iOS recherche `_openclaw-gw._tcp` sur `local.` et, lorsqu’il est configuré, sur le même domaine de découverte DNS-SD étendu. Les Gateways du même LAN apparaissent automatiquement depuis `local.` ; la découverte entre réseaux peut utiliser le domaine étendu configuré sans modifier le type de balise.

### Tailnet (interréseaux)

Si mDNS est bloqué, utilisez une zone DNS-SD unicast (choisissez un domaine ; exemple : `openclaw.internal.`) et le DNS partagé de Tailscale. Consultez [Bonjour](/fr/gateway/bonjour) pour l’exemple CoreDNS.

### Hôte/port manuel

Dans Settings, activez **Manual Host** et saisissez l’hôte et le port du Gateway (valeur par défaut : `18789`).

## Plusieurs Gateways

L’app conserve un registre de tous les Gateways avec lesquels elle s’est appairée, afin que vous puissiez passer de l’un à l’autre sans refaire l’appairage :

- **Settings -> Gateway** affiche une liste **Paired Gateways** dans laquelle le Gateway actif est indiqué. Touchez une entrée pour changer de Gateway ; l’app ferme les sessions actuelles et se reconnecte au Gateway sélectionné. Un menu de basculement rapide apparaît à côté de la ligne de connexion lorsque plusieurs Gateways sont appairés.
- Les identifiants, les décisions de confiance TLS, les préférences propres à chaque Gateway et l’historique de discussion mis en cache sont stockés séparément pour chaque Gateway. Le changement de Gateway ne mélange jamais les états, et l’inscription aux notifications push suit le Gateway actif.
- Balayez un Gateway appairé (ou utilisez son menu contextuel) pour sélectionner **Forget**, ce qui supprime ses identifiants, ses jetons d’appareil, son ancrage TLS et ses discussions mises en cache.
- Les Gateways découverts doivent être visibles sur le réseau pour pouvoir basculer vers eux ; les Gateways manuels se reconnectent à l’aide de l’hôte et du port enregistrés.

## Canvas + A2UI

Le Node iOS affiche un Canvas WKWebView. Utilisez `node.invoke` pour le piloter :

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

Remarques :

- L’hôte Canvas du Gateway sert `/__openclaw__/canvas/` et `/__openclaw__/a2ui/` depuis le serveur HTTP du Gateway (même port que `gateway.port`, `18789` par défaut).
- Le Node iOS conserve l’interface intégrée comme vue par défaut lorsqu’il est connecté. `canvas.a2ui.push` et `canvas.a2ui.reset` utilisent la page A2UI intégrée appartenant à l’app.
- Les pages A2UI distantes du Gateway sont uniquement rendues sur iOS ; les actions natives des boutons A2UI sont acceptées uniquement depuis les pages intégrées appartenant à l’app.
- Revenez à l’interface intégrée avec `canvas.navigate` et `{"url":""}`.

## Relation avec Computer Use

L’app iOS est une surface Node mobile, et non un moteur d’exécution Codex Computer Use. Codex Computer Use et `cua-driver mcp` contrôlent un bureau macOS local au moyen d’outils MCP ; l’app iOS expose les capacités de l’iPhone au moyen de commandes Node OpenClaw telles que `canvas.*`, `camera.*`, `screen.*`, `location.*` et `talk.*`.

Les agents peuvent néanmoins interagir avec l’app iOS via OpenClaw en invoquant des commandes Node, mais ces appels transitent par le protocole Node du Gateway et sont soumis aux limitations d’iOS au premier plan et en arrière-plan. Utilisez [Codex Computer Use](/fr/plugins/codex-computer-use) pour contrôler un bureau local et cette page pour les capacités du Node iOS.

### Évaluation / instantané du Canvas

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## Réveil vocal + mode conversation

- Le réveil vocal et le mode conversation sont disponibles dans Settings.
- Le mode conversation en temps réel d’OpenAI utilise WebRTC géré par le client lorsque `talk.realtime.transport` vaut `webrtc` ; une configuration explicite `gateway-relay` reste gérée par le Gateway. Consultez [Mode conversation](/fr/nodes/talk).
- Les Nodes iOS compatibles avec le mode conversation annoncent la capacité `talk` et peuvent déclarer `talk.ptt.start`, `talk.ptt.stop`, `talk.ptt.cancel` et `talk.ptt.once` ; le Gateway autorise par défaut ces commandes « appuyer pour parler » pour les Nodes de confiance compatibles avec le mode conversation.
- iOS peut suspendre l’audio en arrière-plan ; considérez les fonctions vocales comme fournies au mieux lorsque l’app n’est pas active.

## Erreurs courantes

- `NODE_BACKGROUND_UNAVAILABLE` : placez l’app iOS au premier plan (les commandes Canvas/caméra/écran l’exigent).
- `A2UI_HOST_UNAVAILABLE` : la page A2UI intégrée n’était pas accessible dans la WebView de l’app ; maintenez l’app au premier plan dans l’onglet Screen et réessayez.
- L’invite d’appairage n’apparaît jamais : exécutez `openclaw devices list` et approuvez manuellement.
- La Watch n’affiche aucun état de l’iPhone : vérifiez que l’iPhone indique `watchPaired: true`
  et `watchAppInstalled: true` dans `watch.status`. Si l’appairage est faux, appairez la
  Watch dans l’app Watch d’Apple. Si l’installation est fausse, installez l’app compagnon
  depuis **My Watch -> Available Apps**. Après l’une ou l’autre modification, ouvrez OpenClaw une fois sur la
  Watch ; l’accessibilité immédiate exige toujours que les deux apps soient en cours d’exécution,
  tandis que les mises à jour en file d’attente peuvent arriver ultérieurement en arrière-plan.
- Échec de la reconnexion après une réinstallation : le jeton d’appairage du Keychain a été supprimé ; appairez de nouveau le Node.

## Documentation associée

- [Appairage](/fr/channels/pairing)
- [Découverte](/fr/gateway/discovery)
- [Bonjour](/fr/gateway/bonjour)
