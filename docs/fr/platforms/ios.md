---
read_when:
    - Appairage ou reconnexion du node iOS
    - Exécution de l’app iOS depuis les sources
    - Débogage de la découverte de la gateway ou des commandes canvas
summary: 'App node iOS : connexion à la Gateway, appairage, canvas et dépannage'
title: App iOS
x-i18n:
    generated_at: "2026-04-25T13:51:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: ad0088cd135168248cfad10c24715f74117a66efaa52a572579c04f96a806538
    source_path: platforms/ios.md
    workflow: 15
---

Disponibilité : aperçu interne. L’app iOS n’est pas encore distribuée publiquement.

## Ce qu’elle fait

- Se connecte à une Gateway via WebSocket (LAN ou tailnet).
- Expose les capacités du node : Canvas, capture d’écran, capture caméra, localisation, mode Talk, réveil vocal.
- Reçoit les commandes `node.invoke` et signale les événements d’état du node.

## Prérequis

- Gateway en cours d’exécution sur un autre appareil (macOS, Linux ou Windows via WSL2).
- Chemin réseau :
  - Même LAN via Bonjour, **ou**
  - Tailnet via DNS-SD unicast (domaine d’exemple : `openclaw.internal.`), **ou**
  - Hôte/port manuel (solution de repli).

## Démarrage rapide (appairer + connecter)

1. Démarrez la Gateway :

```bash
openclaw gateway --port 18789
```

2. Dans l’app iOS, ouvrez Réglages et choisissez une gateway découverte (ou activez Manual Host et saisissez l’hôte/le port).

3. Approuvez la demande d’appairage sur l’hôte de la gateway :

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Si l’app réessaie l’appairage avec des détails d’auth modifiés (rôle/scopes/clé publique),
la demande en attente précédente est remplacée et un nouveau `requestId` est créé.
Exécutez à nouveau `openclaw devices list` avant l’approbation.

Facultatif : si le node iOS se connecte toujours depuis un sous-réseau étroitement contrôlé, vous
pouvez choisir d’activer l’auto-approbation du premier appairage du node avec des CIDR explicites ou des IP exactes :

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

Cela est désactivé par défaut. Cela s’applique uniquement à un nouvel appairage `role: node` avec
aucune portée demandée. L’appairage opérateur/navigateur ainsi que toute modification de rôle, de portée, de métadonnées ou de
clé publique nécessitent toujours une approbation manuelle.

4. Vérifiez la connexion :

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## Push adossé à un relay pour les builds officiels

Les builds iOS officiels distribués utilisent le relay push externe au lieu de publier le jeton APNs brut
à la gateway.

Prérequis côté Gateway :

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

Fonctionnement du flux :

- L’app iOS s’enregistre auprès du relay à l’aide d’App Attest et du reçu de l’app.
- Le relay renvoie un handle de relay opaque ainsi qu’un droit d’envoi limité à l’enregistrement.
- L’app iOS récupère l’identité de la gateway appairée et l’inclut dans l’enregistrement auprès du relay, afin que l’enregistrement adossé au relay soit délégué à cette gateway spécifique.
- L’app transmet cet enregistrement adossé au relay à la gateway appairée avec `push.apns.register`.
- La gateway utilise ce handle de relay stocké pour `push.test`, les réveils en arrière-plan et les relances de réveil.
- Le base URL du relay de la gateway doit correspondre à l’URL du relay intégrée dans le build iOS officiel/TestFlight.
- Si l’app se connecte ensuite à une autre gateway ou à un build avec un autre base URL de relay, elle actualise l’enregistrement du relay au lieu de réutiliser l’ancienne liaison.

Ce dont la gateway n’a **pas** besoin pour ce chemin :

- Aucun jeton de relay global au déploiement.
- Aucune clé APNs directe pour les envois officiels/TestFlight adossés au relay.

Flux opérateur attendu :

1. Installez le build iOS officiel/TestFlight.
2. Définissez `gateway.push.apns.relay.baseUrl` sur la gateway.
3. Appairez l’app à la gateway et laissez-la terminer la connexion.
4. L’app publie automatiquement `push.apns.register` après avoir obtenu un jeton APNs, qu’une session opérateur soit connectée et que l’enregistrement auprès du relay réussisse.
5. Après cela, `push.test`, les réveils de reconnexion et les relances de réveil peuvent utiliser l’enregistrement adossé au relay stocké.

Remarque de compatibilité :

- `OPENCLAW_APNS_RELAY_BASE_URL` fonctionne toujours comme remplacement env temporaire pour la gateway.

## Flux d’authentification et de confiance

Le relay existe pour imposer deux contraintes que l’APNs direct sur la gateway ne peut pas fournir pour les
builds iOS officiels :

- Seuls les builds iOS OpenClaw authentiques distribués via Apple peuvent utiliser le relay hébergé.
- Une gateway ne peut envoyer des push adossés au relay que pour les appareils iOS appairés à cette
  gateway spécifique.

Saut par saut :

1. `iOS app -> gateway`
   - L’app s’appaire d’abord à la gateway via le flux d’auth Gateway normal.
   - Cela donne à l’app une session node authentifiée ainsi qu’une session opérateur authentifiée.
   - La session opérateur est utilisée pour appeler `gateway.identity.get`.

