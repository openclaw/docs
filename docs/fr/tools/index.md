---
read_when:
    - Vous souhaitez comprendre quels outils OpenClaw fournit
    - Vous devez configurer, autoriser ou refuser des outils
    - Vous hésitez entre les outils intégrés, les Skills et les plugins
summary: 'Vue d’ensemble des outils et plugins OpenClaw : ce que l’agent peut faire et comment l’étendre'
title: Outils et plugins
x-i18n:
    generated_at: "2026-04-26T11:39:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 47cc0e2de5688328f7c11fcf86c0a2262b488c277f48416f584f5c7913f750c4
    source_path: tools/index.md
    workflow: 15
---

Tout ce que l’agent fait au-delà de la génération de texte passe par des **outils**.
Les outils sont le moyen par lequel l’agent lit des fichiers, exécute des commandes, navigue sur le web, envoie des
messages et interagit avec des appareils.

## Outils, Skills et plugins

OpenClaw comporte trois couches qui fonctionnent ensemble :

<Steps>
  <Step title="Les outils sont ce que l’agent appelle">
    Un outil est une fonction typée que l’agent peut invoquer (par ex. `exec`, `browser`,
    `web_search`, `message`). OpenClaw fournit un ensemble d’**outils intégrés** et
    les plugins peuvent en enregistrer d’autres.

    L’agent voit les outils comme des définitions de fonctions structurées envoyées à l’API du modèle.

  </Step>

  <Step title="Les Skills apprennent à l’agent quand et comment">
    Un Skill est un fichier markdown (`SKILL.md`) injecté dans le prompt système.
    Les Skills donnent à l’agent du contexte, des contraintes et des conseils étape par étape pour
    utiliser efficacement les outils. Les Skills se trouvent dans votre espace de travail, dans des dossiers partagés,
    ou sont fournis avec les plugins.

    [Référence Skills](/fr/tools/skills) | [Créer des Skills](/fr/tools/creating-skills)

  </Step>

  <Step title="Les plugins regroupent le tout">
    Un plugin est un package qui peut enregistrer n’importe quelle combinaison de capacités :
    canaux, fournisseurs de modèles, outils, Skills, voix, transcription en temps réel,
    voix en temps réel, compréhension des médias, génération d’images, génération de vidéos,
    récupération web, recherche web, et plus encore. Certains plugins sont **core** (fournis avec
    OpenClaw), d’autres sont **externes** (publiés sur npm par la communauté).

    [Installer et configurer des plugins](/fr/tools/plugin) | [Créer le vôtre](/fr/plugins/building-plugins)

  </Step>
</Steps>

## Outils intégrés

Ces outils sont fournis avec OpenClaw et sont disponibles sans installer de plugins :

| Outil                                      | Ce qu’il fait                                                          | Page                                                         |
| ------------------------------------------ | ---------------------------------------------------------------------- | ------------------------------------------------------------ |
| `exec` / `process`                         | Exécuter des commandes shell, gérer des processus en arrière-plan      | [Exec](/fr/tools/exec), [Approbations Exec](/fr/tools/exec-approvals) |
| `code_execution`                           | Exécuter une analyse Python distante en sandbox                        | [Code Execution](/fr/tools/code-execution)                      |
| `browser`                                  | Contrôler un navigateur Chromium (naviguer, cliquer, capture d’écran) | [Browser](/fr/tools/browser)                                    |
| `web_search` / `x_search` / `web_fetch`    | Rechercher sur le web, rechercher dans les publications X, récupérer le contenu d’une page | [Web](/fr/tools/web), [Web Fetch](/fr/tools/web-fetch)             |
| `read` / `write` / `edit`                  | E/S de fichiers dans l’espace de travail                               |                                                              |
| `apply_patch`                              | Patches de fichiers multi-blocs                                        | [Apply Patch](/fr/tools/apply-patch)                            |
| `message`                                  | Envoyer des messages sur tous les canaux                               | [Agent Send](/fr/tools/agent-send)                              |
| `canvas`                                   | Piloter le Canvas Node (présenter, évaluer, instantané)                |                                                              |
| `nodes`                                    | Découvrir et cibler les appareils appairés                             |                                                              |
| `cron` / `gateway`                         | Gérer les tâches planifiées ; inspecter, patcher, redémarrer ou mettre à jour la Gateway |                                                              |
| `image` / `image_generate`                 | Analyser ou générer des images                                         | [Image Generation](/fr/tools/image-generation)                  |
| `music_generate`                           | Générer des pistes musicales                                           | [Music Generation](/fr/tools/music-generation)                  |
| `video_generate`                           | Générer des vidéos                                                     | [Video Generation](/fr/tools/video-generation)                  |
| `tts`                                      | Conversion ponctuelle de texte en parole                               | [TTS](/fr/tools/tts)                                            |
| `sessions_*` / `subagents` / `agents_list` | Gestion des sessions, état et orchestration de sous-agents             | [Sub-agents](/fr/tools/subagents)                               |
| `session_status`                           | Relecture légère de type `/status` et remplacement du modèle de session | [Outils de session](/fr/concepts/session-tool)                 |

Pour le travail sur les images, utilisez `image` pour l’analyse et `image_generate` pour la génération ou l’édition. Si vous ciblez `openai/*`, `google/*`, `fal/*` ou un autre fournisseur d’images non par défaut, configurez d’abord l’authentification/la clé API de ce fournisseur.

