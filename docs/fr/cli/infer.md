---
read_when:
    - Ajouter ou modifier des commandes `openclaw infer`
    - Concevoir une automatisation de capacités headless stable
summary: CLI à inférence d’abord pour les workflows de modèle, image, audio, TTS, vidéo, Web et embeddings adossés à un fournisseur
title: CLI Inference
x-i18n:
    generated_at: "2026-04-26T11:26:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: bf07b306d80535b58d811aa33c0bbe2ecac57b22c3ab27f6f2ae6518ceb21e49
    source_path: cli/infer.md
    workflow: 15
---

`openclaw infer` est la surface headless canonique pour les workflows d’inférence adossés à un fournisseur.

Il expose intentionnellement des familles de capacités, et non des noms RPC bruts de Gateway ni des identifiants bruts d’outils d’agent.

## Transformer infer en skill

Copiez-collez ceci dans un agent :

```text
Read https://docs.openclaw.ai/cli/infer, then create a skill that routes my common workflows to `openclaw infer`.
Focus on model runs, image generation, video generation, audio transcription, TTS, web search, and embeddings.
```

Un bon skill basé sur infer doit :

- associer les intentions utilisateur courantes à la bonne sous-commande infer
- inclure quelques exemples infer canoniques pour les workflows qu’il couvre
- préférer `openclaw infer ...` dans les exemples et suggestions
- éviter de redocumenter toute la surface infer dans le corps du skill

Couverture typique d’un skill centré sur infer :

- `openclaw infer model run`
- `openclaw infer image generate`
- `openclaw infer audio transcribe`
- `openclaw infer tts convert`
- `openclaw infer web search`
- `openclaw infer embedding create`

## Pourquoi utiliser infer

`openclaw infer` fournit un CLI cohérent pour les tâches d’inférence adossées à un fournisseur dans OpenClaw.

Avantages :

- Utiliser les fournisseurs et modèles déjà configurés dans OpenClaw au lieu de câbler des wrappers ponctuels pour chaque backend.
- Garder les workflows de modèle, image, transcription audio, TTS, vidéo, Web et embeddings sous un seul arbre de commandes.
- Utiliser une forme de sortie `--json` stable pour les scripts, l’automatisation et les workflows pilotés par agent.
- Préférer une surface OpenClaw de première partie lorsque la tâche consiste fondamentalement à « exécuter une inférence ».
- Utiliser le chemin local normal sans nécessiter la gateway pour la plupart des commandes infer.

Pour les vérifications de fournisseur de bout en bout, préférez `openclaw infer ...` une fois que les tests de fournisseur de niveau inférieur sont au vert. Cela exerce le CLI livré, le chargement de configuration, la résolution de l’agent par défaut, l’activation des plugins intégrés, la réparation des dépendances d’exécution et l’environnement d’exécution partagé des capacités avant que la requête fournisseur ne soit effectuée.

## Arbre de commandes

```text
 openclaw infer
  list
  inspect

  model
    run
    list
    inspect
    providers
    auth login
    auth logout
    auth status

  image
    generate
    edit
    describe
    describe-many
    providers

  audio
    transcribe
    providers

  tts
    convert
    voices
    providers
    status
    enable
    disable
    set-provider

  video
    generate
    describe
    providers

  web
    search
    fetch
    providers

  embedding
    create
    providers
```

## Tâches courantes

Ce tableau associe les tâches d’inférence courantes à la commande infer correspondante.

| Tâche                    | Commande                                                               | Remarques                                             |
| ------------------------ | ---------------------------------------------------------------------- | ----------------------------------------------------- |
| Exécuter un prompt texte/modèle | `openclaw infer model run --prompt "..." --json`                | Utilise le chemin local normal par défaut             |
| Générer une image        | `openclaw infer image generate --prompt "..." --json`                  | Utilisez `image edit` en partant d’un fichier existant |
| Décrire un fichier image | `openclaw infer image describe --file ./image.png --json`              | `--model` doit être un `<provider/model>` compatible image |
| Transcrire de l’audio    | `openclaw infer audio transcribe --file ./memo.m4a --json`             | `--model` doit être `<provider/model>`                |
| Synthétiser de la parole | `openclaw infer tts convert --text "..." --output ./speech.mp3 --json` | `tts status` est orienté gateway                      |
| Générer une vidéo        | `openclaw infer video generate --prompt "..." --json`                  | Prend en charge des indices fournisseur comme `--resolution` |
| Décrire un fichier vidéo | `openclaw infer video describe --file ./clip.mp4 --json`               | `--model` doit être `<provider/model>`                |
| Rechercher sur le Web    | `openclaw infer web search --query "..." --json`                       |                                                       |
| Récupérer une page Web   | `openclaw infer web fetch --url https://example.com --json`            |                                                       |
| Créer des embeddings     | `openclaw infer embedding create --text "..." --json`                  |                                                       |

