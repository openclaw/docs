---
read_when:
    - Débogage des problèmes de découverte Bonjour sur macOS/iOS
    - Modification des types de service mDNS, des enregistrements TXT ou de l’expérience utilisateur de découverte
summary: Découverte et débogage Bonjour/mDNS (balises Gateway, clients et modes de défaillance courants)
title: Découverte Bonjour
x-i18n:
    generated_at: "2026-04-26T11:27:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: b055021bdcd92740934823dea2acf758c6ec991a15c0a315426dc359a7eea093
    source_path: gateway/bonjour.md
    workflow: 15
---

# Découverte Bonjour / mDNS

OpenClaw utilise Bonjour (mDNS / DNS-SD) pour découvrir une Gateway active (point de terminaison WebSocket).
La navigation multicast `local.` est une **commodité limitée au LAN**. Le Plugin `bonjour`
intégré gère l’annonce sur le LAN et est activé par défaut. Pour la découverte inter-réseaux,
la même balise peut aussi être publiée via un domaine DNS-SD étendu configuré.
La découverte reste opportuniste et **ne remplace pas** la connectivité basée sur SSH ou Tailnet.

## Bonjour étendu (Unicast DNS-SD) sur Tailscale

Si le nœud et la Gateway sont sur des réseaux différents, le mDNS multicast ne franchira pas la
frontière. Vous pouvez conserver la même expérience de découverte en passant au **DNS-SD unicast**
(« Wide-Area Bonjour ») sur Tailscale.

Étapes générales :

1. Exécutez un serveur DNS sur l’hôte de la Gateway (accessible via Tailnet).
2. Publiez des enregistrements DNS-SD pour `_openclaw-gw._tcp` sous une zone dédiée
   (exemple : `openclaw.internal.`).
3. Configurez le **split DNS** Tailscale pour que votre domaine choisi soit résolu via ce
   serveur DNS pour les clients (y compris iOS).

OpenClaw prend en charge n’importe quel domaine de découverte ; `openclaw.internal.` n’est qu’un exemple.
Les nœuds iOS/Android parcourent à la fois `local.` et votre domaine étendu configuré.

### Configuration de la Gateway (recommandée)

```json5
{
  gateway: { bind: "tailnet" }, // tailnet uniquement (recommandé)
  discovery: { wideArea: { enabled: true } }, // active la publication DNS-SD étendue
}
```

### Configuration initiale du serveur DNS (hôte de la Gateway)

```bash
openclaw dns setup --apply
```

Cela installe CoreDNS et le configure pour :

- écouter sur le port 53 uniquement sur les interfaces Tailscale de la Gateway
- servir votre domaine choisi (exemple : `openclaw.internal.`) depuis `~/.openclaw/dns/<domain>.db`

Validez depuis une machine connectée au tailnet :

```bash
dns-sd -B _openclaw-gw._tcp openclaw.internal.
dig @<TAILNET_IPV4> -p 53 _openclaw-gw._tcp.openclaw.internal PTR +short
```

### Paramètres DNS Tailscale

Dans la console d’administration Tailscale :

- Ajoutez un nameserver pointant vers l’IP tailnet de la Gateway (UDP/TCP 53).
- Ajoutez un split DNS afin que votre domaine de découverte utilise ce nameserver.

Une fois que les clients acceptent le DNS tailnet, les nœuds iOS et la découverte CLI peuvent parcourir
`_openclaw-gw._tcp` dans votre domaine de découverte sans multicast.

### Sécurité du listener Gateway (recommandée)

Le port WS de la Gateway (par défaut `18789`) se lie à loopback par défaut. Pour l’accès LAN/tailnet,
liez-le explicitement et gardez l’authentification activée.

Pour les configurations tailnet uniquement :

- Définissez `gateway.bind: "tailnet"` dans `~/.openclaw/openclaw.json`.
- Redémarrez la Gateway (ou redémarrez l’application de barre de menus macOS).

## Ce qui s’annonce

Seule la Gateway annonce `_openclaw-gw._tcp`. L’annonce multicast LAN est
fournie par le Plugin `bonjour` intégré ; la publication DNS-SD étendue reste
gérée par la Gateway.

## Types de service

- `_openclaw-gw._tcp` — balise de transport Gateway (utilisée par les nœuds macOS/iOS/Android).

## Clés TXT (indices non secrets)

La Gateway annonce de petits indices non secrets pour rendre les flux UI pratiques :

