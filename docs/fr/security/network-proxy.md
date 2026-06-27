---
read_when:
    - Vous souhaitez une défense en profondeur contre les attaques SSRF et de reliaison DNS
    - Configuration d’un proxy direct externe pour le trafic d’exécution OpenClaw
summary: Comment acheminer le trafic HTTP et WebSocket du runtime OpenClaw via un proxy de filtrage géré par l’opérateur
title: Proxy réseau
x-i18n:
    generated_at: "2026-06-27T18:13:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3fc68d950037922ba3dc983c94a71bac3374750a02ef25f2c046cf782410be68
    source_path: security/network-proxy.md
    workflow: 16
---

OpenClaw peut acheminer le trafic HTTP et WebSocket d’exécution via un proxy direct géré par l’opérateur. Il s’agit d’une défense en profondeur facultative pour les déploiements qui veulent un contrôle centralisé des sorties réseau, une protection SSRF renforcée et une meilleure auditabilité réseau.

OpenClaw ne fournit pas, ne télécharge pas, ne démarre pas, ne configure pas et ne certifie pas de proxy. Vous exécutez la technologie de proxy adaptée à votre environnement, et OpenClaw y achemine les clients HTTP et WebSocket locaux au processus ordinaires.

## Pourquoi utiliser un proxy

Un proxy donne aux opérateurs un point de contrôle réseau unique pour le trafic HTTP et WebSocket sortant. Cela peut être utile même en dehors du renforcement SSRF :

- Politique centrale : maintenez une seule politique de sortie réseau au lieu de compter sur chaque point d’appel HTTP d’application pour appliquer correctement les règles réseau.
- Vérifications au moment de la connexion : évaluez la destination après la résolution DNS et immédiatement avant que le proxy ouvre la connexion amont.
- Défense contre le DNS rebinding : réduisez l’écart entre une vérification DNS au niveau de l’application et la connexion sortante réelle.
- Couverture JavaScript plus large : acheminez les clients ordinaires `fetch`, `node:http`, `node:https`, WebSocket, axios, got, node-fetch et similaires par le même chemin.
- Auditabilité : journalisez les destinations autorisées et refusées à la frontière de sortie.
- Contrôle opérationnel : appliquez des règles de destination, une segmentation réseau, des limites de débit ou des listes d’autorisation sortantes sans reconstruire OpenClaw.

Le routage par proxy est un garde-fou au niveau du processus pour les sorties HTTP et WebSocket normales. Il donne aux opérateurs un chemin à échec fermé pour acheminer les clients HTTP JavaScript pris en charge via leur propre proxy de filtrage, mais ce n’est pas un bac à sable réseau au niveau du système d’exploitation et cela ne fait pas certifier par OpenClaw la politique de destination du proxy.

## Comment OpenClaw achemine le trafic

Lorsque `proxy.enabled=true` et qu’une URL de proxy est configurée, les processus d’exécution protégés tels que `openclaw gateway run`, `openclaw node run` et `openclaw agent --local` acheminent les sorties HTTP et WebSocket normales via le proxy configuré :

```text
Processus OpenClaw
  fetch                  -> proxy de filtrage géré par l’opérateur -> Internet public
  node:http et https     -> proxy de filtrage géré par l’opérateur -> Internet public
  clients WebSocket      -> proxy de filtrage géré par l’opérateur -> Internet public
```

Le contrat public est le comportement de routage, pas les hooks Node internes utilisés pour l’implémenter. Les clients WebSocket du plan de contrôle OpenClaw Gateway utilisent un chemin direct étroit pour le trafic RPC Gateway en local loopback lorsque l’URL du Gateway utilise `localhost` ou une IP de loopback littérale comme `127.0.0.1` ou `[::1]`. Ce chemin du plan de contrôle doit pouvoir atteindre les Gateway en loopback même lorsque le proxy de l’opérateur bloque les destinations loopback. Les requêtes HTTP et WebSocket d’exécution normales utilisent toujours le proxy configuré.

