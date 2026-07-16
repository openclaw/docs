---
read_when:
    - Vous avez besoin d’informations détaillées sur le comportement d’une étape spécifique de `openclaw onboard`
    - Vous déboguez les résultats de l’intégration ou intégrez des clients d’intégration
sidebarTitle: CLI reference
summary: 'Comportement détaillé d’`openclaw onboard` : rôle de chaque étape, configuration écrite et fonctionnement interne'
title: Référence de configuration de la CLI
x-i18n:
    generated_at: "2026-07-16T13:50:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 96c1469c6b64f08fd9105c8b737df164d39d27d051bbb9bb4f76b9e1e057785d
    source_path: start/wizard-cli-reference.md
    workflow: 16
---

Cette page décrit pas à pas le comportement, les résultats et le fonctionnement interne de l’intégration initiale.
Pour un guide détaillé, consultez [Intégration initiale (CLI)](/fr/start/wizard). Pour la référence complète des options de la CLI
(toutes les `--flag`, les exemples non interactifs et les commandes propres
aux fournisseurs), consultez [`openclaw onboard`](/fr/cli/onboard).

## Fonctionnement de l’assistant

Le mode local (par défaut) vous guide dans les étapes suivantes :

- Configuration du modèle et de l’authentification (Anthropic, OAuth de l’abonnement OpenAI Code, xAI, OpenCode, points de terminaison personnalisés et autres flux d’authentification gérés par les fournisseurs)
- Emplacement de l’espace de travail et fichiers d’amorçage
- Paramètres du Gateway (port, liaison, authentification, Tailscale)
- Canaux et fournisseurs (Discord, Feishu, Google Chat, iMessage, Mattermost, Microsoft Teams, QQ Bot, Signal, Slack, Telegram, WhatsApp et autres canaux intégrés ou fournis par des plugins)
- Fournisseur de recherche Web (facultatif)
- Installation du démon (LaunchAgent, unité utilisateur systemd ou tâche planifiée Windows native avec repli sur le dossier de démarrage)
- Vérification de l’état de santé
- Configuration des Skills

Le mode distant configure cette machine pour qu’elle se connecte à un Gateway situé ailleurs. Il
n’installe ni ne modifie rien sur l’hôte distant.

## Détails du flux local

