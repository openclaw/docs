---
read_when:
    - Exécuter le Gateway depuis la CLI (développement ou serveurs)
    - Débogage de l’authentification du Gateway, des modes de liaison et de la connectivité
    - Découverte des Gateway via Bonjour (DNS-SD local + étendu)
sidebarTitle: Gateway
summary: CLI OpenClaw Gateway (`openclaw gateway`) — lancer, interroger et découvrir des instances Gateway
title: Gateway
x-i18n:
    generated_at: "2026-06-27T17:18:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: de9aaeff1b592e867ffadf49a076e6e0f7069b966244b19d4eed91993c3ad738
    source_path: cli/gateway.md
    workflow: 16
---

Le Gateway est le serveur WebSocket d’OpenClaw (canaux, nœuds, sessions, hooks). Les sous-commandes de cette page se trouvent sous `openclaw gateway …`.

<CardGroup cols={3}>
  <Card title="Découverte Bonjour" href="/fr/gateway/bonjour">
    Configuration mDNS local + DNS-SD étendu.
  </Card>
  <Card title="Vue d’ensemble de la découverte" href="/fr/gateway/discovery">
    Comment OpenClaw annonce et trouve les gateways.
  </Card>
  <Card title="Configuration" href="/fr/gateway/configuration">
    Clés de configuration gateway de premier niveau.
  </Card>
</CardGroup>

## Exécuter le Gateway

Exécutez un processus Gateway local :

```bash
openclaw gateway
```

Alias de premier plan :

```bash
openclaw gateway run
```

<AccordionGroup>
  <Accordion title="Comportement au démarrage">
    - Par défaut, le Gateway refuse de démarrer sauf si `gateway.mode=local` est défini dans `~/.openclaw/openclaw.json`. Utilisez `--allow-unconfigured` pour les exécutions ponctuelles/de développement.
    - `openclaw onboard --mode local` et `openclaw setup` sont censés écrire `gateway.mode=local`. Si le fichier existe mais que `gateway.mode` est absent, traitez cela comme une configuration cassée ou écrasée et réparez-la au lieu de supposer implicitement le mode local.
    - Si le fichier existe et que `gateway.mode` est absent, le Gateway considère cela comme une détérioration suspecte de la configuration et refuse de « deviner local » pour vous.
    - La liaison au-delà du loopback sans authentification est bloquée (garde-fou de sécurité).
    - `lan`, `tailnet` et `custom` se résolvent actuellement via des chemins BYOH IPv4 uniquement.
    - Le BYOH IPv6 uniquement n’est pas pris en charge nativement sur ce chemin aujourd’hui. Utilisez un sidecar ou un proxy IPv4 si l’hôte lui-même est IPv6 uniquement.
    - `SIGUSR1` déclenche un redémarrage dans le processus lorsqu’il est autorisé (`commands.restart` est activé par défaut ; définissez `commands.restart: false` pour bloquer le redémarrage manuel, tandis que l’application/la mise à jour de l’outil ou de la configuration gateway restent autorisées).
    - Les gestionnaires `SIGINT`/`SIGTERM` arrêtent le processus gateway, mais ils ne restaurent aucun état personnalisé du terminal. Si vous enveloppez la CLI avec une TUI ou une entrée en mode brut, restaurez le terminal avant de quitter.

  </Accordion>
</AccordionGroup>

### Options

<ParamField path="--port <port>" type="number">
  Port WebSocket (la valeur par défaut vient de la configuration/de l’environnement ; généralement `18789`).
</ParamField>
<ParamField path="--bind <loopback|lan|tailnet|auto|custom>" type="string">
  Mode de liaison de l’écouteur. `lan`, `tailnet` et `custom` se résolvent actuellement via des chemins IPv4 uniquement.
</ParamField>
<ParamField path="--auth <token|password>" type="string">
  Remplacement du mode d’authentification.
</ParamField>
<ParamField path="--token <token>" type="string">
  Remplacement du jeton (définit aussi `OPENCLAW_GATEWAY_TOKEN` pour le processus).
</ParamField>
<ParamField path="--password <password>" type="string">
  Remplacement du mot de passe.
</ParamField>
<ParamField path="--password-file <path>" type="string">
  Lire le mot de passe du gateway depuis un fichier.
</ParamField>
<ParamField path="--tailscale <off|serve|funnel>" type="string">
  Exposer le Gateway via Tailscale.
</ParamField>
<ParamField path="--tailscale-reset-on-exit" type="boolean">
  Réinitialiser la configuration serve/funnel de Tailscale à l’arrêt.
