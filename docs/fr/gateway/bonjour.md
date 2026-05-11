---
read_when:
    - Débogage des problèmes de découverte Bonjour sur macOS/iOS
    - Modifier les types de services mDNS, les enregistrements TXT ou l’UX de découverte
summary: Découverte et débogage de Bonjour/mDNS (balises Gateway, clients et modes de défaillance courants)
title: Découverte Bonjour
x-i18n:
    generated_at: "2026-05-11T20:34:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 03bd9403591a389c06d3131e4c110d4ccf711eee56cbe9a5c9baed2b6df8fb80
    source_path: gateway/bonjour.md
    workflow: 16
---

OpenClaw peut utiliser Bonjour (mDNS / DNS-SD) pour découvrir un Gateway actif (point de terminaison WebSocket).
La navigation multicast `local.` est une **commodité limitée au LAN**. Le Plugin `bonjour`
intégré possède la diffusion LAN. Il démarre automatiquement sur les hôtes macOS et est opt-in sur
Linux, Windows et les déploiements de Gateway conteneurisés. Pour la découverte inter-réseaux, le même
beacon peut également être publié via un domaine DNS-SD étendu configuré. La découverte
reste au mieux et ne remplace **pas** la connectivité basée sur SSH ou Tailnet.

## Bonjour étendu (DNS-SD unicast) sur Tailscale

Si le nœud et le gateway sont sur des réseaux différents, le mDNS multicast ne franchira pas la
limite. Vous pouvez conserver la même UX de découverte en passant au **DNS-SD unicast**
(« Bonjour étendu ») sur Tailscale.

Étapes générales :

1. Exécutez un serveur DNS sur l’hôte du gateway (accessible via Tailnet).
2. Publiez les enregistrements DNS-SD pour `_openclaw-gw._tcp` sous une zone dédiée
   (exemple : `openclaw.internal.`).
3. Configurez le **split DNS** Tailscale afin que le domaine choisi soit résolu via ce
   serveur DNS pour les clients (y compris iOS).

OpenClaw prend en charge n’importe quel domaine de découverte ; `openclaw.internal.` n’est qu’un exemple.
Les nœuds iOS/Android parcourent à la fois `local.` et votre domaine étendu configuré.

### Configuration du Gateway (recommandée)

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

- Ajoutez un serveur de noms pointant vers l’adresse IP tailnet du gateway (UDP/TCP 53).
- Ajoutez un split DNS afin que votre domaine de découverte utilise ce serveur de noms.

Une fois que les clients acceptent le DNS tailnet, les nœuds iOS et la découverte CLI peuvent parcourir
`_openclaw-gw._tcp` dans votre domaine de découverte sans multicast.

### Sécurité de l’écouteur du Gateway (recommandée)

Le port WS du Gateway (`18789` par défaut) se lie à loopback par défaut. Pour l’accès LAN/tailnet,
liez-le explicitement et gardez l’authentification activée.

Pour les configurations limitées au tailnet :

- Définissez `gateway.bind: "tailnet"` dans `~/.openclaw/openclaw.json`.
- Redémarrez le Gateway (ou redémarrez l’application de barre de menus macOS).

## Ce qui annonce

Seul le Gateway annonce `_openclaw-gw._tcp`. La diffusion multicast LAN est
fournie par le Plugin `bonjour` intégré lorsque le Plugin est activé ; la publication
DNS-SD étendue reste détenue par le Gateway.

## Types de service

- `_openclaw-gw._tcp` - beacon de transport du gateway (utilisé par les nœuds macOS/iOS/Android).

## Clés TXT (indices non secrets)

Le Gateway annonce de petits indices non secrets pour faciliter les flux d’interface utilisateur :

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
- `cliPath=<path>` (mode mDNS complet uniquement ; le DNS-SD étendu l’écrit toujours comme indice d’installation distante)

Notes de sécurité :

- Les enregistrements TXT Bonjour/mDNS sont **non authentifiés**. Les clients ne doivent pas considérer TXT comme une source de routage faisant autorité.
- Les clients doivent router en utilisant le point de terminaison de service résolu (SRV + A/AAAA). Traitez `lanHost`, `tailnetDns`, `gatewayPort` et `gatewayTlsSha256` uniquement comme des indices.
- Le ciblage automatique SSH doit de même utiliser l’hôte de service résolu, et non des indices TXT uniquement.
- L’épinglage TLS ne doit jamais autoriser un `gatewayTlsSha256` annoncé à remplacer une épingle précédemment stockée.
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

Le Gateway écrit un fichier journal rotatif (affiché au démarrage sous la forme
`gateway log file: ...`). Recherchez les lignes `bonjour:`, en particulier :

- `bonjour: advertise failed ...`
- `bonjour: suppressing ciao cancellation ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`
- `bonjour: watchdog detected non-announced service ...`
- `bonjour: disabling advertiser after ... failed restarts ...`

