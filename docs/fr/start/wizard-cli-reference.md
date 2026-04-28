---
read_when:
    - Vous avez besoin du comportement détaillé de `openclaw onboard`.
    - Vous déboguez les résultats d’intégration ou intégrez des clients d’intégration.
sidebarTitle: CLI reference
summary: Référence complète du flux de configuration CLI, de la configuration auth/modèle, des sorties et des éléments internes
title: Référence de configuration CLI
x-i18n:
    generated_at: "2026-04-25T18:22:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: a967fd6734d8facaa732b40567c33e48434208bf861d102adc8a4ee042f13041
    source_path: start/wizard-cli-reference.md
    workflow: 15
---

Cette page est la référence complète de `openclaw onboard`.
Pour le guide court, voir [Onboarding (CLI)](/fr/start/wizard).

## Ce que fait l’assistant

Le mode local (par défaut) vous guide à travers :

- la configuration du modèle et de l’authentification (OAuth d’abonnement OpenAI Code, Claude CLI Anthropic ou clé API, ainsi que les options MiniMax, GLM, Ollama, Moonshot, StepFun et AI Gateway)
- l’emplacement de l’espace de travail et les fichiers d’amorçage
- les paramètres Gateway (port, bind, authentification, Tailscale)
- les canaux et fournisseurs (Telegram, WhatsApp, Discord, Google Chat, Mattermost, Signal, BlueBubbles, et autres plugins de canal intégrés)
- l’installation en tant que démon (LaunchAgent, unité utilisateur systemd, ou tâche planifiée Windows native avec repli sur le dossier de démarrage)
- la vérification d’état
- la configuration des Skills

Le mode distant configure cette machine pour se connecter à une Gateway située ailleurs.
Il n’installe ni ne modifie quoi que ce soit sur l’hôte distant.

## Détails du flux local

