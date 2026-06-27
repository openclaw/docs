---
read_when:
    - Jumelage ou reconnexion du nœud iOS
    - Exécuter l’application iOS depuis le code source
    - Débogage de la découverte du Gateway ou des commandes de canevas
summary: 'Application Node iOS : connexion au Gateway, jumelage, canevas et dépannage'
title: Application iOS
x-i18n:
    generated_at: "2026-06-27T17:43:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1a93381fd2b95316e05a555bee45b9aed5572679b4b1f10f7f9e40c1a69faf17
    source_path: platforms/ios.md
    workflow: 16
---

Disponibilité : les builds de l’app iPhone sont distribués via les canaux Apple lorsqu’ils sont activés pour une release. Les builds de développement local peuvent aussi s’exécuter depuis les sources.

## Ce qu’elle fait

- Se connecte à un Gateway via WebSocket (LAN ou tailnet).
- Expose les capacités du nœud : Canvas, instantané d’écran, capture caméra, localisation, mode Talk, activation vocale.
- Reçoit des commandes `node.invoke` et signale les événements d’état du nœud.

## Prérequis

- Gateway en cours d’exécution sur un autre appareil (macOS, Linux ou Windows via WSL2).
- Chemin réseau :
  - Même LAN via Bonjour, **ou**
  - Tailnet via DNS-SD unicast (domaine d’exemple : `openclaw.internal.`), **ou**
  - Hôte/port manuel (solution de repli).

## Démarrage rapide (appairer + connecter)

1. Démarrez le Gateway :

```bash
openclaw gateway --port 18789
```

2. Dans l’app iOS, ouvrez les réglages et choisissez un Gateway découvert (ou activez Hôte manuel et saisissez l’hôte/le port).

3. Approuvez la demande d’appairage sur l’hôte du Gateway :

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Si l’app réessaie l’appairage avec des détails d’authentification modifiés (rôle/périmètres/clé publique),
la demande précédente en attente est remplacée et un nouveau `requestId` est créé.
Exécutez à nouveau `openclaw devices list` avant l’approbation.

Facultatif : si le nœud iOS se connecte toujours depuis un sous-réseau étroitement contrôlé, vous
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

Cette option est désactivée par défaut. Elle s’applique uniquement aux nouveaux appairages `role: node`
sans périmètres demandés. L’appairage opérateur/navigateur et toute modification de rôle, de périmètre, de métadonnées ou de clé publique
requièrent toujours une approbation manuelle.

4. Vérifiez la connexion :

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## Push adossé au relais pour les builds officiels

Les builds iOS officiels distribués utilisent le relais push externe au lieu de publier le token APNs brut
auprès du Gateway.

Les builds officiels/TestFlight issus du canal de release public de l’App Store utilisent le relais hébergé sur `https://ios-push-relay.openclaw.ai`.

Les déploiements de relais personnalisés requièrent un chemin de build/déploiement iOS volontairement distinct dont l’URL de relais correspond à l’URL de relais du Gateway. Le canal de release public de l’App Store n’accepte pas les substitutions d’URL de relais personnalisées. Si vous utilisez un build de relais personnalisé, configurez l’URL de relais correspondante du Gateway :

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
- Le relais renvoie un handle de relais opaque plus une autorisation d’envoi limitée à l’enregistrement.
- L’app iOS récupère l’identité du Gateway appairé et l’inclut dans l’enregistrement du relais, afin que l’enregistrement adossé au relais soit délégué à ce Gateway précis.
- L’app transfère cet enregistrement adossé au relais au Gateway appairé avec `push.apns.register`.
- Le Gateway utilise ce handle de relais stocké pour `push.test`, les réveils en arrière-plan et les signaux de réveil.
- Les URL de relais de Gateway personnalisées doivent correspondre à l’URL de relais intégrée dans le build iOS.
- Si l’app se connecte ensuite à un Gateway différent ou à un build avec une URL de base de relais différente, elle actualise l’enregistrement du relais au lieu de réutiliser l’ancienne liaison.

Ce dont le Gateway n’a **pas** besoin pour ce chemin :

- Aucun token de relais à l’échelle du déploiement.
- Aucune clé APNs directe pour les envois officiels/TestFlight adossés au relais.

Flux opérateur attendu :

