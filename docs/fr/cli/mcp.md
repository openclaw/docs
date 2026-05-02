---
read_when:
    - Connexion de Codex, Claude Code ou d’un autre client MCP à des canaux adossés à OpenClaw
    - Exécution de `openclaw mcp serve`
    - Gestion des définitions de serveurs MCP enregistrées par OpenClaw
sidebarTitle: MCP
summary: Exposer les conversations de canaux OpenClaw via MCP et gérer les définitions enregistrées de serveurs MCP
title: MCP
x-i18n:
    generated_at: "2026-05-02T20:42:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: d1d3b5d7c3a9075c020a35bc9617d6e6902c96b40cc03e76119d01d0d94fd014
    source_path: cli/mcp.md
    workflow: 16
---

`openclaw mcp` a deux rôles :

- exécuter OpenClaw comme serveur MCP avec `openclaw mcp serve`
- gérer les définitions de serveurs MCP sortants appartenant à OpenClaw avec `list`, `show`, `set` et `unset`

Autrement dit :

- `serve` correspond à OpenClaw agissant comme serveur MCP
- `list` / `show` / `set` / `unset` correspond à OpenClaw agissant comme registre côté client MCP pour d'autres serveurs MCP que ses runtimes pourront consommer plus tard

Utilisez [`openclaw acp`](/fr/cli/acp) lorsqu'OpenClaw doit héberger lui-même une session de harnais de codage et acheminer ce runtime via ACP.

## OpenClaw comme serveur MCP

Il s'agit du chemin `openclaw mcp serve`.

### Quand utiliser `serve`

Utilisez `openclaw mcp serve` lorsque :

- Codex, Claude Code ou un autre client MCP doit communiquer directement avec des conversations de canaux adossées à OpenClaw
- vous avez déjà un Gateway OpenClaw local ou distant avec des sessions routées
- vous voulez un seul serveur MCP qui fonctionne avec les backends de canaux d'OpenClaw au lieu d'exécuter des passerelles séparées par canal

Utilisez plutôt [`openclaw acp`](/fr/cli/acp) lorsqu'OpenClaw doit héberger lui-même le runtime de codage et conserver la session d'agent dans OpenClaw.

### Fonctionnement

`openclaw mcp serve` démarre un serveur MCP stdio. Le client MCP possède ce processus. Tant que le client maintient la session stdio ouverte, la passerelle se connecte à un Gateway OpenClaw local ou distant via WebSocket et expose les conversations de canaux routées via MCP.

