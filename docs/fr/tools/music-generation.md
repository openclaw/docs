---
read_when:
    - Générer de la musique ou de l’audio via l’agent
    - Configuration des fournisseurs et modèles de génération musicale
    - Comprendre les paramètres de l’outil music_generate
sidebarTitle: Music generation
summary: Générez de la musique via music_generate dans les workflows ComfyUI, fal, Google Lyria, MiniMax et OpenRouter
title: Génération de musique
x-i18n:
    generated_at: "2026-06-27T18:19:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4fe6ad09b6e2cfae03bc5d5ef4368e80845a9e4a8c25c6303e181a6436a17c7e
    source_path: tools/music-generation.md
    workflow: 16
---

L’outil `music_generate` permet à l’agent de créer de la musique ou de l’audio via la
capacité partagée de génération musicale avec les fournisseurs configurés — ComfyUI,
fal, Google, MiniMax et OpenRouter aujourd’hui.

Pour les exécutions d’agent adossées à une session, OpenClaw lance la génération musicale comme une
tâche en arrière-plan, la suit dans le registre des tâches, puis réveille à nouveau l’agent
lorsque la piste est prête afin qu’il puisse prévenir l’utilisateur et joindre l’audio
terminé. L’agent de finalisation suit le mode normal de réponse visible de la session :
livraison automatique de la réponse finale lorsqu’elle est configurée, ou `message(action="send")`
lorsque la session exige l’outil de message. Si la session demandeuse est
inactive ou si son réveil actif échoue, et qu’un fichier audio généré manque encore
dans la réponse de finalisation, OpenClaw envoie un repli direct idempotent avec
uniquement l’audio manquant.

<Note>
L’outil partagé intégré n’apparaît que lorsqu’au moins un fournisseur de génération musicale
est disponible. Si vous ne voyez pas `music_generate` dans les outils de votre agent,
configurez `agents.defaults.musicGenerationModel` ou définissez une
clé d’API fournisseur.
</Note>

## Démarrage rapide

<Tabs>
  <Tab title="Adossé à un fournisseur partagé">
    <Steps>
      <Step title="Configurer l’authentification">
        Définissez une clé d’API pour au moins un fournisseur — par exemple
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
        _"Generate an upbeat synthpop track about a night drive through a
        neon city."_

        L’agent appelle `music_generate` automatiquement. Aucune liste
        d’autorisation d’outils n’est nécessaire.
      </Step>
    </Steps>

    Pour les contextes synchrones directs sans exécution d’agent adossée à une session,
    l’outil intégré se rabat tout de même sur la génération en ligne et renvoie
    le chemin du média final dans le résultat de l’outil.

  </Tab>
  <Tab title="Workflow ComfyUI">
    <Steps>
      <Step title="Configurer le workflow">
        Configurez `plugins.entries.comfy.config.music` avec un workflow
        JSON et des nœuds d’invite/de sortie.
      </Step>
      <Step title="Authentification cloud (facultative)">
        Pour Comfy Cloud, définissez `COMFY_API_KEY` ou `COMFY_CLOUD_API_KEY`.
      </Step>
      <Step title="Appeler l’outil">
        ```text
        /tool music_generate prompt="Warm ambient synth loop with soft tape texture"
        ```
      </Step>
    </Steps>
  </Tab>
</Tabs>

Exemples d’invites :

```text
Generate a cinematic piano track with soft strings and no vocals.
```

```text
Generate an energetic chiptune loop about launching a rocket at sunrise.
```

## Fournisseurs pris en charge

