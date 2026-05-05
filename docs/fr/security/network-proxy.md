---
read_when:
    - Vous souhaitez une défense en profondeur contre les attaques SSRF et de réassociation DNS
    - Configurer un proxy direct externe pour le trafic d’exécution d’OpenClaw
summary: Comment acheminer le trafic HTTP et WebSocket de l’environnement d’exécution OpenClaw via un proxy de filtrage géré par l’opérateur
title: Proxy réseau
x-i18n:
    generated_at: "2026-05-05T01:50:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: f7ab345d172d63e388ff1221535efd19934dcbf3173f95bc69131f9ad672e0df
    source_path: security/network-proxy.md
    workflow: 16
---

# Proxy réseau

OpenClaw peut acheminer le trafic HTTP et WebSocket d’exécution via un proxy direct géré par l’opérateur. Il s’agit d’une défense en profondeur facultative pour les déploiements qui veulent un contrôle centralisé de la sortie réseau, une protection SSRF renforcée et une meilleure auditabilité réseau.

OpenClaw ne fournit, ne télécharge, ne démarre, ne configure ni ne certifie aucun proxy. Vous exécutez la technologie de proxy adaptée à votre environnement, et OpenClaw y achemine les clients HTTP et WebSocket normaux locaux au processus.

## Pourquoi utiliser un proxy ?

Un proxy donne aux opérateurs un point de contrôle réseau unique pour le trafic HTTP et WebSocket sortant. Cela peut être utile même hors du durcissement SSRF :

- Politique centrale : maintenir une seule politique de sortie au lieu de compter sur chaque point d’appel HTTP applicatif pour appliquer correctement les règles réseau.
- Vérifications à la connexion : évaluer la destination après la résolution DNS et immédiatement avant que le proxy ouvre la connexion en amont.
- Défense contre le DNS rebinding : réduire l’écart entre une vérification DNS au niveau applicatif et la connexion sortante réelle.
- Couverture JavaScript plus large : acheminer les clients ordinaires `fetch`, `node:http`, `node:https`, WebSocket, axios, got, node-fetch et similaires par le même chemin.
- Auditabilité : journaliser les destinations autorisées et refusées à la frontière de sortie.
- Contrôle opérationnel : appliquer des règles de destination, une segmentation réseau, des limites de débit ou des listes d’autorisation sortantes sans reconstruire OpenClaw.

L’acheminement par proxy est un garde-fou au niveau du processus pour les sorties HTTP et WebSocket normales. Il donne aux opérateurs un chemin fermé par défaut pour acheminer les clients HTTP JavaScript pris en charge via leur propre proxy de filtrage, mais ce n’est pas un bac à sable réseau au niveau du système d’exploitation et il ne fait pas certifier par OpenClaw la politique de destination du proxy.

## Comment OpenClaw achemine le trafic

Lorsque `proxy.enabled=true` et qu’une URL de proxy est configurée, les processus d’exécution protégés tels que `openclaw gateway run`, `openclaw node run` et `openclaw agent --local` acheminent les sorties HTTP et WebSocket normales via le proxy configuré :

```text
OpenClaw process
  fetch                  -> operator-managed filtering proxy -> public internet
  node:http and https    -> operator-managed filtering proxy -> public internet
  WebSocket clients      -> operator-managed filtering proxy -> public internet
```

Le contrat public est le comportement d’acheminement, pas les hooks Node internes utilisés pour l’implémenter. Les clients WebSocket du plan de contrôle OpenClaw Gateway utilisent un chemin direct étroit pour le trafic RPC Gateway en local loopback lorsque l’URL du Gateway utilise `localhost` ou une IP de loopback littérale telle que `127.0.0.1` ou `[::1]`. Ce chemin du plan de contrôle doit pouvoir atteindre les Gateways de loopback même lorsque le proxy de l’opérateur bloque les destinations de loopback. Les requêtes HTTP et WebSocket d’exécution normales utilisent toujours le proxy configuré.

En interne, OpenClaw utilise deux hooks d’acheminement au niveau du processus pour cette fonctionnalité :

