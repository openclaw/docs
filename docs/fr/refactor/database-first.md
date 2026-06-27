---
read_when:
    - Déplacement des données d’exécution, du cache, des transcriptions, de l’état des tâches ou des fichiers temporaires d’OpenClaw vers SQLite
    - Concevoir des migrations doctor à partir de fichiers JSON ou JSONL
    - Modification du comportement de sauvegarde, de restauration, de VFS ou de stockage des workers
    - Suppression des verrous de session, de l’élagage, de la troncature ou des chemins de compatibilité JSON
summary: Plan de migration pour faire de SQLite la couche principale d’état durable et de cache tout en conservant la configuration adossée à des fichiers
title: Refactorisation de l’état axée d’abord sur la base de données
x-i18n:
    generated_at: "2026-06-27T18:08:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54995a9f43f740e7cc3ac3e0a4b69d73ddba6b2c30731193ab7ce3aa1dfc9d94
    source_path: refactor/database-first.md
    workflow: 16
---

# Refactorisation de l’état avec priorité à la base de données

## Décision

Utiliser une disposition SQLite à deux niveaux :

- Base de données globale : `~/.openclaw/state/openclaw.sqlite`
- Base de données d’agent : une base de données SQLite par agent pour l’espace de travail appartenant à l’agent,
  la transcription, le VFS, les artefacts et le grand état d’exécution par agent
- La configuration reste adossée à des fichiers : `openclaw.json` reste en dehors de la
  base de données. Les profils d’authentification d’exécution migrent vers SQLite ; les fichiers d’identifiants de fournisseur externe ou de CLI
  restent gérés par leur propriétaire en dehors de la base de données d’OpenClaw.

La base de données globale est la base de données du plan de contrôle. Elle possède la découverte des agents,
l’état partagé du Gateway, l’appairage, l’état des appareils/nœuds, les registres de tâches et de flux, l’état des plugins,
l’état d’exécution du planificateur, les métadonnées de sauvegarde et l’état de migration.

La base de données d’agent est la base de données du plan de données. Elle possède les métadonnées de session de l’agent,
le flux d’événements de transcription, l’espace de travail VFS ou l’espace de brouillon, les artefacts d’outils,
les artefacts d’exécution et les données de cache locales à l’agent pouvant être recherchées/indexées.

Cela fournit une vue globale durable sans forcer les grands espaces de travail d’agents,
les transcriptions et les données binaires de brouillon dans le couloir d’écriture partagé du Gateway.

## Contrat strict

Cette migration a une seule forme d’exécution canonique :

- Les lignes de session ne persistent que les métadonnées de session. Elles ne doivent pas persister
  `transcriptLocator`, les chemins de fichiers de transcription, les chemins JSONL voisins, les chemins de verrou,
  les métadonnées d’élagage ni les pointeurs de compatibilité de l’ère fichier.
- L’identité de transcription est toujours une identité SQLite : `{agentId, sessionId}` plus
  des métadonnées de sujet facultatives lorsque le protocole en a besoin.
- `sqlite-transcript://...` n’est pas une identité d’exécution ni de protocole. Le nouveau code ne doit
  pas dériver, persister, transmettre, analyser ni migrer des localisateurs de transcription. L’exécution et
  les tests ne doivent contenir aucun pseudo-localisateur ; les docs peuvent mentionner la chaîne
  uniquement pour l’interdire.
- Les anciens `sessions.json`, JSONL de transcription, `.jsonl.lock`, l’élagage, la troncature
  et l’ancienne logique de chemin de session appartiennent uniquement au chemin de migration/import doctor.
- Les anciens alias de configuration de session appartiennent uniquement à la migration doctor. L’exécution
  n’interprète pas `session.idleMinutes`, `session.resetByType.dm` ni les alias de session principale
  inter-agents `agent:main:*` pour un autre agent configuré.
- L’identité de routage de session est un état relationnel typé. Les chemins d’exécution à chaud et d’UI
  doivent lire `sessions.session_scope`, `sessions.account_id`,
  `sessions.primary_conversation_id`, `conversations` et
  `session_conversations` ; ils ne doivent pas analyser `session_key` ni fouiller
  `session_entries.entry_json` pour l’identité du fournisseur, sauf comme ombre de compatibilité
  pendant la suppression des anciens sites d’appel.
- Les marqueurs de messages directs au niveau canal, comme `dm` par rapport à `direct`, sont un vocabulaire de routage,
  pas des localisateurs de transcription ni des poignées de compatibilité de stockage fichier.
- L’ancienne configuration des gestionnaires de hooks appartient uniquement aux surfaces d’avertissement/migration doctor.
  L’exécution ne doit pas charger `hooks.internal.handlers` ; les hooks passent uniquement par les répertoires de hooks découverts
  et les métadonnées `HOOK.md`.
- Le démarrage de l’exécution, les chemins de réponse à chaud, la Compaction, la réinitialisation, la récupération, les diagnostics,
  TTS, les hooks mémoire, les sous-agents, le routage des commandes de plugins, les limites de protocole et
  les hooks doivent transmettre `{agentId, sessionId}` dans l’exécution.
- Les tests doivent amorcer et vérifier les lignes de transcription SQLite via
  `{agentId, sessionId}`. Les tests qui prouvent seulement le transfert de chemin JSONL,
  la préservation de localisateur fourni par l’appelant ou la compatibilité de fichier de transcription doivent
  être supprimés, sauf s’ils couvrent l’import doctor, la matérialisation de support/débogage hors session
  ou la forme du protocole.
- `runEmbeddedPiAgent(...)`, les exécutions de workers préparées et la tentative embarquée interne
  ne doivent pas accepter de localisateurs de transcription. Ils ouvrent le gestionnaire de transcription SQLite
  via `{agentId, sessionId}` et transmettent ce gestionnaire à la session d’agent compatible PI internalisée,
  afin que des appelants obsolètes ne puissent pas faire écrire au runner des transcriptions JSON/JSONL.
- Les diagnostics du runner doivent stocker les enregistrements de trace d’exécution/cache/charge utile dans SQLite.
  Les diagnostics d’exécution ne doivent pas exposer de réglages de substitution de fichier JSONL ni d’aides génériques
  d’export JSONL de transcription ; les exports destinés aux utilisateurs peuvent matérialiser des artefacts explicites
  à partir des lignes de base de données sans réinjecter de noms de fichiers dans l’exécution.
- La journalisation brute de flux utilise `OPENCLAW_RAW_STREAM=1` plus des lignes de diagnostics SQLite.
  L’ancien contrat du journaliseur de fichiers pi-mono `PI_RAW_STREAM`, `PI_RAW_STREAM_PATH` et
  `raw-openai-completions.jsonl` ne fait pas partie de l’exécution ni des tests OpenClaw.
- L’indexation mémoire QMD ne doit pas exporter les transcriptions SQLite vers des fichiers Markdown.
  QMD indexe uniquement les fichiers mémoire configurés ; la recherche dans les transcriptions de session reste
  adossée à SQLite.
- Le sous-chemin SDK QMD est réservé à QMD pour le nouveau code. Les aides d’indexation des transcriptions de session SQLite
  vivent sur `memory-core-host-engine-session-transcripts` ; toute réexportation QMD
  n’est que compatibilité et ne doit pas être utilisée par le code d’exécution.
- Les index mémoire intégrés vivent dans la base de données de l’agent propriétaire. La configuration d’exécution et
  les contrats d’exécution résolus ne doivent pas exposer `memorySearch.store.path` ; doctor
  supprime cette ancienne clé de configuration et le code actuel transmet en interne le
  `databasePath` de l’agent.

Le travail d’implémentation doit continuer à supprimer du code jusqu’à ce que ces affirmations soient vraies
sans exception en dehors des limites doctor/import/export/débogage.

## État cible et progression

### Objectif strict

- Une base de données SQLite globale possède l’état du plan de contrôle :
  `state/openclaw.sqlite`.
- Une base de données SQLite par agent possède l’état du plan de données :
  `agents/<agentId>/agent/openclaw-agent.sqlite`.
- La configuration reste adossée à des fichiers. `openclaw.json` ne fait pas partie de cette
  refactorisation de base de données.
- Les anciens fichiers sont uniquement des entrées de migration doctor.
- L’exécution n’écrit ni ne lit jamais de session ou de transcription JSONL comme état actif.

### États cibles

- `not-started` : le code d’exécution de l’ère fichier écrit encore un état actif.
- `migrating` : le code doctor/import peut déplacer les données de fichiers vers SQLite.
- `dual-read` : pont temporaire lisant à la fois SQLite et les anciens fichiers. Cet état
  est interdit pour cette refactorisation sauf s’il est explicitement documenté comme
  réservé à doctor.
- `sqlite-runtime` : l’exécution lit et écrit uniquement SQLite.
- `clean` : les anciennes API et tests d’exécution sont supprimés, et la garde empêche
  les régressions.
- `done` : les docs, tests, sauvegardes, migration doctor et contrôles modifiés prouvent
  l’état propre.

### État actuel

- Sessions : `clean` pour l’exécution. Les lignes de session vivent dans la base de données par agent,
  les API d’exécution utilisent `{agentId, sessionId}` ou `{agentId, sessionKey}`, et
  `sessions.json` est une entrée héritée réservée à doctor.
- Transcriptions : `clean` pour l’exécution. Les événements de transcription, identités, instantanés
  et événements d’exécution de trajectoire vivent dans la base de données par agent. L’exécution
  n’accepte plus les localisateurs de transcription ni les chemins de transcription JSONL.
- Runner PI embarqué : `clean`. Les exécutions PI embarquées, workers préparés, Compaction
  et boucles de nouvelle tentative utilisent la portée de session SQLite et rejettent les poignées de transcription obsolètes.
- Cron : `clean` pour l’exécution. L’exécution utilise `cron_jobs` et `cron_run_logs` ;
  les tests d’exécution utilisent la nomenclature SQLite `storeKey`, et les chemins Cron de l’ère fichier restent
  uniquement dans les tests de migration héritée doctor.
- Registre de tâches : `clean`. Les lignes d’exécution Task et Task Flow vivent dans
  `state/openclaw.sqlite` ; les importeurs SQLite sidecar non livrés sont supprimés.
- État des plugins : `clean`. Les lignes d’état/blob des plugins vivent dans la base de données globale partagée ;
  les anciens assistants SQLite sidecar d’état de plugin sont protégés contre l’usage.
- Mémoire : `sqlite-runtime` pour la mémoire intégrée et l’indexation des transcriptions de session.
  Les tables d’index mémoire vivent dans la base de données par agent, l’état mémoire des plugins utilise
  les lignes d’état de plugin partagées, et les anciens fichiers mémoire sont des entrées de migration doctor
  ou du contenu d’espace de travail utilisateur.
- Sauvegarde : `sqlite-runtime`. Les étapes de sauvegarde compactent les instantanés SQLite, omettent les sidecars WAL/SHM
  actifs, vérifient l’intégrité SQLite et enregistrent les exécutions de sauvegarde dans la
  base de données globale.
- Migration doctor : `migrating`, intentionnellement. Doctor importe les anciens JSON,
  JSONL et magasins sidecar retirés dans SQLite, enregistre les exécutions/sources de migration
  et supprime les sources réussies.
- Scripts E2E : `clean` pour la couverture d’exécution. L’amorçage Docker MCP écrit des lignes SQLite.
  Le script Docker runtime-context crée un ancien JSONL uniquement dans la graine de migration doctor
  et nomme explicitement le chemin de l’index de session hérité.

### Travail restant

- [x] Renommer les variables de magasin des tests d’exécution Cron pour éviter `storePath`, sauf
      lorsqu’elles sont des entrées héritées doctor.
      Fichiers : `src/cron/service.test-harness.ts`,
      `src/cron/service.runs-one-shot-main-job-disables-it.test.ts`,
      `src/cron/service/timer.regression.test.ts`,
      `src/cron/service/ops.test.ts`, `src/cron/service/store.test.ts`,
      `src/cron/service.heartbeat-ok-summary-suppressed.test.ts`,
      `src/cron/service.main-job-passes-heartbeat-target-last.test.ts`,
      `src/cron/store.test.ts`.
      Preuve : `pnpm check:database-first-legacy-stores` ; `rg -n 'storePath' src/cron --glob '!**/commands/doctor/**'`.
- [x] Supprimer ou renommer les mocks de test d’export obsolètes de l’ère fichier.
      Fichier : `src/auto-reply/reply/commands-export-test-mocks.ts`.
      Preuve : `rg -n 'resolveSessionFilePath|sessionFile|storePath|transcriptLocator' src/auto-reply/reply`.
- [x] Rendre la graine JSONL héritée Docker runtime-context manifestement réservée à doctor.
      Fichier : `scripts/e2e/session-runtime-context-docker-client.ts`.
      Preuve : `rg -n 'sessions\\.json|sessionFile|\\.jsonl' scripts/e2e/session-runtime-context-docker-client.ts` affiche uniquement
      `seedBrokenLegacySessionForDoctorMigration`.
- [x] Garder les types générés Kysely alignés après tout changement de schéma.
      Fichiers : `src/state/openclaw-state-schema.sql`,
      `src/state/openclaw-agent-schema.sql`,
      `src/state/*generated*`.
      Preuve : aucun changement de schéma dans ce passage ; `pnpm db:kysely:check` ;
      `pnpm lint:kysely`.
- [x] Relancer les tests ciblés pour les magasins, commandes et scripts touchés.
      Preuve : `pnpm test src/cron/service/store.test.ts src/cron/store.test.ts src/cron/service.heartbeat-ok-summary-suppressed.test.ts src/cron/service.main-job-passes-heartbeat-target-last.test.ts src/cron/service.every-jobs-fire.test.ts src/cron/service.persists-delivered-status.test.ts src/cron/service.runs-one-shot-main-job-disables-it.test.ts src/cron/service/ops.test.ts src/cron/service/timer.regression.test.ts src/auto-reply/reply/commands-export-trajectory.test.ts extensions/telegram/src/thread-bindings.test.ts extensions/slack/src/monitor/message-handler/prepare.test.ts src/acp/translator.session-lineage-meta.test.ts` ; `git diff --check`.
- [x] Avant de déclarer `done`, exécuter la porte des changements ou une preuve large distante.
      Preuve : `pnpm check:changed --timed -- <changed extension paths>` a réussi sur
      l’exécution Hetzner Crabbox `run_3f1cabf6b25c` après une configuration temporaire Node 24/pnpm et
      un routage explicite des chemins pour l’espace de travail synchronisé sans `.git`.

### Ne pas régresser

- Aucun localisateur de transcription.
- Aucun fichier de session actif.
- Aucune fixture de test JSONL factice sauf les tests de migration héritée doctor.
- Aucun accès SQLite brut là où Kysely est attendu.
- Aucune nouvelle migration de base de données héritée. Cette disposition n’a pas été livrée ; garder la version du schéma
  à `1` sauf raison forte.

## Hypothèses de lecture du code

Aucune décision produit de suivi ne bloque ce plan. L’implémentation doit
avancer avec ces hypothèses :

- Utilisez `node:sqlite` directement et exigez l’environnement d’exécution Node 22+ pour ce chemin de stockage.
- Conservez exactement un fichier de configuration normal. Ne déplacez pas la configuration, les manifestes de plugin ni les espaces de travail Git dans SQLite lors de ce refactor.
- Les fichiers de compatibilité d’exécution ne sont pas requis. Les anciens fichiers JSON et JSONL sont uniquement des entrées de migration. Les side-cars SQLite locaux à la branche n’ont jamais été publiés et sont supprimés au lieu d’être importés.
- `openclaw doctor --fix` possède l’étape de migration des anciens fichiers vers la base de données. Le démarrage de l’exécution et `openclaw migrate` ne doivent pas porter d’anciens chemins de mise à niveau de base de données OpenClaw.
- La compatibilité des identifiants suit la même règle : les identifiants d’exécution résident dans SQLite. Les anciens fichiers `auth-profiles.json`, les fichiers `auth.json` par agent et les fichiers partagés `credentials/oauth.json` sont des entrées de migration de doctor, puis supprimés après importation.
- L’état généré du catalogue de modèles est adossé à la base de données. Le code d’exécution ne doit pas écrire `agents/<agentId>/agent/models.json` ; les fichiers `models.json` existants sont des entrées doctor héritées et sont supprimés après importation dans `agent_model_catalogs`.
- L’exécution ne doit pas migrer, normaliser ni relier les localisateurs de transcription. L’identité de transcription active est `{agentId, sessionId}` dans SQLite. Les chemins de fichiers sont uniquement des entrées doctor héritées, et `sqlite-transcript://...` doit disparaître des surfaces d’exécution, de protocole, de hook et de plugin au lieu d’être traité comme un handle de frontière.
- Les lectures de transcriptions SQLite à l’exécution n’exécutent pas d’anciennes migrations de forme d’entrée JSONL et ne réécrivent pas des transcriptions entières pour compatibilité. La normalisation des entrées héritées reste dans les utilitaires explicites doctor/import. Doctor normalise les anciens fichiers de transcription JSONL avant d’insérer les lignes SQLite ; les lignes d’exécution actuelles sont déjà écrites selon le schéma de transcription actuel. L’export de trajectoire/session lit ces lignes telles quelles et ne doit pas effectuer de migrations héritées au moment de l’export.
- Les assistants d’analyse/migration JSONL de transcription héritée sont réservés à doctor. Le code de format de transcription d’exécution construit uniquement le contexte de transcription SQLite actuel ; doctor possède les mises à niveau des anciennes entrées JSONL avant insertion des lignes.
- L’ancien assistant de streaming de transcription JSONL détenu par l’exécution a été supprimé. Le code d’import doctor possède les lectures explicites des anciens fichiers ; l’historique de session d’exécution lit les lignes SQLite.
- Les liaisons du serveur d’application Codex utilisent le `sessionId` OpenClaw comme clé canonique dans l’espace de noms d’état du plugin Codex. `sessionKey` est une métadonnée de routage/affichage et ne doit pas remplacer l’identifiant durable de session ni ressusciter l’identité fondée sur un fichier de transcription.
- Les moteurs de contexte reçoivent directement le contrat d’exécution actuel. Le registre ne doit pas envelopper les moteurs avec des shims de nouvelle tentative qui suppriment `sessionKey`, `transcriptScope` ou `prompt` ; les moteurs qui ne peuvent pas accepter les paramètres actuels orientés base de données doivent échouer bruyamment au lieu d’être reliés.
- La sortie de sauvegarde doit rester un seul fichier d’archive. Le contenu de la base de données doit entrer dans cette archive sous forme d’instantanés SQLite compacts, et non sous forme de side-cars WAL actifs bruts.
- La recherche de transcription est utile mais pas requise pour la première version orientée base de données. Concevez le schéma de sorte que FTS puisse être ajouté ultérieurement.
- L’exécution des workers doit rester expérimentale derrière des paramètres pendant que la frontière de base de données se stabilise.

## Constats de Lecture du Code

La branche actuelle a déjà dépassé le stade de la preuve de concept. La base de données partagée existe, `node:sqlite` de Node est câblé via un petit assistant d’exécution, et les anciens stores écrivent maintenant dans `state/openclaw.sqlite` ou dans la base de données propriétaire `openclaw-agent.sqlite`.

Le travail restant ne consiste pas à choisir SQLite ; il consiste à garder la nouvelle frontière propre et à supprimer toutes les interfaces à forme de compatibilité qui ressemblent encore à l’ancien monde des fichiers :

- Le `storePath` de session n’est plus une identité d’exécution, une forme de fixture de test ni un champ de charge utile de statut. Les tests d’exécution et de pont ne contiennent plus le nom de contrat `storePath` ; le code doctor/migration possède ce vocabulaire hérité.
- Les écritures de session ne passent plus par l’ancienne file `store-writer.ts` en processus. Les écritures de patch SQLite utilisent plutôt la détection de conflit et des nouvelles tentatives bornées.
- La découverte de chemins hérités a encore des usages de migration valides, mais le code d’exécution doit cesser de traiter `sessions.json` et les fichiers JSONL de transcription comme des cibles d’écriture possibles.
- Les tables détenues par l’agent vivent dans des bases de données SQLite par agent. La base de données globale conserve les lignes de registre/plan de contrôle ; l’identité de transcription est `{agentId, sessionId}` dans les lignes de transcription par agent. Le code d’exécution ne doit pas persister les chemins de fichiers de transcription ni migrer les localisateurs de transcription.
- Doctor importe déjà plusieurs fichiers hérités. Le nettoyage consiste à en faire une unique implémentation de migration explicite appelée par doctor, avec un rapport de migration durable.

Aucune question produit supplémentaire ne bloque l’implémentation.

## Forme Actuelle du Code

La branche dispose déjà d’une vraie base SQLite partagée :

- Le plancher d’exécution est désormais Node 22+ : `package.json`, la garde d’exécution de la CLI,
  les valeurs par défaut de l’installeur, le localisateur d’environnement d’exécution macOS, la CI et la documentation
  d’installation publique sont tous alignés. L’ancienne voie de compatibilité Node 22 est supprimée.
- `src/state/openclaw-state-db.ts` ouvre `openclaw.sqlite`, définit WAL,
  `synchronous=NORMAL`, `busy_timeout=30000`, `foreign_keys=ON`, et applique
  le module de schéma généré dérivé de
  `src/state/openclaw-state-schema.sql`.
- Les types de tables Kysely et les modules de schéma d’exécution sont générés à partir de bases de données
  SQLite jetables créées depuis les fichiers `.sql` validés ; le code d’exécution ne
  conserve plus de chaînes de schéma copiées-collées pour les bases de données globales, par agent ou de
  capture de proxy.
- Les magasins d’exécution dérivent les types de lignes sélectionnées et insérées de ces interfaces Kysely
  `DB` générées au lieu de dupliquer manuellement les formes de lignes SQLite. Le SQL brut
  reste limité à l’application du schéma, aux pragmas et au DDL réservé aux migrations.
