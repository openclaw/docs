---
read_when:
    - Jumelage ou reconnexion du Node iOS
    - Exécuter l’application iOS depuis les sources
    - Débogage de la découverte du Gateway ou des commandes canvas
summary: 'Application de nœud iOS : connexion au Gateway, appairage, canevas et dépannage'
title: Application iOS
x-i18n:
    generated_at: "2026-05-07T13:21:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 707f8b97156e800f89bc00265c1889c9cbade347fde35f037a302065956346f4
    source_path: platforms/ios.md
    workflow: 16
---

Disponibilité : aperçu interne. L’app iOS n’est pas encore distribuée publiquement.

## Ce qu’elle fait

- Se connecte à un Gateway via WebSocket (LAN ou tailnet).
- Expose les capacités du Node : Canvas, instantané d’écran, capture caméra, localisation, mode Talk, réveil vocal.
- Reçoit les commandes `node.invoke` et signale les événements d’état du Node.

## Prérequis

- Gateway exécuté sur un autre appareil (macOS, Linux ou Windows via WSL2).
- Chemin réseau :
  - Même LAN via Bonjour, **ou**
  - Tailnet via DNS-SD unicast (domaine d’exemple : `openclaw.internal.`), **ou**
  - Hôte/port manuel (solution de repli).

## Démarrage rapide (apparier + connecter)

1. Démarrez le Gateway :

```bash
openclaw gateway --port 18789
```

2. Dans l’app iOS, ouvrez Réglages et choisissez un gateway découvert (ou activez Hôte manuel et saisissez l’hôte/le port).

3. Approuvez la demande d’appariement sur l’hôte du gateway :

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Si l’app réessaie l’appariement avec des détails d’authentification modifiés (rôle/portées/clé publique),
la demande en attente précédente est remplacée et un nouveau `requestId` est créé.
Exécutez à nouveau `openclaw devices list` avant l’approbation.

Facultatif : si le Node iOS se connecte toujours depuis un sous-réseau étroitement contrôlé, vous
pouvez accepter l’approbation automatique du Node à la première connexion avec des CIDR explicites ou des IP exactes :

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

C’est désactivé par défaut. Cela s’applique uniquement aux nouveaux appariements `role: node`
sans portées demandées. L’appariement opérateur/navigateur et toute modification de rôle, portée, métadonnées ou
clé publique nécessitent toujours une approbation manuelle.

4. Vérifiez la connexion :

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## Push adossé au relais pour les builds officiels

Les builds iOS distribués officiellement utilisent le relais push externe au lieu de publier le token APNs brut
auprès du gateway.

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
- Le relais renvoie un handle de relais opaque ainsi qu’une autorisation d’envoi limitée à l’enregistrement.
- L’app iOS récupère l’identité du gateway apparié et l’inclut dans l’enregistrement du relais, afin que l’enregistrement adossé au relais soit délégué à ce gateway précis.
- L’app transmet cet enregistrement adossé au relais au gateway apparié avec `push.apns.register`.
- Le gateway utilise ce handle de relais stocké pour `push.test`, les réveils en arrière-plan et les impulsions de réveil.
- L’URL de base du relais du gateway doit correspondre à l’URL de relais intégrée dans le build iOS officiel/TestFlight.
- Si l’app se connecte ensuite à un autre gateway ou à un build avec une URL de base de relais différente, elle actualise l’enregistrement du relais au lieu de réutiliser l’ancienne liaison.

Ce dont le gateway n’a **pas** besoin pour ce chemin :

- Aucun token de relais à l’échelle du déploiement.
- Aucune clé APNs directe pour les envois officiels/TestFlight adossés au relais.

Flux opérateur attendu :

1. Installez le build iOS officiel/TestFlight.
2. Définissez `gateway.push.apns.relay.baseUrl` sur le gateway.
3. Appariez l’app au gateway et laissez-la terminer la connexion.
4. L’app publie automatiquement `push.apns.register` après avoir obtenu un token APNs, lorsque la session opérateur est connectée et que l’enregistrement du relais réussit.
5. Ensuite, `push.test`, les réveils de reconnexion et les impulsions de réveil peuvent utiliser l’enregistrement adossé au relais stocké.

## Signaux de présence en arrière-plan

