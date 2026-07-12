---
read_when:
    - Exécution ou correction des tests
summary: Comment exécuter les tests localement (vitest) et quand utiliser les modes de forçage et de couverture
title: Tests
x-i18n:
    generated_at: "2026-07-12T03:05:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 63806ea72da1579f4aa0b92c14a6d2d3e67990d6c10cb6d9b1b2bb4a63c8e140
    source_path: reference/test.md
    workflow: 16
---

- Kit de test complet (suites, tests en conditions réelles, Docker) : [Tests](/fr/help/testing)
- Validation des mises à jour et des paquets de plugins : [Tester les mises à jour et les plugins](/fr/help/testing-updates-plugins)

## Comportement par défaut de l’agent

Les sessions d’agent exécutent les tests et les validations nécessitant beaucoup de calcul à distance
via Crabbox. Le code approuvé des responsables utilise par défaut Blacksmith Testbox. Le
workflow Testbox configuré charge les identifiants ; le code non approuvé provenant d’un contributeur ou
d’un fork doit donc utiliser la CI du fork sans secret ou un Crabbox AWS direct assaini.

Lorsqu’une tâche portant sur du code approuvé est susceptible de nécessiter des tests ou des preuves approfondies, préchauffez
immédiatement l’environnement dans une session de commande en arrière-plan, poursuivez le travail pendant son chargement,
réutilisez l’identifiant `tbx_...` renvoyé, synchronisez la copie de travail actuelle à chaque exécution et
arrêtez-le avant le transfert :

```bash
node scripts/crabbox-wrapper.mjs warmup --provider blacksmith-testbox --keep --timing-json
```

Après la première réutilisation réussie, le wrapper enregistre la base du bail,
les dépendances et l’empreinte du workflow Testbox sous `.crabbox/testbox-leases/`.
Les modifications portant uniquement sur le code source continuent de réutiliser l’environnement préchauffé. Toute modification de la base de fusion, du fichier de verrouillage,
des paramètres du gestionnaire de paquets, du wrapper ou du workflow Testbox provoque un arrêt sécurisé et exige un
nouveau bail. Chaque exécution synchronise néanmoins la copie de travail actuelle.
`OPENCLAW_TESTBOX_ALLOW_STALE=1` est réservé aux diagnostics intentionnels, et non
aux preuves de publication.

Les commandes de test locales ci-dessous sont destinées aux workflows humains ou à un recours explicite de l’agent
demandé par l’utilisateur. L’indisponibilité du fournisseur distant doit être signalée ; elle
n’autorise pas l’exécution silencieuse d’une vérification locale étendue.

Pour le code non approuvé, préchauffez avec `--provider aws`. Chaque exécution doit définir
`CRABBOX_ENV_ALLOW=CI`, transmettre `--provider aws --no-hydrate` et utiliser
un `HOME` distant temporaire neuf avant d’installer les dépendances ou d’exécuter
les tests. Utilisez un bail nouvellement préchauffé et réservé à cette source non approuvée ; ne réutilisez
jamais un bail approuvé ou précédemment chargé avec des identifiants. Lancez un binaire Crabbox approuvé
installé depuis une copie de travail propre et approuvée de `main`, puis récupérez uniquement la PR distante avec
`--fresh-pr` ; n’exécutez jamais localement le wrapper ou la configuration de la copie de travail non approuvée.
Supprimez `CRABBOX_AWS_INSTANCE_PROFILE` et arrêtez l’opération de manière sécurisée sauf si la valeur résolue de
`aws.instanceProfile` est vide. Avant toute installation ou tout test, utilisez des outils approuvés
appelés par leur chemin absolu pour exiger un jeton IMDSv2, démontrer que le point de terminaison des identifiants IAM
renvoie 404 et vérifier que la sortie distante de `git rev-parse HEAD` correspond au SHA complet
de la tête de PR examinée. Liez le bail à ce SHA, puis arrêtez et préchauffez de nouveau l’environnement lorsque la tête
change. Téléversez le script approuvé `scripts/crabbox-untrusted-bootstrap.sh` depuis une branche
`main` propre avec `--fresh-pr` ; il installe les versions épinglées de Node et pnpm, vérifie le SHA
et la version épinglée du gestionnaire de paquets, isole `HOME`, installe les dépendances, puis exécute
le test demandé. Si le courtier ne peut pas prouver l’absence de rôle ou si aucune PR distante n’existe,
utilisez la CI du fork sans secret. N’utilisez pas `hydrate-github`, `--no-sync` ni un
workflow Testbox chargé avec des identifiants.
Supprimez toutes les substitutions `CRABBOX_TAILSCALE*`, imposez `--network public
--tailscale=false`, effacez les indicateurs de nœud de sortie et de réseau local, puis exigez que `crabbox inspect`
indique un réseau public sans état Tailscale avant de téléverser un quelconque script.

