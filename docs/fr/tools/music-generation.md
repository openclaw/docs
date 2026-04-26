---
read_when:
    - Génération de musique ou d’audio via l’agent
    - Configuration des fournisseurs et des modèles de génération musicale
    - Comprendre les paramètres de l’outil `music_generate`
sidebarTitle: Music generation
summary: Générez de la musique via `music_generate` avec les workflows Google Lyria, MiniMax et ComfyUI.
title: Génération de musique
x-i18n:
    generated_at: "2026-04-26T11:40:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4eda549dbb93cbfe15e04462e08b7c86ff0718160244e3e5de3b041c62ee81ea
    source_path: tools/music-generation.md
    workflow: 15
---

L’outil `music_generate` permet à l’agent de créer de la musique ou de l’audio via la capacité partagée de génération musicale avec des fournisseurs configurés — Google, MiniMax et ComfyUI configuré par workflow aujourd’hui.

Pour les exécutions d’agent avec session, OpenClaw démarre la génération musicale comme une tâche en arrière-plan, la suit dans le registre des tâches, puis réveille de nouveau l’agent lorsque la piste est prête afin que l’agent puisse republier l’audio terminé dans le canal d’origine.

<Note>
L’outil partagé intégré n’apparaît que lorsqu’au moins un fournisseur de génération musicale est disponible. Si vous ne voyez pas `music_generate` dans les outils de votre agent, configurez `agents.defaults.musicGenerationModel` ou définissez une clé d’API de fournisseur.
</Note>

## Démarrage rapide

<Tabs>
  <Tab title="Partagé avec fournisseur">
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

        L’agent appelle `music_generate` automatiquement. Aucune
        autorisation explicite de l’outil n’est nécessaire.
      </Step>
    </Steps>

    Pour les contextes synchrones directs sans exécution d’agent adossée à une session,
    l’outil intégré revient quand même à une génération en ligne et renvoie
    le chemin final du média dans le résultat de l’outil.

  </Tab>
  <Tab title="Workflow ComfyUI">
    <Steps>
      <Step title="Configurer le workflow">
        Configurez `plugins.entries.comfy.config.music` avec un workflow
        JSON et des nœuds de prompt/sortie.
      </Step>
      <Step title="Authentification cloud (facultatif)">
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

Exemples de prompts :

```text
Generate a cinematic piano track with soft strings and no vocals.
```

```text
Generate an energetic chiptune loop about launching a rocket at sunrise.
```

## Fournisseurs pris en charge

| Fournisseur | Modèle par défaut      | Entrées de référence | Contrôles pris en charge                                  | Authentification                       |
| ----------- | ---------------------- | -------------------- | --------------------------------------------------------- | -------------------------------------- |
| ComfyUI     | `workflow`             | Jusqu’à 1 image      | Musique ou audio défini par workflow                      | `COMFY_API_KEY`, `COMFY_CLOUD_API_KEY` |
| Google      | `lyria-3-clip-preview` | Jusqu’à 10 images    | `lyrics`, `instrumental`, `format`                        | `GEMINI_API_KEY`, `GOOGLE_API_KEY`     |
| MiniMax     | `music-2.6`            | Aucune               | `lyrics`, `instrumental`, `durationSeconds`, `format=mp3` | `MINIMAX_API_KEY` ou OAuth MiniMax     |

### Matrice des capacités

Le contrat de mode explicite utilisé par `music_generate`, les tests de contrat et la vérification live partagée :

| Fournisseur | `generate` | `edit` | Limite d’édition | Canaux live partagés                                                          |
| ----------- | :--------: | :----: | ---------------- | ----------------------------------------------------------------------------- |
| ComfyUI     |     ✓      |   ✓    | 1 image          | Pas dans la vérification partagée ; couvert par `extensions/comfy/comfy.live.test.ts` |
| Google      |     ✓      |   ✓    | 10 images        | `generate`, `edit`                                                            |
| MiniMax     |     ✓      |   —    | Aucune           | `generate`                                                                    |

Utilisez `action: "list"` pour inspecter les fournisseurs et modèles partagés disponibles à l’exécution :

```text
/tool music_generate action=list
```

Utilisez `action: "status"` pour inspecter la tâche musicale active adossée à une session :

```text
/tool music_generate action=status
```

Exemple de génération directe :

```text
/tool music_generate prompt="Dreamy lo-fi hip hop with vinyl texture and gentle rain" instrumental=true
```

