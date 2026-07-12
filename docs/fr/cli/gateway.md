---
read_when:
    - Exécution du Gateway depuis la CLI (développement ou serveurs)
    - Débogage de l’authentification du Gateway, des modes de liaison et de la connectivité
    - Découverte des Gateway via Bonjour (DNS-SD local et étendu)
sidebarTitle: Gateway
summary: CLI du Gateway OpenClaw (`openclaw gateway`) — exécuter, interroger et découvrir des Gateways
title: Gateway
x-i18n:
    generated_at: "2026-07-12T02:29:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 75f8f4bebe585b213f486f08bf20015aeb89ca4d179f6d96c1008ec9d1cd00ea
    source_path: cli/gateway.md
    workflow: 16
---

Le Gateway est le serveur WebSocket d’OpenClaw (canaux, nœuds, sessions, hooks). Toutes les sous-commandes ci-dessous se trouvent sous `openclaw gateway ...`.

<CardGroup cols={3}>
  <Card title="Découverte Bonjour" href="/fr/gateway/bonjour">
    Configuration de mDNS local et de DNS-SD étendu.
  </Card>
  <Card title="Vue d’ensemble de la découverte" href="/fr/gateway/discovery">
    Comment OpenClaw annonce et trouve les Gateways.
  </Card>
  <Card title="Configuration" href="/fr/gateway/configuration">
    Clés de configuration de premier niveau du Gateway.
  </Card>
</CardGroup>

## Exécuter le Gateway

```bash
openclaw gateway
openclaw gateway run   # forme explicite équivalente
```

<AccordionGroup>
  <Accordion title="Comportement au démarrage">
    - Refuse de démarrer sauf si `gateway.mode=local` est défini dans `~/.openclaw/openclaw.json`. Utilisez `--allow-unconfigured` pour les exécutions ponctuelles ou de développement ; cette option contourne la protection sans écrire ni réparer la configuration.
    - `openclaw onboard --mode local` et `openclaw setup` écrivent `gateway.mode=local`. Si le fichier de configuration existe mais que `gateway.mode` est absent, la configuration est considérée comme endommagée ou écrasée et le Gateway refuse de supposer `local` à votre place — relancez l’intégration, définissez la clé manuellement ou transmettez `--allow-unconfigured`.
    - L’écoute au-delà de local loopback sans authentification est bloquée.
    - Les valeurs `lan`, `tailnet` et `custom` de `--bind` sont actuellement résolues uniquement par des chemins IPv4 ; les configurations sur hôte personnalisé exclusivement IPv6 nécessitent un service auxiliaire IPv4 ou un proxy devant le Gateway.
    - `SIGUSR1` déclenche un redémarrage dans le processus lorsqu’il est autorisé. `commands.restart` (activé par défaut) contrôle les signaux `SIGUSR1` envoyés de l’extérieur ; définissez-le sur `false` pour bloquer les redémarrages manuels par signal du système d’exploitation tout en autorisant ceux effectués avec la commande `gateway restart`, l’outil Gateway et l’application ou la mise à jour de la configuration.
    - `SIGINT`/`SIGTERM` arrêtent le processus, mais ne restaurent pas l’état personnalisé du terminal — si vous encapsulez la CLI dans une TUI ou une entrée en mode brut, restaurez vous-même le terminal avant de quitter.

  </Accordion>
</AccordionGroup>

### Options

<ParamField path="--port <port>" type="number">
  Port WebSocket (valeur par défaut issue de la configuration ou de l’environnement ; généralement `18789`).
</ParamField>
<ParamField path="--bind <mode>" type="string">
  Mode d’écoute : `loopback` (par défaut), `lan`, `tailnet`, `auto`, `custom`.
</ParamField>
<ParamField path="--token <token>" type="string">
  Jeton partagé pour `connect.params.auth.token`. Utilise par défaut `OPENCLAW_GATEWAY_TOKEN` lorsqu’il est défini.
</ParamField>
<ParamField path="--auth <mode>" type="string">
  Mode d’authentification : `none`, `token`, `password`, `trusted-proxy`.
</ParamField>
<ParamField path="--password <password>" type="string">
  Mot de passe pour `--auth password`.
</ParamField>
<ParamField path="--password-file <path>" type="string">
  Lire le mot de passe du Gateway depuis un fichier.
