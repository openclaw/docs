---
read_when:
    - Connexion de Codex, Claude Code ou d’un autre client MCP à des canaux adossés à OpenClaw
    - Exécution de `openclaw mcp serve`
    - Gestion des définitions de serveurs MCP enregistrées par OpenClaw
summary: Exposer les conversations de canaux OpenClaw via MCP et gérer les définitions enregistrées de serveurs MCP
title: MCP
x-i18n:
    generated_at: "2026-04-25T13:44:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: ca2a76d1dbca71b4048659c21ac7ff98a01cc6095f6baad67df5347f45cd32e6
    source_path: cli/mcp.md
    workflow: 15
---

`openclaw mcp` a deux rôles :

- exécuter OpenClaw comme serveur MCP avec `openclaw mcp serve`
- gérer les définitions sortantes de serveurs MCP appartenant à OpenClaw avec `list`, `show`,
  `set` et `unset`

En d’autres termes :

- `serve` correspond à OpenClaw agissant comme serveur MCP
- `list` / `show` / `set` / `unset` correspondent à OpenClaw agissant comme registre
  côté client MCP pour d’autres serveurs MCP que ses runtimes pourront consommer plus tard

Utilisez [`openclaw acp`](/fr/cli/acp) lorsque OpenClaw doit lui-même héberger une
session de harnais de codage et router ce runtime via ACP.

## OpenClaw comme serveur MCP

C’est le chemin `openclaw mcp serve`.

## Quand utiliser `serve`

Utilisez `openclaw mcp serve` lorsque :

- Codex, Claude Code ou un autre client MCP doit communiquer directement avec
  des conversations de canaux adossées à OpenClaw
- vous disposez déjà d’une Gateway OpenClaw locale ou distante avec des sessions routées
- vous voulez un seul serveur MCP qui fonctionne à travers les backends de canaux d’OpenClaw au lieu
  d’exécuter des passerelles distinctes par canal

Utilisez plutôt [`openclaw acp`](/fr/cli/acp) lorsque OpenClaw doit héberger lui-même le
runtime de codage et conserver la session d’agent à l’intérieur d’OpenClaw.

## Fonctionnement

`openclaw mcp serve` démarre un serveur MCP stdio. Le client MCP possède ce
processus. Tant que le client garde la session stdio ouverte, la passerelle se connecte à une
Gateway OpenClaw locale ou distante via WebSocket et expose des conversations de canaux routées via MCP.

Cycle de vie :

1. le client MCP lance `openclaw mcp serve`
2. la passerelle se connecte à Gateway
3. les sessions routées deviennent des conversations MCP et des outils de transcription/historique
4. les événements live sont mis en file d’attente en mémoire pendant que la passerelle est connectée
5. si le mode de canal Claude est activé, la même session peut aussi recevoir
   des notifications push spécifiques à Claude

Comportement important :

- l’état de la file d’attente live commence lorsque la passerelle se connecte
- l’historique de transcription plus ancien se lit avec `messages_read`
- les notifications push Claude n’existent que tant que la session MCP est active
- lorsque le client se déconnecte, la passerelle s’arrête et la file d’attente live disparaît
- les points d’entrée d’agent à usage unique comme `openclaw agent` et
  `openclaw infer model run` retirent tous les runtimes MCP intégrés qu’ils ouvrent lorsque la
  réponse se termine, afin que des exécutions scriptées répétées n’accumulent pas de processus enfants MCP stdio
- les serveurs MCP stdio lancés par OpenClaw (intégrés ou configurés par l’utilisateur) sont arrêtés
  comme un arbre de processus à l’extinction, de sorte que les sous-processus enfants démarrés par le
  serveur ne survivent pas après la sortie du client stdio parent
- la suppression ou la réinitialisation d’une session détruit les clients MCP de cette session via
  le chemin partagé de nettoyage du runtime, de sorte qu’il ne reste aucune connexion stdio persistante
  liée à une session supprimée

## Choisir un mode client

Utilisez la même passerelle de deux façons différentes :

- Clients MCP génériques : outils MCP standard uniquement. Utilisez `conversations_list`,
  `messages_read`, `events_poll`, `events_wait`, `messages_send` et les
  outils d’approbation.
- Claude Code : outils MCP standard plus l’adaptateur de canal spécifique à Claude.
  Activez `--claude-channel-mode on` ou laissez la valeur par défaut `auto`.

Aujourd’hui, `auto` se comporte comme `on`. Il n’existe pas encore de détection des capacités client.

