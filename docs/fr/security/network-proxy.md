---
read_when:
    - Vous souhaitez une défense en profondeur contre les attaques SSRF et de réassociation DNS
    - Configuration d'un proxy direct externe pour le trafic d'exécution d'OpenClaw
summary: Comment acheminer le trafic HTTP et WebSocket d’exécution d’OpenClaw via un proxy de filtrage géré par l’opérateur
title: Proxy réseau
x-i18n:
    generated_at: "2026-05-04T07:06:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: fc7140c5ced0e7454a6f85d1ea8f3256bbd28cc0cb42eeafe8e5e6439b90e3f0
    source_path: security/network-proxy.md
    workflow: 16
---

# Proxy réseau

OpenClaw peut router le trafic HTTP et WebSocket d’exécution via un proxy direct géré par l’opérateur. Il s’agit d’une défense en profondeur facultative pour les déploiements qui veulent un contrôle centralisé de la sortie réseau, une protection SSRF renforcée et une meilleure auditabilité réseau.

OpenClaw ne fournit pas, ne télécharge pas, ne démarre pas, ne configure pas et ne certifie pas de proxy. Vous exécutez la technologie de proxy adaptée à votre environnement, et OpenClaw y route les clients HTTP et WebSocket locaux au processus.

## Pourquoi utiliser un proxy ?

Un proxy donne aux opérateurs un point de contrôle réseau unique pour le trafic HTTP et WebSocket sortant. Cela peut être utile même en dehors du durcissement SSRF :

- Politique centrale : maintenir une seule politique de sortie au lieu de compter sur chaque point d’appel HTTP applicatif pour appliquer correctement les règles réseau.
- Vérifications à la connexion : évaluer la destination après la résolution DNS et juste avant que le proxy n’ouvre la connexion amont.
- Défense contre le rebinding DNS : réduire l’écart entre une vérification DNS au niveau applicatif et la connexion sortante réelle.
- Couverture JavaScript plus large : router les clients ordinaires `fetch`, `node:http`, `node:https`, WebSocket, axios, got, node-fetch et clients similaires via le même chemin.
- Auditabilité : journaliser les destinations autorisées et refusées à la frontière de sortie.
- Contrôle opérationnel : appliquer des règles de destination, une segmentation réseau, des limites de débit ou des listes d’autorisation sortantes sans reconstruire OpenClaw.

Le routage par proxy est un garde-fou au niveau du processus pour la sortie HTTP et WebSocket normale. Il donne aux opérateurs un chemin à échec fermé pour router les clients HTTP JavaScript pris en charge via leur propre proxy de filtrage, mais ce n’est pas un bac à sable réseau au niveau du système d’exploitation et il ne fait pas certifier par OpenClaw la politique de destination du proxy.

## Comment OpenClaw route le trafic

Lorsque `proxy.enabled=true` et qu’une URL de proxy est configurée, les processus d’exécution protégés tels que `openclaw gateway run`, `openclaw node run` et `openclaw agent --local` routent la sortie HTTP et WebSocket normale via le proxy configuré :

```text
OpenClaw process
  fetch                  -> operator-managed filtering proxy -> public internet
  node:http and https    -> operator-managed filtering proxy -> public internet
  WebSocket clients      -> operator-managed filtering proxy -> public internet
```

Le contrat public est le comportement de routage, pas les hooks Node internes utilisés pour l’implémenter. Les clients WebSocket du plan de contrôle OpenClaw Gateway utilisent un chemin direct étroit pour le trafic RPC Gateway en local loopback lorsque l’URL du Gateway utilise `localhost` ou une adresse IP de bouclage littérale telle que `127.0.0.1` ou `[::1]`. Ce chemin du plan de contrôle doit pouvoir atteindre les Gateways de bouclage même lorsque le proxy de l’opérateur bloque les destinations de bouclage. Les requêtes HTTP et WebSocket d’exécution normales utilisent toujours le proxy configuré.

