---
read_when:
    - Vous voulez que la promotion de la mémoire s’exécute automatiquement
    - Vous voulez comprendre ce que fait chaque phase de Dreaming
    - Vous voulez ajuster la consolidation sans polluer `MEMORY.md`
summary: Consolidation de la mémoire en arrière-plan avec des phases légères, profondes et REM ainsi qu’un Dream Diary
title: Dreaming
x-i18n:
    generated_at: "2026-04-23T07:02:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1a44c7568992e60d249d7e424a585318401f678767b9feb7d75c830b01de1cf6
    source_path: concepts/dreaming.md
    workflow: 15
---

# Dreaming

Dreaming est le système de consolidation de la mémoire en arrière-plan dans `memory-core`.
Il aide OpenClaw à déplacer les signaux forts de court terme vers une mémoire durable tout en
gardant le processus explicable et révisable.

Dreaming est **opt-in** et désactivé par défaut.

## Ce que Dreaming écrit

Dreaming conserve deux types de sortie :

- **État machine** dans `memory/.dreams/` (magasin de rappel, signaux de phase, points de contrôle d’ingestion, verrous).
- **Sortie lisible par humain** dans `DREAMS.md` (ou `dreams.md` existant) et dans des fichiers de rapport de phase facultatifs sous `memory/dreaming/<phase>/YYYY-MM-DD.md`.

La promotion à long terme continue d’écrire uniquement dans `MEMORY.md`.

## Modèle de phase

Dreaming utilise trois phases coopératives :

| Phase | Objectif                                  | Écriture durable   |
| ----- | ----------------------------------------- | ------------------ |
| Light | Trier et préparer le contenu récent de court terme | Non         |
| Deep  | Noter et promouvoir les candidats durables | Oui (`MEMORY.md`) |
| REM   | Réfléchir aux thèmes et aux idées récurrentes | Non            |

Ces phases sont des détails d’implémentation internes, et non des « modes »
distincts configurés par l’utilisateur.

### Phase Light

La phase Light ingère les signaux récents de mémoire quotidienne et les traces de rappel, les déduplique,
et prépare des lignes candidates.

- Lit l’état de rappel à court terme, les fichiers récents de mémoire quotidienne et les transcriptions de session expurgées lorsqu’elles sont disponibles.
- Écrit un bloc géré `## Light Sleep` lorsque le stockage inclut une sortie inline.
- Enregistre des signaux de renforcement pour le classement Deep ultérieur.
- N’écrit jamais dans `MEMORY.md`.

### Phase Deep

La phase Deep décide de ce qui devient de la mémoire à long terme.

- Classe les candidats à l’aide d’un score pondéré et de seuils de contrôle.
- Exige que `minScore`, `minRecallCount` et `minUniqueQueries` soient atteints.
- Réhydrate les extraits à partir des fichiers quotidiens actifs avant écriture, de sorte que les extraits obsolètes/supprimés soient ignorés.
- Ajoute les entrées promues à `MEMORY.md`.
- Écrit un résumé `## Deep Sleep` dans `DREAMS.md` et écrit éventuellement `memory/dreaming/deep/YYYY-MM-DD.md`.

### Phase REM

La phase REM extrait des motifs et des signaux réflexifs.

- Construit des résumés de thèmes et de réflexions à partir des traces récentes de court terme.
- Écrit un bloc géré `## REM Sleep` lorsque le stockage inclut une sortie inline.
- Enregistre des signaux de renforcement REM utilisés par le classement Deep.
- N’écrit jamais dans `MEMORY.md`.

## Ingestion des transcriptions de session

Dreaming peut ingérer des transcriptions de session expurgées dans le corpus Dreaming. Lorsque
des transcriptions sont disponibles, elles sont injectées dans la phase Light en parallèle des
signaux de mémoire quotidienne et des traces de rappel. Le contenu personnel et sensible est expurgé
avant ingestion.

## Dream Diary

Dreaming conserve aussi un **Dream Diary** narratif dans `DREAMS.md`.
Après que chaque phase a accumulé suffisamment de matière, `memory-core` exécute au mieux un tour de
sous-agent en arrière-plan (à l’aide du modèle runtime par défaut) et ajoute une courte entrée de journal.

Ce journal est destiné à la lecture humaine dans l’interface Dreams, et non à servir de source de promotion.
Les artefacts de journal/rapport générés par Dreaming sont exclus de la
promotion à court terme. Seuls les extraits de mémoire ancrés dans les faits peuvent être promus dans
`MEMORY.md`.

Il existe aussi une voie de remplissage rétroactif historique ancrée dans les faits pour les travaux de révision et de récupération :

- `memory rem-harness --path ... --grounded` prévisualise une sortie de journal ancrée dans les faits à partir de notes historiques `YYYY-MM-DD.md`.
- `memory rem-backfill --path ...` écrit des entrées de journal ancrées dans les faits et réversibles dans `DREAMS.md`.
- `memory rem-backfill --path ... --stage-short-term` prépare des candidats durables ancrés dans les faits dans le même magasin de preuves à court terme que la phase Deep normale utilise déjà.
- `memory rem-backfill --rollback` et `--rollback-short-term` suppriment ces artefacts de remplissage rétroactif préparés sans toucher aux entrées de journal ordinaires ni au rappel actif normal à court terme.

