---
read_when:
    - Déplacer les données d’exécution, le cache, les transcriptions, l’état des tâches ou les fichiers temporaires d’OpenClaw dans SQLite
    - Concevoir des migrations doctor depuis des fichiers JSON ou JSONL hérités
    - Modification du comportement de sauvegarde, de restauration, de VFS ou de stockage des workers
    - Suppression des verrous de session, de l’élagage, de la troncature ou des chemins de compatibilité JSON
summary: Plan de migration pour faire de SQLite la couche principale d’état durable et de cache tout en conservant la configuration adossée à des fichiers
title: Refactorisation de l’état axée sur la base de données
x-i18n:
    generated_at: "2026-07-01T20:20:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 566e6aacfaa6aff0db2d1d143ef313d0ce97b82428152bc8940856e317a149ff
    source_path: refactor/database-first.md
    workflow: 16
---

# Refactorisation de l’état avec priorité à la base de données

## Décision

Utiliser une structure SQLite à deux niveaux :

- Base de données globale : `~/.openclaw/state/openclaw.sqlite`
- Base de données d’agent : une base de données SQLite par agent pour l’espace de travail,
  la transcription, le VFS, les artefacts et le grand état d’exécution propre à l’agent
- La configuration reste adossée à des fichiers : `openclaw.json` reste en dehors de la
  base de données. Les profils d’authentification d’exécution migrent vers SQLite ; les fichiers
  d’identifiants de fournisseur externe ou de CLI restent gérés par leur propriétaire en dehors de la base de données d’OpenClaw.

La base de données globale est la base de données du plan de contrôle. Elle possède la découverte des agents,
l’état partagé du Gateway, l’appairage, l’état des appareils/nœuds, les journaux de tâches et de flux, l’état des Plugins,
l’état d’exécution du planificateur, les métadonnées de sauvegarde et l’état des migrations.

La base de données de l’agent est la base de données du plan de données. Elle possède les métadonnées de session
de l’agent, le flux d’événements de transcription, l’espace de travail VFS ou l’espace de noms temporaire, les
artefacts d’outils, les artefacts d’exécution et les données de cache locales à l’agent consultables/indexables.

Cela donne une vue globale durable sans forcer les grands espaces de travail d’agent,
les transcriptions et les données binaires temporaires à passer par la voie d’écriture partagée du Gateway.

## Contrat strict

Cette migration a une seule forme d’exécution canonique :

- Les lignes de session ne persistent que les métadonnées de session. Elles ne doivent pas persister
  `transcriptLocator`, les chemins de fichiers de transcription, les chemins JSONL apparentés, les chemins de verrouillage,
  les métadonnées d’élagage ni les pointeurs de compatibilité de l’ère des fichiers.
- L’identité de transcription est toujours l’identité SQLite : `{agentId, sessionId}` plus
  les métadonnées de sujet facultatives lorsque le protocole en a besoin.
- `sqlite-transcript://...` n’est pas une identité d’exécution ou de protocole. Le nouveau code ne doit
  pas dériver, persister, transmettre, analyser ni migrer des localisateurs de transcription. L’exécution et
  les tests ne doivent contenir aucun pseudo-localisateur ; les docs peuvent mentionner la chaîne
  uniquement pour l’interdire.
- Les anciens `sessions.json`, transcriptions JSONL, `.jsonl.lock`, l’élagage, la troncature
  et l’ancienne logique de chemin de session appartiennent uniquement au chemin de migration/import du doctor.
- Les anciens alias de configuration de session appartiennent uniquement à la migration doctor. L’exécution
  n’interprète pas `session.idleMinutes`, `session.resetByType.dm` ni les alias de session principale
  `agent:main:*` inter-agents pour un autre agent configuré.
- L’identité de routage de session est un état relationnel typé. Les chemins d’exécution à chaud et d’UI
  doivent lire `sessions.session_scope`, `sessions.account_id`,
  `sessions.primary_conversation_id`, `conversations` et
  `session_conversations` ; ils ne doivent pas analyser `session_key` ni fouiller
  `session_entries.entry_json` pour l’identité fournisseur, sauf comme ombre de compatibilité
  pendant la suppression des anciens sites d’appel.
- Les marqueurs de message direct au niveau canal, tels que `dm` contre `direct`, sont du vocabulaire
  de routage, pas des localisateurs de transcription ni des poignées de compatibilité de stockage fichier.
- L’ancienne configuration des gestionnaires de hook appartient uniquement aux surfaces d’avertissement/migration du doctor.
  L’exécution ne doit pas charger `hooks.internal.handlers` ; les hooks passent uniquement par les répertoires
  de hooks découverts et les métadonnées `HOOK.md`.
- Le démarrage de l’exécution, les chemins de réponse à chaud, la Compaction, la réinitialisation, la récupération, les diagnostics,
  le TTS, les hooks mémoire, les sous-agents, le routage des commandes de Plugin, les frontières de protocole et
  les hooks doivent transmettre `{agentId, sessionId}` dans l’exécution.
- Les tests doivent initialiser et vérifier les lignes de transcription SQLite via
  `{agentId, sessionId}`. Les tests qui prouvent seulement la transmission de chemin JSONL,
  la préservation d’un localisateur fourni par l’appelant ou la compatibilité de fichier de transcription doivent
  être supprimés, sauf s’ils couvrent l’import doctor, la matérialisation de support/débogage hors session
  ou la forme du protocole.
- `runEmbeddedPiAgent(...)`, les exécutions de workers préparées et la tentative embarquée interne
  ne doivent pas accepter de localisateurs de transcription. Ils ouvrent le gestionnaire de transcription SQLite
  par `{agentId, sessionId}` et transmettent ce gestionnaire à la session d’agent compatible PI internalisée,
  afin que les appelants obsolètes ne puissent pas faire écrire au runner des transcriptions JSON/JSONL.
- Les diagnostics du runner doivent stocker les enregistrements de trace d’exécution/cache/charge utile dans SQLite.
  Les diagnostics d’exécution ne doivent pas exposer de réglages de substitution de fichier JSONL ni d’aides génériques
  d’export JSONL de transcription ; les exports visibles par l’utilisateur peuvent matérialiser des artefacts explicites
  depuis les lignes de base de données sans réinjecter de noms de fichiers dans l’exécution.
- La journalisation de flux bruts utilise `OPENCLAW_RAW_STREAM=1` plus des lignes de diagnostics SQLite.
  L’ancien contrat pi-mono de journaliseur de fichiers `PI_RAW_STREAM`, `PI_RAW_STREAM_PATH` et
  `raw-openai-completions.jsonl` ne fait pas partie de l’exécution ou des tests d’OpenClaw.
- L’indexation mémoire QMD ne doit pas exporter les transcriptions SQLite vers des fichiers Markdown.
  QMD indexe uniquement les fichiers mémoire configurés ; la recherche dans les transcriptions de session reste
  adossée à SQLite.
- Le sous-chemin SDK QMD est réservé à QMD pour le nouveau code. Les aides d’indexation des transcriptions
  de session SQLite vivent sur `memory-core-host-engine-session-transcripts` ; toute réexportation QMD
  est seulement une compatibilité et ne doit pas être utilisée par le code d’exécution.
- Les index mémoire intégrés vivent dans la base de données de l’agent propriétaire. La configuration d’exécution et
  les contrats d’exécution résolus ne doivent pas exposer `memorySearch.store.path` ; doctor
  supprime cette ancienne clé de configuration et le code actuel transmet le
  `databasePath` de l’agent en interne.

Le travail d’implémentation doit continuer à supprimer du code jusqu’à ce que ces énoncés soient vrais
sans exception en dehors des frontières doctor/import/export/debug.

## État cible et progression

### Objectif strict

- Une base de données SQLite globale possède l’état du plan de contrôle :
  `state/openclaw.sqlite`.
- Une base de données SQLite par agent possède l’état du plan de données :
  `agents/<agentId>/agent/openclaw-agent.sqlite`.
- La configuration reste adossée à des fichiers. `openclaw.json` ne fait pas partie de cette
  refactorisation de base de données.
- Les anciens fichiers sont uniquement des entrées de migration doctor.
- L’exécution n’écrit ni ne lit jamais de JSONL de session ou de transcription comme état actif.

### États cibles

- `not-started` : le code d’exécution de l’ère des fichiers écrit encore l’état actif.
- `migrating` : le code doctor/import peut déplacer les données de fichiers vers SQLite.
- `dual-read` : passerelle temporaire lisant à la fois SQLite et les anciens fichiers. Cet état
  est interdit pour cette refactorisation, sauf s’il est explicitement documenté comme
  réservé au doctor.
- `sqlite-runtime` : l’exécution lit et écrit uniquement SQLite.
- `clean` : les API et tests d’exécution hérités sont supprimés, et la garde empêche
  les régressions.
- `done` : les docs, tests, sauvegarde, migration doctor et vérifications de changements prouvent
  l’état propre.

### État actuel

- Sessions : `clean` pour l’exécution. Les lignes de session vivent dans la base de données par agent,
  les API d’exécution utilisent `{agentId, sessionId}` ou `{agentId, sessionKey}`, et
  `sessions.json` est une entrée héritée réservée au doctor.
- Transcriptions : `clean` pour l’exécution. Les événements de transcription, identités, instantanés
  et événements d’exécution de trajectoire vivent dans la base de données par agent. L’exécution
  n’accepte plus les localisateurs de transcription ni les chemins de transcription JSONL.
- Runner PI embarqué : `clean`. Les exécutions PI embarquées, workers préparés, la Compaction
  et les boucles de nouvelle tentative utilisent la portée de session SQLite et rejettent les poignées de transcription obsolètes.
- Cron : `clean` pour l’exécution. L’exécution utilise `cron_jobs` et `cron_run_logs` ;
  les tests d’exécution utilisent le nommage SQLite `storeKey`, et les chemins Cron de l’ère des fichiers restent uniquement dans
  les tests de migration héritée doctor.
- Registre de tâches : `clean`. Les lignes d’exécution de tâche et TaskFlow vivent dans
  `state/openclaw.sqlite` ; les importateurs SQLite sidecar non publiés sont supprimés.
- État de Plugin : `clean`. Les lignes d’état/blob de Plugin vivent dans la base de données globale
  partagée ; les anciens assistants SQLite sidecar d’état de Plugin sont protégés contre la régression.
- Mémoire : `sqlite-runtime` pour la mémoire intégrée et l’indexation des transcriptions de session.
  Les tables d’index mémoire vivent dans la base de données par agent, l’état mémoire des Plugins utilise
  les lignes d’état de Plugin partagées, et les anciens fichiers mémoire sont des entrées de migration doctor
  ou du contenu d’espace de travail utilisateur.
- Sauvegarde : `sqlite-runtime`. Les étapes de sauvegarde compactent les instantanés SQLite, omettent les sidecars
  WAL/SHM actifs, vérifient l’intégrité SQLite et enregistrent les exécutions de sauvegarde dans la
  base de données globale.
- Migration doctor : `migrating`, intentionnellement. Doctor importe l’ancien JSON,
  JSONL et les magasins sidecar retirés dans SQLite, enregistre les exécutions/sources de migration,
  et supprime les sources réussies.
- Scripts E2E : `clean` pour la couverture d’exécution. L’amorçage Docker MCP écrit des lignes SQLite.
  Le script Docker runtime-context crée du JSONL hérité uniquement dans l’amorce de migration doctor
  et nomme explicitement le chemin de l’index de session hérité.

### Travail restant

- [x] Renommer les variables de stockage des tests d’exécution Cron pour qu’elles n’utilisent plus `storePath`, sauf
      si ce sont des entrées héritées doctor.
      Fichiers : `src/cron/service.test-harness.ts`,
      `src/cron/service.runs-one-shot-main-job-disables-it.test.ts`,
      `src/cron/service/timer.regression.test.ts`,
      `src/cron/service/ops.test.ts`, `src/cron/service/store.test.ts`,
      `src/cron/service.heartbeat-ok-summary-suppressed.test.ts`,
      `src/cron/service.main-job-passes-heartbeat-target-last.test.ts`,
      `src/cron/store.test.ts`.
      Preuve : `pnpm check:database-first-legacy-stores` ; `rg -n 'storePath' src/cron --glob '!**/commands/doctor/**'`.
- [x] Supprimer ou renommer les mocks de test d’export obsolètes de l’ère des fichiers.
      Fichier : `src/auto-reply/reply/commands-export-test-mocks.ts`.
      Preuve : `rg -n 'resolveSessionFilePath|sessionFile|storePath|transcriptLocator' src/auto-reply/reply`.
- [x] Rendre l’amorce JSONL héritée runtime-context Docker manifestement réservée au doctor.
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
- [x] Avant de déclarer `done`, exécuter le gate des changements ou une preuve large distante.
      Preuve : `pnpm check:changed --timed -- <changed extension paths>` a réussi sur
      l’exécution Hetzner Crabbox `run_3f1cabf6b25c` après configuration temporaire de Node 24/pnpm et
      routage explicite des chemins pour l’espace de travail synchronisé sans `.git`.

### Ne pas régresser

- Aucun localisateur de transcription.
- Aucun fichier de session actif.
- Aucun faux fixture de test JSONL sauf les tests de migration héritée doctor.
- Aucun accès SQLite brut là où Kysely est attendu.
- Aucune nouvelle migration de base de données héritée. Cette structure n’a pas été publiée ; garder la version de schéma
  à `1` sauf raison forte.

## Hypothèses de lecture du code

Aucune décision produit de suivi ne bloque ce plan. L’implémentation doit
procéder avec ces hypothèses :

- Utiliser `node:sqlite` directement et exiger l’environnement d’exécution Node 22+ pour ce chemin de stockage.
- Conserver exactement un fichier de configuration normal. Ne pas déplacer la configuration, les manifestes de Plugin ni les espaces de travail Git dans SQLite dans ce refactor.
- Les fichiers de compatibilité d’exécution ne sont pas requis. Les anciens fichiers JSON et JSONL sont uniquement des entrées de migration. Les sidecars SQLite locaux à la branche n’ont jamais été livrés et sont supprimés au lieu d’être importés.
- `openclaw doctor --fix` possède l’étape de migration des anciens fichiers vers la base de données. Le démarrage de l’exécution et `openclaw migrate` ne doivent pas porter les anciens chemins de mise à niveau de base de données OpenClaw.
- La compatibilité des identifiants suit la même règle : les identifiants d’exécution vivent dans SQLite. Les anciens fichiers `auth-profiles.json`, `auth.json` par agent et les fichiers partagés `credentials/oauth.json` sont des entrées de migration doctor, puis sont supprimés après import.
- L’état généré du catalogue de modèles est adossé à la base de données. Le code d’exécution ne doit pas écrire `agents/<agentId>/agent/models.json`; les fichiers `models.json` existants sont des entrées héritées pour doctor et sont supprimés après import dans `agent_model_catalogs`.
- L’exécution ne doit pas migrer, normaliser ni relier les localisateurs de transcription. L’identité de transcription active est `{agentId, sessionId}` dans SQLite. Les chemins de fichiers sont uniquement des entrées héritées pour doctor, et `sqlite-transcript://...` doit disparaître des surfaces d’exécution, de protocole, de hook et de Plugin au lieu d’être traité comme une poignée de frontière.
- Les lectures de transcriptions SQLite à l’exécution n’exécutent pas d’anciennes migrations de forme d’entrée JSONL et ne réécrivent pas des transcriptions entières pour la compatibilité. La normalisation des entrées héritées reste dans des utilitaires doctor/import explicites. Doctor normalise les anciens fichiers de transcription JSONL avant d’insérer des lignes SQLite ; les lignes d’exécution actuelles sont déjà écrites dans le schéma de transcription actuel. L’export de trajectoire/session lit ces lignes telles quelles et ne doit pas effectuer de migrations héritées au moment de l’export.
- Les helpers d’analyse/migration des anciennes transcriptions JSONL sont réservés à doctor. Le code de format de transcription d’exécution construit uniquement le contexte de transcription SQLite actuel ; doctor possède les mises à niveau des anciennes entrées JSONL avant l’insertion des lignes.
- L’ancien helper de streaming de transcription JSONL possédé par l’exécution a été supprimé. Le code d’import doctor possède les lectures explicites des fichiers hérités ; l’historique de session d’exécution lit les lignes SQLite.
- Les liaisons du serveur d’application Codex utilisent le `sessionId` OpenClaw comme clé canonique dans l’espace de noms d’état de Plugin Codex. `sessionKey` est une métadonnée pour le routage/l’affichage et ne doit pas remplacer l’identifiant de session durable ni ressusciter l’identité de fichier de transcription.
- Les moteurs de contexte reçoivent directement le contrat d’exécution actuel. Le registre ne doit pas envelopper les moteurs avec des shims de nouvelle tentative qui suppriment `sessionKey`, `transcriptScope` ou `prompt` ; les moteurs qui ne peuvent pas accepter les paramètres actuels privilégiant la base de données doivent échouer bruyamment au lieu d’être reliés.
- La sortie de sauvegarde doit rester un seul fichier d’archive. Le contenu de la base de données doit entrer dans cette archive sous forme d’instantanés SQLite compacts, et non de sidecars WAL actifs bruts.
- La recherche de transcriptions est utile, mais pas requise pour la première version privilégiant la base de données. Concevoir le schéma de sorte que FTS puisse être ajouté plus tard.
- L’exécution des workers doit rester expérimentale derrière les paramètres pendant que la frontière de base de données se stabilise.

## Constats de lecture du code

La branche actuelle a déjà dépassé le stade de preuve de concept. La base de données partagée existe, Node `node:sqlite` est câblé via un petit helper d’exécution, et les anciens magasins écrivent maintenant dans `state/openclaw.sqlite` ou dans la base de données `openclaw-agent.sqlite` propriétaire.

Le travail restant ne consiste pas à choisir SQLite ; il consiste à garder la nouvelle frontière propre et à supprimer toutes les interfaces de forme compatible qui ressemblent encore à l’ancien monde des fichiers :

- Le `storePath` de session n’est plus une identité d’exécution, une forme de fixture de test ni un champ de charge utile de statut. Les tests d’exécution et de bridge ne contiennent plus le nom de contrat `storePath` ; le code doctor/migration possède ce vocabulaire hérité.
- Les écritures de session ne passent plus par l’ancienne file en processus `store-writer.ts`. Les écritures de patch SQLite utilisent plutôt la détection de conflits et une nouvelle tentative bornée.
- La découverte des chemins hérités a encore des usages valides de migration, mais le code d’exécution doit cesser de traiter `sessions.json` et les fichiers de transcription JSONL comme des cibles d’écriture possibles.
- Les tables possédées par l’agent vivent dans des bases de données SQLite par agent. La base de données globale conserve les lignes de registre/plan de contrôle ; l’identité de transcription est `{agentId, sessionId}` dans les lignes de transcription par agent. Le code d’exécution ne doit pas persister les chemins de fichiers de transcription ni migrer les localisateurs de transcription.
- Doctor importe déjà plusieurs fichiers hérités. Le nettoyage consiste à en faire une seule implémentation de migration explicite que doctor appelle, avec un rapport de migration durable.

Aucune question produit supplémentaire ne bloque l’implémentation.

## Forme actuelle du code

La branche dispose déjà d’une vraie base SQLite partagée :

- Le plancher d’exécution est désormais Node 22+ : `package.json`, la garde d’exécution de la CLI,
  les valeurs par défaut de l’installateur, le localisateur d’exécution macOS, la CI et la documentation
  d’installation publique sont tous alignés. L’ancienne voie de compatibilité Node 22 est supprimée.
- `src/state/openclaw-state-db.ts` ouvre `openclaw.sqlite`, définit WAL,
  `synchronous=NORMAL`, `busy_timeout=30000`, `foreign_keys=ON`, et applique
  le module de schéma généré dérivé de
  `src/state/openclaw-state-schema.sql`.
- Les types de tables Kysely et les modules de schéma d’exécution sont générés à partir de bases de données
  SQLite jetables créées depuis les fichiers `.sql` validés ; le code d’exécution ne
  conserve plus de chaînes de schéma copiées-collées pour les bases de données globales, par agent ou de
  capture proxy.
