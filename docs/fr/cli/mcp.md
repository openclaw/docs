---
read_when:
    - Connexion de Codex, Claude Code ou d’un autre client MCP à des canaux pris en charge par OpenClaw
    - Exécution de `openclaw mcp serve`
    - Gestion des définitions de serveurs MCP enregistrées par OpenClaw
sidebarTitle: MCP
summary: Exposez les conversations des canaux OpenClaw via MCP et gérez les définitions de serveurs MCP enregistrées
title: MCP
x-i18n:
    generated_at: "2026-07-12T15:11:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 5753ffb716794edcdfa2c3cdd370bd33173b6d30785f135e84933dcd628bbe54
    source_path: cli/mcp.md
    workflow: 16
---

`openclaw mcp` remplit deux fonctions :

- exécuter OpenClaw en tant que serveur MCP avec `openclaw mcp serve`
- gérer les définitions de serveurs MCP sortants administrées par OpenClaw avec `list`, `show`, `status`, `doctor`, `probe`, `add`, `set`, `configure`, `tools`, `login`, `logout`, `reload` et `unset`

Avec `serve`, OpenClaw agit en tant que serveur MCP. Avec les autres sous-commandes, OpenClaw agit en tant que registre côté client MCP pour les serveurs que ses propres environnements d’exécution pourront utiliser ultérieurement.

<Note>
  `list`, `show`, `set` et `unset` lisent et écrivent uniquement les entrées `mcp.servers` administrées par OpenClaw dans la configuration d’OpenClaw. Elles n’incluent pas les serveurs mcporter de `config/mcporter.json` ; utilisez `mcporter list` pour ce registre.
</Note>

Utilisez [`openclaw acp`](/fr/cli/acp) lorsqu’OpenClaw doit héberger lui-même une session d’environnement de développement et acheminer cet environnement d’exécution via ACP.

## Choisir le bon mode d’utilisation de MCP

| Objectif                                                                | Utilisation                                                                  | Pourquoi                                                                                                             |
| ------------------------------------------------------------------- | -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Permettre à un client MCP externe de lire et d’envoyer des conversations de canaux OpenClaw | `openclaw mcp serve`                                                 | OpenClaw est le serveur MCP et expose via stdio les conversations prises en charge par le Gateway.                                 |
| Enregistrer des serveurs MCP tiers pour les exécutions d’agents administrées par OpenClaw        | `openclaw mcp add`, `set`, `configure`, `tools`, `login`             | OpenClaw est le registre côté client MCP et projette ensuite ces serveurs dans les environnements d’exécution compatibles.               |
| Vérifier un serveur enregistré sans exécuter un tour d’agent                  | `openclaw mcp status`, `doctor`, `probe`                             | `status` et `doctor` inspectent la configuration ; `probe` ouvre une connexion MCP active et répertorie les fonctionnalités.               |
| Modifier la configuration MCP depuis un navigateur                                      | Interface de contrôle `/settings/mcp` (alias `/mcp`)                            | La page affiche l’inventaire, l’activation, les résumés OAuth et des filtres, des suggestions de commandes et un éditeur `mcp` ciblé.         |
| Fournir à Codex app-server un serveur MCP natif ciblé                    | `mcp.servers.<name>.codex`                                           | Le bloc `codex` affecte uniquement la projection des fils de discussion de Codex app-server et est retiré avant la transmission de la configuration native. |
| Exécuter des sessions d’environnement hébergées par ACP                                     | [`openclaw acp`](/fr/cli/acp) et [Agents ACP](/fr/tools/acp-agents-setup) | Le mode pont ACP n’accepte pas l’injection de serveurs MCP par session ; configurez plutôt des ponts de Gateway ou de Plugin.     |

<Tip>
Si vous ne savez pas quel mode utiliser, commencez par `openclaw mcp status --verbose`. Cette commande indique ce qu’OpenClaw a enregistré sans démarrer de serveur MCP.
</Tip>

## OpenClaw en tant que serveur MCP

Il s’agit du mode `openclaw mcp serve`.

### Quand utiliser serve

Utilisez `openclaw mcp serve` lorsque :

- Codex, Claude Code ou un autre client MCP doit communiquer directement avec des conversations de canaux prises en charge par OpenClaw
- vous disposez déjà d’un Gateway OpenClaw local ou distant avec des sessions acheminées
- vous souhaitez utiliser un serveur MCP unique fonctionnant avec tous les systèmes de canaux d’OpenClaw, plutôt que d’exécuter des ponts distincts pour chaque canal

Utilisez plutôt [`openclaw acp`](/fr/cli/acp) lorsqu’OpenClaw doit héberger lui-même l’environnement d’exécution de développement et conserver la session de l’agent dans OpenClaw.

### Fonctionnement

`openclaw mcp serve` démarre un serveur MCP stdio. Le client MCP est propriétaire de ce processus. Tant que le client maintient la session stdio ouverte, le pont se connecte à un Gateway OpenClaw local ou distant via WebSocket et expose les conversations de canaux acheminées via MCP.