## Paramètres de l’outil

<ParamField path="prompt" type="string" required>
  Prompt de génération musicale. Obligatoire pour `action: "generate"`.
</ParamField>
<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  `"status"` renvoie la tâche de session actuelle ; `"list"` inspecte les fournisseurs.
</ParamField>
<ParamField path="model" type="string">
  Remplacement du fournisseur/modèle (par ex. `google/lyria-3-pro-preview`,
  `comfy/workflow`).
</ParamField>
<ParamField path="lyrics" type="string">
  Paroles facultatives lorsque le fournisseur prend en charge une entrée explicite de paroles.
</ParamField>
<ParamField path="instrumental" type="boolean">
  Demande une sortie instrumentale uniquement lorsque le fournisseur la prend en charge.
</ParamField>
<ParamField path="image" type="string">
  Chemin ou URL d’une image de référence unique.
</ParamField>
<ParamField path="images" type="string[]">
  Plusieurs images de référence (jusqu’à 10 pour les fournisseurs qui les prennent en charge).
</ParamField>
<ParamField path="durationSeconds" type="number">
  Durée cible en secondes lorsque le fournisseur prend en charge les indications de durée.
</ParamField>
<ParamField path="format" type='"mp3" | "wav"'>
  Indication du format de sortie lorsque le fournisseur la prend en charge.
</ParamField>
<ParamField path="filename" type="string">Indication du nom de fichier de sortie.</ParamField>
<ParamField path="timeoutMs" type="number">Délai d’expiration facultatif de la requête fournisseur en millisecondes.</ParamField>

<Note>
Tous les fournisseurs ne prennent pas en charge tous les paramètres. OpenClaw valide tout de même les limites strictes, comme le nombre d’entrées, avant soumission. Lorsqu’un fournisseur prend en charge la durée mais utilise une valeur maximale plus courte que celle demandée, OpenClaw ajuste à la durée prise en charge la plus proche. Les indications facultatives réellement non prises en charge sont ignorées avec un avertissement lorsque le fournisseur ou le modèle sélectionné ne peut pas les appliquer. Les résultats de l’outil signalent les paramètres appliqués ; `details.normalization` capture tout mappage entre la valeur demandée et la valeur appliquée.
</Note>

## Comportement asynchrone

La génération musicale avec session s’exécute comme tâche en arrière-plan :

- **Tâche en arrière-plan :** `music_generate` crée une tâche en arrière-plan, renvoie immédiatement une réponse de démarrage/tâche, puis publie la piste terminée plus tard dans un message de suivi de l’agent.
- **Prévention des doublons :** tant qu’une tâche est `queued` ou `running`, les appels ultérieurs à `music_generate` dans la même session renvoient l’état de la tâche au lieu de démarrer une autre génération. Utilisez `action: "status"` pour vérifier explicitement.
- **Consultation d’état :** `openclaw tasks list` ou `openclaw tasks show <taskId>` inspecte les états en file d’attente, en cours et terminaux.
- **Réveil à la fin :** OpenClaw injecte un événement interne de fin dans la même session afin que le modèle puisse lui-même rédiger le message de suivi destiné à l’utilisateur.
- **Indication de prompt :** les tours utilisateur/manuels ultérieurs dans la même session reçoivent une petite indication d’exécution lorsqu’une tâche musicale est déjà en cours, afin que le modèle ne rappelle pas `music_generate` à l’aveugle.
- **Solution de secours sans session :** les contextes directs/locaux sans véritable session d’agent s’exécutent en ligne et renvoient le résultat audio final dans le même tour.

### Cycle de vie de la tâche

| État        | Signification                                                                                  |
| ----------- | ---------------------------------------------------------------------------------------------- |
| `queued`    | Tâche créée, en attente que le fournisseur l’accepte.                                          |
| `running`   | Le fournisseur traite la demande (généralement 30 secondes à 3 minutes selon le fournisseur et la durée). |
| `succeeded` | La piste est prête ; l’agent se réveille et la publie dans la conversation.                    |
| `failed`    | Erreur du fournisseur ou expiration du délai ; l’agent se réveille avec les détails de l’erreur. |

Vérifiez l’état depuis la CLI :

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

OpenClaw essaie les fournisseurs dans cet ordre :

