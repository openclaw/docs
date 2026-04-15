---
read_when:
    - Génération de vidéos via l’agent
    - Configuration des fournisseurs et des modèles de génération de vidéos
    - Comprendre les paramètres de l’outil `video_generate`
summary: Générez des vidéos à partir de texte, d’images ou de vidéos existantes à l’aide de 14 backends de fournisseurs
title: Génération de vidéos
x-i18n:
    generated_at: "2026-04-15T06:57:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: c182f24b25e44f157a820e82a1f7422247f26125956944b5eb98613774268cfe
    source_path: tools/video-generation.md
    workflow: 15
---

# Génération de vidéos

Les agents OpenClaw peuvent générer des vidéos à partir d’invites textuelles, d’images de référence ou de vidéos existantes. Quatorze backends de fournisseurs sont pris en charge, chacun avec des options de modèle, des modes d’entrée et des ensembles de fonctionnalités différents. L’agent choisit automatiquement le bon fournisseur en fonction de votre configuration et des clés API disponibles.

<Note>
L’outil `video_generate` n’apparaît que lorsqu’au moins un fournisseur de génération vidéo est disponible. Si vous ne le voyez pas dans les outils de votre agent, définissez une clé API de fournisseur ou configurez `agents.defaults.videoGenerationModel`.
</Note>

OpenClaw traite la génération vidéo selon trois modes d’exécution :

- `generate` pour les requêtes de génération texte-vers-vidéo sans média de référence
- `imageToVideo` lorsque la requête inclut une ou plusieurs images de référence
- `videoToVideo` lorsque la requête inclut une ou plusieurs vidéos de référence

Les fournisseurs peuvent prendre en charge n’importe quel sous-ensemble de ces modes. L’outil valide le mode actif avant l’envoi et signale les modes pris en charge dans `action=list`.

## Démarrage rapide

1. Définissez une clé API pour n’importe quel fournisseur pris en charge :

```bash
export GEMINI_API_KEY="your-key"
```

2. Épinglez éventuellement un modèle par défaut :

```bash
openclaw config set agents.defaults.videoGenerationModel.primary "google/veo-3.1-fast-generate-preview"
```

3. Demandez à l’agent :

> Génère une vidéo cinématique de 5 secondes d’un homard amical faisant du surf au coucher du soleil.

L’agent appelle automatiquement `video_generate`. Aucune liste d’autorisation d’outils n’est nécessaire.

## Ce qui se passe lorsque vous générez une vidéo

La génération vidéo est asynchrone. Lorsque l’agent appelle `video_generate` dans une session :

1. OpenClaw envoie la requête au fournisseur et renvoie immédiatement un ID de tâche.
2. Le fournisseur traite la tâche en arrière-plan (généralement de 30 secondes à 5 minutes selon le fournisseur et la résolution).
3. Lorsque la vidéo est prête, OpenClaw réveille la même session avec un événement de fin interne.
4. L’agent publie la vidéo terminée dans la conversation d’origine.

Pendant qu’une tâche est en cours, les appels `video_generate` en double dans la même session renvoient l’état actuel de la tâche au lieu de démarrer une nouvelle génération. Utilisez `openclaw tasks list` ou `openclaw tasks show <taskId>` pour vérifier la progression depuis la CLI.

En dehors des exécutions d’agent adossées à une session (par exemple, les invocations directes d’outils), l’outil revient à une génération inline et renvoie le chemin final du média dans le même tour.

### Cycle de vie de la tâche

Chaque requête `video_generate` passe par quatre états :

1. **queued** -- tâche créée, en attente que le fournisseur l’accepte.
2. **running** -- le fournisseur traite la requête (généralement de 30 secondes à 5 minutes selon le fournisseur et la résolution).
3. **succeeded** -- vidéo prête ; l’agent se réveille et la publie dans la conversation.
4. **failed** -- erreur du fournisseur ou expiration ; l’agent se réveille avec les détails de l’erreur.

Vérifiez l’état depuis la CLI :

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

Prévention des doublons : si une tâche vidéo est déjà `queued` ou `running` pour la session actuelle, `video_generate` renvoie l’état de la tâche existante au lieu d’en démarrer une nouvelle. Utilisez `action: "status"` pour vérifier explicitement sans déclencher une nouvelle génération.

## Fournisseurs pris en charge

