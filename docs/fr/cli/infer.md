---
read_when:
    - Ajout ou modification des commandes `openclaw infer`
    - Concevoir une automatisation stable et sans interface des capacités
summary: CLI orientée inférence pour les flux de travail de modèle, d’image, d’audio, de TTS, de vidéo, de web et d’embedding adossés à un fournisseur
title: CLI d’inférence
x-i18n:
    generated_at: "2026-04-23T07:01:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: e57d2438d0da24e1ed880bbacd244ede4af56beba4ac1baa3f2a1e393e641c9c
    source_path: cli/infer.md
    workflow: 15
---

# CLI d’inférence

`openclaw infer` est la surface sans interface canonique pour les flux de travail d’inférence adossés à un fournisseur.

Elle expose intentionnellement des familles de capacités, et non des noms RPC bruts de la Gateway ni des identifiants bruts d’outils d’agent.

## Transformer infer en skill

Copiez-collez ceci dans un agent :

```text
Read https://docs.openclaw.ai/cli/infer, then create a skill that routes my common workflows to `openclaw infer`.
Focus on model runs, image generation, video generation, audio transcription, TTS, web search, and embeddings.
```

Un bon skill basé sur infer doit :

- mapper les intentions utilisateur courantes vers la sous-commande infer correcte
- inclure quelques exemples infer canoniques pour les flux de travail qu’il couvre
- préférer `openclaw infer ...` dans les exemples et suggestions
- éviter de redocumenter toute la surface infer dans le corps du skill

Couverture typique d’un skill axé sur infer :

- `openclaw infer model run`
- `openclaw infer image generate`
- `openclaw infer audio transcribe`
- `openclaw infer tts convert`
- `openclaw infer web search`
- `openclaw infer embedding create`

## Pourquoi utiliser infer

`openclaw infer` fournit une CLI cohérente pour les tâches d’inférence adossées à un fournisseur dans OpenClaw.

Avantages :

- Utilisez les fournisseurs et modèles déjà configurés dans OpenClaw au lieu de câbler des wrappers ponctuels pour chaque backend.
- Gardez les flux de travail de modèle, image, transcription audio, TTS, vidéo, web et embedding sous une seule arborescence de commandes.
- Utilisez une forme de sortie `--json` stable pour les scripts, l’automatisation et les flux de travail pilotés par agent.
- Préférez une surface OpenClaw de première partie lorsque la tâche consiste fondamentalement à « exécuter une inférence ».
- Utilisez le chemin local normal sans nécessiter la Gateway pour la plupart des commandes infer.

## Arborescence des commandes

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
| Exécuter un prompt texte/modèle | `openclaw infer model run --prompt "..." --json`                | Utilise par défaut le chemin local normal             |
| Générer une image        | `openclaw infer image generate --prompt "..." --json`                  | Utilisez `image edit` si vous partez d’un fichier existant |
| Décrire un fichier image | `openclaw infer image describe --file ./image.png --json`              | `--model` doit être un `<provider/model>` compatible image |
| Transcrire de l’audio    | `openclaw infer audio transcribe --file ./memo.m4a --json`             | `--model` doit être `<provider/model>`                |
| Synthétiser de la parole | `openclaw infer tts convert --text "..." --output ./speech.mp3 --json` | `tts status` est orienté Gateway                      |
| Générer une vidéo        | `openclaw infer video generate --prompt "..." --json`                  |                                                       |
| Décrire un fichier vidéo | `openclaw infer video describe --file ./clip.mp4 --json`               | `--model` doit être `<provider/model>`                |
| Rechercher sur le web    | `openclaw infer web search --query "..." --json`                       |                                                       |
| Récupérer une page web   | `openclaw infer web fetch --url https://example.com --json`            |                                                       |
| Créer des embeddings     | `openclaw infer embedding create --text "..." --json`                  |                                                       |

## Comportement

- `openclaw infer ...` est la surface CLI principale pour ces flux de travail.
- Utilisez `--json` lorsque la sortie sera consommée par une autre commande ou un script.
- Utilisez `--provider` ou `--model provider/model` lorsqu’un backend spécifique est requis.
- Pour `image describe`, `audio transcribe` et `video describe`, `--model` doit utiliser la forme `<provider/model>`.
- Pour `image describe`, un `--model` explicite exécute directement ce fournisseur/modèle. Le modèle doit être compatible image dans le catalogue de modèles ou la configuration du fournisseur.
- Les commandes d’exécution sans état utilisent par défaut le mode local.
- Les commandes à état géré par la Gateway utilisent par défaut la Gateway.
- Le chemin local normal n’exige pas que la Gateway soit en cours d’exécution.

