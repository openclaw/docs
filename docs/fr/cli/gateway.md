---
read_when:
    - Exécution du Gateway depuis la CLI (développement ou serveurs)
    - Débogage de l’authentification du Gateway, des modes de liaison et de la connectivité
    - Découverte des Gateway avec Bonjour (DNS-SD local et en zone étendue)
sidebarTitle: Gateway
summary: CLI du Gateway OpenClaw (`openclaw gateway`) — exécuter, interroger et découvrir des Gateway
title: Gateway
x-i18n:
    generated_at: "2026-05-11T20:27:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 774753c844909d1ec9257f2035b10c2561432ec2161351e9a6438cd12f7f2ecc
    source_path: cli/gateway.md
    workflow: 16
---

Le Gateway est le serveur WebSocket d’OpenClaw (canaux, nœuds, sessions, hooks). Les sous-commandes de cette page se trouvent sous `openclaw gateway …`.

<CardGroup cols={3}>
  <Card title="Bonjour discovery" href="/fr/gateway/bonjour">
    Configuration mDNS locale + DNS-SD grande portée.
  </Card>
  <Card title="Discovery overview" href="/fr/gateway/discovery">
    Comment OpenClaw annonce et trouve les gateways.
  </Card>
  <Card title="Configuration" href="/fr/gateway/configuration">
    Clés de configuration Gateway de premier niveau.
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
  <Accordion title="Startup behavior">
    - Par défaut, le Gateway refuse de démarrer sauf si `gateway.mode=local` est défini dans `~/.openclaw/openclaw.json`. Utilisez `--allow-unconfigured` pour les exécutions ponctuelles/de développement.
    - `openclaw onboard --mode local` et `openclaw setup` sont censés écrire `gateway.mode=local`. Si le fichier existe mais que `gateway.mode` est absent, considérez cela comme une configuration cassée ou écrasée et réparez-la au lieu de supposer implicitement le mode local.
    - Si le fichier existe et que `gateway.mode` est absent, le Gateway considère cela comme un dommage de configuration suspect et refuse de « deviner local » pour vous.
    - La liaison au-delà du loopback sans authentification est bloquée (garde-fou de sécurité).
    - `SIGUSR1` déclenche un redémarrage dans le processus lorsqu’il est autorisé (`commands.restart` est activé par défaut ; définissez `commands.restart: false` pour bloquer le redémarrage manuel, tandis que l’application/la mise à jour de l’outil et de la configuration du gateway restent autorisées).
    - Les gestionnaires `SIGINT`/`SIGTERM` arrêtent le processus gateway, mais ils ne restaurent aucun état de terminal personnalisé. Si vous enveloppez la CLI avec une TUI ou une entrée en mode brut, restaurez le terminal avant de quitter.

  </Accordion>
</AccordionGroup>

### Options

<ParamField path="--port <port>" type="number">
  Port WebSocket (la valeur par défaut vient de la configuration/de l’environnement ; généralement `18789`).
</ParamField>
<ParamField path="--bind <loopback|lan|tailnet|auto|custom>" type="string">
  Mode de liaison de l’écouteur.
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
  Réinitialiser la configuration serve/funnel Tailscale à l’arrêt.
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  Autoriser le démarrage du gateway sans `gateway.mode=local` dans la configuration. Contourne le garde de démarrage uniquement pour l’amorçage ponctuel/de développement ; n’écrit ni ne répare le fichier de configuration.
</ParamField>
<ParamField path="--dev" type="boolean">
  Créer une configuration + un espace de travail de développement s’ils manquent (ignore BOOTSTRAP.md).
</ParamField>
<ParamField path="--reset" type="boolean">
  Réinitialiser la configuration de développement + les identifiants + les sessions + l’espace de travail (requiert `--dev`).
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
  Consigner les événements bruts du flux de modèle en jsonl.
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

