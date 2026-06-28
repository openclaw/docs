---
read_when:
    - Exécution ou configuration de l’intégration CLI
    - Configurer une nouvelle machine
sidebarTitle: 'Onboarding: CLI'
summary: 'CLI d’intégration : configuration guidée du Gateway, de l’espace de travail, des canaux et des skills'
title: Intégration (CLI)
x-i18n:
    generated_at: "2026-06-28T20:45:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8abf6ac4644e0a49668cbfa1277f6eb3ac5b4fd822cd7805bb647c94ae76895f
    source_path: start/wizard.md
    workflow: 16
---

CLI onboarding est le chemin de configuration terminal **recommandé** pour OpenClaw sur
macOS, Linux ou Windows. Les utilisateurs du bureau Windows peuvent aussi commencer avec
[Windows Hub](/fr/platforms/windows).
Il configure un Gateway local ou une connexion à un Gateway distant, ainsi que les canaux, les Skills
et les valeurs par défaut de l’espace de travail dans un seul flux guidé.

```bash
openclaw onboard
```

QuickStart ne prend généralement que quelques minutes, mais l’onboarding complet peut prendre plus de temps
lorsque la connexion au fournisseur, l’appairage des canaux, l’installation du daemon, les téléchargements réseau,
les Skills ou les plugins optionnels nécessitent une configuration supplémentaire. L’assistant affiche cette chronologie
dès le départ, et les étapes optionnelles peuvent être ignorées puis reprises plus tard avec
`openclaw configure`.

## Paramètres régionaux

L’assistant CLI localise le texte fixe de l’onboarding. Il détermine les paramètres régionaux à partir de
`OPENCLAW_LOCALE`, puis `LC_ALL`, puis `LC_MESSAGES`, puis `LANG`, et se rabat
sur l’anglais. Les paramètres régionaux pris en charge par l’assistant sont `en`, `zh-CN` et `zh-TW`.

```bash
OPENCLAW_LOCALE=zh-CN openclaw onboard
```

Les noms et identifiants stables restent littéraux : `OpenClaw`, `Gateway`, `Tailscale`,
les commandes, les clés de configuration, les URL, les ID de fournisseurs, les ID de modèles et les libellés de plugins/canaux
ne sont pas traduits.

<Info>
Premier chat le plus rapide : ouvrez l’interface Control UI (aucune configuration de canal requise). Exécutez
`openclaw dashboard` et discutez dans le navigateur. Documentation : [Dashboard](/fr/web/dashboard).
</Info>