1. paramètre `model` de l’appel d’outil (si l’agent en spécifie un).
2. `musicGenerationModel.primary` de la configuration.
3. `musicGenerationModel.fallbacks` dans l’ordre.
4. Détection automatique en utilisant uniquement les valeurs par défaut des fournisseurs adossées à l’authentification :
   - fournisseur par défaut actuel en premier ;
   - autres fournisseurs de génération musicale enregistrés dans l’ordre des identifiants de fournisseur.

Si un fournisseur échoue, le candidat suivant est essayé automatiquement. Si tous échouent, l’erreur inclut les détails de chaque tentative.

Définissez `agents.defaults.mediaGenerationAutoProviderFallback: false` pour utiliser uniquement les entrées explicites `model`, `primary` et `fallbacks`.

## Notes sur les fournisseurs

<AccordionGroup>
  <Accordion title="ComfyUI">
    Piloté par workflow et dépend du graphe configuré ainsi que du mappage de nœuds
    pour les champs de prompt/sortie. Le Plugin `comfy` inclus se branche sur
    l’outil partagé `music_generate` via le registre des fournisseurs de génération musicale.
  </Accordion>
  <Accordion title="Google (Lyria 3)">
    Utilise la génération par lot Lyria 3. Le flux inclus actuel prend en charge
    le prompt, le texte de paroles facultatif et les images de référence facultatives.
  </Accordion>
  <Accordion title="MiniMax">
    Utilise le point de terminaison batch `music_generation`. Prend en charge le prompt, les paroles facultatives, le mode instrumental, l’orientation de la durée et la sortie mp3 via
    soit l’authentification par clé d’API `minimax`, soit l’OAuth `minimax-portal`.
  </Accordion>
</AccordionGroup>

## Choisir le bon chemin

- **Partagé avec fournisseur** lorsque vous voulez la sélection de modèle, le basculement entre fournisseurs et le flux intégré asynchrone de tâche/état.
- **Chemin Plugin (ComfyUI)** lorsque vous avez besoin d’un graphe de workflow personnalisé ou d’un fournisseur qui ne fait pas partie de la capacité musicale partagée incluse.

Si vous déboguez un comportement spécifique à ComfyUI, consultez
[ComfyUI](/fr/providers/comfy). Si vous déboguez un comportement de fournisseur partagé,
commencez par [Google (Gemini)](/fr/providers/google) ou
[MiniMax](/fr/providers/minimax).

## Modes de capacité des fournisseurs

Le contrat partagé de génération musicale prend en charge des déclarations explicites de mode :

- `generate` pour la génération à partir du prompt uniquement.
- `edit` lorsque la requête comprend une ou plusieurs images de référence.

Les nouvelles implémentations de fournisseurs doivent privilégier des blocs de mode explicites :

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

Les champs plats hérités comme `maxInputImages`, `supportsLyrics` et
`supportsFormat` **ne suffisent pas** pour annoncer la prise en charge de l’édition. Les fournisseurs
doivent déclarer explicitement `generate` et `edit` afin que les tests live, les tests de contrat et l’outil partagé `music_generate` puissent valider la prise en charge des modes de manière déterministe.

## Tests live

Couverture live facultative pour les fournisseurs partagés inclus :

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts
```

Wrapper du dépôt :

```bash
pnpm test:live:media music
```

Ce fichier live charge les variables d’environnement des fournisseurs manquantes depuis `~/.profile`, privilégie par défaut les clés d’API live/env avant les profils d’authentification stockés, et exécute la couverture `generate` et `edit` déclarée lorsque le fournisseur active le mode édition. Couverture actuelle :

- `google` : `generate` plus `edit`
- `minimax` : `generate` uniquement
- `comfy` : couverture live Comfy séparée, pas dans la vérification partagée des fournisseurs

Couverture live facultative pour le chemin musical ComfyUI inclus :

```bash
OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
```

Le fichier live Comfy couvre également les workflows d’image et de vidéo comfy lorsque ces sections sont configurées.

## Lié

- [Tâches en arrière-plan](/fr/automation/tasks) — suivi des tâches pour les exécutions détachées de `music_generate`
- [ComfyUI](/fr/providers/comfy)
- [Référence de configuration](/fr/gateway/config-agents#agent-defaults) — configuration `musicGenerationModel`
- [Google (Gemini)](/fr/providers/google)
- [MiniMax](/fr/providers/minimax)
- [Modèles](/fr/concepts/models) — configuration des modèles et basculement
- [Vue d’ensemble des outils](/fr/tools)