`openclaw gateway restart --safe` demande au Gateway en cours d’exécution de précontrôler le travail OpenClaw actif avant de redémarrer. Si des opérations en file d’attente, la livraison de réponses, des exécutions intégrées ou des exécutions de tâches sont actives, le Gateway signale les bloqueurs, regroupe les demandes de redémarrage sûr en double et redémarre une fois le travail actif écoulé. Le simple `restart` conserve le comportement existant du gestionnaire de service pour compatibilité. Utilisez `--force` uniquement lorsque vous voulez explicitement la voie de remplacement immédiat.

`openclaw gateway restart --safe --skip-deferral` exécute le même redémarrage coordonné conscient d’OpenClaw que `--safe`, mais contourne la barrière de report du travail actif afin que le Gateway émette le redémarrage immédiatement même lorsque des bloqueurs sont signalés. Utilisez-le comme issue de secours opérateur lorsqu’un report a été bloqué par une exécution de tâche coincée et que `--safe` seul attendrait indéfiniment. `--skip-deferral` requiert `--safe`.

<Warning>
`--password` en ligne peut être exposé dans les listes de processus locales. Préférez `--password-file`, l’environnement ou un `gateway.auth.password` basé sur SecretRef.
</Warning>

### Profilage du démarrage

- Définissez `OPENCLAW_GATEWAY_STARTUP_TRACE=1` pour journaliser les durées des phases pendant le démarrage du Gateway, y compris le délai `eventLoopMax` par phase et les durées des tables de recherche de plugins pour l’index installé, le registre de manifestes, la planification du démarrage et le travail sur la carte des propriétaires.
- Définissez `OPENCLAW_DIAGNOSTICS=timeline` avec `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>` pour écrire une chronologie de diagnostics de démarrage JSONL au mieux pour les harnais QA externes. Vous pouvez aussi activer le drapeau avec `diagnostics.flags: ["timeline"]` dans la configuration ; le chemin reste fourni par l’environnement. Ajoutez `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` pour inclure des échantillons de boucle d’événements.
- Exécutez `pnpm test:startup:gateway -- --runs 5 --warmup 1` pour mesurer le démarrage du Gateway. Le benchmark enregistre la première sortie du processus, `/healthz`, `/readyz`, les durées de trace de démarrage, le délai de boucle d’événements et les détails de durée des tables de recherche de plugins.

## Interroger un Gateway en cours d’exécution

Toutes les commandes de requête utilisent RPC WebSocket.

<Tabs>
  <Tab title="Output modes">
    - Par défaut : lisible par l’humain (coloré dans une TTY).
    - `--json` : JSON lisible par machine (sans style/spinner).
    - `--no-color` (ou `NO_COLOR=1`) : désactiver ANSI tout en conservant la mise en page humaine.

  </Tab>
  <Tab title="Shared options">
    - `--url <url>` : URL WebSocket du Gateway.
    - `--token <token>` : jeton du Gateway.
    - `--password <password>` : mot de passe du Gateway.
    - `--timeout <ms>` : délai/budget (varie selon la commande).
    - `--expect-final` : attendre une réponse « final » (appels d’agent).

  </Tab>
</Tabs>

<Note>
Lorsque vous définissez `--url`, la CLI ne se rabat pas sur la configuration ni sur les identifiants d’environnement. Passez `--token` ou `--password` explicitement. L’absence d’identifiants explicites est une erreur.
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

Le point de terminaison HTTP `/healthz` est une sonde de disponibilité : il répond dès que le serveur peut répondre en HTTP. Le point de terminaison HTTP `/readyz` est plus strict et reste rouge tant que les sidecars de plugins de démarrage, les canaux ou les hooks configurés sont encore en stabilisation. Les réponses détaillées de readiness locales ou authentifiées incluent un bloc de diagnostic `eventLoop` avec le délai de boucle d’événements, l’utilisation de la boucle d’événements, le ratio de cœurs CPU et un drapeau `degraded`.

### `gateway usage-cost`

Récupérer les récapitulatifs de coût d’utilisation depuis les journaux de session.

```bash
openclaw gateway usage-cost
openclaw gateway usage-cost --days 7
openclaw gateway usage-cost --json
```

