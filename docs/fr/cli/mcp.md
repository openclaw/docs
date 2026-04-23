---
read_when:
    - Connexion de Codex, Claude Code ou d’un autre client MCP à des canaux pris en charge par OpenClaw
    - Exécution de `openclaw mcp serve`
    - Gestion des définitions de serveurs MCP enregistrées par OpenClaw
summary: Exposer les conversations de canal OpenClaw via MCP et gérer les définitions enregistrées de serveurs MCP
title: mcp
x-i18n:
    generated_at: "2026-04-23T07:01:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: bbc528a7490132f4b505f62bdc4556602243a5e27557c4965c2e1d4f80ad00bd
    source_path: cli/mcp.md
    workflow: 15
---

# mcp

`openclaw mcp` a deux rôles :

- exécuter OpenClaw comme serveur MCP avec `openclaw mcp serve`
- gérer les définitions de serveurs MCP sortants détenues par OpenClaw avec `list`, `show`,
  `set` et `unset`

En d’autres termes :

- `serve` correspond à OpenClaw agissant comme serveur MCP
- `list` / `show` / `set` / `unset` correspondent à OpenClaw agissant comme registre
  côté client MCP pour d’autres serveurs MCP que ses runtimes pourront consommer plus tard

Utilisez [`openclaw acp`](/fr/cli/acp) lorsque OpenClaw doit héberger lui-même une
session de harnais de codage et acheminer ce runtime via ACP.

## OpenClaw comme serveur MCP

Il s’agit du chemin `openclaw mcp serve`.

## Quand utiliser `serve`

Utilisez `openclaw mcp serve` lorsque :

- Codex, Claude Code ou un autre client MCP doit parler directement à des
  conversations de canal prises en charge par OpenClaw
- vous avez déjà une Gateway OpenClaw locale ou distante avec des sessions routées
- vous voulez un serveur MCP unique qui fonctionne sur les backends de canaux OpenClaw
  au lieu d’exécuter des passerelles séparées par canal

Utilisez plutôt [`openclaw acp`](/fr/cli/acp) lorsque OpenClaw doit héberger lui-même le
runtime de codage et conserver la session agent à l’intérieur de OpenClaw.

## Fonctionnement

`openclaw mcp serve` démarre un serveur MCP stdio. Le client MCP possède ce
processus. Tant que le client garde la session stdio ouverte, la passerelle se connecte à une
Gateway OpenClaw locale ou distante via WebSocket et expose des conversations de canal
routées via MCP.

Cycle de vie :

1. le client MCP lance `openclaw mcp serve`
2. la passerelle se connecte à la Gateway
3. les sessions routées deviennent des conversations MCP et des outils d’historique/transcription
4. les événements live sont mis en file en mémoire tant que la passerelle reste connectée
5. si le mode canal Claude est activé, la même session peut aussi recevoir
   des notifications push spécifiques à Claude

Comportement important :

- l’état de la file live démarre lorsque la passerelle se connecte
- l’historique plus ancien de la transcription est lu avec `messages_read`
- les notifications push Claude n’existent que tant que la session MCP est active
- lorsque le client se déconnecte, la passerelle s’arrête et la file live disparaît

## Choisir un mode client

Utilisez la même passerelle de deux façons différentes :

- Clients MCP génériques : outils MCP standards uniquement. Utilisez `conversations_list`,
  `messages_read`, `events_poll`, `events_wait`, `messages_send` et les
  outils d’approbation.
- Claude Code : outils MCP standards plus l’adaptateur de canal spécifique à Claude.
  Activez `--claude-channel-mode on` ou laissez la valeur par défaut `auto`.

Aujourd’hui, `auto` se comporte comme `on`. Il n’existe pas encore de détection
des capacités du client.

## Ce que `serve` expose

La passerelle utilise les métadonnées de route de session existantes dans la Gateway pour exposer des
conversations adossées à des canaux. Une conversation apparaît lorsque OpenClaw possède déjà
un état de session avec une route connue telle que :

- `channel`
- métadonnées de destinataire ou de destination
- `accountId` facultatif
- `threadId` facultatif

Cela donne aux clients MCP un endroit unique pour :

- lister les conversations routées récentes
- lire l’historique récent de transcription
- attendre de nouveaux événements entrants
- renvoyer une réponse par la même route
- voir les demandes d’approbation qui arrivent pendant que la passerelle est connectée

## Utilisation

