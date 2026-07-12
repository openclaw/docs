---
read_when:
    - Générer de la musique ou du contenu audio via l’agent
    - Configuration des fournisseurs et des modèles de génération musicale
    - Comprendre les paramètres de l’outil music_generate
sidebarTitle: Music generation
summary: Générez de la musique via music_generate avec les workflows ComfyUI, fal, Google Lyria, MiniMax et OpenRouter
title: Génération musicale
x-i18n:
    generated_at: "2026-07-12T03:24:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5a540f537141f0d97b264420aae9e986c1f0c3927b8988ebbaf3798b8afd5dd2
    source_path: tools/music-generation.md
    workflow: 16
---

L’outil `music_generate` crée de la musique ou de l’audio grâce à la
fonctionnalité partagée de génération musicale, reposant sur ComfyUI, fal,
Google, MiniMax et OpenRouter.

<Note>
`music_generate` n’apparaît que lorsqu’au moins un fournisseur de génération
musicale est disponible : une configuration explicite
`agents.defaults.musicGenerationModel` ou un fournisseur configuré avec une
authentification (par exemple, une clé API définie).
</Note>

Pour les exécutions d’agent adossées à une session, `music_generate` démarre
sous forme de tâche en arrière-plan, suit sa progression dans le registre des
tâches, puis réveille l’agent lorsque la piste est prête afin qu’il puisse en
informer l’utilisateur et joindre l’audio final. L’agent d’achèvement respecte
le contrat de réponse visible de la session : réponse finale automatique
lorsqu’elle est configurée, ou `message(action="send")` lorsque la session
requiert l’outil de messagerie. Si la session du demandeur est inactive ou si
son réveil échoue et que l’audio généré manque toujours dans la réponse,
OpenClaw envoie directement un message de secours idempotent contenant
uniquement l’audio manquant.

## Démarrage rapide

<Tabs>
  <Tab title="Avec fournisseur partagé">
    <Steps>
      <Step title="Configurer l’authentification">
        Définissez une clé API pour au moins un fournisseur, par exemple
        `GEMINI_API_KEY` ou `MINIMAX_API_KEY`.
      </Step>
      <Step title="Choisir un modèle par défaut (facultatif)">
        ```json5
        {
          agents: {
            defaults: {
              musicGenerationModel: {
                primary: "google/lyria-3-clip-preview",
              },
            },
          },
        }
        ```
      </Step>
      <Step title="Demander à l’agent">
        _« Générez une piste synthpop entraînante sur un trajet nocturne dans
        une ville illuminée de néons. »_

        L’agent appelle automatiquement `music_generate`. Il n’est pas
        nécessaire d’ajouter l’outil à une liste d’autorisation.
      </Step>
    </Steps>

    Sans exécution d’agent adossée à une session (dans les contextes
    directs/locaux), l’outil s’exécute directement et renvoie le chemin final
    du média dans le même résultat d’outil.

  </Tab>
  <Tab title="Workflow ComfyUI">
    <Steps>
      <Step title="Configurer le workflow">
        Configurez `plugins.entries.comfy.config.music` avec un workflow
        JSON ainsi que les nœuds de requête et de sortie.
      </Step>
      <Step title="Authentification cloud (facultatif)">
        Pour Comfy Cloud, définissez `COMFY_API_KEY` ou
        `COMFY_CLOUD_API_KEY`.
      </Step>
      <Step title="Appeler l’outil">
        ```text
        /tool music_generate prompt="Boucle de synthé ambiante chaleureuse avec une douce texture de bande"
        ```
      </Step>
    </Steps>
  </Tab>
</Tabs>

Exemples de requêtes :

```text
Générez une piste cinématographique au piano avec des cordes douces et sans voix.
```

```text
Générez une boucle chiptune énergique sur le lancement d’une fusée au lever du soleil.
```

Utilisez `action: "list"` pour consulter les fournisseurs et modèles
disponibles, et `action: "status"` pour consulter la tâche musicale active
adossée à la session :

```text
/tool music_generate action=list
/tool music_generate action=status
```

Exemple de génération directe :

```text
/tool music_generate prompt="Hip-hop lo-fi onirique avec une texture vinyle et une pluie légère" instrumental=true
```

## Fournisseurs pris en charge