## Ordre habituel en local

1. `pnpm test:changed` pour valider avec Vitest le périmètre modifié.
2. `pnpm test <path-or-filter>` pour un fichier, un répertoire ou une cible explicite.
3. `pnpm test` uniquement lorsque vous avez intentionnellement besoin de la suite Vitest locale complète.

Dans une copie de travail Codex ou une copie liée/partielle, les agents évitent les commandes locales directes
`pnpm test*` / `pnpm check*` / `pnpm crabbox:run` :

- Recours local explicitement demandé par l’utilisateur pour un petit fichier :
  `node scripts/run-vitest.mjs <path-or-filter>`.
- Vérifications des modifications ou preuves étendues : `node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox ... -- env OPENCLAW_CHECK_CHANGED_REMOTE_CHILD=1 OPENCLAW_CHANGED_LANES_RAW_SYNC=1 corepack pnpm check:changed` afin que pnpm s’exécute dans Testbox.
- Les valeurs finales `exitCode` et JSON de durée du wrapper constituent le résultat de la commande. Une exécution déléguée de Blacksmith GitHub Actions peut apparaître comme `cancelled` après la réussite d’une commande SSH, car Testbox est arrêté depuis l’extérieur de l’action de maintien en activité ; consultez le résumé du wrapper et la sortie de la commande avant de considérer cela comme un échec.
- `OPENCLAW_HEAVY_CHECK_LOCK_SCOPE=worktree <local-heavy-check command>` : limite la sérialisation des vérifications lourdes à la copie de travail actuelle plutôt qu’au répertoire Git commun pour des commandes telles que `pnpm check:changed` et `pnpm test ...` ciblé. Utilisez-le uniquement sur des hôtes locaux à haute capacité lorsque vous exécutez intentionnellement des vérifications indépendantes dans plusieurs copies de travail liées.

## Commandes principales

Les exécutions du wrapper de test se terminent par un bref résumé `[test] passed|failed|skipped ... in ...` ; la ligne de durée propre à Vitest reste le détail par partition.

