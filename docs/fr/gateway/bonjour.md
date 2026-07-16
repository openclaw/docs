---
read_when:
    - Débogage des problèmes de découverte Bonjour sur macOS/iOS
    - Modification des types de services mDNS, des enregistrements TXT ou de l’expérience utilisateur de découverte
summary: Découverte Bonjour/mDNS et débogage (balises du Gateway, clients et modes de défaillance courants)
title: Découverte de Bonjour
x-i18n:
    generated_at: "2026-07-16T13:18:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 42a46dc34e94dc86ee0432b12fcb59b3855371c745d79825a00aa557e1369160
    source_path: gateway/bonjour.md
    workflow: 16
---

OpenClaw peut utiliser Bonjour (mDNS/DNS-SD) pour découvrir un Gateway actif (point de terminaison WebSocket). La recherche multicast `local.` est une **fonction pratique limitée au LAN** : le plugin `bonjour` intégré gère l’annonce sur le LAN, avec un démarrage automatique sur les hôtes macOS et une activation facultative sous Linux, Windows et dans les déploiements de Gateway conteneurisés. La même balise peut également être publiée via un domaine DNS-SD étendu configuré pour permettre la découverte entre réseaux. La découverte fonctionne au mieux et ne remplace **pas** la connectivité par SSH ou Tailnet.

## Bonjour étendu (DNS-SD unicast) sur Tailscale

Si le Node et le Gateway se trouvent sur des réseaux différents, le mDNS multicast ne peut pas franchir cette limite. Conservez la même expérience de découverte en passant au **DNS-SD unicast** (« Bonjour étendu ») sur Tailscale :

1. Exécutez un serveur DNS sur l’hôte du Gateway, accessible via le Tailnet.
2. Publiez les enregistrements DNS-SD pour `_openclaw-gw._tcp` sous une zone dédiée (exemple : `openclaw.internal.`).
3. Configurez le **DNS fractionné** de Tailscale afin que le domaine choisi soit résolu pour les clients, y compris iOS, par ce serveur DNS.

Le domaine `openclaw.internal.` ci-dessus n’est qu’un exemple — OpenClaw prend en charge n’importe quel domaine de découverte. Les Nodes iOS/Android recherchent à la fois `local.` et votre domaine étendu configuré.

### Configuration du Gateway

```json5
{
  gateway: { bind: "tailnet" }, // Tailnet uniquement (recommandé)
  discovery: { wideArea: { enabled: true, domain: "openclaw.internal" } },
}
```

`discovery.wideArea.domain` accepte également la variable d’environnement `OPENCLAW_WIDE_AREA_DOMAIN` comme solution de repli lorsqu’aucune valeur n’est définie.

### Configuration ponctuelle du serveur DNS (hôte du Gateway, macOS uniquement)

```bash
openclaw dns setup --apply
```

Cette commande est réservée à macOS et nécessite Homebrew ainsi qu’une connexion Tailscale active. Elle installe CoreDNS (`brew install coredns`) et le configure pour :

- écouter sur le port 53 uniquement sur les interfaces Tailscale du Gateway
- servir le domaine choisi (exemple : `openclaw.internal.`) depuis `~/.openclaw/dns/<domain>.db`

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

Une fois le DNS du Tailnet accepté par les clients, les Nodes iOS et la découverte par CLI peuvent rechercher `_openclaw-gw._tcp` dans votre domaine de découverte sans multicast.

### Sécurité du processus d’écoute du Gateway

Le port WS du Gateway (`18789` par défaut) se lie par défaut à l’interface de bouclage. Pour un accès par LAN ou Tailnet, configurez explicitement la liaison et maintenez l’authentification activée. Pour les configurations limitées au Tailnet, définissez `gateway.bind: "tailnet"` dans `~/.openclaw/openclaw.json` et redémarrez le Gateway (ou l’application de barre des menus macOS).

## Éléments annoncés

Seul le Gateway annonce `_openclaw-gw._tcp`. Lorsqu’elle est activée, l’annonce multicast sur le LAN provient du plugin `bonjour` intégré ; la publication DNS-SD étendue reste gérée par le Gateway.

## Types de services

- `_openclaw-gw._tcp` - balise de transport du Gateway, utilisée par les Nodes macOS/iOS/Android.

## Clés TXT (indications non secrètes)

