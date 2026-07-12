---
read_when:
    - Recherche d’une étape ou d’une option d’intégration spécifique
    - Automatiser l’intégration avec le mode non interactif
    - Débogage du comportement d’intégration
sidebarTitle: Onboarding Reference
summary: 'Référence complète pour l’intégration via la CLI : chaque étape, option et champ de configuration'
title: Référence de prise en main
x-i18n:
    generated_at: "2026-07-12T15:49:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 39155617d74a4004e9474c9d0ede231a6ccd4cb31becc07f25bcd9306b6a6675
    source_path: reference/wizard.md
    workflow: 16
---

Ceci est la référence complète de `openclaw onboard`.
Pour une vue d’ensemble, consultez [Intégration (CLI)](/fr/start/wizard). Pour le comportement et les sorties
étape par étape, consultez la [Référence de configuration de la CLI](/fr/start/wizard-cli-reference).

## Détails du déroulement (mode local)

<Steps>
  <Step title="Réinitialisation (facultative)">
    - `--reset` réinitialise l’état avant l’exécution de la configuration ; sans cette option, une nouvelle exécution de l’intégration
      conserve la configuration existante et la réutilise comme valeurs par défaut.
    - `--reset-scope` détermine ce que `--reset` supprime : `config` (fichier de configuration
      uniquement), `config+creds+sessions` (par défaut) ou `full` (supprime également
      l’espace de travail).
    - Si le fichier de configuration n’est pas valide, l’intégration s’arrête et vous demande d’abord d’exécuter
      `openclaw doctor`, puis de relancer la configuration.
    - La réinitialisation déplace l’état vers la corbeille (sans jamais le supprimer directement).

  </Step>
  <Step title="Acceptation des risques">
    - Lors de la première exécution (ou de toute exécution avant que `wizard.securityAcknowledgedAt` soit défini),
      vous devez confirmer que vous comprenez que les agents sont puissants et qu’un accès complet
      au système présente des risques.
    - `--non-interactive` exige explicitement `--accept-risk` ; sans cette option,
      l’intégration se termine avec une erreur au lieu d’afficher une invite.
    - Les exécutions interactives affichent une invite de confirmation au lieu d’utiliser l’option ; un refus
      annule la configuration.

  </Step>
  <Step title="Modèle/authentification">
    - **Clé API Anthropic** : utilise `ANTHROPIC_API_KEY` si elle est présente ou vous invite à saisir une clé, puis l’enregistre pour que le daemon puisse l’utiliser.
    - **CLI Anthropic Claude** : voie locale privilégiée lorsqu’une connexion à la CLI Claude existe déjà ; OpenClaw prend toujours en charge l’authentification Anthropic par jeton de configuration comme solution de remplacement.
    - **Abonnement OpenAI Code (Codex) (OAuth)** : processus dans le navigateur ; collez le `code#state`.
      - Lors d’une nouvelle configuration sans modèle principal, définit `agents.defaults.model` sur `openai/gpt-5.6-sol` via le runtime Codex.
    - **Abonnement OpenAI Code (Codex) (association d’appareil)** : processus d’association dans le navigateur avec un code d’appareil à courte durée de vie.
      - Lors d’une nouvelle configuration sans modèle principal, définit `agents.defaults.model` sur `openai/gpt-5.6-sol` via le runtime Codex.
    - **Clé API OpenAI** : utilise `OPENAI_API_KEY` si elle est présente ou vous invite à saisir une clé, puis la stocke dans les profils d’authentification.
      - Lors d’une nouvelle configuration sans modèle principal, définit `agents.defaults.model` sur `openai/gpt-5.6` ; l’identifiant de modèle d’API directe sans qualification correspond au niveau Sol.
    - L’ajout ou la réauthentification d’OpenAI préserve tout modèle principal explicitement défini, notamment `openai/gpt-5.5`. Si le compte ne donne pas accès à GPT-5.6, sélectionnez explicitement `openai/gpt-5.5` ; OpenClaw ne rétrograde pas silencieusement le modèle.
    - **OAuth xAI** : connexion dans le navigateur par code d’appareil, sans rappel localhost requis ; elle fonctionne donc également via SSH/Docker/VPS (`--auth-choice xai-oauth`).
    - **Clé API xAI** : vous invite à saisir `XAI_API_KEY` (`--auth-choice xai-api-key`).
    - `--auth-choice xai-device-code` fonctionne toujours comme alias de compatibilité manuel uniquement pour le même processus OAuth xAI par code d’appareil ; utilisez `xai-oauth` pour les nouveaux scripts.
    - **OpenCode** : vous invite à saisir `OPENCODE_API_KEY` (ou `OPENCODE_ZEN_API_KEY`, obtenez-la sur https://opencode.ai/auth) et vous permet de choisir le catalogue Zen ou Go.
    - **Ollama** : propose d’abord **Cloud + local**, **Cloud uniquement** ou **Local uniquement**. `Cloud only` vous invite à saisir `OLLAMA_API_KEY` et utilise `https://ollama.com` ; les modes reposant sur un hôte vous invitent à saisir l’URL de base d’Ollama (par défaut `http://127.0.0.1:11434`), détectent les modèles disponibles et téléchargent automatiquement le modèle local sélectionné si nécessaire ; `Cloud + Local` vérifie également si cet hôte Ollama est connecté pour l’accès au cloud.
    - Plus de détails : [Ollama](/fr/providers/ollama)
    - **Clé API** : stocke la clé pour vous.
    - **Vercel AI Gateway (proxy multimodèle)** : vous invite à saisir `AI_GATEWAY_API_KEY`.
    - Plus de détails : [Vercel AI Gateway](/fr/providers/vercel-ai-gateway)
    - **Cloudflare AI Gateway** : vous invite à saisir l’identifiant du compte, l’identifiant du Gateway et `CLOUDFLARE_AI_GATEWAY_API_KEY`.
    - Plus de détails : [Cloudflare AI Gateway](/fr/providers/cloudflare-ai-gateway)
    - **MiniMax** : la configuration est écrite automatiquement ; la valeur hébergée par défaut est `MiniMax-M3`.
      La configuration par clé API utilise `minimax/...`, tandis que la configuration OAuth utilise
      `minimax-portal/...`.
    - Plus de détails : [MiniMax](/fr/providers/minimax)
    - **StepFun** : la configuration est écrite automatiquement pour StepFun standard ou Step Plan sur les points de terminaison chinois ou mondiaux.
    - La version standard utilise actuellement `step-3.5-flash` par défaut ; Step Plan inclut également `step-3.5-flash-2603`.
    - Plus de détails : [StepFun](/fr/providers/stepfun)
    - **Synthetic (compatible avec Anthropic)** : vous invite à saisir `SYNTHETIC_API_KEY`.
    - Plus de détails : [Synthetic](/fr/providers/synthetic)
    - **Moonshot (Kimi K2)** : la configuration est écrite automatiquement.
    - **Kimi Coding** : la configuration est écrite automatiquement.
    - Plus de détails : [Moonshot AI (Kimi + Kimi Coding)](/fr/providers/moonshot)
    - **Fournisseur personnalisé** : fonctionne avec les points de terminaison compatibles avec OpenAI, OpenAI Responses ou Anthropic. Options non interactives : `--auth-choice custom-api-key`, `--custom-base-url`, `--custom-model-id`, `--custom-api-key` (facultative ; utilise `CUSTOM_API_KEY` par défaut), `--custom-provider-id` (facultative ; dérivée automatiquement de l’URL de base), `--custom-compatibility openai|openai-responses|anthropic` (valeur par défaut : `openai`), `--custom-image-input` / `--custom-text-input` (remplacent la détection déduite des modèles de vision).
    - **Ignorer** : aucune authentification n’est encore configurée.
    - Choisissez un modèle par défaut parmi les options détectées (ou saisissez manuellement le fournisseur/modèle). Pour obtenir une qualité optimale et réduire le risque d’injection de prompt, choisissez le modèle de dernière génération le plus performant disponible dans votre pile de fournisseurs.
    - L’intégration vérifie le modèle et affiche un avertissement si le modèle configuré est inconnu ou si son authentification est manquante.
    - Le mode de stockage des clés API utilise par défaut des valeurs en texte brut dans les profils d’authentification. Utilisez `--secret-input-mode ref` pour stocker à la place des références reposant sur des variables d’environnement (par exemple `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`) ; la variable d’environnement référencée doit déjà être définie, sinon l’intégration échoue immédiatement.
    - Les profils d’authentification se trouvent dans `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (clés API + OAuth). `~/.openclaw/credentials/oauth.json` est réservé à l’importation héritée.
    - Plus de détails : [OAuth](/fr/concepts/oauth)
    <Note>
    Conseil pour les environnements sans interface graphique/serveurs : effectuez l’authentification OAuth sur une machine dotée d’un navigateur, puis copiez
    le fichier `auth-profiles.json` de cet agent (par exemple
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`, ou le chemin correspondant
    sous `$OPENCLAW_STATE_DIR/...`) vers l’hôte du Gateway. `credentials/oauth.json`
    est uniquement une source d’importation héritée.
    </Note>
  </Step>
  <Step title="Espace de travail">
    - Valeur par défaut : `~/.openclaw/workspace` (configurable).
    - Initialise les fichiers de l’espace de travail nécessaires au rituel d’amorçage de l’agent.
    - Structure complète de l’espace de travail et guide de sauvegarde : [Espace de travail de l’agent](/fr/concepts/agent-workspace)

  </Step>
  <Step title="Gateway">
    - Port (par défaut **18789**), liaison, mode d’authentification, exposition Tailscale.
    - Recommandation d’authentification : conservez **Jeton** même pour l’interface de bouclage afin que les clients WS locaux soient obligés de s’authentifier.
    - En mode jeton, la configuration interactive propose :
      - **Générer/stocker un jeton en texte brut** (par défaut)
      - **Utiliser SecretRef** (sur demande)
      - Le démarrage rapide réutilise les SecretRefs `gateway.auth.token` existantes des fournisseurs `env`, `file` et `exec` pour la vérification de l’intégration et l’amorçage du tableau de bord.
      - Si cette SecretRef est configurée mais ne peut pas être résolue, l’intégration échoue rapidement avec un message de correction clair au lieu de dégrader silencieusement l’authentification du runtime.
    - En mode mot de passe, la configuration interactive prend également en charge le stockage en texte brut ou par SecretRef.
    - Chemin SecretRef du jeton en mode non interactif : `--gateway-token-ref-env <ENV_VAR>`.
      - Nécessite une variable d’environnement non vide dans l’environnement du processus d’intégration.
      - Ne peut pas être combiné avec `--gateway-token`.
    - Désactivez l’authentification uniquement si vous faites entièrement confiance à tous les processus locaux.
    - Les liaisons autres que l’interface de bouclage exigent toujours une authentification.

  </Step>
  <Step title="Canaux">
    - [WhatsApp](/fr/channels/whatsapp) : connexion facultative par code QR.
    - [Telegram](/fr/channels/telegram) : jeton de bot.
    - [Discord](/fr/channels/discord) : jeton de bot.
    - [Google Chat](/fr/channels/googlechat) : JSON du compte de service + audience du Webhook.
    - [Mattermost](/fr/channels/mattermost) (Plugin) : jeton de bot + URL de base.
    - [Signal](/fr/channels/signal) (Plugin) : installation facultative de `signal-cli` + configuration du compte.
    - [iMessage](/fr/channels/imessage) : chemin de la CLI `imsg` + accès à la base de données Messages ; utilisez un encapsuleur SSH lorsque le Gateway s’exécute hors d’un Mac.
    - Discord, Feishu, Microsoft Teams, QQ Bot, Slack et d’autres canaux sont fournis sous forme de
      plugins que l’intégration peut installer pour vous. Catalogue complet : [Canaux](/fr/channels).
    - Sécurité des messages privés : le mode par défaut est l’association. Le premier message privé envoie un code ; approuvez-le avec `openclaw pairing approve <channel> <code>` ou utilisez des listes d’autorisation.

  </Step>
  <Step title="Recherche Web">
    - Choisissez un fournisseur pris en charge, tel que Brave, Codex (Hosted Search), DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Parallel, Perplexity, SearXNG ou Tavily (ou ignorez cette étape).
    - Les fournisseurs reposant sur une API peuvent utiliser des variables d’environnement ou la configuration existante pour une configuration rapide ; les fournisseurs sans clé utilisent à la place leurs prérequis propres.
    - Ignorez cette étape avec `--skip-search`.
    - Configurez-la ultérieurement : `openclaw configure --section web`.

  </Step>
  <Step title="Installation du daemon">
    - macOS : LaunchAgent
      - Nécessite une session utilisateur ouverte ; pour un environnement sans interface graphique, utilisez un LaunchDaemon personnalisé (non fourni).
    - Linux (et Windows via WSL2) : unité utilisateur systemd
      - L’intégration tente d’activer la persistance via `loginctl enable-linger <user>` afin que le Gateway reste actif après la déconnexion.
      - Peut demander sudo (écrit dans `/var/lib/systemd/linger`) ; une tentative sans sudo est d’abord effectuée.
    - Windows natif : tâche planifiée en premier lieu ; si la création de la tâche est refusée, OpenClaw utilise à la place un élément de connexion propre à l’utilisateur dans le dossier Démarrage et démarre immédiatement le Gateway.
    - **Sélection du runtime :** Node (recommandé ; requis pour WhatsApp/Telegram — Bun peut corrompre la mémoire lors d’une reconnexion). Seul Node est proposé de manière interactive ; `--daemon-runtime bun` est disponible uniquement dans la CLI.
    - Si l’authentification par jeton exige un jeton et que `gateway.auth.token` est géré par SecretRef, l’installation du daemon le valide, mais ne conserve pas la valeur en texte brut résolue du jeton dans les métadonnées d’environnement du service de supervision.
    - Si l’authentification par jeton exige un jeton et que la SecretRef configurée pour celui-ci n’est pas résolue, l’installation du daemon est bloquée avec des instructions exploitables.
    - Si `gateway.auth.token` et `gateway.auth.password` sont tous deux configurés alors que `gateway.auth.mode` n’est pas défini, l’installation du daemon est bloquée jusqu’à ce que le mode soit explicitement défini.

  </Step>
  <Step title="Contrôle d’intégrité">
    - Démarre le Gateway (si nécessaire) et exécute `openclaw health`.
    - Conseil : `openclaw status --deep` ajoute la vérification d’intégrité en direct du Gateway à la sortie d’état, notamment les vérifications des canaux lorsqu’elles sont prises en charge (nécessite un Gateway accessible).

  </Step>
  <Step title="Skills (recommandé)">
    - Lit les skills disponibles et vérifie les prérequis.
    - Vous permet de choisir un gestionnaire Node : **npm / pnpm / bun**.
    - Installe automatiquement les dépendances facultatives des skills intégrés de confiance (certains utilisent Homebrew sur macOS).
    - Ignore les skills dont le prérequis d’installation Homebrew, uv ou Go n’est pas disponible, les regroupe avec des instructions de configuration manuelle et vous renvoie vers `openclaw doctor` une fois le prérequis installé.

  </Step>
  <Step title="Fin">
    - Résumé et étapes suivantes, notamment l’invite **Comment souhaitez-vous faire éclore votre agent ?** pour le terminal, le navigateur ou plus tard.

  </Step>