| Fournisseur           | Modèle par défaut               | Texte | Image de référence                                  | Vidéo de référence | Clé API                                  |
| --------------------- | ------------------------------- | ----- | --------------------------------------------------- | ------------------ | ---------------------------------------- |
| Alibaba               | `wan2.6-t2v`                    | Oui   | Oui (URL distante)                                  | Oui (URL distante) | `MODELSTUDIO_API_KEY`                    |
| BytePlus (1.0)        | `seedance-1-0-pro-250528`       | Oui   | Jusqu’à 2 images (modèles I2V uniquement ; première et dernière image) | Non                | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 1.5 | `seedance-1-5-pro-251215`       | Oui   | Jusqu’à 2 images (première et dernière image via rôle) | Non             | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 2.0 | `dreamina-seedance-2-0-260128`  | Oui   | Jusqu’à 9 images de référence                       | Jusqu’à 3 vidéos   | `BYTEPLUS_API_KEY`                       |
| ComfyUI               | `workflow`                      | Oui   | 1 image                                             | Non                | `COMFY_API_KEY` ou `COMFY_CLOUD_API_KEY` |
| fal                   | `fal-ai/minimax/video-01-live`  | Oui   | 1 image                                             | Non                | `FAL_KEY`                                |
| Google                | `veo-3.1-fast-generate-preview` | Oui   | 1 image                                             | 1 vidéo            | `GEMINI_API_KEY`                         |
| MiniMax               | `MiniMax-Hailuo-2.3`            | Oui   | 1 image                                             | Non                | `MINIMAX_API_KEY`                        |
| OpenAI                | `sora-2`                        | Oui   | 1 image                                             | 1 vidéo            | `OPENAI_API_KEY`                         |
| Qwen                  | `wan2.6-t2v`                    | Oui   | Oui (URL distante)                                  | Oui (URL distante) | `QWEN_API_KEY`                           |
| Runway                | `gen4.5`                        | Oui   | 1 image                                             | 1 vidéo            | `RUNWAYML_API_SECRET`                    |
| Together              | `Wan-AI/Wan2.2-T2V-A14B`        | Oui   | 1 image                                             | Non                | `TOGETHER_API_KEY`                       |
| Vydra                 | `veo3`                          | Oui   | 1 image (`kling`)                                   | Non                | `VYDRA_API_KEY`                          |
| xAI                   | `grok-imagine-video`            | Oui   | 1 image                                             | 1 vidéo            | `XAI_API_KEY`                            |