En interne, OpenClaw utilise deux hooks de routage au niveau du processus pour cette fonctionnalité :

- Le routage du répartiteur Undici couvre `fetch`, les clients basés sur undici et les transports qui fournissent leur propre répartiteur undici.
- Le routage `global-agent` couvre les appelants Node core `node:http` et `node:https`, y compris de nombreuses bibliothèques construites sur `http.request`, `https.request`, `http.get` et `https.get`. Le mode proxy géré force cet agent global afin que les agents HTTP Node explicites ne contournent pas accidentellement le proxy de l’opérateur.

Certains plugins possèdent des transports personnalisés qui nécessitent un câblage de proxy explicite même lorsqu’un routage au niveau du processus existe. Par exemple, le transport Bot API de Telegram utilise son propre répartiteur undici HTTP/1 et respecte donc l’environnement de proxy du processus ainsi que le repli géré `OPENCLAW_PROXY_URL` dans ce chemin de transport propre à ce propriétaire.

L’URL du proxy elle-même doit utiliser `http://`. Les destinations HTTPS restent prises en charge via le proxy avec HTTP `CONNECT` ; cela signifie seulement qu’OpenClaw attend un écouteur de proxy direct HTTP en clair tel que `http://127.0.0.1:3128`.

Pendant que le proxy est actif, OpenClaw efface `no_proxy`, `NO_PROXY` et `GLOBAL_AGENT_NO_PROXY`. Ces listes de contournement étant basées sur la destination, y laisser `localhost` ou `127.0.0.1` permettrait à des cibles SSRF à haut risque d’éviter le proxy de filtrage.

À l’arrêt, OpenClaw restaure l’environnement de proxy précédent et réinitialise l’état de routage de processus mis en cache.

## Termes de proxy connexes

- `proxy.enabled` / `proxy.proxyUrl` : routage par proxy direct sortant pour la sortie d’exécution OpenClaw. Cette page documente cette fonctionnalité.
- `gateway.auth.mode: "trusted-proxy"` : authentification par proxy inverse entrant tenant compte de l’identité pour l’accès au Gateway. Voir [Authentification par proxy approuvé](/fr/gateway/trusted-proxy-auth).
- `openclaw proxy` : proxy de débogage local et inspecteur de capture pour le développement et le support. Voir [openclaw proxy](/fr/cli/proxy).
- Paramètres de proxy propres à un canal ou à un fournisseur : remplacements propres au propriétaire pour un transport particulier. Préférez le proxy réseau géré lorsque l’objectif est un contrôle centralisé de la sortie sur l’ensemble de l’exécution.

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

`proxy.proxyUrl` a priorité sur `OPENCLAW_PROXY_URL`.

Si `enabled=true` mais qu’aucune URL de proxy valide n’est configurée, les commandes protégées échouent au démarrage au lieu de revenir à un accès réseau direct.

