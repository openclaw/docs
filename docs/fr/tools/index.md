---
read_when:
    - Vous souhaitez comprendre quels outils OpenClaw fournit
    - Vous devez configurer, autoriser ou refuser des outils
    - Vous choisissez entre les outils intégrés, les Skills et les Plugins
summary: 'Présentation des outils et des plugins OpenClaw : ce que l’agent peut faire et comment l’étendre'
title: Outils et plugins
x-i18n:
    generated_at: "2026-04-30T07:52:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 62cde740188c224af03b4425c7f6dfca9a12f95603066db5925724fc6a07dcf0
    source_path: tools/index.md
    workflow: 16
---

Tout ce que l’agent fait au-delà de la génération de texte passe par des **outils**.
Les outils permettent à l’agent de lire des fichiers, d’exécuter des commandes, de parcourir le web, d’envoyer
des messages et d’interagir avec des appareils.

## Outils, Skills et plugins

OpenClaw comporte trois couches qui fonctionnent ensemble :

<Steps>
  <Step title="Les outils sont ce que l’agent appelle">
    Un outil est une fonction typée que l’agent peut invoquer (par exemple `exec`, `browser`,
    `web_search`, `message`). OpenClaw fournit un ensemble d’**outils intégrés** et
    les plugins peuvent en enregistrer d’autres.

    L’agent voit les outils comme des définitions de fonctions structurées envoyées à l’API du modèle.

  </Step>

  <Step title="Les Skills enseignent à l’agent quand et comment agir">
    Une Skill est un fichier markdown (`SKILL.md`) injecté dans le prompt système.
    Les Skills fournissent à l’agent du contexte, des contraintes et des instructions étape par étape pour
    utiliser efficacement les outils. Les Skills se trouvent dans votre espace de travail, dans des dossiers partagés,
    ou sont fournies dans des plugins.

    [Référence des Skills](/fr/tools/skills) | [Création de Skills](/fr/tools/creating-skills)

  </Step>

  <Step title="Les plugins regroupent tout">
    Un plugin est un package qui peut enregistrer n’importe quelle combinaison de capacités :
    canaux, fournisseurs de modèles, outils, Skills, parole, transcription en temps réel,
    voix en temps réel, compréhension des médias, génération d’images, génération vidéo,
    récupération web, recherche web, et plus encore. Certains plugins sont **core** (fournis avec
    OpenClaw), d’autres sont **externes** (publiés sur npm par la communauté).

    [Installer et configurer des plugins](/fr/tools/plugin) | [Créer le vôtre](/fr/plugins/building-plugins)

  </Step>
</Steps>

## Outils intégrés

Ces outils sont fournis avec OpenClaw et sont disponibles sans installer de plugins :

| Outil                                      | Ce qu’il fait                                                        | Page                                                         |
| ------------------------------------------ | --------------------------------------------------------------------- | ------------------------------------------------------------ |
| `exec` / `process`                         | Exécuter des commandes shell, gérer des processus en arrière-plan     | [Exec](/fr/tools/exec), [Approbations Exec](/fr/tools/exec-approvals) |
| `code_execution`                           | Exécuter une analyse Python distante en bac à sable                   | [Exécution de code](/fr/tools/code-execution)                   |
| `browser`                                  | Contrôler un navigateur Chromium (naviguer, cliquer, capture d’écran) | [Navigateur](/fr/tools/browser)                                 |
| `web_search` / `x_search` / `web_fetch`    | Rechercher sur le web, rechercher des publications X, récupérer le contenu d’une page | [Web](/fr/tools/web), [Récupération web](/fr/tools/web-fetch)      |
| `read` / `write` / `edit`                  | Entrée/sortie de fichiers dans l’espace de travail                   |                                                              |
| `apply_patch`                              | Correctifs de fichiers à plusieurs blocs                              | [Appliquer un correctif](/fr/tools/apply-patch)                 |
| `message`                                  | Envoyer des messages sur tous les canaux                              | [Envoi par l’agent](/fr/tools/agent-send)                       |
| `canvas`                                   | Piloter Canvas Node (présenter, évaluer, instantané)                  |                                                              |
| `nodes`                                    | Découvrir et cibler des appareils appairés                            |                                                              |
| `cron` / `gateway`                         | Gérer des tâches planifiées ; inspecter, corriger, redémarrer ou mettre à jour le Gateway |                                                              |
| `image` / `image_generate`                 | Analyser ou générer des images                                        | [Génération d’images](/fr/tools/image-generation)               |
| `music_generate`                           | Générer des pistes musicales                                          | [Génération musicale](/fr/tools/music-generation)               |
| `video_generate`                           | Générer des vidéos                                                    | [Génération vidéo](/fr/tools/video-generation)                  |
| `tts`                                      | Conversion ponctuelle de texte en parole                              | [TTS](/fr/tools/tts)                                            |
| `sessions_*` / `subagents` / `agents_list` | Gestion des sessions, état et orchestration de sous-agents            | [Sous-agents](/fr/tools/subagents)                              |
| `session_status`                           | Retour d’état léger de style `/status` et surcharge du modèle de session | [Outils de session](/fr/concepts/session-tool)                  |

