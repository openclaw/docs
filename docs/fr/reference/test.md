---
read_when:
    - Exécution ou correction des tests
summary: Comment exécuter les tests localement (vitest) et quand utiliser les modes force/couverture
title: Tests
x-i18n:
    generated_at: "2026-07-12T15:48:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 63806ea72da1579f4aa0b92c14a6d2d3e67990d6c10cb6d9b1b2bb4a63c8e140
    source_path: reference/test.md
    workflow: 16
---

- Kit de test complet (suites, tests en conditions réelles, Docker) : [Tests](/fr/help/testing)
- Validation des mises à jour et des paquets de plugins : [Tester les mises à jour et les plugins](/fr/help/testing-updates-plugins)

## Comportement par défaut de l’agent

Les sessions d’agent exécutent les tests et les validations nécessitant beaucoup de calcul à distance
via Crabbox. Pour le code de mainteneur approuvé, Blacksmith Testbox est utilisé par défaut. Le
workflow Testbox configuré charge les identifiants ; le code non approuvé provenant d’un contributeur ou
d’un fork doit donc utiliser une CI de fork sans secrets ou une instance AWS Crabbox directe et assainie.

Lorsqu’une tâche sur du code approuvé est susceptible de nécessiter des tests ou des preuves approfondies, préchauffez
immédiatement l’environnement dans une session de commande en arrière-plan, poursuivez votre travail pendant son chargement,
réutilisez l’identifiant `tbx_...` renvoyé, synchronisez le checkout actuel à chaque exécution et
arrêtez l’environnement avant le transfert :

```bash
node scripts/crabbox-wrapper.mjs warmup --provider blacksmith-testbox --keep --timing-json
```

Après la première réutilisation réussie, le wrapper enregistre la base du bail,
les dépendances et l’empreinte du workflow Testbox sous `.crabbox/testbox-leases/`.
Les modifications portant uniquement sur le code source continuent de réutiliser l’environnement préchauffé. Une modification de la base de fusion, du fichier de verrouillage,
des données d’entrée du gestionnaire de paquets, du wrapper ou du workflow Testbox provoque un échec sécurisé et nécessite un
nouveau bail. Chaque exécution synchronise toujours le checkout actuel.
`OPENCLAW_TESTBOX_ALLOW_STALE=1` est réservé aux diagnostics intentionnels, et non
aux preuves de publication.

Les commandes de test locales ci-dessous sont destinées aux workflows humains ou à une solution de repli explicite de l’agent
demandée par l’utilisateur. L’indisponibilité du fournisseur distant doit être signalée ; elle ne
permet pas d’exécuter silencieusement une vaste batterie de vérifications locales.

Pour le code non approuvé, préchauffez l’environnement avec `--provider aws`. Chaque exécution doit définir
`CRABBOX_ENV_ALLOW=CI`, transmettre `--provider aws --no-hydrate` et utiliser
un `HOME` distant temporaire distinct avant d’installer les dépendances ou d’exécuter
les tests. Utilisez un bail nouvellement préchauffé dédié à cette source non approuvée ; ne réutilisez jamais
un bail approuvé ou précédemment chargé avec des identifiants. Lancez un binaire Crabbox approuvé installé
depuis un checkout propre et approuvé de `main`, puis récupérez uniquement la PR distante avec
`--fresh-pr` ; n’exécutez jamais localement le wrapper ou la configuration du checkout non approuvé.
Supprimez la définition de `CRABBOX_AWS_INSTANCE_PROFILE` et provoquez un échec sécurisé sauf si la valeur résolue de
`aws.instanceProfile` est vide. Avant toute installation ou tout test, utilisez des outils approuvés
avec des chemins absolus pour exiger un jeton IMDSv2, démontrer que le point de terminaison des identifiants IAM
renvoie 404 et vérifier que la commande distante `git rev-parse HEAD` correspond au SHA complet
de la tête de la PR examinée. Liez le bail à ce SHA et arrêtez/préchauffez de nouveau l’environnement lorsque la tête
change. Téléversez le script approuvé `scripts/crabbox-untrusted-bootstrap.sh` depuis une branche
`main` propre avec `--fresh-pr` ; il installe les versions épinglées de Node/pnpm, vérifie le SHA
et la version épinglée du gestionnaire de paquets, isole `HOME`, installe les dépendances, puis exécute
le test demandé. Si le courtier ne peut pas démontrer l’absence de rôle ou si aucune PR distante n’existe,
utilisez une CI de fork sans secrets. N’utilisez pas `hydrate-github`, `--no-sync` ni un
workflow Testbox chargé avec des identifiants.
Supprimez la définition de toutes les substitutions `CRABBOX_TAILSCALE*`, imposez `--network public
--tailscale=false`, effacez les indicateurs de nœud de sortie/LAN et exigez que `crabbox inspect`
signale une mise en réseau publique sans état Tailscale avant de téléverser un script.