- Les magasins d’exécution dérivent les types de lignes sélectionnées et insérées depuis ces interfaces Kysely
  `DB` générées au lieu de dupliquer à la main les formes de lignes SQLite. Le SQL brut
  reste limité à l’application de schéma, aux pragmas et au DDL réservé aux migrations.
- Les schémas SQLite sont ramenés à `user_version = 1` car cette disposition de base de données
  n’a pas encore été livrée. Les ouvreurs d’exécution créent uniquement le schéma actuel ;
  l’import fichier-vers-base reste dans le code doctor, et les assistants de mise à niveau
  de base de données propres à la branche ont été supprimés.
- La propriété relationnelle est appliquée là où la frontière de propriété est canonique :
  les lignes de migration source se propagent depuis `migration_runs`, l’état de livraison des tâches
  se propage depuis `task_runs`, et les lignes d’identité de transcript se propagent depuis
  les événements de transcript.
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
- L’état arbitraire appartenant aux plugins ne reçoit pas de tables typées appartenant à l’hôte. Les plugins
  installés utilisent `plugin_state_entries` pour les charges utiles JSON versionnées et
  `plugin_blob_entries` pour les octets, avec propriété namespace/key, nettoyage TTL,
  sauvegarde et enregistrements de migration de plugin. L’état d’orchestration de plugin appartenant à l’hôte peut
  toujours avoir des tables typées lorsque l’hôte possède le contrat de requête, comme
  `plugin_binding_approvals`.
- Les migrations de plugins sont des migrations de données sur des espaces de noms appartenant aux plugins, pas des
  migrations de schéma hôte. Un plugin peut migrer ses propres entrées d’état/blob versionnées
  via un fournisseur de migration, et l’hôte enregistre l’état source/exécution dans le
  registre de migration normal. Les nouvelles installations de plugins ne nécessitent pas de modifier
  `openclaw-state-schema.sql` sauf si l’hôte lui-même prend possession d’un
  nouveau contrat inter-plugins.
- `src/state/openclaw-agent-db.ts` ouvre
  `agents/<agentId>/agent/openclaw-agent.sqlite`, enregistre la base de données dans la
  base de données globale, et possède les tables locales à l’agent de session, transcript, VFS, artefact, cache
  et index mémoire. La découverte d’exécution partagée lit désormais le registre
  `agent_databases` typé généré au lieu de réimplémenter cette requête à chaque site
  d’appel.
- Les bases de données globales et par agent enregistrent une ligne `schema_meta` avec le rôle de la base de données,
  la version de schéma, les horodatages et l’id d’agent pour les bases de données d’agent. La disposition reste
  à `user_version = 1` car ce schéma SQLite n’a pas encore été livré.
- L’identité de session par agent possède désormais une table racine canonique `sessions` indexée par
  `session_id`, avec `session_key`, `session_scope`, `account_id`,
  `primary_conversation_id`, les horodatages, les champs d’affichage, les métadonnées de modèle,
  l’id de harnais et les liens parent/spawn sous forme de colonnes requêtables. `session_routes`
  est l’index de route active unique de `session_key` vers le `session_id` actuel,
  afin qu’une clé de route puisse passer à une nouvelle session durable sans
  obliger les lectures rapides à choisir entre des lignes `sessions.session_key` en double. L’ancienne
  charge utile de forme compatible `session_entries.entry_json` est rattachée à la racine
  durable `session_id` par clé étrangère ; elle n’est plus la seule
  représentation de niveau schéma d’une session.
- L’identité de conversation externe par agent est également relationnelle :
  `conversations` stocke l’identité normalisée fournisseur/compte/conversation, et
  `session_conversations` lie une session OpenClaw à une ou plusieurs conversations externes.
  Cela couvre les sessions DM principales partagées où plusieurs pairs peuvent
  intentionnellement correspondre à une session sans mentir dans `session_key`. SQLite applique aussi
  l’unicité de l’identité fournisseur naturelle afin que le même tuple
  channel/account/kind/peer/thread ne puisse pas diverger entre plusieurs ids de conversation.
  Les pairs directs principaux partagés sont liés avec un rôle `participant`, afin qu’une
  session OpenClaw puisse représenter plusieurs pairs DM externes sans rétrograder
  les anciens pairs en vagues lignes liées. `sessions.primary_conversation_id` pointe toujours
  vers la cible de livraison typée actuelle. Les colonnes fermées de routage/statut
  sont appliquées avec des contraintes SQLite `CHECK` au lieu de s’appuyer uniquement sur
  des unions TypeScript.
  La projection de session d’exécution efface les ombres de routage de compatibilité de
  `session_entries.entry_json` avant d’appliquer les colonnes typées session/conversation,
  afin que des charges utiles JSON obsolètes ne puissent pas ressusciter des cibles de livraison.
  Le routage d’annonce des sous-agents exige de même le contexte de livraison SQLite typé ;
  il ne se rabat plus sur les champs de route de compatibilité `SessionEntry`.
  L’héritage de livraison explicite Gateway `chat.send` lit le contexte de livraison SQLite
  typé au lieu des champs de compatibilité `origin`/`last*`.
  `tools.effective` dérive de même le contexte fournisseur/compte/thread depuis les lignes SQLite
  typées de livraison/routage, et non depuis des ombres `last*` obsolètes d’entrée de session.
  Le contexte d’invite des événements système reconstruit les champs channel/to/account/thread à partir
  des champs de livraison typés au lieu des ombres `origin`.
  L’assistant partagé `deliveryContextFromSession` et le mappeur session-vers-conversation
  ignorent désormais entièrement `SessionEntry.origin` ; seuls les champs de livraison typés
  et les lignes de conversation relationnelles peuvent créer une identité de route rapide.
  La normalisation des entrées de session d’exécution supprime `origin` avant de persister ou
  projeter `entry_json`, et les écritures de métadonnées entrantes écrivent des champs channel/chat
  typés ainsi que des lignes de conversation relationnelles au lieu de créer de nouvelles ombres
  origin.
- Les événements de transcript, les instantanés de transcript et les événements d’exécution de trajectoire
  référencent désormais la racine canonique `sessions` par agent et se propagent à la suppression
  de session. Les lignes d’identité/idempotence de transcript continuent de se propager depuis
  la ligne exacte d’événement de transcript.
- Les index memory-core utilisent désormais les tables explicites de base de données d’agent
  `memory_index_meta`, `memory_index_sources`, `memory_index_chunks`, et
  `memory_embedding_cache`, avec `memory_index_state` pour suivre les changements de révision.
  Les index latéraux FTS/vector facultatifs sont nommés `memory_index_chunks_fts` et
  `memory_index_chunks_vec` au lieu des tables génériques `meta`, `files`, `chunks`,
  `chunks_fts`, ou `chunks_vec`. Les noms canoniques conservent la forme actuelle des lignes
  path/source et la compatibilité des embeddings sérialisés. Ces tables sont un cache dérivé/de recherche,
  pas le stockage canonique des transcripts ; elles peuvent être
  supprimées et reconstruites à partir des fichiers d’espace de travail mémoire et des sources configurées.
  L’ouverture d’un index mémoire livré avec des noms génériques migre ses métadonnées, sources,
  chunks et cache d’embeddings vers les tables canoniques ; les tables FTS/vector dérivées
  sont reconstruites sous leurs noms canoniques.
- L’état de récupération des exécutions de sous-agents vit désormais dans des lignes partagées typées `subagent_runs`
  avec des clés de session enfant, demandeur et contrôleur indexées. L’ancien
  fichier `subagents/runs.json` sert uniquement d’entrée de migration doctor.
- Les liaisons de conversation actuelles vivent désormais dans des lignes partagées typées
  `current_conversation_bindings` indexées par id de conversation normalisé, avec
  des colonnes agent/session cibles, le type de conversation, le statut, l’expiration et les métadonnées
  stockés comme colonnes relationnelles au lieu d’un enregistrement de liaison opaque dupliqué.
  La clé de liaison durable inclut le type de conversation normalisé afin que les refs
  direct/group/channel ne puissent pas entrer en collision, et SQLite rejette les valeurs de type/statut
  de liaison invalides. L’ancien
  fichier `bindings/current-conversations.json` sert uniquement d’entrée de migration doctor.
- La récupération de la file de livraison superpose désormais des colonnes de file typées pour channel, cible,
  compte, session, nouvelle tentative, erreur, envoi plateforme et état de récupération sur le
  JSON de relecture. `entry_json` conserve les charges utiles de relecture, les hooks et la charge utile de
  formatage, mais les colonnes typées font autorité pour le routage/l’état rapide de la file.
- Les pointeurs de restauration de dernière session TUI vivent désormais dans des lignes partagées typées
  `tui_last_sessions` indexées par le périmètre haché de connexion/session TUI.
  L’ancien fichier JSON TUI sert uniquement d’entrée de migration doctor.
- Les préférences TTS par défaut vivent désormais dans des lignes SQLite d’état de plugin partagé indexées sous le
  plugin `speech-core`. L’ancien fichier `settings/tts.json` sert uniquement d’entrée de migration
  doctor ; l’exécution ne lit ni n’écrit plus de fichiers JSON de préférences TTS, et le
  résolveur de chemin hérité vit dans le module de migration doctor.
- Les métadonnées de cible secrète parlent désormais de magasins au lieu de prétendre que chaque
  cible d’identifiants est un fichier de config. `openclaw.json` reste le magasin de config ;
  les cibles auth-profile utilisent des lignes SQLite typées `auth_profile_stores` avec
  des identifiants structurés par fournisseur conservés comme charges utiles JSON.
- L’audit des secrets ne scanne plus les fichiers `auth.json` par agent retirés. Doctor possède
  l’avertissement, l’import et la suppression de ce fichier hérité.
- Les assistants de chemin de profil d’authentification hérités vivent désormais dans le code hérité doctor. Les assistants de chemin de profil
  d’authentification du cœur exposent l’identité et les emplacements d’affichage du magasin d’authentification SQLite,
  pas les chemins d’exécution `auth-profiles.json` ou `auth-state.json`.
- Les modules d’exécution de récupération des exécutions de sous-agents et du cache de capacités de modèle OpenRouter
  gardent désormais les lecteurs/écrivains d’instantanés SQLite séparés des assistants d’import JSON
  hérités réservés à doctor. Les capacités OpenRouter utilisent les lignes génériques typées
  `model_capability_cache` sous `provider_id = "openrouter"` au lieu
  d’un blob de cache opaque ou d’une table hôte spécifique au fournisseur. Le `taskName` d’exécution de sous-agent
  est stocké dans la colonne typée `subagent_runs.task_name` ; la copie
  `payload_json` est de la donnée de relecture/débogage, pas la source pour les champs rapides
  d’affichage ou de recherche.
- `src/agents/filesystem/virtual-agent-fs.sqlite.ts` implémente un VFS SQLite
  sur la table `vfs_entries` de la base de données d’agent. Les lectures de répertoires, les exports
  récursifs, les suppressions et les renommages utilisent des plages de préfixe `(namespace, path)` indexées
  au lieu de scanner tout un namespace ou de s’appuyer sur une correspondance de chemin `LIKE`.
- `src/agents/runtime-worker.entry.ts` crée des magasins SQLite VFS, d’artefacts d’outil,
  d’artefacts d’exécution et de cache à portée par exécution pour les workers.
- Les marqueurs de fin de bootstrap d’espace de travail vivent désormais dans des lignes partagées typées
  `workspace_setup_state` indexées par le chemin d’espace de travail résolu au lieu de
  `.openclaw/workspace-state.json` ; l’exécution ne lit ni ne réécrit plus le
  marqueur d’espace de travail hérité, et les APIs d’assistance ne transmettent plus un faux chemin
  `.openclaw/setup-state` uniquement pour dériver l’identité de stockage.
- Les approbations exec vivent désormais dans la ligne singleton SQLite partagée typée `exec_approvals_config`.
  Doctor importe l’ancien `~/.openclaw/exec-approvals.json` ;
  les écritures d’exécution ne créent, ne réécrivent ni ne signalent plus ce fichier comme son emplacement
  de magasin actif. Le compagnon macOS lit et écrit la même
  ligne de table `state/openclaw.sqlite` ; il conserve seulement le socket de prompt Unix sur disque
  car il s’agit d’IPC, pas d’un état d’exécution durable.
- Les modules d’exécution d’identité d’appareil, d’authentification d’appareil et de bootstrap gardent désormais leurs
  lecteurs/écrivains d’instantanés SQLite séparés des assistants d’import JSON hérités réservés à doctor.
  L’identité d’appareil utilise des lignes typées `device_identities` et les jetons d’authentification d’appareil
  utilisent des lignes typées `device_auth_tokens`. Les écritures d’authentification d’appareil réconcilient les lignes
  par appareil/rôle au lieu de tronquer la table de jetons, et l’exécution ne
  route plus les mises à jour de jeton unique via l’ancien adaptateur de magasin complet. L’ancien
  Les charges utiles JSON version-1 existent uniquement comme formes d’import/export de doctor.
- Le cache d’échange de jetons GitHub Copilot utilise la table SQLite partagée d’état de Plugin
  sous `github-copilot/token-cache/default`. Il s’agit d’un état de cache appartenant au fournisseur,
  donc il n’ajoute intentionnellement pas de table de schéma hôte.
- La Compaction GitHub Copilot n’écrit plus les fichiers annexes d’espace de travail
  `openclaw-compaction-*.json`. Le harnais appelle le RPC de Compaction d’historique du SDK pour la
  session SDK suivie, et OpenClaw conserve l’état durable de session/transcription dans
  SQLite au lieu de fichiers marqueurs de compatibilité.
- Le runtime Swift partagé (`OpenClawKit`) utilise les mêmes lignes
  `state/openclaw.sqlite` pour l’identité de l’appareil et l’authentification de l’appareil. Les helpers de l’app macOS
  importent les helpers SQLite partagés au lieu de posséder un second chemin JSON ou
  SQLite. Un ancien `identity/device.json` restant bloque la création de l’identité
  jusqu’à ce que doctor l’importe dans SQLite, conformément à la barrière de démarrage
  TypeScript et Android.
- L’identité d’appareil Android utilise le même matériau de clé compatible TypeScript
  stocké dans des lignes typées `state/openclaw.sqlite#table/device_identities`. Elle ne
  lit ni n’écrit jamais `openclaw/identity/device.json`; un ancien fichier restant bloque
  le démarrage jusqu’à ce que doctor l’importe dans SQLite.
- Les jetons d’authentification d’appareil mis en cache sur Android utilisent aussi des lignes typées
  `state/openclaw.sqlite#table/device_auth_tokens` et partagent la même sémantique de jeton
  version-1 que TypeScript et Swift. Le runtime ne lit plus les clés de compatibilité `SecurePrefs`
  `gateway.deviceToken*`; celles-ci relèvent uniquement de la logique de migration/doctor.
- L’historique des paquets récents de notifications Android utilise des lignes typées
  `android_notification_recent_packages`. Le runtime ne migre ni ne lit plus les anciennes clés CSV SharedPreferences.
- La création d’identité d’appareil échoue fermée lorsque l’ancien `identity/device.json`
  existe, lorsque la ligne d’identité SQLite est invalide ou lorsque le magasin d’identités
  SQLite ne peut pas être ouvert. Doctor importe puis supprime d’abord ce fichier, afin que le démarrage
  du runtime ne puisse pas faire pivoter silencieusement l’identité d’appairage avant la migration.
- La sélection d’identité d’appareil est une clé de ligne SQLite, pas un localisateur de fichier JSON. Les tests
  et les helpers Gateway transmettent des clés d’identité explicites; seuls la migration doctor et la
  barrière de démarrage en échec fermé connaissent le nom de fichier retiré `identity/device.json`.
- La compatibilité de réinitialisation de session réside désormais dans la migration de configuration doctor :
  `session.idleMinutes` est déplacé vers `session.reset.idleMinutes`,
  `session.resetByType.dm` est déplacé vers `session.resetByType.direct`, et la
  politique de réinitialisation du runtime ne lit que les clés de réinitialisation canoniques.
- La compatibilité de configuration héritée réside désormais sous `src/commands/doctor/`. La validation normale
  `readConfigFileSnapshot()` n’importe pas les détecteurs hérités de doctor
  et n’annote pas les problèmes hérités; `runDoctorConfigPreflight()` ajoute ces problèmes pour
  la réparation/le rapport de doctor. Le flux de configuration doctor importe
  `src/commands/doctor/legacy-config.ts`, et l’ancienne réparation d’identifiant de profil OAuth réside
  sous
  `src/commands/doctor/legacy/oauth-profile-ids.ts`.
- Les commandes hors doctor n’exécutent pas automatiquement la réparation de configuration héritée. Par exemple,
  `openclaw update --channel` échoue désormais sur une configuration héritée invalide et demande à
  l’utilisateur d’exécuter doctor, au lieu d’importer silencieusement le code de migration de doctor.
- Web push, APNs, Voice Wake, les vérifications de mise à jour et la santé de configuration utilisent désormais des tables SQLite partagées typées
  pour les abonnements, les clés VAPID, les enregistrements de nœuds, les lignes de déclenchement,
  les lignes de routage, l’état de notification de mise à jour et les entrées de santé de configuration au lieu de
  blobs JSON opaques complets. Les écritures d’instantané Web push et APNs réconcilient désormais
  les abonnements/enregistrements par clé primaire au lieu de vider leurs tables;
  la santé de configuration fait de même par chemin de configuration.
  Leurs modules runtime gardent les lecteurs/rédacteurs d’instantanés SQLite séparés des
  helpers d’import JSON hérités réservés à doctor.
- La configuration d’hôte Node utilise désormais une ligne singleton typée dans la base de données SQLite partagée;
  doctor importe l’ancien fichier `node.json` avant l’utilisation normale du runtime.
- L’appairage appareil/nœud, l’appairage de canaux, les listes d’autorisation de canaux et l’état d’amorçage
  utilisent désormais des lignes SQLite typées au lieu de blobs JSON opaques complets. Les approbations de liaison de Plugin
  et l’état des tâches cron suivent la même séparation : les modules runtime exposent
  des opérations adossées à SQLite et des helpers d’instantané neutres, et l’appairage/l’amorçage
  ainsi que les écritures d’instantanés d’approbation de liaison de Plugin réconcilient les lignes par clé primaire
  au lieu de tronquer les tables, tandis que doctor importe/supprime les anciens fichiers JSON via les modules
  `src/commands/doctor/legacy/*`.
- Les enregistrements de plugins installés résident désormais dans l’index SQLite des Plugins installés.
  La lecture/écriture de configuration du runtime ne migre ni ne préserve plus les anciennes
  données de configuration auteur `plugins.installs`; doctor importe cette forme de configuration héritée
  dans SQLite avant l’utilisation normale du runtime.
- Les instantanés de récupération d’identifiants QQBot résident désormais dans l’état de Plugin SQLite sous
  `qqbot/credential-backups`. Le runtime n’écrit plus
  `qqbot/data/credential-backup*.json`; le contrat doctor QQBot importe et
  archive ces anciens fichiers de sauvegarde depuis le répertoire d’état actif.
- La planification de rechargement Gateway compare les instantanés d’index SQLite des Plugins installés sous
  un espace de noms de diff interne `installedPluginIndex.installRecords.*`. Les décisions de rechargement
  du runtime n’enveloppent plus ces lignes dans de faux objets de configuration `plugins.installs`.
- La mise à niveau des identifiants de comptes nommés Matrix ne se produit plus pendant les lectures
  du runtime. Doctor possède le renommage de l’ancien `credentials/matrix/credentials.json`
  de premier niveau lorsqu’un compte Matrix unique/par défaut peut être résolu.
- Les modules runtime d’appairage cœur et de Cron n’exportent plus de constructeurs de chemins JSON hérités.
  Les modules hérités appartenant à doctor construisent les chemins sources `pending.json`, `paired.json`,
  `bootstrap.json` et `cron/jobs.json` uniquement pour les tests d’import et
  la migration. La normalisation héritée de forme de tâche Cron et l’import du journal d’exécution Cron
  résident sous `src/commands/doctor/legacy/cron*.ts`.