| Clé                           | Condition de présence                                                            |
| ----------------------------- | -------------------------------------------------------------------------------- |
| `role=gateway`                | Toujours.                                                                        |
| `displayName=<friendly name>` | Toujours.                                                                        |
| `lanHost=<hostname>.local`    | Toujours.                                                                        |
| `gatewayPort=<port>`          | Toujours (WS + HTTP du Gateway).                                                  |
| `transport=gateway`           | Toujours.                                                                        |
| `gatewayTls=1`                | Uniquement lorsque TLS est activé.                                               |
| `gatewayTlsSha256=<sha256>`   | Uniquement lorsque TLS est activé et qu’une empreinte est disponible.             |
| `gatewayDirectReachable=1`    | Uniquement lorsque le Gateway est directement accessible (et non uniquement via un relais/proxy). |
| `canvasPort=<port>`           | Uniquement lorsque l’hôte du canevas est activé ; actuellement identique à `gatewayPort`. |
| `tailnetDns=<magicdns>`       | Mode mDNS complet uniquement ; indication facultative lorsque Tailnet est disponible. |
| `sshPort=<port>`              | Mode complet uniquement ; omis dans les modes minimal et désactivé.              |
| `cliPath=<path>`              | Mode complet uniquement ; omis dans les modes minimal et désactivé.              |

Remarques de sécurité :

- Les enregistrements TXT Bonjour/mDNS sont **non authentifiés**. Les clients ne doivent pas considérer les données TXT comme une source de routage faisant autorité.
- Les clients doivent effectuer le routage à l’aide du point de terminaison de service résolu (SRV + A/AAAA). Considérez `lanHost`, `tailnetDns`, `gatewayPort` et `gatewayTlsSha256` comme de simples indications.
- Le ciblage SSH automatique doit également utiliser l’hôte de service résolu, et non des indications provenant uniquement des données TXT.
- L’épinglage TLS ne doit jamais permettre à une valeur `gatewayTlsSha256` annoncée de remplacer une épingle précédemment enregistrée.
- Les Nodes iOS/Android doivent considérer les connexions directes fondées sur la découverte comme **limitées à TLS** et exiger une confirmation explicite de l’utilisateur avant d’approuver une empreinte rencontrée pour la première fois.

## Débogage sous macOS

Outils intégrés :

```bash
# Rechercher les instances
dns-sd -B _openclaw-gw._tcp local.

# Résoudre une instance (remplacez <instance>)
dns-sd -L "<instance>" _openclaw-gw._tcp local.
```

Si la recherche fonctionne, mais que la résolution échoue, il s’agit généralement d’un problème de stratégie du LAN ou du résolveur mDNS.

## Débogage dans les journaux du Gateway

Le Gateway écrit dans un fichier journal avec rotation (affiché au démarrage sous la forme `gateway log file: ...`). Recherchez les lignes `bonjour:`, en particulier :

- `bonjour: advertise failed ...`
- `bonjour: suppressing ciao netmask assertion ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`

OpenClaw démarre chaque service Bonjour une seule fois et confie au répondeur mDNS la détection, les nouvelles tentatives, la résolution des conflits de noms et la republication lors des changements d’interface. Cela évite le chevauchement des tentatives de publication pendant les fluctuations normales du réseau. Les messages internes répétés d’auto-détection sont supprimés afin qu’ils ne puissent pas saturer le journal du Gateway.

Lorsque plusieurs Gateways OpenClaw effectuent des annonces depuis le même hôte, Bonjour peut ajouter des suffixes tels que `(2)` ou `(3)` afin de préserver l’unicité des noms d’instances de service. Ces suffixes correspondent à une résolution normale des conflits et n’indiquent pas une supervision OCM en double.

Bonjour utilise le nom d’hôte du système pour l’hôte `.local` annoncé lorsqu’il s’agit d’une étiquette DNS valide. Si le nom d’hôte du système contient des espaces, des traits de soulignement ou un autre caractère non valide dans une étiquette DNS, OpenClaw utilise `openclaw.local` comme solution de repli. Définissez `OPENCLAW_MDNS_HOSTNAME=<name>` avant de démarrer le Gateway lorsqu’une étiquette d’hôte explicite est nécessaire.

## Débogage sur un Node iOS

Le Node iOS utilise `NWBrowser` pour découvrir `_openclaw-gw._tcp`.

Pour capturer les journaux : Settings -> Gateway -> Advanced -> **Discovery Debug Logs**, puis Settings -> Gateway -> Advanced -> **Discovery Logs** -> reproduisez le problème -> **Copy**. Le journal inclut les transitions d’état du navigateur et les modifications de l’ensemble de résultats.

## Quand activer Bonjour