Lorsque iOS réveille l’app pour un push silencieux, une actualisation en arrière-plan ou un événement de localisation significative, l’app
tente une reconnexion courte du Node puis appelle `node.event` avec `event: "node.presence.alive"`.
Le gateway enregistre cela comme `lastSeenAtMs`/`lastSeenReason` dans les métadonnées du Node/appareil apparié uniquement
après que l’identité authentifiée de l’appareil Node est connue.

L’app considère qu’un réveil en arrière-plan a été enregistré avec succès uniquement lorsque la réponse du gateway inclut
`handled: true`. Les gateways plus anciens peuvent acquitter `node.event` avec `{ "ok": true }` ; cette réponse est
compatible, mais ne compte pas comme une mise à jour durable du dernier signalement.

Note de compatibilité :

- `OPENCLAW_APNS_RELAY_BASE_URL` fonctionne toujours comme surcharge temporaire d’environnement pour le gateway.

## Flux d’authentification et de confiance

Le relais existe pour appliquer deux contraintes que l’APNs direct sur le gateway ne peut pas fournir pour
les builds iOS officiels :

- Seuls les builds iOS OpenClaw authentiques distribués via Apple peuvent utiliser le relais hébergé.
- Un gateway ne peut envoyer des pushs adossés au relais que pour les appareils iOS appariés avec ce gateway précis.

Saut par saut :

1. `iOS app -> gateway`
   - L’app s’apparie d’abord avec le gateway via le flux d’authentification Gateway normal.
   - Cela donne à l’app une session Node authentifiée ainsi qu’une session opérateur authentifiée.
   - La session opérateur est utilisée pour appeler `gateway.identity.get`.

2. `iOS app -> relay`
   - L’app appelle les points de terminaison d’enregistrement du relais via HTTPS.
   - L’enregistrement inclut une preuve App Attest ainsi qu’un JWS de transaction d’app StoreKit.
   - Le relais valide l’identifiant de bundle, la preuve App Attest et la preuve de distribution Apple, et exige le
     chemin de distribution officiel/production.
   - C’est ce qui empêche les builds Xcode/dev locaux d’utiliser le relais hébergé. Un build local peut être
     signé, mais il ne satisfait pas la preuve de distribution Apple officielle attendue par le relais.

3. `gateway identity delegation`
   - Avant l’enregistrement du relais, l’app récupère l’identité du gateway apparié depuis
     `gateway.identity.get`.
   - L’app inclut cette identité de gateway dans la charge utile d’enregistrement du relais.
   - Le relais renvoie un handle de relais et une autorisation d’envoi limitée à l’enregistrement, délégués à
     cette identité de gateway.

4. `gateway -> relay`
   - Le gateway stocke le handle de relais et l’autorisation d’envoi provenant de `push.apns.register`.
   - Lors de `push.test`, des réveils de reconnexion et des impulsions de réveil, le gateway signe la demande d’envoi avec sa
     propre identité d’appareil.
   - Le relais vérifie à la fois l’autorisation d’envoi stockée et la signature du gateway par rapport à l’identité de
     gateway déléguée lors de l’enregistrement.
   - Un autre gateway ne peut pas réutiliser cet enregistrement stocké, même s’il obtient le handle d’une quelconque manière.

5. `relay -> APNs`
   - Le relais possède les identifiants APNs de production et le token APNs brut pour le build officiel.
   - Le gateway ne stocke jamais le token APNs brut pour les builds officiels adossés au relais.
   - Le relais envoie le push final à APNs pour le compte du gateway apparié.

Pourquoi cette conception a été créée :

- Pour garder les identifiants APNs de production hors des gateways utilisateur.
- Pour éviter de stocker les tokens APNs bruts des builds officiels sur le gateway.
- Pour n’autoriser l’utilisation du relais hébergé qu’aux builds OpenClaw officiels/TestFlight.
- Pour empêcher un gateway d’envoyer des pushs de réveil à des appareils iOS appartenant à un autre gateway.

Les builds locaux/manuels restent sur APNs direct. Si vous testez ces builds sans le relais, le
gateway a toujours besoin d’identifiants APNs directs :

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

Ce sont des variables d’environnement d’exécution de l’hôte du gateway, pas des réglages Fastlane. `apps/ios/fastlane/.env` stocke uniquement
l’authentification App Store Connect / TestFlight, comme `ASC_KEY_ID` et `ASC_ISSUER_ID` ; il ne configure pas
la livraison APNs directe pour les builds iOS locaux.

