---
read_when:
    - Génération de musique ou d’audio via l’agent
    - Configurer les fournisseurs et les modèles de génération musicale
    - Comprendre les paramètres de l’outil `music_generate`
summary: Générez de la musique avec des fournisseurs partagés, y compris des plugins adossés à des flux de travail
title: Génération de musique
x-i18n:
    generated_at: "2026-04-25T13:59:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: fe66c6dfb54c71b1d08a486c574e8a86cf3731d5339b44b9eef121f045c13cb8
    source_path: tools/music-generation.md
    workflow: 15
---

L’outil `music_generate` permet à l’agent de créer de la musique ou de l’audio via la
capacité partagée de génération musicale avec des fournisseurs configurés tels que Google,
MiniMax et ComfyUI configuré par flux de travail.

Pour les sessions d’agent adossées à des fournisseurs partagés, OpenClaw démarre la génération musicale comme
une tâche en arrière-plan, la suit dans le registre des tâches, puis réveille de nouveau l’agent lorsque
la piste est prête afin que l’agent puisse republier l’audio terminé dans le
canal d’origine.

<Note>
L’outil partagé intégré n’apparaît que lorsqu’au moins un fournisseur de génération musicale est disponible. Si vous ne voyez pas `music_generate` dans les outils de votre agent, configurez `agents.defaults.musicGenerationModel` ou définissez une clé API de fournisseur.
</Note>

## Démarrage rapide

### Génération adossée à un fournisseur partagé

1. Définissez une clé API pour au moins un fournisseur, par exemple `GEMINI_API_KEY` ou
   `MINIMAX_API_KEY`.
2. Définissez éventuellement votre modèle préféré :

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

3. Demandez à l’agent : _"Génère une piste synthpop entraînante sur une virée nocturne
   à travers une ville néon."_

L’agent appelle `music_generate` automatiquement. Aucune liste d’autorisation d’outils n’est nécessaire.

Pour les contextes synchrones directs sans exécution d’agent adossée à une session, l’outil intégré
revient quand même à une génération inline et renvoie le chemin final du média dans
le résultat de l’outil.

Exemples de prompts :

```text
Génère une piste de piano cinématographique avec des cordes douces et sans voix.
```

```text
Génère une boucle chiptune énergique sur le lancement d’une fusée au lever du soleil.
```

### Génération Comfy pilotée par workflow

Le Plugin `comfy` intégré se branche sur l’outil partagé `music_generate` via
le registre des fournisseurs de génération musicale.

1. Configurez `plugins.entries.comfy.config.music` avec un JSON de workflow et
   des nœuds de prompt/sortie.
2. Si vous utilisez Comfy Cloud, définissez `COMFY_API_KEY` ou `COMFY_CLOUD_API_KEY`.
3. Demandez de la musique à l’agent ou appelez directement l’outil.

Exemple :

```text
/tool music_generate prompt="Boucle synthé ambient chaleureuse avec texture de bande douce"
```

## Prise en charge intégrée des fournisseurs partagés

| Fournisseur | Modèle par défaut      | Entrées de référence | Contrôles pris en charge                                 | Clé API                                 |
| ----------- | ---------------------- | -------------------- | -------------------------------------------------------- | --------------------------------------- |
| ComfyUI     | `workflow`             | Jusqu’à 1 image      | Musique ou audio définis par le workflow                 | `COMFY_API_KEY`, `COMFY_CLOUD_API_KEY` |
| Google      | `lyria-3-clip-preview` | Jusqu’à 10 images    | `lyrics`, `instrumental`, `format`                       | `GEMINI_API_KEY`, `GOOGLE_API_KEY`     |
| MiniMax     | `music-2.6`            | Aucune               | `lyrics`, `instrumental`, `durationSeconds`, `format=mp3` | `MINIMAX_API_KEY`                      |

### Matrice de capacités déclarées

Il s’agit du contrat de mode explicite utilisé par `music_generate`, les tests de contrat
et le balayage live partagé.

| Fournisseur | `generate` | `edit` | Limite d’édition | Lanes live partagées                                                      |
| ----------- | ---------- | ------ | ---------------- | ------------------------------------------------------------------------- |
| ComfyUI     | Oui        | Oui    | 1 image          | Pas dans le balayage partagé ; couvert par `extensions/comfy/comfy.live.test.ts` |
| Google      | Oui        | Oui    | 10 images        | `generate`, `edit`                                                        |
| MiniMax     | Oui        | Non    | Aucune           | `generate`                                                                |