2. `iOS app -> relay`
   - L’app appelle les endpoints d’enregistrement du relay via HTTPS.
   - L’enregistrement inclut une preuve App Attest ainsi que le reçu de l’app.
   - Le relay valide le bundle ID, la preuve App Attest et le reçu Apple, et exige le
     chemin de distribution officiel/de production.
   - C’est ce qui empêche les builds locaux Xcode/dev d’utiliser le relay hébergé. Un build local peut être
     signé, mais il ne satisfait pas à la preuve de distribution officielle Apple attendue par le relay.

3. `gateway identity delegation`
   - Avant l’enregistrement auprès du relay, l’app récupère l’identité de la gateway appairée via
     `gateway.identity.get`.
   - L’app inclut cette identité de gateway dans la charge utile d’enregistrement auprès du relay.
   - Le relay renvoie un handle de relay et un droit d’envoi limité à l’enregistrement délégués à
     cette identité de gateway.

4. `gateway -> relay`
   - La gateway stocke le handle de relay et le droit d’envoi reçus de `push.apns.register`.
   - Lors de `push.test`, des réveils de reconnexion et des relances de réveil, la gateway signe la requête d’envoi avec sa
     propre identité d’appareil.
   - Le relay vérifie à la fois le droit d’envoi stocké et la signature de la gateway par rapport à l’identité de
     gateway déléguée lors de l’enregistrement.
   - Une autre gateway ne peut pas réutiliser cet enregistrement stocké, même si elle obtenait d’une manière ou d’une autre le handle.

5. `relay -> APNs`
   - Le relay possède les identifiants APNs de production et le jeton APNs brut pour le build officiel.
   - La gateway ne stocke jamais le jeton APNs brut pour les builds officiels adossés au relay.
   - Le relay envoie le push final à APNs au nom de la gateway appairée.

Pourquoi cette conception a été créée :

- Pour garder les identifiants APNs de production hors des gateways des utilisateurs.
- Pour éviter de stocker des jetons APNs bruts de builds officiels sur la gateway.
- Pour autoriser l’usage du relay hébergé uniquement pour les builds OpenClaw officiels/TestFlight.
- Pour empêcher une gateway d’envoyer des push de réveil à des appareils iOS appartenant à une autre gateway.

Les builds locaux/manuels restent sur APNs direct. Si vous testez ces builds sans relay, la
gateway a toujours besoin d’identifiants APNs directs :

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

Ce sont des variables d’environnement d’exécution de l’hôte de la gateway, pas des paramètres Fastlane. `apps/ios/fastlane/.env` stocke uniquement
les informations d’auth App Store Connect / TestFlight comme `ASC_KEY_ID` et `ASC_ISSUER_ID` ; il ne configure pas
la distribution APNs directe pour les builds iOS locaux.

Stockage recommandé sur l’hôte de la gateway :

```bash
mkdir -p ~/.openclaw/credentials/apns
chmod 700 ~/.openclaw/credentials/apns
mv /path/to/AuthKey_KEYID.p8 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
chmod 600 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
export OPENCLAW_APNS_PRIVATE_KEY_PATH="$HOME/.openclaw/credentials/apns/AuthKey_KEYID.p8"
```

Ne committez pas le fichier `.p8` et ne le placez pas dans le checkout du dépôt.

## Chemins de découverte

### Bonjour (LAN)

L’app iOS parcourt `_openclaw-gw._tcp` sur `local.` et, lorsqu’il est configuré, le même
domaine de découverte DNS-SD étendu. Les gateways sur le même LAN apparaissent automatiquement via `local.` ;
la découverte inter-réseaux peut utiliser le domaine étendu configuré sans changer le type de beacon.

### Tailnet (inter-réseaux)

Si mDNS est bloqué, utilisez une zone DNS-SD unicast (choisissez un domaine ; exemple :
`openclaw.internal.`) et Tailscale split DNS.
Voir [Bonjour](/fr/gateway/bonjour) pour l’exemple CoreDNS.

### Hôte/port manuel

Dans Réglages, activez **Manual Host** et saisissez l’hôte + le port de la gateway (par défaut `18789`).

## Canvas + A2UI

Le node iOS affiche un canvas WKWebView. Utilisez `node.invoke` pour le piloter :

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

Remarques :

- L’hôte canvas Gateway sert `/__openclaw__/canvas/` et `/__openclaw__/a2ui/`.
- Il est servi depuis le serveur HTTP Gateway (même port que `gateway.port`, par défaut `18789`).
- Le node iOS navigue automatiquement vers A2UI à la connexion lorsqu’une URL d’hôte canvas est annoncée.
- Revenez au scaffold intégré avec `canvas.navigate` et `{"url":""}`.

### Canvas eval / snapshot

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## Réveil vocal + mode Talk

- Le réveil vocal et le mode Talk sont disponibles dans Réglages.
- iOS peut suspendre l’audio en arrière-plan ; considérez les fonctions vocales comme du best-effort lorsque l’app n’est pas active.

## Erreurs courantes

- `NODE_BACKGROUND_UNAVAILABLE` : ramenez l’app iOS au premier plan (les commandes canvas/caméra/écran l’exigent).
- `A2UI_HOST_NOT_CONFIGURED` : la Gateway n’a pas annoncé d’URL d’hôte canvas ; vérifiez `canvasHost` dans la [Configuration Gateway](/fr/gateway/configuration).
- L’invite d’appairage n’apparaît jamais : exécutez `openclaw devices list` et approuvez manuellement.
- La reconnexion échoue après réinstallation : le jeton d’appairage du Keychain a été effacé ; réappairez le node.

## Documentation liée

- [Appairage](/fr/channels/pairing)
- [Découverte](/fr/gateway/discovery)
- [Bonjour](/fr/gateway/bonjour)