## Ordre local habituel

1. `pnpm test:changed` pour une preuve Vitest limitée aux modifications.
2. `pnpm test <path-or-filter>` pour un fichier, un répertoire ou une cible explicite.
3. `pnpm test` uniquement lorsque vous avez délibérément besoin de la suite Vitest locale complète.

Dans un worktree Codex ou un checkout lié/clairsemé, les agents évitent d’exécuter directement en local
`pnpm test*` / `pnpm check*` / `pnpm crabbox:run` :

- Solution de repli locale explicitement demandée par l’utilisateur pour un petit fichier :
  `node scripts/run-vitest.mjs <path-or-filter>`.
- Contrôles des modifications ou preuve étendue : `node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox ... -- env OPENCLAW_CHECK_CHANGED_REMOTE_CHILD=1 OPENCLAW_CHANGED_LANES_RAW_SYNC=1 corepack pnpm check:changed` afin que pnpm s’exécute dans Testbox.
- Le dernier `exitCode` et le JSON de temporisation du wrapper constituent le résultat de la commande. Une exécution déléguée de Blacksmith GitHub Actions peut afficher `cancelled` après la réussite d’une commande SSH, car la Testbox est arrêtée depuis l’extérieur de l’action de maintien en vie ; vérifiez le récapitulatif du wrapper et la sortie de la commande avant de considérer cela comme un échec.
- `OPENCLAW_HEAVY_CHECK_LOCK_SCOPE=worktree <local-heavy-check command>` : limite la sérialisation des contrôles lourds au worktree actuel plutôt qu’au répertoire Git commun pour des commandes telles que `pnpm check:changed` et des exécutions ciblées de `pnpm test ...`. Utilisez cette option uniquement sur des hôtes locaux à haute capacité lorsque vous exécutez délibérément des contrôles indépendants dans plusieurs worktrees liés.

## Commandes principales

Les exécutions du wrapper de test se terminent par un bref récapitulatif `[test] passed|failed|skipped ... in ...` ; la ligne de durée propre à Vitest reste le détail par partition.