Pour le travail sur la musique, utilisez `music_generate`. Si vous ciblez `google/*`, `minimax/*` ou un autre fournisseur de musique non par défaut, configurez d’abord l’authentification/la clé API de ce fournisseur.

Pour le travail sur la vidéo, utilisez `video_generate`. Si vous ciblez `qwen/*` ou un autre fournisseur vidéo non par défaut, configurez d’abord l’authentification/la clé API de ce fournisseur.

Pour la génération audio pilotée par workflow, utilisez `music_generate` lorsqu’un plugin tel que
ComfyUI l’enregistre. Cela est distinct de `tts`, qui est la synthèse vocale.

`session_status` est l’outil léger de statut/relecture du groupe des sessions.
Il répond aux questions de type `/status` sur la session en cours et peut
facultativement définir un remplacement de modèle par session ; `model=default` efface ce
remplacement. Comme `/status`, il peut compléter les compteurs clairsemés de jetons/cache et le
libellé du modèle d’exécution actif à partir de la dernière entrée d’usage du transcript.

`gateway` est l’outil d’exécution réservé au propriétaire pour les opérations Gateway :

- `config.schema.lookup` pour un sous-arbre de configuration limité à un chemin avant modifications
- `config.get` pour l’instantané de configuration courant + hash
- `config.patch` pour des mises à jour partielles de configuration avec redémarrage
- `config.apply` uniquement pour le remplacement complet de la configuration
- `update.run` pour une auto-mise à jour explicite + redémarrage

Pour les modifications partielles, préférez `config.schema.lookup` puis `config.patch`. Utilisez
`config.apply` uniquement lorsque vous remplacez intentionnellement toute la configuration.
Pour une documentation plus large sur la configuration, consultez [Configuration](/fr/gateway/configuration) et
[Référence de configuration](/fr/gateway/configuration-reference).
L’outil refuse aussi de modifier `tools.exec.ask` ou `tools.exec.security` ;
les alias hérités `tools.bash.*` sont normalisés vers les mêmes chemins exec protégés.

### Outils fournis par les plugins

Les plugins peuvent enregistrer des outils supplémentaires. Quelques exemples :

- [Diffs](/fr/tools/diffs) — visionneuse et moteur de rendu de diff
- [LLM Task](/fr/tools/llm-task) — étape LLM en JSON uniquement pour une sortie structurée
- [Lobster](/fr/tools/lobster) — runtime de workflow typé avec approbations reprenables
- [Music Generation](/fr/tools/music-generation) — outil `music_generate` partagé avec des fournisseurs adossés à des workflows
- [OpenProse](/fr/prose) — orchestration de workflows orientée Markdown
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

OpenClaw échoue en mode fermé lorsqu’une allowlist explicite ne se résout vers aucun outil appelable.
Par exemple, `tools.allow: ["query_db"]` ne fonctionne que si un plugin chargé
enregistre réellement `query_db`. Si aucun outil intégré, plugin ou MCP intégré ne correspond à
l’allowlist, l’exécution s’arrête avant l’appel au modèle au lieu de continuer comme une exécution
texte seul qui pourrait halluciner des résultats d’outils.

### Profils d’outils

`tools.profile` définit une allowlist de base avant l’application de `allow`/`deny`.
Remplacement par agent : `agents.list[].tools.profile`.

| Profil      | Ce qu’il inclut                                                                                                                                  |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `full`      | Aucune restriction (équivalent à non défini)                                                                                                     |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `music_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                                       |
| `minimal`   | `session_status` uniquement                                                                                                                      |

`coding` inclut les outils web légers (`web_search`, `web_fetch`, `x_search`)
mais pas l’outil complet de contrôle du navigateur. L’automatisation du navigateur peut piloter de vraies
sessions et des profils connectés ; ajoutez-le donc explicitement avec
`tools.alsoAllow: ["browser"]` ou un paramètre par agent
`agents.list[].tools.alsoAllow: ["browser"]`.

Les profils `coding` et `messaging` autorisent aussi les outils MCP groupés configurés
sous la clé de plugin `bundle-mcp`. Ajoutez `tools.deny: ["bundle-mcp"]` lorsque vous
souhaitez qu’un profil conserve ses outils intégrés normaux mais masque tous les outils MCP configurés.
Le profil `minimal` n’inclut pas les outils MCP groupés.

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

`sessions_history` renvoie une vue de rappel bornée et filtrée pour la sécurité. Il supprime
les balises de réflexion, l’échafaudage `<relevant-memories>`, les charges utiles XML d’appel d’outil en texte brut
(y compris `<tool_call>...</tool_call>`,
`<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
`<function_calls>...</function_calls>`, et les blocs d’appel d’outil tronqués),
l’échafaudage d’appel d’outil rétrogradé, les jetons de contrôle de modèle ASCII/full-width divulgués,
et le XML d’appel d’outil MiniMax mal formé du texte de l’assistant, puis applique
la rédaction/troncature et d’éventuels placeholders de ligne surdimensionnée au lieu d’agir
comme un dump brut du transcript.

### Restrictions spécifiques au fournisseur

Utilisez `tools.byProvider` pour restreindre les outils à des fournisseurs spécifiques sans
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
