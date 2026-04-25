---
read_when:
    - Ajout ou modification de commandes `openclaw infer`
    - Conception d’une automatisation headless stable des fonctionnalités
summary: CLI à inférence d’abord pour les workflows de modèle, d’image, d’audio, de TTS, de vidéo, de web et d’embeddings pris en charge par un fournisseur
title: CLI d’inférence
x-i18n:
    generated_at: "2026-04-25T13:44:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 249c1074b48882a3beacb08839c8ac992050133fa80e731133620c17dfbbdfe0
    source_path: cli/infer.md
    workflow: 15
---

`openclaw infer` est la surface CLI headless canonique pour les workflows d’inférence pris en charge par un fournisseur.

Il expose volontairement des familles de fonctionnalités, et non des noms RPC bruts de gateway ni des identifiants d’outils d’agent bruts.

## Transformer infer en skill

Copiez-collez ceci à un agent :

```text
Read https://docs.openclaw.ai/cli/infer, then create a skill that routes my common workflows to `openclaw infer`.
Focus on model runs, image generation, video generation, audio transcription, TTS, web search, and embeddings.
```

Un bon skill basé sur infer doit :

- mapper les intentions utilisateur courantes vers la sous-commande infer correcte
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

`openclaw infer` fournit une CLI cohérente pour les tâches d’inférence prises en charge par un fournisseur dans OpenClaw.

Avantages :

- Utilisez les fournisseurs et modèles déjà configurés dans OpenClaw au lieu de câbler des wrappers ponctuels pour chaque backend.
- Conservez les workflows de modèle, image, transcription audio, TTS, vidéo, web et embeddings sous un seul arbre de commandes.
- Utilisez une forme de sortie `--json` stable pour les scripts, l’automatisation et les workflows pilotés par agent.
- Préférez une surface OpenClaw propriétaire lorsque la tâche consiste fondamentalement à « exécuter une inférence ».
- Utilisez le chemin local normal sans nécessiter la gateway pour la plupart des commandes infer.

Pour les vérifications de fournisseur de bout en bout, préférez `openclaw infer ...` une fois que les
tests de fournisseur de niveau inférieur sont au vert. Cela exerce la CLI livrée, le chargement de configuration,
la résolution de l’agent par défaut, l’activation des plugins inclus, la réparation des dépendances d’exécution,
et le runtime partagé des fonctionnalités avant que la requête fournisseur ne soit effectuée.

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
| Générer une image        | `openclaw infer image generate --prompt "..." --json`                  | Utilisez `image edit` si vous partez d’un fichier existant |
| Décrire un fichier image | `openclaw infer image describe --file ./image.png --json`              | `--model` doit être un `<provider/model>` compatible image |
| Transcrire de l’audio    | `openclaw infer audio transcribe --file ./memo.m4a --json`             | `--model` doit être `<provider/model>`                |
| Synthétiser de la parole | `openclaw infer tts convert --text "..." --output ./speech.mp3 --json` | `tts status` est orienté gateway                      |
| Générer une vidéo        | `openclaw infer video generate --prompt "..." --json`                  | Prend en charge des indications fournisseur comme `--resolution` |
| Décrire un fichier vidéo | `openclaw infer video describe --file ./clip.mp4 --json`               | `--model` doit être `<provider/model>`                |
| Rechercher sur le web    | `openclaw infer web search --query "..." --json`                       |                                                       |
| Récupérer une page web   | `openclaw infer web fetch --url https://example.com --json`            |                                                       |
| Créer des embeddings     | `openclaw infer embedding create --text "..." --json`                  |                                                       |

## Comportement

- `openclaw infer ...` est la surface CLI principale pour ces workflows.
- Utilisez `--json` lorsque la sortie sera consommée par une autre commande ou un script.
- Utilisez `--provider` ou `--model provider/model` lorsqu’un backend spécifique est requis.
- Pour `image describe`, `audio transcribe` et `video describe`, `--model` doit utiliser la forme `<provider/model>`.
- Pour `image describe`, un `--model` explicite exécute directement ce fournisseur/modèle. Le modèle doit être compatible image dans le catalogue de modèles ou la configuration du fournisseur. `codex/<model>` exécute un tour borné de compréhension d’image du serveur d’application Codex ; `openai-codex/<model>` utilise le chemin du fournisseur OAuth OpenAI Codex.
- Les commandes d’exécution sans état utilisent le mode local par défaut.
- Les commandes d’état gérées par gateway utilisent le mode gateway par défaut.
- Le chemin local normal n’exige pas que la gateway soit en cours d’exécution.
- `model run` est ponctuel. Les serveurs MCP ouverts via le runtime d’agent pour cette commande sont arrêtés après la réponse, pour l’exécution locale comme pour `--gateway`, de sorte que les invocations scriptées répétées ne gardent pas en vie les processus enfants MCP stdio.