Stockage recommandé sur l’hôte du gateway :

```bash
mkdir -p ~/.openclaw/credentials/apns
chmod 700 ~/.openclaw/credentials/apns
mv /path/to/AuthKey_KEYID.p8 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
chmod 600 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
export OPENCLAW_APNS_PRIVATE_KEY_PATH="$HOME/.openclaw/credentials/apns/AuthKey_KEYID.p8"
```

Ne commitez pas le fichier `.p8` et ne le placez pas sous le checkout du dépôt.

## Chemins de découverte

### Bonjour (LAN)

L’app iOS parcourt `_openclaw-gw._tcp` sur `local.` et, lorsqu’il est configuré, le même
domaine de découverte DNS-SD étendu. Les gateways du même LAN apparaissent automatiquement depuis `local.` ;
la découverte inter-réseaux peut utiliser le domaine étendu configuré sans modifier le type de balise.

### Tailnet (inter-réseaux)

Si mDNS est bloqué, utilisez une zone DNS-SD unicast (choisissez un domaine ; exemple :
`openclaw.internal.`) et le DNS partagé Tailscale.
Consultez [Bonjour](/fr/gateway/bonjour) pour l’exemple CoreDNS.

### Hôte/port manuel

Dans Réglages, activez **Hôte manuel** et saisissez l’hôte du gateway + le port (`18789` par défaut).

## Canvas + A2UI

Le Node iOS rend un canevas WKWebView. Utilisez `node.invoke` pour le piloter :

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

Notes :

- L’hôte Canvas du Gateway sert `/__openclaw__/canvas/` et `/__openclaw__/a2ui/`.
- Il est servi depuis le serveur HTTP du Gateway (même port que `gateway.port`, `18789` par défaut).
- Le Node iOS navigue automatiquement vers A2UI à la connexion lorsqu’une URL d’hôte Canvas est annoncée.
- Revenez à l’échafaudage intégré avec `canvas.navigate` et `{"url":""}`.

## Relation avec Computer Use

L’app iOS est une surface de Node mobile, pas un backend Codex Computer Use. Codex
Computer Use et `cua-driver mcp` contrôlent un bureau macOS local via des outils MCP ;
l’app iOS expose les capacités de l’iPhone via les commandes de Node OpenClaw
comme `canvas.*`, `camera.*`, `screen.*`, `location.*` et `talk.*`.

Les agents peuvent toujours piloter l’app iOS via OpenClaw en invoquant des commandes de Node,
mais ces appels passent par le protocole de Node du gateway et respectent les limites
avant-plan/arrière-plan d’iOS. Utilisez [Codex Computer Use](/fr/plugins/codex-computer-use)
pour le contrôle du bureau local et cette page pour les capacités du Node iOS.

### Évaluation / instantané Canvas

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## Réveil vocal + mode Talk

- Le réveil vocal et le mode Talk sont disponibles dans Réglages.
- Les Nodes iOS compatibles Talk annoncent la capacité `talk` et peuvent déclarer
  `talk.ptt.start`, `talk.ptt.stop`, `talk.ptt.cancel` et `talk.ptt.once` ;
  le Gateway autorise par défaut ces commandes push-to-talk pour les Nodes
  compatibles Talk et approuvés.
- iOS peut suspendre l’audio en arrière-plan ; considérez les fonctionnalités vocales comme fonctionnant au mieux lorsque l’app n’est pas active.

## Erreurs courantes

- `NODE_BACKGROUND_UNAVAILABLE` : mettez l’app iOS au premier plan (les commandes canvas/camera/screen l’exigent).
- `A2UI_HOST_NOT_CONFIGURED` : le Gateway n’a pas annoncé l’URL de surface du Plugin Canvas ; vérifiez `plugins.entries.canvas.config.host` dans la [configuration du Gateway](/fr/gateway/configuration).
- L’invite d’appariement n’apparaît jamais : exécutez `openclaw devices list` et approuvez manuellement.
- La reconnexion échoue après réinstallation : le token d’appariement Keychain a été effacé ; appariez à nouveau le Node.

## Documentation associée

- [Appariement](/fr/channels/pairing)
- [Découverte](/fr/gateway/discovery)
- [Bonjour](/fr/gateway/bonjour)
