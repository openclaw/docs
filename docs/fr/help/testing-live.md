---
read_when:
    - Exécution des tests de fumée en conditions réelles pour la matrice de modèles, le backend CLI, ACP et le fournisseur multimédia
    - Débogage de la résolution des identifiants de test en conditions réelles
    - Ajout d’un nouveau test en conditions réelles spécifique à un fournisseur
sidebarTitle: Live tests
summary: 'Tests en conditions réelles (avec accès au réseau) : matrice de modèles, backends CLI, ACP, fournisseurs de médias, identifiants d’authentification'
title: 'Tests : suites en conditions réelles'
x-i18n:
    generated_at: "2026-07-12T15:30:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 539fc547425f66049fc4df2af29206c281b47ecb75908936977d93020ae19890
    source_path: help/testing-live.md
    workflow: 16
---

Pour le démarrage rapide, les exécuteurs d’assurance qualité, les suites unitaires/d’intégration et les flux Docker, consultez
[Tests](/fr/help/testing). Cette page couvre les tests **en conditions réelles** (accédant au réseau) :
matrice de modèles, backends CLI, ACP, fournisseurs multimédias et gestion des identifiants.

## En conditions réelles : commandes de test rapide local

Exportez la clé du fournisseur nécessaire dans l’environnement du processus avant d’effectuer des
vérifications ponctuelles en conditions réelles.

Test rapide multimédia sûr :

```bash
pnpm openclaw infer tts convert --local --json \
  --text "Test rapide d’OpenClaw en conditions réelles." \
  --output /tmp/openclaw-live-smoke.mp3
```

Test rapide sûr de préparation aux appels vocaux :

```bash
pnpm openclaw voicecall setup --json
pnpm openclaw voicecall smoke --to "+15555550123"
```

`voicecall smoke` est une simulation sauf si `--yes` est également présent ; utilisez `--yes` uniquement
si vous avez l’intention de passer un véritable appel. Pour Twilio, Telnyx et Plivo, une
vérification de préparation réussie nécessite une URL de Webhook publique : les URL de bouclage
locales/privées sont rejetées, car ces fournisseurs ne peuvent pas les atteindre.

## En conditions réelles : analyse des capacités d’un Node Android

- Test : `src/gateway/android-node.capabilities.live.test.ts`
- Script : `pnpm android:test:integration`
- Objectif : invoquer **chaque commande actuellement annoncée** par un Node Android connecté et vérifier le comportement du contrat de commande.
- Périmètre :
  - Configuration préalable/manuelle (la suite n’installe, n’exécute et n’associe pas l’application).
  - Validation commande par commande de `node.invoke` du Gateway pour le Node Android sélectionné.
- Configuration préalable requise :
  - Application Android déjà connectée et associée au Gateway.
  - Application maintenue au premier plan.
  - Autorisations/consentement à la capture accordés pour les capacités dont vous attendez la réussite.
- Remplacements facultatifs de la cible :
  - `OPENCLAW_ANDROID_NODE_ID` ou `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Détails complets de la configuration Android : [Application Android](/fr/platforms/android)

## En conditions réelles : test rapide des modèles (clés de profil)

Les tests de modèles en conditions réelles sont divisés en deux couches afin d’isoler les échecs :

- « Modèle direct » indique si le fournisseur/modèle peut répondre avec la clé donnée.
- « Test rapide du Gateway » indique si le pipeline complet Gateway+agent fonctionne pour ce modèle (sessions, historique, outils, politique du bac à sable, etc.).

Les listes de modèles sélectionnées ci-dessous se trouvent dans `src/agents/live-model-filter.ts` et
évoluent au fil du temps ; considérez les tableaux qui s’y trouvent comme la source de vérité, et non cette
page.

MiniMax M3 utilise `minimax/MiniMax-M3` comme référence fournisseur/modèle par défaut.

### Couche 1 : exécution directe du modèle (sans Gateway)

- Test : `src/agents/models.profiles.live.test.ts`
- Objectif :
  - Énumérer les modèles découverts
  - Utiliser `getApiKeyForModel` pour sélectionner les modèles pour lesquels vous disposez d’identifiants
  - Exécuter une courte complétion par modèle (ainsi que des tests de régression ciblés si nécessaire)
- Activation :
  - `pnpm test:live` (ou `OPENCLAW_LIVE_TEST=1` si vous invoquez Vitest directement)
  - Définissez `OPENCLAW_LIVE_MODELS=modern`, `small` ou `all` (alias de `modern`) pour réellement exécuter cette suite ; sinon, elle est ignorée, afin que `pnpm test:live` seul reste centré sur le test rapide du Gateway.
- Sélection des modèles :
  - `OPENCLAW_LIVE_MODELS=modern` exécute la liste de priorités sélectionnée à forte valeur de signal (voir [En conditions réelles : matrice de modèles](#live-model-matrix-what-we-cover))
  - `OPENCLAW_LIVE_MODELS=small` exécute la liste de priorités sélectionnée des petits modèles
  - `OPENCLAW_LIVE_MODELS=all` est un alias de `modern`
  - ou `OPENCLAW_LIVE_MODELS="openai/gpt-5.6-luna,anthropic/claude-opus-4-6,..."` (liste d’autorisation séparée par des virgules)
  - Les exécutions locales de petits modèles Ollama utilisent par défaut `http://127.0.0.1:11434` ; définissez `OPENCLAW_LIVE_OLLAMA_BASE_URL` uniquement pour les points de terminaison de réseau local, personnalisés ou Ollama Cloud.
  - Les analyses modern/all et small utilisent par défaut la longueur de leur liste sélectionnée comme limite ; définissez `OPENCLAW_LIVE_MAX_MODELS=0` pour une analyse exhaustive des profils sélectionnés, ou un nombre positif pour une limite inférieure.
  - Les analyses exhaustives utilisent `OPENCLAW_LIVE_TEST_TIMEOUT_MS` comme délai d’expiration global du test direct des modèles. Valeur par défaut : 60 minutes.
  - Les sondes directes des modèles s’exécutent par défaut avec un parallélisme de 20 ; définissez `OPENCLAW_LIVE_MODEL_CONCURRENCY` pour remplacer cette valeur.
