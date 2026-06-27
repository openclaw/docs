---
read_when:
    - Connecter Codex, Claude Code ou un autre client MCP à des canaux adossés à OpenClaw
    - Exécution de `openclaw mcp serve`
    - Gestion des définitions de serveurs MCP enregistrées par OpenClaw
sidebarTitle: MCP
summary: Exposer les conversations de canaux OpenClaw via MCP et gérer les définitions enregistrées de serveurs MCP
title: MCP
x-i18n:
    generated_at: "2026-06-27T17:19:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f2bf7050a3a712f761e3008c978f14a7576c9c6fa69d139894acbdcc0f20894b
    source_path: cli/mcp.md
    workflow: 16
---

`openclaw mcp` a deux rôles :

- exécuter OpenClaw comme serveur MCP avec `openclaw mcp serve`
- gérer les définitions de serveurs MCP sortants gérées par OpenClaw avec `list`, `show`, `status`, `doctor`, `probe`, `add`, `set`, `configure`, `tools`, `login`, `logout`, `reload` et `unset`

Autrement dit :

- `serve` correspond à OpenClaw agissant comme serveur MCP
- les autres sous-commandes correspondent à OpenClaw agissant comme registre côté client MCP pour les serveurs MCP que ses runtimes pourront consommer ultérieurement

<Note>
  `list`, `show`, `set` et `unset` lisent et écrivent uniquement les entrées `mcp.servers` gérées par OpenClaw dans la configuration OpenClaw. Elles n’incluent pas les serveurs mcporter de `config/mcporter.json` ; utilisez `mcporter list` pour ce registre.
</Note>

Utilisez [`openclaw acp`](/fr/cli/acp) quand OpenClaw doit héberger lui-même une session de harnais de codage et router ce runtime via ACP.

## Choisir le bon chemin MCP

OpenClaw dispose de plusieurs surfaces MCP. Choisissez celle qui correspond à l’entité qui possède le runtime d’agent et à celle qui possède les outils.

| Objectif                                                            | Utiliser                                                             | Pourquoi                                                                                                       |
| ------------------------------------------------------------------- | -------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Permettre à un client MCP externe de lire/envoyer des conversations de canal OpenClaw | `openclaw mcp serve`                                                 | OpenClaw est le serveur MCP et expose les conversations adossées au Gateway via stdio.                         |
| Enregistrer des serveurs MCP tiers pour les exécutions d’agents gérées par OpenClaw | `openclaw mcp add`, `set`, `configure`, `tools`, `login`             | OpenClaw est le registre côté client MCP et projette ensuite ces serveurs dans les runtimes éligibles.         |
| Vérifier un serveur enregistré sans exécuter un tour d’agent        | `openclaw mcp status`, `doctor`, `probe`                             | `status` et `doctor` inspectent la configuration ; `probe` ouvre une connexion MCP active et liste les capacités. |
| Modifier la configuration MCP depuis un navigateur                  | Control UI `/mcp`                                                    | La page affiche l’inventaire, l’activation, les résumés OAuth/filtres, les indications de commandes et un éditeur `mcp` limité au périmètre. |
| Donner au serveur d’application Codex un serveur MCP natif limité au périmètre | `mcp.servers.<name>.codex`                                           | Le bloc `codex` n’affecte que la projection des threads du serveur d’application Codex et est retiré avant la remise à la configuration native. |
| Exécuter des sessions de harnais hébergées par ACP                  | [`openclaw acp`](/fr/cli/acp) et [Agents ACP](/fr/tools/acp-agents-setup) | Le mode pont ACP n’accepte pas l’injection de serveur MCP par session ; configurez plutôt les ponts Gateway/Plugin. |

<Tip>
Si vous ne savez pas quel chemin utiliser, commencez par `openclaw mcp status --verbose`. Cette commande montre ce qu’OpenClaw a enregistré sans démarrer de serveurs MCP.
</Tip>

## OpenClaw comme serveur MCP

C’est le chemin `openclaw mcp serve`.

### Quand utiliser `serve`

Utilisez `openclaw mcp serve` quand :

- Codex, Claude Code ou un autre client MCP doit communiquer directement avec des conversations de canal adossées à OpenClaw
- vous avez déjà un Gateway OpenClaw local ou distant avec des sessions routées
- vous voulez un seul serveur MCP qui fonctionne avec les backends de canaux d’OpenClaw au lieu d’exécuter des ponts séparés par canal

Utilisez plutôt [`openclaw acp`](/fr/cli/acp) quand OpenClaw doit héberger lui-même le runtime de codage et conserver la session d’agent dans OpenClaw.

### Fonctionnement

`openclaw mcp serve` démarre un serveur MCP stdio. Le client MCP possède ce processus. Tant que le client maintient la session stdio ouverte, le pont se connecte à un Gateway OpenClaw local ou distant via WebSocket et expose les conversations de canal routées via MCP.

