---
read_when:
    - Débogage des problèmes de découverte Bonjour sur macOS/iOS
    - Modification des types de services mDNS, des enregistrements TXT ou de l’expérience utilisateur de découverte
summary: Découverte Bonjour/mDNS + débogage (balises du Gateway, clients et modes de défaillance courants)
title: Découverte Bonjour
x-i18n:
    generated_at: "2026-05-03T21:31:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2975fea03bc8fe8ccbd57f7a4ca8c15a59fb21b3f92c2b77b9a57ae4ebd5d374
    source_path: gateway/bonjour.md
    workflow: 16
---

# Bonjour / découverte mDNS

OpenClaw peut utiliser Bonjour (mDNS / DNS-SD) pour découvrir un Gateway actif (point de terminaison WebSocket).
La navigation multicast `local.` est une **commodité limitée au LAN**. Le Plugin `bonjour`
intégré possède l’annonce LAN. Il démarre automatiquement sur les hôtes macOS et est opt-in sur
Linux, Windows et les déploiements de Gateway conteneurisés. Pour la découverte entre réseaux, la même
balise peut aussi être publiée via un domaine DNS-SD étendu configuré. La découverte
reste fournie au mieux et ne remplace **pas** la connectivité basée sur SSH ou Tailnet.

## Bonjour étendu (DNS-SD unicast) via Tailscale

Si le nœud et le gateway sont sur des réseaux différents, le mDNS multicast ne franchira pas la
frontière. Vous pouvez conserver la même expérience de découverte en passant à **DNS‑SD unicast**
(« Bonjour étendu ») via Tailscale.

Étapes générales :

1. Exécutez un serveur DNS sur l’hôte du gateway (joignable via Tailnet).
2. Publiez des enregistrements DNS‑SD pour `_openclaw-gw._tcp` sous une zone dédiée
   (exemple : `openclaw.internal.`).
3. Configurez le **DNS fractionné** Tailscale afin que le domaine choisi soit résolu via ce
   serveur DNS pour les clients (y compris iOS).

OpenClaw prend en charge n’importe quel domaine de découverte ; `openclaw.internal.` n’est qu’un exemple.
Les nœuds iOS/Android parcourent à la fois `local.` et votre domaine étendu configuré.

### Configuration du Gateway (recommandé)

```json5
{
  gateway: { bind: "tailnet" }, // tailnet-only (recommended)
  discovery: { wideArea: { enabled: true } }, // enables wide-area DNS-SD publishing
}
```

### Configuration unique du serveur DNS (hôte du gateway)

```bash
openclaw dns setup --apply
```

Cela installe CoreDNS et le configure pour :

- écouter sur le port 53 uniquement sur les interfaces Tailscale du gateway
- servir votre domaine choisi (exemple : `openclaw.internal.`) depuis `~/.openclaw/dns/<domain>.db`

Validez depuis une machine connectée au tailnet :

```bash
dns-sd -B _openclaw-gw._tcp openclaw.internal.
dig @<TAILNET_IPV4> -p 53 _openclaw-gw._tcp.openclaw.internal PTR +short
```

### Paramètres DNS Tailscale

Dans la console d’administration Tailscale :

- Ajoutez un serveur de noms pointant vers l’IP tailnet du gateway (UDP/TCP 53).
- Ajoutez un DNS fractionné afin que votre domaine de découverte utilise ce serveur de noms.

Une fois que les clients acceptent le DNS tailnet, les nœuds iOS et la découverte CLI peuvent parcourir
`_openclaw-gw._tcp` dans votre domaine de découverte sans multicast.

### Sécurité de l’écouteur Gateway (recommandé)

Le port WS du Gateway (par défaut `18789`) se lie par défaut à loopback. Pour l’accès LAN/tailnet,
liez-le explicitement et gardez l’authentification activée.

Pour les configurations tailnet uniquement :

- Définissez `gateway.bind: "tailnet"` dans `~/.openclaw/openclaw.json`.
- Redémarrez le Gateway (ou redémarrez l’application de barre de menus macOS).

## Ce qui annonce

