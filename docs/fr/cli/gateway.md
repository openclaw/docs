---
read_when:
    - Exécuter le Gateway depuis la CLI (développement ou serveurs)
    - Débogage de l’authentification Gateway, des modes de liaison et de la connectivité
    - Découvrir des Gateways via Bonjour (DNS-SD local et étendu)
summary: CLI Gateway OpenClaw (`openclaw gateway`) — exécuter, interroger et découvrir des Gateways
title: gateway
x-i18n:
    generated_at: "2026-04-23T07:01:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 30d261a33e54bed10c17c14d09d0dd2b8e227bbf9f0ed415e332e7bda4803f1e
    source_path: cli/gateway.md
    workflow: 15
---

# CLI Gateway

Le Gateway est le serveur WebSocket d’OpenClaw (canaux, nœuds, sessions, hooks).

Les sous-commandes de cette page se trouvent sous `openclaw gateway …`.

Documentation liée :

- [/gateway/bonjour](/fr/gateway/bonjour)
- [/gateway/discovery](/fr/gateway/discovery)
- [/gateway/configuration](/fr/gateway/configuration)

## Exécuter le Gateway

Exécuter un processus Gateway local :

```bash
openclaw gateway
```

Alias au premier plan :

```bash
openclaw gateway run
```

Remarques :

- Par défaut, le Gateway refuse de démarrer sauf si `gateway.mode=local` est défini dans `~/.openclaw/openclaw.json`. Utilisez `--allow-unconfigured` pour des exécutions ad hoc/de développement.
- `openclaw onboard --mode local` et `openclaw setup` sont censés écrire `gateway.mode=local`. Si le fichier existe mais que `gateway.mode` est absent, considérez cela comme une configuration cassée ou écrasée et réparez-la au lieu de supposer implicitement le mode local.
- Si le fichier existe et que `gateway.mode` est absent, le Gateway considère cela comme un dommage de configuration suspect et refuse de « supposer local » à votre place.
- La liaison au-delà de loopback sans authentification est bloquée (garde-fou de sécurité).
- `SIGUSR1` déclenche un redémarrage en cours de processus lorsqu’il est autorisé (`commands.restart` est activé par défaut ; définissez `commands.restart: false` pour bloquer le redémarrage manuel, tandis que les opérations gateway tool/config apply/update restent autorisées).
- Les gestionnaires `SIGINT`/`SIGTERM` arrêtent le processus gateway, mais ils ne restaurent aucun état personnalisé du terminal. Si vous encapsulez la CLI avec une TUI ou une entrée en mode brut, restaurez le terminal avant la sortie.

### Options

- `--port <port>` : port WebSocket (la valeur par défaut vient de la configuration/de l’environnement ; généralement `18789`).
- `--bind <loopback|lan|tailnet|auto|custom>` : mode de liaison de l’écouteur.
- `--auth <token|password>` : remplacement du mode d’authentification.
- `--token <token>` : remplacement du jeton (définit aussi `OPENCLAW_GATEWAY_TOKEN` pour le processus).
- `--password <password>` : remplacement du mot de passe. Avertissement : les mots de passe en ligne peuvent être exposés dans les listes locales de processus.
- `--password-file <path>` : lire le mot de passe du Gateway depuis un fichier.
- `--tailscale <off|serve|funnel>` : exposer le Gateway via Tailscale.
- `--tailscale-reset-on-exit` : réinitialiser la configuration Tailscale serve/funnel à l’arrêt.
- `--allow-unconfigured` : autoriser le démarrage du Gateway sans `gateway.mode=local` dans la configuration. Cela contourne la garde au démarrage uniquement pour un amorçage ad hoc/de développement ; cela n’écrit ni ne répare le fichier de configuration.
- `--dev` : créer une configuration + un espace de travail de développement s’ils sont absents (ignore `BOOTSTRAP.md`).
- `--reset` : réinitialiser la configuration de développement + les identifiants + les sessions + l’espace de travail (nécessite `--dev`).
- `--force` : arrêter tout écouteur existant sur le port sélectionné avant de démarrer.
- `--verbose` : journaux détaillés.
- `--cli-backend-logs` : afficher uniquement les journaux du backend CLI dans la console (et activer stdout/stderr).
- `--ws-log <auto|full|compact>` : style de journal WebSocket (par défaut `auto`).
- `--compact` : alias de `--ws-log compact`.
- `--raw-stream` : journaliser les événements bruts de flux du modèle en jsonl.
- `--raw-stream-path <path>` : chemin jsonl du flux brut.

