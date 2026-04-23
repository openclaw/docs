---
read_when:
    - Vous souhaitez comprendre quels outils OpenClaw fournit
    - Vous devez configurer, autoriser ou refuser des outils
    - Vous choisissez entre les outils intégrés, les Skills et les plugins
summary: 'Vue d’ensemble des outils et plugins OpenClaw : ce que l’agent peut faire et comment l’étendre'
title: Outils et plugins
x-i18n:
    generated_at: "2026-04-23T07:11:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: ef0975c567b0bca0e991a0445d3db4a00fe2e2cf91b9e6bea5686825deac91a0
    source_path: tools/index.md
    workflow: 15
---

# Outils et plugins

Tout ce que l’agent fait au-delà de la génération de texte passe par des **outils**.
Les outils sont la manière dont l’agent lit des fichiers, exécute des commandes, navigue sur le web, envoie
des messages et interagit avec des appareils.

## Outils, Skills et plugins

OpenClaw a trois couches qui fonctionnent ensemble :

<Steps>
  <Step title="Les outils sont ce que l’agent appelle">
    Un outil est une fonction typée que l’agent peut invoquer (par ex. `exec`, `browser`,
    `web_search`, `message`). OpenClaw fournit un ensemble d’**outils intégrés** et
    les plugins peuvent en enregistrer d’autres.

    L’agent voit les outils comme des définitions de fonctions structurées envoyées à l’API du modèle.

  </Step>

  <Step title="Les Skills apprennent à l’agent quand et comment">
    Un Skill est un fichier Markdown (`SKILL.md`) injecté dans le prompt système.
    Les Skills donnent à l’agent du contexte, des contraintes et des indications pas à pas pour
    utiliser efficacement les outils. Les Skills se trouvent dans votre espace de travail, dans des dossiers partagés,
    ou sont fournis dans des plugins.

    [Référence Skills](/fr/tools/skills) | [Créer des Skills](/fr/tools/creating-skills)

  </Step>

  <Step title="Les plugins regroupent le tout">
    Un plugin est un package qui peut enregistrer n’importe quelle combinaison de capacités :
    canaux, fournisseurs de modèles, outils, Skills, parole, transcription temps réel,
    voix temps réel, compréhension des médias, génération d’images, génération de vidéo,
    fetch web, recherche web, etc. Certains plugins sont **core** (fournis avec
    OpenClaw), d’autres sont **externes** (publiés sur npm par la communauté).

    [Installer et configurer des plugins](/fr/tools/plugin) | [Créer le vôtre](/fr/plugins/building-plugins)

  </Step>
</Steps>

## Outils intégrés

Ces outils sont fournis avec OpenClaw et sont disponibles sans installer de plugins :

| Outil                                      | Ce qu’il fait                                                        | Page                                                         |
| ------------------------------------------ | -------------------------------------------------------------------- | ------------------------------------------------------------ |
| `exec` / `process`                         | Exécuter des commandes shell, gérer des processus en arrière-plan    | [Exec](/fr/tools/exec), [Approbations Exec](/fr/tools/exec-approvals) |
| `code_execution`                           | Exécuter une analyse Python distante en sandbox                      | [Code Execution](/fr/tools/code-execution)                      |
| `browser`                                  | Contrôler un navigateur Chromium (naviguer, cliquer, capture d’écran) | [Browser](/fr/tools/browser)                                    |
| `web_search` / `x_search` / `web_fetch`    | Rechercher sur le web, rechercher des posts X, récupérer le contenu d’une page | [Web](/fr/tools/web), [Web Fetch](/fr/tools/web-fetch)             |
| `read` / `write` / `edit`                  | Entrées/sorties de fichiers dans l’espace de travail                 |                                                              |
| `apply_patch`                              | Correctifs de fichiers multi-blocs                                   | [Apply Patch](/fr/tools/apply-patch)                            |
| `message`                                  | Envoyer des messages sur tous les canaux                             | [Agent Send](/fr/tools/agent-send)                              |
| `canvas`                                   | Piloter le Canvas du Node (present, eval, snapshot)                  |                                                              |
| `nodes`                                    | Découvrir et cibler les appareils appairés                           |                                                              |
| `cron` / `gateway`                         | Gérer les tâches planifiées ; inspecter, corriger, redémarrer ou mettre à jour le gateway |                                                              |
| `image` / `image_generate`                 | Analyser ou générer des images                                       | [Image Generation](/fr/tools/image-generation)                  |
| `music_generate`                           | Générer des pistes musicales                                         | [Music Generation](/fr/tools/music-generation)                  |
| `video_generate`                           | Générer des vidéos                                                   | [Video Generation](/fr/tools/video-generation)                  |
| `tts`                                      | Conversion texte-vers-parole en une fois                             | [TTS](/fr/tools/tts)                                            |
| `sessions_*` / `subagents` / `agents_list` | Gestion de session, état et orchestration de sous-agents             | [Sub-agents](/fr/tools/subagents)                               |
| `session_status`                           | Lecture légère de type `/status` et surcharge du modèle de session   | [Session Tools](/fr/concepts/session-tool)                      |

Pour le travail sur les images, utilisez `image` pour l’analyse et `image_generate` pour la génération ou l’édition. Si vous ciblez `openai/*`, `google/*`, `fal/*` ou un autre fournisseur d’images non par défaut, configurez d’abord l’authentification/la clé API de ce fournisseur.

