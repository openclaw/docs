---
read_when:
    - Vous souhaitez que la promotion de mémoire s’exécute automatiquement
    - Vous voulez comprendre ce que fait chaque phase de Dreaming
    - Vous souhaitez ajuster la consolidation sans polluer MEMORY.md
sidebarTitle: Dreaming
summary: Consolidation de la mémoire en arrière-plan avec des phases légère, profonde et de sommeil paradoxal, ainsi qu’un journal des rêves
title: Dreaming
x-i18n:
    generated_at: "2026-05-02T20:44:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 23057bfeaaac1cc6b2bf2ee78928c8fdd820c817e461cc0b77f7c1e40ac14c22
    source_path: concepts/dreaming.md
    workflow: 16
---

Dreaming est le système de consolidation de la mémoire en arrière-plan dans `memory-core`. Il aide OpenClaw à déplacer les signaux forts à court terme vers une mémoire durable tout en gardant le processus explicable et révisable.

<Note>
Dreaming est **optionnel** et désactivé par défaut.
</Note>

## Ce que Dreaming écrit

Dreaming conserve deux types de sortie :

- **État machine** dans `memory/.dreams/` (magasin de rappel, signaux de phase, points de contrôle d’ingestion, verrous).
- **Sortie lisible par l’humain** dans `DREAMS.md` (ou le fichier `dreams.md` existant) et fichiers optionnels de rapport de phase sous `memory/dreaming/<phase>/YYYY-MM-DD.md`.

La promotion à long terme écrit toujours uniquement dans `MEMORY.md`.

## Modèle de phase

Dreaming utilise trois phases coopératives :

| Phase   | Objectif                                           | Écriture durable |
| ------- | -------------------------------------------------- | ---------------- |
| Légère  | Trier et préparer le contenu récent à court terme  | Non              |
| Profonde | Évaluer et promouvoir les candidats durables      | Oui (`MEMORY.md`) |
| REM     | Réfléchir aux thèmes et idées récurrentes          | Non              |

Ces phases sont des détails d’implémentation internes, pas des « modes » configurés séparément par l’utilisateur.

<AccordionGroup>
  <Accordion title="Phase légère">
    La phase légère ingère les signaux récents de mémoire quotidienne et les traces de rappel, les déduplique, puis prépare les lignes candidates.

    - Lit l’état de rappel à court terme, les fichiers récents de mémoire quotidienne et les transcriptions de session expurgées lorsqu’elles sont disponibles.
    - Écrit un bloc `## Light Sleep` géré lorsque le stockage inclut une sortie en ligne.
    - Enregistre des signaux de renforcement pour le classement profond ultérieur.
    - N’écrit jamais dans `MEMORY.md`.

  </Accordion>
  <Accordion title="Phase profonde">
    La phase profonde décide de ce qui devient une mémoire à long terme.

    - Classe les candidats avec une notation pondérée et des seuils de validation.
    - Exige que `minScore`, `minRecallCount` et `minUniqueQueries` soient satisfaits.
    - Réhydrate les extraits depuis les fichiers quotidiens actifs avant l’écriture, afin d’ignorer les extraits obsolètes ou supprimés.
    - Ajoute les entrées promues à `MEMORY.md`.
    - Écrit un résumé `## Deep Sleep` dans `DREAMS.md` et écrit éventuellement `memory/dreaming/deep/YYYY-MM-DD.md`.

  </Accordion>
  <Accordion title="Phase REM">
    La phase REM extrait les motifs et les signaux réflexifs.

    - Produit des résumés de thèmes et de réflexions à partir des traces récentes à court terme.
    - Écrit un bloc `## REM Sleep` géré lorsque le stockage inclut une sortie en ligne.
    - Enregistre les signaux de renforcement REM utilisés par le classement profond.
    - N’écrit jamais dans `MEMORY.md`.

  </Accordion>
</AccordionGroup>

## Ingestion des transcriptions de session

Dreaming peut ingérer des transcriptions de session expurgées dans le corpus de Dreaming. Lorsque des transcriptions sont disponibles, elles sont transmises à la phase légère avec les signaux de mémoire quotidienne et les traces de rappel. Le contenu personnel et sensible est expurgé avant l’ingestion.

## Journal des rêves

Dreaming conserve aussi un **journal des rêves** narratif dans `DREAMS.md`. Une fois que chaque phase dispose de suffisamment de contenu, `memory-core` lance au mieux un tour de sous-agent en arrière-plan et ajoute une courte entrée de journal. Il utilise le modèle d’exécution par défaut sauf si `dreaming.model` est configuré. Si le modèle configuré n’est pas disponible, le journal des rêves réessaie une fois avec le modèle par défaut de la session.

<Note>
Ce journal est destiné à la lecture humaine dans l’interface Rêves, pas à servir de source de promotion. Les artefacts de journal/rapport générés par Dreaming sont exclus de la promotion à court terme. Seuls les extraits de mémoire ancrés dans des preuves sont éligibles à une promotion dans `MEMORY.md`.
</Note>

