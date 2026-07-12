---
read_when:
    - Vous souhaitez que la promotion de la mémoire s’exécute automatiquement
    - Vous souhaitez comprendre le rôle de chaque phase de Dreaming
    - Vous souhaitez ajuster la consolidation sans polluer MEMORY.md
sidebarTitle: Dreaming
summary: Consolidation de la mémoire en arrière-plan avec des phases légère, profonde et REM, ainsi qu’un journal des rêves
title: Dreaming
x-i18n:
    generated_at: "2026-07-12T15:14:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 501ab42cfdfa0216c308896aa8c1719b06b49d64a62afdb004e097102a376eac
    source_path: concepts/dreaming.md
    workflow: 16
---

Dreaming est le système de consolidation de la mémoire en arrière-plan de `memory-core`. Il transfère les signaux forts à court terme vers la mémoire durable, tout en maintenant le processus explicable et vérifiable.

<Note>
Dreaming est **facultatif** et désactivé par défaut.
</Note>

## Ce que Dreaming écrit

- **État de la machine** dans `memory/.dreams/` (stockage de rappel, signaux de phase, points de contrôle d’ingestion, verrous).
- **Sortie lisible par l’utilisateur** dans `DREAMS.md` (ou un fichier `dreams.md` existant) et fichiers facultatifs de rapport de phase sous `memory/dreaming/<phase>/YYYY-MM-DD.md`.

La promotion vers la mémoire à long terme écrit toujours uniquement dans `MEMORY.md`.

## Modèle de phases

Dreaming exécute trois phases coopératives par balayage, dans l’ordre : légère -> REM -> profonde. Il s’agit de phases d’implémentation internes, et non de modes distincts configurés par l’utilisateur.

| Phase     | Objectif                                                   | Écriture persistante |
| --------- | ---------------------------------------------------------- | -------------------- |
| Légère    | Trier et préparer les éléments récents à court terme       | Non                  |
| REM       | Réfléchir aux thèmes et aux idées récurrentes              | Non                  |
| Profonde  | Évaluer et promouvoir les candidats à conserver durablement | Oui (`MEMORY.md`)    |

<AccordionGroup>
  <Accordion title="Phase légère">
    - Lit l’état récent du rappel à court terme, les fichiers de mémoire quotidiens et, lorsqu’elles sont disponibles, les transcriptions de sessions expurgées.
    - Déduplique les signaux et prépare les lignes candidates.
    - Écrit un bloc `## Light Sleep` géré lorsque le stockage inclut une sortie intégrée.
    - Enregistre les signaux de renforcement pour le classement profond ultérieur.
    - N’écrit jamais dans `MEMORY.md`.

  </Accordion>
  <Accordion title="Phase REM">
    - Génère des synthèses thématiques et réflexives à partir des traces récentes à court terme.
    - Écrit un bloc `## REM Sleep` géré lorsque le stockage inclut une sortie intégrée.
    - Enregistre les signaux de renforcement REM utilisés par le classement profond.
    - N’écrit jamais dans `MEMORY.md`.

  </Accordion>
  <Accordion title="Phase profonde">
    - Classe les candidats à l’aide d’une notation pondérée et de seuils (`minScore`, `minRecallCount` et `minUniqueQueries` doivent tous être satisfaits).
    - Recharge les extraits depuis les fichiers quotidiens actifs avant l’écriture, afin d’ignorer les extraits obsolètes ou supprimés.
    - Ajoute les entrées promues à `MEMORY.md`.
    - Écrit une synthèse `## Deep Sleep` dans `DREAMS.md` et, facultativement, dans `memory/dreaming/deep/YYYY-MM-DD.md`.

  </Accordion>
</AccordionGroup>

## Ingestion des transcriptions de sessions

Dreaming peut ingérer des transcriptions de session expurgées dans le corpus de Dreaming. Lorsqu’elles sont disponibles, les transcriptions alimentent la phase légère aux côtés des signaux de mémoire quotidiens et des traces de rappel. Le contenu personnel et sensible est expurgé avant l’ingestion.

## Journal des rêves

Dreaming conserve un **journal des rêves** narratif dans `DREAMS.md`. Une fois que chaque phase dispose de suffisamment de matière, `memory-core` exécute en arrière-plan, dans la mesure du possible, un tour de sous-agent et ajoute une courte entrée au journal, en utilisant le modèle d’exécution par défaut sauf si `dreaming.model` est configuré. Si le modèle configuré n’est pas disponible, l’exécution du journal réessaie une fois avec le modèle par défaut de la session ; les échecs liés à la confiance ou à la liste d’autorisation ne font pas l’objet d’une nouvelle tentative et restent visibles dans les journaux au lieu de déclencher silencieusement le recours à une entrée de journal générique.

