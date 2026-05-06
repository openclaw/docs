---
read_when:
    - Appairage ou reconnexion du nœud iOS
    - Exécuter l’application iOS à partir du code source
    - Débogage de la découverte du Gateway ou des commandes de canevas
summary: 'Application de nœud iOS : connexion au Gateway, jumelage, canevas et dépannage'
title: Application iOS
x-i18n:
    generated_at: "2026-05-06T07:31:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: aaa8c11d9fda32c743d2ff0d1c6fd5574bcd396aef43aa2e4e9b0cc7b55e5d21
    source_path: platforms/ios.md
    workflow: 16
---

Disponibilité : aperçu interne. L’application iOS n’est pas encore distribuée publiquement.

## Ce qu’elle fait

- Se connecte à un Gateway via WebSocket (LAN ou tailnet).
- Expose les capacités du nœud : Canvas, instantané d’écran, capture caméra, localisation, mode conversation, réveil vocal.
- Reçoit des commandes `node.invoke` et signale les événements d’état du nœud.

## Prérequis

- Gateway exécuté sur un autre appareil (macOS, Linux ou Windows via WSL2).
- Chemin réseau :
  - Même LAN via Bonjour, **ou**
  - Tailnet via DNS-SD unicast (domaine d’exemple : `openclaw.internal.`), **ou**
  - Hôte/port manuel (solution de repli).

## Démarrage rapide (appairer + connecter)

1. Démarrez le Gateway :

```bash
openclaw gateway --port 18789
```

2. Dans l’application iOS, ouvrez Réglages et choisissez une passerelle découverte (ou activez Hôte manuel et saisissez l’hôte/le port).

3. Approuvez la demande d’appairage sur l’hôte de la passerelle :

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Si l’application réessaie l’appairage avec des détails d’authentification modifiés (rôle/portées/clé publique),
la demande en attente précédente est remplacée et un nouveau `requestId` est créé.
Exécutez de nouveau `openclaw devices list` avant l’approbation.

Facultatif : si le nœud iOS se connecte toujours depuis un sous-réseau strictement contrôlé, vous
pouvez activer l’approbation automatique du nœud lors de la première connexion avec des CIDR explicites ou des IP exactes :

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

Cette option est désactivée par défaut. Elle s’applique uniquement à un nouvel appairage `role: node`
sans portées demandées. L’appairage opérateur/navigateur et tout changement de rôle, portée, métadonnées ou
clé publique nécessitent toujours une approbation manuelle.

4. Vérifiez la connexion :

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## Push adossé au relais pour les builds officiels

Les builds iOS distribués officiellement utilisent le relais push externe au lieu de publier le jeton APNs
brut vers le Gateway.

Prérequis côté Gateway :

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

- L’application iOS s’enregistre auprès du relais avec App Attest et un JWS de transaction d’application StoreKit.
- Le relais renvoie un handle de relais opaque ainsi qu’une autorisation d’envoi limitée à l’enregistrement.
- L’application iOS récupère l’identité du Gateway appairé et l’inclut dans l’enregistrement du relais, afin que l’enregistrement adossé au relais soit délégué à ce Gateway précis.
- L’application transmet cet enregistrement adossé au relais au Gateway appairé avec `push.apns.register`.
- Le Gateway utilise ce handle de relais stocké pour `push.test`, les réveils en arrière-plan et les impulsions de réveil.
- L’URL de base du relais du Gateway doit correspondre à l’URL du relais intégrée au build iOS officiel/TestFlight.
- Si l’application se connecte ultérieurement à un autre Gateway ou à un build avec une URL de base de relais différente, elle actualise l’enregistrement du relais au lieu de réutiliser l’ancienne liaison.

Ce dont le Gateway n’a **pas** besoin pour ce chemin :

- Aucun jeton de relais à l’échelle du déploiement.
- Aucune clé APNs directe pour les envois officiels/TestFlight adossés au relais.

Flux opérateur attendu :

1. Installez le build iOS officiel/TestFlight.
2. Définissez `gateway.push.apns.relay.baseUrl` sur le Gateway.
3. Appairez l’application au Gateway et laissez-la terminer la connexion.
4. L’application publie automatiquement `push.apns.register` après avoir obtenu un jeton APNs, lorsque la session opérateur est connectée et que l’enregistrement auprès du relais réussit.
5. Ensuite, `push.test`, les réveils de reconnexion et les impulsions de réveil peuvent utiliser l’enregistrement stocké adossé au relais.