- `role=gateway`
- `displayName=<nom convivial>`
- `lanHost=<hostname>.local`
- `gatewayPort=<port>` (Gateway WS + HTTP)
- `gatewayTls=1` (uniquement lorsque TLS est activé)
- `gatewayTlsSha256=<sha256>` (uniquement lorsque TLS est activé et que l’empreinte est disponible)
- `canvasPort=<port>` (uniquement lorsque l’hôte canvas est activé ; actuellement identique à `gatewayPort`)
- `transport=gateway`
- `tailnetDns=<magicdns>` (mode complet mDNS uniquement, indice facultatif lorsque Tailnet est disponible)
- `sshPort=<port>` (mode complet mDNS uniquement ; le DNS-SD étendu peut l’omettre)
- `cliPath=<path>` (mode complet mDNS uniquement ; le DNS-SD étendu l’écrit encore comme indice d’installation distante)

Remarques de sécurité :

- Les enregistrements TXT Bonjour/mDNS sont **non authentifiés**. Les clients ne doivent pas traiter TXT comme un routage faisant autorité.
- Les clients doivent router en utilisant le point de terminaison de service résolu (SRV + A/AAAA). Traitez `lanHost`, `tailnetDns`, `gatewayPort` et `gatewayTlsSha256` comme de simples indices.
- Le ciblage automatique SSH doit de même utiliser l’hôte de service résolu, et non des indices TXT seuls.
- Le pinning TLS ne doit jamais permettre à un `gatewayTlsSha256` annoncé de remplacer un pin précédemment stocké.
- Les nœuds iOS/Android doivent traiter les connexions directes basées sur la découverte comme **TLS uniquement** et exiger une confirmation explicite de l’utilisateur avant de faire confiance à une empreinte vue pour la première fois.

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

Si la navigation fonctionne mais que la résolution échoue, vous êtes généralement face à une politique LAN ou
à un problème de résolveur mDNS.

## Débogage dans les journaux de la Gateway

La Gateway écrit un fichier journal tournant (affiché au démarrage sous la forme
`gateway log file: ...`). Recherchez les lignes `bonjour:`, en particulier :

- `bonjour: advertise failed ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`
- `bonjour: watchdog detected non-announced service ...`
- `bonjour: disabling advertiser after ... failed restarts ...`

## Débogage sur un nœud iOS

Le nœud iOS utilise `NWBrowser` pour découvrir `_openclaw-gw._tcp`.

Pour capturer les journaux :

- Réglages → Gateway → Avancé → **Journaux de débogage de découverte**
- Réglages → Gateway → Avancé → **Journaux de découverte** → reproduire → **Copier**

Le journal inclut les transitions d’état du navigateur et les changements d’ensemble de résultats.

## Quand désactiver Bonjour

Désactivez Bonjour uniquement lorsque l’annonce multicast LAN est indisponible ou nuisible.
Le cas le plus courant est une Gateway exécutée derrière un réseau de pont Docker, WSL ou une
politique réseau qui supprime le multicast mDNS. Dans ces environnements, la Gateway reste
accessible via son URL publiée, SSH, Tailnet ou le DNS-SD étendu,
mais l’auto-découverte LAN n’est pas fiable.

Préférez la variable d’environnement existante lorsque le problème est lié au déploiement :

```bash
OPENCLAW_DISABLE_BONJOUR=1
```

Cela désactive l’annonce multicast LAN sans modifier la configuration du Plugin.
C’est sûr pour les images Docker, les fichiers de service, les scripts de lancement et le
débogage ponctuel, car le paramètre disparaît lorsque l’environnement disparaît.

Utilisez la configuration de Plugin uniquement lorsque vous voulez intentionnellement désactiver le
Plugin de découverte LAN intégré pour cette configuration OpenClaw :

```bash
openclaw plugins disable bonjour
```

## Pièges Docker

Docker Compose intégré définit `OPENCLAW_DISABLE_BONJOUR=1` pour le service Gateway
par défaut. Les réseaux de pont Docker ne transfèrent généralement pas le multicast mDNS
(`224.0.0.251:5353`) entre le conteneur et le LAN ; laisser Bonjour activé peut donc
produire des échecs répétés `probing` ou `announcing` de ciao sans rendre la découverte
fonctionnelle.

Pièges importants :

- Désactiver Bonjour n’arrête pas la Gateway. Cela arrête seulement l’annonce multicast LAN.
- Désactiver Bonjour ne modifie pas `gateway.bind` ; Docker utilise toujours par défaut
  `OPENCLAW_GATEWAY_BIND=lan` afin que le port hôte publié puisse fonctionner.
- Désactiver Bonjour ne désactive pas le DNS-SD étendu. Utilisez la découverte étendue
  ou Tailnet lorsque la Gateway et le nœud ne sont pas sur le même LAN.
- Réutiliser le même `OPENCLAW_CONFIG_DIR` hors de Docker n’hérite pas de la valeur par
  défaut de Compose sauf si l’environnement définit toujours `OPENCLAW_DISABLE_BONJOUR`.
