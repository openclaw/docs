---
read_when:
    - Recherche d’une étape d’intégration ou d’un indicateur spécifique
    - Automatiser l’intégration avec le mode non interactif
    - Débogage du comportement d’intégration
sidebarTitle: Onboarding Reference
summary: 'Référence complète pour l’onboarding CLI : chaque étape, indicateur et champ de configuration'
title: Référence d’intégration
x-i18n:
    generated_at: "2026-06-27T18:13:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 739048d53983febc32adaeab10225a288ae66752bee70cfea500d1664fd8546b
    source_path: reference/wizard.md
    workflow: 16
---

Voici la référence complète pour `openclaw onboard`.
Pour une vue d’ensemble, consultez [Onboarding (CLI)](/fr/start/wizard).

## Détails du flux (mode local)

<Steps>
  <Step title="Détection de la configuration existante">
    - Si `~/.openclaw/openclaw.json` existe, choisissez **Conserver les valeurs actuelles**, **Examiner et mettre à jour** ou **Réinitialiser avant la configuration**.
    - Relancer l’onboarding n’efface **rien** sauf si vous choisissez explicitement **Réinitialiser**
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
    - **Clé API Anthropic** : choix d’assistant Anthropic privilégié dans onboarding/configure.
    - **setup-token Anthropic** : toujours disponible dans onboarding/configure, bien qu’OpenClaw privilégie désormais la réutilisation de Claude CLI lorsqu’elle est disponible.
    - **Abonnement OpenAI Code (Codex) (OAuth)** : flux navigateur ; collez le `code#state`.
      - Définit `agents.defaults.model` sur `openai/gpt-5.5` via le runtime Codex lorsque le modèle n’est pas défini ou appartient déjà à la famille OpenAI.
    - **Abonnement OpenAI Code (Codex) (appariement d’appareil)** : flux d’appariement navigateur avec un code d’appareil de courte durée.
      - Définit `agents.defaults.model` sur `openai/gpt-5.5` via le runtime Codex lorsque le modèle n’est pas défini ou appartient déjà à la famille OpenAI.
    - **Clé API OpenAI** : utilise `OPENAI_API_KEY` si elle est présente ou demande une clé, puis la stocke dans les profils d’authentification.
      - Définit `agents.defaults.model` sur `openai/gpt-5.5` lorsque le modèle n’est pas défini, vaut `openai/*` ou correspond à des références de modèles Codex héritées.
    - **xAI (Grok) OAuth / clé API** : se connecte avec xAI OAuth lorsque ce choix est sélectionné, ou demande `XAI_API_KEY` dans le chemin de clé API, et configure xAI comme fournisseur de modèles.
    - **OpenCode** : demande `OPENCODE_API_KEY` (ou `OPENCODE_ZEN_API_KEY`, à obtenir sur https://opencode.ai/auth) et vous laisse choisir le catalogue Zen ou Go.
    - **Ollama** : propose d’abord **Cloud + local**, **Cloud uniquement** ou **Local uniquement**. `Cloud only` demande `OLLAMA_API_KEY` et utilise `https://ollama.com` ; les modes adossés à un hôte demandent l’URL de base Ollama, découvrent les modèles disponibles et téléchargent automatiquement le modèle local sélectionné si nécessaire ; `Cloud + Local` vérifie aussi si cet hôte Ollama est connecté pour l’accès cloud.
    - Plus de détails : [Ollama](/fr/providers/ollama)
    - **Clé API** : stocke la clé pour vous.
    - **Vercel AI Gateway (proxy multi-modèle)** : demande `AI_GATEWAY_API_KEY`.
    - Plus de détails : [Vercel AI Gateway](/fr/providers/vercel-ai-gateway)
    - **Cloudflare AI Gateway** : demande l’ID de compte, l’ID du Gateway et `CLOUDFLARE_AI_GATEWAY_API_KEY`.
    - Plus de détails : [Cloudflare AI Gateway](/fr/providers/cloudflare-ai-gateway)
    - **MiniMax** : la configuration est écrite automatiquement ; la valeur par défaut hébergée est `MiniMax-M3`.
      La configuration par clé API utilise `minimax/...`, et la configuration OAuth utilise
      `minimax-portal/...`.
    - Plus de détails : [MiniMax](/fr/providers/minimax)
    - **StepFun** : la configuration est écrite automatiquement pour StepFun standard ou Step Plan sur les points de terminaison Chine ou globaux.
    - Standard inclut actuellement `step-3.5-flash`, et Step Plan inclut aussi `step-3.5-flash-2603`.
    - Plus de détails : [StepFun](/fr/providers/stepfun)
    - **Synthetic (compatible Anthropic)** : demande `SYNTHETIC_API_KEY`.
    - Plus de détails : [Synthetic](/fr/providers/synthetic)
    - **Moonshot (Kimi K2)** : la configuration est écrite automatiquement.
    - **Kimi Coding** : la configuration est écrite automatiquement.
    - Plus de détails : [Moonshot AI (Kimi + Kimi Coding)](/fr/providers/moonshot)
    - **Ignorer** : aucune authentification n’est encore configurée.
    - Choisissez un modèle par défaut parmi les options détectées (ou saisissez fournisseur/modèle manuellement). Pour obtenir la meilleure qualité et réduire le risque d’injection de prompt, choisissez le modèle de dernière génération le plus puissant disponible dans votre pile de fournisseurs.
    - L’onboarding exécute une vérification du modèle et avertit si le modèle configuré est inconnu ou si l’authentification manque.
    - Le mode de stockage des clés API utilise par défaut des valeurs de profil d’authentification en texte brut. Utilisez `--secret-input-mode ref` pour stocker à la place des références adossées à des variables d’environnement (par exemple `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`).
    - Les profils d’authentification résident dans `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (clés API + OAuth). `~/.openclaw/credentials/oauth.json` est uniquement une source d’import héritée.
    - Plus de détails : [/concepts/oauth](/fr/concepts/oauth)
    <Note>
    Astuce headless/serveur : terminez OAuth sur une machine avec un navigateur, puis copiez
    le `auth-profiles.json` de cet agent (par exemple
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`, ou le chemin correspondant
    `$OPENCLAW_STATE_DIR/...`) vers l’hôte Gateway. `credentials/oauth.json`
    est uniquement une source d’import héritée.
    </Note>
  </Step>
  <Step title="Espace de travail">
    - `~/.openclaw/workspace` par défaut (configurable).
    - Amorçage des fichiers d’espace de travail nécessaires au rituel de démarrage de l’agent.
    - Structure complète de l’espace de travail + guide de sauvegarde : [Espace de travail de l’agent](/fr/concepts/agent-workspace)

  </Step>
  <Step title="Gateway">
    - Port, liaison, mode d’authentification, exposition Tailscale.
    - Recommandation d’authentification : conservez **Jeton** même pour loopback afin que les clients WS locaux doivent s’authentifier.
    - En mode jeton, la configuration interactive propose :
      - **Générer/stocker un jeton en texte brut** (par défaut)
      - **Utiliser SecretRef** (opt-in)
      - Quickstart réutilise les SecretRefs `gateway.auth.token` existantes sur les fournisseurs `env`, `file` et `exec` pour la sonde d’onboarding/le démarrage du tableau de bord.
      - Si cette SecretRef est configurée mais ne peut pas être résolue, l’onboarding échoue tôt avec un message de correction clair au lieu de dégrader silencieusement l’authentification du runtime.
    - En mode mot de passe, la configuration interactive prend aussi en charge le stockage en texte brut ou SecretRef.
    - Chemin SecretRef de jeton non interactif : `--gateway-token-ref-env <ENV_VAR>`.
      - Nécessite une variable d’environnement non vide dans l’environnement du processus d’onboarding.
      - Ne peut pas être combiné avec `--gateway-token`.
    - Désactivez l’authentification uniquement si vous faites entièrement confiance à tous les processus locaux.
    - Les liaisons non-loopback exigent toujours une authentification.

  </Step>
  <Step title="Canaux">
    - [WhatsApp](/fr/channels/whatsapp) : connexion QR facultative.
    - [Telegram](/fr/channels/telegram) : jeton de bot.
    - [Discord](/fr/channels/discord) : jeton de bot.
    - [Google Chat](/fr/channels/googlechat) : JSON de compte de service + audience du webhook.
    - [Mattermost](/fr/channels/mattermost) (plugin) : jeton de bot + URL de base.
    - [Signal](/fr/channels/signal) : installation facultative de `signal-cli` + configuration du compte.
    - [iMessage](/fr/channels/imessage) : chemin CLI `imsg` + accès à la base de données Messages ; utilisez un wrapper SSH lorsque le Gateway s’exécute hors Mac.
    - Sécurité des DM : l’appariement est la valeur par défaut. Le premier DM envoie un code ; approuvez via `openclaw pairing approve <channel> <code>` ou utilisez des listes d’autorisation.

  </Step>
  <Step title="Recherche web">
    - Choisissez un fournisseur pris en charge, tel que Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG ou Tavily (ou ignorez).
    - Les fournisseurs adossés à une API peuvent utiliser des variables d’environnement ou la configuration existante pour une configuration rapide ; les fournisseurs sans clé utilisent plutôt leurs prérequis propres.
    - Ignorez avec `--skip-search`.
    - Configurer plus tard : `openclaw configure --section web`.

  </Step>
  <Step title="Installation du daemon">
    - macOS : LaunchAgent
      - Nécessite une session utilisateur connectée ; pour le headless, utilisez un LaunchDaemon personnalisé (non fourni).
    - Linux (et Windows via WSL2) : unité utilisateur systemd
      - L’onboarding tente d’activer la persistance via `loginctl enable-linger <user>` afin que le Gateway reste actif après la déconnexion.
      - Peut demander sudo (écrit `/var/lib/systemd/linger`) ; il essaie d’abord sans sudo.
    - **Sélection du runtime :** Node (recommandé ; requis pour WhatsApp/Telegram). Bun n’est **pas recommandé**.
    - Si l’authentification par jeton requiert un jeton et que `gateway.auth.token` est géré par SecretRef, l’installation du daemon le valide mais ne persiste pas les valeurs de jeton en texte brut résolues dans les métadonnées d’environnement du service superviseur.
    - Si l’authentification par jeton requiert un jeton et que la SecretRef de jeton configurée n’est pas résolue, l’installation du daemon est bloquée avec des indications exploitables.
    - Si `gateway.auth.token` et `gateway.auth.password` sont tous deux configurés et que `gateway.auth.mode` n’est pas défini, l’installation du daemon est bloquée jusqu’à ce que le mode soit défini explicitement.

  </Step>
  <Step title="Vérification de santé">
    - Démarre le Gateway (si nécessaire) et exécute `openclaw health`.
    - Astuce : `openclaw status --deep` ajoute la sonde de santé du gateway en direct à la sortie d’état, y compris les sondes de canaux lorsqu’elles sont prises en charge (nécessite un gateway joignable).

  </Step>
  <Step title="Skills (recommandé)">
    - Lit les skills disponibles et vérifie les exigences.
    - Vous laisse choisir un gestionnaire de node : **npm / pnpm** (bun non recommandé).
    - Installe les dépendances facultatives (certaines utilisent Homebrew sur macOS).

  </Step>
  <Step title="Terminer">
    - Résumé + prochaines étapes, y compris l’invite **Comment voulez-vous faire éclore votre agent ?** pour Terminal, navigateur ou plus tard.

  </Step>
