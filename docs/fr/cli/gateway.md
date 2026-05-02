---
read_when:
    - Exécution du Gateway depuis la CLI (développement ou serveurs)
    - Débogage de l’authentification du Gateway, des modes de liaison et de la connectivité
    - Découverte des Gateway via Bonjour (DNS-SD local + DNS-SD étendu)
sidebarTitle: Gateway
summary: OpenClaw Gateway CLI (`openclaw gateway`) — lancer, interroger et découvrir des Gateway
title: Gateway
x-i18n:
    generated_at: "2026-05-02T22:17:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: f7f948a8f0ee6e065afa02f354e690ad5cc4f71bdb8b8674f1b0396c439ab242
    source_path: cli/gateway.md
    workflow: 16
---

Le Gateway est le serveur WebSocket d’OpenClaw (canaux, nœuds, sessions, hooks). Les sous-commandes de cette page se trouvent sous `openclaw gateway …`.

<CardGroup cols={3}>
  <Card title="Découverte Bonjour" href="/fr/gateway/bonjour">
    Configuration mDNS locale + DNS-SD étendu.
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

Alias au premier plan :

```bash
openclaw gateway run
```

<AccordionGroup>
  <Accordion title="Comportement au démarrage">
    - Par défaut, le Gateway refuse de démarrer sauf si `gateway.mode=local` est défini dans `~/.openclaw/openclaw.json`. Utilisez `--allow-unconfigured` pour les exécutions ad hoc/dev.
    - `openclaw onboard --mode local` et `openclaw setup` sont censés écrire `gateway.mode=local`. Si le fichier existe mais que `gateway.mode` est absent, traitez cela comme une configuration cassée ou écrasée et réparez-la au lieu de supposer implicitement le mode local.
    - Si le fichier existe et que `gateway.mode` est absent, le Gateway considère cela comme une dégradation suspecte de la configuration et refuse de « deviner local » pour vous.
    - La liaison au-delà du loopback sans authentification est bloquée (garde-fou de sécurité).
    - `SIGUSR1` déclenche un redémarrage dans le processus lorsque c’est autorisé (`commands.restart` est activé par défaut ; définissez `commands.restart: false` pour bloquer le redémarrage manuel, tandis que l’application/mise à jour de l’outil/configuration gateway reste autorisée).
    - Les gestionnaires `SIGINT`/`SIGTERM` arrêtent le processus gateway, mais ils ne restaurent aucun état personnalisé du terminal. Si vous enveloppez la CLI avec une TUI ou une entrée en mode raw, restaurez le terminal avant de quitter.

  </Accordion>
</AccordionGroup>

### Options

<ParamField path="--port <port>" type="number">
  Port WebSocket (la valeur par défaut vient de la config/env ; généralement `18789`).
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
  Réinitialiser la configuration serve/funnel de Tailscale à l’arrêt.
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  Autoriser le démarrage du gateway sans `gateway.mode=local` dans la configuration. Contourne le garde de démarrage uniquement pour l’amorçage ad hoc/dev ; n’écrit ni ne répare le fichier de configuration.
</ParamField>
<ParamField path="--dev" type="boolean">
  Créer une config dev + un espace de travail si manquants (ignore BOOTSTRAP.md).
</ParamField>
<ParamField path="--reset" type="boolean">
  Réinitialiser la config dev + les identifiants + les sessions + l’espace de travail (nécessite `--dev`).
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
  Style des journaux WebSocket.
</ParamField>
<ParamField path="--compact" type="boolean">
  Alias pour `--ws-log compact`.
</ParamField>
<ParamField path="--raw-stream" type="boolean">
  Journaliser les événements bruts du flux de modèle en jsonl.
</ParamField>
<ParamField path="--raw-stream-path <path>" type="string">
  Chemin jsonl du flux brut.
</ParamField>

<Warning>
`--password` en ligne peut être exposé dans les listes de processus locales. Préférez `--password-file`, env ou un `gateway.auth.password` adossé à SecretRef.
</Warning>

### Profilage du démarrage

