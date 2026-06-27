---
read_when: You hit 'sandbox jail' or see a tool/elevated refusal and want the exact config key to change.
status: active
summary: 'Pourquoi un outil est bloqué : environnement d’exécution sandbox, politique d’autorisation/refus des outils et barrières d’exécution élevée'
title: Bac à sable vs politique des outils vs privilèges élevés
x-i18n:
    generated_at: "2026-06-27T17:33:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f4156cc494a6aff4fb9c44cbca8fdfde10a3343dde624c485833dd7508e4c4d6
    source_path: gateway/sandbox-vs-tool-policy-vs-elevated.md
    workflow: 16
---

OpenClaw dispose de trois contrôles liés (mais différents) :

1. **Sandbox** (`agents.defaults.sandbox.*` / `agents.list[].sandbox.*`) décide **où les outils s’exécutent** (backend de sandbox ou hôte).
2. **Politique d’outils** (`tools.*`, `tools.sandbox.tools.*`, `agents.list[].tools.*`) décide **quels outils sont disponibles/autorisés**.
3. **Elevated** (`tools.elevated.*`, `agents.list[].tools.elevated.*`) est une **échappatoire réservée à exec** pour s’exécuter hors de la sandbox lorsque vous êtes en sandbox (`gateway` par défaut, ou `node` lorsque la cible exec est configurée sur `node`).

## Débogage rapide

Utilisez l’inspecteur pour voir ce qu’OpenClaw fait _réellement_ :

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

Il affiche :

- le mode/la portée/l’accès à l’espace de travail effectifs de la sandbox
- si la session est actuellement en sandbox (main ou non-main)
- les autorisations/refus effectifs des outils de sandbox (et s’ils proviennent de l’agent, du global ou du défaut)
- les garde-fous Elevated et les chemins de clés de correction

## Sandbox : où les outils s’exécutent

La mise en sandbox est contrôlée par `agents.defaults.sandbox.mode` :

- `"off"` : tout s’exécute sur l’hôte.
- `"non-main"` : seules les sessions non-main sont en sandbox (cas de « surprise » fréquent pour les groupes/canaux).
- `"all"` : tout est en sandbox.

Voir [Mise en sandbox](/fr/gateway/sandboxing) pour la matrice complète (portée, montages de l’espace de travail, images).

### Montages bind (vérification rapide de sécurité)

- `docker.binds` _perce_ le système de fichiers de la sandbox : tout ce que vous montez est visible dans le conteneur avec le mode défini (`:ro` ou `:rw`).
- La valeur par défaut est lecture-écriture si vous omettez le mode ; préférez `:ro` pour le source/les secrets.
- `scope: "shared"` ignore les montages bind par agent (seuls les montages bind globaux s’appliquent).
- OpenClaw valide les sources de bind deux fois : d’abord sur le chemin source normalisé, puis de nouveau après résolution via l’ancêtre existant le plus profond. Les échappements par parent symlink ne contournent pas les vérifications de chemins bloqués ou de racines autorisées.
- Les chemins feuilles inexistants sont tout de même vérifiés en toute sécurité. Si `/workspace/alias-out/new-file` se résout via un parent symlink vers un chemin bloqué ou hors des racines autorisées configurées, le bind est rejeté.
- Monter `/var/run/docker.sock` donne effectivement le contrôle de l’hôte à la sandbox ; ne le faites que délibérément.
- L’accès à l’espace de travail (`workspaceAccess: "ro"`/`"rw"`) est indépendant des modes de bind.

## Politique d’outils : quels outils existent/sont appelables

Deux couches comptent :

- **Profil d’outils** : `tools.profile` et `agents.list[].tools.profile` (liste d’autorisation de base)
- **Profil d’outils du fournisseur** : `tools.byProvider[provider].profile` et `agents.list[].tools.byProvider[provider].profile`
- **Politique d’outils globale/par agent** : `tools.allow`/`tools.deny` et `agents.list[].tools.allow`/`agents.list[].tools.deny`
- **Politique d’outils du fournisseur** : `tools.byProvider[provider].allow/deny` et `agents.list[].tools.byProvider[provider].allow/deny`
- **Politique d’outils de sandbox** (s’applique uniquement en sandbox) : `tools.sandbox.tools.allow`/`tools.sandbox.tools.deny` et `agents.list[].tools.sandbox.tools.*`

Règles générales :

- `deny` gagne toujours.
- Si `allow` n’est pas vide, tout le reste est considéré comme bloqué.
- La politique d’outils est l’arrêt ferme : `/exec` ne peut pas contourner un outil `exec` refusé.
- La politique d’outils filtre la disponibilité des outils par nom ; elle n’inspecte pas les effets de bord à l’intérieur de `exec`. Si `exec` est autorisé, refuser `write`, `edit` ou `apply_patch` ne rend pas les commandes shell en lecture seule.
- `/exec` ne change que les valeurs par défaut de session pour les expéditeurs autorisés ; il n’accorde pas l’accès aux outils.
  Les clés d’outils du fournisseur acceptent soit `provider` (par exemple `google-antigravity`), soit `provider/model` (par exemple `openai/gpt-5.4`).
- Les journaux Gateway incluent des entrées d’audit `agents/tool-policy` lorsqu’une étape de politique d’outils supprime des outils ou qu’une politique d’outils de sandbox bloque un appel. Utilisez `openclaw logs` pour voir l’étiquette de règle, la clé de configuration et les noms d’outils concernés.

