---
read_when:
    - Connecter Codex, Claude Code ou un autre client MCP à des canaux adossés à OpenClaw
    - Exécution de `openclaw mcp serve`
    - Gestion des définitions de serveurs MCP enregistrées par OpenClaw
sidebarTitle: MCP
summary: Exposer les conversations des canaux OpenClaw via MCP et gérer les définitions de serveurs MCP enregistrées
title: MCP
x-i18n:
    generated_at: "2026-04-30T07:18:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: d66ec20b81ab3894c7202ee1c1c6666bd9cdeffc8d48a280b1f298bb358887ef
    source_path: cli/mcp.md
    workflow: 16
---

`openclaw mcp` a deux rôles :

- exécuter OpenClaw comme serveur MCP avec `openclaw mcp serve`
- gérer les définitions de serveurs MCP sortants appartenant à OpenClaw avec `list`, `show`, `set` et `unset`

Autrement dit :

- `serve` correspond à OpenClaw agissant comme serveur MCP
- `list` / `show` / `set` / `unset` correspondent à OpenClaw agissant comme registre côté client MCP pour d’autres serveurs MCP que ses runtimes pourront consommer plus tard

Utilisez [`openclaw acp`](/fr/cli/acp) quand OpenClaw doit héberger lui-même une session de harnais de codage et acheminer ce runtime via ACP.

## OpenClaw comme serveur MCP

C’est le chemin `openclaw mcp serve`.

### Quand utiliser `serve`

Utilisez `openclaw mcp serve` quand :

- Codex, Claude Code ou un autre client MCP doit communiquer directement avec des conversations de canal adossées à OpenClaw
- vous avez déjà un Gateway OpenClaw local ou distant avec des sessions routées
- vous voulez un serveur MCP unique qui fonctionne avec les backends de canaux d’OpenClaw au lieu d’exécuter des ponts séparés par canal

Utilisez plutôt [`openclaw acp`](/fr/cli/acp) quand OpenClaw doit héberger lui-même le runtime de codage et garder la session d’agent dans OpenClaw.

### Fonctionnement

`openclaw mcp serve` démarre un serveur MCP stdio. Le client MCP possède ce processus. Tant que le client garde la session stdio ouverte, le pont se connecte à un Gateway OpenClaw local ou distant via WebSocket et expose les conversations de canal routées via MCP.

<Steps>
  <Step title="Le client lance le pont">
    Le client MCP lance `openclaw mcp serve`.
  </Step>
  <Step title="Le pont se connecte au Gateway">
    Le pont se connecte au Gateway OpenClaw via WebSocket.
  </Step>
  <Step title="Les sessions deviennent des conversations MCP">
    Les sessions routées deviennent des conversations MCP et des outils de transcript/historique.
  </Step>
  <Step title="Les événements en direct sont mis en file d’attente">
    Les événements en direct sont mis en file d’attente en mémoire pendant que le pont est connecté.
  </Step>
  <Step title="Push Claude facultatif">
    Si le mode canal Claude est activé, la même session peut aussi recevoir des notifications push propres à Claude.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Comportement important">
    - l’état de la file d’attente en direct commence quand le pont se connecte
    - l’historique de transcript plus ancien est lu avec `messages_read`
    - les notifications push Claude n’existent que pendant que la session MCP est active
    - quand le client se déconnecte, le pont se termine et la file d’attente en direct disparaît
    - les points d’entrée d’agent ponctuels tels que `openclaw agent` et `openclaw infer model run` retirent tous les runtimes MCP groupés qu’ils ouvrent lorsque la réponse est terminée, afin que les exécutions scriptées répétées n’accumulent pas de processus enfants MCP stdio
    - les serveurs MCP stdio lancés par OpenClaw (groupés ou configurés par l’utilisateur) sont arrêtés sous forme d’arborescence de processus lors de l’arrêt, afin que les sous-processus enfants démarrés par le serveur ne survivent pas après la sortie du client stdio parent
    - la suppression ou la réinitialisation d’une session libère les clients MCP de cette session via le chemin de nettoyage de runtime partagé, afin qu’il ne reste aucune connexion stdio persistante liée à une session supprimée

  </Accordion>
