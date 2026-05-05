---
read_when:
    - Générer de la musique ou de l’audio via l’agent
    - Configuration des fournisseurs et des modèles de génération musicale
    - Comprendre les paramètres de l’outil music_generate
sidebarTitle: Music generation
summary: Générer de la musique avec music_generate dans les flux de travail Google Lyria, MiniMax et ComfyUI
title: Génération de musique
x-i18n:
    generated_at: "2026-05-05T06:19:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: f5e74aa7d43ffe00adb6d6c170d36dbc107f2baf0069243733c5dd6e4582175a
    source_path: tools/music-generation.md
    workflow: 16
---

L’outil `music_generate` permet à l’agent de créer de la musique ou de l’audio via la fonctionnalité partagée de génération musicale avec des fournisseurs configurés : Google, MiniMax et, aujourd’hui, ComfyUI configuré par workflow.

Pour les exécutions d’agent adossées à une session, OpenClaw démarre la génération musicale comme une tâche en arrière-plan, la suit dans le registre des tâches, puis réveille de nouveau l’agent lorsque la piste est prête afin qu’il puisse prévenir l’utilisateur et joindre l’audio terminé. Dans les discussions de groupe/canal qui utilisent une livraison visible uniquement par l’outil de message, l’agent relaie le résultat via l’outil de message. Si l’agent de complétion écrit uniquement une réponse finale privée, OpenClaw utilise en recours un envoi direct au canal avec le média généré. Le réveil de complétion avertit explicitement l’agent que les réponses finales normales sont privées dans ces routes.

<Note>
L’outil partagé intégré apparaît uniquement lorsqu’au moins un fournisseur de génération musicale est disponible. Si vous ne voyez pas `music_generate` dans les outils de votre agent, configurez `agents.defaults.musicGenerationModel` ou définissez une clé d’API de fournisseur.
</Note>

## Démarrage rapide

<Tabs>
  <Tab title="Adossé à un fournisseur partagé">
    <Steps>
      <Step title="Configurer l’authentification">
        Définissez une clé d’API pour au moins un fournisseur, par exemple
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
        _« Génère une piste synthpop entraînante sur une virée de nuit dans une
        ville néon. »_

        L’agent appelle `music_generate` automatiquement. Aucune liste
        d’autorisation d’outil n’est nécessaire.
      </Step>
    </Steps>

    Pour les contextes synchrones directs sans exécution d’agent adossée à une session,
    l’outil intégré utilise toujours en recours une génération en ligne et renvoie
    le chemin du média final dans le résultat de l’outil.

  </Tab>
  <Tab title="Workflow ComfyUI">
    <Steps>
      <Step title="Configurer le workflow">
        Configurez `plugins.entries.comfy.config.music` avec un workflow
        JSON et des nœuds de prompt/sortie.
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

Exemples de prompts :

```text
Generate a cinematic piano track with soft strings and no vocals.
```

```text
Generate an energetic chiptune loop about launching a rocket at sunrise.
```

## Fournisseurs pris en charge

| Fournisseur | Modèle par défaut      | Entrées de référence | Contrôles pris en charge                                  | Authentification                       |
| -------- | ---------------------- | ---------------- | --------------------------------------------------------- | -------------------------------------- |
| ComfyUI  | `workflow`             | Jusqu’à 1 image  | Musique ou audio défini par le workflow                   | `COMFY_API_KEY`, `COMFY_CLOUD_API_KEY` |
| Google   | `lyria-3-clip-preview` | Jusqu’à 10 images | `lyrics`, `instrumental`, `format`                        | `GEMINI_API_KEY`, `GOOGLE_API_KEY`     |
| MiniMax  | `music-2.6`            | Aucune           | `lyrics`, `instrumental`, `durationSeconds`, `format=mp3` | `MINIMAX_API_KEY` ou OAuth MiniMax     |

### Matrice des fonctionnalités

Le contrat de mode explicite utilisé par `music_generate`, les tests de contrat et le
balayage live partagé :

