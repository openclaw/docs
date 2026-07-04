---
read_when:
    - Jumelage ou reconnexion du nœud iOS
    - Exécuter l’application iOS depuis le code source
    - Débogage de la découverte du Gateway ou des commandes de canevas
summary: 'Application de nœud iOS : connexion au Gateway, appairage, canevas et dépannage'
title: Application iOS
x-i18n:
    generated_at: "2026-07-04T17:58:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ad6d272518b36564562256f55ffc320c0c4d2b954914ac73c23e450fa7acee0b
    source_path: platforms/ios.md
    workflow: 16
---

Availability: les builds de l’application iPhone sont distribués via les canaux Apple lorsqu’ils sont activés pour une release. Les builds de développement local peuvent également s’exécuter depuis la source.

## Ce qu’elle fait

- Se connecte à un Gateway via WebSocket (LAN ou tailnet).
- Expose les capacités du nœud : Canvas, instantané d’écran, capture caméra, localisation, mode parole, réveil vocal.
- Reçoit les commandes `node.invoke` et signale les événements d’état du nœud.

## Prérequis

- Gateway exécuté sur un autre appareil (macOS, Linux ou Windows via WSL2).
- Chemin réseau :
  - Même LAN via Bonjour, **ou**
  - Tailnet via DNS-SD unicast (domaine d’exemple : `openclaw.internal.`), **ou**
  - Hôte/port manuel (solution de repli).

## Démarrage rapide (jumeler + connecter)

1. Démarrez un Gateway authentifié avec une route accessible par votre téléphone. Tailscale
   Serve est le chemin distant recommandé :

```bash
openclaw gateway --port 18789 --tailscale serve
```

Pour une configuration de confiance sur le même LAN, utilisez plutôt un `gateway.bind: "lan"`
authentifié. Le bind loopback par défaut n’est pas accessible depuis un téléphone. Si le
Gateway n’a pas encore été configuré, exécutez d’abord `openclaw onboard` afin que la
création du code de configuration dispose d’un chemin d’authentification par jeton ou mot de passe.

2. Ouvrez l’[interface de contrôle](/fr/web/control-ui), sélectionnez **Nœuds**, puis cliquez sur
   **Jumeler un appareil mobile** dans la carte **Appareils**.

3. Dans l’application iOS, ouvrez **Réglages** → **Gateway**, scannez le code QR (ou collez
   le code de configuration), puis connectez-vous.

4. L’application officielle se connecte automatiquement. Si **Appareils** affiche une demande
   en attente, examinez son rôle et ses périmètres avant de l’approuver.

Le bouton de l’interface de contrôle nécessite une session déjà jumelée avec `operator.admin`.
Comme solution de repli dans le terminal, choisissez un gateway découvert dans l’application iOS (ou activez
Hôte manuel et saisissez l’hôte/le port), puis approuvez la demande sur l’hôte Gateway :

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Si l’application retente le jumelage avec des détails d’authentification modifiés (rôle/périmètres/clé publique),
la précédente demande en attente est remplacée et un nouveau `requestId` est créé.
Exécutez à nouveau `openclaw devices list` avant l’approbation.

Facultatif : si le nœud iOS se connecte toujours depuis un sous-réseau strictement contrôlé, vous
pouvez activer l’approbation automatique des nœuds lors de la première connexion avec des CIDR explicites ou des IP exactes :

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

Cette option est désactivée par défaut. Elle s’applique uniquement aux nouveaux jumelages `role: node`
sans périmètres demandés. Le jumelage opérateur/navigateur et tout changement de rôle, périmètre, métadonnées ou
clé publique nécessitent toujours une approbation manuelle.

5. Vérifiez la connexion :

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## Push adossé au relais pour les builds officiels

Les builds iOS officiels distribués utilisent le relais push externe au lieu de publier le jeton APNs brut
auprès du gateway.

