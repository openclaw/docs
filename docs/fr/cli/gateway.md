---
read_when:
    - Exécuter la Gateway depuis la CLI (développement ou serveurs)
    - Déboguer l’authentification de la Gateway, les modes de liaison et la connectivité
    - Découvrir des Gateway via Bonjour (local + DNS-SD à large zone)
sidebarTitle: Gateway
summary: CLI OpenClaw Gateway (`openclaw gateway`) — exécuter, interroger et découvrir des Gateway
title: Gateway
x-i18n:
    generated_at: "2026-04-26T11:26:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: c8cdca95676f0b098e2dd79ff4245a32eaae82711ed6c2b7e39522331872cfd9
    source_path: cli/gateway.md
    workflow: 15
---

La Gateway est le serveur WebSocket d’OpenClaw (canaux, Node, sessions, hooks). Les sous-commandes de cette page se trouvent sous `openclaw gateway …`.

<CardGroup cols={3}>
  <Card title="Découverte Bonjour" href="/fr/gateway/bonjour">
    Configuration mDNS local + DNS-SD à large zone.
  </Card>
  <Card title="Vue d’ensemble de la découverte" href="/fr/gateway/discovery">
    Comment OpenClaw annonce et trouve des Gateway.
  </Card>
  <Card title="Configuration" href="/fr/gateway/configuration">
    Clés de configuration de niveau supérieur de la Gateway.
  </Card>
</CardGroup>

## Exécuter la Gateway

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
    - Par défaut, la Gateway refuse de démarrer sauf si `gateway.mode=local` est défini dans `~/.openclaw/openclaw.json`. Utilisez `--allow-unconfigured` pour des exécutions ad hoc/de développement.
    - `openclaw onboard --mode local` et `openclaw setup` sont censés écrire `gateway.mode=local`. Si le fichier existe mais que `gateway.mode` est absent, traitez cela comme une configuration cassée ou écrasée et réparez-la au lieu de supposer implicitement le mode local.
    - Si le fichier existe et que `gateway.mode` est absent, la Gateway considère cela comme un dommage suspect de configuration et refuse de « deviner le mode local » à votre place.
    - Une liaison au-delà du loopback sans authentification est bloquée (garde-fou de sécurité).
    - `SIGUSR1` déclenche un redémarrage en cours de processus lorsque cela est autorisé (`commands.restart` est activé par défaut ; définissez `commands.restart: false` pour bloquer le redémarrage manuel, tandis que l’application/mise à jour d’outil/configuration de la Gateway reste autorisée).
    - Les gestionnaires `SIGINT`/`SIGTERM` arrêtent le processus Gateway, mais ils ne restaurent pas d’état personnalisé du terminal. Si vous encapsulez la CLI avec une TUI ou une entrée en mode brut, restaurez le terminal avant la fermeture.
  </Accordion>
</AccordionGroup>

### Options

<ParamField path="--port <port>" type="number">
  Port WebSocket (la valeur par défaut vient de la config/de l’env ; généralement `18789`).
</ParamField>
<ParamField path="--bind <loopback|lan|tailnet|auto|custom>" type="string">
  Mode de liaison de l’écouteur.
</ParamField>
<ParamField path="--auth <token|password>" type="string">
  Remplacement du mode d’authentification.
</ParamField>
<ParamField path="--token <token>" type="string">
  Remplacement du token (définit aussi `OPENCLAW_GATEWAY_TOKEN` pour le processus).
</ParamField>
<ParamField path="--password <password>" type="string">
  Remplacement du mot de passe.
</ParamField>
<ParamField path="--password-file <path>" type="string">
  Lire le mot de passe de la Gateway depuis un fichier.
</ParamField>
<ParamField path="--tailscale <off|serve|funnel>" type="string">
  Exposer la Gateway via Tailscale.
</ParamField>
<ParamField path="--tailscale-reset-on-exit" type="boolean">
  Réinitialiser la configuration Tailscale serve/funnel à l’arrêt.
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  Autoriser le démarrage de la Gateway sans `gateway.mode=local` dans la configuration. Contourne la protection de démarrage uniquement pour l’initialisation ad hoc/de développement ; n’écrit ni ne répare le fichier de configuration.
</ParamField>
<ParamField path="--dev" type="boolean">
  Créer une configuration + un espace de travail de développement si absent (ignore BOOTSTRAP.md).