En interne, OpenClaw installe Proxyline comme runtime de routage au niveau du processus pour cette fonctionnalité. Proxyline couvre `fetch`, les clients adossés à undici, les appelants du noyau Node `node:http` / `node:https`, les clients WebSocket courants et les tunnels CONNECT créés par des helpers. Le mode proxy géré remplace les agents HTTP Node fournis par l’appelant afin que les agents explicites ne contournent pas accidentellement le proxy de l’opérateur.

Certains plugins possèdent des transports personnalisés qui nécessitent un câblage explicite du proxy même lorsqu’un routage au niveau du processus existe. Par exemple, le transport Bot API de Telegram utilise son propre dispatcher HTTP/1 undici et respecte donc l’environnement de proxy du processus ainsi que le fallback géré `OPENCLAW_PROXY_URL` dans ce chemin de transport propre au propriétaire.

L’URL du proxy elle-même peut utiliser `http://` ou `https://`. Ces schémas décrivent la connexion d’OpenClaw vers le point de terminaison du proxy :

- `http://proxy.example:3128` : OpenClaw ouvre une connexion TCP en clair vers le proxy direct et envoie des requêtes de proxy HTTP, y compris `CONNECT` pour les destinations HTTPS.
- `https://proxy.example:8443` : OpenClaw ouvre une connexion TLS vers le point de terminaison du proxy, vérifie le certificat du proxy, puis envoie des requêtes de proxy HTTP à l’intérieur de cette session TLS.

Le HTTPS de destination est distinct du TLS du point de terminaison du proxy. Pour une destination HTTPS, OpenClaw demande toujours au proxy un tunnel HTTP `CONNECT`, puis démarre le TLS de destination à travers ce tunnel.

Tant que le proxy est actif, OpenClaw efface `no_proxy` et `NO_PROXY`. Ces listes de contournement sont basées sur la destination ; laisser `localhost` ou `127.0.0.1` à cet endroit permettrait à des cibles SSRF à haut risque de contourner le proxy de filtrage.

À l’arrêt, OpenClaw restaure l’environnement de proxy précédent et réinitialise l’état de routage de processus mis en cache.

## Termes associés au proxy