- Les schémas SQLite sont ramenés à `user_version = 1` car cette disposition de base de données
  n’a pas encore été livrée. Les ouvreurs d’exécution créent uniquement le schéma actuel ;
  l’import fichier-vers-base de données reste dans le code doctor, et les assistants de mise à niveau de base de données
  propres à la branche ont été supprimés.
- La propriété relationnelle est appliquée là où la frontière de propriété est canonique :
  les lignes de migration source cascadent depuis `migration_runs`, l’état de livraison des tâches
  cascade depuis `task_runs`, et les lignes d’identité de transcription cascadent depuis
  les événements de transcription.
- Les tables partagées actuelles incluent `agent_databases`,
  `auth_profile_stores`, `auth_profile_state`,
  `plugin_state_entries`, `plugin_blob_entries`, `media_blobs`,
  `skill_uploads`, `capture_sessions`, `capture_events`, `capture_blobs`,
  `sandbox_registry_entries`, `cron_run_logs`, `cron_jobs`, `commitments`,
  `delivery_queue_entries`, `model_capability_cache`,
  `workspace_setup_state`, `native_hook_relay_bridges`,
  `current_conversation_bindings`, `plugin_binding_approvals`,
  `tui_last_sessions`, `acp_sessions`, `acp_replay_sessions`,
  `acp_replay_events`, `task_runs`, `task_delivery_state`, `flow_runs`,
  `subagent_runs`, `migration_runs`, et `backup_runs`.
- L’état arbitraire appartenant aux plugins ne reçoit pas de tables typées appartenant à l’hôte. Les
  plugins installés utilisent `plugin_state_entries` pour les charges utiles JSON versionnées et
  `plugin_blob_entries` pour les octets, avec propriété d’espace de noms/clé, nettoyage TTL,
  sauvegarde et enregistrements de migration de plugin. L’état d’orchestration de plugins appartenant à l’hôte peut
  toujours avoir des tables typées lorsque l’hôte possède le contrat de requête, comme
  `plugin_binding_approvals`.
- Les migrations de plugins sont des migrations de données sur des espaces de noms appartenant aux plugins, et non des migrations de
  schéma hôte. Un plugin peut migrer ses propres entrées d’état/blob versionnées
  via un fournisseur de migration, et l’hôte enregistre l’état source/exécution dans le
  registre de migration normal. Les nouvelles installations de plugins ne nécessitent pas de modifier
  `openclaw-state-schema.sql` sauf si l’hôte lui-même prend possession d’un
  nouveau contrat inter-plugins.
- `src/state/openclaw-agent-db.ts` ouvre
  `agents/<agentId>/agent/openclaw-agent.sqlite`, enregistre la base de données dans la
  BD globale, et possède les tables locales à l’agent pour les sessions, transcriptions, VFS, artefacts, caches
  et index mémoire. La découverte d’exécution partagée lit désormais le registre `agent_databases`
  typé et généré au lieu de réimplémenter cette requête à chaque site d’appel.
- Les bases de données globales et par agent enregistrent une ligne `schema_meta` avec le rôle de base de données,
  la version du schéma, les horodatages et l’identifiant d’agent pour les bases de données d’agent. La disposition
  reste toujours à `user_version = 1` car ce schéma SQLite n’a pas encore été livré.
- L’identité de session par agent dispose désormais d’une table racine canonique `sessions` indexée par
  `session_id`, avec `session_key`, `session_scope`, `account_id`,
  `primary_conversation_id`, les horodatages, les champs d’affichage, les métadonnées de modèle,
  l’identifiant de harnais et les liens parent/génération comme colonnes interrogeables. `session_routes`
  est l’index de route active unique de `session_key` vers le `session_id` actuel,
  afin qu’une clé de route puisse migrer vers une nouvelle session durable sans
  obliger les lectures rapides à choisir entre des lignes `sessions.session_key` dupliquées. L’ancienne
  charge utile de compatibilité `session_entries.entry_json` est rattachée à la racine durable
  `session_id` par clé étrangère ; elle n’est plus la seule
  représentation au niveau du schéma d’une session.
- L’identité de conversation externe par agent est elle aussi relationnelle :
  `conversations` stocke l’identité normalisée fournisseur/compte/conversation, et
  `session_conversations` relie une session OpenClaw à une ou plusieurs conversations
  externes. Cela couvre les sessions DM principales partagées où plusieurs pairs peuvent
  intentionnellement correspondre à une seule session sans mentir dans `session_key`. SQLite
  impose aussi l’unicité pour l’identité fournisseur naturelle afin que le même tuple
  channel/compte/type/pair/fil ne puisse pas bifurquer entre plusieurs identifiants de conversation.
  Les pairs directs principaux partagés sont liés avec un rôle `participant`, afin qu’une
  session OpenClaw puisse représenter plusieurs pairs DM externes sans rétrograder
  les anciens pairs en lignes liées vagues. `sessions.primary_conversation_id` pointe toujours
  vers la cible de livraison typée actuelle. Les colonnes fermées de routage/statut
  sont imposées avec des contraintes SQLite `CHECK` au lieu de s’appuyer seulement sur
  des unions TypeScript.
  La projection de session d’exécution efface les ombres de routage de compatibilité de
  `session_entries.entry_json` avant d’appliquer les colonnes typées session/conversation,
  afin que des charges utiles JSON obsolètes ne puissent pas ressusciter des cibles de livraison.
  Le routage d’annonce des sous-agents exige également le contexte de livraison SQLite typé ;
  il ne se rabat plus sur les champs de route de compatibilité `SessionEntry`.
  L’héritage explicite de livraison Gateway `chat.send` lit le contexte de livraison SQLite typé
  au lieu des champs de compatibilité `origin`/`last*`.
  `tools.effective` dérive de même le contexte fournisseur/compte/fil depuis les lignes typées
  de livraison/routage SQLite, et non depuis des ombres obsolètes `last*` d’entrée de session.
  Le contexte de prompt des événements système reconstruit les champs channel/to/account/thread à partir
  des champs de livraison typés au lieu des ombres `origin`.
  L’assistant partagé `deliveryContextFromSession` et le mappeur session-vers-conversation
  ignorent désormais entièrement `SessionEntry.origin` ; seuls les champs de livraison typés
  et les lignes relationnelles de conversation peuvent créer l’identité de route à chaud.
  La normalisation des entrées de session d’exécution retire `origin` avant de persister ou
  projeter `entry_json`, et les écritures de métadonnées entrantes écrivent des champs channel/chat typés
  ainsi que des lignes relationnelles de conversation au lieu de créer de nouvelles ombres origin.
- Les événements de transcription, les instantanés de transcription et les événements d’exécution de trajectoire
  référencent désormais la racine canonique `sessions` par agent et cascadent lors de la suppression de session.
  Les lignes d’identité/idempotence de transcription continuent de cascader depuis la
  ligne exacte d’événement de transcription.
- Les index memory-core utilisent désormais des tables explicites de base de données d’agent
  `memory_index_meta`, `memory_index_sources`, `memory_index_chunks`, et
  `memory_embedding_cache`, avec `memory_index_state` pour suivre les changements de révision.
  Les index secondaires FTS/vector facultatifs sont nommés `memory_index_chunks_fts` et
  `memory_index_chunks_vec` au lieu de tables génériques `meta`, `files`, `chunks`,
  `chunks_fts`, ou `chunks_vec`. Les noms canoniques conservent la forme actuelle des lignes
  path/source et la compatibilité d’intégration sérialisée. Ces tables sont un cache dérivé/de recherche,
  pas le stockage canonique des transcriptions ; elles peuvent être supprimées et
  reconstruites depuis les fichiers de l’espace de travail mémoire et les sources configurées.
  L’ouverture d’un index mémoire livré avec des noms génériques migre ses métadonnées, sources,
  fragments et cache d’intégration vers les tables canoniques ; les tables dérivées FTS/vector
  sont reconstruites sous leurs noms canoniques.
- L’état de récupération d’exécution des sous-agents vit désormais dans des lignes partagées typées `subagent_runs`
  avec des clés de session enfant, demandeur et contrôleur indexées. L’ancien fichier
  `subagents/runs.json` sert uniquement d’entrée de migration doctor.
- Les liaisons de conversation actuelles vivent désormais dans des lignes partagées typées
  `current_conversation_bindings` indexées par identifiant de conversation normalisé, avec
  des colonnes agent/session cibles, type de conversation, statut, expiration et métadonnées
  stockées comme colonnes relationnelles au lieu d’un enregistrement de liaison opaque dupliqué.
  La clé de liaison durable inclut le type de conversation normalisé afin que
  les références direct/group/channel ne puissent pas entrer en collision, et SQLite rejette les valeurs
  de type/statut de liaison invalides. L’ancien fichier
  `bindings/current-conversations.json` sert uniquement d’entrée de migration doctor.
- La récupération de la file de livraison superpose désormais des colonnes de file typées pour channel, cible,
  compte, session, tentative, erreur, envoi plateforme et état de récupération au-dessus du
  JSON de relecture. `entry_json` conserve les charges utiles de relecture, les hooks et la charge utile
  de mise en forme, mais les colonnes typées font autorité pour le routage/état à chaud de la file.
- Les pointeurs de restauration de dernière session TUI vivent désormais dans des lignes partagées typées
  `tui_last_sessions` indexées par le périmètre haché de connexion/session TUI.
  L’ancien fichier JSON TUI sert uniquement d’entrée de migration doctor.
- Les préférences TTS par défaut vivent désormais dans des lignes SQLite d’état de plugin partagées, indexées sous le
  plugin `speech-core`. L’ancien fichier `settings/tts.json` sert uniquement d’entrée de migration
  doctor ; l’environnement d’exécution ne lit ni n’écrit plus de fichiers JSON de préférences TTS, et le
  résolveur de chemin hérité vit dans le module de migration doctor.
- Les métadonnées de cible secrète parlent désormais de magasins au lieu de prétendre que chaque
  cible d’identifiants est un fichier de configuration. `openclaw.json` reste le magasin de configuration ;
  les cibles de profils d’authentification utilisent des lignes SQLite typées `auth_profile_stores` avec
  des identifiants façonnés par fournisseur conservés comme charges utiles JSON.
- L’audit des secrets ne parcourt plus les fichiers `auth.json` par agent retirés. Doctor possède
  l’avertissement, l’importation et la suppression de ce fichier hérité.
- Les assistants de chemins de profils d’authentification hérités vivent désormais dans le code hérité doctor. Les assistants de chemins de profils
  d’authentification du cœur exposent l’identité et les emplacements d’affichage du magasin d’authentification SQLite,
  pas les chemins d’exécution `auth-profiles.json` ou `auth-state.json`.
- Les modules d’exécution de récupération des exécutions de sous-agents et de cache de capacités de modèles OpenRouter
  gardent désormais les lecteurs/écrivains d’instantanés SQLite séparés des assistants d’import JSON hérités
  réservés à doctor. Les capacités OpenRouter utilisent les lignes génériques typées
  `model_capability_cache` sous `provider_id = "openrouter"` au lieu
  d’un blob de cache opaque unique ou d’une table hôte propre au fournisseur. Le `taskName` d’exécution de sous-agent
  est stocké dans la colonne typée `subagent_runs.task_name` ; la copie
  `payload_json` est une donnée de relecture/débogage, pas la source des champs d’affichage ou
  de recherche à chaud.
- `src/agents/filesystem/virtual-agent-fs.sqlite.ts` implémente un VFS SQLite
  sur la table `vfs_entries` de la base de données d’agent. Les lectures de répertoires, exports
  récursifs, suppressions et renommages utilisent des plages de préfixes indexées `(namespace, path)`
  au lieu de parcourir tout un espace de noms ou de s’appuyer sur une correspondance de chemin `LIKE`.
- `src/agents/runtime-worker.entry.ts` crée un VFS SQLite, un magasin d’artefacts d’outils,
  un magasin d’artefacts d’exécution et des magasins de cache délimités par exécution pour les workers.
- Les marqueurs d’achèvement de bootstrap d’espace de travail vivent désormais dans des lignes partagées typées
  `workspace_setup_state` indexées par chemin d’espace de travail résolu au lieu de
  `.openclaw/workspace-state.json` ; l’environnement d’exécution ne lit ni ne réécrit plus l’ancien
  marqueur d’espace de travail, et les API d’assistance ne transmettent plus un faux chemin
  `.openclaw/setup-state` uniquement pour dériver l’identité de stockage.
- Les approbations exec vivent désormais dans la ligne singleton SQLite partagée typée `exec_approvals_config`.
  Doctor importe l’ancien `~/.openclaw/exec-approvals.json` ;
  les écritures d’exécution ne créent, ne réécrivent ni ne signalent plus ce fichier comme emplacement actif
  de magasin. Le compagnon macOS lit et écrit la même ligne de table
  `state/openclaw.sqlite` ; il ne garde sur disque que le socket de prompt Unix
  car c’est de l’IPC, et non un état d’exécution durable.
- Les modules d’exécution d’identité d’appareil, d’authentification d’appareil et de bootstrap gardent désormais leurs
  lecteurs/écrivains d’instantanés SQLite séparés des assistants d’import JSON hérités réservés à doctor.
  L’identité d’appareil utilise des lignes typées `device_identities` et les jetons d’authentification d’appareil
  utilisent des lignes typées `device_auth_tokens`. Les écritures d’authentification d’appareil réconcilient les lignes
  par appareil/rôle au lieu de tronquer la table des jetons, et l’environnement d’exécution ne
  route plus les mises à jour de jeton unique via l’ancien adaptateur de magasin complet. L’ancien
  Les charges utiles JSON de version 1 n’existent que comme formes d’import/export de doctor.
- Le cache d’échange de jetons GitHub Copilot utilise la table SQLite partagée d’état de Plugin
  sous `github-copilot/token-cache/default`. C’est un état de cache appartenant au fournisseur,
  donc il n’ajoute volontairement pas de table de schéma hôte.
- La Compaction GitHub Copilot n’écrit plus de fichiers annexes d’espace de travail
  `openclaw-compaction-*.json`. Le harness appelle la RPC de Compaction d’historique du SDK pour la
  session SDK suivie, et OpenClaw conserve l’état durable de session/transcription dans
  SQLite au lieu de fichiers marqueurs de compatibilité.
- Le runtime Swift partagé (`OpenClawKit`) utilise les mêmes lignes
  `state/openclaw.sqlite` pour l’identité et l’authentification de l’appareil. Les helpers de l’application macOS
  importent les helpers SQLite partagés au lieu de posséder un second chemin JSON ou
  SQLite. Un ancien `identity/device.json` restant bloque la création d’identité
  jusqu’à ce que doctor l’importe dans SQLite, conformément à la porte de démarrage TypeScript et Android.
- L’identité d’appareil Android utilise le même matériau de clé compatible TypeScript
  stocké dans des lignes typées `state/openclaw.sqlite#table/device_identities`. Elle ne
  lit ni n’écrit jamais `openclaw/identity/device.json` ; un ancien fichier restant bloque
  le démarrage jusqu’à ce que doctor l’importe dans SQLite.
- Les jetons d’authentification d’appareil mis en cache sur Android utilisent aussi des lignes typées
  `state/openclaw.sqlite#table/device_auth_tokens` et partagent la même sémantique de jeton
  de version 1 que TypeScript et Swift. Le runtime ne lit plus les clés de compatibilité `SecurePrefs`
  `gateway.deviceToken*` ; elles relèvent uniquement de la logique de migration/doctor.
- L’historique des packages récents de notification Android utilise des lignes typées
  `android_notification_recent_packages`. Le runtime ne migre ni ne lit plus les anciennes clés CSV SharedPreferences.
- La création d’identité d’appareil échoue en mode fermé lorsqu’un ancien `identity/device.json`
  existe, lorsque la ligne d’identité SQLite est invalide, ou lorsque le magasin d’identité SQLite
  ne peut pas être ouvert. Doctor importe et supprime d’abord ce fichier, afin que le démarrage
  du runtime ne puisse pas faire pivoter silencieusement l’identité d’appairage avant la migration.
- La sélection d’identité d’appareil est une clé de ligne SQLite, pas un localisateur de fichier JSON. Les tests
  et les helpers Gateway transmettent des clés d’identité explicites ; seuls la migration doctor et la
  porte de démarrage en mode fermé connaissent le nom de fichier retiré `identity/device.json`.
- La compatibilité de réinitialisation de session réside désormais dans la migration de configuration doctor :
  `session.idleMinutes` est déplacé vers `session.reset.idleMinutes`,
  `session.resetByType.dm` est déplacé vers `session.resetByType.direct`, et la
  politique de réinitialisation du runtime ne lit que les clés de réinitialisation canoniques.
- La compatibilité de configuration héritée réside désormais sous `src/commands/doctor/`. La validation normale
  `readConfigFileSnapshot()` n’importe pas les détecteurs hérités de doctor
  et n’annote pas les problèmes hérités ; `runDoctorConfigPreflight()` ajoute ces problèmes pour
  la réparation/le rapport doctor. Le flux de configuration doctor importe
  `src/commands/doctor/legacy-config.ts`, et la réparation des anciens identifiants de profil OAuth réside
  sous
  `src/commands/doctor/legacy/oauth-profile-ids.ts`.
- Les commandes hors doctor n’exécutent pas automatiquement la réparation de configuration héritée. Par exemple,
  `openclaw update --channel` échoue désormais sur une configuration héritée invalide et demande à
  l’utilisateur d’exécuter doctor, au lieu d’importer silencieusement le code de migration doctor.
- Web push, APNs, Voice Wake, les vérifications de mise à jour et la santé de configuration utilisent désormais des tables SQLite partagées typées
  pour les abonnements, clés VAPID, enregistrements de Node, lignes de déclencheur,
  lignes de routage, état de notification de mise à jour et entrées de santé de configuration au lieu de
  blobs JSON opaques entiers. Les écritures de snapshots Web push et APNs réconcilient désormais
  les abonnements/enregistrements par clé primaire au lieu de vider leurs tables ;
  la santé de configuration fait de même par chemin de configuration.
  Leurs modules runtime gardent les lecteurs/rédacteurs de snapshots SQLite séparés des
  helpers d’import JSON hérités réservés à doctor.
- La configuration d’hôte Node utilise désormais une ligne singleton typée dans la base de données SQLite partagée ;
  doctor importe l’ancien fichier `node.json` avant l’utilisation normale du runtime.
- L’appairage appareil/Node, l’appairage de canal, les listes d’autorisation de canal et l’état de bootstrap
  utilisent désormais des lignes SQLite typées au lieu de blobs JSON opaques entiers. Les approbations de liaison de Plugin
  et l’état des tâches Cron suivent la même séparation : les modules runtime exposent
  des opérations adossées à SQLite et des helpers de snapshot neutres, et les écritures de snapshots d’appairage/bootstrap
  ainsi que d’approbation de liaison de Plugin réconcilient les lignes par clé primaire
  au lieu de tronquer les tables, tandis que doctor importe/supprime les anciens fichiers JSON via les modules
  `src/commands/doctor/legacy/*`.
- Les enregistrements de Plugins installés résident désormais dans l’index SQLite des Plugins installés.
  La lecture/écriture de configuration runtime ne migre ni ne préserve plus les anciennes
  données de configuration d’auteur `plugins.installs` ; doctor importe cette forme de configuration héritée
  dans SQLite avant l’utilisation normale du runtime.
- Les snapshots de récupération d’identifiants QQBot résident désormais dans l’état de Plugin SQLite sous
  `qqbot/credential-backups`. Le runtime n’écrit plus
  `qqbot/data/credential-backup*.json` ; doctor importe et supprime ces
  anciens fichiers de sauvegarde avec les autres entrées d’état QQBot.
- La planification du rechargement Gateway compare les snapshots de l’index SQLite des Plugins installés sous
  un espace de noms de diff interne `installedPluginIndex.installRecords.*`. Les décisions de rechargement
  du runtime n’enveloppent plus ces lignes dans de faux objets de configuration `plugins.installs`.
- La mise à niveau des identifiants de compte nommé Matrix n’a plus lieu pendant les lectures
  du runtime. Doctor possède le renommage de l’ancien fichier de premier niveau `credentials/matrix/credentials.json`
  lorsqu’un compte Matrix unique/par défaut peut être résolu.
- Les modules runtime d’appairage cœur et de Cron n’exportent plus de constructeurs de chemins JSON hérités.
  Les modules hérités appartenant à doctor construisent les chemins sources `pending.json`, `paired.json`,
  `bootstrap.json` et `cron/jobs.json` uniquement pour les tests d’import et
  la migration. La normalisation héritée de la forme des tâches Cron et l’import du journal d’exécution Cron
  résident sous `src/commands/doctor/legacy/cron*.ts`.
- `src/commands/doctor/legacy/runtime-state.ts` importe les fichiers d’état JSON hérités,
  y compris la configuration d’hôte Node, dans SQLite depuis doctor. Les nouveaux importeurs de fichiers hérités
  restent sous `src/commands/doctor/legacy/`.
- `src/commands/doctor/state-migrations.ts` importe les anciens `sessions.json` et
  transcriptions `*.jsonl` directement dans SQLite et supprime les sources réussies. Il
  ne fait plus transiter les transcriptions héritées racine par
  `agents/<agentId>/sessions/*.jsonl` et ne crée plus de cible JSONL canonique avant
  l’import.
- Les vérifications doctor d’intégrité d’état ne parcourent plus les anciens répertoires de session et
  ne proposent plus la suppression de JSONL orphelins. Les anciens fichiers de transcription sont uniquement
  des entrées de migration, et l’étape de migration possède l’import ainsi que la suppression des sources.
- L’import du registre sandbox hérité réside sous
  `src/commands/doctor/legacy/sandbox-registry.ts` ; les lectures et écritures actives du registre sandbox
  restent uniquement SQLite.