- `src/commands/doctor/legacy/runtime-state.ts` importe les fichiers d’état JSON hérités,
  y compris la configuration d’hôte de nœud, dans SQLite depuis doctor. Les nouveaux importateurs de fichiers hérités
  restent sous `src/commands/doctor/legacy/`.
- `src/commands/doctor/state-migrations.ts` importe les anciens `sessions.json` et
  transcriptions `*.jsonl` directement dans SQLite et supprime les sources importées avec succès. Il
  ne met plus en attente les transcriptions héritées racine via
  `agents/<agentId>/sessions/*.jsonl` et ne crée plus de cible JSONL canonique avant
  l’import.
- Les vérifications doctor d’intégrité d’état ne parcourent plus les anciens répertoires de sessions et
  ne proposent plus la suppression de JSONL orphelins. Les anciens fichiers de transcription sont uniquement
  des entrées de migration, et l’étape de migration possède l’import ainsi que la suppression des sources.
- L’import de l’ancien registre de sandbox réside sous
  `src/commands/doctor/legacy/sandbox-registry.ts`; les lectures et écritures actives du registre de sandbox
  restent uniquement SQLite.
- La réparation de santé/import des anciennes transcriptions de session réside sous
  `src/commands/doctor/legacy/session-transcript-health.ts`; les modules de commandes runtime
  ne portent plus de parsing de transcription JSONL ni de code de réparation de branche active.

Points forts de la consolidation/suppression terminée :

- L’état des Plugins utilise désormais la base de données partagée `state/openclaw.sqlite`. L’ancien
  importateur annexe branch-local `plugin-state/state.sqlite` est supprimé, car
  ce schéma SQLite n’a jamais été livré. Les assistants de sonde/test signalent le
  `databasePath` partagé au lieu d’exposer un chemin SQLite propre à l’état des Plugins.
- Les tables d’exécution des tâches et de TaskFlow résident désormais dans la base de données partagée
  `state/openclaw.sqlite` au lieu de `tasks/runs.sqlite` et
  `tasks/flows/registry.sqlite` ; les anciens importateurs annexes sont supprimés pour la
  même raison de schéma jamais livré.
- `src/config/sessions/store.ts` n’a plus besoin de `storePath` pour les
  métadonnées entrantes, les mises à jour de routes ni les lectures updated-at.
  La persistance des commandes, le nettoyage des sessions CLI, la profondeur des
  sous-agents, les substitutions d’authentification et l’identité de session des
  transcriptions utilisent les API de lignes agent/session. Les écritures sont appliquées comme des correctifs de lignes SQLite
  avec nouvelle tentative en cas de conflit optimiste.
- La résolution des cibles de session expose désormais des cibles de base de données par agent, et non des chemins
  hérités `sessions.json`. Le Gateway partagé, les métadonnées ACP, la réparation des routes par doctor et
  `openclaw sessions` énumèrent `agent_databases` plus les agents configurés.
- Le routage des sessions Gateway utilise désormais `resolveGatewaySessionDatabaseTarget` ; la
  cible renvoyée transporte `databasePath` et les clés de lignes SQLite candidates au lieu
  d’un chemin de fichier hérité de magasin de sessions.
- Les types d’exécution des sessions de canal exposent désormais `{agentId, sessionKey}` pour les
  lectures updated-at, les métadonnées entrantes et les mises à jour de dernière route. L’ancien
  type de compatibilité `saveSessionStore(storePath, store)` a disparu.
- Les surfaces du runtime de Plugin, de l’API d’extension et du barrel `config/sessions` orientent désormais
  le code des Plugins vers des assistants de lignes de session adossés à SQLite. Les exports de compatibilité de la bibliothèque racine
  (`loadSessionStore`, `saveSessionStore`, `resolveStorePath`) restent des
  shims dépréciés pour les consommateurs existants. L’ancien assistant
  `resolveLegacySessionStorePath` a disparu ; la construction du chemin hérité `sessions.json`
  est désormais locale aux migrations et aux fixtures de test.
- `src/config/sessions/session-entries.sqlite.ts` stocke désormais les entrées de session canoniques
  dans la base de données par agent et prend en charge les correctifs de lecture/upsert/suppression au niveau ligne.
  L’upsert, le correctif et la suppression au runtime ne recherchent plus les variantes de casse ni
  n’élaguent les clés d’alias héritées ; doctor possède la canonicalisation. L’assistant d’import JSON
  autonome a disparu, et la migration fusionne par upsert les lignes plus récentes
  au lieu de remplacer toute la table des sessions. Les assistants publics de lecture/liste/chargement
  projettent les métadonnées de session chaudes depuis les lignes typées `sessions` et `conversations` ;
  `entry_json` est une ombre de compatibilité/débogage et peut être obsolète ou invalide
  sans perdre l’identité de session typée ni le contexte de livraison.
- `src/config/sessions/delivery-info.ts` résout désormais le contexte de livraison depuis les
  lignes typées par agent `sessions` + `conversations` + `session_conversations`.
  Il ne reconstruit plus l’identité de livraison runtime depuis
  `session_entries.entry_json` ; une ligne de conversation typée manquante est un problème de
  migration/réparation doctor, pas un repli runtime.
- Les décisions de réinitialisation de session stockée préfèrent désormais les métadonnées typées
  `sessions.session_scope`, `sessions.chat_type` et `sessions.channel`. L’analyse de `sessionKey`
  ne reste utilisée que pour les suffixes explicites de fil/sujet sur les cibles de commande ; la classification de réinitialisation
  groupe vs direct ne vient plus de la forme de la clé.
- La classification d’affichage de la liste/du statut des sessions utilise désormais les métadonnées de discussion typées et
  le type de session Gateway. Elle ne traite plus les sous-chaînes `:group:` ou `:channel:`
  dans `session_key` comme une vérité durable groupe/direct.
- La sélection de la politique de réponse silencieuse utilise désormais uniquement le type de conversation explicite ou les
  métadonnées de surface. Elle ne devine plus la politique direct/groupe depuis les
  sous-chaînes de `session_key`.
- La résolution du modèle d’affichage de session reçoit désormais l’identifiant d’agent depuis la cible de base de données SQLite
  de session au lieu de l’extraire de `session_key`.
- L’hydratation des cibles d’annonce agent-à-agent utilise désormais uniquement le `deliveryContext` typé de
  `sessions.list`. Elle ne récupère plus le routage canal/compte/fil depuis
  l’ancien `origin`, les champs `last*` miroirs ou la forme de `session_key`.
- Le rejet des cibles de fil par `sessions_send` lit désormais les métadonnées de routage SQLite typées.
  Il ne rejette ni n’accepte plus les cibles en analysant les suffixes de fil
  dans la clé cible.
- La validation de la politique d’outil à portée groupe lit désormais le routage de conversation SQLite typé
  pour la session courante ou générée. Elle ne fait plus confiance à l’identité de groupe/canal
  en décodant `sessionKey` ; les identifiants de groupe fournis par l’appelant sont supprimés lorsqu’aucune
  ligne de session typée ne les atteste.
- La correspondance des substitutions de modèle de canal utilise désormais les métadonnées explicites de groupe et de conversation
  parente. Elle ne décode plus les identifiants de conversation parente depuis
  `parentSessionKey`.
- L’héritage des substitutions de modèle stockées nécessite désormais une clé de session parente explicite
  issue du contexte de session typé. Il ne déduit plus les substitutions parentes depuis les
  suffixes `:thread:` ou `:topic:` dans `sessionKey`.
- L’ancien wrapper d’informations de fil de session et l’analyseur de fil de Plugin chargé ont disparu ;
  aucun code runtime n’importe `config/sessions/thread-info`.
- L’assistant de conversation de canal n’expose plus de ponts d’analyse de clé de session complète.
  Le cœur normalise toujours les identifiants de conversation bruts détenus par les fournisseurs via
  `resolveSessionConversation(...)`, mais il ne reconstruit pas les faits de route
  depuis `sessionKey`.
- La livraison des complétions, la politique d’envoi et la maintenance des tâches ne déduisent plus le type de discussion
  depuis la forme de `session_key`. L’ancien analyseur de type de discussion depuis la clé a été supprimé ;
  ces chemins nécessitent des métadonnées de session typées, un contexte de livraison typé ou
  un vocabulaire explicite de cible de livraison.
- La liste/le statut des sessions, les diagnostics, la liaison des comptes d’approbation, le filtrage Heartbeat
  du TUI et les résumés d’utilisation ne minent plus `SessionEntry.origin` pour le
  routage fournisseur/compte/fil/affichage. Les seules lectures runtime restantes de
  `origin` sont des concepts hors session ou des objets de livraison du tour courant.
- La recherche de conversation native pour les demandes d’approbation lit désormais les lignes de routage de session typées
  par agent. Elle n’analyse plus l’identité de conversation canal/groupe/fil
  depuis `sessionKey` ; les métadonnées typées manquantes relèvent d’un problème de migration/réparation.
- Les charges utiles des événements Gateway session changed/chat/session ne recopient plus
  `SessionEntry.origin` ni les ombres de route `last*` ; les clients reçoivent
  `channel`, `chatType` et `deliveryContext` typés.
- La résolution de livraison Heartbeat peut désormais recevoir directement le
  `deliveryContext` SQLite typé, et le runtime Heartbeat transmet la ligne de livraison de session
  par agent au lieu de s’appuyer sur les ombres de compatibilité `session_entries`
  pour le routage courant.
- La résolution de cible de livraison d’agent isolé Cron hydrate aussi sa route courante
  depuis la ligne de livraison de session typée par agent avant de se rabattre sur la
  charge utile d’entrée de compatibilité.
- La résolution d’origine des annonces de sous-agent propage désormais le contexte de livraison typé de session
  demandeuse via `loadRequesterSessionEntry` et préfère cette ligne aux
  ombres de compatibilité `last*`/`deliveryContext`.
- Les mises à jour de métadonnées de session entrantes fusionnent désormais d’abord avec la ligne de livraison typée
  par agent ; les anciens champs de livraison `SessionEntry` ne servent de repli
  que lorsqu’aucune ligne de conversation typée n’existe.
- L’extraction de livraison au redémarrage/mise à jour laisse désormais le `threadId` de livraison SQLite typé
  l’emporter sur les fragments de sujet/fil analysés depuis `sessionKey` ; l’analyse
  n’est qu’un repli pour les clés héritées en forme de fil.
- Les identifiants de canal du contexte d’agent de hook préfèrent désormais l’identité de conversation SQLite typée,
  puis les métadonnées explicites du message. Ils n’analysent plus les fragments fournisseur/groupe/canal
  depuis `sessionKey`.
- L’héritage de route externe Gateway `chat.send` lit désormais les métadonnées de routage de session SQLite typées
  au lieu d’inférer la portée canal/direct/groupe à partir des morceaux de
  `sessionKey`. Les sessions à portée canal n’héritent que lorsque le canal de session typé
  et le type de discussion correspondent au contexte de livraison stocké ; les sessions partagées main
  conservent leur règle plus stricte CLI/sans métadonnées client.
- Le réveil restart-sentinel et le routage de continuation lisent désormais les lignes de livraison/routage SQLite typées
  avant de mettre en file des réveils Heartbeat ou des continuations de tour d’agent routées.
  Ils ne reconstruisent plus le contexte de livraison depuis l’ombre JSON d’entrée de session.
- La résolution de contexte Gateway `tools.effective` lit désormais les lignes de livraison/routage SQLite typées
  pour les entrées fournisseur, compte, cible, fil et mode de réponse. Elle ne récupère plus
  ces champs de routage chauds depuis les ombres d’origine obsolètes
  `session_entries.entry_json`.
- Le routage des consultations vocales realtime résout désormais la livraison parent/appel depuis les lignes de session SQLite typées
  par agent. Il ne se rabat plus sur les ombres de compatibilité
  `SessionEntry.deliveryContext` lors du choix de la route de message de l’agent intégré.
- Le relais Heartbeat de génération ACP et le routage de flux parent lisent désormais la livraison parente
  depuis les lignes de session SQLite typées. Ils ne reconstruisent plus le contexte de livraison
  parent depuis les ombres d’entrée de session de compatibilité.
- La préservation de route de livraison de session suit désormais les métadonnées de discussion typées et
  les colonnes de livraison persistées. Elle n’extrait plus d’indices de canal, de marqueurs direct/main
  ni de forme de fil depuis `sessionKey` ; les routes webchat internes n’héritent d’une cible externe
  que lorsque SQLite possède déjà une identité de livraison typée/persistée pour la session.
- L’extraction générique de livraison de session lit désormais uniquement la ligne de livraison de session SQLite typée
  exacte. Elle n’analyse plus les suffixes de fil/sujet et ne se rabat plus
  d’une clé en forme de fil vers une clé de session de base.
- La distribution des réponses, la récupération restart sentinel et le routage des consultations vocales realtime
  utilisent désormais les lignes SQLite typées exactes de session/conversation pour le routage de fil.
  Ils ne récupèrent plus les identifiants de fil ni le contexte de livraison de session de base en analysant
  les clés de session en forme de fil.
- La limitation de l’historique PI intégré utilise désormais la projection de routage de session SQLite typée
  (`sessions` + `conversations` principales) pour le fournisseur, le type de discussion
  et l’identité du pair. Elle n’analyse plus le fournisseur, le DM, le groupe ni la forme de fil
  depuis `sessionKey`.
- L’inférence de livraison des outils Cron utilise désormais uniquement la livraison explicite ou le contexte de livraison typé
  courant. Elle ne décode plus les cibles de canal, pair, compte ou fil
  depuis `agentSessionKey`.
- Les lignes de session runtime ne transportent plus l’ancien alias de route `lastProvider`.
  Les assistants et tests utilisent les champs typés `lastChannel` et `deliveryContext` ;
  la migration doctor est le seul endroit qui devrait traduire les anciens alias de route
  ou les ombres `origin` persistées.
- Les événements de transcription, les lignes VFS et les lignes d’artefacts d’outils écrivent désormais dans la base de données
  par agent. La table globale jamais livrée de correspondance des fichiers de transcription a disparu ; doctor
  enregistre les chemins sources hérités dans des lignes de migration durables à la place.
- La recherche de transcription au runtime ne parcourt plus les offsets d’octets JSONL et ne sonde plus les fichiers de transcription
  hérités. Les chemins Gateway chat/média/historique lisent les lignes de transcription depuis
  SQLite ; la session JSONL n’est désormais qu’une entrée doctor héritée, pas un état runtime
  ni un format d’export.
- Les relations parent et branche des transcriptions utilisent des métadonnées structurées
  `parentTranscriptScope: {agentId, sessionId}` dans les en-têtes de transcription SQLite,
  et non des chaînes de localisateur de type chemin `agent-db:...transcript_events...`.
- Le contrat du gestionnaire de transcriptions n’expose plus de constructeurs persistés implicites
  `create(cwd)` ou `continueRecent(cwd)`. Les gestionnaires de transcriptions persistées
  sont ouverts avec une portée explicite `{agentId, sessionId}` ; seuls les
  gestionnaires en mémoire restent sans portée pour les tests et les transformations de transcription pures.
- Les API du magasin de transcriptions runtime résolvent une portée SQLite, pas des chemins de système de fichiers. L’ancien
  assistant `resolve...ForPath` et les options d’écriture `transcriptPath` inutilisées ont
  disparu des appelants runtime.
- La résolution de session runtime utilise désormais `{agentId, sessionId}` et ne doit pas dériver
  de chaînes `sqlite-transcript://<agent>/<session>` pour les frontières externes.
  Les chemins JSONL absolus hérités sont uniquement des entrées de migration doctor.
- Les enregistrements direct-bridge du relais de hook natif résident désormais dans des lignes typées partagées
  `native_hook_relay_bridges` indexées par identifiant de relais. Le runtime n’écrit plus de
  registre JSON `/tmp` ni d’enregistrements génériques opaques pour ces enregistrements de pont éphémères.
- `runEmbeddedPiAgent(...)` n’a plus de paramètre de localisateur de transcription.
  Les descripteurs de workers préparés omettent aussi les localisateurs de transcript. L’état
  de session d’exécution et les exécutions de suivi en file d’attente portent `{agentId, sessionId}` au lieu
  d’identifiants de transcript dérivés.
- La Compaction intégrée prend désormais la portée SQLite depuis `agentId` et `sessionId`.
  Les hooks de Compaction, les appels au moteur de contexte, la délégation CLI et les réponses de protocole
  ne doivent pas recevoir de handles dérivés `sqlite-transcript://...`. Le code
  d’export/débogage peut matérialiser des artefacts utilisateur explicites à partir des lignes, mais il ne fournit pas de
  chemin d’export JSONL générique de session ni ne réinjecte des noms de fichiers dans l’identité
  d’exécution.
- `/export-session` lit les lignes de transcript depuis SQLite et écrit uniquement la vue HTML
  autonome demandée. Le visualiseur intégré ne reconstruit ni ne télécharge plus le JSONL
  de session à partir de ces lignes.
- La délégation au moteur de contexte n’analyse plus un localisateur de transcript pour retrouver
  l’identité de l’agent. Le contexte d’exécution préparé porte l’`agentId` résolu
  vers l’adaptateur de Compaction intégré.
- La réécriture de transcript et la troncature active des résultats d’outils lisent et persistent désormais
  l’état de transcript par `{agentId, sessionId}` et ne dérivent pas de localisateurs
  temporaires pour les charges utiles d’événements de mise à jour de transcript.
- La surface d’aide d’état de transcript n’a plus de variantes fondées sur un localisateur
  `readTranscriptState`, `replaceTranscriptStateEvents` ou
  `persistTranscriptStateMutation`. Les appelants d’exécution doivent utiliser les API
  `{agentId, sessionId}`. L’import Doctor lit les fichiers hérités par chemin de fichier explicite
  et écrit les lignes SQLite ; il ne migre pas les chaînes de localisateur.
- Le contrat du gestionnaire de sessions d’exécution n’expose plus `open(locator)`,
  `forkFrom(locator)` ni `setTranscriptLocator(...)`. Les gestionnaires de sessions
  persistés s’ouvrent uniquement par `{agentId, sessionId}` ; les aides de liste/fork vivent sur
  les API de sessions et de checkpoints orientées lignes au lieu de la façade du gestionnaire
  de transcript.
- Les API du lecteur de transcript Gateway sont axées d’abord sur la portée. Elles prennent
  `{agentId, sessionId}` et n’acceptent pas de localisateur de transcript positionnel qui
  pourrait devenir accidentellement l’identité d’exécution. L’analyse des localisateurs de transcript actifs
  a disparu ; les chemins sources hérités sont lus uniquement par le code d’import Doctor.
- Les événements de mise à jour de transcript sont aussi axés d’abord sur la portée. `emitSessionTranscriptUpdate`
  n’accepte plus de chaîne de localisateur nue, et les écouteurs routent par
  `{agentId, sessionId}` sans analyser de handle.
- La diffusion Gateway des messages de session résout les clés de session depuis la portée agent/session,
  et non depuis un localisateur de transcript. L’ancien résolveur/cache de clé de session
  à partir d’un localisateur de transcript a disparu.
- Les filtres SSE d’historique de session Gateway filtrent les mises à jour actives par portée agent/session. Ils ne
  canonisent plus les candidats de localisateurs de transcript, les chemins réels ni les identités de transcript
  en forme de fichier pour décider si un flux doit recevoir une mise à jour.
- Les hooks de cycle de vie de session ne dérivent ni n’exposent plus de localisateurs de transcript sur
  `session_end`. Les consommateurs de hooks reçoivent `sessionId`, `sessionKey`, les identifiants
  de session suivante et le contexte d’agent ; les fichiers de transcript ne font pas partie du contrat
  de cycle de vie.
- Les hooks de réinitialisation ne dérivent ni n’exposent plus de localisateurs de transcript non plus. La charge utile
  `before_reset` porte les messages SQLite récupérés plus la raison de la réinitialisation,
  tandis que l’identité de session reste dans le contexte du hook.
- La réinitialisation du harnais d’agent n’accepte plus de localisateur de transcript. La répartition de réinitialisation est
  portée par `sessionId`/`sessionKey` plus la raison.
- Les types de session d’extension d’agent n’exposent plus `transcriptLocator` ; les extensions
  doivent utiliser le contexte de session et les API d’exécution plutôt que de chercher une
  identité de transcript en forme de fichier.
