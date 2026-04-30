---
read_when:
    - Jumelage ou reconnexion du nœud iOS
    - Exécuter l’application iOS depuis les sources
    - Débogage de la découverte du Gateway ou des commandes canvas
summary: 'Application de nœud iOS : connexion au Gateway, jumelage, canevas et dépannage'
title: application iOS
x-i18n:
    generated_at: "2026-04-30T07:36:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6fdbe578f15d2641d1bcb147fee7626486210cceae0cc355a92b3b2dd6291c35
    source_path: platforms/ios.md
    workflow: 16
---

Disponibilité : aperçu interne. L’app iOS n’est pas encore distribuée publiquement.

## Ce qu’elle fait

- Se connecte à un Gateway via WebSocket (LAN ou tailnet).
- Expose les capacités du nœud : Canvas, instantané d’écran, capture caméra, position, mode conversation, réveil vocal.
- Reçoit les commandes `node.invoke` et signale les événements d’état du nœud.

## Prérequis

- Gateway exécuté sur un autre appareil (macOS, Linux ou Windows via WSL2).
- Chemin réseau :
  - Même LAN via Bonjour, **ou**
  - Tailnet via DNS-SD unicast (domaine d’exemple : `openclaw.internal.`), **ou**
  - Hôte/port manuel (solution de secours).

## Démarrage rapide (associer + connecter)

1. Démarrez le Gateway :

```bash
openclaw gateway --port 18789
```

2. Dans l’app iOS, ouvrez Réglages et choisissez une passerelle détectée (ou activez Hôte manuel et saisissez l’hôte/le port).

3. Approuvez la demande d’association sur l’hôte de la passerelle :

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Si l’app retente l’association avec des détails d’authentification modifiés (rôle/portées/clé publique),
la demande précédente en attente est remplacée et un nouveau `requestId` est créé.
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

Cette option est désactivée par défaut. Elle s’applique uniquement aux nouvelles associations `role: node`
sans portées demandées. Les associations opérateur/navigateur et tout changement de rôle, portée, métadonnées ou
clé publique nécessitent toujours une approbation manuelle.

4. Vérifiez la connexion :

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## Push adossé au relais pour les versions officielles

Les builds iOS officiellement distribués utilisent le relais push externe au lieu de publier le jeton APNs
brut au Gateway.

Exigence côté Gateway :

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

- L’app iOS s’enregistre auprès du relais avec App Attest et un JWS de transaction d’app StoreKit.
- Le relais renvoie un identifiant de relais opaque ainsi qu’une autorisation d’envoi limitée à l’enregistrement.
- L’app iOS récupère l’identité du Gateway associé et l’inclut dans l’enregistrement auprès du relais, afin que l’enregistrement adossé au relais soit délégué à ce Gateway précis.
- L’app transmet cet enregistrement adossé au relais au Gateway associé avec `push.apns.register`.
- Le Gateway utilise cet identifiant de relais stocké pour `push.test`, les réveils en arrière-plan et les sollicitations de réveil.
- L’URL de base du relais du Gateway doit correspondre à l’URL de relais intégrée au build iOS officiel/TestFlight.
- Si l’app se connecte ensuite à un autre Gateway ou à un build avec une URL de base de relais différente, elle actualise l’enregistrement auprès du relais au lieu de réutiliser l’ancienne liaison.

Ce dont le Gateway n’a **pas** besoin pour ce chemin :

- Aucun jeton de relais à l’échelle du déploiement.
- Aucune clé APNs directe pour les envois officiels/TestFlight adossés au relais.

Flux opérateur attendu :

1. Installez le build iOS officiel/TestFlight.
2. Définissez `gateway.push.apns.relay.baseUrl` sur le Gateway.
3. Associez l’app au Gateway et laissez-la finir de se connecter.
4. L’app publie automatiquement `push.apns.register` une fois qu’elle dispose d’un jeton APNs, que la session opérateur est connectée et que l’enregistrement auprès du relais réussit.
5. Ensuite, `push.test`, les réveils de reconnexion et les sollicitations de réveil peuvent utiliser l’enregistrement adossé au relais stocké.

## Signaux de présence en arrière-plan

Quand iOS réveille l’app pour un push silencieux, une actualisation en arrière-plan ou un événement de localisation significatif, l’app
tente une courte reconnexion du nœud puis appelle `node.event` avec `event: "node.presence.alive"`.
Le Gateway enregistre cela comme `lastSeenAtMs`/`lastSeenReason` dans les métadonnées du nœud/de l’appareil associé seulement
après que l’identité authentifiée de l’appareil nœud est connue.

L’app considère qu’un réveil en arrière-plan a été enregistré avec succès seulement lorsque la réponse du Gateway inclut
`handled: true`. Les anciens Gateway peuvent accuser réception de `node.event` avec `{ "ok": true }` ; cette réponse est
compatible, mais ne compte pas comme une mise à jour durable du dernier état vu.

Note de compatibilité :

- `OPENCLAW_APNS_RELAY_BASE_URL` fonctionne toujours comme surcharge temporaire d’environnement pour le Gateway.

## Authentification et flux de confiance

Le relais existe pour imposer deux contraintes que l’APNs direct sur Gateway ne peut pas fournir pour
les builds iOS officiels :

- Seuls les builds iOS OpenClaw authentiques distribués via Apple peuvent utiliser le relais hébergé.
- Un Gateway ne peut envoyer des push adossés au relais que pour les appareils iOS associés à ce Gateway précis.

