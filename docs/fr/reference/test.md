---
read_when:
    - Exécution ou correction des tests
summary: Comment exécuter les tests localement (vitest) et quand utiliser les modes force/couverture
title: Tests
x-i18n:
    generated_at: "2026-07-16T13:49:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 391185703e853bb523e1396eb22da4693d10d47b1644d3b2a51707d329f67dae
    source_path: reference/test.md
    workflow: 16
---

- Kit de test complet (suites, en direct, Docker) : [Tests](/fr/help/testing)
- Validation des mises à jour et des packages de plugins : [Tester les mises à jour et les plugins](/fr/help/testing-updates-plugins)

## Valeurs par défaut de l’agent

Les sessions d’agent exécutent localement un ou quelques tests ciblés ainsi que
des vérifications statiques peu coûteuses uniquement pour les sources fiables
et lorsque l’installation existante des dépendances est prête. N’exécutez
jamais localement les outils d’un dépôt non fiable. Les suites plus importantes,
les contrôles des modifications avec répartition de la vérification des types et
du lint, les builds, Docker, les chaînes de packages, les tests E2E, les preuves
en direct et la validation multiplateforme s’exécutent à distance via Crabbox.
Pour les sources fiables des mainteneurs, les validations lourdes utilisent par
défaut Blacksmith Testbox. Le workflow Testbox configuré hydrate les identifiants ;
le code non fiable d’un contributeur ou d’un fork doit donc utiliser à la place
la CI du fork sans secrets ou une instance AWS Crabbox directe et assainie.

Ne préchauffez pas l’environnement pour du travail anticipé. Procurez-vous le
backend à la demande lorsque la première commande lourde est prête, réutilisez
l’identifiant `tbx_...` renvoyé pour les commandes lourdes ultérieures,
synchronisez le checkout actuel à chaque exécution et arrêtez-le avant le
transfert.

Après la première réutilisation réussie, le wrapper enregistre la base du bail,
les dépendances et l’empreinte du workflow Testbox sous `.crabbox/testbox-leases/`.
Les modifications limitées au code source continuent de réutiliser
l’environnement préchauffé. Une modification de la base de fusion, du fichier
de verrouillage, d’une entrée du gestionnaire de packages, du wrapper ou du
workflow Testbox provoque un échec sécurisé et exige un nouveau bail. Chaque
exécution synchronise néanmoins le checkout actuel.
`OPENCLAW_TESTBOX_ALLOW_STALE=1` est réservé aux diagnostics intentionnels, et non
aux preuves de publication.

Les commandes de test locales ci-dessous sont destinées aux workflows humains
et aux preuves d’agent limitées. L’indisponibilité d’un fournisseur distant doit
être signalée ; elle n’autorise pas l’exécution silencieuse d’un contrôle local
étendu.

Pour une preuve lourde non fiable, préchauffez l’environnement à la demande avec
`--provider aws`. Chaque exécution doit définir `CRABBOX_ENV_ALLOW=CI`, transmettre
`--provider aws --no-hydrate` et utiliser un `HOME` distant temporaire neuf avant
d’installer les dépendances ou d’exécuter les tests. Utilisez un bail nouvellement
préchauffé dédié à cette source non fiable ; ne réutilisez jamais un bail fiable
ou précédemment hydraté. Lancez un binaire Crabbox fiable installé depuis un
checkout propre et fiable de `main`, puis récupérez uniquement la PR
distante avec `--fresh-pr` ; n’exécutez jamais localement le wrapper ou la
configuration du checkout non fiable. Supprimez la définition de
`CRABBOX_AWS_INSTANCE_PROFILE` et provoquez un échec sécurisé sauf si la valeur résolue de
`aws.instanceProfile` est vide. Avant toute installation ou tout test, utilisez des
outils fiables avec des chemins absolus pour exiger un jeton IMDSv2, prouver que
le point de terminaison des identifiants IAM renvoie 404 et vérifier que la
valeur distante de `git rev-parse HEAD` correspond au SHA complet de la tête de PR
examinée. Liez le bail à ce SHA, puis arrêtez et préchauffez de nouveau
l’environnement lorsque la tête change. Téléversez le fichier fiable
`scripts/crabbox-untrusted-bootstrap.sh` depuis un checkout propre de `main` avec
`--fresh-pr` ; il installe les versions épinglées de Node/pnpm, vérifie le
SHA et la version épinglée du gestionnaire de packages, isole
`HOME`, installe les dépendances, puis exécute le test demandé. Si le
courtier ne peut pas prouver l’absence de rôle ou si aucune PR distante n’existe,
utilisez la CI du fork sans secrets. N’utilisez pas `hydrate-github`,
`--no-sync` ni un workflow Testbox dont les identifiants ont été hydratés.
Supprimez la définition de toutes les substitutions `CRABBOX_TAILSCALE*`, imposez
`--network public
--tailscale=false`, effacez les indicateurs de nœud de sortie/LAN et exigez que
`crabbox inspect` signale un réseau public sans état Tailscale avant de
téléverser le moindre script.