Il existe aussi une voie de remplissage historique ancrée pour les travaux de révision et de récupération :

<AccordionGroup>
  <Accordion title="Commandes de remplissage">
    - `memory rem-harness --path ... --grounded` prévisualise une sortie de journal ancrée à partir de notes historiques `YYYY-MM-DD.md`.
    - `memory rem-backfill --path ...` écrit des entrées de journal ancrées et réversibles dans `DREAMS.md`.
    - `memory rem-backfill --path ... --stage-short-term` prépare des candidats durables ancrés dans le même magasin de preuves à court terme que la phase profonde normale utilise déjà.
    - `memory rem-backfill --rollback` et `--rollback-short-term` suppriment ces artefacts de remplissage préparés sans toucher aux entrées ordinaires du journal ni au rappel à court terme actif.

  </Accordion>
</AccordionGroup>

L’interface de contrôle expose le même flux de remplissage/réinitialisation du journal afin que vous puissiez inspecter les résultats dans la scène Rêves avant de décider si les candidats ancrés méritent une promotion. La scène affiche aussi une voie ancrée distincte afin que vous puissiez voir quelles entrées à court terme préparées viennent d’une relecture historique, quels éléments promus ont été menés par des éléments ancrés, et effacer uniquement les entrées préparées exclusivement ancrées sans toucher à l’état ordinaire actif à court terme.

## Signaux de classement profond

Le classement profond utilise six signaux de base pondérés, plus le renforcement de phase :

| Signal               | Poids | Description                                              |
| -------------------- | ----- | -------------------------------------------------------- |
| Fréquence            | 0.24  | Nombre de signaux à court terme accumulés par l’entrée   |
| Pertinence           | 0.30  | Qualité moyenne de récupération pour l’entrée            |
| Diversité des requêtes | 0.15 | Contextes distincts de requête/jour qui l’ont fait ressortir |
| Récence              | 0.15  | Score de fraîcheur avec décroissance temporelle          |
| Consolidation        | 0.10  | Force de récurrence sur plusieurs jours                  |
| Richesse conceptuelle | 0.06 | Densité de tags conceptuels à partir de l’extrait/chemin |

Les occurrences des phases légère et REM ajoutent un petit bonus avec décroissance de récence depuis `memory/.dreams/phase-signals.json`.

## Planification

Lorsqu’il est activé, `memory-core` gère automatiquement une tâche Cron pour un balayage complet de Dreaming. Chaque balayage exécute les phases dans l’ordre : légère → REM → profonde.

Le balayage inclut l’espace de travail d’exécution principal et tous les espaces de travail d’agents configurés, dédupliqués par chemin, afin que la distribution vers les espaces de travail des sous-agents n’exclue pas le fichier `DREAMS.md` et l’état de mémoire de l’agent principal.

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

## Flux de travail CLI

<Tabs>
  <Tab title="Prévisualisation / application de la promotion">
    ```bash
    openclaw memory promote
    openclaw memory promote --apply
    openclaw memory promote --limit 5
    openclaw memory status --deep
    ```

    La commande manuelle `memory promote` utilise par défaut les seuils de phase profonde, sauf s’ils sont remplacés par des options CLI.

  </Tab>
  <Tab title="Expliquer la promotion">
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
  Cadence Cron pour le balayage complet de Dreaming.
</ParamField>
<ParamField path="model" type="string">
  Remplacement optionnel du modèle de sous-agent du journal des rêves. Utilisez une valeur canonique `provider/model` lorsque vous définissez aussi une liste d’autorisation `allowedModels` pour le sous-agent.
</ParamField>

<Warning>
`dreaming.model` nécessite `plugins.entries.memory-core.subagent.allowModelOverride: true`. Pour le restreindre, définissez aussi `plugins.entries.memory-core.subagent.allowedModels`. Les échecs de confiance ou de liste d’autorisation restent visibles au lieu de revenir silencieusement en arrière ; la nouvelle tentative couvre uniquement les erreurs de modèle indisponible.
</Warning>

<Note>
La politique de phase, les seuils et le comportement de stockage sont des détails d’implémentation internes (pas une configuration exposée à l’utilisateur). Consultez la [référence de configuration de la mémoire](/fr/reference/memory-config#dreaming) pour la liste complète des clés.
</Note>

## Interface Rêves

Lorsqu’il est activé, l’onglet **Rêves** du Gateway affiche :

- l’état actuel d’activation de Dreaming
- l’état au niveau des phases et la présence du balayage géré
- les décomptes à court terme, ancrés, de signaux et promus aujourd’hui
- le moment de la prochaine exécution planifiée
- une voie de scène ancrée distincte pour les entrées de relecture historique préparées
- un lecteur extensible du journal des rêves alimenté par `doctor.memory.dreamDiary`

## Connexe

- [Mémoire](/fr/concepts/memory)
- [CLI de mémoire](/fr/cli/memory)
- [Référence de configuration de la mémoire](/fr/reference/memory-config)
- [Recherche de mémoire](/fr/concepts/memory-search)
