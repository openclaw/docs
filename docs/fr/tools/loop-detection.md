---
read_when:
    - Un utilisateur signale que des agents restent bloqués à répéter des appels d’outils
    - Vous devez ajuster la protection contre les appels répétitifs
    - Vous modifiez les politiques des outils d’agent et de l’environnement d’exécution
    - Vous rencontrez des abandons `compaction_loop_persisted` après une nouvelle tentative due à un dépassement du contexte
summary: Comment activer et ajuster les garde-fous qui détectent les boucles répétitives d’appels d’outils
title: Détection des boucles d’outils
x-i18n:
    generated_at: "2026-05-11T20:59:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: cc261bebc0e3138a98ea8be166edbaf4e133c8f582429c5380fe2954196a6fc5
    source_path: tools/loop-detection.md
    workflow: 16
    postprocess_version: locale-links-v1
---

OpenClaw dispose de deux garde-fous coopérants pour les motifs répétitifs d’appels d’outils :

1. **Détection de boucle** (`tools.loopDetection.enabled`) — désactivée par défaut. Surveille l’historique glissant des appels d’outils pour repérer les motifs répétés et les nouvelles tentatives avec des outils inconnus.
2. **Garde post-Compaction** (`tools.loopDetection.postCompactionGuard`) — activée par défaut sauf si `tools.loopDetection.enabled` vaut explicitement `false`. Elle s’arme après chaque nouvelle tentative de Compaction et abandonne l’exécution lorsque l’agent émet le même triplet `(tool, args, result)` dans la fenêtre.

Les deux sont configurés dans le même bloc `tools.loopDetection`, mais la garde post-Compaction s’exécute chaque fois que l’interrupteur principal n’est pas explicitement désactivé. Définissez `tools.loopDetection.enabled: false` pour désactiver les deux surfaces.

## Pourquoi cela existe

- Détecter les séquences répétitives qui ne progressent pas.
- Détecter les boucles à haute fréquence sans résultat (même outil, mêmes entrées, erreurs répétées).
- Détecter des motifs spécifiques d’appels répétés pour les outils d’interrogation connus.
- Empêcher les cycles dépassement de contexte puis Compaction puis même boucle de s’exécuter indéfiniment.

## Bloc de configuration

Valeurs globales par défaut, avec tous les champs documentés affichés :

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

| Champ                            | Par défaut | Effet                                                                                                                          |
| -------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `enabled`                        | `false`    | Interrupteur principal des détecteurs d’historique glissant. Définir `false` désactive également la garde post-Compaction.    |
| `historySize`                    | `30`       | Nombre d’appels d’outils récents conservés pour l’analyse.                                                                     |
| `warningThreshold`               | `10`       | Seuil avant qu’un motif soit classé comme avertissement uniquement.                                                            |
| `criticalThreshold`              | `20`       | Seuil de blocage des motifs de boucle répétitifs sans progression.                                                             |
| `unknownToolThreshold`           | `10`       | Bloque les appels répétés au même outil indisponible après ce nombre d’échecs.                                                 |
| `globalCircuitBreakerThreshold`  | `30`       | Seuil du disjoncteur global sans progression pour tous les détecteurs.                                                         |
| `detectors.genericRepeat`        | `true`     | Avertit en cas de motifs répétés même outil + mêmes paramètres et bloque lorsque ces mêmes appels renvoient aussi des résultats identiques. |
| `detectors.knownPollNoProgress`  | `true`     | Détecte les motifs connus de type interrogation sans changement d’état.                                                        |
| `detectors.pingPong`             | `true`     | Détecte les motifs alternés de ping-pong.                                                                                      |
| `postCompactionGuard.windowSize` | `3`        | Nombre d’appels d’outils post-Compaction pendant lesquels la garde reste armée et nombre de triplets identiques qui abandonne l’exécution. |

Pour `exec`, les contrôles d’absence de progression comparent les résultats stables des commandes et ignorent les métadonnées d’exécution volatiles comme la durée, le PID, l’ID de session et le répertoire de travail. Lorsqu’un ID d’exécution est disponible, l’historique récent des appels d’outils est évalué uniquement dans cette exécution afin que les cycles Heartbeat planifiés et les nouvelles exécutions n’héritent pas de compteurs de boucle obsolètes provenant d’exécutions antérieures.

