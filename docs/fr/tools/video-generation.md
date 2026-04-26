---
read_when:
    - Générer des vidéos via l’agent
    - Configurer les fournisseurs et modèles de génération vidéo
    - Comprendre les paramètres de l’outil `video_generate`
sidebarTitle: Video generation
summary: Générer des vidéos via `video_generate` à partir de texte, de références d’image ou de vidéo sur 14 backends fournisseurs
title: Génération de vidéos
x-i18n:
    generated_at: "2026-04-26T11:41:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: b70f4d47318c822f06d979308a0e1fce87de40be9c213f64b4c815dcedba944b
    source_path: tools/video-generation.md
    workflow: 15
---

OpenClaw peut générer des vidéos à partir de prompts textuels, d’images de référence ou de
vidéos existantes. Quatorze backends fournisseurs sont pris en charge, chacun avec
des options de modèle, des modes d’entrée et des ensembles de fonctionnalités différents. L’agent choisit automatiquement le
bon fournisseur en fonction de votre configuration et des clés API disponibles.

<Note>
L’outil `video_generate` n’apparaît que lorsqu’au moins un fournisseur de génération vidéo
est disponible. Si vous ne le voyez pas dans les outils de votre agent, définissez une
clé API de fournisseur ou configurez `agents.defaults.videoGenerationModel`.
</Note>

OpenClaw traite la génération vidéo selon trois modes d’exécution :

- `generate` — requêtes de génération de vidéo à partir de texte sans média de référence.
- `imageToVideo` — la requête inclut une ou plusieurs images de référence.
- `videoToVideo` — la requête inclut une ou plusieurs vidéos de référence.

Les fournisseurs peuvent prendre en charge n’importe quel sous-ensemble de ces modes. L’outil valide le
mode actif avant l’envoi et signale les modes pris en charge dans `action=list`.

## Démarrage rapide

<Steps>
  <Step title="Configurer l’authentification">
    Définissez une clé API pour n’importe quel fournisseur pris en charge :

    ```bash
    export GEMINI_API_KEY="your-key"
    ```

  </Step>
  <Step title="Choisir un modèle par défaut (facultatif)">
    ```bash
    openclaw config set agents.defaults.videoGenerationModel.primary "google/veo-3.1-fast-generate-preview"
    ```
  </Step>
  <Step title="Demander à l’agent">
    > Génère une vidéo cinématographique de 5 secondes d’un homard sympathique faisant du surf au coucher du soleil.

    L’agent appelle automatiquement `video_generate`. Aucun allowlisting d’outil
    n’est nécessaire.

  </Step>
</Steps>

## Fonctionnement de la génération asynchrone

La génération vidéo est asynchrone. Lorsque l’agent appelle `video_generate` dans une
session :

1. OpenClaw soumet la requête au fournisseur et renvoie immédiatement un identifiant de tâche.
2. Le fournisseur traite le job en arrière-plan (généralement de 30 secondes à 5 minutes selon le fournisseur et la résolution).
3. Lorsque la vidéo est prête, OpenClaw réactive la même session avec un événement interne de fin.
4. L’agent republie la vidéo terminée dans la conversation d’origine.

Pendant qu’un job est en cours, les appels `video_generate` en double dans la même
session renvoient l’état actuel de la tâche au lieu de démarrer une autre
génération. Utilisez `openclaw tasks list` ou `openclaw tasks show <taskId>` pour
vérifier la progression depuis la CLI.

En dehors des exécutions d’agent adossées à une session (par exemple, des invocations directes d’outil),
l’outil revient à une génération en ligne et renvoie le chemin du média final
dans le même tour.

Les fichiers vidéo générés sont enregistrés dans le stockage média géré par OpenClaw lorsque
le fournisseur renvoie des octets. La limite par défaut de sauvegarde des vidéos générées suit
la limite des médias vidéo, et `agents.defaults.mediaMaxMb` l’augmente pour
les rendus plus volumineux. Lorsqu’un fournisseur renvoie aussi une URL de sortie hébergée, OpenClaw
peut fournir cette URL au lieu d’échouer la tâche si la persistance locale
rejette un fichier trop volumineux.

