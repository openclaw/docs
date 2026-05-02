---
read_when:
    - Exécution des tests de fumée de la matrice de modèles en direct / du backend CLI / d’ACP / du fournisseur de médias
    - Débogage de la résolution des identifiants des tests en direct
    - Ajout d’un nouveau test en direct spécifique à un fournisseur
sidebarTitle: Live tests
summary: 'Tests en direct (avec accès au réseau) : matrice de modèles, moteurs CLI, ACP, fournisseurs de médias, identifiants'
title: 'Tests : suites en conditions réelles'
x-i18n:
    generated_at: "2026-05-02T07:10:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: ce8bd75ee7837b48e6ba1d888d281ee053fc13bdcf0907baddeb78ebcbbef31c
    source_path: help/testing-live.md
    workflow: 16
---

Pour le démarrage rapide, les runners QA, les suites unitaires/d’intégration et les flux Docker, consultez
[Tests](/fr/help/testing). Cette page couvre les suites de test **live** (qui touchent au réseau) :
matrice de modèles, backends CLI, ACP et tests live de fournisseurs de médias, ainsi que la
gestion des identifiants.

## Live : commandes smoke du profil local

Sourcez `~/.profile` avant les vérifications live ad hoc afin que les clés de fournisseurs et les chemins
des outils locaux correspondent à votre shell :

```bash
source ~/.profile
```

Smoke média sûr :

```bash
pnpm openclaw infer tts convert --local --json \
  --text "OpenClaw live smoke." \
  --output /tmp/openclaw-live-smoke.mp3
```

Smoke sûr de préparation aux appels vocaux :

```bash
pnpm openclaw voicecall setup --json
pnpm openclaw voicecall smoke --to "+15555550123"
```

`voicecall smoke` est un essai à blanc sauf si `--yes` est également présent. Utilisez `--yes` uniquement
lorsque vous voulez volontairement passer un véritable appel de notification. Pour Twilio, Telnyx et
Plivo, une vérification de préparation réussie nécessite une URL Webhook publique ; les solutions de repli
local-only loopback/privées sont rejetées par conception.

## Live : balayage des capacités du nœud Android

- Test : `src/gateway/android-node.capabilities.live.test.ts`
- Script : `pnpm android:test:integration`
- Objectif : invoquer **chaque commande actuellement annoncée** par un nœud Android connecté et vérifier le comportement du contrat de commande.
- Portée :
  - Configuration préalable/manuelle (la suite n’installe, n’exécute ni n’appaire l’application).
  - Validation Gateway `node.invoke` commande par commande pour le nœud Android sélectionné.
- Préconfiguration requise :
  - Application Android déjà connectée et appairée au Gateway.
  - Application maintenue au premier plan.
  - Autorisations/consentement de capture accordés pour les capacités que vous attendez comme réussies.
- Remplacements de cible facultatifs :
  - `OPENCLAW_ANDROID_NODE_ID` ou `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Détails complets de configuration Android : [Application Android](/fr/platforms/android)

## Live : smoke des modèles (clés de profil)

Les tests live sont divisés en deux couches afin que nous puissions isoler les échecs :

- « Modèle direct » indique que le fournisseur/modèle peut répondre avec la clé fournie.
- « Smoke Gateway » indique que le pipeline gateway+agent complet fonctionne pour ce modèle (sessions, historique, outils, politique de bac à sable, etc.).

### Couche 1 : complétion directe du modèle (sans Gateway)

- Test : `src/agents/models.profiles.live.test.ts`
- Objectif :
  - Énumérer les modèles découverts
  - Utiliser `getApiKeyForModel` pour sélectionner les modèles pour lesquels vous avez des identifiants
  - Exécuter une petite complétion par modèle (et des régressions ciblées si nécessaire)
- Activation :
  - `pnpm test:live` (ou `OPENCLAW_LIVE_TEST=1` si vous invoquez Vitest directement)
- Définissez `OPENCLAW_LIVE_MODELS=modern` (ou `all`, alias pour modern) pour exécuter réellement cette suite ; sinon, elle est ignorée afin de garder `pnpm test:live` centré sur le smoke Gateway
- Sélection des modèles :
  - `OPENCLAW_LIVE_MODELS=modern` pour exécuter la liste d’autorisation moderne (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 4.7, MiniMax M2.7, Grok 4.3)
  - `OPENCLAW_LIVE_MODELS=all` est un alias de la liste d’autorisation moderne
  - ou `OPENCLAW_LIVE_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,..."` (liste d’autorisation séparée par des virgules)
  - Les balayages modern/all utilisent par défaut une limite organisée à fort signal ; définissez `OPENCLAW_LIVE_MAX_MODELS=0` pour un balayage moderne exhaustif ou un nombre positif pour une limite plus petite.
  - Les balayages exhaustifs utilisent `OPENCLAW_LIVE_TEST_TIMEOUT_MS` pour le délai d’expiration de l’ensemble du test de modèle direct. Valeur par défaut : 60 minutes.
  - Les sondes de modèle direct s’exécutent avec un parallélisme à 20 voies par défaut ; définissez `OPENCLAW_LIVE_MODEL_CONCURRENCY` pour le remplacer.
