---
read_when:
    - Vous voulez que la promotion de la mémoire s’exécute automatiquement
    - Vous voulez comprendre ce que fait chaque phase de Dreaming
    - Vous voulez affiner la consolidation sans polluer MEMORY.md
sidebarTitle: Dreaming
summary: Consolidation de la mémoire en arrière-plan avec des phases légères, profondes et REM, plus un journal de rêves
title: Dreaming
x-i18n:
    generated_at: "2026-06-30T14:00:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1b636df63cdc5b60758f9600af695b3b6453122a03b0cc6fdc69d3c9259d1e61
    source_path: concepts/dreaming.md
    workflow: 16
---

Dreaming est le système de consolidation de mémoire en arrière-plan dans `memory-core`. Il aide OpenClaw à transférer les signaux forts à court terme vers une mémoire durable tout en gardant le processus explicable et vérifiable.

<Note>
Dreaming est **optionnel** et désactivé par défaut.
</Note>

## Ce que Dreaming écrit

Dreaming conserve deux types de sorties :

- **État machine** dans `memory/.dreams/` (magasin de rappel, signaux de phase, points de contrôle d’ingestion, verrous).
- **Sortie lisible par un humain** dans `DREAMS.md` (ou le fichier existant `dreams.md`) et fichiers facultatifs de rapport de phase sous `memory/dreaming/<phase>/YYYY-MM-DD.md`.

La promotion à long terme écrit toujours uniquement dans `MEMORY.md`.

## Modèle de phases

Dreaming utilise trois phases coopératives :

| Phase   | Objectif                                                  | Écriture durable |
| ------- | --------------------------------------------------------- | ---------------- |
| Légère  | Trier et préparer le contenu récent à court terme         | Non              |
| Profonde | Évaluer et promouvoir les candidats durables             | Oui (`MEMORY.md`) |
| REM     | Réfléchir aux thèmes et idées récurrentes                 | Non              |

Ces phases sont des détails d’implémentation internes, et non des « modes » distincts configurés par l’utilisateur.

<AccordionGroup>
  <Accordion title="Phase légère">
    La phase légère ingère les signaux récents de mémoire quotidienne et les traces de rappel, les déduplique, puis prépare les lignes candidates.

    - Lit depuis l’état de rappel à court terme, les fichiers récents de mémoire quotidienne et les transcriptions de session expurgées lorsqu’elles sont disponibles.
    - Écrit un bloc `## Light Sleep` géré lorsque le stockage inclut une sortie en ligne.
    - Enregistre les signaux de renforcement pour le classement profond ultérieur.
    - N’écrit jamais dans `MEMORY.md`.

  </Accordion>
  <Accordion title="Phase profonde">
    La phase profonde décide ce qui devient une mémoire à long terme.

    - Classe les candidats à l’aide d’un score pondéré et de seuils de validation.
    - Exige que `minScore`, `minRecallCount` et `minUniqueQueries` soient atteints.
    - Réhydrate les extraits depuis les fichiers quotidiens actifs avant l’écriture, afin d’ignorer les extraits obsolètes ou supprimés.
    - Ajoute les entrées promues à `MEMORY.md`.
    - Écrit un résumé `## Deep Sleep` dans `DREAMS.md` et, facultativement, écrit `memory/dreaming/deep/YYYY-MM-DD.md`.

  </Accordion>
  <Accordion title="Phase REM">
    La phase REM extrait des schémas et des signaux réflexifs.

    - Construit des résumés de thèmes et de réflexions à partir des traces récentes à court terme.
    - Écrit un bloc `## REM Sleep` géré lorsque le stockage inclut une sortie en ligne.
    - Enregistre les signaux de renforcement REM utilisés par le classement profond.
    - N’écrit jamais dans `MEMORY.md`.

  </Accordion>
</AccordionGroup>

## Ingestion des transcriptions de session

Dreaming peut ingérer des transcriptions de session expurgées dans le corpus de Dreaming. Lorsque des transcriptions sont disponibles, elles sont fournies à la phase légère avec les signaux de mémoire quotidienne et les traces de rappel. Le contenu personnel et sensible est expurgé avant l’ingestion.

## Journal des rêves

Dreaming conserve aussi un **Journal des rêves** narratif dans `DREAMS.md`. Une fois que chaque phase contient suffisamment de matière, `memory-core` exécute au mieux un tour de sous-agent en arrière-plan et ajoute une courte entrée de journal. Il utilise le modèle d’exécution par défaut, sauf si `dreaming.model` est configuré. Si le modèle configuré n’est pas disponible, le Journal des rêves réessaie une fois avec le modèle par défaut de la session.

