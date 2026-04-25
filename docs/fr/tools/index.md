---
read_when:
    - Vous voulez comprendre quels outils OpenClaw fournit
    - Vous devez configurer, autoriser ou refuser des outils
    - Vous hésitez entre outils intégrés, Skills et plugins
summary: 'Vue d’ensemble des outils et plugins OpenClaw : ce que l’agent peut faire et comment l’étendre'
title: Outils et plugins
x-i18n:
    generated_at: "2026-04-25T13:59:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 045b6b0744e02938ed6bb9e0ad956add11883be926474e78872ca928b32af090
    source_path: tools/index.md
    workflow: 15
---

Tout ce que l’agent fait au-delà de la génération de texte passe par des **outils**.
Les outils sont la manière dont l’agent lit des fichiers, exécute des commandes, navigue sur le web, envoie des
messages et interagit avec des appareils.

## Outils, Skills et plugins

OpenClaw a trois couches qui fonctionnent ensemble :

<Steps>
  <Step title="Les outils sont ce que l’agent appelle">
    Un outil est une fonction typée que l’agent peut invoquer (par exemple `exec`, `browser`,
    `web_search`, `message`). OpenClaw fournit un ensemble d’**outils intégrés** et
    les plugins peuvent en enregistrer d’autres.

    L’agent voit les outils comme des définitions de fonctions structurées envoyées à l’API du modèle.

  </Step>

  <Step title="Les Skills apprennent à l’agent quand et comment">
    Un skill est un fichier markdown (`SKILL.md`) injecté dans le prompt système.
    Les Skills donnent à l’agent du contexte, des contraintes et des indications étape par étape pour
    utiliser efficacement les outils. Les Skills vivent dans votre espace de travail, dans des dossiers partagés,
    ou sont inclus dans des plugins.

    [Référence Skills](/fr/tools/skills) | [Créer des Skills](/fr/tools/creating-skills)

  </Step>

  <Step title="Les plugins emballent le tout">
    Un plugin est un package qui peut enregistrer n’importe quelle combinaison de fonctionnalités :
    canaux, fournisseurs de modèles, outils, Skills, parole, transcription en temps réel,
    voix en temps réel, compréhension des médias, génération d’images, génération vidéo,
    récupération web, recherche web, etc. Certains plugins sont **core** (livrés avec
    OpenClaw), d’autres sont **externes** (publiés sur npm par la communauté).

    [Installer et configurer des plugins](/fr/tools/plugin) | [Créez le vôtre](/fr/plugins/building-plugins)

  </Step>
</Steps>

## Outils intégrés

Ces outils sont fournis avec OpenClaw et sont disponibles sans installer de plugins :

| Outil                                      | Ce qu’il fait                                                       | Page                                                         |
| ------------------------------------------ | ------------------------------------------------------------------- | ------------------------------------------------------------ |
| `exec` / `process`                         | Exécuter des commandes shell, gérer des processus d’arrière-plan    | [Exec](/fr/tools/exec), [Approbations Exec](/fr/tools/exec-approvals) |
| `code_execution`                           | Exécuter une analyse Python distante sandboxée                      | [Code Execution](/fr/tools/code-execution)                      |
| `browser`                                  | Contrôler un navigateur Chromium (navigation, clic, capture d’écran) | [Browser](/fr/tools/browser)                                    |
| `web_search` / `x_search` / `web_fetch`    | Rechercher sur le web, rechercher des posts X, récupérer le contenu d’une page | [Web](/fr/tools/web), [Web Fetch](/fr/tools/web-fetch)     |
| `read` / `write` / `edit`                  | E/S de fichiers dans l’espace de travail                            |                                                              |
| `apply_patch`                              | Patches de fichiers multi-segments                                  | [Apply Patch](/fr/tools/apply-patch)                            |
| `message`                                  | Envoyer des messages sur tous les canaux                            | [Agent Send](/fr/tools/agent-send)                              |
| `canvas`                                   | Piloter le Canvas du nœud (present, eval, snapshot)                 |                                                              |
| `nodes`                                    | Découvrir et cibler les appareils appairés                          |                                                              |
| `cron` / `gateway`                         | Gérer les tâches planifiées ; inspecter, corriger, redémarrer ou mettre à jour la gateway |                                                              |
| `image` / `image_generate`                 | Analyser ou générer des images                                      | [Génération d’images](/fr/tools/image-generation)               |
| `music_generate`                           | Générer des pistes musicales                                        | [Génération musicale](/fr/tools/music-generation)               |
| `video_generate`                           | Générer des vidéos                                                  | [Génération vidéo](/fr/tools/video-generation)                  |
| `tts`                                      | Conversion texte-vers-parole ponctuelle                             | [TTS](/fr/tools/tts)                                            |
| `sessions_*` / `subagents` / `agents_list` | Gestion de session, état et orchestration de sous-agents            | [Sous-agents](/fr/tools/subagents)                              |
| `session_status`                           | Relecture légère de type `/status` et remplacement de modèle par session | [Outils de session](/fr/concepts/session-tool)            |

