---
read_when:
    - Exécution des tests smoke matrice de modèles en direct / backend CLI / ACP / fournisseur de médias
    - Débogage de la résolution des identifiants des tests en direct
    - Ajout d’un nouveau test en direct spécifique à un fournisseur
sidebarTitle: Live tests
summary: 'Tests en conditions réelles (accédant au réseau) : matrice des modèles, backends CLI, ACP, fournisseurs de médias, identifiants'
title: 'Tests : suites en direct'
x-i18n:
    generated_at: "2026-05-06T07:26:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: a17a8065fd15c6d86ab782cb1fdb00d0b2558be2d43fb7cab3ca6e511055b82e
    source_path: help/testing-live.md
    workflow: 16
---

Pour le démarrage rapide, les runners QA, les suites unitaires/d’intégration et les flux Docker, consultez
[Tests](/fr/help/testing). Cette page couvre les suites de tests **live** (touchant le réseau) :
matrice de modèles, backends CLI, ACP et tests live des fournisseurs de médias, ainsi que
la gestion des identifiants.

## Live : commandes de smoke du profil local

Sourcez `~/.profile` avant les vérifications live ad hoc afin que les clés des fournisseurs et les chemins des outils locaux
correspondent à votre shell :

```bash
source ~/.profile
```

Smoke média sûr :

```bash
pnpm openclaw infer tts convert --local --json \
  --text "OpenClaw live smoke." \
  --output /tmp/openclaw-live-smoke.mp3
```

Smoke sûr de préparation des appels vocaux :

```bash
pnpm openclaw voicecall setup --json
pnpm openclaw voicecall smoke --to "+15555550123"
```

`voicecall smoke` est une simulation sauf si `--yes` est également présent. Utilisez `--yes` uniquement
lorsque vous souhaitez intentionnellement passer un véritable appel de notification. Pour Twilio, Telnyx et
Plivo, une vérification de préparation réussie nécessite une URL de webhook publique ; les solutions de repli
local-only loopback/privées sont refusées par conception.

## Live : balayage des capacités d’un Node Android

- Test : `src/gateway/android-node.capabilities.live.test.ts`
- Script : `pnpm android:test:integration`
- Objectif : invoquer **chaque commande actuellement annoncée** par un Node Android connecté et vérifier le comportement du contrat de commande.
- Portée :
  - Configuration préalable/manuelle (la suite n’installe, n’exécute et n’apparie pas l’application).
  - Validation `node.invoke` du Gateway commande par commande pour le Node Android sélectionné.
- Configuration préalable requise :
  - Application Android déjà connectée et appariée au Gateway.
  - Application maintenue au premier plan.
  - Autorisations/consentement de capture accordés pour les capacités dont vous attendez la réussite.
- Remplacements de cible facultatifs :
  - `OPENCLAW_ANDROID_NODE_ID` ou `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Détails complets de configuration Android : [Application Android](/fr/platforms/android)

## Live : smoke des modèles (clés de profil)

Les tests live sont divisés en deux couches afin d’isoler les échecs :

- « Modèle direct » indique si le fournisseur/modèle peut répondre avec la clé donnée.
- « Smoke Gateway » indique si le pipeline complet gateway+agent fonctionne pour ce modèle (sessions, historique, outils, politique de sandbox, etc.).

### Couche 1 : complétion directe du modèle (sans Gateway)

- Test : `src/agents/models.profiles.live.test.ts`
- Objectif :
  - Énumérer les modèles découverts
  - Utiliser `getApiKeyForModel` pour sélectionner les modèles pour lesquels vous disposez d’identifiants
  - Exécuter une petite complétion par modèle (et des régressions ciblées si nécessaire)
- Activation :
  - `pnpm test:live` (ou `OPENCLAW_LIVE_TEST=1` si vous invoquez Vitest directement)
- Définissez `OPENCLAW_LIVE_MODELS=modern` (ou `all`, alias de modern) pour exécuter réellement cette suite ; sinon, elle est ignorée afin de garder `pnpm test:live` centré sur le smoke Gateway
- Sélection des modèles :
  - `OPENCLAW_LIVE_MODELS=modern` pour exécuter la liste d’autorisation moderne (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 4.7, MiniMax M2.7, Grok 4.3)
  - `OPENCLAW_LIVE_MODELS=all` est un alias de la liste d’autorisation moderne
  - ou `OPENCLAW_LIVE_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,..."` (liste d’autorisation séparée par des virgules)
  - Les balayages modern/all utilisent par défaut une limite sélectionnée à fort signal ; définissez `OPENCLAW_LIVE_MAX_MODELS=0` pour un balayage moderne exhaustif ou un nombre positif pour une limite plus petite.
  - Les balayages exhaustifs utilisent `OPENCLAW_LIVE_TEST_TIMEOUT_MS` pour le délai d’expiration global du test de modèle direct. Valeur par défaut : 60 minutes.
  - Les sondes de modèle direct s’exécutent par défaut avec un parallélisme de 20 ; définissez `OPENCLAW_LIVE_MODEL_CONCURRENCY` pour le remplacer.
