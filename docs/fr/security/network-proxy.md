---
read_when:
    - Vous voulez une défense en profondeur contre les attaques SSRF et les attaques par réassociation DNS
    - Configurer un proxy direct externe pour le trafic d’exécution d’OpenClaw
summary: Comment acheminer le trafic HTTP et WebSocket d’exécution d’OpenClaw via un proxy de filtrage géré par l’opérateur
title: Proxy réseau
x-i18n:
    generated_at: "2026-05-07T16:23:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 22895b7c5521927b7145f55dff9b777e701691f01a6421db0f5b1ff489734775
    source_path: security/network-proxy.md
    workflow: 16
---

OpenClaw peut router le trafic HTTP et WebSocket d’exécution via un proxy direct géré par l’opérateur. Il s’agit d’une défense en profondeur facultative pour les déploiements qui souhaitent un contrôle centralisé de la sortie réseau, une protection SSRF renforcée et une meilleure auditabilité réseau.

OpenClaw ne fournit, ne télécharge, ne démarre, ne configure ni ne certifie aucun proxy. Vous exécutez la technologie de proxy adaptée à votre environnement, et OpenClaw y route les clients HTTP et WebSocket process-local normaux.

## Pourquoi utiliser un proxy

Un proxy donne aux opérateurs un point de contrôle réseau unique pour le trafic HTTP et WebSocket sortant. Cela peut être utile même en dehors du renforcement contre SSRF :

- Politique centralisée : maintenir une seule politique de sortie au lieu de compter sur chaque point d’appel HTTP de l’application pour appliquer correctement les règles réseau.
- Contrôles au moment de la connexion : évaluer la destination après la résolution DNS et immédiatement avant que le proxy n’ouvre la connexion en amont.
- Défense contre le DNS rebinding : réduire l’écart entre une vérification DNS au niveau de l’application et la connexion sortante réelle.
- Couverture JavaScript plus large : router les clients ordinaires `fetch`, `node:http`, `node:https`, WebSocket, axios, got, node-fetch et similaires via le même chemin.
- Auditabilité : journaliser les destinations autorisées et refusées à la frontière de sortie.
- Contrôle opérationnel : appliquer des règles de destination, une segmentation réseau, des limites de débit ou des listes d’autorisation sortantes sans reconstruire OpenClaw.

Le routage par proxy est un garde-fou au niveau du processus pour la sortie HTTP et WebSocket normale. Il donne aux opérateurs un chemin fermé par défaut pour router les clients HTTP JavaScript pris en charge via leur propre proxy de filtrage, mais ce n’est pas un bac à sable réseau au niveau du système d’exploitation et cela ne fait pas certifier par OpenClaw la politique de destination du proxy.

## Comment OpenClaw route le trafic

Lorsque `proxy.enabled=true` et qu’une URL de proxy est configurée, les processus d’exécution protégés comme `openclaw gateway run`, `openclaw node run` et `openclaw agent --local` routent la sortie HTTP et WebSocket normale via le proxy configuré :

```text
OpenClaw process
  fetch                  -> operator-managed filtering proxy -> public internet
  node:http and https    -> operator-managed filtering proxy -> public internet
  WebSocket clients      -> operator-managed filtering proxy -> public internet
```

Le contrat public est le comportement de routage, pas les hooks Node internes utilisés pour l’implémenter. Les clients WebSocket du plan de contrôle OpenClaw Gateway utilisent un chemin direct étroit pour le trafic RPC de Gateway local loopback lorsque l’URL du Gateway utilise `localhost` ou une IP de bouclage littérale comme `127.0.0.1` ou `[::1]`. Ce chemin de plan de contrôle doit pouvoir atteindre les Gateways de bouclage même lorsque le proxy de l’opérateur bloque les destinations de bouclage. Les requêtes HTTP et WebSocket d’exécution normales utilisent toujours le proxy configuré.

