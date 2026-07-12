---
read_when:
    - Vous souhaitez une défense en profondeur contre les attaques SSRF et de rebinding DNS
    - Configuration d’un proxy direct externe pour le trafic d’exécution d’OpenClaw
summary: Comment acheminer le trafic HTTP et WebSocket de l’environnement d’exécution OpenClaw via un proxy de filtrage géré par l’opérateur
title: Proxy réseau
x-i18n:
    generated_at: "2026-07-12T03:08:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fd82684a17a79242891eca69c549c0bfcdd5bde40fa4e791dda7f2b62c473c89
    source_path: security/network-proxy.md
    workflow: 16
---

OpenClaw peut acheminer le trafic HTTP et WebSocket d’exécution via un proxy direct géré par l’opérateur. Il s’agit d’une défense en profondeur facultative : contrôle centralisé du trafic sortant, protection renforcée contre les SSRF et auditabilité des destinations à la frontière du réseau. Comme le proxy évalue la destination au moment de la connexion, après la résolution DNS et juste avant d’ouvrir la connexion en amont, il réduit également l’intervalle exploité par une attaque de réassociation DNS entre une vérification DNS antérieure au niveau de l’application et la connexion sortante effective. Une politique de proxy unique offre également aux opérateurs un point central pour appliquer des règles de destination, la segmentation du réseau, des limites de débit ou des listes d’autorisation de trafic sortant sans reconstruire OpenClaw.

OpenClaw ne fournit, ne télécharge, ne démarre, ne configure ni ne certifie aucun proxy. Vous exécutez la technologie de proxy adaptée à votre environnement ; OpenClaw y achemine ses propres clients HTTP et WebSocket.

## Configuration

```yaml
proxy:
  enabled: true
  proxyUrl: http://127.0.0.1:3128
```

Vous pouvez également définir l’URL par l’intermédiaire de l’environnement tant que `proxy.enabled: true` reste dans la configuration :

```bash
OPENCLAW_PROXY_URL=http://127.0.0.1:3128 openclaw gateway run
```

`proxy.proxyUrl` prévaut sur `OPENCLAW_PROXY_URL`. Si `proxy.enabled` vaut `true`, mais qu’aucune URL valide n’est résolue, les commandes protégées échouent au démarrage au lieu de revenir à un accès réseau direct.

| Clé                  | Type                                 | Valeur par défaut | Remarques                                                                                                                                                                               |
| -------------------- | ------------------------------------ | ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `proxy.enabled`      | booléen                              | non définie       | Doit valoir `true` pour activer le routage.                                                                                                                                             |
| `proxy.proxyUrl`     | chaîne                               | non définie       | URL de proxy direct `http://` ou `https://`. Les identifiants intégrés à l’URL sont considérés comme sensibles et masqués dans les instantanés et les journaux.                         |
| `proxy.tls.caFile`   | chaîne                               | non définie       | Ensemble de certificats d’AC permettant de vérifier un point de terminaison de proxy `https://` signé par une AC privée.                                                                |
| `proxy.loopbackMode` | `gateway-only` \| `proxy` \| `block` | `gateway-only`    | Contrôle le comportement de contournement de l’interface de bouclage ; voir ci-dessous.                                                                                                 |

Pour les services Gateway gérés, stockez l’URL dans la configuration afin qu’elle soit conservée après une réinstallation, plutôt que de dépendre de l’environnement d’un processus au premier plan :

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl http://127.0.0.1:3128
openclaw gateway install --force
openclaw gateway start
```

Le recours à la variable d’environnement `OPENCLAW_PROXY_URL` convient surtout aux exécutions au premier plan. Pour l’utiliser avec un service installé, placez-la dans l’environnement persistant du service (`$OPENCLAW_STATE_DIR/.env`, par défaut `~/.openclaw/.env`), puis réinstallez le service afin que launchd, systemd ou Scheduled Tasks la prenne en compte.

### Point de terminaison de proxy HTTPS avec une AC privée

```yaml
proxy:
  enabled: true
  proxyUrl: https://proxy.corp.example:8443
  tls:
    caFile: /etc/openclaw/proxy-ca.pem