- Définissez `OPENCLAW_DISABLE_BONJOUR=0` uniquement pour le réseau hôte, macvlan ou un autre
  réseau où le multicast mDNS passe de manière avérée.

## Dépannage de Bonjour désactivé

Si un nœud ne découvre plus automatiquement la Gateway après une configuration Docker :

1. Confirmez si la Gateway supprime intentionnellement l’annonce LAN :

   ```bash
   docker compose config | grep OPENCLAW_DISABLE_BONJOUR
   ```

2. Confirmez que la Gateway elle-même est joignable via le port publié :

   ```bash
   curl -fsS http://127.0.0.1:18789/healthz
   ```

3. Utilisez une cible directe lorsque Bonjour est désactivé :
   - Control UI ou outils locaux : `http://127.0.0.1:18789`
   - Clients LAN : `http://<gateway-host>:18789`
   - Clients inter-réseaux : Tailnet MagicDNS, IP Tailnet, tunnel SSH ou
     DNS-SD étendu

4. Si vous avez délibérément activé Bonjour dans Docker avec
   `OPENCLAW_DISABLE_BONJOUR=0`, testez le multicast depuis l’hôte :

   ```bash
   dns-sd -B _openclaw-gw._tcp local.
   ```

   Si la navigation est vide ou si les journaux Gateway montrent des annulations
   répétées du watchdog ciao, remettez `OPENCLAW_DISABLE_BONJOUR=1` et utilisez une route directe ou
   Tailnet.

## Modes de défaillance courants

- **Bonjour ne traverse pas les réseaux** : utilisez Tailnet ou SSH.
- **Multicast bloqué** : certains réseaux Wi‑Fi désactivent mDNS.
- **Annonceur bloqué en probing/announcing** : les hôtes avec multicast bloqué,
  les ponts de conteneur, WSL ou les changements d’interface peuvent laisser l’annonceur ciao dans un
  état non annoncé. OpenClaw réessaie quelques fois puis désactive Bonjour
  pour le processus Gateway courant au lieu de redémarrer l’annonceur indéfiniment.
- **Réseau de pont Docker** : Docker Compose intégré désactive Bonjour par
  défaut avec `OPENCLAW_DISABLE_BONJOUR=1`. Définissez-le à `0` uniquement pour le réseau hôte,
  macvlan ou un autre réseau compatible mDNS.
- **Veille / changements d’interface** : macOS peut temporairement perdre les résultats mDNS ; réessayez.
- **La navigation fonctionne mais la résolution échoue** : gardez des noms de machine simples (évitez les emojis ou
  la ponctuation), puis redémarrez la Gateway. Le nom d’instance de service dérive du
  nom d’hôte, donc des noms trop complexes peuvent perturber certains résolveurs.

## Noms d’instance échappés (`\032`)

Bonjour/DNS-SD échappe souvent les octets dans les noms d’instance de service en séquences décimales `\DDD`
(par ex. les espaces deviennent `\032`).

- C’est normal au niveau du protocole.
- Les UI doivent décoder pour l’affichage (iOS utilise `BonjourEscapes.decode`).

## Désactivation / configuration

- `openclaw plugins disable bonjour` désactive l’annonce multicast LAN en désactivant le Plugin intégré.
- `openclaw plugins enable bonjour` restaure le Plugin de découverte LAN par défaut.
- `OPENCLAW_DISABLE_BONJOUR=1` désactive l’annonce multicast LAN sans modifier la configuration du Plugin ; les valeurs vraies acceptées sont `1`, `true`, `yes` et `on` (hérité : `OPENCLAW_DISABLE_BONJOUR`).
- Docker Compose définit `OPENCLAW_DISABLE_BONJOUR=1` par défaut pour le réseau de pont ; remplacez par `OPENCLAW_DISABLE_BONJOUR=0` uniquement lorsque le multicast mDNS est disponible.
- `gateway.bind` dans `~/.openclaw/openclaw.json` contrôle le mode de liaison de la Gateway.
- `OPENCLAW_SSH_PORT` remplace le port SSH lorsque `sshPort` est annoncé (hérité : `OPENCLAW_SSH_PORT`).
- `OPENCLAW_TAILNET_DNS` publie un indice MagicDNS dans TXT lorsque le mode complet mDNS est activé (hérité : `OPENCLAW_TAILNET_DNS`).
- `OPENCLAW_CLI_PATH` remplace le chemin CLI annoncé (hérité : `OPENCLAW_CLI_PATH`).

## Documentation connexe

- Politique de découverte et sélection de transport : [Découverte](/fr/gateway/discovery)
- Appairage et approbations des nœuds : [Appairage Gateway](/fr/gateway/pairing)
