---
read_when:
    - Rechercher une étape d’intégration ou une option spécifique
    - Automatiser l’intégration avec le mode non interactif
    - Débogage du comportement d’intégration
sidebarTitle: Onboarding Reference
summary: 'Référence complète pour l’intégration CLI : chaque étape, option et champ de configuration'
title: Référence d’intégration
x-i18n:
    generated_at: "2026-05-06T07:38:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: ce0ddb07600ef4f84c44734176e42eb6beaa00fede0be156f3bdd2ec1c0111bb
    source_path: reference/wizard.md
    workflow: 16
---

Ceci est la référence complète pour `openclaw onboard`.
Pour une vue d’ensemble générale, consultez [Intégration (CLI)](/fr/start/wizard).

## Détails du flux (mode local)

<Steps>
  <Step title="Détection de la configuration existante">
    - Si `~/.openclaw/openclaw.json` existe, choisissez **Conserver / Modifier / Réinitialiser**.
    - Relancer l’intégration n’efface **rien** sauf si vous choisissez explicitement **Réinitialiser**
      (ou passez `--reset`).
    - CLI `--reset` utilise par défaut `config+creds+sessions` ; utilisez `--reset-scope full`
      pour supprimer aussi l’espace de travail.
    - Si la configuration est invalide ou contient des clés héritées, l’assistant s’arrête et vous demande
      d’exécuter `openclaw doctor` avant de continuer.
    - La réinitialisation utilise `trash` (jamais `rm`) et propose les périmètres suivants :
      - Configuration uniquement
      - Configuration + identifiants + sessions
      - Réinitialisation complète (supprime aussi l’espace de travail)

  </Step>
  <Step title="Modèle/Auth">
    - **Clé API Anthropic** : utilise `ANTHROPIC_API_KEY` si elle est présente ou demande une clé, puis l’enregistre pour l’utilisation par le daemon.
    - **Clé API Anthropic** : choix d’assistant Anthropic privilégié dans l’intégration/la configuration.
    - **setup-token Anthropic** : toujours disponible dans l’intégration/la configuration, bien qu’OpenClaw privilégie désormais la réutilisation de Claude CLI lorsqu’elle est disponible.
    - **Abonnement OpenAI Code (Codex) (OAuth)** : flux navigateur ; collez le `code#state`.
      - Définit `agents.defaults.model` sur `openai-codex/gpt-5.5` lorsque le modèle n’est pas défini ou appartient déjà à la famille OpenAI.
    - **Abonnement OpenAI Code (Codex) (appairage d’appareil)** : flux d’appairage navigateur avec un code d’appareil de courte durée.
      - Définit `agents.defaults.model` sur `openai-codex/gpt-5.5` lorsque le modèle n’est pas défini ou appartient déjà à la famille OpenAI.
    - **Clé API OpenAI** : utilise `OPENAI_API_KEY` si elle est présente ou demande une clé, puis l’enregistre dans les profils d’authentification.
      - Définit `agents.defaults.model` sur `openai/gpt-5.5` lorsque le modèle n’est pas défini, vaut `openai/*` ou vaut `openai-codex/*`.
    - **Clé API xAI (Grok)** : demande `XAI_API_KEY` et configure xAI comme fournisseur de modèles.
    - **OpenCode** : demande `OPENCODE_API_KEY` (ou `OPENCODE_ZEN_API_KEY`, à obtenir sur https://opencode.ai/auth) et vous permet de choisir le catalogue Zen ou Go.
    - **Ollama** : propose d’abord **Cloud + Local**, **Cloud uniquement** ou **Local uniquement**. `Cloud only` demande `OLLAMA_API_KEY` et utilise `https://ollama.com` ; les modes adossés à un hôte demandent l’URL de base Ollama, découvrent les modèles disponibles et téléchargent automatiquement le modèle local sélectionné si nécessaire ; `Cloud + Local` vérifie aussi si cet hôte Ollama est connecté pour l’accès cloud.
    - Plus de détails : [Ollama](/fr/providers/ollama)
    - **Clé API** : enregistre la clé pour vous.
    - **Vercel AI Gateway (proxy multi-modèle)** : demande `AI_GATEWAY_API_KEY`.
    - Plus de détails : [Vercel AI Gateway](/fr/providers/vercel-ai-gateway)
    - **Cloudflare AI Gateway** : demande l’ID de compte, l’ID Gateway et `CLOUDFLARE_AI_GATEWAY_API_KEY`.
    - Plus de détails : [Cloudflare AI Gateway](/fr/providers/cloudflare-ai-gateway)
    - **MiniMax** : la configuration est écrite automatiquement ; la valeur hébergée par défaut est `MiniMax-M2.7`.
      La configuration par clé API utilise `minimax/...`, et la configuration OAuth utilise
      `minimax-portal/...`.
    - Plus de détails : [MiniMax](/fr/providers/minimax)
    - **StepFun** : la configuration est écrite automatiquement pour StepFun standard ou Step Plan sur les points de terminaison chinois ou mondiaux.
    - Standard inclut actuellement `step-3.5-flash`, et Step Plan inclut aussi `step-3.5-flash-2603`.
    - Plus de détails : [StepFun](/fr/providers/stepfun)
    - **Synthetic (compatible Anthropic)** : demande `SYNTHETIC_API_KEY`.
    - Plus de détails : [Synthetic](/fr/providers/synthetic)
    - **Moonshot (Kimi K2)** : la configuration est écrite automatiquement.
    - **Kimi Coding** : la configuration est écrite automatiquement.
    - Plus de détails : [Moonshot AI (Kimi + Kimi Coding)](/fr/providers/moonshot)
    - **Ignorer** : aucune authentification n’est encore configurée.
    - Choisissez un modèle par défaut parmi les options détectées (ou saisissez fournisseur/modèle manuellement). Pour une qualité optimale et un risque moindre d’injection de prompt, choisissez le modèle de dernière génération le plus puissant disponible dans votre pile de fournisseurs.
    - L’intégration exécute une vérification de modèle et avertit si le modèle configuré est inconnu ou si l’authentification manque.
    - Le mode de stockage des clés API utilise par défaut des valeurs de profil d’authentification en texte clair. Utilisez `--secret-input-mode ref` pour stocker à la place des références adossées à l’environnement (par exemple `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`).
    - Les profils d’authentification résident dans `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (clés API + OAuth). `~/.openclaw/credentials/oauth.json` est une source d’importation héritée uniquement.
    - Plus de détails : [/concepts/oauth](/fr/concepts/oauth)
    <Note>
    Astuce pour serveur/sans interface graphique : terminez OAuth sur une machine avec navigateur, puis copiez
    le `auth-profiles.json` de cet agent (par exemple
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`, ou le chemin correspondant
    `$OPENCLAW_STATE_DIR/...`) vers l’hôte du Gateway. `credentials/oauth.json`
    est seulement une source d’importation héritée.
    </Note>
  </Step>
  <Step title="Espace de travail">
    - `~/.openclaw/workspace` par défaut (configurable).
    - Initialise les fichiers d’espace de travail nécessaires au rituel d’amorçage de l’agent.
    - Structure complète de l’espace de travail + guide de sauvegarde : [Espace de travail de l’agent](/fr/concepts/agent-workspace)

  </Step>
  <Step title="Gateway">
    - Port, liaison, mode d’authentification, exposition Tailscale.
    - Recommandation d’authentification : conservez **Token** même pour le local loopback afin que les clients WS locaux doivent s’authentifier.
    - En mode token, la configuration interactive propose :
      - **Générer/stocker un token en texte clair** (par défaut)
      - **Utiliser SecretRef** (opt-in)
      - Quickstart réutilise les SecretRefs `gateway.auth.token` existants entre les fournisseurs `env`, `file` et `exec` pour la sonde d’intégration/l’amorçage du tableau de bord.
      - Si cette SecretRef est configurée mais ne peut pas être résolue, l’intégration échoue tôt avec un message de correction clair au lieu de dégrader silencieusement l’authentification d’exécution.
    - En mode mot de passe, la configuration interactive prend aussi en charge le stockage en texte clair ou SecretRef.
    - Chemin SecretRef de token non interactif : `--gateway-token-ref-env <ENV_VAR>`.
      - Nécessite une variable d’environnement non vide dans l’environnement du processus d’intégration.
      - Ne peut pas être combiné avec `--gateway-token`.
    - Désactivez l’authentification uniquement si vous faites pleinement confiance à chaque processus local.
    - Les liaisons non-local loopback nécessitent toujours une authentification.

  </Step>
  <Step title="Canaux">
    - [WhatsApp](/fr/channels/whatsapp) : connexion QR facultative.
    - [Telegram](/fr/channels/telegram) : token de bot.
    - [Discord](/fr/channels/discord) : token de bot.
    - [Google Chat](/fr/channels/googlechat) : JSON de compte de service + audience de Webhook.
    - [Mattermost](/fr/channels/mattermost) (plugin) : token de bot + URL de base.
    - [Signal](/fr/channels/signal) : installation facultative de `signal-cli` + configuration de compte.
    - [BlueBubbles](/fr/channels/bluebubbles) : **recommandé pour iMessage** ; URL du serveur + mot de passe + Webhook.
    - [iMessage](/fr/channels/imessage) : chemin CLI `imsg` hérité + accès à la base de données.
    - Sécurité des DM : la valeur par défaut est l’appairage. Le premier DM envoie un code ; approuvez via `openclaw pairing approve <channel> <code>` ou utilisez des listes d’autorisation.

  </Step>
  <Step title="Recherche web">
    - Choisissez un fournisseur pris en charge comme Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG ou Tavily (ou ignorez cette étape).
    - Les fournisseurs adossés à une API peuvent utiliser des variables d’environnement ou une configuration existante pour une configuration rapide ; les fournisseurs sans clé utilisent plutôt leurs prérequis propres au fournisseur.
    - Ignorez avec `--skip-search`.
    - Configurer plus tard : `openclaw configure --section web`.

  </Step>
  <Step title="Installation du daemon">
    - macOS : LaunchAgent
      - Nécessite une session utilisateur connectée ; pour un environnement sans interface, utilisez un LaunchDaemon personnalisé (non fourni).
    - Linux (et Windows via WSL2) : unité utilisateur systemd
      - L’intégration tente d’activer la persistance via `loginctl enable-linger <user>` afin que le Gateway reste actif après la déconnexion.
      - Peut demander sudo (écrit `/var/lib/systemd/linger`) ; il essaie d’abord sans sudo.
    - **Sélection de l’exécution :** Node (recommandé ; requis pour WhatsApp/Telegram). Bun n’est **pas recommandé**.
    - Si l’authentification par token nécessite un token et que `gateway.auth.token` est géré par SecretRef, l’installation du daemon le valide mais ne persiste pas les valeurs de token en texte clair résolues dans les métadonnées d’environnement du service superviseur.
    - Si l’authentification par token nécessite un token et que la SecretRef de token configurée n’est pas résolue, l’installation du daemon est bloquée avec des indications exploitables.
    - Si `gateway.auth.token` et `gateway.auth.password` sont tous deux configurés et que `gateway.auth.mode` n’est pas défini, l’installation du daemon est bloquée jusqu’à ce que le mode soit défini explicitement.

  </Step>
  <Step title="Vérification de santé">
    - Démarre le Gateway (si nécessaire) et exécute `openclaw health`.
    - Astuce : `openclaw status --deep` ajoute la sonde de santé du Gateway en direct à la sortie de statut, y compris les sondes de canaux lorsqu’elles sont prises en charge (nécessite un Gateway joignable).

  </Step>
  <Step title="Skills (recommandé)">
    - Lit les Skills disponibles et vérifie les exigences.
    - Vous permet de choisir un gestionnaire Node : **npm / pnpm** (bun non recommandé).
    - Installe les dépendances facultatives (certaines utilisent Homebrew sur macOS).

  </Step>
  <Step title="Terminer">
    - Résumé + étapes suivantes, y compris les apps iOS/Android/macOS pour des fonctionnalités supplémentaires.

  </Step>
