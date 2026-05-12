---
read_when:
    - Débogage des problèmes de découverte Bonjour sur macOS/iOS
    - Modification des types de services mDNS, des enregistrements TXT ou de l’UX de découverte
summary: Découverte + débogage Bonjour/mDNS (balises Gateway, clients et modes de défaillance courants)
title: Découverte Bonjour
x-i18n:
    generated_at: "2026-05-12T12:50:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 05892ee8f0dc880f68f7cf024de9452b8d999ff1af3c7ca9850fb4f2d732af0c
    source_path: gateway/bonjour.md
    workflow: 16
---

OpenClaw peut utiliser Bonjour (mDNS / DNS-SD) pour découvrir un Gateway actif (point de terminaison WebSocket).
La navigation multicast `local.` est une **commodité limitée au LAN**. Le Plugin `bonjour`
intégré possède la publicité LAN. Il démarre automatiquement sur les hôtes macOS et est optionnel sur
Linux, Windows et les déploiements de Gateway conteneurisés. Pour la découverte entre réseaux, la même
balise peut aussi être publiée via un domaine DNS-SD étendu configuré. La découverte
reste au mieux et ne remplace **pas** la connectivité basée sur SSH ou Tailnet.

## Bonjour étendu (DNS-SD unicast) sur Tailscale

Si le Node et le Gateway sont sur des réseaux différents, le mDNS multicast ne franchira pas la
frontière. Vous pouvez conserver la même UX de découverte en passant à **DNS-SD unicast**
(« Wide-Area Bonjour ») sur Tailscale.

Étapes générales :

1. Exécuter un serveur DNS sur l’hôte du Gateway (joignable via Tailnet).
2. Publier des enregistrements DNS-SD pour `_openclaw-gw._tcp` sous une zone dédiée
   (exemple : `openclaw.internal.`).
3. Configurer le **split DNS** Tailscale afin que le domaine choisi soit résolu via ce
   serveur DNS pour les clients (y compris iOS).

OpenClaw prend en charge n’importe quel domaine de découverte ; `openclaw.internal.` n’est qu’un exemple.
Les Nodes iOS/Android parcourent à la fois `local.` et votre domaine étendu configuré.

### Configuration du Gateway (recommandée)

```json5
{
  gateway: { bind: "tailnet" }, // tailnet uniquement (recommandé)
  discovery: { wideArea: { enabled: true } }, // active la publication DNS-SD étendue
}
```

### Configuration unique du serveur DNS (hôte du Gateway)

```bash
openclaw dns setup --apply
```

Cela installe CoreDNS et le configure pour :

- écouter sur le port 53 uniquement sur les interfaces Tailscale du Gateway
- servir le domaine choisi (exemple : `openclaw.internal.`) depuis `~/.openclaw/dns/<domain>.db`

Validez depuis une machine connectée au tailnet :

```bash
dns-sd -B _openclaw-gw._tcp openclaw.internal.
dig @<TAILNET_IPV4> -p 53 _openclaw-gw._tcp.openclaw.internal PTR +short
```

### Paramètres DNS Tailscale

Dans la console d’administration Tailscale :

- Ajoutez un serveur de noms pointant vers l’IP tailnet du Gateway (UDP/TCP 53).
- Ajoutez un split DNS afin que votre domaine de découverte utilise ce serveur de noms.

Une fois que les clients acceptent le DNS tailnet, les Nodes iOS et la découverte CLI peuvent parcourir
`_openclaw-gw._tcp` dans votre domaine de découverte sans multicast.

### Sécurité de l’écouteur Gateway (recommandée)

Le port WS du Gateway (`18789` par défaut) s’attache par défaut à la boucle locale. Pour un accès LAN/tailnet,
attachez-le explicitement et gardez l’authentification activée.

Pour les configurations tailnet uniquement :

- Définissez `gateway.bind: "tailnet"` dans `~/.openclaw/openclaw.json`.
- Redémarrez le Gateway (ou redémarrez l’application de barre de menus macOS).

## Ce qui publie

Seul le Gateway publie `_openclaw-gw._tcp`. La publicité multicast LAN est
fournie par le Plugin `bonjour` intégré lorsque le Plugin est activé ; la publication
DNS-SD étendue reste possédée par le Gateway.

