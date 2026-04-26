---
read_when:
    - Vous souhaitez que la promotion de la mémoire s’exécute automatiquement
    - Vous souhaitez comprendre le rôle de chaque phase de Dreaming
    - Vous souhaitez ajuster la consolidation sans polluer `MEMORY.md`
sidebarTitle: Dreaming
summary: Consolidation de la mémoire en arrière-plan avec des phases légère, profonde et REM, plus un Dream Diary
title: Dreaming
x-i18n:
    generated_at: "2026-04-26T11:26:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: cba9593c5f697d49dbb20a3c908bf43ad37989f8cb029443b44523f2acab0e1d
    source_path: concepts/dreaming.md
    workflow: 15
---

Dreaming est le système de consolidation de mémoire en arrière-plan dans `memory-core`. Il aide OpenClaw à déplacer les signaux forts de court terme vers une mémoire durable tout en gardant le processus explicable et vérifiable.

<Note>
Dreaming est **optionnel** et désactivé par défaut.
</Note>

## Ce que Dreaming écrit

Dreaming conserve deux types de sorties :

- **État machine** dans `memory/.dreams/` (magasin de rappel, signaux de phase, points de contrôle d’ingestion, verrous).
- **Sortie lisible par un humain** dans `DREAMS.md` (ou `dreams.md` existant) et des fichiers de rapport de phase facultatifs sous `memory/dreaming/<phase>/YYYY-MM-DD.md`.

La promotion à long terme continue d’écrire uniquement dans `MEMORY.md`.

## Modèle de phase

Dreaming utilise trois phases coopératives :

| Phase | Objectif                                  | Écriture durable  |
| ----- | ----------------------------------------- | ----------------- |
| Light | Trier et préparer le matériel récent de court terme | Non               |
| Deep  | Évaluer et promouvoir les candidats durables | Oui (`MEMORY.md`) |
| REM   | Réfléchir aux thèmes et aux idées récurrentes | Non               |

Ces phases sont des détails d’implémentation internes, pas des « modes » séparés configurés par l’utilisateur.

<AccordionGroup>
  <Accordion title="Phase Light">
    La phase Light ingère les signaux récents de mémoire quotidienne et les traces de rappel, les déduplique et prépare des lignes candidates.

    - Lit l’état de rappel à court terme, les fichiers récents de mémoire quotidienne et les transcriptions de session expurgées lorsqu’elles sont disponibles.
    - Écrit un bloc géré `## Light Sleep` lorsque le stockage inclut une sortie intégrée.
    - Enregistre des signaux de renforcement pour un classement deep ultérieur.
    - N’écrit jamais dans `MEMORY.md`.

  </Accordion>
  <Accordion title="Phase Deep">
    La phase Deep décide ce qui devient de la mémoire à long terme.

    - Classe les candidats à l’aide d’un score pondéré et de seuils de validation.
    - Exige que `minScore`, `minRecallCount` et `minUniqueQueries` soient satisfaits.
    - Réhydrate les extraits depuis les fichiers quotidiens live avant écriture, de sorte que les extraits obsolètes/supprimés soient ignorés.
    - Ajoute les entrées promues à `MEMORY.md`.
    - Écrit un résumé `## Deep Sleep` dans `DREAMS.md` et écrit éventuellement `memory/dreaming/deep/YYYY-MM-DD.md`.

  </Accordion>
  <Accordion title="Phase REM">
    La phase REM extrait des motifs et des signaux réflexifs.

    - Construit des résumés de thèmes et de réflexion à partir des traces récentes de court terme.
    - Écrit un bloc géré `## REM Sleep` lorsque le stockage inclut une sortie intégrée.
    - Enregistre des signaux de renforcement REM utilisés par le classement deep.
    - N’écrit jamais dans `MEMORY.md`.

  </Accordion>
</AccordionGroup>

## Ingestion des transcriptions de session

Dreaming peut ingérer des transcriptions de session expurgées dans le corpus de Dreaming. Lorsque des transcriptions sont disponibles, elles sont injectées dans la phase light avec les signaux de mémoire quotidienne et les traces de rappel. Le contenu personnel et sensible est expurgé avant ingestion.

## Dream Diary

Dreaming conserve aussi un **Dream Diary** narratif dans `DREAMS.md`. Après qu’assez de matière a été accumulée pour chaque phase, `memory-core` exécute au mieux un tour de sous-agent en arrière-plan (en utilisant le modèle d’exécution par défaut) et ajoute une courte entrée de journal.

<Note>
Ce journal est destiné à la lecture humaine dans l’interface Dreams, pas à servir de source de promotion. Les artefacts de journal/rapport générés par Dreaming sont exclus de la promotion à court terme. Seuls les extraits de mémoire fondés sont éligibles à une promotion vers `MEMORY.md`.
</Note>

Il existe aussi une voie de remplissage historique fondée pour les tâches de revue et de récupération :

<AccordionGroup>
  <Accordion title="Commandes de backfill">
    - `memory rem-harness --path ... --grounded` prévisualise une sortie de journal fondée à partir de notes historiques `YYYY-MM-DD.md`.
    - `memory rem-backfill --path ...` écrit des entrées de journal fondées et réversibles dans `DREAMS.md`.
    - `memory rem-backfill --path ... --stage-short-term` prépare des candidats durables fondés dans le même magasin de preuves à court terme que celui déjà utilisé par la phase deep normale.
    - `memory rem-backfill --rollback` et `--rollback-short-term` suppriment ces artefacts de backfill préparés sans toucher aux entrées de journal ordinaires ni au rappel live à court terme.
  </Accordion>