</Steps>

<Note>
Si aucune interface graphique n’est détectée, l’intégration affiche les instructions de redirection de port SSH pour l’interface utilisateur de contrôle au lieu d’ouvrir un navigateur.
Si les ressources de l’interface utilisateur de contrôle sont absentes, l’intégration tente de les construire ; le repli est `pnpm ui:build` (installe automatiquement les dépendances de l’interface utilisateur).
</Note>

## Mode non interactif

Utilisez `--non-interactive` pour automatiser ou scripter l’intégration :

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice apiKey \
  --anthropic-api-key "$ANTHROPIC_API_KEY" \
  --gateway-port 18789 \
  --gateway-bind loopback \
  --install-daemon \
  --daemon-runtime node \
  --skip-skills
```

Ajoutez `--json` pour un résumé lisible par machine.

SecretRef de token Gateway en mode non interactif :

```bash
export OPENCLAW_GATEWAY_TOKEN="your-token"
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice skip \
  --gateway-auth token \
  --gateway-token-ref-env OPENCLAW_GATEWAY_TOKEN
```

`--gateway-token` et `--gateway-token-ref-env` sont mutuellement exclusifs.

<Note>
`--json` n’implique **pas** le mode non interactif. Utilisez `--non-interactive` (et `--workspace`) pour les scripts.
</Note>

Des exemples de commandes propres aux fournisseurs se trouvent dans [Automatisation CLI](/fr/start/wizard-cli-automation#provider-specific-examples).
Utilisez cette page de référence pour la sémantique des flags et l’ordre des étapes.

### Ajouter un agent (non interactif)

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.5 \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

## RPC de l’assistant Gateway

Le Gateway expose le flux d’intégration via RPC (`wizard.start`, `wizard.next`, `wizard.cancel`, `wizard.status`).
Les clients (app macOS, interface utilisateur de contrôle) peuvent afficher les étapes sans réimplémenter la logique d’intégration.

## Configuration de Signal (signal-cli)

L’intégration peut installer `signal-cli` depuis les versions GitHub :

- Télécharge la ressource de version appropriée.
- La stocke sous `~/.openclaw/tools/signal-cli/<version>/`.
- Écrit `channels.signal.cliPath` dans votre configuration.

Notes :

- Les builds JVM nécessitent **Java 21**.
- Les builds natifs sont utilisés lorsqu’ils sont disponibles.
- Windows utilise WSL2 ; l’installation de signal-cli suit le flux Linux dans WSL.

## Ce que l’assistant écrit

Champs typiques dans `~/.openclaw/openclaw.json` :

- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers` (si Minimax est choisi)
- `tools.profile` (l’intégration locale utilise par défaut `"coding"` lorsque la valeur n’est pas définie ; les valeurs explicites existantes sont conservées)
- `gateway.*` (mode, bind, auth, tailscale)
- `session.dmScope` (détails du comportement : [Référence de configuration de la CLI](/fr/start/wizard-cli-reference#outputs-and-internals))
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Listes d’autorisation des canaux (Slack/Discord/Matrix/Microsoft Teams) lorsque vous les activez pendant les invites (les noms sont résolus en identifiants lorsque possible).
- `skills.install.nodeManager`
  - `setup --node-manager` accepte `npm`, `pnpm` ou `bun`.
  - La configuration manuelle peut toujours utiliser `yarn` en définissant directement `skills.install.nodeManager`.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` écrit `agents.list[]` et les `bindings` facultatifs.

Les identifiants WhatsApp vont sous `~/.openclaw/credentials/whatsapp/<accountId>/`.
Les sessions sont stockées sous `~/.openclaw/agents/<agentId>/sessions/`.

Certains canaux sont fournis sous forme de plugins. Lorsque vous en choisissez un pendant la configuration, l’intégration
vous invitera à l’installer (npm ou un chemin local) avant de pouvoir le configurer.

## Documentation connexe

- Vue d’ensemble de l’intégration : [Intégration (CLI)](/fr/start/wizard)
- Intégration de l’application macOS : [Intégration](/fr/start/onboarding)
- Référence de configuration : [Configuration du Gateway](/fr/gateway/configuration)
- Fournisseurs : [WhatsApp](/fr/channels/whatsapp), [Telegram](/fr/channels/telegram), [Discord](/fr/channels/discord), [Google Chat](/fr/channels/googlechat), [Signal](/fr/channels/signal), [BlueBubbles](/fr/channels/bluebubbles) (iMessage), [iMessage](/fr/channels/imessage) (hérité)
- Skills : [Skills](/fr/tools/skills), [Configuration de Skills](/fr/tools/skills-config)
