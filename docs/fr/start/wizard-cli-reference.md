---
read_when:
    - Vous avez besoin du comportement détaillé pour openclaw onboard
    - Vous déboguez les résultats d’intégration ou intégrez des clients d’intégration
sidebarTitle: CLI reference
summary: Référence complète du flux de configuration de la CLI, de la configuration de l’authentification/du modèle, des sorties et des éléments internes
title: Référence de configuration de la CLI
x-i18n:
    generated_at: "2026-06-30T22:15:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9be3e95a300707eade19f5c7fdf6f3a330ffe7e1e83866b36fb9bd1f742256ef
    source_path: start/wizard-cli-reference.md
    workflow: 16
---

Cette page est la référence complète pour `openclaw onboard`.
Pour le guide court, consultez [Onboarding (CLI)](/fr/start/wizard).

## Ce que fait l’assistant

Le mode local (par défaut) vous guide dans :

- La configuration du modèle et de l’authentification (OAuth d’abonnement OpenAI Code, CLI Anthropic Claude ou clé d’API, ainsi que les options MiniMax, GLM, Ollama, Moonshot, StepFun et AI Gateway)
- L’emplacement de l’espace de travail et les fichiers d’amorçage
- Les paramètres du Gateway (port, liaison, authentification, Tailscale)
- Les canaux et fournisseurs (Telegram, WhatsApp, Discord, Google Chat, Mattermost, Signal, iMessage et autres Plugins de canal groupés)
- L’installation du démon (LaunchAgent, unité utilisateur systemd ou tâche planifiée Windows native avec repli sur le dossier de démarrage)
- La vérification d’état
- La configuration des Skills

Le mode distant configure cette machine pour se connecter à un Gateway situé ailleurs.
Il n’installe ni ne modifie rien sur l’hôte distant.

## Détails du flux local

<Steps>
  <Step title="Détection de configuration existante">
    - Si `~/.openclaw/openclaw.json` existe, choisissez Conserver, Modifier ou Réinitialiser.
    - Relancer l’assistant n’efface rien sauf si vous choisissez explicitement Réinitialiser (ou passez `--reset`).
    - CLI `--reset` utilise par défaut `config+creds+sessions` ; utilisez `--reset-scope full` pour supprimer aussi l’espace de travail.
    - Si la configuration est invalide ou contient des clés héritées, l’assistant s’arrête et vous demande d’exécuter `openclaw doctor` avant de continuer.
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
    - Ajoute les fichiers d’espace de travail nécessaires au rituel d’amorçage de premier lancement.
    - Disposition de l’espace de travail : [Espace de travail de l’agent](/fr/concepts/agent-workspace).

  </Step>
  <Step title="Gateway">
    - Demande le port, la liaison, le mode d’authentification et l’exposition Tailscale.
    - Recommandé : gardez l’authentification par jeton activée même pour le loopback afin que les clients WS locaux doivent s’authentifier.
    - En mode jeton, la configuration interactive propose :
      - **Générer/stocker un jeton en texte brut** (par défaut)
      - **Utiliser SecretRef** (optionnel)
    - En mode mot de passe, la configuration interactive prend également en charge le stockage en texte brut ou SecretRef.
    - Chemin SecretRef de jeton non interactif : `--gateway-token-ref-env <ENV_VAR>`.
      - Nécessite une variable d’environnement non vide dans l’environnement du processus d’onboarding.
      - Ne peut pas être combiné avec `--gateway-token`.
    - Désactivez l’authentification uniquement si vous faites entièrement confiance à chaque processus local.
    - Les liaisons hors loopback exigent toujours une authentification.

  </Step>
  <Step title="Canaux">
    - [WhatsApp](/fr/channels/whatsapp) : connexion QR facultative
    - [Telegram](/fr/channels/telegram) : jeton de bot
    - [Discord](/fr/channels/discord) : jeton de bot
    - [Google Chat](/fr/channels/googlechat) : JSON de compte de service + audience du Webhook
    - [Mattermost](/fr/channels/mattermost) : jeton de bot + URL de base
    - [Signal](/fr/channels/signal) : installation facultative de `signal-cli` + configuration du compte
    - [iMessage](/fr/channels/imessage) : chemin CLI `imsg` + accès à la base de données Messages ; utilisez un wrapper SSH lorsque le Gateway s’exécute hors Mac
    - Sécurité des DM : l’appairage est le comportement par défaut. Le premier DM envoie un code ; approuvez via
      `openclaw pairing approve <channel> <code>` ou utilisez des listes d’autorisation.
  </Step>
  <Step title="Installation du démon">
    - macOS : LaunchAgent
      - Nécessite une session utilisateur ouverte ; pour un fonctionnement sans interface, utilisez un LaunchDaemon personnalisé (non fourni).
    - Linux et Windows via WSL2 : unité utilisateur systemd
      - L’assistant tente `loginctl enable-linger <user>` afin que le Gateway reste actif après la déconnexion.
      - Peut demander sudo (écrit `/var/lib/systemd/linger`) ; il essaie d’abord sans sudo.
    - Windows natif : tâche planifiée d’abord
      - Si la création de la tâche est refusée, OpenClaw se replie sur un élément de connexion par utilisateur dans le dossier de démarrage et démarre immédiatement le Gateway.
      - Les tâches planifiées restent préférées, car elles fournissent un meilleur état de supervision.
    - Sélection du runtime : Node (recommandé ; requis pour WhatsApp et Telegram). Bun n’est pas recommandé.

  </Step>
  <Step title="Vérification d’état">
    - Démarre le Gateway (si nécessaire) et exécute `openclaw health`.
    - `openclaw status --deep` ajoute la sonde d’état du Gateway en direct à la sortie d’état, y compris les sondes de canal lorsqu’elles sont prises en charge.

  </Step>
  <Step title="Skills">
    - Lit les Skills disponibles et vérifie les exigences.
    - Vous permet de choisir le gestionnaire Node : npm, pnpm ou bun.
    - Installe les dépendances facultatives (certaines utilisent Homebrew sur macOS).

  </Step>
  <Step title="Fin">
    - Résumé et prochaines étapes, y compris les options d’app iOS, Android et macOS.

  </Step>