Les builds App Store officiels issus du canal de release public utilisent le relais hébergé à `https://ios-push-relay.openclaw.ai`.

Les déploiements de relais personnalisés nécessitent un chemin de build/déploiement iOS volontairement séparé dont l’URL de relais correspond à l’URL de relais du gateway. Le canal de release App Store public n’accepte pas les remplacements d’URL de relais personnalisée. Si vous utilisez un build à relais personnalisé, définissez l’URL de relais gateway correspondante :

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

- L’application iOS s’enregistre auprès du relais avec App Attest et une transaction d’application StoreKit au format JWS.
- Le relais renvoie un handle de relais opaque ainsi qu’une autorisation d’envoi limitée à l’enregistrement.
- L’application iOS récupère l’identité du gateway jumelé et l’inclut dans l’enregistrement du relais, de sorte que l’enregistrement adossé au relais soit délégué à ce gateway précis.
- L’application transmet cet enregistrement adossé au relais au gateway jumelé avec `push.apns.register`.
- Le gateway utilise ce handle de relais stocké pour `push.test`, les réveils en arrière-plan et les sollicitations de réveil.
- Les URL de relais gateway personnalisées doivent correspondre à l’URL de relais intégrée dans le build iOS.
- Si l’application se connecte ensuite à un autre gateway ou à un build avec une URL de base de relais différente, elle actualise l’enregistrement du relais au lieu de réutiliser l’ancienne liaison.

Ce dont le gateway n’a **pas** besoin pour ce chemin :

- Aucun jeton de relais à l’échelle du déploiement.
- Aucune clé APNs directe pour les envois officiels App Store adossés au relais.

Flux opérateur attendu :

1. Installez l’application iOS officielle.
2. Facultatif : définissez `gateway.push.apns.relay.baseUrl` sur le gateway uniquement lorsque vous utilisez un build à relais personnalisé volontairement séparé.
3. Jumelez l’application au gateway et laissez-la terminer la connexion.
4. L’application publie automatiquement `push.apns.register` une fois qu’elle dispose d’un jeton APNs, que la session opérateur est connectée et que l’enregistrement du relais réussit.
5. Ensuite, `push.test`, les réveils de reconnexion et les sollicitations de réveil peuvent utiliser l’enregistrement stocké adossé au relais.

## Beacons de présence en arrière-plan

Quand iOS réveille l’application pour un push silencieux, une actualisation en arrière-plan ou un événement de changement significatif de localisation, l’application
tente une brève reconnexion du nœud, puis appelle `node.event` avec `event: "node.presence.alive"`.
Le gateway enregistre cela comme `lastSeenAtMs`/`lastSeenReason` dans les métadonnées du nœud/de l’appareil jumelé uniquement
après que l’identité authentifiée de l’appareil nœud est connue.

L’application considère qu’un réveil en arrière-plan a été enregistré avec succès uniquement lorsque la réponse du gateway inclut
`handled: true`. Les gateways plus anciens peuvent accuser réception de `node.event` avec `{ "ok": true }` ; cette réponse est
compatible, mais ne compte pas comme une mise à jour durable de la dernière présence.

Note de compatibilité :

- `OPENCLAW_APNS_RELAY_BASE_URL` fonctionne toujours comme remplacement temporaire par variable d’environnement pour le gateway.
- Le canal de release App Store public rejette `OPENCLAW_PUSH_RELAY_BASE_URL` pour les builds iOS.

## Flux d’authentification et de confiance

Le relais existe pour appliquer deux contraintes que l’APNs direct sur gateway ne peut pas fournir pour
les builds iOS officiels :

- Seuls les builds iOS OpenClaw authentiques distribués via Apple peuvent utiliser le relais hébergé.
- Un gateway ne peut envoyer des pushs adossés au relais que pour les appareils iOS jumelés avec ce
  gateway précis.

Étape par étape :