</ParamField>
<ParamField path="--bind custom + gateway.customBindHost" type="string">
  Attend une adresse IPv4 aujourd’hui. Pour un BYOH IPv6 uniquement, placez un sidecar ou un proxy IPv4 devant le Gateway et pointez OpenClaw vers ce point de terminaison IPv4.
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  Autoriser le démarrage du gateway sans `gateway.mode=local` dans la configuration. Contourne le garde-fou de démarrage uniquement pour l’amorçage ponctuel/de développement ; n’écrit pas et ne répare pas le fichier de configuration.
</ParamField>
<ParamField path="--dev" type="boolean">
  Créer une configuration de développement + un espace de travail s’ils sont absents (ignore BOOTSTRAP.md).
</ParamField>
<ParamField path="--reset" type="boolean">
  Réinitialiser la configuration de développement + les identifiants + les sessions + l’espace de travail (nécessite `--dev`).
</ParamField>
<ParamField path="--force" type="boolean">
  Tuer tout écouteur existant sur le port sélectionné avant de démarrer.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Journaux détaillés.
</ParamField>
<ParamField path="--cli-backend-logs" type="boolean">
  Afficher uniquement les journaux du backend CLI dans la console (et activer stdout/stderr).
</ParamField>
<ParamField path="--ws-log <auto|full|compact>" type="string" default="auto">
  Style de journal WebSocket.
</ParamField>
<ParamField path="--compact" type="boolean">
  Alias de `--ws-log compact`.
</ParamField>
<ParamField path="--raw-stream" type="boolean">
  Journaliser les événements de flux bruts du modèle en jsonl.
</ParamField>
<ParamField path="--raw-stream-path <path>" type="string">
  Chemin jsonl du flux brut.
</ParamField>

## Redémarrer le Gateway

```bash
openclaw gateway restart
openclaw gateway restart --safe
openclaw gateway restart --safe --skip-deferral
openclaw gateway restart --force
```

`openclaw gateway restart --safe` demande au Gateway en cours d’exécution de prévérifier le travail OpenClaw actif avant de redémarrer. Si des opérations en file d’attente, la livraison de réponses, des exécutions intégrées ou des exécutions de tâches sont actives, le Gateway signale les bloqueurs, fusionne les demandes de redémarrage sûr en double et redémarre une fois le travail actif écoulé. `restart` simple conserve le comportement existant du gestionnaire de service pour compatibilité. Utilisez `--force` uniquement lorsque vous voulez explicitement le chemin de remplacement immédiat.

`openclaw gateway restart --safe --skip-deferral` exécute le même redémarrage coordonné conscient d’OpenClaw que `--safe`, mais contourne la porte de report du travail actif afin que le Gateway émette le redémarrage immédiatement même lorsque des bloqueurs sont signalés. Utilisez-le comme échappatoire opérateur lorsqu’un report a été bloqué par une exécution de tâche coincée et que `--safe` seul attendrait indéfiniment. `--skip-deferral` nécessite `--safe`.

<Warning>
Le `--password` en ligne peut être exposé dans les listes de processus locales. Préférez `--password-file`, l’environnement ou un `gateway.auth.password` adossé à SecretRef.
</Warning>

### Profilage du Gateway

- Définissez `OPENCLAW_GATEWAY_STARTUP_TRACE=1` pour journaliser les durées de phase pendant le démarrage du Gateway, y compris le délai `eventLoopMax` par phase et les durées des tables de recherche de plugins pour l’index installé, le registre de manifestes, la planification du démarrage et le travail de carte des propriétaires.
- Définissez `OPENCLAW_GATEWAY_RESTART_TRACE=1` pour journaliser des lignes `restart trace:` limitées au redémarrage pour la gestion du signal de redémarrage, l’écoulement du travail actif, les phases d’arrêt, le démarrage suivant, le temps de disponibilité et les métriques mémoire.
- Définissez `OPENCLAW_DIAGNOSTICS=timeline` avec `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>` pour écrire une chronologie de diagnostics de démarrage JSONL au mieux pour les harnais QA externes. Vous pouvez aussi activer l’indicateur avec `diagnostics.flags: ["timeline"]` dans la configuration ; le chemin reste fourni par l’environnement. Ajoutez `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` pour inclure les échantillons de boucle d’événements.
- Exécutez d’abord `pnpm build`, puis `pnpm test:startup:gateway -- --runs 5 --warmup 1` pour comparer les performances de démarrage du Gateway avec l’entrée CLI compilée. Le banc d’essai enregistre la première sortie du processus, `/healthz`, `/readyz`, les durées de trace de démarrage, le délai de boucle d’événements et les détails de durée des tables de recherche de plugins.
- Exécutez d’abord `pnpm build`, puis `pnpm test:restart:gateway -- --case skipChannels --runs 1 --restarts 5` pour comparer les performances du redémarrage du Gateway dans le processus avec l’entrée CLI compilée sur macOS ou Linux. Le banc d’essai de redémarrage utilise SIGUSR1, active les traces de démarrage et de redémarrage dans le processus enfant, et enregistre le prochain `/healthz`, le prochain `/readyz`, le temps d’indisponibilité, le temps de disponibilité, le CPU, le RSS et les métriques de trace de redémarrage.
- Traitez `/healthz` comme la vivacité et `/readyz` comme la disponibilité utilisable. Les lignes de trace et la sortie du banc d’essai servent à l’attribution au propriétaire ; ne traitez pas une seule plage de trace ou un seul échantillon comme une conclusion complète sur les performances.