</ParamField>
<ParamField path="--reset" type="boolean">
  Réinitialiser la configuration de développement + identifiants + sessions + espace de travail (nécessite `--dev`).
</ParamField>
<ParamField path="--force" type="boolean">
  Tuer tout écouteur existant sur le port sélectionné avant le démarrage.
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
  Journaliser les événements bruts du flux de modèle dans un fichier jsonl.
</ParamField>
<ParamField path="--raw-stream-path <path>" type="string">
  Chemin du fichier jsonl de flux brut.
</ParamField>

<Warning>
Le `--password` en ligne peut être exposé dans les listes locales de processus. Préférez `--password-file`, l’environnement, ou un `gateway.auth.password` soutenu par SecretRef.
</Warning>

### Profilage du démarrage

- Définissez `OPENCLAW_GATEWAY_STARTUP_TRACE=1` pour journaliser les temps par phase pendant le démarrage de la Gateway.
- Exécutez `pnpm test:startup:gateway -- --runs 5 --warmup 1` pour benchmarker le démarrage de la Gateway. Le benchmark enregistre la première sortie du processus, `/healthz`, `/readyz`, et les temps de trace de démarrage.

## Interroger une Gateway en cours d’exécution

Toutes les commandes de requête utilisent WebSocket RPC.

<Tabs>
  <Tab title="Modes de sortie">
    - Par défaut : lisible par un humain (coloré dans un TTY).
    - `--json` : JSON lisible par machine (sans style/spinner).
    - `--no-color` (ou `NO_COLOR=1`) : désactiver ANSI tout en conservant la mise en page humaine.
  </Tab>
  <Tab title="Options partagées">
    - `--url <url>` : URL WebSocket de la Gateway.
    - `--token <token>` : token de la Gateway.
    - `--password <password>` : mot de passe de la Gateway.
    - `--timeout <ms>` : délai/budget (varie selon la commande).
    - `--expect-final` : attendre une réponse « finale » (appels d’agent).
  </Tab>
</Tabs>

<Note>
Lorsque vous définissez `--url`, la CLI ne revient pas aux identifiants de configuration ou d’environnement. Passez `--token` ou `--password` explicitement. L’absence d’identifiants explicites est une erreur.
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

Le point de terminaison HTTP `/healthz` est une sonde de vivacité : il répond dès que le serveur peut répondre en HTTP. Le point de terminaison HTTP `/readyz` est plus strict et reste rouge tant que les sidecars de démarrage, les canaux, ou les hooks configurés ne sont pas encore stabilisés.

### `gateway usage-cost`

Récupérer des résumés de coût d’usage à partir des journaux de session.

```bash
openclaw gateway usage-cost
openclaw gateway usage-cost --days 7
openclaw gateway usage-cost --json
```

<ParamField path="--days <days>" type="number" default="30">
  Nombre de jours à inclure.
</ParamField>

### `gateway stability`

Récupérer l’enregistreur récent de stabilité diagnostique depuis une Gateway en cours d’exécution.

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
  Filtrer par type d’événement diagnostique, tel que `payload.large` ou `diagnostic.memory.pressure`.
</ParamField>
<ParamField path="--since-seq <seq>" type="number">
  Inclure uniquement les événements après un numéro de séquence diagnostique.
</ParamField>
<ParamField path="--bundle [path]" type="string">
  Lire un bundle de stabilité persisté au lieu d’appeler la Gateway en cours d’exécution. Utilisez `--bundle latest` (ou simplement `--bundle`) pour le bundle le plus récent sous le répertoire d’état, ou passez directement un chemin JSON de bundle.
</ParamField>
<ParamField path="--export" type="boolean">
  Écrire un zip de diagnostic de support partageable au lieu d’afficher les détails de stabilité.
</ParamField>
<ParamField path="--output <path>" type="string">
  Chemin de sortie pour `--export`.
</ParamField>