Seul le Gateway annonce `_openclaw-gw._tcp`. L’annonce multicast LAN est
fournie par le Plugin `bonjour` intégré lorsque le Plugin est activé ; la publication
DNS-SD étendue reste possédée par le Gateway.

## Types de service

- `_openclaw-gw._tcp` — balise de transport du gateway (utilisée par les nœuds macOS/iOS/Android).

## Clés TXT (indications non secrètes)

Le Gateway annonce de petites indications non secrètes pour faciliter les flux d’interface utilisateur :

- `role=gateway`
- `displayName=<friendly name>`
- `lanHost=<hostname>.local`
- `gatewayPort=<port>` (Gateway WS + HTTP)
- `gatewayTls=1` (uniquement lorsque TLS est activé)
- `gatewayTlsSha256=<sha256>` (uniquement lorsque TLS est activé et que l’empreinte est disponible)
- `canvasPort=<port>` (uniquement lorsque l’hôte canvas est activé ; actuellement identique à `gatewayPort`)
- `transport=gateway`
- `tailnetDns=<magicdns>` (mode mDNS complet uniquement, indication facultative lorsque Tailnet est disponible)
- `sshPort=<port>` (mode mDNS complet uniquement ; le DNS-SD étendu peut l’omettre)
- `cliPath=<path>` (mode mDNS complet uniquement ; le DNS-SD étendu l’écrit toujours comme indication d’installation distante)

Notes de sécurité :

- Les enregistrements TXT Bonjour/mDNS ne sont **pas authentifiés**. Les clients ne doivent pas considérer TXT comme un routage faisant autorité.
- Les clients doivent router à l’aide du point de terminaison de service résolu (SRV + A/AAAA). Traitez `lanHost`, `tailnetDns`, `gatewayPort` et `gatewayTlsSha256` uniquement comme des indications.
- Le ciblage automatique SSH doit de même utiliser l’hôte de service résolu, et non des indications uniquement TXT.
- L’épinglage TLS ne doit jamais permettre à un `gatewayTlsSha256` annoncé de remplacer une épingle précédemment stockée.
- Les nœuds iOS/Android doivent traiter les connexions directes basées sur la découverte comme **TLS uniquement** et exiger une confirmation explicite de l’utilisateur avant de faire confiance à une empreinte pour la première fois.

## Débogage sur macOS

Outils intégrés utiles :

- Parcourir les instances :

  ```bash
  dns-sd -B _openclaw-gw._tcp local.
  ```

- Résoudre une instance (remplacez `<instance>`) :

  ```bash
  dns-sd -L "<instance>" _openclaw-gw._tcp local.
  ```

Si la navigation fonctionne mais que la résolution échoue, vous rencontrez généralement une politique LAN ou
un problème de résolveur mDNS.

## Débogage dans les journaux du Gateway

Le Gateway écrit un fichier journal tournant (affiché au démarrage comme
`gateway log file: ...`). Recherchez les lignes `bonjour:`, en particulier :

- `bonjour: advertise failed ...`
- `bonjour: suppressing ciao cancellation ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`
- `bonjour: watchdog detected non-announced service ...`
- `bonjour: disabling advertiser after ... failed restarts ...`

Bonjour utilise le nom d’hôte système pour l’hôte `.local` annoncé lorsqu’il s’agit d’une
étiquette DNS valide. Si le nom d’hôte système contient des espaces, des traits de soulignement ou un autre
caractère invalide pour une étiquette DNS, OpenClaw se rabat sur `openclaw.local`. Définissez
`OPENCLAW_MDNS_HOSTNAME=<name>` avant de démarrer le Gateway lorsque vous avez besoin d’une
étiquette d’hôte explicite.

## Débogage sur le nœud iOS

Le nœud iOS utilise `NWBrowser` pour découvrir `_openclaw-gw._tcp`.

Pour capturer les journaux :

- Paramètres → Gateway → Avancé → **Journaux de débogage de la découverte**
- Paramètres → Gateway → Avancé → **Journaux de découverte** → reproduire → **Copier**

Le journal inclut les transitions d’état du navigateur et les changements d’ensemble de résultats.

## Quand activer Bonjour

