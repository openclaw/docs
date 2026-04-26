---
read_when:
    - Connecter Codex, Claude Code ou un autre client MCP à des canaux pris en charge par OpenClaw
    - Exécution de `openclaw mcp serve`
    - Gestion des définitions de serveur MCP enregistrées par OpenClaw
sidebarTitle: MCP
summary: Exposer les conversations de canal OpenClaw via MCP et gérer les définitions enregistrées de serveur MCP
title: MCP
x-i18n:
    generated_at: "2026-04-26T11:26:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1e003d974a7ae989f240d7608470ddcf2f37e20ca342cf4569c14677dc6fc1d8
    source_path: cli/mcp.md
    workflow: 15
---

`openclaw mcp` a deux fonctions :

- exécuter OpenClaw comme serveur MCP avec `openclaw mcp serve`
- gérer les définitions de serveur MCP sortant possédées par OpenClaw avec `list`, `show`, `set` et `unset`

Autrement dit :

- `serve` correspond à OpenClaw agissant comme serveur MCP
- `list` / `show` / `set` / `unset` correspondent à OpenClaw agissant comme registre côté client MCP pour d’autres serveurs MCP que ses runtimes pourront consommer plus tard

Utilisez [`openclaw acp`](/fr/cli/acp) lorsque OpenClaw doit lui-même héberger une session de harnais de codage et router ce runtime via ACP.

## OpenClaw comme serveur MCP

C’est le chemin `openclaw mcp serve`.

### Quand utiliser `serve`

Utilisez `openclaw mcp serve` lorsque :

- Codex, Claude Code ou un autre client MCP doit parler directement à des conversations de canal prises en charge par OpenClaw
- vous avez déjà une Gateway OpenClaw locale ou distante avec des sessions routées
- vous voulez un seul serveur MCP qui fonctionne sur les backends de canal d’OpenClaw au lieu d’exécuter des ponts distincts par canal

Utilisez plutôt [`openclaw acp`](/fr/cli/acp) lorsque OpenClaw doit héberger lui-même le runtime de codage et conserver la session d’agent à l’intérieur d’OpenClaw.

### Fonctionnement

`openclaw mcp serve` démarre un serveur MCP stdio. Le client MCP possède ce processus. Tant que le client garde la session stdio ouverte, le pont se connecte à une Gateway OpenClaw locale ou distante via WebSocket et expose les conversations de canal routées via MCP.

<Steps>
  <Step title="Le client lance le pont">
    Le client MCP lance `openclaw mcp serve`.
  </Step>
  <Step title="Le pont se connecte à la Gateway">
    Le pont se connecte à la Gateway OpenClaw via WebSocket.
  </Step>
  <Step title="Les sessions deviennent des conversations MCP">
    Les sessions routées deviennent des conversations MCP et des outils de transcription/historique.
  </Step>
  <Step title="File d’attente des événements en direct">
    Les événements en direct sont mis en file d’attente en mémoire tant que le pont est connecté.
  </Step>
  <Step title="Push Claude facultatif">
    Si le mode canal Claude est activé, la même session peut aussi recevoir des notifications push spécifiques à Claude.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Comportement important">
    - l’état de la file d’attente en direct démarre lorsque le pont se connecte
    - l’historique de transcription plus ancien est lu avec `messages_read`
    - les notifications push Claude n’existent que tant que la session MCP est active
    - lorsque le client se déconnecte, le pont se ferme et la file d’attente en direct disparaît
    - les points d’entrée d’agent à exécution unique tels que `openclaw agent` et `openclaw infer model run` retirent tous les runtimes MCP intégrés qu’ils ouvrent une fois la réponse terminée, afin que les exécutions répétées par script n’accumulent pas de processus enfants MCP stdio
    - les serveurs MCP stdio lancés par OpenClaw (intégrés ou configurés par l’utilisateur) sont arrêtés comme un arbre de processus à l’extinction, de sorte que les sous-processus enfants démarrés par le serveur ne survivent pas après la fermeture du client stdio parent
    - la suppression ou la réinitialisation d’une session détruit les clients MCP de cette session via le chemin de nettoyage partagé du runtime, de sorte qu’il n’existe aucune connexion stdio persistante liée à une session supprimée
  </Accordion>