1. Installez le build iOS officiel/TestFlight.
2. Facultatif : définissez `gateway.push.apns.relay.baseUrl` sur le Gateway uniquement lorsque vous utilisez un build de relais personnalisé volontairement distinct.
3. Appairez l’app au Gateway et laissez-la terminer la connexion.
4. L’app publie automatiquement `push.apns.register` après avoir obtenu un token APNs, une session opérateur connectée et un enregistrement de relais réussi.
5. Ensuite, `push.test`, les réveils de reconnexion et les signaux de réveil peuvent utiliser l’enregistrement stocké adossé au relais.

## Balises d’activité en arrière-plan

Quand iOS réveille l’app pour un push silencieux, un rafraîchissement en arrière-plan ou un événement de localisation significatif, l’app
tente une courte reconnexion de nœud puis appelle `node.event` avec `event: "node.presence.alive"`.
Le Gateway enregistre cela comme `lastSeenAtMs`/`lastSeenReason` dans les métadonnées du nœud/appareil appairé uniquement
après que l’identité authentifiée de l’appareil nœud est connue.

L’app considère qu’un réveil en arrière-plan a été correctement enregistré uniquement lorsque la réponse du Gateway inclut
`handled: true`. Les anciens Gateway peuvent acquitter `node.event` avec `{ "ok": true }` ; cette réponse est
compatible mais ne compte pas comme une mise à jour durable du dernier passage vu.

Note de compatibilité :

- `OPENCLAW_APNS_RELAY_BASE_URL` fonctionne encore comme substitution temporaire par variable d’environnement pour le Gateway.
- Le canal de release public de l’App Store rejette `OPENCLAW_PUSH_RELAY_BASE_URL` pour les builds iOS.

## Flux d’authentification et de confiance

Le relais existe pour appliquer deux contraintes que l’APNs direct sur Gateway ne peut pas fournir pour
les builds iOS officiels :

- Seuls les builds iOS OpenClaw authentiques distribués via Apple peuvent utiliser le relais hébergé.
- Un Gateway ne peut envoyer des push adossés au relais que pour les appareils iOS appairés avec ce Gateway précis.

Étape par étape :

1. `iOS app -> gateway`
   - L’app s’appaire d’abord avec le Gateway via le flux d’authentification Gateway normal.
   - Cela donne à l’app une session de nœud authentifiée ainsi qu’une session opérateur authentifiée.
   - La session opérateur est utilisée pour appeler `gateway.identity.get`.

2. `iOS app -> relay`
   - L’app appelle les points de terminaison d’enregistrement du relais via HTTPS.
   - L’enregistrement inclut une preuve App Attest plus un JWS de transaction d’app StoreKit.
   - Le relais valide l’ID de bundle, la preuve App Attest et la preuve de distribution Apple, et exige le
     chemin de distribution officiel/production.
   - C’est ce qui empêche les builds Xcode/dev locaux d’utiliser le relais hébergé. Un build local peut être
     signé, mais il ne satisfait pas la preuve de distribution Apple officielle attendue par le relais.

3. `gateway identity delegation`
   - Avant l’enregistrement du relais, l’app récupère l’identité du Gateway appairé depuis
     `gateway.identity.get`.
   - L’app inclut cette identité de Gateway dans la charge utile d’enregistrement du relais.
   - Le relais renvoie un handle de relais et une autorisation d’envoi limitée à l’enregistrement, délégués à
     cette identité de Gateway.

4. `gateway -> relay`
   - Le Gateway stocke le handle de relais et l’autorisation d’envoi provenant de `push.apns.register`.
   - Lors de `push.test`, des réveils de reconnexion et des signaux de réveil, le Gateway signe la requête d’envoi avec sa
     propre identité d’appareil.
   - Le relais vérifie à la fois l’autorisation d’envoi stockée et la signature du Gateway par rapport à l’identité de Gateway
     déléguée lors de l’enregistrement.
   - Un autre Gateway ne peut pas réutiliser cet enregistrement stocké, même s’il obtient le handle d’une manière ou d’une autre.

5. `relay -> APNs`
   - Le relais possède les identifiants APNs de production et le token APNs brut du build officiel.
   - Le Gateway ne stocke jamais le token APNs brut pour les builds officiels adossés au relais.
   - Le relais envoie le push final à APNs pour le compte du Gateway appairé.

Pourquoi cette conception a été créée :

- Pour garder les identifiants APNs de production hors des Gateway utilisateur.
- Pour éviter de stocker les tokens APNs bruts des builds officiels sur le Gateway.
- Pour autoriser l’utilisation du relais hébergé uniquement pour les builds OpenClaw officiels/TestFlight.
- Pour empêcher un Gateway d’envoyer des push de réveil à des appareils iOS appartenant à un autre Gateway.

