---
read_when:
    - Vous avez besoin du comportement détaillé pour openclaw onboard
    - Vous déboguez les résultats de l’intégration initiale ou intégrez des clients d’intégration initiale
sidebarTitle: CLI reference
summary: Référence complète pour le flux de configuration de la CLI, la configuration de l’authentification et des modèles, les sorties et les composants internes
title: Référence de configuration de la CLI
x-i18n:
    generated_at: "2026-04-30T07:49:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8d40a63ff27d6aaf4cda167ad0cdf3ad7c4f61ecf92d1cf51b5a0237b24917a7
    source_path: start/wizard-cli-reference.md
    workflow: 16
---

Cette page est la référence complète pour `openclaw onboard`.
Pour le guide court, consultez [Onboarding (CLI)](/fr/start/wizard).

## Ce que fait l’assistant

Le mode local (par défaut) vous guide à travers :

- Configuration du modèle et de l’authentification (OAuth d’abonnement OpenAI Code, CLI Anthropic Claude ou clé API, ainsi que les options MiniMax, GLM, Ollama, Moonshot, StepFun et AI Gateway)
- Emplacement de l’espace de travail et fichiers d’amorçage
- Paramètres du Gateway (port, liaison, authentification, Tailscale)
- Canaux et fournisseurs (Telegram, WhatsApp, Discord, Google Chat, Mattermost, Signal, BlueBubbles et autres plugins de canal groupés)
- Installation du daemon (LaunchAgent, unité utilisateur systemd ou tâche planifiée Windows native avec repli vers le dossier Startup)
- Contrôle d’intégrité
- Configuration des Skills

Le mode distant configure cette machine pour se connecter à un Gateway situé ailleurs.
Il n’installe ni ne modifie rien sur l’hôte distant.

## Détails du flux local

