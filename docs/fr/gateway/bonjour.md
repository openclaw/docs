---
read_when:
    - Résolution des problèmes de découverte Bonjour sous macOS/iOS
    - Modification des types de services mDNS, des enregistrements TXT ou de l’expérience utilisateur de découverte
summary: Découverte Bonjour/mDNS et débogage (balises du Gateway, clients et modes de défaillance courants)
title: Découverte Bonjour
x-i18n:
    generated_at: "2026-07-12T02:33:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c0526c9e20dd02d143ae7aa4c8e1e6830763763e95c9a74c4d73332c5e5e155e
    source_path: gateway/bonjour.md
    workflow: 16
---

OpenClaw peut utiliser Bonjour (mDNS/DNS-SD) pour découvrir un Gateway actif (point de terminaison WebSocket). La recherche multicast `local.` est une **fonction pratique limitée au LAN** : le plugin `bonjour` intégré gère l’annonce sur le LAN, avec un démarrage automatique sur les hôtes macOS et une activation explicite sous Linux, Windows et dans les déploiements conteneurisés du Gateway. La même balise peut également être publiée via un domaine DNS-SD étendu configuré afin de permettre la découverte entre réseaux. La découverte fonctionne au mieux et ne remplace **pas** la connectivité basée sur SSH ou le Tailnet.

## Bonjour étendu (DNS-SD unicast) via Tailscale

Si le Node et le Gateway se trouvent sur des réseaux différents, le mDNS multicast ne peut pas franchir cette limite. Conservez la même expérience de découverte en passant au **DNS-SD unicast** (« Bonjour étendu ») via Tailscale :

1. Exécutez un serveur DNS sur l’hôte du Gateway, accessible via le Tailnet.
2. Publiez les enregistrements DNS-SD de `_openclaw-gw._tcp` sous une zone dédiée (exemple : `openclaw.internal.`).
3. Configurez le **DNS fractionné** de Tailscale afin que le domaine choisi soit résolu par ce serveur DNS pour les clients, notamment iOS.

Le domaine `openclaw.internal.` ci-dessus n’est qu’un exemple : OpenClaw prend en charge n’importe quel domaine de découverte. Les Nodes iOS/Android recherchent à la fois dans `local.` et dans votre domaine étendu configuré.

### Configuration du Gateway

```json5
{
  gateway: { bind: "tailnet" }, // tailnet uniquement (recommandé)
  discovery: { wideArea: { enabled: true, domain: "openclaw.internal" } },
}
```

Lorsque `discovery.wideArea.domain` n’est pas défini, la variable d’environnement `OPENCLAW_WIDE_AREA_DOMAIN` peut également servir de valeur de repli.

### Configuration initiale du serveur DNS (hôte du Gateway, macOS uniquement)

```bash
openclaw dns setup --apply
```

Cette commande est réservée à macOS et nécessite Homebrew ainsi qu’une connexion Tailscale active. Elle installe CoreDNS (`brew install coredns`) et le configure pour :

- écouter sur le port 53 uniquement sur les interfaces Tailscale du Gateway ;
- desservir le domaine choisi (exemple : `openclaw.internal.`) depuis `~/.openclaw/dns/<domain>.db`.

Exécutez-la d’abord sans `--apply` pour prévisualiser le plan (domaine, chemin du fichier de zone, adresse IP Tailnet détectée, configuration recommandée) sans rien installer.

Validez depuis une machine connectée au Tailnet :

```bash
dns-sd -B _openclaw-gw._tcp openclaw.internal.
dig @<TAILNET_IPV4> -p 53 _openclaw-gw._tcp.openclaw.internal PTR +short
```

### Paramètres DNS de Tailscale

Dans la console d’administration Tailscale :

- Ajoutez un serveur de noms pointant vers l’adresse IP Tailnet du Gateway (UDP/TCP 53).
- Ajoutez un DNS fractionné afin que votre domaine de découverte utilise ce serveur de noms.

Une fois le DNS Tailnet accepté par les clients, les Nodes iOS et la découverte via la CLI peuvent rechercher `_openclaw-gw._tcp` dans votre domaine de découverte sans multicast.

### Sécurité de l’écouteur du Gateway

Le port WS du Gateway (`18789` par défaut) est lié à local loopback par défaut. Pour un accès par LAN/Tailnet, définissez explicitement la liaison et maintenez l’authentification activée. Pour les configurations limitées au Tailnet, définissez `gateway.bind: "tailnet"` dans `~/.openclaw/openclaw.json`, puis redémarrez le Gateway (ou l’application de barre de menus macOS).