| Commande                                          | Fonction                                                                                                                                                                                                                                                                                                                                              |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm test`                                       | Les cibles explicites de fichiers/répertoires sont acheminées vers des voies Vitest ciblées. Les exécutions sans cible constituent une preuve de la suite complète : les groupes de partitions fixes sont développés en configurations terminales pour une exécution locale parallèle, avec la répartition attendue des partitions affichée avant le démarrage. Le groupe d’extensions est toujours développé en configurations de partition par extension plutôt qu’en un unique processus géant de projet racine. |
| `pnpm test:changed`                               | Exécution intelligente et peu coûteuse des tests liés aux modifications : cibles précises issues des modifications directes de tests, fichiers `*.test.ts` voisins, mappages explicites des sources et graphe d’importation local. Les modifications étendues/de configuration/de paquet sont ignorées, sauf si elles correspondent à des tests précis.                                                                                                                     |
| `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` | Exécution étendue explicite des tests liés aux modifications ; utilisez-la lorsqu’une modification du harnais de test, de la configuration ou d’un paquet doit se rabattre sur le comportement étendu de Vitest pour les tests liés aux modifications.                                                                                                                                                                                                              |
| `pnpm test:force`                                 | Libère le port Gateway OpenClaw configuré (`18789` par défaut), puis exécute la suite complète avec un port Gateway isolé afin que les tests de serveur n’entrent pas en conflit avec une instance en cours d’exécution.                                                                                                                                                                          |
| `pnpm test:coverage`                              | Génère un rapport informatif de couverture V8 pour la voie unitaire par défaut (`vitest.unit.config.ts`) ; aucun seuil de couverture n’est imposé.                                                                                                                                                                                                                   |
| `pnpm test:coverage:changed`                      | Couverture unitaire uniquement pour les fichiers modifiés depuis `origin/main`.                                                                                                                                                                                                                                                                                             |
| `pnpm changed:lanes`                              | Affiche les voies architecturales déclenchées par les différences par rapport à `origin/main`.                                                                                                                                                                                                                                                                            |
| `pnpm check:changed`                              | Délègue par défaut à Crabbox/Testbox hors CI, puis exécute le contrôle intelligent des modifications dans l’enfant distant : formatage, vérification des types, lint et commandes de garde pour les voies concernées. N’exécute pas Vitest ; utilisez `pnpm test:changed` ou `pnpm test <target>` comme preuve de test.                                                                      |

## État de test partagé et assistants de processus

- `src/test-utils/openclaw-test-state.ts` : à utiliser depuis Vitest lorsqu’un test nécessite un `HOME`, un `OPENCLAW_STATE_DIR`, un `OPENCLAW_CONFIG_PATH`, une fixture de configuration, un espace de travail, un répertoire d’agent ou un magasin de profils d’authentification isolés.
- `pnpm test:env-mutations:report` : rapport non bloquant sur les tests/harnais qui modifient directement `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, `OPENCLAW_WORKSPACE_DIR` ou des clés d’environnement associées. Utilisez-le pour trouver les candidats à une migration vers l’assistant d’état de test partagé.
- `test/helpers/openclaw-test-instance.ts` : tests E2E au niveau du processus nécessitant, en un seul endroit, un Gateway en cours d’exécution, l’environnement de la CLI, la capture des journaux et le nettoyage.
- Les voies E2E Docker/Bash qui chargent `scripts/lib/docker-e2e-image.sh` peuvent transmettre `docker_e2e_test_state_shell_b64 <label> <scenario>` au conteneur et le décoder avec `scripts/lib/openclaw-e2e-instance.sh` ; les scripts à plusieurs répertoires personnels peuvent transmettre `docker_e2e_test_state_function_b64` et appeler `openclaw_test_state_create <label> <scenario>` dans chaque flux. `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` écrit un fichier d’environnement hôte pouvant être chargé (le `--` avant `create` empêche les versions récentes de Node d’interpréter `--env-file` comme un indicateur Node). Les voies qui lancent un Gateway peuvent charger `scripts/lib/openclaw-e2e-instance.sh` pour la résolution du point d’entrée, le démarrage de la simulation OpenAI, le lancement au premier plan/en arrière-plan, les sondes de disponibilité, l’exportation de l’environnement d’état, les extractions de journaux et le nettoyage des processus.

## Voies de Control UI, TUI et des extensions

