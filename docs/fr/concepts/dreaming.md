---
read_when:
    - Vous voulez que la promotion de la mémoire s'exécute automatiquement
    - Vous voulez comprendre à quoi sert chaque phase de Dreaming
    - Vous voulez ajuster la consolidation sans polluer MEMORY.md
summary: Consolidation de la mémoire en arrière-plan avec phases légère, profonde et REM, plus un Journal des rêves
title: Dreaming (expérimental)
x-i18n:
    generated_at: "2026-04-09T01:27:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 26476eddb8260e1554098a6adbb069cf7f5e284cf2e09479c6d9d8f8b93280ef
    source_path: concepts/dreaming.md
    workflow: 15
---

# Dreaming (expérimental)

Dreaming est le système de consolidation de la mémoire en arrière-plan dans `memory-core`.
Il aide OpenClaw à déplacer des signaux forts de court terme vers une mémoire durable, tout en
gardant le processus explicable et vérifiable.

Dreaming est **optionnel** et désactivé par défaut.

## Ce que Dreaming écrit

Dreaming conserve deux types de sortie :

- **État machine** dans `memory/.dreams/` (magasin de rappel, signaux de phase, points de contrôle d'ingestion, verrous).
- **Sortie lisible par les humains** dans `DREAMS.md` (ou `dreams.md` existant) et fichiers de rapport de phase facultatifs sous `memory/dreaming/<phase>/YYYY-MM-DD.md`.

La promotion à long terme n'écrit toujours que dans `MEMORY.md`.

## Modèle de phase

Dreaming utilise trois phases coopératives :

| Phase | Objectif | Écriture durable |
| ----- | -------- | ---------------- |
| Light | Trier et préparer le matériel récent de court terme | Non |
| Deep  | Évaluer et promouvoir les candidats durables | Oui (`MEMORY.md`) |
| REM   | Réfléchir aux thèmes et aux idées récurrentes | Non |

Ces phases sont des détails d'implémentation internes, pas des « modes »
distincts configurés par l'utilisateur.

### Phase Light

La phase Light ingère les signaux récents de mémoire quotidienne et les traces de rappel, les déduplique
et prépare des lignes candidates.

- Lit l'état de rappel à court terme, les fichiers récents de mémoire quotidienne et les transcriptions de session expurgées lorsqu'elles sont disponibles.
- Écrit un bloc `## Light Sleep` géré lorsque le stockage inclut une sortie inline.
- Enregistre des signaux de renforcement pour le classement Deep ultérieur.
- N'écrit jamais dans `MEMORY.md`.

### Phase Deep

La phase Deep décide de ce qui devient une mémoire à long terme.

- Classe les candidats à l'aide d'un score pondéré et de seuils de validation.
- Exige que `minScore`, `minRecallCount` et `minUniqueQueries` soient atteints.
- Réhydrate les extraits depuis les fichiers quotidiens actifs avant l'écriture, afin que les extraits obsolètes ou supprimés soient ignorés.
- Ajoute les entrées promues à `MEMORY.md`.
- Écrit un résumé `## Deep Sleep` dans `DREAMS.md` et écrit éventuellement `memory/dreaming/deep/YYYY-MM-DD.md`.

### Phase REM

La phase REM extrait des motifs et des signaux réflexifs.

- Construit des résumés de thèmes et de réflexions à partir des traces récentes de court terme.
- Écrit un bloc `## REM Sleep` géré lorsque le stockage inclut une sortie inline.
- Enregistre des signaux de renforcement REM utilisés par le classement Deep.
- N'écrit jamais dans `MEMORY.md`.

## Ingestion des transcriptions de session

Dreaming peut ingérer des transcriptions de session expurgées dans le corpus de Dreaming. Lorsque
des transcriptions sont disponibles, elles sont intégrées à la phase Light avec les signaux
de mémoire quotidienne et les traces de rappel. Le contenu personnel et sensible est expurgé
avant l'ingestion.

## Journal des rêves

Dreaming conserve également un **Journal des rêves** narratif dans `DREAMS.md`.
Une fois que chaque phase dispose de suffisamment de matière, `memory-core` exécute un tour
de sous-agent en arrière-plan avec effort optimal (en utilisant le modèle d'exécution par défaut) et ajoute une courte entrée au journal.

Ce journal est destiné à la lecture humaine dans l'interface Dreams, pas à servir de source de promotion.

Il existe également une voie de remplissage historique fondée pour le travail de révision et de récupération :

- `memory rem-harness --path ... --grounded` prévisualise une sortie de journal fondée à partir de notes historiques `YYYY-MM-DD.md`.
- `memory rem-backfill --path ...` écrit des entrées de journal fondées réversibles dans `DREAMS.md`.
- `memory rem-backfill --path ... --stage-short-term` prépare des candidats durables fondés dans le même magasin de preuves à court terme que la phase Deep normale utilise déjà.
- `memory rem-backfill --rollback` et `--rollback-short-term` suppriment ces artefacts de remplissage préparés sans toucher aux entrées ordinaires du journal ni au rappel actif normal à court terme.

L'interface Control UI expose le même flux de remplissage/réinitialisation du journal afin que vous puissiez inspecter
les résultats dans la scène Dreams avant de décider si les candidats fondés
méritent une promotion. La scène affiche également une voie fondée distincte afin que vous puissiez voir
quelles entrées préparées à court terme proviennent d'une relecture historique, quels éléments promus
ont été guidés par le mode fondé, et effacer uniquement les entrées préparées fondées sans
toucher à l'état ordinaire actif de court terme.

## Signaux de classement Deep

Le classement Deep utilise six signaux de base pondérés plus le renforcement de phase :

| Signal | Poids | Description |
| ------------------- | ------ | ------------------------------------------------- |
| Fréquence | 0.24 | Nombre de signaux de court terme accumulés par l'entrée |
| Pertinence | 0.30 | Qualité moyenne de récupération pour l'entrée |
| Diversité des requêtes | 0.15 | Contextes distincts de requête/jour qui l'ont fait émerger |
| Récence | 0.15 | Score de fraîcheur atténué dans le temps |
| Consolidation | 0.10 | Force de récurrence sur plusieurs jours |
| Richesse conceptuelle | 0.06 | Densité des balises de concept depuis l'extrait/le chemin |

Les occurrences des phases Light et REM ajoutent un petit bonus atténué par la récence depuis
`memory/.dreams/phase-signals.json`.

## Planification

Lorsqu'il est activé, `memory-core` gère automatiquement une tâche cron pour un balayage
complet de Dreaming. Chaque balayage exécute les phases dans l'ordre : light -> REM -> deep.

Comportement de cadence par défaut :

| Paramètre | Par défaut |
| -------------------- | ----------- |
| `dreaming.frequency` | `0 3 * * *` |

## Démarrage rapide

Activer Dreaming :

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

Activer Dreaming avec une cadence de balayage personnalisée :

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

## Commande slash

```
/dreaming status
/dreaming on
/dreaming off
/dreaming help
```

## Flux de travail CLI

Utilisez la promotion CLI pour prévisualiser ou appliquer manuellement :

```bash
openclaw memory promote
openclaw memory promote --apply
openclaw memory promote --limit 5
openclaw memory status --deep
```

La commande manuelle `memory promote` utilise par défaut les seuils de la phase Deep, sauf remplacement
par des drapeaux CLI.

Expliquer pourquoi un candidat spécifique serait ou ne serait pas promu :

```bash
openclaw memory promote-explain "router vlan"
openclaw memory promote-explain "router vlan" --json
```

Prévisualiser les réflexions REM, les vérités candidates et la sortie de promotion Deep sans
rien écrire :

```bash
openclaw memory rem-harness
openclaw memory rem-harness --json
```

## Valeurs par défaut clés

Tous les paramètres se trouvent sous `plugins.entries.memory-core.config.dreaming`.

| Clé | Par défaut |
| ----------- | ----------- |
| `enabled`   | `false`     |
| `frequency` | `0 3 * * *` |

La politique de phase, les seuils et le comportement de stockage sont des détails
d'implémentation internes (pas une configuration destinée à l'utilisateur).

Consultez la [référence de configuration de la mémoire](/fr/reference/memory-config#dreaming-experimental)
pour la liste complète des clés.

## Interface Dreams

Lorsqu'il est activé, l'onglet **Dreams** de la passerelle affiche :

- l'état actuel d'activation de Dreaming
- l'état au niveau des phases et la présence du balayage géré
- les comptes de court terme, fondés, de signaux et des promotions du jour
- l'heure de la prochaine exécution planifiée
- une voie de scène fondée distincte pour les entrées préparées issues de la relecture historique
- un lecteur de Journal des rêves extensible alimenté par `doctor.memory.dreamDiary`

## Lié

- [Mémoire](/fr/concepts/memory)
- [Recherche dans la mémoire](/fr/concepts/memory-search)
- [CLI memory](/cli/memory)
- [Référence de configuration de la mémoire](/fr/reference/memory-config)
