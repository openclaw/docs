---
read_when:
    - Exécution de tests smoke live de matrice de modèles / backends CLI / ACP / fournisseurs de médias
    - Débogage de la résolution des identifiants des tests live
    - Ajout d’un nouveau test live spécifique à un fournisseur
sidebarTitle: Live tests
summary: 'Tests live (avec accès réseau) : matrice de modèles, backends CLI, ACP, fournisseurs de médias, identifiants'
title: 'Tests : suites live'
x-i18n:
    generated_at: "2026-04-25T13:49:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: b9b2c2954eddd1b911dde5bb3a834a6f9429c91429f3fb07a509eec80183cc52
    source_path: help/testing-live.md
    workflow: 15
---

Pour le démarrage rapide, les exécuteurs QA, les suites unitaires/d’intégration et les flux Docker, voir
[Testing](/fr/help/testing). Cette page couvre les suites de tests **live** (avec accès réseau) :
matrice de modèles, backends CLI, ACP et tests live de fournisseurs de médias, ainsi que la
gestion des identifiants.

## Live : commandes smoke de profil local

Sourcez `~/.profile` avant des vérifications live ad hoc afin que les clés des fournisseurs et les chemins des outils locaux
correspondent à votre shell :

```bash
source ~/.profile
```

Smoke média sûr :

```bash
pnpm openclaw infer tts convert --local --json \
  --text "OpenClaw live smoke." \
  --output /tmp/openclaw-live-smoke.mp3
```

Smoke sûr de préparation voice-call :

```bash
pnpm openclaw voicecall setup --json
pnpm openclaw voicecall smoke --to "+15555550123"
```

`voicecall smoke` est une simulation à sec sauf si `--yes` est aussi présent. Utilisez `--yes` uniquement
lorsque vous voulez intentionnellement passer un véritable appel de notification. Pour Twilio, Telnyx et
Plivo, une vérification de préparation réussie nécessite une URL Webhook publique ; les replis locaux
en loopback/privé sont rejetés par conception.

## Live : balayage des fonctionnalités du nœud Android

- Test : `src/gateway/android-node.capabilities.live.test.ts`
- Script : `pnpm android:test:integration`
- Objectif : invoquer **chaque commande actuellement annoncée** par un nœud Android connecté et vérifier le comportement du contrat de commande.
- Portée :
  - Configuration préalable/manuelle (la suite n’installe pas, n’exécute pas et n’appaire pas l’app).
  - Validation gateway `node.invoke` commande par commande pour le nœud Android sélectionné.
- Préconfiguration requise :
  - App Android déjà connectée + appairée à la gateway.
  - App maintenue au premier plan.
  - Permissions/consentements de capture accordés pour les fonctionnalités que vous attendez comme réussies.
- Remplacements de cible facultatifs :
  - `OPENCLAW_ANDROID_NODE_ID` ou `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Détails complets de la configuration Android : [App Android](/fr/platforms/android)

## Live : smoke de modèles (clés de profil)

Les tests live sont divisés en deux couches afin de pouvoir isoler les échecs :

- « Modèle direct » nous dit si le fournisseur/modèle peut répondre tout court avec la clé donnée.
- « Gateway smoke » nous dit si le pipeline complet gateway+agent fonctionne pour ce modèle (sessions, historique, outils, politique sandbox, etc.).

### Couche 1 : complétion directe de modèle (sans gateway)

- Test : `src/agents/models.profiles.live.test.ts`
- Objectif :
  - Énumérer les modèles découverts
  - Utiliser `getApiKeyForModel` pour sélectionner les modèles pour lesquels vous avez des identifiants
  - Exécuter une petite complétion par modèle (et des régressions ciblées si nécessaire)
- Comment l’activer :
  - `pnpm test:live` (ou `OPENCLAW_LIVE_TEST=1` si vous invoquez Vitest directement)
- Définissez `OPENCLAW_LIVE_MODELS=modern` (ou `all`, alias de modern) pour réellement exécuter cette suite ; sinon elle est ignorée afin que `pnpm test:live` reste centré sur le smoke gateway
- Comment sélectionner les modèles :
  - `OPENCLAW_LIVE_MODELS=modern` pour exécuter la liste d’autorisations moderne (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_MODELS=all` est un alias de la liste d’autorisations moderne
  - ou `OPENCLAW_LIVE_MODELS="openai/gpt-5.2,openai-codex/gpt-5.2,anthropic/claude-opus-4-6,..."` (liste d’autorisations séparée par des virgules)
  - Les balayages modern/all utilisent par défaut une limite sélectionnée à fort signal ; définissez `OPENCLAW_LIVE_MAX_MODELS=0` pour un balayage moderne exhaustif ou un nombre positif pour une limite plus petite.
  - Les balayages exhaustifs utilisent `OPENCLAW_LIVE_TEST_TIMEOUT_MS` pour le délai d’expiration total du test de modèle direct. Par défaut : 60 minutes.
  - Les sondes de modèle direct s’exécutent avec un parallélisme de 20 par défaut ; définissez `OPENCLAW_LIVE_MODEL_CONCURRENCY` pour le remplacer.