## Modèle

Utilisez `model` pour l’inférence de texte adossée à un fournisseur et l’inspection du modèle/fournisseur.

```bash
openclaw infer model run --prompt "Reply with exactly: smoke-ok" --json
openclaw infer model run --prompt "Summarize this changelog entry" --provider openai --json
openclaw infer model providers --json
openclaw infer model inspect --name gpt-5.4 --json
```

Remarques :

- `model run` réutilise l’environnement d’exécution de l’agent afin que les remplacements de fournisseur/modèle se comportent comme une exécution normale d’agent.
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

Remarques :

- Utilisez `image edit` si vous partez de fichiers d’entrée existants.
- Pour `image describe`, `--model` doit être un `<provider/model>` compatible image.
- Pour les modèles de vision Ollama locaux, récupérez d’abord le modèle et définissez `OLLAMA_API_KEY` sur n’importe quelle valeur fictive, par exemple `ollama-local`. Voir [Ollama](/fr/providers/ollama#vision-and-image-description).

## Audio

Utilisez `audio` pour la transcription de fichiers.

```bash
openclaw infer audio transcribe --file ./memo.m4a --json
openclaw infer audio transcribe --file ./team-sync.m4a --language en --prompt "Focus on names and action items" --json
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

Remarques :

- `audio transcribe` sert à la transcription de fichiers, et non à la gestion de sessions en temps réel.
- `--model` doit être `<provider/model>`.

## TTS

Utilisez `tts` pour la synthèse vocale et l’état du fournisseur TTS.

```bash
openclaw infer tts convert --text "hello from openclaw" --output ./hello.mp3 --json
openclaw infer tts convert --text "Your build is complete" --output ./build-complete.mp3 --json
openclaw infer tts providers --json
openclaw infer tts status --json
```

Remarques :

- `tts status` utilise par défaut la Gateway car il reflète l’état TTS géré par la Gateway.
- Utilisez `tts providers`, `tts voices` et `tts set-provider` pour inspecter et configurer le comportement TTS.

## Vidéo

Utilisez `video` pour la génération et la description.

```bash
openclaw infer video generate --prompt "cinematic sunset over the ocean" --json
openclaw infer video generate --prompt "slow drone shot over a forest lake" --json
openclaw infer video describe --file ./clip.mp4 --json
openclaw infer video describe --file ./clip.mp4 --model openai/gpt-4.1-mini --json
```

Remarques :

- `--model` doit être `<provider/model>` pour `video describe`.

## Web

Utilisez `web` pour les flux de travail de recherche et de récupération.

```bash
openclaw infer web search --query "OpenClaw docs" --json
openclaw infer web search --query "OpenClaw infer web providers" --json
openclaw infer web fetch --url https://docs.openclaw.ai/cli/infer --json
openclaw infer web providers --json
```

Remarques :

- Utilisez `web providers` pour inspecter les fournisseurs disponibles, configurés et sélectionnés.

## Embedding

Utilisez `embedding` pour la création de vecteurs et l’inspection du fournisseur d’embedding.

```bash
openclaw infer embedding create --text "friendly lobster" --json
openclaw infer embedding create --text "customer support ticket: delayed shipment" --model openai/text-embedding-3-large --json
openclaw infer embedding providers --json
```

## Sortie JSON

Les commandes infer normalisent la sortie JSON sous une enveloppe partagée :

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

Les champs de premier niveau sont stables :

- `ok`
- `capability`
- `transport`
- `provider`
- `model`
- `attempts`
- `outputs`
- `error`

## Pièges courants

```bash
# Bad
openclaw infer media image generate --prompt "friendly lobster"

# Good
openclaw infer image generate --prompt "friendly lobster"
```

```bash
# Bad
openclaw infer audio transcribe --file ./memo.m4a --model whisper-1 --json

# Good
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

## Remarques

- `openclaw capability ...` est un alias de `openclaw infer ...`.
