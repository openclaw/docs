---
read_when:
    - Examen de la série de PR de parité GPT-5.4 / Codex
    - Maintenance de l’architecture agentique à six contrats derrière le programme de parité
summary: Comment examiner le programme de parité GPT-5.4 / Codex comme quatre unités de fusion
title: Notes de maintenance de la parité GPT-5.4 / Codex
x-i18n:
    generated_at: "2026-04-25T13:49:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 162ea68476880d4dbf9b8c3b9397a51a2732c3eb10ac52e421a9c9d90e04eec2
    source_path: help/gpt54-codex-agentic-parity-maintainers.md
    workflow: 15
---

Cette note explique comment examiner le programme de parité GPT-5.4 / Codex comme quatre unités de fusion sans perdre l’architecture originale à six contrats.

## Unités de fusion

### PR A : exécution strictement agentique

Possède :

- `executionContract`
- suivi dans le même tour en priorité GPT-5
- `update_plan` comme suivi de progression non terminal
- états bloqués explicites au lieu d’arrêts silencieux avec plan uniquement

Ne possède pas :

- classification des échecs auth/runtime
- véracité des permissions
- refonte du rejeu/de la continuation
- benchmarking de parité

### PR B : véracité du runtime

Possède :

- exactitude des scopes OAuth Codex
- classification typée des échecs fournisseur/runtime
- disponibilité véridique de `/elevated full` et raisons de blocage

Ne possède pas :

- normalisation du schéma des outils
- état de rejeu/liveness
- contrôle par benchmarking

### PR C : exactitude d’exécution

Possède :

- compatibilité des outils OpenAI/Codex possédés par le fournisseur
- gestion stricte de schéma sans paramètre
- exposition des rejeux invalides
- visibilité de l’état des tâches longues en pause, bloquées et abandonnées

Ne possède pas :

- continuation auto-élue
- comportement générique du dialecte Codex hors hooks fournisseur
- contrôle par benchmarking

### PR D : harnais de parité

Possède :

- premier ensemble de scénarios GPT-5.4 vs Opus 4.6
- documentation de parité
- rapport de parité et mécanique de contrôle de release

Ne possède pas :

- changements de comportement du runtime hors QA-lab
- simulation auth/proxy/DNS à l’intérieur du harnais

## Correspondance avec les six contrats d’origine

| Contrat d’origine                        | Unité de fusion |
| ---------------------------------------- | --------------- |
| Exactitude du transport/auth fournisseur | PR B            |
| Compatibilité contrat/schéma d’outil     | PR C            |
| Exécution dans le même tour              | PR A            |
| Véracité des permissions                 | PR B            |
| Exactitude rejeu/continuation/liveness   | PR C            |
| Contrôle benchmark/release               | PR D            |

## Ordre de revue

1. PR A
2. PR B
3. PR C
4. PR D

PR D est la couche de preuve. Elle ne doit pas être la raison d’un retard des PR de correction de runtime.

## Points à examiner

### PR A

- les exécutions GPT-5 agissent ou échouent en mode fermé au lieu de s’arrêter au commentaire
- `update_plan` ne ressemble plus à lui seul à un progrès
- le comportement reste centré sur GPT-5 et limité à embedded-Pi

### PR B

- les échecs auth/proxy/runtime cessent d’être écrasés dans une gestion générique « model failed »
- `/elevated full` n’est décrit comme disponible que lorsqu’il l’est réellement
- les raisons de blocage sont visibles à la fois pour le modèle et pour le runtime orienté utilisateur

### PR C

- l’enregistrement strict des outils OpenAI/Codex se comporte de manière prévisible
- les outils sans paramètre n’échouent pas aux vérifications strictes de schéma
- les résultats de rejeu et de Compaction préservent un état de liveness véridique

### PR D

- l’ensemble de scénarios est compréhensible et reproductible
- l’ensemble inclut une lane de sécurité de rejeu mutante, pas seulement des flux en lecture seule
- les rapports sont lisibles à la fois par les humains et l’automatisation
- les affirmations de parité sont étayées par des preuves, pas anecdotiques

Artefacts attendus de PR D :

- `qa-suite-report.md` / `qa-suite-summary.json` pour chaque exécution de modèle
- `qa-agentic-parity-report.md` avec comparaison agrégée et par scénario
- `qa-agentic-parity-summary.json` avec un verdict lisible par machine

## Contrôle de release

Ne revendiquez pas la parité GPT-5.4 ni une supériorité sur Opus 4.6 tant que :