- Comment sélectionner les fournisseurs :
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (liste d’autorisations séparée par des virgules)
- D’où viennent les clés :
  - Par défaut : stockage de profils et replis d’environnement
  - Définissez `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` pour imposer le **stockage de profils** uniquement
- Pourquoi cela existe :
  - Sépare « l’API du fournisseur est cassée / la clé est invalide » de « le pipeline d’agent gateway est cassé »
  - Contient de petites régressions isolées (exemple : rejouage du raisonnement OpenAI Responses/Codex Responses + flux d’appels d’outils)

### Couche 2 : smoke Gateway + agent dev (ce que fait réellement « @openclaw »)

- Test : `src/gateway/gateway-models.profiles.live.test.ts`
- Objectif :
  - Démarrer une gateway en processus
  - Créer/modifier une session `agent:dev:*` (remplacement du modèle à chaque exécution)
  - Itérer sur les modèles avec clés et vérifier :
    - une réponse « significative » (sans outils)
    - qu’une véritable invocation d’outil fonctionne (sonde de lecture)
    - des sondes d’outils supplémentaires facultatives (sonde exec+read)
    - que les chemins de régression OpenAI (appel d’outil uniquement → suivi) continuent de fonctionner
- Détails des sondes (pour que vous puissiez expliquer rapidement les échecs) :
  - sonde `read` : le test écrit un fichier nonce dans l’espace de travail et demande à l’agent de le `read` et de renvoyer le nonce.
  - sonde `exec+read` : le test demande à l’agent d’écrire un nonce via `exec` dans un fichier temporaire, puis de le relire avec `read`.
  - sonde image : le test joint un PNG généré (chat + code aléatoire) et attend que le modèle renvoie `cat <CODE>`.
  - Référence d’implémentation : `src/gateway/gateway-models.profiles.live.test.ts` et `src/gateway/live-image-probe.ts`.
- Comment l’activer :
  - `pnpm test:live` (ou `OPENCLAW_LIVE_TEST=1` si vous invoquez Vitest directement)
