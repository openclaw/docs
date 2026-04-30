---
read_when:
    - Débogage des problèmes de découverte Bonjour sur macOS/iOS
    - Modifier les types de service mDNS, les enregistrements TXT ou l’expérience de découverte
summary: Découverte Bonjour/mDNS + débogage (balises Gateway, clients et modes de défaillance courants)
title: Découverte Bonjour
x-i18n:
    generated_at: "2026-04-30T07:24:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0720451843aae0509949324e51f3a23dc69e366e68de851c595ce76c8ab0eec9
    source_path: gateway/bonjour.md
    workflow: 16
---

# Découverte Bonjour / mDNS

OpenClaw utilise Bonjour (mDNS / DNS‑SD) pour découvrir un Gateway actif (point de terminaison WebSocket).
La navigation multicast `local.` est une **commodité limitée au LAN**. Le plugin `bonjour`
fourni possède la diffusion LAN et est activé par défaut. Pour la découverte inter-réseaux,
la même balise peut aussi être publiée via un domaine DNS-SD étendu configuré.
La découverte reste au mieux approximative et ne remplace **pas** la connectivité basée sur SSH ou Tailnet.

## Bonjour étendu (DNS-SD unicast) sur Tailscale

Si le node et le Gateway sont sur des réseaux différents, le mDNS multicast ne franchira pas la
limite. Vous pouvez conserver la même expérience de découverte en passant au **DNS‑SD unicast**
(« Bonjour étendu ») sur Tailscale.

Étapes générales :

1. Exécutez un serveur DNS sur l’hôte du Gateway (accessible via Tailnet).
2. Publiez des enregistrements DNS‑SD pour `_openclaw-gw._tcp` sous une zone dédiée
   (exemple : `openclaw.internal.`).
3. Configurez le **DNS fractionné** Tailscale afin que le domaine choisi soit résolu via ce
   serveur DNS pour les clients (y compris iOS).

OpenClaw prend en charge n’importe quel domaine de découverte ; `openclaw.internal.` n’est qu’un exemple.
Les nodes iOS/Android parcourent à la fois `local.` et votre domaine étendu configuré.

### Configuration du Gateway (recommandé)