| Commande                                          | Fonction                                                                                                                                                                                                                                                                                                                                              |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm test`                                       | Les cibles explicites de fichiers ou répertoires sont acheminées vers les voies Vitest correspondantes. Les exécutions sans cible valident la suite complète : les groupes de partitions fixes sont développés en configurations terminales pour une exécution locale parallèle, et la répartition attendue des partitions est affichée avant le démarrage. Le groupe d’extensions est toujours développé en configurations de partition par extension plutôt qu’en un unique processus géant pour le projet racine. |
| `pnpm test:changed`                               | Exécution rapide et intelligente des tests liés aux modifications : cibles précises issues des modifications directes de tests, fichiers voisins `*.test.ts`, associations explicites avec le code source et graphe local des imports. Les modifications étendues de configuration ou de paquets sont ignorées, sauf si elles correspondent à des tests précis. |
| `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` | Exécution étendue explicite des tests liés aux modifications ; utilisez-la lorsqu’une modification du banc de test, de la configuration ou d’un paquet doit revenir au comportement étendu de Vitest pour les tests liés aux modifications. |
| `pnpm test:force`                                 | Libère le port Gateway OpenClaw configuré (`18789` par défaut), puis exécute la suite complète avec un port Gateway isolé afin que les tests de serveur n’entrent pas en conflit avec une instance en cours d’exécution. |
| `pnpm test:coverage`                              | Produit un rapport informatif de couverture V8 pour la voie d’unités par défaut (`vitest.unit.config.ts`) ; aucun seuil de couverture n’est imposé. |
| `pnpm test:coverage:changed`                      | Couverture des tests unitaires uniquement pour les fichiers modifiés depuis `origin/main`. |
| `pnpm changed:lanes`                              | Affiche les voies architecturales déclenchées par les différences par rapport à `origin/main`. |
| `pnpm check:changed`                              | Délègue par défaut à Crabbox/Testbox hors CI, puis exécute dans l’environnement distant enfant la vérification intelligente des modifications : formatage, vérification des types, analyse statique et commandes de contrôle pour les voies concernées. N’exécute pas Vitest ; utilisez `pnpm test:changed` ou `pnpm test <target>` pour valider les tests. |

## État de test partagé et utilitaires de processus

- `src/test-utils/openclaw-test-state.ts` : utilisez-le depuis Vitest lorsqu’un test nécessite un `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, un jeu de données de configuration, un espace de travail, un répertoire d’agent ou un magasin de profils d’authentification isolé.
- `pnpm test:env-mutations:report` : rapport non bloquant des tests et bancs de test qui modifient directement `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, `OPENCLAW_WORKSPACE_DIR` ou des clés d’environnement associées. Utilisez-le pour trouver les candidats à migrer vers l’utilitaire partagé d’état de test.
- `test/helpers/openclaw-test-instance.ts` : tests E2E au niveau du processus nécessitant un Gateway actif, l’environnement de la CLI, la capture des journaux et le nettoyage au même endroit.
- Les voies E2E Docker/Bash qui chargent `scripts/lib/docker-e2e-image.sh` peuvent transmettre `docker_e2e_test_state_shell_b64 <label> <scenario>` au conteneur et le décoder avec `scripts/lib/openclaw-e2e-instance.sh` ; les scripts utilisant plusieurs répertoires personnels peuvent transmettre `docker_e2e_test_state_function_b64` et appeler `openclaw_test_state_create <label> <scenario>` dans chaque flux. `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` écrit un fichier d’environnement hôte pouvant être chargé dans le shell (le `--` précédant `create` empêche les versions récentes de Node d’interpréter `--env-file` comme un indicateur Node). Les voies qui lancent un Gateway peuvent charger `scripts/lib/openclaw-e2e-instance.sh` pour la résolution du point d’entrée, le démarrage simulé d’OpenAI, le lancement au premier plan ou en arrière-plan, les sondes de disponibilité, l’exportation des variables d’environnement d’état, l’affichage des journaux et le nettoyage des processus.

## Voies de Control UI, de la TUI et des extensions

- **E2E simulé de l’interface de contrôle :** `pnpm test:ui:e2e` exécute la voie Vitest + Playwright qui démarre l’interface de contrôle Vite et pilote une véritable page Chromium face à un WebSocket de Gateway simulé. Les tests se trouvent dans `ui/src/**/*.e2e.test.ts` ; les simulations et contrôles partagés se trouvent dans `ui/src/test-helpers/control-ui-e2e.ts`. `pnpm test:e2e` inclut cette voie. Les exécutions par agent utilisent Testbox/Crabbox par défaut, y compris pour les validations ciblées ; utilisez `node scripts/run-vitest.mjs run --config test/vitest/vitest.ui-e2e.config.ts --configLoader runner ui/src/ui/e2e/chat-flow.e2e.test.ts` uniquement comme solution de repli locale explicite.
- **Tests PTY de la TUI :** `node scripts/run-vitest.mjs run --config test/vitest/vitest.tui-pty.config.ts` exécute la voie PTY rapide avec faux backend. `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1` ou `pnpm tui:pty:test:watch --mode local` exécute le test de fumée `tui --local`, plus lent, qui simule uniquement le point de terminaison externe du modèle. Vérifiez du texte visible stable ou les appels aux fixtures, et non des instantanés ANSI bruts.
- `pnpm test:extensions` et `pnpm test extensions` exécutent tous les fragments d’extensions/Plugins. Les Plugins de canal lourds, le Plugin de navigateur et OpenAI s’exécutent dans des fragments dédiés ; les autres groupes de Plugins restent regroupés. `pnpm test extensions/<id>` exécute la voie d’un seul Plugin intégré.
- Les fichiers sources possédant des tests voisins sont associés à ceux-ci avant le recours à des motifs glob plus larges sur les répertoires. Les modifications d’utilitaires sous `src/channels/plugins/contracts/test-helpers`, `src/plugin-sdk/test-helpers` et `src/plugins/contracts` utilisent un graphe d’importation local afin d’exécuter les tests importateurs plutôt que tous les fragments de manière étendue lorsque le chemin de dépendance est précis.
- Les cibles de répertoires de contrats se répartissent entre leurs voies de contrats : `pnpm test src/channels/plugins/contracts` exécute les quatre configurations de contrats de canal et `pnpm test src/plugins/contracts` exécute la configuration des contrats de Plugins, car les projets génériques `channels`/`plugins` excluent `contracts/**`.
- `auto-reply` est divisé en trois configurations dédiées (`core`, `top-level`, `reply`) afin que le banc d’essai des réponses ne domine pas les tests plus légers de statut, de jeton et d’utilitaires de niveau supérieur.
- Certains fichiers de test `plugin-sdk` et `commands` sont orientés vers des voies légères dédiées qui ne conservent que `test/setup.ts`, tandis que les cas nécessitant beaucoup de ressources d’exécution restent dans leurs voies existantes.
- La configuration Vitest de base utilise par défaut `pool: "threads"` et `isolate: false`, avec l’exécuteur partagé non isolé activé dans toutes les configurations du dépôt.
- `pnpm test:channels` exécute `vitest.channels.config.ts`.

## Gateway et E2E

- L’intégration du Gateway est facultative : `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` ou `pnpm test:gateway`.
- `pnpm test:e2e` : agrégat E2E du dépôt = `pnpm test:e2e:gateway && pnpm test:ui:e2e`.
- `pnpm test:e2e:gateway` : tests de fumée de bout en bout du Gateway (association WS/HTTP/Node multi-instance). Utilise par défaut `threads` + `isolate: false` avec des processus de travail adaptatifs dans `vitest.e2e.config.ts` ; ajustez-les avec `OPENCLAW_E2E_WORKERS=<n>` et activez les journaux détaillés avec `OPENCLAW_E2E_VERBOSE=1`.
- `pnpm test:live` : tests réels des fournisseurs (Claude/Minimax/DeepSeek/z.ai/etc., conditionnés par `*.live.test.ts`). Nécessite des clés d’API et `LIVE=1` (ou `OPENCLAW_LIVE_TEST=1`) pour ne plus être ignorés ; activez la sortie détaillée avec `OPENCLAW_LIVE_TEST_QUIET=0`.

## Suite Docker complète (`pnpm test:docker:all`)

Construit l’image de tests réels partagée, empaquette une seule fois OpenClaw sous forme d’archive npm, construit ou réutilise une image d’exécution Node/Git minimale ainsi qu’une image fonctionnelle qui installe cette archive dans `/app`, puis exécute les voies de tests de fumée Docker au moyen d’un ordonnanceur pondéré. `scripts/package-openclaw-for-docker.mjs` est l’unique outil d’empaquetage local/CI et valide l’archive ainsi que `dist/postinstall-inventory.json` avant leur utilisation par Docker.

- Image minimale (`OPENCLAW_DOCKER_E2E_BARE_IMAGE`) : voies d’installation, de mise à jour et de dépendances de Plugins ; monte l’archive préconstruite au lieu de sources du dépôt copiées.
- Image fonctionnelle (`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`) : voies fonctionnelles normales de l’application construite.
- Définitions des voies : `scripts/lib/docker-e2e-scenarios.mjs`. Planificateur : `scripts/lib/docker-e2e-plan.mjs`. Exécuteur : `scripts/test-docker-all.mjs`.
- `node scripts/test-docker-all.mjs --plan-json` produit le plan CI géré par l’ordonnanceur (voies, types d’images, besoins en paquet/image de tests réels, scénarios d’état, vérifications des identifiants) sans construire ni exécuter Docker.

Paramètres d’ordonnancement (variables d’environnement, valeurs par défaut entre parenthèses) :

| Variable d’environnement                                                                                         | Valeur par défaut   | Objectif                                                                                                                                                                                                                                                                                                                                                                       |
| --------------------------------------------------------------------------------------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`                                                                               | 10                  | Emplacements de processus.                                                                                                                                                                                                                                                                                                                                                      |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM`                                                                          | 10                  | Groupe final sensible aux fournisseurs.                                                                                                                                                                                                                                                                                                                                         |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`                                                                                | 9                   | Limite des voies lourdes de fournisseurs réels.                                                                                                                                                                                                                                                                                                                                 |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`                                                                                 | 5                   | Limite des voies utilisant des ressources npm.                                                                                                                                                                                                                                                                                                                                  |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`                                                                             | 7                   | Limite des voies utilisant des ressources de service.                                                                                                                                                                                                                                                                                                                           |
| `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT` / `_CODEX_LIMIT` / `_GEMINI_LIMIT` / `_DROID_LIMIT` / `_OPENCODE_LIMIT` | 4                   | Limites des voies lourdes par fournisseur.                                                                                                                                                                                                                                                                                                                                      |
| `OPENCLAW_DOCKER_ALL_LIVE_OPENAI_LIMIT` / `_TELEGRAM_LIMIT`                                                     | 1                   | Limites plus strictes par fournisseur.                                                                                                                                                                                                                                                                                                                                          |
| `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` / `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT`                                         | -                   | Remplacement pour les hôtes plus puissants.                                                                                                                                                                                                                                                                                                                                     |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS`                                                                          | 2000                | Délai entre les démarrages de voies, afin d’éviter les rafales de créations par le démon Docker local.                                                                                                                                                                                                                                                                           |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`                                                                           | 7,200,000 (120 min) | Délai d’expiration de repli par voie ; certaines voies réelles/finales utilisent des limites plus strictes.                                                                                                                                                                                                                                                                      |
| `OPENCLAW_DOCKER_ALL_LIVE_RETRIES`                                                                              | 1                   | Nouvelles tentatives en cas d’échecs transitoires de fournisseurs réels.                                                                                                                                                                                                                                                                                                        |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`                                                                                   | désactivé           | Affiche le manifeste des voies sans exécuter Docker.                                                                                                                                                                                                                                                                                                                             |
| `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS`                                                                        | 30000               | Intervalle d’affichage de l’état des voies actives.                                                                                                                                                                                                                                                                                                                              |
| `OPENCLAW_DOCKER_ALL_TIMINGS`                                                                                   | activé              | Réutilise `.artifacts/docker-tests/lane-timings.json` pour ordonner les voies de la plus longue à la plus courte ; définissez la valeur sur `0` pour désactiver cette fonction.                                                                                                                                                                                                   |
| `OPENCLAW_DOCKER_ALL_LIVE_MODE`                                                                                 | -                   | `skip` pour les voies déterministes/locales uniquement, `only` pour les voies de fournisseurs réels uniquement. Alias : `pnpm test:docker:local:all`, `pnpm test:docker:live:all`. Le mode réel uniquement fusionne les voies réelles principales et finales en un seul groupe ordonné de la plus longue à la plus courte, afin que les catégories de fournisseurs regroupent les tâches Claude/Codex/Gemini. |
| `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS`                                                               | 180                 | Délai d’expiration de la configuration Docker du backend CLI.                                                                                                                                                                                                                                                                                                                    |

Le modèle de variable d’environnement pour les limites de ressources est `OPENCLAW_DOCKER_ALL_<RESOURCE>_LIMIT` (nom de la ressource en majuscules, caractères non alphanumériques remplacés par `_`).

Autre comportement : l’exécuteur effectue par défaut une vérification préalable de Docker, nettoie les conteneurs E2E OpenClaw obsolètes, partage les caches d’outils CLI des fournisseurs entre les voies compatibles et cesse de planifier de nouvelles voies mutualisées après le premier échec, sauf si `OPENCLAW_DOCKER_ALL_FAIL_FAST=0` est défini. Si une voie dépasse la limite effective de poids ou de ressources sur un hôte à faible parallélisme, elle peut néanmoins démarrer depuis un pool vide et s’exécuter seule jusqu’à ce qu’elle libère de la capacité. Les journaux par voie, `summary.json`, `failures.json` et les durées des phases sont écrits sous `.artifacts/docker-tests/<run-id>/` ; utilisez `pnpm test:docker:timings <summary.json>` pour examiner les voies lentes et `pnpm test:docker:rerun <run-id|summary.json|failures.json>` pour afficher des commandes de réexécution ciblées et peu coûteuses.

### Voies Docker notables

| Commande                                                                    | Vérifie                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm test:docker:browser-cdp-snapshot`                                     | Conteneur E2E source basé sur Chromium avec CDP brut et Gateway isolé ; les instantanés des rôles CDP de `browser doctor --deep` incluent les URL des liens, les éléments cliquables promus par le curseur, les références d’iframe et les métadonnées des cadres.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `pnpm test:docker:skill-install`                                            | Installe l’archive tar empaquetée dans un exécuteur Docker minimal avec `skills.install.allowUploadedArchives: false`, résout l’identifiant d’une Skill actuelle à partir d’une recherche ClawHub en direct, l’installe via `openclaw skills install` et vérifie `SKILL.md`, `.clawhub/origin.json`, `.clawhub/lock.json` et `skills info --json`.                                                                                                                                                                                                                                                                                                                                                                                                          |
| `pnpm test:docker:live-cli-backend:claude`, `:claude:resume`, `:claude:mcp` | Sondes en direct ciblées du backend CLI ; Gemini dispose des alias correspondants `:resume` et `:mcp`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `pnpm test:docker:openwebui`                                                | OpenClaw et Open WebUI conteneurisés : connexion, vérification de `/api/models`, exécution d’une véritable conversation relayée via `/api/chat/completions`. Nécessite une clé de modèle utilisable en direct et télécharge une image externe ; cette voie ne devrait pas être aussi stable en CI que les suites unitaires/E2E.                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `pnpm test:docker:mcp-channels`                                             | Conteneur Gateway prérempli accompagné d’un conteneur client lançant `openclaw mcp serve` : découverte des conversations routées, lecture des transcriptions, métadonnées des pièces jointes, comportement de la file d’événements en direct, routage des envois sortants et notifications de canal et d’autorisation de style Claude via le véritable pont stdio (l’assertion lit directement les trames MCP stdio brutes).                                                                                                                                                                                                                                                                                                                            |
| `pnpm test:docker:upgrade-survivor`                                         | Installe l’archive tar empaquetée par-dessus une fixture sale d’ancien utilisateur, exécute la mise à jour du paquet ainsi que doctor en mode non interactif sans clés de fournisseur ou de canal actives, démarre un Gateway en local loopback et vérifie la préservation des agents, de la configuration des canaux, des listes d’autorisation des Plugins, des fichiers d’espace de travail et de session, de l’état obsolète des dépendances de Plugins hérités, du démarrage et de l’état RPC.                                                                                                                                                                                                                                                       |
| `pnpm test:docker:published-upgrade-survivor`                               | Installe `openclaw@latest` par défaut, initialise des fichiers réalistes d’utilisateur existant, effectue la configuration à l’aide d’une procédure `openclaw config set` intégrée, met à jour vers l’archive tar empaquetée, exécute doctor en mode non interactif, écrit `.artifacts/upgrade-survivor/summary.json` et vérifie `/healthz`, `/readyz` et l’état RPC. Remplacez la valeur avec `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, développez une matrice avec `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` ou ajoutez des fixtures de scénario avec `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` (inclut `configured-plugin-installs` et `stale-source-plugin-shadow`). L’acceptation des paquets les expose sous les noms `published_upgrade_survivor_baseline(s)` / `_scenarios` et résout des jetons méta tels que `last-stable-4` ou `all-since-2026.4.23`. |
| `pnpm test:docker:update-migration`                                         | Harnais de préservation après mise à niveau publiée dans le scénario `plugin-deps-cleanup`, démarrant par défaut à `openclaw@2026.4.23`. Le workflow `Update Migration` l’étend avec `baselines=all-since-2026.4.23` afin de démontrer le nettoyage des dépendances des Plugins configurés hors de la CI de publication complète.                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `pnpm test:docker:plugins`                                                  | Test rapide d’installation et de mise à jour pour les chemins locaux, `file:`, les paquets de registre npm avec dépendances remontées, les références git mobiles, les fixtures ClawHub, les mises à jour de place de marché et l’activation/l’inspection des lots Claude.                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |

## Contrôle local des PR

Pour les contrôles locaux de validation et d’intégration des PR, exécutez :

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Si `pnpm test` échoue de manière intermittente sur un hôte chargé, réexécutez-le une fois avant de considérer l’échec comme une régression, puis isolez le problème avec `pnpm test <path/to/test>`. Pour les hôtes disposant de peu de mémoire :

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Outils d’analyse des performances des tests

- `pnpm test:perf:imports` : active les rapports Vitest sur la durée et la répartition des importations, tout en continuant à utiliser le routage par voie ciblée pour les cibles explicites de fichiers ou de répertoires. `pnpm test:perf:imports:changed` limite le même profilage aux fichiers modifiés depuis `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` mesure les performances du chemin routé en mode modifications par rapport à l’exécution native du projet racine pour le même diff Git validé ; `pnpm test:perf:changed:bench -- --worktree` mesure les performances de l’ensemble des modifications de l’arbre de travail actuel sans nécessiter de validation préalable.
- `pnpm test:perf:profile:main` écrit un profil CPU pour le thread principal de Vitest (`.artifacts/vitest-main-profile`) ; `pnpm test:perf:profile:runner` écrit des profils CPU et de tas pour l’exécuteur de tests unitaires (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json` : exécute en série chaque configuration Vitest terminale de la suite complète et écrit les données de durée regroupées ainsi que les artefacts JSON et journaux propres à chaque configuration. Les rapports de la suite complète isolent les fichiers par défaut afin que les graphes de modules conservés et les pauses du ramasse-miettes provenant de fichiers antérieurs ne soient pas imputés aux assertions ultérieures ; transmettez `-- --no-isolate` uniquement lorsque vous profilez intentionnellement l’accumulation dans un worker partagé. L’agent de performances des tests utilise ce rapport comme référence avant de tenter de corriger les tests lents. `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json` compare les rapports regroupés après une modification axée sur les performances.
- Les exécutions partitionnées complètes, des extensions et basées sur un motif d’inclusion mettent à jour les données de durée locales dans `.artifacts/vitest-shard-timings.json` ; les exécutions ultérieures de configurations complètes utilisent ces durées pour équilibrer les partitions lentes et rapides. Les partitions CI basées sur un motif d’inclusion ajoutent le nom de la partition à la clé de durée, ce qui conserve la visibilité des durées des partitions filtrées sans remplacer les données de durée de la configuration complète. Définissez `OPENCLAW_TEST_PROJECTS_TIMINGS=0` pour ignorer l’artefact local de durées.

## Bancs d’essai

<Accordion title="Latence du modèle (scripts/bench-model.ts)">

```bash
pnpm tsx scripts/bench-model.ts --runs 10
```

Variables d’environnement facultatives : `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`. Invite par défaut : « Réponds avec un seul mot : ok. Sans ponctuation ni texte supplémentaire. »

</Accordion>

<Accordion title="Démarrage de la CLI (scripts/bench-cli-startup.ts)">

```bash
pnpm test:startup:bench
pnpm test:startup:bench:smoke
pnpm test:startup:bench:save
pnpm test:startup:bench:update
pnpm test:startup:bench:check
pnpm tsx scripts/bench-cli-startup.ts --runs 12
pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --case gatewayStatus --runs 3
pnpm tsx scripts/bench-cli-startup.ts --entry openclaw.mjs --entry-secondary dist/entry.js --preset all
```

Préréglages :

- `startup` : `--version`, `--help`, `health`, `health --json`, `status --json`, `status`
- `real` : `health`, `status`, `status --json`, `sessions`, `sessions --json`, `tasks --json`, `tasks list --json`, `tasks audit --json`, `agents list --json`, `gateway status`, `gateway status --json`, `gateway health --json`, `config get gateway.port`
- `all` : les deux préréglages combinés

La sortie comprend `sampleCount`, la moyenne, p50, p95, le minimum/maximum, la distribution des codes de sortie/signaux et le RSS maximal par commande. `--cpu-prof-dir` / `--heap-prof-dir` écrivent des profils V8 pour chaque exécution.

Sortie enregistrée : `pnpm test:startup:bench:smoke` écrit `.artifacts/cli-startup-bench-smoke.json` ; `pnpm test:startup:bench:save` écrit `.artifacts/cli-startup-bench-all.json` (`runs=5 warmup=1`). Fixture versionnée : `test/fixtures/cli-startup-bench.json`, actualisée par `pnpm test:startup:bench:update` et comparée par `pnpm test:startup:bench:check`.

</Accordion>

<Accordion title="Démarrage du Gateway (scripts/bench-gateway-startup.ts)">

Utilise par défaut le point d’entrée compilé de la CLI situé dans `dist/entry.js` ; exécutez d’abord `pnpm build`. Transmettez `--entry scripts/run-node.mjs` pour mesurer plutôt l’exécuteur du code source et conservez ces résultats séparément des références du point d’entrée compilé.

```bash
pnpm test:startup:gateway -- --runs 5 --warmup 1
pnpm test:startup:gateway -- --case skipChannels --case fiftyPlugins --runs 5
node --import tsx scripts/bench-gateway-startup.ts --case default --runs 5 --output .artifacts/gateway-startup.json
```

Identifiants de cas : `default`, `skipChannels` (démarrage des canaux ignoré), `oneInternalHook`, `allInternalHooks`, `fiftyPlugins` (50 plugins de manifeste), `fiftyStartupLazyPlugins` (50 plugins de manifeste chargés tardivement au démarrage).

La sortie comprend la première sortie du processus, `/healthz`, `/readyz`, l’heure du journal de mise en écoute HTTP, l’heure du journal signalant que le Gateway est prêt, le temps CPU, le ratio de cœurs CPU, le RSS maximal, le tas, les métriques de trace du démarrage, le délai de la boucle d’événements et les métriques détaillées de la table de correspondance des plugins. Le script définit `OPENCLAW_GATEWAY_STARTUP_TRACE=1` dans l’environnement du Gateway enfant.

`/healthz` indique la vivacité (le serveur HTTP peut répondre). `/readyz` indique que le système est prêt à être utilisé (les processus auxiliaires des plugins de démarrage, les canaux et les tâches post-attachement essentielles à la disponibilité se sont stabilisés). Les hooks de démarrage sont distribués de manière asynchrone et ne font pas partie de la garantie de disponibilité. L’heure du journal de disponibilité est l’horodatage interne du Gateway ; elle est utile pour attribuer les durées côté processus, mais ne remplace pas la sonde externe `/readyz`.

Utilisez la sortie JSON ou `--output` pour comparer des modifications. Utilisez `--cpu-prof-dir` uniquement lorsque la sortie de trace indique des tâches d’importation, de compilation ou limitées par le CPU que les seules durées des phases ne permettent pas d’expliquer.

</Accordion>

<Accordion title="Redémarrage du Gateway (scripts/bench-gateway-restart.ts)">

macOS et Linux uniquement (utilise SIGUSR1 pour les redémarrages dans le processus ; échoue immédiatement sous Windows). Même point d’entrée compilé par défaut et même remplacement par `--entry scripts/run-node.mjs` que pour le démarrage du Gateway ci-dessus.

```bash
pnpm test:restart:gateway -- --case skipChannels --runs 1 --restarts 5
pnpm test:restart:gateway -- --case default --runs 3 --restarts 3 --warmup 1
```

Identifiants de cas : `skipChannels`, `skipChannelsAcpxProbe` (sonde de démarrage ACPX activée), `skipChannelsNoAcpxProbe` (sonde désactivée), `default`, `fiftyPlugins`.

La sortie comprend les prochains résultats de `/healthz` et `/readyz`, la durée d’indisponibilité, le délai de disponibilité après redémarrage, le CPU, le RSS, les métriques de trace du démarrage du processus de remplacement ainsi que les métriques de trace du redémarrage concernant la gestion du signal, l’attente de la fin des tâches actives, les phases de fermeture, le démarrage suivant, le délai de disponibilité et les instantanés de mémoire. Le script définit `OPENCLAW_GATEWAY_STARTUP_TRACE=1` et `OPENCLAW_GATEWAY_RESTART_TRACE=1`.

Utilisez ce banc d’essai lorsqu’une modification touche la signalisation du redémarrage, les gestionnaires de fermeture, le démarrage après redémarrage, l’arrêt des processus auxiliaires, le transfert du service ou la disponibilité après redémarrage. Commencez par `skipChannels` pour isoler les mécanismes du Gateway du démarrage des canaux ; utilisez `default` ou les cas comportant de nombreux plugins uniquement lorsque le cas ciblé permet d’expliquer le chemin de redémarrage. Les métriques de trace fournissent des indices d’attribution, pas des verdicts : évaluez une modification du redémarrage à partir de plusieurs échantillons, de la section correspondante du propriétaire, du comportement de `/healthz` et `/readyz`, ainsi que du contrat de redémarrage visible par l’utilisateur.

</Accordion>

## E2E de l’intégration initiale (Docker)

Facultatif ; nécessaire uniquement pour les tests rapides conteneurisés de l’intégration initiale. Parcours complet de démarrage à froid dans un conteneur Linux propre :

```bash
scripts/e2e/onboard-docker.sh
```

Pilote l’assistant interactif au moyen d’un pseudo-terminal, vérifie les fichiers de configuration, d’espace de travail et de session, puis démarre le Gateway et exécute `openclaw health`.

## Test rapide de l’importation QR (Docker)

Vérifie que l’utilitaire d’exécution QR maintenu se charge avec les environnements d’exécution Node pris en charge dans Docker (Node 24 par défaut, compatible avec Node 22) :

```bash
pnpm test:docker:qr
```

## Voir aussi

- [Tests](/fr/help/testing)
- [Tests en conditions réelles](/fr/help/testing-live)
- [Tests des mises à jour et des plugins](/fr/help/testing-updates-plugins)