## Model

Utilisez `model` pour l’inférence textuelle prise en charge par un fournisseur et l’inspection des modèles/fournisseurs.

```bash
openclaw infer model run --prompt "Reply with exactly: smoke-ok" --json
openclaw infer model run --prompt "Summarize this changelog entry" --provider openai --json
openclaw infer model providers --json
openclaw infer model inspect --name gpt-5.5 --json
```

Remarques :

- `model run` réutilise le runtime d’agent afin que les remplacements de fournisseur/modèle se comportent comme une exécution d’agent normale.
- Comme `model run` est destiné à l’automatisation headless, il ne conserve pas les runtimes MCP inclus par session après la fin de la commande.
- `model auth login`, `model auth logout` et `model auth status` gèrent l’état d’authentification fournisseur enregistré.

## Image

Utilisez `image` pour la génération, l’édition et la description.

```bash
openclaw infer image generate --prompt "friendly lobster illustration" --json
openclaw infer image generate --prompt "cinematic product photo of headphones" --json
openclaw infer image describe --file ./photo.jpg --json
openclaw infer image describe --file ./ui-screenshot.png --model openai/gpt-4.1-mini --json
openclaw infer image describe --file ./photo.jpg --model ollama/qwen2.5vl:7b --json
```

Remarques :

- Utilisez `image edit` si vous partez de fichiers d’entrée existants.
- Utilisez `image providers --json` pour vérifier quels fournisseurs d’images inclus sont
  détectables, configurés, sélectionnés, et quelles capacités de génération/édition
  chaque fournisseur expose.
- Utilisez `image generate --model <provider/model> --json` comme test smoke CLI en direct
  le plus étroit pour les changements de génération d’image. Exemple :

  ```bash
  openclaw infer image providers --json
  openclaw infer image generate \
    --model google/gemini-3.1-flash-image-preview \
    --prompt "Minimal flat test image: one blue square on a white background, no text." \
    --output ./openclaw-infer-image-smoke.png \
    --json
  ```

  La réponse JSON rapporte `ok`, `provider`, `model`, `attempts` et les chemins de sortie
  écrits. Lorsque `--output` est défini, l’extension finale peut suivre le
  type MIME renvoyé par le fournisseur.

- Pour `image describe`, `--model` doit être un `<provider/model>` compatible image.
- Pour les modèles de vision Ollama locaux, récupérez d’abord le modèle puis définissez `OLLAMA_API_KEY` sur n’importe quelle valeur de substitution, par exemple `ollama-local`. Voir [Ollama](/fr/providers/ollama#vision-and-image-description).

## Audio

Utilisez `audio` pour la transcription de fichiers.

```bash
openclaw infer audio transcribe --file ./memo.m4a --json
openclaw infer audio transcribe --file ./team-sync.m4a --language en --prompt "Focus on names and action items" --json
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

Remarques :

- `audio transcribe` sert à la transcription de fichiers, pas à la gestion de session en temps réel.
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

- `tts status` utilise la gateway par défaut car il reflète l’état TTS géré par la gateway.
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

- `video generate` accepte `--size`, `--aspect-ratio`, `--resolution`, `--duration`, `--audio`, `--watermark` et `--timeout-ms`, et les transmet au runtime de génération vidéo.
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

Les champs de premier niveau sont stables :

- `ok`
- `capability`
- `transport`
- `provider`
- `model`
- `attempts`
- `outputs`
- `error`

Pour les commandes de génération de médias, `outputs` contient les fichiers écrits par OpenClaw. Utilisez
dans ce tableau `path`, `mimeType`, `size` et toute dimension spécifique au média
pour l’automatisation au lieu d’analyser le stdout lisible par un humain.

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

## Voir aussi

- [Référence CLI](/fr/cli)
- [Models](/fr/concepts/models)