## Ce que `serve` expose

La passerelle utilise les métadonnées existantes de routage de session Gateway pour exposer
des conversations adossées à des canaux. Une conversation apparaît lorsqu’OpenClaw dispose déjà
d’un état de session avec une route connue telle que :

- `channel`
- métadonnées de destinataire ou de destination
- `accountId` facultatif
- `threadId` facultatif

Cela donne aux clients MCP un seul endroit pour :

- lister les conversations routées récentes
- lire l’historique récent de transcription
- attendre de nouveaux événements entrants
- renvoyer une réponse via la même route
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
l’état de session Gateway.

Filtres utiles :

- `limit`
- `search`
- `channel`
- `includeDerivedTitles`
- `includeLastMessage`

### `conversation_get`

Renvoie une conversation par `session_key`.

### `messages_read`

Lit les messages récents de transcription pour une conversation adossée à une session.

### `attachments_fetch`

Extrait les blocs de contenu de message non textuels d’un message de transcription. Il s’agit d’une
vue de métadonnées sur le contenu de la transcription, et non d’un magasin de blobs de pièces jointes durable autonome.

### `events_poll`

Lit les événements live mis en file d’attente depuis un curseur numérique.

### `events_wait`

Effectue un polling long jusqu’à ce que le prochain événement correspondant mis en file d’attente arrive ou qu’un délai expire.

Utilisez-le lorsqu’un client MCP générique a besoin d’une remise quasi temps réel sans
protocole push spécifique à Claude.

### `messages_send`

Envoie du texte via la même route déjà enregistrée sur la session.

Comportement actuel :

- nécessite une route de conversation existante
- utilise le canal, le destinataire, l’identifiant de compte et l’identifiant de fil de la session
- envoie uniquement du texte

### `permissions_list_open`

Liste les demandes d’approbation exec/Plugin en attente que la passerelle a observées depuis qu’elle
s’est connectée à la Gateway.

### `permissions_respond`

Résout une demande d’approbation exec/Plugin en attente avec :

- `allow-once`
- `allow-always`
- `deny`

## Modèle d’événement

La passerelle conserve une file d’attente d’événements en mémoire pendant qu’elle est connectée.

Types d’événements actuels :

- `message`
- `exec_approval_requested`
- `exec_approval_resolved`
- `plugin_approval_requested`
- `plugin_approval_resolved`
- `claude_permission_request`

Limites importantes :

- la file d’attente est uniquement live ; elle commence au démarrage de la passerelle MCP
- `events_poll` et `events_wait` ne rejouent pas à eux seuls l’historique Gateway plus ancien
- le backlog durable doit être lu avec `messages_read`

## Notifications de canal Claude

La passerelle peut aussi exposer des notifications de canal spécifiques à Claude. C’est l’équivalent
OpenClaw d’un adaptateur de canal Claude Code : les outils MCP standard restent disponibles,
mais les messages entrants live peuvent aussi arriver comme notifications MCP spécifiques à Claude.

Drapeaux :

- `--claude-channel-mode off` : outils MCP standard uniquement
- `--claude-channel-mode on` : active les notifications de canal Claude
- `--claude-channel-mode auto` : valeur par défaut actuelle ; même comportement de passerelle que `on`

Lorsque le mode de canal Claude est activé, le serveur annonce des capacités expérimentales Claude
et peut émettre :

- `notifications/claude/channel`
- `notifications/claude/channel/permission`

Comportement actuel de la passerelle :

- les messages de transcription entrants `user` sont retransmis comme
  `notifications/claude/channel`
- les demandes d’autorisation Claude reçues via MCP sont suivies en mémoire
- si la conversation liée envoie ensuite `yes abcde` ou `no abcde`, la passerelle
  convertit cela en `notifications/claude/channel/permission`
- ces notifications n’existent que pour la session live ; si le client MCP se déconnecte,
  il n’y a plus de cible push

Ceci est volontairement spécifique au client. Les clients MCP génériques doivent s’appuyer sur les
outils de polling standard.

## Configuration du client MCP

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

Pour la plupart des clients MCP génériques, commencez par la surface d’outils standard et ignorez
le mode Claude. Activez le mode Claude uniquement pour les clients qui comprennent réellement les
méthodes de notification spécifiques à Claude.

## Options

`openclaw mcp serve` prend en charge :