- Sélection des fournisseurs :
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (liste d’autorisation séparée par des virgules)
- Origine des clés :
  - Par défaut : magasin de profils et solutions de repli d’environnement
  - Définissez `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` pour imposer uniquement le **magasin de profils**
- Raison d’être :
  - Sépare « l’API du fournisseur est cassée / la clé est invalide » de « le pipeline d’agent Gateway est cassé »
  - Contient de petites régressions isolées (exemple : rejeu de raisonnement OpenAI Responses/Codex Responses + flux d’appels d’outils)

### Couche 2 : smoke Gateway + agent de développement (ce que fait réellement « @openclaw »)

- Test : `src/gateway/gateway-models.profiles.live.test.ts`
- Objectif :
  - Démarrer un Gateway en processus
  - Créer/corriger une session `agent:dev:*` (remplacement de modèle par exécution)
  - Parcourir les modèles avec clés et vérifier :
    - réponse « significative » (sans outils)
    - invocation réelle d’un outil fonctionnelle (sonde de lecture)
    - sondes d’outils supplémentaires facultatives (sonde exec+read)
    - les chemins de régression OpenAI (appel d’outil seul → suivi) continuent de fonctionner
- Détails des sondes (pour expliquer rapidement les échecs) :
  - Sonde `read` : le test écrit un fichier avec nonce dans l’espace de travail et demande à l’agent de le `read` et de renvoyer le nonce.
  - Sonde `exec+read` : le test demande à l’agent d’écrire via `exec` un nonce dans un fichier temporaire, puis de le `read`.
  - Sonde image : le test joint un PNG généré (chat + code aléatoire) et attend que le modèle renvoie `cat <CODE>`.
  - Référence d’implémentation : `src/gateway/gateway-models.profiles.live.test.ts` et `src/gateway/live-image-probe.ts`.
- Activation :
  - `pnpm test:live` (ou `OPENCLAW_LIVE_TEST=1` si vous invoquez Vitest directement)
- Sélection des modèles :
  - Par défaut : liste d’autorisation moderne (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 4.7, MiniMax M2.7, Grok 4.3)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` est un alias de la liste d’autorisation moderne
  - Ou définissez `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (ou une liste séparée par des virgules) pour restreindre
  - Les balayages Gateway modern/all utilisent par défaut une limite sélectionnée à fort signal ; définissez `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` pour un balayage moderne exhaustif ou un nombre positif pour une limite plus petite.
- Sélection des fournisseurs (éviter « tout OpenRouter ») :
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (liste d’autorisation séparée par des virgules)
- Les sondes d’outils et d’images sont toujours activées dans ce test live :
  - Sonde `read` + sonde `exec+read` (stress des outils)
  - La sonde image s’exécute lorsque le modèle annonce la prise en charge de l’entrée image
  - Flux (vue d’ensemble) :
    - Le test génère un petit PNG avec « CAT » + code aléatoire (`src/gateway/live-image-probe.ts`)
    - L’envoie via `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - Le Gateway analyse les pièces jointes en `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - L’agent intégré transmet un message utilisateur multimodal au modèle
    - Assertion : la réponse contient `cat` + le code (tolérance OCR : erreurs mineures autorisées)