- Définissez `OPENCLAW_GATEWAY_STARTUP_TRACE=1` pour journaliser les temps des phases pendant le démarrage du Gateway, y compris le délai `eventLoopMax` par phase et les temps des tables de recherche de plugins pour l’index installé, le registre des manifestes, la planification du démarrage et le travail owner-map.
- Définissez `OPENCLAW_DIAGNOSTICS=timeline` avec `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>` pour écrire une chronologie de diagnostics de démarrage JSONL au mieux pour les harnais QA externes. Vous pouvez aussi activer l’indicateur avec `diagnostics.flags: ["timeline"]` dans la configuration ; le chemin est toujours fourni par l’environnement. Ajoutez `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` pour inclure des échantillons de boucle d’événements.
- Exécutez `pnpm test:startup:gateway -- --runs 5 --warmup 1` pour mesurer le démarrage du Gateway. Le benchmark enregistre la première sortie du processus, `/healthz`, `/readyz`, les temps de trace de démarrage, le délai de boucle d’événements et les détails de temps des tables de recherche de plugins.

## Interroger un Gateway en cours d’exécution

Toutes les commandes de requête utilisent RPC WebSocket.

<Tabs>
  <Tab title="Modes de sortie">
    - Par défaut : lisible par un humain (coloré en TTY).
    - `--json` : JSON lisible par une machine (sans style/spinner).
    - `--no-color` (ou `NO_COLOR=1`) : désactive ANSI tout en conservant la mise en page humaine.

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
Lorsque vous définissez `--url`, la CLI ne revient pas aux identifiants de configuration ou d’environnement. Passez explicitement `--token` ou `--password`. L’absence d’identifiants explicites est une erreur.
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

Le point de terminaison HTTP `/healthz` est une sonde de disponibilité : il répond dès que le serveur peut répondre en HTTP. Le point de terminaison HTTP `/readyz` est plus strict et reste rouge tant que les sidecars de plugins au démarrage, les canaux ou les hooks configurés sont encore en cours de stabilisation. Les réponses de disponibilité détaillées locales ou authentifiées incluent un bloc de diagnostic `eventLoop` avec le délai de boucle d’événements, l’utilisation de la boucle d’événements, le ratio des cœurs CPU et un indicateur `degraded`.

### `gateway usage-cost`

Récupérez les résumés des coûts d’utilisation depuis les journaux de session.

```bash
openclaw gateway usage-cost
openclaw gateway usage-cost --days 7
openclaw gateway usage-cost --json
```

<ParamField path="--days <days>" type="number" default="30">
  Nombre de jours à inclure.
</ParamField>

### `gateway stability`

Récupérez l’enregistreur récent de stabilité des diagnostics depuis un Gateway en cours d’exécution.

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
  Lire un bundle de stabilité persisté au lieu d’appeler le Gateway en cours d’exécution. Utilisez `--bundle latest` (ou simplement `--bundle`) pour le bundle le plus récent sous le répertoire d’état, ou passez directement le chemin JSON d’un bundle.
</ParamField>
<ParamField path="--export" type="boolean">
  Écrire un zip de diagnostics de support partageable au lieu d’imprimer les détails de stabilité.
</ParamField>
<ParamField path="--output <path>" type="string">
  Chemin de sortie pour `--export`.
</ParamField>

<AccordionGroup>
  <Accordion title="Confidentialité et comportement des bundles">
    - Les enregistrements conservent des métadonnées opérationnelles : noms d’événements, décomptes, tailles en octets, relevés mémoire, état des files/sessions, noms de canaux/plugins et résumés de sessions expurgés. Ils ne conservent pas le texte des discussions, les corps de Webhook, les sorties d’outils, les corps bruts des requêtes ou réponses, les jetons, les cookies, les valeurs secrètes, les noms d’hôtes ni les identifiants de session bruts. Définissez `diagnostics.enabled: false` pour désactiver entièrement l’enregistreur.
    - Lors des sorties fatales du Gateway, des délais d’arrêt dépassés et des échecs de démarrage après redémarrage, OpenClaw écrit le même instantané de diagnostic dans `~/.openclaw/logs/stability/openclaw-stability-*.json` lorsque l’enregistreur contient des événements. Inspectez le bundle le plus récent avec `openclaw gateway stability --bundle latest` ; `--limit`, `--type` et `--since-seq` s’appliquent aussi à la sortie du bundle.

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