<Steps>
  <Step title="Détection de la configuration existante">
    - Si `~/.openclaw/openclaw.json` existe, choisissez **Conserver les valeurs actuelles**, **Examiner et mettre à jour** ou **Réinitialiser avant la configuration**.
    - Relancer l’assistant n’efface rien, sauf si vous choisissez explicitement Réinitialiser (ou transmettez `--reset`).
    - L’option `--reset` de la CLI utilise `config+creds+sessions` par défaut ; utilisez `--reset-scope full` pour supprimer également l’espace de travail.
    - Si la configuration est invalide ou contient d’anciennes clés, l’assistant s’arrête et vous demande d’exécuter `openclaw doctor` avant de continuer.
    - La réinitialisation déplace l’état vers la corbeille (sans jamais le supprimer directement) et propose les étendues suivantes :
      - Configuration uniquement
      - Configuration + identifiants + sessions
      - Réinitialisation complète (supprime également l’espace de travail)

  </Step>
  <Step title="Modèle et authentification">
    - La matrice complète des options figure dans [Options d’authentification et de modèle](#auth-and-model-options).

  </Step>
  <Step title="Espace de travail">
    - Valeur par défaut : `~/.openclaw/workspace` (configurable).
    - Crée les fichiers de l’espace de travail nécessaires à l’amorçage lors de la première exécution.
    - Organisation de l’espace de travail : [Espace de travail de l’agent](/fr/concepts/agent-workspace).

  </Step>
  <Step title="Gateway">
    - Demande le port, la liaison, le mode d’authentification et l’exposition via Tailscale.
    - Recommandation : laissez l’authentification par jeton activée même pour l’interface de bouclage, afin que les clients WS locaux soient obligés de s’authentifier.
    - En mode jeton, la configuration interactive propose :
      - **Générer/stocker un jeton en texte clair** (par défaut)
      - **Utiliser SecretRef** (facultatif)
    - En mode mot de passe, la configuration interactive permet également le stockage en texte clair ou via SecretRef.
    - Chemin SecretRef non interactif pour le jeton : `--gateway-token-ref-env <ENV_VAR>`.
      - Nécessite une variable d’environnement non vide dans l’environnement du processus d’intégration initiale.
      - Ne peut pas être combiné avec `--gateway-token`.
    - Désactivez l’authentification uniquement si vous faites entièrement confiance à tous les processus locaux.
    - Les liaisons hors interface de bouclage nécessitent toujours une authentification.

  </Step>
  <Step title="Canaux">
    - [WhatsApp](/fr/channels/whatsapp) : connexion facultative par code QR
    - [Telegram](/fr/channels/telegram) : jeton de bot
    - [Discord](/fr/channels/discord) : jeton de bot
    - [Google Chat](/fr/channels/googlechat) : JSON du compte de service + audience du Webhook
    - [Mattermost](/fr/channels/mattermost) : jeton de bot + URL de base
    - [Signal](/fr/channels/signal) : installation facultative de `signal-cli` + configuration du compte
    - [iMessage](/fr/channels/imessage) : chemin de la CLI `imsg` + accès à la base de données Messages ; utilisez un wrapper SSH lorsque le Gateway s’exécute ailleurs que sur un Mac
    - Sécurité des messages privés : l’association est le comportement par défaut. Le premier message privé envoie un code ; approuvez-le avec
      `openclaw pairing approve <channel> <code>` ou utilisez des listes d’autorisation.
  </Step>
  <Step title="Recherche Web">
    - Choisissez un fournisseur (Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG, Tavily) ou ignorez cette étape.
    - Ignorez cette étape avec `--skip-search` ; reconfigurez-la ultérieurement avec `openclaw configure --section web`.

  </Step>
  <Step title="Installation du démon">
    - macOS : LaunchAgent
      - Nécessite une session utilisateur ouverte ; pour une utilisation sans interface, utilisez un LaunchDaemon personnalisé (non fourni).
    - Linux et Windows via WSL2 : unité utilisateur systemd
      - L’assistant tente d’exécuter `loginctl enable-linger <user>` afin que le Gateway reste actif après la déconnexion.
      - Peut demander sudo (écrit dans `/var/lib/systemd/linger`) ; l’assistant essaie d’abord sans sudo.
    - Windows natif : tâche planifiée en premier
      - Si la création de la tâche est refusée, OpenClaw se rabat sur un élément de connexion par utilisateur dans le dossier de démarrage et démarre immédiatement le Gateway.
      - Les tâches planifiées restent préférables, car elles offrent un meilleur état de supervision.
    - Sélection de l’environnement d’exécution : Node est requis, car le stockage d’état canonique de l’environnement d’exécution d’OpenClaw utilise `node:sqlite`.

  </Step>
  <Step title="Vérification de l’état de santé">
    - Démarre le Gateway (si nécessaire) et exécute `openclaw health`.
    - `openclaw status --deep` ajoute la sonde d’état de santé du Gateway actif à la sortie d’état, y compris les sondes de canaux lorsqu’elles sont prises en charge.

  </Step>
  <Step title="Skills">
    - Lit les Skills disponibles et vérifie les prérequis.
    - Vous permet de choisir le gestionnaire Node : npm, pnpm ou bun.
    - Installe les dépendances facultatives des Skills intégrées et approuvées lorsque le programme
      d’installation requis est disponible.
    - Ignore les programmes d’installation Homebrew, uv et Go indisponibles, puis regroupe les Skills concernées
      avec des instructions de configuration manuelle. Exécutez `openclaw doctor` après avoir installé
      les prérequis manquants.

  </Step>
  <Step title="Fin">
    - Résumé et étapes suivantes, notamment les options d’applications iOS, Android et macOS.

  </Step>
</Steps>

<Note>
Si aucune interface graphique n’est détectée, l’assistant affiche des instructions de redirection de port SSH pour l’interface de contrôle au lieu d’ouvrir un navigateur.
Si les ressources de l’interface de contrôle sont absentes, l’assistant tente de les compiler ; la solution de repli est `pnpm ui:build` (installe automatiquement les dépendances de l’interface).
</Note>

## Détails du mode distant

Le mode distant configure cette machine pour qu’elle se connecte à un Gateway situé ailleurs. Il
n’installe ni ne modifie rien sur l’hôte distant.

Paramètres à définir :

- URL du Gateway distant (`ws://...` ou `wss://...`)
- Jeton, mot de passe ou aucune authentification, conformément à la configuration du Gateway distant

<Steps>
  <Step title="Découverte (facultative)">
    Si `dns-sd` (macOS) ou `avahi-browse` (Linux) est disponible, l’intégration initiale
    propose de rechercher des balises de Gateway Bonjour/mDNS avant de revenir à
    la saisie manuelle de l’URL. La découverte DNS-SD étendue est également tentée lorsqu’elle est
    configurée. Documentation : [Découverte du Gateway](/fr/gateway/discovery), [Bonjour](/fr/gateway/bonjour).
  </Step>
  <Step title="Méthode de connexion">
    Lorsqu’une balise est sélectionnée, choisissez une connexion WebSocket directe ou un tunnel SSH :
    - **Directe** : se connecte via `wss://` et demande d’approuver l’empreinte
      TLS découverte (épinglage lors de la première utilisation ; épinglée uniquement si vous l’acceptez).
    - **Tunnel SSH** : affiche une commande `ssh -N -L 18789:127.0.0.1:18789 <user>@<host>`
      à exécuter d’abord, puis se connecte au point de terminaison du tunnel local.
  </Step>
  <Step title="Authentification">
    Choisissez un jeton (recommandé), un mot de passe ou aucune authentification, puis stockez-le éventuellement
    sous forme de SecretRef plutôt qu’en texte clair.
  </Step>
</Steps>

<Note>
Si le Gateway est limité à l’interface de bouclage et n’est pas détectable, utilisez manuellement un tunnel SSH ou un réseau Tailscale.
Le protocole `ws://` en texte clair est accepté pour l’interface de bouclage, les littéraux d’adresses IP privées, `.local` et les URL `*.ts.net` du réseau Tailscale ; les autres noms DNS privés nécessitent `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`.
</Note>

## Options d’authentification et de modèle

Si une étape de configuration du fournisseur échoue pendant l’intégration initiale interactive (par exemple, une option de réutilisation de la CLI
sans connexion locale), l’assistant affiche l’erreur et revient au sélecteur de fournisseur
au lieu de quitter. Les exécutions explicites de `--auth-choice` échouent toujours immédiatement pour l’automatisation.

<AccordionGroup>
  <Accordion title="Clé d’API Anthropic">
    Utilise `ANTHROPIC_API_KEY` si elle est présente ou demande une clé, puis l’enregistre pour son utilisation par le démon.
  </Accordion>
  <Accordion title="CLI Anthropic Claude">
    Chemin local privilégié dans l’intégration initiale ou la configuration interactive ; réutilise une connexion existante à la CLI Claude lorsqu’elle est disponible.
  </Accordion>
  <Accordion title="Abonnement OpenAI Code (OAuth)">
    Flux dans le navigateur ; collez `code#state`.

    Lors d’une nouvelle configuration sans modèle principal, définit `agents.defaults.model` sur
    `openai/gpt-5.6-sol` via l’environnement d’exécution Codex.

  </Accordion>
  <Accordion title="Abonnement OpenAI Code (association d’appareil)">
    Flux d’association dans le navigateur avec un code d’appareil de courte durée.

    Lors d’une nouvelle configuration sans modèle principal, définit `agents.defaults.model` sur
    `openai/gpt-5.6-sol` via l’environnement d’exécution Codex.

  </Accordion>
  <Accordion title="Clé d’API OpenAI">
    Utilise `OPENAI_API_KEY` si elle est présente ou demande une clé, puis stocke l’identifiant dans les profils d’authentification.

    Lors d’une nouvelle configuration sans modèle principal, définit `agents.defaults.model` sur
    `openai/gpt-5.6` ; l’identifiant de modèle brut de l’API directe est résolu vers le niveau Sol.

    L’ajout ou la réauthentification d’OpenAI préserve un modèle principal explicite existant,
    y compris `openai/gpt-5.5`. Si le compte ne donne pas accès à GPT-5.6,
    sélectionnez explicitement `openai/gpt-5.5` ; OpenClaw ne le rétrograde pas silencieusement.

  </Accordion>
  <Accordion title="OAuth xAI (Grok)">
    Connexion par navigateur pour les comptes SuperGrok ou X Premium admissibles. Il s’agit de la
    méthode xAI recommandée pour la plupart des utilisateurs. OpenClaw stocke le profil
    d’authentification obtenu pour les modèles Grok, Grok `web_search`, `x_search` et `code_execution`.
  </Accordion>
  <Accordion title="Code d’appareil xAI (Grok)">
    Connexion par navigateur adaptée aux environnements distants, avec un code court au lieu d’un
    rappel localhost. Utilisez cette méthode depuis des hôtes SSH, Docker ou VPS.
  </Accordion>
  <Accordion title="Clé API xAI (Grok)">
    Demande `XAI_API_KEY` et configure xAI comme fournisseur de modèles. Utilisez cette
    méthode si vous souhaitez une clé API de la console xAI plutôt que l’OAuth d’un abonnement.
  </Accordion>
  <Accordion title="OpenCode">
    Demande `OPENCODE_API_KEY` (ou `OPENCODE_ZEN_API_KEY`) et vous permet de choisir le catalogue Zen ou Go (une seule clé API couvre les deux).
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
    Demande l’identifiant du compte, l’identifiant du Gateway et `CLOUDFLARE_AI_GATEWAY_API_KEY`.
    Plus de détails : [Cloudflare AI Gateway](/fr/providers/cloudflare-ai-gateway).
  </Accordion>
  <Accordion title="MiniMax">
    La configuration est écrite automatiquement. La valeur hébergée par défaut est `MiniMax-M3` ; la configuration par clé API utilise
    `minimax/...` et la configuration OAuth utilise `minimax-portal/...`.
    Plus de détails : [MiniMax](/fr/providers/minimax).
  </Accordion>
  <Accordion title="StepFun">
    La configuration est écrite automatiquement pour StepFun standard ou Step Plan sur les points de terminaison chinois ou mondiaux.
    La version standard inclut actuellement `step-3.5-flash`, et Step Plan inclut également `step-3.5-flash-2603`.
    Plus de détails : [StepFun](/fr/providers/stepfun).
  </Accordion>
  <Accordion title="Synthetic (compatible avec Anthropic)">
    Demande `SYNTHETIC_API_KEY`.
    Plus de détails : [Synthetic](/fr/providers/synthetic).
  </Accordion>
  <Accordion title="Ollama (modèles ouverts cloud et locaux)">
    Demande d’abord `Cloud + Local`, `Cloud only` ou `Local only`.
    `Cloud only` utilise `OLLAMA_API_KEY` avec `https://ollama.com`.
    Les modes reposant sur un hôte demandent l’URL de base (par défaut `http://127.0.0.1:11434`), détectent les modèles disponibles et suggèrent des valeurs par défaut.
    `Cloud + Local` vérifie également si cet hôte Ollama est connecté pour l’accès au cloud.
    Plus de détails : [Ollama](/fr/providers/ollama).
  </Accordion>
  <Accordion title="Moonshot et Kimi Coding">
    Les configurations Moonshot (Kimi K2) et Kimi Coding sont écrites automatiquement.
    Plus de détails : [Moonshot AI (Kimi + Kimi Coding)](/fr/providers/moonshot).
  </Accordion>
  <Accordion title="Fournisseur personnalisé">
    Fonctionne avec les points de terminaison compatibles avec OpenAI, OpenAI Responses et Anthropic.

    L’intégration interactive prend en charge les mêmes choix de stockage de clé API que les autres flux de clé API des fournisseurs :
    - **Coller la clé API maintenant** (texte brut)
    - **Utiliser une référence de secret** (référence d’environnement ou référence de fournisseur configuré, avec validation préalable)

    L’intégration déduit la prise en charge des images pour les identifiants courants de modèles de vision (GPT-4o/4.1/5.x, Claude 3/4, Gemini, Qwen-VL, LLaVA, Pixtral et similaires) et ne pose la question que lorsque le nom du modèle est inconnu.

    Options non interactives :
    - `--auth-choice custom-api-key`
    - `--custom-base-url`
    - `--custom-model-id`
    - `--custom-api-key` (facultatif ; utilise `CUSTOM_API_KEY` comme solution de repli)
    - `--custom-provider-id` (facultatif)
    - `--custom-compatibility <openai|openai-responses|anthropic>` (facultatif ; valeur par défaut : `openai`)
    - `--custom-image-input` / `--custom-text-input` (facultatif ; remplace la capacité d’entrée du modèle déduite)

  </Accordion>
  <Accordion title="Ignorer">
    Laisse l’authentification non configurée.
  </Accordion>
</AccordionGroup>

Comportement des modèles :

- Choisissez le modèle par défaut parmi les options détectées, ou saisissez manuellement le fournisseur et le modèle.
- Lorsque l’intégration commence par le choix de l’authentification d’un fournisseur, le sélecteur de modèles privilégie
  automatiquement ce fournisseur. Pour Volcengine et BytePlus, cette préférence
  correspond également à leurs variantes de forfait de codage (`volcengine-plan/*`,
  `byteplus-plan/*`).
- Si ce filtre de fournisseur privilégié ne renvoie aucun résultat, le sélecteur utilise
  le catalogue complet au lieu de n’afficher aucun modèle.
- L’assistant vérifie le modèle et affiche un avertissement si le modèle configuré est inconnu ou si son authentification est absente.

Chemins des identifiants et des profils :

- Profils d’authentification (clés API + OAuth) : `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Importation OAuth héritée : `~/.openclaw/credentials/oauth.json`

Mode de stockage des identifiants :

- Par défaut, l’intégration conserve les clés API sous forme de valeurs en texte brut dans les profils d’authentification.
- `--secret-input-mode ref` active le mode référence au lieu du stockage de la clé en texte brut.
  Dans la configuration interactive, vous pouvez choisir :
  - une référence de variable d’environnement (par exemple `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`)
  - une référence de fournisseur configuré (`file` ou `exec`) avec l’alias et l’identifiant du fournisseur
- Le mode référence interactif effectue une validation préalable rapide avant l’enregistrement.
  - Références d’environnement : valide le nom de la variable et vérifie que sa valeur n’est pas vide dans l’environnement d’intégration actuel.
  - Références de fournisseur : valide la configuration du fournisseur et résout l’identifiant demandé.
  - Si la validation préalable échoue, l’intégration affiche l’erreur et vous permet de réessayer.
- En mode non interactif, `--secret-input-mode ref` repose uniquement sur l’environnement.
  - Définissez la variable d’environnement du fournisseur dans l’environnement du processus d’intégration.
  - Les options de clé intégrée (par exemple `--openai-api-key`) exigent que cette variable d’environnement soit définie ; sinon, l’intégration échoue immédiatement.
  - Pour les fournisseurs personnalisés, le mode non interactif `ref` stocke `models.providers.<id>.apiKey` sous la forme `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`.
  - Dans ce cas de fournisseur personnalisé, `--custom-api-key` exige que `CUSTOM_API_KEY` soit défini ; sinon, l’intégration échoue immédiatement.
- Les identifiants d’authentification du Gateway prennent en charge le texte brut et les références SecretRef dans la configuration interactive :
  - Mode jeton : **Générer/stocker un jeton en texte brut** (par défaut) ou **Utiliser SecretRef**.
  - Mode mot de passe : texte brut ou SecretRef.
- Chemin SecretRef du jeton en mode non interactif : `--gateway-token-ref-env <ENV_VAR>`.
- Les configurations existantes en texte brut continuent de fonctionner sans modification.

<Note>
Conseil pour les environnements sans interface graphique et les serveurs : effectuez l’OAuth sur une machine équipée d’un navigateur, puis copiez
le fichier `auth-profiles.json` de cet agent (par exemple
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`, ou le chemin
`$OPENCLAW_STATE_DIR/...` correspondant) vers l’hôte du Gateway. `credentials/oauth.json`
est uniquement une source d’importation héritée.
</Note>

