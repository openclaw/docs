---
read_when:
    - Vous avez besoin du comportement détaillé de `openclaw onboard`
    - Vous déboguez les résultats de l’onboarding ou intégrez des clients d’onboarding
sidebarTitle: CLI reference
summary: Référence complète du flux de configuration CLI, de la configuration auth/modèle, des sorties et des éléments internes
title: Référence de configuration CLI
x-i18n:
    generated_at: "2026-04-25T13:58:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 951b8f0b0b6b70faaa6faafad998e74183f79aa8c4c50f622b24df786f1feea7
    source_path: start/wizard-cli-reference.md
    workflow: 15
---

Cette page est la référence complète pour `openclaw onboard`.
Pour le guide court, voir [Onboarding (CLI)](/fr/start/wizard).

## Ce que fait l’assistant

Le mode local (par défaut) vous guide à travers :

- La configuration du modèle et de l’authentification (OAuth d’abonnement OpenAI Code, Anthropic Claude CLI ou clé API, ainsi que les options MiniMax, GLM, Ollama, Moonshot, StepFun et AI Gateway)
- L’emplacement de l’espace de travail et les fichiers bootstrap
- Les paramètres de la Gateway (port, bind, auth, Tailscale)
- Les canaux et fournisseurs (Telegram, WhatsApp, Discord, Google Chat, Mattermost, Signal, BlueBubbles, et autres plugins de canal inclus)
- L’installation du démon (LaunchAgent, unité systemd utilisateur, ou tâche planifiée Windows native avec repli vers le dossier Startup)
- Le contrôle d’intégrité
- La configuration des Skills

Le mode distant configure cette machine pour se connecter à une gateway située ailleurs.
Il n’installe ni ne modifie rien sur l’hôte distant.

## Détails du flux local