1. `iOS app -> gateway`
   - L’application se jumelle d’abord avec le gateway via le flux d’authentification Gateway normal.
   - Cela donne à l’application une session de nœud authentifiée ainsi qu’une session opérateur authentifiée.
   - La session opérateur sert à appeler `gateway.identity.get`.

2. `iOS app -> relay`
   - L’application appelle les endpoints d’enregistrement du relais via HTTPS.
   - L’enregistrement inclut une preuve App Attest ainsi qu’une transaction d’application StoreKit au format JWS.
   - Le relais valide l’ID de bundle, la preuve App Attest et la preuve de distribution Apple, et exige le
     chemin de distribution officiel/production.
   - C’est ce qui empêche les builds Xcode/dev locaux d’utiliser le relais hébergé. Un build local peut être
     signé, mais il ne satisfait pas la preuve de distribution Apple officielle attendue par le relais.

3. `gateway identity delegation`
   - Avant l’enregistrement du relais, l’application récupère l’identité du gateway jumelé depuis
     `gateway.identity.get`.
   - L’application inclut cette identité gateway dans la charge utile d’enregistrement du relais.
   - Le relais renvoie un handle de relais et une autorisation d’envoi limitée à l’enregistrement, délégués à
     cette identité gateway.

4. `gateway -> relay`
   - Le gateway stocke le handle de relais et l’autorisation d’envoi issus de `push.apns.register`.
   - Lors de `push.test`, des réveils de reconnexion et des sollicitations de réveil, le gateway signe la demande d’envoi avec sa
     propre identité d’appareil.
   - Le relais vérifie à la fois l’autorisation d’envoi stockée et la signature du gateway par rapport à l’identité
     gateway déléguée lors de l’enregistrement.
   - Un autre gateway ne peut pas réutiliser cet enregistrement stocké, même s’il obtient le handle d’une façon ou d’une autre.

5. `relay -> APNs`
   - Le relais possède les identifiants APNs de production et le jeton APNs brut du build officiel.
   - Le gateway ne stocke jamais le jeton APNs brut pour les builds officiels adossés au relais.
   - Le relais envoie le push final à APNs pour le compte du gateway jumelé.

Pourquoi cette conception a été créée :

- Pour garder les identifiants APNs de production hors des gateways utilisateur.
- Pour éviter de stocker les jetons APNs bruts des builds officiels sur le gateway.
- Pour autoriser l’utilisation du relais hébergé uniquement pour les builds iOS OpenClaw officiels.
- Pour empêcher un gateway d’envoyer des pushs de réveil à des appareils iOS appartenant à un autre gateway.

Les builds locaux/manuels restent sur APNs direct. Si vous testez ces builds sans le relais, le
gateway a toujours besoin d’identifiants APNs directs :

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

Ce sont des variables d’environnement d’exécution de l’hôte gateway, pas des réglages Fastlane. `apps/ios/fastlane/.env` stocke uniquement
l’authentification App Store Connect comme `APP_STORE_CONNECT_KEY_ID` et
`APP_STORE_CONNECT_ISSUER_ID` ; il ne configure pas la livraison APNs directe pour les builds iOS locaux.

Stockage recommandé sur l’hôte gateway :

```bash
mkdir -p ~/.openclaw/credentials/apns
chmod 700 ~/.openclaw/credentials/apns
mv /path/to/AuthKey_KEYID.p8 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
chmod 600 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
export OPENCLAW_APNS_PRIVATE_KEY_PATH="$HOME/.openclaw/credentials/apns/AuthKey_KEYID.p8"
```

Ne commitez pas le fichier `.p8` et ne le placez pas dans le checkout du dépôt.

## Chemins de découverte

### Bonjour (LAN)

L’application iOS parcourt `_openclaw-gw._tcp` sur `local.` et, lorsqu’il est configuré, le même
domaine de découverte DNS-SD étendu. Les gateways sur le même LAN apparaissent automatiquement depuis `local.` ;
la découverte entre réseaux peut utiliser le domaine étendu configuré sans changer le type de beacon.