Pour les services Gateway gérés démarrés avec `openclaw gateway start`, préférez stocker l’URL dans la configuration :

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl http://127.0.0.1:3128
openclaw gateway install --force
openclaw gateway start
```

Le repli par l’environnement convient surtout aux exécutions au premier plan. Si vous l’utilisez avec un service installé, placez `OPENCLAW_PROXY_URL` dans l’environnement durable du service, par exemple `$OPENCLAW_STATE_DIR/.env` ou `~/.openclaw/.env`, puis réinstallez le service afin que launchd, systemd ou Scheduled Tasks démarre le gateway avec cette valeur.

Pour les commandes `openclaw --container ...`, OpenClaw transmet `OPENCLAW_PROXY_URL` à la CLI enfant ciblant le conteneur lorsqu’elle est définie. L’URL doit être accessible depuis l’intérieur du conteneur ; `127.0.0.1` désigne le conteneur lui-même, pas l’hôte. OpenClaw rejette les URL de proxy en bouclage pour les commandes ciblant un conteneur, sauf si vous remplacez explicitement cette vérification de sécurité.

## Exigences du proxy

La politique du proxy est la frontière de sécurité. OpenClaw ne peut pas vérifier que le proxy bloque les bonnes cibles.

Configurez le proxy pour :

- Se lier uniquement au bouclage ou à une interface privée de confiance.
- Restreindre l’accès afin que seuls le processus, l’hôte, le conteneur ou le compte de service OpenClaw puissent l’utiliser.
- Résoudre lui-même les destinations et bloquer les IP de destination après la résolution DNS.
- Appliquer la politique au moment de la connexion pour les requêtes HTTP en clair comme pour les tunnels HTTPS `CONNECT`.
- Rejeter les contournements basés sur la destination pour les plages de bouclage, privées, link-local, de métadonnées, multicast, réservées ou de documentation.
- Éviter les listes d’autorisation de noms d’hôte sauf si vous faites entièrement confiance au chemin de résolution DNS.
- Journaliser la destination, la décision, l’état et le motif sans journaliser les corps de requête, les en-têtes d’autorisation, les cookies ou d’autres secrets.
- Conserver la politique du proxy sous contrôle de version et examiner les changements comme une configuration sensible pour la sécurité.

## Destinations bloquées recommandées

Utilisez cette liste de refus comme point de départ pour tout proxy direct, pare-feu ou politique de sortie.

La logique de classification au niveau applicatif d’OpenClaw se trouve dans `src/infra/net/ssrf.ts` et `src/shared/net/ip.ts`. Les hooks de parité pertinents sont `BLOCKED_HOSTNAMES`, `BLOCKED_IPV4_SPECIAL_USE_RANGES`, `BLOCKED_IPV6_SPECIAL_USE_RANGES`, `RFC2544_BENCHMARK_PREFIX` et la gestion intégrée des sentinelles IPv4 pour NAT64, 6to4, Teredo, ISATAP et les formes IPv4-mapped. Ces fichiers sont des références utiles lors de la maintenance d’une politique de proxy externe, mais OpenClaw n’exporte ni n’applique automatiquement ces règles dans votre proxy.

| Plage ou hôte                                                                        | Pourquoi bloquer                                    |
| ------------------------------------------------------------------------------------ | --------------------------------------------------- |
| `127.0.0.0/8`, `localhost`, `localhost.localdomain`                                  | Bouclage IPv4                                       |
| `::1/128`                                                                            | Bouclage IPv6                                       |
| `0.0.0.0/8`, `::/128`                                                                | Adresses non spécifiées et du réseau courant        |
| `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`                                      | Réseaux privés RFC1918                              |
| `169.254.0.0/16`, `fe80::/10`                                                        | Adresses link-local et chemins de métadonnées cloud courants |
| `169.254.169.254`, `metadata.google.internal`                                        | Services de métadonnées cloud                       |
| `100.64.0.0/10`                                                                      | Espace d’adressage partagé NAT de classe opérateur  |
| `198.18.0.0/15`, `2001:2::/48`                                                       | Plages de benchmark                                 |
| `192.0.0.0/24`, `192.0.2.0/24`, `198.51.100.0/24`, `203.0.113.0/24`, `2001:db8::/32` | Plages à usage spécial et de documentation          |
| `224.0.0.0/4`, `ff00::/8`                                                            | Multicast                                           |
| `240.0.0.0/4`                                                                        | IPv4 réservé                                        |
| `fc00::/7`, `fec0::/10`                                                              | Plages IPv6 locales/privées                         |
| `100::/64`, `2001:20::/28`                                                           | Plages IPv6 discard et ORCHIDv2                     |
| `64:ff9b::/96`, `64:ff9b:1::/48`                                                     | Préfixes NAT64 avec IPv4 intégrée                   |
| `2002::/16`, `2001::/32`                                                             | 6to4 et Teredo avec IPv4 intégrée                   |
| `::/96`, `::ffff:0:0/96`                                                             | IPv6 compatible IPv4 et IPv6 IPv4-mapped            |

Si votre fournisseur cloud ou votre plateforme réseau documente des hôtes de métadonnées ou des plages réservées supplémentaires, ajoutez-les également.

## Validation

Validez le proxy depuis le même hôte, conteneur ou compte de service qui exécute OpenClaw :

```bash
openclaw proxy validate --proxy-url http://127.0.0.1:3128
```

Par défaut, lorsqu’aucune destination personnalisée n’est fournie, la commande vérifie que `https://example.com/` réussit et démarre un canari de bouclage temporaire que le proxy ne doit pas atteindre. La vérification refusée par défaut réussit lorsque le proxy renvoie une réponse de refus non 2xx ou bloque le canari avec une défaillance de transport ; elle échoue si une réponse réussie atteint le canari. Si aucun proxy n’est activé et configuré, la validation signale un problème de configuration ; utilisez `--proxy-url` pour une pré-vérification ponctuelle avant de modifier la configuration. Utilisez `--allowed-url` et `--denied-url` pour tester les attentes propres au déploiement. Les destinations refusées personnalisées sont à échec fermé : toute réponse HTTP signifie que la destination était accessible via le proxy, et toute erreur de transport est signalée comme non concluante, car OpenClaw ne peut pas prouver que le proxy a bloqué une origine accessible. En cas d’échec de validation, la commande se termine avec le code 1.

