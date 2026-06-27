---
read_when:
    - Vous voulez que la promotion de la mémoire s’exécute automatiquement
    - Vous voulez comprendre ce que fait chaque phase de Dreaming
    - Vous voulez ajuster la consolidation sans polluer MEMORY.md
sidebarTitle: Dreaming
summary: Consolidation de la mémoire en arrière-plan avec phases légère, profonde et REM, plus un journal des rêves
title: Dreaming
x-i18n:
    generated_at: "2026-06-27T17:23:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 257e8095114e05f18e0ba7a6870765a6b88c80e1eedaccfa891faa231f68f01b
    source_path: concepts/dreaming.md
    workflow: 16
---

Dreaming est le système de consolidation de mémoire en arrière-plan dans `memory-core`. Il aide OpenClaw à déplacer les signaux forts à court terme vers une mémoire durable tout en gardant le processus explicable et révisable.

<Note>
Dreaming est **opt-in** et désactivé par défaut.
</Note>

## Ce que Dreaming écrit

Dreaming conserve deux types de sorties :

- **État machine** dans `memory/.dreams/` (stockage de rappel, signaux de phase, points de contrôle d’ingestion, verrous).
- **Sortie lisible par l’humain** dans `DREAMS.md` (ou le fichier `dreams.md` existant) et des fichiers facultatifs de rapport de phase sous `memory/dreaming/<phase>/YYYY-MM-DD.md`.

La promotion à long terme écrit toujours uniquement dans `MEMORY.md`.

## Modèle de phase

Dreaming utilise trois phases coopératives :

| Phase  | Objectif                                          | Écriture durable |
| ------ | ------------------------------------------------- | ---------------- |
| Light  | Trier et préparer le contenu récent à court terme | Non              |
| Deep   | Noter et promouvoir les candidats durables        | Oui (`MEMORY.md`) |
| REM    | Réfléchir aux thèmes et aux idées récurrentes     | Non              |

Ces phases sont des détails d’implémentation internes, pas des « modes » distincts configurés par l’utilisateur.

<AccordionGroup>
  <Accordion title="Light phase">
    La phase Light ingère les signaux récents de mémoire quotidienne et les traces de rappel, les déduplique et prépare les lignes candidates.

    - Lit l’état de rappel à court terme, les fichiers récents de mémoire quotidienne et les transcriptions de session expurgées lorsqu’elles sont disponibles.
    - Écrit un bloc géré `## Light Sleep` lorsque le stockage inclut une sortie en ligne.
    - Enregistre des signaux de renforcement pour le classement Deep ultérieur.
    - N’écrit jamais dans `MEMORY.md`.

  </Accordion>
  <Accordion title="Deep phase">
    La phase Deep décide ce qui devient une mémoire à long terme.

    - Classe les candidats à l’aide d’une notation pondérée et de seuils de passage.
    - Exige que `minScore`, `minRecallCount` et `minUniqueQueries` soient satisfaits.
    - Réhydrate les extraits depuis les fichiers quotidiens actifs avant l’écriture, afin d’ignorer les extraits obsolètes ou supprimés.
    - Ajoute les entrées promues à `MEMORY.md`.
    - Écrit un résumé `## Deep Sleep` dans `DREAMS.md` et écrit éventuellement `memory/dreaming/deep/YYYY-MM-DD.md`.

  </Accordion>
  <Accordion title="REM phase">
    La phase REM extrait des motifs et des signaux réflexifs.

    - Génère des résumés de thèmes et de réflexions à partir des traces récentes à court terme.
    - Écrit un bloc géré `## REM Sleep` lorsque le stockage inclut une sortie en ligne.
    - Enregistre les signaux de renforcement REM utilisés par le classement Deep.
    - N’écrit jamais dans `MEMORY.md`.

  </Accordion>
</AccordionGroup>

## Ingestion des transcriptions de session

Dreaming peut ingérer des transcriptions de session expurgées dans le corpus Dreaming. Lorsque des transcriptions sont disponibles, elles sont transmises à la phase Light avec les signaux de mémoire quotidienne et les traces de rappel. Le contenu personnel et sensible est expurgé avant l’ingestion.

## Journal de rêves