- La réparation héritée de santé/import de transcription de session réside sous
  `src/commands/doctor/legacy/session-transcript-health.ts` ; les modules de commandes runtime
  ne portent plus de code d’analyse de transcription JSONL ni de réparation de branche active.

Points forts de la consolidation/suppression effectuée :

- L'état des Plugins utilise désormais la base de données partagée
  `state/openclaw.sqlite`.
  L'ancien importateur auxiliaire `plugin-state/state.sqlite` local à la branche
  est supprimé, car cette disposition SQLite n'a jamais été livrée.
  Les assistants de sonde/test signalent le `databasePath` partagé au lieu
  d'exposer un chemin SQLite propre à l'état des Plugins.
- Les tables d'exécution des tâches et des Task Flows résident désormais dans la
  base de données partagée `state/openclaw.sqlite` au lieu de
  `tasks/runs.sqlite` et `tasks/flows/registry.sqlite`; les anciens importateurs
  auxiliaires sont supprimés pour la même raison de disposition non livrée.
- `src/config/sessions/store.ts` n'a plus besoin de `storePath` pour les
  métadonnées entrantes, les mises à jour de routes ni les lectures
  `updated-at`. La persistance des commandes, le nettoyage des sessions CLI, la
  profondeur des sous-agents, les remplacements d'authentification et l'identité
  de session des transcriptions utilisent les API de lignes agent/session. Les
  écritures sont appliquées comme des correctifs de lignes SQLite avec nouvelle
  tentative en cas de conflit optimiste.
- La résolution de cible de session expose désormais des cibles de base de
  données par agent, et non d'anciens chemins `sessions.json`. Le Gateway
  partagé, les métadonnées ACP, la réparation des routes par doctor et
  `openclaw sessions` énumèrent `agent_databases` ainsi que les agents
  configurés.
- Le routage de session du Gateway utilise désormais
  `resolveGatewaySessionDatabaseTarget`; la cible renvoyée transporte
  `databasePath` et les clés candidates de lignes SQLite au lieu d'un ancien
  chemin de fichier de magasin de sessions.
- Les types d'exécution de session de canal exposent désormais
  `{agentId, sessionKey}` pour les lectures `updated-at`, les métadonnées
  entrantes et les mises à jour de dernière route. L'ancien type de compatibilité
  `saveSessionStore(storePath, store)` a disparu.
- Les surfaces du runtime Plugin, de l'API d'extension et du barrel
  `config/sessions` orientent désormais le code Plugin vers les assistants de
  lignes de session adossés à SQLite. Les exports de compatibilité de la
  bibliothèque racine (`loadSessionStore`, `saveSessionStore`,
  `resolveStorePath`) restent sous forme de shims obsolètes pour les
  consommateurs existants. L'ancien assistant `resolveLegacySessionStorePath` a
  disparu; la construction des anciens chemins `sessions.json` est désormais
  locale aux migrations et aux fixtures de test.
- `src/config/sessions/session-entries.sqlite.ts` stocke désormais les entrées
  de session canoniques dans la base de données par agent et prend en charge les
  correctifs de lecture/upsert/suppression au niveau des lignes. Les opérations
  runtime d'upsert/correctif/suppression ne recherchent plus de variantes de
  casse et n'élaguent plus les clés d'alias héritées; doctor possède la
  canonicalisation. L'assistant autonome d'import JSON a disparu, et la
  migration fusionne les lignes plus récentes par upsert au lieu de remplacer
  toute la table des sessions. Les assistants publics de lecture/liste/chargement
  projettent les métadonnées de session actives depuis les lignes typées
  `sessions` et `conversations`; `entry_json` est une ombre de
  compatibilité/débogage et peut être obsolète ou invalide sans perte de
  l'identité de session typée ni du contexte de livraison.
- `src/config/sessions/delivery-info.ts` résout désormais le contexte de
  livraison depuis les lignes typées par agent `sessions` + `conversations` +
  `session_conversations`. Il ne reconstruit plus l'identité de livraison runtime
  depuis `session_entries.entry_json`; une ligne de conversation typée manquante
  est un problème de migration/réparation doctor, pas un fallback runtime.
- Les décisions de réinitialisation de session stockée préfèrent désormais les
  métadonnées typées `sessions.session_scope`, `sessions.chat_type` et
  `sessions.channel`. L'analyse de `sessionKey` ne reste utilisée que pour les
  suffixes explicites de fil/sujet sur les cibles de commande; la classification
  réinitialisation de groupe vs directe ne provient plus de la forme de la clé.
- La classification de l'affichage liste/statut des sessions utilise désormais
  les métadonnées de conversation typées et le type de session du Gateway. Elle
  ne traite plus les sous-chaînes `:group:` ou `:channel:` dans `session_key`
  comme vérité durable groupe/direct.
- La sélection de la politique de réponse silencieuse utilise désormais
  uniquement le type de conversation explicite ou les métadonnées de surface.
  Elle ne devine plus la politique directe/groupe depuis les sous-chaînes de
  `session_key`.
- La résolution du modèle d'affichage de session reçoit désormais l'id d'agent
  depuis la cible de base de données de session SQLite au lieu de l'extraire de
  `session_key`.
- L'hydratation de la cible d'annonce agent-à-agent utilise désormais uniquement
  le `deliveryContext` typé de `sessions.list`. Elle ne récupère plus le routage
  canal/compte/fil depuis l'ancien `origin`, les champs `last*` miroirs ou la
  forme de `session_key`.
- Le rejet de cible de fil `sessions_send` lit désormais les métadonnées de
  routage SQLite typées. Il ne rejette ni n'accepte plus les cibles en analysant
  les suffixes de fil dans la clé cible.
- La validation de politique d'outils limitée au groupe lit désormais le routage
  de conversation SQLite typé pour la session actuelle ou engendrée. Elle ne
  fait plus confiance à l'identité groupe/canal en décodant `sessionKey`; les ids
  de groupe fournis par l'appelant sont abandonnés lorsqu'aucune ligne de session
  typée ne les atteste.
- La correspondance des remplacements de modèle par canal utilise désormais des
  métadonnées explicites de groupe et de conversation parente. Elle ne décode
  plus les ids de conversation parente depuis `parentSessionKey`.
- L'héritage des remplacements de modèle stockés exige désormais une clé de
  session parente explicite provenant du contexte de session typé. Il ne dérive
  plus les remplacements parents depuis les suffixes `:thread:` ou `:topic:` dans
  `sessionKey`.
- L'ancien wrapper d'informations de fil de session et l'analyseur de fil de
  Plugin chargé ont disparu; aucun code runtime n'importe
  `config/sessions/thread-info`.
- L'assistant de conversation de canal n'expose plus de ponts d'analyse de clé de
  session complète. Le cœur normalise toujours les ids bruts de conversation
  détenus par le fournisseur via `resolveSessionConversation(...)`, mais il ne
  reconstruit pas les faits de route depuis `sessionKey`.
- La livraison de complétion, la politique d'envoi et la maintenance des tâches
  ne dérivent plus le type de conversation de la forme de `session_key`.
  L'ancien analyseur de clé de type de conversation a été supprimé; ces chemins
  exigent des métadonnées de session typées, un contexte de livraison typé ou un
  vocabulaire explicite de cible de livraison.
- La liste/statut des sessions, les diagnostics, la liaison de compte
  d'approbation, le filtrage Heartbeat du TUI et les résumés d'utilisation
  n'extraient plus le routage fournisseur/compte/fil/affichage de
  `SessionEntry.origin`. Les seules lectures runtime restantes de `origin` sont
  des concepts hors session ou des objets de livraison du tour courant.
- La recherche de conversation native des demandes d'approbation lit désormais
  les lignes de routage de session typées par agent. Elle n'analyse plus
  l'identité de conversation canal/groupe/fil depuis `sessionKey`; les
  métadonnées typées manquantes relèvent d'un problème de migration/réparation.
- Les charges utiles d'événements Gateway session changed/chat/session ne
  répercutent plus `SessionEntry.origin` ni les ombres de route `last*`; les
  clients reçoivent `channel`, `chatType` et `deliveryContext` typés.
- La résolution de livraison Heartbeat peut désormais recevoir directement le
  `deliveryContext` SQLite typé, et le runtime Heartbeat transmet la ligne de
  livraison de session par agent au lieu de s'appuyer sur les ombres de
  compatibilité `session_entries` pour le routage courant.
- La résolution de cible de livraison d'agent isolé Cron hydrate également sa
  route courante depuis la ligne de livraison de session typée par agent avant de
  revenir à la charge utile d'entrée de compatibilité.
- La résolution d'origine d'annonce de sous-agent propage désormais le contexte
  de livraison typé de la session demandeuse via `loadRequesterSessionEntry` et
  préfère cette ligne aux ombres de compatibilité `last*`/`deliveryContext`.
- Les mises à jour de métadonnées de session entrantes fusionnent désormais
  d'abord avec la ligne de livraison typée par agent; les anciens champs de
  livraison `SessionEntry` ne sont que le fallback lorsqu'aucune ligne de
  conversation typée n'existe.
- L'extraction de livraison restart/update laisse désormais le `threadId` de
  livraison SQLite typé l'emporter sur les fragments de sujet/fil analysés
  depuis `sessionKey`; l'analyse n'est qu'un fallback pour les anciennes clés en
  forme de fil.
- Les ids de canal du contexte d'agent hook préfèrent désormais l'identité de
  conversation SQLite typée, puis les métadonnées explicites du message. Ils
  n'analysent plus les fragments fournisseur/groupe/canal depuis `sessionKey`.
- L'héritage de route externe `chat.send` du Gateway lit désormais les
  métadonnées de routage de session SQLite typées au lieu d'inférer la portée
  canal/direct/groupe à partir de morceaux de `sessionKey`. Les sessions limitées
  au canal n'héritent que lorsque le canal de session typé et le type de
  conversation correspondent au contexte de livraison stocké; les sessions
  principales partagées conservent leur règle plus stricte
  CLI/absence-de-métadonnées-client.
- Le réveil par sentinelle de redémarrage et le routage de continuation lisent
  désormais les lignes de livraison/routage SQLite typées avant de mettre en file
  les réveils Heartbeat ou les continuations de tour d'agent routées. Ils ne
  reconstruisent plus le contexte de livraison depuis l'ombre JSON d'entrée de
  session.
- La résolution de contexte `tools.effective` du Gateway lit désormais les lignes
  de livraison/routage SQLite typées pour les entrées fournisseur, compte, cible,
  fil et mode de réponse. Elle ne récupère plus ces champs de routage actifs
  depuis les ombres `origin` obsolètes de `session_entries.entry_json`.
- Le routage de consultation vocale en temps réel résout désormais la livraison
  parent/appel depuis des lignes de session SQLite typées par agent. Il ne
  revient plus aux ombres de compatibilité `SessionEntry.deliveryContext` lors du
  choix de la route de message de l'agent intégré.
- Le relais Heartbeat de spawn ACP et le routage du flux parent lisent désormais
  la livraison parente depuis des lignes de session SQLite typées. Ils ne
  reconstruisent plus le contexte de livraison parent depuis les ombres d'entrée
  de session de compatibilité.
- La préservation de route de livraison de session suit désormais les
  métadonnées de conversation typées et les colonnes de livraison persistées.
  Elle n'extrait plus les indices de canal, les marqueurs direct/main ni la forme
  de fil depuis `sessionKey`; les routes webchat internes n'héritent d'une cible
  externe que lorsque SQLite possède déjà une identité de livraison
  typée/persistée pour la session.
- L'extraction générique de livraison de session ne lit désormais que la ligne de
  livraison de session SQLite typée exacte. Elle n'analyse plus les suffixes
  fil/sujet et ne revient plus d'une clé en forme de fil à une clé de session de
  base.
- La distribution des réponses, la récupération par sentinelle de redémarrage et
  le routage de consultation vocale en temps réel utilisent désormais les lignes
  SQLite typées exactes de session/conversation pour le routage des fils. Ils ne
  récupèrent plus les ids de fil ni le contexte de livraison de session de base
  en analysant les clés de session en forme de fil.
- La limitation de l'historique PI intégré utilise désormais la projection de
  routage de session SQLite typée (`sessions` + `conversations` principales)
  pour le fournisseur, le type de conversation et l'identité du pair. Elle
  n'analyse plus la forme fournisseur, DM, groupe ou fil depuis `sessionKey`.
- L'inférence de livraison des outils Cron utilise désormais uniquement une
  livraison explicite ou le contexte de livraison typé courant. Elle ne décode
  plus les cibles canal, pair, compte ou fil depuis `agentSessionKey`.
- Les lignes de session runtime ne portent plus l'ancien alias de route
  `lastProvider`. Les assistants et les tests utilisent les champs typés
  `lastChannel` et `deliveryContext`; la migration doctor est le seul endroit qui
  doit traduire les anciens alias de route ou les ombres `origin` persistées.
- Les événements de transcription, les lignes VFS et les lignes d'artefacts
  d'outils s'écrivent désormais dans la base de données par agent. La table
  globale non livrée de correspondance des fichiers de transcription a disparu;
  doctor enregistre plutôt les anciens chemins sources dans des lignes de
  migration durables.
- La recherche de transcription runtime ne parcourt plus les décalages d'octets
  JSONL et ne sonde plus les anciens fichiers de transcription. Les chemins
  Gateway chat/média/historique lisent les lignes de transcription depuis
  SQLite; le JSONL de session n'est désormais qu'une entrée héritée pour doctor,
  pas un état runtime ni un format d'export.
- Les relations parent et branche de transcription utilisent des métadonnées
  structurées `parentTranscriptScope: {agentId, sessionId}` dans les en-têtes de
  transcription SQLite, et non des chaînes de localisation de type chemin
  `agent-db:...transcript_events...`.
- Le contrat du gestionnaire de transcription n'expose plus de constructeurs
  implicites persistés `create(cwd)` ou `continueRecent(cwd)`. Les gestionnaires
  de transcription persistés sont ouverts avec une portée explicite
  `{agentId, sessionId}`; seuls les gestionnaires en mémoire restent sans portée
  pour les tests et les transformations de transcription pures.
- Les API runtime de magasin de transcription résolvent une portée SQLite, pas
  des chemins de système de fichiers. L'ancien assistant `resolve...ForPath` et
  les options d'écriture `transcriptPath` inutilisées ont disparu des appelants
  runtime.
- La résolution de session runtime utilise désormais `{agentId, sessionId}` et
  ne doit pas dériver de chaînes `sqlite-transcript://<agent>/<session>` pour les
  frontières externes. Les anciens chemins JSONL absolus sont uniquement des
  entrées de migration doctor.
- Les enregistrements de pont direct du relais de hook natif résident désormais
  dans des lignes partagées typées `native_hook_relay_bridges` indexées par id
  de relais. Le runtime n'écrit plus de registre JSON `/tmp` ni
  d'enregistrements génériques opaques pour ces enregistrements de pont à courte
  durée de vie.
- `runEmbeddedPiAgent(...)` n'a plus de paramètre de localisateur de
  transcription.
  Les descripteurs de workers préparés omettent aussi les localisateurs de transcription. L’état de session d’exécution
  et les exécutions de suivi en file d’attente transportent `{agentId, sessionId}` au lieu de
  handles de transcription dérivés.
- La Compaction intégrée prend désormais la portée SQLite depuis `agentId` et `sessionId`.
  Les hooks de Compaction, les appels au moteur de contexte, la délégation CLI et les réponses de protocole
  ne doivent pas recevoir de handles `sqlite-transcript://...` dérivés. Le code
  d’export/débogage peut matérialiser des artefacts utilisateur explicites depuis les lignes, mais il ne fournit pas de
  chemin générique d’export JSONL de session ni ne réinjecte des noms de fichiers dans l’identité
  d’exécution.
- `/export-session` lit les lignes de transcription depuis SQLite et écrit uniquement la vue HTML
  autonome demandée. Le visualiseur intégré ne reconstruit ni ne
  télécharge plus le JSONL de session à partir de ces lignes.
- La délégation au moteur de contexte n’analyse plus un localisateur de transcription pour récupérer
  l’identité de l’agent. Le contexte d’exécution préparé transporte l’`agentId` résolu
  vers l’adaptateur de Compaction intégré.
- La réécriture de transcription et la troncature en direct des résultats d’outil lisent et persistent désormais
  l’état de transcription par `{agentId, sessionId}` et ne dérivent pas de localisateurs
  temporaires pour les charges utiles d’événement de mise à jour de transcription.
- La surface d’assistance d’état de transcription n’a plus de variantes basées sur des localisateurs
  `readTranscriptState`, `replaceTranscriptStateEvents` ou
  `persistTranscriptStateMutation`. Les appelants d’exécution doivent utiliser les API
  `{agentId, sessionId}`. L’import de Doctor lit les fichiers hérités par chemin de fichier explicite
  et écrit des lignes SQLite ; il ne migre pas les chaînes de localisateur.
- Le contrat du gestionnaire de sessions d’exécution n’expose plus `open(locator)`,
  `forkFrom(locator)` ni `setTranscriptLocator(...)`. Les gestionnaires de sessions
  persistés s’ouvrent uniquement par `{agentId, sessionId}` ; les assistants de liste/fork vivent sur
  des API de session et de checkpoint orientées lignes plutôt que sur la façade du gestionnaire
  de transcription.
- Les API de lecteur de transcription du Gateway privilégient la portée. Elles prennent
  `{agentId, sessionId}` et n’acceptent pas de localisateur de transcription positionnel qui
  pourrait devenir accidentellement l’identité d’exécution. L’analyse des localisateurs de transcription actifs
  a disparu ; les chemins source hérités ne sont lus que par le code d’import de Doctor.
- Les événements de mise à jour de transcription privilégient aussi la portée. `emitSessionTranscriptUpdate`
  n’accepte plus de chaîne de localisateur brute, et les écouteurs routent par
  `{agentId, sessionId}` sans analyser de handle.
- La diffusion des messages de session du Gateway résout les clés de session depuis la portée
  agent/session, et non depuis un localisateur de transcription. L’ancien résolveur/cache de clé
  localisateur-de-transcription-vers-session a disparu.
- Les filtres SSE de l’historique de session du Gateway filtrent les mises à jour en direct par portée agent/session. Ils ne
  canonicalisent plus les candidats localisateurs de transcription, les realpaths ni les identités
  de transcription en forme de fichier pour décider si un flux doit recevoir une mise à jour.
- Les hooks de cycle de vie de session ne dérivent ni n’exposent plus de localisateurs de transcription sur
  `session_end`. Les consommateurs de hooks reçoivent `sessionId`, `sessionKey`, les ids
  de session suivante et le contexte d’agent ; les fichiers de transcription ne font pas partie du contrat
  de cycle de vie.
- Les hooks de réinitialisation ne dérivent ni n’exposent plus non plus de localisateurs de transcription. La charge utile
  `before_reset` transporte les messages SQLite récupérés plus la raison de réinitialisation,
  tandis que l’identité de session reste dans le contexte du hook.
- La réinitialisation du harnais d’agent n’accepte plus de localisateur de transcription. La répartition de la réinitialisation est
  portée par `sessionId`/`sessionKey` plus la raison.
- Les types de session des extensions d’agent n’exposent plus `transcriptLocator` ; les extensions
  doivent utiliser le contexte de session et les API d’exécution plutôt que chercher une
  identité de transcription en forme de fichier.
- Les hooks de Compaction de Plugin n’exposent plus de localisateurs de transcription. Le contexte de hook
  transporte déjà l’identité de session, et les lectures de transcription doivent passer par des API
  tenant compte de la portée SQLite plutôt que par des handles en forme de fichier.
- Les hooks `before_agent_finalize` n’exposent plus `transcriptPath`, y compris
  dans les charges utiles de relais de hooks natifs. Les hooks de finalisation utilisent uniquement le contexte de session.
- Les réponses de réinitialisation du Gateway ne synthétisent plus de localisateur de transcription sur l’entrée
  retournée. La réinitialisation crée des lignes de transcription SQLite, retourne l’entrée de session
  propre et laisse l’accès aux transcriptions aux lecteurs tenant compte de la portée.
- Les résultats d’exécution intégrée et de Compaction n’exposent plus de localisateurs de transcription pour
  la comptabilisation de session. La Compaction automatique ne met à jour que le `sessionId` actif,
  les compteurs de Compaction et les métadonnées de jetons.
- Les résultats de tentative intégrée ne retournent plus `transcriptLocatorUsed`, et les résultats
  `compact()` du moteur de contexte ne retournent plus de localisateurs de transcription.
  Les boucles de nouvelle tentative d’exécution n’acceptent qu’un `sessionId` successeur.
- Les résultats d’ajout de transcription du miroir de livraison ne retournent plus de localisateurs de transcription. Les appelants obtiennent le `messageId` ajouté ; les signaux de mise à jour de transcription utilisent
  la portée SQLite.
- Les assistants de fork de session parente ne retournent que le `sessionId` forké. La préparation des sous-agents
  transmet aux moteurs la portée enfant agent/session.
- Les paramètres du lanceur CLI et le réensemencement de l’historique n’acceptent plus de localisateurs de transcription.
  Les lectures d’historique CLI résolvent la portée de transcription SQLite depuis `{agentId,
sessionId}` et le contexte de clé de session.
- Les fixtures de test CLI et du lanceur intégré ensemencent et lisent désormais les lignes de transcription SQLite
  par id de session au lieu de prétendre que les sessions actives sont des fichiers `*.jsonl` ou
  de transmettre une chaîne `sqlite-transcript://...` via les paramètres d’exécution.
- Les événements de garde des résultats d’outil de session sont émis depuis une portée de session connue même lorsqu’un
  gestionnaire en mémoire n’a pas de localisateur dérivé. Ses tests ne simulent plus de fichiers de transcription
  `/tmp/*.jsonl` actifs.
- Les assistants BTW et checkpoint de Compaction lisent et forkent désormais les lignes de transcription par
  portée SQLite. Les métadonnées de checkpoint ne stockent désormais que les ids de session et les ids leaf/entry ;
  les localisateurs dérivés ne sont plus écrits dans les charges utiles de checkpoint.