Écrivez un zip de diagnostics local conçu pour être joint aux rapports de bug. Pour le modèle de confidentialité et le contenu du bundle, consultez [Export de diagnostics](/fr/gateway/diagnostics).

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  Chemin du zip de sortie. Par défaut, un export de support sous le répertoire d’état.
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
  Ignorer la recherche de bundle de stabilité persisté.
</ParamField>
<ParamField path="--json" type="boolean">
  Imprimer le chemin écrit, la taille et le manifeste en JSON.
</ParamField>

L’export contient un manifeste, un résumé Markdown, la forme de la configuration, des détails de configuration assainis, des résumés de journaux assainis, des instantanés assainis du statut/de la santé du Gateway et le bundle de stabilité le plus récent lorsqu’il existe.

Il est destiné à être partagé. Il conserve les détails opérationnels qui aident au débogage, comme les champs sûrs des journaux OpenClaw, les noms de sous-systèmes, les codes d’état, les durées, les modes configurés, les ports, les identifiants de plugins, les identifiants de fournisseurs, les paramètres de fonctionnalités non secrets et les messages de journal opérationnels expurgés. Il omet ou expurge le texte des discussions, les corps de Webhook, les sorties d’outils, les identifiants, les cookies, les identifiants de compte/message, le texte des prompts/instructions, les noms d’hôtes et les valeurs secrètes. Lorsqu’un message de style LogTape ressemble à du texte de payload utilisateur/discussion/outil, l’export conserve uniquement le fait qu’un message a été omis ainsi que son nombre d’octets.

### `gateway status`

`gateway status` affiche le service Gateway (launchd/systemd/schtasks) plus une sonde facultative de capacité de connectivité/authentification.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  Ajouter une cible de sonde explicite. Le distant configuré + localhost sont toujours sondés.
</ParamField>
<ParamField path="--token <token>" type="string">
  Authentification par jeton pour la sonde.
</ParamField>
<ParamField path="--password <password>" type="string">
  Authentification par mot de passe pour la sonde.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="10000">
  Délai de la sonde.
</ParamField>
<ParamField path="--no-probe" type="boolean">
  Ignorer la sonde de connectivité (vue service uniquement).
</ParamField>
<ParamField path="--deep" type="boolean">
  Analyser aussi les services au niveau système.
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  Promouvoir la sonde de connectivité par défaut en sonde de lecture et quitter avec un code non nul si cette sonde de lecture échoue. Ne peut pas être combiné avec `--no-probe`.
</ParamField>