## Ordre local habituel

1. `pnpm test:changed` pour la preuve Vitest limitée aux modifications.
2. `pnpm test <path-or-filter>` pour un fichier, un répertoire ou une cible explicite.
3. `pnpm test` uniquement lorsqu’une suite Vitest locale complète est intentionnellement nécessaire.

Dans un arbre de travail Codex ou un checkout lié/partiel, les agents évitent
l’exécution locale directe de `pnpm test*` / `pnpm check*` /
`pnpm crabbox:run` :

- Preuve ciblée limitée avec des dépendances prêtes :
  `node scripts/run-vitest.mjs <path-or-filter>`.
- Contrôle des modifications avec classification préalable : `node scripts/check-changed.mjs` ; les plans limités à la documentation,
  sans modification ou portant sur peu de métadonnées restent locaux lorsque les dépendances sont prêtes,
  tandis que les plans lourds ou dépourvus de dépendances sont délégués à Testbox.
- Preuve étendue explicite avec conservation du bail : `node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox ... -- env OPENCLAW_CHECK_CHANGED_REMOTE_CHILD=1 OPENCLAW_CHANGED_LANES_RAW_SYNC=1 corepack pnpm check:changed`, afin que pnpm s’exécute dans Testbox.
- Le dernier `exitCode` du wrapper et son JSON de minutage constituent le résultat de la commande. Une exécution Blacksmith GitHub Actions déléguée peut afficher `cancelled` après une commande SSH réussie, car Testbox est arrêté en dehors de l’action de maintien en vie ; consultez le résumé du wrapper et la sortie de la commande avant d’interpréter cela comme un échec.
- `OPENCLAW_HEAVY_CHECK_LOCK_SCOPE=worktree <local-heavy-check command>` : conserve la sérialisation des contrôles lourds dans l’arbre de travail actuel plutôt que dans le répertoire commun Git pour des commandes telles que `pnpm check:changed` et les `pnpm test ...` ciblés. Utilisez-le uniquement sur des hôtes locaux de grande capacité lorsque vous exécutez intentionnellement des contrôles indépendants dans plusieurs arbres de travail liés.

## Commandes principales

Les exécutions du wrapper de test se terminent par un bref résumé
`[test] passed|failed|skipped ... in ...` ; la ligne de durée propre à Vitest reste le détail par fragment.