Profilage du démarrage :

- Définissez `OPENCLAW_GATEWAY_STARTUP_TRACE=1` pour journaliser les minutages par phase pendant le démarrage du Gateway.
- Exécutez `pnpm test:startup:gateway -- --runs 5 --warmup 1` pour mesurer le démarrage du Gateway. Le benchmark enregistre la première sortie du processus, `/healthz`, `/readyz` et les minutages de trace de démarrage.

## Interroger un Gateway en cours d’exécution

Toutes les commandes de requête utilisent WebSocket RPC.

Modes de sortie :

- Par défaut : lisible par humain (coloré en TTY).
- `--json` : JSON lisible par machine (sans style/spinner).
- `--no-color` (ou `NO_COLOR=1`) : désactiver ANSI tout en conservant la mise en page lisible par humain.

Options partagées (lorsqu’elles sont prises en charge) :

- `--url <url>` : URL WebSocket du Gateway.
- `--token <token>` : jeton du Gateway.
- `--password <password>` : mot de passe du Gateway.
- `--timeout <ms>` : délai/budget (varie selon la commande).
- `--expect-final` : attendre une réponse « finale » (appels d’agent).

Remarque : lorsque vous définissez `--url`, la CLI ne revient pas aux identifiants de configuration ou d’environnement.
Passez explicitement `--token` ou `--password`. L’absence d’identifiants explicites est une erreur.

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

Le point de terminaison HTTP `/healthz` est une sonde de vivacité : il répond dès que le serveur peut répondre en HTTP. Le point de terminaison HTTP `/readyz` est plus strict et reste rouge pendant que les sidecars de démarrage, les canaux ou les hooks configurés sont encore en train de se stabiliser.

### `gateway usage-cost`

Récupérer les résumés de coût d’utilisation à partir des journaux de session.

```bash
openclaw gateway usage-cost
openclaw gateway usage-cost --days 7
openclaw gateway usage-cost --json
```

Options :

- `--days <days>` : nombre de jours à inclure (par défaut `30`).

### `gateway stability`