<Steps>
  <Step title="Client spawns the bridge">
    Le client MCP lance `openclaw mcp serve`.
  </Step>
  <Step title="Bridge connects to Gateway">
    Le pont se connecte au Gateway OpenClaw via WebSocket.
  </Step>
  <Step title="Sessions become MCP conversations">
    Les sessions routées deviennent des conversations MCP et des outils de transcription/historique.
  </Step>
  <Step title="Live events queue">
    Les événements en direct sont mis en file d’attente en mémoire pendant que le pont est connecté.
  </Step>
  <Step title="Optional Claude push">
    Si le mode canal Claude est activé, la même session peut aussi recevoir des notifications push propres à Claude.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Important behavior">
    - l’état de la file en direct commence lorsque le pont se connecte
    - l’historique de transcription plus ancien est lu avec `messages_read`
    - les notifications push Claude n’existent que tant que la session MCP est active
    - lorsque le client se déconnecte, le pont se ferme et la file en direct disparaît
    - les points d’entrée d’agent ponctuels comme `openclaw agent` et `openclaw infer model run` retirent tous les runtimes MCP intégrés qu’ils ouvrent lorsque la réponse est terminée, afin que les exécutions scriptées répétées n’accumulent pas de processus enfants MCP stdio
    - les serveurs MCP stdio lancés par OpenClaw (intégrés ou configurés par l’utilisateur) sont arrêtés comme arbre de processus à l’arrêt, afin que les sous-processus enfants démarrés par le serveur ne survivent pas après la sortie du client stdio parent
    - la suppression ou la réinitialisation d’une session libère les clients MCP de cette session via le chemin de nettoyage de runtime partagé, afin qu’aucune connexion stdio persistante ne reste liée à une session supprimée

  </Accordion>
</AccordionGroup>

### Choisir un mode client

Utilisez le même pont de deux manières différentes :

<Tabs>
  <Tab title="Generic MCP clients">
    Outils MCP standard uniquement. Utilisez `conversations_list`, `messages_read`, `events_poll`, `events_wait`, `messages_send` et les outils d’approbation.
  </Tab>
  <Tab title="Claude Code">
    Outils MCP standard plus l’adaptateur de canal propre à Claude. Activez `--claude-channel-mode on` ou conservez la valeur par défaut `auto`.
  </Tab>
</Tabs>

<Note>
Aujourd’hui, `auto` se comporte comme `on`. Il n’y a pas encore de détection des capacités du client.
</Note>

### Ce que `serve` expose

Le pont utilise les métadonnées de route de session Gateway existantes pour exposer les conversations adossées aux canaux. Une conversation apparaît lorsqu’OpenClaw dispose déjà d’un état de session avec une route connue, par exemple :

- `channel`
- métadonnées de destinataire ou de destination
- `accountId` facultatif
- `threadId` facultatif

Cela donne aux clients MCP un seul endroit pour :

- lister les conversations routées récentes
- lire l’historique de transcription récent
- attendre de nouveaux événements entrants
- envoyer une réponse via la même route
- voir les demandes d’approbation qui arrivent pendant que le pont est connecté

### Utilisation

<Tabs>
  <Tab title="Local Gateway">
    ```bash
    openclaw mcp serve
    ```
  </Tab>
  <Tab title="Remote Gateway (token)">
    ```bash
    openclaw mcp serve --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token
    ```
  </Tab>
  <Tab title="Remote Gateway (password)">
    ```bash
    openclaw mcp serve --url wss://gateway-host:18789 --password-file ~/.openclaw/gateway.password
    ```
  </Tab>
  <Tab title="Verbose / Claude off">
    ```bash
    openclaw mcp serve --verbose
    openclaw mcp serve --claude-channel-mode off
    ```
  </Tab>
</Tabs>

### Outils du pont

Le pont actuel expose ces outils MCP :

<AccordionGroup>
  <Accordion title="conversations_list">
    Liste les conversations récentes adossées à des sessions qui disposent déjà de métadonnées de route dans l’état de session Gateway.

    Filtres utiles :

    - `limit`
    - `search`
    - `channel`
    - `includeDerivedTitles`
    - `includeLastMessage`

  </Accordion>
  <Accordion title="conversation_get">
    Renvoie une conversation par `session_key` à l’aide d’une recherche directe de session Gateway.
  </Accordion>
  <Accordion title="messages_read">
    Lit les messages de transcription récents pour une conversation adossée à une session.
  </Accordion>
  <Accordion title="attachments_fetch">
    Extrait les blocs de contenu non textuels d’un message de transcription. Il s’agit d’une vue de métadonnées sur le contenu de transcription, pas d’un magasin durable autonome de blobs de pièces jointes.
  </Accordion>
  <Accordion title="events_poll">
    Lit les événements en direct mis en file d’attente depuis un curseur numérique.
  </Accordion>
  <Accordion title="events_wait">
    Effectue un long polling jusqu’à ce que le prochain événement en file correspondant arrive ou qu’un délai d’expiration soit atteint.

    Utilisez ceci lorsqu’un client MCP générique a besoin d’une livraison quasi temps réel sans protocole push propre à Claude.

  </Accordion>
  <Accordion title="messages_send">
    Envoie du texte via la même route déjà enregistrée sur la session.

    Comportement actuel :

    - nécessite une route de conversation existante
    - utilise le canal, le destinataire, l’identifiant de compte et l’identifiant de thread de la session
    - envoie uniquement du texte

  </Accordion>
  <Accordion title="permissions_list_open">
    Liste les demandes d’approbation exec/Plugin en attente que le pont a observées depuis sa connexion au Gateway.
  </Accordion>
  <Accordion title="permissions_respond">
    Résout une demande d’approbation exec/Plugin en attente avec :

    - `allow-once`
    - `allow-always`
    - `deny`

  </Accordion>