### Cycle de vie de la tâche

| État        | Signification                                                                                   |
| ----------- | ----------------------------------------------------------------------------------------------- |
| `queued`    | Tâche créée, en attente que le fournisseur l’accepte.                                          |
| `running`   | Le fournisseur traite la tâche (généralement de 30 secondes à 5 minutes selon le fournisseur et la résolution). |
| `succeeded` | Vidéo prête ; l’agent se réactive et la publie dans la conversation.                            |
| `failed`    | Erreur du fournisseur ou délai d’expiration ; l’agent se réactive avec les détails de l’erreur. |

Vérifiez l’état depuis la CLI :

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

Si une tâche vidéo est déjà à l’état `queued` ou `running` pour la session en cours,
`video_generate` renvoie l’état de la tâche existante au lieu d’en démarrer une
nouvelle. Utilisez `action: "status"` pour vérifier explicitement sans déclencher une nouvelle
génération.

## Fournisseurs pris en charge

| Fournisseur          | Modèle par défaut               | Texte | Image de référence                                  | Vidéo de référence                              | Authentification                         |
| -------------------- | ------------------------------- | :---: | --------------------------------------------------- | ----------------------------------------------- | ---------------------------------------- |
| Alibaba              | `wan2.6-t2v`                    |  ✓    | Oui (URL distante)                                  | Oui (URL distante)                              | `MODELSTUDIO_API_KEY`                    |
| BytePlus (1.0)       | `seedance-1-0-pro-250528`       |  ✓    | Jusqu’à 2 images (modèles I2V uniquement ; première + dernière image) | —                                   | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 1.5 | `seedance-1-5-pro-251215`      |  ✓    | Jusqu’à 2 images (première + dernière image via rôle) | —                                             | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 2.0 | `dreamina-seedance-2-0-260128` |  ✓    | Jusqu’à 9 images de référence                       | Jusqu’à 3 vidéos                                | `BYTEPLUS_API_KEY`                       |
| ComfyUI              | `workflow`                      |  ✓    | 1 image                                             | —                                               | `COMFY_API_KEY` ou `COMFY_CLOUD_API_KEY` |
| fal                  | `fal-ai/minimax/video-01-live`  |  ✓    | 1 image ; jusqu’à 9 avec Seedance reference-to-video | Jusqu’à 3 vidéos avec Seedance reference-to-video | `FAL_KEY`                              |
| Google               | `veo-3.1-fast-generate-preview` |  ✓    | 1 image                                             | 1 vidéo                                         | `GEMINI_API_KEY`                         |
| MiniMax              | `MiniMax-Hailuo-2.3`            |  ✓    | 1 image                                             | —                                               | `MINIMAX_API_KEY` ou OAuth MiniMax       |
| OpenAI               | `sora-2`                        |  ✓    | 1 image                                             | 1 vidéo                                         | `OPENAI_API_KEY`                         |
| Qwen                 | `wan2.6-t2v`                    |  ✓    | Oui (URL distante)                                  | Oui (URL distante)                              | `QWEN_API_KEY`                           |
| Runway               | `gen4.5`                        |  ✓    | 1 image                                             | 1 vidéo                                         | `RUNWAYML_API_SECRET`                    |
| Together             | `Wan-AI/Wan2.2-T2V-A14B`        |  ✓    | 1 image                                             | —                                               | `TOGETHER_API_KEY`                       |
| Vydra                | `veo3`                          |  ✓    | 1 image (`kling`)                                   | —                                               | `VYDRA_API_KEY`                          |
| xAI                  | `grok-imagine-video`            |  ✓    | 1 image de première image ou jusqu’à 7 `reference_image`s | 1 vidéo                                  | `XAI_API_KEY`                            |

