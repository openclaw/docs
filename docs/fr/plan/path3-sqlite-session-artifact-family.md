---
read_when:
    - Vous implémentez clawdbot-d63.2 / clawdbot-04b
    - Vous modifiez la conservation, la réinitialisation, la suppression ou l’archivage lors de la suppression d’un agent pour les sessions SQLite
    - Vous devez distinguer les familles d’artefacts de l’ère SQLite des anciens fichiers annexes JSONL
summary: Plan de la voie 3 pour l’archivage de tous les artefacts de transcription SQLite appartenant à une session
title: Famille d’artefacts de session SQLite du chemin 3
x-i18n:
    generated_at: "2026-07-12T15:36:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: adb2c31293ab63cb80449d037600d78fbb228e91f380d1ccaf15fb00728a9057
    source_path: plan/path3-sqlite-session-artifact-family.md
    workflow: 16
---

# Famille d’artefacts de session SQLite du chemin 3

Cette note délimite `clawdbot-d63.2`, tandis que `clawdbot-d63.1` prend en charge l’utilitaire d’archivage de réinitialisation/suppression qui se chevauche dans `src/config/sessions/session-accessor.sqlite.ts`.
Le fichier d’implémentation comportait des modifications non validées pendant cette passe ; cet artefact consigne donc le contrat exact et les points de modification sans entrer en conflit avec le worker associé.

## Famille faisant autorité

Après le basculement vers SQLite, les transcriptions des sessions actives sont des lignes SQLite. La famille d’archivage d’une session comprend :

- Les lignes `transcript_events`, `transcript_event_identities` et `sessions`
  correspondant au `sessionId` actuel de l’entrée.
- Le même ensemble de lignes de transcription SQLite pour chaque `sessionId` référencé par
  `entry.compactionCheckpoints[*].preCompaction.sessionId`.
- Le même ensemble de lignes de transcription SQLite pour chaque `sessionId` référencé par
  `entry.compactionCheckpoints[*].postCompaction.sessionId`.
- Le même ensemble de lignes de transcription SQLite pour chaque `sessionId` dans
  `entry.usageFamilySessionIds`.

Archivez uniquement les lignes qui ne sont plus référencées par aucune ligne
`session_entries` restante ni par les métadonnées de Compaction ou de famille d’utilisation
d’une entrée restante. Cela préserve l’état de branchement/restauration des points de contrôle
et d’agrégation de l’utilisation jusqu’à la disparition de la dernière référence active.

## Artefacts hors famille après le basculement

Les variantes générées de fichiers de transcription de sujet et les fichiers annexes de trajectoire ne constituent pas
un état d’exécution SQLite actif. Ce sont des artefacts de fichiers hérités :

- Les variantes de sujet telles que `<sessionId>-topic-<thread>.jsonl` n’existent que pour le
  format de transcription basé sur des fichiers. SQLite utilise l’identifiant de session canonique ainsi que
  les métadonnées de livraison `session_routes`/de l’entrée au lieu de fichiers JSONL par sujet.
- Les fichiers annexes de trajectoire tels que `.trajectory.jsonl` et `.trajectory-path.json`
  sont nommés à partir de chemins `sessionFile` JSONL réels. Les valeurs `sessionFile` SQLite sont
  des marqueurs `sqlite:<agentId>:<sessionId>:<storePath>` et ne désignent pas de fichiers
  annexes.
- Les lecteurs du niveau d’archivage doivent continuer à lire les fichiers JSONL archivés hérités, mais
  la conservation à l’exécution ne doit pas analyser les répertoires des sessions actives ni rouvrir les fichiers
  de transcription JSONL pour les sessions SQLite.

L’importation de Doctor reste responsable de la migration des fichiers JSONL principaux hérités et
de leurs fichiers annexes de trajectoire adjacents. La conservation SQLite à l’exécution ne doit pas ajouter un
deuxième importateur ni une solution de repli vers les fichiers.

## Points de modification

Étendez l’utilitaire d’archivage SQLite introduit par `clawdbot-d63.1` plutôt que
d’ajouter un chemin parallèle.

1. Ajoutez un collecteur local près de `deleteSqliteSessionStateIfUnreferenced` :
   - `collectSqliteSessionArtifactFamily(entry: SessionEntry): Set<string>`
   - Incluez `entry.sessionId`, les identifiants de session pré/post-point de contrôle et
     `usageFamilySessionIds`.
   - Filtrez les chaînes vides et dédupliquez de manière déterministe.

2. Ajoutez un collecteur de références pour le magasin après suppression :
   - `readReferencedSqliteSessionArtifactFamilyIds(database): Set<string>`
   - Parcourez les `session_entries` actuelles, analysez chaque `entry_json` et collectez
     les mêmes identifiants de famille pour chaque entrée restante.

3. Modifiez les appelants de réinitialisation/suppression/maintenance qui archivent actuellement un seul
   `sessionId` supprimé afin qu’ils transmettent la famille complète de l’entrée supprimée.

4. Pour chaque identifiant de famille, archivez les lignes de transcription SQLite avec le motif fourni par l’appelant
   (`reset` ou `deleted`), puis supprimez la ligne `sessions` uniquement lorsque
   l’identifiant de famille est absent de l’ensemble de références après suppression.

5. Conservez la centralisation de la suppression des événements de transcription dans le chemin existant de nettoyage
   des lignes de session SQLite. N’ajoutez aucune lecture de fichiers JSONL actifs.

## Tests ciblés

Ajoutez des tests propres à SQLite dans `src/config/sessions/session-accessor.conformance.test.ts`
ou dans le test de cycle de vie associé après la validation de `clawdbot-d63.1` :

- La suppression d’une entrée comportant une transcription antérieure à la Compaction archive à la fois la session
  actuelle et la session antérieure à la Compaction, puis supprime les deux ensembles de lignes SQLite.
- La suppression de l’une des deux entrées partageant une session antérieure à la Compaction n’archive
  rien pour la session antérieure partagée tant que la dernière entrée qui la référence n’est pas
  supprimée.
- La suppression d’une entrée comportant `usageFamilySessionIds` archive les lignes de transcription SQLite
  prédécesseures lorsqu’aucune autre entrée ne référence cette famille d’utilisation.
- Une clé de session ayant la forme d’un sujet avec un marqueur SQLite ne provoque aucune lecture d’un fichier
  JSONL de sujet généré ni aucune recherche de fichier annexe.

La validation ciblée doit utiliser :

```bash
node scripts/run-vitest.mjs src/config/sessions/session-accessor.conformance.test.ts
```

Si les tests finaux se trouvent dans `store.session-lifecycle-mutation.test.ts`, exécutez explicitement
ce fichier avec le même wrapper. Les validations générales `pnpm` doivent rester sur
Crabbox/Testbox pour ce worktree Codex.