## Interroger un Gateway en cours d’exécution

Toutes les commandes de requête utilisent WebSocket RPC.

<Tabs>
  <Tab title="Modes de sortie">
    - Par défaut : lisible par l’humain (coloré en TTY).
    - `--json` : JSON lisible par machine (sans style/spinner).
    - `--no-color` (ou `NO_COLOR=1`) : désactiver ANSI tout en conservant la mise en page humaine.

  </Tab>
  <Tab title="Options partagées">
    - `--url <url>` : URL WebSocket du Gateway.
    - `--token <token>` : jeton du Gateway.
    - `--password <password>` : mot de passe du Gateway.
    - `--timeout <ms>` : délai/budget (varie selon la commande).
    - `--expect-final` : attendre une réponse « final » (appels d’agent).

  </Tab>
</Tabs>

<Note>
Lorsque vous définissez `--url`, la CLI ne se rabat pas sur les identifiants de configuration ou d’environnement. Passez explicitement `--token` ou `--password`. L’absence d’identifiants explicites est une erreur.
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
openclaw gateway health --port 18789
```

Le point de terminaison HTTP `/healthz` est une sonde de vivacité : il répond dès que le serveur peut répondre en HTTP. Le point de terminaison HTTP `/readyz` est plus strict et reste rouge pendant que les sidecars de plugins au démarrage, les canaux ou les hooks configurés sont encore en cours de stabilisation. Les réponses détaillées de disponibilité locales ou authentifiées incluent un bloc de diagnostic `eventLoop` avec le délai de boucle d’événements, l’utilisation de la boucle d’événements, le ratio de cœurs CPU et un indicateur `degraded`.

<ParamField path="--port <port>" type="number">
  Cibler un Gateway en local loopback sur ce port. Cela remplace `OPENCLAW_GATEWAY_URL` et `OPENCLAW_GATEWAY_PORT` pour l’appel d’état.
</ParamField>

### `gateway usage-cost`

Récupérer les résumés de coût d’utilisation depuis les journaux de session.

```bash
openclaw gateway usage-cost
openclaw gateway usage-cost --days 7
openclaw gateway usage-cost --agent work --json
openclaw gateway usage-cost --all-agents
openclaw gateway usage-cost --json
```

<ParamField path="--days <days>" type="number" default="30">
  Nombre de jours à inclure.
</ParamField>
<ParamField path="--agent <id>" type="string">
  Limiter le résumé des coûts à un id d’agent configuré.
</ParamField>
<ParamField path="--all-agents" type="boolean">
  Agréger le résumé des coûts sur tous les agents configurés. Ne peut pas être combiné avec `--agent`.
</ParamField>

### `gateway stability`

Récupérer l’enregistreur récent de stabilité diagnostique depuis un Gateway en cours d’exécution.

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --bundle latest
openclaw gateway stability --bundle latest --export
openclaw gateway stability --json
```

<ParamField path="--limit <limit>" type="number" default="25">
  Nombre maximal d’événements récents à inclure (max `1000`).
</ParamField>
<ParamField path="--type <type>" type="string">
  Filtrer par type d’événement diagnostique, comme `payload.large` ou `diagnostic.memory.pressure`.
</ParamField>
<ParamField path="--since-seq <seq>" type="number">
  Inclure uniquement les événements après un numéro de séquence diagnostique.
</ParamField>
<ParamField path="--bundle [path]" type="string">
  Lire un bundle de stabilité persisté au lieu d’appeler le Gateway en cours d’exécution. Utilisez `--bundle latest` (ou simplement `--bundle`) pour le bundle le plus récent sous le répertoire d’état, ou passez directement un chemin JSON de bundle.
