---
read_when:
    - Ajout ou modification de commandes `openclaw infer`
    - Conception d’une automatisation stable des capacités sans interface graphique
summary: CLI axée prioritairement sur l’inférence pour les flux de travail de modèles, d’images, d’audio, de TTS, de vidéo, du web et de plongements adossés à des fournisseurs
title: CLI d’inférence
x-i18n:
    generated_at: "2026-04-30T07:18:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8a154cf11a09f6c60117740f42937da3a0e6942931dde6eee6d902fb6e0ba461
    source_path: cli/infer.md
    workflow: 16
---

`openclaw infer` est la surface headless canonique pour les workflows d’inférence adossés à des fournisseurs.

Elle expose volontairement des familles de capacités, et non les noms RPC bruts du Gateway ni les identifiants bruts des outils d’agent.

## Transformer infer en Skill

Copiez-collez ceci dans un agent :

```text
Read https://docs.openclaw.ai/cli/infer, then create a skill that routes my common workflows to `openclaw infer`.
Focus on model runs, image generation, video generation, audio transcription, TTS, web search, and embeddings.
```

Un bon Skill basé sur infer doit :

- mapper les intentions utilisateur courantes vers la bonne sous-commande infer
- inclure quelques exemples infer canoniques pour les workflows qu’il couvre
- préférer `openclaw infer ...` dans les exemples et suggestions
- éviter de redocumenter toute la surface infer dans le corps du Skill

Couverture typique d’un Skill centré sur infer :

- `openclaw infer model run`
- `openclaw infer image generate`
- `openclaw infer audio transcribe`
- `openclaw infer tts convert`
- `openclaw infer web search`
- `openclaw infer embedding create`

## Pourquoi utiliser infer

`openclaw infer` fournit une CLI cohérente pour les tâches d’inférence adossées à des fournisseurs dans OpenClaw.

Avantages :

- Utiliser les fournisseurs et modèles déjà configurés dans OpenClaw au lieu de câbler des wrappers ponctuels pour chaque backend.
- Conserver les workflows de modèle, image, transcription audio, TTS, vidéo, web et embeddings sous une même arborescence de commandes.
- Utiliser une forme de sortie `--json` stable pour les scripts, l’automatisation et les workflows pilotés par agent.
- Préférer une surface OpenClaw de première partie lorsque la tâche consiste fondamentalement à « exécuter de l’inférence ».
- Utiliser le chemin local normal sans exiger le Gateway pour la plupart des commandes infer.

Pour les vérifications fournisseur de bout en bout, préférez `openclaw infer ...` une fois les tests fournisseur de plus bas niveau au vert. Cela exerce la CLI livrée, le chargement de la configuration, la résolution de l’agent par défaut, l’activation des Plugins groupés, la réparation des dépendances d’exécution et le runtime de capacités partagé avant l’envoi de la requête fournisseur.

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

| Tâche                        | Commande                                                                                      | Notes                                                 |
| ---------------------------- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| Exécuter une invite texte/modèle | `openclaw infer model run --prompt "..." --json`                                              | Utilise le chemin local normal par défaut             |
| Exécuter une invite modèle sur des images | `openclaw infer model run --prompt "Describe this" --file ./image.png --model provider/model` | Répétez `--file` pour plusieurs entrées image         |
| Générer une image            | `openclaw infer image generate --prompt "..." --json`                                         | Utilisez `image edit` en partant d’un fichier existant |
| Décrire un fichier image     | `openclaw infer image describe --file ./image.png --prompt "..." --json`                      | `--model` doit être un `<provider/model>` compatible image |
| Transcrire de l’audio        | `openclaw infer audio transcribe --file ./memo.m4a --json`                                    | `--model` doit être `<provider/model>`                |
| Synthétiser la parole        | `openclaw infer tts convert --text "..." --output ./speech.mp3 --json`                        | `tts status` est orienté Gateway                      |
| Générer une vidéo            | `openclaw infer video generate --prompt "..." --json`                                         | Prend en charge les indications fournisseur comme `--resolution` |
| Décrire un fichier vidéo     | `openclaw infer video describe --file ./clip.mp4 --json`                                      | `--model` doit être `<provider/model>`                |
| Rechercher sur le web        | `openclaw infer web search --query "..." --json`                                              |                                                       |
| Récupérer une page web       | `openclaw infer web fetch --url https://example.com --json`                                   |                                                       |
| Créer des embeddings         | `openclaw infer embedding create --text "..." --json`                                         |                                                       |

## Comportement

