---
read_when: You hit 'sandbox jail' or see a tool/elevated refusal and want the exact config key to change.
status: active
summary: 'Pourquoi un outil est bloqué : environnement d’exécution en bac à sable, politique d’autorisation/de refus des outils et contrôles d’exécution avec privilèges élevés'
title: Bac à sable vs politique des outils vs privilèges élevés
x-i18n:
    generated_at: "2026-05-06T07:24:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: cd303355774e3d73161b5704ba664d7418160e9b6792a904c7d5092e0351b320
    source_path: gateway/sandbox-vs-tool-policy-vs-elevated.md
    workflow: 16
---

OpenClaw dispose de trois contrôles liés (mais différents) :

1. **Bac à sable** (`agents.defaults.sandbox.*` / `agents.list[].sandbox.*`) décide **où les outils s’exécutent** (backend de bac à sable ou hôte).
2. **Politique d’outils** (`tools.*`, `tools.sandbox.tools.*`, `agents.list[].tools.*`) décide **quels outils sont disponibles/autorisés**.
3. **Élévation** (`tools.elevated.*`, `agents.list[].tools.elevated.*`) est une **échappatoire réservée à exec** pour s’exécuter hors du bac à sable lorsque vous êtes en bac à sable (`gateway` par défaut, ou `node` lorsque la cible exec est configurée sur `node`).

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
- si la session est actuellement en bac à sable (main ou non-main)
- les autorisations/refus effectifs des outils du bac à sable (et s’ils viennent de l’agent, du global ou des valeurs par défaut)
- les garde-fous d’élévation et les chemins de clés de correction

## Bac à sable : où les outils s’exécutent

La mise en bac à sable est contrôlée par `agents.defaults.sandbox.mode` :

- `"off"` : tout s’exécute sur l’hôte.
- `"non-main"` : seules les sessions non-main sont en bac à sable (source courante de « surprise » pour les groupes/canaux).
- `"all"` : tout est en bac à sable.

Consultez [Mise en bac à sable](/fr/gateway/sandboxing) pour la matrice complète (portée, montages d’espace de travail, images).

### Montages bind (vérification de sécurité rapide)

- `docker.binds` _perce_ le système de fichiers du bac à sable : tout ce que vous montez est visible dans le conteneur avec le mode que vous définissez (`:ro` ou `:rw`).
- La valeur par défaut est lecture-écriture si vous omettez le mode ; préférez `:ro` pour les sources/secrets.
- `scope: "shared"` ignore les montages par agent (seuls les montages globaux s’appliquent).
- OpenClaw valide les sources de montage deux fois : d’abord sur le chemin source normalisé, puis à nouveau après résolution via l’ancêtre existant le plus profond. Les échappements par parent symbolique ne contournent pas les vérifications de chemins bloqués ou de racines autorisées.
- Les chemins de feuille inexistants restent vérifiés en toute sécurité. Si `/workspace/alias-out/new-file` se résout via un parent symbolique vers un chemin bloqué ou hors des racines autorisées configurées, le montage est rejeté.
- Monter `/var/run/docker.sock` donne effectivement le contrôle de l’hôte au bac à sable ; ne le faites que délibérément.
- L’accès à l’espace de travail (`workspaceAccess: "ro"`/`"rw"`) est indépendant des modes de montage.

## Politique d’outils : quels outils existent/sont appelables

Deux couches comptent :

- **Profil d’outils** : `tools.profile` et `agents.list[].tools.profile` (liste d’autorisation de base)
- **Profil d’outils du fournisseur** : `tools.byProvider[provider].profile` et `agents.list[].tools.byProvider[provider].profile`
- **Politique d’outils globale/par agent** : `tools.allow`/`tools.deny` et `agents.list[].tools.allow`/`agents.list[].tools.deny`
- **Politique d’outils du fournisseur** : `tools.byProvider[provider].allow/deny` et `agents.list[].tools.byProvider[provider].allow/deny`
- **Politique d’outils du bac à sable** (s’applique uniquement en bac à sable) : `tools.sandbox.tools.allow`/`tools.sandbox.tools.deny` et `agents.list[].tools.sandbox.tools.*`