La Control UI expose le même flux de remplissage/réinitialisation du journal afin que vous puissiez inspecter
les résultats dans la scène Dreams avant de décider si les candidats ancrés dans les faits
méritent une promotion. La scène affiche aussi une voie ancrée distincte afin que vous puissiez voir
quelles entrées de court terme préparées proviennent d’une relecture historique, quels éléments promus ont été guidés par cet ancrage, et effacer uniquement les entrées préparées ancrées sans
toucher à l’état ordinaire actif de court terme.

## Signaux de classement Deep

Le classement Deep utilise six signaux de base pondérés plus le renforcement des phases :

| Signal              | Poids | Description                                       |
| ------------------- | ----- | ------------------------------------------------- |
| Fréquence           | 0.24  | Nombre de signaux de court terme accumulés par l’entrée |
| Pertinence          | 0.30  | Qualité moyenne de récupération pour l’entrée     |
| Diversité des requêtes | 0.15 | Contextes distincts de requête/jour qui l’ont fait remonter |
| Récence             | 0.15  | Score de fraîcheur avec décroissance temporelle   |
| Consolidation       | 0.10  | Force de récurrence sur plusieurs jours           |
| Richesse conceptuelle | 0.06 | Densité de balises de concept à partir de l’extrait/du chemin |

Les occurrences des phases Light et REM ajoutent un petit bonus à décroissance de récence depuis
`memory/.dreams/phase-signals.json`.

## Planification

Lorsqu’il est activé, `memory-core` gère automatiquement une tâche Cron pour un balayage complet de Dreaming. Chaque balayage exécute les phases dans l’ordre : light -> REM -> deep.

Comportement de cadence par défaut :

| Paramètre            | Par défaut |
| -------------------- | ---------- |
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

## Flux CLI

Utilisez la promotion CLI pour prévisualiser ou appliquer manuellement :

```bash
openclaw memory promote
openclaw memory promote --apply
openclaw memory promote --limit 5
openclaw memory status --deep
```

La commande manuelle `memory promote` utilise les seuils de phase Deep par défaut, sauf remplacement
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

| Clé         | Par défaut |
| ----------- | ---------- |
| `enabled`   | `false`    |
| `frequency` | `0 3 * * *` |

La politique des phases, les seuils et le comportement de stockage sont des détails
d’implémentation internes (non exposés à l’utilisateur).

Consultez [Référence de configuration Memory](/fr/reference/memory-config#dreaming)
pour la liste complète des clés.

## Interface Dreams

Lorsqu’il est activé, l’onglet **Dreams** du Gateway affiche :

- l’état actuel d’activation de Dreaming
- le statut au niveau des phases et la présence d’un balayage géré
- les comptes de court terme, ancrés, de signaux et promus aujourd’hui
- l’horaire de la prochaine exécution planifiée
- une voie de scène ancrée distincte pour les entrées préparées issues d’une relecture historique
- un lecteur extensible de Dream Diary alimenté par `doctor.memory.dreamDiary`

## Dépannage

### Dreaming ne s’exécute jamais (le statut affiche blocked)

La tâche Cron gérée de Dreaming s’appuie sur le Heartbeat de l’agent par défaut. Si Heartbeat ne se déclenche pas pour cet agent, la tâche Cron met en file un événement système que personne ne consomme et Dreaming ne s’exécute donc pas en silence. `openclaw memory status` comme `/dreaming status` signaleront `blocked` dans ce cas et nommeront l’agent dont Heartbeat constitue le blocage.

Deux causes fréquentes :

- Un autre agent déclare un bloc `heartbeat:` explicite. Lorsqu’une entrée de `agents.list` possède son propre bloc `heartbeat`, seuls ces agents ont un Heartbeat — les valeurs par défaut ne s’appliquent plus à tous, donc l’agent par défaut peut devenir silencieux. Déplacez les paramètres Heartbeat vers `agents.defaults.heartbeat`, ou ajoutez un bloc `heartbeat` explicite sur l’agent par défaut. Consultez [Portée et priorité](/fr/gateway/heartbeat#scope-and-precedence).
- `heartbeat.every` vaut `0`, est vide ou n’est pas analysable. La tâche Cron n’a aucun intervalle sur lequel se planifier, donc Heartbeat est effectivement désactivé. Définissez `every` sur une durée positive telle que `30m`. Consultez [Valeurs par défaut](/fr/gateway/heartbeat#defaults).

## Liens connexes

- [Heartbeat](/fr/gateway/heartbeat)
- [Memory](/fr/concepts/memory)
- [Memory Search](/fr/concepts/memory-search)
- [CLI memory](/fr/cli/memory)
- [Référence de configuration Memory](/fr/reference/memory-config)
