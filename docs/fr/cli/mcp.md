---
read_when:
    - Connexion de Codex, Claude Code ou d’un autre client MCP aux canaux gérés par OpenClaw
    - Exécution de `openclaw mcp serve`
    - Gestion des définitions de serveurs MCP enregistrées par OpenClaw
sidebarTitle: MCP
summary: Exposez les conversations des canaux OpenClaw via MCP et gérez les définitions de serveurs MCP enregistrées
title: MCP
x-i18n:
    generated_at: "2026-07-16T13:05:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f62657954709e3f25eb7031dafca9c4050f2420443587f76ce2b2db23f187987
    source_path: cli/mcp.md
    workflow: 16
---

`openclaw mcp` remplit deux fonctions :

- exécuter OpenClaw comme serveur MCP avec `openclaw mcp serve`
- gérer les définitions de serveurs MCP sortants administrées par OpenClaw avec `list`, `show`, `status`, `doctor`, `probe`, `add`, `set`, `configure`, `tools`, `login`, `logout`, `reload` et `unset`

`serve` correspond à OpenClaw agissant comme serveur MCP. Les autres sous-commandes correspondent à OpenClaw agissant comme registre côté client MCP pour les serveurs que ses propres environnements d’exécution pourront utiliser ultérieurement.

<Note>
  `list`, `show`, `set` et `unset` lisent et écrivent uniquement les entrées `mcp.servers` gérées par OpenClaw dans la configuration d’OpenClaw. Elles n’incluent pas les serveurs mcporter provenant de `config/mcporter.json` ; utilisez `mcporter list` pour ce registre.
</Note>

Utilisez [`openclaw acp`](/fr/cli/acp) lorsqu’OpenClaw doit lui-même héberger une session de harnais de codage et acheminer cet environnement d’exécution via ACP.

## Choisir le parcours MCP approprié

| Objectif                                                                | Utiliser                                                              | Pourquoi                                                                                                             |
| ------------------------------------------------------------------- | -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Permettre à un client MCP externe de lire ou d’envoyer des conversations de canaux OpenClaw | `openclaw mcp serve`                                                 | OpenClaw est le serveur MCP et expose les conversations adossées au Gateway via stdio.                                 |
| Enregistrer des serveurs MCP tiers pour les exécutions d’agents gérées par OpenClaw        | `openclaw mcp add`, `set`, `configure`, `tools`, `login`             | OpenClaw est le registre côté client MCP et projette ensuite ces serveurs dans les environnements d’exécution admissibles.               |
| Vérifier un serveur enregistré sans exécuter un tour d’agent                  | `openclaw mcp status`, `doctor`, `probe`                             | `status` et `doctor` inspectent la configuration ; `probe` ouvre une connexion MCP active et répertorie les capacités.               |
| Modifier la configuration MCP depuis un navigateur                                      | `/settings/mcp` de l’interface de contrôle (alias `/mcp`)                            | La page affiche l’inventaire, l’état d’activation, les résumés OAuth et des filtres, des indications de commandes et un éditeur `mcp` délimité.         |
| Fournir au serveur d’application Codex un serveur MCP natif délimité                    | `mcp.servers.<name>.codex`                                           | Le bloc `codex` affecte uniquement la projection des fils du serveur d’application Codex et est supprimé avant la transmission de la configuration native. |
| Exécuter des sessions de harnais hébergées par ACP                                     | [`openclaw acp`](/fr/cli/acp) et [Agents ACP](/fr/tools/acp-agents-setup) | Le mode passerelle ACP n’accepte pas l’injection de serveurs MCP par session ; configurez plutôt les passerelles du Gateway ou des plugins.     |

<Tip>
Si vous ne savez pas quel parcours choisir, commencez par `openclaw mcp status --verbose`. Cette commande affiche ce qu’OpenClaw a enregistré sans démarrer de serveur MCP.
</Tip>

## OpenClaw comme serveur MCP

Il s’agit du parcours `openclaw mcp serve`.

### Quand utiliser serve

Utilisez `openclaw mcp serve` lorsque :

- Codex, Claude Code ou un autre client MCP doit communiquer directement avec des conversations de canaux adossées à OpenClaw
- vous disposez déjà d’un Gateway OpenClaw local ou distant avec des sessions acheminées
- vous souhaitez un serveur MCP unique fonctionnant avec tous les backends de canaux d’OpenClaw, au lieu d’exécuter des passerelles distinctes pour chaque canal

Utilisez plutôt [`openclaw acp`](/fr/cli/acp) lorsqu’OpenClaw doit lui-même héberger l’environnement d’exécution de codage et conserver la session de l’agent dans OpenClaw.

### Fonctionnement

`openclaw mcp serve` démarre un serveur MCP stdio. Le client MCP est propriétaire de ce processus. Tant que le client maintient la session stdio ouverte, la passerelle se connecte à un Gateway OpenClaw local ou distant via WebSocket et expose les conversations de canaux acheminées via MCP.