Pour le travail sur les images, utilisez `image` pour l’analyse et `image_generate` pour la génération ou l’édition. Si vous ciblez `openai/*`, `google/*`, `fal/*` ou un autre fournisseur d’images non par défaut, configurez d’abord l’authentification/la clé API de ce fournisseur.

Pour le travail musical, utilisez `music_generate`. Si vous ciblez `google/*`, `minimax/*` ou un autre fournisseur musical non par défaut, configurez d’abord l’authentification/la clé API de ce fournisseur.

Pour le travail vidéo, utilisez `video_generate`. Si vous ciblez `qwen/*` ou un autre fournisseur vidéo non par défaut, configurez d’abord l’authentification/la clé API de ce fournisseur.

Pour la génération audio pilotée par workflow, utilisez `music_generate` lorsqu’un plugin tel que
ComfyUI l’enregistre. Cela est distinct de `tts`, qui est du texte-vers-parole.

`session_status` est l’outil léger d’état/relecture du groupe sessions.
Il répond à des questions de type `/status` sur la session courante et peut
éventuellement définir un remplacement de modèle par session ; `model=default` efface ce
remplacement. Comme `/status`, il peut rétroremplir des compteurs clairsemés de tokens/cache et l’étiquette du modèle runtime actif à partir de la dernière entrée d’usage de la transcription.

`gateway` est l’outil runtime réservé au propriétaire pour les opérations de gateway :

- `config.schema.lookup` pour un sous-arbre de configuration limité à un chemin avant les modifications
- `config.get` pour l’instantané de configuration actuel + hash
- `config.patch` pour les mises à jour partielles de configuration avec redémarrage
- `config.apply` uniquement pour le remplacement complet de la configuration
- `update.run` pour l’auto-mise à jour explicite + redémarrage

Pour les modifications partielles, préférez `config.schema.lookup` puis `config.patch`. Utilisez
`config.apply` uniquement lorsque vous remplacez intentionnellement toute la configuration.
L’outil refuse aussi de modifier `tools.exec.ask` ou `tools.exec.security` ;
les anciens alias `tools.bash.*` se normalisent vers les mêmes chemins Exec protégés.

### Outils fournis par des plugins

Les plugins peuvent enregistrer des outils supplémentaires. Quelques exemples :

- [Diffs](/fr/tools/diffs) — visualiseur et moteur de rendu de diff
- [LLM Task](/fr/tools/llm-task) — étape LLM JSON-only pour une sortie structurée
- [Lobster](/fr/tools/lobster) — runtime de workflow typé avec approbations reprenables
- [Music Generation](/fr/tools/music-generation) — outil partagé `music_generate` avec fournisseurs soutenus par des workflows
- [OpenProse](/fr/prose) — orchestration de workflow markdown-first
- [Tokenjuice](/fr/tools/tokenjuice) — compacte les résultats bruyants des outils `exec` et `bash`