En interne, OpenClaw utilise deux hooks de routage au niveau du processus pour cette fonctionnalité :

- Le routage par dispatcher Undici couvre `fetch`, les clients basés sur undici et les transports qui fournissent leur propre dispatcher undici.
- Le routage `global-agent` couvre les appelants Node core `node:http` et `node:https`, y compris de nombreuses bibliothèques construites sur `http.request`, `https.request`, `http.get` et `https.get`. Le mode proxy géré force cet agent global afin que les agents HTTP Node explicites ne contournent pas accidentellement le proxy de l’opérateur.

Certains plugins possèdent des transports personnalisés qui nécessitent un câblage de proxy explicite même lorsque le routage au niveau du processus existe. Par exemple, le transport Bot API de Telegram utilise son propre dispatcher HTTP/1 undici et respecte donc l’environnement de proxy du processus ainsi que le repli géré `OPENCLAW_PROXY_URL` dans ce chemin de transport propre à son propriétaire.

L’URL du proxy elle-même doit utiliser `http://`. Les destinations HTTPS restent prises en charge via le proxy avec HTTP `CONNECT` ; cela signifie seulement qu’OpenClaw attend un écouteur de proxy direct HTTP simple, comme `http://127.0.0.1:3128`.

Pendant que le proxy est actif, OpenClaw efface `no_proxy`, `NO_PROXY` et `GLOBAL_AGENT_NO_PROXY`. Ces listes de contournement sont basées sur la destination ; laisser `localhost` ou `127.0.0.1` dedans permettrait à des cibles SSRF à haut risque d’éviter le proxy de filtrage.

À l’arrêt, OpenClaw restaure l’environnement de proxy précédent et réinitialise l’état de routage du processus mis en cache.

## Termes de proxy associés

