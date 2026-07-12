---
read_when:
    - Implémentation ou modification de la découverte et de la publication Bonjour
    - Réglage des modes de connexion à distance (directe ou via SSH)
    - Conception de la découverte et de l’appairage des Node distants
summary: Découverte et transports des Node (Bonjour, Tailscale, SSH) pour trouver le Gateway
title: Découverte et transports
x-i18n:
    generated_at: "2026-07-12T02:37:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3a3f1a6a1212ab0bc7021e77c88de059edcb8e09eff90d3e1e59451b9b20876b
    source_path: gateway/discovery.md
    workflow: 16
---

OpenClaw doit résoudre deux problèmes de découverte liés mais distincts :

1. **Contrôle distant par l’opérateur** : l’app de la barre des menus macOS contrôle un Gateway exécuté ailleurs.
2. **Appairage des Node** : iOS/Android (et les futurs Node) trouvent un Gateway et s’y appairent de manière sécurisée.

Toute la découverte et la publication réseau sont gérées par le **Gateway des Node**
(`openclaw gateway`) ; les clients (app Mac, iOS) sont uniquement des consommateurs.

## Terminologie

- **Gateway** : processus unique de longue durée qui détient l’état (sessions,
  appairage, registre des Node) et exécute les canaux. La plupart des configurations
  en utilisent un par hôte ; des configurations isolées avec plusieurs Gateway sont possibles.
- **WS du Gateway (plan de contrôle)** : point de terminaison WebSocket sur `127.0.0.1:18789`
  par défaut ; liez-le au LAN/tailnet via `gateway.bind`.
- **Transport WS direct** : point de terminaison WS du Gateway accessible depuis le LAN/tailnet (sans SSH).
- **Transport SSH (solution de secours)** : contrôle distant par transfert de
  `127.0.0.1:18789` via SSH.
- **Ancien pont TCP (supprimé)** : ancien transport des Node (voir
  [Protocole du pont](/fr/gateway/bridge-protocol)) ; il n’est plus annoncé pour
  la découverte et ne fait plus partie des versions actuelles.

Détails des protocoles : [Protocole du Gateway](/fr/gateway/protocol),
[Protocole du pont (ancien)](/fr/gateway/bridge-protocol).

## Pourquoi les modes direct et SSH coexistent

- **WS direct** offre la meilleure expérience utilisateur sur le même réseau et au sein d’un tailnet :
  découverte automatique sur le LAN via Bonjour, jetons d’appairage et ACL gérés par le Gateway,
  sans nécessiter d’accès à un shell.
- **SSH** est la solution de secours universelle : il fonctionne partout où vous disposez d’un accès SSH,
  même entre des réseaux sans lien, résiste aux problèmes de multidiffusion/mDNS et
  ne nécessite aucun nouveau port entrant en dehors de SSH.

## Sources de découverte

### 1) Bonjour / DNS-SD

Bonjour en multidiffusion fonctionne au mieux et ne traverse pas les réseaux. OpenClaw
permet également de rechercher la même balise de Gateway via un domaine DNS-SD étendu
configuré, afin que la découverte couvre à la fois `local.` sur le même LAN et un domaine
DNS-SD monodiffusion configuré pour la découverte entre réseaux.

Le **Gateway** annonce son point de terminaison WS via Bonjour lorsque le Plugin
`bonjour` intégré est activé ; les clients le recherchent et affichent une liste « choisir un Gateway »,
puis enregistrent le point de terminaison sélectionné.

Dépannage et détails de la balise : [Bonjour](/fr/gateway/bonjour).

#### Détails de la balise de service

- Type de service : `_openclaw-gw._tcp` (balise de transport du Gateway).
- Clés TXT (non secrètes) :

  | Clé                         | Remarques                                                                                                                                                            |
  | --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `role=gateway`              | Toujours présente.                                                                                                                                                   |
  | `transport=gateway`         | Toujours présente.                                                                                                                                                   |
  | `displayName=<name>`        | Nom d’affichage configuré par l’opérateur.                                                                                                                            |
  | `lanHost=<hostname>.local`  | Uniquement pour l’annonceur mDNS du LAN ; non écrite par le DNS-SD étendu.                                                                                            |
  | `gatewayPort=18789`         | Port WS + HTTP du Gateway.                                                                                                                                           |
  | `gatewayTls=1`              | Uniquement lorsque TLS est activé.                                                                                                                                   |
  | `gatewayTlsSha256=<sha256>` | Uniquement lorsque TLS est activé et qu’une empreinte est disponible.                                                                                                |
  | `tailnetDns=<magicdns>`     | Indication facultative ; détectée automatiquement lorsque Tailscale est disponible.                                                                                   |
  | `sshPort=<port>`            | Présente uniquement lorsque `discovery.mdns.mode="full"` ; omise (SSH utilise `22` par défaut) dans le mode `"minimal"` par défaut, aussi bien pour l’annonceur du LAN que pour le DNS-SD étendu. |
  | `cliPath=<path>`            | Même condition `discovery.mdns.mode="full"` que pour `sshPort` ; indication d’installation distante du chemin de la CLI.                                             |

  Une clé TXT `canvasPort` est définie dans le contrat de découverte du Plugin pour un
  futur port d’hôte de canevas, mais aucun chemin de code actuel ne lui attribue de valeur ;
  elle n’est donc jamais émise actuellement.

Remarques de sécurité :

- Les enregistrements TXT Bonjour/mDNS ne sont **pas authentifiés**. Les clients doivent considérer
  les valeurs TXT uniquement comme des indications pour l’expérience utilisateur.
