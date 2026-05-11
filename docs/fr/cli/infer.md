---
read_when:
    - Ajout ou modification des commandes `openclaw infer`
    - Concevoir une automatisation stable des capacités sans interface graphique
summary: 'CLI axée sur l’inférence pour des flux de travail adossés à des fournisseurs : modèles, images, audio, TTS, vidéo, web et embeddings'
title: CLI d’inférence
x-i18n:
    generated_at: "2026-05-11T20:27:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 05496c5278650c30e5a52dceba105b703258040765f0a3f75268bb514270f15d
    source_path: cli/infer.md
    workflow: 16
---

`openclaw infer` est la surface headless canonique pour les workflows d’inférence adossés à des fournisseurs.

Il expose volontairement des familles de capacités, pas les noms RPC bruts du Gateway ni les identifiants bruts d’outils d’agent.

## Transformer infer en Skill

Copiez-collez ceci dans un agent :

```text
Read https://docs.openclaw.ai/cli/infer, then create a skill that routes my common workflows to `openclaw infer`.
Focus on model runs, image generation, video generation, audio transcription, TTS, web search, and embeddings.
```

Une bonne Skill basée sur infer doit :

- associer les intentions utilisateur courantes à la bonne sous-commande infer
- inclure quelques exemples infer canoniques pour les workflows qu’elle couvre
- préférer `openclaw infer ...` dans les exemples et suggestions
- éviter de redocumenter toute la surface infer dans le corps de la Skill

Couverture typique d’une Skill centrée sur infer :

- `openclaw infer model run`
- `openclaw infer image generate`
- `openclaw infer audio transcribe`
- `openclaw infer tts convert`
- `openclaw infer web search`
- `openclaw infer embedding create`

## Pourquoi utiliser infer

`openclaw infer` fournit une CLI cohérente pour les tâches d’inférence adossées à des fournisseurs dans OpenClaw.

Avantages :

- Utilisez les fournisseurs et modèles déjà configurés dans OpenClaw au lieu de câbler des wrappers ponctuels pour chaque backend.
- Gardez les workflows de modèle, image, transcription audio, TTS, vidéo, web et embedding sous une seule arborescence de commandes.
- Utilisez une forme de sortie `--json` stable pour les scripts, l’automatisation et les workflows pilotés par agent.
- Préférez une surface OpenClaw de première partie lorsque la tâche consiste fondamentalement à « exécuter une inférence ».
- Utilisez le chemin local normal sans exiger le Gateway pour la plupart des commandes infer.

Pour les vérifications de fournisseur de bout en bout, préférez `openclaw infer ...` une fois les tests de fournisseur de plus bas niveau au vert. Cela exerce la CLI distribuée, le chargement de configuration, la résolution de l’agent par défaut, l’activation des plugins groupés et le runtime de capacités partagé avant l’émission de la requête au fournisseur.

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

| Tâche                        | Commande                                                                                      | Remarques                                             |
| ---------------------------- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| Exécuter un prompt texte/modèle | `openclaw infer model run --prompt "..." --json`                                           | Utilise le chemin local normal par défaut             |
| Exécuter un prompt de modèle sur des images | `openclaw infer model run --prompt "Describe this" --file ./image.png --model provider/model` | Répétez `--file` pour plusieurs entrées image         |
| Générer une image            | `openclaw infer image generate --prompt "..." --json`                                         | Utilisez `image edit` en partant d’un fichier existant |
| Décrire un fichier image     | `openclaw infer image describe --file ./image.png --prompt "..." --json`                      | `--model` doit être un `<provider/model>` capable de traiter des images |
| Transcrire de l’audio        | `openclaw infer audio transcribe --file ./memo.m4a --json`                                    | `--model` doit être `<provider/model>`                |
| Synthétiser la parole        | `openclaw infer tts convert --text "..." --output ./speech.mp3 --json`                        | `tts status` est orienté Gateway                      |
| Générer une vidéo            | `openclaw infer video generate --prompt "..." --json`                                         | Prend en charge les indications de fournisseur comme `--resolution` |
| Décrire un fichier vidéo     | `openclaw infer video describe --file ./clip.mp4 --json`                                      | `--model` doit être `<provider/model>`                |
| Rechercher sur le web        | `openclaw infer web search --query "..." --json`                                              |                                                       |
| Récupérer une page web       | `openclaw infer web fetch --url https://example.com --json`                                   |                                                       |
| Créer des embeddings         | `openclaw infer embedding create --text "..." --json`                                         |                                                       |

