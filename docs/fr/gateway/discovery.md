---
read_when:
    - Implémentation ou modification de la découverte/annonce Bonjour
    - Ajustement des modes de connexion à distance (direct ou SSH)
    - Conception de la découverte des nœuds et de l’appairage pour les nœuds distants
summary: Découverte et transports Node (Bonjour, Tailscale, SSH) pour trouver le Gateway
title: Découverte et transports
x-i18n:
    generated_at: "2026-04-30T07:26:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: c396e6e07808e2571c6d7f539922b94443adbf39339027e6e962596c6f13deaa
    source_path: gateway/discovery.md
    workflow: 16
---

# Découverte et transports

OpenClaw a deux problèmes distincts qui se ressemblent en surface :

1. **Contrôle à distance par l’opérateur** : l’app de barre de menus macOS qui contrôle un Gateway exécuté ailleurs.
2. **Appairage des Nodes** : iOS/Android (et les futurs Nodes) qui trouvent un Gateway et s’appairent de manière sécurisée.

L’objectif de conception est de conserver toute la découverte/annonce réseau dans le **Node Gateway** (`openclaw gateway`) et de garder les clients (app Mac, iOS) comme consommateurs.

## Termes

- **Gateway** : un processus Gateway unique à exécution longue qui possède l’état (sessions, appairage, registre de Nodes) et exécute les canaux. La plupart des configurations en utilisent un par hôte ; les configurations multi-Gateway isolées sont possibles.
- **Gateway WS (plan de contrôle)** : le point de terminaison WebSocket sur `127.0.0.1:18789` par défaut ; peut être lié au LAN/tailnet via `gateway.bind`.
- **Transport WS direct** : un point de terminaison Gateway WS exposé au LAN/tailnet (sans SSH).
- **Transport SSH (repli)** : contrôle à distance en transférant `127.0.0.1:18789` via SSH.
- **Bridge TCP hérité (supprimé)** : ancien transport de Node (voir
  [Protocole bridge](/fr/gateway/bridge-protocol)) ; il n’est plus annoncé pour la
  découverte et ne fait plus partie des builds actuels.

Détails des protocoles :

- [Protocole Gateway](/fr/gateway/protocol)
- [Protocole bridge (hérité)](/fr/gateway/bridge-protocol)

## Pourquoi nous conservons à la fois le « direct » et SSH

- **WS direct** offre la meilleure expérience utilisateur sur le même réseau et dans un tailnet :
  - découverte automatique sur LAN via Bonjour
  - jetons d’appairage + ACL possédés par le Gateway
  - aucun accès shell requis ; la surface protocolaire peut rester stricte et auditable
- **SSH** reste le repli universel :
  - fonctionne partout où vous avez un accès SSH (même entre réseaux sans lien)
  - résiste aux problèmes de multicast/mDNS
  - ne nécessite aucun nouveau port entrant en dehors de SSH

## Entrées de découverte (comment les clients apprennent où se trouve le Gateway)

### 1) Découverte Bonjour / DNS-SD

Le multicast Bonjour fonctionne au mieux et ne traverse pas les réseaux. OpenClaw peut aussi parcourir le
même beacon Gateway via un domaine DNS-SD étendu configuré, afin que la découverte puisse couvrir :

- `local.` sur le même LAN
- un domaine DNS-SD unicast configuré pour la découverte inter-réseaux

Direction visée :

- Le **Gateway** annonce son point de terminaison WS via Bonjour.
- Les clients parcourent et affichent une liste « choisir un Gateway », puis stockent le point de terminaison choisi.

Dépannage et détails du beacon : [Bonjour](/fr/gateway/bonjour).

#### Détails du beacon de service

- Types de service :
  - `_openclaw-gw._tcp` (beacon de transport Gateway)
- Clés TXT (non secrètes) :
  - `role=gateway`
  - `transport=gateway`
  - `displayName=<friendly name>` (nom d’affichage configuré par l’opérateur)
  - `lanHost=<hostname>.local`
  - `gatewayPort=18789` (Gateway WS + HTTP)
  - `gatewayTls=1` (uniquement lorsque TLS est activé)
  - `gatewayTlsSha256=<sha256>` (uniquement lorsque TLS est activé et que l’empreinte est disponible)
  - `canvasPort=<port>` (port de l’hôte canvas ; actuellement le même que `gatewayPort` lorsque l’hôte canvas est activé)
  - `tailnetDns=<magicdns>` (indication facultative ; détectée automatiquement lorsque Tailscale est disponible)
  - `sshPort=<port>` (mode mDNS complet uniquement ; le DNS-SD étendu peut l’omettre, auquel cas les valeurs par défaut SSH restent à `22`)
  - `cliPath=<path>` (mode mDNS complet uniquement ; le DNS-SD étendu l’écrit toujours comme indication d’installation distante)

Notes de sécurité :