- `proxy.enabled` / `proxy.proxyUrl` : routage sortant via proxy direct pour les sorties d’exécution OpenClaw. Cette page documente cette fonctionnalité.
- `gateway.auth.mode: "trusted-proxy"` : authentification entrante par proxy inverse sensible à l’identité pour l’accès au Gateway. Consultez [Authentification par proxy de confiance](/fr/gateway/trusted-proxy-auth).
- `openclaw proxy` : proxy de débogage local et inspecteur de capture pour le développement et le support. Consultez [openclaw proxy](/fr/cli/proxy).
- `tools.web.fetch.useTrustedEnvProxy` : option d’activation pour `web_fetch` permettant à un proxy HTTP(S) d’environnement contrôlé par l’opérateur de résoudre le DNS tout en conservant par défaut l’épinglage DNS strict et la politique de nom d’hôte. Consultez [Récupération Web](/fr/tools/web-fetch#trusted-env-proxy).
- Paramètres de proxy propres à un canal ou fournisseur : remplacements propres au propriétaire pour un transport particulier. Préférez le proxy réseau géré lorsque l’objectif est le contrôle centralisé des sorties réseau sur l’ensemble du runtime.

## Configuration

```yaml
proxy:
  enabled: true
  proxyUrl: http://127.0.0.1:3128
```

Pour un point de terminaison de proxy HTTPS avec une autorité de certification de proxy privée :

```yaml
proxy:
  enabled: true
  proxyUrl: https://proxy.corp.example:8443
  tls:
    caFile: /etc/openclaw/proxy-ca.pem
```

Vous pouvez aussi fournir l’URL via l’environnement, tout en gardant `proxy.enabled=true` dans la configuration :

```bash
OPENCLAW_PROXY_URL=http://127.0.0.1:3128 openclaw gateway run
```

`proxy.proxyUrl` prévaut sur `OPENCLAW_PROXY_URL`.

### Mode Gateway Loopback

Les clients locaux du plan de contrôle Gateway se connectent généralement à un WebSocket en loopback comme `ws://127.0.0.1:18789`. Utilisez `proxy.loopbackMode` pour choisir le comportement des exceptions loopback du proxy géré lorsque le proxy géré est actif :

```yaml
proxy:
  enabled: true
  proxyUrl: http://127.0.0.1:3128
  loopbackMode: gateway-only # gateway-only, proxy, or block
```

- `gateway-only` (par défaut) : OpenClaw enregistre l’autorité loopback du Gateway dans la politique de contournement gérée de Proxyline afin que le trafic WebSocket local du Gateway puisse se connecter directement. Les ports Gateway loopback personnalisés fonctionnent parce que l’hôte et le port de l’URL Gateway active sont enregistrés. Le plugin de navigateur intégré peut aussi enregistrer les points de terminaison exacts locaux de disponibilité CDP et WebSocket DevTools pour les navigateurs gérés lancés par OpenClaw, et le fournisseur intégré d’embeddings mémoire Ollama peut utiliser son propre chemin direct gardé, plus étroit, pour l’origine exacte d’embedding loopback locale à l’hôte configurée.
- `proxy` : OpenClaw n’enregistre pas de contournements loopback Gateway ou Ollama ; ce trafic loopback est donc envoyé via le proxy géré. Si le proxy est distant, il doit fournir un routage spécial vers le service loopback de l’hôte OpenClaw, par exemple en le mappant à un nom d’hôte, une IP ou un tunnel joignable par le proxy. Les proxys distants standard résolvent `127.0.0.1` et `localhost` depuis l’hôte du proxy, pas depuis l’hôte OpenClaw.
- `block` : OpenClaw refuse les connexions du plan de contrôle Gateway en loopback et les connexions d’embedding Ollama en loopback locale à l’hôte gardées avant d’ouvrir un socket.

Si `enabled=true` mais qu’aucune URL de proxy valide n’est configurée, les commandes protégées échouent au démarrage au lieu de revenir à un accès réseau direct.

Pour les services Gateway gérés démarrés avec `openclaw gateway start`, préférez stocker l’URL dans la configuration :

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl http://127.0.0.1:3128
openclaw gateway install --force
openclaw gateway start
```

Le fallback par l’environnement convient mieux aux exécutions au premier plan. Si vous l’utilisez avec un service installé, placez `OPENCLAW_PROXY_URL` dans l’environnement durable du service, comme `$OPENCLAW_STATE_DIR/.env` ou `~/.openclaw/.env`, puis réinstallez le service afin que launchd, systemd ou les Tâches planifiées démarre le Gateway avec cette valeur.

Pour les commandes `openclaw --container ...`, OpenClaw transmet `OPENCLAW_PROXY_URL` à la CLI enfant ciblant le conteneur lorsqu’elle est définie. L’URL doit être joignable depuis l’intérieur du conteneur ; `127.0.0.1` désigne le conteneur lui-même, pas l’hôte. OpenClaw refuse les URL de proxy en loopback pour les commandes ciblant un conteneur, sauf si vous remplacez explicitement cette vérification de sécurité.

## Exigences du proxy

La politique du proxy est la frontière de sécurité. OpenClaw ne peut pas vérifier que le proxy bloque les bonnes cibles.

Configurez le proxy pour :

- Se lier uniquement au loopback ou à une interface privée de confiance.
- Restreindre l’accès afin que seuls le processus, l’hôte, le conteneur ou le compte de service OpenClaw puisse l’utiliser.
- Résoudre lui-même les destinations et bloquer les IP de destination après résolution DNS.
- Appliquer la politique au moment de la connexion pour les requêtes HTTP en clair comme pour les tunnels HTTPS `CONNECT`.
- Refuser les contournements basés sur la destination pour les plages loopback, privées, link-local, metadata, multicast, réservées ou de documentation.
- Éviter les listes d’autorisation de noms d’hôtes sauf si vous faites entièrement confiance au chemin de résolution DNS.
- Journaliser la destination, la décision, l’état et la raison sans journaliser les corps de requête, les en-têtes d’autorisation, les cookies ou d’autres secrets.
- Garder la politique du proxy sous contrôle de version et examiner les changements comme une configuration sensible pour la sécurité.

## Destinations bloquées recommandées

Utilisez cette liste de refus comme point de départ pour toute politique de proxy direct, de pare-feu ou de sortie réseau.

La logique de classification au niveau applicatif d’OpenClaw réside dans `src/infra/net/ssrf.ts` et `packages/net-policy/src/ip.ts`. Les hooks de parité pertinents sont `BLOCKED_HOSTNAMES`, `BLOCKED_IPV4_SPECIAL_USE_RANGES`, `BLOCKED_IPV6_SPECIAL_USE_RANGES`, `RFC2544_BENCHMARK_PREFIX` et la gestion de sentinelle IPv4 intégrée pour NAT64, 6to4, Teredo, ISATAP et les formes IPv4-mapped. Ces fichiers sont des références utiles lors de la maintenance d’une politique de proxy externe, mais OpenClaw n’exporte ni n’applique automatiquement ces règles dans votre proxy.

| Plage ou hôte                                                                        | Pourquoi bloquer                                             |
| ------------------------------------------------------------------------------------ | ------------------------------------------------------------- |
| `127.0.0.0/8`, `localhost`, `localhost.localdomain`                                  | Loopback IPv4                                                 |
| `::1/128`                                                                            | Loopback IPv6                                                 |
| `0.0.0.0/8`, `::/128`                                                                | Adresses non spécifiées et de ce réseau                       |
| `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`                                      | Réseaux privés RFC1918                                        |
| `169.254.0.0/16`, `fe80::/10`                                                        | Adresses lien-local et chemins courants de métadonnées cloud  |
| `169.254.169.254`, `metadata.google.internal`                                        | Services de métadonnées cloud                                 |
| `100.64.0.0/10`                                                                      | Espace d’adresses partagé NAT de niveau opérateur             |
| `198.18.0.0/15`, `2001:2::/48`                                                       | Plages de benchmarking                                        |
| `192.0.0.0/24`, `192.0.2.0/24`, `198.51.100.0/24`, `203.0.113.0/24`, `2001:db8::/32` | Plages à usage spécial et de documentation                    |
| `224.0.0.0/4`, `ff00::/8`                                                            | Multidiffusion                                                |
| `240.0.0.0/4`                                                                        | IPv4 réservé                                                  |
| `fc00::/7`, `fec0::/10`                                                              | Plages IPv6 locales/privées                                   |
| `100::/64`, `2001:20::/28`                                                           | Plages IPv6 de rejet et ORCHIDv2                              |
| `64:ff9b::/96`, `64:ff9b:1::/48`                                                     | Préfixes NAT64 avec IPv4 intégré                              |
| `2002::/16`, `2001::/32`                                                             | 6to4 et Teredo avec IPv4 intégré                              |
| `::/96`, `::ffff:0:0/96`                                                             | IPv6 compatibles IPv4 et IPv6 mappées IPv4                    |

Si votre fournisseur cloud ou votre plateforme réseau documente des hôtes de métadonnées ou des plages réservées supplémentaires, ajoutez-les également.

## Validation

Validez le proxy depuis le même hôte, conteneur ou compte de service qui exécute OpenClaw :

```bash
openclaw proxy validate --proxy-url http://127.0.0.1:3128
```

Pour un point de terminaison de proxy HTTPS signé par une autorité de certification privée :

```bash
openclaw proxy validate --proxy-url https://proxy.corp.example:8443 --proxy-ca-file /etc/openclaw/proxy-ca.pem
```

Par défaut, lorsqu’aucune destination personnalisée n’est fournie, la commande vérifie que `https://example.com/` réussit et démarre un canari loopback temporaire que le proxy ne doit pas atteindre. La vérification refusée par défaut réussit lorsque le proxy renvoie une réponse de refus non-2xx ou bloque le canari avec un échec de transport ; elle échoue si une réponse réussie atteint le canari. Si aucun proxy n’est activé ni configuré, la validation signale un problème de configuration ; utilisez `--proxy-url` pour une prévalidation ponctuelle avant de modifier la configuration. Utilisez `--allowed-url` et `--denied-url` pour tester les attentes propres au déploiement. Ajoutez `--apns-reachable` pour vérifier aussi que la livraison HTTP/2 directe APNs peut ouvrir un tunnel CONNECT via le proxy et recevoir une réponse APNs sandbox ; la sonde utilise un jeton de fournisseur intentionnellement invalide, donc `403 InvalidProviderToken` est attendu et compte comme joignable. Les destinations refusées personnalisées échouent en mode fermé : toute réponse HTTP signifie que la destination était joignable via le proxy, et toute erreur de transport est signalée comme non concluante parce qu’OpenClaw ne peut pas prouver que le proxy a bloqué une origine joignable. En cas d’échec de validation, la commande se termine avec le code 1.

Utilisez `--json` pour l’automatisation. La sortie JSON contient le résultat global, la source effective de configuration du proxy, les éventuelles erreurs de configuration et chaque vérification de destination. Les identifiants d’URL de proxy sont masqués dans la sortie texte et JSON :

```json
{
  "ok": true,
  "config": {
    "enabled": true,
    "proxyUrl": "http://127.0.0.1:3128/",
    "source": "override",
    "errors": []
  },
  "checks": [
    {
      "kind": "allowed",
      "url": "https://example.com/",
      "ok": true,
      "status": 200
    },
    {
      "kind": "apns",
      "url": "https://api.sandbox.push.apple.com",
      "ok": true,
      "status": 403
    }
  ]
}
```

Vous pouvez aussi valider manuellement avec `curl` :

```bash
curl -x http://127.0.0.1:3128 https://example.com/
curl -x http://127.0.0.1:3128 http://127.0.0.1/
curl -x http://127.0.0.1:3128 http://169.254.169.254/
```

La requête publique doit réussir. Les requêtes vers le loopback et les métadonnées doivent être bloquées par le proxy. Pour `openclaw proxy validate`, le canari loopback intégré peut distinguer un refus du proxy d’une origine joignable. Les vérifications `--denied-url` personnalisées n’ont pas ce canari ; traitez donc les réponses HTTP comme les échecs de transport ambigus comme des échecs de validation, sauf si votre proxy expose un signal de refus propre au déploiement que vous pouvez vérifier séparément.

## Confiance dans l’AC du proxy

Utilisez `proxy.tls.caFile` géré lorsque le point de terminaison du proxy lui-même utilise un certificat signé par une autorité de certification privée :

```yaml
proxy:
  enabled: true
  proxyUrl: https://proxy.corp.example:8443
  tls:
    caFile: /etc/openclaw/proxy-ca.pem
```

Cette AC est utilisée pour la vérification TLS du point de terminaison du proxy. Ce n’est pas un paramètre de confiance MITM pour les destinations, un certificat client ni un remplacement de la politique de destination du proxy.

Utilisez `NODE_EXTRA_CA_CERTS` uniquement lorsque tout le processus Node doit faire confiance à une AC supplémentaire dès le démarrage du processus, par exemple lorsqu’un système d’inspection TLS d’entreprise resigne les certificats de destination pour chaque client HTTPS du processus. `NODE_EXTRA_CA_CERTS` est global au processus et doit être présent avant le démarrage de Node. Préférez `proxy.tls.caFile` pour la confiance dans le point de terminaison de proxy HTTPS, car elle est limitée au routage de proxy géré.

Activez ensuite le routage par proxy d’OpenClaw :

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl https://proxy.corp.example:8443
openclaw config set proxy.tls.caFile /etc/openclaw/proxy-ca.pem
openclaw gateway run
```

ou définissez :

```yaml
proxy:
  enabled: true
  proxyUrl: https://proxy.corp.example:8443
  tls:
    caFile: /etc/openclaw/proxy-ca.pem
```

## Limites

- Le proxy améliore la couverture pour les clients HTTP JavaScript et WebSocket locaux au processus, mais ce n’est pas un bac à sable réseau au niveau du système d’exploitation.
- Le trafic de plan de contrôle loopback du Gateway utilise par défaut un contournement local direct via `proxy.loopbackMode: "gateway-only"`. OpenClaw implémente ce contournement en enregistrant l’autorité loopback active du Gateway dans la politique de contournement gérée de Proxyline. Les opérateurs peuvent définir `proxy.loopbackMode: "proxy"` pour envoyer le trafic loopback du Gateway via le proxy géré, ou `proxy.loopbackMode: "block"` pour refuser les connexions loopback du Gateway. Consultez [Mode loopback du Gateway](#gateway-loopback-mode) pour la mise en garde concernant les proxys distants.
- Les sockets bruts `net`, `tls` et `http2`, les modules natifs et les processus enfants non OpenClaw peuvent contourner le routage par proxy au niveau de Node, sauf s’ils héritent des variables d’environnement de proxy et les respectent. Les CLI enfants OpenClaw forkés héritent de l’URL du proxy géré et de l’état `proxy.loopbackMode`.
- IRC est un canal TCP/TLS brut en dehors du routage par proxy direct géré par l’opérateur. Dans les déploiements qui exigent que toute sortie passe par ce proxy direct, définissez `channels.irc.enabled=false`, sauf si la sortie IRC directe est explicitement approuvée.
- Le proxy de débogage local est un outil de diagnostic, et son transfert amont direct pour les requêtes proxy et les tunnels CONNECT est désactivé par défaut lorsque le mode proxy géré est actif ; activez le transfert direct uniquement pour les diagnostics locaux approuvés.
- Les interfaces Web locales utilisateur et les serveurs de modèles locaux doivent être ajoutés à la liste d’autorisation dans la politique de proxy de l’opérateur si nécessaire ; OpenClaw n’expose pas de contournement général du réseau local pour eux. Le fournisseur groupé d’embeddings mémoire Ollama est plus limité : il peut utiliser un chemin direct protégé uniquement pour l’origine exacte d’embedding loopback locale à l’hôte dérivée du `baseUrl` configuré, afin que les embeddings locaux à l’hôte continuent de fonctionner lorsque le proxy géré ne peut pas atteindre le loopback de l’hôte. Les hôtes d’embedding Ollama sur LAN, tailnet, réseau privé et publics utilisent toujours le chemin du proxy géré. `proxy.loopbackMode: "proxy"` envoie ce trafic loopback Ollama via le proxy géré, et `proxy.loopbackMode: "block"` le refuse avant d’ouvrir une connexion.
- Le contournement du proxy du plan de contrôle Gateway est intentionnellement limité à `localhost` et aux URL d’IP loopback littérales. Utilisez `ws://127.0.0.1:18789`, `ws://[::1]:18789` ou `ws://localhost:18789` pour les connexions locales directes au plan de contrôle Gateway ; les autres noms d’hôte sont routés comme le trafic ordinaire basé sur un nom d’hôte.
- OpenClaw n’inspecte pas, ne teste pas et ne certifie pas votre politique de proxy.
- Traitez les changements de politique de proxy comme des changements opérationnels sensibles pour la sécurité.

| Surface                                                      | État du proxy géré                                                                                  |
| ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| `fetch`, `node:http`, `node:https`, clients WebSocket courants | Routés via les hooks de proxy géré lorsqu’ils sont configurés.                                      |
| HTTP/2 direct APNs                                           | Routé via l’assistant CONNECT géré APNs.                                                           |
| Loopback du plan de contrôle Gateway                         | Direct uniquement pour l’URL locale de loopback Gateway configurée.                                |
| Transfert amont du proxy de débogage                         | Désactivé lorsque le mode proxy géré est actif, sauf activation explicite pour les diagnostics locaux. |
| IRC                                                          | TCP/TLS brut ; non proxyfié par le mode proxy HTTP géré. Désactivez-le sauf si la sortie IRC directe est approuvée. |
| Autres appels clients bruts `net`, `tls` ou `http2`          | Doivent être classifiés par la protection de socket brut avant d’être intégrés.                     |