</Steps>

<Note>
Si aucune interface graphique n’est détectée, l’intégration affiche des instructions de redirection de port SSH pour l’interface de contrôle au lieu d’ouvrir un navigateur.
Si les ressources de l’interface de contrôle sont manquantes, l’intégration tente de les compiler ; la solution de secours est `pnpm ui:build` (installe automatiquement les dépendances de l’interface).
</Note>

## Mode non interactif

Utilisez `--non-interactive --accept-risk` pour automatiser ou scripter l’intégration (cette
option constitue l’acceptation obligatoire des risques ; l’intégration se termine avec une erreur
sans elle) :

```bash
openclaw onboard --non-interactive --accept-risk \
  --mode local \
  --auth-choice apiKey \
  --anthropic-api-key "$ANTHROPIC_API_KEY" \
  --gateway-port 18789 \
  --gateway-bind loopback \
  --install-daemon \
  --daemon-runtime node \
  --skip-skills
```

Ajoutez `--json` pour obtenir un résumé lisible par une machine.

SecretRef du jeton Gateway en mode non interactif :

```bash
export OPENCLAW_GATEWAY_TOKEN="your-token"
openclaw onboard --non-interactive --accept-risk \
  --mode local \
  --auth-choice skip \
  --gateway-auth token \
  --gateway-token-ref-env OPENCLAW_GATEWAY_TOKEN
```

