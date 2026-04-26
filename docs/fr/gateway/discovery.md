---
read_when:
    - Implémentation ou modification de la découverte/de l’annonce Bonjour
    - Ajustement des modes de connexion à distance (direct vs SSH)
    - Conception de la découverte des nœuds et de l’appairage pour les nœuds distants
summary: Découverte des nœuds et transports (Bonjour, Tailscale, SSH) pour trouver la Gateway
title: Découverte et transports
x-i18n:
    generated_at: "2026-04-26T11:28:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 615be0f501470772c257beb8e798c522c108b09081a603f44218404277fdf269
    source_path: gateway/discovery.md
    workflow: 15
---

# Découverte et transports

OpenClaw présente deux problèmes distincts qui se ressemblent en surface :

1. **Contrôle à distance de l’opérateur** : l’application de barre de menus macOS contrôle une Gateway exécutée ailleurs.
2. **Appairage de nœuds** : iOS/Android (et les futurs nœuds) trouvent une Gateway et s’y appairent de manière sécurisée.

L’objectif de conception est de conserver toute la découverte/annonce réseau dans la **Node Gateway** (`openclaw gateway`) et de garder les clients (application Mac, iOS) comme consommateurs.

## Termes

- **Gateway** : un seul processus Gateway de longue durée qui possède l’état (sessions, appairage, registre des nœuds) et exécute les canaux. La plupart des configurations en utilisent un par hôte ; des configurations multi-Gateway isolées sont possibles.
- **Gateway WS (plan de contrôle)** : le point de terminaison WebSocket sur `127.0.0.1:18789` par défaut ; peut être lié au LAN/tailnet via `gateway.bind`.
- **Transport WS direct** : un point de terminaison Gateway WS exposé côté LAN/tailnet (sans SSH).
- **Transport SSH (repli)** : contrôle à distance en transférant `127.0.0.1:18789` via SSH.
- **Ancien pont TCP (supprimé)** : ancien transport de nœud (voir
  [Protocole Bridge](/fr/gateway/bridge-protocol)) ; il n’est plus annoncé pour la
  découverte et ne fait plus partie des versions actuelles.

Détails du protocole :

- [Protocole Gateway](/fr/gateway/protocol)
- [Protocole Bridge (hérité)](/fr/gateway/bridge-protocol)

## Pourquoi nous conservons à la fois le mode « direct » et SSH

- **WS direct** offre la meilleure expérience utilisateur sur le même réseau et dans un tailnet :
  - auto-découverte sur le LAN via Bonjour
  - jetons d’appairage + ACL gérés par la Gateway
  - aucun accès shell requis ; la surface du protocole peut rester étroite et auditée
- **SSH** reste le repli universel :
  - fonctionne partout où vous disposez d’un accès SSH (même à travers des réseaux sans lien)
  - résiste aux problèmes de multicast/mDNS
  - ne nécessite aucun nouveau port entrant autre que SSH

## Entrées de découverte (comment les clients apprennent où se trouve la Gateway)

### 1) Découverte Bonjour / DNS-SD

Le multicast Bonjour est opportuniste et ne traverse pas les réseaux. OpenClaw peut aussi parcourir la
même balise Gateway via un domaine DNS-SD étendu configuré, de sorte que la découverte peut couvrir :

- `local.` sur le même LAN
- un domaine DNS-SD unicast configuré pour la découverte inter-réseaux

Direction cible :

- La **Gateway** annonce son point de terminaison WS via Bonjour.
- Les clients parcourent et affichent une liste « choisir une Gateway », puis stockent le point de terminaison choisi.

Dépannage et détails des balises : [Bonjour](/fr/gateway/bonjour).

#### Détails de la balise de service

- Types de service :
  - `_openclaw-gw._tcp` (balise de transport Gateway)
- Clés TXT (non secrètes) :
  - `role=gateway`
  - `transport=gateway`
  - `displayName=<nom convivial>` (nom d’affichage configuré par l’opérateur)
  - `lanHost=<hostname>.local`
  - `gatewayPort=18789` (Gateway WS + HTTP)
  - `gatewayTls=1` (uniquement lorsque TLS est activé)
  - `gatewayTlsSha256=<sha256>` (uniquement lorsque TLS est activé et que l’empreinte est disponible)
  - `canvasPort=<port>` (port de l’hôte canvas ; actuellement identique à `gatewayPort` lorsque l’hôte canvas est activé)
  - `tailnetDns=<magicdns>` (indice facultatif ; détecté automatiquement lorsque Tailscale est disponible)
  - `sshPort=<port>` (mode complet mDNS uniquement ; le DNS-SD étendu peut l’omettre, auquel cas les valeurs par défaut SSH restent à `22`)
  - `cliPath=<path>` (mode complet mDNS uniquement ; le DNS-SD étendu l’écrit encore comme indice d’installation distante)

Remarques de sécurité :