</AccordionGroup>

### Choisir un mode client

Utilisez le même pont de deux façons différentes :

<Tabs>
  <Tab title="Clients MCP génériques">
    Outils MCP standard uniquement. Utilisez `conversations_list`, `messages_read`, `events_poll`, `events_wait`, `messages_send` et les outils d’approbation.
  </Tab>
  <Tab title="Claude Code">
    Outils MCP standard plus l’adaptateur de canal propre à Claude. Activez `--claude-channel-mode on` ou conservez la valeur par défaut `auto`.
  </Tab>
</Tabs>

<Note>
Aujourd’hui, `auto` se comporte comme `on`. Il n’existe pas encore de détection des capacités du client.
</Note>

### Ce que `serve` expose

Le pont utilise les métadonnées de route de session existantes du Gateway pour exposer des conversations adossées à des canaux. Une conversation apparaît quand OpenClaw dispose déjà d’un état de session avec une route connue, par exemple :

- `channel`
- métadonnées de destinataire ou de destination
- `accountId` facultatif
- `threadId` facultatif

Cela donne aux clients MCP un endroit unique pour :

- lister les conversations routées récentes
- lire l’historique de transcript récent
- attendre de nouveaux événements entrants
- envoyer une réponse via la même route
- voir les demandes d’approbation qui arrivent pendant que le pont est connecté

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
  <Tab title="Verbeux / Claude désactivé">
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
    Liste les conversations récentes adossées à des sessions qui disposent déjà de métadonnées de route dans l’état de session du Gateway.

    Filtres utiles :

    - `limit`
    - `search`
    - `channel`
    - `includeDerivedTitles`
    - `includeLastMessage`

  </Accordion>
  <Accordion title="conversation_get">
    Renvoie une conversation par `session_key`.
  </Accordion>
  <Accordion title="messages_read">
    Lit les messages de transcript récents pour une conversation adossée à une session.
  </Accordion>
  <Accordion title="attachments_fetch">
    Extrait les blocs de contenu non textuels d’un message de transcript. Il s’agit d’une vue de métadonnées sur le contenu du transcript, et non d’un stockage de blobs de pièces jointes autonome et durable.
  </Accordion>
  <Accordion title="events_poll">
    Lit les événements en direct mis en file d’attente depuis un curseur numérique.
  </Accordion>
  <Accordion title="events_wait">
    Effectue un long-polling jusqu’à l’arrivée du prochain événement en file d’attente correspondant ou jusqu’à l’expiration d’un délai.

    Utilisez cela quand un client MCP générique a besoin d’une livraison quasi temps réel sans protocole push propre à Claude.

  </Accordion>
  <Accordion title="messages_send">
    Envoie du texte via la même route déjà enregistrée sur la session.

    Comportement actuel :

    - nécessite une route de conversation existante
    - utilise le canal, le destinataire, l’identifiant de compte et l’identifiant de fil de la session
    - envoie uniquement du texte

  </Accordion>
  <Accordion title="permissions_list_open">
    Liste les demandes d’approbation exec/Plugin en attente observées par le pont depuis sa connexion au Gateway.
  </Accordion>
  <Accordion title="permissions_respond">
    Résout une demande d’approbation exec/Plugin en attente avec :

    - `allow-once`
    - `allow-always`
    - `deny`

  </Accordion>
</AccordionGroup>

### Modèle d’événements

Le pont conserve une file d’attente d’événements en mémoire pendant qu’il est connecté.

Types d’événements actuels :

- `message`
- `exec_approval_requested`
- `exec_approval_resolved`
- `plugin_approval_requested`
- `plugin_approval_resolved`
- `claude_permission_request`

<Warning>
- la file d’attente est uniquement en direct ; elle commence quand le pont MCP démarre
- `events_poll` et `events_wait` ne rejouent pas à eux seuls l’historique plus ancien du Gateway
- l’arriéré durable doit être lu avec `messages_read`

</Warning>

### Notifications de canal Claude