- Les hooks de Compaction de Plugin n’exposent plus de localisateurs de transcript. Le contexte de hook
  porte déjà l’identité de session, et les lectures de transcript doivent passer par les API SQLite
  conscientes de la portée au lieu de handles en forme de fichier.
- Les hooks `before_agent_finalize` n’exposent plus `transcriptPath`, y compris
  dans les charges utiles de relais de hook natif. Les hooks de finalisation utilisent uniquement le contexte de session.
- Les réponses de réinitialisation Gateway ne synthétisent plus de localisateur de transcript sur l’entrée
  renvoyée. La réinitialisation crée des lignes de transcript SQLite, renvoie l’entrée de session propre
  et laisse l’accès au transcript aux lecteurs conscients de la portée.
- Les résultats d’exécution intégrée et de Compaction ne surfacent plus de localisateurs de transcript pour
  la comptabilisation des sessions. La Compaction automatique met seulement à jour le `sessionId` actif,
  les compteurs de Compaction et les métadonnées de tokens.
- Les résultats de tentative intégrée ne renvoient plus `transcriptLocatorUsed`, et les résultats
  `compact()` du moteur de contexte ne renvoient plus de localisateurs de transcript.
  Les boucles de nouvelle tentative d’exécution acceptent uniquement un `sessionId` successeur.
- Les résultats d’ajout de transcript du miroir de livraison ne renvoient plus de localisateurs de transcript.
  Les appelants reçoivent le `messageId` ajouté ; les signaux de mise à jour de transcript utilisent
  la portée SQLite.
- Les aides de fork de session parente renvoient uniquement le `sessionId` forké. La préparation du sous-agent
  transmet la portée agent/session enfant aux moteurs.
- Les paramètres du lanceur CLI et le réensemencement d’historique n’acceptent plus de localisateurs de transcript.
  Les lectures d’historique CLI résolvent la portée de transcript SQLite depuis `{agentId,
sessionId}` et le contexte de clé de session.
- Les fixtures de test CLI et d’exécution intégrée ensemencent et lisent désormais les lignes de transcript SQLite
  par identifiant de session au lieu de prétendre que les sessions actives sont des fichiers `*.jsonl` ou
  de transmettre une chaîne `sqlite-transcript://...` via les paramètres d’exécution.
- Les événements de garde de résultats d’outil de session sont émis depuis une portée de session connue même lorsqu’un
  gestionnaire en mémoire n’a pas de localisateur dérivé. Ses tests ne simulent plus de fichiers de transcript
  actifs `/tmp/*.jsonl`.
- Les aides BTW et de checkpoint de Compaction lisent et forkent désormais les lignes de transcript par
  portée SQLite. Les métadonnées de checkpoint stockent désormais uniquement les identifiants de session et les identifiants
  de feuille/entrée ; les localisateurs dérivés ne sont plus écrits dans les charges utiles de checkpoint.
- La recherche de clé de transcript Gateway utilise la portée de transcript SQLite aux frontières de protocole
  et ne résout plus les chemins réels ni ne consulte les stats de noms de fichiers de transcript.
- La rotation automatique de transcript par Compaction écrit les lignes de transcript successeures
  directement via le magasin de transcripts SQLite. Les lignes de session conservent uniquement
  l’identité de session successeure, pas un chemin JSONL durable ni un localisateur persisté.
- La Compaction intégrée du moteur de contexte utilise des aides de rotation de transcript nommées par SQLite.
  Les tests de rotation ne construisent plus de chemins successeurs JSONL ni ne modélisent les sessions actives comme
  des fichiers.
- La rétention des images sortantes gérées indexe son cache de messages de transcript à partir
  des stats de transcript SQLite au lieu d’appels aux stats du système de fichiers.
- Les verrous de session d’exécution et la voie Doctor héritée autonome `.jsonl.lock`
  ont été supprimés.
- Le barrel d’exécution Microsoft Teams et le SDK public de Plugin ne réexportent plus
  l’ancien assistant de verrouillage de fichier ; les chemins d’état durable de Plugin sont adossés à SQLite.
- L’élagage des sessions par âge/nombre et le nettoyage explicite des sessions ont été supprimés.
  Doctor possède l’import hérité ; les sessions obsolètes sont réinitialisées ou supprimées explicitement.
- Les contrôles d’intégrité Doctor ne comptent plus un fichier JSONL hérité comme transcript actif valide
  pour une ligne de session SQLite. La santé des transcripts actifs est uniquement SQLite ;
  les fichiers JSONL hérités sont signalés comme entrées de migration/nettoyage d’orphelins.
- Doctor ne traite plus `agents/<agent>/sessions/` comme un état d’exécution
  requis. Il analyse seulement ce répertoire lorsqu’il existe déjà, comme entrée d’import hérité
  ou de nettoyage d’orphelins.
- Gateway `sessions.resolve`, les chemins de patch/réinitialisation/compaction de session, la création de sous-agents,
  l’abandon rapide, les métadonnées ACP, les sessions isolées par Heartbeat et les correctifs TUI
  ne migrent ni n’élaguent plus les clés de session héritées comme effet secondaire du travail
  d’exécution normal.
- La résolution de session des commandes CLI renvoie désormais l’`agentId` propriétaire au lieu d’un
  `storePath`, et elle ne copie plus les lignes de session principale héritées pendant la résolution normale
  `--to` ou `--session-id`. La canonisation des lignes principales héritées relève
  uniquement de Doctor.
- La résolution de profondeur des sous-agents d’exécution ne lit plus `sessions.json` ni les magasins de sessions JSON5.
  Elle lit les `session_entries` SQLite par identifiant d’agent, et les métadonnées héritées
  de profondeur/session ne peuvent entrer que par le chemin d’import Doctor.
- Les remplacements de session de profil d’authentification persistent via des upserts directs de lignes `{agentId, sessionKey}`
  au lieu de charger paresseusement une exécution de magasin de sessions en forme de fichier.
- Le filtrage verbeux des réponses automatiques et les aides de mise à jour de session lisent/upsertent désormais les lignes de session SQLite
  par identité de session et n’exigent plus de chemin de magasin hérité
  avant de toucher l’état de ligne persisté.
- Les aides de métadonnées de session d’exécution de commande utilisent désormais des noms et chemins de module orientés entrée ;
  l’ancienne surface d’aide de commande `session-store` a été supprimée.
- L’ensemencement d’en-tête bootstrap et le durcissement manuel des frontières de Compaction modifient désormais
  directement les lignes de transcript SQLite. Les appelants d’exécution transmettent l’identité de session, pas
  des chemins `.jsonl` inscriptibles.
- La relecture silencieuse de rotation de session copie les tours récents utilisateur/assistant par
  `{agentId, sessionId}` depuis les lignes de transcript SQLite. Elle n’accepte plus
  de localisateurs de transcript source ou cible.
- Les nouvelles lignes de session d’exécution ne stockent plus de localisateurs de transcript. Les appelants utilisent
  directement `{agentId, sessionId}` ; les commandes d’export/débogage peuvent choisir les noms de fichiers de sortie
  lorsqu’elles matérialisent les lignes.
- Le démarrage d’une nouvelle session de transcript persistée ouvre désormais toujours les lignes SQLite par
  portée. Le gestionnaire de session ne réutilise plus un ancien chemin ou localisateur de transcript
  de l’ère fichier comme identité de la nouvelle session.
- Les sessions de transcript persistées utilisent l’API explicite
  `openTranscriptSessionManagerForSession({agentId, sessionId})`. Les anciennes façades statiques
  `SessionManager.create/openForSession/list/forkFromSession` ont disparu afin que les tests et le code
  d’exécution ne puissent pas recréer accidentellement la découverte de session de l’ère fichier.
- L’exécution de Plugin n’expose plus `api.runtime.agent.session.resolveTranscriptLocatorPath` ;
  le code de Plugin utilise les aides de lignes SQLite et les valeurs de portée.
- La surface SDK publique `session-store-runtime` n’exporte désormais que les aides de lignes de session
  et de lignes de transcript. Les aides ciblées de schéma/chemin/transaction SQLite
  vivent dans `sqlite-runtime` ; les aides brutes d’ouverture/fermeture/réinitialisation restent locales uniquement pour
  les tests first-party.
- Les classificateurs de noms de fichiers de trajectoire/checkpoint `.jsonl` hérités vivent désormais dans le
  module Doctor de fichiers de session hérités. La validation de session du cœur n’importe plus
  d’aides d’artefacts de fichier pour décider des identifiants de session SQLite normaux.
- Les exécutions de sous-agents bloquantes Active Memory utilisent les lignes de transcript SQLite au lieu
  de créer des fichiers temporaires ou persistés `session.jsonl` sous l’état de Plugin. L’ancienne
  option `transcriptDir` est supprimée.
- La génération ponctuelle de slug et les exécutions du planificateur Crestodian utilisent des lignes de transcript SQLite
  au lieu de créer des fichiers temporaires `session.jsonl`.
- Les exécutions d’aide `llm-task` et l’extraction d’engagements cachés utilisent aussi les lignes de transcript SQLite,
  de sorte que ces sessions d’aide réservées au modèle ne créent plus de fichiers de transcript
  temporaires JSON/JSONL.
- `TranscriptSessionManager` n’est plus qu’une portée de transcript SQLite ouverte.
  Le code d’exécution l’ouvre avec `openTranscriptSessionManagerForSession({agentId,
sessionId})` ; les flux de création, branche, continuation, liste et fork vivent dans leurs
  propres aides de lignes SQLite plutôt que dans des façades statiques de gestionnaire.
  Le code Doctor/import/débogage gère les fichiers sources hérités explicites en dehors du
  gestionnaire de sessions d’exécution.
- Les méthodes de façade obsolètes `SessionManager.newSession()` et
  `SessionManager.createBranchedSession()` ont été supprimées. Les nouvelles
  sessions et les descendants de transcript sont créés par leur workflow SQLite propriétaire
  au lieu de muter un gestionnaire déjà ouvert en une autre session persistée.
- Les décisions de fork de transcript parent et la création de fork n’acceptent plus
  `storePath` ni `sessionsDir` ; elles utilisent la portée de transcript SQLite
  `{agentId, sessionId}` au lieu de métadonnées de chemins de système de fichiers conservées.
- Memory-host n’exporte plus d’aides no-op de classification de transcript par répertoire de session ;
  le filtrage de transcript dérive désormais des métadonnées de lignes SQLite pendant la construction des entrées.
- Les tests Memory-host et QMD d’export de session utilisent les portées de transcript SQLite. Les anciens
  chemins `agents/<agentId>/sessions/*.jsonl` restent couverts uniquement lorsqu’un test
  prouve intentionnellement la compatibilité Doctor/import/export.
- L’inspection brute des sessions QA-lab utilise désormais `sessions.list` via le Gateway
  au lieu de lire `agents/qa/sessions/sessions.json`; le feedback MSteams
  s’ajoute directement aux transcriptions SQLite sans fabriquer de chemin JSONL.
- Les tours de canal entrant partagé transportent désormais `{agentId, sessionKey}` plutôt qu’un
  ancien `storePath`. LINE, WhatsApp, Slack, Discord, Telegram, Matrix, Signal,
  iMessage, BlueBubbles, Feishu, Google Chat, IRC, Nextcloud Talk, Zalo,
  Zalo Personal, QA Channel, Microsoft Teams, Mattermost, Synology Chat, Tlon,
  Twitch et QQBot lisent désormais les métadonnées updated-at et enregistrent
  les lignes de session entrantes via l’identité SQLite.
- La persistance du localisateur de transcription est supprimée des lignes de session actives.
  `resolveSessionTranscriptTarget` renvoie `agentId`, `sessionId` et les métadonnées
  de sujet facultatives; doctor est le seul code qui importe les anciens noms de fichiers
  de transcription.
- Les en-têtes de transcription runtime commencent à la version SQLite `1`. Les mises à niveau
  des anciennes formes JSONL V1/V2/V3 vivent uniquement dans l’import doctor et normalisent
  les en-têtes importés vers la version actuelle de transcription SQLite avant le stockage des lignes.
- Le garde database-first interdit désormais `SessionManager.listAll` et
  `SessionManager.forkFromSession`; les workflows de listage de sessions et de fork/restauration
  doivent rester sur les API SQLite par ligne/scopées.
- Le garde interdit aussi les anciens noms d’assistants de réparation de parsing JSONL de transcription/branche active
  en dehors du code doctor/import, afin que le runtime ne puisse pas développer un second chemin
  de migration de transcriptions héritées.
- Les exécutions PI intégrées rejettent les handles de transcription entrants. Elles utilisent l’identité SQLite
  `{agentId, sessionId}` avant le lancement du worker puis de nouveau avant que la
  tentative ne touche l’état de transcription. Une entrée obsolète `/tmp/*.jsonl` ne peut pas sélectionner une
  cible d’écriture runtime.
- Les enregistrements de trace de cache, de payload Anthropic, de flux brut et de chronologie de diagnostics
  s’écrivent désormais dans des lignes SQLite typées `diagnostic_events`. Les bundles de stabilité Gateway
  s’écrivent désormais dans des lignes SQLite typées `diagnostic_stability_bundles`. Les anciens chemins
  de remplacement JSONL `diagnostics.cacheTrace.filePath`, `OPENCLAW_CACHE_TRACE_FILE`,
  `OPENCLAW_ANTHROPIC_PAYLOAD_LOG_FILE` et
  `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH` sont supprimés, et la capture de stabilité
  normale n’écrit plus de fichiers `logs/stability/*.json`.
- La persistance Cron réconcilie désormais les lignes SQLite `cron_jobs` au lieu de
  supprimer/réinsérer toute la table des tâches à chaque sauvegarde. Les réécritures de cible Plugin
  mettent directement à jour les lignes cron correspondantes et conservent l’état cron runtime dans
  la même transaction de base de données d’état.
- Les appelants runtime Cron utilisent désormais une clé de magasin cron SQLite stable. Les anciens
  chemins `cron.store` sont uniquement des entrées d’import doctor; les chemins production Gateway,
  maintenance des tâches, statut, run-log et réécriture de cible Telegram utilisent
  `resolveCronStoreKey` et ne normalisent plus la clé comme un chemin. Le statut Cron signale désormais
  `storeKey` plutôt que l’ancien champ `storePath` en forme de fichier.
- Le chargement et la planification runtime Cron ne normalisent plus les anciennes formes de tâches persistées
  comme `jobId`, `schedule.cron`, `atMs` numérique, booléens chaîne ou
  `sessionTarget` manquant. L’import legacy de doctor possède ces réparations avant l’insertion
  des lignes dans SQLite.
- Le spawn ACP ne résout ni ne persiste plus les chemins de fichiers JSONL de transcription. La configuration du spawn
  et de la liaison de thread persiste directement la ligne de session SQLite et conserve l’id de session
  comme identité de transcription retenue.
- Les API de métadonnées de session ACP lisent/listent/upsert désormais les lignes SQLite par `agentId` et
  n’exposent plus `storePath` dans le contrat d’entrée de session ACP.
- La comptabilisation d’utilisation de session et l’agrégation d’utilisation Gateway résolvent désormais les transcriptions
  uniquement par `{agentId, sessionId}`. Le cache coût/utilisation et les résumés de sessions découvertes
  ne synthétisent ni ne renvoient plus de chaînes de localisateur de transcription.
- L’ajout de chat Gateway, la persistance abort-partial, `/sessions.send` et
  les écritures de transcription de médias webchat ajoutent directement via le scope de transcription SQLite.
  L’assistant d’injection de transcription Gateway n’accepte plus de paramètre
  `transcriptLocator`.
- La découverte de transcriptions SQLite liste désormais uniquement les scopes et statistiques de transcription:
  `{agentId, sessionId, updatedAt, eventCount}`. L’assistant de compatibilité mort
  `listSqliteSessionTranscriptLocators` et le champ par ligne
  `locator` ont disparu.
- Le runtime de réparation de transcription n’expose désormais que
  `repairTranscriptSessionStateIfNeeded({agentId, sessionId})`. L’ancien
  assistant de réparation fondé sur un localisateur est supprimé; le code doctor/debug lit des
  chemins explicites de fichiers source et ne migre jamais de chaînes de localisateur.
- Le runtime du registre de replay ACP stocke désormais les lignes de replay par session dans la base de données
  d’état SQLite partagée au lieu de `acp/event-ledger.json`; doctor importe et
  supprime l’ancien fichier.
- Les assistants de lecture de transcription Gateway vivent désormais dans
  `src/gateway/session-transcript-readers.ts` au lieu de l’ancien
  nom de module `session-utils.fs`. La vérification d’historique de retry fallback est nommée d’après
  le contenu de transcription SQLite plutôt que l’ancienne surface d’assistant de fichier.
- Les assistants Gateway de chat injecté et de compaction transmettent désormais le scope de transcription SQLite
  via des API d’assistance internes au lieu de nommer les valeurs comme des chemins de transcription ou
  des fichiers source.
- La détection de continuation bootstrap vérifie désormais les lignes de transcription SQLite via
  `hasCompletedBootstrapTranscriptTurn`; elle n’expose plus de nom d’assistant en forme de fichier.
- Les tests embedded-runner utilisent désormais l’identité de transcription SQLite, et l’ouverture d’un nouveau
  gestionnaire de transcription exige toujours un `sessionId` explicite.
- Les assistants d’indexation mémoire utilisent désormais la terminologie de transcription SQLite de bout en bout:
  l’hôte exporte `listSessionTranscriptScopesForAgent` et
  `sessionTranscriptKeyForScope`, les files de synchronisation ciblées `sessionTranscripts`,
  les résultats publics de recherche de session exposent des chemins opaques `transcript:<agent>:<session>`,
  et la clé source interne DB est `session:<session>` sous
  `source_kind='sessions'` au lieu d’un faux chemin de fichier.
- L’assistant générique de déduplication persistante du SDK plugin n’expose plus d’options en forme de fichier.
  Les appelants fournissent des clés de scope SQLite et les lignes de déduplication durables vivent dans
  l’état de plugin partagé.
- Les jetons SSO Microsoft Teams sont passés de fichiers JSON verrouillés à l’état de plugin SQLite.
  Doctor importe `msteams-sso-tokens.json`, reconstruit les clés canoniques de jeton SSO
  à partir des payloads et supprime le fichier source. Les jetons OAuth délégués restent
  sur leur frontière existante de fichier d’identifiants privés.
- L’état du cache de synchronisation Matrix est passé de `bot-storage.json` à l’état de plugin SQLite.
  Doctor importe les anciens payloads de synchronisation bruts ou enveloppés et supprime le
  fichier source. Les clients Matrix actifs et QA Matrix transmettent un répertoire racine de magasin
  de synchronisation SQLite, pas un faux chemin `sync-store.json` ou `bot-storage.json`.
- L’état de migration crypto legacy Matrix est passé de
  `legacy-crypto-migration.json` à l’état de plugin SQLite. Doctor importe
  l’ancien fichier d’état; les instantanés IndexedDB du SDK Matrix sont passés de
  `crypto-idb-snapshot.json` aux blobs de plugin SQLite. Les clés de récupération et
  identifiants Matrix sont des lignes d’état de plugin SQLite; leurs anciens fichiers JSON sont uniquement
  des entrées de migration doctor.
- Les journaux d’activité Memory Wiki utilisent désormais l’état de plugin SQLite au lieu de
  `.openclaw-wiki/log.jsonl`. Le fournisseur de migration Memory Wiki importe les anciens
  journaux JSONL; le markdown wiki et le contenu de coffre utilisateur restent adossés aux fichiers comme
  contenu d’espace de travail.
- Memory Wiki ne crée plus `.openclaw-wiki/state.json` ni le répertoire inutilisé
  `.openclaw-wiki/locks`. Le fournisseur de migration supprime ces fichiers de métadonnées
  de plugin retirés si un ancien coffre les possède encore.
- Les entrées d’audit Crestodian utilisent désormais l’état de plugin SQLite core au lieu de
  `audit/crestodian.jsonl`. Doctor importe l’ancien journal d’audit JSONL et
  le supprime après un import réussi.