<Note>
Le journal est destiné à être lu par des personnes dans l’interface utilisateur Dreams, et non à servir de source de promotion. Les artefacts de journal et de rapport sont exclus de la promotion à court terme ; seuls les extraits de mémoire fondés sur des données factuelles peuvent être promus dans `MEMORY.md`.
</Note>

Il existe également un circuit de remplissage rétroactif historique fondé sur des données factuelles pour les tâches de révision et de récupération :

<AccordionGroup>
  <Accordion title="Commandes de remplissage rétroactif">
    - `memory rem-harness --path ... --grounded` prévisualise la sortie fondée sur des données factuelles du journal à partir des notes historiques `YYYY-MM-DD.md`.
    - `memory rem-backfill --path ...` écrit des entrées de journal réversibles et fondées sur des données factuelles dans `DREAMS.md`.
    - `memory rem-backfill --path ... --stage-short-term` place les candidats durables fondés sur des données factuelles dans le même magasin de preuves à court terme que celui utilisé par la phase profonde normale.
    - `memory rem-backfill --rollback` et `--rollback-short-term` suppriment ces artefacts de remplissage rétroactif mis en attente sans toucher aux entrées de journal ordinaires ni au rappel actif à court terme.

  </Accordion>
</AccordionGroup>

L’interface utilisateur Control propose le même flux de remplissage rétroactif et de réinitialisation du journal dans l’onglet Memory de l’agent (page Agents), afin que vous puissiez examiner les résultats dans la scène de rêve avant de décider si les candidats fondés sur des données factuelles méritent une promotion. Un circuit distinct Scene fondé sur des données factuelles indique quelles entrées à court terme mises en attente proviennent d’une relecture historique et quels éléments promus ont été principalement étayés par des données factuelles ; il vous permet également d’effacer uniquement les entrées mises en attente exclusivement fondées sur des données factuelles sans toucher à l’état actif à court terme.

## Signaux de classement profond

Le classement profond utilise six signaux de base pondérés, auxquels s’ajoute le renforcement de phase :

| Signal                | Poids | Description                                                           |
| --------------------- | ----- | --------------------------------------------------------------------- |
| Pertinence            | 0.30  | Qualité moyenne de récupération de l’entrée                           |
| Fréquence             | 0.24  | Nombre de signaux à court terme accumulés par l’entrée                 |
| Diversité des requêtes | 0.15 | Contextes distincts de requête/jour ayant fait apparaître l’entrée    |
| Récence               | 0.15  | Score de fraîcheur diminuant avec le temps                            |
| Consolidation         | 0.10  | Intensité de la récurrence sur plusieurs jours                        |
| Richesse conceptuelle | 0.06  | Densité des balises conceptuelles provenant de l’extrait ou du chemin |

Les occurrences des phases légère et REM ajoutent une légère bonification de récence qui diminue avec le temps à partir de `memory/.dreams/phase-signals.json`.

Les résultats des essais fantômes peuvent se superposer au score de base en tant que signal de révision avant toute écriture durable : un essai utile accorde au candidat une légère bonification plafonnée, un essai neutre maintient son report et un essai préjudiciable le marque comme rejeté pour cette passe de notation. Ce signal est réservé au rapport : il peut modifier l’ordre des candidats ou les métadonnées de révision, mais n’écrit jamais dans `MEMORY.md` et ne promeut jamais un candidat à lui seul.

### Couverture des rapports d’essais fantômes d’assurance qualité

QA Lab inclut un scénario qui génère uniquement un rapport afin d’explorer comment un futur essai fantôme de Dreaming pourrait examiner une mémoire candidate avant sa promotion : un agent compare une réponse de référence à une réponse pouvant utiliser la mémoire candidate, puis rédige un rapport local comportant un verdict, une justification et des indicateurs de risque. Cette couverture est limitée à l’assurance qualité : elle vérifie que l’artefact de rapport reste distinct de `MEMORY.md` et que l’agent n’affirme jamais que la candidate a été promue. Elle n’ajoute aucun comportement d’essai fantôme en production et ne modifie pas le moteur de promotion de la phase approfondie.