<Note>
Ce journal est destiné à la lecture humaine dans l’interface Dreams, pas à servir de source de promotion. Les artefacts de journal ou de rapport générés par Dreaming sont exclus de la promotion à court terme. Seuls les extraits de mémoire ancrés sont éligibles à une promotion dans `MEMORY.md`.
</Note>

Il existe aussi une voie de remplissage historique ancrée pour les tâches de revue et de récupération :

<AccordionGroup>
  <Accordion title="Commandes de remplissage">
    - `memory rem-harness --path ... --grounded` prévisualise une sortie de journal ancrée depuis des notes historiques `YYYY-MM-DD.md`.
    - `memory rem-backfill --path ...` écrit des entrées de journal ancrées réversibles dans `DREAMS.md`.
    - `memory rem-backfill --path ... --stage-short-term` prépare des candidats durables ancrés dans le même magasin de preuves à court terme que la phase profonde normale utilise déjà.
    - `memory rem-backfill --rollback` et `--rollback-short-term` suppriment ces artefacts de remplissage préparés sans toucher aux entrées ordinaires du journal ni au rappel à court terme actif.

  </Accordion>
</AccordionGroup>

L’interface de contrôle expose le même flux de remplissage et de réinitialisation du journal afin que vous puissiez inspecter les résultats dans la scène Dreams avant de décider si les candidats ancrés méritent une promotion. La scène affiche aussi une voie ancrée distincte afin que vous puissiez voir quelles entrées préparées à court terme proviennent d’une relecture historique, quels éléments promus ont été guidés par des données ancrées, et effacer uniquement les entrées préparées exclusivement ancrées sans toucher à l’état ordinaire actif à court terme.

## Signaux de classement profond

Le classement profond utilise six signaux de base pondérés plus le renforcement de phase :

| Signal                 | Poids | Description                                                |
| ---------------------- | ----- | ---------------------------------------------------------- |
| Fréquence              | 0.24  | Nombre de signaux à court terme accumulés par l’entrée     |
| Pertinence             | 0.30  | Qualité moyenne de récupération pour l’entrée              |
| Diversité des requêtes | 0.15  | Contextes de requête/jour distincts qui l’ont fait ressortir |
| Récence                | 0.15  | Score de fraîcheur avec décroissance temporelle            |
| Consolidation          | 0.10  | Force de récurrence sur plusieurs jours                    |
| Richesse conceptuelle  | 0.06  | Densité de tags de concepts depuis l’extrait/le chemin     |

Les occurrences des phases légère et REM ajoutent un léger bonus avec décroissance de récence depuis `memory/.dreams/phase-signals.json`.

Les résultats d’essai fantôme peuvent être superposés à ce score de base comme
signal de revue avant toute écriture durable. Un essai utile donne au candidat
un petit bonus borné, un essai neutre le maintient différé, et un essai nuisible
le marque comme rejeté pour cette passe de scoring. Ce signal reste uniquement
informatif : il peut modifier l’ordre des candidats ou les métadonnées de revue,
mais il n’écrit pas dans `MEMORY.md` et ne promeut pas le candidat à lui seul.

## Couverture du rapport d’essai fantôme QA

QA Lab inclut un scénario uniquement informatif pour explorer comment un futur
essai fantôme de Dreaming pourrait examiner une mémoire candidate avant
promotion. Le scénario demande à un agent de comparer une réponse de référence
avec une réponse pouvant utiliser la mémoire candidate, puis d’écrire un rapport
local avec un verdict, une raison et des indicateurs de risque.

Cette couverture est volontairement limitée à la QA. Elle vérifie que l’artefact
de rapport reste séparé de `MEMORY.md` et que l’agent ne prétend pas que le
candidat a été promu. Elle n’ajoute pas de comportement d’essai fantôme en
production et ne modifie pas le moteur de promotion de la phase profonde.

Le runner d’essai fantôme de `memory-core` conserve ce même contrat uniquement
informatif pour les chemins de code qui ont besoin d’un artefact stable. Il
accepte le candidat, le prompt d’essai, le résultat de référence, le résultat du
candidat, le verdict, la raison, les indicateurs de risque et les références de
preuve, puis écrit un rapport avec `promotion action: report-only`. Les verdicts
utiles correspondent à une recommandation `promote`, les verdicts neutres à
`defer`, et les verdicts nuisibles à `reject` ; aucune de ces recommandations
n’écrit dans `MEMORY.md` ni n’applique la promotion de phase profonde.