- **E2E simulé de l’interface de contrôle :** `pnpm test:ui:e2e` exécute le circuit Vitest + Playwright qui démarre l’interface de contrôle Vite et pilote une véritable page Chromium avec un WebSocket Gateway simulé. Les tests se trouvent dans `ui/src/**/*.e2e.test.ts` ; les simulations et contrôles partagés se trouvent dans `ui/src/test-helpers/control-ui-e2e.ts`. `pnpm test:e2e` inclut ce circuit. Les exécutions par agent utilisent Testbox/Crabbox par défaut, y compris pour les validations ciblées ; utilisez `node scripts/run-vitest.mjs run --config test/vitest/vitest.ui-e2e.config.ts --configLoader runner ui/src/ui/e2e/chat-flow.e2e.test.ts` uniquement comme solution de repli locale explicite.
- **Tests PTY de la TUI :** `node scripts/run-vitest.mjs run --config test/vitest/vitest.tui-pty.config.ts` exécute le circuit PTY rapide avec backend simulé. `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1` ou `pnpm tui:pty:test:watch --mode local` exécute le test rapide `tui --local`, plus lent, qui simule uniquement le point de terminaison externe du modèle. Vérifiez du texte visible stable ou les appels aux fixtures, et non des instantanés ANSI bruts.
- `pnpm test:extensions` et `pnpm test extensions` exécutent tous les fragments d’extensions/Plugins. Les Plugins de canaux lourds, le Plugin de navigateur et OpenAI s’exécutent dans des fragments dédiés ; les autres groupes de Plugins restent regroupés. `pnpm test extensions/<id>` exécute le circuit d’un seul Plugin intégré.
- Les fichiers sources accompagnés de tests adjacents sont associés à ces tests avant de recourir à des motifs glob plus larges sur le répertoire. Les modifications d’utilitaires sous `src/channels/plugins/contracts/test-helpers`, `src/plugin-sdk/test-helpers` et `src/plugins/contracts` utilisent un graphe d’importation local pour exécuter les tests qui les importent, plutôt que d’exécuter largement tous les fragments lorsque le chemin de dépendance est précis.
- Les cibles de répertoires de contrats sont distribuées vers leurs circuits de contrats : `pnpm test src/channels/plugins/contracts` exécute les quatre configurations de contrats de canaux et `pnpm test src/plugins/contracts` exécute la configuration des contrats de Plugins, car les projets génériques `channels`/`plugins` excluent `contracts/**`.
- `auto-reply` est réparti entre trois configurations dédiées (`core`, `top-level`, `reply`) afin que le banc d’essai des réponses ne prédomine pas sur les tests plus légers de statut, jeton et utilitaires de niveau supérieur.
- Certains fichiers de test `plugin-sdk` et `commands` sont acheminés par des circuits légers dédiés qui ne conservent que `test/setup.ts`, tandis que les cas nécessitant fortement l’environnement d’exécution restent dans leurs circuits existants.
- La configuration Vitest de base utilise par défaut `pool: "threads"` et `isolate: false`, avec l’exécuteur non isolé partagé activé dans toutes les configurations du dépôt.
- `pnpm test:channels` exécute `vitest.channels.config.ts`.

## Gateway et E2E

- L’intégration du Gateway est facultative : `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` ou `pnpm test:gateway`.
- `pnpm test:e2e` : agrégat E2E du dépôt = `pnpm test:e2e:gateway && pnpm test:ui:e2e`.
- `pnpm test:e2e:gateway` : tests rapides de bout en bout du Gateway (association WS/HTTP/Node multi-instance). Utilise par défaut `threads` + `isolate: false` avec des workers adaptatifs dans `vitest.e2e.config.ts` ; ajustez-les avec `OPENCLAW_E2E_WORKERS=<n>` et activez les journaux détaillés avec `OPENCLAW_E2E_VERBOSE=1`.
- `pnpm test:live` : tests en conditions réelles des fournisseurs (Claude/Minimax/DeepSeek/z.ai/etc., contrôlés par `*.live.test.ts`). Nécessite des clés d’API et `LIVE=1` (ou `OPENCLAW_LIVE_TEST=1`) pour ne plus les ignorer ; activez la sortie détaillée avec `OPENCLAW_LIVE_TEST_QUIET=0`.

## Suite Docker complète (`pnpm test:docker:all`)

Construit l’image partagée des tests en conditions réelles, empaquette OpenClaw une seule fois sous forme d’archive npm, construit ou réutilise une image d’exécution Node/Git minimale ainsi qu’une image fonctionnelle qui installe cette archive dans `/app`, puis exécute les circuits de tests rapides Docker au moyen d’un planificateur pondéré. `scripts/package-openclaw-for-docker.mjs` est l’unique outil d’empaquetage local/CI et valide l’archive ainsi que `dist/postinstall-inventory.json` avant son utilisation par Docker.

- Image minimale (`OPENCLAW_DOCKER_E2E_BARE_IMAGE`) : circuits d’installation, de mise à jour et de dépendances de Plugins ; monte l’archive préconstruite au lieu de sources du dépôt copiées.
- Image fonctionnelle (`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`) : circuits de fonctionnalités normales de l’application compilée.
- Définitions des circuits : `scripts/lib/docker-e2e-scenarios.mjs`. Planificateur : `scripts/lib/docker-e2e-plan.mjs`. Exécuteur : `scripts/test-docker-all.mjs`.
- `node scripts/test-docker-all.mjs --plan-json` produit le plan CI géré par le planificateur (circuits, types d’images, besoins d’empaquetage/d’image réelle, scénarios d’état, vérifications des identifiants) sans construire ni exécuter Docker.

Paramètres de planification (variables d’environnement, valeurs par défaut entre parenthèses) :

