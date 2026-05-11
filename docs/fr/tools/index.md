---
read_when:
    - Vous souhaitez comprendre les outils fournis par OpenClaw
    - Vous devez configurer, autoriser ou refuser des outils
    - Vous choisissez entre les outils intégrés, les Skills et les plugins
summary: 'Présentation des outils et plugins OpenClaw : ce que l’agent peut faire et comment l’étendre'
title: Outils et plugins
x-i18n:
    generated_at: "2026-05-11T20:58:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: b12b2d605c8fccb0de378f8a63fb92b8c3bad8abd3edf10bb79632d6ef6089fd
    source_path: tools/index.md
    workflow: 16
---

Tout ce que l’agent fait au-delà de la génération de texte passe par des **outils**.
Les outils permettent à l’agent de lire des fichiers, d’exécuter des commandes, de parcourir le Web, d’envoyer
des messages et d’interagir avec des appareils.

## Outils, Skills et Plugins

OpenClaw comporte trois couches qui fonctionnent ensemble:

<Steps>
  <Step title="Les outils sont ce que l’agent appelle">
    Un outil est une fonction typée que l’agent peut invoquer (par exemple `exec`, `browser`,
    `web_search`, `message`). OpenClaw fournit un ensemble d’**outils intégrés** et
    les Plugins peuvent en enregistrer d’autres.

    L’agent voit les outils comme des définitions de fonctions structurées envoyées à l’API du modèle.

  </Step>

  <Step title="Les Skills enseignent à l’agent quand et comment agir">
    Une Skill est un fichier markdown (`SKILL.md`) injecté dans l’invite système.
    Les Skills donnent à l’agent du contexte, des contraintes et des instructions étape par étape pour
    utiliser efficacement les outils. Les Skills résident dans votre espace de travail, dans des dossiers partagés,
    ou sont fournies dans des Plugins.

    [Référence Skills](/fr/tools/skills) | [Créer des Skills](/fr/tools/creating-skills)

  </Step>

  <Step title="Les Plugins regroupent tout">
    Un Plugin est un paquet qui peut enregistrer n’importe quelle combinaison de capacités:
    canaux, fournisseurs de modèles, outils, Skills, parole, transcription en temps réel,
    voix en temps réel, compréhension des médias, génération d’images, génération de vidéos,
    récupération Web, recherche Web, et plus encore. Certains Plugins sont **core** (fournis avec
    OpenClaw), d’autres sont **externes** (publiés sur npm par la communauté).

    [Installer et configurer des Plugins](/fr/tools/plugin) | [Créer le vôtre](/fr/plugins/building-plugins)

  </Step>
</Steps>

## Outils intégrés

Ces outils sont fournis avec OpenClaw et sont disponibles sans installer de Plugins:

| Outil                                      | Ce qu’il fait                                                        | Page                                                         |
| ------------------------------------------ | --------------------------------------------------------------------- | ------------------------------------------------------------ |
| `exec` / `process`                         | Exécuter des commandes shell, gérer des processus en arrière-plan     | [Exec](/fr/tools/exec), [Approbations Exec](/fr/tools/exec-approvals) |
| `code_execution`                           | Exécuter une analyse Python distante en bac à sable                   | [Exécution de code](/fr/tools/code-execution)                   |
| `browser`                                  | Contrôler un navigateur Chromium (naviguer, cliquer, capture d’écran) | [Navigateur](/fr/tools/browser)                                 |
| `web_search` / `x_search` / `web_fetch`    | Rechercher sur le Web, rechercher des publications X, récupérer le contenu d’une page | [Web](/fr/tools/web), [Récupération Web](/fr/tools/web-fetch)      |
| `read` / `write` / `edit`                  | E/S de fichiers dans l’espace de travail                              |                                                              |
| `apply_patch`                              | Correctifs de fichiers multi-blocs                                    | [Apply Patch](/fr/tools/apply-patch)                            |
| `message`                                  | Envoyer des messages sur tous les canaux                              | [Envoi par l’agent](/fr/tools/agent-send)                       |
| `nodes`                                    | Découvrir et cibler des appareils appairés                            |                                                              |
| `cron` / `gateway`                         | Gérer les tâches planifiées; inspecter, corriger, redémarrer ou mettre à jour le gateway |                                                              |
| `image` / `image_generate`                 | Analyser ou générer des images                                        | [Génération d’images](/fr/tools/image-generation)               |
| `music_generate`                           | Générer des pistes musicales                                          | [Génération musicale](/fr/tools/music-generation)               |
| `video_generate`                           | Générer des vidéos                                                    | [Génération vidéo](/fr/tools/video-generation)                  |
| `tts`                                      | Conversion texte-parole ponctuelle                                    | [TTS](/fr/tools/tts)                                            |
| `sessions_*` / `subagents` / `agents_list` | Gestion des sessions, état et orchestration de sous-agents            | [Sous-agents](/fr/tools/subagents)                              |
| `session_status`                           | Restitution légère de type `/status` et remplacement du modèle de session | [Outils de session](/fr/concepts/session-tool)                  |