<Steps>
  <Step title="Le client lance la passerelle">
    Le client MCP lance `openclaw mcp serve`.
  </Step>
  <Step title="La passerelle se connecte au Gateway">
    La passerelle se connecte au Gateway OpenClaw via WebSocket.
  </Step>
  <Step title="Les sessions deviennent des conversations MCP">
    Les sessions routées deviennent des conversations MCP et des outils de transcription/historique.
  </Step>
  <Step title="File d'attente des événements en direct">
    Les événements en direct sont mis en file d'attente en mémoire tant que la passerelle est connectée.
  </Step>
  <Step title="Push Claude facultatif">
    Si le mode de canal Claude est activé, la même session peut aussi recevoir des notifications push spécifiques à Claude.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Comportement important">
    - l'état de la file d'attente en direct commence lorsque la passerelle se connecte
    - l'ancien historique de transcription est lu avec `messages_read`
    - les notifications push Claude n'existent que tant que la session MCP est active
    - lorsque le client se déconnecte, la passerelle se termine et la file d'attente en direct disparaît
    - les points d'entrée d'agent ponctuels comme `openclaw agent` et `openclaw infer model run` retirent tous les runtimes MCP intégrés qu'ils ouvrent lorsque la réponse est terminée, de sorte que les exécutions scriptées répétées n'accumulent pas de processus enfants MCP stdio
    - les serveurs MCP stdio lancés par OpenClaw (intégrés ou configurés par l'utilisateur) sont arrêtés comme arbre de processus à l'extinction, de sorte que les sous-processus enfants démarrés par le serveur ne survivent pas après la sortie du client stdio parent
    - supprimer ou réinitialiser une session élimine les clients MCP de cette session via le chemin de nettoyage de runtime partagé, de sorte qu'aucune connexion stdio persistante ne reste liée à une session supprimée

  </Accordion>
</AccordionGroup>

### Choisir un mode client

Utilisez la même passerelle de deux façons différentes :

<Tabs>
  <Tab title="Clients MCP génériques">
    Outils MCP standard uniquement. Utilisez `conversations_list`, `messages_read`, `events_poll`, `events_wait`, `messages_send` et les outils d'approbation.
  </Tab>
  <Tab title="Claude Code">
    Outils MCP standard plus l'adaptateur de canal spécifique à Claude. Activez `--claude-channel-mode on` ou conservez la valeur par défaut `auto`.
  </Tab>
</Tabs>

<Note>
Aujourd'hui, `auto` se comporte comme `on`. Il n'y a pas encore de détection des capacités du client.
</Note>

### Ce que `serve` expose

La passerelle utilise les métadonnées de route de session Gateway existantes pour exposer des conversations adossées à des canaux. Une conversation apparaît lorsqu'OpenClaw dispose déjà d'un état de session avec une route connue comme :

- `channel`
- métadonnées de destinataire ou de destination
- `accountId` facultatif
- `threadId` facultatif

Cela donne aux clients MCP un emplacement unique pour :

- lister les conversations routées récentes
- lire l'historique de transcription récent
- attendre de nouveaux événements entrants
- envoyer une réponse via la même route
- voir les demandes d'approbation qui arrivent pendant que la passerelle est connectée

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
  <Tab title="Détaillé / Claude désactivé">
    ```bash
    openclaw mcp serve --verbose
    openclaw mcp serve --claude-channel-mode off
    ```
  </Tab>
</Tabs>

### Outils de la passerelle

La passerelle actuelle expose ces outils MCP :

<AccordionGroup>
  <Accordion title="conversations_list">
    Liste les conversations récentes adossées à une session qui ont déjà des métadonnées de route dans l'état de session Gateway.

    Filtres utiles :

    - `limit`
    - `search`
    - `channel`
    - `includeDerivedTitles`
    - `includeLastMessage`

  </Accordion>
  <Accordion title="conversation_get">
    Renvoie une conversation par `session_key` à l'aide d'une recherche directe de session Gateway.
  </Accordion>
  <Accordion title="messages_read">
    Lit les messages de transcription récents pour une conversation adossée à une session.
  </Accordion>
  <Accordion title="attachments_fetch">
    Extrait les blocs de contenu de message non textuels d'un message de transcription. Il s'agit d'une vue de métadonnées sur le contenu de transcription, et non d'un magasin autonome durable de blobs de pièces jointes.
  </Accordion>
  <Accordion title="events_poll">
    Lit les événements en direct mis en file d'attente depuis un curseur numérique.
  </Accordion>
  <Accordion title="events_wait">
    Effectue un long polling jusqu'à l'arrivée du prochain événement mis en file d'attente correspondant ou jusqu'à l'expiration d'un délai.

    Utilisez cela lorsqu'un client MCP générique a besoin d'une livraison quasi temps réel sans protocole push spécifique à Claude.

  </Accordion>
  <Accordion title="messages_send">
    Renvoie du texte via la même route déjà enregistrée sur la session.

    Comportement actuel :

    - nécessite une route de conversation existante
    - utilise le canal, le destinataire, l'identifiant de compte et l'identifiant de fil de la session
    - envoie uniquement du texte

  </Accordion>
  <Accordion title="permissions_list_open">
    Liste les demandes d'approbation exec/Plugin en attente que la passerelle a observées depuis sa connexion au Gateway.
  </Accordion>
  <Accordion title="permissions_respond">
    Résout une demande d'approbation exec/Plugin en attente avec :

    - `allow-once`
    - `allow-always`
    - `deny`

  </Accordion>
</AccordionGroup>

### Modèle d'événements

La passerelle conserve une file d'attente d'événements en mémoire tant qu'elle est connectée.

Types d'événements actuels :

- `message`
- `exec_approval_requested`
- `exec_approval_resolved`
- `plugin_approval_requested`
- `plugin_approval_resolved`
- `claude_permission_request`

<Warning>
- la file d'attente est uniquement en direct ; elle démarre lorsque la passerelle MCP démarre
- `events_poll` et `events_wait` ne rejouent pas eux-mêmes l'ancien historique Gateway
- le backlog durable doit être lu avec `messages_read`

</Warning>

### Notifications de canal Claude

La passerelle peut aussi exposer des notifications de canal spécifiques à Claude. C'est l'équivalent OpenClaw d'un adaptateur de canal Claude Code : les outils MCP standard restent disponibles, mais les messages entrants en direct peuvent aussi arriver comme notifications MCP spécifiques à Claude.

<Tabs>
  <Tab title="off">
    `--claude-channel-mode off` : outils MCP standard uniquement.
  </Tab>
  <Tab title="on">
    `--claude-channel-mode on` : active les notifications de canal Claude.
  </Tab>
  <Tab title="auto (par défaut)">
    `--claude-channel-mode auto` : valeur par défaut actuelle ; même comportement de passerelle que `on`.
  </Tab>
</Tabs>

Lorsque le mode de canal Claude est activé, le serveur annonce les capacités expérimentales Claude et peut émettre :

- `notifications/claude/channel`
- `notifications/claude/channel/permission`

Comportement actuel de la passerelle :

- les messages de transcription entrants `user` sont transférés comme `notifications/claude/channel`
- les demandes d'autorisation Claude reçues via MCP sont suivies en mémoire
- si la conversation liée envoie ensuite `yes abcde` ou `no abcde`, la passerelle convertit cela en `notifications/claude/channel/permission`
- ces notifications ne valent que pour la session en direct ; si le client MCP se déconnecte, il n'y a pas de cible push

C'est volontairement spécifique au client. Les clients MCP génériques doivent s'appuyer sur les outils de polling standard.

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

Pour la plupart des clients MCP génériques, commencez par la surface d'outils standard et ignorez le mode Claude. Activez le mode Claude uniquement pour les clients qui comprennent réellement les méthodes de notification spécifiques à Claude.

### Options

`openclaw mcp serve` prend en charge :

<ParamField path="--url" type="string">
  URL WebSocket du Gateway.
</ParamField>
<ParamField path="--token" type="string">
  Jeton Gateway.
</ParamField>
<ParamField path="--token-file" type="string">
  Lire le jeton depuis un fichier.
</ParamField>
<ParamField path="--password" type="string">
  Mot de passe Gateway.
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
Préférez `--token-file` ou `--password-file` aux secrets en ligne lorsque c'est possible.
</Tip>

### Sécurité et limite de confiance

La passerelle n'invente pas de routage. Elle expose uniquement les conversations que Gateway sait déjà router.

Cela signifie que :

- les listes d'autorisation d'expéditeurs, l'appairage et la confiance au niveau du canal appartiennent toujours à la configuration de canal OpenClaw sous-jacente
- `messages_send` ne peut répondre que via une route stockée existante
- l'état d'approbation est uniquement en direct/en mémoire pour la session de passerelle actuelle
- l'authentification de la passerelle doit utiliser les mêmes contrôles de jeton ou de mot de passe Gateway que ceux auxquels vous feriez confiance pour tout autre client Gateway distant

Si une conversation manque dans `conversations_list`, la cause habituelle n'est pas la configuration MCP. Il s'agit de métadonnées de route manquantes ou incomplètes dans la session Gateway sous-jacente.

### Tests

OpenClaw fournit un smoke Docker déterministe pour cette passerelle :

```bash
pnpm test:docker:mcp-channels
```

Ce smoke :

- démarre un conteneur Gateway initialisé
- démarre un second conteneur qui lance `openclaw mcp serve`
- vérifie la découverte des conversations, la lecture des transcriptions, la lecture des métadonnées de pièces jointes, le comportement de la file d'attente d'événements en direct et le routage des envois sortants
- valide les notifications de canal et d'autorisation de style Claude via la véritable passerelle MCP stdio

C'est le moyen le plus rapide de prouver que la passerelle fonctionne sans connecter un vrai compte Telegram, Discord ou iMessage à l'exécution de test.

Pour un contexte de test plus large, consultez [Tests](/fr/help/testing).

### Dépannage

<AccordionGroup>
  <Accordion title="Aucune conversation renvoyée">
    Cela signifie généralement que la session Gateway n'est pas déjà routable. Confirmez que la session sous-jacente a stocké les métadonnées de canal/fournisseur, de destinataire et, éventuellement, de route de compte/fil.
  </Accordion>
  <Accordion title="events_poll ou events_wait manque d'anciens messages">
    C'est attendu. La file d'attente en direct démarre lorsque la passerelle se connecte. Lisez l'ancien historique de transcription avec `messages_read`.
  </Accordion>
  <Accordion title="Les notifications Claude n'apparaissent pas">
    Vérifiez tous les points suivants :

    - le client a gardé la session MCP stdio ouverte
    - `--claude-channel-mode` est `on` ou `auto`
    - le client comprend réellement les méthodes de notification spécifiques à Claude
    - le message entrant est arrivé après la connexion de la passerelle

  </Accordion>
  <Accordion title="Les approbations sont manquantes">
    `permissions_list_open` affiche uniquement les demandes d'approbation observées pendant que la passerelle était connectée. Ce n'est pas une API durable d'historique des approbations.
  </Accordion>
</AccordionGroup>

## OpenClaw comme registre de clients MCP

Ceci est le chemin `openclaw mcp list`, `show`, `set` et `unset`.

Ces commandes n’exposent pas OpenClaw via MCP. Elles gèrent les définitions de serveurs MCP appartenant à OpenClaw sous `mcp.servers` dans la configuration OpenClaw.

Ces définitions enregistrées sont destinées aux environnements d’exécution qu’OpenClaw lance ou configure ultérieurement, comme le Pi intégré et d’autres adaptateurs d’exécution. OpenClaw stocke les définitions de manière centralisée afin que ces environnements d’exécution n’aient pas besoin de conserver leurs propres listes de serveurs MCP en double.

<AccordionGroup>
  <Accordion title="Important behavior">
    - ces commandes lisent ou écrivent uniquement la configuration OpenClaw
    - elles ne se connectent pas au serveur MCP cible
    - elles ne valident pas si la commande, l’URL ou le transport distant est actuellement joignable
    - les adaptateurs d’exécution décident quelles formes de transport ils prennent réellement en charge au moment de l’exécution
    - le Pi intégré expose les outils MCP configurés dans les profils d’outils normaux `coding` et `messaging` ; `minimal` les masque toujours, et `tools.deny: ["bundle-mcp"]` les désactive explicitement
    - les environnements d’exécution MCP groupés et limités à la session sont récoltés après `mcp.sessionIdleTtlMs` millisecondes d’inactivité (10 minutes par défaut ; définissez `0` pour désactiver) et les exécutions intégrées ponctuelles les nettoient à la fin de l’exécution

  </Accordion>
</AccordionGroup>

Les adaptateurs d’exécution peuvent normaliser ce registre partagé dans la forme attendue par leur client en aval. Par exemple, le Pi intégré consomme directement les valeurs `transport` d’OpenClaw, tandis que Claude Code et Gemini reçoivent des valeurs `type` natives de la CLI comme `http`, `sse` ou `stdio`.

### Définitions de serveurs MCP enregistrées

OpenClaw stocke aussi un registre léger de serveurs MCP dans la configuration pour les surfaces qui veulent des définitions MCP gérées par OpenClaw.

Commandes :

- `openclaw mcp list`
- `openclaw mcp show [name]`
- `openclaw mcp set <name> <json>`
- `openclaw mcp unset <name>`

Remarques :

- `list` trie les noms de serveurs.
- `show` sans nom affiche l’objet complet des serveurs MCP configurés.
- `set` attend une valeur d’objet JSON sur la ligne de commande.
- Utilisez `transport: "streamable-http"` pour les serveurs MCP Streamable HTTP. `openclaw mcp set` normalise aussi le `type: "http"` natif de la CLI vers la même forme de configuration canonique pour compatibilité.
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

| Champ                      | Description                                         |
| -------------------------- | --------------------------------------------------- |
| `command`                  | Exécutable à lancer (requis)                        |
| `args`                     | Tableau d’arguments de ligne de commande            |
| `env`                      | Variables d’environnement supplémentaires           |
| `cwd` / `workingDirectory` | Répertoire de travail du processus                  |

<Warning>
**Filtre de sécurité des env stdio**

OpenClaw rejette les clés d’environnement de démarrage d’interpréteur qui peuvent modifier la façon dont un serveur MCP stdio démarre avant le premier RPC, même si elles apparaissent dans le bloc `env` d’un serveur. Les clés bloquées incluent `NODE_OPTIONS`, `PYTHONSTARTUP`, `PYTHONPATH`, `PERL5OPT`, `RUBYOPT`, `SHELLOPTS`, `PS4` et des variables similaires de contrôle d’exécution. Le démarrage les rejette avec une erreur de configuration afin qu’elles ne puissent pas injecter un prélude implicite, remplacer l’interpréteur ou activer un débogueur sur le processus stdio. Les variables d’environnement ordinaires propres aux identifiants, aux proxys et au serveur (`GITHUB_TOKEN`, `HTTP_PROXY`, `*_API_KEY` personnalisées, etc.) ne sont pas affectées.

Si votre serveur MCP a réellement besoin de l’une des variables bloquées, définissez-la sur le processus hôte Gateway plutôt que dans l’`env` du serveur stdio.
</Warning>

### Transport SSE / HTTP

Se connecte à un serveur MCP distant via HTTP Server-Sent Events.

| Champ                 | Description                                                            |
| --------------------- | ---------------------------------------------------------------------- |
| `url`                 | URL HTTP ou HTTPS du serveur distant (requise)                         |
| `headers`             | Carte clé-valeur facultative d’en-têtes HTTP (par exemple jetons auth) |
| `connectionTimeoutMs` | Délai d’expiration de connexion par serveur en ms (facultatif)         |

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

### Transport Streamable HTTP

`streamable-http` est une option de transport supplémentaire aux côtés de `sse` et `stdio`. Elle utilise le streaming HTTP pour la communication bidirectionnelle avec des serveurs MCP distants.

| Champ                 | Description                                                                                          |
| --------------------- | ---------------------------------------------------------------------------------------------------- |
| `url`                 | URL HTTP ou HTTPS du serveur distant (requise)                                                       |
| `transport`           | Définissez sur `"streamable-http"` pour sélectionner ce transport ; si omis, OpenClaw utilise `sse`  |
| `headers`             | Carte clé-valeur facultative d’en-têtes HTTP (par exemple jetons auth)                               |
| `connectionTimeoutMs` | Délai d’expiration de connexion par serveur en ms (facultatif)                                       |

La configuration OpenClaw utilise `transport: "streamable-http"` comme orthographe canonique. Les valeurs MCP `type: "http"` natives de la CLI sont acceptées lorsqu’elles sont enregistrées avec `openclaw mcp set` et réparées par `openclaw doctor --fix` dans la configuration existante, mais `transport` est ce que le Pi intégré consomme directement.

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

- la découverte des conversations dépend des métadonnées de route de session Gateway existantes
- aucun protocole push générique au-delà de l’adaptateur propre à Claude
- pas encore d’outils de modification de message ou de réaction
- le transport HTTP/SSE/streamable-http se connecte à un seul serveur distant ; aucun amont multiplexé pour l’instant
- `permissions_list_open` inclut uniquement les approbations observées pendant que le pont est connecté

## Associé

- [Référence CLI](/fr/cli)
- [Plugins](/fr/cli/plugins)