- L’acheminement par répartiteur Undici couvre `fetch`, les clients adossés à undici et les transports qui fournissent leur propre répartiteur undici.
- L’acheminement `global-agent` couvre les appelants du cœur Node `node:http` et `node:https`, y compris de nombreuses bibliothèques superposées à `http.request`, `https.request`, `http.get` et `https.get`. Le mode proxy géré force cet agent global afin que les agents HTTP Node explicites ne contournent pas accidentellement le proxy de l’opérateur.

Certains plugins possèdent des transports personnalisés qui nécessitent un câblage de proxy explicite même lorsqu’un acheminement au niveau du processus existe. Par exemple, le transport Bot API de Telegram utilise son propre répartiteur HTTP/1 undici et respecte donc l’environnement de proxy du processus ainsi que le repli géré `OPENCLAW_PROXY_URL` dans ce chemin de transport propre à ce propriétaire.

L’URL du proxy elle-même doit utiliser `http://`. Les destinations HTTPS restent prises en charge via le proxy avec HTTP `CONNECT` ; cela signifie seulement qu’OpenClaw attend un écouteur de proxy direct HTTP en clair, comme `http://127.0.0.1:3128`.

Pendant que le proxy est actif, OpenClaw efface `no_proxy`, `NO_PROXY` et `GLOBAL_AGENT_NO_PROXY`. Ces listes de contournement sont basées sur la destination ; laisser `localhost` ou `127.0.0.1` à cet endroit permettrait à des cibles SSRF à haut risque d’éviter le proxy de filtrage.

À l’arrêt, OpenClaw restaure l’environnement de proxy précédent et réinitialise l’état d’acheminement du processus mis en cache.

## Termes de proxy associés