- `openclaw infer ...` est la surface CLI principale pour ces workflows.
- Utilisez `--json` lorsque la sortie sera consommée par une autre commande ou un script.
- Utilisez `--provider` ou `--model provider/model` lorsqu’un backend précis est requis.
- Pour `image describe`, `audio transcribe` et `video describe`, `--model` doit utiliser la forme `<provider/model>`.
- Pour `image describe`, un `--model` explicite exécute directement ce fournisseur/modèle. Le modèle doit être compatible image dans le catalogue de modèles ou la configuration du fournisseur. `codex/<model>` exécute un tour borné de compréhension d’image via le serveur d’application Codex ; `openai-codex/<model>` utilise le chemin du fournisseur OAuth OpenAI Codex.
- Les commandes d’exécution sans état utilisent le local par défaut.
- Les commandes d’état gérées par le Gateway utilisent le Gateway par défaut.
- Le chemin local normal n’exige pas que le Gateway soit en cours d’exécution.
- `model run` local est une complétion fournisseur ponctuelle et légère. Il résout le modèle et l’authentification configurés de l’agent, mais ne démarre pas de tour d’agent conversationnel, ne charge pas d’outils et n’ouvre pas de serveurs MCP groupés.
- `model run --file` accepte les fichiers image, détecte leur type MIME et les envoie avec l’invite fournie au modèle sélectionné. Répétez `--file` pour plusieurs images.
- `model run --file` rejette les entrées non image. Utilisez `infer audio transcribe` pour les fichiers audio et `infer video describe` pour les fichiers vidéo.
- `model run --gateway` exerce le routage Gateway, l’authentification enregistrée, la sélection du fournisseur et le runtime intégré, mais s’exécute toujours comme une sonde de modèle brute : il envoie l’invite fournie et toute pièce jointe image sans transcript de session préalable, contexte bootstrap/AGENTS, assemblage du moteur de contexte, outils ni serveurs MCP groupés.
- `model run --gateway --model <provider/model>` exige un identifiant de Gateway opérateur approuvé, car la requête demande au Gateway d’exécuter une surcharge fournisseur/modèle ponctuelle.

## Modèle

Utilisez `model` pour l’inférence texte adossée à un fournisseur et l’inspection des modèles/fournisseurs.

```bash
openclaw infer model run --prompt "Reply with exactly: smoke-ok" --json
openclaw infer model run --prompt "Summarize this changelog entry" --model openai/gpt-5.4 --json
openclaw infer model run --prompt "Describe this image in one sentence" --file ./photo.jpg --model google/gemini-2.5-flash --json
openclaw infer model providers --json
openclaw infer model inspect --name gpt-5.5 --json
```

Utilisez des références complètes `<provider/model>` pour tester rapidement un fournisseur précis sans démarrer le Gateway ni charger toute la surface d’outils de l’agent :

```bash
openclaw infer model run --local --model anthropic/claude-sonnet-4-6 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model cerebras/zai-glm-4.7 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model google/gemini-2.5-flash --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model groq/llama-3.1-8b-instant --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model mistral/mistral-small-latest --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model openai/gpt-4.1 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model ollama/qwen2.5vl:7b --prompt "Describe this image." --file ./photo.jpg --json
```

Notes :