- Les entrées d’audit d’écriture/observation de config utilisent désormais l’état de plugin SQLite core
  au lieu de `logs/config-audit.jsonl`. Doctor importe l’ancien journal d’audit JSONL et
  le supprime après un import réussi.
- Le compagnon macOS n’écrit plus de sidecars locaux à l’app `logs/config-audit.jsonl` ni
  `logs/config-health.json` lors de l’édition de `openclaw.json`. Le fichier de config
  reste adossé à un fichier, les instantanés de récupération restent à côté du fichier de config,
  et l’état durable d’audit/santé de config appartient au magasin SQLite Gateway.
- Les approbations en attente de rescue Crestodian utilisent désormais l’état de plugin SQLite core au lieu de
  `crestodian/rescue-pending/*.json`. Doctor importe les anciens fichiers d’approbation en attente
  et les supprime après un import réussi.
- L’état temporaire d’armement Phone Control utilise désormais l’état de plugin SQLite au lieu de
  `plugins/phone-control/armed.json`. Doctor importe l’ancien fichier d’état d’armement
  dans l’espace de noms `phone-control/arm-state` et supprime le fichier.
- Doctor ne répare plus les transcriptions JSONL en place et ne crée plus de fichiers JSONL
  de sauvegarde. Il importe la branche active dans SQLite et supprime la source legacy.
- La recherche de transcription du hook session-memory utilise des lectures SQLite limitées au scope
  `{agentId, sessionId}`. Son assistant n’accepte ni ne dérive plus de localisateurs de transcription,
  de lectures de fichiers legacy ni d’options de réécriture de fichier.
- Les liaisons de conversation du serveur d’app Codex indexent désormais l’état de plugin SQLite par
  clé de session OpenClaw ou scope explicite `{agentId, sessionId}`. Elles ne doivent pas
  préserver les liaisons fallback de chemin de transcription.
- Les lectures d’historique miroir du serveur d’app Codex utilisent uniquement le scope de transcription SQLite;
  elles ne doivent pas récupérer l’identité depuis des chemins de fichiers de transcription.
- Les chemins de réinitialisation d’ordre des rôles et de compaction ne dissocient plus les anciens fichiers de transcription;
  la réinitialisation ne fait que faire tourner la ligne de session SQLite et l’identité de transcription.
- Les réponses de réinitialisation et de checkpoint Gateway renvoient des lignes de session propres plus les ids de session.
  Elles ne synthétisent plus de localisateurs de transcription SQLite pour les clients.
- Le dreaming memory-core ne purge plus les lignes de session en sondant des fichiers JSONL manquants.
  Le nettoyage de subagent passe par l’API runtime de session au lieu de
  vérifications d’existence du système de fichiers. Ses tests d’ingestion de transcription amorcent directement des lignes SQLite
  au lieu de créer des fixtures `agents/<id>/sessions` ou des espaces réservés de localisateur.
- L’indexation de transcriptions mémoire peut exposer `transcript:<agentId>:<sessionId>` comme
  chemin virtuel de résultat de recherche pour les assistants de citation/lecture. La source d’index durable est
  relationnelle (`source_kind='sessions'`, `source_key='session:<sessionId>'`,
  `session_id=<sessionId>`), donc la valeur n’est pas un localisateur de transcription runtime,
  pas un chemin de système de fichiers, et ne doit jamais être retransmise aux API runtime de session.
- Le statut mémoire doctor Gateway lit les comptes de rappel court terme et de phase-signal
  depuis les lignes d’état de plugin SQLite au lieu de `memory/.dreams/*.json`; la sortie CLI et
  doctor étiquette désormais ce stockage comme un magasin SQLite, pas comme un chemin.
- Le runtime memory-core, le statut CLI, les méthodes doctor Gateway et les façades du SDK plugin
  n’auditent ni n’archivent plus les anciens fichiers `.dreams/session-corpus`.
  Ces fichiers sont uniquement des entrées de migration; doctor les importe dans SQLite et
  supprime la source après vérification. Les lignes d’évidence d’ingestion de session active
  utilisent désormais le chemin SQLite virtuel `memory/session-ingestion/<day>.txt`; le runtime
  n’écrit jamais d’état dans `.dreams/session-corpus` ni n’en dérive.
- Les artefacts publics memory-core exposent les événements hôte SQLite comme l’artefact JSON virtuel
  `memory/events/memory-host-events.json`; ils ne réutilisent plus l’ancien
  chemin source `.dreams/events.jsonl`.
- Les registres de conteneurs/navigateurs sandbox utilisent désormais la table SQLite partagée
  `sandbox_registry_entries` avec des colonnes typées session, image, horodatage,
  backend/config et port de navigateur. Doctor importe les anciens fichiers de registre JSON monolithiques et
  fragmentés et supprime les sources réussies. Les lectures runtime utilisent
  les colonnes de ligne typées comme source de vérité; `entry_json` n’est qu’une copie replay/debug.
- Les engagements utilisent désormais une table partagée typée `commitments` au lieu d’un
  blob JSON de magasin complet. Les sauvegardes d’instantané font un upsert par id d’engagement et ne suppriment que
  les lignes manquantes au lieu de vider et réinsérer la table. Le runtime charge
  les engagements depuis les colonnes typées scope, fenêtre de livraison, statut, tentative et texte;
  `record_json` n’est qu’une copie replay/debug. Doctor importe l’ancien
  `commitments.json` et le supprime après un import réussi.
- Les définitions de tâches Cron, l’état de planification et l’historique d’exécution n’ont plus d’écrivains ni de lecteurs JSON runtime.
  Le runtime utilise les lignes `cron_jobs` avec des planifications typées,
  colonnes payload, delivery, failure-alert, session, status et runtime-state, plus métadonnées
  `cron_run_logs` typées pour le statut, le résumé de diagnostics, le statut/l’erreur de livraison,
  la session/l’exécution, le modèle et les totaux de jetons. `job_json` n’est qu’une copie de relecture/débogage ; `state_json` conserve les diagnostics d’exécution imbriqués qui n’ont pas encore de champs de requête à chaud, tandis que le runtime
  réhydrate les champs d’état à chaud depuis des colonnes typées. Doctor importe
  les fichiers hérités `jobs.json`, `jobs-state.json` et `runs/*.jsonl`, puis supprime
  les sources importées. Les réécritures de cible Plugin mettent à jour les lignes `cron_jobs`
  correspondantes au lieu de charger et remplacer tout le stockage cron.
- Le démarrage du Gateway ignore les marqueurs hérités `notify: true` dans la projection
  runtime. Doctor les traduit en livraison SQLite explicite quand
  `cron.webhook` est valide, supprime les marqueurs inertes quand il n’est pas défini, et les conserve
  avec un avertissement quand le webhook configuré est invalide.
- Les files de livraison sortantes et de session stockent désormais le statut de file, le type d’entrée,
  la clé de session, le canal, la cible, l’id de compte, le nombre de tentatives, la dernière tentative/erreur,
  l’état de récupération et les marqueurs d’envoi de plateforme sous forme de colonnes typées dans la table partagée
  `delivery_queue_entries`. La récupération runtime lit ces champs à chaud depuis
  les colonnes typées, et les mutations de nouvelle tentative/récupération mettent à jour ces colonnes directement
  sans réécrire le JSON de relecture. La charge utile JSON complète ne reste que comme
  blob de relecture/débogage pour les corps de messages et les autres données de relecture froides.
- Les enregistrements d’images sortantes gérées utilisent désormais des lignes partagées typées
  `managed_outgoing_image_records`, les octets média restant stockés dans
  `media_blobs`. L’enregistrement JSON ne reste que comme copie de relecture/débogage.
- Les préférences de sélecteur de modèle Discord, les hachages de déploiement de commandes et les liaisons de fils
  utilisent désormais l’état Plugin SQLite partagé. Leurs plans d’import JSON hérités vivent dans la surface
  de configuration/migration doctor du Plugin Discord, pas dans le code de migration core.
- Les détecteurs d’import hérité de Plugin utilisent des modules nommés doctor comme
  `doctor-legacy-state.ts` ou `doctor-state-imports.ts` ; les modules runtime de canal normaux
  ne doivent pas importer de détecteurs JSON hérités.
- Les curseurs de rattrapage BlueBubbles et les marqueurs de déduplication entrants utilisent désormais l’état Plugin SQLite
  partagé. Leurs plans d’import JSON hérités vivent dans la surface de configuration/migration doctor du Plugin BlueBubbles,
  pas dans le code de migration core.
- Les offsets de mise à jour Telegram, les lignes de cache d’autocollants, les lignes de cache de messages envoyés,
  les lignes de cache de noms de sujets et les liaisons de fils utilisent désormais l’état Plugin SQLite
  partagé. Leurs plans d’import JSON hérités vivent dans la surface
  de configuration/migration doctor du Plugin Telegram, pas dans le code de migration core.
- Les curseurs de rattrapage iMessage, les correspondances d’id courts de réponse et les lignes de déduplication d’échos envoyés
  utilisent désormais l’état Plugin SQLite partagé. Les anciens fichiers `imessage/catchup/*.json`,
  `imessage/reply-cache.jsonl` et `imessage/sent-echoes.jsonl` sont
  uniquement des entrées doctor.
- Les lignes de déduplication des messages Feishu utilisent désormais l’état Plugin SQLite partagé au lieu
  des fichiers `feishu/dedup/*.json`. Son plan d’import JSON hérité vit dans la surface de configuration/migration doctor du Plugin Feishu,
  pas dans le code de migration core.
- Les conversations, sondages, tampons d’envoi en attente et apprentissages de retour Microsoft Teams
  utilisent désormais des tables d’état/blob Plugin SQLite partagées. Le chemin d’envoi en attente
  utilise `plugin_blob_entries` afin que les tampons média soient stockés comme BLOB SQLite
  plutôt qu’en JSON base64. Les noms d’aides runtime utilisent désormais une dénomination SQLite/état
  plutôt qu’une dénomination de stockage de fichiers `*-fs`, et l’ancien shim `storePath` a disparu
  de ces stockages. Son plan d’import JSON hérité vit dans la surface de configuration/migration doctor du Plugin Microsoft Teams.
- Les médias sortants hébergés Zalo utilisent désormais `plugin_blob_entries` SQLite partagé
  au lieu de sidecars temporaires JSON/bin `openclaw-zalo-outbound-media`.
- Le HTML et les métadonnées du visualiseur de diffs utilisent désormais `plugin_blob_entries` SQLite partagé
  au lieu de fichiers temporaires `meta.json`/`viewer.html`. Les sorties PNG/PDF rendues restent
  des matérialisations temporaires parce que la livraison par canal a encore besoin d’un chemin de fichier.
- Les documents gérés Canvas utilisent désormais `plugin_blob_entries` SQLite partagé
  au lieu d’un répertoire par défaut `state/canvas/documents`. L’hôte Canvas sert ces
  blobs directement ; les fichiers locaux ne sont créés que pour du contenu opérateur explicite `host.root`
  ou une matérialisation temporaire quand un lecteur média en aval
  exige un chemin.
- Les décisions d’audit File Transfer utilisent désormais `plugin_state_entries` SQLite partagé
  au lieu du journal runtime non borné `audit/file-transfer.jsonl`. Doctor
  importe le fichier d’audit JSONL hérité dans l’état Plugin et supprime la source
  après un import propre.
- Les baux de processus ACPX et l’identité d’instance Gateway utilisent désormais l’état Plugin SQLite partagé.
  Doctor importe le fichier hérité `gateway-instance-id` dans l’état Plugin
  et supprime la source.
- Les scripts wrapper générés ACPX et le home Codex isolé sont une matérialisation temporaire
  sous la racine temporaire OpenClaw, pas un état OpenClaw durable. Les
  enregistrements runtime ACPX durables sont les lignes SQLite de bail et d’instance Gateway ;
  l’ancienne surface de configuration ACPX `stateDir` est supprimée parce qu’aucun état runtime
  n’y est plus écrit.
- Les pièces jointes média du Gateway utilisent désormais la table SQLite partagée `media_blobs` comme
  stockage canonique des octets. Les chemins locaux renvoyés aux surfaces de compatibilité canal et sandbox
  sont des matérialisations temporaires de la ligne de base de données, pas le
  stockage média durable. Les listes d’autorisation média runtime n’incluent plus les racines héritées
  `$OPENCLAW_STATE_DIR/media` ou `media` du répertoire de configuration ; ces répertoires sont
  uniquement des sources d’import doctor.
- La complétion shell n’écrit plus de fichiers de cache `$OPENCLAW_STATE_DIR/completions/*`.
  Les chemins de smoke d’installation, doctor, mise à jour et publication utilisent une sortie de complétion générée
  ou le sourçage de profil au lieu de fichiers de cache de complétion durables.
- La préparation d’envoi de Skills du Gateway utilise désormais des lignes partagées `skill_uploads`. Les métadonnées
  d’envoi, les clés d’idempotence et les octets d’archive vivent dans SQLite ; l’installateur
  ne reçoit qu’un chemin d’archive matérialisé temporaire pendant l’exécution d’une installation.
- Les pièces jointes inline des sous-agents ne se matérialisent plus sous
  `.openclaw/attachments/*` dans l’espace de travail. Le chemin de spawn prépare des entrées de graine SQLite VFS,
  les exécutions inline sèment ces entrées dans l’espace de noms scratch runtime par agent,
  et les outils adossés au disque superposent ce scratch SQLite pour les chemins de pièces jointes. Les
  anciennes colonnes de registre de répertoire de pièces jointes d’exécution de sous-agent et les hooks de nettoyage ont disparu.
- L’hydratation d’images CLI ne maintient plus de fichiers de cache stables `openclaw-cli-images`.
  Les backends CLI externes reçoivent encore des chemins de fichiers, mais ces chemins sont
  des matérialisations temporaires par exécution avec nettoyage.
- Les diagnostics de trace de cache, les diagnostics de charge utile Anthropic, les diagnostics bruts de flux de modèle,
  les événements de chronologie de diagnostics et les bundles de stabilité Gateway écrivent désormais des lignes SQLite
  au lieu de fichiers `logs/*.jsonl` ou
  `logs/stability/*.json`.
  Les indicateurs et variables d’environnement de remplacement de chemin runtime ont été supprimés ; les commandes
  d’export/débogage peuvent matérialiser explicitement des fichiers depuis les lignes de base de données.
- Le compagnon macOS n’a plus de writer `diagnostics.jsonl` roulant. Les journaux d’application
  vont vers la journalisation unifiée, et les diagnostics Gateway durables restent adossés à SQLite.
- La liste d’enregistrements du port-guardian macOS utilise désormais des lignes partagées typées SQLite
  `macos_port_guardian_records` au lieu d’un fichier JSON Application Support
  ou d’un blob singleton opaque.
- Les verrous singleton Gateway utilisent désormais des lignes partagées typées SQLite `state_leases` sous
  le périmètre `gateway_locks` au lieu de fichiers de verrou dans le répertoire temporaire. Les docs de dépannage Fly et OAuth
  pointent désormais vers le verrou de bail/rafraîchissement auth SQLite au lieu
  du nettoyage obsolète des verrous de fichiers.
- L’état de sentinelle de redémarrage Gateway utilise désormais des lignes partagées typées SQLite
  `gateway_restart_sentinel` au lieu de `restart-sentinel.json` ; le runtime
  lit le type de sentinelle, le statut, le routage, le message, la continuation et les statistiques depuis
  des colonnes typées. `payload_json` n’est qu’une copie de relecture/débogage. Le code runtime efface
  directement la ligne SQLite et ne transporte plus de plomberie de nettoyage de fichiers.
- L’intention de redémarrage Gateway et l’état de transfert superviseur utilisent désormais des lignes partagées typées
  SQLite `gateway_restart_intent` et `gateway_restart_handoff` au lieu des sidecars
  `gateway-restart-intent.json` et
  `gateway-supervisor-restart-handoff.json`.
- La coordination singleton Gateway utilise désormais des lignes typées `state_leases` sous
  `gateway_locks` au lieu d’écrire des fichiers `gateway.<hash>.lock`. La ligne de bail
  possède le propriétaire du verrou, l’expiration, le heartbeat et la charge utile de débogage ; SQLite possède la
  frontière atomique d’acquisition/libération. L’option retirée de répertoire de verrous de fichiers a
  disparu ; les tests utilisent directement l’identité de ligne SQLite.
- L’ancien helper non référencé de rapport d’utilisation cron qui analysait les fichiers `cron/runs/*.jsonl`
  a été supprimé. Les rapports d’historique d’exécutions cron doivent lire les lignes SQLite typées
  `cron_run_logs`.
- La récupération de redémarrage de session principale découvre désormais les agents candidats via le
  registre SQLite `agent_databases` au lieu d’analyser les répertoires `agents/*/sessions`.
- La récupération de corruption de session Gemini ne supprime désormais que la ligne de session SQLite ;
  elle n’a plus besoin d’un garde `storePath` hérité et ne tente plus de supprimer par unlink un chemin
  transcript JSONL dérivé.
- La gestion des remplacements de chemin traite désormais les valeurs d’environnement littérales `undefined`/`null`
  comme non définies, évitant des bases de données accidentelles `undefined/state/*.sqlite` à la racine du dépôt
  pendant les tests ou les transferts shell.
- Les empreintes de santé de configuration utilisent désormais des lignes partagées typées SQLite `config_health_entries`
  au lieu de `logs/config-health.json`, gardant le fichier de configuration normal comme
  seul document de configuration hors identifiants. Le compagnon macOS ne conserve qu’un
  état de santé local au processus et ne recrée pas l’ancien sidecar JSON.
- Le runtime de profils d’authentification n’importe ni n’écrit plus de fichiers JSON d’identifiants. Le
  stockage canonique des identifiants est SQLite ; `auth-profiles.json`, les fichiers par agent
  `auth.json` et le fichier partagé `credentials/oauth.json` sont des entrées de migration doctor
  supprimées après import.
- Les tests de sauvegarde/état de profils d’authentification vérifient désormais directement les tables auth SQLite typées
  et n’utilisent les noms de fichiers de profils auth hérités que comme entrées de migration doctor.
- `openclaw secrets apply` nettoie uniquement le fichier de configuration, le fichier d’environnement et le stockage SQLite
  de profils auth. Il ne transporte plus de logique de compatibilité qui modifie
  le `auth.json` par agent retiré ; doctor possède l’import et la suppression de ce fichier.
- Les plans et applications de migration de secrets Hermes importent les profils de clés API directement
  dans le stockage SQLite de profils auth. Ils n’écrivent ni ne vérifient plus
  `auth-profiles.json` comme cible intermédiaire.
- Les docs d’authentification destinées aux utilisateurs décrivent désormais
  `state/openclaw.sqlite#table/auth_profile_stores/<agentDir>` au lieu de
  dire aux utilisateurs d’inspecter ou de copier `auth-profiles.json` ; les noms JSON OAuth/auth hérités
  ne restent documentés que comme entrées d’import doctor.
- Les helpers de chemins d’état core n’exposent plus le fichier retiré `credentials/oauth.json`.
  Le nom de fichier hérité est local au chemin d’import auth doctor.
- Les docs d’installation, de sécurité, d’onboarding, d’authentification de modèle et de SecretRef décrivent désormais
  les lignes de profils auth SQLite et la sauvegarde/migration de tout l’état au lieu de
  fichiers JSON de profils auth par agent.
- La découverte de modèles PI transmet désormais les identifiants canoniques au stockage d’authentification
  en mémoire `pi-coding-agent`. Elle ne crée, ne nettoie ni n’écrit plus
  de `auth.json` par agent pendant la découverte.
- Les paramètres de déclenchement et de routage Voice Wake utilisent désormais des tables partagées typées SQLite
  au lieu de `settings/voicewake.json`, `settings/voicewake-routing.json` ou
  de lignes génériques opaques ; doctor importe les fichiers JSON hérités et les supprime après une
  migration réussie.
- L’état de vérification des mises à jour utilise désormais une ligne partagée typée `update_check_state` au lieu de
  `update-check.json` ou d’un blob générique opaque ; doctor importe
  le fichier JSON hérité et le supprime après une migration réussie.