- La recherche de clé de transcription du Gateway utilise la portée de transcription SQLite aux frontières de protocole
  et ne fait plus de realpath ni de stat sur les noms de fichiers de transcription.
- La rotation automatique des transcriptions de Compaction écrit les lignes de transcription successeures
  directement via le magasin de transcriptions SQLite. Les lignes de session ne conservent que l’identité
  de session successeure, pas un chemin JSONL durable ni un localisateur persisté.
- La Compaction intégrée du moteur de contexte utilise les assistants de rotation de transcription nommés SQLite.
  Les tests de rotation ne construisent plus de chemins successeurs JSONL ni ne modélisent les sessions actives
  comme des fichiers.
- La conservation des images sortantes gérées indexe son cache de messages de transcription depuis les statistiques
  de transcription SQLite plutôt que depuis des appels stat du système de fichiers.
- Les verrous de session d’exécution et la voie Doctor autonome héritée `.jsonl.lock`
  ont été supprimés.
- Le barrel d’exécution Microsoft Teams et le SDK Plugin public ne réexportent plus
  l’ancien assistant de verrouillage de fichier ; les chemins d’état durable de Plugin sont adossés à SQLite.
- L’élagage par âge/nombre de sessions et le nettoyage explicite de session ont été supprimés.
  Doctor possède l’import hérité ; les sessions obsolètes sont réinitialisées ou supprimées explicitement.
- Les contrôles d’intégrité Doctor ne comptent plus un fichier JSONL hérité comme transcription active valide
  pour une ligne de session SQLite. La santé des transcriptions actives est uniquement SQLite ;
  les fichiers JSONL hérités sont signalés comme entrées de migration/nettoyage d’orphelins.
- Doctor ne traite plus `agents/<agent>/sessions/` comme état d’exécution requis.
  Il ne scanne ce répertoire que lorsqu’il existe déjà, comme entrée d’import hérité
  ou de nettoyage d’orphelins.
- Les chemins Gateway `sessions.resolve`, patch/reset/compact de session, génération de sous-agents,
  abandon rapide, métadonnées ACP, sessions isolées par Heartbeat et correction TUI
  ne migrent ni n’élaguent plus les clés de session héritées comme effet secondaire du
  travail d’exécution normal.
- La résolution de session des commandes CLI retourne désormais l’`agentId` propriétaire au lieu d’un
  `storePath`, et ne copie plus les lignes de session principale héritées pendant la résolution normale
  `--to` ou `--session-id`. La canonicalisation des lignes principales héritées appartient
  uniquement à Doctor.
- La résolution de profondeur des sous-agents d’exécution ne lit plus `sessions.json` ni les magasins de sessions JSON5.
  Elle lit les `session_entries` SQLite par id d’agent, et les métadonnées héritées
  de profondeur/session ne peuvent entrer que par le chemin d’import de Doctor.
- Les substitutions de session de profil d’authentification persistent par upserts directs de lignes `{agentId, sessionKey}`
  au lieu de charger paresseusement une exécution de magasin de sessions en forme de fichier.
- Le filtrage verbeux d’auto-réponse et les assistants de mise à jour de session lisent/upsertent désormais les lignes de session SQLite
  par identité de session et ne nécessitent plus un chemin de magasin hérité
  avant de toucher l’état de ligne persisté.
- Les assistants de métadonnées de session d’exécution de commande utilisent désormais des noms et chemins de module
  orientés entrée ; l’ancienne surface d’assistance de commande `session-store` a été supprimée.
- L’ensemencement des en-têtes de bootstrap et le durcissement manuel des limites de Compaction mutent désormais
  directement les lignes de transcription SQLite. Les appelants d’exécution transmettent l’identité de session, pas
  des chemins `.jsonl` inscriptibles.
- La relecture silencieuse de rotation de session copie les tours utilisateur/assistant récents par
  `{agentId, sessionId}` depuis les lignes de transcription SQLite. Elle n’accepte plus
  de localisateurs de transcription source ou cible.
- Les nouvelles lignes de session d’exécution ne stockent plus de localisateurs de transcription. Les appelants utilisent
  directement `{agentId, sessionId}` ; les commandes d’export/débogage peuvent choisir les noms de fichiers de sortie
  lorsqu’elles matérialisent les lignes.
- Le démarrage d’une nouvelle session de transcription persistée ouvre désormais toujours les lignes SQLite par
  portée. Le gestionnaire de sessions ne réutilise plus un ancien chemin ou localisateur de transcription
  de l’époque des fichiers comme identité de la nouvelle session.
- Les sessions de transcription persistées utilisent l’API explicite
  `openTranscriptSessionManagerForSession({agentId, sessionId})`. Les anciennes
  façades statiques `SessionManager.create/openForSession/list/forkFromSession` ont
  disparu afin que les tests et le code d’exécution ne puissent pas recréer accidentellement la découverte de sessions
  de l’époque des fichiers.
- L’exécution de Plugin n’expose plus `api.runtime.agent.session.resolveTranscriptLocatorPath` ;
  le code de Plugin utilise les assistants de lignes SQLite et les valeurs de portée.
- La surface SDK publique `session-store-runtime` n’exporte désormais que les assistants de lignes de session
  et de lignes de transcription. Les assistants ciblés de schéma/chemin/transaction SQLite
  vivent dans `sqlite-runtime` ; les assistants bruts d’ouverture/fermeture/réinitialisation restent locaux uniquement
  pour les tests internes.
- Les classificateurs hérités de noms de fichiers `.jsonl` de trajectoire/checkpoint vivent désormais dans le
  module Doctor de fichiers de session hérités. La validation de session du cœur n’importe plus
  d’assistants d’artefacts de fichiers pour décider des ids de session SQLite normaux.
- Les exécutions de sous-agents bloquants Active Memory utilisent les lignes de transcription SQLite au lieu de
  créer des fichiers `session.jsonl` temporaires ou persistés sous l’état de Plugin. L’ancienne
  option `transcriptDir` est supprimée.
- La génération ponctuelle de slugs et les exécutions du planificateur Crestodian utilisent les lignes de transcription SQLite
  au lieu de créer des fichiers `session.jsonl` temporaires.
- Les exécutions d’assistant `llm-task` et l’extraction d’engagements cachés utilisent également les lignes
  de transcription SQLite, de sorte que ces sessions d’assistant uniquement modèle ne créent plus
  de fichiers de transcription JSON/JSONL temporaires.
- `TranscriptSessionManager` n’est désormais qu’une portée de transcription SQLite ouverte.
  Le code d’exécution l’ouvre avec `openTranscriptSessionManagerForSession({agentId,
sessionId})` ; les flux de création, branchement, continuation, liste et fork vivent dans leurs
  assistants de lignes SQLite propriétaires plutôt que dans des façades statiques de gestionnaire.
  Le code Doctor/import/débogage gère les fichiers source hérités explicites hors du
  gestionnaire de sessions d’exécution.
- Les méthodes de façade obsolètes `SessionManager.newSession()` et
  `SessionManager.createBranchedSession()` ont été supprimées. Les nouvelles
  sessions et les descendants de transcription sont créés par leur workflow SQLite
  propriétaire au lieu de muter un gestionnaire déjà ouvert en une session persistée
  différente.
- Les décisions de fork de transcription parente et la création de fork n’acceptent plus
  `storePath` ni `sessionsDir` ; elles utilisent la portée de transcription SQLite
  `{agentId, sessionId}` au lieu de métadonnées de chemin de système de fichiers conservées.
- Memory-host n’exporte plus d’assistants no-op de classification des transcriptions de répertoire de session ;
  le filtrage des transcriptions dérive désormais des métadonnées de lignes SQLite pendant la construction des entrées.
- Les tests Memory-host et QMD d’export de session utilisent les portées de transcription SQLite. Les anciens
  chemins `agents/<agentId>/sessions/*.jsonl` ne restent couverts que lorsqu’un test
  prouve intentionnellement la compatibilité Doctor/import/export.
- L’inspection brute de session QA-lab utilise désormais `sessions.list` via le Gateway
  au lieu de lire `agents/qa/sessions/sessions.json`; les retours MSteams
  s’ajoutent directement aux transcriptions SQLite sans fabriquer de chemin JSONL.
- Les tours entrants des canaux partagés transportent désormais `{agentId, sessionKey}` plutôt qu’un
  ancien `storePath`. LINE, WhatsApp, Slack, Discord, Telegram, Matrix, Signal,
  iMessage, BlueBubbles, Feishu, Google Chat, IRC, Nextcloud Talk, Zalo,
  Zalo Personal, QA Channel, Microsoft Teams, Mattermost, Synology Chat, Tlon,
  Twitch et QQBot lisent désormais les métadonnées updated-at des chemins d’enregistrement et enregistrent
  les lignes de session entrantes via l’identité SQLite.
- La persistance du localisateur de transcription est retirée des lignes de session actives.
  `resolveSessionTranscriptTarget` renvoie `agentId`, `sessionId` et des métadonnées
  de sujet facultatives; doctor est le seul code qui importe les noms de fichiers de transcription
  hérités.
- Les en-têtes de transcription d’exécution commencent à la version SQLite `1`. Les mises à niveau des anciennes
  formes JSONL V1/V2/V3 vivent uniquement dans l’import doctor et normalisent les en-têtes importés vers
  la version actuelle des transcriptions SQLite avant le stockage des lignes.
- Le garde database-first interdit désormais `SessionManager.listAll` et
  `SessionManager.forkFromSession`; les workflows de liste de sessions et de fork/restauration
  doivent rester sur les API SQLite par ligne/scopées.
- Le garde interdit également les anciens noms d’assistants d’analyse JSONL de transcription/de réparation active-branch
  hors du code doctor/import, afin que l’exécution ne puisse pas développer un second chemin de migration
  de transcriptions héritées.
- Les exécutions PI intégrées rejettent les handles de transcription entrants. Elles utilisent l’identité SQLite
  `{agentId, sessionId}` avant le lancement du worker, puis à nouveau avant que la tentative ne touche
  l’état de transcription. Une entrée obsolète `/tmp/*.jsonl` ne peut pas sélectionner une cible
  d’écriture d’exécution.
- Les enregistrements de trace de cache, de payload Anthropic, de flux brut et de chronologie de diagnostics
  s’écrivent désormais dans des lignes SQLite typées `diagnostic_events`. Les bundles de stabilité du Gateway
  s’écrivent désormais dans des lignes SQLite typées `diagnostic_stability_bundles`. Les anciens chemins de substitution
  JSONL `diagnostics.cacheTrace.filePath`, `OPENCLAW_CACHE_TRACE_FILE`,
  `OPENCLAW_ANTHROPIC_PAYLOAD_LOG_FILE` et
  `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH` sont supprimés, et la capture de stabilité normale
  n’écrit plus de fichiers `logs/stability/*.json`.
- La persistance Cron réconcilie désormais les lignes SQLite `cron_jobs` au lieu de
  supprimer/réinsérer toute la table des tâches à chaque sauvegarde. Les écritures en retour de cible Plugin
  mettent directement à jour les lignes cron correspondantes et conservent l’état cron d’exécution dans
  la même transaction de base de données d’état.
- Les appelants de l’exécution Cron utilisent désormais une clé de magasin cron SQLite stable. Les anciens
  chemins `cron.store` sont uniquement des entrées d’import doctor; les chemins de production Gateway, maintenance
  des tâches, statut, journal d’exécution et écriture en retour de cible Telegram utilisent
  `resolveCronStoreKey` et ne normalisent plus la clé comme un chemin. Le statut Cron
  signale désormais `storeKey` plutôt que l’ancien champ `storePath` en forme de fichier.
- Le chargement et la planification de l’exécution Cron ne normalisent plus les anciennes formes de tâches persistées
  telles que `jobId`, `schedule.cron`, `atMs` numérique, les booléens en chaîne ou
  `sessionTarget` manquant. L’import hérité doctor possède ces réparations avant l’insertion des lignes
  dans SQLite.
- Le spawn ACP ne résout ni ne persiste plus les chemins de fichiers JSONL de transcription. La configuration
  de spawn et de liaison de thread persiste directement la ligne de session SQLite et conserve l’id de session
  comme identité de transcription retenue.
- Les API de métadonnées de session ACP lisent/listent/upsert désormais les lignes SQLite par `agentId` et
  n’exposent plus `storePath` comme partie du contrat d’entrée de session ACP.
- La comptabilisation d’utilisation des sessions et l’agrégation d’utilisation du Gateway résolvent désormais les transcriptions
  uniquement par `{agentId, sessionId}`. Le cache coût/utilisation et les résumés de sessions découvertes
  ne synthétisent ni ne renvoient plus de chaînes de localisateur de transcription.
- L’ajout de chat Gateway, la persistance abort-partial, `/sessions.send` et
  les écritures de transcription de médias webchat ajoutent directement via la portée de transcription SQLite.
  L’assistant d’injection de transcription du Gateway n’accepte plus de paramètre
  `transcriptLocator`.
- La découverte de transcriptions SQLite liste désormais uniquement les portées et statistiques de transcription:
  `{agentId, sessionId, updatedAt, eventCount}`. L’assistant de compatibilité mort
  `listSqliteSessionTranscriptLocators` et le champ `locator` par ligne
  ont disparu.
- L’exécution de réparation de transcription expose désormais uniquement
  `repairTranscriptSessionStateIfNeeded({agentId, sessionId})`. L’ancien
  assistant de réparation basé sur un localisateur est supprimé; le code doctor/debug lit des
  chemins de fichiers source explicites et ne migre jamais de chaînes de localisateur.
- L’exécution du registre de replay ACP stocke désormais les lignes de replay par session dans la base de données d’état
  SQLite partagée au lieu de `acp/event-ledger.json`; doctor importe et
  supprime l’ancien fichier.
- Les assistants de lecture de transcription Gateway vivent désormais dans
  `src/gateway/session-transcript-readers.ts` au lieu de l’ancien nom de module
  `session-utils.fs`. La vérification d’historique de nouvelle tentative fallback est nommée d’après le contenu
  de transcription SQLite plutôt que l’ancienne surface d’assistant de fichier.
- Les assistants injected-chat et compaction du Gateway transmettent désormais la portée de transcription SQLite
  via des API d’assistance internes au lieu de nommer les valeurs comme des chemins de transcription ou
  fichiers source.
- La détection de continuation bootstrap vérifie désormais les lignes de transcription SQLite via
  `hasCompletedBootstrapTranscriptTurn`; elle n’expose plus de nom d’assistant en forme de fichier.
- Les tests embedded-runner utilisent désormais l’identité de transcription SQLite, et l’ouverture d’un nouveau
  gestionnaire de transcription exige toujours un `sessionId` explicite.
- Les assistants d’indexation mémoire utilisent désormais la terminologie de transcription SQLite de bout en bout:
  l’hôte exporte `listSessionTranscriptScopesForAgent` et
  `sessionTranscriptKeyForScope`, les files de synchronisation ciblées `sessionTranscripts`,
  les résultats publics de recherche de session exposent des chemins opaques `transcript:<agent>:<session>`,
  et la clé source de BD interne est `session:<session>` sous
  `source_kind='sessions'` au lieu d’un faux chemin de fichier.
- L’assistant generic plugin SDK persistent-dedupe n’expose plus d’options en forme de fichier.
  Les appelants fournissent des clés de portée SQLite et les lignes de déduplication durables vivent dans
  l’état Plugin partagé.
- Les jetons SSO Microsoft Teams sont passés de fichiers JSON verrouillés à l’état Plugin SQLite.
  Doctor importe `msteams-sso-tokens.json`, reconstruit les clés de jeton SSO canoniques
  à partir des payloads et supprime le fichier source. Les jetons OAuth délégués restent
  sur leur frontière existante de fichiers d’identifiants privés.
- L’état de cache de synchronisation Matrix est passé de `bot-storage.json` à l’état Plugin
  SQLite. Doctor importe les anciens payloads de synchronisation bruts ou enveloppés et supprime le
  fichier source. Les clients Matrix actifs et QA Matrix transmettent un répertoire racine de magasin de synchronisation
  SQLite, pas un faux chemin `sync-store.json` ou `bot-storage.json`.
- Le statut de migration crypto héritée Matrix est passé de
  `legacy-crypto-migration.json` à l’état Plugin SQLite. Doctor importe l’ancien
  fichier de statut; les snapshots IndexedDB du SDK Matrix sont passés de
  `crypto-idb-snapshot.json` à des blobs Plugin SQLite. Les clés de récupération et
  identifiants Matrix sont des lignes d’état Plugin SQLite; leurs anciens fichiers JSON sont uniquement des
  entrées de migration doctor.
- Les journaux d’activité Memory Wiki utilisent désormais l’état Plugin SQLite au lieu de
  `.openclaw-wiki/log.jsonl`. Le fournisseur de migration Memory Wiki importe les anciens
  journaux JSONL; le markdown wiki et le contenu du coffre utilisateur restent adossés à des fichiers comme
  contenu d’espace de travail.
- Memory Wiki ne crée plus `.openclaw-wiki/state.json` ni le répertoire inutilisé
  `.openclaw-wiki/locks`. Le fournisseur de migration supprime ces fichiers de métadonnées Plugin retirés
  si un ancien coffre les possède encore.
- Les entrées d’audit Crestodian utilisent désormais l’état Plugin SQLite central au lieu de
  `audit/crestodian.jsonl`. Doctor importe l’ancien journal d’audit JSONL et
  le supprime après import réussi.
- Les entrées d’audit d’écriture/observation de configuration utilisent désormais l’état Plugin SQLite central
  au lieu de `logs/config-audit.jsonl`. Doctor importe l’ancien journal d’audit JSONL et
  le supprime après import réussi.
- Le compagnon macOS n’écrit plus de sidecars locaux à l’app `logs/config-audit.jsonl` ou
  `logs/config-health.json` pendant l’édition de `openclaw.json`. Le fichier de configuration
  reste adossé à un fichier, les snapshots de récupération restent à côté du fichier de configuration,
  et l’état durable d’audit/santé de configuration appartient au magasin SQLite du Gateway.
- Les approbations en attente de secours Crestodian utilisent désormais l’état Plugin SQLite central au lieu de
  `crestodian/rescue-pending/*.json`. Doctor importe les anciens fichiers d’approbation en attente
  et les supprime après import réussi.
- L’état temporaire d’armement Phone Control utilise désormais l’état Plugin SQLite au lieu de
  `plugins/phone-control/armed.json`. Doctor importe l’ancien fichier d’état d’armement
  dans l’espace de noms `phone-control/arm-state` et supprime le fichier.
- Doctor ne répare plus les transcriptions JSONL sur place et ne crée plus de fichiers JSONL
  de sauvegarde. Il importe la branche active dans SQLite et supprime la source héritée.
- La recherche de transcription du hook session-memory utilise des lectures SQLite limitées à la portée
  `{agentId, sessionId}`. Son assistant n’accepte ni ne dérive plus de localisateurs de transcription,
  lectures de fichiers hérités ou options de réécriture de fichier.
- Les liaisons de conversation du serveur d’app Codex cléent désormais l’état Plugin SQLite par
  clé de session OpenClaw ou portée explicite `{agentId, sessionId}`. Elles ne doivent pas
  préserver les liaisons fallback par chemin de transcription.
- Les lectures d’historique miroir du serveur d’app Codex utilisent uniquement la portée de transcription SQLite;
  elles ne doivent pas récupérer l’identité à partir de chemins de fichiers de transcription.
- Les chemins de réinitialisation d’ordre des rôles et de compaction ne délient plus les anciens fichiers de transcription;
  la réinitialisation ne fait que faire tourner la ligne de session SQLite et l’identité de transcription.
- Les réponses de réinitialisation et de checkpoint Gateway renvoient des lignes de session propres plus les ids
  de session. Elles ne synthétisent plus de localisateurs de transcription SQLite pour les clients.
- Le dreaming memory-core ne purge plus les lignes de session en sondant l’absence de fichiers
  JSONL. Le nettoyage des sous-agents passe par l’API d’exécution de session plutôt que par
  des vérifications d’existence sur le système de fichiers. Ses tests d’ingestion de transcription sèment directement des lignes SQLite
  au lieu de créer des fixtures `agents/<id>/sessions` ou des espaces réservés de localisateur.
- L’indexation des transcriptions mémoire peut exposer `transcript:<agentId>:<sessionId>` comme un
  chemin virtuel de résultat de recherche pour les assistants de citation/lecture. La source durable de l’index est
  relationnelle (`source_kind='sessions'`, `source_key='session:<sessionId>'`,
  `session_id=<sessionId>`), donc la valeur n’est pas un localisateur de transcription d’exécution,
  pas un chemin de système de fichiers, et ne doit jamais être retransmise aux API d’exécution de session.
- Le statut mémoire doctor du Gateway lit les comptes de rappel court terme et de signaux de phase
  depuis des lignes d’état Plugin SQLite au lieu de `memory/.dreams/*.json`; la sortie CLI et
  doctor étiquette désormais ce stockage comme un magasin SQLite, pas comme un chemin.
- L’exécution memory-core, le statut CLI, les méthodes doctor du Gateway et les façades plugin SDK
  n’auditent ni n’archivent plus les anciens fichiers `.dreams/session-corpus`.
  Ces fichiers sont uniquement des entrées de migration; doctor les importe dans SQLite et
  supprime la source après vérification. Les lignes de preuve d’ingestion de session active
  utilisent désormais le chemin SQLite virtuel `memory/session-ingestion/<day>.txt`; l’exécution
  n’écrit ni ne dérive jamais d’état depuis `.dreams/session-corpus`.
- Les artefacts publics memory-core exposent les événements hôte SQLite comme l’artefact JSON virtuel
  `memory/events/memory-host-events.json`; ils ne réutilisent plus l’ancien chemin source
  `.dreams/events.jsonl`.