- `proxy.enabled` / `proxy.proxyUrl` : routage par proxy direct sortant pour la sortie d’exécution OpenClaw. Cette page documente cette fonctionnalité.
- `gateway.auth.mode: "trusted-proxy"` : authentification de proxy inverse entrante, consciente de l’identité, pour l’accès au Gateway. Consultez [Authentification par proxy de confiance](/fr/gateway/trusted-proxy-auth).
- `openclaw proxy` : proxy de débogage local et inspecteur de capture pour le développement et le support. Consultez [openclaw proxy](/fr/cli/proxy).
- `tools.web.fetch.useTrustedEnvProxy` : option d’activation pour `web_fetch` permettant à un proxy d’environnement HTTP(S) contrôlé par l’opérateur de résoudre le DNS tout en conservant par défaut l’épinglage DNS strict et la politique de nom d’hôte. Consultez [Web fetch](/fr/tools/web-fetch#trusted-env-proxy).
- Paramètres de proxy propres à un canal ou à un fournisseur : remplacements propres au propriétaire pour un transport particulier. Préférez le proxy réseau géré lorsque l’objectif est un contrôle centralisé de la sortie sur toute l’exécution.

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

### Mode de bouclage du Gateway

Les clients locaux du plan de contrôle du Gateway se connectent généralement à un WebSocket de bouclage comme `ws://127.0.0.1:18789`. Utilisez `proxy.loopbackMode` pour choisir le comportement de ce trafic pendant que le proxy géré est actif :

```yaml
proxy:
  enabled: true
  proxyUrl: http://127.0.0.1:3128
  loopbackMode: gateway-only # gateway-only, proxy, or block
```

- `gateway-only` (par défaut) : OpenClaw enregistre l’autorité de bouclage du Gateway dans le contrôleur `NO_PROXY` `global-agent` actif afin que le trafic WebSocket local du Gateway puisse se connecter directement. Les ports de Gateway de bouclage personnalisés fonctionnent parce que l’hôte et le port de l’URL du Gateway actif sont enregistrés.
- `proxy` : OpenClaw n’enregistre pas d’autorité `NO_PROXY` de bouclage du Gateway, donc le trafic local du Gateway est envoyé via le proxy géré. Si le proxy est distant, il doit fournir un routage spécial vers le service de bouclage de l’hôte OpenClaw, par exemple en le mappant vers un nom d’hôte, une IP ou un tunnel joignable par le proxy. Les proxys distants standard résolvent `127.0.0.1` et `localhost` depuis l’hôte du proxy, pas depuis l’hôte OpenClaw.
- `block` : OpenClaw refuse les connexions de plan de contrôle de Gateway en bouclage avant d’ouvrir un socket.

Si `enabled=true` mais qu’aucune URL de proxy valide n’est configurée, les commandes protégées échouent au démarrage au lieu de revenir à un accès réseau direct.

Pour les services gateway gérés démarrés avec `openclaw gateway start`, préférez stocker l’URL dans la configuration :

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl http://127.0.0.1:3128
openclaw gateway install --force
openclaw gateway start
```

Le repli par environnement convient mieux aux exécutions au premier plan. Si vous l’utilisez avec un service installé, placez `OPENCLAW_PROXY_URL` dans l’environnement durable du service, par exemple `$OPENCLAW_STATE_DIR/.env` ou `~/.openclaw/.env`, puis réinstallez le service afin que launchd, systemd ou Scheduled Tasks démarre le gateway avec cette valeur.

Pour les commandes `openclaw --container ...`, OpenClaw transmet `OPENCLAW_PROXY_URL` à la CLI enfant ciblant le conteneur lorsqu’elle est définie. L’URL doit être joignable depuis l’intérieur du conteneur ; `127.0.0.1` désigne le conteneur lui-même, pas l’hôte. OpenClaw rejette les URL de proxy de bouclage pour les commandes ciblant un conteneur, sauf si vous remplacez explicitement ce contrôle de sécurité.

## Exigences du proxy

La politique du proxy est la frontière de sécurité. OpenClaw ne peut pas vérifier que le proxy bloque les bonnes cibles.

Configurez le proxy pour :

- Se lier uniquement au bouclage ou à une interface privée de confiance.
- Restreindre l’accès afin que seuls le processus, l’hôte, le conteneur ou le compte de service OpenClaw puissent l’utiliser.
- Résoudre lui-même les destinations et bloquer les IP de destination après la résolution DNS.
- Appliquer la politique au moment de la connexion pour les requêtes HTTP simples comme pour les tunnels HTTPS `CONNECT`.
- Refuser les contournements basés sur la destination pour les plages de bouclage, privées, link-local, de métadonnées, de multidiffusion, réservées ou de documentation.
- Éviter les listes d’autorisation de noms d’hôte, sauf si vous faites entièrement confiance au chemin de résolution DNS.
- Journaliser la destination, la décision, l’état et le motif sans journaliser les corps de requête, les en-têtes d’autorisation, les cookies ou d’autres secrets.
- Garder la politique de proxy sous contrôle de version et examiner les changements comme une configuration sensible à la sécurité.

## Destinations bloquées recommandées

Utilisez cette liste de refus comme point de départ pour tout proxy direct, pare-feu ou politique de sortie.

La logique de classification au niveau de l’application OpenClaw se trouve dans `src/infra/net/ssrf.ts` et `src/shared/net/ip.ts`. Les hooks de parité pertinents sont `BLOCKED_HOSTNAMES`, `BLOCKED_IPV4_SPECIAL_USE_RANGES`, `BLOCKED_IPV6_SPECIAL_USE_RANGES`, `RFC2544_BENCHMARK_PREFIX` et la gestion intégrée des sentinelles IPv4 pour NAT64, 6to4, Teredo, ISATAP et les formes IPv4-mapped. Ces fichiers sont des références utiles lors de la maintenance d’une politique de proxy externe, mais OpenClaw n’exporte ni n’applique automatiquement ces règles dans votre proxy.

| Plage ou hôte                                                                        | Pourquoi bloquer                                      |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------- |
| `127.0.0.0/8`, `localhost`, `localhost.localdomain`                                  | Bouclage IPv4                                        |
| `::1/128`                                                                            | Bouclage IPv6                                        |
| `0.0.0.0/8`, `::/128`                                                                | Adresses non spécifiées et de ce réseau              |
| `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`                                      | Réseaux privés RFC1918                               |
| `169.254.0.0/16`, `fe80::/10`                                                        | Adresses link-local et chemins courants de métadonnées cloud |
| `169.254.169.254`, `metadata.google.internal`                                        | Services de métadonnées cloud                        |
| `100.64.0.0/10`                                                                      | Espace d’adresses partagé NAT de niveau opérateur    |
| `198.18.0.0/15`, `2001:2::/48`                                                       | Plages de test de performance                        |
| `192.0.0.0/24`, `192.0.2.0/24`, `198.51.100.0/24`, `203.0.113.0/24`, `2001:db8::/32` | Plages à usage spécial et de documentation           |
| `224.0.0.0/4`, `ff00::/8`                                                            | Multidiffusion                                       |
| `240.0.0.0/4`                                                                        | IPv4 réservé                                         |
| `fc00::/7`, `fec0::/10`                                                              | Plages IPv6 locales/privées                          |
| `100::/64`, `2001:20::/28`                                                           | Plages IPv6 discard et ORCHIDv2                      |
| `64:ff9b::/96`, `64:ff9b:1::/48`                                                     | Préfixes NAT64 avec IPv4 intégrée                    |
| `2002::/16`, `2001::/32`                                                             | 6to4 et Teredo avec IPv4 intégrée                    |
| `::/96`, `::ffff:0:0/96`                                                             | IPv6 compatible IPv4 et IPv6 IPv4-mapped             |

Si votre fournisseur cloud ou votre plateforme réseau documente des hôtes de métadonnées ou des plages réservées supplémentaires, ajoutez-les aussi.

## Validation

Validez le proxy depuis le même hôte, conteneur ou compte de service qui exécute OpenClaw :

```bash
openclaw proxy validate --proxy-url http://127.0.0.1:3128
```

Par défaut, lorsqu’aucune destination personnalisée n’est fournie, la commande vérifie que `https://example.com/` réussit et démarre un canari loopback temporaire que le proxy ne doit pas atteindre. La vérification refusée par défaut réussit lorsque le proxy renvoie une réponse de refus non-2xx ou bloque le canari avec une défaillance de transport ; elle échoue si une réponse réussie atteint le canari. Si aucun proxy n’est activé et configuré, la validation signale un problème de configuration ; utilisez `--proxy-url` pour une vérification préalable ponctuelle avant de modifier la configuration. Utilisez `--allowed-url` et `--denied-url` pour tester les attentes propres au déploiement. Ajoutez `--apns-reachable` pour vérifier aussi que la livraison HTTP/2 APNs directe peut ouvrir un tunnel CONNECT via le proxy et recevoir une réponse APNs de bac à sable ; la sonde utilise un jeton fournisseur volontairement invalide, donc `403 InvalidProviderToken` est attendu et compte comme atteignable. Les destinations refusées personnalisées sont à fermeture sécurisée : toute réponse HTTP signifie que la destination était atteignable via le proxy, et toute erreur de transport est signalée comme non concluante, car OpenClaw ne peut pas prouver que le proxy a bloqué une origine atteignable. En cas d’échec de la validation, la commande se termine avec le code 1.

Utilisez `--json` pour l’automatisation. La sortie JSON contient le résultat global, la source effective de la configuration du proxy, toute erreur de configuration et chaque vérification de destination. Les identifiants de l’URL du proxy sont masqués dans les sorties texte et JSON :

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

La requête publique doit réussir. Les requêtes loopback et de métadonnées doivent être bloquées par le proxy. Pour `openclaw proxy validate`, le canari loopback intégré peut distinguer un refus du proxy d’une origine atteignable. Les vérifications `--denied-url` personnalisées ne disposent pas de ce canari ; traitez donc les réponses HTTP et les défaillances de transport ambiguës comme des échecs de validation, sauf si votre proxy expose un signal de refus propre au déploiement que vous pouvez vérifier séparément.

Activez ensuite le routage proxy OpenClaw :

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

- Le proxy améliore la couverture pour les clients HTTP JavaScript et WebSocket locaux au processus, mais ce n’est pas un bac à sable réseau au niveau du système d’exploitation.
- Le trafic loopback du plan de contrôle du Gateway utilise par défaut un contournement local direct via `proxy.loopbackMode: "gateway-only"`. OpenClaw met en œuvre ce contournement en enregistrant l’autorité loopback du Gateway actif dans le contrôleur `NO_PROXY` `global-agent` géré. Les opérateurs peuvent définir `proxy.loopbackMode: "proxy"` pour envoyer le trafic loopback du Gateway via le proxy géré, ou `proxy.loopbackMode: "block"` pour refuser les connexions loopback du Gateway. Consultez [Mode Loopback du Gateway](#gateway-loopback-mode) pour la mise en garde liée au proxy distant.
- Les sockets brutes `net`, `tls` et `http2`, les modules natifs et les processus enfants non OpenClaw peuvent contourner le routage proxy au niveau de Node, sauf s’ils héritent des variables d’environnement du proxy et les respectent. Les CLI enfants OpenClaw issus d’un fork héritent de l’URL du proxy géré et de l’état `proxy.loopbackMode`.
- IRC est un canal TCP/TLS brut situé hors du routage de proxy direct géré par l’opérateur. Dans les déploiements qui exigent que toute sortie passe par ce proxy direct, définissez `channels.irc.enabled=false` sauf si la sortie IRC directe est explicitement approuvée.
- Le proxy de débogage local est un outil de diagnostic, et son transfert amont direct pour les requêtes proxy et les tunnels CONNECT est désactivé par défaut lorsque le mode proxy géré est actif ; n’activez le transfert direct que pour des diagnostics locaux approuvés.
- Les WebUI locales utilisateur et les serveurs de modèles locaux doivent être ajoutés à la liste d’autorisation dans la politique proxy de l’opérateur lorsque nécessaire ; OpenClaw n’expose pas de contournement général du réseau local pour eux.
- Le contournement proxy du plan de contrôle du Gateway est intentionnellement limité à `localhost` et aux URL IP loopback littérales. Utilisez `ws://127.0.0.1:18789`, `ws://[::1]:18789` ou `ws://localhost:18789` pour les connexions locales directes au plan de contrôle du Gateway ; les autres noms d’hôte sont routés comme du trafic ordinaire basé sur un nom d’hôte.
- OpenClaw n’inspecte pas, ne teste pas et ne certifie pas votre politique proxy.
- Traitez les modifications de politique proxy comme des modifications opérationnelles sensibles à la sécurité.

| Surface                                                      | État du proxy géré                                                                                |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| `fetch`, `node:http`, `node:https`, clients WebSocket courants | Routés via les hooks de proxy géré lorsqu’ils sont configurés.                                      |
| HTTP/2 APNs direct                                           | Routé via l’assistant CONNECT géré APNs.                                                           |
| Loopback du plan de contrôle du Gateway                      | Direct uniquement pour l’URL locale configurée du Gateway loopback.                                |
| Transfert amont du proxy de débogage                         | Désactivé lorsque le mode proxy géré est actif, sauf activation explicite pour les diagnostics locaux. |
| IRC                                                          | TCP/TLS brut ; non relayé par le mode proxy HTTP géré. Désactivez-le sauf si la sortie IRC directe est approuvée. |
| Autres appels clients bruts `net`, `tls` ou `http2`           | Doivent être classés par la protection des sockets brutes avant intégration.                       |