## Sorties et fonctionnement interne

Champs habituels dans `~/.openclaw/openclaw.json` :

- `agents.defaults.workspace`
- `agents.defaults.skipBootstrap` lorsque `--skip-bootstrap` est transmis
- `agents.defaults.model` / `models.providers` (si Minimax est sélectionné)
- `tools.profile` (l’intégration locale utilise par défaut `"coding"` si aucune valeur n’est définie ; les valeurs explicites existantes sont conservées)
- `gateway.*` (mode, liaison, authentification, Tailscale)
- `session.dmScope` (l’intégration locale utilise par défaut `per-channel-peer` si aucune valeur n’est définie ; les valeurs explicites existantes sont conservées)
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Listes d’autorisation des canaux (Discord, iMessage, Signal, Slack, Telegram, WhatsApp) lorsque vous les activez pendant les invites ; Discord et Slack résolvent également les noms saisis en identifiants
- `skills.install.nodeManager`
  - L’option `setup --node-manager` accepte `npm`, `pnpm` ou `bun`.
  - La configuration manuelle peut toujours définir `skills.install.nodeManager: "yarn"` ultérieurement.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`
- `wizard.securityAcknowledgedAt`

`openclaw agents add` écrit `agents.list[]` et, facultativement, `bindings`.

Les identifiants WhatsApp sont placés sous `~/.openclaw/credentials/whatsapp/<accountId>/`.
Les sessions actives et les transcriptions sont stockées dans
`~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`. Le répertoire
`~/.openclaw/agents/<agentId>/sessions/` est utilisé pour les entrées de migration
héritées et les artefacts d’archivage ou d’assistance.

<Note>
Certains canaux sont distribués sous forme de plugins. Lorsqu’un canal est sélectionné pendant la configuration, l’assistant
propose d’installer le plugin (npm ou chemin local) avant de configurer le canal.
</Note>

## Configuration non interactive

`--non-interactive` exige `--accept-risk` (confirme que les agents sont
puissants et qu’un accès complet au système présente des risques) :

```bash
openclaw onboard --non-interactive --accept-risk \
  --auth-choice apiKey \
  --anthropic-api-key "$ANTHROPIC_API_KEY"