```

`proxy.tls.caFile` vérifie le propre certificat TLS du point de terminaison du proxy. Il ne s’agit ni d’un paramètre d’approbation d’interception de la destination, ni d’un certificat client, ni d’un substitut à la politique de destination du proxy. Utilisez plutôt `NODE_EXTRA_CA_CERTS` uniquement lorsque l’ensemble du processus Node doit approuver une AC supplémentaire dès son démarrage, par exemple lorsqu’un système d’inspection TLS d’entreprise signe de nouveau chaque certificat de destination HTTPS. Cette variable s’applique à l’ensemble du processus et doit être définie avant le démarrage de Node ; OpenClaw ne peut donc pas l’appliquer en cours d’exécution comme il le fait pour `proxy.tls.caFile`. Préférez `proxy.tls.caFile` pour établir la confiance envers le point de terminaison d’un proxy HTTPS : sa portée se limite au routage par proxy géré au lieu de s’étendre à l’ensemble du processus.

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl https://proxy.corp.example:8443
openclaw config set proxy.tls.caFile /etc/openclaw/proxy-ca.pem
openclaw gateway run
```

## Fonctionnement du routage

Lorsque `proxy.enabled: true` est défini avec une URL valide, les processus d’exécution protégés (`openclaw gateway run`, `openclaw node run`, `openclaw agent --local`) acheminent le trafic sortant HTTP et WebSocket ordinaire via le proxy :

```text
Processus OpenClaw
  fetch, node:http, node:https, clients WebSocket  -> proxy de l’opérateur -> destination
```