- L’état de santé de configuration utilise désormais des lignes partagées typées `config_health_entries` au lieu
  de `logs/config-health.json` ou d’un blob générique opaque ; doctor
  importe le fichier JSON hérité et le supprime après une migration réussie.
- Les approbations de liaisons de conversations Plugin utilisent désormais des lignes typées
  `plugin_binding_approvals` au lieu d’un état SQLite partagé opaque ou
  `plugin-binding-approvals.json`; le fichier hérité est une entrée de migration doctor.
- Les liaisons génériques de conversation actuelle stockent désormais des lignes
  `current_conversation_bindings` typées au lieu de réécrire
  `bindings/current-conversations.json`; doctor importe l’ancien fichier JSON et
  le supprime après une migration réussie.
- Les registres de synchronisation des sources importées de Memory Wiki stockent
  désormais une ligne d’état de Plugin SQLite par clé de coffre/source au lieu de
  réécrire `.openclaw-wiki/source-sync.json`; le fournisseur de migration importe
  et supprime l’ancien registre JSON.
- Les enregistrements d’exécution d’import ChatGPT de Memory Wiki stockent
  désormais une ligne d’état de Plugin SQLite par coffre/identifiant d’exécution
  au lieu d’écrire `.openclaw-wiki/import-runs/*.json`. Les instantanés de
  restauration restent des fichiers de coffre explicites jusqu’à ce que
  l’archivage des instantanés d’exécution d’import soit déplacé vers le stockage
  de blobs.
- Les condensés compilés de Memory Wiki stockent désormais des lignes de blob de
  Plugin SQLite au lieu d’écrire `.openclaw-wiki/cache/agent-digest.json` et
  `.openclaw-wiki/cache/claims.jsonl`. Le fournisseur de migration importe les
  anciens fichiers de cache et supprime le répertoire de cache lorsqu’il devient
  vide.
- Le suivi d’installation de Skills ClawHub stocke désormais une ligne d’état de
  Plugin SQLite par espace de travail/Skill au lieu d’écrire ou de lire les
  fichiers annexes `.clawhub/lock.json` et `.clawhub/origin.json` à l’exécution.
  Le code d’exécution utilise des objets d’état d’installation suivie plutôt que
  des abstractions lockfile/origine structurées comme des fichiers. Doctor importe
  les anciens fichiers annexes depuis les espaces de travail d’agent configurés et
  les supprime après un import propre.
- L’index des Plugins installés lit et écrit désormais la ligne singleton
  `installed_plugin_index` SQLite partagée typée au lieu de `plugins/installs.json`;
  l’ancien fichier JSON est seulement une entrée de migration doctor et est
  supprimé après import.
- L’assistant de chemin hérité `plugins/installs.json` vit désormais dans le code
  hérité de doctor. Les modules d’index de Plugin à l’exécution exposent
  uniquement des options de persistance adossées à SQLite, et non un chemin de
  fichier JSON.
- La sentinelle de redémarrage Gateway, l’intention de redémarrage et l’état de
  transfert au superviseur utilisent désormais des lignes SQLite partagées typées
  (`gateway_restart_sentinel`, `gateway_restart_intent` et
  `gateway_restart_handoff`) au lieu de blobs opaques génériques. Le code de
  redémarrage à l’exécution n’a plus de contrat sentinelle/intention/transfert
  structuré comme un fichier.
- Le cache de synchronisation Matrix, les métadonnées de stockage, les liaisons
  de fils, les marqueurs de déduplication entrante, l’état de délai de
  récupération de vérification au démarrage, les instantanés crypto IndexedDB du
  SDK, les identifiants et les clés de récupération utilisent désormais les
  tables SQLite partagées d’état/blob de Plugin. Les structures de chemins à
  l’exécution n’exposent plus de chemin de métadonnées `storage-meta.json`; ce nom
  de fichier est seulement une entrée de migration héritée. Leur plan d’import
  JSON hérité vit dans la surface de configuration/migration doctor du Plugin
  Matrix.
- Le démarrage de Matrix n’analyse, ne signale ni ne complète plus l’état de
  fichier Matrix hérité. La détection de fichiers Matrix, la création
  d’instantanés crypto hérités, l’état de migration de restauration des clés de
  salon, l’import et la suppression des sources appartiennent tous à doctor.
- Les barrels de migration Matrix à l’exécution ont été supprimés. Les assistants
  de détection et de mutation d’état/crypto hérités sont importés directement par
  le doctor Matrix au lieu de faire partie de la surface d’API d’exécution.
- Les marqueurs de réutilisation d’instantané de migration Matrix vivent
  désormais dans l’état de Plugin SQLite au lieu de
  `matrix/migration-snapshot.json`; doctor peut toujours réutiliser la même
  archive pré-migration vérifiée sans écrire de fichier annexe d’état.
- Les curseurs de bus Nostr et l’état de publication de profil utilisent
  désormais l’état de Plugin SQLite partagé. Leur plan d’import JSON hérité vit
  dans la surface de configuration/migration doctor du Plugin Nostr.
- Les bascules de session Active Memory utilisent désormais l’état de Plugin
  SQLite partagé au lieu de `session-toggles.json`; réactiver la mémoire supprime
  la ligne au lieu de réécrire un objet JSON.
- Les propositions Skill Workshop et les compteurs de revue utilisent désormais
  l’état de Plugin SQLite partagé au lieu de magasins
  `skill-workshop/<workspace>.json` par espace de travail. Chaque proposition est
  une ligne distincte sous `skill-workshop/proposals`, et le compteur de revue
  est une ligne distincte sous `skill-workshop/reviews`.
- Les exécutions de sous-agent réviseur Skill Workshop utilisent désormais le
  résolveur de transcription de session d’exécution au lieu de créer des chemins
  de session annexes `skill-workshop/<sessionId>.json`.
- Les baux de processus ACPX utilisent désormais l’état de Plugin SQLite partagé
  sous `acpx/process-leases` au lieu d’un registre complet
  `process-leases.json`. Chaque bail est stocké dans sa propre ligne, ce qui
  préserve l’élimination au démarrage des processus obsolètes sans chemin de
  réécriture JSON à l’exécution.
- Les scripts wrapper ACPX et le domicile Codex isolé sont générés dans la racine
  temporaire OpenClaw. Ils sont recréés selon les besoins et ne sont pas des
  entrées de sauvegarde ou de migration.
- La persistance du registre d’exécutions de sous-agent utilise des lignes
  partagées typées `subagent_runs`. L’ancien chemin `subagents/runs.json` est
  désormais seulement une entrée de migration doctor, et les noms d’assistants à
  l’exécution ne décrivent plus la couche d’état comme adossée au disque. Les
  tests d’exécution ne créent plus de fixtures `runs.json` invalides ou vides
  pour prouver le comportement du registre; ils initialisent/lisent directement
  des lignes SQLite.
- La sauvegarde prépare le répertoire d’état avant l’archivage, copie les fichiers
  non-base de données, crée des instantanés des bases `*.sqlite` avec
  `VACUUM INTO`, omet les fichiers annexes WAL/SHM actifs, enregistre les
  métadonnées d’instantané dans le manifeste de l’archive et enregistre les
  exécutions de sauvegarde terminées dans SQLite avec le manifeste de l’archive.
  `openclaw backup create` valide l’archive écrite par défaut; `--no-verify` est
  le chemin rapide explicite.
- `openclaw backup restore` valide l’archive avant extraction, réutilise le
  manifeste normalisé du vérificateur et restaure les ressources de manifeste
  vérifiées vers leurs chemins sources enregistrés. Il exige `--yes` pour les
  écritures et prend en charge `--dry-run` pour un plan de restauration.
- L’ancien filtre de chemins volatils de sauvegarde est supprimé. La sauvegarde
  n’a plus besoin d’une liste d’exclusion tar active pour les fichiers JSON/JSONL
  hérités de session ou de cron, car les instantanés SQLite sont préparés avant
  la création de l’archive.
- La préparation d’espace de travail de configuration simple et d’onboarding ne
  crée plus de répertoires `agents/<agentId>/sessions/`. Elle crée uniquement la
  configuration/l’espace de travail; les lignes de session SQLite et les lignes
  de transcription sont créées à la demande dans la base de données par agent.
- La réparation des autorisations de sécurité cible désormais les bases de
  données SQLite globale et par agent ainsi que les fichiers annexes WAL/SHM au
  lieu de `sessions.json` et des fichiers de transcription JSONL.
- Les noms d’exécution du registre de sandbox décrivent désormais directement les
  types de registre SQLite au lieu de transporter la terminologie de registre JSON
  héritée dans le magasin actif.
- `openclaw reset --scope config+creds+sessions` supprime les bases de données
  `openclaw-agent.sqlite` par agent ainsi que les fichiers annexes WAL/SHM, pas
  seulement les répertoires `sessions/` hérités.
- Les assistants de session agrégée Gateway utilisent désormais des noms orientés
  entrée: `loadCombinedSessionEntriesForGateway` renvoie
  `{ databasePath, entries }`. L’ancienne dénomination de magasin combiné a été
  supprimée des appelants à l’exécution.
- L’amorçage du canal Docker MCP écrit désormais la ligne de session principale
  et les événements de transcription dans la base de données SQLite par agent au
  lieu de créer `sessions.json` et une transcription JSONL.
- Le hook groupé de mémoire de session résout désormais le contexte de session
  précédente depuis SQLite par `{agentId, sessionId}`. Il n’analyse, ne stocke ni
  ne synthétise plus de chemins de transcription ni de répertoires
  `workspace/sessions`.
- Le hook groupé de journalisation des commandes écrit désormais les lignes
  d’audit de commande dans la table SQLite partagée `command_log_entries` au lieu
  d’ajouter à `logs/commands.log`.
- Les listes d’autorisation d’appairage de canal exposent désormais uniquement
  des assistants de lecture/écriture adossés à SQLite à l’exécution et dans le
  SDK de Plugin. L’ancien résolveur de chemin `*-allowFrom.json` et le lecteur de
  fichier vivent uniquement sous le code d’import hérité de doctor.
- `migration_runs` enregistre les exécutions de migration d’état hérité avec
  statut, horodatages et rapports JSON.
- `migration_sources` enregistre chaque source de fichier hérité importée avec
  hachage, taille, nombre d’enregistrements, table cible, identifiant
  d’exécution, statut et état de suppression de source.
- `backup_runs` enregistre les chemins d’archives de sauvegarde, le statut et les
  manifestes JSON.
- Le schéma global ne conserve pas de table de registre `agents` inutilisée. La
  découverte des bases de données d’agents est le registre canonique
  `agent_databases` jusqu’à ce que l’exécution ait un véritable propriétaire
  d’enregistrement d’agent.
- La configuration générée du catalogue de modèles est stockée dans des lignes
  SQLite globales typées `agent_model_catalogs` indexées par répertoire d’agent.
  Les appelants à l’exécution utilisent `ensureOpenClawModelCatalog`; il n’y a
  pas d’API de compatibilité `models.json` dans le code d’exécution.
  L’implémentation écrit dans SQLite et le registre PI intégré est hydraté depuis
  cette charge stockée sans créer de fichier `models.json`.
- L’export Markdown de transcription de session QMD et la configuration
  `memory.qmd.sessions` ont été supprimés. Il n’y a pas de collection de
  transcriptions QMD, pas de chemin d’exécution `qmd/sessions*` et pas de pont de
  mémoire de session adossé à des fichiers.
- Le runtime memory-core importe les assistants d’indexation de transcription
  SQLite depuis
  `openclaw/plugin-sdk/memory-core-host-engine-session-transcripts`, et non le
  sous-chemin SDK QMD. Le sous-chemin QMD conserve une réexportation de
  compatibilité uniquement pour les appelants externes jusqu’à ce qu’un nettoyage
  majeur du SDK puisse la supprimer.
- Le propre `index.sqlite` de QMD est désormais une matérialisation temporaire à
  l’exécution adossée à la table SQLite principale `plugin_blob_entries`.
  L’exécution ne crée plus de fichier annexe durable
  `~/.openclaw/agents/<agentId>/qmd`.
- Le Plugin facultatif `memory-lancedb` ne crée plus
  `~/.openclaw/memory/lancedb` comme magasin implicite géré par OpenClaw. Il
  s’agit d’un backend LanceDB externe qui reste désactivé jusqu’à ce que
  l’opérateur configure un `dbPath` explicite.
- `check:database-first-legacy-stores` échoue sur les nouvelles sources
  d’exécution qui associent des noms de magasins hérités à des API de système de
  fichiers de style écriture. Il échoue aussi sur les sources d’exécution qui
  réintroduisent les marqueurs retirés du pont de transcription
  `transcriptLocator` ou `sqlite-transcript://...`. Le code de migration, doctor,
  import et export explicite hors session reste autorisé. Les noms plus larges de
  contrats hérités comme `sessionFile`, `storePath` et les anciennes façades
  `SessionManager` de l’ère fichiers ont encore des propriétaires actuels et
  nécessitent un travail de garde de migration séparé avant de pouvoir devenir un
  contrôle préliminaire obligatoire. La garde couvre désormais aussi les magasins
  d’exécution `cache/*.json`, les fichiers annexes génériques
  `thread-bindings.json`, les JSON d’état/journal d’exécution cron, les JSON de
  santé de configuration, les fichiers annexes de redémarrage et de verrouillage,
  les paramètres Voice Wake, les approbations de liaisons de Plugin, le JSON
  d’index des Plugins installés, les JSONL d’audit File Transfer, les journaux
  d’activité Memory Wiki, l’ancien journal texte `command-logger` groupé et les
  réglages de diagnostic JSONL de flux brut pi-mono. Elle interdit aussi les
  anciens noms de modules hérités doctor au niveau racine afin que le code de
  compatibilité reste sous `src/commands/doctor/`. Les gestionnaires de débogage
  Android utilisent également logcat/la sortie en mémoire au lieu de préparer des
  fichiers de cache `camera_debug.log` ou `debug_logs.txt`.

## Forme du schéma cible

Gardez les schémas explicites. L’état d’exécution possédé par l’hôte utilise des tables typées. L’état opaque
possédé par les Plugin utilise `plugin_state_entries` / `plugin_blob_entries` ; il n’existe pas
de table `kv` d’hôte générique.

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

Les valeurs volumineuses doivent utiliser des colonnes `blob`, pas un encodage de chaîne JSON. Gardez
`value_json` pour les petites données structurées qui doivent rester inspectables avec des outils
SQLite ordinaires.

`agent_databases` est le registre canonique pour cette branche. N’ajoutez pas de table
`agents` tant qu’il n’existe pas de véritable propriétaire des enregistrements d’agents ; la configuration des agents reste dans
`openclaw.json`.

## Forme de migration de doctor

Doctor doit appeler une étape de migration explicite, consignée dans un rapport et sûre à
réexécuter :

```bash
openclaw doctor --fix
```

`openclaw doctor --fix` invoque l’implémentation de migration d’état après
le précontrôle de configuration ordinaire et crée une sauvegarde vérifiée avant l’importation. Le démarrage du runtime
et `openclaw migrate` ne doivent pas importer les anciens fichiers d’état OpenClaw.

Propriétés de migration :

- Une seule passe de migration découvre toutes les sources de fichiers hérités et produit un plan
  avant de modifier quoi que ce soit.
- Doctor crée une archive de sauvegarde pré-migration vérifiée avant d’importer
  les fichiers hérités.
- Les importations sont idempotentes et indexées par chemin source, mtime, taille, hachage et table
  cible.
- Les fichiers sources importés avec succès sont supprimés ou archivés après validation de la base de données
  cible.
- Les importations échouées laissent la source intacte et enregistrent un avertissement dans
  `migration_runs`.
- Le code du runtime lit uniquement SQLite une fois la migration disponible.
- Aucun chemin de rétrogradation/export vers des fichiers runtime n’est requis.

## Inventaire de migration

Déplacez ceux-ci dans la base de données globale :

- Les écritures d’exécution du registre des tâches utilisent désormais la base de données partagée ; l’importateur sidecar non livré
  `tasks/runs.sqlite` est supprimé. Les sauvegardes d’instantanés effectuent un upsert par identifiant de tâche
  et ne suppriment que les lignes de tâche/livraison manquantes.
- Les écritures d’exécution Task Flow utilisent désormais la base de données partagée ; l’importateur sidecar non livré
  `tasks/flows/registry.sqlite` est supprimé. Les sauvegardes d’instantanés
  effectuent un upsert par identifiant de flux et ne suppriment que les lignes de flux manquantes.
- Les écritures d’exécution de l’état des Plugins utilisent désormais la base de données partagée ; l’importateur sidecar non livré
  `plugin-state/state.sqlite` est supprimé.
- La recherche mémoire intégrée ne cible plus par défaut `memory/<agentId>.sqlite` ; ses
  tables d’index vivent dans la base de données de l’agent propriétaire, et l’activation explicite du sidecar
  `memorySearch.store.path` a été retirée au profit de la migration de configuration doctor.
- La réindexation mémoire intégrée ne réinitialise que les tables appartenant à la mémoire dans la base de données de l’agent.
  Elle ne doit pas remplacer tout le fichier SQLite, car la même base de données possède
  les sessions, les transcriptions, les lignes VFS, les artefacts et les caches d’exécution.
- Registres de conteneurs/navigateurs de bac à sable depuis du JSON monolithique et fragmenté. Les écritures d’exécution
  utilisent désormais la base de données partagée ; l’import JSON hérité reste disponible.
- Les définitions de tâches Cron, l’état de planification et l’historique d’exécution utilisent désormais SQLite partagé ;
  doctor importe/supprime les fichiers hérités `jobs.json`, `jobs-state.json` et
  `cron/runs/*.jsonl`
- Identité/authentification de l’appareil, push, vérification des mises à jour, engagements, cache de modèles OpenRouter,
  index des Plugins installés et liaisons du serveur d’application
- Les enregistrements d’appairage et d’amorçage appareil/nœud utilisent désormais des tables SQLite typées
- Les abonnés aux notifications d’appairage d’appareils et les marqueurs de requêtes livrées utilisent désormais la
  table plugin-state SQLite partagée au lieu de `device-pair-notify.json`.
- Les enregistrements d’appels vocaux utilisent désormais la table plugin-state SQLite partagée sous l’espace de noms
  `voice-call` / `calls` au lieu de `calls.jsonl` ; la CLI du Plugin
  suit et résume l’historique des appels adossé à SQLite.
- Les sessions Gateway QQBot, les enregistrements d’utilisateurs connus et le cache de citations d’index de références utilisent désormais
  l’état de Plugin SQLite sous les espaces de noms `qqbot` (`gateway-sessions`,
  `known-users`, `ref-index`) au lieu de `session-*.json`, `known-users.json`
  et `ref-index.jsonl`. Ces fichiers hérités sont des caches et ne sont pas migrés.
- Les préférences du sélecteur de modèles Discord, les hachages de déploiement de commandes et les liaisons de fils
  utilisent désormais l’état de Plugin SQLite sous les espaces de noms `discord`
  (`model-picker-preferences`, `command-deploy-hashes`, `thread-bindings`)
  au lieu de `model-picker-preferences.json`, `command-deploy-cache.json` et
  `thread-bindings.json` ; la migration doctor/setup de Discord importe et
  supprime les fichiers hérités.
- Les curseurs de rattrapage BlueBubbles et les marqueurs de déduplication entrants utilisent désormais l’état de Plugin SQLite
  sous les espaces de noms `bluebubbles` (`catchup-cursors`, `inbound-dedupe`)
  au lieu de `bluebubbles/catchup/*.json` et
  `bluebubbles/inbound-dedupe/*.json` ; la migration doctor/setup BlueBubbles
  importe et supprime les fichiers hérités.
- Les offsets de mise à jour Telegram, les entrées de cache d’autocollants, les entrées de cache de messages de chaînes de réponses,
  les entrées de cache de messages envoyés, les entrées de cache de noms de sujets et les liaisons de fils
  utilisent désormais l’état de Plugin SQLite sous les espaces de noms `telegram`
  (`update-offsets`, `sticker-cache`, `message-cache`, `sent-messages`,
  `topic-names`, `thread-bindings`) au lieu de `update-offset-*.json`,
  `sticker-cache.json`, `*.telegram-messages.json`,
  `*.telegram-sent-messages.json`, `*.telegram-topic-names.json` et
  `thread-bindings-*.json` ; la migration doctor/setup Telegram importe et
  supprime les fichiers hérités.
