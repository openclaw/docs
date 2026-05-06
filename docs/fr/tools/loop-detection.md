---
read_when:
    - Un utilisateur signale que des agents restent bloqués à répéter des appels d’outils
    - Vous devez ajuster la protection contre les appels répétitifs
    - Vous modifiez les politiques d’outils et de runtime de l’agent
    - Vous rencontrez des abandons `compaction_loop_persisted` après une nouvelle tentative due à un dépassement de contexte
summary: Comment activer et régler les garde-fous qui détectent les boucles répétitives d’appels d’outils
title: Détection des boucles d’outils
x-i18n:
    generated_at: "2026-05-06T07:42:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 48773b2af3ba38db48f14c65e9f359c80b2503bd29c8e3edfaca2e4ced7e1713
    source_path: tools/loop-detection.md
    workflow: 16
---

OpenClaw dispose de deux garde-fous coopérants pour les motifs répétitifs d’appels d’outils :

1. **Détection de boucle** (`tools.loopDetection.enabled`) — désactivée par défaut. Surveille l’historique glissant des appels d’outils pour repérer les motifs répétés et les nouvelles tentatives avec des outils inconnus.
2. **Garde post-Compaction** (`tools.loopDetection.postCompactionGuard`) — activée par défaut sauf si `tools.loopDetection.enabled` vaut explicitement `false`. S’arme après chaque nouvelle tentative de Compaction et interrompt l’exécution lorsque l’agent émet le même triplet `(tool, args, result)` dans la fenêtre.

Les deux se configurent dans le même bloc `tools.loopDetection`, mais la garde post-Compaction s’exécute chaque fois que l’interrupteur principal n’est pas explicitement désactivé. Définissez `tools.loopDetection.enabled: false` pour désactiver les deux surfaces.

## Pourquoi cela existe

- Détecter les séquences répétitives qui ne progressent pas.
- Détecter les boucles à haute fréquence sans résultat (même outil, mêmes entrées, erreurs répétées).
- Détecter des motifs spécifiques d’appels répétés pour les outils de sondage connus.
- Empêcher les cycles de dépassement de contexte, puis Compaction, puis même boucle, de s’exécuter indéfiniment.

## Bloc de configuration

Valeurs par défaut globales, avec tous les champs documentés affichés :

```json5
{
  tools: {
    loopDetection: {
      enabled: false, // master switch for the rolling-history detectors
      historySize: 30,
      warningThreshold: 10,
      criticalThreshold: 20,
      unknownToolThreshold: 10,
      globalCircuitBreakerThreshold: 30,
      detectors: {
        genericRepeat: true,
        knownPollNoProgress: true,
        pingPong: true,
      },
      postCompactionGuard: {
        windowSize: 3, // armed after compaction-retry; runs unless enabled is explicitly false
      },
    },
  },
}
```

Remplacement par agent (facultatif) :

```json5
{
  agents: {
    list: [
      {
        id: "safe-runner",
        tools: {
          loopDetection: {
            enabled: true,
            warningThreshold: 8,
            criticalThreshold: 16,
          },
        },
      },
    ],
  },
}
```

### Comportement des champs