<Tip>
Pour voir ce que vous pouvez tester sur votre machine (et les identifiants `provider/model` exacts), exécutez :

```bash
openclaw models list
openclaw models list --json
```

</Tip>

## Live : smoke des backends CLI (Claude, Codex, Gemini ou autres CLI locales)

- Test : `src/gateway/gateway-cli-backend.live.test.ts`
- Objectif : valider le pipeline Gateway + agent avec un backend CLI local, sans toucher à votre configuration par défaut.
- Les valeurs par défaut de smoke propres à chaque backend résident dans la définition `cli-backend.ts` de l’extension propriétaire.
- Activer :
  - `pnpm test:live` (ou `OPENCLAW_LIVE_TEST=1` si vous invoquez Vitest directement)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Valeurs par défaut :
  - Fournisseur/modèle par défaut : `claude-cli/claude-sonnet-4-6`
  - Le comportement commande/arguments/image provient des métadonnées du Plugin backend CLI propriétaire.
- Remplacements (facultatifs) :
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.5"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` pour envoyer une vraie pièce jointe image (les chemins sont injectés dans le prompt). Les recettes Docker la désactivent par défaut sauf demande explicite.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` pour passer les chemins des fichiers image comme arguments CLI au lieu d’une injection dans le prompt.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (ou `"list"`) pour contrôler la façon dont les arguments image sont passés lorsque `IMAGE_ARG` est défini.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` pour envoyer un second tour et valider le flux de reprise.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=1` pour activer la sonde de continuité même session Claude Sonnet -> Opus lorsque le modèle sélectionné prend en charge une cible de bascule. Les recettes Docker la désactivent par défaut pour la fiabilité agrégée.
  - `OPENCLAW_LIVE_CLI_BACKEND_MCP_PROBE=1` pour activer la sonde MCP/outils en loopback. Les recettes Docker la désactivent par défaut sauf demande explicite.

Exemple :

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.5" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

Smoke économique de configuration MCP Gemini :

```bash
OPENCLAW_LIVE_TEST=1 \
  pnpm test:live src/agents/cli-runner/bundle-mcp.gemini.live.test.ts
```

Cela ne demande pas à Gemini de générer une réponse. Il écrit les mêmes paramètres système
qu’OpenClaw fournit à Gemini, puis exécute `gemini --debug mcp list` pour prouver qu’un
serveur `transport: "streamable-http"` enregistré est normalisé dans la forme HTTP MCP de Gemini
et peut se connecter à un serveur MCP HTTP streamable local.

Recette Docker :

```bash
pnpm test:docker:live-cli-backend
```

Recettes Docker pour un seul fournisseur :

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:claude-subscription
pnpm test:docker:live-cli-backend:codex
pnpm test:docker:live-cli-backend:gemini
```

Notes :

- Le runner Docker se trouve à `scripts/test-live-cli-backend-docker.sh`.
- Il exécute le smoke live du backend CLI dans l’image Docker du dépôt avec l’utilisateur non-root `node`.
- Il résout les métadonnées de smoke CLI depuis l’extension propriétaire, puis installe le package CLI Linux correspondant (`@anthropic-ai/claude-code`, `@openai/codex` ou `@google/gemini-cli`) dans un préfixe inscriptible mis en cache à `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (par défaut : `~/.cache/openclaw/docker-cli-tools`).
- `pnpm test:docker:live-cli-backend:claude-subscription` nécessite un OAuth d’abonnement Claude Code portable via `~/.claude/.credentials.json` avec `claudeAiOauth.subscriptionType` ou `CLAUDE_CODE_OAUTH_TOKEN` provenant de `claude setup-token`. Il prouve d’abord l’exécution directe de `claude -p` dans Docker, puis exécute deux tours de backend CLI Gateway sans conserver les variables d’environnement de clé d’API Anthropic. Cette voie d’abonnement désactive par défaut les sondes MCP/outils et image de Claude, car Claude achemine actuellement l’utilisation d’applications tierces via une facturation d’usage supplémentaire au lieu des limites normales du plan d’abonnement.
- Le smoke live du backend CLI exerce maintenant le même flux de bout en bout pour Claude, Codex et Gemini : tour texte, tour de classification d’image, puis appel d’outil MCP `cron` vérifié via la CLI du Gateway.
- Le smoke par défaut de Claude corrige également la session de Sonnet vers Opus et vérifie que la session reprise se souvient toujours d’une note antérieure.

