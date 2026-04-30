---
read_when:
    - Vous souhaitez que la promotion de la mémoire s’exécute automatiquement
    - Vous souhaitez comprendre ce que fait chaque phase de Dreaming
    - Vous souhaitez ajuster la consolidation sans polluer MEMORY.md
sidebarTitle: Dreaming
summary: Consolidation de la mémoire en arrière-plan avec des phases de sommeil léger, profond et paradoxal, ainsi qu’un journal des rêves
title: Dreaming
x-i18n:
    generated_at: "2026-04-30T07:21:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 85c323c073fc786069835aad25ee68781af49bb031e63b9601674461f385cc2a
    source_path: concepts/dreaming.md
    workflow: 16
---

Dreaming est le système de consolidation de la mémoire en arrière-plan dans `memory-core`. Il aide OpenClaw à déplacer les signaux forts à court terme vers une mémoire durable tout en gardant le processus explicable et vérifiable.

<Note>
Dreaming est **opt-in** et désactivé par défaut.
</Note>

## Ce que Dreaming écrit

Dreaming conserve deux types de sortie :

- **État machine** dans `memory/.dreams/` (magasin de rappel, signaux de phase, points de contrôle d’ingestion, verrous).
- **Sortie lisible par l’humain** dans `DREAMS.md` (ou le fichier `dreams.md` existant) et fichiers de rapport de phase facultatifs sous `memory/dreaming/<phase>/YYYY-MM-DD.md`.

La promotion à long terme écrit toujours uniquement dans `MEMORY.md`.

## Modèle de phases

Dreaming utilise trois phases coopératives :

| Phase | Objectif                                  | Écriture durable  |
| ----- | ----------------------------------------- | ----------------- |
| Light | Trier et préparer le contenu récent à court terme | Non               |
| Deep  | Évaluer et promouvoir les candidats durables | Oui (`MEMORY.md`) |
| REM   | Réfléchir aux thèmes et aux idées récurrentes | Non               |

Ces phases sont des détails d’implémentation internes, pas des « modes » distincts configurés par l’utilisateur.

<AccordionGroup>
  <Accordion title="Phase Light">
    La phase Light ingère les signaux de mémoire quotidiens récents et les traces de rappel, les déduplique, puis prépare des lignes candidates.

    - Lit l’état de rappel à court terme, les fichiers de mémoire quotidiens récents et les transcriptions de session expurgées lorsqu’elles sont disponibles.
    - Écrit un bloc `## Light Sleep` géré lorsque le stockage inclut une sortie en ligne.
    - Enregistre les signaux de renforcement pour le classement deep ultérieur.
    - N’écrit jamais dans `MEMORY.md`.

  </Accordion>
  <Accordion title="Phase Deep">
    La phase Deep décide de ce qui devient de la mémoire à long terme.

    - Classe les candidats au moyen d’un score pondéré et de seuils de validation.
    - Exige que `minScore`, `minRecallCount` et `minUniqueQueries` soient satisfaits.
    - Réhydrate les extraits depuis les fichiers quotidiens en direct avant l’écriture, afin d’ignorer les extraits obsolètes ou supprimés.
    - Ajoute les entrées promues à `MEMORY.md`.
    - Écrit un résumé `## Deep Sleep` dans `DREAMS.md` et écrit facultativement `memory/dreaming/deep/YYYY-MM-DD.md`.

  </Accordion>
  <Accordion title="Phase REM">
    La phase REM extrait les motifs et les signaux réflexifs.

    - Construit des résumés de thèmes et de réflexions à partir des traces récentes à court terme.
    - Écrit un bloc `## REM Sleep` géré lorsque le stockage inclut une sortie en ligne.
    - Enregistre les signaux de renforcement REM utilisés par le classement deep.
    - N’écrit jamais dans `MEMORY.md`.

  </Accordion>
</AccordionGroup>

## Ingestion des transcriptions de session

Dreaming peut ingérer des transcriptions de session expurgées dans le corpus de Dreaming. Lorsque des transcriptions sont disponibles, elles sont fournies à la phase Light avec les signaux de mémoire quotidiens et les traces de rappel. Le contenu personnel et sensible est expurgé avant l’ingestion.

## Journal des rêves

Dreaming conserve aussi un **Journal des rêves** narratif dans `DREAMS.md`. Après que chaque phase dispose d’assez de contenu, `memory-core` lance un tour de subagent en arrière-plan, au mieux, et ajoute une courte entrée de journal. Il utilise le modèle d’exécution par défaut, sauf si `dreaming.model` est configuré. Si le modèle configuré est indisponible, le Journal des rêves réessaie une fois avec le modèle par défaut de la session.

<Note>
Ce journal est destiné à la lecture humaine dans l’interface Dreams, pas à servir de source de promotion. Les artefacts de journal/rapport générés par Dreaming sont exclus de la promotion à court terme. Seuls les extraits de mémoire ancrés dans des éléments probants peuvent être promus dans `MEMORY.md`.
</Note>

Il existe aussi une voie de remplissage historique ancrée pour les travaux de revue et de récupération :