</ParamField>
<ParamField path="--tailscale <mode>" type="string">
  Exposition Tailscale : `off`, `serve`, `funnel`.
</ParamField>
<ParamField path="--tailscale-reset-on-exit" type="boolean">
  Réinitialiser la configuration Tailscale serve/funnel à l’arrêt.
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  Démarrer sans imposer `gateway.mode=local`. Uniquement pour un amorçage ponctuel ou de développement ; ne conserve ni ne répare la configuration.
</ParamField>
<ParamField path="--dev" type="boolean">
  Créer une configuration et un espace de travail de développement s’ils sont absents (ignore `BOOTSTRAP.md`).
</ParamField>
<ParamField path="--reset" type="boolean">
  Réinitialiser la configuration de développement, les identifiants, les sessions et l’espace de travail. Nécessite `--dev`.
</ParamField>
<ParamField path="--force" type="boolean">
  Arrêter tout processus déjà à l’écoute sur le port cible avant le démarrage.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Journalisation détaillée vers stdout/stderr.
</ParamField>
<ParamField path="--cli-backend-logs" type="boolean">
  Afficher uniquement les journaux du backend de la CLI dans la console (active également stdout/stderr).
</ParamField>
<ParamField path="--ws-log <style>" type="string" default="auto">
  Style des journaux WebSocket : `auto`, `full`, `compact`.
</ParamField>
<ParamField path="--compact" type="boolean">
  Alias de `--ws-log compact`.
</ParamField>
<ParamField path="--raw-stream" type="boolean">
  Consigner les événements bruts du flux du modèle au format JSONL.
</ParamField>
<ParamField path="--raw-stream-path <path>" type="string">
  Chemin du flux brut JSONL.
</ParamField>

`--claude-cli-logs` est un alias obsolète de `--cli-backend-logs`.

Pour `--bind custom`, définissez `gateway.customBindHost` sur une adresse IPv4. Toute adresse autre que `127.0.0.1` ou `0.0.0.0` nécessite également `127.0.0.1` sur le même port pour les clients du même hôte ; le démarrage échoue si l’un des deux processus d’écoute ne peut pas se lier. L’adresse générique `0.0.0.0` n’ajoute pas d’alias distinct obligatoire. Les configurations sur hôte personnalisé exclusivement IPv6 nécessitent un service auxiliaire IPv4 ou un proxy devant le Gateway.

## Redémarrer le Gateway

```bash
openclaw gateway restart
openclaw gateway restart --safe
openclaw gateway restart --safe --skip-deferral
openclaw gateway restart --force
openclaw gateway restart --wait 30s
```

`--safe` demande au Gateway en cours d’exécution de vérifier au préalable les tâches actives et de planifier un redémarrage unique regroupé après leur achèvement. L’attente est limitée par `gateway.reload.deferralTimeoutMs` (valeur par défaut : 5 minutes / `300000`) ; lorsque ce délai expire, le redémarrage est forcé. Définissez `deferralTimeoutMs: 0` pour attendre indéfiniment (avec des avertissements périodiques signalant que l’attente se poursuit) au lieu de forcer le redémarrage. `--safe` ne peut pas être combiné avec `--force` ou `--wait`.

`--skip-deferral` contourne la protection de report liée aux tâches actives lors d’un redémarrage sécurisé ; le Gateway redémarre donc immédiatement, même si des blocages sont signalés. Cette option nécessite `--safe` — utilisez-la lorsqu’un report reste bloqué sur une tâche incontrôlée.

`--wait <duration>` remplace le délai d’achèvement pour un redémarrage ordinaire (non sécurisé). Accepte des millisecondes sans suffixe ou les suffixes d’unité `ms`, `s`, `m`, `h`, `d` (par exemple `30s`, `5m`, `1h30m`) ; `--wait 0` attend indéfiniment. Incompatible avec `--force` ou `--safe`.

`--force` ignore l’attente d’achèvement des tâches actives et redémarre immédiatement. La commande `restart` ordinaire (sans option) conserve le comportement de redémarrage existant du gestionnaire de services.

<Warning>
Un `--password` fourni directement peut apparaître dans les listes locales de processus. Préférez `--password-file`, une variable d’environnement ou un `gateway.auth.password` reposant sur une SecretRef.
</Warning>

### Profilage du Gateway