<AccordionGroup>
  <Accordion title="Sémantique des statuts">
    - `gateway status` reste disponible pour les diagnostics même lorsque la configuration CLI locale est manquante ou invalide.
    - Par défaut, `gateway status` prouve l'état du service, la connexion WebSocket et la capacité d'authentification visible au moment de la négociation. Il ne prouve pas les opérations de lecture/écriture/administration.
    - Les sondes de diagnostic ne modifient rien pour l'authentification initiale d'un appareil : elles réutilisent un jeton d'appareil mis en cache lorsqu'il existe, mais elles ne créent pas une nouvelle identité d'appareil CLI ni un enregistrement d'appairage d'appareil en lecture seule uniquement pour vérifier le statut.
    - `gateway status` résout les SecretRefs d'authentification configurées pour l'authentification de sonde lorsque c'est possible.
    - Si une SecretRef d'authentification requise n'est pas résolue dans ce chemin de commande, `gateway status --json` signale `rpc.authWarning` lorsque la connectivité/l'authentification de sonde échoue ; passez explicitement `--token`/`--password` ou résolvez d'abord la source du secret.
    - Si la sonde réussit, les avertissements de référence d'authentification non résolue sont supprimés pour éviter les faux positifs.
    - Utilisez `--require-rpc` dans les scripts et l'automatisation lorsqu'un service à l'écoute ne suffit pas et que vous avez aussi besoin que les appels RPC avec portée de lecture soient sains.
    - `--deep` ajoute une analyse au mieux des installations launchd/systemd/schtasks supplémentaires. Lorsque plusieurs services de type gateway sont détectés, la sortie humaine affiche des indications de nettoyage et avertit que la plupart des configurations devraient exécuter un seul gateway par machine.
    - La sortie humaine inclut le chemin de journal de fichier résolu ainsi que l'instantané des chemins/validité de configuration CLI par rapport au service afin d'aider à diagnostiquer une dérive de profil ou de répertoire d'état.

  </Accordion>
  <Accordion title="Vérifications de dérive d'authentification systemd Linux">
    - Sur les installations systemd Linux, les vérifications de dérive d'authentification du service lisent les valeurs `Environment=` et `EnvironmentFile=` depuis l'unité (y compris `%h`, les chemins entre guillemets, les fichiers multiples et les fichiers optionnels avec `-`).
    - Les vérifications de dérive résolvent les SecretRefs `gateway.auth.token` avec l'environnement d'exécution fusionné (d'abord l'environnement de commande du service, puis l'environnement du processus en solution de repli).
    - Si l'authentification par jeton n'est pas effectivement active (mode `gateway.auth.mode` explicite défini sur `password`/`none`/`trusted-proxy`, ou mode non défini lorsque le mot de passe peut l'emporter et qu'aucun candidat jeton ne peut l'emporter), les vérifications de dérive de jeton ignorent la résolution du jeton de configuration.

  </Accordion>
</AccordionGroup>

### `gateway probe`

`gateway probe` est la commande « tout déboguer ». Elle sonde toujours :

- votre gateway distant configuré (s'il est défini), et
- localhost (local loopback) **même si un distant est configuré**.

Si vous passez `--url`, cette cible explicite est ajoutée avant les deux autres. La sortie humaine étiquette les cibles comme suit :

- `URL (explicit)`
- `Remote (configured)` ou `Remote (configured, inactive)`
- `Local loopback`

<Note>
Si plusieurs gateways sont accessibles, elle les affiche tous. Plusieurs gateways sont pris en charge lorsque vous utilisez des profils/ports isolés (par exemple, un bot de secours), mais la plupart des installations n'exécutent toujours qu'un seul gateway.
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
```

<AccordionGroup>
  <Accordion title="Interprétation">
    - `Reachable: yes` signifie qu'au moins une cible a accepté une connexion WebSocket.
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` signale ce que la sonde a pu prouver à propos de l'authentification. C'est distinct de l'accessibilité.
    - `Read probe: ok` signifie que les appels RPC de détail avec portée de lecture (`health`/`status`/`system-presence`/`config.get`) ont également réussi.
    - `Read probe: limited - missing scope: operator.read` signifie que la connexion a réussi, mais que le RPC avec portée de lecture est limité. Ceci est signalé comme une accessibilité **dégradée**, et non comme un échec complet.
    - `Read probe: failed` après `Connect: ok` signifie que le Gateway a accepté la connexion WebSocket, mais que les diagnostics de lecture de suivi ont expiré ou échoué. Ceci est aussi une accessibilité **dégradée**, et non un Gateway inaccessible.
    - Comme `gateway status`, la sonde réutilise l'authentification d'appareil mise en cache existante, mais ne crée pas d'identité d'appareil initiale ni d'état d'appairage.
    - Le code de sortie est non nul uniquement lorsqu'aucune cible sondée n'est accessible.

  </Accordion>
  <Accordion title="Sortie JSON">
    Niveau supérieur :

    - `ok` : au moins une cible est accessible.
    - `degraded` : au moins une cible a accepté une connexion, mais n'a pas terminé tous les diagnostics RPC détaillés.
    - `capability` : meilleure capacité observée parmi les cibles accessibles (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope` ou `unknown`).
    - `primaryTargetId` : meilleure cible à traiter comme gagnant actif dans cet ordre : URL explicite, tunnel SSH, distant configuré, puis local loopback.
    - `warnings[]` : enregistrements d'avertissement au mieux avec `code`, `message` et `targetIds` optionnels.
    - `network` : indications d'URL local loopback/tailnet dérivées de la configuration actuelle et de la mise en réseau de l'hôte.
    - `discovery.timeoutMs` et `discovery.count` : le budget de découverte réel et le nombre de résultats utilisés pour cette passe de sonde.

    Par cible (`targets[].connect`) :

    - `ok` : accessibilité après connexion + classification dégradée.
    - `rpcOk` : succès complet du RPC détaillé.
    - `scopeLimited` : échec du RPC détaillé en raison d'une portée opérateur manquante.

    Par cible (`targets[].auth`) :

    - `role` : rôle d'authentification signalé dans `hello-ok` lorsqu'il est disponible.
    - `scopes` : portées accordées signalées dans `hello-ok` lorsqu'elles sont disponibles.
    - `capability` : classification de capacité d'authentification exposée pour cette cible.

  </Accordion>
  <Accordion title="Codes d'avertissement courants">
    - `ssh_tunnel_failed` : échec de la configuration du tunnel SSH ; la commande est revenue aux sondes directes.
    - `multiple_gateways` : plusieurs cibles étaient accessibles ; c'est inhabituel sauf si vous exécutez intentionnellement des profils isolés, par exemple un bot de secours.
    - `auth_secretref_unresolved` : une SecretRef d'authentification configurée n'a pas pu être résolue pour une cible en échec.
    - `probe_scope_limited` : la connexion WebSocket a réussi, mais la sonde de lecture était limitée par l'absence de `operator.read`.

  </Accordion>
</AccordionGroup>

#### Distant via SSH (parité de l'application Mac)

Le mode « Remote over SSH » de l'application macOS utilise un transfert de port local afin que le gateway distant (qui peut être lié uniquement au loopback) devienne accessible à `ws://127.0.0.1:<port>`.

Équivalent CLI :

```bash
openclaw gateway probe --ssh user@gateway-host
```

<ParamField path="--ssh <target>" type="string">
  `user@host` ou `user@host:port` (le port par défaut est `22`).
</ParamField>
<ParamField path="--ssh-identity <path>" type="string">
  Fichier d'identité.
</ParamField>
<ParamField path="--ssh-auto" type="boolean">
  Choisit le premier hôte gateway découvert comme cible SSH à partir du point de terminaison de découverte résolu (`local.` plus le domaine longue portée configuré, le cas échéant). Les indications uniquement TXT sont ignorées.
</ParamField>

Configuration (optionnelle, utilisée comme valeur par défaut) :

- `gateway.remote.sshTarget`
- `gateway.remote.sshIdentity`

### `gateway call <method>`

Assistant RPC bas niveau.

```bash
openclaw gateway call status
openclaw gateway call logs.tail --params '{"sinceMs": 60000}'
```

<ParamField path="--params <json>" type="string" default="{}">
  Chaîne d'objet JSON pour les paramètres.
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
  Budget de délai d'expiration.
</ParamField>
<ParamField path="--expect-final" type="boolean">
  Principalement pour les RPC de type agent qui diffusent des événements intermédiaires avant une charge utile finale.
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

Utilisez `--wrapper` lorsque le service géré doit démarrer via un autre exécutable, par exemple un adaptateur de gestionnaire de secrets ou un assistant d'exécution en tant qu'autre utilisateur. Le wrapper reçoit les arguments Gateway normaux et est responsable d'exécuter finalement `openclaw` ou Node avec ces arguments.

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

Vous pouvez également définir le wrapper via l'environnement. `gateway install` vérifie que le chemin est un fichier exécutable, écrit le wrapper dans les `ProgramArguments` du service et conserve `OPENCLAW_WRAPPER` dans l'environnement du service pour les réinstallations forcées, les mises à jour et les réparations doctor ultérieures.

```bash
OPENCLAW_WRAPPER="$HOME/.local/bin/openclaw-doppler" openclaw gateway install --force
openclaw doctor
```

Pour supprimer un wrapper conservé, effacez `OPENCLAW_WRAPPER` pendant la réinstallation :

```bash
OPENCLAW_WRAPPER= openclaw gateway install --force
openclaw gateway restart
```

<AccordionGroup>
  <Accordion title="Options de commande">
    - `gateway status` : `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
    - `gateway install` : `--port`, `--runtime <node|bun>`, `--token`, `--wrapper <path>`, `--force`, `--json`
    - `gateway restart` : `--force`, `--wait <duration>`, `--json`
    - `gateway uninstall|start|stop` : `--json`

  </Accordion>
  <Accordion title="Comportement du cycle de vie">
    - Utilisez `gateway restart` pour redémarrer un service géré. N'enchaînez pas `gateway stop` et `gateway start` comme substitut de redémarrage ; sur macOS, `gateway stop` désactive intentionnellement le LaunchAgent avant de l'arrêter.
    - `gateway restart --wait 30s` remplace le budget de vidange de redémarrage configuré pour ce redémarrage. Les nombres nus sont des millisecondes ; les unités comme `s`, `m` et `h` sont acceptées. `--wait 0` attend indéfiniment.
    - `gateway restart --force` ignore la vidange du travail actif et redémarre immédiatement. Utilisez-le lorsqu'un opérateur a déjà inspecté les bloqueurs de tâches listés et veut récupérer le gateway maintenant.
    - Les commandes de cycle de vie acceptent `--json` pour les scripts.

  </Accordion>
  <Accordion title="Authentification et SecretRefs au moment de l'installation">
    - Lorsque l'authentification par jeton requiert un jeton et que `gateway.auth.token` est géré par SecretRef, `gateway install` vérifie que la SecretRef est résoluble, mais ne conserve pas le jeton résolu dans les métadonnées d'environnement du service.
    - Si l'authentification par jeton requiert un jeton et que la SecretRef de jeton configurée n'est pas résolue, l'installation échoue fermée au lieu de conserver un texte brut de repli.
    - Pour l'authentification par mot de passe sur `gateway run`, préférez `OPENCLAW_GATEWAY_PASSWORD`, `--password-file` ou un `gateway.auth.password` adossé à une SecretRef à un `--password` en ligne.
    - En mode d'authentification inféré, `OPENCLAW_GATEWAY_PASSWORD` uniquement shell n'assouplit pas les exigences de jeton à l'installation ; utilisez une configuration durable (`gateway.auth.password` ou `env` de configuration) lors de l'installation d'un service géré.
    - Si `gateway.auth.token` et `gateway.auth.password` sont tous deux configurés et que `gateway.auth.mode` n'est pas défini, l'installation est bloquée jusqu'à ce que le mode soit défini explicitement.

  </Accordion>
</AccordionGroup>

## Découvrir les gateways (Bonjour)

`gateway discover` recherche les balises Gateway (`_openclaw-gw._tcp`).

- DNS-SD multicast : `local.`
- DNS-SD unicast (Bonjour longue portée) : choisissez un domaine (exemple : `openclaw.internal.`) et configurez un DNS fractionné + un serveur DNS ; consultez [Bonjour](/fr/gateway/bonjour).

Seuls les gateways avec la découverte Bonjour activée (par défaut) annoncent la balise.

Les enregistrements de découverte longue portée incluent (TXT) :

- `role` (indication du rôle du gateway)
- `transport` (indication de transport, p. ex. `gateway`)
- `gatewayPort` (port WebSocket, généralement `18789`)
- `sshPort` (optionnel ; les clients utilisent par défaut `22` pour les cibles SSH lorsqu'il est absent)
- `tailnetDns` (nom d'hôte MagicDNS, lorsqu'il est disponible)
- `gatewayTls` / `gatewayTlsSha256` (TLS activé + empreinte du certificat)
- `cliPath` (indication d'installation distante écrite dans la zone longue portée)

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  Délai d’expiration par commande (parcourir/résoudre).
</ParamField>
<ParamField path="--json" type="boolean">
  Sortie lisible par machine (désactive également le style et l’indicateur d’activité).
</ParamField>

Exemples :

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

<Note>
- Le CLI analyse `local.` ainsi que le domaine étendu configuré lorsqu’il y en a un d’activé.
- `wsUrl` dans la sortie JSON est dérivé du point de terminaison de service résolu, et non d’indications uniquement TXT telles que `lanHost` ou `tailnetDns`.
- Sur mDNS `local.`, `sshPort` et `cliPath` ne sont diffusés que lorsque `discovery.mdns.mode` vaut `full`. DNS-SD étendu écrit toujours `cliPath` ; `sshPort` y reste également facultatif.

</Note>

## Associé

- [Référence CLI](/fr/cli)
- [Runbook du Gateway](/fr/gateway)