- Sélection des fournisseurs :
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (liste d’autorisation séparée par des virgules)
- Origine des clés :
  - Par défaut : magasin de profils et valeurs de secours de l’environnement
  - Définissez `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` pour imposer l’utilisation du **magasin de profils** uniquement
- Raison d’être :
  - Distingue « l’API du fournisseur est défaillante / la clé est invalide » de « le pipeline de l’agent du Gateway est défaillant »
  - Contient de petits tests de régression isolés (exemple : relecture du raisonnement OpenAI Responses/Codex Responses et flux d’appels d’outils)

### Couche 2 : test rapide du Gateway + agent de développement (ce que fait réellement « @openclaw »)

- Test : `src/gateway/gateway-models.profiles.live.test.ts`
- Objectif :
  - Démarrer un Gateway dans le processus
  - Créer/corriger une session `agent:dev:*` (remplacement du modèle pour chaque exécution)
  - Parcourir les modèles disposant de clés et vérifier :
    - une réponse « pertinente » (sans outils)
    - le fonctionnement d’une véritable invocation d’outil (sonde de lecture)
    - des sondes d’outils supplémentaires facultatives (sonde d’exécution+lecture)
    - le bon fonctionnement continu des chemins de régression OpenAI (appel d’outil uniquement -> suivi)
- Détails des sondes (afin de pouvoir expliquer rapidement les échecs) :
  - Sonde `read` : le test écrit un fichier de nonce dans l’espace de travail et demande à l’agent de le `read`, puis de renvoyer le nonce.
  - Sonde `exec+read` : le test demande à l’agent d’utiliser `exec` pour écrire un nonce dans un fichier temporaire, puis de le `read`.
  - Sonde d’image : le test joint un PNG généré (chat + code aléatoire) et attend que le modèle renvoie `cat <CODE>`.
  - Référence de l’implémentation : `src/gateway/gateway-models.profiles.live.test.ts` et `test/helpers/live-image-probe.ts`.
- Activation :
  - `pnpm test:live` (ou `OPENCLAW_LIVE_TEST=1` si vous invoquez Vitest directement)
- Sélection des modèles :
  - Par défaut : la liste de priorités sélectionnée à forte valeur de signal (`modern`)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=small` exécute la liste sélectionnée des petits modèles via le pipeline complet Gateway+agent
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` est un alias de `modern`
  - Vous pouvez également définir `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (ou une liste séparée par des virgules) pour restreindre la sélection
  - Les analyses modern/all et small du Gateway utilisent par défaut la longueur de leur liste sélectionnée comme limite ; définissez `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` pour une analyse exhaustive de la sélection, ou un nombre positif pour une limite inférieure.
- Sélection des fournisseurs (évitez « tout via OpenRouter ») :
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (liste d’autorisation séparée par des virgules)
- Les sondes d’outils et d’image sont toujours activées dans ce test en conditions réelles :
  - Sonde `read` + sonde `exec+read` (mise à l’épreuve des outils)
  - La sonde d’image s’exécute lorsque le modèle annonce la prise en charge des images en entrée
  - Flux (vue d’ensemble) :
    - Le test génère un petit PNG contenant « CAT » + un code aléatoire (`test/helpers/live-image-probe.ts`)
    - Il l’envoie via `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - Le Gateway analyse les pièces jointes dans `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - L’agent intégré transmet un message utilisateur multimodal au modèle
    - Vérification : la réponse contient `cat` + le code (tolérance de reconnaissance optique de caractères : erreurs mineures autorisées)

<Tip>
Pour savoir ce que vous pouvez tester sur votre machine (ainsi que les identifiants `provider/model` exacts), exécutez :

```bash
openclaw models list
openclaw models list --json
```

</Tip>

## En conditions réelles : test rapide du backend CLI (Claude, Gemini ou autres CLI locales)

- Test : `src/gateway/gateway-cli-backend.live.test.ts`
- Objectif : valider le pipeline Gateway + agent à l’aide d’un backend CLI local, sans modifier votre configuration par défaut.
- Les valeurs par défaut du test rapide propres à chaque backend se trouvent dans la définition `cli-backend.ts` du Plugin propriétaire.
- Activation :
  - `pnpm test:live` (ou `OPENCLAW_LIVE_TEST=1` si vous invoquez Vitest directement)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Valeurs par défaut :
  - Fournisseur/modèle par défaut : `claude-cli/claude-sonnet-4-6`
  - Le comportement de la commande, des arguments et des images provient des métadonnées du Plugin de backend CLI propriétaire.
- Remplacements (facultatifs) :
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="claude-cli/claude-sonnet-4-6"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/claude"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["-p","--output-format","json"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` pour envoyer une véritable pièce jointe d’image (les chemins sont injectés dans l’invite). Désactivé par défaut dans les recettes Docker.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` pour transmettre les chemins des fichiers image comme arguments CLI au lieu de les injecter dans l’invite.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (ou `"list"`) pour contrôler la transmission des arguments d’image lorsque `IMAGE_ARG` est défini.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` pour envoyer un second tour et valider le flux de reprise.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=1` pour activer explicitement la sonde de continuité de session Claude Sonnet -> Opus lorsque le modèle sélectionné prend en charge une cible de changement. Désactivé par défaut, y compris dans les recettes Docker.
  - `OPENCLAW_LIVE_CLI_BACKEND_MCP_PROBE=1` pour activer explicitement la sonde de bouclage MCP/outils. Désactivé par défaut dans les recettes Docker.

Exemple :

```bash
  OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="claude-cli/claude-sonnet-4-6" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