| Champ                            | Valeur par défaut | Effet                                                                                                                          |
| -------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`                        | `false` | Interrupteur principal des détecteurs à historique glissant. Le définir à `false` désactive également la garde post-Compaction. |
| `historySize`                    | `30`    | Nombre d’appels d’outils récents conservés pour l’analyse.                                                                      |
| `warningThreshold`               | `10`    | Seuil avant qu’un motif soit classé comme simple avertissement.                                                                 |
| `criticalThreshold`              | `20`    | Seuil de blocage des motifs de boucle répétitifs.                                                                               |
| `unknownToolThreshold`           | `10`    | Bloque les appels répétés au même outil indisponible après ce nombre d’échecs.                                                  |
| `globalCircuitBreakerThreshold`  | `30`    | Seuil global du disjoncteur d’absence de progression pour tous les détecteurs.                                                  |
| `detectors.genericRepeat`        | `true`  | Détecte les motifs répétés même outil + mêmes paramètres.                                                                       |
| `detectors.knownPollNoProgress`  | `true`  | Détecte les motifs connus de type sondage sans changement d’état.                                                               |
| `detectors.pingPong`             | `true`  | Détecte les motifs alternés de ping-pong.                                                                                       |
| `postCompactionGuard.windowSize` | `3`     | Nombre d’appels d’outils post-Compaction pendant lesquels la garde reste armée, et nombre de triplets identiques qui interrompt l’exécution. |

Pour `exec`, les vérifications d’absence de progression comparent des résultats de commande stables et ignorent les métadonnées d’exécution volatiles telles que la durée, le PID, l’ID de session et le répertoire de travail. Lorsqu’un ID d’exécution est disponible, l’historique récent des appels d’outils est évalué uniquement dans cette exécution afin que les cycles Heartbeat planifiés et les nouvelles exécutions n’héritent pas de décomptes de boucles obsolètes issus d’exécutions antérieures.

## Configuration recommandée

- Pour les modèles plus petits, définissez `enabled: true` et conservez les seuils par défaut. Les modèles phares ont rarement besoin de la détection à historique glissant et peuvent laisser l’interrupteur principal à `false` tout en bénéficiant de la garde post-Compaction.
- Conservez l’ordre des seuils comme suit : `warningThreshold < criticalThreshold < globalCircuitBreakerThreshold`.
- Si des faux positifs se produisent :
  - Augmentez `warningThreshold` et/ou `criticalThreshold`.
  - Augmentez éventuellement `globalCircuitBreakerThreshold`.
  - Désactivez uniquement le détecteur spécifique qui pose problème (`detectors.<name>: false`).
  - Réduisez `historySize` pour un contexte historique moins strict.
- Pour tout désactiver (y compris la garde post-Compaction), définissez explicitement `tools.loopDetection.enabled: false`.

## Garde post-Compaction

Lorsque le runner termine une nouvelle tentative de Compaction après un dépassement de contexte, il arme une garde à fenêtre courte qui surveille les quelques appels d’outils suivants. Si l’agent émet plusieurs fois le même triplet `(toolName, argsHash, resultHash)` dans la fenêtre, la garde conclut que la Compaction n’a pas interrompu la boucle et interrompt l’exécution avec une erreur `compaction_loop_persisted`.

La garde est contrôlée par l’indicateur principal `tools.loopDetection.enabled` avec une nuance : elle reste **activée lorsque l’indicateur n’est pas défini ou vaut `true`** et ne se désactive que lorsque l’indicateur vaut explicitement `false`. C’est intentionnel. La garde existe pour sortir des boucles de Compaction qui consommeraient sinon des jetons sans limite ; ainsi, un utilisateur sans configuration bénéficie quand même de la protection.

```json5
{
  tools: {
    loopDetection: {
      // master switch; set false to disable the guard along with the rolling detectors
      enabled: true,
      postCompactionGuard: {
        windowSize: 3, // default
      },
    },
  },
}
```

- Un `windowSize` plus bas est plus strict (moins de tentatives avant interruption).
- Un `windowSize` plus élevé donne à l’agent davantage de tentatives de récupération.
- La garde n’interrompt jamais lorsque les résultats changent, seulement lorsque les résultats sont identiques octet pour octet dans la fenêtre.
- Elle est volontairement étroite : elle ne se déclenche que dans les suites immédiates d’une nouvelle tentative de Compaction.

<Note>
  La garde post-Compaction s’exécute chaque fois que l’indicateur principal ne vaut pas explicitement `false`, même si vous n’avez jamais écrit de bloc `tools.loopDetection`. Pour vérifier, recherchez `post-compaction guard armed for N attempts` dans le journal du Gateway immédiatement après un événement de Compaction.
</Note>

## Journaux et comportement attendu

Lorsqu’une boucle est détectée, OpenClaw signale un événement de boucle et atténue ou bloque le prochain cycle d’outil selon la gravité. Cela protège les utilisateurs contre les dépenses de jetons incontrôlées et les blocages, tout en préservant l’accès normal aux outils.

- Les avertissements arrivent en premier.
- La suppression suit lorsque les motifs persistent au-delà du seuil d’avertissement.
- Les seuils critiques bloquent le prochain cycle d’outil et exposent une raison claire de détection de boucle dans l’enregistrement de l’exécution.
- La garde post-Compaction émet des erreurs `compaction_loop_persisted` avec le nom de l’outil fautif et le nombre d’appels identiques.

## Associés

<CardGroup cols={2}>
  <Card title="Approbations Exec" href="/fr/tools/exec-approvals" icon="shield">
    Politique d’autorisation/refus pour l’exécution du shell.
  </Card>
  <Card title="Niveaux de réflexion" href="/fr/tools/thinking" icon="brain">
    Niveaux d’effort de raisonnement et interaction avec la politique du fournisseur.
  </Card>
  <Card title="Sous-agents" href="/fr/tools/subagents" icon="users">
    Génération d’agents isolés pour limiter les comportements incontrôlés.
  </Card>
  <Card title="Référence de configuration" href="/fr/gateway/configuration-reference" icon="gear">
    Schéma complet de `tools.loopDetection` et sémantique de fusion.
  </Card>
</CardGroup>