</AccordionGroup>

### Modèle d’événements

Le pont conserve une file d’événements en mémoire pendant qu’il est connecté.

Types d’événements actuels :

- `message`
- `exec_approval_requested`
- `exec_approval_resolved`
- `plugin_approval_requested`
- `plugin_approval_resolved`
- `claude_permission_request`

<Warning>
- la file est uniquement en direct ; elle démarre lorsque le pont MCP démarre
- `events_poll` et `events_wait` ne rejouent pas par eux-mêmes l’ancien historique Gateway
- le retard durable doit être lu avec `messages_read`

</Warning>

### Notifications de canal Claude

Le pont peut aussi exposer des notifications de canal propres à Claude. C’est l’équivalent OpenClaw d’un adaptateur de canal Claude Code : les outils MCP standard restent disponibles, mais les messages entrants en direct peuvent aussi arriver sous forme de notifications MCP propres à Claude.

<Tabs>
  <Tab title="off">
    `--claude-channel-mode off` : outils MCP standard uniquement.
  </Tab>
  <Tab title="on">
    `--claude-channel-mode on` : active les notifications de canal Claude.
  </Tab>
  <Tab title="auto (default)">
    `--claude-channel-mode auto` : valeur par défaut actuelle ; même comportement de pont que `on`.
  </Tab>
</Tabs>

Lorsque le mode canal Claude est activé, le serveur annonce les capacités expérimentales Claude et peut émettre :

- `notifications/claude/channel`
- `notifications/claude/channel/permission`

Comportement actuel du pont :

- les messages de transcription entrants `user` sont transférés sous forme de `notifications/claude/channel`
- les demandes d’autorisation Claude reçues via MCP sont suivies en mémoire
- si la conversation liée envoie ensuite `yes abcde` ou `no abcde`, le pont convertit cela en `notifications/claude/channel/permission`
- ces notifications sont limitées à la session en direct ; si le client MCP se déconnecte, il n’y a plus de cible push

C’est intentionnellement propre au client. Les clients MCP génériques doivent s’appuyer sur les outils de polling standard.

### Configuration du client MCP

Exemple de configuration de client stdio :

```json
{
  "mcpServers": {
    "openclaw": {
      "command": "openclaw",
      "args": [
        "mcp",
        "serve",
        "--url",
        "wss://gateway-host:18789",
        "--token-file",
        "/path/to/gateway.token"
      ]
    }
  }
}
```

Pour la plupart des clients MCP génériques, commencez par la surface d’outils standard et ignorez le mode Claude. Activez le mode Claude uniquement pour les clients qui comprennent réellement les méthodes de notification propres à Claude.

### Options

`openclaw mcp serve` prend en charge :

<ParamField path="--url" type="string">
  URL WebSocket du Gateway.
</ParamField>
<ParamField path="--token" type="string">
  Jeton du Gateway.
</ParamField>
<ParamField path="--token-file" type="string">
  Lire le jeton depuis un fichier.
</ParamField>
<ParamField path="--password" type="string">
  Mot de passe du Gateway.
</ParamField>
<ParamField path="--password-file" type="string">
  Lire le mot de passe depuis un fichier.
</ParamField>
<ParamField path="--claude-channel-mode" type='"auto" | "on" | "off"'>
  Mode de notification Claude.
</ParamField>
<ParamField path="-v, --verbose" type="boolean">
  Journaux détaillés sur stderr.
</ParamField>

<Tip>
Préférez `--token-file` ou `--password-file` aux secrets en ligne lorsque c’est possible.
</Tip>

### Sécurité et limite de confiance

Le bridge n’invente pas le routage. Il expose uniquement les conversations que le Gateway sait déjà router.

Cela signifie que :

- les listes d’autorisation des expéditeurs, l’appairage et la confiance au niveau du canal relèvent toujours de la configuration du canal OpenClaw sous-jacent
- `messages_send` ne peut répondre que via une route stockée existante
- l’état d’approbation est en direct/en mémoire uniquement pour la session de bridge actuelle
- l’authentification du bridge doit utiliser les mêmes contrôles de jeton ou de mot de passe du Gateway que ceux auxquels vous feriez confiance pour tout autre client Gateway distant

Si une conversation est absente de `conversations_list`, la cause habituelle n’est pas la configuration MCP. Il manque des métadonnées de route, ou elles sont incomplètes, dans la session Gateway sous-jacente.

### Tests

OpenClaw fournit un test de fumée Docker déterministe pour ce bridge :

```bash
pnpm test:docker:mcp-channels
```

Ce test de fumée :

- démarre un conteneur Gateway amorcé
- démarre un second conteneur qui lance `openclaw mcp serve`
- vérifie la découverte des conversations, la lecture des transcriptions, la lecture des métadonnées de pièces jointes, le comportement de la file d’événements en direct et le routage des envois sortants
- valide les notifications de canal et d’autorisation de style Claude via le véritable bridge MCP stdio

C’est le moyen le plus rapide de prouver que le bridge fonctionne sans connecter un vrai compte Telegram, Discord ou iMessage à l’exécution de test.

Pour un contexte de test plus large, consultez [Tests](/fr/help/testing).

### Dépannage