- Les curseurs de rattrapage iMessage, les correspondances d’identifiants courts de réponse et les lignes de déduplication d’échos envoyés
  utilisent désormais l’état de Plugin SQLite sous les espaces de noms `imessage` (`catchup-cursors`,
  `reply-cache`, `sent-echoes`) au lieu de `imessage/catchup/*.json`,
  `imessage/reply-cache.jsonl` et `imessage/sent-echoes.jsonl` ; la migration doctor/setup iMessage
  importe et supprime les fichiers hérités.
- Les conversations, sondages, jetons SSO et apprentissages de retour Microsoft Teams
  utilisent désormais les espaces de noms d’état de Plugin SQLite (`conversations`, `polls`, `sso-tokens`,
  `feedback-learnings`) au lieu de `msteams-conversations.json`,
  `msteams-polls.json`, `msteams-sso-tokens.json` et `*.learnings.json` ; la
  migration doctor/setup Microsoft Teams importe et archive les fichiers hérités.
  Les téléversements en attente sont un cache SQLite de courte durée et les anciens fichiers de cache JSON ne sont
  pas migrés.
- Le cache de synchronisation Matrix, les métadonnées de stockage, les liaisons de fils, les marqueurs de déduplication entrants,
  l’état de délai de récupération de la vérification au démarrage, les identifiants, les clés de récupération et les instantanés crypto
  IndexedDB du SDK utilisent désormais les espaces de noms d’état/blob de Plugin SQLite sous
  `matrix` (`sync-store`, `storage-meta`, `thread-bindings`, `inbound-dedupe`,
  `startup-verification`, `credentials`, `recovery-key`, `idb-snapshots`)
  au lieu de `bot-storage.json`, `storage-meta.json`, `thread-bindings.json`,
  `inbound-dedupe.json`, `startup-verification.json`, `credentials.json`,
  `recovery-key.json` et `crypto-idb-snapshot.json` ; la migration doctor/setup Matrix
  importe et supprime ces fichiers hérités depuis les racines de stockage Matrix propres aux comptes.
- Les curseurs de bus Nostr et l’état de publication de profils utilisent désormais l’état de Plugin SQLite sous
  les espaces de noms `nostr` (`bus-state`, `profile-state`) au lieu de
  `bus-state-*.json` et `profile-state-*.json` ; la migration doctor/setup Nostr
  importe et supprime les fichiers hérités.
- Les bascules de session Active Memory utilisent désormais l’état de Plugin SQLite sous
  `active-memory/session-toggles` au lieu de `session-toggles.json`.
- Les files de propositions Skill Workshop et les compteurs de revue utilisent désormais l’état de Plugin SQLite
  sous `skill-workshop/proposals` et `skill-workshop/reviews` au lieu des fichiers
  `skill-workshop/<workspace>.json` propres à chaque espace de travail.
- Les files de livraison sortante et de livraison de session partagent désormais la table SQLite globale
  `delivery_queue_entries` sous des noms de file distincts
  (`outbound-delivery`, `session-delivery`) au lieu des fichiers durables
  `delivery-queue/*.json`, `delivery-queue/failed/*.json` et
  `session-delivery-queue/*.json`. L’étape doctor legacy-state importe
  les lignes en attente et échouées, supprime les marqueurs livrés obsolètes et supprime les anciens
  fichiers JSON après import. Les champs de routage à chaud et de nouvelle tentative sont des colonnes typées ; la
  charge utile JSON n’est conservée que pour la relecture/le débogage.
- Les baux de processus ACPX utilisent désormais l’état de Plugin SQLite sous `acpx/process-leases`
  au lieu de `process-leases.json`.
- Métadonnées des exécutions de sauvegarde et de migration

Déplacer ces éléments dans les bases de données des agents :

- Racines de session d’agent et charges utiles d’entrées de session au format compatible. Terminé pour
  les écritures d’exécution : les métadonnées de session à chaud sont interrogeables dans `sessions`, tandis que la
  charge utile complète héritée `SessionEntry` reste dans `session_entries`.
- Événements de transcription d’agent. Terminé pour les écritures d’exécution.
- Points de contrôle de Compaction et instantanés de transcription. Terminé pour les écritures d’exécution :
  les copies de transcription de point de contrôle sont des lignes de transcription SQLite et les métadonnées de point de contrôle
  sont enregistrées dans `transcript_snapshots`. Les assistants de point de contrôle Gateway
  nomment désormais ces valeurs comme des instantanés de transcription plutôt que des fichiers source.
- Espaces de noms de brouillon/espace de travail VFS d’agent. Terminé pour les écritures VFS d’exécution.
- Charges utiles de pièces jointes de sous-agent. Terminé pour les écritures d’exécution : ce sont des entrées d’amorçage VFS
  SQLite et jamais des fichiers d’espace de travail durables.
- Artefacts d’outils. Terminé pour les écritures d’exécution.
- Artefacts d’exécution. Terminé pour les écritures d’exécution worker via la table par agent
  `run_artifacts`.
- Caches d’exécution locaux à l’agent. Terminé pour les écritures de cache bornées à l’exécution worker via
  la table par agent `cache_entries`. Les caches de modèles à l’échelle du Gateway restent dans la
  base de données globale sauf s’ils deviennent spécifiques à un agent.
- Journaux de flux parents ACP. Terminé pour les écritures d’exécution.
- Sessions du registre de relecture ACP. Terminé pour les écritures d’exécution via
  `acp_replay_sessions` et `acp_replay_events` ; l’ancien `acp/event-ledger.json`
  reste uniquement comme entrée doctor.
- Métadonnées de session ACP. Terminé pour les écritures d’exécution via `acp_sessions` ; les blocs hérités
  `entry.acp` dans `sessions.json` ne sont que des entrées de migration doctor.
- Sidecars de trajectoire lorsqu’ils ne sont pas des fichiers d’export explicites. Terminé pour les écritures d’exécution :
  la capture de trajectoire écrit des lignes `trajectory_runtime_events` dans la base de données de l’agent
  et réplique les artefacts bornés à l’exécution dans SQLite. Les sidecars hérités ne sont que des entrées
  d’import doctor ; l’export peut matérialiser de nouvelles sorties JSONL de bundle d’assistance
  mais ne lit ni ne migre les anciens sidecars de trajectoire/transcription à l’exécution.
  La capture de trajectoire d’exécution expose la portée SQLite ; les assistants de chemins JSONL sont
  isolés à l’export/assistance au débogage et ne sont pas réexportés depuis le module d’exécution.
  Les métadonnées de trajectoire de l’exécuteur intégré enregistrent l’identité `{agentId, sessionId, sessionKey}`
  au lieu de persister un localisateur de transcription.

Conserver ces éléments adossés à des fichiers pour l’instant :

- `openclaw.json`
- fichiers d’identifiants fournisseur ou CLI
- manifestes de Plugin/package
- espaces de travail utilisateur et dépôts Git lorsque le mode disque est sélectionné
- journaux destinés au suivi par les opérateurs, sauf si une surface de journal spécifique est déplacée

## Plan de migration

### Phase 0 : figer la frontière

Rendre explicite la frontière de l’état durable avant de déplacer davantage de lignes :

- Ajouter une table `migration_runs` à la base de données globale.
  Terminé pour les rapports d’exécution de migration d’état hérité.
- Ajouter un service unique de migration d’état, possédé par doctor, pour l’import fichier vers base de données.
  Terminé : `openclaw doctor --fix` utilise l’implémentation de migration d’état hérité.
- Rendre `plan` en lecture seule et faire en sorte que `apply` crée une sauvegarde, importe, vérifie,
  puis supprime ou mette en quarantaine les anciens fichiers.
  Terminé : doctor crée une sauvegarde vérifiée avant migration, transmet le chemin de sauvegarde
  à `migration_runs` et réutilise les chemins d’importation/suppression.
- Ajouter des interdictions statiques afin que le nouveau code d’exécution ne puisse pas écrire de fichiers d’état hérités tandis que
  le code de migration et les tests peuvent encore les préparer/lire.
  Terminé pour les magasins hérités actuellement migrés ; le garde analyse aussi les
  tests imbriqués à la recherche de contrats interdits de localisateurs de transcription d’exécution.

### Phase 1 : terminer le plan de contrôle global

Conserver l’état de coordination partagé dans `state/openclaw.sqlite` :

- Agents et registre des bases de données d’agents
- Registres de tâches et Task Flow
- État des Plugins
- Registre de conteneurs/navigateurs de bac à sable
- Historique d’exécution Cron/planificateur
- Appairage, appareil, push, vérification des mises à jour, TUI, caches OpenRouter/modèles et autre
  petit état d’exécution borné au Gateway
- Métadonnées de sauvegarde et de migration
- Octets des pièces jointes média du Gateway. Terminé pour les écritures d’exécution ; les chemins de fichiers directs
  sont des matérialisations temporaires pour compatibilité avec les expéditeurs de canaux et la
  préparation du bac à sable. Les listes d’autorisation d’exécution acceptent les chemins de matérialisation SQLite, pas les racines média
  héritées d’état/configuration. Doctor importe les fichiers média hérités dans
  `media_blobs` et supprime les fichiers source après écriture réussie des lignes.
- Sessions, événements et blobs de charges utiles de capture du proxy de débogage. Terminé : les captures vivent
  dans la base de données d’état partagée et s’ouvrent via l’amorçage, le schéma,
  le WAL et les paramètres de délai d’occupation de la base de données d’état partagée. Les octets de charge utile sont compressés avec gzip dans
  `capture_blobs.data` ; il n’existe aucun remplacement de base sidecar d’exécution du proxy de débogage,
  répertoire de blobs ni cible générée de schéma/génération de code propre à la capture proxy.
  La migration doctor/démarrage importe les lignes `debug-proxy/capture.sqlite` livrées
  et les blobs de charge utile référencés, y compris les remplacements d’environnement actifs de base/blob hérités,
  puis archive ces sources tout en laissant les certificats CA intacts.

Cette phase supprime aussi les ouvreurs de sidecars dupliqués, les assistants d’autorisations, la configuration
WAL, l’élagage du système de fichiers et les écritures de compatibilité de ces sous-systèmes.

### Phase 2 : introduire des bases de données par agent

Créer une base de données par agent et l’enregistrer depuis la base de données globale :

```text
~/.openclaw/state/openclaw.sqlite
~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite
```

La ligne globale `agent_databases` stocke le chemin, la version de schéma, l’horodatage
de dernière observation et les métadonnées de base de taille/intégrité. Le code d’exécution demande au registre
la base de données de l’agent au lieu de dériver directement les chemins de fichiers.

La base de données de l’agent possède :

- `sessions` comme racine canonique de session, avec `session_entries` comme table de charge utile en forme de compatibilité rattachée à cette racine, et `session_routes` comme recherche unique du `session_key` actif
- `conversations` et `session_conversations` comme identité de routage de fournisseur normalisée rattachée aux sessions
- `transcript_events`
- instantanés de transcription et points de contrôle de Compaction. Terminé pour les écritures d’exécution.
- `vfs_entries`
- `tool_artifacts` et artefacts d’exécution
- lignes d’exécution/cache locales à l’agent. Terminé pour les caches à portée de worker.
- événements de flux parent ACP
- événements d’exécution de trajectoire lorsqu’ils ne sont pas des artefacts d’export explicites

### Phase 3 : Remplacer les API de magasin de sessions

Terminé pour l’exécution. La surface du magasin de sessions sous forme de fichier n’est pas un contrat d’exécution actif :

- L’exécution n’appelle plus `loadSessionStore(storePath)` et ne traite plus `storePath` comme identité de session.
- Les opérations de ligne d’exécution sont `getSessionEntry`, `upsertSessionEntry`, `patchSessionEntry`, `deleteSessionEntry` et `listSessionEntries`.
- Les helpers de réécriture complète du magasin, rédacteurs de fichiers, tests de file d’attente, élagage d’alias et paramètres de suppression de clés héritées ont disparu de l’exécution.
- Les exports de compatibilité dépréciés du package racine adaptent encore les chemins canoniques `sessions.json` aux API de lignes SQLite.
- L’analyse de `sessions.json` ne demeure que dans le code de migration/import de doctor et les tests de doctor.
- La reprise du cycle de vie d’exécution lit les en-têtes de transcription SQLite, et non les premières lignes JSONL.

Continuez à supprimer tout ce qui réintroduit des paramètres de verrouillage de fichier, le vocabulaire d’élagage/troncature comme maintenance de fichier, l’identité par chemin de magasin, ou des tests dont la seule assertion est la persistance JSON.

### Phase 4 : Déplacer les transcriptions, les flux ACP, les trajectoires et le VFS

Rendre chaque flux de données d’agent natif en base de données :

- Les écritures d’ajout de transcription passent par une transaction SQLite unique qui garantit l’en-tête de session, vérifie l’idempotence des messages, sélectionne la queue parente, insère dans `transcript_events` et enregistre les métadonnées d’identité interrogeables dans `transcript_event_identities`. Terminé pour les ajouts directs de messages de transcription et les ajouts persistés normaux de `TranscriptSessionManager` ; les opérations de branche explicites conservent leur choix explicite de parent et écrivent encore des lignes SQLite sans dériver de localisateur de fichier.
- Les journaux de flux parent ACP deviennent des lignes, et non des fichiers `.acp-stream.jsonl`. Terminé.
- La configuration de spawn ACP ne persiste plus les chemins JSONL de transcription. Terminé.
- La capture de trajectoire d’exécution écrit directement des lignes/artefacts d’événements. La commande explicite de support/export peut encore produire des artefacts JSONL de paquet de support comme format d’export, mais l’export de session ne recrée pas de JSONL de session. Terminé.
- Les espaces de travail sur disque restent sur disque lorsqu’ils sont configurés en mode disque.
- Le scratch VFS et le mode d’espace de travail expérimental VFS uniquement utilisent la base de données de l’agent.

La migration importe les anciens fichiers JSONL une seule fois, enregistre les nombres/hachages dans `migration_runs`, et supprime les fichiers importés après les contrôles d’intégrité.

### Phase 5 : Sauvegarde, restauration, vacuum et vérification

Les sauvegardes restent un fichier d’archive unique :

- Créer un point de contrôle pour chaque base de données globale et d’agent.
- Prendre un instantané de chaque base de données avec la sémantique de sauvegarde SQLite ou `VACUUM INTO`.
- Archiver les instantanés compacts des bases de données, la configuration, les identifiants externes et les exports d’espaces de travail demandés.
- Omettre les fichiers bruts actifs `*.sqlite-wal` et `*.sqlite-shm`.
- Vérifier en ouvrant chaque instantané de base de données et en exécutant `PRAGMA integrity_check`.
  `openclaw backup create` effectue cette vérification d’archive par défaut ; `--no-verify` ignore seulement la passe d’archive après écriture, pas le contrôle d’intégrité de création d’instantané.
- La restauration recopie les instantanés vers leurs chemins cibles. Cette branche réinitialise la disposition SQLite non publiée à `user_version = 1` ; de futures modifications de schéma publiées pourront ajouter des migrations explicites lorsqu’elles seront nécessaires.

### Phase 6 : Exécution des workers

Maintenir le mode worker expérimental pendant l’intégration de la séparation de base de données :

- Les workers reçoivent l’identifiant d’agent, l’identifiant d’exécution, le mode de système de fichiers et l’identité du registre de bases de données.
- Chaque worker ouvre sa propre connexion SQLite.
- Le parent conserve l’autorité sur la livraison de canal, les approbations, la configuration et l’annulation.
- Commencer avec un worker par exécution active ; ajouter un pool seulement après stabilisation du cycle de vie et de la propriété des connexions de base de données.

### Phase 7 : Supprimer l’ancien monde

Terminé pour la gestion des sessions d’exécution. L’ancien monde n’est autorisé que comme entrée explicite de doctor ou sortie de support/export :

- Aucune écriture d’exécution `sessions.json`, JSONL de transcription, JSON de registre de sandbox, SQLite sidecar de tâche ou SQLite sidecar d’état de Plugin.
- Aucun élagage de fichier JSON/session, troncature de transcription fichier, verrou de fichier de session ou test de session en forme de verrou.
- Aucun export de compatibilité d’exécution dont l’objectif est de maintenir à jour d’anciens fichiers de session.
- Les exports de support explicites restent des formats d’archive/matérialisation demandés par l’utilisateur et ne doivent pas réinjecter de noms de fichiers dans l’identité d’exécution.

## Sauvegarde et restauration

Les sauvegardes doivent être un fichier d’archive unique, mais la capture de base de données doit être native SQLite :

1. Arrêter l’activité d’écriture de longue durée ou entrer dans une courte barrière de sauvegarde.
2. Pour chaque base de données globale et d’agent, exécuter un point de contrôle.
3. Prendre un instantané de chaque base de données avec la sémantique de sauvegarde SQLite ou `VACUUM INTO` dans un répertoire de sauvegarde temporaire.
4. Archiver les instantanés compactés des bases de données, le fichier de configuration, le répertoire des identifiants, les espaces de travail sélectionnés et un manifeste.
5. Vérifier l’archive en ouvrant chaque instantané SQLite inclus et en exécutant `PRAGMA integrity_check`.
   `openclaw backup create` le fait par défaut ; `--no-verify` sert uniquement à ignorer intentionnellement la passe d’archive après écriture.

Ne vous appuyez pas sur des copies brutes actives de `*.sqlite`, `*.sqlite-wal` et `*.sqlite-shm` comme format principal de sauvegarde. Le manifeste d’archive doit enregistrer le rôle de la base de données, l’identifiant d’agent, la version de schéma, le chemin source, le chemin d’instantané, la taille en octets et l’état d’intégrité.

La restauration doit reconstruire la base de données globale et les fichiers de base de données d’agent à partir des instantanés de l’archive. Comme la disposition SQLite n’a pas encore été publiée, ce refactoring ne conserve que le schéma version 1 plus l’import fichier-vers-base de données par doctor. La commande de restauration valide d’abord l’archive, puis remplace chaque ressource du manifeste par la charge utile extraite vérifiée.

## Plan de refactoring de l’exécution

1. Ajouter des API de registre de bases de données.
   - Résoudre les chemins de base de données globale et de base de données par agent.
   - Conserver les schémas non publiés à `user_version = 1` ; ne pas ajouter de code de runner de migration de schéma avant qu’un schéma publié n’en ait besoin.
   - Ajouter des helpers de fermeture/point de contrôle/intégrité utilisés par les tests, la sauvegarde et doctor.

2. Réduire les magasins SQLite sidecar.
   - Déplacer les tables d’état de Plugin dans la base de données globale. Terminé pour les écritures d’exécution ; l’importeur sidecar hérité non publié est supprimé.
   - Déplacer les tables du registre de tâches dans la base de données globale. Terminé pour les écritures d’exécution ; l’importeur sidecar hérité non publié est supprimé.
   - Déplacer les tables Task Flow dans la base de données globale. Terminé pour les écritures d’exécution ; l’importeur sidecar hérité non publié est supprimé.
   - Déplacer les tables intégrées de recherche mémoire dans chaque base de données d’agent. Terminé ; le `memorySearch.store.path` personnalisé explicite est maintenant supprimé par la migration de configuration doctor.
     La réindexation complète s’exécute sur place contre les seules tables mémoire ; l’ancien chemin d’échange de fichier entier et le helper d’échange d’index sidecar sont supprimés.
   - Supprimer les ouvreurs de base de données dupliqués, la configuration WAL, les helpers d’autorisations et les chemins de fermeture de ces sous-systèmes.

3. Déplacer les tables appartenant aux agents dans les bases de données par agent.
   - Créer la base de données d’agent à la demande via le registre de base de données global. Terminé.
   - Déplacer les entrées de session d’exécution, les événements de transcription, les lignes VFS et les artefacts d’outils vers les bases de données d’agent. Terminé.
   - Ne pas migrer les entrées de session, événements de transcription, lignes VFS ou artefacts d’outils de base de données partagée locale à une branche ; cette disposition n’a jamais été publiée. Conserver uniquement l’import hérité fichier-vers-base de données dans doctor.

