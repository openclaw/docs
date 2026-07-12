---
read_when:
    - Génération de vidéos via l’agent
    - Configuration des fournisseurs et des modèles de génération vidéo
    - Comprendre les paramètres de l’outil video_generate
sidebarTitle: Video generation
summary: Générez des vidéos via video_generate à partir de références textuelles, d’images ou de vidéos sur 16 backends de fournisseurs
title: Génération de vidéos
x-i18n:
    generated_at: "2026-07-12T15:56:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: dd34232a3b1a340fcd7dd51a8c5517f976b2300d86a87b56b86a35102ac2d502
    source_path: tools/video-generation.md
    workflow: 16
---

Les agents OpenClaw génèrent des vidéos à partir de prompts textuels, d’images de référence ou de
vidéos existantes au moyen de `video_generate`. Seize backends de fournisseurs sont
pris en charge ; l’agent choisit automatiquement celui qui convient selon la configuration et
les clés API disponibles.

<Note>
`video_generate` apparaît uniquement lorsqu’au moins un fournisseur de génération vidéo est
disponible. S’il ne figure pas parmi les outils de votre agent, définissez une clé API de fournisseur ou
configurez `agents.defaults.videoGenerationModel`.
</Note>

`video_generate` dispose de trois modes d’exécution, déterminés à partir des entrées de référence
de l’appel :

- `generate` - aucun média de référence (texte vers vidéo).
- `imageToVideo` - une ou plusieurs images de référence.
- `videoToVideo` - une ou plusieurs vidéos de référence.

Les fournisseurs peuvent prendre en charge n’importe quel sous-ensemble de ces modes. L’outil valide le
mode actif avant l’envoi et indique les modes pris en charge dans `action=list`.

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
    > Générez une vidéo cinématographique de 5 secondes montrant un homard sympathique surfant au coucher du soleil.

    L’agent appelle automatiquement `video_generate`. Aucune liste d’autorisation d’outils
    n’est nécessaire.

  </Step>
</Steps>

## Fonctionnement de la génération asynchrone

La génération vidéo est asynchrone :

1. OpenClaw envoie la requête au fournisseur et renvoie immédiatement un identifiant de tâche.
2. Le fournisseur traite la tâche en arrière-plan (généralement de 30 secondes à plusieurs minutes selon le fournisseur et la résolution ; les fournisseurs lents reposant sur une file d’attente peuvent s’exécuter jusqu’au délai d’expiration configuré).
3. Lorsque la vidéo est prête, OpenClaw réveille la même session avec un événement interne d’achèvement.
4. L’agent la transmet selon le mode normal de réponse visible de la session :
   réponse finale automatique, ou `message(action="send")` lorsque la session exige
   l’outil de messagerie. Si la session du demandeur est inactive, ou si son réveil échoue et
   que le média généré est toujours absent de la réponse d’achèvement, OpenClaw envoie
   directement un message de secours idempotent contenant le média.

Tant qu’une tâche est en cours, les appels `video_generate` en double dans la même
session renvoient l’état de la tâche actuelle au lieu de lancer une nouvelle
génération. Utilisez `action: "status"` pour vérifier l’état sans déclencher de nouvelle
génération, ou `openclaw tasks list` / `openclaw tasks show <lookup>` depuis la
CLI (voir [Tâches en arrière-plan](/fr/automation/tasks)).

En dehors des exécutions d’agent associées à une session (par exemple, les appels directs d’outils),
l’outil revient à une génération synchrone et renvoie le chemin final du média
dans le même tour.

Les fichiers vidéo générés sont enregistrés dans le stockage de médias géré par OpenClaw lorsque le
fournisseur renvoie des octets. La limite par défaut est de 16MB (la limite partagée des médias
vidéo) ; `agents.defaults.mediaMaxMb` permet de l’augmenter pour les rendus plus volumineux. Lorsqu’un
fournisseur renvoie également une URL de sortie hébergée, OpenClaw transmet cette URL au lieu
de faire échouer la tâche si la persistance locale refuse un fichier trop volumineux.

### Cycle de vie d’une tâche