<AccordionGroup>
  <Accordion title="Aucune conversation retournée">
    Signifie généralement que la session Gateway n’est pas déjà routable. Vérifiez que la session sous-jacente possède des métadonnées de route stockées pour le canal/fournisseur, le destinataire et, éventuellement, le compte/fil.
  </Accordion>
  <Accordion title="events_poll ou events_wait ignore les anciens messages">
    Attendu. La file en direct démarre lorsque le bridge se connecte. Lisez l’historique plus ancien de la transcription avec `messages_read`.
  </Accordion>
  <Accordion title="Les notifications Claude ne s’affichent pas">
    Vérifiez tous ces points :

    - le client a gardé la session MCP stdio ouverte
    - `--claude-channel-mode` vaut `on` ou `auto`
    - le client comprend réellement les méthodes de notification propres à Claude
    - le message entrant est arrivé après la connexion du bridge

  </Accordion>
  <Accordion title="Les approbations sont manquantes">
    `permissions_list_open` affiche uniquement les demandes d’approbation observées pendant que le bridge était connecté. Ce n’est pas une API durable d’historique des approbations.
  </Accordion>
</AccordionGroup>

## OpenClaw comme registre de clients MCP

Il s’agit du chemin `openclaw mcp list`, `show`, `status`, `doctor`, `probe`, `add`, `set`,
`configure`, `tools`, `login`, `logout`, `reload` et `unset`.

Ces commandes n’exposent pas OpenClaw via MCP. Elles gèrent les définitions de serveurs MCP gérées par OpenClaw sous `mcp.servers` dans la configuration OpenClaw. Elles ne lisent pas les serveurs mcporter depuis `config/mcporter.json`.

Ces définitions enregistrées sont destinées aux runtimes qu’OpenClaw lance ou configure plus tard, comme OpenClaw intégré et d’autres adaptateurs de runtime. OpenClaw stocke les définitions de manière centralisée afin que ces runtimes n’aient pas besoin de conserver leurs propres listes de serveurs MCP en double.

<AccordionGroup>
  <Accordion title="Comportement important">
    - ces commandes lisent ou écrivent uniquement la configuration OpenClaw
    - `status`, `list`, `show`, `doctor` sans `--probe`, `set`, `configure`, `tools`, `logout`, `reload` et `unset` ne se connectent pas au serveur MCP cible
    - `login` exécute le flux réseau OAuth MCP pour le serveur HTTP configuré et enregistre les identifiants locaux obtenus
    - `status --verbose` affiche des indications sur le transport résolu, l’authentification, le délai d’attente, le filtre et les appels d’outils parallèles sans se connecter
    - `doctor` vérifie les définitions enregistrées pour détecter des problèmes de configuration locale tels que des commandes stdio manquantes, des répertoires de travail invalides, des fichiers TLS manquants, des serveurs désactivés, des valeurs sensibles littérales dans les en-têtes/env et une autorisation OAuth incomplète
    - `doctor --probe` ajoute la même preuve de connexion en direct que `probe` après la réussite des vérifications statiques
    - `probe` se connecte au serveur sélectionné ou à tous les serveurs configurés, liste les outils et signale les capacités/diagnostics
    - `add` construit une définition à partir des flags et effectue un probe avant l’enregistrement, sauf si `--no-probe` est défini ou si une autorisation OAuth est d’abord nécessaire
    - les adaptateurs de runtime décident quelles formes de transport ils prennent réellement en charge au moment de l’exécution
    - `enabled: false` conserve un serveur enregistré mais l’exclut de la découverte par les runtimes intégrés
    - `timeout` et `connectTimeout` définissent les délais d’attente par serveur pour les requêtes et les connexions, en secondes
    - `supportsParallelToolCalls: true` marque les serveurs que les adaptateurs peuvent appeler simultanément
    - les serveurs HTTP peuvent utiliser des en-têtes statiques, une connexion OAuth, le contrôle de vérification TLS et des chemins de certificat/clé mTLS
    - OpenClaw intégré expose les outils MCP configurés dans les profils d’outils normaux `coding` et `messaging` ; `minimal` les masque toujours, et `tools.deny: ["bundle-mcp"]` les désactive explicitement
    - `toolFilter.include` et `toolFilter.exclude` par serveur filtrent les outils MCP découverts avant qu’ils ne deviennent des outils OpenClaw
    - les serveurs qui annoncent des ressources ou des prompts exposent aussi des outils utilitaires pour lister/lire les ressources et lister/récupérer les prompts ; ces noms utilitaires générés (`resources_list`, `resources_read`, `prompts_list`, `prompts_get`) utilisent le même filtre include/exclude
    - les changements dynamiques de liste d’outils MCP invalident le catalogue mis en cache pour cette session ; la prochaine découverte/utilisation est actualisée depuis le serveur
    - les échecs répétés de requête/protocole d’outil MCP mettent brièvement ce serveur en pause afin qu’un serveur défaillant ne consomme pas tout le tour
    - les runtimes MCP groupés limités à la session sont récupérés après `mcp.sessionIdleTtlMs` millisecondes d’inactivité (10 minutes par défaut ; définissez `0` pour désactiver) et les exécutions intégrées ponctuelles les nettoient à la fin de l’exécution

  </Accordion>
</AccordionGroup>