Pour le travail sur les images, utilisez `image` pour l’analyse et `image_generate` pour la génération ou l’édition. Si vous ciblez `openai/*`, `google/*`, `fal/*` ou un autre fournisseur d’images non par défaut, configurez d’abord l’authentification/la clé API de ce fournisseur.

Pour le travail sur la musique, utilisez `music_generate`. Si vous ciblez `google/*`, `minimax/*` ou un autre fournisseur de musique non par défaut, configurez d’abord l’authentification/la clé API de ce fournisseur.

Pour le travail sur la vidéo, utilisez `video_generate`. Si vous ciblez `qwen/*` ou un autre fournisseur vidéo non par défaut, configurez d’abord l’authentification/la clé API de ce fournisseur.

Pour la génération audio pilotée par workflow, utilisez `music_generate` lorsqu’un plugin comme
ComfyUI l’enregistre. C’est distinct de `tts`, qui correspond au texte vers parole.

`session_status` est l’outil léger d’état/retour d’information du groupe sessions.
Il répond aux questions de style `/status` sur la session actuelle et peut
facultativement définir une surcharge de modèle par session ; `model=default` efface cette
surcharge. Comme `/status`, il peut compléter des compteurs de tokens/cache clairsemés et le
libellé du modèle d’exécution actif à partir de la dernière entrée d’utilisation de la transcription.

`gateway` est l’outil d’exécution réservé au propriétaire pour les opérations du Gateway :

- `config.schema.lookup` pour un sous-arbre de configuration limité à un chemin avant les modifications
- `config.get` pour l’instantané de configuration actuel + hachage
- `config.patch` pour des mises à jour partielles de configuration avec redémarrage
- `config.apply` uniquement pour le remplacement complet de la configuration
- `update.run` pour une mise à jour automatique explicite + redémarrage

Pour les changements partiels, préférez `config.schema.lookup` puis `config.patch`. Utilisez
`config.apply` uniquement lorsque vous remplacez intentionnellement toute la configuration.
Pour une documentation de configuration plus large, lisez [Configuration](/fr/gateway/configuration) et
[Référence de configuration](/fr/gateway/configuration-reference).
L’outil refuse également de modifier `tools.exec.ask` ou `tools.exec.security` ;
les alias hérités `tools.bash.*` sont normalisés vers les mêmes chemins exec protégés.

### Outils fournis par les plugins

Les plugins peuvent enregistrer des outils supplémentaires. Quelques exemples :

- [Diffs](/fr/tools/diffs) — visionneuse et moteur de rendu de diffs
- [Tâche LLM](/fr/tools/llm-task) — étape LLM en JSON uniquement pour sortie structurée
- [Lobster](/fr/tools/lobster) — runtime de workflow typé avec approbations reprenables
- [Génération musicale](/fr/tools/music-generation) — outil `music_generate` partagé avec fournisseurs adossés à des workflows
- [OpenProse](/fr/prose) — orchestration de workflows centrée sur markdown
- [Tokenjuice](/fr/tools/tokenjuice) — compacter les résultats bruyants des outils `exec` et `bash`