| Fournisseur | Modèle par défaut            | Entrées de référence | Contrôles pris en charge                            | Authentification                       |
| ---------- | ---------------------------- | ---------------- | ----------------------------------------------------- | -------------------------------------- |
| ComfyUI    | `workflow`                   | Jusqu’à 1 image  | Musique ou audio défini par le workflow               | `COMFY_API_KEY`, `COMFY_CLOUD_API_KEY` |
| fal        | `fal-ai/minimax-music/v2.6`  | Aucune           | `lyrics`, `instrumental`, `durationSeconds`, `format` | `FAL_KEY` ou `FAL_API_KEY`             |
| Google     | `lyria-3-clip-preview`       | Jusqu’à 10 images | `lyrics`, `instrumental`, `format`                    | `GEMINI_API_KEY`, `GOOGLE_API_KEY`     |
| MiniMax    | `music-2.6`                  | Aucune           | `lyrics`, `instrumental`, `format=mp3`                | `MINIMAX_API_KEY` ou OAuth MiniMax     |
| OpenRouter | `google/lyria-3-pro-preview` | Jusqu’à 1 image  | `lyrics`, `instrumental`, `durationSeconds`, `format` | `OPENROUTER_API_KEY`                   |

### Matrice des capacités

Le contrat de mode explicite utilisé par `music_generate`, les tests de contrat et le
balayage live partagé :

| Fournisseur | `generate` | `edit` | Limite de modification | Voies live partagées                                                     |
| ---------- | :--------: | :----: | ---------- | ------------------------------------------------------------------------- |
| ComfyUI    |     ✓      |   ✓    | 1 image    | Hors du balayage partagé ; couvert par `extensions/comfy/comfy.live.test.ts` |
| fal        |     ✓      |   —    | Aucune     | `generate`                                                                |
| Google     |     ✓      |   ✓    | 10 images  | `generate`, `edit`                                                        |
| MiniMax    |     ✓      |   —    | Aucune     | `generate`                                                                |
| OpenRouter |     ✓      |   ✓    | 1 image    | `generate`, `edit`                                                        |

Utilisez `action: "list"` pour inspecter les fournisseurs et modèles partagés disponibles à
l’exécution :

```text
/tool music_generate action=list
```

Utilisez `action: "status"` pour inspecter la tâche musicale active adossée à la session :

```text
/tool music_generate action=status
```

Exemple de génération directe :

```text
/tool music_generate prompt="Dreamy lo-fi hip hop with vinyl texture and gentle rain" instrumental=true
```

## Paramètres de l’outil

<ParamField path="prompt" type="string" required>
  Invite de génération musicale. Obligatoire pour `action: "generate"`.
</ParamField>
<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  `"status"` renvoie la tâche de session actuelle ; `"list"` inspecte les fournisseurs.
</ParamField>
<ParamField path="model" type="string">
  Remplacement du fournisseur/modèle (par ex. `google/lyria-3-pro-preview`,
  `comfy/workflow`).
</ParamField>
<ParamField path="lyrics" type="string">
  Paroles facultatives lorsque le fournisseur prend en charge une entrée explicite de paroles.
</ParamField>
<ParamField path="instrumental" type="boolean">
  Demande une sortie uniquement instrumentale lorsque le fournisseur la prend en charge.
</ParamField>
<ParamField path="image" type="string">
  Chemin ou URL d’une seule image de référence.
</ParamField>
<ParamField path="images" type="string[]">
  Plusieurs images de référence (jusqu’à 10 chez les fournisseurs compatibles).
</ParamField>
<ParamField path="durationSeconds" type="number">
  Durée cible en secondes lorsque le fournisseur prend en charge les indications de durée.
</ParamField>
<ParamField path="format" type='"mp3" | "wav"'>
  Indication de format de sortie lorsque le fournisseur la prend en charge.
</ParamField>
<ParamField path="filename" type="string">Indication de nom de fichier de sortie.</ParamField>

<Note>
Tous les fournisseurs ne prennent pas en charge tous les paramètres. OpenClaw valide tout de même les
limites strictes, comme le nombre d’entrées, avant l’envoi. Lorsqu’un fournisseur prend en charge
la durée mais utilise un maximum inférieur à la valeur demandée, OpenClaw
ramène la durée à la valeur prise en charge la plus proche. Les indications facultatives réellement non prises en charge
sont ignorées avec un avertissement lorsque le fournisseur ou le modèle sélectionné ne peut pas les respecter.
Les résultats de l’outil indiquent les paramètres appliqués ; `details.normalization`
capture tout mappage entre valeur demandée et valeur appliquée.
</Note>