<Steps>
  <Step title="Détection de configuration existante">
    - Si `~/.openclaw/openclaw.json` existe, choisissez Conserver, Modifier ou Réinitialiser.
    - Relancer l’assistant n’efface rien sauf si vous choisissez explicitement Réinitialiser (ou passez `--reset`).
    - La CLI `--reset` utilise par défaut `config+creds+sessions` ; utilisez `--reset-scope full` pour supprimer aussi l’espace de travail.
    - Si la configuration est invalide ou contient des clés héritées, l’assistant s’arrête et vous demande d’exécuter `openclaw doctor` avant de continuer.
    - La réinitialisation utilise `trash` et propose des portées :
      - Configuration uniquement
      - Configuration + identifiants + sessions
      - Réinitialisation complète (supprime aussi l’espace de travail)
  </Step>
  <Step title="Modèle et authentification">
    - La matrice complète des options se trouve dans [Options d’authentification et de modèle](#auth-and-model-options).
  </Step>
  <Step title="Espace de travail">
    - Par défaut `~/.openclaw/workspace` (configurable).
    - Initialise les fichiers d’espace de travail nécessaires au rituel bootstrap du premier lancement.
    - Structure de l’espace de travail : [Espace de travail de l’agent](/fr/concepts/agent-workspace).
  </Step>
  <Step title="Gateway">
    - Demande le port, le bind, le mode d’authentification et l’exposition Tailscale.
    - Recommandé : conserver l’authentification par jeton activée même pour loopback afin que les clients WS locaux doivent s’authentifier.
    - En mode jeton, la configuration interactive propose :
      - **Générer/stocker un jeton en clair** (par défaut)
      - **Utiliser SecretRef** (opt-in)
    - En mode mot de passe, la configuration interactive prend aussi en charge le stockage en clair ou via SecretRef.
    - Chemin SecretRef de jeton en mode non interactif : `--gateway-token-ref-env <ENV_VAR>`.
      - Nécessite une variable d’environnement non vide dans l’environnement du processus d’onboarding.
      - Ne peut pas être combiné avec `--gateway-token`.
    - Désactivez l’authentification uniquement si vous faites entièrement confiance à chaque processus local.
    - Les binds non-loopback nécessitent toujours une authentification.
  </Step>
  <Step title="Canaux">
    - [WhatsApp](/fr/channels/whatsapp) : connexion QR facultative
    - [Telegram](/fr/channels/telegram) : jeton de bot
    - [Discord](/fr/channels/discord) : jeton de bot
    - [Google Chat](/fr/channels/googlechat) : JSON de compte de service + audience Webhook
    - [Mattermost](/fr/channels/mattermost) : jeton de bot + URL de base
    - [Signal](/fr/channels/signal) : installation facultative de `signal-cli` + configuration du compte
    - [BlueBubbles](/fr/channels/bluebubbles) : recommandé pour iMessage ; URL du serveur + mot de passe + webhook
    - [iMessage](/fr/channels/imessage) : ancien chemin CLI `imsg` + accès DB
    - Sécurité des messages privés : l’appairage est la valeur par défaut. Le premier message privé envoie un code ; approuvez-le via
      `openclaw pairing approve <channel> <code>` ou utilisez des listes d’autorisations.
  </Step>
  <Step title="Installation du démon">
    - macOS : LaunchAgent
      - Nécessite une session utilisateur connectée ; pour le headless, utilisez un LaunchDaemon personnalisé (non fourni).
    - Linux et Windows via WSL2 : unité systemd utilisateur
      - L’assistant tente `loginctl enable-linger <user>` afin que la gateway reste active après déconnexion.
      - Peut demander sudo (écrit dans `/var/lib/systemd/linger`) ; il essaie d’abord sans sudo.
    - Windows natif : Tâche planifiée d’abord
      - Si la création de tâche est refusée, OpenClaw se replie sur un élément de connexion du dossier Startup par utilisateur et démarre immédiatement la gateway.
      - Les tâches planifiées restent préférées car elles fournissent un meilleur état de superviseur.
    - Sélection du runtime : Node (recommandé ; requis pour WhatsApp et Telegram). Bun n’est pas recommandé.
  </Step>
  <Step title="Contrôle d’intégrité">
    - Démarre la gateway (si nécessaire) et exécute `openclaw health`.
    - `openclaw status --deep` ajoute la sonde d’intégrité live de la gateway à la sortie d’état, y compris les sondes de canaux lorsqu’elles sont prises en charge.
  </Step>
  <Step title="Skills">
    - Lit les Skills disponibles et vérifie les exigences.
    - Vous laisse choisir le gestionnaire node : npm, pnpm ou bun.
    - Installe les dépendances facultatives (certaines utilisent Homebrew sur macOS).
  </Step>
  <Step title="Terminer">
    - Résumé et étapes suivantes, y compris les options d’app iOS, Android et macOS.
  </Step>
</Steps>

<Note>
Si aucune interface graphique n’est détectée, l’assistant affiche les instructions de transfert de port SSH pour l’interface utilisateur de contrôle au lieu d’ouvrir un navigateur.
Si les ressources de l’interface utilisateur de contrôle sont absentes, l’assistant tente de les construire ; le repli est `pnpm ui:build` (installe automatiquement les dépendances UI).
</Note>

## Détails du mode distant

Le mode distant configure cette machine pour se connecter à une gateway située ailleurs.

<Info>
Le mode distant n’installe ni ne modifie rien sur l’hôte distant.
</Info>

Ce que vous définissez :

- URL de la gateway distante (`ws://...`)
- Jeton si l’authentification de la gateway distante est requise (recommandé)

<Note>
- Si la gateway est accessible uniquement en loopback, utilisez un tunnel SSH ou un tailnet.
- Indications de découverte :
  - macOS : Bonjour (`dns-sd`)
  - Linux : Avahi (`avahi-browse`)
</Note>

## Options d’authentification et de modèle

<AccordionGroup>
  <Accordion title="Clé API Anthropic">
    Utilise `ANTHROPIC_API_KEY` s’il est présent ou demande une clé, puis l’enregistre pour l’usage du démon.
  </Accordion>
  <Accordion title="Abonnement OpenAI Code (OAuth)">
    Flux navigateur ; collez `code#state`.

    Définit `agents.defaults.model` sur `openai-codex/gpt-5.5` lorsque le modèle n’est pas défini ou appartient déjà à la famille OpenAI.

  </Accordion>
  <Accordion title="Abonnement OpenAI Code (appairage d’appareil)">
    Flux d’appairage navigateur avec un code d’appareil de courte durée.

    Définit `agents.defaults.model` sur `openai-codex/gpt-5.5` lorsque le modèle n’est pas défini ou appartient déjà à la famille OpenAI.

  </Accordion>
  <Accordion title="Clé API OpenAI">
    Utilise `OPENAI_API_KEY` s’il est présent ou demande une clé, puis stocke l’identifiant dans les profils d’authentification.

    Définit `agents.defaults.model` sur `openai/gpt-5.4` lorsque le modèle n’est pas défini, `openai/*` ou `openai-codex/*`.

  </Accordion>
  <Accordion title="Clé API xAI (Grok)">
    Demande `XAI_API_KEY` et configure xAI comme fournisseur de modèles.
  </Accordion>
  <Accordion title="OpenCode">
    Demande `OPENCODE_API_KEY` (ou `OPENCODE_ZEN_API_KEY`) et vous laisse choisir le catalogue Zen ou Go.
    URL de configuration : [opencode.ai/auth](https://opencode.ai/auth).
  </Accordion>
  <Accordion title="Clé API (générique)">
    Enregistre la clé pour vous.
  </Accordion>
  <Accordion title="Vercel AI Gateway">
    Demande `AI_GATEWAY_API_KEY`.
    Plus de détails : [Vercel AI Gateway](/fr/providers/vercel-ai-gateway).
  </Accordion>
  <Accordion title="Cloudflare AI Gateway">
    Demande l’identifiant de compte, l’identifiant de gateway et `CLOUDFLARE_AI_GATEWAY_API_KEY`.
    Plus de détails : [Cloudflare AI Gateway](/fr/providers/cloudflare-ai-gateway).
  </Accordion>
  <Accordion title="MiniMax">
    La configuration est écrite automatiquement. La valeur par défaut hébergée est `MiniMax-M2.7` ; la configuration par clé API utilise
    `minimax/...`, et la configuration OAuth utilise `minimax-portal/...`.
    Plus de détails : [MiniMax](/fr/providers/minimax).
  </Accordion>
  <Accordion title="StepFun">
    La configuration est écrite automatiquement pour StepFun standard ou Step Plan sur des points de terminaison Chine ou globaux.
    La version standard inclut actuellement `step-3.5-flash`, et Step Plan inclut aussi `step-3.5-flash-2603`.
    Plus de détails : [StepFun](/fr/providers/stepfun).
  </Accordion>
  <Accordion title="Synthetic (compatible Anthropic)">
    Demande `SYNTHETIC_API_KEY`.
    Plus de détails : [Synthetic](/fr/providers/synthetic).
  </Accordion>
  <Accordion title="Ollama (Cloud et modèles ouverts locaux)">
    Demande d’abord `Cloud + Local`, `Cloud only` ou `Local only`.
    `Cloud only` utilise `OLLAMA_API_KEY` avec `https://ollama.com`.
    Les modes soutenus par l’hôte demandent l’URL de base (par défaut `http://127.0.0.1:11434`), découvrent les modèles disponibles et suggèrent des valeurs par défaut.
    `Cloud + Local` vérifie aussi si cet hôte Ollama est connecté pour l’accès cloud.
    Plus de détails : [Ollama](/fr/providers/ollama).
  </Accordion>
  <Accordion title="Moonshot et Kimi Coding">
    Les configurations Moonshot (Kimi K2) et Kimi Coding sont écrites automatiquement.
    Plus de détails : [Moonshot AI (Kimi + Kimi Coding)](/fr/providers/moonshot).
  </Accordion>
  <Accordion title="Fournisseur personnalisé">
    Fonctionne avec des points de terminaison compatibles OpenAI et compatibles Anthropic.

    L’onboarding interactif prend en charge les mêmes choix de stockage de clé API que les autres flux de clé API fournisseur :
    - **Coller la clé API maintenant** (en clair)
    - **Utiliser une référence de secret** (référence env ou référence fournisseur configurée, avec validation préalable)

    Indicateurs non interactifs :
    - `--auth-choice custom-api-key`
    - `--custom-base-url`
    - `--custom-model-id`
    - `--custom-api-key` (facultatif ; repli sur `CUSTOM_API_KEY`)
    - `--custom-provider-id` (facultatif)
    - `--custom-compatibility <openai|anthropic>` (facultatif ; `openai` par défaut)

  </Accordion>
  <Accordion title="Ignorer">
    Laisse l’authentification non configurée.
  </Accordion>
</AccordionGroup>

Comportement du modèle :

- Choisissez le modèle par défaut parmi les options détectées, ou saisissez manuellement le fournisseur et le modèle.
- Lorsque l’onboarding commence à partir d’un choix d’authentification fournisseur, le sélecteur de modèle préfère
  automatiquement ce fournisseur. Pour Volcengine et BytePlus, cette même préférence
  correspond aussi à leurs variantes coding-plan (`volcengine-plan/*`,
  `byteplus-plan/*`).
- Si ce filtre de fournisseur préféré serait vide, le sélecteur revient au catalogue complet au lieu de n’afficher aucun modèle.
- L’assistant exécute une vérification du modèle et avertit si le modèle configuré est inconnu ou si l’authentification manque.

Chemins des identifiants et profils :

- Profils d’authentification (clés API + OAuth) : `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Import OAuth hérité : `~/.openclaw/credentials/oauth.json`

Mode de stockage des identifiants :

- Le comportement par défaut de l’onboarding conserve les clés API comme valeurs en clair dans les profils d’authentification.
- `--secret-input-mode ref` active le mode référence au lieu du stockage de clés en clair.
  En configuration interactive, vous pouvez choisir :
  - référence de variable d’environnement (par exemple `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`)
  - référence de fournisseur configuré (`file` ou `exec`) avec alias de fournisseur + id
- Le mode référence interactif exécute une validation préalable rapide avant enregistrement.
  - Références env : valide le nom de variable et une valeur non vide dans l’environnement d’onboarding actuel.
  - Références fournisseur : valide la configuration fournisseur et résout l’identifiant demandé.
  - Si la prévalidation échoue, l’onboarding affiche l’erreur et vous permet de réessayer.
- En mode non interactif, `--secret-input-mode ref` est limité aux références env.
  - Définissez la variable d’environnement du fournisseur dans l’environnement du processus d’onboarding.
  - Les indicateurs de clé inline (par exemple `--openai-api-key`) exigent que cette variable env soit définie ; sinon l’onboarding échoue immédiatement.
  - Pour les fournisseurs personnalisés, le mode `ref` non interactif stocke `models.providers.<id>.apiKey` comme `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`.
  - Dans ce cas de fournisseur personnalisé, `--custom-api-key` exige que `CUSTOM_API_KEY` soit défini ; sinon l’onboarding échoue immédiatement.
- Les identifiants d’authentification Gateway prennent en charge le texte en clair et les choix SecretRef en configuration interactive :
  - Mode jeton : **Générer/stocker un jeton en clair** (par défaut) ou **Utiliser SecretRef**.
  - Mode mot de passe : texte en clair ou SecretRef.
- Chemin SecretRef de jeton non interactif : `--gateway-token-ref-env <ENV_VAR>`.
- Les installations existantes en clair continuent de fonctionner sans changement.

<Note>
Conseil headless et serveur : terminez OAuth sur une machine avec navigateur, puis copiez
le `auth-profiles.json` de cet agent (par exemple
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`, ou le chemin
`$OPENCLAW_STATE_DIR/...` correspondant) vers l’hôte gateway. `credentials/oauth.json`
n’est qu’une source d’import héritée.
</Note>

## Sorties et éléments internes

Champs typiques dans `~/.openclaw/openclaw.json` :

- `agents.defaults.workspace`
- `agents.defaults.skipBootstrap` lorsque `--skip-bootstrap` est passé
- `agents.defaults.model` / `models.providers` (si MiniMax est choisi)
- `tools.profile` (l’onboarding local le définit par défaut sur `"coding"` lorsqu’il n’est pas défini ; les valeurs explicites existantes sont conservées)
- `gateway.*` (mode, bind, auth, Tailscale)
- `session.dmScope` (l’onboarding local définit cela par défaut sur `per-channel-peer` lorsqu’il n’est pas défini ; les valeurs explicites existantes sont conservées)
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Listes d’autorisations des canaux (Slack, Discord, Matrix, Microsoft Teams) lorsque vous activez cette option pendant les invites (les noms sont résolus en identifiants lorsque c’est possible)
- `skills.install.nodeManager`
  - L’indicateur `setup --node-manager` accepte `npm`, `pnpm` ou `bun`.
  - La configuration manuelle peut toujours définir plus tard `skills.install.nodeManager: "yarn"`.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` écrit `agents.list[]` et éventuellement `bindings`.

Les identifiants WhatsApp sont placés sous `~/.openclaw/credentials/whatsapp/<accountId>/`.
Les sessions sont stockées sous `~/.openclaw/agents/<agentId>/sessions/`.

<Note>
Certains canaux sont fournis sous forme de plugins. Lorsqu’ils sont sélectionnés pendant la configuration, l’assistant
propose d’installer le plugin (npm ou chemin local) avant la configuration du canal.
</Note>

RPC d’assistant Gateway :

- `wizard.start`
- `wizard.next`
- `wizard.cancel`
- `wizard.status`

Les clients (app macOS et interface utilisateur de contrôle) peuvent afficher les étapes sans réimplémenter la logique d’onboarding.

Comportement de la configuration Signal :

- Télécharge la ressource de release appropriée
- La stocke sous `~/.openclaw/tools/signal-cli/<version>/`
- Écrit `channels.signal.cliPath` dans la configuration
- Les builds JVM nécessitent Java 21
- Les builds natifs sont utilisés lorsqu’ils sont disponibles
- Windows utilise WSL2 et suit le flux Linux signal-cli dans WSL

## Documentation associée

- Hub d’onboarding : [Onboarding (CLI)](/fr/start/wizard)
- Automatisation et scripts : [Automatisation CLI](/fr/start/wizard-cli-automation)
- Référence de commande : [`openclaw onboard`](/fr/cli/onboard)