- Sélection des fournisseurs :
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (liste d’autorisation séparée par des virgules)
- Provenance des clés :
  - Par défaut : magasin de profils et solutions de repli d’environnement
  - Définissez `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` pour imposer uniquement le **magasin de profils**
- Pourquoi cela existe :
  - Sépare « l’API du fournisseur est cassée / la clé est invalide » de « le pipeline d’agent Gateway est cassé »
  - Contient de petites régressions isolées (exemple : relecture du raisonnement OpenAI Responses/Codex Responses + flux d’appels d’outils)

### Couche 2 : smoke Gateway + agent de développement (ce que fait réellement « @openclaw »)

- Test : `src/gateway/gateway-models.profiles.live.test.ts`
- Objectif :
  - Démarrer un Gateway in-process
  - Créer/corriger une session `agent:dev:*` (remplacement du modèle à chaque exécution)
  - Itérer sur les modèles avec clés et vérifier :
    - réponse « significative » (sans outils)
    - une invocation réelle d’outil fonctionne (sonde de lecture)
    - sondes d’outils supplémentaires facultatives (sonde exec+lecture)
    - les chemins de régression OpenAI (appel d’outil uniquement → suivi) continuent de fonctionner
- Détails des sondes (pour expliquer rapidement les échecs) :
  - sonde `read` : le test écrit un fichier nonce dans l’espace de travail et demande à l’agent de le `read` puis de renvoyer le nonce.
  - sonde `exec+read` : le test demande à l’agent d’écrire via `exec` un nonce dans un fichier temporaire, puis de le relire avec `read`.
  - sonde image : le test joint un PNG généré (chat + code aléatoire) et attend du modèle qu’il renvoie `cat <CODE>`.
  - Référence d’implémentation : `src/gateway/gateway-models.profiles.live.test.ts` et `src/gateway/live-image-probe.ts`.
- Activation :
  - `pnpm test:live` (ou `OPENCLAW_LIVE_TEST=1` si vous invoquez Vitest directement)
- Sélection des modèles :
  - Par défaut : liste d’autorisation moderne (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 4.7, MiniMax M2.7, Grok 4.3)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` est un alias de la liste d’autorisation moderne
  - Ou définissez `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (ou une liste séparée par des virgules) pour restreindre
  - Les balayages Gateway modern/all utilisent par défaut une limite organisée à fort signal ; définissez `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` pour un balayage moderne exhaustif ou un nombre positif pour une limite plus petite.
- Sélection des fournisseurs (éviter « tout OpenRouter ») :
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (liste d’autorisation séparée par des virgules)
- Les sondes d’outils + image sont toujours activées dans ce test live :
  - sonde `read` + sonde `exec+read` (stress des outils)
  - la sonde image s’exécute lorsque le modèle annonce la prise en charge des entrées image
  - Flux (vue d’ensemble) :
    - Le test génère un petit PNG avec « CAT » + code aléatoire (`src/gateway/live-image-probe.ts`)
    - L’envoie via `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - Le Gateway analyse les pièces jointes dans `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - L’agent intégré transmet au modèle un message utilisateur multimodal
    - Assertion : la réponse contient `cat` + le code (tolérance OCR : petites erreurs autorisées)

<Tip>
Pour voir ce que vous pouvez tester sur votre machine (et les identifiants exacts `provider/model`), exécutez :

```bash
openclaw models list
openclaw models list --json
```

</Tip>