Les délais d’expiration des requêtes fournisseur relèvent uniquement de la configuration opérateur. OpenClaw utilise
`agents.defaults.musicGenerationModel.timeoutMs` lorsqu’il est configuré, relève les valeurs
inférieures à 120000ms à 120000ms, et sinon définit par défaut les requêtes fournisseur à
300000ms.

## Comportement asynchrone

La génération musicale adossée à une session s’exécute comme une tâche en arrière-plan :

- **Tâche en arrière-plan :** `music_generate` crée une tâche en arrière-plan, renvoie immédiatement une
  réponse démarrée/tâche, et publie la piste terminée plus tard dans
  un message d’agent de suivi.
- **Prévention des doublons :** tant qu’une tâche est `queued` ou `running`, les appels
  `music_generate` ultérieurs dans la même session renvoient l’état de la tâche au lieu de
  lancer une autre génération. Utilisez `action: "status"` pour vérifier explicitement.
- **Consultation de l’état :** `openclaw tasks list` ou `openclaw tasks show <taskId>`
  inspecte les états en file d’attente, en cours d’exécution et terminaux.
- **Réveil de finalisation :** OpenClaw injecte un événement interne de finalisation dans
  la même session afin que le modèle puisse rédiger lui-même le suivi visible par l’utilisateur.
- **Indication d’invite :** les tours utilisateur/manuels ultérieurs dans la même session reçoivent une petite
  indication d’exécution lorsqu’une tâche musicale est déjà en cours, afin que le modèle
  ne rappelle pas aveuglément `music_generate`.
- **Repli sans session :** les contextes directs/locaux sans véritable session d’agent
  s’exécutent en ligne et renvoient le résultat audio final dans le même tour.

### Cycle de vie des tâches

| État        | Signification                                                                                  |
| ----------- | ---------------------------------------------------------------------------------------------- |
| `queued`    | Tâche créée, en attente d’acceptation par le fournisseur.                                      |
| `running`   | Le fournisseur traite la demande (généralement de 30 secondes à 3 minutes selon le fournisseur et la durée). |
| `succeeded` | Piste prête ; l’agent se réveille et la publie dans la conversation.                          |
| `failed`    | Erreur fournisseur ou délai d’expiration ; l’agent se réveille avec les détails de l’erreur.   |

Vérifiez l’état depuis la CLI :

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

OpenClaw essaie les fournisseurs dans cet ordre :

1. Paramètre `model` de l’appel d’outil (si l’agent en précise un).
2. `musicGenerationModel.primary` depuis la configuration.
3. `musicGenerationModel.fallbacks` dans l’ordre.
4. Détection automatique utilisant uniquement les valeurs par défaut des fournisseurs avec authentification :
   - fournisseur par défaut actuel en premier ;
   - fournisseurs de génération musicale enregistrés restants, par ordre d’identifiant de fournisseur.

Si un fournisseur échoue, le candidat suivant est essayé automatiquement. Si tous
échouent, l’erreur inclut les détails de chaque tentative.

Définissez `agents.defaults.mediaGenerationAutoProviderFallback: false` pour utiliser uniquement
les entrées explicites `model`, `primary` et `fallbacks`.

## Notes sur les fournisseurs

