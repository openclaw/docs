---
read_when:
    - Génération de musique ou d’audio via l’agent
    - Configuration des fournisseurs et des modèles de génération musicale
    - Comprendre les paramètres de l’outil music_generate
sidebarTitle: Music generation
summary: Générer de la musique via music_generate dans les flux de travail Google Lyria, MiniMax et ComfyUI
title: Génération de musique
x-i18n:
    generated_at: "2026-05-11T20:59:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: b355dd6f1f41074624b692edb8a597a65ad99fc3ad61d2ed5e32f1b6cf393244
    source_path: tools/music-generation.md
    workflow: 16
---

L’outil `music_generate` permet à l’agent de créer de la musique ou de l’audio via la
capacité partagée de génération musicale avec des fournisseurs configurés — Google,
MiniMax, et ComfyUI configuré par workflow aujourd’hui.

Pour les exécutions d’agent adossées à une session, OpenClaw lance la génération musicale comme une
tâche en arrière-plan, la suit dans le registre des tâches, puis réveille à nouveau l’agent
lorsque la piste est prête afin que l’agent puisse prévenir l’utilisateur et joindre l’audio
terminé. Dans les discussions de groupe/canal qui utilisent une livraison visible uniquement via l’outil de message,
l’agent relaie le résultat via l’outil de message. Si l’agent de complétion écrit uniquement
une réponse finale privée, OpenClaw se rabat sur un envoi direct au canal avec le média
généré. Le réveil de complétion avertit explicitement l’agent que les réponses finales normales
sont privées dans ces routes.

<Note>
L’outil partagé intégré n’apparaît que lorsqu’au moins un fournisseur de génération musicale
est disponible. Si vous ne voyez pas `music_generate` dans les outils de votre agent,
configurez `agents.defaults.musicGenerationModel` ou définissez une
clé d’API fournisseur.
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
        _« Génère une piste synthpop entraînante sur une conduite de nuit à travers une
        ville au néon. »_

        L’agent appelle automatiquement `music_generate`. Aucune liste
        d’autorisation d’outils n’est nécessaire.
      </Step>
    </Steps>

    Pour les contextes synchrones directs sans exécution d’agent adossée à une session,
    l’outil intégré se rabat tout de même sur une génération en ligne et renvoie
    le chemin du média final dans le résultat de l’outil.

  </Tab>
  <Tab title="ComfyUI workflow">
    <Steps>
      <Step title="Configure the workflow">
        Configurez `plugins.entries.comfy.config.music` avec un workflow
        JSON et des nœuds d’invite/de sortie.
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

| Fournisseur | Modèle par défaut      | Entrées de référence | Contrôles pris en charge                                 | Authentification                         |
| -------- | ---------------------- | ---------------- | --------------------------------------------------------- | -------------------------------------- |
| ComfyUI  | `workflow`             | Jusqu’à 1 image  | Musique ou audio défini par le workflow                   | `COMFY_API_KEY`, `COMFY_CLOUD_API_KEY` |
| Google   | `lyria-3-clip-preview` | Jusqu’à 10 images | `lyrics`, `instrumental`, `format`                       | `GEMINI_API_KEY`, `GOOGLE_API_KEY`     |
| MiniMax  | `music-2.6`            | Aucune           | `lyrics`, `instrumental`, `durationSeconds`, `format=mp3` | `MINIMAX_API_KEY` ou OAuth MiniMax     |

### Matrice de capacités

Le contrat de mode explicite utilisé par `music_generate`, les tests de contrat et le
balayage live partagé :

| Fournisseur | `generate` | `edit` | Limite de modification | Voies live partagées                                                       |
| -------- | :--------: | :----: | ---------- | ------------------------------------------------------------------------- |
| ComfyUI  |     ✓      |   ✓    | 1 image    | Non inclus dans le balayage partagé ; couvert par `extensions/comfy/comfy.live.test.ts` |
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
  Invite de génération musicale. Requise pour `action: "generate"`.
</ParamField>
<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  `"status"` renvoie la tâche de session actuelle ; `"list"` inspecte les fournisseurs.
</ParamField>
<ParamField path="model" type="string">
  Remplacement fournisseur/modèle (par ex. `google/lyria-3-pro-preview`,
  `comfy/workflow`).