- `OPENCLAW_GATEWAY_STARTUP_TRACE=1` consigne la durée des phases au démarrage, notamment le délai `eventLoopMax` de chaque phase et les durées des tables de correspondance des Plugins (index des éléments installés, registre des manifestes, planification du démarrage, traitement de la table des propriétaires).
- `OPENCLAW_GATEWAY_RESTART_TRACE=1` consigne les lignes `restart trace:` propres au redémarrage : gestion des signaux, achèvement des tâches actives, phases d’arrêt, démarrage suivant, délai avant disponibilité et mesures de mémoire.
- `OPENCLAW_DIAGNOSTICS=timeline` avec `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>` écrit, au mieux des possibilités, une chronologie de diagnostic du démarrage au format JSONL pour les bancs de test d’assurance qualité externes (équivaut à la configuration `diagnostics.flags: ["timeline"]` ; le chemin reste uniquement configurable par l’environnement). Ajoutez `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` pour inclure des échantillons de la boucle d’événements.
- `pnpm build` puis `pnpm test:startup:gateway -- --runs 5 --warmup 1` évaluent les performances du démarrage du Gateway avec le point d’entrée compilé de la CLI : première sortie du processus, `/healthz`, `/readyz`, durées de la trace de démarrage, délai de la boucle d’événements et durée de la table de correspondance des Plugins.
- `pnpm build` puis `pnpm test:restart:gateway -- --case skipChannels --runs 1 --restarts 5` évaluent les performances du redémarrage dans le processus sous macOS ou Linux (non pris en charge sous Windows ; le redémarrage nécessite `SIGUSR1`). Cette commande utilise `SIGUSR1`, active les deux traces dans le processus enfant et enregistre les prochains résultats de `/healthz` et `/readyz`, la durée d’indisponibilité, le délai avant disponibilité, le processeur, la RSS et les mesures de la trace de redémarrage.
- `/healthz` indique que le processus est actif ; `/readyz` indique qu’il est prêt à être utilisé. Considérez les lignes de trace et les résultats des évaluations de performances comme des indications permettant d’attribuer la responsabilité aux composants, et non comme une conclusion complète sur les performances fondée sur une seule période ou un seul échantillon.

## Interroger un Gateway en cours d’exécution

Toutes les commandes d’interrogation utilisent RPC sur WebSocket.

<Tabs>
  <Tab title="Modes de sortie">
    - Par défaut : lisible par un humain (en couleur dans une TTY).
    - `--json` : JSON lisible par une machine (sans mise en forme ni indicateur d’activité).
    - `--no-color` (ou `NO_COLOR=1`) : désactive les séquences ANSI tout en conservant la disposition lisible par un humain.

  </Tab>
  <Tab title="Options communes">
    - `--url <url>` : URL WebSocket du Gateway.
    - `--token <token>` : jeton du Gateway.
    - `--password <password>` : mot de passe du Gateway.
    - `--timeout <ms>` : délai maximal ou budget (la valeur par défaut varie selon la commande ; consultez chaque commande ci-dessous).
    - `--expect-final` : attendre une réponse « finale » (appels d’agent).

  </Tab>
</Tabs>

<Note>
Lorsque vous définissez `--url`, la CLI ne se rabat pas sur les identifiants de la configuration ou de l’environnement. Transmettez explicitement `--token` ou `--password`. L’absence d’identifiants explicites constitue une erreur.
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
openclaw gateway health --port 18789
```

`/healthz` est une sonde indiquant que le processus est actif : elle répond dès que le serveur peut répondre en HTTP. `/readyz` est plus stricte et reste en échec tant que les services auxiliaires des Plugins, les canaux ou les hooks configurés sont encore en cours d’initialisation. Les réponses détaillées locales ou authentifiées de `/readyz` incluent un bloc de diagnostic `eventLoop` (délai, utilisation, ratio par cœur de processeur, indicateur `degraded`).

<ParamField path="--port <port>" type="number">
  Cibler un Gateway sur local loopback utilisant ce port. Remplace `OPENCLAW_GATEWAY_URL` et `OPENCLAW_GATEWAY_PORT` pour cet appel.
</ParamField>

### `gateway usage-cost`

Récupérer les récapitulatifs des coûts d’utilisation depuis les journaux de session.

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
  Limiter le récapitulatif à l’identifiant d’un agent configuré.
</ParamField>
<ParamField path="--all-agents" type="boolean">
  Agréger tous les agents configurés. Ne peut pas être combiné avec `--agent`.
</ParamField>

### `gateway stability`

Récupérer l’enregistreur récent de stabilité des diagnostics depuis un Gateway en cours d’exécution.

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --bundle latest
openclaw gateway stability --bundle latest --export
openclaw gateway stability --json
```