En interne, OpenClaw installe [Proxyline](https://github.com/openclaw/proxyline) comme environnement d’exécution de routage au niveau du processus. Il prend en charge `fetch`, les clients reposant sur undici, `node:http`/`node:https`, les clients WebSocket courants et les tunnels `CONNECT` créés par des fonctions auxiliaires. Il remplace également les agents HTTP Node fournis par l’appelant afin que les agents explicites, notamment `axios`, `got`, `node-fetch` et les clients similaires reposant sur des agents Node, ne puissent pas contourner silencieusement le proxy.

Le schéma de l’URL du proxy décrit le saut entre OpenClaw et le proxy, et non celui vers la destination finale :

- `http://proxy.example:3128` — connexion TCP non chiffrée au proxy ; OpenClaw envoie des requêtes de proxy HTTP, notamment `CONNECT` pour les destinations HTTPS.
- `https://proxy.example:8443` — OpenClaw établit une connexion TLS avec le proxy lui-même, en vérifiant son certificat, puis envoie les requêtes de proxy HTTP dans cette session.

Le protocole TLS de la destination est indépendant de celui du point de terminaison du proxy : pour une destination HTTPS, OpenClaw demande toujours au proxy un tunnel `CONNECT` et établit la connexion TLS avec la destination dans ce tunnel.

Lorsque le proxy est actif, OpenClaw efface `no_proxy`/`NO_PROXY`. Ces listes de contournement reposent sur la destination ; y laisser `localhost` ou `127.0.0.1` permettrait aux cibles SSRF de contourner entièrement le proxy. Lors de l’arrêt, OpenClaw restaure l’environnement de proxy précédent et réinitialise l’état de routage mis en cache.

Certains plugins possèdent un transport personnalisé qui nécessite sa propre configuration de proxy, même lorsque le routage au niveau du processus est actif. Le client de l’API Bot de Telegram utilise son propre répartiteur HTTP/1 undici et respecte séparément les variables d’environnement de proxy du processus ainsi que le recours à `OPENCLAW_PROXY_URL`.

### Mode de bouclage du Gateway

Les clients locaux du plan de contrôle du Gateway se connectent normalement à un WebSocket sur l’interface de bouclage, tel que `ws://127.0.0.1:18789`. `proxy.loopbackMode` détermine si ce trafic contourne le proxy géré :

```yaml
proxy:
  enabled: true
  proxyUrl: http://127.0.0.1:3128
  loopbackMode: gateway-only # gateway-only, proxy, or block
```

| Mode                     | Comportement                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `gateway-only` (par défaut) | OpenClaw enregistre l’autorité de bouclage du Gateway actif comme exception de connexion directe, de sorte que le trafic WebSocket local du Gateway se connecte sans passer par le proxy. Les ports de bouclage personnalisés fonctionnent, car l’exception cible précisément l’hôte et le port configurés. Le plugin de navigateur fourni enregistre le même type d’exception pour les URL locales exactes de disponibilité CDP et de WebSocket DevTools des navigateurs gérés lancés par OpenClaw ; le fournisseur d’incorporations de mémoire Ollama fourni dispose d’un chemin direct protégé plus restreint pour l’origine d’incorporation en bouclage local de l’hôte qui est configurée précisément. |
| `proxy`                  | Aucune exception de bouclage n’est enregistrée ; le trafic de bouclage du Gateway et d’Ollama passe par le proxy. Un proxy distant doit pouvoir acheminer le trafic vers le service de bouclage de l’hôte OpenClaw, par exemple au moyen d’un nom d’hôte, d’une adresse IP ou d’un tunnel accessible. Un proxy distant standard résout `127.0.0.1`/`localhost` par rapport à lui-même, et non par rapport à l’hôte OpenClaw.                                                                                                                                                                                                                                                                                                                    |
| `block`                  | OpenClaw refuse les connexions au plan de contrôle du Gateway sur l’interface de bouclage et les connexions protégées d’incorporation Ollama sur cette interface avant d’ouvrir un socket.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |

Le contournement du plan de contrôle du Gateway est limité à `localhost` et aux URL contenant des adresses IP de bouclage littérales : utilisez `ws://127.0.0.1:18789`, `ws://[::1]:18789` ou `ws://localhost:18789`. Les autres noms d’hôte sont acheminés comme du trafic ordinaire.

### Conteneurs

Pour les commandes `openclaw --container ...`, OpenClaw transmet `OPENCLAW_PROXY_URL` à la CLI enfant ciblant le conteneur lorsque cette variable est définie. L’URL doit être accessible depuis l’intérieur du conteneur ; `127.0.0.1` y désigne le conteneur lui-même, et non l’hôte. OpenClaw refuse les URL de proxy en bouclage pour les commandes ciblant un conteneur, sauf si vous définissez `OPENCLAW_CONTAINER_ALLOW_LOOPBACK_PROXY_URL=1` afin de contourner explicitement cette vérification.

## Termes associés aux proxys

- `proxy.enabled` / `proxy.proxyUrl` — routage par proxy direct sortant pour le trafic d’exécution. Page actuelle.
- `gateway.auth.mode: "trusted-proxy"` — authentification entrante par proxy inverse tenant compte de l’identité pour accéder au Gateway. Consultez [Authentification par proxy de confiance](/fr/gateway/trusted-proxy-auth).
- `openclaw proxy` — proxy de débogage local et inspecteur de capture pour le développement et l’assistance. Consultez [openclaw proxy](/fr/cli/proxy).
- `tools.web.fetch.useTrustedEnvProxy` — option permettant à `web_fetch` de laisser un proxy d’environnement HTTP(S) contrôlé par l’opérateur effectuer la résolution DNS, tout en conservant par défaut un épinglage DNS strict et une politique de noms d’hôte. Consultez [Récupération Web](/fr/tools/web-fetch#trusted-env-proxy).
- Paramètres de proxy propres à un canal ou à un fournisseur — remplacements spécifiques au propriétaire pour un transport donné. Préférez le proxy réseau géré pour contrôler centralement le trafic sortant dans tout l’environnement d’exécution.

## Validation du proxy

La politique de destination du proxy constitue la véritable frontière de sécurité ; OpenClaw ne peut pas vérifier que votre proxy bloque les bonnes cibles. Configurez-le pour :

- N’écouter que sur l’interface de bouclage ou sur une interface privée de confiance, accessible uniquement par le processus, l’hôte, le conteneur ou le compte de service OpenClaw.
- Résoudre lui-même les destinations et les bloquer selon leur adresse IP après la résolution DNS, au moment de la connexion, pour le trafic HTTP non chiffré comme pour les tunnels HTTPS `CONNECT`.
- Refuser les contournements fondés sur la destination pour les plages de bouclage, privées, lien-local, de métadonnées, de multidiffusion, réservées et de documentation.
- Éviter les listes d’autorisation de noms d’hôte, sauf si vous faites entièrement confiance au chemin de résolution DNS.
- Journaliser la destination, la décision, l’état et la raison, mais jamais le corps des requêtes, les en-têtes d’autorisation, les cookies ni d’autres secrets.
- Conserver la politique sous contrôle de version et examiner ses modifications comme des changements sensibles pour la sécurité.

Effectuez la validation depuis le même hôte, conteneur ou compte de service qui exécute OpenClaw :

```bash
openclaw proxy validate --proxy-url http://127.0.0.1:3128
```

Avec un point de terminaison de proxy HTTPS utilisant une AC privée :

```bash
openclaw proxy validate --proxy-url https://proxy.corp.example:8443 --proxy-ca-file /etc/openclaw/proxy-ca.pem
```

| Option                   | Objectif                                                                                     |
| ------------------------ | -------------------------------------------------------------------------------------------- |
| `--proxy-url <url>`      | Valider cette URL au lieu de résoudre la configuration ou les variables d’environnement.     |
| `--proxy-ca-file <path>` | Ensemble de certificats d’AC pour un point de terminaison de proxy HTTPS.                     |
| `--allowed-url <url>`    | Destination censée être accessible (répétable).                                              |
| `--denied-url <url>`     | Destination censée être bloquée (répétable).                                                 |
| `--apns-reachable`       | Vérifier également que le proxy peut tunnelliser une sonde HTTP/2 APNs directe en bac à sable. |
| `--apns-authority <url>` | Remplacer l’autorité APNs sondée avec `--apns-reachable`.                                     |
| `--timeout-ms <ms>`      | Délai d’expiration par requête.                                                               |
| `--json`                 | Sortie lisible par une machine.                                                               |

Si `proxy.enabled` n’est pas défini sur `true` et qu’aucune option `--proxy-url` n’est fournie, la commande signale un problème de configuration au lieu d’effectuer la validation ; transmettez `--proxy-url` pour une vérification préalable ponctuelle avant de modifier la configuration.

Sans `--allowed-url`/`--denied-url`, les vérifications par défaut sont les suivantes : `https://example.com/` doit être accessible, et un serveur sentinelle temporaire en local loopback, que le proxy ne doit pas pouvoir atteindre, doit être bloqué. La vérification du local loopback réussit en cas d’échec de transport ou de réponse non-2xx ne contenant pas le jeton propre à l’exécution de la sentinelle ; elle échoue en cas de réponse 2xx sans le jeton (réussite inattendue provenant d’un autre élément que la sentinelle) et, en particulier, en cas de réponse contenant le jeton correspondant, car cela prouve que le proxy a effectivement transmis une destination en local loopback qu’il aurait dû refuser. Les cibles `--denied-url` personnalisées ne disposent pas d’un tel jeton sentinelle et appliquent donc une stratégie de refus par défaut : toute réponse HTTP signifie que la cible est accessible (échec), et une erreur de transport est signalée comme non concluante plutôt que comme un blocage avéré, car OpenClaw ne peut pas confirmer si votre proxy a refusé une origine accessible ou si un autre problème est survenu. `--apns-reachable` envoie intentionnellement un jeton de fournisseur non valide ; une réponse `403 InvalidProviderToken` prouve donc que le tunnel a atteint Apple. La commande se termine avec le code `1` en cas d’échec de validation ; les identifiants présents dans l’URL du proxy sont masqués dans les sorties texte et JSON.

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
    { "kind": "allowed", "url": "https://example.com/", "ok": true, "status": 200 },
    { "kind": "apns", "url": "https://api.sandbox.push.apple.com", "ok": true, "status": 403 }
  ]
}
```

Vérification manuelle avec `curl` (la requête publique doit réussir ; les requêtes vers le local loopback et les métadonnées doivent être bloquées par le proxy lui-même — `curl` seul ne peut pas distinguer un refus du proxy d’une origine inaccessible comme le peut la sentinelle intégrée d’`openclaw proxy validate`) :

```bash
curl -x http://127.0.0.1:3128 https://example.com/
curl -x http://127.0.0.1:3128 http://127.0.0.1/
curl -x http://127.0.0.1:3128 http://169.254.169.254/
```

## Destinations qu’il est recommandé de bloquer

Liste de refus initiale pour tout proxy direct, pare-feu ou toute politique de trafic sortant. Le classificateur SSRF d’OpenClaw se trouve dans `src/infra/net/ssrf.ts` et `packages/net-policy/src/ip.ts` (`BLOCKED_HOSTNAMES`, `BLOCKED_IPV4_SPECIAL_USE_RANGES`, `BLOCKED_IPV6_SPECIAL_USE_RANGES`, le préfixe de test de performance RFC 2544 et la gestion de l’IPv4 incorporée pour les formes NAT64/6to4/Teredo/ISATAP/IPv4 mappées) — ce sont des références utiles, mais OpenClaw n’exporte ni n’applique ces règles dans votre proxy externe.

| Plage ou hôte                                                                         | Raison du blocage                                                      |
| ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `127.0.0.0/8`, `localhost`, `localhost.localdomain`                                   | Local loopback IPv4                                                    |
| `::1/128`                                                                             | Local loopback IPv6                                                    |
| `0.0.0.0/8`, `::/128`                                                                 | Adresses non spécifiées ou du réseau actuel                            |
| `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`                                       | Réseaux privés RFC 1918                                                |
| `169.254.0.0/16`, `fe80::/10`                                                         | Liaison locale, y compris les chemins courants de métadonnées du cloud |
| `169.254.169.254`, `metadata.google.internal`                                         | Services de métadonnées du cloud                                       |
| `100.64.0.0/10`                                                                       | Espace d’adressage partagé pour le NAT de classe opérateur             |
| `198.18.0.0/15`, `2001:2::/48`                                                        | Plages de test de performance                                          |
| `192.0.0.0/24`, `192.0.2.0/24`, `198.51.100.0/24`, `203.0.113.0/24`, `2001:db8::/32`  | Plages à usage spécial et réservées à la documentation                 |
| `224.0.0.0/4`, `ff00::/8`                                                             | Multidiffusion                                                         |
| `240.0.0.0/4`                                                                         | IPv4 réservée                                                          |
| `fc00::/7`, `fec0::/10`                                                               | Plages IPv6 locales ou privées                                         |
| `100::/64`, `2001:20::/28`                                                            | Plages IPv6 de rejet et ORCHIDv2                                       |
| `64:ff9b::/96`, `64:ff9b:1::/48`                                                      | Préfixes NAT64 avec IPv4 incorporée                                    |
| `2002::/16`, `2001::/32`                                                              | 6to4 et Teredo avec IPv4 incorporée                                    |
| `::/96`, `::ffff:0:0/96`                                                              | IPv6 compatible IPv4 et IPv6 avec IPv4 mappée                          |

Ajoutez tous les hôtes de métadonnées ou toutes les plages réservées supplémentaires documentés par votre fournisseur de cloud ou votre plateforme réseau.

## Limites

| Surface                                                      | État du proxy géré                                                                                                                                                                                  |
| ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `fetch`, `node:http`, `node:https`, clients WebSocket courants | Acheminés par les points d’interception du proxy géré lorsqu’il est configuré.                                                                                                                       |
| HTTP/2 direct d’APNs                                         | Acheminé par l’assistant `CONNECT` géré d’APNs.                                                                                                                                                     |
| Local loopback du plan de contrôle du Gateway                | Direct uniquement pour l’URL locale en local loopback du Gateway configurée exactement.                                                                                                            |
| Transfert amont du proxy de débogage                         | Désactivé lorsque le mode proxy géré est actif, sauf activation explicite pour les diagnostics locaux.                                                                                              |
| IRC                                                          | TCP/TLS brut ; non relayé par le mode proxy HTTP géré. Définissez `channels.irc.enabled: false` si votre déploiement exige que tout le trafic sortant passe par le proxy direct.                      |
| Autres appels clients bruts avec `net`, `tls` ou `http2`     | Doivent être classés par le dispositif de protection des sockets bruts avant intégration.                                                                                                           |

- Cette couverture s’applique au niveau du processus pour les clients HTTP/WebSocket JavaScript ; il ne s’agit pas d’un bac à sable réseau au niveau du système d’exploitation.
- Les sockets `net`, `tls` et `http2` bruts, les modules complémentaires natifs et les processus enfants ne provenant pas d’OpenClaw peuvent contourner le routage au niveau de Node, sauf s’ils héritent des variables d’environnement du proxy et les respectent. Les CLI enfants d’OpenClaw créées par duplication de processus héritent de l’URL du proxy géré et de l’état `proxy.loopbackMode`.
- Les interfaces Web locales de l’utilisateur et les serveurs de modèles locaux ne bénéficient pas d’un contournement général du réseau local — ajoutez-les à la liste d’autorisation de la politique de proxy de l’opérateur si nécessaire. L’exception est le chemin direct protégé du fournisseur intégré d’incorporations de mémoire Ollama, limité à l’origine exacte en local loopback de l’hôte définie dans son `baseUrl` configuré ; les hôtes Ollama du réseau local, du réseau Tailscale, des réseaux privés et publics utilisent toujours le proxy géré.
- Le transfert amont direct du proxy de débogage local (pour les requêtes de proxy et les tunnels `CONNECT`) est désactivé par défaut lorsque le mode proxy géré est actif ; ne l’activez que pour des diagnostics locaux approuvés.
- OpenClaw n’inspecte, ne teste ni ne certifie votre politique de proxy. Traitez les modifications de cette politique comme des changements opérationnels sensibles sur le plan de la sécurité.