</AccordionGroup>

### Choisir un mode client

Utilisez le même pont de deux façons différentes :

<Tabs>
  <Tab title="Clients MCP génériques">
    Outils MCP standard uniquement. Utilisez `conversations_list`, `messages_read`, `events_poll`, `events_wait`, `messages_send` et les outils d’approbation.
  </Tab>
  <Tab title="Claude Code">
    Outils MCP standard plus l’adaptateur de canal spécifique à Claude. Activez `--claude-channel-mode on` ou laissez la valeur par défaut `auto`.
  </Tab>
</Tabs>

<Note>
Aujourd’hui, `auto` se comporte comme `on`. Il n’existe pas encore de détection des capacités du client.
</Note>

### Ce que `serve` expose

Le pont utilise les métadonnées de route de session Gateway existantes pour exposer des conversations prises en charge par un canal. Une conversation apparaît lorsqu’OpenClaw possède déjà un état de session avec une route connue, telle que :

- `channel`
- métadonnées de destinataire ou de destination
- `accountId` facultatif
- `threadId` facultatif

Cela donne aux clients MCP un seul endroit pour :

- lister les conversations routées récentes
- lire l’historique de transcription récent
- attendre de nouveaux événements entrants
- renvoyer une réponse par la même route
- voir les demandes d’approbation qui arrivent pendant que le pont est connecté

### Utilisation

<Tabs>
  <Tab title="Gateway locale">
    ```bash
    openclaw mcp serve
    ```
  </Tab>
  <Tab title="Gateway distante (jeton)">
    ```bash
    openclaw mcp serve --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token
    ```
  </Tab>
  <Tab title="Gateway distante (mot de passe)">
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
    Liste les conversations récentes adossées à une session qui possèdent déjà des métadonnées de route dans l’état de session Gateway.

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
    Lit les messages de transcription récents pour une conversation adossée à une session.
  </Accordion>
  <Accordion title="attachments_fetch">
    Extrait les blocs de contenu de message non textuels d’un message de transcription. Il s’agit d’une vue de métadonnées sur le contenu de la transcription, et non d’un magasin autonome et durable de blobs de pièces jointes.
  </Accordion>
  <Accordion title="events_poll">
    Lit les événements en direct mis en file d’attente à partir d’un curseur numérique.
  </Accordion>
  <Accordion title="events_wait">
    Effectue une interrogation longue jusqu’à l’arrivée du prochain événement mis en file d’attente correspondant ou jusqu’à expiration du délai.

    Utilisez-le lorsqu’un client MCP générique a besoin d’une livraison quasi temps réel sans protocole push spécifique à Claude.

  </Accordion>
  <Accordion title="messages_send">
    Renvoie du texte par la même route déjà enregistrée sur la session.

    Comportement actuel :

    - nécessite une route de conversation existante
    - utilise le canal, le destinataire, l’ID de compte et l’ID de fil de la session
    - envoie du texte uniquement

  </Accordion>
  <Accordion title="permissions_list_open">
    Liste les demandes d’approbation exec/plugin en attente que le pont a observées depuis sa connexion à la Gateway.
  </Accordion>
  <Accordion title="permissions_respond">
    Résout une demande d’approbation exec/plugin en attente avec :

    - `allow-once`
    - `allow-always`
    - `deny`

  </Accordion>
</AccordionGroup>

### Modèle d’événement

Le pont conserve une file d’attente d’événements en mémoire tant qu’il est connecté.

Types d’événements actuels :

- `message`
- `exec_approval_requested`
- `exec_approval_resolved`
- `plugin_approval_requested`
- `plugin_approval_resolved`
- `claude_permission_request`

<Warning>
- la file d’attente est uniquement en direct ; elle démarre lorsque le pont MCP démarre
- `events_poll` et `events_wait` ne rejouent pas d’eux-mêmes l’historique plus ancien de la Gateway
- le backlog durable doit être lu avec `messages_read`
</Warning>