</ParamField>
<ParamField path="lyrics" type="string">
  Paroles facultatives lorsque le fournisseur prend en charge une entrée de paroles explicite.
</ParamField>
<ParamField path="instrumental" type="boolean">
  Demande une sortie uniquement instrumentale lorsque le fournisseur la prend en charge.
</ParamField>
<ParamField path="image" type="string">
  Chemin ou URL d’une seule image de référence.
</ParamField>
<ParamField path="images" type="string[]">
  Plusieurs images de référence (jusqu’à 10 avec les fournisseurs compatibles).
</ParamField>
<ParamField path="durationSeconds" type="number">
  Durée cible en secondes lorsque le fournisseur prend en charge les indications de durée.
</ParamField>
<ParamField path="format" type='"mp3" | "wav"'>
  Indication de format de sortie lorsque le fournisseur la prend en charge.
</ParamField>
<ParamField path="filename" type="string">Indication de nom de fichier de sortie.</ParamField>
<ParamField path="timeoutMs" type="number">Délai d’expiration facultatif de la requête fournisseur, en millisecondes. S’il est omis, OpenClaw utilise `agents.defaults.musicGenerationModel.timeoutMs` s’il est configuré. Les valeurs inférieures à 10000ms sont relevées à 10000ms et signalées dans le résultat de l’outil.</ParamField>

<Note>
Tous les fournisseurs ne prennent pas en charge tous les paramètres. OpenClaw valide tout de même les
limites strictes, comme le nombre d’entrées, avant la soumission. Lorsqu’un fournisseur prend en charge
la durée mais utilise un maximum plus court que la valeur demandée, OpenClaw
contraint à la durée prise en charge la plus proche. Les indications facultatives réellement non prises en charge
sont ignorées avec un avertissement lorsque le fournisseur ou le modèle sélectionné ne peut pas
les respecter. Les résultats de l’outil signalent les paramètres appliqués ; `details.normalization`
capture toute correspondance entre valeur demandée et valeur appliquée.
</Note>

## Comportement asynchrone

La génération musicale adossée à une session s’exécute comme tâche en arrière-plan :

- **Tâche en arrière-plan :** `music_generate` crée une tâche en arrière-plan, renvoie
  immédiatement une réponse démarrée/tâche, et publie la piste terminée plus tard dans
  un message d’agent de suivi.
- **Prévention des doublons :** tant qu’une tâche est `queued` ou `running`, les appels
  `music_generate` ultérieurs dans la même session renvoient l’état de la tâche au lieu de
  lancer une autre génération. Utilisez `action: "status"` pour vérifier explicitement.
- **Consultation de l’état :** `openclaw tasks list` ou `openclaw tasks show <taskId>`
  inspecte les états en file d’attente, en cours d’exécution et terminaux.
- **Réveil de complétion :** OpenClaw injecte un événement de complétion interne dans
  la même session afin que le modèle puisse écrire lui-même le suivi visible par l’utilisateur.
- **Indice d’invite :** les tours utilisateur/manuels ultérieurs dans la même session reçoivent un petit
  indice d’exécution lorsqu’une tâche musicale est déjà en cours, afin que le modèle
  n’appelle pas aveuglément `music_generate` à nouveau.
- **Repli sans session :** les contextes directs/locaux sans véritable session d’agent
  s’exécutent en ligne et renvoient le résultat audio final dans le même tour.

### Cycle de vie de la tâche

| État        | Signification                                                                                  |
| ----------- | ---------------------------------------------------------------------------------------------- |
| `queued`    | Tâche créée, en attente d’acceptation par le fournisseur.                                      |
| `running`   | Le fournisseur traite la requête (généralement 30 secondes à 3 minutes selon le fournisseur et la durée). |
| `succeeded` | Piste prête ; l’agent se réveille et la publie dans la conversation.                           |
| `failed`    | Erreur fournisseur ou délai expiré ; l’agent se réveille avec les détails de l’erreur.         |

Vérifier l’état depuis la CLI :

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
4. Détection automatique utilisant uniquement les valeurs par défaut des fournisseurs adossés à une authentification :
   - fournisseur par défaut actuel en premier ;
   - fournisseurs de génération musicale enregistrés restants dans l’ordre des identifiants de fournisseur.