## Live : accessibilité du proxy APNs HTTP/2

- Test : `src/infra/push-apns-http2.live.test.ts`
- Objectif : passer par un proxy HTTP CONNECT local vers l’endpoint APNs sandbox d’Apple, envoyer la requête de validation HTTP/2 APNs et vérifier que la vraie réponse `403 InvalidProviderToken` d’Apple revient par le chemin du proxy.
- Activer :
  - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_APNS_REACHABILITY=1 pnpm test:live src/infra/push-apns-http2.live.test.ts`
- Délai d’expiration facultatif :
  - `OPENCLAW_LIVE_APNS_TIMEOUT_MS=30000`

## Live : smoke de liaison ACP (`/acp spawn ... --bind here`)

- Test : `src/gateway/gateway-acp-bind.live.test.ts`
- Objectif : valider le flux réel de liaison de conversation ACP avec un agent ACP en direct :
  - envoyer `/acp spawn <agent> --bind here`
  - lier sur place une conversation synthétique de canal de messages
  - envoyer un suivi normal sur cette même conversation
  - vérifier que le suivi arrive dans la transcription de session ACP liée
- Activation :
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Valeurs par défaut :
  - Agents ACP dans Docker : `claude,codex,gemini`
  - Agent ACP pour `pnpm test:live ...` direct : `claude`
  - Canal synthétique : contexte de conversation de type MP Slack
  - Backend ACP : `acpx`
- Surcharges :
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
  - Cette voie utilise la surface `chat.send` du gateway avec des champs de route d’origine synthétiques réservés aux administrateurs afin que les tests puissent attacher un contexte de canal de messages sans prétendre livrer quoi que ce soit à l’extérieur.
  - Lorsque `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` n’est pas défini, le test utilise le registre d’agents intégré du Plugin `acpx` embarqué pour l’agent de harnais ACP sélectionné.
  - La création MCP de Cron de session liée est effectuée au mieux par défaut, car les harnais ACP externes peuvent annuler les appels MCP après la réussite de la preuve de liaison/image ; définissez `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1` pour rendre cette sonde Cron post-liaison stricte.

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

- Le lanceur Docker se trouve dans `scripts/test-live-acp-bind-docker.sh`.
- Par défaut, il exécute le test de fumée de liaison ACP sur les agents CLI directs agrégés dans l’ordre : `claude`, `codex`, puis `gemini`.
- Utilisez `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=droid`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` ou `OPENCLAW_LIVE_ACP_BIND_AGENTS=opencode` pour restreindre la matrice.
- Il source `~/.profile`, prépare le matériel d’authentification CLI correspondant dans le conteneur, puis installe la CLI directe demandée (`@anthropic-ai/claude-code`, `@openai/codex`, Factory Droid via `https://app.factory.ai/cli`, `@google/gemini-cli` ou `opencode-ai`) si elle manque. Le backend ACP lui-même est le package `acpx/runtime` embarqué provenant du Plugin `acpx` officiel.
- La variante Docker Droid prépare `~/.factory` pour les paramètres, transmet `FACTORY_API_KEY` et exige cette clé API, car l’authentification OAuth/keyring Factory locale n’est pas portable dans le conteneur. Elle utilise l’entrée de registre intégrée ACPX `droid exec --output-format acp`.
- La variante Docker OpenCode est une voie de régression stricte à agent unique. Elle écrit un modèle par défaut temporaire `OPENCODE_CONFIG_CONTENT` depuis `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL` (par défaut `opencode/kimi-k2.6`) après avoir sourcé `~/.profile`, et `pnpm test:docker:live-acp-bind:opencode` exige une transcription d’assistant liée au lieu d’accepter l’omission post-liaison générique.
- Les appels CLI `acpx` directs ne sont qu’un chemin manuel/de contournement pour comparer le comportement hors du Gateway. Le test de fumée Docker de liaison ACP exerce le backend d’exécution `acpx` embarqué d’OpenClaw.