Récupérer le journal de stabilité diagnostique récent depuis un Gateway en cours d’exécution.

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --bundle latest
openclaw gateway stability --bundle latest --export
openclaw gateway stability --json
```

Options :

- `--limit <limit>` : nombre maximal d’événements récents à inclure (par défaut `25`, max `1000`).
- `--type <type>` : filtrer par type d’événement diagnostique, tel que `payload.large` ou `diagnostic.memory.pressure`.
- `--since-seq <seq>` : inclure uniquement les événements après un numéro de séquence diagnostique.
- `--bundle [path]` : lire un bundle de stabilité persisté au lieu d’appeler le Gateway en cours d’exécution. Utilisez `--bundle latest` (ou simplement `--bundle`) pour le bundle le plus récent sous le répertoire d’état, ou passez directement un chemin JSON de bundle.
- `--export` : écrire un zip de diagnostics de support partageable au lieu d’afficher les détails de stabilité.
- `--output <path>` : chemin de sortie pour `--export`.

Remarques :

- Le journal est actif par défaut et sans payload : il capture uniquement des métadonnées opérationnelles, pas le texte du chat, les sorties d’outils, ni les corps bruts des requêtes ou réponses. Définissez `diagnostics.enabled: false` uniquement lorsque vous devez désactiver entièrement la collecte du heartbeat diagnostique du Gateway.
- Les enregistrements conservent des métadonnées opérationnelles : noms d’événements, nombres, tailles en octets, relevés mémoire, état de file d’attente/session, noms de canaux/plugins et résumés de session expurgés. Ils ne conservent pas le texte du chat, les corps de Webhook, les sorties d’outils, les corps bruts de requêtes ou réponses, les jetons, les cookies, les valeurs secrètes, les noms d’hôte ni les identifiants de session bruts.
- En cas de sortie fatale du Gateway, de délais d’arrêt et d’échecs de redémarrage au démarrage, OpenClaw écrit le même instantané diagnostique dans `~/.openclaw/logs/stability/openclaw-stability-*.json` lorsque le journal contient des événements. Inspectez le bundle le plus récent avec `openclaw gateway stability --bundle latest` ; `--limit`, `--type` et `--since-seq` s’appliquent aussi à la sortie de bundle.

### `gateway diagnostics export`

Écrire un zip de diagnostics local conçu pour être joint à des signalements de bogue.

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

Options :

- `--output <path>` : chemin du zip de sortie. Par défaut, un export de support sous le répertoire d’état.
- `--log-lines <count>` : nombre maximal de lignes de journal assainies à inclure (par défaut `5000`).
- `--log-bytes <bytes>` : nombre maximal d’octets de journal à inspecter (par défaut `1000000`).
- `--url <url>` : URL WebSocket du Gateway pour l’instantané d’état.
- `--token <token>` : jeton du Gateway pour l’instantané d’état.
- `--password <password>` : mot de passe du Gateway pour l’instantané d’état.
- `--timeout <ms>` : délai d’expiration de l’instantané status/health (par défaut `3000`).
- `--no-stability-bundle` : ignorer la recherche de bundle de stabilité persisté.
- `--json` : afficher en JSON le chemin écrit, la taille et le manifeste.

L’export contient un manifeste, un résumé Markdown, la forme de la configuration, des détails de configuration assainis, des résumés de journaux assainis, des instantanés assainis de statut/health du Gateway et le bundle de stabilité le plus récent lorsqu’il existe.

Il est destiné à être partagé. Il conserve les détails opérationnels utiles au débogage, tels que les champs de journal OpenClaw sûrs, les noms de sous-systèmes, les codes de statut, les durées, les modes configurés, les ports, les identifiants de plugin, les identifiants de provider, les paramètres de fonctionnalité non secrets et les messages de journal opérationnels expurgés. Il omet ou expurge le texte du chat, les corps de Webhook, les sorties d’outils, les identifiants, les cookies, les identifiants de compte/message, le texte de prompt/instruction, les noms d’hôte et les valeurs secrètes. Lorsqu’un message de type LogTape ressemble à du texte de payload utilisateur/chat/outil, l’export conserve uniquement le fait qu’un message a été omis ainsi que son nombre d’octets.

### `gateway status`

`gateway status` affiche le service Gateway (launchd/systemd/schtasks) ainsi qu’une sonde optionnelle de capacité de connectivité/authentification.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

Options :

- `--url <url>` : ajouter une cible de sonde explicite. La cible distante configurée + localhost sont toujours sondés.
- `--token <token>` : authentification par jeton pour la sonde.
- `--password <password>` : authentification par mot de passe pour la sonde.
- `--timeout <ms>` : délai d’expiration de la sonde (par défaut `10000`).
- `--no-probe` : ignorer la sonde de connectivité (vue service uniquement).
- `--deep` : analyser aussi les services au niveau système.
- `--require-rpc` : faire passer la sonde de connectivité par défaut en sonde de lecture et retourner un code non nul lorsque cette sonde de lecture échoue. Ne peut pas être combiné avec `--no-probe`.

Remarques :

- `gateway status` reste disponible pour les diagnostics même lorsque la configuration CLI locale est absente ou invalide.
- `gateway status` par défaut prouve l’état du service, la connexion WebSocket et la capacité d’authentification visible au moment du handshake. Il ne prouve pas les opérations read/write/admin.
- `gateway status` résout les SecretRefs d’authentification configurés pour l’authentification de la sonde lorsque c’est possible.
- Si un SecretRef d’authentification requis n’est pas résolu dans ce chemin de commande, `gateway status --json` signale `rpc.authWarning` lorsque la connectivité/l’authentification de la sonde échoue ; passez explicitement `--token`/`--password` ou résolvez d’abord la source secrète.
- Si la sonde réussit, les avertissements auth-ref non résolus sont supprimés pour éviter les faux positifs.
- Utilisez `--require-rpc` dans les scripts et automatisations lorsqu’un service à l’écoute ne suffit pas et que vous avez aussi besoin que les appels RPC de portée lecture soient sains.
- `--deep` ajoute une analyse au mieux pour les installations launchd/systemd/schtasks supplémentaires. Lorsque plusieurs services de type gateway sont détectés, la sortie humaine affiche des conseils de nettoyage et avertit que la plupart des configurations devraient exécuter un seul gateway par machine.
- La sortie humaine inclut le chemin de journal de fichier résolu ainsi que l’instantané des chemins/validités de configuration CLI-vs-service pour aider à diagnostiquer les dérives de profil ou de state-dir.
- Sur les installations Linux systemd, les vérifications de dérive d’authentification du service lisent les valeurs `Environment=` et `EnvironmentFile=` de l’unité (y compris `%h`, les chemins entre guillemets, plusieurs fichiers et les fichiers optionnels `-`).
- Les vérifications de dérive résolvent les SecretRefs `gateway.auth.token` à l’aide de l’environnement d’exécution fusionné (environnement de commande du service d’abord, puis repli sur l’environnement du processus).
- Si l’authentification par jeton n’est pas effectivement active (mode `gateway.auth.mode` explicite `password`/`none`/`trusted-proxy`, ou mode non défini où le mot de passe peut l’emporter et où aucun candidat jeton ne peut l’emporter), les vérifications de dérive de jeton ignorent la résolution du jeton de configuration.

### `gateway probe`

`gateway probe` est la commande « tout déboguer ». Elle sonde toujours :

- votre gateway distant configuré (si défini), et
- localhost (local loopback) **même si un distant est configuré**.

Si vous passez `--url`, cette cible explicite est ajoutée avant les deux. La sortie humaine étiquette les
cibles comme suit :

- `URL (explicite)`
- `Remote (configured)` ou `Remote (configured, inactive)`
- `Local loopback`

Si plusieurs Gateways sont joignables, elle les affiche tous. Plusieurs Gateways sont pris en charge lorsque vous utilisez des profils/ports isolés (par exemple, un bot de secours), mais la plupart des installations exécutent tout de même un seul gateway.

```bash
openclaw gateway probe
openclaw gateway probe --json
```

Interprétation :

- `Reachable: yes` signifie qu’au moins une cible a accepté une connexion WebSocket.
- `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` indique ce que la sonde a pu prouver à propos de l’authentification. Cela est distinct de la joignabilité.
- `Read probe: ok` signifie que les appels RPC détaillés de portée lecture (`health`/`status`/`system-presence`/`config.get`) ont également réussi.
- `Read probe: limited - missing scope: operator.read` signifie que la connexion a réussi mais que le RPC de portée lecture est limité. Cela est signalé comme une joignabilité **dégradée**, et non comme un échec complet.
- Le code de sortie est non nul uniquement lorsqu’aucune cible sondée n’est joignable.

Remarques JSON (`--json`) :

- Niveau supérieur :
  - `ok` : au moins une cible est joignable.
  - `degraded` : au moins une cible avait un RPC détaillé limité par la portée.
  - `capability` : meilleure capacité observée parmi les cibles joignables (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope` ou `unknown`).
  - `primaryTargetId` : meilleure cible à considérer comme gagnante active dans cet ordre : URL explicite, tunnel SSH, distant configuré, puis local loopback.
  - `warnings[]` : enregistrements d’avertissement au mieux avec `code`, `message` et éventuellement `targetIds`.
  - `network` : indices d’URL local loopback/tailnet dérivés de la configuration actuelle et du réseau de l’hôte.
  - `discovery.timeoutMs` et `discovery.count` : budget/résultat de découverte réel utilisé pour ce passage de sonde.
