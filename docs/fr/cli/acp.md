---
read_when:
    - Configuration des intégrations d’IDE basées sur ACP
    - Débogage du routage des sessions ACP vers le Gateway
summary: Exécuter le pont ACP pour les intégrations aux IDE
title: ACP
x-i18n:
    generated_at: "2026-07-12T02:24:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: becdcfdd1cc62b206cc92e9b8248c79a2ff63cfc3779d8a124b9713e779ad33c
    source_path: cli/acp.md
    workflow: 16
---

Exécutez la passerelle [Agent Client Protocol (ACP)](https://agentclientprotocol.com/) qui communique avec un Gateway OpenClaw.

`openclaw acp` utilise ACP sur stdio pour les IDE et transmet les requêtes au Gateway par WebSocket, tout en associant les sessions ACP aux clés de session du Gateway. Il s’agit d’une passerelle ACP reposant sur le Gateway, et non d’un environnement d’exécution d’éditeur entièrement natif ACP : elle se concentre sur le routage des sessions, la transmission des requêtes et la diffusion des mises à jour en continu.

Si vous souhaitez qu’un client MCP externe communique directement avec les conversations des canaux OpenClaw au lieu d’héberger une session d’environnement ACP, utilisez plutôt [`openclaw mcp serve`](/fr/cli/mcp).

## Ce que ce n’est pas

`openclaw acp` signifie qu’OpenClaw agit comme serveur ACP : un IDE ou un client ACP se connecte à OpenClaw, qui transmet ensuite le travail à une session du Gateway.

Cela diffère des [agents ACP](/fr/tools/acp-agents), où OpenClaw exécute un environnement externe tel que Codex ou Claude Code via `acpx`.

Règle rapide :

- si l’éditeur ou le client doit communiquer avec OpenClaw via ACP : utilisez `openclaw acp`
- si OpenClaw doit lancer Codex, Claude ou Gemini comme environnement ACP : utilisez `/acp spawn` et les [agents ACP](/fr/tools/acp-agents)

## Matrice de compatibilité

| Domaine ACP                                                           | État          | Remarques                                                                                                                                                                                                                                                   |
| --------------------------------------------------------------------- | ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `initialize`, `newSession`, `prompt`, `cancel`                        | Implémenté    | Flux principal de la passerelle, de stdio vers les opérations d’envoi de messages et d’annulation du Gateway.                                                                                                                                               |
| `listSessions`, commandes à barre oblique                             | Implémenté    | La liste des sessions fonctionne à partir de l’état des sessions du Gateway, avec une pagination bornée par curseur et un filtrage par `cwd` lorsque les lignes de session du Gateway contiennent des métadonnées d’espace de travail ; les commandes sont annoncées via `available_commands_update`. |
| Métadonnées de filiation des sessions                                 | Implémenté    | Les listes de sessions et les instantanés d’informations de session incluent dans `_meta` la filiation parent-enfant d’OpenClaw, afin que les clients ACP puissent afficher les graphes de sous-agents sans canaux auxiliaires privés du Gateway.              |
| `resumeSession`, `closeSession`                                       | Implémenté    | La reprise réassocie une session ACP à une session existante du Gateway sans relire l’historique. La fermeture annule le travail actif de la passerelle, résout les requêtes en attente comme annulées et libère l’état de session de la passerelle.            |
| `loadSession`                                                         | Partiel       | Réassocie la session ACP à une clé de session du Gateway et relit l’historique du registre d’événements ACP pour les sessions créées par la passerelle. Les sessions plus anciennes ou dépourvues de registre utilisent le texte utilisateur/assistant stocké. |
| Contenu des requêtes (`text`, `resource` incorporée, images)          | Partiel       | Le texte et les ressources sont aplatis dans l’entrée de conversation ; les images deviennent des pièces jointes du Gateway.                                                                                                                               |
| Modes de session                                                      | Partiel       | `session/set_mode` est pris en charge ; la passerelle expose des contrôles de session reposant sur le Gateway pour le niveau de réflexion, la verbosité des outils, le raisonnement, le détail de l’utilisation et les actions avec privilèges élevés. Les surfaces plus larges de modes et de configuration natives ACP restent hors périmètre. |
| Diffusion de la réflexion                                             | Implémenté    | Le contenu de réflexion du modèle est diffusé sous forme de mises à jour de session `agent_thought_chunk`. Les plans de session natifs ACP ne sont pas émis.                                                                                                |
| Mises à jour des informations de session et de l’utilisation          | Partiel       | La passerelle émet des notifications `session_info_update` et, dans la mesure du possible, `usage_update` à partir d’instantanés de session du Gateway mis en cache. L’utilisation est approximative et n’est envoyée que lorsque les totaux de jetons du Gateway sont marqués comme à jour. |
| Diffusion des outils                                                  | Partiel       | Les événements `tool_call`/`tool_call_update` incluent les entrées-sorties brutes, le contenu textuel et, dans la mesure du possible, les emplacements de fichiers lorsque les arguments ou résultats des outils du Gateway les exposent. Les terminaux incorporés et les sorties plus riches natives des différences ne sont pas exposés. |
| Approbations d’exécution                                              | Partiel       | Les demandes d’approbation d’exécution du Gateway pendant les tours de requête ACP actifs sont relayées au client ACP avec `session/request_permission`.                                                                                                    |
| Serveurs MCP par session (`mcpServers`)                               | Non pris en charge | Le mode passerelle rejette les demandes de serveur MCP par session. Configurez plutôt MCP sur le Gateway ou l’agent OpenClaw.                                                                                                                              |
| Méthodes du système de fichiers du client (`fs/read_text_file`, `fs/write_text_file`) | Non pris en charge | La passerelle n’appelle pas les méthodes du système de fichiers du client ACP.                                                                                                                                                                             |
| Méthodes de terminal du client (`terminal/*`)                         | Non pris en charge | La passerelle ne crée pas de terminaux du client ACP et ne diffuse pas les identifiants de terminal via les appels d’outils.                                                                                                                               |

## Limitations connues

- `loadSession` ne relit l’intégralité de l’historique du registre d’événements ACP que pour les sessions créées par la passerelle. Les sessions plus anciennes ou dépourvues de registre utilisent l’historique de conversation comme solution de repli et ne reconstituent pas les appels d’outils ni les notifications système historiques.
- Si plusieurs clients ACP partagent la même clé de session du Gateway, le routage des événements et des annulations s’effectue dans la mesure du possible, sans isolation stricte par client. Préférez les sessions isolées `acp-bridge:<uuid>` par défaut lorsque vous avez besoin de tours locaux à l’éditeur clairement séparés.
- Les états d’arrêt du Gateway sont convertis en motifs d’arrêt ACP, mais cette correspondance est moins expressive que celle d’un environnement d’exécution entièrement natif ACP.
- Les contrôles de session exposent un sous-ensemble ciblé des paramètres du Gateway : niveau de réflexion, verbosité des outils, raisonnement, détail de l’utilisation et actions avec privilèges élevés. La sélection du modèle et les contrôles de l’hôte d’exécution ne sont pas exposés comme options de configuration ACP.
- `session_info_update` et `usage_update` proviennent d’instantanés de session du Gateway, et non d’une comptabilisation en direct propre à un environnement d’exécution natif ACP. L’utilisation est approximative, ne comporte aucune donnée de coût et n’est émise que lorsque le Gateway indique que les données sur le nombre total de jetons sont à jour.
- Les données de suivi des outils sont fournies dans la mesure du possible : la passerelle expose les chemins de fichiers présents dans les arguments ou résultats d’outils connus, mais n’émet ni terminaux ACP ni différences de fichiers structurées.
- Le relais des approbations d’exécution est limité au tour de requête ACP actif ; les approbations provenant d’autres sessions du Gateway sont ignorées.

## Utilisation

```bash
openclaw acp

# Remote Gateway
openclaw acp --url wss://gateway-host:18789 --token <token>

# Remote Gateway (token from file)
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Attach to an existing session key
openclaw acp --session agent:main:main

# Attach by label (must already exist)
openclaw acp --session-label "support inbox"

# Reset the session key before the first prompt
openclaw acp --session agent:main:main --reset-session
```

## Client ACP (débogage)

Utilisez le client ACP intégré pour effectuer une vérification sommaire de la passerelle sans IDE. Il lance la passerelle ACP et vous permet de saisir des requêtes de manière interactive.

```bash
openclaw acp client

# Point the spawned bridge at a remote Gateway
openclaw acp client --server-args --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Override the server command (default: openclaw)
openclaw acp client --server "node" --server-args openclaw.mjs acp --url ws://127.0.0.1:19001
```

Modèle d’autorisations (mode de débogage du client) :

- L’approbation automatique repose sur une liste d’autorisation et ne s’applique qu’aux identifiants d’outils principaux approuvés.
- L’approbation automatique de `read` est limitée au répertoire de travail actuel (`--cwd` lorsqu’il est défini).
- ACP n’approuve automatiquement que des catégories restreintes en lecture seule : les appels `read` limités au répertoire de travail actif, ainsi que les outils de recherche en lecture seule (`search`, `web_search`, `memory_search`). Les outils inconnus ou non principaux, les lectures hors périmètre, les outils capables d’exécuter des commandes, les outils du plan de contrôle, les outils effectuant des modifications et les flux interactifs exigent toujours une approbation explicite de la requête.
- La valeur `toolCall.kind` fournie par le serveur est traitée comme une métadonnée non fiable, et non comme une source d’autorisation.
- Cette politique de passerelle ACP est distincte des autorisations de l’environnement ACPX. Si vous exécutez OpenClaw via le moteur `acpx`, `plugins.entries.acpx.config.permissionMode=approve-all` est l’interrupteur d’urgence « yolo » pour cette session d’environnement.

## Test de bon fonctionnement du protocole

Pour le débogage au niveau du protocole, démarrez un Gateway avec un état isolé et pilotez `openclaw acp` sur stdio à l’aide d’un client JSON-RPC ACP. Couvrez `initialize`, `session/new`, `session/list` avec un `cwd` absolu, `session/resume`, `session/close`, une fermeture en double et une reprise inexistante.

La preuve doit inclure les capacités de cycle de vie annoncées, une ligne de session reposant sur le Gateway, les notifications de mise à jour et le journal `sessions.list` du Gateway :

```json
{
  "initialize": {
    "protocolVersion": 1,
    "agentCapabilities": {
      "sessionCapabilities": {
        "list": {},
        "resume": {},
        "close": {}
      }
    }
  },
  "listSessions": {
    "sessions": [
      {
        "sessionId": "agent:main:acp-smoke",
        "cwd": "/path/to/workspace",
        "_meta": {
          "sessionKey": "agent:main:acp-smoke",
          "kind": "direct"
        }
      }
    ],
    "nextCursor": null
  },
  "notifications": ["session_info_update", "available_commands_update", "usage_update"],
  "gatewayLogTail": ["[gateway] ready", "[ws] ⇄ res ✓ sessions.list 305ms"]
}
```

Évitez d’utiliser `openclaw gateway call sessions.list` comme unique preuve ACP. Ce chemin de la CLI peut demander une élévation de la portée opérateur avec un nouveau jeton ; le bon fonctionnement de la passerelle ACP est démontré par les trames ACP sur stdio ainsi que par le journal `sessions.list` du Gateway.

## Comment l’utiliser

Utilisez ACP lorsqu’un IDE, ou un autre client, prend en charge Agent Client Protocol et que vous souhaitez lui permettre de piloter une session du Gateway OpenClaw.

1. Vérifiez que le Gateway est en cours d’exécution, localement ou à distance.
2. Configurez la cible du Gateway à l’aide de la configuration ou des options.
3. Configurez votre IDE pour exécuter `openclaw acp` sur stdio.

Exemple de configuration persistante :

```bash
openclaw config set gateway.remote.url wss://gateway-host:18789
openclaw config set gateway.remote.token <token>
```

Exemple d’exécution directe, sans écrire dans la configuration :

```bash
openclaw acp --url wss://gateway-host:18789 --token <token>
# preferred for local process safety
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token
```

## Sélection des agents

ACP ne sélectionne pas directement les agents. Il effectue le routage selon la clé de session du Gateway. Utilisez des clés de session limitées à un agent pour cibler un agent particulier :

```bash
openclaw acp --session agent:main:main
openclaw acp --session agent:design:main
openclaw acp --session agent:qa:bug-123
```

Chaque session ACP correspond à une seule clé de session du Gateway. Un agent peut posséder de nombreuses sessions ; par défaut, ACP utilise une session isolée `acp-bridge:<uuid>`, sauf si vous remplacez la clé ou le libellé.

Les `mcpServers` propres à chaque session ne sont pas pris en charge en mode pont. Si un client ACP les envoie lors de `newSession` ou de `loadSession`, le pont renvoie une erreur explicite au lieu de les ignorer silencieusement.

Si vous souhaitez que les sessions basées sur ACPX aient accès aux outils des plugins OpenClaw ou à certains outils intégrés comme `cron`, activez les ponts MCP ACPX côté Gateway au lieu d’essayer de transmettre des `mcpServers` propres à chaque session. Consultez [Agents ACP](/fr/tools/acp-agents-setup#plugin-tools-mcp-bridge) et [Pont MCP des outils OpenClaw](/fr/tools/acp-agents-setup#openclaw-tools-mcp-bridge).

## Utilisation depuis `acpx` (Codex, Claude et autres clients ACP)

Si vous souhaitez qu’un agent de programmation comme Codex ou Claude Code communique avec votre bot OpenClaw via ACP, utilisez `acpx` avec sa cible `openclaw` intégrée.

Déroulement type :

1. Exécutez le Gateway et vérifiez que le pont ACP peut y accéder.
2. Faites pointer `acpx openclaw` vers `openclaw acp`.
3. Ciblez la clé de session OpenClaw que l’agent de programmation doit utiliser.

Exemples :

```bash
# One-shot request into your default OpenClaw ACP session
acpx openclaw exec "Summarize the active OpenClaw session state."

# Persistent named session for follow-up turns
acpx openclaw sessions ensure --name codex-bridge
acpx openclaw -s codex-bridge --cwd /path/to/repo \
  "Ask my OpenClaw work agent for recent context relevant to this repo."
```

Si vous souhaitez que `acpx openclaw` cible systématiquement un Gateway et une clé de session spécifiques, remplacez la commande de l’agent `openclaw` dans `~/.acpx/config.json` :

```json
{
  "agents": {
    "openclaw": {
      "command": "env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 openclaw acp --url ws://127.0.0.1:18789 --token-file ~/.openclaw/gateway.token --session agent:main:main"
    }
  }
}
```

Pour une copie de travail OpenClaw locale au dépôt, utilisez directement le point d’entrée de la CLI plutôt que l’exécuteur de développement afin que le flux ACP reste propre :

```bash
env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 node openclaw.mjs acp ...
```

C’est le moyen le plus simple de permettre à Codex, Claude Code ou à un autre client compatible ACP de récupérer des informations contextuelles auprès d’un agent OpenClaw sans analyser le contenu d’un terminal.

## Configuration de l’éditeur Zed

Ajoutez un agent ACP personnalisé dans `~/.config/zed/settings.json` (ou utilisez l’interface Settings de Zed) :

```json
{
  "agent_servers": {
    "OpenClaw ACP": {
      "type": "custom",
      "command": "openclaw",
      "args": ["acp"],
      "env": {}
    }
  }
}
```

Pour cibler un Gateway ou un agent spécifique :

```json
{
  "agent_servers": {
    "OpenClaw ACP": {
      "type": "custom",
      "command": "openclaw",
      "args": [
        "acp",
        "--url",
        "wss://gateway-host:18789",
        "--token",
        "<token>",
        "--session",
        "agent:design:main"
      ],
      "env": {}
    }
  }
}
```

Dans Zed, ouvrez le panneau Agent et sélectionnez "OpenClaw ACP" pour démarrer un fil de discussion.

## Correspondance des sessions

Par défaut, les sessions du pont ACP reçoivent une clé de session Gateway isolée avec le préfixe `acp-bridge:`. Ces sessions de pont utilisant un modèle normal sont synthétiques et temporaires : elles sont soumises à la suppression des entrées obsolètes et ne sont pas considérées comme des espaces de conversation humaine protégés. Pour réutiliser une session connue, transmettez une clé ou un libellé de session :

- `--session <key>` : utiliser une clé de session Gateway spécifique.
- `--session-label <label>` : rechercher une session existante par son libellé.
- `--reset-session` : générer un nouvel identifiant de session pour cette clé (même clé, nouvelle transcription).

Si votre client ACP prend en charge les métadonnées, vous pouvez remplacer ces paramètres pour chaque session :

```json
{
  "_meta": {
    "sessionKey": "agent:main:main",
    "sessionLabel": "support inbox",
    "resetSession": true
  }
}
```

Pour en savoir plus sur les clés de session, consultez [/concepts/session](/fr/concepts/session).

## Options

- `--url <url>` : URL WebSocket du Gateway (utilise par défaut `gateway.remote.url` lorsque cette valeur est configurée).
- `--token <token>` : jeton d’authentification du Gateway.
- `--token-file <path>` : lire le jeton d’authentification du Gateway depuis un fichier.
- `--password <password>` : mot de passe d’authentification du Gateway.
- `--password-file <path>` : lire le mot de passe d’authentification du Gateway depuis un fichier.
- `--session <key>` : clé de session par défaut.
- `--session-label <label>` : libellé de session par défaut à rechercher.
- `--require-existing` : échouer si la clé ou le libellé de session n’existe pas.
- `--reset-session` : réinitialiser la clé de session avant la première utilisation.
- `--no-prefix-cwd` : ne pas préfixer les invites avec le répertoire de travail.
- `--provenance <off|meta|meta+receipt>` : inclure les métadonnées de provenance ACP ou les reçus.
- `--verbose, -v` : journalisation détaillée sur stderr.

Remarque de sécurité :

- `--token` et `--password` peuvent apparaître dans les listes de processus locaux sur certains systèmes. Préférez `--token-file`/`--password-file` ou les variables d’environnement (`OPENCLAW_GATEWAY_TOKEN`, `OPENCLAW_GATEWAY_PASSWORD`).
- La résolution de l’authentification du Gateway suit le contrat commun utilisé par les autres clients Gateway :
  - mode local : variables d’environnement (`OPENCLAW_GATEWAY_*`), puis `gateway.auth.*`, avec repli sur `gateway.remote.*` uniquement lorsque `gateway.auth.*` n’est pas défini (une SecretRef locale configurée mais non résolue provoque un échec fermé au lieu d’un repli silencieux)
  - mode distant : `gateway.remote.*`, avec repli sur les variables d’environnement ou la configuration conformément aux règles de priorité du mode distant
  - `--url` permet un remplacement sûr et ne réutilise pas les identifiants implicites issus de la configuration ou des variables d’environnement ; transmettez explicitement `--token`/`--password` (ou leurs variantes utilisant un fichier)

### Options de `acp client`

- `--cwd <dir>` : répertoire de travail de la session ACP.
- `--server <command>` : commande du serveur ACP (valeur par défaut : `openclaw`).
- `--server-args <args...>` : arguments supplémentaires transmis au serveur ACP.
- `--server-verbose` : activer la journalisation détaillée sur le serveur ACP.
- `--verbose, -v` : journalisation détaillée du client.
- `openclaw acp client` définit `OPENCLAW_SHELL=acp-client` sur le processus de pont lancé, ce qui permet d’appliquer des règles d’interpréteur de commandes ou de profil propres au contexte.

## Pages connexes

- [Référence de la CLI](/fr/cli)
- [Agents ACP](/fr/tools/acp-agents)