```bash
# Gateway locale
openclaw mcp serve

# Gateway distante
openclaw mcp serve --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Gateway distante avec authentification par mot de passe
openclaw mcp serve --url wss://gateway-host:18789 --password-file ~/.openclaw/gateway.password

# Activer les journaux détaillés de la passerelle
openclaw mcp serve --verbose

# Désactiver les notifications push spécifiques à Claude
openclaw mcp serve --claude-channel-mode off
```

## Outils de la passerelle

La passerelle actuelle expose ces outils MCP :

- `conversations_list`
- `conversation_get`
- `messages_read`
- `attachments_fetch`
- `events_poll`
- `events_wait`
- `messages_send`
- `permissions_list_open`
- `permissions_respond`

### `conversations_list`

Liste les conversations récentes adossées à des sessions qui possèdent déjà des métadonnées de route dans
l’état de session de la Gateway.

Filtres utiles :

- `limit`
- `search`
- `channel`
- `includeDerivedTitles`
- `includeLastMessage`

### `conversation_get`

Renvoie une conversation par `session_key`.

### `messages_read`

Lit les messages récents de la transcription pour une conversation adossée à une session.

### `attachments_fetch`

Extrait les blocs de contenu de message non textuels d’un message de transcription. Il s’agit d’une
vue de métadonnées sur le contenu de la transcription, et non d’un stockage autonome durable
de blobs de pièces jointes.

### `events_poll`

Lit les événements live en file depuis un curseur numérique.

### `events_wait`

Effectue un long polling jusqu’à l’arrivée du prochain événement correspondant dans la file ou jusqu’à expiration d’un délai.

Utilisez ceci lorsqu’un client MCP générique a besoin d’une livraison quasi temps réel sans
protocole push spécifique à Claude.

### `messages_send`

Renvoie du texte par la même route déjà enregistrée sur la session.

Comportement actuel :

- nécessite une route de conversation existante
- utilise le canal, le destinataire, l’identifiant de compte et l’identifiant de fil de la session
- envoie du texte uniquement

### `permissions_list_open`

Liste les demandes d’approbation exec/plugin en attente que la passerelle a observées depuis sa
connexion à la Gateway.

### `permissions_respond`

Résout une demande d’approbation exec/plugin en attente avec :

- `allow-once`
- `allow-always`
- `deny`

## Modèle d’événements

La passerelle conserve une file d’événements en mémoire tant qu’elle reste connectée.

Types d’événements actuels :

- `message`
- `exec_approval_requested`
- `exec_approval_resolved`
- `plugin_approval_requested`
- `plugin_approval_resolved`
- `claude_permission_request`

Limites importantes :

- la file est uniquement live ; elle démarre lorsque la passerelle MCP démarre
- `events_poll` et `events_wait` ne rejouent pas d’eux-mêmes l’historique plus ancien de la Gateway
- un backlog durable doit être lu avec `messages_read`

## Notifications de canal Claude

La passerelle peut aussi exposer des notifications de canal spécifiques à Claude. C’est
l’équivalent OpenClaw d’un adaptateur de canal Claude Code : les outils MCP standards restent
disponibles, mais les messages entrants live peuvent aussi arriver comme notifications MCP
spécifiques à Claude.

Indicateurs :

- `--claude-channel-mode off` : outils MCP standards uniquement
- `--claude-channel-mode on` : active les notifications de canal Claude
- `--claude-channel-mode auto` : valeur par défaut actuelle ; même comportement de passerelle que `on`

Lorsque le mode canal Claude est activé, le serveur annonce des capacités expérimentales Claude
et peut émettre :

- `notifications/claude/channel`
- `notifications/claude/channel/permission`

Comportement actuel de la passerelle :

- les messages de transcription entrants `user` sont retransmis comme
  `notifications/claude/channel`
- les demandes d’autorisation Claude reçues via MCP sont suivies en mémoire
- si la conversation liée envoie ensuite `yes abcde` ou `no abcde`, la passerelle
  convertit cela en `notifications/claude/channel/permission`
- ces notifications ne valent que pour la session live ; si le client MCP se déconnecte,
  il n’existe plus de cible push

Ceci est volontairement spécifique au client. Les clients MCP génériques doivent s’appuyer sur les
outils de polling standards.

## Configuration du client MCP

Exemple de configuration client stdio :

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