## Comportement

- `openclaw infer ...` est la surface CLI principale pour ces workflows.
- Utilisez `--json` lorsque la sortie sera consommée par une autre commande ou un script.
- Utilisez `--provider` ou `--model provider/model` lorsqu’un backend spécifique est requis.
- Utilisez `model run --thinking <level>` pour transmettre un niveau de réflexion/raisonnement ponctuel (`off`, `minimal`, `low`, `medium`, `high`, `adaptive`, `xhigh` ou `max`) tout en gardant l’exécution brute.
- Pour `image describe`, `audio transcribe` et `video describe`, `--model` doit utiliser la forme `<provider/model>`.
- Pour `image describe`, un `--model` explicite exécute directement ce fournisseur/modèle. Le modèle doit être capable de traiter des images dans le catalogue de modèles ou la configuration du fournisseur. `codex/<model>` exécute un tour borné de compréhension d’image du serveur d’application Codex ; `openai-codex/<model>` utilise le chemin du fournisseur OAuth OpenAI Codex.
- Les commandes d’exécution sans état utilisent local par défaut.
- Les commandes d’état gérées par le Gateway utilisent le Gateway par défaut.
- Le chemin local normal n’exige pas que le Gateway soit en cours d’exécution.
- `model run` local est une complétion fournisseur ponctuelle légère. Il résout le modèle et l’authentification de l’agent configuré, mais ne démarre pas de tour d’agent de chat, ne charge pas d’outils et n’ouvre pas les serveurs MCP groupés.
- `model run --file` accepte les fichiers image, détecte leur type MIME et les envoie avec le prompt fourni au modèle sélectionné. Répétez `--file` pour plusieurs images.
- `model run --file` rejette les entrées non image. Utilisez `infer audio transcribe` pour les fichiers audio et `infer video describe` pour les fichiers vidéo.
- `model run --gateway` exerce le routage Gateway, l’authentification enregistrée, la sélection de fournisseur et le runtime intégré, mais s’exécute toujours comme une sonde de modèle brute : il envoie le prompt fourni et les éventuelles pièces jointes image sans transcript de session antérieur, contexte bootstrap/AGENTS, assemblage du moteur de contexte, outils ou serveurs MCP groupés.
- `model run --gateway --model <provider/model>` exige un identifiant Gateway d’opérateur approuvé, car la requête demande au Gateway d’exécuter un remplacement ponctuel de fournisseur/modèle.
- `model run --thinking` local utilise le chemin léger de complétion fournisseur ; les niveaux propres aux fournisseurs comme `adaptive` et `max` sont mappés au niveau de complétion simple portable le plus proche.

## Modèle

Utilisez `model` pour l’inférence texte adossée à un fournisseur et l’inspection des modèles/fournisseurs.

```bash
openclaw infer model run --prompt "Reply with exactly: smoke-ok" --json
openclaw infer model run --prompt "Summarize this changelog entry" --model openai/gpt-5.4 --json
openclaw infer model run --prompt "Describe this image in one sentence" --file ./photo.jpg --model google/gemini-2.5-flash --json
openclaw infer model run --prompt "Use more reasoning here" --thinking high --json
openclaw infer model providers --json
openclaw infer model inspect --name gpt-5.5 --json
```

Utilisez des références `<provider/model>` complètes pour effectuer un smoke-test d’un fournisseur spécifique sans démarrer le Gateway ni charger toute la surface d’outils de l’agent :

```bash
openclaw infer model run --local --model anthropic/claude-sonnet-4-6 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model cerebras/zai-glm-4.7 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model google/gemini-2.5-flash --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model groq/llama-3.1-8b-instant --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model mistral/mistral-medium-3-5 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model mistral/mistral-small-latest --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model openai/gpt-4.1 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model ollama/qwen2.5vl:7b --prompt "Describe this image." --file ./photo.jpg --json
```

Remarques :