## Planification

Lorsqu’il est activé, `memory-core` gère automatiquement une tâche cron pour un balayage complet de Dreaming. Chaque balayage exécute les phases dans l’ordre : légère → REM → profonde.

Le balayage inclut l’espace de travail d’exécution principal et tout espace de travail d’agent configuré, dédupliqués par chemin, afin que la dispersion vers les espaces de travail des sous-agents n’exclue pas le `DREAMS.md` ni l’état mémoire de l’agent principal.

Comportement de cadence par défaut :

| Paramètre            | Valeur par défaut |
| -------------------- | ----------------- |
| `dreaming.frequency` | `0 3 * * *`       |
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

`/dreaming on` et `/dreaming off` modifient la configuration à l’échelle du Gateway. Les appelants de canal
doivent être propriétaires, et les clients Gateway doivent disposer de `operator.admin`.
`/dreaming status` et `/dreaming help` restent en lecture seule.

## Flux CLI

<Tabs>
  <Tab title="Prévisualiser / appliquer une promotion">
    ```bash
    openclaw memory promote
    openclaw memory promote --apply
    openclaw memory promote --limit 5
    openclaw memory status --deep
    ```

    La commande manuelle `memory promote` utilise par défaut les seuils de phase profonde, sauf s’ils sont remplacés par des flags CLI.

  </Tab>
  <Tab title="Expliquer une promotion">
    Expliquer pourquoi un candidat précis serait ou ne serait pas promu :

    ```bash
    openclaw memory promote-explain "router vlan"
    openclaw memory promote-explain "router vlan" --json
    ```

  </Tab>
  <Tab title="Prévisualisation du harnais REM">
    Prévisualiser les réflexions REM, les vérités candidates et la sortie de promotion profonde sans rien écrire :

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
  Cadence Cron pour le balayage Dreaming complet.
</ParamField>
<ParamField path="model" type="string">
  Remplacement facultatif du modèle de sous-agent du Journal des rêves. Utilisez une valeur canonique `provider/model` lorsque vous définissez aussi une liste d’autorisation `allowedModels` pour le sous-agent.
</ParamField>
<ParamField path="phases.deep.maxPromotedSnippetTokens" type="number" default="160">
  Nombre maximal estimé de tokens conservés depuis chaque extrait de rappel à court terme promu dans `MEMORY.md`. La provenance du classement reste visible.
</ParamField>

<Warning>
`dreaming.model` nécessite `plugins.entries.memory-core.subagent.allowModelOverride: true`. Pour le restreindre, définissez aussi `plugins.entries.memory-core.subagent.allowedModels`. Les échecs de confiance ou de liste d’autorisation restent visibles au lieu de basculer silencieusement ; la nouvelle tentative ne couvre que les erreurs de modèle indisponible.
</Warning>

<Note>
La plupart des règles de phase, seuils et comportements de stockage sont des détails d’implémentation internes. Consultez la [référence de configuration de la mémoire](/fr/reference/memory-config#dreaming) pour la liste complète des clés.
</Note>

## Interface Dreams

Lorsqu’il est activé, l’onglet **Dreams** du Gateway affiche :

- l’état actuel d’activation de Dreaming
- le statut au niveau des phases et la présence d’un balayage géré
- les décomptes à court terme, ancrés, de signaux et promus aujourd’hui
- le moment de la prochaine exécution planifiée
- une voie de scène ancrée distincte pour les entrées de relecture historique préparées
- un lecteur extensible du Journal des rêves alimenté par `doctor.memory.dreamDiary`

## Dreaming ne s’exécute jamais : le statut indique bloqué

Si `openclaw memory status` signale `Dreaming status: blocked`, le cron géré existe, mais le Heartbeat de l’agent par défaut ne se déclenche pas. Vérifiez que le Heartbeat est activé pour l’agent par défaut et que sa cible n’est pas `none`, puis exécutez à nouveau `openclaw memory status --deep` après le prochain intervalle de Heartbeat.

## Connexe

- [Mémoire](/fr/concepts/memory)
- [CLI mémoire](/fr/cli/memory)
- [Référence de configuration de la mémoire](/fr/reference/memory-config)
- [Recherche mémoire](/fr/concepts/memory-search)
