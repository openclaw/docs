---
read_when:
    - Un utilisateur signale que des agents restent bloqués à répéter des appels d’outils
    - Vous devez ajuster la protection contre les appels répétitifs
    - Vous modifiez les politiques relatives aux outils et à l’environnement d’exécution des agents
summary: Comment activer et ajuster les garde-fous qui détectent les boucles répétitives d’appels d’outils
title: Détection des boucles d’outils
x-i18n:
    generated_at: "2026-05-05T01:50:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: b9221e1716d3f4c2814a4705b160253839510cd6d11fe4ccd598c67958851afb
    source_path: tools/loop-detection.md
    workflow: 16
---

OpenClaw peut empêcher les agents de rester bloqués dans des schémas répétés d’appels d’outils.
La protection est **désactivée par défaut**.

Activez-la uniquement là où c’est nécessaire, car des réglages stricts peuvent bloquer des appels répétés légitimes.

## Pourquoi cela existe

- Détecter les séquences répétitives qui ne progressent pas.
- Détecter les boucles haute fréquence sans résultat (même outil, mêmes entrées, erreurs répétées).
- Détecter des schémas spécifiques d’appels répétés pour des outils d’interrogation connus.

## Bloc de configuration

Valeurs globales par défaut :

```json5
{
  tools: {
    loopDetection: {
      enabled: false,
      historySize: 30,
      warningThreshold: 10,
      criticalThreshold: 20,
      globalCircuitBreakerThreshold: 30,
      detectors: {
        genericRepeat: true,
        knownPollNoProgress: true,
        pingPong: true,
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

- `enabled` : interrupteur principal. `false` signifie qu’aucune détection de boucle n’est effectuée.
- `historySize` : nombre d’appels d’outils récents conservés pour l’analyse.
- `warningThreshold` : seuil avant de classer un schéma comme simple avertissement.
- `criticalThreshold` : seuil de blocage des schémas de boucle répétitifs.
- `globalCircuitBreakerThreshold` : seuil global de disjoncteur en absence de progression.
- `detectors.genericRepeat` : détecte les schémas répétés même outil + mêmes paramètres.
- `detectors.knownPollNoProgress` : détecte les schémas connus de type interrogation sans changement d’état.
- `detectors.pingPong` : détecte les schémas alternés de ping-pong.

Pour `exec`, les contrôles d’absence de progression comparent les résultats stables des commandes et ignorent les métadonnées d’exécution volatiles telles que la durée, le PID, l’ID de session et le répertoire de travail.
Lorsqu’un ID d’exécution est disponible, l’historique récent des appels d’outils est évalué uniquement dans cette exécution, afin que les cycles Heartbeat planifiés et les nouvelles exécutions n’héritent pas de compteurs de boucle périmés issus d’exécutions précédentes.

## Configuration recommandée

- Pour les modèles plus petits, commencez avec `enabled: true`, sans modifier les valeurs par défaut. Les modèles phares ont rarement besoin de la détection de boucle et peuvent la laisser désactivée.
- Conservez les seuils dans l’ordre `warningThreshold < criticalThreshold < globalCircuitBreakerThreshold`.
- Si des faux positifs se produisent :
  - augmentez `warningThreshold` et/ou `criticalThreshold`
  - augmentez éventuellement `globalCircuitBreakerThreshold`
  - désactivez uniquement le détecteur qui pose problème
  - réduisez `historySize` pour un contexte historique moins strict

## Protection post-Compaction

Lorsque le runner termine une nouvelle tentative automatique de Compaction (après un débordement de contexte), il active une protection à fenêtre courte qui surveille les quelques appels d’outils suivants. Si l’agent émet plusieurs fois le _même_ triplet `(toolName, args, result)` dans cette fenêtre, la protection conclut que la Compaction n’a pas interrompu la boucle et interrompt l’exécution avec une erreur `compaction_loop_persisted`.

Il s’agit d’un chemin de code distinct des détecteurs globaux `tools.loopDetection`. Il est configurable indépendamment :

```json5
{
  tools: {
    loopDetection: {
      enabled: true, // existing master switch; set false to disable loop guards
      postCompactionGuard: {
        windowSize: 3, // default: 3
      },
    },
  },
}
```

- `windowSize` : nombre d’appels d’outils post-Compaction pendant lesquels la protection reste active _et_ nombre de triplets identiques (outil, arguments, résultat) qui déclenche une interruption.

La protection n’interrompt jamais l’exécution lorsque les résultats changent, uniquement lorsqu’ils sont identiques au niveau des octets dans toute la fenêtre. Elle est volontairement étroite : elle ne se déclenche que juste après une nouvelle tentative de Compaction.

## Journaux et comportement attendu

Lorsqu’une boucle est détectée, OpenClaw signale un événement de boucle et bloque ou atténue le cycle d’outil suivant selon la gravité.
Cela protège les utilisateurs contre les dépenses de jetons incontrôlées et les blocages tout en préservant l’accès normal aux outils.

- Préférer d’abord les avertissements et la suppression temporaire.
- N’escalader que lorsque des preuves répétées s’accumulent.

## Remarques

- `tools.loopDetection` est fusionné avec les remplacements au niveau de l’agent.
- La configuration par agent remplace entièrement ou étend les valeurs globales.
- Si aucune configuration n’existe, les garde-fous restent désactivés.

## Connexe

- [Approbations Exec](/fr/tools/exec-approvals)
- [Niveaux de réflexion](/fr/tools/thinking)
- [Sous-agents](/fr/tools/subagents)