</AccordionGroup>

L’interface Control expose le même flux de backfill/réinitialisation du journal pour que vous puissiez inspecter les résultats dans la scène Dreams avant de décider si les candidats fondés méritent une promotion. La scène affiche aussi une voie fondée distincte afin que vous puissiez voir quelles entrées préparées de court terme proviennent d’une relecture historique, quels éléments promus ont été pilotés par le fondé, et effacer uniquement les entrées préparées fondées sans toucher à l’état ordinaire live de court terme.

## Signaux de classement Deep

Le classement deep utilise six signaux de base pondérés plus le renforcement de phase :

| Signal              | Poids | Description                                       |
| ------------------- | ----- | ------------------------------------------------- |
| Fréquence           | 0.24  | Nombre de signaux de court terme accumulés par l’entrée |
| Pertinence          | 0.30  | Qualité moyenne de récupération pour l’entrée     |
| Diversité des requêtes | 0.15 | Contextes distincts de requête/jour qui l’ont fait remonter |
| Récence             | 0.15  | Score de fraîcheur décroissant dans le temps      |
| Consolidation       | 0.10  | Force de récurrence sur plusieurs jours           |
| Richesse conceptuelle | 0.06 | Densité de balises de concept à partir de l’extrait/du chemin |

Les occurrences des phases Light et REM ajoutent un léger bonus décroissant selon la récence depuis `memory/.dreams/phase-signals.json`.

## Planification

Lorsqu’il est activé, `memory-core` gère automatiquement une tâche Cron pour un balayage complet de Dreaming. Chaque balayage exécute les phases dans l’ordre : light → REM → deep.

Comportement de cadence par défaut :

| Paramètre            | Par défaut |
| -------------------- | ---------- |
| `dreaming.frequency` | `0 3 * * *` |

## Démarrage rapide

<Tabs>
  <Tab title="Activer Dreaming">
    ```json
    {
      "plugins": {
        "entries": {
          "memory-core": {
            "config": {
              "dreaming": {
                "enabled": true
              }
            }
          }
        }
      }
    }
    ```
  </Tab>
  <Tab title="Cadence de balayage personnalisée">
    ```json
    {
      "plugins": {
        "entries": {
          "memory-core": {
            "config": {
              "dreaming": {
                "enabled": true,
                "timezone": "America/Los_Angeles",
                "frequency": "0 */6 * * *"
              }
            }
          }
        }
      }
    }
    ```
  </Tab>
</Tabs>

## Commande slash

```
/dreaming status
/dreaming on
/dreaming off
/dreaming help
```

## Workflow CLI

<Tabs>
  <Tab title="Prévisualisation / application de promotion">
    ```bash
    openclaw memory promote
    openclaw memory promote --apply
    openclaw memory promote --limit 5
    openclaw memory status --deep
    ```

    La commande manuelle `memory promote` utilise par défaut les seuils de la phase deep, sauf remplacement par des indicateurs CLI.

  </Tab>
  <Tab title="Expliquer la promotion">
    Expliquer pourquoi un candidat spécifique serait ou ne serait pas promu :

    ```bash
    openclaw memory promote-explain "router vlan"
    openclaw memory promote-explain "router vlan" --json
    ```

  </Tab>
  <Tab title="Prévisualisation REM harness">
    Prévisualisez les réflexions REM, les vérités candidates et la sortie de promotion deep sans rien écrire :

    ```bash
    openclaw memory rem-harness
    openclaw memory rem-harness --json
    ```

  </Tab>
</Tabs>

## Valeurs par défaut clés

Tous les paramètres se trouvent sous `plugins.entries.memory-core.config.dreaming`.

<ParamField path="enabled" type="boolean" default="false">
  Activer ou désactiver le balayage Dreaming.
</ParamField>
<ParamField path="frequency" type="string" default="0 3 * * *">
  Cadence Cron pour le balayage complet de Dreaming.
</ParamField>

<Note>
La politique de phase, les seuils et le comportement de stockage sont des détails d’implémentation internes (pas une configuration destinée à l’utilisateur). Voir [Référence de configuration Memory](/fr/reference/memory-config#dreaming) pour la liste complète des clés.
</Note>

## Interface Dreams

Lorsqu’il est activé, l’onglet **Dreams** de la Gateway affiche :

- l’état actuel d’activation de Dreaming
- l’état au niveau des phases et la présence d’un balayage géré
- le nombre d’éléments de court terme, fondés, de signaux et promus aujourd’hui
- l’heure de la prochaine exécution planifiée
- une voie de scène fondée distincte pour les entrées préparées issues d’une relecture historique
- un lecteur extensible de Dream Diary adossé à `doctor.memory.dreamDiary`

## Lié

- [Memory](/fr/concepts/memory)
- [CLI Memory](/fr/cli/memory)
- [Référence de configuration Memory](/fr/reference/memory-config)
- [Recherche Memory](/fr/concepts/memory-search)