- Les registres de conteneurs/navigateurs sandbox utilisent désormais la table SQLite partagée
  `sandbox_registry_entries` avec des colonnes typées pour session, image, horodatage,
  backend/config et port de navigateur. Doctor importe les anciens fichiers de registre JSON monolithiques et
  fragmentés, puis supprime les sources réussies. Les lectures d’exécution utilisent
  les colonnes de ligne typées comme source de vérité; `entry_json` est uniquement une copie de replay/debug.
- Les commitments utilisent désormais une table partagée typée `commitments` au lieu d’un
  blob JSON couvrant tout le magasin. Les sauvegardes de snapshot upsert par id de commitment et ne suppriment que
  les lignes manquantes au lieu de vider et réinsérer la table. L’exécution charge les
  commitments depuis les colonnes typées de portée, fenêtre de livraison, statut, tentative et texte;
  `record_json` est uniquement une copie de replay/debug. Doctor importe l’ancien
  `commitments.json` et le supprime après un import réussi.
- Les définitions de tâches Cron, l’état de planification et l’historique d’exécution n’ont plus d’écrivains
  ni de lecteurs JSON à l’exécution. L’exécution utilise les lignes `cron_jobs` avec un planning typé,
  payload, delivery, failure-alert, session, status et colonnes runtime-state, ainsi que les métadonnées typées
  `cron_run_logs` pour le statut, le résumé des diagnostics, le statut/l’erreur de livraison,
  la session/l’exécution, le modèle et les totaux de tokens. `job_json` n’est qu’une copie de rejeu/débogage ; `state_json` conserve les diagnostics
  d’exécution imbriqués qui n’ont pas encore de champs de requête à chaud, tandis que l’exécution
  réhydrate les champs d’état à chaud depuis les colonnes typées. Doctor importe
  les anciens fichiers `jobs.json`, `jobs-state.json` et `runs/*.jsonl` et supprime
  les sources importées. Les écritures de retour des cibles de Plugin mettent à jour les lignes `cron_jobs`
  correspondantes au lieu de charger et remplacer tout le store cron.
- Le démarrage du Gateway ignore les anciens marqueurs `notify: true` dans la projection
  d’exécution. Doctor les traduit en livraison SQLite explicite lorsque
  `cron.webhook` est valide, supprime les marqueurs inertes lorsqu’il n’est pas défini et les conserve
  avec un avertissement lorsque le webhook configuré est invalide.
- Les files de livraison sortante et de session stockent désormais le statut de file, le type d’entrée,
  la clé de session, le canal, la cible, l’identifiant de compte, le nombre de tentatives, la dernière tentative/erreur,
  l’état de récupération et les marqueurs d’envoi plateforme comme colonnes typées dans la table partagée
  `delivery_queue_entries`. La récupération d’exécution lit ces champs à chaud depuis
  les colonnes typées, et les mutations de nouvelle tentative/récupération mettent à jour ces colonnes directement
  sans réécrire le JSON de rejeu. La charge utile JSON complète reste uniquement le
  blob de rejeu/débogage pour les corps de message et autres données froides de rejeu.
- Les enregistrements d’images sortantes gérées utilisent désormais des lignes partagées typées
  `managed_outgoing_image_records`, les octets média restant stockés dans
  `media_blobs`. L’enregistrement JSON reste uniquement une copie de rejeu/débogage.
- Les préférences du sélecteur de modèles Discord, les hachages de déploiement de commandes et les liaisons de fils
  utilisent désormais l’état de Plugin SQLite partagé. Leurs plans d’import JSON hérités vivent dans la
  surface de configuration/migration doctor du Plugin Discord, pas dans le code de migration du cœur.
- Les détecteurs d’import hérité de Plugin utilisent des modules nommés pour doctor, comme
  `doctor-legacy-state.ts` ou `doctor-state-imports.ts` ; les modules d’exécution de canal normaux
  ne doivent pas importer de détecteurs JSON hérités.
- Les curseurs de rattrapage BlueBubbles et les marqueurs de déduplication entrants utilisent désormais l’état de Plugin SQLite
  partagé. Leurs plans d’import JSON hérités vivent dans la surface de
  configuration/migration doctor du Plugin BlueBubbles, pas dans le code de migration du cœur.
- Les offsets de mise à jour Telegram, les lignes de cache d’autocollants, les lignes de cache de messages envoyés,
  les lignes de cache de noms de sujets et les liaisons de fils utilisent désormais l’état de Plugin SQLite
  partagé. Leurs plans d’import JSON hérités vivent dans la surface de
  configuration/migration doctor du Plugin Telegram, pas dans le code de migration du cœur.
- Les curseurs de rattrapage iMessage, les mappages d’identifiants courts de réponse et les lignes de déduplication d’écho envoyé
  utilisent désormais l’état de Plugin SQLite partagé. Les anciens fichiers `imessage/catchup/*.json`,
  `imessage/reply-cache.jsonl` et `imessage/sent-echoes.jsonl` sont
  uniquement des entrées doctor.
- Les lignes de déduplication des messages Feishu utilisent désormais l’état de Plugin SQLite partagé au lieu des
  fichiers `feishu/dedup/*.json`. Son plan d’import JSON hérité vit dans la surface de
  configuration/migration doctor du Plugin Feishu, pas dans le code de migration du cœur.
- Les conversations, sondages, tampons de téléversement en attente et apprentissages de retour Microsoft Teams
  utilisent désormais l’état de Plugin SQLite partagé et les tables de blobs. Le chemin de téléversement en attente
  utilise `plugin_blob_entries`, afin que les tampons média soient stockés comme BLOB SQLite
  au lieu de JSON base64. Les noms des helpers d’exécution utilisent désormais la terminologie SQLite/état
  plutôt que la terminologie de store fichier `*-fs`, et l’ancien shim `storePath` a disparu
  de ces stores. Son plan d’import JSON hérité vit dans la surface de
  configuration/migration doctor du Plugin Microsoft Teams.
- Les médias sortants hébergés Zalo utilisent désormais `plugin_blob_entries` SQLite partagé
  au lieu des sidecars temporaires JSON/bin `openclaw-zalo-outbound-media`.
- Le HTML et les métadonnées du visualiseur de diffs utilisent désormais `plugin_blob_entries` SQLite partagé
  au lieu des fichiers temporaires `meta.json`/`viewer.html`. Les sorties PNG/PDF rendues restent
  des matérialisations temporaires, car la livraison de canal a encore besoin d’un chemin de fichier.
- Les documents gérés Canvas utilisent désormais `plugin_blob_entries` SQLite partagé au lieu
  d’un répertoire `state/canvas/documents` par défaut. L’hôte Canvas sert ces
  blobs directement ; les fichiers locaux ne sont créés que pour le contenu opérateur explicite `host.root`
  ou la matérialisation temporaire lorsqu’un lecteur média en aval
  exige un chemin.
- Les décisions d’audit File Transfer utilisent désormais `plugin_state_entries` SQLite partagé
  au lieu du journal d’exécution non borné `audit/file-transfer.jsonl`. Doctor
  importe l’ancien fichier d’audit JSONL dans l’état de Plugin et supprime la source
  après un import propre.
- Les baux de processus ACPX et l’identité d’instance du Gateway utilisent désormais l’état de Plugin SQLite
  partagé. Doctor importe l’ancien fichier `gateway-instance-id` dans l’état de Plugin
  et supprime la source.
- Les scripts wrapper générés par ACPX et le home Codex isolé sont une
  matérialisation temporaire sous la racine temporaire OpenClaw, et non un état OpenClaw durable. Les
  enregistrements d’exécution ACPX durables sont les lignes SQLite de bail et d’instance Gateway ;
  l’ancienne surface de configuration ACPX `stateDir` est supprimée, car aucun état d’exécution
  n’y est plus écrit.
- Les pièces jointes média du Gateway utilisent désormais la table SQLite partagée `media_blobs` comme
  store canonique des octets. Les chemins locaux renvoyés aux surfaces de compatibilité de canal et sandbox
  sont des matérialisations temporaires de la ligne de base de données, et non le
  store média durable. Les listes d’autorisation média d’exécution n’incluent plus les anciennes racines
  `$OPENCLAW_STATE_DIR/media` ni `media` du répertoire de configuration ; ces répertoires sont
  uniquement des sources d’import doctor.
- La complétion shell n’écrit plus de fichiers cache `$OPENCLAW_STATE_DIR/completions/*`.
  Les chemins de fumée install, doctor, update et release utilisent la sortie de complétion
  générée ou le sourcing de profil au lieu de fichiers cache de complétion durables.
- Le staging de téléversement de Skills du Gateway utilise désormais des lignes partagées `skill_uploads`. Les métadonnées
  de téléversement, les clés d’idempotence et les octets d’archive vivent dans SQLite ; l’installateur
  ne reçoit qu’un chemin d’archive matérialisé temporaire pendant qu’une installation est
  en cours.
- Les pièces jointes inline de sous-agent ne se matérialisent plus sous
  `.openclaw/attachments/*` dans l’espace de travail. Le chemin de spawn prépare des entrées de graine SQLite VFS,
  les exécutions inline sèment ces entrées dans l’espace de noms scratch d’exécution par agent,
  et les outils adossés au disque superposent ce scratch SQLite pour les chemins de pièces jointes. Les
  anciennes colonnes de registre de répertoire de pièces jointes d’exécution de sous-agent et les hooks de nettoyage ont disparu.
- L’hydratation d’images CLI ne maintient plus de fichiers cache stables `openclaw-cli-images`.
  Les backends CLI externes reçoivent toujours des chemins de fichiers, mais ces chemins sont
  des matérialisations temporaires par exécution avec nettoyage.
- Les diagnostics cache-trace, les diagnostics de charge utile Anthropic, les diagnostics de flux de modèle brut,
  les événements de chronologie des diagnostics et les bundles de stabilité du Gateway écrivent désormais
  des lignes SQLite au lieu de fichiers `logs/*.jsonl` ou
  `logs/stability/*.json`.
  Les flags et variables d’environnement de surcharge de chemin d’exécution ont été supprimés ; les commandes d’export/débogage
  peuvent matérialiser explicitement des fichiers depuis les lignes de base de données.
- Le compagnon macOS n’a plus de writer roulant `diagnostics.jsonl`. Les journaux de l’app
  vont dans la journalisation unifiée, et les diagnostics durables du Gateway restent adossés à SQLite.
- La liste d’enregistrements du port-guardian macOS utilise désormais des lignes SQLite partagées typées
  `macos_port_guardian_records` au lieu d’un fichier JSON Application Support
  ou d’un blob singleton opaque.
- Les verrous singleton du Gateway utilisent désormais des lignes SQLite partagées typées `state_leases` sous
  le scope `gateway_locks` au lieu de fichiers de verrou dans le répertoire temporaire. Les docs de dépannage Fly et OAuth
  pointent désormais vers le verrou de bail/rafraîchissement d’auth SQLite au lieu
  de l’ancien nettoyage de verrous de fichiers.
- L’état sentinelle de redémarrage du Gateway utilise désormais des lignes SQLite partagées typées
  `gateway_restart_sentinel` au lieu de `restart-sentinel.json` ; l’exécution
  lit le type de sentinelle, le statut, le routage, le message, la continuation et les statistiques depuis
  des colonnes typées. `payload_json` est uniquement une copie de rejeu/débogage. Le code d’exécution efface
  directement la ligne SQLite et ne porte plus la plomberie de nettoyage de fichiers.
- L’intention de redémarrage du Gateway et l’état de transfert au superviseur utilisent désormais des lignes SQLite partagées typées
  `gateway_restart_intent` et `gateway_restart_handoff` au lieu des sidecars
  `gateway-restart-intent.json` et
  `gateway-supervisor-restart-handoff.json`.
- La coordination singleton du Gateway utilise désormais des lignes typées `state_leases` sous
  `gateway_locks` au lieu d’écrire des fichiers `gateway.<hash>.lock`. La ligne de bail
  possède le propriétaire du verrou, l’expiration, le Heartbeat et la charge utile de débogage ; SQLite possède la
  frontière atomique d’acquisition/libération. L’option retirée de répertoire de verrous fichier a
  disparu ; les tests utilisent directement l’identité de ligne SQLite.
- L’ancien helper non référencé de rapport d’utilisation cron qui analysait les fichiers `cron/runs/*.jsonl`
  a été supprimé. Les rapports d’historique d’exécution Cron doivent lire les lignes SQLite typées
  `cron_run_logs`.
- La récupération au redémarrage de session principale découvre désormais les agents candidats via le
  registre SQLite `agent_databases` au lieu d’analyser les répertoires `agents/*/sessions`.
- La récupération de corruption de session Gemini ne supprime désormais que la ligne de session SQLite ;
  elle n’a plus besoin d’un garde hérité `storePath` et n’essaie plus de dissocier un
  chemin JSONL de transcript dérivé.
- La gestion des surcharges de chemin traite désormais les valeurs d’environnement littérales `undefined`/`null`
  comme non définies, ce qui empêche la création accidentelle de bases de données
  `undefined/state/*.sqlite` à la racine du dépôt pendant les tests ou les transferts shell.
- Les empreintes de santé de configuration utilisent désormais des lignes SQLite partagées typées `config_health_entries`
  au lieu de `logs/config-health.json`, en gardant le fichier de configuration normal comme
  seul document de configuration non identifiant. Le compagnon macOS ne conserve que
  l’état de santé local au processus et ne recrée pas l’ancien sidecar JSON.
- L’exécution des profils d’auth n’importe ni n’écrit plus de fichiers JSON d’identifiants. Le
  store d’identifiants canonique est SQLite ; `auth-profiles.json`, les fichiers
  `auth.json` par agent et le fichier partagé `credentials/oauth.json` sont des entrées de migration doctor
  supprimées après import.
- Les tests de sauvegarde/état de profil d’auth vérifient désormais directement les tables d’auth SQLite typées
  et n’utilisent les anciens noms de fichiers de profils d’auth que comme entrées de migration doctor.
- `openclaw secrets apply` nettoie uniquement le fichier de configuration, le fichier d’environnement et le store
  de profils d’auth SQLite. Il ne porte plus de logique de compatibilité qui édite
  l’ancien `auth.json` par agent ; doctor possède l’import et la suppression de ce fichier.
- Les plans et applications de migration de secrets Hermes importent les profils de clés API directement
  dans le store de profils d’auth SQLite. Ils n’écrivent ni ne vérifient plus
  `auth-profiles.json` comme cible intermédiaire.
- Les docs d’auth destinées aux utilisateurs décrivent désormais
  `state/openclaw.sqlite#table/auth_profile_stores/<agentDir>` au lieu de
  demander aux utilisateurs d’inspecter ou de copier `auth-profiles.json` ; les anciens noms JSON OAuth/auth
  restent documentés uniquement comme entrées d’import doctor.
- Les helpers de chemin d’état du cœur n’exposent plus l’ancien fichier `credentials/oauth.json`.
  L’ancien nom de fichier est local au chemin d’import d’auth doctor.
- Les docs install, sécurité, onboarding, auth modèle et SecretRef décrivent désormais
  les lignes de profils d’auth SQLite et la sauvegarde/migration de tout l’état au lieu de
  fichiers JSON de profils d’auth par agent.
- La découverte de modèles PI transmet désormais les identifiants canoniques au stockage d’auth en mémoire
  `pi-coding-agent`. Elle ne crée, ne nettoie ni n’écrit plus
  `auth.json` par agent pendant la découverte.
- Les paramètres de déclencheur et de routage Voice Wake utilisent désormais des tables SQLite partagées typées
  au lieu de `settings/voicewake.json`, `settings/voicewake-routing.json` ou
  de lignes génériques opaques ; doctor importe les anciens fichiers JSON et les supprime après une
  migration réussie.
- L’état de vérification des mises à jour utilise désormais une ligne partagée typée `update_check_state` au lieu de
  `update-check.json` ou d’un blob générique opaque ; doctor importe
  l’ancien fichier JSON et le supprime après une migration réussie.
- L’état de santé de configuration utilise désormais des lignes partagées typées `config_health_entries` au lieu de
  `logs/config-health.json` ou d’un blob générique opaque ; doctor
  importe l’ancien fichier JSON et le supprime après une migration réussie.
- Les approbations de liaison de conversation de Plugin utilisent désormais des lignes typées
  `plugin_binding_approvals` au lieu d’un état SQLite partagé opaque ou
  `plugin-binding-approvals.json`; le fichier hérité est une entrée de migration doctor.
- Les liaisons génériques de conversation actuelle stockent désormais des lignes typées
  `current_conversation_bindings` au lieu de réécrire
  `bindings/current-conversations.json`; doctor importe l’ancien fichier JSON et le
  supprime après une migration réussie.
- Les journaux de synchronisation des sources importées de Memory Wiki stockent désormais une ligne d’état de Plugin SQLite
  par clé de coffre/source au lieu de réécrire `.openclaw-wiki/source-sync.json`;
  le fournisseur de migration importe et supprime l’ancien journal JSON.
- Les enregistrements d’exécutions d’import ChatGPT de Memory Wiki stockent désormais une ligne d’état de Plugin SQLite
  par coffre/id d’exécution au lieu d’écrire `.openclaw-wiki/import-runs/*.json`.
  Les instantanés de restauration restent des fichiers de coffre explicites jusqu’à ce que l’archivage
  des instantanés d’exécution d’import soit déplacé vers le stockage blob.
- Les condensés compilés de Memory Wiki stockent désormais des lignes de blobs de Plugin SQLite au lieu
  d’écrire `.openclaw-wiki/cache/agent-digest.json` et
  `.openclaw-wiki/cache/claims.jsonl`. Le fournisseur de migration importe les anciens fichiers de cache
  et supprime le répertoire de cache lorsqu’il devient vide.
- Le suivi des installations de Skills ClawHub stocke désormais une ligne d’état de Plugin SQLite par
  espace de travail/skill au lieu d’écrire ou de lire les fichiers auxiliaires `.clawhub/lock.json` et
  `.clawhub/origin.json` à l’exécution. Le code d’exécution utilise des objets d’état d’installation suivie
  plutôt que des abstractions de fichier de verrouillage/origine de forme fichier. Doctor
  importe les anciens fichiers auxiliaires depuis les espaces de travail d’agents configurés et les supprime
  après une importation propre.
- L’index des Plugins installés lit et écrit désormais la ligne singleton SQLite partagée typée
  `installed_plugin_index` au lieu de `plugins/installs.json`; l’ancien
  fichier JSON n’est qu’une entrée de migration doctor et est supprimé après importation.
- L’ancien assistant de chemin `plugins/installs.json` vit désormais dans le code doctor hérité.
  Les modules d’index de Plugins d’exécution n’exposent que des options de persistance
  adossées à SQLite, pas un chemin de fichier JSON.
- La sentinelle de redémarrage du Gateway, l’intention de redémarrage et l’état de transfert au superviseur utilisent désormais
  des lignes SQLite partagées typées (`gateway_restart_sentinel`,
  `gateway_restart_intent` et `gateway_restart_handoff`) au lieu de blobs
  opaques génériques. Le code de redémarrage à l’exécution n’a pas de contrat sentinelle/intention/transfert
  de forme fichier.
- Le cache de synchronisation Matrix, les métadonnées de stockage, les liaisons de fils, les marqueurs de déduplication entrants,
  l’état de temporisation de vérification au démarrage, les instantanés crypto IndexedDB du SDK,
  les identifiants et les clés de récupération utilisent désormais les tables partagées d’état/blob de Plugin SQLite.
  Les structures de chemins d’exécution n’exposent plus de chemin de métadonnées `storage-meta.json`;
  ce nom de fichier n’est qu’une entrée de migration héritée. Leur plan d’import JSON hérité
  vit dans la surface de configuration/migration doctor du Plugin Matrix.
- Le démarrage Matrix ne recherche, ne signale ni ne complète plus l’état de fichiers Matrix hérité.
  La détection de fichiers Matrix, la création d’instantanés crypto hérités, l’état de migration de restauration des clés de salon,
  l’importation et la suppression des sources appartiennent tous à doctor.
- Les barrels de migration d’exécution Matrix ont été supprimés. Les assistants de détection
  et de mutation d’état/crypto hérités sont importés directement par le doctor Matrix au lieu de faire
  partie de la surface d’API d’exécution.
- Les marqueurs de réutilisation d’instantané de migration Matrix vivent désormais dans l’état de Plugin SQLite
  au lieu de `matrix/migration-snapshot.json`; doctor peut toujours réutiliser la même
  archive pré-migration vérifiée sans écrire de fichier d’état auxiliaire.
- Les curseurs de bus Nostr et l’état de publication de profil utilisent désormais l’état de Plugin SQLite partagé.
  Leur plan d’import JSON hérité vit dans la surface de configuration/migration doctor du Plugin Nostr.
- Les bascules de session Active Memory utilisent désormais l’état de Plugin SQLite partagé au lieu de
  `session-toggles.json`; réactiver la mémoire supprime la ligne au lieu de
  réécrire un objet JSON.
- Les propositions Skill Workshop et les compteurs de revue utilisent désormais l’état de Plugin SQLite partagé
  au lieu de magasins `skill-workshop/<workspace>.json` par espace de travail. Chaque
  proposition est une ligne distincte sous `skill-workshop/proposals`, et le compteur de revue
  est une ligne distincte sous `skill-workshop/reviews`.
- Les exécutions de sous-agent relecteur Skill Workshop utilisent désormais le résolveur de transcriptions de session
  d’exécution au lieu de créer des chemins de session auxiliaires `skill-workshop/<sessionId>.json`.
- Les baux de processus ACPX utilisent désormais l’état de Plugin SQLite partagé sous
  `acpx/process-leases` au lieu d’un registre fichier entier `process-leases.json`.
  Chaque bail est stocké dans sa propre ligne, en préservant l’élimination des processus obsolètes au démarrage
  sans chemin de réécriture JSON à l’exécution.