Pour le travail sur les images, utilisez `image` pour l’analyse et `image_generate` pour la génération ou l’édition. Si vous ciblez `openai/*`, `google/*`, `fal/*` ou un autre fournisseur d’images non défini par défaut, configurez d’abord l’authentification/la clé d’API de ce fournisseur.

Pour le travail musical, utilisez `music_generate`. Si vous ciblez `google/*`, `minimax/*` ou un autre fournisseur de musique non défini par défaut, configurez d’abord l’authentification/la clé d’API de ce fournisseur.

Pour le travail vidéo, utilisez `video_generate`. Si vous ciblez `qwen/*` ou un autre fournisseur vidéo non défini par défaut, configurez d’abord l’authentification/la clé d’API de ce fournisseur.

Pour la génération audio pilotée par workflow, utilisez `music_generate` lorsqu’un Plugin tel que
ComfyUI l’enregistre. C’est distinct de `tts`, qui correspond au texte-parole.

`session_status` est l’outil léger d’état/restitution dans le groupe des sessions.
Il répond aux questions de type `/status` sur la session actuelle et peut
éventuellement définir un remplacement de modèle par session; `model=default` efface ce
remplacement. Comme `/status`, il peut compléter a posteriori des compteurs rares de jetons/cache et le
libellé du modèle d’exécution actif à partir de la dernière entrée d’utilisation du transcript.

`gateway` est l’outil d’exécution réservé au propriétaire pour les opérations gateway:

- `config.schema.lookup` pour un sous-arbre de configuration limité à un chemin avant les modifications
- `config.get` pour l’instantané de configuration actuel + hash
- `config.patch` pour des mises à jour partielles de configuration avec redémarrage
- `config.apply` uniquement pour le remplacement complet de la configuration
- `update.run` pour une auto-mise à jour explicite + redémarrage

Pour les changements partiels, préférez `config.schema.lookup` puis `config.patch`. Utilisez
`config.apply` uniquement lorsque vous remplacez intentionnellement toute la configuration.
Pour une documentation de configuration plus large, lisez [Configuration](/fr/gateway/configuration) et
[Référence de configuration](/fr/gateway/configuration-reference).
L’outil refuse également de modifier `tools.exec.ask` ou `tools.exec.security`;
les alias hérités `tools.bash.*` se normalisent vers les mêmes chemins exec protégés.

### Outils fournis par les Plugins

Les Plugins peuvent enregistrer des outils supplémentaires. Quelques exemples:

- [Canvas](/fr/plugins/reference/canvas) — Plugin intégré expérimental pour le contrôle Node Canvas et le rendu A2UI
- [Diffs](/fr/tools/diffs) — visionneuse et moteur de rendu de diff
- [Tâche LLM](/fr/tools/llm-task) — étape LLM JSON uniquement pour une sortie structurée
- [Lobster](/fr/tools/lobster) — environnement d’exécution de workflow typé avec approbations reprenables
- [Génération musicale](/fr/tools/music-generation) — outil partagé `music_generate` avec fournisseurs appuyés par workflow
- [OpenProse](/fr/prose) — orchestration de workflow centrée sur markdown
- [Tokenjuice](/fr/tools/tokenjuice) — résultats compacts et bruyants des outils `exec` et `bash`

Les outils de Plugin sont toujours créés avec `api.registerTool(...)` et déclarés dans
la liste `contracts.tools` du manifeste du Plugin. OpenClaw capture le descripteur
d’outil validé pendant la découverte et le met en cache par source et contrat de Plugin, afin que
la planification ultérieure des outils puisse éviter de charger l’exécution du Plugin. L’exécution de l’outil charge tout de même
le Plugin propriétaire et appelle l’implémentation enregistrée active.

[Recherche d’outil](/fr/tools/tool-search) est la surface compacte
pour les grands catalogues. Au lieu de placer chaque schéma d’outil OpenClaw, MCP ou client
dans l’invite, OpenClaw peut fournir au modèle un environnement d’exécution Node isolé
avec `openclaw.tools.search`, `openclaw.tools.describe` et
`openclaw.tools.call`. Les appels repassent tout de même par le Gateway, de sorte que la
politique des outils, les approbations, les hooks et les journaux de session restent l’autorité.

## Configuration des outils

### Listes d’autorisation et de refus

Contrôlez quels outils l’agent peut appeler via `tools.allow` / `tools.deny` dans
la configuration. Le refus l’emporte toujours sur l’autorisation.

```json5
{
  tools: {
    allow: ["group:fs", "browser", "web_search"],
    deny: ["exec"],
  },
}
```