- Les enregistrements TXT Bonjour/mDNS ne sont **pas authentifiés**. Les clients doivent traiter les valeurs TXT uniquement comme des indications d’expérience utilisateur.
- Le routage (hôte/port) doit préférer le **point de terminaison de service résolu** (SRV + A/AAAA) plutôt que `lanHost`, `tailnetDns` ou `gatewayPort` fournis par TXT.
- L’épinglage TLS ne doit jamais permettre à un `gatewayTlsSha256` annoncé de remplacer une épingle précédemment stockée.
- Les Nodes iOS/Android doivent exiger une confirmation explicite « faire confiance à cette empreinte » avant de stocker une première épingle (vérification hors bande) chaque fois que la route choisie est sécurisée/basée sur TLS.

Désactiver/remplacer :

- `OPENCLAW_DISABLE_BONJOUR=1` désactive l’annonce.
- Lorsque `OPENCLAW_DISABLE_BONJOUR` n’est pas défini, Bonjour annonce sur les hôtes normaux
  et se désactive automatiquement dans les conteneurs détectés. Utilisez `0` uniquement sur l’hôte, macvlan,
  ou un autre réseau compatible mDNS ; utilisez `1` pour forcer la désactivation.
- `gateway.bind` dans `~/.openclaw/openclaw.json` contrôle le mode de liaison du Gateway.
- `OPENCLAW_SSH_PORT` remplace le port SSH annoncé lorsque `sshPort` est émis.
- `OPENCLAW_TAILNET_DNS` publie une indication `tailnetDns` (MagicDNS).
- `OPENCLAW_CLI_PATH` remplace le chemin CLI annoncé.

### 2) Tailnet (inter-réseaux)

Pour les configurations de type Londres/Vienne, Bonjour n’aidera pas. La cible « directe » recommandée est :

- le nom MagicDNS Tailscale (préféré) ou une IP tailnet stable.

Si le Gateway peut détecter qu’il s’exécute sous Tailscale, il publie `tailnetDns` comme indication facultative pour les clients (y compris les beacons étendus).

L’app macOS préfère désormais les noms MagicDNS aux IP Tailscale brutes pour la découverte de Gateway. Cela améliore la fiabilité lorsque les IP tailnet changent (par exemple après des redémarrages de Nodes ou une réattribution CGNAT), car les noms MagicDNS se résolvent automatiquement vers l’IP actuelle.

Pour l’appairage de Nodes mobiles, les indications de découverte n’assouplissent pas la sécurité du transport sur les routes tailnet/publiques :

- iOS/Android exigent toujours un chemin de connexion initial tailnet/public sécurisé (`wss://` ou Tailscale Serve/Funnel).
- Une IP tailnet brute découverte est une indication de routage, pas une autorisation d’utiliser du `ws://` distant en clair.
- La connexion directe `ws://` sur LAN privé reste prise en charge.
- Si vous voulez le chemin Tailscale le plus simple pour les Nodes mobiles, utilisez Tailscale Serve afin que la découverte et le code de configuration se résolvent tous deux vers le même point de terminaison MagicDNS sécurisé.

### 3) Cible manuelle / SSH

Lorsqu’il n’existe aucune route directe (ou que le direct est désactivé), les clients peuvent toujours se connecter via SSH en transférant le port Gateway de loopback.

Voir [Accès distant](/fr/gateway/remote).

## Sélection du transport (politique client)

Comportement client recommandé :

1. Si un point de terminaison direct appairé est configuré et accessible, l’utiliser.
2. Sinon, si la découverte trouve un Gateway sur `local.` ou le domaine étendu configuré, proposer un choix en un geste « Utiliser ce Gateway » et l’enregistrer comme point de terminaison direct.
3. Sinon, si un DNS/IP tailnet est configuré, essayer le direct.
   Pour les Nodes mobiles sur des routes tailnet/publiques, direct signifie un point de terminaison sécurisé, pas du `ws://` distant en clair.
4. Sinon, se rabattre sur SSH.

## Appairage + auth (transport direct)

Le Gateway est la source de vérité pour l’admission des Nodes/clients.

- Les demandes d’appairage sont créées/approuvées/rejetées dans le Gateway (voir [Appairage Gateway](/fr/gateway/pairing)).
- Le Gateway applique :
  - auth (jeton / paire de clés)
  - portées/ACL (le Gateway n’est pas un proxy brut vers chaque méthode)
  - limites de débit

## Responsabilités par composant

- **Gateway** : annonce les beacons de découverte, possède les décisions d’appairage et héberge le point de terminaison WS.
- **App macOS** : vous aide à choisir un Gateway, affiche les invites d’appairage et n’utilise SSH qu’en repli.
- **Nodes iOS/Android** : parcourent Bonjour par commodité et se connectent au Gateway WS appairé.

## Connexe

- [Accès distant](/fr/gateway/remote)
- [Tailscale](/fr/gateway/tailscale)
- [Découverte Bonjour](/fr/gateway/bonjour)