- Les scripts wrapper ACPX et le répertoire personnel Codex isolé sont générés dans la
  racine temporaire OpenClaw. Ils sont recréés selon les besoins et ne sont pas des entrées de sauvegarde
  ni de migration.
- La persistance du registre d’exécutions de sous-agents utilise des lignes partagées typées `subagent_runs`. L’ancien
  chemin `subagents/runs.json` n’est désormais qu’une entrée de migration doctor, et
  les noms d’assistants d’exécution ne décrivent plus la couche d’état comme adossée au disque.
  Les tests d’exécution ne créent plus de fixtures `runs.json` invalides ou vides pour prouver
  le comportement du registre; ils initialisent/lisent directement les lignes SQLite.
- La sauvegarde prépare le répertoire d’état avant l’archivage, copie les fichiers non-bases de données,
  prend des instantanés des bases `*.sqlite` avec `VACUUM INTO`, omet les fichiers auxiliaires WAL/SHM
  actifs, enregistre les métadonnées d’instantané dans le manifeste d’archive et enregistre
  les exécutions de sauvegarde terminées dans SQLite avec le manifeste d’archive. `openclaw backup
create` valide par défaut l’archive écrite; `--no-verify` est le chemin rapide
  explicite.
- `openclaw backup restore` valide l’archive avant extraction, réutilise le
  manifeste normalisé du vérificateur et restaure les ressources de manifeste vérifiées vers leurs
  chemins source enregistrés. Il exige `--yes` pour les écritures et prend en charge `--dry-run`
  pour un plan de restauration.
- L’ancien filtre de chemins volatils de sauvegarde est supprimé. La sauvegarde n’a plus besoin d’une
  liste d’exclusion tar en direct pour les anciens fichiers JSON/JSONL de session ou de cron, car les instantanés SQLite
  sont préparés avant la création de l’archive.
- La préparation d’espace de travail pour la configuration simple et l’intégration ne crée plus de répertoires
  `agents/<agentId>/sessions/`. Elle crée uniquement la configuration/l’espace de travail;
  les lignes de session SQLite et les lignes de transcription sont créées à la demande dans la
  base de données par agent.
- La réparation des permissions de sécurité cible désormais les bases de données SQLite globale et par agent
  ainsi que les fichiers auxiliaires WAL/SHM, au lieu de `sessions.json` et des fichiers de transcription
  JSONL.
- Les noms d’exécution du registre de sandbox décrivent désormais directement les types de registre SQLite
  au lieu de transporter la terminologie héritée de registre JSON dans le magasin actif.
- `openclaw reset --scope config+creds+sessions` supprime les bases de données par agent
  `openclaw-agent.sqlite` ainsi que les fichiers auxiliaires WAL/SHM, pas seulement les anciens
  répertoires `sessions/`.
- Les assistants de sessions agrégées du Gateway utilisent désormais des noms orientés entrées:
  `loadCombinedSessionEntriesForGateway` renvoie `{ databasePath, entries }`.
  L’ancienne nomenclature de magasin combiné a été retirée des appelants d’exécution.
- L’amorçage du canal Docker MCP écrit désormais la ligne de session principale et les événements de transcription
  dans la base de données SQLite par agent au lieu de créer
  `sessions.json` et une transcription JSONL.
- Le hook groupé de mémoire de session résout désormais le contexte de session précédente depuis
  SQLite par `{agentId, sessionId}`. Il ne recherche, ne stocke ni ne synthétise plus
  des chemins de transcription ou des répertoires `workspace/sessions`.
- Le hook groupé d’enregistrement de commandes écrit désormais les lignes d’audit de commande dans la table SQLite partagée
  `command_log_entries` au lieu d’ajouter à
  `logs/commands.log`.
- Les listes d’autorisation d’appairage de canaux n’exposent désormais que des assistants de lecture/écriture adossés à SQLite
  à l’exécution et dans le SDK de Plugin. L’ancien résolveur de chemin `*-allowFrom.json`
  et le lecteur de fichiers ne vivent plus que dans le code d’import doctor hérité.
- `migration_runs` enregistre les exécutions de migration d’état hérité avec statut,
  horodatages et rapports JSON.
- `migration_sources` enregistre chaque source de fichier hérité importée avec hachage, taille,
  nombre d’enregistrements, table cible, id d’exécution, statut et état de suppression de source.
- `backup_runs` enregistre les chemins d’archives de sauvegarde, le statut et les manifestes JSON.
- Le schéma global ne conserve pas de table de registre `agents` inutilisée. La découverte
  des bases de données d’agents est le registre canonique `agent_databases` jusqu’à ce que l’exécution
  ait un vrai propriétaire d’enregistrements d’agents.
- La configuration générée du catalogue de modèles est stockée dans des lignes SQLite globales typées
  `agent_model_catalogs` indexées par répertoire d’agent. Les appelants d’exécution utilisent
  `ensureOpenClawModelCatalog`; il n’y a pas d’API de compatibilité `models.json` dans
  le code d’exécution. L’implémentation écrit dans SQLite et le registre PI embarqué est
  hydraté depuis cette charge utile stockée sans créer de fichier `models.json`.
- L’export Markdown des transcriptions de session QMD et la configuration `memory.qmd.sessions` ont été
  supprimés. Il n’y a pas de collection de transcriptions QMD, pas de chemin d’exécution
  `qmd/sessions*` et pas de pont de mémoire de session adossé à des fichiers.
- L’exécution memory-core importe les assistants d’indexation des transcriptions SQLite depuis
  `openclaw/plugin-sdk/memory-core-host-engine-session-transcripts`, pas depuis le
  sous-chemin SDK QMD. Le sous-chemin QMD conserve une réexportation de compatibilité uniquement pour
  les appelants externes jusqu’à ce qu’un nettoyage majeur du SDK puisse la supprimer.
- Le propre `index.sqlite` de QMD est désormais une matérialisation d’exécution temporaire adossée à la
  table SQLite principale `plugin_blob_entries`. L’exécution ne crée plus de fichier auxiliaire durable
  `~/.openclaw/agents/<agentId>/qmd`.
- Le Plugin optionnel `memory-lancedb` ne crée plus
  `~/.openclaw/memory/lancedb` comme magasin implicitement géré par OpenClaw. Il s’agit d’un
  backend LanceDB externe qui reste désactivé jusqu’à ce que l’opérateur configure un
  `dbPath` explicite.
- `check:database-first-legacy-stores` échoue si une nouvelle source d’exécution associe
  d’anciens noms de magasins à des API de système de fichiers de type écriture. Il échoue aussi si une source d’exécution
  réintroduit les marqueurs de pont de transcription retirés
  `transcriptLocator` ou `sqlite-transcript://...`. Le code de migration, doctor, import,
  et d’export explicite hors session reste autorisé. Les noms plus larges de contrats hérités
  tels que `sessionFile`, `storePath` et les anciennes façades d’ère fichiers `SessionManager`
  ont encore des propriétaires actuels et nécessitent un travail de garde de migration séparé
  avant de pouvoir devenir une vérification de prévol obligatoire. La garde couvre désormais aussi
  les magasins d’exécution `cache/*.json`, les fichiers auxiliaires génériques
  `thread-bindings.json`, l’état Cron et les journaux d’exécution JSON, le JSON de santé de configuration,
  les fichiers auxiliaires de redémarrage et de verrouillage, les paramètres Voice Wake, les approbations de liaisons de Plugins,
  le JSON d’index des Plugins installés, le JSONL d’audit File Transfer, les journaux d’activité
  Memory Wiki, l’ancien journal texte groupé `command-logger` et les boutons de diagnostics JSONL
  de flux brut pi-mono. Elle interdit également les anciens noms de modules doctor hérités au niveau racine afin que
  le code de compatibilité reste sous `src/commands/doctor/`. Les gestionnaires de débogage Android
  utilisent aussi logcat/la sortie en mémoire au lieu de préparer des fichiers de cache `camera_debug.log` ou
  `debug_logs.txt`.

## Forme du schéma cible

Gardez les schémas explicites. L’état d’exécution détenu par l’hôte utilise des tables typées. L’état opaque détenu par les Plugins utilise `plugin_state_entries` / `plugin_blob_entries` ; il n’existe pas de table `kv` d’hôte générique.

Base de données globale :

```text
state_leases(scope, lease_key, owner, expires_at, heartbeat_at, payload_json, created_at, updated_at)
exec_approvals_config(config_key, raw_json, socket_path, has_socket_token, default_security, default_ask, default_ask_fallback, auto_allow_skills, agent_count, allowlist_count, updated_at_ms)
schema_meta(meta_key, role, schema_version, agent_id, app_version, created_at, updated_at)
agent_databases(agent_id, path, schema_version, last_seen_at, size_bytes)
task_runs(...)
task_delivery_state(...)
flow_runs(...)
subagent_runs(run_id, child_session_key, requester_session_key, controller_session_key, created_at, ended_at, cleanup_handled, payload_json)
current_conversation_bindings(binding_key, binding_id, target_agent_id, target_session_id, target_session_key, channel, account_id, conversation_kind, parent_conversation_id, conversation_id, target_kind, status, bound_at, expires_at, metadata_json, updated_at)
plugin_binding_approvals(plugin_root, channel, account_id, plugin_id, plugin_name, approved_at)
tui_last_sessions(scope_key, session_key, updated_at)
plugin_state_entries(plugin_id, namespace, entry_key, value_json, created_at, expires_at)
plugin_blob_entries(plugin_id, namespace, entry_key, metadata_json, blob, created_at, expires_at)
media_blobs(subdir, id, content_type, size_bytes, blob, created_at, updated_at)
skill_uploads(upload_id, kind, slug, force, size_bytes, sha256, actual_sha256, received_bytes, archive_blob, created_at, expires_at, committed, committed_at, idempotency_key_hash)
web_push_subscriptions(endpoint_hash, subscription_id, endpoint, p256dh, auth, created_at_ms, updated_at_ms)
web_push_vapid_keys(key_id, public_key, private_key, subject, updated_at_ms)
apns_registrations(node_id, transport, token, relay_handle, send_grant, installation_id, topic, environment, distribution, token_debug_suffix, updated_at_ms)
node_host_config(config_key, version, node_id, token, display_name, gateway_host, gateway_port, gateway_tls, gateway_tls_fingerprint, updated_at_ms)
device_identities(identity_key, device_id, public_key_pem, private_key_pem, created_at_ms, updated_at_ms)
device_auth_tokens(device_id, role, token, scopes_json, updated_at_ms)
macos_port_guardian_records(pid, port, command, mode, timestamp)
workspace_setup_state(workspace_key, workspace_path, version, bootstrap_seeded_at, setup_completed_at, updated_at)
native_hook_relay_bridges(relay_id, pid, hostname, port, token, expires_at_ms, updated_at_ms)
model_capability_cache(provider_id, model_id, name, input_text, input_image, reasoning, supports_tools, context_window, max_tokens, cost_input, cost_output, cost_cache_read, cost_cache_write, updated_at_ms)
agent_model_catalogs(catalog_key, agent_dir, raw_json, updated_at)
managed_outgoing_image_records(attachment_id, session_key, message_id, created_at, updated_at, retention_class, alt, original_media_id, original_media_subdir, original_content_type, original_width, original_height, original_size_bytes, original_filename, record_json)
gateway_restart_sentinel(sentinel_key, version, kind, status, ts, session_key, thread_id, delivery_channel, delivery_to, delivery_account_id, message, continuation_json, doctor_hint, stats_json, payload_json, updated_at_ms)
channel_pairing_requests(channel_key, account_id, request_id, code, created_at, last_seen_at, meta_json)
channel_pairing_allow_entries(channel_key, account_id, entry, sort_order, updated_at)
voicewake_triggers(config_key, position, trigger, updated_at_ms)
voicewake_routing_config(config_key, version, default_target_mode, default_target_agent_id, default_target_session_key, updated_at_ms)
voicewake_routing_routes(config_key, position, trigger, target_mode, target_agent_id, target_session_key, updated_at_ms)
update_check_state(state_key, last_checked_at, last_notified_version, last_notified_tag, last_available_version, last_available_tag, auto_install_id, auto_first_seen_version, auto_first_seen_tag, auto_first_seen_at, auto_last_attempt_version, auto_last_attempt_at, auto_last_success_version, auto_last_success_at, updated_at_ms)
config_health_entries(config_path, last_known_good_json, last_promoted_good_json, last_observed_suspicious_signature, updated_at_ms)
sandbox_registry_entries(registry_kind, container_name, session_key, backend_id, runtime_label, image, created_at_ms, last_used_at_ms, config_label_kind, config_hash, cdp_port, no_vnc_port, entry_json, updated_at)
cron_run_logs(store_key, job_id, seq, ts, status, error, summary, diagnostics_summary, delivery_status, delivery_error, delivered, session_id, session_key, run_id, run_at_ms, duration_ms, next_run_at_ms, model, provider, total_tokens, entry_json, created_at)
cron_jobs(store_key, job_id, name, description, enabled, delete_after_run, created_at_ms, agent_id, session_key, schedule_kind, schedule_expr, schedule_tz, every_ms, anchor_ms, at, stagger_ms, session_target, wake_mode, payload_kind, payload_message, payload_model, payload_fallbacks_json, payload_thinking, payload_timeout_seconds, payload_allow_unsafe_external_content, payload_external_content_source_json, payload_light_context, payload_tools_allow_json, delivery_mode, delivery_channel, delivery_to, delivery_thread_id, delivery_account_id, delivery_best_effort, failure_delivery_mode, failure_delivery_channel, failure_delivery_to, failure_delivery_account_id, failure_alert_disabled, failure_alert_after, failure_alert_channel, failure_alert_to, failure_alert_cooldown_ms, failure_alert_include_skipped, failure_alert_mode, failure_alert_account_id, next_run_at_ms, running_at_ms, last_run_at_ms, last_run_status, last_error, last_duration_ms, consecutive_errors, consecutive_skipped, schedule_error_count, last_delivery_status, last_delivery_error, last_delivered, last_failure_alert_at_ms, job_json, state_json, runtime_updated_at_ms, schedule_identity, sort_order, updated_at)
delivery_queue_entries(queue_name, id, status, entry_kind, session_key, channel, target, account_id, retry_count, last_attempt_at, last_error, recovery_state, platform_send_started_at, entry_json, enqueued_at, updated_at, failed_at)
commitments(id, agent_id, session_key, channel, account_id, recipient_id, thread_id, sender_id, kind, sensitivity, source, status, reason, suggested_text, dedupe_key, confidence, due_earliest_ms, due_latest_ms, due_timezone, source_message_id, source_run_id, created_at_ms, updated_at_ms, attempts, last_attempt_at_ms, sent_at_ms, dismissed_at_ms, snoozed_until_ms, expired_at_ms, record_json)
migration_runs(id, started_at, finished_at, status, report_json)
migration_sources(source_key, migration_kind, source_path, target_table, source_sha256, source_size_bytes, source_record_count, last_run_id, status, imported_at, removed_source, report_json)
backup_runs(id, created_at, archive_path, status, manifest_json)
```

Base de données de l’agent :

```text
schema_meta(meta_key, role, schema_version, agent_id, app_version, created_at, updated_at)
sessions(session_id, session_key, session_scope, created_at, updated_at, started_at, ended_at, status, chat_type, channel, account_id, primary_conversation_id, model_provider, model, agent_harness_id, parent_session_key, spawned_by, display_name)
conversations(conversation_id, channel, account_id, kind, peer_id, parent_conversation_id, thread_id, native_channel_id, native_direct_user_id, label, metadata_json, created_at, updated_at)
session_conversations(session_id, conversation_id, role, first_seen_at, last_seen_at)
session_routes(session_key, session_id, updated_at)
session_entries(session_id, session_key, entry_json, updated_at)
transcript_events(session_id, seq, event_json, created_at)
transcript_event_identities(session_id, event_id, seq, event_type, has_parent, parent_id, message_idempotency_key, created_at)
transcript_snapshots(session_id, snapshot_id, reason, event_count, created_at, metadata_json)
vfs_entries(namespace, path, kind, content_blob, metadata_json, updated_at)
tool_artifacts(run_id, artifact_id, kind, metadata_json, blob, created_at)
run_artifacts(run_id, path, kind, metadata_json, blob, created_at)
trajectory_runtime_events(session_id, run_id, seq, event_json, created_at)
memory_index_meta(key, value)
memory_index_sources(path, source, hash, mtime, size)
memory_index_chunks(id, path, source, start_line, end_line, hash, model, text, embedding, updated_at)
memory_embedding_cache(provider, model, provider_key, hash, embedding, dims, updated_at)
memory_index_state(id, revision)
cache_entries(scope, key, value_json, blob, expires_at, updated_at)
```

La recherche future peut ajouter des tables FTS sans modifier les tables d’événements canoniques :

```text
transcript_events_fts(session_id, seq, text)
vfs_entries_fts(namespace, path, text)
```

Les grandes valeurs doivent utiliser des colonnes `blob`, et non un encodage en chaîne JSON. Conservez `value_json` pour les petites données structurées qui doivent rester inspectables avec les outils SQLite simples.

`agent_databases` est le registre canonique pour cette branche. N’ajoutez pas de table `agents` tant qu’il n’existe pas de véritable propriétaire d’enregistrement d’agent ; la configuration d’agent reste dans `openclaw.json`.

## Forme de la migration Doctor

Doctor doit appeler une étape de migration explicite, rapportable et sûre à relancer :

```bash
openclaw doctor --fix
```

`openclaw doctor --fix` invoque l’implémentation de migration d’état après la pré-vérification ordinaire de la configuration et crée une sauvegarde vérifiée avant l’importation. Le démarrage de l’exécution et `openclaw migrate` ne doivent pas importer les fichiers d’état OpenClaw hérités.

Propriétés de migration :

- Une passe de migration découvre toutes les sources de fichiers hérités et produit un plan avant toute mutation.
- Doctor crée une archive de sauvegarde pré-migration vérifiée avant d’importer les fichiers hérités.
- Les importations sont idempotentes et indexées par chemin source, mtime, taille, hash et table cible.
- Les fichiers sources correctement importés sont supprimés ou archivés après la validation de la base de données cible.
- Les importations échouées laissent la source intacte et enregistrent un avertissement dans `migration_runs`.
- Le code d’exécution lit uniquement SQLite une fois la migration présente.
- Aucun chemin de rétrogradation/exportation vers des fichiers d’exécution n’est requis.

## Inventaire de migration

Déplacez ces éléments dans la base de données globale :

- Les écritures d’exécution du registre des tâches utilisent désormais la base de données partagée ; l’importateur sidecar non livré
  `tasks/runs.sqlite` est supprimé. Les sauvegardes d’instantanés effectuent un upsert par identifiant de tâche
  et ne suppriment que les lignes de tâche/livraison manquantes.
- Les écritures d’exécution de Task Flow utilisent désormais la base de données partagée ; l’importateur sidecar non livré
  `tasks/flows/registry.sqlite` est supprimé. Les sauvegardes d’instantanés
  effectuent un upsert par identifiant de flux et ne suppriment que les lignes de flux manquantes.
- Les écritures d’exécution de l’état des Plugins utilisent désormais la base de données partagée ; l’importateur sidecar non livré
  `plugin-state/state.sqlite` est supprimé.
- La recherche de mémoire intégrée n’utilise plus `memory/<agentId>.sqlite` par défaut ; ses
  tables d’index résident dans la base de données de l’agent propriétaire, et l’activation sidecar explicite
  `memorySearch.store.path` a été retirée au profit de la migration de configuration doctor.
- La réindexation de la mémoire intégrée réinitialise uniquement les tables appartenant à la mémoire dans la base de données de l’agent.
  Elle ne doit pas remplacer tout le fichier SQLite, car la même base de données possède
  les sessions, les transcriptions, les lignes VFS, les artefacts et les caches d’exécution.
- Registres de conteneurs/navigateurs de sandbox issus de JSON monolithiques et fragmentés. Les écritures d’exécution
  utilisent désormais la base de données partagée ; l’import JSON hérité reste en place.
- Les définitions de tâches Cron, l’état de planification et l’historique d’exécution utilisent désormais le SQLite partagé ;
  doctor importe/supprime les fichiers hérités `jobs.json`, `jobs-state.json` et
  `cron/runs/*.jsonl`
- Identité/authentification d’appareil, push, vérification de mise à jour, engagements, cache de modèles OpenRouter,
  index des Plugins installés et liaisons du serveur d’application
- Les enregistrements d’appairage et d’amorçage des appareils/nœuds utilisent désormais des tables SQLite typées
- Les abonnés aux notifications d’appairage d’appareils et les marqueurs de requêtes livrées utilisent désormais la
  table SQLite partagée d’état des Plugins au lieu de `device-pair-notify.json`.
- Les enregistrements d’appels vocaux utilisent désormais la table SQLite partagée d’état des Plugins dans l’espace de noms
  `voice-call` / `calls` au lieu de `calls.jsonl` ; la CLI du Plugin
  suit et résume l’historique des appels adossé à SQLite.
- Les sessions Gateway QQBot, les enregistrements d’utilisateurs connus et le cache de citations ref-index utilisent désormais
  l’état des Plugins SQLite dans les espaces de noms `qqbot` (`sessions`, `known-users`,
  `ref-index`) au lieu de `session-*.json`, `known-users.json` et
  `ref-index.jsonl` ; la migration doctor/setup de QQBot importe et supprime les
  fichiers hérités.
- Les préférences du sélecteur de modèle Discord, les hachages de déploiement de commandes et les liaisons de fils
  utilisent désormais l’état des Plugins SQLite dans les espaces de noms `discord`
  (`model-picker-preferences`, `command-deploy-hashes`, `thread-bindings`)
  au lieu de `model-picker-preferences.json`, `command-deploy-cache.json` et
  `thread-bindings.json` ; la migration doctor/setup de Discord importe et
  supprime les fichiers hérités.