OpenClaw échoue en mode fermé lorsqu’une liste d’autorisation explicite ne se résout vers aucun outil appelable.
Par exemple, `tools.allow: ["query_db"]` ne fonctionne que si un Plugin chargé enregistre effectivement
`query_db`. Si aucun outil intégré, Plugin ou MCP groupé ne correspond à la
liste d’autorisation, l’exécution s’arrête avant l’appel du modèle au lieu de continuer comme une
exécution texte uniquement qui pourrait halluciner des résultats d’outils.

### Profils d’outils

`tools.profile` définit une liste d’autorisation de base avant l’application de `allow`/`deny`.
Remplacement par agent: `agents.list[].tools.profile`.

| Profil      | Ce qu’il inclut                                                                                                                                   |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `full`      | Tous les outils core et les outils de Plugin facultatifs; base non restreinte pour un accès plus large aux commandes/contrôles                    |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `music_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                                         |
| `minimal`   | `session_status` uniquement                                                                                                                       |

<Note>
`tools.profile: "messaging"` est volontairement étroit pour les agents centrés sur les canaux.
Il exclut des outils de commande/contrôle plus larges comme le système de fichiers, l’exécution,
le navigateur, canvas, nodes, cron et le contrôle gateway. Utilisez `tools.profile: "full"`
comme base non restreinte pour un accès plus large aux commandes/contrôles, puis limitez
l’accès avec `tools.allow` / `tools.deny` si nécessaire.
</Note>

`coding` inclut des outils Web légers (`web_search`, `web_fetch`, `x_search`)
mais pas l’outil complet de contrôle du navigateur. L’automatisation du navigateur peut piloter de vraies
sessions et des profils connectés; ajoutez-la donc explicitement avec
`tools.alsoAllow: ["browser"]` ou un
`agents.list[].tools.alsoAllow: ["browser"]` par agent.

<Note>
Configurer `tools.exec` ou `tools.fs` sous un profil restrictif (`messaging`, `minimal`) n’élargit pas implicitement la liste d’autorisation du profil. Ajoutez des entrées explicites `tools.alsoAllow` (par exemple `["exec", "process"]` pour exec, ou `["read", "write", "edit"]` pour fs) lorsque vous voulez qu’un profil restrictif utilise ces sections configurées. OpenClaw journalise un avertissement au démarrage lorsqu’une section de configuration est présente sans autorisation `alsoAllow` correspondante.
</Note>

Les profils `coding` et `messaging` autorisent également les outils MCP groupés configurés
sous la clé de Plugin `bundle-mcp`. Ajoutez `tools.deny: ["bundle-mcp"]` lorsque vous
voulez qu’un profil conserve ses outils intégrés normaux mais masque tous les outils MCP configurés.
Le profil `minimal` n’inclut pas les outils MCP groupés.

Exemple (surface d’outils la plus large par défaut):

```json5
{
  tools: {
    profile: "full",
  },
}
```

### Groupes d’outils

Utilisez les raccourcis `group:*` dans les listes d’autorisation/refus:

| Groupe             | Outils                                                                                                    |
| ------------------ | --------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | exec, process, code_execution (`bash` est accepté comme alias de `exec`)                                  |
| `group:fs`         | read, write, edit, apply_patch                                                                            |
| `group:sessions`   | sessions_list, sessions_history, sessions_send, sessions_spawn, sessions_yield, subagents, session_status |
| `group:memory`     | memory_search, memory_get                                                                                 |
| `group:web`        | web_search, x_search, web_fetch                                                                           |
| `group:ui`         | browser, canvas lorsque le Plugin Canvas intégré est activé                                               |
| `group:automation` | heartbeat_respond, cron, gateway                                                                          |
| `group:messaging`  | message                                                                                                   |
| `group:nodes`      | nodes                                                                                                     |
| `group:agents`     | agents_list, update_plan                                                                                  |
| `group:media`      | image, image_generate, music_generate, video_generate, tts                                                |
| `group:openclaw`   | Tous les outils intégrés d’OpenClaw (exclut les outils de Plugin)                                         |

`sessions_history` renvoie une vue de rappel bornée et filtrée pour la sécurité. Il supprime
les balises de réflexion, l’échafaudage `<relevant-memories>`, les charges utiles XML
d’appels d’outils en texte brut (y compris `<tool_call>...</tool_call>`,
`<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
`<function_calls>...</function_calls>` et les blocs d’appels d’outils tronqués),
l’échafaudage d’appels d’outils rétrogradé, les jetons de contrôle de modèle
ASCII/pleine largeur divulgués et le XML d’appel d’outil MiniMax mal formé dans
le texte de l’assistant, puis applique caviardage/troncature et d’éventuels
espaces réservés pour les lignes surdimensionnées, au lieu d’agir comme un
vidage brut de transcription.

### Restrictions propres aux fournisseurs

Utilisez `tools.byProvider` pour restreindre les outils pour des fournisseurs spécifiques sans
modifier les valeurs par défaut globales :

```json5
{
  tools: {
    profile: "coding",
    byProvider: {
      "google-antigravity": { profile: "minimal" },
    },
  },
}
```
