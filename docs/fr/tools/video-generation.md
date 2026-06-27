---
read_when:
    - Générer des vidéos via l’agent
    - Configuration des fournisseurs et modèles de génération vidéo
    - Comprendre les paramètres de l’outil video_generate
sidebarTitle: Video generation
summary: Générez des vidéos via video_generate à partir de références textuelles, d’images ou de vidéos sur 16 backends de fournisseurs.
title: Génération vidéo
x-i18n:
    generated_at: "2026-06-27T18:22:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 64c8a3191262613a1acf684496570a6dd8893ebb3a2a7e5ae41337d58555c401
    source_path: tools/video-generation.md
    workflow: 16
---

Les agents OpenClaw peuvent générer des vidéos à partir de prompts textuels, d’images de référence ou de
vidéos existantes. Seize backends de fournisseurs sont pris en charge, chacun avec
différentes options de modèles, modes d’entrée et ensembles de fonctionnalités. L’agent choisit
automatiquement le bon fournisseur en fonction de votre configuration et des clés API
disponibles.

<Note>
L’outil `video_generate` n’apparaît que lorsqu’au moins un fournisseur de génération
vidéo est disponible. Si vous ne le voyez pas dans les outils de votre agent, définissez une
clé API de fournisseur ou configurez `agents.defaults.videoGenerationModel`.
</Note>

OpenClaw traite la génération vidéo comme trois modes d’exécution :

- `generate` - requêtes texte-vers-vidéo sans média de référence.
- `imageToVideo` - la requête inclut une ou plusieurs images de référence.
- `videoToVideo` - la requête inclut une ou plusieurs vidéos de référence.

Les fournisseurs peuvent prendre en charge n’importe quel sous-ensemble de ces modes. L’outil valide le
mode actif avant l’envoi et indique les modes pris en charge dans `action=list`.

## Démarrage rapide

<Steps>
  <Step title="Configure auth">
    Définissez une clé API pour n’importe quel fournisseur pris en charge :

    ```bash
    export GEMINI_API_KEY="your-key"
    ```

  </Step>
  <Step title="Pick a default model (optional)">
    ```bash
    openclaw config set agents.defaults.videoGenerationModel.primary "google/veo-3.1-fast-generate-preview"
    ```
  </Step>
  <Step title="Ask the agent">
    > Générez une vidéo cinématographique de 5 secondes d’un homard amical surfant au coucher du soleil.

    L’agent appelle automatiquement `video_generate`. Aucune liste d’autorisation d’outils
    n’est nécessaire.

  </Step>
</Steps>

## Fonctionnement de la génération asynchrone

La génération vidéo est asynchrone. Lorsque l’agent appelle `video_generate` dans une
session :

1. OpenClaw envoie la requête au fournisseur et renvoie immédiatement un ID de tâche.
2. Le fournisseur traite le travail en arrière-plan (généralement de 30 secondes à plusieurs minutes selon le fournisseur et la résolution ; les fournisseurs lents adossés à une file d’attente peuvent aller jusqu’au délai d’expiration configuré).
3. Lorsque la vidéo est prête, OpenClaw réveille la même session avec un événement interne de finalisation.
4. L’agent informe l’utilisateur via le mode normal de réponse visible de la session :
   livraison de la réponse finale lorsqu’elle est automatique, ou `message(action="send")` lorsque la
   session nécessite l’outil de message. Si la session demandeuse est inactive ou
   que son réveil actif échoue, et qu’une vidéo générée manque encore dans la
   réponse de finalisation, OpenClaw envoie un repli direct idempotent avec uniquement la
   vidéo manquante.

Pendant qu’une tâche est en cours, les appels `video_generate` en double dans la même
session renvoient l’état actuel de la tâche au lieu de lancer une autre
génération. Utilisez `openclaw tasks list` ou `openclaw tasks show <taskId>` pour
vérifier la progression depuis la CLI.

Hors des exécutions d’agent adossées à une session (par exemple, les invocations directes d’outils),
l’outil revient à la génération en ligne et renvoie le chemin final du média
dans le même tour.