- Les curseurs de rattrapage BlueBubbles et les marqueurs de déduplication entrants utilisent désormais l’état des Plugins SQLite
  dans les espaces de noms `bluebubbles` (`catchup-cursors`, `inbound-dedupe`)
  au lieu de `bluebubbles/catchup/*.json` et
  `bluebubbles/inbound-dedupe/*.json` ; la migration doctor/setup de BlueBubbles
  importe et supprime les fichiers hérités.
- Les décalages de mise à jour Telegram, les entrées de cache d’autocollants, les entrées de cache de messages de chaîne de réponses,
  les entrées de cache de messages envoyés, les entrées de cache de noms de sujets et les liaisons de fils
  utilisent désormais l’état des Plugins SQLite dans les espaces de noms `telegram`
  (`update-offsets`, `sticker-cache`, `message-cache`, `sent-messages`,
  `topic-names`, `thread-bindings`) au lieu de `update-offset-*.json`,
  `sticker-cache.json`, `*.telegram-messages.json`,
  `*.telegram-sent-messages.json`, `*.telegram-topic-names.json` et
  `thread-bindings-*.json` ; la migration doctor/setup de Telegram importe et
  supprime les fichiers hérités.
- Les curseurs de rattrapage iMessage, les correspondances d’identifiants courts de réponse et les lignes de déduplication d’écho d’envoi
  utilisent désormais l’état des Plugins SQLite dans les espaces de noms `imessage` (`catchup-cursors`,
  `reply-cache`, `sent-echoes`) au lieu de `imessage/catchup/*.json`,
  `imessage/reply-cache.jsonl` et `imessage/sent-echoes.jsonl` ; la migration doctor/setup iMessage
  importe et supprime les fichiers hérités.
- Les conversations Microsoft Teams, les sondages, les jetons SSO et les apprentissages de feedback utilisent désormais
  les espaces de noms d’état des Plugins SQLite (`conversations`, `polls`, `sso-tokens`,
  `feedback-learnings`) au lieu de `msteams-conversations.json`,
  `msteams-polls.json`, `msteams-sso-tokens.json` et `*.learnings.json` ; la
  migration doctor/setup Microsoft Teams importe et archive les fichiers hérités.
  Les téléversements en attente sont un cache SQLite de courte durée et les anciens fichiers de cache JSON ne sont
  pas migrés.
- Le cache de synchronisation Matrix, les métadonnées de stockage, les liaisons de fils, les marqueurs de déduplication entrants,
  l’état de temporisation de vérification au démarrage, les identifiants, les clés de récupération et les instantanés cryptographiques SDK
  IndexedDB utilisent désormais des espaces de noms d’état/blob de Plugins SQLite sous
  `matrix` (`sync-store`, `storage-meta`, `thread-bindings`, `inbound-dedupe`,
  `startup-verification`, `credentials`, `recovery-key`, `idb-snapshots`)
  au lieu de `bot-storage.json`, `storage-meta.json`, `thread-bindings.json`,
  `inbound-dedupe.json`, `startup-verification.json`, `credentials.json`,
  `recovery-key.json` et `crypto-idb-snapshot.json` ; la migration doctor/setup Matrix
  importe et supprime ces fichiers hérités depuis les racines de stockage Matrix propres aux comptes.
- Les curseurs de bus Nostr et l’état de publication de profil utilisent désormais l’état des Plugins SQLite dans les
  espaces de noms `nostr` (`bus-state`, `profile-state`) au lieu de
  `bus-state-*.json` et `profile-state-*.json` ; la migration doctor/setup Nostr
  importe et supprime les fichiers hérités.
- Les bascules de session Active Memory utilisent désormais l’état des Plugins SQLite sous
  `active-memory/session-toggles` au lieu de `session-toggles.json`.
- Les files de propositions Skill Workshop et les compteurs de révision utilisent désormais l’état des Plugins SQLite
  sous `skill-workshop/proposals` et `skill-workshop/reviews` au lieu des
  fichiers par espace de travail `skill-workshop/<workspace>.json`.
- Les files de livraison sortante et de livraison de session partagent désormais la table SQLite globale
  `delivery_queue_entries` sous des noms de file distincts
  (`outbound-delivery`, `session-delivery`) au lieu des fichiers durables
  `delivery-queue/*.json`, `delivery-queue/failed/*.json` et
  `session-delivery-queue/*.json`. L’étape d’état hérité de doctor importe
  les lignes en attente et en échec, supprime les marqueurs de livraison obsolètes et supprime les anciens
  fichiers JSON après import. Les champs de routage à chaud et de nouvelle tentative sont des colonnes typées ; la
  charge utile JSON n’est conservée que pour la relecture/le débogage.
- Les baux de processus ACPX utilisent désormais l’état des Plugins SQLite sous `acpx/process-leases`
  au lieu de `process-leases.json`.
- Métadonnées des exécutions de sauvegarde et de migration

Déplacer ceux-ci dans les bases de données d’agents :

- Racines de session d’agent et charges utiles d’entrée de session de forme compatible. Fait pour
  les écritures d’exécution : les métadonnées de session à chaud sont interrogeables dans `sessions`, tandis que la
  charge utile complète héritée `SessionEntry` reste dans `session_entries`.
- Événements de transcription d’agent. Fait pour les écritures d’exécution.
- Points de contrôle de Compaction et instantanés de transcription. Fait pour les écritures d’exécution :
  les copies de transcription des points de contrôle sont des lignes de transcription SQLite et les métadonnées de point de contrôle
  sont enregistrées dans `transcript_snapshots`. Les assistants de points de contrôle Gateway
  nomment désormais ces valeurs comme des instantanés de transcription plutôt que comme des fichiers source.
- Espaces de noms scratch/espace de travail VFS d’agent. Fait pour les écritures VFS d’exécution.
- Charges utiles de pièces jointes de sous-agents. Fait pour les écritures d’exécution : ce sont des entrées de graine VFS
  SQLite et jamais des fichiers d’espace de travail durables.
- Artefacts d’outils. Fait pour les écritures d’exécution.
- Artefacts d’exécution. Fait pour les écritures d’exécution du worker via la table par agent
  `run_artifacts`.
- Caches d’exécution locaux à l’agent. Fait pour les écritures de cache délimitées à l’exécution du worker via
  la table par agent `cache_entries`. Les caches de modèles à l’échelle du Gateway restent dans la
  base de données globale sauf s’ils deviennent propres à l’agent.
- Journaux de flux parent ACP. Fait pour les écritures d’exécution.
- Sessions du registre de relecture ACP. Fait pour les écritures d’exécution via
  `acp_replay_sessions` et `acp_replay_events` ; le fichier hérité `acp/event-ledger.json`
  ne reste qu’une entrée pour doctor.
- Métadonnées de session ACP. Fait pour les écritures d’exécution via `acp_sessions` ; les blocs hérités
  `entry.acp` dans `sessions.json` ne sont que des entrées de migration doctor.
- Sidecars de trajectoire lorsqu’ils ne sont pas des fichiers d’export explicites. Fait pour les écritures
  d’exécution : la capture de trajectoire écrit des lignes `trajectory_runtime_events` dans la base de données d’agent
  et réplique les artefacts délimités à l’exécution dans SQLite. Les sidecars hérités ne sont que des entrées
  d’import doctor ; l’export peut matérialiser de nouvelles sorties JSONL de bundles de support
  mais ne lit ni ne migre les anciens sidecars de trajectoire/transcription à l’exécution.
  La capture de trajectoire d’exécution expose la portée SQLite ; les assistants de chemin JSONL sont
  isolés au support d’export/débogage et ne sont pas réexportés depuis le module d’exécution.
  Les métadonnées de trajectoire de l’exécuteur embarqué enregistrent l’identité `{agentId, sessionId, sessionKey}`
  au lieu de persister un localisateur de transcription.

Conserver ceux-ci adossés à des fichiers pour l’instant :

- `openclaw.json`
- fichiers d’identifiants de fournisseur ou de CLI
- manifestes de Plugins/packages
- espaces de travail utilisateur et dépôts Git lorsque le mode disque est sélectionné
- journaux destinés au suivi par l’opérateur, sauf si une surface de journal spécifique est déplacée

## Plan de migration

### Phase 0 : figer la frontière

Rendre explicite la frontière de l’état durable avant de déplacer davantage de lignes :

- Ajouter une table `migration_runs` à la base de données globale.
  Fait pour les rapports d’exécution de migration d’état hérité.
- Ajouter un service unique de migration d’état fichier-vers-base de données appartenant à doctor.
  Fait : `openclaw doctor --fix` utilise l’implémentation de migration d’état hérité.
- Rendre `plan` en lecture seule et faire en sorte que `apply` crée une sauvegarde, importe, vérifie, puis
  supprime ou mette en quarantaine les anciens fichiers.
  Fait : doctor crée une sauvegarde pré-migration vérifiée, transmet le chemin de sauvegarde
  à `migration_runs` et réutilise les chemins d’importation/suppression.
- Ajouter des interdictions statiques afin que le nouveau code d’exécution ne puisse pas écrire de fichiers d’état hérités tandis que
  le code de migration et les tests peuvent encore les ensemencer/lire.
  Fait pour les magasins hérités actuellement migrés ; la garde analyse aussi les
  tests imbriqués pour détecter les contrats interdits de localisateur de transcription d’exécution.

### Phase 1 : terminer le plan de contrôle global

Conserver l’état de coordination partagé dans `state/openclaw.sqlite` :

- Agents et registre des bases de données d’agents
- Registres de tâches et de Task Flow
- État des Plugins
- Registre de conteneurs/navigateurs de sandbox
- Historique d’exécution Cron/planificateur
- Appairage, appareil, push, vérification de mise à jour, TUI, caches OpenRouter/modèles et autre
  petit état d’exécution délimité au Gateway
- Métadonnées de sauvegarde et de migration
- Octets de pièces jointes média du Gateway. Fait pour les écritures d’exécution ; les chemins de fichiers directs
  sont des matérialisations temporaires pour la compatibilité avec les expéditeurs de canaux et la préparation de sandbox.
  Les listes d’autorisation d’exécution acceptent les chemins de matérialisation SQLite, pas les racines média
  d’état/configuration héritées. Doctor importe les fichiers média hérités dans
  `media_blobs` et supprime les fichiers source après l’écriture réussie des lignes.
- Sessions, événements et blobs de charge utile de capture du proxy de débogage. Fait : les captures résident
  dans la base de données d’état partagée et s’ouvrent via l’amorçage, le schéma,
  WAL et les paramètres de délai d’attente occupé de la base de données d’état partagée. Les octets de charge utile sont compressés avec gzip dans
  `capture_blobs.data` ; il n’existe aucun remplacement de base de données sidecar d’exécution du proxy de débogage,
  répertoire de blobs ni cible de schéma/codegen générée propre à proxy-capture.
  La migration doctor/démarrage importe les lignes `debug-proxy/capture.sqlite` livrées
  et les blobs de charge utile référencés, y compris les remplacements actifs d’environnement de base de données/blob hérités,
  puis archive ces sources tout en laissant les certificats CA intacts.

Cette phase supprime également les ouvreurs sidecar en double, les assistants d’autorisations, la configuration
WAL, l’élagage du système de fichiers et les écrivains de compatibilité de ces sous-systèmes.

### Phase 2 : introduire des bases de données par agent

Créer une base de données par agent et l’enregistrer depuis la base de données globale :

```text
~/.openclaw/state/openclaw.sqlite
~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite
```

La ligne globale `agent_databases` stocke le chemin, la version de schéma, l’horodatage
de dernière vue et les métadonnées de base de taille/intégrité. Le code d’exécution demande au registre
la base de données de l’agent au lieu de dériver directement les chemins de fichiers.

La base de données d’agent possède :

- `sessions` comme racine canonique des sessions, avec `session_entries` comme table de charges utiles de forme compatible attachée à cette racine, et `session_routes` comme recherche unique du `session_key` actif
- `conversations` et `session_conversations` comme identité de routage de fournisseur normalisée attachée aux sessions
- `transcript_events`
- instantanés de transcript et points de contrôle de Compaction. Terminé pour les écritures runtime.
- `vfs_entries`
- `tool_artifacts` et artefacts d’exécution
- lignes runtime/cache locales à l’agent. Terminé pour les caches limités aux workers.
- événements de flux parent ACP
- événements runtime de trajectoire lorsqu’ils ne sont pas des artefacts d’export explicites

### Phase 3 : remplacer les API de stockage de session

Terminé pour le runtime. La surface de stockage de session sous forme de fichiers n’est pas un contrat runtime actif :

- Le runtime n’appelle plus `loadSessionStore(storePath)` et ne traite plus `storePath` comme identité de session.
- Les opérations de ligne runtime sont `getSessionEntry`, `upsertSessionEntry`, `patchSessionEntry`, `deleteSessionEntry` et `listSessionEntries`.
- Les helpers de réécriture de stockage complet, rédacteurs de fichiers, tests de file d’attente, élagage d’alias et paramètres de suppression de clés héritées ont disparu du runtime.
- Les exports de compatibilité du package racine obsolètes adaptent encore les chemins canoniques `sessions.json` vers les API de lignes SQLite.
- L’analyse de `sessions.json` ne reste que dans le code de migration/import de doctor et les tests de doctor.
- Le fallback de cycle de vie runtime lit les en-têtes de transcript SQLite, et non les premières lignes JSONL.

Continuez à supprimer tout ce qui réintroduit des paramètres de verrouillage de fichier, du vocabulaire d’élagage/troncature comme maintenance de fichier, l’identité par chemin de stockage, ou des tests dont la seule assertion est la persistance JSON.

### Phase 4 : déplacer les transcripts, flux ACP, trajectoires et VFS

Rendre chaque flux de données d’agent natif de la base de données :

- Les écritures d’ajout de transcript passent par une transaction SQLite qui garantit l’en-tête de session, vérifie l’idempotence des messages, sélectionne la queue parente, insère dans `transcript_events` et enregistre les métadonnées d’identité interrogeables dans `transcript_event_identities`. Terminé pour les ajouts directs de messages de transcript et les ajouts normaux persistés de `TranscriptSessionManager` ; les opérations explicites de branche conservent leur choix explicite de parent et écrivent toujours des lignes SQLite sans dériver de localisateur de fichier.
- Les journaux de flux parent ACP deviennent des lignes, pas des fichiers `.acp-stream.jsonl`. Terminé.
- La configuration de spawn ACP ne persiste plus les chemins JSONL de transcript. Terminé.
- La capture runtime de trajectoire écrit directement des lignes/artefacts d’événements. La commande explicite de support/export peut encore produire des artefacts JSONL de bundle de support comme format d’export, mais l’export de session ne recrée pas de JSONL de session. Terminé.
- Les workspaces disque restent sur disque lorsqu’ils sont configurés en mode disque.
- Le scratch VFS et le mode expérimental de workspace VFS uniquement utilisent la base de données de l’agent.

La migration importe les anciens fichiers JSONL une seule fois, enregistre les décomptes/hachages dans `migration_runs` et supprime les fichiers importés après les contrôles d’intégrité.

### Phase 5 : sauvegarde, restauration, vacuum et vérification

Les sauvegardes restent un fichier d’archive unique :

- Créer un point de contrôle pour chaque base de données globale et d’agent.
- Prendre un instantané de chaque base avec la sémantique de sauvegarde SQLite ou `VACUUM INTO`.
- Archiver les instantanés compacts de bases de données, la configuration, les identifiants externes et les exports de workspace demandés.
- Omettre les fichiers live bruts `*.sqlite-wal` et `*.sqlite-shm`.
- Vérifier en ouvrant chaque instantané de base de données et en exécutant `PRAGMA integrity_check`. `openclaw backup create` effectue cette vérification d’archive par défaut ; `--no-verify` saute uniquement la passe d’archive post-écriture, pas le contrôle d’intégrité de création d’instantané.
- La restauration recopie les instantanés vers leurs chemins cibles. Cette branche réinitialise la disposition SQLite non livrée à `user_version = 1` ; les futurs changements de schéma livrés pourront ajouter des migrations explicites lorsqu’elles seront nécessaires.

### Phase 6 : runtime des workers

Garder le mode worker expérimental pendant l’intégration de la séparation des bases de données :

- Les workers reçoivent l’id d’agent, l’id d’exécution, le mode de système de fichiers et l’identité du registre de bases de données.
- Chaque worker ouvre sa propre connexion SQLite.
- Le parent conserve l’autorité sur la livraison aux canaux, les approbations, la configuration et l’annulation.
- Commencer avec un worker par exécution active ; ajouter le pooling seulement après stabilisation du cycle de vie et de la propriété des connexions de base de données.

### Phase 7 : supprimer l’ancien monde

Terminé pour la gestion runtime des sessions. L’ancien monde n’est autorisé que comme entrée explicite de doctor ou sortie de support/export :

- Aucune écriture runtime de `sessions.json`, transcript JSONL, JSON de registre sandbox, SQLite annexe de tâche ou SQLite annexe d’état de Plugin.
- Aucun élagage de fichiers JSON/session, aucune troncature de transcript de fichier, aucun verrou de fichier de session ni test de session en forme de verrou.
- Aucun export de compatibilité runtime dont le but est de garder les anciens fichiers de session à jour.
- Les exports de support explicites restent des formats d’archive/matérialisation demandés par l’utilisateur et ne doivent pas réinjecter de noms de fichiers dans l’identité runtime.

## Sauvegarde et restauration

Les sauvegardes doivent être un fichier d’archive unique, mais la capture de base de données doit être native SQLite :

1. Arrêter l’activité d’écriture longue durée ou entrer dans une courte barrière de sauvegarde.
2. Pour chaque base de données globale et d’agent, exécuter un checkpoint.
3. Prendre un instantané de chaque base avec la sémantique de sauvegarde SQLite ou `VACUUM INTO` dans un répertoire temporaire de sauvegarde.
4. Archiver les instantanés compactés de bases de données, le fichier de configuration, le répertoire d’identifiants, les workspaces sélectionnés et un manifeste.
5. Vérifier l’archive en ouvrant chaque instantané SQLite inclus et en exécutant `PRAGMA integrity_check`. `openclaw backup create` le fait par défaut ; `--no-verify` sert uniquement à sauter volontairement la passe d’archive post-écriture.

Ne vous appuyez pas sur des copies live brutes `*.sqlite`, `*.sqlite-wal` et `*.sqlite-shm` comme format principal de sauvegarde. Le manifeste d’archive doit enregistrer le rôle de la base de données, l’id d’agent, la version de schéma, le chemin source, le chemin d’instantané, la taille en octets et l’état d’intégrité.

La restauration doit reconstruire la base de données globale et les fichiers de base de données d’agent à partir des instantanés de l’archive. Comme la disposition SQLite n’a pas encore été livrée, ce refactor conserve uniquement le schéma version 1 plus l’import de fichiers vers base de données par doctor. La commande de restauration valide d’abord l’archive, puis remplace chaque ressource du manifeste depuis la charge utile extraite vérifiée.

## Plan de refactor runtime

1. Ajouter des API de registre de bases de données.
   - Résoudre les chemins de la base de données globale et des bases par agent.
   - Garder les schémas non livrés à `user_version = 1` ; ne pas ajouter de code de runner de migration de schéma tant qu’un schéma livré n’en a pas besoin.
   - Ajouter des helpers de fermeture/checkpoint/intégrité utilisés par les tests, la sauvegarde et doctor.

2. Fusionner les stockages SQLite annexes.
   - Déplacer les tables d’état de Plugin dans la base de données globale. Terminé pour les écritures runtime ; l’importateur d’annexe héritée non livrée est supprimé.
   - Déplacer les tables de registre de tâches dans la base de données globale. Terminé pour les écritures runtime ; l’importateur d’annexe héritée non livrée est supprimé.
   - Déplacer les tables Task Flow dans la base de données globale. Terminé pour les écritures runtime ; l’importateur d’annexe héritée non livrée est supprimé.
   - Déplacer les tables intégrées de recherche mémoire dans chaque base de données d’agent. Terminé ; le `memorySearch.store.path` personnalisé explicite est désormais supprimé par la migration de configuration doctor. La réindexation complète s’exécute en place uniquement sur les tables mémoire ; l’ancien chemin d’échange de fichier complet et le helper d’échange d’index annexe sont supprimés.
   - Supprimer les ouvreurs de base de données dupliqués, la configuration WAL, les helpers de permissions et les chemins de fermeture de ces sous-systèmes.

3. Déplacer les tables détenues par l’agent dans des bases de données par agent.
   - Créer la base de données d’agent à la demande via le registre de base de données global. Terminé.
   - Déplacer les entrées de session runtime, événements de transcript, lignes VFS et artefacts d’outils vers les bases de données d’agent. Terminé.
   - Ne pas migrer les entrées de session de base partagée locales à la branche, les événements de transcript, les lignes VFS ni les artefacts d’outils ; cette disposition n’a jamais été livrée. Conserver uniquement l’import hérité de fichiers vers base de données dans doctor.

4. Remplacer les API de stockage de session.
   - Supprimer `storePath` comme identité runtime. Terminé pour le runtime et gardé par `check:database-first-legacy-stores` : les métadonnées de session, mises à jour de routes, persistance de commandes, nettoyage de sessions CLI, aperçus de raisonnement Feishu, persistance d’état de transcript, profondeur de sous-agent, remplacements de session de profil d’authentification, logique de fork parent et inspection QA-lab résolvent maintenant la base de données depuis les clés canoniques agent/session.
     Les réponses de liste de sessions Gateway/TUI/UI/macOS exposent maintenant `databasePath` au lieu de l’ancien `path` ; les surfaces de debug macOS affichent la base de données par agent comme état en lecture seule au lieu d’écrire la configuration `session.store`.
     `/status`, l’export de trajectoire piloté par chat et les proxys de dépendances CLI ne propagent plus les anciens chemins de stockage ; le fallback d’usage de transcript lit SQLite par identité agent/session. Les tests runtime et bridge n’exposent plus `storePath` ; les entrées doctor/migration possèdent ce nom de champ hérité.
     Le chargement de sessions combinées Gateway n’a plus de branche runtime spéciale pour les valeurs `session.store` non modélisées ; il agrège les lignes SQLite par agent.
     La voie doctor héritée de verrouillage de session et son helper de nettoyage `.jsonl.lock` ont été supprimés ; SQLite est désormais la frontière de concurrence des sessions.
     Les points d’appel runtime chauds utilisent des noms de helpers orientés lignes tels que `resolveSessionRowEntry` ; l’ancien alias de compatibilité `resolveSessionStoreEntry` a été supprimé du runtime et des exports du SDK Plugin.

