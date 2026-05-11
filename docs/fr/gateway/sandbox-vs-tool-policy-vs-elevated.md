---
read_when: You hit 'sandbox jail' or see a tool/elevated refusal and want the exact config key to change.
status: active
summary: 'Pourquoi un outil est bloqué : environnement d’exécution sandbox, stratégie d’autorisation/refus des outils et garde-fous d’exécution avec privilèges élevés'
title: Bac à sable, politique des outils et privilèges élevés
x-i18n:
    generated_at: "2026-05-11T20:38:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9d670aa4f2e0f2265590e0de6198de841e744d210bbc54d291cb448d368e63b6
    source_path: gateway/sandbox-vs-tool-policy-vs-elevated.md
    workflow: 16
---

OpenClaw dispose de trois contrôles liés (mais différents) :

1. **Bac à sable** (`agents.defaults.sandbox.*` / `agents.list[].sandbox.*`) décide **où les outils s’exécutent** (backend de bac à sable ou hôte).
2. **Politique des outils** (`tools.*`, `tools.sandbox.tools.*`, `agents.list[].tools.*`) décide **quels outils sont disponibles/autorisés**.
3. **Élevé** (`tools.elevated.*`, `agents.list[].tools.elevated.*`) est une **échappatoire réservée à l’exécution** pour s’exécuter hors du bac à sable lorsque vous êtes dans un bac à sable (`gateway` par défaut, ou `node` lorsque la cible d’exécution est configurée sur `node`).

## Débogage rapide

Utilisez l’inspecteur pour voir ce qu’OpenClaw fait _réellement_ :

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

Il affiche :

- le mode/la portée/l’accès à l’espace de travail effectifs du bac à sable
- si la session est actuellement dans un bac à sable (principale ou non principale)
- les autorisations/refus effectifs des outils du bac à sable (et s’ils proviennent de l’agent, du global ou de la valeur par défaut)
- les verrous du mode élevé et les chemins de clés de correction

## Bac à sable : où les outils s’exécutent

La mise en bac à sable est contrôlée par `agents.defaults.sandbox.mode` :

- `"off"` : tout s’exécute sur l’hôte.
- `"non-main"` : seules les sessions non principales sont dans un bac à sable (source fréquente de « surprise » pour les groupes/canaux).
- `"all"` : tout est dans un bac à sable.

Consultez [Mise en bac à sable](/fr/gateway/sandboxing) pour la matrice complète (portée, montages d’espace de travail, images).

### Montages liés (contrôle de sécurité rapide)

- `docker.binds` _perce_ le système de fichiers du bac à sable : tout ce que vous montez est visible dans le conteneur avec le mode que vous définissez (`:ro` ou `:rw`).
- La valeur par défaut est lecture-écriture si vous omettez le mode ; préférez `:ro` pour le code source/les secrets.
- `scope: "shared"` ignore les montages propres à chaque agent (seuls les montages globaux s’appliquent).
- OpenClaw valide deux fois les sources de montage : d’abord sur le chemin source normalisé, puis de nouveau après résolution via l’ancêtre existant le plus profond. Les échappements par parent symbolique ne contournent pas les contrôles de chemins bloqués ou de racines autorisées.
- Les chemins de feuille inexistants sont tout de même vérifiés en toute sécurité. Si `/workspace/alias-out/new-file` se résout via un parent symbolique vers un chemin bloqué ou hors des racines autorisées configurées, le montage est rejeté.
- Monter `/var/run/docker.sock` donne effectivement le contrôle de l’hôte au bac à sable ; ne le faites que délibérément.
- L’accès à l’espace de travail (`workspaceAccess: "ro"`/`"rw"`) est indépendant des modes de montage.

## Politique des outils : quels outils existent/sont appelables

Deux couches comptent :

- **Profil d’outils** : `tools.profile` et `agents.list[].tools.profile` (liste d’autorisations de base)
- **Profil d’outils du fournisseur** : `tools.byProvider[provider].profile` et `agents.list[].tools.byProvider[provider].profile`
- **Politique d’outils globale/par agent** : `tools.allow`/`tools.deny` et `agents.list[].tools.allow`/`agents.list[].tools.deny`
- **Politique d’outils du fournisseur** : `tools.byProvider[provider].allow/deny` et `agents.list[].tools.byProvider[provider].allow/deny`
- **Politique d’outils du bac à sable** (s’applique uniquement en bac à sable) : `tools.sandbox.tools.allow`/`tools.sandbox.tools.deny` et `agents.list[].tools.sandbox.tools.*`