## En direct : test de fumée du harnais de serveur d’application Codex

- Objectif : valider le harnais Codex possédé par le Plugin via la méthode `agent`
  normale du gateway :
  - charger le Plugin `codex` fourni
  - sélectionner `OPENCLAW_AGENT_RUNTIME=codex`
  - envoyer un premier tour d’agent gateway à `openai/gpt-5.5` avec le harnais Codex forcé
  - envoyer un second tour à la même session OpenClaw et vérifier que le fil
    du serveur d’application peut reprendre
  - exécuter `/codex status` et `/codex models` via le même chemin de commande
    gateway
  - éventuellement exécuter deux sondes shell avec élévation revues par Guardian : une
    commande bénigne qui devrait être approuvée et un téléversement de faux secret qui devrait être
    refusé afin que l’agent réponde par une question
- Test : `src/gateway/gateway-codex-harness.live.test.ts`
- Activation : `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Modèle par défaut : `openai/gpt-5.5`
- Sonde image facultative : `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- Sonde MCP/outil facultative : `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- Sonde Guardian facultative : `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- Le test de fumée utilise `agentRuntime.id: "codex"` afin qu’un harnais Codex défectueux ne puisse pas
  réussir en retombant silencieusement sur PI.
- Authentification : authentification du serveur d’application Codex issue de la connexion d’abonnement Codex locale. Les tests de fumée Docker
  peuvent aussi fournir `OPENAI_API_KEY` pour les sondes non-Codex le cas échéant,
  ainsi que, facultativement, les fichiers copiés `~/.codex/auth.json` et `~/.codex/config.toml`.

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

- Le lanceur Docker se trouve dans `scripts/test-live-codex-harness-docker.sh`.
- Il source le `~/.profile` monté, transmet `OPENAI_API_KEY`, copie les fichiers
  d’authentification Codex CLI lorsqu’ils sont présents, installe `@openai/codex` dans un préfixe npm
  monté et inscriptible, prépare l’arborescence source, puis exécute uniquement le test en direct du harnais Codex.
- Docker active les sondes image, MCP/outil et Guardian par défaut. Définissez
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` ou
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` ou
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0` lorsque vous avez besoin d’une exécution de débogage
  plus restreinte.
- Docker utilise la même configuration explicite d’exécution Codex, de sorte que les alias hérités ou la
  bascule vers PI ne peuvent pas masquer une régression du harnais Codex.

### Recettes en direct recommandées

Les listes d’autorisation étroites et explicites sont les plus rapides et les moins instables :

- Modèle unique, direct (sans gateway) :
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.5" pnpm test:live src/agents/models.profiles.live.test.ts`

- Modèle unique, test de fumée gateway :
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Appel d’outils sur plusieurs fournisseurs :
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,openai-codex/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Focus Google (clé API Gemini + Antigravity) :
  - Gemini (clé API) : `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth) : `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Test de fumée de pensée adaptative Google :
  - Si les clés locales se trouvent dans le profil shell : `source ~/.profile`
  - Valeur dynamique par défaut Gemini 3 : `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-3.1-pro-preview --alt-model google/gemini-3.1-pro-preview --message '/think adaptive Reply exactly: GEMINI_ADAPTIVE_OK' --timeout-ms 180000`
  - Budget dynamique Gemini 2.5 : `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-2.5-flash --alt-model google/gemini-2.5-flash --message '/think adaptive Reply exactly: GEMINI25_ADAPTIVE_OK' --timeout-ms 180000`

Notes :

- `google/...` utilise l’API Gemini (clé API).
- `google-antigravity/...` utilise le pont OAuth Antigravity (endpoint d’agent de type Cloud Code Assist).
- `google-gemini-cli/...` utilise la CLI Gemini locale sur votre machine (authentification distincte + particularités d’outillage).
- API Gemini vs CLI Gemini :
  - API : OpenClaw appelle l’API Gemini hébergée de Google via HTTP (clé API / authentification de profil) ; c’est ce que la plupart des utilisateurs entendent par « Gemini ».
  - CLI : OpenClaw lance un binaire local `gemini` via le shell ; il possède sa propre authentification et peut se comporter différemment (prise en charge du streaming/des outils/décalage de version).