### Tailnet (inter-réseaux)

Si mDNS est bloqué, utilisez une zone DNS-SD unicast (choisissez un domaine ; exemple :
`openclaw.internal.`) et le DNS fractionné Tailscale.
Consultez [Bonjour](/fr/gateway/bonjour) pour l’exemple CoreDNS.

### Hôte/port manuel

Dans Réglages, activez **Hôte manuel** et saisissez l’hôte + le port du gateway (par défaut `18789`).

## Canvas + A2UI

Le nœud iOS rend un canvas WKWebView. Utilisez `node.invoke` pour le piloter :

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

Notes :

- L’hôte canvas du Gateway sert `/__openclaw__/canvas/` et `/__openclaw__/a2ui/`.
- Il est servi depuis le serveur HTTP du Gateway (même port que `gateway.port`, par défaut `18789`).
- Le nœud iOS conserve le scaffold intégré comme vue connectée par défaut. `canvas.a2ui.push` et `canvas.a2ui.reset` utilisent la page A2UI intégrée appartenant à l’application.
- Les pages A2UI distantes du Gateway sont en rendu seul sur iOS ; les actions de boutons A2UI natives sont acceptées uniquement depuis les pages intégrées appartenant à l’application.
- Revenez au scaffold intégré avec `canvas.navigate` et `{"url":""}`.

## Relation avec Computer Use

L’application iOS est une surface de nœud mobile, pas un backend Codex Computer Use. Codex
Computer Use et `cua-driver mcp` contrôlent un bureau macOS local via des outils
MCP ; l’application iOS expose les capacités iPhone via les commandes de nœud OpenClaw
comme `canvas.*`, `camera.*`, `screen.*`, `location.*` et `talk.*`.

Les agents peuvent toujours piloter l’application iOS via OpenClaw en invoquant des
commandes de nœud, mais ces appels passent par le protocole de nœud gateway et respectent les limites
d’avant-plan/arrière-plan d’iOS. Utilisez [Codex Computer Use](/fr/plugins/codex-computer-use)
pour le contrôle du bureau local, et cette page pour les capacités de nœud iOS.

### Évaluation / instantané Canvas

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## Réveil vocal + mode parole

- Le mode de réveil vocal et le mode conversation sont disponibles dans les paramètres.
- Le mode conversation en temps réel d’OpenAI utilise WebRTC côté client lorsque `talk.realtime.transport` vaut `webrtc`; une configuration explicite `gateway-relay` reste gérée par le Gateway. Consultez [Mode conversation](/fr/nodes/talk).
- Les nœuds iOS compatibles avec le mode conversation annoncent la capacité `talk` et peuvent déclarer
  `talk.ptt.start`, `talk.ptt.stop`, `talk.ptt.cancel` et `talk.ptt.once`;
  le Gateway autorise par défaut ces commandes push-to-talk pour les nœuds
  compatibles avec le mode conversation et approuvés.
- iOS peut suspendre l’audio en arrière-plan; considérez les fonctionnalités vocales comme fournies au mieux lorsque l’application n’est pas active.

## Erreurs courantes

- `NODE_BACKGROUND_UNAVAILABLE` : ramenez l’application iOS au premier plan (les commandes de canevas, caméra et écran l’exigent).
- `A2UI_HOST_UNAVAILABLE` : la page A2UI intégrée n’était pas accessible dans la WebView de l’application; gardez l’application au premier plan sur l’onglet Screen, puis réessayez.
- L’invite d’appairage n’apparaît jamais : exécutez `openclaw devices list` et approuvez manuellement.
- La reconnexion échoue après une réinstallation : le jeton d’appairage du trousseau a été effacé; réappairez le nœud.

## Documentation associée

- [Appairage](/fr/channels/pairing)
- [Découverte](/fr/gateway/discovery)
- [Bonjour](/fr/gateway/bonjour)