</Steps>

<Note>
Si aucune GUI n’est détectée, l’onboarding affiche des instructions de redirection de port SSH pour la Control UI au lieu d’ouvrir un navigateur.
Si les ressources de la Control UI sont manquantes, l’onboarding tente de les construire ; le recours est `pnpm ui:build` (installe automatiquement les dépendances de l’UI).
</Note>

## Mode non interactif

Utilisez `--non-interactive` pour automatiser ou scripter l’onboarding :

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

SecretRef de jeton Gateway en mode non interactif :

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
Utilisez cette page de référence pour la sémantique des options et l’ordre des étapes.

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

Le Gateway expose le flux d’onboarding via RPC (`wizard.start`, `wizard.next`, `wizard.cancel`, `wizard.status`).
Les clients (application macOS, Control UI) peuvent afficher les étapes sans réimplémenter la logique d’onboarding.

## Configuration Signal (signal-cli)

L’onboarding peut installer `signal-cli` depuis les releases GitHub :

- Télécharge l’asset de release approprié.
- Le stocke sous `~/.openclaw/tools/signal-cli/<version>/`.
- Écrit `channels.signal.cliPath` dans votre configuration.

Remarques :

- Les builds JVM nécessitent **Java 21**.
- Les builds natifs sont utilisés lorsqu’ils sont disponibles.
- Windows utilise WSL2 ; l’installation de signal-cli suit le flux Linux dans WSL.