<ParamField path="--days <days>" type="number" default="30">
  Nombre de jours à inclure.
</ParamField>

### `gateway stability`

Récupérer l’enregistreur de stabilité de diagnostics récent depuis un Gateway en cours d’exécution.

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
  Filtrer par type d’événement de diagnostic, comme `payload.large` ou `diagnostic.memory.pressure`.
</ParamField>
<ParamField path="--since-seq <seq>" type="number">
  Inclure uniquement les événements après un numéro de séquence de diagnostic.
</ParamField>
<ParamField path="--bundle [path]" type="string">
  Lire un bundle de stabilité persistant au lieu d’appeler le Gateway en cours d’exécution. Utilisez `--bundle latest` (ou simplement `--bundle`) pour le bundle le plus récent sous le répertoire d’état, ou passez directement un chemin JSON de bundle.
</ParamField>
<ParamField path="--export" type="boolean">
  Écrire un zip de diagnostics de support partageable au lieu d’imprimer les détails de stabilité.
</ParamField>
<ParamField path="--output <path>" type="string">
  Chemin de sortie pour `--export`.
</ParamField>

<AccordionGroup>
  <Accordion title="Privacy and bundle behavior">
    - Les enregistrements conservent les métadonnées opérationnelles : noms d’événements, décomptes, tailles en octets, relevés mémoire, état des files/sessions, noms de canaux/plugins et récapitulatifs de session expurgés. Ils ne conservent pas le texte des chats, les corps de webhooks, les sorties d’outils, les corps bruts de requête ou de réponse, les jetons, les cookies, les valeurs secrètes, les noms d’hôtes ni les identifiants de session bruts. Définissez `diagnostics.enabled: false` pour désactiver entièrement l’enregistreur.
    - Lors des sorties fatales du Gateway, des expirations de délai d’arrêt et des échecs de démarrage après redémarrage, OpenClaw écrit le même instantané de diagnostic dans `~/.openclaw/logs/stability/openclaw-stability-*.json` lorsque l’enregistreur a des événements. Inspectez le bundle le plus récent avec `openclaw gateway stability --bundle latest` ; `--limit`, `--type` et `--since-seq` s’appliquent aussi à la sortie du bundle.

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

Écrire un zip de diagnostics local conçu pour être joint aux rapports de bugs. Pour le modèle de confidentialité et le contenu du bundle, consultez [Export de diagnostics](/fr/gateway/diagnostics).

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  Chemin du zip de sortie. Par défaut, export de support sous le répertoire d’état.
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
  Délai de l’instantané de statut/santé.
</ParamField>
<ParamField path="--no-stability-bundle" type="boolean">
  Ignorer la recherche de bundle de stabilité persistant.
</ParamField>
<ParamField path="--json" type="boolean">
  Imprimer le chemin écrit, la taille et le manifeste en JSON.
</ParamField>

L’export contient un manifeste, un récapitulatif Markdown, la forme de la configuration, des détails de configuration assainis, des récapitulatifs de journaux assainis, des instantanés de statut/santé Gateway assainis et le bundle de stabilité le plus récent lorsqu’il en existe un.

Il est destiné à être partagé. Il conserve les détails opérationnels qui aident au débogage, comme les champs de journaux OpenClaw sûrs, les noms de sous-systèmes, les codes d’état, les durées, les modes configurés, les ports, les identifiants de plugins, les identifiants de fournisseurs, les paramètres de fonctionnalités non secrets et les messages de journaux opérationnels expurgés. Il omet ou expurge le texte des chats, les corps de webhooks, les sorties d’outils, les identifiants, les cookies, les identifiants de compte/message, le texte de prompts/instructions, les noms d’hôtes et les valeurs secrètes. Lorsqu’un message de style LogTape ressemble à du texte de charge utile utilisateur/chat/outil, l’export conserve seulement le fait qu’un message a été omis ainsi que son nombre d’octets.

### `gateway status`