```json5
{
  gateway: { bind: "tailnet" }, // tailnet-only (recommended)
  discovery: { wideArea: { enabled: true } }, // enables wide-area DNS-SD publishing
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
- Ajoutez un DNS fractionné afin que votre domaine de découverte utilise ce serveur de noms.

Une fois que les clients acceptent le DNS tailnet, les nodes iOS et la découverte CLI peuvent parcourir
`_openclaw-gw._tcp` dans votre domaine de découverte sans multicast.

### Sécurité de l’écouteur du Gateway (recommandé)

Le port WS du Gateway (par défaut `18789`) se lie à loopback par défaut. Pour l’accès LAN/tailnet,
liez-le explicitement et conservez l’authentification activée.

Pour les configurations tailnet uniquement :

- Définissez `gateway.bind: "tailnet"` dans `~/.openclaw/openclaw.json`.
- Redémarrez le Gateway (ou redémarrez l’application de barre de menus macOS).

## Ce qui diffuse

Seul le Gateway diffuse `_openclaw-gw._tcp`. La diffusion multicast LAN est
fournie par le plugin `bonjour` inclus ; la publication DNS-SD étendue reste
propriété du Gateway.

## Types de service

- `_openclaw-gw._tcp` — balise de transport du Gateway (utilisée par les nodes macOS/iOS/Android).

## Clés TXT (indices non secrets)

Le Gateway diffuse de petits indices non secrets pour faciliter les flux d’interface utilisateur :

- `role=gateway`
- `displayName=<friendly name>`
- `lanHost=<hostname>.local`
- `gatewayPort=<port>` (Gateway WS + HTTP)
- `gatewayTls=1` (uniquement lorsque TLS est activé)
- `gatewayTlsSha256=<sha256>` (uniquement lorsque TLS est activé et que l’empreinte est disponible)
- `canvasPort=<port>` (uniquement lorsque l’hôte canvas est activé ; actuellement identique à `gatewayPort`)
- `transport=gateway`
- `tailnetDns=<magicdns>` (mode mDNS complet uniquement, indice facultatif lorsque Tailnet est disponible)
- `sshPort=<port>` (mode mDNS complet uniquement ; le DNS-SD étendu peut l’omettre)
- `cliPath=<path>` (mode mDNS complet uniquement ; le DNS-SD étendu l’écrit quand même comme indice d’installation distante)

Notes de sécurité :

- Les enregistrements TXT Bonjour/mDNS ne sont **pas authentifiés**. Les clients ne doivent pas considérer TXT comme une source faisant autorité pour le routage.
- Les clients doivent router à l’aide du point de terminaison de service résolu (SRV + A/AAAA). Traitez `lanHost`, `tailnetDns`, `gatewayPort` et `gatewayTlsSha256` uniquement comme des indices.
- Le ciblage automatique SSH doit également utiliser l’hôte de service résolu, et non des indices TXT seuls.
- L’épinglage TLS ne doit jamais permettre à un `gatewayTlsSha256` diffusé de remplacer une empreinte déjà stockée.
- Les nodes iOS/Android doivent traiter les connexions directes basées sur la découverte comme **TLS uniquement** et exiger une confirmation explicite de l’utilisateur avant de faire confiance à une première empreinte.

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

Le Gateway écrit un fichier journal rotatif (affiché au démarrage comme
`gateway log file: ...`). Recherchez les lignes `bonjour:`, en particulier :

- `bonjour: advertise failed ...`
- `bonjour: suppressing ciao cancellation ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`
- `bonjour: watchdog detected non-announced service ...`
- `bonjour: disabling advertiser after ... failed restarts ...`

Bonjour utilise le nom d’hôte système pour l’hôte `.local` diffusé lorsqu’il s’agit d’une
étiquette DNS valide. Si le nom d’hôte système contient des espaces, des traits de soulignement ou un autre
caractère invalide pour une étiquette DNS, OpenClaw revient à `openclaw.local`. Définissez
`OPENCLAW_MDNS_HOSTNAME=<name>` avant de démarrer le Gateway lorsque vous avez besoin d’une
étiquette d’hôte explicite.

## Débogage sur un node iOS

Le node iOS utilise `NWBrowser` pour découvrir `_openclaw-gw._tcp`.

Pour capturer les journaux :

- Settings → Gateway → Advanced → **Discovery Debug Logs**
- Settings → Gateway → Advanced → **Discovery Logs** → reproduire → **Copy**

Le journal inclut les transitions d’état du navigateur et les changements de l’ensemble de résultats.

## Quand désactiver Bonjour

Désactivez Bonjour uniquement lorsque la diffusion multicast LAN est indisponible ou nuisible.
Le cas courant est un Gateway exécuté derrière un réseau bridge Docker, WSL ou une
politique réseau qui bloque le multicast mDNS. Dans ces environnements, le Gateway reste
accessible via son URL publiée, SSH, Tailnet ou DNS-SD étendu,
mais la découverte automatique LAN n’est pas fiable.

Préférez la surcharge d’environnement existante lorsque le problème est lié au déploiement :

```bash
OPENCLAW_DISABLE_BONJOUR=1
```

Cela désactive la diffusion multicast LAN sans modifier la configuration du plugin.
C’est sûr pour les images Docker, fichiers de service, scripts de lancement et débogages ponctuels,
car le paramètre disparaît avec l’environnement.

N’utilisez la configuration du plugin que lorsque vous voulez intentionnellement désactiver le
plugin de découverte LAN inclus pour cette configuration OpenClaw :

```bash
openclaw plugins disable bonjour
```

## Pièges Docker

Le plugin Bonjour inclus désactive automatiquement la diffusion multicast LAN dans les conteneurs détectés
lorsque `OPENCLAW_DISABLE_BONJOUR` n’est pas défini. Les réseaux bridge Docker
ne relaient généralement pas le multicast mDNS (`224.0.0.251:5353`) entre le conteneur
et le LAN, de sorte que la diffusion depuis le conteneur permet rarement à la découverte de fonctionner.

Pièges importants :

- La désactivation de Bonjour n’arrête pas le Gateway. Elle arrête uniquement la diffusion multicast LAN.
- La désactivation de Bonjour ne modifie pas `gateway.bind` ; Docker utilise toujours par défaut
  `OPENCLAW_GATEWAY_BIND=lan`, afin que le port hôte publié puisse fonctionner.
- La désactivation de Bonjour ne désactive pas le DNS-SD étendu. Utilisez la découverte étendue
  ou Tailnet lorsque le Gateway et le node ne sont pas sur le même LAN.
- La réutilisation du même `OPENCLAW_CONFIG_DIR` hors Docker ne conserve pas la
  politique de désactivation automatique du conteneur.
- Définissez `OPENCLAW_DISABLE_BONJOUR=0` uniquement pour le réseau hôte, macvlan ou un autre
  réseau où le multicast mDNS est connu comme fonctionnel ; définissez-le sur `1` pour forcer la désactivation.

## Dépannage de Bonjour désactivé

Si un node ne découvre plus automatiquement le Gateway après une configuration Docker :

1. Confirmez si le Gateway s’exécute en mode automatique, forcé activé ou forcé désactivé :

   ```bash
   docker compose config | grep OPENCLAW_DISABLE_BONJOUR
   ```

2. Confirmez que le Gateway lui-même est accessible via le port publié :

   ```bash
   curl -fsS http://127.0.0.1:18789/healthz
   ```

3. Utilisez une cible directe lorsque Bonjour est désactivé :
   - Interface utilisateur de contrôle ou outils locaux : `http://127.0.0.1:18789`
   - Clients LAN : `http://<gateway-host>:18789`
   - Clients inter-réseaux : Tailnet MagicDNS, IP Tailnet, tunnel SSH ou
     DNS-SD étendu