## Live : smoke du backend CLI (Claude, Codex, Gemini ou autres CLI locales)

- Test : `src/gateway/gateway-cli-backend.live.test.ts`
- Objectif : valider le pipeline Gateway + agent avec un backend CLI local, sans toucher à votre configuration par défaut.
- Les valeurs par défaut smoke propres au backend résident avec la définition `cli-backend.ts` de l’extension propriétaire.
- Activation :
  - `pnpm test:live` (ou `OPENCLAW_LIVE_TEST=1` si vous invoquez Vitest directement)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Valeurs par défaut :
  - Fournisseur/modèle par défaut : `claude-cli/claude-sonnet-4-6`
  - Le comportement commande/arguments/image provient des métadonnées du Plugin de backend CLI propriétaire.
- Remplacements (facultatif) :
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.5"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` pour envoyer une vraie pièce jointe image (les chemins sont injectés dans le prompt). Les recettes Docker désactivent cela par défaut sauf demande explicite.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` pour passer les chemins des fichiers image comme arguments CLI au lieu d’une injection dans le prompt.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (ou `"list"`) pour contrôler la manière dont les arguments image sont passés lorsque `IMAGE_ARG` est défini.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` pour envoyer un deuxième tour et valider le flux de reprise.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=1` pour opter pour la sonde de continuité de même session Claude Sonnet -> Opus lorsque le modèle sélectionné prend en charge une cible de bascule. Les recettes Docker la désactivent par défaut pour la fiabilité agrégée.
  - `OPENCLAW_LIVE_CLI_BACKEND_MCP_PROBE=1` pour opter pour la sonde MCP/outil local loopback. Les recettes Docker la désactivent par défaut sauf demande explicite.

Exemple :

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.5" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

Smoke bon marché de configuration MCP Gemini :

```bash
OPENCLAW_LIVE_TEST=1 \
  pnpm test:live src/agents/cli-runner/bundle-mcp.gemini.live.test.ts
```

Cela ne demande pas à Gemini de générer une réponse. Il écrit les mêmes paramètres système
qu’OpenClaw donne à Gemini, puis exécute `gemini --debug mcp list` pour prouver qu’un
serveur `transport: "streamable-http"` enregistré est normalisé dans la forme MCP HTTP de Gemini
et peut se connecter à un serveur MCP streamable-HTTP local.

Recette Docker :

```bash
pnpm test:docker:live-cli-backend
```

Recettes Docker mono-fournisseur :

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:claude-subscription
pnpm test:docker:live-cli-backend:codex
pnpm test:docker:live-cli-backend:gemini
```

Notes :

- Le runner Docker se trouve dans `scripts/test-live-cli-backend-docker.sh`.
- Il exécute le smoke live du backend CLI dans l’image Docker du dépôt en tant qu’utilisateur non-root `node`.
- Il résout les métadonnées smoke CLI depuis l’extension propriétaire, puis installe le paquet CLI Linux correspondant (`@anthropic-ai/claude-code`, `@openai/codex` ou `@google/gemini-cli`) dans un préfixe inscriptible mis en cache à `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (par défaut : `~/.cache/openclaw/docker-cli-tools`).
- `pnpm test:docker:live-cli-backend:claude-subscription` nécessite l’OAuth portable de l’abonnement Claude Code via soit `~/.claude/.credentials.json` avec `claudeAiOauth.subscriptionType`, soit `CLAUDE_CODE_OAUTH_TOKEN` depuis `claude setup-token`. Il prouve d’abord `claude -p` direct dans Docker, puis exécute deux tours du backend CLI Gateway sans préserver les variables d’environnement de clé API Anthropic. Cette voie d’abonnement désactive par défaut les sondes Claude MCP/outil et image, car Claude achemine actuellement l’utilisation d’applications tierces via une facturation d’utilisation supplémentaire plutôt que par les limites normales du forfait d’abonnement.
- Le smoke live du backend CLI exerce maintenant le même flux de bout en bout pour Claude, Codex et Gemini : tour texte, tour de classification d’image, puis appel d’outil MCP `cron` vérifié via la CLI Gateway.
- Le smoke par défaut de Claude corrige également la session de Sonnet vers Opus et vérifie que la session reprise se souvient encore d’une note antérieure.

## Live : smoke de liaison ACP (`/acp spawn ... --bind here`)