Les adaptateurs de runtime peuvent normaliser ce registre partagé dans la forme attendue par leur client en aval. Par exemple, OpenClaw intégré consomme directement les valeurs `transport` d’OpenClaw, tandis que Claude Code et Gemini reçoivent des valeurs `type` natives de la CLI comme `http`, `sse` ou `stdio`.

Codex app-server respecte aussi un bloc `codex` facultatif sur chaque serveur. Ce sont
des métadonnées de projection OpenClaw uniquement pour les fils Codex app-server ; elles ne
modifient pas les sessions ACP, la configuration générique du harnais Codex ni les autres adaptateurs de runtime.
Utilisez `codex.agents` non vide pour projeter un serveur uniquement dans des identifiants
d’agents OpenClaw précis. Les listes d’agents vides, blanches ou invalides sont rejetées par la validation de
configuration et omises par le chemin de projection runtime au lieu de devenir
globales. Utilisez `codex.defaultToolsApprovalMode` (`auto`, `prompt` ou `approve`)
pour émettre le `default_tools_approval_mode` natif de Codex pour un serveur de confiance.
OpenClaw retire les métadonnées `codex` avant de transmettre la configuration native `mcp_servers`
à Codex.

### Définitions de serveurs MCP enregistrées

OpenClaw stocke aussi dans la configuration un registre léger de serveurs MCP pour les surfaces qui veulent des définitions MCP gérées par OpenClaw.

Commandes :

- `openclaw mcp list`
- `openclaw mcp show [name]`
- `openclaw mcp status [--verbose]`
- `openclaw mcp doctor [name] [--probe]`
- `openclaw mcp probe [name]`
- `openclaw mcp add <name> [flags]`
- `openclaw mcp set <name> <json>`
- `openclaw mcp configure <name> [flags]`
- `openclaw mcp tools <name> [--include csv] [--exclude csv] [--clear]`
- `openclaw mcp login <name> [--code code]`
- `openclaw mcp logout <name>`
- `openclaw mcp reload`
- `openclaw mcp unset <name>`

Notes :

- `list` trie les noms de serveurs.
- `show` sans nom affiche l’objet complet des serveurs MCP configurés.
- `status` classe les transports configurés sans se connecter. `--verbose` inclut les détails résolus de lancement, délai d’attente, OAuth, filtre et appels parallèles.
- `doctor` effectue des vérifications statiques sans se connecter. Ajoutez `--probe` lorsque la commande doit aussi vérifier que les serveurs activés se connectent.
- `probe` se connecte et signale le nombre d’outils, la prise en charge des ressources/prompts, la prise en charge des changements de liste et les diagnostics.
- `add` accepte des flags stdio comme `--command`, `--arg`, `--env` et `--cwd`, ou des flags HTTP comme `--url`, `--transport`, `--header`, `--auth oauth`, TLS, délai d’attente et sélection d’outils.
- `set` attend une valeur d’objet JSON sur la ligne de commande.
- `configure` met à jour l’activation, les filtres d’outils, les délais d’attente, OAuth, TLS et les indications d’appels d’outils parallèles sans remplacer toute la définition du serveur.
- `tools` met à jour les filtres d’outils par serveur. Les entrées include/exclude sont des noms d’outils MCP et de simples globs `*`.
- `login` exécute le flux OAuth pour les serveurs HTTP configurés avec `auth: "oauth"`. La première exécution affiche une URL d’autorisation ; relancez avec `--code` après approbation.
- `logout` efface les identifiants OAuth stockés pour le serveur nommé sans supprimer la définition de serveur enregistrée.
- `reload` libère les runtimes MCP en processus mis en cache. Les processus Gateway ou agent dans un autre processus nécessitent toujours leur propre chemin de rechargement ou de redémarrage.
- Utilisez `transport: "streamable-http"` pour les serveurs MCP Streamable HTTP. `openclaw mcp set` normalise aussi le `type: "http"` natif de la CLI vers la même forme de configuration canonique pour compatibilité.
- `unset` échoue si le serveur nommé n’existe pas.

Exemples :

```bash
openclaw mcp list
openclaw mcp show context7 --json
openclaw mcp status --verbose
openclaw mcp doctor --probe
openclaw mcp probe context7 --json
openclaw mcp add memory --command npx --arg -y --arg @modelcontextprotocol/server-memory
openclaw mcp set context7 '{"command":"uvx","args":["context7-mcp"]}'
openclaw mcp tools context7 --include 'resolve-library-id,get-library-docs'
openclaw mcp set docs '{"url":"https://mcp.example.com","transport":"streamable-http"}'
openclaw mcp configure docs --timeout 20 --connect-timeout 5 --include 'search,read_*'
openclaw mcp configure docs --auth oauth --oauth-scope 'docs.read'
openclaw mcp login docs
openclaw mcp logout docs
openclaw mcp unset context7
```

### Recettes courantes de serveurs

Ces exemples enregistrent uniquement des définitions de serveurs. Exécutez ensuite `openclaw mcp doctor --probe` pour prouver que le serveur démarre et expose des outils.