`gateway status` affiche le service Gateway (launchd/systemd/schtasks) ainsi qu’une sonde facultative de connectivité/capacité d’authentification.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  Ajoute une cible de sondage explicite. La cible distante configurée + localhost sont toujours sondés.
</ParamField>
<ParamField path="--token <token>" type="string">
  Authentification par jeton pour le sondage.
</ParamField>
<ParamField path="--password <password>" type="string">
  Authentification par mot de passe pour le sondage.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="10000">
  Délai d’expiration du sondage.
</ParamField>
<ParamField path="--no-probe" type="boolean">
  Ignore le sondage de connectivité (vue limitée au service).
</ParamField>
<ParamField path="--deep" type="boolean">
  Analyse aussi les services au niveau système.
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  Convertit le sondage de connectivité par défaut en sondage de lecture et termine avec un code non nul lorsque ce sondage de lecture échoue. Ne peut pas être combiné avec `--no-probe`.
</ParamField>

<AccordionGroup>
  <Accordion title="Sémantique du statut">
    - `gateway status` reste disponible pour le diagnostic même lorsque la configuration CLI locale est manquante ou invalide.
    - Par défaut, `gateway status` prouve l’état du service, la connexion WebSocket et la capacité d’authentification visible au moment de l’établissement de la connexion. Il ne prouve pas les opérations de lecture/écriture/administration.
    - Les sondages de diagnostic ne modifient rien pour l’authentification initiale des appareils : ils réutilisent un jeton d’appareil existant en cache s’il existe, mais ils ne créent pas une nouvelle identité d’appareil CLI ni un enregistrement d’appairage d’appareil en lecture seule uniquement pour vérifier le statut.
    - `gateway status` résout les SecretRefs d’authentification configurés pour l’authentification du sondage lorsque c’est possible.
    - Si un SecretRef d’authentification requis n’est pas résolu dans ce chemin de commande, `gateway status --json` signale `rpc.authWarning` lorsque la connectivité/l’authentification du sondage échoue ; passez `--token`/`--password` explicitement ou résolvez d’abord la source du secret.
    - Si le sondage réussit, les avertissements de référence d’authentification non résolue sont supprimés pour éviter les faux positifs.
    - Utilisez `--require-rpc` dans les scripts et l’automatisation lorsqu’un service à l’écoute ne suffit pas et que vous avez aussi besoin que les appels RPC avec portée de lecture soient sains.
    - `--deep` ajoute une analyse au mieux des installations launchd/systemd/schtasks supplémentaires. Lorsque plusieurs services de type Gateway sont détectés, la sortie lisible affiche des conseils de nettoyage et avertit que la plupart des configurations devraient exécuter un Gateway par machine.
    - `--deep` signale aussi un transfert récent de redémarrage du superviseur Gateway lorsque le processus du service s’est terminé proprement pour un redémarrage par superviseur externe.
    - `--deep` exécute la validation de configuration en mode compatible Plugin (`pluginValidation: "full"`) et expose les avertissements de manifeste Plugin configurés (par exemple des métadonnées de configuration de canal manquantes) afin que les vérifications rapides d’installation et de mise à jour les détectent. Le `gateway status` par défaut conserve le chemin rapide en lecture seule qui ignore la validation des Plugin.
    - La sortie lisible inclut le chemin résolu du fichier de journal ainsi que l’instantané des chemins/validité de configuration CLI-vs-service pour aider à diagnostiquer les dérives de profil ou de répertoire d’état.

  </Accordion>
  <Accordion title="Vérifications de dérive d’authentification Linux systemd">
    - Sur les installations Linux systemd, les vérifications de dérive d’authentification du service lisent les valeurs `Environment=` et `EnvironmentFile=` de l’unité (y compris `%h`, les chemins entre guillemets, plusieurs fichiers et les fichiers optionnels `-`).
    - Les vérifications de dérive résolvent les SecretRefs `gateway.auth.token` à l’aide de l’environnement d’exécution fusionné (d’abord l’environnement de commande du service, puis l’environnement du processus en solution de repli).
    - Si l’authentification par jeton n’est pas effectivement active (`gateway.auth.mode` explicite défini sur `password`/`none`/`trusted-proxy`, ou mode non défini où le mot de passe peut l’emporter et aucun candidat jeton ne peut l’emporter), les vérifications de dérive de jeton ignorent la résolution du jeton de configuration.

  </Accordion>