Pour le travail musical, utilisez `music_generate`. Si vous ciblez `google/*`, `minimax/*` ou un autre fournisseur musical non par défaut, configurez d’abord l’authentification/la clé API de ce fournisseur.

Pour le travail vidéo, utilisez `video_generate`. Si vous ciblez `qwen/*` ou un autre fournisseur vidéo non par défaut, configurez d’abord l’authentification/la clé API de ce fournisseur.

Pour la génération audio pilotée par workflow, utilisez `music_generate` lorsqu’un plugin tel que
ComfyUI l’enregistre. Cela est distinct de `tts`, qui correspond au texte-vers-parole.

`session_status` est l’outil léger d’état/lecture dans le groupe des sessions.
Il répond aux questions de type `/status` sur la session en cours et peut
éventuellement définir une surcharge de modèle par session ; `model=default` efface cette
surcharge. Comme `/status`, il peut compléter les compteurs clairsemés de tokens/cache et le
libellé du modèle d’exécution actif à partir de la dernière entrée d’usage de transcription.

`gateway` est l’outil d’exécution réservé au propriétaire pour les opérations du Gateway :

- `config.schema.lookup` pour un sous-arbre de configuration limité à un chemin avant modifications
- `config.get` pour l’instantané de configuration actuel + hash
- `config.patch` pour des mises à jour partielles de la configuration avec redémarrage
- `config.apply` uniquement pour le remplacement complet de la configuration
- `update.run` pour une auto-mise à jour explicite + redémarrage

Pour les changements partiels, préférez `config.schema.lookup` puis `config.patch`. Utilisez
`config.apply` uniquement lorsque vous remplacez intentionnellement toute la configuration.
L’outil refuse aussi de modifier `tools.exec.ask` ou `tools.exec.security` ;
les anciens alias `tools.bash.*` sont normalisés vers les mêmes chemins exec protégés.

### Outils fournis par des plugins

Les plugins peuvent enregistrer des outils supplémentaires. Quelques exemples :

- [Diffs](/fr/tools/diffs) — visualiseur et moteur de rendu de diff
- [LLM Task](/fr/tools/llm-task) — étape LLM JSON-only pour une sortie structurée
- [Lobster](/fr/tools/lobster) — runtime de workflow typé avec approbations reprenables
- [Music Generation](/fr/tools/music-generation) — outil `music_generate` partagé avec des fournisseurs adossés à un workflow
- [OpenProse](/fr/prose) — orchestration de workflow Markdown-first
- [Tokenjuice](/fr/tools/tokenjuice) — compacte les résultats bruyants des outils `exec` et `bash`

## Configuration des outils

### Listes d’autorisation et de refus

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

### Profils d’outils

`tools.profile` définit une liste d’autorisation de base avant l’application de `allow`/`deny`.
Surcharge par agent : `agents.list[].tools.profile`.

| Profil      | Ce qu’il inclut                                                                                                                                  |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `full`      | Aucune restriction (équivalent à non défini)                                                                                                     |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `music_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                                        |
| `minimal`   | `session_status` uniquement                                                                                                                      |

Les profils `coding` et `messaging` autorisent aussi les outils MCP de bundle configurés
sous la clé de plugin `bundle-mcp`. Ajoutez `tools.deny: ["bundle-mcp"]` lorsque vous
voulez qu’un profil conserve ses outils intégrés normaux tout en masquant tous les outils MCP configurés.
Le profil `minimal` n’inclut pas les outils MCP de bundle.

### Groupes d’outils

Utilisez les raccourcis `group:*` dans les listes d’autorisation/de refus :

| Groupe             | Outils                                                                                                    |
| ------------------ | --------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | exec, process, code_execution (`bash` est accepté comme alias de `exec`)                                  |
| `group:fs`         | read, write, edit, apply_patch                                                                            |
| `group:sessions`   | sessions_list, sessions_history, sessions_send, sessions_spawn, sessions_yield, subagents, session_status |
| `group:memory`     | memory_search, memory_get                                                                                 |
| `group:web`        | web_search, x_search, web_fetch                                                                           |
| `group:ui`         | browser, canvas                                                                                           |
| `group:automation` | cron, gateway                                                                                             |
| `group:messaging`  | message                                                                                                   |
| `group:nodes`      | nodes                                                                                                     |
| `group:agents`     | agents_list                                                                                               |
| `group:media`      | image, image_generate, music_generate, video_generate, tts                                                |
| `group:openclaw`   | Tous les outils OpenClaw intégrés (exclut les outils de plugin)                                           |

`sessions_history` renvoie une vue de rappel bornée et filtrée pour la sécurité. Elle retire les
balises de réflexion, l’échafaudage `<relevant-memories>`, les charges utiles XML d’appel d’outil en texte brut
(y compris `<tool_call>...</tool_call>`,
`<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
`<function_calls>...</function_calls>`, et les blocs d’appel d’outil tronqués),
l’échafaudage dégradé d’appel d’outil, les tokens de contrôle de modèle ASCII/full-width divulgués
et le XML mal formé d’appel d’outil MiniMax du texte assistant, puis applique
la rédaction/troncature et d’éventuels espaces réservés pour lignes surdimensionnées au lieu d’agir
comme un dump brut de transcription.

### Restrictions spécifiques au fournisseur

Utilisez `tools.byProvider` pour limiter les outils pour des fournisseurs spécifiques sans
modifier les valeurs globales par défaut :

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