<AccordionGroup>
  <Accordion title="Commandes de remplissage">
    - `memory rem-harness --path ... --grounded` prévisualise une sortie de journal ancrée à partir de notes historiques `YYYY-MM-DD.md`.
    - `memory rem-backfill --path ...` écrit des entrées de journal ancrées et réversibles dans `DREAMS.md`.
    - `memory rem-backfill --path ... --stage-short-term` prépare des candidats durables ancrés dans le même magasin de preuves à court terme que la phase Deep normale utilise déjà.
    - `memory rem-backfill --rollback` et `--rollback-short-term` suppriment ces artefacts de remplissage préparés sans toucher aux entrées de journal ordinaires ni au rappel à court terme en direct.

  </Accordion>
</AccordionGroup>

L’interface Control expose le même flux de remplissage/réinitialisation du journal afin que vous puissiez inspecter les résultats dans la scène Dreams avant de décider si les candidats ancrés méritent une promotion. La scène affiche aussi une voie ancrée distincte, afin que vous puissiez voir quelles entrées à court terme préparées proviennent d’une relecture historique, quels éléments promus ont été menés par des éléments ancrés, et effacer uniquement les entrées préparées uniquement ancrées sans toucher à l’état ordinaire à court terme en direct.

## Signaux de classement deep

Le classement deep utilise six signaux de base pondérés plus le renforcement de phase :

| Signal              | Pondération | Description                                       |
| ------------------- | ------ | ------------------------------------------------- |
| Fréquence           | 0.24   | Nombre de signaux à court terme accumulés par l’entrée |
| Pertinence          | 0.30   | Qualité moyenne de récupération pour l’entrée     |
| Diversité des requêtes | 0.15   | Contextes distincts de requête/jour qui l’ont fait remonter |
| Récence             | 0.15   | Score de fraîcheur avec décroissance temporelle   |
| Consolidation       | 0.10   | Force de récurrence sur plusieurs jours           |
| Richesse conceptuelle | 0.06   | Densité des étiquettes de concept provenant de l’extrait/chemin |

Les correspondances des phases Light et REM ajoutent un léger bonus avec décroissance de récence depuis `memory/.dreams/phase-signals.json`.

## Planification

Lorsqu’il est activé, `memory-core` gère automatiquement une tâche cron pour un balayage complet de Dreaming. Chaque balayage exécute les phases dans l’ordre : light → REM → deep.

Comportement de cadence par défaut :

| Paramètre            | Valeur par défaut |
| -------------------- | ------------- |
| `dreaming.frequency` | `0 3 * * *`   |
| `dreaming.model`     | modèle par défaut |

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

## Flux de travail CLI

<Tabs>
  <Tab title="Prévisualisation / application de la promotion">
    ```bash
    openclaw memory promote
    openclaw memory promote --apply
    openclaw memory promote --limit 5
    openclaw memory status --deep
    ```

    La commande manuelle `memory promote` utilise par défaut les seuils de la phase deep, sauf remplacement par des options CLI.

  </Tab>
  <Tab title="Expliquer la promotion">
    Explique pourquoi un candidat spécifique serait ou ne serait pas promu :

    ```bash
    openclaw memory promote-explain "router vlan"
    openclaw memory promote-explain "router vlan" --json
    ```

  </Tab>
  <Tab title="Prévisualisation du harnais REM">
    Prévisualise les réflexions REM, les vérités candidates et la sortie de promotion deep sans rien écrire :

    ```bash
    openclaw memory rem-harness
    openclaw memory rem-harness --json
    ```

  </Tab>
</Tabs>

## Valeurs par défaut clés

Tous les paramètres se trouvent sous `plugins.entries.memory-core.config.dreaming`.

<ParamField path="enabled" type="boolean" default="false">
  Active ou désactive le balayage Dreaming.
</ParamField>
<ParamField path="frequency" type="string" default="0 3 * * *">
  Cadence Cron du balayage Dreaming complet.
</ParamField>
<ParamField path="model" type="string">
  Remplacement facultatif du modèle de subagent du Journal des rêves. Utilisez une valeur canonique `provider/model` lorsque vous définissez aussi une liste d’autorisation `allowedModels` de subagent.
</ParamField>

<Warning>
`dreaming.model` nécessite `plugins.entries.memory-core.subagent.allowModelOverride: true`. Pour le restreindre, définissez aussi `plugins.entries.memory-core.subagent.allowedModels`. Les échecs de confiance ou de liste d’autorisation restent visibles au lieu de revenir silencieusement à une valeur de secours ; la nouvelle tentative couvre uniquement les erreurs de modèle indisponible.
</Warning>

<Note>
La politique de phase, les seuils et le comportement de stockage sont des détails d’implémentation internes (pas de la configuration destinée à l’utilisateur). Consultez la [référence de configuration de la mémoire](/fr/reference/memory-config#dreaming) pour la liste complète des clés.
</Note>

## Interface Dreams

Lorsqu’il est activé, l’onglet **Dreams** du Gateway affiche :

- l’état actuel d’activation de Dreaming
- l’état au niveau des phases et la présence du balayage géré
- les nombres d’éléments à court terme, ancrés, de signaux et promus aujourd’hui
- l’heure de la prochaine exécution planifiée
- une voie de scène ancrée distincte pour les entrées préparées issues de la relecture historique
- un lecteur extensible du Journal des rêves adossé à `doctor.memory.dreamDiary`

## Connexe

- [Mémoire](/fr/concepts/memory)
- [CLI de mémoire](/fr/cli/memory)
- [Référence de configuration de la mémoire](/fr/reference/memory-config)
- [Recherche en mémoire](/fr/concepts/memory-search)