| Fournisseur | Modèle par défaut            | Entrées de référence | Paramètres pris en charge                              | Authentification                         |
| ----------- | ---------------------------- | -------------------- | ------------------------------------------------------ | ---------------------------------------- |
| ComfyUI     | `workflow`                   | Jusqu’à 1 image      | Musique ou audio défini par le workflow                | `COMFY_API_KEY`, `COMFY_CLOUD_API_KEY`   |
| fal         | `fal-ai/minimax-music/v2.6`  | Aucune               | `lyrics`, `instrumental`, `durationSeconds`, `format`  | `FAL_KEY` ou `FAL_API_KEY`               |
| Google      | `lyria-3-clip-preview`       | Jusqu’à 10 images    | `lyrics`, `instrumental`, `format`                     | `GEMINI_API_KEY`, `GOOGLE_API_KEY`       |
| MiniMax     | `music-2.6`                  | Aucune               | `lyrics`, `instrumental`, `format` (mp3 uniquement)    | `MINIMAX_API_KEY` ou OAuth MiniMax       |
| OpenRouter  | `google/lyria-3-pro-preview` | Jusqu’à 1 image      | `lyrics`, `instrumental`, `durationSeconds`, `format`  | `OPENROUTER_API_KEY`                     |

MiniMax enregistre deux identifiants de fournisseur partageant les mêmes
modèles : `minimax` pour l’authentification par clé API et `minimax-portal`
pour OAuth. Les références de modèle suivent le mode d’authentification
(`minimax/music-2.6` ou `minimax-portal/music-2.6`) ; consultez
[MiniMax](/fr/providers/minimax#music-generation).

fal propose également `fal-ai/ace-step/prompt-to-audio` (wav, sans paroles,
sans option de sortie instrumentale) et
`fal-ai/stable-audio-25/text-to-audio` (wav, requête uniquement), en plus de
son modèle par défaut reposant sur MiniMax. Le modèle par défaut de Google,
`lyria-3-clip-preview`, produit uniquement du mp3 ;
`lyria-3-pro-preview` prend aussi en charge le wav. MiniMax propose également
`music-2.6-free`, `music-cover` et `music-cover-free`. OpenRouter propose
également `google/lyria-3-clip-preview`.

### Matrice des fonctionnalités

Le contrat explicite des modes utilisé par `music_generate`, les tests de
contrat et la campagne de tests en conditions réelles partagée :

| Fournisseur | `generate` | `edit` | Limite de modification | Parcours partagés en conditions réelles                                  |
| ----------- | :--------: | :----: | ---------------------- | ------------------------------------------------------------------------- |
| ComfyUI     |     ✓      |   ✓    | 1 image                | Absent de la campagne partagée ; couvert par `extensions/comfy/comfy.live.test.ts` |
| fal         |     ✓      |   —    | Aucune                 | `generate`                                                                |
| Google      |     ✓      |   ✓    | 10 images              | `generate`, `edit`                                                        |
| MiniMax     |     ✓      |   —    | Aucune                 | `generate`                                                                |
| OpenRouter  |     ✓      |   ✓    | 1 image                | `generate`, `edit`                                                        |

## Paramètres de l’outil

<ParamField path="prompt" type="string" required>
  Requête de génération musicale. Requise pour `action: "generate"`.
</ParamField>
<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  `"status"` renvoie la tâche actuelle de la session ; `"list"` consulte les
  fournisseurs.
</ParamField>
<ParamField path="model" type="string">
  Remplacement du fournisseur/modèle (par exemple
  `google/lyria-3-pro-preview`, `comfy/workflow`).
</ParamField>
<ParamField path="lyrics" type="string">
  Paroles facultatives lorsque le fournisseur accepte une entrée explicite
  de paroles.
</ParamField>
<ParamField path="instrumental" type="boolean">
  Demande une sortie uniquement instrumentale lorsque le fournisseur la
  prend en charge.
</ParamField>
<ParamField path="image" type="string">
  Chemin ou URL d’une seule image de référence.
</ParamField>
<ParamField path="images" type="string[]">
  Plusieurs images de référence (jusqu’à 10 pour les fournisseurs qui les
  prennent en charge).
</ParamField>
<ParamField path="durationSeconds" type="number">
  Durée cible en secondes lorsque le fournisseur prend en charge les
  indications de durée.
</ParamField>
<ParamField path="format" type='"mp3" | "wav"'>
  Indication du format de sortie lorsque le fournisseur la prend en charge.
</ParamField>
<ParamField path="filename" type="string">Indication du nom du fichier de sortie.</ParamField>

<Note>
Tous les fournisseurs ne prennent pas en charge tous les paramètres.
OpenClaw valide néanmoins les limites strictes, comme le nombre d’entrées,
avant l’envoi. Lorsqu’un fournisseur prend en charge la durée, mais impose un
maximum inférieur à la valeur demandée, OpenClaw ramène celle-ci à la durée
prise en charge la plus proche. Les indications facultatives réellement non
prises en charge sont ignorées avec un avertissement lorsque le fournisseur
ou le modèle sélectionné ne peut pas les respecter. Les résultats de l’outil
indiquent les paramètres appliqués ; `details.normalization` consigne toute
correspondance entre les valeurs demandées et appliquées.
</Note>

Les délais d’expiration des requêtes aux fournisseurs relèvent uniquement de
la configuration de l’opérateur. OpenClaw utilise
`agents.defaults.musicGenerationModel.timeoutMs` lorsqu’il est configuré,
porte les valeurs inférieures à 120000ms à 120000ms et, dans le cas
contraire, applique par défaut un délai de 300000ms aux requêtes des
fournisseurs.

## Comportement asynchrone

La génération musicale adossée à une session s’exécute sous forme de tâche en
arrière-plan :

- **Tâche en arrière-plan :** `music_generate` crée une tâche en arrière-plan,
  renvoie immédiatement une réponse indiquant le démarrage et la tâche, puis
  publie ultérieurement la piste terminée dans un message de suivi de l’agent.
- **Prévention des doublons :** tant qu’une tâche est `queued` ou `running`,
  les appels ultérieurs à `music_generate` dans la même session renvoient
  l’état de la tâche au lieu de démarrer une autre génération. Utilisez
  `action: "status"` pour effectuer une vérification explicite. Une requête
  correspondante récemment terminée est également dédupliquée pendant
  2 minutes.
- **Consultation de l’état :** `openclaw tasks list` ou
  `openclaw tasks show <taskId>` permet de consulter les états en attente,
  en cours et terminaux.
- **Réveil à l’achèvement :** OpenClaw réinjecte un événement interne
  d’achèvement dans la même session afin que le modèle puisse rédiger
  lui-même le message de suivi destiné à l’utilisateur.
- **Indication dans la requête :** les interactions utilisateur/manuelles
  ultérieures de la même session reçoivent une petite indication d’exécution
  lorsqu’une tâche musicale est déjà en cours, afin que le modèle ne rappelle
  pas aveuglément `music_generate`.
- **Solution de secours sans session :** les contextes directs/locaux sans
  véritable session d’agent s’exécutent directement et renvoient le résultat
  audio final dans la même interaction.

### Cycle de vie des tâches

La tâche musicale présente les mêmes états que le registre général des tâches
(consultez [Tâches en arrière-plan](/fr/automation/tasks#task-lifecycle) pour le
diagramme d’états complet, notamment `timed_out`, `cancelled` et `lost`). La
plupart des exécutions musicales passent par les états suivants :

| État        | Signification                                                                                          |
| ----------- | ------------------------------------------------------------------------------------------------------ |
| `queued`    | Tâche créée, en attente de son acceptation par le fournisseur.                                        |
| `running`   | Traitement en cours par le fournisseur (généralement de 30 secondes à 3 minutes selon le fournisseur et la durée). |
| `succeeded` | Piste prête ; l’agent se réveille et la publie dans la conversation.                                  |
| `failed`    | Erreur du fournisseur ou expiration du délai ; l’agent se réveille avec les détails de l’erreur.      |

Consultez l’état depuis la CLI :

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

## Configuration

### Sélection du modèle

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "google/lyria-3-clip-preview",
        fallbacks: ["fal/fal-ai/minimax-music/v2.6", "minimax/music-2.6"],
      },
    },
  },
}
```

### Ordre de sélection des fournisseurs

OpenClaw essaie les fournisseurs dans l’ordre suivant :

1. Paramètre `model` de l’appel de l’outil (si l’agent en précise un).
2. `musicGenerationModel.primary` provenant de la configuration.
3. `musicGenerationModel.fallbacks` dans l’ordre indiqué.
4. Détection automatique utilisant uniquement les valeurs par défaut des
   fournisseurs disposant d’une authentification :
   - d’abord, le fournisseur actuel du modèle de texte par défaut, s’il
     propose également la génération musicale ;
   - puis les autres fournisseurs de génération musicale enregistrés, par
     ordre alphabétique de leur identifiant.

Si un fournisseur échoue, le candidat suivant est essayé automatiquement. Si
tous échouent, l’erreur contient les détails de chaque tentative.

Définissez `agents.defaults.mediaGenerationAutoProviderFallback: false` pour
utiliser uniquement les entrées explicites `model`, `primary` et `fallbacks`.

## Notes sur les fournisseurs

<AccordionGroup>
  <Accordion title="ComfyUI">
    Piloté par des workflows et dépendant du graphe configuré ainsi que du mappage des nœuds
    pour les champs d’invite et de sortie. Le plugin `comfy` inclus s’intègre à l’outil
    partagé `music_generate` par l’intermédiaire du registre des fournisseurs
    de génération musicale.
  </Accordion>
  <Accordion title="fal">
    Utilise les points de terminaison des modèles fal via le mécanisme partagé d’authentification des fournisseurs. Le
    fournisseur inclus utilise par défaut `fal-ai/minimax-music/v2.6` et expose également
    `fal-ai/ace-step/prompt-to-audio` et
    `fal-ai/stable-audio-25/text-to-audio` pour les requêtes de génération audio à partir d’une invite.
    Les paroles et le mode instrumental sont réservés au modèle MiniMax ; les deux autres
    modèles acceptent uniquement une invite.
  </Accordion>
  <Accordion title="Google (Lyria 3)">
    Utilise la génération par lots de Lyria 3. Le flux inclus actuel prend en charge
    une invite, un texte de paroles facultatif et des images de référence facultatives. Le
    modèle `lyria-3-clip-preview` par défaut produit uniquement des fichiers mp3 ; le
    modèle `lyria-3-pro-preview` prend également en charge le format wav.
  </Accordion>
  <Accordion title="MiniMax">
    Utilise le point de terminaison par lots `music_generation`. Prend en charge une invite, des
    paroles facultatives, le mode instrumental et une sortie mp3 via l’authentification par clé
    d’API `minimax` ou OAuth `minimax-portal`. Expose également les modèles `music-2.6-free`,
    `music-cover` et `music-cover-free`.
  </Accordion>
  <Accordion title="OpenRouter">
    Utilise la sortie audio des complétions de conversation OpenRouter avec la diffusion en continu activée. Le
    fournisseur inclus utilise par défaut `google/lyria-3-pro-preview` et expose également
    `openrouter/google/lyria-3-clip-preview`.
  </Accordion>
</AccordionGroup>

## Choisir la bonne approche

- **Avec un fournisseur partagé** lorsque vous souhaitez sélectionner un modèle, bénéficier du
  basculement entre fournisseurs et utiliser le flux asynchrone intégré de tâches et d’état.
- **Via un Plugin (ComfyUI)** lorsque vous avez besoin d’un graphe de workflow personnalisé ou d’un
  fournisseur qui ne fait pas partie de la fonctionnalité musicale partagée incluse.

Si vous déboguez un comportement propre à ComfyUI, consultez
[ComfyUI](/fr/providers/comfy). Si vous déboguez le comportement d’un fournisseur
partagé, commencez par [fal](/fr/providers/fal), [Google (Gemini)](/fr/providers/google),
[MiniMax](/fr/providers/minimax) ou [OpenRouter](/fr/providers/openrouter).

## Modes de fonctionnalité des fournisseurs

Le contrat partagé de génération musicale prend en charge des déclarations de mode explicites :

- `generate` pour la génération à partir d’une invite uniquement.
- `edit` lorsque la requête comprend une ou plusieurs images de référence.

Les nouvelles implémentations de fournisseurs doivent privilégier des blocs de mode explicites :

```typescript
capabilities: {
  generate: {
    maxTracks: 1,
    supportsLyrics: true,
    supportsFormat: true,
  },
  edit: {
    enabled: true,
    maxTracks: 1,
    maxInputImages: 1,
    supportsFormat: true,
  },
}
```

Les anciens champs à plat tels que `maxInputImages`, `supportsLyrics` et
`supportsFormat` ne suffisent **pas** à annoncer la prise en charge de l’édition. Les fournisseurs
doivent déclarer explicitement `generate` et `edit` afin que les tests en conditions réelles, les tests de
contrat et l’outil partagé `music_generate` puissent valider la prise en charge des modes
de manière déterministe.

## Tests en conditions réelles

Couverture facultative en conditions réelles pour les fournisseurs partagés inclus (fal, Google, MiniMax,
OpenRouter) :

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts
```