## Types de service

- `_openclaw-gw._tcp` - balise de transport Gateway (utilisée par les Nodes macOS/iOS/Android).

## Clés TXT (indices non secrets)

Le Gateway publie de petits indices non secrets pour faciliter les flux d’interface :

- `role=gateway`
- `displayName=<friendly name>`
- `lanHost=<hostname>.local`
- `gatewayPort=<port>` (Gateway WS + HTTP)
- `gatewayTls=1` (uniquement lorsque TLS est activé)
- `gatewayTlsSha256=<sha256>` (uniquement lorsque TLS est activé et que l’empreinte est disponible)
- `canvasPort=<port>` (uniquement lorsque l’hôte du canevas est activé ; actuellement identique à `gatewayPort`)
- `transport=gateway`
- `tailnetDns=<magicdns>` (mode mDNS complet uniquement, indice optionnel lorsque Tailnet est disponible)
- `sshPort=<port>` (mode complet uniquement ; omis dans les modes minimal et désactivé)
- `cliPath=<path>` (mode complet uniquement ; omis dans les modes minimal et désactivé)

Notes de sécurité :

- Les enregistrements TXT Bonjour/mDNS sont **non authentifiés**. Les clients ne doivent pas considérer TXT comme un routage faisant autorité.
- Les clients doivent router en utilisant le point de terminaison de service résolu (SRV + A/AAAA). Traitez `lanHost`, `tailnetDns`, `gatewayPort` et `gatewayTlsSha256` uniquement comme des indices.
- Le ciblage automatique SSH doit de même utiliser l’hôte de service résolu, et non des indices uniquement TXT.
- L’épinglage TLS ne doit jamais permettre à un `gatewayTlsSha256` annoncé de remplacer une épingle précédemment stockée.
- Les Nodes iOS/Android doivent traiter les connexions directes basées sur la découverte comme **TLS uniquement** et exiger une confirmation explicite de l’utilisateur avant de faire confiance à une première empreinte.

## Débogage sur macOS

Outils intégrés utiles :

- Parcourir les instances :

  ```bash
  dns-sd -B _openclaw-gw._tcp local.
  ```

- Résoudre une instance (remplacer `<instance>`) :

  ```bash
  dns-sd -L "<instance>" _openclaw-gw._tcp local.
  ```

Si la navigation fonctionne mais que la résolution échoue, vous rencontrez généralement une politique LAN ou
un problème de résolveur mDNS.

## Débogage dans les journaux du Gateway

Le Gateway écrit un fichier journal tournant (affiché au démarrage sous la forme
`gateway log file: ...`). Recherchez les lignes `bonjour:`, en particulier :

- `bonjour: advertise failed ...`
- `bonjour: suppressing ciao cancellation ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`
- `bonjour: watchdog detected non-announced service ...`
- `bonjour: disabling advertiser after ... failed restarts ...`

Le chien de garde traite les états actifs `probing`, `announcing` et les renommages de conflit récents comme
des états en cours. Si le service n’atteint jamais `announced`, OpenClaw recrée finalement
l’annonceur et, après des échecs répétés, désactive Bonjour pour ce
processus Gateway au lieu de republier indéfiniment.

Bonjour utilise le nom d’hôte système pour l’hôte `.local` annoncé lorsqu’il s’agit d’une
étiquette DNS valide. Si le nom d’hôte système contient des espaces, des tirets bas ou un autre
caractère invalide pour une étiquette DNS, OpenClaw se rabat sur `openclaw.local`. Définissez
`OPENCLAW_MDNS_HOSTNAME=<name>` avant de démarrer le Gateway lorsque vous avez besoin d’une
étiquette d’hôte explicite.

## Débogage sur un Node iOS

Le Node iOS utilise `NWBrowser` pour découvrir `_openclaw-gw._tcp`.

Pour capturer les journaux :

- Settings → Gateway → Advanced → **Discovery Debug Logs**
- Settings → Gateway → Advanced → **Discovery Logs** → reproduire → **Copy**

Le journal inclut les transitions d’état du navigateur et les changements d’ensemble de résultats.

## Quand activer Bonjour