### Notifications de canal Claude

Le pont peut aussi exposer des notifications de canal spécifiques à Claude. C’est l’équivalent OpenClaw d’un adaptateur de canal Claude Code : les outils MCP standard restent disponibles, mais les messages entrants en direct peuvent aussi arriver sous forme de notifications MCP spécifiques à Claude.

<Tabs>
  <Tab title="off">
    `--claude-channel-mode off` : outils MCP standard uniquement.
  </Tab>
  <Tab title="on">
    `--claude-channel-mode on` : active les notifications de canal Claude.
  </Tab>
  <Tab title="auto (par défaut)">
    `--claude-channel-mode auto` : valeur par défaut actuelle ; même comportement de pont que `on`.
  </Tab>
</Tabs>

Lorsque le mode canal Claude est activé, le serveur annonce des capacités expérimentales Claude et peut émettre :

- `notifications/claude/channel`
- `notifications/claude/channel/permission`

Comportement actuel du pont :

- les messages de transcription entrants `user` sont transmis comme `notifications/claude/channel`
- les demandes d’autorisation Claude reçues via MCP sont suivies en mémoire
- si la conversation liée envoie ensuite `yes abcde` ou `no abcde`, le pont convertit cela en `notifications/claude/channel/permission`
- ces notifications sont limitées à la session en direct ; si le client MCP se déconnecte, il n’existe plus de cible push

Ce comportement est volontairement spécifique au client. Les clients MCP génériques doivent s’appuyer sur les outils d’interrogation standard.

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

Pour la plupart des clients MCP génériques, commencez par la surface d’outils standard et ignorez le mode Claude. Activez le mode Claude uniquement pour les clients qui comprennent réellement les méthodes de notification spécifiques à Claude.

### Options

`openclaw mcp serve` prend en charge :

<ParamField path="--url" type="string">
  URL WebSocket de la Gateway.
</ParamField>
<ParamField path="--token" type="string">
  Jeton Gateway.
</ParamField>
<ParamField path="--token-file" type="string">
  Lit le jeton depuis un fichier.
</ParamField>
<ParamField path="--password" type="string">
  Mot de passe Gateway.
</ParamField>
<ParamField path="--password-file" type="string">
  Lit le mot de passe depuis un fichier.
</ParamField>
<ParamField path="--claude-channel-mode" type='"auto" | "on" | "off"'>
  Mode de notification Claude.
</ParamField>
<ParamField path="-v, --verbose" type="boolean">
  Journaux verbeux sur stderr.
</ParamField>

<Tip>
Préférez `--token-file` ou `--password-file` aux secrets en ligne lorsque c’est possible.
</Tip>

### Sécurité et frontière de confiance

Le pont n’invente pas le routage. Il expose uniquement les conversations que la Gateway sait déjà router.

Cela signifie :

- les listes d’autorisation d’expéditeur, l’appairage et la confiance au niveau du canal relèvent toujours de la configuration de canal OpenClaw sous-jacente
- `messages_send` ne peut répondre que par une route stockée existante
- l’état d’approbation est uniquement en direct/en mémoire pour la session de pont actuelle
- l’authentification du pont doit utiliser les mêmes contrôles de jeton ou de mot de passe Gateway que vous jugeriez fiables pour tout autre client Gateway distant

Si une conversation est absente de `conversations_list`, la cause habituelle n’est pas la configuration MCP. Il s’agit de métadonnées de route manquantes ou incomplètes dans la session Gateway sous-jacente.

### Tests

OpenClaw fournit un smoke Docker déterministe pour ce pont :

```bash
pnpm test:docker:mcp-channels
```

Ce smoke :

- démarre un conteneur Gateway amorcé
- démarre un second conteneur qui lance `openclaw mcp serve`
- vérifie la découverte des conversations, les lectures de transcription, les lectures de métadonnées de pièces jointes, le comportement de la file d’attente d’événements en direct et le routage des envois sortants
- valide les notifications de canal et d’autorisation de style Claude via le vrai pont MCP stdio