<Steps>
  <Step title="Le client lance la passerelle">
    Le client MCP lance `openclaw mcp serve`.
  </Step>
  <Step title="La passerelle se connecte au Gateway">
    La passerelle se connecte au Gateway OpenClaw via WebSocket.
  </Step>
  <Step title="Les sessions deviennent des conversations MCP">
    Les sessions acheminées deviennent des conversations MCP ainsi que des outils de transcription et d’historique.
  </Step>
  <Step title="Mise en file d’attente des événements en direct">
    Les événements en direct sont placés dans une file d’attente en mémoire tant que la passerelle est connectée.
  </Step>
  <Step title="Notifications push Claude facultatives">
    Si le mode de canal Claude est activé, la même session peut également recevoir des notifications push propres à Claude.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Comportement important">
    - l’état de la file d’attente en direct commence lorsque la passerelle se connecte
    - l’ancien historique de transcription est lu avec `messages_read`
    - les notifications push Claude existent uniquement tant que la session MCP est active
    - lorsque le client se déconnecte, la passerelle s’arrête et la file d’attente en direct disparaît
    - les points d’entrée ponctuels d’agent tels que `openclaw agent` et `openclaw infer model run` arrêtent tous les environnements d’exécution MCP intégrés qu’ils ouvrent une fois la réponse terminée, afin que les exécutions scriptées répétées n’accumulent pas de processus enfants MCP stdio
    - les serveurs MCP stdio lancés par OpenClaw, qu’ils soient intégrés ou configurés par l’utilisateur, sont arrêtés avec toute leur arborescence de processus lors de l’arrêt, afin que les sous-processus enfants lancés par le serveur ne survivent pas après la fermeture du client stdio parent
    - la suppression ou la réinitialisation d’une session élimine les clients MCP de cette session via le parcours partagé de nettoyage de l’environnement d’exécution, afin qu’aucune connexion stdio persistante ne reste liée à une session supprimée

  </Accordion>
</AccordionGroup>

### Choisir un mode client

<Tabs>
  <Tab title="Clients MCP génériques">
    Outils MCP standard uniquement. Utilisez `conversations_list`, `messages_read`, `events_poll`, `events_wait`, `messages_send` et les outils d’approbation.
  </Tab>
  <Tab title="Claude Code">
    Outils MCP standard accompagnés de l’adaptateur de canal propre à Claude. Activez `--claude-channel-mode on` ou conservez la valeur par défaut `auto`.
  </Tab>
</Tabs>

<Note>
Actuellement, `auto` se comporte de la même manière que `on`. La détection des capacités du client n’est pas encore disponible.
</Note>

### Ce qu’expose serve

La passerelle utilise les métadonnées existantes des routes de session du Gateway pour exposer les conversations adossées aux canaux. Une conversation apparaît lorsqu’OpenClaw dispose déjà d’un état de session avec une route connue, telle que :

- `channel`
- les métadonnées du destinataire ou de la destination
- `accountId` facultatif
- `threadId` facultatif

Les clients MCP disposent ainsi d’un emplacement unique pour :

- répertorier les conversations acheminées récentes
- lire l’historique récent des transcriptions
- attendre de nouveaux événements entrants
- renvoyer une réponse via la même route
- voir les demandes d’approbation reçues pendant que la passerelle est connectée

### Utilisation

<Tabs>
  <Tab title="Gateway local">
    ```bash
    openclaw mcp serve
    ```
  </Tab>
  <Tab title="Gateway distant (jeton)">
    ```bash
    openclaw mcp serve --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token
    ```
  </Tab>
  <Tab title="Gateway distant (mot de passe)">
    ```bash
    openclaw mcp serve --url wss://gateway-host:18789 --password-file ~/.openclaw/gateway.password
    ```
  </Tab>
  <Tab title="Mode détaillé / Claude désactivé">
    ```bash
    openclaw mcp serve --verbose
    openclaw mcp serve --claude-channel-mode off
    ```
  </Tab>
</Tabs>

### Outils de la passerelle

<AccordionGroup>
  <Accordion title="conversations_list">
    Répertorie les conversations récentes adossées à des sessions qui disposent déjà de métadonnées de route dans l’état de session du Gateway.

    Filtres : `limit` (500 maximum), `search`, `channel`, `includeDerivedTitles`, `includeLastMessage`.

  </Accordion>
  <Accordion title="conversation_get">
    Renvoie une conversation selon `session_key` au moyen d’une recherche directe de session dans le Gateway.
  </Accordion>
  <Accordion title="messages_read">
    Lit les messages de transcription récents d’une conversation adossée à une session. La valeur par défaut de `limit` est 20, avec un maximum de 200.
  </Accordion>
  <Accordion title="attachments_fetch">
    Extrait les blocs de contenu non textuel d’un message de transcription. Il s’agit d’une vue des métadonnées du contenu de la transcription, et non d’un stockage autonome et durable des pièces jointes sous forme de blobs.
  </Accordion>
  <Accordion title="events_poll">
    Lit les événements en direct mis en file d’attente depuis un curseur numérique. `limit` : 200 maximum.
  </Accordion>
  <Accordion title="events_wait">
    Effectue une interrogation longue jusqu’à l’arrivée du prochain événement correspondant dans la file d’attente ou jusqu’à l’expiration du délai (30 s par défaut, 300 s maximum).

    Utilisez cette fonction lorsqu’un client MCP générique nécessite une transmission quasiment en temps réel sans protocole push propre à Claude.

  </Accordion>
  <Accordion title="messages_send">
    Renvoie du texte via la route déjà enregistrée dans la session.

    Comportement actuel :

    - nécessite une route de conversation existante
    - utilise le canal, le destinataire, l’identifiant de compte et l’identifiant de fil de la session
    - envoie uniquement du texte

  </Accordion>
  <Accordion title="permissions_list_open">
    Répertorie les demandes d’approbation d’exécution ou de plugin en attente observées par la passerelle depuis sa connexion au Gateway.
  </Accordion>
  <Accordion title="permissions_respond">
    Traite une demande d’approbation d’exécution ou de plugin en attente avec :

    - `allow-once`
    - `allow-always`
    - `deny`

  </Accordion>
