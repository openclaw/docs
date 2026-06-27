---
read_when:
    - Configuration des intégrations IDE basées sur ACP
    - Débogage du routage de session ACP vers le Gateway
summary: Exécuter le pont ACP pour les intégrations d’IDE
title: ACP
x-i18n:
    generated_at: "2026-06-27T17:16:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 79fa816811f78c3fa59577342e568868ef63e88f5262fd954e346ed46b02afc3
    source_path: cli/acp.md
    workflow: 16
---

Exécute le pont [Agent Client Protocol (ACP)](https://agentclientprotocol.com/) qui communique avec un Gateway OpenClaw.

Cette commande parle ACP sur stdio pour les IDE et transmet les prompts au Gateway
sur WebSocket. Elle conserve la correspondance entre les sessions ACP et les clés de session Gateway.

`openclaw acp` est un pont ACP adossé au Gateway, pas un runtime d’éditeur
entièrement natif ACP. Il se concentre sur le routage des sessions, la livraison des prompts et les mises à jour de streaming
de base.

Si vous voulez qu’un client MCP externe communique directement avec les conversations
des canaux OpenClaw au lieu d’héberger une session de harness ACP, utilisez plutôt
[`openclaw mcp serve`](/fr/cli/mcp).

## Ce que ce n’est pas

Cette page est souvent confondue avec les sessions de harness ACP.

`openclaw acp` signifie :

- OpenClaw agit comme serveur ACP
- un IDE ou un client ACP se connecte à OpenClaw
- OpenClaw transmet ce travail dans une session Gateway

C’est différent de [ACP Agents](/fr/tools/acp-agents), où OpenClaw exécute un
harness externe comme Codex ou Claude Code via `acpx`.

Règle rapide :

- l’éditeur/client veut parler ACP à OpenClaw : utilisez `openclaw acp`
- OpenClaw doit lancer Codex/Claude/Gemini comme harness ACP : utilisez `/acp spawn` et [ACP Agents](/fr/tools/acp-agents)

## Matrice de compatibilité

| Zone ACP                                                               | État        | Notes                                                                                                                                                                                                                                            |
| ---------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `initialize`, `newSession`, `prompt`, `cancel`                         | Implémenté  | Flux de pont principal sur stdio vers chat/send + abort du Gateway.                                                                                                                                                                               |
| `listSessions`, commandes slash                                        | Implémenté  | La liste des sessions fonctionne avec l’état des sessions Gateway, avec pagination bornée par curseur et filtrage `cwd` lorsque les lignes de session Gateway portent des métadonnées d’espace de travail ; les commandes sont annoncées via `available_commands_update`. |
| Métadonnées de lignée de session                                       | Implémenté  | Les listes de sessions et les instantanés d’informations de session incluent la lignée parente et enfant OpenClaw dans `_meta`, afin que les clients ACP puissent afficher des graphes de sous-agents sans canaux latéraux Gateway privés.        |
| `resumeSession`, `closeSession`                                        | Implémenté  | Resume rattache une session ACP à une session Gateway existante sans rejouer l’historique. Close annule le travail actif du pont, résout les prompts en attente comme annulés et libère l’état de session du pont.                                |
| `loadSession`                                                          | Partiel     | Rattache la session ACP à une clé de session Gateway et rejoue l’historique du journal d’événements ACP pour les sessions créées par le pont. Les sessions plus anciennes/sans journal reviennent au texte utilisateur/assistant stocké.          |
| Contenu du prompt (`text`, `resource` intégrée, images)                | Partiel     | Le texte et les ressources sont aplatis en entrée de chat ; les images deviennent des pièces jointes Gateway.                                                                                                                                      |
| Modes de session                                                       | Partiel     | `session/set_mode` est pris en charge et le pont expose des contrôles initiaux de session adossés au Gateway pour le niveau de pensée, la verbosité des outils, le raisonnement, le détail d’utilisation et les actions élevées. Les surfaces de mode/config plus larges natives ACP restent hors périmètre. |
| Informations de session et mises à jour d’utilisation                  | Partiel     | Le pont émet des notifications `session_info_update` et `usage_update` au mieux à partir des instantanés de session Gateway mis en cache. L’utilisation est approximative et n’est envoyée que lorsque les totaux de jetons Gateway sont marqués comme frais. |
| Streaming des outils                                                   | Partiel     | Les événements `tool_call` / `tool_call_update` incluent les E/S brutes, le contenu textuel et les emplacements de fichiers au mieux lorsque les args/résultats des outils Gateway les exposent. Les terminaux intégrés et les sorties plus riches natives en diff ne sont pas encore exposés. |
| Approbations exec                                                      | Partiel     | Les prompts d’approbation exec Gateway pendant les tours de prompt ACP actifs sont relayés au client ACP avec `session/request_permission`.                                                                                                        |
| Serveurs MCP par session (`mcpServers`)                                | Non pris en charge | Le mode pont rejette les demandes de serveur MCP par session. Configurez plutôt MCP sur le Gateway ou l’agent OpenClaw.                                                                                                                          |
| Méthodes de système de fichiers client (`fs/read_text_file`, `fs/write_text_file`) | Non pris en charge | Le pont n’appelle pas les méthodes de système de fichiers du client ACP.                                                                                                                                                                         |
| Méthodes de terminal client (`terminal/*`)                             | Non pris en charge | Le pont ne crée pas de terminaux de client ACP et ne diffuse pas d’identifiants de terminal via les appels d’outils.                                                                                                                             |
| Plans de session / streaming de pensée                                 | Non pris en charge | Le pont émet actuellement du texte de sortie et l’état des outils, pas les mises à jour de plan ou de pensée ACP.                                                                                                                                |

## Limitations connues

- `loadSession` ne peut rejouer l’historique complet du journal d’événements ACP que pour
  les sessions créées par le pont. Les sessions plus anciennes/sans journal utilisent toujours le
  repli de transcription et ne reconstruisent pas les appels d’outils historiques ni les avis système.
- Si plusieurs clients ACP partagent la même clé de session Gateway, le routage des événements et des annulations
  est effectué au mieux plutôt que strictement isolé par client. Préférez les
  sessions isolées par défaut `acp-bridge:<uuid>` lorsque vous avez besoin de tours propres locaux à l’éditeur.
- Les états d’arrêt Gateway sont traduits en raisons d’arrêt ACP, mais cette correspondance est
  moins expressive qu’un runtime entièrement natif ACP.
- Les contrôles initiaux de session exposent actuellement un sous-ensemble ciblé des réglages Gateway :
  niveau de pensée, verbosité des outils, raisonnement, détail d’utilisation et
  actions élevées. La sélection de modèle et les contrôles d’hôte exec ne sont pas encore exposés comme options de
  configuration ACP.
- `session_info_update` et `usage_update` sont dérivés d’instantanés de session Gateway,
  pas d’une comptabilité runtime native ACP en direct. L’utilisation est approximative,
  ne contient pas de données de coût et n’est émise que lorsque le Gateway marque les données totales de jetons
  comme fraîches.
- Les données de suivi d’outils sont fournies au mieux. Le pont peut exposer les chemins de fichiers qui
  apparaissent dans des args/résultats d’outils connus, mais il n’émet pas encore de terminaux ACP ni de
  diffs de fichiers structurés.
- Le relais d’approbation exec est limité au tour de prompt ACP actif ; les approbations provenant
  d’autres sessions Gateway sont ignorées.

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

Utilisez le client ACP intégré pour vérifier rapidement le pont sans IDE.
Il lance le pont ACP et vous permet de saisir des prompts de manière interactive.

```bash
openclaw acp client

# Point the spawned bridge at a remote Gateway
openclaw acp client --server-args --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Override the server command (default: openclaw)
openclaw acp client --server "node" --server-args openclaw.mjs acp --url ws://127.0.0.1:19001
```

Modèle d’autorisation (mode de débogage client) :

- L’approbation automatique repose sur une allowlist et ne s’applique qu’aux identifiants d’outils core fiables.
- L’approbation automatique `read` est limitée au répertoire de travail actuel (`--cwd` lorsqu’il est défini).
- ACP n’approuve automatiquement que des classes readonly étroites : les appels `read` bornés sous le cwd actif plus les outils de recherche readonly (`search`, `web_search`, `memory_search`). Les outils inconnus/non core, les lectures hors périmètre, les outils capables d’exec, les outils de plan de contrôle, les outils mutants et les flux interactifs exigent toujours une approbation explicite du prompt.
- `toolCall.kind` fourni par le serveur est traité comme une métadonnée non fiable (pas comme une source d’autorisation).
- Cette politique de pont ACP est distincte des autorisations de harness ACPX. Si vous exécutez OpenClaw via le backend `acpx`, `plugins.entries.acpx.config.permissionMode=approve-all` est l’interrupteur « yolo » de dernier recours pour cette session de harness.

## Test smoke du protocole

Pour le débogage au niveau du protocole, démarrez un Gateway avec un état isolé et pilotez
`openclaw acp` sur stdio avec un client JSON-RPC ACP. Couvrez `initialize`,
`session/new`, `session/list` avec un `cwd` absolu, `session/resume`,
`session/close`, une fermeture dupliquée et une reprise manquante.

La preuve doit inclure les capacités de cycle de vie annoncées, une ligne de session
adossée au Gateway, les notifications de mise à jour et le journal Gateway `sessions.list` :

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

Évitez d’utiliser `openclaw gateway call sessions.list` comme seule preuve ACP. Ce
chemin CLI peut demander une mise à niveau de portée opérateur avec jeton frais ; la
correction du pont ACP est prouvée par les frames stdio ACP plus le journal Gateway `sessions.list`.

## Comment utiliser ceci

Utilisez ACP lorsqu’un IDE (ou un autre client) parle Agent Client Protocol et que vous voulez
qu’il pilote une session Gateway OpenClaw.

1. Assurez-vous que le Gateway est en cours d’exécution (local ou distant).
2. Configurez la cible Gateway (configuration ou flags).
3. Pointez votre IDE pour exécuter `openclaw acp` sur stdio.

Exemple de configuration (persistée) :

```bash
openclaw config set gateway.remote.url wss://gateway-host:18789
openclaw config set gateway.remote.token <token>
```

Exemple d’exécution directe (sans écriture de configuration) :

```bash
openclaw acp --url wss://gateway-host:18789 --token <token>
# preferred for local process safety
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token
```

## Sélection des agents

ACP ne choisit pas directement les agents. Il route par clé de session Gateway.

Utilisez des clés de session limitées à l’agent pour cibler un agent précis :

```bash
openclaw acp --session agent:main:main
openclaw acp --session agent:design:main
openclaw acp --session agent:qa:bug-123
```

Chaque session ACP correspond à une seule clé de session Gateway. Un agent peut avoir de nombreuses
sessions ; ACP utilise par défaut une session isolée `acp-bridge:<uuid>`, sauf si vous remplacez
la clé ou le libellé.

Les `mcpServers` par session ne sont pas pris en charge en mode pont. Si un client ACP
les envoie pendant `newSession` ou `loadSession`, le pont renvoie une erreur claire
au lieu de les ignorer silencieusement.

Si vous voulez que les sessions basées sur ACPX voient les outils de Plugin OpenClaw ou certains
outils intégrés comme `cron`, activez plutôt les ponts MCP ACPX côté Gateway
au lieu d’essayer de transmettre des `mcpServers` par session. Voir
[Agents ACP](/fr/tools/acp-agents-setup#plugin-tools-mcp-bridge) et
[Pont MCP des outils OpenClaw](/fr/tools/acp-agents-setup#openclaw-tools-mcp-bridge).

## Utilisation depuis `acpx` (Codex, Claude, autres clients ACP)

Si vous voulez qu’un agent de codage comme Codex ou Claude Code communique avec votre
bot OpenClaw via ACP, utilisez `acpx` avec sa cible `openclaw` intégrée.

Flux habituel :

1. Exécutez le Gateway et vérifiez que le pont ACP peut l’atteindre.
2. Faites pointer `acpx openclaw` vers `openclaw acp`.
3. Ciblez la clé de session OpenClaw que vous voulez que l’agent de codage utilise.

Exemples :

```bash
# One-shot request into your default OpenClaw ACP session
acpx openclaw exec "Summarize the active OpenClaw session state."

# Persistent named session for follow-up turns
acpx openclaw sessions ensure --name codex-bridge
acpx openclaw -s codex-bridge --cwd /path/to/repo \
  "Ask my OpenClaw work agent for recent context relevant to this repo."
```

Si vous voulez que `acpx openclaw` cible à chaque fois un Gateway et une clé de session spécifiques,
remplacez la commande d’agent `openclaw` dans `~/.acpx/config.json` :

```json
{
  "agents": {
    "openclaw": {
      "command": "env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 openclaw acp --url ws://127.0.0.1:18789 --token-file ~/.openclaw/gateway.token --session agent:main:main"
    }
  }
}
```

Pour un checkout OpenClaw local au dépôt, utilisez le point d’entrée CLI direct au lieu du
lanceur de développement afin que le flux ACP reste propre. Par exemple :

```bash
env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 node openclaw.mjs acp ...
```

C’est le moyen le plus simple de permettre à Codex, Claude Code ou à un autre client compatible ACP
d’extraire des informations contextuelles depuis un agent OpenClaw sans analyser un terminal.

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

Dans Zed, ouvrez le panneau Agent et sélectionnez "OpenClaw ACP" pour démarrer un fil.

## Mappage des sessions

Par défaut, les sessions du pont ACP reçoivent une clé de session Gateway isolée avec un
préfixe `acp-bridge:`. Ces sessions de pont à modèle normal sont synthétiques et
soumises à l’élagage des entrées obsolètes et aux limites de nombre d’entrées. Pour réutiliser une session connue,
passez une clé ou un libellé de session :

- `--session <key>` : utiliser une clé de session Gateway spécifique.
- `--session-label <label>` : résoudre une session existante par libellé.
- `--reset-session` : générer un nouvel identifiant de session pour cette clé (même clé, nouvelle transcription).

Si votre client ACP prend en charge les métadonnées, vous pouvez les remplacer par session :

```json
{
  "_meta": {
    "sessionKey": "agent:main:main",
    "sessionLabel": "support inbox",
    "resetSession": true
  }
}
```

En savoir plus sur les clés de session sur [/concepts/session](/fr/concepts/session).

## Options

- `--url <url>` : URL WebSocket du Gateway (par défaut, gateway.remote.url quand elle est configurée).
- `--token <token>` : jeton d’authentification du Gateway.
- `--token-file <path>` : lire le jeton d’authentification du Gateway depuis un fichier.
- `--password <password>` : mot de passe d’authentification du Gateway.
- `--password-file <path>` : lire le mot de passe d’authentification du Gateway depuis un fichier.
- `--session <key>` : clé de session par défaut.
- `--session-label <label>` : libellé de session par défaut à résoudre.
- `--require-existing` : échouer si la clé ou le libellé de session n’existe pas.
- `--reset-session` : réinitialiser la clé de session avant la première utilisation.
- `--no-prefix-cwd` : ne pas préfixer les prompts avec le répertoire de travail.
- `--provenance <off|meta|meta+receipt>` : inclure les métadonnées ou les reçus de provenance ACP.
- `--verbose, -v` : journalisation détaillée vers stderr.

Note de sécurité :

- `--token` et `--password` peuvent être visibles dans les listes de processus locales sur certains systèmes.
- Préférez `--token-file`/`--password-file` ou les variables d’environnement (`OPENCLAW_GATEWAY_TOKEN`, `OPENCLAW_GATEWAY_PASSWORD`).
- La résolution de l’authentification Gateway suit le contrat partagé utilisé par les autres clients Gateway :
  - mode local : env (`OPENCLAW_GATEWAY_*`) -> `gateway.auth.*` -> repli `gateway.remote.*` uniquement lorsque `gateway.auth.*` n’est pas défini (les SecretRefs locaux configurés mais non résolus échouent de façon fermée)
  - mode distant : `gateway.remote.*` avec repli env/config selon les règles de priorité distante
  - `--url` est sûr pour les remplacements et ne réutilise pas les identifiants implicites de config/env ; passez explicitement `--token`/`--password` (ou les variantes de fichier)
- Les processus enfants du backend d’exécution ACP reçoivent `OPENCLAW_SHELL=acp`, qui peut être utilisé pour des règles de shell/profil propres au contexte.
- `openclaw acp client` définit `OPENCLAW_SHELL=acp-client` sur le processus de pont lancé.

### Options de `acp client`

- `--cwd <dir>` : répertoire de travail pour la session ACP.
- `--server <command>` : commande du serveur ACP (par défaut : `openclaw`).
- `--server-args <args...>` : arguments supplémentaires passés au serveur ACP.
- `--server-verbose` : activer la journalisation détaillée sur le serveur ACP.
- `--verbose, -v` : journalisation client détaillée.

## Connexe

- [Référence CLI](/fr/cli)
- [Agents ACP](/fr/tools/acp-agents)