Bonjour démarre automatiquement lors du démarrage d’un Gateway avec une configuration vide sur les hôtes macOS, car l’application locale et les Nodes iOS/Android à proximité reposent généralement sur la découverte sur le même LAN.

Activez-le explicitement lorsque la découverte automatique sur le même LAN est utile sous Linux, Windows ou sur un autre hôte non-macOS :

```bash
openclaw plugins enable bonjour
```

Lorsqu’il est activé, Bonjour utilise `discovery.mdns.mode` pour déterminer la quantité de métadonnées TXT à publier ; le même mode contrôle les indications TXT facultatives dans les enregistrements DNS-SD étendus. Modes :

| Mode                | Comportement                                                                                                                                                  |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimal` (par défaut) | Clés TXT principales uniquement ; omet `sshPort`, `cliPath`, `tailnetDns`.                                                                                              |
| `full`              | Ajoute `sshPort`, `cliPath`, `tailnetDns` — à utiliser lorsque les clients ont besoin de ces indications.                                                                 |
| `off`               | Supprime le multicast sur le LAN sans modifier l’activation du plugin ; le DNS-SD étendu peut toujours publier la balise minimale lorsque `discovery.wideArea.enabled` vaut true. |

## Quand désactiver Bonjour

Laissez Bonjour désactivé lorsque l’annonce multicast sur le LAN est inutile, indisponible ou nuisible — les cas courants incluent les serveurs non-macOS, les réseaux en pont Docker, WSL ou une stratégie réseau qui bloque le multicast mDNS. Le Gateway reste accessible par son URL publiée, SSH, Tailnet ou le DNS-SD étendu ; seule la découverte automatique sur le LAN est peu fiable.

Utilisez le remplacement par variable d’environnement pour les problèmes propres à un déploiement (sans risque pour les images Docker, fichiers de service, scripts de lancement et débogages ponctuels — il disparaît avec l’environnement) :

```bash
OPENCLAW_DISABLE_BONJOUR=1
```

Utilisez la configuration du plugin lorsque vous souhaitez délibérément désactiver le plugin de découverte sur le LAN intégré pour cette configuration OpenClaw :

```bash
openclaw plugins disable bonjour
```

## Pièges liés à Docker

Le plugin Bonjour intégré désactive automatiquement l’annonce multicast sur le LAN dans les conteneurs détectés lorsque `OPENCLAW_DISABLE_BONJOUR` n’est pas défini. Les réseaux en pont Docker ne transmettent généralement pas le multicast mDNS (`224.0.0.251:5353`) entre le conteneur et le LAN ; une annonce depuis le conteneur permet donc rarement à la découverte de fonctionner.

Pièges :

- Bonjour démarre automatiquement sur les hôtes macOS et doit être activé explicitement ailleurs. Le laisser désactivé n’arrête pas le Gateway — seule l’annonce multicast sur le LAN est ignorée.
- La désactivation de Bonjour ne modifie pas `gateway.bind` ; Docker utilise toujours `OPENCLAW_GATEWAY_BIND=lan` par défaut afin que le port publié de l’hôte fonctionne.
- La désactivation de Bonjour ne désactive pas le DNS-SD étendu. Utilisez la découverte étendue ou Tailnet lorsque le Gateway et le Node ne se trouvent pas sur le même LAN.
- La réutilisation du même `OPENCLAW_CONFIG_DIR` en dehors de Docker ne conserve pas la stratégie de désactivation automatique du conteneur.
- Définissez `OPENCLAW_DISABLE_BONJOUR=0` uniquement pour un réseau hôte, macvlan ou un autre réseau dont on sait qu’il transmet le multicast mDNS ; définissez-le sur `1` pour forcer la désactivation.

## Résolution des problèmes lorsque Bonjour est désactivé

Si un Node ne découvre plus automatiquement le Gateway après la configuration de Docker :

1. Vérifiez si le Gateway s’exécute en mode automatique, activé de force ou désactivé de force :

   ```bash
   docker compose config | grep OPENCLAW_DISABLE_BONJOUR
   ```

2. Vérifiez que le Gateway lui-même est accessible par le port publié :

   ```bash
   curl -fsS http://127.0.0.1:18789/healthz
   ```

3. Utilisez une cible directe lorsque Bonjour est désactivé :
   - Interface de contrôle ou outils locaux : `http://127.0.0.1:18789`
   - Clients du LAN : `http://<gateway-host>:18789`
   - Clients interréseaux : MagicDNS du Tailnet, adresse IP Tailnet, tunnel SSH ou DNS-SD étendu

