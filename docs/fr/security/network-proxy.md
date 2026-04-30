---
read_when:
    - Vous voulez une défense en profondeur contre les attaques SSRF et de réassociation DNS
    - Configurer un proxy direct externe pour le trafic d’exécution d’OpenClaw
summary: Comment acheminer le trafic HTTP et WebSocket de l’environnement d’exécution OpenClaw via un proxy de filtrage géré par l’opérateur
title: Proxy réseau
x-i18n:
    generated_at: "2026-04-30T07:49:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: c4e879f787571410acdda55dcdbb5fd77aef1d24045af5c9208cba51330a70ca
    source_path: security/network-proxy.md
    workflow: 16
---

# Proxy réseau

OpenClaw peut acheminer le trafic HTTP et WebSocket d’exécution via un proxy direct géré par l’opérateur. Il s’agit d’une défense en profondeur facultative pour les déploiements qui veulent un contrôle centralisé de la sortie réseau, une protection SSRF renforcée et une meilleure auditabilité réseau.

OpenClaw ne fournit pas, ne télécharge pas, ne démarre pas, ne configure pas et ne certifie pas de proxy. Vous exécutez la technologie de proxy adaptée à votre environnement, et OpenClaw achemine les clients HTTP et WebSocket locaux au processus via celui-ci.

## Pourquoi utiliser un proxy ?

Un proxy donne aux opérateurs un point de contrôle réseau unique pour le trafic HTTP et WebSocket sortant. Cela peut être utile même en dehors du renforcement SSRF :

- Politique centrale : maintenir une seule politique de sortie au lieu de dépendre de chaque site d’appel HTTP applicatif pour appliquer correctement les règles réseau.
- Vérifications au moment de la connexion : évaluer la destination après la résolution DNS et juste avant que le proxy n’ouvre la connexion amont.
- Défense contre le DNS rebinding : réduire l’écart entre une vérification DNS au niveau applicatif et la connexion sortante réelle.
- Couverture JavaScript plus large : acheminer les clients ordinaires `fetch`, `node:http`, `node:https`, WebSocket, axios, got, node-fetch et similaires via le même chemin.
- Auditabilité : journaliser les destinations autorisées et refusées à la frontière de sortie.
- Contrôle opérationnel : appliquer des règles de destination, une segmentation réseau, des limites de débit ou des listes d’autorisation sortantes sans reconstruire OpenClaw.

L’acheminement par proxy est un garde-fou au niveau du processus pour les sorties HTTP et WebSocket normales. Il donne aux opérateurs un chemin fermé en cas d’échec pour acheminer les clients HTTP JavaScript pris en charge via leur propre proxy de filtrage, mais ce n’est pas un bac à sable réseau au niveau du système d’exploitation et cela ne signifie pas qu’OpenClaw certifie la politique de destination du proxy.

## Comment OpenClaw achemine le trafic

Lorsque `proxy.enabled=true` et qu’une URL de proxy est configurée, les processus d’exécution protégés tels que `openclaw gateway run`, `openclaw node run` et `openclaw agent --local` acheminent les sorties HTTP et WebSocket normales via le proxy configuré :

```text
Processus OpenClaw
  fetch                  -> proxy de filtrage géré par l’opérateur -> internet public
  node:http et https     -> proxy de filtrage géré par l’opérateur -> internet public
  Clients WebSocket      -> proxy de filtrage géré par l’opérateur -> internet public
```

Le contrat public est le comportement d’acheminement, pas les hooks Node internes utilisés pour l’implémenter. Les clients WebSocket du plan de contrôle OpenClaw Gateway utilisent un chemin direct étroit pour le trafic RPC Gateway en local loopback lorsque l’URL du Gateway utilise `localhost` ou une IP de loopback littérale telle que `127.0.0.1` ou `[::1]`. Ce chemin de plan de contrôle doit pouvoir atteindre les Gateways en loopback même lorsque le proxy de l’opérateur bloque les destinations loopback. Les requêtes HTTP et WebSocket d’exécution normales utilisent toujours le proxy configuré.

En interne, OpenClaw utilise deux hooks d’acheminement au niveau du processus pour cette fonctionnalité :

- L’acheminement par répartiteur Undici couvre `fetch`, les clients basés sur undici et les transports qui fournissent leur propre répartiteur undici.
- L’acheminement `global-agent` couvre les appelants Node principaux `node:http` et `node:https`, y compris de nombreuses bibliothèques construites sur `http.request`, `https.request`, `http.get` et `https.get`. Le mode proxy géré force cet agent global afin que les agents HTTP Node explicites ne contournent pas accidentellement le proxy de l’opérateur.