## Configuration recommandée

- Pour les modèles plus petits, définissez `enabled: true` et laissez les seuils à leurs valeurs par défaut. Les modèles phares ont rarement besoin de la détection par historique glissant et peuvent laisser l’interrupteur principal à `false` tout en bénéficiant de la garde post-Compaction.
- Conservez les seuils dans l’ordre `warningThreshold < criticalThreshold < globalCircuitBreakerThreshold`.
- Si des faux positifs se produisent :
  - Augmentez `warningThreshold` et/ou `criticalThreshold`.
  - Augmentez éventuellement `globalCircuitBreakerThreshold`.
  - Désactivez uniquement le détecteur spécifique qui pose problème (`detectors.<name>: false`).
  - Réduisez `historySize` pour un contexte historique moins strict.
- Pour tout désactiver (y compris la garde post-Compaction), définissez explicitement `tools.loopDetection.enabled: false`.

## Garde post-Compaction

Lorsque le moteur d’exécution termine une nouvelle tentative de Compaction après un dépassement de contexte, il arme une garde à fenêtre courte qui surveille les quelques appels d’outils suivants. Si l’agent émet plusieurs fois le même triplet `(toolName, argsHash, resultHash)` dans la fenêtre, la garde conclut que la Compaction n’a pas rompu la boucle et abandonne l’exécution avec une erreur `compaction_loop_persisted`.

La garde est contrôlée par l’indicateur principal `tools.loopDetection.enabled` avec une nuance : elle reste **activée lorsque l’indicateur n’est pas défini ou vaut `true`** et se désactive uniquement lorsque l’indicateur vaut explicitement `false`. C’est intentionnel. La garde sert à sortir des boucles de Compaction qui consommeraient autrement des jetons sans limite ; un utilisateur sans configuration bénéficie donc quand même de la protection.

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

- Un `windowSize` plus bas est plus strict (moins de tentatives avant l’abandon).
- Un `windowSize` plus élevé donne à l’agent davantage de tentatives de récupération.
- La garde n’abandonne jamais lorsque les résultats changent, seulement lorsque les résultats sont identiques octet pour octet dans la fenêtre.
- Elle est volontairement étroite : elle ne se déclenche que juste après une nouvelle tentative de Compaction.

<Note>
  La garde post-Compaction s’exécute chaque fois que l’indicateur principal n’est pas explicitement `false`, même si vous n’avez jamais écrit de bloc `tools.loopDetection`. Pour vérifier, recherchez `post-compaction guard armed for N attempts` dans le journal du Gateway immédiatement après un événement de Compaction.
</Note>

## Journaux et comportement attendu

Lorsqu’une boucle est détectée, OpenClaw signale un événement de boucle et atténue ou bloque le prochain cycle d’outil selon la gravité. Cela protège les utilisateurs contre une dépense excessive de jetons et les blocages tout en préservant l’accès normal aux outils.

- Les avertissements apparaissent en premier.
- La suppression suit lorsque les motifs persistent au-delà du seuil d’avertissement.
- Les seuils critiques bloquent le prochain cycle d’outil et exposent une raison claire de détection de boucle dans l’enregistrement d’exécution.
- La garde post-Compaction émet des erreurs `compaction_loop_persisted` avec le nom de l’outil incriminé et le nombre d’appels identiques.

## Connexe

<CardGroup cols={2}>
  <Card title="Approbations Exec" href="/fr/tools/exec-approvals" icon="shield">
    Politique d’autorisation/refus pour l’exécution shell.
  </Card>
  <Card title="Niveaux de réflexion" href="/fr/tools/thinking" icon="brain">
    Niveaux d’effort de raisonnement et interaction avec la politique du fournisseur.
  </Card>
  <Card title="Sous-agents" href="/fr/tools/subagents" icon="users">
    Génération d’agents isolés pour borner les comportements incontrôlés.
  </Card>
  <Card title="Référence de configuration" href="/fr/gateway/configuration-reference" icon="gear">
    Schéma complet de `tools.loopDetection` et sémantique de fusion.
  </Card>
</CardGroup>
