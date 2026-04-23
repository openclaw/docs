---
read_when:
    - Recherche d’une étape ou d’un drapeau spécifique de l’onboarding
    - Automatisation de l’onboarding avec le mode non interactif
    - Débogage du comportement de l’onboarding
sidebarTitle: Onboarding Reference
summary: 'Référence complète de l’onboarding CLI : chaque étape, drapeau et champ de configuration'
title: Référence de l’onboarding
x-i18n:
    generated_at: "2026-04-23T07:11:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 51405f5d9ba3d9553662fd0a03254a709d5eb4b27339c5edfe1da1111629d0dd
    source_path: reference/wizard.md
    workflow: 15
---

# Référence de l’onboarding

Ceci est la référence complète pour `openclaw onboard`.
Pour une vue d’ensemble de haut niveau, voir [Onboarding (CLI)](/fr/start/wizard).

## Détails du flux (mode local)

<Steps>
  <Step title="Détection d’une configuration existante">
    - Si `~/.openclaw/openclaw.json` existe, choisissez **Conserver / Modifier / Réinitialiser**.
    - Relancer l’onboarding **n’efface rien** sauf si vous choisissez explicitement **Réinitialiser**
      (ou passez `--reset`).
    - `--reset` en CLI cible par défaut `config+creds+sessions` ; utilisez `--reset-scope full`
      pour supprimer aussi l’espace de travail.
    - Si la configuration est invalide ou contient des clés héritées, l’assistant s’arrête et vous demande
      d’exécuter `openclaw doctor` avant de continuer.
    - La réinitialisation utilise `trash` (jamais `rm`) et propose les portées suivantes :
      - Configuration uniquement
      - Configuration + identifiants + sessions
      - Réinitialisation complète (supprime aussi l’espace de travail)
  </Step>
  <Step title="Modèle/Auth">
    - **Clé API Anthropic** : utilise `ANTHROPIC_API_KEY` si présent ou demande une clé, puis l’enregistre pour l’usage du daemon.
    - **Clé API Anthropic** : choix préféré d’assistant Anthropic dans l’onboarding/la configuration.
    - **Anthropic setup-token** : toujours disponible dans l’onboarding/la configuration, bien qu’OpenClaw préfère maintenant la réutilisation de Claude CLI lorsqu’elle est disponible.
    - **Abonnement OpenAI Code (Codex) (OAuth)** : flux navigateur ; collez le `code#state`.
      - Définit `agents.defaults.model` sur `openai-codex/gpt-5.4` lorsque le modèle n’est pas défini ou vaut `openai/*`.
    - **Abonnement OpenAI Code (Codex) (appairage d’appareil)** : flux d’appairage navigateur avec un code d’appareil de courte durée.
      - Définit `agents.defaults.model` sur `openai-codex/gpt-5.4` lorsque le modèle n’est pas défini ou vaut `openai/*`.
    - **Clé API OpenAI** : utilise `OPENAI_API_KEY` si présent ou demande une clé, puis la stocke dans les profils d’authentification.
      - Définit `agents.defaults.model` sur `openai/gpt-5.4` lorsque le modèle n’est pas défini, vaut `openai/*`, ou `openai-codex/*`.
    - **Clé API xAI (Grok)** : demande `XAI_API_KEY` et configure xAI comme fournisseur de modèles.
    - **OpenCode** : demande `OPENCODE_API_KEY` (ou `OPENCODE_ZEN_API_KEY`, à obtenir sur https://opencode.ai/auth) et vous laisse choisir le catalogue Zen ou Go.
    - **Ollama** : propose d’abord **Cloud + Local**, **Cloud only**, ou **Local only**. `Cloud only` demande `OLLAMA_API_KEY` et utilise `https://ollama.com` ; les modes adossés à l’hôte demandent l’URL de base Ollama, découvrent les modèles disponibles et téléchargent automatiquement le modèle local sélectionné si nécessaire ; `Cloud + Local` vérifie aussi si cet hôte Ollama est connecté pour l’accès cloud.
    - Plus de détails : [Ollama](/fr/providers/ollama)
    - **Clé API** : stocke la clé pour vous.
    - **Vercel AI Gateway (proxy multi-modèles)** : demande `AI_GATEWAY_API_KEY`.
    - Plus de détails : [Vercel AI Gateway](/fr/providers/vercel-ai-gateway)
    - **Cloudflare AI Gateway** : demande l’Account ID, le Gateway ID et `CLOUDFLARE_AI_GATEWAY_API_KEY`.
    - Plus de détails : [Cloudflare AI Gateway](/fr/providers/cloudflare-ai-gateway)
    - **MiniMax** : la configuration est écrite automatiquement ; la valeur par défaut hébergée est `MiniMax-M2.7`.
      La configuration par clé API utilise `minimax/...`, et la configuration OAuth utilise
      `minimax-portal/...`.
    - Plus de détails : [MiniMax](/fr/providers/minimax)
    - **StepFun** : la configuration est écrite automatiquement pour StepFun standard ou Step Plan sur des points de terminaison Chine ou globaux.
    - Standard inclut actuellement `step-3.5-flash`, et Step Plan inclut aussi `step-3.5-flash-2603`.
    - Plus de détails : [StepFun](/fr/providers/stepfun)
    - **Synthetic (compatible Anthropic)** : demande `SYNTHETIC_API_KEY`.
    - Plus de détails : [Synthetic](/fr/providers/synthetic)
    - **Moonshot (Kimi K2)** : la configuration est écrite automatiquement.
    - **Kimi Coding** : la configuration est écrite automatiquement.
    - Plus de détails : [Moonshot AI (Kimi + Kimi Coding)](/fr/providers/moonshot)
    - **Ignorer** : aucune authentification n’est encore configurée.
    - Choisissez un modèle par défaut parmi les options détectées (ou saisissez provider/model manuellement). Pour la meilleure qualité et un risque plus faible d’injection de prompt, choisissez le modèle de dernière génération le plus puissant disponible dans votre pile de fournisseurs.
    - L’onboarding exécute une vérification du modèle et avertit si le modèle configuré est inconnu ou si l’authentification manque.
    - Le mode de stockage des clés API utilise par défaut des valeurs en clair dans les profils d’authentification. Utilisez `--secret-input-mode ref` pour stocker à la place des références adossées à l’env (par exemple `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`).
    - Les profils d’authentification vivent dans `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (clés API + OAuth). `~/.openclaw/credentials/oauth.json` est hérité et uniquement utilisé à l’import.
    - Plus de détails : [/concepts/oauth](/fr/concepts/oauth)
    <Note>
    Astuce headless/serveur : effectuez OAuth sur une machine avec navigateur, puis copiez
    le `auth-profiles.json` de cet agent (par exemple
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`, ou le chemin
    correspondant sous `$OPENCLAW_STATE_DIR/...`) vers l’hôte de la Gateway. `credentials/oauth.json`
    n’est qu’une source d’import héritée.
    </Note>
  </Step>
  <Step title="Espace de travail">
    - Valeur par défaut `~/.openclaw/workspace` (configurable).
    - Initialise les fichiers d’espace de travail nécessaires au rituel de bootstrap de l’agent.
    - Guide complet de disposition et de sauvegarde de l’espace de travail : [Espace de travail de l’agent](/fr/concepts/agent-workspace)
  </Step>
  <Step title="Gateway">
    - Port, bind, mode d’authentification, exposition Tailscale.
    - Recommandation d’authentification : gardez **Token** même pour loopback afin que les clients WS locaux doivent s’authentifier.
    - En mode token, la configuration interactive propose :
      - **Générer/stocker un jeton en clair** (par défaut)
      - **Utiliser SecretRef** (sur demande)
      - Le quickstart réutilise les SecretRefs existants de `gateway.auth.token` sur les fournisseurs `env`, `file`, et `exec` pour la sonde d’onboarding / l’amorçage du tableau de bord.
      - Si ce SecretRef est configuré mais ne peut pas être résolu, l’onboarding échoue tôt avec un message de correction clair au lieu de dégrader silencieusement l’authentification runtime.
    - En mode mot de passe, la configuration interactive prend aussi en charge le stockage en clair ou via SecretRef.
    - Chemin SecretRef de jeton en mode non interactif : `--gateway-token-ref-env <ENV_VAR>`.
      - Exige une variable d’environnement non vide dans l’environnement du processus d’onboarding.
      - Ne peut pas être combiné avec `--gateway-token`.
    - Désactivez l’authentification uniquement si vous faites pleinement confiance à chaque processus local.
    - Les binds non loopback exigent toujours une authentification.
  </Step>
  <Step title="Canaux">
    - [WhatsApp](/fr/channels/whatsapp) : connexion QR facultative.
    - [Telegram](/fr/channels/telegram) : jeton de bot.
    - [Discord](/fr/channels/discord) : jeton de bot.
    - [Google Chat](/fr/channels/googlechat) : JSON de compte de service + audience de Webhook.
    - [Mattermost](/fr/channels/mattermost) (plugin) : jeton de bot + URL de base.
    - [Signal](/fr/channels/signal) : installation facultative de `signal-cli` + configuration du compte.
    - [BlueBubbles](/fr/channels/bluebubbles) : **recommandé pour iMessage** ; URL du serveur + mot de passe + Webhook.
    - [iMessage](/fr/channels/imessage) : chemin CLI `imsg` hérité + accès base de données.
    - Sécurité des messages privés : l’appairage est la valeur par défaut. Le premier message privé envoie un code ; approuvez-le via `openclaw pairing approve <channel> <code>` ou utilisez des listes d’autorisation.
  </Step>
  <Step title="Recherche web">
    - Choisissez un fournisseur pris en charge tel que Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG, ou Tavily (ou ignorez cette étape).
    - Les fournisseurs adossés à une API peuvent utiliser des variables d’environnement ou la configuration existante pour une configuration rapide ; les fournisseurs sans clé utilisent à la place leurs prérequis spécifiques.
    - Ignorer avec `--skip-search`.
    - Configurer plus tard : `openclaw configure --section web`.
  </Step>
  <Step title="Installation du daemon">
    - macOS : LaunchAgent
      - Exige une session utilisateur connectée ; pour du headless, utilisez un LaunchDaemon personnalisé (non fourni).
    - Linux (et Windows via WSL2) : unité utilisateur systemd
      - L’onboarding tente d’activer la persistance via `loginctl enable-linger <user>` afin que la Gateway reste active après la déconnexion.
      - Peut demander sudo (écrit dans `/var/lib/systemd/linger`) ; il essaie d’abord sans sudo.
    - **Sélection du runtime :** Node (recommandé ; requis pour WhatsApp/Telegram). Bun est **déconseillé**.
    - Si l’authentification par jeton exige un jeton et que `gateway.auth.token` est géré par SecretRef, l’installation du daemon le valide mais ne persiste pas les valeurs résolues de jeton en clair dans les métadonnées d’environnement du service superviseur.
    - Si l’authentification par jeton exige un jeton et que le SecretRef de jeton configuré est non résolu, l’installation du daemon est bloquée avec des indications exploitables.
    - Si `gateway.auth.token` et `gateway.auth.password` sont tous deux configurés et que `gateway.auth.mode` n’est pas défini, l’installation du daemon est bloquée jusqu’à ce que le mode soit défini explicitement.
  </Step>
  <Step title="Contrôle de santé">
    - Démarre la Gateway (si nécessaire) et exécute `openclaw health`.
    - Astuce : `openclaw status --deep` ajoute la sonde de santé live de la Gateway à la sortie de statut, y compris les sondes de canal lorsqu’elles sont prises en charge (nécessite une Gateway joignable).
  </Step>
  <Step title="Skills (recommandé)">
    - Lit les Skills disponibles et vérifie les exigences.
    - Vous laisse choisir un gestionnaire Node : **npm / pnpm** (bun déconseillé).
    - Installe les dépendances facultatives (certaines utilisent Homebrew sur macOS).
  </Step>
  <Step title="Terminer">
    - Résumé + étapes suivantes, y compris les apps iOS/Android/macOS pour des fonctionnalités supplémentaires.
  </Step>