## Signaux de présence en arrière-plan

Quand iOS réveille l’application pour un push silencieux, une actualisation en arrière-plan ou un événement de changement significatif de position, l’application
tente une courte reconnexion de nœud puis appelle `node.event` avec `event: "node.presence.alive"`.
Le Gateway enregistre cela comme `lastSeenAtMs`/`lastSeenReason` dans les métadonnées du nœud/de l’appareil appairé uniquement
après que l’identité authentifiée de l’appareil nœud est connue.

L’application considère qu’un réveil en arrière-plan a été enregistré avec succès uniquement lorsque la réponse du Gateway inclut
`handled: true`. Les anciens Gateway peuvent accuser réception de `node.event` avec `{ "ok": true }` ; cette réponse est
compatible mais ne compte pas comme une mise à jour durable de la dernière présence.

Note de compatibilité :

- `OPENCLAW_APNS_RELAY_BASE_URL` fonctionne toujours comme remplacement temporaire par variable d’environnement pour le Gateway.

## Flux d’authentification et de confiance

Le relais existe pour appliquer deux contraintes que l’APNs direct sur le Gateway ne peut pas fournir pour
les builds iOS officiels :

- Seuls les builds iOS OpenClaw authentiques distribués via Apple peuvent utiliser le relais hébergé.
- Un Gateway ne peut envoyer des push adossés au relais que pour les appareils iOS qui ont été appairés avec ce Gateway précis.

Saut par saut :

1. `iOS app -> gateway`
   - L’application s’appaire d’abord avec le Gateway via le flux d’authentification Gateway normal.
   - Cela donne à l’application une session de nœud authentifiée ainsi qu’une session opérateur authentifiée.
   - La session opérateur est utilisée pour appeler `gateway.identity.get`.

2. `iOS app -> relay`
   - L’application appelle les points de terminaison d’enregistrement du relais via HTTPS.
   - L’enregistrement inclut une preuve App Attest ainsi qu’un JWS de transaction d’application StoreKit.
   - Le relais valide l’ID de bundle, la preuve App Attest et la preuve de distribution Apple, et exige le
     chemin de distribution officiel/production.
   - C’est ce qui empêche les builds Xcode/dev locaux d’utiliser le relais hébergé. Un build local peut être
     signé, mais il ne satisfait pas la preuve de distribution Apple officielle attendue par le relais.

3. `gateway identity delegation`
   - Avant l’enregistrement du relais, l’application récupère l’identité du Gateway appairé depuis
     `gateway.identity.get`.
   - L’application inclut cette identité de Gateway dans la charge utile d’enregistrement du relais.
   - Le relais renvoie un handle de relais et une autorisation d’envoi limitée à l’enregistrement, délégués à
     cette identité de Gateway.

4. `gateway -> relay`
   - Le Gateway stocke le handle de relais et l’autorisation d’envoi issus de `push.apns.register`.
   - Lors de `push.test`, des réveils de reconnexion et des impulsions de réveil, le Gateway signe la demande d’envoi avec sa
     propre identité d’appareil.
   - Le relais vérifie à la fois l’autorisation d’envoi stockée et la signature du Gateway par rapport à l’identité de
     Gateway déléguée lors de l’enregistrement.
   - Un autre Gateway ne peut pas réutiliser cet enregistrement stocké, même s’il obtient le handle d’une manière quelconque.

5. `relay -> APNs`
   - Le relais possède les identifiants APNs de production et le jeton APNs brut pour le build officiel.
   - Le Gateway ne stocke jamais le jeton APNs brut pour les builds officiels adossés au relais.
   - Le relais envoie le push final à APNs au nom du Gateway appairé.

Pourquoi cette conception a été créée :

- Pour garder les identifiants APNs de production hors des Gateway utilisateur.
- Pour éviter de stocker les jetons APNs bruts des builds officiels sur le Gateway.
- Pour permettre l’utilisation du relais hébergé uniquement par les builds OpenClaw officiels/TestFlight.
- Pour empêcher un Gateway d’envoyer des push de réveil à des appareils iOS détenus par un autre Gateway.

Les builds locaux/manuels restent sur APNs direct. Si vous testez ces builds sans le relais, le
Gateway a toujours besoin d’identifiants APNs directs :

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