Le chien de garde traite les états actifs `probing`, `announcing` et les renommages récents dus à des conflits comme
des états en cours. Si le service n’atteint jamais `announced`, OpenClaw finit par
recréer l’annonceur puis, après des échecs répétés, désactive Bonjour pour ce
processus Gateway au lieu de réannoncer indéfiniment.

Bonjour utilise le nom d’hôte système pour l’hôte `.local` annoncé lorsqu’il s’agit d’une
étiquette DNS valide. Si le nom d’hôte système contient des espaces, des underscores ou un autre
caractère non valide pour une étiquette DNS, OpenClaw se rabat sur `openclaw.local`. Définissez
`OPENCLAW_MDNS_HOSTNAME=<name>` avant de démarrer le Gateway lorsque vous avez besoin d’une
étiquette d’hôte explicite.

## Débogage sur un nœud iOS

Le nœud iOS utilise `NWBrowser` pour découvrir `_openclaw-gw._tcp`.

Pour capturer les journaux :

- Réglages → Gateway → Avancé → **Journaux de débogage de découverte**
- Réglages → Gateway → Avancé → **Journaux de découverte** → reproduire → **Copier**

Le journal inclut les transitions d’état du navigateur et les changements de l’ensemble de résultats.

## Quand activer Bonjour

Bonjour démarre automatiquement lors du démarrage d’un Gateway sans configuration sur les hôtes macOS, car
l’application locale et les nœuds iOS/Android à proximité s’appuient couramment sur la découverte sur le même LAN.

Activez explicitement Bonjour lorsque la découverte automatique sur le même LAN est utile sur Linux,
Windows ou un autre hôte non macOS :

```bash
openclaw plugins enable bonjour
```

Lorsqu’il est activé, Bonjour utilise `discovery.mdns.mode` pour décider de la quantité de métadonnées TXT
à publier. Le mode par défaut est `minimal` ; utilisez `full` uniquement lorsque les clients locaux ont besoin
des indices `cliPath` ou `sshPort`, et utilisez `off` pour supprimer le multicast LAN sans
modifier l’activation du Plugin.

## Quand désactiver Bonjour

Laissez Bonjour désactivé lorsque la diffusion multicast LAN est inutile, indisponible
ou nuisible. Les cas courants sont les serveurs non macOS, le réseau bridge Docker,
WSL ou une politique réseau qui bloque le multicast mDNS. Dans ces environnements, le
Gateway reste accessible via son URL publiée, SSH, Tailnet ou le
DNS-SD étendu, mais la découverte automatique LAN n’est pas fiable.

Préférez la surcharge d’environnement existante lorsque le problème est propre au déploiement :

```bash
OPENCLAW_DISABLE_BONJOUR=1
```

Cela désactive la diffusion multicast LAN sans modifier la configuration du Plugin.
C’est sûr pour les images Docker, les fichiers de service, les scripts de lancement et le
débogage ponctuel, car le réglage disparaît lorsque l’environnement disparaît.

Utilisez la configuration du Plugin lorsque vous voulez intentionnellement désactiver le Plugin de
découverte LAN intégré pour cette configuration OpenClaw :

```bash
openclaw plugins disable bonjour
```

## Pièges Docker

Le Plugin Bonjour intégré désactive automatiquement la diffusion multicast LAN dans les
conteneurs détectés lorsque `OPENCLAW_DISABLE_BONJOUR` n’est pas défini. Les réseaux bridge Docker
ne transmettent généralement pas le multicast mDNS (`224.0.0.251:5353`) entre le conteneur
et le LAN ; annoncer depuis le conteneur permet donc rarement à la découverte de fonctionner.

Pièges importants :

- Bonjour démarre automatiquement sur les hôtes macOS et est opt-in ailleurs. Le laisser
  désactivé n’arrête pas le Gateway ; cela ignore seulement la diffusion multicast LAN.
- Désactiver Bonjour ne modifie pas `gateway.bind` ; Docker utilise toujours par défaut
  `OPENCLAW_GATEWAY_BIND=lan` afin que le port hôte publié puisse fonctionner.
- Désactiver Bonjour ne désactive pas le DNS-SD étendu. Utilisez la découverte étendue
  ou Tailnet lorsque le Gateway et le nœud ne sont pas sur le même LAN.
- Réutiliser le même `OPENCLAW_CONFIG_DIR` en dehors de Docker ne conserve pas la
  politique de désactivation automatique du conteneur.
- Définissez `OPENCLAW_DISABLE_BONJOUR=0` uniquement pour le réseau hôte, macvlan ou un autre
  réseau où le multicast mDNS est connu pour passer ; définissez-le sur `1` pour forcer la désactivation.

## Résolution des problèmes de Bonjour désactivé

Si un nœud ne découvre plus automatiquement le Gateway après une configuration Docker :