Les fichiers vidéo générés sont enregistrés dans le stockage de médias géré par OpenClaw lorsque
le provider renvoie des octets. Le plafond d’enregistrement par défaut des vidéos générées suit
la limite des médias vidéo, et `agents.defaults.mediaMaxMb` l’augmente pour
les rendus plus volumineux. Lorsqu’un provider renvoie aussi une URL de sortie hébergée, OpenClaw
peut livrer cette URL au lieu de faire échouer la tâche si la persistance locale
rejette un fichier trop volumineux.

### Cycle de vie des tâches

| État        | Signification                                                                                              |
| ----------- | ---------------------------------------------------------------------------------------------------------- |
| `queued`    | Tâche créée, en attente d’acceptation par le provider.                                                     |
| `running`   | Le provider traite la demande (généralement de 30 secondes à plusieurs minutes selon le provider et la résolution). |
| `succeeded` | Vidéo prête ; l’agent se réveille et la publie dans la conversation.                                       |
| `failed`    | Erreur ou expiration du délai côté provider ; l’agent se réveille avec les détails de l’erreur.            |

Vérifiez l’état depuis la CLI :

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

Si une tâche vidéo est déjà `queued` ou `running` pour la session actuelle,
`video_generate` renvoie l’état de la tâche existante au lieu d’en démarrer une
nouvelle. Utilisez `action: "status"` pour vérifier explicitement sans déclencher une nouvelle
génération.

## Providers pris en charge

| Provider              | Modèle par défaut              | Texte | Réf. image                                          | Réf. vidéo                                    | Authentification                         |
| --------------------- | ------------------------------ | :---: | --------------------------------------------------- | --------------------------------------------- | ---------------------------------------- |
| Alibaba               | `wan2.6-t2v`                   |   ✓   | Oui (URL distante)                                  | Oui (URL distante)                            | `MODELSTUDIO_API_KEY`                    |
| BytePlus (1.0)        | `seedance-1-0-pro-250528`      |   ✓   | Jusqu’à 2 images (modèles I2V uniquement ; première + dernière image) | -                                             | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 1.5 | `seedance-1-5-pro-251215`      |   ✓   | Jusqu’à 2 images (première + dernière image via rôle) | -                                             | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 2.0 | `dreamina-seedance-2-0-260128` |   ✓   | Jusqu’à 9 images de référence                       | Jusqu’à 3 vidéos                              | `BYTEPLUS_API_KEY`                       |
| ComfyUI               | `workflow`                     |   ✓   | 1 image                                             | -                                             | `COMFY_API_KEY` ou `COMFY_CLOUD_API_KEY` |
| DeepInfra             | `Pixverse/Pixverse-T2V`        |   ✓   | -                                                   | -                                             | `DEEPINFRA_API_KEY`                      |
| fal                   | `fal-ai/minimax/video-01-live` |   ✓   | 1 image ; jusqu’à 9 avec Seedance reference-to-video | Jusqu’à 3 vidéos avec Seedance reference-to-video | `FAL_KEY`                                |
| Google                | `veo-3.1-fast-generate-preview` |  ✓   | 1 image                                             | 1 vidéo                                       | `GEMINI_API_KEY`                         |
| MiniMax               | `MiniMax-Hailuo-2.3`           |   ✓   | 1 image                                             | -                                             | `MINIMAX_API_KEY` ou MiniMax OAuth       |
| OpenAI                | `sora-2`                       |   ✓   | 1 image                                             | 1 vidéo                                       | `OPENAI_API_KEY`                         |
| OpenRouter            | `google/veo-3.1-fast`          |   ✓   | Jusqu’à 4 images (première/dernière image ou références) | -                                             | `OPENROUTER_API_KEY`                     |
| Qwen                  | `wan2.6-t2v`                   |   ✓   | Oui (URL distante)                                  | Oui (URL distante)                            | `QWEN_API_KEY`                           |
| Runway                | `gen4.5`                       |   ✓   | 1 image                                             | 1 vidéo                                       | `RUNWAYML_API_SECRET`                    |
| Together              | `Wan-AI/Wan2.2-T2V-A14B`       |   ✓   | `Wan-AI/Wan2.2-I2V-A14B` uniquement                 | -                                             | `TOGETHER_API_KEY`                       |
| Vydra                 | `veo3`                         |   ✓   | 1 image (`kling`)                                   | -                                             | `VYDRA_API_KEY`                          |
| xAI                   | `grok-imagine-video`           |   ✓   | 1 image de première frame ou jusqu’à 7 `reference_image`s | 1 vidéo                                       | `XAI_API_KEY`                            |