- PR A, PR B et PR C ne sont pas fusionnées
- PR D n’exécute pas proprement le premier ensemble de parité
- les suites de régression de véracité du runtime restent vertes
- le rapport de parité ne montre aucun cas de faux succès ni de régression du comportement d’arrêt

```mermaid
flowchart LR
    A["PR A-C fusionnées"] --> B["Exécuter l’ensemble de parité GPT-5.4"]
    A --> C["Exécuter l’ensemble de parité Opus 4.6"]
    B --> D["qa-suite-summary.json"]
    C --> E["qa-suite-summary.json"]
    D --> F["qa parity-report"]
    E --> F
    F --> G["Rapport Markdown + verdict JSON"]
    G --> H{"Réussite ?"}
    H -- "yes" --> I["Affirmation de parité autorisée"]
    H -- "no" --> J["Conserver les corrections de runtime / la boucle de revue ouverte"]
```

Le harnais de parité n’est pas la seule source de preuve. Gardez cette séparation explicite lors de la revue :

- PR D possède la comparaison GPT-5.4 vs Opus 4.6 basée sur les scénarios
- les suites déterministes PR B possèdent toujours les preuves auth/proxy/DNS et de véracité d’accès complet

## Workflow rapide de fusion pour mainteneur

Utilisez ceci lorsque vous êtes prêt à intégrer une PR de parité et que vous voulez une séquence répétable et à faible risque.

1. Confirmez que le niveau de preuve est atteint avant la fusion :
   - symptôme reproductible ou test en échec
   - cause racine vérifiée dans le code modifié
   - correction dans le chemin concerné
   - test de régression ou note explicite de vérification manuelle
2. Triage/étiquetage avant fusion :
   - appliquez toute étiquette `r:*` de fermeture automatique lorsque la PR ne doit pas être intégrée
   - gardez les candidates à la fusion sans fils bloquants non résolus
3. Validez localement sur la surface modifiée :
   - `pnpm check:changed`
   - `pnpm test:changed` lorsque des tests ont changé ou que la confiance dans la correction dépend de la couverture de test
4. Intégrez avec le flux standard du mainteneur (processus `/landpr`), puis vérifiez :
   - comportement de fermeture automatique des issues liées
   - CI et état post-fusion sur `main`
5. Après intégration, recherchez les doublons parmi les PR/issues ouvertes liées et ne fermez qu’avec une référence canonique.

Si l’un des éléments du niveau de preuve manque, demandez des modifications au lieu de fusionner.

## Carte objectif → preuve

| Élément du contrôle de complétion        | Propriétaire principal | Artefact de revue                                                   |
| ---------------------------------------- | ---------------------- | ------------------------------------------------------------------- |
| Aucun blocage avec plan uniquement       | PR A                   | tests de runtime strictement agentique et `approval-turn-tool-followthrough` |
| Aucun faux progrès ni faux achèvement d’outil | PR A + PR D       | nombre de faux succès de parité plus détails de rapport au niveau scénario |
| Aucun faux conseil `/elevated full`      | PR B                   | suites déterministes de véracité du runtime                         |
| Les échecs de rejeu/liveness restent explicites | PR C + PR D     | suites lifecycle/replay plus `compaction-retry-mutating-tool`       |
| GPT-5.4 égale ou dépasse Opus 4.6        | PR D                   | `qa-agentic-parity-report.md` et `qa-agentic-parity-summary.json`   |

## Raccourci pour reviewer : avant vs après

| Problème visible par l’utilisateur avant                     | Signal de revue après                                                                    |
| ------------------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| GPT-5.4 s’arrêtait après la planification                    | PR A montre un comportement agir-ou-bloquer au lieu d’un achèvement par commentaire seul |
| L’usage des outils semblait fragile avec les schémas stricts OpenAI/Codex | PR C maintient un enregistrement d’outil et une invocation sans paramètre prévisibles |
| Les indications `/elevated full` étaient parfois trompeuses  | PR B lie les indications à la capacité réelle du runtime et aux raisons de blocage      |
| Les tâches longues pouvaient disparaître dans l’ambiguïté du rejeu/de la Compaction | PR C émet un état explicite paused, blocked, abandoned et replay-invalid |
| Les affirmations de parité étaient anecdotiques              | PR D produit un rapport plus un verdict JSON avec la même couverture de scénarios sur les deux modèles |

## Lié

- [Parité agentique GPT-5.4 / Codex](/fr/help/gpt54-codex-agentic-parity)