Certains plugins possèdent des transports personnalisés qui nécessitent un câblage explicite du proxy même lorsque l’acheminement au niveau du processus existe. Par exemple, le transport de l’API Bot de Telegram utilise son propre répartiteur HTTP/1 undici et respecte donc l’environnement de proxy du processus ainsi que le repli géré `OPENCLAW_PROXY_URL` dans ce chemin de transport propre au propriétaire.

L’URL du proxy elle-même doit utiliser `http://`. Les destinations HTTPS restent prises en charge via le proxy avec HTTP `CONNECT` ; cela signifie seulement qu’OpenClaw attend un écouteur de proxy direct HTTP simple tel que `http://127.0.0.1:3128`.

Pendant que le proxy est actif, OpenClaw efface `no_proxy`, `NO_PROXY` et `GLOBAL_AGENT_NO_PROXY`. Ces listes de contournement sont basées sur la destination ; laisser `localhost` ou `127.0.0.1` à cet endroit permettrait donc à des cibles SSRF à haut risque d’éviter le proxy de filtrage.

À l’arrêt, OpenClaw restaure l’environnement de proxy précédent et réinitialise l’état d’acheminement de processus mis en cache.

## Termes de proxy associés

- `proxy.enabled` / `proxy.proxyUrl` : acheminement par proxy direct sortant pour les sorties d’exécution d’OpenClaw. Cette page documente cette fonctionnalité.
- `gateway.auth.mode: "trusted-proxy"` : authentification entrante par proxy inverse sensible à l’identité pour l’accès au Gateway. Voir [authentification par proxy approuvé](/fr/gateway/trusted-proxy-auth).
- `openclaw proxy` : proxy de débogage local et inspecteur de capture pour le développement et le support. Voir [openclaw proxy](/fr/cli/proxy).
- Paramètres de proxy propres à un canal ou à un fournisseur : remplacements propres au propriétaire pour un transport particulier. Préférez le proxy réseau géré lorsque l’objectif est un contrôle centralisé de la sortie dans toute l’exécution.

## Configuration

```yaml
proxy:
  enabled: true
  proxyUrl: http://127.0.0.1:3128
```

Vous pouvez aussi fournir l’URL via l’environnement, tout en conservant `proxy.enabled=true` dans la configuration :

```bash
OPENCLAW_PROXY_URL=http://127.0.0.1:3128 openclaw gateway run
```

`proxy.proxyUrl` est prioritaire sur `OPENCLAW_PROXY_URL`.

Si `enabled=true` mais qu’aucune URL de proxy valide n’est configurée, les commandes protégées échouent au démarrage au lieu de revenir à un accès réseau direct.