</AccordionGroup>

### Modèle d’événements

La passerelle conserve une file d’attente d’événements en mémoire tant qu’elle est connectée.

Types d’événements actuels :

- `message`
- `exec_approval_requested`
- `exec_approval_resolved`
- `plugin_approval_requested`
- `plugin_approval_resolved`
- `claude_permission_request`

<Warning>
- la file d’attente concerne uniquement les événements en direct ; elle démarre en même temps que la passerelle MCP
- `events_poll` et `events_wait` ne relisent pas d’eux-mêmes l’ancien historique du Gateway
- le journal durable doit être lu avec `messages_read`

</Warning>

### Notifications de canal Claude

La passerelle peut également exposer des notifications de canal propres à Claude. Il s’agit de l’équivalent OpenClaw d’un adaptateur de canal Claude Code : les outils MCP standard restent disponibles, mais les messages entrants en direct peuvent également arriver sous forme de notifications MCP propres à Claude.

<Tabs>
  <Tab title="off">
    `--claude-channel-mode off` : outils MCP standard uniquement.
  </Tab>
  <Tab title="on">
    `--claude-channel-mode on` : active les notifications de canal Claude.
  </Tab>
  <Tab title="auto (par défaut)">
    `--claude-channel-mode auto` : valeur par défaut actuelle ; même comportement de la passerelle que `on`.
  </Tab>
</Tabs>

Lorsque le mode de canal Claude est activé, le serveur annonce des capacités expérimentales Claude et peut émettre :

- `notifications/claude/channel`
- `notifications/claude/channel/permission`

Comportement actuel de la passerelle :

- les messages de transcription `user` entrants sont transférés en tant que `notifications/claude/channel`
- les demandes d’autorisation Claude reçues via MCP sont suivies en mémoire
- si le propriétaire de la commande dans la conversation liée envoie ensuite `yes <id>` ou `no <id>` (`<id>` est l’identifiant de demande à 5 lettres, sans `l`), la passerelle le convertit en `notifications/claude/channel/permission`
- ces notifications sont limitées à la session active ; si le client MCP se déconnecte, aucune cible push n’est disponible

Ce comportement est volontairement propre au client. Les clients MCP génériques doivent utiliser les outils d’interrogation standard.

### Configuration du client MCP

Exemple de configuration d’un client stdio :

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

Pour la plupart des clients MCP génériques, commencez avec la surface d’outils standard et ignorez le mode Claude. Activez le mode Claude uniquement pour les clients qui comprennent réellement les méthodes de notification propres à Claude.

### Options

`openclaw mcp serve` prend en charge :

<ParamField path="--url" type="string">
  URL WebSocket du Gateway. Utilise par défaut `gateway.remote.url` lorsqu’elle est configurée.
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
  Mode de notification Claude. Valeur par défaut : `auto`.
</ParamField>
<ParamField path="-v, --verbose" type="boolean">
  Journaux détaillés sur stderr.
</ParamField>

<Tip>
Préférez `--token-file` ou `--password-file` aux secrets intégrés lorsque cela est possible.
</Tip>

### Sécurité et limite de confiance

Le pont n’invente pas le routage. Il expose uniquement les conversations que le Gateway sait déjà router.

Cela signifie que :

- les listes d’autorisation des expéditeurs, l’appairage et la confiance au niveau du canal relèvent toujours de la configuration du canal OpenClaw sous-jacent
- `messages_send` peut uniquement répondre par l’intermédiaire d’une route existante enregistrée
- l’état des approbations est actif et conservé uniquement en mémoire pour la session actuelle du pont
- l’authentification du pont doit utiliser les mêmes contrôles de jeton ou de mot de passe du Gateway que ceux auxquels vous feriez confiance pour tout autre client Gateway distant

Si une conversation est absente de `conversations_list`, la cause habituelle n’est pas la configuration MCP. Il s’agit de métadonnées de route manquantes ou incomplètes dans la session Gateway sous-jacente.

### Tests

OpenClaw fournit un test de fumée Docker déterministe pour ce pont :

```bash
pnpm test:docker:mcp-channels
```

Ce test de fumée exécute un seul conteneur : il initialise l’état des conversations, démarre le Gateway, puis lance `openclaw mcp serve` comme processus enfant stdio et le pilote comme un client MCP. Il vérifie la découverte des conversations, la lecture des transcriptions, la lecture des métadonnées des pièces jointes, le comportement de la file d’événements en direct ainsi que les notifications de canal et d’autorisation de style Claude sur le véritable pont MCP stdio. Le routage des envois sortants (`messages_send` réutilisant la route de conversation enregistrée) est couvert séparément par des tests unitaires dans `src/mcp/channel-server.test.ts`.

Il s’agit du moyen le plus rapide de prouver que le pont fonctionne sans intégrer de véritable compte Telegram, Discord ou iMessage à l’exécution du test.

Pour un contexte de test plus général, consultez [Tests](/fr/help/testing).

### Résolution des problèmes