<Steps>
  <Step title="Le client lance le pont">
    Le client MCP lance `openclaw mcp serve`.
  </Step>
  <Step title="Le pont se connecte au Gateway">
    Le pont se connecte au Gateway OpenClaw via WebSocket.
  </Step>
  <Step title="Les sessions deviennent des conversations MCP">
    Les sessions acheminées deviennent des conversations MCP et des outils de transcription et d’historique.
  </Step>
  <Step title="Mise en file d’attente des événements en direct">
    Les événements en direct sont mis en file d’attente en mémoire tant que le pont est connecté.
  </Step>
  <Step title="Notifications push Claude facultatives">
    Si le mode de canal Claude est activé, la même session peut également recevoir des notifications push propres à Claude.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Comportement important">
    - l’état de la file d’attente en direct commence lorsque le pont se connecte
    - l’historique antérieur des transcriptions est lu avec `messages_read`
    - les notifications push Claude n’existent que tant que la session MCP est active
    - lorsque le client se déconnecte, le pont s’arrête et la file d’attente en direct disparaît
    - les points d’entrée d’agent ponctuels tels que `openclaw agent` et `openclaw infer model run` arrêtent tous les environnements d’exécution MCP intégrés qu’ils ouvrent une fois la réponse terminée, afin que les exécutions répétées par script n’accumulent pas de processus enfants MCP stdio
    - les serveurs MCP stdio lancés par OpenClaw, qu’ils soient intégrés ou configurés par l’utilisateur, sont arrêtés avec toute leur arborescence de processus lors de l’arrêt, afin que les sous-processus enfants démarrés par le serveur ne survivent pas après l’arrêt du client stdio parent
    - la suppression ou la réinitialisation d’une session libère les clients MCP de cette session via le mécanisme partagé de nettoyage des environnements d’exécution, de sorte qu’aucune connexion stdio persistante ne reste associée à une session supprimée

  </Accordion>
</AccordionGroup>

### Choisir un mode client

<Tabs>
  <Tab title="Clients MCP génériques">
    Outils MCP standard uniquement. Utilisez `conversations_list`, `messages_read`, `events_poll`, `events_wait`, `messages_send` et les outils d’approbation.
  </Tab>
  <Tab title="Claude Code">
    Outils MCP standard avec l’adaptateur de canal propre à Claude. Activez `--claude-channel-mode on` ou conservez la valeur par défaut `auto`.
  </Tab>
</Tabs>

<Note>
Actuellement, `auto` se comporte comme `on`. La détection des fonctionnalités du client n’est pas encore disponible.
</Note>

### Éléments exposés par serve

Le pont utilise les métadonnées existantes d’acheminement des sessions du Gateway pour exposer les conversations prises en charge par les canaux. Une conversation apparaît lorsqu’OpenClaw possède déjà un état de session avec un itinéraire connu, tel que :

- `channel`
- les métadonnées du destinataire ou de la destination
- un `accountId` facultatif
- un `threadId` facultatif

Les clients MCP disposent ainsi d’un emplacement unique pour :

- répertorier les conversations récentes acheminées
- lire l’historique récent des transcriptions
- attendre de nouveaux événements entrants
- renvoyer une réponse via le même itinéraire
- voir les demandes d’approbation reçues tant que le pont est connecté

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

### Outils du pont

<AccordionGroup>
  <Accordion title="conversations_list">
    Répertorie les conversations récentes liées à des sessions qui possèdent déjà des métadonnées d’acheminement dans l’état des sessions du Gateway.

    Filtres : `limit` (500 maximum), `search`, `channel`, `includeDerivedTitles`, `includeLastMessage`.

  </Accordion>
  <Accordion title="conversation_get">
    Renvoie une conversation à partir de `session_key` en effectuant une recherche directe de session dans le Gateway.
  </Accordion>
  <Accordion title="messages_read">
    Lit les messages récents de la transcription d’une conversation liée à une session. La valeur par défaut de `limit` est 20, avec un maximum de 200.
  </Accordion>
  <Accordion title="attachments_fetch">
    Extrait les blocs de contenu non textuel d’un message de transcription. Il s’agit d’une vue des métadonnées du contenu de la transcription, et non d’un stockage autonome et persistant d’objets de pièces jointes.
  </Accordion>
  <Accordion title="events_poll">
    Lit les événements en direct mis en file d’attente depuis un curseur numérique. La valeur maximale de `limit` est 200.
  </Accordion>
  <Accordion title="events_wait">
    Effectue une interrogation longue jusqu’à l’arrivée du prochain événement en file d’attente correspondant ou jusqu’à l’expiration du délai (30 s par défaut, 300 s maximum).

    Utilisez cette fonction lorsqu’un client MCP générique a besoin d’une remise presque en temps réel sans protocole push propre à Claude.

  </Accordion>
  <Accordion title="messages_send">
    Renvoie du texte via le même itinéraire que celui déjà enregistré pour la session.

    Comportement actuel :

    - nécessite un itinéraire de conversation existant
    - utilise le canal, le destinataire, l’identifiant de compte et l’identifiant de fil de discussion de la session
    - envoie uniquement du texte

  </Accordion>
  <Accordion title="permissions_list_open">
    Répertorie les demandes d’approbation d’exécution ou de Plugin en attente que le pont a observées depuis sa connexion au Gateway.
  </Accordion>
  <Accordion title="permissions_respond">
    Résout une demande d’approbation d’exécution ou de Plugin en attente avec :

    - `allow-once`
    - `allow-always`
    - `deny`

  </Accordion>