Ce sont des variables d’environnement d’exécution de l’hôte du Gateway, pas des paramètres Fastlane. `apps/ios/fastlane/.env` stocke uniquement
l’authentification App Store Connect / TestFlight comme `ASC_KEY_ID` et `ASC_ISSUER_ID` ; il ne configure pas
la livraison APNs directe pour les builds iOS locaux.

Stockage recommandé sur l’hôte du Gateway :

```bash
mkdir -p ~/.openclaw/credentials/apns
chmod 700 ~/.openclaw/credentials/apns
mv /path/to/AuthKey_KEYID.p8 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
chmod 600 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
export OPENCLAW_APNS_PRIVATE_KEY_PATH="$HOME/.openclaw/credentials/apns/AuthKey_KEYID.p8"
```

Ne validez pas le fichier `.p8` dans le dépôt et ne le placez pas sous l’extraction du dépôt.

## Chemins de découverte

### Bonjour (LAN)

L’application iOS parcourt `_openclaw-gw._tcp` sur `local.` et, lorsqu’il est configuré, le même
domaine de découverte DNS-SD étendu. Les Gateway sur le même LAN apparaissent automatiquement depuis `local.` ;
la découverte inter-réseaux peut utiliser le domaine étendu configuré sans modifier le type de balise.

### Tailnet (inter-réseaux)

Si mDNS est bloqué, utilisez une zone DNS-SD unicast (choisissez un domaine ; exemple :
`openclaw.internal.`) et le DNS fractionné Tailscale.
Consultez [Bonjour](/fr/gateway/bonjour) pour l’exemple CoreDNS.

### Hôte/port manuel

Dans Réglages, activez **Hôte manuel** et saisissez l’hôte + le port du Gateway (par défaut `18789`).

## Canvas + A2UI

Le nœud iOS rend un canevas WKWebView. Utilisez `node.invoke` pour le piloter :

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

Notes :

- L’hôte de canevas du Gateway sert `/__openclaw__/canvas/` et `/__openclaw__/a2ui/`.
- Il est servi depuis le serveur HTTP du Gateway (même port que `gateway.port`, par défaut `18789`).
- Le nœud iOS navigue automatiquement vers A2UI à la connexion lorsqu’une URL d’hôte de canevas est annoncée.
- Revenez à l’échafaudage intégré avec `canvas.navigate` et `{"url":""}`.

## Relation avec Computer Use

L’application iOS est une surface de nœud mobile, pas un backend Codex Computer Use. Codex
Computer Use et `cua-driver mcp` contrôlent un bureau macOS local via des outils MCP ;
l’application iOS expose les capacités de l’iPhone via des commandes de nœud OpenClaw
telles que `canvas.*`, `camera.*`, `screen.*`, `location.*` et `talk.*`.

Les agents peuvent toujours piloter l’application iOS via OpenClaw en invoquant des
commandes de nœud, mais ces appels passent par le protocole de nœud du Gateway et respectent les limites
de premier plan/arrière-plan d’iOS. Utilisez [Codex Computer Use](/fr/plugins/codex-computer-use)
pour contrôler un bureau local, et cette page pour les capacités de nœud iOS.

### Évaluation / instantané Canvas

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## Réveil vocal + mode conversation

- Le réveil vocal et le mode conversation sont disponibles dans Réglages.
- Les nœuds iOS capables de conversation annoncent la capacité `talk` et peuvent déclarer
  `talk.ptt.start`, `talk.ptt.stop`, `talk.ptt.cancel` et `talk.ptt.once` ;
  le Gateway autorise par défaut ces commandes push-to-talk pour les nœuds de conversation
  de confiance.
- iOS peut suspendre l’audio en arrière-plan ; considérez les fonctionnalités vocales comme non garanties lorsque l’application n’est pas active.

## Erreurs courantes

- `NODE_BACKGROUND_UNAVAILABLE` : mettez l’application iOS au premier plan (les commandes canevas/caméra/écran l’exigent).
- `A2UI_HOST_NOT_CONFIGURED` : le Gateway n’a pas annoncé d’URL d’hôte de canevas ; vérifiez `canvasHost` dans la [configuration du Gateway](/fr/gateway/configuration).
- L’invite d’appairage n’apparaît jamais : exécutez `openclaw devices list` et approuvez manuellement.
- La reconnexion échoue après réinstallation : le jeton d’appairage du trousseau a été effacé ; réappairez le nœud.

## Documentation associée

- [Appairage](/fr/channels/pairing)
- [Découverte](/fr/gateway/discovery)
- [Bonjour](/fr/gateway/bonjour)
