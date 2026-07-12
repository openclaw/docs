---
read_when:
    - Ajout ou modification de commandes `openclaw infer`
    - Concevoir une automatisation stable des capacités sans interface graphique
summary: CLI axée sur l’inférence pour les workflows de modèles, d’images, d’audio, de synthèse vocale, de vidéo, du web et d’embeddings reposant sur des fournisseurs
title: CLI d’inférence
x-i18n:
    generated_at: "2026-07-12T02:43:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ec90377d3fb6049e63f5eb1dddfb085562982152b1b2ba7bd4e4d2535ab3c06f
    source_path: cli/infer.md
    workflow: 16
---

`openclaw infer` est l’interface canonique sans affichage pour l’inférence reposant sur des fournisseurs. Elle expose des familles de capacités (`model`, `image`, `audio`, `tts`, `video`, `web`, `embedding`), et non les noms RPC bruts du Gateway ni les identifiants des outils d’agent. `openclaw capability ...` est un alias de la même arborescence de commandes.

Raisons de la préférer à un wrapper ponctuel propre à un fournisseur :

- Réutilise les fournisseurs et modèles déjà configurés dans OpenClaw.
- Enveloppe `--json` stable pour les scripts et l’automatisation pilotée par des agents (voir [Sortie JSON](#json-output)).
- Emprunte le chemin local normal sans le Gateway pour la plupart des sous-commandes.
- Pour les vérifications de bout en bout des fournisseurs, elle couvre la CLI distribuée, le chargement de la configuration, la résolution de l’agent par défaut, l’activation des Plugins intégrés et l’environnement d’exécution partagé des capacités avant l’envoi de la requête au fournisseur.

## Transformer infer en Skills

Copiez-collez ceci dans un agent :

```text
Lisez https://docs.openclaw.ai/cli/infer, puis créez des Skills qui orientent mes flux de travail courants vers `openclaw infer`.
Concentrez-vous sur les exécutions de modèles, la génération d’images, la génération de vidéos, la transcription audio, la synthèse vocale, la recherche sur le Web et les plongements vectoriels.
```

De bonnes Skills fondées sur infer associent les intentions courantes de l’utilisateur à la bonne sous-commande, incluent quelques exemples canoniques pour chaque flux de travail, privilégient `openclaw infer ...` par rapport aux solutions de plus bas niveau et ne documentent pas à nouveau l’intégralité de l’interface infer dans leur contenu.

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
    personas
    status
    enable
    disable
    set-provider
    set-persona

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

`infer list` / `infer inspect --name <capability>` affichent cette arborescence sous forme de données (identifiant de capacité, transports, description).

## Tâches courantes

| Tâche                                  | Commande                                                                                      | Remarques                                                         |
| -------------------------------------- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Exécuter une invite de texte/modèle    | `openclaw infer model run --prompt "..." --json`                                              | Locale par défaut                                                 |
| Exécuter une invite de modèle sur des images | `openclaw infer model run --prompt "Describe this" --file ./image.png --model provider/model` | Répétez `--file` pour plusieurs images                            |
| Générer une image                      | `openclaw infer image generate --prompt "..." --json`                                         | Utilisez `image edit` en partant d’un fichier existant            |
| Décrire un fichier image ou une URL    | `openclaw infer image describe --file ./image.png --prompt "..." --json`                      | `--model` doit être un `<provider/model>` prenant en charge les images |
| Transcrire un contenu audio            | `openclaw infer audio transcribe --file ./memo.m4a --json`                                    | `--model` doit être au format `<provider/model>`                  |
| Synthétiser de la parole               | `openclaw infer tts convert --text "..." --output ./speech.mp3 --json`                        | `tts status` passe uniquement par le Gateway                      |
| Générer une vidéo                      | `openclaw infer video generate --prompt "..." --json`                                         | Accepte des indications destinées au fournisseur, comme `--resolution` |
| Décrire un fichier vidéo               | `openclaw infer video describe --file ./clip.mp4 --json`                                      | `--model` doit être au format `<provider/model>`                  |
| Effectuer une recherche sur le Web     | `openclaw infer web search --query "..." --json`                                              |                                                                   |
| Récupérer une page Web                 | `openclaw infer web fetch --url https://example.com --json`                                   |                                                                   |
| Créer des plongements vectoriels       | `openclaw infer embedding create --text "..." --json`                                         |                                                                   |

## Comportement

- Utilisez `--json` lorsque la sortie alimente une autre commande ou un script ; sinon, utilisez la sortie texte.
- Utilisez `--provider` ou `--model provider/model` pour imposer un moteur précis.
- Utilisez `model run --thinking <level>` pour remplacer ponctuellement le niveau de réflexion/raisonnement : `off`, `minimal`, `low`, `medium`, `high`, `adaptive`, `xhigh` ou `max`.
- Pour `image describe`, `audio transcribe` et `video describe`, `--model` doit respecter la forme `<provider/model>`.
- Pour `image describe`, `--file` accepte les chemins locaux et les URL HTTP(S) ; les URL distantes sont soumises à la politique SSRF normale de récupération des médias.
- Les commandes d’exécution sans état (`model run`, `image *`, `audio *`, `video *`, `web *`, `embedding *`) sont locales par défaut. Les commandes d’état gérées par le Gateway (`tts status`) utilisent le Gateway par défaut.
- Le chemin local ne nécessite jamais que le Gateway soit en cours d’exécution.
- La commande locale `model run` effectue une exécution ponctuelle et légère auprès du fournisseur : elle résout le modèle d’agent configuré et l’authentification, mais ne démarre pas un tour d’agent conversationnel, ne charge aucun outil et n’ouvre aucun serveur MCP intégré.
- `model run --file` joint des fichiers image au format MIME détecté automatiquement à l’invite ; répétez `--file` pour plusieurs images. Les fichiers qui ne sont pas des images sont refusés — utilisez plutôt `infer audio transcribe` ou `infer video describe`.
- `model run --gateway` couvre le routage du Gateway, l’authentification enregistrée, la sélection du fournisseur et l’environnement d’exécution intégré, mais reste une sonde de modèle brute : aucun historique de session, contexte d’amorçage/AGENTS, outil ou serveur MCP intégré.
- `model run --gateway --model <provider/model>` nécessite un identifiant du Gateway réservé aux opérateurs de confiance, car cette commande demande au Gateway d’exécuter un remplacement ponctuel du fournisseur/modèle.

## Modèle

Inférence de texte et inspection des modèles/fournisseurs.

```bash
openclaw infer model run --prompt "Reply with exactly: smoke-ok" --json
openclaw infer model run --prompt "Summarize this changelog entry" --model openai/gpt-5.4 --json
openclaw infer model run --prompt "Describe this image in one sentence" --file ./photo.jpg --model google/gemini-2.5-flash --json
openclaw infer model run --prompt "Use more reasoning here" --thinking high --json
openclaw infer model providers --json
openclaw infer model inspect --model gpt-5.6-sol --json
```

Utilisez des références `<provider/model>` complètes avec `--local` afin de tester rapidement un fournisseur sans démarrer le Gateway ni charger l’interface des outils de l’agent :

```bash
openclaw infer model run --local --model anthropic/claude-sonnet-4-6 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model cerebras/zai-glm-4.7 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model google/gemini-2.5-flash --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model groq/llama-3.1-8b-instant --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model mistral/mistral-medium-3-5 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model mistral/mistral-small-latest --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model openai/gpt-5.6-luna --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model ollama/qwen2.5vl:7b --prompt "Describe this image." --file ./photo.jpg --json
```

Remarques :

- La commande locale `model run` est le test CLI le plus ciblé de l’état du fournisseur, du modèle et de l’authentification : pour les fournisseurs autres que ChatGPT-Codex, elle envoie uniquement l’invite fournie.
- La commande locale `model run --model <provider/model>` peut résoudre les entrées exactes du catalogue statique intégré — les mêmes que celles affichées par `openclaw models list --all` — avant que ce fournisseur soit inscrit dans la configuration. L’authentification auprès du fournisseur reste obligatoire ; l’absence d’identifiants produit des erreurs d’authentification, et non `Unknown model`.
- Pour les sondes de raisonnement de Mistral Medium 3.5, laissez la température non définie ou à sa valeur par défaut. Mistral refuse `reasoning_effort="high"` avec `temperature: 0` ; utilisez la température par défaut ou une valeur non nulle, telle que `0.7`.
- Les sondes locales utilisant OAuth OpenAI ChatGPT/Codex (API `openai-chatgpt-responses`) ajoutent une instruction système minimale afin que le transport puisse renseigner son champ `instructions` obligatoire — sans contexte d’agent complet, outils, mémoire ni historique de session.
- `model run --file` joint directement le contenu de l’image à l’unique message utilisateur. Les formats courants (PNG, JPEG, WebP) fonctionnent lorsque le type MIME est détecté comme `image/*` ; les fichiers non pris en charge ou non reconnus échouent avant tout appel au fournisseur. Utilisez plutôt `infer image describe` si vous souhaitez bénéficier du routage des modèles d’image et des solutions de repli d’OpenClaw plutôt que d’une sonde directe de modèle multimodal.
- Le modèle sélectionné doit prendre en charge les images en entrée ; les modèles exclusivement textuels peuvent refuser la requête au niveau du fournisseur.
- `model run --prompt` doit contenir du texte autre que des espaces ; les invites vides sont refusées avant tout appel au fournisseur ou au Gateway.
- La commande locale `model run` se termine avec un code différent de zéro lorsque le fournisseur ne renvoie aucune sortie textuelle, afin que les fournisseurs injoignables et les générations vides ne soient pas considérés comme des sondes réussies.
- Utilisez `model run --gateway` pour tester le routage du Gateway ou la configuration de l’environnement d’exécution de l’agent tout en conservant l’entrée brute du modèle. Utilisez `openclaw agent` ou une interface de conversation pour bénéficier du contexte d’agent complet, des outils, de la mémoire et de l’historique de session.
- `--thinking adaptive` correspond au niveau `medium` de l’environnement d’exécution des générations ; `--thinking max` correspond à `max` pour les modèles OpenAI prenant en charge nativement l’effort maximal, et à `xhigh` dans les autres cas.
- `model auth login`, `model auth logout` et `model auth status` gèrent l’état d’authentification enregistré auprès des fournisseurs.

## Image

Génération, modification et description.

```bash
openclaw infer image generate --prompt "friendly lobster illustration" --json
openclaw infer image generate --prompt "cinematic product photo of headphones" --json
openclaw infer image generate --model openai/gpt-image-1.5 --output-format png --background transparent --prompt "simple red circle sticker on a transparent background" --json
openclaw infer image generate --model openai/gpt-image-2 --quality low --openai-moderation low --prompt "low-cost draft poster" --json
openclaw infer image generate --prompt "slow image backend" --timeout-ms 180000 --json
openclaw infer image edit --file ./logo.png --model openai/gpt-image-1.5 --output-format png --background transparent --prompt "keep the logo, remove the background" --json
openclaw infer image edit --file ./poster.png --prompt "make this a vertical story ad" --size 2160x3840 --aspect-ratio 9:16 --resolution 4K --json
openclaw infer image describe --file ./photo.jpg --json
openclaw infer image describe --file https://example.com/photo.png --json
openclaw infer image describe --file ./receipt.jpg --prompt "Extract the merchant, date, and total" --json
openclaw infer image describe-many --file ./before.png --file ./after.png --prompt "Compare the screenshots and list visible UI changes" --json
openclaw infer image describe --file ./ui-screenshot.png --model openai/gpt-5.4-mini --json
openclaw infer image describe --file ./photo.jpg --model ollama/qwen2.5vl:7b --prompt "Describe the image in one sentence" --timeout-ms 300000 --json
```

Remarques :

- Utilisez `image edit` lorsque vous partez de fichiers d’entrée existants ; `--size`, `--aspect-ratio` ou `--resolution` ajoutent des indications de géométrie pour les fournisseurs/modèles qui les prennent en charge.
- `--output-format png --background transparent` avec `--model openai/gpt-image-1.5` produit une image PNG OpenAI avec un arrière-plan transparent ; `--openai-background` est un alias propre à OpenAI pour la même indication. Les fournisseurs qui ne déclarent pas prendre en charge l’arrière-plan le signalent comme un remplacement ignoré (voir `ignoredOverrides` dans l’[enveloppe JSON](#json-output)).
- `--quality low|medium|high|auto` fonctionne avec les fournisseurs qui prennent en charge les indications de qualité d’image, notamment OpenAI. OpenAI accepte également `--openai-moderation low|auto`.
- `image providers --json` indique quels fournisseurs d’images intégrés sont détectables, configurés et sélectionnés, ainsi que les capacités de génération/modification exposées par chacun.
- `image generate --model <provider/model> --json` est le test de bon fonctionnement en conditions réelles le plus ciblé pour les modifications de génération d’images :

  ```bash
  openclaw infer image providers --json
  openclaw infer image generate \
    --model google/gemini-3.1-flash-image-preview \
    --prompt "Minimal flat test image: one blue square on a white background, no text." \
    --output ./openclaw-infer-image-smoke.png \
    --json
  ```

  La réponse indique `ok`, `provider`, `model`, `attempts` et les chemins des sorties écrites. Lorsque `--output` est défini, l’extension finale peut correspondre au type MIME renvoyé par le fournisseur.

- Pour `image describe` et `image describe-many`, utilisez `--prompt` afin de fournir une instruction propre à la tâche (OCR, comparaison, inspection d’interface utilisateur, légendage concis).
- Utilisez `--timeout-ms` pour les modèles de vision locaux lents ou les démarrages à froid d’Ollama.
- Pour `image describe`, un `--model` explicite (qui doit être un `<provider/model>` compatible avec les images) est exécuté en premier, puis les modèles de repli configurés dans `agents.defaults.imageModel.fallbacks` sont essayés si cet appel échoue. Les erreurs de préparation des entrées (fichier manquant, URL non prise en charge) provoquent un échec avant toute tentative de repli, et le modèle doit être déclaré compatible avec les images dans le catalogue de modèles ou la configuration du fournisseur.
- Pour les modèles de vision Ollama locaux, téléchargez d’abord le modèle et définissez `OLLAMA_API_KEY` sur une valeur fictive quelconque, par exemple `ollama-local`. Consultez [Ollama](/fr/providers/ollama#vision-and-image-description).

## Audio

Transcription de fichiers (et non gestion de sessions en temps réel).

```bash
openclaw infer audio transcribe --file ./memo.m4a --json
openclaw infer audio transcribe --file ./team-sync.m4a --language en --prompt "Focus on names and action items" --json
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

`--model` doit être au format `<provider/model>`.

## TTS

Synthèse vocale et état du fournisseur/personnage TTS.

```bash
openclaw infer tts convert --text "hello from openclaw" --output ./hello.mp3 --json
openclaw infer tts convert --text "Your build is complete" --output ./build-complete.mp3 --json
openclaw infer tts providers --json
openclaw infer tts personas --json
openclaw infer tts status --json
```

Remarques :

- `tts status` prend uniquement en charge `--gateway` (il reflète l’état TTS géré par le Gateway).
- Utilisez `tts providers`, `tts voices`, `tts personas`, `tts set-provider` et `tts set-persona` pour inspecter et configurer le comportement TTS.

## Vidéo

Génération et description.

```bash
openclaw infer video generate --prompt "cinematic sunset over the ocean" --json
openclaw infer video generate --prompt "slow drone shot over a forest lake" --resolution 768P --duration 6 --json
openclaw infer video describe --file ./clip.mp4 --json
openclaw infer video describe --file ./clip.mp4 --model openai/gpt-5.4-mini --json
```

Remarques :

- `video generate` accepte `--size`, `--aspect-ratio`, `--resolution`, `--duration`, `--audio`, `--watermark` et `--timeout-ms`, qui sont transmis à l’environnement d’exécution de génération vidéo.
- Pour `video describe`, `--model` doit être au format `<provider/model>`.

## Web

Recherche et récupération.

```bash
openclaw infer web search --query "OpenClaw docs" --json
openclaw infer web search --query "OpenClaw infer web providers" --json
openclaw infer web fetch --url https://docs.openclaw.ai/cli/infer --json
openclaw infer web providers --json
```

`web providers` répertorie les fournisseurs disponibles, configurés et sélectionnés pour la recherche et la récupération.

## Incorporation

Création de vecteurs et inspection des fournisseurs d’incorporations.

```bash
openclaw infer embedding create --text "friendly lobster" --json
openclaw infer embedding create --text "customer support ticket: delayed shipment" --model openai/text-embedding-3-large --json
openclaw infer embedding providers --json
```

## Sortie JSON

Les commandes Infer normalisent la sortie JSON dans une enveloppe commune :

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

Champs de premier niveau stables :

- `ok`
- `capability`
- `transport`
- `provider`
- `model`
- `attempts`
- `inputs` (pièces jointes d’image envoyées avec la requête, le cas échéant)
- `outputs`
- `ignoredOverrides` (clés d’indication qu’un fournisseur ne prend pas en charge, le cas échéant)
- `error`

Pour les commandes de génération de médias, `outputs` contient les fichiers écrits par OpenClaw. Pour l’automatisation, utilisez les champs `path`, `mimeType`, `size` et toutes les dimensions propres au média présentes dans ce tableau, plutôt que d’analyser la sortie standard lisible par l’utilisateur.

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

## Ressources connexes

- [Référence de la CLI](/fr/cli)
- [Modèles](/fr/concepts/models)