4. Si vous avez délibérément activé le plugin Bonjour dans Docker et forcé les annonces avec `OPENCLAW_DISABLE_BONJOUR=0`, testez le multicast depuis l’hôte :

   ```bash
   dns-sd -B _openclaw-gw._tcp local.
   ```

   Si la recherche ne renvoie aucun résultat ou si les journaux du Gateway affichent des échecs répétés de détection ciao, restaurez `OPENCLAW_DISABLE_BONJOUR=1` et utilisez une route directe ou Tailnet.

## Modes de défaillance courants

- **Bonjour ne traverse pas les réseaux** : utilisez Tailnet ou SSH.
- **Multicast bloqué** : certains réseaux Wi-Fi désactivent mDNS.
- **Annonceur bloqué en phase de sondage/d’annonce** : les hôtes où le multicast est bloqué, les ponts de conteneurs, WSL ou les changements fréquents d’interface peuvent laisser le répondeur dans un état non annoncé. Le Gateway reste accessible par des routes directes, SSH, Tailnet ou DNS-SD étendu ; désactivez Bonjour sur le réseau local avec `discovery.mdns.mode: "off"` ou `OPENCLAW_DISABLE_BONJOUR=1` lorsque le multicast est indisponible.
- **Réseau par pont Docker** : Bonjour se désactive automatiquement dans les conteneurs détectés. Définissez `OPENCLAW_DISABLE_BONJOUR=0` uniquement pour un réseau hôte, macvlan ou un autre réseau compatible avec mDNS.
- **Mise en veille/changements fréquents d’interface** : macOS peut temporairement ne plus renvoyer de résultats mDNS ; réessayez.
- **La détection fonctionne, mais la résolution échoue** : utilisez des noms de machine simples (sans émojis ni signes de ponctuation), puis redémarrez le Gateway. Le nom d’instance du service dérive du nom d’hôte ; des noms trop complexes peuvent donc perturber certains résolveurs.

## Noms d’instance échappés (`\032`)

Bonjour/DNS-SD échappe souvent les octets des noms d’instance de service sous forme de séquences décimales `\DDD` (les espaces deviennent `\032`). Ce comportement est normal au niveau du protocole ; les interfaces utilisateur doivent les décoder pour l’affichage (iOS utilise `BonjourEscapes.decode`).

## Activation, désactivation et configuration

| Paramètre                                            | Effet                                                                             |
| ---------------------------------------------------- | --------------------------------------------------------------------------------- |
| `openclaw plugins enable bonjour`                    | Active le plugin de découverte sur le réseau local fourni sur les hôtes où il n’est pas activé par défaut. |
| `openclaw plugins disable bonjour`                   | Désactive l’annonce multicast sur le réseau local en désactivant le plugin fourni. |
| `OPENCLAW_DISABLE_BONJOUR=1` (ou `true`/`yes`/`on`)  | Désactive l’annonce multicast sur le réseau local sans modifier la configuration du plugin. |
| `OPENCLAW_DISABLE_BONJOUR=0` (ou `false`/`no`/`off`) | Force l’activation de l’annonce multicast sur le réseau local, y compris dans les conteneurs détectés. |
| `discovery.mdns.mode`                                | `off` \| `minimal` (par défaut) \| `full` — voir les modes ci-dessus. |
| `gateway.bind`                                       | Contrôle le mode de liaison du Gateway dans `~/.openclaw/openclaw.json`. |
| `OPENCLAW_SSH_PORT`                                  | Remplace le port SSH lorsque `sshPort` est annoncé (mode complet). |
| `OPENCLAW_TAILNET_DNS`                               | Publie une indication MagicDNS dans TXT lorsque le mode mDNS complet est activé. |
| `OPENCLAW_CLI_PATH`                                  | Remplace le chemin CLI annoncé (mode complet). |

Par défaut, les hôtes macOS démarrent automatiquement le plugin de découverte sur le réseau local fourni. Lorsque le plugin Bonjour est activé et que `OPENCLAW_DISABLE_BONJOUR` n’est pas défini, Bonjour diffuse des annonces sur les hôtes normaux et se désactive automatiquement dans les conteneurs détectés (Docker, machines Fly.io et environnements d’exécution de conteneurs courants).

## Documentation connexe

- Politique de découverte et sélection du transport : [Découverte](/fr/gateway/discovery)
- Appairage des Node et approbations : [Appairage du Gateway](/fr/gateway/pairing)