## Éléments annoncés

Seul le Gateway annonce `_openclaw-gw._tcp`. L’annonce multicast sur le LAN provient du plugin `bonjour` intégré lorsqu’il est activé ; la publication DNS-SD étendue reste gérée par le Gateway.

## Types de services

- `_openclaw-gw._tcp` - balise de transport du Gateway, utilisée par les Nodes macOS/iOS/Android.

## Clés TXT (indications non secrètes)

| Clé                           | Condition de présence                                                                  |
| ----------------------------- | -------------------------------------------------------------------------------------- |
| `role=gateway`                | Toujours.                                                                              |
| `displayName=<friendly name>` | Toujours.                                                                              |
| `lanHost=<hostname>.local`    | Toujours.                                                                              |
| `gatewayPort=<port>`          | Toujours (WS + HTTP du Gateway).                                                       |
| `transport=gateway`           | Toujours.                                                                              |
| `gatewayTls=1`                | Uniquement lorsque TLS est activé.                                                     |
| `gatewayTlsSha256=<sha256>`   | Uniquement lorsque TLS est activé et qu’une empreinte est disponible.                  |
| `gatewayDirectReachable=1`    | Uniquement lorsque le Gateway est directement accessible (et non uniquement via un relais ou un proxy). |
| `canvasPort=<port>`           | Uniquement lorsque l’hôte du canevas est activé ; actuellement identique à `gatewayPort`. |
| `tailnetDns=<magicdns>`       | Mode mDNS complet uniquement ; indication facultative lorsque le Tailnet est disponible. |
| `sshPort=<port>`              | Mode complet uniquement ; omis dans les modes minimal et désactivé.                    |
| `cliPath=<path>`              | Mode complet uniquement ; omis dans les modes minimal et désactivé.                    |

Remarques de sécurité :

- Les enregistrements TXT Bonjour/mDNS ne sont **pas authentifiés**. Les clients ne doivent pas considérer les données TXT comme une source de routage faisant autorité.
- Les clients doivent effectuer le routage à l’aide du point de terminaison de service résolu (SRV + A/AAAA). Considérez `lanHost`, `tailnetDns`, `gatewayPort` et `gatewayTlsSha256` uniquement comme des indications.
- Le ciblage SSH automatique doit également utiliser l’hôte de service résolu, et non uniquement les indications TXT.
- L’épinglage TLS ne doit jamais permettre à une valeur `gatewayTlsSha256` annoncée de remplacer une empreinte précédemment enregistrée.
- Les Nodes iOS/Android doivent considérer les connexions directes basées sur la découverte comme **réservées à TLS** et exiger une confirmation explicite de l’utilisateur avant d’approuver une empreinte rencontrée pour la première fois.

## Débogage sous macOS

Outils intégrés :

```bash
# Parcourir les instances
dns-sd -B _openclaw-gw._tcp local.

# Résoudre une instance (remplacer <instance>)
dns-sd -L "<instance>" _openclaw-gw._tcp local.
```

Si la recherche fonctionne, mais que la résolution échoue, le problème provient généralement d’une politique LAN ou du résolveur mDNS.

## Débogage dans les journaux du Gateway

Le Gateway écrit un fichier journal rotatif (affiché au démarrage sous la forme `gateway log file: ...`). Recherchez les lignes `bonjour:`, en particulier :

- `bonjour: advertise failed ...`
- `bonjour: suppressing ciao cancellation ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`
- `bonjour: watchdog detected non-announced service ...`
- `bonjour: disabling advertiser after ... failed restarts ...`

Le mécanisme de surveillance considère les états actifs `probing`, `announcing` ainsi que les renommages récents dus à des conflits comme des opérations en cours. Si le service n’atteint jamais l’état `announced`, OpenClaw recrée l’annonceur et, après plusieurs échecs, désactive Bonjour pour ce processus du Gateway au lieu de tenter indéfiniment de nouvelles annonces.

Bonjour utilise le nom d’hôte système pour l’hôte `.local` annoncé lorsqu’il constitue une étiquette DNS valide. Si le nom d’hôte système contient des espaces, des traits de soulignement ou tout autre caractère non valide dans une étiquette DNS, OpenClaw utilise `openclaw.local` comme valeur de repli. Définissez `OPENCLAW_MDNS_HOSTNAME=<name>` avant de démarrer le Gateway lorsqu’une étiquette d’hôte explicite est nécessaire.

## Débogage sur un Node iOS

Le Node iOS utilise `NWBrowser` pour découvrir `_openclaw-gw._tcp`.