- Comment sélectionner les modèles :
  - Par défaut : liste d’autorisations moderne (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` est un alias de la liste d’autorisations moderne
  - Ou définissez `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (ou une liste séparée par des virgules) pour restreindre
  - Les balayages gateway modern/all utilisent par défaut une limite sélectionnée à fort signal ; définissez `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` pour un balayage moderne exhaustif ou un nombre positif pour une limite plus petite.
- Comment sélectionner les fournisseurs (éviter « tout OpenRouter ») :
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (liste d’autorisations séparée par des virgules)
- Les sondes d’outil + d’image sont toujours activées dans ce test live :
  - sonde `read` + sonde `exec+read` (stress des outils)
  - la sonde image s’exécute lorsque le modèle annonce la prise en charge des entrées image
  - Flux (vue d’ensemble) :
    - Le test génère un minuscule PNG avec « CAT » + code aléatoire (`src/gateway/live-image-probe.ts`)
    - L’envoie via `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - La Gateway analyse les pièces jointes dans `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - L’agent embarqué transmet un message utilisateur multimodal au modèle
    - Vérification : la réponse contient `cat` + le code (tolérance OCR : erreurs mineures autorisées)

Conseil : pour voir ce que vous pouvez tester sur votre machine (et les identifiants exacts `provider/model`), exécutez :

```bash
openclaw models list
openclaw models list --json
```

## Live : smoke de backend CLI (Claude, Codex, Gemini ou autres CLI locales)

- Test : `src/gateway/gateway-cli-backend.live.test.ts`
- Objectif : valider le pipeline Gateway + agent à l’aide d’un backend CLI local, sans toucher à votre configuration par défaut.
- Les valeurs smoke par défaut spécifiques au backend se trouvent avec la définition `cli-backend.ts` de l’extension propriétaire.
- Activer :
  - `pnpm test:live` (ou `OPENCLAW_LIVE_TEST=1` si vous invoquez Vitest directement)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Valeurs par défaut :
  - Fournisseur/modèle par défaut : `claude-cli/claude-sonnet-4-6`
  - Le comportement command/args/image provient des métadonnées du plugin backend CLI propriétaire.
- Remplacements (facultatifs) :
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.2"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` pour envoyer une véritable pièce jointe image (les chemins sont injectés dans le prompt). Les recettes Docker désactivent cela par défaut sauf demande explicite.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` pour transmettre les chemins de fichiers image comme arguments CLI au lieu de l’injection dans le prompt.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (ou `"list"`) pour contrôler la manière dont les arguments image sont passés lorsque `IMAGE_ARG` est défini.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` pour envoyer un second tour et valider le flux de reprise.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=1` pour activer la sonde de continuité de même session Claude Sonnet -> Opus lorsque le modèle sélectionné prend en charge une cible de bascule. Les recettes Docker désactivent cela par défaut pour une meilleure fiabilité globale.
  - `OPENCLAW_LIVE_CLI_BACKEND_MCP_PROBE=1` pour activer la sonde MCP/outils loopback. Les recettes Docker désactivent cela par défaut sauf demande explicite.

Exemple :

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.2" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

Recette Docker :

```bash
pnpm test:docker:live-cli-backend
```

Recettes Docker à fournisseur unique :

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:claude-subscription
pnpm test:docker:live-cli-backend:codex
pnpm test:docker:live-cli-backend:gemini
```

Remarques :

- L’exécuteur Docker se trouve dans `scripts/test-live-cli-backend-docker.sh`.
- Il exécute le smoke live de backend CLI dans l’image Docker du dépôt en tant qu’utilisateur non root `node`.
- Il résout les métadonnées smoke CLI depuis l’extension propriétaire, puis installe le package CLI Linux correspondant (`@anthropic-ai/claude-code`, `@openai/codex` ou `@google/gemini-cli`) dans un préfixe accessible en écriture mis en cache à `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (par défaut : `~/.cache/openclaw/docker-cli-tools`).
- `pnpm test:docker:live-cli-backend:claude-subscription` nécessite un OAuth d’abonnement Claude Code portable via soit `~/.claude/.credentials.json` avec `claudeAiOauth.subscriptionType`, soit `CLAUDE_CODE_OAUTH_TOKEN` issu de `claude setup-token`. Il prouve d’abord l’exécution directe de `claude -p` dans Docker, puis exécute deux tours Gateway de backend CLI sans conserver les variables d’environnement de clé API Anthropic. Cette voie d’abonnement désactive par défaut les sondes Claude MCP/outils et image, car Claude route actuellement l’usage d’applications tierces via une facturation d’usage supplémentaire au lieu des limites normales du plan d’abonnement.
- Le smoke live de backend CLI exerce désormais le même flux de bout en bout pour Claude, Codex et Gemini : tour texte, tour de classification d’image, puis appel d’outil MCP `cron` vérifié via la CLI gateway.
- Le smoke par défaut de Claude modifie aussi la session de Sonnet à Opus et vérifie que la session reprise se souvient toujours d’une note antérieure.

## Live : smoke de liaison ACP (`/acp spawn ... --bind here`)

- Test : `src/gateway/gateway-acp-bind.live.test.ts`
- Objectif : valider le véritable flux de liaison de conversation ACP avec un agent ACP live :
  - envoyer `/acp spawn <agent> --bind here`
  - lier sur place une conversation synthétique de canal de messages
  - envoyer un suivi normal sur cette même conversation
  - vérifier que le suivi arrive dans la transcription de session ACP liée
- Activer :
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Valeurs par défaut :
  - Agents ACP dans Docker : `claude,codex,gemini`
  - Agent ACP pour `pnpm test:live ...` direct : `claude`
  - Canal synthétique : contexte de conversation de type message privé Slack
  - Backend ACP : `acpx`
- Remplacements :
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=opencode`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
  - `OPENCLAW_LIVE_ACP_BIND_CODEX_MODEL=gpt-5.2`
  - `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL=opencode/kimi-k2.6`
  - `OPENCLAW_LIVE_ACP_BIND_REQUIRE_TRANSCRIPT=1`
  - `OPENCLAW_LIVE_ACP_BIND_PARENT_MODEL=openai/gpt-5.2`
- Remarques :
  - Cette voie utilise la surface gateway `chat.send` avec des champs de route d’origine synthétiques réservés à l’administration afin que les tests puissent attacher un contexte de canal de messages sans prétendre distribuer vers l’extérieur.
  - Lorsque `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` n’est pas défini, le test utilise le registre intégré d’agents du plugin `acpx` embarqué pour l’agent ACP sélectionné.

Exemple :

```bash
OPENCLAW_LIVE_ACP_BIND=1 \
  OPENCLAW_LIVE_ACP_BIND_AGENT=claude \
  pnpm test:live src/gateway/gateway-acp-bind.live.test.ts
```

Recette Docker :

```bash
pnpm test:docker:live-acp-bind
```

Recettes Docker à agent unique :

```bash
pnpm test:docker:live-acp-bind:claude
pnpm test:docker:live-acp-bind:codex
pnpm test:docker:live-acp-bind:gemini
pnpm test:docker:live-acp-bind:opencode
```

Remarques Docker :

- L’exécuteur Docker se trouve dans `scripts/test-live-acp-bind-docker.sh`.
- Par défaut, il exécute le smoke de liaison ACP contre les agents CLI live agrégés en séquence : `claude`, `codex`, puis `gemini`.
- Utilisez `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` ou `OPENCLAW_LIVE_ACP_BIND_AGENTS=opencode` pour restreindre la matrice.
- Il source `~/.profile`, prépare le matériel d’authentification CLI correspondant dans le conteneur, puis installe la CLI live demandée (`@anthropic-ai/claude-code`, `@openai/codex`, `@google/gemini-cli` ou `opencode-ai`) si elle est absente. Le backend ACP lui-même est le package embarqué `acpx/runtime` inclus dans le plugin `acpx`.
- La variante Docker OpenCode est une voie stricte de régression à agent unique. Elle écrit un modèle par défaut temporaire `OPENCODE_CONFIG_CONTENT` à partir de `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL` (par défaut `opencode/kimi-k2.6`) après avoir sourcé `~/.profile`, et `pnpm test:docker:live-acp-bind:opencode` exige une transcription d’assistant liée au lieu d’accepter l’omission générique post-liaison.
- Les appels directs à la CLI `acpx` ne constituent qu’un chemin manuel/de contournement pour comparer le comportement en dehors de la Gateway. Le smoke Docker ACP bind exerce le backend runtime `acpx` embarqué d’OpenClaw.

## Live : smoke du harnais Codex app-server

- Objectif : valider le harnais Codex détenu par le plugin via la méthode gateway
  normale `agent` :
  - charger le plugin inclus `codex`
  - sélectionner `OPENCLAW_AGENT_RUNTIME=codex`
  - envoyer un premier tour d’agent gateway à `openai/gpt-5.2` avec le harnais Codex forcé
  - envoyer un second tour à la même session OpenClaw et vérifier que le fil app-server
    peut reprendre
  - exécuter `/codex status` et `/codex models` via le même chemin de commande
    gateway
  - éventuellement exécuter deux sondes shell escaladées relues par Guardian : une commande
    bénigne qui devrait être approuvée et un faux upload de secret qui devrait être
    refusé afin que l’agent redemande
- Test : `src/gateway/gateway-codex-harness.live.test.ts`
- Activer : `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Modèle par défaut : `openai/gpt-5.2`
- Sonde image facultative : `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- Sonde MCP/outils facultative : `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- Sonde Guardian facultative : `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- Le smoke définit `OPENCLAW_AGENT_HARNESS_FALLBACK=none` afin qu’un harnais Codex
  cassé ne puisse pas réussir en se repliant silencieusement sur Pi.
- Authentification : auth app-server Codex à partir de la connexion locale à l’abonnement Codex. Les
  smokes Docker peuvent aussi fournir `OPENAI_API_KEY` pour les sondes non-Codex si applicable,
  ainsi que des copies facultatives de `~/.codex/auth.json` et `~/.codex/config.toml`.

Recette locale :

```bash
source ~/.profile
OPENCLAW_LIVE_CODEX_HARNESS=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MODEL=openai/gpt-5.2 \
  pnpm test:live -- src/gateway/gateway-codex-harness.live.test.ts
```

Recette Docker :

```bash
source ~/.profile
pnpm test:docker:live-codex-harness
```

Remarques Docker :

- L’exécuteur Docker se trouve dans `scripts/test-live-codex-harness-docker.sh`.
- Il source le `~/.profile` monté, transmet `OPENAI_API_KEY`, copie les fichiers
  d’authentification Codex CLI lorsqu’ils sont présents, installe `@openai/codex` dans un préfixe npm monté accessible en écriture,
  prépare l’arborescence source, puis n’exécute que le test live du harnais Codex.
- Docker active par défaut les sondes image, MCP/outils et Guardian. Définissez
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0`,
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` ou
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0` lorsque vous avez besoin d’une exécution de débogage plus étroite.
- Docker exporte aussi `OPENCLAW_AGENT_HARNESS_FALLBACK=none`, conformément à la
  configuration du test live afin que les anciens alias ou le repli sur Pi ne puissent pas masquer une
  régression du harnais Codex.

### Recettes live recommandées

Des listes d’autorisations étroites et explicites sont les plus rapides et les moins sujettes aux faux échecs :

- Modèle unique, direct (sans gateway) :
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.2" pnpm test:live src/agents/models.profiles.live.test.ts`

- Modèle unique, smoke gateway :
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.2" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Appels d’outils sur plusieurs fournisseurs :
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.2,openai-codex/gpt-5.2,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,deepseek/deepseek-v4-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Cible Google (clé API Gemini + Antigravity) :
  - Gemini (clé API) : `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth) : `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Smoke Google adaptive thinking :
  - Si les clés locales se trouvent dans le profil du shell : `source ~/.profile`
  - Valeur par défaut dynamique Gemini 3 : `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-3.1-pro-preview --alt-model google/gemini-3.1-pro-preview --message '/think adaptive Reply exactly: GEMINI_ADAPTIVE_OK' --timeout-ms 180000`
  - Budget dynamique Gemini 2.5 : `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-2.5-flash --alt-model google/gemini-2.5-flash --message '/think adaptive Reply exactly: GEMINI25_ADAPTIVE_OK' --timeout-ms 180000`

Remarques :

- `google/...` utilise l’API Gemini (clé API).
- `google-antigravity/...` utilise le pont OAuth Antigravity (point de terminaison d’agent de type Cloud Code Assist).
- `google-gemini-cli/...` utilise la CLI Gemini locale sur votre machine (authentification séparée + particularités d’outillage).
- API Gemini vs CLI Gemini :
  - API : OpenClaw appelle l’API Gemini hébergée de Google via HTTP (clé API / auth de profil) ; c’est ce que la plupart des utilisateurs entendent par « Gemini ».
  - CLI : OpenClaw appelle un binaire `gemini` local ; il a sa propre authentification et peut se comporter différemment (streaming/prise en charge des outils/décalage de version).

## Live : matrice de modèles (ce que nous couvrons)

Il n’existe pas de « liste fixe de modèles CI » (live est opt-in), mais voici les modèles **recommandés** à couvrir régulièrement sur une machine de développement disposant des clés.

### Ensemble de smoke moderne (appels d’outils + image)

C’est l’exécution « modèles courants » que nous voulons maintenir fonctionnelle :

- OpenAI (hors Codex) : `openai/gpt-5.2`
- OpenAI Codex OAuth : `openai-codex/gpt-5.2`
- Anthropic : `anthropic/claude-opus-4-6` (ou `anthropic/claude-sonnet-4-6`)
- Google (API Gemini) : `google/gemini-3.1-pro-preview` et `google/gemini-3-flash-preview` (évitez les anciens modèles Gemini 2.x)
- Google (Antigravity) : `google-antigravity/claude-opus-4-6-thinking` et `google-antigravity/gemini-3-flash`
- DeepSeek : `deepseek/deepseek-v4-flash` et `deepseek/deepseek-v4-pro`
- Z.AI (GLM) : `zai/glm-4.7`
- MiniMax : `minimax/MiniMax-M2.7`

Exécuter le smoke gateway avec outils + image :
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.2,openai-codex/gpt-5.2,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,deepseek/deepseek-v4-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Référence : appels d’outils (Read + Exec facultatif)

Choisissez-en au moins un par famille de fournisseurs :

- OpenAI : `openai/gpt-5.2`
- Anthropic : `anthropic/claude-opus-4-6` (ou `anthropic/claude-sonnet-4-6`)
- Google : `google/gemini-3-flash-preview` (ou `google/gemini-3.1-pro-preview`)
- DeepSeek : `deepseek/deepseek-v4-flash`
- Z.AI (GLM) : `zai/glm-4.7`
- MiniMax : `minimax/MiniMax-M2.7`

Couverture supplémentaire facultative (utile à avoir) :

- xAI : `xai/grok-4` (ou la dernière version disponible)
- Mistral : `mistral/`… (choisissez un modèle compatible « tools » que vous avez activé)
- Cerebras : `cerebras/`… (si vous y avez accès)
- LM Studio : `lmstudio/`… (local ; l’appel d’outils dépend du mode API)

### Vision : envoi d’image (pièce jointe → message multimodal)

Incluez au moins un modèle compatible image dans `OPENCLAW_LIVE_GATEWAY_MODELS` (Claude/Gemini/variantes OpenAI compatibles vision, etc.) afin d’exercer la sonde image.

### Agrégateurs / gateways alternatifs

Si vous avez activé les clés, nous prenons aussi en charge les tests via :

- OpenRouter : `openrouter/...` (des centaines de modèles ; utilisez `openclaw models scan` pour trouver des candidats compatibles outils+image)
- OpenCode : `opencode/...` pour Zen et `opencode-go/...` pour Go (authentification via `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Autres fournisseurs que vous pouvez inclure dans la matrice live (si vous avez les identifiants/la configuration) :

- Intégrés : `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- Via `models.providers` (points de terminaison personnalisés) : `minimax` (cloud/API), ainsi que tout proxy compatible OpenAI/Anthropic (LM Studio, vLLM, LiteLLM, etc.)

Conseil : n’essayez pas de coder en dur « tous les modèles » dans la documentation. La liste faisant autorité est celle que `discoverModels(...)` renvoie sur votre machine + les clés disponibles.

## Identifiants (ne jamais commiter)

Les tests live découvrent les identifiants de la même manière que la CLI. Conséquences pratiques :

- Si la CLI fonctionne, les tests live devraient trouver les mêmes clés.
- Si un test live dit « pas d’identifiants », déboguez-le comme vous débogueriez `openclaw models list` / la sélection de modèle.

- Profils d’authentification par agent : `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (c’est ce que « clés de profil » signifie dans les tests live)
- Configuration : `~/.openclaw/openclaw.json` (ou `OPENCLAW_CONFIG_PATH`)
- Ancien répertoire d’état : `~/.openclaw/credentials/` (copié dans le home live préparé lorsqu’il est présent, mais ce n’est pas le stockage principal des clés de profil)
- Les exécutions live locales copient par défaut la configuration active, les fichiers `auth-profiles.json` par agent, `credentials/` hérité et les répertoires d’authentification CLI externes pris en charge dans un home de test temporaire ; les homes live préparés ignorent `workspace/` et `sandboxes/`, et les remplacements de chemin `agents.*.workspace` / `agentDir` sont retirés afin que les sondes restent hors de votre véritable espace de travail hôte.

Si vous voulez vous appuyer sur des clés d’environnement (par exemple exportées dans `~/.profile`), exécutez les tests locaux après `source ~/.profile`, ou utilisez les exécuteurs Docker ci-dessous (ils peuvent monter `~/.profile` dans le conteneur).

## Live Deepgram (transcription audio)

- Test : `extensions/deepgram/audio.live.test.ts`
- Activer : `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## Live BytePlus coding plan

- Test : `extensions/byteplus/live.test.ts`
- Activer : `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- Remplacement facultatif du modèle : `BYTEPLUS_CODING_MODEL=ark-code-latest`

## Live média de workflow ComfyUI

- Test : `extensions/comfy/comfy.live.test.ts`
- Activer : `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- Portée :
  - Exerce les chemins image, vidéo et `music_generate` comfy inclus
  - Ignore chaque fonctionnalité sauf si `plugins.entries.comfy.config.<capability>` est configuré
  - Utile après des changements de soumission de workflow comfy, de polling, de téléchargements ou d’enregistrement de plugin

## Génération d’images live

- Test : `test/image-generation.runtime.live.test.ts`
- Commande : `pnpm test:live test/image-generation.runtime.live.test.ts`
- Harness : `pnpm test:live:media image`
- Portée :
  - Énumère chaque plugin fournisseur de génération d’images enregistré
  - Charge les variables d’environnement fournisseur manquantes depuis votre shell de connexion (`~/.profile`) avant la sonde
  - Utilise par défaut les clés API live/env avant les profils d’authentification stockés, afin que des clés de test obsolètes dans `auth-profiles.json` ne masquent pas les vrais identifiants du shell
  - Ignore les fournisseurs sans auth/profil/modèle utilisable
  - Exécute chaque fournisseur configuré via le runtime partagé de génération d’images :
    - `<provider>:generate`
    - `<provider>:edit` lorsque le fournisseur déclare la prise en charge de l’édition
- Fournisseurs inclus actuellement couverts :
  - `fal`
  - `google`
  - `minimax`
  - `openai`
  - `openrouter`
  - `vydra`
  - `xai`
- Restriction facultative :
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google,openrouter,xai"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-2,google/gemini-3.1-flash-image-preview,openrouter/google/gemini-3.1-flash-image-preview,xai/grok-imagine-image"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit,openrouter:generate,xai:default-generate,xai:default-edit"`
- Comportement d’authentification facultatif :
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` pour imposer l’authentification via le stockage de profils et ignorer les remplacements env-only

Pour le chemin CLI livré, ajoutez un smoke `infer` après que le test live du
fournisseur/runtime a réussi :

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_INFER_CLI_TEST=1 pnpm test:live -- test/image-generation.infer-cli.live.test.ts
openclaw infer image providers --json
openclaw infer image generate \
  --model google/gemini-3.1-flash-image-preview \
  --prompt "Minimal flat test image: one blue square on a white background, no text." \
  --output ./openclaw-infer-image-smoke.png \
  --json
```

Cela couvre l’analyse des arguments CLI, la résolution de la configuration/de l’agent par défaut, l’activation des plugins inclus, la réparation à la demande des dépendances d’exécution incluses, le runtime partagé de génération d’images et la requête live du fournisseur.

## Génération musicale live

- Test : `extensions/music-generation-providers.live.test.ts`
- Activer : `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harness : `pnpm test:live:media music`
- Portée :
  - Exerce le chemin partagé des fournisseurs inclus de génération musicale
  - Couvre actuellement Google et MiniMax
  - Charge les variables d’environnement fournisseur depuis votre shell de connexion (`~/.profile`) avant la sonde
  - Utilise par défaut les clés API live/env avant les profils d’authentification stockés, afin que des clés de test obsolètes dans `auth-profiles.json` ne masquent pas les vrais identifiants du shell
  - Ignore les fournisseurs sans auth/profil/modèle utilisable
  - Exécute les deux modes runtime déclarés lorsqu’ils sont disponibles :
    - `generate` avec une entrée basée uniquement sur le prompt
    - `edit` lorsque le fournisseur déclare `capabilities.edit.enabled`
  - Couverture actuelle de la voie partagée :
    - `google` : `generate`, `edit`
    - `minimax` : `generate`
    - `comfy` : fichier Comfy live séparé, pas ce balayage partagé
- Restriction facultative :
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.6"`
- Comportement d’authentification facultatif :
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` pour imposer l’authentification via le stockage de profils et ignorer les remplacements env-only

## Génération vidéo live

- Test : `extensions/video-generation-providers.live.test.ts`
- Activer : `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harness : `pnpm test:live:media video`
- Portée :
  - Exerce le chemin partagé des fournisseurs inclus de génération vidéo
  - Utilise par défaut le chemin smoke sûr pour la release : fournisseurs hors FAL, une requête texte-vers-vidéo par fournisseur, prompt homard d’une seconde, et limite d’opération par fournisseur issue de `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (`180000` par défaut)
  - Ignore FAL par défaut parce que la latence de file d’attente côté fournisseur peut dominer le temps de release ; passez `--video-providers fal` ou `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` pour l’exécuter explicitement
  - Charge les variables d’environnement fournisseur depuis votre shell de connexion (`~/.profile`) avant la sonde
  - Utilise par défaut les clés API live/env avant les profils d’authentification stockés, afin que des clés de test obsolètes dans `auth-profiles.json` ne masquent pas les vrais identifiants du shell
  - Ignore les fournisseurs sans auth/profil/modèle utilisable
  - Exécute uniquement `generate` par défaut
  - Définissez `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` pour exécuter aussi les modes de transformation déclarés lorsqu’ils sont disponibles :
    - `imageToVideo` lorsque le fournisseur déclare `capabilities.imageToVideo.enabled` et que le fournisseur/modèle sélectionné accepte une entrée image locale basée sur buffer dans le balayage partagé
    - `videoToVideo` lorsque le fournisseur déclare `capabilities.videoToVideo.enabled` et que le fournisseur/modèle sélectionné accepte une entrée vidéo locale basée sur buffer dans le balayage partagé
  - Fournisseurs `imageToVideo` actuellement déclarés mais ignorés dans le balayage partagé :
    - `vydra` parce que `veo3` inclus est texte uniquement et que `kling` inclus nécessite une URL d’image distante
  - Couverture spécifique au fournisseur Vydra :
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - ce fichier exécute `veo3` en texte-vers-vidéo plus une voie `kling` qui utilise par défaut un fixture d’URL d’image distante
  - Couverture live actuelle `videoToVideo` :
    - `runway` uniquement lorsque le modèle sélectionné est `runway/gen4_aleph`
  - Fournisseurs `videoToVideo` actuellement déclarés mais ignorés dans le balayage partagé :
    - `alibaba`, `qwen`, `xai` parce que ces chemins nécessitent actuellement des URL de référence distantes `http(s)` / MP4
    - `google` parce que la voie partagée Gemini/Veo actuelle utilise une entrée locale basée sur buffer et que ce chemin n’est pas accepté dans le balayage partagé
    - `openai` parce que la voie partagée actuelle ne garantit pas l’accès spécifique à l’organisation pour les opérations vidéo inpaint/remix
- Restriction facultative :
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""` pour inclure chaque fournisseur dans le balayage par défaut, y compris FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000` pour réduire la limite d’opération de chaque fournisseur lors d’une exécution smoke agressive
- Comportement d’authentification facultatif :
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` pour imposer l’authentification via le stockage de profils et ignorer les remplacements env-only

## Harness média live

- Commande : `pnpm test:live:media`
- Objectif :
  - Exécute les suites live partagées image, musique et vidéo via un point d’entrée natif du dépôt
  - Charge automatiquement les variables d’environnement fournisseur manquantes depuis `~/.profile`
  - Restreint automatiquement chaque suite aux fournisseurs qui disposent actuellement d’une authentification utilisable par défaut
  - Réutilise `scripts/test-live.mjs`, afin que Heartbeat et le mode silencieux restent cohérents
- Exemples :
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Voir aussi

- [Testing](/fr/help/testing) — suites unitaires, d’intégration, QA et Docker