Les builds locaux/manuels restent sur APNs direct. Si vous testez ces builds sans le relais, le
Gateway a toujours besoin d’identifiants APNs directs :

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

Ce sont des variables d’environnement d’exécution de l’hôte du Gateway, pas des réglages Fastlane. `apps/ios/fastlane/.env` stocke uniquement
l’authentification App Store Connect / TestFlight, comme `APP_STORE_CONNECT_KEY_ID` et
`APP_STORE_CONNECT_ISSUER_ID` ; il ne configure pas la livraison APNs directe pour les builds iOS locaux.

Stockage recommandé sur l’hôte du Gateway :

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
domaine de découverte DNS-SD étendu. Les Gateway du même LAN apparaissent automatiquement depuis `local.` ;
la découverte interréseau peut utiliser le domaine étendu configuré sans modifier le type de balise.

### Tailnet (interréseau)

Si mDNS est bloqué, utilisez une zone DNS-SD unicast (choisissez un domaine ; exemple :
`openclaw.internal.`) et le DNS fractionné Tailscale.
Consultez [Bonjour](/fr/gateway/bonjour) pour l’exemple CoreDNS.

### Hôte/port manuel

Dans Réglages, activez **Hôte manuel** et saisissez l’hôte + le port du Gateway (`18789` par défaut).

## Canvas + A2UI

Le nœud iOS affiche un canvas WKWebView. Utilisez `node.invoke` pour le piloter :

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

Notes :

- L’hôte canvas du Gateway sert `/__openclaw__/canvas/` et `/__openclaw__/a2ui/`.
- Il est servi depuis le serveur HTTP du Gateway (même port que `gateway.port`, `18789` par défaut).
- Le nœud iOS garde l’échafaudage intégré comme vue connectée par défaut. `canvas.a2ui.push` et `canvas.a2ui.reset` utilisent la page A2UI groupée appartenant à l’app.
- Les pages A2UI de Gateway distantes sont uniquement rendues sur iOS ; les actions de boutons A2UI natives ne sont acceptées que depuis les pages groupées appartenant à l’app.
- Revenez à l’échafaudage intégré avec `canvas.navigate` et `{"url":""}`.

## Relation avec Computer Use

L’app iOS est une surface de nœud mobile, pas un backend Codex Computer Use. Codex
Computer Use et `cua-driver mcp` contrôlent un bureau macOS local via des outils MCP ;
l’app iOS expose les capacités de l’iPhone via les commandes de nœud OpenClaw
comme `canvas.*`, `camera.*`, `screen.*`, `location.*` et `talk.*`.

Les agents peuvent toujours utiliser l’app iOS via OpenClaw en invoquant des commandes de
nœud, mais ces appels passent par le protocole de nœud du Gateway et respectent les
limites iOS de premier plan/arrière-plan. Utilisez [Codex Computer Use](/fr/plugins/codex-computer-use)
pour le contrôle du bureau local, et cette page pour les capacités de nœud iOS.

### Évaluation / instantané Canvas

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## Activation vocale + mode Talk

- L’activation vocale et le mode Talk sont disponibles dans Réglages.
- Les nœuds iOS compatibles Talk annoncent la capacité `talk` et peuvent déclarer
  `talk.ptt.start`, `talk.ptt.stop`, `talk.ptt.cancel` et `talk.ptt.once` ;
  le Gateway autorise par défaut ces commandes push-to-talk pour les nœuds
  compatibles Talk approuvés.
- iOS peut suspendre l’audio en arrière-plan ; considérez les fonctionnalités vocales comme fournies au mieux lorsque l’app n’est pas active.

## Erreurs courantes

- `NODE_BACKGROUND_UNAVAILABLE` : ramenez l’app iOS au premier plan (les commandes canvas/caméra/écran l’exigent).
- `A2UI_HOST_UNAVAILABLE` : la page A2UI groupée n’était pas joignable dans la WebView de l’app ; gardez l’app au premier plan sur l’onglet Écran et réessayez.
- L’invite d’appairage n’apparaît jamais : exécutez `openclaw devices list` et approuvez manuellement.
- La reconnexion échoue après une réinstallation : le token d’appairage du trousseau a été effacé ; appairez à nouveau le nœud.

## Documentation associée

- [Appairage](/fr/channels/pairing)
- [Découverte](/fr/gateway/discovery)
- [Bonjour](/fr/gateway/bonjour)