- Utiliser des opérations de ligne `{ agentId, sessionKey }`.
  Terminé : `getSessionEntry`, `upsertSessionEntry`, `deleteSessionEntry`, `patchSessionEntry` et `listSessionEntries` sont des API SQLite-first qui ne nécessitent pas de chemin de stockage de session. Le résumé d’état, l’état local de l’agent, la santé et la commande de liste `openclaw sessions` lisent maintenant directement les lignes par agent et affichent les chemins de bases SQLite par agent au lieu des chemins `sessions.json`.
- Remplacer la suppression/insertion de stockage complet par `upsertSessionEntry`, `deleteSessionEntry`, `listSessionEntries` et des requêtes SQL de nettoyage.
  Terminé pour le runtime : les chemins chauds utilisent maintenant les API de lignes et les patches de lignes avec nouvel essai en cas de conflit ; les helpers restants d’import/remplacement de stockage complet sont limités au code d’import de migration et aux tests du backend SQLite.
  - Supprimer `store-writer.ts` et les tests de file d’attente du rédacteur. Terminé.
  - Supprimer l’élagage runtime de clés héritées et les paramètres alias-delete des upserts/patches de lignes de session. Terminé.

5. Supprimer le comportement runtime de registre JSON.
   - Rendre les lectures et écritures du registre sandbox uniquement SQLite. Terminé.
   - Importer le JSON monolithique et fragmenté uniquement depuis l’étape de migration. Terminé.
   - Supprimer les verrous de registre fragmenté et les écritures JSON. Terminé.

- Conserver une table de registre typée au lieu de stocker les lignes de registre comme JSON opaque générique si la forme reste un état opérationnel de chemin chaud. Terminé.

6. Supprimer la mutation de session en forme de verrou de fichier.
   - Terminé pour la création de verrous runtime et les API de verrous runtime.
   - La voie autonome de nettoyage doctor héritée `.jsonl.lock` est supprimée.
   - `session.writeLock` est une configuration héritée migrée par doctor, pas un paramètre runtime typé.
   - L’intégrité d’état n’a plus de chemin séparé d’élagage de fichiers de transcript orphelins ; la migration doctor importe/supprime les sources JSONL héritées à un seul endroit.
   - La coordination singleton Gateway utilise des lignes SQLite typées `state_leases` sous `gateway_locks` et n’expose plus de point d’extension de répertoire de verrous de fichiers.
   - La persistance de déduplication du SDK Plugin générique n’utilise plus de verrous de fichiers ni de fichiers JSON ; elle écrit des lignes SQLite partagées d’état de Plugin. Terminé.
   - La coordination d’intégration QMD utilise un bail d’état SQLite au lieu de `qmd/embed.lock`. Terminé.

7. Rendre les workers conscients des bases de données.
   - Les workers ouvrent leurs propres connexions SQLite.
   - Le parent possède la livraison, les callbacks de canaux et la configuration.
   - Le worker reçoit l’id d’agent, l’id d’exécution, le mode de système de fichiers et l’identité du registre de bases de données, pas des handles live.
   - `vfs-only` reste expérimental et utilise la base de données de l’agent comme racine de stockage.
   - Garder d’abord un worker par exécution active. Le pooling peut attendre que la durée de vie des connexions de base de données et le comportement d’annulation soient ordinaires.

8. Intégration de la sauvegarde.
   - Apprendre à la sauvegarde à instantaner les bases de données globales et d’agent via la sauvegarde SQLite ou
     `VACUUM INTO`. Terminé pour les fichiers `*.sqlite` découverts sous l’asset d’état.
   - Ajouter une vérification de sauvegarde pour l’intégrité SQLite et la version de schéma. Terminé pour
     la création de sauvegardes et les contrôles d’intégrité de vérification d’archive par défaut.
   - Enregistrer les métadonnées d’exécution de sauvegarde dans SQLite. Terminé via la table partagée `backup_runs`
     avec le chemin d’archive, le statut et le JSON de manifeste.
   - Ajouter la restauration depuis des instantanés d’archive vérifiés. Terminé : `openclaw backup
restore` valide avant l’extraction, utilise le manifeste normalisé du vérificateur,
     prend en charge `--dry-run`, et exige `--yes` avant de remplacer
     les chemins source enregistrés.
   - Inclure l’export VFS/espace de travail uniquement sur demande ; ne pas exporter les éléments internes de session
     en JSON ou JSONL.

9. Supprimer les tests et le code obsolètes. Terminé pour les surfaces de session runtime connues.

- Supprimer les tests qui affirment la création runtime de `sessions.json` ou de fichiers
  JSONL de transcription. Terminé pour le magasin de sessions core, le chat, les événements de transcription Gateway,
  l’aperçu, le cycle de vie, les mises à jour d’entrée de session de commande, la réinitialisation/trace de réponse automatique, et
  les fixtures Dreaming de memory-core, le routage de cible d’approbation, la réparation de transcription de session,
  la réparation de permission de sécurité, l’export de trajectoire et l’export de session.
  Les tests de transcription Active Memory affirment désormais les portées SQLite et aucune création de fichier JSONL
  temporaire ou persistant.
  L’ancienne régression d’élagage de transcription Heartbeat a été supprimée, car
  le runtime ne tronque plus les transcriptions JSONL.
  Les tests d’outil de liste de sessions d’agent ne modélisent plus les anciens chemins `sessions.json`
  comme forme de réponse du Gateway ; les tests app/UI/macOS utilisent `databasePath`.
  Les tests d’utilisation de transcription `/status` alimentent désormais directement des lignes de transcription SQLite
  au lieu d’écrire des fichiers JSONL.
  Les tests de cycle de vie de session Gateway utilisent désormais directement les helpers d’amorçage de transcription SQLite ;
  l’ancienne forme de fixture de fichier de session à ligne unique a disparu de la couverture de réinitialisation
  et de suppression.
  `sessions.delete` ne renvoie plus un champ de l’ère fichier `archived: []` ; la suppression
  ne rapporte que le résultat de mutation de ligne. L’ancienne option `deleteTranscript` a
  également disparu : supprimer une session supprime la racine canonique `sessions` et laisse
  SQLite propager en cascade les lignes de transcription, d’instantané et de trajectoire appartenant à la session, afin qu’aucun
  appelant ne puisse laisser d’orphelins de transcription ni oublier une branche de nettoyage.
  Les tests de capture de trajectoire context-engine lisent désormais les lignes `trajectory_runtime_events`
  depuis une base de données d’agent isolée au lieu de lire
  `session.trajectory.jsonl`.
  Les scripts d’amorçage du canal Docker MCP alimentent désormais directement les lignes SQLite. Les écritures directes
  de `sessions.json` sont limitées aux fixtures doctor.
  L’E2E Tool Search Gateway lit les preuves d’appel d’outil depuis les lignes de transcription SQLite
  au lieu de parcourir les fichiers `agents/<agentId>/sessions/*.jsonl`.
  Les événements hôte memory-core et les lignes de travail session-corpus vivent désormais dans l’état de Plugin SQLite
  partagé ; `events.jsonl` et `session-corpus/*.txt` sont uniquement des entrées de migration doctor héritées.
  Les lignes actives utilisent des chemins virtuels `memory/session-ingestion/`,
  et non `.dreams/session-corpus`. L’ancien module de réparation Dreaming
  memory-core et ses tests CLI/Gateway ont été supprimés, car le runtime ne
  possède plus la réparation d’archive fichier pour ce corpus. Les tests
  bridge/public-artifact memory-core n’exposent plus `.dreams/events.jsonl` ; ils
  utilisent le nom d’artifact JSON virtuel adossé à SQLite.
  Les docs de test SDK public/Codex indiquent désormais un état de session SQLite au lieu de fichiers de session,
  et l’exemple channel-turn n’expose plus d’argument `storePath`.
  L’état de synchronisation Matrix utilise désormais directement le magasin d’état de Plugin SQLite. Les contrats actifs
  client/runtime transmettent une racine de stockage de compte, et non un chemin `bot-storage.json`,
  et doctor importe l’ancien `bot-storage.json` dans SQLite avant de supprimer
  la source. Les scénarios QA Matrix de redémarrage/destruction modifient désormais directement la ligne de synchronisation SQLite
  au lieu de créer ou supprimer de faux fichiers `bot-storage.json`, et
  le substrat E2EE transmet une racine de magasin de synchronisation au lieu d’un faux
  chemin `sync-store.json`.
  La sélection de racine de stockage Matrix ne note plus les racines selon d’anciens fichiers JSON de synchronisation/thread ;
  elle utilise des métadonnées de racine durables plus l’état crypto réel.
  La suite de tests du backend de session SQLite runtime ne fabrique plus de
  `sessions.json` ; les fixtures source héritées vivent désormais dans les tests
  doctor qui les importent.
  Les tests de session Gateway n’exposent plus de helper `createSessionStoreDir` ni
  de configuration inutilisée de chemin temporaire de magasin de sessions ; les répertoires de fixtures sont explicites, et la configuration directe
  de lignes utilise le nommage des lignes de session SQLite.
  La couverture du parseur de magasin de sessions JSON5 réservé à doctor a quitté les tests infra pour
  les tests de migration doctor, afin que les suites de tests runtime ne possèdent plus l’analyse
  des fichiers de session hérités.
  Les tests runtime SSO/téléversement en attente de Microsoft Teams ne portent plus de fixtures
  ou parseurs sidecar JSON ; l’analyse des jetons SSO hérités vit uniquement dans le module de migration
  du Plugin. Les tests Telegram n’amorcent plus de faux chemins de magasin `/tmp/*.json` ;
  ils réinitialisent directement le cache de messages adossé à SQLite. Le helper générique
  d’état de test OpenClaw n’expose plus de writer `auth-profiles.json`
  hérité ; les tests de migration d’auth doctor possèdent cette fixture localement.
  Les tests runtime pour les pointeurs de dernière session TUI, les approbations exec, les bascules active-memory,
  la déduplication/vérification de démarrage Matrix, la synchronisation de source Memory Wiki,
  les liaisons de conversation actuelle, l’auth d’onboarding et les imports de secrets Hermes ne
  fabriquent plus d’anciens fichiers sidecar ni n’affirment l’absence d’anciens noms de fichiers. Ils
  prouvent le comportement via des lignes SQLite et des API de magasin publiques ; les tests doctor/migration
  sont le seul endroit où les noms de fichiers source hérités appartiennent.
  Les tests runtime pour l’appairage device/node, channel allowFrom, les intentions de redémarrage,
  le transfert de redémarrage, les entrées de file de livraison de session, la santé de configuration, les caches iMessage,
  les tâches cron, les en-têtes de transcription PI, les registres de sous-agents et les pièces jointes image gérées
  ne créent plus non plus de fichiers JSON/JSONL retirés uniquement pour prouver
  qu’ils sont ignorés ou absents.
  La récupération de dépassement PI n’a plus de fallback de réécriture/troncature
  SessionManager : la troncature de résultats d’outil et les réécritures de transcription context-engine modifient
  les lignes de transcription SQLite, puis actualisent l’état de prompt actif depuis la base de données.
  Les ajouts de messages persistés SessionManager délèguent au helper atomique d’ajout de transcription SQLite
  pour la sélection du parent et l’idempotence. Les ajouts d’entrées
  métadonnées/personnalisées normales sélectionnent aussi le parent courant dans SQLite, afin que
  les instances de gestionnaire obsolètes ne ressuscitent pas les courses de chaînes de parents pré-SQLite.
  Le nettoyage de fin PI synthétique pour les précontrôles de milieu de tour et `sessions_yield` rogne désormais
  directement l’état de transcription SQLite ; l’ancien pont de suppression de fin
  SessionManager et ses tests sont supprimés.
  La capture de points de contrôle Compaction prend aussi des instantanés uniquement depuis SQLite ; les appelants ne
  transmettent plus un SessionManager actif comme source de transcription alternative.
- Conserver les tests qui amorcent des fichiers hérités uniquement pour la migration.
- La preuve par fichier JSON a été remplacée par une preuve par ligne SQL pour les surfaces
  runtime actives.

- Ajouter des interdictions statiques pour les écritures runtime vers les anciens chemins JSON de session/cache.
  Terminé pour la garde du dépôt.

10. Rendre le rapport de migration auditables.
    - Enregistrer les exécutions de migration dans SQLite avec les horodatages de début/fin, les chemins
      source, les hachages source, les nombres, les avertissements et le chemin de sauvegarde.
      Terminé : les exécutions de migration d’état hérité persistent désormais un rapport `migration_runs`
      avec inventaire des chemins/tables source, SHA-256 de fichier source, tailles,
      nombres d’enregistrements, avertissements et chemin de sauvegarde.
      Terminé : les exécutions de migration d’état hérité persistent aussi des lignes `migration_sources`
      pour l’audit au niveau source et les futures décisions d’omission/backfill.
    - Rendre l’application idempotente. Une nouvelle exécution après un import partiel doit soit
      ignorer une source déjà importée, soit fusionner par clé stable.
      Terminé : les index de session, les transcriptions, les files de livraison, l’état de Plugin, les registres de tâches,
      et les lignes SQLite globales appartenant aux agents importent via des clés stables ou
      une sémantique upsert/replace, afin que les nouvelles exécutions fusionnent sans dupliquer les lignes
      durables.
    - Les imports échoués doivent laisser le fichier source original en place.
      Terminé : les imports de transcription échoués laissent désormais la source JSONL originale à
      son chemin détecté, et `migration_sources` enregistre la source comme
      `warning` avec `removed_source=0` pour la prochaine exécution doctor.

## Règles de performance

- Une connexion par thread/processus convient ; ne pas partager les handles entre
  workers.
- Utiliser WAL, `foreign_keys=ON`, un délai d’attente busy de 30 s, et de courtes transactions d’écriture `BEGIN IMMEDIATE`.
- Garder les helpers de transaction d’écriture synchrones sauf/jusqu’à ce qu’une API de transaction asynchrone
  ajoute une sémantique explicite de mutex/backpressure.
- Garder les écritures de livraison parent petites et transactionnelles.
- Éviter les réécritures de magasin entier ; utiliser upsert/delete au niveau ligne.
- Ajouter des index pour les chemins list-by-agent, list-by-session, updated-at, run id et
  expiration avant de déplacer du code chaud.
- Stocker les grands artifacts, médias et vecteurs sous forme de BLOBs ou de lignes BLOB fragmentées, et non
  en JSON base64 ou tableau numérique.
- Garder les entrées d’état de Plugin opaques petites et bornées.
- Ajouter un nettoyage SQL pour TTL/expiration au lieu d’un élagage du système de fichiers.
  Terminé pour les magasins runtime possédés par la base de données : médias, état de Plugin, blobs de Plugin,
  déduplication persistante et cache d’agent expirent tous via des lignes SQLite. Le nettoyage restant
  du système de fichiers est limité aux matérialisations temporaires ou aux commandes de suppression explicites.

## Interdictions statiques

Ajouter une vérification de dépôt qui échoue les nouvelles écritures runtime vers les chemins d’état hérités :

- `sessions.json`
- `*.trajectory.jsonl` sauf les sorties matérialisées des lots de support
- `.acp-stream.jsonl`
- `acp/event-ledger.json`
- fichiers de cache d’exécution `cache/*.json`
- `agents/<agentId>/agent/auth.json`
- `agents/<agentId>/agent/models.json`
- `credentials/oauth.json`
- `github-copilot.token.json`
- `openrouter-models.json`
- `auth-profiles.json`
- `auth-state.json`
- `exec-approvals.json`
- `workspace-state.json`
- fichiers Matrix `credentials*.json` et `recovery-key.json`
- `cron/runs/*.jsonl`
- `cron/jobs.json`
- `jobs-state.json`
- `device-pair-notify.json`
- `devices/pending.json`
- `devices/paired.json`
- `devices/bootstrap.json`
- `nodes/pending.json`
- `nodes/paired.json`
- `identity/device.json`
- `identity/device-auth.json`
- `push/web-push-subscriptions.json`
- `push/vapid-keys.json`
- `push/apns-registrations.json`
- `process-leases.json`
- `gateway-instance-id`
- `session-toggles.json`
- Noyau de mémoire `.dreams/events.jsonl`
- Noyau de mémoire `.dreams/session-corpus/`
- Noyau de mémoire `.dreams/daily-ingestion.json`
- Noyau de mémoire `.dreams/session-ingestion.json`
- Noyau de mémoire `.dreams/short-term-recall.json`
- Noyau de mémoire `.dreams/phase-signals.json`
- Noyau de mémoire `.dreams/short-term-promotion.lock`
- Atelier Skills `skill-workshop/<workspace>.json`
- Atelier Skills `skill-workshop/skill-workshop-review-*.json`
- Nostr `bus-state-*.json`
- Nostr `profile-state-*.json`
- `calls.jsonl`
- `known-users.json`
- `ref-index.jsonl`
- QQBot `session-*.json`
- BlueBubbles `bluebubbles/catchup/*.json`
- BlueBubbles `bluebubbles/inbound-dedupe/*.json`
- Telegram `update-offset-*.json`
- Telegram `sticker-cache.json`
- Telegram `*.telegram-messages.json`
- Telegram `*.telegram-sent-messages.json`
- Telegram `*.telegram-topic-names.json`
- Telegram `thread-bindings-*.json`
- iMessage `catchup/*.json`
- iMessage `reply-cache.jsonl`
- iMessage `sent-echoes.jsonl`
- Microsoft Teams `msteams-conversations.json`
- Microsoft Teams `msteams-polls.json`
- Microsoft Teams `msteams-sso-tokens.json`
- Microsoft Teams `*.learnings.json`
- Matrix `bot-storage.json`
- Matrix `sync-store.json`
- Matrix `thread-bindings.json`
- Matrix `inbound-dedupe.json`
- Matrix `startup-verification.json`
- Matrix `storage-meta.json`
- Matrix `crypto-idb-snapshot.json`
- Discord `model-picker-preferences.json`
- Discord `command-deploy-cache.json`
- fichiers JSON de fragments du registre sandbox
- fichiers JSON du pont `/tmp` du relais de hook natif
- `plugin-state/state.sqlite`
- side-cars d’exécution ad hoc `openclaw-state.sqlite`
- `tasks/runs.sqlite`
- `tasks/flows/registry.sqlite`
- `bindings/current-conversations.json`
- `restart-sentinel.json`
- `gateway-restart-intent.json`
- `gateway-supervisor-restart-handoff.json`
- `gateway.<hash>.lock`
- `qmd/embed.lock`
- `commands.log`
- `config-health.json`
- `port-guard.json`
- `settings/voicewake.json`
- `settings/voicewake-routing.json`
- `plugin-binding-approvals.json`
- `plugins/installs.json`
- `audit/file-transfer.jsonl`
- `audit/crestodian.jsonl`
- `crestodian/rescue-pending/*.json`
- `plugins/phone-control/armed.json`
- Wiki mémoire `.openclaw-wiki/log.jsonl`
- Wiki mémoire `.openclaw-wiki/state.json`
- Wiki mémoire `.openclaw-wiki/locks/`
- Wiki mémoire `.openclaw-wiki/source-sync.json`
- Wiki mémoire `.openclaw-wiki/import-runs/*.json`
- Wiki mémoire `.openclaw-wiki/cache/agent-digest.json`
- Wiki mémoire `.openclaw-wiki/cache/claims.jsonl`
- ClawHub `.clawhub/lock.json`
- ClawHub `.clawhub/origin.json`
- Décoration de profil de navigateur `.openclaw-profile-decorated`
- ouvreurs de sessions adossées à des fichiers `SessionManager.open(...)`
- façades de liste des transcriptions `SessionManager.listAll(...)` et `TranscriptSessionManager.listAll(...)`
- façades de bifurcation de transcription `SessionManager.forkFromSession(...)` et
  `TranscriptSessionManager.forkFromSession(...)`
- façades de remplacement de session mutable `SessionManager.newSession(...)` et `TranscriptSessionManager.newSession(...)`
- façades de sessions de branche `SessionManager.createBranchedSession(...)` et
  `TranscriptSessionManager.createBranchedSession(...)`

L’interdiction doit permettre aux tests de créer des fixtures héritées et permettre au code de migration de
lire/importer/supprimer les sources de fichiers héritées. Les side-cars SQLite non livrés restent interdits
et ne bénéficient pas d’autorisations d’import doctor.

## Critères d’achèvement

- Les écritures de données et de cache d’exécution vont dans la base de données SQLite globale ou agent.
- L’exécution n’écrit plus d’index de session, de transcriptions JSONL, de JSON de registre sandbox, de side-cars SQLite de tâches ni de side-cars SQLite d’état de Plugin. Les importateurs SQLite des side-cars de tâches et d’état de Plugin non livrés sont supprimés.
- L’import de fichiers hérités est réservé à doctor.
- La sauvegarde produit une archive unique avec des instantanés SQLite compacts et une preuve d’intégrité.
- Les workers agent peuvent s’exécuter avec le disque, un scratch VFS ou un stockage expérimental uniquement VFS.
- La configuration et les fichiers d’identifiants explicites restent les seuls fichiers de contrôle persistants non base de données attendus.
- Les vérifications du dépôt empêchent la réintroduction des magasins de fichiers d’exécution hérités.