<ParamField path="--limit <limit>" type="number" default="25">
  Nombre maximal d’événements récents à inclure (`1000` au maximum).
</ParamField>
<ParamField path="--type <type>" type="string">
  Filtrer par type d’événement de diagnostic, par exemple `payload.large` ou `diagnostic.memory.pressure`.
</ParamField>
<ParamField path="--since-seq <seq>" type="number">
  Inclure uniquement les événements postérieurs à un numéro de séquence de diagnostic.
</ParamField>
<ParamField path="--bundle [path]" type="string">
  Lire un paquet de stabilité conservé au lieu d’appeler le Gateway en cours d’exécution. `--bundle latest` (ou simplement `--bundle`) sélectionne le paquet le plus récent dans le répertoire d’état ; vous pouvez également transmettre directement le chemin d’un paquet JSON.
</ParamField>
<ParamField path="--export" type="boolean">
  Écrire une archive ZIP partageable de diagnostics d’assistance au lieu d’afficher les détails de stabilité.
</ParamField>
<ParamField path="--output <path>" type="string">
  Chemin de sortie pour `--export`.
</ParamField>

<AccordionGroup>
  <Accordion title="Confidentialité et comportement des paquets">
    - Les enregistrements conservent les métadonnées opérationnelles : noms des événements, nombres, tailles en octets, relevés de mémoire, état des files d’attente et des sessions, identifiants d’approbation, noms des canaux et des Plugins, ainsi que des récapitulatifs de session expurgés. Ils excluent le texte des conversations, les corps des Webhooks, les sorties des outils, les corps bruts des requêtes et des réponses, les jetons, les cookies, les valeurs secrètes, les noms d’hôte et les identifiants bruts de session. Définissez `diagnostics.enabled: false` pour désactiver entièrement l’enregistreur.
    - Les arrêts fatals du Gateway, les expirations de délai lors de l’arrêt et les échecs de démarrage après redémarrage écrivent le même instantané de diagnostic dans `~/.openclaw/logs/stability/openclaw-stability-*.json` lorsque l’enregistreur contient des événements. Examinez le paquet le plus récent avec `openclaw gateway stability --bundle latest` ; `--limit`, `--type` et `--since-seq` s’appliquent également à la sortie du paquet.

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

Écrire une archive ZIP locale de diagnostics conçue pour les rapports de bogues. Pour consulter le modèle de confidentialité et le contenu des paquets, voir [Exportation des diagnostics](/fr/gateway/diagnostics).

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  Chemin du fichier zip de sortie. Par défaut, une exportation d’assistance est créée dans le répertoire d’état.
</ParamField>
<ParamField path="--log-lines <count>" type="number" default="5000">
  Nombre maximal de lignes de journal assainies à inclure.
</ParamField>
<ParamField path="--log-bytes <bytes>" type="number" default="1000000">
  Nombre maximal d’octets de journal à inspecter.
</ParamField>
<ParamField path="--url <url>" type="string">
  URL WebSocket du Gateway pour l’instantané d’intégrité.
</ParamField>
<ParamField path="--token <token>" type="string">
  Jeton du Gateway pour l’instantané d’intégrité.
</ParamField>
<ParamField path="--password <password>" type="string">
  Mot de passe du Gateway pour l’instantané d’intégrité.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="3000">
  Délai d’expiration de l’instantané d’état et d’intégrité.
</ParamField>
<ParamField path="--no-stability-bundle" type="boolean">
  Ignorer la recherche d’un paquet de stabilité persistant.
</ParamField>
<ParamField path="--json" type="boolean">
  Afficher au format JSON le chemin écrit, la taille et le manifeste.
</ParamField>

L’exportation regroupe : `manifest.json` (inventaire des fichiers), `summary.md` (résumé Markdown), `diagnostics.json` (résumé général de la configuration, des journaux, de la découverte, de la stabilité, de l’état et de l’intégrité), `config/sanitized.json`, `status/gateway-status.json`, `health/gateway-health.json`, `logs/openclaw-sanitized.jsonl` et `stability/latest.json` lorsqu’un paquet existe.