| Fournisseur | `generate` | `edit` | Limite d’édition | Lanes live partagées                                                       |
| -------- | :--------: | :----: | ---------- | ------------------------------------------------------------------------- |
| ComfyUI  |     ✓      |   ✓    | 1 image    | Pas dans le balayage partagé ; couvert par `extensions/comfy/comfy.live.test.ts` |
| Google   |     ✓      |   ✓    | 10 images  | `generate`, `edit`                                                        |
| MiniMax  |     ✓      |   —    | Aucune     | `generate`                                                                |

Utilisez `action: "list"` pour inspecter les fournisseurs partagés et modèles disponibles à
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
  Prompt de génération musicale. Obligatoire pour `action: "generate"`.
</ParamField>
<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  `"status"` renvoie la tâche de session actuelle ; `"list"` inspecte les fournisseurs.
</ParamField>
<ParamField path="model" type="string">
  Remplacement du fournisseur/modèle (par ex. `google/lyria-3-pro-preview`,
  `comfy/workflow`).
</ParamField>
<ParamField path="lyrics" type="string">
  Paroles facultatives lorsque le fournisseur prend en charge l’entrée explicite de paroles.
</ParamField>
<ParamField path="instrumental" type="boolean">
  Demander une sortie uniquement instrumentale lorsque le fournisseur la prend en charge.
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
<ParamField path="timeoutMs" type="number">Délai d’expiration facultatif de la requête fournisseur en millisecondes. Les valeurs inférieures à 10000ms sont relevées à 10000ms et signalées dans le résultat de l’outil.</ParamField>

<Note>
Tous les fournisseurs ne prennent pas en charge tous les paramètres. OpenClaw valide tout de même les limites strictes, comme le nombre d’entrées, avant l’envoi. Lorsqu’un fournisseur prend en charge la durée mais utilise un maximum plus court que la valeur demandée, OpenClaw limite à la durée prise en charge la plus proche. Les indications facultatives réellement non prises en charge sont ignorées avec un avertissement lorsque le fournisseur ou le modèle sélectionné ne peut pas les respecter. Les résultats d’outil signalent les paramètres appliqués ; `details.normalization` capture toute correspondance entre la valeur demandée et la valeur appliquée.
</Note>

## Comportement asynchrone

La génération musicale adossée à une session s’exécute comme une tâche en arrière-plan :

- **Tâche en arrière-plan :** `music_generate` crée une tâche en arrière-plan, renvoie immédiatement une réponse de démarrage/tâche et publie plus tard la piste terminée dans un message de suivi de l’agent.
- **Prévention des doublons :** tant qu’une tâche est `queued` ou `running`, les appels ultérieurs à `music_generate` dans la même session renvoient l’état de la tâche au lieu de démarrer une autre génération. Utilisez `action: "status"` pour vérifier explicitement.
- **Consultation de l’état :** `openclaw tasks list` ou `openclaw tasks show <taskId>` inspecte les états en attente, en cours et terminaux.
- **Réveil de complétion :** OpenClaw injecte un événement de complétion interne dans la même session afin que le modèle puisse écrire lui-même le suivi destiné à l’utilisateur.
- **Indication de prompt :** les tours utilisateur/manuels ultérieurs dans la même session reçoivent une petite indication d’exécution lorsqu’une tâche musicale est déjà en cours, afin que le modèle n’appelle pas aveuglément `music_generate` de nouveau.
- **Recours sans session :** les contextes directs/locaux sans véritable session d’agent s’exécutent en ligne et renvoient le résultat audio final dans le même tour.

### Cycle de vie des tâches