Pour recueillir les journaux : Settings -> Gateway -> Advanced -> **Discovery Debug Logs**, puis Settings -> Gateway -> Advanced -> **Discovery Logs** -> reproduisez le problème -> **Copy**. Le journal contient les transitions d’état du navigateur et les modifications de l’ensemble de résultats.

## Quand activer Bonjour

Bonjour démarre automatiquement lorsque le Gateway est lancé avec une configuration vide sur les hôtes macOS, car l’application locale et les Nodes iOS/Android à proximité dépendent couramment de la découverte sur le même LAN.

Activez-le explicitement lorsque la découverte automatique sur le même LAN est utile sous Linux, Windows ou sur un autre hôte non-macOS :

```bash
openclaw plugins enable bonjour
```

Lorsqu’il est activé, Bonjour utilise `discovery.mdns.mode` pour déterminer la quantité de métadonnées TXT à publier ; le même mode contrôle les indications TXT facultatives dans les enregistrements DNS-SD étendus. Modes :

| Mode                | Comportement                                                                                                                                                   |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimal` (par défaut) | Uniquement les clés TXT principales ; omet `sshPort`, `cliPath`, `tailnetDns`.                                                                               |
| `full`              | Ajoute `sshPort`, `cliPath`, `tailnetDns` — à utiliser lorsque les clients ont besoin de ces indications.                                                     |
| `off`               | Supprime le multicast LAN sans modifier l’activation du plugin ; le DNS-SD étendu peut toujours publier la balise minimale lorsque `discovery.wideArea.enabled` vaut `true`. |

## Quand désactiver Bonjour

Laissez Bonjour désactivé lorsque l’annonce multicast sur le LAN est inutile, indisponible ou nuisible — cas fréquents : serveurs non-macOS, réseau en pont Docker, WSL ou politique réseau bloquant le multicast mDNS. Le Gateway reste accessible via son URL publiée, SSH, le Tailnet ou le DNS-SD étendu ; seule la découverte automatique sur le LAN manque de fiabilité.

Utilisez la surcharge par variable d’environnement pour les problèmes propres à un déploiement (adaptée aux images Docker, fichiers de service, scripts de lancement et débogages ponctuels — elle disparaît avec l’environnement) :

```bash
OPENCLAW_DISABLE_BONJOUR=1
```

Utilisez la configuration du plugin lorsque vous souhaitez intentionnellement désactiver le plugin intégré de découverte sur le LAN pour cette configuration OpenClaw :

```bash
openclaw plugins disable bonjour
```

## Pièges liés à Docker

Le plugin Bonjour intégré désactive automatiquement l’annonce multicast sur le LAN dans les conteneurs détectés lorsque `OPENCLAW_DISABLE_BONJOUR` n’est pas défini. Les réseaux en pont Docker ne transmettent généralement pas le multicast mDNS (`224.0.0.251:5353`) entre le conteneur et le LAN ; une annonce provenant du conteneur permet donc rarement à la découverte de fonctionner.

Pièges :

- Bonjour démarre automatiquement sur les hôtes macOS et doit être activé explicitement ailleurs. Le laisser désactivé n’arrête pas le Gateway : seule l’annonce multicast sur le LAN est ignorée.
- La désactivation de Bonjour ne modifie pas `gateway.bind` ; Docker utilise toujours `OPENCLAW_GATEWAY_BIND=lan` par défaut afin que le port publié sur l’hôte fonctionne.
- La désactivation de Bonjour ne désactive pas le DNS-SD étendu. Utilisez la découverte étendue ou le Tailnet lorsque le Gateway et le Node ne se trouvent pas sur le même LAN.
- La réutilisation du même `OPENCLAW_CONFIG_DIR` en dehors de Docker ne conserve pas la politique de désactivation automatique du conteneur.
- Définissez `OPENCLAW_DISABLE_BONJOUR=0` uniquement pour le réseau de l’hôte, macvlan ou un autre réseau dont on sait qu’il transmet le multicast mDNS ; définissez-le sur `1` pour forcer la désactivation.

## Dépannage d’un Bonjour désactivé

Si un Node ne découvre plus automatiquement le Gateway après la configuration de Docker :

1. Vérifiez si le Gateway s’exécute en mode automatique, forcé ou désactivé de force :

   ```bash
   docker compose config | grep OPENCLAW_DISABLE_BONJOUR
   ```

2. Vérifiez que le Gateway lui-même est accessible via le port publié :

   ```bash
   curl -fsS http://127.0.0.1:18789/healthz
   ```

3. Utilisez une cible directe lorsque Bonjour est désactivé :
   - Interface de contrôle ou outils locaux : `http://127.0.0.1:18789`
   - Clients LAN : `http://<gateway-host>:18789`
   - Clients inter-réseaux : MagicDNS du Tailnet, adresse IP Tailnet, tunnel SSH ou DNS-SD étendu