| État        | Signification                                                                                                  |
| ----------- | -------------------------------------------------------------------------------------------------------------- |
| `queued`    | Tâche créée, en attente de son acceptation par le fournisseur.                                                 |
| `running`   | Le fournisseur effectue le traitement (généralement de 30 secondes à plusieurs minutes selon le fournisseur et la résolution). |
| `succeeded` | Vidéo prête ; l’agent se réveille et la publie dans la conversation.                                           |
| `failed`    | Erreur du fournisseur ou expiration du délai ; l’agent se réveille avec les détails de l’erreur.               |

Vérifiez l’état depuis la CLI :

```bash
openclaw tasks list
openclaw tasks show <lookup>
openclaw tasks cancel <lookup>
```

## Fournisseurs pris en charge

| Fournisseur           | Modèle par défaut                | Texte | Réf. image                                           | Réf. vidéo                                      | Authentification                          |
| --------------------- | ------------------------------- | :--: | ---------------------------------------------------- | ----------------------------------------------- | ---------------------------------------- |
| Alibaba               | `wan2.6-t2v`                    |  ✓   | Oui (URL distante)                                   | Oui (URL distante)                              | `MODELSTUDIO_API_KEY`                    |
| BytePlus (1.0)        | `seedance-1-0-pro-250528`       |  ✓   | Jusqu’à 2 images (modèles I2V uniquement ; première et dernière images) | -                                               | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 1.5 | `seedance-1-5-pro-251215`       |  ✓   | Jusqu’à 2 images (première et dernière images via un rôle) | -                                               | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 2.0 | `dreamina-seedance-2-0-260128`  |  ✓   | Jusqu’à 9 images de référence                        | Jusqu’à 3 vidéos                                | `BYTEPLUS_API_KEY`                       |
| ComfyUI               | `workflow`                      |  ✓   | 1 image                                              | -                                               | `COMFY_API_KEY` ou `COMFY_CLOUD_API_KEY` |
| DeepInfra             | `Pixverse/Pixverse-T2V`         |  ✓   | -                                                    | -                                               | `DEEPINFRA_API_KEY`                      |
| fal                   | `fal-ai/minimax/video-01-live`  |  ✓   | 1 image ; jusqu’à 9 avec Seedance de référence vers vidéo | Jusqu’à 3 vidéos avec Seedance de référence vers vidéo | `FAL_KEY`                                |
| Google                | `veo-3.1-fast-generate-preview` |  ✓   | 1 image                                              | 1 vidéo                                         | `GEMINI_API_KEY`                         |
| MiniMax               | `MiniMax-Hailuo-2.3`            |  ✓   | 1 image                                              | -                                               | `MINIMAX_API_KEY` ou OAuth MiniMax       |
| OpenAI                | `sora-2`                        |  ✓   | 1 image                                              | 1 vidéo                                         | `OPENAI_API_KEY`                         |
| OpenRouter            | `google/veo-3.1-fast`           |  ✓   | Jusqu’à 4 images (première/dernière image ou références) | -                                               | `OPENROUTER_API_KEY`                     |
| Qwen                  | `wan2.6-t2v`                    |  ✓   | Oui (URL distante)                                   | Oui (URL distante)                              | `QWEN_API_KEY`                           |
| Runway                | `gen4.5`                        |  ✓   | 1 image                                              | 1 vidéo                                         | `RUNWAYML_API_SECRET`                    |
| Together              | `Wan-AI/Wan2.2-T2V-A14B`        |  ✓   | `Wan-AI/Wan2.2-I2V-A14B` uniquement                  | -                                               | `TOGETHER_API_KEY`                       |
| Vydra                 | `veo3`                          |  ✓   | 1 image (`kling`)                                    | -                                               | `VYDRA_API_KEY`                          |
| xAI                   | `grok-imagine-video`            |  ✓   | Classique : 1 première image ou 7 références ; 1.5 : 1 image | Classique : 1 vidéo                             | `XAI_API_KEY`                            |