- Test : `src/gateway/gateway-acp-bind.live.test.ts`
- Objectif : valider le vrai flux ACP de liaison de conversation avec un agent ACP live :
  - envoyer `/acp spawn <agent> --bind here`
  - lier sur place une conversation synthétique de canal de messages
  - envoyer un suivi normal sur cette même conversation
  - vérifier que le suivi arrive dans la transcription de la session ACP liée
- Activation :
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Valeurs par défaut :
  - Agents ACP dans Docker : `claude,codex,gemini`
  - Agent ACP pour `pnpm test:live ...` direct : `claude`
  - Canal synthétique : contexte de conversation de type DM Slack
  - Backend ACP : `acpx`
- Remplacements :
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=droid`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=opencode`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
  - `OPENCLAW_LIVE_ACP_BIND_CODEX_MODEL=gpt-5.5`
  - `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL=opencode/kimi-k2.6`
  - `OPENCLAW_LIVE_ACP_BIND_REQUIRE_TRANSCRIPT=1`
  - `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1`
  - `OPENCLAW_LIVE_ACP_BIND_PARENT_MODEL=openai/gpt-5.5`
- Notes :
  - Cette voie utilise la surface `chat.send` du Gateway avec des champs d’itinéraire d’origine synthétiques réservés aux administrateurs afin que les tests puissent attacher un contexte de canal de messages sans prétendre livrer à l’extérieur.
  - Lorsque `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` n’est pas défini, le test utilise le registre d’agents intégré du Plugin `acpx` embarqué pour l’agent de harnais ACP sélectionné.
  - La création du MCP cron de session liée est effectuée au mieux par défaut, car les harnais ACP externes peuvent annuler les appels MCP après la réussite de la preuve de liaison/image ; définissez `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1` pour rendre cette sonde cron post-liaison stricte.

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

Recettes Docker pour un seul agent :

```bash
pnpm test:docker:live-acp-bind:claude
pnpm test:docker:live-acp-bind:codex
pnpm test:docker:live-acp-bind:droid
pnpm test:docker:live-acp-bind:gemini
pnpm test:docker:live-acp-bind:opencode
```

Notes Docker :

- Le lanceur Docker se trouve à `scripts/test-live-acp-bind-docker.sh`.
- Par défaut, il exécute le smoke de liaison ACP contre les agents CLI live agrégés dans l’ordre : `claude`, `codex`, puis `gemini`.
- Utilisez `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=droid`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` ou `OPENCLAW_LIVE_ACP_BIND_AGENTS=opencode` pour réduire la matrice.
- Il source `~/.profile`, place le matériel d’authentification CLI correspondant dans le conteneur, puis installe le CLI live demandé (`@anthropic-ai/claude-code`, `@openai/codex`, Factory Droid via `https://app.factory.ai/cli`, `@google/gemini-cli` ou `opencode-ai`) s’il manque. Le backend ACP lui-même est le paquet `acpx/runtime` embarqué fourni avec le Plugin `acpx`.
- La variante Docker Droid prépare `~/.factory` pour les paramètres, transmet `FACTORY_API_KEY` et exige cette clé d’API, car l’authentification locale Factory OAuth/keyring n’est pas portable dans le conteneur. Elle utilise l’entrée de registre intégrée d’ACPX `droid exec --output-format acp`.
- La variante Docker OpenCode est une voie de régression stricte à agent unique. Elle écrit un modèle par défaut temporaire `OPENCODE_CONFIG_CONTENT` à partir de `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL` (par défaut `opencode/kimi-k2.6`) après avoir sourcé `~/.profile`, et `pnpm test:docker:live-acp-bind:opencode` exige une transcription d’assistant liée au lieu d’accepter le saut générique post-liaison.
- Les appels CLI `acpx` directs ne sont qu’un chemin manuel/de contournement pour comparer le comportement en dehors du Gateway. Le smoke Docker de liaison ACP exerce le backend d’exécution `acpx` embarqué d’OpenClaw.

## Live : smoke du harnais app-server Codex