- Par cible (`targets[].connect`) :
  - `ok` : joignabilité après connexion + classification dégradée.
  - `rpcOk` : succès complet du RPC détaillé.
  - `scopeLimited` : échec du RPC détaillé en raison de l’absence de portée opérateur.
- Par cible (`targets[].auth`) :
  - `role` : rôle d’authentification signalé dans `hello-ok` lorsqu’il est disponible.
  - `scopes` : portées accordées signalées dans `hello-ok` lorsqu’elles sont disponibles.
  - `capability` : classification de capacité d’authentification exposée pour cette cible.

Codes d’avertissement courants :

- `ssh_tunnel_failed` : l’établissement du tunnel SSH a échoué ; la commande est revenue aux sondes directes.
- `multiple_gateways` : plus d’une cible était joignable ; cela est inhabituel sauf si vous exécutez volontairement des profils isolés, comme un bot de secours.
- `auth_secretref_unresolved` : un SecretRef d’authentification configuré n’a pas pu être résolu pour une cible en échec.
- `probe_scope_limited` : la connexion WebSocket a réussi, mais la sonde de lecture était limitée par l’absence de `operator.read`.

#### Distant via SSH (parité avec l’app Mac)

Le mode « Remote over SSH » de l’application macOS utilise une redirection de port locale afin que le gateway distant (qui peut être lié uniquement à loopback) devienne joignable à `ws://127.0.0.1:<port>`.

Équivalent CLI :

```bash
openclaw gateway probe --ssh user@gateway-host
```

Options :

- `--ssh <target>` : `user@host` ou `user@host:port` (le port est `22` par défaut).
- `--ssh-identity <path>` : fichier d’identité.
- `--ssh-auto` : choisir comme cible SSH le premier hôte gateway découvert à partir du point de terminaison de découverte résolu (`local.` plus le domaine étendu configuré, s’il existe). Les indices TXT-only sont ignorés.