Pour la plupart des clients MCP génériques, commencez par la surface d’outils standard et ignorez
le mode Claude. Activez le mode Claude uniquement pour les clients qui comprennent réellement les
méthodes de notification spécifiques à Claude.

## Options

`openclaw mcp serve` prend en charge :

- `--url <url>` : URL WebSocket de la Gateway
- `--token <token>` : jeton de la Gateway
- `--token-file <path>` : lire le jeton depuis un fichier
- `--password <password>` : mot de passe de la Gateway
- `--password-file <path>` : lire le mot de passe depuis un fichier
- `--claude-channel-mode <auto|on|off>` : mode de notification Claude
- `-v`, `--verbose` : journaux détaillés sur stderr

Préférez `--token-file` ou `--password-file` aux secrets en ligne de commande lorsque c’est possible.

## Sécurité et limite de confiance

La passerelle n’invente pas le routage. Elle expose uniquement les conversations que la Gateway
sait déjà router.

Cela signifie :

- les listes d’autorisation d’expéditeur, l’appairage et la confiance au niveau canal relèvent toujours de la
  configuration de canal OpenClaw sous-jacente
- `messages_send` ne peut répondre qu’au travers d’une route stockée existante
- l’état d’approbation n’est live/en mémoire que pour la session courante de la passerelle
- l’authentification de la passerelle doit utiliser les mêmes contrôles par jeton ou mot de passe de Gateway que vous
  jugeriez fiables pour tout autre client Gateway distant

Si une conversation manque dans `conversations_list`, la cause habituelle n’est pas la
configuration MCP. Il s’agit de métadonnées de route absentes ou incomplètes dans la session
Gateway sous-jacente.

## Tests

OpenClaw fournit un smoke Docker déterministe pour cette passerelle :

```bash
pnpm test:docker:mcp-channels
```

Ce smoke :

- démarre un conteneur Gateway amorcé
- démarre un second conteneur qui lance `openclaw mcp serve`
- vérifie la découverte de conversations, les lectures de transcription, les lectures de métadonnées de pièces jointes,
  le comportement de la file d’événements live et le routage des envois sortants
- valide les notifications de canal et d’autorisation de style Claude sur la vraie
  passerelle MCP stdio

C’est le moyen le plus rapide de prouver que la passerelle fonctionne sans connecter un vrai
compte Telegram, Discord ou iMessage à l’exécution de test.

Pour un contexte de test plus large, voir [Testing](/fr/help/testing).

## Dépannage

### Aucune conversation renvoyée

Cela signifie généralement que la session Gateway n’est pas déjà routable. Confirmez que la
session sous-jacente possède bien les métadonnées de route stockées pour le canal/fournisseur,
le destinataire et, éventuellement, le compte/fil.

### `events_poll` ou `events_wait` manquent des messages plus anciens

C’est attendu. La file live démarre lorsque la passerelle se connecte. Lisez l’historique plus ancien de la transcription
avec `messages_read`.

### Les notifications Claude n’apparaissent pas

Vérifiez tous les points suivants :

- le client a conservé la session MCP stdio ouverte
- `--claude-channel-mode` vaut `on` ou `auto`
- le client comprend réellement les méthodes de notification spécifiques à Claude
- le message entrant s’est produit après la connexion de la passerelle

### Les approbations sont absentes

`permissions_list_open` n’affiche que les demandes d’approbation observées pendant que la passerelle
était connectée. Ce n’est pas une API durable d’historique des approbations.

## OpenClaw comme registre client MCP

Il s’agit du chemin `openclaw mcp list`, `show`, `set` et `unset`.

Ces commandes n’exposent pas OpenClaw via MCP. Elles gèrent les définitions de serveurs MCP
détenues par OpenClaw sous `mcp.servers` dans la configuration OpenClaw.

Ces définitions enregistrées sont destinées aux runtimes que OpenClaw lance ou configure
plus tard, comme Pi intégré et d’autres adaptateurs de runtime. OpenClaw stocke les
définitions de façon centralisée afin que ces runtimes n’aient pas à conserver leurs propres listes
dupliquées de serveurs MCP.

Comportement important :

- ces commandes ne lisent ou n’écrivent que la configuration OpenClaw
- elles ne se connectent pas au serveur MCP cible
- elles ne valident pas si la commande, l’URL ou le transport distant est
  joignable à cet instant
- les adaptateurs de runtime décident quelles formes de transport ils prennent réellement en charge au
  moment de l’exécution