4. Si vous avez volontairement activé Bonjour dans Docker avec
   `OPENCLAW_DISABLE_BONJOUR=0`, testez le multicast depuis l’hôte :

   ```bash
   dns-sd -B _openclaw-gw._tcp local.
   ```

   Si la navigation est vide ou si les journaux du Gateway affichent des annulations
   répétées du watchdog ciao, restaurez `OPENCLAW_DISABLE_BONJOUR=1` et utilisez une route directe ou
   Tailnet.

## Modes de défaillance courants

- **Bonjour ne traverse pas les réseaux** : utilisez Tailnet ou SSH.
- **Multicast bloqué** : certains réseaux Wi‑Fi désactivent mDNS.
- **Annonceur bloqué en sondage/annonce** : les hôtes avec multicast bloqué,
  les bridges de conteneurs, WSL ou des changements d’interface peuvent laisser l’annonceur ciao dans un
  état non annoncé. OpenClaw réessaie quelques fois, puis désactive Bonjour
  pour le processus Gateway courant au lieu de redémarrer l’annonceur indéfiniment.
- **Réseau bridge Docker** : Bonjour se désactive automatiquement dans les conteneurs détectés.
  Définissez `OPENCLAW_DISABLE_BONJOUR=0` uniquement pour le réseau hôte, macvlan ou un autre
  réseau compatible mDNS.
- **Veille / changements d’interface** : macOS peut temporairement perdre les résultats mDNS ; réessayez.
- **La navigation fonctionne mais la résolution échoue** : gardez des noms de machine simples (évitez les emojis ou
  la ponctuation), puis redémarrez le Gateway. Le nom de l’instance de service dérive du
  nom d’hôte, donc des noms trop complexes peuvent perturber certains résolveurs.

## Noms d’instance échappés (`\032`)

Bonjour/DNS‑SD échappe souvent les octets dans les noms d’instance de service sous forme de séquences décimales `\DDD`
(par exemple, les espaces deviennent `\032`).

- C’est normal au niveau du protocole.
- Les interfaces utilisateur doivent décoder pour l’affichage (iOS utilise `BonjourEscapes.decode`).

## Désactivation / configuration

- `openclaw plugins disable bonjour` désactive la diffusion multicast LAN en désactivant le plugin inclus.
- `openclaw plugins enable bonjour` restaure le plugin de découverte LAN par défaut.
- `OPENCLAW_DISABLE_BONJOUR=1` désactive la diffusion multicast LAN sans modifier la configuration du plugin ; les valeurs truthy acceptées sont `1`, `true`, `yes` et `on` (héritage : `OPENCLAW_DISABLE_BONJOUR`).
- `OPENCLAW_DISABLE_BONJOUR=0` force l’activation de la diffusion multicast LAN, y compris dans les conteneurs détectés ; les valeurs falsy acceptées sont `0`, `false`, `no` et `off`.
- Lorsque `OPENCLAW_DISABLE_BONJOUR` n’est pas défini, Bonjour diffuse sur les hôtes normaux et se désactive automatiquement dans les conteneurs détectés.
- `gateway.bind` dans `~/.openclaw/openclaw.json` contrôle le mode de liaison du Gateway.
- `OPENCLAW_SSH_PORT` remplace le port SSH lorsque `sshPort` est diffusé (héritage : `OPENCLAW_SSH_PORT`).
- `OPENCLAW_TAILNET_DNS` publie un indice MagicDNS dans TXT lorsque le mode mDNS complet est activé (héritage : `OPENCLAW_TAILNET_DNS`).
- `OPENCLAW_CLI_PATH` remplace le chemin CLI diffusé (héritage : `OPENCLAW_CLI_PATH`).

## Documentation associée

- Politique de découverte et sélection du transport : [Découverte](/fr/gateway/discovery)
- Appairage de nodes + approbations : [Appairage Gateway](/fr/gateway/pairing)