</AccordionGroup>

### Modèle d’événements

Le pont conserve une file d’attente d’événements en mémoire tant qu’il est connecté.

Types d’événements actuels :

- `message`
- `exec_approval_requested`
- `exec_approval_resolved`
- `plugin_approval_requested`
- `plugin_approval_resolved`
- `claude_permission_request`

<Warning>
- la file d’attente ne contient que les événements en direct ; elle démarre avec le pont MCP
- `events_poll` et `events_wait` ne relisent pas eux-mêmes l’historique antérieur du Gateway
- l’historique persistant doit être lu avec `messages_read`

</Warning>

### Notifications de canal Claude

Le pont peut également exposer des notifications de canal propres à Claude. Il s’agit de l’équivalent OpenClaw d’un adaptateur de canal Claude Code : les outils MCP standard restent disponibles, mais les messages entrants en direct peuvent également arriver sous forme de notifications MCP propres à Claude.

<Tabs>
  <Tab title="off">
    `--claude-channel-mode off` : outils MCP standard uniquement.
  </Tab>
  <Tab title="on">
    `--claude-channel-mode on` : active les notifications de canal Claude.
  </Tab>
  <Tab title="auto (par défaut)">
    `--claude-channel-mode auto` : valeur par défaut actuelle ; même comportement du pont qu’avec `on`.
  </Tab>
</Tabs>

Lorsque le mode de canal Claude est activé, le serveur annonce les fonctionnalités expérimentales de Claude et peut émettre :

- `notifications/claude/channel`
- `notifications/claude/channel/permission`

Comportement actuel du pont :

- les messages de transcription `user` entrants sont transmis sous forme de `notifications/claude/channel`
- les demandes d’autorisation Claude reçues via MCP sont suivies en mémoire
- si le propriétaire de la commande dans la conversation liée envoie ensuite `yes <id>` ou `no <id>` (`<id>` est l’identifiant de demande à 5 lettres, sans `l`), le pont convertit ce message en `notifications/claude/channel/permission`
- ces notifications n’existent que pendant la session active ; si le client MCP se déconnecte, aucune cible push n’est disponible

Ce comportement est volontairement propre au client. Les clients MCP génériques doivent s’appuyer sur les outils d’interrogation standard.

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

Pour la plupart des clients MCP génériques, commencez par l’ensemble d’outils standard et ignorez le mode Claude. Activez le mode Claude uniquement pour les clients qui prennent réellement en charge les méthodes de notification propres à Claude.

### Options

`openclaw mcp serve` prend en charge :

<ParamField path="--url" type="string">
  URL WebSocket du Gateway. Utilise par défaut `gateway.remote.url` lorsqu’il est configuré.
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
  Mode de notification de Claude. Valeur par défaut : `auto`.
</ParamField>
<ParamField path="-v, --verbose" type="boolean">
  Journaux détaillés sur stderr.
</ParamField>

<Tip>
Préférez `--token-file` ou `--password-file` aux secrets en ligne de commande lorsque cela est possible.
</Tip>

### Sécurité et frontière de confiance

Le pont n’invente pas le routage. Il expose uniquement les conversations que le Gateway sait déjà acheminer.

Cela signifie que :

- les listes d’expéditeurs autorisés, l’association et la confiance au niveau du canal relèvent toujours de la configuration du canal OpenClaw sous-jacent
- `messages_send` peut uniquement répondre par l’intermédiaire d’une route existante enregistrée
- l’état des approbations est actif et conservé uniquement en mémoire pour la session actuelle du pont
- l’authentification du pont doit utiliser les mêmes contrôles de jeton ou de mot de passe du Gateway que ceux auxquels vous feriez confiance pour tout autre client distant du Gateway

Si une conversation est absente de `conversations_list`, la cause habituelle n’est pas la configuration MCP. Il s’agit de métadonnées de routage manquantes ou incomplètes dans la session du Gateway sous-jacente.

### Tests

OpenClaw fournit un test de fumée Docker déterministe pour ce pont :

```bash
pnpm test:docker:mcp-channels
```

Ce test de fumée exécute un seul conteneur : il initialise l’état des conversations, démarre le Gateway, puis lance `openclaw mcp serve` comme processus enfant stdio et le pilote en tant que client MCP. Il vérifie la découverte des conversations, la lecture des transcriptions, la lecture des métadonnées des pièces jointes, le comportement de la file d’événements en direct, ainsi que les notifications de canal et d’autorisation de style Claude sur le véritable pont MCP stdio. Le routage des envois sortants (`messages_send` réutilisant la route de conversation enregistrée) est couvert séparément par les tests unitaires dans `src/mcp/channel-server.test.ts`.