<AccordionGroup>
  <Accordion title="Aucune conversation renvoyée">
    Cela signifie généralement que la session Gateway n’est pas déjà routable. Vérifiez que la session sous-jacente contient des métadonnées de route enregistrées pour le canal ou le fournisseur, le destinataire et, facultativement, le compte ou le fil de discussion.
  </Accordion>
  <Accordion title="events_poll ou events_wait omet les anciens messages">
    C’est le comportement attendu. La file en direct démarre lorsque le pont se connecte. Lisez l’ancien historique de transcription avec `messages_read`.
  </Accordion>
  <Accordion title="Les notifications Claude ne s’affichent pas">
    Vérifiez tous les points suivants :

    - le client a maintenu la session MCP stdio ouverte
    - `--claude-channel-mode` vaut `on` ou `auto`
    - le client comprend réellement les méthodes de notification propres à Claude
    - le message entrant est arrivé après la connexion du pont

  </Accordion>
  <Accordion title="Les approbations sont absentes">
    `permissions_list_open` affiche uniquement les demandes d’approbation observées pendant que le pont était connecté. Il ne s’agit pas d’une API durable d’historique des approbations.
  </Accordion>
</AccordionGroup>

## OpenClaw comme registre de clients MCP

Il s’agit du chemin `openclaw mcp list`, `show`, `status`, `doctor`, `probe`, `add`, `set`,
`configure`, `tools`, `login`, `logout`, `reload` et `unset`.

Ces commandes n’exposent pas OpenClaw par l’intermédiaire de MCP. Elles gèrent les définitions de serveurs MCP administrées par OpenClaw sous `mcp.servers` dans la configuration OpenClaw. Elles ne lisent pas les serveurs mcporter depuis `config/mcporter.json`.

Ces définitions enregistrées sont destinées aux environnements d’exécution qu’OpenClaw lance ou configure ultérieurement, comme OpenClaw intégré et d’autres adaptateurs d’environnement d’exécution. OpenClaw stocke les définitions de manière centralisée afin que ces environnements d’exécution n’aient pas à conserver leurs propres listes de serveurs MCP en double.

<AccordionGroup>
  <Accordion title="Comportement important">
    - ces commandes lisent ou écrivent uniquement la configuration OpenClaw
    - `status`, `list`, `show`, `doctor` sans `--probe`, `set`, `configure`, `tools`, `logout`, `reload` et `unset` ne se connectent pas au serveur MCP cible
    - `login` exécute le flux réseau OAuth MCP pour le serveur HTTP configuré et enregistre les identifiants locaux obtenus
    - `status --verbose` affiche les indications résolues concernant le transport, l’authentification, les délais d’expiration, les filtres et les appels d’outils parallèles sans établir de connexion
    - `doctor` vérifie les définitions enregistrées afin de détecter des problèmes de configuration locale, comme des commandes stdio manquantes, des répertoires de travail non valides, des fichiers TLS manquants, des serveurs désactivés, des valeurs sensibles littérales dans les en-têtes ou variables d’environnement et une autorisation OAuth incomplète
    - `doctor --probe` ajoute la même preuve de connexion en direct que `probe` une fois les vérifications statiques réussies
    - `probe` se connecte au serveur sélectionné ou à tous les serveurs configurés, répertorie les outils et signale les capacités et diagnostics
    - `add` construit une définition à partir des options, puis la sonde avant de l’enregistrer, sauf si `--no-probe` est défini ou si une autorisation OAuth est d’abord nécessaire
    - les adaptateurs d’environnement d’exécution déterminent au moment de l’exécution les formes de transport qu’ils prennent réellement en charge
    - `enabled: false` conserve un serveur enregistré, mais l’exclut de la découverte par l’environnement d’exécution intégré
    - `timeout` et `connectTimeout` définissent les délais d’expiration des requêtes et des connexions par serveur, en secondes
    - `supportsParallelToolCalls: true` désigne les serveurs que les adaptateurs peuvent appeler simultanément
    - les serveurs HTTP peuvent utiliser des en-têtes statiques, une connexion OAuth, le contrôle de la vérification TLS et des chemins de certificat et de clé mTLS
    - OpenClaw intégré expose les outils MCP configurés dans les profils d’outils normaux `coding` et `messaging` ; `minimal` les masque toujours et `tools.deny: ["bundle-mcp"]` les désactive explicitement
    - les filtres `toolFilter.include` et `toolFilter.exclude` propres à chaque serveur filtrent les outils MCP découverts avant qu’ils ne deviennent des outils OpenClaw
    - les serveurs qui annoncent des ressources ou des invites exposent également des outils utilitaires permettant de répertorier et lire les ressources, ainsi que de répertorier et récupérer les invites ; ces noms d’utilitaires générés (`resources_list`, `resources_read`, `prompts_list`, `prompts_get`) utilisent le même filtre d’inclusion et d’exclusion
    - les modifications dynamiques de la liste d’outils MCP invalident le catalogue mis en cache pour cette session ; la découverte ou l’utilisation suivante l’actualise depuis le serveur
    - les échecs répétés de requêtes d’outils ou de protocole MCP suspendent brièvement ce serveur afin qu’un serveur défaillant ne consomme pas l’intégralité du tour
    - les environnements d’exécution MCP intégrés propres à une session sont supprimés après `mcp.sessionIdleTtlMs` millisecondes d’inactivité (10 minutes par défaut ; définissez `0` pour désactiver ce comportement), et les exécutions intégrées ponctuelles les nettoient à la fin de l’exécution

  </Accordion>
</AccordionGroup>

Les adaptateurs d’environnement d’exécution peuvent normaliser ce registre partagé dans la forme attendue par leur client en aval. Par exemple, OpenClaw intégré consomme directement les valeurs `transport` d’OpenClaw, tandis que Claude Code et Gemini reçoivent des valeurs `type` natives de la CLI, comme `http`, `sse` ou `stdio`.

