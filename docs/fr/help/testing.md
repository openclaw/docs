---
read_when:
    - Exécuter des tests localement ou en CI
    - Ajouter des régressions pour des bugs de modèle/fournisseur
    - Déboguer le comportement de la passerelle et de l'agent
summary: 'Kit de test : suites unitaires/e2e/live, exécuteurs Docker et ce que couvre chaque test'
title: Tests
x-i18n:
    generated_at: "2026-04-09T01:30:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 01117f41d8b171a4f1da11ed78486ee700e70ae70af54eb6060c57baf64ab21b
    source_path: help/testing.md
    workflow: 15
---

# Tests

OpenClaw dispose de trois suites Vitest (unit/integration, e2e, live) et d'un petit ensemble d'exécuteurs Docker.

Ce document est un guide « comment nous testons » :

- Ce que couvre chaque suite (et ce qu'elle ne couvre délibérément _pas_)
- Quelles commandes exécuter pour les workflows courants (local, avant push, débogage)
- Comment les tests live découvrent les identifiants et sélectionnent les modèles/fournisseurs
- Comment ajouter des régressions pour des problèmes réels de modèle/fournisseur

## Démarrage rapide

La plupart des jours :

- Barrière complète (attendue avant push) : `pnpm build && pnpm check && pnpm test`
- Exécution plus rapide de la suite complète en local sur une machine confortable : `pnpm test:max`
- Boucle watch Vitest directe : `pnpm test:watch`
- Le ciblage direct de fichier route désormais aussi les chemins d'extension/canal : `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Site QA avec support Docker : `pnpm qa:lab:up`

Quand vous modifiez des tests ou souhaitez davantage de confiance :

- Barrière de couverture : `pnpm test:coverage`
- Suite E2E : `pnpm test:e2e`

Lors du débogage de vrais fournisseurs/modèles (nécessite de vrais identifiants) :

- Suite live (modèles + sondes d'outil/image de passerelle) : `pnpm test:live`
- Cibler silencieusement un fichier live : `pnpm test:live -- src/agents/models.profiles.live.test.ts`

Conseil : quand vous n'avez besoin que d'un seul cas en échec, préférez restreindre les tests live via les variables d'environnement de liste d'autorisation décrites ci-dessous.

## Suites de test (ce qui s'exécute où)

Considérez les suites comme « réalisme croissant » (et fragilité/coût croissants) :

### Unit / integration (par défaut)

- Commande : `pnpm test`
- Config : dix exécutions séquentielles de fragments (`vitest.full-*.config.ts`) sur les projets Vitest ciblés existants
- Fichiers : inventaires core/unit sous `src/**/*.test.ts`, `packages/**/*.test.ts`, `test/**/*.test.ts`, et les tests node `ui` autorisés couverts par `vitest.unit.config.ts`
- Portée :
  - Tests unitaires purs
  - Tests d'intégration en processus (authentification de la passerelle, routage, outils, analyse, configuration)
  - Régressions déterministes pour des bugs connus
- Attentes :
  - S'exécute en CI
  - Aucune vraie clé requise
  - Doit être rapide et stable
- Note sur les projets :
  - `pnpm test` sans ciblage exécute désormais onze configurations fragmentées plus petites (`core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) au lieu d'un seul processus racine natif géant. Cela réduit le RSS maximal sur les machines chargées et évite que le travail `auto-reply`/extensions n'affame les suites sans rapport.
  - `pnpm test --watch` utilise toujours le graphe de projet racine natif `vitest.config.ts`, parce qu'une boucle watch multi-fragments n'est pas pratique.
  - `pnpm test`, `pnpm test:watch` et `pnpm test:perf:imports` routent d'abord les cibles explicites de fichier/répertoire via des voies ciblées, donc `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` évite de payer le coût de démarrage complet du projet racine.
  - `pnpm test:changed` développe les chemins git modifiés vers ces mêmes voies ciblées quand le diff ne touche que des fichiers source/test routables ; les modifications de config/setup reviennent toujours à la relance large du projet racine.
  - Certains tests `plugin-sdk` et `commands` passent aussi par des voies légères dédiées qui ignorent `test/setup-openclaw-runtime.ts` ; les fichiers avec état/lourds à l'exécution restent sur les voies existantes.
  - Certains fichiers source utilitaires `plugin-sdk` et `commands` associent aussi les exécutions en mode changed à des tests frères explicites dans ces voies légères, afin que les modifications d'utilitaires évitent de relancer toute la suite lourde du répertoire.
  - `auto-reply` dispose maintenant de trois compartiments dédiés : utilitaires core de premier niveau, tests d'intégration `reply.*` de premier niveau, et sous-arborescence `src/auto-reply/reply/**`. Cela garde le travail de harness reply le plus lourd hors des tests bon marché de statut/chunk/token.
- Note sur l'exécuteur embarqué :
  - Lorsque vous modifiez les entrées de découverte d'outils de message ou le contexte d'exécution de compaction,
    conservez les deux niveaux de couverture.
  - Ajoutez des régressions d'utilitaire ciblées pour les frontières pures de routage/normalisation.
  - Maintenez également en bon état les suites d'intégration de l'exécuteur embarqué :
    `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
    `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts`, et
    `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
  - Ces suites vérifient que les identifiants ciblés et le comportement de compaction passent toujours
    par les vrais chemins `run.ts` / `compact.ts` ; les tests uniquement utilitaires ne sont pas un
    substitut suffisant à ces chemins d'intégration.
- Note sur le pool :
  - La configuration de base Vitest utilise désormais `threads` par défaut.
  - La configuration Vitest partagée fixe également `isolate: false` et utilise l'exécuteur non isolé sur les projets racine, les configs e2e et live.
  - La voie UI racine conserve sa configuration et son optimiseur `jsdom`, mais s'exécute maintenant aussi sur l'exécuteur partagé non isolé.
  - Chaque fragment `pnpm test` hérite des mêmes valeurs par défaut `threads` + `isolate: false` depuis la configuration Vitest partagée.
  - Le lanceur partagé `scripts/run-vitest.mjs` ajoute désormais aussi `--no-maglev` par défaut pour les processus Node enfants de Vitest afin de réduire le churn de compilation V8 lors des grosses exécutions locales. Définissez `OPENCLAW_VITEST_ENABLE_MAGLEV=1` si vous devez comparer avec le comportement V8 standard.
- Note sur l'itération rapide locale :
  - `pnpm test:changed` passe par des voies ciblées lorsque les chemins modifiés correspondent clairement à une suite plus petite.
  - `pnpm test:max` et `pnpm test:changed:max` conservent le même comportement de routage, simplement avec une limite de workers plus élevée.
  - L'auto-adaptation locale des workers est désormais volontairement conservatrice et recule aussi lorsque la charge moyenne de l'hôte est déjà élevée, de sorte que plusieurs exécutions Vitest concurrentes causent moins de dégâts par défaut.
  - La configuration de base Vitest marque les projets/fichiers de configuration comme `forceRerunTriggers` afin que les relances en mode changed restent correctes lorsque le câblage des tests change.
  - La config maintient `OPENCLAW_VITEST_FS_MODULE_CACHE` activé sur les hôtes pris en charge ; définissez `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` si vous voulez un emplacement de cache explicite pour le profilage direct.
- Note de débogage des performances :
  - `pnpm test:perf:imports` active le rapport de durée d'import Vitest ainsi qu'une sortie de détail des imports.
  - `pnpm test:perf:imports:changed` limite cette même vue de profilage aux fichiers modifiés depuis `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` compare `test:changed` routé au chemin natif du projet racine pour ce diff validé et affiche le temps mur à mur ainsi que le RSS maximal macOS.
- `pnpm test:perf:changed:bench -- --worktree` mesure l'arbre sale courant en routant la liste des fichiers modifiés via `scripts/test-projects.mjs` et la config Vitest racine.
  - `pnpm test:perf:profile:main` écrit un profil CPU du thread principal pour les coûts de démarrage et de transformation de Vitest/Vite.
  - `pnpm test:perf:profile:runner` écrit des profils CPU+tas de l'exécuteur pour la suite unitaire avec le parallélisme des fichiers désactivé.

### E2E (smoke de la passerelle)

- Commande : `pnpm test:e2e`
- Config : `vitest.e2e.config.ts`
- Fichiers : `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts`
- Valeurs par défaut d'exécution :
  - Utilise Vitest `threads` avec `isolate: false`, en accord avec le reste du dépôt.
  - Utilise des workers adaptatifs (CI : jusqu'à 2, local : 1 par défaut).
  - S'exécute en mode silencieux par défaut pour réduire le coût des E/S console.
- Remplacements utiles :
  - `OPENCLAW_E2E_WORKERS=<n>` pour forcer le nombre de workers (plafonné à 16).
  - `OPENCLAW_E2E_VERBOSE=1` pour réactiver la sortie console détaillée.
- Portée :
  - Comportement end-to-end de passerelle multi-instance
  - Surfaces WebSocket/HTTP, appairage de nœuds et réseau plus lourd
- Attentes :
  - S'exécute en CI (lorsqu'activé dans le pipeline)
  - Aucune vraie clé requise
  - Plus de pièces mobiles que les tests unitaires (peut être plus lent)

### E2E : smoke du backend OpenShell

- Commande : `pnpm test:e2e:openshell`
- Fichier : `test/openshell-sandbox.e2e.test.ts`
- Portée :
  - Démarre une passerelle OpenShell isolée sur l'hôte via Docker
  - Crée un bac à sable à partir d'un Dockerfile local temporaire
  - Exerce le backend OpenShell d'OpenClaw sur de vrais `sandbox ssh-config` + exécution SSH
  - Vérifie le comportement du système de fichiers canonique à distance via le pont fs du bac à sable
- Attentes :
  - Optionnel uniquement ; ne fait pas partie de l'exécution par défaut `pnpm test:e2e`
  - Nécessite un CLI local `openshell` ainsi qu'un démon Docker fonctionnel
  - Utilise des `HOME` / `XDG_CONFIG_HOME` isolés, puis détruit la passerelle de test et le bac à sable
- Remplacements utiles :
  - `OPENCLAW_E2E_OPENSHELL=1` pour activer le test lors de l'exécution manuelle de la suite e2e plus large
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` pour pointer vers un binaire CLI ou script wrapper non par défaut

### Live (vrais fournisseurs + vrais modèles)

- Commande : `pnpm test:live`
- Config : `vitest.live.config.ts`
- Fichiers : `src/**/*.live.test.ts`
- Par défaut : **activé** par `pnpm test:live` (définit `OPENCLAW_LIVE_TEST=1`)
- Portée :
  - « Est-ce que ce fournisseur/modèle fonctionne réellement _aujourd'hui_ avec de vrais identifiants ? »
  - Détecter les changements de format de fournisseur, les particularités d'appel d'outil, les problèmes d'authentification et le comportement des limites de débit
- Attentes :
  - Pas stable en CI par nature (réseaux réels, politiques réelles des fournisseurs, quotas, pannes)
  - Coûte de l'argent / consomme des limites de débit
  - Préférez exécuter des sous-ensembles restreints plutôt que « tout »
- Les exécutions live chargent `~/.profile` pour récupérer les clés API manquantes.
- Par défaut, les exécutions live isolent toujours `HOME` et copient le matériel de config/auth dans un home de test temporaire afin que les fixtures unitaires ne puissent pas muter votre vrai `~/.openclaw`.
- Définissez `OPENCLAW_LIVE_USE_REAL_HOME=1` uniquement lorsque vous avez intentionnellement besoin que les tests live utilisent votre vrai répertoire home.
- `pnpm test:live` utilise désormais un mode plus discret par défaut : il conserve la sortie de progression `[live] ...`, mais supprime l'avis supplémentaire `~/.profile` et coupe les logs de démarrage de la passerelle/le bruit Bonjour. Définissez `OPENCLAW_LIVE_TEST_QUIET=0` si vous voulez retrouver les logs de démarrage complets.
- Rotation des clés API (spécifique au fournisseur) : définissez `*_API_KEYS` avec un format virgule/point-virgule ou `*_API_KEY_1`, `*_API_KEY_2` (par exemple `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) ou un remplacement par live via `OPENCLAW_LIVE_*_KEY` ; les tests réessaient en cas de réponses de limite de débit.
- Sortie de progression/heartbeat :
  - Les suites live émettent désormais des lignes de progression vers stderr afin que les longs appels fournisseur restent visiblement actifs même lorsque la capture console de Vitest est silencieuse.
  - `vitest.live.config.ts` désactive l'interception console de Vitest afin que les lignes de progression fournisseur/passerelle soient diffusées immédiatement pendant les exécutions live.
  - Ajustez les heartbeats des modèles directs avec `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Ajustez les heartbeats de passerelle/sonde avec `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Quelle suite dois-je exécuter ?

Utilisez ce tableau de décision :

- Modifier logique/tests : exécutez `pnpm test` (et `pnpm test:coverage` si vous avez beaucoup modifié)
- Toucher au réseau de la passerelle / protocole WS / appairage : ajoutez `pnpm test:e2e`
- Déboguer « mon bot est en panne » / échecs spécifiques au fournisseur / appel d'outil : exécutez un `pnpm test:live` restreint

## Live : balayage des capacités du nœud Android

- Test : `src/gateway/android-node.capabilities.live.test.ts`
- Script : `pnpm android:test:integration`
- Objectif : invoquer **chaque commande actuellement annoncée** par un nœud Android connecté et vérifier le comportement du contrat de commande.
- Portée :
  - Précondition/configuration manuelle (la suite n'installe, n'exécute ni n'appaire l'application).
  - Validation `node.invoke` de la passerelle commande par commande pour le nœud Android sélectionné.
- Préconfiguration requise :
  - Application Android déjà connectée et appairée à la passerelle.
  - Application maintenue au premier plan.
  - Autorisations/consentement de capture accordés pour les capacités que vous attendez voir réussir.
- Remplacements de cible facultatifs :
  - `OPENCLAW_ANDROID_NODE_ID` ou `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Détails complets de configuration Android : [Android App](/fr/platforms/android)

## Live : smoke de modèle (clés de profil)

Les tests live sont divisés en deux couches afin que nous puissions isoler les échecs :

- « Modèle direct » nous indique si le fournisseur/modèle peut répondre tout court avec la clé donnée.
- « Smoke de passerelle » nous indique si le pipeline complet passerelle+agent fonctionne pour ce modèle (sessions, historique, outils, politique de bac à sable, etc.).

### Couche 1 : complétion de modèle directe (sans passerelle)

- Test : `src/agents/models.profiles.live.test.ts`
- Objectif :
  - Énumérer les modèles découverts
  - Utiliser `getApiKeyForModel` pour sélectionner les modèles pour lesquels vous avez des identifiants
  - Exécuter une petite complétion par modèle (et des régressions ciblées si nécessaire)
- Comment l'activer :
  - `pnpm test:live` (ou `OPENCLAW_LIVE_TEST=1` si vous invoquez Vitest directement)
- Définissez `OPENCLAW_LIVE_MODELS=modern` (ou `all`, alias de modern) pour réellement exécuter cette suite ; sinon elle est ignorée afin de garder `pnpm test:live` centré sur le smoke de passerelle
- Comment sélectionner les modèles :
  - `OPENCLAW_LIVE_MODELS=modern` pour exécuter la liste d'autorisation moderne (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_MODELS=all` est un alias de la liste d'autorisation moderne
  - ou `OPENCLAW_LIVE_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,..."` (liste d'autorisation séparée par des virgules)
  - Les balayages modern/all utilisent par défaut un plafond organisé à fort signal ; définissez `OPENCLAW_LIVE_MAX_MODELS=0` pour un balayage moderne exhaustif ou un nombre positif pour un plafond plus petit.
- Comment sélectionner les fournisseurs :
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (liste d'autorisation séparée par des virgules)
- D'où viennent les clés :
  - Par défaut : magasin de profils et variables d'environnement de secours
  - Définissez `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` pour imposer **uniquement** le magasin de profils
- Pourquoi cela existe :
  - Sépare « l'API fournisseur est cassée / la clé est invalide » de « le pipeline d'agent de la passerelle est cassé »
  - Contient de petites régressions isolées (exemple : rejeu de raisonnement OpenAI Responses/Codex Responses + flux d'appels d'outils)

### Couche 2 : smoke passerelle + agent dev (ce que fait réellement "@openclaw")

- Test : `src/gateway/gateway-models.profiles.live.test.ts`
- Objectif :
  - Démarrer une passerelle en processus
  - Créer/mettre à jour une session `agent:dev:*` (remplacement de modèle à chaque exécution)
  - Itérer sur les modèles avec clés et vérifier :
    - réponse « significative » (sans outils)
    - un vrai appel d'outil fonctionne (sonde de lecture)
    - des sondes d'outil supplémentaires facultatives fonctionnent (sonde exec+read)
    - les chemins de régression OpenAI (appel d'outil seul → suivi) continuent de fonctionner
- Détails des sondes (pour pouvoir expliquer rapidement les échecs) :
  - sonde `read` : le test écrit un fichier nonce dans l'espace de travail et demande à l'agent de le `read` et de renvoyer le nonce.
  - sonde `exec+read` : le test demande à l'agent de `exec` l'écriture d'un nonce dans un fichier temporaire, puis de le `read`.
  - sonde d'image : le test joint un PNG généré (chat + code aléatoire) et attend que le modèle renvoie `cat <CODE>`.
  - Référence d'implémentation : `src/gateway/gateway-models.profiles.live.test.ts` et `src/gateway/live-image-probe.ts`.
- Comment l'activer :
  - `pnpm test:live` (ou `OPENCLAW_LIVE_TEST=1` si vous invoquez Vitest directement)
- Comment sélectionner les modèles :
  - Par défaut : liste d'autorisation moderne (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` est un alias de la liste d'autorisation moderne
  - Ou définissez `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (ou liste séparée par des virgules) pour restreindre
  - Les balayages modern/all de passerelle utilisent par défaut un plafond organisé à fort signal ; définissez `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` pour un balayage moderne exhaustif ou un nombre positif pour un plafond plus petit.
- Comment sélectionner les fournisseurs (évitez « tout OpenRouter ») :
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (liste d'autorisation séparée par des virgules)
- Les sondes d'outil + d'image sont toujours activées dans ce test live :
  - sonde `read` + sonde `exec+read` (stress sur les outils)
  - la sonde d'image s'exécute lorsque le modèle annonce la prise en charge des entrées image
  - Flux (haut niveau) :
    - Le test génère un petit PNG avec « CAT » + code aléatoire (`src/gateway/live-image-probe.ts`)
    - L'envoie via `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - La passerelle analyse les pièces jointes en `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - L'agent embarqué transmet au modèle un message utilisateur multimodal
    - Vérification : la réponse contient `cat` + le code (tolérance OCR : erreurs mineures autorisées)

Conseil : pour voir ce que vous pouvez tester sur votre machine (et les identifiants exacts `provider/model`), exécutez :

```bash
openclaw models list
openclaw models list --json
```

## Live : smoke du backend CLI (Claude, Codex, Gemini ou autres CLI locaux)

- Test : `src/gateway/gateway-cli-backend.live.test.ts`
- Objectif : valider le pipeline Gateway + agent à l'aide d'un backend CLI local, sans toucher à votre configuration par défaut.
- Les valeurs par défaut de smoke spécifiques au backend se trouvent avec la définition `cli-backend.ts` de l'extension propriétaire.
- Activer :
  - `pnpm test:live` (ou `OPENCLAW_LIVE_TEST=1` si vous invoquez Vitest directement)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Valeurs par défaut :
  - Fournisseur/modèle par défaut : `claude-cli/claude-sonnet-4-6`
  - Le comportement commande/args/image provient des métadonnées du plugin backend CLI propriétaire.
- Remplacements (facultatifs) :
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` pour envoyer une vraie pièce jointe image (les chemins sont injectés dans le prompt).
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` pour transmettre les chemins de fichiers image comme args CLI au lieu de l'injection dans le prompt.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (ou `"list"`) pour contrôler la manière dont les args image sont transmis lorsque `IMAGE_ARG` est défini.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` pour envoyer un second tour et valider le flux de reprise.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=0` pour désactiver la sonde par défaut de continuité de même session Claude Sonnet -> Opus (définissez-la à `1` pour l'activer de force lorsque le modèle sélectionné prend en charge une cible de changement).

Exemple :

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

Recette Docker :

```bash
pnpm test:docker:live-cli-backend
```

Recettes Docker à fournisseur unique :

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:codex
pnpm test:docker:live-cli-backend:gemini
```

Remarques :

- L'exécuteur Docker se trouve dans `scripts/test-live-cli-backend-docker.sh`.
- Il exécute le smoke live de backend CLI dans l'image Docker du dépôt en tant qu'utilisateur non root `node`.
- Il résout les métadonnées de smoke CLI à partir de l'extension propriétaire, puis installe le paquet CLI Linux correspondant (`@anthropic-ai/claude-code`, `@openai/codex` ou `@google/gemini-cli`) dans un préfixe accessible en écriture mis en cache à `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (par défaut : `~/.cache/openclaw/docker-cli-tools`).
- Le smoke live de backend CLI exerce maintenant le même flux end-to-end pour Claude, Codex et Gemini : tour texte, tour de classification d'image, puis appel d'outil MCP `cron` vérifié via le CLI de la passerelle.
- Le smoke par défaut de Claude met aussi à jour la session de Sonnet vers Opus et vérifie que la session reprise se souvient toujours d'une note antérieure.

## Live : smoke de liaison ACP (`/acp spawn ... --bind here`)

- Test : `src/gateway/gateway-acp-bind.live.test.ts`
- Objectif : valider le vrai flux de liaison de conversation ACP avec un agent ACP live :
  - envoyer `/acp spawn <agent> --bind here`
  - lier sur place une conversation synthétique de canal de message
  - envoyer un suivi normal sur cette même conversation
  - vérifier que le suivi arrive dans la transcription de session ACP liée
- Activer :
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Valeurs par défaut :
  - Agents ACP dans Docker : `claude,codex,gemini`
  - Agent ACP pour `pnpm test:live ...` direct : `claude`
  - Canal synthétique : contexte de conversation de type message privé Slack
  - Backend ACP : `acpx`
- Remplacements :
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
- Remarques :
  - Cette voie utilise la surface `chat.send` de la passerelle avec des champs de route d'origine synthétiques réservés aux admins afin que les tests puissent attacher un contexte de canal de message sans prétendre livrer à l'extérieur.
  - Lorsque `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` n'est pas défini, le test utilise le registre d'agents intégré du plugin embarqué `acpx` pour l'agent de harness ACP sélectionné.

Exemple :

```bash
OPENCLAW_LIVE_ACP_BIND=1 \
  OPENCLAW_LIVE_ACP_BIND_AGENT=claude \
  pnpm test:live src/gateway/gateway-acp-bind.live.test.ts
```

Recette Docker :

```bash
pnpm test:docker:live-acp-bind
```

Recettes Docker à agent unique :

```bash
pnpm test:docker:live-acp-bind:claude
pnpm test:docker:live-acp-bind:codex
pnpm test:docker:live-acp-bind:gemini
```

Remarques Docker :

- L'exécuteur Docker se trouve dans `scripts/test-live-acp-bind-docker.sh`.
- Par défaut, il exécute le smoke de liaison ACP sur tous les agents CLI live pris en charge en séquence : `claude`, `codex`, puis `gemini`.
- Utilisez `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex` ou `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` pour restreindre la matrice.
- Il charge `~/.profile`, prépare le matériel d'auth CLI correspondant dans le conteneur, installe `acpx` dans un préfixe npm accessible en écriture, puis installe le CLI live demandé (`@anthropic-ai/claude-code`, `@openai/codex` ou `@google/gemini-cli`) s'il manque.
- À l'intérieur de Docker, l'exécuteur définit `OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND=$HOME/.npm-global/bin/acpx` afin qu'acpx conserve pour le CLI de harness enfant les variables d'environnement fournisseur issues du profil chargé.

### Recettes live recommandées

Des listes d'autorisation étroites et explicites sont les plus rapides et les moins fragiles :

- Modèle unique, direct (sans passerelle) :
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.4" pnpm test:live src/agents/models.profiles.live.test.ts`

- Modèle unique, smoke de passerelle :
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Appel d'outil sur plusieurs fournisseurs :
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Focus Google (clé API Gemini + Antigravity) :
  - Gemini (clé API) : `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth) : `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

Remarques :

- `google/...` utilise l'API Gemini (clé API).
- `google-antigravity/...` utilise le pont OAuth Antigravity (point de terminaison d'agent de style Cloud Code Assist).
- `google-gemini-cli/...` utilise le CLI Gemini local sur votre machine (authentification distincte + particularités des outils).
- API Gemini vs CLI Gemini :
  - API : OpenClaw appelle l'API Gemini hébergée de Google via HTTP (clé API / authentification de profil) ; c'est ce que la plupart des utilisateurs veulent dire par « Gemini ».
  - CLI : OpenClaw exécute un binaire local `gemini` ; il a sa propre authentification et peut se comporter différemment (streaming/prise en charge des outils/décalage de version).

## Live : matrice de modèles (ce que nous couvrons)

Il n'existe pas de « liste de modèles CI » fixe (live est optionnel), mais voici les modèles **recommandés** à couvrir régulièrement sur une machine de développement avec clés.

### Ensemble smoke moderne (appel d'outil + image)

Il s'agit de l'exécution « modèles courants » que nous attendons de voir fonctionner :

- OpenAI (hors Codex) : `openai/gpt-5.4` (facultatif : `openai/gpt-5.4-mini`)
- OpenAI Codex : `openai-codex/gpt-5.4`
- Anthropic : `anthropic/claude-opus-4-6` (ou `anthropic/claude-sonnet-4-6`)
- Google (API Gemini) : `google/gemini-3.1-pro-preview` et `google/gemini-3-flash-preview` (évitez les anciens modèles Gemini 2.x)
- Google (Antigravity) : `google-antigravity/claude-opus-4-6-thinking` et `google-antigravity/gemini-3-flash`
- Z.AI (GLM) : `zai/glm-4.7`
- MiniMax : `minimax/MiniMax-M2.7`

Exécuter le smoke de passerelle avec outils + image :
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,openai-codex/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Référence : appel d'outil (Read + Exec facultatif)

Choisissez-en au moins un par famille de fournisseurs :

- OpenAI : `openai/gpt-5.4` (ou `openai/gpt-5.4-mini`)
- Anthropic : `anthropic/claude-opus-4-6` (ou `anthropic/claude-sonnet-4-6`)
- Google : `google/gemini-3-flash-preview` (ou `google/gemini-3.1-pro-preview`)
- Z.AI (GLM) : `zai/glm-4.7`
- MiniMax : `minimax/MiniMax-M2.7`

Couverture supplémentaire facultative (agréable à avoir) :

- xAI : `xai/grok-4` (ou la dernière version disponible)
- Mistral : `mistral/`… (choisissez un modèle compatible « tools » que vous avez activé)
- Cerebras : `cerebras/`… (si vous y avez accès)
- LM Studio : `lmstudio/`… (local ; l'appel d'outil dépend du mode API)

### Vision : envoi d'image (pièce jointe → message multimodal)

Incluez au moins un modèle compatible image dans `OPENCLAW_LIVE_GATEWAY_MODELS` (variants compatibles vision de Claude/Gemini/OpenAI, etc.) pour exercer la sonde d'image.

### Agrégateurs / passerelles alternatives

Si vous avez des clés activées, nous prenons aussi en charge les tests via :

- OpenRouter : `openrouter/...` (des centaines de modèles ; utilisez `openclaw models scan` pour trouver des candidats compatibles outil+image)
- OpenCode : `opencode/...` pour Zen et `opencode-go/...` pour Go (auth via `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Autres fournisseurs que vous pouvez inclure dans la matrice live (si vous avez les identifiants/la config) :

- Intégrés : `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- Via `models.providers` (points de terminaison personnalisés) : `minimax` (cloud/API), plus tout proxy compatible OpenAI/Anthropic (LM Studio, vLLM, LiteLLM, etc.)

Conseil : n'essayez pas de coder en dur « tous les modèles » dans la documentation. La liste faisant autorité est celle que `discoverModels(...)` renvoie sur votre machine + les clés disponibles.

## Identifiants (ne jamais valider dans git)

Les tests live découvrent les identifiants de la même manière que le CLI. Conséquences pratiques :

- Si le CLI fonctionne, les tests live devraient trouver les mêmes clés.
- Si un test live indique « aucun identifiant », déboguez-le comme vous débogueriez `openclaw models list` / la sélection de modèle.

- Profils d'authentification par agent : `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (c'est ce que signifient les « clés de profil » dans les tests live)
- Config : `~/.openclaw/openclaw.json` (ou `OPENCLAW_CONFIG_PATH`)
- Ancien répertoire d'état : `~/.openclaw/credentials/` (copié dans le home live préparé lorsqu'il est présent, mais pas dans le magasin principal de clés de profil)
- Les exécutions live locales copient par défaut la config active, les fichiers `auth-profiles.json` par agent, l'ancien `credentials/` et les répertoires d'auth CLI externes pris en charge dans un home de test temporaire ; les homes live préparés ignorent `workspace/` et `sandboxes/`, et les remplacements de chemin `agents.*.workspace` / `agentDir` sont supprimés afin que les sondes restent hors de votre véritable espace de travail hôte.

Si vous voulez vous appuyer sur des clés d'environnement (par ex. exportées dans votre `~/.profile`), exécutez les tests locaux après `source ~/.profile`, ou utilisez les exécuteurs Docker ci-dessous (ils peuvent monter `~/.profile` dans le conteneur).

## Live Deepgram (transcription audio)

- Test : `src/media-understanding/providers/deepgram/audio.live.test.ts`
- Activer : `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live src/media-understanding/providers/deepgram/audio.live.test.ts`

## Live du plan de codage BytePlus

- Test : `src/agents/byteplus.live.test.ts`
- Activer : `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live src/agents/byteplus.live.test.ts`
- Remplacement de modèle facultatif : `BYTEPLUS_CODING_MODEL=ark-code-latest`

## Live des médias de workflow ComfyUI

- Test : `extensions/comfy/comfy.live.test.ts`
- Activer : `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- Portée :
  - Exerce les chemins groupés comfy image, vidéo et `music_generate`
  - Ignore chaque capacité à moins que `models.providers.comfy.<capability>` ne soit configuré
  - Utile après avoir modifié l'envoi de workflow comfy, le polling, les téléchargements ou l'enregistrement de plugin

## Live de génération d'image

- Test : `src/image-generation/runtime.live.test.ts`
- Commande : `pnpm test:live src/image-generation/runtime.live.test.ts`
- Harness : `pnpm test:live:media image`
- Portée :
  - Énumère chaque plugin fournisseur de génération d'image enregistré
  - Charge les variables d'environnement fournisseur manquantes depuis votre shell de connexion (`~/.profile`) avant le sondage
  - Utilise par défaut les clés API live/env avant les profils d'auth stockés, afin que des clés de test obsolètes dans `auth-profiles.json` ne masquent pas les vrais identifiants du shell
  - Ignore les fournisseurs sans auth/profil/modèle utilisable
  - Exécute les variantes standard de génération d'image via la capacité d'exécution partagée :
    - `google:flash-generate`
    - `google:pro-generate`
    - `google:pro-edit`
    - `openai:default-generate`
- Fournisseurs groupés actuellement couverts :
  - `openai`
  - `google`
- Restriction facultative :
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-1,google/gemini-3.1-flash-image-preview"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit"`
- Comportement d'authentification facultatif :
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` pour forcer l'authentification par magasin de profils et ignorer les remplacements uniquement env

## Live de génération musicale

- Test : `extensions/music-generation-providers.live.test.ts`
- Activer : `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harness : `pnpm test:live:media music`
- Portée :
  - Exerce le chemin partagé du fournisseur groupé de génération musicale
  - Couvre actuellement Google et MiniMax
  - Charge les variables d'environnement fournisseur depuis votre shell de connexion (`~/.profile`) avant le sondage
  - Utilise par défaut les clés API live/env avant les profils d'auth stockés, afin que des clés de test obsolètes dans `auth-profiles.json` ne masquent pas les vrais identifiants du shell
  - Ignore les fournisseurs sans auth/profil/modèle utilisable
  - Exécute les deux modes d'exécution déclarés lorsqu'ils sont disponibles :
    - `generate` avec entrée basée uniquement sur le prompt
    - `edit` lorsque le fournisseur déclare `capabilities.edit.enabled`
  - Couverture actuelle de la voie partagée :
    - `google` : `generate`, `edit`
    - `minimax` : `generate`
    - `comfy` : fichier live Comfy séparé, pas ce balayage partagé
- Restriction facultative :
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.5+"`
- Comportement d'authentification facultatif :
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` pour forcer l'authentification par magasin de profils et ignorer les remplacements uniquement env

## Live de génération vidéo

- Test : `extensions/video-generation-providers.live.test.ts`
- Activer : `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harness : `pnpm test:live:media video`
- Portée :
  - Exerce le chemin partagé du fournisseur groupé de génération vidéo
  - Charge les variables d'environnement fournisseur depuis votre shell de connexion (`~/.profile`) avant le sondage
  - Utilise par défaut les clés API live/env avant les profils d'auth stockés, afin que des clés de test obsolètes dans `auth-profiles.json` ne masquent pas les vrais identifiants du shell
  - Ignore les fournisseurs sans auth/profil/modèle utilisable
  - Exécute les deux modes d'exécution déclarés lorsqu'ils sont disponibles :
    - `generate` avec entrée basée uniquement sur le prompt
    - `imageToVideo` lorsque le fournisseur déclare `capabilities.imageToVideo.enabled` et que le fournisseur/modèle sélectionné accepte en balayage partagé une entrée image locale adossée à un buffer
    - `videoToVideo` lorsque le fournisseur déclare `capabilities.videoToVideo.enabled` et que le fournisseur/modèle sélectionné accepte en balayage partagé une entrée vidéo locale adossée à un buffer
  - Fournisseurs `imageToVideo` actuellement déclarés mais ignorés dans le balayage partagé :
    - `vydra` parce que `veo3` groupé est texte uniquement et que `kling` groupé exige une URL d'image distante
  - Couverture Vydra spécifique au fournisseur :
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - ce fichier exécute `veo3` en texte-vers-vidéo plus une voie `kling` qui utilise par défaut une fixture d'URL d'image distante
  - Couverture live actuelle `videoToVideo` :
    - `runway` uniquement lorsque le modèle sélectionné est `runway/gen4_aleph`
  - Fournisseurs `videoToVideo` actuellement déclarés mais ignorés dans le balayage partagé :
    - `alibaba`, `qwen`, `xai` parce que ces chemins exigent actuellement des URL de référence distantes `http(s)` / MP4
    - `google` parce que la voie partagée actuelle Gemini/Veo utilise une entrée locale adossée à un buffer et que ce chemin n'est pas accepté dans le balayage partagé
    - `openai` parce que la voie partagée actuelle ne garantit pas l'accès spécifique à l'organisation pour l'inpainting/remix vidéo
- Restriction facultative :
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
- Comportement d'authentification facultatif :
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` pour forcer l'authentification par magasin de profils et ignorer les remplacements uniquement env

## Harness live média

- Commande : `pnpm test:live:media`
- Objectif :
  - Exécute les suites live partagées image, musique et vidéo via un point d'entrée natif du dépôt
  - Charge automatiquement les variables d'environnement fournisseur manquantes depuis `~/.profile`
  - Restreint automatiquement chaque suite aux fournisseurs qui disposent actuellement d'une authentification utilisable par défaut
  - Réutilise `scripts/test-live.mjs`, afin que le comportement heartbeat et mode silencieux reste cohérent
- Exemples :
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Exécuteurs Docker (vérifications facultatives « fonctionne sous Linux »)

Ces exécuteurs Docker se divisent en deux catégories :

- Exécuteurs live-model : `test:docker:live-models` et `test:docker:live-gateway` n'exécutent que leur fichier live de clés de profil correspondant à l'intérieur de l'image Docker du dépôt (`src/agents/models.profiles.live.test.ts` et `src/gateway/gateway-models.profiles.live.test.ts`), en montant votre répertoire de config local et votre espace de travail (et en chargeant `~/.profile` s'il est monté). Les points d'entrée locaux correspondants sont `test:live:models-profiles` et `test:live:gateway-profiles`.
- Les exécuteurs live Docker utilisent par défaut un plafond de smoke plus petit pour qu'un balayage Docker complet reste pratique :
  `test:docker:live-models` utilise par défaut `OPENCLAW_LIVE_MAX_MODELS=12`, et
  `test:docker:live-gateway` utilise par défaut `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`, et
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Remplacez ces variables d'environnement lorsque vous
  voulez explicitement l'analyse exhaustive plus large.
- `test:docker:all` construit l'image Docker live une fois via `test:docker:live-build`, puis la réutilise pour les deux voies Docker live.
- Exécuteurs de smoke conteneur : `test:docker:openwebui`, `test:docker:onboard`, `test:docker:gateway-network`, `test:docker:mcp-channels` et `test:docker:plugins` démarrent un ou plusieurs vrais conteneurs et vérifient des chemins d'intégration de plus haut niveau.

Les exécuteurs Docker live-model montent aussi seulement les homes d'auth CLI nécessaires (ou tous ceux pris en charge lorsque l'exécution n'est pas restreinte), puis les copient dans le home du conteneur avant l'exécution afin que l'OAuth des CLI externes puisse actualiser les jetons sans muter le magasin d'auth de l'hôte :

- Modèles directs : `pnpm test:docker:live-models` (script : `scripts/test-live-models-docker.sh`)
- Smoke de liaison ACP : `pnpm test:docker:live-acp-bind` (script : `scripts/test-live-acp-bind-docker.sh`)
- Smoke du backend CLI : `pnpm test:docker:live-cli-backend` (script : `scripts/test-live-cli-backend-docker.sh`)
- Passerelle + agent dev : `pnpm test:docker:live-gateway` (script : `scripts/test-live-gateway-models-docker.sh`)
- Smoke live Open WebUI : `pnpm test:docker:openwebui` (script : `scripts/e2e/openwebui-docker.sh`)
- Assistant d'onboarding (TTY, scaffolding complet) : `pnpm test:docker:onboard` (script : `scripts/e2e/onboard-docker.sh`)
- Réseau de passerelle (deux conteneurs, auth WS + état de santé) : `pnpm test:docker:gateway-network` (script : `scripts/e2e/gateway-network-docker.sh`)
- Pont de canal MCP (Gateway initialisée + pont stdio + smoke brut du cadre de notification Claude) : `pnpm test:docker:mcp-channels` (script : `scripts/e2e/mcp-channels-docker.sh`)
- Plugins (smoke d'installation + alias `/plugin` + sémantique de redémarrage du bundle Claude) : `pnpm test:docker:plugins` (script : `scripts/e2e/plugins-docker.sh`)

Les exécuteurs Docker live-model montent aussi la checkout actuelle en lecture seule et
la préparent dans un répertoire de travail temporaire à l'intérieur du conteneur. Cela garde l'image d'exécution
légère tout en exécutant Vitest sur votre source/config locale exacte.
L'étape de préparation ignore les gros caches uniquement locaux et les sorties de build d'application comme
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__`, ainsi que les répertoires de sortie locaux `.build` ou
Gradle, afin que les exécutions live Docker ne passent pas des minutes à copier
des artefacts spécifiques à la machine.
Ils définissent aussi `OPENCLAW_SKIP_CHANNELS=1` afin que les sondes live de passerelle ne démarrent pas
de vrais workers de canal Telegram/Discord/etc. dans le conteneur.
`test:docker:live-models` exécute toujours `pnpm test:live`, donc transmettez aussi
`OPENCLAW_LIVE_GATEWAY_*` lorsque vous devez restreindre ou exclure la couverture live
de passerelle de cette voie Docker.
`test:docker:openwebui` est un smoke de compatibilité de plus haut niveau : il démarre un
conteneur de passerelle OpenClaw avec les points de terminaison HTTP compatibles OpenAI activés,
démarre un conteneur Open WebUI épinglé contre cette passerelle, se connecte via
Open WebUI, vérifie que `/api/models` expose `openclaw/default`, puis envoie une
vraie requête de chat via le proxy `/api/chat/completions` d'Open WebUI.
La première exécution peut être sensiblement plus lente car Docker peut devoir récupérer l'image
Open WebUI et Open WebUI peut devoir terminer sa propre initialisation à froid.
Cette voie attend une clé de modèle live utilisable, et `OPENCLAW_PROFILE_FILE`
(`~/.profile` par défaut) est le moyen principal de la fournir dans les exécutions Docker.
Les exécutions réussies affichent une petite charge utile JSON comme `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` est volontairement déterministe et n'a pas besoin d'un
vrai compte Telegram, Discord ou iMessage. Il démarre un conteneur Gateway
initialisé, lance un second conteneur qui exécute `openclaw mcp serve`, puis
vérifie la découverte des conversations routées, les lectures de transcription, les métadonnées de pièce jointe,
le comportement de la file d'événements live, le routage des envois sortants, et les notifications
de canal + autorisation de style Claude sur le vrai pont MCP stdio. La vérification des notifications
inspecte directement les cadres MCP stdio bruts afin que le smoke valide ce que le
pont émet réellement, et non simplement ce qu'un SDK client particulier choisit d'exposer.

Smoke manuel ACP en langage courant (pas CI) :

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Conservez ce script pour les workflows de régression/débogage. Il pourra être à nouveau nécessaire pour la validation du routage de thread ACP, donc ne le supprimez pas.

Variables d'environnement utiles :

- `OPENCLAW_CONFIG_DIR=...` (par défaut : `~/.openclaw`) monté vers `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (par défaut : `~/.openclaw/workspace`) monté vers `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (par défaut : `~/.profile`) monté vers `/home/node/.profile` et chargé avant l'exécution des tests
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (par défaut : `~/.cache/openclaw/docker-cli-tools`) monté vers `/home/node/.npm-global` pour les installations CLI mises en cache dans Docker
- Les répertoires/fichiers d'auth CLI externes sous `$HOME` sont montés en lecture seule sous `/host-auth...`, puis copiés dans `/home/node/...` avant le démarrage des tests
  - Répertoires par défaut : `.minimax`
  - Fichiers par défaut : `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Les exécutions restreintes à un fournisseur ne montent que les répertoires/fichiers nécessaires déduits à partir de `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Remplacement manuel avec `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none`, ou une liste séparée par des virgules comme `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` pour restreindre l'exécution
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` pour filtrer les fournisseurs dans le conteneur
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` pour garantir que les identifiants proviennent du magasin de profils (pas de l'env)
- `OPENCLAW_OPENWEBUI_MODEL=...` pour choisir le modèle exposé par la passerelle pour le smoke Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` pour remplacer le prompt de vérification du nonce utilisé par le smoke Open WebUI
- `OPENWEBUI_IMAGE=...` pour remplacer la balise d'image Open WebUI épinglée

## Vérification de la documentation

Exécutez les vérifications de docs après modification de la documentation : `pnpm check:docs`.
Exécutez la validation complète des ancres Mintlify lorsque vous avez aussi besoin de vérifications des titres dans la page : `pnpm docs:check-links:anchors`.

## Régression hors ligne (sans danger pour la CI)

Il s'agit de régressions de « vrai pipeline » sans vrais fournisseurs :

- Appel d'outil de passerelle (OpenAI simulé, vraie boucle passerelle + agent) : `src/gateway/gateway.test.ts` (cas : "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Assistant de passerelle (WS `wizard.start`/`wizard.next`, écrit config + auth imposée) : `src/gateway/gateway.test.ts` (cas : "runs wizard over ws and writes auth token config")

## Évaluations de fiabilité des agents (Skills)

Nous avons déjà quelques tests sans danger pour la CI qui se comportent comme des « évaluations de fiabilité des agents » :

- Appel d'outil simulé via la vraie boucle passerelle + agent (`src/gateway/gateway.test.ts`).
- Flux d'assistant de bout en bout qui valident le câblage de session et les effets de configuration (`src/gateway/gateway.test.ts`).

Ce qui manque encore pour les Skills (voir [Skills](/fr/tools/skills)) :

- **Prise de décision :** lorsque les skills sont listées dans le prompt, l'agent choisit-il la bonne skill (ou évite-t-il les skills non pertinentes) ?
- **Conformité :** l'agent lit-il `SKILL.md` avant utilisation et suit-il les étapes/args requis ?
- **Contrats de workflow :** scénarios multi-tours qui vérifient l'ordre des outils, le report de l'historique de session et les limites du bac à sable.

Les futures évaluations doivent d'abord rester déterministes :

- Un exécuteur de scénarios utilisant des fournisseurs simulés pour vérifier les appels d'outils + leur ordre, les lectures de fichiers skill et le câblage des sessions.
- Une petite suite de scénarios centrés sur les skills (utiliser vs éviter, barrières, injection de prompt).
- Des évaluations live facultatives (optionnelles, contrôlées par env) uniquement après la mise en place de la suite sans danger pour la CI.

## Tests de contrat (forme des plugins et des canaux)

Les tests de contrat vérifient que chaque plugin et canal enregistré respecte son
contrat d'interface. Ils itèrent sur tous les plugins découverts et exécutent une suite de
vérifications de forme et de comportement. La voie unitaire par défaut `pnpm test`
ignore volontairement ces fichiers de smoke et de couture partagée ; exécutez les commandes de contrat explicitement
lorsque vous touchez à des surfaces partagées de canal ou de fournisseur.

### Commandes

- Tous les contrats : `pnpm test:contracts`
- Contrats de canaux uniquement : `pnpm test:contracts:channels`
- Contrats de fournisseurs uniquement : `pnpm test:contracts:plugins`

### Contrats de canaux

Situés dans `src/channels/plugins/contracts/*.contract.test.ts` :

- **plugin** - Forme de base du plugin (id, nom, capacités)
- **setup** - Contrat de l'assistant de configuration
- **session-binding** - Comportement de liaison de session
- **outbound-payload** - Structure de charge utile du message
- **inbound** - Gestion des messages entrants
- **actions** - Gestionnaires d'actions du canal
- **threading** - Gestion des ID de fil
- **directory** - API d'annuaire/de registre
- **group-policy** - Application de la politique de groupe

### Contrats d'état des fournisseurs

Situés dans `src/plugins/contracts/*.contract.test.ts`.

- **status** - Sondes d'état des canaux
- **registry** - Forme du registre de plugins

### Contrats des fournisseurs

Situés dans `src/plugins/contracts/*.contract.test.ts` :

- **auth** - Contrat du flux d'authentification
- **auth-choice** - Choix/sélection de l'authentification
- **catalog** - API du catalogue de modèles
- **discovery** - Découverte de plugins
- **loader** - Chargement de plugins
- **runtime** - Exécution du fournisseur
- **shape** - Forme/interface du plugin
- **wizard** - Assistant de configuration

### Quand les exécuter

- Après avoir modifié des exports ou sous-chemins `plugin-sdk`
- Après avoir ajouté ou modifié un plugin de canal ou de fournisseur
- Après avoir refactorisé l'enregistrement ou la découverte des plugins

Les tests de contrat s'exécutent en CI et ne nécessitent pas de vraies clés API.

## Ajouter des régressions (guide)

Lorsque vous corrigez un problème de fournisseur/modèle découvert en live :

- Ajoutez si possible une régression sans danger pour la CI (simuler/stubber le fournisseur, ou capturer la transformation exacte de forme de requête)
- Si le problème est intrinsèquement live-only (limites de débit, politiques d'auth), gardez le test live étroit et optionnel via des variables d'environnement
- Préférez cibler la plus petite couche qui détecte le bug :
  - bug de conversion/rejeu de requête fournisseur → test de modèles directs
  - bug du pipeline session/historique/outils de la passerelle → smoke live de passerelle ou test mock de passerelle sans danger pour la CI
- Garde-fou sur la traversée SecretRef :
  - `src/secrets/exec-secret-ref-id-parity.test.ts` dérive une cible échantillonnée par classe SecretRef à partir des métadonnées du registre (`listSecretTargetRegistryEntries()`), puis vérifie que les identifiants exec de segment de traversée sont rejetés.
  - Si vous ajoutez une nouvelle famille de cibles SecretRef `includeInPlan` dans `src/secrets/target-registry-data.ts`, mettez à jour `classifyTargetClass` dans ce test. Le test échoue volontairement sur les identifiants de cible non classifiés afin que de nouvelles classes ne puissent pas être ignorées silencieusement.