Configuration (facultative, utilisée comme valeur par défaut) :

- `gateway.remote.sshTarget`
- `gateway.remote.sshIdentity`

### `gateway call <method>`

Assistant RPC bas niveau.

```bash
openclaw gateway call status
openclaw gateway call logs.tail --params '{"sinceMs": 60000}'
```

Options :

- `--params <json>` : chaîne d’objet JSON pour les paramètres (par défaut `{}`)
- `--url <url>`
- `--token <token>`
- `--password <password>`
- `--timeout <ms>`
- `--expect-final`
- `--json`

Remarques :

- `--params` doit être un JSON valide.
- `--expect-final` est principalement destiné aux RPC de type agent qui diffusent des événements intermédiaires avant une payload finale.

## Gérer le service Gateway

```bash
openclaw gateway install
openclaw gateway start
openclaw gateway stop
openclaw gateway restart
openclaw gateway uninstall
```

Options de commande :

- `gateway status` : `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
- `gateway install` : `--port`, `--runtime <node|bun>`, `--token`, `--force`, `--json`
- `gateway uninstall|start|stop|restart` : `--json`

Remarques :

- `gateway install` prend en charge `--port`, `--runtime`, `--token`, `--force`, `--json`.
- Lorsque l’authentification par jeton exige un jeton et que `gateway.auth.token` est géré par SecretRef, `gateway install` valide que le SecretRef peut être résolu mais ne persiste pas le jeton résolu dans les métadonnées d’environnement du service.
- Si l’authentification par jeton exige un jeton et que le SecretRef du jeton configuré ne peut pas être résolu, l’installation échoue de manière fermée au lieu de persister un repli en clair.
- Pour l’authentification par mot de passe avec `gateway run`, préférez `OPENCLAW_GATEWAY_PASSWORD`, `--password-file` ou un `gateway.auth.password` adossé à SecretRef plutôt qu’un `--password` inline.
- En mode d’authentification inféré, `OPENCLAW_GATEWAY_PASSWORD` défini uniquement dans le shell n’assouplit pas les exigences de jeton à l’installation ; utilisez une configuration durable (`gateway.auth.password` ou `env` de configuration) lors de l’installation d’un service géré.
- Si `gateway.auth.token` et `gateway.auth.password` sont tous deux configurés et que `gateway.auth.mode` n’est pas défini, l’installation est bloquée jusqu’à ce que le mode soit défini explicitement.
- Les commandes de cycle de vie acceptent `--json` pour l’écriture de scripts.

## Découvrir des Gateways (Bonjour)

`gateway discover` analyse les balises Gateway (`_openclaw-gw._tcp`).

- DNS-SD multicast : `local.`
- DNS-SD unicast (Bonjour étendu) : choisissez un domaine (exemple : `openclaw.internal.`) et configurez split DNS + un serveur DNS ; voir [/gateway/bonjour](/fr/gateway/bonjour)

Seuls les Gateways avec découverte Bonjour activée (par défaut) publient la balise.

Les enregistrements de découverte étendue incluent (TXT) :

- `role` (indice de rôle du gateway)
- `transport` (indice de transport, par exemple `gateway`)
- `gatewayPort` (port WebSocket, généralement `18789`)
- `sshPort` (facultatif ; les clients utilisent `22` par défaut comme cible SSH lorsqu’il est absent)
- `tailnetDns` (nom d’hôte MagicDNS, lorsqu’il est disponible)
- `gatewayTls` / `gatewayTlsSha256` (TLS activé + empreinte du certificat)
- `cliPath` (indice d’installation distante écrit dans la zone étendue)

### `gateway discover`

```bash
openclaw gateway discover
```

Options :

- `--timeout <ms>` : délai d’expiration par commande (browse/resolve) ; valeur par défaut `2000`.
- `--json` : sortie lisible par machine (désactive aussi le style/le spinner).

Exemples :

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

Remarques :

- La CLI analyse `local.` plus le domaine étendu configuré lorsqu’il est activé.
- `wsUrl` dans la sortie JSON est dérivé du point de terminaison de service résolu, et non d’indices TXT-only tels que `lanHost` ou `tailnetDns`.
- En mDNS `local.`, `sshPort` et `cliPath` ne sont diffusés que lorsque `discovery.mdns.mode` vaut `full`. Le DNS-SD étendu écrit toujours `cliPath` ; `sshPort` y reste également facultatif.
