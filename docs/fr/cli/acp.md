---
read_when:
    - Configuration des intégrations d’IDE basées sur ACP
    - Débogage du routage des sessions ACP vers le Gateway
summary: Exécuter le pont ACP pour les intégrations aux IDE
title: ACP
x-i18n:
    generated_at: "2026-07-12T15:05:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: becdcfdd1cc62b206cc92e9b8248c79a2ff63cfc3779d8a124b9713e779ad33c
    source_path: cli/acp.md
    workflow: 16
---

Exécutez le pont [Agent Client Protocol (ACP)](https://agentclientprotocol.com/) qui communique avec un Gateway OpenClaw.

`openclaw acp` utilise ACP sur stdio pour les IDE et transmet les prompts au Gateway via WebSocket, tout en maintenant la correspondance entre les sessions ACP et les clés de session du Gateway. Il s’agit d’un pont ACP adossé au Gateway, et non d’un environnement d’exécution d’éditeur entièrement natif ACP : il se concentre sur le routage des sessions, la transmission des prompts et la diffusion des mises à jour.

Si vous souhaitez qu’un client MCP externe communique directement avec les conversations des canaux OpenClaw au lieu d’héberger une session de harnais ACP, utilisez plutôt [`openclaw mcp serve`](/fr/cli/mcp).

## Ce que ce n’est pas

`openclaw acp` signifie qu’OpenClaw agit comme serveur ACP : un IDE ou un client ACP se connecte à OpenClaw, qui transmet ensuite ce travail à une session du Gateway.

Cela diffère des [agents ACP](/fr/tools/acp-agents), où OpenClaw exécute un harnais externe tel que Codex ou Claude Code via `acpx`.

Règle simple :

- l’éditeur ou le client veut communiquer avec OpenClaw via ACP : utilisez `openclaw acp`
- OpenClaw doit lancer Codex/Claude/Gemini comme harnais ACP : utilisez `/acp spawn` et les [agents ACP](/fr/tools/acp-agents)

## Matrice de compatibilité

| Domaine ACP                                                           | État        | Remarques                                                                                                                                                                                                                                                    |
| --------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `initialize`, `newSession`, `prompt`, `cancel`                        | Implémenté  | Flux principal du pont sur stdio vers l’envoi de messages et l’annulation du Gateway.                                                                                                                                                                        |
| `listSessions`, commandes slash                                       | Implémenté  | La liste des sessions fonctionne avec l’état des sessions du Gateway, avec une pagination bornée par curseur et un filtrage par `cwd` lorsque les lignes de session du Gateway contiennent des métadonnées d’espace de travail ; les commandes sont annoncées via `available_commands_update`. |
| Métadonnées de filiation des sessions                                 | Implémenté  | Les listes de sessions et les instantanés d’informations de session incluent dans `_meta` la filiation parent-enfant d’OpenClaw afin que les clients ACP puissent afficher les graphes de sous-agents sans canaux auxiliaires privés du Gateway.                 |
| `resumeSession`, `closeSession`                                       | Implémenté  | La reprise réassocie une session ACP à une session existante du Gateway sans rejouer l’historique. La fermeture annule le travail actif du pont, résout les prompts en attente comme annulés et libère l’état de session du pont.                                |
| `loadSession`                                                         | Partiel     | Réassocie la session ACP à une clé de session du Gateway et rejoue l’historique du journal d’événements ACP pour les sessions créées par le pont. Les sessions plus anciennes ou sans journal utilisent en repli le texte utilisateur/assistant stocké.          |
| Contenu des prompts (`text`, `resource` intégré, images)              | Partiel     | Le texte et les ressources sont aplatis dans l’entrée de conversation ; les images deviennent des pièces jointes du Gateway.                                                                                                                                |
| Modes de session                                                      | Partiel     | `session/set_mode` est pris en charge ; le pont expose des contrôles de session adossés au Gateway pour le niveau de réflexion, la verbosité des outils, le raisonnement, le détail de l’utilisation et les actions avec élévation. Les surfaces de mode et de configuration ACP natives plus larges restent hors périmètre. |
| Diffusion de la réflexion                                             | Implémenté  | Le contenu de réflexion du modèle est diffusé sous forme de mises à jour de session `agent_thought_chunk`. Les plans de session natifs ACP ne sont pas émis.                                                                                                  |
| Informations de session et mises à jour d’utilisation                 | Partiel     | Le pont émet des notifications `session_info_update` et, au mieux, `usage_update` à partir d’instantanés de session du Gateway mis en cache. L’utilisation est approximative et n’est envoyée que lorsque les totaux de jetons du Gateway sont marqués comme à jour. |
| Diffusion des outils                                                  | Partiel     | Les événements `tool_call`/`tool_call_update` incluent les E/S brutes, le contenu textuel et, au mieux, les emplacements de fichiers lorsque les arguments ou résultats d’outils du Gateway les exposent. Les terminaux intégrés et les sorties plus riches nativement structurées en différences ne sont pas exposés. |
| Approbations d’exécution                                              | Partiel     | Les demandes d’approbation d’exécution du Gateway pendant les tours de prompt ACP actifs sont relayées au client ACP avec `session/request_permission`.                                                                                                      |
| Serveurs MCP par session (`mcpServers`)                               | Non pris en charge | Le mode pont rejette les demandes de serveur MCP par session. Configurez plutôt MCP sur le Gateway OpenClaw ou sur l’agent.                                                                                                                           |
| Méthodes de système de fichiers du client (`fs/read_text_file`, `fs/write_text_file`) | Non pris en charge | Le pont n’appelle pas les méthodes de système de fichiers du client ACP.                                                                                                                                                                  |
| Méthodes de terminal du client (`terminal/*`)                         | Non pris en charge | Le pont ne crée pas de terminaux du client ACP et ne diffuse pas leurs identifiants dans les appels d’outils.                                                                                                                                            |

## Limites connues

- `loadSession` rejoue l’historique complet du journal d’événements ACP uniquement pour les sessions créées par le pont. Les sessions plus anciennes ou sans journal utilisent le repli sur la transcription et ne reconstituent pas les anciens appels d’outils ni les notifications système.
- Si plusieurs clients ACP partagent la même clé de session du Gateway, le routage des événements et des annulations s’effectue au mieux plutôt que d’être strictement isolé par client. Préférez les sessions isolées `acp-bridge:<uuid>` par défaut lorsque vous avez besoin de tours propres à l’éditeur local.
- Les états d’arrêt du Gateway sont convertis en motifs d’arrêt ACP, mais cette correspondance est moins expressive que celle d’un environnement d’exécution entièrement natif ACP.
- Les contrôles de session exposent un sous-ensemble ciblé des réglages du Gateway : niveau de réflexion, verbosité des outils, raisonnement, détail de l’utilisation et actions avec élévation. La sélection du modèle et les contrôles de l’hôte d’exécution ne sont pas exposés comme options de configuration ACP.
- `session_info_update` et `usage_update` sont dérivés d’instantanés de session du Gateway, et non d’une comptabilisation en direct d’un environnement d’exécution natif ACP. L’utilisation est approximative, ne contient aucune donnée de coût et n’est émise que lorsque le Gateway indique que les données relatives au nombre total de jetons sont à jour.
- Les données de suivi des outils sont fournies au mieux : le pont expose les chemins de fichiers présents dans les arguments ou résultats d’outils connus, mais n’émet ni terminaux ACP ni différences de fichiers structurées.
- Le relais des approbations d’exécution est limité au tour de prompt ACP actif ; les approbations provenant d’autres sessions du Gateway sont ignorées.

## Utilisation

```bash
openclaw acp

# Gateway distant
openclaw acp --url wss://gateway-host:18789 --token <token>

# Gateway distant (jeton provenant d’un fichier)
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Se rattacher à une clé de session existante
openclaw acp --session agent:main:main

# Se rattacher à l’aide d’un libellé (doit déjà exister)
openclaw acp --session-label "support inbox"

# Réinitialiser la clé de session avant le premier prompt
openclaw acp --session agent:main:main --reset-session
```

## Client ACP (débogage)

Utilisez le client ACP intégré pour effectuer une vérification élémentaire du pont sans IDE. Il lance le pont ACP et vous permet de saisir des prompts de manière interactive.

```bash
openclaw acp client

# Diriger le pont lancé vers un Gateway distant
openclaw acp client --server-args --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Remplacer la commande du serveur (valeur par défaut : openclaw)
openclaw acp client --server "node" --server-args openclaw.mjs acp --url ws://127.0.0.1:19001
```

Modèle d’autorisation (mode de débogage du client) :

- L’approbation automatique repose sur une liste d’autorisation et s’applique uniquement aux identifiants d’outils principaux approuvés.
- L’approbation automatique de `read` est limitée au répertoire de travail actuel (`--cwd` lorsqu’il est défini).
- ACP n’approuve automatiquement que des catégories étroites en lecture seule : les appels `read` limités au répertoire de travail actif, ainsi que les outils de recherche en lecture seule (`search`, `web_search`, `memory_search`). Les outils inconnus ou non principaux, les lectures hors périmètre, les outils capables d’exécuter des commandes, les outils du plan de contrôle, les outils de modification et les flux interactifs nécessitent toujours une approbation explicite du prompt.
- La valeur `toolCall.kind` fournie par le serveur est traitée comme une métadonnée non fiable, et non comme une source d’autorisation.
- Cette politique du pont ACP est distincte des autorisations du harnais ACPX. Si vous exécutez OpenClaw via le backend `acpx`, `plugins.entries.acpx.config.permissionMode=approve-all` est l’interrupteur d’urgence « yolo » pour cette session de harnais.

## Test de fumée du protocole

Pour le débogage au niveau du protocole, démarrez un Gateway avec un état isolé et pilotez `openclaw acp` sur stdio avec un client JSON-RPC ACP. Couvrez `initialize`, `session/new`, `session/list` avec un `cwd` absolu, `session/resume`, `session/close`, une fermeture en double et une reprise manquante.

La preuve doit inclure les capacités de cycle de vie annoncées, une ligne de session adossée au Gateway, les notifications de mise à jour et le journal `sessions.list` du Gateway :

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
  "gatewayLogTail": ["[gateway] prêt", "[ws] ⇄ res ✓ sessions.list 305ms"]
}
```

Évitez d’utiliser `openclaw gateway call sessions.list` comme unique preuve ACP. Ce chemin CLI peut demander une élévation de périmètre d’opérateur avec un jeton récent ; l’exactitude du pont ACP est démontrée par les trames ACP sur stdio accompagnées du journal `sessions.list` du Gateway.

## Comment l’utiliser

Utilisez ACP lorsqu’un IDE (ou un autre client) utilise Agent Client Protocol et que vous souhaitez qu’il pilote une session du Gateway OpenClaw.

1. Vérifiez que le Gateway est en cours d’exécution (localement ou à distance).
2. Configurez la cible du Gateway (configuration ou indicateurs).
3. Configurez votre IDE pour exécuter `openclaw acp` sur stdio.

Exemple de configuration (persistante) :

```bash
openclaw config set gateway.remote.url wss://gateway-host:18789
openclaw config set gateway.remote.token <token>
```

Exemple d’exécution directe (sans écrire la configuration) :

```bash
openclaw acp --url wss://gateway-host:18789 --token <token>
# recommandé pour la sécurité du processus local
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token
```

## Sélection des agents

ACP ne sélectionne pas directement les agents. Il effectue le routage selon la clé de session du Gateway. Utilisez des clés de session propres à un agent pour cibler un agent précis :

```bash
openclaw acp --session agent:main:main
openclaw acp --session agent:design:main
openclaw acp --session agent:qa:bug-123
```

Chaque session ACP correspond à une seule clé de session du Gateway. Un agent peut avoir plusieurs sessions ; ACP utilise par défaut une session isolée `acp-bridge:<uuid>`, sauf si vous remplacez la clé ou le libellé.

Les `mcpServers` par session ne sont pas pris en charge en mode pont. Si un client ACP les envoie pendant `newSession` ou `loadSession`, le pont renvoie une erreur explicite au lieu de les ignorer silencieusement.

Si vous souhaitez que les sessions reposant sur ACPX voient les outils des plugins OpenClaw ou certains outils intégrés tels que `cron`, activez les ponts MCP ACPX côté Gateway au lieu d’essayer de transmettre des `mcpServers` par session. Consultez [Agents ACP](/fr/tools/acp-agents-setup#plugin-tools-mcp-bridge) et [Pont MCP des outils OpenClaw](/fr/tools/acp-agents-setup#openclaw-tools-mcp-bridge).

## Utilisation depuis `acpx` (Codex, Claude et autres clients ACP)

Si vous souhaitez qu’un agent de programmation tel que Codex ou Claude Code communique avec votre bot OpenClaw via ACP, utilisez `acpx` avec sa cible `openclaw` intégrée.

Déroulement type :

1. Exécutez le Gateway et vérifiez que le pont ACP peut l’atteindre.
2. Faites pointer `acpx openclaw` vers `openclaw acp`.
3. Ciblez la clé de session OpenClaw que l’agent de programmation doit utiliser.

Exemples :

```bash
# Requête ponctuelle dans votre session ACP OpenClaw par défaut
acpx openclaw exec "Résumez l’état de la session OpenClaw active."