<Steps>
  <Step title="Détection de la configuration existante">
    - Si `~/.openclaw/openclaw.json` existe, choisissez Conserver, Modifier ou Réinitialiser.
    - Relancer l’assistant n’efface rien sauf si vous choisissez explicitement Réinitialiser (ou passez `--reset`).
    - CLI `--reset` utilise par défaut `config+creds+sessions` ; utilisez `--reset-scope full` pour supprimer aussi l’espace de travail.
    - Si la configuration est invalide ou contient d’anciennes clés, l’assistant s’arrête et vous demande d’exécuter `openclaw doctor` avant de continuer.
    - La réinitialisation utilise `trash` et propose des périmètres :
      - Configuration uniquement
      - Configuration + identifiants + sessions
      - Réinitialisation complète (supprime aussi l’espace de travail)

  </Step>
  <Step title="Modèle et authentification">
    - La matrice complète des options se trouve dans [Options d’authentification et de modèle](#auth-and-model-options).

  </Step>
  <Step title="Espace de travail">
    - Par défaut `~/.openclaw/workspace` (configurable).
    - Prépare les fichiers d’espace de travail nécessaires au rituel d’amorçage du premier lancement.
    - Disposition de l’espace de travail : [Espace de travail d’agent](/fr/concepts/agent-workspace).

  </Step>
  <Step title="Gateway">
    - Demande le port, la liaison, le mode d’authentification et l’exposition Tailscale.
    - Recommandé : conservez l’authentification par jeton activée même pour local loopback afin que les clients WS locaux doivent s’authentifier.
    - En mode jeton, la configuration interactive propose :
      - **Générer/stocker un jeton en texte clair** (par défaut)
      - **Utiliser SecretRef** (optionnel)
    - En mode mot de passe, la configuration interactive prend aussi en charge le stockage en texte clair ou SecretRef.
    - Chemin SecretRef de jeton non interactif : `--gateway-token-ref-env <ENV_VAR>`.
      - Nécessite une variable d’environnement non vide dans l’environnement du processus d’onboarding.
      - Ne peut pas être combiné avec `--gateway-token`.
    - Désactivez l’authentification uniquement si vous faites pleinement confiance à chaque processus local.
    - Les liaisons hors loopback nécessitent toujours une authentification.

  </Step>
  <Step title="Canaux">
    - [WhatsApp](/fr/channels/whatsapp) : connexion QR facultative
    - [Telegram](/fr/channels/telegram) : jeton de bot
    - [Discord](/fr/channels/discord) : jeton de bot
    - [Google Chat](/fr/channels/googlechat) : JSON de compte de service + audience du Webhook
    - [Mattermost](/fr/channels/mattermost) : jeton de bot + URL de base
    - [Signal](/fr/channels/signal) : installation facultative de `signal-cli` + configuration du compte
    - [BlueBubbles](/fr/channels/bluebubbles) : recommandé pour iMessage ; URL du serveur + mot de passe + Webhook
    - [iMessage](/fr/channels/imessage) : ancien chemin CLI `imsg` + accès à la base de données
    - Sécurité des MP : l’association est le comportement par défaut. Le premier MP envoie un code ; approuvez avec
      `openclaw pairing approve <channel> <code>` ou utilisez des listes d’autorisation.
  </Step>
  <Step title="Installation du daemon">
    - macOS : LaunchAgent
      - Nécessite une session utilisateur ouverte ; pour le mode headless, utilisez un LaunchDaemon personnalisé (non fourni).
    - Linux et Windows via WSL2 : unité utilisateur systemd
      - L’assistant tente `loginctl enable-linger <user>` afin que le Gateway reste actif après la déconnexion.
      - Peut demander sudo (écrit dans `/var/lib/systemd/linger`) ; il essaie d’abord sans sudo.
    - Windows natif : tâche planifiée en premier
      - Si la création de tâche est refusée, OpenClaw se replie vers un élément de connexion par utilisateur dans le dossier Startup et démarre immédiatement le Gateway.
      - Les tâches planifiées restent préférées, car elles fournissent un meilleur état de supervision.
    - Sélection du runtime : Node (recommandé ; requis pour WhatsApp et Telegram). Bun n’est pas recommandé.

  </Step>
  <Step title="Contrôle d’intégrité">
    - Démarre le Gateway (si nécessaire) et exécute `openclaw health`.
    - `openclaw status --deep` ajoute la sonde d’intégrité du Gateway en direct à la sortie d’état, y compris les sondes de canal lorsqu’elles sont prises en charge.

  </Step>
  <Step title="Skills">
    - Lit les Skills disponibles et vérifie les exigences.
    - Vous permet de choisir le gestionnaire Node : npm, pnpm ou bun.
    - Installe les dépendances facultatives (certaines utilisent Homebrew sur macOS).

  </Step>
  <Step title="Fin">
    - Résumé et étapes suivantes, y compris les options d’app iOS, Android et macOS.

  </Step>
</Steps>

<Note>
Si aucune interface graphique n’est détectée, l’assistant affiche les instructions de redirection de port SSH pour la Control UI au lieu d’ouvrir un navigateur.
Si les ressources de la Control UI sont manquantes, l’assistant tente de les compiler ; le repli est `pnpm ui:build` (installe automatiquement les dépendances UI).
</Note>

## Détails du mode distant

Le mode distant configure cette machine pour se connecter à un Gateway situé ailleurs.

<Info>
Le mode distant n’installe ni ne modifie rien sur l’hôte distant.
</Info>

Ce que vous définissez :

- URL du Gateway distant (`ws://...`)
- Jeton si l’authentification du Gateway distant est requise (recommandé)

<Note>
- Si le Gateway est limité au loopback, utilisez un tunnel SSH ou un tailnet.
- Indications de découverte :
  - macOS : Bonjour (`dns-sd`)
  - Linux : Avahi (`avahi-browse`)

</Note>

## Options d’authentification et de modèle

<AccordionGroup>
  <Accordion title="Clé API Anthropic">
    Utilise `ANTHROPIC_API_KEY` si elle est présente ou demande une clé, puis l’enregistre pour l’utilisation par le daemon.
  </Accordion>
  <Accordion title="Abonnement OpenAI Code (OAuth)">
    Flux navigateur ; collez `code#state`.

    Définit `agents.defaults.model` sur `openai-codex/gpt-5.5` lorsque le modèle n’est pas défini ou appartient déjà à la famille OpenAI.

  </Accordion>
  <Accordion title="Abonnement OpenAI Code (association d’appareil)">
    Flux d’association par navigateur avec un code d’appareil à courte durée de vie.

    Définit `agents.defaults.model` sur `openai-codex/gpt-5.5` lorsque le modèle n’est pas défini ou appartient déjà à la famille OpenAI.

  </Accordion>
  <Accordion title="Clé API OpenAI">
    Utilise `OPENAI_API_KEY` si elle est présente ou demande une clé, puis stocke l’identifiant dans les profils d’authentification.

    Définit `agents.defaults.model` sur `openai/gpt-5.5` lorsque le modèle n’est pas défini, `openai/*` ou `openai-codex/*`.

  </Accordion>
  <Accordion title="Clé API xAI (Grok)">
    Demande `XAI_API_KEY` et configure xAI comme fournisseur de modèles.
  </Accordion>
  <Accordion title="OpenCode">
    Demande `OPENCODE_API_KEY` (ou `OPENCODE_ZEN_API_KEY`) et vous permet de choisir le catalogue Zen ou Go.
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
    Demande l’ID de compte, l’ID de Gateway et `CLOUDFLARE_AI_GATEWAY_API_KEY`.
    Plus de détails : [Cloudflare AI Gateway](/fr/providers/cloudflare-ai-gateway).
  </Accordion>
  <Accordion title="MiniMax">
    La configuration est écrite automatiquement. La valeur hébergée par défaut est `MiniMax-M2.7` ; la configuration par clé API utilise
    `minimax/...`, et la configuration OAuth utilise `minimax-portal/...`.
    Plus de détails : [MiniMax](/fr/providers/minimax).
  </Accordion>
  <Accordion title="StepFun">
    La configuration est écrite automatiquement pour StepFun standard ou Step Plan sur les points de terminaison chinois ou mondiaux.
    Standard inclut actuellement `step-3.5-flash`, et Step Plan inclut aussi `step-3.5-flash-2603`.
    Plus de détails : [StepFun](/fr/providers/stepfun).
  </Accordion>
  <Accordion title="Synthetic (compatible Anthropic)">
    Demande `SYNTHETIC_API_KEY`.
    Plus de détails : [Synthetic](/fr/providers/synthetic).
  </Accordion>
  <Accordion title="Ollama (modèles ouverts cloud et locaux)">
    Demande d’abord `Cloud + Local`, `Cloud only` ou `Local only`.
    `Cloud only` utilise `OLLAMA_API_KEY` avec `https://ollama.com`.
    Les modes adossés à un hôte demandent l’URL de base (par défaut `http://127.0.0.1:11434`), découvrent les modèles disponibles et suggèrent des valeurs par défaut.
    `Cloud + Local` vérifie aussi si cet hôte Ollama est connecté pour l’accès cloud.
    Plus de détails : [Ollama](/fr/providers/ollama).
  </Accordion>
  <Accordion title="Moonshot et Kimi Coding">
    Les configurations Moonshot (Kimi K2) et Kimi Coding sont écrites automatiquement.
    Plus de détails : [Moonshot AI (Kimi + Kimi Coding)](/fr/providers/moonshot).
  </Accordion>
  <Accordion title="Fournisseur personnalisé">
    Fonctionne avec les points de terminaison compatibles OpenAI et compatibles Anthropic.

    L’onboarding interactif prend en charge les mêmes choix de stockage de clé API que les autres flux de clé API de fournisseur :
    - **Coller la clé API maintenant** (texte clair)
    - **Utiliser une référence secrète** (référence env ou référence de fournisseur configurée, avec validation préalable)

    Indicateurs non interactifs :
    - `--auth-choice custom-api-key`
    - `--custom-base-url`
    - `--custom-model-id`
    - `--custom-api-key` (facultatif ; se replie sur `CUSTOM_API_KEY`)
    - `--custom-provider-id` (facultatif)
    - `--custom-compatibility <openai|anthropic>` (facultatif ; valeur par défaut `openai`)
    - `--custom-image-input` / `--custom-text-input` (facultatif ; remplace la capacité d’entrée du modèle inférée)

  </Accordion>
  <Accordion title="Ignorer">
    Laisse l’authentification non configurée.
  </Accordion>
</AccordionGroup>

Comportement du modèle :

- Choisissez le modèle par défaut parmi les options détectées ou saisissez manuellement le fournisseur et le modèle.
- L’onboarding de fournisseur personnalisé déduit la prise en charge des images pour les ID de modèle courants et ne pose la question que lorsque le nom du modèle est inconnu.
- Lorsque l’onboarding démarre depuis un choix d’authentification de fournisseur, le sélecteur de modèle privilégie
  automatiquement ce fournisseur. Pour Volcengine et BytePlus, la même préférence
  correspond aussi à leurs variantes de plan de codage (`volcengine-plan/*`,
  `byteplus-plan/*`).
- Si ce filtre de fournisseur préféré était vide, le sélecteur se replie vers
  le catalogue complet au lieu de n’afficher aucun modèle.
- L’assistant exécute une vérification du modèle et avertit si le modèle configuré est inconnu ou s’il manque l’authentification.

Chemins des identifiants et des profils :

- Profils d’authentification (clés API + OAuth) : `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Import OAuth hérité : `~/.openclaw/credentials/oauth.json`

Mode de stockage des identifiants :

- Le comportement d’onboarding par défaut conserve les clés API comme valeurs en texte clair dans les profils d’authentification.
- `--secret-input-mode ref` active le mode référence au lieu du stockage des clés en texte clair.
  Dans la configuration interactive, vous pouvez choisir l’un ou l’autre :
  - référence de variable d’environnement (par exemple `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`)
  - référence de fournisseur configuré (`file` ou `exec`) avec alias de fournisseur + id
- Le mode référence interactif exécute une validation préalable rapide avant l’enregistrement.
  - Réfs env : valide le nom de variable + valeur non vide dans l’environnement d’onboarding actuel.
  - Réfs de fournisseur : valide la configuration du fournisseur et résout l’id demandé.
  - Si la validation préalable échoue, l’onboarding affiche l’erreur et vous permet de réessayer.
- En mode non interactif, `--secret-input-mode ref` est uniquement adossé à l’environnement.
  - Définissez la variable d’environnement du fournisseur dans l’environnement du processus d’onboarding.
  - Les indicateurs de clé en ligne (par exemple `--openai-api-key`) exigent que cette variable d’environnement soit définie ; sinon l’onboarding échoue rapidement.
  - Pour les fournisseurs personnalisés, le mode non interactif `ref` stocke `models.providers.<id>.apiKey` comme `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`.
  - Dans ce cas de fournisseur personnalisé, `--custom-api-key` exige que `CUSTOM_API_KEY` soit défini ; sinon l’onboarding échoue rapidement.
- Les identifiants d’authentification du Gateway prennent en charge les choix texte clair et SecretRef dans la configuration interactive :
  - Mode jeton : **Générer/stocker un jeton en texte clair** (par défaut) ou **Utiliser SecretRef**.
  - Mode mot de passe : texte clair ou SecretRef.
- Chemin SecretRef de jeton non interactif : `--gateway-token-ref-env <ENV_VAR>`.
- Les configurations existantes en texte clair continuent de fonctionner sans changement.

<Note>
Conseil pour les environnements sans interface graphique et serveur : terminez OAuth sur une machine avec un navigateur, puis copiez
le fichier `auth-profiles.json` de cet agent (par exemple
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`, ou le chemin
`$OPENCLAW_STATE_DIR/...` correspondant) vers l’hôte Gateway. `credentials/oauth.json`
est seulement une source d’importation héritée.
</Note>