Elle est conçue pour être partagée. Elle conserve les détails opérationnels utiles au débogage — champs de journal sûrs, noms des sous-systèmes, codes d’état, durées, modes configurés, ports, identifiants de plugins et de fournisseurs, paramètres de fonctionnalités non secrets et messages opérationnels de journal expurgés — tout en omettant ou en expurgeant le texte des discussions, le corps des webhooks, les sorties d’outils, les identifiants d’authentification, les cookies, les identifiants de comptes et de messages, le texte des prompts et des instructions, les noms d’hôtes et les valeurs secrètes. Lorsqu’un message de journal ressemble au contenu d’une charge utile utilisateur, de discussion ou d’outil (par exemple « l’utilisateur a dit », « texte de la discussion », « sortie de l’outil », « corps du webhook »), l’exportation conserve uniquement le fait qu’un message a été omis ainsi que son nombre d’octets.

### `gateway status`

Affiche le service Gateway (launchd/systemd/schtasks), ainsi qu’une sonde facultative de connectivité et d’authentification.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  Ajouter une cible de sonde explicite. La cible distante configurée et localhost sont toujours sondés.
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
  Ignorer la sonde de connectivité (affichage limité au service).
</ParamField>
<ParamField path="--deep" type="boolean">
  Analyser également les services au niveau du système.
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  Étendre la sonde de connectivité à une sonde de lecture et quitter avec un code différent de zéro en cas d’échec. Ne peut pas être combiné avec `--no-probe`.
</ParamField>

<AccordionGroup>
  <Accordion title="Sémantique de l’état">
    - Reste disponible à des fins de diagnostic même lorsque la configuration locale de la CLI est absente ou non valide.
    - La sortie par défaut confirme l’état du service, la connexion WebSocket et la capacité d’authentification visible au moment de l’établissement de la connexion — mais pas les opérations de lecture, d’écriture ou d’administration.
    - Les sondes ne modifient rien lors de la première authentification d’un appareil : elles réutilisent un jeton d’appareil existant en cache lorsqu’il est disponible, mais ne créent jamais une nouvelle identité d’appareil pour la CLI ni un enregistrement d’appairage en lecture seule uniquement pour vérifier l’état.
    - Résout, lorsque cela est possible, les SecretRefs d’authentification configurées pour authentifier la sonde. Si une SecretRef requise n’est pas résolue, `--json` signale `rpc.authWarning` lorsque la connectivité ou l’authentification de la sonde échoue ; transmettez explicitement `--token`/`--password` ou corrigez la source du secret. Les avertissements d’authentification non résolue sont supprimés dès que la sonde réussit.
    - La sortie JSON inclut `gateway.version` lorsque le Gateway en cours d’exécution la signale ; `--require-rpc` peut se rabattre sur la charge utile RPC `status.runtimeVersion` si la sonde d’établissement de connexion ne peut pas fournir les métadonnées de version.
    - Utilisez `--require-rpc` dans les scripts et les automatisations lorsqu’un service à l’écoute ne suffit pas et que vous avez également besoin que les RPC de portée lecture soient opérationnels.
    - `--deep` recherche des installations launchd/systemd/schtasks supplémentaires ; lorsque plusieurs services semblables à un Gateway sont détectés, la sortie lisible affiche des conseils de nettoyage (généralement, exécuter un seul Gateway par machine) et signale, le cas échéant, un transfert récent après redémarrage du superviseur.
    - `--deep` exécute également la validation de la configuration en mode tenant compte des plugins (`pluginValidation: "full"`) et fait apparaître les avertissements du manifeste des plugins (par exemple, des métadonnées de configuration de canal manquantes). La commande `gateway status` par défaut conserve le chemin rapide en lecture seule qui ignore la validation des plugins.
    - La sortie lisible inclut le chemin résolu du fichier journal, ainsi que les chemins et la validité des configurations de la CLI et du service, afin de faciliter le diagnostic des divergences de profil ou de répertoire d’état.

  </Accordion>
  <Accordion title="Vérifications de dérive d’authentification de systemd sous Linux">
    - Les vérifications de dérive de l’authentification du service lisent à la fois `Environment=` et `EnvironmentFile=` dans l’unité (y compris `%h`, les chemins entre guillemets, plusieurs fichiers et les fichiers facultatifs préfixés par `-`).
    - Résout les SecretRefs de `gateway.auth.token` à l’aide de l’environnement d’exécution fusionné (d’abord l’environnement de la commande du service, puis l’environnement du processus en solution de repli).
    - Les vérifications de dérive du jeton ignorent la résolution du jeton de configuration lorsque l’authentification par jeton n’est pas effectivement active (`gateway.auth.mode` est explicitement défini sur `password`/`none`/`trusted-proxy`, ou le mode n’est pas défini alors que le mot de passe peut prévaloir et qu’aucun jeton candidat ne peut prévaloir).

  </Accordion>