Le pont peut aussi exposer des notifications de canal propres à Claude. C’est l’équivalent OpenClaw d’un adaptateur de canal Claude Code : les outils MCP standard restent disponibles, mais les messages entrants en direct peuvent aussi arriver comme notifications MCP propres à Claude.

<Tabs>
  <Tab title="off">
    `--claude-channel-mode off` : outils MCP standard uniquement.
  </Tab>
  <Tab title="on">
    `--claude-channel-mode on` : active les notifications de canal Claude.
  </Tab>
  <Tab title="auto (par défaut)">
    `--claude-channel-mode auto` : valeur par défaut actuelle ; même comportement du pont que `on`.
  </Tab>
</Tabs>

Quand le mode canal Claude est activé, le serveur annonce les capacités expérimentales de Claude et peut émettre :

- `notifications/claude/channel`
- `notifications/claude/channel/permission`

Comportement actuel du pont :

- les messages de transcript entrants `user` sont transférés comme `notifications/claude/channel`
- les demandes d’autorisation Claude reçues via MCP sont suivies en mémoire
- si la conversation liée envoie ensuite `yes abcde` ou `no abcde`, le pont convertit cela en `notifications/claude/channel/permission`
- ces notifications sont propres à la session en direct ; si le client MCP se déconnecte, il n’y a plus de cible push

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
  Lit le jeton depuis un fichier.
</ParamField>
<ParamField path="--password" type="string">
  Mot de passe du Gateway.
</ParamField>
<ParamField path="--password-file" type="string">
  Lit le mot de passe depuis un fichier.
</ParamField>
<ParamField path="--claude-channel-mode" type='"auto" | "on" | "off"'>
  Mode de notification Claude.
</ParamField>
<ParamField path="-v, --verbose" type="boolean">
  Journaux détaillés sur stderr.
</ParamField>

<Tip>
Préférez `--token-file` ou `--password-file` aux secrets en ligne quand c’est possible.
</Tip>

### Sécurité et limite de confiance

Le pont n’invente pas de routage. Il expose uniquement les conversations que le Gateway sait déjà router.

Cela signifie que :

- les listes d’autorisation d’expéditeurs, l’appairage et la confiance au niveau du canal appartiennent toujours à la configuration de canal OpenClaw sous-jacente
- `messages_send` ne peut répondre que via une route stockée existante
- l’état d’approbation est en direct/en mémoire uniquement pour la session de pont actuelle
- l’authentification du pont doit utiliser les mêmes contrôles de jeton ou de mot de passe du Gateway que ceux auxquels vous feriez confiance pour tout autre client Gateway distant

Si une conversation est absente de `conversations_list`, la cause habituelle n’est pas la configuration MCP. Il s’agit de métadonnées de route manquantes ou incomplètes dans la session Gateway sous-jacente.

### Tests

OpenClaw fournit un smoke Docker déterministe pour ce pont :

```bash
pnpm test:docker:mcp-channels
```

Ce smoke :

- démarre un conteneur Gateway prérempli
- démarre un second conteneur qui lance `openclaw mcp serve`
- vérifie la découverte des conversations, les lectures de transcript, les lectures de métadonnées de pièces jointes, le comportement de la file d’attente d’événements en direct et le routage d’envoi sortant
- valide les notifications de canal et d’autorisation de style Claude via le vrai pont MCP stdio

C’est le moyen le plus rapide de prouver que le pont fonctionne sans connecter un vrai compte Telegram, Discord ou iMessage à l’exécution de test.

Pour un contexte de test plus large, consultez [Tests](/fr/help/testing).

### Dépannage

<AccordionGroup>
  <Accordion title="Aucune conversation renvoyée">
    Cela signifie généralement que la session Gateway n’est pas déjà routable. Vérifiez que la session sous-jacente dispose de métadonnées de route stockées pour le canal/fournisseur, le destinataire et les éventuels compte/fil.
  </Accordion>
  <Accordion title="events_poll ou events_wait manque des messages plus anciens">
    C’est attendu. La file d’attente en direct commence quand le pont se connecte. Lisez l’historique de transcript plus ancien avec `messages_read`.
  </Accordion>
  <Accordion title="Les notifications Claude ne s’affichent pas">
    Vérifiez tous ces points :

    - le client a gardé la session MCP stdio ouverte
    - `--claude-channel-mode` vaut `on` ou `auto`
    - le client comprend réellement les méthodes de notification propres à Claude
    - le message entrant est arrivé après la connexion du pont

  </Accordion>
  <Accordion title="Les approbations manquent">
    `permissions_list_open` n’affiche que les demandes d’approbation observées pendant que le pont était connecté. Ce n’est pas une API d’historique d’approbations durable.
  </Accordion>