Règles pratiques :

- `deny` l’emporte toujours.
- Si `allow` n’est pas vide, tout le reste est considéré comme bloqué.
- La politique des outils est l’arrêt ferme : `/exec` ne peut pas remplacer un outil `exec` refusé.
- La politique des outils filtre la disponibilité des outils par nom ; elle n’inspecte pas les effets de bord dans `exec`. Si `exec` est autorisé, refuser `write`, `edit` ou `apply_patch` ne rend pas les commandes shell en lecture seule.
- `/exec` ne change que les valeurs par défaut de session pour les expéditeurs autorisés ; il n’accorde pas d’accès aux outils.
  Les clés d’outils du fournisseur acceptent soit `provider` (par exemple `google-antigravity`), soit `provider/model` (par exemple `openai/gpt-5.4`).

### Groupes d’outils (raccourcis)

Les politiques d’outils (globale, agent, bac à sable) prennent en charge les entrées `group:*` qui s’étendent à plusieurs outils :

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
  alias pour `exec`)
- `group:fs` : `read`, `write`, `edit`, `apply_patch`
  Pour les agents en lecture seule, refusez `group:runtime` ainsi que les outils de système de fichiers qui modifient l’état, sauf si la politique de système de fichiers du bac à sable ou une frontière d’hôte distincte impose la contrainte de lecture seule.
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

## Élevé : « exécuter sur l’hôte » réservé à exec

Le mode élevé n’accorde **pas** d’outils supplémentaires ; il n’affecte que `exec`.

- Si vous êtes dans un bac à sable, `/elevated on` (ou `exec` avec `elevated: true`) s’exécute hors du bac à sable (des approbations peuvent tout de même s’appliquer).
- Utilisez `/elevated full` pour ignorer les approbations exec pour la session.
- Si vous exécutez déjà directement, le mode élevé est effectivement sans effet (toujours soumis aux verrous).
- Le mode élevé n’est **pas** limité aux Skills et ne remplace **pas** les autorisations/refus d’outils.
- Le mode élevé n’accorde pas de remplacements arbitraires entre hôtes depuis `host=auto` ; il suit les règles normales de cible d’exécution et ne conserve `node` que lorsque la cible configurée/de session est déjà `node`.
- `/exec` est distinct du mode élevé. Il ajuste uniquement les valeurs par défaut exec par session pour les expéditeurs autorisés.

Verrous :

- Activation : `tools.elevated.enabled` (et éventuellement `agents.list[].tools.elevated.enabled`)
- Listes d’autorisation des expéditeurs : `tools.elevated.allowFrom.<provider>` (et éventuellement `agents.list[].tools.elevated.allowFrom.<provider>`)

Consultez [Mode élevé](/fr/tools/elevated).

## Corrections courantes de « prison de bac à sable »

### « Outil X bloqué par la politique d’outils du bac à sable »

Clés de correction (choisissez-en une) :

- Désactiver le bac à sable : `agents.defaults.sandbox.mode=off` (ou par agent `agents.list[].sandbox.mode=off`)
- Autoriser l’outil dans le bac à sable :
  - le retirer de `tools.sandbox.tools.deny` (ou par agent `agents.list[].tools.sandbox.tools.deny`)
  - ou l’ajouter à `tools.sandbox.tools.allow` (ou à l’autorisation par agent)

### « Je pensais que c’était la session principale, pourquoi est-elle dans un bac à sable ? »

En mode `"non-main"`, les clés de groupe/canal ne sont _pas_ principales. Utilisez la clé de session principale (affichée par `sandbox explain`) ou passez le mode à `"off"`.

## Connexe

- [Mise en bac à sable](/fr/gateway/sandboxing) -- référence complète du bac à sable (modes, portées, backends, images)
- [Bac à sable et outils multi-agents](/fr/tools/multi-agent-sandbox-tools) -- remplacements par agent et précédence
- [Mode élevé](/fr/tools/elevated)