- `model run` local est le smoke CLI le plus étroit pour l’état de santé fournisseur/modèle/authentification, car, pour les fournisseurs non-Codex, il envoie uniquement le prompt fourni au modèle sélectionné.
- `model run --model <provider/model>` local peut utiliser les lignes exactes du catalogue statique groupé depuis `models list --all` avant que ce fournisseur soit écrit dans la configuration. L’authentification du fournisseur reste requise ; les identifiants manquants échouent comme erreurs d’authentification, pas comme `Unknown model`.
- Pour les sondes de raisonnement Mistral Medium 3.5, laissez la température non définie/par défaut. Mistral rejette `reasoning_effort="high"` plus `temperature: 0` ; utilisez `mistral/mistral-medium-3-5` avec la température par défaut ou une valeur de mode raisonnement non nulle comme `0.7`.
- Les sondes locales `openai-codex/*` sont l’exception étroite : OpenClaw ajoute une instruction système minimale afin que le transport Codex Responses puisse renseigner son champ `instructions` requis, sans ajouter le contexte complet de l’agent, les outils, la mémoire ou le transcript de session.
- `model run --file` local garde ce chemin léger et joint le contenu image directement au message utilisateur unique. Les fichiers image courants comme PNG, JPEG et WebP fonctionnent lorsque leur type MIME est détecté comme `image/*` ; les fichiers non pris en charge ou non reconnus échouent avant l’appel au fournisseur.
- `model run --file` est préférable lorsque vous voulez tester directement le modèle texte multimodal sélectionné. Utilisez `infer image describe` lorsque vous voulez la sélection de fournisseur de compréhension d’image d’OpenClaw et le routage par défaut du modèle image.
- Le modèle sélectionné doit prendre en charge les entrées image ; les modèles texte uniquement peuvent rejeter la requête au niveau du fournisseur.
- `model run --prompt` doit contenir du texte non composé uniquement d’espaces ; les prompts vides sont rejetés avant l’appel aux fournisseurs locaux ou au Gateway.
- `model run` local se termine avec un code non nul lorsque le fournisseur ne renvoie aucune sortie texte, afin que les fournisseurs locaux inaccessibles et les complétions vides ne ressemblent pas à des sondes réussies.
- Utilisez `model run --gateway` lorsque vous devez tester le routage Gateway, la configuration du runtime d’agent ou l’état fournisseur géré par le Gateway tout en gardant l’entrée du modèle brute. Utilisez `openclaw agent` ou les surfaces de chat lorsque vous voulez le contexte complet de l’agent, les outils, la mémoire et le transcript de session.
- `model auth login`, `model auth logout` et `model auth status` gèrent l’état d’authentification fournisseur enregistré.

## Image

Utilisez `image` pour la génération, la modification et la description.

```bash
openclaw infer image generate --prompt "friendly lobster illustration" --json
openclaw infer image generate --prompt "cinematic product photo of headphones" --json
openclaw infer image generate --model openai/gpt-image-1.5 --output-format png --background transparent --prompt "simple red circle sticker on a transparent background" --json
openclaw infer image generate --prompt "slow image backend" --timeout-ms 180000 --json
openclaw infer image edit --file ./logo.png --model openai/gpt-image-1.5 --output-format png --background transparent --prompt "keep the logo, remove the background" --json
openclaw infer image edit --file ./poster.png --prompt "make this a vertical story ad" --size 2160x3840 --aspect-ratio 9:16 --resolution 4K --json
openclaw infer image describe --file ./photo.jpg --json
openclaw infer image describe --file ./receipt.jpg --prompt "Extract the merchant, date, and total" --json
openclaw infer image describe-many --file ./before.png --file ./after.png --prompt "Compare the screenshots and list visible UI changes" --json
openclaw infer image describe --file ./ui-screenshot.png --model openai/gpt-4.1-mini --json
openclaw infer image describe --file ./photo.jpg --model ollama/qwen2.5vl:7b --prompt "Describe the image in one sentence" --timeout-ms 300000 --json
```

Remarques :

- Utilisez `image edit` lorsque vous partez de fichiers d’entrée existants.
- Utilisez `--size`, `--aspect-ratio` ou `--resolution` avec `image edit` pour
  les fournisseurs/modèles qui prennent en charge les indications de géométrie lors des modifications d’images de référence.
- Utilisez `--output-format png --background transparent` avec
  `--model openai/gpt-image-1.5` pour produire une sortie PNG OpenAI avec arrière-plan transparent ;
  `--openai-background` reste disponible comme alias propre à OpenAI. Les fournisseurs
  qui ne déclarent pas la prise en charge de l’arrière-plan signalent l’indication comme une surcharge ignorée.