### Groupes d’outils (raccourcis)

Les politiques d’outils (globales, agent, sandbox) prennent en charge les entrées `group:*` qui s’étendent à plusieurs outils :

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

- `group:runtime` : `exec`, `process`, `code_execution` (`bash` est accepté comme
  alias de `exec`)
- `group:fs` : `read`, `write`, `edit`, `apply_patch`
  Pour les agents en lecture seule, refusez `group:runtime` ainsi que les outils de système de fichiers modificateurs, sauf si la politique de système de fichiers de sandbox ou une limite d’hôte distincte impose la contrainte de lecture seule.
- `group:sessions` : `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status`
- `group:memory` : `memory_search`, `memory_get`
- `group:web` : `web_search`, `x_search`, `web_fetch`
- `group:ui` : `browser`, `canvas`
- `group:automation` : `heartbeat_respond`, `cron`, `gateway`
- `group:messaging` : `message`
- `group:nodes` : `nodes`
- `group:agents` : `agents_list`, `update_plan`
- `group:media` : `image`, `image_generate`, `music_generate`, `video_generate`, `tts`
- `group:openclaw` : tous les outils intégrés d’OpenClaw (exclut les plugins fournisseur)
- `group:plugins` : tous les outils appartenant aux plugins chargés, y compris les serveurs MCP configurés exposés via `bundle-mcp`

Pour les serveurs MCP en sandbox, la politique d’outils de sandbox est une deuxième porte d’autorisation. Si `mcp.servers` est configuré mais que les tours en sandbox n’affichent que les outils intégrés, ajoutez `bundle-mcp`, `group:plugins` ou un nom/glob d’outil MCP préfixé par serveur, comme `outlook__send_mail` ou `outlook__*`, à `tools.sandbox.tools.alsoAllow`, puis redémarrez/rechargez le gateway et capturez à nouveau la liste d’outils. Les globs de serveur utilisent le préfixe de serveur MCP sûr pour le fournisseur : les caractères non `-[A-Za-z0-9_-]` deviennent `-`, les noms qui ne commencent pas par une lettre reçoivent un préfixe `mcp-`, et les préfixes longs ou dupliqués peuvent être tronqués ou recevoir un suffixe.

`openclaw doctor` vérifie actuellement cette forme pour les serveurs gérés par OpenClaw dans `mcp.servers`. Les serveurs MCP chargés depuis les manifestes de plugins intégrés ou le `.mcp.json` de Claude utilisent la même porte de sandbox, mais ce diagnostic n’énumère pas encore ces sources ; utilisez les mêmes entrées de liste d’autorisation si leurs outils disparaissent dans les tours en sandbox.

## Elevated : « exécuter sur l’hôte » réservé à exec

Elevated n’accorde **pas** d’outils supplémentaires ; il n’affecte que `exec`.

- Si vous êtes en sandbox, `/elevated on` (ou `exec` avec `elevated: true`) s’exécute hors de la sandbox (des approbations peuvent toujours s’appliquer).
- Utilisez `/elevated full` pour ignorer les approbations exec pour la session.
- Si vous exécutez déjà en direct, Elevated est effectivement sans effet (toujours soumis à des garde-fous).
- Elevated n’est **pas** limité par Skill et ne contourne **pas** les autorisations/refus d’outils.
- Elevated n’accorde pas de contournements arbitraires inter-hôtes depuis `host=auto` ; il suit les règles normales de cible exec et ne conserve `node` que lorsque la cible configurée/de session est déjà `node`.
- `/exec` est distinct d’Elevated. Il ajuste seulement les valeurs par défaut exec par session pour les expéditeurs autorisés.

Garde-fous :

- Activation : `tools.elevated.enabled` (et éventuellement `agents.list[].tools.elevated.enabled`)
- Listes d’autorisation des expéditeurs : `tools.elevated.allowFrom.<provider>` (et éventuellement `agents.list[].tools.elevated.allowFrom.<provider>`)

Voir [Mode Elevated](/fr/tools/elevated).

## Corrections courantes de « prison sandbox »

### « Outil X bloqué par la politique d’outils de sandbox »

Clés de correction (choisissez-en une) :

- Désactiver la sandbox : `agents.defaults.sandbox.mode=off` (ou par agent `agents.list[].sandbox.mode=off`)
- Autoriser l’outil dans la sandbox :
  - le supprimer de `tools.sandbox.tools.deny` (ou, par agent, de `agents.list[].tools.sandbox.tools.deny`)
  - ou l’ajouter à `tools.sandbox.tools.allow` (ou à l’autorisation par agent)
- Vérifiez `openclaw logs` pour l’entrée `agents/tool-policy`. Elle enregistre le mode sandbox et indique si la règle d’autorisation ou de refus a bloqué l’outil.

### « Je pensais que c’était main, pourquoi est-ce en sandbox ? »

En mode `"non-main"`, les clés de groupe/canal ne sont _pas_ main. Utilisez la clé de session main (affichée par `sandbox explain`) ou passez le mode à `"off"`.

## Connexe

- [Mise en sandbox](/fr/gateway/sandboxing) -- référence complète de la sandbox (modes, portées, backends, images)
- [Sandbox et outils multi-agent](/fr/tools/multi-agent-sandbox-tools) -- remplacements par agent et précédence
- [Mode Elevated](/fr/tools/elevated)