## Ce que l’assistant écrit

Champs typiques dans `~/.openclaw/openclaw.json` :

- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers` (si Minimax est choisi)
- `tools.profile` (la configuration locale initiale utilise par défaut `"coding"` lorsqu’il n’est pas défini ; les valeurs explicites existantes sont conservées)
- `gateway.*` (mode, liaison, authentification, tailscale)
- `session.dmScope` (détails du comportement : [Référence de configuration CLI](/fr/start/wizard-cli-reference#outputs-and-internals))
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Listes d’autorisation des canaux (Slack/Discord/Matrix/Microsoft Teams) lorsque vous les activez pendant les invites (les noms sont résolus en ID lorsque c’est possible).
- `skills.install.nodeManager`
  - `setup --node-manager` accepte `npm`, `pnpm` ou `bun`.
  - La configuration manuelle peut toujours utiliser `yarn` en définissant directement `skills.install.nodeManager`.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` écrit `agents.list[]` et les `bindings` facultatifs.

Les identifiants WhatsApp se trouvent sous `~/.openclaw/credentials/whatsapp/<accountId>/`.
Les sessions sont stockées sous `~/.openclaw/agents/<agentId>/sessions/`.

Certains canaux sont fournis sous forme de plugins. Lorsque vous en choisissez un pendant la configuration,
l’onboarding vous demandera de l’installer (npm ou un chemin local) avant qu’il puisse être configuré.

## Documentation associée

- Vue d’ensemble de l’onboarding : [Onboarding (CLI)](/fr/start/wizard)
- Onboarding de l’application macOS : [Onboarding](/fr/start/onboarding)
- Référence de configuration : [Configuration de Gateway](/fr/gateway/configuration)
- Fournisseurs : [WhatsApp](/fr/channels/whatsapp), [Telegram](/fr/channels/telegram), [Discord](/fr/channels/discord), [Google Chat](/fr/channels/googlechat), [Signal](/fr/channels/signal), [iMessage](/fr/channels/imessage)
- Skills : [Skills](/fr/tools/skills), [Configuration des Skills](/fr/tools/skills-config)
