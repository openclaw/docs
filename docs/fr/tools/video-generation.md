---
read_when:
    - Génération de vidéos via l’agent
    - Configuration des fournisseurs et modèles de génération vidéo
    - Comprendre les paramètres de l’outil video_generate
sidebarTitle: Video generation
summary: Générez des vidéos via video_generate à partir de références textuelles, d’images ou de vidéos sur 16 backends de fournisseurs
title: Génération vidéo
x-i18n:
    generated_at: "2026-04-30T07:54:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: c91409057210af560d389513c2049d643c3e1602df51aa9825ceb01571626cdf
    source_path: tools/video-generation.md
    workflow: 16
---

Les agents OpenClaw peuvent générer des vidéos à partir de prompts textuels, d’images de référence ou de vidéos existantes. Seize backends fournisseurs sont pris en charge, chacun avec des options de modèle, des modes d’entrée et des ensembles de fonctionnalités différents. L’agent choisit automatiquement le bon fournisseur en fonction de votre configuration et des clés API disponibles.

<Note>
L’outil `video_generate` apparaît uniquement lorsqu’au moins un fournisseur de génération vidéo est disponible. Si vous ne le voyez pas dans les outils de votre agent, définissez une clé API de fournisseur ou configurez `agents.defaults.videoGenerationModel`.
</Note>

OpenClaw traite la génération vidéo selon trois modes d’exécution :

- `generate` — requêtes texte vers vidéo sans média de référence.
- `imageToVideo` — la requête inclut une ou plusieurs images de référence.
- `videoToVideo` — la requête inclut une ou plusieurs vidéos de référence.

Les fournisseurs peuvent prendre en charge n’importe quel sous-ensemble de ces modes. L’outil valide le mode actif avant la soumission et indique les modes pris en charge dans `action=list`.

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
    > Générez une vidéo cinématographique de 5 secondes montrant un homard sympathique qui surfe au coucher du soleil.

    L’agent appelle automatiquement `video_generate`. Aucune liste d’autorisation
    d’outils n’est nécessaire.

  </Step>
</Steps>

## Fonctionnement de la génération asynchrone

La génération vidéo est asynchrone. Lorsque l’agent appelle `video_generate` dans une
session :

1. OpenClaw soumet la requête au fournisseur et renvoie immédiatement un identifiant de tâche.
2. Le fournisseur traite la tâche en arrière-plan (généralement de 30 secondes à 5 minutes selon le fournisseur et la résolution).
3. Lorsque la vidéo est prête, OpenClaw réveille la même session avec un événement interne d’achèvement.
4. L’agent publie la vidéo terminée dans la conversation d’origine.

Tant qu’une tâche est en cours, les appels `video_generate` en double dans la même
session renvoient l’état de la tâche actuelle au lieu de démarrer une autre
génération. Utilisez `openclaw tasks list` ou `openclaw tasks show <taskId>` pour
vérifier la progression depuis la CLI.

En dehors des exécutions d’agent adossées à une session (par exemple, les appels directs d’outils),
l’outil revient à la génération en ligne et renvoie le chemin du média final
dans le même tour.

Les fichiers vidéo générés sont enregistrés dans le stockage média géré par OpenClaw lorsque
le fournisseur renvoie des octets. Le plafond d’enregistrement par défaut des vidéos générées suit
la limite des médias vidéo, et `agents.defaults.mediaMaxMb` l’augmente pour
les rendus plus volumineux. Lorsqu’un fournisseur renvoie également une URL de sortie hébergée, OpenClaw
peut transmettre cette URL au lieu de faire échouer la tâche si la persistance locale
rejette un fichier trop volumineux.

### Cycle de vie des tâches

| État        | Signification                                                                                   |
| ----------- | ------------------------------------------------------------------------------------------------ |
| `queued`    | Tâche créée, en attente d’acceptation par le fournisseur.                                        |
| `running`   | Le fournisseur traite la tâche (généralement 30 secondes à 5 minutes selon le fournisseur et la résolution). |
| `succeeded` | Vidéo prête ; l’agent se réveille et la publie dans la conversation.                             |
| `failed`    | Erreur du fournisseur ou délai d’attente dépassé ; l’agent se réveille avec les détails de l’erreur. |

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

## Fournisseurs pris en charge