- Les enregistrements TXT Bonjour/mDNS sont **non authentifiés**. Les clients doivent traiter les valeurs TXT uniquement comme des indices d’expérience utilisateur.
- Le routage (hôte/port) doit préférer le **point de terminaison de service résolu** (SRV + A/AAAA) plutôt que `lanHost`, `tailnetDns` ou `gatewayPort` fournis par TXT.
- Le pinning TLS ne doit jamais permettre à un `gatewayTlsSha256` annoncé de remplacer un pin précédemment stocké.
- Les nœuds iOS/Android doivent exiger une confirmation explicite de type « faire confiance à cette empreinte » avant de stocker un premier pin (vérification hors bande) chaque fois que la route choisie est sécurisée/basée sur TLS.

Désactiver/remplacer :

- `OPENCLAW_DISABLE_BONJOUR=1` désactive l’annonce.
- Docker Compose définit par défaut `OPENCLAW_DISABLE_BONJOUR=1` car les réseaux de pont
  transportent généralement mal le multicast mDNS ; utilisez `0` uniquement sur un réseau hôte, macvlan
  ou un autre réseau compatible mDNS.
- `gateway.bind` dans `~/.openclaw/openclaw.json` contrôle le mode de liaison de la Gateway.
- `OPENCLAW_SSH_PORT` remplace le port SSH annoncé lorsque `sshPort` est émis.
- `OPENCLAW_TAILNET_DNS` publie un indice `tailnetDns` (MagicDNS).
- `OPENCLAW_CLI_PATH` remplace le chemin CLI annoncé.

### 2) Tailnet (inter-réseaux)

Pour des configurations de type Londres/Vienne, Bonjour ne sera d’aucune aide. La cible « directe » recommandée est :

- le nom Tailscale MagicDNS (préféré) ou une IP tailnet stable.

Si la Gateway peut détecter qu’elle s’exécute sous Tailscale, elle publie `tailnetDns` comme indice facultatif pour les clients (y compris les balises étendues).

L’application macOS privilégie désormais les noms MagicDNS aux IP Tailscale brutes pour la découverte de la Gateway. Cela améliore la fiabilité lorsque les IP tailnet changent (par exemple après des redémarrages de nœuds ou une réattribution CGNAT), car les noms MagicDNS se résolvent automatiquement vers l’IP actuelle.

Pour l’appairage des nœuds mobiles, les indices de découverte n’assouplissent pas la sécurité du transport sur les routes tailnet/publiques :

- iOS/Android exigent toujours un chemin de connexion initial sécurisé sur tailnet/public (`wss://` ou Tailscale Serve/Funnel).
- Une IP tailnet brute découverte est un indice de routage, et non une autorisation d’utiliser un `ws://` distant en clair.
- La connexion directe `ws://` sur LAN privé reste prise en charge.
- Si vous souhaitez le chemin Tailscale le plus simple pour les nœuds mobiles, utilisez Tailscale Serve afin que la découverte et le code de configuration se résolvent tous deux vers le même point de terminaison MagicDNS sécurisé.

### 3) Cible manuelle / SSH

Lorsqu’il n’existe pas de route directe (ou que le mode direct est désactivé), les clients peuvent toujours se connecter via SSH en transférant le port Gateway loopback.

Voir [Accès à distance](/fr/gateway/remote).

## Sélection du transport (politique client)

Comportement client recommandé :

1. Si un point de terminaison direct appairé est configuré et joignable, l’utiliser.
2. Sinon, si la découverte trouve une Gateway sur `local.` ou sur le domaine étendu configuré, proposer un choix en un clic « Utiliser cette Gateway » et l’enregistrer comme point de terminaison direct.
3. Sinon, si un DNS/IP tailnet est configuré, tenter le mode direct.
   Pour les nœuds mobiles sur routes tailnet/publiques, le mode direct signifie un point de terminaison sécurisé, pas un `ws://` distant en clair.
4. Sinon, revenir à SSH.

## Appairage + authentification (transport direct)

La Gateway est la source de vérité pour l’admission des nœuds/clients.

- Les demandes d’appairage sont créées/approuvées/rejetées dans la Gateway (voir [Appairage Gateway](/fr/gateway/pairing)).
- La Gateway applique :
  - l’authentification (jeton / paire de clés)
  - les portées/ACL (la Gateway n’est pas un proxy brut vers chaque méthode)
  - les limites de débit

## Responsabilités par composant

- **Gateway** : annonce les balises de découverte, possède les décisions d’appairage et héberge le point de terminaison WS.
- **Application macOS** : vous aide à choisir une Gateway, affiche les invites d’appairage et n’utilise SSH qu’en repli.
- **Nœuds iOS/Android** : parcourent Bonjour comme commodité et se connectent à la Gateway WS appairée.

## Liens connexes

- [Accès à distance](/fr/gateway/remote)
- [Tailscale](/fr/gateway/tailscale)
- [Découverte Bonjour](/fr/gateway/bonjour)