<AccordionGroup>
  <Accordion title="Confidentialité et comportement des bundles">
    - Les enregistrements conservent des métadonnées opérationnelles : noms d’événements, comptes, tailles en octets, relevés mémoire, état de file/session, noms de canal/plugin, et résumés de session expurgés. Ils ne conservent pas le texte des conversations, les corps de Webhook, les sorties d’outil, les corps bruts de requête ou de réponse, les tokens, les cookies, les valeurs secrètes, les noms d’hôte, ni les ids de session bruts. Définissez `diagnostics.enabled: false` pour désactiver complètement l’enregistreur.
    - Lors des sorties fatales de la Gateway, des expirations de délai à l’arrêt, et des échecs de démarrage après redémarrage, OpenClaw écrit le même instantané diagnostique dans `~/.openclaw/logs/stability/openclaw-stability-*.json` lorsque l’enregistreur contient des événements. Inspectez le bundle le plus récent avec `openclaw gateway stability --bundle latest` ; `--limit`, `--type`, et `--since-seq` s’appliquent aussi à la sortie bundle.
  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

Écrire un zip de diagnostic local conçu pour être joint à des rapports de bug. Pour le modèle de confidentialité et le contenu du bundle, voir [Export de diagnostics](/fr/gateway/diagnostics).

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
  URL WebSocket de la Gateway pour l’instantané d’état de santé.
</ParamField>
<ParamField path="--token <token>" type="string">
  Token de la Gateway pour l’instantané d’état de santé.
</ParamField>
<ParamField path="--password <password>" type="string">
  Mot de passe de la Gateway pour l’instantané d’état de santé.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="3000">
  Délai d’attente de l’instantané d’état/santé.
</ParamField>
<ParamField path="--no-stability-bundle" type="boolean">
  Ignorer la recherche du bundle de stabilité persisté.
</ParamField>
<ParamField path="--json" type="boolean">
  Afficher le chemin écrit, la taille, et le manifeste en JSON.
</ParamField>

L’export contient un manifeste, un résumé Markdown, la forme de la configuration, des détails de configuration assainis, des résumés de journaux assainis, des instantanés assainis du statut/de la santé de la Gateway, ainsi que le bundle de stabilité le plus récent lorsqu’il existe.

Il est destiné à être partagé. Il conserve des détails opérationnels utiles au débogage, comme les champs sûrs des journaux OpenClaw, les noms de sous-systèmes, les codes d’état, les durées, les modes configurés, les ports, les ids de Plugin, les ids de fournisseur, les réglages de fonctionnalité non secrets, et les messages de journal opérationnels expurgés. Il omet ou expurge le texte des conversations, les corps de Webhook, les sorties d’outil, les identifiants, les cookies, les identifiants de compte/message, le texte des prompts/instructions, les noms d’hôte, et les valeurs secrètes. Lorsqu’un message de style LogTape ressemble à du texte de payload utilisateur/conversation/outil, l’export ne conserve que le fait qu’un message a été omis ainsi que son nombre d’octets.

### `gateway status`

`gateway status` affiche le service Gateway (launchd/systemd/schtasks) ainsi qu’une sonde optionnelle de connectivité/capacité d’authentification.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  Ajouter une cible de sonde explicite. Les cibles distantes configurées + localhost sont toujours sondées.
</ParamField>
<ParamField path="--token <token>" type="string">
  Authentification par token pour la sonde.
</ParamField>
<ParamField path="--password <password>" type="string">
  Authentification par mot de passe pour la sonde.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="10000">
  Délai d’attente de la sonde.
</ParamField>
<ParamField path="--no-probe" type="boolean">
  Ignorer la sonde de connectivité (vue service uniquement).
</ParamField>
<ParamField path="--deep" type="boolean">
  Analyser aussi les services au niveau système.
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  Faire passer la sonde de connectivité par défaut à une sonde de lecture et renvoyer un code de sortie non nul si cette sonde de lecture échoue. Ne peut pas être combiné avec `--no-probe`.
</ParamField>