## Configuration des outils

### Listes d’autorisations et de refus

Contrôlez quels outils l’agent peut appeler via `tools.allow` / `tools.deny` dans la
configuration. Le refus l’emporte toujours sur l’autorisation.

```json5
{
  tools: {
    allow: ["group:fs", "browser", "web_search"],
    deny: ["exec"],
  },
}
```

OpenClaw échoue en mode fermé lorsqu’une liste d’autorisations explicite ne se résout en aucun outil appelable.
Par exemple, `tools.allow: ["query_db"]` ne fonctionne que si un plugin chargé
enregistre réellement `query_db`. Si aucun outil intégré, outil de plugin ou outil MCP inclus ne correspond à la
liste d’autorisations, l’exécution s’arrête avant l’appel du modèle au lieu de continuer comme une exécution
texte uniquement qui pourrait halluciner des résultats d’outil.

### Profils d’outils

`tools.profile` définit une liste d’autorisations de base avant l’application de `allow`/`deny`.
Remplacement par agent : `agents.list[].tools.profile`.

| Profil      | Ce qu’il inclut                                                                                                                                   |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `full`      | Aucune restriction (équivalent à non défini)                                                                                                      |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `music_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                                        |
| `minimal`   | `session_status` uniquement                                                                                                                       |

Les profils `coding` et `messaging` autorisent aussi les outils MCP inclus configurés
sous la clé de plugin `bundle-mcp`. Ajoutez `tools.deny: ["bundle-mcp"]` lorsque vous
voulez qu’un profil conserve ses outils intégrés normaux mais masque tous les outils MCP configurés.
Le profil `minimal` n’inclut pas les outils MCP inclus.

### Groupes d’outils

Utilisez les raccourcis `group:*` dans les listes d’autorisations/de refus :

| Groupe             | Outils                                                                                                      |
| ------------------ | ----------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | exec, process, code_execution (`bash` est accepté comme alias de `exec`)                                    |
| `group:fs`         | read, write, edit, apply_patch                                                                              |
| `group:sessions`   | sessions_list, sessions_history, sessions_send, sessions_spawn, sessions_yield, subagents, session_status  |
| `group:memory`     | memory_search, memory_get                                                                                   |
| `group:web`        | web_search, x_search, web_fetch                                                                             |
| `group:ui`         | browser, canvas                                                                                             |
| `group:automation` | cron, gateway                                                                                               |
| `group:messaging`  | message                                                                                                     |
| `group:nodes`      | nodes                                                                                                       |
| `group:agents`     | agents_list                                                                                                 |
| `group:media`      | image, image_generate, music_generate, video_generate, tts                                                  |
| `group:openclaw`   | Tous les outils OpenClaw intégrés (exclut les outils de plugin)                                             |

`sessions_history` renvoie une vue de rappel bornée et filtrée pour la sécurité. Il retire
les balises de réflexion, l’échafaudage `<relevant-memories>`, les payloads XML d’appel d’outil en texte brut
(y compris `<tool_call>...</tool_call>`,
`<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
`<function_calls>...</function_calls>`, et les blocs d’appel d’outil tronqués),
l’échafaudage d’appel d’outil dégradé, les jetons de contrôle de modèle ASCII/full-width
fuités, et le XML d’appel d’outil MiniMax mal formé depuis le texte de l’assistant, puis applique
la rédaction/troncature et d’éventuels espaces réservés de lignes surdimensionnées au lieu d’agir
comme un dump brut de transcription.

### Restrictions spécifiques au fournisseur

Utilisez `tools.byProvider` pour restreindre les outils pour des fournisseurs spécifiques sans
modifier les valeurs globales par défaut :

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
