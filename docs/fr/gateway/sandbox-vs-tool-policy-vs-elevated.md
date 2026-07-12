---
read_when: You hit 'sandbox jail' or see a tool/elevated refusal and want the exact config key to change.
status: active
summary: 'Pourquoi un outil est bloqué : environnement d’exécution sandbox, politique d’autorisation/interdiction des outils et contrôles d’exécution avec privilèges élevés'
title: Bac à sable, politique des outils et mode privilégié
x-i18n:
    generated_at: "2026-07-12T02:40:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2fce3dab337e89fc2b196f59e763a169d76206ce2695744e00252c158b161260
    source_path: gateway/sandbox-vs-tool-policy-vs-elevated.md
    workflow: 16
---

OpenClaw dispose de trois contrôles liés mais distincts :

1. **Bac à sable** (`agents.defaults.sandbox.*` / `agents.list[].sandbox.*`) détermine **où les outils s’exécutent** (backend du bac à sable ou hôte).
2. **Politique des outils** (`tools.*`, `tools.sandbox.tools.*`, `agents.list[].tools.*`) détermine **quels outils sont disponibles/autorisés**.
3. **Mode privilégié** (`tools.elevated.*`, `agents.list[].tools.elevated.*`) est une **porte de sortie réservée à `exec`** permettant une exécution hors du bac à sable lorsque vous êtes dans un bac à sable (`gateway` par défaut, ou `node` lorsque la cible d’exécution est configurée sur `node`).

## Débogage rapide

Utilisez l’inspecteur pour voir ce qu’OpenClaw fait _réellement_ :

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

Il affiche :

- le mode, la portée et l’accès à l’espace de travail effectifs du bac à sable
- si la session est actuellement dans un bac à sable (principale ou non principale)
- les autorisations/interdictions effectives des outils du bac à sable (et si elles proviennent de l’agent, de la configuration globale ou des valeurs par défaut)
- les contrôles du mode privilégié et les chemins des clés à corriger

## Bac à sable : où les outils s’exécutent

La mise en bac à sable est contrôlée par `agents.defaults.sandbox.mode` :

- `"off"` : tout s’exécute sur l’hôte.
- `"non-main"` : seules les sessions non principales sont placées dans un bac à sable (« surprise » fréquente pour les groupes/canaux).
- `"all"` : tout est placé dans un bac à sable.

`agents.defaults.sandbox.workspaceAccess` contrôle ce que le bac à sable peut voir : `"none"`, `"ro"` ou `"rw"`.

Consultez [Mise en bac à sable](/fr/gateway/sandboxing) pour connaître la matrice complète (portée, montages de l’espace de travail, images).

### Montages liés (vérification rapide de sécurité)

- `docker.binds` _perce_ le système de fichiers du bac à sable : tout ce que vous montez est visible dans le conteneur avec le mode défini (`:ro` ou `:rw`).
- Le mode par défaut est lecture-écriture si vous l’omettez ; privilégiez `:ro` pour le code source et les secrets.
- `scope: "shared"` ignore les montages propres à chaque agent (seuls les montages globaux s’appliquent).
- OpenClaw valide deux fois les sources des montages liés : d’abord sur le chemin source normalisé, puis à nouveau après résolution via l’ancêtre existant le plus profond. Les échappements par un parent symbolique ne contournent pas les contrôles des chemins bloqués ou des racines autorisées.
- Les chemins feuilles inexistants sont tout de même vérifiés de manière sûre. Si `/workspace/alias-out/new-file` est résolu, via un parent symbolique, vers un chemin bloqué ou hors des racines autorisées configurées, le montage lié est rejeté.
- Lier `/var/run/docker.sock` donne de fait le contrôle de l’hôte au bac à sable ; ne le faites qu’intentionnellement.
- L’accès à l’espace de travail (`workspaceAccess`) est indépendant des modes des montages liés.

## Politique des outils : quels outils existent/peuvent être appelés

Plusieurs couches sont importantes :