Utilisez `--json` pour l’automatisation. La sortie JSON contient le résultat global, la source effective de la configuration du proxy, toute erreur de configuration et chaque vérification de destination. Les identifiants de l’URL de proxy sont expurgés dans la sortie texte et JSON :

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

La requête publique doit réussir. Les requêtes de bouclage et de métadonnées doivent être bloquées par le proxy. Pour `openclaw proxy validate`, le canari de bouclage intégré peut distinguer un refus du proxy d’une origine accessible. Les vérifications `--denied-url` personnalisées ne disposent pas de ce canari ; traitez donc les réponses HTTP comme les échecs de transport ambigus comme des échecs de validation, sauf si votre proxy expose un signal de refus propre au déploiement que vous pouvez vérifier séparément.

Activez ensuite le routage proxy d’OpenClaw :

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

- Le proxy améliore la couverture pour les clients HTTP JavaScript locaux au processus et WebSocket, mais ce n’est pas un bac à sable réseau au niveau du système d’exploitation.
- Les sockets `net`, `tls` et `http2` brutes, les extensions natives et les processus enfants peuvent contourner le routage proxy au niveau de Node, sauf s’ils héritent des variables d’environnement de proxy et les respectent.
- IRC est un canal TCP/TLS brut en dehors du routage par proxy direct géré par l’opérateur. Dans les déploiements qui exigent que toutes les sorties passent par ce proxy direct, définissez `channels.irc.enabled=false`, sauf si la sortie IRC directe est explicitement approuvée.
- Le proxy de débogage local est un outil de diagnostic, et son transfert direct en amont pour les requêtes proxy et les tunnels CONNECT est désactivé par défaut lorsque le mode proxy géré est actif ; n’activez le transfert direct que pour des diagnostics locaux approuvés.
- Les WebUIs locales des utilisateurs et les serveurs de modèles locaux doivent être ajoutés à la liste d’autorisation dans la politique de proxy de l’opérateur lorsque nécessaire ; OpenClaw n’expose pas de contournement général du réseau local pour eux.
- Le contournement du proxy du plan de contrôle Gateway est volontairement limité à `localhost` et aux URL avec adresses IP de bouclage littérales. Utilisez `ws://127.0.0.1:18789`, `ws://[::1]:18789` ou `ws://localhost:18789` pour les connexions locales directes au plan de contrôle Gateway ; les autres noms d’hôte sont routés comme du trafic ordinaire basé sur un nom d’hôte.
- OpenClaw n’inspecte, ne teste ni ne certifie votre politique de proxy.
- Traitez les modifications de politique de proxy comme des changements opérationnels sensibles à la sécurité.