## En direct : matrice de modèles (ce que nous couvrons)

Il n’existe pas de « liste de modèles CI » fixe (le direct est optionnel), mais voici les modèles **recommandés** à couvrir régulièrement sur une machine de développement avec des clés.

### Ensemble de test de fumée moderne (appel d’outils + image)

Voici l’exécution des « modèles courants » que nous prévoyons de maintenir fonctionnelle :

- OpenAI (non-Codex) : `openai/gpt-5.5`
- OpenAI Codex OAuth : `openai-codex/gpt-5.5`
- Anthropic : `anthropic/claude-opus-4-6` (ou `anthropic/claude-sonnet-4-6`)
- Google (API Gemini) : `google/gemini-3.1-pro-preview` et `google/gemini-3-flash-preview` (évitez les anciens modèles Gemini 2.x)
- Google (Antigravity) : `google-antigravity/claude-opus-4-6-thinking` et `google-antigravity/gemini-3-flash`
- DeepSeek : `deepseek/deepseek-v4-flash` et `deepseek/deepseek-v4-pro`
- Z.AI (GLM) : `zai/glm-5.1`
- MiniMax : `minimax/MiniMax-M2.7`

Exécuter le test de fumée gateway avec outils + image :
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

- xAI : `xai/grok-4.3` (ou le plus récent disponible)
- Mistral : `mistral/`… (choisissez un modèle compatible « outils » que vous avez activé)
- Cerebras : `cerebras/`… (si vous avez accès)
- LM Studio : `lmstudio/`… (local ; l’appel d’outils dépend du mode API)

### Vision : envoi d’image (pièce jointe → message multimodal)

Incluez au moins un modèle compatible image dans `OPENCLAW_LIVE_GATEWAY_MODELS` (variantes Claude/Gemini/OpenAI compatibles vision, etc.) pour exercer la sonde image.

### Agrégateurs / gateways alternatifs

Si vous avez des clés activées, nous prenons aussi en charge les tests via :