C’est le moyen le plus rapide de prouver que le pont fonctionne sans intégrer un véritable compte Telegram, Discord ou iMessage à l’exécution du test.

Pour un contexte de test plus général, consultez [Tests](/fr/help/testing).

### Résolution des problèmes

<AccordionGroup>
  <Accordion title="Aucune conversation renvoyée">
    Cela signifie généralement que la session du Gateway ne peut pas déjà être acheminée. Vérifiez que la session sous-jacente contient des métadonnées de routage enregistrées pour le canal ou fournisseur, le destinataire et, éventuellement, le compte ou fil de discussion.
  </Accordion>
  <Accordion title="events_poll ou events_wait omet les anciens messages">
    C’est normal. La file en direct démarre lorsque le pont se connecte. Lisez l’historique antérieur des transcriptions avec `messages_read`.
  </Accordion>
  <Accordion title="Les notifications de Claude ne s’affichent pas">
    Vérifiez tous les points suivants :

    - le client a maintenu la session MCP stdio ouverte
    - `--claude-channel-mode` est défini sur `on` ou `auto`
    - le client comprend effectivement les méthodes de notification propres à Claude
    - le message entrant est arrivé après la connexion du pont

  </Accordion>
  <Accordion title="Les approbations sont absentes">
    `permissions_list_open` affiche uniquement les demandes d’approbation observées pendant que le pont était connecté. Il ne s’agit pas d’une API durable d’historique des approbations.
  </Accordion>
</AccordionGroup>

## OpenClaw comme registre de clients MCP

Il s’agit du parcours `openclaw mcp list`, `show`, `status`, `doctor`, `probe`, `add`, `set`,
`configure`, `tools`, `login`, `logout`, `reload` et `unset`.

Ces commandes n’exposent pas OpenClaw via MCP. Elles gèrent les définitions de serveurs MCP administrées par OpenClaw sous `mcp.servers` dans la configuration d’OpenClaw. Elles ne lisent pas les serveurs mcporter depuis `config/mcporter.json`.

Ces définitions enregistrées sont destinées aux environnements d’exécution qu’OpenClaw lancera ou configurera ultérieurement, comme OpenClaw intégré et d’autres adaptateurs d’environnement d’exécution. OpenClaw stocke les définitions de manière centralisée afin que ces environnements d’exécution n’aient pas à conserver leurs propres listes de serveurs MCP en double.

<AccordionGroup>
  <Accordion title="Comportement important">
    - ces commandes lisent ou écrivent uniquement la configuration d’OpenClaw
    - `status`, `list`, `show`, `doctor` sans `--probe`, `set`, `configure`, `tools`, `logout`, `reload` et `unset` ne se connectent pas au serveur MCP cible
    - `login` exécute le flux réseau OAuth MCP pour le serveur HTTP configuré et enregistre les identifiants locaux obtenus
    - `status --verbose` affiche le transport résolu, l’authentification, le délai d’expiration, le filtre et les indications d’appels d’outils parallèles sans se connecter
    - `doctor` vérifie les définitions enregistrées à la recherche de problèmes de configuration locale, tels que des commandes stdio manquantes, des répertoires de travail non valides, des fichiers TLS manquants, des serveurs désactivés, des valeurs sensibles littérales dans les en-têtes ou variables d’environnement et une autorisation OAuth incomplète
    - `doctor --probe` ajoute la même preuve de connexion en direct que `probe` une fois les vérifications statiques réussies
    - `probe` se connecte au serveur sélectionné ou à tous les serveurs configurés, répertorie les outils et signale les fonctionnalités et diagnostics
    - `add` construit une définition à partir des options et la teste avant de l’enregistrer, sauf si `--no-probe` est défini ou si une autorisation OAuth est d’abord nécessaire
    - les adaptateurs d’environnement d’exécution déterminent les formes de transport qu’ils prennent effectivement en charge au moment de l’exécution
    - `enabled: false` conserve un serveur enregistré, mais l’exclut de la découverte par l’environnement d’exécution intégré
    - `timeout` et `connectTimeout` définissent les délais d’expiration des requêtes et connexions par serveur, en secondes
    - `supportsParallelToolCalls: true` désigne les serveurs que les adaptateurs peuvent appeler simultanément
    - les serveurs HTTP peuvent utiliser des en-têtes statiques, une connexion OAuth, le contrôle de la vérification TLS et des chemins de certificat et de clé mTLS
    - OpenClaw intégré expose les outils MCP configurés dans les profils d’outils normaux `coding` et `messaging` ; `minimal` les masque toujours et `tools.deny: ["bundle-mcp"]` les désactive explicitement
    - les propriétés `toolFilter.include` et `toolFilter.exclude` de chaque serveur filtrent les outils MCP découverts avant qu’ils ne deviennent des outils OpenClaw
    - les serveurs qui annoncent des ressources ou des invites exposent également des outils utilitaires permettant de répertorier ou lire les ressources et de répertorier ou récupérer les invites ; ces noms d’utilitaires générés (`resources_list`, `resources_read`, `prompts_list`, `prompts_get`) utilisent le même filtre d’inclusion et d’exclusion
    - les modifications dynamiques de la liste d’outils MCP invalident le catalogue mis en cache pour cette session ; la découverte ou l’utilisation suivante l’actualise depuis le serveur
    - les échecs répétés de requêtes d’outils ou de protocole MCP suspendent brièvement ce serveur afin qu’un serveur défaillant ne consomme pas l’intégralité du tour
    - les environnements d’exécution MCP groupés et limités à une session sont libérés après `mcp.sessionIdleTtlMs` millisecondes d’inactivité (10 minutes par défaut ; définissez `0` pour désactiver ce comportement), et les exécutions intégrées ponctuelles les nettoient à la fin de l’exécution

  </Accordion>