4. Si vous avez délibérément activé le plugin Bonjour dans Docker et forcé l’annonce avec `OPENCLAW_DISABLE_BONJOUR=0`, testez le multicast depuis l’hôte :

   ```bash
   dns-sd -B _openclaw-gw._tcp local.
   ```

   Si la recherche ne renvoie aucun résultat, ou si les journaux du Gateway montrent des annulations répétées par le mécanisme de surveillance de ciao, rétablissez `OPENCLAW_DISABLE_BONJOUR=1` et utilisez une route directe ou Tailnet.

## Modes de défaillance courants

- **Bonjour ne traverse pas les réseaux** : utilisez le Tailnet ou SSH.
- **Multidiffusion bloquée** : certains réseaux Wi-Fi désactivent mDNS.
- **Annonceur bloqué en phase de détection/annonce** : les hôtes sur lesquels la multidiffusion est bloquée, les ponts de conteneurs, WSL ou les changements fréquents d’interface peuvent laisser l’annonceur ciao dans un état non annoncé. OpenClaw effectue quelques nouvelles tentatives, puis désactive Bonjour pour le processus Gateway actuel au lieu de redémarrer indéfiniment l’annonceur.
- **Réseau en pont Docker** : Bonjour se désactive automatiquement dans les conteneurs détectés. Définissez `OPENCLAW_DISABLE_BONJOUR=0` uniquement pour un réseau hôte, macvlan ou un autre réseau compatible avec mDNS.
- **Mise en veille/changements d’interface** : macOS peut temporairement perdre les résultats mDNS ; réessayez.
- **La navigation fonctionne, mais la résolution échoue** : utilisez des noms de machine simples (évitez les émojis et la ponctuation), puis redémarrez le Gateway. Le nom d’instance du service est dérivé du nom d’hôte ; des noms trop complexes peuvent donc perturber certains résolveurs.

## Noms d’instance échappés (`\032`)

Bonjour/DNS-SD échappe souvent les octets des noms d’instance de service sous forme de séquences décimales `\DDD` (les espaces deviennent `\032`). Ce comportement est normal au niveau du protocole ; les interfaces utilisateur doivent les décoder pour l’affichage (iOS utilise `BonjourEscapes.decode`).

## Activation, désactivation et configuration

| Paramètre                                            | Effet                                                                                                         |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `openclaw plugins enable bonjour`                    | Active le plugin de découverte LAN intégré sur les hôtes où il n’est pas activé par défaut.                  |
| `openclaw plugins disable bonjour`                   | Désactive l’annonce par multidiffusion sur le LAN en désactivant le plugin intégré.                           |
| `OPENCLAW_DISABLE_BONJOUR=1` (ou `true`/`yes`/`on`)  | Désactive l’annonce par multidiffusion sur le LAN sans modifier la configuration du plugin.                   |
| `OPENCLAW_DISABLE_BONJOUR=0` (ou `false`/`no`/`off`) | Force l’activation de l’annonce par multidiffusion sur le LAN, y compris dans les conteneurs détectés.         |
| `discovery.mdns.mode`                                | `off` \| `minimal` (par défaut) \| `full` — consultez les modes ci-dessus.                                   |
| `gateway.bind`                                       | Contrôle le mode de liaison du Gateway dans `~/.openclaw/openclaw.json`.                                      |
| `OPENCLAW_SSH_PORT`                                  | Remplace le port SSH lorsque `sshPort` est annoncé (mode complet).                                            |
| `OPENCLAW_TAILNET_DNS`                               | Publie une indication MagicDNS dans TXT lorsque le mode mDNS complet est activé.                              |
| `OPENCLAW_CLI_PATH`                                  | Remplace le chemin de la CLI annoncé (mode complet).                                                          |

Par défaut, les hôtes macOS démarrent automatiquement le plugin de découverte LAN intégré. Lorsque le plugin Bonjour est activé et que `OPENCLAW_DISABLE_BONJOUR` n’est pas défini, Bonjour diffuse des annonces sur les hôtes ordinaires et se désactive automatiquement dans les conteneurs détectés (Docker, machines Fly.io et environnements d’exécution de conteneurs courants).

## Documentation associée

- Politique de découverte et sélection du transport : [Découverte](/fr/gateway/discovery)
- Appairage des Node et approbations : [Appairage du Gateway](/fr/gateway/pairing)