C’est le moyen le plus rapide de prouver que le pont fonctionne sans raccorder un vrai compte Telegram, Discord ou iMessage à l’exécution de test.

Pour un contexte de test plus large, voir [Tests](/fr/help/testing).

### Dépannage

<AccordionGroup>
  <Accordion title="Aucune conversation renvoyée">
    Cela signifie généralement que la session Gateway n’est pas déjà routable. Vérifiez que la session sous-jacente a bien enregistré les métadonnées de route de canal/fournisseur, de destinataire, et éventuellement de compte/fil.
  </Accordion>
  <Accordion title="events_poll ou events_wait manque des messages plus anciens">
    C’est attendu. La file d’attente en direct démarre lorsque le pont se connecte. Lisez l’historique de transcription plus ancien avec `messages_read`.
  </Accordion>
  <Accordion title="Les notifications Claude n’apparaissent pas">
    Vérifiez tous ces points :

    - le client a gardé la session MCP stdio ouverte
    - `--claude-channel-mode` vaut `on` ou `auto`
    - le client comprend réellement les méthodes de notification spécifiques à Claude
    - le message entrant est arrivé après la connexion du pont

  </Accordion>
  <Accordion title="Les approbations sont absentes">
    `permissions_list_open` affiche uniquement les demandes d’approbation observées pendant que le pont était connecté. Ce n’est pas une API d’historique durable des approbations.
  </Accordion>
</AccordionGroup>

## OpenClaw comme registre client MCP

C’est le chemin `openclaw mcp list`, `show`, `set` et `unset`.

Ces commandes n’exposent pas OpenClaw via MCP. Elles gèrent les définitions de serveur MCP possédées par OpenClaw sous `mcp.servers` dans la configuration OpenClaw.

Ces définitions enregistrées servent aux runtimes qu’OpenClaw lance ou configure plus tard, comme Pi intégré et d’autres adaptateurs de runtime. OpenClaw stocke les définitions de manière centralisée afin que ces runtimes n’aient pas à conserver leurs propres listes dupliquées de serveurs MCP.

<AccordionGroup>
  <Accordion title="Comportement important">
    - ces commandes lisent ou écrivent uniquement la configuration OpenClaw
    - elles ne se connectent pas au serveur MCP cible
    - elles ne valident pas si la commande, l’URL ou le transport distant est joignable actuellement
    - les adaptateurs de runtime décident quels formats de transport ils prennent réellement en charge au moment de l’exécution
    - Pi intégré expose les outils MCP configurés dans les profils d’outils normaux `coding` et `messaging` ; `minimal` les masque toujours, et `tools.deny: ["bundle-mcp"]` les désactive explicitement
    - les runtimes MCP intégrés limités à une session sont récupérés après `mcp.sessionIdleTtlMs` millisecondes d’inactivité (10 minutes par défaut ; définissez `0` pour désactiver) et les exécutions intégrées à usage unique les nettoient à la fin de l’exécution
  </Accordion>
</AccordionGroup>

Les adaptateurs de runtime peuvent normaliser ce registre partagé dans le format attendu par leur client en aval. Par exemple, Pi intégré consomme directement les valeurs OpenClaw `transport`, tandis que Claude Code et Gemini reçoivent des valeurs `type` natives CLI telles que `http`, `sse` ou `stdio`.

### Définitions enregistrées de serveur MCP

OpenClaw stocke aussi dans la configuration un registre léger de serveurs MCP pour les surfaces qui veulent des définitions MCP gérées par OpenClaw.

Commandes :

- `openclaw mcp list`
- `openclaw mcp show [name]`
- `openclaw mcp set <name> <json>`
- `openclaw mcp unset <name>`

Remarques :

- `list` trie les noms de serveur.
- `show` sans nom affiche l’objet complet des serveurs MCP configurés.
- `set` attend une seule valeur d’objet JSON sur la ligne de commande.
- `unset` échoue si le serveur nommé n’existe pas.

Exemples :

