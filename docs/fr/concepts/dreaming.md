---
read_when:
    - Vous souhaitez que la promotion de la mémoire s’exécute automatiquement
    - Vous souhaitez comprendre le rôle de chaque phase de dreaming
    - Vous souhaitez ajuster la consolidation sans polluer `MEMORY.md`
summary: Consolidation de la mémoire en arrière-plan avec des phases légères, profondes et REM, ainsi qu’un journal des rêves
title: Dreaming (expérimental)
x-i18n:
    generated_at: "2026-04-06T06:56:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 36c4b1e70801d662090dc8ce20608c2f141c23cd7ce53c54e3dcf332c801fd4e
    source_path: concepts/dreaming.md
    workflow: 15
---

# Dreaming (expérimental)

Dreaming est le système de consolidation de la mémoire en arrière-plan dans `memory-core`.
Il aide OpenClaw à déplacer des signaux forts de la mémoire à court terme vers une mémoire durable, tout en
gardant le processus explicable et vérifiable.

Dreaming est **optionnel** et désactivé par défaut.

## Ce que dreaming écrit

Dreaming conserve deux types de sortie :

- **État machine** dans `memory/.dreams/` (magasin de rappel, signaux de phase, points de contrôle d’ingestion, verrous).
- **Sortie lisible par les humains** dans `DREAMS.md` (ou `dreams.md` existant) et fichiers de rapport de phase facultatifs sous `memory/dreaming/<phase>/YYYY-MM-DD.md`.

La promotion à long terme continue d’écrire uniquement dans `MEMORY.md`.

## Modèle de phase

Dreaming utilise trois phases coopératives :

| Phase | Objectif | Écriture durable |
| ----- | -------- | ---------------- |
| Légère | Trier et préparer le matériel récent à court terme | Non |
| Profonde | Évaluer et promouvoir les candidats durables | Oui (`MEMORY.md`) |
| REM | Réfléchir aux thèmes et idées récurrentes | Non |

Ces phases sont des détails d’implémentation internes, et non des « modes »
séparés configurés par l’utilisateur.

### Phase légère

La phase légère ingère les signaux récents de mémoire quotidienne et les traces de rappel, les déduplique,
et prépare des lignes candidates.

- Lit l’état de rappel à court terme et les fichiers récents de mémoire quotidienne.
- Écrit un bloc géré `## Light Sleep` lorsque le stockage inclut une sortie intégrée.
- Enregistre des signaux de renforcement pour le classement profond ultérieur.
- N’écrit jamais dans `MEMORY.md`.

### Phase profonde

La phase profonde décide de ce qui devient une mémoire à long terme.

- Classe les candidats à l’aide d’un score pondéré et de seuils de validation.
- Exige le passage de `minScore`, `minRecallCount` et `minUniqueQueries`.
- Réhydrate les extraits à partir des fichiers quotidiens actifs avant l’écriture, afin d’ignorer les extraits obsolètes/supprimés.
- Ajoute les entrées promues à `MEMORY.md`.
- Écrit un résumé `## Deep Sleep` dans `DREAMS.md` et peut aussi écrire `memory/dreaming/deep/YYYY-MM-DD.md`.

### Phase REM

La phase REM extrait des motifs et des signaux réflexifs.

- Construit des résumés de thèmes et de réflexions à partir des traces récentes à court terme.
- Écrit un bloc géré `## REM Sleep` lorsque le stockage inclut une sortie intégrée.
- Enregistre des signaux de renforcement REM utilisés par le classement profond.
- N’écrit jamais dans `MEMORY.md`.

## Journal des rêves

Dreaming conserve également un **journal des rêves** narratif dans `DREAMS.md`.
Après que chaque phase a accumulé suffisamment de matière, `memory-core` exécute en arrière-plan,
dans la mesure du possible, un tour de sous-agent (en utilisant le modèle d’exécution par défaut) et ajoute une courte entrée de journal.

Ce journal est destiné à la lecture humaine dans l’interface Dreams, et non à servir de source de promotion.

## Signaux de classement profond

Le classement profond utilise six signaux de base pondérés, plus le renforcement de phase :

| Signal | Poids | Description |
| ------------------- | ------ | ------------------------------------------------- |
| Fréquence | 0.24 | Nombre de signaux à court terme accumulés par l’entrée |
| Pertinence | 0.30 | Qualité moyenne de récupération pour l’entrée |
| Diversité des requêtes | 0.15 | Contextes distincts de requête/jour qui l’ont fait émerger |
| Récence | 0.15 | Score de fraîcheur avec décroissance temporelle |
| Consolidation | 0.10 | Force de récurrence sur plusieurs jours |
| Richesse conceptuelle | 0.06 | Densité des tags de concept à partir de l’extrait/chemin |

Les occurrences dans les phases légère et REM ajoutent un faible bonus à décroissance temporelle depuis
`memory/.dreams/phase-signals.json`.

## Planification

Lorsqu’il est activé, `memory-core` gère automatiquement une tâche cron pour un balayage
complet de dreaming. Chaque balayage exécute les phases dans l’ordre : légère -> REM -> profonde.

Comportement de cadence par défaut :

| Paramètre | Par défaut |
| -------------------- | ----------- |
| `dreaming.frequency` | `0 3 * * *` |

## Démarrage rapide

Activer dreaming :

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

Activer dreaming avec une cadence de balayage personnalisée :

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

## Workflow CLI

Utilisez la promotion CLI pour un aperçu ou une application manuelle :

```bash
openclaw memory promote
openclaw memory promote --apply
openclaw memory promote --limit 5
openclaw memory status --deep
```

La commande manuelle `memory promote` utilise par défaut les seuils de la phase profonde, sauf remplacement
par des indicateurs CLI.

Expliquer pourquoi un candidat spécifique serait ou ne serait pas promu :

```bash
openclaw memory promote-explain "router vlan"
openclaw memory promote-explain "router vlan" --json
```

Prévisualiser les réflexions REM, les vérités candidates et la sortie de promotion profonde sans
rien écrire :

```bash
openclaw memory rem-harness
openclaw memory rem-harness --json
```

## Valeurs par défaut clés

Tous les paramètres se trouvent sous `plugins.entries.memory-core.config.dreaming`.

| Clé | Par défaut |
| ----------- | ----------- |
| `enabled` | `false` |
| `frequency` | `0 3 * * *` |

La politique de phase, les seuils et le comportement de stockage sont des détails d’implémentation
internes (pas une configuration destinée aux utilisateurs).

Consultez [Référence de configuration de la mémoire](/fr/reference/memory-config#dreaming-experimental)
pour la liste complète des clés.

## Interface Dreams

Lorsqu’elle est activée, l’onglet **Dreams** de la Gateway affiche :

- l’état actuel d’activation de dreaming
- le statut au niveau des phases et la présence d’un balayage géré
- les nombres à court terme, à long terme et promus aujourd’hui
- le moment de la prochaine exécution planifiée
- un lecteur extensible du journal des rêves reposant sur `doctor.memory.dreamDiary`

## Lié

- [Mémoire](/fr/concepts/memory)
- [Recherche dans la mémoire](/fr/concepts/memory-search)
- [CLI memory](/cli/memory)
- [Référence de configuration de la mémoire](/fr/reference/memory-config)