4. Remplacer les API de magasin de sessions.
   - Supprimer `storePath` comme identité d’exécution. Terminé pour l’exécution et protégé par `check:database-first-legacy-stores` : les métadonnées de session, mises à jour de routes, persistance de commandes, nettoyage des sessions CLI, aperçus de raisonnement Feishu, persistance d’état de transcription, profondeur de sous-agent, remplacements de session de profil d’authentification, logique parent-fork et inspection QA-lab résolvent maintenant la base de données à partir des clés canoniques agent/session.
     Les réponses de liste de sessions Gateway/TUI/UI/macOS exposent maintenant `databasePath` au lieu de l’ancien `path` ; les surfaces de débogage macOS affichent la base de données par agent comme état en lecture seule au lieu d’écrire la configuration `session.store`.
     `/status`, l’export de trajectoire piloté par le chat et les proxys de dépendances CLI ne propagent plus les anciens chemins de magasin ; la reprise d’utilisation de transcription lit SQLite par identité agent/session. Les tests d’exécution et de pont n’exposent plus `storePath` ; les entrées doctor/migration possèdent ce nom de champ hérité.
     Le chargement combiné de sessions Gateway n’a plus de branche d’exécution spéciale pour les valeurs `session.store` non gabaritées ; il agrège les lignes SQLite par agent.
     La voie doctor de verrou de session hérité et son helper de nettoyage `.jsonl.lock` ont été supprimés ; SQLite est maintenant la frontière de concurrence des sessions.
     Les sites d’appel d’exécution chauds utilisent des noms de helpers orientés ligne comme `resolveSessionRowEntry` ; l’ancien alias de compatibilité `resolveSessionStoreEntry` a été supprimé de l’exécution et des exports du SDK de Plugin.

- Utiliser des opérations de ligne `{ agentId, sessionKey }`.
  Terminé : `getSessionEntry`, `upsertSessionEntry`, `deleteSessionEntry`, `patchSessionEntry` et `listSessionEntries` sont des API SQLite-first qui ne nécessitent pas de chemin de magasin de sessions. Le résumé d’état, l’état de l’agent local, la santé et la commande de liste `openclaw sessions` lisent maintenant directement les lignes par agent et affichent les chemins de base de données SQLite par agent au lieu des chemins `sessions.json`.
- Remplacer la suppression/insertion de magasin entier par `upsertSessionEntry`, `deleteSessionEntry`, `listSessionEntries` et des requêtes de nettoyage SQL.
  Terminé pour l’exécution : les chemins chauds utilisent maintenant les API de lignes et des correctifs de ligne avec nouvelle tentative en cas de conflit ; les helpers restants d’import/remplacement de magasin entier sont limités au code d’import de migration et aux tests du backend SQLite.
  - Supprimer `store-writer.ts` et les tests de file de rédacteur. Terminé.
  - Supprimer l’élagage de clés héritées d’exécution et les paramètres de suppression d’alias des upserts/patches de lignes de session. Terminé.

5. Supprimer le comportement de registre JSON d’exécution.
   - Rendre les lectures et écritures du registre de sandbox SQLite uniquement. Terminé.
   - Importer le JSON monolithique et partitionné uniquement depuis l’étape de migration. Terminé.
   - Supprimer les verrous de registre partitionné et les écritures JSON. Terminé.

- Conserver une table de registre typée au lieu de stocker les lignes de registre comme JSON opaque générique si la forme reste un état opérationnel de chemin chaud. Terminé.

6. Supprimer la mutation de session en forme de verrou de fichier.
   - Terminé pour la création de verrou d’exécution et les API de verrou d’exécution.
   - La voie doctor autonome de nettoyage `.jsonl.lock` héritée est supprimée.
   - `session.writeLock` est une configuration héritée migrée par doctor, pas un paramètre d’exécution typé.
   - L’intégrité d’état n’a plus de chemin séparé d’élagage de fichiers de transcription orphelins ; la migration doctor importe/supprime les sources JSONL héritées en un seul endroit.
   - La coordination du singleton Gateway utilise des lignes SQLite typées `state_leases` sous `gateway_locks` et n’expose plus de surface de répertoire de verrouillage de fichier.
   - La persistance de déduplication générique du SDK de Plugin n’utilise plus de verrous de fichiers ni de fichiers JSON ; elle écrit des lignes SQLite partagées d’état de Plugin. Terminé.
   - La coordination d’intégration QMD utilise un bail d’état SQLite au lieu de `qmd/embed.lock`. Terminé.

7. Rendre les workers conscients de la base de données.
   - Les workers ouvrent leurs propres connexions SQLite.
   - Le parent possède la livraison, les callbacks de canal et la configuration.
   - Le worker reçoit l’identifiant d’agent, l’identifiant d’exécution, le mode de système de fichiers et l’identité du registre de bases de données, pas des handles actifs.
   - `vfs-only` reste expérimental et utilise la base de données de l’agent comme racine de stockage.
   - Conserver d’abord un worker par exécution active. Le pooling peut attendre que la durée de vie des connexions de base de données et le comportement d’annulation soient ordinaires.

8. Intégration de la sauvegarde.
   - Apprendre à la sauvegarde à capturer les bases de données globales et d’agent via la sauvegarde SQLite ou
     `VACUUM INTO`. Fait pour les fichiers `*.sqlite` découverts sous l’actif d’état.
   - Ajouter une vérification de sauvegarde pour l’intégrité SQLite et la version du schéma. Fait pour
     les contrôles d’intégrité de création de sauvegarde et de vérification de l’archive par défaut.
   - Enregistrer les métadonnées d’exécution de sauvegarde dans SQLite. Fait via la table partagée `backup_runs`
     avec le chemin de l’archive, l’état et le JSON du manifeste.
   - Ajouter la restauration depuis des instantanés d’archive vérifiés. Fait : `openclaw backup
restore` valide avant l’extraction, utilise le manifeste normalisé du vérificateur,
     prend en charge `--dry-run`, et exige `--yes` avant de remplacer
     les chemins source enregistrés.
   - Inclure l’export VFS/espace de travail uniquement sur demande ; ne pas exporter les éléments internes de session
     en JSON ou JSONL.

9. Supprimer les tests et le code obsolètes. Fait pour les surfaces de session d’exécution connues.

- Supprimer les tests qui vérifient la création à l’exécution de `sessions.json` ou de fichiers JSONL
  de transcription. Fait pour le magasin de sessions du noyau, le chat, les événements de transcription du Gateway,
  l’aperçu, le cycle de vie, les mises à jour d’entrées de session de commande, la réinitialisation/trace de réponse automatique, et
  les fixtures de dreaming memory-core, le routage de cible d’approbation, la réparation de transcription
  de session, la réparation des autorisations de sécurité, l’export de trajectoire et l’export de session.
  Les tests de transcription active-memory vérifient désormais les portées SQLite et l’absence de création de fichiers JSONL
  temporaires ou persistants.
  L’ancienne régression de nettoyage de transcription heartbeat a été supprimée parce que
  l’exécution ne tronque plus les transcriptions JSONL.
  Les tests de l’outil de liste de sessions d’agent ne modélisent plus les anciens chemins `sessions.json`
  comme forme de réponse du Gateway ; les tests app/UI/macOS utilisent `databasePath`.
  Les tests d’utilisation de transcription `/status` alimentent désormais directement des lignes de transcription SQLite
  au lieu d’écrire des fichiers JSONL.
  Les tests de cycle de vie de session du Gateway utilisent désormais directement des helpers
  d’amorçage de transcription SQLite ; l’ancienne forme de fixture de fichier de session à ligne unique a disparu de la couverture
  de réinitialisation et de suppression.
  `sessions.delete` ne renvoie plus de champ d’époque fichier `archived: []` ; la suppression
  ne rapporte que le résultat de mutation de ligne. L’ancienne option `deleteTranscript` a
  également disparu : supprimer une session supprime la racine canonique `sessions` et laisse
  SQLite propager en cascade les lignes de transcription, d’instantané et de trajectoire détenues par la session, de sorte qu’aucun
  appelant ne puisse laisser de transcriptions orphelines ou oublier une branche de nettoyage.
  Les tests de capture de trajectoire context-engine lisent désormais les lignes `trajectory_runtime_events`
  depuis une base de données d’agent isolée au lieu de lire
  `session.trajectory.jsonl`.
  Les scripts d’amorçage de canal Docker MCP alimentent désormais directement des lignes SQLite. Les écritures directes
  de `sessions.json` sont limitées aux fixtures de doctor.
  L’E2E Tool Search Gateway lit les preuves d’appels d’outils depuis les lignes de transcription SQLite
  au lieu de scanner les fichiers `agents/<agentId>/sessions/*.jsonl`.
  Les événements hôtes memory-core et les lignes temporaires de corpus de session résident désormais dans l’état Plugin
  SQLite partagé ; `events.jsonl` et `session-corpus/*.txt` sont seulement des entrées de migration
  doctor héritées. Les lignes actives utilisent des chemins virtuels `memory/session-ingestion/`,
  pas `.dreams/session-corpus`. L’ancien module de réparation dreaming memory-core
  et ses tests CLI/Gateway ont été supprimés, car l’exécution ne
  possède plus la réparation d’archives de fichiers pour ce corpus. Les tests memory-core
  bridge/artifact public n’exposent plus `.dreams/events.jsonl` ; ils
  utilisent le nom d’artifact JSON virtuel adossé à SQLite.
  Les documents de test SDK public/Codex indiquent désormais l’état de session SQLite au lieu des fichiers de session,
  et l’exemple channel-turn n’expose plus d’argument `storePath`.
  L’état de synchronisation Matrix utilise désormais directement le magasin d’état Plugin SQLite. Les contrats actifs
  client/exécution transmettent une racine de stockage de compte, pas un chemin `bot-storage.json`,
  et doctor importe l’ancien `bot-storage.json` dans SQLite avant de supprimer
  la source. Les scénarios QA Matrix de redémarrage/destructifs modifient désormais directement la ligne de synchronisation SQLite
  au lieu de créer ou supprimer de faux fichiers `bot-storage.json`, et
  le substrat E2EE transmet une racine sync-store au lieu d’un faux chemin
  `sync-store.json`.
  La sélection de racine de stockage Matrix ne note plus les racines selon des fichiers JSON de synchronisation/fil hérités
  ; elle utilise des métadonnées de racine durables plus l’état crypto réel.
  La suite de tests du backend de session SQLite d’exécution ne fabrique plus de
  `sessions.json` ; les fixtures de sources héritées vivent désormais dans les tests doctor
  qui les importent.
  Les tests de session Gateway n’exposent plus de helper `createSessionStoreDir` ni
  de configuration inutilisée de chemin temporaire de magasin de sessions ; les répertoires de fixtures sont explicites, et la configuration directe
  des lignes utilise le nommage de lignes de session SQLite.
  La couverture du parseur de magasin de sessions JSON5 propre à doctor est sortie des tests infra et
  a été déplacée vers les tests de migration doctor, de sorte que les suites de tests d’exécution ne possèdent plus l’analyse
  des fichiers de session hérités.
  Les tests SSO/téléversement en attente d’exécution Microsoft Teams ne transportent plus de fixtures sidecar JSON
  ni de parseurs ; l’analyse des jetons SSO hérités vit seulement dans le module de migration
  du Plugin. Les tests Telegram n’alimentent plus de faux chemins de magasin `/tmp/*.json`
  ; ils réinitialisent directement le cache de messages adossé à SQLite. Le helper générique
  d’état de test OpenClaw n’expose plus de writer hérité `auth-profiles.json`
  ; les tests de migration auth doctor possèdent cette fixture localement.
  Les tests d’exécution pour les pointeurs de dernière session TUI, les approbations exec, les bascules active-memory,
  la déduplication/vérification de démarrage Matrix, la synchronisation de source Memory Wiki,
  les liaisons de conversation actuelle, l’authentification d’onboarding et les imports de secrets Hermes ne
  fabriquent plus d’anciens fichiers sidecar ni ne vérifient l’absence d’anciens noms de fichiers. Ils
  prouvent le comportement via des lignes SQLite et des API de magasin publiques ; les tests doctor/migration
  sont le seul endroit où les noms de fichiers source hérités doivent exister.
  Les tests d’exécution pour l’appairage appareil/nœud, channel allowFrom, les intentions de redémarrage,
  le handoff de redémarrage, les entrées de file de livraison de session, la santé de configuration, les caches iMessage,
  les tâches cron, les en-têtes de transcription PI, les registres de sous-agents et les pièces jointes d’images gérées
  ne créent également plus de fichiers JSON/JSONL retirés uniquement pour prouver
  qu’ils sont ignorés ou absents.
  La récupération de dépassement PI n’a plus de fallback de réécriture/troncature
  SessionManager : la troncature des résultats d’outils et les réécritures de transcription context-engine modifient
  les lignes de transcription SQLite, puis actualisent l’état de prompt actif depuis la base de données.
  Les ajouts de messages SessionManager persistés délèguent au helper d’ajout atomique de transcription SQLite
  pour la sélection du parent et l’idempotence. Les ajouts normaux
  de métadonnées/entrées personnalisées sélectionnent aussi le parent courant dans SQLite, de sorte que
  les instances de gestionnaire obsolètes ne ressuscitent pas les courses de chaînes parentes pré-SQLite.
  Le nettoyage de fin PI synthétique pour les précontrôles de milieu de tour et `sessions_yield` coupe désormais
  directement l’état de transcription SQLite ; l’ancien pont de suppression de fin SessionManager
  et ses tests sont supprimés.
  La capture de point de contrôle Compaction prend également des instantanés depuis SQLite uniquement ; les appelants ne
  transmettent plus de SessionManager actif comme source de transcription alternative.
- Conserver les tests qui alimentent des fichiers hérités uniquement pour la migration.
- La preuve par fichier JSON a été remplacée par une preuve par lignes SQL pour les surfaces
  d’exécution actives.

- Ajouter des interdictions statiques pour les écritures d’exécution vers les chemins JSON de session/cache hérités.
  Fait pour la garde du dépôt.

10. Rendre le rapport de migration auditable.
    - Enregistrer les exécutions de migration dans SQLite avec les horodatages de début/fin, les chemins source,
      les hachages source, les décomptes, les avertissements et le chemin de sauvegarde.
      Fait : les exécutions de migration d’état hérité persistent désormais un rapport `migration_runs`
      avec l’inventaire des chemins/tables source, le SHA-256 des fichiers source, les tailles,
      les décomptes d’enregistrements, les avertissements et le chemin de sauvegarde.
      Fait : les exécutions de migration d’état hérité persistent aussi des lignes `migration_sources`
      pour l’audit au niveau source et les décisions futures de saut/remplissage.
    - Rendre l’application idempotente. Une nouvelle exécution après une importation partielle doit soit
      ignorer une source déjà importée, soit fusionner par clé stable.
      Fait : les index de sessions, les transcriptions, les files de livraison, l’état Plugin, les registres
      de tâches et les lignes SQLite globales détenues par les agents importent via des clés stables ou
      des sémantiques upsert/replace, de sorte que les réexécutions fusionnent sans dupliquer les lignes
      durables.
    - Les importations échouées doivent conserver le fichier source original en place.
      Fait : les importations de transcription échouées laissent désormais la source JSONL originale à
      son chemin détecté, et `migration_sources` enregistre la source comme
      `warning` avec `removed_source=0` pour la prochaine exécution doctor.

## Règles de performance

- Une connexion par thread/processus convient ; ne partagez pas les handles entre
  workers.
- Utiliser WAL, `foreign_keys=ON`, un délai d’attente occupé de 30 s et de courtes transactions d’écriture `BEGIN IMMEDIATE`.
- Garder les helpers de transaction d’écriture synchrones sauf/jusqu’à ce qu’une API de transaction asynchrone
  ajoute des sémantiques explicites de mutex/backpressure.
- Garder les écritures de livraison parentes petites et transactionnelles.
- Éviter les réécritures de magasin entier ; utiliser upsert/delete au niveau ligne.
- Ajouter des index pour les chemins list-by-agent, list-by-session, updated-at, run id et
  expiration avant de déplacer du code chaud.
- Stocker les grands artifacts, médias et vecteurs sous forme de BLOB ou de lignes BLOB découpées, pas
  en JSON base64 ou tableau numérique.
- Garder les entrées d’état Plugin opaques petites et limitées à leur portée.
- Ajouter un nettoyage SQL pour TTL/expiration au lieu de l’élagage du système de fichiers.
  Fait pour les magasins d’exécution détenus par la base de données : les médias, l’état Plugin, les blobs Plugin,
  la déduplication persistante et le cache d’agent expirent tous via des lignes SQLite. Le nettoyage restant
  du système de fichiers se limite aux matérialisations temporaires ou aux commandes
  de suppression explicites.

## Interdictions statiques

Ajouter une vérification de dépôt qui échoue les nouvelles écritures d’exécution vers les chemins d’état hérités :

- `sessions.json`
- `*.trajectory.jsonl` sauf les sorties matérialisées de support-bundle
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
- `credentials*.json` Matrix et `recovery-key.json`
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
- Memory-core `.dreams/events.jsonl`
- Memory-core `.dreams/session-corpus/`
- Memory-core `.dreams/daily-ingestion.json`
- Memory-core `.dreams/session-ingestion.json`
- Memory-core `.dreams/short-term-recall.json`
- Memory-core `.dreams/phase-signals.json`
- Memory-core `.dreams/short-term-promotion.lock`
- Skill Workshop `skill-workshop/<workspace>.json`
- Skill Workshop `skill-workshop/skill-workshop-review-*.json`
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
- fichiers JSON de fragments de registre sandbox
- fichiers JSON de pont `/tmp` de relais de hook natif
- `plugin-state/state.sqlite`
- sidecars d’exécution ad hoc `openclaw-state.sqlite`
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
- Memory Wiki `.openclaw-wiki/log.jsonl`
- Memory Wiki `.openclaw-wiki/state.json`
- Memory Wiki `.openclaw-wiki/locks/`
- Memory Wiki `.openclaw-wiki/source-sync.json`
- Memory Wiki `.openclaw-wiki/import-runs/*.json`
- Memory Wiki `.openclaw-wiki/cache/agent-digest.json`
- Memory Wiki `.openclaw-wiki/cache/claims.jsonl`
- ClawHub `.clawhub/lock.json`
- ClawHub `.clawhub/origin.json`
- décoration de profil de navigateur `.openclaw-profile-decorated`
- ouvreurs de session adossés à des fichiers `SessionManager.open(...)`
- façades de listage de transcriptions `SessionManager.listAll(...)` et `TranscriptSessionManager.listAll(...)`
- façades de fork de transcription `SessionManager.forkFromSession(...)` et
  `TranscriptSessionManager.forkFromSession(...)`
- façades de remplacement de session mutable `SessionManager.newSession(...)` et `TranscriptSessionManager.newSession(...)`
- façades de session de branche `SessionManager.createBranchedSession(...)` et
  `TranscriptSessionManager.createBranchedSession(...)`

L’interdiction doit permettre aux tests de créer des fixtures héritées et permettre au code de migration de
lire/importer/supprimer les sources de fichiers héritées. Les sidecars SQLite non publiés restent interdits
et ne bénéficient pas d’autorisations d’import par doctor.

## Critères d’achèvement

- Les écritures de données d’exécution et de cache vont dans la base de données SQLite globale ou de l’agent.
- L’exécution n’écrit plus d’index de session, de JSONL de transcription, de JSON de registre sandbox,
  de SQLite sidecar de tâche ni de SQLite sidecar plugin-state. Les importeurs SQLite sidecar
  de tâche et plugin-state non publiés sont supprimés.
- L’import de fichiers hérités est réservé à doctor.
- La sauvegarde produit une archive unique avec des instantanés SQLite compacts et une preuve d’intégrité.
- Les workers d’agent peuvent s’exécuter avec un stockage disque, un scratch VFS ou un stockage expérimental VFS uniquement.
- Les fichiers de configuration et de credentials explicites restent les seuls fichiers de contrôle persistants
  hors base de données attendus.
- Les vérifications du dépôt empêchent de réintroduire des stockages de fichiers d’exécution hérités.