| État        | Signification                                                                                  |
| ----------- | ---------------------------------------------------------------------------------------------- |
| `queued`    | Tâche créée, en attente d’acceptation par le fournisseur.                                      |
| `running`   | Le fournisseur traite la tâche (généralement 30 secondes à 3 minutes selon le fournisseur et la durée). |
| `succeeded` | Piste prête ; l’agent se réveille et la publie dans la conversation.                           |
| `failed`    | Erreur ou délai d’expiration du fournisseur ; l’agent se réveille avec les détails de l’erreur. |

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
        fallbacks: ["minimax/music-2.6"],
      },
    },
  },
}
```

### Ordre de sélection des fournisseurs

OpenClaw essaie les fournisseurs dans cet ordre :

1. Paramètre `model` de l’appel d’outil (si l’agent en spécifie un).
2. `musicGenerationModel.primary` depuis la configuration.
3. `musicGenerationModel.fallbacks` dans l’ordre.
4. Détection automatique utilisant uniquement les valeurs par défaut des fournisseurs appuyées par l’authentification :
   - fournisseur par défaut actuel en premier ;
   - autres fournisseurs de génération musicale enregistrés par ordre d’identifiant de fournisseur.

Si un fournisseur échoue, le candidat suivant est essayé automatiquement. Si tous
échouent, l’erreur inclut les détails de chaque tentative.

Définissez `agents.defaults.mediaGenerationAutoProviderFallback: false` pour utiliser uniquement
les entrées explicites `model`, `primary` et `fallbacks`.

## Notes sur les fournisseurs

<AccordionGroup>
  <Accordion title="ComfyUI">
    Piloté par le workflow et dépend du graphe configuré ainsi que du mappage des nœuds
    pour les champs d’invite/de sortie. Le plugin `comfy` fourni s’intègre à l’outil
    partagé `music_generate` via le registre des fournisseurs de génération musicale.
  </Accordion>
  <Accordion title="Google (Lyria 3)">
    Utilise la génération par lots de Lyria 3. Le flux fourni actuel prend en charge
    l’invite, le texte de paroles facultatif et les images de référence facultatives.
  </Accordion>
  <Accordion title="MiniMax">
    Utilise le point de terminaison par lots `music_generation`. Prend en charge l’invite, les
    paroles facultatives, le mode instrumental, le pilotage de la durée et la sortie mp3 via
    l’authentification par clé API `minimax` ou OAuth `minimax-portal`.
  </Accordion>
</AccordionGroup>

## Choisir le bon chemin

- **Appuyé par un fournisseur partagé** lorsque vous voulez la sélection de modèle, le basculement
  entre fournisseurs et le flux asynchrone intégré de tâches/états.
- **Chemin Plugin (ComfyUI)** lorsque vous avez besoin d’un graphe de workflow personnalisé ou d’un
  fournisseur qui ne fait pas partie de la capacité musicale partagée fournie.

Si vous déboguez un comportement propre à ComfyUI, consultez
[ComfyUI](/fr/providers/comfy). Si vous déboguez le comportement d’un fournisseur partagé,
commencez par [Google (Gemini)](/fr/providers/google) ou
[MiniMax](/fr/providers/minimax).

## Modes de capacité des fournisseurs

Le contrat partagé de génération musicale prend en charge les déclarations de mode explicites :

- `generate` pour la génération à partir d’une invite seule.
- `edit` lorsque la requête inclut une ou plusieurs images de référence.

Les nouvelles implémentations de fournisseurs doivent préférer les blocs de mode explicites :

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
doivent déclarer `generate` et `edit` explicitement afin que les tests live, les tests de contrat
et l’outil partagé `music_generate` puissent valider la prise en charge des modes
de manière déterministe.

## Tests live

Couverture live à activation explicite pour les fournisseurs partagés inclus :

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts
```

Wrapper du dépôt :

```bash
pnpm test:live:media music
```

Ce fichier live charge les variables d’environnement de fournisseur manquantes depuis `~/.profile`, préfère
par défaut les clés API live/env aux profils d’authentification stockés, et exécute la couverture
`generate` ainsi que la couverture `edit` déclarée lorsque le fournisseur active le mode
édition. Couverture actuelle :

- `google` : `generate` plus `edit`
- `minimax` : `generate` uniquement
- `comfy` : couverture live Comfy distincte, pas le balayage partagé des fournisseurs

Couverture live facultative pour le parcours musical ComfyUI intégré :

```bash
OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
```

Le fichier live Comfy couvre également les flux de travail d’image et de vidéo comfy lorsque ces
sections sont configurées.

## Articles connexes

- [Tâches en arrière-plan](/fr/automation/tasks) — suivi des tâches pour les exécutions `music_generate` détachées
- [ComfyUI](/fr/providers/comfy)
- [Référence de configuration](/fr/gateway/config-agents#agent-defaults) — configuration `musicGenerationModel`
- [Google (Gemini)](/fr/providers/google)
- [MiniMax](/fr/providers/minimax)
- [Modèles](/fr/concepts/models) — configuration des modèles et basculement
- [Vue d’ensemble des outils](/fr/tools)