`--gateway-token` et `--gateway-token-ref-env` sont mutuellement exclusifs.

<Note>
`--json` n’implique **pas** le mode non interactif. Utilisez `--non-interactive --accept-risk` (ainsi que `--workspace`) pour les scripts.
</Note>

Des exemples de commandes propres à chaque fournisseur figurent dans [Automatisation de la CLI](/fr/start/wizard-cli-automation#provider-specific-examples).
Utilisez cette page de référence pour connaître la sémantique des options et l’ordre des étapes.

### Ajouter un agent (mode non interactif)

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.6-sol \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

`main` est un identifiant d’agent réservé et ne peut pas être utilisé avec `openclaw agents add`.

## RPC de l’assistant Gateway

Le Gateway expose le processus d’intégration via RPC (`wizard.start`, `wizard.next`, `wizard.cancel`, `wizard.status`).
Les clients (application macOS, interface de contrôle) peuvent afficher les étapes sans réimplémenter la logique d’intégration.

## Configuration de Signal (signal-cli)

Lors de l’intégration, le système détecte si `signal-cli` se trouve dans le `PATH` et, s’il est absent, propose de l’installer :

- Linux x86-64 : télécharge la version native officielle GraalVM depuis les versions publiées de `signal-cli` sur GitHub et la stocke sous `~/.openclaw/tools/signal-cli/<version>/`.
- macOS et autres architectures : utilise plutôt Homebrew pour l’installation.
- Windows natif : pas encore pris en charge ; exécutez l’intégration dans WSL2 pour utiliser le chemin d’installation Linux.
- Dans tous les cas, écrit `channels.signal.cliPath` dans votre configuration.

## Éléments écrits par l’assistant

Champs généralement présents dans `~/.openclaw/openclaw.json` :

- `agents.defaults.workspace`
- `agents.defaults.skipBootstrap` lorsque `--skip-bootstrap` est fourni
- `agents.defaults.model` / `models.providers` (si Minimax est choisi)
- `tools.profile` (l’intégration locale utilise par défaut `"coding"` lorsque la valeur n’est pas définie ; les valeurs explicites existantes sont conservées)
- `gateway.*` (mode, liaison, authentification, Tailscale)
- `session.dmScope` (l’intégration locale définit par défaut cette valeur sur `"per-channel-peer"` lorsqu’elle n’est pas définie ; les valeurs explicites existantes sont conservées. Détails : [Référence de configuration de la CLI](/fr/start/wizard-cli-reference#outputs-and-internals))
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Listes d’autorisation des messages privés des canaux lorsque vous les activez dans les invites de configuration des canaux. Discord, Matrix, Microsoft Teams et Slack convertissent les noms en identifiants lorsque cela est possible ; les autres canaux acceptent directement des identifiants (par exemple, les identifiants numériques des expéditeurs Telegram ou les numéros de téléphone WhatsApp).
- `skills.install.nodeManager`
  - `setup --node-manager` accepte `npm`, `pnpm` ou `bun`.
  - La configuration manuelle peut toujours utiliser `yarn` en définissant directement `skills.install.nodeManager`.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`
- `wizard.securityAcknowledgedAt`

`openclaw agents add` écrit `agents.list[]` et, éventuellement, `bindings`.

Les identifiants WhatsApp sont stockés sous `~/.openclaw/credentials/whatsapp/<accountId>/`.
Les sessions actives et les transcriptions sont stockées dans
`~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`. Le répertoire
`~/.openclaw/agents/<agentId>/sessions/` est utilisé pour les entrées de migration
héritées et les artefacts d’archivage ou de support.

Certains canaux sont fournis sous forme de plugins. Lorsque vous en choisissez un pendant la configuration, le processus d’intégration
vous invite à l’installer (depuis npm ou un chemin local) avant de pouvoir le configurer.

## Documentation associée

- Présentation de l’intégration : [Intégration (CLI)](/fr/start/wizard)
- Référence de configuration de la CLI : [Référence de configuration de la CLI](/fr/start/wizard-cli-reference)
- Intégration dans l’application macOS : [Intégration](/fr/start/onboarding)
- Référence de configuration : [Configuration du Gateway](/fr/gateway/configuration)
- Fournisseurs : [WhatsApp](/fr/channels/whatsapp), [Telegram](/fr/channels/telegram), [Discord](/fr/channels/discord), [Google Chat](/fr/channels/googlechat), [Signal](/fr/channels/signal), [iMessage](/fr/channels/imessage)
- Skills : [Skills](/fr/tools/skills), [Configuration des Skills](/fr/tools/skills-config)