Bonjour démarre automatiquement pour le démarrage du Gateway avec configuration vide sur les hôtes macOS, car
l’application locale et les nœuds iOS/Android à proximité reposent souvent sur la découverte sur le même LAN.

Activez Bonjour explicitement lorsque la découverte automatique sur le même LAN est utile sur Linux,
Windows ou un autre hôte non macOS :

```bash
openclaw plugins enable bonjour
```

Lorsqu’il est activé, Bonjour utilise `discovery.mdns.mode` pour décider de la quantité de métadonnées TXT
à publier. Le mode par défaut est `minimal` ; utilisez `full` uniquement lorsque les clients locaux ont besoin
des indications `cliPath` ou `sshPort`, et utilisez `off` pour supprimer le multicast LAN sans
modifier l’activation du Plugin.

## Quand désactiver Bonjour

Laissez Bonjour désactivé lorsque l’annonce multicast LAN est inutile, indisponible
ou nuisible. Les cas courants sont les serveurs non macOS, la mise en réseau Docker bridge,
WSL ou une politique réseau qui bloque le multicast mDNS. Dans ces environnements, le
Gateway reste joignable via son URL publiée, SSH, Tailnet ou le DNS-SD étendu,
mais la découverte automatique LAN n’est pas fiable.

Préférez la surcharge d’environnement existante lorsque le problème est propre au déploiement :

```bash
OPENCLAW_DISABLE_BONJOUR=1
```

Cela désactive l’annonce multicast LAN sans modifier la configuration du Plugin.
C’est sûr pour les images Docker, les fichiers de service, les scripts de lancement et le
débogage ponctuel, car le paramètre disparaît lorsque l’environnement disparaît.

Utilisez la configuration du Plugin lorsque vous voulez intentionnellement désactiver le Plugin de
découverte LAN intégré pour cette configuration OpenClaw :

```bash
openclaw plugins disable bonjour
```

## Pièges Docker

Le Plugin Bonjour intégré désactive automatiquement l’annonce multicast LAN dans les conteneurs
détectés lorsque `OPENCLAW_DISABLE_BONJOUR` n’est pas défini. Les réseaux Docker bridge
ne transmettent généralement pas le multicast mDNS (`224.0.0.251:5353`) entre le conteneur
et le LAN, donc l’annonce depuis le conteneur rend rarement la découverte fonctionnelle.

Pièges importants :

- Bonjour démarre automatiquement sur les hôtes macOS et est opt-in ailleurs. Le laisser
  désactivé n’arrête pas le Gateway ; cela saute uniquement l’annonce multicast LAN.
- Désactiver Bonjour ne modifie pas `gateway.bind` ; Docker utilise toujours par défaut
  `OPENCLAW_GATEWAY_BIND=lan` afin que le port hôte publié puisse fonctionner.
- Désactiver Bonjour ne désactive pas le DNS-SD étendu. Utilisez la découverte étendue
  ou Tailnet lorsque le Gateway et le nœud ne sont pas sur le même LAN.
- Réutiliser le même `OPENCLAW_CONFIG_DIR` en dehors de Docker ne conserve pas la
  politique de désactivation automatique du conteneur.
- Définissez `OPENCLAW_DISABLE_BONJOUR=0` uniquement pour le réseau hôte, macvlan ou un autre
  réseau où le multicast mDNS est connu pour passer ; définissez-le sur `1` pour forcer la désactivation.

## Dépannage de Bonjour désactivé

Si un nœud ne découvre plus automatiquement le Gateway après une configuration Docker :

1. Confirmez si le Gateway fonctionne en mode automatique, forcé activé ou forcé désactivé :

   ```bash
   docker compose config | grep OPENCLAW_DISABLE_BONJOUR
   ```

2. Confirmez que le Gateway lui-même est joignable via le port publié :

   ```bash
   curl -fsS http://127.0.0.1:18789/healthz
   ```

3. Utilisez une cible directe lorsque Bonjour est désactivé :
   - UI de contrôle ou outils locaux : `http://127.0.0.1:18789`
   - Clients LAN : `http://<gateway-host>:18789`
   - Clients entre réseaux : MagicDNS Tailnet, IP Tailnet, tunnel SSH ou
     DNS-SD étendu