- `--url <url>` : URL WebSocket de Gateway
- `--token <token>` : jeton Gateway
- `--token-file <path>` : lire le jeton depuis un fichier
- `--password <password>` : mot de passe Gateway
- `--password-file <path>` : lire le mot de passe depuis un fichier
- `--claude-channel-mode <auto|on|off>` : mode de notification Claude
- `-v`, `--verbose` : journaux détaillés sur stderr

Préférez `--token-file` ou `--password-file` aux secrets en ligne lorsque c’est possible.

## Sécurité et frontière de confiance

La passerelle n’invente pas le routage. Elle expose uniquement les conversations que Gateway
sait déjà router.

Cela signifie :

- les listes d’autorisation d’expéditeurs, l’appairage et la confiance au niveau canal relèvent toujours de la
  configuration du canal OpenClaw sous-jacent
- `messages_send` ne peut répondre que via une route enregistrée existante
- l’état d’approbation est live/en mémoire uniquement pour la session actuelle de la passerelle
- l’authentification de la passerelle doit utiliser les mêmes contrôles de jeton ou de mot de passe Gateway
  que vous considéreriez comme fiables pour tout autre client Gateway distant

Si une conversation manque dans `conversations_list`, la cause habituelle n’est pas la configuration
MCP. Il s’agit de métadonnées de route absentes ou incomplètes dans la session Gateway sous-jacente.

## Tests

OpenClaw fournit un smoke déterministe Docker pour cette passerelle :

```bash
pnpm test:docker:mcp-channels
```

Ce smoke :

- démarre un conteneur Gateway amorcé
- démarre un second conteneur qui lance `openclaw mcp serve`
- vérifie la découverte des conversations, la lecture des transcriptions, la lecture des métadonnées de pièces jointes,
  le comportement de la file d’attente d’événements live et le routage des envois sortants
- valide les notifications de style Claude de canal et d’autorisation sur la vraie passerelle MCP stdio

C’est le moyen le plus rapide de prouver que la passerelle fonctionne sans raccorder un vrai
compte Telegram, Discord ou iMessage à l’exécution de test.

Pour un contexte de test plus large, voir [Tests](/fr/help/testing).

## Dépannage

### Aucune conversation renvoyée

Cela signifie généralement que la session Gateway n’est pas déjà routable. Confirmez que la
session sous-jacente a enregistré le canal/fournisseur, le destinataire et les métadonnées de route
facultatives de compte/fil.

### `events_poll` ou `events_wait` manquent des messages plus anciens

C’est attendu. La file d’attente live commence lorsque la passerelle se connecte. Lisez l’historique
plus ancien de transcription avec `messages_read`.

### Les notifications Claude n’apparaissent pas

Vérifiez tous les points suivants :

- le client a gardé la session MCP stdio ouverte
- `--claude-channel-mode` vaut `on` ou `auto`
- le client comprend réellement les méthodes de notification spécifiques à Claude
- le message entrant s’est produit après la connexion de la passerelle

### Les approbations sont absentes

`permissions_list_open` ne montre que les demandes d’approbation observées pendant que la passerelle
était connectée. Ce n’est pas une API d’historique durable des approbations.

## OpenClaw comme registre client MCP

C’est le chemin `openclaw mcp list`, `show`, `set` et `unset`.

Ces commandes n’exposent pas OpenClaw via MCP. Elles gèrent les définitions de serveurs MCP
appartenant à OpenClaw sous `mcp.servers` dans la configuration OpenClaw.

Ces définitions enregistrées servent aux runtimes qu’OpenClaw lance ou configure
plus tard, comme Pi intégré et d’autres adaptateurs de runtime. OpenClaw stocke les
définitions de manière centralisée afin que ces runtimes n’aient pas à conserver leurs propres listes MCP
dupliquées.

Comportement important :

- ces commandes lisent ou écrivent uniquement la configuration OpenClaw
- elles ne se connectent pas au serveur MCP cible
- elles ne valident pas si la commande, l’URL ou le transport distant est
  accessible actuellement
- les adaptateurs de runtime décident quelles formes de transport ils prennent réellement en charge au
  moment de l’exécution
- Pi intégré expose les outils MCP configurés dans les profils d’outils normaux `coding` et `messaging` ;
  `minimal` les masque toujours, et `tools.deny: ["bundle-mcp"]`
  les désactive explicitement
- les runtimes MCP intégrés à portée de session sont récupérés après `mcp.sessionIdleTtlMs`
  millisecondes d’inactivité (10 minutes par défaut ; définissez `0` pour désactiver) et
  les exécutions intégrées à usage unique les nettoient à la fin de l’exécution

## Définitions enregistrées de serveurs MCP