- `model run` local est le smoke CLI le plus étroit pour la santé fournisseur/modèle/authentification, car il envoie uniquement l’invite fournie au modèle sélectionné.
- `model run --file` local conserve ce chemin léger et joint le contenu image directement au message utilisateur unique. Les fichiers image courants comme PNG, JPEG et WebP fonctionnent lorsque leur type MIME est détecté comme `image/*` ; les fichiers non pris en charge ou non reconnus échouent avant l’appel au fournisseur.
- `model run --file` est préférable lorsque vous voulez tester directement le modèle texte multimodal sélectionné. Utilisez `infer image describe` lorsque vous voulez la sélection du fournisseur de compréhension d’image d’OpenClaw et le routage du modèle image par défaut.
- Le modèle sélectionné doit prendre en charge l’entrée image ; les modèles texte seuls peuvent rejeter la requête au niveau du fournisseur.
- `model run --prompt` doit contenir du texte non vide ; les invites vides sont rejetées avant l’appel aux fournisseurs locaux ou au Gateway.
- `model run` local se termine avec un code non nul lorsque le fournisseur ne renvoie aucune sortie texte, afin que les fournisseurs locaux injoignables et les complétions vides ne ressemblent pas à des sondes réussies.
- Utilisez `model run --gateway` lorsque vous devez tester le routage Gateway, la configuration du runtime d’agent ou l’état fournisseur géré par Gateway tout en conservant l’entrée modèle brute. Utilisez `openclaw agent` ou les surfaces de chat lorsque vous voulez le contexte complet de l’agent, les outils, la mémoire et le transcript de session.
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
openclaw infer image describe --file ./receipt.jpg --prompt "Extract the merchant, date, and total" --json
openclaw infer image describe-many --file ./before.png --file ./after.png --prompt "Compare the screenshots and list visible UI changes" --json
openclaw infer image describe --file ./ui-screenshot.png --model openai/gpt-4.1-mini --json
openclaw infer image describe --file ./photo.jpg --model ollama/qwen2.5vl:7b --prompt "Describe the image in one sentence" --timeout-ms 300000 --json
```

Notes :

- Utilisez `image edit` en partant de fichiers d’entrée existants.
- Utilisez `--size`, `--aspect-ratio` ou `--resolution` avec `image edit` pour les fournisseurs/modèles qui prennent en charge les indications de géométrie sur les éditions avec image de référence.
- Utilisez `--output-format png --background transparent` avec `--model openai/gpt-image-1.5` pour la sortie PNG OpenAI à arrière-plan transparent ; `--openai-background` reste disponible comme alias spécifique à OpenAI. Les fournisseurs qui ne déclarent pas la prise en charge de l’arrière-plan signalent l’indication comme une surcharge ignorée.
- Utilisez `image providers --json` pour vérifier quels fournisseurs d’image groupés sont découvrables, configurés, sélectionnés, et quelles capacités de génération/édition chaque fournisseur expose.
- Utilisez `image generate --model <provider/model> --json` comme smoke CLI live le plus étroit pour les changements de génération d’image. Exemple :

  ```bash
  openclaw infer image providers --json
  openclaw infer image generate \
    --model google/gemini-3.1-flash-image-preview \
    --prompt "Minimal flat test image: one blue square on a white background, no text." \
    --output ./openclaw-infer-image-smoke.png \
    --json
  ```

  La réponse JSON indique `ok`, `provider`, `model`, `attempts` et les chemins de
  sortie écrits. Lorsque `--output` est défini, l’extension finale peut suivre le
  type MIME renvoyé par le fournisseur.

- Pour `image describe` et `image describe-many`, utilisez `--prompt` pour donner au modèle de vision une instruction propre à la tâche, comme l’OCR, la comparaison, l’inspection d’interface utilisateur ou le sous-titrage concis.
- Utilisez `--timeout-ms` avec les modèles de vision locaux lents ou les démarrages à froid d’Ollama.
- Pour `image describe`, `--model` doit être un `<provider/model>` compatible avec les images.
- Pour les modèles de vision Ollama locaux, récupérez d’abord le modèle et définissez `OLLAMA_API_KEY` sur n’importe quelle valeur de substitution, par exemple `ollama-local`. Consultez [Ollama](/fr/providers/ollama#vision-and-image-description).

## Audio

Utilisez `audio` pour la transcription de fichiers.

```bash
openclaw infer audio transcribe --file ./memo.m4a --json
openclaw infer audio transcribe --file ./team-sync.m4a --language en --prompt "Focus on names and action items" --json
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

Remarques :

- `audio transcribe` sert à la transcription de fichiers, pas à la gestion de sessions en temps réel.
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

Utilisez `web` pour les workflows de recherche et de récupération.

```bash
openclaw infer web search --query "OpenClaw docs" --json
openclaw infer web search --query "OpenClaw infer web providers" --json
openclaw infer web fetch --url https://docs.openclaw.ai/cli/infer --json
openclaw infer web providers --json
```

Remarques :

- Utilisez `web providers` pour inspecter les fournisseurs disponibles, configurés et sélectionnés.

## Embedding

Utilisez `embedding` pour la création de vecteurs et l’inspection des fournisseurs d’embeddings.

```bash
openclaw infer embedding create --text "friendly lobster" --json
openclaw infer embedding create --text "customer support ticket: delayed shipment" --model openai/text-embedding-3-large --json
openclaw infer embedding providers --json
```

## Sortie JSON

Les commandes `infer` normalisent la sortie JSON dans une enveloppe partagée :

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
le `path`, le `mimeType`, la `size` et toutes les dimensions propres au média dans ce tableau
pour l’automatisation, au lieu d’analyser la sortie stdout lisible par l’utilisateur.

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

## Connexe

- [Référence CLI](/fr/cli)
- [Modèles](/fr/concepts/models)