</Steps>

<Note>
Si aucune interface graphique n’est détectée, l’onboarding affiche les instructions de redirection de port SSH pour la Control UI au lieu d’ouvrir un navigateur.
Si les assets de la Control UI sont absents, l’onboarding tente de les construire ; la solution de repli est `pnpm ui:build` (installe automatiquement les dépendances UI).
</Note>

## Mode non interactif

Utilisez `--non-interactive` pour automatiser ou scriptiser l’onboarding :

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

SecretRef de jeton de Gateway en mode non interactif :

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

Des exemples de commandes spécifiques aux fournisseurs se trouvent dans [Automatisation CLI](/fr/start/wizard-cli-automation#provider-specific-examples).
Utilisez cette page de référence pour la sémantique des drapeaux et l’ordre des étapes.

### Ajouter un agent (mode non interactif)

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.4 \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

## RPC de l’assistant Gateway

La Gateway expose le flux d’onboarding via RPC (`wizard.start`, `wizard.next`, `wizard.cancel`, `wizard.status`).
Les clients (app macOS, Control UI) peuvent rendre les étapes sans réimplémenter la logique d’onboarding.

## Configuration de Signal (`signal-cli`)

L’onboarding peut installer `signal-cli` depuis les releases GitHub :

- Télécharge l’artefact de release approprié.
- Le stocke sous `~/.openclaw/tools/signal-cli/<version>/`.
- Écrit `channels.signal.cliPath` dans votre configuration.

Remarques :

- Les builds JVM exigent **Java 21**.
- Les builds natifs sont utilisés lorsqu’ils sont disponibles.
- Windows utilise WSL2 ; l’installation de signal-cli suit le flux Linux à l’intérieur de WSL.

## Ce que l’assistant écrit

Champs typiques dans `~/.openclaw/openclaw.json` :

- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers` (si MiniMax est choisi)
- `tools.profile` (l’onboarding local utilise par défaut `"coding"` lorsqu’il n’est pas défini ; les valeurs explicites existantes sont conservées)
- `gateway.*` (mode, bind, auth, Tailscale)
- `session.dmScope` (détails de comportement : [Référence de configuration CLI](/fr/start/wizard-cli-reference#outputs-and-internals))
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Listes d’autorisation de canaux (Slack/Discord/Matrix/Microsoft Teams) lorsque vous choisissez cette option pendant les prompts (les noms sont résolus en identifiants lorsque c’est possible).
- `skills.install.nodeManager`
  - `setup --node-manager` accepte `npm`, `pnpm`, ou `bun`.
  - La configuration manuelle peut toujours utiliser `yarn` en définissant directement `skills.install.nodeManager`.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` écrit `agents.list[]` et d’éventuels `bindings`.

Les identifiants WhatsApp se trouvent sous `~/.openclaw/credentials/whatsapp/<accountId>/`.
Les sessions sont stockées sous `~/.openclaw/agents/<agentId>/sessions/`.

Certains canaux sont fournis sous forme de plugins. Lorsque vous en choisissez un pendant la configuration, l’onboarding
vous demandera de l’installer (npm ou chemin local) avant qu’il puisse être configuré.

## Documentation associée

- Vue d’ensemble de l’onboarding : [Onboarding (CLI)](/fr/start/wizard)
- Onboarding de l’app macOS : [Onboarding](/fr/start/onboarding)
- Référence de configuration : [Configuration de la Gateway](/fr/gateway/configuration)
- Fournisseurs : [WhatsApp](/fr/channels/whatsapp), [Telegram](/fr/channels/telegram), [Discord](/fr/channels/discord), [Google Chat](/fr/channels/googlechat), [Signal](/fr/channels/signal), [BlueBubbles](/fr/channels/bluebubbles) (iMessage), [iMessage](/fr/channels/imessage) (hérité)
- Skills : [Skills](/fr/tools/skills), [Configuration des Skills](/fr/tools/skills-config)