<Steps>
  <Step title="Détection d’une configuration existante">
    - Si `~/.openclaw/openclaw.json` existe, choisissez Conserver, Modifier ou Réinitialiser.
    - Relancer l’assistant n’efface rien, sauf si vous choisissez explicitement Réinitialiser (ou passez `--reset`).
    - En CLI, `--reset` prend par défaut `config+creds+sessions` ; utilisez `--reset-scope full` pour supprimer aussi l’espace de travail.
    - Si la configuration est invalide ou contient des clés héritées, l’assistant s’arrête et vous demande d’exécuter `openclaw doctor` avant de continuer.
    - La réinitialisation utilise `trash` et propose plusieurs portées :
      - Configuration uniquement
      - Configuration + identifiants + sessions
      - Réinitialisation complète (supprime aussi l’espace de travail)

  </Step>
  <Step title="Modèle et authentification">
    - La matrice complète des options figure dans [Options d’authentification et de modèle](#auth-and-model-options).

  </Step>
  <Step title="Espace de travail">
    - Valeur par défaut : `~/.openclaw/workspace` (configurable).
    - Initialise les fichiers d’espace de travail nécessaires au rituel d’amorçage du premier lancement.
    - Structure de l’espace de travail : [Agent workspace](/fr/concepts/agent-workspace).

  </Step>
  <Step title="Gateway">
    - Demande le port, le bind, le mode d’authentification et l’exposition Tailscale.
    - Recommandé : garder l’authentification par jeton activée même pour le loopback afin que les clients WS locaux doivent s’authentifier.
    - En mode jeton, la configuration interactive propose :
      - **Générer/stocker un jeton en clair** (par défaut)
      - **Utiliser SecretRef** (sur option)
    - En mode mot de passe, la configuration interactive prend également en charge le stockage en clair ou via SecretRef.
    - Chemin SecretRef du jeton en mode non interactif : `--gateway-token-ref-env <ENV_VAR>`.
      - Nécessite une variable d’environnement non vide dans l’environnement du processus d’intégration.
      - Ne peut pas être combiné avec `--gateway-token`.
    - Désactivez l’authentification uniquement si vous faites entièrement confiance à tous les processus locaux.
    - Les binds non loopback exigent également une authentification.

  </Step>
  <Step title="Canaux">
    - [WhatsApp](/fr/channels/whatsapp) : connexion QR facultative
    - [Telegram](/fr/channels/telegram) : jeton de bot
    - [Discord](/fr/channels/discord) : jeton de bot
    - [Google Chat](/fr/channels/googlechat) : JSON de compte de service + audience de Webhook
    - [Mattermost](/fr/channels/mattermost) : jeton de bot + URL de base
    - [Signal](/fr/channels/signal) : installation facultative de `signal-cli` + configuration de compte
    - [BlueBubbles](/fr/channels/bluebubbles) : recommandé pour iMessage ; URL du serveur + mot de passe + Webhook
    - [iMessage](/fr/channels/imessage) : ancien chemin CLI `imsg` + accès à la base de données
    - Sécurité des messages privés : le pairing est le comportement par défaut. Le premier message privé envoie un code ; approuvez-le via
      `openclaw pairing approve <channel> <code>` ou utilisez des listes d’autorisation.
  </Step>
  <Step title="Installation comme démon">
    - macOS : LaunchAgent
      - Nécessite une session utilisateur connectée ; pour un mode sans interface, utilisez un LaunchDaemon personnalisé (non fourni).
    - Linux et Windows via WSL2 : unité utilisateur systemd
      - L’assistant tente `loginctl enable-linger <user>` afin que la Gateway reste active après la déconnexion.
      - Peut demander sudo (écrit dans `/var/lib/systemd/linger`) ; il essaie d’abord sans sudo.
    - Windows natif : tâche planifiée en priorité
      - Si la création de la tâche est refusée, OpenClaw se replie sur un élément de démarrage par utilisateur dans le dossier Startup et démarre immédiatement la Gateway.
      - Les tâches planifiées restent préférées car elles offrent un meilleur état de supervision.
    - Sélection du runtime : Node (recommandé ; requis pour WhatsApp et Telegram). Bun n’est pas recommandé.

  </Step>
  <Step title="Vérification d’état">
    - Démarre la Gateway (si nécessaire) et exécute `openclaw health`.
    - `openclaw status --deep` ajoute la sonde d’état live de la Gateway à la sortie d’état, y compris les sondes de canaux lorsque c’est pris en charge.

  </Step>
  <Step title="Skills">
    - Lit les Skills disponibles et vérifie les prérequis.
    - Vous laisse choisir le gestionnaire Node : npm, pnpm ou bun.
    - Installe les dépendances facultatives (certaines utilisent Homebrew sur macOS).

  </Step>
  <Step title="Fin">
    - Résumé et étapes suivantes, y compris les options d’application iOS, Android et macOS.

  </Step>
</Steps>

<Note>
Si aucune interface graphique n’est détectée, l’assistant affiche des instructions de redirection de port SSH pour l’interface Control UI au lieu d’ouvrir un navigateur.
Si les ressources de Control UI sont absentes, l’assistant tente de les construire ; le repli est `pnpm ui:build` (installe automatiquement les dépendances UI).
</Note>

## Détails du mode distant

Le mode distant configure cette machine pour se connecter à une Gateway située ailleurs.

<Info>
Le mode distant n’installe ni ne modifie quoi que ce soit sur l’hôte distant.
</Info>

Ce que vous définissez :

- l’URL de la Gateway distante (`ws://...`)
- le jeton si l’authentification de la Gateway distante est requise (recommandé)

<Note>
- Si la Gateway est limitée au loopback, utilisez un tunnel SSH ou un tailnet.
- Indications de découverte :
  - macOS : Bonjour (`dns-sd`)
  - Linux : Avahi (`avahi-browse`)

</Note>

## Options d’authentification et de modèle

<AccordionGroup>
  <Accordion title="Clé API Anthropic">
    Utilise `ANTHROPIC_API_KEY` s’il est présent ou demande une clé, puis l’enregistre pour l’utilisation par le démon.
  </Accordion>
  <Accordion title="Abonnement OpenAI Code (OAuth)">
    Flux navigateur ; collez `code#state`.

    Définit `agents.defaults.model` sur `openai-codex/gpt-5.5` lorsque le modèle n’est pas défini ou appartient déjà à la famille OpenAI.

  </Accordion>
  <Accordion title="Abonnement OpenAI Code (pairing d’appareil)">
    Flux de pairing navigateur avec un code d’appareil à courte durée de vie.

    Définit `agents.defaults.model` sur `openai-codex/gpt-5.5` lorsque le modèle n’est pas défini ou appartient déjà à la famille OpenAI.

  </Accordion>
  <Accordion title="Clé API OpenAI">
    Utilise `OPENAI_API_KEY` s’il est présent ou demande une clé, puis stocke l’identifiant dans les profils d’authentification.

    Définit `agents.defaults.model` sur `openai/gpt-5.5` lorsque le modèle n’est pas défini, `openai/*`, ou `openai-codex/*`.

  </Accordion>
  <Accordion title="Clé API xAI (Grok)">
    Demande `XAI_API_KEY` et configure xAI comme fournisseur de modèle.
  </Accordion>
  <Accordion title="OpenCode">
    Demande `OPENCODE_API_KEY` (ou `OPENCODE_ZEN_API_KEY`) et vous laisse choisir le catalogue Zen ou Go.
    URL de configuration : [opencode.ai/auth](https://opencode.ai/auth).
  </Accordion>
  <Accordion title="Clé API (générique)">
    Stocke la clé pour vous.
  </Accordion>
  <Accordion title="Vercel AI Gateway">
    Demande `AI_GATEWAY_API_KEY`.
    Plus de détails : [Vercel AI Gateway](/fr/providers/vercel-ai-gateway).
  </Accordion>
  <Accordion title="Cloudflare AI Gateway">
    Demande l’id du compte, l’id de la Gateway, et `CLOUDFLARE_AI_GATEWAY_API_KEY`.
    Plus de détails : [Cloudflare AI Gateway](/fr/providers/cloudflare-ai-gateway).
  </Accordion>
  <Accordion title="MiniMax">
    La configuration est écrite automatiquement. La valeur hébergée par défaut est `MiniMax-M2.7` ; la configuration par clé API utilise
    `minimax/...`, et la configuration OAuth utilise `minimax-portal/...`.
    Plus de détails : [MiniMax](/fr/providers/minimax).
  </Accordion>
  <Accordion title="StepFun">
    La configuration est écrite automatiquement pour StepFun standard ou Step Plan sur des endpoints Chine ou globaux.
    Standard inclut actuellement `step-3.5-flash`, et Step Plan inclut également `step-3.5-flash-2603`.
    Plus de détails : [StepFun](/fr/providers/stepfun).
  </Accordion>
  <Accordion title="Synthetic (compatible Anthropic)">
    Demande `SYNTHETIC_API_KEY`.
    Plus de détails : [Synthetic](/fr/providers/synthetic).
  </Accordion>
  <Accordion title="Ollama (Cloud et modèles ouverts locaux)">
    Demande d’abord `Cloud + Local`, `Cloud only`, ou `Local only`.
    `Cloud only` utilise `OLLAMA_API_KEY` avec `https://ollama.com`.
    Les modes adossés à l’hôte demandent l’URL de base (par défaut `http://127.0.0.1:11434`), découvrent les modèles disponibles et suggèrent des valeurs par défaut.
    `Cloud + Local` vérifie également si cet hôte Ollama est connecté pour l’accès cloud.
    Plus de détails : [Ollama](/fr/providers/ollama).
  </Accordion>
  <Accordion title="Moonshot et Kimi Coding">
    Les configurations Moonshot (Kimi K2) et Kimi Coding sont écrites automatiquement.
    Plus de détails : [Moonshot AI (Kimi + Kimi Coding)](/fr/providers/moonshot).
  </Accordion>
  <Accordion title="Fournisseur personnalisé">
    Fonctionne avec des endpoints compatibles OpenAI et compatibles Anthropic.

    L’intégration interactive prend en charge les mêmes choix de stockage de clé API que les autres flux de clé API fournisseur :
    - **Coller la clé API maintenant** (en clair)
    - **Utiliser une référence de secret** (référence d’environnement ou référence de fournisseur configurée, avec validation préalable)

    Drapeaux non interactifs :
    - `--auth-choice custom-api-key`
    - `--custom-base-url`
    - `--custom-model-id`
    - `--custom-api-key` (facultatif ; repli sur `CUSTOM_API_KEY`)
    - `--custom-provider-id` (facultatif)
    - `--custom-compatibility <openai|anthropic>` (facultatif ; `openai` par défaut)

  </Accordion>
  <Accordion title="Ignorer">
    Laisse l’authentification non configurée.
  </Accordion>
</AccordionGroup>

Comportement des modèles :

- Choisissez le modèle par défaut parmi les options détectées, ou saisissez manuellement le fournisseur et le modèle.
- Lorsque l’intégration démarre à partir d’un choix d’authentification fournisseur, le sélecteur de modèle privilégie
  automatiquement ce fournisseur. Pour Volcengine et BytePlus, cette même préférence
  correspond aussi à leurs variantes coding-plan (`volcengine-plan/*`,
  `byteplus-plan/*`).
- Si ce filtre de fournisseur préféré serait vide, le sélecteur revient
  au catalogue complet au lieu de n’afficher aucun modèle.
- L’assistant exécute une vérification du modèle et avertit si le modèle configuré est inconnu ou si l’authentification manque.

Chemins des identifiants et profils :

- Profils d’authentification (clés API + OAuth) : `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Import OAuth hérité : `~/.openclaw/credentials/oauth.json`

Mode de stockage des identifiants :

- Le comportement par défaut de l’intégration conserve les clés API en clair dans les profils d’authentification.
- `--secret-input-mode ref` active le mode référence au lieu du stockage de clé en clair.
  En configuration interactive, vous pouvez choisir :
  - une référence de variable d’environnement (par exemple `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`)
  - une référence de fournisseur configuré (`file` ou `exec`) avec alias et id de fournisseur
- Le mode référence interactif exécute une validation préalable rapide avant l’enregistrement.
  - Références d’environnement : valide le nom de variable + une valeur non vide dans l’environnement courant de l’intégration.
  - Références de fournisseur : valide la configuration du fournisseur et résout l’id demandé.
  - Si la validation préalable échoue, l’intégration affiche l’erreur et vous laisse réessayer.
- En mode non interactif, `--secret-input-mode ref` est limité à l’environnement.
  - Définissez la variable d’environnement du fournisseur dans l’environnement du processus d’intégration.
  - Les drapeaux de clé inline (par exemple `--openai-api-key`) exigent que cette variable d’environnement soit définie ; sinon l’intégration échoue immédiatement.
  - Pour les fournisseurs personnalisés, le mode `ref` non interactif stocke `models.providers.<id>.apiKey` sous la forme `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`.
  - Dans ce cas de fournisseur personnalisé, `--custom-api-key` exige que `CUSTOM_API_KEY` soit défini ; sinon l’intégration échoue immédiatement.
- Les identifiants d’authentification Gateway prennent en charge les choix en clair et SecretRef dans la configuration interactive :
  - Mode jeton : **Générer/stocker un jeton en clair** (par défaut) ou **Utiliser SecretRef**.
  - Mode mot de passe : en clair ou SecretRef.
- Chemin SecretRef du jeton en mode non interactif : `--gateway-token-ref-env <ENV_VAR>`.
- Les configurations en clair existantes continuent de fonctionner sans changement.

<Note>
Astuce sans interface et serveur : terminez l’OAuth sur une machine disposant d’un navigateur, puis copiez le fichier `auth-profiles.json` de cet agent (par exemple
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`, ou le chemin
`$OPENCLAW_STATE_DIR/...` correspondant) vers l’hôte Gateway. `credentials/oauth.json`
n’est qu’une source d’import héritée.
</Note>

## Sorties et éléments internes

Champs typiques dans `~/.openclaw/openclaw.json` :

- `agents.defaults.workspace`
- `agents.defaults.skipBootstrap` lorsque `--skip-bootstrap` est passé
- `agents.defaults.model` / `models.providers` (si MiniMax est choisi)
- `tools.profile` (l’intégration locale le définit par défaut sur `"coding"` lorsqu’il n’est pas défini ; les valeurs explicites existantes sont conservées)
- `gateway.*` (mode, bind, auth, Tailscale)
- `session.dmScope` (l’intégration locale le définit par défaut sur `per-channel-peer` lorsqu’il n’est pas défini ; les valeurs explicites existantes sont conservées)
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Listes d’autorisation de canaux (Slack, Discord, Matrix, Microsoft Teams) lorsque vous les activez dans les invites (les noms sont résolus en ids lorsque c’est possible)
- `skills.install.nodeManager`
  - Le drapeau `setup --node-manager` accepte `npm`, `pnpm`, ou `bun`.
  - La configuration manuelle peut toujours définir `skills.install.nodeManager: "yarn"` plus tard.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` écrit `agents.list[]` et des `bindings` facultatifs.

Les identifiants WhatsApp sont stockés sous `~/.openclaw/credentials/whatsapp/<accountId>/`.
Les sessions sont stockées sous `~/.openclaw/agents/<agentId>/sessions/`.

<Note>
Certains canaux sont fournis sous forme de plugins. Lorsqu’ils sont sélectionnés pendant la configuration, l’assistant
propose d’installer le plugin (npm ou chemin local) avant la configuration du canal.
</Note>

RPC de l’assistant Gateway :

- `wizard.start`
- `wizard.next`
- `wizard.cancel`
- `wizard.status`

Les clients (application macOS et Control UI) peuvent afficher les étapes sans réimplémenter la logique d’intégration.

Comportement de configuration de Signal :

- Télécharge la ressource de publication appropriée
- La stocke sous `~/.openclaw/tools/signal-cli/<version>/`
- Écrit `channels.signal.cliPath` dans la configuration
- Les builds JVM nécessitent Java 21
- Les builds natifs sont utilisés lorsqu’ils sont disponibles
- Windows utilise WSL2 et suit le flux Linux signal-cli dans WSL

## Documentation associée

- Hub d’intégration : [Onboarding (CLI)](/fr/start/wizard)
- Automatisation et scripts : [CLI Automation](/fr/start/wizard-cli-automation)
- Référence de commande : [`openclaw onboard`](/fr/cli/onboard)
