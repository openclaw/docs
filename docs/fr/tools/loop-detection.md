---
read_when:
    - Un utilisateur signale que des agents restent bloqués en répétant des appels d’outils
    - Vous devez ajuster la protection contre les appels répétitifs
    - Vous modifiez les politiques d’outils et d’exécution de l’agent
summary: Comment activer et ajuster les garde-fous qui détectent les boucles répétitives d’appels d’outils
title: Détection des boucles d’outils
x-i18n:
    generated_at: "2026-04-30T07:52:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: ba601384e7d23ddfd316f9e5eef92b3daa4618d2287228a516c76fe141700a28
    source_path: tools/loop-detection.md
    workflow: 16
---

OpenClaw peut empêcher les agents de rester bloqués dans des schémas d’appels d’outils répétés.
La protection est **désactivée par défaut**.

Activez-la uniquement là où elle est nécessaire, car elle peut bloquer des appels répétés légitimes avec des réglages stricts.

## Pourquoi cela existe

- Détecter les séquences répétitives qui ne progressent pas.
- Détecter les boucles sans résultat à haute fréquence (même outil, mêmes entrées, erreurs répétées).
- Détecter des schémas spécifiques d’appels répétés pour les outils d’interrogation connus.

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
- `warningThreshold` : seuil avant de classer un schéma comme avertissement uniquement.
- `criticalThreshold` : seuil de blocage des schémas de boucle répétitifs.
- `globalCircuitBreakerThreshold` : seuil du disjoncteur global sans progression.
- `detectors.genericRepeat` : détecte les schémas répétés même outil + mêmes paramètres.
- `detectors.knownPollNoProgress` : détecte les schémas connus de type interrogation sans changement d’état.
- `detectors.pingPong` : détecte les schémas alternés de ping-pong.

Pour `exec`, les vérifications sans progression comparent les résultats de commande stables et ignorent les métadonnées d’exécution volatiles telles que la durée, le PID, l’ID de session et le répertoire de travail.
Lorsqu’un ID d’exécution est disponible, l’historique récent des appels d’outils est évalué uniquement dans cette exécution, afin que les cycles Heartbeat planifiés et les nouvelles exécutions n’héritent pas des compteurs de boucle obsolètes des exécutions précédentes.

## Configuration recommandée

- Commencez avec `enabled: true`, sans modifier les valeurs par défaut.
- Conservez les seuils dans l’ordre `warningThreshold < criticalThreshold < globalCircuitBreakerThreshold`.
- En cas de faux positifs :
  - augmentez `warningThreshold` et/ou `criticalThreshold`
  - augmentez éventuellement `globalCircuitBreakerThreshold`
  - désactivez uniquement le détecteur à l’origine des problèmes
  - réduisez `historySize` pour un contexte historique moins strict

## Journaux et comportement attendu

Lorsqu’une boucle est détectée, OpenClaw signale un événement de boucle et bloque ou atténue le cycle d’outils suivant selon la gravité.
Cela protège les utilisateurs contre les dépenses de jetons incontrôlées et les blocages, tout en préservant l’accès normal aux outils.

- Privilégiez d’abord l’avertissement et la suppression temporaire.
- N’escaladez que lorsque des preuves répétées s’accumulent.

## Notes

- `tools.loopDetection` est fusionné avec les remplacements au niveau de l’agent.
- La configuration par agent remplace ou étend entièrement les valeurs globales.
- Si aucune configuration n’existe, les garde-fous restent désactivés.

## Connexe

- [Approbations Exec](/fr/tools/exec-approvals)
- [Niveaux de réflexion](/fr/tools/thinking)
- [Sous-agents](/fr/tools/subagents)