<AccordionGroup>
  <Accordion title="ComfyUI">
    Piloté par workflow et dépend du graphe configuré ainsi que du mappage des nœuds
    pour les champs d’invite/de sortie. Le Plugin `comfy` intégré se branche sur
    l’outil partagé `music_generate` via le registre des fournisseurs de génération musicale.
  </Accordion>
  <Accordion title="fal">
    Utilise les points de terminaison de modèles fal via le chemin d’authentification partagé des fournisseurs. Le
    fournisseur intégré utilise par défaut `fal-ai/minimax-music/v2.6` et expose également
    `fal-ai/ace-step/prompt-to-audio` et
    `fal-ai/stable-audio-25/text-to-audio` pour les requêtes de conversion d’invite en audio.
  </Accordion>
  <Accordion title="Google (Lyria 3)">
    Utilise la génération par lots Lyria 3. Le flux intégré actuel prend en charge
    l’invite, le texte de paroles facultatif et les images de référence facultatives.
  </Accordion>
  <Accordion title="MiniMax">
    Utilise le point de terminaison par lots `music_generation`. Prend en charge l’invite, les
    paroles facultatives, le mode instrumental et la sortie mp3 via l’authentification par clé d’API
    `minimax` ou OAuth `minimax-portal`.
  </Accordion>
  <Accordion title="OpenRouter">
    Utilise la sortie audio des complétions de chat OpenRouter avec le streaming activé. Le
    fournisseur intégré utilise par défaut `google/lyria-3-pro-preview` et expose également
    `openrouter/google/lyria-3-clip-preview`.
  </Accordion>
</AccordionGroup>

## Choisir le bon chemin

- **Adossé à un fournisseur partagé** lorsque vous voulez la sélection de modèle, le
  basculement entre fournisseurs et le flux intégré asynchrone de tâche/état.
- **Chemin Plugin (ComfyUI)** lorsque vous avez besoin d’un graphe de workflow personnalisé ou d’un
  fournisseur qui ne fait pas partie de la capacité musicale partagée intégrée.

Si vous déboguez un comportement spécifique à ComfyUI, consultez
[ComfyUI](/fr/providers/comfy). Si vous déboguez un comportement partagé de fournisseur,
commencez par [fal](/fr/providers/fal), [Google (Gemini)](/fr/providers/google),
[MiniMax](/fr/providers/minimax) ou [OpenRouter](/fr/providers/openrouter).

## Modes de capacité du fournisseur

Le contrat partagé de génération musicale prend en charge les déclarations de mode explicites :

- `generate` pour la génération à partir d’un prompt uniquement.
- `edit` lorsque la requête inclut une ou plusieurs images de référence.

Les nouvelles implémentations de fournisseurs doivent privilégier les blocs de mode explicites :

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

Les anciens champs plats tels que `maxInputImages`, `supportsLyrics` et
`supportsFormat` ne suffisent **pas** à annoncer la prise en charge de l’édition. Les fournisseurs
doivent déclarer `generate` et `edit` explicitement afin que les tests en conditions réelles, les tests de contrat
et l’outil partagé `music_generate` puissent valider la prise en charge des modes
de manière déterministe.

## Tests en conditions réelles

Couverture en conditions réelles optionnelle pour les fournisseurs groupés partagés :

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts
```

Wrapper du dépôt :

```bash
pnpm test:live:media music
```

Ce fichier en conditions réelles utilise par défaut les variables d’environnement de fournisseur déjà exportées avant les profils
d’authentification stockés, et exécute la couverture `generate` ainsi que la couverture `edit` déclarée lorsque
le fournisseur active le mode d’édition. Couverture actuelle :

- `google` : `generate` plus `edit`
- `fal` : `generate` uniquement
- `minimax` : `generate` uniquement
- `openrouter` : `generate` plus `edit`
- `comfy` : couverture Comfy en conditions réelles distincte, pas le balayage partagé des fournisseurs

Couverture en conditions réelles optionnelle pour le chemin musical ComfyUI groupé :

```bash
OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
```

Le fichier Comfy en conditions réelles couvre aussi les workflows d’image et de vidéo comfy lorsque ces
sections sont configurées.

## Connexe

- [Tâches en arrière-plan](/fr/automation/tasks) — suivi des tâches pour les exécutions détachées de `music_generate`
- [ComfyUI](/fr/providers/comfy)
- [Référence de configuration](/fr/gateway/config-agents#agent-defaults) — configuration `musicGenerationModel`
- [Google (Gemini)](/fr/providers/google)
- [MiniMax](/fr/providers/minimax)
- [Modèles](/fr/concepts/models) — configuration des modèles et basculement
- [Vue d’ensemble des outils](/fr/tools)