| Variable d’environnement                                                                                         | Valeur par défaut   | Objectif                                                                                                                                                                                                                                                                                                                                                   |
| --------------------------------------------------------------------------------------------------------------- | ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`                                                                               | 10                  | Emplacements de processus.                                                                                                                                                                                                                                                                                                                                 |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM`                                                                          | 10                  | Groupe final sensible aux fournisseurs.                                                                                                                                                                                                                                                                                                                    |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`                                                                                | 9                   | Limite des circuits lourds de fournisseurs en conditions réelles.                                                                                                                                                                                                                                                                                          |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`                                                                                 | 5                   | Limite des circuits utilisant des ressources npm.                                                                                                                                                                                                                                                                                                         |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`                                                                             | 7                   | Limite des circuits utilisant des ressources de service.                                                                                                                                                                                                                                                                                                  |
| `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT` / `_CODEX_LIMIT` / `_GEMINI_LIMIT` / `_DROID_LIMIT` / `_OPENCODE_LIMIT` | 4                   | Limites des circuits lourds par fournisseur.                                                                                                                                                                                                                                                                                                              |
| `OPENCLAW_DOCKER_ALL_LIVE_OPENAI_LIMIT` / `_TELEGRAM_LIMIT`                                                     | 1                   | Limites plus strictes par fournisseur.                                                                                                                                                                                                                                                                                                                     |
| `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` / `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT`                                         | -                   | Remplacement pour les hôtes plus puissants.                                                                                                                                                                                                                                                                                                               |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS`                                                                          | 2000                | Délai entre les démarrages de circuits, afin d’éviter les rafales de créations par le démon Docker local.                                                                                                                                                                                                                                                  |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`                                                                           | 7,200,000 (120 min) | Délai d’expiration de repli par circuit ; certains circuits réels/finaux utilisent des limites plus strictes.                                                                                                                                                                                                                                               |
| `OPENCLAW_DOCKER_ALL_LIVE_RETRIES`                                                                              | 1                   | Nouvelles tentatives en cas d’échecs transitoires des fournisseurs en conditions réelles.                                                                                                                                                                                                                                                                 |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`                                                                                   | désactivé           | Affiche le manifeste des circuits sans exécuter Docker.                                                                                                                                                                                                                                                                                                    |
| `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS`                                                                        | 30000               | Intervalle d’affichage de l’état des circuits actifs.                                                                                                                                                                                                                                                                                                      |
| `OPENCLAW_DOCKER_ALL_TIMINGS`                                                                                   | activé              | Réutilise `.artifacts/docker-tests/lane-timings.json` pour ordonner les circuits du plus long au plus court ; définissez la valeur sur `0` pour désactiver cette fonctionnalité.                                                                                                                                                                             |
| `OPENCLAW_DOCKER_ALL_LIVE_MODE`                                                                                 | -                   | `skip` pour les circuits déterministes/locaux uniquement, `only` pour les circuits de fournisseurs en conditions réelles uniquement. Alias : `pnpm test:docker:local:all`, `pnpm test:docker:live:all`. Le mode réservé aux conditions réelles fusionne les circuits réels principaux et finaux dans un même groupe ordonné du plus long au plus court, afin que les groupes de fournisseurs réunissent les tâches Claude/Codex/Gemini. |
| `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS`                                                               | 180                 | Délai d’expiration de la configuration Docker du backend CLI.                                                                                                                                                                                                                                                                                              |

Le modèle de variable d’environnement pour les limites de ressources est `OPENCLAW_DOCKER_ALL_<RESOURCE>_LIMIT` (nom de la ressource en majuscules, caractères non alphanumériques remplacés par `_`).

Autre comportement : le runner effectue par défaut des vérifications préalables de Docker, nettoie les conteneurs E2E OpenClaw obsolètes, partage les caches des outils CLI des fournisseurs entre les voies compatibles et cesse de planifier de nouvelles voies mutualisées après le premier échec, sauf si `OPENCLAW_DOCKER_ALL_FAIL_FAST=0` est défini. Si une voie dépasse la limite effective de poids ou de ressources sur un hôte à faible parallélisme, elle peut néanmoins démarrer depuis un pool vide et s’exécuter seule jusqu’à ce qu’elle libère de la capacité. Les journaux de chaque voie, `summary.json`, `failures.json` et les mesures de durée des phases sont écrits sous `.artifacts/docker-tests/<run-id>/` ; utilisez `pnpm test:docker:timings <summary.json>` pour examiner les voies lentes et `pnpm test:docker:rerun <run-id|summary.json|failures.json>` pour afficher des commandes de réexécution ciblées peu coûteuses.