</ParamField>
<ParamField path="--export" type="boolean">
  Écrire un zip de diagnostics de support partageable au lieu d’imprimer les détails de stabilité.
</ParamField>
<ParamField path="--output <path>" type="string">
  Chemin de sortie pour `--export`.
</ParamField>

<AccordionGroup>
  <Accordion title="Confidentialité et comportement des bundles">
    - Les enregistrements conservent les métadonnées opérationnelles : noms d’événements, nombres, tailles en octets, relevés mémoire, état des files d’attente/sessions, noms de canaux/plugins et résumés de sessions expurgés. Ils ne conservent pas le texte de discussion, les corps de webhooks, les sorties d’outils, les corps bruts de requête ou de réponse, les jetons, les cookies, les valeurs secrètes, les noms d’hôtes ni les ids de session bruts. Définissez `diagnostics.enabled: false` pour désactiver complètement l’enregistreur.
    - Lors des sorties fatales du Gateway, des délais d’arrêt et des échecs de démarrage après redémarrage, OpenClaw écrit le même instantané diagnostique dans `~/.openclaw/logs/stability/openclaw-stability-*.json` lorsque l’enregistreur contient des événements. Inspectez le bundle le plus récent avec `openclaw gateway stability --bundle latest` ; `--limit`, `--type` et `--since-seq` s’appliquent aussi à la sortie du bundle.

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

Écrire un zip de diagnostics local conçu pour être joint aux rapports de bogue. Pour le modèle de confidentialité et le contenu des bundles, consultez [Export des diagnostics](/fr/gateway/diagnostics).

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  Chemin du fichier zip de sortie. Par défaut, il s’agit d’une exportation de support sous le répertoire d’état.
</ParamField>
<ParamField path="--log-lines <count>" type="number" default="5000">
  Nombre maximal de lignes de journal assainies à inclure.
</ParamField>
<ParamField path="--log-bytes <bytes>" type="number" default="1000000">
  Nombre maximal d’octets de journal à inspecter.
</ParamField>
<ParamField path="--url <url>" type="string">
  URL WebSocket du Gateway pour l’instantané de santé.
</ParamField>
<ParamField path="--token <token>" type="string">
  Jeton du Gateway pour l’instantané de santé.
</ParamField>
<ParamField path="--password <password>" type="string">
  Mot de passe du Gateway pour l’instantané de santé.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="3000">
  Délai d’expiration de l’instantané d’état/de santé.
</ParamField>
<ParamField path="--no-stability-bundle" type="boolean">
  Ignorer la recherche du bundle de stabilité persisté.
</ParamField>
<ParamField path="--json" type="boolean">
  Afficher le chemin écrit, la taille et le manifeste au format JSON.
</ParamField>

L’exportation contient un manifeste, un résumé Markdown, la forme de la configuration, les détails de configuration assainis, des résumés de journaux assainis, des instantanés assainis d’état/de santé du Gateway, ainsi que le bundle de stabilité le plus récent lorsqu’il existe.

Elle est destinée à être partagée. Elle conserve les détails opérationnels qui facilitent le débogage, comme les champs de journal OpenClaw sûrs, les noms de sous-systèmes, les codes d’état, les durées, les modes configurés, les ports, les identifiants de plugins, les identifiants de fournisseurs, les paramètres de fonctionnalités non secrets et les messages de journal opérationnels expurgés. Elle omet ou expurge le texte de chat, les corps de webhook, les sorties d’outils, les identifiants, les cookies, les identifiants de compte/message, le texte de prompt/instruction, les noms d’hôte et les valeurs secrètes. Lorsqu’un message de style LogTape ressemble à du texte de charge utile utilisateur/chat/outil, l’exportation conserve uniquement le fait qu’un message a été omis, ainsi que son nombre d’octets.

### `gateway status`

`gateway status` affiche le service Gateway (launchd/systemd/schtasks), ainsi qu’une sonde facultative de connectivité/capacité d’authentification.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  Ajouter une cible de sonde explicite. La cible distante configurée et localhost sont toujours sondées.
</ParamField>
<ParamField path="--token <token>" type="string">
  Authentification par jeton pour la sonde.
</ParamField>
<ParamField path="--password <password>" type="string">
  Authentification par mot de passe pour la sonde.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="10000">
  Délai d’expiration de la sonde.
</ParamField>
<ParamField path="--no-probe" type="boolean">
  Ignorer la sonde de connectivité (vue du service uniquement).