Si un fournisseur échoue, le candidat suivant est essayé automatiquement. S’ils
échouent tous, l’erreur inclut les détails de chaque tentative.

Définissez `agents.defaults.mediaGenerationAutoProviderFallback: false` pour utiliser uniquement
les entrées explicites `model`, `primary` et `fallbacks`.

## Notes sur les fournisseurs

<AccordionGroup>
  <Accordion title="ComfyUI">
    Piloté par workflow, et dépend du graphe configuré ainsi que de la correspondance des nœuds
    pour les champs d’invite/de sortie. Le Plugin `comfy` inclus s’intègre à
    l’outil partagé `music_generate` via le registre des fournisseurs de génération musicale.
  </Accordion>
  <Accordion title="Google (Lyria 3)">
    Utilise la génération par lots Lyria 3. Le flux inclus actuel prend en charge
    l’invite, le texte de paroles facultatif et les images de référence facultatives.
  </Accordion>
  <Accordion title="MiniMax">
    Utilise le point de terminaison par lots `music_generation`. Prend en charge l’invite, les
    paroles facultatives, le mode instrumental, le guidage de durée et la sortie mp3 via
    une authentification par clé d’API `minimax` ou OAuth `minimax-portal`.
  </Accordion>
</AccordionGroup>

## Choisir le bon chemin

- **Adossé à un fournisseur partagé** lorsque vous voulez la sélection de modèle, le basculement
  entre fournisseurs et le flux intégré de tâche/état asynchrone.
- **Chemin Plugin (ComfyUI)** lorsque vous avez besoin d’un graphe de workflow personnalisé ou d’un
  fournisseur qui ne fait pas partie de la capacité musicale partagée incluse.

Si vous déboguez un comportement propre à ComfyUI, consultez
[ComfyUI](/fr/providers/comfy). Si vous déboguez le comportement du fournisseur partagé,
commencez par [Google (Gemini)](/fr/providers/google) ou
[MiniMax](/fr/providers/minimax).

## Modes de capacité des fournisseurs

Le contrat partagé de génération musicale prend en charge des déclarations de mode explicites :

- `generate` pour la génération à partir d’une invite seule.
- `edit` lorsque la requête inclut une ou plusieurs images de référence.

Les nouvelles implémentations de fournisseur devraient privilégier des blocs de mode explicites :

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

Les champs plats hérités tels que `maxInputImages`, `supportsLyrics` et
`supportsFormat` ne suffisent **pas** à annoncer la prise en charge de la modification. Les fournisseurs
devraient déclarer explicitement `generate` et `edit` afin que les tests live, les tests de contrat
et l’outil partagé `music_generate` puissent valider la prise en charge des modes
de manière déterministe.

## Tests live

Couverture live optionnelle pour les fournisseurs inclus partagés :

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts
```

Wrapper du dépôt :

```bash
pnpm test:live:media music
```

Ce fichier live charge les variables d'environnement de fournisseur manquantes depuis `~/.profile`, privilégie
par défaut les clés d'API live/env par rapport aux profils d'authentification stockés, et exécute à la fois
la couverture `generate` et la couverture `edit` déclarée lorsque le fournisseur active le mode d'édition.
Couverture actuelle :

- `google` : `generate` plus `edit`
- `minimax` : `generate` uniquement
- `comfy` : couverture live Comfy distincte, pas le balayage partagé des fournisseurs

Couverture live optionnelle pour le chemin musical ComfyUI inclus :

```bash
OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
```

Le fichier live Comfy couvre aussi les workflows d'image et de vidéo comfy lorsque ces
sections sont configurées.

## Voir aussi

- [Tâches en arrière-plan](/fr/automation/tasks) — suivi des tâches pour les exécutions `music_generate` détachées
- [ComfyUI](/fr/providers/comfy)
- [Référence de configuration](/fr/gateway/config-agents#agent-defaults) — configuration `musicGenerationModel`
- [Google (Gemini)](/fr/providers/google)
- [MiniMax](/fr/providers/minimax)
- [Modèles](/fr/concepts/models) — configuration des modèles et basculement
- [Vue d'ensemble des outils](/fr/tools)
