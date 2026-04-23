---
read_when:
    - Configuration des intégrations IDE basées sur ACP
    - Débogage du routage de session ACP vers la Gateway
summary: Exécuter le pont ACP pour les intégrations IDE
title: ACP
x-i18n:
    generated_at: "2026-04-23T07:00:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: b098c59e24cac23d533ea3b3828c95bd43d85ebf6e1361377122018777678720
    source_path: cli/acp.md
    workflow: 15
---

# acp

Exécutez le pont [Agent Client Protocol (ACP)](https://agentclientprotocol.com/) qui communique avec une Gateway OpenClaw.

Cette commande parle ACP sur stdio pour les IDE et transfère les prompts vers la Gateway
via WebSocket. Elle conserve les sessions ACP associées aux clés de session de la Gateway.

`openclaw acp` est un pont ACP adossé à la Gateway, et non un environnement
d’éditeur entièrement natif ACP. Il se concentre sur le routage de session, la livraison
des prompts et les mises à jour de streaming de base.

Si vous voulez qu’un client MCP externe parle directement à des conversations
de canaux OpenClaw au lieu d’héberger une session de harness ACP, utilisez
plutôt [`openclaw mcp serve`](/fr/cli/mcp).

## Ce que ce n’est pas

Cette page est souvent confondue avec les sessions de harness ACP.

`openclaw acp` signifie :

- OpenClaw agit comme un serveur ACP
- un IDE ou un client ACP se connecte à OpenClaw
- OpenClaw transfère ce travail dans une session de Gateway

C’est différent de [ACP Agents](/fr/tools/acp-agents), où OpenClaw exécute un
harness externe tel que Codex ou Claude Code via `acpx`.

Règle rapide :

- l’éditeur/client veut parler ACP à OpenClaw : utilisez `openclaw acp`
- OpenClaw doit lancer Codex/Claude/Gemini comme harness ACP : utilisez `/acp spawn` et [ACP Agents](/fr/tools/acp-agents)

## Matrice de compatibilité

| Domaine ACP                                                           | Statut      | Remarques                                                                                                                                                                                                                                           |
| --------------------------------------------------------------------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `initialize`, `newSession`, `prompt`, `cancel`                        | Implémenté  | Flux principal du pont sur stdio vers chat/send + abandon de la Gateway.                                                                                                                                                                           |
| `listSessions`, commandes slash                                       | Implémenté  | La liste des sessions fonctionne avec l’état des sessions de la Gateway ; les commandes sont annoncées via `available_commands_update`.                                                                                                            |
| `loadSession`                                                         | Partiel     | Réassocie la session ACP à une clé de session de Gateway et rejoue l’historique texte utilisateur/assistant stocké. L’historique outil/système n’est pas encore reconstruit.                                                                      |
| Contenu du prompt (`text`, `resource` intégré, images)                | Partiel     | Les textes/ressources sont aplatis dans l’entrée de chat ; les images deviennent des pièces jointes de la Gateway.                                                                                                                                 |
| Modes de session                                                      | Partiel     | `session/set_mode` est pris en charge et le pont expose des contrôles de session initiaux adossés à la Gateway pour le niveau de réflexion, la verbosité des outils, le raisonnement, le détail d’usage et les actions élevées. Des surfaces plus larges de mode/config natives ACP restent hors périmètre. |
| Informations de session et mises à jour d’usage                       | Partiel     | Le pont émet des notifications `session_info_update` et `usage_update` au mieux à partir d’instantanés de session de Gateway mis en cache. L’usage est approximatif et n’est envoyé que lorsque les totaux de jetons de la Gateway sont marqués comme frais. |
| Streaming d’outils                                                    | Partiel     | Les événements `tool_call` / `tool_call_update` incluent les E/S brutes, le contenu texte et, au mieux, les emplacements de fichiers lorsque les arguments/résultats des outils de la Gateway les exposent. Les terminaux intégrés et une sortie native diff plus riche ne sont pas encore exposés. |
| Serveurs MCP par session (`mcpServers`)                               | Non pris en charge | Le mode pont rejette les requêtes de serveur MCP par session. Configurez plutôt MCP sur la Gateway ou l’agent OpenClaw.                                                                                                                            |
| Méthodes de système de fichiers client (`fs/read_text_file`, `fs/write_text_file`) | Non pris en charge | Le pont n’appelle pas les méthodes de système de fichiers du client ACP.                                                                                                                                                                           |
| Méthodes de terminal client (`terminal/*`)                            | Non pris en charge | Le pont ne crée pas de terminaux de client ACP et ne transmet pas d’identifiants de terminal via les appels d’outils.                                                                                                                             |
| Plans de session / streaming de réflexion                             | Non pris en charge | Le pont émet actuellement le texte de sortie et l’état des outils, pas les mises à jour de plan ou de réflexion ACP.                                                                                                                              |

## Limitations connues

- `loadSession` rejoue l’historique texte utilisateur et assistant stocké, mais ne
  reconstruit pas les appels d’outils historiques, les avis système ou les types
  d’événements natifs ACP plus riches.
- Si plusieurs clients ACP partagent la même clé de session de Gateway, le routage
  des événements et des annulations est au mieux, plutôt que strictement isolé par
  client. Préférez les sessions `acp:<uuid>` isolées par défaut lorsque vous avez
  besoin de tours propres et locaux à l’éditeur.
- Les états d’arrêt de la Gateway sont traduits en raisons d’arrêt ACP, mais ce
  mapping est moins expressif qu’un environnement entièrement natif ACP.
- Les contrôles de session initiaux exposent actuellement un sous-ensemble ciblé
  des réglages de la Gateway : niveau de réflexion, verbosité des outils,
  raisonnement, détail d’usage et actions élevées. La sélection du modèle et les
  contrôles d’hôte d’exécution ne sont pas encore exposés comme options de
  configuration ACP.
- `session_info_update` et `usage_update` sont dérivés des instantanés de session
  de la Gateway, et non d’une comptabilité d’exécution native ACP en direct.
  L’usage est approximatif, ne contient aucune donnée de coût et n’est émis que
  lorsque la Gateway marque les données totales de jetons comme fraîches.
- Les données de suivi d’outil sont au mieux. Le pont peut exposer les chemins
  de fichiers qui apparaissent dans des arguments/résultats d’outils connus, mais
  il n’émet pas encore de terminaux ACP ni de diffs de fichiers structurés.

## Utilisation

```bash
openclaw acp

# Gateway distante
openclaw acp --url wss://gateway-host:18789 --token <token>

# Gateway distante (jeton depuis un fichier)
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Se rattacher à une clé de session existante
openclaw acp --session agent:main:main

# Se rattacher par libellé (doit déjà exister)
openclaw acp --session-label "support inbox"

# Réinitialiser la clé de session avant le premier prompt
openclaw acp --session agent:main:main --reset-session
```

## Client ACP (débogage)

Utilisez le client ACP intégré pour vérifier sommairement le pont sans IDE.
Il lance le pont ACP et vous permet de saisir des prompts de façon interactive.

```bash
openclaw acp client

# Pointer le pont lancé vers une Gateway distante
openclaw acp client --server-args --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Remplacer la commande du serveur (par défaut : openclaw)
openclaw acp client --server "node" --server-args openclaw.mjs acp --url ws://127.0.0.1:19001
```

Modèle d’autorisation (mode débogage client) :

- L’approbation automatique repose sur une liste d’autorisation et ne s’applique qu’aux identifiants d’outils principaux approuvés.
- L’approbation automatique de `read` est limitée au répertoire de travail courant (`--cwd` lorsqu’il est défini).
- ACP n’approuve automatiquement que des classes étroites en lecture seule : appels `read` limités sous le cwd actif, plus les outils de recherche en lecture seule (`search`, `web_search`, `memory_search`). Les outils inconnus/non principaux, les lectures hors périmètre, les outils capables d’exécuter, les outils de plan de contrôle, les outils mutateurs et les flux interactifs exigent toujours une approbation explicite via prompt.
- Le `toolCall.kind` fourni par le serveur est traité comme des métadonnées non fiables (pas comme une source d’autorisation).
- Cette politique du pont ACP est distincte des autorisations du harness ACPX. Si vous exécutez OpenClaw via le backend `acpx`, `plugins.entries.acpx.config.permissionMode=approve-all` est l’interrupteur casse-vitre « yolo » pour cette session de harness.

## Comment utiliser ceci

Utilisez ACP lorsqu’un IDE (ou un autre client) parle Agent Client Protocol et que vous voulez
qu’il pilote une session de Gateway OpenClaw.

1. Assurez-vous que la Gateway est en cours d’exécution (locale ou distante).
2. Configurez la cible de la Gateway (configuration ou drapeaux).
3. Configurez votre IDE pour exécuter `openclaw acp` sur stdio.

Exemple de configuration (persistante) :

```bash
openclaw config set gateway.remote.url wss://gateway-host:18789
openclaw config set gateway.remote.token <token>
```

Exemple d’exécution directe (sans écrire la configuration) :

```bash
openclaw acp --url wss://gateway-host:18789 --token <token>
# préférable pour la sûreté des processus locaux
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token
```

## Sélection des agents

ACP ne sélectionne pas directement les agents. Il route via la clé de session de la Gateway.

Utilisez des clés de session limitées à l’agent pour cibler un agent spécifique :

```bash
openclaw acp --session agent:main:main
openclaw acp --session agent:design:main
openclaw acp --session agent:qa:bug-123
```

Chaque session ACP est associée à une seule clé de session de Gateway. Un agent peut avoir de nombreuses
sessions ; ACP utilise par défaut une session isolée `acp:<uuid>` sauf si vous remplacez
la clé ou le libellé.

Les `mcpServers` par session ne sont pas pris en charge en mode pont. Si un client ACP
les envoie pendant `newSession` ou `loadSession`, le pont renvoie une erreur claire
au lieu de les ignorer silencieusement.

Si vous voulez que des sessions adossées à ACPX voient les outils Plugin OpenClaw ou des
outils intégrés sélectionnés tels que `cron`, activez les ponts ACPX MCP côté Gateway
au lieu d’essayer de passer des `mcpServers` par session. Voir
[ACP Agents](/fr/tools/acp-agents#plugin-tools-mcp-bridge) et
[Pont MCP des outils OpenClaw](/fr/tools/acp-agents#openclaw-tools-mcp-bridge).

## Utilisation depuis `acpx` (Codex, Claude, autres clients ACP)

Si vous voulez qu’un agent de codage tel que Codex ou Claude Code parle à votre
bot OpenClaw via ACP, utilisez `acpx` avec sa cible `openclaw` intégrée.

Flux typique :

1. Exécutez la Gateway et assurez-vous que le pont ACP peut l’atteindre.
2. Pointez `acpx openclaw` vers `openclaw acp`.
3. Ciblez la clé de session OpenClaw que vous voulez que l’agent de codage utilise.

Exemples :

```bash
# Requête ponctuelle vers votre session ACP OpenClaw par défaut
acpx openclaw exec "Summarize the active OpenClaw session state."

# Session nommée persistante pour les tours de suivi
acpx openclaw sessions ensure --name codex-bridge
acpx openclaw -s codex-bridge --cwd /path/to/repo \
  "Ask my OpenClaw work agent for recent context relevant to this repo."
```

Si vous voulez que `acpx openclaw` cible à chaque fois une Gateway et une clé de session spécifiques,
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

Pour une copie locale du dépôt OpenClaw, utilisez le point d’entrée direct de la CLI au lieu du
lanceur de développement afin que le flux ACP reste propre. Par exemple :

```bash
env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 node openclaw.mjs acp ...
```

C’est la manière la plus simple de permettre à Codex, Claude Code ou un autre client compatible ACP
de récupérer des informations contextuelles depuis un agent OpenClaw sans analyser un terminal.

## Configuration de l’éditeur Zed

Ajoutez un agent ACP personnalisé dans `~/.config/zed/settings.json` (ou utilisez l’interface de réglages de Zed) :

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

Pour cibler une Gateway ou un agent spécifique :

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

Dans Zed, ouvrez le panneau Agent et sélectionnez « OpenClaw ACP » pour démarrer un fil.

## Association des sessions

Par défaut, les sessions ACP reçoivent une clé de session Gateway isolée avec le préfixe `acp:`.
Pour réutiliser une session connue, passez une clé de session ou un libellé :

- `--session <key>` : utiliser une clé de session Gateway spécifique.
- `--session-label <label>` : résoudre une session existante par libellé.
- `--reset-session` : générer un nouvel identifiant de session pour cette clé (même clé, nouveau transcript).

Si votre client ACP prend en charge les métadonnées, vous pouvez remplacer cela par session :

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

- `--url <url>` : URL WebSocket de la Gateway (par défaut `gateway.remote.url` lorsqu’elle est configurée).
- `--token <token>` : jeton d’authentification de la Gateway.
- `--token-file <path>` : lire le jeton d’authentification de la Gateway depuis un fichier.
- `--password <password>` : mot de passe d’authentification de la Gateway.
- `--password-file <path>` : lire le mot de passe d’authentification de la Gateway depuis un fichier.
- `--session <key>` : clé de session par défaut.
- `--session-label <label>` : libellé de session par défaut à résoudre.
- `--require-existing` : échouer si la clé/le libellé de session n’existe pas.
- `--reset-session` : réinitialiser la clé de session avant la première utilisation.
- `--no-prefix-cwd` : ne pas préfixer les prompts avec le répertoire de travail.
- `--provenance <off|meta|meta+receipt>` : inclure des métadonnées de provenance ACP ou des reçus.
- `--verbose, -v` : journalisation verbeuse vers stderr.

Remarque de sécurité :

- `--token` et `--password` peuvent être visibles dans les listes locales de processus sur certains systèmes.
- Préférez `--token-file`/`--password-file` ou les variables d’environnement (`OPENCLAW_GATEWAY_TOKEN`, `OPENCLAW_GATEWAY_PASSWORD`).
- La résolution d’authentification de la Gateway suit le contrat partagé utilisé par les autres clients Gateway :
  - mode local : env (`OPENCLAW_GATEWAY_*`) -> `gateway.auth.*` -> repli sur `gateway.remote.*` uniquement lorsque `gateway.auth.*` n’est pas défini (les SecretRefs locaux configurés mais non résolus échouent en mode fermé)
  - mode distant : `gateway.remote.*` avec repli env/config selon les règles de priorité du mode distant
  - `--url` est sûr pour les remplacements et ne réutilise pas d’identifiants implicites issus de la config/de l’env ; passez un `--token`/`--password` explicite (ou les variantes fichier)
- Les processus enfants du backend d’exécution ACP reçoivent `OPENCLAW_SHELL=acp`, qui peut être utilisé pour des règles de shell/profil spécifiques au contexte.
- `openclaw acp client` définit `OPENCLAW_SHELL=acp-client` sur le processus de pont lancé.

### Options de `acp client`

- `--cwd <dir>` : répertoire de travail pour la session ACP.
- `--server <command>` : commande du serveur ACP (par défaut : `openclaw`).
- `--server-args <args...>` : arguments supplémentaires transmis au serveur ACP.
- `--server-verbose` : activer la journalisation verbeuse sur le serveur ACP.
- `--verbose, -v` : journalisation verbeuse du client.