</AccordionGroup>

### `gateway probe`

`gateway probe` est la commande « tout déboguer ». Elle sonde toujours :

- votre Gateway distant configuré (s’il est défini), et
- localhost (loopback) **même si la cible distante est configurée**.

Si vous passez `--url`, cette cible explicite est ajoutée avant les deux autres. La sortie lisible étiquette les cibles comme suit :

- `URL (explicit)`
- `Remote (configured)` ou `Remote (configured, inactive)`
- `Local loopback`

<Note>
Si plusieurs Gateways sont joignables, elle les affiche tous. Plusieurs Gateways sont pris en charge lorsque vous utilisez des profils/ports isolés (par exemple un bot de secours), mais la plupart des installations exécutent tout de même un seul Gateway.
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
```

<AccordionGroup>
  <Accordion title="Interprétation">
    - `Reachable: yes` signifie qu’au moins une cible a accepté une connexion WebSocket.
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` indique ce que le sondage a pu prouver concernant l’authentification. C’est distinct de la joignabilité.
    - `Read probe: ok` signifie que les appels RPC de détail avec portée de lecture (`health`/`status`/`system-presence`/`config.get`) ont aussi réussi.
    - `Read probe: limited - missing scope: operator.read` signifie que la connexion a réussi, mais que le RPC avec portée de lecture est limité. Cela est signalé comme une joignabilité **dégradée**, et non comme un échec complet.
    - `Read probe: failed` après `Connect: ok` signifie que le Gateway a accepté la connexion WebSocket, mais que les diagnostics de lecture suivants ont expiré ou échoué. Cela correspond aussi à une joignabilité **dégradée**, et non à un Gateway injoignable.
    - Comme `gateway status`, le sondage réutilise l’authentification d’appareil existante en cache, mais ne crée pas d’identité d’appareil initiale ni d’état d’appairage.
    - Le code de sortie est non nul uniquement lorsqu’aucune cible sondée n’est joignable.

  </Accordion>
  <Accordion title="Sortie JSON">
    Niveau supérieur :

    - `ok` : au moins une cible est joignable.
    - `degraded` : au moins une cible a accepté une connexion mais n’a pas terminé les diagnostics RPC détaillés complets.
    - `capability` : meilleure capacité observée parmi les cibles joignables (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope` ou `unknown`).
    - `primaryTargetId` : meilleure cible à traiter comme gagnante active dans cet ordre : URL explicite, tunnel SSH, cible distante configurée, puis local loopback.
    - `warnings[]` : enregistrements d’avertissement au mieux avec `code`, `message` et `targetIds` facultatif.
    - `network` : indications d’URL local loopback/tailnet dérivées de la configuration actuelle et du réseau de l’hôte.
    - `discovery.timeoutMs` et `discovery.count` : le budget de découverte réel et le nombre de résultats utilisés pour ce passage de sondage.

    Par cible (`targets[].connect`) :

    - `ok` : joignabilité après connexion + classification dégradée.
    - `rpcOk` : réussite complète du RPC détaillé.
    - `scopeLimited` : le RPC détaillé a échoué en raison d’une portée opérateur manquante.

    Par cible (`targets[].auth`) :

    - `role` : rôle d’authentification signalé dans `hello-ok` lorsqu’il est disponible.
    - `scopes` : portées accordées signalées dans `hello-ok` lorsqu’elles sont disponibles.
    - `capability` : classification de capacité d’authentification exposée pour cette cible.

  </Accordion>
  <Accordion title="Codes d’avertissement courants">
    - `ssh_tunnel_failed` : la configuration du tunnel SSH a échoué ; la commande s’est rabattue sur des sondages directs.
    - `multiple_gateways` : plus d’une cible était joignable ; c’est inhabituel sauf si vous exécutez intentionnellement des profils isolés, comme un bot de secours.
    - `auth_secretref_unresolved` : un SecretRef d’authentification configuré n’a pas pu être résolu pour une cible en échec.
    - `probe_scope_limited` : la connexion WebSocket a réussi, mais le sondage de lecture était limité par l’absence de `operator.read`.

  </Accordion>
</AccordionGroup>

#### Accès distant via SSH (parité avec l’app Mac)

Le mode « Remote over SSH » de l’app macOS utilise une redirection de port locale afin que le Gateway distant (qui peut être lié uniquement au loopback) devienne joignable à `ws://127.0.0.1:<port>`.

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
  Choisit le premier hôte Gateway découvert comme cible SSH à partir du point de terminaison de découverte résolu (`local.` plus le domaine étendu configuré, le cas échéant). Les indications TXT seules sont ignorées.
</ParamField>

Configuration (facultative, utilisée comme valeurs par défaut) :

- `gateway.remote.sshTarget`
- `gateway.remote.sshIdentity`

### `gateway call <method>`

Assistant RPC bas niveau.

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
shim de gestionnaire de secrets ou un assistant d’exécution sous un autre utilisateur. Le wrapper reçoit les arguments Gateway normaux et est
responsable de finir par exécuter `openclaw` ou Node avec ces arguments.

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

Vous pouvez aussi définir le wrapper via l’environnement. `gateway install` valide que le chemin est
un fichier exécutable, écrit le wrapper dans les `ProgramArguments` du service et persiste
`OPENCLAW_WRAPPER` dans l’environnement du service pour les réinstallations forcées, mises à jour et réparations doctor
ultérieures.

```bash
OPENCLAW_WRAPPER="$HOME/.local/bin/openclaw-doppler" openclaw gateway install --force
openclaw doctor
```

Pour supprimer un wrapper persisté, videz `OPENCLAW_WRAPPER` lors de la réinstallation :

```bash
OPENCLAW_WRAPPER= openclaw gateway install --force
openclaw gateway restart
```

<AccordionGroup>
  <Accordion title="Options de commande">
    - `gateway status` : `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
    - `gateway install` : `--port`, `--runtime <node|bun>`, `--token`, `--wrapper <path>`, `--force`, `--json`
    - `gateway restart` : `--safe`, `--skip-deferral`, `--force`, `--wait <duration>`, `--json`
    - `gateway uninstall|start` : `--json`
    - `gateway stop` : `--disable`, `--json`

  </Accordion>
  <Accordion title="Comportement du cycle de vie">
    - Utilisez `gateway restart` pour redémarrer un service géré. N’enchaînez pas `gateway stop` et `gateway start` comme substitut à un redémarrage.
    - Sur macOS, `gateway stop` utilise `launchctl bootout` par défaut, ce qui retire le LaunchAgent de la session de démarrage actuelle sans désactivation persistante — la récupération automatique KeepAlive reste active pour les futurs plantages, et `gateway start` le réactive proprement sans `launchctl enable` manuel. Passez `--disable` pour supprimer durablement KeepAlive et RunAtLoad afin que le Gateway ne redémarre pas avant le prochain `gateway start` explicite ; utilisez cette option lorsqu’un arrêt manuel doit survivre aux redémarrages de la machine ou du système.
    - `gateway restart --safe` demande au Gateway en cours d’exécution de vérifier au préalable le travail OpenClaw actif et de différer le redémarrage jusqu’à ce que la livraison des réponses, les exécutions intégrées et les exécutions de tâches soient terminées. `--safe` ne peut pas être combiné avec `--force` ou `--wait`.
    - `gateway restart --wait 30s` remplace le budget configuré de vidange avant redémarrage pour ce redémarrage. Les nombres seuls sont des millisecondes ; les unités telles que `s`, `m` et `h` sont acceptées. `--wait 0` attend indéfiniment.
    - `gateway restart --safe --skip-deferral` exécute le redémarrage sûr tenant compte d’OpenClaw, mais contourne la barrière de report afin que le Gateway émette le redémarrage immédiatement, même lorsque des bloqueurs sont signalés. C’est une échappatoire opérateur pour les reports bloqués par des exécutions de tâches coincées ; nécessite `--safe`.
    - `gateway restart --force` ignore la vidange du travail actif et redémarre immédiatement. Utilisez-le lorsqu’un opérateur a déjà inspecté les bloqueurs de tâches listés et veut remettre le gateway en service immédiatement.
    - Les commandes de cycle de vie acceptent `--json` pour les scripts.

  </Accordion>
  <Accordion title="Auth et SecretRefs au moment de l’installation">
    - Lorsque l’authentification par jeton nécessite un jeton et que `gateway.auth.token` est géré par SecretRef, `gateway install` valide que le SecretRef peut être résolu, mais ne persiste pas le jeton résolu dans les métadonnées d’environnement du service.
    - Si l’authentification par jeton nécessite un jeton et que le SecretRef de jeton configuré n’est pas résolu, l’installation échoue de façon fermée au lieu de persister un texte en clair de repli.
    - Pour l’authentification par mot de passe avec `gateway run`, préférez `OPENCLAW_GATEWAY_PASSWORD`, `--password-file` ou un `gateway.auth.password` adossé à SecretRef plutôt que `--password` en ligne.
    - En mode d’authentification inféré, `OPENCLAW_GATEWAY_PASSWORD` limité au shell n’assouplit pas les exigences de jeton à l’installation ; utilisez une configuration durable (`gateway.auth.password` ou config `env`) lors de l’installation d’un service géré.
    - Si `gateway.auth.token` et `gateway.auth.password` sont tous deux configurés et que `gateway.auth.mode` n’est pas défini, l’installation est bloquée jusqu’à ce que le mode soit défini explicitement.

  </Accordion>
</AccordionGroup>

## Découvrir les gateways (Bonjour)

`gateway discover` recherche les balises Gateway (`_openclaw-gw._tcp`).

- DNS-SD multidiffusion : `local.`
- DNS-SD monodiffusion (Bonjour étendu) : choisissez un domaine (exemple : `openclaw.internal.`) et configurez un DNS fractionné + un serveur DNS ; consultez [Bonjour](/fr/gateway/bonjour).

Seuls les gateways avec la découverte Bonjour activée (par défaut) annoncent la balise.

Les enregistrements de découverte étendue incluent (TXT) :

- `role` (indice de rôle du gateway)
- `transport` (indice de transport, par exemple `gateway`)
- `gatewayPort` (port WebSocket, généralement `18789`)
- `sshPort` (facultatif ; les clients utilisent par défaut `22` comme cible SSH lorsqu’il est absent)
- `tailnetDns` (nom d’hôte MagicDNS, lorsqu’il est disponible)
- `gatewayTls` / `gatewayTlsSha256` (TLS activé + empreinte du certificat)
- `cliPath` (indice d’installation distante écrit dans la zone étendue)

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  Délai d’expiration par commande (parcours/résolution).
</ParamField>
<ParamField path="--json" type="boolean">
  Sortie lisible par machine (désactive aussi le style et l’indicateur de progression).
</ParamField>

Exemples :

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

<Note>
- La CLI analyse `local.` ainsi que le domaine étendu configuré lorsqu’il est activé.
- `wsUrl` dans la sortie JSON est dérivé du point de terminaison de service résolu, et non d’indices uniquement TXT tels que `lanHost` ou `tailnetDns`.
- Sur le mDNS `local.`, `sshPort` et `cliPath` ne sont diffusés que lorsque `discovery.mdns.mode` vaut `full`. Le DNS-SD étendu écrit toujours `cliPath` ; `sshPort` y reste également facultatif.

</Note>

## Connexe

- [Référence CLI](/fr/cli)
- [Runbook Gateway](/fr/gateway)