Règles pratiques :

- `deny` l’emporte toujours.
- Si `allow` n’est pas vide, tout le reste est considéré comme bloqué.
- La politique d’outils est l’arrêt net : `/exec` ne peut pas contourner un outil `exec` refusé.
- `/exec` ne modifie que les valeurs par défaut de session pour les expéditeurs autorisés ; il n’accorde pas l’accès aux outils.
  Les clés d’outils de fournisseur acceptent soit `provider` (par exemple `google-antigravity`), soit `provider/model` (par exemple `openai/gpt-5.4`).

### Groupes d’outils (raccourcis)

Les politiques d’outils (globale, agent, bac à sable) prennent en charge les entrées `group:*`, qui se développent en plusieurs outils :

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
- `group:sessions` : `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status`
- `group:memory` : `memory_search`, `memory_get`
- `group:web` : `web_search`, `x_search`, `web_fetch`
- `group:ui` : `browser`, `canvas`
- `group:automation` : `heartbeat_respond`, `cron`, `gateway`
- `group:messaging` : `message`
- `group:nodes` : `nodes`
- `group:agents` : `agents_list`, `update_plan`
- `group:media` : `image`, `image_generate`, `music_generate`, `video_generate`, `tts`
- `group:openclaw` : tous les outils intégrés d’OpenClaw (exclut les plugins de fournisseur)

## Élévation : « exécuter sur l’hôte » réservé à exec

L’élévation n’accorde **pas** d’outils supplémentaires ; elle n’affecte que `exec`.

- Si vous êtes en bac à sable, `/elevated on` (ou `exec` avec `elevated: true`) s’exécute hors du bac à sable (des approbations peuvent toujours s’appliquer).
- Utilisez `/elevated full` pour ignorer les approbations exec pour la session.
- Si vous vous exécutez déjà directement, l’élévation est effectivement sans effet (toujours soumise aux garde-fous).
- L’élévation n’est **pas** limitée à une skill et ne remplace **pas** les autorisations/refus d’outils.
- L’élévation n’accorde pas de contournements inter-hôtes arbitraires depuis `host=auto` ; elle suit les règles normales de cible exec et ne conserve `node` que lorsque la cible configurée/de session est déjà `node`.
- `/exec` est distinct de l’élévation. Il ajuste seulement les valeurs par défaut exec par session pour les expéditeurs autorisés.

Garde-fous :

- Activation : `tools.elevated.enabled` (et éventuellement `agents.list[].tools.elevated.enabled`)
- Listes d’expéditeurs autorisés : `tools.elevated.allowFrom.<provider>` (et éventuellement `agents.list[].tools.elevated.allowFrom.<provider>`)

Consultez [Mode élevé](/fr/tools/elevated).

## Corrections courantes de « prison de bac à sable »

### « L’outil X est bloqué par la politique d’outils du bac à sable »

Clés de correction (choisissez-en une) :

- Désactiver le bac à sable : `agents.defaults.sandbox.mode=off` (ou par agent `agents.list[].sandbox.mode=off`)
- Autoriser l’outil dans le bac à sable :
  - retirez-le de `tools.sandbox.tools.deny` (ou par agent `agents.list[].tools.sandbox.tools.deny`)
  - ou ajoutez-le à `tools.sandbox.tools.allow` (ou à l’autorisation par agent)

### « Je pensais que c’était main, pourquoi est-ce en bac à sable ? »

En mode `"non-main"`, les clés de groupe/canal ne sont _pas_ main. Utilisez la clé de session main (affichée par `sandbox explain`) ou passez le mode à `"off"`.

## Connexe

- [Mise en bac à sable](/fr/gateway/sandboxing) -- référence complète du bac à sable (modes, portées, backends, images)
- [Bac à sable et outils multi-agent](/fr/tools/multi-agent-sandbox-tools) -- remplacements et précédence par agent
- [Mode élevé](/fr/tools/elevated)