</ParamField>
<ParamField path="--deep" type="boolean">
  Analyser aussi les services au niveau système.
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  Faire passer la sonde de connectivité par défaut à une sonde de lecture et quitter avec un code non nul lorsque cette sonde de lecture échoue. Ne peut pas être combiné avec `--no-probe`.
</ParamField>

<AccordionGroup>
  <Accordion title="Sémantique de l’état">
    - `gateway status` reste disponible pour les diagnostics même lorsque la configuration CLI locale est absente ou invalide.
    - `gateway status` par défaut prouve l’état du service, la connexion WebSocket et la capacité d’authentification visible au moment de la négociation. Il ne prouve pas les opérations de lecture/écriture/administration.
    - Les sondes de diagnostic ne modifient rien pour l’authentification d’un appareil pour la première fois : elles réutilisent un jeton d’appareil mis en cache existant lorsqu’il existe, mais elles ne créent pas une nouvelle identité d’appareil CLI ni un enregistrement d’association d’appareil en lecture seule uniquement pour vérifier l’état.
    - `gateway status` résout les SecretRefs d’authentification configurées pour l’authentification de la sonde lorsque c’est possible.
    - Si une SecretRef d’authentification requise n’est pas résolue dans ce chemin de commande, `gateway status --json` signale `rpc.authWarning` lorsque la connectivité/l’authentification de la sonde échoue ; passez explicitement `--token`/`--password` ou résolvez d’abord la source du secret.
    - Si la sonde réussit, les avertissements d’auth-ref non résolue sont supprimés pour éviter les faux positifs.
    - Lorsque la sonde est activée, la sortie JSON inclut `gateway.version` lorsque le Gateway en cours d’exécution la signale ; `--require-rpc` peut se rabattre sur la charge utile RPC `status.runtimeVersion` si la sonde de négociation de suivi ne peut pas fournir les métadonnées de version.
    - Utilisez `--require-rpc` dans les scripts et l’automatisation lorsqu’un service à l’écoute ne suffit pas et que les appels RPC de périmètre lecture doivent également être sains.
    - `--deep` ajoute une analyse au mieux des installations launchd/systemd/schtasks supplémentaires. Lorsque plusieurs services de type gateway sont détectés, la sortie lisible par l’humain affiche des conseils de nettoyage et avertit que la plupart des configurations doivent exécuter un seul gateway par machine.
    - `--deep` signale aussi un transfert récent de redémarrage du superviseur Gateway lorsque le processus de service s’est terminé proprement pour un redémarrage par superviseur externe.
    - `--deep` exécute la validation de configuration en mode conscient des plugins (`pluginValidation: "full"`) et met en évidence les avertissements de manifeste de plugin configurés (par exemple des métadonnées de configuration de canal manquantes) afin que les tests de fumée d’installation et de mise à jour les détectent. `gateway status` par défaut conserve le chemin rapide en lecture seule qui ignore la validation des plugins.
    - La sortie lisible par l’humain inclut le chemin résolu du fichier de journal, ainsi que l’instantané des chemins/validités de configuration CLI par rapport au service pour aider à diagnostiquer une dérive de profil ou de répertoire d’état.

  </Accordion>
  <Accordion title="Contrôles de dérive d’authentification systemd Linux">
    - Sur les installations systemd Linux, les contrôles de dérive d’authentification lisent les valeurs `Environment=` et `EnvironmentFile=` de l’unité (y compris `%h`, les chemins entre guillemets, les fichiers multiples et les fichiers facultatifs `-`).
    - Les contrôles de dérive résolvent les SecretRefs `gateway.auth.token` avec l’environnement d’exécution fusionné (d’abord l’environnement de commande du service, puis l’environnement du processus comme solution de repli).
    - Si l’authentification par jeton n’est pas effectivement active (`gateway.auth.mode` explicite à `password`/`none`/`trusted-proxy`, ou mode non défini où le mot de passe peut prévaloir et aucun candidat de jeton ne peut prévaloir), les contrôles de dérive de jeton ignorent la résolution du jeton de configuration.

  </Accordion>
</AccordionGroup>

### `gateway probe`

`gateway probe` est la commande « tout déboguer ». Elle sonde toujours :

- votre gateway distant configuré (s’il est défini), et
- localhost (local loopback) **même si une cible distante est configurée**.

Si vous passez `--url`, cette cible explicite est ajoutée avant les deux autres. La sortie lisible par l’humain libelle les cibles comme suit :

- `URL (explicit)`
- `Remote (configured)` ou `Remote (configured, inactive)`
- `Local loopback`