- `proxy.enabled` / `proxy.proxyUrl` : acheminement sortant via proxy direct pour les sorties d’exécution OpenClaw. Cette page documente cette fonctionnalité.
- `gateway.auth.mode: "trusted-proxy"` : authentification entrante par proxy inverse tenant compte de l’identité pour l’accès au Gateway. Voir [Authentification par proxy de confiance](/fr/gateway/trusted-proxy-auth).
- `openclaw proxy` : proxy de débogage local et inspecteur de captures pour le développement et le support. Voir [openclaw proxy](/fr/cli/proxy).
- `tools.web.fetch.useTrustedEnvProxy` : option d’adhésion pour `web_fetch` permettant à un proxy d’environnement HTTP(S) contrôlé par l’opérateur de résoudre le DNS tout en conservant par défaut l’épinglage DNS strict et la politique de noms d’hôte. Voir [Web fetch](/fr/tools/web-fetch#trusted-env-proxy).
- Paramètres de proxy propres à un canal ou à un fournisseur : remplacements propres au propriétaire pour un transport particulier. Préférez le proxy réseau géré lorsque l’objectif est le contrôle centralisé de la sortie réseau dans l’ensemble de l’exécution.

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

Pour les services de Gateway gérés démarrés avec `openclaw gateway start`, préférez stocker l’URL dans la configuration :

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl http://127.0.0.1:3128
openclaw gateway install --force
openclaw gateway start
```

Le repli par environnement convient surtout aux exécutions au premier plan. Si vous l’utilisez avec un service installé, placez `OPENCLAW_PROXY_URL` dans l’environnement durable du service, comme `$OPENCLAW_STATE_DIR/.env` ou `~/.openclaw/.env`, puis réinstallez le service afin que launchd, systemd ou Scheduled Tasks démarre le Gateway avec cette valeur.

Pour les commandes `openclaw --container ...`, OpenClaw transmet `OPENCLAW_PROXY_URL` au CLI enfant ciblant le conteneur lorsqu’elle est définie. L’URL doit être joignable depuis l’intérieur du conteneur ; `127.0.0.1` désigne le conteneur lui-même, pas l’hôte. OpenClaw rejette les URL de proxy en loopback pour les commandes ciblant un conteneur, sauf si vous contournez explicitement cette vérification de sécurité.

## Exigences du proxy

La politique du proxy est la frontière de sécurité. OpenClaw ne peut pas vérifier que le proxy bloque les bonnes cibles.

Configurez le proxy pour :

- Se lier uniquement au loopback ou à une interface privée de confiance.
- Restreindre l’accès afin que seuls le processus OpenClaw, l’hôte, le conteneur ou le compte de service puissent l’utiliser.
- Résoudre lui-même les destinations et bloquer les IP de destination après la résolution DNS.
- Appliquer la politique au moment de la connexion pour les requêtes HTTP en clair comme pour les tunnels HTTPS `CONNECT`.
- Rejeter les contournements basés sur la destination pour les plages de loopback, privées, link-local, de métadonnées, multicast, réservées ou de documentation.
- Éviter les listes d’autorisation de noms d’hôte sauf si vous faites entièrement confiance au chemin de résolution DNS.
- Journaliser la destination, la décision, l’état et la raison sans journaliser les corps de requête, les en-têtes d’autorisation, les cookies ou d’autres secrets.
- Maintenir la politique du proxy sous contrôle de version et examiner les changements comme une configuration sensible à la sécurité.

## Destinations bloquées recommandées

Utilisez cette liste de refus comme point de départ pour tout proxy direct, pare-feu ou politique de sortie.

La logique de classification au niveau applicatif d’OpenClaw se trouve dans `src/infra/net/ssrf.ts` et `src/shared/net/ip.ts`. Les hooks de parité pertinents sont `BLOCKED_HOSTNAMES`, `BLOCKED_IPV4_SPECIAL_USE_RANGES`, `BLOCKED_IPV6_SPECIAL_USE_RANGES`, `RFC2544_BENCHMARK_PREFIX` et la gestion intégrée des sentinelles IPv4 pour NAT64, 6to4, Teredo, ISATAP et les formes IPv4-mappées. Ces fichiers sont des références utiles pour maintenir une politique de proxy externe, mais OpenClaw n’exporte ni n’applique automatiquement ces règles dans votre proxy.

| Plage ou hôte                                                                        | Pourquoi bloquer                                    |
| ------------------------------------------------------------------------------------ | --------------------------------------------------- |
| `127.0.0.0/8`, `localhost`, `localhost.localdomain`                                  | Loopback IPv4                                       |
| `::1/128`                                                                            | Loopback IPv6                                       |
| `0.0.0.0/8`, `::/128`                                                                | Adresses non spécifiées et de ce réseau             |
| `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`                                      | Réseaux privés RFC1918                              |
| `169.254.0.0/16`, `fe80::/10`                                                        | Adresses link-local et chemins courants de métadonnées cloud |
| `169.254.169.254`, `metadata.google.internal`                                        | Services de métadonnées cloud                       |
| `100.64.0.0/10`                                                                      | Espace d’adressage partagé NAT de niveau opérateur  |
| `198.18.0.0/15`, `2001:2::/48`                                                       | Plages de benchmark                                 |
| `192.0.0.0/24`, `192.0.2.0/24`, `198.51.100.0/24`, `203.0.113.0/24`, `2001:db8::/32` | Plages à usage spécial et de documentation          |
| `224.0.0.0/4`, `ff00::/8`                                                            | Multicast                                           |
| `240.0.0.0/4`                                                                        | IPv4 réservée                                       |
| `fc00::/7`, `fec0::/10`                                                              | Plages IPv6 locales/privées                         |
| `100::/64`, `2001:20::/28`                                                           | Plages IPv6 discard et ORCHIDv2                     |
| `64:ff9b::/96`, `64:ff9b:1::/48`                                                     | Préfixes NAT64 avec IPv4 intégrée                   |
| `2002::/16`, `2001::/32`                                                             | 6to4 et Teredo avec IPv4 intégrée                   |
| `::/96`, `::ffff:0:0/96`                                                             | IPv6 compatible IPv4 et IPv6 IPv4-mappée            |

Si votre fournisseur cloud ou votre plateforme réseau documente des hôtes de métadonnées ou plages réservées supplémentaires, ajoutez-les également.

## Validation

Validez le proxy depuis le même hôte, conteneur ou compte de service qui exécute OpenClaw :

```bash
openclaw proxy validate --proxy-url http://127.0.0.1:3128
```

Par défaut, lorsqu’aucune destination personnalisée n’est fournie, la commande vérifie que `https://example.com/` réussit et démarre un canari loopback temporaire que le proxy ne doit pas atteindre. La vérification refusée par défaut réussit lorsque le proxy renvoie une réponse de refus non 2xx ou bloque le canari avec une erreur de transport ; elle échoue si une réponse réussie atteint le canari. Si aucun proxy n’est activé et configuré, la validation signale un problème de configuration ; utilisez `--proxy-url` pour une vérification préliminaire ponctuelle avant de modifier la configuration. Utilisez `--allowed-url` et `--denied-url` pour tester les attentes propres au déploiement. Ajoutez `--apns-reachable` pour vérifier aussi que la livraison HTTP/2 APNs directe peut ouvrir un tunnel CONNECT via le proxy et recevoir une réponse APNs sandbox ; la sonde utilise un jeton de fournisseur volontairement invalide, donc `403 InvalidProviderToken` est attendu et compte comme joignable. Les destinations refusées personnalisées sont fermées par défaut : toute réponse HTTP signifie que la destination était joignable via le proxy, et toute erreur de transport est signalée comme non concluante, car OpenClaw ne peut pas prouver que le proxy a bloqué une origine joignable. En cas d’échec de validation, la commande se termine avec le code 1.

Utilisez `--json` pour l’automatisation. La sortie JSON contient le résultat global, la source effective de la configuration du proxy, les éventuelles erreurs de configuration et chaque vérification de destination. Les identifiants des URL de proxy sont masqués dans les sorties texte et JSON :

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

La requête publique devrait réussir. Les requêtes vers la boucle locale et les métadonnées devraient être bloquées par le proxy. Pour `openclaw proxy validate`, le canari de boucle locale intégré peut distinguer un refus du proxy d’une origine accessible. Les vérifications `--denied-url` personnalisées ne disposent pas de ce canari ; considérez donc les réponses HTTP comme les échecs de transport ambigus comme des échecs de validation, sauf si votre proxy expose un signal de refus propre au déploiement que vous pouvez vérifier séparément.

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

- Le proxy améliore la couverture pour les clients JavaScript HTTP et WebSocket locaux au processus, mais ce n’est pas un bac à sable réseau au niveau du système d’exploitation.
- Les sockets bruts `net`, `tls` et `http2`, les addons natifs et les processus enfants peuvent contourner le routage proxy au niveau de Node, sauf s’ils héritent des variables d’environnement de proxy et les respectent.
- IRC est un canal TCP/TLS brut situé en dehors du routage par proxy direct géré par l’opérateur. Dans les déploiements qui exigent que tout le trafic sortant passe par ce proxy direct, définissez `channels.irc.enabled=false`, sauf si le trafic sortant IRC direct est explicitement approuvé.
- Le proxy de débogage local est un outil de diagnostic, et son transfert amont direct pour les requêtes de proxy et les tunnels CONNECT est désactivé par défaut lorsque le mode de proxy géré est actif ; activez le transfert direct uniquement pour les diagnostics locaux approuvés.
- Les interfaces Web locales de l’utilisateur et les serveurs de modèles locaux doivent être placés dans la liste d’autorisation de la politique de proxy de l’opérateur si nécessaire ; OpenClaw n’expose pas de contournement général du réseau local pour eux.
- Le contournement du proxy du plan de contrôle Gateway est volontairement limité à `localhost` et aux URL d’IP littérales de boucle locale. Utilisez `ws://127.0.0.1:18789`, `ws://[::1]:18789` ou `ws://localhost:18789` pour les connexions locales directes au plan de contrôle Gateway ; les autres noms d’hôte sont routés comme le trafic ordinaire basé sur le nom d’hôte.
- OpenClaw n’inspecte pas, ne teste pas et ne certifie pas votre politique de proxy.
- Traitez les modifications de politique de proxy comme des changements opérationnels sensibles du point de vue de la sécurité.