</AccordionGroup>

## OpenClaw comme registre client MCP

Ceci est le chemin `openclaw mcp list`, `show`, `set` et `unset`.

Ces commandes n’exposent pas OpenClaw via MCP. Elles gèrent les définitions de serveurs MCP appartenant à OpenClaw sous `mcp.servers` dans la configuration OpenClaw.

Ces définitions enregistrées sont destinées aux runtimes qu’OpenClaw lance ou configure ultérieurement, comme Pi intégré et d’autres adaptateurs de runtime. OpenClaw stocke les définitions de manière centralisée afin que ces runtimes n’aient pas à conserver leurs propres listes de serveurs MCP en double.

<AccordionGroup>
  <Accordion title="Comportement important">
    - ces commandes lisent ou écrivent uniquement la configuration OpenClaw
    - elles ne se connectent pas au serveur MCP cible
    - elles ne valident pas si la commande, l’URL ou le transport distant est joignable à cet instant
    - les adaptateurs de runtime décident quelles formes de transport ils prennent réellement en charge au moment de l’exécution
    - Pi intégré expose les outils MCP configurés dans les profils d’outils normaux `coding` et `messaging` ; `minimal` les masque toujours, et `tools.deny: ["bundle-mcp"]` les désactive explicitement
    - les runtimes MCP groupés à portée de session sont récupérés après `mcp.sessionIdleTtlMs` millisecondes d’inactivité (10 minutes par défaut ; définissez `0` pour désactiver) et les exécutions intégrées ponctuelles les nettoient à la fin de l’exécution

  </Accordion>
</AccordionGroup>

Les adaptateurs de runtime peuvent normaliser ce registre partagé dans la forme attendue par leur client en aval. Par exemple, Pi intégré consomme directement les valeurs `transport` d’OpenClaw, tandis que Claude Code et Gemini reçoivent des valeurs `type` natives de la CLI telles que `http`, `sse` ou `stdio`.

### Définitions de serveurs MCP enregistrées

OpenClaw stocke également dans la configuration un registre léger de serveurs MCP pour les surfaces qui veulent des définitions MCP gérées par OpenClaw.

Commandes :

- `openclaw mcp list`
- `openclaw mcp show [name]`
- `openclaw mcp set <name> <json>`
- `openclaw mcp unset <name>`

Remarques :

- `list` trie les noms des serveurs.
- `show` sans nom affiche l’objet complet des serveurs MCP configurés.
- `set` attend une seule valeur d’objet JSON sur la ligne de commande.
- Utilisez `transport: "streamable-http"` pour les serveurs MCP HTTP Streamable. `openclaw mcp set` normalise également le `type: "http"` natif de la CLI vers la même forme de configuration canonique pour compatibilité.
- `unset` échoue si le serveur nommé n’existe pas.

Exemples :

```bash
openclaw mcp list
openclaw mcp show context7 --json
openclaw mcp set context7 '{"command":"uvx","args":["context7-mcp"]}'
openclaw mcp set docs '{"url":"https://mcp.example.com","transport":"streamable-http"}'
openclaw mcp unset context7
```

Exemple de forme de configuration :

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
        "transport": "streamable-http"
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
| `args`                     | Tableau d’arguments de ligne de commande         |
| `env`                      | Variables d’environnement supplémentaires        |
| `cwd` / `workingDirectory` | Répertoire de travail du processus               |

<Warning>
**Filtre de sécurité de l’environnement stdio**