- **Profil d’outils** : `tools.profile` et `agents.list[].tools.profile` (liste d’autorisation de base)
- **Profil d’outils du fournisseur** : `tools.byProvider[provider].profile` et `agents.list[].tools.byProvider[provider].profile`
- **Politique globale/par agent des outils** : `tools.allow`/`tools.deny` et `agents.list[].tools.allow`/`agents.list[].tools.deny`
- **Politique des outils du fournisseur** : `tools.byProvider[provider].allow/deny` et `agents.list[].tools.byProvider[provider].allow/deny`
- **Politique des outils du bac à sable** (s’applique uniquement dans un bac à sable) : `tools.sandbox.tools.allow`/`tools.sandbox.tools.deny` et `agents.list[].tools.sandbox.tools.*`

Règles générales :

- `deny` l’emporte toujours.
- Si `allow` n’est pas vide, tout le reste est considéré comme bloqué.
- La politique des outils constitue un blocage absolu : `/exec` ne peut pas contourner l’interdiction de l’outil `exec`.
- La politique des outils filtre leur disponibilité par nom ; elle n’examine pas les effets secondaires dans `exec`. Si `exec` est autorisé, interdire `write`, `edit` ou `apply_patch` ne rend pas les commandes shell accessibles en lecture seule.
- `/exec` ne modifie que les valeurs par défaut de la session pour les expéditeurs autorisés ; il n’accorde aucun accès aux outils.
- Les clés d’outils du fournisseur acceptent soit `provider` (par exemple `google-antigravity`), soit `provider/model` (par exemple `openai/gpt-5.4`).
- Les journaux du Gateway incluent des entrées d’audit `agents/tool-policy` lorsqu’une étape de la politique des outils supprime des outils ou qu’une politique des outils du bac à sable bloque un appel. Utilisez `openclaw logs` pour voir l’étiquette de la règle, la clé de configuration et les noms des outils concernés.

### Groupes d’outils (raccourcis)

Les politiques des outils (globales, propres à l’agent ou au bac à sable) prennent en charge les entrées `group:*`, qui se développent en plusieurs outils :

```json5
{
  tools: {
    sandbox: {
      tools: {
        allow: ["group:runtime", "group:fs", "group:sessions", "group:memory"],
      },
    },
  },
}
```

Groupes disponibles :

| Groupe             | Outils                                                                                                                                                     |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | `exec`, `process`, `code_execution` (`bash` est accepté comme alias de `exec`)                                                                              |
| `group:fs`         | `read`, `write`, `edit`, `apply_patch`                                                                                                                     |
| `group:sessions`   | `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status`                                    |
| `group:memory`     | `memory_search`, `memory_get`                                                                                                                              |
| `group:web`        | `web_search`, `x_search`, `web_fetch`                                                                                                                      |
| `group:ui`         | `browser`, `canvas`                                                                                                                                        |
| `group:automation` | `heartbeat_respond`, `cron`, `gateway`                                                                                                                     |
| `group:messaging`  | `message`                                                                                                                                                  |
| `group:nodes`      | `nodes`, `computer`                                                                                                                                        |
| `group:agents`     | `agents_list`, `get_goal`, `create_goal`, `update_goal`, `update_plan`, `skill_workshop`                                                                   |
| `group:media`      | `image`, `image_generate`, `music_generate`, `video_generate`, `tts`                                                                                       |
| `group:openclaw`   | la plupart des outils intégrés d’OpenClaw (à l’exception des primitives de système de fichiers et d’exécution `read`/`write`/`edit`/`apply_patch`/`exec`/`process`, de `canvas` et des plugins de fournisseur) |
| `group:plugins`    | tous les outils chargés appartenant aux plugins, y compris les serveurs MCP configurés exposés via `bundle-mcp`                                             |

Pour les agents en lecture seule, interdisez `group:runtime` ainsi que les outils qui modifient le système de fichiers, sauf si la politique du système de fichiers du bac à sable ou une limite d’hôte distincte impose la contrainte de lecture seule.