# Session nommée persistante pour les échanges suivants
acpx openclaw sessions ensure --name codex-bridge
acpx openclaw -s codex-bridge --cwd /path/to/repo \
  "Demandez à mon agent de travail OpenClaw le contexte récent pertinent pour ce dépôt."
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

Pour une copie de travail OpenClaw locale au dépôt, utilisez directement le point d’entrée de la CLI plutôt que l’exécuteur de développement afin de préserver la propreté du flux ACP :

```bash
env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 node openclaw.mjs acp ...
```

C’est le moyen le plus simple de permettre à Codex, Claude Code ou à un autre client compatible avec ACP d’extraire des informations contextuelles d’un agent OpenClaw sans analyser le contenu d’un terminal.

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

## Mappage des sessions

Par défaut, les sessions du pont ACP reçoivent une clé de session Gateway isolée avec le préfixe `acp-bridge:`. Ces sessions de pont utilisant un modèle normal sont synthétiques et jetables : elles sont soumises à la suppression des entrées obsolètes et ne sont pas considérées comme des espaces de conversation humaine protégés. Pour réutiliser une session connue, transmettez une clé ou une étiquette de session :

- `--session <key>` : utilisez une clé de session Gateway spécifique.
- `--session-label <label>` : trouvez une session existante par son étiquette.
- `--reset-session` : générez un nouvel identifiant de session pour cette clé (même clé, nouvelle transcription).