- Objectif : valider le harnais Codex détenu par le Plugin via la méthode
  `agent` normale du Gateway :
  - charger le Plugin `codex` fourni
  - sélectionner `OPENCLAW_AGENT_RUNTIME=codex`
  - envoyer un premier tour d’agent Gateway à `openai/gpt-5.5` avec le harnais Codex forcé
  - envoyer un deuxième tour à la même session OpenClaw et vérifier que le thread
    app-server peut reprendre
  - exécuter `/codex status` et `/codex models` via le même chemin de commande du Gateway
  - exécuter facultativement deux sondes shell avec élévation revues par Guardian : une commande
    bénigne qui devrait être approuvée et un téléversement de faux secret qui devrait être
    refusé afin que l’agent redemande
- Test : `src/gateway/gateway-codex-harness.live.test.ts`
- Activation : `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Modèle par défaut : `openai/gpt-5.5`
- Sonde image facultative : `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- Sonde MCP/outil facultative : `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- Sonde Guardian facultative : `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- Le smoke définit `OPENCLAW_AGENT_HARNESS_FALLBACK=none` afin qu’un harnais Codex
  cassé ne puisse pas réussir en basculant silencieusement vers PI.
- Authentification : authentification app-server Codex issue de la connexion d’abonnement Codex locale. Les smokes Docker
  peuvent aussi fournir `OPENAI_API_KEY` pour les sondes non-Codex lorsque c’est applicable,
  ainsi que des fichiers `~/.codex/auth.json` et `~/.codex/config.toml` copiés facultatifs.

Recette locale :

```bash
source ~/.profile
OPENCLAW_LIVE_CODEX_HARNESS=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MODEL=openai/gpt-5.5 \
  pnpm test:live -- src/gateway/gateway-codex-harness.live.test.ts
```

Recette Docker :

```bash
source ~/.profile
pnpm test:docker:live-codex-harness
```

Notes Docker :

- Le lanceur Docker se trouve à `scripts/test-live-codex-harness-docker.sh`.
- Il source le `~/.profile` monté, transmet `OPENAI_API_KEY`, copie les fichiers
  d’authentification CLI Codex lorsqu’ils sont présents, installe `@openai/codex` dans un préfixe npm
  monté accessible en écriture, prépare l’arborescence source, puis exécute uniquement le test live du harnais Codex.
- Docker active par défaut les sondes image, MCP/outil et Guardian. Définissez
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` ou
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` ou
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0` lorsque vous avez besoin d’une exécution de débogage plus restreinte.
- Docker exporte aussi `OPENCLAW_AGENT_HARNESS_FALLBACK=none`, ce qui correspond à la configuration
  du test live afin que les alias hérités ou le repli PI ne puissent pas masquer une régression
  du harnais Codex.

### Recettes live recommandées

Les listes d’autorisation étroites et explicites sont les plus rapides et les moins instables :

- Modèle unique, direct (sans Gateway) :
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.5" pnpm test:live src/agents/models.profiles.live.test.ts`

- Modèle unique, smoke Gateway :
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Appels d’outils sur plusieurs fournisseurs :
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Focus Google (clé API Gemini + Antigravity) :
  - Gemini (clé API) : `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth) : `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Smoke de pensée adaptative Google :
  - Si les clés locales se trouvent dans le profil shell : `source ~/.profile`
  - Valeur dynamique par défaut Gemini 3 : `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-3.1-pro-preview --alt-model google/gemini-3.1-pro-preview --message '/think adaptive Reply exactly: GEMINI_ADAPTIVE_OK' --timeout-ms 180000`
  - Budget dynamique Gemini 2.5 : `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-2.5-flash --alt-model google/gemini-2.5-flash --message '/think adaptive Reply exactly: GEMINI25_ADAPTIVE_OK' --timeout-ms 180000`

Notes :

- `google/...` utilise l’API Gemini (clé API).
- `google-antigravity/...` utilise le pont OAuth Antigravity (point de terminaison d’agent de type Cloud Code Assist).
- `google-gemini-cli/...` utilise le CLI Gemini local sur votre machine (authentification séparée + particularités d’outillage).
- API Gemini vs CLI Gemini :
  - API : OpenClaw appelle l’API Gemini hébergée de Google via HTTP (clé API / authentification de profil) ; c’est ce que la plupart des utilisateurs entendent par « Gemini ».
  - CLI : OpenClaw exécute un binaire local `gemini` via le shell ; il possède sa propre authentification et peut se comporter différemment (streaming/prise en charge des outils/décalage de version).

## Live : matrice de modèles (ce que nous couvrons)