Test rapide peu coûteux de la configuration MCP de Gemini :

```bash
OPENCLAW_LIVE_TEST=1 \
  pnpm test:live src/agents/cli-runner/bundle-mcp.gemini.live.test.ts
```

Cela ne demande pas à Gemini de générer une réponse. Le test écrit les mêmes paramètres système
qu’OpenClaw fournit à Gemini, puis exécute `gemini --debug mcp list` pour prouver qu’un
serveur `transport: "streamable-http"` enregistré est normalisé selon la structure MCP HTTP de Gemini
et peut se connecter à un serveur MCP HTTP diffusé local.

Recette Docker :

```bash
pnpm test:docker:live-cli-backend
```

Recettes Docker pour un seul fournisseur :

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:claude-subscription
pnpm test:docker:live-cli-backend:gemini
```

Remarques :

- L’exécuteur Docker se trouve dans `scripts/test-live-cli-backend-docker.sh`.
- Il exécute le test rapide du backend CLI en conditions réelles dans l’image Docker du dépôt en tant qu’utilisateur `node` non privilégié.
- Il résout les métadonnées du test rapide CLI à partir du Plugin propriétaire, puis installe le paquet CLI Linux correspondant (`@anthropic-ai/claude-code` ou `@google/gemini-cli`) dans un préfixe accessible en écriture et mis en cache à l’emplacement `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (valeur par défaut : `~/.cache/openclaw/docker-cli-tools`).
- `codex-cli` n’est plus un backend CLI intégré ; utilisez plutôt `openai/*` avec l’environnement d’exécution du serveur d’application Codex (voir [En conditions réelles : test rapide du banc d’essai du serveur d’application Codex](#live-codex-app-server-harness-smoke)).
- `pnpm test:docker:live-cli-backend:claude-subscription` nécessite l’OAuth portable de l’abonnement Claude Code, soit via `~/.claude/.credentials.json` avec `claudeAiOauth.subscriptionType`, soit via `CLAUDE_CODE_OAUTH_TOKEN` issu de `claude setup-token`. Il vérifie d’abord directement `claude -p` dans Docker, puis exécute deux tours du backend CLI du Gateway sans conserver les variables d’environnement de clé d’API Anthropic. Ce parcours d’abonnement désactive par défaut les sondes MCP/outils et d’image de Claude, car il consomme les limites d’utilisation de l’abonnement connecté et Anthropic peut modifier le comportement de facturation et de limitation de débit de Claude Agent SDK / `claude -p` sans nouvelle version d’OpenClaw.
- Claude et Gemini prennent en charge le même ensemble de sondes (tour textuel, classification d’image, appel de l’outil MCP `cron`, continuité lors du changement de modèle) au moyen des indicateurs ci-dessus, mais aucune de ces sondes ne s’exécute par défaut : activez-les explicitement selon les besoins.

## En conditions réelles : accessibilité du proxy HTTP/2 APNs

- Test : `src/infra/push-apns-http2.live.test.ts`
- Objectif : établir un tunnel via un proxy HTTP CONNECT local vers le point de terminaison APNs de l’environnement de test d’Apple, envoyer la requête de validation HTTP/2 APNs et vérifier que la véritable réponse `403 InvalidProviderToken` d’Apple revient par le chemin du proxy.
- Activation :
  - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_APNS_REACHABILITY=1 pnpm test:live src/infra/push-apns-http2.live.test.ts`
- Délai d’expiration facultatif :
  - `OPENCLAW_LIVE_APNS_TIMEOUT_MS=30000`

## En conditions réelles : test rapide de liaison ACP (`/acp spawn ... --bind here`)

- Test : `src/gateway/gateway-acp-bind.live.test.ts`
- Objectif : valider le flux réel de liaison de conversation ACP avec un agent ACP en direct :
  - envoyer `/acp spawn <agent> --bind here`
  - lier sur place une conversation synthétique de canal de messagerie
  - envoyer un suivi normal dans cette même conversation
  - vérifier que le suivi arrive dans la transcription de la session ACP liée
- Activation :
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Valeurs par défaut :
  - Agents ACP dans Docker : `claude,codex,gemini`
  - Agent ACP pour une exécution directe de `pnpm test:live ...` : `claude`
  - Canal synthétique : contexte de conversation de type message privé Slack
  - Backend ACP : `acpx`
- Remplacements :
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=droid`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=opencode`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
  - `OPENCLAW_LIVE_ACP_BIND_CODEX_MODEL=gpt-5.6-luna`
  - `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL=opencode/kimi-k2.6`
  - `OPENCLAW_LIVE_ACP_BIND_IMAGE_PROBE=1` (ou `on`/`true`/`yes`) pour forcer l'activation de la sonde d'image ; toute autre valeur force sa désactivation. Elle s'exécute par défaut pour chaque agent sauf `opencode`.
  - `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1`
  - `OPENCLAW_LIVE_ACP_BIND_PARENT_MODEL=openai/gpt-5.6-luna`
- Remarques :
  - Ce parcours utilise la surface `chat.send` du Gateway avec des champs synthétiques de route d'origine réservés aux administrateurs afin que les tests puissent associer un contexte de canal de messagerie sans simuler une livraison externe.
  - Lorsque `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` n'est pas défini, le test utilise le registre d'agents intégré du plugin `acpx` embarqué pour l'agent du banc d'essai ACP sélectionné.
  - La création Cron MCP de session liée s'effectue au mieux par défaut, car les bancs d'essai ACP externes peuvent annuler les appels MCP après la réussite de la preuve de liaison/d'image ; définissez `OPENCLAW_LIVE_ACP_BIND_REQUIRE_CRON=1` pour rendre stricte cette sonde Cron postérieure à la liaison.

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

Remarques sur Docker :

- Le programme d'exécution Docker se trouve dans `scripts/test-live-acp-bind-docker.sh`.
- Par défaut, il exécute successivement le test de fonctionnement de liaison ACP sur l'ensemble des agents CLI en direct : `claude`, `codex`, puis `gemini`.
- Utilisez `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=droid`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` ou `OPENCLAW_LIVE_ACP_BIND_AGENTS=opencode` pour restreindre la matrice.
- Il prépare dans le conteneur les données d'authentification CLI correspondantes, puis installe la CLI en direct demandée (`@anthropic-ai/claude-code`, `@openai/codex`, Factory Droid via `https://app.factory.ai/cli`, `@google/gemini-cli` ou `opencode-ai`) si elle est absente. Le backend ACP lui-même est le paquet `acpx/runtime` embarqué du plugin officiel `acpx`.
- La variante Docker de Droid prépare `~/.factory` pour les paramètres, transmet `FACTORY_API_KEY` et exige cette clé d'API, car l'authentification locale Factory par OAuth/trousseau n'est pas portable dans le conteneur. Elle utilise l'entrée de registre intégrée `droid exec --output-format acp` d'ACPX.
- La variante Docker d'OpenCode est un parcours de régression strict à agent unique. Elle écrit dans `OPENCODE_CONFIG_CONTENT` un modèle temporaire par défaut provenant de `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL` (valeur par défaut : `opencode/kimi-k2.6`).
- Les appels directs à la CLI `acpx` constituent uniquement une méthode manuelle/de contournement permettant de comparer le comportement hors du Gateway. Le test de fonctionnement de liaison ACP sous Docker exerce le backend d'exécution `acpx` embarqué d'OpenClaw.

## En direct : test de fonctionnement du banc d'essai app-server Codex

- Objectif : valider le banc d'essai Codex appartenant au plugin par l'intermédiaire de la méthode
  `agent` normale du Gateway :
  - charger le plugin `codex` intégré
  - sélectionner un modèle OpenAI avec `/model <ref> --runtime codex`
  - envoyer un premier tour d'agent via le Gateway avec le niveau de réflexion demandé
  - envoyer un second tour à la même session OpenClaw et vérifier que le fil de discussion
    app-server peut reprendre
  - exécuter `/codex status` et `/codex models` via le même chemin de commande du Gateway
  - exécuter facultativement deux sondes shell avec élévation examinées par Guardian : une commande
    bénigne qui devrait être approuvée et un faux téléversement de secret qui devrait être
    refusé afin que l'agent demande confirmation
- Test : `src/gateway/gateway-codex-harness.live.test.ts`
- Activation : `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Modèle de référence du banc d'essai : `openai/gpt-5.6-luna`
- Modèle par défaut pour une nouvelle sélection par clé d'API OpenAI : `openai/gpt-5.6`
- Réflexion par défaut : `low`
- Remplacement du modèle : `OPENCLAW_LIVE_CODEX_HARNESS_MODEL=openai/<model>`
- Remplacement de la réflexion : `OPENCLAW_LIVE_CODEX_HARNESS_THINKING=<level>`
- Remplacement de la matrice : `OPENCLAW_LIVE_CODEX_HARNESS_TARGETS=<model>=<thinking>,...`
- Mode d'authentification : `OPENCLAW_LIVE_CODEX_HARNESS_AUTH=codex-auth` (par défaut) utilise la
  connexion Codex copiée ; `api-key` utilise `OPENAI_API_KEY` via l'app-server Codex.
- Sonde d'image facultative : `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- Sonde MCP/d'outil facultative : `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- Sonde Guardian facultative : `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- Le test de fonctionnement force `agentRuntime.id: "codex"` pour le fournisseur/modèle afin qu'un banc
  d'essai Codex défectueux ne puisse pas réussir en se rabattant silencieusement sur OpenClaw.
- Authentification : authentification app-server Codex issue de la connexion locale à l'abonnement Codex, ou
  `OPENAI_API_KEY` lorsque `OPENCLAW_LIVE_CODEX_HARNESS_AUTH=api-key`. Docker peut
  copier `~/.codex/auth.json` et `~/.codex/config.toml` pour les exécutions avec abonnement.

Recette locale :

```bash
OPENCLAW_LIVE_CODEX_HARNESS=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MODEL=openai/gpt-5.6-luna \
  pnpm test:live -- src/gateway/gateway-codex-harness.live.test.ts
```

Recette Docker :

```bash
pnpm test:docker:live-codex-harness
```

Matrice Codex native GPT-5.6 :

```bash
OPENCLAW_LIVE_CODEX_HARNESS_AUTH=api-key \
  OPENCLAW_LIVE_CODEX_HARNESS_TARGETS='openai/gpt-5.6-sol=ultra,openai/gpt-5.6-terra=ultra,openai/gpt-5.6-luna=max' \
  pnpm test:docker:live-codex-harness
```

Valeur par défaut pour une nouvelle clé d'API OpenAI :

```bash
OPENCLAW_LIVE_GATEWAY_OPENAI_API_DEFAULT=1 \
  OPENCLAW_LIVE_GATEWAY_PROVIDERS=openai \
  OPENCLAW_LIVE_GATEWAY_THINKING=off \
  pnpm test:live -- src/gateway/gateway-models.profiles.live.test.ts
```

Cette preuve laisse `OPENCLAW_LIVE_GATEWAY_MODELS` non défini, résout le modèle par
le point d'intégration de sélection par inférence de la nouvelle intégration, vérifie `openai/gpt-5.6`, puis
exécute un véritable tour via le Gateway avec ce modèle résolu.

Matrice GPT-5.6 intégrée à OpenClaw :

```bash
OPENCLAW_LIVE_GATEWAY_THINKING=ultra \
  OPENCLAW_LIVE_GATEWAY_PROVIDERS=openai \
  OPENCLAW_LIVE_GATEWAY_MODELS='openai/gpt-5.6-sol,openai/gpt-5.6-terra,openai/gpt-5.6-luna' \
  pnpm test:live -- src/gateway/gateway-models.profiles.live.test.ts
```

Remarques sur Docker :

- Le programme d'exécution Docker se trouve dans `scripts/test-live-codex-harness-docker.sh`.
- Il transmet `OPENAI_API_KEY`, copie les fichiers d'authentification de la CLI Codex lorsqu'ils sont présents, installe
  `@openai/codex` dans un préfixe npm monté accessible en écriture,
  prépare l'arborescence source, puis exécute uniquement le test en direct du banc d'essai Codex.
- Docker active par défaut les sondes d'image, MCP/d'outil et Guardian. Définissez
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0`, 
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` ou
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0` lorsque vous avez besoin d'une exécution de débogage
  plus restreinte.
- Docker utilise la même configuration d'exécution Codex explicite ; les anciens alias ou le
  repli vers OpenClaw ne peuvent donc pas masquer une régression du banc d'essai Codex.
- Les cibles de la matrice s'exécutent séquentiellement dans un même conteneur. Le script Docker adapte son
  délai d'expiration par défaut de 35 minutes au nombre de cibles ; tout délai d'expiration d'un shell externe ou de la CI doit
  autoriser la même durée totale. La CI canonique conserve chaque cible GPT-5.6 dans un segment distinct.

### Recettes en direct recommandées

Les listes d'autorisation restreintes et explicites sont les plus rapides et les moins instables :

- Modèle unique, directement (sans Gateway) :
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.6-luna" pnpm test:live src/agents/models.profiles.live.test.ts`

- Profil direct de petits modèles :
  - `OPENCLAW_LIVE_MODELS=small pnpm test:live src/agents/models.profiles.live.test.ts`

- Profil Gateway de petits modèles :
  - `OPENCLAW_LIVE_GATEWAY_MODELS=small pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Test de fonctionnement de l'API Ollama Cloud :
  - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com OPENCLAW_LIVE_OLLAMA_MODEL=glm-5.1:cloud OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0 pnpm test:live -- extensions/ollama/ollama.live.test.ts`

- Modèle unique, test de fonctionnement du Gateway :
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.6-luna" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Appel d'outils avec plusieurs fournisseurs :
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.6-luna,anthropic/claude-opus-4-6,google/gemini-3.5-flash,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M3" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Test de fonctionnement direct de Z.AI Coding Plan GLM-5.2 :
  - `ZAI_CODING_LIVE_TEST=1 pnpm test:live src/agents/zai.live.test.ts`

- Ciblage de Google (clé d'API Gemini + Antigravity) :
  - Gemini (clé d'API) : `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3.5-flash" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth) : `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Test de fonctionnement de la réflexion adaptative Google (`qa manual` depuis la CLI QA privée — nécessite `OPENCLAW_ENABLE_PRIVATE_QA_CLI=1` et une extraction des sources ; consultez la [présentation de l'assurance qualité](/fr/concepts/qa-e2e-automation)) :
  - Valeur dynamique par défaut de Gemini 3 : `OPENCLAW_ENABLE_PRIVATE_QA_CLI=1 pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-3.1-pro-preview --alt-model google/gemini-3.1-pro-preview --message '/think adaptive Reply exactly: GEMINI_ADAPTIVE_OK' --timeout-ms 180000`
  - Budget dynamique de Gemini 2.5 : `OPENCLAW_ENABLE_PRIVATE_QA_CLI=1 pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-2.5-flash --alt-model google/gemini-2.5-flash --message '/think adaptive Reply exactly: GEMINI25_ADAPTIVE_OK' --timeout-ms 180000`

Remarques :

- `google/...` utilise l'API Gemini (clé d'API).
- `google-antigravity/...` utilise la passerelle OAuth Antigravity (point de terminaison d'agent de type Cloud Code Assist).
- `google-gemini-cli/...` utilise la CLI Gemini locale sur votre machine (authentification distincte et particularités d'outillage).
- API Gemini et CLI Gemini :
  - API : OpenClaw appelle l'API Gemini hébergée de Google via HTTP (clé d'API/authentification de profil) ; c'est ce que la plupart des utilisateurs entendent par « Gemini ».
  - CLI : OpenClaw invoque un binaire `gemini` local ; il possède sa propre authentification et peut se comporter différemment (diffusion en continu/prise en charge des outils/décalage de version).

## En direct : matrice de modèles (ce que nous couvrons)

Les tests en direct sont facultatifs ; il n'existe donc aucune « liste de modèles de CI » fixe. `OPENCLAW_LIVE_MODELS=modern` / `OPENCLAW_LIVE_GATEWAY_MODELS=modern` (ainsi que leur alias `all`) exécutent la liste de priorités organisée issue de `HIGH_SIGNAL_LIVE_MODEL_PRIORITY` dans `src/agents/live-model-filter.ts`, dans cet ordre de priorité :

| Fournisseur/modèle                            | Remarques   |
| --------------------------------------------- | ----------- |
| `anthropic/claude-opus-4-8`                   |             |
| `anthropic/claude-sonnet-5`                   |             |
| `anthropic/claude-sonnet-4-6`                 |             |
| `anthropic/claude-opus-4-7`                   |             |
| `google/gemini-3.1-pro-preview`               | API Gemini  |
| `google/gemini-3.5-flash`                     | API Gemini  |
| `cohere/command-a-plus-05-2026`               |             |
| `moonshot/kimi-k2.7-code`                     |             |
| `anthropic/claude-opus-4-6`                   |             |
| `deepseek/deepseek-v4-flash`                  |             |
| `deepseek/deepseek-v4-pro`                    |             |
| `minimax/MiniMax-M3`                          |             |
| `openai/gpt-5.5`                              |             |
| `openrouter/openai/gpt-5.2-chat`              |             |
| `openrouter/minimax/minimax-m2.7`             |             |
| `opencode-go/glm-5`                           |             |
| `openrouter/ai21/jamba-large-1.7`             |             |
| `xai/grok-4.5`                                |             |
| `xai/grok-4.20-0309-reasoning`                |             |
| `zai/glm-5.1`                                 |             |
| `fireworks/accounts/fireworks/models/glm-5p1` |             |
| `minimax-portal/minimax-m3`                   |             |

La liste organisée des **petits modèles** (`OPENCLAW_LIVE_MODELS=small` / `OPENCLAW_LIVE_GATEWAY_MODELS=small`), issue de `SMALL_LIVE_MODEL_PRIORITY` :

| Fournisseur/modèle           |
| ---------------------------- |
| `lmstudio/qwen/qwen3.5-9b`   |
| `vllm/qwen/qwen3-8b`         |
| `sglang/qwen/qwen3-8b`       |
| `ollama/gemma3:4b`           |
| `openrouter/qwen/qwen3.5-9b` |
| `openrouter/z-ai/glm-5.1`    |
| `openrouter/z-ai/glm-5`      |
| `zai/glm-5.1`                |

Remarques sur la liste moderne :

- Les fournisseurs `codex` et `codex-cli` sont exclus du balayage moderne par défaut (ils couvrent le comportement du backend CLI/de l'ACP, testé séparément ci-dessus). `openai/gpt-5.5` est lui-même routé par défaut par le banc d'essai du serveur d'application Codex ; consultez [Test en conditions réelles : contrôle rapide du banc d'essai du serveur d'application Codex](#live-codex-app-server-harness-smoke).
- `fireworks`, `google`, `openrouter` et `xai` n'exécutent que leurs identifiants de modèle explicitement sélectionnés dans le balayage moderne (aucun développement automatique de type « tous les modèles de ce fournisseur »).
- Incluez au moins un modèle prenant en charge les images (variantes avec vision des familles Claude/Gemini/OpenAI, etc.) dans `OPENCLAW_LIVE_GATEWAY_MODELS` afin d'exécuter la sonde d'image.

Exécutez un contrôle rapide du Gateway avec les outils et les images sur un ensemble multifournisseur sélectionné manuellement :

```bash
OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.6-luna,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3.5-flash,google-antigravity/claude-opus-4-6-thinking,deepseek/deepseek-v4-flash,zai/glm-5.1,minimax/MiniMax-M3" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts
```

Couverture supplémentaire facultative en dehors des listes organisées (utile, choisissez un modèle compatible avec les « outils » que vous avez activé) :

- Mistral : `mistral/...`
- Cerebras : `cerebras/...` (si vous y avez accès)
- LM Studio : `lmstudio/...` (local ; l'appel d'outils dépend du mode de l'API)

### Agrégateurs / Gateway alternatifs

Si vous avez activé des clés, vous pouvez également effectuer des tests par l'intermédiaire de :

- OpenRouter : `openrouter/...` (des centaines de modèles ; utilisez `openclaw models scan` pour trouver des candidats compatibles avec les outils et les images)
- OpenCode : `opencode/...` pour Zen et `opencode-go/...` pour Go (authentification par `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Autres fournisseurs que vous pouvez inclure dans la matrice de tests en conditions réelles (si vous disposez d'identifiants/de la configuration) :

- Intégrés : `anthropic`, `cerebras`, `github-copilot`, `google`, `google-antigravity`, `google-gemini-cli`, `google-vertex`, `groq`, `mistral`, `openai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `zai`
- Par l'intermédiaire de `models.providers` (points de terminaison personnalisés) : `minimax` (cloud/API), ainsi que tout proxy compatible avec OpenAI/Anthropic (LM Studio, vLLM, LiteLLM, etc.)

<Tip>
Ne codez pas en dur « tous les modèles » dans la documentation. La liste faisant autorité correspond à ce que `discoverModels(...)` renvoie sur votre machine, complété par les clés disponibles.
</Tip>

## Identifiants (ne jamais les valider dans le dépôt)

Les tests en conditions réelles découvrent les identifiants de la même manière que la CLI. Conséquences pratiques :

- Si la CLI fonctionne, les tests en conditions réelles devraient trouver les mêmes clés.
- Si un test en conditions réelles indique « aucun identifiant », effectuez le débogage comme vous le feriez pour `openclaw models list` / la sélection de modèle.

- Profils d'authentification par agent : `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (c'est ce que « clés de profil » signifie dans les tests en conditions réelles)
- Configuration : `~/.openclaw/openclaw.json` (ou `OPENCLAW_CONFIG_PATH`)
- Répertoire OAuth hérité : `~/.openclaw/credentials/` (copié dans le répertoire personnel de test intermédiaire lorsqu'il est présent, mais il ne s'agit pas du magasin principal de clés de profil)
- Les exécutions locales en conditions réelles copient la configuration active (sans les remplacements `agents.*.workspace` / `agentDir`) et le fichier `auth-profiles.json` de chaque agent — mais pas le reste du répertoire de cet agent, de sorte que les données de `workspace/` et `sandboxes/` n'atteignent jamais le répertoire personnel intermédiaire — ainsi que le répertoire hérité `credentials/` et les fichiers/répertoires d'authentification pris en charge des CLI externes (`.claude.json`, `.claude/.credentials.json`, `.claude/settings*.json`, `.claude/backups`, `.codex/auth.json`, `.codex/config.toml`, `.gemini`, `.minimax`) vers un répertoire personnel de test temporaire.

Si vous souhaitez utiliser des clés d'environnement, exportez-les avant les tests locaux ou utilisez les
programmes d'exécution Docker ci-dessous avec un `OPENCLAW_PROFILE_FILE` explicite.

## Test Deepgram en conditions réelles (transcription audio)

- Test : `extensions/deepgram/audio.live.test.ts`
- Activation : `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## Test en conditions réelles du forfait de programmation BytePlus

- Test : `extensions/byteplus/live.test.ts`
- Activation : `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- Remplacement facultatif du modèle : `BYTEPLUS_CODING_MODEL=ark-code-latest`

## Test en conditions réelles des médias du flux de travail ComfyUI

- Test : `extensions/comfy/comfy.live.test.ts`
- Activation : `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- Portée :
  - Exécute les parcours intégrés d'image, de vidéo et de `music_generate` de comfy
  - Ignore chaque capacité sauf si `plugins.entries.comfy.config.<capability>` est configuré
  - Utile après une modification de la soumission des flux de travail comfy, de l'interrogation périodique, des téléchargements ou de l'enregistrement du Plugin

## Test de génération d'images en conditions réelles

- Test : `test/image-generation.runtime.live.test.ts`
- Commande : `pnpm test:live test/image-generation.runtime.live.test.ts`
- Banc d'essai : `pnpm test:live:media image`
- Portée :
  - Énumère tous les Plugins de fournisseur de génération d'images enregistrés
  - Utilise les variables d'environnement de fournisseur déjà exportées avant d'effectuer les sondes
  - Utilise par défaut les clés d'API des tests en conditions réelles/de l'environnement avant les profils d'authentification stockés, afin que des clés de test obsolètes dans `auth-profiles.json` ne masquent pas les véritables identifiants de l'environnement shell
  - Ignore les fournisseurs ne disposant d'aucune authentification/d'aucun profil/d'aucun modèle utilisable
  - Exécute chaque fournisseur configuré par l'intermédiaire du moteur d'exécution partagé de génération d'images :
    - `<provider>:generate`
    - `<provider>:edit` lorsque le fournisseur déclare prendre en charge la modification
- Fournisseurs intégrés actuellement couverts :
  - `deepinfra`
  - `fal`
  - `google`
  - `minimax`
  - `openai`
  - `openrouter`
  - `vydra`
  - `xai`
- Restriction facultative :
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google,openrouter,xai"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="deepinfra"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-2,google/gemini-3.1-flash-image-preview,openrouter/google/gemini-3.1-flash-image-preview,xai/grok-imagine-image"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit,openrouter:generate,xai:default-generate,xai:default-edit"`
- Comportement d'authentification facultatif :
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` pour imposer l'authentification par le magasin de profils et ignorer les remplacements provenant uniquement de l'environnement

Pour le parcours de la CLI livré, ajoutez un contrôle rapide `infer` après la réussite du test en conditions réelles
du fournisseur/moteur d'exécution :

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_INFER_CLI_TEST=1 pnpm test:live -- test/image-generation.infer-cli.live.test.ts
openclaw infer image providers --json
openclaw infer image generate \
  --model google/gemini-3.1-flash-image-preview \
  --prompt "Image de test plate et minimaliste : un carré bleu sur fond blanc, sans texte." \
  --output ./openclaw-infer-image-smoke.png \
  --json
```

Cela couvre l'analyse des arguments de la CLI, la résolution de la configuration/de l'agent par défaut, l'activation
du Plugin intégré, le moteur d'exécution partagé de génération d'images et la requête au fournisseur
en conditions réelles. Les dépendances du Plugin doivent être présentes avant le chargement du moteur d'exécution.

## Test de génération musicale en conditions réelles

- Test : `extensions/music-generation-providers.live.test.ts`
- Activation : `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Banc d'essai : `pnpm test:live:media music`
- Portée :
  - Exécute le parcours partagé des fournisseurs intégrés de génération musicale
  - Couvre actuellement `fal`, `google`, `minimax` et `openrouter`
  - Utilise les variables d'environnement de fournisseur déjà exportées avant d'effectuer les sondes
  - Utilise par défaut les clés d'API des tests en conditions réelles/de l'environnement avant les profils d'authentification stockés, afin que des clés de test obsolètes dans `auth-profiles.json` ne masquent pas les véritables identifiants de l'environnement shell
  - Ignore les fournisseurs ne disposant d'aucune authentification/d'aucun profil/d'aucun modèle utilisable
  - Exécute les deux modes de moteur d'exécution déclarés lorsqu'ils sont disponibles :
    - `generate` avec une entrée contenant uniquement une invite
    - `edit` lorsque le fournisseur déclare `capabilities.edit.enabled`
  - `comfy` possède son propre fichier de test en conditions réelles distinct et ne fait pas partie de ce balayage partagé
- Restriction facultative :
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.6"`
- Comportement d'authentification facultatif :
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` pour imposer l'authentification par le magasin de profils et ignorer les remplacements provenant uniquement de l'environnement

## Test de génération vidéo en conditions réelles

- Test : `extensions/video-generation-providers.live.test.ts`
- Activation : `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Banc de test : `pnpm test:live:media video`
- Périmètre :
  - Teste le parcours partagé des fournisseurs intégrés de génération vidéo pour `alibaba`, `byteplus`, `deepinfra`, `fal`, `google`, `minimax`, `openai`, `openrouter`, `pixverse`, `qwen`, `runway`, `together`, `vydra`, `xai`
  - Utilise par défaut le parcours de test rapide sûr pour les versions : une requête texte-vers-vidéo par fournisseur, une invite de homard d’une seconde et une limite d’opération par fournisseur définie par `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (`180000` par défaut)
  - Ignore FAL par défaut, car la latence de la file d’attente côté fournisseur peut dominer la durée de publication ; transmettez `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` (ou videz la liste d’exclusion) pour l’exécuter explicitement
  - Utilise les variables d’environnement des fournisseurs déjà exportées avant toute détection
  - Utilise par défaut les clés d’API actives ou issues de l’environnement avant les profils d’authentification enregistrés, afin que les clés de test obsolètes dans `auth-profiles.json` ne masquent pas les véritables identifiants de l’environnement shell
  - Ignore les fournisseurs ne disposant d’aucune authentification, d’aucun profil ou d’aucun modèle utilisable
  - Exécute uniquement `generate` par défaut
  - Définissez `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` pour exécuter également les modes de transformation déclarés lorsqu’ils sont disponibles :
    - `imageToVideo` lorsque le fournisseur déclare `capabilities.imageToVideo.enabled` et que le fournisseur ou modèle sélectionné accepte, dans la campagne partagée, une image locale fournie sous forme de tampon
    - `videoToVideo` lorsque le fournisseur déclare `capabilities.videoToVideo.enabled` et que le fournisseur ou modèle sélectionné accepte, dans la campagne partagée, une vidéo locale fournie sous forme de tampon
  - Fournisseur `imageToVideo` actuellement déclaré mais ignoré dans la campagne partagée :
    - `vydra` (les images locales fournies sous forme de tampon ne sont pas prises en charge dans cette voie)
  - Couverture propre au fournisseur Vydra :
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - Ce fichier exécute une voie texte-vers-vidéo `veo3`, ainsi qu’une voie image-vers-vidéo `kling` qui utilise par défaut une fixture d’URL d’image distante (`OPENCLAW_LIVE_VYDRA_KLING_IMAGE_URL` pour la remplacer).
  - Couverture propre au fournisseur xAI :
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_XAI_VIDEO=1 pnpm test:live -- extensions/xai/xai.live.test.ts -t "classic Grok Imagine"`
    - Le cas classique génère d’abord une première image PNG carrée locale, omet la géométrie, demande une séquence image-vers-vidéo d’une seconde, interroge jusqu’à son achèvement et vérifie le tampon téléchargé.
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_XAI_VIDEO=1 pnpm test:live -- extensions/xai/xai.live.test.ts -t "Grok Imagine Video 1.5"`
    - Le cas 1.5 génère une première image PNG locale, demande une séquence image-vers-vidéo 1080P d’une seconde, interroge jusqu’à son achèvement et vérifie le tampon téléchargé.
  - Couverture active actuelle de `videoToVideo` :
    - `runway` uniquement lorsque le modèle sélectionné correspond à `gen4_aleph`
  - Fournisseurs `videoToVideo` actuellement déclarés mais ignorés dans la campagne partagée :
    - `alibaba`, `google`, `openai`, `qwen`, `xai`, car ces parcours nécessitent actuellement des URL de référence `http(s)` distantes plutôt qu’une entrée locale fournie sous forme de tampon
- Restriction facultative :
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="deepinfra,google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""` pour inclure tous les fournisseurs dans la campagne par défaut, y compris FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000` pour réduire la limite de chaque opération de fournisseur lors d’un test rapide agressif
- Comportement d’authentification facultatif :
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` pour imposer l’authentification via le magasin de profils et ignorer les remplacements provenant uniquement de l’environnement

## Banc de test actif des médias

- Commande : `pnpm test:live:media`
- Point d’entrée : `test/e2e/qa-lab/media/hosted-media-provider-live.ts`, qui exécute `pnpm test:live -- <suite-test-file>` pour chaque suite sélectionnée, afin que le comportement de Heartbeat et du mode silencieux reste cohérent avec les autres exécutions de `pnpm test:live`.
- Objectif :
  - Exécute les suites actives partagées d’image, de musique et de vidéo au moyen d’un point d’entrée natif du dépôt
  - Charge automatiquement depuis `~/.profile` les variables d’environnement manquantes des fournisseurs
  - Restreint automatiquement chaque suite, par défaut, aux fournisseurs disposant actuellement d’une authentification utilisable
- Options :
  - `--providers <csv>` filtre global des fournisseurs ; `--image-providers` / `--music-providers` / `--video-providers` limitent un filtre à une seule suite
  - `--all-providers` désactive le filtrage automatique fondé sur l’authentification
  - `--allow-empty` termine avec le code `0` lorsque le filtrage ne laisse aucun fournisseur exécutable
  - `--quiet` / `--no-quiet` transmises à `test:live`
- Exemples :
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Voir aussi

- [Tests](/fr/help/testing) - suites unitaires, d’intégration, d’assurance qualité et Docker