- Utilisez `image providers --json` pour vérifier quels fournisseurs d’images intégrés sont
  détectables, configurés, sélectionnés, et quelles capacités de génération/modification
  chaque fournisseur expose.
- Utilisez `image generate --model <provider/model> --json` comme test de fumée CLI en direct le plus ciblé
  pour les changements de génération d’images. Exemple :

  ```bash
  openclaw infer image providers --json
  openclaw infer image generate \
    --model google/gemini-3.1-flash-image-preview \
    --prompt "Minimal flat test image: one blue square on a white background, no text." \
    --output ./openclaw-infer-image-smoke.png \
    --json
  ```

  La réponse JSON indique `ok`, `provider`, `model`, `attempts` et les chemins
  de sortie écrits. Lorsque `--output` est défini, l’extension finale peut suivre le
  type MIME renvoyé par le fournisseur.

- Pour `image describe` et `image describe-many`, utilisez `--prompt` afin de donner au modèle de vision une instruction propre à la tâche, comme l’OCR, la comparaison, l’inspection d’interface utilisateur ou un sous-titrage concis.
- Utilisez `--timeout-ms` avec les modèles de vision locaux lents ou les démarrages à froid d’Ollama.
- Pour `image describe`, `--model` doit être un `<provider/model>` compatible avec l’image.
- Pour les modèles de vision Ollama locaux, récupérez d’abord le modèle et définissez `OLLAMA_API_KEY` sur n’importe quelle valeur d’espace réservé, par exemple `ollama-local`. Consultez [Ollama](/fr/providers/ollama#vision-and-image-description).

## Audio

Utilisez `audio` pour la transcription de fichiers.

```bash
openclaw infer audio transcribe --file ./memo.m4a --json
openclaw infer audio transcribe --file ./team-sync.m4a --language en --prompt "Focus on names and action items" --json
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

Remarques :

- `audio transcribe` sert à transcrire des fichiers, pas à gérer des sessions en temps réel.
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

- `tts status` utilise Gateway par défaut, car il reflète l’état TTS géré par Gateway.
- Utilisez `tts providers`, `tts voices` et `tts set-provider` pour inspecter et configurer le comportement TTS.

## Vidéo

Utilisez `video` pour la génération et la description.

```bash
openclaw infer video generate --prompt "cinematic sunset over the ocean" --json
openclaw infer video generate --prompt "slow drone shot over a forest lake" --resolution 768P --duration 6 --json
openclaw infer video describe --file ./clip.mp4 --json
openclaw infer video describe --file ./clip.mp4 --model openai/gpt-4.1-mini --json
```

Remarques :

- `video generate` accepte `--size`, `--aspect-ratio`, `--resolution`, `--duration`, `--audio`, `--watermark` et `--timeout-ms`, puis les transmet au runtime de génération vidéo.
- `--model` doit être `<provider/model>` pour `video describe`.

## Web

Utilisez `web` pour les flux de recherche et de récupération.

```bash
openclaw infer web search --query "OpenClaw docs" --json
openclaw infer web search --query "OpenClaw infer web providers" --json
openclaw infer web fetch --url https://docs.openclaw.ai/cli/infer --json
openclaw infer web providers --json
```

Remarques :

- Utilisez `web providers` pour inspecter les fournisseurs disponibles, configurés et sélectionnés.

## Plongement vectoriel

Utilisez `embedding` pour la création de vecteurs et l’inspection des fournisseurs de plongements vectoriels.

```bash
openclaw infer embedding create --text "friendly lobster" --json
openclaw infer embedding create --text "customer support ticket: delayed shipment" --model openai/text-embedding-3-large --json
openclaw infer embedding providers --json
```

## Sortie JSON

Les commandes d’inférence normalisent la sortie JSON dans une enveloppe partagée :

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

Pour les commandes de médias générés, `outputs` contient les fichiers écrits par OpenClaw. Utilisez
`path`, `mimeType`, `size` et toute dimension propre au média dans ce tableau
pour l’automatisation, au lieu d’analyser la sortie stdout lisible par l’humain.

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

## Associés

- [Référence CLI](/fr/cli)
- [Modèles](/fr/concepts/models)