4. Si vous avez délibérément activé le Plugin Bonjour dans Docker et forcé l’annonce
   avec `OPENCLAW_DISABLE_BONJOUR=0`, testez le multicast depuis l’hôte :

   ```bash
   dns-sd -B _openclaw-gw._tcp local.
   ```

   Si la navigation est vide ou si les journaux du Gateway montrent des annulations répétées du watchdog ciao,
   restaurez `OPENCLAW_DISABLE_BONJOUR=1` et utilisez une route directe ou
   Tailnet.

## Modes de défaillance courants

- **Bonjour ne traverse pas les réseaux** : utilisez Tailnet ou SSH.
- **Multicast bloqué** : certains réseaux Wi‑Fi désactivent mDNS.
- **Annonceur bloqué en sondage/annonce** : les hôtes avec multicast bloqué,
  les bridges de conteneurs, WSL ou les changements d’interface peuvent laisser l’annonceur ciao dans un
  état non annoncé. OpenClaw réessaie quelques fois puis désactive Bonjour
  pour le processus Gateway actuel au lieu de redémarrer l’annonceur indéfiniment.
- **Réseau Docker bridge** : Bonjour se désactive automatiquement dans les conteneurs détectés.
  Définissez `OPENCLAW_DISABLE_BONJOUR=0` uniquement pour l’hôte, macvlan ou un autre
  réseau compatible mDNS.
- **Veille / changements d’interface** : macOS peut temporairement perdre les résultats mDNS ; réessayez.
- **La navigation fonctionne mais la résolution échoue** : gardez des noms de machine simples (évitez les émojis ou
  la ponctuation), puis redémarrez le Gateway. Le nom de l’instance de service dérive du
  nom d’hôte ; les noms trop complexes peuvent donc perturber certains résolveurs.

## Noms d’instance échappés (`\032`)

Bonjour/DNS‑SD échappe souvent les octets dans les noms d’instance de service sous forme de séquences décimales `\DDD`
(par exemple, les espaces deviennent `\032`).

- C’est normal au niveau du protocole.
- Les interfaces utilisateur doivent décoder pour l’affichage (iOS utilise `BonjourEscapes.decode`).

## Activation / désactivation / configuration

- Les hôtes macOS démarrent automatiquement le Plugin de découverte LAN intégré par défaut.
- `openclaw plugins enable bonjour` active le Plugin de découverte LAN intégré sur les hôtes où il n’est pas activé par défaut.
- `openclaw plugins disable bonjour` désactive l’annonce multicast LAN en désactivant le Plugin intégré.
- `OPENCLAW_DISABLE_BONJOUR=1` désactive l’annonce multicast LAN sans modifier la configuration du Plugin ; les valeurs truthy acceptées sont `1`, `true`, `yes` et `on` (héritage : `OPENCLAW_DISABLE_BONJOUR`).
- `OPENCLAW_DISABLE_BONJOUR=0` force l’activation de l’annonce multicast LAN, y compris dans les conteneurs détectés ; les valeurs falsy acceptées sont `0`, `false`, `no` et `off`.
- Lorsque le Plugin Bonjour est activé et que `OPENCLAW_DISABLE_BONJOUR` n’est pas défini, Bonjour annonce sur les hôtes normaux et se désactive automatiquement dans les conteneurs détectés.
- `gateway.bind` dans `~/.openclaw/openclaw.json` contrôle le mode de liaison du Gateway.
- `OPENCLAW_SSH_PORT` remplace le port SSH lorsque `sshPort` est annoncé (héritage : `OPENCLAW_SSH_PORT`).
- `OPENCLAW_TAILNET_DNS` publie une indication MagicDNS dans TXT lorsque le mode mDNS complet est activé (héritage : `OPENCLAW_TAILNET_DNS`).
- `OPENCLAW_CLI_PATH` remplace le chemin CLI annoncé (héritage : `OPENCLAW_CLI_PATH`).

## Docs associées

- Politique de découverte et sélection du transport : [Découverte](/fr/gateway/discovery)
- Appairage du nœud + approbations : [Appairage Gateway](/fr/gateway/pairing)
