---
read_when:
    - Générer de la musique ou de l’audio avec l’agent
    - Configuration des fournisseurs et modèles de génération musicale
    - Comprendre les paramètres de l’outil music_generate
sidebarTitle: Music generation
summary: Générer de la musique via music_generate avec les flux de travail Google Lyria, MiniMax et ComfyUI
title: Génération de musique
x-i18n:
    generated_at: "2026-05-05T01:51:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0e14a5a10dd485c2d3dbbd23a0fc2c12de500d9f7bfb7db471c27ed2a99ad650
    source_path: tools/music-generation.md
    workflow: 16
---

L’outil `music_generate` permet à l’agent de créer de la musique ou de l’audio via la
capacité partagée de génération musicale avec les fournisseurs configurés — Google,
MiniMax et ComfyUI configuré par workflow aujourd’hui.

Pour les exécutions d’agent adossées à une session, OpenClaw démarre la génération musicale comme une
tâche d’arrière-plan, la suit dans le registre des tâches, puis réveille à nouveau l’agent
quand la piste est prête afin que l’agent puisse informer l’utilisateur et joindre l’audio
finalisé. Dans les discussions de groupe/canal qui utilisent une diffusion visible
uniquement via l’outil de messagerie, l’agent relaie le résultat via l’outil de messagerie.

<Note>
L’outil partagé intégré n’apparaît que lorsqu’au moins un fournisseur de génération musicale
est disponible. Si vous ne voyez pas `music_generate` dans les outils de votre agent,
configurez `agents.defaults.musicGenerationModel` ou définissez une clé d’API de
fournisseur.
</Note>

## Démarrage rapide

<Tabs>
  <Tab title="Shared provider-backed">
    <Steps>
      <Step title="Configure auth">
        Définissez une clé d’API pour au moins un fournisseur — par exemple
        `GEMINI_API_KEY` ou `MINIMAX_API_KEY`.
      </Step>
      <Step title="Pick a default model (optional)">
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
      <Step title="Ask the agent">
        _"Generate an upbeat synthpop track about a night drive through a
        neon city."_

        L’agent appelle automatiquement `music_generate`. Aucune liste d’autorisation
        d’outils n’est nécessaire.
      </Step>
    </Steps>

    Pour les contextes synchrones directs sans exécution d’agent adossée à une session,
    l’outil intégré bascule tout de même vers la génération en ligne et renvoie
    le chemin du média final dans le résultat de l’outil.

  </Tab>
  <Tab title="ComfyUI workflow">
    <Steps>
      <Step title="Configure the workflow">
        Configurez `plugins.entries.comfy.config.music` avec un workflow
        JSON et des nœuds d’invite/sortie.
      </Step>
      <Step title="Cloud auth (optional)">
        Pour Comfy Cloud, définissez `COMFY_API_KEY` ou `COMFY_CLOUD_API_KEY`.
      </Step>
      <Step title="Call the tool">
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

| Fournisseur | Modèle par défaut      | Entrées de référence | Contrôles pris en charge                                  | Auth                                   |
| -------- | ---------------------- | ---------------- | --------------------------------------------------------- | -------------------------------------- |
| ComfyUI  | `workflow`             | Jusqu’à 1 image  | Musique ou audio définis par workflow                     | `COMFY_API_KEY`, `COMFY_CLOUD_API_KEY` |
| Google   | `lyria-3-clip-preview` | Jusqu’à 10 images | `lyrics`, `instrumental`, `format`                        | `GEMINI_API_KEY`, `GOOGLE_API_KEY`     |
| MiniMax  | `music-2.6`            | Aucune           | `lyrics`, `instrumental`, `durationSeconds`, `format=mp3` | `MINIMAX_API_KEY` ou OAuth MiniMax     |

### Matrice de capacités

Le contrat de mode explicite utilisé par `music_generate`, les tests de contrat et le
balayage live partagé :

