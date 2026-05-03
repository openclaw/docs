---
read_when:
    - Implémenter ou modifier la découverte/l’annonce Bonjour
    - Ajuster les modes de connexion à distance (direct ou SSH)
    - Conception de la découverte des nœuds + appairage des nœuds distants
summary: Découverte de Node et transports (Bonjour, Tailscale, SSH) pour trouver le Gateway
title: Découverte et transports
x-i18n:
    generated_at: "2026-05-03T21:32:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 41a5ed7a910ae4bbdfa21a81882c3b1af0c16622fa20a5e616b666390dccdc9c
    source_path: gateway/discovery.md
    workflow: 16
---

# Découverte et transports

OpenClaw a deux problèmes distincts qui se ressemblent en surface :

1. **Contrôle à distance par l’opérateur** : l’app de barre de menus macOS contrôlant un Gateway exécuté ailleurs.
2. **Appairage de Node** : iOS/Android (et les futurs nœuds) trouvant un Gateway et s’appairant de façon sécurisée.

L’objectif de conception est de conserver toute la découverte/publication réseau dans le **Node Gateway** (`openclaw gateway`) et de garder les clients (app Mac, iOS) comme consommateurs.

## Termes

- **Gateway** : un processus Gateway unique et durable qui possède l’état (sessions, appairage, registre des nœuds) et exécute les canaux. La plupart des configurations en utilisent un par hôte ; les configurations multi-Gateway isolées sont possibles.
- **Gateway WS (plan de contrôle)** : le point de terminaison WebSocket sur `127.0.0.1:18789` par défaut ; peut être lié au LAN/tailnet via `gateway.bind`.
- **Transport WS direct** : un point de terminaison Gateway WS exposé au LAN/tailnet (sans SSH).
- **Transport SSH (repli)** : contrôle à distance en transférant `127.0.0.1:18789` via SSH.
- **Pont TCP hérité (supprimé)** : ancien transport de nœud (voir
  [Protocole de pont](/fr/gateway/bridge-protocol)) ; il n’est plus annoncé pour
  la découverte et ne fait plus partie des versions actuelles.

Détails du protocole :

- [Protocole Gateway](/fr/gateway/protocol)
- [Protocole de pont (hérité)](/fr/gateway/bridge-protocol)

## Pourquoi nous conservons à la fois le « direct » et SSH

- **WS direct** offre la meilleure expérience utilisateur sur le même réseau et au sein d’un tailnet :
  - découverte automatique sur le LAN via Bonjour
  - jetons d’appairage + ACL gérés par le Gateway
  - aucun accès shell requis ; la surface du protocole peut rester restreinte et auditable
- **SSH** reste le repli universel :
  - fonctionne partout où vous avez un accès SSH (même entre réseaux sans lien)
  - résiste aux problèmes de multidiffusion/mDNS
  - ne nécessite aucun nouveau port entrant en dehors de SSH

## Entrées de découverte (comment les clients apprennent où se trouve le Gateway)

### 1) Découverte Bonjour / DNS-SD

Bonjour multicast fonctionne au mieux et ne traverse pas les réseaux. OpenClaw peut aussi parcourir la
même balise Gateway via un domaine DNS-SD étendu configuré, afin que la découverte puisse couvrir :

- `local.` sur le même LAN
- un domaine DNS-SD unicast configuré pour la découverte inter-réseaux

Direction cible :

- Le **Gateway** annonce son point de terminaison WS via Bonjour lorsque le Plugin `bonjour` intégré est activé. Le Plugin démarre automatiquement sur les hôtes macOS et est optionnel ailleurs.
- Les clients parcourent et affichent une liste « choisir un Gateway », puis stockent le point de terminaison choisi.

Dépannage et détails de balise : [Bonjour](/fr/gateway/bonjour).

#### Détails de la balise de service

- Types de service :
  - `_openclaw-gw._tcp` (balise de transport Gateway)
- Clés TXT (non secrètes) :
  - `role=gateway`
  - `transport=gateway`
  - `displayName=<friendly name>` (nom d’affichage configuré par l’opérateur)
  - `lanHost=<hostname>.local`
  - `gatewayPort=18789` (Gateway WS + HTTP)
  - `gatewayTls=1` (uniquement lorsque TLS est activé)
  - `gatewayTlsSha256=<sha256>` (uniquement lorsque TLS est activé et que l’empreinte est disponible)
  - `canvasPort=<port>` (port de l’hôte canvas ; actuellement identique à `gatewayPort` lorsque l’hôte canvas est activé)
  - `tailnetDns=<magicdns>` (indice facultatif ; détecté automatiquement lorsque Tailscale est disponible)
  - `sshPort=<port>` (mode mDNS complet uniquement ; le DNS-SD étendu peut l’omettre, auquel cas les valeurs par défaut SSH restent à `22`)
  - `cliPath=<path>` (mode mDNS complet uniquement ; le DNS-SD étendu l’écrit tout de même comme indice d’installation distante)

Notes de sécurité :