Utilisez `action: "list"` pour inspecter les fournisseurs et modèles partagés disponibles
à l’exécution :

```text
/tool music_generate action=list
```

Utilisez `action: "status"` pour inspecter la tâche musicale active adossée à la session :

```text
/tool music_generate action=status
```

Exemple de génération directe :

```text
/tool music_generate prompt="Hip-hop lo-fi rêveur avec texture vinyle et pluie légère" instrumental=true
```

## Paramètres de l’outil intégré

| Paramètre         | Type     | Description                                                                                          |
| ----------------- | -------- | ---------------------------------------------------------------------------------------------------- |
| `prompt`          | string   | Prompt de génération musicale (requis pour `action: "generate"`)                                     |
| `action`          | string   | `"generate"` (par défaut), `"status"` pour la tâche de la session actuelle, ou `"list"` pour inspecter les fournisseurs |
| `model`           | string   | Remplacement du fournisseur/modèle, par ex. `google/lyria-3-pro-preview` ou `comfy/workflow`        |
| `lyrics`          | string   | Paroles facultatives lorsque le fournisseur prend explicitement en charge une entrée de paroles      |
| `instrumental`    | boolean  | Demande une sortie instrumentale uniquement lorsque le fournisseur la prend en charge                |
| `image`           | string   | Chemin ou URL d’image de référence unique                                                            |
| `images`          | string[] | Plusieurs images de référence (jusqu’à 10)                                                           |
| `durationSeconds` | number   | Durée cible en secondes lorsque le fournisseur prend en charge les indications de durée              |
| `timeoutMs`       | number   | Délai d’expiration facultatif de la requête fournisseur en millisecondes                             |
| `format`          | string   | Indication de format de sortie (`mp3` ou `wav`) lorsque le fournisseur la prend en charge           |
| `filename`        | string   | Indication de nom de fichier                                                                         |

Tous les fournisseurs ne prennent pas en charge tous les paramètres. OpenClaw valide quand même les limites strictes
telles que le nombre d’entrées avant l’envoi. Lorsqu’un fournisseur prend en charge la durée mais
utilise un maximum plus court que la valeur demandée, OpenClaw applique automatiquement
la durée prise en charge la plus proche. Les indications facultatives réellement non prises en charge sont ignorées
avec un avertissement lorsque le fournisseur ou le modèle sélectionné ne peut pas les honorer.

Les résultats de l’outil indiquent les paramètres appliqués. Lorsque OpenClaw limite la durée lors d’un repli de fournisseur, la valeur renvoyée dans `durationSeconds` reflète la valeur soumise et `details.normalization.durationSeconds` montre le mappage entre la valeur demandée et la valeur appliquée.

## Comportement asynchrone pour le chemin adossé à un fournisseur partagé

- Exécutions d’agent adossées à une session : `music_generate` crée une tâche en arrière-plan, renvoie immédiatement une réponse de démarrage/tâche, puis publie la piste terminée plus tard dans un message de suivi de l’agent.
- Prévention des doublons : tant que cette tâche en arrière-plan est encore `queued` ou `running`, les appels ultérieurs à `music_generate` dans la même session renvoient l’état de la tâche au lieu de démarrer une autre génération.
- Consultation d’état : utilisez `action: "status"` pour inspecter la tâche musicale active adossée à la session sans démarrer une nouvelle génération.
- Suivi des tâches : utilisez `openclaw tasks list` ou `openclaw tasks show <taskId>` pour inspecter les états en file d’attente, en cours et terminaux de la génération.
- Réveil à l’achèvement : OpenClaw injecte un événement interne d’achèvement dans la même session afin que le modèle puisse lui-même rédiger le message de suivi destiné à l’utilisateur.
- Indice de prompt : les tours utilisateur/manuels ultérieurs dans la même session reçoivent un petit indice d’exécution lorsqu’une tâche musicale est déjà en cours, afin que le modèle ne rappelle pas aveuglément `music_generate`.
- Repli sans session : les contextes directs/locaux sans véritable session d’agent s’exécutent quand même inline et renvoient le résultat audio final dans le même tour.

### Cycle de vie de la tâche

Chaque demande `music_generate` passe par quatre états :

1. **queued** -- tâche créée, en attente d’acceptation par le fournisseur.
2. **running** -- le fournisseur traite la demande (généralement de 30 secondes à 3 minutes selon le fournisseur et la durée).
3. **succeeded** -- piste prête ; l’agent se réveille et la publie dans la conversation.
4. **failed** -- erreur du fournisseur ou délai dépassé ; l’agent se réveille avec les détails de l’erreur.