</Steps>

<Note>
Si aucune interface graphique n’est détectée, l’assistant affiche des instructions de redirection de port SSH pour la Control UI au lieu d’ouvrir un navigateur.
Si les ressources de la Control UI sont manquantes, l’assistant tente de les compiler ; le repli est `pnpm ui:build` (installe automatiquement les dépendances de l’interface).
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
- Si le Gateway est uniquement en loopback, utilisez un tunnel SSH ou un tailnet.
- Indices de découverte :
  - macOS : Bonjour (`dns-sd`)
  - Linux : Avahi (`avahi-browse`)

</Note>

## Options d’authentification et de modèle

<AccordionGroup>
  <Accordion title="Clé d’API Anthropic">
    Utilise `ANTHROPIC_API_KEY` si elle est présente ou demande une clé, puis l’enregistre pour l’utilisation par le démon.
  </Accordion>
  <Accordion title="Abonnement OpenAI Code (OAuth)">
    Flux navigateur ; collez `code#state`.

    Définit `agents.defaults.model` sur `openai/gpt-5.5` via le runtime Codex lorsque le modèle n’est pas défini ou appartient déjà à la famille OpenAI.

  </Accordion>
  <Accordion title="Abonnement OpenAI Code (appairage d’appareil)">
    Flux d’appairage navigateur avec un code d’appareil de courte durée.

    Définit `agents.defaults.model` sur `openai/gpt-5.5` via le runtime Codex lorsque le modèle n’est pas défini ou appartient déjà à la famille OpenAI.

  </Accordion>
  <Accordion title="Clé d’API OpenAI">
    Utilise `OPENAI_API_KEY` si elle est présente ou demande une clé, puis stocke l’identifiant dans les profils d’authentification.

    Définit `agents.defaults.model` sur `openai/gpt-5.5` lorsque le modèle n’est pas défini, correspond à `openai/*` ou à des références de modèles Codex héritées.

  </Accordion>
  <Accordion title="OAuth xAI (Grok)">
    Connexion navigateur pour les comptes SuperGrok ou X Premium éligibles. C’est le
    chemin xAI recommandé pour la plupart des utilisateurs. OpenClaw stocke le profil
    d’authentification résultant pour les modèles Grok, Grok `web_search`, `x_search` et `code_execution`.
  </Accordion>
  <Accordion title="Code d’appareil xAI (Grok)">
    Connexion navigateur adaptée au distant avec un code court au lieu d’un rappel
    localhost. Utilisez ceci depuis SSH, Docker ou des hôtes VPS.
  </Accordion>
  <Accordion title="Clé d’API xAI (Grok)">
    Demande `XAI_API_KEY` et configure xAI comme fournisseur de modèles. Utilisez ceci
    lorsque vous voulez une clé d’API xAI Console au lieu d’un OAuth d’abonnement.
  </Accordion>
  <Accordion title="OpenCode">
    Demande `OPENCODE_API_KEY` (ou `OPENCODE_ZEN_API_KEY`) et vous permet de choisir le catalogue Zen ou Go.
    URL de configuration : [opencode.ai/auth](https://opencode.ai/auth).
  </Accordion>
  <Accordion title="Clé d’API (générique)">
    Stocke la clé pour vous.
  </Accordion>
  <Accordion title="Vercel AI Gateway">
    Demande `AI_GATEWAY_API_KEY`.
    Plus de détails : [Vercel AI Gateway](/fr/providers/vercel-ai-gateway).
  </Accordion>
  <Accordion title="Cloudflare AI Gateway">
    Demande l’ID de compte, l’ID du Gateway et `CLOUDFLARE_AI_GATEWAY_API_KEY`.
    Plus de détails : [Cloudflare AI Gateway](/fr/providers/cloudflare-ai-gateway).
  </Accordion>
  <Accordion title="MiniMax">
    La configuration est écrite automatiquement. La valeur par défaut hébergée est `MiniMax-M3` ; la configuration par clé d’API utilise
    `minimax/...`, et la configuration OAuth utilise `minimax-portal/...`.
    Plus de détails : [MiniMax](/fr/providers/minimax).
  </Accordion>
  <Accordion title="StepFun">
    La configuration est écrite automatiquement pour StepFun standard ou Step Plan sur les points de terminaison Chine ou globaux.
    Standard inclut actuellement `step-3.5-flash`, et Step Plan inclut aussi `step-3.5-flash-2603`.
    Plus de détails : [StepFun](/fr/providers/stepfun).
  </Accordion>
  <Accordion title="Synthetic (compatible Anthropic)">
    Demande `SYNTHETIC_API_KEY`.
    Plus de détails : [Synthetic](/fr/providers/synthetic).
  </Accordion>
  <Accordion title="Ollama (Cloud et modèles ouverts locaux)">
    Demande d’abord `Cloud + Local`, `Cloud only` ou `Local only`.
    `Cloud only` utilise `OLLAMA_API_KEY` avec `https://ollama.com`.
    Les modes adossés à un hôte demandent l’URL de base (par défaut `http://127.0.0.1:11434`), découvrent les modèles disponibles et suggèrent des valeurs par défaut.
    `Cloud + Local` vérifie aussi si cet hôte Ollama est connecté pour l’accès Cloud.
    Plus de détails : [Ollama](/fr/providers/ollama).
  </Accordion>
  <Accordion title="Moonshot et Kimi Coding">
    Les configurations Moonshot (Kimi K2) et Kimi Coding sont écrites automatiquement.
    Plus de détails : [Moonshot AI (Kimi + Kimi Coding)](/fr/providers/moonshot).
  </Accordion>
  <Accordion title="Fournisseur personnalisé">
    Fonctionne avec les points de terminaison compatibles OpenAI et compatibles Anthropic.

    L’onboarding interactif prend en charge les mêmes choix de stockage de clé d’API que les autres flux de clé d’API fournisseur :
    - **Coller la clé d’API maintenant** (texte brut)
    - **Utiliser une référence secrète** (référence env ou référence de fournisseur configurée, avec validation préalable)

    Indicateurs non interactifs :
    - `--auth-choice custom-api-key`
    - `--custom-base-url`
    - `--custom-model-id`
    - `--custom-api-key` (facultatif ; se replie sur `CUSTOM_API_KEY`)
    - `--custom-provider-id` (facultatif)
    - `--custom-compatibility <openai|openai-responses|anthropic>` (facultatif ; valeur par défaut `openai`)
    - `--custom-image-input` / `--custom-text-input` (facultatif ; remplace la capacité d’entrée de modèle inférée)

  </Accordion>
  <Accordion title="Ignorer">
    Laisse l’authentification non configurée.
  </Accordion>
</AccordionGroup>

Comportement du modèle :

- Choisissez le modèle par défaut parmi les options détectées, ou saisissez manuellement le fournisseur et le modèle.
- L’onboarding de fournisseur personnalisé infère la prise en charge des images pour les ID de modèle courants et ne pose la question que lorsque le nom du modèle est inconnu.
- Lorsque l’onboarding démarre à partir d’un choix d’authentification de fournisseur, le sélecteur de modèle préfère
  automatiquement ce fournisseur. Pour Volcengine et BytePlus, la même préférence
  correspond aussi à leurs variantes de plan de codage (`volcengine-plan/*`,
  `byteplus-plan/*`).
- Si ce filtre de fournisseur préféré était vide, le sélecteur se replie sur
  le catalogue complet au lieu de n’afficher aucun modèle.
- L’assistant exécute une vérification du modèle et avertit si le modèle configuré est inconnu ou si l’authentification est manquante.

Chemins des identifiants et profils :

- Profils d’authentification (clés d’API + OAuth) : `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Import OAuth hérité : `~/.openclaw/credentials/oauth.json`

Mode de stockage des identifiants :

- Le comportement de configuration initiale par défaut conserve les clés d’API sous forme de valeurs en clair dans les profils d’authentification.
- `--secret-input-mode ref` active le mode référence au lieu du stockage de clé en clair.
  Dans la configuration interactive, vous pouvez choisir l’un des deux :
  - référence de variable d’environnement (par exemple `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`)
  - référence de fournisseur configuré (`file` ou `exec`) avec alias du fournisseur + id
- Le mode référence interactif exécute une validation préalable rapide avant l’enregistrement.
  - Réfs env : valide le nom de la variable + une valeur non vide dans l’environnement de configuration initiale actuel.
  - Réfs fournisseur : valide la configuration du fournisseur et résout l’id demandé.
  - Si la validation préalable échoue, la configuration initiale affiche l’erreur et vous permet de réessayer.
- En mode non interactif, `--secret-input-mode ref` s’appuie uniquement sur l’environnement.
  - Définissez la variable d’environnement du fournisseur dans l’environnement de processus de la configuration initiale.
  - Les indicateurs de clé inline (par exemple `--openai-api-key`) exigent que cette variable d’environnement soit définie ; sinon, la configuration initiale échoue rapidement.
  - Pour les fournisseurs personnalisés, le mode non interactif `ref` stocke `models.providers.<id>.apiKey` sous la forme `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`.
  - Dans ce cas de fournisseur personnalisé, `--custom-api-key` exige que `CUSTOM_API_KEY` soit défini ; sinon, la configuration initiale échoue rapidement.
- Les identifiants d’authentification du Gateway prennent en charge les choix en clair et SecretRef dans la configuration interactive :
  - Mode jeton : **Générer/stocker le jeton en clair** (par défaut) ou **Utiliser SecretRef**.
  - Mode mot de passe : en clair ou SecretRef.
- Chemin SecretRef de jeton non interactif : `--gateway-token-ref-env <ENV_VAR>`.
- Les configurations en clair existantes continuent de fonctionner sans changement.

<Note>
Conseil pour les environnements headless et serveur : terminez OAuth sur une machine avec un navigateur, puis copiez
le fichier `auth-profiles.json` de cet agent (par exemple
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`, ou le chemin correspondant
`$OPENCLAW_STATE_DIR/...`) vers l’hôte du gateway. `credentials/oauth.json`
est uniquement une source d’import héritée.
</Note>