Certains providers acceptent des variables d’environnement de clé d’API supplémentaires ou alternatives. Consultez
les [pages des providers](#related) individuelles pour plus de détails.

Exécutez `video_generate action=list` pour inspecter les providers, modèles et
modes d’exécution disponibles à l’exécution.

### Matrice des capacités

Le contrat de mode explicite utilisé par `video_generate`, les tests de contrat et
le balayage en direct partagé :

| Provider   | `generate` | `imageToVideo` | `videoToVideo` | Voies en direct partagées aujourd’hui                                                                                                      |
| ---------- | :--------: | :------------: | :------------: | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Alibaba    |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo` ; `videoToVideo` ignoré car ce provider nécessite des URL vidéo `http(s)` distantes                             |
| BytePlus   |     ✓      |       ✓        |       -        | `generate`, `imageToVideo`                                                                                                                 |
| ComfyUI    |     ✓      |       ✓        |       -        | Pas dans le balayage partagé ; la couverture propre aux flux de travail vit avec les tests Comfy                                           |
| DeepInfra  |     ✓      |       -        |       -        | `generate` ; les schémas vidéo natifs DeepInfra sont texte-vers-vidéo dans le contrat du Plugin                                           |
| fal        |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo` ; `videoToVideo` uniquement avec Seedance reference-to-video                                                    |
| Google     |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo` ; `videoToVideo` partagé ignoré car le balayage Gemini/Veo actuel adossé à des tampons n’accepte pas cette entrée |
| MiniMax    |     ✓      |       ✓        |       -        | `generate`, `imageToVideo`                                                                                                                 |
| OpenAI     |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo` ; `videoToVideo` partagé ignoré car cette organisation/ce chemin d’entrée nécessite actuellement un accès d’édition vidéo côté provider |
| OpenRouter |     ✓      |       ✓        |       -        | `generate`, `imageToVideo`                                                                                                                 |
| Qwen       |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo` ; `videoToVideo` ignoré car ce provider nécessite des URL vidéo `http(s)` distantes                             |
| Runway     |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo` ; `videoToVideo` s’exécute uniquement lorsque le modèle sélectionné est `runway/gen4_aleph`                    |
| Together   |     ✓      |       ✓        |       -        | `generate`, `imageToVideo`                                                                                                                 |
| Vydra      |     ✓      |       ✓        |       -        | `generate` ; `imageToVideo` partagé ignoré car le `veo3` groupé accepte uniquement du texte et le `kling` groupé nécessite une URL d’image distante |
| xAI        |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo` ; `videoToVideo` ignoré car ce provider nécessite actuellement une URL MP4 distante                             |

## Paramètres de l’outil

### Requis

<ParamField path="prompt" type="string" required>
  Description textuelle de la vidéo à générer. Requis pour `action: "generate"`.
</ParamField>

### Entrées de contenu

<ParamField path="image" type="string">Image de référence unique (chemin ou URL).</ParamField>
<ParamField path="images" type="string[]">Plusieurs images de référence (jusqu’à 9).</ParamField>
<ParamField path="imageRoles" type="string[]">
Indications de rôle facultatives par position, parallèles à la liste d’images combinée.
Valeurs canoniques : `first_frame`, `last_frame`, `reference_image`.
</ParamField>
<ParamField path="video" type="string">Vidéo de référence unique (chemin ou URL).</ParamField>
<ParamField path="videos" type="string[]">Plusieurs vidéos de référence (jusqu’à 4).</ParamField>
<ParamField path="videoRoles" type="string[]">
Indications de rôle facultatives par position, parallèles à la liste de vidéos combinée.
Valeur canonique : `reference_video`.
</ParamField>
<ParamField path="audioRef" type="string">
Audio de référence unique (chemin ou URL). Utilisé pour la musique de fond ou la
référence vocale lorsque le fournisseur prend en charge les entrées audio.
</ParamField>
<ParamField path="audioRefs" type="string[]">Plusieurs audios de référence (jusqu’à 3).</ParamField>
<ParamField path="audioRoles" type="string[]">
Indications de rôle facultatives par position, parallèles à la liste d’audios combinée.
Valeur canonique : `reference_audio`.
</ParamField>

<Note>
Les indications de rôle sont transmises au fournisseur telles quelles. Les valeurs canoniques proviennent de
l’union `VideoGenerationAssetRole`, mais les fournisseurs peuvent accepter des chaînes de rôle supplémentaires.
Les tableaux `*Roles` ne doivent pas contenir plus d’entrées que la
liste de références correspondante ; les erreurs de décalage d’une unité échouent avec une erreur claire.
Utilisez une chaîne vide pour laisser un emplacement non défini. Pour xAI, définissez chaque rôle d’image sur
`reference_image` afin d’utiliser son mode de génération `reference_images` ; omettez le
rôle ou utilisez `first_frame` pour une conversion image-vers-vidéo à image unique.
</Note>

### Contrôles de style

<ParamField path="aspectRatio" type="string">
  Indication de format d’image comme `1:1`, `16:9`, `9:16`, `adaptive` ou une valeur propre au fournisseur. OpenClaw normalise ou ignore les valeurs non prises en charge selon le fournisseur.
</ParamField>
<ParamField path="resolution" type="string">Indication de résolution comme `480P`, `720P`, `768P`, `1080P`, `4K` ou une valeur propre au fournisseur. OpenClaw normalise ou ignore les valeurs non prises en charge selon le fournisseur.</ParamField>
<ParamField path="durationSeconds" type="number">
  Durée cible en secondes (arrondie à la valeur la plus proche prise en charge par le fournisseur).
</ParamField>
<ParamField path="size" type="string">Indication de taille lorsque le fournisseur la prend en charge.</ParamField>
<ParamField path="audio" type="boolean">
  Active l’audio généré dans la sortie lorsque cela est pris en charge. Distinct de `audioRef*` (entrées).
</ParamField>
<ParamField path="watermark" type="boolean">Active ou désactive le filigrane du fournisseur lorsque cela est pris en charge.</ParamField>

`adaptive` est un sentinelle propre au fournisseur : il est transmis tel quel aux
fournisseurs qui déclarent `adaptive` dans leurs capacités (par exemple BytePlus
Seedance l’utilise pour détecter automatiquement le ratio à partir des dimensions
de l’image d’entrée). Les fournisseurs qui ne le déclarent pas exposent la valeur via
`details.ignoredOverrides` dans le résultat de l’outil afin que l’abandon soit visible.

### Avancé

<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  `"status"` renvoie la tâche de session actuelle ; `"list"` inspecte les fournisseurs.
</ParamField>
<ParamField path="model" type="string">Remplacement du fournisseur/modèle (par exemple `runway/gen4.5`).</ParamField>
<ParamField path="filename" type="string">Indication de nom de fichier de sortie.</ParamField>
<ParamField path="timeoutMs" type="number">Délai d’expiration facultatif de l’opération du fournisseur en millisecondes. Lorsqu’il est omis, OpenClaw utilise `agents.defaults.videoGenerationModel.timeoutMs` s’il est configuré, sinon la valeur par défaut du fournisseur définie par le Plugin lorsqu’elle existe.</ParamField>
<ParamField path="providerOptions" type="object">
  Options propres au fournisseur sous forme d’objet JSON (par exemple `{"seed": 42, "draft": true}`).
  Les fournisseurs qui déclarent un schéma typé valident les clés et les types ; les clés
  inconnues ou les incompatibilités ignorent le candidat pendant le repli. Les fournisseurs sans
  schéma déclaré reçoivent les options telles quelles. Exécutez `video_generate action=list`
  pour voir ce que chaque fournisseur accepte.
</ParamField>

<Note>
Tous les fournisseurs ne prennent pas en charge tous les paramètres. OpenClaw normalise la durée sur
la valeur prise en charge par le fournisseur la plus proche, et remappe les indications de géométrie traduites
comme la taille vers le format d’image lorsqu’un fournisseur de repli expose une surface
de contrôle différente. Les remplacements réellement non pris en charge sont ignorés au mieux
et signalés comme avertissements dans le résultat de l’outil. Les limites strictes de capacité
(comme un trop grand nombre d’entrées de référence) échouent avant la soumission. Les résultats de l’outil
signalent les paramètres appliqués ; `details.normalization` capture toute traduction
demandée-vers-appliquée.
</Note>

Les entrées de référence sélectionnent le mode d’exécution :

- Aucun média de référence → `generate`
- Toute référence d’image → `imageToVideo`
- Toute référence vidéo → `videoToVideo`
- Les entrées audio de référence **ne** changent pas le mode résolu ; elles s’appliquent
  par-dessus le mode choisi par les références image/vidéo, et ne fonctionnent
  qu’avec les fournisseurs qui déclarent `maxInputAudios`.

Les références mixtes image et vidéo ne constituent pas une surface de capacité partagée stable.
Préférez un seul type de référence par requête.

#### Repli et options typées

Certains contrôles de capacité sont appliqués à la couche de repli plutôt qu’à la
limite de l’outil, de sorte qu’une requête qui dépasse les limites du fournisseur principal peut
tout de même s’exécuter sur un repli capable :

- Un candidat actif qui ne déclare pas `maxInputAudios` (ou déclare `0`) est ignoré lorsque
  la requête contient des références audio ; le candidat suivant est essayé.
- Le `maxDurationSeconds` du candidat actif est inférieur au `durationSeconds` demandé
  sans liste `supportedDurationSeconds` déclarée → ignoré.
- La requête contient `providerOptions` et le candidat actif déclare explicitement
  un schéma `providerOptions` typé → ignoré si les clés fournies ne sont
  pas dans le schéma ou si les types de valeur ne correspondent pas. Les fournisseurs sans
  schéma déclaré reçoivent les options telles quelles (transmission rétrocompatible).
  Un fournisseur peut refuser toutes les options fournisseur en déclarant un schéma vide
  (`capabilities.providerOptions: {}`), ce qui provoque le même saut qu’une incompatibilité de type.

La première raison de saut dans une requête est journalisée à `warn` afin que les opérateurs voient quand
leur fournisseur principal a été écarté ; les sauts suivants sont journalisés à `debug` pour
éviter le bruit dans les longues chaînes de repli. Si tous les candidats sont ignorés, l’erreur
agrégée inclut la raison de saut pour chacun.

## Actions

| Action     | Ce qu’elle fait                                                                                             |
| ---------- | -------------------------------------------------------------------------------------------------------- |
| `generate` | Par défaut. Crée une vidéo à partir du prompt donné et des entrées de référence facultatives.                             |
| `status`   | Vérifie l’état de la tâche vidéo en cours pour la session actuelle sans lancer une autre génération. |
| `list`     | Affiche les fournisseurs disponibles, les modèles et leurs capacités.                                                |

## Sélection du modèle

OpenClaw résout le modèle dans cet ordre :

1. **Paramètre d’outil `model`** - si l’agent en spécifie un dans l’appel.
2. **`videoGenerationModel.primary`** depuis la configuration.
3. **`videoGenerationModel.fallbacks`** dans l’ordre.
4. **Détection automatique** - les fournisseurs qui disposent d’une authentification valide, en commençant par le
   fournisseur par défaut actuel, puis les fournisseurs restants dans l’ordre
   alphabétique.

Si un fournisseur échoue, le candidat suivant est essayé automatiquement. Si tous
les candidats échouent, l’erreur inclut les détails de chaque tentative.

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

## Notes sur les fournisseurs

<AccordionGroup>
  <Accordion title="Alibaba">
    Utilise le point de terminaison asynchrone DashScope / Model Studio. Les images et
    vidéos de référence doivent être des URL `http(s)` distantes.
  </Accordion>
  <Accordion title="BytePlus (1.0)">
    ID de fournisseur : `byteplus`.

    Modèles : `seedance-1-0-pro-250528` (par défaut),
    `seedance-1-0-pro-t2v-250528`, `seedance-1-0-pro-fast-251015`,
    `seedance-1-0-lite-t2v-250428`, `seedance-1-0-lite-i2v-250428`.

    Les modèles T2V (`*-t2v-*`) n’acceptent pas les entrées image ; les modèles I2V et
    les modèles généraux `*-pro-*` prennent en charge une seule image de référence (première
    image). Passez l’image positionnellement ou définissez `role: "first_frame"`.
    Les ID de modèle T2V sont automatiquement basculés vers la variante I2V
    correspondante lorsqu’une image est fournie.

    Clés `providerOptions` prises en charge : `seed` (nombre), `draft` (booléen -
    force 480p), `camera_fixed` (booléen).

  </Accordion>
  <Accordion title="BytePlus Seedance 1.5">
    Nécessite le Plugin [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark).
    ID de fournisseur : `byteplus-seedance15`. Modèle :
    `seedance-1-5-pro-251215`.

    Utilise l’API unifiée `content[]`. Prend en charge au maximum 2 images d’entrée
    (`first_frame` + `last_frame`). Toutes les entrées doivent être des URL `https://`
    distantes. Définissez `role: "first_frame"` / `"last_frame"` sur chaque image, ou
    passez les images positionnellement.

    `aspectRatio: "adaptive"` détecte automatiquement le ratio à partir de l’image d’entrée.
    `audio: true` correspond à `generate_audio`. `providerOptions.seed`
    (nombre) est transmis.

  </Accordion>
  <Accordion title="BytePlus Seedance 2.0">
    Nécessite le Plugin [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark).
    ID de fournisseur : `byteplus-seedance2`. Modèles :
    `dreamina-seedance-2-0-260128`,
    `dreamina-seedance-2-0-fast-260128`.

    Utilise l’API unifiée `content[]`. Prend en charge jusqu’à 9 images de référence,
    3 vidéos de référence et 3 audios de référence. Toutes les entrées doivent être des URL
    `https://` distantes. Définissez `role` sur chaque ressource - valeurs prises en charge :
    `"first_frame"`, `"last_frame"`, `"reference_image"`,
    `"reference_video"`, `"reference_audio"`.

    `aspectRatio: "adaptive"` détecte automatiquement le ratio à partir de l’image d’entrée.
    `audio: true` correspond à `generate_audio`. `providerOptions.seed`
    (nombre) est transmis.

  </Accordion>
  <Accordion title="ComfyUI">
    Exécution locale ou dans le cloud pilotée par des workflows. Prend en charge le text-to-video et
    l'image-to-video via le graphe configuré.
  </Accordion>
  <Accordion title="fal">
    Utilise un flux adossé à une file d’attente pour les tâches longues. OpenClaw attend jusqu’à 20
    minutes par défaut avant de considérer qu’une tâche de file d’attente fal en cours a expiré.
    La plupart des modèles vidéo fal
    acceptent une seule référence d’image. Les modèles Seedance 2.0 reference-to-video
    acceptent jusqu’à 9 images, 3 vidéos et 3 références audio, avec
    au plus 12 fichiers de référence au total.
  </Accordion>
  <Accordion title="Google (Gemini / Veo)">
    Prend en charge une référence d’image ou une référence vidéo. Les requêtes avec audio généré sont
    ignorées avec un avertissement sur le chemin de l’API Gemini, car cette API rejette
    le paramètre `generateAudio` pour la génération vidéo Veo actuelle.
  </Accordion>
  <Accordion title="MiniMax">
    Une seule référence d’image. MiniMax accepte les résolutions `768P` et `1080P` ;
    les requêtes telles que `720P` sont normalisées vers la valeur prise en charge la plus proche
    avant l’envoi.
  </Accordion>
  <Accordion title="OpenAI">
    Seule la surcharge `size` est transmise. Les autres surcharges de style
    (`aspectRatio`, `resolution`, `audio`, `watermark`) sont ignorées avec
    un avertissement.
  </Accordion>
  <Accordion title="OpenRouter">
    Utilise l’API `/videos` asynchrone d’OpenRouter. OpenClaw soumet la
    tâche, interroge `polling_url` et télécharge soit `unsigned_urls`, soit le
    point de terminaison documenté du contenu de la tâche. La valeur par défaut groupée `google/veo-3.1-fast`
    annonce des durées de 4/6/8 secondes, des résolutions `720P`/`1080P` et
    des rapports d’aspect `16:9`/`9:16`.
  </Accordion>
  <Accordion title="Qwen">
    Même backend DashScope qu’Alibaba. Les entrées de référence doivent être des URL distantes
    `http(s)` ; les fichiers locaux sont rejetés d’emblée.
  </Accordion>
  <Accordion title="Runway">
    Prend en charge les fichiers locaux via des URI de données. Le video-to-video nécessite
    `runway/gen4_aleph`. Les exécutions textuelles uniquement exposent les rapports d’aspect `16:9` et `9:16`.
  </Accordion>
  <Accordion title="Together">
    Une seule référence d’image.
  </Accordion>
  <Accordion title="Vydra">
    Utilise directement `https://www.vydra.ai/api/v1` pour éviter les redirections
    qui suppriment l’authentification. `veo3` est groupé uniquement en text-to-video ; `kling` nécessite
    une URL d’image distante.
  </Accordion>
  <Accordion title="xAI">
    Prend en charge le text-to-video, l’image-to-video avec une seule image de première frame, jusqu’à 7
    entrées `reference_image` via `reference_images` de xAI, ainsi que les flux distants
    de modification/extension vidéo.
  </Accordion>
</AccordionGroup>

## Modes de capacités des fournisseurs

Le contrat partagé de génération vidéo prend en charge des capacités propres aux modes
au lieu de seules limites agrégées plates. Les nouvelles implémentations de fournisseurs
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

Les champs agrégés plats tels que `maxInputImages` et `maxInputVideos` ne sont
**pas** suffisants pour annoncer la prise en charge d’un mode de transformation. Les fournisseurs doivent
déclarer explicitement `generate`, `imageToVideo` et `videoToVideo` afin que les
tests live, les tests de contrat et l’outil partagé `video_generate` puissent valider
la prise en charge des modes de façon déterministe.

Lorsqu’un modèle d’un fournisseur prend en charge plus largement les entrées de référence que le
reste, utilisez `maxInputImagesByModel`, `maxInputVideosByModel` ou
`maxInputAudiosByModel` au lieu d’augmenter la limite valable pour tout le mode.

## Tests live

Couverture live optionnelle pour les fournisseurs groupés partagés :

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts
```

Wrapper du dépôt :

```bash
pnpm test:live:media video
```

Ce fichier live utilise par défaut les variables d’environnement des fournisseurs déjà exportées avant les profils
d’authentification stockés, et exécute par défaut un smoke sûr pour les releases :

- `generate` pour chaque fournisseur non-FAL de la passe.
- Prompt de homard d’une seconde.
- Limite d’opérations par fournisseur depuis
  `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (`180000` par défaut).

FAL est optionnel, car la latence de file d’attente côté fournisseur peut dominer le temps
de release :

```bash
pnpm test:live:media video --video-providers fal
```

Définissez `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` pour exécuter aussi les
modes de transformation déclarés que la passe partagée peut exercer en sécurité avec des médias locaux :

- `imageToVideo` lorsque `capabilities.imageToVideo.enabled`.
- `videoToVideo` lorsque `capabilities.videoToVideo.enabled` et que le
  fournisseur/modèle accepte une entrée vidéo locale adossée à un buffer dans la passe
  partagée.

Aujourd’hui, la lane live partagée `videoToVideo` couvre `runway` uniquement lorsque vous
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

## Associé

- [Alibaba Model Studio](/fr/providers/alibaba)
- [Tâches en arrière-plan](/fr/automation/tasks) - suivi des tâches pour la génération vidéo asynchrone
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