1. Confirmez si le Gateway fonctionne en mode auto, forcé activé ou forcé désactivé :

   ```bash
   docker compose config | grep OPENCLAW_DISABLE_BONJOUR
   ```

2. Confirmez que le Gateway lui-même est accessible via le port publié :

   ```bash
   curl -fsS http://127.0.0.1:18789/healthz
   ```

3. Utilisez une cible directe lorsque Bonjour est désactivé :
   - Interface de contrôle ou outils locaux : `http://127.0.0.1:18789`
   - Clients LAN : `http://<gateway-host>:18789`
   - Clients inter-réseaux : MagicDNS Tailnet, IP Tailnet, tunnel SSH ou
     DNS-SD étendu

4. Si vous avez délibérément activé le Plugin Bonjour dans Docker et forcé l’annonce
   avec `OPENCLAW_DISABLE_BONJOUR=0`, testez le multicast depuis l’hôte :

   ```bash
   dns-sd -B _openclaw-gw._tcp local.
   ```

   Si la navigation est vide ou si les journaux du Gateway affichent des annulations répétées du chien de garde
   ciao, restaurez `OPENCLAW_DISABLE_BONJOUR=1` et utilisez une route directe ou
   Tailnet.

## Modes de défaillance courants

- **Bonjour ne traverse pas les réseaux** : utilisez Tailnet ou SSH.
- **Multicast bloqué** : certains réseaux Wi-Fi désactivent mDNS.
- **Annonceur bloqué en probing/announcing** : les hôtes avec multicast bloqué,
  les bridges de conteneurs, WSL ou les changements d’interface peuvent laisser l’annonceur ciao dans un
  état non annoncé. OpenClaw réessaie quelques fois puis désactive Bonjour
  pour le processus Gateway actuel au lieu de redémarrer l’annonceur indéfiniment.
- **Réseau bridge Docker** : Bonjour se désactive automatiquement dans les conteneurs détectés.
  Définissez `OPENCLAW_DISABLE_BONJOUR=0` uniquement pour l’hôte, macvlan ou un autre
  réseau compatible mDNS.
- **Veille / changements d’interface** : macOS peut temporairement perdre les résultats mDNS ; réessayez.
- **La navigation fonctionne mais la résolution échoue** : gardez des noms de machine simples (évitez les emojis ou
  la ponctuation), puis redémarrez le Gateway. Le nom d’instance de service dérive du
  nom d’hôte ; des noms trop complexes peuvent donc perturber certains résolveurs.

## Noms d’instance échappés (`\032`)

Bonjour/DNS-SD échappe souvent les octets dans les noms d’instance de service sous forme de séquences décimales `\DDD`
(par exemple, les espaces deviennent `\032`).

- C’est normal au niveau du protocole.
- Les interfaces utilisateur doivent décoder pour l’affichage (iOS utilise `BonjourEscapes.decode`).

## Activation / désactivation / configuration

- Les hôtes macOS lancent automatiquement par défaut le Plugin de découverte du réseau local inclus.
- `openclaw plugins enable bonjour` active le Plugin de découverte du réseau local inclus sur les hôtes où il n’est pas activé par défaut.
- `openclaw plugins disable bonjour` désactive la publicité multicast sur le réseau local en désactivant le Plugin inclus.
- `OPENCLAW_DISABLE_BONJOUR=1` désactive la publicité multicast sur le réseau local sans modifier la configuration du Plugin ; les valeurs truthy acceptées sont `1`, `true`, `yes` et `on` (hérité : `OPENCLAW_DISABLE_BONJOUR`).
- `OPENCLAW_DISABLE_BONJOUR=0` force l’activation de la publicité multicast sur le réseau local, y compris dans les conteneurs détectés ; les valeurs falsy acceptées sont `0`, `false`, `no` et `off`.
- Lorsque le Plugin Bonjour est activé et que `OPENCLAW_DISABLE_BONJOUR` n’est pas défini, Bonjour annonce sur les hôtes normaux et se désactive automatiquement dans les conteneurs détectés.
- `gateway.bind` dans `~/.openclaw/openclaw.json` contrôle le mode de liaison du Gateway.
- `OPENCLAW_SSH_PORT` remplace le port SSH lorsque `sshPort` est annoncé (hérité : `OPENCLAW_SSH_PORT`).
- `OPENCLAW_TAILNET_DNS` publie un indice MagicDNS dans TXT lorsque le mode complet mDNS est activé (hérité : `OPENCLAW_TAILNET_DNS`).
- `OPENCLAW_CLI_PATH` remplace le chemin de CLI annoncé (hérité : `OPENCLAW_CLI_PATH`).

## Documentation associée

- Politique de découverte et sélection du transport : [Découverte](/fr/gateway/discovery)
- Appairage de Node + approbations : [Appairage du Gateway](/fr/gateway/pairing)