- OpenRouter : `openrouter/...` (des centaines de modèles ; utilisez `openclaw models scan` pour trouver des candidats compatibles outils+image)
- OpenCode : `opencode/...` pour Zen et `opencode-go/...` pour Go (authentification via `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Autres fournisseurs que vous pouvez inclure dans la matrice directe (si vous avez les identifiants/la configuration) :

- Intégrés : `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- Via `models.providers` (endpoints personnalisés) : `minimax` (cloud/API), plus tout proxy compatible OpenAI/Anthropic (LM Studio, vLLM, LiteLLM, etc.)

<Tip>
Ne codez pas en dur « tous les modèles » dans la documentation. La liste faisant autorité est celle que `discoverModels(...)` renvoie sur votre machine, plus les clés disponibles.
</Tip>

## Identifiants (ne jamais valider)

Les tests en direct découvrent les identifiants de la même manière que la CLI. Implications pratiques :

- Si la CLI fonctionne, les tests en direct devraient trouver les mêmes clés.
- Si un test en direct indique « aucun identifiant », déboguez de la même manière que vous débogueriez `openclaw models list` / la sélection de modèle.

- Profils d’authentification par agent : `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (c’est ce que « clés de profil » signifie dans les tests en direct)
- Configuration : `~/.openclaw/openclaw.json` (ou `OPENCLAW_CONFIG_PATH`)
- Répertoire d’état hérité : `~/.openclaw/credentials/` (copié dans le répertoire personnel de test en direct préparé lorsqu’il est présent, mais pas dans le stockage principal des clés de profil)
- Les exécutions locales en direct copient par défaut la configuration active, les fichiers `auth-profiles.json` par agent, le répertoire hérité `credentials/` et les répertoires d’authentification CLI externes pris en charge dans un répertoire personnel de test temporaire ; les répertoires personnels en direct préparés ignorent `workspace/` et `sandboxes/`, et les remplacements de chemins `agents.*.workspace` / `agentDir` sont supprimés afin que les sondes restent hors de votre véritable espace de travail hôte.

Si vous voulez vous appuyer sur des clés d’environnement (par exemple exportées dans votre `~/.profile`), lancez les tests locaux après `source ~/.profile`, ou utilisez les runners Docker ci-dessous (ils peuvent monter `~/.profile` dans le conteneur).

## Deepgram en direct (transcription audio)

- Test : `extensions/deepgram/audio.live.test.ts`
- Activation : `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## Plan de codage BytePlus en direct

- Test : `extensions/byteplus/live.test.ts`
- Activation : `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- Remplacement optionnel du modèle : `BYTEPLUS_CODING_MODEL=ark-code-latest`

## Média de workflow ComfyUI en direct

- Test : `extensions/comfy/comfy.live.test.ts`
- Activation : `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- Portée :
  - Exerce les chemins groupés comfy d’image, de vidéo et `music_generate`
  - Ignore chaque capacité sauf si `plugins.entries.comfy.config.<capability>` est configuré
  - Utile après avoir modifié la soumission de workflows comfy, l’interrogation, les téléchargements ou l’enregistrement de plugins

## Génération d’images en direct

- Test : `test/image-generation.runtime.live.test.ts`
- Commande : `pnpm test:live test/image-generation.runtime.live.test.ts`
- Harnais : `pnpm test:live:media image`
- Portée :
  - Énumère chaque plugin fournisseur de génération d’images enregistré
  - Charge les variables d’environnement fournisseur manquantes depuis votre shell de connexion (`~/.profile`) avant les sondes
  - Utilise par défaut les clés API en direct/d’environnement avant les profils d’authentification stockés, afin que les clés de test obsolètes dans `auth-profiles.json` ne masquent pas les véritables identifiants du shell
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
- Réduction optionnelle :
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google,openrouter,xai"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="deepinfra"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-2,google/gemini-3.1-flash-image-preview,openrouter/google/gemini-3.1-flash-image-preview,xai/grok-imagine-image"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit,openrouter:generate,xai:default-generate,xai:default-edit"`
- Comportement d’authentification optionnel :
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` pour forcer l’authentification via le stockage de profils et ignorer les remplacements uniquement issus de l’environnement

Pour le chemin CLI livré, ajoutez un smoke `infer` après la réussite du test en direct fournisseur/runtime :

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_INFER_CLI_TEST=1 pnpm test:live -- test/image-generation.infer-cli.live.test.ts
openclaw infer image providers --json
openclaw infer image generate \
  --model google/gemini-3.1-flash-image-preview \
  --prompt "Minimal flat test image: one blue square on a white background, no text." \
  --output ./openclaw-infer-image-smoke.png \
  --json
```

Cela couvre l’analyse des arguments CLI, la résolution de la configuration/de l’agent par défaut, l’activation des plugins groupés, le runtime partagé de génération d’images et la requête fournisseur en direct. Les dépendances des plugins doivent être présentes avant le chargement du runtime.

## Génération de musique en direct

- Test : `extensions/music-generation-providers.live.test.ts`
- Activation : `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harnais : `pnpm test:live:media music`
- Portée :
  - Exerce le chemin fournisseur groupé partagé de génération de musique
  - Couvre actuellement Google et MiniMax
  - Charge les variables d’environnement fournisseur depuis votre shell de connexion (`~/.profile`) avant les sondes
  - Utilise par défaut les clés API en direct/d’environnement avant les profils d’authentification stockés, afin que les clés de test obsolètes dans `auth-profiles.json` ne masquent pas les véritables identifiants du shell
  - Ignore les fournisseurs sans authentification/profil/modèle utilisable
  - Exécute les deux modes de runtime déclarés lorsqu’ils sont disponibles :
    - `generate` avec une entrée contenant uniquement une invite
    - `edit` lorsque le fournisseur déclare `capabilities.edit.enabled`
  - Couverture actuelle de la voie partagée :
    - `google` : `generate`, `edit`
    - `minimax` : `generate`
    - `comfy` : fichier Comfy en direct séparé, pas ce balayage partagé
- Réduction optionnelle :
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.6"`
- Comportement d’authentification optionnel :
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` pour forcer l’authentification via le stockage de profils et ignorer les remplacements uniquement issus de l’environnement

## Génération de vidéos en direct

- Test : `extensions/video-generation-providers.live.test.ts`
- Activation : `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harnais : `pnpm test:live:media video`
- Portée :
  - Exerce le chemin fournisseur groupé partagé de génération de vidéos
  - Utilise par défaut le chemin smoke sûr pour la publication : fournisseurs non-FAL, une requête texte-vers-vidéo par fournisseur, invite d’une seconde avec homard, et limite d’opération par fournisseur depuis `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (`180000` par défaut)
  - Ignore FAL par défaut car la latence de file d’attente côté fournisseur peut dominer le temps de publication ; passez `--video-providers fal` ou `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` pour l’exécuter explicitement
  - Charge les variables d’environnement fournisseur depuis votre shell de connexion (`~/.profile`) avant les sondes
  - Utilise par défaut les clés API en direct/d’environnement avant les profils d’authentification stockés, afin que les clés de test obsolètes dans `auth-profiles.json` ne masquent pas les véritables identifiants du shell
  - Ignore les fournisseurs sans authentification/profil/modèle utilisable
  - Exécute uniquement `generate` par défaut
  - Définissez `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` pour exécuter aussi les modes de transformation déclarés lorsqu’ils sont disponibles :
    - `imageToVideo` lorsque le fournisseur déclare `capabilities.imageToVideo.enabled` et que le fournisseur/modèle sélectionné accepte l’entrée d’image locale basée sur un tampon dans le balayage partagé
    - `videoToVideo` lorsque le fournisseur déclare `capabilities.videoToVideo.enabled` et que le fournisseur/modèle sélectionné accepte l’entrée de vidéo locale basée sur un tampon dans le balayage partagé
  - Fournisseurs `imageToVideo` actuellement déclarés mais ignorés dans le balayage partagé :
    - `vydra` parce que le `veo3` groupé est uniquement texte et que le `kling` groupé exige une URL d’image distante
  - Couverture Vydra spécifique au fournisseur :
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - ce fichier exécute `veo3` texte-vers-vidéo ainsi qu’une voie `kling` qui utilise par défaut un fixture d’URL d’image distante
  - Couverture en direct actuelle de `videoToVideo` :
    - `runway` uniquement lorsque le modèle sélectionné est `runway/gen4_aleph`
  - Fournisseurs `videoToVideo` actuellement déclarés mais ignorés dans le balayage partagé :
    - `alibaba`, `qwen`, `xai` parce que ces chemins exigent actuellement des URL de référence distantes `http(s)` / MP4
    - `google` parce que la voie partagée Gemini/Veo actuelle utilise une entrée locale basée sur un tampon et que ce chemin n’est pas accepté dans le balayage partagé
    - `openai` parce que la voie partagée actuelle ne dispose pas de garanties d’accès propres à l’organisation pour l’inpainting/le remix vidéo
- Réduction optionnelle :
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="deepinfra,google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""` pour inclure tous les fournisseurs dans le balayage par défaut, y compris FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000` pour réduire la limite de chaque opération fournisseur lors d’un smoke run agressif
- Comportement d’authentification optionnel :
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` pour forcer l’authentification via le stockage de profils et ignorer les remplacements uniquement issus de l’environnement

## Harnais média en direct

- Commande : `pnpm test:live:media`
- Objectif :
  - Exécute les suites en direct partagées d’image, de musique et de vidéo via un point d’entrée natif au dépôt
  - Charge automatiquement les variables d’environnement fournisseur manquantes depuis `~/.profile`
  - Réduit automatiquement chaque suite aux fournisseurs qui disposent actuellement d’une authentification utilisable par défaut
  - Réutilise `scripts/test-live.mjs`, afin que le comportement de Heartbeat et du mode silencieux reste cohérent
- Exemples :
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Associé

- [Tests](/fr/help/testing) - suites unitaires, d’intégration, QA et Docker