OpenClaw stocke aussi un registre léger de serveurs MCP dans la configuration pour les surfaces
qui veulent des définitions MCP gérées par OpenClaw.

Commandes :

- `openclaw mcp list`
- `openclaw mcp show [name]`
- `openclaw mcp set <name> <json>`
- `openclaw mcp unset <name>`

Remarques :

- `list` trie les noms de serveur.
- `show` sans nom affiche l’objet complet des serveurs MCP configurés.
- `set` attend une valeur d’objet JSON sur la ligne de commande.
- `unset` échoue si le serveur nommé n’existe pas.

Exemples :

```bash
openclaw mcp list
openclaw mcp show context7 --json
openclaw mcp set context7 '{"command":"uvx","args":["context7-mcp"]}'
openclaw mcp set docs '{"url":"https://mcp.example.com"}'
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
        "url": "https://mcp.example.com"
      }
    }
  }
}
```

### Transport stdio

Lance un processus enfant local et communique via stdin/stdout.

| Champ                      | Description                            |
| -------------------------- | -------------------------------------- |
| `command`                  | Exécutable à lancer (requis)           |
| `args`                     | Tableau d’arguments de ligne de commande |
| `env`                      | Variables d’environnement supplémentaires |
| `cwd` / `workingDirectory` | Répertoire de travail du processus     |

#### Filtre de sécurité `env` pour stdio

OpenClaw rejette les clés `env` de démarrage d’interpréteur qui peuvent modifier la manière dont un serveur MCP stdio démarre avant le premier RPC, même si elles apparaissent dans le bloc `env` d’un serveur. Les clés bloquées incluent `NODE_OPTIONS`, `PYTHONSTARTUP`, `PYTHONPATH`, `PERL5OPT`, `RUBYOPT`, `SHELLOPTS`, `PS4` et des variables similaires de contrôle du runtime. Le démarrage les rejette avec une erreur de configuration afin qu’elles ne puissent pas injecter un prélude implicite, remplacer l’interpréteur ou activer un débogueur sur le processus stdio. Les variables d’environnement ordinaires d’identifiants, de proxy et spécifiques au serveur (`GITHUB_TOKEN`, `HTTP_PROXY`, des `*_API_KEY` personnalisées, etc.) ne sont pas concernées.

Si votre serveur MCP a réellement besoin de l’une des variables bloquées, définissez-la sur le processus hôte Gateway plutôt que sous `env` du serveur stdio.

### Transport SSE / HTTP

Se connecte à un serveur MCP distant via HTTP Server-Sent Events.

| Champ                 | Description                                                          |
| --------------------- | -------------------------------------------------------------------- |
| `url`                 | URL HTTP ou HTTPS du serveur distant (requise)                       |
| `headers`             | Mappage clé-valeur facultatif des en-têtes HTTP (par exemple jetons d’authentification) |
| `connectionTimeoutMs` | Délai de connexion par serveur en ms (facultatif)                    |

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
la sortie d’état.

### Transport HTTP diffusable

`streamable-http` est une option de transport supplémentaire aux côtés de `sse` et `stdio`. Il utilise le streaming HTTP pour une communication bidirectionnelle avec des serveurs MCP distants.

| Champ                 | Description                                                                            |
| --------------------- | -------------------------------------------------------------------------------------- |
| `url`                 | URL HTTP ou HTTPS du serveur distant (requise)                                         |
| `transport`           | Définissez `"streamable-http"` pour sélectionner ce transport ; lorsqu’il est omis, OpenClaw utilise `sse` |
| `headers`             | Mappage clé-valeur facultatif des en-têtes HTTP (par exemple jetons d’authentification) |
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

Ces commandes gèrent uniquement la configuration enregistrée. Elles ne démarrent pas la passerelle de canal,
n’ouvrent pas de session client MCP live et ne prouvent pas que le serveur cible est accessible.

## Limites actuelles

Cette page documente la passerelle telle qu’elle est livrée aujourd’hui.

Limites actuelles :

- la découverte de conversation dépend des métadonnées de route de session Gateway existantes
- pas de protocole push générique au-delà de l’adaptateur spécifique à Claude
- pas encore d’outils de modification ou de réaction aux messages
- le transport HTTP/SSE/streamable-http se connecte à un seul serveur distant ; pas encore d’amont multiplexé
- `permissions_list_open` inclut uniquement les approbations observées pendant que la passerelle est
  connectée

## Liens associés

- [Référence CLI](/fr/cli)
- [Plugins](/fr/cli/plugins)