Certains fournisseurs acceptent des variables d’environnement supplémentaires ou alternatives pour les clés API. Consultez
les [pages des fournisseurs](#related) pour plus de détails.

Exécutez `video_generate action=list` pour examiner les fournisseurs, modèles et
modes d’exécution disponibles au moment de l’exécution.

### Matrice des fonctionnalités

Le contrat explicite des modes utilisé par `video_generate`, les tests de contrat et
la campagne de tests en conditions réelles partagée :

| Fournisseur | `generate` | `imageToVideo` | `videoToVideo` | Parcours de tests en conditions réelles partagés actuels                                                                                       |
| ----------- | :--------: | :------------: | :------------: | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Alibaba     |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo` ; `videoToVideo` ignoré, car ce fournisseur nécessite des URL vidéo `http(s)` distantes                             |
| BytePlus    |     ✓      |       ✓        |       -        | `generate`, `imageToVideo`                                                                                                                       |
| ComfyUI     |     ✓      |       ✓        |       -        | Absent de la campagne partagée ; la couverture propre aux workflows se trouve dans les tests Comfy                                              |
| DeepInfra   |     ✓      |       -        |       -        | `generate` ; les schémas vidéo natifs de DeepInfra correspondent au texte vers vidéo dans le contrat du Plugin                                  |
| fal         |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo` ; `videoToVideo` uniquement avec Seedance de référence vers vidéo                                                    |
| Google      |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo` ; le `videoToVideo` partagé est ignoré, car la campagne Gemini/Veo actuelle reposant sur des tampons n’accepte pas cette entrée |
| MiniMax     |     ✓      |       ✓        |       -        | `generate`, `imageToVideo`                                                                                                                       |
| OpenAI      |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo` ; le `videoToVideo` partagé est ignoré, car ce chemin d’organisation/d’entrée nécessite actuellement un accès à l’édition vidéo côté fournisseur |
| OpenRouter  |     ✓      |       ✓        |       -        | `generate`, `imageToVideo`                                                                                                                       |
| Qwen        |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo` ; `videoToVideo` ignoré, car ce fournisseur nécessite des URL vidéo `http(s)` distantes                              |
| Runway      |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo` ; `videoToVideo` s’exécute uniquement lorsque le modèle sélectionné est `runway/gen4_aleph`                          |
| Together    |     ✓      |       ✓        |       -        | `generate`, `imageToVideo`                                                                                                                       |
| Vydra       |     ✓      |       ✓        |       -        | `generate` ; l’`imageToVideo` partagé est ignoré, car le modèle `veo3` intégré accepte uniquement du texte et le modèle `kling` intégré nécessite une URL d’image distante |
| xAI         |     ✓      |       ✓        |       ✓        | La version classique prend en charge tous les modes ; Video 1.5 prend uniquement en charge l’image vers vidéo ; l’entrée MP4 distante exclut `videoToVideo` de la campagne partagée |

## Paramètres de l’outil

### Obligatoire

<ParamField path="prompt" type="string" required>
  Description textuelle de la vidéo à générer. Obligatoire pour `action: "generate"`.
</ParamField>

### Entrées de contenu

<ParamField path="image" type="string">Image de référence unique (chemin ou URL).</ParamField>
<ParamField path="images" type="string[]">Plusieurs images de référence (jusqu’à 9).</ParamField>
<ParamField path="imageRoles" type="string[]">
Indications de rôle facultatives par position, parallèles à la liste combinée d’images.
Valeurs canoniques : `first_frame`, `last_frame`, `reference_image`.
</ParamField>
<ParamField path="video" type="string">Vidéo de référence unique (chemin ou URL).</ParamField>
<ParamField path="videos" type="string[]">Plusieurs vidéos de référence (jusqu’à 4).</ParamField>
<ParamField path="videoRoles" type="string[]">
Indications de rôle facultatives par position, parallèles à la liste combinée de vidéos.
Valeur canonique : `reference_video`.
</ParamField>
<ParamField path="audioRef" type="string">
Audio de référence unique (chemin ou URL). Utilisé comme musique de fond ou
référence vocale lorsque le fournisseur prend en charge les entrées audio.
</ParamField>
<ParamField path="audioRefs" type="string[]">Plusieurs audios de référence (jusqu’à 3).</ParamField>
<ParamField path="audioRoles" type="string[]">
Indications de rôle facultatives par position, parallèles à la liste combinée d’audios.
Valeur canonique : `reference_audio`.
</ParamField>

<Note>
Les indications de rôle sont transmises telles quelles au fournisseur. Les valeurs
canoniques proviennent de l’union `VideoGenerationAssetRole`, mais les fournisseurs
peuvent accepter des chaînes de rôle supplémentaires. Les tableaux `*Roles` ne doivent
pas contenir plus d’entrées que la liste de références correspondante ; les erreurs de
décalage d’une position échouent avec un message clair. Utilisez une chaîne vide pour
laisser un emplacement non défini. Pour xAI, définissez chaque rôle d’image sur
`reference_image` afin d’utiliser son mode de génération `reference_images` ; omettez
le rôle ou utilisez `first_frame` pour convertir une seule image en vidéo.
</Note>

### Contrôles de style

<ParamField path="aspectRatio" type="string">
  Indication de format d’image telle que `1:1`, `16:9`, `9:16`, `adaptive` ou une valeur propre au fournisseur. OpenClaw normalise ou ignore les valeurs non prises en charge selon le fournisseur.
</ParamField>
<ParamField path="resolution" type="string">Indication de résolution telle que `360P`, `480P`, `540P`, `720P`, `768P`, `1080P`, `4K` ou une valeur propre au fournisseur. OpenClaw normalise ou ignore les valeurs non prises en charge selon le fournisseur.</ParamField>
<ParamField path="durationSeconds" type="number">
  Durée cible en secondes (arrondie à la valeur prise en charge par le fournisseur la plus proche).
</ParamField>
<ParamField path="size" type="string">Indication de taille lorsque le fournisseur la prend en charge.</ParamField>
<ParamField path="audio" type="boolean">
  Active l’audio généré dans la sortie lorsque cette fonction est prise en charge. À distinguer de `audioRef*` (entrées).
</ParamField>
<ParamField path="watermark" type="boolean">Active ou désactive le filigrane du fournisseur lorsque cette fonction est prise en charge.</ParamField>

`adaptive` est une valeur sentinelle propre au fournisseur : elle est transmise telle
quelle aux fournisseurs qui déclarent `adaptive` dans leurs capacités (par exemple,
BytePlus Seedance l’utilise pour détecter automatiquement le format à partir des
dimensions de l’image d’entrée). Les fournisseurs qui ne la déclarent pas exposent
la valeur via `details.ignoredOverrides` dans le résultat de l’outil afin que son
abandon soit visible.

### Paramètres avancés

<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  `"status"` renvoie la tâche actuelle de la session ; `"list"` inspecte les fournisseurs.
</ParamField>
<ParamField path="model" type="string">Remplacement du fournisseur/modèle (par exemple `runway/gen4.5`).</ParamField>
<ParamField path="filename" type="string">Indication de nom du fichier de sortie.</ParamField>
<ParamField path="timeoutMs" type="number">Délai d’expiration facultatif de l’opération du fournisseur, en millisecondes. Lorsqu’il est omis, OpenClaw utilise `agents.defaults.videoGenerationModel.timeoutMs` s’il est configuré, sinon la valeur par défaut définie par le fournisseur dans le plugin lorsqu’elle existe.</ParamField>
<ParamField path="providerOptions" type="object">
  Options propres au fournisseur sous forme d’objet JSON (par exemple `{"seed": 42, "draft": true}`).
  Les fournisseurs qui déclarent un schéma typé valident les clés et les types ; les
  clés inconnues ou les incompatibilités entraînent l’exclusion du candidat lors du
  repli. Les fournisseurs sans schéma déclaré reçoivent les options telles quelles.
  Exécutez `video_generate action=list` pour voir ce que chaque fournisseur accepte.
</ParamField>

<Note>
Tous les fournisseurs ne prennent pas en charge tous les paramètres. OpenClaw
normalise la durée à la valeur prise en charge par le fournisseur la plus proche
et remappe les indications géométriques traduites, par exemple de la taille vers
le format d’image, lorsqu’un fournisseur de repli expose une interface de contrôle
différente. Les remplacements réellement non pris en charge sont ignorés au mieux
et signalés comme avertissements dans le résultat de l’outil. Les limites strictes
de capacité (telles qu’un nombre excessif d’entrées de référence) provoquent un échec
avant l’envoi. Les résultats de l’outil indiquent les paramètres appliqués ;
`details.normalization` enregistre toute conversion entre la valeur demandée et la
valeur appliquée.
</Note>

Les entrées de référence sélectionnent le mode d’exécution :

- Aucun média de référence -> `generate`
- Toute référence d’image -> `imageToVideo`
- Toute référence vidéo -> `videoToVideo`
- Les entrées audio de référence **ne modifient pas** le mode déterminé ; elles
  s’appliquent en plus du mode sélectionné par les références d’image ou de vidéo
  et ne fonctionnent qu’avec les fournisseurs qui déclarent `maxInputAudios`.

Le mélange de références d’image et de vidéo ne constitue pas une interface de
capacité partagée stable. Privilégiez un seul type de référence par requête.

#### Repli et options typées

Certaines vérifications de capacité s’appliquent au niveau du repli plutôt qu’à
la frontière de l’outil. Une requête qui dépasse les limites du fournisseur
principal peut ainsi tout de même être exécutée par un fournisseur de repli
capable de la traiter :

- Le candidat actif qui ne déclare aucun `maxInputAudios` (ou déclare `0`) est
  ignoré lorsque la requête contient des références audio ; le candidat suivant
  est essayé. La même vérification s’applique au nombre de références d’image et
  de vidéo par rapport à `maxInputImages`/`maxInputVideos`.
- Le candidat actif dont `maxDurationSeconds` est inférieur à la valeur
  `durationSeconds` demandée, sans liste `supportedDurationSeconds` déclarée,
  est ignoré.
- Si la requête contient `providerOptions` et que le candidat actif déclare
  explicitement un schéma `providerOptions` typé, il est ignoré si les clés
  fournies ne figurent pas dans le schéma ou si les types des valeurs ne
  correspondent pas. Les fournisseurs sans schéma déclaré reçoivent les options
  telles quelles (transmission rétrocompatible). Un fournisseur peut refuser
  toutes les options de fournisseur en déclarant un schéma vide
  (`capabilities.providerOptions: {}`), ce qui entraîne la même exclusion qu’une
  incompatibilité de type.

Le premier motif d’exclusion d’une requête est journalisé au niveau `warn` afin
que les opérateurs sachent que leur fournisseur principal a été écarté ; les
exclusions suivantes sont journalisées au niveau `debug` afin de ne pas encombrer
les longues chaînes de repli. Si tous les candidats sont ignorés, l’erreur agrégée
inclut le motif d’exclusion de chacun.

## Actions

| Action     | Fonctionnement                                                                                                      |
| ---------- | ------------------------------------------------------------------------------------------------------------------- |
| `generate` | Action par défaut. Crée une vidéo à partir de l’invite fournie et des éventuelles entrées de référence.             |
| `status`   | Vérifie l’état de la tâche vidéo en cours pour la session actuelle sans lancer une autre génération.                |
| `list`     | Affiche les fournisseurs et modèles disponibles, ainsi que leurs capacités.                                         |

## Sélection du modèle

OpenClaw détermine le modèle dans cet ordre :

1. **Paramètre d’outil `model`** - si l’agent en spécifie un dans l’appel.
2. **`videoGenerationModel.primary`** dans la configuration.
3. **`videoGenerationModel.fallbacks`** dans l’ordre.
4. **Détection automatique** - fournisseurs disposant d’une authentification
   valide, en commençant par le fournisseur par défaut actuel, puis les autres
   fournisseurs par ordre alphabétique.

Si un fournisseur échoue, le candidat suivant est essayé automatiquement. Si tous
les candidats échouent, l’erreur inclut les détails de chaque tentative.

Définissez `agents.defaults.mediaGenerationAutoProviderFallback: false` pour
utiliser uniquement les entrées explicites `model`, `primary` et `fallbacks`.

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "google/veo-3.1-fast-generate-preview",
        fallbacks: ["runway/gen4.5", "qwen/wan2.6-t2v"],
        timeoutMs: 180000, // remplacement facultatif du délai d’expiration des requêtes au fournisseur pour chaque outil
      },
    },
  },
}
```

## Notes sur les fournisseurs

<AccordionGroup>
  <Accordion title="Alibaba">
    Utilise le point de terminaison asynchrone DashScope / Model Studio. Les
    images et vidéos de référence doivent être des URL `http(s)` distantes.
  </Accordion>
  <Accordion title="BytePlus (1.0)">
    Identifiant du fournisseur : `byteplus`.

    Modèles : `seedance-1-0-pro-250528` (par défaut),
    `seedance-1-0-pro-t2v-250528`, `seedance-1-0-pro-fast-251015`,
    `seedance-1-0-lite-t2v-250428`, `seedance-1-0-lite-i2v-250428`.

    Les modèles T2V (`*-t2v-*`) n’acceptent pas les entrées d’image ; les modèles
    I2V et les modèles généraux `*-pro-*` prennent en charge une seule image de
    référence (première image). Transmettez l’image selon sa position ou définissez
    `role: "first_frame"`. Lorsqu’une image est fournie, les identifiants des modèles
    T2V sont automatiquement remplacés par ceux de la variante I2V correspondante.

    Clés `providerOptions` prises en charge : `seed` (nombre), `draft` (booléen -
    impose 480p), `camera_fixed` (booléen).

  </Accordion>
  <Accordion title="BytePlus Seedance 1.5">
    Nécessite le plugin [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark)
    (externe, non inclus). Identifiant du fournisseur : `byteplus-seedance15`. Modèle :
    `seedance-1-5-pro-251215`.

    Utilise l’API unifiée `content[]`. Prend en charge au maximum 2 images d’entrée
    (`first_frame` + `last_frame`). Toutes les entrées doivent être des URL
    `https://` distantes. Définissez `role: "first_frame"` / `"last_frame"` sur
    chaque image ou transmettez les images selon leur position.

    `aspectRatio: "adaptive"` détecte automatiquement le format à partir de l’image
    d’entrée. `audio: true` correspond à `generate_audio`. `providerOptions.seed`
    (nombre) est transmis.

  </Accordion>
  <Accordion title="BytePlus Seedance 2.0">
    Nécessite le plugin [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark)
    (externe, non inclus). Identifiant du fournisseur : `byteplus-seedance2`. Modèles :
    `dreamina-seedance-2-0-260128`,
    `dreamina-seedance-2-0-fast-260128`.

    Utilise l’API unifiée `content[]`. Prend en charge jusqu’à 9 images de référence,
    3 vidéos de référence et 3 audios de référence. Toutes les entrées doivent être
    des URL `https://` distantes. Définissez `role` sur chaque ressource ; les valeurs
    prises en charge sont :
    `"first_frame"`, `"last_frame"`, `"reference_image"`,
    `"reference_video"`, `"reference_audio"`.

    `aspectRatio: "adaptive"` détecte automatiquement le format à partir de l’image
    d’entrée. `audio: true` correspond à `generate_audio`. `providerOptions.seed`
    (nombre) est transmis.

  </Accordion>
  <Accordion title="ComfyUI">
    Exécution locale ou dans le cloud pilotée par des workflows. Prend en charge la génération texte-vers-vidéo et
    image-vers-vidéo au moyen du graphe configuré.
  </Accordion>
  <Accordion title="fal">
    Utilise un flux reposant sur une file d’attente pour les tâches de longue durée. OpenClaw attend jusqu’à 20
    minutes par défaut avant de considérer qu’une tâche de la file d’attente fal toujours en cours
    a expiré. La plupart des modèles vidéo fal
    acceptent une seule référence d’image. Les modèles Seedance 2.0 de génération
    référence-vers-vidéo acceptent jusqu’à 9 images, 3 vidéos et 3 références audio, avec
    un maximum total de 12 fichiers de référence.
  </Accordion>
  <Accordion title="Google (Gemini / Veo)">
    Prend en charge une référence d’image ou de vidéo. Les demandes de génération audio sont
    ignorées avec un avertissement sur le chemin de l’API Gemini, car cette API rejette
    le paramètre `generateAudio` pour la génération vidéo Veo actuelle.
  </Accordion>
  <Accordion title="MiniMax">
    Une seule référence d’image. MiniMax accepte les résolutions `768P` et `1080P` ;
    les demandes telles que `720P` sont normalisées vers la valeur prise en charge
    la plus proche avant leur envoi.
  </Accordion>
  <Accordion title="OpenAI">
    Seule la substitution `size` est transmise. Les autres substitutions de style
    (`aspectRatio`, `resolution`, `audio`, `watermark`) sont ignorées avec
    un avertissement.
  </Accordion>
  <Accordion title="OpenRouter">
    Utilise l’API asynchrone `/videos` d’OpenRouter. OpenClaw envoie la
    tâche, interroge `polling_url`, puis télécharge soit `unsigned_urls`, soit le
    point de terminaison documenté du contenu de la tâche. La valeur par défaut intégrée `google/veo-3.1-fast`
    annonce des durées de 4/6/8 secondes, des résolutions `720P`/`1080P` et
    des formats d’image `16:9`/`9:16`.
  </Accordion>
  <Accordion title="Qwen">
    Utilise le même backend DashScope qu’Alibaba. Les entrées de référence doivent être des URL
    `http(s)` distantes ; les fichiers locaux sont rejetés en amont.
  </Accordion>
  <Accordion title="Runway">
    Prend en charge les fichiers locaux au moyen d’URI de données. La génération vidéo-vers-vidéo nécessite
    `runway/gen4_aleph`. Les exécutions avec texte uniquement proposent les formats d’image
    `16:9` et `9:16`.
  </Accordion>
  <Accordion title="Together">
    Une seule référence d’image.
  </Accordion>
  <Accordion title="Vydra">
    Utilise directement `https://www.vydra.ai/api/v1` pour éviter les redirections
    qui suppriment l’authentification. `veo3` est intégré uniquement pour la génération texte-vers-vidéo ; `kling` nécessite
    une URL d’image distante.
  </Accordion>
  <Accordion title="xAI">
    Le modèle par défaut `grok-imagine-video` prend en charge la génération texte-vers-vidéo, la génération
    image-vers-vidéo à partir d’une seule image servant de première trame, jusqu’à 7 entrées `reference_image` via les
    `reference_images` de xAI, ainsi que les flux distants de modification ou d’extension vidéo. La génération utilise
    `480P` par défaut ; la génération image-vers-vidéo à partir d’une seule image hérite du format de la source lorsque
    `aspectRatio` est omis. La modification et l’extension vidéo héritent de la géométrie d’entrée et
    n’acceptent aucune substitution de format d’image ou de résolution. L’extension accepte de 2 à 10
    secondes.

    `grok-imagine-video-1.5` prend uniquement en charge la génération image-vers-vidéo : fournissez exactement une image.
    Il prend en charge de 1 à 15 secondes et les résolutions `480P`, `720P` ou `1080P`, avec
    `480P` par défaut ; omettez `aspectRatio` pour hériter du format de l’image source. Les identifiants de préversion
    et les identifiants 1.5 datés font l’objet de la même validation et sont transmis
    sans modification.

  </Accordion>