## Configuration des outils

### Listes d’autorisation et de refus

Contrôlez les outils que l’agent peut appeler via `tools.allow` / `tools.deny` dans la
configuration. Le refus prévaut toujours sur l’autorisation.

```json5
{
  tools: {
    allow: ["group:fs", "browser", "web_search"],
    deny: ["exec"],
  },
}
```

OpenClaw échoue de manière fermée lorsqu’une liste d’autorisation explicite ne résout aucun outil appelable.
Par exemple, `tools.allow: ["query_db"]` ne fonctionne que si un plugin chargé enregistre réellement
`query_db`. Si aucun outil intégré, plugin ou MCP groupé ne correspond à la
liste d’autorisation, l’exécution s’arrête avant l’appel au modèle au lieu de continuer comme une
exécution texte uniquement susceptible d’halluciner des résultats d’outils.

### Profils d’outils

`tools.profile` définit une liste d’autorisation de base avant l’application de `allow`/`deny`.
Surcharge par agent : `agents.list[].tools.profile`.

| Profil      | Ce qu’il inclut                                                                                                                                   |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `full`      | Base sans restriction pour un accès élargi aux commandes/contrôles ; identique au fait de laisser `tools.profile` non défini                      |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `music_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                                         |
| `minimal`   | `session_status` uniquement                                                                                                                       |

<Note>
`tools.profile: "messaging"` est volontairement étroit pour les agents centrés sur les canaux.
Il exclut les outils de commande/contrôle plus larges comme le système de fichiers, le runtime,
le navigateur, canvas, nodes, cron et le contrôle du Gateway. Utilisez `tools.profile: "full"`
comme base sans restriction pour un accès plus large aux commandes/contrôles, puis réduisez
l’accès avec `tools.allow` / `tools.deny` si nécessaire.
</Note>

`coding` inclut des outils web légers (`web_search`, `web_fetch`, `x_search`)
mais pas l’outil complet de contrôle du navigateur. L’automatisation de navigateur peut piloter de vraies
sessions et des profils connectés, ajoutez-la donc explicitement avec
`tools.alsoAllow: ["browser"]` ou par agent avec
`agents.list[].tools.alsoAllow: ["browser"]`.

Les profils `coding` et `messaging` autorisent également les outils MCP groupés configurés
sous la clé de plugin `bundle-mcp`. Ajoutez `tools.deny: ["bundle-mcp"]` lorsque vous
voulez qu’un profil conserve ses outils intégrés habituels mais masque tous les outils MCP configurés.
Le profil `minimal` n’inclut pas les outils MCP groupés.

Exemple (surface d’outils la plus large par défaut) :

```json5
{
  tools: {
    profile: "full",
  },
}
```

### Groupes d’outils

Utilisez les raccourcis `group:*` dans les listes d’autorisation/refus :

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
| `group:openclaw`   | Tous les outils intégrés d’OpenClaw (exclut les outils de Plugin)                                         |

`sessions_history` renvoie une vue de rappel bornée et filtrée pour la sécurité. Elle supprime
les balises de réflexion, l’échafaudage `<relevant-memories>`, les charges utiles XML
d’appels d’outils en texte brut (y compris `<tool_call>...</tool_call>`,
`<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
`<function_calls>...</function_calls>` et les blocs d’appels d’outils tronqués),
l’échafaudage d’appels d’outils rétrogradé, les jetons de contrôle de modèle
ASCII/pleine chasse divulgués et le XML d’appels d’outils MiniMax mal formé du texte de l’assistant, puis applique
la rédaction/troncature et, éventuellement, des espaces réservés pour les lignes surdimensionnées au lieu de servir
de vidage brut de transcription.

### Restrictions propres au fournisseur

Utilisez `tools.byProvider` pour restreindre les outils pour des fournisseurs précis sans
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