Certains fournisseurs acceptent des variables d’environnement de clé API supplémentaires ou alternatives. Consultez les [pages des fournisseurs](#related) individuelles pour plus de détails.

Exécutez `video_generate action=list` pour inspecter à l’exécution les fournisseurs, modèles et modes d’exécution disponibles.

### Matrice des capacités déclarées

Il s’agit du contrat de mode explicite utilisé par `video_generate`, les tests de contrat et le balayage live partagé.

| Fournisseur | `generate` | `imageToVideo` | `videoToVideo` | Canaux live partagés actuels                                                                                                            |
| ----------- | ---------- | -------------- | -------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Alibaba     | Oui        | Oui            | Oui            | `generate`, `imageToVideo` ; `videoToVideo` ignoré parce que ce fournisseur exige des URL vidéo distantes `http(s)`                    |
| BytePlus    | Oui        | Oui            | Non            | `generate`, `imageToVideo`                                                                                                              |
| ComfyUI     | Oui        | Oui            | Non            | Pas dans le balayage partagé ; la couverture spécifique au workflow se trouve dans les tests ComfyUI                                   |
| fal         | Oui        | Oui            | Non            | `generate`, `imageToVideo`                                                                                                              |
| Google      | Oui        | Oui            | Oui            | `generate`, `imageToVideo` ; `videoToVideo` partagé ignoré parce que le balayage Gemini/Veo actuel adossé à un buffer n’accepte pas cette entrée |
| MiniMax     | Oui        | Oui            | Non            | `generate`, `imageToVideo`                                                                                                              |
| OpenAI      | Oui        | Oui            | Oui            | `generate`, `imageToVideo` ; `videoToVideo` partagé ignoré parce que ce chemin org/entrée exige actuellement un accès inpaint/remix côté fournisseur |
| Qwen        | Oui        | Oui            | Oui            | `generate`, `imageToVideo` ; `videoToVideo` ignoré parce que ce fournisseur exige des URL vidéo distantes `http(s)`                    |
| Runway      | Oui        | Oui            | Oui            | `generate`, `imageToVideo` ; `videoToVideo` ne s’exécute que lorsque le modèle sélectionné est `runway/gen4_aleph`                     |
| Together    | Oui        | Oui            | Non            | `generate`, `imageToVideo`                                                                                                              |
| Vydra       | Oui        | Oui            | Non            | `generate` ; `imageToVideo` partagé ignoré parce que le `veo3` fourni est texte uniquement et que le `kling` fourni exige une URL d’image distante |
| xAI         | Oui        | Oui            | Oui            | `generate`, `imageToVideo` ; `videoToVideo` ignoré parce que ce fournisseur exige actuellement une URL MP4 distante                     |

## Paramètres de l’outil

### Obligatoire

| Paramètre | Type   | Description                                                                    |
| --------- | ------ | ------------------------------------------------------------------------------ |
| `prompt`  | string | Description textuelle de la vidéo à générer (obligatoire pour `action: "generate"`) |

### Entrées de contenu

| Paramètre    | Type     | Description                                                                                                                              |
| ------------ | -------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `image`      | string   | Image de référence unique (chemin ou URL)                                                                                                |
| `images`     | string[] | Plusieurs images de référence (jusqu’à 9)                                                                                                |
| `imageRoles` | string[] | Indications de rôle facultatives par position parallèles à la liste d’images combinée. Valeurs canoniques : `first_frame`, `last_frame`, `reference_image` |
| `video`      | string   | Vidéo de référence unique (chemin ou URL)                                                                                                |
| `videos`     | string[] | Plusieurs vidéos de référence (jusqu’à 4)                                                                                                |
| `videoRoles` | string[] | Indications de rôle facultatives par position parallèles à la liste de vidéos combinée. Valeur canonique : `reference_video`            |
| `audioRef`   | string   | Audio de référence unique (chemin ou URL). Utilisé par exemple pour une musique de fond ou une référence vocale lorsque le fournisseur prend en charge les entrées audio |
| `audioRefs`  | string[] | Plusieurs audios de référence (jusqu’à 3)                                                                                                |
| `audioRoles` | string[] | Indications de rôle facultatives par position parallèles à la liste d’audios combinée. Valeur canonique : `reference_audio`            |

Les indications de rôle sont transmises telles quelles au fournisseur. Les valeurs canoniques proviennent de l’union `VideoGenerationAssetRole`, mais les fournisseurs peuvent accepter des chaînes de rôle supplémentaires. Les tableaux `*Roles` ne doivent pas contenir plus d’entrées que la liste de références correspondante ; les erreurs de décalage d’un élément échouent avec un message clair. Utilisez une chaîne vide pour laisser une position non définie.

### Contrôles de style

| Paramètre        | Type    | Description                                                                                  |
| ---------------- | ------- | -------------------------------------------------------------------------------------------- |
| `aspectRatio`    | string  | `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9` ou `adaptive`      |
| `resolution`     | string  | `480P`, `720P`, `768P` ou `1080P`                                                            |
| `durationSeconds`| number  | Durée cible en secondes (arrondie à la valeur prise en charge la plus proche par le fournisseur) |
| `size`           | string  | Indication de taille lorsque le fournisseur la prend en charge                               |
| `audio`          | boolean | Active l’audio généré dans la sortie lorsque c’est pris en charge. Distinct de `audioRef*` (entrées) |
| `watermark`      | boolean | Active ou désactive le filigrane du fournisseur lorsque c’est pris en charge                 |

`adaptive` est une valeur sentinelle spécifique au fournisseur : elle est transmise telle quelle aux fournisseurs qui déclarent `adaptive` dans leurs capacités (par exemple, BytePlus Seedance l’utilise pour détecter automatiquement le ratio à partir des dimensions de l’image d’entrée). Les fournisseurs qui ne la déclarent pas exposent la valeur via `details.ignoredOverrides` dans le résultat de l’outil afin que son omission soit visible.

### Avancé

| Paramètre        | Type   | Description                                                                                                                                                                                                                                                                                                                                                   |
| ---------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `action`         | string | `"generate"` (par défaut), `"status"` ou `"list"`                                                                                                                                                                                                                                                                                                             |
| `model`          | string | Remplacement du fournisseur/modèle (par exemple `runway/gen4.5`)                                                                                                                                                                                                                                                                                              |
| `filename`       | string | Indication de nom de fichier de sortie                                                                                                                                                                                                                                                                                                                         |
| `providerOptions`| object | Options spécifiques au fournisseur sous forme d’objet JSON (par exemple `{"seed": 42, "draft": true}`). Les fournisseurs qui déclarent un schéma typé valident les clés et les types ; les clés inconnues ou les incompatibilités font ignorer le candidat lors du fallback. Les fournisseurs sans schéma déclaré reçoivent les options telles quelles. Exécutez `video_generate action=list` pour voir ce que chaque fournisseur accepte |

Tous les fournisseurs ne prennent pas en charge tous les paramètres. OpenClaw normalise déjà la durée vers la valeur prise en charge la plus proche par le fournisseur, et remappe également les indications géométriques traduites, comme size-vers-aspect-ratio, lorsqu’un fournisseur de secours expose une surface de contrôle différente. Les remplacements réellement non pris en charge sont ignorés dans la mesure du possible et signalés comme avertissements dans le résultat de l’outil. Les limites strictes de capacité (comme un trop grand nombre d’entrées de référence) échouent avant l’envoi.

Les résultats de l’outil indiquent les paramètres appliqués. Lorsque OpenClaw remappe la durée ou la géométrie pendant le fallback du fournisseur, les valeurs renvoyées `durationSeconds`, `size`, `aspectRatio` et `resolution` reflètent ce qui a été envoyé, et `details.normalization` capture la traduction entre la demande et ce qui a été appliqué.

Les entrées de référence sélectionnent également le mode d’exécution :

- Aucun média de référence : `generate`
- Toute image de référence : `imageToVideo`
- Toute vidéo de référence : `videoToVideo`
- Les entrées audio de référence ne modifient pas le mode résolu ; elles s’appliquent par-dessus le mode sélectionné par les références image/vidéo, et ne fonctionnent qu’avec les fournisseurs qui déclarent `maxInputAudios`

Les références d’image et de vidéo mixtes ne constituent pas une surface de capacité partagée stable.
Préférez un seul type de référence par requête.

#### Fallback et options typées

Certaines vérifications de capacité sont appliquées au niveau du fallback plutôt qu’à la frontière de l’outil afin qu’une requête qui dépasse les limites du fournisseur principal puisse tout de même s’exécuter sur un fournisseur de secours capable :

- Si le candidat actif ne déclare pas de `maxInputAudios` (ou le déclare à `0`), il est ignoré lorsque la requête contient des références audio, et le candidat suivant est essayé.
- Si le `maxDurationSeconds` du candidat actif est inférieur au `durationSeconds` demandé et que le candidat ne déclare pas de liste `supportedDurationSeconds`, il est ignoré.
- Si la requête contient `providerOptions` et que le candidat actif déclare explicitement un schéma typé `providerOptions`, le candidat est ignoré lorsque les clés fournies ne figurent pas dans le schéma ou que les types de valeur ne correspondent pas. Les fournisseurs qui n’ont pas encore déclaré de schéma reçoivent les options telles quelles (transmission compatible avec l’existant). Un fournisseur peut explicitement refuser toutes les options de fournisseur en déclarant un schéma vide (`capabilities.providerOptions: {}`), ce qui provoque le même comportement d’ignorance qu’une incompatibilité de type.

La première raison d’ignorance dans une requête est journalisée au niveau `warn` afin que les opérateurs voient quand leur fournisseur principal a été ignoré ; les ignorances suivantes sont journalisées au niveau `debug` pour éviter le bruit dans les longues chaînes de fallback. Si tous les candidats sont ignorés, l’erreur agrégée inclut la raison d’ignorance de chacun.

## Actions

- **generate** (par défaut) -- crée une vidéo à partir de l’invite donnée et d’entrées de référence facultatives.
- **status** -- vérifie l’état de la tâche vidéo en cours pour la session actuelle sans démarrer une autre génération.
- **list** -- affiche les fournisseurs, modèles et leurs capacités disponibles.

## Sélection du modèle

Lors de la génération d’une vidéo, OpenClaw résout le modèle dans cet ordre :

1. **Paramètre d’outil `model`** -- si l’agent en spécifie un dans l’appel.
2. **`videoGenerationModel.primary`** -- depuis la configuration.
3. **`videoGenerationModel.fallbacks`** -- essayés dans l’ordre.
4. **Détection automatique** -- utilise les fournisseurs qui ont une authentification valide, en commençant par le fournisseur par défaut actuel, puis les fournisseurs restants par ordre alphabétique.

Si un fournisseur échoue, le candidat suivant est essayé automatiquement. Si tous les candidats échouent, l’erreur inclut les détails de chaque tentative.

Définissez `agents.defaults.mediaGenerationAutoProviderFallback: false` si vous souhaitez que la génération vidéo utilise uniquement les entrées explicites `model`, `primary` et `fallbacks`.

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "google/veo-3.1-fast-generate-preview",
        fallbacks: ["runway/gen4.5", "qwen/wan2.6-t2v"],
      },
    },
  },
}
```

## Notes sur les fournisseurs

| Fournisseur           | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Alibaba               | Utilise le endpoint asynchrone DashScope/Model Studio. Les images et vidéos de référence doivent être des URL distantes `http(s)`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| BytePlus (1.0)        | ID du fournisseur `byteplus`. Modèles : `seedance-1-0-pro-250528` (par défaut), `seedance-1-0-pro-t2v-250528`, `seedance-1-0-pro-fast-251015`, `seedance-1-0-lite-t2v-250428`, `seedance-1-0-lite-i2v-250428`. Les modèles T2V (`*-t2v-*`) n’acceptent pas les entrées d’image ; les modèles I2V et les modèles généraux `*-pro-*` prennent en charge une seule image de référence (première image). Passez l’image par position ou définissez `role: "first_frame"`. Les ID de modèle T2V sont automatiquement remplacés par la variante I2V correspondante lorsqu’une image est fournie. Clés `providerOptions` prises en charge : `seed` (number), `draft` (boolean, force le 480p), `camera_fixed` (boolean). |
| BytePlus Seedance 1.5 | Nécessite le Plugin [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark). ID du fournisseur `byteplus-seedance15`. Modèle : `seedance-1-5-pro-251215`. Utilise l’API unifiée `content[]`. Prend en charge au maximum 2 images d’entrée (first_frame + last_frame). Toutes les entrées doivent être des URL distantes `https://`. Définissez `role: "first_frame"` / `"last_frame"` sur chaque image, ou passez les images par position. `aspectRatio: "adaptive"` détecte automatiquement le ratio à partir de l’image d’entrée. `audio: true` est mappé vers `generate_audio`. `providerOptions.seed` (number) est transmis.                                                                 |
| BytePlus Seedance 2.0 | Nécessite le Plugin [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark). ID du fournisseur `byteplus-seedance2`. Modèles : `dreamina-seedance-2-0-260128`, `dreamina-seedance-2-0-fast-260128`. Utilise l’API unifiée `content[]`. Prend en charge jusqu’à 9 images de référence, 3 vidéos de référence et 3 audios de référence. Toutes les entrées doivent être des URL distantes `https://`. Définissez `role` sur chaque ressource — valeurs prises en charge : `"first_frame"`, `"last_frame"`, `"reference_image"`, `"reference_video"`, `"reference_audio"`. `aspectRatio: "adaptive"` détecte automatiquement le ratio à partir de l’image d’entrée. `audio: true` est mappé vers `generate_audio`. `providerOptions.seed` (number) est transmis. |
| ComfyUI               | Exécution locale ou cloud pilotée par workflow. Prend en charge le texte-vers-vidéo et l’image-vers-vidéo via le graphe configuré.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| fal                   | Utilise un flux adossé à une file d’attente pour les tâches longues. Une seule image de référence uniquement.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| Google                | Utilise Gemini/Veo. Prend en charge une image ou une vidéo de référence.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| MiniMax               | Une seule image de référence uniquement.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| OpenAI                | Seul le remplacement `size` est transmis. Les autres remplacements de style (`aspectRatio`, `resolution`, `audio`, `watermark`) sont ignorés avec un avertissement.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| Qwen                  | Même backend DashScope qu’Alibaba. Les entrées de référence doivent être des URL distantes `http(s)` ; les fichiers locaux sont rejetés d’emblée.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| Runway                | Prend en charge les fichiers locaux via des URI de données. Le mode vidéo-vers-vidéo nécessite `runway/gen4_aleph`. Les exécutions texte uniquement exposent les ratios `16:9` et `9:16`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| Together              | Une seule image de référence uniquement.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| Vydra                 | Utilise directement `https://www.vydra.ai/api/v1` pour éviter les redirections qui perdent l’authentification. `veo3` est fourni uniquement en texte-vers-vidéo ; `kling` exige une URL d’image distante.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| xAI                   | Prend en charge le texte-vers-vidéo, l’image-vers-vidéo et les flux distants d’édition/extension vidéo.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |

## Modes de capacité des fournisseurs

Le contrat partagé de génération vidéo permet désormais aux fournisseurs de déclarer des capacités spécifiques à chaque mode au lieu de simples limites globales. Les nouvelles implémentations de fournisseurs devraient privilégier des blocs de mode explicites :

```typescript
capabilities: {
  generate: {
    maxVideos: 1,
    maxDurationSeconds: 10,
    supportsResolution: true,
  },
  imageToVideo: {
    enabled: true,
    maxVideos: 1,
    maxInputImages: 1,
    maxDurationSeconds: 5,
  },
  videoToVideo: {
    enabled: true,
    maxVideos: 1,
    maxInputVideos: 1,
    maxDurationSeconds: 5,
  },
}
```

Les champs globaux agrégés tels que `maxInputImages` et `maxInputVideos` ne suffisent pas à annoncer la prise en charge des modes de transformation. Les fournisseurs doivent déclarer explicitement `generate`, `imageToVideo` et `videoToVideo` afin que les tests live, les tests de contrat et l’outil partagé `video_generate` puissent valider la prise en charge des modes de manière déterministe.

## Tests live

Couverture live facultative pour les fournisseurs groupés partagés :

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts
```

Wrapper du dépôt :

```bash
pnpm test:live:media video
```

Ce fichier live charge les variables d’environnement de fournisseur manquantes depuis `~/.profile`, privilégie par défaut les clés API live/env par rapport aux profils d’authentification stockés, et exécute par défaut un smoke test compatible publication :

- `generate` pour chaque fournisseur autre que FAL dans le balayage
- invite de homard d’une seconde
- plafond d’opération par fournisseur défini par `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS`
  (`180000` par défaut)

FAL est facultatif, car la latence de file d’attente côté fournisseur peut dominer le temps de publication :

```bash
pnpm test:live:media video --video-providers fal
```

Définissez `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` pour exécuter aussi les modes de transformation déclarés que le balayage partagé peut exercer en toute sécurité avec des médias locaux :

- `imageToVideo` lorsque `capabilities.imageToVideo.enabled`
- `videoToVideo` lorsque `capabilities.videoToVideo.enabled` et que le fournisseur/modèle accepte une entrée vidéo locale adossée à un buffer dans le balayage partagé

Aujourd’hui, le canal live partagé `videoToVideo` couvre :

- `runway` uniquement lorsque vous sélectionnez `runway/gen4_aleph`

## Configuration

Définissez le modèle de génération vidéo par défaut dans votre configuration OpenClaw :

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "qwen/wan2.6-t2v",
        fallbacks: ["qwen/wan2.6-r2v-flash"],
      },
    },
  },
}
```

Ou via la CLI :

```bash
openclaw config set agents.defaults.videoGenerationModel.primary "qwen/wan2.6-t2v"
```

## Voir aussi

- [Vue d’ensemble des outils](/fr/tools)
- [Tâches en arrière-plan](/fr/automation/tasks) -- suivi des tâches pour la génération vidéo asynchrone
- [Alibaba Model Studio](/fr/providers/alibaba)
- [BytePlus](/fr/concepts/model-providers#byteplus-international)
- [ComfyUI](/fr/providers/comfy)
- [fal](/fr/providers/fal)
- [Google (Gemini)](/fr/providers/google)
- [MiniMax](/fr/providers/minimax)
- [OpenAI](/fr/providers/openai)
- [Qwen](/fr/providers/qwen)
- [Runway](/fr/providers/runway)
- [Together AI](/fr/providers/together)
- [Vydra](/fr/providers/vydra)
- [xAI](/fr/providers/xai)
- [Référence de configuration](/fr/gateway/configuration-reference#agent-defaults)
- [Modèles](/fr/concepts/models)