<AccordionGroup>
  <Accordion title="Sémantique du statut">
    - `gateway status` reste disponible pour le diagnostic même lorsque la configuration locale de la CLI est absente ou invalide.
    - Par défaut, `gateway status` prouve l’état du service, la connexion WebSocket, et la capacité d’authentification visible au moment de la poignée de main. Il ne prouve pas les opérations de lecture/écriture/admin.
    - Les sondes de diagnostic sont non mutatives pour l’authentification initiale d’un appareil : elles réutilisent un token d’appareil mis en cache existant lorsqu’il existe, mais elles ne créent pas une nouvelle identité d’appareil CLI ni un enregistrement d’appairage d’appareil en lecture seule juste pour vérifier le statut.
    - `gateway status` résout les SecretRef d’authentification configurés pour l’authentification de la sonde lorsque cela est possible.
    - Si un SecretRef d’authentification requis n’est pas résolu dans ce chemin de commande, `gateway status --json` rapporte `rpc.authWarning` lorsque la connectivité/authentification de la sonde échoue ; passez `--token`/`--password` explicitement ou résolvez d’abord la source du secret.
    - Si la sonde réussit, les avertissements d’auth-ref non résolus sont supprimés pour éviter les faux positifs.
    - Utilisez `--require-rpc` dans les scripts et automatisations lorsqu’un service à l’écoute ne suffit pas et que vous avez aussi besoin d’appels RPC de portée lecture en bon état.
    - `--deep` ajoute une analyse best-effort des installations launchd/systemd/schtasks supplémentaires. Lorsque plusieurs services de type gateway sont détectés, la sortie lisible par un humain affiche des conseils de nettoyage et avertit que la plupart des configurations ne devraient exécuter qu’une seule Gateway par machine.
    - La sortie lisible par un humain inclut le chemin résolu du journal de fichier ainsi qu’un instantané des chemins/de la validité de configuration CLI-vs-service afin d’aider à diagnostiquer les dérives de profil ou de répertoire d’état.
  </Accordion>
  <Accordion title="Vérifications de dérive d’authentification Linux systemd">
    - Sur les installations Linux systemd, les vérifications de dérive d’authentification du service lisent à la fois les valeurs `Environment=` et `EnvironmentFile=` depuis l’unité (y compris `%h`, chemins entre guillemets, fichiers multiples, et fichiers facultatifs `-`).
    - Les vérifications de dérive résolvent les SecretRef `gateway.auth.token` en utilisant l’environnement d’exécution fusionné (environnement de commande du service d’abord, puis repli sur l’environnement du processus).
    - Si l’authentification par token n’est pas effectivement active (mode `gateway.auth.mode` explicite `password`/`none`/`trusted-proxy`, ou mode non défini où le mot de passe peut l’emporter et où aucun candidat token ne peut l’emporter), les vérifications de dérive du token ignorent la résolution du token de configuration.
  </Accordion>
</AccordionGroup>

### `gateway probe`

`gateway probe` est la commande « tout déboguer ». Elle sonde toujours :

- votre Gateway distante configurée (si définie), et
- localhost (loopback) **même si une Gateway distante est configurée**.

Si vous passez `--url`, cette cible explicite est ajoutée avant les deux autres. La sortie lisible par un humain étiquette les cibles comme suit :

- `URL (explicite)`
- `Remote (configured)` ou `Remote (configured, inactive)`
- `Local loopback`