<Tabs>
  <Tab title="Système de fichiers">
    ```bash
    openclaw mcp add files \
      --command npx \
      --arg -y \
      --arg @modelcontextprotocol/server-filesystem \
      --arg "$HOME/Documents" \
      --include 'read_file,list_directory,search_files'
    openclaw mcp doctor files --probe
    ```

    Limitez les serveurs de système de fichiers à la plus petite arborescence de répertoires que l’agent doit lire ou modifier.

  </Tab>
  <Tab title="Mémoire">
    ```bash
    openclaw mcp add memory \
      --command npx \
      --arg -y \
      --arg @modelcontextprotocol/server-memory
    openclaw mcp probe memory --json
    ```

    Utilisez un filtre d’outils si le serveur expose des outils d’écriture qui ne doivent pas être disponibles pour les agents normaux.

  </Tab>
  <Tab title="Script local">
    ```bash
    openclaw mcp add local-tools \
      --command node \
      --arg ./dist/mcp-server.js \
      --cwd /srv/openclaw-tools \
      --env API_BASE=https://internal.example
    openclaw mcp status --verbose
    ```

    `doctor` vérifie que `cwd` existe et que la commande se résout depuis l’environnement configuré.

  </Tab>
  <Tab title="HTTP distant">
    ```bash
    openclaw mcp add docs \
      --url https://mcp.example.com/mcp \
      --transport streamable-http \
      --auth oauth \
      --oauth-scope docs.read \
      --timeout 20 \
      --connect-timeout 5 \
      --include 'search,read_*'
    openclaw mcp doctor docs --probe
    ```

    Utilisez OAuth lorsque le serveur distant le prend en charge. Si le serveur exige des en-têtes statiques, évitez de valider des jetons bearer littéraux.

  </Tab>
  <Tab title="Bureau/CUA">
    ```bash
    openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
    openclaw mcp tools cua-driver --include 'list_apps,observe,click,type'
    openclaw mcp doctor cua-driver --probe
    ```

    Les serveurs de contrôle direct du bureau héritent des autorisations du processus qu’ils lancent. Utilisez des filtres d’outils restreints et les invites d’autorisation au niveau du système d’exploitation.

  </Tab>
</Tabs>

### Formats de sortie JSON

Utilisez `--json` pour les scripts et les tableaux de bord. Les ensembles de champs peuvent s’étendre au fil du temps ; les consommateurs doivent donc ignorer les clés inconnues.

<AccordionGroup>
  <Accordion title="status --json">
    ```json
    {
      "path": "/home/user/.openclaw/openclaw.json",
      "servers": [
        {
          "name": "docs",
          "configured": true,
          "enabled": true,
          "ok": true,
          "transport": "streamable-http",
          "launch": "streamable-http https://mcp.example.com/mcp",
          "auth": "oauth",
          "authStatus": {
            "hasTokens": true,
            "hasClientInformation": true,
            "hasCodeVerifier": false,
            "hasDiscoveryState": true,
            "hasLastAuthorizationUrl": false
          },
          "requestTimeoutMs": 20000,
          "connectionTimeoutMs": 5000,
          "toolFilter": {
            "include": ["search", "read_*"],
            "exclude": []
          },
          "supportsParallelToolCalls": true
        }
      ]
    }
    ```
  </Accordion>
  <Accordion title="doctor --json">
    ```json
    {
      "ok": false,
      "path": "/home/user/.openclaw/openclaw.json",
      "servers": [
        {
          "name": "docs",
          "ok": false,
          "issues": [
            {
              "level": "error",
              "message": "OAuth credentials are not authorized; run openclaw mcp login docs"
            }
          ]
        }
      ]
    }
    ```

    `doctor --json` se termine avec un code non nul lorsqu’un serveur vérifié activé comporte une erreur. Les avertissements sont signalés, mais ne font pas échouer la commande à eux seuls.

  </Accordion>
  <Accordion title="probe --json">
    ```json
    {
      "path": "/home/user/.openclaw/openclaw.json",
      "generatedAt": "2026-05-31T09:00:00.000Z",
      "servers": {
        "docs": {
          "launch": "streamable-http https://mcp.example.com/mcp",
          "tools": 2,
          "resources": true,
          "prompts": false,
          "listChanged": {
            "tools": true,
            "resources": false,
            "prompts": false
          }
        }
      },
      "tools": ["docs__read_page", "docs__search"],
      "diagnostics": []
    }
    ```

    `probe` ouvre une session client MCP active. Utilisez-le comme preuve d’accessibilité et de capacités, pas pour des audits de configuration statique.

  </Accordion>
</AccordionGroup>

Exemple de format de configuration :

```json
{
  "mcp": {
    "servers": {
      "context7": {
        "command": "uvx",
        "args": ["context7-mcp"]
      },
      "docs": {
        "url": "https://mcp.example.com",
        "transport": "streamable-http",
        "timeout": 20,
        "connectTimeout": 5,
        "supportsParallelToolCalls": true,
        "auth": "oauth",
        "oauth": {
          "scope": "docs.read"
        },
        "sslVerify": true,
        "clientCert": "/path/to/client.crt",
        "clientKey": "/path/to/client.key",
        "toolFilter": {
          "include": ["search_*"],
          "exclude": ["admin_*"]
        }
      }
    }
  }
}
```

### Transport stdio

Lance un processus enfant local et communique via stdin/stdout.