| Commande                                          | Fonction                                                                                                                                                                                                                                                                                                                                                        |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm test`                                       | Les cibles explicites de fichier ou de répertoire sont acheminées vers des chaînes Vitest limitées. Les exécutions sans cible constituent une preuve de la suite complète : les groupes de fragments fixes sont développés en configurations terminales pour une exécution locale en parallèle, et la répartition attendue des fragments est affichée avant le démarrage. Le groupe d’extensions est toujours développé en configurations de fragment par extension plutôt qu’en un seul processus géant du projet racine. |
| `pnpm test:changed`                               | Exécution intelligente et peu coûteuse des tests modifiés : cibles précises issues des modifications directes de tests, des fichiers `*.test.ts` voisins, des mappages explicites du code source et du graphe d’importation local. Les modifications étendues ou portant sur la configuration ou les packages sont ignorées, sauf si elles correspondent à des tests précis. |
| `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` | Exécution étendue explicite des tests modifiés ; utilisez-la lorsqu’une modification du harnais de test, de la configuration ou d’un package doit revenir au comportement plus étendu de Vitest pour les tests modifiés. |
| `pnpm test:force`                                 | Libère le port Gateway OpenClaw configuré (`18789` par défaut), puis exécute la suite complète avec un port Gateway isolé afin que les tests de serveur n’entrent pas en conflit avec une instance en cours d’exécution. |
| `pnpm test:coverage`                              | Produit un rapport informatif de couverture V8 pour la chaîne unitaire par défaut (`vitest.unit.config.ts`) ; aucun seuil de couverture n’est imposé. |
| `pnpm test:coverage:changed`                      | Couverture unitaire uniquement pour les fichiers modifiés depuis `origin/main`. |
| `pnpm changed:lanes`                              | Affiche les chaînes architecturales déclenchées par la différence par rapport à `origin/main`. |
| `pnpm check:changed`                              | Classe les chaînes modifiées avant de choisir l’exécution. Les plans limités à la documentation, sans modification ou portant sur peu de métadonnées restent locaux lorsque les dépendances sont prêtes ; les plans comprenant une répartition de la vérification des types et du lint, d’autres chaînes lourdes ou des dépendances locales manquantes sont délégués à Crabbox/Testbox hors CI. N’exécute pas Vitest ; utilisez `pnpm test:changed` ou `pnpm test <target>` pour la preuve de test. |

## État de test partagé et assistants de processus

- `src/test-utils/openclaw-test-state.ts` : à utiliser depuis Vitest lorsqu’un test nécessite un `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, un jeu de données de configuration, un espace de travail, un répertoire d’agent ou un magasin de profils d’authentification isolé.
- `pnpm test:env-mutations:report` : rapport non bloquant des tests et harnais qui modifient directement `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, `OPENCLAW_WORKSPACE_DIR` ou des clés d’environnement associées. Utilisez-le pour trouver les candidats à la migration vers l’assistant d’état de test partagé.
- `test/helpers/openclaw-test-instance.ts` : pour les tests E2E au niveau du processus qui nécessitent un Gateway actif, l’environnement de la CLI, la capture des journaux et le nettoyage au même endroit.
- Les chaînes E2E Docker/Bash qui chargent `scripts/lib/docker-e2e-image.sh` peuvent transmettre `docker_e2e_test_state_shell_b64 <label> <scenario>` au conteneur et le décoder avec `scripts/lib/openclaw-e2e-instance.sh` ; les scripts utilisant plusieurs répertoires personnels peuvent transmettre `docker_e2e_test_state_function_b64` et appeler `openclaw_test_state_create <label> <scenario>` dans chaque flux. `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` écrit un fichier d’environnement hôte pouvant être chargé (le `--` placé avant `create` empêche les versions récentes de Node d’interpréter `--env-file` comme un indicateur Node). Les chaînes qui lancent un Gateway peuvent charger `scripts/lib/openclaw-e2e-instance.sh` pour la résolution du point d’entrée, le démarrage d’une simulation OpenAI, le lancement au premier plan ou en arrière-plan, les sondes de disponibilité, l’exportation de l’environnement d’état, les vidages de journaux et le nettoyage des processus.

## Chaînes de la Control UI, de la TUI et des extensions

- **E2E simulé de l’interface de contrôle :** `pnpm test:ui:e2e` exécute le groupe Vitest + Playwright qui démarre l’interface de contrôle Vite et pilote une véritable page Chromium face à un WebSocket de Gateway simulé. Les tests se trouvent dans `ui/src/**/*.e2e.test.ts` ; les simulations et contrôles partagés se trouvent dans `ui/src/test-helpers/control-ui-e2e.ts`. `pnpm test:e2e` inclut ce groupe. Les exécutions d’agents utilisent Testbox/Crabbox par défaut, y compris pour les validations ciblées ; utilisez `node scripts/run-vitest.mjs run --config test/vitest/vitest.ui-e2e.config.ts --configLoader runner ui/src/ui/e2e/chat-flow.e2e.test.ts` uniquement comme solution de repli locale explicite.
- **Tests PTY de la TUI :** `node scripts/run-vitest.mjs run --config test/vitest/vitest.tui-pty.config.ts` exécute le groupe PTY rapide avec faux backend. `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1` ou `pnpm tui:pty:test:watch --mode local` exécute le test de bon fonctionnement `tui --local`, plus lent, qui simule uniquement le point de terminaison externe du modèle. Vérifiez le texte visible stable ou les appels aux fixtures, et non des instantanés ANSI bruts.
- `pnpm test:extensions` et `pnpm test extensions` exécutent tous les fragments d’extensions/plugins. Les plugins de canaux lourds, le plugin de navigateur et OpenAI s’exécutent dans des fragments dédiés ; les autres groupes de plugins restent regroupés. `pnpm test extensions/<id>` exécute le groupe d’un seul plugin intégré.
- Les fichiers sources ayant des tests voisins sont associés à ces derniers avant tout recours à des motifs glob plus larges sur les répertoires. Les modifications d’utilitaires sous `src/channels/plugins/contracts/test-helpers`, `src/plugin-sdk/test-helpers` et `src/plugins/contracts` utilisent un graphe d’importation local afin d’exécuter les tests qui les importent plutôt que de lancer largement chaque fragment lorsque le chemin de dépendance est précis.
- Les cibles de répertoires de contrats se répartissent entre leurs groupes de contrats : `pnpm test src/channels/plugins/contracts` exécute les quatre configurations de contrats de canaux et `pnpm test src/plugins/contracts` exécute la configuration des contrats de plugins, puisque les projets génériques `channels`/`plugins` excluent `contracts/**`.
- `auto-reply` est divisé en trois configurations dédiées (`core`, `top-level`, `reply`) afin que le banc de test des réponses ne domine pas les tests plus légers de statut, de jetons et d’utilitaires de premier niveau.
- Les fichiers de test `plugin-sdk` et `commands` sélectionnés sont acheminés vers des groupes légers dédiés qui ne conservent que `test/setup.ts`, tandis que les cas exigeants en ressources d’exécution restent dans leurs groupes existants.
- La configuration Vitest de base utilise par défaut `pool: "threads"` et `isolate: false`, avec l’exécuteur partagé non isolé activé dans toutes les configurations du dépôt.
- `pnpm test:channels` exécute `vitest.channels.config.ts`.

## Gateway et E2E

- L’intégration du Gateway est facultative : `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` ou `pnpm test:gateway`.
- `pnpm test:e2e` : agrégat E2E du dépôt = `pnpm test:e2e:gateway && pnpm test:ui:e2e`.
- `pnpm test:e2e:gateway` : tests de bon fonctionnement de bout en bout du Gateway (association WS/HTTP/Node multi-instance). Utilise par défaut `threads` + `isolate: false`, avec des processus de travail adaptatifs dans `vitest.e2e.config.ts` ; ajustez-les avec `OPENCLAW_E2E_WORKERS=<n>`, et activez les journaux détaillés avec `OPENCLAW_E2E_VERBOSE=1`.
- `pnpm test:live` : tests en conditions réelles des fournisseurs (Claude/Minimax/DeepSeek/z.ai/etc., conditionnés par `*.live.test.ts`). Nécessite des clés d’API et `LIVE=1` (ou `OPENCLAW_LIVE_TEST=1`) pour ne pas les ignorer ; sortie détaillée avec `OPENCLAW_LIVE_TEST_QUIET=0`.

## Suite Docker complète (`pnpm test:docker:all`)

Construit l’image partagée de tests en conditions réelles, empaquette OpenClaw une seule fois sous forme d’archive npm, construit/réutilise une image d’exécution minimale Node/Git ainsi qu’une image fonctionnelle qui installe cette archive dans `/app`, puis exécute les groupes de tests de bon fonctionnement Docker au moyen d’un planificateur pondéré. `scripts/package-openclaw-for-docker.mjs` est l’unique outil local/CI d’empaquetage du paquet et valide l’archive ainsi que `dist/postinstall-inventory.json` avant leur utilisation par Docker.

- Image minimale (`OPENCLAW_DOCKER_E2E_BARE_IMAGE`) : groupes d’installation, de mise à jour et de dépendances de plugins ; monte l’archive préconstruite au lieu de sources du dépôt copiées.
- Image fonctionnelle (`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`) : groupes de fonctionnalités normales de l’application compilée.
- Définitions des groupes : `scripts/lib/docker-e2e-scenarios.mjs`. Planificateur : `scripts/lib/docker-e2e-plan.mjs`. Exécuteur : `scripts/test-docker-all.mjs`.
- `node scripts/test-docker-all.mjs --plan-json` produit le plan CI géré par le planificateur (groupes, types d’images, besoins en paquet/image de tests en conditions réelles, scénarios d’état, vérifications des identifiants) sans construire ni exécuter Docker.

Paramètres de planification (variables d’environnement, valeurs par défaut entre parenthèses) :

| Variable d’environnement                                                                                         | Valeur par défaut   | Objectif                                                                                                                                                                                                                                                                                   |
| --------------------------------------------------------------------------------------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`                                                                               | 10                  | Emplacements de processus.                                                                                                                                                                                                                                                                 |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM`                                                                          | 10                  | Groupe final sensible aux fournisseurs.                                                                                                                                                                                                                                                    |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`                                                                                | 9                   | Limite des groupes lourds de fournisseurs en conditions réelles.                                                                                                                                                                                                                           |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`                                                                                 | 5                   | Limite des groupes utilisant des ressources npm.                                                                                                                                                                                                                                           |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`                                                                             | 7                   | Limite des groupes utilisant des ressources de service.                                                                                                                                                                                                                                    |
| `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT` / `_CODEX_LIMIT` / `_GEMINI_LIMIT` / `_DROID_LIMIT` / `_OPENCODE_LIMIT` | 4                   | Limites des groupes lourds par fournisseur.                                                                                                                                                                                                                                                |
| `OPENCLAW_DOCKER_ALL_LIVE_OPENAI_LIMIT` / `_TELEGRAM_LIMIT`                                                     | 1                   | Limites plus strictes par fournisseur.                                                                                                                                                                                                                                                     |
| `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` / `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT`                                         | -                   | Remplacement pour les hôtes plus puissants.                                                                                                                                                                                                                                                |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS`                                                                          | 2000                | Délai entre les démarrages de groupes, évitant les rafales de créations sur le démon Docker local.                                                                                                                                                                                         |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`                                                                           | 7,200,000 (120 min) | Délai d’expiration de secours par groupe ; certains groupes en conditions réelles/finaux utilisent des limites plus strictes.                                                                                                                                                              |
| `OPENCLAW_DOCKER_ALL_LIVE_RETRIES`                                                                              | 1                   | Nouvelles tentatives en cas de défaillances transitoires des fournisseurs en conditions réelles.                                                                                                                                                                                           |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`                                                                                   | off                 | Affiche le manifeste des groupes sans exécuter Docker.                                                                                                                                                                                                                                     |
| `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS`                                                                        | 30000               | Intervalle d’affichage de l’état des groupes actifs.                                                                                                                                                                                                                                       |
| `OPENCLAW_DOCKER_ALL_TIMINGS`                                                                                   | on                  | Réutilise `.artifacts/docker-tests/lane-timings.json` pour un classement du plus long au plus court ; définissez sur `0` pour le désactiver.                                                                                                                                             |
| `OPENCLAW_DOCKER_ALL_LIVE_MODE`                                                                                 | -                   | `skip` pour les groupes déterministes/locaux uniquement, `only` pour les groupes de fournisseurs en conditions réelles uniquement. Alias : `pnpm test:docker:local:all`, `pnpm test:docker:live:all`. Le mode en conditions réelles uniquement fusionne les groupes principaux et finaux en conditions réelles en un seul ensemble classé du plus long au plus court, afin que les compartiments de fournisseurs regroupent les tâches Claude/Codex/Gemini. |
| `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS`                                                               | 180                 | Délai d’expiration de la configuration Docker du backend CLI.                                                                                                                                                                                                                              |

Le modèle de variable d’environnement pour les limites de ressources est `OPENCLAW_DOCKER_ALL_<RESOURCE>_LIMIT` (nom de la ressource en majuscules, caractères non alphanumériques remplacés par `_`).

Autre comportement : le runner effectue par défaut une vérification préalable de Docker, nettoie les conteneurs E2E OpenClaw obsolètes, partage les caches d’outils CLI des fournisseurs entre les lanes compatibles et cesse de planifier de nouvelles lanes mutualisées après le premier échec, sauf si `OPENCLAW_DOCKER_ALL_FAIL_FAST=0` est défini. Si une lane dépasse la limite effective de poids ou de ressources sur un hôte à faible parallélisme, elle peut tout de même démarrer depuis un pool vide et s’exécuter seule jusqu’à ce qu’elle libère de la capacité. Les journaux par lane, `summary.json`, `failures.json` et les mesures temporelles des phases sont écrits sous `.artifacts/docker-tests/<run-id>/` ; utilisez `pnpm test:docker:timings <summary.json>` pour examiner les lanes lentes et `pnpm test:docker:rerun <run-id|summary.json|failures.json>` pour afficher des commandes peu coûteuses de réexécution ciblée.

### Lanes Docker notables

| Commande                                                                    | Vérifie                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm test:docker:browser-cdp-snapshot`                                     | Conteneur E2E source utilisant Chromium, avec CDP brut et Gateway isolé ; les instantanés de rôles CDP `browser doctor --deep` incluent les URL des liens, les éléments cliquables promus par le curseur, les références d’iframe et les métadonnées de frame.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `pnpm test:docker:skill-install`                                            | Installe l’archive tarball empaquetée dans un runner Docker minimal avec `skills.install.allowUploadedArchives: false`, résout le slug actuel d’une skill à partir d’une recherche ClawHub en direct, l’installe via `openclaw skills install`, puis vérifie `SKILL.md`, `.clawhub/origin.json`, `.clawhub/lock.json` et `skills info --json`.                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `pnpm test:docker:live-cli-backend:claude`, `:claude:resume`, `:claude:mcp` | Sondes en direct ciblées des backends CLI ; Gemini dispose des alias correspondants `:resume` et `:mcp`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `pnpm test:docker:openwebui`                                                | OpenClaw + Open WebUI conteneurisés : connexion, vérification de `/api/models`, puis exécution d’une véritable conversation relayée via `/api/chat/completions`. Nécessite une clé de modèle en direct utilisable et récupère une image externe ; cette lane n’est pas censée être aussi stable en CI que les suites unitaires/E2E.                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `pnpm test:docker:mcp-channels`                                             | Conteneur Gateway préalimenté, plus un conteneur client lançant `openclaw mcp serve` : découverte acheminée des conversations, lecture des transcriptions, métadonnées des pièces jointes, comportement de la file d’événements en direct, acheminement des envois sortants, ainsi que notifications de canal et d’autorisations de style Claude via le véritable pont stdio (l’assertion lit directement les frames MCP stdio brutes).                                                                                                                                                                                                                                                                                                                     |
| `pnpm test:docker:upgrade-survivor`                                         | Installe l’archive tarball empaquetée sur une fixture d’ancien utilisateur dans un état non propre, exécute la mise à jour du paquet puis doctor en mode non interactif sans clés de fournisseur ou de canal en direct, démarre un Gateway en boucle locale et vérifie la préservation des agents, de la configuration des canaux, des listes d’autorisation de plugins, des fichiers d’espace de travail et de session, de l’état obsolète des dépendances de plugins hérités, du démarrage et du statut RPC.                                                                                                                                                                                                                              |
| `pnpm test:docker:published-upgrade-survivor`                               | Installe `openclaw@latest` par défaut, initialise des fichiers réalistes d’utilisateur existant, effectue la configuration à l’aide d’une recette `openclaw config set` intégrée, met à jour vers l’archive tarball empaquetée, exécute doctor en mode non interactif, écrit `.artifacts/upgrade-survivor/summary.json`, puis vérifie `/healthz`, `/readyz` et le statut RPC. Remplacez la valeur avec `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, étendez une matrice avec `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` ou ajoutez des fixtures de scénario avec `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` (comprend `configured-plugin-installs` et `stale-source-plugin-shadow`). Package Acceptance les expose sous les noms `published_upgrade_survivor_baseline(s)` / `_scenarios` et résout les méta-jetons tels que `last-stable-4` ou `all-since-2026.4.23`. |
| `pnpm test:docker:update-migration`                                         | Harnais de vérification de la survie aux mises à niveau publiées dans le scénario `plugin-deps-cleanup`, démarrant par défaut à `openclaw@2026.4.23`. Le workflow `Update Migration` l’étend avec `baselines=all-since-2026.4.23` afin de démontrer le nettoyage des dépendances des plugins configurés en dehors de la CI de version complète.                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `pnpm test:docker:plugins`                                                  | Test rapide d’installation/mise à jour pour un chemin local, `file:`, les paquets du registre npm avec dépendances remontées, les références git mobiles, les fixtures ClawHub, les mises à jour de marketplace et l’activation/l’inspection du bundle Claude.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |

## Gate locale de PR

Pour les vérifications locales de gate et de landing d’une PR, exécutez :

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Si `pnpm test` échoue de manière intermittente sur un hôte chargé, réexécutez-le une fois avant de considérer cela comme une régression, puis isolez le problème avec `pnpm test <path/to/test>`. Pour les hôtes à mémoire limitée :

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Outils de mesure des performances des tests

- `pnpm test:perf:imports` : active les rapports de durée et de répartition des imports Vitest, tout en continuant d’utiliser l’acheminement par lane délimité pour les cibles explicites de fichiers ou de répertoires. `pnpm test:perf:imports:changed` limite le même profilage aux fichiers modifiés depuis `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` compare les performances du chemin acheminé en mode changements à celles de l’exécution native du projet racine pour le même diff git validé ; `pnpm test:perf:changed:bench -- --worktree` mesure les performances de l’ensemble des changements actuels de l’arbre de travail sans validation préalable.
- `pnpm test:perf:profile:main` écrit un profil CPU pour le thread principal de Vitest (`.artifacts/vitest-main-profile`) ; `pnpm test:perf:profile:runner` écrit des profils CPU et de tas pour le runner unitaire (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json` : exécute en série chaque configuration Vitest terminale de la suite complète et écrit des données de durée groupées ainsi que des artefacts JSON/journaux par configuration. Les rapports de suite complète isolent les fichiers par défaut afin que les graphes de modules conservés et les pauses du ramasse-miettes provenant de fichiers antérieurs ne soient pas imputés aux assertions ultérieures ; transmettez `-- --no-isolate` uniquement lors du profilage intentionnel de l’accumulation dans un worker partagé. L’agent de performances des tests utilise ceci comme référence avant de tenter de corriger les tests lents. `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json` compare les rapports groupés après une modification axée sur les performances.
- Les exécutions partitionnées de la suite complète, des extensions et des motifs d’inclusion mettent à jour les données temporelles locales dans `.artifacts/vitest-shard-timings.json` ; les exécutions ultérieures de configurations complètes utilisent ces mesures pour équilibrer les partitions lentes et rapides. Les partitions CI basées sur des motifs d’inclusion ajoutent le nom de la partition à la clé temporelle, ce qui permet de conserver visibles les mesures des partitions filtrées sans remplacer les données temporelles de la configuration complète. Définissez `OPENCLAW_TEST_PROJECTS_TIMINGS=0` pour ignorer l’artefact temporel local.

## Benchmarks

<Accordion title="Latence du modèle (scripts/bench-model.ts)">

```bash
pnpm tsx scripts/bench-model.ts --runs 10
```

Variables d’environnement facultatives : `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`. Invite par défaut : « Répondez par un seul mot : ok. Sans ponctuation ni texte supplémentaire. »

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

La sortie comprend `sampleCount`, la moyenne, p50, p95, le minimum/maximum, la distribution des codes de sortie/signaux et le RSS maximal par commande. `--cpu-prof-dir` / `--heap-prof-dir` écrivent les profils V8 de chaque exécution.

Sortie enregistrée : `pnpm test:startup:bench:smoke` écrit `.artifacts/cli-startup-bench-smoke.json` ; `pnpm test:startup:bench:save` écrit `.artifacts/cli-startup-bench-all.json` (`runs=5 warmup=1`). Fixture versionnée : `test/fixtures/cli-startup-bench.json`, actualisée par `pnpm test:startup:bench:update`, comparée par `pnpm test:startup:bench:check`.

</Accordion>

<Accordion title="Démarrage du Gateway (scripts/bench-gateway-startup.ts)">

Utilise par défaut le point d’entrée CLI compilé à l’emplacement `dist/entry.js` ; exécutez d’abord `pnpm build`. Passez `--entry scripts/run-node.mjs` pour mesurer plutôt l’exécuteur source et conservez ces résultats séparément des références du point d’entrée compilé.

```bash
pnpm test:startup:gateway -- --runs 5 --warmup 1
pnpm test:startup:gateway -- --case skipChannels --case fiftyPlugins --runs 5
node --import tsx scripts/bench-gateway-startup.ts --case default --runs 5 --output .artifacts/gateway-startup.json
```

Identifiants de cas : `default`, `skipChannels` (démarrage des canaux ignoré), `oneInternalHook`, `allInternalHooks`, `fiftyPlugins` (50 plugins de manifeste), `fiftyStartupLazyPlugins` (50 plugins de manifeste chargés tardivement au démarrage).

La sortie comprend la première sortie du processus, `/healthz`, `/readyz`, l’heure du journal de mise en écoute HTTP, l’heure du journal indiquant que le Gateway est prêt, le temps CPU, le ratio de cœurs CPU, le RSS maximal, le tas, les métriques de trace de démarrage, le retard de la boucle d’événements et les métriques détaillées de la table de recherche des plugins. Le script définit `OPENCLAW_GATEWAY_STARTUP_TRACE=1` dans l’environnement du Gateway enfant.

`/healthz` indique la vivacité (le serveur HTTP peut répondre). `/readyz` indique que le système est utilisable (les processus auxiliaires des plugins de démarrage, les canaux et les travaux critiques pour l’état prêt effectués après l’attachement sont stabilisés). Les hooks de démarrage sont distribués de manière asynchrone et ne font pas partie de la garantie de disponibilité. L’heure du journal indiquant l’état prêt est l’horodatage interne du Gateway, utile pour l’attribution côté processus, mais elle ne remplace pas la sonde externe `/readyz`.

Utilisez la sortie JSON ou `--output` pour comparer les modifications. N’utilisez `--cpu-prof-dir` qu’après que la sortie de trace indique un travail d’importation, de compilation ou lié au CPU que les seuls minutages des phases ne peuvent pas expliquer.

</Accordion>

<Accordion title="Redémarrage du Gateway (scripts/bench-gateway-restart.ts)">

macOS et Linux uniquement (utilise SIGUSR1 pour les redémarrages dans le processus ; échoue immédiatement sous Windows). Même point d’entrée compilé par défaut et même remplacement `--entry scripts/run-node.mjs` que pour le démarrage du Gateway ci-dessus.

```bash
pnpm test:restart:gateway -- --case skipChannels --runs 1 --restarts 5
pnpm test:restart:gateway -- --case default --runs 3 --restarts 3 --warmup 1
```

Identifiants de cas : `skipChannels`, `skipChannelsAcpxProbe` (sonde de démarrage ACPX activée), `skipChannelsNoAcpxProbe` (sonde désactivée), `default`, `fiftyPlugins`.

La sortie comprend les prochains `/healthz` et `/readyz`, le temps d’indisponibilité, le minutage de disponibilité après redémarrage, le CPU, le RSS, les métriques de trace de démarrage du processus de remplacement et les métriques de trace du redémarrage pour le traitement du signal, l’achèvement des travaux actifs, les phases de fermeture, le démarrage suivant, le minutage de disponibilité et les instantanés de mémoire. Le script définit `OPENCLAW_GATEWAY_STARTUP_TRACE=1` et `OPENCLAW_GATEWAY_RESTART_TRACE=1`.

Utilisez ce benchmark lorsqu’une modification touche la signalisation de redémarrage, les gestionnaires de fermeture, le démarrage après redémarrage, l’arrêt des processus auxiliaires, le transfert de service ou la disponibilité après redémarrage. Commencez par `skipChannels` afin d’isoler les mécanismes du Gateway du démarrage des canaux ; n’utilisez `default` ou les cas comportant de nombreux plugins qu’une fois que le cas restreint explique le chemin de redémarrage. Les métriques de trace sont des indices d’attribution, pas des verdicts — évaluez une modification du redémarrage à partir de plusieurs échantillons, de la portée correspondante du propriétaire, du comportement de `/healthz`/`/readyz` et du contrat de redémarrage visible par l’utilisateur.

</Accordion>

## E2E d’intégration initiale (Docker)

Facultatif ; nécessaire uniquement pour les tests de fumée de l’intégration initiale en conteneur. Flux complet de démarrage à froid dans un conteneur Linux propre :

```bash
scripts/e2e/onboard-docker.sh
```

Pilote l’assistant interactif au moyen d’un pseudo-terminal, vérifie les fichiers de configuration, d’espace de travail et de session, puis démarre le Gateway et exécute `openclaw health`.

## Test de fumée de l’importation QR (Docker)

Vérifie que l’utilitaire d’exécution QR maintenu se charge avec les environnements d’exécution Docker Node pris en charge (Node 24 par défaut, compatible avec Node 22) :

```bash
pnpm test:docker:qr
```

## Rubriques connexes

- [Tests](/fr/help/testing)
- [Tests en conditions réelles](/fr/help/testing-live)
- [Tests des mises à jour et des plugins](/fr/help/testing-updates-plugins)