- Pi intégré expose les outils MCP configurés dans les profils d’outils normaux `coding` et `messaging` ;
  `minimal` les masque toujours, et `tools.deny: ["bundle-mcp"]`
  les désactive explicitement

## Définitions enregistrées de serveurs MCP

OpenClaw stocke aussi dans la configuration un registre léger de serveurs MCP pour les surfaces
qui veulent des définitions MCP gérées par OpenClaw.

Commandes :

- `openclaw mcp list`
- `openclaw mcp show [name]`
- `openclaw mcp set <name> <json>`
- `openclaw mcp unset <name>`

Remarques :

- `list` trie les noms de serveur.
- `show` sans nom affiche l’objet complet des serveurs MCP configurés.
- `set` attend une valeur d’objet JSON sur une seule ligne de commande.
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

| Champ                    | Description                                  |
| ------------------------ | -------------------------------------------- |
| `command`                | Exécutable à lancer (requis)                 |
| `args`                   | Tableau d’arguments de ligne de commande     |
| `env`                    | Variables d’environnement supplémentaires    |
| `cwd` / `workingDirectory` | Répertoire de travail du processus         |

#### Filtre de sécurité des variables d’environnement stdio

OpenClaw rejette les clés d’environnement de démarrage d’interpréteur qui peuvent modifier la manière dont un serveur MCP stdio démarre avant le premier RPC, même si elles apparaissent dans le bloc `env` d’un serveur. Les clés bloquées incluent `NODE_OPTIONS`, `PYTHONSTARTUP`, `PYTHONPATH`, `PERL5OPT`, `RUBYOPT`, `SHELLOPTS`, `PS4` et des variables similaires de contrôle du runtime. Le démarrage les rejette avec une erreur de configuration afin qu’elles ne puissent pas injecter un prélude implicite, remplacer l’interpréteur ou activer un débogueur contre le processus stdio. Les variables d’environnement ordinaires d’identifiants, de proxy et spécifiques au serveur (`GITHUB_TOKEN`, `HTTP_PROXY`, `*_API_KEY` personnalisées, etc.) ne sont pas affectées.

Si votre serveur MCP a réellement besoin de l’une des variables bloquées, définissez-la sur le processus hôte de la Gateway plutôt que dans `env` du serveur stdio.

### Transport SSE / HTTP

Se connecte à un serveur MCP distant via HTTP Server-Sent Events.

| Champ                 | Description                                                        |
| --------------------- | ------------------------------------------------------------------ |
| `url`                 | URL HTTP ou HTTPS du serveur distant (requis)                      |
| `headers`             | Mappage clé-valeur optionnel des en-têtes HTTP (par ex. jetons d’authentification) |
| `connectionTimeoutMs` | Délai de connexion par serveur en ms (optionnel)                   |

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

Les valeurs sensibles dans `url` (userinfo) et `headers` sont masquées dans les journaux et
dans la sortie d’état.

### Transport HTTP streamable

`streamable-http` est une option de transport supplémentaire aux côtés de `sse` et `stdio`. Il utilise le streaming HTTP pour une communication bidirectionnelle avec des serveurs MCP distants.

| Champ                 | Description                                                                                |
| --------------------- | ------------------------------------------------------------------------------------------ |
| `url`                 | URL HTTP ou HTTPS du serveur distant (requis)                                              |
| `transport`           | Définissez `"streamable-http"` pour sélectionner ce transport ; lorsqu’il est omis, OpenClaw utilise `sse` |
| `headers`             | Mappage clé-valeur optionnel des en-têtes HTTP (par ex. jetons d’authentification)         |
| `connectionTimeoutMs` | Délai de connexion par serveur en ms (optionnel)                                           |

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

Ces commandes gèrent uniquement la configuration enregistrée. Elles ne démarrent pas la passerelle de canal,
n’ouvrent pas une session client MCP live et ne prouvent pas que le serveur cible est joignable.

## Limites actuelles

Cette page documente la passerelle telle qu’elle est fournie aujourd’hui.

Limites actuelles :

- la découverte des conversations dépend des métadonnées de route de session Gateway existantes
- aucun protocole push générique au-delà de l’adaptateur spécifique à Claude
- pas encore d’outils de modification de message ou de réaction
- le transport HTTP/SSE/streamable-http se connecte à un seul serveur distant ; pas encore d’amont multiplexé
- `permissions_list_open` n’inclut que les approbations observées pendant que la passerelle est connectée