### Voies Docker notables

| Commande                                                                    | Vérifie                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm test:docker:browser-cdp-snapshot`                                     | Conteneur E2E source reposant sur Chromium, avec CDP brut et Gateway isolé ; les instantanés de rôles CDP de `browser doctor --deep` incluent les URL des liens, les éléments cliquables promus par le curseur, les références d’iframe et les métadonnées des frames.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `pnpm test:docker:skill-install`                                            | Installe l’archive tar empaquetée dans un runner Docker minimal avec `skills.install.allowUploadedArchives: false`, résout le slug d’une compétence actuelle à partir d’une recherche ClawHub en direct, l’installe via `openclaw skills install` et vérifie `SKILL.md`, `.clawhub/origin.json`, `.clawhub/lock.json` et `skills info --json`.                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `pnpm test:docker:live-cli-backend:claude`, `:claude:resume`, `:claude:mcp` | Sondes en direct ciblées du backend CLI ; Gemini dispose d’alias `:resume` et `:mcp` équivalents.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `pnpm test:docker:openwebui`                                                | OpenClaw + Open WebUI conteneurisés : connexion, vérification de `/api/models`, exécution d’une véritable conversation relayée via `/api/chat/completions`. Nécessite une clé de modèle en direct utilisable et télécharge une image externe ; cette voie n’est pas censée être aussi stable en CI que les suites unitaires/E2E.                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `pnpm test:docker:mcp-channels`                                             | Conteneur Gateway préalimenté, accompagné d’un conteneur client qui lance `openclaw mcp serve` : découverte acheminée des conversations, lecture des transcriptions, métadonnées des pièces jointes, comportement de la file d’événements en direct, acheminement des envois sortants et notifications de canal et d’autorisation de type Claude sur le véritable pont stdio (l’assertion lit directement les frames MCP stdio brutes).                                                                                                                                                                                                                                                                                                                      |
| `pnpm test:docker:upgrade-survivor`                                         | Installe l’archive tar empaquetée sur une fixture sale d’ancien utilisateur, exécute la mise à jour du paquet puis doctor en mode non interactif sans clés de fournisseur/canal actives, démarre un Gateway en boucle locale et vérifie que les agents, la configuration des canaux, les listes d’autorisation des Plugins, les fichiers d’espace de travail et de session, l’état obsolète des dépendances de Plugins hérités, le démarrage et l’état RPC sont préservés.                                                                                                                                                                                                                                                                                        |
| `pnpm test:docker:published-upgrade-survivor`                               | Installe `openclaw@latest` par défaut, initialise des fichiers réalistes d’utilisateur existant, effectue la configuration à l’aide d’une recette intégrée `openclaw config set`, met à jour vers l’archive tar empaquetée, exécute doctor en mode non interactif, écrit `.artifacts/upgrade-survivor/summary.json` et vérifie `/healthz`, `/readyz` ainsi que l’état RPC. Remplacez la valeur avec `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, étendez une matrice avec `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` ou ajoutez des fixtures de scénario avec `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` (inclut `configured-plugin-installs` et `stale-source-plugin-shadow`). Package Acceptance les expose sous `published_upgrade_survivor_baseline(s)` / `_scenarios` et résout des jetons méta tels que `last-stable-4` ou `all-since-2026.4.23`. |
| `pnpm test:docker:update-migration`                                         | Banc de test de survie aux mises à niveau publiées dans le scénario `plugin-deps-cleanup`, démarrant par défaut à `openclaw@2026.4.23`. Le workflow `Update Migration` l’étend avec `baselines=all-since-2026.4.23` afin de démontrer le nettoyage des dépendances des Plugins configurés en dehors de la CI de version complète.                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `pnpm test:docker:plugins`                                                  | Test de fumée d’installation/mise à jour pour les chemins locaux, `file:`, les paquets du registre npm avec dépendances remontées, les références git mobiles, les fixtures ClawHub, les mises à jour de marketplace ainsi que l’activation et l’inspection des bundles Claude.                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |

## Contrôle local des PR