Pour les services gateway gérés démarrés avec `openclaw gateway start`, préférez stocker l’URL dans la configuration :

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl http://127.0.0.1:3128
openclaw gateway install --force
openclaw gateway start
```

Le repli par environnement convient surtout aux exécutions au premier plan. Si vous l’utilisez avec un service installé, placez `OPENCLAW_PROXY_URL` dans l’environnement durable du service, tel que `$OPENCLAW_STATE_DIR/.env` ou `~/.openclaw/.env`, puis réinstallez le service afin que launchd, systemd ou Scheduled Tasks démarre le gateway avec cette valeur.

Pour les commandes `openclaw --container ...`, OpenClaw transmet `OPENCLAW_PROXY_URL` au CLI enfant ciblant le conteneur lorsqu’il est défini. L’URL doit être accessible depuis l’intérieur du conteneur ; `127.0.0.1` désigne le conteneur lui-même, pas l’hôte. OpenClaw rejette les URL de proxy loopback pour les commandes ciblant un conteneur, sauf si vous remplacez explicitement cette vérification de sécurité.

## Exigences du proxy

La politique du proxy constitue la frontière de sécurité. OpenClaw ne peut pas vérifier que le proxy bloque les bonnes cibles.

Configurez le proxy pour :

- Se lier uniquement au loopback ou à une interface privée approuvée.
- Restreindre l’accès afin que seul le processus, l’hôte, le conteneur ou le compte de service OpenClaw puisse l’utiliser.
- Résoudre lui-même les destinations et bloquer les IP de destination après la résolution DNS.
- Appliquer la politique au moment de la connexion pour les requêtes HTTP simples comme pour les tunnels HTTPS `CONNECT`.
- Rejeter les contournements basés sur la destination pour les plages loopback, privées, link-local, métadonnées, multicast, réservées ou de documentation.
- Éviter les listes d’autorisation par nom d’hôte sauf si vous faites entièrement confiance au chemin de résolution DNS.
- Journaliser la destination, la décision, le statut et la raison sans journaliser les corps de requête, les en-têtes d’autorisation, les cookies ou d’autres secrets.
- Conserver la politique de proxy sous contrôle de version et examiner les changements comme une configuration sensible à la sécurité.

## Destinations bloquées recommandées

Utilisez cette liste de refus comme point de départ pour tout proxy direct, pare-feu ou politique de sortie.

La logique de classification au niveau applicatif d’OpenClaw se trouve dans `src/infra/net/ssrf.ts` et `src/shared/net/ip.ts`. Les hooks de parité pertinents sont `BLOCKED_HOSTNAMES`, `BLOCKED_IPV4_SPECIAL_USE_RANGES`, `BLOCKED_IPV6_SPECIAL_USE_RANGES`, `RFC2544_BENCHMARK_PREFIX` et la gestion de sentinelle IPv4 intégrée pour les formes NAT64, 6to4, Teredo, ISATAP et IPv4 mappées. Ces fichiers sont des références utiles lors de la maintenance d’une politique de proxy externe, mais OpenClaw n’exporte ni n’applique automatiquement ces règles dans votre proxy.

| Plage ou hôte                                                                         | Pourquoi bloquer                                      |
| ------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| `127.0.0.0/8`, `localhost`, `localhost.localdomain`                                   | Loopback IPv4                                         |
| `::1/128`                                                                             | Loopback IPv6                                         |
| `0.0.0.0/8`, `::/128`                                                                 | Adresses non spécifiées et de ce réseau               |
| `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`                                       | Réseaux privés RFC1918                                |
| `169.254.0.0/16`, `fe80::/10`                                                         | Adresses link-local et chemins courants de métadonnées cloud |
| `169.254.169.254`, `metadata.google.internal`                                         | Services de métadonnées cloud                         |
| `100.64.0.0/10`                                                                       | Espace d’adressage partagé NAT de qualité opérateur   |
| `198.18.0.0/15`, `2001:2::/48`                                                        | Plages de benchmark                                   |
| `192.0.0.0/24`, `192.0.2.0/24`, `198.51.100.0/24`, `203.0.113.0/24`, `2001:db8::/32`  | Plages à usage spécial et de documentation            |
| `224.0.0.0/4`, `ff00::/8`                                                             | Multicast                                             |
| `240.0.0.0/4`                                                                         | IPv4 réservée                                         |
| `fc00::/7`, `fec0::/10`                                                               | Plages IPv6 locales/privées                           |
| `100::/64`, `2001:20::/28`                                                            | Plages IPv6 discard et ORCHIDv2                       |
| `64:ff9b::/96`, `64:ff9b:1::/48`                                                      | Préfixes NAT64 avec IPv4 intégrée                     |
| `2002::/16`, `2001::/32`                                                              | 6to4 et Teredo avec IPv4 intégrée                     |
| `::/96`, `::ffff:0:0/96`                                                              | IPv6 compatibles IPv4 et IPv6 mappées IPv4            |

Si votre fournisseur cloud ou votre plateforme réseau documente des hôtes de métadonnées ou des plages réservées supplémentaires, ajoutez-les également.

## Validation

Validez le proxy depuis le même hôte, conteneur ou compte de service qui exécute OpenClaw :

```bash
curl -x http://127.0.0.1:3128 https://example.com/
curl -x http://127.0.0.1:3128 http://127.0.0.1/
curl -x http://127.0.0.1:3128 http://169.254.169.254/
```

La requête publique doit réussir. Les requêtes loopback et de métadonnées doivent échouer au niveau du proxy.

Activez ensuite l’acheminement par proxy d’OpenClaw :

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl http://127.0.0.1:3128
openclaw gateway run
```

ou définissez :

```yaml
proxy:
  enabled: true
  proxyUrl: http://127.0.0.1:3128
```

## Limites

- Le proxy améliore la couverture des clients HTTP et WebSocket JavaScript locaux au processus, mais ce n’est pas un bac à sable réseau au niveau du système d’exploitation.
- Les sockets bruts `net`, `tls` et `http2`, les addons natifs et les processus enfants peuvent contourner l’acheminement par proxy au niveau de Node, sauf s’ils héritent des variables d’environnement de proxy et les respectent.
- Les WebUIs locales utilisateur et les serveurs de modèles locaux doivent être placés sur liste d’autorisation dans la politique de proxy de l’opérateur lorsque nécessaire ; OpenClaw n’expose pas de contournement général du réseau local pour eux.
- Le contournement de proxy du plan de contrôle Gateway est intentionnellement limité à `localhost` et aux URL d’IP loopback littérales. Utilisez `ws://127.0.0.1:18789`, `ws://[::1]:18789` ou `ws://localhost:18789` pour les connexions directes locales au plan de contrôle Gateway ; les autres noms d’hôte sont acheminés comme du trafic ordinaire basé sur un nom d’hôte.
- OpenClaw n’inspecte pas, ne teste pas et ne certifie pas votre politique de proxy.
- Traitez les changements de politique de proxy comme des changements opérationnels sensibles à la sécurité.