## Comportement

- `openclaw infer ...` est la surface CLI principale pour ces workflows.
- Utilisez `--json` lorsque la sortie sera consommée par une autre commande ou un script.
- Utilisez `--provider` ou `--model provider/model` lorsqu’un backend spécifique est requis.
- Pour `image describe`, `audio transcribe` et `video describe`, `--model` doit utiliser la forme `<provider/model>`.
- Pour `image describe`, un `--model` explicite exécute directement ce fournisseur/modèle. Le modèle doit être compatible image dans le catalogue de modèles ou la configuration du fournisseur. `codex/<model>` exécute un tour borné de compréhension d’image via le serveur d’application Codex ; `openai-codex/<model>` utilise le chemin fournisseur OAuth OpenAI Codex.
- Les commandes d’exécution sans état utilisent local par défaut.
- Les commandes d’état géré par Gateway utilisent gateway par défaut.
- Le chemin local normal ne nécessite pas que la gateway soit en cours d’exécution.
- `model run` est one-shot. Les serveurs MCP ouverts via l’environnement d’exécution de l’agent pour cette commande sont retirés après la réponse, aussi bien pour l’exécution locale que pour `--gateway`, afin que les invocations scriptées répétées ne gardent pas en vie les processus enfants stdio MCP.

## Model

Utilisez `model` pour l’inférence texte adossée à un fournisseur et l’inspection des modèles/fournisseurs.

```bash
openclaw infer model run --prompt "Reply with exactly: smoke-ok" --json
openclaw infer model run --prompt "Summarize this changelog entry" --provider openai --json
openclaw infer model providers --json
openclaw infer model inspect --name gpt-5.5 --json
```

Remarques :

- `model run` réutilise l’environnement d’exécution de l’agent afin que les remplacements fournisseur/modèle se comportent comme une exécution normale d’agent.
- Comme `model run` est destiné à l’automatisation headless, il ne conserve pas les environnements d’exécution MCP intégrés par session une fois la commande terminée.
- `model auth login`, `model auth logout` et `model auth status` gèrent l’état d’authentification fournisseur enregistré.

## Image

Utilisez `image` pour la génération, l’édition et la description.

```bash
openclaw infer image generate --prompt "friendly lobster illustration" --json
openclaw infer image generate --prompt "cinematic product photo of headphones" --json
openclaw infer image generate --model openai/gpt-image-1.5 --output-format png --background transparent --prompt "simple red circle sticker on a transparent background" --json
openclaw infer image generate --prompt "slow image backend" --timeout-ms 180000 --json
openclaw infer image edit --file ./logo.png --model openai/gpt-image-1.5 --output-format png --background transparent --prompt "keep the logo, remove the background" --json
openclaw infer image edit --file ./poster.png --prompt "make this a vertical story ad" --size 2160x3840 --aspect-ratio 9:16 --resolution 4K --json
openclaw infer image describe --file ./photo.jpg --json
openclaw infer image describe --file ./ui-screenshot.png --model openai/gpt-4.1-mini --json
openclaw infer image describe --file ./photo.jpg --model ollama/qwen2.5vl:7b --json
```

Remarques :

- Utilisez `image edit` lorsque vous partez de fichiers d’entrée existants.
- Utilisez `--size`, `--aspect-ratio` ou `--resolution` avec `image edit` pour les fournisseurs/modèles qui prennent en charge les indices de géométrie sur les modifications d’images de référence.
- Utilisez `--output-format png --background transparent` avec `--model openai/gpt-image-1.5` pour une sortie PNG OpenAI avec fond transparent ; `--openai-background` reste disponible comme alias spécifique à OpenAI. Les fournisseurs qui ne déclarent pas la prise en charge de l’arrière-plan signalent cet indice comme remplacement ignoré.
- Utilisez `image providers --json` pour vérifier quels fournisseurs d’images intégrés sont détectables, configurés, sélectionnés, et quelles capacités de génération/édition chacun expose.
- Utilisez `image generate --model <provider/model> --json` comme smoke test CLI live le plus ciblé pour les changements de génération d’image. Exemple :

  ```bash
  openclaw infer image providers --json
  openclaw infer image generate \
    --model google/gemini-3.1-flash-image-preview \
    --prompt "Minimal flat test image: one blue square on a white background, no text." \
    --output ./openclaw-infer-image-smoke.png \
    --json
  ```

  La réponse JSON signale `ok`, `provider`, `model`, `attempts` et les chemins de sortie écrits. Lorsque `--output` est défini, l’extension finale peut suivre le type MIME renvoyé par le fournisseur.

