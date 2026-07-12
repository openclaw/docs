---
read_when:
    - Exécution des contrôles locaux de fiabilité de l’agent personnel
    - Extension du catalogue de scénarios d’assurance qualité adossé au dépôt
    - Vérification des rappels, des réponses, de la mémoire, de la rédaction, du suivi sécurisé des outils, de l’état des tâches, des diagnostics pouvant être partagés en toute sécurité, des déclarations d’achèvement étayées par des preuves et de la récupération après échec
summary: Scénarios qa-channel locaux pour vérifier les workflows d’assistant personnel respectueux de la vie privée.
title: Pack de benchmarks pour agent personnel
x-i18n:
    generated_at: "2026-07-12T02:31:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 35da45e4b22b1044a777fa8d6bce87f9ace377950dd0af3f2419b40cfe4d9be6
    source_path: concepts/personal-agent-benchmark-pack.md
    workflow: 16
---

Le pack de référence pour agents personnels est un petit ensemble de scénarios d’assurance qualité adossé à un dépôt, destiné aux workflows
locaux d’assistant personnel. Il ne s’agit pas d’un benchmark générique de modèles et
il ne nécessite aucun nouvel exécuteur : il réutilise la pile d’assurance qualité privée ([vue d’ensemble de l’assurance qualité](/fr/concepts/qa-e2e-automation)),
le [canal d’assurance qualité](/fr/channels/qa-channel) synthétique et le catalogue YAML
`qa/scenarios` existant.

## Scénarios

Dix scénarios, définis dans `qa/scenarios/personal/*.yaml` :

| Identifiant du scénario                    | Vérifications                                                                                |
| ------------------------------------------ | -------------------------------------------------------------------------------------------- |
| `personal-reminder-roundtrip`              | Faux rappels personnels via une distribution Cron locale                                     |
| `personal-channel-thread-reply`            | Routage de faux messages privés et de réponses dans un fil via `qa-channel`                   |
| `personal-memory-preference-recall`        | Faux rappel de préférences depuis les fichiers de mémoire de l’espace de travail temporaire d’assurance qualité |
| `personal-redaction-no-secret-leak`        | Vérifications de non-répétition de faux secrets                                               |
| `personal-tool-safety-followthrough`       | Exécution sûre d’un outil adossé à une lecture après un bref échange de type approbation      |
| `personal-approval-denial-stop`            | Comportement d’arrêt après refus d’approbation pour une demande sensible de lecture locale    |
| `personal-task-followthrough-status`       | Rapport d’état des tâches étayé par des preuves, distinguant les états en attente, bloqué et terminé |
| `personal-share-safe-diagnostics-artifact` | Artefacts de diagnostic partageables en toute sécurité, conservant un état utile tout en omettant le contenu personnel brut |
| `personal-no-fake-progress`                | Affirmations d’achèvement étayées par des preuves, évitant de simuler une progression avant l’existence de preuves locales |
| `personal-failure-recovery`                | Récupération après échec signalant l’état partiel et maintenant clairement les limites des nouvelles tentatives |

Les métadonnées du pack lisibles par machine (liste des identifiants, titre, description) se trouvent dans
`extensions/qa-lab/src/scenario-packs.ts` sous le nom `QA_PERSONAL_AGENT_SCENARIO_IDS`.
Exécutez le pack avec `--pack personal-agent` :

```bash
OPENCLAW_ENABLE_PRIVATE_QA_CLI=1 pnpm openclaw qa suite \
  --provider-mode mock-openai \
  --pack personal-agent \
  --concurrency 1
```

`--pack` est cumulatif avec les options `--scenario` répétées. Les scénarios explicites sont exécutés
en premier, puis les scénarios du pack sont exécutés dans l’ordre de `QA_PERSONAL_AGENT_SCENARIO_IDS`,
après suppression des doublons.

Le pack cible `qa-channel` avec `mock-openai` ou une autre
voie de fournisseur d’assurance qualité locale. Ne l’orientez pas vers des services de discussion en direct ni vers de vrais comptes personnels.

## Modèle de confidentialité

Les scénarios utilisent uniquement de faux utilisateurs, de fausses préférences, de faux secrets et
l’espace de travail temporaire du Gateway d’assurance qualité créé par la suite. Ils ne doivent ni lire ni
écrire la mémoire, les sessions, les identifiants d’accès, les agents de lancement, les configurations globales
ou l’état en direct du Gateway de véritables utilisateurs d’OpenClaw.

Les artefacts restent dans le répertoire d’artefacts existant de la suite d’assurance qualité et sont traités
comme des résultats de test. Les vérifications de masquage utilisent de faux marqueurs afin que les échecs puissent être
inspectés et consignés en toute sécurité dans des tickets.

## Extension du pack

Ajoutez de nouveaux cas `.yaml` sous `qa/scenarios/personal/`, puis ajoutez l’identifiant du scénario
à `QA_PERSONAL_AGENT_SCENARIO_IDS`. Chaque cas doit rester petit, local, déterministe
dans `mock-openai` et centré sur un seul comportement d’assistant personnel.

Bons candidats pour la suite : vérifications de l’export de trajectoires expurgées, vérifications
des workflows locaux uniquement des Plugins.

Évitez d’ajouter un nouvel exécuteur, Plugin, dépendance, transport en direct ou modèle juge
tant que le catalogue de scénarios ne contient pas suffisamment de cas stables pour justifier cette surface.