Dreaming conserve aussi un **journal de rêves** narratif dans `DREAMS.md`. Une fois que chaque phase dispose d’assez de contenu, `memory-core` exécute au mieux un tour de sous-agent en arrière-plan et ajoute une courte entrée de journal. Il utilise le modèle d’exécution par défaut sauf si `dreaming.model` est configuré. Si le modèle configuré est indisponible, le journal de rêves réessaie une fois avec le modèle par défaut de la session.

<Note>
Ce journal est destiné à la lecture humaine dans l’interface Dreams, pas à servir de source de promotion. Les artefacts de journal/rapport générés par Dreaming sont exclus de la promotion à court terme. Seuls les extraits de mémoire fondés peuvent être promus dans `MEMORY.md`.
</Note>

Il existe aussi un couloir de remplissage historique fondé pour le travail de révision et de récupération :

<AccordionGroup>
  <Accordion title="Backfill commands">
    - `memory rem-harness --path ... --grounded` prévisualise une sortie de journal fondée à partir de notes historiques `YYYY-MM-DD.md`.
    - `memory rem-backfill --path ...` écrit des entrées de journal fondées et réversibles dans `DREAMS.md`.
    - `memory rem-backfill --path ... --stage-short-term` prépare des candidats durables fondés dans le même stockage de preuves à court terme que la phase Deep normale utilise déjà.
    - `memory rem-backfill --rollback` et `--rollback-short-term` suppriment ces artefacts de remplissage préparés sans toucher aux entrées de journal ordinaires ni au rappel actif à court terme.

  </Accordion>
</AccordionGroup>

L’interface Control UI expose le même flux de remplissage/réinitialisation du journal afin que vous puissiez inspecter les résultats dans la scène Dreams avant de décider si les candidats fondés méritent une promotion. La scène affiche aussi un couloir fondé distinct pour montrer quelles entrées préparées à court terme proviennent d’une relecture historique, quels éléments promus ont été guidés par des données fondées, et pour effacer uniquement les entrées préparées exclusivement fondées sans toucher à l’état ordinaire actif à court terme.

## Signaux de classement Deep

Le classement Deep utilise six signaux de base pondérés, plus le renforcement de phase :

| Signal                | Poids | Description                                             |
| --------------------- | ----- | ------------------------------------------------------- |
| Fréquence             | 0.24  | Nombre de signaux à court terme accumulés par l’entrée  |
| Pertinence            | 0.30  | Qualité moyenne de récupération pour l’entrée           |
| Diversité des requêtes | 0.15 | Contextes distincts de requête/jour qui l’ont fait émerger |
| Récence               | 0.15  | Score de fraîcheur avec décroissance temporelle         |
| Consolidation         | 0.10  | Force de récurrence sur plusieurs jours                 |
| Richesse conceptuelle | 0.06  | Densité des tags conceptuels issue de l’extrait/chemin  |

Les occurrences des phases Light et REM ajoutent un petit boost avec décroissance de récence depuis `memory/.dreams/phase-signals.json`.

Les résultats d’essai fantôme peuvent être superposés à ce score de base comme
signal de révision avant toute écriture durable. Un essai utile donne au candidat
un petit boost borné, un essai neutre le maintient différé, et un essai nuisible
le marque comme rejeté pour cette passe de notation. Ce signal reste uniquement
un rapport : il peut modifier l’ordre des candidats ou les métadonnées de
révision, mais il n’écrit pas dans `MEMORY.md` et ne promeut pas le candidat à lui
seul.

## Couverture des rapports d’essai fantôme QA

QA Lab inclut un scénario uniquement destiné aux rapports pour explorer comment un
futur essai fantôme Dreaming pourrait réviser une mémoire candidate avant
promotion. Le scénario demande à un agent de comparer une réponse de référence à
une réponse pouvant utiliser la mémoire candidate, puis d’écrire un rapport local
avec un verdict, une raison et des indicateurs de risque.

Cette couverture est volontairement limitée à QA. Elle vérifie que l’artefact de
rapport reste séparé de `MEMORY.md` et que l’agent ne prétend pas que le candidat
a été promu. Elle n’ajoute pas de comportement d’essai fantôme en production et
ne modifie pas le moteur de promotion de la phase Deep.