Certains fournisseurs acceptent des variables d’environnement de clé API supplémentaires ou alternatives. Consultez
les [pages fournisseur](#related) individuelles pour plus de détails.

Exécutez `video_generate action=list` pour inspecter les fournisseurs, modèles et
modes d’exécution disponibles au moment de l’exécution.

### Matrice des capacités

Le contrat de mode explicite utilisé par `video_generate`, les tests de contrat et
la suite partagée live :

| Fournisseur | `generate` | `imageToVideo` | `videoToVideo` | Voies live partagées aujourd’hui                                                                                                         |
| ----------- | :--------: | :------------: | :------------: | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Alibaba     |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo` ; `videoToVideo` ignoré car ce fournisseur nécessite des URL vidéo distantes `http(s)`                      |
| BytePlus    |     ✓      |       ✓        |       —        | `generate`, `imageToVideo`                                                                                                               |
| ComfyUI     |     ✓      |       ✓        |       —        | Pas dans la suite partagée ; la couverture spécifique aux workflows se trouve avec les tests Comfy                                       |
| fal         |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo` ; `videoToVideo` uniquement lors de l’utilisation de Seedance reference-to-video                             |
| Google      |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo` ; `videoToVideo` partagé ignoré car la suite Gemini/Veo actuelle adossée à des buffers n’accepte pas cette entrée |
| MiniMax     |     ✓      |       ✓        |       —        | `generate`, `imageToVideo`                                                                                                               |
| OpenAI      |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo` ; `videoToVideo` partagé ignoré car ce chemin d’organisation/entrée nécessite actuellement un accès provider-side à inpaint/remix |
| Qwen        |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo` ; `videoToVideo` ignoré car ce fournisseur nécessite des URL vidéo distantes `http(s)`                      |
| Runway      |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo` ; `videoToVideo` s’exécute uniquement lorsque le modèle sélectionné est `runway/gen4_aleph`                 |
| Together    |     ✓      |       ✓        |       —        | `generate`, `imageToVideo`                                                                                                               |
| Vydra       |     ✓      |       ✓        |       —        | `generate` ; `imageToVideo` partagé ignoré car `veo3` groupé est limité au texte et `kling` groupé exige une URL d’image distante     |
| xAI         |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo` ; `videoToVideo` ignoré car ce fournisseur nécessite actuellement une URL MP4 distante                      |

## Paramètres de l’outil

### Obligatoires

<ParamField path="prompt" type="string" required>
  Description textuelle de la vidéo à générer. Obligatoire pour `action: "generate"`.
</ParamField>

### Entrées de contenu

<ParamField path="image" type="string">Image de référence unique (chemin ou URL).</ParamField>
<ParamField path="images" type="string[]">Images de référence multiples (jusqu’à 9).</ParamField>
<ParamField path="imageRoles" type="string[]">
Indices de rôle facultatifs par position, parallèles à la liste combinée d’images.
Valeurs canoniques : `first_frame`, `last_frame`, `reference_image`.
</ParamField>
<ParamField path="video" type="string">Vidéo de référence unique (chemin ou URL).</ParamField>
<ParamField path="videos" type="string[]">Vidéos de référence multiples (jusqu’à 4).</ParamField>
<ParamField path="videoRoles" type="string[]">
Indices de rôle facultatifs par position, parallèles à la liste combinée de vidéos.
Valeur canonique : `reference_video`.
</ParamField>
<ParamField path="audioRef" type="string">
Audio de référence unique (chemin ou URL). Utilisé pour la musique de fond ou comme référence vocale
lorsque le fournisseur prend en charge les entrées audio.
</ParamField>
<ParamField path="audioRefs" type="string[]">Audios de référence multiples (jusqu’à 3).</ParamField>
<ParamField path="audioRoles" type="string[]">
Indices de rôle facultatifs par position, parallèles à la liste combinée d’audios.
Valeur canonique : `reference_audio`.
</ParamField>

<Note>
Les indices de rôle sont transmis tels quels au fournisseur. Les valeurs canoniques proviennent
de l’union `VideoGenerationAssetRole`, mais les fournisseurs peuvent accepter des
chaînes de rôle supplémentaires. Les tableaux `*Roles` ne doivent pas comporter plus d’entrées que la
liste de références correspondante ; les erreurs de décalage d’un index échouent avec un message clair.
Utilisez une chaîne vide pour laisser un emplacement non défini. Pour xAI, définissez chaque rôle d’image sur
`reference_image` pour utiliser son mode de génération `reference_images` ; omettez le
rôle ou utilisez `first_frame` pour un image-to-video à image unique.
</Note>

### Contrôles de style

<ParamField path="aspectRatio" type="string">
  `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9`, ou `adaptive`.
</ParamField>
<ParamField path="resolution" type="string">`480P`, `720P`, `768P` ou `1080P`.</ParamField>
<ParamField path="durationSeconds" type="number">
  Durée cible en secondes (arrondie à la valeur prise en charge la plus proche par le fournisseur).
</ParamField>
<ParamField path="size" type="string">Indice de taille lorsque le fournisseur le prend en charge.</ParamField>
<ParamField path="audio" type="boolean">
  Active l’audio généré dans la sortie lorsque cela est pris en charge. Distinct de `audioRef*` (entrées).
</ParamField>
<ParamField path="watermark" type="boolean">Active ou désactive le filigrane du fournisseur lorsqu’il est pris en charge.</ParamField>

`adaptive` est une valeur sentinelle spécifique au fournisseur : elle est transmise telle quelle aux
fournisseurs qui déclarent `adaptive` dans leurs capacités (par ex. BytePlus
Seedance l’utilise pour détecter automatiquement le ratio à partir des dimensions
de l’image d’entrée). Les fournisseurs qui ne le déclarent pas exposent la valeur via
`details.ignoredOverrides` dans le résultat de l’outil afin que l’omission soit visible.

### Avancé

<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  `"status"` renvoie la tâche actuelle de la session ; `"list"` inspecte les fournisseurs.
</ParamField>
<ParamField path="model" type="string">Remplacement fournisseur/modèle (par ex. `runway/gen4.5`).</ParamField>
<ParamField path="filename" type="string">Indice de nom de fichier de sortie.</ParamField>
<ParamField path="timeoutMs" type="number">Délai d’expiration facultatif de la requête fournisseur en millisecondes.</ParamField>
<ParamField path="providerOptions" type="object">
  Options spécifiques au fournisseur sous forme d’objet JSON (par ex. `{"seed": 42, "draft": true}`).
  Les fournisseurs qui déclarent un schéma typé valident les clés et les types ; les clés inconnues
  ou incompatibilités font ignorer le candidat pendant le repli. Les fournisseurs sans
  schéma déclaré reçoivent les options telles quelles. Exécutez `video_generate action=list`
  pour voir ce que chaque fournisseur accepte.
</ParamField>

<Note>
Tous les fournisseurs ne prennent pas en charge tous les paramètres. OpenClaw normalise la durée vers
la valeur prise en charge la plus proche par le fournisseur, et remappe les indices géométriques
traduits comme la conversion taille-vers-ratio lorsqu’un fournisseur de repli expose une surface de contrôle différente. Les remplacements réellement non pris en charge sont ignorés au mieux
et signalés comme avertissements dans le résultat de l’outil. Les limites strictes de capacité
(comme trop d’entrées de référence) échouent avant l’envoi. Les résultats de l’outil
signalent les paramètres appliqués ; `details.normalization` capture toute
traduction entre valeur demandée et valeur appliquée.
</Note>

Les entrées de référence sélectionnent le mode d’exécution :

- Aucun média de référence → `generate`
- Toute image de référence → `imageToVideo`
- Toute vidéo de référence → `videoToVideo`
- Les entrées audio de référence **ne** changent **pas** le mode résolu ; elles s’appliquent
  en plus du mode sélectionné par les références image/vidéo, et ne fonctionnent
  qu’avec les fournisseurs qui déclarent `maxInputAudios`.

Les références mixtes image et vidéo ne constituent pas une surface de capacité partagée stable.
Préférez un seul type de référence par requête.

#### Repli et options typées

Certaines vérifications de capacité sont appliquées au niveau du repli plutôt qu’à la
frontière de l’outil, de sorte qu’une requête qui dépasse les limites du fournisseur principal peut
quand même s’exécuter sur un fournisseur de repli capable :

- Candidat actif déclarant aucun `maxInputAudios` (ou `0`) ignoré lorsque
  la requête contient des références audio ; le candidat suivant est essayé.
- `maxDurationSeconds` du candidat actif inférieur au `durationSeconds` demandé
  sans liste `supportedDurationSeconds` déclarée → ignoré.
- La requête contient `providerOptions` et le candidat actif déclare explicitement
  un schéma typé `providerOptions` → ignoré si les clés fournies ne figurent
  pas dans le schéma ou si les types de valeur ne correspondent pas. Les fournisseurs sans
  schéma déclaré reçoivent les options telles quelles (transmission
  rétrocompatible). Un fournisseur peut refuser toutes les options fournisseur en
  déclarant un schéma vide (`capabilities.providerOptions: {}`), ce qui
  provoque le même saut qu’une incompatibilité de type.

Le premier motif d’ignorance d’une requête est journalisé au niveau `warn` afin que les opérateurs voient quand
leur fournisseur principal a été ignoré ; les ignorances suivantes sont journalisées en `debug` pour
éviter le bruit des longues chaînes de repli. Si tous les candidats sont ignorés, l’
erreur agrégée inclut le motif d’ignorance pour chacun.

## Actions

| Action     | Ce qu’elle fait                                                                                         |
| ---------- | ------------------------------------------------------------------------------------------------------- |
| `generate` | Par défaut. Crée une vidéo à partir du prompt donné et d’éventuelles entrées de référence.             |
| `status`   | Vérifie l’état de la tâche vidéo en cours pour la session actuelle sans démarrer une autre génération. |
| `list`     | Affiche les fournisseurs, modèles et leurs capacités disponibles.                                       |

## Sélection du modèle

OpenClaw résout le modèle dans cet ordre :

1. **Paramètre d’outil `model`** — si l’agent en spécifie un dans l’appel.
2. **`videoGenerationModel.primary`** depuis la configuration.
3. **`videoGenerationModel.fallbacks`** dans l’ordre.
4. **Détection automatique** — fournisseurs disposant d’une authentification valide, en commençant par le
   fournisseur par défaut actuel, puis les autres fournisseurs par ordre
   alphabétique.

Si un fournisseur échoue, le candidat suivant est essayé automatiquement. Si tous les
candidats échouent, l’erreur inclut les détails de chaque tentative.

Définissez `agents.defaults.mediaGenerationAutoProviderFallback: false` pour utiliser
uniquement les entrées explicites `model`, `primary` et `fallbacks`.

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

## Remarques sur les fournisseurs

<AccordionGroup>
  <Accordion title="Alibaba">
    Utilise le point de terminaison asynchrone DashScope / Model Studio. Les images et
    vidéos de référence doivent être des URL distantes `http(s)`.
  </Accordion>
  <Accordion title="BytePlus (1.0)">
    ID du fournisseur : `byteplus`.

    Modèles : `seedance-1-0-pro-250528` (par défaut),
    `seedance-1-0-pro-t2v-250528`, `seedance-1-0-pro-fast-251015`,
    `seedance-1-0-lite-t2v-250428`, `seedance-1-0-lite-i2v-250428`.

    Les modèles T2V (`*-t2v-*`) n’acceptent pas les entrées image ; les modèles I2V et
    les modèles généraux `*-pro-*` prennent en charge une seule image de référence (première
    image). Transmettez l’image par position ou définissez `role: "first_frame"`.
    Les ID de modèle T2V sont automatiquement remplacés par la variante I2V
    correspondante lorsqu’une image est fournie.

    Clés `providerOptions` prises en charge : `seed` (number), `draft` (boolean —
    force le 480p), `camera_fixed` (boolean).

  </Accordion>
  <Accordion title="BytePlus Seedance 1.5">
    Nécessite le plugin [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark).
    ID du fournisseur : `byteplus-seedance15`. Modèle :
    `seedance-1-5-pro-251215`.

    Utilise l’API unifiée `content[]`. Prend en charge au maximum 2 images d’entrée
    (`first_frame` + `last_frame`). Toutes les entrées doivent être des URL distantes `https://`.
    Définissez `role: "first_frame"` / `"last_frame"` sur chaque image, ou
    transmettez les images par position.

    `aspectRatio: "adaptive"` détecte automatiquement le ratio à partir de l’image d’entrée.
    `audio: true` correspond à `generate_audio`. `providerOptions.seed`
    (number) est transmis.

  </Accordion>
  <Accordion title="BytePlus Seedance 2.0">
    Nécessite le plugin [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark).
    ID du fournisseur : `byteplus-seedance2`. Modèles :
    `dreamina-seedance-2-0-260128`,
    `dreamina-seedance-2-0-fast-260128`.

    Utilise l’API unifiée `content[]`. Prend en charge jusqu’à 9 images de référence,
    3 vidéos de référence et 3 audios de référence. Toutes les entrées doivent être des URL distantes
    `https://`. Définissez `role` sur chaque ressource — valeurs prises en charge :
    `"first_frame"`, `"last_frame"`, `"reference_image"`,
    `"reference_video"`, `"reference_audio"`.

    `aspectRatio: "adaptive"` détecte automatiquement le ratio à partir de l’image d’entrée.
    `audio: true` correspond à `generate_audio`. `providerOptions.seed`
    (number) est transmis.

  </Accordion>
  <Accordion title="ComfyUI">
    Exécution locale ou cloud pilotée par workflow. Prend en charge text-to-video et
    image-to-video via le graphe configuré.
  </Accordion>
  <Accordion title="fal">
    Utilise un flux adossé à une file d’attente pour les tâches longues. La plupart des modèles vidéo fal
    acceptent une seule image de référence. Les modèles Seedance 2.0 reference-to-video
    acceptent jusqu’à 9 images, 3 vidéos et 3 références audio, avec
    au maximum 12 fichiers de référence au total.
  </Accordion>
  <Accordion title="Google (Gemini / Veo)">
    Prend en charge une image ou une vidéo de référence.
  </Accordion>
  <Accordion title="MiniMax">
    Une seule image de référence uniquement.
  </Accordion>
  <Accordion title="OpenAI">
    Seul le remplacement `size` est transmis. Les autres remplacements de style
    (`aspectRatio`, `resolution`, `audio`, `watermark`) sont ignorés avec
    un avertissement.
  </Accordion>
  <Accordion title="Qwen">
    Même backend DashScope qu’Alibaba. Les entrées de référence doivent être des URL distantes
    `http(s)` ; les fichiers locaux sont rejetés d’emblée.
  </Accordion>
  <Accordion title="Runway">
    Prend en charge les fichiers locaux via des URI de données. Video-to-video nécessite
    `runway/gen4_aleph`. Les exécutions texte seul exposent les ratios
    `16:9` et `9:16`.
  </Accordion>
  <Accordion title="Together">
    Une seule image de référence uniquement.
  </Accordion>
  <Accordion title="Vydra">
    Utilise directement `https://www.vydra.ai/api/v1` pour éviter les redirections
    supprimant l’authentification. `veo3` est groupé comme text-to-video uniquement ; `kling` nécessite
    une URL d’image distante.
  </Accordion>
  <Accordion title="xAI">
    Prend en charge text-to-video, image-to-video à image unique de première image, jusqu’à 7
    entrées `reference_image` via xAI `reference_images`, et des flux distants
    d’édition/extension de vidéo.
  </Accordion>
</AccordionGroup>

## Modes de capacité des fournisseurs

Le contrat partagé de génération vidéo prend en charge des capacités spécifiques au mode
au lieu de simples limites agrégées plates. Les nouvelles implémentations de fournisseur
devraient préférer des blocs de mode explicites :

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
    maxInputImagesByModel: { "provider/reference-to-video": 9 },
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

Les champs agrégés plats comme `maxInputImages` et `maxInputVideos` ne sont
**pas** suffisants pour annoncer la prise en charge du mode transformation. Les fournisseurs doivent
déclarer explicitement `generate`, `imageToVideo` et `videoToVideo` afin que les tests live,
les tests de contrat et l’outil partagé `video_generate` puissent valider
la prise en charge du mode de manière déterministe.

Lorsqu’un modèle d’un fournisseur prend en charge des entrées de référence plus larges que les
autres, utilisez `maxInputImagesByModel`, `maxInputVideosByModel` ou
`maxInputAudiosByModel` au lieu d’augmenter la limite à l’échelle du mode.

## Tests live

Couverture live sur opt-in pour les fournisseurs partagés groupés :

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts
```

Wrapper du dépôt :

```bash
pnpm test:live:media video
```

Ce fichier live charge les variables d’environnement fournisseur manquantes depuis `~/.profile`, préfère
par défaut les clés API live/env aux profils d’authentification stockés, et exécute un
test de fumée sûr pour les versions par défaut :

- `generate` pour chaque fournisseur hors FAL dans la suite.
- Prompt de homard d’une seconde.
- Plafond d’opération par fournisseur à partir de
  `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (`180000` par défaut).

FAL est en opt-in, car la latence de file d’attente côté fournisseur peut dominer le temps
de publication :

```bash
pnpm test:live:media video --video-providers fal
```

Définissez `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` pour exécuter également les
modes de transformation déclarés que la suite partagée peut exercer en toute sécurité avec des médias locaux :

- `imageToVideo` lorsque `capabilities.imageToVideo.enabled`.
- `videoToVideo` lorsque `capabilities.videoToVideo.enabled` et que le
  fournisseur/modèle accepte une entrée vidéo locale adossée à un buffer dans la suite
  partagée.

Aujourd’hui, la voie live partagée `videoToVideo` couvre uniquement `runway` lorsque vous
sélectionnez `runway/gen4_aleph`.

## Configuration

Définissez le modèle de génération vidéo par défaut dans votre configuration OpenClaw :

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

Ou via la CLI :

```bash
openclaw config set agents.defaults.videoGenerationModel.primary "qwen/wan2.6-t2v"
```

## Lié

- [Alibaba Model Studio](/fr/providers/alibaba)
- [Tâches d’arrière-plan](/fr/automation/tasks) — suivi des tâches pour la génération vidéo asynchrone
- [BytePlus](/fr/concepts/model-providers#byteplus-international)
- [ComfyUI](/fr/providers/comfy)
- [Référence de configuration](/fr/gateway/config-agents#agent-defaults)
- [fal](/fr/providers/fal)
- [Google (Gemini)](/fr/providers/google)
- [MiniMax](/fr/providers/minimax)
- [Modèles](/fr/concepts/models)
- [OpenAI](/fr/providers/openai)
- [Qwen](/fr/providers/qwen)
- [Runway](/fr/providers/runway)
- [Together AI](/fr/providers/together)
- [Vue d’ensemble des outils](/fr/tools)
- [Vydra](/fr/providers/vydra)
- [xAI](/fr/providers/xai)