Étape par étape :

1. `iOS app -> gateway`
   - L’app s’associe d’abord au Gateway via le flux d’authentification Gateway normal.
   - Cela donne à l’app une session de nœud authentifiée ainsi qu’une session opérateur authentifiée.
   - La session opérateur sert à appeler `gateway.identity.get`.

2. `iOS app -> relay`
   - L’app appelle les points de terminaison d’enregistrement du relais via HTTPS.
   - L’enregistrement inclut une preuve App Attest ainsi qu’un JWS de transaction d’app StoreKit.
   - Le relais valide l’identifiant de bundle, la preuve App Attest et la preuve de distribution Apple, et exige le
     chemin de distribution officiel/production.
   - C’est ce qui empêche les builds Xcode/dev locaux d’utiliser le relais hébergé. Un build local peut être
     signé, mais il ne satisfait pas à la preuve de distribution Apple officielle attendue par le relais.

3. `gateway identity delegation`
   - Avant l’enregistrement auprès du relais, l’app récupère l’identité du Gateway associé depuis
     `gateway.identity.get`.
   - L’app inclut cette identité de Gateway dans la charge utile d’enregistrement auprès du relais.
   - Le relais renvoie un identifiant de relais et une autorisation d’envoi limitée à l’enregistrement, délégués à
     cette identité de Gateway.

4. `gateway -> relay`
   - Le Gateway stocke l’identifiant de relais et l’autorisation d’envoi provenant de `push.apns.register`.
   - Lors de `push.test`, des réveils de reconnexion et des sollicitations de réveil, le Gateway signe la demande d’envoi avec sa
     propre identité d’appareil.
   - Le relais vérifie à la fois l’autorisation d’envoi stockée et la signature du Gateway par rapport à l’identité de
     Gateway déléguée lors de l’enregistrement.
   - Un autre Gateway ne peut pas réutiliser cet enregistrement stocké, même s’il obtient l’identifiant d’une manière ou d’une autre.

5. `relay -> APNs`
   - Le relais possède les identifiants APNs de production et le jeton APNs brut du build officiel.
   - Le Gateway ne stocke jamais le jeton APNs brut pour les builds officiels adossés au relais.
   - Le relais envoie le push final à APNs au nom du Gateway associé.

Pourquoi cette conception a été créée :

- Pour garder les identifiants APNs de production hors des Gateways utilisateur.
- Pour éviter de stocker les jetons APNs bruts des builds officiels sur le Gateway.
- Pour autoriser l’utilisation du relais hébergé uniquement pour les builds OpenClaw officiels/TestFlight.
- Pour empêcher un Gateway d’envoyer des push de réveil à des appareils iOS appartenant à un autre Gateway.

Les builds locaux/manuels restent sur l’APNs direct. Si vous testez ces builds sans le relais, le
Gateway a toujours besoin d’identifiants APNs directs :

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

Ce sont des variables d’environnement d’exécution de l’hôte Gateway, pas des paramètres Fastlane. `apps/ios/fastlane/.env` stocke seulement
l’authentification App Store Connect / TestFlight comme `ASC_KEY_ID` et `ASC_ISSUER_ID` ; il ne configure pas
la livraison APNs directe pour les builds iOS locaux.

Stockage recommandé sur l’hôte Gateway :

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

L’app iOS parcourt `_openclaw-gw._tcp` sur `local.` et, lorsqu’il est configuré, le même
domaine de découverte DNS-SD étendu. Les Gateways du même LAN apparaissent automatiquement depuis `local.` ;
la découverte inter-réseaux peut utiliser le domaine étendu configuré sans changer le type de balise.

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

L’app iOS est une surface de nœud mobile, pas un backend Codex Computer Use. Codex
Computer Use et `cua-driver mcp` contrôlent un bureau macOS local via des outils MCP ;
l’app iOS expose les capacités iPhone via des commandes de nœud OpenClaw
comme `canvas.*`, `camera.*`, `screen.*`, `location.*` et `talk.*`.

Les agents peuvent toujours utiliser l’app iOS via OpenClaw en invoquant des commandes de
nœud, mais ces appels passent par le protocole de nœud du Gateway et respectent les limites
premier plan/arrière-plan d’iOS. Utilisez [Codex Computer Use](/fr/plugins/codex-computer-use)
pour le contrôle du bureau local et cette page pour les capacités de nœud iOS.

### Évaluation / instantané du Canvas

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## Réveil vocal + mode conversation

- Le réveil vocal et le mode conversation sont disponibles dans Réglages.
- iOS peut suspendre l’audio en arrière-plan ; considérez les fonctionnalités vocales comme fonctionnant au mieux lorsque l’app n’est pas active.

## Erreurs courantes

- `NODE_BACKGROUND_UNAVAILABLE` : placez l’app iOS au premier plan (les commandes de canevas/caméra/écran l’exigent).
- `A2UI_HOST_NOT_CONFIGURED` : le Gateway n’a pas annoncé d’URL d’hôte de canevas ; vérifiez `canvasHost` dans la [configuration du Gateway](/fr/gateway/configuration).
- L’invite d’association n’apparaît jamais : exécutez `openclaw devices list` et approuvez manuellement.
- La reconnexion échoue après réinstallation : le jeton d’association du trousseau a été effacé ; réassociez le nœud.

## Documentation associée

- [Association](/fr/channels/pairing)
- [Découverte](/fr/gateway/discovery)
- [Bonjour](/fr/gateway/bonjour)