Pour les contrôles locaux de validation et d’intégration des PR, exécutez :

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Si `pnpm test` échoue de manière intermittente sur un hôte chargé, réexécutez-le une fois avant de considérer cet échec comme une régression, puis isolez-le avec `pnpm test <path/to/test>`. Pour les hôtes disposant de peu de mémoire :

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Outils de mesure des performances des tests

- `pnpm test:perf:imports` : active les rapports de durée et de répartition des importations de Vitest, tout en continuant à utiliser le routage par voie ciblée pour les cibles explicites de fichiers ou de répertoires. `pnpm test:perf:imports:changed` limite le même profilage aux fichiers modifiés depuis `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` évalue les performances du chemin routé en mode « modifications » par rapport à l’exécution native du projet racine pour le même diff Git validé ; `pnpm test:perf:changed:bench -- --worktree` évalue les performances de l’ensemble de modifications actuel de l’arbre de travail sans validation préalable.
- `pnpm test:perf:profile:main` écrit un profil CPU pour le thread principal de Vitest (`.artifacts/vitest-main-profile`) ; `pnpm test:perf:profile:runner` écrit des profils CPU et du tas pour l’exécuteur de tests unitaires (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json` : exécute en série chaque configuration Vitest terminale de la suite complète et écrit les données de durée regroupées ainsi que les artefacts JSON et journaux par configuration. Par défaut, les rapports de la suite complète isolent les fichiers afin que les graphes de modules conservés et les pauses du ramasse-miettes provenant des fichiers précédents ne soient pas imputés aux assertions ultérieures ; transmettez `-- --no-isolate` uniquement lorsque vous profilez intentionnellement l’accumulation dans un processus de travail partagé. L’agent de performances des tests utilise ces données comme référence avant de tenter de corriger les tests lents. `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json` compare les rapports regroupés après une modification axée sur les performances.
- Les exécutions partitionnées complètes, des extensions et par motif d’inclusion mettent à jour les données de temps locales dans `.artifacts/vitest-shard-timings.json` ; les exécutions complètes ultérieures d’une configuration utilisent ces temps pour équilibrer les partitions lentes et rapides. Les partitions d’intégration continue par motif d’inclusion ajoutent le nom de la partition à la clé de temps, ce qui conserve la visibilité des temps des partitions filtrées sans remplacer les données de temps de la configuration complète. Définissez `OPENCLAW_TEST_PROJECTS_TIMINGS=0` pour ignorer l’artefact de temps local.

## Bancs d’essai

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

La sortie comprend `sampleCount`, la moyenne, p50, p95, les valeurs min/max, la répartition des codes de sortie et signaux, ainsi que le RSS maximal par commande. `--cpu-prof-dir` / `--heap-prof-dir` écrivent des profils V8 pour chaque exécution.

Sortie enregistrée : `pnpm test:startup:bench:smoke` écrit `.artifacts/cli-startup-bench-smoke.json` ; `pnpm test:startup:bench:save` écrit `.artifacts/cli-startup-bench-all.json` (`runs=5 warmup=1`). Fixture versionnée : `test/fixtures/cli-startup-bench.json`, actualisée par `pnpm test:startup:bench:update` et comparée par `pnpm test:startup:bench:check`.

</Accordion>

<Accordion title="Démarrage du Gateway (scripts/bench-gateway-startup.ts)">

Utilise par défaut le point d’entrée compilé de la CLI dans `dist/entry.js` ; exécutez d’abord `pnpm build`. Transmettez `--entry scripts/run-node.mjs` pour mesurer plutôt l’exécuteur des sources et conservez ces résultats séparément des références du point d’entrée compilé.

```bash
pnpm test:startup:gateway -- --runs 5 --warmup 1
pnpm test:startup:gateway -- --case skipChannels --case fiftyPlugins --runs 5
node --import tsx scripts/bench-gateway-startup.ts --case default --runs 5 --output .artifacts/gateway-startup.json
```

Identifiants de cas : `default`, `skipChannels` (démarrage des canaux ignoré), `oneInternalHook`, `allInternalHooks`, `fiftyPlugins` (50 plugins de manifeste), `fiftyStartupLazyPlugins` (50 plugins de manifeste à chargement différé au démarrage).

La sortie comprend la première sortie du processus, `/healthz`, `/readyz`, l’heure du journal de mise en écoute HTTP, l’heure du journal de disponibilité du Gateway, le temps CPU, le rapport de cœur CPU, le RSS maximal, le tas, les métriques de trace du démarrage, le délai de la boucle d’événements et les métriques détaillées de la table de recherche des plugins. Le script définit `OPENCLAW_GATEWAY_STARTUP_TRACE=1` dans l’environnement du Gateway enfant.

`/healthz` indique l’activité (le serveur HTTP peut répondre). `/readyz` indique la disponibilité opérationnelle (les processus auxiliaires des plugins de démarrage, les canaux et les tâches postérieures à l’attachement indispensables à la disponibilité sont stabilisés). Les hooks de démarrage sont distribués de manière asynchrone et ne font pas partie de la garantie de disponibilité. L’heure du journal de disponibilité est l’horodatage interne du Gateway, utile pour l’attribution côté processus, mais elle ne remplace pas la sonde externe `/readyz`.

Utilisez la sortie JSON ou `--output` pour comparer des modifications. N’utilisez `--cpu-prof-dir` qu’après que la sortie de trace a désigné des travaux d’importation, de compilation ou limités par le CPU que les seuls temps des phases ne permettent pas d’expliquer.

</Accordion>

<Accordion title="Redémarrage du Gateway (scripts/bench-gateway-restart.ts)">

macOS et Linux uniquement (utilise SIGUSR1 pour les redémarrages au sein du processus ; échoue immédiatement sous Windows). Même point d’entrée compilé par défaut et même remplacement par `--entry scripts/run-node.mjs` que pour le démarrage du Gateway ci-dessus.

```bash
pnpm test:restart:gateway -- --case skipChannels --runs 1 --restarts 5
pnpm test:restart:gateway -- --case default --runs 3 --restarts 3 --warmup 1
```

Identifiants de cas : `skipChannels`, `skipChannelsAcpxProbe` (sonde de démarrage ACPX activée), `skipChannelsNoAcpxProbe` (sonde désactivée), `default`, `fiftyPlugins`.

La sortie comprend les prochains `/healthz` et `/readyz`, le temps d’indisponibilité, le temps de disponibilité après redémarrage, le CPU, le RSS, les métriques de trace du démarrage du processus de remplacement ainsi que les métriques de trace du redémarrage pour la gestion du signal, l’attente de la fin des tâches actives, les phases de fermeture, le démarrage suivant, le temps de disponibilité et les instantanés de mémoire. Le script définit `OPENCLAW_GATEWAY_STARTUP_TRACE=1` et `OPENCLAW_GATEWAY_RESTART_TRACE=1`.

Utilisez ce banc d’essai lorsqu’une modification touche la signalisation du redémarrage, les gestionnaires de fermeture, le démarrage après redémarrage, l’arrêt des processus auxiliaires, le transfert du service ou la disponibilité après redémarrage. Commencez par `skipChannels` pour isoler le fonctionnement du Gateway du démarrage des canaux ; n’utilisez `default` ou les cas comportant de nombreux plugins qu’après que le cas restreint a expliqué le chemin de redémarrage. Les métriques de trace sont des indices d’attribution, pas des verdicts : évaluez une modification du redémarrage à partir de plusieurs échantillons, de la portion correspondante du propriétaire, du comportement de `/healthz` et `/readyz`, ainsi que du contrat de redémarrage visible par l’utilisateur.

</Accordion>

## Intégration E2E (Docker)

Facultatif ; nécessaire uniquement pour les tests de fumée d’intégration en conteneur. Flux complet de démarrage à froid dans un conteneur Linux propre :

```bash
scripts/e2e/onboard-docker.sh
```

Pilote l’assistant interactif par l’intermédiaire d’un pseudo-terminal, vérifie les fichiers de configuration, d’espace de travail et de session, puis démarre le Gateway et exécute `openclaw health`.

## Test de fumée de l’importation QR (Docker)

Vérifie que l’utilitaire d’exécution QR maintenu se charge avec les environnements d’exécution Docker Node pris en charge (Node 24 par défaut, compatible avec Node 22) :

```bash
pnpm test:docker:qr
```

## Rubriques connexes

- [Tests](/fr/help/testing)
- [Tests en conditions réelles](/fr/help/testing-live)
- [Test des mises à jour et des plugins](/fr/help/testing-updates-plugins)