Il n’existe pas de « liste de modèles CI » fixe (le live est opt-in), mais voici les modèles **recommandés** à couvrir régulièrement sur une machine de développement avec des clés.

### Ensemble de smoke moderne (appel d’outils + image)

C’est l’exécution des « modèles courants » que nous nous attendons à garder fonctionnelle :

- OpenAI (non-Codex) : `openai/gpt-5.5`
- OpenAI Codex OAuth : `openai-codex/gpt-5.5`
- Anthropic : `anthropic/claude-opus-4-6` (ou `anthropic/claude-sonnet-4-6`)
- Google (API Gemini) : `google/gemini-3.1-pro-preview` et `google/gemini-3-flash-preview` (éviter les anciens modèles Gemini 2.x)
- Google (Antigravity) : `google-antigravity/claude-opus-4-6-thinking` et `google-antigravity/gemini-3-flash`
- DeepSeek : `deepseek/deepseek-v4-flash` et `deepseek/deepseek-v4-pro`
- Z.AI (GLM) : `zai/glm-5.1`
- MiniMax : `minimax/MiniMax-M2.7`

Exécuter le smoke Gateway avec outils + image :
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Référence : appel d’outils (Read + Exec facultatif)

Choisissez au moins un modèle par famille de fournisseurs :

- OpenAI : `openai/gpt-5.5`
- Anthropic : `anthropic/claude-opus-4-6` (ou `anthropic/claude-sonnet-4-6`)
- Google : `google/gemini-3-flash-preview` (ou `google/gemini-3.1-pro-preview`)
- DeepSeek : `deepseek/deepseek-v4-flash`
- Z.AI (GLM) : `zai/glm-5.1`
- MiniMax : `minimax/MiniMax-M2.7`

Couverture supplémentaire facultative (utile à avoir) :

- xAI : `xai/grok-4.3` (ou le dernier disponible)
- Mistral : `mistral/`… (choisissez un modèle compatible « outils » que vous avez activé)
- Cerebras : `cerebras/`… (si vous y avez accès)
- LM Studio : `lmstudio/`… (local ; l’appel d’outils dépend du mode API)

### Vision : envoi d’image (pièce jointe → message multimodal)

Incluez au moins un modèle compatible image dans `OPENCLAW_LIVE_GATEWAY_MODELS` (variantes compatibles vision de Claude/Gemini/OpenAI, etc.) pour exercer la sonde image.

### Agrégateurs / passerelles alternatives

Si vous avez des clés activées, nous prenons aussi en charge les tests via :