## Sorties et éléments internes

Champs typiques dans `~/.openclaw/openclaw.json` :

- `agents.defaults.workspace`
- `agents.defaults.skipBootstrap` lorsque `--skip-bootstrap` est transmis
- `agents.defaults.model` / `models.providers` (si Minimax est choisi)
- `tools.profile` (la configuration initiale locale utilise `"coding"` par défaut lorsque la valeur n’est pas définie ; les valeurs explicites existantes sont préservées)
- `gateway.*` (mode, bind, auth, tailscale)
- `session.dmScope` (la configuration initiale locale utilise `per-channel-peer` par défaut lorsque la valeur n’est pas définie ; les valeurs explicites existantes sont préservées)
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Listes d’autorisation de canaux (Slack, Discord, Matrix, Microsoft Teams) lorsque vous les activez pendant les invites (les noms sont résolus en ID lorsque c’est possible)
- `skills.install.nodeManager`
  - L’indicateur `setup --node-manager` accepte `npm`, `pnpm` ou `bun`.
  - La configuration manuelle peut toujours définir `skills.install.nodeManager: "yarn"` ultérieurement.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`
- `wizard.securityAcknowledgedAt`

`openclaw agents add` écrit `agents.list[]` et les `bindings` facultatifs.

Les identifiants WhatsApp sont placés sous `~/.openclaw/credentials/whatsapp/<accountId>/`.
Les sessions sont stockées sous `~/.openclaw/agents/<agentId>/sessions/`.

<Note>
Certains canaux sont fournis sous forme de plugins. Lorsqu’ils sont sélectionnés pendant la configuration, l’assistant
invite à installer le plugin (npm ou chemin local) avant la configuration du canal.
</Note>

RPC de l’assistant Gateway :

- `wizard.start`
- `wizard.next`
- `wizard.cancel`
- `wizard.status`

Les clients (application macOS et Control UI) peuvent afficher les étapes sans réimplémenter la logique de configuration initiale.

Comportement de configuration de Signal :

- Télécharge l’asset de version approprié
- Le stocke sous `~/.openclaw/tools/signal-cli/<version>/`
- Écrit `channels.signal.cliPath` dans la configuration
- Les builds JVM nécessitent Java 21
- Les builds natifs sont utilisés lorsqu’ils sont disponibles
- Windows utilise WSL2 et suit le flux signal-cli Linux dans WSL

## Documentation associée

- Hub de configuration initiale : [Configuration initiale (CLI)](/fr/start/wizard)
- Automatisation et scripts : [Automatisation CLI](/fr/start/wizard-cli-automation)
- Référence des commandes : [`openclaw onboard`](/fr/cli/onboard)
