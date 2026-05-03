---
read_when:
    - Un utilisateur signale que des agents restent bloqués à répéter des appels d’outils
    - Vous devez ajuster la protection contre les appels répétitifs
    - Vous modifiez les politiques des outils et de l’environnement d’exécution de l’agent
summary: Comment activer et ajuster les garde-fous qui détectent les boucles répétitives d’appels d’outils
title: Détection des boucles d’outils
x-i18n:
    generated_at: "2026-05-03T21:39:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1b3976948d5735cf08b7ce854bab048a77a778a07a9f3f66d17c15aed0d42a97
    source_path: tools/loop-detection.md
    workflow: 16
---

OpenClaw peut empêcher les agents de rester bloqués dans des motifs répétés d’appels d’outils.
La protection est **désactivée par défaut**.

Activez-la uniquement là où c’est nécessaire, car elle peut bloquer des appels répétés légitimes avec des réglages stricts.

## Pourquoi cela existe

- Détecter les séquences répétitives qui ne progressent pas.
- Détecter les boucles sans résultat à haute fréquence (même outil, mêmes entrées, erreurs répétées).
- Détecter des motifs précis d’appels répétés pour les outils d’interrogation connus.

## Bloc de configuration

Valeurs par défaut globales :

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
- `warningThreshold` : seuil avant de classer un motif comme avertissement uniquement.
- `criticalThreshold` : seuil de blocage des motifs de boucle répétitifs.
- `globalCircuitBreakerThreshold` : seuil global du disjoncteur en l’absence de progression.
- `detectors.genericRepeat` : détecte les motifs répétés avec même outil + mêmes paramètres.
- `detectors.knownPollNoProgress` : détecte les motifs connus de type interrogation sans changement d’état.
- `detectors.pingPong` : détecte les motifs alternés de ping-pong.

Pour `exec`, les vérifications d’absence de progression comparent des résultats de commande stables et ignorent les métadonnées d’exécution volatiles comme la durée, le PID, l’identifiant de session et le répertoire de travail.
Lorsqu’un identifiant d’exécution est disponible, l’historique récent des appels d’outils est évalué uniquement dans cette exécution, afin que les cycles Heartbeat planifiés et les nouvelles exécutions n’héritent pas de compteurs de boucle obsolètes provenant d’exécutions précédentes.

## Configuration recommandée

- Pour les modèles plus petits, commencez avec `enabled: true`, sans modifier les valeurs par défaut. Les modèles phares ont rarement besoin de la détection de boucle et peuvent la laisser désactivée.
- Conservez les seuils dans l’ordre `warningThreshold < criticalThreshold < globalCircuitBreakerThreshold`.
- En cas de faux positifs :
  - augmentez `warningThreshold` et/ou `criticalThreshold`
  - augmentez éventuellement `globalCircuitBreakerThreshold`
  - désactivez uniquement le détecteur qui pose problème
  - réduisez `historySize` pour un contexte historique moins strict

## Journaux et comportement attendu

Lorsqu’une boucle est détectée, OpenClaw signale un événement de boucle et bloque ou atténue le cycle d’outils suivant selon la gravité.
Cela protège les utilisateurs contre les dépenses de jetons incontrôlées et les blocages tout en préservant l’accès normal aux outils.

- Préférez d’abord les avertissements et la suppression temporaire.
- N’escaladez que lorsque des preuves répétées s’accumulent.

## Notes

- `tools.loopDetection` est fusionné avec les remplacements au niveau de l’agent.
- La configuration par agent remplace ou étend entièrement les valeurs globales.
- Si aucune configuration n’existe, les garde-fous restent désactivés.

## Associés

- [Approbations Exec](/fr/tools/exec-approvals)
- [Niveaux de réflexion](/fr/tools/thinking)
- [Sous-agents](/fr/tools/subagents)