</AccordionGroup>

## Modes de capacité des fournisseurs

Le contrat partagé de génération vidéo prend en charge des capacités propres à chaque mode,
plutôt que de simples limites agrégées uniformes. Les nouvelles implémentations de fournisseurs
doivent privilégier des blocs de mode explicites :

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

Les champs agrégés uniformes tels que `maxInputImages` et `maxInputVideos` ne sont
**pas** suffisants pour annoncer la prise en charge des modes de transformation. Les fournisseurs doivent
déclarer explicitement `generate`, `imageToVideo` et `videoToVideo` afin que les tests
en direct, les tests de contrat et l’outil partagé `video_generate` puissent valider
de manière déterministe la prise en charge des modes.

Lorsqu’un modèle d’un fournisseur prend en charge davantage d’entrées de référence que les
autres, utilisez `maxInputImagesByModel`, `maxInputVideosByModel` ou
`maxInputAudiosByModel` au lieu d’augmenter la limite pour l’ensemble du mode.

## Tests en direct

Couverture en direct facultative pour les fournisseurs intégrés partagés :

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts
```

Commande d’encapsulation du dépôt :

```bash
pnpm test:live:media video
```

Par défaut, ce fichier de test en direct utilise les variables d’environnement déjà exportées des fournisseurs avant les profils
d’authentification enregistrés et exécute un test de fumée sûr pour les versions :

- `generate` pour chaque fournisseur autre que FAL inclus dans le parcours.
- Invite lobster d’une seconde.
- Limite d’exécution par fournisseur définie par
  `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (`180000` par défaut).

FAL est facultatif, car la latence de la file d’attente côté fournisseur peut dominer le temps
de publication :

```bash
pnpm test:live:media video --video-providers fal
```

Définissez `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` pour exécuter également les
modes de transformation déclarés que le parcours partagé peut tester en toute sécurité avec des médias locaux :

- `imageToVideo` lorsque `capabilities.imageToVideo.enabled`.
- `videoToVideo` lorsque `capabilities.videoToVideo.enabled` et que le
  fournisseur/modèle accepte une entrée vidéo locale stockée dans un tampon dans le parcours
  partagé.

À ce jour, le parcours en direct partagé `videoToVideo` couvre uniquement `runway` lorsque vous
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

## Pages connexes

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