</AccordionGroup>

### `gateway probe`

La commande permettant de « tout déboguer ». Elle sonde toujours :

- votre Gateway distant configuré (s’il est défini), et
- localhost (local loopback), **même si une cible distante est configurée**.

La transmission de `--url` ajoute cette cible explicite avant les deux autres. La sortie lisible désigne les cibles par `URL (explicit)`, `Remote (configured)` / `Remote (configured, inactive)` et `Local loopback`.

<Note>
Si plusieurs cibles de sonde sont accessibles, elles sont toutes affichées. Un tunnel SSH, une URL TLS/de proxy et une URL distante configurée peuvent pointer vers le même Gateway, même avec des ports de transport différents ; `multiple_gateways` est réservé aux Gateways accessibles distincts ou dont l’identité est ambiguë. L’exécution de plusieurs Gateways est prise en charge pour des profils isolés (par exemple, un bot de secours), mais la plupart des installations n’en exécutent qu’un seul.
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --port 18789
```

<ParamField path="--port <port>" type="number">
  Utiliser ce port pour la cible de sonde local loopback et pour le port distant du tunnel SSH. Sans `--url`, cette option sélectionne uniquement la cible local loopback au lieu de l’URL d’environnement du Gateway configuré, du port d’environnement ou des cibles distantes.
</ParamField>

<AccordionGroup>
  <Accordion title="Interprétation">
    - `Reachable: yes` signifie qu’au moins une cible a accepté une connexion WebSocket.
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` indique ce que la sonde a pu confirmer au sujet de l’authentification, indépendamment de l’accessibilité.
    - `Read probe: ok` signifie que les appels RPC détaillés de portée lecture (`health`/`status`/`system-presence`/`config.get`) ont également réussi.
    - `Read probe: limited - missing scope: operator.read` signifie que la connexion a réussi, mais que les RPC de portée lecture sont limités. Cela est signalé comme une accessibilité **dégradée**, et non comme un échec complet.
    - `Read probe: failed` après `Connect: ok` signifie que la connexion WebSocket a été établie, mais que les diagnostics de lecture qui ont suivi ont expiré ou échoué — là encore, l’état est **dégradé**, et non inaccessible.
    - Comme `gateway status`, la sonde réutilise l’authentification d’appareil existante en cache, mais ne crée pas une identité d’appareil initiale ni un état d’appairage.
    - Le code de sortie n’est différent de zéro que si aucune cible sondée n’est accessible.

  </Accordion>
  <Accordion title="Sortie JSON">
    Niveau supérieur :

    - `ok` : au moins une cible est accessible.
    - `degraded` : au moins une cible a accepté une connexion, mais n’a pas achevé l’intégralité des diagnostics RPC détaillés.
    - `capability` : meilleure capacité observée parmi les cibles accessibles (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope` ou `unknown`).
    - `primaryTargetId` : meilleure cible à considérer comme la cible active retenue, dans l’ordre suivant : URL explicite, tunnel SSH, cible distante configurée, local loopback.
    - `warnings[]` : enregistrements d’avertissement fournis au mieux, avec `code`, `message` et éventuellement `targetIds`.
    - `network` : indications d’URL local loopback/tailnet dérivées de la configuration actuelle et de la mise en réseau de l’hôte.
    - `discovery.timeoutMs` / `discovery.count` : budget de découverte et nombre de résultats réellement utilisés pour cette passe de sonde.

    Par cible (`targets[].connect`) : `ok` (classification de l’accessibilité et de l’état dégradé), `rpcOk` (réussite complète des RPC détaillés), `scopeLimited` (échec des RPC détaillés en raison d’une portée opérateur manquante).

    Par cible (`targets[].auth`) : `role` et `scopes` signalés dans `hello-ok` lorsqu’ils sont disponibles, ainsi que la classification `capability` exposée.

  </Accordion>
  <Accordion title="Codes d’avertissement courants">
    - `ssh_tunnel_failed` : la configuration du tunnel SSH a échoué ; la commande s’est rabattue sur des sondes directes.
    - `multiple_gateways` : des identités de Gateway distinctes étaient accessibles, ou OpenClaw n’a pas pu confirmer que les cibles accessibles correspondaient au même Gateway. Un tunnel SSH, une URL de proxy ou une URL distante configurée vers le même Gateway ne déclenche pas cet avertissement.
    - `auth_secretref_unresolved` : une SecretRef d’authentification configurée n’a pas pu être résolue pour une cible en échec.
    - `probe_scope_limited` : la connexion WebSocket a réussi, mais la sonde de lecture a été limitée par l’absence de `operator.read`.
    - `local_tls_runtime_unavailable` : le TLS du Gateway local est activé, mais OpenClaw n’a pas pu charger l’empreinte du certificat local.

  </Accordion>
</AccordionGroup>

#### Connexion distante par SSH (parité avec l’application Mac)

Le mode "Remote over SSH" de l’application macOS utilise une redirection de port locale afin qu’un Gateway distant limité à la boucle locale devienne accessible à l’adresse `ws://127.0.0.1:<port>`.

Équivalent dans la CLI :

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
  Sélectionner le premier hôte de Gateway découvert comme cible SSH à partir du point de terminaison de découverte résolu (`local.` plus le domaine étendu configuré, le cas échéant). Les indications reposant uniquement sur TXT sont ignorées.
</ParamField>

Valeurs de configuration par défaut (facultatives) : `gateway.remote.sshTarget`, `gateway.remote.sshIdentity`.

### `gateway call <method>`

Utilitaire RPC de bas niveau.

```bash
openclaw gateway call status
openclaw gateway call logs.tail --params '{"limit": 200}'
```

<ParamField path="--params <json>" type="string" default="{}">
  Chaîne représentant un objet JSON pour les paramètres.
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
<ParamField path="--timeout <ms>" type="number" default="10000">
  Délai maximal.
</ParamField>
<ParamField path="--expect-final" type="boolean">
  Principalement destiné aux RPC de type agent qui diffusent des événements intermédiaires avant une charge utile finale.
</ParamField>
<ParamField path="--json" type="boolean">
  Sortie JSON lisible par une machine.
</ParamField>

<Note>
`--params` doit être un JSON valide, et chaque méthode valide la structure de ses propres paramètres (les champs supplémentaires ou mal nommés sont rejetés).
</Note>

## Gérer le service Gateway

```bash
openclaw gateway install
openclaw gateway start
openclaw gateway stop
openclaw gateway restart
openclaw gateway uninstall
```

### Installation avec un wrapper

Utilisez `--wrapper` lorsque le service géré doit démarrer par l’intermédiaire d’un autre exécutable, par exemple un adaptateur de gestionnaire de secrets ou un utilitaire d’exécution sous une autre identité. Le wrapper reçoit les arguments habituels du Gateway et doit finalement exécuter `openclaw` ou Node avec ces arguments.

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

Vous pouvez également définir le wrapper au moyen de l’environnement. `gateway install` vérifie que le chemin correspond à un fichier exécutable, inscrit le wrapper dans les `ProgramArguments` du service et conserve `OPENCLAW_WRAPPER` dans l’environnement du service pour les réinstallations forcées, les mises à jour et les réparations ultérieures effectuées par doctor.

```bash
OPENCLAW_WRAPPER="$HOME/.local/bin/openclaw-doppler" openclaw gateway install --force
openclaw doctor
```

Pour supprimer un wrapper conservé, effacez `OPENCLAW_WRAPPER` lors de la réinstallation :

```bash
OPENCLAW_WRAPPER= openclaw gateway install --force
openclaw gateway restart
```

<AccordionGroup>
  <Accordion title="Options des commandes">
    - `gateway status` : `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
    - `gateway install` : `--port`, `--runtime <node|bun>` (valeur par défaut : `node`), `--token`, `--wrapper <path>`, `--force`, `--json`
    - `gateway restart` : `--safe`, `--skip-deferral`, `--force`, `--wait <duration>`, `--json`
    - `gateway uninstall|start` : `--json`
    - `gateway stop` : `--disable`, `--json`

  </Accordion>
  <Accordion title="Comportement du cycle de vie">
    - Utilisez `gateway restart` pour redémarrer un service géré. N’enchaînez pas `gateway stop` et `gateway start` en remplacement d’un redémarrage.
    - Sous macOS, `gateway stop` utilise `launchctl bootout` par défaut, ce qui retire le LaunchAgent de la session de démarrage actuelle sans conserver une désactivation — la récupération automatique KeepAlive reste active en cas de futurs plantages et `gateway start` le réactive proprement sans nécessiter de commande manuelle `launchctl enable`. Passez `--disable` pour désactiver durablement KeepAlive et RunAtLoad afin que le Gateway ne redémarre pas avant le prochain `gateway start` explicite ; utilisez cette option lorsqu’un arrêt manuel doit persister après les redémarrages.
    - Les commandes de cycle de vie acceptent `--json` pour les scripts.

  </Accordion>
  <Accordion title="Authentification et SecretRefs lors de l’installation">
    - Lorsque l’authentification par jeton exige un jeton et que `gateway.auth.token` est géré par SecretRef, `gateway install` vérifie que la SecretRef peut être résolue, mais ne conserve pas le jeton résolu dans les métadonnées d’environnement du service.
    - Si l’authentification par jeton exige un jeton et que la SecretRef du jeton configuré n’est pas résolue, l’installation échoue de manière sécurisée au lieu de conserver une valeur de secours en texte brut.
    - Pour l’authentification par mot de passe avec `gateway run`, préférez `OPENCLAW_GATEWAY_PASSWORD`, `--password-file` ou un `gateway.auth.password` adossé à une SecretRef plutôt qu’un `--password` en ligne.
    - En mode d’authentification déduit, un `OPENCLAW_GATEWAY_PASSWORD` défini uniquement dans le shell n’assouplit pas les exigences de jeton à l’installation ; utilisez une configuration persistante (`gateway.auth.password` ou `env` dans la configuration) lors de l’installation d’un service géré.
    - Si `gateway.auth.token` et `gateway.auth.password` sont tous deux configurés et que `gateway.auth.mode` n’est pas défini, l’installation est bloquée jusqu’à ce que le mode soit défini explicitement.

  </Accordion>
</AccordionGroup>

## Découvrir les Gateways (Bonjour)

`gateway discover` recherche les balises Gateway (`_openclaw-gw._tcp`).

- DNS-SD multidiffusion : `local.`
- DNS-SD monodiffusion (Bonjour étendu) : choisissez un domaine (exemple : `openclaw.internal.`) et configurez un DNS partagé ainsi qu’un serveur DNS ; consultez [Bonjour](/fr/gateway/bonjour).

Seuls les Gateways pour lesquels la découverte Bonjour est activée (par défaut) annoncent la balise.

Indications TXT sur chaque balise : `role` (indication du rôle du Gateway), `transport` (indication du transport, par exemple `gateway`), `gatewayPort` (port WebSocket, généralement `18789`), `tailnetDns` (nom d’hôte MagicDNS, lorsqu’il est disponible), `gatewayTls` / `gatewayTlsSha256` (TLS activé et empreinte du certificat). `sshPort` et `cliPath` ne sont publiés qu’en mode de découverte complet (`discovery.mdns.mode: "full"` ; la valeur par défaut est `"minimal"`, qui les omet — les clients utilisent alors par défaut le port `22` pour les cibles SSH).

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  Délai d’expiration par commande (parcours/résolution).
</ParamField>
<ParamField path="--json" type="boolean">
  Sortie lisible par une machine (désactive également la mise en forme et l’indicateur de chargement).
</ParamField>

Exemples :

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

<Note>
- Analyse `local.` ainsi que le domaine étendu configuré lorsqu’il est activé.
- Dans la sortie JSON, `wsUrl` est dérivé du point de terminaison du service résolu, et non d’indications provenant uniquement des enregistrements TXT, telles que `lanHost` ou `tailnetDns`.
- `discovery.mdns.mode` contrôle la publication de `sshPort`/`cliPath` à la fois sur le mDNS `local.` et sur le DNS-SD étendu (voir ci-dessus).

</Note>

## Voir aussi

- [Référence de la CLI](/fr/cli)
- [Guide d’exploitation du Gateway](/fr/gateway)