Vérifiez l’état depuis la CLI :

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

Prévention des doublons : si une tâche musicale est déjà `queued` ou `running` pour la session actuelle, `music_generate` renvoie l’état de la tâche existante au lieu d’en démarrer une nouvelle. Utilisez `action: "status"` pour vérifier explicitement sans déclencher une nouvelle génération.

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

Lors de la génération musicale, OpenClaw essaie les fournisseurs dans cet ordre :

1. le paramètre `model` de l’appel d’outil, si l’agent en spécifie un
2. `musicGenerationModel.primary` depuis la configuration
3. `musicGenerationModel.fallbacks` dans l’ordre
4. détection automatique en utilisant uniquement les valeurs par défaut de fournisseur adossées à l’authentification :
   - fournisseur par défaut actuel en premier
   - fournisseurs de génération musicale enregistrés restants dans l’ordre des identifiants de fournisseur

Si un fournisseur échoue, le candidat suivant est essayé automatiquement. Si tous échouent, l’erreur
inclut les détails de chaque tentative.

Définissez `agents.defaults.mediaGenerationAutoProviderFallback: false` si vous voulez
que la génération musicale utilise uniquement les entrées explicites `model`, `primary` et `fallbacks`.

## Remarques sur les fournisseurs

- Google utilise la génération par lot Lyria 3. Le flux intégré actuel prend en charge
  le prompt, le texte facultatif des paroles et les images de référence facultatives.
- MiniMax utilise le point de terminaison par lot `music_generation`. Le flux intégré actuel
  prend en charge le prompt, les paroles facultatives, le mode instrumental, l’orientation de la durée et
  la sortie mp3.
- La prise en charge de ComfyUI est pilotée par workflow et dépend du graphe configuré ainsi que
  du mappage des nœuds pour les champs de prompt/sortie.

## Modes de capacité des fournisseurs

Le contrat partagé de génération musicale prend désormais en charge des déclarations explicites de mode :

- `generate` pour la génération à partir du prompt seul
- `edit` lorsque la demande inclut une ou plusieurs images de référence

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
`supportsFormat` ne suffisent pas pour annoncer la prise en charge de l’édition. Les fournisseurs doivent
déclarer explicitement `generate` et `edit` afin que les tests live, les tests de contrat et
l’outil partagé `music_generate` puissent valider la prise en charge du mode de façon déterministe.

## Choisir le bon chemin

- Utilisez le chemin adossé à un fournisseur partagé lorsque vous voulez la sélection de modèle, le repli fournisseur et le flux intégré asynchrone tâche/état.
- Utilisez un chemin de Plugin tel que ComfyUI lorsque vous avez besoin d’un graphe de workflow personnalisé ou d’un fournisseur qui ne fait pas partie de la capacité musicale partagée intégrée.
- Si vous déboguez un comportement spécifique à ComfyUI, consultez [ComfyUI](/fr/providers/comfy). Si vous déboguez le comportement d’un fournisseur partagé, commencez par [Google (Gemini)](/fr/providers/google) ou [MiniMax](/fr/providers/minimax).

## Tests live

Couverture live facultative pour les fournisseurs intégrés partagés :

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts
```

Wrapper du dépôt :

```bash
pnpm test:live:media music
```

Ce fichier live charge les variables d’environnement de fournisseur manquantes depuis `~/.profile`, privilégie
par défaut les clés API live/env par rapport aux profils d’authentification stockés, et exécute à la fois
la couverture `generate` et la couverture `edit` déclarée lorsque le fournisseur active le mode édition.

Aujourd’hui, cela signifie :

- `google` : `generate` plus `edit`
- `minimax` : `generate` uniquement
- `comfy` : couverture live Comfy séparée, pas dans le balayage de fournisseur partagé

Couverture live facultative pour le chemin musical ComfyUI intégré :

```bash
OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
```

Le fichier live Comfy couvre également les workflows d’image et de vidéo Comfy lorsque ces
sections sont configurées.

## Lié

- [Tâches en arrière-plan](/fr/automation/tasks) - suivi des tâches pour les exécutions `music_generate` détachées
- [Référence de configuration](/fr/gateway/config-agents#agent-defaults) - configuration `musicGenerationModel`
- [ComfyUI](/fr/providers/comfy)
- [Google (Gemini)](/fr/providers/google)
- [MiniMax](/fr/providers/minimax)
- [Modèles](/fr/concepts/models) - configuration des modèles et basculement
- [Vue d’ensemble des outils](/fr/tools)