## Sorties et éléments internes

Champs typiques dans `~/.openclaw/openclaw.json` :

- `agents.defaults.workspace`
- `agents.defaults.skipBootstrap` lorsque `--skip-bootstrap` est transmis
- `agents.defaults.model` / `models.providers` (si Minimax est choisi)
- `tools.profile` (l’intégration locale utilise par défaut `"coding"` lorsque cette valeur n’est pas définie ; les valeurs explicites existantes sont conservées)
- `gateway.*` (mode, bind, auth, tailscale)
- `session.dmScope` (l’intégration locale utilise par défaut `per-channel-peer` lorsque cette valeur n’est pas définie ; les valeurs explicites existantes sont conservées)
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Listes d’autorisation de canaux (Slack, Discord, Matrix, Microsoft Teams) lorsque vous les activez pendant les invites (les noms sont résolus en ID lorsque possible)
- `skills.install.nodeManager`
  - L’option `setup --node-manager` accepte `npm`, `pnpm` ou `bun`.
  - La configuration manuelle peut toujours définir `skills.install.nodeManager: "yarn"` ultérieurement.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` écrit `agents.list[]` et les `bindings` facultatifs.

Les identifiants WhatsApp sont placés sous `~/.openclaw/credentials/whatsapp/<accountId>/`.
Les sessions sont stockées sous `~/.openclaw/agents/<agentId>/sessions/`.

<Note>
Certains canaux sont fournis sous forme de plugins. Lorsqu’ils sont sélectionnés pendant la configuration, l’assistant
vous invite à installer le plugin (npm ou chemin local) avant la configuration du canal.
</Note>

RPC de l’assistant Gateway :

- `wizard.start`
- `wizard.next`
- `wizard.cancel`
- `wizard.status`

Les clients (application macOS et Control UI) peuvent afficher les étapes sans réimplémenter la logique d’intégration.

Comportement de configuration de Signal :

- Télécharge la ressource de version appropriée
- La stocke sous `~/.openclaw/tools/signal-cli/<version>/`
- Écrit `channels.signal.cliPath` dans la configuration
- Les builds JVM nécessitent Java 21
- Les builds natifs sont utilisés lorsqu’ils sont disponibles
- Windows utilise WSL2 et suit le flux Linux de signal-cli dans WSL

## Docs associées

- Hub d’intégration : [Intégration (CLI)](/fr/start/wizard)
- Automatisation et scripts : [Automatisation CLI](/fr/start/wizard-cli-automation)
- Référence des commandes : [`openclaw onboard`](/fr/cli/onboard)