- OpenRouter : `openrouter/...` (des centaines de modèles ; utilisez `openclaw models scan` pour trouver des candidats compatibles outils+image)
- OpenCode : `opencode/...` pour Zen et `opencode-go/...` pour Go (authentification via `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Autres fournisseurs que vous pouvez inclure dans la matrice live (si vous avez des identifiants/configurations) :

- Intégrés : `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- Via `models.providers` (points de terminaison personnalisés) : `minimax` (cloud/API), plus tout proxy compatible OpenAI/Anthropic (LM Studio, vLLM, LiteLLM, etc.)

<Tip>
Ne codez pas en dur « tous les modèles » dans la documentation. La liste faisant autorité est celle que `discoverModels(...)` renvoie sur votre machine, plus les clés disponibles.
</Tip>

## Identifiants (ne jamais commit)

Les tests live découvrent les identifiants de la même manière que le CLI. Implications pratiques :

- Si la CLI fonctionne, les tests live devraient trouver les mêmes clés.
- Si un test live indique « no creds », déboguez de la même manière que vous débogueriez `openclaw models list` / la sélection de modèle.

- Profils d’authentification par agent : `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (c’est ce que signifient « clés de profil » dans les tests live)
- Configuration : `~/.openclaw/openclaw.json` (ou `OPENCLAW_CONFIG_PATH`)
- Répertoire d’état hérité : `~/.openclaw/credentials/` (copié dans le répertoire personnel live préparé lorsqu’il est présent, mais ce n’est pas le magasin principal des clés de profil)
- Les exécutions live locales copient par défaut la configuration active, les fichiers `auth-profiles.json` par agent, `credentials/` hérité, ainsi que les répertoires d’authentification CLI externes pris en charge dans un répertoire personnel de test temporaire ; les répertoires personnels live préparés ignorent `workspace/` et `sandboxes/`, et les remplacements de chemins `agents.*.workspace` / `agentDir` sont supprimés afin que les sondes restent à l’écart de votre véritable espace de travail hôte.

Si vous voulez vous appuyer sur des clés d’environnement (par exemple exportées dans votre `~/.profile`), exécutez les tests locaux après `source ~/.profile`, ou utilisez les runners Docker ci-dessous (ils peuvent monter `~/.profile` dans le conteneur).

## Deepgram live (transcription audio)

- Test : `extensions/deepgram/audio.live.test.ts`
- Activer : `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## Plan de codage BytePlus live

- Test : `extensions/byteplus/live.test.ts`
- Activer : `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- Remplacement facultatif du modèle : `BYTEPLUS_CODING_MODEL=ark-code-latest`

## Média de workflow ComfyUI live

- Test : `extensions/comfy/comfy.live.test.ts`
- Activer : `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- Portée :
  - Exerce les chemins comfy groupés pour l’image, la vidéo et `music_generate`
  - Ignore chaque capacité sauf si `plugins.entries.comfy.config.<capability>` est configuré
  - Utile après avoir modifié la soumission de workflow comfy, l’interrogation, les téléchargements ou l’enregistrement du plugin

## Génération d’images live

- Test : `test/image-generation.runtime.live.test.ts`
- Commande : `pnpm test:live test/image-generation.runtime.live.test.ts`
- Harnais : `pnpm test:live:media image`
- Portée :
  - Énumère chaque plugin fournisseur de génération d’images enregistré
  - Charge les variables d’environnement manquantes du fournisseur depuis votre shell de connexion (`~/.profile`) avant la sonde
  - Utilise par défaut les clés API live/env avant les profils d’authentification stockés, afin que les clés de test obsolètes dans `auth-profiles.json` ne masquent pas les véritables identifiants du shell
  - Ignore les fournisseurs sans authentification/profil/modèle utilisable
  - Exécute chaque fournisseur configuré via le runtime partagé de génération d’images :
    - `<provider>:generate`
    - `<provider>:edit` lorsque le fournisseur déclare la prise en charge de l’édition
- Fournisseurs groupés actuellement couverts :
  - `deepinfra`
  - `fal`
  - `google`
  - `minimax`
  - `openai`
  - `openrouter`
  - `vydra`
  - `xai`
- Réduction facultative :
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google,openrouter,xai"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="deepinfra"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-2,google/gemini-3.1-flash-image-preview,openrouter/google/gemini-3.1-flash-image-preview,xai/grok-imagine-image"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit,openrouter:generate,xai:default-generate,xai:default-edit"`
- Comportement d’authentification facultatif :
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` pour forcer l’authentification par magasin de profils et ignorer les remplacements uniquement env

Pour le chemin CLI livré, ajoutez un smoke `infer` après la réussite du test live fournisseur/runtime :

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_INFER_CLI_TEST=1 pnpm test:live -- test/image-generation.infer-cli.live.test.ts
openclaw infer image providers --json
openclaw infer image generate \
  --model google/gemini-3.1-flash-image-preview \
  --prompt "Minimal flat test image: one blue square on a white background, no text." \
  --output ./openclaw-infer-image-smoke.png \
  --json
```

Cela couvre l’analyse des arguments CLI, la résolution de la configuration/de l’agent par défaut, l’activation des plugins groupés, le runtime partagé de génération d’images et la requête live au fournisseur. Les dépendances des plugins doivent être présentes avant le chargement du runtime.

## Génération de musique live

- Test : `extensions/music-generation-providers.live.test.ts`
- Activer : `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harnais : `pnpm test:live:media music`
- Portée :
  - Exerce le chemin partagé des fournisseurs groupés de génération de musique
  - Couvre actuellement Google et MiniMax
  - Charge les variables d’environnement du fournisseur depuis votre shell de connexion (`~/.profile`) avant la sonde
  - Utilise par défaut les clés API live/env avant les profils d’authentification stockés, afin que les clés de test obsolètes dans `auth-profiles.json` ne masquent pas les véritables identifiants du shell
  - Ignore les fournisseurs sans authentification/profil/modèle utilisable
  - Exécute les deux modes runtime déclarés lorsqu’ils sont disponibles :
    - `generate` avec une entrée contenant uniquement une invite
    - `edit` lorsque le fournisseur déclare `capabilities.edit.enabled`
  - Couverture actuelle de la voie partagée :
    - `google` : `generate`, `edit`
    - `minimax` : `generate`
    - `comfy` : fichier live Comfy séparé, pas ce balayage partagé
- Réduction facultative :
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.6"`
- Comportement d’authentification facultatif :
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` pour forcer l’authentification par magasin de profils et ignorer les remplacements uniquement env

## Génération de vidéos live

- Test : `extensions/video-generation-providers.live.test.ts`
- Activer : `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harnais : `pnpm test:live:media video`
- Portée :
  - Exerce le chemin partagé des fournisseurs groupés de génération de vidéos
  - Utilise par défaut le chemin smoke compatible avec les releases : fournisseurs non-FAL, une requête texte-vers-vidéo par fournisseur, invite de homard d’une seconde, et un plafond d’opération par fournisseur issu de `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (`180000` par défaut)
  - Ignore FAL par défaut, car la latence de file d’attente côté fournisseur peut dominer le temps de release ; passez `--video-providers fal` ou `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` pour l’exécuter explicitement
  - Charge les variables d’environnement du fournisseur depuis votre shell de connexion (`~/.profile`) avant la sonde
  - Utilise par défaut les clés API live/env avant les profils d’authentification stockés, afin que les clés de test obsolètes dans `auth-profiles.json` ne masquent pas les véritables identifiants du shell
  - Ignore les fournisseurs sans authentification/profil/modèle utilisable
  - Exécute uniquement `generate` par défaut
  - Définissez `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` pour exécuter également les modes de transformation déclarés lorsqu’ils sont disponibles :
    - `imageToVideo` lorsque le fournisseur déclare `capabilities.imageToVideo.enabled` et que le fournisseur/modèle sélectionné accepte une entrée d’image locale basée sur tampon dans le balayage partagé
    - `videoToVideo` lorsque le fournisseur déclare `capabilities.videoToVideo.enabled` et que le fournisseur/modèle sélectionné accepte une entrée vidéo locale basée sur tampon dans le balayage partagé
  - Fournisseurs `imageToVideo` actuellement déclarés mais ignorés dans le balayage partagé :
    - `vydra` car le `veo3` groupé est uniquement texte et le `kling` groupé nécessite une URL d’image distante
  - Couverture Vydra spécifique au fournisseur :
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - ce fichier exécute `veo3` texte-vers-vidéo ainsi qu’une voie `kling` qui utilise par défaut une fixture d’URL d’image distante
  - Couverture live `videoToVideo` actuelle :
    - `runway` uniquement lorsque le modèle sélectionné est `runway/gen4_aleph`
  - Fournisseurs `videoToVideo` actuellement déclarés mais ignorés dans le balayage partagé :
    - `alibaba`, `qwen`, `xai` car ces chemins nécessitent actuellement des URL de référence `http(s)` / MP4 distantes
    - `google` car la voie Gemini/Veo partagée actuelle utilise une entrée locale basée sur tampon et ce chemin n’est pas accepté dans le balayage partagé
    - `openai` car la voie partagée actuelle ne dispose pas de garanties d’accès propres à l’organisation pour l’inpainting/le remix vidéo
- Réduction facultative :
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="deepinfra,google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""` pour inclure chaque fournisseur dans le balayage par défaut, y compris FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000` pour réduire le plafond de chaque opération fournisseur lors d’une exécution smoke agressive
- Comportement d’authentification facultatif :
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` pour forcer l’authentification par magasin de profils et ignorer les remplacements uniquement env

## Harnais media live

- Commande : `pnpm test:live:media`
- Objectif :
  - Exécute les suites live partagées d’images, de musique et de vidéos via un point d’entrée natif du dépôt
  - Charge automatiquement les variables d’environnement manquantes du fournisseur depuis `~/.profile`
  - Réduit automatiquement par défaut chaque suite aux fournisseurs qui disposent actuellement d’une authentification utilisable
  - Réutilise `scripts/test-live.mjs`, afin que le comportement Heartbeat et mode silencieux reste cohérent
- Exemples :
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Connexe

- [Tests](/fr/help/testing) — suites unitaires, d’intégration, QA et Docker