Le serveur d’application Codex prend également en charge un bloc facultatif `codex` sur chaque serveur. Il s’agit de
métadonnées de projection OpenClaw destinées uniquement aux fils de discussion du serveur d’application Codex ; elles ne
modifient pas les sessions ACP, la configuration générique du harnais Codex ni les autres adaptateurs d’environnement d’exécution.
Utilisez une valeur `codex.agents` non vide pour projeter un serveur uniquement dans des identifiants
d’agents OpenClaw précis. Les listes d’agents vides, ne contenant que des espaces ou non valides sont rejetées par la validation de la
configuration et omises du chemin de projection de l’environnement d’exécution au lieu de devenir
globales. Utilisez `codex.defaultToolsApprovalMode` (`auto`, `prompt` ou `approve`)
pour émettre le `default_tools_approval_mode` natif de Codex pour un serveur de confiance.
OpenClaw supprime les métadonnées `codex` avant de transmettre la configuration native `mcp_servers`
à Codex.

### Définitions de serveurs MCP enregistrées

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

Remarques :

- `list` trie les noms de serveurs.
- `show` sans nom affiche l’objet complet du serveur MCP configuré.
- `status` classe les transports configurés sans établir de connexion. `--verbose` inclut les détails résolus concernant le lancement, les délais d’expiration, OAuth, les filtres et les appels parallèles.
- `doctor` effectue des vérifications statiques sans établir de connexion. Ajoutez `--probe` lorsque la commande doit également vérifier que les serveurs activés se connectent.
- `probe` se connecte et signale le nombre d’outils, la prise en charge des ressources et invites, la prise en charge des modifications de liste et les diagnostics.
- `add` accepte des options stdio telles que `--command`, `--arg`, `--env` et `--cwd`, ou des options HTTP telles que `--url`, `--transport`, `--header`, `--auth oauth`, ainsi que des options TLS, de délai d’expiration et de sélection des outils.
- `set` attend une valeur d’objet JSON sur la ligne de commande.
- `configure` met à jour l’activation, les filtres d’outils, les délais d’expiration, OAuth, TLS et les indications relatives aux appels d’outils parallèles sans remplacer l’intégralité de la définition du serveur. Ajoutez `--probe` pour vérifier le serveur mis à jour avant l’enregistrement.
- `tools` met à jour les filtres d’outils propres à chaque serveur. Les entrées d’inclusion et d’exclusion sont des noms d’outils MCP et des motifs glob simples `*`.
- `login` exécute le flux OAuth pour les serveurs HTTP configurés avec `auth: "oauth"`. La première exécution affiche une URL d’autorisation ; exécutez de nouveau la commande avec `--code` après l’approbation.
- `logout` efface les identifiants OAuth enregistrés pour le serveur nommé sans supprimer la définition de serveur enregistrée.
- `reload` libère les environnements d’exécution MCP en cours de processus mis en cache pour le processus CLI actuel uniquement. Les processus Gateway ou d’agent exécutés dans un autre processus nécessitent toujours leur propre mécanisme de rechargement ou de redémarrage.
- Utilisez `transport: "streamable-http"` pour les serveurs MCP HTTP diffusables. `openclaw mcp set` normalise également le `type: "http"` natif de la CLI vers la même forme de configuration canonique à des fins de compatibilité.
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

### Recettes courantes pour les serveurs

Ces exemples enregistrent uniquement les définitions de serveur. Exécutez ensuite `openclaw mcp doctor --probe` pour vérifier que le serveur démarre et expose des outils.

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

    Limitez les serveurs de système de fichiers à la plus petite arborescence de répertoires que l’agent doit pouvoir lire ou modifier.

  </Tab>
  <Tab title="Mémoire">
    ```bash
    openclaw mcp add memory \
      --command npx \
      --arg -y \
      --arg @modelcontextprotocol/server-memory
    openclaw mcp probe memory --json
    ```

    Utilisez un filtre d’outils si le serveur expose des outils d’écriture qui ne doivent pas être accessibles aux agents ordinaires.

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

    `doctor` vérifie que `cwd` existe et que la commande peut être résolue depuis l’environnement configuré.

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

    Utilisez OAuth lorsque le serveur distant le prend en charge. Si le serveur exige des en-têtes statiques, évitez de valider dans le dépôt des jetons Bearer littéraux.

  </Tab>
  <Tab title="Bureau/CUA">
    ```bash
    openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
    openclaw mcp tools cua-driver --include 'list_apps,observe,click,type'
    openclaw mcp doctor cua-driver --probe
    ```

    Les serveurs de contrôle direct du bureau héritent des autorisations du processus qu’ils lancent. Utilisez des filtres d’outils restrictifs et les demandes d’autorisation du système d’exploitation.

  </Tab>
</Tabs>

