---
read_when:
    - Vous voulez que la promotion de la mémoire s’exécute automatiquement
    - Vous voulez comprendre à quoi sert chaque phase de Dreaming
    - Vous voulez ajuster la consolidation sans polluer `MEMORY.md`
summary: Consolidation de la mémoire en arrière-plan avec des phases légères, profondes et REM, ainsi qu’un journal des rêves
title: Dreaming
x-i18n:
    generated_at: "2026-04-22T04:21:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 050e99bd2b3a18d7d2f02747e3010a7679515098369af5061d0a97b5703fc581
    source_path: concepts/dreaming.md
    workflow: 15
---

# Dreaming

Dreaming est le système de consolidation de la mémoire en arrière-plan dans `memory-core`.
Il aide OpenClaw à déplacer les signaux forts à court terme vers une mémoire durable tout en
gardant le processus explicable et vérifiable.

Dreaming est **opt-in** et désactivé par défaut.

## Ce que Dreaming écrit

Dreaming conserve deux types de sortie :

- **État machine** dans `memory/.dreams/` (magasin de rappel, signaux de phase, points de contrôle d’ingestion, verrous).
- **Sortie lisible par un humain** dans `DREAMS.md` (ou `dreams.md` existant) et des fichiers de rapport de phase optionnels sous `memory/dreaming/<phase>/YYYY-MM-DD.md`.

La promotion à long terme continue d’écrire uniquement dans `MEMORY.md`.

## Modèle de phase

Dreaming utilise trois phases coopératives :

| Phase | But                                       | Écriture durable   |
| ----- | ----------------------------------------- | ------------------ |
| Light | Trier et préparer le matériel récent à court terme | Non                |
| Deep  | Noter et promouvoir les candidats durables | Oui (`MEMORY.md`) |
| REM   | Réfléchir aux thèmes et aux idées récurrentes | Non                |

Ces phases sont des détails d’implémentation internes, pas des « modes »
séparés configurés par l’utilisateur.

### Phase Light

La phase Light ingère les signaux récents de mémoire quotidienne et les traces de rappel, les déduplique,
et prépare des lignes candidates.

- Lit depuis l’état de rappel à court terme, les fichiers récents de mémoire quotidienne et les transcriptions de session expurgées lorsque disponibles.
- Écrit un bloc géré `## Light Sleep` lorsque le stockage inclut une sortie inline.
- Enregistre des signaux de renforcement pour un classement deep ultérieur.
- N’écrit jamais dans `MEMORY.md`.

### Phase Deep

La phase Deep décide de ce qui devient de la mémoire à long terme.

- Classe les candidats en utilisant un score pondéré et des seuils.
- Exige que `minScore`, `minRecallCount` et `minUniqueQueries` soient atteints.
- Réhydrate les extraits à partir des fichiers quotidiens en direct avant écriture, de sorte que les extraits obsolètes/supprimés soient ignorés.
- Ajoute les entrées promues à `MEMORY.md`.
- Écrit un résumé `## Deep Sleep` dans `DREAMS.md` et écrit éventuellement `memory/dreaming/deep/YYYY-MM-DD.md`.

### Phase REM

La phase REM extrait des modèles et des signaux réflexifs.

- Construit des résumés de thèmes et de réflexions à partir de traces récentes à court terme.
- Écrit un bloc géré `## REM Sleep` lorsque le stockage inclut une sortie inline.
- Enregistre des signaux de renforcement REM utilisés par le classement deep.
- N’écrit jamais dans `MEMORY.md`.

## Ingestion des transcriptions de session

Dreaming peut ingérer des transcriptions de session expurgées dans le corpus Dreaming. Lorsque
des transcriptions sont disponibles, elles sont injectées dans la phase Light en même temps que les
signaux de mémoire quotidienne et les traces de rappel. Le contenu personnel et sensible est expurgé
avant ingestion.

## Journal des rêves

Dreaming conserve également un **journal des rêves** narratif dans `DREAMS.md`.
Après que chaque phase dispose de suffisamment de matériel, `memory-core` exécute un tour de sous-agent en arrière-plan au mieux
(en utilisant le modèle d’exécution par défaut) et ajoute une courte entrée de journal.

Ce journal est destiné à la lecture humaine dans l’interface Dreams, pas à servir de source de promotion.
Les artefacts de journal/rapport générés par Dreaming sont exclus de la
promotion à court terme. Seuls les extraits de mémoire fondés sont admissibles à une promotion dans
`MEMORY.md`.

Il existe également une voie de réinjection historique fondée pour le travail de revue et de récupération :

- `memory rem-harness --path ... --grounded` prévisualise la sortie de journal fondée à partir de notes historiques `YYYY-MM-DD.md`.
- `memory rem-backfill --path ...` écrit des entrées de journal fondées réversibles dans `DREAMS.md`.
- `memory rem-backfill --path ... --stage-short-term` prépare des candidats durables fondés dans le même magasin de preuves à court terme que la phase Deep normale utilise déjà.
- `memory rem-backfill --rollback` et `--rollback-short-term` suppriment ces artefacts de réinjection préparés sans toucher aux entrées de journal ordinaires ni au rappel à court terme en direct.