| Champ                      | Description                                      |
| -------------------------- | ------------------------------------------------ |
| `command`                  | Exécutable à lancer (obligatoire)               |
| `args`                     | Tableau d’arguments de ligne de commande        |
| `env`                      | Variables d’environnement supplémentaires       |
| `cwd` / `workingDirectory` | Répertoire de travail du processus              |

<Warning>
**Filtre de sécurité de l’environnement stdio**

OpenClaw rejette les clés d’environnement de démarrage d’interpréteur qui peuvent modifier la façon dont un serveur MCP stdio démarre avant le premier RPC, même si elles apparaissent dans le bloc `env` d’un serveur. Les clés bloquées incluent `BASHOPTS`, `FPATH`, `KSH_ENV`, `NODE_OPTIONS`, `NODE_REDIRECT_WARNINGS`, `NODE_REPL_EXTERNAL_MODULE`, `NODE_REPL_HISTORY`, `NODE_V8_COVERAGE`, `PYTHONSTARTUP`, `PYTHONPATH`, `PERL5OPT`, `RUBYOPT`, `SHELLOPTS`, `PS4`, `TCLLIBPATH` et des variables similaires de contrôle d’exécution. Le démarrage les rejette avec une erreur de configuration afin qu’elles ne puissent pas injecter un prélude implicite, remplacer l’interpréteur, activer un débogueur ou rediriger la sortie d’exécution contre le processus stdio. Les variables d’environnement ordinaires propres aux identifiants, aux proxys et aux serveurs (`GITHUB_TOKEN`, `HTTP_PROXY`, `*_API_KEY` personnalisé, etc.) ne sont pas affectées.

Si votre serveur MCP a réellement besoin de l’une des variables bloquées, définissez-la sur le processus hôte du Gateway plutôt que sous le `env` du serveur stdio.
</Warning>

### Transport SSE / HTTP

Se connecte à un serveur MCP distant via HTTP Server-Sent Events.

| Champ                          | Description                                                                   |
| ------------------------------ | ----------------------------------------------------------------------------- |
| `url`                          | URL HTTP ou HTTPS du serveur distant (obligatoire)                            |
| `headers`                      | Mappage clé-valeur facultatif d’en-têtes HTTP (par exemple jetons d’authentification) |
| `connectionTimeoutMs`          | Délai d’expiration de connexion par serveur en ms (facultatif)                |
| `connectTimeout`               | Délai d’expiration de connexion par serveur en secondes (facultatif)          |
| `timeout` / `requestTimeoutMs` | Délai d’expiration des requêtes MCP par serveur, en secondes ou en ms         |
| `auth: "oauth"`                | Utiliser le stockage des jetons OAuth MCP et `openclaw mcp login`             |
| `sslVerify`                    | Définir à false uniquement pour les points de terminaison HTTPS privés explicitement approuvés |
| `clientCert` / `clientKey`     | Chemins du certificat client mTLS et de la clé                                |
| `supportsParallelToolCalls`    | Indique que les appels concurrents sont sûrs pour ce serveur                  |

Exemple :

```json
{
  "mcp": {
    "servers": {
      "remote-tools": {
        "url": "https://mcp.example.com",
        "auth": "oauth",
        "timeout": 20,
        "headers": {
          "Authorization": "Bearer <token>"
        }
      }
    }
  }
}
```

Les valeurs sensibles dans `url` (userinfo) et `headers` sont masquées dans les journaux et la sortie d’état. `openclaw mcp doctor` avertit lorsque des entrées `headers` ou `env` semblant sensibles contiennent des valeurs littérales, afin que les opérateurs puissent déplacer ces valeurs hors de la configuration validée.

### Flux de travail OAuth

OAuth est destiné aux serveurs MCP HTTP qui annoncent le flux OAuth MCP. Les en-têtes `Authorization` statiques sont ignorés pour un serveur tant que `auth: "oauth"` est activé.

<Steps>
  <Step title="Enregistrer le serveur">
    Ajoutez ou mettez à jour le serveur avec `auth: "oauth"` et toute métadonnée OAuth facultative.

    ```bash
    openclaw mcp set docs '{"url":"https://mcp.example.com/mcp","transport":"streamable-http","auth":"oauth","oauth":{"scope":"docs.read"}}'
    ```

  </Step>
  <Step title="Démarrer la connexion">
    Exécutez la connexion pour créer la demande d’autorisation.

    ```bash
    openclaw mcp login docs
    ```

    OpenClaw affiche l’URL d’autorisation et stocke l’état temporaire du vérificateur OAuth sous le répertoire d’état d’OpenClaw.

  </Step>
  <Step title="Terminer avec le code">
    Après l’approbation dans le navigateur, transmettez le code renvoyé à OpenClaw.

    ```bash
    openclaw mcp login docs --code abc123
    ```

  </Step>
  <Step title="Vérifier l’autorisation">
    Utilisez status ou doctor pour confirmer que les jetons sont présents.

    ```bash
    openclaw mcp status --verbose
    openclaw mcp doctor docs --probe
    ```

  </Step>
  <Step title="Effacer les identifiants">
    Logout supprime les identifiants OAuth stockés, mais conserve la définition de serveur enregistrée.

    ```bash
    openclaw mcp logout docs
    ```

  </Step>
</Steps>