OpenClaw rejette les clés d’environnement de démarrage d’interpréteur qui peuvent modifier la manière dont un serveur MCP stdio démarre avant le premier RPC, même si elles apparaissent dans le bloc `env` d’un serveur. Les clés bloquées incluent `NODE_OPTIONS`, `PYTHONSTARTUP`, `PYTHONPATH`, `PERL5OPT`, `RUBYOPT`, `SHELLOPTS`, `PS4` et des variables similaires de contrôle du runtime. Le démarrage les rejette avec une erreur de configuration afin qu’elles ne puissent pas injecter de préambule implicite, remplacer l’interpréteur ou activer un débogueur contre le processus stdio. Les variables d’environnement ordinaires propres aux identifiants, aux proxys et aux serveurs (`GITHUB_TOKEN`, `HTTP_PROXY`, `*_API_KEY` personnalisées, etc.) ne sont pas affectées.

Si votre serveur MCP a réellement besoin de l’une des variables bloquées, définissez-la sur le processus hôte du gateway au lieu de la définir sous l’`env` du serveur stdio.
</Warning>

### Transport SSE / HTTP

Se connecte à un serveur MCP distant via HTTP Server-Sent Events.

| Champ                 | Description                                                                 |
| --------------------- | --------------------------------------------------------------------------- |
| `url`                 | URL HTTP ou HTTPS du serveur distant (obligatoire)                          |
| `headers`             | Carte clé-valeur facultative d’en-têtes HTTP (par exemple des jetons d’auth) |
| `connectionTimeoutMs` | Délai d’expiration de connexion par serveur en ms (facultatif)              |

Exemple :

```json
{
  "mcp": {
    "servers": {
      "remote-tools": {
        "url": "https://mcp.example.com",
        "headers": {
          "Authorization": "Bearer <token>"
        }
      }
    }
  }
}
```

Les valeurs sensibles dans `url` (userinfo) et `headers` sont masquées dans les journaux et la sortie d’état.

### Transport HTTP Streamable

`streamable-http` est une option de transport supplémentaire aux côtés de `sse` et `stdio`. Elle utilise le streaming HTTP pour la communication bidirectionnelle avec des serveurs MCP distants.

| Champ                 | Description                                                                                              |
| --------------------- | -------------------------------------------------------------------------------------------------------- |
| `url`                 | URL HTTP ou HTTPS du serveur distant (obligatoire)                                                       |
| `transport`           | Définir sur `"streamable-http"` pour sélectionner ce transport ; s’il est omis, OpenClaw utilise `sse`   |
| `headers`             | Carte clé-valeur facultative d’en-têtes HTTP (par exemple des jetons d’auth)                             |
| `connectionTimeoutMs` | Délai d’expiration de connexion par serveur en ms (facultatif)                                           |

La configuration OpenClaw utilise `transport: "streamable-http"` comme orthographe canonique. Les valeurs MCP `type: "http"` natives de la CLI sont acceptées lorsqu’elles sont enregistrées via `openclaw mcp set` et réparées par `openclaw doctor --fix` dans une configuration existante, mais `transport` est ce que Pi intégré consomme directement.

Exemple :

```json
{
  "mcp": {
    "servers": {
      "streaming-tools": {
        "url": "https://mcp.example.com/stream",
        "transport": "streamable-http",
        "connectionTimeoutMs": 10000,
        "headers": {
          "Authorization": "Bearer <token>"
        }
      }
    }
  }
}
```

<Note>
Ces commandes gèrent uniquement la configuration enregistrée. Elles ne démarrent pas le pont de canal, n’ouvrent pas de session client MCP active et ne prouvent pas que le serveur cible est joignable.
</Note>

## Limites actuelles

Cette page documente le pont tel qu’il est livré aujourd’hui.

Limites actuelles :

- la découverte de conversations dépend des métadonnées de routage des sessions Gateway existantes
- aucun protocole push générique au-delà de l’adaptateur propre à Claude
- pas encore d’outils de modification de message ni de réaction
- le transport HTTP/SSE/streamable-http se connecte à un seul serveur distant ; pas encore d’amont multiplexé
- `permissions_list_open` inclut uniquement les approbations observées pendant que le pont est connecté

## Associé

- [Référence CLI](/fr/cli)
- [Plugins](/fr/cli/plugins)