<Note>
Si plusieurs Gateway sont joignables, elles sont toutes affichées. Plusieurs Gateway sont prises en charge lorsque vous utilisez des profils/ports isolés (par ex. un bot de secours), mais la plupart des installations n’exécutent toujours qu’une seule Gateway.
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
```

<AccordionGroup>
  <Accordion title="Interprétation">
    - `Reachable: yes` signifie qu’au moins une cible a accepté une connexion WebSocket.
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` indique ce que la sonde a pu prouver concernant l’authentification. C’est distinct de la joignabilité.
    - `Read probe: ok` signifie que les appels RPC de détail à portée lecture (`health`/`status`/`system-presence`/`config.get`) ont également réussi.
    - `Read probe: limited - missing scope: operator.read` signifie que la connexion a réussi mais que le RPC de portée lecture est limité. Cela est signalé comme une joignabilité **dégradée**, et non comme un échec complet.
    - Comme `gateway status`, la sonde réutilise l’authentification d’appareil mise en cache existante mais ne crée pas d’identité d’appareil initiale ni d’état d’appairage.
    - Le code de sortie n’est non nul que lorsqu’aucune cible sondée n’est joignable.
  </Accordion>
  <Accordion title="Sortie JSON">
    Niveau supérieur :

    - `ok` : au moins une cible est joignable.
    - `degraded` : au moins une cible a eu un RPC de détail limité par sa portée.
    - `capability` : meilleure capacité observée parmi les cibles joignables (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope`, ou `unknown`).
    - `primaryTargetId` : meilleure cible à traiter comme gagnante active dans cet ordre : URL explicite, tunnel SSH, distant configuré, puis loopback local.
    - `warnings[]` : enregistrements d’avertissement best-effort avec `code`, `message`, et `targetIds` facultatifs.
    - `network` : indices d’URL local loopback/tailnet dérivés de la configuration actuelle et du réseau de l’hôte.
    - `discovery.timeoutMs` et `discovery.count` : budget/résultat réel de découverte utilisé pour ce passage de sonde.

    Par cible (`targets[].connect`) :

    - `ok` : joignabilité après connexion + classification dégradée.
    - `rpcOk` : succès complet du RPC de détail.
    - `scopeLimited` : échec du RPC de détail dû à l’absence de portée operator.

    Par cible (`targets[].auth`) :

    - `role` : rôle d’authentification signalé dans `hello-ok` lorsqu’il est disponible.
    - `scopes` : portées accordées signalées dans `hello-ok` lorsqu’elles sont disponibles.
    - `capability` : classification de capacité d’authentification exposée pour cette cible.

  </Accordion>
  <Accordion title="Codes d’avertissement courants">
    - `ssh_tunnel_failed` : l’établissement du tunnel SSH a échoué ; la commande a basculé vers des sondes directes.
    - `multiple_gateways` : plus d’une cible était joignable ; c’est inhabituel sauf si vous exécutez intentionnellement des profils isolés, comme un bot de secours.
    - `auth_secretref_unresolved` : un SecretRef d’authentification configuré n’a pas pu être résolu pour une cible en échec.
    - `probe_scope_limited` : la connexion WebSocket a réussi, mais la sonde de lecture a été limitée par l’absence de `operator.read`.
  </Accordion>
</AccordionGroup>

#### Distant via SSH (parité avec l’app Mac)

Le mode « Remote over SSH » de l’app macOS utilise un transfert de port local afin que la Gateway distante (qui peut n’être liée qu’au loopback) soit joignable à `ws://127.0.0.1:<port>`.

Équivalent CLI :

```bash
openclaw gateway probe --ssh user@gateway-host
```

<ParamField path="--ssh <target>" type="string">
  `user@host` ou `user@host:port` (le port vaut par défaut `22`).
</ParamField>
<ParamField path="--ssh-identity <path>" type="string">
  Fichier d’identité.
</ParamField>
<ParamField path="--ssh-auto" type="boolean">
  Choisir le premier hôte Gateway découvert comme cible SSH à partir du point de terminaison de découverte résolu (`local.` plus le domaine à large zone configuré, le cas échéant). Les indices TXT-only sont ignorés.
</ParamField>

Configuration (facultative, utilisée comme valeur par défaut) :

- `gateway.remote.sshTarget`
- `gateway.remote.sshIdentity`

### `gateway call <method>`

Aide RPC de bas niveau.

```bash
openclaw gateway call status
openclaw gateway call logs.tail --params '{"sinceMs": 60000}'
```

<ParamField path="--params <json>" type="string" default="{}">
  Chaîne d’objet JSON pour les paramètres.
</ParamField>
<ParamField path="--url <url>" type="string">
  URL WebSocket de la Gateway.
</ParamField>
<ParamField path="--token <token>" type="string">
  Token de la Gateway.
</ParamField>
<ParamField path="--password <password>" type="string">
  Mot de passe de la Gateway.
</ParamField>
<ParamField path="--timeout <ms>" type="number">
  Budget de délai d’attente.
</ParamField>
<ParamField path="--expect-final" type="boolean">
  Principalement pour les RPC de style agent qui diffusent des événements intermédiaires avant un payload final.
</ParamField>
<ParamField path="--json" type="boolean">
  Sortie JSON lisible par machine.
</ParamField>

<Note>
`--params` doit être un JSON valide.
</Note>

## Gérer le service Gateway

```bash
openclaw gateway install
openclaw gateway start
openclaw gateway stop
openclaw gateway restart
openclaw gateway uninstall
```

<AccordionGroup>
  <Accordion title="Options de commande">
    - `gateway status` : `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
    - `gateway install` : `--port`, `--runtime <node|bun>`, `--token`, `--force`, `--json`
    - `gateway uninstall|start|stop|restart` : `--json`
  </Accordion>
  <Accordion title="Notes sur l’installation et le cycle de vie du service">
    - `gateway install` prend en charge `--port`, `--runtime`, `--token`, `--force`, `--json`.
    - Utilisez `gateway restart` pour redémarrer un service géré. N’enchaînez pas `gateway stop` et `gateway start` comme substitut de redémarrage ; sur macOS, `gateway stop` désactive intentionnellement le LaunchAgent avant de l’arrêter.
    - Lorsque l’authentification par token exige un token et que `gateway.auth.token` est géré par SecretRef, `gateway install` valide que le SecretRef est résoluble mais ne persiste pas le token résolu dans les métadonnées d’environnement du service.
    - Si l’authentification par token exige un token et que le SecretRef de token configuré n’est pas résolu, l’installation échoue en mode fermé au lieu de persister un texte brut de repli.
    - Pour l’authentification par mot de passe sur `gateway run`, préférez `OPENCLAW_GATEWAY_PASSWORD`, `--password-file`, ou un `gateway.auth.password` soutenu par SecretRef plutôt qu’un `--password` en ligne.
    - En mode d’authentification inféré, `OPENCLAW_GATEWAY_PASSWORD` limité au shell n’assouplit pas les exigences de token à l’installation ; utilisez une configuration durable (`gateway.auth.password` ou `env` de configuration) lors de l’installation d’un service géré.
    - Si `gateway.auth.token` et `gateway.auth.password` sont tous deux configurés et que `gateway.auth.mode` n’est pas défini, l’installation est bloquée jusqu’à ce que le mode soit explicitement défini.
    - Les commandes de cycle de vie acceptent `--json` pour les scripts.
  </Accordion>
</AccordionGroup>

## Découvrir des Gateway (Bonjour)

`gateway discover` analyse les balises Gateway (`_openclaw-gw._tcp`).

- Multicast DNS-SD : `local.`
- Unicast DNS-SD (Wide-Area Bonjour) : choisissez un domaine (exemple : `openclaw.internal.`) et configurez un split DNS + un serveur DNS ; voir [Bonjour](/fr/gateway/bonjour).

Seules les Gateway avec la découverte Bonjour activée (par défaut) annoncent la balise.

Les enregistrements de découverte Wide-Area incluent (TXT) :

- `role` (indice de rôle de Gateway)
- `transport` (indice de transport, par ex. `gateway`)
- `gatewayPort` (port WebSocket, généralement `18789`)
- `sshPort` (facultatif ; les clients utilisent `22` par défaut lorsqu’il est absent)
- `tailnetDns` (nom d’hôte MagicDNS, lorsqu’il est disponible)
- `gatewayTls` / `gatewayTlsSha256` (TLS activé + empreinte du certificat)
- `cliPath` (indice d’installation distante écrit dans la zone à large zone)

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  Délai d’attente par commande (browse/resolve).
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
- La CLI analyse `local.` plus le domaine à large zone configuré lorsqu’il est activé.
- `wsUrl` dans la sortie JSON est dérivé du point de terminaison de service résolu, et non d’indices TXT-only comme `lanHost` ou `tailnetDns`.
- Sur le mDNS `local.`, `sshPort` et `cliPath` ne sont diffusés que lorsque `discovery.mdns.mode` vaut `full`. Le DNS-SD Wide-Area écrit quand même `cliPath` ; `sshPort` y reste également facultatif.
</Note>

## Associé

- [Référence CLI](/fr/cli)
- [Guide opérationnel de la Gateway](/fr/gateway)