Si le fournisseur effectue une rotation des jetons ou si l’état d’autorisation reste bloqué, exécutez `openclaw mcp logout <name>`, puis répétez `login`. `logout` peut effacer les identifiants d’un serveur HTTP enregistré même après la suppression de `auth: "oauth"` de la configuration, tant que le nom du serveur et l’URL identifient encore l’entrée du magasin d’identifiants.

### Transport HTTP streamable

`streamable-http` est une option de transport supplémentaire aux côtés de `sse` et `stdio`. Elle utilise le streaming HTTP pour la communication bidirectionnelle avec des serveurs MCP distants.

| Champ                          | Description                                                                            |
| ------------------------------ | -------------------------------------------------------------------------------------- |
| `url`                          | URL HTTP ou HTTPS du serveur distant (obligatoire)                                     |
| `transport`                    | Définir sur `"streamable-http"` pour sélectionner ce transport ; si omis, OpenClaw utilise `sse` |
| `headers`                      | Mappage clé-valeur facultatif d’en-têtes HTTP (par exemple jetons d’authentification)  |
| `connectionTimeoutMs`          | Délai d’expiration de connexion par serveur en ms (facultatif)                         |
| `connectTimeout`               | Délai d’expiration de connexion par serveur en secondes (facultatif)                   |
| `timeout` / `requestTimeoutMs` | Délai d’expiration des requêtes MCP par serveur, en secondes ou en ms                  |
| `auth: "oauth"`                | Utiliser le stockage des jetons OAuth MCP et `openclaw mcp login`                      |
| `sslVerify`                    | Définir à false uniquement pour les points de terminaison HTTPS privés explicitement approuvés |
| `clientCert` / `clientKey`     | Chemins du certificat client mTLS et de la clé                                         |
| `supportsParallelToolCalls`    | Indique que les appels concurrents sont sûrs pour ce serveur                           |

La configuration OpenClaw utilise `transport: "streamable-http"` comme graphie canonique. Les valeurs MCP natives de la CLI `type: "http"` sont acceptées lorsqu’elles sont enregistrées via `openclaw mcp set` et réparées par `openclaw doctor --fix` dans la configuration existante, mais `transport` est ce que l’OpenClaw intégré consomme directement.

Exemple :

```json
{
  "mcp": {
    "servers": {
      "streaming-tools": {
        "url": "https://mcp.example.com/stream",
        "transport": "streamable-http",
        "connectTimeout": 10,
        "timeout": 30,
        "headers": {
          "Authorization": "Bearer <token>"
        }
      }
    }
  }
}
```

<Note>
Les commandes de registre ne démarrent pas le pont de canal. Seuls `probe` et `doctor --probe` ouvrent une session client MCP active pour prouver que le serveur cible est accessible.
</Note>

## Interface utilisateur de contrôle

L’interface utilisateur de contrôle du navigateur inclut une page dédiée aux paramètres MCP à `/mcp`. Elle affiche le nombre de serveurs configurés, les résumés activation/OAuth/filtre, les lignes de transport par serveur, les contrôles d’activation/désactivation, les commandes CLI courantes et un éditeur limité à la section de configuration `mcp`.

Utilisez la page pour les modifications opérateur et l’inventaire rapide. Utilisez `openclaw mcp doctor --probe` ou `openclaw mcp probe` lorsque vous avez besoin d’une preuve active du serveur.

Flux de travail opérateur :

1. Ouvrez l’UI de contrôle et choisissez **MCP**.
2. Examinez les cartes de résumé pour les serveurs totaux, activés, OAuth et filtrés.
3. Utilisez chaque ligne de serveur pour le transport, l’authentification, le filtre, le délai d’expiration et les indications de commande.
4. Activez ou désactivez l’activation lorsque vous souhaitez conserver une définition mais l’exclure de la découverte à l’exécution.
5. Modifiez la section de configuration `mcp` limitée à sa portée pour les changements structurels comme de nouveaux serveurs, en-têtes, TLS, métadonnées OAuth ou filtres d’outils.
6. Choisissez **Enregistrer** pour conserver uniquement la configuration, ou **Enregistrer et publier** pour l’appliquer via le chemin de configuration du Gateway.
7. Exécutez `openclaw mcp doctor --probe` lorsque vous avez besoin d’une preuve en direct que le serveur modifié démarre et liste les outils.

Notes :

- les extraits de commande placent les noms de serveurs entre guillemets afin que les noms inhabituels restent copiables dans un shell
- les valeurs affichées qui ressemblent à des URL sont masquées avant le rendu lorsqu’elles contiennent des identifiants intégrés
- la page ne démarre pas les transports MCP elle-même
- les environnements d’exécution actifs peuvent nécessiter `openclaw mcp reload`, une publication de configuration du Gateway ou un redémarrage du processus selon le processus qui possède les clients MCP

## Limites actuelles

Cette page documente le pont tel qu’il est livré aujourd’hui.

Limites actuelles :

- la découverte des conversations dépend des métadonnées de route de session Gateway existantes
- aucun protocole push générique au-delà de l’adaptateur propre à Claude
- pas encore d’outils de modification de message ni de réaction
- le transport HTTP/SSE/streamable-http se connecte à un seul serveur distant ; pas encore d’amont multiplexé
- `permissions_list_open` inclut uniquement les approbations observées pendant que le pont est connecté

## Articles connexes

- [Référence CLI](/fr/cli)
- [Plugins](/fr/cli/plugins)