| Fournisseur           | Modèle par défaut                | Texte | Réf. image                                           | Réf. vidéo                                      | Auth                                     |
| --------------------- | ------------------------------- | :---: | ---------------------------------------------------- | ----------------------------------------------- | ---------------------------------------- |
| Alibaba               | `wan2.6-t2v`                    |   ✓   | Oui (URL distante)                                   | Oui (URL distante)                              | `MODELSTUDIO_API_KEY`                    |
| BytePlus (1.0)        | `seedance-1-0-pro-250528`       |   ✓   | Jusqu’à 2 images (modèles I2V uniquement ; première + dernière image) | —                                               | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 1.5 | `seedance-1-5-pro-251215`       |   ✓   | Jusqu’à 2 images (première + dernière image via le rôle) | —                                               | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 2.0 | `dreamina-seedance-2-0-260128`  |   ✓   | Jusqu’à 9 images de référence                        | Jusqu’à 3 vidéos                                | `BYTEPLUS_API_KEY`                       |
| ComfyUI               | `workflow`                      |   ✓   | 1 image                                              | —                                               | `COMFY_API_KEY` or `COMFY_CLOUD_API_KEY` |
| DeepInfra             | `Pixverse/Pixverse-T2V`         |   ✓   | —                                                    | —                                               | `DEEPINFRA_API_KEY`                      |
| fal                   | `fal-ai/minimax/video-01-live`  |   ✓   | 1 image ; jusqu’à 9 avec Seedance reference-to-video | Jusqu’à 3 vidéos avec Seedance reference-to-video | `FAL_KEY`                                |
| Google                | `veo-3.1-fast-generate-preview` |   ✓   | 1 image                                              | 1 vidéo                                         | `GEMINI_API_KEY`                         |
| MiniMax               | `MiniMax-Hailuo-2.3`            |   ✓   | 1 image                                              | —                                               | `MINIMAX_API_KEY` or MiniMax OAuth       |
| OpenAI                | `sora-2`                        |   ✓   | 1 image                                              | 1 vidéo                                         | `OPENAI_API_KEY`                         |
| OpenRouter            | `google/veo-3.1-fast`           |   ✓   | Jusqu’à 4 images (première/dernière image ou références) | —                                               | `OPENROUTER_API_KEY`                     |
| Qwen                  | `wan2.6-t2v`                    |   ✓   | Oui (URL distante)                                   | Oui (URL distante)                              | `QWEN_API_KEY`                           |
| Runway                | `gen4.5`                        |   ✓   | 1 image                                              | 1 vidéo                                         | `RUNWAYML_API_SECRET`                    |
| Together              | `Wan-AI/Wan2.2-T2V-A14B`        |   ✓   | 1 image                                              | —                                               | `TOGETHER_API_KEY`                       |
| Vydra                 | `veo3`                          |   ✓   | 1 image (`kling`)                                    | —                                               | `VYDRA_API_KEY`                          |
| xAI                   | `grok-imagine-video`            |   ✓   | 1 image de première image ou jusqu’à 7 `reference_image`s | 1 vidéo                                         | `XAI_API_KEY`                            |