L’interface Control expose le même flux de réinjection/réinitialisation du journal afin que vous puissiez inspecter
les résultats dans la scène Dreams avant de décider si les candidats fondés
méritent une promotion. La scène affiche également une voie fondée distincte afin que vous puissiez voir
quelles entrées préparées à court terme proviennent d’une relecture historique, quels éléments promus ont été guidés par des données fondées, et effacer uniquement les entrées préparées uniquement fondées sans
toucher à l’état ordinaire à court terme en direct.

## Signaux de classement Deep

Le classement Deep utilise six signaux de base pondérés plus le renforcement de phase :

| Signal              | Poids | Description                                       |
| ------------------- | ----- | ------------------------------------------------- |
| Fréquence           | 0.24  | Combien de signaux à court terme l’entrée a accumulés |
| Pertinence          | 0.30  | Qualité moyenne de récupération pour l’entrée     |
| Diversité des requêtes | 0.15 | Contextes distincts de requête/jour qui l’ont fait apparaître |
| Récence             | 0.15  | Score de fraîcheur décroissant dans le temps      |
| Consolidation       | 0.10  | Force de récurrence sur plusieurs jours           |
| Richesse conceptuelle | 0.06 | Densité des balises de concept à partir de l’extrait/chemin |

Les occurrences des phases Light et REM ajoutent un petit bonus décroissant avec la récence à partir de
`memory/.dreams/phase-signals.json`.

## Planification

Lorsqu’il est activé, `memory-core` gère automatiquement une tâche Cron pour un balayage Dreaming complet. Chaque balayage exécute les phases dans l’ordre : light -> REM -> deep.

Comportement de cadence par défaut :

| Paramètre            | Par défaut |
| -------------------- | ---------- |
| `dreaming.frequency` | `0 3 * * *` |

## Démarrage rapide

Activer Dreaming :

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

Activer Dreaming avec une cadence de balayage personnalisée :

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

Utilisez la promotion CLI pour prévisualiser ou appliquer manuellement :

```bash
openclaw memory promote
openclaw memory promote --apply
openclaw memory promote --limit 5
openclaw memory status --deep
```

Le `memory promote` manuel utilise par défaut les seuils de la phase Deep, sauf si ceux-ci sont remplacés
par des indicateurs CLI.

Expliquer pourquoi un candidat spécifique serait ou ne serait pas promu :

```bash
openclaw memory promote-explain "router vlan"
openclaw memory promote-explain "router vlan" --json
```

Prévisualiser les réflexions REM, les vérités candidates et la sortie de promotion Deep sans
rien écrire :

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

La politique de phase, les seuils et le comportement de stockage sont des détails d’implémentation
internes (pas une configuration exposée à l’utilisateur).

Voir [Référence de configuration de la mémoire](/fr/reference/memory-config#dreaming)
pour la liste complète des clés.

## Interface Dreams

Lorsqu’il est activé, l’onglet **Dreams** de la Gateway affiche :

- l’état actuel d’activation de Dreaming
- l’état au niveau des phases et la présence d’un balayage géré
- les comptes des éléments à court terme, fondés, des signaux et des promotions du jour
- le moment de la prochaine exécution planifiée
- une voie de scène fondée distincte pour les entrées préparées issues d’une relecture historique
- un lecteur de journal des rêves extensible alimenté par `doctor.memory.dreamDiary`

## Résolution des problèmes

### Dreaming ne s’exécute jamais (l’état affiche blocked)

Le Cron Dreaming géré repose sur le Heartbeat de l’agent par défaut. Si le Heartbeat ne se déclenche pas pour cet agent, le Cron met un événement système en file d’attente que personne ne consomme et Dreaming ne s’exécute donc pas en silence. `openclaw memory status` et `/dreaming status` signaleront tous deux `blocked` dans ce cas et nommeront l’agent dont le Heartbeat est le bloqueur.

Deux causes fréquentes :

- Un autre agent déclare un bloc `heartbeat:` explicite. Lorsqu’une entrée de `agents.list` possède son propre bloc `heartbeat`, seuls ces agents émettent un Heartbeat — les valeurs par défaut cessent de s’appliquer à tous les autres, de sorte que l’agent par défaut peut devenir silencieux. Déplacez les paramètres de Heartbeat vers `agents.defaults.heartbeat`, ou ajoutez un bloc `heartbeat` explicite sur l’agent par défaut. Voir [Portée et priorité](/fr/gateway/heartbeat#scope-and-precedence).
- `heartbeat.every` vaut `0`, est vide ou n’est pas analysable. Le Cron n’a aucun intervalle à partir duquel planifier, donc le Heartbeat est en pratique désactivé. Définissez `every` sur une durée positive telle que `30m`. Voir [Valeurs par défaut](/fr/gateway/heartbeat#defaults).

## Lié

- [Heartbeat](/fr/gateway/heartbeat)
- [Mémoire](/fr/concepts/memory)
- [Recherche de mémoire](/fr/concepts/memory-search)
- [CLI memory](/cli/memory)
- [Référence de configuration de la mémoire](/fr/reference/memory-config)