Bonjour démarre automatiquement lors du démarrage du Gateway avec configuration vide sur les hôtes macOS, car
l’application locale et les Nodes iOS/Android à proximité s’appuient couramment sur la découverte du même LAN.

Activez Bonjour explicitement lorsque la découverte automatique du même LAN est utile sur Linux,
Windows ou un autre hôte non macOS :

```bash
openclaw plugins enable bonjour
```

Lorsqu’il est activé, Bonjour utilise `discovery.mdns.mode` pour décider de la quantité de métadonnées TXT
à publier. Le même mode contrôle les indices TXT optionnels dans les enregistrements DNS-SD étendus.
Le mode par défaut est `minimal` ; utilisez `full` uniquement lorsque les clients ont besoin des indices `cliPath` ou
`sshPort`. Utilisez `off` pour supprimer le multicast LAN sans modifier l’activation du Plugin ;
le DNS-SD étendu peut toujours publier la balise Gateway minimale lorsque
`discovery.wideArea.enabled` vaut true.

## Quand désactiver Bonjour

Laissez Bonjour désactivé lorsque la publicité multicast LAN est inutile, indisponible
ou nuisible. Les cas courants sont les serveurs non macOS, le réseau en pont Docker,
WSL ou une politique réseau qui supprime le multicast mDNS. Dans ces environnements, le
Gateway reste joignable via son URL publiée, SSH, Tailnet ou le DNS-SD étendu,
mais la découverte automatique LAN n’est pas fiable.

Préférez le remplacement d’environnement existant lorsque le problème est lié au déploiement :

```bash
OPENCLAW_DISABLE_BONJOUR=1
```

Cela désactive la publicité multicast LAN sans modifier la configuration du Plugin.
C’est sûr pour les images Docker, les fichiers de service, les scripts de lancement et le
débogage ponctuel, car le réglage disparaît lorsque l’environnement disparaît.

Utilisez la configuration du Plugin lorsque vous souhaitez intentionnellement désactiver le Plugin de découverte LAN
intégré pour cette configuration OpenClaw :

```bash
openclaw plugins disable bonjour
```

## Pièges Docker

Le Plugin Bonjour intégré désactive automatiquement la publicité multicast LAN dans les
conteneurs détectés lorsque `OPENCLAW_DISABLE_BONJOUR` n’est pas défini. Les réseaux en pont Docker
ne transmettent généralement pas le multicast mDNS (`224.0.0.251:5353`) entre le conteneur
et le LAN, donc publier depuis le conteneur rend rarement la découverte fonctionnelle.

Pièges importants :

- Bonjour démarre automatiquement sur les hôtes macOS et est optionnel ailleurs. Le laisser
  désactivé n’arrête pas le Gateway ; cela ignore uniquement la publicité multicast LAN.
- Désactiver Bonjour ne modifie pas `gateway.bind` ; Docker utilise toujours par défaut
  `OPENCLAW_GATEWAY_BIND=lan` afin que le port hôte publié puisse fonctionner.
- Désactiver Bonjour ne désactive pas le DNS-SD étendu. Utilisez la découverte étendue
  ou Tailnet lorsque le Gateway et le Node ne sont pas sur le même LAN.
- Réutiliser le même `OPENCLAW_CONFIG_DIR` hors de Docker ne persiste pas la
  politique de désactivation automatique du conteneur.
- Définissez `OPENCLAW_DISABLE_BONJOUR=0` uniquement pour le réseau hôte, macvlan ou un autre
  réseau où le multicast mDNS est connu pour passer ; définissez-le sur `1` pour forcer la désactivation.

## Dépannage de Bonjour désactivé

Si un Node ne découvre plus automatiquement le Gateway après la configuration Docker :

1. Confirmez si le Gateway s’exécute en mode automatique, forcé activé ou forcé désactivé :

   ```bash
   docker compose config | grep OPENCLAW_DISABLE_BONJOUR
   ```

2. Confirmez que le Gateway lui-même est joignable via le port publié :

   ```bash
   curl -fsS http://127.0.0.1:18789/healthz
   ```

3. Utilisez une cible directe lorsque Bonjour est désactivé :
   - Interface de contrôle ou outils locaux : `http://127.0.0.1:18789`
   - Clients LAN : `http://<gateway-host>:18789`
   - Clients entre réseaux : MagicDNS Tailnet, IP Tailnet, tunnel SSH ou
     DNS-SD étendu