L’exécuteur d’essais fantômes de `memory-core` conserve le même contrat de génération de rapport uniquement pour les chemins de code nécessitant un artefact stable. Il accepte la candidate, le prompt d’essai, le résultat de référence, le résultat avec la candidate, le verdict, la justification, les indicateurs de risque et les références des preuves, puis rédige un rapport contenant `promotion action: report-only`. Les verdicts favorables correspondent à une recommandation `promote`, les verdicts neutres à `defer` et les verdicts défavorables à `reject` ; aucun d’eux n’écrit dans `MEMORY.md` ni n’applique la promotion de la phase approfondie.

## Planification

Lorsqu’il est activé, `memory-core` gère automatiquement une tâche Cron pour un balayage Dreaming complet, dédupliquée entre l’espace de travail principal de l’environnement d’exécution et les espaces de travail d’agents configurés, afin que la multiplication des espaces de travail de sous-agents n’exclue pas le fichier `DREAMS.md` ni l’état de la mémoire de l’agent principal.

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
  <Tab title="Fréquence de balayage personnalisée">
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

## Commande oblique

```text
/dreaming status
/dreaming on
/dreaming off
/dreaming help
```

`/dreaming on` et `/dreaming off` nécessitent le statut de propriétaire pour les appelants d’un canal ou `operator.admin` pour les clients du Gateway. `/dreaming status` et `/dreaming help` sont en lecture seule.

## Flux de travail CLI

<Tabs>
  <Tab title="Aperçu de la promotion / application">
    ```bash
    openclaw memory promote
    openclaw memory promote --apply
    openclaw memory promote --limit 5
    openclaw memory status --deep
    ```

    La commande manuelle `memory promote` utilise par défaut les seuils de la phase approfondie, sauf s’ils sont remplacés par des options CLI.

  </Tab>
  <Tab title="Expliquer la promotion">
    Expliquez pourquoi une candidate précise serait ou ne serait pas promue :

    ```bash
    openclaw memory promote-explain "router vlan"
    openclaw memory promote-explain "router vlan" --json
    ```

  </Tab>
  <Tab title="Aperçu du banc d’essai REM">
    Prévisualisez les réflexions REM, les vérités candidates et le résultat de la promotion approfondie sans rien écrire :

    ```bash
    openclaw memory rem-harness
    openclaw memory rem-harness --json
    ```

  </Tab>
</Tabs>

## Principales valeurs par défaut

Tous les paramètres se trouvent sous `plugins.entries.memory-core.config.dreaming`.

<ParamField path="enabled" type="boolean" default="false">
  Active ou désactive le balayage Dreaming.
</ParamField>
<ParamField path="frequency" type="string" default="0 3 * * *">
  Fréquence Cron du balayage Dreaming complet.
</ParamField>
<ParamField path="model" type="string">
  Remplacement facultatif du modèle du sous-agent Dream Diary. Utilisez une valeur canonique `provider/model` lorsque vous définissez également une liste d’autorisation `allowedModels` pour le sous-agent.
</ParamField>
<ParamField path="phases.deep.maxPromotedSnippetTokens" type="number" default="160">
  Nombre maximal estimé de jetons conservés pour chaque extrait de rappel à court terme promu dans `MEMORY.md`. La provenance du classement reste visible.
</ParamField>

<Warning>
`dreaming.model` nécessite `plugins.entries.memory-core.subagent.allowModelOverride: true`. Pour le restreindre, définissez également `plugins.entries.memory-core.subagent.allowedModels`. La nouvelle tentative automatique ne couvre que les erreurs d’indisponibilité du modèle ; les échecs liés à la confiance ou à la liste d’autorisation restent visibles dans les journaux au lieu de déclencher silencieusement un mécanisme de repli.
</Warning>

<Note>
La plupart des politiques de phase, des seuils et des comportements de stockage sont des détails d’implémentation internes. Consultez la [référence de configuration de la mémoire](/fr/reference/memory-config#dreaming) pour obtenir la liste complète des clés.
</Note>

## Interface utilisateur Dreams

Lorsqu’il est activé, l’onglet **Dreams** du Gateway affiche :

- l’état d’activation actuel de Dreaming
- l’état de chaque phase et la présence du balayage géré
- les nombres d’éléments à court terme, ancrés, de signaux et promus aujourd’hui
- l’heure de la prochaine exécution planifiée
- une voie Scene ancrée distincte pour les entrées préparées de relecture historique
- un lecteur Dream Diary extensible reposant sur `doctor.memory.dreamDiary`

## Voir aussi

- [Mémoire](/fr/concepts/memory)
- [CLI de la mémoire](/fr/cli/memory)
- [Référence de configuration de la mémoire](/fr/reference/memory-config)
- [Recherche dans la mémoire](/fr/concepts/memory-search)