Pour les serveurs MCP placés dans un bac à sable, la politique des outils du bac à sable constitue un second contrôle d’autorisation. Si `mcp.servers` est configuré mais que les tours placés dans un bac à sable n’affichent que les outils intégrés, ajoutez `bundle-mcp`, `group:plugins` ou un nom/motif global d’outil MCP préfixé par le serveur, tel que `outlook__send_mail` ou `outlook__*`, à `tools.sandbox.tools.alsoAllow`, puis redémarrez/rechargez le Gateway et capturez de nouveau la liste des outils. Les motifs globaux de serveurs utilisent le préfixe de serveur MCP compatible avec les fournisseurs : les caractères autres que `[A-Za-z0-9_-]` deviennent `-`, les noms qui ne commencent pas par une lettre reçoivent le préfixe `mcp-`, et les préfixes longs ou en double peuvent être tronqués ou recevoir un suffixe.

`openclaw doctor` vérifie actuellement cette structure pour les serveurs gérés par OpenClaw dans `mcp.servers`. Les serveurs MCP chargés à partir des manifestes de plugins intégrés ou du fichier `.mcp.json` de Claude utilisent le même contrôle du bac à sable, mais ce diagnostic ne répertorie pas encore ces sources ; utilisez les mêmes entrées de liste d’autorisation si leurs outils disparaissent dans les tours placés dans un bac à sable.

## Mode privilégié : « exécuter sur l’hôte » réservé à `exec`

Le mode privilégié **n’accorde pas** d’outils supplémentaires ; il affecte uniquement `exec`.

- Si vous êtes dans un bac à sable, `/elevated on` (ou `exec` avec `elevated: true`) s’exécute hors du bac à sable (des approbations peuvent toujours s’appliquer).
- Utilisez `/elevated full` pour ignorer les approbations d’exécution pendant la session.
- Si vous exécutez déjà directement sur l’hôte, le mode privilégié est de fait sans effet (les contrôles continuent de s’appliquer).
- Le mode privilégié n’est **pas** limité à un Skill et ne contourne **pas** les autorisations/interdictions d’outils.
- Le mode privilégié n’accorde pas de contournements arbitraires entre hôtes à partir de `host=auto` ; il suit les règles normales de cible d’exécution et ne conserve `node` que lorsque la cible configurée/de session est déjà `node`.
- `/exec` est distinct du mode privilégié. Il ajuste uniquement les valeurs par défaut d’exécution propres à la session pour les expéditeurs autorisés.

Contrôles :

- Activation : `tools.elevated.enabled` (et éventuellement `agents.list[].tools.elevated.enabled`)
- Listes d’expéditeurs autorisés : `tools.elevated.allowFrom.<provider>` (et éventuellement `agents.list[].tools.elevated.allowFrom.<provider>`)

Consultez [Mode privilégié](/fr/tools/elevated).

## Correctifs courants en cas d’« enfermement dans le bac à sable »

### « Outil X bloqué par la politique des outils du bac à sable »

Clés à corriger (choisissez une option) :

- Désactivez le bac à sable : `agents.defaults.sandbox.mode=off` (ou, par agent, `agents.list[].sandbox.mode=off`)
- Autorisez l’outil dans le bac à sable :
  - retirez-le de `tools.sandbox.tools.deny` (ou, par agent, de `agents.list[].tools.sandbox.tools.deny`)
  - ou ajoutez-le à `tools.sandbox.tools.allow` (ou à la liste d’autorisation par agent)
- Consultez `openclaw logs` pour trouver l’entrée `agents/tool-policy`. Elle enregistre le mode du bac à sable et indique si la règle d’autorisation ou d’interdiction a bloqué l’outil.

### « Je pensais qu’il s’agissait de la session principale ; pourquoi est-elle dans un bac à sable ? »

En mode `"non-main"`, les clés de groupe/canal ne sont _pas_ principales. Utilisez la clé de la session principale (affichée par `sandbox explain`) ou passez au mode `"off"`.

## Voir aussi

- [Mise en bac à sable](/fr/gateway/sandboxing) -- référence complète du bac à sable (modes, portées, backends, images)
- [Bac à sable et outils multi-agents](/fr/tools/multi-agent-sandbox-tools) -- remplacements par agent et ordre de priorité
- [Mode privilégié](/fr/tools/elevated)