Si votre client ACP prend en charge les métadonnées, vous pouvez les remplacer pour chaque session :

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

- `--url <url>` : URL WebSocket du Gateway (utilise par défaut `gateway.remote.url` lorsque cette option est configurée).
- `--token <token>` : jeton d’authentification du Gateway.
- `--token-file <path>` : lit le jeton d’authentification du Gateway depuis un fichier.
- `--password <password>` : mot de passe d’authentification du Gateway.
- `--password-file <path>` : lit le mot de passe d’authentification du Gateway depuis un fichier.
- `--session <key>` : clé de session par défaut.
- `--session-label <label>` : étiquette de session par défaut à trouver.
- `--require-existing` : échoue si la clé ou l’étiquette de session n’existe pas.
- `--reset-session` : réinitialise la clé de session avant la première utilisation.
- `--no-prefix-cwd` : n’ajoute pas le répertoire de travail en préfixe des invites.
- `--provenance <off|meta|meta+receipt>` : inclut les métadonnées ou les reçus de provenance ACP.
- `--verbose, -v` : journalisation détaillée dans stderr.

Remarque de sécurité :

- `--token` et `--password` peuvent être visibles dans les listes de processus locaux sur certains systèmes. Préférez `--token-file`/`--password-file` ou les variables d’environnement (`OPENCLAW_GATEWAY_TOKEN`, `OPENCLAW_GATEWAY_PASSWORD`).
- La résolution de l’authentification du Gateway suit le contrat partagé utilisé par les autres clients Gateway :
  - mode local : variables d’environnement (`OPENCLAW_GATEWAY_*`), puis `gateway.auth.*`, avec repli sur `gateway.remote.*` uniquement lorsque `gateway.auth.*` n’est pas défini (une SecretRef locale configurée mais non résolue provoque un échec fermé au lieu d’un repli silencieux)
  - mode distant : `gateway.remote.*`, avec repli sur les variables d’environnement ou la configuration conformément aux règles de priorité du mode distant
  - `--url` est sûr en tant que remplacement et ne réutilise pas les identifiants implicites de la configuration ou des variables d’environnement ; transmettez explicitement `--token`/`--password` (ou leurs variantes utilisant un fichier)

### Options de `acp client`

- `--cwd <dir>` : répertoire de travail de la session ACP.
- `--server <command>` : commande du serveur ACP (par défaut : `openclaw`).
- `--server-args <args...>` : arguments supplémentaires transmis au serveur ACP.
- `--server-verbose` : active la journalisation détaillée sur le serveur ACP.
- `--verbose, -v` : journalisation détaillée du client.
- `openclaw acp client` définit `OPENCLAW_SHELL=acp-client` sur le processus de pont lancé, ce qui permet d’utiliser des règles de shell ou de profil propres au contexte.

## Voir aussi

- [Référence de la CLI](/fr/cli)
- [Agents ACP](/fr/tools/acp-agents)