```

Référence complète des options et exemples propres aux fournisseurs : [`openclaw onboard`](/fr/cli/onboard), [Automatisation de la CLI](/fr/start/wizard-cli-automation).

## RPC de l’assistant du Gateway

- `wizard.start`
- `wizard.next`
- `wizard.cancel`
- `wizard.status`

Les clients (application macOS et interface de contrôle) peuvent afficher les étapes sans réimplémenter la logique d’intégration.

## Comportement de la configuration de Signal

- Télécharge l’artefact de version approprié depuis les versions GitHub officielles de `signal-cli` (compilation native, Linux x86-64 uniquement)
- Sur les autres plateformes (macOS, Linux non-x64), effectue plutôt l’installation via Homebrew
- Stocke l’installation de l’artefact de version sous `~/.openclaw/tools/signal-cli/<version>/`
- Écrit `channels.signal.cliPath` dans la configuration
- Windows natif n’est pas encore pris en charge ; exécutez l’intégration dans WSL2 pour obtenir le chemin d’installation Linux

## Documentation associée

- Centre d’intégration : [Intégration (CLI)](/fr/start/wizard)
- Automatisation et scripts : [Automatisation de la CLI](/fr/start/wizard-cli-automation)
- Référence de la commande : [`openclaw onboard`](/fr/cli/onboard)