- Le routage (hôte/port) doit privilégier le **point de terminaison de service résolu**
  (SRV + A/AAAA) plutôt que `lanHost`, `tailnetDns` ou `gatewayPort` fournis par TXT.
- L’épinglage TLS ne doit jamais permettre à un `gatewayTlsSha256` annoncé de remplacer une
  empreinte précédemment enregistrée.
- Les Node iOS/Android doivent exiger une confirmation explicite « faire confiance à cette empreinte »
  avant d’enregistrer une empreinte pour la première fois (vérification hors bande)
  chaque fois que la route choisie est sécurisée ou fondée sur TLS.

Activation, désactivation et remplacement :

- `openclaw plugins enable bonjour` active la publication par multidiffusion sur le LAN.
- `discovery.mdns.mode` dans `openclaw.json` contrôle la diffusion mDNS :
  `"minimal"` (par défaut), `"full"` (ajoute `cliPath`/`sshPort` à la balise du LAN
  et à toute zone DNS-SD étendue) ou `"off"` (désactive mDNS).
- `OPENCLAW_DISABLE_BONJOUR=1` force la désactivation de la publication ; `discovery.mdns.mode="off"`
  la désactive indépendamment. `OPENCLAW_DISABLE_BONJOUR=0` est une activation explicite
  qui remplace la désactivation automatique du Plugin dans un conteneur détecté
  (Docker, containerd, Kubernetes, LXC) ; elle ne remplace pas
  `discovery.mdns.mode="off"`. Le Plugin `bonjour` intégré démarre automatiquement sur
  les hôtes macOS (`enabledByDefaultOnPlatforms: ["darwin"]`) et se désactive automatiquement
  dans les conteneurs détectés ; Linux, Windows et les autres déploiements conteneurisés
  nécessitent l’exécution explicite de `plugins enable bonjour`.
- `gateway.bind` dans `~/.openclaw/openclaw.json` contrôle le mode de liaison du Gateway.
- `OPENCLAW_SSH_PORT` remplace le port SSH annoncé (prend effet uniquement
  lorsque `discovery.mdns.mode="full"`).
- `OPENCLAW_TAILNET_DNS` publie une indication `tailnetDns` (MagicDNS).
- `OPENCLAW_CLI_PATH` remplace le chemin de CLI annoncé.

### 2) Tailnet (entre réseaux)

Pour les Gateway situés sur des réseaux physiques différents, Bonjour ne sera d’aucune aide. La
cible directe recommandée est un nom MagicDNS Tailscale (de préférence) ou une
adresse IP tailnet stable.

Si le Gateway détecte qu’il s’exécute sous Tailscale, il publie
`tailnetDns` comme indication facultative pour les clients (y compris dans les balises étendues).
L’app macOS privilégie les noms MagicDNS par rapport aux adresses IP Tailscale brutes pour la
découverte du Gateway, ce qui reste fiable lorsque les adresses IP tailnet changent (redémarrage
des Node, réattribution CGNAT), car MagicDNS résout automatiquement l’adresse IP actuelle.

Pour l’appairage des Node mobiles, les indications de découverte n’assouplissent jamais la sécurité
du transport sur les routes tailnet/publiques :

- iOS/Android nécessitent toujours un chemin de connexion initial tailnet/public sécurisé
  (`wss://` ou Tailscale Serve/Funnel).
- Une adresse IP tailnet brute découverte est une indication de routage, et non une autorisation d’utiliser
  une connexion distante `ws://` en clair.
- La connexion directe privée au LAN via `ws://` reste prise en charge.
- Pour le chemin Tailscale le plus simple sur les Node mobiles, utilisez Tailscale Serve afin que
  la découverte et la configuration aboutissent toutes deux au même point de terminaison MagicDNS sécurisé.

### 3) Cible manuelle / SSH

En l’absence de route directe (ou si le mode direct est désactivé), les clients peuvent toujours
se connecter via SSH en transférant le port local loopback du Gateway. Voir
[Accès distant](/fr/gateway/remote).

## Sélection du transport (politique du client)

1. Si un point de terminaison direct appairé est configuré et accessible, utilisez-le.
2. Sinon, si la découverte trouve un Gateway sur `local.` ou le domaine étendu configuré,
   proposez en un geste le choix « utiliser ce Gateway » et enregistrez-le comme
   point de terminaison direct.
3. Sinon, si un DNS/une adresse IP tailnet est configuré, essayez le mode direct. Pour les Node mobiles sur
   des routes tailnet/publiques, le mode direct désigne un point de terminaison sécurisé, et non une connexion distante
   `ws://` en clair.
4. Sinon, utilisez SSH comme solution de secours.

## Appairage et authentification (transport direct)

Le Gateway est la source de vérité pour l’admission des Node/clients :

- Les demandes d’appairage sont créées/approuvées/rejetées dans le Gateway (voir
  [Appairage du Gateway](/fr/gateway/pairing)).
- Le Gateway applique l’authentification (jeton/paire de clés), les portées/ACL (il ne s’agit pas d’un simple
  proxy vers toutes les méthodes) et les limites de débit.

## Responsabilités par composant

- **Gateway** : annonce les balises de découverte, gère les décisions d’appairage et héberge
  le point de terminaison WS.
- **App macOS** : vous aide à choisir un Gateway, affiche les demandes d’appairage et utilise SSH
  uniquement comme solution de secours.
- **Node iOS/Android** : recherchent Bonjour pour plus de commodité et se connectent au
  WS du Gateway appairé.

## Voir aussi

- [Accès distant](/fr/gateway/remote)
- [Tailscale](/fr/gateway/tailscale)
- [Découverte Bonjour](/fr/gateway/bonjour)