Certains fournisseurs acceptent des variables d’environnement de clé API supplémentaires ou alternatives. Consultez
les [pages des fournisseurs](#related) individuelles pour plus de détails.

Exécutez `video_generate action=list` pour inspecter les fournisseurs, modèles et
modes d’exécution disponibles au moment de l’exécution.

### Matrice des capacités

Le contrat de mode explicite utilisé par `video_generate`, les tests de contrat et
le sweep live partagé :

| Fournisseur | `generate` | `imageToVideo` | `videoToVideo` | Lanes live partagées aujourd’hui                                                                                                         |
| ----------- | :--------: | :------------: | :------------: | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Alibaba     |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo` ; `videoToVideo` ignoré car ce fournisseur nécessite des URL vidéo `http(s)` distantes                        |
| BytePlus    |     ✓      |       ✓        |       —        | `generate`, `imageToVideo`                                                                                                               |
| ComfyUI     |     ✓      |       ✓        |       —        | Non inclus dans le sweep partagé ; la couverture propre au workflow se trouve avec les tests Comfy                                      |
| DeepInfra   |     ✓      |       —        |       —        | `generate` ; les schémas vidéo DeepInfra natifs sont texte vers vidéo dans le contrat intégré                                            |
| fal         |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo` ; `videoToVideo` uniquement avec Seedance reference-to-video                                                   |
| Google      |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo` ; `videoToVideo` partagé ignoré car le sweep Gemini/Veo actuel adossé à des tampons n’accepte pas cette entrée |
| MiniMax     |     ✓      |       ✓        |       —        | `generate`, `imageToVideo`                                                                                                               |
| OpenAI      |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo` ; `videoToVideo` partagé ignoré car ce chemin d’organisation/d’entrée nécessite actuellement un accès inpaint/remix côté fournisseur |
| OpenRouter  |     ✓      |       ✓        |       —        | `generate`, `imageToVideo`                                                                                                               |
| Qwen        |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo` ; `videoToVideo` ignoré car ce fournisseur nécessite des URL vidéo `http(s)` distantes                        |
| Runway      |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo` ; `videoToVideo` s’exécute uniquement lorsque le modèle sélectionné est `runway/gen4_aleph`                  |
| Together    |     ✓      |       ✓        |       —        | `generate`, `imageToVideo`                                                                                                               |
| Vydra       |     ✓      |       ✓        |       —        | `generate` ; `imageToVideo` partagé ignoré car `veo3` intégré est uniquement textuel et `kling` intégré nécessite une URL d’image distante |
| xAI         |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo` ; `videoToVideo` ignoré car ce fournisseur nécessite actuellement une URL MP4 distante                       |

## Paramètres de l’outil

### Obligatoires

<ParamField path="prompt" type="string" required>
  Description textuelle de la vidéo à générer. Obligatoire pour `action: "generate"`.
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
Audio de référence unique (chemin ou URL). Utilisé pour la musique de fond ou une
référence vocale lorsque le fournisseur prend en charge les entrées audio.
</ParamField>
<ParamField path="audioRefs" type="string[]">Plusieurs audios de référence (jusqu’à 3).</ParamField>
<ParamField path="audioRoles" type="string[]">
Indications de rôle facultatives par position, parallèles à la liste audio combinée.
Valeur canonique : `reference_audio`.
</ParamField>

<Note>
Les indications de rôle sont transmises au fournisseur telles quelles. Les valeurs canoniques proviennent de
l’union `VideoGenerationAssetRole`, mais les fournisseurs peuvent accepter des
chaînes de rôle supplémentaires. Les tableaux `*Roles` ne doivent pas contenir plus d’entrées que la
liste de référence correspondante ; les erreurs de décalage d’un élément échouent avec une erreur claire.
Utilisez une chaîne vide pour laisser un emplacement non défini. Pour xAI, définissez chaque rôle d’image sur
`reference_image` afin d’utiliser son mode de génération `reference_images` ; omettez le
rôle ou utilisez `first_frame` pour l’image-vers-vidéo avec une seule image.
</Note>

### Contrôles de style

<ParamField path="aspectRatio" type="string">
  `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9`, ou `adaptive`.
</ParamField>
<ParamField path="resolution" type="string">`480P`, `720P`, `768P`, ou `1080P`.</ParamField>
<ParamField path="durationSeconds" type="number">
  Durée cible en secondes (arrondie à la valeur prise en charge par le fournisseur la plus proche).
</ParamField>
<ParamField path="size" type="string">Indication de taille lorsque le fournisseur la prend en charge.</ParamField>
<ParamField path="audio" type="boolean">
  Active l’audio généré dans la sortie lorsque c’est pris en charge. Distinct de `audioRef*` (entrées).
</ParamField>
<ParamField path="watermark" type="boolean">Active ou désactive le filigrane du fournisseur lorsque c’est pris en charge.</ParamField>

`adaptive` est une sentinelle propre au fournisseur : elle est transmise telle quelle aux
fournisseurs qui déclarent `adaptive` dans leurs capacités (par exemple BytePlus
Seedance l’utilise pour détecter automatiquement le ratio à partir des dimensions
de l’image d’entrée). Les fournisseurs qui ne la déclarent pas exposent la valeur via
`details.ignoredOverrides` dans le résultat de l’outil, afin que l’abandon soit visible.

### Avancé

<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  `"status"` renvoie la tâche de session actuelle ; `"list"` inspecte les fournisseurs.
</ParamField>
<ParamField path="model" type="string">Remplacement du fournisseur/modèle (par exemple `runway/gen4.5`).</ParamField>
<ParamField path="filename" type="string">Indication de nom de fichier de sortie.</ParamField>
<ParamField path="timeoutMs" type="number">Délai d’expiration facultatif de la requête fournisseur, en millisecondes.</ParamField>
<ParamField path="providerOptions" type="object">
  Options propres au fournisseur sous forme d’objet JSON (par exemple `{"seed": 42, "draft": true}`).
  Les fournisseurs qui déclarent un schéma typé valident les clés et les types ; les clés
  inconnues ou les incompatibilités ignorent le candidat pendant le fallback. Les fournisseurs sans
  schéma déclaré reçoivent les options telles quelles. Exécutez `video_generate action=list`
  pour voir ce que chaque fournisseur accepte.
</ParamField>

<Note>
Tous les fournisseurs ne prennent pas en charge tous les paramètres. OpenClaw normalise la durée vers
la valeur prise en charge par le fournisseur la plus proche, et remappe les indications de géométrie traduites
comme la taille vers le ratio d’aspect lorsqu’un fournisseur de fallback expose une surface de contrôle
différente. Les remplacements réellement non pris en charge sont ignorés au mieux
et signalés comme avertissements dans le résultat de l’outil. Les limites strictes de capacité
(comme un nombre trop élevé d’entrées de référence) échouent avant la soumission. Les résultats de l’outil
signalent les paramètres appliqués ; `details.normalization` capture toute traduction
de la demande vers l’application.
</Note>

Les entrées de référence sélectionnent le mode d’exécution :

- Aucun média de référence → `generate`
- Toute référence d’image → `imageToVideo`
- Toute référence vidéo → `videoToVideo`
- Les entrées audio de référence **ne** changent pas le mode résolu ; elles s’appliquent
  par-dessus le mode sélectionné par les références image/vidéo, et ne fonctionnent
  qu’avec les fournisseurs qui déclarent `maxInputAudios`.

Les références mixtes image et vidéo ne constituent pas une surface de capacité partagée stable.
Préférez un seul type de référence par requête.

#### Fallback et options typées

Certaines vérifications de capacité sont appliquées au niveau du fallback plutôt qu’à la
frontière de l’outil, de sorte qu’une requête qui dépasse les limites du fournisseur principal peut
tout de même s’exécuter sur un fallback capable :

- Le candidat actif ne déclarant pas `maxInputAudios` (ou déclarant `0`) est ignoré lorsque
  la requête contient des références audio ; le candidat suivant est essayé.
- Le `maxDurationSeconds` du candidat actif est inférieur au `durationSeconds` demandé
  sans liste `supportedDurationSeconds` déclarée → ignoré.
- La requête contient `providerOptions` et le candidat actif déclare explicitement
  un schéma `providerOptions` typé → ignoré si les clés fournies ne sont
  pas dans le schéma ou si les types de valeurs ne correspondent pas. Les fournisseurs sans
  schéma déclaré reçoivent les options telles quelles (transmission directe
  rétrocompatible). Un fournisseur peut se désinscrire de toutes les options fournisseur en
  déclarant un schéma vide (`capabilities.providerOptions: {}`), ce qui
  provoque le même abandon qu’une incompatibilité de type.

La première raison d’abandon dans une requête est journalisée au niveau `warn` afin que les opérateurs voient quand
leur fournisseur principal a été écarté ; les abandons suivants sont journalisés au niveau `debug` pour
garder les longues chaînes de fallback discrètes. Si tous les candidats sont ignorés, l’erreur
agrégée inclut la raison d’abandon pour chacun.

## Actions

| Action     | Ce qu’elle fait                                                                                         |
| ---------- | -------------------------------------------------------------------------------------------------------- |
| `generate` | Par défaut. Crée une vidéo à partir du prompt donné et des entrées de référence facultatives.            |
| `status`   | Vérifie l’état de la tâche vidéo en cours pour la session actuelle sans lancer une autre génération.     |
| `list`     | Affiche les fournisseurs, modèles et leurs capacités disponibles.                                        |

## Sélection du modèle

OpenClaw résout le modèle dans cet ordre :

1. **Paramètre d’outil `model`** — si l’agent en spécifie un dans l’appel.
2. **`videoGenerationModel.primary`** depuis la configuration.
3. **`videoGenerationModel.fallbacks`** dans l’ordre.
4. **Détection automatique** — les fournisseurs qui disposent d’une authentification valide, en commençant par le
   fournisseur par défaut actuel, puis les fournisseurs restants dans l’ordre
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

## Notes sur les fournisseurs

<AccordionGroup>
  <Accordion title="Alibaba">
    Utilise le point de terminaison asynchrone DashScope / Model Studio. Les images et
    vidéos de référence doivent être des URL `http(s)` distantes.
  </Accordion>
  <Accordion title="BytePlus (1.0)">
    ID du fournisseur : `byteplus`.

    Modèles : `seedance-1-0-pro-250528` (par défaut),
    `seedance-1-0-pro-t2v-250528`, `seedance-1-0-pro-fast-251015`,
    `seedance-1-0-lite-t2v-250428`, `seedance-1-0-lite-i2v-250428`.

    Les modèles T2V (`*-t2v-*`) n’acceptent pas les entrées image ; les modèles I2V et
    les modèles généraux `*-pro-*` prennent en charge une seule image de référence (première
    image). Passez l’image positionnellement ou définissez `role: "first_frame"`.
    Les ID de modèle T2V sont automatiquement remplacés par la variante I2V
    correspondante lorsqu’une image est fournie.

    Clés `providerOptions` prises en charge : `seed` (nombre), `draft` (booléen —
    force 480p), `camera_fixed` (booléen).

  </Accordion>
  <Accordion title="BytePlus Seedance 1.5">
    Nécessite le plugin [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark).
    ID du fournisseur : `byteplus-seedance15`. Modèle :
    `seedance-1-5-pro-251215`.

    Utilise l’API unifiée `content[]`. Prend en charge au plus 2 images d’entrée
    (`first_frame` + `last_frame`). Toutes les entrées doivent être des URL `https://`
    distantes. Définissez `role: "first_frame"` / `"last_frame"` sur chaque image, ou
    passez les images positionnellement.

    `aspectRatio: "adaptive"` détecte automatiquement le ratio à partir de l’image d’entrée.
    `audio: true` correspond à `generate_audio`. `providerOptions.seed`
    (nombre) est transmis.

  </Accordion>
  <Accordion title="BytePlus Seedance 2.0">
    Nécessite le plugin [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark).
    ID du fournisseur : `byteplus-seedance2`. Modèles :
    `dreamina-seedance-2-0-260128`,
    `dreamina-seedance-2-0-fast-260128`.

    Utilise l’API unifiée `content[]`. Prend en charge jusqu’à 9 images de référence,
    3 vidéos de référence et 3 audios de référence. Toutes les entrées doivent être des URL
    `https://` distantes. Définissez `role` sur chaque ressource — valeurs prises en charge :
    `"first_frame"`, `"last_frame"`, `"reference_image"`,
    `"reference_video"`, `"reference_audio"`.

    `aspectRatio: "adaptive"` détecte automatiquement le ratio à partir de l’image d’entrée.
    `audio: true` correspond à `generate_audio`. `providerOptions.seed`
    (nombre) est transmis.

  </Accordion>
  <Accordion title="ComfyUI">
    Exécution locale ou cloud pilotée par workflow. Prend en charge le texte-vers-vidéo et
    l’image-vers-vidéo via le graphe configuré.
  </Accordion>
  <Accordion title="fal">
    Utilise un flux adossé à une file d’attente pour les tâches de longue durée. La plupart des modèles vidéo fal
    acceptent une seule référence image. Les modèles référence-vers-vidéo Seedance 2.0
    acceptent jusqu’à 9 images, 3 vidéos et 3 références audio, avec
    au plus 12 fichiers de référence au total.
  </Accordion>
  <Accordion title="Google (Gemini / Veo)">
    Prend en charge une référence image ou une référence vidéo.
  </Accordion>
  <Accordion title="MiniMax">
    Une seule référence image.
  </Accordion>
  <Accordion title="OpenAI">
    Seul le remplacement `size` est transmis. Les autres remplacements de style
    (`aspectRatio`, `resolution`, `audio`, `watermark`) sont ignorés avec
    un avertissement.
  </Accordion>
  <Accordion title="OpenRouter">
    Utilise l’API asynchrone `/videos` d’OpenRouter. OpenClaw soumet la
    tâche, interroge `polling_url`, et télécharge soit `unsigned_urls`, soit le
    point de terminaison documenté du contenu de tâche. Le `google/veo-3.1-fast` par défaut inclus
    annonce des durées de 4/6/8 secondes, des résolutions `720P`/`1080P`, et
    des ratios d’aspect `16:9`/`9:16`.
  </Accordion>
  <Accordion title="Qwen">
    Même backend DashScope qu’Alibaba. Les entrées de référence doivent être des URL
    `http(s)` distantes ; les fichiers locaux sont rejetés d’emblée.
  </Accordion>
  <Accordion title="Runway">
    Prend en charge les fichiers locaux via des URI de données. Le vidéo-vers-vidéo nécessite
    `runway/gen4_aleph`. Les exécutions texte seul exposent les ratios d’aspect
    `16:9` et `9:16`.
  </Accordion>
  <Accordion title="Together">
    Une seule référence image.
  </Accordion>
  <Accordion title="Vydra">
    Utilise directement `https://www.vydra.ai/api/v1` pour éviter les redirections
    qui suppriment l’authentification. `veo3` est inclus uniquement pour le texte-vers-vidéo ; `kling` nécessite
    une URL d’image distante.
  </Accordion>
  <Accordion title="xAI">
    Prend en charge le texte-vers-vidéo, l’image-vers-vidéo avec une seule image de départ, jusqu’à 7
    entrées `reference_image` via les `reference_images` de xAI, et les flux distants
    de modification/extension vidéo.
  </Accordion>
</AccordionGroup>

## Modes de capacité des fournisseurs

Le contrat partagé de génération vidéo prend en charge des capacités propres à chaque mode
au lieu de simples limites agrégées à plat. Les nouvelles implémentations de fournisseurs
devraient privilégier des blocs de mode explicites :

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

Les champs agrégés à plat tels que `maxInputImages` et `maxInputVideos` ne sont
**pas** suffisants pour annoncer la prise en charge des modes de transformation. Les fournisseurs doivent
déclarer explicitement `generate`, `imageToVideo` et `videoToVideo` afin que les tests en conditions réelles,
les tests de contrat et l’outil partagé `video_generate` puissent valider
la prise en charge des modes de manière déterministe.

Quand un modèle d’un fournisseur prend en charge davantage d’entrées de référence que
les autres, utilisez `maxInputImagesByModel`, `maxInputVideosByModel` ou
`maxInputAudiosByModel` au lieu d’augmenter la limite globale du mode.

## Tests en conditions réelles

Couverture en conditions réelles à activer explicitement pour les fournisseurs groupés partagés :

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts
```

Commande d’encapsulation du dépôt :

```bash
pnpm test:live:media video
```

Ce fichier de tests en conditions réelles charge les variables d’environnement de fournisseur manquantes depuis `~/.profile`, privilégie
par défaut les clés d’API en conditions réelles/d’environnement par rapport aux profils d’authentification stockés, et exécute
par défaut un smoke test compatible avec les releases :

- `generate` pour chaque fournisseur non-FAL dans le balayage.
- Prompt de homard d’une seconde.
- Plafond d’opération par fournisseur depuis
  `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (`180000` par défaut).

FAL est à activer explicitement, car la latence de file d’attente côté fournisseur peut dominer
le temps de release :

```bash
pnpm test:live:media video --video-providers fal
```

Définissez `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` pour exécuter aussi les
modes de transformation déclarés que le balayage partagé peut exercer en toute sécurité avec des médias locaux :

- `imageToVideo` quand `capabilities.imageToVideo.enabled`.
- `videoToVideo` quand `capabilities.videoToVideo.enabled` et que le
  fournisseur/modèle accepte une entrée vidéo locale basée sur un tampon dans le balayage
  partagé.

Aujourd’hui, la voie de test en conditions réelles partagée `videoToVideo` couvre `runway` uniquement lorsque vous
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

## Articles connexes

- [Alibaba Model Studio](/fr/providers/alibaba)
- [Tâches en arrière-plan](/fr/automation/tasks) — suivi des tâches pour la génération vidéo asynchrone
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