4. Si vous avez délibérément activé le Plugin Bonjour dans Docker et forcé la publicité
   avec `OPENCLAW_DISABLE_BONJOUR=0`, testez le multicast depuis l’hôte :

   ```bash
   dns-sd -B _openclaw-gw._tcp local.
   ```

   Si la navigation est vide ou si les journaux du Gateway affichent des annulations répétées du chien de garde ciao,
   restaurez `OPENCLAW_DISABLE_BONJOUR=1` et utilisez une route directe ou
   Tailnet.

## Modes de défaillance courants

- **Bonjour ne traverse pas les réseaux** : utilisez Tailnet ou SSH.
- **Multicast bloqué** : certains réseaux Wi-Fi désactivent mDNS.
- **Annonceur bloqué en probing/announcing** : les hôtes avec multicast bloqué,
  les ponts de conteneurs, WSL ou les changements d’interface peuvent laisser l’annonceur ciao dans un
  état non annoncé. OpenClaw réessaie quelques fois puis désactive Bonjour
  pour le processus Gateway actuel au lieu de redémarrer l’annonceur indéfiniment.
- **Réseau en pont Docker** : Bonjour se désactive automatiquement dans les conteneurs détectés.
  Définissez `OPENCLAW_DISABLE_BONJOUR=0` uniquement pour l’hôte, macvlan ou un autre
  réseau compatible mDNS.
- **Veille / changements d’interface** : macOS peut temporairement perdre les résultats mDNS ; réessayez.
- **La navigation fonctionne mais la résolution échoue** : gardez des noms de machine simples (évitez les emojis ou
  la ponctuation), puis redémarrez le Gateway. Le nom d’instance de service dérive du
  nom d’hôte, donc des noms trop complexes peuvent perturber certains résolveurs.

## Noms d’instance échappés (`\032`)

Bonjour/DNS-SD échappe souvent les octets dans les noms d’instance de service sous forme de séquences décimales `\DDD`
(par exemple, les espaces deviennent `\032`).

- C’est normal au niveau du protocole.
- Les interfaces doivent décoder pour l’affichage (iOS utilise `BonjourEscapes.decode`).

## Activation / désactivation / configuration

- Les hôtes macOS démarrent automatiquement le Plugin de découverte du réseau local fourni par défaut.
- `openclaw plugins enable bonjour` active le Plugin de découverte du réseau local fourni sur les hôtes où il n’est pas activé par défaut.
- `openclaw plugins disable bonjour` désactive l’annonce multicast sur le réseau local en désactivant le Plugin fourni.
- `OPENCLAW_DISABLE_BONJOUR=1` désactive l’annonce multicast sur le réseau local sans modifier la configuration du Plugin ; les valeurs véridiques acceptées sont `1`, `true`, `yes` et `on` (ancien : `OPENCLAW_DISABLE_BONJOUR`).
- `OPENCLAW_DISABLE_BONJOUR=0` force l’activation de l’annonce multicast sur le réseau local, y compris dans les conteneurs détectés ; les valeurs fausses acceptées sont `0`, `false`, `no` et `off`.
- Lorsque le Plugin Bonjour est activé et que `OPENCLAW_DISABLE_BONJOUR` n’est pas défini, Bonjour annonce sur les hôtes normaux et se désactive automatiquement dans les conteneurs détectés.
- `gateway.bind` dans `~/.openclaw/openclaw.json` contrôle le mode de liaison du Gateway.
- `OPENCLAW_SSH_PORT` remplace le port SSH lorsque `sshPort` est annoncé (ancien : `OPENCLAW_SSH_PORT`).
- `OPENCLAW_TAILNET_DNS` publie un indice MagicDNS dans TXT lorsque le mode complet mDNS est activé (ancien : `OPENCLAW_TAILNET_DNS`).
- `OPENCLAW_CLI_PATH` remplace le chemin CLI annoncé (ancien : `OPENCLAW_CLI_PATH`).

## Documentation associée

- Politique de découverte et sélection du transport : [Découverte](/fr/gateway/discovery)
- Appairage des Nodes + approbations : [Appairage du Gateway](/fr/gateway/pairing)