Le lanceur d’essai fantôme de `memory-core` conserve le même contrat uniquement
destiné aux rapports pour les chemins de code qui ont besoin d’un artefact stable.
Il accepte le candidat, le prompt d’essai, le résultat de référence, le résultat
du candidat, le verdict, la raison, les indicateurs de risque et les références
de preuve, puis écrit un rapport avec `promotion action: report-only`. Les
verdicts utiles correspondent à une recommandation `promote`, les verdicts
neutres à `defer`, et les verdicts nuisibles à `reject` ; aucune de ces
recommandations n’écrit dans `MEMORY.md` ni n’applique la promotion de phase Deep.

## Planification

Lorsqu’il est activé, `memory-core` gère automatiquement une tâche cron unique pour un balayage Dreaming complet. Chaque balayage exécute les phases dans l’ordre : Light → REM → Deep.

Le balayage inclut l’espace de travail d’exécution principal et tous les espaces de travail d’agents configurés, dédupliqués par chemin, afin que la dispersion vers les espaces de travail de sous-agents n’exclue pas le `DREAMS.md` et l’état de mémoire de l’agent principal.

Comportement de cadence par défaut :

| Paramètre            | Par défaut      |
| -------------------- | --------------- |
| `dreaming.frequency` | `0 3 * * *`     |
| `dreaming.model`     | modèle par défaut |

## Démarrage rapide

<Tabs>
  <Tab title="Enable dreaming">
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
  <Tab title="Custom sweep cadence">
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
  <Tab title="Promotion preview / apply">
    ```bash
    openclaw memory promote
    openclaw memory promote --apply
    openclaw memory promote --limit 5
    openclaw memory status --deep
    ```

    La commande manuelle `memory promote` utilise par défaut les seuils de la phase Deep, sauf remplacement par des flags CLI.

  </Tab>
  <Tab title="Explain promotion">
    Expliquer pourquoi un candidat précis serait ou ne serait pas promu :

    ```bash
    openclaw memory promote-explain "router vlan"
    openclaw memory promote-explain "router vlan" --json
    ```

  </Tab>
  <Tab title="REM harness preview">
    Prévisualiser les réflexions REM, les vérités candidates et la sortie de promotion Deep sans rien écrire :

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
  Cadence Cron pour le balayage Dreaming complet.
</ParamField>
<ParamField path="model" type="string">
  Remplacement facultatif du modèle de sous-agent du journal de rêves. Utilisez une valeur canonique `provider/model` lorsque vous définissez aussi une allowlist `allowedModels` pour le sous-agent.
</ParamField>
<ParamField path="phases.deep.maxPromotedSnippetTokens" type="number" default="160">
  Nombre maximal estimé de tokens conservés depuis chaque extrait de rappel à court terme promu dans `MEMORY.md`. La provenance du classement reste visible.
</ParamField>

<Warning>
`dreaming.model` nécessite `plugins.entries.memory-core.subagent.allowModelOverride: true`. Pour le restreindre, définissez aussi `plugins.entries.memory-core.subagent.allowedModels`. Les échecs de confiance ou d’allowlist restent visibles au lieu de revenir silencieusement en arrière ; la nouvelle tentative couvre uniquement les erreurs de modèle indisponible.
</Warning>

<Note>
La plupart des politiques de phase, seuils et comportements de stockage sont des détails d’implémentation internes. Consultez la [référence de configuration de la mémoire](/fr/reference/memory-config#dreaming) pour la liste complète des clés.
</Note>

## Interface Dreams

Lorsqu’il est activé, l’onglet **Dreams** du Gateway affiche :

- l’état actuel d’activation de Dreaming
- l’état au niveau des phases et la présence du balayage géré
- les décomptes à court terme, fondés, de signaux et promus aujourd’hui
- le moment de la prochaine exécution planifiée
- un couloir de scène fondé distinct pour les entrées préparées de relecture historique
- un lecteur de journal de rêves extensible reposant sur `doctor.memory.dreamDiary`

## Dreaming ne s’exécute jamais : l’état indique bloqué

Si `openclaw memory status` signale `Dreaming status: blocked`, le cron géré existe, mais le Heartbeat de l’agent par défaut ne se déclenche pas. Vérifiez que le Heartbeat est activé pour l’agent par défaut et que sa cible n’est pas `none`, puis exécutez de nouveau `openclaw memory status --deep` après le prochain intervalle de Heartbeat.

## Liens associés

- [Mémoire](/fr/concepts/memory)
- [CLI de mémoire](/fr/cli/memory)
- [Référence de configuration de la mémoire](/fr/reference/memory-config)
- [Recherche de mémoire](/fr/concepts/memory-search)