<Note>
Si plusieurs cibles de sonde sont accessibles, elle les affiche toutes. Un tunnel SSH, une URL TLS/proxy et une URL distante configurée peuvent tous pointer vers le même gateway même lorsque leurs ports de transport diffèrent ; `multiple_gateways` est réservé aux gateways accessibles distincts ou dont l’identité est ambiguë. Plusieurs gateways sont pris en charge lorsque vous utilisez des profils isolés (par exemple, un bot de secours), mais la plupart des installations exécutent tout de même un seul gateway.
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --port 18789
```

<ParamField path="--port <port>" type="number">
  Utiliser ce port pour la cible de sonde local loopback et le port distant du tunnel SSH. Sans `--url`, cela sélectionne la cible local loopback au lieu de l’URL d’environnement du gateway configurée, du port d’environnement ou des cibles distantes.
</ParamField>

<AccordionGroup>
  <Accordion title="Interprétation">
    - `Reachable: yes` signifie qu’au moins une cible a accepté une connexion WebSocket.
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` signale ce que la sonde a pu prouver sur l’authentification. C’est distinct de l’accessibilité.
    - `Read probe: ok` signifie que les appels RPC de détail de périmètre lecture (`health`/`status`/`system-presence`/`config.get`) ont également réussi.
    - `Read probe: limited - missing scope: operator.read` signifie que la connexion a réussi, mais que le RPC de périmètre lecture est limité. Cela est signalé comme une accessibilité **dégradée**, et non comme un échec complet.
    - `Read probe: failed` après `Connect: ok` signifie que le Gateway a accepté la connexion WebSocket, mais que les diagnostics de lecture de suivi ont expiré ou échoué. Cela aussi correspond à une accessibilité **dégradée**, et non à un Gateway inaccessible.
    - Comme `gateway status`, la sonde réutilise l’authentification d’appareil mise en cache existante, mais ne crée pas d’identité d’appareil ni d’état d’association pour une première utilisation.
    - Le code de sortie est non nul uniquement lorsqu’aucune cible sondée n’est accessible.

  </Accordion>
  <Accordion title="Sortie JSON">
    Niveau supérieur :

    - `ok` : au moins une cible est accessible.
    - `degraded` : au moins une cible a accepté une connexion mais n’a pas terminé les diagnostics RPC détaillés complets.
    - `capability` : meilleure capacité observée parmi les cibles accessibles (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope` ou `unknown`).
    - `primaryTargetId` : meilleure cible à traiter comme gagnant actif dans cet ordre : URL explicite, tunnel SSH, cible distante configurée, puis local loopback.
    - `warnings[]` : enregistrements d’avertissement au mieux avec `code`, `message` et `targetIds` facultatifs.
    - `network` : indices d’URL local loopback/tailnet dérivés de la configuration actuelle et du réseau de l’hôte.
    - `discovery.timeoutMs` et `discovery.count` : budget/résultat réel de découverte utilisé pour ce passage de sonde.

    Par cible (`targets[].connect`) :

    - `ok` : accessibilité après connexion + classification dégradée.
    - `rpcOk` : succès RPC détaillé complet.
    - `scopeLimited` : échec du RPC détaillé en raison d’un périmètre opérateur manquant.

    Par cible (`targets[].auth`) :

    - `role` : rôle d’authentification signalé dans `hello-ok` lorsqu’il est disponible.
    - `scopes` : périmètres accordés signalés dans `hello-ok` lorsqu’ils sont disponibles.
    - `capability` : classification de capacité d’authentification exposée pour cette cible.

  </Accordion>
  <Accordion title="Codes d’avertissement courants">
    - `ssh_tunnel_failed` : la configuration du tunnel SSH a échoué ; la commande s’est rabattue sur des sondes directes.
    - `multiple_gateways` : des identités de gateway distinctes étaient accessibles, ou OpenClaw n’a pas pu prouver que les cibles accessibles sont le même gateway. Un tunnel SSH, une URL proxy ou une URL distante configurée vers le même gateway ne déclenche pas cet avertissement.
    - `auth_secretref_unresolved` : une SecretRef d’authentification configurée n’a pas pu être résolue pour une cible en échec.
    - `probe_scope_limited` : la connexion WebSocket a réussi, mais la sonde de lecture a été limitée par l’absence de `operator.read`.

  </Accordion>
</AccordionGroup>

#### Distant via SSH (parité avec l’app Mac)

Le mode « Remote over SSH » de l’application macOS utilise une redirection de port locale afin que le gateway distant (qui peut être lié uniquement à loopback) devienne accessible à `ws://127.0.0.1:<port>`.

Équivalent CLI :

```bash
openclaw gateway probe --ssh user@gateway-host
```

<ParamField path="--ssh <target>" type="string">
  `user@host` ou `user@host:port` (le port par défaut est `22`).
</ParamField>
<ParamField path="--ssh-identity <path>" type="string">
  Fichier d’identité.
</ParamField>
<ParamField path="--ssh-auto" type="boolean">
  Choisir le premier hôte gateway découvert comme cible SSH à partir du point de terminaison de découverte résolu (`local.` plus le domaine longue portée configuré, le cas échéant). Les indices TXT uniquement sont ignorés.
</ParamField>

Configuration (facultative, utilisée comme valeurs par défaut) :

- `gateway.remote.sshTarget`
- `gateway.remote.sshIdentity`

### `gateway call <method>`

Assistant RPC de bas niveau.

```bash
openclaw gateway call status
openclaw gateway call logs.tail --params '{"sinceMs": 60000}'
```

<ParamField path="--params <json>" type="string" default="{}">
  Chaîne d’objet JSON pour les paramètres.
</ParamField>
<ParamField path="--url <url>" type="string">
  URL WebSocket du Gateway.
</ParamField>
<ParamField path="--token <token>" type="string">
  Jeton du Gateway.
</ParamField>
<ParamField path="--password <password>" type="string">
  Mot de passe du Gateway.
</ParamField>
<ParamField path="--timeout <ms>" type="number">
  Budget de délai d’expiration.
</ParamField>
<ParamField path="--expect-final" type="boolean">
  Principalement pour les RPC de style agent qui diffusent des événements intermédiaires avant une charge utile finale.
</ParamField>
<ParamField path="--json" type="boolean">
  Sortie JSON lisible par machine.
</ParamField>

<Note>
`--params` doit être du JSON valide.
</Note>

## Gérer le service Gateway

```bash
openclaw gateway install
openclaw gateway start
openclaw gateway stop
openclaw gateway restart
openclaw gateway uninstall
```

### Installer avec un wrapper

Utilisez `--wrapper` lorsque le service géré doit démarrer via un autre exécutable, par exemple un
shim de gestionnaire de secrets ou un helper run-as. Le wrapper reçoit les arguments Gateway normaux et est
responsable d’exécuter finalement `openclaw` ou Node avec ces arguments.

```bash
cat > ~/.local/bin/openclaw-doppler <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
exec doppler run --project my-project --config production -- openclaw "$@"
EOF
chmod +x ~/.local/bin/openclaw-doppler

openclaw gateway install --wrapper ~/.local/bin/openclaw-doppler --force
openclaw gateway restart
```

Vous pouvez aussi définir le wrapper via l’environnement. `gateway install` vérifie que le chemin est
un fichier exécutable, écrit le wrapper dans les `ProgramArguments` du service, et persiste
`OPENCLAW_WRAPPER` dans l’environnement du service pour les réinstallations forcées, mises à jour et réparations doctor
ultérieures.

```bash
OPENCLAW_WRAPPER="$HOME/.local/bin/openclaw-doppler" openclaw gateway install --force
openclaw doctor
```

Pour supprimer un wrapper persisté, effacez `OPENCLAW_WRAPPER` pendant la réinstallation :

```bash
OPENCLAW_WRAPPER= openclaw gateway install --force
openclaw gateway restart
```

<AccordionGroup>
  <Accordion title="Options de commande">
    - `gateway status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
    - `gateway install`: `--port`, `--runtime <node|bun>`, `--token`, `--wrapper <path>`, `--force`, `--json`
    - `gateway restart`: `--safe`, `--skip-deferral`, `--force`, `--wait <duration>`, `--json`
    - `gateway uninstall|start`: `--json`
    - `gateway stop`: `--disable`, `--json`

  </Accordion>
  <Accordion title="Comportement du cycle de vie">
    - Utilisez `gateway restart` pour redémarrer un service géré. N’enchaînez pas `gateway stop` et `gateway start` comme substitut de redémarrage.
    - Sur macOS, `gateway stop` utilise `launchctl bootout` par défaut, ce qui supprime le LaunchAgent de la session de démarrage actuelle sans persister de désactivation — la récupération automatique KeepAlive reste active pour les plantages futurs et `gateway start` se réactive proprement sans `launchctl enable` manuel. Passez `--disable` pour supprimer durablement KeepAlive et RunAtLoad afin que le Gateway ne redémarre pas automatiquement avant le prochain `gateway start` explicite ; utilisez cette option lorsqu’un arrêt manuel doit survivre aux redémarrages ou aux redémarrages système.
    - `gateway restart --safe` demande au Gateway en cours d’exécution de prévérifier le travail OpenClaw actif et de différer le redémarrage jusqu’à ce que la livraison des réponses, les exécutions intégrées et les exécutions de tâches soient vidées. `--safe` ne peut pas être combiné avec `--force` ou `--wait`.
    - `gateway restart --wait 30s` remplace le budget configuré de vidange avant redémarrage pour ce redémarrage. Les nombres seuls sont des millisecondes ; les unités comme `s`, `m` et `h` sont acceptées. `--wait 0` attend indéfiniment.
    - `gateway restart --safe --skip-deferral` exécute le redémarrage sécurisé conscient d’OpenClaw mais contourne la porte de différé afin que le Gateway émette le redémarrage immédiatement même lorsque des bloqueurs sont signalés. C’est une issue de secours opérateur pour les différés d’exécution de tâche bloqués ; nécessite `--safe`.
    - `gateway restart --force` ignore la vidange du travail actif et redémarre immédiatement. Utilisez-le lorsqu’un opérateur a déjà inspecté les bloqueurs de tâches listés et veut remettre le Gateway en service maintenant.
    - Les commandes de cycle de vie acceptent `--json` pour les scripts.

  </Accordion>
  <Accordion title="Authentification et SecretRefs au moment de l’installation">
    - Lorsque l’authentification par jeton nécessite un jeton et que `gateway.auth.token` est géré par SecretRef, `gateway install` vérifie que la SecretRef peut être résolue mais ne persiste pas le jeton résolu dans les métadonnées d’environnement du service.
    - Si l’authentification par jeton nécessite un jeton et que la SecretRef de jeton configurée n’est pas résolue, l’installation échoue fermée au lieu de persister un texte brut de secours.
    - Pour l’authentification par mot de passe sur `gateway run`, préférez `OPENCLAW_GATEWAY_PASSWORD`, `--password-file` ou un `gateway.auth.password` adossé à SecretRef plutôt que `--password` en ligne.
    - En mode d’authentification inféré, `OPENCLAW_GATEWAY_PASSWORD` défini uniquement dans le shell n’assouplit pas les exigences de jeton à l’installation ; utilisez une configuration durable (`gateway.auth.password` ou `env` de configuration) lors de l’installation d’un service géré.
    - Si `gateway.auth.token` et `gateway.auth.password` sont tous deux configurés et que `gateway.auth.mode` n’est pas défini, l’installation est bloquée jusqu’à ce que le mode soit défini explicitement.

  </Accordion>
</AccordionGroup>

## Découvrir les Gateway (Bonjour)

`gateway discover` recherche les balises Gateway (`_openclaw-gw._tcp`).

- DNS-SD multicast : `local.`
- DNS-SD unicast (Wide-Area Bonjour) : choisissez un domaine (exemple : `openclaw.internal.`) et configurez un DNS fractionné + un serveur DNS ; consultez [Bonjour](/fr/gateway/bonjour).

Seuls les Gateway avec la découverte Bonjour activée (par défaut) annoncent la balise.

Les enregistrements de découverte wide-area peuvent inclure ces indications TXT :

- `role` (indication du rôle du Gateway)
- `transport` (indication de transport, par exemple `gateway`)
- `gatewayPort` (port WebSocket, généralement `18789`)
- `sshPort` (mode de découverte complet uniquement ; les clients utilisent par défaut `22` comme cible SSH lorsqu’il est absent)
- `tailnetDns` (nom d’hôte MagicDNS, lorsqu’il est disponible)
- `gatewayTls` / `gatewayTlsSha256` (TLS activé + empreinte du certificat)
- `cliPath` (mode de découverte complet uniquement)

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  Délai d’expiration par commande (parcours/résolution).
</ParamField>
<ParamField path="--json" type="boolean">
  Sortie lisible par machine (désactive aussi le style/spinner).
</ParamField>

Exemples :

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

<Note>
- La CLI analyse `local.` ainsi que le domaine wide-area configuré lorsqu’il est activé.
- `wsUrl` dans la sortie JSON est dérivé du point de terminaison de service résolu, et non d’indications TXT seules comme `lanHost` ou `tailnetDns`.
- Sur mDNS `local.` et DNS-SD wide-area, `sshPort` et `cliPath` ne sont publiés que lorsque `discovery.mdns.mode` vaut `full`.

</Note>

## Connexe

- [Référence CLI](/fr/cli)
- [Runbook Gateway](/fr/gateway)