</AccordionGroup>

Les adaptateurs d’environnement d’exécution peuvent normaliser ce registre partagé selon la forme attendue par leur client en aval. Par exemple, OpenClaw intégré consomme directement les valeurs `transport` d’OpenClaw, tandis que Claude Code et Gemini reçoivent des valeurs `type` natives de la CLI, telles que `http`, `sse` ou `stdio`.

Le serveur d’application Codex respecte également un bloc facultatif `codex` sur chaque serveur. Il s’agit
de métadonnées de projection OpenClaw réservées aux fils de discussion du serveur d’application Codex ; elles ne
modifient pas les sessions ACP, la configuration générique du harnais Codex ni les autres adaptateurs d’environnement d’exécution.
Utilisez une valeur `codex.agents` non vide pour projeter un serveur uniquement dans des identifiants
d’agents OpenClaw précis. Les listes d’agents vides, ne contenant que des espaces ou non valides sont rejetées par la validation
de la configuration et omises par le parcours de projection de l’environnement d’exécution au lieu de devenir
globales. Utilisez `codex.defaultToolsApprovalMode` (`auto`, `prompt` ou `approve`)
pour émettre la valeur native `default_tools_approval_mode` de Codex pour un serveur de confiance.
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

- `list` trie les noms des serveurs.
- `show` sans nom affiche l’objet complet des serveurs MCP configurés.
- `status` classe les transports configurés sans se connecter. `--verbose` inclut les détails résolus du lancement, des délais d’expiration, d’OAuth, des filtres et des appels parallèles.
- `doctor` effectue des vérifications statiques sans se connecter. Ajoutez `--probe` lorsque la commande doit également vérifier que les serveurs activés peuvent se connecter.
- `probe` se connecte et signale le nombre d’outils, la prise en charge des ressources et invites, la prise en charge des changements de liste et les diagnostics.
- `add` accepte des options stdio telles que `--command`, `--arg`, `--env` et `--cwd`, ou des options HTTP telles que `--url`, `--transport`, `--header`, `--auth oauth`, ainsi que des options TLS, de délai d’expiration et de sélection des outils.
- `set` attend une valeur d’objet JSON sur la ligne de commande.
- `configure` met à jour l’activation, les filtres d’outils, les délais d’expiration, OAuth, TLS et les indications d’appels d’outils parallèles sans remplacer la définition complète du serveur. Ajoutez `--probe` pour vérifier le serveur mis à jour avant l’enregistrement.
- `tools` met à jour les filtres d’outils par serveur. Les entrées d’inclusion et d’exclusion sont des noms d’outils MCP et des motifs simples avec `*`.
- `login` exécute le flux OAuth pour les serveurs HTTP configurés avec `auth: "oauth"`. La première exécution affiche une URL d’autorisation ; relancez la commande avec `--code` après l’approbation.
- `logout` efface les identifiants OAuth enregistrés pour le serveur nommé sans supprimer sa définition enregistrée.
- `reload` libère les environnements d’exécution MCP en processus mis en cache uniquement pour le processus CLI actuel. Les processus Gateway ou d’agent exécutés dans un autre processus nécessitent toujours leur propre parcours de rechargement ou de redémarrage.
- Utilisez `transport: "streamable-http"` pour les serveurs MCP HTTP diffusables. `openclaw mcp set` normalise également la valeur native de la CLI `type: "http"` vers la même forme de configuration canonique à des fins de compatibilité.
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

Ces exemples enregistrent uniquement les définitions des serveurs. Exécutez ensuite `openclaw mcp doctor --probe` pour prouver que le serveur démarre et expose des outils.

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

    Utilisez un filtre d’outils si le serveur expose des outils d’écriture qui ne doivent pas être accessibles aux agents normaux.

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

    Utilisez OAuth lorsque le serveur distant le prend en charge. Si le serveur exige des en-têtes statiques, évitez de valider dans le dépôt des jetons porteurs en clair.

  </Tab>
  <Tab title="Bureau/CUA">
    ```bash
    openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
    openclaw mcp tools cua-driver --include 'list_apps,observe,click,type'
    openclaw mcp doctor cua-driver --probe
    ```

    Les serveurs de contrôle direct du bureau héritent des autorisations du processus qu'ils lancent. Utilisez des filtres d'outils restrictifs et les invites d'autorisation du système d'exploitation.

  </Tab>
</Tabs>

### Structures de sortie JSON