```bash
openclaw mcp list
openclaw mcp show context7 --json
openclaw mcp set context7 '{"command":"uvx","args":["context7-mcp"]}'
openclaw mcp set docs '{"url":"https://mcp.example.com"}'
openclaw mcp unset context7
```

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
        "url": "https://mcp.example.com"
      }
    }
  }
}
```

### Transport stdio

Lance un processus enfant local et communique via stdin/stdout.

| Champ                      | Description                         |
| -------------------------- | ----------------------------------- |
| `command`                  | Exécutable à lancer (obligatoire)   |
| `args`                     | Tableau d’arguments de ligne de commande |
| `env`                      | Variables d’environnement supplémentaires |
| `cwd` / `workingDirectory` | Répertoire de travail du processus  |

<Warning>
**Filtre de sécurité env pour stdio**

OpenClaw rejette les clés d’environnement de démarrage d’interpréteur qui peuvent modifier la manière dont un serveur MCP stdio démarre avant le premier RPC, même si elles apparaissent dans le bloc `env` d’un serveur. Les clés bloquées incluent `NODE_OPTIONS`, `PYTHONSTARTUP`, `PYTHONPATH`, `PERL5OPT`, `RUBYOPT`, `SHELLOPTS`, `PS4` et des variables similaires de contrôle du runtime. Le démarrage rejette ces clés avec une erreur de configuration afin qu’elles ne puissent pas injecter un préambule implicite, remplacer l’interpréteur ou activer un débogueur sur le processus stdio. Les variables d’environnement ordinaires d’identifiants, de proxy et spécifiques au serveur (`GITHUB_TOKEN`, `HTTP_PROXY`, `*_API_KEY` personnalisées, etc.) ne sont pas affectées.

Si votre serveur MCP a réellement besoin de l’une de ces variables bloquées, définissez-la sur le processus hôte de la Gateway plutôt que sous `env` du serveur stdio.
</Warning>

### Transport SSE / HTTP

Se connecte à un serveur MCP distant via HTTP Server-Sent Events.

| Champ                 | Description                                                      |
| --------------------- | ---------------------------------------------------------------- |
| `url`                 | URL HTTP ou HTTPS du serveur distant (obligatoire)               |
| `headers`             | Mappage clé-valeur facultatif des en-têtes HTTP (par exemple des jetons d’authentification) |
| `connectionTimeoutMs` | Délai de connexion par serveur en ms (facultatif)                |

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

### Transport HTTP streamable

`streamable-http` est une option de transport supplémentaire aux côtés de `sse` et `stdio`. Il utilise le streaming HTTP pour une communication bidirectionnelle avec des serveurs MCP distants.

| Champ                 | Description                                                                            |
| --------------------- | -------------------------------------------------------------------------------------- |
| `url`                 | URL HTTP ou HTTPS du serveur distant (obligatoire)                                     |
| `transport`           | Définissez `"streamable-http"` pour sélectionner ce transport ; s’il est omis, OpenClaw utilise `sse` |
| `headers`             | Mappage clé-valeur facultatif des en-têtes HTTP (par exemple des jetons d’authentification) |
| `connectionTimeoutMs` | Délai de connexion par serveur en ms (facultatif)                                      |

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
Ces commandes gèrent uniquement la configuration enregistrée. Elles ne démarrent pas le pont de canal, n’ouvrent pas de session client MCP en direct et ne prouvent pas que le serveur cible est joignable.
</Note>

## Limites actuelles

Cette page documente le pont tel qu’il est livré aujourd’hui.

Limites actuelles :

- la découverte des conversations dépend des métadonnées de route de session Gateway existantes
- aucun protocole push générique au-delà de l’adaptateur spécifique à Claude
- pas encore d’outils de modification ou de réaction aux messages
- le transport HTTP/SSE/streamable-http se connecte à un seul serveur distant ; aucun amont multiplexé pour le moment
- `permissions_list_open` inclut uniquement les approbations observées pendant que le pont est connecté

## Connexe

- [Référence CLI](/fr/cli)
- [Plugins](/fr/cli/plugins)