Commande équivalente du dépôt, qui exécute le même fichier de test :

```bash
pnpm test:live:media:music
```

Par défaut, ce fichier de test en conditions réelles utilise les variables d’environnement des fournisseurs déjà exportées avant les profils
d’authentification stockés, et couvre à la fois `generate` et `edit` déclaré lorsque
le fournisseur active le mode d’édition. Couverture actuelle :

- `google` : `generate` et `edit`
- `fal` : `generate` uniquement
- `minimax` : `generate` uniquement
- `openrouter` : `generate` et `edit`
- `comfy` : couverture Comfy en conditions réelles distincte, hors de la campagne partagée des fournisseurs

Couverture facultative en conditions réelles pour le parcours musical ComfyUI inclus :

```bash
OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
```

Le fichier de test Comfy en conditions réelles couvre également les workflows d’image et de vidéo de Comfy lorsque ces
sections sont configurées.

## Pages connexes

- [Tâches en arrière-plan](/fr/automation/tasks) — suivi des tâches pour les exécutions détachées de `music_generate`
- [ComfyUI](/fr/providers/comfy)
- [Référence de configuration](/fr/gateway/config-agents#agent-defaults) — configuration de `musicGenerationModel`
- [Google (Gemini)](/fr/providers/google)
- [MiniMax](/fr/providers/minimax)
- [Modèles](/fr/concepts/models) — configuration des modèles et basculement
- [Présentation des outils](/fr/tools)