| Fournisseur | `generate` | `edit` | Limite d’édition | Lanes live partagées                                                       |
| -------- | :--------: | :----: | ---------- | ------------------------------------------------------------------------- |
| ComfyUI  |     ✓      |   ✓    | 1 image    | Pas dans le balayage partagé ; couvert par `extensions/comfy/comfy.live.test.ts` |
| Google   |     ✓      |   ✓    | 10 images  | `generate`, `edit`                                                        |
| MiniMax  |     ✓      |   —    | Aucune     | `generate`                                                                |

Utilisez `action: "list"` pour inspecter les fournisseurs et modèles partagés disponibles à
l’exécution :

```text
/tool music_generate action=list
```

Utilisez `action: "status"` pour inspecter la tâche musicale active adossée à une session :

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
  Remplacement du fournisseur/modèle (par exemple `google/lyria-3-pro-preview`,
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
<ParamField path="timeoutMs" type="number">Délai d’expiration facultatif de la requête fournisseur en millisecondes. Les valeurs inférieures à 10000ms sont relevées à 10000ms et signalées dans le résultat de l’outil.</ParamField>

<Note>
Tous les fournisseurs ne prennent pas en charge tous les paramètres. OpenClaw valide tout de même les
limites strictes, comme le nombre d’entrées, avant la soumission. Lorsqu’un fournisseur prend en charge
la durée mais utilise un maximum plus court que la valeur demandée, OpenClaw
ramène la durée à la valeur prise en charge la plus proche. Les indications facultatives vraiment non prises en charge
sont ignorées avec un avertissement lorsque le fournisseur ou le modèle sélectionné ne peut pas les honorer.
Les résultats d’outil indiquent les paramètres appliqués ; `details.normalization`
capture toute correspondance entre la demande et l’application.
</Note>

## Comportement asynchrone

La génération musicale adossée à une session s’exécute comme une tâche d’arrière-plan :

- **Tâche d’arrière-plan :** `music_generate` crée une tâche d’arrière-plan, renvoie
  immédiatement une réponse de démarrage/tâche, puis publie la piste finalisée plus tard dans
  un message d’agent de suivi.
- **Prévention des doublons :** tant qu’une tâche est `queued` ou `running`, les appels
  `music_generate` ultérieurs dans la même session renvoient le statut de la tâche au lieu de
  démarrer une autre génération. Utilisez `action: "status"` pour vérifier explicitement.
- **Consultation du statut :** `openclaw tasks list` ou `openclaw tasks show <taskId>`
  inspecte les statuts en file d’attente, en cours d’exécution et terminaux.
- **Réveil à la fin :** OpenClaw réinjecte un événement interne de fin
  dans la même session afin que le modèle puisse rédiger lui-même le suivi destiné à l’utilisateur.
- **Indication d’invite :** les tours utilisateur/manuels ultérieurs dans la même session reçoivent une petite
  indication d’exécution lorsqu’une tâche musicale est déjà en cours, afin que le modèle
  n’appelle pas aveuglément `music_generate` à nouveau.
- **Repli sans session :** les contextes directs/locaux sans vraie session d’agent
  s’exécutent en ligne et renvoient le résultat audio final dans le même tour.

### Cycle de vie des tâches

| État        | Signification                                                                                  |
| ----------- | ---------------------------------------------------------------------------------------------- |
| `queued`    | Tâche créée, en attente d’acceptation par le fournisseur.                                      |
| `running`   | Le fournisseur traite la demande (généralement de 30 secondes à 3 minutes selon le fournisseur et la durée). |
| `succeeded` | Piste prête ; l’agent se réveille et la publie dans la conversation.                           |
| `failed`    | Erreur ou délai d’expiration du fournisseur ; l’agent se réveille avec les détails de l’erreur. |

Vérifiez le statut depuis la CLI :

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

1. Paramètre `model` de l’appel d’outil (si l’agent en précise un).
2. `musicGenerationModel.primary` depuis la configuration.
3. `musicGenerationModel.fallbacks` dans l’ordre.
4. Détection automatique utilisant uniquement les valeurs par défaut des fournisseurs adossés à l’authentification :
   - fournisseur par défaut actuel en premier ;
   - autres fournisseurs de génération musicale enregistrés dans l’ordre de leur identifiant de fournisseur.

Si un fournisseur échoue, le candidat suivant est essayé automatiquement. S’ils
échouent tous, l’erreur inclut les détails de chaque tentative.

Définissez `agents.defaults.mediaGenerationAutoProviderFallback: false` pour utiliser uniquement
les entrées explicites `model`, `primary` et `fallbacks`.

## Notes sur les fournisseurs

<AccordionGroup>
  <Accordion title="ComfyUI">
    Piloté par workflow et dépend du graphe configuré ainsi que du mappage des nœuds
    pour les champs d’invite/sortie. Le plugin `comfy` intégré se branche sur
    l’outil partagé `music_generate` via le registre des fournisseurs de
    génération musicale.
  </Accordion>
  <Accordion title="Google (Lyria 3)">
    Utilise la génération par lot Lyria 3. Le flux intégré actuel prend en charge
    l’invite, un texte de paroles facultatif et des images de référence facultatives.
  </Accordion>
  <Accordion title="MiniMax">
    Utilise l’endpoint par lot `music_generation`. Prend en charge l’invite, les
    paroles facultatives, le mode instrumental, le pilotage de durée et la sortie mp3 via
    l’authentification par clé d’API `minimax` ou OAuth `minimax-portal`.
  </Accordion>
</AccordionGroup>

## Choisir le bon chemin

- **Adossé à un fournisseur partagé** lorsque vous voulez la sélection de modèle, le basculement
  de fournisseur et le flux intégré asynchrone de tâche/statut.
- **Chemin Plugin (ComfyUI)** lorsque vous avez besoin d’un graphe de workflow personnalisé ou d’un
  fournisseur qui ne fait pas partie de la capacité musicale intégrée partagée.

Si vous déboguez un comportement propre à ComfyUI, consultez
[ComfyUI](/fr/providers/comfy). Si vous déboguez un comportement de fournisseur partagé,
commencez par [Google (Gemini)](/fr/providers/google) ou
[MiniMax](/fr/providers/minimax).

## Modes de capacité des fournisseurs

Le contrat partagé de génération musicale prend en charge des déclarations de mode explicites :

- `generate` pour la génération uniquement par invite.
- `edit` lorsque la requête inclut une ou plusieurs images de référence.

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

Les anciens champs plats tels que `maxInputImages`, `supportsLyrics` et
`supportsFormat` ne suffisent **pas** à annoncer la prise en charge de l’édition. Les fournisseurs
doivent déclarer `generate` et `edit` explicitement afin que les tests live, les tests de contrat
et l’outil partagé `music_generate` puissent valider la prise en charge des modes
de manière déterministe.

## Tests live

Couverture live à activer explicitement pour les fournisseurs intégrés partagés :

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts
```

Wrapper du dépôt :

```bash
pnpm test:live:media music
```

Ce fichier live charge les variables d’environnement de fournisseur manquantes depuis `~/.profile`, préfère
par défaut les clés d’API live/env aux profils d’authentification stockés, et exécute à la fois
la couverture `generate` et la couverture `edit` déclarée lorsque le fournisseur active le mode
édition. Couverture actuelle :

- `google` : `generate` plus `edit`
- `minimax` : `generate` uniquement
- `comfy` : couverture live Comfy séparée, pas le balayage partagé des fournisseurs

Couverture live à activer explicitement pour le chemin musical ComfyUI intégré :

```bash
OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
```

Le fichier live de Comfy couvre également les workflows d’image et de vidéo Comfy lorsque ces
sections sont configurées.

## Connexe

- [Tâches en arrière-plan](/fr/automation/tasks) — suivi des tâches pour les exécutions détachées de `music_generate`
- [ComfyUI](/fr/providers/comfy)
- [Référence de configuration](/fr/gateway/config-agents#agent-defaults) — configuration `musicGenerationModel`
- [Google (Gemini)](/fr/providers/google)
- [MiniMax](/fr/providers/minimax)
- [Modèles](/fr/concepts/models) — configuration des modèles et basculement
- [Vue d’ensemble des outils](/fr/tools)