Utilisez `--json` pour les scripts et les tableaux de bord. Les ensembles de champs peuvent s'enrichir au fil du temps ; les consommateurs doivent donc ignorer les clés inconnues.

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

    `doctor --json` se termine avec un code différent de zéro lorsqu'un serveur activé et vérifié présente un problème de niveau `error`. Les problèmes `warning` et `info` sont signalés, mais ne font pas échouer la commande à eux seuls.

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

    `probe --json` ouvre une session cliente MCP active et affiche directement son résultat ; contrairement à `status`/`doctor`, la sortie ne comporte aucun champ `path` de premier niveau. Les clés `resources` et `prompts` ne sont présentes que lorsque le serveur annonce réellement cette capacité (un serveur sans invites omet la clé `prompts` au lieu d'indiquer `false`). Utilisez `probe` pour prouver l'accessibilité et les capacités, et non pour les audits de configuration statique.

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

### Transport stdio

Lance un processus enfant local et communique via stdin/stdout.

| Champ                      | Description                                      |
| -------------------------- | ------------------------------------------------ |
| `command`                  | Exécutable à lancer (obligatoire)                |
| `args`                     | Tableau d'arguments de ligne de commande         |
| `env`                      | Variables d'environnement supplémentaires       |
| `cwd` / `workingDirectory` | Répertoire de travail du processus               |

<Warning>
**Filtre de sécurité de l'environnement stdio**

OpenClaw rejette les clés d'environnement de démarrage d'interpréteur, de détournement de chargeur et d'initialisation de shell avant de lancer un serveur MCP stdio, même si elles figurent dans le bloc `env` d'un serveur. Cette opération utilise la même politique de sécurité de l'environnement hôte que les autres processus lancés par OpenClaw : elle bloque les mécanismes de démarrage connus des interpréteurs (par exemple `NODE_OPTIONS`, `PYTHONSTARTUP`, `PERL5OPT`, `RUBYOPT`, `BASHOPTS`, `KSH_ENV`), les préfixes d'injection de bibliothèques partagées et de fonctions (`DYLD_*`, `LD_*`, `BASH_FUNC_*`), ainsi que les variables similaires contrôlant l'exécution. Au démarrage, ces variables sont supprimées silencieusement et un avertissement est consigné afin qu'elles ne puissent pas injecter un préambule implicite, remplacer l'interpréteur, activer un débogueur ou détourner l'éditeur de liens dynamique à l'encontre du processus stdio. Une liste d'autorisation explicite permet de continuer à utiliser les variables d'environnement ordinaires contenant des identifiants MCP (`GITHUB_TOKEN`, `GH_TOKEN`, `GITLAB_TOKEN`, `NPM_TOKEN`, `NODE_AUTH_TOKEN`, `DATABASE_URL`, `MONGODB_URI`, `REDIS_URL`, `AMQP_URL`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_SESSION_TOKEN`, `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET`), ainsi que les variables ordinaires de proxy et propres au serveur (`HTTP_PROXY`, variables `*_API_KEY` personnalisées, etc.). Les autres clés `AWS_*`, telles que `AWS_CONFIG_FILE` et `AWS_SHARED_CREDENTIALS_FILE`, restent bloquées, car elles pointent vers des fichiers d'identifiants au lieu de contenir directement une valeur d'identification.

Si votre serveur MCP a réellement besoin de l'une des variables bloquées, définissez-la sur le processus hôte du Gateway plutôt que dans l'élément `env` du serveur stdio.
</Warning>

### Transport SSE / HTTP

Se connecte à un serveur MCP distant via les événements envoyés par le serveur HTTP.

| Champ                          | Description                                                                         |
| ------------------------------ | ----------------------------------------------------------------------------------- |
| `url`                          | URL HTTP ou HTTPS du serveur distant (obligatoire)                                  |
| `headers`                      | Mappage clé-valeur facultatif des en-têtes HTTP (par exemple, des jetons d'authentification) |
| `connectionTimeoutMs`          | Délai d'expiration de connexion par serveur en ms (facultatif)                      |
| `connectTimeout`               | Délai d'expiration de connexion par serveur en secondes (facultatif)                |
| `timeout` / `requestTimeoutMs` | Délai d'expiration des requêtes MCP par serveur en secondes ou en ms                |
| `auth: "oauth"`                | Utiliser les identifiants OAuth MCP enregistrés par `openclaw mcp login`            |
| `sslVerify`                    | Définir sur false uniquement pour les points de terminaison HTTPS privés explicitement approuvés |
| `clientCert` / `clientKey`     | Chemins du certificat et de la clé client mTLS                                      |
| `supportsParallelToolCalls`    | Indique que les appels simultanés sont sûrs pour ce serveur                         |

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

Les valeurs sensibles dans `url` (informations utilisateur) et `headers` sont masquées dans les journaux et la sortie d'état. `openclaw mcp doctor` avertit lorsque des entrées `headers` ou `env` apparemment sensibles contiennent des valeurs littérales, afin que les opérateurs puissent retirer ces valeurs de la configuration validée dans le dépôt.

### Flux de travail OAuth

OAuth est destiné aux serveurs MCP HTTP qui annoncent le flux OAuth MCP. Les en-têtes `Authorization` statiques sont ignorés pour un serveur lorsque `auth: "oauth"` est activé. Les identifiants enregistrés par `openclaw mcp login` fonctionnent avec le MCP intégré, les exécuteurs CLI et le serveur d'application Codex local.

Tant que les identifiants ne sont pas disponibles, OpenClaw omet uniquement ce serveur MCP de l'exécution de l'agent au lieu de faire échouer le tour de l'agent. L'opérateur, ou un agent disposant d'un accès au shell, peut alors exécuter `openclaw mcp login <name>` et utiliser le serveur lors d'un tour ultérieur.

Lorsqu'un service MCP distant s'appuie déjà sur un profil d'authentification OpenClaw distinct capable d'actualiser les identifiants, vous pouvez éventuellement définir `oauth.authProfileId`. OpenClaw actualise l'une ou l'autre source d'identifiants avant la projection d'exécution et transmet uniquement le jeton d'accès actuel au client MCP en aval.

<Steps>
  <Step title="Enregistrer le serveur">
    Ajoutez ou mettez à jour le serveur avec `auth: "oauth"` et les éventuelles métadonnées OAuth facultatives.

    ```bash
    openclaw mcp set docs '{"url":"https://mcp.example.com/mcp","transport":"streamable-http","auth":"oauth","oauth":{"scope":"docs.read"}}'
    ```

    Pour un jeton porteur adossé à un profil d'authentification, enregistrez l'association au profil :

    ```bash
    openclaw mcp set docs '{"url":"https://mcp.example.com/mcp","transport":"streamable-http","auth":"oauth","oauth":{"authProfileId":"docs:mcp"}}'
    ```

  </Step>
  <Step title="Démarrer la connexion">
    Exécutez la connexion pour créer la demande d'autorisation.

    ```bash
    openclaw mcp login docs
    ```

    OpenClaw affiche l'URL d'autorisation et stocke l'état temporaire du vérificateur OAuth dans le répertoire d'état d'OpenClaw.

  </Step>
  <Step title="Terminer avec le code">
    Après avoir approuvé la demande dans le navigateur, transmettez le code renvoyé à OpenClaw.

    ```bash
    openclaw mcp login docs --code abc123
    ```

  </Step>
  <Step title="Vérifier l'autorisation">
    Utilisez l'état ou le diagnostic pour confirmer la présence des jetons.

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

Si le fournisseur renouvelle les jetons ou si l'état d'autorisation reste bloqué, exécutez `openclaw mcp logout <name>`, puis répétez `login`. `logout` peut effacer les identifiants d'un serveur HTTP enregistré même après la suppression de `auth: "oauth"` de la configuration, tant que le nom et l'URL du serveur permettent toujours d'identifier l'entrée du magasin d'identifiants.

### Transport HTTP avec diffusion en continu

`streamable-http` est une option de transport supplémentaire aux côtés de `sse` et `stdio`. Elle utilise la diffusion HTTP pour la communication bidirectionnelle avec les serveurs MCP distants.

| Champ                          | Description                                                                                                                      |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| `url`                          | URL HTTP ou HTTPS du serveur distant (obligatoire)                                                                                |
| `transport`                    | Définissez sur `"streamable-http"` pour sélectionner ce transport ; en cas d’omission, OpenClaw utilise `sse`                    |
| `headers`                      | Mappage clé-valeur facultatif des en-têtes HTTP (par exemple, des jetons d’authentification)                                      |
| `connectionTimeoutMs`          | Délai d’expiration de la connexion par serveur en ms (facultatif)                                                                 |
| `connectTimeout`               | Délai d’expiration de la connexion par serveur en secondes (facultatif)                                                           |
| `timeout` / `requestTimeoutMs` | Délai d’expiration des requêtes MCP par serveur en secondes ou en ms                                                              |
| `auth: "oauth"`                | Utilise les identifiants OAuth MCP enregistrés par `openclaw mcp login`                                                           |
| `sslVerify`                    | Définissez sur false uniquement pour les points de terminaison HTTPS privés explicitement approuvés                              |
| `clientCert` / `clientKey`     | Chemins du certificat client mTLS et de la clé                                                                                    |
| `supportsParallelToolCalls`    | Indique que les appels simultanés sont sûrs pour ce serveur                                                                       |

La configuration OpenClaw utilise `transport: "streamable-http"` comme orthographe canonique. Les valeurs MCP natives de la CLI `type: "http"` sont acceptées lorsqu’elles sont enregistrées avec `openclaw mcp set` et corrigées par `openclaw doctor --fix` dans une configuration existante, mais `transport` est la valeur directement utilisée par OpenClaw intégré.

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
Les commandes de registre ne démarrent pas le pont de canal. Seules `probe` et `doctor --probe` ouvrent une session client MCP active pour vérifier que le serveur cible est accessible.
</Note>

## Interface de contrôle

L’interface de contrôle dans le navigateur comprend une page dédiée aux paramètres MCP à l’adresse `/settings/mcp` ; l’ancien chemin `/mcp` reste un alias. La page affiche le nombre de serveurs configurés, des récapitulatifs des serveurs activés, OAuth et filtrés, des lignes de transport par serveur, des commandes d’activation et de désactivation, des commandes CLI courantes et un éditeur limité à la section de configuration `mcp`.

Utilisez cette page pour les modifications opérateur et un inventaire rapide. Utilisez `openclaw mcp doctor --probe` ou `openclaw mcp probe` lorsque vous avez besoin d’une vérification en direct du serveur.

Procédure opérateur :

1. Ouvrez l’interface de contrôle et choisissez **MCP**.
2. Consultez les cartes récapitulatives pour connaître le nombre total de serveurs, les serveurs activés, OAuth et filtrés.
3. Utilisez chaque ligne de serveur pour consulter le transport, l’authentification, le filtre, le délai d’expiration et les indications de commande.
4. Basculez l’activation lorsque vous souhaitez conserver une définition tout en l’excluant de la découverte à l’exécution.
5. Modifiez la section de configuration `mcp` dédiée pour les changements structurels tels que de nouveaux serveurs, des en-têtes, TLS, des métadonnées OAuth ou des filtres d’outils.
6. Choisissez **Enregistrer** pour uniquement conserver la configuration, ou **Enregistrer et publier** pour l’appliquer par l’intermédiaire du chemin de configuration du Gateway.
7. Exécutez `openclaw mcp doctor --probe` lorsque vous avez besoin de vérifier en direct que le serveur modifié démarre et répertorie les outils.

Remarques :

- les extraits de commande placent les noms de serveur entre guillemets afin que les noms inhabituels restent copiables dans un shell
- les valeurs affichées ressemblant à des URL sont masquées avant le rendu lorsqu’elles contiennent des identifiants intégrés
- la page ne démarre pas elle-même les transports MCP
- les environnements d’exécution actifs peuvent nécessiter `openclaw mcp reload`, la publication de la configuration du Gateway ou un redémarrage du processus, selon le processus qui possède les clients MCP

## Applications MCP

OpenClaw peut afficher les outils qui implémentent l’[extension MCP Apps](https://modelcontextprotocol.io/extensions/apps) stable. Les applications sont facultatives, car leur HTML provient du serveur MCP configuré et peut demander des outils ou des ressources visibles par l’application à ce même serveur.

Activez le pont hôte :

```bash
openclaw config set mcp.apps.enabled true --strict-json
```

Redémarrez le Gateway après avoir modifié ce paramètre. Lorsqu’il est activé, OpenClaw démarre un écouteur HTTP(S) réservé au bac à sable sur le port du Gateway plus un (pour le Gateway par défaut, `18790`). L’interface de contrôle charge les applications depuis cette origine distincte ; l’écouteur ne sert jamais l’interface de contrôle, les routes Gateway authentifiées ni les données utilisateur.

Les connexions directes au Gateway doivent avoir accès aux deux ports. Si un proxy inverse ou un terminateur TLS expose l’interface de contrôle, attribuez aux applications une origine publique dédiée et transmettez uniquement cette origine à l’écouteur du bac à sable :

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

Par exemple, la démonstration React basique officielle peut être configurée comme suit :

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
- Seules les ressources `ui://` avec le type MIME exact `text/html;profile=mcp-app` sont affichées.
- Les ressources de l’interface utilisateur sont limitées à 2 Mio, placées derrière un proxy à double iframe sur une origine externe dédiée, chargées dans une origine d’application interne opaque et contraintes par une CSP dérivée des métadonnées de la ressource.
- Les outils réservés aux applications (`_meta.ui.visibility: ["app"]`) restent absents des listes d’outils du modèle. Les applications ne peuvent appeler que les outils qui leur sont visibles sur leur serveur propriétaire.
- Les autorisations d’application liées à l’origine, telles que la caméra, le microphone et la géolocalisation, ne sont pas accordées tant que les documents internes de l’application utilisent des origines opaques pour assurer l’isolation entre les applications.
- Le HTML de l’application, les arguments complets des outils et les résultats bruts résident dans un bail d’affichage en mémoire limité à dix minutes. Ils ne sont ni écrits sur le disque ni copiés dans les métadonnées d’aperçu de la transcription, et une vue expirée ne redémarre pas son environnement d’exécution MCP.
- `openclaw security audit` émet un avertissement tant que le pont est activé. Désactivez-le avec `openclaw config set mcp.apps.enabled false --strict-json` lorsqu’il n’est pas nécessaire.

## Limites actuelles

Cette page documente le pont tel qu’il est fourni aujourd’hui.

Limites actuelles :

- la découverte des conversations dépend des métadonnées existantes des routes de session du Gateway
- aucun protocole push générique au-delà de l’adaptateur propre à Claude
- aucun outil de modification de message ni de réaction pour le moment
- le transport HTTP/SSE/streamable-http se connecte à un seul serveur distant ; aucun serveur amont multiplexé pour le moment
- `permissions_list_open` inclut uniquement les approbations observées pendant que le pont est connecté

## Pages connexes

- [Référence de la CLI](/fr/cli)
- [Plugins](/fr/cli/plugins)