### Structures de sortie JSON

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
      "ok": true,
      "path": "/home/user/.openclaw/openclaw.json",
      "servers": [
        {
          "name": "docs",
          "ok": true,
          "issues": [
            {
              "level": "warning",
              "message": "Les identifiants OAuth ne sont pas autorisés ; exécutez openclaw mcp login docs"
            }
          ]
        }
      ]
    }
    ```

    `doctor --json` se termine avec un code différent de zéro lorsqu’un serveur activé et vérifié présente un problème de niveau `error`. Les problèmes `warning` et `info` sont signalés, mais ne provoquent pas à eux seuls l’échec de la commande.

  </Accordion>
  <Accordion title="probe --json">
    ```json
    {
      "generatedAt": "2026-05-31T09:00:00.000Z",
      "servers": {
        "docs": {
          "launch": "streamable-http https://mcp.example.com/mcp",
          "tools": 2,
          "resources": true,
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

    `probe --json` ouvre une session cliente MCP active et affiche directement son résultat ; contrairement à `status`/`doctor`, la sortie ne comporte aucun champ `path` de premier niveau. Les clés `resources` et `prompts` ne sont présentes que lorsque le serveur annonce réellement cette capacité (un serveur dépourvu d’invites omet la clé `prompts` au lieu d’indiquer `false`). Utilisez `probe` pour vérifier l’accessibilité et les capacités, et non pour auditer la configuration statique.

  </Accordion>
</AccordionGroup>

Exemple de structure de configuration :

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

### Transport Stdio

Lance un processus enfant local et communique via stdin/stdout.

| Champ                      | Description                       |
| -------------------------- | --------------------------------- |
| `command`                  | Exécutable à lancer (obligatoire)    |
| `args`                     | Tableau d’arguments de ligne de commande   |
| `env`                      | Variables d’environnement supplémentaires       |
| `cwd` / `workingDirectory` | Répertoire de travail du processus |

<Warning>
**Filtre de sécurité de l’environnement Stdio**

OpenClaw rejette les clés d’environnement de démarrage d’interpréteur, de détournement du chargeur et d’initialisation du shell avant de lancer un serveur MCP Stdio, même si elles figurent dans le bloc `env` d’un serveur. Cette opération utilise la même politique de sécurité de l’environnement hôte que les autres processus lancés par OpenClaw : elle bloque les points d’entrée de démarrage d’interpréteur connus (par exemple `NODE_OPTIONS`, `PYTHONSTARTUP`, `PERL5OPT`, `RUBYOPT`, `BASHOPTS`, `KSH_ENV`), les préfixes d’injection de bibliothèques partagées et de fonctions (`DYLD_*`, `LD_*`, `BASH_FUNC_*`), ainsi que les variables similaires de contrôle de l’environnement d’exécution. Au démarrage, ces variables sont supprimées silencieusement et un avertissement est consigné afin qu’elles ne puissent pas injecter un préambule implicite, remplacer l’interpréteur, activer un débogueur ou détourner l’éditeur de liens dynamique visant le processus Stdio. Une liste d’autorisation explicite permet de continuer à utiliser les variables d’environnement ordinaires d’identifiants MCP (`GITHUB_TOKEN`, `GH_TOKEN`, `GITLAB_TOKEN`, `NPM_TOKEN`, `NODE_AUTH_TOKEN`, `DATABASE_URL`, `MONGODB_URI`, `REDIS_URL`, `AMQP_URL`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_SESSION_TOKEN`, `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET`), ainsi que les variables d’environnement ordinaires de proxy et propres au serveur (`HTTP_PROXY`, `*_API_KEY` personnalisées, etc.). Les autres clés `AWS_*`, telles que `AWS_CONFIG_FILE` et `AWS_SHARED_CREDENTIALS_FILE`, restent bloquées, car elles désignent des fichiers d’identifiants au lieu de transporter directement une valeur d’identifiant.

Si votre serveur MCP a réellement besoin de l’une des variables bloquées, définissez-la sur le processus hôte du Gateway plutôt que sous le bloc `env` du serveur Stdio.
</Warning>

### Transport SSE / HTTP

Se connecte à un serveur MCP distant par l’intermédiaire d’événements envoyés par le serveur HTTP.

| Champ                          | Description                                                      |
| ------------------------------ | ---------------------------------------------------------------- |
| `url`                          | URL HTTP ou HTTPS du serveur distant (obligatoire)                |
| `headers`                      | Mappage clé-valeur facultatif d’en-têtes HTTP (par exemple, des jetons d’authentification) |
| `connectionTimeoutMs`          | Délai d’expiration de connexion propre au serveur en ms (facultatif)                   |
| `connectTimeout`               | Délai d’expiration de connexion propre au serveur en secondes (facultatif)              |
| `timeout` / `requestTimeoutMs` | Délai d’expiration des requêtes MCP propre au serveur, en secondes ou en ms                  |
| `auth: "oauth"`                | Utiliser les identifiants OAuth MCP enregistrés par `openclaw mcp login`          |
| `sslVerify`                    | Définir sur false uniquement pour les points de terminaison HTTPS privés explicitement approuvés    |
| `clientCert` / `clientKey`     | Chemins du certificat client mTLS et de sa clé                            |
| `supportsParallelToolCalls`    | Indique que les appels simultanés sont sûrs pour ce serveur              |

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

Les valeurs sensibles dans `url` (informations utilisateur) et `headers` sont masquées dans les journaux et la sortie d’état. `openclaw mcp doctor` émet un avertissement lorsque des entrées `headers` ou `env` qui semblent sensibles contiennent des valeurs littérales, afin que les opérateurs puissent retirer ces valeurs de la configuration validée dans le dépôt.

### Processus OAuth

OAuth est destiné aux serveurs MCP HTTP qui annoncent le flux OAuth MCP. Les en-têtes statiques `Authorization` sont ignorés pour un serveur lorsque `auth: "oauth"` est activé. Les identifiants enregistrés par `openclaw mcp login` fonctionnent avec le MCP intégré, les exécuteurs CLI et le serveur d’application Codex local.

Tant que les identifiants ne sont pas disponibles, OpenClaw omet uniquement ce serveur MCP de l’environnement d’exécution de l’agent au lieu de faire échouer le tour de l’agent. L’opérateur, ou un agent disposant d’un accès au shell, peut alors exécuter `openclaw mcp login <name>` et utiliser le serveur lors d’un tour ultérieur.

Lorsqu’un service MCP distant s’appuie déjà sur un profil d’authentification OpenClaw distinct capable d’actualiser les identifiants, vous pouvez éventuellement définir `oauth.authProfileId`. OpenClaw actualise l’une ou l’autre source d’identifiants avant la projection dans l’environnement d’exécution et transmet uniquement le jeton d’accès actuel au client MCP en aval.

<Steps>
  <Step title="Enregistrer le serveur">
    Ajoutez ou mettez à jour le serveur avec `auth: "oauth"` et les éventuelles métadonnées OAuth facultatives.

    ```bash
    openclaw mcp set docs '{"url":"https://mcp.example.com/mcp","transport":"streamable-http","auth":"oauth","oauth":{"scope":"docs.read"}}'
    ```

    Pour un jeton Bearer adossé à un profil d’authentification, enregistrez la liaison au profil :

    ```bash
    openclaw mcp set docs '{"url":"https://mcp.example.com/mcp","transport":"streamable-http","auth":"oauth","oauth":{"authProfileId":"docs:mcp"}}'
    ```

  </Step>
  <Step title="Démarrer la connexion">
    Exécutez la commande de connexion pour créer la demande d’autorisation.

    ```bash
    openclaw mcp login docs
    ```

    OpenClaw affiche l’URL d’autorisation et stocke l’état temporaire du vérificateur OAuth dans le répertoire d’état d’OpenClaw.

  </Step>
  <Step title="Terminer avec le code">
    Après avoir donné votre approbation dans le navigateur, transmettez le code renvoyé à OpenClaw.

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
    La déconnexion supprime les identifiants OAuth stockés, mais conserve la définition de serveur enregistrée.

    ```bash
    openclaw mcp logout docs
    ```

  </Step>
</Steps>

Si le fournisseur renouvelle les jetons ou si l’état d’autorisation reste bloqué, exécutez `openclaw mcp logout <name>`, puis répétez `login`. `logout` peut effacer les identifiants d’un serveur HTTP enregistré même après la suppression de `auth: "oauth"` de la configuration, tant que le nom et l’URL du serveur identifient toujours l’entrée du magasin d’identifiants.

### Transport HTTP avec diffusion en continu

`streamable-http` est une option de transport supplémentaire aux côtés de `sse` et `stdio`. Elle utilise la diffusion HTTP pour la communication bidirectionnelle avec les serveurs MCP distants.

| Champ                          | Description                                                                            |
| ------------------------------ | -------------------------------------------------------------------------------------- |
| `url`                          | URL HTTP ou HTTPS du serveur distant (obligatoire)                                      |
| `transport`                    | Définissez sur `"streamable-http"` pour sélectionner ce transport ; si cette valeur est omise, OpenClaw utilise `sse` |
| `headers`                      | Mappage clé-valeur facultatif d’en-têtes HTTP (par exemple, des jetons d’authentification)                       |
| `connectionTimeoutMs`          | Délai d’expiration de la connexion par serveur, en ms (facultatif)                                         |
| `connectTimeout`               | Délai d’expiration de la connexion par serveur, en secondes (facultatif)                                    |
| `timeout` / `requestTimeoutMs` | Délai d’expiration des requêtes MCP par serveur, en secondes ou en ms                                        |
| `auth: "oauth"`                | Utilise les identifiants OAuth MCP enregistrés par `openclaw mcp login`                                |
| `sslVerify`                    | Définissez sur false uniquement pour les points de terminaison HTTPS privés explicitement approuvés                          |
| `clientCert` / `clientKey`     | Chemins du certificat client mTLS et de sa clé                                                  |
| `supportsParallelToolCalls`    | Indique que les appels simultanés sont sûrs pour ce serveur                                    |

La configuration OpenClaw utilise `transport: "streamable-http"` comme orthographe canonique. Les valeurs `type: "http"` MCP natives de la CLI sont acceptées lorsqu’elles sont enregistrées au moyen de `openclaw mcp set` et réparées par `openclaw doctor --fix` dans une configuration existante, mais `transport` est la forme directement consommée par OpenClaw intégré.

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
Les commandes du registre ne démarrent pas le pont de canal. Seuls `probe` et `doctor --probe` ouvrent une session cliente MCP active pour vérifier que le serveur cible est accessible.
</Note>

## Interface de contrôle

L’interface de contrôle dans le navigateur comprend une page dédiée aux paramètres MCP à l’emplacement `/settings/mcp` ; l’ancien chemin `/mcp` reste un alias. La page affiche le nombre de serveurs configurés, des récapitulatifs des serveurs activés, OAuth et filtrés, des lignes de transport par serveur, des commandes d’activation et de désactivation, les commandes CLI courantes et un éditeur limité à la section de configuration `mcp`.

Utilisez cette page pour les modifications effectuées par l’opérateur et les inventaires rapides. Utilisez `openclaw mcp doctor --probe` ou `openclaw mcp probe` lorsqu’une vérification active du serveur est nécessaire.

Procédure pour l’opérateur :

1. Ouvrez l’interface de contrôle et choisissez **MCP**.
2. Consultez les cartes récapitulatives indiquant le nombre total de serveurs, ainsi que les serveurs activés, OAuth et filtrés.
3. Utilisez chaque ligne de serveur pour obtenir des indications sur le transport, l’authentification, le filtre, le délai d’expiration et les commandes.
4. Basculez l’activation lorsque vous souhaitez conserver une définition tout en l’excluant de la découverte à l’exécution.
5. Modifiez la section de configuration `mcp` concernée pour apporter des changements structurels, tels que de nouveaux serveurs, des en-têtes, TLS, des métadonnées OAuth ou des filtres d’outils.
6. Choisissez **Enregistrer** pour conserver uniquement la configuration, ou **Enregistrer et publier** pour l’appliquer par l’intermédiaire du chemin de configuration du Gateway.
7. Exécutez `openclaw mcp doctor --probe` lorsqu’il est nécessaire de vérifier en direct que le serveur modifié démarre et répertorie les outils.

Remarques :

- les extraits de commande placent les noms de serveurs entre guillemets afin que les noms inhabituels restent copiables dans un shell
- les valeurs affichées ressemblant à des URL sont expurgées avant le rendu lorsqu’elles contiennent des identifiants intégrés
- la page ne démarre pas elle-même les transports MCP
- les environnements d’exécution actifs peuvent nécessiter `openclaw mcp reload`, la publication de la configuration du Gateway ou le redémarrage du processus, selon le processus qui possède les clients MCP

## Applications MCP

OpenClaw peut afficher les outils qui implémentent l’[extension MCP Apps](https://modelcontextprotocol.io/extensions/apps) stable. Les applications sont facultatives, car leur code HTML provient du serveur MCP configuré et peut demander des outils ou des ressources visibles par l’application auprès de ce même serveur.

Activez le pont hôte :

```bash
openclaw config set mcp.apps.enabled true --strict-json
```

Redémarrez le Gateway après avoir modifié ce paramètre. Lorsqu’il est activé, OpenClaw démarre un écouteur HTTP(S) réservé au bac à sable sur le port du Gateway plus un (pour le Gateway par défaut, `18790`). L’interface de contrôle charge les applications depuis cette origine distincte ; l’écouteur ne fournit jamais l’interface de contrôle, les routes authentifiées du Gateway ni les données utilisateur.

Les connexions directes au Gateway doivent avoir accès aux deux ports. Si un proxy inverse ou un terminateur TLS expose l’interface de contrôle, attribuez aux applications une origine publique dédiée et transmettez uniquement cette origine vers l’écouteur du bac à sable :

```json5
{
  mcp: {
    apps: {
      enabled: true,
      sandboxOrigin: "https://mcp-apps.example.com",
      sandboxPort: 18790,
    },
  },
}
```

L’origine du bac à sable doit être différente de celle de l’interface de contrôle. N’y hébergez aucun autre contenu authentifié ou sensible.

Par exemple, la démonstration React de base officielle peut être configurée comme suit :

```json5
{
  mcp: {
    apps: { enabled: true },
    servers: {
      "basic-react": {
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-basic-react", "--stdio"],
      },
    },
  },
}
```

Comportement et limites de sécurité :

- OpenClaw annonce l’extension `io.modelcontextprotocol/ui` uniquement lorsque les applications sont activées.
- Seules les ressources `ui://` dont le type MIME correspond exactement à `text/html;profile=mcp-app` sont affichées.
- Les ressources d’interface utilisateur sont limitées à 2 Mio, placées derrière un proxy à double iframe sur une origine externe dédiée, chargées dans une origine d’application interne opaque et soumises à une CSP dérivée des métadonnées de la ressource.
- Les outils réservés aux applications (`_meta.ui.visibility: ["app"]`) restent exclus des listes d’outils du modèle. Les applications peuvent appeler uniquement les outils visibles par les applications sur leur serveur propriétaire qui respectent également la politique d’outils OpenClaw effective pour l’exécution ayant créé la vue.
- Les autorisations d’application liées à l’origine, telles que l’accès à la caméra, au microphone et à la géolocalisation, ne sont pas accordées tant que les documents internes des applications utilisent des origines opaques pour assurer l’isolation entre les applications.
- Le code HTML de l’application, les arguments complets des outils et les résultats bruts résident dans un bail de vue en mémoire limité à dix minutes et ne sont ni écrits sur le disque ni copiés dans les métadonnées d’aperçu de la transcription. La transcription stocke uniquement un descripteur limité de serveur, d’outil et de ressource lié à l’identifiant d’origine de l’appel d’outil. Après le redémarrage d’un Gateway, l’interface de contrôle peut vérifier ce descripteur par rapport à la transcription de la session authentifiée et récupérer de nouveau la ressource `ui://` ; les vues reconstruites sont en lecture seule jusqu’à ce qu’une nouvelle exécution établisse les autorisations d’outils actuelles.
- `openclaw security audit` affiche un avertissement tant que le pont est activé. Désactivez-le avec `openclaw config set mcp.apps.enabled false --strict-json` lorsqu’il n’est pas nécessaire.

## Limites actuelles

Cette page décrit le pont tel qu’il est fourni aujourd’hui.

Limites actuelles :

- la découverte des conversations dépend des métadonnées existantes des routes de session du Gateway
- aucun protocole d’envoi générique au-delà de l’adaptateur propre à Claude
- aucun outil de modification de message ou de réaction pour le moment
- le transport HTTP/SSE/streamable-http se connecte à un seul serveur distant ; aucun multiplexage en amont pour le moment
- `permissions_list_open` inclut uniquement les approbations observées pendant que le pont est connecté

## Pages connexes

- [Référence de la CLI](/fr/cli)
- [Plugins](/fr/cli/plugins)