- Pour `image describe`, `--model` doit être un `<provider/model>` compatible image.
- Pour les modèles de vision Ollama locaux, récupérez d’abord le modèle et définissez `OLLAMA_API_KEY` sur une valeur fictive, par exemple `ollama-local`. Voir [Ollama](/fr/providers/ollama#vision-and-image-description).

## Audio

Utilisez `audio` pour la transcription de fichiers.

```bash
openclaw infer audio transcribe --file ./memo.m4a --json
openclaw infer audio transcribe --file ./team-sync.m4a --language en --prompt "Focus on names and action items" --json
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

Remarques :

- `audio transcribe` est destiné à la transcription de fichiers, pas à la gestion de sessions en temps réel.
- `--model` doit être `<provider/model>`.

## TTS

Utilisez `tts` pour la synthèse vocale et l’état du fournisseur TTS.

```bash
openclaw infer tts convert --text "hello from openclaw" --output ./hello.mp3 --json
openclaw infer tts convert --text "Your build is complete" --output ./build-complete.mp3 --json
openclaw infer tts providers --json
openclaw infer tts status --json
```

Remarques :

- `tts status` utilise gateway par défaut car il reflète l’état TTS géré par gateway.
- Utilisez `tts providers`, `tts voices` et `tts set-provider` pour inspecter et configurer le comportement TTS.

## Video

Utilisez `video` pour la génération et la description.

```bash
openclaw infer video generate --prompt "cinematic sunset over the ocean" --json
openclaw infer video generate --prompt "slow drone shot over a forest lake" --resolution 768P --duration 6 --json
openclaw infer video describe --file ./clip.mp4 --json
openclaw infer video describe --file ./clip.mp4 --model openai/gpt-4.1-mini --json
```

Remarques :

- `video generate` accepte `--size`, `--aspect-ratio`, `--resolution`, `--duration`, `--audio`, `--watermark` et `--timeout-ms` et les transmet à l’environnement d’exécution de génération vidéo.
- `--model` doit être `<provider/model>` pour `video describe`.

## Web

Utilisez `web` pour les workflows de recherche et de récupération.

```bash
openclaw infer web search --query "OpenClaw docs" --json
openclaw infer web search --query "OpenClaw infer web providers" --json
openclaw infer web fetch --url https://docs.openclaw.ai/cli/infer --json
openclaw infer web providers --json
```

Remarques :

- Utilisez `web providers` pour inspecter les fournisseurs disponibles, configurés et sélectionnés.

## Embedding

Utilisez `embedding` pour la création de vecteurs et l’inspection des fournisseurs d’embeddings.

```bash
openclaw infer embedding create --text "friendly lobster" --json
openclaw infer embedding create --text "customer support ticket: delayed shipment" --model openai/text-embedding-3-large --json
openclaw infer embedding providers --json
```

## Sortie JSON

Les commandes infer normalisent la sortie JSON sous une enveloppe partagée :

```json
{
  "ok": true,
  "capability": "image.generate",
  "transport": "local",
  "provider": "openai",
  "model": "gpt-image-2",
  "attempts": [],
  "outputs": []
}
```

Les champs de niveau supérieur sont stables :

- `ok`
- `capability`
- `transport`
- `provider`
- `model`
- `attempts`
- `outputs`
- `error`

Pour les commandes de média généré, `outputs` contient les fichiers écrits par OpenClaw. Utilisez le `path`, le `mimeType`, la `size` et toute dimension spécifique au média dans ce tableau pour l’automatisation au lieu d’analyser la sortie stdout lisible par un humain.

## Pièges courants

```bash
# Mauvais
openclaw infer media image generate --prompt "friendly lobster"

# Bon
openclaw infer image generate --prompt "friendly lobster"
```

```bash
# Mauvais
openclaw infer audio transcribe --file ./memo.m4a --model whisper-1 --json

# Bon
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

## Remarques

- `openclaw capability ...` est un alias de `openclaw infer ...`.

## Lié

- [Référence CLI](/fr/cli)
- [Modèles](/fr/concepts/models)