- Les enregistrements TXT Bonjour/mDNS sont **non authentifiés**. Les clients doivent traiter les valeurs TXT uniquement comme des indices d’expérience utilisateur.
- Le routage (hôte/port) doit préférer le **point de terminaison de service résolu** (SRV + A/AAAA) plutôt que `lanHost`, `tailnetDns` ou `gatewayPort` fournis par TXT.
- L’épinglage TLS ne doit jamais permettre à un `gatewayTlsSha256` annoncé de remplacer une épingle précédemment stockée.
- Les nœuds iOS/Android doivent exiger une confirmation explicite « faire confiance à cette empreinte » avant de stocker une première épingle (vérification hors bande) chaque fois que la route choisie est sécurisée/basée sur TLS.

Activer/désactiver/remplacer :

- `openclaw plugins enable bonjour` active la publication multicast LAN.
- `OPENCLAW_DISABLE_BONJOUR=1` désactive la publication.
- Lorsque le Plugin Bonjour est activé et que `OPENCLAW_DISABLE_BONJOUR` n’est pas défini,
  Bonjour annonce sur les hôtes normaux et se désactive automatiquement dans les conteneurs détectés.
  Le démarrage macOS Gateway avec configuration vide active automatiquement le Plugin ; les déploiements Linux,
  Windows et conteneurisés nécessitent une activation explicite.
  Utilisez `0` uniquement sur l’hôte, macvlan ou un autre réseau compatible mDNS ; utilisez `1` pour
  forcer la désactivation.
- `gateway.bind` dans `~/.openclaw/openclaw.json` contrôle le mode de liaison du Gateway.
- `OPENCLAW_SSH_PORT` remplace le port SSH annoncé lorsque `sshPort` est émis.
- `OPENCLAW_TAILNET_DNS` publie un indice `tailnetDns` (MagicDNS).
- `OPENCLAW_CLI_PATH` remplace le chemin CLI annoncé.

### 2) Tailnet (inter-réseaux)

Pour les configurations de type Londres/Vienne, Bonjour n’aidera pas. La cible « directe » recommandée est :

- un nom Tailscale MagicDNS (préféré) ou une IP tailnet stable.

Si le Gateway peut détecter qu’il s’exécute sous Tailscale, il publie `tailnetDns` comme indice facultatif pour les clients (y compris les balises étendues).

L’app macOS préfère désormais les noms MagicDNS aux IP Tailscale brutes pour la découverte de Gateway. Cela améliore la fiabilité lorsque les IP tailnet changent (par exemple après des redémarrages de nœud ou une réattribution CGNAT), car les noms MagicDNS se résolvent automatiquement vers l’IP actuelle.

Pour l’appairage des nœuds mobiles, les indices de découverte n’assouplissent pas la sécurité du transport sur les routes tailnet/publiques :

- iOS/Android exigent toujours un chemin de première connexion tailnet/public sécurisé (`wss://` ou Tailscale Serve/Funnel).
- Une IP tailnet brute découverte est un indice de routage, pas une autorisation d’utiliser un `ws://` distant en clair.
- La connexion directe `ws://` sur LAN privé reste prise en charge.
- Si vous voulez le chemin Tailscale le plus simple pour les nœuds mobiles, utilisez Tailscale Serve afin que la découverte et le code de configuration se résolvent tous deux vers le même point de terminaison MagicDNS sécurisé.

### 3) Cible manuelle / SSH

Lorsqu’il n’existe pas de route directe (ou que le direct est désactivé), les clients peuvent toujours se connecter via SSH en transférant le port Gateway de local loopback.

Voir [Accès distant](/fr/gateway/remote).

## Sélection du transport (politique client)

Comportement client recommandé :

1. Si un point de terminaison direct appairé est configuré et joignable, utilisez-le.
2. Sinon, si la découverte trouve un Gateway sur `local.` ou le domaine étendu configuré, proposez un choix « Utiliser ce Gateway » en un toucher et enregistrez-le comme point de terminaison direct.
3. Sinon, si un DNS/IP tailnet est configuré, essayez le direct.
   Pour les nœuds mobiles sur routes tailnet/publiques, direct signifie un point de terminaison sécurisé, pas un `ws://` distant en clair.
4. Sinon, revenez à SSH.

## Appairage + authentification (transport direct)

Le Gateway est la source de vérité pour l’admission des nœuds/clients.

- Les demandes d’appairage sont créées/approuvées/rejetées dans le Gateway (voir [Appairage Gateway](/fr/gateway/pairing)).
- Le Gateway applique :
  - l’authentification (jeton / paire de clés)
  - les portées/ACL (le Gateway n’est pas un proxy brut vers chaque méthode)
  - les limites de débit

## Responsabilités par composant

- **Gateway** : annonce les balises de découverte, possède les décisions d’appairage et héberge le point de terminaison WS.
- **App macOS** : vous aide à choisir un Gateway, affiche les invites d’appairage et utilise SSH uniquement comme repli.
- **Nœuds iOS/Android** : parcourent Bonjour par commodité et se connectent au Gateway WS appairé.

## Liens connexes

- [Accès distant](/fr/gateway/remote)
- [Tailscale](/fr/gateway/tailscale)
- [Découverte Bonjour](/fr/gateway/bonjour)