Pour reconfigurer plus tard :

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json` n’implique pas le mode non interactif. Pour les scripts, utilisez `--non-interactive`.
</Note>

<Tip>
L’onboarding CLI inclut une étape de recherche web où vous pouvez choisir un fournisseur
tel que Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search,
Ollama Web Search, Perplexity, SearXNG ou Tavily. Certains fournisseurs exigent une
clé d’API, tandis que d’autres n’en nécessitent pas. Vous pouvez aussi configurer cela plus tard avec
`openclaw configure --section web`. Documentation : [Outils web](/fr/tools/web).
</Tip>

## QuickStart ou Avancé

L’onboarding commence par **QuickStart** (valeurs par défaut) ou **Avancé** (contrôle complet).

<Tabs>
  <Tab title="QuickStart (valeurs par défaut)">
    - Gateway local (loopback)
    - Espace de travail par défaut (ou espace de travail existant)
    - Port du Gateway **18789**
    - Authentification du Gateway **Token** (généré automatiquement, même en loopback)
    - Politique d’outils par défaut pour les nouvelles configurations locales : `tools.profile: "coding"` (le profil explicite existant est conservé)
    - Valeur par défaut d’isolation des DM : l’onboarding local écrit `session.dmScope: "per-channel-peer"` lorsque non défini. Détails : [Référence de configuration CLI](/fr/start/wizard-cli-reference#outputs-and-internals)
    - Exposition Tailscale **Désactivée**
    - Les DM Telegram + WhatsApp utilisent par défaut la **liste d’autorisation** (votre numéro de téléphone vous sera demandé)

  </Tab>
  <Tab title="Avancé (contrôle complet)">
    - Expose chaque étape (mode, espace de travail, Gateway, canaux, daemon, Skills).

  </Tab>
</Tabs>

## Ce que l’onboarding configure

Le **mode local (par défaut)** vous guide à travers ces étapes :

1. **Modèle/Auth** — choisissez n’importe quel fournisseur/flux d’authentification pris en charge (clé d’API, OAuth ou authentification manuelle propre au fournisseur), y compris Custom Provider
   (compatible OpenAI, compatible Anthropic ou détection automatique Unknown). Choisissez un modèle par défaut.
   Note de sécurité : si cet agent exécutera des outils ou traitera du contenu Webhook/hooks, préférez le modèle de dernière génération le plus puissant disponible et gardez une politique d’outils stricte. Les niveaux plus faibles/anciens sont plus faciles à injecter par prompt.
   Pour les exécutions non interactives, `--secret-input-mode ref` stocke des références adossées à l’environnement dans les profils d’authentification au lieu de valeurs de clé d’API en clair.
   En mode non interactif `ref`, la variable d’environnement du fournisseur doit être définie ; passer des indicateurs de clé en ligne sans cette variable d’environnement échoue immédiatement.
   Dans les exécutions interactives, choisir le mode de référence secrète vous permet de pointer soit vers une variable d’environnement, soit vers une référence de fournisseur configurée (`file` ou `exec`), avec une validation préalable rapide avant l’enregistrement.
   Pour Anthropic, l’onboarding/configuration interactif propose **Anthropic Claude CLI** comme chemin local préféré et **clé d’API Anthropic** comme chemin de production recommandé. Anthropic setup-token reste également disponible comme chemin d’authentification par jeton pris en charge.
2. **Espace de travail** — emplacement des fichiers de l’agent (par défaut `~/.openclaw/workspace`). Initialise les fichiers de démarrage.
3. **Gateway** — port, adresse de liaison, mode d’authentification, exposition Tailscale.
   En mode token interactif, choisissez le stockage du token en clair par défaut ou optez pour SecretRef.
   Chemin SecretRef de token non interactif : `--gateway-token-ref-env <ENV_VAR>`.
4. **Canaux** — canaux de chat intégrés et plugins officiels tels que iMessage, Discord, Feishu, Google Chat, Mattermost, Microsoft Teams, QQ Bot, Signal, Slack, Telegram, WhatsApp, et plus encore.
5. **Daemon** — installe un LaunchAgent (macOS), une unité utilisateur systemd (Linux/WSL2) ou une tâche planifiée Windows native avec solution de repli par dossier de démarrage propre à l’utilisateur.
   Si l’authentification par token exige un token et que `gateway.auth.token` est géré par SecretRef, l’installation du daemon le valide mais ne persiste pas le token résolu dans les métadonnées d’environnement du service superviseur.
   Si l’authentification par token exige un token et que la SecretRef de token configurée n’est pas résolue, l’installation du daemon est bloquée avec des instructions exploitables.
   Si `gateway.auth.token` et `gateway.auth.password` sont tous deux configurés et que `gateway.auth.mode` n’est pas défini, l’installation du daemon est bloquée jusqu’à ce que le mode soit défini explicitement.
6. **Vérification de santé** — démarre le Gateway et vérifie qu’il fonctionne.
7. **Skills** — installe les Skills recommandées et les dépendances optionnelles.

<Note>
Relancer l’onboarding n’efface **rien**, sauf si vous choisissez explicitement **Réinitialiser** (ou passez `--reset`).
CLI `--reset` cible par défaut la configuration, les identifiants et les sessions ; utilisez `--reset-scope full` pour inclure l’espace de travail.
Si la configuration est invalide ou contient des clés héritées, l’onboarding vous demande d’exécuter d’abord `openclaw doctor`.
</Note>

Le **mode distant** configure uniquement le client local pour se connecter à un Gateway ailleurs.
Il n’installe ni ne modifie **rien** sur l’hôte distant.

## Ajouter un autre agent

Utilisez `openclaw agents add <name>` pour créer un agent séparé avec son propre espace de travail,
ses sessions et ses profils d’authentification. L’exécution sans `--workspace` lance l’onboarding.

Ce qu’il définit :

- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

Notes :

- Les espaces de travail par défaut suivent `~/.openclaw/workspace-<agentId>`.
- Ajoutez `bindings` pour router les messages entrants (l’onboarding peut le faire).
- Indicateurs non interactifs : `--model`, `--agent-dir`, `--bind`, `--non-interactive`.

## Référence complète

Pour des explications détaillées étape par étape et les sorties de configuration, consultez
[Référence de configuration CLI](/fr/start/wizard-cli-reference).
Pour des exemples non interactifs, consultez [Automatisation CLI](/fr/start/wizard-cli-automation).
Pour la référence technique plus approfondie, y compris les détails RPC, consultez
[Référence d’onboarding](/fr/reference/wizard).

## Documentation associée

- Référence des commandes CLI : [`openclaw onboard`](/fr/cli/onboard)
- Vue d’ensemble de l’onboarding : [Vue d’ensemble de l’onboarding](/fr/start/onboarding-overview)
- Onboarding de l’application macOS : [Onboarding](/fr/start/onboarding)
- Rituel de premier démarrage de l’agent : [Démarrage de l’agent](/fr/start/bootstrapping)
